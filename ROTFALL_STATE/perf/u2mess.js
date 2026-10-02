/* PERF-U2 Messhilfe (temporär): bench.js + Reihe 600 Bilder (300 Tag 12:05, 300 Nacht 23:05) in Varonheim, update + Zeichnen. */
import { TOWN_PLAN } from '/src/world.js?v=23';
const st = a => { const b = [...a].sort((x, y) => x - y), f = q => +b[Math.min(b.length - 1, Math.floor(b.length * q))].toFixed(2); return { med: f(0.5), p95: f(0.95), p99: f(0.99), max: +b[b.length - 1].toFixed(1) }; };
export async function series(n = 300) {
  const RF = window.RF, S = RF.S, p = S.player, P = TOWN_PLAN.varonheim, hx = p.x, hy = p.y, m0 = S.minute, out = {}; S._quiet = true;
  const all = { up: [], dr: [], tot: [] };
  for (const [nm, min] of [['tag', 12 * 60 + 5], ['nacht', 23 * 60 + 5]]) {
    S.minute = min; p.x = P.square[0] * 32 + 16; p.y = (P.square[1] + 3) * 32 + 16; for (let i = 0; i < 30; i++) RF.tick(16);
    const up = [], dr = [], tot = [];
    for (let i = 0; i < n; i++) { const a = performance.now(); RF.tick(16); const b = performance.now(); RF.R.drawFrame(performance.now()); const c = performance.now(); up.push(b - a); dr.push(c - b); tot.push(c - a); }
    out[nm] = { up: st(up), draw: st(dr), tot: st(tot) }; all.up.push(...up); all.dr.push(...dr); all.tot.push(...tot);
    await new Promise(r => setTimeout(r, 0));
  }
  out.all600 = { up: st(all.up), draw: st(all.dr), tot: st(all.tot) };
  p.x = hx; p.y = hy; S.minute = m0; return out;
}
export async function both() {
  const B = await import('/ROTFALL_STATE/perf/bench.js?x=' + Date.now());
  const b = await B.run(); const s = await series(); return { bench: b, series: s };
}
