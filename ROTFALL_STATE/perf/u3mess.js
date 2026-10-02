/* PERF-U3 Messhilfe (temporär): Ausreißer-Jagd. Läuft in der instrumentierten Kopie (u3/index.html, __PF) oder im echten Spiel (ohne __PF nur Zahlen).
   const M = await import('/ROTFALL_STATE/perf/u3mess.js?x=' + Date.now()); window.__r = null; setTimeout(async () => window.__r = await M.run(), 50); */
const st = a => { const b = [...a].sort((x, y) => x - y), f = q => +b[Math.min(b.length - 1, Math.floor(b.length * q))].toFixed(2); return { n: b.length, med: f(0.5), p95: f(0.95), p99: f(0.99), max: +b[b.length - 1].toFixed(1) }; };
const desc = e => !e ? null : [e.kind, e.mtype || e.prof || e.type || '', e.id ?? '', e.downed ? 'downed' : '', e.alive === false ? 'dead' : '', e.talk ? 'talk' : '', e.act ? 'act:' + e.act.kind : '', e.mounted ? 'mount' : '', e.swing > 0 ? 'swing' : ''].filter(Boolean).join(' ');
export async function run({ frames = 300, thr = 8, scenes = null, combat = true } = {}) {
  const RF = window.RF, S = RF.S, p = S.player, PF = window.__PF, home = { x: p.x, y: p.y }, m0 = S.minute, out = { scenes: [], spikes: [] };
  const { TOWN_PLAN } = await import(location.pathname.includes('/u3') ? '/ROTFALL_STATE/perf/u3/src/world.js?v=23' : '/src/world.js?v=23');
  S._quiet = true;
  const at = n => { const P = TOWN_PLAN[n]; return [P.square[0], P.square[1] + 3]; };
  const SC = scenes || [['varonheim', at('varonheim'), 12 * 60 + 5], ['varonheim-n', at('varonheim'), 23 * 60 + 5], ['nordfurt', at('northcity'), 12 * 60 + 5], ['nordfurt-n', at('northcity'), 23 * 60 + 5],
    ['aurelheim', at('aurelheim'), 12 * 60 + 5], ['wild', [Math.round(home.x / 32) + 120, Math.round(home.y / 32) + 40], 12 * 60 + 5], ['varon-kampf', at('varonheim'), 15 * 60 + 5, 1]];
  const all = [];
  for (const [name, t, min, fight] of SC) {
    S.minute = min; p.x = t[0] * 32 + 16; p.y = t[1] * 32 + 16; for (let i = 0; i < 30; i++) RF.tick(16);
    if (fight && combat) for (let k = 0; k < 4; k++) RF.spawnEnemy('bandit', 'world', t[0] + 4 + k, t[1] + 2, {});
    const up = [], dr = [], tot = []; let gcN = 0, gcT = 0;
    for (let i = 0; i < frames; i++) {
      if (fight) { p.hp = p.maxHp; p.downed = false; }
      PF?.reset(); const h0 = performance.memory?.usedJSHeapSize || 0;
      const a = performance.now(); RF.tick(16); const b = performance.now(); RF.R.drawFrame(performance.now()); const c = performance.now();
      const h1 = performance.memory?.usedJSHeapSize || 0, gc = h1 < h0 - 200000;
      up.push(b - a); dr.push(c - b); tot.push(c - a); if (gc) { gcN++; gcT += c - a; }
      if (c - a > thr) {
        const rec = { sc: name, i, tot: +(c - a).toFixed(1), up: +(b - a).toFixed(1), dr: +(c - b).toFixed(1), gc, heapMB: +((h1 - h0) / 1e6).toFixed(2) };
        if (PF) { const secs = []; for (let j = 0; j < PF.L.length; j++) if (PF.cur[j] > 0.7) secs.push(PF.L[j] + ':' + PF.cur[j].toFixed(1)); rec.secs = secs.join(' ');
          rec.ent = PF.emax > 0.7 ? desc(PF.ewho) + ' ' + PF.emax.toFixed(1) + (PF.emiss ? ' miss' + PF.emiss : '') : ''; rec.miss = PF.miss; rec.mk = PF.miss ? PF.mkT.toFixed(1) + '/' + PF.mkMax.toFixed(1) + ' ' + String(PF.mkKey).slice(-60) : '';
          rec.think = PF.tmax > 0.7 ? desc(PF.twho) + ' ' + PF.tmax.toFixed(1) : ''; rec.hs = PF.hs; rec.lk = PF.lk; }
        out.spikes.push(rec);
      }
      if (i % 50 === 49) await new Promise(r => setTimeout(r, 0));
    }
    all.push(...tot);
    out.scenes.push({ name, ents: S.ents[S.map].length, up: st(up), dr: st(dr), tot: st(tot), over8: tot.filter(x => x > 8).length, gcN, gcAvg: gcN ? +(gcT / gcN).toFixed(1) : 0 });
    await new Promise(r => setTimeout(r, 0));
  }
  out.all = st(all); p.x = home.x; p.y = home.y; S.minute = m0; return out;
}
