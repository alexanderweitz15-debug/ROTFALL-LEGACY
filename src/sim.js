// Weltsimulation (Phase 18–20): Stadtmärkte, Karawanen, Heere und Front. Läuft ohne den Spieler.
import { S, log, chronicle, rnd, ri, pick, chance, clamp, year, uid } from './state.js?v=17';
import { ITEMS, TOWNS, GOODS, WAR_NODES, WAR_EDGES, FACTIONS } from './data.js?v=17';
import { LOCATIONS, TS, T, SOLID, HOUSES, MAPS, tileAt, worldPt, wT, OX } from './world.js?v=17';
import * as ECO from './economy.js?v=17';

export const H = {};                     // von game.js: spawnEnemy(type,map,tx,ty,opts), spawnRefugee(x,y,to), toast(t)
const LOC = Object.fromEntries(LOCATIONS.map(l => [l.key, l]));
const NEIGH = {};
for (const [a, b] of WAR_EDGES) { (NEIGH[a] ||= []).push(b); (NEIGH[b] ||= []).push(a); }

export function initSim() {
  buildRoute();
  S.towns ||= structuredClone(TOWNS);
  if (!S.war || !S.war.nodes) S.war = {
    nodes: structuredClone(WAR_NODES),
    armies: [newArmy('undead', 'graveyard', 40), newArmy('valen', 'northcity', 50),
             newArmy('undead', 'blackkeep', 34), newArmy('valen', 'saltport', 28)],
    battles: [],
  };
  S.priceSeen ||= {};
  ECO.initEco();
  if (!S.ents.world.some(e => e.kind === 'caravan') && !(S.caravanBack > S.day)) spawnCaravan();
}
function newArmy(faction, at, strength) {
  return { id: uid(), faction, at, prev: at, strength,
    name: faction === 'undead' ? pick(['Heer der Gruft', 'Die Stille Schar', 'Morvaths Zug']) : pick(['Nordfurter Aufgebot', 'Valens Grenzbanner', 'Die Blaue Wacht']) };
}

// ---------------- Märkte ----------------
export function townState(key) {
  const t = S.towns[key], node = S.war.nodes[key];
  if (node && node.owner === 'undead') return 'Besetzt';
  if (S.war.armies.some(a => a.faction === 'undead' && (a.at === key || (NEIGH[key] || []).includes(a.at)))) return 'Bedroht';
  if (t.stock.grain < 5) return 'Hunger';
  if (t.hunger) return 'Hunger';
  return GOODS.filter(g => t.stock[g] >= ECO.target(t, g)).length >= 8 ? 'Wohlhabend' : 'Ruhig';
}
// S13: Preise, Produktion und Verbrauch aller Städte liegen in economy.js
export const townPrice = ECO.ecoPrice, notePrices = ECO.notePrices;
function economyDay() {
  ECO.ecoDay();
  // Heeresversorgung: Valen isst Nordfurts Weizen
  for (const a of S.war.armies.filter(a => a.faction === 'valen')) {
    const need = a.strength / 12, nc = S.towns.northcity;
    if (nc.stock.grain >= need) nc.stock.grain -= need;
    else { nc.stock.grain = 0; a.strength -= 4; log(`${a.name} hungert — Nordfurt fehlt Weizen.`, 'faction'); }
  }
}

// ---------------- Karawanen ----------------
// Route Eren → Nordfurt: günstigster Weg über die Straße (Dijkstra, Straße/Brücke billig, Wiese teuer, Häuser/Wasser/feste
// Objekte gesperrt, Kanten neben Hindernissen teurer — der Zug ist breit). Früher feste Wegpunkte im Entwurfsmaßstab: nach der
// Streckung (Session 5) fuhr die Karawane drei Kacheln neben der Straße über die Wiese. Aus der Karte gebaut bleibt sie auf der
// Straße, auch wenn eine spätere Session die Straße verlegt. Wegpunkte in Kacheln (+0,5 = Kachelmitte), Karawanen fahren ohne Kollision.
export let ROUTE = [];
const ROUTE_ENDS = [[62, 65], [129, 61]];                   // Eren (Marktweg) → Nordfurter Torstraße, Entwurfskoordinaten
// S13: allgemeiner Straßenweg zwischen zwei Kacheln (A*), für Karawane und Reisende. Kosten wie früher: Straße/Brücke 1, Erde 3,
// sonst 8, +4 neben Hindernissen (der Zug ist breit); Häuser, Wasser, feste Objekte gesperrt. Das Kostenraster entsteht einmal je
// Welt (buildRoute leert es), die Suchfelder werden wiederverwendet (Stempel statt neuer Arrays) — sonst ruckelte jede neue Route.
// Ergebnis im Speicher zwischengelagert, nicht im Spielstand. null = kein Weg. Wegpunkte nur an Knicken, in Kacheln (+0,5).
const roadCache = new Map();
let RG = null;
function roadGrid() {
  const M = MAPS.world, w = M.w, h = M.h, blk = new Uint8Array(w * h), cost = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (SOLID.has(tileAt('world', x, y))) blk[y * w + x] = 1;
  for (const b of HOUSES) if (b.map === 'world') for (let y = Math.max(0, b.y); y < Math.min(h, b.y + b.h); y++) for (let x = Math.max(0, b.x); x < Math.min(w, b.x + b.w); x++) blk[y * w + x] = 1;
  for (const e of S.ents.world) if (e.kind === 'prop' && e.solid) { const x = e.x / TS | 0, y = e.y / TS | 0; if (x >= 0 && y >= 0 && x < w && y < h) blk[y * w + x] = 1; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (blk[i]) continue; const t = tileAt('world', x, y); let c = t === T.ROAD || t === T.PLANK ? 1 : t === T.DIRT ? 3 : 8;
    if ((x > 0 && blk[i - 1]) || (x < w - 1 && blk[i + 1]) || (y > 0 && blk[i - w]) || (y < h - 1 && blk[i + w])) c += 4;
    cost[i] = c;
  }
  return { w, h, blk, cost, dist: new Float64Array(w * h), prev: new Int32Array(w * h), seen: new Uint32Array(w * h), gen: 0 };
}
// wgt > 1: gewichtetes A* (schneller, Weg höchstens wgt-mal so teuer). Die Suche ist ein Generator: roadPath rechnet sofort
// (Laden, Tests), roadAsync stellt sie in eine Warteschlange, die pumpRoads je Bild mit festem Zeitbudget abarbeitet (keine Ruckler).
const rkey = (ax, ay, bx, by, wgt) => ax + ',' + ay + '>' + bx + ',' + by + '*' + wgt;
export function roadPath(ax, ay, bx, by, wgt = 1) {
  const key = rkey(ax, ay, bx, by, wgt); if (roadCache.has(key)) return roadCache.get(key);
  if (roadQueue[0]) roadQueue[0].it = null;                                           // teilt sich die Suchfelder: angefangene Suche neu starten
  const it = roadSearch(ax, ay, bx, by, wgt, key); let r; do r = it.next(); while (!r.done); return r.value;
}
const roadQueue = [];
export function roadAsync(ax, ay, bx, by, wgt = 1) {
  const key = rkey(ax, ay, bx, by, wgt); if (roadCache.has(key)) return roadCache.get(key);
  if (!roadQueue.some(j => j.key === key)) roadQueue.push({ key, args: [ax, ay, bx, by, wgt, key], it: null });
  return undefined;                                                                   // noch in Arbeit
}
export function pumpRoads(ms = 1.5) {
  const t0 = performance.now();
  while (roadQueue.length && performance.now() - t0 < ms) { const J = roadQueue[0]; J.it ||= roadSearch(...J.args); if (J.it.next().done) roadQueue.shift(); }
}
function* roadSearch(ax, ay, bx, by, wgt, key) {
  const G = (RG ||= roadGrid()), { w, h, blk, cost, dist, prev, seen } = G, gen = ++G.gen;
  const ok = (x, y) => x >= 0 && y >= 0 && x < w && y < h, start = ay * w + ax, goal = by * w + bx;
  if (!ok(ax, ay) || !ok(bx, by)) { roadCache.set(key, null); return null; }
  const free = i => !blk[i] || i === start || i === goal;
  const hh = (x, y) => { const dx = Math.abs(x - bx), dy = Math.abs(y - by); return (Math.max(dx, dy) + 0.414 * Math.min(dx, dy)) * wgt; };   // wgt 1 zulässig: jede Kachel kostet ≥ 1
  const heap = [];
  const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k) { const q = (k - 1) >> 1; if (heap[q][0] <= heap[k][0]) break; [heap[q], heap[k]] = [heap[k], heap[q]]; k = q; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k;
    if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  seen[start] = gen; dist[start] = 0; prev[start] = -1; push(hh(ax, ay), start);
  let found = false, steps = 0;
  while (heap.length && steps++ < 600000) {
    if ((steps & 511) === 0) yield;
    const [f, i] = pop(); if (i === goal) { found = true; break; }
    const x = i % w, y = i / w | 0; if (f - hh(x, y) > dist[i] + 1e-9) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy; if (!ok(nx, ny)) continue; const n = ny * w + nx; if (!free(n)) continue;
      if (dx && dy && (blk[y * w + nx] || blk[ny * w + x])) continue;                  // keine Ecke schneiden
      const nd = dist[i] + (cost[n] || 8) * (dx && dy ? 1.414 : 1);
      if (seen[n] !== gen || nd < dist[n]) { seen[n] = gen; dist[n] = nd; prev[n] = i; push(nd + hh(nx, ny), n); }
    }
  }
  let out = null;
  if (found) { const pts = []; for (let i = goal; i >= 0; i = prev[i]) pts.push([i % w, i / w | 0]); pts.reverse();
    out = pts.filter((q, k) => k === 0 || k === pts.length - 1 || q[0] - pts[k - 1][0] !== pts[k + 1][0] - q[0] || q[1] - pts[k - 1][1] !== pts[k + 1][1] - q[1])   // nur Knicke
      .map(([x, y]) => [x + 0.5, y + 0.5]); }
  roadCache.set(key, out); return out;
}
export function buildRoute() {
  roadCache.clear(); RG = null; roadQueue.length = 0;                                                       // neue Welt: alte Wege gelten nicht mehr
  const [[ax, ay], [bx, by]] = ROUTE_ENDS.map(([x, y]) => worldPt(x, y));
  ROUTE = roadPath(ax, ay, bx, by) || [[ax, ay], [bx, by]];                            // kein Weg (sollte nicht vorkommen): gerade Linie
  for (const c of S.ents.world) if (c.kind === 'caravan') {                           // Karawanen alter Stände: nächsten Wegpunkt in Fahrtrichtung
    const ord = c.dir > 0 ? ROUTE : ROUTE.slice().reverse();
    let best = 1, bd = Infinity;                                                      // nächster Abschnitt; Ziel ist sein Ende
    for (let k = 1; k < ord.length; k++) { const [ax, ay] = ord[k - 1].map(v => v * TS), [bx, by] = ord[k].map(v => v * TS), L = Math.hypot(bx - ax, by - ay) || 1;
      const u = clamp(((c.x - ax) * (bx - ax) + (c.y - ay) * (by - ay)) / (L * L), 0, 1), d = Math.hypot(ax + (bx - ax) * u - c.x, ay + (by - ay) * u - c.y);
      if (d < bd) { bd = d; best = k; } }
    c.wp = best;
  }
}
// Eine Karawane ist ein Zug (BUG-011): Leitwagen (die Entität: Lebenspunkte, Ladung, Ziel der Räuber) mit Ochsengespann und
// Kutscher, ein Beiwagen, der der Spur des Leitwagens folgt (nur Bild), und zwei Söldnerwachen — echte Figuren (game.js), die
// neben und hinter dem Zug gehen, Räuber stellen und bei der Ankunft ersetzt werden, wenn sie gefallen sind.
function spawnCaravan() {
  const [tx, ty] = ROUTE[0];
  const c = { id: uid(), kind:'caravan', map:'world', name:'Händlerkarawane', faction:'merch', x: tx * TS, y: ty * TS,
    hp: 140, maxHp: 140, r: 16, alive: true, dir: 1, wp: 1, cargo: {}, attacked: false, ambushChecked: false, facing: 3, trail: [] };
  load(c, 'eren');
  S.ents.world.push(c);
  H.hireEscorts?.(c);
}
const TRAIL_STEP = 12, TRAIL_MAX = 24;                     // Spurpunkte alle 12 px, 24 Punkte ≈ 290 px Zuglänge
// Punkt `back` px hinter dem Leitwagen entlang seiner Spur, mit Fahrtrichtung a. Ohne Spur (Abfahrt, alter Stand): geradlinig
// entgegen der Richtung zum nächsten Wegpunkt.
export function trailPt(c, back) {
  const T = c.trail || [];
  let x = c.x, y = c.y, left = back;
  for (let i = T.length - 1; i >= 0; i--) {
    const [px, py] = T[i], d = Math.hypot(px - x, py - y);
    if (d >= left && d > 0) { const k = left / d; return { x: x + (px - x) * k, y: y + (py - y) * k, a: Math.atan2(y - py, x - px) }; }
    left -= d; x = px; y = py;
  }
  const [gx, gy] = ROUTE[c.dir > 0 ? c.wp : ROUTE.length - 1 - c.wp], a0 = T.length > 1 ? Math.atan2(T[T.length - 1][1] - T[0][1], T[T.length - 1][0] - T[0][0])
    : Math.atan2(gy * TS - c.y, gx * TS - c.x);
  return { x: x - Math.cos(a0) * left, y: y - Math.sin(a0) * left, a: a0 };
}
export const WAGON_GAP = 104;                              // Beiwagen: Abstand Mitte–Mitte hinter dem Leitwagen (Zug im Maßstab 1,5)
// Platz der Wachen: 0 = seitlich am Leitwagen (Straßenrand), 1 = hinter dem Beiwagen
export function escortSlot(c, slot) {
  if (slot === 0) {                                       // Seitenplatz; in Mauer/Haus/Wasser: andere Seite, sonst dicht hinter dem Leitwagen
    const q = trailPt(c, 8), free = (x, y) => { const tx = x / TS | 0, ty = y / TS | 0;
      return !SOLID.has(tileAt('world', tx, ty)) && !HOUSES.some(b => b.map === 'world' && tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h); };
    for (const k of [34, -34]) { const x = c.x - Math.sin(q.a) * k, y = c.y + Math.cos(q.a) * k; if (free(x, y)) return { x, y }; }
    return trailPt(c, WAGON_GAP * 0.5);
  }
  return trailPt(c, WAGON_GAP + 64);
}
const clockMin = () => S.day * 1440 + S.minute;
function load(c, from) {
  const t = S.towns[from];
  c.cargo = {};
  const surplus = GOODS.map(g => [g, t.stock[g] - (t.use[g] || 0) * 4]).filter(([, v]) => v > 3).sort((a, b) => b[1] - a[1]).slice(0, 2);
  for (const [g, v] of surplus) { const n = Math.min(Math.floor(v), 15); c.cargo[g] = n; t.stock[g] -= n; }
}
export function caravanFrame(c, dt, player, nearFoes) {
  if (!c.alive) return;
  if (nearFoes) c.attacked = true;                               // unter Angriff: rollt langsam weiter
  if (c.restUntil > clockMin()) { c.vx = c.vy = 0; return; }     // Ankunft: abladen, neu beladen, dann zurück
  if (c.restUntil) { c.restUntil = 0; c.trail = []; }             // Abfahrt: der Zug wendet (neue Spur)
  const idx = c.dir > 0 ? c.wp : ROUTE.length - 1 - c.wp;
  const [tx, ty] = ROUTE[idx];
  const gx = tx * TS, gy = ty * TS, d = Math.hypot(gx - c.x, gy - c.y);
  const sp = (nearFoes ? 0.35 : 0.9) * dt / 16;
  if (d > sp) {
    c.vx = (gx - c.x) / d * sp; c.vy = (gy - c.y) / d * sp; c.x += c.vx; c.y += c.vy;
    if (Math.abs(c.vx) > 0.05) c.facing = c.vx > 0 ? 3 : 2;       // senkrechte Stücke: Seitenansicht bleibt
    const T = (c.trail ||= []), l = T[T.length - 1];
    if (!l || Math.hypot(c.x - l[0], c.y - l[1]) >= TRAIL_STEP) { T.push([Math.round(c.x), Math.round(c.y)]); if (T.length > TRAIL_MAX) T.shift(); }
  }
  else if (c.wp < ROUTE.length - 1) c.wp++;
  else arrive(c, player);
  // Hinterhalt auf halber Strecke
  if (!c.ambushChecked && Math.abs(c.x / TS - wT(101) - OX) < 3) {            // zwischen Eren (bis x 93) und der Nordfurter Brücke
    c.ambushChecked = true;
    if (chance(0.35)) {
      const guards = S.ents.world.filter(e => e.kind === 'npc' && e.alive && e.escort === c.id);
      if (Math.hypot(player.x - c.x, player.y - c.y) < 700 && player.map === 'world') {
        for (let i = 0; i < 3 + guards.length; i++) H.spawnEnemy('bandit', 'world', ...(H.pushOut ? H.pushOut('world', (c.x / TS | 0) + ri(-5, 5), (c.y / TS | 0) + ri(3, 6)) : [(c.x / TS | 0) + ri(-5, 5), (c.y / TS | 0) + ri(3, 6)]));   // ein bewachter Zug lockt mehr Räuber; AUDIT: von außerhalb des Bildes
        log('Banditen fallen über die Karawane her!', 'combat');
        H.toast('KARAWANE ÜBERFALLEN');
      } else if (guards.length && chance(0.3 + 0.15 * guards.length)) {    // außer Sicht: Wachen schlagen zurück, nicht ohne Preis
        if (chance(0.3)) { const g = pick(guards); g.alive = false; S.ents.world.splice(S.ents.world.indexOf(g), 1); }
        log('Räuber überfielen eine Karawane auf der Alten Straße — die Wachen schlugen sie zurück.', 'economy'); chronicle('Die Karawanenwachen schlugen Räuber auf der Alten Straße zurück', 'news');
      } else {
        for (const g of Object.keys(c.cargo)) c.cargo[g] = Math.floor(c.cargo[g] / 2);
        log('Eine Karawane wurde auf der Alten Straße ausgeraubt.', 'economy'); chronicle('Eine Karawane wurde auf der Alten Straße ausgeraubt', 'news');
      }
    }
  }
}
function arrive(c, player) {
  const to = c.dir > 0 ? 'northcity' : 'eren';
  const t = S.towns[to];
  H.hireEscorts?.(c);                                            // MP2 §106: gefallene Wachen werden in der Stadt ersetzt
  for (const [g, n] of Object.entries(c.cargo)) t.stock[g] += n;
  const sum = Object.values(c.cargo).reduce((a, b) => a + b, 0);
  if (sum) { log(`Karawane erreicht ${t.name} (${sum} Ladungen).`, 'economy'); chronicle(`Die Karawane ist heil in ${t.name} angekommen`, 'news'); }
  if (c.attacked && Math.hypot(player.x - c.x, player.y - c.y) < 400) {
    S.gold += 30; S.factions.merch += 4;
    log('Die Händler danken für den Geleitschutz: 30 Gold.', 'economy');
    H.toast('Geleitschutz belohnt');
  }
  c.dir = -c.dir; c.wp = 1; c.attacked = false; c.ambushChecked = false; c.vx = c.vy = 0;
  c.restUntil = clockMin() + 40;                                // 40 Spielminuten am Tor
  load(c, to);
  H.hireEscorts?.(c);                                           // gefallene Wachen werden in der Stadt ersetzt
}
export function caravanDied(c) {
  log('Die Karawane ist verloren. Ihre Ladung liegt auf der Straße.', 'economy'); chronicle('Die Karawane nach Nordfurt ist nie angekommen', 'news');
  S.factions.merch -= 2;
  S.caravanBack = S.day + 2;
}

// ---------------- Krieg ----------------
function path(from, goalFn) {                              // BFS über den Kriegsgraphen
  const prev = { [from]: null }, q = [from];
  while (q.length) {
    const n = q.shift();
    if (n !== from && goalFn(n)) { let k = n; while (prev[k] !== from) k = prev[k]; return k; }
    for (const m of NEIGH[n] || []) if (!(m in prev)) { prev[m] = n; q.push(m); }
  }
  return null;
}
const hostile = (a, b) => a && b && a !== b && (a === 'undead' || b === 'undead');
function nearPlayer(node, r = 40) {
  const l = LOC[node], p = S.player;
  return p && p.map === 'world' && Math.hypot(p.x / TS - l.x, p.y / TS - l.y) < r;
}

export function warTick() {                                  // alle 6 Spielstunden
  const W = S.war;
  if (W.battles.some(b => !b.garrisonFight)) return;         // laufende Feldschlacht vor Ort erst auswerten
  for (const a of W.armies) {
    let next = null;
    if (a.faction === 'undead') next = a.order && W.nodes[a.order] ? (a.at === a.order ? null : path(a.at, n => n === a.order)) : path(a.at, n => W.nodes[n].owner !== 'undead');   // S15 P20: Befehl des Spielers
    else next = path(a.at, n => W.nodes[n].owner === 'undead' || W.armies.some(b => b.faction === 'undead' && b.at === n));
    if (!next || (a.faction === 'valen' && a.strength < 25)) next = null;   // zu schwach: halten
    // §74 Vorwarnung: bevor ein Untotenheer auf eine Siedlung zieht, melden Späher es — das Heer sammelt sich einen Zug (6 Std.)
    const L = next && LOC[next];
    if (next && a.faction === 'undead' && L && (L.kind === 'city' || L.kind === 'village') && a.warned !== next) {
      a.warned = next;
      chronicle(`Späher: Die Toten ziehen auf ${L.name}`, 'news', `${a.name}, Stärke ${Math.round(a.strength)}.`);
      log(`Späher melden: ${a.name} zieht auf ${L.name}. Noch ein halber Tag.`, 'faction');
      if (nearPlayer(next, 30)) H.toast(`WARNUNG: DIE TOTEN ZIEHEN AUF ${L.name.toUpperCase()}`);
      continue;
    }
    if (next) { a.prev = a.at; a.at = next; }
  }
  for (const node of Object.keys(W.nodes)) resolveNode(node);
}

function resolveNode(node) {
  const W = S.war, here = W.armies.filter(a => a.at === node);
  const und = here.find(a => a.faction === 'undead'), val = here.find(a => a.faction === 'valen');
  const owner = W.nodes[node].owner;
  let att = null, def = null;
  if (und && val) { att = und; def = val; }
  else if (und && hostile('undead', owner)) { att = und; def = garrisonArmy(node); }
  else if (val && owner === 'undead') { att = val; def = garrisonArmy(node); }
  else if ((und || val) && !owner) { capture(node, (und || val).faction); return; }
  if (!att) return;
  if (def.strength <= 0) { capture(node, att.faction); return; }
  if (nearPlayer(node)) return materialize(node, att, def);
  battleAbstract(node, att, def);
}
function garrisonArmy(node) {
  const n = S.war.nodes[node];
  return { id: 'g:' + node, garrison: node, faction: n.owner, strength: n.garrison, name: `Besatzung von ${LOC[node].name}` };
}
function setStrength(a, v) {
  if (a.garrison) S.war.nodes[a.garrison].garrison = Math.max(0, v); else a.strength = Math.max(0, v);
}
function battleAbstract(node, a, d) {
  const ra = a.strength * (0.75 + rnd() * 0.5), rd = d.strength * (0.85 + rnd() * 0.5);
  const win = ra >= rd ? a : d, lose = win === a ? d : a;
  setStrength(win, win.strength - lose.strength * (0.2 + rnd() * 0.15));
  setStrength(lose, lose.strength * (0.35 + rnd() * 0.2));
  const txt = `Schlacht bei ${LOC[node].name}: ${win.name} siegt über ${lose.name}.`;
  log(txt, 'faction');
  if (a.strength + d.strength > 40) chronicle(`Schlacht bei ${LOC[node].name}`, 'battle', txt);
  afterBattle(node, win, lose);
}
function afterBattle(node, win, lose) {
  if (!lose.garrison) lose.at = lose.prev || lose.at;       // Verlierer weicht zurück
  if (win.garrison) return;
  capture(node, win.faction);
  cleanupArmies();
}
function capture(node, faction) {
  const n = S.war.nodes[node];
  if (n.owner === faction) return;
  const was = n.owner;
  n.owner = faction; n.garrison = faction === 'undead' ? 10 : 8; n.wave = 0; n.waves = 0;   // neu besetzt: Befreiung beginnt wieder bei Welle 1
  if (faction === 'undead') for (const a of S.war.armies) if (a.order === node) { a.order = null; H.heldTaken?.(node); }   // S15 P20: Befehl erfüllt
  const L = LOC[node];
  log(`${L.name} fällt an ${FACTIONS[faction].name}.`, 'faction');
  if (S.towns[node]) {
    if (faction === 'undead') {
      const t = S.towns[node], lost = Math.round(t.pop * 0.4);
      t.pop -= lost;
      const refuge = node === 'eren' ? 'northcity' : 'eren';
      if (S.towns[refuge]) S.towns[refuge].pop += Math.round(lost * 0.7);
      chronicle(`${L.name} fällt an die Untoten`, 'battle', `${lost} Menschen fliehen. Die Straßen füllen sich mit Flüchtlingen.`);
      log(`Flüchtlinge aus ${L.name} ziehen nach ${LOC[refuge].name}.`, 'world');
      H.toast(`${L.name.toUpperCase()} IST GEFALLEN`);
      if (S.player.map === 'world') for (let i = 0; i < 3; i++) H.spawnRefugee(L.x, L.y, refuge);
    }
  }
  if (faction === 'undead') H.raidDamage?.(node);                 // §74 Nachwirkung: Kriegsschäden an Häusern
  if (was === 'undead' && faction !== 'undead') {                  // Befreiung — für jeden Ort, nicht nur für Orte mit Markt
    chronicle(`${L.name} befreit`, 'battle', `${FACTIONS[faction].name} nimmt ${L.name} zurück.`);
    H.toast(`${L.name.toUpperCase()} BEFREIT`);
    if (nearPlayer(node, 30)) { const [ox, oy] = waveOrigin(node, 3); for (let i = 0; i < 4; i++) H.spawnRefugee(ox, oy, node);   // §81: sichtbar — Geflohene kehren heim
      if (S.towns[node]) S.towns[node].pop += 6; log(`Die Geflohenen kehren nach ${L.name} zurück.`, 'world'); }
  }
}
function cleanupArmies() {
  const W = S.war;
  W.armies = W.armies.filter(a => {
    if (a.strength >= 6) return true;
    log(`${a.name} ist zerschlagen.`, 'faction');
    chronicle(`${a.name} zerschlagen`, 'battle');
    return false;
  });
}
export function warDay() {
  const W = S.war;
  const undNodes = Object.values(W.nodes).filter(n => n.owner === 'undead').length;
  for (const a of W.armies) a.strength += a.faction === 'undead' ? 2 + undNodes : (S.towns.northcity.stock.grain > 10 ? 4 : 0);
  // Der Krieg endet nicht: zerschlagene Heere werden neu aufgestellt
  if (!W.armies.some(a => a.faction === 'undead') && chance(0.35)) {
    const base = Object.keys(W.nodes).find(k => W.nodes[k].owner === 'undead') || 'graveyard';
    W.nodes[base].owner = 'undead';
    W.armies.push(newArmy('undead', base, 30)); log('Aus der Gruft erhebt sich ein neues Heer.', 'faction');
  }
  if (!W.armies.some(a => a.faction === 'valen') && chance(0.3)) { W.armies.push(newArmy('valen', 'northcity', 35)); log('Valen stellt ein neues Aufgebot auf.', 'faction'); }
  economyDay();
}

// ---- Schlacht vor Ort (Stufe A): Heere werden zu Einheiten ----
function materialize(node, att, def) {
  const L = LOC[node];
  const b = { node, sides: [att.id, def.id], started: S.day * 1440 + S.minute };
  // §74 Anmarsch statt Spawn im Ort: Angreifer erscheinen ~20 Kacheln vor dem Ort, auf der Seite, von der sie kommen,
  // und ziehen zum Ort (Anker = Ort); Verteidiger stehen im Ort.
  const from = LOC[att.prev] && att.prev !== node ? LOC[att.prev] : { x: L.x - 1, y: L.y }, fd = Math.hypot(from.x - L.x, from.y - L.y) || 1;
  const sx = L.x + (from.x - L.x) / fd * Math.min(20, fd), sy = L.y + (from.y - L.y) / fd * Math.min(20, fd), home = { x: (L.x + 0.5) * TS, y: (L.y + 0.5) * TS };
  for (const side of [att, def]) {
    const n = clamp(Math.round(side.strength / 8), 2, 7), at = side === att;
    for (let i = 0; i < n; i++) {
      let [qx, qy] = [Math.round((at ? sx : L.x) + ri(-3, 3)), Math.round((at ? sy : L.y) + ri(-3, 3))];
      if (H.inView?.('world', qx * TS, qy * TS)) { if (at) [qx, qy] = H.pushOut('world', qx, qy); else { const hs = HOUSES.filter(h => h.town === node && h.map === 'world'); const h = hs[(i * 7) % Math.max(1, hs.length)]; if (h) [qx, qy] = h.doorTile; } }   // AUDIT: Angreifer von außerhalb, Verteidiger aus den Häusern
      H.spawnEnemy(side.faction === 'undead' ? 'skeleton' : 'valen_soldier', 'world', qx, qy,
        { armyId: side.id, worth: side.strength / n, level: 4, anchor: { ...home }, marching: at || undefined });
    }
  }
  S.war.battles.push(b);
  log(`Schlacht bei ${L.name}! ${att.name} gegen ${def.name}.`, 'combat');
  H.toast(`SCHLACHT BEI ${L.name.toUpperCase()}`);
}
// Sammelpunkt einer Welle: ~14 Kacheln vor dem Ort, zu Fuß erreichbar (BFS vom Ortskern), je Welle eine andere Seite
function waveOrigin(node, k) {
  const L = LOC[node], cx = Math.round(L.x), cy = Math.round(L.y), seen = new Set([cx + ',' + cy]), q = [[cx, cy]], ring = [];
  for (let i = 0; i < q.length && q.length < 5000; i++) { const [x, y] = q[i], d = Math.hypot(x - cx, y - cy);
    if (d >= 13 && d <= 15) ring.push([x, y]);
    if (d > 15) continue;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { const key = nx + ',' + ny;
      if (!seen.has(key) && !SOLID.has(tileAt('world', nx, ny))) { seen.add(key); q.push([nx, ny]); } } }
  if (!ring.length) return [cx, cy];
  const a = k * 2.1;
  return ring.reduce((b, p) => (Math.cos(Math.atan2(p[1] - cy, p[0] - cx) - a) > Math.cos(Math.atan2(b[1] - cy, b[0] - cx) - a) ? p : b));
}
// Phase 6 (MP2 §62): Untoten-Heere mit Rollen — Nahkampf, Fernkampf, Magier, Elite, Belagerung, Monster. Das Ziel bestimmt die
// Mischung: Städte bekommen Belagerung, Karawanen Hetzer und Flieger, Militär Elite und Schützen. Ab so vielen Einheiten wie
// Rollen ist jede Rolle mindestens einmal dabei.
export const UNDEAD_ROLES = { melee: ['skeleton', 'skeleton', 'zombie', 'ghoul'], ranged: ['bone_archer'], mage: ['necromancer', 'cultist'], elite: ['bone_knight', 'death_knight'],
  siege: ['flesh_golem'], monster: ['bone_hound', 'carrion_wing', 'ash_demon', 'shade', 'wraith'] };
const UNDEAD_MIX = { town: { melee: 5, ranged: 2, mage: 1, elite: 1, siege: 1, monster: 1 }, village: { melee: 5, ranged: 1, mage: 1, monster: 2 },
  caravan: { melee: 2, ranged: 1, monster: 3 }, military: { melee: 3, ranged: 2, mage: 1, elite: 2, monster: 1 }, production: { melee: 3, mage: 1, siege: 1, monster: 2 } };
export function undeadMix(n, target = 'village') {
  const w = UNDEAD_MIX[target] || UNDEAD_MIX.village, keys = Object.keys(w), pool = keys.flatMap(r => Array(w[r]).fill(r));
  const roles = n >= keys.length ? [...keys] : ['melee'];
  while (roles.length < n) roles.push(pick(pool));
  return roles.slice(0, n).map(role => ({ role, type: pick(UNDEAD_ROLES[role]) }));
}
function spawnWave(node, n, id) {
  const L = LOC[node], [ox, oy] = waveOrigin(node, n.wave), last = n.wave >= n.waves, keep = node === 'blackkeep';
  const types = undeadMix(3 + (n.wave - 1) + (keep ? 2 : 0), keep ? 'military' : 'town').map(u => u.type);   // Phase 6: gemischte Heere
  if (last) types.push('death_captain');
  const worth = n.garrison / types.length / Math.max(1, n.waves - n.wave + 1), home = { x: (L.x + 0.5) * TS, y: (L.y + 0.5) * TS };
  for (const t of types) H.spawnEnemy(t, 'world', ...(H.pushOut ? H.pushOut('world', ox + ri(-2, 2), oy + ri(-2, 2)) : [ox + ri(-2, 2), oy + ri(-2, 2)]),   // AUDIT: Welle kommt von außerhalb des Bildes
    { armyId: id, worth, level: t === 'death_captain' ? (keep ? 9 : 6) : 4 + n.wave, anchor: { ...home }, marching: true, boss: t === 'death_captain' || undefined });
  log(last ? `Welle ${n.wave}/${n.waves}: der Hauptmann der Toten führt sie selbst.` : `Welle ${n.wave}/${n.waves} marschiert auf ${L.name}.`, 'combat');
  H.toast(last ? 'DER HAUPTMANN DER TOTEN' : `WELLE ${n.wave}/${n.waves}`);
}
export const materializeForTest = (node, att, def) => materialize(node, att, def);   // Selbsttest
export function unitDied(e) {
  const a = findArmy(e.armyId); if (a) setStrength(a, a.strength - (e.worth || 5));
}
function findArmy(id) {
  if (id && id.startsWith('g:')) return garrisonArmy(id.slice(2));
  return S.war.armies.find(a => a.id === id);
}
export function battleCheck() {                              // alle paar Sekunden aus game.js
  const W = S.war;
  for (const b of W.battles.filter(b => !b.garrisonFight)) {
    const alive = id => S.ents.world.filter(e => e.kind === 'enemy' && e.alive && e.armyId === id).length;
    const [a, d] = b.sides.map(findArmy);
    const na = alive(b.sides[0]), nd = alive(b.sides[1]);
    const timeout = S.day * 1440 + S.minute - b.started > 240;
    if (!a || !d || na === 0 || nd === 0 || timeout) {
      W.battles.splice(W.battles.indexOf(b), 1);
      if (!a || !d) continue;
      const win = timeout ? (a.strength >= d.strength ? a : d) : (na > 0 ? a : d);
      const lose = win === a ? d : a;
      log(`Die Schlacht bei ${LOC[b.node].name} ist entschieden: ${win.name} hält das Feld.`, 'faction');
      chronicle(`Schlacht bei ${LOC[b.node].name}`, 'battle', `${win.name} siegt. ${S.player.name} war dabei.`);
      afterBattle(b.node, win, lose);
    }
  }
  // §81 Befreiungskampf: ein besetzter Ort fällt nicht durch einen Textwechsel. Die Besatzung kommt in Wellen (sie marschiert
  // von außen ein), zwischen den Wellen eine Atempause mit Ansage, die letzte Welle führt der Hauptmann der Toten.
  // Der Fortschritt (n.wave) bleibt am Ort: wer flieht und wiederkommt, fängt nicht von vorn an.
  for (const [node, n] of Object.entries(W.nodes)) {
    if (n.owner !== 'undead' || n.garrison <= 0 || !nearPlayer(node, 22) || W.battles.some(b => b.node === node)) continue;
    n.waves ||= node === 'blackkeep' ? 4 : clamp(Math.round(n.garrison / 10), 2, 3); n.wave ||= 0;
    W.battles.push({ node, sides: ['g:' + node, 'player'], started: S.day * 1440 + S.minute, garrisonFight: true, next: 0 });
    log(`Die Toten halten ${LOC[node].name}. Wer die Stadt will, muss ${n.waves - n.wave} Wellen brechen.`, 'combat');
    H.toast(`BEFREIUNG VON ${LOC[node].name.toUpperCase()} — WELLE ${n.wave + 1}/${n.waves}`);
  }
  for (const b of [...W.battles].filter(b => b.garrisonFight)) {
    const id = b.sides[0], n = W.nodes[b.node], left = S.ents.world.some(e => e.kind === 'enemy' && e.alive && e.armyId === id);
    if (!nearPlayer(b.node, 30)) {                                  // Spieler gegangen: Einheiten verschwinden, Stärke und Welle bleiben
      for (let i = S.ents.world.length - 1; i >= 0; i--) { const e = S.ents.world[i]; if (e.kind === 'enemy' && e.armyId === id) S.ents.world.splice(i, 1); }
      if (b.spawned) n.wave = Math.max(0, n.wave - 1);               // halb geschlagene Welle kommt wieder
      W.battles.splice(W.battles.indexOf(b), 1); continue;
    }
    if (left) continue;
    if (b.spawned) { b.spawned = false; if (n.wave >= n.waves) { n.garrison = 0; W.battles.splice(W.battles.indexOf(b), 1); continue; } }
    if (!b.next) { b.next = clockMin() + (n.wave ? 8 : 1);
      if (n.wave) { log(`Welle ${n.wave}/${n.waves} gebrochen. Die nächste sammelt sich …`, 'combat'); H.toast(`WELLE ${n.wave + 1}/${n.waves} SAMMELT SICH`); } continue; }
    if (clockMin() < b.next) continue;
    b.next = 0; n.wave++; b.spawned = true; spawnWave(b.node, n, id);
  }
  // Besetzter Ort ohne Besatzung und ohne Untotenheer: Valen (bzw. das Volk) nimmt ihn zurück
  for (const [node, n] of Object.entries(W.nodes)) {
    if (n.owner !== 'undead' || n.garrison > 0.5 || node === 'graveyard' || (n.waves && n.wave < n.waves)) continue;   // §81: kein Sieg ohne letzte Welle
    if (W.armies.some(a => a.faction === 'undead' && a.at === node) || W.battles.some(b => b.node === node)) continue;
    capture(node, 'valen');
    if (nearPlayer(node, 22) && S.ranks.undead < 0) H.title(`Befreier von ${LOC[node].name}`);
  }
}
export function warSummary() {
  const W = S.war;
  const und = Object.values(W.nodes).filter(n => n.owner === 'undead').length;
  const val = Object.values(W.nodes).filter(n => n.owner === 'valen').length;
  const armies = W.armies.map(a => `${a.name} (${Math.round(a.strength)}) bei ${LOC[a.at].name}`).join('<br>');
  const t = und > val ? 'Die Untoten halten mehr Land als Valen.' : und === val ? 'Die Front steht auf Messers Schneide.' : 'Valen hält die Linie — noch.';
  return `${t}<br><br>${armies}`;
}
export const warGraph = () => ({ nodes: S.war.nodes, edges: WAR_EDGES, loc: LOC, armies: S.war.armies });
