// Rotfall: Legacy — Spielkern. Schleife, Kampf, KI, Quests, Siedlung, Erbe.
import { S, log, chronicle, save, loadRaw, applySave, hasSave, seedRng, rnd, ri, pick, chance,
         clamp, dist, uid, byId, partyMembers, timeStr, year } from './state.js';
import { ITEMS, MONSTERS, NPCS, ORIGINS, CLASSES, ABILITIES, FACTIONS, BUILDINGS, QUESTS, LOOT, MEMORY_TEXT, RARITY } from './data.js';
import { MAPS, TS, T, SOLID, LOCATIONS, genWorld, genMine, tileAt, setTile, solidTile, speedMul, locAt, freeSpotNear } from './world.js';
import * as R from './render.js';
import * as UI from './ui.js';
import * as SIM from './sim.js';
import * as B from './body.js';

const $ = id => document.getElementById(id);
let last = 0, acc = 0, running = false, hovered = null, selected = null, placing = null;
let combat = [];                        // lebende Kämpfer der aktuellen Karte, einmal pro Frame
const keys = new Set();
let mouse = { x: 0, y: 0, wx: 0, wy: 0, down: false };
const solidIndex = { world: new Map(), mine: new Map() };

// ================= Charaktere =================
const SKIN = ['#d6b089', '#b98f66', '#8d6644', '#f0d2ae', '#6d4a30'];
const HAIR = ['#2b2118', '#5a3a1e', '#8a7a52', '#c9bfa6', '#7d2f1d'];
const CLOTH = ['#4a3a28', '#3c4230', '#43354a', '#2f3d45', '#53342a'];

function baseAttrs() { return { strength:8, agility:8, endurance:8, intelligence:8, perception:8, willpower:8 }; }

export function makeChar(o = {}) {
  const attrs = { ...baseAttrs(), ...(o.attrs || {}) };
  const c = {
    id: uid(), kind: o.kind || 'npc', key: o.key || ('n' + Math.floor(rnd() * 1e6)),
    name: o.name || 'Namenlos', prof: o.prof || '', age: o.age ?? ri(19, 45),
    x: o.x || 0, y: o.y || 0, vx: 0, vy: 0, facing: 0, aim: 0, r: 11, map: o.map || 'world',
    level: o.level || 1, xp: 0, xpNext: 60,
    attributes: attrs, skills: { ...(o.skills || {}) }, traits: o.traits || [],
    knownClasses: o.knownClasses || [o.cls || 'wanderer'], currentClass: o.cls || 'wanderer',
    abilities: [...(CLASSES[o.cls || 'wanderer'].abilities || [])], cooldowns: {},
    equip: { weapon:null, offhand:null, head:null, chest:null, feet:null, cloak:null },
    inv: [], invCap: 24, stamina: 100, maxStamina: 100, mana: 0, maxMana: 0,
    morale: 70, alive: true, downed: false, downTimer: 0, status: [],
    faction: o.faction || null, memories: [], kills: 0, bornDay: S.day,
    seed: rnd() * 100, swing: 0, atkCd: 0, telegraph: 0, aiState: 'idle', aiTimer: 0,
    pal: o.pal || { skin: pick(SKIN), hair: pick(HAIR), cloth: pick(CLOTH) },
    home: o.home || null, schedule: o.schedule || null, origin: o.origin || null,
    recruit: o.recruit || false, recruitRel: o.recruitRel || 25, teaches: o.teaches || null,
    shop: o.shop || false, town: o.town || null, smith: o.smith || false, undead: o.undead || false, kin: o.kin || null,
    greet: o.greet || '"..."', hostile: o.hostile || false,
    build: o.build || pick(Object.keys(B.BUILDS)),
  };
  recalc(c);
  B.fullHeal(c); c.mana = c.maxMana;
  return c;
}

export function recalc(c) {
  const a = c.attributes;
  const base = 40 + a.endurance * 4 + c.level * 6;          // Basis-HP, verteilt auf die Körperteile
  if (c.body) B.rescale(c, base); else B.initBody(c, base);
  c.maxStamina = 60 + a.endurance * 3 + a.agility * 2 + B.buildOf(c).stamina;
  const magic = ['mage', 'cleric', 'warlock', 'paladin', 'necromancer'].includes(c.currentClass);
  c.maxMana = magic ? 30 + a.intelligence * 4 + a.willpower * 2 : 0;
  c.partyCap = 3 + Math.floor((c.skills.leadership || 0) / 10) + (S.settlement ? 1 : 0);
}
export function armorOf(c) {
  if (!c.equip) return c.armor || 0;                       // Karawane, Gegner
  let v = 0;
  for (const k of Object.keys(c.equip)) { const it = c.equip[k]; if (it && ITEMS[it.key].armor) v += ITEMS[it.key].armor * (0.4 + 0.6 * (it.cond ?? 1)); }
  const bless = (c.status || []).find(s => s.key === 'blessing');
  return Math.round(v + (bless ? 5 : 0));
}
export function damageOf(c) {
  const w = c.equip.weapon, it = w ? ITEMS[w.key] : null;
  const base = (it ? it.dmg * (0.55 + 0.45 * (w.cond ?? 1)) : 3) * (B.isDisabled(c, 'rarm') ? 0.3 : 1);
  const skill = it ? (c.skills[it.skill] || 0) : (c.skills.unarmed || 0);
  const attr = it && it.ranged ? c.attributes.agility : c.attributes.strength;
  return base + attr * 0.35 + skill * 0.22;
}
function speedOf(c) {
  let s = 2.25 + c.attributes.agility * 0.045;
  const off = c.equip.offhand && ITEMS[c.equip.offhand.key].slow || 0;
  const ch = c.equip.chest && ITEMS[c.equip.chest.key].slow || 0;
  s *= (1 - off - ch);
  if (c.stamina <= 0) s *= 0.55;
  return s * speedMul(c.map, c.x, c.y) * B.speedFactor(c);
}

// ================= Items =================
function mkItem(key, count = 1) {
  const it = ITEMS[key]; if (!it) return null;
  const o = { key, count: it.stack ? count : 1 };
  if (it.slot !== 'material' && it.slot !== 'consumable') o.cond = 0.55 + rnd() * 0.45;
  return o;
}
function addItem(c, key, count = 1) {
  const it = ITEMS[key]; if (!it) return false;
  if (it.res) { S.res[it.res] += count; return true; }
  if (it.stack) {
    const s = c.inv.find(x => x.key === key && (x.count || 1) < it.stack);
    if (s) { s.count = (s.count || 1) + count; return true; }
  }
  if (c.inv.length >= c.invCap) { if (c === S.player) UI.toast('Tasche voll'); return false; }
  c.inv.push(mkItem(key, count));
  return true;
}
function removeItem(c, key, count = 1) {
  const i = c.inv.findIndex(x => x.key === key);
  if (i < 0) return false;
  const s = c.inv[i];
  if ((s.count || 1) > count) s.count -= count; else c.inv.splice(i, 1);
  return true;
}
function hasItem(c, key, count = 1) {
  return c.inv.filter(x => x.key === key).reduce((n, x) => n + (x.count || 1), 0) >= count;
}
function equip(c, idx) {
  const slot = c.inv[idx]; if (!slot) return;
  const it = ITEMS[slot.key];
  if (it.slot === 'consumable') return useConsumable(c, idx);
  if (it.slot === 'material') return UI.toast('Material lässt sich nicht anlegen.');
  if (it.slot === 'weapon' && B.isDisabled(c, 'rarm')) return UI.toast('Der rechte Arm trägt keine Waffe.');
  if ((it.slot === 'offhand' || it.twohand) && B.isDisabled(c, 'larm')) return UI.toast('Der linke Arm ist ausgefallen.');
  const prev = c.equip[it.slot];
  c.equip[it.slot] = slot; c.inv.splice(idx, 1);
  if (prev) c.inv.push(prev);
  if (it.twohand && c.equip.offhand) { c.inv.push(c.equip.offhand); c.equip.offhand = null; }
  log(`${c.name} legt ${it.name} an.`, 'party');
  recalc(c); UI.refreshHUD();
}
function unequip(c, slotKey) {
  const it = c.equip[slotKey]; if (!it) return;
  if (c.inv.length >= c.invCap) return UI.toast('Tasche voll');
  c.inv.push(it); c.equip[slotKey] = null; recalc(c); UI.refreshHUD();
}
const CHANNEL_MS = { bandage: 2500, heal: 1600 };
function useConsumable(c, idx, target = c, part = null) {
  const slot = c.inv[idx], it = ITEMS[slot.key];
  if (it.use === 'food') {                                   // Essen gibt Kraft, heilt aber keine Wunden
    c.stamina = Math.min(c.maxStamina, c.stamina + 30 + (it.food || 1) * 10);
    removeItem(c, slot.key, 1);
    log(`${c.name} isst ${it.name}.`, 'party');
    return UI.refreshHUD();
  }
  // Verbände und Heilmittel wirken erst nach dem Anlegen. Bewegung, Angriff oder ein Treffer brechen ab.
  if (c !== S.player) return applyHealItem(c, slot.key, target, part);
  if (c.channel) return UI.toast('Du bist schon beschäftigt.');
  if (it.use === 'bandage' || slot.key === 'herb') part ||= B.worstPart(target);
  if ((it.use === 'bandage' || slot.key === 'herb') && !part && !(target.status || []).some(s => s.key === 'bleeding'))
    return UI.toast(`${target === c ? 'Du bist' : target.name + ' ist'} unverletzt.`);
  const dur = CHANNEL_MS[it.use] || 1600;
  c.channel = { key: slot.key, targetId: target.id, part, t: 0, dur };
  c.vx = c.vy = 0;
  UI.toast(`${it.name}${part ? ' — ' + B.PART_NAME[part] : ''} …`, dur);
}
function applyHealItem(c, key, target, part) {
  const it = ITEMS[key];
  if (!removeItem(c, key, 1)) return;
  const med = c.skills.medicine || 0;
  if (it.use === 'bandage' || key === 'herb') {
    part ||= B.worstPart(target) || 'torso';
    const P = target.body[part];
    const amt = (key === 'bandage' ? 6 + P.max * 0.3 : it.heal) + med * 0.4;
    const r = B.healPart(target, part, amt);
    if (key === 'bandage') target.status = (target.status || []).filter(s => s.key !== 'bleeding');
    float(target, `+${Math.round(r.gained)} ${B.PART_NAME[part]}`, 'rgba(120,170,90,ALPHA)');
    log(`${c.name} verbindet ${target === c ? 'sich' : target.name}: ${B.PART_NAME[part]}.`, 'party');
    if (r.restored) log(`${B.PART_NAME[part]} von ${target.name} ist wieder zu gebrauchen.`, 'party');
  } else {
    B.heal(target, it.heal + med * 0.3);
    float(target, '+' + it.heal, 'rgba(120,170,90,ALPHA)');
    log(`${c.name} gibt ${target === c ? 'sich' : target.name} ${it.name}.`, 'party');
  }
  c.skills.medicine = Math.min(100, med + 0.5);
  fx(target.x, target.y - 16, 'heal', 8);
  UI.refreshHUD();
}
function tickChannel(p, dt, moving) {
  const ch = p.channel; if (!ch) return;
  const target = byId(ch.targetId) || p;
  if (moving || mouse.down || !target.alive || dist(p, target) > 70) { p.channel = null; UI.toast('Abgebrochen.'); return; }
  ch.t += dt;
  if (ch.t >= ch.dur) { p.channel = null; applyHealItem(p, ch.key, target, ch.part); }
}
// Verbände herstellen: aus Stoff, nicht aus dem Nichts
const BANDAGE_FROM = { cloth: 3, cloth_shirt: 2 };
function craftBandage(idx) {
  const p = S.player, slot = p.inv[idx]; if (!slot || !BANDAGE_FROM[slot.key]) return;
  const n = BANDAGE_FROM[slot.key], name = ITEMS[slot.key].name;
  removeItem(p, slot.key, 1); addItem(p, 'bandage', n);
  log(`Aus ${name} werden ${n} Verbände.`, 'party');
}

// ================= Welt aufbauen =================
function indexSolids(map) {
  const idx = new Map();
  for (const e of S.ents[map]) {
    if (!e.solid) continue;
    const k = ((e.x / TS) | 0) + ',' + ((e.y / TS) | 0);
    (idx.get(k) || idx.set(k, []).get(k)).push(e);
  }
  solidIndex[map] = idx;
}
function addSolid(e) {
  const k = ((e.x / TS) | 0) + ',' + ((e.y / TS) | 0);
  const idx = solidIndex[e.map || S.map];
  (idx.get(k) || idx.set(k, []).get(k)).push(e);
}
function removeSolid(e) {
  const idx = solidIndex[e.map || S.map];
  const k = ((e.x / TS) | 0) + ',' + ((e.y / TS) | 0);
  const arr = idx.get(k); if (!arr) return;
  const i = arr.indexOf(e); if (i >= 0) arr.splice(i, 1);
}
function solidPropAt(map, x, y, r) {
  const tx = (x / TS) | 0, ty = (y / TS) | 0, idx = solidIndex[map];
  for (let j = ty - 1; j <= ty + 1; j++) for (let i = tx - 1; i <= tx + 1; i++) {
    const arr = idx.get(i + ',' + j); if (!arr) continue;
    for (const p of arr) {
      if (p.kind === 'building') {
        const hw = p.def.w * TS / 2, hh = p.def.h * TS / 2;
        if (Math.abs(x - p.x) < hw + r * 0.6 && Math.abs(y - p.y) < hh + r * 0.6) return p;
      } else if (Math.hypot(x - p.x, y - p.y) < (p.r || 12) * 0.75 + r * 0.6) return p;
    }
  }
  return null;
}

const NPC_SPOTS = {
  village:[60,62], tavern:[55,60], market:[60,62], smithy:[64,60], healer:[69,60], farm:[60,70],
  shrine:[76,52], banditcamp:[66,116], graveyard:[34,96], mayor:[54,69], northcity:[119,60],
};
function spawnNPCs() {
  for (const def of NPCS) spawnNpcDef(def);
  spawnVillagers();
}
function spawnNpcDef(def) {
  const spots = NPC_SPOTS;
  {
    const home = spots[def.home] || spots.village;
    const pos = freeSpotNear('world', home[0] + ri(-2, 2), home[1] + ri(-2, 2), 4);
    const c = makeChar({ ...def, x: pos.x, y: pos.y, level: def.key === 'kelan' ? 12 : def.key === 'rook' ? 8 : ri(3, 7),
      pal: { skin: pick(SKIN), hair: pick(HAIR), cloth: def.faction === 'order' ? '#c7bda6' : def.faction === 'valen' ? '#33415c' :
             def.faction === 'undead' ? '#232a28' : pick(CLOTH), armor: def.key === 'kelan' ? '#b9b19c' : def.key === 'borin' ? '#6b6155' : null,
             helm: def.key === 'kelan' ? '#c3bba5' : null } });
    c.home = home; c.anchor = { x: pos.x, y: pos.y };
    if (def.undead) c.pal.skin = '#b9b3a2';
    const w = { elena:'dagger', tomas:'shortbow', borin:'longsword', rook:'dagger', kelan:'longsword', aldric:'mace', morvath:'staff' }[def.key];
    if (w) c.equip.weapon = mkItem(w);
    if (def.key === 'borin') c.equip.offhand = mkItem('kite_shield');
    if (def.key === 'kelan') { c.equip.offhand = mkItem('kite_shield'); c.equip.chest = mkItem('plate_cuirass'); }
    for (const [k, v] of Object.entries({ onehanded:6, defense:4, survival:4 })) c.skills[k] = (c.skills[k] || 0) + v;
    recalc(c); B.fullHeal(c);
    S.ents.world.push(c);
    S.relations[def.key] = def.key === 'rook' ? -10 : 0;
  }
}
function spawnVillagers() {
  for (let i = 0; i < 9; i++) {
    const pos = freeSpotNear('world', 60 + ri(-8, 8), 64 + ri(-6, 6), 3);
    const c = makeChar({ name: pick(['Cedd', 'Wulf', 'Hilde', 'Marta', 'Osric', 'Bran', 'Tilda', 'Gerd', 'Lenna']),
      prof: pick(['Bauer', 'Magd', 'Holzfäller', 'Wache', 'Kind des Dorfes']), x: pos.x, y: pos.y, level: ri(1, 4),
      traits: [pick(['gütig', 'mürrisch', 'neugierig', 'faul'])] });
    c.anchor = { x: pos.x, y: pos.y }; c.villager = true;
    if (c.prof === 'Wache') { c.equip.weapon = mkItem('spear'); c.faction = 'valen'; c.guard = true; }
    S.ents.world.push(c);
  }
}

const SPAWN_AREAS = [
  { map:'world', x:88, y:44, r:24, types:['wolf','wolf','boar','goblin'], cap:14 },
  { map:'world', x:60, y:88, r:16, types:['wolf','goblin','skeleton'], cap:8 },
  { map:'world', x:66, y:116, r:10, types:['bandit','bandit','bandit_archer'], cap:9 },
  { map:'world', x:34, y:96, r:8, types:['skeleton','skeleton'], cap:6 },
  { map:'world', x:40, y:40, r:8, types:['goblin','bandit'], cap:5 },
  { map:'world', x:18, y:62, r:10, types:['goblin','wolf'], cap:5 },
  { map:'world', x:96, y:64, r:12, types:['bandit','wolf'], cap:5 },
  { map:'mine', x:45, y:38, r:10, types:['goblin','goblin','goblin_warrior'], cap:10 },
  { map:'mine', x:31, y:26, r:9, types:['goblin_warrior','goblin'], cap:7 },
  { map:'mine', x:20, y:36, r:7, types:['goblin'], cap:4 },
];

const HUMANOID = new Set(['goblin', 'goblin_warrior', 'bandit', 'bandit_archer', 'skeleton', 'valen_soldier', 'gorak']);
function spawnEnemy(mtype, map, tx, ty, opts = {}) {
  const m = MONSTERS[mtype];
  const pos = freeSpotNear(map, tx, ty, 3);
  const e = {
    id: uid(), kind:'enemy', mtype, map, x: pos.x, y: pos.y, vx:0, vy:0, facing:0, aim:0,
    level: opts.level || Math.max(1, ri(1, 3) + (m.threat || 1) * 2),
    hp: m.hp, maxHp: m.hp, r: m.r, armor: m.threat, alive:true, seed: rnd() * 100,
    swing:0, atkCd:0, telegraph:0, aiState:'idle', aiTimer:0, anchor:{ x: pos.x, y: pos.y },
    weaponKey: { goblin:'dagger', goblin_warrior:'axe', bandit:'rusty_sword', bandit_archer:'shortbow', skeleton:'rusty_sword', valen_soldier:'spear' }[mtype] || null,
    shield: mtype === 'goblin_warrior' ? { key:'wooden_shield' } : null,
    faction: m.faction, boss: !!m.boss, ...opts,
  };
  e.maxHp = e.hp = Math.round(m.hp * (1 + e.level * 0.04));
  if (HUMANOID.has(mtype)) { e.build = pick(Object.keys(B.BUILDS)); B.initBody(e, e.maxHp); }   // Menschenähnliche haben Trefferzonen
  S.ents[map].push(e);
  return e;
}

function initialSpawns() {
  for (const a of SPAWN_AREAS) for (let i = 0; i < a.cap * 0.7; i++)
    spawnEnemy(pick(a.types), a.map, a.x + ri(-a.r, a.r), a.y + ri(-a.r, a.r));
  spawnEnemy('gorak', 'mine', 32, 13, { level: 10 });
  for (let i = 0; i < 3; i++) spawnEnemy('goblin_warrior', 'mine', 30 + i, 14, { level: 6 });
}

// ================= Neues Spiel =================
export function newGame(cfg) {
  const keep = { settings: S.settings };
  Object.assign(S, {
    ver: 1, seed: Math.floor(Math.random() * 1e9), day: 1, minute: 8 * 60, season: 'Später Frühling',
    weather: 'clear', weatherLeft: 60, map: 'world', ents: { world: [], mine: [] }, party: [], gold: 0,
    res: { wood: 0, stone: 0, iron: 0, herb: 0, food: 3 }, stash: [],
    factions: { valen: 0, order: 0, undead: 0, merch: 0, bandit: 0 }, ranks: { valen: -1, order: -1, undead: -1 },
    quests: {}, chronicle: [], legacy: { house: cfg.house || cfg.name, gen: 1, ancestors: [] },
    settlement: null, flags: {}, relations: {}, kills: 0, battles: 0, log: [], partyCmd: 'follow',
    settings: keep.settings, fx: [], floats: [], projectiles: [], _uid: 0,
  });
  genWorld().forEach(p => S.ents.world.push(p));
  genMine().forEach(p => S.ents.mine.push(p));
  indexSolids('world'); indexSolids('mine');
  spawnNPCs();
  initialSpawns();
  bindSim(); SIM.initSim();

  const o = ORIGINS[cfg.origin];
  const start = freeSpotNear('world', 66, 70, 3);
  const p = makeChar({ kind:'player', key:'player', name: cfg.name, age: ri(19, 26), x: start.x, y: start.y,
    attrs: baseAttrs(), skills: { ...o.skills },            // Herkunftsbonus wird unten addiert, nicht überschrieben traits: [pick(['mutig', 'neugierig', 'diszipliniert', 'ehrgeizig'])],
    origin: o.name, pal: cfg.pal, build: cfg.build || 'ausgewogen' });
  p.attributes = Object.fromEntries(Object.entries(p.attributes).map(([k, v]) => [k, v + (o.attrs[k] || 0)]));
  p.invCap = 24; p.attrPoints = 0; p.hotbar = [];
  S.gold = o.gold;
  o.gear.forEach(k => { const it = mkItem(k); if (ITEMS[k].slot === 'weapon' && !p.equip.weapon) p.equip.weapon = it;
    else if (ITEMS[k].slot === 'chest' && !p.equip.chest) p.equip.chest = it;
    else if (ITEMS[k].slot === 'offhand' && !p.equip.offhand) p.equip.offhand = it;
    else addItem(p, k); });
  if (o.rep) for (const [k, v] of Object.entries(o.rep)) S.factions[k] += v;
  recalc(p); B.fullHeal(p); p.mana = p.maxMana;
  addItem(p, 'bandage', 2);
  S.player = p; S.ents.world.push(p);
  syncHotbar();

  chronicle(`${p.name} bricht auf`, 'birth', `${o.name}. Kein Name, kein Land, keine Schulden. Noch nicht.`);
  log('Du erreichst das Grenzland von Greenmark.', 'world');
  log('Im Norden liegt Eren. Dort gibt es Arbeit — und Leute, die welche brauchen.', 'world');
  startGame();
}

function bindSim() {
  SIM.H.spawnEnemy = spawnEnemy;
  SIM.H.toast = t => UI.toast(t, 3600);
  SIM.H.title = t => {
    const p = S.player; p.titles ||= [];
    if (p.titles.includes(t)) return;
    p.titles.push(t); chronicle(`${p.name}: „${t}“`, 'legend', 'Ein Name, den andere vergeben.');
    UI.toast(t.toUpperCase(), 4200); log(`Man nennt dich nun ${t}.`, 'faction');
  };
  SIM.H.spawnRefugee = (tx, ty, to) => {
    const L = LOCATIONS.find(l => l.key === to), pos = freeSpotNear('world', tx + ri(-3, 3), ty + ri(-3, 3), 3);
    const c = makeChar({ name: pick(['Aske', 'Brida', 'Hamo', 'Ilse', 'Jorg', 'Wenna']), prof: 'Flüchtling', x: pos.x, y: pos.y, level: 1, traits: ['furchtsam'] });
    c.anchor = { x: L.x * TS, y: L.y * TS }; c.villager = true; c.refugee = true;
    S.ents.world.push(c);
  };
}
function startGame() {
  $('titlescreen').classList.add('hidden');
  $('creation').classList.add('hidden');
  $('game').classList.remove('hidden');
  R.initCanvas($('game-canvas'));
  R.cam.zoom = 1.3;
  UI.refreshHUD(); UI.renderContext(null);
  running = true; last = performance.now();
  requestAnimationFrame(loop);
  save();
}

export function continueGame() {
  const data = loadRaw(); if (!data) return;
  applySave(data);
  seedRng(S.seed);
  genWorld(); genMine();                       // nur Kacheln, Props kommen aus dem Spielstand
  S.player = byId(S.player.id) || S.ents.world.find(e => e.kind === 'player') || S.player;
  if (!S.ents[S.map].includes(S.player)) S.ents[S.map].push(S.player);
  if (S.settlement) S.settlement.buildings = S.ents[S.settlement.map || 'world'].filter(e => e.kind === 'building');
  S.relations ||= {}; S.flags ||= {};
  S.party = S.party.filter(id => byId(id));
  for (const m of ['world', 'mine']) for (const e of S.ents[m]) {
    if ((e.kind === 'npc' || e.kind === 'player') && !e.body) { const r = e.hp / (e.maxHp || 1); e.build ||= 'ausgewogen'; recalc(e); for (const k of B.PARTS) e.body[k].hp = e.body[k].max * r; B.syncHp(e); }
    if (e.kind === 'enemy' && !e.body && HUMANOID.has(e.mtype)) { e.build = 'ausgewogen'; B.initBody(e, e.maxHp); }
  }
  S.player = byId(S.player.id) || S.player;
  Object.assign(S.player, { dodge: null, dodgeCd: 0, invuln: false, channel: null });   // Zeitstempel alter Stände sind wertlos
  for (const def of NPCS) if (!S.ents.world.some(e => e.key === def.key) && def.key === 'gerold') spawnNpcDef(def);
  bindSim(); SIM.initSim();
  indexSolids('world'); indexSolids('mine');
  log('Die Welt erinnert sich.', 'world');
  startGame();
}

// ================= Schleife =================
function loop(now) {
  if (!running) return;
  const dt = Math.min(50, now - last); last = now;
  requestAnimationFrame(loop);                              // zuerst: ein Fehler darf die Schleife nicht beenden
  try { if (!S.paused) update(dt, now); R.drawFrame(now); }
  catch (err) { if (!loop.failed) { loop.failed = true; console.error(err); log('Interner Fehler: ' + err.message, 'world'); } }
}

let hudTimer = 0, simTimer = 0, respawnTimer = 0, lastHour = -1, lastDay = 1;
function update(dt, now) {
  const p = S.player;
  // Zeit
  S.minute += dt / 1000;
  if (S.minute >= 1440) { S.minute -= 1440; S.day++; }
  S.weatherLeft -= dt / 1000;
  if (S.weatherLeft <= 0) {
    S.weather = pick(['clear', 'clear', 'cloudy', 'cloudy', 'rain', 'fog']);
    S.weatherLeft = ri(120, 420);
  }
  const hour = Math.floor(S.minute / 60);
  if (hour !== lastHour) { lastHour = hour; hourTick(hour); }
  if (S.day !== lastDay) { lastDay = S.day; dayTick(); }

  combat = S.ents[S.map].filter(e => e.alive && COMBAT_KINDS.has(e.kind));
  for (const c of S.ents.world) if (c.kind === 'caravan' && c.alive) {
    const near = performance.now() - (c.lastHurt || -1e9) < 4000;          // hält nur, solange sie angegriffen wird
    SIM.caravanFrame(c, dt, p, near);
  }
  if (p.alive) controlPlayer(dt);
  for (const e of [...S.ents[S.map]]) {
    if (e.kind === 'enemy') updateEnemy(e, dt);
    else if (e.kind === 'npc') updateNpc(e, dt);
    if (e.kind === 'enemy' || e.kind === 'npc' || e.kind === 'player') tickCombatant(e, dt);
  }
  updateProjectiles(dt);
  updateFx(dt);
  updateBuildings(dt);
  // Kamera
  const V = R.view();
  const tx = p.x - V.W / (2 * R.cam.zoom), ty = p.y - V.H / (2 * R.cam.zoom);
  R.cam.x += (tx - R.cam.x) * Math.min(1, dt / 120);
  R.cam.y += (ty - R.cam.y) * Math.min(1, dt / 120);
  const m = MAPS[S.map];
  R.cam.x = clamp(R.cam.x, 0, Math.max(0, m.w * TS - V.W / R.cam.zoom));
  R.cam.y = clamp(R.cam.y, 0, Math.max(0, m.h * TS - V.H / R.cam.zoom));
  if (shakeT > 0) { shakeT -= dt; R.cam.x += (rnd() - .5) * shake; R.cam.y += (rnd() - .5) * shake; }

  // Platzieren
  if (placing) {
    placing.ghost.x = Math.floor(mouse.wx / TS) * TS + placing.def.w * TS / 2;
    placing.ghost.y = Math.floor(mouse.wy / TS) * TS + placing.def.h * TS / 2;
    placing.ghost.blocked = !canPlace(placing.ghost);
  }

  hudTimer += dt;
  if (hudTimer > 180) {
    hudTimer = 0; UI.refreshHUD(); UI.renderContext(selected || hovered); updatePrompt();
    if (S.map === 'world') for (const l of LOCATIONS)
      if (Math.hypot(l.x - p.x / TS, l.y - p.y / TS) < l.r + 6) (S.flags.seen ||= {})[l.key] = true;
    if (S.map === 'mine') (S.flags.seen ||= {}).mine = true;
  }
  respawnTimer += dt;
  if (respawnTimer > 12000) { respawnTimer = 0; respawnTick(); }
  simTimer += dt;
  if (simTimer > 4000) { simTimer = 0; questCheck(); if (S.map === 'world') SIM.battleCheck(); }
}

let shake = 0, shakeT = 0;
function camShake(amount, ms) { if (!S.settings.motion) return; shake = amount; shakeT = ms; }

function tickCombatant(c, dt) {
  if (!c.alive) return;
  if (c.swing > 0) {
    c.swing += dt / (c.swingDur || 500);
    if (!c.hitDone && c.swing >= 0.42) { c.hitDone = true; resolveSwing(c); }
    if (c.swing >= 1) { c.swing = 0; c.hitDone = false; }
  }
  c.atkCd = Math.max(0, c.atkCd - dt);
  if (c.telegraph > 0) c.telegraph -= dt;
  for (const k of Object.keys(c.cooldowns || {})) c.cooldowns[k] = Math.max(0, c.cooldowns[k] - dt);
  const resting = !c.vx && !c.vy;
  c.stamina = Math.min(c.maxStamina, c.stamina + dt / 1000 * (resting ? 12 : 5));
  if (c.maxMana) c.mana = Math.min(c.maxMana, c.mana + dt / 1000 * 2.2);
  // Statuszeiten
  if (c.status && c.status.length) {
    for (const s of c.status) { s.left -= dt; if (s.key === 'bleeding' && chance(dt / 2500)) hurt(c, 2, null, 'Blutung'); }
    c.status = c.status.filter(s => s.left > 0);
  }
  if (c.downed && B.vital(c) > 0) { c.downed = false; log(`${c.name} kommt wieder auf die Beine.`, 'party'); }   // geheilt = steht auf
  if (c.downed) {
    c.downTimer -= dt;
    if (c.downTimer <= 0) die(c, c.lastCause || 'Wunden', c.lastKiller);
    else if (c !== S.player) {
      const helper = [S.player, ...partyMembers()].find(h => h !== c && h.alive && !h.downed && dist(h, c) < 40);
      if (helper) stabilize(c, helper);
    } else {
      const helper = partyMembers().find(h => h.alive && !h.downed && dist(h, c) < 50);
      if (helper) stabilize(c, helper);
    }
  }
}

// ================= Bewegung =================
function moveEnt(e, dx, dy) {
  const r = e.r || 10;
  if (dx) {
    const nx = e.x + dx;
    if (!solidTile(e.map, nx + Math.sign(dx) * r, e.y) && !solidPropAt(e.map, nx, e.y, r)) e.x = nx;
  }
  if (dy) {
    const ny = e.y + dy;
    if (!solidTile(e.map, e.x, ny + Math.sign(dy) * r) && !solidPropAt(e.map, e.x, ny, r)) e.y = ny;
  }
  e.vx = dx; e.vy = dy;
  if (Math.abs(dx) > Math.abs(dy)) e.facing = dx > 0 ? 3 : 2; else if (dy) e.facing = dy > 0 ? 0 : 1;
}

function controlPlayer(dt) {
  const p = S.player;
  if (p.downed) { p.vx = p.vy = 0; return; }
  p.dodgeCd = Math.max(0, (p.dodgeCd || 0) - dt);
  if (p.dodge) {                                            // Ausweichrolle: feste Dauer, unverwundbar, keine Steuerung
    const d = p.dodge, sp = DODGE.dist / DODGE.dur * dt;
    moveEnt(p, d.ax * sp, d.ay * sp);
    d.t += dt;
    if (d.t % 55 < dt) S.fx.push({ x: p.x, y: p.y, vx: 0, vy: 0, type: 'ghost', s: 1, life: 220, maxLife: 220, face: p.facing });
    if (d.t >= DODGE.dur) { p.dodge = null; p.invuln = false; }
    return;
  }
  const { dx, dy } = moveInput();
  tickChannel(p, dt, dx || dy);
  if (p.channel) { p.vx = p.vy = 0; p.aim = Math.atan2(mouse.wy - p.y + 12, mouse.wx - p.x); return; }
  if (dx || dy) {
    const l = Math.hypot(dx, dy), sp = speedOf(p) * dt / 16;
    moveEnt(p, dx / l * sp, dy / l * sp);
    p.stamina = Math.max(0, p.stamina - dt / 1000 * 1.2);
  } else { p.vx = p.vy = 0; }
  p.aim = Math.atan2(mouse.wy - p.y + 12, mouse.wx - p.x);
  if (mouse.down || keys.has(' ')) attack(p);
  // Dungeon-Fallen
  const haz = S.ents[S.map].find(e => e.hazard && dist(e, p) < 18 && (!e.lastHit || performance.now() - e.lastHit > 1500));
  if (haz) { haz.lastHit = performance.now(); hurt(p, haz.hazard, null, 'Fallgrube'); camShake(6, 160); }
}

// ================= Kampf =================
function attack(c, forceDir) {
  if (c.swing > 0 || c.atkCd > 0 || c.downed || !c.alive) return;
  const w = c.equip.weapon, it = w ? ITEMS[w.key] : null;
  const cost = it ? it.stam : 4;
  if (c.stamina < cost) { if (c === S.player && chance(0.02)) UI.toast('Zu erschöpft'); return; }
  c.stamina -= cost;
  c.swingDur = it ? it.speed : 450;
  c.atkCd = c.swingDur * 0.55;
  c.swing = 0.001; c.hitDone = false;
  if (forceDir != null) c.aim = forceDir;
  if (it && it.ranged) { c.hitDone = false; }
}

function resolveSwing(c) {
  if (c.kind === 'enemy') return resolveSwingEnemy(c);
  const mult = c.abilityMult || 1, kind = c.abilityKind || 'physical';
  c.abilityMult = 0; c.abilityKind = null;
  const w = c.equip.weapon, it = w ? ITEMS[w.key] : null;
  if (it && it.ranged) return shoot(c, it, mult);
  const reach = (it ? it.reach : 30) + (c.r || 10);
  const arc = it ? (it.arc || 1.4) : 1.4;
  const foes = hostilesOf(c);
  let hitAny = false;
  for (const f of foes) {
    if (!f.alive || f.downed) continue;
    const d = dist(c, f);
    if (d > reach + (f.r || 10)) continue;
    const ang = Math.atan2(f.y - c.y, f.x - c.x);
    let diff = Math.abs(normAng(ang - c.aim));
    if (diff > arc / 2 + 0.25) continue;
    hitAny = true;
    hit(c, f, mult, kind);
    if (it && it.wtype !== 'spear') break;                   // nur Speer trifft mehrere in Linie
  }
  if (!hitAny) {
    const px = c.x + Math.cos(c.aim) * reach, py = c.y + Math.sin(c.aim) * reach;
    if (solidTile(c.map, px, py) || solidPropAt(c.map, px, py, 6)) { fx(px, py, 'spark', 4); sfxHit(false); }
  }
  if (w && w.cond != null) { w.cond = Math.max(0.05, w.cond - 0.0016); }
}

function shoot(c, it, mult = 1) {
  S.projectiles.push({ id: uid(), kind:'arrow', map: c.map, x: c.x + Math.cos(c.aim) * 14, y: c.y - 12 + Math.sin(c.aim) * 8,
    vx: Math.cos(c.aim) * 7.2, vy: Math.sin(c.aim) * 7.2, owner: c.id, dmg: damageOf(c) * mult, life: 1400, team: teamOf(c) });
}

function normAng(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
const valenHostile = () => S.ranks.undead >= 0 || S.factions.valen <= -40;
function teamOf(c) {
  if (c === S.player || S.party.includes(c.id)) return 'player';
  if (c.kind === 'enemy') {
    if (c.faction === 'undead') return S.ranks.undead >= 0 ? 'player' : 'foe';
    if (c.faction === 'valen') return valenHostile() ? 'foe' : 'player';
    return 'foe';
  }
  if (c.kind === 'caravan') return 'player';
  if (c.kind === 'npc') return c.angry ? 'foe' : c.guard && !valenHostile() ? 'player' : 'neutral';
  return 'neutral';
}
function isHostile(a, b) {
  const ta = teamOf(a), tb = teamOf(b);
  return ta !== tb && ta !== 'neutral' && tb !== 'neutral';
}
const COMBAT_KINDS = new Set(['enemy', 'npc', 'player', 'caravan']);
function hostilesOf(c) {
  return S.ents[c.map].filter(e => COMBAT_KINDS.has(e.kind) && e !== c && e.alive && isHostile(c, e));
}

function hit(attacker, target, mult, kind = 'physical') {
  const w = attacker.equip && attacker.equip.weapon, it = w ? ITEMS[w.key] : null;
  let dmg = (attacker.kind === 'enemy' ? MONSTERS[attacker.mtype].dmg * (1 + attacker.level * 0.05) * (attacker.disarmed ? 0.4 : 1) : damageOf(attacker)) * mult;
  // Kritisch
  const critChance = 0.05 + (attacker.attributes ? attacker.attributes.perception * 0.004 : 0.01);
  const behind = attacker.aim != null && Math.abs(normAng(Math.atan2(attacker.y - target.y, attacker.x - target.x) - (target.aim || 0))) < 1;
  const crit = chance(critChance) || (it && it.crit && behind && chance(0.5));
  if (crit) dmg *= (it && it.crit) || 1.8;
  // Heilig gegen Untot
  if (kind === 'holy' && (target.mtype === 'skeleton' || target.undead)) dmg *= 2.1;
  // Rüstung / Block
  const ap = it ? (it.ap || 0) : 0;
  const armor = (target.kind === 'enemy' ? (target.armor || 0) * 1.6 : armorOf(target)) * (1 - ap);
  const off = target.equip && target.equip.offhand;
  if (off && chance(ITEMS[off.key].block * 0.7) && !target.downed) {
    fx(target.x, target.y - 12, 'spark', 6); float(target, 'Block', 'rgba(200,196,170,ALPHA)');
    if (off.cond != null) off.cond = Math.max(0.05, off.cond - 0.004);
    sfxHit(false); return;
  }
  dmg = Math.max(1, dmg - armor * 0.55);
  hurt(target, dmg, attacker, attacker.name || MONSTERS[attacker.mtype]?.name, crit, kind);
  // Fertigkeit steigern
  if (attacker.skills && it) attacker.skills[it.skill] = Math.min(100, (attacker.skills[it.skill] || 0) + 0.12);
  if (attacker === S.player) camShake(crit ? 7 : 3, crit ? 160 : 80);
}

export function hurt(target, dmg, source, cause = 'Wunden', crit = false, kind = 'physical') {
  if (!target.alive || target.invuln) return;
  dmg = Math.round(dmg * 10) / 10;
  let result = null, part = null;
  if (target.body) { part = B.pickPart(source, target, crit); result = B.damagePart(target, part, dmg, crit); }
  else target.hp -= dmg;
  if (target === S.player && S.player.channel && source) { S.player.channel = null; UI.toast('Unterbrochen!'); }   // Blutung allein unterbricht nicht
  target.lastCause = cause; target.lastKiller = source ? source.id : null;
  if (source) target.aggroId = source.id;
  target.lastHurt = performance.now();
  if (target.aiState === 'idle' || target.aiState === 'patrol') target.aiState = 'pursue';
  float(target, (crit ? '' : '') + Math.round(dmg), crit ? 'rgba(212,175,55,ALPHA)' : 'rgba(228,220,200,ALPHA)', crit);
  const lvl = S.settings.violence;
  if (lvl !== 'low') fx(target.x, target.y - 12, 'blood', crit ? 9 : lvl === 'reduced' ? 3 : 5);
  if (lvl === 'standard' && (crit || dmg > 12)) S.ents[target.map].push({ id: uid(), kind:'decal', map: target.map, x: target.x, y: target.y + 4, r: 6 + rnd() * 6, life: 12000, maxLife: 12000, transient: true });
  if (dmg > 10 && chance(0.25) && !(target.status || []).some(s => s.key === 'bleeding'))
    (target.status ||= []).push({ key:'bleeding', name:'Blutend', left: 12000 });
  sfxHit(crit);
  if (result === 'disabled') limbLost(target, part);
  if (result === 'decap') {
    fx(target.x, target.y - 26, 'blood', 16); camShake(8, 200);
    float(target, 'ENTHAUPTET', 'rgba(200,60,40,ALPHA)', true);
    return die(target, `Enthauptet durch ${cause}`, source);
  }
  if ((target.body ? B.vital(target) : target.hp) <= 0) {
    if (target.kind === 'enemy' || target.kind === 'caravan') die(target, cause, source);
    else if (!target.downed) downed(target, cause, source);
  }
  if (target === S.player) UI.refreshHUD();
}

function limbLost(c, part) {
  const who = c.name || MONSTERS[c.mtype]?.name;
  float(c, `${B.PART_NAME[part]} ausgefallen`, 'rgba(200,120,60,ALPHA)', true);
  if (dist(c, S.player) < 600) log(`${who}: ${B.PART_NAME[part]} ausgefallen.`, 'combat');
  const dropAt = it => { if (it) dropItemAt(c.map, c.x + ri(-14, 14), c.y + ri(4, 14), it); };
  if (c.equip) {                                            // Menschen: Waffe/Schild fällt zu Boden
    if (part === 'rarm' && c.equip.weapon) { dropAt(c.equip.weapon); c.equip.weapon = null; }
    if (part === 'larm') {
      if (c.equip.offhand) { dropAt(c.equip.offhand); c.equip.offhand = null; }
      if (c.equip.weapon && ITEMS[c.equip.weapon.key].twohand) { dropAt(c.equip.weapon); c.equip.weapon = null; }
    }
    if (c === S.player && (part === 'rarm' || part === 'larm')) UI.toast(`${B.PART_NAME[part]} ausgefallen — die Waffe fällt!`, 3000);
  } else if (part === 'rarm' || part === 'larm') { c.disarmed = true; if (part === 'rarm') c.weaponKey = null; if (part === 'larm') c.shield = null; }
  if ((part === 'lleg' || part === 'rleg') && c === S.player) UI.toast(`${B.PART_NAME[part]} ausgefallen — du humpelst.`, 3000);
}
function downed(c, cause, source) {
  c.downed = true; if (!c.body) c.hp = 0; c.downTimer = c === S.player ? 15000 : 11000;
  c.lastCause = cause; c.lastKiller = source ? source.id : null;
  log(`${c.name} bricht zusammen.`, 'combat');
  if (c === S.player) UI.toast('Du bist am Boden. Deine Gruppe hat kurz Zeit.', 3500);
}
function stabilize(c, helper) {
  c.downed = false;
  if (c.body) B.healPart(c, 'torso', Math.max(4, c.body.torso.max * 0.2) - c.body.torso.hp); else c.hp = Math.max(6, c.maxHp * 0.14);
  log(`${helper.name} stabilisiert ${c.name}.`, 'party');
  if (c !== helper) remember(c, 'saved_life', helper.name);
  if (helper !== S.player && c === S.player) addRel(helper.key, 6);
  fx(c.x, c.y - 12, 'heal', 10);
}

function die(c, cause = 'Wunden', source) {
  if (!c.alive) return;
  c.alive = false; c.downed = false;
  const arr = S.ents[c.map];
  if (c.kind === 'caravan') {
    SIM.caravanDied(c);
    for (const [g, n] of Object.entries(c.cargo || {})) if (n > 0) dropItemAt(c.map, c.x + ri(-14, 14), c.y + ri(-10, 10), mkItem(g, Math.ceil(n / 2)));
    const ci = arr.indexOf(c); if (ci >= 0) arr.splice(ci, 1);
    return;
  }
  if (c.kind === 'enemy' && c.armyId) SIM.unitDied(c);
  if (c.kind === 'enemy' && (teamOf(c) !== 'foe' || dist(S.player, c) > 500)) {   // Verbündete oder ferne Tote: keine Beute
    const m = MONSTERS[c.mtype];
    if (dist(S.player, c) < 500) log(`${m.name} fällt.`, 'combat');
    const ci = arr.indexOf(c); if (ci >= 0) arr.splice(ci, 1);
    arr.push({ id: uid(), kind:'corpse', map: c.map, x: c.x, y: c.y, life: 20000, maxLife: 20000, pal: m.pal?.cloth || '#3a3229', transient: true });
    return;
  }
  if (c.kind === 'enemy') {
    const m = MONSTERS[c.mtype];
    log(`${m.name} fällt.`, 'combat');
    dropLoot(c);
    gainXp(S.player, m.xp + c.level * 2);
    S.kills++;
    if (S.player.alive) S.player.kills = (S.player.kills || 0) + 1;
    S.battles = Math.max(1, Math.round(S.kills / 3));
    const pw = S.player.equip.weapon;
    if (pw && dist(S.player, c) < 260) pw.kills = (pw.kills || 0) + 1;
    if (c.boss) {
      chronicle(`${m.name} erschlagen`, 'battle', `Gefallen in der Verlassenen Grube, Jahr ${year()}.`);
      UI.toast(`${m.name} ist besiegt`, 3200);
    }
    onKill(c.mtype);
    const ci = arr.indexOf(c); if (ci >= 0) arr.splice(ci, 1);
    arr.push({ id: uid(), kind:'corpse', map: c.map, x: c.x, y: c.y, life: 20000, maxLife: 20000, pal: MONSTERS[c.mtype].pal?.cloth || '#3a3229', transient: true });
    return;
  }
  // Person
  const isParty = S.party.includes(c.id);
  log(`${c.name} ist gestorben. (${cause})`, 'death');
  chronicle(`${c.name} gefallen`, 'death', `${cause}. Jahr ${year()}, Tag ${S.day}.`);
  makeGrave(c, cause);
  for (const m of partyMembers()) if (m !== c) { remember(m, 'friend_died', c.name); m.morale -= 14; }
  if (isParty) S.party = S.party.filter(id => id !== c.id);
  const ci = arr.indexOf(c); if (ci >= 0) arr.splice(ci, 1);
  if (c === S.player) playerDeath(cause, source);
}

function makeGrave(c, cause) {
  const g = { id: uid(), kind:'grave', map: c.map, x: c.x, y: c.y, r: 10,
    label: `Grab: ${c.name}`, epitaph: `${c.name}<br>${c.prof || CLASSES[c.currentClass].name}<br>Gefallen: ${cause}<br>Jahr ${year()}`,
    loot: [], charKey: c.key };
  for (const k of Object.keys(c.equip)) if (c.equip[k]) { g.loot.push(c.equip[k]); c.equip[k] = null; }
  for (const i of c.inv) g.loot.push(i);
  c.inv = [];
  S.ents[c.map].push(g);
}

function dropLoot(e) {
  const table = LOOT[e.mtype] || [];
  for (const [key, p] of table) if (chance(p)) dropItemAt(e.map, e.x + ri(-10, 10), e.y + ri(-8, 8), mkItem(key));
  if (chance(0.5)) { const g = ri(1, 6) + e.level; S.gold += g; float(e, `+${g} Gold`, 'rgba(189,148,51,ALPHA)'); }
}
function dropItemAt(map, x, y, item) {
  if (!item) return;
  S.ents[map].push({ id: uid(), kind:'item', map, x, y, r: 8, item, seed: rnd() * 100 });
}

function gainXp(c, n) {
  if (!c || !c.alive) return;
  c.xp += n;
  for (const m of partyMembers()) { m.xp += n * 0.6; if (m.xp >= m.xpNext) levelUp(m); }
  if (c.xp >= c.xpNext) levelUp(c);
}
function levelUp(c) {
  c.xp -= c.xpNext; c.level++; c.xpNext = Math.round(c.xpNext * 1.35);
  if (c === S.player) { c.attrPoints = (c.attrPoints || 0) + 1; UI.toast(`Stufe ${c.level}`); log(`Du erreichst Stufe ${c.level}.`, 'party'); }
  else log(`${c.name} erreicht Stufe ${c.level}.`, 'party');
  recalc(c); B.fullHeal(c);
}

// ================= Effekte =================
function fx(x, y, type, n = 6) {
  if (S.settings.violence === 'low' && type === 'blood') return;
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, sp = 0.6 + rnd() * 2.2;
    S.fx.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.8, type, s: 1.5 + rnd() * 2.4, life: 380 + rnd() * 420, maxLife: 700 });
  }
}
function float(e, text, color, big = false) {
  S.floats.push({ x: e.x + ri(-6, 6), y: e.y - 26, rise: 0, text, color, big, life: 900, maxLife: 900 });
}
function updateFx(dt) {
  for (const f of S.fx) { f.x += f.vx * dt / 16; f.y += f.vy * dt / 16; f.vy += dt / 16 * 0.14; f.life -= dt; }
  S.fx = S.fx.filter(f => f.life > 0);
  for (const f of S.floats) { f.rise += dt / 22; f.life -= dt; }
  S.floats = S.floats.filter(f => f.life > 0);
  const arr = S.ents[S.map];
  for (let i = arr.length - 1; i >= 0; i--) {
    const e = arr[i];
    if (e.kind === 'decal' || e.kind === 'corpse') { e.life -= dt; if (e.life <= 0) arr.splice(i, 1); }
  }
}
function updateProjectiles(dt) {
  for (const p of S.projectiles) {
    p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.life -= dt;
    if (solidTile(p.map, p.x, p.y) || solidPropAt(p.map, p.x, p.y, 3)) { fx(p.x, p.y, 'spark', 3); p.life = 0; continue; }
    for (const e of S.ents[p.map]) {
      if (!(e.kind === 'enemy' || e.kind === 'npc' || e.kind === 'player') || !e.alive || e.id === p.owner) continue;
      const own = byId(p.owner);
      if (!own || teamOf(own) === teamOf(e)) continue;
      if (dist(p, e) < (e.r || 10) + 5) {
        const attacker = own || { name:'Pfeil', skills:null };
        hurtFromProjectile(attacker, e, p);
        p.life = 0; break;
      }
    }
  }
  S.projectiles = S.projectiles.filter(p => p.life > 0);
}
function hurtFromProjectile(attacker, target, p) {
  const crit = chance(0.12);
  let dmg = p.dmg * (crit ? 2 : 1) * (p.mult || 1);
  const armor = (target.kind === 'enemy' ? (target.armor || 0) * 1.2 : armorOf(target));
  dmg = Math.max(1, dmg - armor * 0.5);
  if (p.kind === 'fire') fx(p.x, p.y, 'fire', 12);
  if (p.kind === 'shadow') fx(p.x, p.y, 'shadow', 10);
  hurt(target, dmg, attacker, attacker.name, crit, p.kind === 'fire' ? 'fire' : 'physical');
  if (attacker.skills) attacker.skills.archery = Math.min(100, (attacker.skills.archery || 0) + 0.15);
}
let audioCtx = null;
function sfxHit(crit) {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = crit ? 'square' : 'triangle';
    o.frequency.value = crit ? 180 : 110 + Math.random() * 40;
    g.gain.value = 0.05; o.connect(g); g.connect(audioCtx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    o.stop(audioCtx.currentTime + 0.13);
  } catch (e) { /* Audio optional */ }
}

// ================= KI =================
function nearestTarget(e, list, maxD) {
  let best = null, bd = maxD;
  for (const t of list) { if (!t.alive || t.downed || t.map !== e.map) continue; const d = dist(e, t); if (d < bd) { bd = d; best = t; } }
  return best;
}

function updateEnemy(e, dt) {
  if (!e.alive) return;
  const p = S.player;
  const far = dist(e, p) > 1100;
  if (far) { e.vx = e.vy = 0; return; }                       // Stufe C: außerhalb der Sicht keine Simulation
  const m = MONSTERS[e.mtype];
  const targets = combat.filter(t => !t.downed && t !== e && isHostile(e, t) && (t.kind !== 'caravan' || e.faction === 'bandit'));   // nur Banditen rauben Wagen
  const ag = e.aggroId ? byId(e.aggroId) : null;
  let tgt = ag && ag.alive && !ag.downed && ag.map === e.map && isHostile(e, ag) && dist(e, ag) < m.sight * 1.6 ? ag : nearestTarget(e, targets, m.sight);
  const sp = m.speed * dt / 16 * speedMul(e.map, e.x, e.y) * B.speedFactor(e);
  if (e.hp < e.maxHp * 0.2 && !e.boss && !e.fleeing && chance(0.004)) { e.fleeing = true; log(`${m.name} flieht.`, 'combat'); }
  if (e.fleeing && tgt) {
    const a = Math.atan2(e.y - tgt.y, e.x - tgt.x);
    moveEnt(e, Math.cos(a) * sp, Math.sin(a) * sp);
    if (dist(e, tgt) > m.sight * 1.5) { e.fleeing = false; e.aggroId = null; }
    return;
  }
  if (!tgt) {
    e.aiTimer -= dt;
    if (e.aiTimer <= 0) { e.aiTimer = ri(1200, 3600); e.wander = { x: e.anchor.x + ri(-90, 90), y: e.anchor.y + ri(-90, 90) }; }
    if (e.wander) {
      const d = Math.hypot(e.wander.x - e.x, e.wander.y - e.y);
      if (d > 8) { const a = Math.atan2(e.wander.y - e.y, e.wander.x - e.x); moveEnt(e, Math.cos(a) * sp * 0.45, Math.sin(a) * sp * 0.45); }
      else e.vx = e.vy = 0;
    }
    return;
  }
  e.aim = Math.atan2(tgt.y - e.y, tgt.x - e.x);
  const d = dist(e, tgt), reach = m.reach + (tgt.r || 10);
  if (m.ranged) {
    if (d < 120) { moveEnt(e, -Math.cos(e.aim) * sp, -Math.sin(e.aim) * sp); }
    else if (d > m.reach * 0.9) moveEnt(e, Math.cos(e.aim) * sp, Math.sin(e.aim) * sp);
    else e.vx = e.vy = 0;
    if (d < m.reach && e.atkCd <= 0) {
      e.atkCd = m.atk;
      S.projectiles.push({ id: uid(), kind:'arrow', map: e.map, x: e.x + Math.cos(e.aim) * 12, y: e.y - 10 + Math.sin(e.aim) * 8,
        vx: Math.cos(e.aim) * 6, vy: Math.sin(e.aim) * 6, owner: e.id, dmg: m.dmg * (1 + e.level * 0.05), life: 1600, team:'foe' });
    }
    return;
  }
  if (d > reach * 0.8) moveEnt(e, Math.cos(e.aim) * sp, Math.sin(e.aim) * sp);
  else {
    e.vx = e.vy = 0;
    if (e.atkCd <= 0 && e.swing <= 0) {
      if (m.telegraph && e.telegraph <= 0 && !e.windup) { e.windup = true; e.telegraph = m.telegraph; return; }
      if (m.telegraph && e.telegraph > 0) return;
      e.windup = false;
      e.atkCd = m.atk; e.swingDur = m.atk * 0.5; e.swing = 0.001; e.hitDone = false;
      e.enemySwing = true;
    }
  }
}

// Gegner nutzen resolveSwing über tickCombatant; hier der Treffer für monsterhafte Angreifer
function resolveSwingEnemy(e) {
  const m = MONSTERS[e.mtype];
  for (const t of combat) {
    if (!t.alive || t.downed || t === e || t.invuln || !isHostile(e, t)) continue;
    if (dist(e, t) > m.reach + (t.r || 10)) continue;
    const ang = Math.atan2(t.y - e.y, t.x - e.x);
    if (Math.abs(normAng(ang - e.aim)) > 1.1) continue;
    hit(e, t, 1);
    if (!m.boss) break;
  }
}

function updateNpc(e, dt) {
  if (!e.alive) return;
  if (S.party.includes(e.id)) return partyAI(e, dt);
  const p = S.player;
  if (dist(e, p) > 900) { e.vx = e.vy = 0; return; }
  // Hysterese: bemerken ab 220 px, loslassen erst ab 340 px. Ohne sie pendelt die Figur an der Grenze (Zittern).
  const held = e.threatId ? byId(e.threatId) : null;
  const keep = held && held.alive && held.map === e.map && teamOf(held) === 'foe' && dist(e, held) < 340;
  const f = keep ? held : S.ents[e.map].find(x => x.kind === 'enemy' && x.alive && teamOf(x) === 'foe' && dist(e, x) < 220);
  e.threatId = f ? f.id : null;
  if (f) {
    if (e.guard || e.hostile || e.angry) {
      e.aim = Math.atan2(f.y - e.y, f.x - e.x);
      const sp = 1.3 * dt / 16;
      if (dist(e, f) > 34) moveEnt(e, Math.cos(e.aim) * sp, Math.sin(e.aim) * sp);
      else { e.vx = e.vy = 0; if (e.atkCd <= 0) attack(e); }
      return;
    }
    if (!e.brave) {                                              // Zivilisten fliehen
      const a = Math.atan2(e.y - f.y, e.x - f.x), sp = 1.5 * dt / 16;
      moveEnt(e, Math.cos(a) * sp, Math.sin(a) * sp);
      return;
    }
  }
  // Tagesablauf
  const h = S.minute / 60;
  let target = e.anchor;
  if (e.schedulePos) target = e.schedulePos;
  if (h >= 22 || h < 7) target = e.anchor;
  else if (h >= 18 && h < 22 && e.home) target = { x: e.anchor.x + 40, y: e.anchor.y + 20 };
  e.aiTimer -= dt;
  if (e.aiTimer <= 0) { e.aiTimer = ri(2200, 5200); e.wander = { x: target.x + ri(-46, 46), y: target.y + ri(-40, 40) }; }
  if (e.wander) {
    const d = Math.hypot(e.wander.x - e.x, e.wander.y - e.y);
    if (d > 10) { const a = Math.atan2(e.wander.y - e.y, e.wander.x - e.x); const sp = 0.9 * dt / 16;
      moveEnt(e, Math.cos(a) * sp, Math.sin(a) * sp); }
    else e.vx = e.vy = 0;
  }
}

function partyAI(m, dt) {
  const p = S.player;
  if (m.downed) { m.vx = m.vy = 0; return; }
  if (m.map !== S.map) { m.map = S.map; m.x = p.x + ri(-30, 30); m.y = p.y + ri(-30, 30);
    if (!S.ents[S.map].includes(m)) S.ents[S.map].push(m); }
  const cmd = S.partyCmd || 'follow';
  const sp = speedOf(m) * dt / 16 * 0.95;
  const foes = S.ents[m.map].filter(e => e.kind === 'enemy' && e.alive && isHostile(m, e) && dist(m, e) < (cmd === 'attack' ? 420 : 260));
  // Heiler
  if (m.abilities.includes('holy_heal') && m.mana >= 18 && (m.cooldowns.holy_heal || 0) <= 0) {
    const wounded = [p, ...partyMembers()].filter(a => a.alive && a.hp < a.maxHp * 0.5 && dist(m, a) < 260)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (wounded) {
      m.mana -= 18; m.cooldowns.holy_heal = ABILITIES.holy_heal.cd;
      const amt = 22 + m.attributes.intelligence * 1.4;
      B.heal(wounded, amt);
      if (wounded.downed) { wounded.downed = false; }
      fx(wounded.x, wounded.y - 14, 'heal', 14); float(wounded, '+' + Math.round(amt), 'rgba(120,170,90,ALPHA)');
      log(`${m.name} heilt ${wounded.name}.`, 'party');
    }
  }
  if (cmd === 'retreat' || (m.morale < 22 && chance(0.002))) {
    const a = Math.atan2(p.y - m.y, p.x - m.x);
    if (dist(m, p) > 60) moveEnt(m, Math.cos(a) * sp, Math.sin(a) * sp); else m.vx = m.vy = 0;
    return;
  }
  const foe = foes[0];
  if (foe && cmd !== 'hold' || (foe && cmd === 'hold' && dist(m, foe) < 90)) {
    m.aim = Math.atan2(foe.y - m.y, foe.x - m.x);
    const it = m.equip.weapon ? ITEMS[m.equip.weapon.key] : null;
    const want = it && it.ranged ? 170 : (it ? it.reach : 30) + 12;
    const d = dist(m, foe);
    if (it && it.ranged && d < 110) moveEnt(m, -Math.cos(m.aim) * sp, -Math.sin(m.aim) * sp);
    else if (d > want) moveEnt(m, Math.cos(m.aim) * sp, Math.sin(m.aim) * sp);
    else { m.vx = m.vy = 0; attack(m); }
    if (chance(0.0006)) remember(m, 'fought_together', p.name);
    return;
  }
  if (cmd === 'hold') { m.vx = m.vy = 0; return; }
  // Folgen
  const idx = S.party.indexOf(m.id);
  const ang = (idx / Math.max(1, S.party.length)) * Math.PI * 2;
  const tx = p.x + Math.cos(ang) * 46, ty = p.y + Math.sin(ang) * 46;
  const d = Math.hypot(tx - m.x, ty - m.y);
  if (d > 26) { const a = Math.atan2(ty - m.y, tx - m.x); moveEnt(m, Math.cos(a) * sp * Math.min(1.6, d / 60), Math.sin(a) * sp * Math.min(1.6, d / 60)); }
  else m.vx = m.vy = 0;
}

// ================= Beziehungen & Erinnerungen =================
function addRel(key, n) {
  if (!key) return;
  S.relations[key] = clamp((S.relations[key] || 0) + n, -100, 100);
}
function remember(c, key, about) {
  (c.memories ||= []).push({ key, about, year: year(), day: S.day });
  if (c.memories.length > 24) c.memories.shift();
  if (key === 'saved_life') addRel(c.key, 15);
  if (key === 'friend_died') c.morale -= 8;
}

// ================= Interaktion =================
function interactables() {
  const p = S.player;
  return S.ents[S.map].filter(e => e !== p && dist(e, p) < 62 &&
    (e.kind === 'npc' || e.kind === 'item' || e.kind === 'grave' ||
     (e.kind === 'prop' && (e.portal || e.harvest || e.loot || e.claim || e.type === 'tree' || e.type === 'shrine' || e.type === 'board' || e.type === 'chest' || e.type === 'crate'))))
    .sort((a, b) => (dist(p, a) - (a.kind === 'npc' ? 24 : 0)) - (dist(p, b) - (b.kind === 'npc' ? 24 : 0)));   // Personen vor Dingen
}
function updatePrompt() {
  if (UI.dialogueOpen() || placing) { UI.setPrompt(placing ? 'Linksklick: <b>bauen</b> · Rechtsklick/Esc: abbrechen' : ''); return; }
  const t = interactables()[0];
  if (!t) return UI.setPrompt('');
  const label = t.kind === 'npc' ? `<b>E</b> Sprechen — ${t.name}` :
    t.kind === 'item' ? `<b>E</b> Aufheben — ${ITEMS[t.item.key].name}` :
    t.kind === 'grave' ? `<b>E</b> Grab untersuchen` :
    t.portal ? `<b>E</b> Betreten — ${t.label || ''}` :
    t.type === 'tree' ? `<b>E</b> Holz schlagen` :
    t.harvest === 'herb' ? `<b>E</b> Kräuter sammeln` :
    t.harvest === 'stone' ? `<b>E</b> Stein brechen` :
    t.harvest === 'iron' ? `<b>E</b> Erz abbauen` :
    t.claim ? `<b>E</b> Ort beanspruchen` :
    t.type === 'shrine' ? `<b>E</b> Beten` :
    t.type === 'board' ? `<b>E</b> Anschlagbrett lesen` : `<b>E</b> Durchsuchen`;
  UI.setPrompt(label);
}
function doInteract() {
  const p = S.player, t = interactables()[0];
  if (!t) return;
  if (t.kind === 'npc') return talk(t);
  if (t.kind === 'item') {
    if (addItem(p, t.item.key, t.item.count || 1)) {
      log(`Aufgehoben: ${ITEMS[t.item.key].name}.`, 'world');
      S.ents[S.map].splice(S.ents[S.map].indexOf(t), 1);
      onItemGained(t.item.key);
    }
    return;
  }
  if (t.kind === 'grave') {
    if (t.loot && t.loot.length) {
      const it = t.loot.pop();
      if (addItem(p, it.key, it.count || 1)) { log(`Aus dem Grab geborgen: ${ITEMS[it.key].name}.`, 'world'); onItemGained(it.key); }
      else t.loot.push(it);
    } else UI.toast(t.epitaph.replace(/<br>/g, ' · ').replace(/<[^>]+>/g, ''), 4200);
    return;
  }
  if (t.portal) return travel(t.portal);
  if (t.claim) return claimPlace(t);
  if (t.type === 'tree') {
    if (t.chopCd && performance.now() < t.chopCd) return;
    t.chopCd = performance.now() + 400;
    t.hp = (t.hp ?? 3) - 1;
    fx(t.x, t.y - 14, 'dust', 4);
    S.res.wood += ri(1, 2);
    if (t.hp <= 0) { removeSolid(t); S.ents[S.map].splice(S.ents[S.map].indexOf(t), 1); log('Baum gefällt.', 'world'); }
    S.player.skills.survival = Math.min(100, (S.player.skills.survival || 0) + 0.1);
    return;
  }
  if (t.harvest) {
    if (t.depleted) return UI.toast('Erschöpft.');
    t.depleted = true; t.respawn = S.day + 2;
    const n = ri(1, 3);
    if (t.harvest === 'herb') { addItem(p, 'herb', n); S.res.herb += 0; }
    else S.res[t.harvest] += n;
    log(`${n}× ${({ herb:'Heilkraut', stone:'Stein', iron:'Eisenerz' })[t.harvest]} gewonnen.`, 'world');
    if (t.harvest === 'herb') onItemGained('herb');
    fx(t.x, t.y - 10, 'dust', 5);
    return;
  }
  if (t.loot && t.loot.length && !t.opened) {
    t.opened = true;
    for (const k of t.loot) { addItem(p, k); onItemGained(k); log(`Gefunden: ${ITEMS[k].name}.`, 'world'); }
    UI.toast(`${t.label || 'Behälter'} geöffnet`);
    return;
  }
  if (t.type === 'shrine') {
    (p.status ||= []).push({ key:'blessing', name:'Gesegnet', good:true, left: 60000 }); fx(p.x, p.y - 14, 'heal', 16);   // Schrein segnet, heilt aber nicht
    if (!t.usedDay || t.usedDay !== S.day) { t.usedDay = S.day; S.factions.order += 1; log('Du betest am Schrein. Der Orden bemerkt es.', 'faction'); }
    return;
  }
  if (t.type === 'board') {
    const open = Object.entries(QUESTS).filter(([k]) => !S.quests[k]);
    UI.toast(open.length ? `Aushang: ${open[0][1].name} — sprich mit ${NPCS.find(n => n.key === open[0][1].giver)?.name}` : 'Nichts Neues am Brett.', 4200);
    return;
  }
  if ((t.type === 'crate' || t.type === 'chest') && !t.opened) {
    t.opened = true;
    const k = pick(['bread', 'bandage', 'herb', 'wood', 'stone']);
    addItem(p, k); log(`Gefunden: ${ITEMS[k].name}.`, 'world');
  }
}

function travel(to) {
  const p = S.player;
  const pi = S.ents[S.map].indexOf(p); if (pi >= 0) S.ents[S.map].splice(pi, 1);
  const members = partyMembers();
  for (const m of members) { const a = S.ents[m.map]; if (a.includes(m)) a.splice(a.indexOf(m), 1); }
  S.map = to; p.map = to;
  const spot = to === 'mine' ? MAPS.mine.entry : freeSpotNear('world', 62, 20, 3);
  p.x = spot.x; p.y = spot.y;
  S.ents[to].push(p);
  for (const m of members) { m.map = to; m.x = p.x + ri(-24, 24); m.y = p.y + ri(-24, 24); S.ents[to].push(m); }
  log(to === 'mine' ? 'Du steigst in die Verlassene Grube hinab. Es riecht nach kaltem Eisen.' : 'Du kehrst an die Oberfläche zurück.', 'world');
  UI.toast(to === 'mine' ? 'Verlassene Grube' : 'Greenmark-Grenzland');
  save();
}

function claimPlace(t) {
  if (S.settlement) return UI.toast('Du hast bereits eine Siedlung.');
  foundCamp(t.x, t.y, 'Alte Feste');
  t.claimed = true;
}

// ================= Siedlung =================
function foundCamp(x, y, name) {
  const p = S.player;
  if (S.settlement) return UI.toast('Du hast bereits ein Lager.');
  if (S.res.wood < 5) return UI.toast('Du brauchst 5 Holz.');
  S.res.wood -= 5;
  S.settlement = { name: name || `${S.legacy.house}heim`, x: x ?? p.x, y: y ?? p.y, map: S.map, buildings: [], morale: 60,
    priorities: ['Verwundete versorgen', 'Nahrung sammeln', 'Verteidigung ausbessern', 'Holz schlagen', 'Handwerk', 'Ruhe'],
    history: [{ text: `Gegründet von ${p.name}`, year: year() }] };
  placeBuilding('campfire', S.settlement.x, S.settlement.y, true);
  chronicle(`${S.settlement.name} gegründet`, 'settle', `${p.name} steckt einen Platz ab. Zuerst ist es nur ein Feuer.`);
  log(`${S.settlement.name} gegründet.`, 'world');
  recalc(p); save();
}
function canAfford(cost) { return Object.entries(cost).every(([k, v]) => S.res[k] >= v); }
function payCost(cost) { for (const [k, v] of Object.entries(cost)) S.res[k] -= v; }
function canPlace(g) {
  const def = g.def;
  for (let j = 0; j < def.h; j++) for (let i = 0; i < def.w; i++) {
    const tx = ((g.x - def.w * TS / 2) / TS | 0) + i, ty = ((g.y - def.h * TS / 2) / TS | 0) + j;
    if (SOLID.has(tileAt(S.map, tx, ty))) return false;
  }
  return !S.ents[S.map].some(e => e.kind === 'building' && e !== g && Math.abs(e.x - g.x) < (e.def.w + def.w) * TS / 2 - 4 && Math.abs(e.y - g.y) < (e.def.h + def.h) * TS / 2 - 4);
}
function placeBuilding(type, x, y, free) {
  const def = BUILDINGS[type];
  if (!free && !canAfford(def.cost)) { UI.toast('Zu wenig Material'); return null; }
  if (!free) payCost(def.cost);
  const b = { id: uid(), kind:'building', type, def, map: S.map, x, y, r: Math.max(def.w, def.h) * TS / 2,
    built: 0.02, cond: 1, solid: ['palisade', 'hut', 'smithy', 'watchtower', 'storage'].includes(type), workers: 0 };
  S.ents[S.map].push(b);
  if (b.solid) addSolid(b);
  S.settlement.buildings.push(b);
  log(`${def.name} wird errichtet.`, 'world');
  return b;
}
function updateBuildings(dt) {
  if (!S.settlement) return;
  for (const b of S.settlement.buildings) {
    if (b.built >= 1) continue;
    const helpers = [S.player, ...partyMembers()].filter(c => c.map === b.map && dist(c, b) < 90).length;
    if (!helpers) continue;
    b.built = Math.min(1, b.built + (dt / 1000) * helpers / b.def.time);
    if (b.built >= 1) {
      log(`${b.def.name} fertiggestellt.`, 'world');
      UI.toast(`${b.def.name} steht`);
      S.settlement.history.push({ text: `${b.def.name} errichtet`, year: year() });
      if (b.type === 'storage') UI.toast('Gemeinsamer Vorrat verfügbar');
      recalc(S.player);
    }
  }
}
function population() {
  return partyMembers().length + 1 + (S.settlement ? S.settlement.buildings.filter(b => b.built >= 1).reduce((n, b) => n + (b.def.pop || 0), 0) : 0);
}

// ================= Welt-Simulation =================
function hourTick(h) {
  if (h % 6 === 0) SIM.warTick();                          // Heere ziehen, Schlachten, Eroberungen
  if (chance(0.10)) worldEvent();
  checkRankUp();
  // Siedlung produziert
  if (S.settlement) {
    const farms = S.settlement.buildings.filter(b => b.type === 'farm' && b.built >= 1).length;
    S.res.food += farms * 0.5;
    if (S.settlement.buildings.some(b => b.type === 'well' && b.built >= 1)) S.settlement.morale = Math.min(100, S.settlement.morale + 0.2);
  }
  // Nachwachsen
  for (const map of ['world', 'mine']) for (const e of S.ents[map]) if (e.depleted && e.respawn <= S.day) { e.depleted = false; }
  if (h === 3 && chance(0.4) && S.settlement) raidSettlement();
  // Gruppengeschehen
  if (chance(0.25)) partyInteraction();
}

const EVENTS = [
  () => { log('Eine Karawane wurde auf der Alten Straße überfallen.', 'economy'); S.prices = (S.prices || 1) * 1.05; },
  () => { log('Untote wurden nördlich von Eren gesichtet.', 'faction'); spawnEnemy('skeleton', 'world', 60 + ri(-6, 6), 50 + ri(-4, 4)); },
  () => { log('Flüchtlinge erreichen Eren. Die Preise steigen.', 'economy'); S.prices = (S.prices || 1) * 1.08; },
  () => { log('Valen zieht Truppen an der Nordfurt zusammen.', 'faction'); },
  () => { log('In der Grube wurde eine neue Ader gefunden.', 'economy'); S.prices = (S.prices || 1) * 0.96; },
  () => { log('Banditen fordern Wegzoll auf der Alten Straße.', 'world'); spawnEnemy('bandit', 'world', 96 + ri(-6, 6), 64 + ri(-3, 3)); },
  () => { const f = pick(['valen', 'order', 'merch']); S.factions[f] += ri(-2, 3); log(`Gerüchte verändern dein Ansehen bei ${FACTIONS[f].name}.`, 'faction'); },
];
function worldEvent() { pick(EVENTS)(); }

function raidSettlement() {
  const n = ri(2, 4 + Math.floor(S.day / 20));
  log(`ANGRIFF: ${n} Angreifer nähern sich ${S.settlement.name}.`, 'combat');
  UI.toast(`FEINDE NÄHERN SICH — ${n} Angreifer`, 4200);
  for (let i = 0; i < n; i++)
    spawnEnemy(chance(0.6) ? 'bandit' : 'skeleton', S.settlement.map, (S.settlement.x / TS | 0) + ri(-8, 8), (S.settlement.y / TS | 0) + ri(-8, 8));
  S.settlement.history.push({ text: 'Überfall abgewehrt oder erlitten', year: year() });
}

function dayTick() {
  SIM.warDay();                                             // Märkte, Heeresversorgung, Nachschub
  if (!S.ents.world.some(e => e.kind === 'caravan')) SIM.initSim();
  // Nahrung
  const mem = partyMembers();
  const need = mem.length + 1;
  if (S.res.food >= need) { S.res.food -= need; for (const m of mem) m.morale = Math.min(100, m.morale + 2); }
  else {
    S.res.food = 0;
    for (const m of mem) { m.morale -= 10; remember(m, 'starved'); }
    if (S.player.body) { S.player.body.torso.hp = Math.max(1, S.player.body.torso.hp - 4); B.syncHp(S.player); }
    log('Die Gruppe hungert. Moral sinkt.', 'party');
  }
  // Desertion
  for (const m of mem) {
    if (m.morale < 12 && chance(0.4)) {
      log(`${m.name} verlässt die Gruppe.`, 'party');
      chronicle(`${m.name} verlässt ${S.player.name}`, 'party', 'Zu wenig Lohn, zu viele Tote.');
      S.party = S.party.filter(id => id !== m.id);
      addRel(m.key, -20);
    }
  }
  // Siedlung wächst
  if (S.settlement) {
    const houses = S.settlement.buildings.filter(b => ['hut', 'tent'].includes(b.type) && b.built >= 1).length;
    if (houses > 0 && S.res.food > 3 && chance(0.3)) {
      log('Ein Siedler schließt sich deinem Lager an.', 'world');
      S.settlement.morale = Math.min(100, S.settlement.morale + 3);
    }
    for (const b of S.settlement.buildings) if (b.built >= 1 && chance(0.2)) b.cond = Math.max(0.2, b.cond - 0.01);
  }
  // Waffenzustand / Legendäre Gegenstände
  const w = S.player.equip.weapon;
  if (w && (w.kills || 0) >= 15 && !w.name) {
    w.name = `${S.player.name}s ${ITEMS[w.key].name}`;
    w.lore = `Getragen von ${S.player.name}, Haus ${S.legacy.house}.`;
    w.history = [`Jahr ${year()}: benannt nach ${w.kills} Feinden.`];
    chronicle(`${w.name} erhält einen Namen`, 'item', w.lore);
    UI.toast(`${w.name}`, 4000);
  }
  S.prices = clamp((S.prices || 1) * (0.98 + rnd() * 0.04), 0.7, 1.6);
  save();
  log(`Tag ${S.day} bricht an.`, 'world');
}

function partyInteraction() {
  const mem = partyMembers();
  if (mem.length < 2) return;
  const a = pick(mem); let b = pick(mem);
  if (a === b) return;
  const conflict = (a.traits || []).some(t => ['grausam', 'misstrauisch', 'faul'].includes(t)) ||
                   (b.traits || []).some(t => ['grausam', 'misstrauisch', 'faul'].includes(t));
  if (conflict && chance(0.5)) {
    a.morale -= 4; b.morale -= 4;
    log(`${a.name} und ${b.name} geraten aneinander.`, 'party');
    remember(a, 'fought_together', b.name);
  } else {
    a.morale = Math.min(100, a.morale + 3); b.morale = Math.min(100, b.morale + 3);
    log(`${a.name} und ${b.name} teilen Brot und Geschichten.`, 'party');
    addRel(a.key, 1); addRel(b.key, 1);
  }
}

function respawnTick() {
  const p = S.player;
  const W = S.ents.world;
  for (let i = W.length - 1; i >= 0; i--) {
    const e = W[i];
    if (e.kind === 'enemy' && e.armyId && !S.war.battles.some(b => b.sides.includes(e.armyId)) && (p.map !== 'world' || dist(e, p) > 1400)) W.splice(i, 1);
  }
  for (const a of SPAWN_AREAS) {
    const count = S.ents[a.map].filter(e => e.kind === 'enemy' && !e.boss &&
      Math.hypot(e.x / TS - a.x, e.y / TS - a.y) < a.r + 4).length;
    if (count >= a.cap) continue;
    const tx = a.x + ri(-a.r, a.r), ty = a.y + ri(-a.r, a.r);
    if (a.map === S.map && Math.hypot(tx * TS - p.x, ty * TS - p.y) < 620) continue;
    if (chance(0.55)) spawnEnemy(pick(a.types), a.map, tx, ty);
  }
}

// ================= Dialog =================
function talk(npc) {
  const p = S.player, rel = S.relations[npc.key] ?? 0;
  const choices = [];
  // Quests des Gebers
  for (const [k, Q] of Object.entries(QUESTS)) {
    if (Q.giver !== npc.key) continue;
    const st = S.quests[k];
    if (!st && questAvailable(k)) choices.push({ text: `Was liegt an? (${Q.name})`, fn: () => offerQuest(npc, k) });
    else if (st && st.state === 'active' && questComplete(k)) choices.push({ text: `Erledigt. (${Q.name})`, fn: () => turnIn(npc, k) });
  }
  if (npc.key === 'jorun' && S.quests.q_lila?.state === 'active' && S.flags.lilaFound)
    choices.push({ text: 'Über deine Tochter …', fn: () => lilaOutcome(npc) });
  if (npc.teaches) choices.push({ text: `Kannst du mich ausbilden? (${CLASSES[npc.teaches].name})`, fn: () => teach(npc) });
  if (npc.faction && S.ranks[npc.faction] === -1 && ['valen', 'order', 'undead'].includes(npc.faction))
    choices.push({ text: `Wie tritt man bei — ${FACTIONS[npc.faction].name}?`, fn: () => joinFaction(npc) });
  const occupied = npc.town && S.war.nodes[npc.town]?.owner === 'undead';
  if (npc.shop && occupied) choices.push({ text: 'Zeig mir deine Waren.', fn: () => UI.dialogue(npc, '„Handel? Die Toten halten die Stadt. Ich verstecke, was ich habe.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]) });
  else if (npc.shop) choices.push({ text: 'Zeig mir deine Waren.', fn: () => { UI.closeDialogue(); UI.openModal('trade', npc); } });
  if (npc.smith) choices.push({ text: 'Kannst du das ausbessern?', fn: () => repairAll(npc) });
  if (npc.recruit && !S.party.includes(npc.id)) choices.push({ text: 'Komm mit mir.', fn: () => recruit(npc) });
  if (S.party.includes(npc.id)) choices.push({ text: 'Bleib hier.', fn: () => { dismiss(npc); UI.closeDialogue(); } });
  choices.push({ text: 'Was gibt es Neues?', fn: () => gossip(npc) });
  choices.push({ text: '[Gehen]', fn: () => UI.closeDialogue() });
  UI.dialogue(npc, npc.greet, choices);
  if (rel === 0) addRel(npc.key, 1);
}

function gossip(npc) {
  const lines = [
    `„Die Grube im Norden ist verloren. Etwas Großes hat sich dort eingerichtet.“`,
    `„An der Nordfurt sammelt Valen Männer. Das bedeutet nie etwas Gutes.“`,
    `„Der Friedhof im Süden — geh nachts nicht hin.“`,
    `„Rook sitzt im Moor. Er zahlt gut, aber nicht lange.“`,
    `„Kelan der Graue betet am Waldschrein. Der Mann war einmal ein Ritter.“`,
    `„Die Preise steigen. Krieg im Norden, sagen sie.“`,
    S.settlement ? `„Man redet über dein Lager bei ${S.settlement.name}.“` : `„Freies Land gibt es genug. Mut, es zu halten, weniger.“`,
  ];
  UI.dialogue(npc, pick(lines), [{ text: 'Und sonst?', fn: () => gossip(npc) }, { text: '[Gehen]', fn: () => UI.closeDialogue() }]);
}

// ================= Quests =================
function questAvailable(k) {
  if (k === 'q_paladin2') return S.quests.q_paladin1?.state === 'done';
  if (k === 'q_paladin3') return S.quests.q_paladin2?.state === 'done';
  if (k === 'q_paladin1') return (S.relations.kelan ?? 0) >= 10;
  if (k === 'q_undead') return (S.relations.morvath ?? 0) >= 5;
  if (k === 'q_rook') return (S.relations.rook ?? 0) >= 10;
  return true;
}
function offerQuest(npc, k) {
  const Q = QUESTS[k];
  UI.dialogue(npc, Q.desc, [
    { text: 'Ich mache es.', fn: () => {
      S.quests[k] = { state:'active', progress: Q.objectives.map(() => 0) };
      log(`Auftrag angenommen: ${Q.name}`, 'quest');
      if (k === 'q_paladin3') {
        S.flags.holdShrine = true;
        for (let i = 0; i < 4; i++) spawnEnemy('skeleton', 'world', 76 + ri(-5, 5), 52 + ri(-5, 5), { level: 5 });
        log('Die Toten wenden sich zum Schrein.', 'combat');
      }
      chronicle(`Auftrag: ${Q.name}`, 'quest', Q.desc);
      UI.closeDialogue(); UI.toast(`Auftrag: ${Q.name}`);
    } },
    { text: 'Nicht jetzt.', fn: () => UI.closeDialogue() },
  ]);
}
function questComplete(k) {
  const st = S.quests[k], Q = QUESTS[k];
  return st && Q.objectives.every((o, i) => (st.progress[i] || 0) >= (o.count || 1));
}
function turnIn(npc, k) {
  const Q = QUESTS[k], st = S.quests[k];
  st.state = 'done';
  const r = Q.reward || {};
  if (r.gold) { S.gold += r.gold; log(`${r.gold} Gold erhalten.`, 'economy'); }
  if (r.xp) gainXp(S.player, r.xp);
  if (r.rep) for (const [f, v] of Object.entries(r.rep)) { S.factions[f] += v; log(`${FACTIONS[f].name}: ${v > 0 ? '+' : ''}${v} Ansehen.`, 'faction'); }
  if (r.rel) for (const [n, v] of Object.entries(r.rel)) addRel(n, v);
  if (r.unlock) unlockClass(r.unlock);
  addRel(npc.key, 8);
  log(`Auftrag abgeschlossen: ${Q.name}`, 'quest');
  chronicle(`${Q.name} abgeschlossen`, 'quest');
  UI.dialogue(npc, '„Das war mehr, als ich erwartet habe.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]);
  save();
}
function onKill(mtype) {
  for (const [k, st] of Object.entries(S.quests)) {
    if (st.state !== 'active') continue;
    QUESTS[k].objectives.forEach((o, i) => {
      if (o.type === 'kill' && (o.target === mtype || (o.target === 'bandit_rival' && mtype === 'bandit'))) {
        st.progress[i] = (st.progress[i] || 0) + 1;
        if (st.progress[i] <= (o.count || 1)) log(`${QUESTS[k].name}: ${st.progress[i]}/${o.count}`, 'quest');
      }
    });
  }
}
function onItemGained(key) {
  for (const [k, st] of Object.entries(S.quests)) {
    if (st.state !== 'active') continue;
    QUESTS[k].objectives.forEach((o, i) => {
      if (o.type === 'item' && o.target === key) {
        st.progress[i] = S.player.inv.filter(x => x.key === key).reduce((n, x) => n + (x.count || 1), 0);
        log(`${QUESTS[k].name}: ${st.progress[i]}/${o.count}`, 'quest');
      }
    });
  }
}
function questCheck() {
  // "Finden"-Ziele
  const st = S.quests.q_lila;
  if (st && st.state === 'active' && !S.flags.lilaFound) {
    const lila = S.ents.world.find(e => e.key === 'lila');
    if (lila && dist(lila, S.player) < 120 && S.map === 'world') {
      S.flags.lilaFound = true; st.progress[0] = 1;
      log('Du hast Lila gefunden — im Banditenlager, unverletzt.', 'quest');
      UI.toast('Lila gefunden');
    }
  }
  // Schrein halten
  if (S.flags.holdShrine) {
    const foes = S.ents.world.filter(e => e.kind === 'enemy' && e.alive && Math.hypot(e.x / TS - 76, e.y / TS - 52) < 12).length;
    if (!foes) {
      S.flags.holdShrine = false;
      const q = S.quests.q_paladin3; if (q) { q.progress[0] = 1; log('Der Schrein hält. Die Toten kommen nicht mehr.', 'quest'); UI.toast('Der Schrein ist gehalten'); }
    }
  }
}
function lilaOutcome(npc) {
  const lila = S.ents.world.find(e => e.key === 'lila');
  UI.dialogue(npc, '„Du hast sie gesehen? Sag es mir. Sag mir die Wahrheit.“', [
    { text: 'Sie ist freiwillig gegangen. Sie kommt nicht zurück.', fn: () => {
      finishLila('Wahrheit gesagt: Lila ging freiwillig. Jorun altert um Jahre.', { rel:{ jorun:-5 }, xp:60, rep:{ valen:2 } });
      if (lila) { lila.recruit = true; addRel('lila', 20); }
    } },
    { text: 'Banditen halten sie. Ich hole sie zurück.', fn: () => {
      finishLila('Versprechen gegeben: Lila wird zurückgebracht.', { xp:40 });
      S.flags.lilaPromise = true;
      if (lila) { lila.home = 'village'; lila.anchor = { x: 60 * TS, y: 68 * TS }; lila.x = lila.anchor.x; lila.y = lila.anchor.y; }
      S.gold += 0;
      log('Lila kehrt nach Eren zurück.', 'quest'); addRel('jorun', 25);
    } },
    { text: 'Sie ist tot. (Lüge)', fn: () => {
      finishLila('Gelogen. Jorun trauert um eine Lebende.', { gold:40, rel:{ jorun:10 } });
      S.factions.valen -= 3;
    } },
  ]);
}
function finishLila(outcome, r) {
  const st = S.quests.q_lila; st.state = 'done'; st.outcome = outcome;
  if (r.gold) S.gold += r.gold;
  if (r.xp) gainXp(S.player, r.xp);
  if (r.rep) for (const [f, v] of Object.entries(r.rep)) S.factions[f] += v;
  if (r.rel) for (const [n, v] of Object.entries(r.rel)) addRel(n, v);
  log(outcome, 'quest'); chronicle('Die vermisste Tochter', 'quest', outcome);
  UI.closeDialogue(); save();
}

// ================= Ausbildung / Fraktionen =================
function unlockClass(cls) {
  const p = S.player;
  const chain = []; let k = cls;
  while (k) { chain.unshift(k); k = CLASSES[k].parent; }
  for (const c of chain) if (!p.knownClasses.includes(c)) p.knownClasses.push(c);
  setClass(cls);
  chronicle(`${p.name} wird ${CLASSES[cls].name}`, 'class', CLASSES[cls].desc || '');
  UI.toast(`${CLASSES[cls].name.toUpperCase()} FREIGESCHALTET`, 4200);
}
function setClass(cls) {
  const p = S.player;
  if (!p.knownClasses.includes(cls)) return;
  p.currentClass = cls;
  p.abilities = [...new Set((CLASSES[cls].abilities || []))];
  recalc(p); syncHotbar(); UI.refreshHUD();
  log(`Du führst dich nun als ${CLASSES[cls].name}.`, 'party');
}
function teach(npc) {
  const p = S.player, cls = npc.teaches, rel = S.relations[npc.key] ?? 0;
  const need = { paladin: 'q_paladin3', warlock: 'q_undead' }[cls];
  if (need && S.quests[need]?.state !== 'done') {
    return UI.dialogue(npc, cls === 'paladin'
      ? '„Erst die Prüfungen. Wachsamkeit, das Siegel, der Schrein. Dann reden wir.“'
      : '„Bring mir erst das Grabsiegel aus dem Moor. Dann sehen wir, was du verträgst.“',
      [{ text: 'Ich komme wieder.', fn: () => UI.closeDialogue() }]);
  }
  if (rel < (npc.key === 'rook' ? 40 : 20))
    return UI.dialogue(npc, '„Ich lehre keine Fremden. Hilf mir erst.“', [{ text: 'Verstanden.', fn: () => UI.closeDialogue() }]);
  if (p.knownClasses.includes(cls))
    return UI.dialogue(npc, '„Du kannst das bereits. Übe es.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]);
  UI.dialogue(npc, `„Gut. Ich zeige dir, wie ${CLASSES[cls].name} kämpfen. Danach liegt es an dir.“`, [
    { text: `Ausbildung annehmen (${CLASSES[cls].name})`, fn: () => { unlockClass(cls); addRel(npc.key, 5); UI.closeDialogue(); save(); } },
    { text: 'Später.', fn: () => UI.closeDialogue() },
  ]);
}
function joinFaction(npc) {
  const f = npc.faction, rep = S.factions[f];
  const needed = f === 'undead' ? 15 : 10;
  if (rep < needed)
    return UI.dialogue(npc, `„${FACTIONS[f].name} nimmt keine Unbekannten. Zeig, wofür du stehst.“ (Ansehen ${Math.round(rep)}/${needed})`,
      [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]);
  UI.dialogue(npc, `„Dann tritt ein. Du bist ${FACTIONS[f].ranks[0]}. Alles andere musst du verdienen.“`, [
    { text: 'Ich trete bei.', fn: () => {
      S.ranks[f] = 0;
      if (f === 'undead') { S.factions.order -= 30; S.factions.valen -= 20; log('Der Orden erklärt dich zum Feind.', 'faction'); }
      if (f === 'order') S.factions.undead -= 20;
      chronicle(`Beitritt: ${FACTIONS[f].name}`, 'faction', `Als ${FACTIONS[f].ranks[0]} aufgenommen.`);
      log(`Du bist nun ${FACTIONS[f].ranks[0]} — ${FACTIONS[f].name}.`, 'faction');
      UI.closeDialogue(); UI.refreshHUD(); save();
    } },
    { text: 'Noch nicht.', fn: () => UI.closeDialogue() },
  ]);
}
function checkRankUp() {
  for (const f of ['valen', 'order', 'undead']) {
    if (S.ranks[f] < 0) continue;
    const need = (S.ranks[f] + 1) * 25;
    if (S.factions[f] >= need && S.ranks[f] < FACTIONS[f].ranks.length - 1) {
      S.ranks[f]++;
      const r = FACTIONS[f].ranks[S.ranks[f]];
      log(`Beförderung: ${r} — ${FACTIONS[f].name}.`, 'faction');
      chronicle(`Rang ${r}`, 'faction', FACTIONS[f].name);
      UI.toast(`${r.toUpperCase()}`, 3600);
    }
  }
}

// ================= Gruppe =================
function recruit(npc) {
  const p = S.player, rel = S.relations[npc.key] ?? 0;
  if (S.party.length >= p.partyCap) return UI.dialogue(npc, '„Deine Gruppe ist groß genug. Zu viele Münder.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]);
  if (rel < npc.recruitRel)
    return UI.dialogue(npc, `„Ich kenne dich kaum. Zeig mir erst, wer du bist.“ (Beziehung ${Math.round(rel)}/${npc.recruitRel})`,
      [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]);
  UI.dialogue(npc, '„Gut. Aber ich erwarte Anteil, Essen und ein Grab, wenn es soweit ist.“', [
    { text: 'Einverstanden.', fn: () => {
      S.party.push(npc.id);
      npc.morale = 65 + rel * 0.2;
      remember(npc, 'recruited', p.name);
      log(`${npc.name} schließt sich dir an.`, 'party');
      chronicle(`${npc.name} tritt der Gruppe bei`, 'party', `${npc.prof}, ${npc.age} Jahre.`);
      UI.closeDialogue(); UI.refreshHUD(); save();
    } },
    { text: 'Doch nicht.', fn: () => UI.closeDialogue() },
  ]);
}
function dismiss(npc) {
  if (!npc) return;
  S.party = S.party.filter(id => id !== npc.id);
  addRel(npc.key, -5);
  log(`${npc.name} verlässt die Gruppe.`, 'party');
  UI.refreshHUD();
}
function giveGear(m) {
  const p = S.player;
  const best = p.inv.map((s, i) => ({ s, i })).filter(({ s }) => ITEMS[s.key].slot === 'weapon' || ITEMS[s.key].armor)
    .sort((a, b) => (ITEMS[b.s.key].dmg || ITEMS[b.s.key].armor || 0) - (ITEMS[a.s.key].dmg || ITEMS[a.s.key].armor || 0))[0];
  if (!best) return UI.toast('Nichts zu geben.');
  const it = ITEMS[best.s.key];
  const prev = m.equip[it.slot];
  m.equip[it.slot] = best.s; p.inv.splice(best.i, 1);
  if (prev) p.inv.push(prev);
  remember(m, 'gave_weapon', p.name); addRel(m.key, 6);
  log(`${m.name} erhält ${it.name}.`, 'party');
  UI.refreshHUD();
}
function partyCommand(cmd) {
  S.partyCmd = cmd;
  log(`Befehl: ${({ follow:'Folgen', attack:'Angreifen', hold:'Stellung halten', retreat:'Zurückziehen', protect:'Anführer schützen' })[cmd]}`, 'party');
}

// ================= Handel =================
function price(key, isBuy, npc) {
  if (ITEMS[key].good && npc) {
    const p = SIM.townPrice(npc.town || 'eren', key, isBuy), t = (S.player.skills.trading || 0) / 100;
    return Math.max(1, Math.round(isBuy ? p * (1 - t * 0.2) : p * (1 + t * 0.2)));
  }
  const v = ITEMS[key].value * (S.prices || 1);
  const t = (S.player.skills.trading || 0) / 100;
  return Math.max(1, Math.round(isBuy ? v * (1.35 - t * 0.3) : v * (0.45 + t * 0.25)));
}
function shopStock(npc) {
  if (!npc._stockDay || npc._stockDay !== S.day) {
    npc._stockDay = S.day;
    const pool = ['bread', 'dried_meat', 'herb', 'potion', 'bandage', 'rusty_sword', 'longsword', 'axe', 'spear', 'shortbow',
      'wooden_shield', 'leather_jerkin', 'leather_cap', 'chain_hauberk', 'pickaxe', 'traveler_cloak'];
    npc._stock = [];
    for (let i = 0; i < 7; i++) { const k = pick(pool); npc._stock.push({ key: k, count: ITEMS[k].stack ? ri(1, 4) : 1 }); }
  }
  const town = S.towns[npc.town || 'eren'];
  SIM.notePrices(npc.town || 'eren');
  const goods = ['grain', 'salt', 'cloth', 'pelt'].filter(g => town.stock[g] >= 1).map(g => ({ key: g, count: Math.floor(town.stock[g]) }));
  return [...goods, ...npc._stock];
}
function buy(npc, key) {
  const c = price(key, true, npc);
  if (S.gold < c) return UI.toast('Zu wenig Gold');
  if (ITEMS[key].good) {                                   // Waren gehen ins Gepäck, der Markt wird leerer
    const town = S.towns[npc.town || 'eren'];
    if (town.stock[key] < 1 || !addItem(S.player, key, 1)) return;
    town.stock[key] -= 1; S.gold -= c;
    log(`Gekauft: ${ITEMS[key].name} für ${c} Gold.`, 'economy');
    return;
  }
  if (!addItem(S.player, key, 1)) return;
  S.gold -= c;
  const s = npc._stock.find(x => x.key === key);
  if (s) { s.count--; if (s.count <= 0) npc._stock.splice(npc._stock.indexOf(s), 1); }
  S.player.skills.trading = Math.min(100, (S.player.skills.trading || 0) + 0.3);
  log(`Gekauft: ${ITEMS[key].name} für ${c} Gold.`, 'economy');
  onItemGained(key);
}
function sell(idx, npc) {
  const slot = S.player.inv[idx]; if (!slot) return;
  const c = price(slot.key, false, npc);
  S.gold += c; removeItem(S.player, slot.key, 1);
  if (ITEMS[slot.key].good && npc) S.towns[npc.town || 'eren'].stock[slot.key] += 1;
  S.player.skills.trading = Math.min(100, (S.player.skills.trading || 0) + 0.3);
  log(`Verkauft: ${ITEMS[slot.key].name} für ${c} Gold.`, 'economy');
}
function repairAll(npc) {
  const p = S.player;
  const items = [...Object.values(p.equip).filter(Boolean), ...p.inv].filter(i => i.cond != null && i.cond < 1);
  if (!items.length) return UI.dialogue(npc, '„Nichts davon braucht mich.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]);
  const cost = Math.max(5, Math.round(items.reduce((n, i) => n + (1 - i.cond) * ITEMS[i.key].value * 0.5, 0)));
  UI.dialogue(npc, `„${items.length} Stücke. ${cost} Gold, dann taugen sie wieder.“`, [
    { text: `Bezahlen (${cost} Gold)`, fn: () => {
      if (S.gold < cost) return UI.toast('Zu wenig Gold');
      S.gold -= cost; items.forEach(i => i.cond = 1);
      addRel(npc.key, 3);
      log('Ausrüstung instand gesetzt.', 'economy');
      UI.closeDialogue(); UI.refreshHUD();
    } },
    { text: 'Zu teuer.', fn: () => UI.closeDialogue() },
  ]);
}

// ================= Fähigkeiten =================
function useAbility(key) {
  const p = S.player, ab = ABILITIES[key];
  if (!ab || !p.abilities.includes(key)) return;
  if ((p.cooldowns[key] || 0) > 0) return UI.toast(`${ab.name} noch nicht bereit`);
  if (ab.mana && p.mana < ab.mana) return UI.toast('Zu wenig Mana');
  if (ab.stam && p.stamina < ab.stam) return UI.toast('Zu erschöpft');
  p.cooldowns[key] = ab.cd;
  if (ab.mana) p.mana -= ab.mana;
  if (ab.stam) p.stamina -= ab.stam;
  const foes = hostilesOf(p).sort((a, b) => dist(p, a) - dist(p, b));
  switch (key) {
    case 'power_strike': p.abilityMult = 2.1; p.atkCd = 0; attack(p); break;
    case 'holy_strike': p.abilityMult = 1.7; p.abilityKind = 'holy'; p.atkCd = 0; attack(p); fx(p.x, p.y - 14, 'heal', 10); break;
    case 'backstab': p.abilityMult = 3; p.atkCd = 0; attack(p); break;
    case 'aimed_shot': {
      const w = p.equip.weapon;
      if (!w || !ITEMS[w.key].ranged) { UI.toast('Dafür brauchst du einen Bogen'); p.cooldowns[key] = 0; return; }
      S.projectiles.push({ id: uid(), kind:'arrow', map: p.map, x: p.x + Math.cos(p.aim) * 14, y: p.y - 12 + Math.sin(p.aim) * 8,
        vx: Math.cos(p.aim) * 9, vy: Math.sin(p.aim) * 9, owner: p.id, dmg: damageOf(p) * 2.2, life: 1800, team:'player' });
      break; }
    case 'fireball': case 'shadow_bolt': {
      const kind = key === 'fireball' ? 'fire' : 'shadow';
      S.projectiles.push({ id: uid(), kind, map: p.map, x: p.x + Math.cos(p.aim) * 14, y: p.y - 12 + Math.sin(p.aim) * 8,
        vx: Math.cos(p.aim) * 5.4, vy: Math.sin(p.aim) * 5.4, owner: p.id,
        dmg: 14 + p.attributes.intelligence * 1.3, life: 1600, team:'player', splash: key === 'fireball' ? 46 : 0 });
      break; }
    case 'life_drain': {
      const f = foes[0];
      if (!f || dist(p, f) > 180) { UI.toast('Kein Ziel in Reichweite'); p.cooldowns[key] = 0; return; }
      const d = 12 + p.attributes.intelligence * 1.1;
      hurt(f, d, p, 'Lebensentzug');
      B.heal(p, d * 0.6);
      fx(f.x, f.y - 12, 'necro', 12); fx(p.x, p.y - 14, 'necro', 6);
      float(p, '+' + Math.round(d * 0.6), 'rgba(78,143,122,ALPHA)');
      break; }
    case 'holy_heal': {
      const t = [p, ...partyMembers()].filter(a => a.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      const amt = 26 + p.attributes.intelligence * 1.6;
      B.heal(t, amt);
      fx(t.x, t.y - 14, 'heal', 16); float(t, '+' + Math.round(amt), 'rgba(120,170,90,ALPHA)');
      break; }
    case 'blessing': {
      for (const a of [p, ...partyMembers()]) { (a.status ||= []).push({ key:'blessing', name:'Gesegnet', good:true, left: 20000 }); fx(a.x, a.y - 14, 'heal', 10); }
      log('Segen liegt auf der Gruppe.', 'party');
      break; }
    case 'mark_target': {
      const f = foes[0];
      if (!f) { p.cooldowns[key] = 0; return UI.toast('Kein Ziel'); }
      f.marked = true; setTimeout(() => { f.marked = false; }, 15000);
      S.fx.push({ x: f.x, y: f.y - 20, vx:0, vy:0, type:'ring', s:2, life:600, maxLife:600 });
      break; }
  }
  UI.refreshHUD();
}
function syncHotbar() {
  const p = S.player;
  p.hotbar = p.abilities.map(k => ({ type:'ability', key: k }));
  for (const k of ['bandage', 'potion', 'herb', 'bread']) if (p.hotbar.length < 8) p.hotbar.push({ type:'item', key: k });
  UI.renderHotbar();
}
function useSlot(i) {
  const s = S.player.hotbar[i]; if (!s) return;
  if (s.type === 'ability') return useAbility(s.key);
  const idx = S.player.inv.findIndex(x => x.key === s.key);
  if (idx < 0) return UI.toast('Nicht im Gepäck');
  useConsumable(S.player, idx);
}

// ================= Tod & Erbe =================
function playerDeath(cause, source) {
  const p = S.player;
  const loc = S.map === 'mine' ? 'Verlassene Grube' : (locAt(p.x / TS | 0, p.y / TS | 0)?.name || 'Greenmark-Grenzland');
  const rec = { name: p.name, age: p.age, days: S.day - (p.bornDay || 1), kills: p.kills || 0, battles: S.battles,
    settlements: S.settlement ? 1 : 0, family: S.party.length ? partyMembers().map(m => m.name).join(', ') : '—',
    cause, location: loc, year: year(), titles: (p.titles || []).join(', ') };
  S.legacy.ancestors.push(rec);
  chronicle(`${p.name} fiel bei ${loc}`, 'death', `${cause}. Was er baute, steht noch.`);
  S.paused = true;
  UI.showDeath(rec, () => { UI.hideDeath(); chooseSuccessor(); });
  save();
}

function makeSuccessorCandidates() {
  const out = [];
  for (const m of partyMembers()) { m.relation = 'Gefährte'; out.push(m); }
  // Verwandter taucht auf
  const kinTypes = [['Sohn', 17, 'son'], ['Tochter', 19, 'daughter'], ['Vetter', 27, 'cousin'], ['Schwester', 31, 'sister']];
  while (out.length < 3) {
    const [rel, age] = pick(kinTypes);
    const names = ['Tomas', 'Elric', 'Sigrun', 'Halla', 'Ivar', 'Brenna', 'Kord', 'Rana'];
    const c = makeChar({ name: `${pick(names)} ${S.legacy.gen > 1 ? 'II' : ''}`.trim(), age: age + ri(-2, 6),
      x: S.player.x, y: S.player.y, level: Math.max(1, Math.floor(S.player.level * 0.4)),
      attrs: { strength: ri(7, 13), agility: ri(7, 13), endurance: ri(7, 12), intelligence: ri(6, 12), perception: ri(7, 12), willpower: ri(6, 12) },
      skills: { onehanded: ri(2, 10), archery: ri(2, 10), survival: ri(3, 9) },
      traits: [pick(['mutig', 'ehrgeizig', 'loyal', 'misstrauisch', 'gütig'])],
      cls: pick(['wanderer', 'warrior', 'archer']), pal: { ...S.player.pal, cloth: pick(CLOTH) } });
    c.relation = rel + ' von ' + S.player.name;
    out.push(c);
  }
  return out.slice(0, 3);
}
function chooseSuccessor() {
  const cands = makeSuccessorCandidates();
  UI.showSuccessors(cands, c => adoptSuccessor(c));
}
function adoptSuccessor(c) {
  const old = S.player;
  S.party = S.party.filter(id => id !== c.id);
  c.kind = 'player'; c.key = 'player'; c.bornDay = S.day;
  c.invCap = 24; c.attrPoints = 0; c.hotbar = [];
  c.knownClasses = [...new Set([c.currentClass, ...(c.knownClasses || [])])];
  c.abilities = [...(CLASSES[c.currentClass].abilities || [])];
  // Erbe: Gold, Lager, halber Ruf, Siedlung. Persönliche Waffen bleiben am Grab.
  S.gold = Math.floor(S.gold * 0.7);
  for (const f of Object.keys(S.factions)) S.factions[f] = Math.round(S.factions[f] * 0.5);
  S.legacy.gen++;
  recalc(c); B.fullHeal(c); c.mana = c.maxMana;
  if (!S.ents[S.map].includes(c)) S.ents[S.map].push(c);
  c.map = S.map;
  S.player = c;
  syncHotbar();
  chronicle(`${c.name} übernimmt Haus ${S.legacy.house}`, 'legacy',
    `Generation ${S.legacy.gen}. ${old.name} liegt in ${S.map === 'mine' ? 'der Grube' : 'der Erde von Greenmark'}.`);
  log(`${c.name} führt Haus ${S.legacy.house} weiter. Generation ${S.legacy.gen}.`, 'death');
  S.paused = false;
  UI.toast(`GENERATION ${S.legacy.gen} — ${c.name}`, 5000);
  UI.refreshHUD();
  save();
}

// ================= Karten für die UI =================
function drawWorldmap(cv) {
  const c = cv.getContext('2d'), w = cv.width, h = cv.height;
  const m = MAPS.world, sc = Math.min(w / m.w, h / m.h);
  const ox = (w - m.w * sc) / 2, oy = (h - m.h * sc) / 2;
  c.fillStyle = '#0b0a08'; c.fillRect(0, 0, w, h);
  const col = { 0:'#313b25', 1:'#403528', 2:'#5a4d3a', 3:'#22384a', 4:'#2f3622', 5:'#42403a', 6:'#4a3a28', 7:'#35322e', 8:'#3b372f', 9:'#544d3a', 12:'#332f2b', 13:'#4b4026' };
  for (let y = 0; y < m.h; y += 1) for (let x = 0; x < m.w; x += 1) {
    c.fillStyle = col[m.tiles[y * m.w + x]] || '#313b25';
    c.fillRect(ox + x * sc, oy + y * sc, Math.ceil(sc), Math.ceil(sc));
  }
  // Nebel des Krieges
  c.fillStyle = 'rgba(8,7,6,.82)';
  for (const l of LOCATIONS) if (!(S.flags.seen || {})[l.key]) c.fillRect(ox + (l.x - l.r) * sc, oy + (l.y - l.r) * sc, l.r * 2 * sc, l.r * 2 * sc);
  c.font = '11px Spectral, serif'; c.textAlign = 'center';
  for (const l of LOCATIONS) {
    const seen = (S.flags.seen || {})[l.key];
    const x = ox + l.x * sc, y = oy + l.y * sc;
    c.fillStyle = seen ? '#bd9433' : '#4e463a';
    if (l.kind === 'village' || l.kind === 'city') { c.fillRect(x - 4, y - 4, 8, 8); c.fillRect(x - 6, y - 1, 12, 2); }
    else if (l.kind === 'dungeon') { c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); c.fillStyle = '#0b0a08'; c.fillRect(x - 2, y - 1, 4, 3); }
    else if (l.kind === 'ruin') { c.fillRect(x - 5, y - 2, 3, 7); c.fillRect(x + 1, y - 5, 3, 10); }
    else { c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 4, y + 4); c.lineTo(x - 4, y + 4); c.fill(); }
    c.fillStyle = seen ? '#cfc3a8' : '#5a5348';
    c.fillText(seen ? l.name : '?', x, y + 16);
  }
  const G = SIM.warGraph();
  for (const [k, n] of Object.entries(G.nodes)) {
    if (!n.owner) continue;
    const l = G.loc[k], x = ox + l.x * sc, y = oy + l.y * sc;
    c.strokeStyle = n.owner === 'undead' ? 'rgba(78,143,122,.8)' : 'rgba(111,139,184,.7)'; c.lineWidth = 2;
    c.beginPath(); c.arc(x, y, l.r * sc * 0.7, 0, 7); c.stroke();
  }
  for (const a of G.armies) {
    if (!(S.flags.seen || {})[a.at] && S.factions.valen < 10) continue;          // Truppenstärke nur, wenn bekannt
    const l = G.loc[a.at], x = ox + l.x * sc + 10, y = oy + l.y * sc - 6;
    c.fillStyle = '#2b2419'; c.fillRect(x - 1, y - 16, 2, 18);
    c.fillStyle = a.faction === 'undead' ? '#4e8f7a' : '#6f8bb8'; c.fillRect(x + 1, y - 16, 14, 9);
    c.fillStyle = '#e7dcc2'; c.fillText(Math.round(a.strength), x + 8, y - 20);
  }
  for (const k of S.ents.world.filter(e => e.kind === 'caravan')) {
    c.fillStyle = '#bd9433'; c.fillRect(ox + k.x / TS * sc - 3, oy + k.y / TS * sc - 3, 6, 6);
  }
  if (S.settlement) {
    const x = ox + S.settlement.x / TS * sc, y = oy + S.settlement.y / TS * sc;
    c.fillStyle = '#a4402c'; c.fillRect(x - 2, y - 12, 2, 12); c.fillRect(x, y - 12, 10, 7);
    c.fillStyle = '#cfc3a8'; c.fillText(S.settlement.name, x, y + 14);
  }
  const px = ox + S.player.x / TS * sc, py = oy + S.player.y / TS * sc;
  c.fillStyle = '#e7dcc2'; c.beginPath(); c.arc(px, py, 4, 0, 7); c.fill();
  c.strokeStyle = 'rgba(231,220,194,.5)'; c.beginPath(); c.arc(px, py, 8, 0, 7); c.stroke();
  c.textAlign = 'left';
}
function drawWarmap(cv) {
  const c = cv.getContext('2d'), w = cv.width, h = cv.height, G = SIM.warGraph();
  c.fillStyle = '#12100d'; c.fillRect(0, 0, w, h);
  const xs = Object.keys(G.nodes).map(k => G.loc[k]);
  const minX = Math.min(...xs.map(l => l.x)), maxX = Math.max(...xs.map(l => l.x)), minY = Math.min(...xs.map(l => l.y)), maxY = Math.max(...xs.map(l => l.y));
  const P = k => [16 + (G.loc[k].x - minX) / (maxX - minX) * (w - 32), 16 + (G.loc[k].y - minY) / (maxY - minY) * (h - 40)];
  c.strokeStyle = '#3b3227'; c.lineWidth = 2;
  for (const [a, b] of G.edges) { const [x1, y1] = P(a), [x2, y2] = P(b); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  const col = { undead:'#4e8f7a', valen:'#6f8bb8' };
  c.font = '9px Spectral, serif'; c.textAlign = 'center';
  for (const [k, n] of Object.entries(G.nodes)) {
    const [x, y] = P(k);
    c.fillStyle = col[n.owner] || '#5a5348'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill();
    c.fillStyle = '#a79b83'; c.fillText(G.loc[k].name, x, y + 16);
  }
  for (const a of G.armies) {
    const [x, y] = P(a.at);
    c.fillStyle = a.faction === 'undead' ? '#4e8f7a' : '#b9c3d2';
    c.fillRect(x + 7, y - 16, 2, 14); c.fillRect(x + 9, y - 16, 10, 7);
    c.fillStyle = '#e7dcc2'; c.fillText(Math.round(a.strength), x + 14, y - 19);
  }
  c.textAlign = 'left';
}
function warStatus() { return SIM.warSummary(); }
function facRelation(a, b) {
  const hostile = { valen:{ undead:-92, bandit:-60, order:67, merch:30 }, order:{ undead:-95, bandit:-40, valen:67, merch:20 },
    undead:{ valen:-92, order:-95, merch:-40, bandit:-10 }, merch:{ bandit:-30, valen:30, order:20, undead:-40 },
    bandit:{ valen:-60, order:-40, merch:-30, undead:-10 } };
  const v = (hostile[a] || {})[b] ?? 0;
  return (v > 0 ? '+' : '') + v;
}

// ================= Eingabe =================
function bindInput() {
  const cv = $('game-canvas');
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (e.ctrlKey && e.shiftKey && k === 'd') { e.preventDefault(); toggleDebug(); return; }
    if ($('game').classList.contains('hidden')) return;
    if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) return;
    keys.add(k);
    if (k === 'escape') { if (placing) cancelPlacing(); else if (UI.dialogueOpen()) UI.closeDialogue(); else if (UI.modalOpen) UI.closeModal(); else UI.openModal('settings'); }
    if (UI.dialogueOpen() || UI.modalOpen) return;
    if (k === 'e') doInteract();
    if (k === 'i') UI.openModal('inventory');
    if (k === 'c') UI.openModal('character');
    if (k === 'g') UI.openModal('party');
    if (k === 'b') UI.openModal('settlement');
    if (k === 'f') UI.openModal('faction');
    if (k === 'k') UI.openModal('chronicle');
    if (k === 'm') UI.openModal('map');
    if (k === 'j') UI.openModal('quests');
    if (k === 'q') dodge();
    if (k >= '1' && k <= '8') useSlot(+k - 1);
    if (k === ' ') e.preventDefault();
  });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  cv.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    const wp = R.screenToWorld(mouse.x, mouse.y);
    mouse.wx = wp.x; mouse.wy = wp.y;
    hovered = S.ents[S.map].find(en => (en.kind === 'enemy' || en.kind === 'npc' || en.kind === 'caravan') && en.alive && en !== S.player &&
      Math.hypot(en.x - wp.x, en.y - (wp.y - 14)) < (en.r || 12) + 8) || null;
  });
  cv.addEventListener('mousedown', e => {
    if (e.button === 0) {
      if (placing) return tryPlace();
      mouse.down = true;
    } else if (e.button === 2) {
      selected = hovered || null;
      if (placing) cancelPlacing();
      UI.renderContext(selected);
    }
  });
  window.addEventListener('mouseup', () => mouse.down = false);
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    R.cam.zoom = clamp(R.cam.zoom * (e.deltaY > 0 ? 0.9 : 1.1), 0.7, 2.4);
  }, { passive: false });
  window.addEventListener('beforeunload', () => { if (running) save(); });
}
function moveInput() {
  let dx = 0, dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy--;
  if (keys.has('s') || keys.has('arrowdown')) dy++;
  if (keys.has('a') || keys.has('arrowleft')) dx--;
  if (keys.has('d') || keys.has('arrowright')) dx++;
  return { dx, dy };
}
// Ausweichen: 8 Richtungen aus WASD, ohne Richtung nach hinten (weg von der Maus).
// i-Frames = Dauer der Rolle. Abklingzeit + Ausdauer verhindern Dauerrollen.
const DODGE = { dur: 240, dist: 92, cd: 850, stam: 20 };
function dodge() {
  const p = S.player;
  if (p.downed || p.dodge || p.channel) return false;
  if (p.dodgeCd > 0) return false;
  if (p.stamina < DODGE.stam) { UI.toast('Zu erschöpft zum Ausweichen'); return false; }
  if (B.speedFactor(p) < 0.5) { UI.toast('Mit diesen Beinen rollst du nicht.'); return false; }
  const { dx, dy } = moveInput();
  const l = Math.hypot(dx, dy);
  const ax = l ? dx / l : -Math.cos(p.aim), ay = l ? dy / l : -Math.sin(p.aim);
  p.stamina -= DODGE.stam; p.dodgeCd = DODGE.cd + DODGE.dur;
  p.dodge = { t: 0, ax, ay }; p.invuln = true; p.swing = 0;
  fx(p.x, p.y + 4, 'dust', 6);
  return true;
}
function startPlacing(type) {
  const def = BUILDINGS[type];
  if (!canAfford(def.cost)) return UI.toast('Zu wenig Material');
  placing = { type, def, ghost: { id:'ghost', kind:'building', type, def, map: S.map, x: S.player.x, y: S.player.y, built: 0, ghost: true, cond: 1, transient: true } };
  S.ents[S.map].push(placing.ghost);
  UI.toast(`${def.name} platzieren — Linksklick`);
}
function cancelPlacing() {
  if (!placing) return;
  const a = S.ents[S.map]; const gi = a.indexOf(placing.ghost); if (gi >= 0) a.splice(gi, 1);
  placing = null; UI.setPrompt('');
}
function tryPlace() {
  const g = placing.ghost;
  if (!canPlace(g)) return UI.toast('Kein Platz');
  if (dist(g, S.player) > 400) return UI.toast('Zu weit weg');
  const type = placing.type, x = g.x, y = g.y;
  cancelPlacing();
  if (!S.settlement) { foundCamp(x, y); if (!S.settlement) return; }
  placeBuilding(type, x, y);
  UI.refreshHUD();
}

// ================= Debug =================
function toggleDebug() {
  let d = $('debugpanel');
  if (d) { d.remove(); return; }
  d = document.createElement('div');
  d.id = 'debugpanel'; d.className = 'panel';
  const acts = {
    '+500 Gold': () => S.gold += 500,
    '+Material': () => { S.res.wood += 100; S.res.stone += 100; S.res.iron += 50; S.res.food += 20; },
    'Heilen': () => { B.fullHeal(S.player); S.player.stamina = S.player.maxStamina; S.player.mana = S.player.maxMana; S.player.downed = false; },
    'Stufe +1': () => levelUp(S.player),
    'Wolf spawnen': () => spawnEnemy('wolf', S.map, S.player.x / TS + 3 | 0, S.player.y / TS | 0),
    'Untoten spawnen': () => spawnEnemy('skeleton', S.map, S.player.x / TS + 3 | 0, S.player.y / TS | 0),
    'Gute Waffe': () => addItem(S.player, 'greatsword'),
    'Zeit +6h': () => S.minute = (S.minute + 360) % 1440,
    'Wetter wechseln': () => S.weather = pick(['clear', 'rain', 'fog', 'cloudy']),
    'Paladin freischalten': () => unlockClass('paladin'),
    'Ruf +25 (alle)': () => { for (const f of Object.keys(S.factions)) S.factions[f] += 25; checkRankUp(); },
    'Zur Grube': () => travel('mine'),
    'Spieler töten': () => { S.player.body.torso.hp = 0; B.syncHp(S.player); downed(S.player, 'Debug'); S.player.downTimer = 1; },
    'Linken Arm brechen': () => { const r = B.damagePart(S.player, 'larm', 999); if (r === 'disabled' || r === 'down') limbLost(S.player, 'larm'); },
    '+3 Verbände': () => addItem(S.player, 'bandage', 3),
    'Selbsttest': () => selftest(),
  };
  d.innerHTML = '<div class="panel-title">DEBUG</div>';
  for (const [label, fn] of Object.entries(acts)) {
    const b = document.createElement('button'); b.textContent = label;
    b.onclick = () => { fn(); UI.refreshHUD(); };
    d.appendChild(b);
  }
  document.body.appendChild(d);
}

// ================= Selbsttest (ponytail: eine laufbare Prüfung) =================
export function selftest() {
  const out = [];
  const ok = (name, cond) => { out.push((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) console.error('FAIL', name); };
  const c = makeChar({ name:'Test', attrs:{ strength:10, endurance:10 }, build:'ausgewogen' });
  ok('Körperteile aus Basis-HP', c.body.torso.max === Math.round(86 * 0.45) && c.maxHp === B.PARTS.reduce((n, k) => n + c.body[k].max, 0));
  ok('Kopf 0 = Enthauptung', B.damagePart(makeChar({ build:'ausgewogen' }), 'head', 999, true) === 'decap');
  ok('Kopftreffer ohne Krit gedeckelt', (() => { const t = makeChar({ build:'ausgewogen' }); return B.damagePart(t, 'head', 999, false) === 'hit' && t.body.head.hp > 0; })());
  ok('Bein 0 = lahm', (() => { const t = makeChar({ build:'ausgewogen' }); B.damagePart(t, 'lleg', 999); return B.speedFactor(t) < 0.6; })());
  ok('Rumpf 0 = am Boden', (() => { const t = makeChar({ build:'ausgewogen' }); return B.damagePart(t, 'torso', 999) === 'down' && B.vital(t) <= 0; })());
  ok('Verband heilt nur ein Teil', (() => { const t = makeChar({ build:'ausgewogen' }); B.damagePart(t, 'larm', 10); B.damagePart(t, 'rarm', 10);
    B.healPart(t, 'larm', 10); return t.body.larm.hp === t.body.larm.max && t.body.rarm.hp < t.body.rarm.max; })());
  ok('4 Körperbauten neben Ausgewogen', Object.keys(B.BUILDS).length === 5);
  c.equip.weapon = { key:'longsword', cond:1 };
  const d1 = damageOf(c);
  c.equip.weapon.cond = 0.2;
  ok('Zustand senkt Schaden', damageOf(c) < d1);
  ok('Rüstung zählt', (c.equip.chest = { key:'plate_cuirass', cond:1 }, armorOf(c) === 15));
  addItem(c, 'bread', 2); addItem(c, 'bread', 1);
  ok('Stapeln', c.inv.filter(i => i.key === 'bread').reduce((n, i) => n + i.count, 0) === 3);
  removeItem(c, 'bread', 2);
  ok('Entnehmen', hasItem(c, 'bread', 1) && !hasItem(c, 'bread', 2));
  ok('Materialien gehen in den Vorrat', (S.res.wood = 0, addItem(c, 'wood', 5), S.res.wood === 5));
  ok('Klassenkette Paladin', (() => { let k = 'paladin', n = 0; while (k) { k = CLASSES[k].parent; n++; } return n === 4; })());
  const before = { gold: S.gold, val: S.factions.valen };
  S.gold = 100; S.factions.valen = 40;
  S.gold = Math.floor(S.gold * 0.7); S.factions.valen = Math.round(S.factions.valen * 0.5);
  ok('Erbe: 70% Gold, 50% Ruf', S.gold === 70 && S.factions.valen === 20);
  S.gold = before.gold; S.factions.valen = before.val;
  ok('Kachel-Kollision', typeof tileAt('world', 0, 0) === 'number');
  ok('Alle Questgeber existieren', Object.values(QUESTS).every(q => NPCS.some(n => n.key === q.giver)));
  ok('Alle Startgegenstände definiert', Object.values(ORIGINS).every(o => o.gear.every(g => !!ITEMS[g])));
  ok('Alle Klassenfähigkeiten definiert', Object.values(CLASSES).every(cl => (cl.abilities || []).every(a => !!ABILITIES[a])));
  ok('Lootlisten gültig', Object.values(LOOT).flat().every(([k]) => !!ITEMS[k]));
  console.log('%cROTFALL Selbsttest', 'color:#bd9433', '\n' + out.join('\n'));
  UI.toast(out.every(l => l.startsWith('PASS')) ? `Selbsttest: ${out.length}/${out.length} bestanden` : 'Selbsttest: Fehler — siehe Konsole', 5000);
  return out;
}

// ================= Start =================
function buildCreation() {
  const pal = { skin: SKIN[0], hair: HAIR[0], cloth: CLOTH[0] };
  let origin = 'wanderer', build = 'ausgewogen';
  const bb = $('cr-builds'); bb.innerHTML = '';
  const pct = v => (v >= 1 ? '+' : '') + Math.round((v - 1) * 100) + ' %';
  const renderBuild = () => {
    const b = B.BUILDS[build];
    const parts = Object.entries(b.parts).map(([k, v]) => `${B.PART_NAME[k]} ${pct(v)}`);
    $('cr-build-desc').innerHTML = `${b.desc}<br><b>Tempo ${pct(b.speed)}</b> · Kopftreffer ${pct(b.headHit)}` +
      (b.stamina ? ` · Ausdauer ${b.stamina > 0 ? '+' : ''}${b.stamina}` : '') + (parts.length ? `<br>${parts.join(' · ')}` : '');
    drawPreview();
  };
  for (const [k, b] of Object.entries(B.BUILDS)) {
    const btn = el2('button', k === build ? 'sel' : '', b.name);
    btn.onclick = () => { build = k; [...bb.children].forEach(x => x.classList.remove('sel')); btn.classList.add('sel'); renderBuild(); };
    bb.appendChild(btn);
  }
  const ap = document.querySelector('.cr-appearance');
  const row = (label, arr, key) => {
    ap.appendChild(el2('label', '', label));
    const r = el2('div', 'swatchrow');
    arr.forEach((col, i) => {
      const s = el2('div', 'swatch' + (i === 0 ? ' sel' : '')); s.style.background = col;
      s.onclick = () => { pal[key] = col; [...r.children].forEach(x => x.classList.remove('sel')); s.classList.add('sel'); drawPreview(); };
      r.appendChild(s);
    });
    ap.appendChild(r);
  };
  ap.innerHTML = '';
  row('Haut', SKIN, 'skin'); row('Haar', HAIR, 'hair'); row('Kleidung', CLOTH, 'cloth');
  const ob = $('cr-origins'); ob.innerHTML = '';
  for (const [k, o] of Object.entries(ORIGINS)) {
    const b = el2('button', 'origin' + (k === origin ? ' sel' : ''), `${o.name}<small>${Object.keys(o.skills).slice(0, 2).join(', ')}</small>`);
    b.onclick = () => { origin = k; [...ob.children].forEach(x => x.classList.remove('sel')); b.classList.add('sel'); renderOrigin(); };
    ob.appendChild(b);
  }
  function renderOrigin() {
    const o = ORIGINS[origin];
    $('cr-origin-desc').textContent = o.desc;
    const base = baseAttrs();
    $('cr-attrs').innerHTML = Object.entries({ strength:'Stärke', agility:'Beweglichkeit', endurance:'Ausdauer',
      intelligence:'Intelligenz', perception:'Wahrnehmung', willpower:'Willenskraft' })
      .map(([k, n]) => `<div class="attr-row"><span>${n}</span><b>${base[k] + (o.attrs[k] || 0)}${o.attrs[k] ? ` <span style="color:#89a05a">+${o.attrs[k]}</span>` : ''}</b></div>`).join('');
    $('cr-start-gear').innerHTML = `<b>Ausrüstung</b><br>${o.gear.map(g => ITEMS[g].name).join('<br>')}<br><br><b>Gold</b> ${o.gold}`;
    drawPreview();
  }
  function drawPreview() {
    const cv = $('cr-preview'), c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#14110d'; c.fillRect(0, 0, cv.width, cv.height);
    const g = c.createRadialGradient(80, 100, 4, 80, 140, 140);
    g.addColorStop(0, 'rgba(120,95,60,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
    c.save(); c.translate(80, 200); c.scale(3.4, 3.4);
    R.drawHumanoid({ x:0, y:0, pal, facing:0, seed:1, build, equip:{ weapon:{ key: ORIGINS[origin].gear.find(k => ITEMS[k].slot === 'weapon') || 'rusty_sword' } }, aim:0.5 }, performance.now(), c);
    c.restore();
  }
  renderOrigin(); renderBuild();
  setInterval(() => { if (!$('creation').classList.contains('hidden')) drawPreview(); }, 200);
  $('cr-begin').onclick = () => {
    const name = ($('cr-name').value || 'Namenlos').slice(0, 18);
    const house = ($('cr-house').value || name).slice(0, 18);
    bindInput();
    newGame({ name, house, origin, pal, build });
  };
  $('cr-back').onclick = () => { $('creation').classList.add('hidden'); $('titlescreen').classList.remove('hidden'); };
}
function el2(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

function titleLoop(t) {
  if ($('titlescreen').classList.contains('hidden')) return;
  R.drawTitleScene($('titlecanvas'), t);
  requestAnimationFrame(titleLoop);
}

function boot() {
  UI.initUI();
  UI.bind({
    select: e => { selected = e; UI.renderContext(e); },
    talk, recruit, dismiss, giveGear, partyCommand, repairAll,
    useOrEquip: i => equip(S.player, i),
    unequip: k => unequip(S.player, k),
    dropItem: i => { const s = S.player.inv[i]; if (!s) return; dropItemAt(S.map, S.player.x + 16, S.player.y + 8, s); S.player.inv.splice(i, 1); },
    toStash: i => { const s = S.player.inv[i]; if (!s) return; S.stash.push(s); S.player.inv.splice(i, 1); },
    takeFromStash: i => { const s = S.stash[i]; if (!s) return; if (addItem(S.player, s.key, s.count || 1)) S.stash.splice(i, 1); },
    toHotbar: key => { const p = S.player; if (p.hotbar.length < 8) p.hotbar.push({ type:'item', key }); else p.hotbar[7] = { type:'item', key }; UI.renderHotbar(); },
    useSlot, spendAttr: k => { const p = S.player; if (p.attrPoints > 0) { p.attributes[k]++; p.attrPoints--; recalc(p); } },
    setClass, armorOf, damageOf, population, canAfford,
    startPlacing, foundCamp: () => foundCamp(),
    raisePriority: i => { const pr = S.settlement.priorities; if (i > 0) { const t = pr[i]; pr[i] = pr[i - 1]; pr[i - 1] = t; } },
    shopStock, price, buy, sell, craftBandage, bandageFrom: k => BANDAGE_FROM[k] || 0,
    bandage: (target, part) => {
      const idx = S.player.inv.findIndex(x => x.key === 'bandage');
      if (idx < 0) return UI.toast('Keine Verbände. Kaufen, finden oder aus Stoff herstellen.');
      if (target !== S.player && dist(S.player, target) > 70) return UI.toast(`${target.name} ist zu weit weg.`);
      useConsumable(S.player, idx, target, part);
    },
    drawWorldmap, drawWarmap, warStatus, facRelation,
    saveNow: () => save(),
  });
  // Titelbildschirm
  $('legacy-summary').innerHTML = hasSave() ? (() => {
    const d = loadRaw();
    if (!d) return '';
    return `AKTUELLES ERBE<br><br>Haus ${d.legacy.house}<br>Generation ${d.legacy.gen}<br><br>
      Aktueller Charakter:<br>${d.player?.name || '—'}<br><br>Tag ${d.day}`;
  })() : 'Noch keine Geschichte geschrieben.';
  document.querySelector('[data-act="continue"]').disabled = !hasSave();
  document.querySelectorAll('.menu-plaques .plaque').forEach(b => {
    b.onclick = () => {
      const act = b.dataset.act;
      if (act === 'continue') { bindInput(); continueGame(); }
      else if (act === 'new') { $('titlescreen').classList.add('hidden'); $('creation').classList.remove('hidden'); }
      else if (act === 'chronicle') { UI.openModal('chronicle'); }
      else if (act === 'settings') { UI.openModal('settings'); }
    };
  });
  buildCreation();
  requestAnimationFrame(titleLoop);
  if (location.search.includes('test')) setTimeout(() => selftest(), 400);
}
boot();
