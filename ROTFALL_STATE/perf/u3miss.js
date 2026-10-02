/* PERF-U3 Messhilfe (temporär): Bild-Fehlgriffe des Figuren-Caches IM Bild (nicht in Leerlauf) bei Spieltakt (16 ms) — Varonheim, Tag. */
export async function run(frames = 600) {
  const base = location.pathname.includes('/u3') ? location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') : '';
  const SP = await import(base + '/src/sprites.js?v=23'), { TOWN_PLAN } = await import(base + '/src/world.js?v=23');
  const RF = window.RF, S = RF.S, p = S.player, P = TOWN_PLAN.varonheim; S._quiet = true; S.minute = 12 * 60 + 5;
  p.x = P.square[0] * 32 + 16; p.y = (P.square[1] + 3) * 32 + 16;
  let inFrame = 0, frMiss = 0, worst = 0; const t = [];
  for (let i = 0; i < frames; i++) {
    const a = performance.now(); RF.tick(16); const m0 = SP.frameCacheInfo().miss; const b = performance.now(); RF.R.drawFrame(performance.now()); const c = performance.now();
    const d = SP.frameCacheInfo().miss - m0; inFrame += d; if (d) frMiss++; worst = Math.max(worst, d); t.push(c - a);
    await new Promise(r => setTimeout(r, Math.max(1, 16 - (performance.now() - a))));
  }
  t.sort((x, y) => x - y);
  return { inFrame, framesWithMiss: frMiss, worst, total: SP.frameCacheInfo().miss, med: +t[t.length >> 1].toFixed(1), p95: +t[Math.floor(t.length * 0.95)].toFixed(1), p99: +t[Math.floor(t.length * 0.99)].toFixed(1) };
}
