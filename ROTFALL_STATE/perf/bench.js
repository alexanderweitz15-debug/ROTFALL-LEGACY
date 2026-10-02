/* ROTFALL Performance-Bench (Lead, 02.10.2026). Im Browser nach Laden mit Spielstand-Sicherheit (HUNT.md) ausführen:
   const B = await import('/ROTFALL_STATE/perf/bench.js?x=' + Date.now()); window.__pb = null; setTimeout(async () => window.__pb = await B.run(), 50);
   dann getrennt window.__pb lesen. Misst je Szene 120 Bilder: update (RF.tick 16 ms) und Zeichnen (RF.R.drawFrame) getrennt.
   Ziel des Entwicklers: Median Gesamt (update + draw) <= 3 ms. Spielstand wird NICHT gespeichert (RF.S._quiet = true vorher setzen). */
import { TOWN_PLAN } from '/src/world.js?v=23';
const SCENES = [
  ['Varonheim Markt', S => { const P = TOWN_PLAN.varonheim || null; return P ? [P.square[0], P.square[1] + 3] : null; }],
  ['Aurelheim', S => { const P = TOWN_PLAN.aurelheim || null; return P ? [P.square[0], P.square[1] + 3] : null; }],
  ['Nordfurt', S => { const P = TOWN_PLAN.northcity || null; return P ? [P.square[0], P.square[1] + 3] : null; }],
  ['Wildnis', S => [Math.round(S.player.x / 32) + 120, Math.round(S.player.y / 32) + 40]],
];
const med = a => { const b = [...a].sort((x, y) => x - y); return b[b.length >> 1]; }, p95 = a => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length * 0.95)]; };
export async function run(frames = 120) {
  const RF = window.RF, S = RF.S, p = S.player, home = { x: p.x, y: p.y, map: S.map }, out = [];
  S._quiet = true;
  for (const [name, at] of SCENES) {
    const t = at(S); if (!t) { out.push({ name, skip: true }); continue; }
    p.x = t[0] * 32 + 16; p.y = t[1] * 32 + 16; for (let i = 0; i < 20; i++) RF.tick(16);   /* einschwingen */
    const up = [], dr = [];
    for (let i = 0; i < frames; i++) { const a = performance.now(); RF.tick(16); const b = performance.now(); RF.R.drawFrame(performance.now()); const c = performance.now(); up.push(b - a); dr.push(c - b); }
    const tot = up.map((u, i) => u + dr[i]);
    out.push({ name, ents: S.ents[S.map].length, update: +med(up).toFixed(2), draw: +med(dr).toFixed(2), total: +med(tot).toFixed(2), p95: +p95(tot).toFixed(2) });
    await new Promise(r => setTimeout(r, 0));
  }
  p.x = home.x; p.y = home.y; return out;
}
