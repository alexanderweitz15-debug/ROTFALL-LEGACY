// Weltsimulation (Phase 18–20): Stadtmärkte, Karawanen, Heere und Front. Läuft ohne den Spieler.
import { S, log, chronicle, rnd, ri, pick, chance, clamp, year, uid } from './state.js';
import { ITEMS, TOWNS, GOODS, WAR_NODES, WAR_EDGES, FACTIONS } from './data.js';
import { LOCATIONS, TS, worldPt, wT } from './world.js';

export const H = {};                     // von game.js: spawnEnemy(type,map,tx,ty,opts), spawnRefugee(x,y,to), toast(t)
const LOC = Object.fromEntries(LOCATIONS.map(l => [l.key, l]));
const NEIGH = {};
for (const [a, b] of WAR_EDGES) { (NEIGH[a] ||= []).push(b); (NEIGH[b] ||= []).push(a); }

export function initSim() {
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
export const ROUTE = [[62, 65], [100, 65], [106, 63], [112, 63], [119, 64], [129, 64], [129, 61]].map(([x, y]) => worldPt(x, y));   // Entwurf → gestreckte Städte; Ziel auf der Nordfurter Torstraße (Karawanen fahren ohne Kollision)
function spawnCaravan() {
  const [tx, ty] = ROUTE[0];
  const c = { id: uid(), kind:'caravan', map:'world', name:'Händlerkarawane', faction:'merch', x: tx * TS, y: ty * TS,
    hp: 140, maxHp: 140, r: 16, alive: true, dir: 1, wp: 1, cargo: {}, attacked: false, ambushChecked: false, facing: 3 };
  load(c, 'eren');
  S.ents.world.push(c);
}
function load(c, from) {
  const t = S.towns[from];
  c.cargo = {};
  const surplus = GOODS.map(g => [g, t.stock[g] - (t.use[g] || 0) * 4]).filter(([, v]) => v > 3).sort((a, b) => b[1] - a[1]).slice(0, 2);
  for (const [g, v] of surplus) { const n = Math.min(Math.floor(v), 15); c.cargo[g] = n; t.stock[g] -= n; }
}
export function caravanFrame(c, dt, player, nearFoes) {
  if (!c.alive) return;
  if (nearFoes) c.attacked = true;                               // unter Angriff: rollt langsam weiter
  const idx = c.dir > 0 ? c.wp : ROUTE.length - 1 - c.wp;
  const [tx, ty] = ROUTE[idx];
  const gx = tx * TS, gy = ty * TS, d = Math.hypot(gx - c.x, gy - c.y);
  const sp = (nearFoes ? 0.35 : 0.9) * dt / 16;
  if (d > sp) { c.vx = (gx - c.x) / d * sp; c.vy = (gy - c.y) / d * sp; c.x += c.vx; c.y += c.vy; c.facing = c.vx > 0 ? 3 : 2; }
  else if (c.wp < ROUTE.length - 1) c.wp++;
  else arrive(c, player);
  // Hinterhalt auf halber Strecke
  if (!c.ambushChecked && Math.abs(c.x / TS - wT(101)) < 3) {            // zwischen Eren (bis x 93) und der Nordfurter Brücke
    c.ambushChecked = true;
    if (chance(0.35)) {
      if (Math.hypot(player.x - c.x, player.y - c.y) < 700 && player.map === 'world') {
        for (let i = 0; i < 3; i++) H.spawnEnemy('bandit', 'world', (c.x / TS | 0) + ri(-5, 5), (c.y / TS | 0) + ri(3, 6));
        log('Banditen fallen über die Karawane her!', 'combat');
        H.toast('KARAWANE ÜBERFALLEN');
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
  c.dir = -c.dir; c.wp = 1; c.attacked = false; c.ambushChecked = false;
  load(c, to);
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
