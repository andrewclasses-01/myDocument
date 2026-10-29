// Web film page for document.andrewclasses.com — no audio; the player page drives render(t) and the CC button.
const mod = await import('./film.js');
await Promise.all([document.fonts.load('48px PH'), document.fonts.load('60px DS')]);
const F = await mod.build();
const ctx = document.getElementById('c').getContext('2d');
window.DUR = F.dur;
window.SUBS = F.subs;
window.setSubs = on => F.setSubs(on);
window.render = t => F.render(ctx, t);
window.READY = true;
