// Weltsimulation (Phase 18–20): Stadtmärkte, Karawanen, Heere und Front. Läuft ohne den Spieler.
import { S, log, chronicle, rnd, ri, pick, chance, clamp, year, uid } from './state.js';
import { ITEMS, TOWNS, GOODS, WAR_NODES, WAR_EDGES, FACTIONS } from './data.js';
import { LOCATIONS, TS, T, SOLID, HOUSES, tileAt, worldPt, wT } from './world.js';

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
  return GOODS.reduce((n, g) => n + t.stock[g], 0) > 90 ? 'Wohlhabend' : 'Ruhig';
}
export function townPrice(key, good, buy) {
  const t = S.towns[key];
  const need = (t.use[good] || 0) * 5 + 10;
  const f = clamp(need / (t.stock[good] + 1), 0.45, 2.6);
  const p = ITEMS[good].value * f;
  return Math.max(1, Math.round(buy ? p * 1.12 : p * 0.88));
}
export function notePrices(key) {
  S.priceSeen[key] = { day: S.day, p: Object.fromEntries(GOODS.map(g => [g, townPrice(key, g, true)])) };
}
function economyDay() {
  for (const [key, t] of Object.entries(S.towns)) {
    const occupied = S.war.nodes[key]?.owner === 'undead';
    for (const g of GOODS) {
      t.stock[g] += occupied ? 0 : (t.prod[g] || 0) * (t.pop / TOWNS[key].pop);
      t.stock[g] -= (t.use[g] || 0) * (t.pop / TOWNS[key].pop);
      if (t.stock[g] < 0) {
        t.stock[g] = 0;
        if (g === 'grain') { t.pop = Math.max(5, t.pop - 2); log(`${t.name} hungert. Menschen wandern ab.`, 'economy'); }
      }
      t.stock[g] = Math.min(t.stock[g], 200);
    }
  }
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
export function buildRoute() {
  const [[ax, ay], [bx, by]] = ROUTE_ENDS.map(([x, y]) => worldPt(x, y));
  const x0 = Math.min(ax, bx) - 24, y0 = Math.min(ay, by) - 24, w = Math.abs(bx - ax) + 49, h = Math.abs(by - ay) + 49;
  const blk = new Uint8Array(w * h), I = (x, y) => (y - y0) * w + (x - x0), inB = (x, y) => x >= x0 && y >= y0 && x < x0 + w && y < y0 + h;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (SOLID.has(tileAt('world', x, y))) blk[I(x, y)] = 1;
  for (const b of HOUSES) if (b.map === 'world') for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) if (inB(x, y)) blk[I(x, y)] = 1;
  for (const e of S.ents.world) if (e.kind === 'prop' && e.solid) { const x = e.x / TS | 0, y = e.y / TS | 0; if (inB(x, y)) blk[I(x, y)] = 1; }
  const cost = (x, y) => { const t = tileAt('world', x, y); let c = t === T.ROAD || t === T.PLANK ? 1 : t === T.DIRT ? 3 : 8;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inB(x + dx, y + dy) && blk[I(x + dx, y + dy)]) { c += 4; break; }
    return c; };
  const dist = new Float64Array(w * h).fill(Infinity), prev = new Int32Array(w * h).fill(-1), heap = [];
  const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k;
    if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const start = I(ax, ay), goal = I(bx, by); dist[start] = 0; push(0, start);
  while (heap.length) {
    const [d, i] = pop(); if (d > dist[i]) continue; if (i === goal) break;
    const x = i % w + x0, y = (i / w | 0) + y0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy; if (!inB(nx, ny) || blk[I(nx, ny)]) continue;
      if (dx && dy && (blk[I(x + dx, y)] || blk[I(x, y + dy)])) continue;          // keine Ecke schneiden
      const n = I(nx, ny), nd = d + cost(nx, ny) * (dx && dy ? 1.414 : 1);
      if (nd < dist[n]) { dist[n] = nd; prev[n] = i; push(nd, n); }
    }
  }
  const pts = [];
  if (prev[goal] < 0) ROUTE = [[ax, ay], [bx, by]];                                  // kein Weg (sollte nicht vorkommen): gerade Linie
  else { for (let i = goal; i >= 0; i = prev[i]) pts.push([i % w + x0, (i / w | 0) + y0]); pts.reverse();
    ROUTE = pts.filter((q, k) => k === 0 || k === pts.length - 1 || q[0] - pts[k - 1][0] !== pts[k + 1][0] - q[0] || q[1] - pts[k - 1][1] !== pts[k + 1][1] - q[1])   // nur Knicke
      .map(([x, y]) => [x + 0.5, y + 0.5]); }
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
  if (!c.ambushChecked && Math.abs(c.x / TS - wT(101)) < 3) {            // zwischen Eren (bis x 93) und der Nordfurter Brücke
    c.ambushChecked = true;
    if (chance(0.35)) {
      const guards = S.ents.world.filter(e => e.kind === 'npc' && e.alive && e.escort === c.id);
      if (Math.hypot(player.x - c.x, player.y - c.y) < 700 && player.map === 'world') {
        for (let i = 0; i < 3 + guards.length; i++) H.spawnEnemy('bandit', 'world', (c.x / TS | 0) + ri(-5, 5), (c.y / TS | 0) + ri(3, 6));   // ein bewachter Zug lockt mehr Räuber
        log('Banditen fallen über die Karawane her!', 'combat');
        H.toast('KARAWANE ÜBERFALLEN');
      } else if (guards.length && chance(0.3 + 0.15 * guards.length)) {    // außer Sicht: Wachen schlagen zurück, nicht ohne Preis
        if (chance(0.3)) { const g = pick(guards); g.alive = false; S.ents.world.splice(S.ents.world.indexOf(g), 1); }
        log('Räuber überfielen eine Karawane auf der Alten Straße — die Wachen schlugen sie zurück.', 'economy');
      } else {
        for (const g of Object.keys(c.cargo)) c.cargo[g] = Math.floor(c.cargo[g] / 2);
        log('Eine Karawane wurde auf der Alten Straße ausgeraubt.', 'economy');
      }
    }
  }
}
function arrive(c, player) {
  const to = c.dir > 0 ? 'northcity' : 'eren';
  const t = S.towns[to];
  for (const [g, n] of Object.entries(c.cargo)) t.stock[g] += n;
  const sum = Object.values(c.cargo).reduce((a, b) => a + b, 0);
  if (sum) log(`Karawane erreicht ${t.name} (${sum} Ladungen).`, 'economy');
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
  log('Die Karawane ist verloren. Ihre Ladung liegt auf der Straße.', 'economy');
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
    if (a.faction === 'undead') next = path(a.at, n => W.nodes[n].owner !== 'undead');
    else next = path(a.at, n => W.nodes[n].owner === 'undead' || W.armies.some(b => b.faction === 'undead' && b.at === n));
    if (!next || (a.faction === 'valen' && a.strength < 25)) next = null;   // zu schwach: halten
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
  n.owner = faction; n.garrison = faction === 'undead' ? 10 : 8;
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
    } else if (was === 'undead') {
      chronicle(`${L.name} befreit`, 'battle', `${FACTIONS[faction].name} nimmt ${L.name} zurück.`);
      H.toast(`${L.name.toUpperCase()} BEFREIT`);
    }
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
  for (const side of [att, def]) {
    const n = clamp(Math.round(side.strength / 8), 2, 7);
    for (let i = 0; i < n; i++) {
      H.spawnEnemy(side.faction === 'undead' ? 'skeleton' : 'valen_soldier', 'world', L.x + ri(-5, 5) + (side === att ? -4 : 4), L.y + ri(-4, 4),
        { armyId: side.id, worth: side.strength / n, level: 4 });
    }
  }
  S.war.battles.push(b);
  log(`Schlacht bei ${L.name}! ${att.name} gegen ${def.name}.`, 'combat');
  H.toast(`SCHLACHT BEI ${L.name.toUpperCase()}`);
}
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
  // Besatzung lebt als Einheiten, wenn der Spieler nah ist (befreibar)
  for (const [node, n] of Object.entries(W.nodes)) {
    if (n.owner !== 'undead' || n.garrison <= 0 || !nearPlayer(node, 22) || W.battles.some(b => b.node === node)) continue;
    const id = 'g:' + node;
    if (S.ents.world.some(e => e.kind === 'enemy' && e.armyId === id)) continue;
    const L = LOC[node], cnt = clamp(Math.round(n.garrison / 4), 2, 5);
    for (let i = 0; i < cnt; i++) H.spawnEnemy('skeleton', 'world', L.x + ri(-5, 5), L.y + ri(-5, 5), { armyId: id, worth: n.garrison / cnt, level: 4 });
    W.battles.push({ node, sides: [id, 'player'], started: S.day * 1440 + S.minute, garrisonFight: true });
  }
  for (const b of [...W.battles].filter(b => b.garrisonFight)) {
    const left = S.ents.world.some(e => e.kind === 'enemy' && e.alive && e.armyId === b.sides[0]);
    if (left && nearPlayer(b.node, 30)) continue;
    // Spieler gegangen: Einheiten verschwinden, ihre Stärke bleibt in der Besatzung
    if (left) for (let i = S.ents.world.length - 1; i >= 0; i--) { const e = S.ents.world[i]; if (e.kind === 'enemy' && e.armyId === b.sides[0]) S.ents.world.splice(i, 1); }
    W.battles.splice(W.battles.indexOf(b), 1);
  }
  // Besetzter Ort ohne Besatzung und ohne Untotenheer: Valen (bzw. das Volk) nimmt ihn zurück
  for (const [node, n] of Object.entries(W.nodes)) {
    if (n.owner !== 'undead' || n.garrison > 0.5 || node === 'graveyard') continue;
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
export const townAtLoc = key => S.towns && S.towns[key] ? key : null;
