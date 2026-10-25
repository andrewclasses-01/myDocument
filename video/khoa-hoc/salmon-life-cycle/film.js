// "The Salmon Circle" — Whiteboard Explainer. One board, no hands, no cuts.
// The pen follows one salmon from a gravel nest down the river to the sea and back up a waterfall;
// only the final pull-back shows the path was a circle all along. Times in seconds; beats hang off spoken words via at().
import * as W from './engine/wb.js';
import { clamp, lerp, mulberry } from './lib.js';

const { INK } = W;
export const BPM = 96, BEAT = 60 / BPM;
export const VO = { v1: 0.5, v2: 5.1, v3: 8.5, v4: 12.6, v5: 18.9, v6: 23.15, v7: 28.85 };
export const SIL = [17.96, 18.9];                       // the turn: music stops, only the room
export const END = 39.6;

export async function build() {
  await W.loadFont('tech', 'fonts/EMSTech.json');
  const words = await (await fetch('voices/words.json')).json();
  const lines = await (await fetch('lines.json')).json();
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const at = (id, w, k = 0, which = 1) => {
    let n = 0; for (const x of words[id]) if (norm(x[0]).startsWith(norm(w)) && n++ === k) return VO[id] + Math.max(0, x[which]);
    throw new Error(`word ${w} not in ${id}`);
  };
  const atS = (id, w, k = 0) => at(id, w, k, 1), atE = (id, w, k = 0) => at(id, w, k, 2);

  const tl = new W.Timeline();
  const K = new W.Pen('black', INK.black, { park: [2200, 1320] });
  const O = new W.Pen('orange', INK.orange, { park: [2350, 1150] });
  const B = new W.Pen('blue', INK.blue, { park: [2100, 1420] });
  const PENS = [K, O, B];
  const T = W.text;
  const D = (pen, shapes, a, b, o = {}) => tl.draw(pen, shapes, a, { by: b, ...o });

  // ───────── layout (world units, board 6400 × 3800)
  const BW = 6400, BH = 3800;
  const EGG = [1400, 1560], FRY = [2450, 960], SMOLT = [3500, 880], ADULT = [4950, 1950], LEAP = [3180, 2470];

  // a salmon: L = length, a = heading (0 = facing right). Returns strokes in drawing order.
  function fish(cx, cy, L, a, o = {}) {
    const ca = Math.cos(a), sa = Math.sin(a), P = (u, v) => [cx + (u * ca - v * sa) * L, cy + (u * sa + v * ca) * L];
    const op = { w: Math.max(6, L * .022), ...o };
    const out = [
      W.curve([P(-.36, 0), P(-.2, -.15), P(.1, -.17), P(.36, -.09), P(.5, 0), P(.38, .08), P(.1, .14), P(-.2, .11), P(-.36, 0)], { smooth: 2, ...op }),
      W.poly([P(-.36, 0), P(-.56, -.16), P(-.49, 0), P(-.56, .16), P(-.36, 0)], op),
      W.curve([P(.27, -.1), P(.24, -.01), P(.27, .08)], op),
      W.poly([P(-.04, -.163), P(.05, -.27), P(.16, -.165)], op),
      W.circle(...P(.39, -.035), L * .02, { ...op, w: op.w * .9 }),
    ];
    if (o.spots) for (const [u, v] of [[-.16, -.07], [-.06, -.1], [.04, -.06], [-.24, -.02], [.12, -.11], [-.1, -.01]]) out.push(W.circle(...P(u, v), L * .012, { ...op, w: op.w * .8 }));
    return out;
  }
  const dbl = (pts, gap, o) => {                       // a river = two parallel hand lines
    const off = sgn => pts.map((p, i) => { const q = pts[Math.min(i + 1, pts.length - 1)], r = pts[Math.max(i - 1, 0)], dx = q[0] - r[0], dy = q[1] - r[1], l = Math.hypot(dx, dy) || 1; return [p[0] - dy / l * gap * sgn, p[1] + dx / l * gap * sgn]; });
    return [W.curve(off(1), o), W.curve(off(-1), o)];
  };
  const wave = (x0, x1, y, amp = 16, per = 55, o = {}) => { const p = []; for (let x = x0; x <= x1; x += 20) p.push([x, y + Math.sin(x / per) * amp]); return W.curve(p, { w: 8, smooth: 1, ...o }); };

  // ghost marks of old lessons
  const ghosts = [], gR = mulberry(99);
  for (let i = 0; i < 34; i++) {
    const x = gR() * (BW - 400) + 200, y = gR() * (BH - 400) + 200, k = gR();
    const o = { w: 12, alpha: .05 + gR() * .05, color: gR() < .2 ? '#8aa0c8' : '#9aa0a8' };
    if (k < .3) ghosts.push(...T(['x = 4', 'p. 12', 'MON', 'q.3', 'verbs', 'HW', 'due fri', '→ 7', 'ok!'][i % 9], x, y, { h: 50 + gR() * 40, ...o }));
    else if (k < .55) ghosts.push(W.circle(x, y, 40 + gR() * 110, o));
    else if (k < .8) ghosts.push(...W.arrow(x, y, x + (gR() - .5) * 500, y + (gR() - .5) * 300, o));
    else ghosts.push(W.line(x, y, x + 200 + gR() * 500, y + (gR() - .5) * 80, o));
  }

  // ═════════ A · THE EGG (0–5): "This tiny egg, in a cold river, holds a big adventure."
  const [ex, ey] = EGG;
  tl.cue(.15, 'cap');
  D(O, [W.circle(ex, ey, 46, { w: 9 }), W.circle(ex + 12, ey - 8, 5, { w: 11 })], .3, atS('v1', 'egg') + .05);
  D(K, T('egg', ex + 120, ey + 30, { h: 70, w: 9 }), atS('v1', 'egg') - .05, atS('v1', 'egg') + .5);
  const pebbles = [[-190, 95, 62, 40], [175, 110, 70, 42], [-40, 150, 58, 34], [300, 40, 46, 36], [-300, 10, 50, 38], [60, 175, 48, 30], [-150, 190, 40, 28], [250, 190, 54, 32]];
  D(K, pebbles.map(([dx, dy, rx, ry]) => W.circle(ex + dx, ey + dy, rx, { ry, w: 6, alpha: .8 })), atE('v1', 'egg') + .1, atS('v1', 'cold') + .5, { minGap: .02, maxGap: .06 });
  D(B, [wave(ex - 330, ex - 40, ey - 170, 12, 40, { w: 7 }), wave(ex - 120, ex + 260, ey - 235, 12, 40, { w: 7 }), wave(ex + 60, ex + 330, ey - 160, 12, 40, { w: 7 })], atS('v1', 'cold') - .05, atE('v1', 'river') + .25);
  const nest1 = [[-95, 40], [85, 55], [-20, 95], [130, -20], [-140, -30]];
  D(O, nest1.map(([dx, dy]) => W.circle(ex + dx, ey + dy, 26, { w: 7 })), atS('v1', 'holds') + .1, atS('v1', 'big') + .3, { minGap: .02, maxGap: .05 });
  const TOP1 = [[1700, 1230], [2050, 1040], [2450, 960]];
  const TOP2 = [[2450, 960], [2950, 905], [3500, 880], [4000, 945], [4450, 1190], [4720, 1500]];
  D(B, dbl(TOP1, 85, { w: 7 }), atS('v1', 'adventure') - .1, VO.v2 - .1, { travel: 4000 });

  // ═════════ B · FRY (5–8.5): "It hatches, and grows into a little fry."
  D(O, W.poly([[ex - 34, ey - 6], [ex - 14, ey + 9], [ex + 2, ey - 9], [ex + 18, ey + 8], [ex + 36, ey - 4]], { w: 6 }), atS('v2', 'hatches') - .05, atS('v2', 'hatches') + .3);
  D(K, W.arrow(1700, 1530, 2250, 1190, { w: 8, head: 30, curve: [1900, 1300] }), VO.v2 + .45, VO.v2 + 1.05);
  D(O, fish(FRY[0], FRY[1], 170, -.1), atS('v2', 'grows') - .1, atS('v2', 'fry') - .05, { minGap: .02, maxGap: .05 });
  D(K, T('fry', FRY[0] - 70, FRY[1] - 130, { h: 80, w: 10 }), atS('v2', 'fry') - .05, atS('v2', 'fry') + .45);

  // ═════════ C · SMOLT, DOWNSTREAM (8.5–12.6): "As a smolt, it swims all the way down to the sea."
  D(K, W.arrow(2700, 1150, 3250, 1110, { w: 8, head: 30, curve: [2980, 1190] }), VO.v3 - .25, atS('v3', 'smolt') - .05);
  D(K, T('smolt', SMOLT[0] - 140, SMOLT[1] - 150, { h: 80, w: 10 }), atS('v3', 'smolt') - .05, atS('v3', 'smolt') + .55);
  D(O, fish(SMOLT[0], SMOLT[1], 300, .02), atS('v3', 'smolt') + .45, atS('v3', 'swims') + .35, { minGap: .02, maxGap: .05 });
  D(B, dbl(TOP2, 85, { w: 7 }), atS('v3', 'swims') + .3, atE('v3', 'sea') - .2, { travel: 5000 });
  D(K, W.arrow(3950, 1180, 4430, 1620, { w: 8, head: 30, curve: [4280, 1300] }), atS('v3', 'sea') - .3, atE('v3', 'sea') + .2);

  // ═════════ D · OCEAN, ADULT (12.6–18): "In the ocean, it eats and eats, and grows into a big, strong adult."
  D(B, [wave(4300, 5650, 1560), wave(4450, 5750, 1645, 14, 62), wave(4350, 5600, 2430), wave(4500, 5700, 2515, 14, 62)], atS('v4', 'ocean') - .2, atS('v4', 'eats') + .1, { minGap: .02, maxGap: .06 });
  const krill = (x, y) => [W.arc(x, y, 18, -1.2, 2.2, { w: 6 }), W.line(x + 12, y + 12, x + 26, y + 26, { w: 5 })];
  D(K, [...krill(5480, 1860), ...krill(5560, 1960)], atS('v4', 'eats') - .05, atS('v4', 'eats') + .3, { minGap: .02, maxGap: .04 });
  D(K, [...krill(5520, 2050), ...krill(5620, 1890)], atS('v4', 'eats', 1) - .05, atS('v4', 'eats', 1) + .3, { minGap: .02, maxGap: .04 });
  D(O, fish(ADULT[0], ADULT[1], 650, 0, { spots: true }), atS('v4', 'grows') - .1, atE('v4', 'strong'), { minGap: .02, maxGap: .06 });
  D(K, T('adult', ADULT[0] - 150, ADULT[1] + 330, { h: 80, w: 10 }), atS('v4', 'adult') - .05, atS('v4', 'adult') + .55);

  // ═════════ E · THE TURN (18–23): silence, then "But one day, it turns around, and swims back home."
  D(K, W.arrow(4560, 2260, 3950, 2640, { w: 9, head: 34, curve: [4380, 2560] }), atS('v5', 'turns') - .1, atE('v5', 'around') + .1);
  const LOW = [[4520, 2700], [4100, 2900], [3600, 3060], [3290, 3070]];
  const HIGH = [[3230, 2760], [2750, 2680], [2200, 2440], [1800, 2140]];
  D(B, [...dbl(LOW, 70, { w: 7 }), ...dbl(HIGH, 70, { w: 7 })], atS('v5', 'swims') - .2, VO.v6 + .2, { travel: 5000 });

  // ═════════ F · THE WATERFALL (23–28.8): "It jumps up waterfalls, all the way to the place where it was born."
  D(K, [W.line(2980, 2840, 3255, 2835, { w: 9 }), W.line(3255, 2835, 3275, 3150, { w: 9, bow: .02 }), W.line(3275, 3150, 3620, 3140, { w: 9 })], VO.v6 - .15, atS('v6', 'jumps') - .05);
  D(O, fish(LEAP[0], LEAP[1], 300, Math.PI + .55), atS('v6', 'jumps'), atS('v6', 'waterfalls') + .3, { minGap: .02, maxGap: .05 });
  D(B, [0, 1, 2, 3].map(k => W.curve([[3262 + k * 24, 2770], [3270 + k * 24, 2900], [3266 + k * 24, 3040], [3275 + k * 24, 3120]], { w: 6 })), atS('v6', 'waterfalls') - .05, atE('v6', 'waterfalls') + .25);
  D(K, W.dashed([[3560, 3060], [3420, 2600], [3150, 2380], [2950, 2560], [2880, 2700]], { w: 6, dash: 34, gap: 24 }), atE('v6', 'waterfalls') + .1, atS('v6', 'all') + .45, { minGap: .005, maxGap: .01 });
  D(K, W.arrow(2780, 2480, 1820, 1800, { w: 8, head: 30, curve: [2250, 2180] }), atS('v6', 'way') - .1, atE('v6', 'born') - .1);

  // ═════════ G · SPAWN, THE CIRCLE (28.8–38): "There, it lays its eggs. That's called spawning. And the circle starts again."
  const nest2 = [[-200, -40], [-60, -75], [60, 100], [210, 120], [-240, 70], [10, 30], [170, -80]];
  D(O, nest2.map(([dx, dy]) => W.circle(ex + dx, ey + dy, 24, { w: 7 })), atS('v7', 'lays') - .1, atE('v7', 'eggs'), { minGap: .02, maxGap: .05 });
  D(K, T('spawn', ex - 280, ey - 200, { h: 80, w: 10, align: 'center' }), atS('v7', 'spawning') - .05, atS('v7', 'spawning') + .6);
  D(O, W.curve([[ex - 440, ey - 175], [ex - 280, ey - 165], [ex - 115, ey - 180]], { w: 9, over: 14 }), atS('v7', 'spawning') + .65, atS('v7', 'spawning') + .95);
  const TC = [3250, 1950];
  D(K, T('The Salmon', TC[0], TC[1] - 70, { h: 150, w: 15, align: 'center' }), atS('v7', 'circle') + .05, atS('v7', 'circle') + 1.3, { minGap: .02, maxGap: .06 });
  D(K, T('Life Cycle', TC[0], TC[1] + 170, { h: 150, w: 15, align: 'center' }), atS('v7', 'circle') + 1.35, atS('v7', 'circle') + 2.5, { minGap: .02, maxGap: .06 });
  D(O, W.curve([[TC[0] - 420, TC[1] + 215], [TC[0], TC[1] + 230], [TC[0] + 430, TC[1] + 205]], { w: 16, over: 24 }), atS('v7', 'circle') + 2.55, atS('v7', 'circle') + 2.95);
  D(K, T('Andrew Classes', TC[0], TC[1] + 385, { h: 58, w: 7, align: 'center' }), atS('v7', 'circle') + 3.0, atS('v7', 'circle') + 4.1, { minGap: .02, maxGap: .05 });
  tl.cue(atS('v7', 'circle') + 4.6, 'capOn');
  tl.end();

  // ───────── camera (t, x, y, zoom, roll, ease)
  const cA = atS('v7', 'circle');
  const cam = new W.Camera([
    [0, ex + 60, ey - 10, 2.6],
    [.6, ex + 60, ey - 10, 2.52, 0, 's'],
    [4.7, 1480, 1420, 1.05, 0, 'io'],                  // pull back: one egg → a nest in a river
    [5.4, 1490, 1410, 1.05, 0, 'l'],
    [8.0, 2330, 1080, 1.05, 0, 'io'],                  // ride the arrow to the fry
    [8.7, 2360, 1060, 1.05, 0, 'l'],
    [9.7, 3350, 1010, 1.02, 0, 'io'],                  // on to the smolt
    [12.4, 4380, 1350, 1.0, 0, 'io'],                  // ride the river down to the sea
    [14.0, 4930, 1880, .92, 0, 'io'],
    [17.9, 4950, 1930, 1.1, 0, 's'],                   // slow push while it grows
    [20.1, 4950, 1950, 1.17, -.012, 'l'],              // the silence: hold, a faint dutch
    [20.85, 3780, 2720, .96, 0, 'io'],                 // whip on "turns around"
    [23.0, 3650, 2760, .96, 0, 'l'],
    [24.3, 3230, 2700, 1.08, 0, 'io'],                 // the waterfall
    [26.6, 3180, 2650, 1.1, 0, 'l'],
    [28.7, 1600, 1720, 1.12, 0, 'io'],                 // ride the arrow home
    [cA - .4, 1480, 1600, 1.28, 0, 's'],               // push in on the new eggs
    [cA + 1.2, TC[0] - 100, TC[1] + 30, .35, 0, 'io'],       // pull back: it was a circle all along
    [END, TC[0] - 100, TC[1] + 30, .343, 0, 'l'],
  ]);

  const board = new W.Board(tl, { ghosts, W: BW, H: BH });
  if (!new URLSearchParams(location.search).has('nopens')) board.objs.push({ draw: (ctx, t, c) => { for (const p of PENS) W.drawMarker(ctx, p, W.penPose(p, t, cam), c, t); } });

  // ───────── subtitles (clauses ≤ 44 chars)
  const subs = [];
  for (const L of lines) {
    const ws = words[L.id].map(w => [w[0], Math.max(0, w[1]), w[2]]), t0 = VO[L.id];
    const cum = [0]; ws.forEach(w => cum.push(cum[cum.length - 1] + w[0].length + 1)); const tot = cum[cum.length - 1];
    const timeAt = f => { const c = f * tot; let i = 0; while (i < ws.length - 1 && cum[i + 1] <= c) i++; const u = clamp((c - cum[i]) / (cum[i + 1] - cum[i])); return lerp(ws[i][1], ws[i][2], u); };
    const parts = L.text.match(/[^,.]+[,.…]*\s*/g).reduce((acc, p) => {
      const last = acc[acc.length - 1];
      if (last != null && (last + p).trim().length <= 44) acc[acc.length - 1] += p; else acc.push(p); return acc; }, []);
    let c0 = 0;
    for (const p of parts) {
      const f0 = c0 / L.text.length, f1 = (c0 + p.trimEnd().length) / L.text.length; c0 += p.length;
      subs.push({ t0: t0 + (f0 === 0 ? ws[0][1] : timeAt(f0)) - .05, t1: t0 + (f1 >= .999 ? ws[ws.length - 1][2] : timeAt(f1)) + .35, text: p.trim() });
    }
  }
  for (let i = 0; i < subs.length; i++) {             // hold each ≥ 1.8 s unless the next one needs the slot
    const nx = i < subs.length - 1 ? subs[i + 1].t0 - .04 : END;
    subs[i].t1 = Math.min(Math.max(subs[i].t1, subs[i].t0 + 1.8), nx);
  }
  const subOverlay = {
    draw: (ctx, t) => {
      const s = subs.find(s => t >= s.t0 && t < s.t1); if (!s) return;
      const a = Math.min(1, (t - s.t0) / .12, (s.t1 - t) / .12);
      ctx.font = '44px AD';
      const w = ctx.measureText(s.text).width + 64, h = 70, y0 = 1038 - h;
      ctx.globalAlpha = a * .9; ctx.fillStyle = '#fdfcf8'; ctx.shadowColor = 'rgba(30,30,40,.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.roundRect(960 - w / 2, y0, w, h, 14); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = a;
      ctx.fillStyle = INK.orange; ctx.fillRect(960 - w / 2 + 22, y0 + h - 12, 36, 4);
      ctx.fillStyle = '#23262c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.text, 960, y0 + 37);
    }
  };
  board.overlays.push(subOverlay);
  const noSubs = new URLSearchParams(location.search).has('nosubs');
  if (noSubs) board.overlays.length = 0;

  // ───────── frame render, with camera motion blur on fast moves
  const off = new OffscreenCanvas(1920, 1080), oc = off.getContext('2d');
  function render(ctx, t) {
    const dt = 1 / 24, a = cam.at(t), b = cam.at(Math.max(0, t - dt));
    const sp = Math.hypot((a.x - b.x) * a.z, (a.y - b.y) * a.z) + Math.abs(Math.log(a.z / b.z)) * 900;
    const N = sp > 14 ? Math.min(12, Math.ceil(sp * .5 / 4)) : 1;
    if (N === 1) { board.render(ctx, t, cam); return; }
    const ov = board.overlays; board.overlays = [];
    for (let i = 0; i < N; i++) { board.render(oc, t - dt * .5 * i / (N - 1), cam); ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(off, 0, 0); }
    ctx.globalAlpha = 1; board.overlays = ov;
    for (const o of ov) { ctx.save(); o.draw(ctx, t); ctx.restore(); }
  }

  const ev = [...tl.ev, ...Object.entries(VO).map(([id, t]) => ({ t, type: 'vo', id }))].sort((a, b) => a.t - b.t);
  for (const e of ev) if (e.x != null) { const c = cam.at(e.t), [px, py] = W.toScreen(c, e.x, e.y); e.pan = +clamp((px - 960) / 1400, -.7, .7).toFixed(2); e.z = +c.z.toFixed(2); e.on = px > -100 && px < 2020 && py > -100 && py < 1180 ? 1 : 0; }
  const cues = { BEAT, SIL, whip: 20.1, leap: atS('v6', 'jumps'), spawn: atS('v7', 'lays'), circle: cA, adult: atS('v4', 'adult'), smolt: atS('v3', 'smolt'), fry: atS('v2', 'fry'), sea: atS('v3', 'sea'), ocean: atS('v4', 'ocean'), born: atE('v6', 'born'), turns: atS('v5', 'turns'), home: atS('v5', 'swims') };
  const setSubs = on => { board.overlays.length = 0; if (on) board.overlays.push(subOverlay); };   // the web player's CC button
  return { dur: END, render, ev, subs, cam, tl, VO, cues, setSubs };
}
