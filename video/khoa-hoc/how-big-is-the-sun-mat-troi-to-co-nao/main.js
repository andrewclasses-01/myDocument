const mod = await import('./film.js');
await Promise.all(['300 40px Inter', '400 40px Inter', '700 40px Inter', '400 40px STIX', '600 60px Hand'].map(f => document.fonts.load(f)));
const F = await mod.build();
const ctx = document.getElementById('c').getContext('2d');
let subs = true;
window.DUR = F.dur; window.EV = F.ev; window.SUBS = F.subs;
window.render = t => F.render(ctx, t, { subs });
window.setSubs = on => { subs = !!on; };
window.READY = true;
