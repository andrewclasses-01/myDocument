// Painted specimens for "Mole Rats". Every generator works in local coordinates (ground at y = 0, facing right)
// and returns a list of strokes in painting order (structure first, details last). Build them under withSeed.
const C = {
  pink: '#e8a596', pink2: '#d98a7c', pinkD: '#c27066', wr: '#a95e55', tooth: '#e3b844', toothD: '#b08524',
  soil: '#c9a06e', soil2: '#a97c4e', soil3: '#7d5a3a', soilL: '#e3c89c', tunnel: '#efdcbc', hole: '#5a3e29',
  grass: '#8ea860', grass2: '#5f7d45', root: '#8a6440', rootL: '#b38a5c', honey: '#e2b24e', honey2: '#c98f2c',
  bee: '#e0ac34', beeD: '#3a2a20', wing: '#a9bccb', ant: '#3b2b24', sky: '#efe0c4', glass: '#a9c3cf', glassD: '#6f8f9d',
  red: '#cf4f2c', ochre: '#e0ad4f', sage: '#9cb08a', blue: '#6d93b0',
};

// 27/10: chuột, ong, kiến vẽ kiểu MINH HOẠ SÁCH GIÁO KHOA (hinh.js — mẫu v3 thầy chốt), thay cho nét cọ màu nước.
// Mỗi hàm trả về MỘT "nét ảnh" {pic, pts:[góc trên-trái, góc dưới-phải], ws}: bbox/scaleS/sprite/drawList dùng như nét cọ,
// drawS (engine.js) vẽ ảnh hiện dần. Toạ độ giữ như cũ để mọi cảnh không phải sửa.
function picStroke(ten, s, ox, oy, sx = s) {
  const [x0, y0, x1, y1] = HINH.khung[ten];
  return { pic: ten, pts: [[x0 * sx + ox, y0 * s + oy], [x1 * sx + ox, y1 * s + oy]], ws: [0, 0], col: INK, a: 1 };
}
// side view: ground at y = 0, facing right, nose ≈ x 165. o.len stretches the body (queen > 1, babies < 1)
function moleRat(o = {}) {
  const L = o.len ?? 1, sx = .36 * Math.pow(L, .6), s = .36 * Math.pow(L, .25);
  return [picStroke('chuot', s, 20 - 395 * sx, 0, sx)];
}
// the front of the face, big: for "four sharp teeth" (top teeth ≈ y 72, bottom ≈ y 132 — the arrows in scene 3 point there)
function moleFace() { return [picStroke('mat0', .6, 0, 20)]; }
// the teeth appear on their own words: top = face with the two top teeth, bottom = face with all four
function faceTeeth(top) { return [picStroke(top ? 'mat1' : 'mat2', .6, 0, 20)]; }
// centred on (0, 0), facing right; w = width in local units
function centred(ten, w) {
  const [x0, y0, x1, y1] = HINH.khung[ten], s = w / (x1 - x0);
  return [picStroke(ten, s, -(x0 + x1) / 2 * s, -(y0 + y1) / 2 * s)];
}
function bee() { return centred('ong', 66); }
function ant() { return centred('kien', 40); }
// honeycomb: hexagon cells as small washes, drawn on a context directly
function honeycomb(c, x0, y0, w, h, r) {
  const dx = r * Math.sqrt(3), dy = r * 1.5;
  for (let j = 0; j * dy < h + r; j++) for (let i = 0; i * dx < w + dx; i++) {
    const cx = x0 + i * dx + (j % 2) * dx / 2, cy = y0 + j * dy, pts = [];
    for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; pts.push([cx + Math.cos(a) * r * .9, cy + Math.sin(a) * r * .9]); }
    washPoly(c, pts, hash(i * 7 + j * 13) > .35 ? C.honey : C.honey2, .55, 3, 1.5);
    if (hash(i * 3 + j * 5) > .5) { const q = pts.map(([x, y]) => [lerp(cx, x, .55), lerp(cy, y, .55)]); washPoly(c, q, C.honey2, .35, 2, 1); }
  }
}
// a root hanging down (or lying), with rootlets
function root(len, o = {}) {
  const S = [], bend = o.bend ?? 14;
  const main = mk(qcurve(0, 0, bend * .5, len, bend, 12), o.w ?? 9, C.root, { prof: 'tip', nb: 2 });
  S.push(main);
  for (let i = 1; i < 5; i++) { const p = main.pts[Math.floor(i / 5 * 12)], s = i % 2 ? 1 : -1; S.push(mk(qcurve(p[0], p[1], p[0] + s * rnd(16, 34), p[1] + rnd(14, 30), s * 4, 5), 2.4, C.rootL, { prof: 'tip', nb: 0, a: .8 })); }
  return S;
}
// a sweet tuber + leaves: the food icon
function tuber() {
  const S = [mk(qcurve(-34, 4, 34, -4, -10, 8), 34, '#c9774a', { prof: 'leaf', nb: 4 })];
  S.push(mk(qcurve(-30, 10, 30, 2, -6, 8), 12, '#a85a35', { prof: 'leaf', nb: 0, a: .5 }));
  for (const d of [-.6, 0, .6]) S.push(mk(polar(32, -6, -1.3 + d, 34, 4, 5), 9, C.grass, { prof: 'leaf', nb: 0 }));
  return S;
}
function shield() {
  const S = [];
  S.push(mk(qcurve(0, -40, 0, 44, 0, 8), 70, C.blue, { prof: 'tip', nb: 6, a: .75 }));
  S.push(mk(qcurve(-14, -30, -10, 26, 4, 6), 12, '#4f7591', { prof: 'tip', nb: 0, a: .5 }));
  return S;
}
function mound() {
  const S = [mk(qcurve(-50, 0, 50, 0, 40, 10), 30, C.soil2, { prof: 'leaf', nb: 5 })];
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + rnd(-.9, .9), r = rnd(46, 70); S.push(mk(polar(Math.cos(a) * r * .5, -24 + Math.sin(a) * r * .5, a, rnd(8, 14), 0, 3), rnd(6, 9), C.soil3, { prof: 'leaf', nb: 0 })); }
  return S;
}
function grassTuft(h = 40) {
  const S = []; for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + rnd(-.6, .6); S.push(mk(polar(rnd(-8, 8), 0, a, h * rnd(.6, 1.1), rnd(-8, 8), 5), rnd(3.5, 6), pick([C.grass, C.grass2]), { prof: 'tip', nb: 0, a: .85 })); } return S;
}
// a child seen from behind (zoo): shoulders, a round head of hair, ears
function child(shirt, hair) {
  const S = [];
  for (const x of [-60, -20, 20, 60]) S.push(mk(qcurve(x * .8, 0, x * 1.2, 160, x * .1, 8), 70, shirt, { prof: 'leaf', nb: 5, a: .85 }));
  for (const s of [-1, 1]) S.push(mk(qcurve(s * 50, -66, s * 54, -54, 0, 3), 18, '#d9a988', { prof: 'leaf', nb: 0 }));
  S.push(mk(qcurve(0, -130, 0, -10, 0, 8), 106, hair, { prof: 'leaf', nb: 7 }));
  S.push(mk(qcurve(-20, -120, 20, -20, 0, 8), 60, hair, { prof: 'leaf', nb: 3, a: .7 }));
  return S;
}
// the zookeeper, from behind, pointing at the glass
function keeper() {
  const S = [];
  S.push(mk(qcurve(-40, -10, -120, -150, 10, 8), 30, '#8f8a5a', { prof: 'tip', nb: 3 }));    // arm
  S.push(mk(qcurve(0, 220, 0, -30, 0, 10), 150, '#8f8a5a', { prof: 'trunk', nb: 8 }));
  S.push(mk(qcurve(0, -130, 0, -40, 0, 6), 84, '#d4a27a', { prof: 'leaf', nb: 3 }));
  S.push(mk(qcurve(0, -125, 0, -60, 0, 6), 70, '#5a4433', { prof: 'leaf', nb: 3, a: .8 }));
  S.push(mk(qcurve(-62, -122, 62, -122, -8, 10), 20, '#6f6a3f', { prof: 'even', nb: 3 }));
  S.push(mk(qcurve(0, -168, 0, -122, 0, 6), 64, '#6f6a3f', { prof: 'leaf', nb: 3 }));
  return S;
}
