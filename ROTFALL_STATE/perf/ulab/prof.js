/* PERF-U Labor: Abschnittszeiten je Szene (nur mit instrumentierter Kopie ulab/src). */
export async function prof(base, N = 120) {
  const { TOWN_PLAN: TP } = await import(base + 'world.js?v=23');
  const RF = window.RF, S = RF.S, p = S.player, home = { x: p.x, y: p.y }, res = {};
  const sc = { var: TP.varonheim.square, aur: TP.aurelheim.square, nord: TP.northcity.square, wild: [Math.round(home.x / 32) + 120, Math.round(home.y / 32) + 37] };
  for (const [k, q] of Object.entries(sc)) {
    p.x = q[0] * 32 + 16; p.y = (q[1] + 3) * 32 + 16; for (let i = 0; i < 20; i++) RF.tick(16);
    const PR = window.__PR || {}; for (const key in PR) delete PR[key];
    const a = performance.now(); for (let i = 0; i < N; i++) RF.tick(16); const tot = (performance.now() - a) / N;
    res[k] = { tot: +tot.toFixed(2), top: Object.entries(PR).map(([l, v]) => l + '=' + (v / N).toFixed(3)).sort((x, y) => +y.split('=')[1] - +x.split('=')[1]).slice(0, 26).join(' ') };
    await new Promise(r => setTimeout(r, 0));
  }
  p.x = home.x; p.y = home.y; return res;
}
