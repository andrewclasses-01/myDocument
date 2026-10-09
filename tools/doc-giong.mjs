// Đọc 38 câu thoại video bones-muscles bằng giọng "thầy Andrew · kể chuyện" (lõi VoiceStudio cổng 3900),
// nghe lại bằng Whisper (giờ từng chữ), sót chữ ⇒ đọc lại (seed mới + duration dài hơn), rồi nén MP3 64k.
// cues.json = {sc:[{cues:[[câu, giây]]}]} lấy từ trang video: JSON.stringify({sc:__video.SC.map(s=>({cues:s.cues.map(c=>[c.text.split("**").join(""),c.dur])}))})
// Cần lõi VoiceStudio đang chạy ở cổng 3900 (mở myVoice hoặc VoiceStudio). Đổi GIONG = mã giọng myVoice (myVoice-data\myvoice.json).
// Xong thì chạy tools/giong-video.mjs để chép mp3 + nhúng giờ từng chữ vào video.
// Chạy: node doc-giong.mjs <cues.json> <thư mục ra> [chỉ id, vd 2-3,4-1]
import fs from 'fs'; import path from 'path';
const BASE = 'http://127.0.0.1:3900'; const GIONG = '0670723f';
const [, , fCues, OUT, chi] = process.argv;
fs.mkdirSync(OUT, { recursive: true });
const cues = JSON.parse(fs.readFileSync(fCues, 'utf8'));
const ds = []; cues.sc.forEach((s, i) => s.cues.forEach((c, k) => ds.push({ id: i + '-' + k, text: c[0] })));
const chon = chi ? new Set(chi.split(',')) : null;

async function goi(duong, form, tra) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(form)) {
    if (v instanceof Buffer) fd.append(k, new Blob([v]), 'a.wav'); else if (v !== undefined && v !== '') fd.append(k, String(v));
  }
  const r = await fetch(BASE + duong, { method: 'POST', headers: { 'x-voicestudio-csrf': '1' }, body: fd, signal: AbortSignal.timeout(600000) });
  if (!r.ok) throw new Error(duong + ' ' + r.status + ' ' + (await r.text()).slice(0, 300));
  return tra === 'buf' ? Buffer.from(await r.arrayBuffer()) : r.json();
}
function giayWav(b) {
  let o = 12; let rate = 24000; let kenh = 1; let bit = 16;
  while (o < b.length - 8) {
    const id = b.toString('ascii', o, o + 4); const n = b.readUInt32LE(o + 4);
    if (id === 'fmt ') { kenh = b.readUInt16LE(o + 10); rate = b.readUInt32LE(o + 12); bit = b.readUInt16LE(o + 22); }
    if (id === 'data') return n / (rate * kenh * bit / 8);
    o += 8 + n + (n % 2);
  }
  return 0;
}
const SO = { 'thirty-seven': '37', three: '3', four: '4', one: '1' };
const chuan = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[“”"—–]/g, ' ').replace(/-/g, ' ')
  .replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean).map((w) => SO[w] || w.replace(/'s$/, ''));
function khop(a, b) {   // LCS / số từ cần đọc
  const n = a.length; const m = b.length; const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) d[i][j] = a[i - 1] === b[j - 1] ? d[i - 1][j - 1] + 1 : Math.max(d[i - 1][j], d[i][j - 1]);
  return n ? d[n][m] / n : 1;
}

const ketQua = fs.existsSync(path.join(OUT, 'loi.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'loi.json'), 'utf8')) : {};
for (const [idx, c] of ds.entries()) {
  if (chon && !chon.has(c.id)) continue;
  if (!chon && ketQua[c.id] && ketQua[c.id].khop >= 0.95) continue;
  const soTu = c.text.split(/\s+/).length; let tot = null;
  for (let lan = 0; lan < 4; lan++) {
    const seed = 1000 + idx * 7 + lan * 101 + (chon ? 5000 : 0);
    const duration = lan ? (soTu / 2.4 * (1.15 + 0.15 * lan)).toFixed(2) : '';
    const wav = await goi('/generate', { text: c.text, language: 'English', profile_id: GIONG, speed: 1, seed, duration }, 'buf');
    const nghe = await goi('/v1/audio/transcriptions', { file: wav, language: 'en', response_format: 'verbose_json', 'timestamp_granularities[]': 'word' });
    const k = khop(chuan(c.text), chuan(nghe.text || ''));
    const words = (nghe.words || []).map((w) => ({ w: w.word.trim(), s: +(+w.start).toFixed(2), e: +(+w.end).toFixed(2) }));
    const giay = giayWav(wav);
    console.log(c.id, 'lan', lan, 'khop', k.toFixed(2), giay.toFixed(2) + 's', '|', (nghe.text || '').trim());
    if (!tot || k > tot.k) tot = { k, wav, words, giay, nghe: (nghe.text || '').trim(), seed };
    if (k >= 0.97) break;
  }
  fs.writeFileSync(path.join(OUT, c.id + '.wav'), tot.wav);
  const mp3 = await goi('/stories/encode', { file: tot.wav, format: 'mp3', bitrate: '64k' }, 'buf');
  fs.writeFileSync(path.join(OUT, c.id + '.mp3'), mp3);
  ketQua[c.id] = { text: c.text, giay: +tot.giay.toFixed(3), khop: +tot.k.toFixed(3), nghe: tot.nghe, seed: tot.seed, words: tot.words };
  fs.writeFileSync(path.join(OUT, 'loi.json'), JSON.stringify(ketQua, null, 1));
}
const xau = Object.entries(ketQua).filter(([, v]) => v.khop < 0.97);
console.log('XONG', Object.keys(ketQua).length, 'câu; khớp < 0.97:', xau.map(([k, v]) => k + '=' + v.khop).join(', ') || 'không có');
