// Rotfall: Legacy — Spielkern. Schleife, Kampf, KI, Quests, Siedlung, Erbe.
import { S, DBG, SAVE_VERSION, log, chronicle, save, loadRaw, applySave, hasSave, wipeSave, seedRng, rnd, ri, pick, chance,
         clamp, dist, uid, byId, partyMembers, timeStr, year, mergeProps, adoptPropKeys, saveData } from './state.js';
import { ITEMS, MONSTERS, NPCS, ORIGINS, CLASSES, ABILITIES, FACTIONS, BUILDINGS, QUESTS, LOOT, MEMORY_TEXT, RARITY, RARITY_ORDER, RARITY_DROP, RARITY_VALUE, RARITY_AFFIXES, AFFIXES, LEGENDS, SKILL_NAMES, TITLE_CLASSES, SKILL_TREE, SKILL_BRANCHES, MAX_TITLES } from './data.js';
import { MAPS, TS, T, SOLID, LOCATIONS, genWorld, genMine, genDeep, DUNGEONS, MAP_KEYS, tileAt, setTile, solidTile, speedMul, locAt, freeSpotNear, regionAt, occupied, HOUSES, TOWN_PLAN, townAt, worldPt, WS } from './world.js';
import * as R from './render.js';
import * as HB from './buildings.js';
import * as UI from './ui.js';
import * as SIM from './sim.js';
import * as B from './body.js';
import * as SP from './sprites.js';
import { sfx, ambience, ambienceTick } from './sfx.js';

const $ = id => document.getElementById(id);
let last = 0, acc = 0, running = false, hovered = null, selected = null, placing = null;
let combat = [];                        // lebende Kämpfer der aktuellen Karte, einmal pro Frame
const keys = new Set();
let mouse = { x: 0, y: 0, wx: 0, wy: 0, down: false };
const touch = { on: false, dx: 0, dy: 0, lx: 1, ly: 0, attack: false, guard: false };   // Touch-Steuerung: Stick-Richtung, letzte Blickrichtung
const solidIndex = { world: new Map(), mine: new Map() };
occupied.at = (map, tx, ty) => !!solidIndex[map]?.get(tx + ',' + ty)?.length;   // Spawns nie in Bäume/Felsen setzen

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

// ---- Skill-Baum: Summe der Knoteneffekte (nur wer Knoten hat) und besondere Regeln je Schlüsselknoten ----
const node = (c, k) => !!(c && c.tree && c.tree[k]);
function treeFx(c) { const f = {}; for (const k of Object.keys(c.tree || {})) for (const [a, v] of Object.entries(SKILL_TREE[k]?.fx || {})) f[a] = (f[a] || 0) + v; return f; }
const tfx = (c, k) => (c && c.tfx && c.tfx[k]) || 0;
const inNature = c => c.map === 'world' && !townAt(c.x / TS | 0, c.y / TS | 0) && [T.GRASS, T.MARSH, T.DIRT].includes(tileAt('world', c.x / TS | 0, c.y / TS | 0));
const outside = c => c.map === 'world' && !townAt(c.x / TS | 0, c.y / TS | 0);
export function recalc(c) {
  const a = c.attributes;
  c.tfx = c.tree ? treeFx(c) : null;
  const base = (40 + a.endurance * 4 + c.level * 6) * (c.pactCost?.hpMul || 1) * (1 + tfx(c, 'hp') + afx(c, 'vital'));   // Basis-HP, verteilt auf die Körperteile; Pakt kostet Leben
  if (c.body) B.rescale(c, base); else B.initBody(c, base);
  c.maxStamina = 60 + a.endurance * 3 + a.agility * 2 + B.buildOf(c).stamina + (c.pactCost?.stamina || 0) + tfx(c, 'stam') + afx(c, 'enduring');
  const magic = ['mage', 'cleric', 'paladin'].includes(c.currentClass);   // Titelklassen haben ihre eigene Ressource, kein Mana
  c.maxMana = magic ? 30 + a.intelligence * 4 + a.willpower * 2 + tfx(c, 'mana') : 0;
  if (c.kind === 'player') c.invCap = 24 + tfx(c, 'invCap');
  c.partyCap = 3 + Math.floor((c.skills.leadership || 0) / 10) + (S.settlement ? 1 : 0);
}
export function armorOf(c) {
  if (!c.equip) return c.armor || 0;                       // Karawane, Gegner
  let v = 0;
  for (const k of Object.keys(c.equip)) { const it = c.equip[k]; if (it && ITEMS[it.key].armor) v += ITEMS[it.key].armor * (0.4 + 0.6 * (it.cond ?? 1)); }
  v += afx(c, 'sturdy') + (hasLeg(c, 'bastion') && c.hp < c.maxHp * 0.3 ? 8 : 0);   // Härte, Ahnenwall
  const bless = (c.status || []).find(s => s.key === 'blessing');
  v = (v + tfx(c, 'armor') + (node(c, 'k_grove') && inNature(c) ? 3 : 0)) * (node(c, 'k_bulwark') ? 1.3 : 1);
  return Math.round(v + (bless ? 5 : 0));
}
export function damageOf(c) {
  const w = c.equip.weapon, it = w ? ITEMS[w.key] : null;
  const base = (it ? it.dmg * (0.55 + 0.45 * (w.cond ?? 1)) : 3) * (B.isDisabled(c, 'rarm') ? 0.3 : 1);
  const skill = it ? (c.skills[it.skill] || 0) : (c.skills.unarmed || 0);
  const attr = it && it.ranged ? c.attributes.agility : c.attributes.strength;
  let m = 1 + tfx(c, 'dmg') + afx(c, 'sharp');
  if (node(c, 'k_berserk') && c.hp < c.maxHp * 0.3) m += 0.25;                       // Berserker: nah am Tod gefährlicher
  if (node(c, 'k_grove')) m += inNature(c) ? 0.15 : -0.10;                            // Hüter des Hains
  if (node(c, 'k_legion') && c.titleClass === 'necromancer') m -= 0.20;               // Legion: Feldherr, kein Fechter
  if (c.currentClass === 'bard') m -= 0.15;                                            // Barde: kämpft durch andere
  if (stat(c, 'frenzy')) m += 0.35;                                                    // Raserei
  if (stat(c, 'song')) m += 0.15;                                                      // Kriegslied
  return (base + attr * 0.35 + skill * 0.22) * Math.max(0.2, m);
}
function speedOf(c) {
  let s = (2.25 + c.attributes.agility * 0.045) * (c === S.player ? DBG.speed : 1);
  const off = c.equip.offhand && ITEMS[c.equip.offhand.key].slow || 0;
  const ch = c.equip.chest && ITEMS[c.equip.chest.key].slow || 0;
  s *= (1 - off - ch);
  if (c.stamina <= 0) s *= 0.55;
  if (c.status && c.status.some(t => t.key === 'chilled')) s *= 0.6;   // Hrodvars Eiskreis
  if (stat(c, 'frenzy')) s *= 1.15;
  if (stat(c, 'grabbed')) s *= 0.5;                                   // Griff des Wiedergängers
  s *= (1 + tfx(c, 'speed') + afx(c, 'fleet')) * (node(c, 'k_bulwark') ? 0.9 : 1) * (node(c, 'k_wild') ? (outside(c) ? 1.1 : 0.95) : 1);
  return s * speedMul(c.map, c.x, c.y) * B.speedFactor(c);
}

// ================= Items =================
const GEAR = new Set(['weapon', 'offhand', 'head', 'chest', 'feet', 'cloak']);
// roll: Fund (Beute/Truhe) — Rarität würfeln (nie unter der Grundrarität), Affixe je Stufe. bonus: Gefahr des Fundorts (0–3).
function mkItem(key, count = 1, roll = null) {
  const it = ITEMS[key]; if (!it) return null;
  const o = { key, count: it.stack ? count : 1 };
  if (it.slot !== 'material' && it.slot !== 'consumable') o.cond = 0.55 + rnd() * 0.45;
  if (roll && GEAR.has(it.slot) && !it.unique) rollRarity(o, it, roll.bonus || 0);
  return o;
}
export function rollRarity(o, it, bonus = 0) {
  let r = rnd(), tier = 'common';
  const w = Object.entries(RARITY_DROP).map(([k, p]) => [k, RARITY_ORDER.indexOf(k) >= 2 ? p * (1 + bonus * 0.5) : p]);
  const sum = w.reduce((n, [, p]) => n + p, 0); r *= sum;
  for (const [k, p] of w) { if (r < p) { tier = k; break; } r -= p; }
  const base = it.rarity || 'common';
  if (RARITY_ORDER.indexOf(tier) <= RARITY_ORDER.indexOf(base)) return o;          // nicht besser als die Grundware
  o.rar = tier; o.afx = {};
  const pool = Object.entries(AFFIXES).filter(([k, A]) => A.slots.includes(it.slot) && !(it.ranged && ['rend', 'leech'].includes(k)));   // Geschosse heilen/zerfetzen nicht (laufen nicht über hit)
  const take = (major) => { const c = pool.filter(([k, A]) => !!A.major === major && !(k in o.afx)); if (!c.length) return;
    const [k, A] = pick(c), v = A.v[0] + rnd() * (A.v[1] - A.v[0]); o.afx[k] = A.int ? Math.round(v) : Math.round(v * 100) / 100; };
  const n = RARITY_AFFIXES[tier];
  if (tier === 'epic') { take(true); take(false); take(false); }                  // episch: einer davon spielverändernd
  else for (let i = 0; i < n; i++) take(false);
  if (tier === 'legendary') { const L = Object.entries(LEGENDS).filter(([, x]) => x.slots.includes(it.slot)); if (L.length) o.leg = pick(L)[0]; }
  if (!Object.keys(o.afx).length) delete o.afx;
  return o;
}
export const rarOf = o => (o && o.rar) || (o && ITEMS[o.key]?.rarity) || 'common';
export const legOf = o => (o && (o.leg || ITEMS[o.key]?.leg)) || null;
function afx(c, k) {                                           // Summe eines Affixes über die angelegte Ausrüstung
  let v = 0; if (!c.equip) return 0;
  for (const s of Object.values(c.equip)) if (s && s.afx && s.afx[k]) v += s.afx[k];
  return v;
}
const hasLeg = (c, k) => !!c.equip && Object.values(c.equip).some(s => s && legOf(s) === k);
function giveItem(c, inst) {                                   // ein gefundenes Exemplar behalten (Zustand, Rarität, Affixe)
  const it = ITEMS[inst.key]; if (!it) return false;
  if (it.res || it.stack) return addItem(c, inst.key, inst.count || 1);
  if (c.inv.length >= c.invCap) { if (c === S.player) UI.toast('Tasche voll'); return false; }
  c.inv.push(inst); return true;
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
function removeItem(c, key, count = 1) {                   // über alle Stapel hinweg (vorher nur der erste — 1+9 Kraut kostete nur 1)
  if (!hasItem(c, key, 1)) return false;
  for (let i = c.inv.length - 1; i >= 0 && count > 0; i--) {
    const s = c.inv[i]; if (s.key !== key) continue;
    const n = Math.min(count, s.count || 1); count -= n;
    if ((s.count || 1) > n) s.count -= n; else c.inv.splice(i, 1);
  }
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
  if (it.use === 'soul') {                                   // Seelenphiole: Essenz für Totenrufer, Linderung für Hexer, sonst ein Schluck Kälte
    removeItem(c, slot.key, 1);
    if (c.titleClass === 'necromancer') setTres(c, tres(c) + 2); else if (c.titleClass === 'warlock') setTres(c, tres(c) - 30); else B.heal(c, 8);
    log(`${c.name} trinkt eine Seelenphiole.`, 'party'); fx(c.x, c.y - 14, 'necro', 8);
    return UI.refreshHUD();
  }
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
    const amt = ((key === 'bandage' ? 6 + P.max * 0.3 : it.heal) + med * 0.4) * (1 + tfx(target, 'heal'));
    const r = B.healPart(target, part, amt);
    if (key === 'bandage') target.status = (target.status || []).filter(s => s.key !== 'bleeding');
    float(target, `+${Math.round(r.gained)} ${B.PART_NAME[part]}`, 'rgba(120,170,90,ALPHA)');
    log(`${c.name} verbindet ${target === c ? 'sich' : target.name}: ${B.PART_NAME[part]}.`, 'party');
    if (r.restored) log(`${B.PART_NAME[part]} von ${target.name} ist wieder zu gebrauchen.`, 'party');
  } else {
    B.heal(target, (it.heal + med * 0.3) * (1 + tfx(target, 'heal')));
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
  if (!idx || !idx.size) return null;                         // Karte ohne Objekt-Index (z. B. Selbsttest-Sandbox)
  for (let j = ty - 1; j <= ty + 1; j++) for (let i = tx - 1; i <= tx + 1; i++) {
    const arr = idx.get(i + ',' + j); if (!arr || !arr.length) continue;
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
  village:[60,62], tavern:[55,60], market:[60,62], smithy:[65,63], healer:[69,60], farm:[60,70],
  shrine:[76,52], banditcamp:[66,116], graveyard:[34,96], mayor:[54,69], northcity:[119,60],
  altvharn:[359,385], necrotower:[392,350],                 // Totenreich: Ysra am Ahnenaltar, Vhal im Schattenkreis
  grove:[82,290],                                           // Westwald: Mira im Alten Hain
  vharnholm:[489,441],                                      // Totenreich: Sael am Markt von Vharnholm
  northsmith:[139,57],                                      // Nordfurt: Brann vor der Schmiede
  sonnwacht:[452,256],                                      // Sonnwacht: Ilva vor der Ordenskapelle
  grenzwacht:[332,349],                                     // Grenzöde: Oda am Wachfeuer
  kreuzweg_tav:[244,246], saltport_lab:[139,436],           // Lioba in der Kreuzweg-Schenke, Quirin im Salzhafener Lagerhaus
};
function spawnNPCs() {
  for (const def of NPCS) spawnNpcDef(def);
}
function spawnNpcDef(def) {
  const spots = NPC_SPOTS;
  {
    const home = worldPt(...(spots[def.home] || spots.village));      // Entwurfskoordinaten → gestreckte Siedlung
    const pos = freeSpotNear('world', home[0] + ri(-2, 2), home[1] + ri(-2, 2), 4);
    const c = makeChar({ ...def, x: pos.x, y: pos.y, level: def.key === 'kelan' ? 12 : def.key === 'rook' ? 8 : ri(3, 7),
      pal: { skin: pick(SKIN), hair: pick(HAIR), cloth: def.faction === 'order' ? '#c7bda6' : def.faction === 'valen' ? '#33415c' :
             def.faction === 'undead' ? '#232a28' : pick(CLOTH), armor: def.key === 'kelan' ? '#b9b19c' : def.key === 'borin' ? '#6b6155' : null,
             helm: def.key === 'kelan' ? '#c3bba5' : null } });
    c.home = home; c.anchor = { x: pos.x, y: pos.y };
    if (def.undead) { c.pal.skin = '#b9b3a2'; c.pal.glow = def.key === 'vhal' ? '#b07ae0' : '#4e8f7a'; }
    c.hooded = !!def.undead || def.faction === 'undead' || ['morvath', 'rook', 'kelan'].includes(def.key);
    const w = { elena:'dagger', tomas:'shortbow', borin:'longsword', rook:'dagger', kelan:'longsword', aldric:'mace', brann:'longsword', oda:'spear', morvath:'staff' }[def.key];
    if (w) c.equip.weapon = mkItem(w);
    if (def.key === 'borin') { c.equip.offhand = mkItem('kite_shield'); c.pal.shield = '#4a3f30'; c.pal.shieldBoss = '#8a8172'; }
    if (def.key === 'kelan') { c.equip.offhand = mkItem('kite_shield'); c.equip.chest = mkItem('plate_cuirass');
      c.pal.crest = '#9b2e26'; c.pal.shield = '#d9d2c0'; c.pal.shieldBoss = '#9b2e26'; }   // Orden: Elfenbein & Rot
    for (const [k, v] of Object.entries({ onehanded:6, defense:4, survival:4 })) c.skills[k] = (c.skills[k] || 0) + v;
    recalc(c); B.fullHeal(c);
    S.ents.world.push(c);
    S.relations[def.key] = def.key === 'rook' ? -10 : 0;
  }
}
// Wachposten je Siedlung: an Toren/Einfallstraßen und am Platz. Wer die Wache stellt, bestimmt Ausrüstung und Farbe.
const GUARD_POSTS = {                                   // Tore und Einfallstraßen der ausgebauten Siedlungen, dazu der Platz
  eren:      { faction: 'valen', posts: [[35, 64], [86, 64], [61, 56], [60, 75]] },
  northcity: { faction: 'valen', posts: [[112, 63], [146, 64], [118, 72], [128, 45], [135, 62]] },
  saltport:  { faction: 'valen', posts: [[148, 432], [132, 450], [174, 450], [150, 473]] },
  kreuzweg:  { faction: 'merch', posts: [[226, 250], [276, 250], [249, 236], [250, 264]] },
  ashford:   { faction: 'merch', posts: [[380, 85], [379, 98], [373, 92], [358, 92]] },
  sonnwacht: { faction: 'order', posts: [[447, 250], [454, 264], [457, 264], [455, 277]] },
  vharnholm: { faction: 'undead', posts: [[469, 442], [505, 442], [487, 425], [487, 461]] },
  grenzwacht:{ faction: 'valen', posts: [[330, 342], [331, 356], [326, 347]] },   // Nordtor, Südtor (zum Aschenpfad), Turm
};
const GUARD_KIT = {
  valen: { prof: 'Torwache', cloth: '#33415c', weapon: 'spear', chest: 'chain_hauberk', head: 'iron_helm' },
  merch: { prof: 'Söldnerwache', cloth: '#5a4630', weapon: 'spear', chest: 'leather_jerkin', head: 'leather_cap' },
  order: { prof: 'Ordenswache', cloth: '#c7bda6', weapon: 'longsword', chest: 'chain_hauberk', offhand: 'kite_shield' },
  undead: { prof: 'Stiller Wächter', cloth: '#232a28', weapon: 'longsword', chest: 'chain_hauberk', undead: true },
};
// Idempotent: vorhandene Wachen einer Siedlung beziehen die (neuen) Posten der Reihe nach, nur fehlende kommen hinzu.
function spawnGuardPosts() {
  for (const [town, g] of Object.entries(GUARD_POSTS)) g.posts.forEach(([tx, ty], i) => {
    const k = GUARD_KIT[g.faction], pos = freeSpotNear('world', ...worldPt(tx, ty), 1);
    const had = S.ents.world.filter(c => c.kind === 'npc' && c.guard && c.post === town && c.alive)[i];
    if (had) { had.anchor = { x: pos.x, y: pos.y }; had.x = pos.x; had.y = pos.y; had.wander = null; return; }
    const c = guardChar(g.faction, pos); c.guard = true; c.post = town;
    S.ents.world.push(c);
  });
}
// Bewaffnete Figur nach GUARD_KIT (Stadtwache, Karawanenwache). Posten/Aufgabe setzt der Aufrufer.
function guardChar(faction, pos, prof, level = ri(4, 7)) {
  const k = GUARD_KIT[faction];
  const c = makeChar({ name: pick(['Aldo', 'Berit', 'Conrad', 'Dagna', 'Egil', 'Frida', 'Gunnar', 'Hedda', 'Ivo', 'Jutta']), prof: prof || k.prof,
    x: pos.x, y: pos.y, level, faction, traits: ['diszipliniert'], attrs: { strength: 11, endurance: 11 },
    pal: { skin: pick(SKIN), hair: pick(HAIR), cloth: k.cloth, crest: faction === 'order' ? '#9b2e26' : null } });
  for (const sl of ['weapon', 'chest', 'head', 'offhand']) if (k[sl]) c.equip[sl] = mkItem(k[sl]);
  c.anchor = { x: pos.x, y: pos.y }; c.skills.onehanded = 20; c.skills.polearms = 20;
  if (k.undead) { c.undead = true; c.hooded = true; c.pal.skin = '#b9b3a2'; c.pal.glow = '#4e8f7a'; }
  recalc(c); B.fullHeal(c);
  return c;
}
// Karawanenwachen (BUG-011): je Platz eine; wer fehlt (gefallen, alter Spielstand), wird angeheuert.
const ESCORT_SLOTS = 2;
const escortsOf = car => S.ents.world.filter(e => e.kind === 'npc' && e.alive && e.escort === car.id);
function hireEscorts(car) {
  const have = escortsOf(car);
  for (let slot = 0; slot < ESCORT_SLOTS; slot++) if (!have.some(e => e.slot === slot)) {
    const q = SIM.escortSlot(car, slot), pos = freeSpotNear('world', q.x / TS | 0, q.y / TS | 0, 3);
    const c = guardChar('merch', pos, 'Karawanenwache', ri(2, 4)); c.escort = car.id; c.slot = slot; c.brave = true;
    S.ents.world.push(c);
  }
  car.crew = 1;
}

// Bewohner: jedes Wohn- und Arbeitshaus der Siedlungen hat Leute. Nachts drinnen (an der Tür), tagsüber bei der Arbeit
// oder auf dem Platz, abends vor dem Haus oder in der Schenke. Leichtgewichtig: nur Ziele, die think() ohnehin ansteuert.
const TRADES = {
  house: ['Bauer', 'Magd', 'Weber', 'Tagelöhner', 'Handwerker', 'Böttcher'], cottage: ['Tagelöhner', 'Holzfäller', 'Witwe', 'Kesselflicker'],
  manor: ['Kaufmann', 'Bürgerin', 'Ratsherr'], bakery: ['Bäcker'], barn: ['Bauer'], stable: ['Stallknecht'], store: ['Lagerknecht'],
  fisher: ['Fischer', 'Netzflickerin'], tavern: ['Wirt'], smithy: ['Schmied'], healer: ['Heilerin'], chapel: ['Priester'],
};
const DEAD_TRADES = ['Knochenleser', 'Ahnenwächter', 'Aschegräber', 'Stumme Magd', 'Namensritzer'];   // Vharnholm: jeder Haustyp
const TRADE_GREET = {
  Knochenleser: '„Jeder Knochen erzählt, wie er gebrochen ist. Deine erzählen noch nichts.“', Ahnenwächter: '„Wir warten. Darin sind wir gut.“',
  Aschegräber: '„Die Asche gibt Namen zurück, wenn man lange genug gräbt.“', 'Stumme Magd': '„…“ (Sie nickt dir zu und fegt weiter.)',
  Namensritzer: '„Ein Name in Stein hält länger als einer im Mund.“',
  Bauer: '„Wenn der Regen ausbleibt, hungern wir. Wenn er kommt, auch.“', Magd: '„Ich hab zu tun. Sag schnell, was du willst.“',
  Weber: '„Gutes Tuch hält einen Winter. Schlechtes nicht mal eine Woche.“', Tagelöhner: '„Arbeit? Hast du welche? Nein? Dann geh weiter.“',
  Handwerker: '„Alles bricht irgendwann. Davon lebe ich.“', Böttcher: '„Ein Fass, das nicht leckt, ist mehr wert als ein Schwert.“',
  Holzfäller: '„Der Wald gibt Holz. Und manchmal nimmt er einen von uns.“', Witwe: '„Mein Mann ging zur Grube. Er kam nicht wieder.“',
  Kesselflicker: '„Löcher im Topf, Löcher im Dach. Ich flicke alles, nur mein Glück nicht.“', Kaufmann: '„Zeit ist Silber. Deine auch.“',
  Bürgerin: '„Die Wachen sollten mehr Leute wie dich aufhalten.“', Ratsherr: '„Ordnung. Das ist es, was dieser Stadt fehlt.“',
  Bäcker: '„Brot geht immer. Sogar im Krieg. Gerade im Krieg.“', Stallknecht: '„Die Gäule mögen dich nicht. Ich auch nicht, noch nicht.“',
  Lagerknecht: '„Kisten rauf, Kisten runter. Frag mich nicht, was drin ist.“', Fischer: '„Die See war gnädig heute. Sie ist es selten.“',
  Netzflickerin: '„Jedes Loch im Netz ist ein Fisch, der davonschwimmt.“', Wirt: '„Setz dich. Wer zahlt, bleibt.“',
  Schmied: '„Wenn du nichts zu schmieden hast, steh nicht im Licht.“', Heilerin: '„Zeig her. Nein, das ist nicht nur ein Kratzer.“',
  Priester: '„Die Toten stehen wieder auf. Beten allein hilft da nicht mehr.“',
};
const FIRST = ['Adda', 'Bertold', 'Cordula', 'Dietmar', 'Edda', 'Folkmar', 'Gesa', 'Hartwig', 'Irmel', 'Jost', 'Kunna', 'Liudger', 'Mechthild',
  'Notker', 'Oda', 'Poppo', 'Ragna', 'Sigbert', 'Thiadrun', 'Udo', 'Walburg', 'Wido', 'Ymma', 'Arnulf', 'Benno', 'Ella', 'Gero', 'Hemma'];
// Wie viele Menschen ein Haus trägt (Obergrenze) — ein Kontor oder eine Kaserne hat keine Bewohner (Wachen stehen dort).
const HOUSE_CAP = { manor: 4, house: 3, cottage: 2, fisher: 2, bakery: 2, tavern: 2, smithy: 2, healer: 1, chapel: 1, store: 1, stable: 1, barn: 1 };
const houseCap = b => b.type === 'house' && b.w * b.h < 20 ? 2 : HOUSE_CAP[b.type] || 1;
const NAMED_HOME = { eren: ['tavern', 'smithy', 'healer'] };            // dort arbeiten schon Figuren mit Namen
// Einwohnerzahl nach Fläche (Nutzerwunsch, Session 4): Ziel = Fläche / perHead, abzüglich Wachen und Figuren mit Namen.
// Jedes bewohnbare Haus hat mindestens einen Bewohner; der Rest verteilt sich reihum auf die größeren Häuser bis zur Obergrenze.
export function residentPlan() {
  const out = {};
  for (const [town, P] of Object.entries(TOWN_PLAN)) {
    const hs = HOUSES.filter(b => b.town === town && b.map === 'world' && TRADES[b.type] && HB.wearOf(b) < 2 && !(NAMED_HOME[town] || []).includes(b.type));
    const [x0, y0, x1, y1] = P.area, named = NPCS.filter(n => (TOWN_OF_SPOT[n.home] || null) === town).length;
    let left = Math.round((x1 - x0 + 1) * (y1 - y0 + 1) / (P.perHead || 90)) - (GUARD_POSTS[town]?.posts.length || 0) - named - hs.length;
    for (const b of hs) out[b.id] = 1;
    const order = hs.slice().sort((a, b) => houseCap(b) - houseCap(a) || (a.id < b.id ? -1 : 1));
    for (let more = true; left > 0 && more;) { more = false;
      for (const b of order) if (left > 0 && out[b.id] < houseCap(b)) { out[b.id]++; left--; more = true; } }
  }
  return out;
}
const TOWN_OF_SPOT = { village: 'eren', tavern: 'eren', market: 'eren', smithy: 'eren', healer: 'eren', farm: 'eren', mayor: 'eren', northcity: 'northcity', vharnholm: 'vharnholm' };
function spawnResidents() {
  const plan = residentPlan(), hsh = (a, b, c) => { let n = (a * 374761393 + b * 668265263 + c * 2246822519) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  for (const b of HOUSES) {
    const P = TOWN_PLAN[b.town], trades = TRADES[b.type] && (b.town === 'vharnholm' ? DEAD_TRADES : TRADES[b.type]), n = plan[b.id] || 0;
    if (!P || !trades || b.map !== 'world' || !n) continue;
    if (S.ents.world.some(c => c.homeId === b.id)) continue;                          // schon bewohnt (Migration idempotent)
    const [dx, dy] = b.doorTile, sx = b.door === 'W' ? 1 : b.door === 'E' ? -1 : 0, sy = b.door === 'S' ? -1 : b.door === 'N' ? 1 : 0;
    const inside = { x: (dx + sx) * TS + TS / 2, y: (dy + sy) * TS + TS / 2 }, front = { x: (dx - sx) * TS + TS / 2, y: (dy - sy) * TS + TS / 2 };
    const town = HOUSES.filter(h => h.town === b.town && h.map === 'world' && h !== b && HB.wearOf(h) < 2);
    const plaza = (P.plazas || []).find(([, x0, y0, x1, y1]) => P.square[0] >= x0 - 3 && P.square[0] <= x1 + 3 && P.square[1] >= y0 - 3 && P.square[1] <= y1 + 3);
    for (let i = 0; i < n; i++) {
      const hx = b.hx ?? b.x, hy = b.hy ?? b.y, prof = trades[(hx * 7 + hy * 3 + i) % trades.length];
      const c = makeChar({ name: FIRST[(hx * 13 + hy * 5 + i * 11) % FIRST.length], prof, x: front.x, y: front.y, level: ri(1, 4),
        traits: [pick(['gütig', 'mürrisch', 'neugierig', 'faul', 'furchtsam', 'fleißig'])], greet: TRADE_GREET[prof] });
      c.villager = true; c.homeId = b.id; c.homeTown = b.town;
      if (b.town === 'vharnholm') { c.undead = true; c.faction = 'undead'; c.hooded = true; c.pal = { ...c.pal, skin: '#b9b3a2', glow: '#4e8f7a', cloth: pick(['#232a28', '#2a2622', '#1f2624']) }; }
      const [lat, dep] = [[0, 0], [1, 0], [-1, 0], [0, 1]][i % 4];                   // Nacht: drinnen, nebeneinander (quer zur Tür, dann tiefer)
      c.anchor = { x: inside.x + (lat * Math.abs(sy) + dep * sx) * TS, y: inside.y + (lat * Math.abs(sx) + dep * sy) * TS };
      if (SOLID.has(tileAt('world', c.anchor.x / TS | 0, c.anchor.y / TS | 0)) || solidPropAt('world', c.anchor.x, c.anchor.y, 4)) c.anchor = inside;
      const pier = P.harbor && P.harbor.piers[(hx + i) % P.harbor.piers.length], field = P.fields && P.fields[(hx + i) % P.fields.length];
      // Tagsüber: am Arbeitsort, sonst verteilt — Platz (ganze Fläche), bei Nachbarn vor dem Haus, vor dem eigenen Haus.
      // Früher standen alle Müßigen auf 5×3 Kacheln am Platz: bei mehr Einwohnern ein Gedränge.
      const r = hsh(hx, hy, i), nb = town[Math.floor(hsh(hy, hx, i + 7) * town.length)];
      const sq = () => plaza ? { x: (plaza[1] + hsh(hx, i, 3) * (plaza[3] - plaza[1] + 1)) * TS, y: (plaza[2] + hsh(hy, i, 5) * (plaza[4] - plaza[2] + 1)) * TS }
        : { x: (P.square[0] + (hsh(hx, i, 3) - 0.5) * 10) * TS, y: (P.square[1] + (hsh(hy, i, 5) - 0.5) * 6) * TS };
      const visit = nb ? { x: (nb.doorTile[0] + (nb.door === 'E' ? 2 : nb.door === 'W' ? -2 : 0.5 + (i % 2 ? 1 : -1))) * TS, y: (nb.doorTile[1] + (nb.door === 'S' ? 1.5 : nb.door === 'N' ? -1.5 : 0.5)) * TS } : front;
      c.schedulePos = prof === 'Fischer' && pier ? { x: (pier + 0.5) * TS, y: (P.harbor.top + 2) * TS }
        : b.type === 'barn' && field ? { x: ((field[0] + field[2]) / 2) * TS, y: ((field[1] + field[3]) / 2) * TS }
        : ['tavern', 'healer', 'chapel'].includes(b.type) && i === 0 ? inside
        : ['bakery', 'store', 'stable', 'smithy', 'fisher'].includes(b.type) && i === 0 ? front
        : r < 0.35 ? sq() : r < 0.65 ? visit : front;
      const tav = HOUSES.find(h => h.town === b.town && h.type === 'tavern');         // abends: ein Teil geht in die Schenke
      const k = (hx * 7 + hy * 13 + i * 5) % 7 - 3, far = 1.5 + ((hx + i) % 3);         // vor der Schenke: in einem Halbkreis verteilt statt als Klumpen an der Tür
      c.eve = tav && (hx + hy + i) % 3 === 0 ? { x: (tav.doorTile[0] + 0.5 + k * 1.1) * TS, y: (tav.doorTile[1] + (tav.door === 'S' ? far : -far + 1)) * TS } : front;
      if (prof === 'Heilerin') c.traits = ['gütig'];
      S.ents.world.push(c);
    }
  }
}

// Tagesablauf der Figuren mit Namen (BUG-013): Arbeit, Feierabend, Zuhause — an echte Häuser der Siedlung gebunden.
// Ort: [Haus-id, 'front'|'in'] oder [tx, ty] oder 'field'. till = Feierabend (Stunde, sonst 18); Läden sind bis dahin offen.
// Kelan (Schreinwache), Rook/Lila (Lager), Morvath (Friedhof) haben keinen Ort in einer Stadt — sie bleiben, wo sie sind.
const NPC_DAY = {
  havel:  { work: ['h52_68', 'front'], eve: ['h53_58', 'in'], night: ['h66_68', 'in'] },      // Halle → Schenke → Wohnhaus
  elena:  { work: ['h68_59', 'front'], eve: ['h68_59', 'in'], night: ['h68_59', 'in'] },      // lebt im Heilerhaus
  tomas:  { work: [37, 63], eve: ['h53_58', 'in'], night: ['h37_58', 'in'] },                  // Dorfrand zum Wald
  borin:  { work: ['h53_58', 'front'], eve: ['h53_58', 'in'], night: ['h53_58', 'in'] },      // hat ein Zimmer in der Schenke
  mara:   { work: [60, 63], till: 20, eve: ['h74_57', 'in'], night: ['h74_57', 'in'] },
  aldric: { work: ['h62_58', 'front'], eve: ['h53_58', 'in'], night: ['h62_58', 'in'] },      // wohnt über der Werkstatt
  jorun:  { work: 'field', eve: ['h66_76', 'front'], night: ['h66_76', 'in'] },
  gerold: { work: ['h114_53', 'front'], till: 20, eve: ['h120_45', 'in'], night: ['h120_45', 'in'] },
  brann:  { work: ['h138_53', 'front'], till: 18, eve: ['h131_53', 'in'], night: ['h138_53', 'in'] },     // Schmiede → Schenke → über der Werkstatt
  ilva:   { work: [453, 257], eve: ['h449_249', 'in'], night: ['h449_249', 'in'] },            // Übungsplatz vor der Kapelle → Kapelle
  lioba:  { work: ['h242_242', 'front'], eve: ['h242_242', 'in'], night: ['h242_242', 'in'] },     // spielt vor der Schenke, abends drinnen
  quirin: { work: ['h137_432', 'front'], till: 19, eve: ['h137_432', 'in'], night: ['h137_432', 'in'] },   // Lagerhaus am Hafen = Labor
};
function assignNpcDays() {                         // idempotent: bei Neustart und bei jedem Laden (Häuser werden neu erzeugt)
  const used = {};                                 // Innenplätze je Haus, damit sich niemand auf eine Kachel stapelt
  const spot = (where, npc) => {
    if (where === 'field') { const f = (TOWN_PLAN.eren.fields || [])[0]; if (f) return { x: ((f[0] + f[2]) / 2) * TS, y: ((f[1] + f[3]) / 2) * TS }; where = [60, 70]; }
    if (typeof where[0] === 'number') { const s = freeSpotNear('world', ...worldPt(where[0], where[1]), 1); return { x: s.x, y: s.y }; }
    const b = HOUSES.find(h => h.id === where[0]); if (!b) return null;
    const [dx, dy] = b.doorTile, sx = b.door === 'W' ? 1 : b.door === 'E' ? -1 : 0, sy = b.door === 'S' ? -1 : b.door === 'N' ? 1 : 0;
    if (where[1] === 'front') return { x: (dx - sx) * TS + TS / 2, y: (dy - sy) * TS + TS / 2 };
    if (where[2] === 'sit') {                                  // Sitzplatz: an einer freien Bank des Hauses (Schenke am Abend)
      const bench = S.ents.world.find(e => e.type === 'bench' && e.house === b.id && !used['seat' + e.id]);
      if (bench) { used['seat' + bench.id] = npc; return { x: bench.x, y: bench.y - 16, in: true, sit: true }; }
      const table = S.ents.world.find(e => e.type === 'table' && e.house === b.id && !used['seat' + e.id]);   // keine Bank frei: an den Tisch
      if (table) { used['seat' + table.id] = npc; return { x: table.x, y: table.y + 18, in: true, sit: true }; }
    }
    const free = [];                               // freie Innenkacheln, nächste zur Tür zuerst
    for (let y = b.y + 1; y < b.y + b.h - 1; y++) for (let x = b.x + 1; x < b.x + b.w - 1; x++)
      if (!SOLID.has(tileAt('world', x, y)) && !solidPropAt('world', x * TS + TS / 2, y * TS + TS / 2, 4)) free.push([x, y]);
    free.sort((a, c) => Math.hypot(a[0] - dx, a[1] - dy) - Math.hypot(c[0] - dx, c[1] - dy));
    const k = used[b.id + npc] ?? (used[b.id + npc] = Object.keys(used).filter(u => u.startsWith(b.id)).length);
    const t = free[k % Math.max(1, free.length)] || [dx + sx, dy + sy];
    return { x: t[0] * TS + TS / 2, y: t[1] * TS + TS / 2, in: true };
  };
  for (const c of S.ents.world) {
    const d = c.kind === 'npc' && NPC_DAY[c.key]; if (!d) continue;
    const eveHouse = Array.isArray(d.eve) && HOUSES.find(h => h.id === d.eve[0]);
    const work = spot(d.work, c.key), eve = spot(eveHouse?.type === 'tavern' && d.eve[1] === 'in' ? [...d.eve, 'sit'] : d.eve, c.key), night = spot(d.night, c.key);
    if (!work || !night) continue;
    c.schedulePos = work; c.eve = eve; c.anchor = night; c.till = d.till || null;
  }
}


const SPAWN_AREAS = [
  { map:'world', x:65, y:29, r:3, types:['goblin','goblin','goblin_warrior'], cap:3 },   // Grubenpfad: Plünderer im Händlerlager
  { map:'world', x:57, y:39, r:3, types:['skeleton','skeleton'], cap:2 },               // Grubenpfad: tote Wache am Turm
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
  { map:'deep', x:36, y:37, r:10, types:['skeleton', 'skeleton', 'goblin_warrior'], cap:7 },   // Tiefhall: Säulenhalle
  { map:'deep', x:62, y:35, r:6, types:['skeleton'], cap:6 },                                 // Ahnengruft
  { map:'deep', x:12, y:17, r:6, types:['goblin_warrior', 'goblin'], cap:5 },                 // Schmiede: Goblins graben nach Königseisen
  // --- Großregionen (512×512) ---
  { map:'world', x:60, y:300, r:44, types:['wolf','wolf','boar','goblin'], cap:16 },       // Westwald
  { map:'world', x:44, y:300, r:14, types:['wolf','wolf','bandit'], cap:9 },               // Wolfsschlucht
  { map:'world', x:140, y:410, r:16, types:['skeleton','goblin','wolf'], cap:10 },         // Südsumpf / Tempel
  { map:'world', x:250, y:250, r:20, types:['bandit','wolf'], cap:6 },                     // Mittelland um Kreuzweg
  { map:'world', x:440, y:155, r:44, types:['bandit','bandit_archer','goblin_warrior'], cap:16 }, // Rote Wüste
  { map:'world', x:380, y:92, r:14, types:['bandit','goblin'], cap:7 },                    // um Aschfurt
  { map:'world', x:300, y:34, r:34, types:['wolf','goblin_warrior','skeleton'], cap:14 },  // Frostkamm
  { map:'world', x:250, y:36, r:10, types:['goblin_warrior','skeleton'], cap:8 },          // Tiefhall
  // Totenreich (SO): dichte Untoten-Patrouillen
  { map:'world', x:362, y:380, r:18, types:['skeleton','skeleton','goblin_warrior'], cap:14 }, // Alt-Vharn
  { map:'world', x:404, y:437, r:16, types:['skeleton','skeleton'], cap:12 },              // Nekropole
  { map:'world', x:431, y:430, r:20, types:['skeleton','skeleton','goblin_warrior'], cap:18 }, // Schwarze Feste
  { map:'world', x:392, y:348, r:14, types:['skeleton'], cap:8 },                          // Nekromanten-Turm
  // Session 5: erweitertes Totenreich
  { map:'world', x:470, y:366, r:16, types:['skeleton', 'skeleton', 'wolf'], cap:10 },      // Knochenwald: Tote und hungrige Wölfe
  { map:'world', x:474, y:372, r:5, types:['bandit', 'bandit', 'bandit_archer'], cap:4 },   // Grabräuber-Lager im Knochenwald
  { map:'world', x:414, y:452, r:6, types:['bandit', 'bandit'], cap:3 },                    // Grabräuber am Südrand der Nekropole
  { map:'world', x:318, y:438, r:14, types:['skeleton'], cap:6 },                           // Aschensee
  { map:'world', x:340, y:402, r:9, types:['skeleton', 'ghoul', 'ghoul', 'wolf'], cap:8 },  // Session 6: Hundertfeld (Wiedergänger seit Phase 11)
  // Phase 11: neue Wesen, je dort, wo sie hingehören
  { map:'world', x:356, y:372, r:12, types:['cultist', 'skeleton', 'ghoul'], cap:7 },         // Alt-Vharn: Kult der Asche
  { map:'world', x:318, y:420, r:8, types:['cultist', 'ghoul'], cap:5 },                      // Nordufer des Aschensees
  { map:'world', x:470, y:366, r:10, types:['wraith', 'wraith'], cap:4 },                     // Knochenwald: Geister zwischen den Stämmen
  { map:'world', x:48, y:280, r:16, types:['bear'], cap:2 },                                  // Westwald: Bärenrevier
  { map:'world', x:300, y:40, r:18, types:['bear', 'wolf'], cap:3 },                          // Frostkamm
  { map:'world', x:210, y:210, r:18, types:['wild_dog', 'wild_dog', 'wild_dog'], cap:6 },     // Mittelland: verwilderte Hunde
  { map:'world', x:430, y:180, r:20, types:['wild_dog', 'wild_dog'], cap:5 },                 // Rote Wüste
  { map:'world', x:74, y:300, r:30, types:['deer', 'deer', 'deer'], cap:6 },                  // Westwald: Rotwild
  { map:'world', x:96, y:40, r:18, types:['deer', 'deer'], cap:4 },                           // Eren-Wald
  { map:'world', x:120, y:190, r:24, types:['deer', 'deer'], cap:4 },                         // südliche Ebenen
  { map:'deep', x:10, y:36, r:5, types:['wraith'], cap:2 },                                   // Tiefhall: Eiskammern
];

for (const a of SPAWN_AREAS) if (a.map === 'world') {          // Entwurf → Weltmaßstab: Gebiete wachsen mit, Dichte sinkt leicht (mehr Ruhe)
  [a.x, a.y] = worldPt(a.x, a.y); a.r = Math.round(a.r * WS); if (a.r >= 12) a.cap = Math.round(a.cap * 1.25);
}
const HUMANOID = new Set(['goblin', 'goblin_warrior', 'bandit', 'bandit_archer', 'skeleton', 'crypt_warden', 'hrodvar', 'valen_soldier', 'gorak', 'cultist', 'ghoul', 'wraith']);
// §25 Stil-Testbereich (nur Entwicklerzugang): je ein Vertreter jeder Bildklasse nebeneinander — Figuren, Gegner,
// Gebäude (3 Typen + Ruine), Boden/Übergänge, Fels, Bäume, Kisten/Fässer in allen Varianten, Effekte. Jede
// Stiländerung wird hier gegen den Rest geprüft. styleArea(false) räumt auf und stellt den Spieler zurück.
let styleKeep = null;
function styleArea(on = true) {
  const K = '__style';
  if (!on) {
    if (!styleKeep) return false;
    const p = S.player; Object.assign(p, styleKeep.pos); S.map = styleKeep.map; S.ents[K].splice(S.ents[K].indexOf(p), 1); S.ents[p.map].push(p);
    for (let i = HOUSES.length - 1; i >= 0; i--) if (HOUSES[i].map === K) HOUSES.splice(i, 1);
    S.fx = S.fx.filter(f => !f.style); S.paused = styleKeep.paused;
    delete MAPS[K]; delete S.ents[K]; delete solidIndex[K]; styleKeep = null; return true;
  }
  if (styleKeep) styleArea(false);
  const w = 38, h = 22, tiles = new Uint8Array(w * h).fill(T.GRASS);
  MAPS[K] = { w, h, tiles }; S.ents[K] = []; solidIndex[K] = new Map();
  const fill = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) tiles[y * w + x] = t; };
  fill(0, 8, w - 1, 9, T.ROAD); fill(1, 10, 12, 11, T.DIRT); fill(14, 10, 19, 12, T.STONE);         // Weg, Erde, Platz
  fill(29, 11, 35, 16, T.ROCK); fill(27, 13, 28, 14, T.ROCK); tiles[18 * w + 33] = T.ROCK;      // Felsmasse + Findling
  fill(19, 17, 26, 21, T.WATER); fill(17, 17, 18, 21, T.MARSH); fill(27, 18, 31, 21, T.SAND);  // Ufer, Sumpf, Sand
  fill(1, 18, 6, 21, T.FIELD); fill(7, 18, 9, 21, T.ASH);
  const hs = [['smithy', 1, 2, 5, 4], ['tavern', 8, 1, 6, 5], ['cottage', 16, 3, 4, 3, 2], ['manor', 22, 1, 5, 5], ['barn', 29, 2, 6, 4, 1]];
  for (const [type, x, y, bw, bh, wear] of hs) {
    fill(x, y, x + bw - 1, y + bh - 1, T.WALL);
    HOUSES.push({ id: 'st' + x, map: K, x, y, w: bw, h: bh, door: 'S', doorTile: [x + (bw >> 1), y + bh - 1], type, town: 'eren', wear, seed: x * 31 + 7 });
  }
  const P = (type, tx, ty, o = {}) => { const e = { id: uid(), kind: 'prop', type, map: K, x: tx * TS + TS / 2, y: ty * TS + TS / 2, r: 12, solid: false, ...o }; S.ents[K].push(e); return e; };
  [0, 1, 2].forEach(v => { P('crate', 1 + v, 13, { v }); P('barrel', 5 + v, 13, { v }); P('rock_node', 29 + v * 2, 19 - 1, { v }); });
  P('crate', 2, 14, { v: 1, opened: true }); P('crate_stack', 9, 13); P('sack', 10, 13); P('chest', 11, 13); P('cart', 13, 14);
  P('campfire', 16, 14); P('torch', 18, 13); P('well', 21, 11); P('stall', 24, 12); P('lantern', 26, 11); P('sign', 20, 13);
  P('ore_node', 36, 18); P('bush', 12, 16); P('flowers_prop', 13, 17); P('dead_tree', 15, 19); P('fence', 1, 16); P('fence', 2, 16);
  [['tree', 8, 16], ['tree', 10, 16], ['tree', 36, 3], ['tree', 36, 7]].forEach(([t, x, y]) => P(t, x, y));
  P('gravestone', 14, 16); P('bones', 12, 19); P('blood', 3, 11);
  const npc = makeChar({ name: 'Magd', prof: 'Bäuerin', map: K, x: 15 * TS, y: 11 * TS }); npc.anchor = { x: npc.x, y: npc.y }; S.ents[K].push(npc);
  const gd = makeChar({ name: 'Wache', prof: 'Wache', map: K, x: 18 * TS, y: 11 * TS, faction: 'valen' }); gd.guard = true; gd.anchor = { x: gd.x, y: gd.y }; S.ents[K].push(gd);
  ['bandit', 'skeleton', 'wolf', 'goblin', 'bandit_archer', 'gorak'].forEach((mt, i) => {
    const e = spawnEnemy(mt, K, 3 + i * 2 + (i > 3 ? 1 : 0), 10); e.x = (3 + i * 2) * TS + TS / 2; e.y = 10 * TS + 8; e.aiState = 'idle'; e.stat = true; });
  const fx = (type, tx, ty, o = {}) => S.fx.push({ x: tx * TS, y: ty * TS, vx: 0, vy: 0, type, s: 2, a: 0, life: 110, maxLife: 200, style: true, ...o });
  ['impact', 'crit', 'spark', 'blood', 'heal', 'fire', 'shock', 'ring', 'necro', 'ghost'].forEach((t, i) => fx(t, 3 + i * 3, 7, t === 'ghost' ? { face: 0 } : {}));
  const p = S.player; styleKeep = { map: S.map, pos: { map: p.map, x: p.x, y: p.y }, paused: S.paused };
  S.ents[p.map].splice(S.ents[p.map].indexOf(p), 1); p.map = K; p.x = 24 * TS; p.y = 10 * TS; S.ents[K].push(p); S.map = K;
  S.paused = true;                                     // Schaubild: Zeit steht, Gegner greifen nicht an
  for (const e of S.ents[K]) if (e.solid) addSolid(e);
  return true;
}
function spawnEnemy(mtype, map, tx, ty, opts = {}) {
  const m = MONSTERS[mtype];
  const pos = freeSpotNear(map, tx, ty, 3);
  const e = {
    id: uid(), kind:'enemy', mtype, map, x: pos.x, y: pos.y, vx:0, vy:0, facing:0, aim:0,
    level: opts.level || Math.max(1, ri(1, 3) + (m.threat || 1) * 2),
    hp: m.hp, maxHp: m.hp, r: m.r, armor: m.threat, alive:true, seed: rnd() * 100,
    swing:0, atkCd:0, telegraph:0, aiState:'idle', aiTimer:0, anchor:{ x: pos.x, y: pos.y },
    weaponKey: { goblin:'dagger', goblin_warrior:'axe', bandit:'rusty_sword', bandit_archer:'shortbow', skeleton:'rusty_sword', crypt_warden:'longsword', hrodvar:'greatsword', valen_soldier:'spear', cultist:'staff' }[mtype] || null,
    shield: mtype === 'goblin_warrior' ? { key:'wooden_shield' } : null,
    faction: m.faction, boss: !!m.boss, ...opts,
  };
  e.maxHp = e.hp = Math.round(m.hp * (1 + e.level * 0.04));
  if (HUMANOID.has(mtype)) { e.build = pick(Object.keys(B.BUILDS)); B.initBody(e, e.maxHp); }   // Menschenähnliche haben Trefferzonen
  S.ents[map].push(e);
  return e;
}

function initialSpawns() {
  for (const a of SPAWN_AREAS) for (let i = 0; i < a.cap * 0.7; i++) {
    const tx = a.x + ri(-a.r, a.r), ty = a.y + ri(-a.r, a.r);
    if (!(a.map === 'world' && townAt(tx, ty, 4))) spawnEnemy(pick(a.types), a.map, tx, ty);   // nie mitten in einer Siedlung
  }
  spawnEnemy('gorak', 'mine', 32, 13, { level: 10 });
  for (let i = 0; i < 3; i++) spawnEnemy('goblin_warrior', 'mine', 30 + i, 14, { level: 6 });
  deepBoss();
}
function deepBoss() {                                         // Tiefhall: Hrodvar vor seinem Thron, zwei Tote der Leibwache
  const t = MAPS.deep.rooms.find(r => r.tag === 'throne');
  spawnEnemy('hrodvar', 'deep', t.cx, t.y + 5, { level: 11 });
  for (const dx of [-3, 3]) spawnEnemy('skeleton', 'deep', t.cx + dx, t.y + 6, { level: 7 });
}

// ================= Neues Spiel =================
export function newGame(cfg) {
  const keep = { settings: S.settings };
  Object.assign(S, {
    ver: SAVE_VERSION, seed: cfg.seed ?? Math.floor(Math.random() * 1e9), day: 1, minute: 8 * 60, season: 'Später Frühling',
    weather: 'clear', weatherLeft: 60, map: 'world', ents: { world: [], mine: [], deep: [] }, party: [], gold: 0,
    res: { wood: 0, stone: 0, iron: 0, herb: 0, food: 3 }, stash: [],
    factions: { valen: 0, order: 0, undead: 0, merch: 0, bandit: 0 }, ranks: { valen: -1, order: -1, undead: -1 },
    quests: {}, chronicle: [], legacy: { house: cfg.house || cfg.name, gen: 1, ancestors: [] },
    settlement: null, flags: { gen2: true, gen3: true, gen4: true, pact1: true, grove1: true, dead1: true, deep1: true, border1: true }, relations: {}, kills: 0, battles: 0, log: [], partyCmd: 'follow',
    settings: keep.settings, fx: [], floats: [], projectiles: [], _uid: 0,
  });
  genWorld().forEach(p => S.ents.world.push(p));
  genMine().forEach(p => S.ents.mine.push(p));
  genDeep().forEach(p => S.ents.deep.push(p));
  for (const m of MAP_KEYS) indexSolids(m);
  spawnNPCs();
  spawnGuardPosts();
  spawnResidents();
  assignNpcDays();
  initialSpawns();
  bindSim(); SIM.initSim();

  const o = ORIGINS[cfg.origin];
  const start = freeSpotNear('world', ...worldPt(66, 70), 3);
  const p = makeChar({ kind:'player', key:'player', name: cfg.name, age: ri(19, 26), x: start.x, y: start.y,
    attrs: baseAttrs(), skills: { ...o.skills },            // Herkunftsbonus wird unten addiert, nicht überschrieben
    traits: [pick(['mutig', 'neugierig', 'diszipliniert', 'ehrgeizig'])],
    origin: o.name, pal: cfg.pal, build: cfg.build || 'ausgewogen' });
  p.attributes = Object.fromEntries(Object.entries(p.attributes).map(([k, v]) => [k, v + (o.attrs[k] || 0)]));
  p.invCap = 24; p.attrPoints = 0; p.hotbar = []; p.skillPoints = 1; p.tree = {};   // ein Talentpunkt zum Start, danach einer je Stufe
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
  SIM.H.hireEscorts = hireEscorts;
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
  R.cam.zoom = R.cam.base = 1.3; R.cam.cz = 0;
  UI.refreshHUD(); UI.renderContext(null);
  running = true; last = performance.now();
  requestAnimationFrame(loop);
  ambience(true);
  save();
}

// Spielstand v2 (512×512) → v3 (Weltmaßstab WS). Props entstehen neu aus der Generierung (Kacheln sind ohnehin neu);
// Truhen und Kisten behalten, was schon herausgenommen wurde (gleicher Typ + Etikett, nächste Lage). Alle anderen Einträge
// der Oberwelt — Spieler, Figuren, Gegner, Gräber, liegende Gegenstände, Karawanen, Lagergebäude — wandern mit der Karte.
// Stadtbewohner entstehen neu (ihre Häuser stehen woanders), Wachen beziehen ihre Posten neu.
function rescaleSave(fresh) {
  const W = S.ents.world, sc = o => { if (o && typeof o.x === 'number' && typeof o.y === 'number') { o.x *= WS; o.y *= WS; } };
  const old = W.filter(e => e.kind === 'prop' && e.loot);
  const keep = W.filter(e => e.kind !== 'prop' && !(e.kind === 'npc' && e.villager && !S.party.includes(e.id)));
  for (const e of keep) {
    sc(e); for (const k of ['anchor', 'wander', 'schedulePos', 'eve', 'target']) sc(e[k]);
    if (Array.isArray(e.home) && typeof e.home[0] === 'number') e.home = e.home.map(v => Math.round(v * WS));
  }
  if (S.player && S.player.map === 'world' && !keep.includes(S.player)) sc(S.player);
  for (const p of fresh) if (p.loot) {                      // Behälter: ausgeräumter Zustand bleibt
    const cand = old.filter(o => o.type === p.type && o.label === p.label).sort((a, b) => Math.hypot(a.x * WS - p.x, a.y * WS - p.y) - Math.hypot(b.x * WS - p.x, b.y * WS - p.y))[0];
    if (cand && Math.hypot(cand.x * WS - p.x, cand.y * WS - p.y) < 6 * TS) { p.loot = cand.loot; p.opened = cand.opened; old.splice(old.indexOf(cand), 1); }
  }
  S.ents.world = [...fresh, ...keep];
  if (S.settlement && (S.settlement.map || 'world') === 'world') sc(S.settlement);
  indexSolids('world');
  for (const e of S.ents.world)
    if (e.kind !== 'prop' && (solidTile('world', e.x, e.y) || solidPropAt('world', e.x, e.y, 4))) { const s = freeSpotNear('world', e.x / TS | 0, e.y / TS | 0, 6); e.x = s.x; e.y = s.y; }
  spawnGuardPosts(); spawnResidents();
  Object.assign(S.flags, { gen2: true, gen3: true, gen4: true, pact1: true, grove1: true, dead1: true, rescale: false });
  log('Die Welt ist weiter geworden. (Spielstand auf die größere Karte umgerechnet.)', 'world');
}
export function continueGame() {
  const data = loadRaw(); if (!data) return;
  const gone = data.propsGone; delete data.propsGone;
  applySave(data);
  seedRng(S.seed);
  const fresh = genWorld(), FRESH = { world: fresh, mine: genMine(), deep: genDeep() };   // Kacheln (+ Gebäudedaten) und Grundzustand der Props …
  for (const m of MAP_KEYS) S.ents[m] ||= [];
  for (const m of MAP_KEYS) if (gone?.[m]) mergeProps(m, FRESH[m], gone[m]);   // … Abweichungen stehen im Spielstand
  if (S.flags?.rescale) rescaleSave(fresh);
  if (!(S.flags ||= {}).gen2) {                // … außer in Siedlungen: dort gilt die neue Ausstattung (Möbel, Warenstapel statt Zufallskisten)
    const R = [[50, 56, 72, 74], [112, 50, 126, 63], [138, 438, 164, 464], [240, 240, 262, 258], [372, 84, 388, 100], [446, 246, 466, 266]];
    const inTown = e => e.kind === 'prop' && !e.loot && R.some(([a, b, c, d]) => e.x / TS >= a && e.x / TS < c && e.y / TS >= b && e.y / TS < d);
    S.ents.world = S.ents.world.filter(e => !inTown(e));
    for (const p of fresh) if (inTown(p)) S.ents.world.push(p);
    S.flags.gen2 = true;
  }
  if (!S.flags.gen3) {                         // Städteausbau (Session 2): Kacheln sind schon neu, Props der Siedlungen auch
    const inR = (r, e) => { const x = e.x / TS | 0, y = e.y / TS | 0; return x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]; };
    const P = Object.values(TOWN_PLAN);
    const repl = e => e.kind === 'prop' && (e.map || 'world') === 'world' && P.some(t => inR(t.area, e) && (!e.loot || !inR(t.old, e)));
    S.ents.world = S.ents.world.filter(e => !repl(e) && !(e.kind === 'enemy' && !e.boss && !e.aggroId && townAt(e.x / TS | 0, e.y / TS | 0)));   // Banden, die früher in der Stadt spawnten, sind fort
    for (const p of fresh) if (repl(p)) S.ents.world.push(p);
    indexSolids('world');
    for (const e of S.ents.world)                // wer jetzt in einer Mauer/einem Möbel stünde, tritt heraus
      if (e.kind !== 'prop' && (solidTile('world', e.x, e.y) || solidPropAt('world', e.x, e.y, 4))) { const s = freeSpotNear('world', e.x / TS | 0, e.y / TS | 0, 5); e.x = s.x; e.y = s.y; }
    spawnGuardPosts(); spawnResidents();
    S.flags.gen3 = true;
  }
  if (!S.flags.gen4) {                         // Streckung der Siedlungen (Session 4): Stadt-Props und Bewohner neu, Truhen behalten ihren Inhalt
    const P = Object.values(TOWN_PLAN), inR = (r, x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
    const inAny = e => { const x = e.x / TS | 0, y = e.y / TS | 0; return (e.map || 'world') === 'world' && P.some(t => inR(t.area, x, y) || inR(t.design.area, x, y)); };
    const chests = S.ents.world.filter(e => e.kind === 'prop' && e.loot && inAny(e));
    S.ents.world = S.ents.world.filter(e => !(e.kind === 'prop' && inAny(e)) && !(e.kind === 'npc' && e.villager && !S.party.includes(e.id))
      && !(e.kind === 'enemy' && !e.boss && !e.aggroId && townAt(e.x / TS | 0, e.y / TS | 0)));
    for (const p of fresh) if (p.kind === 'prop' && inAny(p)) {
      const old = p.loot && chests.find(k => k.type === p.type && k.label === p.label);
      if (old) { old.x = p.x; old.y = p.y; chests.splice(chests.indexOf(old), 1); S.ents.world.push(old); } else S.ents.world.push(p);
    }
    indexSolids('world');
    for (const e of S.ents.world)
      if (e.kind !== 'prop' && (solidTile('world', e.x, e.y) || solidPropAt('world', e.x, e.y, 4))) { const s = freeSpotNear('world', e.x / TS | 0, e.y / TS | 0, 5); e.x = s.x; e.y = s.y; }
    spawnGuardPosts(); spawnResidents();
    S.flags.gen4 = true;
  }
  S.player = byId(S.player.id) || S.ents.world.find(e => e.kind === 'player') || S.player;
  if (!S.ents[S.map].includes(S.player)) S.ents[S.map].push(S.player);
  if (S.settlement) S.settlement.buildings = S.ents[S.settlement.map || 'world'].filter(e => e.kind === 'building');
  S.relations ||= {}; S.flags ||= {};
  S.party = S.party.filter(id => byId(id));
  if (!S.flags.border1) {                      // Session 6: Grenzöde — Grenzwacht, Hundertfeld, Straße; was dort stand, räumt die Szene
    const [ax, ay] = worldPt(322, 342), [bx, by] = worldPt(339, 357), [rx] = worldPt(330, 250), [, ry0] = worldPt(330, 250), [, ry1] = worldPt(330, 361);
    const clear = e => { const x = e.x / TS | 0, y = e.y / TS | 0; return (x >= ax && x <= bx && y >= ay && y <= by) || (x >= rx && x <= rx + 3 && y >= ry0 && y <= ry1); };
    const have = new Set(S.ents.world.map(e => e.gk).filter(Boolean));
    S.ents.world = S.ents.world.filter(e => !(e.kind === 'prop' && !e.borderScene && clear(e)));
    for (const p of fresh) if (p.borderScene && !have.has(p.gk)) S.ents.world.push(p);
    indexSolids('world'); spawnGuardPosts(); S.flags.border1 = true;
  }
  if (!S.flags.deep1) {                        // Session 6: Tiefhall betretbar — Karte, Hort drinnen, Hrodvar; der Eingang wird Portal
    S.ents.deep = FRESH.deep.slice(); indexSolids('deep');
    S.ents.world = S.ents.world.filter(e => !(e.kind === 'prop' && e.type === 'chest' && e.label === 'Tiefhall-Hort' && !e.opened));   // der Hort lag draußen; ungeöffnet zieht er hinein
    for (const e of S.ents.world) if (e.kind === 'prop' && e.type === 'mine_entrance' && e.label === 'Tiefhall') e.portal = 'deep';
    for (const a of SPAWN_AREAS) if (a.map === 'deep') for (let i = 0; i < a.cap * 0.7; i++) spawnEnemy(pick(a.types), 'deep', a.x + ri(-a.r, a.r), a.y + ri(-a.r, a.r));
    deepBoss(); S.flags.deep1 = true;
  }
  for (const m of MAP_KEYS) for (const e of S.ents[m]) {
    if (e.kind === 'prop') { delete e.act; delete e.hexed; delete e.rooted; continue; }   // Props handeln nicht; alte Stände trugen die Felder (sonst weicht jedes Prop vom Grundzustand ab)
    e.act = null; e.hexed = 0; e.rooted = 0;       // Zeitstempel (performance.now) sind nach dem Laden wertlos
    if ((e.kind === 'npc' || e.kind === 'player') && !e.body) { const r = e.hp / (e.maxHp || 1); e.build ||= 'ausgewogen'; recalc(e); for (const k of B.PARTS) e.body[k].hp = e.body[k].max * r; B.syncHp(e); }
    if (e.kind === 'enemy' && !e.body && HUMANOID.has(e.mtype)) { e.build = 'ausgewogen'; B.initBody(e, e.maxHp); }
  }
  S.player = byId(S.player.id) || S.player;
  Object.assign(S.player, { dodge: null, dodgeCd: 0, invuln: false, channel: null });   // Zeitstempel alter Stände sind wertlos
  if (S.player.skillPoints == null) { S.player.skillPoints = Math.max(0, S.player.level - 1); S.player.tree ||= {}; recalc(S.player); }   // Skill-Baum für alte Stände: Punkte rückwirkend
  for (const def of NPCS) { const e = S.ents.world.find(x => x.key === def.key);   // Handelsdaten aus den Daten nachziehen (neue Läden, Warenpools)
    if (e) for (const k of ['shop', 'pool', 'town', 'market', 'smith', 'teaches']) if (def[k] !== undefined) e[k] = def[k]; }
  for (const def of NPCS) if (!S.ents.world.some(e => e.key === def.key) && ['gerold', 'ysra', 'vhal', 'mira', 'sael', 'brann', 'ilva', 'oda', 'lioba', 'quirin'].includes(def.key)) spawnNpcDef(def);
  if (!S.flags.grove1) { for (const p of fresh) if (p.groveScene) S.ents.world.push(p); S.flags.grove1 = true; }   // Session 5: der Alte Hain
  if (!S.flags.dead1) {                         // Session 5: erweitertes Totenreich — Szenen, Vharnholm (Props, Bewohner, Wachen)
    const A = TOWN_PLAN.vharnholm.area, inV = e => { const x = e.x / TS | 0, y = e.y / TS | 0; return x >= A[0] && x <= A[2] && y >= A[1] && y <= A[3]; };
    S.ents.world = S.ents.world.filter(e => !(e.kind === 'prop' && inV(e)) && !(e.kind === 'enemy' && !e.aggroId && townAt(e.x / TS | 0, e.y / TS | 0, 4) === 'vharnholm'));
    for (const p of fresh) if (p.deadScene || (p.kind === 'prop' && inV(p))) S.ents.world.push(p);
    indexSolids('world'); spawnGuardPosts(); spawnResidents(); S.flags.dead1 = true;
  }
  if (!S.flags.pact1) {                        // Session 4: Orte des Paktes im Totenreich; die Gruft der Nekropole wird zum Ritualort
    for (const p of fresh) if (p.pactScene) S.ents.world.push(p);
    for (const e of S.ents.world) if (e.kind === 'prop' && e.type === 'crypt' && e.label === 'Große Nekropole') e.rite = 'urn';
    S.flags.pact1 = true;
  }
  for (const c of [S.player, ...S.ents.world.filter(e => e.kind === 'npc')]) if (c?.knownClasses?.includes('warlock')) {   // Hexenmeister war eine Grundklasse
    c.knownClasses = c.knownClasses.filter(k => k !== 'warlock'); if (!c.knownClasses.length) c.knownClasses.push(c === S.player ? 'wanderer' : 'mage');   // NPC-Zauberer bleiben Magier
    if (c.currentClass === 'warlock') { c.currentClass = c.knownClasses.includes('mage') ? 'mage' : c.knownClasses[0] || 'wanderer'; c.abilities = [...(CLASSES[c.currentClass].abilities || [])]; }
    if (c === S.player) { (c.titleClasses ||= []).includes('warlock') || c.titleClasses.push('warlock'); c.titleClass = 'warlock'; c.pal = { ...c.pal, glow: TITLE_CLASSES.warlock.glow }; }
    recalc(c); if (c === S.player) syncHotbar();
  }
  for (const m of MAP_KEYS) if (!gone?.[m]) adoptPropKeys(m, FRESH[m]);   // alte Vollstände: ab jetzt nur Abweichungen speichern
  bindSim(); SIM.initSim();
  for (const m of MAP_KEYS) indexSolids(m);
  assignNpcDays();                             // Tagesablauf der Figuren mit Namen (auch für alte Stände; nach dem Objekt-Index)
  if (!S.ents.world.some(e => e.post)) spawnGuardPosts();       // ältere Stände: Wachposten nachrüsten (nach dem Objekt-Index)
  log('Die Welt erinnert sich.', 'world');
  startGame();
}

// ================= Schleife =================
let hitStop = 0, ambT = 0;
function loop(now) {
  if (!running) return;
  const dt = Math.min(50, now - last); last = now;
  requestAnimationFrame(loop);                              // zuerst: ein Fehler darf die Schleife nicht beenden
  try {
    if (hitStop > 0) hitStop -= dt;                             // Hit-Stop: Welt steht kurz, Bild läuft weiter
    else if (!S.paused) update(dt, now);
    R.drawFrame(now);
  }
  catch (err) { if (!loop.failed) { loop.failed = true; console.error(err); log('Interner Fehler: ' + err.message, 'world'); } }
}

let hudTimer = 0, simTimer = 0, respawnTimer = 0, lastHour = -1, lastDay = 1, travelTimer = 0, encCooldown = 0, pursuitT = 0;
let lastHouse = null;
const clock = () => S.day * 1440 + S.minute;
const hourNow = () => S.minute / 60;                  // Spieluhr in Spielminuten (1 s Echtzeit = 1 min), wird gespeichert
function update(dt, now) {
  const p = S.player;
  // Zeit
  if (!DBG.freeze) S.minute += dt / 1000;
  if (DBG.stam && p) { p.stamina = p.maxStamina; p.mana = p.maxMana; }
  if (S.minute >= 1440) { S.minute -= 1440; S.day++; }
  S.weatherLeft -= dt / 1000;
  if (S.weatherLeft <= 0) {
    S.weather = pick(['clear', 'clear', 'cloudy', 'cloudy', 'rain', 'fog']);
    S.weatherLeft = ri(120, 420);
  }
  const hour = Math.floor(S.minute / 60);
  if (hour !== lastHour) { lastHour = hour; hourTick(hour); }
  if (S.day !== lastDay) { lastDay = S.day; dayTick(); }

  // Kämpfer im Umkreis des Spielers (simuliert wird nur bis 1100 px, Sicht reicht höchstens ~500 px weiter).
  // Einmal je Frame statt je NPC/Gegner über alle ~300 Kämpfer der Welt zu suchen.
  combat = S.ents[S.map].filter(e => e.alive && COMBAT_KINDS.has(e.kind) && Math.abs(e.x - p.x) < 1700 && Math.abs(e.y - p.y) < 1700);
  for (const c of S.ents.world) if (c.kind === 'caravan' && c.alive) {
    const near = performance.now() - (c.lastHurt || -1e9) < 4000;          // hält nur, solange sie angegriffen wird
    SIM.caravanFrame(c, dt, p, near);
    if (!c.crew) hireEscorts(c);                                           // alter Spielstand: Zug ohne Wachen
    // Wachen außer Sicht (updateNpc denkt erst ab 900 px): sie gehen auf ihrem Platz mit, statt am Wegrand stehen zu bleiben
    if (p.map !== 'world' || dist(c, p) > 1000) for (const e of escortsOf(c)) if (!e.downed && (p.map !== 'world' || dist(e, p) > 900)) {
      const q = SIM.escortSlot(c, e.slot); e.x = q.x; e.y = q.y; e.anchor = { x: q.x, y: q.y }; e.vx = e.vy = 0; e.wander = null; e.threatId = null;
    }
  }
  if (p.alive) controlPlayer(dt);
  for (const e of [...S.ents[S.map]]) think(e, dt);
  if (S.rising && S.rising.length) {                              // Wiedergänger: Zucken als Ansage, nach 6 Spielminuten steht er auf
    const now = clock();
    for (let i = S.rising.length - 1; i >= 0; i--) { const r = S.rising[i];
      if (r.map === S.map && chance(dt / 400)) fx(r.x + ri(-6, 6), r.y - 4, 'necro', 2);
      if (now < r.at) continue;
      S.rising.splice(i, 1);
      const arr = S.ents[r.map], ci = arr.findIndex(e => e.kind === 'corpse' && e.mtype === 'ghoul' && Math.hypot(e.x - r.x, e.y - r.y) < 20); if (ci >= 0) arr.splice(ci, 1);
      const g = spawnEnemy('ghoul', r.map, r.x / TS | 0, r.y / TS | 0, { level: r.level, risen: true }); g.x = r.x; g.y = r.y;
      if (r.map === S.map && dist(g, S.player) < 600) log('Der Wiedergänger steht wieder auf.', 'combat');
    }
  }
  pursuitT = (pursuitT || 0) + dt;
  if (pursuitT > 250) { pursuitT = 0; arrivingPursuers(); }
  updateProjectiles(dt);
  updateFx(dt);
  updateBuildings(dt);
  // Kamera
  const V = R.view();
  // Kampf-Zoom: rückt sanft ~8 % heran, solange ein Feind nahe und auf den Spieler aus ist; langsam zurück.
  const engaged = S.settings.motion && combat.some(e => e.kind === 'enemy' && e.alive && isHostile(p, e) && dist(p, e) < 240 && (e.aggroId === p.id || e.aiState === 'pursue'));
  R.cam.cz = (R.cam.cz || 0) + ((engaged ? 0.08 : 0) - (R.cam.cz || 0)) * Math.min(1, dt / (engaged ? 700 : 1400));
  R.cam.zoom = (R.cam.base || 1.3) * (1 + R.cam.cz);
  const look = S.settings.motion ? 0.14 : 0;                    // Blickvorlauf zur Maus (max. ~40 px)
  const lx = clamp((mouse.wx - p.x) * look, -40, 40), ly = clamp((mouse.wy - p.y) * look, -30, 30);
  const tx = p.x + lx - V.W / (2 * R.cam.zoom), ty = p.y + ly - V.H / (2 * R.cam.zoom);
  R.cam.punch = Math.max(0, (R.cam.punch || 0) - dt * 0.00025);
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
    if (DUNGEONS[S.map]) (S.flags.seen ||= {})[S.map] = true;
    const inHouse = HOUSES.find(b => b.map === S.map && R.playerInside(b)) || null;   // Gebäude betreten: kurz benennen
    if (inHouse !== lastHouse) { lastHouse = inHouse; if (inHouse) UI.toast(`${HB.BTYPES[inHouse.type].label} · ${LOCATIONS.find(l => l.key === inHouse.town)?.name || ''}`, 1600); }
  }
  ambT = (ambT || 0) + dt;
  if (ambT > 1000) {                                              // regionale Umgebungsgeräusche
    ambT = 0; const tx = p.x / TS | 0, ty = p.y / TS | 0, here = locAt(tx, ty), h = S.minute / 60;
    ambienceTick(DUNGEONS[S.map] ? DUNGEONS[S.map].amb : regionAt(tx, ty), h > 6 && h < 20, !!here && (here.kind === 'village' || here.kind === 'city'));
  }
  respawnTimer += dt;
  if (respawnTimer > 12000) { respawnTimer = 0; respawnTick(); }
  simTimer += dt;
  if (simTimer > 4000) { simTimer = 0; questCheck(); if (S.map === 'world') SIM.battleCheck(); }
  travelTimer += dt;
  if (travelTimer > 6000) { travelTimer = 0; travelTick(); }
}

// Eine Entität einen Schritt denken lassen. Einziger Einstieg in die KI: wer am Boden liegt oder tot ist, entscheidet nichts.
function think(e, dt) {
  if (!e.alive) return;
  if (e.downed) { e.vx = e.vy = 0; }                          // am Boden: keine KI, keine Bewegung
  else if (e.stagger > 0 && e !== S.player && !S.party.includes(e.id)) { e.vx = e.vy = 0; }   // taumelt: keine Entscheidung
  else if (e.kind === 'enemy') updateEnemy(e, dt);
  else if (e.kind === 'npc') updateNpc(e, dt);
  if (e.kind === 'enemy' || e.kind === 'npc' || e.kind === 'player') tickCombatant(e, dt);
}

// ================= Reise-Begegnungen =================
// Unterwegs in der Wildnis soll ständig etwas passieren: Hinterhalte je nach Biom,
// fahrende Händler, Reisende. Nur fern der Städte, nur wenn der Spieler wirklich reist.
const AMBUSH_BY_TILE = {
  [T.ASH]: ['skeleton', 'skeleton', 'goblin_warrior'],
  [T.SAND]: ['bandit', 'bandit_archer', 'goblin_warrior'],
  [T.MARSH]: ['skeleton', 'goblin', 'wolf'],
  [T.ROCK]: ['wolf', 'goblin_warrior'], [T.STONE]: ['wolf', 'goblin_warrior'],
};
function regionThreat(tx, ty) {
  const here = locAt(tx, ty); if (here) return here.threat;
  let bt = 1, bd = 1e9;
  for (const l of LOCATIONS) { const d = Math.hypot(l.x - tx, l.y - ty); if (d < bd) { bd = d; bt = l.threat; } }
  return Math.max(1, bt - 1);
}
function travelTick() {
  const p = S.player;
  if (S.map !== 'world' || !p.alive || p.downed) return;
  if (performance.now() < encCooldown) return;
  const tx = p.x / TS | 0, ty = p.y / TS | 0;
  const here = locAt(tx, ty);
  if (here && (here.kind === 'village' || here.kind === 'city')) return;   // in Siedlungen nicht
  const [sx0, sy0] = worldPt(66, 70);
  if (Math.hypot(tx - sx0, ty - sy0) < 30 * WS) return;                     // Startgebiet verschonen
  const moving = Math.abs(p.vx) > 0.05 || Math.abs(p.vy) > 0.05;
  if (!moving) return;
  const threat = regionThreat(tx, ty);
  if (!chance(0.12 + threat * 0.05)) return;
  // Ruhe-Regel (GDD §Spawns): Heimat ruhig, Wildnis mittel, Totenreich dicht
  encCooldown = performance.now() + ({ greenmark: 40000, blight: 14000, badland: 20000 }[regionAt(tx, ty)] || 26000);
  const dir = Math.atan2(p.vy, p.vx) + (rnd() - 0.5);                       // grob in Reiserichtung
  const V = R.view(), far = Math.ceil((Math.hypot(V.W, V.H) / (2 * R.cam.zoom) + 48) / TS);   // knapp außerhalb des Bildes, nicht vor der Nase
  const ox = Math.round(Math.cos(dir) * ri(far, far + 3)), oy = Math.round(Math.sin(dir) * ri(far, far + 3));
  const roll = rnd();
  if (roll < 0.6) {                                                         // Hinterhalt
    const types = AMBUSH_BY_TILE[tileAt('world', tx, ty)] || ['wolf', 'goblin', 'bandit'];
    const n = ri(1, 2 + Math.floor(threat / 2));
    for (let i = 0; i < n; i++) { const e = spawnEnemy(pick(types), 'world', tx + ox + ri(-2, 2), ty + oy + ri(-2, 2)); if (e) { e.encounter = true; e.aggroId = p.id; e.aiState = 'pursue'; } }
    log('Aus dem Gelände treten Feinde hervor.', 'combat'); UI.toast('ÜBERFALL', 2600);
  } else if (roll < 0.82) {                                                 // fahrender Händler
    const pos = freeSpotNear('world', tx + ox, ty + oy, 3);
    const c = makeChar({ name: 'Fahrender Händler', prof: 'Händler', x: pos.x, y: pos.y, level: ri(3, 6),
      traits: ['klug', 'praktisch'], greet: '„Weit weg von jeder Stadt — genau da braucht man einen Händler.“' });
    c.shop = true; c.brave = true; c.encounter = true; c.anchor = { x: pos.x, y: pos.y };
    c.equip.weapon = mkItem('dagger'); S.ents.world.push(c);
    log('Ein fahrender Händler kreuzt deinen Weg.', 'world'); UI.toast('Fahrender Händler', 2400);
  } else {                                                                  // Reisender (Gerücht)
    const pos = freeSpotNear('world', tx + ox, ty + oy, 3);
    const c = makeChar({ name: pick(['Reisender', 'Pilgerin', 'Bote', 'Wanderin']), prof: 'Reisender', x: pos.x, y: pos.y, level: ri(1, 4),
      traits: [pick(['furchtsam', 'neugierig', 'müde'])], greet: '„Die Straßen sind nicht mehr sicher. Aber wann waren sie das je.“' });
    c.brave = false; c.encounter = true; c.anchor = { x: pos.x, y: pos.y };
    S.ents.world.push(c);
  }
}

let shake = 0, shakeT = 0;
function camShake(amount, ms) { if (!S.settings.motion) return; shake = amount; shakeT = ms; }

function tickCombatant(c, dt) {
  if (!c.alive) return;
  if (c.kb) {                                     // Rückstoß ausrollen (abklingend), Blickrichtung bleibt
    const k = Math.min(dt, c.kb.t) / c.kb.T * 2 * (c.kb.t / c.kb.T), f = c.facing;
    moveEnt(c, c.kb.x * k, c.kb.y * k); c.facing = f;
    c.kb.t -= dt; if (c.kb.t <= 0) c.kb = null;
  }
  if (c.stagger > 0) c.stagger -= dt;
  if (c.swing > 0 && !c.downed) {
    c.swing += dt / (c.swingDur || 500);
    if (!c.hitDone && c.swing >= 0.42) {
      c.hitDone = true;
      const L = feelOf(c).lunge, f = c.facing;                  // Ausfallschritt: der Schlag hat Gewicht
      if (L && !c.downed && c.mtype !== 'wolf' && c.mtype !== 'boar') { moveEnt(c, Math.cos(c.aim) * L, Math.sin(c.aim) * L); c.facing = f; }
      resolveSwing(c);
    }
    if (c.swing >= 1) { c.swing = 0; c.hitDone = false; }
  }
  c.atkCd = Math.max(0, c.atkCd - dt);
  if (c.telegraph > 0) c.telegraph -= dt;
  for (const k of Object.keys(c.cooldowns || {})) c.cooldowns[k] = Math.max(0, c.cooldowns[k] - dt);
  const resting = !c.vx && !c.vy;
  if (!c.cover) c.stamina = Math.min(c.maxStamina, c.stamina + dt / 1000 * (resting ? 12 : 5) * (1 + tfx(c, 'regen') + (node(c, 'k_wild') && outside(c) ? 0.5 : 0) + (stat(c, 'song') ? 0.5 : 0)));
  if (c.maxMana) c.mana = Math.min(c.maxMana, c.mana + dt / 1000 * 2.2 * (1 + tfx(c, 'manaRegen')));
  if (c === S.player && c.titleClass) titleTick(c, dt);
  // Statuszeiten
  if (c.status && c.status.length) {
    for (const s of c.status) { s.left -= dt; if (s.key === 'bleeding' && chance(dt / 2500)) hurt(c, 2, null, 'Blutung');
      if (s.key === 'regrowth') B.heal(c, s.heal * dt / 1000);
      if (s.key === 'poisoned') { s.acc = (s.acc || 0) + dt / 1000 * 4; if (s.acc >= 1) { const n = Math.floor(s.acc); s.acc -= n; hurt(c, n, null, 'Gift'); } } }
    c.status = c.status.filter(s => s.left > 0);
  }
  if (c.downed && B.vital(c) > 0) { c.downed = false; act(c, 'rise', 520); log(`${c.name} kommt wieder auf die Beine.`, 'party'); }   // geheilt = steht auf
  if (c.downed) {
    c.downTimer -= dt;
    if (c.downTimer <= 0) die(c, c.lastCause || 'Wunden', c.lastKiller);
    else if (c !== S.player) {                                // nur wer nicht verfeindet ist, hilft auf
      const helper = [S.player, ...partyMembers()].find(h => h !== c && h.alive && !h.downed && !c.angry && !isHostile(h, c) && dist(h, c) < 40);
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
  if (DBG.noclip && e === S.player) { e.x += dx; e.y += dy; e.vx = dx; e.vy = dy; if (Math.abs(dx) > Math.abs(dy)) e.facing = dx > 0 ? 3 : 2; else if (dy) e.facing = dy > 0 ? 0 : 1; return; }
  // Wer schon in einem festen Objekt steckt (alter Spielstand, Rückstoß), darf sich herausbewegen — nur nicht tiefer hinein
  const blockedBy = (x, y) => { const q = solidPropAt(e.map, x, y, r);   // nur bei Blockade prüfen: stehe ich schon drin und will heraus?
    return q && !(solidPropAt(e.map, e.x, e.y, r) === q && Math.hypot(x - q.x, y - q.y) > Math.hypot(e.x - q.x, e.y - q.y)); };
  if (dx) {
    const nx = e.x + dx;
    if (!solidTile(e.map, nx + Math.sign(dx) * r, e.y) && !blockedBy(nx, e.y)) e.x = nx;
  }
  if (dy) {
    const ny = e.y + dy;
    if (!solidTile(e.map, e.x, ny + Math.sign(dy) * r) && !blockedBy(e.x, ny)) e.y = ny;
  }
  e.vx = dx; e.vy = dy;
  if (Math.abs(dx) > Math.abs(dy)) e.facing = dx > 0 ? 3 : 2; else if (dy) e.facing = dy > 0 ? 0 : 1;
}

// Zielgerichtetes Gehen: geradeaus, solange es geht (billig, sieht natürlich aus). Blockiert eine Mauer/ein Baum und ist
// ein Ziel bekannt, sucht A* auf dem Kachelraster einen Weg (gecacht, max. 3 s bzw. bis das Ziel 2 Kacheln weiterzieht).
// Ohne Ziel (Flucht, Seitschritt) wird seitlich in 35°-Schritten getastet und die gefundene Seite kurz beibehalten.
function seek(e, a, sp, dt = 16, goal = null) {
  if (e.path && (!goal || (e.path.t -= dt) <= 0 || Math.hypot(goal.x - e.path.gx, goal.y - e.path.gy) > 64 || e.path.i >= e.path.pts.length)) e.path = null;
  if (e.path) {
    const wp = e.path.pts[e.path.i];
    if (Math.hypot(wp.x - e.x, wp.y - e.y) < 12) e.path.i++;
    a = Math.atan2(wp.y - e.y, wp.x - e.x);
  } else if (e.detour) { e.detour.t -= dt; if (e.detour.t <= 0) e.detour = null; else a += e.detour.off; }
  const x0 = e.x, y0 = e.y;
  moveEnt(e, Math.cos(a) * sp, Math.sin(a) * sp);
  if (Math.hypot(e.x - x0, e.y - y0) > sp * 0.5) return;
  if (e.path) { e.path = null; e.pathFail = performance.now() + 600; }   // Wegpunkt klemmt (Objektkante): kurz seitlich tasten
  else if (goal && !(e.pathFail > performance.now())) {
    const pts = findPath(e.map, e.x, e.y, goal.x, goal.y);
    if (pts) { e.path = { pts, i: 0, t: 3000, gx: goal.x, gy: goal.y }; return; }
    e.pathFail = performance.now() + 1000;                        // kein Weg: nicht jede Frame neu rechnen
  }
  const side = e.detourSide || (chance(0.5) ? 1 : -1);
  for (const k of [1, 2, 3]) for (const s of [side, -side]) {
    const off = s * k * 0.6;
    e.x = x0; e.y = y0; moveEnt(e, Math.cos(a + off) * sp, Math.sin(a + off) * sp);
    if (Math.hypot(e.x - x0, e.y - y0) > sp * 0.5) { e.detourSide = s; e.detour = { off, t: 450 }; return; }
  }
  e.detourSide = -side;                                          // ganz eingekeilt: nächstes Mal die andere Seite
}

// A* auf dem Kachelraster, begrenzt auf ein Fenster um Start und Ziel (±14 Kacheln, höchstens 56×56).
// Blockiert: feste Kacheln und Kacheln mit festen Objekten (Bäume, Felsen, Gebäude). Diagonalen nur ohne Eckenschneiden.
function findPath(map, x0, y0, x1, y1) {
  const sx = x0 / TS | 0, sy = y0 / TS | 0, gx = x1 / TS | 0, gy = y1 / TS | 0;
  const minX = Math.max(0, Math.min(sx, gx) - 14), minY = Math.max(0, Math.min(sy, gy) - 14);
  const W = Math.min(56, Math.max(sx, gx) + 14 - minX + 1), H = Math.min(56, Math.max(sy, gy) + 14 - minY + 1);
  if (gx - minX >= W || gy - minY >= H) return null;              // Ziel außerhalb des Fensters: zu weit für eine lokale Suche
  const idx = solidIndex[map];
  const blocked = (i, j) => { const tx = i + minX, ty = j + minY;
    if (i < 0 || j < 0 || i >= W || j >= H || SOLID.has(tileAt(map, tx, ty))) return true;
    const arr = idx && idx.get(tx + ',' + ty); return !!(arr && arr.length) && !(tx === gx && ty === gy); };
  const N = W * H, g = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap = [], push = (k, f) => { heap.push([f, k]); let i = heap.length - 1;
    while (i > 0) { const q = (i - 1) >> 1; if (heap[q][0] <= heap[i][0]) break; [heap[q], heap[i]] = [heap[i], heap[q]]; i = q; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0;
    for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
      if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top[1]; };
  const s = (sy - minY) * W + (sx - minX), goalK = (gy - minY) * W + (gx - minX);
  const hh = k => { const i = k % W, j = (k / W) | 0; const dx = Math.abs(i - (gx - minX)), dy = Math.abs(j - (gy - minY)); return Math.max(dx, dy) + 0.41 * Math.min(dx, dy); };
  g[s] = 0; push(s, hh(s));
  let steps = 0;
  while (heap.length && steps++ < 2400) {
    const k = pop(); if (closed[k]) continue; closed[k] = 1;
    if (k === goalK) {
      const pts = []; for (let c = k; c !== s && c >= 0; c = from[c]) pts.push({ x: (c % W + minX) * TS + TS / 2, y: (((c / W) | 0) + minY) * TS + TS / 2 });
      return pts.reverse();
    }
    const i = k % W, j = (k / W) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj;
      if (blocked(ni, nj) || (di && dj && (blocked(i + di, j) || blocked(i, j + dj)))) continue;
      const nk = nj * W + ni, ng = g[k] + (di && dj ? 1.41 : 1);
      if (ng < g[nk]) { g[nk] = ng; from[nk] = k; push(nk, ng + hh(nk)); }
    }
  }
  return null;
}

function controlPlayer(dt) {
  const p = S.player;
  if (p.downed) { p.vx = p.vy = 0; return; }
  p.dodgeCd = Math.max(0, (p.dodgeCd || 0) - dt);
  if (p.dodge) {                                            // Ausweichrolle: feste Dauer, unverwundbar, keine Steuerung
    const d = p.dodge, ease = k => 1 - (1 - k) * (1 - k);      // schneller Antritt, weiches Auslaufen
    const L = d.dist || DODGE.dist, U = d.dur || DODGE.dur;   // Hundert Schritte: weiter und länger
    const sp = L * (ease(Math.min(1, (d.t + dt) / U)) - ease(d.t / U));
    moveEnt(p, d.ax * sp, d.ay * sp);
    d.t += dt;
    if (d.dash) for (const f of combat) if (f.alive && !f.downed && isHostile(p, f) && !d.dash.hit.includes(f.id) && dist(p, f) < 36 + (f.r || 10)) {
      d.dash.hit.push(f.id); hit(p, f, d.dash.mult); f.stagger = Math.max(f.stagger || 0, 350);
    }
    if (d.t % 55 < dt) S.fx.push({ x: p.x, y: p.y, vx: 0, vy: 0, type: 'ghost', s: 1, life: 220, maxLife: 220, face: p.facing });
    if (!d.dash && d.t >= U - 40) p.invuln = false;                   // die letzten 40 ms (Landung) sind verwundbar — i-Frames sind die Rolle, nicht das Aufstehen
    if (d.t >= U) { p.dodge = null; p.invuln = false; if (!d.dash) { p.landT = performance.now() + 110; fx(p.x, p.y + 4, 'dust', 4); } }
    return;
  }
  if (p.landT > performance.now()) {                                // Landung: kurz in den Knien, halbes Tempo, kein Hieb
    const { dx, dy } = moveInput(), l = Math.hypot(dx, dy);
    if (l) moveEnt(p, dx / l * speedOf(p) * dt / 32, dy / l * speedOf(p) * dt / 32);
    p.aim = Math.atan2(mouse.wy - p.y + 12, mouse.wx - p.x);
    return;
  }
  const { dx, dy } = moveInput();
  tickChannel(p, dt, dx || dy);
  if (p.channel) { p.vx = p.vy = 0; p.aim = Math.atan2(mouse.wy - p.y + 12, mouse.wx - p.x); return; }
  updateGuard(p, keys.has('shift') || touch.guard);
  if (dx || dy) {
    const l = Math.hypot(dx, dy), sp = speedOf(p) * dt / 16 * (p.cover ? 0.45 : p.reloadUntil > performance.now() ? 0.6 : 1);   // Deckung: kleine Schritte; Armbrust spannen: langsam
    moveEnt(p, dx / l * sp, dy / l * sp);
    p.stamina = Math.max(0, p.stamina - dt / 1000 * 1.2);
    p.stepT = (p.stepT || 0) + dt; if (p.stepT > 300) { p.stepT = 0; sfx('step'); }
  } else { p.vx = p.vy = 0; }
  if (touch.on) touchAim(p);
  p.aim = Math.atan2(mouse.wy - p.y + 12, mouse.wx - p.x);
  if (!p.cover && (mouse.down || keys.has(' ') || touch.attack)) { p.forceStrike = keys.has('control') || keys.has('ctrl'); attack(p); }
  // Dungeon-Fallen
  const haz = S.ents[S.map].find(e => e.hazard && dist(e, p) < 18 && (!e.lastHit || performance.now() - e.lastHit > 1500));
  if (haz) { haz.lastHit = performance.now(); hurt(p, haz.hazard, null, 'Fallgrube'); camShake(6, 160); }
}

// ================= Kampf =================
// Waffengefühl: Gewicht (Klang/Sweep), Hit-Stop (ms), Kamerawackeln, Ausfallschritt beim Schlag (px).
// w: Gewicht (Hit-Stop, Wackeln, Rückstoß), stag: Taumeln des Getroffenen. Ab stag ≥ 0.6 unterbricht ein Treffer die
// Angriffsvorbereitung des Gegners (Axt, Kolben, Zweihänder) — leichte Waffen treffen oft, schwere brechen Angriffe.
const FEEL = {
  dagger: { w: 0.05, stop: 28, shake: 1.5, lunge: 6, stag: 0.1 }, sword: { w: 0.35, stop: 50, shake: 3, lunge: 6, stag: 0.35 },
  spear:  { w: 0.3,  stop: 45, shake: 2.5, lunge: 4, stag: 0.4 },  axe:   { w: 0.6,  stop: 72, shake: 4.5, lunge: 5, stag: 0.7 },
  mace:   { w: 0.65, stop: 78, shake: 5, lunge: 4, stag: 0.9 },    great: { w: 1,    stop: 100, shake: 7, lunge: 9, stag: 1 },
  staff:  { w: 0.3,  stop: 40, shake: 2, lunge: 3, stag: 0.3 },    bow:   { w: 0.2,  stop: 30, shake: 1.5, lunge: 0, stag: 0.15 },
  rapier: { w: 0.12, stop: 32, shake: 1.5, lunge: 8, stag: 0.15 }, hammer: { w: 1.15, stop: 118, shake: 8, lunge: 6, stag: 1.2 },
  polearm:{ w: 0.7,  stop: 70, shake: 4.5, lunge: 5, stag: 0.6 },  crossbow: { w: 0.45, stop: 40, shake: 3, lunge: 0, stag: 0.5 },
  wand:   { w: 0.1,  stop: 25, shake: 1, lunge: 0, stag: 0.1 },
  none:   { w: 0.15, stop: 35, shake: 2, lunge: 4, stag: 0.2 },
};
const stagOf = c => { const w = c && c.equip && c.equip.weapon, it = w && ITEMS[w.key]; return it && it.stagger ? Math.min(1.2, it.stagger * 0.6) : feelOf(c).stag; };
const feelOf = c => { const w = c && c.equip && c.equip.weapon; return FEEL[(w && ITEMS[w.key]?.wtype) || (c && c.mtype === 'gorak' ? 'great' : 'none')]; };
const earVol = e => clamp(1 - dist(S.player, e) / 650, 0, 1);    // Lautstärke nach Entfernung zum Spieler
function attack(c, forceDir) {
  if (c.swing > 0 || c.atkCd > 0 || c.downed || !c.alive) return;
  const w = c.equip.weapon, it = w ? ITEMS[w.key] : null;
  const cost = (it ? it.stam : 4) * (1 - Math.min(0.5, afx(c, 'vigor')));
  if (c.stamina < cost) { if (c === S.player && chance(0.02)) UI.toast('Zu erschöpft'); return; }
  if (it && it.reload && c.reloadUntil > performance.now()) return;   // Armbrust wird gespannt
  if (it && it.manaShot) { if ((c.mana || 0) < it.manaShot) { if (c === S.player && !(c.manaWarn > performance.now())) { c.manaWarn = performance.now() + 1500; UI.toast(c.maxMana ? 'Zu wenig Mana für den Zauberstab' : 'Den Zauberstab führt nur, wer Magie gelernt hat (Magier, Kleriker, Paladin).'); } return; } c.mana -= it.manaShot; }
  c.stamina -= cost;
  c.swingDur = (it ? it.speed : 450) * (1 - Math.min(0.3, afx(c, 'swift')));
  c.atkCd = c.swingDur * 0.55;
  c.swing = 0.001; c.hitDone = false;
  if (forceDir != null) c.aim = forceDir;
  sfx(it && it.ranged ? 'bow' : 'swing', feelOf(c).w, earVol(c));
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
  const force = c === S.player && c.forceStrike; c.forceStrike = false;   // Strg: bewusst auch Neutrale treffen
  let foes = hostilesOf(c);
  if (force) foes = foes.concat(S.ents[c.map].filter(e => e.kind === 'npc' && e.alive && !foes.includes(e) && !S.party.includes(e.id)));
  let hitAny = false;
  foes.sort((a, b) => (a.downed ? 1 : 0) - (b.downed ? 1 : 0));   // Stehende zuerst, Gnadenstoß nur ohne andere Ziele im Bogen
  for (const f of foes) {
    if (!f.alive || (f.downed && !isHostile(c, f))) continue;  // gestürzte Feinde lassen sich erledigen, Neutrale nicht
    const d = dist(c, f);
    if (d > reach + (f.r || 10)) continue;
    const ang = Math.atan2(f.y - c.y, f.x - c.x);
    let diff = Math.abs(normAng(ang - c.aim));
    if (diff > arc / 2 + 0.25) continue;
    hitAny = true;
    if (f.downed) {                                            // Gnadenstoß: ein gestürzter Feind wird erledigt
      fx(f.x, f.y - 6, 'blood', 8); sfx('hit', feelOf(c).w, earVol(f));
      die(f, `Gnadenstoß durch ${c.name}`, c);
      break;
    }
    if (f.kind === 'npc' && !isHostile(c, f)) provoke(f, c);   // Angriff auf Neutrale hat Folgen
    const tip = it && it.sweep ? (d < reach * 0.45 ? 0.6 : d > reach * 0.7 ? 1.15 : 1) : 1;   // Hellebarde: an der Spitze stark, am Schaft halb
    hit(c, f, mult * tip, kind);
    if (it && it.wtype !== 'spear' && !it.sweep) break;      // Speer trifft in Linie, Hellebarde fegt den Bogen
  }
  if (!hitAny) {
    const px = c.x + Math.cos(c.aim) * reach, py = c.y + Math.sin(c.aim) * reach;
    if (solidTile(c.map, px, py) || solidPropAt(c.map, px, py, 6)) { fx(px, py, 'spark', 4); sfx('metal', 0.3, earVol(c)); }
  }
  if (w && w.cond != null) { w.cond = Math.max(0.05, w.cond - 0.0016); }
}

function shoot(c, it, mult = 1) {
  const bolt = it.wtype === 'crossbow', spark = it.wtype === 'wand', v = bolt ? 10 : spark ? 6.2 : 7.2;
  const dmg = spark ? (it.dmg + (c.attributes?.intelligence || 8) * 0.9) * spellMul(c) * mult : damageOf(c) * mult;
  S.projectiles.push({ id: uid(), kind: bolt ? 'bolt' : spark ? 'spark' : 'arrow', map: c.map, x: c.x + Math.cos(c.aim) * 14, y: c.y - 12 + Math.sin(c.aim) * 8,
    vx: Math.cos(c.aim) * v, vy: Math.sin(c.aim) * v, owner: c.id, dmg, ap: it.ap || 0, life: bolt ? 1100 : 1400, team: teamOf(c) });
  if (bolt) { c.reloadUntil = performance.now() + it.reload; if (c === S.player) sfx('metal', 0.3); }   // abgedrückt: jetzt spannen
  if (spark) { fx(c.x + Math.cos(c.aim) * 16, c.y - 14 + Math.sin(c.aim) * 8, 'frost', 4); sfx('magic', 0.3, earVol(c)); }
}

function normAng(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
const valenHostile = () => S.ranks.undead >= 0 || S.factions.valen <= -40;
function teamOf(c) {
  if (c === S.player || S.party.includes(c.id)) return 'player';
  if (c.servant) return 'player';                              // Diener des Nekromanten
  if (c.kind === 'enemy') {
    if (MONSTERS[c.mtype]?.prey) return 'prey';                  // Wild: kein Gegner, aber jagdbar (Spieler, Wölfe)
    if (c.faction === 'undead') return S.ranks.undead >= 0 ? 'player' : 'foe';
    if (c.faction === 'valen') return valenHostile() ? 'foe' : 'player';
    return 'foe';
  }
  if (c.kind === 'caravan') return 'player';
  if (c.kind === 'npc') return c.angry ? 'foe' : (c.guard && !valenHostile()) || c.escort ? 'player' : 'neutral';   // Karawanenwachen stehen wie der Wagen
  return 'neutral';
}
function isHostile(a, b) {
  if (a.faction && a.faction === b.faction && a.kind !== 'player' && b.kind !== 'player' && !a.angry && !b.angry && !a.servant && !b.servant) return false;   // Gleiche Fraktion: kein Kampf (Stille Wächter vs. Skelette)
  if (DBG.calm && (a === S.player || b === S.player)) return false;   // Debug: niemand greift den Spieler an
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
  const riposte = it && it.riposte && attacker.riposteUntil > performance.now();   // Rapier: Stich nach der Parade
  if (attacker.shadowNext > performance.now()) { dmg *= 2.5; attacker.shadowNext = 0; float(attacker, 'Aus dem Schatten', 'rgba(150,130,190,ALPHA)'); }   // Schattenschritt
  if (riposte) { dmg *= 2.2; attacker.riposteUntil = 0; float(attacker, 'Riposte', 'rgba(240,220,150,ALPHA)'); }
  if (attacker.titleClass === 'necromancer') dmg *= 0.85;             // Makel: Die Toten zehren
  // Kritisch
  const critChance = riposte ? 1 : 0.05 + (attacker.attributes ? attacker.attributes.perception * 0.004 : 0.01) + tfx(attacker, 'crit') + afx(attacker, 'keen');
  const behind = attacker.aim != null && Math.abs(normAng(Math.atan2(attacker.y - target.y, attacker.x - target.x) - (target.aim || 0))) < 1;
  const crit = chance(critChance) || (it && it.crit && behind && chance(0.5));
  if (crit) dmg *= (it && it.crit) || 1.8;
  // Heilig gegen Untot
  if (kind === 'holy' && (target.mtype === 'skeleton' || target.undead)) dmg *= 2.1;
  // Rüstung / Block
  const ap = Math.min(0.9, (it ? (it.ap || 0) : 0) + afx(attacker, 'pierce'));
  const armor = (target.kind === 'enemy' ? (target.armor || 0) * 1.6 : armorOf(target)) * (1 - ap);
  const off = target.equip && target.equip.offhand;
  // Aktive Deckung / Parade (nur der Spieler; eigenes Feld cover — guard ist das Flag der Stadtwachen). Rüstung wirkt vor dem Block.
  const crush = it && it.crush;                                      // Kriegshammer: kein Schild hält ihn, Deckung kostet doppelt
  const cov = target.cover ? guarded(attacker, target, Math.max(1, dmg - armor * 0.55) * (crush ? 2 : 1)) : false;
  if (cov === true) return;
  if (off && !crush && !target.cover && cov !== 'broken' && chance((ITEMS[off.key]?.block || 0) * 0.7) && !target.downed) {   // gebrochene Deckung: der Hieb trifft voll
    fx(target.x, target.y - 12, 'spark', 6); float(target, 'Block', 'rgba(200,196,170,ALPHA)');
    if (off.cond != null) off.cond = Math.max(0.05, off.cond - 0.004);
    sfx('metal', 0.4, earVol(target)); if (target === S.player || attacker === S.player) hitStop = Math.max(hitStop, 45); return;
  }
  dmg = Math.max(1, dmg - armor * 0.55);
  hurt(target, dmg, attacker, attacker.name || MONSTERS[attacker.mtype]?.name, crit, kind);
  if (stat(attacker, 'poison_coat') && target.alive && target.kind !== 'caravan') {    // Giftöl: Treffer vergiftet (erneuert)
    target.status = (target.status || []).filter(q => q.key !== 'poisoned'); target.status.push({ key: 'poisoned', name: 'Vergiftet', left: 5000 }); fx(target.x, target.y - 12, 'necro', 4); }
  const lee = afx(attacker, 'leech'); if (lee && attacker.alive) { if (attacker.body) B.heal(attacker, dmg * lee); else attacker.hp = Math.min(attacker.maxHp, attacker.hp + dmg * lee); }
  if (afx(attacker, 'rend') && target.alive && chance(afx(attacker, 'rend')) && !(target.status || []).some(s => s.key === 'bleeding')) (target.status ||= []).push({ key:'bleeding', name:'Blutend', left: 12000 });
  if (it && it.frost && target.alive && !(target.status || []).some(q => q.key === 'chilled')) (target.status ||= []).push({ key: 'chilled', name: 'Durchfroren', left: 2500, desc: 'Langsamer (−40 %).' });
  if (hasLeg(attacker, 'echo') && target.alive && !attacker._echo && chance(0.2)) { attacker._echo = true; hurt(target, dmg * 0.5, attacker, attacker.name); attacker._echo = false; fx(target.x, target.y - 14, 'spark', 5); }
  if (attacker.mtype === 'ghoul' && target.alive && target.kind !== 'caravan') addStatus(target, { key: 'grabbed', name: 'Gepackt', left: 1500, desc: 'Langsamer (−50 %).' });
  if (attacker.mtype === 'wraith' && target.stamina != null) { target.stamina = Math.max(0, target.stamina - 15); fx(target.x, target.y - 14, 'frost', 5); }
  if (target.mtype === 'wraith' && target.alive) target.phased = performance.now() + 900;
  if (crush && target.alive && !target.downed) { target.stagger = Math.max(target.stagger || 0, MONSTERS[target.mtype]?.boss ? 300 : 650); target.swing = 0; target.telegraph = 0; target.windup = false; }   // Wucht: niemand bleibt stehen, wie er stand
  // Fertigkeit steigern
  if (attacker.skills && it) attacker.skills[it.skill] = Math.min(100, (attacker.skills[it.skill] || 0) + 0.12);
  const fl = feelOf(attacker), mine = attacker === S.player;
  if (mine || target === S.player) hitStop = Math.max(hitStop, (mine ? fl.stop : 40) + (crit ? 40 : 0));
  if (mine) { camShake(fl.shake * (crit ? 1.8 : 1), 90 + fl.w * 90); if (crit && S.settings.motion) R.cam.punch = 0.04; }
  else if (target === S.player) camShake(4, 120);
  const a = Math.atan2(target.y - attacker.y, target.x - attacker.x);
  const ix = target.x - Math.cos(a) * 6, iy = target.y - 14 - Math.sin(a) * 3;
  S.fx.push({ x: ix, y: iy, vx: 0, vy: 0, type: crit ? 'crit' : 'impact', a, s: 1 + fl.w, life: crit ? 260 : 170, maxLife: crit ? 260 : 170 });
}

export function hurt(target, dmg, source, cause = 'Wunden', crit = false, kind = 'physical') {
  if (!target.alive || target.invuln || (DBG.god && target === S.player)) return;
  if (target.mtype === 'wraith' && target.phased > performance.now() && kind === 'physical') { float(target, 'körperlos', 'rgba(200,220,240,ALPHA)'); return; }   // Geist: nach Treffer kurz ungreifbar
  if (target.mtype === 'bear' && source) target.provoked = true;
  target.lastKind = kind;
  if (source && target.hexed > performance.now()) dmg *= 1.25;        // Fluch des Hexenmeisters
  if (node(target, 'k_berserk')) dmg *= 1.15;                         // Preis des Berserkers
  if (stat(target, 'frenzy')) dmg *= 1.2;                              // Preis der Raserei
  if (source && source.cowed > performance.now()) dmg *= 0.8;          // eingeschüchtert (Kampfschrei)
  const th = afx(target, 'thorns');                                   // Dornen: ein Teil des Nahkampfschadens geht zurück
  if (th && source && source !== target && source.alive && !source._thorn && dist(source, target) < 90 && dmg > 0) { source._thorn = true; hurt(source, dmg * th, target, 'Dornen'); source._thorn = false; }
  const ward = target.status && target.status.find(s => s.key === 'bone_ward' && s.absorb > 0);
  if (ward && dmg > 0) {                                              // Knochenschild fängt ab, bis er bricht
    const a = Math.min(ward.absorb, dmg); ward.absorb -= a; dmg -= a; if (ward.absorb <= 0) ward.left = 0;
    fx(target.x, target.y - 12, 'bone', 4); if (dmg <= 0) return float(target, 'Knochen', 'rgba(215,208,186,ALPHA)');
  }
  if (source && dmg > 0 && target.titleClass === 'monk' && tres(target) > 0 && !node(target, 'k_stillness')) setTres(target, tres(target) - 1);   // getroffen: die Sammlung reißt
  dmg = Math.round(dmg * 10) / 10;
  let result = null, part = null;
  if (target.body) { part = B.pickPart(source, target, crit); result = B.damagePart(target, part, dmg, crit); }
  else target.hp -= dmg;
  if (node(target, 'k_second') && target.alive && !target.downed && target.hp < target.maxHp * 0.25 && clock() > (target.secondWind || 0)) {
    target.secondWind = clock() + 180; B.heal(target, target.maxHp * 0.3); target.stamina = target.maxStamina;   // Zweiter Atem (3 Spielstunden = 3 min)
    fx(target.x, target.y - 14, 'heal', 14); float(target, 'Zweiter Atem', 'rgba(150,200,120,ALPHA)', true);
  }
  if (target === S.player && S.player.channel && source) { S.player.channel = null; UI.toast('Unterbrochen!'); }   // Blutung allein unterbricht nicht
  target.lastCause = cause; target.lastKiller = source ? source.id : null;
  if (source) target.aggroId = source.id;
  target.lastHurt = performance.now();
  if (target.kind === 'enemy' && source && source.id && isHostile(target, source)) {   // Gruppe/Rudel: Gleiche eilen zu Hilfe
    for (const o of S.ents[target.map]) {
      if (o === target || o.kind !== 'enemy' || !o.alive || o.faction !== target.faction || dist(o, target) > 240) continue;
      const cur = o.aggroId && byId(o.aggroId);
      if (!cur || !cur.alive || dist(o, cur) > 300) { o.aggroId = source.id; o.aiState = 'pursue'; }
    }
  }
  if (source && source !== target && target.kind !== 'caravan' && !target.downed && source.map === target.map) {
    // Rückstoß: kurzes Wegrutschen (~140 ms) statt Sprung, je nach Waffengewicht; kollisionssicher in tickCombatant
    const a = Math.atan2(target.y - source.y, target.x - source.x), fl = feelOf(source);
    const kb = Math.min(20, (2 + dmg * 0.22) * (0.6 + fl.w)) * (crit ? 1.5 : 1) * (target.boss ? 0.25 : 1);
    target.kb = { x: Math.cos(a) * kb, y: Math.sin(a) * kb, t: 140, T: 140 };
    // Taumeln: kurzer Kontrollverlust; schwere Treffer brechen die Angriffsvorbereitung (nicht beim Boss außer kritisch)
    const stg = stagOf(source) * (crit ? 1.4 : 1);
    if (stg >= 0.3 && teamOf(target) !== 'player' && (!target.boss || (crit && stg >= 1))) {   // Dolch/Bogen: kein Taumeln (sonst Dauerlähmung)   // Spieler/Gefährten taumeln nicht (Steuerung bleibt direkt)
      target.stagger = Math.max(target.stagger || 0, 260 * stg);   // Schwert ~90 ms, Axt ~180, Kolben ~250, Zweihänder ~260 (krit. mehr)
      if (stg >= 0.6 && (target.telegraph > 0 || target.windup || (target.swing > 0 && !target.hitDone) || target.draw > 0)) {
        target.telegraph = 0; target.windup = false; target.swing = 0; target.hitDone = false; target.draw = 0; if (target.special && target.special.t > 0) target.special = null;
        float(target, 'Unterbrochen', 'rgba(210,190,140,ALPHA)'); fx(target.x, target.y - 20, 'spark', 5); sfx('break', 0.5, earVol(target));
      }
    }
  }
  if (target.aiState === 'idle' || target.aiState === 'patrol') target.aiState = 'pursue';
  float(target, (crit ? '' : '') + Math.round(dmg), crit ? 'rgba(212,175,55,ALPHA)' : 'rgba(228,220,200,ALPHA)', crit);
  const lvl = S.settings.violence;
  const bony = target.mtype === 'skeleton';
  if (bony) fx(target.x, target.y - 14, 'bone', crit ? 8 : 5);
  else if (lvl !== 'low') fx(target.x, target.y - 12, 'blood', crit ? 9 : lvl === 'reduced' ? 3 : 5);
  if (lvl === 'standard' && (crit || dmg > 12)) S.ents[target.map].push({ id: uid(), kind:'decal', map: target.map, x: target.x, y: target.y + 4, r: 6 + rnd() * 6, life: 12000, maxLife: 12000, transient: true });
  if (dmg > 10 && chance(0.25) && !(target.status || []).some(s => s.key === 'bleeding'))
    (target.status ||= []).push({ key:'bleeding', name:'Blutend', left: 12000 });
  const swt = source && source.equip && source.equip.weapon && ITEMS[source.equip.weapon.key]?.wtype;
  const mat = swt === 'mace' || swt === 'staff' ? 'blunt' : swt === 'spear' || swt === 'dagger' || swt === 'bow' ? 'pierce' : swt ? 'blade' : null;
  const armored = target.kind === 'enemy' ? ['valen_soldier', 'goblin_warrior', 'gorak'].includes(target.mtype) : armorOf(target) >= 6;   // Metall am Ziel: Scheppern
  sfx(bony ? 'bone' : crit ? 'crit' : 'hit', source ? feelOf(source).w : 0.3, earVol(target), mat, armored);
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
  // Wer fällt, bricht alles ab: kein halber Schlag, keine Ansage, kein Ziel, kein Weg
  c.swing = 0; c.hitDone = false; c.telegraph = 0; c.windup = false; c.special = null; c.leap = null; c.draw = 0;
  c.channel = null; c.wander = null; c.threatId = null; c.vx = c.vy = 0;
  c.lastCause = cause; c.lastKiller = source ? source.id : null;
  log(`${c.name} bricht zusammen.`, 'combat');
  if (c === S.player) UI.toast('Du bist am Boden. Deine Gruppe hat kurz Zeit.', 3500);
}
function stabilize(c, helper) {
  c.downed = false; act(c, 'rise', 520);
  if (c.body) B.healPart(c, 'torso', Math.max(4, c.body.torso.max * 0.2) - c.body.torso.hp); else c.hp = Math.max(6, c.maxHp * 0.14);
  log(`${helper.name} stabilisiert ${c.name}.`, 'party');
  if (c !== helper) remember(c, 'saved_life', helper.name);
  if (helper !== S.player && c === S.player) addRel(helper.key, 6);
  fx(c.x, c.y - 12, 'heal', 10);
}

function die(c, cause = 'Wunden', source) {
  if (!c.alive) return;
  const wasFoe = teamOf(c) === 'foe';                          // vor dem Aufräumen: war es ein Feind oder ein Unschuldiger?
  titleOnDeath(c);
  if (source && source.alive && source !== c && hasLeg(source, 'thirst') && wasFoe) { const h = source.maxHp * 0.08; if (source.body) B.heal(source, h); else source.hp = Math.min(source.maxHp, source.hp + h); float(source, '+' + Math.round(h), 'rgba(150,40,30,ALPHA)'); }   // Blutdurst
  if (c.mtype === 'ghoul' && !c.risen && !['fire', 'holy'].includes(c.lastKind))   // Wiedergänger: steht einmal wieder auf — außer Feuer/Heiliges
    (S.rising ||= []).push({ at: clock() + 6, map: c.map, x: c.x, y: c.y, level: c.level });
  if (c.mtype === 'crypt_warden') S.flags.wardenSlain = true;
  if (c.mtype === 'hrodvar') S.flags.hrodvarSlain = true;
  c.alive = false; c.downed = false;
  c.swing = 0; c.telegraph = 0; c.special = null; c.leap = null; c.draw = 0; c.vx = c.vy = 0;   // terminal: kein Rest-Verhalten
  c.aggroId = null; c.threatId = null; c.angry = false; c.follow = null; c.lurk = null;
  const arr = S.ents[c.map];
  if (c.kind === 'caravan') {
    SIM.caravanDied(c);
    for (const e of escortsOf(c)) { e.escort = null; e.escortLost = true; e.anchor = { x: e.x, y: e.y }; }   // Wachen ohne Zug: bleiben, bis niemand hinsieht
    for (const [g, n] of Object.entries(c.cargo || {})) if (n > 0) dropItemAt(c.map, c.x + ri(-14, 14), c.y + ri(-10, 10), mkItem(g, Math.ceil(n / 2)));
    const ci = arr.indexOf(c); if (ci >= 0) arr.splice(ci, 1);
    return;
  }
  if (c.kind === 'enemy' && c.armyId) SIM.unitDied(c);
  if (c.kind === 'enemy' && dist(S.player, c) < 700) {        // Todes-Effekt: Blut bzw. Knochen + Seelenfunken, Staub
    const bony = c.mtype === 'skeleton';
    fx(c.x, c.y - 12, bony ? 'bone' : 'blood', 12); if (bony) fx(c.x, c.y - 20, 'necro', 10); fx(c.x, c.y + 2, 'dust', 5);
    sfx(bony ? 'bone' : 'death', 0.5, earVol(c));
  }
  if (c.kind === 'enemy' && (teamOf(c) !== 'foe' || dist(S.player, c) > 500)) {   // Verbündete oder ferne Tote: keine Beute
    const m = MONSTERS[c.mtype];
    if (dist(S.player, c) < 500) log(`${m.name} fällt.`, 'combat');
    const ci = arr.indexOf(c); if (ci >= 0) arr.splice(ci, 1);
    arr.push({ id: uid(), kind:'corpse', map: c.map, x: c.x, y: c.y, life: 20000, maxLife: 20000, pal: m.pal?.cloth || '#3a3229', transient: true,
      mtype: c.mtype, facing: c.facing, seed: c.seed, born: performance.now(), raised: !!c.servant });   // ein Diener steht nicht zweimal auf
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
    arr.push({ id: uid(), kind:'corpse', map: c.map, x: c.x, y: c.y, life: 20000, maxLife: 20000, pal: MONSTERS[c.mtype].pal?.cloth || '#3a3229', transient: true,
      mtype: c.mtype, facing: c.facing, seed: c.seed, born: performance.now() });
    return;
  }
  // Person
  const isParty = S.party.includes(c.id);
  if ((source === S.player || source === S.player.id) && c.kind === 'npc' && !isParty) bloodshed(c, wasFoe);   // auch verblutet (lastKiller = id)
  log(`${c.name} ist gestorben. (${cause})`, 'death');
  chronicle(`${c.name} gefallen`, 'death', `${cause}. Jahr ${year()}, Tag ${S.day}.`);
  makeGrave(c, cause);
  for (const m of partyMembers()) if (m !== c) { remember(m, 'friend_died', c.name); m.morale -= 14; }
  if (isParty) S.party = S.party.filter(id => id !== c.id);
  const ci = arr.indexOf(c); if (ci >= 0) arr.splice(ci, 1);
  if (c === S.player) playerDeath(cause, source);
}

// Der Spieler hat einen Menschen getötet: Zeugen fürchten ihn einen Tag, Wachen greifen ein, die Gruppe urteilt.
// Ein Unschuldiger (kein Feind im Moment des Todes) wiegt schwerer als ein zorniger Angreifer.
function bloodshed(victim, wasFoe) {
  const p = S.player, now = clock();
  for (const w of S.ents[victim.map]) {
    if (w.kind !== 'npc' || !w.alive || w.downed || S.party.includes(w.id) || dist(w, victim) > 300) continue;
    if (w.guard && !wasFoe) { w.angry = true; w.brave = true; w.aggroId = p.id; w.sawPlayer = now; }
    else if (!w.guard) { w.afraid = now + 1440; w.fleeing = !w.brave; }
  }
  if (wasFoe) return;
  S.flags.murders = (S.flags.murders || 0) + 1;
  for (const m of partyMembers()) {
    if ((m.traits || []).includes('grausam')) continue;
    m.morale -= 10; remember(m, 'killed_kin', victim.name);
  }
  const m = partyMembers().find(x => !(x.traits || []).includes('grausam'));
  if (m) log(`${m.name}: „${victim.name} hat dir nichts getan.“`, 'party');
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
  const bonus = Math.max(0, (MONSTERS[e.mtype]?.threat || 1) - 1) + (e.boss ? 1 : 0);   // gefährlicher Gegner, bessere Chancen
  for (const [key, p] of table) if (chance(p)) dropItemAt(e.map, e.x + ri(-10, 10), e.y + ri(-8, 8), mkItem(key, 1, { bonus }));
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
  while (c.xp >= c.xpNext) levelUp(c);                     // viel Erfahrung auf einmal: mehrere Stufen (vorher nur eine, Rest hing über)
}
function levelUp(c) {
  c.xp -= c.xpNext; c.level++; c.xpNext = Math.round(c.xpNext * 1.35);
  if (c === S.player) { c.attrPoints = (c.attrPoints || 0) + 1; c.skillPoints = (c.skillPoints || 0) + 1; UI.toast(`Stufe ${c.level} · +1 Talentpunkt`); log(`Du erreichst Stufe ${c.level}. Ein Talentpunkt ist frei (T).`, 'party'); }
  else log(`${c.name} erreicht Stufe ${c.level}.`, 'party');
  recalc(c); B.fullHeal(c);
}

// ================= Effekte =================
function fx(x, y, type, n = 6) {
  if (S.settings.violence === 'low' && type === 'blood') return;
  if (type === 'heal' && S.player) sfx('heal', 0, clamp(1 - Math.hypot(S.player.x - x, S.player.y - y) / 650, 0, 1));
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, sp = 0.6 + rnd() * 2.2;
    S.fx.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.8, type, s: 1.5 + rnd() * 2.4, life: 380 + rnd() * 420, maxLife: 700 });
  }
}
function float(e, text, color, big = false) {
  S.floats.push({ x: e.x + ri(-6, 6), y: e.y - 26, rise: 0, text, color, big, life: 900, maxLife: 900 });
}
const RISING = new Set(['heal', 'necro', 'shadow']);           // Magie steigt auf, Blut und Splitter fallen
const FIXED = new Set(['impact', 'crit', 'ring', 'ghost', 'shock']);     // bleiben am Ort
function updateFx(dt) {
  for (const f of S.fx) { f.x += f.vx * dt / 16; f.y += f.vy * dt / 16; f.vy += dt / 16 * (RISING.has(f.type) ? -0.04 : FIXED.has(f.type) ? 0 : 0.14); f.life -= dt; }
  S.fx = S.fx.filter(f => f.life > 0);
  for (const f of S.floats) { f.rise += dt / 22; f.life -= dt; }
  S.floats = S.floats.filter(f => f.life > 0);
  const arr = S.ents[S.map];
  for (let i = arr.length - 1; i >= 0; i--) {
    const e = arr[i];
    if (e.kind === 'decal' || e.kind === 'corpse') { e.life -= dt; if (e.life <= 0) arr.splice(i, 1); }
  }
}
// Flächenschaden beim Einschlag (Feuerball, Feuerflasche): alle Feinde des Werfers im Umkreis außer dem direkt Getroffenen.
function splashAt(p, skip) {
  const own = byId(p.owner); if (!own || !p.splash) return;
  fx(p.x, p.y, 'fire', 16); S.fx.push({ x: p.x, y: p.y, vx: 0, vy: 0, type: 'shock', s: 1, life: 360, maxLife: 360 }); sfx('fire', 0.6, earVol(p));
  for (const e of S.ents[p.map]) if (e !== skip && e.alive && COMBAT_KINDS.has(e.kind) && e !== own && isHostile(own, e) && Math.hypot(e.x - p.x, e.y - p.y) < p.splash + (e.r || 10))
    hurt(e, p.dmg * 0.6, own, own.name, false, 'fire');
  p.splash = 0;
}
function updateProjectiles(dt) {
  for (const p of S.projectiles) {
    p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.life -= dt;
    if (p.burst && p.life <= 0) { splashAt(p); continue; }            // Wurf: zerschellt am Zielpunkt
    if (solidTile(p.map, p.x, p.y) || solidPropAt(p.map, p.x, p.y, 3)) { fx(p.x, p.y, 'spark', 3); if (p.splash) splashAt(p); p.life = 0; continue; }
    for (const e of S.ents[p.map]) {
      if (!(e.kind === 'enemy' || e.kind === 'npc' || e.kind === 'player') || !e.alive || e.downed || e.id === p.owner) continue;   // Pfeile fliegen über Liegende
      const own = byId(p.owner);
      if (!own || teamOf(own) === teamOf(e)) continue;
      if (dist(p, e) < (e.r || 10) + 5) {
        if (e.invuln && e.dodge) { if (!p.evaded) { p.evaded = true; evaded(e); } continue; }   // Geschoss fliegt durch die Rolle
        const attacker = own || { name:'Pfeil', skills:null };
        hurtFromProjectile(attacker, e, p);
        if (p.splash) splashAt(p, e);
        p.life = 0; break;
      }
    }
  }
  S.projectiles = S.projectiles.filter(p => p.life > 0);
}
function hurtFromProjectile(attacker, target, p) {
  const crit = chance(0.12);
  let dmg = p.dmg * (crit ? 2 : 1) * (p.mult || 1);
  const armor = (target.kind === 'enemy' ? (target.armor || 0) * 1.2 : armorOf(target)) * (1 - (p.ap || 0));   // Bolzen schlagen durch
  dmg = Math.max(1, dmg - armor * 0.5);
  if (p.kind === 'fire') { fx(p.x, p.y, 'fire', 12); sfx('fire', 0.5, earVol(target)); }
  if (p.kind === 'shadow') fx(p.x, p.y, 'shadow', 10);
  if (target.cover && guarded({ x: p.x - p.vx * 20, y: p.y - p.vy * 20, name: attacker.name, mtype: attacker.mtype }, target, dmg)) return;   // Geschoss aus der Blickrichtung: blocken, nicht parieren
  hurt(target, dmg, attacker, attacker.name, crit, p.kind === 'fire' ? 'fire' : 'physical');
  if (attacker.skills) attacker.skills.archery = Math.min(100, (attacker.skills.archery || 0) + 0.15);
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
  if (e.servant && (performance.now() > e.until || !byId(e.servant)?.alive)) return crumble(e);   // der Ruf verklingt
  const far = dist(e, p) > 1100;
  if (far) { e.vx = e.vy = 0; return; }                       // Stufe C: außerhalb der Sicht keine Simulation
  const m = MONSTERS[e.mtype];
  if (m.prey) return preyAI(e, dt, m);                          // Wild: flieht vor allem, was sich nähert, sonst äsen
  const targets = combat.filter(t => !t.downed && t !== e && isHostile(e, t) && (t.kind !== 'caravan' || e.faction === 'bandit'));   // nur Banditen rauben Wagen
  const ag = e.aggroId ? byId(e.aggroId) : null;
  const sight = m.sight * (e.wary > clock() ? 1.5 : 1);           // nach abgebrochener Jagd: wachsamer
  let tgt = ag && ag.alive && !ag.downed && ag.map === e.map && isHostile(e, ag) && dist(e, ag) < sight * 1.6 ? ag : nearestTarget(e, targets, sight);
  if (e.mtype === 'bear' && tgt && !e.provoked && dist(e, tgt) > 110 && tgt !== ag) tgt = null;   // Revier: nur wer zu nahe kommt
  const sp = m.speed * dt / 16 * speedMul(e.map, e.x, e.y) * B.speedFactor(e) * (e.hexed > performance.now() ? 0.7 : 1) * (e.rooted > performance.now() ? 0 : 1) * ((e.status || []).some(q => q.key === 'chilled') ? 0.6 : 1);   // Ranken halten, Frost bremst
  if (e.hp < e.maxHp * 0.2 && !e.boss && !e.fleeing && !e.servant && chance(0.004)) { e.fleeing = true; log(`${m.name} flieht.`, 'combat'); }
  if (e.fleeing && tgt) {
    seek(e, Math.atan2(e.y - tgt.y, e.x - tgt.x), sp, dt);
    if (dist(e, tgt) > m.sight * 1.5) { e.fleeing = false; e.aggroId = null; }
    return;
  }
  if (!tgt && e.servant) {                                     // Diener ohne Feind: dicht beim Herrn
    const o = byId(e.servant), d = o ? dist(e, o) : 0;
    if (o && d > 64) seek(e, Math.atan2(o.y - e.y, o.x - e.x), sp * (d > 200 ? 1.3 : 1), dt, o); else e.vx = e.vy = 0;
    return;
  }
  if (!tgt) {
    e.aiTimer -= dt;
    if (e.aiTimer <= 0) { e.aiTimer = ri(1200, 3600); e.wander = { x: e.anchor.x + ri(-90, 90), y: e.anchor.y + ri(-90, 90) }; }
    if (e.wander) {
      const d = Math.hypot(e.wander.x - e.x, e.wander.y - e.y);
      if (d > 8) seek(e, Math.atan2(e.wander.y - e.y, e.wander.x - e.x), sp * 0.45, dt, e.wander);
      else e.vx = e.vy = 0;
    }
    return;
  }
  e.aim = Math.atan2(tgt.y - e.y, tgt.x - e.x);
  const d = dist(e, tgt), reach = m.reach + (tgt.r || 10);
  if (e.mtype === 'wolf') {                                   // Wolf: duckt sich kurz (Ansage), springt dann an
    if (e.leap) { e.leap.t -= dt; moveEnt(e, e.leap.ax * sp * 3.4, e.leap.ay * sp * 3.4); if (e.leap.t <= 0) { e.leap = null; e.atkCd = 0; } return; }
    e.leapCd = (e.leapCd || 0) - dt;
    if (e.telegraph > 0) { e.vx = e.vy = 0; if (e.telegraph <= dt) { e.leap = { t: 190, ax: Math.cos(e.aim), ay: Math.sin(e.aim) }; sfx('dodge', 0, earVol(e)); } return; }
    if (d < 130 && d > reach && e.leapCd <= 0) { e.telegraph = 280; e.leapCd = 2800; e.vx = e.vy = 0; return; }
  }
  if (e.mtype === 'bear' && bearAI(e, tgt, d, reach, sp, dt, m)) return;
  if (e.mtype === 'wild_dog' && d > reach * 1.6) {            // Rudel: von der Seite, nicht alle frontal
    const side = ((e.seed | 0) % 2 ? 1 : -1) * 0.9 * Math.min(1, (d - reach) / 120);
    seek(e, e.aim + side, sp, dt, tgt); return;
  }
  if (e.mtype === 'cultist') cultistHeal(e, m);
  if (e.retreat > 0) {                                        // Goblin: nach dem Hieb zurückspringen (Hit & Run)
    e.retreat -= dt; moveEnt(e, -Math.cos(e.aim) * sp, -Math.sin(e.aim) * sp); return;
  }
  if (m.ranged) return archerAI(e, tgt, d, sp, dt, m);
  if (e.mtype === 'gorak') return bossAI(e, tgt, d, reach, sp, dt, m);
  if (e.mtype === 'hrodvar') return frostKingAI(e, tgt, d, reach, sp, dt, m);
  if (e.mtype === 'bandit' && banditAI(e, tgt, d, reach, sp, dt, m)) return;
  if (d > reach * 0.8) {
    // Goblins tänzeln seitlich heran, statt stur geradeaus zu laufen
    const side = (e.mtype === 'goblin' || e.mtype === 'goblin_warrior') && d > reach * 1.4 ? Math.sin(performance.now() / 240 + e.seed * 9) * 0.8 : 0;
    seek(e, e.aim + Math.atan(side), sp * Math.hypot(1, side), dt, tgt);
  }
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

// Hirsch: äst, hebt den Kopf, flieht vor Spieler, Figuren und Raubtieren (Wölfe jagen ihn — teamOf 'prey').
function preyAI(e, dt, m) {
  const threat = S.ents[e.map].find(o => o !== e && o.alive && (o.kind === 'player' || o.kind === 'npc' || (o.kind === 'enemy' && !MONSTERS[o.mtype]?.prey)) && dist(e, o) < (e.lastHurt ? 320 : m.sight));
  const sp = m.speed * dt / 16 * speedMul(e.map, e.x, e.y);
  if (threat) { e.aim = Math.atan2(e.y - threat.y, e.x - threat.x); seek(e, e.aim, sp, dt); return; }
  e.aiTimer -= dt;
  if (e.aiTimer <= 0) { e.aiTimer = ri(2500, 6000); e.wander = chance(0.5) ? null : { x: e.anchor.x + ri(-120, 120), y: e.anchor.y + ri(-120, 120) }; }
  if (e.wander && Math.hypot(e.wander.x - e.x, e.wander.y - e.y) > 8) seek(e, Math.atan2(e.wander.y - e.y, e.wander.x - e.x), sp * 0.3, dt, e.wander); else e.vx = e.vy = 0;
}
// Bär: bleibt im Revier; wer ihn verletzt, den stellt er — aus mittlerer Distanz mit Ansage (aufrichten) und Sturmlauf.
function bearAI(e, tgt, d, reach, sp, dt, m) {
  if (e.charge) {
    e.charge.t -= dt; moveEnt(e, e.charge.ax * sp * 3, e.charge.ay * sp * 3);
    if (!e.charge.hit && dist(e, tgt) < reach) { e.charge.hit = true; hit(e, tgt, 1.3); camShake(6, 180); }
    if (e.charge.t <= 0) { e.charge = null; e.atkCd = 900; }
    return true;
  }
  e.chargeCd = (e.chargeCd || 0) - dt;
  if (e.telegraph > 0 && e.chargeWind) { e.vx = e.vy = 0; if (e.telegraph <= dt) { e.chargeWind = false; e.charge = { t: 380, ax: Math.cos(e.aim), ay: Math.sin(e.aim) }; sfx('death', 0.6, earVol(e)); } return true; }
  if (e.provoked && d > 90 && d < 260 && e.chargeCd <= 0) { e.telegraph = 520; e.chargeWind = true; e.chargeCd = 6000; e.vx = e.vy = 0; return true; }
  return false;
}
// Kultist: heilt verwundete Untote in der Nähe (sichtbar, unterbrechbar durch Taumeln), sonst Schütze mit Schattenblitz.
function cultistHeal(e, m) {
  e.healCd = (e.healCd || 2000) - 16;
  if (e.healCd > 0 || e.stagger > 0) return;
  const ally = S.ents[e.map].find(o => o !== e && o.alive && o.kind === 'enemy' && o.faction === 'undead' && o.hp < o.maxHp * 0.6 && dist(e, o) < 220);
  if (!ally) return;
  e.healCd = 6500; e.castT = performance.now();
  const h = ally.maxHp * 0.2; if (ally.body) B.heal(ally, h); else ally.hp = Math.min(ally.maxHp, ally.hp + h);
  fx(ally.x, ally.y - 14, 'necro', 12); float(ally, '+' + Math.round(h), 'rgba(143,217,176,ALPHA)');
}
// Bogenschütze: Wunschabstand ~190 px. Spannt sichtbar (Ansage), schießt, wechselt dann seitlich die Stellung.
// Kommt man zu nahe, springt er zurück (mit Abklingzeit, damit man ihn stellen kann).
function archerAI(e, tgt, d, sp, dt, m) {
  const cs = Math.cos(e.aim), sn = Math.sin(e.aim), want = 190;
  e.hopCd = (e.hopCd || 0) - dt;
  if (e.draw > 0) {                                           // Bogen gespannt: steht, zielt, schießt am Ende
    e.vx = e.vy = 0; e.draw -= dt;
    if (e.draw <= 0) {
      e.atkCd = m.atk; e.repos = 500 + rnd() * 600; e.circle = chance(0.5) ? 1 : -1;
      const mag = m.missile === 'shadow';                     // Kultist: Schattenblitz (langsamer, man kann ausweichen)
      S.projectiles.push({ id: uid(), kind: m.missile || 'arrow', map: e.map, x: e.x + cs * 12, y: e.y - 10 + sn * 8,
        vx: cs * (mag ? 4.6 : 7), vy: sn * (mag ? 4.6 : 7), owner: e.id, dmg: m.dmg * (1 + e.level * 0.05), life: 1600, team:'foe' });
      if (mag) { e.castT = performance.now(); fx(e.x + cs * 12, e.y - 14, 'shadow', 6); }
      sfx('bow', 0.2, earVol(e));
    }
    return;
  }
  if (e.hop > 0) { e.hop -= dt; moveEnt(e, -cs * sp * 3, -sn * sp * 3); return; }
  if (d < 110 && e.hopCd <= 0) { e.hop = 220; e.hopCd = 2200; fx(e.x, e.y + 4, 'dust', 4); sfx('dodge', 0, earVol(e)); return; }
  const radial = d < want * 0.8 ? -1 : d > Math.min(m.reach * 0.85, 280) ? 1 : 0;
  const side = e.repos > 0 ? (e.circle || 1) : 0; if (e.repos > 0) e.repos -= dt;
  if (radial || side) moveEnt(e, (cs * radial - sn * side) * sp, (sn * radial + cs * side) * sp); else e.vx = e.vy = 0;
  if (d < m.reach && e.atkCd <= 0 && !e.repos) e.draw = 520;   // Ansage: 0,5 s Bogen spannen
  if (e.repos <= 0) e.repos = 0;
}

// Bandit: Duellant. Umkreist knapp außerhalb der Reichweite, solange sein Hieb abklingt, weicht nach dem Treffer
// zurück und macht einen Seitschritt, wenn der Spieler ausholt. Sonst greift er normal an (Standardlogik).
function banditAI(e, tgt, d, reach, sp, dt, m) {
  const cs = Math.cos(e.aim), sn = Math.sin(e.aim), ring = reach * 1.8;
  e.circle ||= chance(0.5) ? 1 : -1; e.sideCd = (e.sideCd || 0) - dt;
  if (e.sidestep > 0) { e.sidestep -= dt; moveEnt(e, -sn * e.circle * sp * 2.2, cs * e.circle * sp * 2.2); return true; }
  if (tgt.swing > 0 && tgt.swing < 0.35 && d < reach * 1.4 && e.sideCd <= 0 && chance(0.6)) {   // reagiert aufs Ausholen
    e.sidestep = 200; e.sideCd = 1600; e.circle = -e.circle; fx(e.x, e.y + 4, 'dust', 3); return true;
  }
  if (e.atkCd > m.atk * 0.4) {                                // eben zugeschlagen: zurück und seitlich weg
    if (d < ring) { moveEnt(e, (-cs - sn * e.circle * 0.6) * sp * 0.9, (-sn + cs * e.circle * 0.6) * sp * 0.9); return true; }
  }
  if (e.atkCd > 0 && d > reach) {                             // Abklingzeit: Abstand halten und umkreisen
    const radial = clamp((d - ring) / ring, -1, 1);
    moveEnt(e, (cs * radial - sn * e.circle) * sp * 0.75, (sn * radial + cs * e.circle) * sp * 0.75); return true;
  }
  return false;                                               // bereit: Standard-Anlauf und Hieb
}

// Gorak (Boss): Phase 1 schwerer Hieb mit Ansage. Unter 50 % Leben: Brüllen (Phasenwechsel), schneller,
// dazu Sturmangriff (Linie als Ansage, prallt an Wänden ab und taumelt) und Bodenbeben (Ring als Ansage, Flächenschaden).
const shockFx = (x, y) => S.fx.push({ x, y, vx: 0, vy: 0, type: 'shock', s: 1, life: 520, maxLife: 520 });
function bossAI(e, tgt, d, reach, sp, dt, m) {
  const now = performance.now();
  if (!e.phase) e.phase = 1;
  if (e.phase === 1 && e.hp <= e.maxHp * 0.5) {
    e.phase = 2; e.roar = 1000; e.telegraph = 0; e.special = null; e.invuln = true;
    log(`${m.name} brüllt vor Wut!`, 'combat'); UI.toast('GORAK RAST', 2200);
    camShake(9, 500); shockFx(e.x, e.y); fx(e.x, e.y - 10, 'dust', 14); sfx('death', 1, earVol(e));
  }
  if (e.roar > 0) { e.roar -= dt; e.vx = e.vy = 0; if (e.roar <= 0) e.invuln = false; return; }
  const fast = e.phase === 2 ? 1.35 : 1, sp2 = sp * fast;
  e.chargeCd = (e.chargeCd || 3000) - dt; e.quakeCd = (e.quakeCd || 2000) - dt;
  const sa = e.special;
  if (sa) {
    sa.t -= dt;
    if (sa.kind === 'charge') {
      if (sa.t > 0) { e.vx = e.vy = 0; return; }                          // Ansage läuft
      sa.run = (sa.run ?? 480) - dt;
      const x0 = e.x, y0 = e.y; moveEnt(e, sa.ax * sp * 4.2, sa.ay * sp * 4.2);
      if (!sa.hit && dist(e, tgt) < reach) { sa.hit = true; hit(e, tgt, 1.3); }
      if (Math.hypot(e.x - x0, e.y - y0) < 0.5) {                           // gegen die Wand: taumelt, verwundbar
        e.special = null; e.stagger = 900; camShake(7, 250); fx(e.x, e.y - 20, 'spark', 10); sfx('metal', 1, earVol(e));
      } else if (sa.run <= 0) e.special = null;
      if (now % 60 < dt) fx(e.x, e.y + 4, 'dust', 2);
      return;
    }
    if (sa.kind === 'quake') {
      e.vx = e.vy = 0;
      if (sa.t <= 0) {
        e.special = null; camShake(8, 300); shockFx(e.x, e.y); fx(e.x, e.y, 'dust', 16); sfx('crit', 1, earVol(e));
        for (const t of combat) if (t.alive && t !== e && isHostile(e, t) && dist(e, t) < 110) { if (t.invuln) evaded(t); else hit(e, t, 0.8); }
      }
      return;
    }
  }
  if (e.phase === 2 && e.swing <= 0 && e.telegraph <= 0) {
    if (d > reach * 1.6 && d < 320 && e.chargeCd <= 0) {
      e.special = { kind: 'charge', t: 650, ax: Math.cos(e.aim), ay: Math.sin(e.aim) }; e.chargeCd = 5200; return;
    }
    if (d < 120 && e.quakeCd <= 0) { e.special = { kind: 'quake', t: 800 }; e.quakeCd = 6500; return; }
  }
  if (d > reach * 0.8) { seek(e, e.aim, sp2, dt, tgt); return; }
  e.vx = e.vy = 0;
  if (e.atkCd <= 0 && e.swing <= 0) {
    if (e.telegraph <= 0 && !e.windup) { e.windup = true; e.telegraph = m.telegraph / fast; return; }
    if (e.telegraph > 0) return;
    e.windup = false; e.atkCd = m.atk / fast; e.swingDur = m.atk * 0.5 / fast; e.swing = 0.001; e.hitDone = false;
  }
}

// Hrodvar (Tiefhall): schwerer Zweihänderhieb mit Ansage. Eiskreis (blauer Ring als Ansage 900 ms, dann Schaden im
// Umkreis und „Durchfroren“ 4 s, −40 % Tempo) — wer den Ring sieht, tritt heraus. Unter 50 %: einmal die Leibwache rufen
// (drei Tote, kurze Unverwundbarkeit), danach schneller. Gegenstück zu Gorak: nicht rennen, sondern Raum verweigern.
function frostKingAI(e, tgt, d, reach, sp, dt, m) {
  if (!e.phase) e.phase = 1;
  if (e.phase === 1 && e.hp <= e.maxHp * 0.5) {
    e.phase = 2; e.roar = 900; e.telegraph = 0; e.special = null; e.invuln = true;
    log(`${m.name} schlägt den Zweihänder auf den Stein. Die Leibwache erhebt sich!`, 'combat'); UI.toast('DIE LEIBWACHE ERHEBT SICH', 2200);
    camShake(7, 400); S.fx.push({ x: e.x, y: e.y, vx: 0, vy: 0, type: 'shock', ice: true, s: 1, life: 520, maxLife: 520 });
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, g = spawnEnemy('skeleton', e.map, (e.x / TS | 0) + Math.round(Math.cos(a) * 3), (e.y / TS | 0) + Math.round(Math.sin(a) * 2), { level: 7 });
      g.aggroId = tgt.id; g.aiState = 'pursue'; fx(g.x, g.y - 10, 'frost', 10); }
  }
  if (e.roar > 0) { e.roar -= dt; e.vx = e.vy = 0; if (e.roar <= 0) e.invuln = false; return; }
  const fast = e.phase === 2 ? 1.25 : 1;
  e.frostCd = (e.frostCd ?? 2500) - dt;
  const sa = e.special;
  if (sa && sa.kind === 'frost') {
    sa.t -= dt; e.vx = e.vy = 0;
    if (sa.t <= 0) {
      e.special = null; camShake(6, 250); sfx('crit', 1, earVol(e));
      S.fx.push({ x: e.x, y: e.y, vx: 0, vy: 0, type: 'shock', ice: true, s: 1, life: 520, maxLife: 520 }); fx(e.x, e.y - 6, 'frost', 18);
      for (const t of combat) if (t.alive && t !== e && isHostile(e, t) && dist(e, t) < 105) {
        if (t.invuln) { evaded(t); continue; }
        hit(e, t, 0.7);
        if (!(t.status ||= []).some(q => q.key === 'chilled')) t.status.push({ key: 'chilled', name: 'Durchfroren', left: 4000, desc: 'Langsamer (−40 %).' });
      }
    }
    return;
  }
  if (e.swing <= 0 && e.telegraph <= 0 && d < 130 && e.frostCd <= 0) { e.special = { kind: 'frost', t: 900 }; e.frostCd = e.phase === 2 ? 5200 : 7000; return; }
  if (d > reach * 0.8) { seek(e, e.aim, sp * fast, dt, tgt); return; }
  e.vx = e.vy = 0;
  if (e.atkCd <= 0 && e.swing <= 0) {
    if (e.telegraph <= 0 && !e.windup) { e.windup = true; e.telegraph = m.telegraph / fast; return; }
    if (e.telegraph > 0) return;
    e.windup = false; e.atkCd = m.atk / fast; e.swingDur = m.atk * 0.5 / fast; e.swing = 0.001; e.hitDone = false; e.enemySwing = true;
  }
}

// Gegner nutzen resolveSwing über tickCombatant; hier der Treffer für monsterhafte Angreifer
function resolveSwingEnemy(e) {
  const m = MONSTERS[e.mtype];
  for (const t of combat) {
    if (!t.alive || t.downed || t === e || !isHostile(e, t)) continue;
    if (dist(e, t) > m.reach + (t.r || 10)) continue;
    const ang = Math.atan2(t.y - e.y, t.x - e.x);
    if (Math.abs(normAng(ang - e.aim)) > 1.1) continue;
    if (t.invuln) { evaded(t); continue; }                    // der Hieb hätte getroffen: im letzten Moment ausgewichen
    if (e.confused > performance.now() && chance(0.5)) { float(e, 'daneben', 'rgba(200,190,160,ALPHA)'); continue; }   // Missklang
    hit(e, t, 1);
    if (!m.boss) break;
  }
  if (e.mtype === 'goblin' || e.mtype === 'goblin_warrior') e.retreat = 380;
}

function updateNpc(e, dt) {
  if (!e.alive) return;
  if (S.party.includes(e.id)) return partyAI(e, dt);
  const p = S.player;
  if (dist(e, p) > 900) { e.vx = e.vy = 0; return; }
  const wasSitting = e.sitting; e.sitting = false;
  if (e.fleeing && !e.angry) {                         // provozierter Zivilist/Händler flieht vor dem Spieler
    const d = dist(e, p);
    if (d > 360 || !p.alive) { e.fleeing = false; e.vx = e.vy = 0; return; }
    seek(e, Math.atan2(e.y - p.y, e.x - p.x), 1.5 * dt / 16, dt);
    return;
  }
  if (e.angry) {                                       // provozierte Wache/Krieger jagt den Spieler
    const d = dist(e, p), home = e.anchor || e, now = clock();
    if (!p.alive || p.map !== e.map) return calmDown(e, null);
    if (p.downed) return calmDown(e, 'subdued');       // Spieler liegt: der Kampf ist entschieden
    // Leine / Spur verloren — zuerst prüfen: wer 12 Spielminuten nichts sah, hat schon aufgegeben (auch wenn man zurückkommt)
    if (Math.hypot(e.x - home.x, e.y - home.y) > 640 || now - (e.sawPlayer ?? now) > 12) return calmDown(e, 'lost');
    if (d < 320) e.sawPlayer = now;                    // Sichtkontakt hält den Zorn wach
    e.aim = Math.atan2(p.y - e.y, p.x - e.x);
    if (d > 34) seek(e, e.aim, 1.35 * dt / 16, dt, p);
    else { e.vx = e.vy = 0; if (e.atkCd <= 0 && e.swing <= 0) attack(e); }
    return;
  }
  // Ordenswachen und der Pakt: ab Ruf −25 beim Orden erkennen sie einen Paktgebundenen und greifen an (Leine, Buße wie sonst;
  // danach misstrauisch statt sofort wieder zornig — sonst eine Endlosschleife aus Niederschlag und Aufrichten).
  if (e.guard && e.faction === 'order' && pactBound() && (S.factions.order || 0) <= -25 && !(e.wary > clock()) && p.alive && !p.downed && p.map === e.map && dist(e, p) < 220) {
    e.angry = true; e.brave = true; e.aggroId = p.id; e.sawPlayer = clock();
    log(`${e.name}: „Paktgebundener! Im Namen des Ordens — steh!“`, 'combat'); return;
  }
  // Hysterese: bemerken ab 220 px (Wachen 300), loslassen erst ab 340 px. Ohne sie pendelt die Figur an der Grenze.
  // Ein Alarm (von einer anderen Wache) zieht bis 700 px heran.
  const now = clock(), foe = x => x && x.alive && x.map === e.map && teamOf(x) === 'foe';
  const held = e.threatId ? byId(e.threatId) : null;
  const called = e.alarm && e.alarm.until > now ? byId(e.alarm.id) : null;
  const f = foe(held) && dist(e, held) < 340 ? held : foe(called) && dist(e, called) < 700 ? called :
    (e.map === S.map ? combat : S.ents[e.map]).find(x => x.kind === 'enemy' && foe(x) && !(e.faction && x.faction === e.faction) && dist(e, x) < (e.guard || e.escort ? 300 : 220));   // eigene Fraktion ist keine Bedrohung
  e.threatId = f ? f.id : null;
  const car = e.escort ? byId(e.escort) : null;
  if (e.escort && (!car || !car.alive)) { e.escort = null; e.escortLost = true; e.anchor = { x: e.x, y: e.y }; }
  const home = e.anchor || e, leashed = (DEFENDERS.has(e.key) && !e.guard && Math.hypot(e.x - home.x, e.y - home.y) > 360)
    || (car && car.alive && dist(e, car) > 420);                   // Karawanenwache: nicht weiter als 420 px vom Zug
  if (f && !leashed) {
    if (e.shop) e.shopClosed = Math.max(e.shopClosed || 0, now + 10);   // Kampf in der Nähe: Stand zu, bis Ruhe ist
    if (e.guard || e.escort || e.hostile || e.angry || DEFENDERS.has(e.key)) {   // Wachen und kampferprobte Bewohner stellen sich
      if (e.guard && !(e.calledAt > now - 5)) { e.calledAt = now; raiseAlarm(e, f); }
      e.aim = Math.atan2(f.y - e.y, f.x - e.x);
      const d = dist(e, f), reach = ITEMS[e.equip.weapon?.key]?.ranged ? 200 : 34;   // Schützen halten Abstand
      if (d > reach) seek(e, e.aim, (d > 160 ? 1.7 : 1.3) * dt / 16, dt, f);   // aus der Ferne herbeieilen
      else { e.vx = e.vy = 0; if (e.atkCd <= 0) attack(e); }
      return;
    }
    if (!e.brave) { seek(e, Math.atan2(e.y - f.y, e.x - f.x), 1.5 * dt / 16, dt); return; }   // Zivilisten fliehen
  }
  // Spieler liegt am Boden (nicht durch uns): Wachen eilen herbei und richten ihn auf, Zivilisten holen Hilfe
  if (p.downed && p.alive) {
    const d = dist(e, p), carer = e.guard || DEFENDERS.has(e.key) || e.prof === 'Heilerin';   // Wache, Kämpfer, Heilerin helfen selbst
    if (carer && (d < (e.guard ? 520 : 360) || e.aid > now)) {
      e.aim = Math.atan2(p.y - e.y, p.x - e.x);
      if (d > 26) seek(e, e.aim, 1.8 * dt / 16, dt, p);
      else { e.vx = e.vy = 0; e.aid = 0; stabilize(p, e);
        log(`${e.name}: ${e.prof === 'Heilerin' ? '„Ruhig. Ich hab dich.“' : '„Steh auf. Auf dieser Straße stirbt heute niemand.“'}`, 'party'); }
      return;
    }
    if (!carer && !e.brave && d < 300 && !e.calledHelp) {
      e.calledHelp = true;
      const g = S.ents[e.map].filter(o => o.kind === 'npc' && o.guard && o.alive && !o.downed && !o.angry && dist(o, e) < 1400)
        .sort((a, b) => dist(a, p) - dist(b, p))[0];
      if (g && !(g.aid > now)) { g.aid = now + 25; log(`${e.name} rennt los und holt ${g.name}.`, 'party'); }   // einer genügt
    }
  } else e.calledHelp = false;
  // Nach einer Bluttat meiden Zeugen den Spieler einen Tag lang
  if (e.afraid > now && !e.guard && dist(e, p) < 170) { seek(e, Math.atan2(e.y - p.y, e.x - p.x), 1.4 * dt / 16, dt); return; }
  if (car && car.alive) {                              // Karawanenwache: geht auf ihrem Platz am Zug mit
    const q = SIM.escortSlot(car, e.slot), d = Math.hypot(q.x - e.x, q.y - e.y);
    e.anchor = { x: q.x, y: q.y };
    if (d > 10) seek(e, Math.atan2(q.y - e.y, q.x - e.x), Math.min(1.8, (car.vx || car.vy ? 0.9 : 0.6) + d / 45) * dt / 16, dt, q);   // Zugtempo + Aufholen
    else { e.vx = e.vy = 0; if (car.vx || car.vy) e.aim = Math.atan2(car.vy, car.vx); }
    return;
  }
  // Tagesablauf
  const h = S.minute / 60;
  let target = e.anchor;
  if (e.schedulePos) target = e.schedulePos;
  const night = h >= 22 || h < 7;
  if (night) target = e.anchor;
  else if (h >= (e.till || 18) && e.eve) target = e.eve;          // Feierabend: vor dem Haus, in der Schenke oder daheim
  else if (h >= 18 && h < 22 && e.home) target = { x: e.anchor.x + 40, y: e.anchor.y + 20 };
  if (target.sit) {                                             // Sitzplatz: hinsetzen statt herumstehen (setzt sich nach Ankunft)
    const d = Math.hypot(target.x - e.x, target.y - e.y);
    if (d > 8) { seek(e, Math.atan2(target.y - e.y, target.x - e.x), 0.9 * dt / 16, dt, target); return; }
    e.vx = e.vy = 0; e.sitting = true; e.sitDir = 'S'; if (!wasSitting) { e.x = target.x; e.y = target.y; }
    return;
  }
  if (e.shop && !night && dist(e, p) < 90 && !(e.vx || e.vy) && !(e.tradeT > performance.now())) {   // Händler zeigt die Ware, wenn man nah kommt
    e.tradeT = performance.now() + 2600; act(e, 'trade', 1100, p);
  }
  const jit = target.in || (e.homeId && (night || target === e.anchor)) ? 6 : 46;  // drinnen nur ein paar Schritte, sonst gegen die Wand
  e.aiTimer -= dt;
  if (e.aiTimer <= 0) { e.aiTimer = ri(2200, 5200); e.wander = { x: target.x + ri(-jit, jit), y: target.y + ri(-jit * 0.87, jit * 0.87) }; }
  if (e.wander) {
    const d = Math.hypot(e.wander.x - e.x, e.wander.y - e.y);
    if (d > 10) seek(e, Math.atan2(e.wander.y - e.y, e.wander.x - e.x), 0.9 * dt / 16, dt, e.wander);
    else e.vx = e.vy = 0;
  }
}

// Kampferprobte Bewohner: wehren Feinde nahe ihrem Posten ab (Leine 360 px), laufen aber keinen Alarmen hinterher
const DEFENDERS = new Set(['borin', 'kelan', 'aldric', 'tomas']);

// Eine Wache, die kämpft, ruft die Wachen im Umkreis herbei (leichtgewichtiger Alarm statt Glocken-Simulation)
function raiseAlarm(e, f) {
  const until = clock() + 8;
  for (const o of S.ents[e.map])
    if (o !== e && o.kind === 'npc' && o.guard && o.alive && !o.downed && !o.angry && !o.threatId && dist(o, e) < 480) o.alarm = { id: f.id, until };
}

// Zorn endet bewusst: Spur verloren/zu weit vom Posten (→ zurück, misstrauisch) oder Spieler überwältigt
// (→ die Ordnungsmacht nimmt Buße und lässt ihn leben; ein Handgemenge ist kein Todesurteil).
function calmDown(e, why) {
  const p = S.player;
  const group = why === 'subdued' ? S.ents[e.map].filter(o => o.kind === 'npc' && o.angry && dist(o, p) < 600) : [e];
  for (const o of group) { o.angry = false; o.aggroId = null; o.aiTimer = 0; o.wander = null; o.swing = 0; o.wary = clock() + 180; }
  if (why === 'lost' && dist(e, p) < 800) log(`${e.name} gibt die Verfolgung auf und kehrt zurück.`, 'combat');
  if (why !== 'subdued') return;
  const law = group.find(o => o.guard || o.faction === 'valen' || o.faction === 'order');
  if (!law) return log('Sie lassen von dir ab und gehen. Niemand hilft dir auf.', 'combat');
  const fine = Math.min(S.gold, 30);
  S.gold -= fine;
  p.downed = false; act(p, 'rise', 520); B.healPart(p, 'torso', Math.max(4, p.body.torso.max * 0.2) - p.body.torso.hp);   // aufgerichtet, nicht gepflegt
  log(`${law.name} nimmt dir ${fine} Gold als Buße ab. „Beim nächsten Mal hängst du.“`, 'faction');
  UI.toast(fine ? `Buße: ${fine} Gold` : 'Verwarnt', 3200);
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
      const amt = (22 + m.attributes.intelligence * 1.4) * (wounded.titleClass === 'necromancer' ? 0.5 : 1);
      B.heal(wounded, amt);
      if (wounded.downed) { wounded.downed = false; act(wounded, 'rise', 520); }
      fx(wounded.x, wounded.y - 14, 'heal', 14); float(wounded, '+' + Math.round(amt), 'rgba(120,170,90,ALPHA)');
      log(`${m.name} heilt ${wounded.name}.`, 'party');
    }
  }
  if (cmd === 'retreat' || (m.morale < 22 && chance(0.002))) {
    if (dist(m, p) > 60) seek(m, Math.atan2(p.y - m.y, p.x - m.x), sp, dt, p); else m.vx = m.vy = 0;
    return;
  }
  const foe = foes.sort((a, b) => dist(m, a) - dist(m, b))[0];   // der nächste Feind, nicht der erste in der Liste
  if (foe && cmd !== 'hold' || (foe && cmd === 'hold' && dist(m, foe) < 90)) {
    m.aim = Math.atan2(foe.y - m.y, foe.x - m.x);
    const it = m.equip.weapon ? ITEMS[m.equip.weapon.key] : null;
    const want = it && it.ranged ? 170 : (it ? it.reach : 30) + 12;
    const d = dist(m, foe);
    if (it && it.ranged && d < 110) moveEnt(m, -Math.cos(m.aim) * sp, -Math.sin(m.aim) * sp);
    else if (d > want) seek(m, m.aim, sp, dt, foe);
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
  if (d > 26) seek(m, Math.atan2(ty - m.y, tx - m.x), sp * Math.min(1.6, d / 60), dt, p);
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

// ================= Angriff auf Neutrale: Reaktion, Alarm, Ruf =================
const GUARDISH = c => c.prof !== 'Heilerin' && (c.guard || c.hostile || c.brave || c.faction === 'valen' || c.faction === 'order' ||
  ['borin', 'kelan', 'rook', 'havel', 'aldric'].includes(c.key));   // die Heilerin kämpft nicht, sie flieht
function provoke(target, attacker) {
  if (attacker !== S.player || !target.alive) return;
  const firstTime = !target.provoked;
  target.provoked = true; target.lastHurt = performance.now(); target.sawPlayer = clock();
  // Rolle bestimmt die Reaktion
  if (GUARDISH(target)) { target.angry = true; target.brave = true; target.aggroId = S.player.id; }
  else { target.fleeing = true; if (target.shop) target.shopClosed = clock() + 1440; }   // Zivilisten und Händler fliehen; Laden bis morgen zu
  if (!firstTime) return;                                                       // Ruf/Alarm nur einmal je Tat
  const critic = partyMembers().find(m => !(m.traits || []).includes('grausam'));   // die Gruppe sieht es
  for (const m of partyMembers()) if (!(m.traits || []).includes('grausam')) m.morale -= 5;
  if (critic) log(`${critic.name}: „Was tust du da?!“`, 'party');
  // Zeugen im Umkreis (Distanz = Kern des Alarms; Wände zählen grob über Distanz)
  const witnesses = S.ents[S.map].filter(e => e.kind === 'npc' && e.alive && e !== target && !S.party.includes(e.id) && dist(e, target) < 240);
  for (const w of witnesses) {
    w.alarmed = true;
    const ally = GUARDISH(w) || (w.faction && w.faction === target.faction) || w.kin;
    if (ally && GUARDISH(w)) { w.angry = true; w.brave = true; w.aggroId = S.player.id; w.sawPlayer = clock(); }   // Wachen/Krieger greifen ein
    else { w.fleeing = true; }                                                               // Übrige fliehen/schreien
  }
  addRel(target.key, -35);
  const seen = witnesses.length;
  if (target.faction && S.factions[target.faction] != null) {
    const drop = 4 + Math.min(seen, 5) * 3;                                     // eine Tat stellt nicht die ganze Fraktion um
    S.factions[target.faction] = clamp(S.factions[target.faction] - drop, -100, 100);
    log(`${FACTIONS[target.faction]?.name || 'Fraktion'}: Ansehen −${drop} (Zeugen: ${seen}).`, 'faction');
    if (S.factions[target.faction] <= -60 && S.ranks[target.faction] >= 0) { S.ranks[target.faction] = -1; log(`${FACTIONS[target.faction].name} verstößt dich.`, 'faction'); }
  }
  const here = locAt(S.player.x / TS | 0, S.player.y / TS | 0);
  if (here) chronicle(`Blut in ${here.name}`, 'crime', `${S.player.name} hebt die Hand gegen ${target.name}.`);
  log(`Du greifst ${target.name} an!`, 'combat');
  UI.toast(seen ? `${seen} Zeuge${seen > 1 ? 'n' : ''}! Dein Ruf leidet.` : 'Niemand hat es gesehen …', 3200);
}

// ================= Interaktion =================
function interactables() {
  const p = S.player;
  return S.ents[S.map].filter(e => e !== p && dist(e, p) < 62 &&
    (e.kind === 'npc' || e.kind === 'item' || e.kind === 'grave' ||
     (e.kind === 'prop' && (e.portal || e.harvest || e.loot || e.claim || e.rite || e.type === 'tree' || e.type === 'shrine' || e.type === 'board' || e.type === 'chest' || e.type === 'crate'))))
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
    t.rite ? `<b>E</b> ${t.label} untersuchen` :
    t.type === 'shrine' ? `<b>E</b> Beten` :
    t.type === 'board' ? `<b>E</b> Anschlagbrett lesen` : `<b>E</b> Durchsuchen`;
  UI.setPrompt(label);
}
// Körpersprache beim Handeln (§26 Interaktionen): kurz knien, arbeiten, aufrichten — rein sichtbar, blockiert nichts.
function act(c, kind, ms, toward) {
  const now = performance.now();
  let dir = null;
  if (toward) { const a = Math.atan2(toward.y - c.y, toward.x - c.x), ca = Math.cos(a), sa = Math.sin(a);
    dir = Math.abs(ca) > Math.abs(sa) * 0.9 ? (ca > 0 ? 'E' : 'W') : (sa > 0 ? 'S' : 'N'); }
  c.act = { kind, at: now, until: now + ms, dir };
}
function doInteract() {
  const p = S.player, t = interactables()[0];
  if (!t) return;
  if (t.kind === 'npc') return talk(t);
  if (!t.portal) act(p, t.type === 'tree' || t.harvest === 'stone' || t.harvest === 'iron' ? 'work' : 'kneel', t.type === 'shrine' ? 1100 : t.type === 'board' ? 0 : 420, t);
  if (t.kind === 'item') {
    if (giveItem(p, t.item)) {                                // das Exemplar selbst (Zustand, Rarität), nicht eine neue Kopie
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
  if (t.rite === 'urn') return urnRite(t);
  if (t.rite === 'soulwell') return soulWell(t);
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
    for (const k of t.loot) { const o = mkItem(k, 1, { bonus: 1 }); if (!giveItem(p, o)) dropItemAt(p.map, p.x + ri(-12, 12), p.y + 10, o); onItemGained(k);
      log(`Gefunden: ${ITEMS[k].name}${o.rar ? ` (${RARITY[o.rar]})` : ''}.`, 'world'); }
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

// Ankunftspunkt je Karte: fest vor der Tür, nicht zufällig (sonst landet man teils im Eingang selbst)
// Ankunft: im Dungeon am Treppenfuß, an der Oberfläche vor dem Eingang, durch den man kam (Grube oder Tiefhall)
const ARRIVAL = { mine: () => MAPS.mine.entry, deep: () => MAPS.deep.entry,
  world: from => { const door = S.ents.world.find(e => e.kind === 'prop' && e.portal === from);
    if (door) return freeSpotNear('world', door.x / TS | 0, (door.y / TS | 0) + 3, 1);
    const [x, y] = worldPt(62, 21); return { x: x * TS + TS / 2, y: y * TS + TS / 2 }; } };
function travel(to) {
  const p = S.player, from = S.map;
  leavePursuit(from, to);
  const pi = S.ents[S.map].indexOf(p); if (pi >= 0) S.ents[S.map].splice(pi, 1);
  const members = [...partyMembers(), ...S.ents[from].filter(e => e.servant === p.id && e.alive)];   // Diener gehen mit ihrem Herrn
  for (const m of members) { const a = S.ents[m.map]; if (a.includes(m)) a.splice(a.indexOf(m), 1); }
  S.map = to; p.map = to;
  const spot = ARRIVAL[to](from);
  p.x = spot.x; p.y = spot.y;
  S.ents[to].push(p);
  for (const m of members) { m.map = to; m.x = p.x + ri(-24, 24); m.y = p.y + ri(-24, 24); if (m.servant) { m.anchor = { x: m.x, y: m.y }; m.aggroId = null; } S.ents[to].push(m); }
  log(DUNGEONS[to] ? DUNGEONS[to].enter : 'Du kehrst an die Oberfläche zurück.', 'world');
  UI.toast(DUNGEONS[to] ? DUNGEONS[to].name : 'Greenmark-Grenzland');
  arrivePursuit(to);
  save();
}

// ================= Verfolgung über Kartengrenzen =================
// Ein Kartenwechsel setzt keinen Kampfzustand stillschweigend zurück (GDD §Übergänge):
// Wer Innenräume betreten kann (MONSTERS.interiors), folgt nach seiner Laufzeit zur Tür durch dieselbe Tür.
// Tiere lauern 90 Spielminuten am Eingang, danach misstrauisch zurück. Gorak hält seine Halle.
// Die Karte, die der Spieler verlässt, ruht (nur S.map wird simuliert) — Fristen laufen daher auf der Spieluhr.
function leavePursuit(from, to) {
  const p = S.player, now = clock(); let n = 0;
  for (const e of S.ents[from]) {
    if (e.kind !== 'enemy' || !e.alive || !isHostile(e, p)) continue;
    const m = MONSTERS[e.mtype], d = dist(e, p);
    if (d > 560 || !(e.aggroId === p.id || (e.aiState === 'pursue' && d < m.sight))) continue;
    if (m.boss) { e.aggroId = null; e.aiState = 'idle'; continue; }
    if (m.interiors && n < 4) { n++; e.follow = { to, at: now + d / (m.speed * 62.5) + 1.5 }; }   // enge Tür: höchstens vier
    else e.lurk = { until: now + 90 };
  }
}
function arrivingPursuers() {                                   // alle 250 ms: wer die Tür erreicht hat, kommt herein
  const now = clock(), p = S.player; let came = 0;
  for (const k of Object.keys(S.ents)) {
    if (k === S.map) continue;
    const arr = S.ents[k];
    for (let i = arr.length - 1; i >= 0; i--) {
      const e = arr[i];
      if (!e.follow) continue;
      if (!e.alive || now > e.follow.at + 60) { e.follow = null; continue; }   // zu spät: Spur kalt
      if (e.follow.to !== S.map || now < e.follow.at) continue;
      arr.splice(i, 1); e.follow = null;
      const door = S.ents[S.map].find(o => o.portal === k) || p;
      e.map = S.map; e.x = door.x + ri(-10, 10); e.y = door.y + ri(-6, 6);
      e.anchor = { x: e.x, y: e.y }; e.aggroId = p.id; e.aiState = 'pursue';
      S.ents[S.map].push(e); came++;
      log(`${MONSTERS[e.mtype].name} folgt dir durch den Eingang!`, 'combat');
    }
  }
  if (came) UI.toast(came > 1 ? `${came} VERFOLGER` : 'VERFOLGER', 2200);
}
function arrivePursuit(to) {                                     // Rückkehr: Lauernde und Umgekehrte stehen vor der Tür
  const p = S.player, now = clock(), tx = p.x / TS | 0, ty = p.y / TS | 0;
  for (const e of S.ents[to]) {
    if (e.kind !== 'enemy' || !e.alive || !(e.follow || e.lurk)) continue;
    const waiting = e.follow || now < e.lurk.until;
    if (waiting) {
      const s = freeSpotNear(to, tx, ty + 3, 2);
      e.x = s.x; e.y = s.y; e.aggroId = p.id; e.aiState = 'pursue';
      log(`${MONSTERS[e.mtype].name} hat am Eingang gewartet.`, 'combat');
    } else { e.x = e.anchor.x; e.y = e.anchor.y; e.aggroId = null; e.aiState = 'idle'; e.wary = now + 300; }   // aufgegeben, wachsam
    e.follow = null; e.lurk = null;
  }
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
  for (const map of MAP_KEYS) for (const e of S.ents[map]) if (e.depleted && e.respawn <= S.day) { e.depleted = false; }
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
    if (e.kind === 'enemy' && e.armyId && !S.war.battles.some(b => b.sides.includes(e.armyId)) && (p.map !== 'world' || dist(e, p) > 1400)) { W.splice(i, 1); continue; }
    // Reise-Begegnungen räumen sich auf, sobald der Spieler weit weg ist
    if ((e.encounter || e.escortLost) && !e.follow && !e.lurk && !S.party.includes(e.id) && (p.map !== 'world' || dist(e, p) > 1800)) W.splice(i, 1);
  }
  for (const a of SPAWN_AREAS) {
    const count = S.ents[a.map].filter(e => e.kind === 'enemy' && !e.boss &&
      Math.hypot(e.x / TS - a.x, e.y / TS - a.y) < a.r + 4).length;
    if (count >= a.cap) continue;
    const tx = a.x + ri(-a.r, a.r), ty = a.y + ri(-a.r, a.r);
    if (a.map === S.map && Math.hypot(tx * TS - p.x, ty * TS - p.y) < 620) continue;
    if (a.map === 'world' && townAt(tx, ty, 4)) continue;              // Banden lauern vor der Stadt, nicht zwischen den Häusern
    if (chance(0.55)) spawnEnemy(pick(a.types), a.map, tx, ty);
  }
}

// ================= Dialog =================
function talk(npc) {
  const p = S.player, rel = S.relations[npc.key] ?? 0, now = clock();
  const leave = [{ text: '[Gehen]', fn: () => UI.closeDialogue() }];
  // Wer gerade kämpft, flieht oder sich fürchtet, plaudert nicht
  if (npc.angry) return UI.dialogue(npc, '„Waffe runter! Sofort!“', leave);
  if (npc.fleeing || npc.afraid > now) return UI.dialogue(npc, '„Bleib weg von mir!“', leave);
  if (npc.threatId && byId(npc.threatId)?.alive) return UI.dialogue(npc, '„Nicht jetzt — siehst du nicht, was hier los ist?!“', leave);
  if (pactBound() && npc.faction === 'order')                // Folge des Paktes: der Orden spricht nicht mit den Toten
    return UI.dialogue(npc, npc.key === 'kelan' ? '„Ich habe Männer begraben, die ehrlicher gestorben sind, als du lebst. Geh.“'
      : '„Weiche, Paktgebundener. Der Orden spricht nicht mit denen, die den Toten gehören.“', leave);
  const choices = [];
  // Quests des Gebers
  for (const [k, Q] of Object.entries(QUESTS)) {
    if (Q.giver !== npc.key) continue;
    const st = S.quests[k];
    if (!st && questAvailable(k)) choices.push({ text: `Was liegt an? (${Q.name})`, fn: () => offerQuest(npc, k) });
    else if (st && st.state === 'active' && questComplete(k) && !Q.pact) choices.push({ text: `Erledigt. (${Q.name})`, fn: () => turnIn(npc, k) });
  }
  pactChoices(npc, choices);
  if (npc.key === 'jorun' && S.quests.q_lila?.state === 'active' && S.flags.lilaFound)
    choices.push({ text: 'Über deine Tochter …', fn: () => lilaOutcome(npc) });
  const tcls = teachable(npc);
  if (tcls) choices.push({ text: `Kannst du mich ausbilden? (${CLASSES[tcls].name})`, fn: () => teach(npc, tcls) });
  if (npc.teaches && Object.keys(S.player.tree || {}).length) choices.push({ text: `Hilf mir, anders zu kämpfen. (Talente vergessen, ${respecCost()} Gold)`, fn: () => respec(npc) });
  if (npc.faction && S.ranks[npc.faction] === -1 && ['valen', 'order', 'undead'].includes(npc.faction))
    choices.push({ text: `Wie tritt man bei — ${FACTIONS[npc.faction].name}?`, fn: () => joinFaction(npc) });
  const occupied = npc.town && S.war.nodes[npc.town]?.owner === 'undead';
  if (npc.shop && npc.shopClosed > now) choices.push({ text: 'Zeig mir deine Waren.', fn: () => UI.dialogue(npc,
    npc.provoked ? '„Für dich ist heute geschlossen. Vielleicht für immer.“' : '„Der Stand ist zu, bis sich die Lage beruhigt.“', leave) });
  else if (npc.shop && npc.till && (hourNow() >= npc.till || hourNow() < 7)) choices.push({ text: 'Zeig mir deine Waren.', fn: () => UI.dialogue(npc,
    '„Der Laden ist zu. Komm morgen früh wieder.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]) });   // Ladenzeiten
  else if (npc.shop && npc.town === 'vharnholm' && !deadWelcome()) choices.push({ text: 'Zeig mir deine Waren.', fn: () => UI.dialogue(npc,
    '„Vharnholm handelt mit denen, die zu uns gehören. Du gehörst noch zu den Lauten.“ (Mitglied der Stillen Schar oder paktgebunden)', leave) });
  else if (npc.shop && occupied) choices.push({ text: 'Zeig mir deine Waren.', fn: () => UI.dialogue(npc, '„Handel? Die Toten halten die Stadt. Ich verstecke, was ich habe.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]) });
  else if (npc.shop) choices.push({ text: 'Zeig mir deine Waren.', fn: () => { UI.closeDialogue(); UI.openModal('trade', npc); } });
  if (npc.smith) choices.push({ text: 'Kannst du das ausbessern?', fn: () => repairAll(npc) });
  if (npc.recruit && !S.party.includes(npc.id)) choices.push({ text: 'Komm mit mir.', fn: () => recruit(npc) });
  if (S.party.includes(npc.id)) choices.push({ text: 'Bleib hier.', fn: () => { dismiss(npc); UI.closeDialogue(); } });
  choices.push({ text: 'Was gibt es Neues?', fn: () => gossip(npc) });
  choices.push({ text: '[Gehen]', fn: () => UI.closeDialogue() });
  // Ruf färbt die Begrüßung: nach einer Tat gegen jemanden ist der Ton kalt
  const greet = rel <= -30 ? '„Du. Sag, was du willst, und dann geh.“' : npc.wary > now && npc.provoked ? '„Ich behalte dich im Auge.“'
    : pactBound() && !npc.undead && npc.faction !== 'undead' && !S.party.includes(npc.id) ? pactGreet(npc) : npc.greet;
  UI.dialogue(npc, greet, choices);
  if (rel === 0) addRel(npc.key, 1);
}

function gossip(npc) {
  const lines = [
    `„Die Grube im Norden ist verloren. Etwas Großes hat sich dort eingerichtet.“`,
    `„Im Frostkamm gibt es eine Treppe ins Eis. Wer runtergeht, hört Hämmer, sagen sie. Niemand schmiedet da unten.“`,
    `„An der Nordfurt sammelt Valen Männer. Das bedeutet nie etwas Gutes.“`,
    `„Der Friedhof im Süden — geh nachts nicht hin.“`,
    `„Rook sitzt im Moor. Er zahlt gut, aber nicht lange.“`,
    `„Kelan der Graue betet am Waldschrein. Der Mann war einmal ein Ritter.“`,
    `„Die Preise steigen. Krieg im Norden, sagen sie.“`,
    S.settlement ? `„Man redet über dein Lager bei ${S.settlement.name}.“` : `„Freies Land gibt es genug. Mut, es zu halten, weniger.“`,
  ];
  const town = npc.homeTown || npc.post;                  // Bewohner und Wachen reden auch über ihren eigenen Ort
  if (TOWN_GOSSIP[town]) lines.push(...TOWN_GOSSIP[town], ...TOWN_GOSSIP[town]);
  UI.dialogue(npc, pick(lines), [{ text: 'Und sonst?', fn: () => gossip(npc) }, { text: '[Gehen]', fn: () => UI.closeDialogue() }]);
}
const TOWN_GOSSIP = {
  eren: ['„Seit die Grube verloren ist, backt Eren kleinere Brote. Aber wir backen noch.“', '„Die Scheunen sind halb leer. Der Winter wird lang.“'],
  northcity: ['„Brann schmiedet den besten Stahl im Norden. Sie sagt, unter dem Frostkamm gab es mal besseren.“', '„Nordfurt hat Mauern. Das beruhigt die Leute — bis sie fragen, warum.“', '„Die Garnison zahlt pünktlich. Das ist mehr, als man vom König sagen kann.“'],
  saltport: ['„Das Salz geht nach Norden, das Silber kommt zurück. Meistens.“', '„Die Boote fahren nicht mehr weit raus. Draußen treibt Asche auf dem Wasser.“'],
  kreuzweg: ['„Valen hat einen Posten an den Rand der Öde gestellt, die Grenzwacht. Man schickt dorthin, wen man loswerden will.“', '„Hier kreuzen sich die Straßen — und die Klingen. Söldner sind gut fürs Geschäft, bis sie es nicht mehr sind.“', '„Wer den Markt am Kreuzweg hält, hält das Mittelland.“'],
  ashford: ['„Die Karawanen halten hier, weil dahinter nur noch Asche kommt.“', '„Die Palisade ist neu. Die Angst dahinter ist alt.“'],
  sonnwacht: ['„Die Pilger kommen wegen des Schreins. Sie bleiben wegen der Mauern.“', '„Der Orden zählt die Toten. Und manchmal zählen die Toten zurück.“'],
  vharnholm: ['„Am Aschensee steht ein Brunnen. Wer zu uns gehört, trinkt dort Namen.“', '„Im Knochenwald graben Lebende nach unserem Grabgut. Sael zahlt für ihr Schweigen.“',
    '„Wir sind keine Schar. Wir sind eine Stadt. Das vergessen die Lebenden immer.“'],
};

// ================= Der Pakt der Stillen Schar (Titelklassen Nekromant / Hexenmeister) =================
// 1 Kontakt: Morvath (Grabsiegel) → 2 Prüfung: Ahnenurne aus der Nekropole (Kampf gegen den Wächter oder, als Mitglied der
// Schar, er tritt beiseite) → 3 Entscheidung: zu Ysra (Ahnen, Nekromant) oder zu Vhal (Schatten, Hexenmeister) →
// 4 Ritual mit Kosten → 5 Titelklasse. Unumkehrbar (GDD); Nekromant und Hexenmeister schließen einander aus.
function pactChoices(npc, choices) {
  const q = S.quests.q_pact, urn = hasItem(S.player, 'ancestor_urn', 1);
  if (npc.key === 'morvath' && S.quests.q_undead?.state === 'done' && !q && !pactBound())
    choices.unshift({ text: 'Und der Pakt, von dem du sprachst?', fn: () => { S.flags.pactHint = true; UI.dialogue(npc,
      '„Nicht hier. Ein Friedhof ist eine Tür, kein Haus. Geh nach Alt-Vharn, hinter die Knochengrenze im Südosten. Frag nach Ysra, der Stimme der Gruft. Und wenn dir am Turm einer namens Vhal etwas flüstert: hör zu. Glaub ihm nichts.“',
      [{ text: 'Alt-Vharn also.', fn: () => { log('Morvath: Der Pakt wird in Alt-Vharn geschlossen — bei Ysra, der Stimme der Gruft.', 'quest'); UI.closeDialogue(); } }]); } });
  const g = S.quests.q_grove;
  if (npc.key === 'mira' && g?.state === 'active' && (g.progress[0] || 0) >= 4 && hasItem(S.player, 'herb', 3))
    choices.unshift({ text: 'Die Wölfe sind fort, hier ist das Kraut. (Ruf des Hains → Druide)', fn: () => groveRitual(npc) });
  if (npc.key === 'mira' && titleFull() && !(S.player.titleClasses || []).includes('druid'))
    choices.unshift({ text: 'Kann ich dem Hain dienen?', fn: () => UI.dialogue(npc, '„Du trägst schon zwei Namen, die nicht deine eigenen sind. Ein dritter würde dich zerreißen.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]) });
  const mq = S.quests.q_monk;
  if (npc.key === 'ilva' && mq?.state === 'active' && questComplete('q_monk'))
    choices.unshift({ text: 'Zehnmal ausgewichen, vier Tote ruhen. (Probe der Stillen Hand → Mönch)', fn: () => monkVow(npc) });
  if (npc.key === 'ilva' && titleFull() && !(S.player.titleClasses || []).includes('monk'))
    choices.unshift({ text: 'Kann ich die Stille Hand lernen?', fn: () => UI.dialogue(npc, '„Du trägst zwei Namen, die dich festhalten. Die Stille Hand braucht leere Hände.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]) });
  if (!q || q.state !== 'active') return;
  if (npc.key === 'ysra' && urn) choices.unshift({ text: 'Die Urne. Ich will die Toten führen. (Ahnenpakt → Nekromant)', fn: () => pactRitual('necromancer', npc) });
  if (npc.key === 'vhal') choices.unshift(urn
    ? { text: 'Die Urne. Zeig mir, was die Schatten geben. (Schattenpakt → Hexenmeister)', fn: () => pactRitual('warlock', npc) }
    : { text: 'Was willst du von mir?', fn: () => UI.dialogue(npc, '„Ysra lässt dich die Urne holen, damit die Toten ihr gehorchen. Bring sie mir, und sie gehorchen niemandem mehr — außer dir, ein wenig. Das ist ehrlicher.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]) });
}
function pactRitual(key, npc) {
  const p = S.player, T = TITLE_CLASSES[key];
  UI.dialogue(npc, key === 'necromancer'
    ? '„Knie. Sag ihnen deinen Namen — sie werden ihn behalten. Und einen Teil von dir.“'
    : '„Zerbrich sie. Atme, was herauskommt. Dein Atem wird dir danach nie wieder ganz gehören.“', [
    { text: `Den Pakt schließen: ${T.name}. ${T.cost.desc}`, fn: () => {
      if (titleFull()) { UI.closeDialogue(); return UI.toast(`Mehr als ${MAX_TITLES} Titelklassen trägt kein Mensch.`); }
      removeItem(p, 'ancestor_urn', 1);
      Object.assign(S.quests.q_pact, { state: 'done', outcome: key });
      gainXp(p, QUESTS.q_pact.reward.xp);
      log(`Auftrag abgeschlossen: ${QUESTS.q_pact.name}`, 'quest');
      UI.closeDialogue();
      act(p, 'kneel', 2600, npc); sfx('magic');                   // Ritual: knien, Ringe aus Totenlicht, die Augen fangen an zu glimmen
      for (let i = 0; i < 4; i++) setTimeout(() => { fx(p.x, p.y - 14, key === 'necromancer' ? 'necro' : 'shadow', 14);
        S.fx.push({ x: p.x, y: p.y - 6, vx: 0, vy: 0, type: 'ring', s: 2 + i, life: 700, maxLife: 700 }); }, i * 450);
      unlockTitle(key, key === 'necromancer' ? 'Ahnenpakt bei Ysra in Alt-Vharn' : 'Schattenpakt bei Vhal am Nekromanten-Turm');
      save();
    } },
    { text: 'Noch nicht.', fn: () => UI.closeDialogue() },
  ]);
}
function groveRitual(npc) {
  const p = S.player, T = TITLE_CLASSES.druid;
  UI.dialogue(npc, pactBound() ? '„Die Toten haben dich schon berührt. Der Wald nimmt dich trotzdem — er hat schon Schlimmeres überwachsen.“'
    : '„Knie an der Quelle. Leg das Kraut hinein. Wenn das Wasser klar wird, gehörst du dazu.“', [
    { text: `Dem Hain dienen: ${T.name}. ${T.cost.desc}`, fn: () => {
      if (!unlockTitle('druid', 'Ruf des Hains bei Mira im Westwald')) return UI.closeDialogue();
      removeItem(p, 'herb', 3); Object.assign(S.quests.q_grove, { state: 'done' }); gainXp(p, QUESTS.q_grove.reward.xp);
      log(`Auftrag abgeschlossen: ${QUESTS.q_grove.name}`, 'quest'); UI.closeDialogue();
      act(p, 'kneel', 2200, npc); sfx('magic');
      for (let i = 0; i < 3; i++) setTimeout(() => fx(p.x, p.y - 10, 'heal', 16), i * 400);
      save();
    } },
    { text: 'Noch nicht.', fn: () => UI.closeDialogue() },
  ]);
}
function monkVow(npc) {
  const p = S.player, T = TITLE_CLASSES.monk;
  UI.dialogue(npc, '„Leg ab, was dich schwer macht. Das Gold zuerst — das Kloster braucht es mehr als du. Dann atme. Die Hand folgt.“', [
    { text: `Das Gelübde ablegen: ${T.name}. ${T.cost.desc}`, fn: () => {
      if (!unlockTitle('monk', 'Probe der Stillen Hand bei Ilva in Sonnwacht')) return UI.closeDialogue();
      Object.assign(S.quests.q_monk, { state: 'done' }); gainXp(p, QUESTS.q_monk.reward.xp);
      log(`Auftrag abgeschlossen: ${QUESTS.q_monk.name}`, 'quest'); UI.closeDialogue();
      act(p, 'kneel', 2200, npc); sfx('magic');
      for (let i = 0; i < 3; i++) setTimeout(() => S.fx.push({ x: p.x, y: p.y - 8, vx: 0, vy: 0, type: 'ring', s: 2 + i, life: 600, maxLife: 600 }), i * 350);
      save();
    } },
    { text: 'Noch nicht.', fn: () => UI.closeDialogue() },
  ]);
}
function urnRite(t) {
  const p = S.player, q = S.quests.q_pact;
  if (!q || q.state !== 'active') return UI.toast('Kalte Steine. Namen, die niemand mehr liest.', 3000);
  if (hasItem(p, 'ancestor_urn', 1) || S.ents[p.map].some(e => e.kind === 'item' && e.item.key === 'ancestor_urn'))
    return UI.toast('Die Urne ist fort. Die Gruft schweigt.', 2600);
  const w = S.ents[p.map].find(e => e.mtype === 'crypt_warden' && e.alive);
  if (S.ranks.undead >= 0 || S.flags.wardenSlain) {            // Überzeugung: wer zur Schar gehört, dem tritt der Wächter aus dem Weg
    addItem(p, 'ancestor_urn'); onItemGained('ancestor_urn');
    log(S.flags.wardenSlain ? 'Hinter dem gefallenen Wächter steht die Urne, als hätte sie gewartet.' : 'Der Wächter der Nekropole erkennt das Zeichen der Schar und tritt beiseite. Du nimmst die Ahnenurne.', 'quest');
    return UI.toast('AHNENURNE', 2600);
  }
  if (w) return UI.toast('Der Wächter steht zwischen dir und der Urne.', 2400);
  const e = spawnEnemy('crypt_warden', p.map, t.x / TS | 0, (t.y / TS | 0) + 2, { level: 10 });   // Kampf: er hat die Urne nie losgelassen
  e.aggroId = p.id; e.aiState = 'pursue';
  log('Aus der Gruft steigt ihr Wächter. Er hat die Urne nie losgelassen.', 'combat'); UI.toast('WÄCHTER DER NEKROPOLE', 3000);
}
const deadWelcome = () => S.ranks.undead >= 0 || pactBound();
// Seelenbrunnen am Aschensee: einmal am Tag. Totenrufer füllen ihre Essenz, Hexer lassen die Verderbnis hinein, alle anderen hören nur.
function soulWell(t) {
  const p = S.player;
  if (S.flags.wellDay === S.day) return UI.toast('Der Brunnen schweigt. Morgen wieder.', 2600);
  act(p, 'kneel', 1400, t);
  if (p.titleClass === 'necromancer') { setTres(p, resMax(p)); fx(p.x, p.y - 14, 'necro', 16); log('Aus dem Brunnen steigen Namen. Deine Essenz ist voll.', 'world'); }
  else if (p.titleClass === 'warlock') { setTres(p, 0); fx(p.x, p.y - 14, 'shadow', 16); log('Der Brunnen trinkt deine Verderbnis. Kurz ist es still in dir.', 'world'); }
  else return log('Tief unten flüstern Namen. Keiner davon ist deiner.', 'world');
  S.flags.wellDay = S.day; UI.refreshHUD();
}
const PACT_GREET = ['„Deine Augen … was ist mit deinen Augen?“', '„Geh weiter. Du riechst nach Gruft.“', '„Man sagt, du hättest mit den Toten gehandelt. Stimmt das?“'];
const PACT_TOWN = {
  eren: '„Havel sagt, in der Grube war etwas Schlimmes. Jetzt sagen die Leute das über dich.“',
  northcity: '„Die Garnison hat ein Auge auf dich. Wer mit den Toten redet, redet auch mit ihrem Heer.“',
  saltport: '„Die Fischer werfen ein Netz über die Schulter, wenn du vorbeigehst. Gegen den bösen Blick.“',
  kreuzweg: '„Dein Gold nehmen wir. Deine Nähe nicht.“',
  ashford: '„Hinter der Palisade hören wir die Toten nachts. Jetzt stehst du davor.“',
};
function pactGreet(npc) { const t = PACT_TOWN[npc.homeTown || npc.post]; return t && (npc.seed | 0) % 2 ? t : PACT_GREET[(npc.seed | 0) % PACT_GREET.length]; }

// ================= Quests =================
function questAvailable(k) {
  if (k === 'q_paladin2') return S.quests.q_paladin1?.state === 'done';
  if (k === 'q_paladin3') return S.quests.q_paladin2?.state === 'done';
  if (k === 'q_paladin1') return (S.relations.kelan ?? 0) >= 10;
  if (k === 'q_undead') return (S.relations.morvath ?? 0) >= 5;
  if (k === 'q_pact') return S.quests.q_undead?.state === 'done' && !pactBound() && !titleFull();
  if (k === 'q_grove') return !(S.player.titleClasses || []).includes('druid') && !titleFull();
  if (k === 'q_monk') return !(S.player.titleClasses || []).includes('monk') && !titleFull() && !pactBound();
  if (k === 'q_rook') return (S.relations.rook ?? 0) >= 10;
  return true;
}
function startQuest(k) {                                   // was schon erledigt ist, zählt (Boss vorher erschlagen, Gegenstand dabei)
  S.quests[k] = { state:'active', progress: QUESTS[k].objectives.map(o =>
    o.type === 'item' ? S.player.inv.filter(x => x.key === o.target).reduce((n, x) => n + (x.count || 1), 0)
    : o.type === 'kill' && o.target === 'hrodvar' && S.flags.hrodvarSlain ? 1 : 0) };
}
function offerQuest(npc, k) {
  const Q = QUESTS[k];
  UI.dialogue(npc, Q.desc, [
    { text: 'Ich mache es.', fn: () => {
      startQuest(k);
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
  if (r.take) removeItem(S.player, r.take, 1);
  if (r.item) { addItem(S.player, r.item); log(`Erhalten: ${ITEMS[r.item].name}.`, 'economy'); }
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
      if (lila) { const [lx, ly] = worldPt(60, 68); lila.home = 'village'; lila.anchor = { x: lx * TS, y: ly * TS }; lila.x = lila.anchor.x; lila.y = lila.anchor.y; }
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
// Lehrer unterrichten eine Folge (z. B. Schütze → Waldläufer): angeboten wird die erste noch unbekannte Klasse, deren
// Vorgänger man kann. Ohne passende Vorstufe bietet der Lehrer den Einstieg der Folge an (die Vorstufe ist dann Pflicht).
function teachable(npc) {
  const list = [].concat(npc.teaches || []), p = S.player; if (!list.length) return null;
  return list.find(c => !p.knownClasses.includes(c) && (!CLASSES[c].parent || p.knownClasses.includes(CLASSES[c].parent) || CLASSES[c].parent === 'wanderer'))
    || list.find(c => !p.knownClasses.includes(c)) || list[list.length - 1];
}
const respecCost = () => 30 + 10 * (S.player.level || 1);
function respec(npc) {
  const p = S.player, n = Object.keys(p.tree || {}).length, cost = respecCost();
  UI.dialogue(npc, `„Alles, was du dir angewöhnt hast, legen wir ab. Das dauert und kostet. ${n} Talente, ${cost} Gold.“`, [
    { text: `Talente vergessen (${cost} Gold)`, fn: () => {
      if (S.gold < cost) { UI.closeDialogue(); return UI.toast('Zu wenig Gold'); }
      S.gold -= cost; p.skillPoints = (p.skillPoints || 0) + n; p.tree = {};
      const r = p.hp / (p.maxHp || 1); recalc(p); for (const k of B.PARTS) p.body[k].hp = Math.min(p.body[k].max, p.body[k].max * r); B.syncHp(p);
      syncHotbar(); log(`Talente vergessen: ${n} Punkte sind wieder frei.`, 'party'); UI.closeDialogue(); save();
    } },
    { text: 'Lieber nicht.', fn: () => UI.closeDialogue() },
  ]);
}
function teach(npc, cls = teachable(npc)) {
  const p = S.player, rel = S.relations[npc.key] ?? 0;
  const parent = CLASSES[cls].parent;
  if (parent && parent !== 'wanderer' && !p.knownClasses.includes(parent))
    return UI.dialogue(npc, `„Erst ${CLASSES[parent].name}. Dann reden wir über ${CLASSES[cls].name}.“`, [{ text: 'Verstanden.', fn: () => UI.closeDialogue() }]);
  const need = { paladin: 'q_paladin3' }[cls];             // Hexenmeister ist keine Lehrklasse mehr, sondern eine Titelklasse (Pakt)
  if (need && S.quests[need]?.state !== 'done') {
    return UI.dialogue(npc, '„Erst die Prüfungen. Wachsamkeit, das Siegel, der Schrein. Dann reden wir.“',
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
function price(key, isBuy, npc, inst = null) {
  if (ITEMS[key].good && npc && S.towns[npc.town || 'eren']) {
    const p = SIM.townPrice(npc.town || 'eren', key, isBuy), t = (S.player.skills.trading || 0) / 100;
    return Math.max(1, Math.round(isBuy ? p * (1 - t * 0.2) : p * (1 + t * 0.2)));
  }
  const v = ITEMS[key].value * (S.prices || 1) * (inst ? RARITY_VALUE[rarOf(inst)] || 1 : 1);
  const t = (S.player.skills.trading || 0) / 100;
  return Math.max(1, Math.round(isBuy ? v * (1.35 - t * 0.3) : v * (0.45 + t * 0.25)));
}
function shopStock(npc) {
  if (!npc._stockDay || npc._stockDay !== S.day) {
    npc._stockDay = S.day;
    const pool = npc.pool || NPCS.find(n => n.key === npc.key)?.pool || ['bread', 'dried_meat', 'herb', 'potion', 'bandage', 'rusty_sword', 'longsword', 'axe', 'spear', 'shortbow',
      'wooden_shield', 'leather_jerkin', 'leather_cap', 'chain_hauberk', 'pickaxe', 'traveler_cloak'];
    npc._stock = [];
    for (let i = 0; i < 7; i++) { const k = pick(pool); npc._stock.push({ key: k, count: ITEMS[k].stack ? ri(1, 4) : 1 }); }
  }
  const tk = S.towns[npc.town || 'eren'] ? npc.town || 'eren' : null;      // Orte ohne Markt (Vharnholm) handeln nur mit Waren
  if (!tk || npc.market === false) return npc._stock;          // Schmiede u. ä.: nur eigene Ware, kein Getreide
  const town = S.towns[tk];
  SIM.notePrices(tk);
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
  const c = price(slot.key, false, npc, slot);
  S.gold += c; if ((slot.count || 1) > 1) slot.count--; else S.player.inv.splice(idx, 1);   // genau dieses Exemplar
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

// ================= Titelklassen (Session 4) =================
// Grundklasse (currentClass, Klassenbaum) + höchstens eine getragene Titelklasse (titleClass). Die Titelklasse hat eine eigene
// Ressource (tres, je Ressource gespeichert — ablegen und wieder tragen verliert nichts) und eigene Fähigkeiten.
const TC = c => c && c.titleClass ? TITLE_CLASSES[c.titleClass] : null;
function tres(c) { const T = TC(c); if (!T) return 0; c.tres ||= {}; return c.tres[T.resource.key] ??= T.resource.start; }
function resMax(c) { const T = TC(c); return T ? T.resource.max + (T.resource.key === 'essence' && node(c, 'n_vessel') ? 2 : 0) + (T.resource.key === 'focus' && node(c, 'o_well') ? 2 : 0) : 0; }
function setTres(c, v) { const T = TC(c); if (T) (c.tres ||= {})[T.resource.key] = clamp(v, 0, resMax(c)); }
const spellMul = c => 1 + tfx(c, 'spell');
const cdMul = c => 1 - Math.min(0.4, tfx(c, 'cdr'));
const titleAbilities = c => TC(c)?.abilities || [];
const treeAbilities = c => Object.keys(c.tree || {}).map(k => SKILL_TREE[k]?.grants).filter(Boolean);   // aktive Talentknoten
const titleFull = (c = S.player) => (c?.titleClasses || []).length >= MAX_TITLES;
const pactBound = (c = S.player) => (c?.titleClasses || []).some(k => TITLE_CLASSES[k].faction === 'undead');
function unlockTitle(key, where) {
  const p = S.player, T = TITLE_CLASSES[key];
  p.titleClasses ||= [];
  if (p.titleClasses.includes(key) || T.excludes.some(k => p.titleClasses.includes(k))) return false;
  if (p.titleClasses.length >= MAX_TITLES) { UI.toast(`Mehr als ${MAX_TITLES} Titelklassen trägt kein Mensch.`); return false; }
  p.titleClasses.push(key);
  for (const [a, v] of Object.entries(T.cost.attr || {})) p.attributes[a] = Math.max(1, p.attributes[a] + v);
  if (T.cost.gold) { const g = Math.floor(S.gold * T.cost.gold); S.gold -= g; if (g) log(`${g} Gold gehen an das Kloster.`, 'economy'); }
  p.pactCost = { ...(p.pactCost || {}), ...(T.cost.hpMul ? { hpMul: T.cost.hpMul } : {}), ...(T.cost.stamina ? { stamina: T.cost.stamina } : {}) };
  for (const [f, v] of Object.entries(T.rep)) S.factions[f] = (S.factions[f] || 0) + v;
  if (T.faction === 'undead' || !p.pal.glow) p.pal = { ...p.pal, glow: T.glow };   // sichtbares Merkmal (ein Pakt der Toten überdeckt das Grün des Hains)
  p.titles ||= []; if (!p.titles.includes(T.title)) p.titles.push(T.title);
  chronicle(`${p.name} wird ${T.name}`, 'class', `${where}. ${T.cost.desc}`);
  UI.toast(`TITELKLASSE: ${T.name.toUpperCase()}`, 4600);
  log(T.cost.desc, 'party');
  setTitleClass(key, true);
  return true;
}
function setTitleClass(key, force) {
  const p = S.player;
  if (key && !(p.titleClasses || []).includes(key)) return;
  if (!force && p.titleClass && key !== p.titleClass && combat.some(e => e.alive && isHostile(p, e) && dist(p, e) < 300)) return UI.toast('Mitten im Kampf wechselt niemand seinen Titel.');
  p.titleClass = key || null;
  recalc(p); syncHotbar(); UI.refreshHUD();
  log(key ? `Du trägst den Titel „${TITLE_CLASSES[key].title}“ (${TITLE_CLASSES[key].name}).` : 'Du legst den Titel ab. Der Pakt bleibt.', 'party');
}
function corrupt(p, n) {                                     // Hexenmeister: Verderbnis steigt; bei 100 bricht sie aus
  const v = tres(p) + n;
  if (v >= 100) { setTres(p, 60); hurt(p, 15, null, 'Verderbnis'); fx(p.x, p.y - 14, 'shadow', 16); UI.toast('Die Verderbnis bricht aus!', 2400); }
  else setTres(p, v);
}
function titleTick(c, dt) {
  if (c.titleClass === 'druid') {                          // Wildkraft wächst nur draußen; Waldgänger heilt; Metall erstickt
    if (inNature(c) && c.alive && !c.downed) {
      const metal = ['chain_hauberk', 'plate_cuirass'].includes(c.equip.chest?.key) ? 0.5 : 1;
      setTres(c, tres(c) + dt / 1000 * 5 * metal * (node(c, 'd_spring') ? 1.3 : 1));
      c.grow = (c.grow || 0) + dt / 1000 * 0.5; if (c.grow >= 1) { B.heal(c, Math.floor(c.grow)); c.grow %= 1; }
    }
    return;
  }
  if (c.titleClass !== 'warlock') return;
  const now = performance.now(), fighting = now - (c.lastCast || -1e9) < 4000 || combat.some(e => e.alive && isHostile(c, e) && dist(c, e) < 300);
  let v = tres(c);
  if (!fighting && !node(c, 'k_bloodpact')) v -= dt / 1000 * 4;   // Blutpakt: kein Durchatmen
  if (v > (node(c, 'w_deep') ? 85 : 70) && c.alive && !c.downed) {   // Makel: sie frisst dich
    c.rot = (c.rot || 0) + dt / 1000 * 1.5;
    if (c.rot >= 1) { const n = Math.floor(c.rot); c.rot -= n; hurt(c, n, null, 'Verderbnis'); }
  }
  setTres(c, v);
}
// Ausweichen im letzten Moment (Hieb, Geschoss oder Flächenangriff hätte getroffen): einmal je Rolle. Zählt für die Probe
// der Stillen Hand und gibt dem Mönch Fokus — nicht in Metall, mit „Vollkommener Stille“ nicht mit Schild oder Zweihänder.
function evaded(t) {
  if (t !== S.player || !t.dodge || t.dodge.dash || t.dodge.evaded) return;
  t.dodge.evaded = true; float(t, 'Ausgewichen', 'rgba(230,207,138,ALPHA)');
  const st = S.quests.q_monk;
  if (st?.state === 'active' && (st.progress[0] || 0) < QUESTS.q_monk.objectives[0].count) { st.progress[0] = (st.progress[0] || 0) + 1; log(`${QUESTS.q_monk.name}: ${st.progress[0]}/${QUESTS.q_monk.objectives[0].count}`, 'quest'); }
  if (t.titleClass !== 'monk') return;
  const metal = ['chain_hauberk', 'plate_cuirass'].includes(t.equip.chest?.key);
  const impure = node(t, 'k_stillness') && (ITEMS[t.equip.offhand?.key]?.block || ITEMS[t.equip.weapon?.key]?.twohand);
  if (metal || impure) return;
  setTres(t, tres(t) + 1); fx(t.x, t.y - 16, 'frost', 4); UI.refreshHUD();
}
function titleOnDeath(c) {
  const p = S.player;
  if (!p || !p.alive || c === p || c.map !== p.map || c.kind === 'caravan') return;
  if (p.titleClass === 'necromancer' && !c.servant && dist(p, c) < 280 && tres(p) < resMax(p)) {
    setTres(p, tres(p) + 1); fx(c.x, c.y - 16, 'necro', 6); float(p, '+1 Essenz', 'rgba(143,217,176,ALPHA)');
  }
  if (p.titleClass === 'warlock' && c.hexed > performance.now()) setTres(p, tres(p) - 15);
}
function crumble(e) {                                        // Diener zerfällt: Knochen, kein Leichnam, keine Beute
  fx(e.x, e.y - 12, 'bone', 8); e.alive = false;
  const a = S.ents[e.map], i = a.indexOf(e); if (i >= 0) a.splice(i, 1);
}
function titleAbility(p, key, ab) {                          // true = gewirkt; false = abgebrochen (keine Kosten, keine Abklingzeit)
  const T = TITLE_CLASSES[ab.title], foes = hostilesOf(p).sort((a, b) => dist(p, a) - dist(p, b)), v = tres(p);
  const pact = spellMul(p) * (node(p, 'k_bloodpact') ? 1.25 : 1);   // Titelzauber-Schaden: Magie-Zweig und Blutpakt
  switch (key) {
    case 'raise_dead': {
      const cap = node(p, 'k_legion') ? 3 : 2;
      if (S.ents[p.map].filter(e => e.servant === p.id && e.alive).length >= cap) { UI.toast(`Mehr als ${cap === 3 ? 'drei' : 'zwei'} Diener hält der Pakt nicht.`); return false; }
      const body = S.ents[p.map].filter(e => e.kind === 'corpse' && !e.raised && dist(p, e) < 220).sort((a, b) => dist(p, a) - dist(p, b))[0];
      if (!body) { UI.toast('Keine Leiche in der Nähe.'); return false; }
      S.ents[p.map].splice(S.ents[p.map].indexOf(body), 1);
      const d = spawnEnemy('skeleton', p.map, body.x / TS | 0, body.y / TS | 0, { level: Math.max(2, p.level) });
      Object.assign(d, { name: 'Gerufener Toter', x: body.x, y: body.y, anchor: { x: body.x, y: body.y }, servant: p.id, transient: true,
        until: performance.now() + 60000 + (node(p, 'n_bind') ? 20000 : 0), glow: T.glow });
      if (node(p, 'n_cold')) { d.maxHp = d.hp = Math.round(d.maxHp * 1.25); if (d.body) B.rescale(d, d.maxHp); }
      fx(body.x, body.y - 10, 'necro', 16); fx(body.x, body.y, 'bone', 8); sfx('bone', 0.6);
      log('Die Leiche steht auf. Sie dient dir — eine Minute lang.', 'combat');
      return true; }
    case 'bone_ward':
      (p.status ||= []).push({ key: 'bone_ward', name: 'Knochenschild', good: true, left: 10000, absorb: 25, desc: 'Fängt die nächsten 25 Schaden ab.' });
      fx(p.x, p.y - 14, 'bone', 10); return true;
    case 'soul_harvest': {
      const own = [p, ...S.ents[p.map].filter(e => e.servant === p.id && e.alive)], k = node(p, 'n_reap') ? 1.5 : 1;
      for (const a of own) { if (a.body) B.heal(a, 12 * v * k); else a.hp = Math.min(a.maxHp, a.hp + 12 * v * k); fx(a.x, a.y - 14, 'necro', 8); }
      for (const f of foes) if (dist(p, f) < 150) { hurt(f, 6 * v * k * spellMul(p), p, 'Seelenernte'); fx(f.x, f.y - 12, 'necro', 8); }
      float(p, '+' + Math.round(12 * v * k), 'rgba(143,217,176,ALPHA)'); return true; }
    case 'roots': {
      const f = foes.find(x => dist(p, x) < 220);
      if (!f) { UI.toast('Kein Ziel für die Ranken.'); return false; }
      f.rooted = performance.now() + 3000 + (node(p, 'd_roots') ? 1000 : 0); f.vx = f.vy = 0;
      fx(f.x, f.y - 4, 'heal', 12); S.fx.push({ x: f.x, y: f.y, vx: 0, vy: 0, type: 'ring', s: 1.5, life: 600, maxLife: 600 });
      return true; }
    case 'spirit_wolf': {
      if (S.ents[p.map].some(e => e.servant === p.id && e.mtype === 'wolf' && e.alive)) { UI.toast('Der Geisterwolf ist schon bei dir.'); return false; }
      const d = spawnEnemy('wolf', p.map, p.x / TS | 0, (p.y / TS | 0) + 1, { level: Math.max(2, p.level) });
      Object.assign(d, { name: 'Geisterwolf', servant: p.id, transient: true, until: performance.now() + 30000 + (node(p, 'd_pack') ? 15000 : 0), spirit: true });
      fx(d.x, d.y - 10, 'heal', 14); log('Aus dem Nebel tritt ein Wolf und stellt sich neben dich.', 'combat');
      return true; }
    case 'earth_blessing':
      for (const a of [p, ...partyMembers()]) { (a.status ||= []).push({ key: 'regrowth', name: 'Erdsegen', good: true, left: 8000, heal: 3 * (node(p, 'd_earth') ? 1.5 : 1), desc: 'Heilt 8 s lang.' }); fx(a.x, a.y - 8, 'heal', 12); }
      return true;
    case 'palm_strike': {
      const f = foes.find(x => dist(p, x) < 64 + (x.r || 10));
      if (!f) { UI.toast('Zu weit für die Handkante.'); return false; }
      p.aim = Math.atan2(f.y - p.y, f.x - p.x); hit(p, f, 1.4 * (node(p, 'o_edge') ? 1.2 : 1));
      f.stagger = Math.max(f.stagger || 0, 700 + (node(p, 'o_edge') ? 500 : 0)); f.swing = 0; f.telegraph = 0; f.windup = false;
      act(p, 'strike', 240, f); camShake(3, 90); return true; }
    case 'still_water':
      p.status = (p.status || []).filter(q => q.key !== 'bleeding');
      p.status.push({ key: 'regrowth', name: 'Stilles Wasser', good: true, left: 6000, heal: 4 * (node(p, 'o_breath') ? 1.5 : 1), desc: 'Heilt 6 s lang.' });
      S.fx.push({ x: p.x, y: p.y - 6, vx: 0, vy: 0, type: 'ring', s: 1.5, life: 700, maxLife: 700 }); fx(p.x, p.y - 12, 'heal', 10); return true;
    case 'hundred_steps': {
      if (p.dodge || p.downed) return false;
      const far = node(p, 'o_steps');
      p.cover = null;
      p.dodge = { t: 0, ax: Math.cos(p.aim), ay: Math.sin(p.aim), dist: 180 + (far ? 60 : 0), dur: 320,
        dash: { hit: [], mult: (0.5 + 0.25 * v) * (far ? 1.25 : 1) } };
      p.invuln = true; p.swing = 0; fx(p.x, p.y + 4, 'dust', 8); sfx('dodge'); return true; }
    case 'hex': {
      const f = foes.find(x => dist(p, x) < 260);
      if (!f) { UI.toast('Kein Ziel für den Fluch.'); return false; }
      f.hexed = performance.now() + 12000 + (node(p, 'w_eye') ? 6000 : 0);
      S.fx.push({ x: f.x, y: f.y - 20, vx: 0, vy: 0, type: 'ring', s: 2, life: 700, maxLife: 700 }); fx(f.x, f.y - 14, 'shadow', 10);
      return true; }
    case 'chaos_bolt':
      S.projectiles.push({ id: uid(), kind: 'shadow', map: p.map, x: p.x + Math.cos(p.aim) * 14, y: p.y - 12 + Math.sin(p.aim) * 8,
        vx: Math.cos(p.aim) * 6, vy: Math.sin(p.aim) * 6, owner: p.id, dmg: (18 + p.attributes.intelligence * 1.4) * (1 + v / 100) * pact * (node(p, 'w_core') ? 1.2 : 1), life: 1500, team: 'player', splash: 0 });
      return true;
    case 'unleash':
      for (const f of foes) if (dist(p, f) < 110 + (node(p, 'w_rift') ? 40 : 0)) hurt(f, v * 0.6 * pact, p, 'Entfesseln');
      for (let i = 0; i < 3; i++) S.fx.push({ x: p.x, y: p.y - 8, vx: 0, vy: 0, type: 'ring', s: 3 + i * 2, life: 500 + i * 120, maxLife: 500 + i * 120 });
      fx(p.x, p.y - 12, 'shadow', 24); camShake(6, 200); return true;
  }
  return false;
}

// ================= Skill-Baum =================
// Zustand je Knoten: 'learned', 'open' (lernbar), 'locked' (Voraussetzung fehlt), 'sealed' (Zweig einer nicht erworbenen Titelklasse).
function branchOpen(c, b) { const B_ = SKILL_BRANCHES[b]; return !B_.title || (c.titleClasses || []).includes(B_.title); }
function nodeState(c, k) {
  const N = SKILL_TREE[k]; if (!N) return 'locked';
  if (node(c, k)) return 'learned';
  if (!branchOpen(c, N.branch)) return 'sealed';
  return !N.requires.length || N.requires.some(r => node(c, r)) ? 'open' : 'locked';
}
function learnNode(k) {
  const p = S.player, N = SKILL_TREE[k], st = nodeState(p, k);
  if (st !== 'open') return UI.toast(st === 'learned' ? 'Schon gelernt.' : st === 'sealed' ? 'Dieser Zweig gehört einer Titelklasse, die du nicht hast.' : 'Erst einen Knoten davor lernen.');
  if ((p.skillPoints || 0) < 1) return UI.toast('Kein Talentpunkt frei. Einer kommt mit jeder Stufe.');
  (p.tree ||= {})[k] = 1; p.skillPoints--;
  const r = p.hp / (p.maxHp || 1); recalc(p); if (N.fx.hp) { for (const part of B.PARTS) p.body[part].hp = Math.min(p.body[part].max, p.body[part].max * r); B.syncHp(p); }
  if (N.grants) { syncHotbar(); log(`Neue Fähigkeit: ${ABILITIES[N.grants].name} (Leiste).`, 'party'); }   // aktiver Knoten
  log(`Talent gelernt: ${N.name}${N.type === 'keystone' ? ' (Schlüsselknoten)' : ''}.`, 'party');
  UI.refreshHUD(); save();
}

// ================= Fähigkeiten =================
function useAbility(key) {
  const p = S.player, ab = ABILITIES[key];
  if (!ab || !(p.abilities.includes(key) || titleAbilities(p).includes(key) || treeAbilities(p).includes(key))) return;
  if ((p.cooldowns[key] || 0) > 0) return UI.toast(`${ab.name} noch nicht bereit`);
  if (ab.title) {                                            // Titelfähigkeit: nur die eigene Ressource zählt
    const R = TITLE_CLASSES[ab.title].resource, v = tres(p);
    if (ab.cost === 'all' ? v < (ab.min || 1) : ab.cost && v < ab.cost) return UI.toast(`Zu wenig ${R.name}${ab.min ? ` (mindestens ${ab.min})` : ''}`);
    if (!titleAbility(p, key, ab)) return;
    p.cooldowns[key] = ab.cd * cdMul(p); p.castT = p.lastCast = performance.now(); sfx('magic');
    if (ab.cost === 'all') setTres(p, 0); else if (ab.cost) setTres(p, v - ab.cost);
    if (ab.gain) corrupt(p, ab.gain);
    return UI.refreshHUD();
  }
  if (ab.mana && p.mana < ab.mana) return UI.toast(p.maxMana ? 'Zu wenig Mana' : 'Das braucht Mana — nur Zauberkundige haben welches.');
  if (ab.stam && p.stamina < ab.stam) return UI.toast('Zu erschöpft');
  if (ab.herb && !hasItem(p, 'herb', ab.herb)) return UI.toast(`Zu wenig Heilkraut (${ab.herb} nötig)`);   // Alchemist: Kraut ist die Ressource
  if (key === 'shadowstep' && ['chain_hauberk', 'plate_cuirass'].includes(p.equip.chest?.key)) return UI.toast('In Eisen wirft niemand einen Schatten.');
  if (!classAbility(p, key)) return;                                  // neue Klassen/Talente (Session 7); false = kein Ziel, nichts verbraucht
  p.cooldowns[key] = ab.cd * cdMul(p);
  if (ab.herb) removeItem(p, 'herb', ab.herb);
  if (ab.mana) p.mana -= ab.mana;
  if (ab.stam) p.stamina -= ab.stam;
  if (ab.mana) { p.castT = performance.now(); sfx('magic'); }   // Zauber-Pose (render: 'cast')
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
        dmg: (14 + p.attributes.intelligence * 1.3) * spellMul(p), life: 1600, team:'player', splash: key === 'fireball' ? 46 : 0 });
      break; }
    case 'life_drain': {
      const f = foes[0];
      if (!f || dist(p, f) > 180) { UI.toast('Kein Ziel in Reichweite'); p.cooldowns[key] = 0; return; }
      const d = (12 + p.attributes.intelligence * 1.1) * spellMul(p);
      hurt(f, d, p, 'Lebensentzug');
      B.heal(p, d * 0.6);
      fx(f.x, f.y - 12, 'necro', 12); fx(p.x, p.y - 14, 'necro', 6);
      float(p, '+' + Math.round(d * 0.6), 'rgba(78,143,122,ALPHA)');
      break; }
    case 'holy_heal': {
      const t = [p, ...partyMembers()].filter(a => a.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      const amt = (26 + p.attributes.intelligence * 1.6) * (t.titleClass === 'necromancer' ? 0.5 : 1);   // Makel des Nekromanten
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
  const HB = 10;                                             // Tasten 1–9, 0: Klasse (≤3) + Titel (3) + aktive Talente (≤3) passen immer
  p.hotbar = [...new Set([...p.abilities, ...titleAbilities(p), ...treeAbilities(p)])].slice(0, HB - 1).map(k => ({ type:'ability', key: k }));
  for (const k of ['bandage', 'potion', 'herb', 'bread']) if (p.hotbar.length < HB) p.hotbar.push({ type:'item', key: k });
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
  const loc = DUNGEONS[S.map] ? DUNGEONS[S.map].name : (locAt(p.x / TS | 0, p.y / TS | 0)?.name || 'Greenmark-Grenzland');
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
  // Familie ist Glückssache: ob es Kinder, Eltern oder Geschwister gibt, hängt vom Alter des Toten und vom Zufall ab.
  // Mit jeder Generation dünnt das Haus aus; bleibt niemand, erlischt es.
  const age = S.player.age || 25, luck = Math.max(0.35, 1 - (S.legacy.gen - 1) * 0.12), kin = [];
  if (age >= 34 && chance(0.45 * luck)) kin.push(['Sohn', ri(16, Math.min(age - 18, 32))]);
  if (age >= 34 && chance(0.45 * luck)) kin.push(['Tochter', ri(16, Math.min(age - 18, 32))]);
  if (age <= 44 && chance(0.3 * luck)) kin.push(['Vater', age + ri(20, 28)]);
  if (age <= 44 && chance(0.3 * luck)) kin.push(['Mutter', age + ri(19, 26)]);
  if (chance(0.35 * luck)) kin.push([pick(['Bruder', 'Schwester']), Math.max(16, age + ri(-6, 6))]);
  if (chance(0.2 * luck)) kin.push([pick(['Vetter', 'Base']), Math.max(16, age + ri(-8, 8))]);
  for (const [rel, kage] of kin) {
    if (out.length >= 3) break;
    const female = ['Tochter', 'Mutter', 'Schwester', 'Base'].includes(rel);
    const names = female ? ['Sigrun', 'Halla', 'Brenna', 'Rana', 'Ilse', 'Wenna'] : ['Tomas', 'Elric', 'Ivar', 'Kord', 'Hamo', 'Jorg'];
    const c = makeChar({ name: `${pick(names)} ${S.legacy.gen > 1 ? 'II' : ''}`.trim(), age: kage,
      x: S.player.x, y: S.player.y, level: Math.max(1, Math.floor(S.player.level * 0.4)),
      attrs: { strength: ri(7, 13), agility: ri(7, 13), endurance: ri(7, 12), intelligence: ri(6, 12), perception: ri(7, 12), willpower: ri(6, 12) },
      skills: { onehanded: ri(2, 10), archery: ri(2, 10), survival: ri(3, 9) },
      traits: [pick(['mutig', 'ehrgeizig', 'loyal', 'misstrauisch', 'gütig'])],
      cls: pick(['wanderer', 'warrior', 'archer']), pal: { ...S.player.pal, cloth: pick(CLOTH) } });
    c.relation = rel + ' von ' + S.player.name;
    kinKit(c);
    out.push(c);
  }
  return out.slice(0, 3);
}
// Verwandte kommen mit eigener, bescheidener Habe (die Ausrüstung des Toten liegt am Grab)
function kinKit(c) {
  c.equip.weapon = mkItem(({ archer: 'shortbow', warrior: 'rusty_sword' })[c.currentClass] || 'dagger');
  c.equip.chest = mkItem(chance(0.3) ? 'leather_jerkin' : 'cloth_shirt');
  addItem(c, 'bread', 2); addItem(c, 'bandage', 1);
}
function chooseSuccessor() {
  const cands = makeSuccessorCandidates();
  if (!cands.length) {                                        // niemand mehr da: das Haus erlischt
    chronicle(`Haus ${S.legacy.house} ist erloschen`, 'legacy', `Nach ${S.legacy.gen} Generation(en) blieb niemand, der den Namen trägt.`);
    log(`Haus ${S.legacy.house} ist erloschen. Niemand trägt den Namen weiter.`, 'death');
    UI.toast(`HAUS ${S.legacy.house.toUpperCase()} IST ERLOSCHEN`, 6000);
    running = false; wipeSave();
    setTimeout(() => location.reload(), 6000);
    return;
  }
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
  // Neubeginn fern vom Tod: der Erbe trifft im Heimatdorf ein (nicht am Grab neben dem Mörder), die Gruppe mit ihm.
  const home = freeSpotNear('world', ...worldPt(60, 66), 4), group = [c, ...partyMembers().filter(m => m !== c)];
  for (const m of group) { for (const k of MAP_KEYS) { const a = S.ents[k], i = a.indexOf(m); if (i >= 0) a.splice(i, 1); }
    m.map = 'world'; m.x = home.x + (m === c ? 0 : ri(-30, 30)); m.y = home.y + (m === c ? 0 : ri(-30, 30)); S.ents.world.push(m); }
  S.map = 'world';
  c.invuln = true; setTimeout(() => { if (S.player === c && !c.dodge) c.invuln = false; }, 3000);   // kurze Schonfrist
  S.player = c;
  syncHotbar();
  chronicle(`${c.name} übernimmt Haus ${S.legacy.house}`, 'legacy',
    `Generation ${S.legacy.gen}. ${old.name} liegt in ${old.map === 'mine' ? 'der Grube' : old.map === 'deep' ? 'der Tiefhall' : 'der Erde von Greenmark'}.`);
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
  const step = m.w > 300 ? 2 : 1;                            // große Welt: herunterrechnen, damit die Karte flüssig bleibt
  for (let y = 0; y < m.h; y += step) for (let x = 0; x < m.w; x += step) {
    c.fillStyle = col[m.tiles[y * m.w + x]] || '#313b25';
    c.fillRect(ox + x * sc, oy + y * sc, Math.ceil(sc * step), Math.ceil(sc * step));
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
    if (['input', 'textarea', 'select'].includes(document.activeElement.tagName.toLowerCase())) return;
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
    if (k === 't') UI.openModal('skills');
    if (k === 'q') dodge();
    if (k >= '1' && k <= '9') useSlot(+k - 1);
    if (k === '0') useSlot(9);
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
    R.cam.base = clamp((R.cam.base || R.cam.zoom) * (e.deltaY > 0 ? 0.9 : 1.1), 0.7, 2.4);
  }, { passive: false });
  window.addEventListener('beforeunload', () => { if (running) save(); });
  bindTouch();
}
// Touch: Zielen ohne Maus — nächster Feind in Reichweite, sonst in Lauf-/Blickrichtung
function touchAim(p) {
  const f = hostilesOf(p).filter(e => !e.downed && dist(e, p) < 220).sort((a, b) => dist(a, p) - dist(b, p))[0];
  if (touch.dx || touch.dy) { const l = Math.hypot(touch.dx, touch.dy); touch.lx = touch.dx / l; touch.ly = touch.dy / l; }
  if (f) { mouse.wx = f.x; mouse.wy = f.y - 12; } else { mouse.wx = p.x + touch.lx * 80; mouse.wy = p.y - 12 + touch.ly * 80; }
}
function bindTouch() {
  const body = document.body, on = () => { touch.on = true; body.classList.add('touch'); };
  if (matchMedia('(pointer: coarse)').matches) on();
  window.addEventListener('touchstart', on, { passive: true, once: true });
  const stick = $('t-stick'), knob = $('t-knob'); let sid = null;
  const cap = (el, id) => { try { el.setPointerCapture(id); } catch (err) { /* ohne Capture geht es auch */ } };
  const setStick = e => {
    const r = stick.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R0 = r.width / 2;
    let x = e.clientX - cx, y = e.clientY - cy; const l = Math.hypot(x, y);
    if (l > R0) { x *= R0 / l; y *= R0 / l; }
    knob.style.transform = `translate(${x}px,${y}px)`;
    const dead = R0 * 0.22;                                 // kleine Totzone gegen Zittern
    touch.dx = l < dead ? 0 : x / R0; touch.dy = l < dead ? 0 : y / R0;
  };
  const endStick = () => { sid = null; touch.dx = touch.dy = 0; knob.style.transform = ''; };
  stick.addEventListener('pointerdown', e => { e.preventDefault(); on(); sid = e.pointerId; cap(stick, e.pointerId); setStick(e); });
  stick.addEventListener('pointermove', e => { if (e.pointerId === sid) setStick(e); });
  stick.addEventListener('pointerup', endStick); stick.addEventListener('pointercancel', endStick);
  const hold = (id, down, up) => {
    const b = $(id);
    b.addEventListener('pointerdown', e => { e.preventDefault(); on(); b.classList.add('down'); cap(b, e.pointerId); down(); });
    const rel = () => { b.classList.remove('down'); up && up(); };
    b.addEventListener('pointerup', rel); b.addEventListener('pointercancel', rel);
  };
  const ready = () => !UI.dialogueOpen() && !UI.modalOpen && !$('game').classList.contains('hidden');
  hold('t-attack', () => { if (ready()) touch.attack = true; }, () => { touch.attack = false; });
  hold('t-dodge', () => { if (ready()) dodge(); });
  hold('t-guard', () => { if (ready()) touch.guard = true; }, () => { touch.guard = false; });
  hold('t-use', () => { if (ready()) doInteract(); });
}
function moveInput() {
  let dx = 0, dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy--;
  if (keys.has('s') || keys.has('arrowdown')) dy++;
  if (keys.has('a') || keys.has('arrowleft')) dx--;
  if (keys.has('d') || keys.has('arrowright')) dx++;
  if (!dx && !dy && (touch.dx || touch.dy)) return { dx: touch.dx, dy: touch.dy };   // Stick (analog, Richtung zählt)
  return { dx, dy };
}
// Deckung (Umschalt halten, Touch „Deckung“): kleine Schritte, keine Ausdauer-Erholung, kein Angriff. Hiebe von vorn
// (±70°): in den ersten 180 ms Parade — der Angreifer taumelt (Bosse kürzer), kein Schaden. Danach Block: mit Schild 15 %
// Schaden, mit der Waffe 45 %, dafür Ausdauer; reicht sie nicht, bricht die Deckung (Taumeln, 0,9 s keine Deckung).
// Flächenangriffe und Geschosse lassen sich blocken, aber nicht parieren.
const GUARD = { parry: 180, arc: 1.22, shield: 0.15, weapon: 0.45 };
function updateGuard(p, want) {
  const now = performance.now(), can = want && !p.dodge && !p.downed && !(p.swing > 0) && !(p.guardBroken > now) && p.stamina > 1;
  if (can && !p.cover) { p.cover = { since: now }; sfx('metal', 0.15); }
  else if (!can && p.cover) p.cover = null;
}
function guarded(attacker, target, dmg) {
  const now = performance.now(), g = target.cover;
  const facing = Math.abs(normAng(Math.atan2(attacker.y - target.y, attacker.x - target.x) - (target.aim || 0))) < GUARD.arc;
  if (!facing || target.downed) return false;
  const melee = attacker.swing > 0 && dist(attacker, target) < 120;
  if (melee && now - g.since < GUARD.parry) {                       // Parade: Klinge an Klinge, der Angreifer ist offen
    const boss = attacker.boss || MONSTERS[attacker.mtype]?.boss;
    Object.assign(attacker, { swing: 0, hitDone: true, telegraph: 0, windup: false, special: null });
    attacker.stagger = Math.max(attacker.stagger || 0, boss ? 450 : 900); attacker.atkCd = Math.max(attacker.atkCd || 0, 700);
    fx(target.x + Math.cos(target.aim) * 14, target.y - 14 + Math.sin(target.aim) * 8, 'spark', 14); float(target, 'Parade!', 'rgba(240,220,150,ALPHA)');
    sfx('metal', 1, 1); hitStop = Math.max(hitStop, 120); camShake(4, 120); target.stamina = Math.max(0, target.stamina - 3);
    g.since = -1e9;                                                  // eine Parade je Deckung, danach nur noch Block
    target.riposteUntil = now + 1200;                                // Rapier: der nächste Stich ist eine Riposte
    return true;
  }
  const shield = ITEMS[target.equip?.offhand?.key]?.block, cost = dmg * (shield ? 0.8 : 1.2);
  if (target.stamina < cost) {                                       // Deckung bricht
    target.cover = null; target.guardBroken = now + 900; target.stagger = Math.max(target.stagger || 0, 500); target.stamina = 0;
    float(target, 'Deckung gebrochen', 'rgba(210,90,70,ALPHA)'); sfx('metal', 0.8, 1); camShake(5, 160);
    return 'broken';                                                  // der Hieb trifft voll (auch kein Zufallsblock des Schilds)
  }
  target.stamina -= cost;
  hurt(target, dmg * (shield ? GUARD.shield : GUARD.weapon), attacker, attacker.name || MONSTERS[attacker.mtype]?.name);
  fx(target.x + Math.cos(target.aim) * 12, target.y - 12 + Math.sin(target.aim) * 7, 'spark', 6); float(target, 'Block', 'rgba(200,196,170,ALPHA)');
  if (target.equip?.offhand && shield) target.equip.offhand.cond = Math.max(0.05, (target.equip.offhand.cond ?? 1) - 0.004);
  sfx('metal', 0.5, 1); hitStop = Math.max(hitStop, 50);
  return true;
}
const stat = (c, k) => !!(c.status && c.status.some(s => s.key === k));
function addStatus(c, o) { c.status = (c.status || []).filter(s => s.key !== o.key); c.status.push(o); }
// Fähigkeiten der Klassen aus Session 7 und der aktiven Talentknoten. true = gewirkt; false = abgebrochen (keine Kosten).
function classAbility(p, key) {
  const foes = hostilesOf(p).sort((a, b) => dist(p, a) - dist(p, b)), now = performance.now();
  switch (key) {
    case 'frenzy': addStatus(p, { key: 'frenzy', name: 'Raserei', good: true, left: 8000, desc: 'Schaden +35 %, Tempo +15 %, eingesteckter Schaden +20 %.' });
      fx(p.x, p.y - 14, 'blood', 10); camShake(4, 160); sfx('death', 0.4); return true;
    case 'shadowstep': {
      const f = foes.find(x => dist(p, x) < 220); if (!f) { UI.toast('Kein Ziel im Schatten.'); return false; }
      const a = Math.atan2(f.y - p.y, f.x - p.x), bx = f.x + Math.cos(a) * 26, by = f.y + Math.sin(a) * 26;
      if (solidTile(p.map, bx, by) || solidPropAt(p.map, bx, by, 8)) { UI.toast('Dahinter ist kein Platz.'); return false; }
      fx(p.x, p.y - 12, 'shadow', 10); p.x = bx; p.y = by; p.aim = a + Math.PI; p.shadowNext = now + 2500; fx(p.x, p.y - 12, 'shadow', 10); sfx('dodge'); return true; }
    case 'war_song':
      for (const a of [p, ...partyMembers()]) { addStatus(a, { key: 'song', name: 'Kriegslied', good: true, left: 12000, desc: 'Schaden +15 %, Ausdauer schneller.' }); S.fx.push({ x: a.x, y: a.y - 10, vx: 0, vy: 0, type: 'ring', s: 1.5, life: 600, maxLife: 600 }); }
      log(`${p.name} stimmt ein Lied an. Die Gruppe fasst Mut.`, 'party'); sfx('magic', 0.4); return true;
    case 'discord': {
      const near = foes.filter(f => dist(p, f) < 140); if (!near.length) { UI.toast('Niemand, der zuhört.'); return false; }
      for (const f of near) { f.confused = now + 3000; f.stagger = Math.max(f.stagger || 0, 400); fx(f.x, f.y - 20, 'spark', 5); }
      S.fx.push({ x: p.x, y: p.y - 8, vx: 0, vy: 0, type: 'ring', s: 3, life: 500, maxLife: 500 }); return true; }
    case 'fire_flask': {
      const tx = mouse.wx ?? p.x + Math.cos(p.aim) * 150, ty = mouse.wy ?? p.y, a = Math.atan2(ty - p.y, tx - p.x), d = Math.min(260, Math.hypot(tx - p.x, ty - p.y));
      S.projectiles.push({ id: uid(), kind: 'fire', map: p.map, x: p.x + Math.cos(a) * 14, y: p.y - 12 + Math.sin(a) * 8, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5,
        owner: p.id, dmg: 18 + p.attributes.intelligence * 0.8, life: Math.max(200, d / 5 * 16), team: 'player', splash: 60, burst: true });
      return true; }
    case 'poison_coat': addStatus(p, { key: 'poison_coat', name: 'Giftöl', good: true, left: 20000, desc: 'Treffer vergiften.' }); fx(p.x + 10, p.y - 10, 'necro', 6); return true;
    case 'brew': if (!addItem(p, 'potion')) return false; log('Aus drei Handvoll Kraut wird ein Heiltrank.', 'party'); fx(p.x, p.y - 12, 'heal', 8); return true;
    case 'war_cry': {
      const near = foes.filter(f => dist(p, f) < 120); if (!near.length) { UI.toast('Niemand zum Anschreien.'); return false; }
      for (const f of near) { f.stagger = Math.max(f.stagger || 0, 350); f.cowed = now + 6000; }
      camShake(5, 180); S.fx.push({ x: p.x, y: p.y - 8, vx: 0, vy: 0, type: 'shock', s: 1, life: 400, maxLife: 400 }); sfx('death', 0.5); return true; }
    case 'blink': {
      let d = 0; const ax = Math.cos(p.aim), ay = Math.sin(p.aim);
      for (let k = 8; k <= 110; k += 8) { if (solidTile(p.map, p.x + ax * k, p.y + ay * k) || solidPropAt(p.map, p.x + ax * k, p.y + ay * k, 8)) break; d = k; }
      if (d < 16) { UI.toast('Kein Platz zum Springen.'); return false; }
      fx(p.x, p.y - 12, 'frost', 8); p.x += ax * d; p.y += ay * d; fx(p.x, p.y - 12, 'frost', 8); p.castT = now; sfx('magic', 0.4); return true; }
    case 'first_aid': p.status = (p.status || []).filter(s => s.key !== 'bleeding'); B.heal(p, p.maxHp * 0.15); fx(p.x, p.y - 12, 'heal', 8); return true;
  }
  return true;                                                         // ältere Fähigkeiten: Logik folgt im switch unten
}
// Ausweichen: 8 Richtungen aus WASD, ohne Richtung nach hinten (weg von der Maus).
// i-Frames = Dauer der Rolle. Abklingzeit + Ausdauer verhindern Dauerrollen.
const DODGE = { dur: 240, dist: 92, cd: 850, stam: 20 };
function dodge() {
  const p = S.player;
  if (p.downed || p.dodge || p.channel) return false;
  if (p.dodgeCd > 0) return false;
  const cost = DODGE.stam * (1 - tfx(p, 'dodge')) * (p.titleClass === 'monk' ? 0.75 : 1);   // Mönch: Leerer Geist
  if (p.stamina < cost) { UI.toast('Zu erschöpft zum Ausweichen'); return false; }
  if (B.speedFactor(p) < 0.5) { UI.toast('Mit diesen Beinen rollst du nicht.'); return false; }
  const { dx, dy } = moveInput();
  const l = Math.hypot(dx, dy);
  const ax = l ? dx / l : -Math.cos(p.aim), ay = l ? dy / l : -Math.sin(p.aim);
  p.stamina -= cost; p.dodgeCd = DODGE.cd + DODGE.dur;
  p.dodge = { t: 0, ax, ay }; p.invuln = true; p.swing = 0; p.cover = null;   // Rolle beendet die Deckung
  fx(p.x, p.y + 4, 'dust', 6); sfx('dodge');
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
// Strg+Shift+D. Schalter liegen in DBG (state.js) und werden nie gespeichert. Das Menü ist ein Prüfwerkzeug: alles,
// was ein Tester sonst mühsam erspielen müsste (Ort, Gegner, Gegenstand, Klasse, Auftrag), ist direkt erreichbar.
function dbgTeleport(map, x, y) {
  if (S.map !== map) travel(map);
  const p = S.player, f = freeSpotNear(map, x / TS | 0, y / TS | 0, 10) || { x, y };
  p.x = f.x; p.y = f.y; p.path = null; R.cam.x = p.x - R.view().W / 2 / R.cam.zoom; R.cam.y = p.y - R.view().H / 2 / R.cam.zoom;
  for (const c of S.party || []) { const m = byId(c); if (m && m.map === map) { m.x = p.x + ri(-30, 30); m.y = p.y + ri(-30, 30); } }
}
// Erreichbarkeit wie moveEnt (Radius 10, Kacheln + feste Objekte), Raster 16 px, Flutfüllung ab dem Spieler
function reachMap(map = S.map, from = S.player) {
  const M = MAPS[map], G = 16, w = M.w * 2, h = M.h * 2, r = 10, okc = new Int8Array(w * h).fill(-1), seen = new Uint8Array(w * h);
  const OK = (i, j) => { const k = i + j * w; if (okc[k] < 0) { const x = i * G, y = j * G;
    okc[k] = !solidTile(map, x + r, y) && !solidTile(map, x - r, y) && !solidTile(map, x, y + r) && !solidTile(map, x, y - r) && !solidPropAt(map, x, y, r) ? 1 : 0; } return okc[k]; };
  const s0 = Math.round(from.x / G) + Math.round(from.y / G) * w, q = [s0]; seen[s0] = 1;
  while (q.length) { const k = q.pop(), i = k % w, j = (k / w) | 0;
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + a, nj = j + b; if (ni < 0 || nj < 0 || ni >= w || nj >= h) continue;
      const nk = ni + nj * w; if (!seen[nk] && OK(ni, nj)) { seen[nk] = 1; q.push(nk); } } }
  const near = (x, y, rad = 24) => { for (let j = Math.floor((y - rad) / G); j <= Math.floor((y + rad) / G); j++) for (let i = Math.floor((x - rad) / G); i <= Math.floor((x + rad) / G); i++)
    if (i >= 0 && j >= 0 && i < w && j < h && seen[i + j * w]) return true; return false; };
  return { map, G, w, h, seen, okc, OK, near };
}
function reachReport(RM) {
  const out = [];
  if (RM.map === 'world') for (const L of LOCATIONS) { let tot = 0, re = 0; const Rr = L.r * 2, ci = L.x * 2, cj = L.y * 2;
    for (let j = cj - Rr; j <= cj + Rr; j += 2) for (let i = ci - Rr; i <= ci + Rr; i += 2) { if ((i - ci) ** 2 + (j - cj) ** 2 > Rr * Rr || i < 0 || j < 0 || i >= RM.w || j >= RM.h || !RM.OK(i, j)) continue; tot++; if (RM.seen[i + j * RM.w]) re++; }
    if (re < tot * 0.6) out.push(`${L.name}: ${Math.round(re / Math.max(1, tot) * 100)} % erreichbar`); }
  for (const e of S.ents[RM.map]) {
    if (e.kind === 'prop' && e.portal && !RM.near(e.x, e.y, 40)) out.push(`Eingang ${e.label || e.portal} (${e.x / TS | 0},${e.y / TS | 0})`);
    if ((e.kind === 'npc' || e.kind === 'enemy') && e.alive && !RM.near(e.x, e.y, 24)) out.push(`${e.name || MONSTERS[e.mtype]?.name || e.kind} eingeschlossen (${e.x / TS | 0},${e.y / TS | 0})`);
  }
  return out;
}
function toggleDebug() {
  let d = $('debugpanel');
  if (d) { d.remove(); return; }
  d = document.createElement('div');
  d.id = 'debugpanel'; d.className = 'panel';
  const p = () => S.player, here = () => [S.player.x / TS | 0, S.player.y / TS | 0];
  const up = () => { p().xp = Math.max(p().xp, p().xpNext); levelUp(p()); };   // Stufe ohne negative Erfahrung
  const opt = list => list.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
  const byName = o => Object.entries(o).sort((a, b) => (a[1].name || a[0]).localeCompare(b[1].name || b[0], 'de'));
  const places = [...LOCATIONS.map(L => ['world:' + L.key, L.name]), ['map:mine', 'Grube (innen)'], ['map:deep', 'Tiefhall (innen)']];
  const sections = {
    Spieler: [
      ['Gottmodus', 'god'], ['Endlos Ausdauer/Mana', 'stam'], ['Durch Wände', 'noclip'],
      ['sel', 'speed', [[1, 'Tempo ×1'], [2, 'Tempo ×2'], [4, 'Tempo ×4']], v => DBG.speed = +v],
      ['Heilen', () => { B.fullHeal(p()); p().stamina = p().maxStamina; p().mana = p().maxMana; p().downed = false; p().status = (p().status || []).filter(t => t.good); }],
      ['Stufe +1', () => up()], ['Stufe +5', () => { for (let i = 0; i < 5; i++) up(); }],
      ['+5 Talentpunkte', () => p().skillPoints = (p().skillPoints || 0) + 5], ['+5 Attributpunkte', () => p().attrPoints = (p().attrPoints || 0) + 5],
      ['+500 Gold', () => S.gold += 500], ['+Material', () => { S.res.wood += 100; S.res.stone += 100; S.res.iron += 50; S.res.food += 20; }],
      ['Linken Arm brechen', () => { const r = B.damagePart(p(), 'larm', 999); if (r === 'disabled' || r === 'down') limbLost(p(), 'larm'); }],
      ['Spieler töten', () => { p().body.torso.hp = 0; B.syncHp(p()); downed(p(), 'Debug'); p().downTimer = 1; }],
    ],
    Gegenstand: [
      ['sel', 'item', byName(ITEMS).map(([k, v]) => [k, v.name])],
      ['sel', 'rar', [['', 'Rarität: zufällig'], ...RARITY_ORDER.map(r => [r, RARITY[r]])]],
      ['sel', 'cnt', [[1, '1×'], [5, '5×'], [20, '20×']]],
      ['Geben', () => { const k = val('item'), n = +val('cnt'), r = val('rar');
        for (let i = 0; i < (ITEMS[k].stack ? 1 : n); i++) { const o = mkItem(k, ITEMS[k].stack ? n : 1, { bonus: 0 }); if (r) { o.rar = r; if (r !== 'common' && !o.afx) o.afx = []; }
          if (!giveItem(p(), o)) dropItemAt(S.map, p().x, p().y + 12, o); }
        log(`Debug: ${n}× ${ITEMS[k].name}${r ? ' (' + RARITY[r] + ')' : ''}.`, 'world'); }],
      ['Inventar leeren', () => { p().inv = []; }],
    ],
    Kampf: [
      ['sel', 'mob', byName(MONSTERS).map(([k, v]) => [k, v.name])],
      ['sel', 'mobn', [[1, '1×'], [3, '3×'], [6, '6×']]],
      ['Spawnen', () => { const [x, y] = here(); for (let i = 0; i < +val('mobn'); i++) spawnEnemy(val('mob'), S.map, x + 4 + ri(-1, 1), y + ri(-2, 2)); }],
      ['Gegner hier töten', () => { for (const e of S.ents[S.map].filter(e => e.kind === 'enemy' && e.alive && dist(e, p()) < 700)) die(e, 'Debug', p()); }],
      ['Niemand greift an', 'calm'],
    ],
    Welt: [
      ['sel', 'place', places],
      ['Hinreisen', () => { const [t, k] = val('place').split(':');
        if (t === 'map') return travel(k);
        const L = LOCATIONS.find(l => l.key === k); dbgTeleport('world', L.x * TS + TS / 2, L.y * TS + TS / 2); }],
      ['sel', 'hour', [...Array(24)].map((_, h) => [h, `${String(h).padStart(2, '0')}:00 Uhr`])],
      ['Uhrzeit setzen', () => S.minute = +val('hour') * 60],
      ['Zeit anhalten', 'freeze'],
      ['sel', 'wx', [['clear', 'Klar'], ['cloudy', 'Bewölkt'], ['rain', 'Regen'], ['fog', 'Nebel']]],
      ['Wetter setzen', () => { S.weather = val('wx'); S.weatherLeft = 600; }],
      ['Ruf +25 (alle)', () => { for (const f of Object.keys(S.factions)) S.factions[f] += 25; checkRankUp(); }],
      ['Ruf −25 (alle)', () => { for (const f of Object.keys(S.factions)) S.factions[f] -= 25; }],
    ],
    'Klasse & Auftrag': [
      ['sel', 'cls', byName(CLASSES).map(([k, v]) => [k, v.name])],
      ['Klasse freischalten', () => unlockClass(val('cls'))],
      ['sel', 'tcls', byName(TITLE_CLASSES).map(([k, v]) => [k, v.name])],
      ['Titelklasse annehmen', () => unlockTitle(val('tcls'), 'Debug')],
      ['sel', 'quest', byName(QUESTS).map(([k, v]) => [k, `${v.name}${S.quests[k] ? ' · ' + S.quests[k].state : ''}`])],
      ['Auftrag starten', () => { startQuest(val('quest')); log(`Debug: Auftrag ${QUESTS[val('quest')].name} gestartet.`, 'quest'); }],
      ['Ziele erfüllen', () => { const k = val('quest'), st = S.quests[k] || (startQuest(k), S.quests[k]); QUESTS[k].objectives.forEach((o, i) => st.progress[i] = o.count || 1); log('Debug: Ziele erfüllt — beim Auftraggeber abgeben.', 'quest'); }],
      ['Als erledigt setzen', () => { const k = val('quest'); (S.quests[k] ||= { progress: [] }).state = 'done'; }],
    ],
    'Anzeige & Test': [
      ['Kollisionen zeigen', 'hitbox'], ['NPC-Zustand zeigen', 'npcInfo'], ['FPS & Objekte', 'fps'],
      ['Erreichbarkeit prüfen', () => { const t0 = performance.now(), RM = reachMap(), bad = reachReport(RM); DBG.reach = RM;
        log(`Erreichbarkeit (${S.map}, ${Math.round(performance.now() - t0)} ms): ${bad.length ? bad.length + ' Probleme — ' + bad.slice(0, 8).join(' · ') : 'alles erreichbar'}`, 'world');
        console.table(bad); UI.toast(bad.length ? `${bad.length} unerreichbare Stellen (Log, Konsole, rosa Karte)` : 'Alles erreichbar'); }],
      ['Erreichbarkeit ausblenden', () => DBG.reach = null],
      ['Spielstand speichern', () => { save(); UI.toast('Gespeichert'); }],
      ['Spielstand exportieren', () => { save(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(loadRaw())], { type: 'application/json' }));
        a.download = `rotfall-tag${S.day}.json`; a.click(); }],
      ['Selbsttest', () => selftest()],
    ],
  };
  const val = id => d.querySelector(`[data-dbg="${id}"]`).value;
  d.innerHTML = '<div class="panel-title">DEBUG <span class="dbg-x" title="Schließen (Strg+Shift+D)">×</span></div><div class="dbg-fps"></div>';
  d.querySelector('.dbg-x').onclick = () => d.remove();
  for (const [title, rows] of Object.entries(sections)) {
    const sec = document.createElement('details'); sec.open = title === 'Spieler' || title === 'Anzeige & Test';
    sec.innerHTML = `<summary>${title}</summary>`;
    for (const row of rows) {
      if (row[0] === 'sel') { const el = document.createElement('select'); el.dataset.dbg = row[1]; el.innerHTML = opt(row[2]);
        if (row[1] === 'speed') el.value = DBG.speed; if (row[3]) el.onchange = () => row[3](el.value); sec.appendChild(el); continue; }
      const b = document.createElement('button'), [label, fn] = row;
      if (typeof fn === 'string') { const sync = () => { b.textContent = `${DBG[fn] ? '☑' : '☐'} ${label}`; b.classList.toggle('on', !!DBG[fn]); }; sync(); b.onclick = () => { DBG[fn] = !DBG[fn]; sync(); }; }
      else { b.textContent = label; b.onclick = () => { try { fn(); } catch (err) { console.error(err); UI.toast('Debug-Fehler: ' + err.message); } UI.refreshHUD(); }; }
      sec.appendChild(b);
    }
    d.appendChild(sec);
  }
  document.body.appendChild(d);
  const fpsEl = d.querySelector('.dbg-fps'); let last = performance.now(), frames = 0;
  (function tickFps() { if (!d.isConnected) return; frames++; const now = performance.now();
    if (now - last > 500) { fpsEl.textContent = DBG.fps ? `${Math.round(frames * 1000 / (now - last))} FPS · ${S.ents[S.map].length} Objekte · ${combat.length} Kämpfer · ${S.map} ${here().join(',')}` : `${S.map} ${here().join(',')}`; frames = 0; last = now; }
    requestAnimationFrame(tickFps); })();
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
  // Sprite-System: jede Figur/Pose/Richtung liefert ein nicht-leeres Raster in der festgelegten Größe
  const filled = cv => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; for (let i = 3; i < d.length; i += 4) if (d[i]) return true; return false; };
  ok('Sprites: Figuren aller NPCs, alle Posen', NPCS.every(n => {
    const sp = SP.humanSpec({ ...n, seed: 1, pal: { skin: '#d6b089', hair: '#2b2118', cloth: '#4a3a28' }, equip: {} });
    return ['S', 'N', 'W', 'E'].every(d => ['i0', 'i1', 'w0', 'w1', 'w2', 'w3', 'a1', 'a2', 'hit', 'cast', 'kneel', 'guard', 'sit', 'trade'].every(ps => {
      const f = SP.humanFrame(sp, d, ps); return f.width === 20 && f.height === 25 && (ps !== 'i0' || filled(f)); }));
  }));
  ok('Sprites: alle Gegnertypen', Object.entries(MONSTERS).every(([k, m]) => {
    const e = { mtype: k, seed: 1 };
    const beast = ['wolf', 'boar', 'bear', 'deer', 'wild_dog'].includes(k);
    const f = beast ? SP.beastFrame(k === 'wild_dog' ? 'wolf' : k, m.pal, 'W', '', 0) : k === 'gorak' ? SP.bruteFrame(m.pal, 'E', '', 0) : SP.humanFrame(SP.monsterSpec(e, m), 'S', 'i0');
    return filled(f);
  }));
  ok('Sprites: Waffen & Kacheln', Object.entries(ITEMS).filter(([, i]) => i.slot === 'weapon').every(([k, i]) => filled(SP.weaponSprite(k, i.rarity, i.holy, i.wtype).cv))
    && Object.values(T).every(t => filled(SP.tileTexture(t, 0, ['#3c4a2c', '#43522f', '#364325'], 'grass'))));
  // ---- KI, Verbrechen & Übergänge: echte Funktionen auf zwei Mini-Karten; der Spielstand wird danach wiederhergestellt ----
  const sandbox = fn => {
    const keep = { player: S.player, map: S.map, gold: S.gold, day: S.day, minute: S.minute, party: S.party, kills: S.kills, combat,
      deep: structuredClone({ flags: S.flags, relations: S.relations, factions: S.factions, ranks: S.ranks }) };
    S._quiet = true;
    for (const k of ['__a', '__b']) { MAPS[k] = { w: 40, h: 40, tiles: new Uint8Array(1600).fill(T.GRASS) }; S.ents[k] = []; solidIndex[k] = new Map(); }
    try { return fn(); } catch (err) { console.error(err); return false; }
    finally {
      Object.assign(S, { player: keep.player, map: keep.map, gold: keep.gold, day: keep.day, minute: keep.minute, party: keep.party, kills: keep.kills }, keep.deep);
      combat = keep.combat;
      for (const k of ['__a', '__b']) { delete MAPS[k]; delete S.ents[k]; delete solidIndex[k]; }
      S._quiet = false;
    }
  };
  const actor = (x, y, o = {}) => { const a = makeChar({ name: 'Probe', map: '__a', x, y, ...o }); a.anchor = { x, y }; S.ents.__a.push(a); return a; };
  const stage = () => { const p = actor(300, 300, { kind: 'player' }); S.player = p; S.map = '__a'; S.party = []; return p; };
  const knockOut = (c, by) => { B.damagePart(c, 'torso', 999); downed(c, 'Test', by); };
  ok('KI: Boden/Tod ist terminal (keine Bewegung, kein Resthieb)', sandbox(() => {
    const p = stage(), g = actor(380, 300, { faction: 'valen' });
    g.guard = true; g.angry = true; g.aggroId = p.id; g.sawPlayer = clock(); g.swing = 0.3;
    knockOut(g, p);
    const x0 = g.x, y0 = g.y, hp0 = B.vital(p);
    combat = S.ents.__a.filter(e => e.alive);
    for (let i = 0; i < 90; i++) think(g, 16);
    const v = actor(420, 300); v.angry = true; die(v, 'Test', p);
    const vx = v.x; for (let i = 0; i < 30; i++) think(v, 16);
    return g.x === x0 && g.y === y0 && g.swing === 0 && B.vital(p) === hp0 && v.x === vx && !v.angry && !v.aggroId;
  }));
  ok('Gestürzter Feind wird nicht aufgerichtet, Verbündeter schon', sandbox(() => {
    const p = stage(), g = actor(310, 300), h = actor(300, 320);
    g.angry = true; knockOut(g, p); knockOut(h, null);
    for (let i = 0; i < 5; i++) { tickCombatant(g, 16); tickCombatant(h, 16); }
    return g.downed && !h.downed;
  }));
  ok('Gnadenstoß erledigt einen gestürzten Feind', sandbox(() => {
    const p = stage(), g = actor(325, 300);
    g.angry = true; knockOut(g, p); p.aim = 0; p.equip.weapon = mkItem('longsword');
    resolveSwing(p);
    return !g.alive;
  }));
  ok('Zorn hat eine Leine: Spur verloren, zu weit vom Posten, Spieler überwältigt → Buße', sandbox(() => {
    const p = stage();
    const far = actor(1000, 300); far.anchor = { x: 300, y: 300 }; far.angry = true; far.sawPlayer = clock(); p.x = 1080;
    updateNpc(far, 16);
    p.x = 300; const lost = actor(300, 900); lost.angry = true; lost.sawPlayer = clock() - 20;
    updateNpc(lost, 16);
    const law = actor(320, 300, { faction: 'valen' }); law.guard = true; law.angry = true; law.sawPlayer = clock();
    S.gold = 50; knockOut(p, law); updateNpc(law, 16);
    return !far.angry && !lost.angry && !law.angry && !p.downed && S.gold === 20;
  }));
  ok('Übergänge: Bandit folgt nach Laufzeit, Wolf lauert, Gorak hält seine Halle', sandbox(() => {
    const p = stage();
    const b = spawnEnemy('bandit', '__a', 11, 9), w = spawnEnemy('wolf', '__a', 9, 11), gk = spawnEnemy('gorak', '__a', 12, 12);
    for (const e of [b, w, gk]) { e.aggroId = p.id; e.aiState = 'pursue'; }
    leavePursuit('__a', '__b');
    const left = !!b.follow && !!w.lurk && !gk.follow && !gk.lurk && !gk.aggroId;
    S.ents.__a.splice(S.ents.__a.indexOf(p), 1); p.map = '__b'; S.map = '__b'; S.ents.__b.push(p);
    arrivingPursuers(); const early = S.ents.__b.includes(b);           // braucht Laufzeit bis zur Tür
    S.minute += 6; arrivingPursuers();
    const came = S.ents.__b.includes(b) && b.map === '__b' && b.aggroId === p.id && !S.ents.__a.includes(b);
    S.ents.__b.splice(S.ents.__b.indexOf(p), 1); p.map = '__a'; S.map = '__a'; S.ents.__a.push(p);
    arrivePursuit('__a');
    const lurked = w.aggroId === p.id && !w.lurk && dist(w, p) < 200;
    const w2 = spawnEnemy('wolf', '__a', 25, 25); w2.aggroId = p.id; w2.lurk = { until: clock() - 1 };
    arrivePursuit('__a');
    return left && !early && came && lurked && !w2.aggroId && w2.wary > clock();
  }));
  const guard = (x, y) => { const g = actor(x, y, { faction: 'valen' }); g.guard = true; g.equip.weapon = mkItem('spear'); return g; };
  const frames = (n, list) => { for (let i = 0; i < n; i++) { combat = S.ents.__a.filter(e => e.alive); for (const e of list) think(e, 16); } };
  ok('Reaktion: kämpfende Wache ruft Wachen im Umkreis herbei', sandbox(() => {
    stage(); const gob = spawnEnemy('goblin', '__a', 30, 10), a = guard(gob.x - 200, gob.y), b = guard(gob.x - 600, gob.y);
    gob.atkCd = 1e9; const d0 = dist(b, gob);
    frames(1, [a]); frames(40, [b]);
    return !!b.alarm && dist(b, gob) < d0 - 30;
  }));
  ok('Reaktion: Wache richtet den bewusstlosen Spieler auf, Zivilist holt Hilfe', sandbox(() => {
    const p = stage(), civ = actor(360, 300), g = guard(300, 1100);
    knockOut(p, null);
    frames(1, [civ]);
    const called = g.aid > clock();
    frames(700, [g]);
    return called && !p.downed;
  }));
  ok('Reaktion: Bluttat — Zeugen fürchten den Spieler, Wache wird zornig', sandbox(() => {
    const p = stage(), v = actor(330, 300), w = actor(360, 330), g = guard(300, 360);
    die(v, 'Test', p);
    return w.afraid > clock() && g.angry && !v.alive;
  }));
  ok('Reaktion: Rudel hilft, Händler schließt bei Kampf', sandbox(() => {
    const p = stage(), w1 = spawnEnemy('wolf', '__a', 20, 20), w2 = spawnEnemy('wolf', '__a', 22, 20);
    w2.x = w1.x + 60; w2.y = w1.y;
    hurt(w1, 1, p, 'Test');
    const m = actor(w1.x + 100, w1.y); m.shop = true;
    frames(1, [m]);
    return w2.aggroId === p.id && m.shopClosed > clock();
  }));
  ok('Wegfindung: Verfolger umgeht eine Mauer statt davor festzustecken', sandbox(() => {
    for (let y = 4; y <= 16; y++) setTile('__a', 15, y, T.WALL);
    const p = stage(); p.x = 19 * TS; p.y = 10 * TS + 16;
    const sk = spawnEnemy('skeleton', '__a', 12, 10); sk.x = 13 * TS + 16; sk.y = 10 * TS + 16; sk.aggroId = p.id;
    for (let i = 0; i < 900 && dist(sk, p) > 50; i++) { combat = S.ents.__a.filter(e => e.alive); sk.atkCd = 1e9; think(sk, 16); }
    return dist(sk, p) <= 50;
  }));
  ok('Spawns landen nie in Bäumen; Eingeklemmte kommen frei', sandbox(() => {
    const tree = { id: uid(), kind: 'prop', type: 'tree', map: '__a', x: 10 * TS + 16, y: 10 * TS + 16, r: 12, solid: true };
    S.ents.__a.push(tree); addSolid(tree);
    let inTree = 0; for (let i = 0; i < 60; i++) { const s = freeSpotNear('__a', 10, 10, 1); if (s.x === tree.x && s.y === tree.y) inTree++; }
    const stuck = actor(tree.x, tree.y); for (let i = 0; i < 20; i++) moveEnt(stuck, 1.2, 0);
    return inTree === 0 && dist(stuck, tree) > 15;
  }));
  ok('Kampf: schwere Waffen unterbrechen die Ansage, leichte nicht; Rückstoß rutscht über mehrere Frames', sandbox(() => {
    const p = stage(), probe = w => {                   // Zufall fest: ein Krit (×1,5 Rückstoß) hing sonst am Seed des Spielstands
      seedRng(7); p.equip.weapon = mkItem(w); const b = spawnEnemy('bandit', '__a', 12, 9); b.x = p.x + 40; b.y = p.y; b.telegraph = 400; b.windup = true;
      const x0 = b.x; hit(p, b, 1); const x1 = b.x; tickCombatant(b, 16); const x2 = b.x; for (let i = 0; i < 12; i++) tickCombatant(b, 16);
      return { broke: b.telegraph <= 0 && !b.windup, slide: x1 === x0 && x2 > x0 && b.x > x2, dx: b.x - x0 };
    };
    const heavy = probe('greatsword'), light = probe('dagger');
    return heavy.broke && !light.broke && heavy.slide && light.slide && heavy.dx > light.dx;
  }));
  // ---- Titelklassen (Session 4) ----
  ok('Titelklassen: Daten vollständig (Ressource mit Regel, 3 eigene Fähigkeiten ohne Mana/Ausdauer, Passiv, Makel, Preis, Freischaltung), Pakte schließen einander aus',
    Object.entries(TITLE_CLASSES).every(([k, T]) => T.resource?.rule && T.resource.max > 0 && T.abilities.length === 3
      && T.abilities.every(a => ABILITIES[a]?.title === k && !ABILITIES[a].mana && !ABILITIES[a].stam) && T.passive?.desc && T.flaw?.desc && T.cost?.desc
      && T.unlock && !CLASSES[k] && T.excludes.every(x => TITLE_CLASSES[x].excludes.includes(k))));
  ok('Nekromant: Tod in der Nähe gibt Essenz, Totenruf braucht 2 und macht aus einer Leiche einen Diener (Team Spieler, zerfällt), Makel −15 % Waffenschaden', sandbox(() => {
    const p = stage(); p.equip.weapon = mkItem('longsword');
    const probe = () => { seedRng(3); const b = spawnEnemy('wolf', '__a', 11, 9); const h0 = b.hp; hit(p, b, 1); return h0 - b.hp; };
    const plain = probe();
    if (!unlockTitle('necromancer', 'Test')) return false;
    const weak = probe();
    S.ents.__a = [p]; combat = [p];
    const w = spawnEnemy('wolf', '__a', 11, 9); w.x = p.x + 60; w.y = p.y; combat = S.ents.__a.filter(e => e.alive); die(w, 'Test', p);
    const one = tres(p) === 1 && S.ents.__a.some(e => e.kind === 'corpse');
    p.cooldowns = {}; useAbility('raise_dead'); const early = S.ents.__a.some(e => e.servant === p.id);
    setTres(p, 3); p.cooldowns = {}; useAbility('raise_dead');
    const sv = S.ents.__a.find(e => e.servant === p.id), foe = spawnEnemy('bandit', '__a', 5, 5);
    const team = !!sv && teamOf(sv) === 'player' && isHostile(sv, foe) && tres(p) === 1 && !S.ents.__a.some(e => e.kind === 'corpse' && !e.raised);
    sv.until = performance.now() - 1; updateEnemy(sv, 16);
    return weak < plain && one && !early && team && !S.ents.__a.includes(sv) && !unlockTitle('warlock', 'Test') && pactBound(p) && p.pal.glow === TITLE_CLASSES.necromancer.glow;
  }));
  ok('Hexenmeister: Fluch +25 % Schaden, jeder Zauber lädt Verderbnis, außer Kampf sinkt sie, über 70 frisst sie Leben, bei 100 bricht sie aus (→ 60)', sandbox(() => {
    const p = stage(); if (!unlockTitle('warlock', 'Test')) return false;
    const w = spawnEnemy('wolf', '__a', 11, 9); w.x = p.x + 80; w.y = p.y; combat = S.ents.__a.filter(e => e.alive);
    const v0 = tres(p); p.cooldowns = {}; useAbility('hex');
    const cursed = w.hexed > performance.now() && tres(p) === v0 + 20;
    const h0 = w.hp; hurt(w, 10, p, 'Test'); const plus = Math.abs(h0 - w.hp - 12.5) < 0.01;
    S.ents.__a = [p]; combat = [p]; p.lastCast = -1e9;
    setTres(p, 50); tickCombatant(p, 1000); const decay = Math.abs(tres(p) - 46) < 0.01;
    const sum = () => Object.values(p.body).reduce((n, q) => n + q.hp, 0);
    setTres(p, 90); const b0 = sum(); tickCombatant(p, 1000); const burn = sum() < b0;
    setTres(p, 95); corrupt(p, 10); const burst = tres(p) === 60;
    return cursed && plus && decay && burn && burst && p.maxMana === 0;
  }));
  ok('Skill-Baum: Daten stimmig (Voraussetzungen im selben Zweig, jeder Zweig hat einen Einstieg, jeder Schlüsselknoten hat Absicht und Preis)',
    Object.entries(SKILL_TREE).every(([k, n]) => SKILL_BRANCHES[n.branch] && n.requires.every(r => SKILL_TREE[r]?.branch === n.branch && SKILL_TREE[r].row < n.row)
      && (n.type !== 'keystone' || (n.designIntent && /Dafür|−|nicht/.test(n.desc))))
    && Object.keys(SKILL_BRANCHES).every(b => Object.values(SKILL_TREE).some(n => n.branch === b && !n.requires.length)));
  ok('Skill-Baum: Punkte, Voraussetzung, Titelzweig versiegelt bis zur Titelklasse; Wirkung (Leben, Bollwerk, Berserker, Legion)', sandbox(() => {
    const p = stage(); p.tree = {}; p.skillPoints = 0; recalc(p);
    const hp0 = p.maxHp; learnNode('c_tough'); const noPts = !node(p, 'c_tough');
    p.skillPoints = 20; learnNode('c_skin'); const needReq = !node(p, 'c_skin');
    learnNode('c_tough'); const hpUp = p.maxHp > hp0 * 1.05;
    learnNode('c_skin'); learnNode('c_wall'); const a0 = armorOf(p); learnNode('k_bulwark'); const bulwark = armorOf(p) > a0;
    learnNode('n_bind'); const sealed = !node(p, 'n_bind');
    unlockTitle('necromancer', 'Test'); learnNode('n_bind'); learnNode('n_cold'); learnNode('k_legion');
    const w = spawnEnemy('wolf', '__a', 11, 9), h0 = w.hp, sum = () => Object.values(p.body).reduce((n, q) => n + q.hp, 0);
    p.tree.k_berserk = 1; recalc(p); B.fullHeal(p); let t0 = sum(); hurt(p, 10, w, 'Test'); const taken = t0 - sum();
    delete p.tree.k_berserk; recalc(p); B.fullHeal(p); t0 = sum(); hurt(p, 10, w, 'Test'); const plain = t0 - sum();
    for (let i = 0; i < 3; i++) { S.ents.__a.push({ id: uid(), kind: 'corpse', map: '__a', x: p.x + 20 + i * 8, y: p.y, transient: true }); setTres(p, 6); p.cooldowns = {}; useAbility('raise_dead'); }
    const three = S.ents.__a.filter(e => e.servant === p.id).length === 3;
    return noPts && needReq && hpUp && bulwark && sealed && node(p, 'k_legion') && three && taken > plain && h0 === w.hp;
  }));
  ok('Druide: Wildkraft wächst nur draußen in der Natur (Metall halbiert), Ranken halten fest, Geisterwolf kämpft mit; höchstens 2 Titelklassen', sandbox(() => {
    const p = stage(), str = p.attributes.strength; if (!unlockTitle('druid', 'Test')) return false;
    let g = null; for (let r = 0; r < 40 && !g; r++) for (let i = -r; i <= r && !g; i++) { const [x, y] = worldPt(95 + i, 200 + r);
      if (tileAt('world', x, y) === T.GRASS && !townAt(x, y)) g = [x, y]; }
    const home = { x: p.x, y: p.y }; p.map = 'world'; p.x = g[0] * TS + 16; p.y = g[1] * TS + 16;
    setTres(p, 10); p.equip.chest = null; tickCombatant(p, 1000); const free = tres(p);
    setTres(p, 10); p.equip.chest = mkItem('plate_cuirass'); tickCombatant(p, 1000); const metal = tres(p);
    const [tx, ty] = TOWN_PLAN.eren.square; p.x = tx * TS + 16; p.y = ty * TS + 16; setTres(p, 10); tickCombatant(p, 1000); const town = tres(p);
    p.map = '__a'; p.x = home.x; p.y = home.y; p.equip.chest = null; combat = S.ents.__a.filter(e => e.alive);
    const w = spawnEnemy('bandit', '__a', 12, 9); w.x = p.x + 90; w.y = p.y; w.aggroId = p.id; combat = S.ents.__a.filter(e => e.alive);
    setTres(p, 100); p.cooldowns = {}; useAbility('roots'); const x0 = w.x; for (let i = 0; i < 20; i++) updateEnemy(w, 16); const held = w.x === x0;
    p.cooldowns = {}; useAbility('spirit_wolf'); const wolf = S.ents.__a.find(e => e.servant === p.id && e.mtype === 'wolf');
    const two = unlockTitle('necromancer', 'Test'), three = unlockTitle('warlock', 'Test');
    return Math.abs(free - 15) < 0.01 && Math.abs(metal - 12.5) < 0.01 && town === 10 && held && !!wolf && teamOf(wolf) === 'player'
      && two && !three && p.titleClasses.length === 2 && p.attributes.strength === str - 1;
  }));
  ok('Totenreich: gleiche Fraktion kämpft nicht (Stiller Wächter vs. Skelett), Wächter wehren Grabräuber ab; Seelenbrunnen und Phiole wirken je Titel', sandbox(() => {
    const p = stage(), g = actor(360, 300, { faction: 'undead' }); g.guard = true; g.undead = true;
    const sk = spawnEnemy('skeleton', '__a', 13, 9), bd = spawnEnemy('bandit', '__a', 14, 9);
    const peace = !isHostile(g, sk) && !isHostile(sk, g), fight = isHostile(g, bd) && isHostile(sk, p);
    const sv = spawnEnemy('skeleton', '__a', 15, 9); sv.servant = p.id; const servantFights = isHostile(sv, sk);
    unlockTitle('necromancer', 'Test'); setTres(p, 0); const keepDay = S.flags.wellDay; S.flags.wellDay = -1; soulWell({ x: p.x, y: p.y }); const full = tres(p) === resMax(p);
    soulWell({ x: p.x, y: p.y }); setTres(p, 0); p.inv = []; addItem(p, 'soul_vial', 1); useConsumable(p, 0); const vial = tres(p) === 2;
    S.flags.wellDay = keepDay;
    const regions = ['knochenwald', 'aschensee', 'vharnholm'].every(k => { const L = LOCATIONS.find(l => l.key === k); return L && regionAt(L.x, L.y) === 'blight'; });
    return peace && fight && servantFights && full && vial && regions;
  }));
  ok('Diener folgen ihrem Herrn durch einen Eingang (Kartenwechsel), fremde Untote nicht', sandbox(() => {
    const p = stage(); if (!unlockTitle('necromancer', 'Test')) return false;
    const sv = spawnEnemy('skeleton', '__a', 10, 9); Object.assign(sv, { servant: p.id, transient: true, until: performance.now() + 60000 });
    const other = spawnEnemy('skeleton', '__a', 30, 30);
    ARRIVAL.__b = () => ({ x: 5 * TS, y: 5 * TS });
    try { travel('__b'); } finally { delete ARRIVAL.__b; }
    return S.ents.__b.includes(sv) && sv.map === '__b' && !S.ents.__a.includes(sv) && S.ents.__a.includes(other) && dist(sv, p) < 60;
  }));
  ok('Pakt: öffnet sich erst nach dem Grabsiegel; die Gruft ruft für Fremde den Wächter, einem der Schar gibt sie die Urne', sandbox(() => {
    const keepQ = { u: S.quests.q_undead, p: S.quests.q_pact };
    try {
      const p = stage(); delete S.quests.q_undead; delete S.quests.q_pact;
      const closed = !questAvailable('q_pact');
      S.quests.q_undead = { state: 'done' }; const open = questAvailable('q_pact');
      S.quests.q_pact = { state: 'active', progress: [0] };
      const crypt = { kind: 'prop', type: 'crypt', rite: 'urn', map: '__a', x: 20 * TS, y: 12 * TS, label: 'Große Nekropole' };
      S.ranks.undead = -1; S.flags.wardenSlain = false; urnRite(crypt);
      const warden = S.ents.__a.find(e => e.mtype === 'crypt_warden' && e.alive);
      const fight = !!warden && teamOf(warden) === 'foe' && !hasItem(p, 'ancestor_urn', 1);
      S.ranks.undead = 0; urnRite(crypt);
      return closed && open && fight && teamOf(warden) === 'player' && hasItem(p, 'ancestor_urn', 1);
    } finally { S.quests.q_undead = keepQ.u; S.quests.q_pact = keepQ.p; if (!keepQ.u) delete S.quests.q_undead; if (!keepQ.p) delete S.quests.q_pact; }
  }));
  ok('Mönch: Gelübde kostet halbes Gold, schließt Totenpakte aus; Ausweichen im letzten Moment gibt 1 Fokus je Rolle (nicht in Metall), Treffer kostet 1', sandbox(() => {
    const p = stage(), keep = S.quests.q_monk; S.gold = 100; const ord = S.factions.order;
    try {
      S.quests.q_monk = { state: 'active', progress: [0, 0] };
      if (!unlockTitle('monk', 'Test') || S.gold !== 50 || S.factions.order !== ord + 20 || unlockTitle('necromancer', 'Test')) return false;
      const b = spawnEnemy('bandit', '__a', 11, 9); b.x = p.x + 20; b.y = p.y; b.aim = Math.PI; combat = S.ents.__a.filter(e => e.alive);
      p.dodge = { t: 0, ax: 0, ay: 1 }; p.invuln = true; resolveSwingEnemy(b); resolveSwingEnemy(b);
      const one = tres(p) === 1 && S.quests.q_monk.progress[0] === 1;
      p.dodge = null; p.invuln = false; hurt(p, 5, b); const lost = tres(p) === 0;
      p.equip.chest = mkItem('chain_hauberk'); p.dodge = { t: 0, ax: 0, ay: 1 }; p.invuln = true; resolveSwingEnemy(b);
      const metal = tres(p) === 0; p.dodge = null; p.invuln = false;
      return one && lost && metal && !(p.titleClasses || []).includes('necromancer');
    } finally { if (keep) S.quests.q_monk = keep; else delete S.quests.q_monk; }
  }));
  ok('Mönch: Hundert Schritte — unverwundbarer Sprint trifft jeden Gegner im Weg einmal, Fokus ist danach leer', sandbox(() => {
    const p = stage(); unlockTitle('monk', 'Test'); p.titleClass = 'monk'; setTres(p, 5); p.aim = 0; p.cooldowns = {}; p.equip.weapon = mkItem('longsword');
    const a = spawnEnemy('wolf', '__a', 11, 9), c = spawnEnemy('wolf', '__a', 11, 9); a.x = p.x + 60; a.y = p.y; c.x = p.x + 130; c.y = p.y + 6;
    combat = S.ents.__a.filter(e => e.alive); const ha = a.hp, hc = c.hp;
    useAbility('hundred_steps'); const inv = p.invuln;
    for (let t = 0; t < 400; t += 16) controlPlayer(16);
    return inv && a.hp < ha && c.hp < hc && tres(p) === 0 && !p.dodge && !p.invuln && p.x > 300 + 150;
  }));
  ok('Deckung: Parade in den ersten 180 ms lässt den Angreifer taumeln (kein Schaden), danach Block mit Schild 15 %, leere Ausdauer bricht die Deckung', sandbox(() => {
    const p = stage(); p.equip.offhand = mkItem('wooden_shield'); p.aim = 0; const b = spawnEnemy('bandit', '__a', 11, 9); b.x = p.x + 30; b.y = p.y; b.aim = Math.PI;
    combat = S.ents.__a.filter(e => e.alive); const vit = () => B.PARTS.reduce((n, k) => n + p.body[k].hp, 0);   // alle Körperteile (Treffer gehen auf ein zufälliges)
    updateGuard(p, true); b.swing = 0.45; const h0 = vit(); hit(b, p, 1);
    const parry = vit() === h0 && b.stagger >= 800 && b.swing === 0;
    b.swing = 0.45; b.stagger = 0; const s0 = p.stamina, h1 = vit(); hit(b, p, 1); const dmgBlock = h1 - vit();
    const block = dmgBlock > 0 && p.stamina < s0 && !b.stagger;
    p.cover = null; seedRng(5); const h2 = vit(); p.equip.offhand = null; hit(b, p, 1); const dmgFull = h2 - vit();
    p.equip.offhand = mkItem('wooden_shield'); updateGuard(p, true); p.cover.since = -1e9; p.stamina = 0.5; b.swing = 0.45; hit(b, p, 1);
    const broke = !p.cover && p.guardBroken > performance.now() && p.stagger > 0;
    const w = actor(p.x - 40, p.y, { faction: 'valen' }); w.guard = true; w.post = 'eren'; const wh = w.hp; seedRng(9); hit(b, w, 1);   // Regression: Stadtwache (guard-Flag) blockt nicht aktiv
    const townGuard = w.guard === true && w.hp < wh && !w.cover;
    return parry && block && dmgBlock < dmgFull * 0.4 && broke && townGuard;
  }));
  ok('Rolle: i-Frames enden 40 ms vor der Landung, danach kurz in den Knien (halbes Tempo, kein Hieb)', sandbox(() => {
    const p = stage(); p.stamina = 100; p.dodgeCd = 0; keys.clear(); p.aim = 0; dodge();
    let vulnerableEarly = false; for (let t = 0; t < DODGE.dur; t += 16) { controlPlayer(16); if (p.dodge && !p.invuln && p.dodge.t < DODGE.dur - 56) vulnerableEarly = true; }
    return !vulnerableEarly && !p.dodge && !p.invuln && p.landT > performance.now();
  }));
  ok('Waffen (Phase 7): jede Waffe hat Gefühl (FEEL) und Bild; Rapier-Riposte nach Parade, Hammer ignoriert Schild und lässt taumeln, Hellebarde fegt (Spitze stärker), Armbrust spannt nach, Zauberstab kostet Mana', sandbox(() => {
    const weapons = Object.entries(ITEMS).filter(([, it]) => it.slot === 'weapon');
    const data = weapons.every(([k, it]) => FEEL[it.wtype] && SP.weaponSprite(k, it.rarity, it.holy, it.wtype).cv.width > 0);
    const p = stage(); p.aim = 0; combat = S.ents.__a;
    const mk = (x, y = 0) => { const e = spawnEnemy('bandit', '__a', 11, 9); e.x = p.x + x; e.y = p.y + y; e.stagger = 0; return e; };
    const dealt = (w, e, mult = 1) => { p.equip.weapon = mkItem(w); const h = e.hp; seedRng(4); hit(p, e, mult); return h - e.hp; };
    const a = mk(30), plain = dealt('rapier', a); p.riposteUntil = performance.now() + 1000; const rip = dealt('rapier', mk(30));
    const sh = mk(30); sh.equip = { offhand: { key: 'kite_shield' } }; ITEMS.__wall = { slot: 'offhand', block: 1.43 }; sh.equip.offhand = { key: '__wall' };
    const blockedSword = dealt('longsword', sh), crushed = dealt('warhammer', sh); delete ITEMS.__wall; sh.equip.offhand = null; a.alive = sh.alive = false;
    const near = mk(24, 0), far = mk(80, 6); p.equip.weapon = mkItem('halberd'); const hn = near.hp, hf = far.hp; seedRng(4); resolveSwing(p);
    p.equip.weapon = mkItem('crossbow'); p.stamina = 100; p.swing = 0; p.atkCd = 0; const n0 = S.projectiles.length; resolveSwing(p);
    const shot = S.projectiles.length === n0 + 1 && S.projectiles.at(-1).kind === 'bolt' && p.reloadUntil > performance.now();
    attack(p); const noReshoot = !(p.swing > 0);
    p.reloadUntil = 0; p.equip.weapon = mkItem('wand'); p.maxMana = 50; p.mana = 5; p.swing = 0; p.atkCd = 0; attack(p); const paid = p.mana === 1;
    p.swing = 0; p.atkCd = 0; attack(p); const refused = !(p.swing > 0);
    S.projectiles.length = n0;
    return data && rip > plain * 1.8 && blockedSword === 0 && crushed > 0 && sh.stagger > 0 && hn > near.hp && hf > far.hp && (hf - far.hp) > (hn - near.hp) && shot && noReshoot && paid && refused;
  }));
  ok('Rarität (Phase 8): Verteilung abgestuft, nie mythisch zufällig, Unikate fest; Affixe je Stufe (episch: 1 spielverändernd, legendär: Sondereffekt); Affixe wirken; Aufheben behält das Exemplar', sandbox(() => {
    seedRng(21); const n = {}; let ok1 = true;
    for (let i = 0; i < 4000; i++) { const o = mkItem('rusty_sword', 1, { bonus: 0 }), r = rarOf(o); n[r] = (n[r] || 0) + 1;
      const k = Object.keys(o.afx || {}); if (r === 'uncommon' && k.length !== 1) ok1 = false; if (r === 'rare' && k.length !== 2) ok1 = false;
      if (r === 'epic' && (k.length !== 3 || !k.some(x => AFFIXES[x].major))) ok1 = false; if (r === 'legendary' && !o.leg) ok1 = false; }
    const dist = n.common > n.uncommon && n.uncommon > n.rare && n.rare > (n.epic || 0) && (n.epic || 0) >= (n.legendary || 0) && !n.mythic;
    const unique = rarOf(mkItem('nachtfrost', 1, { bonus: 3 })) === 'mythic' && !mkItem('gorak_cleaver', 1, { bonus: 3 }).afx;
    const p = stage(); p.equip.weapon = mkItem('longsword'); p.equip.weapon.cond = 1; const d0 = damageOf(p);
    p.equip.weapon.afx = { sharp: 0.1 }; const d1 = damageOf(p);
    const a0 = armorOf(p); p.equip.chest = { key: 'leather_jerkin', cond: 1, afx: { sturdy: 3 } }; const a1 = armorOf(p) - ITEMS.leather_jerkin.armor;
    p.equip.weapon.afx = { leech: 0.5 }; const w = spawnEnemy('wolf', '__a', 11, 9); w.x = p.x + 20; w.y = p.y; B.damagePart(p, 'torso', 20); const hb = p.hp; seedRng(3); hit(p, w, 1); const healed = p.hp > hb;
    p.equip.chest.afx = { thorns: 0.5 }; const wh = w.hp; hurt(p, 10, w, 'Test'); const thorn = w.hp < wh;
    const inst = { key: 'longsword', cond: 0.8, rar: 'rare', afx: { keen: 0.05, swift: 0.1 } }; p.inv = []; giveItem(p, inst); const kept = p.inv[0] === inst;
    return ok1 && dist && unique && d1 > d0 * 1.05 && a1 >= a0 + 3 && healed && thorn && kept;
  }));
  ok('Klassen (Phase 10): jede lernbare Klasse hat einen Lehrer, jede neue eine Schwäche; Berserker-Raserei, Barde −15 %, Alchemist braucht Kraut, Assassine nicht in Platte', sandbox(() => {
    const teachers = new Set(NPCS.flatMap(n => [].concat(n.teaches || [])));
    const everyTaught = Object.keys(CLASSES).filter(k => k !== 'wanderer' && k !== 'deathknight').every(k => teachers.has(k));
    const weak = ['berserker', 'assassin', 'bard', 'alchemist'].every(k => CLASSES[k].weak && CLASSES[k].abilities.every(a => ABILITIES[a]));
    const p = stage(); p.equip.weapon = mkItem('longsword'); p.equip.weapon.cond = 1; p.knownClasses = ['wanderer', 'warrior', 'berserker', 'bard', 'alchemist', 'rogue', 'assassin'];
    p.currentClass = 'warrior'; const d0 = damageOf(p); setClass('bard'); const dBard = damageOf(p);
    setClass('berserker'); p.cooldowns = {}; p.stamina = 100; useAbility('frenzy'); const dRage = damageOf(p), hurtMore = (() => { const h = p.hp; hurt(p, 10, null, 'Test'); return h - p.hp; })();
    setClass('alchemist'); p.cooldowns = {}; p.inv = []; useAbility('brew'); const noHerb = !hasItem(p, 'potion', 1); addItem(p, 'herb', 3); useAbility('brew'); const brewed = hasItem(p, 'potion', 1) && !hasItem(p, 'herb', 1);
    setClass('assassin'); p.cooldowns = {}; p.equip.chest = mkItem('plate_cuirass'); const w = spawnEnemy('wolf', '__a', 11, 9); w.x = p.x + 80; w.y = p.y; combat = S.ents.__a;
    const x0 = p.x; useAbility('shadowstep'); const blocked = p.x === x0; p.equip.chest = null; p.cooldowns = {}; p.stamina = 100; useAbility('shadowstep'); const stepped = p.x !== x0 && p.shadowNext > performance.now();
    p.inv = []; addItem(p, 'herb', 1); p.inv.push({ key: 'herb', count: 9 }); p.cooldowns = {}; setClass('alchemist'); useAbility('brew');   // Regression: Kosten über alle Stapel
    const paidAll = p.inv.filter(x => x.key === 'herb').reduce((n, x) => n + (x.count || 1), 0) === 7;
    return paidAll && everyTaught && weak && dBard < d0 * 0.9 && dRage > d0 * 1.25 && hurtMore >= 11 && noHerb && brewed && blocked && stepped;
  }));
  ok('Skill-Baum (Phase 9): aktiver Knoten gibt eine Fähigkeit auf die Leiste; Umlernen gibt alle Punkte zurück', sandbox(() => {
    const p = stage(); p.tree = {}; p.skillPoints = 3; S.gold = 500; p.abilities = []; p.hotbar = [];
    learnNode('c_tough'); learnNode('c_breath'); learnNode('c_cry');
    const onBar = p.hotbar.some(h => h.key === 'war_cry') && treeAbilities(p).includes('war_cry');
    const npc = actor(320, 300); npc.teaches = ['warrior']; npc.key = 'borin'; respec(npc);
    document.querySelector('#dlg-choices button')?.click(); UI.closeDialogue();
    return onBar && p.skillPoints === 3 && !Object.keys(p.tree).length && !p.hotbar.some(h => h.key === 'war_cry');
  }));
  ok('Feuerball/Feuerflasche: Flächenschaden beim Einschlag trifft auch Umstehende', sandbox(() => {
    const p = stage(); combat = S.ents.__a; const a = spawnEnemy('wolf', '__a', 11, 9), b = spawnEnemy('wolf', '__a', 11, 9);
    a.x = p.x + 60; a.y = p.y - 12; b.x = p.x + 80; b.y = p.y + 8; const hb = b.hp;
    S.projectiles.push({ id: uid(), kind: 'fire', map: '__a', x: a.x - 4, y: a.y, vx: 1, vy: 0, owner: p.id, dmg: 20, life: 500, team: 'player', splash: 60 });
    updateProjectiles(16); return b.hp < hb && !S.projectiles.length;
  }));
  ok('Hrodvar: Eiskreis mit Ansage trifft und macht langsam; unter 50 % ruft er einmal drei Tote', sandbox(() => {
    const p = stage(), h = spawnEnemy('hrodvar', '__a', 11, 9, { level: 11 }); h.x = 360; h.y = 300; h.aggroId = p.id; h.aiState = 'pursue';
    combat = S.ents.__a.filter(e => e.alive); const v0 = speedOf(p), hp0 = B.vital(p);
    h.frostCd = 0; updateEnemy(h, 16); const warned = h.special?.kind === 'frost';
    for (let t = 0; t < 1000; t += 16) updateEnemy(h, 16);
    const chilled = p.status.some(q => q.key === 'chilled') && speedOf(p) < v0 * 0.7 && B.vital(p) < hp0;
    h.hp = h.maxHp * 0.45; h.special = null; updateEnemy(h, 16); updateEnemy(h, 16);
    const guards = S.ents.__a.filter(e => e.mtype === 'skeleton' && e.alive).length;
    h.hp = h.maxHp * 0.3; for (let t = 0; t < 1200; t += 16) updateEnemy(h, 16);
    return warned && chilled && guards === 3 && S.ents.__a.filter(e => e.mtype === 'skeleton').length === 3;
  }));
  ok('Königseisen: Abgabe nimmt den Barren, gibt die Frostklinge; ein vorher erschlagener Hrodvar zählt', sandbox(() => {
    const p = stage(), keep = S.quests.q_kingsiron, brann = actor(320, 300); brann.key = 'brann';
    try {
      S.flags.hrodvarSlain = true; addItem(p, 'kings_iron');
      startQuest('q_kingsiron');
      const ready = questComplete('q_kingsiron'); turnIn(brann, 'q_kingsiron'); UI.closeDialogue();
      return ready && hasItem(p, 'frostblade', 1) && !hasItem(p, 'kings_iron', 1) && S.quests.q_kingsiron.state === 'done';
    } finally { if (keep) S.quests.q_kingsiron = keep; else delete S.quests.q_kingsiron; }
  }));
  ok('Pakt-Folge: Ordenswache greift Paktgebundene an (Ruf ≤ −25), vor dem Pakt und solange misstrauisch nicht', sandbox(() => {
    const p = stage(), g = actor(380, 300, { faction: 'order' }); g.guard = true; combat = S.ents.__a.filter(e => e.alive);
    S.factions.order = -40; updateNpc(g, 16); const before = !g.angry;
    unlockTitle('necromancer', 'Test'); S.factions.order = -40; g.wary = clock() + 100; updateNpc(g, 16); const wary = !g.angry;
    g.wary = 0; updateNpc(g, 16);
    return before && wary && g.angry && g.aggroId === p.id;
  }));
  ok('Animation: Interaktion zeigt Knien/Arbeit/Aufrichten, Laufen oder Schwung bricht sie sichtbar ab', (() => {
    const c = makeChar({ name: 'Probe' }), now = performance.now();
    act(c, 'kneel', 400); const k = SP.poseOf(c, now + 10).pose;
    act(c, 'work', 400); const w1 = SP.poseOf(c, now + 10).pose, w2 = SP.poseOf(c, now + 110).pose;
    act(c, 'rise', 400); const r = SP.poseOf(c, now + 10).pose;
    c.vx = 1; const mv = SP.poseOf(c, now + 10).pose; c.vx = 0; c.swing = 0.2; const sw = SP.poseOf(c, now + 10).pose;
    return k === 'kneel' && w1 === 'a1' && w2 === 'a2' && r === 'kneel' && mv.startsWith('w') && sw === 'a1' && SP.poseOf(c, now + 900).pose !== 'kneel';
  })());
  ok('Speichern: Test-/Stilkarten werden nie gespeichert (kein Spieler im Nichts)', sandbox(() => { stage(); return save() === false; }));
  if (S.player && MAPS.world) ok('Stil-Testbereich: hin und zurück stellt Spieler, Karte und Häuser wieder her', (() => {
    const p = S.player, before = { map: S.map, pm: p.map, x: p.x, y: p.y, houses: HOUSES.length, paused: S.paused };
    styleArea(); const inside = S.map === '__style' && S.ents.__style.includes(p) && !S.ents[before.pm].includes(p);
    styleArea(false);
    return inside && S.map === before.map && p.map === before.pm && p.x === before.x && p.y === before.y && HOUSES.length === before.houses
      && !MAPS.__style && !S.ents.__style && S.ents[p.map].includes(p) && S.paused === before.paused;
  })());
  ok('Gebäude: jeder Typ × jede Stadt ergibt ein Sprite in Grundrissbreite (Tag und Nacht)', Object.keys(HB.BTYPES).every(t => Object.keys(HB.TOWN_STYLE).every(town => {
    const b = { id: 't', x: 3, y: 4, w: 5, h: 4, door: 'S', type: t, town, seed: 7 }, cv = HB.houseSprite(b, false), cn = HB.houseSprite(b, true);
    return cv.width === 5 * 16 + 4 && filled(cv) && filled(cn);
  })));
  if (HOUSES.length) ok('Gebäude: Türen frei, keine Möbel in der Türachse (geladene Welt)', HOUSES.every(b => {
    const [dx, dy] = b.doorTile, ix = dx + (b.door === 'W' ? 1 : b.door === 'E' ? -1 : 0), iy = dy + (b.door === 'S' ? -1 : b.door === 'N' ? 1 : 0);
    const ox = dx - (b.door === 'W' ? 1 : b.door === 'E' ? -1 : 0), oy = dy + (b.door === 'S' ? 1 : b.door === 'N' ? -1 : 0);
    return ![[dx, dy], [ix, iy], [ox, oy]].some(([x, y]) => occupied.at(b.map, x, y) || SOLID.has(tileAt(b.map, x, y)));
  }));
  if (HOUSES.length && MAPS.world) {
    const walk = (x, y) => !SOLID.has(tileAt('world', x, y)) && !occupied.at('world', x, y);
    ok('Siedlungen: jede Haustür ist vom Platz aus zu Fuß erreichbar', Object.entries(TOWN_PLAN).every(([town, P]) => {
      const [x0, y0, x1, y1] = P.area, seen = new Set(), q = [P.square];
      while (q.length) { const [x, y] = q.pop(), k = x + ',' + y;
        if (seen.has(k) || x < x0 - 2 || x > x1 + 2 || y < y0 - 2 || y > y1 + 2 || !walk(x, y)) continue;
        seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
      return HOUSES.filter(b => b.town === town).every(b => { const [dx, dy] = b.doorTile;
        return seen.has(`${dx - (b.door === 'W' ? 1 : b.door === 'E' ? -1 : 0)},${dy + (b.door === 'S' ? 1 : b.door === 'N' ? -1 : 0)}`); });
    }));
    const WILD = new Set(['camp_ruin', 'rubble', 'bones', 'debris', 'broken_pillar', 'gravestone', 'firepit', 'mushrooms', 'standing_stone', 'tent_prop', 'bone_spire']);
    ok('Siedlungen: keine Wildnis-Streu (Lager, Geröll, Verstecke) zwischen den Häusern', S.ents.world.every(e => {
      if (e.kind !== 'prop') return true;
      const x = e.x / TS | 0, y = e.y / TS | 0, P = TOWN_PLAN[townAt(x, y)];
      if (!P) return true;
      const inOld = x >= P.old[0] && x <= P.old[2] && y >= P.old[1] && y <= P.old[3];   // alte Stände: Truhen im Kern bleiben (Inhalt)
      return e.house || e.planned || (!WILD.has(e.type) && (inOld || !e.loot));   // Schutt in verlassenen Häusern gehört dazu; planned = Teil des Stadtplans
    }));
    ok('Bewohner: jedes Wohn- und Arbeitshaus bewohnt, ihr Nachtplatz liegt im eigenen Haus', HOUSES.every(b => {
      if (!TRADES[b.type] || HB.wearOf(b) === 2 || (b.town === 'eren' && ['tavern', 'smithy', 'healer'].includes(b.type))) return true;
      const rs = S.ents.world.filter(c => c.homeId === b.id);
      return rs.length > 0 && rs.every(c => { const x = c.anchor.x / TS | 0, y = c.anchor.y / TS | 0;
        return x > b.x && x < b.x + b.w - 1 && y > b.y && y < b.y + b.h - 1 && walk(x, y); });
    }));
    ok('Figuren mit Namen: Nachtplatz im eigenen Haus (freie Kachel), tagsüber ein Arbeitsplatz, Läden mit Ladenschluss', Object.entries(NPC_DAY).every(([k, d]) => {
      const c = S.ents.world.find(e => e.key === k); if (!c || !c.alive) return true;
      const b = HOUSES.find(h => h.id === d.night[0]), x = c.anchor.x / TS | 0, y = c.anchor.y / TS | 0;
      return b && x > b.x && x < b.x + b.w - 1 && y > b.y && y < b.y + b.h - 1 && walk(x, y) && !!c.schedulePos && (!c.shop || c.till > 0);
    }));
    ok('Spawns: keine ruhenden Gegner zwischen den Häusern einer Siedlung', S.ents.world.every(e =>
      e.kind !== 'enemy' || !e.alive || e.aggroId || e.encounter || e.follow || !townAt(e.x / TS | 0, e.y / TS | 0)));
    ok('Weltmaßstab: Karte 768×768, jede Stadt zu Fuß von Eren erreichbar, kein fester Gegenstand auf Mauer/Wasser/Fels', (() => {
      const m = MAPS.world, seen = new Uint8Array(m.w * m.h), [sx, sy] = TOWN_PLAN.eren.square, q = [sy * m.w + sx];
      seen[q[0]] = 1;
      for (let h = 0; h < q.length; h++) { const i = q[h], x = i % m.w, y = (i / m.w) | 0;
        for (const j of [i - 1, i + 1, i - m.w, i + m.w]) { const jx = j % m.w; if (j < 0 || j >= m.tiles.length || seen[j] || Math.abs(jx - x) > 1 || SOLID.has(m.tiles[j])) continue; seen[j] = 1; q.push(j); } }
      const towns = Object.values(TOWN_PLAN).every(P => seen[P.square[1] * m.w + P.square[0]]);
      const props = S.ents.world.every(e => e.kind !== 'prop' || !e.solid || e.type === 'boat' || !SOLID.has(tileAt('world', e.x / TS | 0, e.y / TS | 0)) || ['obelisk', 'crypt', 'tower_ruin', 'watchtower_ruin', 'palisade_prop', 'rock_node', 'ore_node', 'dead_tree', 'fallen_tree', 'rubble', 'broken_pillar', 'gravestone'].includes(e.type));   // Natur/Trümmer/Streugut dürfen im Fels/See liegen
      return m.w === 768 && m.h === 768 && towns && props;
    })());
    ok('Karawanenroute: kein Abschnitt durch Haus, Wasser oder Mauer (Karawanen fahren ohne Kollision)', SIM.ROUTE.every(([x, y], i) => {
      if (!i) return true; const [a, b] = SIM.ROUTE[i - 1], n = Math.max(Math.abs(x - a), Math.abs(y - b), 1);
      for (let k = 0; k <= n; k++) { const tx = Math.floor(a + (x - a) * k / n), ty = Math.floor(b + (y - b) * k / n);   // Wegpunkte in Kachelmitte
        if (SOLID.has(tileAt('world', tx, ty)) || HOUSES.some(h => tx >= h.x && tx < h.x + h.w && ty >= h.y && ty < h.y + h.h)) return false; }
      return true;
    }));
    ok('Karawanenroute folgt der Straße (≥ 90 % der Kacheln Straße oder Brücke)', (() => { let r = 0, n = 0;
      for (let i = 1; i < SIM.ROUTE.length; i++) { const [a, b] = SIM.ROUTE[i - 1], [x, y] = SIM.ROUTE[i], m = Math.max(Math.abs(x - a), Math.abs(y - b), 1);
        for (let k = 0; k < m; k++) { const t = tileAt('world', Math.floor(a + (x - a) * k / m), Math.floor(b + (y - b) * k / m)); n++; if (t === T.ROAD || t === T.PLANK) r++; } }
      return n > 60 && r / n >= 0.9; })());
    const car = S.ents.world.find(e => e.kind === 'caravan' && e.alive);
    if (car) ok('Karawane (BUG-011): zwei Wachen gehen mit dem Zug, stehen zur Karawane, Räuber sind ihre Feinde', (() => {
      const p = S.player, keep = { x: p.x, y: p.y, map: p.map }, bandit = { kind: 'enemy', faction: 'bandit', mtype: 'bandit', alive: true };
      p.x = car.x - 60; p.y = car.y + 110; seedRng(11);
      try {
        let far = 0, n = 0;                                    // Stichprobe alle 240 ms: höchstens 15 % der Proben > 90 px vom Platz (Ecken, Kampf)
        for (let t = 0; t < 12000; t += 16) { update(16, performance.now());
          if (t % 240 === 0) for (const e of escortsOf(car)) { const q = SIM.escortSlot(car, e.slot); n++; if (Math.hypot(q.x - e.x, q.y - e.y) > 90 && !e.threatId) far++; } }
        const es = escortsOf(car);
        return es.length === 2 && new Set(es.map(e => e.slot)).size === 2 && far <= n * 0.15 && es.every(e => teamOf(e) === 'player' && isHostile(bandit, e) && e.map === 'world');
      } finally { Object.assign(p, keep); }
    })());
    ok('Siedlungen (§75): Nachbarhäuser ≥ 2 Kacheln auseinander, bebaut < 35 % der Fläche', Object.entries(TOWN_PLAN).every(([town, P]) => {
      const hs = HOUSES.filter(b => b.town === town), [x0, y0, x1, y1] = P.area;
      const apart = hs.every((a, i) => hs.every((b, j) => j <= i || Math.max(b.x - a.x - a.w, a.x - b.x - b.w, b.y - a.y - a.h, a.y - b.y - b.h) >= 2));
      return apart && hs.reduce((n, b) => n + b.w * b.h, 0) < 0.35 * (x1 - x0 + 1) * (y1 - y0 + 1);
    }));
    ok('Einwohner folgen der Fläche (perHead), nicht der Häuserzahl; Anzeige zählt echte Köpfe', Object.entries(TOWN_PLAN).every(([town, P]) => {
      const [x0, y0, x1, y1] = P.area, target = (x1 - x0 + 1) * (y1 - y0 + 1) / P.perHead;
      const heads = S.ents.world.filter(c => c.kind === 'npc' && c.alive && (c.homeTown === town || c.post === town
        || (!c.villager && !c.guard && !c.escort && !c.escortLost && c.anchor && townAt(c.anchor.x / TS | 0, c.anchor.y / TS | 0) === town))).length;
      return heads <= target * 1.1 + 1 && heads >= Math.min(target * 0.6, HOUSES.filter(b => b.town === town && TRADES[b.type]).length);
    }));
  }
  if (S.ents.world.some(e => e.gk)) ok('Spielstand: nur abweichende Props, Rückweg stellt Truhe und gefällten Baum her (BUG-057)', (() => {
    const keep = S.ents.world, W = keep.slice(), chest = W.find(e => e.kind === 'prop' && e.loot && e.gk && !e.opened), tree = W.find(e => e.type === 'tree' && e.gk);
    if (!chest || !tree) return false;
    const was = chest.opened; S.ents.world = W.filter(e => e !== tree); chest.opened = true;
    try {
      const d = JSON.parse(saveData()), n = d.ents.world.filter(e => e.kind === 'prop').length, all = W.filter(e => e.kind === 'prop').length;
      const stored = d.ents.world.find(e => e.gk === chest.gk);
      S.ents.world = d.ents.world; mergeProps('world', W.filter(e => e.kind === 'prop' && e.gk), d.propsGone.world);
      const back = S.ents.world, bc = back.find(e => e.gk === chest.gk);
      return n < all * 0.05 && stored?.opened && d.propsGone.world.includes(tree.gk) && !back.some(e => e.gk === tree.gk)
        && bc?.opened && bc.id === chest.id && back.filter(e => e.kind === 'prop').length === all - 1
        && back.filter(e => e.kind !== 'prop').length === W.filter(e => e.kind !== 'prop' && !e.transient).length;
    } finally { chest.opened = was; S.ents.world = keep; }
  })());
  ok('Tiefhall (BUG-009): Eingang ist Portal, jeder Raum vom Treppenfuß aus begehbar (Möbel/Säulen sperren keinen Gang), Hort drinnen, Hrodvar im Thronsaal', (() => {
    const D = MAPS.deep, door = S.ents.world.find(e => e.kind === 'prop' && e.portal === 'deep'), ex = S.ents.deep.find(e => e.portal === 'world');
    if (!D || !door || !ex) return false;
    const free = (x, y) => !SOLID.has(tileAt('deep', x, y)) && !occupied.at('deep', x, y), seen = new Set(), q = [[D.entry.x / TS | 0, D.entry.y / TS | 0]];
    while (q.length) { const [x, y] = q.pop(), k = x + ',' + y; if (seen.has(k) || !free(x, y)) continue; seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
    const reach = r => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (seen.has(x + ',' + y)) return true; return false; };
    const t = D.rooms.find(r => r.tag === 'throne'), boss = S.ents.deep.find(e => e.mtype === 'hrodvar'), hort = S.ents.deep.find(e => e.label === 'Tiefhall-Hort');
    const inR = (r, e) => { const x = e.x / TS | 0, y = e.y / TS | 0; return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h; };
    return D.rooms.every(reach) && !!hort && (!boss || inR(t, boss) || boss.aggroId) && !S.ents.world.some(e => e.label === 'Tiefhall-Hort' && !e.opened);
  })());
  if (S.ents.world.some(e => e.borderScene)) ok('Grenzöde: Grenzwacht mit Palisade und zwei Toren auf der Straße, Wachen und Oda im Lager, Späher-Tasche auf freiem Boden', (() => {
    const [ax, ay] = worldPt(323, 343), [bx, by] = worldPt(337, 355), inC = e => e.x / TS >= ax && e.x / TS <= bx + 2 && e.y / TS >= ay && e.y / TS <= by + 2;
    const pal = S.ents.world.filter(e => e.type === 'palisade_prop' && e.borderScene), [gx] = worldPt(330, 343);
    const gates = [ay, by].every(y => [gx, gx + 1].every(x => tileAt('world', x, y) === T.ROAD && !occupied.at('world', x, y)));
    const oda = S.ents.world.find(e => e.key === 'oda'), guards = S.ents.world.filter(e => e.post === 'grenzwacht' && e.alive);
    const sack = S.ents.world.find(e => e.label === 'Tasche des Spähers');
    return pal.length > 30 && gates && !!oda && inC(oda) && guards.length === 3 && !!sack && !SOLID.has(tileAt('world', sack.x / TS | 0, sack.y / TS | 0));
  })());
  ok('Erbe bringt eigene Habe mit (Schütze → Bogen)', (() => { const k = makeChar({ cls: 'archer' }); kinKit(k);
    return !!ITEMS[k.equip.weapon.key].ranged && !!k.equip.chest && hasItem(k, 'bread', 2); })());
  ok('Daten: jeder Gegner definiert interiors, jede Herkunfts-Fertigkeit hat einen Namen',
    Object.values(MONSTERS).every(m => typeof m.interiors === 'boolean') && Object.values(ORIGINS).every(o => Object.keys(o.skills).every(s => SKILL_NAMES[s])));
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
  row('Haut', SKIN, 'skin'); row('Haar', HAIR, 'hair');
  pal.hs = 0;                                                        // Frisur (Pixel-Sprite)
  ap.appendChild(el2('label', '', 'Frisur'));
  const hr = el2('div', 'swatchrow');
  ['Kurz', 'Lang', 'Kahl', 'Zopf'].forEach((n, i) => {
    const b = el2('button', 'hairbtn' + (i === 0 ? ' sel' : ''), n);
    b.onclick = () => { pal.hs = i; [...hr.children].forEach(x => x.classList.remove('sel')); b.classList.add('sel'); drawPreview(); };
    hr.appendChild(b);
  });
  ap.appendChild(hr);
  row('Kleidung', CLOTH, 'cloth');
  const ob = $('cr-origins'); ob.innerHTML = '';
  for (const [k, o] of Object.entries(ORIGINS)) {
    const b = el2('button', 'origin' + (k === origin ? ' sel' : ''), `${o.name}<small>${Object.keys(o.skills).slice(0, 2).map(s => SKILL_NAMES[s] || s).join(', ')}</small>`);
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
    const eq = {};                                                    // Vorschau trägt die Startausrüstung der Herkunft
    for (const k of ORIGINS[origin].gear) { const sl = ITEMS[k].slot; if (['weapon', 'offhand', 'head', 'chest', 'cloak'].includes(sl) && !eq[sl]) eq[sl] = { key: k }; }
    if (!eq.weapon) eq.weapon = { key: 'rusty_sword' };
    R.drawHumanoid({ kind:'player', x:0, y:0, pal, facing:0, seed:1, build, equip: eq, aim:0.5 }, performance.now(), c);
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
    toHotbar: key => { const p = S.player; if (p.hotbar.length < 10) p.hotbar.push({ type:'item', key }); else p.hotbar[9] = { type:'item', key }; UI.renderHotbar(); },
    useSlot, spendAttr: k => { const p = S.player; if (p.attrPoints > 0) { p.attributes[k]++; p.attrPoints--; recalc(p); } },
    setClass, setTitleClass, tres, resMax, learnNode, nodeState, armorOf, damageOf, population, canAfford,
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
  // Entwicklerzugang (nur mit ?dev): Zustand und Kernfunktionen für Browser-Tests; tick() simuliert auch bei verstecktem Tab.
  if (location.search.includes('dev')) window.RF = { S, R, MAPS, TS, update, styleArea, tick: (ms, step = 16) => { for (let t = 0; t < ms; t += step) update(step, performance.now()); },
    travel, spawnEnemy, hurt, die, downed, provoke, attack, resolveSwing, teamOf, isHostile, byId, save, selftest, solidPropAt };
}
boot();
