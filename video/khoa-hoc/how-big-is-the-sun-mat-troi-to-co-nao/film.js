// "How big is the Sun?" — Dark Science Data (khoa-hoc-nen-toi). One charcoal stage, no cuts.
// The Sun starts huge beside a true-scale Earth and shrinks step by step (light scale → bar chart → row of stars)
// until it is one orange dot above the title. Times hang off spoken words via at(); before the voice exists the
// word times are estimated at ~2.4 words/s.
import { clamp, lerp, mulberry, seg, ss, eo, eio } from './lib.js';

const W = 1920, H = 1080, TAU = Math.PI * 2;
const C = { white: '#f2f2f2', light: '#b8b8bc', mid: '#6e6e74', line: '#4a4a50' };

// subtitles: digits, key words in **bold**
export const SUBS = {
  v1: 'How big is our **Sun**? Let me show you.',
  v2: 'The Sun is about **1.4 million kilometers** wide.',
  v3: 'That is **109 Earths** in a row.',
  v4: 'To fill it, you need about **1.3 million Earths**.',
  v5: 'Its light takes **8 minutes and 20 seconds** to reach us.',
  v6: 'It has **99.8%** of the **mass** in our Solar System.',
  v7: 'But next to other stars, it is just a **medium-sized star**.',
};
const GAP = { v1: 0.7, v2: 0.35, v3: 0.3, v4: 0.3, v5: 0.55, v6: 0.45, v7: 0.8 };

// ───────── small helpers
const ap = (t, t0, d = .5) => eo(seg(t, t0, t0 + d));                // appear 0→1
const out = (t, t0, d = .45) => 1 - ss(seg(t, t0, t0 + d));            // leave 1→0
const dim = (t, t0, lvl = .3, d = .6) => lerp(1, lvl, ss(seg(t, t0, t0 + d)));   // the old steps back
const pop = (p) => .94 + .06 * p;                                       // appear scale 0.94→1
const fmt = n => Math.round(n).toLocaleString('en-US');

let TX = null;                                                          // readcheck collector
function text(ctx, id, s, x, y, o = {}) {
  const { size = 40, weight = 400, color = C.white, align = 'left', alpha = 1, font = 'Inter', report = s } = o;
  if (alpha <= .003) return 0;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color;
  ctx.fillText(s, x, y);
  const w = ctx.measureText(s).width;
  if (TX && alpha > .5 && ctx.globalAlpha > .2) {
    const m = ctx.getTransform(), x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    const p0 = m.transformPoint({ x: x0, y: y - size * .8 }), p1 = m.transformPoint({ x: x0 + w, y: y + size * .25 });
    TX.push({ id, text: report, x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y });
  }
  ctx.restore(); return w;
}
const measure = (ctx, s, size, weight = 400, font = 'Inter') => { ctx.save(); ctx.font = `${weight} ${size}px ${font}`; const w = ctx.measureText(s).width; ctx.restore(); return w; };

// bold white title + thin grey sub-line right under it
function label(ctx, id, x, y, title, sub, o = {}) {
  const { size = 40, align = 'left', alpha = 1 } = o;
  text(ctx, id + '.t', title, x, y, { size, weight: 700, align, alpha });
  if (sub) text(ctx, id + '.s', sub, x, y + size * 1.0, { size: Math.round(size * .66), weight: 300, color: C.light, align, alpha });
}
// a small spaced grey kicker
function kicker(ctx, id, s, x, y, alpha, align = 'left') {
  ctx.save(); ctx.letterSpacing = '4px'; text(ctx, id, s, x, y, { size: 22, weight: 600, color: C.mid, align, alpha }); ctx.restore();
}
// big number + smaller grey unit; parts = [[str, big?], …]
function bigNum(ctx, id, x, y, parts, o = {}) {
  const { size = 120, alpha = 1, align = 'left', report, final } = o;
  const ws = parts.map(([s, b]) => measure(ctx, s, b ? size : size * .4, b ? 700 : 400));
  const tw = ws.reduce((a, b) => a + b, 0);
  let cx = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
  parts.forEach(([s, b], i) => {
    text(ctx, id + '.' + i, s, cx, y, { size: b ? size : size * .4, weight: b ? 700 : 400, color: b ? C.white : C.light, alpha, report: final ? final[i] : i === 0 && report ? report : s });
    cx += ws[i];
  });
  return tw;
}

function glow(ctx, x, y, r, rgb, a) {
  if (a <= 0 || r <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [k, al] of [[1.25, .45], [2.2, .18], [4, .07]]) {
    const R = r * k, g = ctx.createRadialGradient(x, y, r * .2, x, y, R);
    g.addColorStop(0, `rgba(${rgb},${al * a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// the Sun: the film's only colour
const GRAN = (() => { const R = mulberry(11), a = []; for (let i = 0; i < 700; i++) a.push([R() * TAU, Math.sqrt(R()), .012 + R() * .026, R() < .5 ? 1 : -1, R() * TAU]); return a; })();
function sun(ctx, x, y, r, a = 1, t = 0, bright = 1) {
  if (a <= .003 || r <= 0) return;
  glow(ctx, x, y, r, '255,168,60', a * .85 * bright);
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createRadialGradient(x - r * .18, y - r * .2, r * .04, x, y, r);
  g.addColorStop(0, '#fff3cf'); g.addColorStop(.38, '#ffcb5c'); g.addColorStop(.78, '#f29634'); g.addColorStop(.95, '#d66d20'); g.addColorStop(1, '#b4511a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  if (r > 40) {                                    // slow granulation
    ctx.clip();
    for (const [an, d, s, sg, ph] of GRAN) {
      const rr = r * d * .96, px = x + Math.cos(an + t * .01) * rr, py = y + Math.sin(an + t * .01) * rr;
      ctx.globalAlpha = a * (.06 + .035 * Math.sin(t * .7 + ph));
      ctx.fillStyle = sg > 0 ? '#fff0c0' : '#a8440f';
      ctx.beginPath(); ctx.arc(px, py, r * s, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}
// a grey shaded sphere lit from direction lx (−1 = from the left)
function sphere(ctx, x, y, r, a = 1, lx = -1, tone = 1) {
  if (a <= .003 || r <= 0) return;
  glow(ctx, x, y, r, '205,208,218', a * .35 * tone);
  ctx.save(); ctx.globalAlpha *= a;
  if (r < 4) { ctx.fillStyle = '#e4e4e8'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); return; }
  const g = ctx.createRadialGradient(x + lx * r * .45, y - r * .3, r * .05, x, y, r * 1.05);
  const k = v => Math.round(v * tone);
  g.addColorStop(0, `rgb(${k(236)},${k(236)},${k(240)})`); g.addColorStop(.5, `rgb(${k(150)},${k(150)},${k(158)})`); g.addColorStop(1, `rgb(${k(42)},${k(42)},${k(46)})`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.restore();
}
function line(ctx, x0, y0, x1, y1, o = {}) {
  const { color = C.light, w = 2, alpha = 1, dash = null } = o;
  if (alpha <= .003) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
}
function ring(ctx, x, y, r, o = {}) {
  const { color = C.light, w = 2, alpha = 1, dash = [8, 10] } = o;
  if (alpha <= .003) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
}

// stage
const DUST = (() => { const R = mulberry(5), a = []; for (let i = 0; i < 520; i++) a.push([R() * W, R() * H, .1 + R() * R() * .32, R() < .08 ? 1.6 : 1, R() * TAU]); return a; })();
function stage(ctx, t, dust, grid) {
  ctx.fillStyle = '#1d1d1f'; ctx.fillRect(0, 0, W, H);
  let g = ctx.createRadialGradient(W * .5, H * .44, 0, W * .5, H * .44, W * .62);
  g.addColorStop(0, '#26262a'); g.addColorStop(.5, '#1d1d1f'); g.addColorStop(1, '#131315');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (dust > 0) {
    ctx.save();                                                 // grey nebula haze
    for (const [hx, hy, hr, ha] of [[W * .72, H * .3, 620, .035], [W * .2, H * .78, 520, .025]]) {
      const n = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr); n.addColorStop(0, `rgba(170,170,180,${ha * dust})`); n.addColorStop(1, 'rgba(170,170,180,0)');
      ctx.fillStyle = n; ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = '#fff';
    for (const [x, y, a, s, ph] of DUST) { ctx.globalAlpha = dust * a * (.8 + .2 * Math.sin(t * 1.3 + ph)); ctx.fillRect(x, y, s, s); }
    ctx.restore();
  }
  if (grid > 0) {
    ctx.save(); ctx.lineWidth = 1;
    for (let x = 0, i = 0; x <= W; x += 48, i++) { ctx.strokeStyle = `rgba(255,255,255,${(i % 4 ? .03 : .05) * grid})`; ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
    for (let y = 12, i = 0; y <= H; y += 48, i++) { ctx.strokeStyle = `rgba(255,255,255,${(i % 4 ? .03 : .05) * grid})`; ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }
    ctx.restore();
  }
}
function vignette(ctx) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, W * .72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// subtitles: white, no box, soft shadow, key words bold
function subtitle(ctx, s, a) {
  if (a <= 0) return;
  const parts = s.split('**'), size = 40, y = 1028;
  const ws = parts.map((p, i) => measure(ctx, p, size, i % 2 ? 700 : 400));
  let x = W / 2 - ws.reduce((p, q) => p + q, 0) / 2;
  ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 2;
  parts.forEach((p, i) => { ctx.font = `${i % 2 ? 700 : 400} ${size}px Inter`; ctx.fillStyle = i % 2 ? '#ffffff' : '#e6e6e8'; ctx.fillText(p, x, y); x += ws[i]; });
  ctx.restore();
}

// ───────── the film
export async function build() {
  const lines = await (await fetch('lines.json')).json();
  const get = async u => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch { return null; } };
  const words = await get('voices/words.json'), durs = await get('voices/dur.json');

  const VO = {}, VE = {}, WD = {};
  let t = 0;
  for (const L of lines) {
    t += GAP[L.id] ?? .7; VO[L.id] = t;
    let ws = words && words[L.id];
    if (!ws) {                                       // estimate ~2.4 words/s
      const toks = L.text.split(/\s+/), wt = toks.map(w => w.replace(/[^a-z']/gi, '').length + 2.5 + (/[.,?!]$/.test(w) ? 3 : 0));
      const total = toks.length / 2.4, sum = wt.reduce((a, b) => a + b, 0); let c = .05;
      ws = toks.map((w, i) => { const d = wt[i] / sum * total, r = [w, c, c + d * .85]; c += d; return r; });
    }
    WD[L.id] = ws;
    const d = durs && durs[L.id] ? durs[L.id] : ws[ws.length - 1][2] + .15;
    VE[L.id] = t + d; t += d;
  }
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const at = (id, w, k = 0, which = 1, frac = .5) => {      // w: a word or a list of ways the recogniser may write it
    for (const ww of [].concat(w)) { let n = 0; for (const x of WD[id]) if (norm(x[0]) && norm(x[0]).startsWith(norm(ww)) && n++ === k) return VO[id] + Math.max(0, x[which]); }
    console.warn(`word ${w} not in ${id}`); return lerp(VO[id], VE[id], frac);
  };

  const S = {
    v1: VO.v1, t2: VO.v2, wideA: at('v2', ['one', '1'], 0, 1, .4), wideB: at('v2', 'wide', 0, 2, .95),
    t3: VO.v3, rowA: at('v3', ['one', '109'], 0, 1, .2), rowB: at('v3', ['earths', 'errs'], 0, 2, .75),
    t4: VO.v4, fillA: at('v4', 'fill', 0, 1, .15), numA: at('v4', ['one', '1'], 0, 1, .5), fillB: at('v4', 'earths', 0, 2, .95),
    t5: VO.v5, lightA: at('v5', 'light', 0, 1, .1), lightB: at('v5', 'seconds', 0, 2, .75),
    t6: VO.v6, massA: at('v6', ['ninety', '99'], 0, 1, .3), massB: at('v6', 'mass', 0, 1, .7),
    t7: VO.v7, other: at('v7', 'other', 0, 1, .25), medium: at('v7', 'medium', 0, 1, .75),
  };
  S.end = VE.v7 + .9;
  const DUR = +(S.end + 5.4).toFixed(2);

  // Sun & Earth stations (the Sun shrinks at every new idea)
  const SUNP = [[1250, 540, 330], [300, 540, 120], [480, 470, 34], [470, 560, 36], [960, 300, 9]];
  const EARP = [[1720, 540, 3.03], [1640, 540, 16], [480, 650, 7]];
  const k5 = t => ss(seg(t, S.t5 - .5, S.t5 + .7)), k6 = t => ss(seg(t, S.t6 - .5, S.t6 + .7)), k7 = t => ss(seg(t, S.t7 - .6, S.t7 + .7)), k8 = t => eio(seg(t, S.end, S.end + 1.4));
  const along = (P, ks) => { let p = P[0]; ks.forEach((k, i) => { if (P[i + 1]) p = p.map((v, j) => lerp(v, P[i + 1][j], k)); }); return p; };

  // the 109-dot row and the fill grid
  const SX0 = 920, SX1 = 1580, ROW = Array.from({ length: 109 }, (_, i) => SX0 + (SX1 - SX0) * (i + .5) / 109);
  const FILL = []; { const R = mulberry(3), sp = 12.5; for (let j = -30; j <= 30; j++) for (let i = -30; i <= 30; i++) { const x = i * sp + (j & 1) * sp / 2, y = j * sp * .866; if (Math.hypot(x, y) < 322) FILL.push([x, y, R()]); } }

  // camera keys (zoom about the centre), ≤ 1.08
  const CK = [[0, 1], [S.t5 - .5, 1.035], [S.t5 + .9, 1], [S.t7 - .6, 1.025], [S.t7 + .2, 1.06], [S.end, 1], [DUR, 1]];
  const zoom = t => { for (let i = 1; i < CK.length; i++) if (t <= CK[i][0]) return lerp(CK[i - 1][1], CK[i][1], ss(seg(t, CK[i - 1][0], CK[i][0]))); return 1; };

  const ev = [];
  const E = (tt, type, o = {}) => ev.push({ t: +tt.toFixed(3), type, ...o });
  E(S.wideA + .9, 'tick'); ROW.forEach((_, i) => i % 6 === 0 && E(lerp(S.rowA, S.rowB, i / 109), 'grain'));
  E(S.rowB, 'tick'); E(S.fillA, 'rush'); E(S.numA + 1, 'tick'); E(S.t5 - .5, 'whoosh'); E(S.lightA, 'shimmer'); E(S.lightB, 'land');
  E(S.t6 - .5, 'whoosh'); E(S.massA + .9, 'tick'); E(S.massB + .5, 'tick'); E(S.t7 - .6, 'whoosh'); E(S.other + .3, 'swell'); E(S.medium, 'tick'); E(S.end, 'whoosh'); E(S.end + 1.6, 'shimmer');
  ev.push({ t: 0, type: 'cues', VO, VE, S, DUR });

  function render(ctx, t, opt = {}) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const K5 = k5(t), K6 = k6(t), K7 = k7(t), K8 = k8(t);
    const grid = Math.min(K5, 1 - K7) * .9, dust = lerp(1, .35, Math.min(K5, 1 - K7));
    stage(ctx, t, dust, grid);
    const z = zoom(t);
    ctx.setTransform(z, 0, 0, z, W / 2 * (1 - z), H / 2 * (1 - z));

    // ── part 1: the giant (v1–v4)
    const P1 = 1 - K5;
    const [sx, sy, sr] = along(SUNP, [K5, K6, K7, K8]);
    const [ex, ey, er] = along(EARP, [K5, K6]);
    const fillOn = ap(t, S.fillA, .4) * P1;
    const sunA = ap(t, .1, 1.3), sunBright = 1 + .5 * Math.exp(-Math.max(0, t - S.medium) * 2) * (t > S.medium ? 1 : 0);
    sun(ctx, sx, sy, sr, sunA, t, sunBright);

    // fill: the row ripples outward until the disc is full of Earths
    if (fillOn > 0) {
      ctx.save(); ctx.globalAlpha = .42 * fillOn * (1 - K5); ctx.fillStyle = '#2a1608'; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.fillStyle = '#f4f1ea';
      const s = sr / 330;
      for (const [fx, fy, rnd] of FILL) {
        const d = Math.abs(fy) / 322, ta = lerp(S.fillA, S.fillB - .4, d * .85 + rnd * .15);
        const a = ap(t, ta, .35) * fillOn * (1 - K5 * 1.4);
        if (a <= .01) continue;
        ctx.globalAlpha = a * .8; ctx.beginPath(); ctx.arc(sx + fx * s, sy + fy * s, 2.8 * s, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    if (P1 > 0) {
      // diameter
      const dA = ap(t, S.t2 + .1, .4) * P1 * dim(t, S.rowA, .25), dp = eio(seg(t, S.t2 + .2, S.wideB));
      if (dp > 0) {
        line(ctx, SX0, 540, lerp(SX0, SX1, dp), 540, { color: C.white, w: 2, alpha: dA, dash: [10, 8] });
        line(ctx, SX0, 522, SX0, 558, { color: C.white, w: 2, alpha: dA });
        if (dp > .99) line(ctx, SX1, 522, SX1, 558, { color: C.white, w: 2, alpha: dA });
      }
      // 109 Earths in a row
      const rA = P1 * (1 - fillOn * .85);
      ROW.forEach((x, i) => {
        const ta = lerp(S.rowA, S.rowB, i / 108), a = ap(t, ta, .15) * rA;
        if (a > .01) { glow(ctx, x, 540, 2.6, '220,222,230', a * .5); sphere(ctx, x, 540, 2.2, a); }
      });
    }
    // Earth
    const eA = ap(t, .7, .8) * (1 - K7);
    sphere(ctx, ex, ey, er, eA, sx < ex ? -1 : 1, 1);
    if (er < 5) ring(ctx, ex, ey, 18, { alpha: eA * P1 * .7, dash: [4, 6], w: 1.5 });

    // labels part 1
    const l1 = ap(t, .6, .6) * P1;
    label(ctx, 'sunlbl', 1250, 168, 'The Sun', 'our star', { align: 'center', alpha: l1 * dim(t, S.t2, .45) });
    label(ctx, 'earthlbl', 1720, 608, 'Earth', 'our planet', { size: 34, align: 'center', alpha: l1 });
    const ti = ap(t, VO.v1 - .2, .6) * out(t, S.t2 - .3);
    if (ti > 0) {
      ctx.save(); ctx.translate(120, 520); ctx.scale(pop(ti), pop(ti)); ctx.translate(-120, -520);
      label(ctx, 'title', 120, 520, 'How big is the Sun?', 'five numbers about our star', { size: 72, alpha: ti });
      ctx.restore();
    }
    // left column: three counters
    const slot = (id, y, t0, tDim, kick, parts, sub, report) => {
      const a = ap(t, t0 - .15, .5) * dim(t, tDim, .3) * out(t, S.t5 - .5, .4);
      if (a <= .003) return;
      ctx.save(); const p = pop(ap(t, t0 - .15, .5)); ctx.translate(120, y); ctx.scale(p, p); ctx.translate(-120, -y);
      kicker(ctx, id + '.k', kick, 122, y - 96, a);
      bigNum(ctx, id, 120, y, parts, { size: 104, alpha: a, report });
      text(ctx, id + '.sub', sub, 122, y + 58, { size: 40, font: 'STIX', color: C.light, alpha: a });
      ctx.restore();
    };
    {
      const v = 1.4 * eo(seg(t, S.wideA, S.wideA + .9));
      slot('n1', 300, S.wideA, S.t3, 'ACROSS', [[v.toFixed(1), 1], [' million km', 0]], '1.4 × 10⁶ km', '1.4');
      const n = Math.round(109 * clamp((t - S.rowA) / (S.rowB - S.rowA)));
      slot('n2', 580, S.rowA, S.t4, 'IN A ROW', [[String(n), 1], [' ×', 1], [' Earths', 0]], '109 Earths = 1 Sun', '109');
      const f = 1.3e6 * eo(seg(t, S.numA, S.numA + 1.0));
      slot('n3', 860, S.numA, 1e9, 'TO FILL IT', [[fmt(f), 1], [' Earths', 0]], '1.3 × 10⁶ Earths', '1,300,000');
    }

    // ── part 2: light (v5) — Sun left, Earth right, a time scale between them
    const P2 = K5 * (1 - K6);
    if (P2 > .003) {
      const X0 = 440, X1 = 1600, xs = s => X0 + (X1 - X0) * s / 500;
      const la = ap(t, S.t5 - .1, .5) * (1 - K6);
      const lp = eio(seg(t, S.t5, S.lightA));
      line(ctx, X0, 540, lerp(X0, X1, lp), 540, { color: C.mid, w: 2, alpha: la });
      for (let m = 0; m <= 8; m++) {
        const x = xs(m * 60), a = la * ap(t, S.t5 + .1 + m * .06, .3);
        line(ctx, x, 528, x, 552, { color: C.light, w: 1.5, alpha: a });
        if (m % 2 === 0) text(ctx, 'tick' + m, m ? `${m} min` : '0', x, 594, { size: 24, color: C.mid, align: 'center', alpha: a });
      }
      line(ctx, xs(500), 520, xs(500), 560, { color: C.white, w: 2, alpha: la * ap(t, S.lightB - .2, .3) });
      // the light pulse
      const q = clamp((t - S.lightA) / (S.lightB - S.lightA)), sec = 500 * q;
      if (t > S.lightA - .05) {
        const px = xs(sec), pa = la * ap(t, S.lightA - .05, .2) * (1 - ap(t, S.lightB + .5, .5));
        ctx.save(); const tr = ctx.createLinearGradient(px - 260, 0, px, 0); tr.addColorStop(0, 'rgba(255,255,255,0)'); tr.addColorStop(1, `rgba(255,255,255,${.7 * pa})`);
        ctx.strokeStyle = tr; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(Math.max(xs(0), px - 260), 540); ctx.lineTo(px, 540); ctx.stroke(); ctx.restore();
        glow(ctx, px, 540, 10, '255,255,255', pa); sphere(ctx, px, 540, 3.5, pa);
        if (t > S.lightB) glow(ctx, ex, ey, er * 1.4, '255,255,255', la * .8 * Math.exp(-(t - S.lightB) * 1.5));
      }
      // clock readout
      const ca = ap(t, S.lightA - .3, .5) * (1 - K6);
      const mm = Math.floor(sec / 60), sc = Math.floor(sec % 60);
      if (ca > 0) {
        ctx.save(); const p = pop(ca); ctx.translate(1020, 320); ctx.scale(p, p); ctx.translate(-1020, -320);
        kicker(ctx, 'clk.k', 'LIGHT TRAVEL TIME', 1020, 206, ca, 'center');
        bigNum(ctx, 'clk', 1020, 320, [[String(mm), 1], [' min  ', 0], [String(sc).padStart(2, '0'), 1], [' s', 0]], { size: 128, align: 'center', alpha: ca, final: ['8', ' min  ', '20', ' s'] });
        text(ctx, 'clk.sub', 'from the Sun to Earth', 1020, 378, { size: 34, weight: 300, color: C.light, align: 'center', alpha: ca });
        ctx.restore();
      }
      label(ctx, 'sun2', 300, 720, 'The Sun', null, { size: 34, align: 'center', alpha: la });
      label(ctx, 'earth2', 1640, 622, 'Earth', null, { size: 34, align: 'center', alpha: la });
      text(ctx, 'nts', 'sizes and distance not to scale', 1800, 940, { size: 20, color: C.mid, align: 'right', alpha: la * .9 });
    }

    // ── part 3: mass (v6) — bars against a 100 % limit line
    const P3 = K6 * (1 - K7);
    if (P3 > .003) {
      const BX = 560, BW = 1180, ma = ap(t, S.t6 - .1, .5) * (1 - K7);
      ctx.save(); const p = pop(ma); ctx.translate(120, 200); ctx.scale(p, p); ctx.translate(-120, -200);
      label(ctx, 'mt', 120, 200, 'Mass of the Solar System', 'mass = how much stuff is in it', { size: 54, alpha: ma });
      ctx.restore();
      const axp = eio(seg(t, S.t6, S.t6 + .6));
      line(ctx, BX, 405, BX, lerp(405, 715, axp), { color: C.light, w: 2, alpha: ma });
      line(ctx, BX + BW, 405, BX + BW, 722, { color: C.mid, w: 1.5, alpha: ma * ap(t, S.t6 + .3, .4), dash: [6, 8] });
      text(ctx, 'lim', '100%', BX + BW, 748, { size: 24, color: C.mid, align: 'center', alpha: ma * ap(t, S.t6 + .3, .4) });
      label(ctx, 'r1', 420, 480, 'The Sun', 'one star', { size: 36, align: 'right', alpha: ma });
      label(ctx, 'r2', 420, 660, 'Everything else', 'planets, moons, rocks', { size: 36, align: 'right', alpha: ma * ap(t, S.massB - .3, .5) });
      // Sun bar
      const g1 = eo(seg(t, S.massA, S.massA + .9)), w1 = BW * .998 * g1;
      if (w1 > 0) {
        ctx.save(); ctx.globalAlpha = ma;
        const gr = ctx.createLinearGradient(BX, 0, BX + w1, 0); gr.addColorStop(0, '#d66d20'); gr.addColorStop(1, '#ffc95a');
        ctx.fillStyle = gr; ctx.fillRect(BX, 448, w1, 44); ctx.restore();
        glow(ctx, BX + w1, 470, 22, '255,170,70', ma * .5);
        bigNum(ctx, 'b1', BX + w1, 428, [[(99.8 * g1).toFixed(1), 1], ['%', 0]], { size: 72, align: 'right', alpha: ma, report: '99.8' });
      }
      // everything else
      const g2 = ap(t, S.massB + .2, .5);
      if (g2 > 0) {
        ctx.save(); ctx.globalAlpha = ma * g2; ctx.fillStyle = C.white; ctx.fillRect(BX, 628, BW * .002 + 1, 44); ctx.restore();
        glow(ctx, BX + 2, 650, 10, '230,230,235', ma * g2 * .6);
        bigNum(ctx, 'b2', BX + 24, 668, [['0.2', 1], ['%', 0]], { size: 52, alpha: ma * g2 });
      }
    }

    // ── part 4: one star among stars (v7)
    const P4 = K7 * (1 - K8 * .999);
    if (P4 > .003) {
      const oa = ap(t, S.other - .1, .6), fade = 1 - K8;
      // red dwarf, giant, supergiant (grey: only the Sun has colour)
      const d1 = ap(t, S.other - .1, .5) * fade, d2 = ap(t, S.other + .25, .7) * fade, d3 = ap(t, S.other + .6, .9) * fade;
      sphere(ctx, 250, 560, 12, d1, -1, .85);
      sphere(ctx, 830, 560, 200 * pop(d2), d2, -1, .7);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); sphere(ctx, 2420, 560, 1060, d3, -1, .48); ctx.restore();
      label(ctx, 'st1', 250, 640, 'red dwarf', 'small star', { size: 30, align: 'center', alpha: d1 });
      label(ctx, 'st3', 830, 820, 'giant star', null, { size: 30, align: 'center', alpha: d2 });
      label(ctx, 'st4', 1560, 560, 'supergiant', 'too big for this screen', { size: 34, alpha: d3 });
      const md = ap(t, S.medium - .1, .5) * fade;
      ring(ctx, sx, sy, 62, { color: C.white, alpha: md * .8, dash: [6, 8], w: 2 });
      label(ctx, 'st2', 470, 668, 'The Sun', 'a medium-sized star', { size: 34, align: 'center', alpha: Math.max(md, oa * .35) * fade });
      text(ctx, 'nts2', 'sizes not to scale', 1800, 940, { size: 20, color: C.mid, align: 'right', alpha: oa * fade * .9 });
    }

    // ── end card: the Sun is one dot; title, sub-line, hand-written name
    if (t > S.end + .6) {
      const a1 = ap(t, S.end + .7, .6), a2 = ap(t, S.end + 1.0, .6);
      ctx.save(); const p = pop(a1); ctx.translate(960, 450); ctx.scale(p, p); ctx.translate(-960, -450);
      text(ctx, 'end.t', 'How big is the Sun?', 960, 450, { size: 84, weight: 700, align: 'center', alpha: a1 });
      ctx.restore();
      text(ctx, 'end.s', 'huge next to Earth, medium next to the stars', 960, 516, { size: 36, weight: 300, color: C.light, align: 'center', alpha: a2 });
      // hand-written, revealed left to right like a pen
      const hp = seg(t, S.end + 1.6, S.end + 3.0);
      if (hp > 0) {
        ctx.save(); ctx.font = '600 66px Hand'; const hw = ctx.measureText('Andrew Classes').width;
        ctx.beginPath(); ctx.rect(960 - hw / 2 - 10, 560, (hw + 30) * eio(hp), 120); ctx.clip();
        text(ctx, 'end.h', 'Andrew Classes', 960, 640, { size: 66, weight: 600, font: 'Hand', color: '#c9c9cd', align: 'center', alpha: 1 });
        ctx.restore();
      }
      text(ctx, 'end.c', 'Facts: NASA Sun fact sheet', 960, 990, { size: 20, color: C.mid, align: 'center', alpha: ap(t, S.end + 2, .6) });
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    vignette(ctx);
    ctx.fillStyle = '#000'; ctx.globalAlpha = 1 - ap(t, 0, .6); ctx.fillRect(0, 0, W, H);       // fade up
    ctx.globalAlpha = ss(seg(t, DUR - .7, DUR)); ctx.fillRect(0, 0, W, H);                     // fade out
    ctx.globalAlpha = 1;

    if (opt.subs !== false) for (const L of lines) {
      const a = Math.min(ap(t, VO[L.id] - .1, .15), out(t, Math.max(VE[L.id] + .35, VO[L.id] + 1.8), .15));
      if (a > 0) subtitle(ctx, SUBS[L.id] || L.text, a);
    }
  }

  const subs = lines.map(L => ({ t0: +(VO[L.id] - .1).toFixed(2), t1: +Math.max(VE[L.id] + .45, VO[L.id] + 1.9).toFixed(2), text: (SUBS[L.id] || L.text).replace(/\*\*/g, '') }));
  ev.push({ t: 0, type: 'subs', list: subs });
  return {
    dur: DUR, ev, subs, render,
    texts(ctx, t) { TX = []; render(ctx, t, { subs: false }); const r = TX; TX = null; return r; },
  };
}
