// tools/giong-video.mjs — gắn GIỌNG THẬT (myVoice / lõi VoiceStudio) vào một video myDocument.
// Đầu vào: thư mục kết quả đọc (mỗi câu <cảnh>-<câu>.mp3 + loi.json {id:{text, giay, words:[{w,s,e}]}}),
// do công cụ đọc của Claude tạo (đọc từng câu → Whisper nghe lại, giờ từng chữ → sót chữ thì đọc lại).
// Việc của tool này:
//   1. chép *.mp3 vào <video>/giong/
//   2. so giờ từng chữ Whisper với TỪNG CHỮ PHỤ ĐỀ (chữ gạch nối bị Whisper tách đôi, dấu "—" không có tiếng…)
//   3. ghi khối dữ liệu GIONG vào index.html giữa 2 mốc /*GIONG*/ … /*/GIONG*/ (nhúng thẳng để mở file:// vẫn chạy)
// Chạy: node tools/giong-video.mjs <thư mục kết quả đọc> <thư mục video> "<tên giọng>"
import fs from 'fs'; import path from 'path';
const [, , VAO, VID, TEN] = process.argv;
if (!VAO || !VID) { console.error('Dùng: node tools/giong-video.mjs <thư mục đọc> <thư mục video> "<tên giọng>"'); process.exit(2); }
const loi = JSON.parse(fs.readFileSync(path.join(VAO, 'loi.json'), 'utf8'));
const chuan = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]/g, '');
const cau = {}; let lech = 0;
for (const [id, v] of Object.entries(loi).sort()) {
  // chữ phụ đề = tách giống buildCap() trong video: bỏ ** rồi tách theo khoảng trắng
  const chu = v.text.replace(/\*\*/g, '').trim().split(/\s+/);
  const ws = v.words; let j = 0; const bd = [];
  for (const c of chu) {
    const muc = chuan(c);
    if (!muc) { bd.push(bd.length ? bd[bd.length - 1] : (ws[0] ? ws[0].s : 0)); continue; }   // "—" … không có tiếng
    if (j >= ws.length) { bd.push(bd.length ? bd[bd.length - 1] : 0); lech++; continue; }
    const s = ws[j].s; let gop = chuan(ws[j].w); j++;
    while (gop.length < muc.length && j < ws.length && muc.startsWith(gop + chuan(ws[j].w))) { gop += chuan(ws[j].w); j++; }
    if (gop !== muc) lech++;
    bd.push(s);
  }
  if (j !== ws.length) lech++;
  cau[id] = { d: +v.giay.toFixed(2), w: bd.map((x) => +x.toFixed(2)) };
}
const dir = path.join(VID, 'giong'); fs.mkdirSync(dir, { recursive: true });
for (const id of Object.keys(cau)) fs.copyFileSync(path.join(VAO, id + '.mp3'), path.join(dir, id + '.mp3'));
const khoi = JSON.stringify({ ten: TEN || '', thu: 'giong/', cau });
const f = path.join(VID, 'index.html');
const html = fs.readFileSync(f, 'utf8');
const re = /\/\*GIONG\*\/[\s\S]*?\/\*\/GIONG\*\//;
if (!re.test(html)) { console.error('index.html chưa có mốc /*GIONG*/ … /*/GIONG*/'); process.exit(1); }
fs.writeFileSync(f + '.tam', html.replace(re, () => '/*GIONG*/' + khoi + '/*/GIONG*/'));
fs.renameSync(f + '.tam', f);
console.log('Đã gắn', Object.keys(cau).length, 'câu ·', (Object.values(cau).reduce((a, c) => a + c.d, 0)).toFixed(1), 'giây tiếng · chữ lệch:', lech);
