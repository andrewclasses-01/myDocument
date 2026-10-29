// "How far can an owl turn its head?" — Tranh chì màu khoa học (colored pencil on one cream sheet).
// Pictures come from the image model (anh/), everything else (paper, pencil arcs, diagram, beads, words) is drawn here.
// All beats hang off spoken words through at() (voices/words.json; estimated at 2.4 words/s when there are no voices yet).
import { clamp, lerp, seg, ss, eio, eo, mulberry, hash } from './lib.js';

const W = 1920, H = 1080;
const INK = '#5a3d2b', OCHRE = '#b8762f', RUST = '#b4532f', OLIVE = '#6f7a3a', BLUE = '#5f7690', PAPER = [243, 234, 214];
const IMG = { open: 'anh/n/s1b.jpg', owl: 'anh/n/s2.jpg', face: 'anh/n/s3a.jpg', side: 'anh/n/s5e.jpg', girl: 'anh/n/s6.jpg' };
// real-motion clips (16 fps frames): which picture they replace, and when they start
const CLIPS = { c1: 'open', c2: 'owl', c4: 'face' };
// subtitles: [text shown, first spoken word of that piece]
const SUBT = {
  v1: [['How far can an owl turn its head?', 'how']],
  v2: [['Much farther than you can.', 'much'], ['About 270 degrees!', 'about']],
  v3: [['Its big eyes are fixed in place.', 'its'], ['They cannot roll around like ours.', 'they']],
  v4: [['So the owl turns its whole head instead.', 'so']],
  v5: [['An owl has 14 neck bones.', 'an'], ['You have only 7.', 'you']],
};
const GAP = { v1: .5, v2: .35, v3: .4, v4: .4, v5: .55 };    // silence before each line
const TAIL = 4.8;                                              // end card after the last word

const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('missing ' + src)); i.src = src; });
const tryJson = async u => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch { return null; } };

// divide a picture by its own paper colour so its background becomes white → multiply onto our sheet leaves no box
function level(img) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  const sample = (x, y) => { const i = (y * c.width + x) * 4; return [p[i], p[i + 1], p[i + 2]]; };
  const cs = [[8, 8], [c.width - 9, 8], [8, c.height - 9], [c.width - 9, c.height - 9]].map(([x, y]) => sample(x, y));
  const bg = [0, 1, 2].map(k => Math.max(...cs.map(s => s[k])));
  const F = Math.min(c.width, c.height) * .14;                     // feather the edges to white
  for (let y = 0, i = 0; y < c.height; y++) for (let x = 0; x < c.width; x++, i += 4) {
    const e = Math.min(x, y, c.width - 1 - x, c.height - 1 - y) / F, f = e >= 1 ? 1 : e * e * (3 - 2 * e);
    for (let k = 0; k < 3; k++) p[i + k] = 255 - (255 - Math.min(255, p[i + k] * 255 / bg[k])) * f;
  }
  g.putImageData(d, 0, 0); return c;
}

function makePaper() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), d = g.createImageData(W, H), p = d.data, R = mulberry(7);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, n = (R() - .5) * 9 + Math.sin(x * .9 + y * .13) * 1.2;
    const dx = (x - W / 2) / W, dy = (y - H / 2) / H, v = 1 - .22 * (dx * dx + dy * dy) * 2.2;
    p[i] = PAPER[0] * v + n; p[i + 1] = PAPER[1] * v + n; p[i + 2] = PAPER[2] * v + n * .9; p[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  g.globalAlpha = .05; g.strokeStyle = '#8a6a40'; g.lineWidth = 1;          // long faint paper fibres
  for (let k = 0; k < 400; k++) { const x = R() * W, y = R() * H, a = R() * Math.PI; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 30, y + Math.sin(a) * 30); g.stroke(); }
  return c;
}

export async function build() {
  const lines = await (await fetch('lines.json')).json();
  const words = await tryJson('voices/words.json'), durs = await tryJson('voices/dur.json');
  // word timings per line (relative to the line start)
  const WT = {};
  for (const l of lines) {
    if (words && words[l.id]) WT[l.id] = words[l.id].map(w => [w[0], w[1], w[2]]);
    else { const ws = l.text.split(/\s+/); WT[l.id] = ws.map((w, i) => [w, .1 + i / 2.4, .1 + (i + .85) / 2.4]); }
  }
  const LEN = id => WT[id][WT[id].length - 1][2] + .2;          // to the end of the last word (the wav has a silent tail)
  const VO = {}; let t = 0;
  for (const l of lines) { t += GAP[l.id] ?? .45; VO[l.id] = t; t += LEN(l.id); }
  const END = t + TAIL;
  const NUM = { seventy: '270', fourteen: '14', seven: '7' };   // the recogniser writes numbers as digits
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const at = (id, w, k = 0, which = 1) => {
    let n = 0; for (const x of WT[id]) if ((norm(x[0]).startsWith(norm(w)) || (NUM[w] && norm(x[0]) === NUM[w])) && n++ === k) return VO[id] + x[which];
    throw new Error(`word ${w} not in ${id}`);
  };
  const atE = (id, w, k = 0) => at(id, w, k, 2), lineEnd = id => VO[id] + LEN(id);

  const pic = {};
  for (const [k, src] of Object.entries(IMG)) { const im = await load(src); await im.decode(); pic[k] = k === 'open' ? im : level(im); }
  const clip = {};                                                  // frames of each real-motion clip, levelled like its picture
  const cj = await tryJson('clip/clip.json') || [];
  for (const c of cj) {
    if (!CLIPS[c.id]) continue;
    const fr = [];
    for (let i = 0; i < c.soKhung; i++) { const im = await load(`clip/${c.id}/k${String(i).padStart(3, '0')}.jpg`); fr.push(CLIPS[c.id] === 'open' ? im : level(im)); }
    clip[CLIPS[c.id]] = fr;
  }
  const paper = makePaper();
  const off = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });

  // ───────── beats (seconds)
  const B = {
    s2: VO.v2 - .35,                      // open → owl on branch
    arc0: at('v2', 'about'), arc1: at('v2', 'degrees') + .45, deg: at('v2', 'seventy'),
    push0: VO.v3 - .2,                     // owl face, push to the eyes
    s3: VO.v3 - .2,
    diag: at('v3', 'they') - .45,          // wipe into the eye diagram
    fixed: at('v3', 'fixed'), roll: at('v3', 'roll'), ours: at('v3', 'ours'),
    s4: VO.v4 - .4,                        // back to the face, the head turns
    s5: VO.v5 - .5,                        // comparison page
    n14: at('v5', 'fourteen'), n7: at('v5', 'seven'),
    s6: lineEnd('v5') + 1.0,                // bookend at dusk
  };
  B.title = B.s6 + .4; B.sign = B.s6 + 1.3;

  // ───────── pencil helpers
  const boil = tt => Math.floor(tt * 24 / 4);                       // jitter changes every 4 frames
  function stroke(g, pts, o = {}, tt = 0) {                         // pencil line, revealed to fraction o.p
    const p = o.p ?? 1; if (p <= 0 || pts.length < 2) return;
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const lim = L[L.length - 1] * clamp(p);
    g.save(); g.strokeStyle = o.c || INK; g.lineCap = g.lineJoin = 'round';
    const passes = o.passes ?? 3, sd = (o.seed ?? 1) * 13 + boil(tt) * .37;
    for (let k = 0; k < passes; k++) {
      g.globalAlpha = (o.a ?? .85) * (k ? .45 : .9); g.lineWidth = (o.w ?? 3) * (k ? .7 : 1);
      g.beginPath();
      for (let i = 0; i < pts.length; i++) {
        let [x, y] = pts[i];
        if (L[i] > lim) { const f = (lim - L[i - 1]) / (L[i] - L[i - 1]); x = lerp(pts[i - 1][0], x, f); y = lerp(pts[i - 1][1], y, f); }
        const j = k ? 1.4 : .5;
        x += (hash(sd + i * 1.7 + k * 31) - .5) * j; y += (hash(sd + i * 2.3 + k * 47) - .5) * j;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
        if (L[i] > lim) break;
      }
      g.stroke();
    }
    g.restore();
  }
  const ell = (cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 90, rot = 0) => {
    const out = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n), x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); } return out;
  };
  function hatch(g, path, o = {}, tt = 0) {                         // hatching inside a closed path, revealed by o.p
    const p = o.p ?? 1; if (p <= 0) return;
    g.save(); g.beginPath(); path.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip();
    const xs = path.map(q => q[0]), ys = path.map(q => q[1]);
    const x0 = Math.min(...xs) - 200, x1 = Math.max(...xs) + 200, y0 = Math.min(...ys), y1 = Math.max(...ys);
    const step = o.step ?? 9, n = Math.ceil((x1 - x0) / step), R = mulberry((o.seed ?? 3) + boil(tt));
    g.strokeStyle = o.c || INK; g.lineWidth = o.w ?? 1.6;
    for (let i = 0; i < n * p; i++) {
      const x = x0 + i * step; g.globalAlpha = (o.a ?? .35) * (.7 + R() * .5);
      g.beginPath(); g.moveTo(x + R() * 2, y1 + 4); g.lineTo(x + (y1 - y0) * .55 + R() * 2, y0 - 4); g.stroke();
    }
    g.restore();
  }
  function arrowHead(g, x, y, ang, s, o, tt) {
    stroke(g, [[x + Math.cos(ang + 2.6) * s, y + Math.sin(ang + 2.6) * s], [x, y], [x + Math.cos(ang - 2.6) * s, y + Math.sin(ang - 2.6) * s]], o, tt);
  }
  function label(g, txt, x, y, o = {}) {                            // handwritten label, written on left→right
    const p = o.p ?? 1; if (p <= 0) return;
    g.save(); g.font = `${o.size || 64}px ${o.font || 'PH'}`; g.fillStyle = o.c || INK; g.textAlign = o.align || 'left'; g.textBaseline = 'middle';
    const w = g.measureText(txt).width, xl = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    g.beginPath(); g.rect(xl - 10, y - 200, (w + 20) * clamp(p), 400); g.clip();
    g.globalAlpha = o.a ?? .92; g.fillText(txt, x, y); g.restore();
  }

  // place a picture: source point (sx,sy) lands on screen point (dx,dy) at scale k; multiply onto the sheet.
  // (sx,sy) and k are in the 1344-wide layout of the first drafts; sharper pictures and clips are rescaled to it.
  function place(g, im, sx, sy, dx, dy, k, o = {}) {
    const f = im.width / 1344; sx *= f; sy *= f; k /= f;
    g.save(); g.globalCompositeOperation = o.op || 'multiply'; g.globalAlpha = o.a ?? 1;
    if (o.clip) { const [cx, cy, cw, ch] = o.clip; g.beginPath(); g.rect(cx, cy, cw, ch); g.clip(); }
    g.drawImage(im, dx - sx * k, dy - sy * k, im.width * k, im.height * k); g.restore();
  }
  // the picture of a scene, or the frame of its real-motion clip once the clip has started (t0)
  const CLIP_T = { open: .7, owl: B.arc0 - .6, face: B.s4 + .15 };
  const still = (name, tt, live = true) => {
    const fr = clip[name]; if (!live || !fr || tt < CLIP_T[name]) return pic[name];
    return fr[Math.min(fr.length - 1, Math.floor((tt - CLIP_T[name]) * 16))];
  };
  const sheet = g => { g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.drawImage(paper, 0, 0); };

  // ───────── scenes; each draws the full frame at time tt
  const sc = {};
  // 1 · dusk: the girl and the owl. Slow push toward the owl; also the closing bookend (pull back, title, signature)
  sc.open = (g, tt) => {
    sheet(g);
    const end = tt >= B.s6;
    const k0 = W / 1344, z = end ? lerp(1.1, 1.0, eio(seg(tt, B.s6, B.s6 + 3))) : lerp(1.0, 1.1, ss(seg(tt, 0, B.s2 + .6)));
    const fx = 983, fy = 417;                               // the owl in the picture
    const cx = lerp(672, fx, .55), cy = lerp(384, fy, .5);
    place(g, still('open', tt, !end), cx, cy, W / 2 + (cx - 672) * k0, H / 2 + (cy - 384) * k0, k0 * z);
    if (end) {
      label(g, 'How far can an owl turn its head?', W / 2, 170, { size: 92, align: 'center', p: eo(seg(tt, B.title, B.title + 1.1)) });
      label(g, 'Andrew Classes', W / 2, 300, { size: 84, font: 'DS', align: 'center', c: '#6b4a32', p: ss(seg(tt, B.sign, B.sign + 1.3)) });
    }
  };
  // 2 · the owl on its branch; a pencil ring grows 270° around its neck
  const OWL = { sx: 645, sy: 330, dx: 960, dy: 560, k: 1.18 };
  const owlHead = [960, 560 - (330 - 180) * 1.18];
  sc.owl = (g, tt) => {
    sheet(g);
    const z = lerp(1, 1.04, seg(tt, B.s2, B.push0));
    place(g, still('owl', tt), OWL.sx, OWL.sy, OWL.dx, OWL.dy, OWL.k * z);
    const p = eio(seg(tt, B.arc0, B.arc1));
    if (p > 0) {
      const cx = owlHead[0], cy = owlHead[1] + 80, rx = 300, ry = 78, a0 = Math.PI / 2, a1 = a0 - Math.PI * 1.5 * p;
      const pts = ell(cx, cy, rx, ry, a0, a1, 120);
      stroke(g, pts, { c: RUST, w: 4.5, seed: 5 }, tt);
      const [x, y] = pts[pts.length - 1], [xp, yp] = pts[pts.length - 4];
      arrowHead(g, x, y, Math.atan2(y - yp, x - xp), 26, { c: RUST, w: 4.5, seed: 6 }, tt);
      label(g, '270°', cx + rx + 70, cy - 70, { size: 104, c: RUST, p: eo(seg(tt, B.deg, B.deg + .3)) });
    }
  };
  // 3 · the owl's face (also 4 · the head turns). Push in to the eyes before the diagram
  const FACE = { sx: 686, sy: 420, dx: 960, dy: 560, k: 1.3 };
  sc.face = (g, tt) => {
    sheet(g);
    let z = 1, sy = FACE.sy;
    if (tt < B.s4) { const q = eio(seg(tt, B.s3, B.diag + .3)); z = lerp(1, 1.22, q); sy = lerp(FACE.sy, 336, q); }
    else z = lerp(1.03, 1, ss(seg(tt, B.s4, B.s5)));
    place(g, still('face', tt), FACE.sx, sy, FACE.dx, lerp(FACE.dy, 430, z > 1.03 ? (z - 1) / .22 : 0), FACE.k * z);
  };
  // 3b · eye diagram drawn in pencil: owl eye (tube, held in a bony ring) vs your eye (a ball that rolls)
  sc.diag = (g, tt) => {
    sheet(g);
    g.save(); g.translate(960, 470); g.scale(1.3, 1.3); g.translate(-960, -470);
    diagram(g, tt);
    g.restore();
  };
  const diagram = (g, tt) => {
    const d0 = B.diag + .2, P = (a, b) => eio(seg(tt, a, b));
    // owl eye, side view (cornea left, tube widening to the back), inside a bony socket
    const ox = 560, oy = 470;
    const tube = [[ox - 170, oy - 70], [ox - 120, oy - 85], [ox - 40, oy - 110], [ox + 60, oy - 160], [ox + 140, oy - 165], [ox + 200, oy - 110],
      [ox + 215, oy], [ox + 200, oy + 110], [ox + 140, oy + 165], [ox + 60, oy + 160], [ox - 40, oy + 110], [ox - 120, oy + 85], [ox - 170, oy + 70]];
    const cornea = ell(ox - 170, oy, 55, 72, Math.PI / 2, Math.PI * 1.5, 40);
    hatch(g, [...tube, ...cornea.slice().reverse()], { c: OCHRE, a: .3, step: 10, seed: 11, p: P(d0 + .3, d0 + 1.2) }, tt);
    stroke(g, [...tube, tube[0]], { w: 4, seed: 12, p: P(d0, d0 + 1.0) }, tt);
    stroke(g, cornea, { w: 4, seed: 13, p: P(d0 + .2, d0 + .7) }, tt);
    stroke(g, ell(ox - 130, oy, 22, 60, -Math.PI / 2, Math.PI / 2, 30), { c: '#2c2420', w: 7, seed: 14, p: P(d0 + .5, d0 + .9) }, tt);   // pupil/lens
    // the bony ring: plates along the tube
    for (let i = 0; i < 6; i++) {
      const f = i / 5, x = lerp(ox - 110, ox + 40, f), yt = lerp(oy - 88, oy - 112, f) - 10, yb = lerp(oy + 88, oy + 112, f) + 10;
      const q = P(B.fixed - .1 + i * .06, B.fixed + .25 + i * .06);
      stroke(g, [[x - 18, yt - 14], [x + 18, yt - 22], [x + 20, yt + 6], [x - 16, yt + 12], [x - 18, yt - 14]], { c: BLUE, w: 3.5, seed: 20 + i, p: q }, tt);
      stroke(g, [[x - 18, yb + 14], [x + 18, yb + 22], [x + 20, yb - 6], [x - 16, yb - 12], [x - 18, yb + 14]], { c: BLUE, w: 3.5, seed: 30 + i, p: q }, tt);
    }
    label(g, 'owl eye', ox + 20, oy + 270, { size: 64, align: 'center', p: eo(seg(tt, d0 + .4, d0 + 1.2)) });
    label(g, 'fixed', ox + 20, oy - 260, { size: 76, c: BLUE, align: 'center', p: eo(seg(tt, B.fixed, B.fixed + .5)) });
    // your eye: a ball with iris, curved arrows show it rolls
    const hx = 1360, hy = 470, pr = P(B.roll - .1, B.roll + .6), look = Math.sin(seg(tt, B.roll, B.ours + 1.5) * Math.PI * 2) * 34;
    const ball = ell(hx, hy, 150, 150, 0, Math.PI * 2, 90);
    hatch(g, ball, { c: '#c98a7f', a: .16, step: 12, seed: 41, p: P(d0 + .5, d0 + 1.4) }, tt);
    stroke(g, ball, { w: 4, seed: 42, p: P(d0 + .3, d0 + 1.1) }, tt);
    const ix = hx - 60 + look * .3, iy = hy + look;
    hatch(g, ell(ix, iy, 26, 52, 0, Math.PI * 2, 40), { c: '#5f7690', a: .55, step: 6, seed: 43, p: P(d0 + .7, d0 + 1.2) }, tt);
    stroke(g, ell(ix, iy, 26, 52, 0, Math.PI * 2, 40), { w: 3.5, seed: 44, p: P(d0 + .7, d0 + 1.2) }, tt);
    for (const s of [-1, 1]) {
      const arc = ell(hx, hy, 215, 215, s * (Math.PI / 2 + .35), s * (Math.PI / 2 + 1.15), 30).map(([x, y]) => [x, y]);
      const a = s > 0 ? Math.PI * .5 + .35 : -Math.PI * .5 - .35;
      const pts = ell(hx, hy, 215, 215, a + (s > 0 ? .0 : 0), a + s * .8 * (s > 0 ? 1 : 1), 30);
      stroke(g, pts, { c: OLIVE, w: 4, seed: 50 + s, p: pr }, tt);
      if (pr > .95) { const [x, y] = pts[pts.length - 1], [xp, yp] = pts[pts.length - 3]; arrowHead(g, x, y, Math.atan2(y - yp, x - xp), 22, { c: OLIVE, w: 4, seed: 52 + s }, tt); }
    }
    label(g, 'your eye', hx, hy + 270, { size: 64, align: 'center', p: eo(seg(tt, d0 + .7, d0 + 1.5)) });
    label(g, 'rolls', hx + 230, hy - 210, { size: 76, c: OLIVE, align: 'center', p: eo(seg(tt, B.roll, B.roll + .5)) });
  };
  // 5 · comparison page: two pencil-ruled boxes, neck bones counted 1…14 and 1…7
  const BOXA = [80, 90, 940, 600], BOXB = [1100, 90, 740, 600];
  sc.cmp = (g, tt) => {
    sheet(g);
    const t0 = B.s5 - .3, P = (a, b) => eio(seg(tt, a, b));
    const box = ([x, y, w, h], s, a) => {
      stroke(g, [[x - 14, y], [x + w + 12, y + 2]], { w: 2.6, seed: s, p: P(a, a + .35), a: .7 }, tt);
      stroke(g, [[x + w, y - 12], [x + w - 2, y + h + 14]], { w: 2.6, seed: s + 1, p: P(a + .2, a + .55), a: .7 }, tt);
      stroke(g, [[x + w + 14, y + h], [x - 10, y + h - 2]], { w: 2.6, seed: s + 2, p: P(a + .4, a + .75), a: .7 }, tt);
      stroke(g, [[x, y + h + 12], [x + 2, y - 14]], { w: 2.6, seed: s + 3, p: P(a + .6, a + .95), a: .7 }, tt);
    };
    box(BOXA, 60, t0); box(BOXB, 70, t0 + .25);
    const fa = ss(seg(tt, t0 + .2, t0 + .8)), fb = ss(seg(tt, t0 + .45, t0 + 1.05));
    place(g, pic.side, 600, 370, BOXA[0] + BOXA[2] / 2, BOXA[1] + BOXA[3] / 2 + 10, .78, { clip: BOXA, a: fa });
    place(g, pic.girl, 820, 400, BOXB[0] + BOXB[2] / 2, BOXB[1] + BOXB[3] / 2, .72, { clip: BOXB, a: fb });
    label(g, 'owl', BOXA[0] + 30, BOXA[1] + 50, { size: 64, p: eo(seg(tt, t0 + .7, t0 + 1.2)) });
    label(g, 'you', BOXB[0] + 30, BOXB[1] + 50, { size: 64, p: eo(seg(tt, t0 + .9, t0 + 1.4)) });
    // neck bones as a row of pencil beads, same size on both sides: 14 is twice as long as 7
    const row = (x0, y, n, a, b, s, col) => {
      const bw = 40, gap = 12; let shown = 0;
      for (let i = 0; i < n; i++) {
        const ti = lerp(a, b, i / Math.max(1, n - 1)), q = seg(tt, ti, ti + .12); if (q <= 0) continue; shown = i + 1;
        const x = x0 + i * (bw + gap) + bw / 2, r = [[x - bw / 2, y - 22], [x, y - 32], [x + bw / 2, y - 22], [x + bw / 2 - 3, y + 22], [x, y + 30], [x - bw / 2 + 3, y + 22], [x - bw / 2, y - 22]];
        hatch(g, r, { c: col, a: .5, step: 7, seed: s + i, p: q }, tt);
        stroke(g, r, { w: 3, seed: s + i, p: q }, tt);
      }
      return [shown, x0 + shown * (bw + gap)];
    };
    const yR = BOXA[1] + BOXA[3] + 95;
    const [nA, xA] = row(BOXA[0] + 20, yR, 14, B.n14 - .25, B.n14 + .75, 100, OCHRE);
    const [nB, xB] = row(BOXB[0] + 20, yR, 7, B.n7 - .2, B.n7 + .35, 200, '#c98a7f');
    if (nA) label(g, String(nA), xA + 20, yR + 2, { size: 100, c: RUST });
    if (nB) label(g, String(nB), xB + 20, yR + 2, { size: 100, c: RUST });
  };

  // shot list: [start, scene]; a pencil wipe (0.7 s) joins each pair
  const SHOTS = [[0, 'open'], [B.s2, 'owl'], [B.s3, 'face'], [B.diag, 'diag'], [B.s4, 'face'], [B.s5, 'cmp'], [B.s6, 'open']];
  const WIPE = .7;
  function wipe(g, a, b, p, tt, dir = 1) {                        // b underneath, a erased by a ragged hatched edge
    sc[b](g, tt);
    const o = off[0].getContext('2d'); sc[a](o, tt);
    const mx = lerp(-260, W + 260, eio(p)), R = mulberry(9);
    o.save(); o.globalCompositeOperation = 'destination-out'; o.beginPath();
    o.moveTo(-10, -10);
    for (let y = -10; y <= H + 40; y += 40) o.lineTo(mx + (y - H / 2) * .25 + (R() - .5) * 60, y);
    o.lineTo(-10, H + 40); o.closePath(); o.fill(); o.restore();
    g.save(); g.globalCompositeOperation = 'source-over'; g.drawImage(off[0], 0, 0);
    g.strokeStyle = INK; g.globalAlpha = .25 * Math.sin(p * Math.PI); g.lineWidth = 2;      // pencil hatching on the edge
    const R2 = mulberry(boil(tt) + 3);
    for (let y = -20; y < H + 20; y += 14) { const x = mx + (y - H / 2) * .25 + (R2() - .5) * 40; g.beginPath(); g.moveTo(x - 30, y + 18); g.lineTo(x + 30, y - 18); g.stroke(); }
    g.restore();
  }

  // ───────── subtitles
  const subs = [];
  for (const l of lines) {
    const ws = WT[l.id], chunks = SUBT[l.id] || [[l.text, ws[0][0]]];
    const starts = []; let from = 0;                                // index of each piece's first word
    for (const [, w] of chunks) { let i = ws.findIndex((x, j) => j >= from && norm(x[0]) === norm(w)); if (i < 0) i = from; starts.push(i); from = i + 1; }
    chunks.forEach(([txt], ci) => {
      const a = starts[ci], b = ci < chunks.length - 1 ? starts[ci + 1] - 1 : ws.length - 1;
      subs.push({ t0: VO[l.id] + ws[a][1] - .08, t1: VO[l.id] + ws[b][2] + .35, text: txt });
    });
  }
  for (let i = 0; i < subs.length; i++) { const nx = i < subs.length - 1 ? subs[i + 1].t0 - .04 : END; subs[i].t1 = Math.min(Math.max(subs[i].t1, subs[i].t0 + 1.8), nx); }
  let showSubs = !new URLSearchParams(location.search).has('nosubs');
  const subBox = t => { const s = subs.find(s => t >= s.t0 && t < s.t1); return s || null; };
  function drawSub(g, t) {
    const s = subBox(t); if (!s) return;
    const a = Math.min(seg(t, s.t0, s.t0 + .15), 1 - seg(t, s.t1 - .15, s.t1));
    g.save(); g.font = '50px PH'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = g.measureText(s.text).width + 60, y = H - 78;
    g.globalAlpha = .82 * a; g.fillStyle = '#f6eedd';
    g.beginPath(); g.roundRect(W / 2 - w / 2, y - 38, w, 76, 22); g.fill();
    g.globalAlpha = a; g.fillStyle = '#4a3222'; g.fillText(s.text, W / 2, y + 2); g.restore();
  }

  function render(g, tt) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    let i = 0; while (i < SHOTS.length - 1 && tt >= SHOTS[i + 1][0]) i++;
    const nxt = SHOTS[i + 1];
    if (nxt && tt > nxt[0] - WIPE / 2) wipe(g, SHOTS[i][1], nxt[1], seg(tt, nxt[0] - WIPE / 2, nxt[0] + WIPE / 2), tt);
    else if (i > 0 && tt < SHOTS[i][0] + WIPE / 2) wipe(g, SHOTS[i - 1][1], SHOTS[i][1], seg(tt, SHOTS[i][0] - WIPE / 2, SHOTS[i][0] + WIPE / 2), tt);
    else sc[SHOTS[i][1]](g, tt);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // pencil dust: a few slow specks
    const R = mulberry(21); g.fillStyle = '#8a6a40';
    for (let k = 0; k < 14; k++) { const x0 = R() * W, y0 = R() * H, sp = 6 + R() * 10; g.globalAlpha = .18 + R() * .15; g.fillRect((x0 + tt * sp) % W, (y0 + tt * sp * .4 + Math.sin(tt * .7 + k) * 8) % H, 2, 2); }
    g.globalAlpha = Math.max(1 - seg(tt, 0, .5), seg(tt, END - .6, END)); g.fillStyle = '#000';
    if (g.globalAlpha > 0) g.fillRect(0, 0, W, H);
    g.globalAlpha = 1;
    if (showSubs) drawSub(g, tt);
  }

  const texts = tt => {
    const out = [];
    if (tt >= B.deg + .3 && tt < B.s3 - .35) out.push({ id: 'deg', text: '270°', x0: 1250, y0: 350, x1: 1500, y1: 470 });
    if (tt >= B.title) out.push({ id: 'title', text: 'How far can an owl turn its head?', x0: 330, y0: 110, x1: 1590, y1: 230 });
    return out;
  };
  const ev = [
    { t: B.s2, type: 'wipe' }, { t: B.arc0, type: 'pencil', d: B.arc1 - B.arc0 }, { t: B.s3, type: 'wipe' }, { t: B.diag, type: 'wipe' },
    { t: B.fixed, type: 'pencil', d: .5 }, { t: B.roll, type: 'pencil', d: .6 }, { t: B.s4, type: 'wipe' },
    { t: B.s5, type: 'wipe' }, { t: B.s6, type: 'wipe' }, { t: B.sign, type: 'pencil', d: 1.3 }, { t: B.title, type: 'pencil', d: 1.1 },
    { t: B.s5 - .2, type: 'pencil', d: 1.0 },                                    // the ruled boxes
    { t: CLIP_T.owl + .4, type: 'rustle' }, { t: CLIP_T.face + .3, type: 'rustle' },
    ...lines.map(l => ({ t: VO[l.id], type: 'vo', id: l.id })),
    { t: 0, type: 'cues', END, SIL: [B.s5 - .35, VO.v5 + .1], B },
  ];
  for (let i = 0; i < 14; i++) ev.push({ t: lerp(B.n14 - .25, B.n14 + .75, i / 13), type: 'tick', i, side: -1 });
  for (let i = 0; i < 7; i++) ev.push({ t: lerp(B.n7 - .2, B.n7 + .35, i / 6), type: 'tick', i, side: 1 });
  for (const x of subs) ev.push({ t: x.t0, type: 'sub', t1: x.t1, text: x.text });   // for the .srt
  ev.sort((a, b) => a.t - b.t);
  return { dur: END, render, ev, subs, texts, VO, B, setSubs: on => { showSubs = !!on; } };
}
