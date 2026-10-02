import re,sys
B='src/'
def sub(path, old, new, cnt=1):
    s=open(path,encoding='utf-8',newline='').read()
    n=s.count(old)
    if n!=cnt: print('ANCHOR', path, n, repr(old[:70])); sys.exit(1)
    s=s.replace(old,new); open(path,'w',encoding='utf-8',newline='').write(s)
R=B+'render.js'
M=lambda n: f' __PF.m({n!r});'
sub(R,"  const m = MAPS[S.map]; if (!m) return;\n","  const m = MAPS[S.map]; if (!m) return; __PF.s();\n")
sub(R,"Math.floor(x1 / CH), Math.floor(y1 / CH));\n","Math.floor(x1 / CH), Math.floor(y1 / CH));"+M('d_ground')+"\n")
sub(R,"drawWater(tx, ty, now);\n\n","drawWater(tx, ty, now);"+M('d_water')+"\n\n")
sub(R,"// S12: Raster statt 14 000 Prüfungen\n","// S12: Raster statt 14 000 Prüfungen\n"+M('d_vis')+"\n")
sub(R,"    list.push(houseEnt(b));\n","    list.push(houseEnt(b));"+M('d_houses')+"\n")
sub(R,"  for (const e of list) drawEntity(e, now);\n","""  __PF.m('d_sort_cone'); for (const e of list) { const __a = performance.now(), __mi = __PF.miss; drawEntity(e, now); const __d = performance.now() - __a; __PF.ek(e.kind, __d); if (__d > __PF.emax) { __PF.emax = __d; __PF.ewho = e; __PF.emiss = __PF.miss - __mi; } } __PF.m('d_ents');\n""")
sub(R,"  drawFx(now);\n","  drawFx(now);"+M('d_proj_fx')+"\n")
sub(R,"  drawAmbience(now, list, m, x0, y0, x1, y1);","  __PF.m('d_chan_coop'); drawAmbience(now, list, m, x0, y0, x1, y1);"+M('d_ambience'))
for nm,ln in [('d_sky','  drawSkyLife(now);'),('d_fires','  drawFires(now);'),('d_light','  drawLight(now);\n'),('d_ambglow','  drawAmbienceGlow();'),('d_weather','  drawWeather(now);\n'),('d_guide','  drawPlaceGuide(shown || [], now);'),('d_floats','  drawFloats();\n'),('d_bubbles','  drawBubbles(performance.now());'),('d_boss','  drawBossBar();\n'),('d_track','  drawTrack(now);\n}')]:
    if ln.endswith('\n'): sub(R,ln,ln[:-1]+M(nm)+'\n')
    elif ln.endswith('}'): sub(R,ln,ln[:-2]+M(nm)+'\n}')
    else: sub(R,ln,ln+M(nm))
# sprites: cache miss timing
SP=B+'sprites.js'
sub(SP,"  f = make(); frameCache.set(k, f); return f;","  __PF.miss++; const __a = performance.now(); f = make(); const __d = performance.now() - __a; __PF.mkT += __d; if (__d > __PF.mkMax) { __PF.mkMax = __d; __PF.mkKey = k; } frameCache.set(k, f); return f;")
sub(SP,"export function humanSpec(e) {\n","export function humanSpec(e) { __PF.hs++;\n")
sub(SP,"  let L = lookCache.get(k); if (L) return L;\n","  let L = lookCache.get(k); if (L) return L; __PF.lk++;\n")
# game.js update
G=B+'game.js'
def gs(old,new,cnt=1): sub(G,old.replace('\n','\r\n'),new.replace('\n','\r\n'),cnt)
gs("  const p = S.player;\n  coopHooks.hostTick?.(dt);\n","  const p = S.player; __PF.s();\n  coopHooks.hostTick?.(dt);\n")
gs("morrTick(); }   // S15 Morrgrund\n","morrTick(); }   // S15 Morrgrund\n __PF.m('u_pre');\n")
gs("  if (hour !== lastHour) { lastHour = hour; hourTick(hour); }\n","  __PF.m('u_clock'); if (hour !== lastHour) { lastHour = hour; hourTick(hour); }  __PF.m('u_hour');\n")
gs("  if (S.day !== lastDay) { lastDay = S.day; dayTick(); }\n  festTick(); roadTick(dt);\n","  if (S.day !== lastDay) { lastDay = S.day; dayTick(); } __PF.m('u_day');\n  festTick(); __PF.m('u_fest'); roadTick(dt); __PF.m('u_road');\n")
gs("tierOf(A, now) : null;   /* PERF-U: Stufenplan (siehe tierOf) */\n","tierOf(A, now) : null;   /* PERF-U: Stufenplan (siehe tierOf) */\n __PF.m('u_actors_tier');\n")
gs("  if (p.alive) controlPlayer(dt);\n"," __PF.m('u_combat_cars'); if (p.alive) controlPlayer(dt); __PF.m('u_control');\n")
gs("for (const e of T2.hot) think(e, dt);","for (const e of T2.hot) { const __a = performance.now(); think(e, dt); const __d = performance.now() - __a; if (__d > __PF.tmax) { __PF.tmax = __d; __PF.twho = e; } }")
gs("  separate();                                                     // S12: niemand steht im anderen\n","  __PF.m('u_think'); separate(); __PF.m('u_separate');\n")
gs("  updateProjectiles(dt);\n  updateFx(dt);\n  updateBuildings(dt);\n  camStep(p, dt);\n","  __PF.m('u_rise_pursuit'); updateProjectiles(dt); __PF.m('u_proj');\n  updateFx(dt); __PF.m('u_fx');\n  updateBuildings(dt); __PF.m('u_bld');\n  camStep(p, dt); __PF.m('u_cam');\n")
gs("  drawMini(dt); reactTick(dt); ambientTick(dt); sceneTick();\n","  __PF.m('u_place'); drawMini(dt); __PF.m('u_mini'); reactTick(dt); __PF.m('u_react'); ambientTick(dt); __PF.m('u_ambientTick'); sceneTick(); __PF.m('u_scene');\n")
gs("UI.refreshHUD(); }   /* PERF-S","UI.refreshHUD(); __PF.m('u_refreshHUD'); }   /* PERF-S")
gs("    hudTimer = 0; UI.renderContext(selected || hovered); updatePrompt();\n","    hudTimer = 0; __PF.m('u_hud0'); UI.renderContext(selected || hovered); __PF.m('u_renderContext'); updatePrompt(); __PF.m('u_prompt');\n")
gs("    if (S.map === 'world') revealAround(","   __PF.m('u_track'); if (S.map === 'world') revealAround(")
gs("    if ((tribT += 180) >= 1000) {","   __PF.m('u_reveal'); if ((tribT += 180) >= 1000) {")
gs("    else if (tribT === 720) { conTick(); jailTick(); }\n","    else if (tribT === 720) { conTick(); jailTick(); }\n  __PF.m('u_sec' + tribT);\n")
gs("  ambT = (ambT || 0) + dt;\n","  __PF.m('u_hudrest'); ambT = (ambT || 0) + dt;\n")
gs("  respawnTimer += dt;\n","  __PF.m('u_ambsound'); respawnTimer += dt;\n")
gs("  if (travelTimer > 6000) { travelTimer = 0; travelTick(); }\n}\n","  if (travelTimer > 6000) { travelTimer = 0; travelTick(); } __PF.m('u_tail');\n}\n")
print('ok')
