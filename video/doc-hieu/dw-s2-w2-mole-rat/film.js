// "Mole Rats" — lesson video for DW-S2.W2, Textbook Animal Illustration (sgk-dong-vat). One painted journal page per slide, in the slide's own
// layout; pages arrive with a brush-edge wipe. Every on-screen cue hangs on the spoken word it names.
// Timing comes from voices/dur.json + voices/words.json when they exist, otherwise from an estimate (storyboard).
const Q = new URLSearchParams(location.search); let NOSUBS = Q.get('nosubs') === '1';
let ctx, PAPER_IMG, LINES, KB, DURS = null, WORDS = null;
const VO = {}, SL = {}, KW = {}, EVS = [];
let DUR_ = 150, END = {}, TX = [], EXTRA = {}, CUES = null;

// ───────────────────────── timing ─────────────────────────
const toks = s => s.split(/\s+/).filter(Boolean);
const norm = s => s.toLowerCase().replace(/[^a-z0-9']/g, '');
function timing() {
  const T0 = 1.6, GAP = .36, GAPS = 1.45;
  let t = T0, prev = null;
  for (const L of LINES) {
    if (prev !== null && L.slide !== prev) t += GAPS - GAP + (EXTRA[prev] || 0);
    const n = toks(L.text).length, d = DURS && DURS[L.id] ? DURS[L.id] : n / 2.5 + .15;
    VO[L.id] = { s: t, d, e: t + d, slide: L.slide, text: L.text };
    if (!SL[L.slide]) SL[L.slide] = { t0: t, ids: [] };
    SL[L.slide].ids.push(L.id); SL[L.slide].t1 = t + d;
    t += d + GAP; prev = L.slide;
  }
  for (let s = 1; s <= 11; s++) SL[s].A = s === 1 ? 0 : SL[s].t0 - 1.15;   // the wipe starts here
  for (let s = 1; s <= 10; s++) SL[s].B = SL[s + 1].A + .95;               // and covers the page fully here
  END.mist = SL[11].t1 + 1.0; END.card = END.mist + 1.4; SL[11].B = END.card;
  DUR_ = END.card + 6.6;
}
// time of the k-th occurrence of a word in a line (start), from Whisper words or estimated from letters
function at(id, w, k = 0, end = false) {
  const V = VO[id], tk = toks(V.text), nw = norm(w);
  let idx = -1, n = 0;
  for (let i = 0; i < tk.length; i++) if (norm(tk[i]).startsWith(nw) && n++ === k) { idx = i; break; }
  if (idx < 0) { console.warn('word not found', id, w); return V.s; }
  return wordTime(id, idx, end);
}
function wordTime(id, idx, end = false) {
  const V = VO[id], tk = toks(V.text);
  const W_ = WORDS && WORDS[id];
  if (W_ && W_.length === tk.length) return V.s + W_[idx][end ? 2 : 1];
  if (W_ && W_.length) { const j = Math.min(W_.length - 1, Math.round(idx / tk.length * W_.length)); return V.s + W_[j][end ? 2 : 1]; }
  const lens = tk.map(x => x.length + 1), tot = lens.reduce((a, b) => a + b, 0);
  let acc = 0; for (let i = 0; i < idx; i++) acc += lens[i];
  if (end) acc += lens[idx];
  return V.s + .1 + (V.d - .2) * acc / tot;
}
// key words (**…** in kich-ban.json) → which line and which word indices
function keywords() {
  for (const d of KB.doan) {
    const kws = []; for (const s of d.loi) for (const m of s.matchAll(/\*\*(.+?)\*\*/g)) kws.push(m[1]);
    const ids = SL[d.slide].ids; let li = 0;
    for (const kw of kws) {
      const kt = toks(kw).map(norm);
      for (let j = li; j < ids.length; j++) {
        const tk = toks(VO[ids[j]].text).map(norm);
        let hit = -1; for (let i = 0; i + kt.length <= tk.length; i++) if (kt.every((x, q) => tk[i + q] === x)) { hit = i; break; }
        if (hit >= 0) { (KW[ids[j]] = KW[ids[j]] || []).push([hit, hit + kt.length - 1]); li = j; break; }
      }
    }
  }
}

// ───────────────────────── drawing helpers ─────────────────────────
function scaleS(S, k) { for (const s of S) { s.pts = s.pts.map(([x, y]) => [x * k, y * k]); s.ws = s.ws.map(w => w * k); if (s.br) for (const b of s.br) { b.bw *= k; b.dash = b.dash.map(d => d * k); } } return S; }
function O(seed, gen, k = 1) { const S = scaleS(withSeed(seed, gen), k); return { S, spr: sprite(S) }; }
function paint(c, o, p, x, y, fl = 1, rot = 0, am = 1) {
  if (p <= 0) return;
  c.save(); c.translate(x, y); if (rot) c.rotate(rot); if (fl < 0) c.scale(-1, 1);
  if (p >= 1) { c.globalAlpha *= am; c.drawImage(o.spr.cv, o.spr.x0, o.spr.y0); } else drawList(c, o.S, p, null, am);
  c.restore();
}
function canvas(w = W, h = H) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }
// wavy brush-edge reveal of a rectangle region (left → right)
function wipeClip(c, x, y, w, h, p, seed = 0) {
  const e = x - 90 + p * (w + 180);
  c.beginPath(); c.moveTo(x - 5, y - 5);
  for (let yy = y - 5; yy <= y + h + 5; yy += 24) c.lineTo(e + (vnoise(seed + yy * .012) - .5) * 150, yy);
  c.lineTo(x - 5, y + h + 5); c.closePath(); c.clip();
}
function reveal(c, cv, x, y, w, h, p, seed = 0, ox = 0, oy = 0) {
  if (p <= 0) return; c.save();
  if (p < 1) wipeClip(c, x, y, w, h, p, seed); else { c.beginPath(); c.rect(x - 5, y - 5, w + 10, h + 10); c.clip(); }
  c.drawImage(cv, ox, oy); c.restore();
}
function panelWash(c, x, y, w, h, tint, a = .5) { washPoly(c, rrect(x, y, w, h, 28), tint, a, 3, 4); }
function clipR(c, x, y, w, h, r = 24) { c.beginPath(); c.roundRect(x + 6, y + 6, w - 12, h - 12, r); c.clip(); }
function soilBg(c, x0, y0, x1, y1, seed, o = {}) {
  withSeed(seed, () => {
    const band = (yt, col, a, amp) => { const pts = []; for (let x = x0 - 20; x <= x1 + 20; x += 18) pts.push([x, yt + (fbm(seed + x * .004) - .5) * amp]); pts.push([x1 + 20, y1 + 20], [x0 - 20, y1 + 20]); washPoly(c, pts, col, a, 3, 4); };
    band(y0, o.c1 || C.soil, o.a1 ?? .62, o.amp ?? 40);
    band(lerp(y0, y1, .45), C.soil2, .3, 60);
    band(lerp(y0, y1, .78), C.soil3, .18, 60);
    for (let i = 0; i < (o.dots ?? 140); i++) { const x = rnd(x0, x1), y = rnd(y0 + 20, y1); c.globalAlpha = 1; drawS(c, mk(polar(x, y, rnd(0, 6.3), rnd(4, 12), 0, 3), rnd(3, 7), pick([C.soil2, C.soil3, C.soilL]), { prof: 'leaf', nb: 0, a: rnd(.25, .55) })); }
  });
}
function tunnel(c, pts, w, seed) {
  withSeed(seed, () => {
    const s = mk(pts, w, C.tunnel, { prof: 'even', nb: 0, a: .95, rough: .12 }); drawS(c, s);
    drawS(c, mk(pts, w * .7, '#f4e7cf', { prof: 'even', nb: 0, a: .6, rough: .2 }));
    drawS(c, edgeOf(s, 1, 5, C.soil3, .45)); drawS(c, edgeOf(s, -1, 4, C.soil3, .3));
  });
}
const fade2 = (t, a, b, fi = .5, fo = .5) => ss(seg(t, a, a + fi)) * (1 - ss(seg(t, b - fo, b)));

// ── text: hand-written cues, titles, the slide label. Every visible text is registered for readcheck.
function cueW(c, txt, size) { c.font = `600 ${size}px Caveat`; const parts = txt.split('→'); let w = 0; parts.forEach((p, i) => { w += c.measureText(p.trim()).width + (i ? 78 : 0); }); return w; }
function cue(c, id, txt, x, y, t, t0, o = {}) {
  const size = o.size || 58, dur = o.dur ?? clamp(.45 + txt.length * .035, .6, 1.4), p = seg(t, t0, t0 + dur);
  if (CUES) CUES.push([t0, txt]);
  if (p <= 0) return;
  c.save(); c.font = `600 ${size}px Caveat`; c.textBaseline = 'middle'; c.textAlign = 'left';
  const w = cueW(c, txt, size), x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  c.beginPath(); c.rect(x0 - 10, y - size, (w + 20) * eo(p), size * 2); c.clip();
  c.shadowColor = rgba(PAPER, 1); c.shadowBlur = 16;
  const parts = txt.split('→'); let xx = x0;
  parts.forEach((pt, i) => {
    if (i) {   // a painted arrow instead of a glyph
      c.shadowBlur = 0;
      withSeed(900 + i + Math.round(x), () => { drawS(c, mk(qcurve(xx + 12, y + 4, xx + 62, y + 2, -4, 6), 5, INK2, { prof: 'even', nb: 0, a: .85 })); drawS(c, mk(qcurve(xx + 48, y - 10, xx + 64, y + 2, 2, 4), 4.5, INK2, { prof: 'tip', nb: 0 })); drawS(c, mk(qcurve(xx + 48, y + 14, xx + 64, y + 3, -2, 4), 4.5, INK2, { prof: 'tip', nb: 0 })); });
      c.shadowBlur = 16; xx += 78;
    }
    const s = pt.trim(); c.fillStyle = rgba(o.col || INK, .92); c.fillText(s, xx, y); c.fillText(s, xx, y); xx += c.measureText(s).width;
  });
  c.restore();
  if (o.ul) withSeed(700 + Math.round(y), () => drawS(c, mk(qcurve(x0 - 4, y + size * .5, x0 + w + 4, y + size * .5 - 3, -3, 14), 6, o.ulCol || C.red, { prof: 'even', nb: 3, a: .7 }), seg(t, t0 + dur * .6, t0 + dur + .4)));
  TX.push({ id, text: txt, x0: x0 - 10, y0: y - size * .7, x1: x0 + w + 10, y1: y + size * .7 });
}
function title(c, s, txt, t, x = 110, y = 128, o = {}) {
  const t0 = SL[s].A + .35, p = seg(t, t0, t0 + 1.1); if (p <= 0) return;
  c.save(); const size = o.size || 64; c.font = `600 ${size}px "Cormorant Garamond"`; c.textBaseline = 'alphabetic'; c.textAlign = o.align || 'left';
  const w = c.measureText(txt).width, x0 = o.align === 'center' ? x - w / 2 : x;
  c.beginPath(); c.rect(x0 - 10, y - size, (w + 20) * eio(p), size * 1.5); c.clip();
  c.shadowColor = rgba(PAPER, o.halo ?? .8); c.shadowBlur = 14; c.fillStyle = o.col || INK; c.fillText(txt, x, y); c.restore();
  TX.push({ id: 'title' + s, text: txt, x0: x0 - 10, y0: y - size, x1: x0 + w + 10, y1: y + size * .3 });
}
function label(c, s, t) {
  const a = ss(seg(t, SL[s].A + .5, SL[s].A + 1.1)); if (a <= 0) return;
  c.save(); c.globalAlpha = a; c.font = '400 20px "IBM Plex Mono"'; c.letterSpacing = '4px'; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
  c.fillStyle = rgba(INK, .72); c.fillText(`${s} / 11`, 1820, 92); c.letterSpacing = '0px';
  withSeed(60 + s, () => drawS(c, mk(qcurve(1700, 104, 1818, 104, -2, 8), 7, C.red, { prof: 'even', nb: 3, a: .75 }), seg(t, SL[s].A + .6, SL[s].A + 1.2)));
  c.restore();
}
// the painted-in banner stroke behind a title
function banner(c, s, t, x0, x1, y, col, w = 92, a = .7) { withSeed(80 + s, () => drawS(c, mk(qcurve(x0, y, x1, y - 6, -6, 24), w, col, { prof: 'even', nb: 9, a, rough: .14 }), eio(seg(t, SL[s].A + .1, SL[s].A + .9)))); }

// ───────────────────────── camera ─────────────────────────
let CAM = { z: 1, fx: 960, fy: 540, dx: 0, dy: 0 };
function camSet(c, z, fx, fy, dx = 0, dy = 0) { CAM = { z, fx, fy, dx, dy }; c.setTransform(z, 0, 0, z, fx - fx * z + dx * z, fy - fy * z + dy * z); }
const ws = (x, y) => [CAM.fx + (x + CAM.dx - CAM.fx) * CAM.z, CAM.fy + (y + CAM.dy - CAM.fy) * CAM.z];
function camOff(c) { c.setTransform(1, 0, 0, 1, 0, 0); }
// a panel that dims when another one is being talked about
function focusA(t, spans, i) { let a = 1; for (const [t0, t1, on] of spans) { const f = fade2(t, t0, t1, .35, .35); if (f > 0) a = Math.min(a, on.includes(i) ? 1 : lerp(1, .42, f)); } return a; }

// ───────────────────────── scenes ─────────────────────────
const SC = {};
const ev = (t, type, o = {}) => EVS.push({ t: +t.toFixed(3), type, ...o });

// 1 · Strange Mole Rats — surface, a tunnel hole, the animal at its door; banner title; two cues at right
SC[1] = {
  build() {
    const bg = canvas();
    withSeed(11, () => {
      washPoly(bg.getContext('2d'), [[0, 0], [W, 0], [W, 520], [0, 520]], C.sky, .45, 3, 6);
      soilBg(bg.getContext('2d'), 0, 470, W, H, 12, { dots: 220 });
      const c = bg.getContext('2d');
      washPoly(c, blob(560, 700, 190, 78, .1, 40, 3), C.hole, .55, 3, 3);
      washPoly(c, blob(560, 712, 140, 52, .12, 40, 5), '#3d2a1d', .6, 3, 2);
      washPoly(c, blob(560, 760, 260, 40, .2, 40, 9), C.soil2, .35, 3, 4);
    });
    this.bg = bg;
    this.tufts = [[150, 476], [330, 470], [1020, 482], [1390, 468], [1700, 474], [1860, 480]].map(([x, y], i) => ({ x, y, o: O(120 + i, () => grassTuft(46)) }));
    this.rat = O(101, () => moleRat(), 1.75);
    const s = SL[1]; this.tR = s.t0 - .5;
    this.c1 = at('v1', 'animal'); this.c2 = at('v3', 'fur');
    ev(.05, 'brush', { d: 1.3 }); ev(this.tR, 'brush', { d: 2.6 }); ev(this.tR + .4, 'scratch', { d: 1.2 });
    ev(this.c1, 'write'); ev(this.c2, 'write');
    this.key = SL[1].t1 + .3;
  },
  draw(c, t) {
    const s = SL[1], z = lerp(1, 1.08, eio(seg(t, s.t0, s.t1)));
    camSet(c, z, 820, 640);
    reveal(c, this.bg, 0, 0, W, H, eio(seg(t, .05, 1.4)), 3);
    this.tufts.forEach((g, i) => paint(c, g.o, seg(t, .9 + i * .1, 1.6 + i * .1), g.x, g.y));
    const bob = Math.sin(t * 2.2) * 1.5 * seg(t, this.tR + 2.6, this.tR + 3);
    paint(c, this.rat, seg(t, this.tR, this.tR + 2.6), 790, 712 + bob);
    camOff(c);
    banner(c, 1, t, 70, 820, 118, C.ochre, 104, .62);
    title(c, 1, 'Strange Mole Rats', t, 112, 140);
    label(c, 1, t);
    cue(c, 'c1a', 'Strange animal', 1250, 360, t, this.c1);
    cue(c, 'c1b', 'No fur, lives underground', 1250, 450, t, this.c2);
  },
};

// 2 · Rat Look, Bee Life — three equal rounded frames; cue under the first, cue under the other two
const STRIP = [150, 720, 1290], SY = 250, SW = 480, SH = 440;
SC[2] = {
  build() {
    const bg = canvas(), c = bg.getContext('2d');
    withSeed(21, () => {
      panelWash(c, STRIP[0], SY, SW, SH, '#f0d9c8', .55);
      c.save(); clipR(c, STRIP[0], SY, SW, SH); soilBg(c, STRIP[0], SY + 330, STRIP[0] + SW, SY + SH, 22, { dots: 30 }); c.restore();
      panelWash(c, STRIP[1], SY, SW, SH, '#f3e3b8', .55);
      c.save(); clipR(c, STRIP[1], SY, SW, SH); honeycomb(c, STRIP[1] - 10, SY, SW + 20, SH, 34); c.restore();
      panelWash(c, STRIP[2], SY, SW, SH, '#e9dcc0', .5);
      c.save(); clipR(c, STRIP[2], SY, SW, SH); soilBg(c, STRIP[2], SY + 120, STRIP[2] + SW, SY + SH, 23, { dots: 60, a1: .5 }); c.restore();
    });
    this.bg = bg;
    this.rat = O(201, () => moleRat(), 1.2);
    this.bees = [[90, 120, .2], [300, 210, -.4], [200, 330, .5], [390, 90, 2.6]].map(([x, y, r], i) => ({ x, y, r, o: O(210 + i, bee, 1.5) }));
    this.ants = []; for (let i = 0; i < 9; i++) { const u = i / 8, x = 40 + u * 400, y = 330 - u * 150 + Math.sin(u * 6) * 26; this.ants.push({ x, y, r: -Math.atan2(150 / 400 - Math.cos(u * 6) * 26 * 6 / 400, 1) * .9 - .35, o: O(230 + i, ant, 1.6) }); }
    const S = SL[2]; this.tP = [S.A + .15, S.A + .55, S.A + .95];
    this.c1 = at('v8', 'looks'); this.c2 = at('v10', 'lives');
    this.foc = [[VO.v8.s - .1, VO.v8.e, [0]], [VO.v9.s - .1, VO.v9.e, [1, 2]]];
    this.tP.forEach(x => ev(x, 'brush', { d: 1.6 })); ev(this.c1, 'write'); ev(this.c2, 'write');
    this.key = VO.v10.e + .2;
  },
  draw(c, t) {
    camSet(c, lerp(1, 1.015, seg(t, SL[2].t0, SL[2].t1)), 960, 470);
    for (let i = 0; i < 3; i++) {
      const x = STRIP[i], p = eio(seg(t, this.tP[i], this.tP[i] + 1.1)), a = focusA(t, this.foc, i);
      c.save(); c.globalAlpha = a; reveal(c, this.bg, x - 10, SY - 10, SW + 20, SH + 20, p, 20 + i);
      c.save(); clipR(c, x, SY, SW, SH);
      const q = seg(t, this.tP[i] + .4, this.tP[i] + 2.0);
      if (i === 0) paint(c, this.rat, q, x + 230, SY + 352 + Math.sin(t * 2) * 1.2);
      if (i === 1) this.bees.forEach((b, k) => paint(c, b.o, seg(q, k * .2, k * .2 + .5), x + b.x + Math.sin(t * 1.3 + k) * 6, SY + b.y + Math.cos(t * 1.7 + k) * 5, 1, b.r));
      if (i === 2) this.ants.forEach((b, k) => { const m = ((t * .045 + k / 9) % 1), u = m; paint(c, b.o, seg(q, k * .07, k * .07 + .4), x + 40 + u * 400, SY + 330 - u * 150 + Math.sin(u * 6) * 26, 1, b.r); });
      c.restore(); c.restore();
    }
    camOff(c);
    title(c, 2, 'Rat Look, Bee Life', t);
    label(c, 2, t);
    cue(c, 'c2a', 'Looks like a rat', STRIP[0] + SW / 2, 780, t, this.c1, { align: 'center' });
    withSeed(250, () => drawS(c, mk(qcurve(STRIP[1] + 30, 728, STRIP[2] + SW - 30, 728, -10, 20), 4, INK2, { prof: 'even', nb: 0, a: .6 }), seg(t, this.c2 - .2, this.c2 + .5)));
    cue(c, 'c2b', 'Lives like bees or ants', (STRIP[1] + STRIP[2] + SW) / 2, 780, t, this.c2, { align: 'center' });
  },
};

// 3 · Four Sharp Teeth — one big face, push in to the mouth, arrows "top" / "bottom"
SC[3] = {
  build() {
    const bg = canvas();
    withSeed(31, () => { const c = bg.getContext('2d'); washPoly(c, blob(960, 560, 600, 440, .04, 80, 2), C.soil, .3, 3, 6); washPoly(c, blob(960, 580, 440, 340, .05, 80, 7), C.soil2, .2, 3, 6); });
    this.bg = bg; this.k = 1.35;
    this.face = O(301, moleFace, this.k); this.top = O(302, () => faceTeeth(true), this.k); this.bot = O(303, () => faceTeeth(false), this.k);
    const S = SL[3];
    this.tF = S.A + .5; this.tT = at('v12', 'teeth') - .1;
    this.c1 = at('v12', 'teeth'); this.c2 = at('v12', 'front'); this.c3 = at('v13', 'two');
    this.a1 = at('v13', 'top'); this.a2 = at('v14', 'bottom');
    ev(this.tF, 'brush', { d: 2 }); ev(this.tT, 'brush', { d: .9 }); [this.c1, this.c2, this.c3].forEach(x => ev(x, 'write'));
    this.key = VO.v15.e + .2;
  },
  draw(c, t) {
    const S = SL[3], z = lerp(1, 1.1, eio(seg(t, S.t0, this.a1)));
    camSet(c, z, 960, 700);
    reveal(c, this.bg, 0, 0, W, H, eio(seg(t, S.A + .2, S.A + 1.4)), 30);
    const X = 960, Y = 520;
    paint(c, this.face, seg(t, this.tF, this.tF + 2.0), X, Y);
    paint(c, this.top, seg(t, this.tT, this.tT + .6), X, Y);
    paint(c, this.bot, seg(t, this.tT + .35, this.tT + .95), X, Y);
    const [tx, ty] = ws(X + 30, Y + 72 * this.k), [bx, by] = ws(X + 30, Y + 132 * this.k);
    camOff(c);
    // arrows with labels: "top" and "bottom"
    const arrow = (x0, y0, x1, y1, p, sd) => withSeed(sd, () => { drawS(c, mk(qcurve(x0, y0, x1, y1, 30, 16), 5, C.red, { prof: 'even', nb: 0, a: .9 }), p); if (p >= 1) { const a = Math.atan2(y1 - y0, x1 - x0); for (const d of [-.5, .5]) drawS(c, mk(polar(x1, y1, a + Math.PI + d, 22, 0, 4), 5, C.red, { prof: 'tip', nb: 0 })); } });
    arrow(1400, 640, tx + 30, ty, seg(t, this.a1 - .1, this.a1 + .5), 331); cue(c, 'c3t', 'top', 1414, 636, t, this.a1, { size: 52, col: C.red });
    arrow(1400, 830, bx + 30, by, seg(t, this.a2 - .1, this.a2 + .5), 332); cue(c, 'c3b', 'bottom', 1414, 826, t, this.a2, { size: 52, col: C.red });
    title(c, 3, 'Four Sharp Teeth', t);
    label(c, 3, t);
    cue(c, 'c3a', 'Very sharp teeth', 110, 330, t, this.c1);
    cue(c, 'c3c', 'Front of the mouth', 110, 420, t, this.c2);
    cue(c, 'c3d', '2 on top + 2 on bottom', 110, 510, t, this.c3, { dur: 1.3 });
  },
};

// 4 · Living in a Big Group — a wide cutaway; the camera pans along the tunnels
SC[4] = {
  build() {
    const WW = 2500, bg = canvas(WW, H), c = bg.getContext('2d');
    withSeed(41, () => {
      washPoly(c, [[0, 0], [WW, 0], [WW, 260], [0, 260]], C.sky, .4, 3, 6);
      soilBg(c, 0, 250, WW, H, 42, { dots: 360 });
      tunnel(c, qctrl(-60, 600, 600, 470, 1250, 610, 30).concat(qctrl(1250, 610, 1900, 760, 2560, 560, 30).slice(1)), 120, 43);
      tunnel(c, qcurve(700, 560, 520, 850, 40, 14), 100, 44); tunnel(c, qcurve(1500, 660, 1650, 330, -40, 14), 96, 45);
      tunnel(c, qcurve(2050, 690, 2200, 900, 30, 12), 96, 46);
      for (const [x, y, rx, ry] of [[500, 860, 150, 80], [1660, 330, 140, 70], [2230, 900, 150, 74]]) { washPoly(c, blob(x, y, rx, ry, .1, 40, x), C.tunnel, .9, 3, 3); washPoly(c, blob(x, y + 6, rx * .8, ry * .6, .1, 40, y), '#f4e7cf', .5, 2, 3); }
    });
    for (let i = 0; i < 12; i++) withSeed(400 + i, () => { const x = 60 + i * 210 + rnd(-40, 40); drawList(c, grassTuft(42).map(s => (s.pts = s.pts.map(([a, b]) => [a + x, b + 256]), s))); });
    this.bg = bg; this.WW = WW;
    // mole rats of many sizes along the tunnels (world x, y, size, facing)
    this.rats = [[180, 612, .62, 1], [420, 560, .8, -1], [640, 540, .55, 1], [520, 880, .7, 1], [900, 575, .95, -1], [1180, 612, .6, 1], [1420, 680, .85, 1], [1640, 356, .7, -1], [1900, 742, 1.0, -1], [2160, 700, .62, 1], [2250, 922, .75, -1], [2420, 600, .58, -1]]
      .map(([x, y, k, f], i) => ({ x, y, f, o: O(410 + i, () => moleRat({ len: .9 + hash(i) * .25 }), k * .9) }));
    this.c1 = at('v16', 'many'); this.tB = this.c1 - .25; this.tM = at('v18', 'bees');
    this.bee = O(450, bee, 1.6); this.ant = O(451, ant, 1.9);
    ev(SL[4].A + .1, 'brush', { d: 1.3 }); ev(this.tB, 'burst', { d: 1 }); ev(this.c1, 'write'); ev(this.tM, 'brush', { d: .8 });
    this.key = VO.v19.e + .2;
  },
  draw(c, t) {
    const S = SL[4], dx = -lerp(80, this.WW - W - 80, eio(seg(t, S.A, S.t1 + .8)));
    camSet(c, 1, 960, 540, dx, 0);
    reveal(c, this.bg, -dx, 0, W, H, eio(seg(t, S.A + .1, S.A + 1.3)), 40);
    this.rats.forEach((r, i) => { const walk = Math.sin(t * .5 + i) * 18 * r.f, bob = Math.abs(Math.sin(t * 3 + i)) * 2; paint(c, r.o, seg(t, this.tB + i * .07, this.tB + i * .07 + .8), r.x + walk, r.y - bob, r.f); });
    camOff(c);
    banner(c, 4, t, 60, 1010, 112, C.soil2, 110, .55);
    title(c, 4, 'Living in a Big Group', t, 110, 134);
    label(c, 4, t);
    cue(c, 'c4a', 'Live with many others', 120, 330, t, this.c1);
    // a link back to slide 2: the bees and the ants
    const m = seg(t, this.tM - .1, this.tM + .7);
    if (m > 0) for (const [k, x, o] of [[0, 1480, this.bee], [1, 1680, this.ant]]) {
      withSeed(460 + k, () => { c.save(); washPoly(c, blob(x, 330, 82 * eo(m), 82 * eo(m), .06, 36, k), '#f3e6c6', .9, 3, 2); c.restore(); });
      paint(c, o, seg(m, .3, 1), x, 330);
    }
  },
};

// 5 · The Queen — the burrow with the queen and her babies at left; a big "100" at right
SC[5] = {
  build() {
    const bg = canvas(), c = bg.getContext('2d');
    withSeed(51, () => { panelWash(c, 100, 220, 900, 640, C.soil, .55); c.save(); clipR(c, 100, 220, 900, 640); soilBg(c, 100, 220, 1000, 860, 52, { dots: 120, amp: 10 }); washPoly(c, blob(550, 600, 400, 200, .08, 50, 4), C.tunnel, .92, 3, 3); washPoly(c, blob(550, 640, 330, 130, .1, 50, 8), '#f4e7cf', .5, 3, 3); c.restore(); });
    this.bg = bg;
    this.queen = O(501, () => moleRat({ len: 1.4 }), 1.4);
    this.crown = O(502, () => { const S = [mk(qcurve(-30, 0, 30, 0, 0, 8), 12, C.ochre, { prof: 'even', nb: 3 })]; for (const x of [-26, 0, 26]) S.push(mk(qcurve(x, 2, x * .8, -30, 0, 5), 12, C.ochre, { prof: 'tip', nb: 3 })); return S; }, 1.2);
    this.babies = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + .2, x = 560 + Math.cos(a) * 330, y = 610 + Math.sin(a) * 120 + (Math.sin(a) > 0 ? 50 : 0); this.babies.push({ x, y, f: Math.cos(a) > 0 ? -1 : 1, o: O(510 + i, () => moleRat({ len: .8 }), .36) }); }
    this.tQ = SL[5].A + .6; this.tB = at('v20', 'babies'); this.tC = at('v21', 'queen');
    this.n1 = at('v22', 'number'); this.c2a = at('v23', 'up'); this.c2b = at('v23', 'babies');
    ev(SL[5].A + .1, 'brush', { d: 1.2 }); ev(this.tQ, 'brush', { d: 2.2 }); ev(this.tB, 'squeak', { n: 6 }); ev(at('v24', 'babies'), 'squeak', { n: 5 }); ev(this.tC, 'ding'); ev(this.tC, 'write'); ev(this.n1, 'brush', { d: 1 }); ev(this.c2a, 'write');
    this.key = VO.v23.e + .4;
  },
  draw(c, t) {
    const S = SL[5];
    camSet(c, lerp(1, 1.03, seg(t, S.t0, S.t1)), 550, 600);
    reveal(c, this.bg, 90, 210, 920, 660, eio(seg(t, S.A + .1, S.A + 1.3)), 50);
    c.save(); clipR(c, 100, 220, 900, 640);
    const wig = seg(t, at('v24', 'babies') - .2, at('v24', 'babies') + .2) > 0 && t < VO.v24.e + 1;
    this.babies.forEach((b, i) => paint(c, b.o, seg(t, this.tB + i * .06, this.tB + i * .06 + .5), b.x + (wig ? Math.sin(t * 9 + i) * 3 : 0), b.y + (i % 3) * 4, b.f));
    paint(c, this.queen, seg(t, this.tQ, this.tQ + 2.2), 600, 660 + Math.sin(t * 1.5) * 1.5);
    paint(c, this.crown, seg(t, this.tC - .1, this.tC + .6), 808, 552 - Math.sin(t * 1.5) * 1.5, 1, .12);
    c.restore();
    camOff(c);
    title(c, 5, 'The Queen Mole Rat', t);
    label(c, 5, t);
    cue(c, 'c5a', 'One mother = the “queen”', 1080, 300, t, this.tC, { size: 56 });
    // the big number callout
    const p = seg(t, this.n1 - .1, this.n1 + .8);
    if (p > 0) {
      withSeed(530, () => washPoly(c, blob(1400, 640, 260 * eo(p), 150 * eo(p), .08, 40, 3), '#f2d7b5', .7, 3, 4));
      c.save(); c.font = '600 250px "Cormorant Garamond"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      const w = c.measureText('100').width; c.beginPath(); c.rect(1400 - w / 2 - 20, 440, (w + 40) * eio(p), 300); c.clip();
      c.fillStyle = rgba(C.red, .55); c.fillText('100', 1400, 720); c.fillStyle = rgba('#b8401f', .45); c.fillText('100', 1403, 723); c.restore();
      TX.push({ id: 'c5n', text: 'Up to 100 babies a year', x0: 1180, y0: 470, x1: 1620, y1: 800 });
    }
    cue(c, 'c5u', 'up to', 1400, 470, t, this.c2a, { align: 'center', size: 48 });
    cue(c, 'c5b', 'babies a year', 1400, 780, t, this.c2b, { align: 'center', size: 60, ul: true });
  },
};

// 6 · Helping the Queen — three frames in a row, one cue under each
SC[6] = {
  build() {
    const bg = canvas(), c = bg.getContext('2d');
    withSeed(61, () => STRIP.forEach((x, i) => { panelWash(c, x, 240, SW, 460, C.soil, .5); c.save(); clipR(c, x, 240, SW, 460); soilBg(c, x, 240, x + SW, 700, 62 + i, { dots: 50, amp: 10 }); washPoly(c, blob(x + 240, 520, 300, 120, .08, 40, i), C.tunnel, .92, 3, 3); c.restore(); }));
    this.bg = bg;
    this.worker = O(601, () => moleRat({ mouth: true }), .85); this.root = O(602, () => root(70, { w: 8, bend: 4 }), 1);
    this.queen = O(603, () => moleRat({ len: 1.4 }), .8); this.guard = O(604, () => moleRat({ head: 18 }), .9);
    this.nurse = O(605, () => moleRat(), .9); this.babies = [0, 1, 2, 3, 4].map(i => O(610 + i, () => moleRat({ len: .8 }), .3));
    const S = SL[6]; this.tP = [S.A + .15, S.A + .55, S.A + .95];
    this.c = [at('v27', 'food'), at('v28', 'safe'), at('v29', 'care')];
    this.foc = [[VO.v27.s - .1, VO.v27.e, [0]], [VO.v28.s - .1, VO.v28.e, [1]], [VO.v29.s - .1, VO.v29.e, [2]]];
    this.tP.forEach(x => ev(x, 'brush', { d: 1.6 })); this.c.forEach(x => ev(x, 'write'));
    this.key = VO.v29.e + .4;
  },
  draw(c, t) {
    camSet(c, 1, 960, 540);
    for (let i = 0; i < 3; i++) {
      const x = STRIP[i], p = eio(seg(t, this.tP[i], this.tP[i] + 1.1)), a = focusA(t, this.foc, i), q = seg(t, this.tP[i] + .4, this.tP[i] + 2.0);
      c.save(); c.globalAlpha = a; reveal(c, this.bg, x - 10, 230, SW + 20, 480, p, 60 + i);
      c.save(); clipR(c, x, 240, SW, 460);
      if (i === 0) {
        paint(c, this.queen, q, x + 520, 580, -1);
        const wx = x + 110 + 60 * eio(seg(t, VO.v27.s, VO.v27.e + .5)), bob = Math.abs(Math.sin(t * 5)) * 2 * seg(t, VO.v27.s, VO.v27.s + .2) * (1 - seg(t, VO.v27.e + .4, VO.v27.e + .6));
        paint(c, this.root, q, wx + 140, 545 - bob, 1, -1.3); paint(c, this.worker, q, wx, 590 - bob);
      }
      if (i === 1) { paint(c, this.queen, q, x + 170, 590); paint(c, this.guard, seg(q, .3, 1), x + 330, 600 - Math.max(0, Math.sin(t * 1.3)) * 3); }
      if (i === 2) {
        paint(c, this.nurse, q, x + 170, 590 + Math.sin(t * 2.4) * 2, 1, Math.sin(t * 2.4) * .03);
        this.babies.forEach((b, k) => paint(c, b, seg(q, .3 + k * .1, .7 + k * .1), x + 320 + (k % 3) * 46, 560 + Math.floor(k / 3) * 46 + Math.sin(t * 6 + k) * 1.5, k % 2 ? -1 : 1));
      }
      c.restore(); c.restore();
    }
    camOff(c);
    title(c, 6, 'Helping the Queen', t);
    label(c, 6, t);
    ['Bring food', 'Keep her safe', 'Care for her babies'].forEach((s, i) => cue(c, 'c6' + i, s, STRIP[i] + SW / 2, 790, t, this.c[i], { align: 'center' }));
  },
};

// 7 · Everyone Has a Job — a circle of three sizes, each with an arrow to its job
SC[7] = {
  build() {
    this.ring = O(701, () => { const S = []; for (let k = 0; k < 3; k++) { const pts = []; const a0 = k * 2.1 + .3; for (let i = 0; i <= 30; i++) { const a = a0 + i / 30 * 2.6; pts.push([Math.cos(a) * 255, Math.sin(a) * 255]); } S.push(mk(pts, 30, C.ochre, { prof: 'leaf', nb: 6, a: .55 })); } return S; });
    this.R = [[983, 690, .5, 'Small'], [1200, 330, .78, 'Big'], [1420, 690, 1.0, 'Biggest']].map(([x, y, k, n], i) => ({ x, y, n, k, o: O(710 + i, () => moleRat(), k) }));
    this.icons = [[760, 860, O(720, tuber, 1.3)], [1330, 150, O(721, mound, 1.1)], [1680, 860, O(722, shield, .95)]];
    this.tR = SL[7].A + .2; this.tS = [at('v31', 'small'), at('v31', 'big'), at('v31', 'biggest')]; this.tJ = at('v32', 'job');
    this.c1 = at('v31', 'small'); this.c2 = at('v32', 'size');
    ev(this.tR, 'brush', { d: 1.2 }); this.tS.forEach(x => ev(x, 'brush', { d: .8 })); [0, 1, 2].forEach(i => ev(this.tJ + i * .35, 'pop')); ev(this.c1, 'write'); ev(this.c2, 'write');
    this.key = VO.v33.e + .2;
  },
  draw(c, t) {
    camSet(c, lerp(1.03, 1, eio(seg(t, SL[7].A, SL[7].t1))), 1200, 560);
    paint(c, this.ring, seg(t, this.tR, this.tR + 1.2), 1200, 560);
    this.R.forEach((r, i) => {
      paint(c, r.o, seg(t, this.tS[i] - .15, this.tS[i] + .7), r.x - 20 * r.k, r.y + 30 * r.k);
      cue(c, 'c7n' + i, r.n, r.x, r.y + 78 * r.k + 18, t, this.tS[i], { align: 'center', size: 42, dur: .5 });
      const [ix, iy, io] = this.icons[i], pj = seg(t, this.tJ + i * .35, this.tJ + i * .35 + .6);
      const sx = i === 1 ? r.x + 60 : r.x + (ix - r.x) * .3, sy = i === 1 ? r.y - 50 : r.y + 110 * r.k + 14, ex = lerp(sx, ix, .78), ey = lerp(sy, iy, .78);
      withSeed(730 + i, () => { drawS(c, mk(qcurve(sx, sy, ex, ey, i === 2 ? -20 : 20, 12), 4.5, INK2, { prof: 'even', nb: 0, a: .8 }), pj); if (pj >= 1) { const a = Math.atan2(ey - sy, ex - sx); for (const d of [-.5, .5]) drawS(c, mk(polar(ex, ey, a + Math.PI + d, 18, 0, 4), 4.5, INK2, { prof: 'tip', nb: 0 })); } });
      paint(c, io, seg(pj, .4, 1), ix, iy);
    });
    camOff(c);
    title(c, 7, 'Everyone Has a Job', t);
    label(c, 7, t);
    cue(c, 'c7a', 'Small → big → biggest', 110, 380, t, this.c1, { dur: 1.4 });
    cue(c, 'c7b', 'Each size, one job', 110, 470, t, this.c2);
  },
};

// 8 · Small Mole Rats' Jobs — two frames side by side, cues in the strip between title and frames
const PAIR = [110, 1010], PW = 800;
SC[8] = {
  build() {
    const bg = canvas(), c = bg.getContext('2d');
    withSeed(81, () => PAIR.forEach((x, i) => { panelWash(c, x, 300, PW, 540, C.soil, .5); c.save(); clipR(c, x, 300, PW, 540); soilBg(c, x, 300, x + PW, 840, 82 + i, { dots: 80, amp: 12 }); tunnel(c, qcurve(x - 40, 640 + i * 10, x + PW + 40, 610, -30, 16), 170, 85 + i); c.restore(); }));
    this.bg = bg;
    this.small1 = O(801, () => moleRat({ mouth: true }), .9); this.root = O(802, () => root(80, { w: 9, bend: 6 }), 1);
    this.small2 = O(803, () => moleRat({ head: -8 }), .9);
    this.dirt = withSeed(804, () => { const L = []; for (let i = 0; i < 22; i++) L.push({ x: rnd(0, 70), y: -rnd(0, 34) * (1 - i / 30), r: rnd(5, 11), col: pick([C.soil2, C.soil3, C.soil]) }); return L; });
    const S = SL[8]; this.tP = [S.A + .15, S.A + .6];
    this.c = [at('v35', 'find'), at('v36', 'clean')];
    this.foc = [[VO.v35.s - .1, VO.v35.e, [0]], [VO.v36.s - .1, VO.v36.e, [1]]];
    this.tP.forEach(x => ev(x, 'brush', { d: 1.6 })); this.c.forEach(x => ev(x, 'write')); ev(VO.v36.s + .3, 'scrape', { d: 2.4 });
    this.key = VO.v36.e + .3;
  },
  draw(c, t) {
    camSet(c, 1, 960, 540);
    for (let i = 0; i < 2; i++) {
      const x = PAIR[i], p = eio(seg(t, this.tP[i], this.tP[i] + 1.1)), a = focusA(t, this.foc, i), q = seg(t, this.tP[i] + .4, this.tP[i] + 2.0);
      c.save(); c.globalAlpha = a; reveal(c, this.bg, x - 10, 290, PW + 20, 560, p, 80 + i);
      c.save(); clipR(c, x, 300, PW, 540);
      const go = eio(seg(t, i ? VO.v36.s : VO.v35.s, (i ? VO.v36.e : VO.v35.e) + 1)), bob = Math.abs(Math.sin(t * 5)) * 2;
      if (i === 0) { const wx = x + 220 + go * 220; paint(c, this.root, q, wx + 150, 615 - bob, 1, -1.35); paint(c, this.small1, q, wx, 680 - bob); }
      else {
        const wx = x + 200 + go * 260;
        for (const d of this.dirt) withSeed(820 + Math.round(d.x), () => drawS(c, mk(qcurve(wx + 150 + d.x, 680 + d.y, wx + 150 + d.x + d.r, 678 + d.y, 0, 3), d.r, d.col, { prof: 'leaf', nb: 0, a: .85 }), q));
        paint(c, this.small2, q, wx, 684 - bob * .6);
      }
      c.restore(); c.restore();
    }
    camOff(c);
    title(c, 8, 'Small Mole Rats’ Jobs', t);
    label(c, 8, t);
    cue(c, 'c80', 'Find food', PAIR[0] + PW / 2, 236, t, this.c[0], { align: 'center' });
    cue(c, 'c81', 'Keep the tunnel clean', PAIR[1] + PW / 2, 236, t, this.c[1], { align: 'center' });
  },
};

// 9 · Big Diggers, Biggest Guards — two frames; the right one holds the biggest, bigger
SC[9] = {
  build() {
    const bg = canvas(), c = bg.getContext('2d');
    withSeed(91, () => {
      PAIR.forEach((x, i) => { panelWash(c, x, 210, PW, 560, C.soil, .5); c.save(); clipR(c, x, 210, PW, 560); soilBg(c, x, 210, x + PW, 770, 92 + i, { dots: 80, amp: 12 }); c.restore(); });
      c.save(); clipR(c, PAIR[0], 210, PW, 560); tunnel(c, qcurve(PAIR[0] - 40, 560, PAIR[0] + 640, 540, -20, 16), 210, 95); washPoly(c, blob(PAIR[0] + 650, 540, 70, 105, .15, 30, 3), C.soil2, .55, 3, 4); c.restore();
      c.save(); clipR(c, PAIR[1], 210, PW, 560); tunnel(c, qcurve(PAIR[1] - 40, 580, PAIR[1] + PW + 60, 520, -20, 16), 230, 96);
      washPoly(c, blob(PAIR[1] + 720, 500, 110, 140, .1, 30, 5), '#f6ecd6', .9, 3, 3); for (let k = 0; k < 5; k++) drawS(c, mk(polar(PAIR[1] + 720, 380, -Math.PI / 2 + rnd(-.8, .8), 40, 0, 4), 5, C.grass, { prof: 'tip', nb: 0 })); c.restore();
    });
    this.bg = bg;
    this.big = O(901, () => moleRat(), 1.25);
    this.biggest = O(902, () => moleRat({ head: 16, len: 1.1 }), 1.55);
    this.smalls = [0, 1].map(i => O(903 + i, () => moleRat(), .6));
    this.queen = O(905, () => moleRat({ len: 1.4 }), .6);
    this.flying = withSeed(906, () => { const L = []; for (let i = 0; i < 16; i++) L.push({ ph: rnd(0, 1), vx: rnd(-260, -120), vy: rnd(-260, -120), r: rnd(5, 10), col: pick([C.soil2, C.soil3]) }); return L; });
    const S = SL[9]; this.tP = [S.A + .15, S.A + .6];
    this.c = [at('v39', 'dig'), at('v40', 'safe')]; this.tBig = at('v38', 'bigger'); this.tQ = at('v40', 'queen');
    this.foc = [[VO.v39.s - .1, VO.v39.e, [0]], [VO.v40.s - .1, VO.v40.e, [1]]];
    this.tP.forEach(x => ev(x, 'brush', { d: 1.6 })); this.c.forEach(x => ev(x, 'write')); ev(VO.v39.s, 'dig', { d: VO.v40.e - VO.v39.s }); ev(this.tQ, 'brush', { d: .7 });
    this.key = VO.v40.e + .3;
  },
  draw(c, t) {
    camSet(c, 1, 960, 540);
    for (let i = 0; i < 2; i++) {
      const x = PAIR[i], p = eio(seg(t, this.tP[i], this.tP[i] + 1.1)), a = focusA(t, this.foc, i), q = seg(t, this.tP[i] + .4, this.tP[i] + 2.0);
      c.save(); c.globalAlpha = a;
      if (i === 1) { const z = lerp(1, 1.05, eio(seg(t, this.c[1] - .6, this.c[1] + .8))); c.translate(x + 560, 600); c.scale(z, z); c.translate(-(x + 560), -600); }
      reveal(c, this.bg, x - 10, 200, PW + 20, 580, p, 90 + i);
      c.save(); clipR(c, x, 210, PW, 560);
      if (i === 0) {
        const dig = t > VO.v37.s && t < SL[9].B ? 1 : 0, sh = dig * Math.sin(t * 14) * .04;
        paint(c, this.big, q, x + 400, 640, 1, sh);
        if (dig && q >= 1) for (const d of this.flying) { const u = (t * 1.3 + d.ph) % 1; c.save(); c.translate(x + 560 + d.vx * u * 1.4, 590 + d.vy * u + 300 * u * u); c.globalAlpha *= 1 - u; withSeed(950 + Math.round(d.ph * 100), () => drawS(c, mk(qcurve(0, 0, d.r, 0, 0, 3), d.r, d.col, { prof: 'leaf', nb: 0, a: .9 }))); c.restore(); }
      } else {
        paint(c, this.queen, seg(t, this.tQ - .1, this.tQ + .6), x + 150, 560, 1);
        this.smalls.forEach((o, k) => paint(c, o, seg(q, .2 + k * .1, .7 + k * .1), x + 140 + k * 130, 640 + k * 20));
        paint(c, this.biggest, q, x + 500, 670 - Math.max(0, Math.sin(t * 1.4)) * 3);
      }
      c.restore(); c.restore();
    }
    camOff(c);
    // "which one is bigger?" — a vermilion size bar beside the biggest
    withSeed(960, () => drawS(c, mk(qcurve(1790, 690, 1790, 470, 0, 10), 7, C.red, { prof: 'even', nb: 2, a: .8 }), seg(t, this.tBig - .2, this.tBig + .5) * (1 - seg(t, VO.v39.s, VO.v39.s + .3))));
    title(c, 9, 'Big Diggers, Biggest Guards', t);
    label(c, 9, t);
    cue(c, 'c90', 'Big → “dig”', PAIR[0] + PW / 2, 840, t, this.c[0], { align: 'center' });
    cue(c, 'c91', 'Biggest → keep all safe', PAIR[1] + PW / 2, 840, t, this.c[1], { align: 'center', dur: 1.2 });
  },
};

// 10 · Dig and Dig — a tall cutaway at left; the camera tilts down the tunnels to the root; cues at right
SC[10] = {
  build() {
    const PH = 1500, cv = canvas(720, PH), c = cv.getContext('2d');
    withSeed(1001, () => {
      washPoly(c, [[0, 0], [720, 0], [720, 140], [0, 140]], C.sky, .5, 3, 4);
      soilBg(c, 0, 130, 720, PH, 1002, { dots: 260 });
      tunnel(c, qctrl(120, 150, 40, 500, 330, 620, 20), 86, 1003);
      tunnel(c, qctrl(330, 620, 650, 740, 520, 1000, 20), 86, 1004);
      tunnel(c, qctrl(520, 1000, 600, 1300, -10, 1290, 24), 130, 1005);
      tunnel(c, qcurve(330, 620, 140, 820, 20, 10), 70, 1006);
      for (let k = 0; k < 8; k++) drawS(c, mk(polar(60 + k * 80, 132, -Math.PI / 2 + rnd(-.5, .5), rnd(26, 50), 0, 4), 5, C.grass, { prof: 'tip', nb: 0 }));
      for (const [x, y, l] of [[260, 140, 160], [600, 140, 220], [140, 150, 300]]) drawList(c, root(l, { w: 5 }).map(s => (s.pts = s.pts.map(([a, b]) => [a + x, b + y]), s)));
    });
    this.cv = cv; this.PH = PH;
    this.bg = canvas(); withSeed(1010, () => panelWash(this.bg.getContext('2d'), 110, 200, 720, 700, C.soil, .4));
    this.root = O(1011, () => root(92, { w: 11, bend: 8 }), 1); this.rat = O(1012, () => moleRat(), .95);
    this.tP = SL[10].t0 - .3; this.c1 = at('v43', 'dig'); this.c2 = at('v44', 'roots'); this.tI = at('v45', 'idea');
    ev(SL[10].A + .1, 'brush', { d: 1.3 }); ev(this.c1, 'write'); ev(this.c2, 'write'); ev(this.tI, 'brush', { d: .8 }); ev(VO.v42.s, 'gnaw', { d: 3 });
    this.key = VO.v44.e + .4;
  },
  draw(c, t) {
    const S = SL[10], X = 110, Y = 200, oy = -lerp(0, this.PH - 700, eio(seg(t, S.t0 - .6, VO.v42.s + .6)));
    camSet(c, 1, 960, 540);
    reveal(c, this.bg, 100, 190, 740, 720, eio(seg(t, S.A + .1, S.A + 1.2)), 100);
    c.save(); clipR(c, X, Y, 720, 700, 26); c.globalAlpha = eio(seg(t, S.A + .3, S.A + 1.4));
    c.drawImage(this.cv, X, Y + oy); c.globalAlpha = 1;
    // the root hanging from the tunnel roof, the mole rat gnawing it
    const rx = X + 330, ry = Y + oy + 1232, g = Math.sin(t * 9) * .05 * (t > VO.v42.s ? 1 : 0);
    paint(c, this.rat, seg(t, S.t0 + .3, S.t0 + 1.6), rx - 165, ry + 120, 1, g);
    paint(c, this.root, seg(t, S.t0, S.t0 + 1), rx, ry - 6, 1, .05);
    c.restore();
    camOff(c);
    title(c, 10, 'Dig and Dig', t);
    label(c, 10, t);
    cue(c, 'c10a', 'Dig and dig', 930, 380, t, this.c1);
    cue(c, 'c10b', 'Scientists’ idea: roots to eat', 930, 480, t, this.c2, { dur: 1.3 });
    // "it is only an idea": a painted question mark
    const p = seg(t, this.tI - .1, this.tI + .8);
    if (p > 0) { c.save(); c.font = '700 190px Caveat'; c.textAlign = 'center'; c.beginPath(); c.rect(1440, 560, 200, 260 * eo(p)); c.clip(); c.fillStyle = rgba(C.red, .62); c.fillText('?', 1540, 760); c.restore(); }
  },
};

// 11 · Mole Rats in Zoos — the glass, a clear tunnel, children watching; recap of the strange facts; end card
SC[11] = {
  build() {
    const bg = canvas(), c = bg.getContext('2d');
    withSeed(1101, () => {
      washPoly(c, [[0, 0], [W, 0], [W, H], [0, H]], '#d9d6c4', .45, 3, 6);
      washPoly(c, rrect(140, 150, 1640, 640, 18), '#eef0e6', .7, 3, 3);
      soilBg(c, 150, 600, 1770, 785, 1102, { dots: 120, amp: 20 });
      const tube = qctrl(150, 420, 900, 640, 1770, 400, 60), s = mk(tube, 130, C.glass, { prof: 'even', nb: 0, a: .35, rough: .08 }); drawS(c, s);
      drawS(c, edgeOf(s, 1, 4, C.glassD, .55)); drawS(c, edgeOf(s, -1, 4, C.glassD, .45));
      washPoly(c, rrect(140, 150, 1640, 640, 18), C.glass, .18, 2, 2);
      for (let k = 0; k < 4; k++) { const x = 300 + k * 420; drawS(c, mk(qcurve(x, 190, x + 160, 740, 0, 8), 26, '#ffffff', { prof: 'even', nb: 0, a: .22 })); }
      const fr = mk(rrect(140, 150, 1640, 640, 18).concat([[140 + 18, 150]]), 16, '#6d6a5e', { prof: 'even', nb: 3, a: .6, rough: .1 }); drawS(c, fr);
    });
    this.bg = bg;
    this.tube = qctrl(150, 420, 900, 640, 1770, 400, 60);
    this.rats = [0, 1, 2, 3].map(i => O(1110 + i, () => moleRat(), .62));
    this.kids = [O(1120, () => child('#6d93b0', '#4a3426'), 1), O(1121, () => child('#cf7a52', '#2e2420'), .9)];
    this.keeper = O(1122, keeper, 1.15);
    this.med = [O(1130, () => moleRat(), .55), O(1131, bee, 2.4), null];
    this.smallRat = O(1140, () => moleRat(), .5);
    this.c1 = at('v46', 'zoos'); this.tR = [at('v48', 'fur'), at('v48', 'bees'), at('v48', 'hundred')]; this.tRe = VO.v49.e;
    this.tRecap = VO.v47.s;
    ev(SL[11].A + .1, 'brush', { d: 1.3 }); ev(this.c1, 'write'); ev(this.tRecap, 'mist', { d: 1 }); this.tR.forEach(x => ev(x, 'pop'));
    ev(END.mist, 'mist', { d: 1.4 }); ev(END.card + .2, 'write'); ev(END.card + 1.6, 'write'); ev(END.card + 1.2, 'brush', { d: 3 });
    this.key = Math.min(this.c1 + 1.5, this.tRecap - .05);
  },
  draw(c, t) {
    const S = SL[11], z = lerp(1.1, 1, eio(seg(t, S.A, VO.v46.e)));
    camSet(c, z, 960, 470);
    reveal(c, this.bg, 0, 0, W, H, eio(seg(t, S.A + .1, S.A + 1.3)), 110);
    c.save(); c.beginPath(); c.rect(150, 160, 1620, 620); c.clip();
    this.rats.forEach((o, i) => { const u = ((t * .028 + i * .26) % 1.2) - .1, k = clamp(u, 0, 1) * 59, j = Math.min(59, Math.floor(k)), f = k - j, a = this.tube[j], b = this.tube[j + 1]; const x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f); paint(c, o, seg(t, S.A + .8 + i * .2, S.A + 1.8 + i * .2), x, y + 30 + Math.abs(Math.sin(t * 4 + i)) * -2, 1, Math.atan2(b[1] - a[1], b[0] - a[0]) * .5); });
    c.restore();
    paint(c, this.keeper, seg(t, S.A + 1, S.A + 2.2), 1660, 930);
    paint(c, this.kids[0], seg(t, S.A + 1.2, S.A + 2.4), 290, 990);
    paint(c, this.kids[1], seg(t, S.A + 1.4, S.A + 2.6), 500, 1020);
    camOff(c);
    // the title overlaid at the bottom, on a paper band
    const tb = eio(seg(t, S.A + .3, S.A + 1.1));
    if (tb > 0) withSeed(1150, () => drawS(c, mk(qcurve(640, 862, 1280, 858, -4, 16), 92, '#f3ead8', { prof: 'even', nb: 6, a: .9 }), tb));
    title(c, 11, 'Mole Rats in Zoos', t, 960, 884, { align: 'center', size: 62 });
    label(c, 11, t);
    cue(c, 'c11a', 'Now seen in zoos', 1230, 250, t, this.c1);
    // recap: the zoo fades back; three strange facts come back from slide 1
    const r = seg(t, this.tRecap, this.tRecap + 1);
    if (r > 0 && t < END.mist + 1.4) {
      c.save(); c.globalAlpha = .82 * eio(r); c.drawImage(PAPER_IMG, 0, 0); c.restore();
      const xs = [560, 960, 1360], caps = ['no fur', 'lives like bees', '100 babies a year'];
      xs.forEach((x, i) => {
        const p = seg(t, this.tR[i] - .2, this.tR[i] + .6); if (p <= 0) return;
        withSeed(1160 + i, () => washPoly(c, blob(x, 450, 140 * eo(p), 140 * eo(p), .06, 40, i), ['#f0d6c8', '#f3e3b8', '#f2d7b5'][i], .85, 3, 3));
        if (i < 2) paint(c, this.med[i], seg(p, .3, 1), x + (i ? 0 : 10), i ? 450 : 495);
        else { c.save(); c.font = '600 120px "Cormorant Garamond"'; c.textAlign = 'center'; c.fillStyle = rgba(C.red, .6 * seg(p, .3, 1)); c.fillText('100', x, 490); c.restore(); }
        cue(c, 'c11r' + i, caps[i], x, 640, t, this.tR[i] + .1, { align: 'center', size: 50 });
      });
    }
  },
};

// the end card: mist to paper, the title again, the teacher's line by hand, a small mole rat walks under it
function endCard(c, t) {
  const m = eio(seg(t, END.mist, END.card));
  if (m <= 0) return;
  for (const [lift, a] of [[120, .6], [0, 1]]) {
    const top = 1180 - m * 1450 - lift;
    c.save(); c.beginPath(); c.moveTo(-10, 1100);
    for (let x = -10; x <= W + 40; x += 40) c.lineTo(x, top + (vnoise(x * .006 + lift) - .5) * 160 + Math.sin(x * .01 + t) * 12);
    c.lineTo(W + 10, 1100); c.closePath(); c.clip(); c.globalAlpha = a; c.drawImage(PAPER_IMG, 0, 0); c.restore();
  }
  const T = END.card;
  if (t < T) return;
  c.save(); c.font = 'italic 500 132px "Cormorant Garamond"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const w = c.measureText('Mole Rats').width; c.save(); c.beginPath(); c.rect(960 - w / 2 - 20, 300, (w + 40) * eio(seg(t, T + .1, T + 1.5)), 200); c.clip(); c.fillStyle = INK; c.fillText('Mole Rats', 960, 450); c.restore();
  TX.push({ id: 'end', text: 'Mole Rats', x0: 960 - w / 2, y0: 340, x1: 960 + w / 2, y1: 470 });
  c.restore();
  cue(c, 'endA', 'Andrew Classes', 960, 560, t, T + 1.5, { align: 'center', size: 64, dur: 1.4 });
  // a little mole rat walks across, well below the hand-written line
  const u = seg(t, T + 1.2, DUR_ - .4), x = lerp(520, 1400, u);
  paint(c, SC[11].smallRat, seg(t, T + 1.2, T + 2.2), x, 760 + Math.abs(Math.sin(t * 6)) * -2);
  withSeed(1170, () => drawS(c, mk(qcurve(420, 768, 1500, 766, -3, 30), 4, C.soil2, { prof: 'even', nb: 0, a: .5 }), seg(t, T + 1.0, T + 2.4)));
  const a = ss(seg(t, T + 1.6, T + 2.2)); if (a > 0) {
    c.save(); c.globalAlpha = a; c.font = '400 20px "IBM Plex Mono"'; c.letterSpacing = '2px'; c.textAlign = 'center'; c.fillStyle = rgba(INK, .78);
    c.fillText('Music: Kevin MacLeod (incompetech.com) · CC BY 4.0', 960, 960); c.restore();
    TX.push({ id: 'credit', text: 'Music: Kevin MacLeod (incompetech.com) · CC BY 4.0', x0: 560, y0: 940, x1: 1360, y1: 970 });
  }
}

// ───────────────────────── subtitles ─────────────────────────
function wrap(c, txt, maxW) {
  if (c.measureText(txt).width <= maxW) return [txt];
  const words = txt.split(' '); let best = null;
  for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), m = Math.max(c.measureText(a).width, c.measureText(b).width); if (!best || m < best[0]) best = [m, a, b]; }
  return [best[1], best[2]];
}
function drawSubs(c, t) {
  const ids = LINES.map(l => l.id);
  ids.forEach((id, n) => {
    const V = VO[id], nx = ids[n + 1] ? VO[ids[n + 1]].s - .12 : V.e + .6, f = fade2(t, V.s - .15, Math.min(V.e + .5, nx), .2, .2); if (f <= 0) return;
    c.save(); c.globalAlpha = f; c.textBaseline = 'alphabetic'; c.font = 'italic 500 42px "Cormorant Garamond"';
    const lines = wrap(c, V.text, 1500), y0 = lines.length > 1 ? 966 : 1010, kw = KW[id] || [];
    let wi = 0;
    lines.forEach((ln, li) => {
      const tk = ln.split(' '), sp = c.measureText(' ').width, tw = c.measureText(ln).width; let x = 960 - tw / 2;
      for (const w of tk) {
        const ww = c.measureText(w).width, k = kw.find(([a, b]) => wi >= a && wi <= b), y = y0 + li * 46;
        let col = INK, hl = 0;
        if (k) { const ts = wordTime(id, k[0]), te = wordTime(id, k[1], true); hl = seg(t, ts - .05, ts + .2); col = mixc(INK, '#b8401f', hl); if (hl > 0) withSeed(2000 + wi, () => drawS(c, mk(qcurve(x - 2, y + 10, x + ww + 4, y + 8, -2, 8), 7, C.red, { prof: 'even', nb: 3, a: .55 }), seg(t, ts, te + .15))); }
        c.shadowColor = rgba(PAPER, 1); c.shadowBlur = 18; c.fillStyle = col; c.fillText(w, x, y); c.shadowBlur = 0; c.fillText(w, x, y);
        x += ww + sp; wi++;
      }
    });
    c.restore();
  });
}

// ───────────────────────── frame ─────────────────────────
function render(t) {
  TX = [];
  const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.drawImage(PAPER_IMG, 0, 0);
  let cur = 1; for (let s = 1; s <= 11; s++) if (t >= SL[s].A) cur = s;
  const s = cur;
  if (s > 1 && t < SL[s].A + .95) {
    // brush-edge wipe: the previous page stays, the new page is painted over it from the left
    SC[s - 1].draw(c, t); camOff(c);
    const p = eio(seg(t, SL[s].A, SL[s].A + .95));
    c.save(); wipeClip(c, 0, 0, W, H, p, s * 7); c.drawImage(PAPER_IMG, 0, 0); TX = []; SC[s].draw(c, t); camOff(c); c.restore();
  } else SC[s].draw(c, t);
  camOff(c);
  endCard(c, t);
  if (!NOSUBS && t < END.mist + .5) drawSubs(c, t);
}

async function init() {
  ctx = document.getElementById('c').getContext('2d');
  const J = async (u, opt) => { try { const r = await fetch(u); if (!r.ok) throw 0; return await r.json(); } catch { if (opt) return null; throw new Error('missing ' + u); } };
  LINES = await J('lines.json'); KB = await J('kich-ban.json');
  DURS = await J('voices/dur.json', true); WORDS = await J('voices/words.json', true);
  PAPER_IMG = new Image(); PAPER_IMG.src = 'paper.jpg'; await PAPER_IMG.decode();
  await Promise.all(['600 64px "Cormorant Garamond"', 'italic 500 42px "Cormorant Garamond"', 'italic 500 132px "Cormorant Garamond"', '600 58px Caveat', '700 190px Caveat', '400 20px "IBM Plex Mono"'].map(f => document.fonts.load(f)));
  await HINH.nap();   // ảnh chuột/ong/kiến kiểu sách giáo khoa (hinh.js)
  timing(); keywords();
  for (let s = 1; s <= 10; s++) {   // pass 1: find each page's last cue, hold the page until it can be read
    SC[s].build(); CUES = []; SC[s].draw(ctx, SL[s].t0 + .5); CUES.push(...[]); camOff(ctx);
    let need = 0; for (const [t0, txt] of CUES) need = Math.max(need, t0 + txt.replace(/\s/g, '').length / 15 + 1.9);
    EXTRA[s] = Math.max(0, need - SL[s + 1].A); CUES = null;
  }
  for (const k in VO) delete VO[k]; for (const k in SL) delete SL[k]; EVS.length = 0;
  timing();
  for (let s = 1; s <= 11; s++) { SC[s].build(); ev(SL[s].A, 'wipe', { slide: s }); ev(Math.min(SC[s].key, s < 11 ? SL[s + 1].A - .3 : 1e9), 'key', { slide: s }); }
  for (const L of LINES) ev(VO[L.id].s, 'vo', { id: L.id });
  for (let s = 1; s <= 11; s++) ev(SL[s].A, 'page', { slide: s });   // slide start, for music placement
  ev(END.mist, 'endmist', {});
  window.DUR = DUR_; window.EV = EVS.sort((a, b) => a.t - b.t);
  window.VO = VO; window.SL = SL; window.END = END; window.KW = KW;
  window.TEXTS = t => { render(t); return TX.slice(); };
  window.render = render;
  window.setSubs = on => { NOSUBS = !on; };   // the player's CC button
  window.READY = true;
}
init();
