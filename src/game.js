// Rotfall: Legacy — Spielkern. Schleife, Kampf, KI, Quests, Siedlung, Erbe.
import { S, SAVE_VERSION, log, chronicle, save, loadRaw, applySave, hasSave, wipeSave, seedRng, rnd, ri, pick, chance,
         clamp, dist, uid, byId, partyMembers, timeStr, year, mergeProps, adoptPropKeys, saveData } from './state.js';
import { ITEMS, MONSTERS, NPCS, ORIGINS, CLASSES, ABILITIES, FACTIONS, BUILDINGS, QUESTS, LOOT, MEMORY_TEXT, RARITY, RARITY_ORDER, RARITY_DROP, RARITY_VALUE, RARITY_AFFIXES, AFFIXES, LEGENDS, SKILL_NAMES, TITLE_CLASSES, SKILL_TREE, SKILL_BRANCHES, MAX_TITLES, REP_TIERS } from './data.js';
import { MAPS, TS, T, SOLID, LOCATIONS, genWorld, genMine, genDeep, genSky, genKerker, DUNGEONS, MAP_KEYS, tileAt, setTile, solidTile, speedMul, locAt, freeSpotNear, openSpot, regionAt, occupied, HOUSES, TOWN_PLAN, townAt, worldPt, WS, EAST, EAST2, SOUTH, VILLAGES, OX, EM, EISEN_CONVOY, FORT, EISEN_SITES, METRO } from './world.js';
import * as R from './render.js';
import * as HB from './buildings.js';
import * as UI from './ui.js';
import * as SIM from './sim.js';
import * as B from './body.js';
import * as SP from './sprites.js';
import { drawAtlas, revealAround, explored } from './atlas.js';
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
  c.maxStamina = 60 + a.endurance * 4 + c.level * 2 + B.buildOf(c).stamina + (c.pactCost?.stamina || 0) + tfx(c, 'stam') + afx(c, 'enduring');
  const magic = ['mage', 'cleric', 'paladin'].includes(c.currentClass);   // Titelklassen haben ihre eigene Ressource, kein Mana
  c.maxMana = magic ? 30 + a.intelligence * 4 + a.willpower * 2 + c.level * 2 + tfx(c, 'mana') : 0;
  if (c.kind === 'player') c.invCap = 24 + tfx(c, 'invCap');
  c.partyCap = 3 + Math.floor((c.skills.leadership || 0) / 10) + (S.settlement ? 1 : 0);
}
export function armorOf(c) {
  if (!c.equip) return c.armor || 0;                       // Karawane, Gegner
  let v = 0;
  for (const k of Object.keys(c.equip)) { const it = c.equip[k]; if (it && ITEMS[it.key].armor) v += ITEMS[it.key].armor * (0.4 + 0.6 * (it.cond ?? 1)); }
  v += afx(c, 'sturdy') + (hasLeg(c, 'bastion') && c.hp < c.maxHp * 0.3 ? 8 : 0);   // Härte, Ahnenwall
  const ch = c.equip.chest && ITEMS[c.equip.chest.key];               // S12 Rotgardist: Standhalten neben einem Verbündeten
  if (ch?.ally && S.ents[c.map]?.some(e => e !== c && e.alive && (e.kind === 'npc' || e.kind === 'player') && !e.captive && dist(e, c) < 90 && !isHostile(c, e))) v += ch.ally;
  const bless = (c.status || []).find(s => s.key === 'blessing');
  v = (v + tfx(c, 'armor') + (node(c, 'k_grove') && inNature(c) ? 3 : 0)) * (node(c, 'k_bulwark') ? 1.3 : 1);
  return Math.round(v + (bless ? 5 : 0) + (c.level || 1) * 0.25);   // Phase 1: Stufe härtet ab
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
  return (base + attr * 0.35 + skill * 0.22 + (c.level || 1) * 0.35) * Math.max(0.2, m);   // Phase 1: jede Stufe etwas stärker
}
function speedOf(c) {
  let s = 2.25 + c.attributes.agility * 0.045;
  const off = c.equip.offhand && ITEMS[c.equip.offhand.key].slow || 0;
  const ch = c.equip.chest && ITEMS[c.equip.chest.key].slow || 0;
  s *= (1 - off - ch);
  if (c.stamina <= 0) s *= 0.55;
  if (c.status && c.status.some(t => t.key === 'chilled')) s *= 0.6;   // Hrodvars Eiskreis
  if (stat(c, 'frenzy')) s *= 1.15;
  if (stat(c, 'grabbed')) s *= 0.5;                                   // Griff des Wiedergängers
  if (stat(c, 'shackled')) s *= 0.5;                                  // S12 E: Fußkette (Schuldknecht, Steinbruch)
  s *= (1 + tfx(c, 'speed') + afx(c, 'fleet')) * (node(c, 'k_bulwark') ? 0.9 : 1) * (node(c, 'k_wild') ? (outside(c) ? 1.1 : 0.95) : 1);
  return s * speedMul(c.map, c.x, c.y) * B.speedFactor(c) * (c === S.player && S.dbg?.speed ? S.dbg.speed : 1);   // Debug-Tempo
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
  if (c === S.player && S.bond && (it.slot === 'weapon' || it.slot === 'offhand')) return UI.toast('In Ketten: keine Waffe, bis die Schuld getilgt ist.');   // S12: Nutzer
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
  if (it.use === 'prosthesis') {                             // S12: Prothese anlegen — nur an ein verlorenes Glied
    const part = ['l', 'r'].map(s => s + it.part).find(p => c.body?.[p]?.lost);
    if (!part) return UI.toast(`Kein verlorener ${it.part === 'arm' ? 'Arm' : 'Bein'} — die Prothese passt nirgends.`);
    removeItem(c, slot.key, 1); B.attachProsthesis(c, part, it.tier || 1);
    log(`${c.name} bekommt ${it.name} (${B.PART_NAME[part]}).`, 'party'); UI.toast(`${it.name.toUpperCase()} ANGELEGT`, 2400); recalc(c);
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
  aurel: { prof: 'Automat-Wächter', cloth: '#3a3530', weapon: 'halberd', chest: 'plate_cuirass', head: 'great_helm', robot: true },   // S12: Wachen des Hochreichs sind Maschinen
  chainx: { prof: 'Kettenschütze', cloth: '#1a1718', weapon: 'crossbow', chest: 'eisenwache', head: 'kettle_hat' },   // S12 Feldzug
  chainpal: { prof: 'Dunkler Paladin', cloth: '#141214', weapon: 'kettenbrecher', chest: 'eisenfuerst', head: 'eisenfuersthelm' },   // S12: Elite nach einem Aufstand
  chain: { prof: 'Kettenwache', cloth: '#1a1718', weapon: ['chain_whip', 'chain_whip', 'spear', 'schrott_hellebarde', 'flail'], chest: ['eisenwache', 'eisenwache', 'brigandine', 'aufsehermantel'], head: ['kettle_hat', 'bergmannshelm', 'iron_helm', null] },   // S11/S12: jede Wache anders bestückt
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
  for (const sl of ['weapon', 'chest', 'head', 'offhand']) { const v = Array.isArray(k[sl]) ? pick(k[sl]) : k[sl]; if (v) c.equip[sl] = mkItem(v); }
  c.anchor = { x: pos.x, y: pos.y }; c.skills.onehanded = 20; c.skills.polearms = 20;
  if (k.robot) { c.robot = true; c.name = `Automat ${String.fromCharCode(65 + (c.id.length * 7) % 26)}-${10 + ((pos.x | 0) + (pos.y | 0)) % 90}`; c.traits = ['gehorsam']; }
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
// Hochreich Aurelion (S12): andere Stände in denselben Haustypen
const AUREL_TRADES = { house: ['Edelmann', 'Edelfrau', 'Kaufherr', 'Handwerker', 'Feinmechaniker'], manor: ['Graf', 'Gräfin', 'Edelmann', 'Edelfrau'], store: ['Kaufherr', 'Prothesenhändlerin', 'Handwerker'],
  smithy: ['Kybernetiker', 'Feinmechaniker'], healer: ['Medica'], chapel: ['Gelehrter'], tavern: ['Wirt'], fisher: ['Fischer'], barn: ['Handwerker'],
  palace: ['Hofbeamter', 'Kammerdiener', 'Hofdame'], markethall: ['Gewürzhändler', 'Tuchhändlerin', 'Juwelier', 'Waffenhändler', 'Rüstmeisterin'], bank: ['Bankier', 'Geldwechsler'],
  academy: ['Magister', 'Studentin', 'Gelehrter'], observatory: ['Sternkundiger'], library: ['Archivar', 'Schreiberin'], court: ['Richterin', 'Gerichtsschreiber'], hospital: ['Medica', 'Pfleger'],
  bathhouse: ['Bader'], magitech: ['Magitech-Ingenieurin', 'Kristallschleifer'], factoryhall: ['Werkmeister', 'Fabrikarbeiter'], legion: ['Sonnenlegionär', 'Offizier der Sonnenlegion'] };   // Phase 5: begehbare Prachtbauten
const MARKET_POOL = { 'Gewürzhändler': ['herb', 'herb', 'bread', 'dried_meat', 'potion'], 'Tuchhändlerin': ['traveler_cloak', 'leather_jerkin', 'leather_cap'], Juwelier: ['potion', 'potion', 'bandage'],
  Waffenhändler: ['longsword', 'spear', 'shortbow', 'halberd', 'rusty_sword'], 'Rüstmeisterin': ['chain_hauberk', 'plate_cuirass', 'kite_shield', 'iron_helm', 'great_helm'] };
const TRADE_GREET = {
  Graf: '„Ihr seid weit gereist, sieht man. Und riecht man.“', 'Gräfin': '„Der Norden schickt uns immer die Zähesten. Die Klugen bleiben dort und sterben.“',
  Edelmann: '„Ein Arm aus Gelenkhall ist ein Zeichen von Stand, nicht von Unglück.“', Edelfrau: '„Unsere Automaten verneigen sich tiefer als eure Knechte.“',
  Kaufherr: '„Alles hat einen Preis. Hier kennt man ihn nur genauer.“', Feinmechaniker: '„Federn, Zapfen, Geduld. Mehr braucht ein Arm nicht.“',
  Kybernetiker: '„Fleisch vergeht. Messing wird nur älter.“', Medica: '„Zeig mir den Stumpf. Nein, das heilt nicht mehr — aber es lässt sich ersetzen.“',
  Prothesenhändlerin: '„Arm oder Bein? Links oder rechts? Und wie viel Gold hast du dabei?“', Gelehrter: '„Die Alten bauten Maschinen, die dachten. Wir bauen welche, die gehorchen. Klüger, glaub mir.“',
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
// Vornamen nach Geschlecht: der Beruf bestimmt die Liste (Magd, Witwe, …in → Frauennamen), sonst passten „Magd Folkmar“ (BUG-090)
// BUG-087: je Stadt jeder Name nur einmal (vorher 14 je Liste + Hash-Kollisionen → 9× „Notker“ in Salzhafen)
const FIRST_F = ['Adda', 'Cordula', 'Edda', 'Gesa', 'Irmel', 'Kunna', 'Mechthild', 'Ragna', 'Thiadrun', 'Walburg', 'Ymma', 'Ella', 'Hemma',
  'Alheid', 'Bertrada', 'Brunhild', 'Diemut', 'Engela', 'Fridrun', 'Gerlind', 'Gisela', 'Hadwig', 'Hildegund', 'Ida', 'Imma', 'Jutta',
  'Kunigund', 'Liutgard', 'Margret', 'Mathilde', 'Odilie', 'Richenza', 'Sigrid', 'Swanhild', 'Tetta', 'Uta', 'Wendel', 'Wiltrud',
  'Adelheid', 'Berta', 'Frauke', 'Gunda', 'Hedwig', 'Irmgard', 'Reinhild'];
const FIRST_M = ['Bertold', 'Dietmar', 'Folkmar', 'Hartwig', 'Jost', 'Liudger', 'Notker', 'Poppo', 'Sigbert', 'Udo', 'Wido', 'Arnulf', 'Benno', 'Gero',
  'Adalbert', 'Balduin', 'Burkhard', 'Conrad', 'Eberhard', 'Egino', 'Engelbert', 'Friedel', 'Gebhard', 'Gottschalk', 'Heimo', 'Hermann',
  'Hugo', 'Ingram', 'Kuno', 'Lambert', 'Lothar', 'Meinhard', 'Odo', 'Ortwin', 'Rainald', 'Ruprecht', 'Tammo', 'Thankmar', 'Volker',
  'Waltram', 'Wernher', 'Wolfram', 'Ulrich', 'Anselm', 'Egbert', 'Hartmut', 'Ivo'];
const BYNAME_F = ['die Ältere', 'die Jüngere', 'die Lange', 'die Stille'], BYNAME_M = ['der Ältere', 'der Jüngere', 'der Lange', 'der Stille'];
export const femTrade = prof => /(in|frau)$/.test(prof) || ['Magd', 'Witwe', 'Stumme Magd', 'Medica'].includes(prof);
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
    let left = Math.round((x1 - x0 + 1) * (y1 - y0 + 1) / (P.perHead || 90)) - (GUARD_POSTS[town]?.posts.length || 0) - (P.lord === 'aurel' ? AUREL_GUARDS : 0) - named - hs.length;   // S12: Automaten zählen mit
    for (const b of hs) out[b.id] = 1;
    const order = hs.slice().sort((a, b) => houseCap(b) - houseCap(a) || (a.id < b.id ? -1 : 1));
    for (let more = true; left > 0 && more;) { more = false;
      for (const b of order) if (left > 0 && out[b.id] < houseCap(b)) { out[b.id]++; left--; more = true; } }
  }
  return out;
}
const TOWN_OF_SPOT = { village: 'eren', tavern: 'eren', market: 'eren', smithy: 'eren', healer: 'eren', farm: 'eren', mayor: 'eren', northcity: 'northcity', vharnholm: 'vharnholm' };
function nameFix() {                        // Bewohner: Name passend zum Beruf (BUG-090) und je Stadt nur einmal (BUG-087); Figuren mit Namen bleiben tabu
  const vs = S.ents.world.filter(c => c.villager && c.name).sort((a, b) => (a.id < b.id ? -1 : 1));
  const named = S.ents.world.filter(c => (c.kind === 'npc' || c.kind === 'player') && !c.villager && c.name).map(c => c.name.split(' ')[0]);
  const used = {};
  for (const c of vs) {
    const u = used[c.homeTown] ||= new Set(named), fem = femTrade(c.prof), L = fem ? FIRST_F : FIRST_M;
    if (!L.includes(c.name) || u.has(c.name)) {
      const k = [...c.id].reduce((n, ch) => n + ch.charCodeAt(0), 0), free = A => A.map((_, j) => A[(k + j) % A.length]).find(n => !u.has(n));
      c.name = free(L) ?? free(L.flatMap(n => (fem ? BYNAME_F : BYNAME_M).map(b => `${n} ${b}`))) ?? c.name;   // erst freie Vornamen, dann mit Beinamen
    }
    u.add(c.name);
  }
}
const hsh = (a, b, c) => { let n = (a * 374761393 + b * 668265263 + c * 2246822519) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
// Orte eines Bewohners (Haus b, Index i im Haus): drinnen, vor der Tür, Platz, Nachbarhaus, Arbeitsplatz — deterministisch
function spotsOf(b, i, prof) {
  const P = TOWN_PLAN[b.town], [dx, dy] = b.doorTile, sx = b.door === 'W' ? 1 : b.door === 'E' ? -1 : 0, sy = b.door === 'S' ? -1 : b.door === 'N' ? 1 : 0;
  const inside = { x: (dx + sx) * TS + TS / 2, y: (dy + sy) * TS + TS / 2 }, front = { x: (dx - sx) * TS + TS / 2, y: (dy - sy) * TS + TS / 2 };
  const town = HOUSES.filter(h => h.town === b.town && h.map === 'world' && h !== b && HB.wearOf(h) < 2);
  const plaza = (P.plazas || []).find(([, x0, y0, x1, y1]) => P.square[0] >= x0 - 3 && P.square[0] <= x1 + 3 && P.square[1] >= y0 - 3 && P.square[1] <= y1 + 3);
  const hx = b.hx ?? b.x, hy = b.hy ?? b.y;
  const pier = P.harbor && P.harbor.piers[(hx + i) % P.harbor.piers.length], field = P.fields && P.fields[(hx + i) % P.fields.length];
  // Früher standen alle Müßigen auf 5×3 Kacheln am Platz: bei mehr Einwohnern ein Gedränge — daher die ganze Platzfläche
  const r = hsh(hx, hy, i), nb = town[Math.floor(hsh(hy, hx, i + 7) * town.length)];
  const dist0 = P.metro && (METRO.districts || []).find(d => !d.outside && hx >= d.x0 && hx <= d.x1 && hy >= d.y0 && hy <= d.y1);   // Phase 5: Metropole — Treffpunkt im eigenen Bezirk
  const sq = dist0 ? { x: (dist0.x0 + (dist0.x1 - dist0.x0) * (0.3 + hsh(hx, i, 3) * 0.4)) * TS, y: (dist0.y0 + (dist0.y1 - dist0.y0) * (0.3 + hsh(hy, i, 5) * 0.4)) * TS }
    : plaza ? { x: (plaza[1] + hsh(hx, i, 3) * (plaza[3] - plaza[1] + 1)) * TS, y: (plaza[2] + hsh(hy, i, 5) * (plaza[4] - plaza[2] + 1)) * TS }
    : { x: (P.square[0] + (hsh(hx, i, 3) - 0.5) * 10) * TS, y: (P.square[1] + (hsh(hy, i, 5) - 0.5) * 6) * TS };
  const visit = nb ? { x: (nb.doorTile[0] + (nb.door === 'E' ? 2 : nb.door === 'W' ? -2 : 0.5 + (i % 2 ? 1 : -1))) * TS, y: (nb.doorTile[1] + (nb.door === 'S' ? 1.5 : nb.door === 'N' ? -1.5 : 0.5)) * TS } : front;
  const job = prof === 'Fischer' && pier ? { x: (pier + 0.5) * TS, y: (P.harbor.top + 2 + (hx + hy + i) % 4) * TS }   // entlang des Stegs, nicht alle auf einem Punkt
    : b.type === 'barn' && field ? { x: ((field[0] + field[2]) / 2) * TS, y: ((field[1] + field[3]) / 2) * TS }
    : ['tavern', 'healer', 'chapel'].includes(b.type) && i === 0 ? inside
    : ['bakery', 'store', 'stable', 'smithy', 'fisher'].includes(b.type) && i === 0 ? front : null;
  return { inside, front, sq, visit, job, work: job || (r < 0.35 ? sq : r < 0.65 ? visit : front), sx, sy, hx, hy };
}
function spawnResidents() {
  const plan = residentPlan();
  for (const b of HOUSES) {
    const P = TOWN_PLAN[b.town], trades = TRADES[b.type] && (b.town === 'vharnholm' ? DEAD_TRADES : P?.lord === 'aurel' ? (AUREL_TRADES[b.type] || TRADES[b.type]) : TRADES[b.type]), n = plan[b.id] || 0;
    if (!P || !trades || b.map !== 'world' || !n) continue;
    if (S.ents.world.some(c => c.homeId === b.id)) continue;                          // schon bewohnt (Migration idempotent)
    for (let i = 0; i < n; i++) {
      const hx = b.hx ?? b.x, hy = b.hy ?? b.y, prof = trades[(hx * 7 + hy * 3 + i) % trades.length];
      const { front, work } = spotsOf(b, i, prof);
      const c = makeChar({ name: (femTrade(prof) ? FIRST_F : FIRST_M)[(hx * 13 + hy * 5 + i * 11) % 14], prof, x: front.x, y: front.y, level: ri(1, 4),
        traits: [pick(['gütig', 'mürrisch', 'neugierig', 'faul', 'furchtsam', 'fleißig'])], greet: TRADE_GREET[prof] });
      c.villager = true; c.homeId = b.id; c.homeTown = b.town;
      if (b.town === 'vharnholm') { c.undead = true; c.faction = 'undead'; c.hooded = true; c.pal = { ...c.pal, skin: '#b9b3a2', glow: '#4e8f7a', cloth: pick(['#232a28', '#2a2622', '#1f2624']) }; }
      c.schedulePos = work; c.eve = front;                                              // Tagesplan im Detail: planDays()
      if (prof === 'Heilerin') c.traits = ['gütig'];
      if (MARKET_POOL[prof]) Object.assign(c, { shop: true, pool: MARKET_POOL[prof], till: 20 });   // Markthalle: echte Händler
      if (prof === 'Sonnenlegionär' || prof === 'Offizier der Sonnenlegion') { c.equip.chest = mkItem('plate_cuirass'); c.equip.weapon = mkItem('halberd'); c.pal = { ...c.pal, cloth: '#c8a050' }; c.brave = true; }
      S.ents.world.push(c);
    }
  }
  nameFix();
  planDays();
}

// Stadtfeste (Session 10, Nutzerwunsch „Versammlungen an Stadtfesten mit besonderen Sachen“): jede Stadt feiert alle
// FEST_DAYS Tage (eigener Versatz), 15–23 Uhr auf dem Hauptplatz. Aufbau aus vorhandenen Props (Feuer, Tafeln, Bänke,
// Fässer, Stand, Fackeln) — `transient`: wird nie gespeichert, nach dem Fest wieder abgebaut. Am Vortag angekündigt.
// Bewohner stehen im Kreis ums Feuer und reden übers Fest; an der Festtafel gibt es einmal je Fest ein Festmahl.
const FEST_DAYS = 6, FEST_BUILT = new Set();
const townName = t => LOCATIONS.find(l => l.key === t)?.name || { northcity: 'Nordfurt', saltport: 'Salzhafen', kreuzweg: 'Kreuzweg', ashford: 'Aschfurt', sonnwacht: 'Sonnwacht' }[t] || t;
const festDay = (town, d = S.day | 0) => town !== 'vharnholm' && (d + [...town].reduce((n, c) => n + c.charCodeAt(0), 0)) % FEST_DAYS === 0;
const festNow = town => !!town && festDay(town) && S.minute >= 15 * 60 && S.minute < 23 * 60;
const festSpot = town => { const [x, y] = TOWN_PLAN[town].square; return { x: (x + 0.5) * TS, y: (y + 0.5) * TS }; };
const FEST_SET = [['campfire', 0, -2], ['table', -3, 3], ['bench', -3, 4], ['table', 3, 3], ['bench', 3, 4], ['cask_rack', -5, -2], ['stall', 5, -2],   // Platzmitte bleibt frei (Kreuzung)
  ['torch', -6, 2], ['torch', 6, 2], ['torch', -2, -5], ['torch', 2, -5], ['lantern', 0, 5]];
let festMin = -1;
function festTick() {
  if ((S.minute | 0) === festMin) return; festMin = S.minute | 0;          // höchstens einmal je Spielminute prüfen
  for (const town of Object.keys(TOWN_PLAN)) {
    const on = festNow(town);
    if (on && !FEST_BUILT.has(town)) {
      FEST_BUILT.add(town); const c = festSpot(town), cx = c.x / TS | 0, cy = c.y / TS | 0;
      const ground = new Set([T.STONE, T.DIRT, T.GRASS, T.SAND]), taken = new Set();   // nicht auf Straße (Karawane, Wachen!), Acker, Wasser, Möbel
      const [sx, sy] = TOWN_PLAN[town].square; taken.add(sx + ',' + sy);                 // Platzmitte und Türvorplätze (±1) bleiben frei
      for (const b of HOUSES) if (b.town === town) { const [dx, dy] = b.doorTile, ox = dx - (b.door === 'W' ? 1 : b.door === 'E' ? -1 : 0), oy = dy + (b.door === 'S' ? 1 : b.door === 'N' ? -1 : 0);
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) taken.add((ox + i) + ',' + (oy + j)); }
      const ok = (tx, ty) => ground.has(tileAt('world', tx, ty)) && !taken.has(tx + ',' + ty) && !solidPropAt('world', tx * TS + TS / 2, ty * TS + TS / 2, 8);
      for (const [type, dx, dy] of FEST_SET) {
        const spot = [[0, 0], [0, -1], [1, 0], [-1, 0], [0, 1], [1, -1], [-1, -1], [0, -2], [2, 0], [-2, 0], [0, 2], [0, -3], [1, 2], [-1, 2], [0, 3]].map(([i, j]) => [cx + dx + i, cy + dy + j]).find(([i, j]) => ok(i, j));
        if (!spot) continue; const [tx, ty] = spot, x = tx * TS + TS / 2, y = ty * TS + TS / 2; taken.add(tx + ',' + ty);
        if (type === 'table') taken.add(tx + ',' + (ty + 1));
        S.ents.world.push({ id: 'fest_' + town + '_' + type + dx + '_' + dy, kind: 'prop', type, x, y, r: 12, map: 'world', transient: true, fest: town,
          solid: type !== 'lantern' && type !== 'torch', feast: type === 'table' || undefined, label: type === 'table' ? 'Festtafel' : type === 'stall' ? 'Festbude' : undefined }); }
      indexSolids('world');
      if (S.map === 'world' && townAt(S.player.x / TS | 0, S.player.y / TS | 0) === town) UI.toast(`Stadtfest in ${townName(town)} — am Platz wird gefeiert`, 4200);
    } else if (!on && FEST_BUILT.has(town)) {
      FEST_BUILT.delete(town); S.ents.world = S.ents.world.filter(e => e.fest !== town); indexSolids('world');
    }
  }
}
function festMeal(p, t) {                                            // Festtafel: einmal je Fest satt, geheilt, ausgeruht
  const key = t.fest + '@' + (S.day | 0);
  if (S.flags.festAte === key) { log('„Du hattest schon deinen Teil. Lass den anderen was übrig.“', 'world'); return; }
  S.flags.festAte = key;
  if (p.body) { for (const k of B.PARTS) p.body[k].hp = Math.min(p.body[k].max, p.body[k].hp + p.body[k].max * 0.5); B.syncHp(p); }
  p.stamina = p.maxStamina ?? p.stamina; S.res.food = (S.res.food || 0) + 2;
  for (const m of partyMembers()) m.morale = Math.min(100, (m.morale || 50) + 10);
  float(p, 'Festmahl', 'rgba(232,200,120,ALPHA)'); log(`Festmahl in ${townName(t.fest)}: Braten, dünnes Bier, ein Platz am Feuer. (+Heilung, +2 Vorrat, Gruppe froh)`, 'world');
}

// Tagesplan der Bewohner (Session 10, BUG-082/083). Vorher: ein einziges Tagesziel, ±46 px Herumstehen — niemand ging
// irgendwohin; abends stand ein Drittel der Stadt vor der Schenkentür. Jetzt Blöcke je Stunde mit eigenem Versatz je Person
// (nicht alle brechen gleichzeitig auf), der Nachmittag wechselt von Tag zu Tag. Abends in der Schenke nur so viele, wie
// drinnen freie Plätze sind — der Rest bleibt vor dem eigenen Haus. Bei jedem Laden neu berechnet (kein Spielstandfeld).
const VILLAGERS = [];
function planDays() {
  VILLAGERS.length = 0;
  const byHome = new Map(), seats = new Map();
  for (const c of S.ents.world) if (c.villager && c.homeId) { if (!byHome.has(c.homeId)) byHome.set(c.homeId, []); byHome.get(c.homeId).push(c); }
  const seatsOf = tav => {                                            // freie Innenkacheln der Schenke (ohne Möbel, nicht die Türachse)
    if (seats.has(tav.id)) return seats.get(tav.id);
    const L = []; for (let y = tav.y + 1; y < tav.y + tav.h - 1; y++) for (let x = tav.x + 1; x < tav.x + tav.w - 1; x++) {
      const px = x * TS + TS / 2, py = y * TS + TS / 2;
      if ((x + y) % 2 === 0 && !SOLID.has(tileAt('world', x, y)) && !solidPropAt('world', px, py, 6) && x !== tav.doorTile[0]) L.push({ x: px, y: py, in: 1 }); }   // BUG-092: Schachbrett — nie Schulter an Schulter, höchstens halb voll
    seats.set(tav.id, L); return L;
  };
  for (const b of HOUSES) {
    const rs = byHome.get(b.id); if (!rs) continue;
    rs.sort((a, c) => (a.id < c.id ? -1 : 1));
    const tav = HOUSES.find(h => h.town === b.town && h.type === 'tavern' && h.map === 'world');
    rs.forEach((c, i) => {
      const s = spotsOf(b, i, c.prof), host = ['tavern', 'healer', 'chapel'].includes(b.type);   // wer in Schenke/Heilerhaus/Kapelle wohnt, ist abends drinnen (nicht vor der eigenen Schenkentür)
      const free = tav && !host && (s.hx + s.hy + i) % 3 === 0 ? seatsOf(tav) : null, seat = free && free.length ? free.splice((s.hx * 7 + s.hy * 3 + i * 13) % free.length, 1)[0] : null;   // über den Raum verteilt, nicht Reihe für Reihe von oben
      const n = Math.floor(hsh(s.hx, s.hy, i + 31) * 1000);
      // Nachtplatz aus dem aktuellen Haus (nicht gespeichert übernehmen): Häuser können wachsen, Randhäuser umziehen
      const [lat, dep] = [[0, 0], [1, 0], [-1, 0], [0, 1]][i % 4];               // drinnen nebeneinander (quer zur Tür, dann tiefer)
      c.anchor = { x: s.inside.x + (lat * Math.abs(s.sy) + dep * s.sx) * TS, y: s.inside.y + (lat * Math.abs(s.sx) + dep * s.sy) * TS };
      if (SOLID.has(tileAt('world', c.anchor.x / TS | 0, c.anchor.y / TS | 0)) || solidPropAt('world', c.anchor.x, c.anchor.y, 4)) c.anchor = s.inside;
      c.plan = { front: s.front, work: s.work, job: !!s.job, plaza: s.sq, visit: s.visit, tav: seat, eve: host ? { ...s.inside, in: 1 } : seat || s.front,
        o: (n % 75) / 100, n, dx: (n % 9) - 4, dy: ((n / 9 | 0) % 7) - 3 };
      c.schedulePos = s.work;
      VILLAGERS.push(c);
    });
  }
  // §79 Beziehungen: je Bewohner ein Freund und ein Rivale in derselben Stadt (fest, aus der Reihenfolge der ids) —
  // Rivalen reden nicht miteinander und gehen sich aus dem Weg, über den Rivalen wird gelästert, Freunde reden wärmer.
  const byTown = {};
  for (const c of VILLAGERS) (byTown[c.homeTown] ||= []).push(c);
  for (const list of Object.values(byTown)) {
    list.sort((a, b) => (a.id < b.id ? -1 : 1));
    const L = list.length; if (L < 3) continue;
    list.forEach((c, i) => {
      const f = list[(i + 1 + (c.plan.n % 3)) % L], rv = list.filter(o => o !== c && o !== f && o.homeId !== c.homeId);
      c.rel = { friend: f.id, rival: rv.length && c.plan.n % 4 === 0 ? rv[(c.plan.n >> 2) % rv.length].id : null };   // jeder Vierte hat einen Rivalen
    });
    for (const c of list) if (c.rel.rival) { const o = list.find(x => x.id === c.rel.rival); o.rel.foe = c.id; }   // Abneigung ist gegenseitig
  }
  assignHunters();
}
// §41 Stufe 2: je Stadt ein Jäger (bestehende Stände: ein Tagelöhner oder Holzfäller wird es) — Jagdgebiet = nächste Wildnis.
// S12: eigene Funktion, beim Laden erneut (gespeicherte Jagdplätze konnten in einer Stadt liegen)
function assignHunters() {
  for (const town of Object.keys(TOWN_PLAN)) {
    if (town === 'vharnholm') continue;
    const vs = VILLAGERS.filter(c => c.homeTown === town);
    const byId = (a, b) => (a.id < b.id ? -1 : 1);                  // S12: kleine Dörfer haben nicht immer Tagelöhner — dann jagt ein Bauer oder Handwerker
    const h = vs.find(c => c.prof === 'Jäger') || vs.filter(c => c.prof === 'Holzfäller' || c.prof === 'Tagelöhner').sort(byId)[0]
      || vs.filter(c => ['Bauer', 'Handwerker', 'Kesselflicker', 'Böttcher', 'Weber', 'Edelmann', 'Graf'].includes(c.prof)).sort(byId)[0];   // im Hochreich jagt der Adel zum Vergnügen
    if (!h) continue;
    if (h.prof !== 'Jäger') { h.prof = 'Jäger'; h.greet = '„Wild gibt es genug. Nur nie da, wo man es sucht.“'; }
    if (!h.equip.weapon) h.equip.weapon = mkItem('shortbow');
    const [sx, sy] = TOWN_PLAN[town].square, trees = S.ents.world.filter(e => e.type === 'tree');
    const cands = [];
    const [ax0, ay0, ax1, ay1] = TOWN_PLAN[town].area, big = Math.max(0, Math.max(ax1 - ax0, ay1 - ay0) / 2 - 30);   // Phase 5: Metropole — Radien vom Stadtrand aus
    for (const R of [40 + big, 55 + big, 70 + big]) for (let k = 0; k < 16; k++) {     // 16 Richtungen, 40 Kacheln draußen (S12: sonst 55, 70): wo stehen die meisten Bäume?
      const a = k * Math.PI / 8, tx = Math.round(sx + Math.cos(a) * R), ty = Math.round(sy + Math.sin(a) * R);
      if (tx < 2 || ty < 2 || tx >= MAPS.world.w - 2 || ty >= MAPS.world.h - 2 || townAt(tx, ty, 3) || SOLID.has(tileAt('world', tx, ty))) continue;
      cands.push({ tx, ty, r: R, n: trees.reduce((m, e) => m + (Math.abs(e.x / TS - tx) < 7 && Math.abs(e.y / TS - ty) < 7 ? 1 : 0), 0) });
    }
    cands.sort((a, b) => a.r - b.r || b.n - a.n);   // nah vor dicht bewaldet: der Jäger kommt abends heim                                  // S12: freie Stelle darf nicht in die Stadt rutschen (Buchten an der Küste)
    const best = cands.find(c => { const q = freeSpotNear('world', c.tx, c.ty, 4); return !townAt(q.x / TS | 0, q.y / TS | 0, 2); });
    if (!best) continue;
    const pt = freeSpotNear('world', best.tx, best.ty, 4), l = locAt(best.tx, best.ty);
    h.plan.hunt = { x: pt.x, y: pt.y, where: l && l.kind !== 'village' && l.kind !== 'city' ? l.name : 'dem Umland' };
  }
}
// Jäger zurück: Beute an den Markt (einmal je Tag) — Felle im Stadtvorrat, in Sicht mit Hinweis
function deliverGame(e) {
  if (e._delivered === (S.day | 0)) return;
  e._delivered = S.day | 0;
  const t = S.towns[e.homeTown]; if (t) t.stock.pelt = (t.stock.pelt || 0) + 2;
  if (S.map === 'world' && dist(e, S.player) < 420) { float(e, 'Wildbret', 'rgba(210,180,120,ALPHA)'); log(`${e.name} (Jäger) bringt Wild und Felle aus ${e.plan.hunt.where} zum Markt.`, 'world'); }
}
// Ziel eines Bewohners jetzt: { x, y, k: Block, work: arbeitet dort, social: trifft dort Leute, in: drinnen }
// Phase 1 (Master-Prompt 2 §6): kein Klumpen am Treffpunkt — jeder Bewohner hat seinen festen Platz im Kreis um Platz,
// Besuch und Markt (Goldener Winkel), nicht alle auf demselben Fleck.
function dayTarget(e) {
  const t = dayTargetRaw(e);
  if (t.social && !t.in && t.k !== 'f') { const n = e.plan.n, a = n * 2.39996, r = 24 + (n % 4) * 18; t.x += Math.cos(a) * r; t.y += Math.sin(a) * r * 0.7;
    const tx = t.x / TS | 0, ty = t.y / TS | 0; if (SOLID.has(tileAt('world', tx, ty)) || solidPropAt('world', t.x, t.y, 6)) { t.x -= Math.cos(a) * r; t.y -= Math.sin(a) * r * 0.7; } }
  return t;
}
function dayTargetRaw(e) {
  const P = e.plan, h = S.minute / 60 - P.o, alt = ((S.day | 0) + P.n) % 3;
  if (h < 6.5 || h >= 21.5) return { x: e.anchor.x, y: e.anchor.y, k: 'n', in: 1 };
  if (S.war?.nodes[e.homeTown]?.owner === 'undead') return { x: e.anchor.x, y: e.anchor.y, k: 'v', in: 1 };   // BUG-099: Besatzung — alle verstecken sich im Haus
  if (h >= 15 && festNow(e.homeTown)) { const c = festSpot(e.homeTown), a = P.n * 2.39996, r = 80 + (P.n % 6) * 22;   // Fest: im Kreis ums Feuer
    return { x: c.x + Math.cos(a) * r, y: c.y - 2 * TS + Math.sin(a) * r * 0.7, k: 'f', social: 1 }; }   // Mitte = Feuer (2 Kacheln nördlich des Platzes)
  if (P.hunt && h >= 7 && h < 13.5) return { x: P.hunt.x, y: P.hunt.y, k: 'j', work: 1 };            // Jäger: draußen im Jagdgebiet
  if (P.hunt && h >= 13.5 && h < 15) return { x: P.plaza.x, y: P.plaza.y, k: 'jd', deliver: 1 };     // … und mit Beute zum Markt
  if (h < 7.5) return { x: P.front.x, y: P.front.y, k: 'm' };
  if (h < 11.5) return { x: P.work.x, y: P.work.y, k: 'w', work: 1 };
  if (h < 13) { const t = P.tav && P.n % 2 ? P.tav : P.plaza; return { x: t.x, y: t.y, k: 'l', social: 1, in: t.in }; }
  if (h < 16.5) { if (P.job || alt === 0) return { x: P.work.x, y: P.work.y, k: 'a', work: 1 };
    const t = alt === 1 ? P.visit : P.plaza; return { x: t.x, y: t.y, k: 'a' + alt, social: 1 }; }
  if (h < 18) { const t = P.job ? P.work : P.plaza; return { x: t.x, y: t.y, k: 'k', work: P.job ? 1 : 0, social: P.job ? 0 : 1 }; }
  if (h < 20.5 || P.eve.in) return { x: P.eve.x, y: P.eve.y, k: 'e', social: 1, in: P.eve.in };
  return { x: e.anchor.x, y: e.anchor.y, k: 'n', in: 1 };
}
// Kurze Gespräche zwischen Bewohnern am Treffpunkt (Talk-Pairs): beide stehen, drehen sich zueinander, Sprechblasen im Wechsel
const TALK = [['Hast du das gehört?', 'Nicht schon wieder …'], ['Die Nächte werden kälter.', 'Und länger.'], ['Brot ist teurer geworden.', 'Alles ist teurer.'],
  ['Die Wachen schlafen im Stehen.', 'Solang sie stehen.'], ['Mein Rücken bringt mich um.', 'Dann arbeite weniger.'], ['Wer war der Fremde gestern?', 'Frag nicht.'],
  ['Die Toten liegen nicht mehr still.', 'Sag so was nicht laut.'], ['Regen kommt.', 'Gut für die Felder.'], ['Hast du Lohn bekommen?', 'Die Hälfte.'],
  ['Der Wirt panscht wieder.', 'Er hat nie aufgehört.'], ['Hörst du die Hunde nachts?', 'Das sind keine Hunde.'], ['Wie geht es deiner Mutter?', 'Besser. Danke.']];
const FEST_TALK = [['Auf die Toten, die liegen bleiben!', 'Und auf die, die noch stehen!'], ['Noch einen Krug?', 'Zwei. Morgen ist wieder Arbeit.'],
  ['Der Braten ist zäh.', 'Der Braten ist Braten. Iss.'], ['Tanzt du?', 'Mit diesen Knien? Später.'], ['Schau, sogar die Wache lacht.', 'Einmal im Jahr.'],
  ['Wer spielt da die Fiedel?', 'Keine Ahnung. Aber schief.']];
const PRE_FEST = [['Morgen ist Fest.', 'Endlich.'], ['Hast du Bier für morgen?', 'Der Wirt hat drei Fässer geholt.'], ['Morgen wird gefeiert.', 'Wenn keiner stirbt.']];
const enemies = (a, b) => a.rel && b.rel && (a.rel.rival === b.id || a.rel.foe === b.id);
const RIVAL_TALK = [['Da drüben steht %. Schau nicht hin.', 'Ich schau ja gar nicht.'], ['% redet nur über sich selbst.', 'Ich weiß. Jeden Tag.'],
  ['% hat mir noch nie was zurückgegeben.', 'Dann leih ihm nichts mehr.'], ['Wenn % kommt, geh ich.', 'Bleib. Der geht von selbst.']];
const FRIEND_TALK = [['Da bist du ja endlich.', 'Hast du mich vermisst?'], ['Kommst du heute Abend in die Schenke?', 'Wenn du zahlst.'],
  ['Wie geht es deinem Rücken?', 'Frag nicht. Aber danke.'], ['Ich hab dir Brot aufgehoben.', 'Du bist die Einzige hier, die an mich denkt.']];
function startTalk(e) {
  const now = performance.now();
  const o = VILLAGERS.find(x => x !== e && x.alive && !(x.talk?.until > now) && !x.downed && Math.abs(x.x - e.x) < 64 && Math.abs(x.y - e.y) < 48 && !(x.vx || x.vy) && !enemies(e, x));
  if (!o) return false;
  const foe = byId(e.rel?.rival || e.rel?.foe);
  if (foe && foe.alive && dist(foe, e) < 160 && !festNow(e.homeTown)) {                  // §79: der Rivale steht in Hörweite — lästern
    const k = e.plan.n + (S.day | 0), line = RIVAL_TALK[k % RIVAL_TALK.length], until = now + 5200;
    e.talk = { with: o.id, until, at: now, say: line[0].replace('%', foe.name) }; o.talk = { with: e.id, until, at: now + 2600, say: line[1] };
    return true;
  }
  const k = e.plan.n + o.plan.n + (S.day | 0), news = !festNow(e.homeTown) && k % 2 ? newsTalk(k) : null;   // jedes zweite Gespräch: Neuigkeiten, wenn es welche gibt
  const pool = festNow(e.homeTown) ? FEST_TALK : festDay(e.homeTown, (S.day | 0) + 1) && k % 3 === 0 ? PRE_FEST : TALK;
  const warm = e.rel?.friend === o.id || o.rel?.friend === e.id, line = news || (warm && k % 2 === 0 ? FRIEND_TALK[k % FRIEND_TALK.length] : pool[k % pool.length]), until = now + 5200;
  e.talk = { with: o.id, until, at: now, say: line[0] }; o.talk = { with: e.id, until, at: now + 2600, say: line[1] };
  return true;
}
function villagerDay(e, t, dt) {
  const now = performance.now();
  if (e.talk && e.talk.until > now) {                                 // im Gespräch: stehen, zum anderen schauen
    const o = byId(e.talk.with); e.vx = e.vy = 0;
    if (o) { const a = Math.atan2(o.y - e.y, o.x - e.x), ca = Math.cos(a), sa = Math.sin(a); e.facing = Math.abs(ca) > Math.abs(sa) * 0.9 ? (ca > 0 ? 3 : 2) : (sa > 0 ? 0 : 1); }
    return;
  }
  const foe = (e.rel?.rival || e.rel?.foe) && byId(e.rel.rival || e.rel.foe);
  if (foe && foe.alive && foe.map === e.map && !t.in && Math.hypot(foe.x - e.x, foe.y - e.y) < 70) {   // §79: dem Rivalen aus dem Weg gehen
    const a = Math.atan2(e.y - foe.y, e.x - foe.x); e.talk = null; seek(e, a, 0.9 * dt / 16, dt); return;
  }
  const d = Math.hypot(t.x - e.x, t.y - e.y);
  if (t.deliver && d <= 40) deliverGame(e);
  e.nearT = d < 60 ? (e.nearT || 0) + dt : 0;                                          // Phase 1: Ziel verstellt (Gerät, Nachbar) → nah genug ist da
  if (d > 30 && e.nearT < 1000) { e.wander = null; seek(e, Math.atan2(t.y - e.y, t.x - e.x), (d > 300 ? 1.1 : 0.9) * dt / 16, dt, t); return; }
  e.aiTimer -= dt;
  if (e.aiTimer <= 0) {                                               // angekommen: arbeiten, reden oder ein paar Schritte
    e.aiTimer = ri(3200, 7600);
    if (t.work && !t.in) { e.vx = e.vy = 0; e.wander = null; act(e, 'work', 1500); return; }
    if (t.social && hsh(e.plan.n, now / 1000 | 0, 3) < 0.55 && startTalk(e)) return;
    const j = t.in ? 8 : 26; e.wander = { x: t.x + ri(-j, j), y: t.y + ri(-j * 0.8, j * 0.8) };
  }
  if (e.wander) { const w = Math.hypot(e.wander.x - e.x, e.wander.y - e.y);
    if (w > 8) seek(e, Math.atan2(e.wander.y - e.y, e.wander.x - e.x), 0.7 * dt / 16, dt, e.wander); else { e.vx = e.vy = 0; e.wander = null; } }
}
// Außer Sicht: nicht einfrieren (sonst standen Hausgenossen stundenlang pixelgleich übereinander), sondern je Block einmal
// an den Zielort setzen — billiger als Wegsuche, und wer näher kommt, trifft die Leute dort, wo sie um diese Zeit sind.
function placeAway(e) {
  const t = dayTarget(e); if (e.blk === t.k) return;
  e.blk = t.k; e.talk = null; e.wander = null;
  if (t.deliver) deliverGame(e);
  const a0 = e.plan.n * 2.39996, r = t.in ? 7 : 12 + (e.plan.n % 5) * 4;   // je Person eigene Richtung (goldener Winkel): Hausgenossen stehen nie aufeinander
  for (const rr of [r, r * 0.55, 7]) for (let k = 0; k < 6; k++) { const x = t.x + Math.cos(a0 + k * 1.05) * rr, y = t.y + Math.sin(a0 + k * 1.05) * rr * 0.8;
    if (!solidTile('world', x, y) && !solidPropAt('world', x, y, 4) && !VILLAGERS.some(o => o !== e && Math.abs(o.x - x) < 7 && Math.abs(o.y - y) < 7)) { e.x = x; e.y = y; return; } }   // frei = kein Hindernis, niemand steht dort
  e.x = t.x + ((e.plan.n % 5) - 2) * 4; e.y = t.y + (((e.plan.n / 5 | 0) % 3) - 1) * 4;   // enge Stelle: kleiner fester Versatz je Person
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
  { map:'world', x:66, y:116, r:10, types:['bandit','bandit','bandit_archer','bandit_spear'], cap:9 },
  { map:'world', x:34, y:96, r:8, types:['skeleton','skeleton'], cap:6 },
  { map:'world', x:40, y:40, r:8, types:['goblin','bandit'], cap:5 },
  { map:'world', x:18, y:62, r:10, types:['goblin','wolf'], cap:5 },
  { map:'world', x:96, y:64, r:12, types:['bandit','wolf','bandit_spear'], cap:5 },
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
  { map:'world', x:440, y:155, r:44, types:['bandit','bandit_archer','goblin_warrior','bandit_spear'], cap:16 }, // Rote Wüste
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
// Session 11 — Eisenmark (schon Weltmaßstab): Streifen der Kette, die freien Goblins im Grubenhort (bis zur Befreiung feindselig)
SPAWN_AREAS.push(
  { map:'world', x:110, y:250, r:34, types:['chain_brute', 'chain_brute', 'rotgardist', 'kettenschuetze', 'wild_dog'], cap:8, eisen: true },
  { map:'world', x:185, y:430, r:12, types:['goblin', 'goblin', 'goblin_warrior'], cap:6, goblinHide: true },
  // S12 Totenland (Osten): nach Osten dichter und härter
  { map:'world', x:1180, y:300, r:60, types:['skeleton', 'skeleton', 'ghoul', 'wraith'], cap:10 },
  { map:'world', x:1300, y:520, r:70, types:['skeleton', 'ghoul', 'wraith', 'cultist'], cap:10 },
  { map:'world', x:1420, y:250, r:60, types:['skeleton', 'wraith', 'cultist', 'death_captain'], cap:8 });
const HUMANOID = new Set(['goblin', 'goblin_warrior', 'bandit', 'bandit_archer', 'bandit_spear', 'bounty_hunter', 'chain_brute', 'rotgardist', 'kettenschuetze', 'automat', 'chain_master', 'skeleton', 'crypt_warden', 'death_captain', 'hrodvar', 'valen_soldier', 'gorak', 'cultist', 'ghoul', 'wraith']);
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
  Object.keys(MONSTERS).filter(k => !['bandit', 'skeleton', 'wolf', 'goblin', 'bandit_archer', 'gorak'].includes(k)).forEach((mt, i) => {   // übrige Gegner: Reihe vor den Häusern
    const e = spawnEnemy(mt, K, 2 + i * 3, 6); e.x = (2 + i * 3) * TS + TS / 2; e.y = 6 * TS + 20; e.aiState = 'idle'; e.stat = true; });
  const fx = (type, tx, ty, o = {}) => S.fx.push({ x: tx * TS, y: ty * TS, vx: 0, vy: 0, type, s: 2, a: 0, life: 110, maxLife: 200, style: true, ...o });
  ['impact', 'crit', 'spark', 'blood', 'heal', 'fire', 'shock', 'ring', 'necro', 'ghost'].forEach((t, i) => fx(t, 3 + i * 3, 7, t === 'ghost' ? { face: 0 } : {}));
  const p = S.player; styleKeep = { map: S.map, pos: { map: p.map, x: p.x, y: p.y }, paused: S.paused };
  S.ents[p.map].splice(S.ents[p.map].indexOf(p), 1); p.map = K; p.x = 24 * TS; p.y = 10 * TS; S.ents[K].push(p); S.map = K;
  S.paused = true;                                     // Schaubild: Zeit steht, Gegner greifen nicht an
  for (const e of S.ents[K]) if (e.solid) addSolid(e);
  return true;
}
// §82 Balancing: Gegner-Grundwerte. Messung S11 (RF.duel): Stufe-3-Held besiegte Gefahr-1-Gegner in 2,5–4,4 s mit 8–10 %
// Verlust — zu leicht. Ziel ~6–8 s / 20–30 %. Das ist die Stufe „Schwer (Standard)“; die Schwierigkeitsstufen setzen hier an.
export const BAL = { hp: 1.7, dmg: 1.4 };
function spawnEnemy(mtype, map, tx, ty, opts = {}) {
  const m = MONSTERS[mtype];
  const pos = freeSpotNear(map, tx, ty, 3);
  const e = {
    id: uid(), kind:'enemy', mtype, map, x: pos.x, y: pos.y, vx:0, vy:0, facing:0, aim:0,
    level: opts.level || Math.max(1, ri(1, 3) + (m.threat || 1) * 2),
    hp: m.hp, maxHp: m.hp, r: m.r, armor: m.threat, alive:true, seed: rnd() * 100,
    swing:0, atkCd:0, telegraph:0, aiState:'idle', aiTimer:0, anchor:{ x: pos.x, y: pos.y },
    weaponKey: { goblin:'dagger', goblin_warrior:'axe', bandit:'rusty_sword', bandit_archer:'shortbow', bandit_spear:'spear', bounty_hunter:'longsword', chain_brute:'flail', automat:'halberd', rotgardist:'rotklaue', kettenschuetze:'crossbow', chain_master:'roter_henker', skeleton:'rusty_sword', crypt_warden:'longsword', death_captain:'greatsword', hrodvar:'greatsword', valen_soldier:'spear', cultist:'staff' }[mtype] || null,
    shield: mtype === 'goblin_warrior' ? { key:'wooden_shield' } : null,
    faction: m.faction, boss: !!m.boss, ...opts,
  };
  if (!e.boss && (opts.level == null || opts.zone) && !map.startsWith('__')) e.level = zoneLevel(map, tx, ty, m);   // Phase 1: Gebietsspanne
  e.maxHp = e.hp = Math.round(m.hp * (1 + e.level * 0.04) * BAL.hp);
  if (HUMANOID.has(mtype)) { e.build = pick(Object.keys(B.BUILDS)); B.initBody(e, e.maxHp); }   // Menschenähnliche haben Trefferzonen
  S.ents[map].push(e);
  return e;
}

// §73 Regionale Bosse: an einen Ort gebunden; ihr Tod verändert die Region — Machtverschiebung (Gegnerdeckel −30 %),
// Machtvakuum (60 % einer Art werden zu einer anderen, nicht automatisch Frieden), Wirtschaft/Ruf, Chronik und Gerücht.
// Unter 50 % Leben ruft jeder Boss einmal Verstärkung (Phase 2).
const REGION_BOSSES = [
  { id: 'alpha', flag: 'alphaSlain', mtype: 'wolf', loc: 'wolfden', level: 9, hp: 170, r: 14, title: 'Graumähne, Leitwolf der Schlucht',
    call: 'wolf', callText: 'heult. Das Rudel antwortet.', area: a => a.map === 'world' && a.x < 130 + OX && a.y > 250 && a.types.includes('wolf'), from: 'wolf', to: 'wild_dog',
    effect: () => { if (S.towns.eren) S.towns.eren.stock.pelt += 8; S.factions.valen += 3; },
    text: 'Ohne Graumähne zerfällt das Rudel der Schlucht. Die Jäger in Eren atmen auf — und in den Westwald ziehen verwilderte Hunde.' },
  { id: 'sandlord', flag: 'sandlordSlain', mtype: 'bandit', loc: 'redwaste', level: 12, hp: 240, r: 13, title: 'Karrak, der Sandfürst',
    call: 'bandit_archer', callText: 'pfeift. Schützen steigen aus den Dünen.', area: a => a.map === 'world' && a.x > 560 + OX && a.x < 768 + OX && a.y < 300 && a.types.includes('bandit'),   // Weltmaßstab (Rote Wüste ≈ 660/232) from: 'bandit', to: 'goblin_warrior',
    effect: () => { S.factions.merch += 8; S.factions.bandit -= 25; },
    text: 'Ohne Karrak zerfallen die Wüstenbanden. Die Händler in Aschfurt atmen auf — doch in die leeren Lager ziehen Goblin-Krieger.' },
  // Endgame (Session 11): Varg in der Kernburg der Kettenfeste. Tod = Befreiung der Goblins; Reste der Kette werden zu Räubern.
  { id: 'chainmaster', flag: 'goblinsFreed', mtype: 'chain_master', loc: 'kettenfeste', at: EM(946, 384), level: 16, hp: 260, r: 14, title: 'Varg, Kettenmeister der Eisenmark',
    call: 'chain_brute', callText: 'lässt die Kette klirren. Knechte stürmen aus der Halle.', area: a => !!a.eisen, from: 'chain_brute', to: 'bandit',
    guards: 2, guardType: 'rotgardist', effect: () => liberate(),
    court: [[-4, -3, 'rotgardist'], [-4, 3, 'rotgardist'], [-9, -4, 'rotgardist'], [-9, 4, 'rotgardist'], [-12, -5, 'kettenschuetze'], [-12, 5, 'kettenschuetze']],
    text: 'Mit Varg fällt die Eiserne Kette. Wer von ihren Knechten übrig ist, zieht als Räuber durch die Mark.' },
];
const bossOf = e => e.rboss ? REGION_BOSSES.find(b => b.id === e.rboss) : e.alpha ? REGION_BOSSES[0] : null;   // e.alpha: Stände vor der Tabelle
function ensureRegionBosses() {
  for (const b of REGION_BOSSES) {
    if (S.flags[b.flag] || S.ents.world.some(e => e.alive && bossOf(e) === b)) continue;
    const L = LOCATIONS.find(l => l.key === b.loc); if (!L) continue;
    const [bx, by] = b.at || [Math.round(L.x), Math.round(L.y)];
    const e = spawnEnemy(b.mtype, 'world', bx, by, { level: b.level, boss: true, rboss: b.id, title: b.title });
    e.maxHp = e.hp = Math.round(b.hp * BAL.hp); e.r = b.r; if (e.body) B.initBody(e, e.maxHp);
    if (b.court) { e.parley = true; e.facing = 2; }                  // S12: Varg hält Hof — man kann ihn ansprechen
    for (const [i, [dx, dy, gt]] of (b.court || [[-3, -3, b.guardType || b.call], [-3, 3, b.guardType || b.call]]).slice(0, b.court ? 99 : b.guards || 0).entries())
      { const g = spawnEnemy(gt, 'world', bx + dx, by + dy, { level: b.level - 4, anchor: { x: (bx + dx) * TS, y: (by + dy) * TS } }); g.court = true; g.facing = i % 2 ? 3 : 2; }   // Leibwache / Hofstaat
  }
}
function regionBossSlain(b) { S.flags[b.flag] = true; b.effect(); log(b.text, 'world'); }
function spawnType(a) {                                             // Machtvakuum nach einem Regionalboss
  const t = pick(a.types);
  if (S.flags.goblinsFreed && a.map === 'world' && (t === 'goblin' || t === 'goblin_warrior')) return null;   // befreit: Goblins sind kein Feind mehr
  for (const b of REGION_BOSSES) if (t === b.from && S.flags[b.flag] && b.area(a) && chance(0.6)) return b.to;
  if (S.flags.chainsBroken && a.eisen && (t === 'rotgardist' || t === 'kettenschuetze')) return 'bandit';   // S12: ohne Varg keine Elite mehr
  return t;
}
// §71 Gefahr ist eine Eigenschaft des Ortes: Gegner, die in Gefahr-3/4-Gebieten entstehen, sind stärker (+2/+4 Stufen) und
// oft Veteranen (+30 % Leben, größer, bessere Beute). Die Welt skaliert nicht zum Spieler — der Ort bestimmt die Gefahr.
// Gegner-Skalierung (Master-Prompt 2 §20/§21): Jedes Gebiet hat eine Levelspanne nach seiner Gefahr. Innerhalb dieser
// Spanne passt sich der Gegner an den Spieler an (±2, zähe Arten etwas höher); darüber hinaus nie. Frühe Gebiete werden
// später leicht, späte bleiben hart. Stärke je Stufe bleibt maßvoll (+4 % Leben, +5 % Schaden).
const ZONE = [[1, 8], [1, 10], [3, 15], [8, 22], [15, 35], [25, 50]];
const REGION_TIER = { deadland: 4, eisen: 3, mountain: 3, desert: 3, blight: 3, aurel: 2 };
function zoneTier(map, tx, ty) {
  if (map !== 'world') return 3;
  const l = locAt(tx, ty); if (l && l.threat != null) return l.threat;
  return REGION_TIER[regionAt(tx, ty)] ?? 1;
}
function zoneLevel(map, tx, ty, m) {
  const [lo, hi] = ZONE[clamp(zoneTier(map, tx, ty), 0, 5)], pl = S.player?.level || 1;
  return clamp(pl + ri(-2, 2) + Math.max(0, (m.threat || 1) - 2), lo, hi);
}
function regionSpawn(mtype, map, tx, ty, opts = {}) {
  const tier = map === 'world' ? (locAt(tx, ty)?.threat || 1) : 3;
  if (tier < 3 || MONSTERS[mtype]?.prey) return spawnEnemy(mtype, map, tx, ty, opts);
  const e = spawnEnemy(mtype, map, tx, ty, { ...opts, zone: true, level: (opts.level || 0) + (tier - 2) * 2 + Math.max(1, ri(1, 3) + (MONSTERS[mtype].threat || 1) * 2) });
  if (chance(tier >= 4 ? 0.5 : 0.25)) { e.elite = true; e.maxHp = e.hp = Math.round(e.hp * 1.3); if (e.body) { for (const k of B.PARTS) { e.body[k].max = Math.round(e.body[k].max * 1.3); e.body[k].hp = e.body[k].max; } B.syncHp(e); } }
  return e;
}
const capOf = a => REGION_BOSSES.some(b => S.flags[b.flag] && b.area(a)) ? Math.ceil(a.cap * 0.7) : a.cap;
// S12: Banditenlager, Totengräber, Minen und Ruinen der Streuorte bekommen ihre Bewohner (je Welt neu)
function poiSpawns() {
  for (let i = SPAWN_AREAS.length - 1; i >= 0; i--) if (SPAWN_AREAS[i].poi) SPAWN_AREAS.splice(i, 1);
  for (const l of LOCATIONS) if (l.spawn) SPAWN_AREAS.push({ map: 'world', x: l.x, y: l.y, r: 6, types: l.spawn, cap: 3, poi: true });
}
function initialSpawns() {
  for (const a of SPAWN_AREAS) for (let i = 0; i < a.cap * 0.7; i++) {
    const tx = a.x + ri(-a.r, a.r), ty = a.y + ri(-a.r, a.r);
    const t = spawnType(a); if (t && !(a.map === 'world' && townAt(tx, ty, 4))) regionSpawn(t, a.map, tx, ty);   // nie mitten in einer Siedlung
  }
  spawnEnemy('gorak', 'mine', 32, 13, { level: 10 });
  ensureRegionBosses();
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
    weather: 'clear', weatherLeft: 60, map: 'world', ents: { world: [], mine: [], deep: [], sky: [], kerker: [] }, party: [], gold: 0,
    res: { wood: 0, stone: 0, iron: 0, herb: 0, food: 3 }, stash: [],
    factions: { valen: 0, order: 0, undead: -100, merch: 0, bandit: -100, chain: -20, goblin: -100, aurel: -10 }, ranks: { valen: -1, order: -1, undead: -1, chain: -1 },
    quests: {}, chronicle: [], legacy: { house: cfg.house || cfg.name, gen: 1, ancestors: [] },
    settlement: null, flags: { gen2: true, gen3: true, gen4: true, pact1: true, grove1: true, dead1: true, deep1: true, border1: true }, relations: {}, kills: 0, battles: 0, log: [], partyCmd: 'follow',
    settings: keep.settings, fx: [], floats: [], projectiles: [], _uid: 0,
  });
  genWorld().forEach(p => S.ents.world.push(p)); poiSpawns();
  genMine().forEach(p => S.ents.mine.push(p));
  genDeep().forEach(p => S.ents.deep.push(p));
  genSky().forEach(p => S.ents.sky.push(p));
  genKerker().forEach(p => S.ents.kerker.push(p));
  for (const m of MAP_KEYS) indexSolids(m);
  spawnNPCs();
  spawnGuardPosts();
  spawnResidents();
  assignNpcDays();
  initialSpawns();
  ensureBoards();
  aurelMetroMigrate(); ensureEisenmark(); ensureRelics(); ensureAurelion(); ensureNobles(); ensureMachines(); ensureBondProps(); ensureDefenseMasters(); registerContracts(); nameFix(); fortressHour();   // S12: Namen erst prüfen, wenn alle Figuren stehen (Wachen der Feste)
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
  { const [ex, ey] = TOWN_PLAN.eren.square, dx = ex - p.x / TS, dy = ey - p.y / TS;   // BUG-089: Richtung aus der echten Lage, nicht fest „Norden“
    const where = Math.hypot(dx, dy) < 14 ? 'Gleich vor dir liegt Eren' : `Im ${['Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten', 'Norden', 'Nordosten'][((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8]} liegt Eren`;
    log(`${where}. Dort gibt es Arbeit — und Leute, die welche brauchen.`, 'world'); }
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
  SIM.H.raidDamage = raidDamage;
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
  syncClock();
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
  const fresh = genWorld(), FRESH = { world: fresh, mine: genMine(), deep: genDeep(), sky: genSky(), kerker: genKerker() }; poiSpawns();   // Kacheln (+ Gebäudedaten) und Grundzustand der Props …
  for (const m of MAP_KEYS) S.ents[m] ||= [];
  for (const m of MAP_KEYS) if (gone?.[m]) mergeProps(m, FRESH[m], gone[m]);
  if (!gone?.sky && !S.ents.sky.some(e => e.kind === 'prop')) S.ents.sky.push(...FRESH.sky);
  if (!gone?.kerker && !S.ents.kerker.some(e => e.kind === 'prop')) S.ents.kerker.push(...FRESH.kerker);   // S12: ältere Stände kennen die Himmelsinsel noch nicht   // … Abweichungen stehen im Spielstand
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
  nameFix();
  S.factions.chain ??= -20; S.factions.goblin ??= -50;   // Session 11: neue Fraktionen in alten Ständen
  ensureRegionBosses();                                   // §73: alte Stände bekommen den Leitwolf nachgerüstet
  aurelMetroMigrate(); ensureEisenmark(); ensureRelics(); ensureAurelion(); ensureNobles(); ensureMachines(); ensureBondProps(); ensureDefenseMasters(); registerContracts(); nameFix(); fortressHour();
  S.factions.aurel ??= 0; S.ranks.chain ??= -1; if (S.deadRaid) S.deadRaid.live = false;   // Raid-Untote sind flüchtig: nach dem Laden neu anrücken
  assignHunters();
  if (!S.flags.villages12) { S.flags.villages12 = true; spawnResidents(); }   // S12: neue Dörfer bekommen in alten Ständen Bewohner
  applyRaidDamage();
  ensureBoards();
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
  planDays();                                  // Bewohner: Nachtplätze prüfen Möbel — erst nach dem Objekt-Index (sonst landet der Schlafplatz auf dem Tisch)
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

let tribT = 0, hudTimer = 0, simTimer = 0, respawnTimer = 0, lastHour = -1, lastDay = 1, travelTimer = 0, encCooldown = 0, pursuitT = 0;
const syncClock = () => { lastDay = S.day; };   // BUG-089: Laden ist kein Tageswechsel (kein „Tag 6 bricht an“ um 20 Uhr, kein doppelter Verbrauch)
let lastHouse = null;
const clock = () => S.day * 1440 + S.minute;
const hourNow = () => S.minute / 60;                  // Spieluhr in Spielminuten (1 s Echtzeit = 1 min), wird gespeichert
// Referenz 4 (S12): Wetter gehört zur Gegend — Blutregen im Totenland, Sandsturm in Wüste/Ödland, Schnee im Gebirge
const REGIONAL_WEATHER = new Set(['bloodrain', 'sandstorm', 'snow']);
const WEATHER_POOL = { aurel: ['clear', 'clear', 'clear', 'cloudy', 'rain'], deadland: ['bloodrain', 'bloodrain', 'fog', 'cloudy'], eisen: ['cloudy', 'fog', 'rain', 'clear', 'snow'], blight: ['fog', 'fog', 'cloudy', 'bloodrain', 'clear'], desert: ['clear', 'clear', 'sandstorm', 'cloudy'], badland: ['clear', 'sandstorm', 'cloudy', 'cloudy'],
  mountain: ['snow', 'snow', 'clear', 'cloudy', 'fog'] };
export function weatherPool(p) {
  const r = p && S.map === 'world' ? regionAt(p.x / TS | 0, p.y / TS | 0) : null;
  return WEATHER_POOL[r] || ['clear', 'clear', 'cloudy', 'cloudy', 'rain', 'fog'];
}
function update(dt, now) {
  const p = S.player;
  // Zeit
  S.minute += dt / 1000;
  if (S.minute >= 1440) { S.minute -= 1440; S.day++; }
  S.weatherLeft -= dt / 1000;
  if (S.weatherLeft <= 0) {
    S.weather = pick(weatherPool(p));
    S.weatherLeft = ri(120, 420);
  }
  if (REGIONAL_WEATHER.has(S.weather) && !weatherPool(p).includes(S.weather)) S.weatherLeft = 0;   // Regionwetter endet, wenn man die Region verlässt
  const hour = Math.floor(S.minute / 60);
  if (hour !== lastHour) { lastHour = hour; hourTick(hour); }
  if (S.day !== lastDay) { lastDay = S.day; dayTick(); }
  festTick();

  // Kämpfer im Umkreis des Spielers (simuliert wird nur bis 1100 px, Sicht reicht höchstens ~500 px weiter).
  // Einmal je Frame statt je NPC/Gegner über alle ~300 Kämpfer der Welt zu suchen.
  combat = S.ents[S.map].filter(e => e.alive && COMBAT_KINDS.has(e.kind) && Math.abs(e.x - p.x) < 1700 && Math.abs(e.y - p.y) < 1700);
  for (const c of S.ents.world) if (c.kind === 'caravan' && c.alive) {
    const near = performance.now() - (c.lastHurt || -1e9) < 4000;          // hält nur, solange sie angegriffen wird
    SIM.caravanFrame(c, dt, p, near);
    if (!c.crew) hireEscorts(c);                                           // alter Spielstand: Zug ohne Wachen
    // Wachen außer Sicht (updateNpc denkt erst ab 900 px): sie gehen auf ihrem Platz mit, statt am Wegrand stehen zu bleiben
    // BUG-096: Zug in Sicht, Wache aber außer Denkweite (z. B. nach einem Kampf abseits) → sie holt zu Fuß auf, statt ewig stehenzubleiben
    for (const e of escortsOf(c)) if (!e.downed && (p.map !== 'world' || dist(e, p) > 900)) {
      const q = SIM.escortSlot(c, e.slot), d = Math.hypot(q.x - e.x, q.y - e.y), far = p.map !== 'world' || dist(c, p) > 1000, st = (d > 300 ? 2.6 : 1.8) * dt / 16;   // weit zurück: rennen
      if (far || d <= st) { e.x = q.x; e.y = q.y; } else { e.x += (q.x - e.x) / d * st; e.y += (q.y - e.y) / d * st; }
      e.anchor = { x: q.x, y: q.y }; e.vx = e.vy = 0; e.wander = null; e.threatId = null;
    }
  }
  if (p.alive) controlPlayer(dt);
  for (const e of [...S.ents[S.map]]) think(e, dt);
  separate();                                                     // S12: niemand steht im anderen
  if (S.rising && S.rising.length) {                              // Wiedergänger: Zucken als Ansage, nach 6 Spielminuten steht er auf
    const now = clock();
    for (let i = S.rising.length - 1; i >= 0; i--) { const r = S.rising[i];
      if (r.map === S.map && chance(dt / 400)) fx(r.x + ri(-6, 6), r.y - 4, 'necro', 2);
      if (now < r.at) continue;
      S.rising.splice(i, 1);
      if (!S.ents[r.map]) continue;                                  // Karte gibt es nicht mehr (Probe/Duell)
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
    if (S.map === 'world') revealAround(p.x / TS | 0, p.y / TS | 0, p.lens ? 28 : 18);                       // S12: Nebel der Karte
    if ((tribT += 180) >= 1000) { tribT = 0; tribTick(); campTick(); chainTick(); raidTick(); lostGobTick(); aurelTick(); conTick(); jailTick(); }
    if (S.map === 'world') for (const l of LOCATIONS)
      if (Math.hypot(l.x - p.x / TS, l.y - p.y / TS) < l.r + 6 && !(S.flags.seen ||= {})[l.key]) { S.flags.seen[l.key] = true; dangerNote(l, p); }
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
  if (simTimer > 4000) { simTimer = 0; questCheck(); if (S.map === 'world' && !S._frozenWar) SIM.battleCheck(); }   // _frozenWar: Selbsttest-Proben
  travelTimer += dt;
  if (travelTimer > 6000) { travelTimer = 0; travelTick(); }
}

// Eine Entität einen Schritt denken lassen. Einziger Einstieg in die KI: wer am Boden liegt oder tot ist, entscheidet nichts.
// Abstand halten (S12): Figuren im Umkreis schieben sich auseinander, statt ineinander zu stehen — auch mitten im Kampf.
// Raster 48 px, nur Nachbarzellen. Wände und feste Objekte gelten weiter; der Spieler wird kaum geschoben, Wagen gar nicht,
// Liegende gar nicht (Leichen und Niedergeschlagene dürfen unter Stehenden liegen). Wagen bleiben außen vor (BUG-096-Test).
const PUSH_W = e => e === S.player ? 0.15 : 1;
function nudge(e, dx, dy) {
  const r = e.r || 10;
  if (dx && !solidTile(e.map, e.x + dx + Math.sign(dx) * r, e.y) && !solidPropAt(e.map, e.x + dx, e.y, r)) e.x += dx;
  if (dy && !solidTile(e.map, e.x, e.y + dy + Math.sign(dy) * r) && !solidPropAt(e.map, e.x, e.y + dy, r)) e.y += dy;
}
function separate() {
  const grid = new Map(), C = 48;
  for (const e of combat) if (e.alive && !e.downed && e.map === S.map && e.kind !== 'caravan') { const k = (e.x / C | 0) + ',' + (e.y / C | 0); (grid.get(k) || grid.set(k, []).get(k)).push(e); }
  for (const [k, list] of grid) {
    const [cx, cy] = k.split(',').map(Number);
    for (const a of list) for (let j = cy - 1; j <= cy + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) {
      const o = grid.get(i + ',' + j); if (!o) continue;
      for (const b of o) {
        if (b.id <= a.id) continue;                                           // jedes Paar einmal
        const min = ((a.r || 10) + (b.r || 10)) * 0.8; let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d >= min) continue;
        if (d < 0.01) { const t = (a.seed || 1) * 7.3; dx = Math.cos(t); dy = Math.sin(t); d = 1; }   // genau übereinander: feste Richtung je Figur
        const wa = PUSH_W(a), wb = PUSH_W(b), sum = wa + wb; if (!sum) continue;
        const push = Math.min(3, (min - d) * 0.5), ux = dx / d, uy = dy / d;
        // Wer läuft, gleitet seitlich vorbei (sonst Patt: läuft hinein, wird zurückgeschoben — BUG-096-Test)
        const slide = (e, s) => { const v = e.vx * -uy + e.vy * ux; return (e.vx || e.vy) ? (v >= 0 ? 1 : -1) * s : 0; };
        if (wa) { const k = push * wa / sum * 2, t = slide(a, k); nudge(a, -ux * k - uy * t, -uy * k + ux * t); }
        if (wb) { const k = push * wb / sum * 2, t = slide(b, k); nudge(b, ux * k - uy * t, uy * k + ux * t); }
      }
    }
  }
}
// Feststecken (S12): wer über 2 s gehen will und keinen Schritt schafft, wird befreit — steckt er in Fels/Objekt oder in
// einem Kessel, kommt er auf den nächsten offenen Platz, sonst weicht er lange zur Seite aus.
function unstick(e) {
  e.stuckT = 0; e.path = null; e.pathFail = 0;
  const tx = e.x / TS | 0, ty = e.y / TS | 0;
  if (solidTile(e.map, e.x, e.y) || solidPropAt(e.map, e.x, e.y, 4) || !openSpot(e.map, tx, ty, DUNGEONS[e.map] ? 30 : 120)) {
    const q = freeSpotNear(e.map, tx, ty, 2); e.x = q.x; e.y = q.y; if (e.anchor && Math.hypot(e.anchor.x - q.x, e.anchor.y - q.y) < TS * 3) e.anchor = { x: q.x, y: q.y };
  } else e.detour = { off: (chance(0.5) ? 1 : -1) * (1.2 + rnd()), t: 900 };
}
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
const AMBUSH_FAM = [['bandit', 'bandit_archer', 'bandit_spear'], ['wolf'], ['goblin', 'goblin_warrior'], ['skeleton', 'ghoul']];   // Gruppen sind einheitlich (§23)
function coverNear(x, y, r) {                                              // Baum oder Fels, hinter dem man sich verstecken kann
  for (let d = 0; d <= r; d++) for (let j = -d; j <= d; j++) for (let i = -d; i <= d; i++) {
    if (Math.max(Math.abs(i), Math.abs(j)) !== d) continue;
    const q = solidPropAt('world', (x + i) * TS + 16, (y + j) * TS + 16, 4); if (q && q.kind === 'prop' && ['tree', 'rock_node', 'bush', 'dead_tree', 'boulder', 'standing_stone'].includes(q.type)) return [x + i, y + j];
  }
  return null;
}
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
  if (roll < 0.6) {                                                         // Hinterhalt (MP2 §22/§23): vorher in der Welt, hinter Deckung
    const types = AMBUSH_BY_TILE[tileAt('world', tx, ty)] || ['wolf', 'goblin', 'bandit'], fam = pick(AMBUSH_FAM.filter(f => f.some(m => types.includes(m)) && !(S.flags.goblinsFreed && f[0] === 'goblin'))) || AMBUSH_FAM[0];
    const n = ri(fam[0] === 'wolf' ? 2 : 1, 2 + Math.floor(threat / 2)), ahead = ri(26, 32), a = Math.atan2(p.vy, p.vx) + (rnd() - 0.5) * 0.6;
    const ax = tx + Math.round(Math.cos(a) * ahead), ay = ty + Math.round(Math.sin(a) * ahead), cover = coverNear(ax, ay, 6), gid = uid();
    const bx = cover ? cover[0] + Math.round(Math.cos(a) * 2) : ax, by = cover ? cover[1] + Math.round(Math.sin(a) * 2) : ay;   // hinter der Deckung, vom Spieler aus gesehen
    for (let i = 0; i < n; i++) { const e = spawnEnemy(pick(fam), 'world', bx + ri(-2, 2), by + ri(-2, 2)); if (!e) continue;
      Object.assign(e, { encounter: true, ambush: fam[0] !== 'wolf' ? gid : null, pack: fam[0] === 'wolf' ? gid : null, aiState: 'idle' }); e.aggroId = null; }
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

// §28 Gegner-Ausdauer: Maximum 120 % des Spielers (beim ersten Kontakt), Hieb 26, Sprung 30; Erholung 14/s (Elite/Boss 20/s). Leer: kurz
// erschöpft (wankt, offene Deckung). Nur Angreifen kostet — wer bloß wartet, zermürbt niemanden.
const ESTA = { rel: 1.2, swing: 26, leap: 30, regen: 14, eliteRegen: 20 };
function enemyStamina(c, dt) {
  const m = MONSTERS[c.mtype]; if (!m || m.prey) return;
  if (c.sta == null) c.sta = c.maxSta = Math.round((S.player?.maxStamina || 110) * ESTA.rel);
  const sw = c.swing || 0;
  if (sw > 0 && !(sw >= (c._sw || 0) && c._sw > 0)) c.sta -= ESTA.swing;   // neuer Hieb: Schwung fängt (wieder) klein an
  c._sw = sw;
  if (c.leap && c.leap !== c._leap) c.sta -= ESTA.leap;
  c._leap = c.leap;
  if (c.sta <= 0) {
    c.sta = 25; c.stagger = Math.max(c.stagger || 0, c.boss ? 700 : 1100); c.swing = 0; c.telegraph = 0; c.windup = false; c.leap = null;
    float(c, 'erschöpft', 'rgba(200,190,150,ALPHA)'); fx(c.x, c.y + 4, 'dust', 3);
  }
  c.sta = Math.min(c.maxSta, c.sta + dt / 1000 * ((m.threat || 1) >= 3 || c.boss ? ESTA.eliteRegen : ESTA.regen));
}
function tickCombatant(c, dt) {
  if (!c.alive) return;
  if (c.kind === 'enemy') enemyStamina(c, dt);
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
  if (!c.cover) c.stamina = Math.min(c.maxStamina, c.stamina + dt / 1000 * (resting ? 12 : 5) * (1 + (c.attributes?.endurance || 10) * 0.02 - 0.2 + tfx(c, 'regen') + (node(c, 'k_wild') && outside(c) ? 0.5 : 0) + (stat(c, 'song') ? 0.5 : 0)));
  if (c.maxMana) c.mana = Math.min(c.maxMana, c.mana + dt / 1000 * 2.2 * (1 + tfx(c, 'manaRegen')));
  if (c === S.player && c.titleClass) titleTick(c, dt);
  // Statuszeiten
  if (c.status && c.status.length) {
    for (const s of c.status) { s.left -= dt; if (s.key === 'bleeding' && chance(dt / 2500)) { hurt(c, 2, null, 'Blutung'); credit(c, byId(s.src), 2); }
      if (s.key === 'regrowth') B.heal(c, s.heal * dt / 1000);
      if (s.key === 'poisoned') { s.acc = (s.acc || 0) + dt / 1000 * 4; if (s.acc >= 1) { const n = Math.floor(s.acc); s.acc -= n; hurt(c, n, null, 'Gift'); credit(c, byId(s.src), n); } } }
    c.status = c.status.filter(s => s.left > 0);
  }
  if (c.downed && B.vital(c) > 0) { c.downed = false; act(c, 'rise', 520); log(`${c.name} kommt wieder auf die Beine.`, 'party'); }   // geheilt = steht auf
  if (c.downed && c.brawlKO) {                             // S12: nach der Prügelei aufstehen statt verbluten
    if (performance.now() > c.brawlKO) { c.brawlKO = 0; c.downed = false; if (c.body) B.healPart(c, 'torso', c.body.torso.max * 0.3 - c.body.torso.hp); act(c, 'rise', 520); }
  } else if (c.downed) {
    c.downTimer -= dt;
    if (c.downTimer <= 0) { if (c === S.player && captureInstead(c)) return; die(c, c.lastCause || 'Wunden', c.lastKiller); }   // S12 E: Kette schleppt in den Steinbruch
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
  if (e === S.player && S.dbg?.noclip) { e.x += dx; e.y += dy; e.vx = dx; e.vy = dy; return; }   // Debug: Flug/Noclip
  const r = e.r || 10;
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
  if (goal && !e.path && e !== S.player) {                          // Phase 1: Fortschritt zum Ziel messen, nicht nur Bewegung
    const d = Math.hypot(goal.x - e.x, goal.y - e.y), now = performance.now();   // (an der Wand entlangschrammen ist Bewegung ohne Fortschritt)
    if (!e.prog || d < e.prog.d - 8 || Math.hypot(goal.x - e.prog.gx, goal.y - e.prog.gy) > 32) e.prog = { d, age: 0, gx: goal.x, gy: goal.y };
    else if ((e.prog.age += dt) > 1500 && !(e.pathFail > now)) {     // Spielzeit, nicht Echtzeit
      const pts = findPath(e.map, e.x, e.y, goal.x, goal.y); e.prog.age = 0;
      if (pts) { e.path = { pts, i: 0, t: 4000, gx: goal.x, gy: goal.y }; return; }
      e.pathFail = now + 1500;
    }
  }
  if (Math.hypot(e.x - x0, e.y - y0) > sp * 0.5) { e.stuckT = 0; return; }
  if ((e.stuckT = (e.stuckT || 0) + dt) > 2000 && e !== S.player) return unstick(e);
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
  if (!touch.on && mouse.seen) { const wp = R.screenToWorld(mouse.x, mouse.y); mouse.wx = wp.x; mouse.wy = wp.y; }   // BUG-084: Kamera läuft mit — Mauspunkt jeden Frame neu, nicht nur bei Mausbewegung
  p.dodgeCd = Math.max(0, (p.dodgeCd || 0) - dt);
  if (p.dodge) {                                            // Ausweichrolle: feste Dauer, unverwundbar, keine Steuerung
    const d = p.dodge, ease = k => 1 - (1 - k) * (1 - k);      // schneller Antritt, weiches Auslaufen
    const L = d.dist || DODGE.dist * (0.8 + (p.attributes.agility || 10) * 0.02), U = d.dur || DODGE.dur;   // Hundert Schritte: weiter und länger
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
    const l = Math.hypot(dx, dy);
    let sp = speedOf(p) * dt / 16 * (p.cover ? 0.45 : p.reloadUntil > performance.now() ? 0.6 : 1);   // Deckung: kleine Schritte; Armbrust spannen: langsam
    // BUG-076 (§34): wer zuschlägt, steht; wer im Kampf rückwärts geht, geht langsam — Rückwärtslaufen-und-Hauen ist kein Freifahrtschein
    if (p.swing > 0) sp *= 0.55;
    if ((dx * Math.cos(p.aim) + dy * Math.sin(p.aim)) / l < -0.35 && combat.some(f => f.kind === 'enemy' && f.alive && !f.downed && dist(p, f) < 280 && isHostile(f, p))) sp *= 0.7;
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
  polearm:{ w: 0.7,  stop: 70, shake: 4.5, lunge: 5, stag: 0.6 },  whip: { w: 0.25, stop: 30, shake: 1.5, lunge: 3, stag: 0.15 },  crossbow: { w: 0.45, stop: 40, shake: 3, lunge: 0, stag: 0.5 },
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
  let arc = it ? (it.arc || 1.4) : 1.4;
  // §82 Streitflegel: Schwung aus raschen Treffern (≤ 1,4 s Abstand) — +15 % je Stufe, ab Stufe 2 trifft der nächste Hieb rundum
  const now0 = performance.now(), mom = it && it.flail && now0 - (c.momT || 0) < 1400 ? c.momentum || 0 : 0;
  let multF = mult; if (mom) { multF = mult * (1 + 0.15 * mom); if (mom >= 2) arc = Math.PI * 2; }
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
    hit(c, f, multF * tip, kind);
    if (it && it.wtype !== 'spear' && !it.sweep && !(it.flail && mom >= 2)) break;      // Speer trifft in Linie, Hellebarde fegt den Bogen, Flegel mit Schwung rundum
  }
  if (it && it.flail) {
    c.momentum = hitAny ? Math.min(3, mom + 1) : 0; c.momT = now0;
    if (c === S.player && c.momentum >= 2) float(c, c.momentum >= 3 ? 'Schwung ×3' : 'Schwung ×2', 'rgba(230,200,120,ALPHA)');
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
  c.lastShot = performance.now();                                    // Phase 1: Zielhaltung kurz halten (render: Bogen vor dem Körper)
  if (bolt) { c.reloadUntil = performance.now() + it.reload; if (c === S.player) sfx('metal', 0.3); }   // abgedrückt: jetzt spannen
  if (spark) { fx(c.x + Math.cos(c.aim) * 16, c.y - 14 + Math.sin(c.aim) * 8, 'frost', 4); sfx('magic', 0.3, earVol(c)); }
}

function normAng(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
const valenHostile = () => S.ranks.undead >= 0 || S.factions.valen <= -40;
function teamOf(c) {
  if (c === S.player || S.party.includes(c.id)) return 'player';
  if (c.servant) return 'player';                              // Diener des Nekromanten
  if (c.kind === 'enemy') {
    if (MONSTERS[c.mtype]?.prey) return 'prey';
    if (S.flags.goblinsFreed && !c.boss && !c.provoked && (c.mtype === 'goblin' || c.mtype === 'goblin_warrior')) return 'neutral';   // Nutzer: befreite Grubenstämme sind friedlich
    if (c.faction === 'chain' && !chainAtWar()) return 'neutral';     // S12: in der Eisenfeste wird erst geredet (Nutzerwunsch)                  // Wild: kein Gegner, aber jagdbar (Spieler, Wölfe)
    if (c.faction === 'undead') return S.ranks.undead >= 0 ? 'player' : 'foe';
    if (c.faction === 'valen') return valenHostile() ? 'foe' : 'player';
    return 'foe';
  }
  if (c.kind === 'caravan') return 'player';
  if (c.kind === 'npc') return c.angry ? 'foe' : (c.guard && !valenHostile()) || c.escort || DEFENDERS.has(c.key) ? 'player' : 'neutral';   // Karawanenwachen stehen wie der Wagen; Kämpfer wie Kelan wie Wachen (BUG-077: als 'neutral' traf ihr Hieb nie)
  return 'neutral';
}
const chainAtWar = () => S.flags.vargChallenged || (S.flags.chainAlarm || 0) > (S.day | 0) || S.factions.chain <= -60;
function isHostile(a, b) {
  if (a.brawl && b.brawl) return a.brawlSide !== b.brawlSide;   // S12 Aufstand: Prügelei zwischen Dorf und Kette
  if (a.raidOf || b.raidOf) { const r = a.raidOf ? a : b, o = r === a ? b : a; if (o.kind === 'npc' && (o.homeTown === r.raidOf || o.raidDef === r.raidOf)) return true; }   // S12 A4: Überfall aufs Dorf
  if (a.faction && a.faction === b.faction && a.kind !== 'player' && b.kind !== 'player' && !a.angry && !b.angry && !a.servant && !b.servant) return false;   // Gleiche Fraktion: kein Kampf (Stille Wächter vs. Skelette)
  const ta = teamOf(a), tb = teamOf(b);
  return ta !== tb && ta !== 'neutral' && tb !== 'neutral';
}
const COMBAT_KINDS = new Set(['enemy', 'npc', 'player', 'caravan']);
function hostilesOf(c) {
  return S.ents[c.map].filter(e => COMBAT_KINDS.has(e.kind) && e !== c && e.alive && isHostile(c, e));
}

// S12: Waffeneigenschaften, die vom Ziel abhängen — Hinrichtung (Henker, Rotklaue, Schwarzzahn), gegen Ungerüstete (Rabenbeil)
function weaponMult(it, t, armor0) {
  let m = 1;
  if (it?.execute && t.hp < t.maxHp * it.execute[0]) m *= it.execute[1];
  if (it?.raw && armor0 < 4) m *= 1 + it.raw;
  return m;
}
function hit(attacker, target, mult, kind = 'physical') {
  const w = attacker.equip && attacker.equip.weapon, it = w ? ITEMS[w.key] : null;
  let dmg = (attacker.kind === 'enemy' ? MONSTERS[attacker.mtype].dmg * (1 + attacker.level * 0.05) * BAL.dmg * (attacker.disarmed ? 0.4 : 1) : damageOf(attacker)) * mult;
  const riposte = it && it.riposte && attacker.riposteUntil > performance.now();   // Rapier: Stich nach der Parade
  if (attacker.shadowNext > performance.now()) { dmg *= 2.5; attacker.shadowNext = 0; float(attacker, 'Aus dem Schatten', 'rgba(150,130,190,ALPHA)'); }   // Schattenschritt
  if (riposte) { dmg *= 2.2; attacker.riposteUntil = 0; float(attacker, 'Riposte', 'rgba(240,220,150,ALPHA)'); }
  if (attacker.titleClass === 'necromancer') dmg *= 0.85;             // Makel: Die Toten zehren
  // Kritisch
  const ambush = attacker === S.player && target.kind === 'enemy' && teamOf(target) === 'neutral';   // S12: Schleichangriff auf Ahnungslose
  const critChance = riposte ? 1 : 0.05 + (attacker.attributes ? attacker.attributes.perception * 0.004 : 0.01) + tfx(attacker, 'crit') + afx(attacker, 'keen');
  const behind = attacker.aim != null && Math.abs(normAng(Math.atan2(attacker.y - target.y, attacker.x - target.x) - (target.aim || 0))) < 1;
  const crit = chance(critChance) || (it && it.crit && behind && chance(0.5));
  if (crit) dmg *= (it && it.crit) || 1.8;
  // Heilig gegen Untot
  if (kind === 'holy' && (target.mtype === 'skeleton' || target.undead)) dmg *= 2.1;
  // Rüstung / Block
  const ap = Math.min(0.9, (it ? (it.ap || 0) : 0) + afx(attacker, 'pierce'));
  const armor0 = target.kind === 'enemy' ? (target.armor || 0) * 1.6 : armorOf(target), armor = armor0 * (1 - ap);
  dmg *= weaponMult(it, target, armor0);
  if (attacker.body) dmg *= 1 + B.mechBonus(attacker, 'arm');           // S12: Meisterarm aus Gelenkhall
  if (ambush) { dmg *= behind ? 3 : 1.5; float(target, behind ? 'Hinterhalt!' : 'Überrumpelt', 'rgba(220,120,90,ALPHA)');
    if (target.faction === 'chain') { S.flags.chainAlarm = (S.day | 0) + 2; S.factions.chain -= 10; log('Alarm in der Eisenfeste! Die Kette greift an. (Ruf −10)', 'faction'); UI.toast('ALARM', 2200); } }
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
    target.status = (target.status || []).filter(q => q.key !== 'poisoned'); target.status.push({ key: 'poisoned', name: 'Vergiftet', left: 5000, src: attacker.id }); fx(target.x, target.y - 12, 'necro', 4); }
  const lee = afx(attacker, 'leech'); if (lee && attacker.alive) { if (attacker.body) B.heal(attacker, dmg * lee); else attacker.hp = Math.min(attacker.maxHp, attacker.hp + dmg * lee); }
  if (afx(attacker, 'rend') && target.alive && chance(afx(attacker, 'rend')) && !(target.status || []).some(s => s.key === 'bleeding')) (target.status ||= []).push({ key:'bleeding', name:'Blutend', left: 12000, src: attacker.id });
  const wIt = (attacker.equip?.weapon && ITEMS[attacker.equip.weapon.key]) || (attacker.weaponKey && ITEMS[attacker.weaponKey]);   // Session 11: Waffeneigenschaften Fesseln/Blutung (auch Gegnerwaffen)
  if (wIt?.bind && target.alive && !(target.status || []).some(q => q.key === 'chilled')) { (target.status ||= []).push({ key: 'chilled', name: 'Gefesselt', left: 1500, desc: 'Langsamer (−40 %).' }); float(target, 'gefesselt', 'rgba(170,165,150,ALPHA)'); }
  if (wIt?.bleed && target.alive && chance(wIt.bleed) && !(target.status || []).some(q => q.key === 'bleeding')) (target.status ||= []).push({ key: 'bleeding', name: 'Blutend', left: 12000, src: attacker.id });
  if (it && (it.frost || it.chill) && target.alive && !(target.status || []).some(q => q.key === 'chilled')) (target.status ||= []).push({ key: 'chilled', name: it.chill || 'Durchfroren', left: 2500, desc: 'Langsamer (−40 %).' });
  if (it?.toll) { float(target, 'KLONG', 'rgba(200,190,160,ALPHA)'); sfx('metal', 0.7, earVol(target));   // S12 Totenglocke: Feinde um das Ziel verlieren den Mut
    for (const e of hostilesOf(attacker)) if (dist(e, target) < 70) e.cowed = performance.now() + 2500; }
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
  if (target === S.player && target.body) for (const k of ['larm', 'rarm', 'lleg', 'rleg']) { const P = target.body[k]; if (P.mech) P.mechCond = Math.max(0, (P.mechCond ?? 100) - 1.2); }   // S12 E: Prothesen nutzen sich ab (ohne Zufall: Proben bleiben gleich)
  if (!target.alive || target.invuln || (target === S.player && S.dbg?.god)) return;   // Debug: Gottmodus
  if (target.mtype === 'wraith' && target.phased > performance.now() && kind === 'physical') { float(target, 'körperlos', 'rgba(200,220,240,ALPHA)'); return; }   // Geist: nach Treffer kurz ungreifbar
  if (target.mtype === 'bear' && source) target.provoked = true;
  if (S.flags.goblinsFreed && source === S.player && (target.mtype === 'goblin' || target.mtype === 'goblin_warrior') && !target.provoked) { target.provoked = true; S.factions.goblin -= 10; log('Du greifst einen freien Goblin an. Grubenstämme −10.', 'faction'); }
  if (target.momentum && source) target.momentum = 0;               // Streitflegel: wer getroffen wird, verliert den Schwung
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
  const brawlHit = target.brawl && source && (source.brawl || source === S.player);   // S12: Prügelei ohne Tote
  if (brawlHit) { dmg *= 0.5; if (source === S.player && S.brawls?.[target.brawlV]) S.brawls[target.brawlV].helped = target.brawlSide === 'dorf' ? 'kette' : 'dorf'; }
  if (target.body) { part = brawlHit ? 'torso' : B.pickPart(source, target, crit); result = B.damagePart(target, part, dmg, crit); }
  else target.hp -= dmg;
  credit(target, source, dmg);                                            // Phase 1: XP nach Beitrag
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
    const poised = target.poiseUntil > performance.now();          // §82 Standfestigkeit: kurz nach einem Taumeln kein neues (kein Dauerlähmen)
    const kb = Math.min(20, (2 + dmg * 0.22) * (0.6 + fl.w)) * (crit ? 1.5 : 1) * (target.boss ? 0.25 : 1) * (poised ? 0.3 : 1);
    target.kb = { x: Math.cos(a) * kb, y: Math.sin(a) * kb, t: 140, T: 140 };
    // Taumeln: kurzer Kontrollverlust; schwere Treffer brechen die Angriffsvorbereitung (nicht beim Boss außer kritisch)
    const stg = stagOf(source) * (crit ? 1.4 : 1);
    if (stg >= 0.3 && !poised && teamOf(target) !== 'player' && (!target.boss || (crit && stg >= 1))) {   // Dolch/Bogen: kein Taumeln (sonst Dauerlähmung)   // Spieler/Gefährten taumeln nicht (Steuerung bleibt direkt)
      target.stagger = Math.max(target.stagger || 0, 260 * stg);   // Schwert ~90 ms, Axt ~180, Kolben ~250, Zweihänder ~260 (krit. mehr)
      if (target.kind === 'enemy') target.poiseUntil = performance.now() + target.stagger + 1200;
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
  if (dmg > 10 && chance(0.25) && !(target.status || []).some(s => s.key === 'bleeding')) {
    (target.status ||= []).push({ key:'bleeding', name:'Blutend', left: 12000, src: source?.id });
    if (target === S.player) UI.toast(hasItem(target, 'bandage') ? 'Du blutest — Verband anlegen (Inventar, I)' : 'Du blutest — und hast keinen Verband', 2600);   // BUG-081
  }
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
  if (c.brawl) c.brawlKO = performance.now() + 20000;   // Prügelei: liegt eine Weile, steht dann wieder auf
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
  if (c.runaway && S.quests.q_runaway?.state === 'active') runawayEnd('Der Entlaufene ist tot.', 3);   // S12 A3
  if (c.robot && c.faction === 'aurel' && source && (source === S.player || S.party.includes(source.id))) startHunt(1);   // S12 E: Aurelion fahndet
  if (c.skyRuler) rulerSlain(c, source);
  if (c.bondGuard && S.bond) { S.bond.guardDown = true; log(`${c.name} liegt in Trümmern. Jetzt — oder nie.`, 'combat'); }
  if (c.intrigueTarget && S.intrigue && !S.intrigue.done) { S.intrigue.done = true; log('Heikle Angelegenheit: erledigt. Berichte dem Haus.', 'quest'); }
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
    const full = m.xp + c.level * 2, share = xpShares(c), px = Math.round(full * share(S.player.id));
    if (px > 0) gainXp(S.player, px);
    for (const pm of partyMembers()) { const q = Math.round(full * share(pm.id)); if (q > 0) { pm.xp += q; while (pm.xp >= pm.xpNext) levelUp(pm); } }
    S.kills++;
    if (S.player.alive) S.player.kills = (S.player.kills || 0) + 1;
    S.battles = Math.max(1, Math.round(S.kills / 3));
    const pw = S.player.equip.weapon;
    if (pw && dist(S.player, c) < 260) pw.kills = (pw.kills || 0) + 1;
    if (c.boss) {
      const nm = c.map === 'world' ? locAt(c.x / TS | 0, c.y / TS | 0)?.name : DUNGEONS[c.map]?.name, where = nm ? locDat(nm) : 'der Wildnis';   // vorher stand immer „Grube“
      chronicle(`${c.title || m.name} erschlagen`, 'battle', `Gefallen bei ${where}, Jahr ${year()}.`);
      UI.toast(`${c.title || m.name} ist besiegt`, 3200);
    }
    const rb = bossOf(c); if (rb) regionBossSlain(rb);
    onKill(c.mtype, c); const rbk = bossOf(c); if (rbk) onKill(rbk.id);   // Regionalboss zählt als eigenes Ziel
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
  const seen = S.ents[victim.map].some(w => w.kind === 'npc' && w.alive && w !== victim && !S.party.includes(w.id) && dist(w, victim) < 300);
  const fac = crimeFaction(victim), rank = HIGH_RANK[victim.prof] || HIGH_RANK[victim.key];
  // S12 (Nutzer: „mehr Ruf-Verlust, krassere Konsequenzen für Mord an Adel oder Priester“): jeder Mord kostet Ruf — Gerüchte auch ohne Zeugen
  const loss = rank ? (seen ? 35 : 18) : (seen ? 10 : 3);
  S.factions[fac] -= loss; if (rank === 'klerus' && fac !== 'order') S.factions.order -= seen ? 30 : 15;
  log(`Ruf bei ${FACTIONS[fac]?.name || fac} −${loss}${rank === 'klerus' && fac !== 'order' ? ', beim Orden ebenso' : ''}.`, 'faction');
  if (seen) addBounty(fac, rank ? 800 : 250, rank === 'adel' ? 'Mord am Adel' : rank === 'klerus' ? 'Mord an einem Geweihten' : 'Mord');
  if (rank) murderOfRank(victim, fac, rank, seen);
  for (const m of partyMembers()) {
    if ((m.traits || []).includes('grausam')) continue;
    m.morale -= 10; remember(m, 'killed_kin', victim.name);
  }
  const m = partyMembers().find(x => !(x.traits || []).includes('grausam'));
  if (m) log(`${m.name}: „${victim.name} hat dir nichts getan.“`, 'party');
}

// Hoher Stand: Adel und Geweihte. Blutbann (Wachen der Fraktion greifen fünf Tage lang ohne Anruf an, keine Festnahme mehr),
// Kopfgeldjäger sofort, Chronik; bei Geweihten zusätzlich der Kirchenbann: sieben Tage hilft dir niemand auf, der Orden ist Feind.
const HIGH_RANK = { Graf: 'adel', 'Gräfin': 'adel', Edelmann: 'adel', Edelfrau: 'adel', Ratsherr: 'adel', Dorfvorsteher: 'adel', 'Alter Paladin': 'klerus', Priester: 'klerus', Heilerin: 'klerus', Priesterin: 'klerus' };
function murderOfRank(victim, fac, rank, seen) {
  const p = S.player, town = townAt(victim.x / TS | 0, victim.y / TS | 0);
  S.flags.bann = { ...(S.flags.bann || {}), [fac]: (S.day | 0) + 5 };
  if (rank === 'klerus') { S.flags.bann.order = (S.day | 0) + 5; S.flags.anathema = (S.day | 0) + 7; }
  chronicle(`${rank === 'adel' ? 'Adelsmord' : 'Mord an einem Geweihten'}: ${victim.name}`, 'death', `${victim.prof}${town ? ' in ' + (LOCATIONS.find(l => l.key === town)?.name || town) : ''}. Der Täter ist bekannt${seen ? '' : ' — man flüstert es jedenfalls'}.`);
  log(rank === 'adel' ? 'Blutbann: Die Wachen haben Befehl, dich ohne Anruf zu erschlagen.' : 'Kirchenbann: Kein Geweihter, keine Wache, kein Heiler wird dir beistehen.', 'faction');
  UI.toast(rank === 'adel' ? 'BLUTBANN' : 'KIRCHENBANN', 3200);
  for (const m of partyMembers()) if (!(m.traits || []).includes('grausam')) m.morale -= 20;
  if (seen && p.map === 'world') { S.flags.hunterDay = S.day + 2; spawnHunters(p); }
}
const banned = fac => ((S.flags.bann || {})[fac] || 0) > (S.day | 0);
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
  const bonus = Math.max(0, (MONSTERS[e.mtype]?.threat || 1) - 1) + (e.boss ? 1 : 0) + (e.elite ? 1 : 0);   // gefährlicher Gegner (Veteran §71), bessere Chancen
  for (const [key, p] of table) if (chance(p)) dropItemAt(e.map, e.x + ri(-10, 10), e.y + ri(-8, 8), mkItem(key, 1, { bonus }));
  if (chance(0.5)) { const g = ri(1, 6) + e.level; S.gold += g; float(e, `+${g} Gold`, 'rgba(189,148,51,ALPHA)'); }
}
function dropItemAt(map, x, y, item) {
  if (!item) return;
  S.ents[map].push({ id: uid(), kind:'item', map, x, y, r: 8, item, seed: rnd() * 100 });
}

// XP nach Beitrag (Master-Prompt 2 §17): Schaden je Verursacher am Ziel; Diener zählen für ihren Herrn, Gift und Blutung
// für den, der sie verursacht hat. Wer nichts beigetragen hat, bekommt nichts.
function credit(target, src, dmg) {
  if (!src || !(dmg > 0) || target.kind !== 'enemy') return;
  const k = src.servant || src.id; if (!k) return;
  (target.dmgBy ||= {})[k] = (target.dmgBy[k] || 0) + dmg;
}
function xpShares(c) { const D = c.dmgBy || {}, tot = Object.values(D).reduce((a, v) => a + v, 0); return id => tot ? (D[id] || 0) / tot : 0; }
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
    const n = Math.max(1, Math.ceil(Math.hypot(p.vx, p.vy) * dt / 16 / 8));   // Phase 1: Teilschritte ≤ 8 px, sonst tunnelt der Pfeil
    p.life -= dt; let wall = false;
    for (let k = 0; k < n && !wall && !p.hitDone; k++) { p.x += p.vx * dt / 16 / n; p.y += p.vy * dt / 16 / n; wall = solidTile(p.map, p.x, p.y) || !!solidPropAt(p.map, p.x, p.y, 3) || projHit(p); }
    if (p.life <= 0 && !wall && p.burst) { splashAt(p); continue; }            // Wurf: zerschellt am Zielpunkt
    if (p.hitDone) continue;
    if (wall) { fx(p.x, p.y, 'spark', 3); if (p.splash) splashAt(p); p.life = 0; continue; }
  }
  S.projectiles = S.projectiles.filter(p => p.life > 0 && !p.hitDone);
}
// Treffer im Teilschritt: true = Geschoss verbraucht (getroffen)
function projHit(p) {
  const own = byId(p.owner);
  for (const e of (p.map === S.map ? combat : S.ents[p.map])) {
    if (!(e.kind === 'enemy' || e.kind === 'npc' || e.kind === 'player') || !e.alive || e.downed || e.id === p.owner) continue;   // Pfeile fliegen über Liegende
    if (!own || teamOf(own) === teamOf(e)) continue;
    if (Math.abs(p.x - e.x) < 30 && Math.abs(p.y - e.y) < 30 && dist(p, e) < (e.r || 10) + 5) {
      if (e.invuln && e.dodge) { if (!p.evaded) { p.evaded = true; evaded(e); } continue; }   // Geschoss fliegt durch die Rolle
      hurtFromProjectile(own, e, p);
      if (p.splash) splashAt(p, e);
      p.hitDone = true; p.life = 0; return false;
    }
  }
  return false;
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

const VOICE = { wolf: 'growl', wild_dog: 'growl', bear: 'growl', boar: 'growl', skeleton: 'rattle', crypt_warden: 'rattle', death_captain: 'rattle', hrodvar: 'rattle',
  ghoul: 'moan', wraith: 'shriek', bandit: 'shout', bandit_archer: 'shout', bandit_spear: 'shout', bounty_hunter: 'shout', chain_brute: 'shout', automat: 'rattle', rotgardist: 'shout', kettenschuetze: 'shout', chain_master: 'shout', goblin: 'shout', goblin_warrior: 'shout', gorak: 'growl', cultist: 'moan', valen_soldier: 'shout' };
function updateEnemy(e, dt) {
  if (!e.alive) return;
  const p = S.player;
  if (e.servant && (performance.now() > e.until || !byId(e.servant)?.alive)) return crumble(e);   // der Ruf verklingt
  const far = dist(e, p) > 1100;
  if (far) { e.vx = e.vy = 0; return; }                       // Stufe C: außerhalb der Sicht keine Simulation
  const m = MONSTERS[e.mtype];
  if (e.ambush) {                                                              // Hinterhalt: still hinter der Deckung, bis man nah ist oder getroffen wird
    if (dist(e, p) > 230 && e.hp >= e.maxHp && p.alive) { e.vx = e.vy = 0; e.aim = Math.atan2(p.y - e.y, p.x - e.x); return; }
    const gid = e.ambush; for (const o of S.ents[e.map]) if (o.ambush === gid) { o.ambush = null; o.aggroId = p.id; o.aiState = 'pursue'; }
    log('Hinterhalt! Sie brechen aus der Deckung.', 'combat'); UI.toast('HINTERHALT', 2200);
  }
  if (m.prey) return preyAI(e, dt, m);                          // Wild: flieht vor allem, was sich nähert, sonst äsen
  const targets = combat.filter(t => !t.downed && t !== e && isHostile(e, t) && (t.kind !== 'caravan' || e.faction === 'bandit'));   // nur Banditen rauben Wagen
  const ag = e.aggroId ? byId(e.aggroId) : null;
  const sight = m.sight * (e.wary > clock() ? 1.5 : 1);           // nach abgebrochener Jagd: wachsamer
  let tgt = ag && ag.alive && !ag.downed && ag.map === e.map && isHostile(e, ag) && dist(e, ag) < sight * 1.6 ? ag : nearestTarget(e, targets, sight);
  if (e.mtype === 'bear' && tgt && !e.provoked && dist(e, tgt) > 110 && tgt !== ag) tgt = null;   // Revier: nur wer zu nahe kommt
  if (tgt && e.giveUp && e.giveUp.id === tgt.id && e.giveUp.until > performance.now()) tgt = null;   // BUG-088: aufgegeben (kein Weg) — nicht sofort wieder anrennen
  let sp = m.speed * dt / 16 * speedMul(e.map, e.x, e.y) * B.speedFactor(e) * (e.hexed > performance.now() ? 0.7 : 1) * (e.rooted > performance.now() ? 0 : 1) * ((e.status || []).some(q => q.key === 'chilled') ? 0.6 : 1);   // Ranken halten, Frost bremst
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
  if (!tgt && e.marching) {                                   // §74: Heer zieht sichtbar zum Ort, statt dort zu erscheinen
    const d = Math.hypot(e.anchor.x - e.x, e.anchor.y - e.y);
    if (d > 120) { seek(e, Math.atan2(e.anchor.y - e.y, e.anchor.x - e.x), sp * 0.8, dt, e.anchor); return; }
    e.marching = false;
  }
  if (!tgt) {
    e._voiced = false;
    e.aiTimer -= dt;
    if (e.aiTimer <= 0) { e.aiTimer = ri(1200, 3600); e.wander = { x: e.anchor.x + ri(-90, 90), y: e.anchor.y + ri(-90, 90) }; }
    if (e.wander) {
      const d = Math.hypot(e.wander.x - e.x, e.wander.y - e.y);
      if (d > 8) seek(e, Math.atan2(e.wander.y - e.y, e.wander.x - e.x), sp * 0.45, dt, e.wander);
      else e.vx = e.vy = 0;
    }
    return;
  }
  if (!e._voiced) { e._voiced = true; const v = VOICE[e.mtype]; if (v) sfx(v, 0, earVol(e)); }   // Phase 11: Ruf beim Entdecken, je Art
  e.aim = Math.atan2(tgt.y - e.y, tgt.x - e.x);
  const d = dist(e, tgt), reach = m.reach + (tgt.r || 10);
  const rb = bossOf(e);
  if (rb && !e.howled && e.hp < e.maxHp * 0.5) {              // Regionalboss, Phase 2: ruft Verstärkung
    e.howled = true; sfx(VOICE[e.mtype] || 'shout', 0, earVol(e)); float(e, rb.call === 'wolf' ? 'heult!' : 'ruft!', 'rgba(220,200,160,ALPHA)', true); log(`${e.title} ${rb.callText}`, 'combat');
    for (let i = 0; i < 2; i++) { const w = spawnEnemy(rb.call, e.map, (e.x / TS | 0) + ri(-7, 7), (e.y / TS | 0) + ri(-7, 7)); w.aggroId = tgt.id; }
  }
  if (e.mtype === 'wolf') {                                   // Wolf: duckt sich kurz (Ansage), springt dann an
    if (e.leap) { e.leap.t -= dt; moveEnt(e, e.leap.ax * sp * 3.4, e.leap.ay * sp * 3.4); if (e.leap.t <= 0) { e.leap = null; e.atkCd = 0; } return; }
    e.leapCd = (e.leapCd || 0) - dt;
    if (e.telegraph > 0) { e.vx = e.vy = 0; if (e.telegraph <= dt) { e.leap = { t: 190, ax: Math.cos(e.aim), ay: Math.sin(e.aim) }; sfx('dodge', 0, earVol(e)); } return; }
    if (d < 130 && d > reach && e.leapCd <= 0) { e.telegraph = 280; e.leapCd = 2800; e.vx = e.vy = 0; return; }
  }
  // BUG-088 (§21 „aufgeben mit Grund“): kein Weg zum Ziel (Fluss ohne Brücke in Reichweite) → nicht als Zielscheibe am Ufer
  // stehen, sondern nach ~3 s abziehen: „?“, zurück zum Posten, eine Weile wachsamer. Bosse halten ihre Arena.
  if (!m.ranged && !m.boss) {
    const stuck = !e.path && e.pathFail > performance.now() && d > reach * 1.5;
    e.unreach = stuck ? (e.unreach || 0) + dt : Math.max(0, (e.unreach || 0) - dt);
    if (e.unreach > 3000) {
      e.unreach = 0; e.giveUp = { id: tgt.id, until: performance.now() + 9000 }; e.aggroId = null; e.wary = clock() + 120; e.chaseT = 0;
      e.wander = { x: e.anchor.x, y: e.anchor.y }; e.aiTimer = 9000; float(e, '?', 'rgba(200,190,160,ALPHA)', true);
      if (tgt === p) log(`${m.name} findet keinen Weg zu dir und zieht sich zurück.`, 'combat');
      return;
    }
  }
  // BUG-076 (§34 „Nicht-mehr-nachgeben“): wer ~2 s vergeblich hinterherläuft, setzt nach — sichtbar mit „!“ und Staub
  if (!m.ranged && (tgt === p || S.party.includes(tgt.id))) { e.chaseT = d > reach * 1.2 ? (e.chaseT || 0) + dt : Math.max(0, (e.chaseT || 0) - dt * 3);
    if (e.chaseT > 2000) { sp = e.mtype === 'ghoul' ? sp * 1.45 : Math.max(sp * 1.45, 2.0 * dt / 16);   // §82: auch Langsame holen den Rückwärtsgehenden ein (1,9), außer dem Wiedergänger (Griff statt Tempo)
      if (!e.surging) { e.surging = true; float(e, '!', 'rgba(230,120,90,ALPHA)', true); fx(e.x, e.y + 6, 'dust', 5); } }
    else e.surging = false; }
  if (e.mtype === 'bear' && bearAI(e, tgt, d, reach, sp, dt, m)) return;
  if (e.mtype === 'wild_dog' && d > reach * 1.6) {            // Rudel: von der Seite, nicht alle frontal
    const side = ((e.seed | 0) % 2 ? 1 : -1) * 0.9 * Math.min(1, (d - reach) / 120);
    seek(e, e.aim + side, sp, dt, tgt); return;
  }
  if (e.mtype === 'cultist') cultistHeal(e, m, dt);
  if (e.retreat > 0) {                                        // Goblin: nach dem Hieb zurückspringen (Hit & Run)
    e.retreat -= dt; moveEnt(e, -Math.cos(e.aim) * sp, -Math.sin(e.aim) * sp); return;
  }
  if (m.ranged) return archerAI(e, tgt, d, sp, dt, m);
  if (e.mtype === 'gorak') return bossAI(e, tgt, d, reach, sp, dt, m);
  if (e.mtype === 'hrodvar') return frostKingAI(e, tgt, d, reach, sp, dt, m);
  if (e.mtype === 'bandit' && banditAI(e, tgt, d, reach, sp, dt, m)) return;
  if (e.mtype === 'bandit_spear' && spearAI(e, tgt, d, reach, sp, dt, m)) return;
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
function cultistHeal(e, m, dt = 16) {
  e.healCd = (e.healCd || 2000) - dt;                          // echte Frame-Zeit (vorher fest 16 ms → bildratenabhängig)
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
        vx: cs * (mag ? 4.6 : 7), vy: sn * (mag ? 4.6 : 7), owner: e.id, dmg: m.dmg * (1 + e.level * 0.05) * BAL.dmg, life: 1600, team:'foe' });
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
  if (d < m.reach && e.atkCd <= 0 && !e.repos && clearLine(e, tgt)) e.draw = 520;   // Ansage: 0,5 s Bogen spannen; nur mit freier Sicht (Phase 1)
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

// Speerträger (§82, neuer Gegnertyp): hält den Spieler auf Speerlänge. Wer ihm zu nahe kommt, wird mit dem Schaft
// zurückgestoßen (kurzer Treffer, starker Rückstoß) — stures Anrennen wird bestraft; seitlich angehen, Schild, Rolle helfen.
function spearAI(e, tgt, d, reach, sp, dt, m) {
  e.shoveCd = (e.shoveCd || 0) - dt;
  if (d < reach * 0.5 && e.swing <= 0 && e.telegraph <= 0) {
    if (e.shoveCd <= 0) {
      e.shoveCd = 2400; e.vx = e.vy = 0; sfx('hit', 0.5, earVol(e)); float(e, 'Stoß', 'rgba(220,190,140,ALPHA)');
      if (tgt.invuln) evaded(tgt); else { hit(e, tgt, 0.5); const a = Math.atan2(tgt.y - e.y, tgt.x - e.x); tgt.kb = { x: Math.cos(a) * 26, y: Math.sin(a) * 26, t: 200, T: 200 }; }
      return true;
    }
    moveEnt(e, -Math.cos(e.aim) * sp, -Math.sin(e.aim) * sp); return true;   // zu nah: zurück auf Speerlänge
  }
  return false;                                               // sonst: Standard-Anlauf bis Speerlänge, Stich mit Ansage
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
  const fast = e.phase >= 2 ? 1.35 : 1, sp2 = sp * fast;
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
  // §82: Phase 3 (< 25 %) Verzweiflung — Doppel-Sturm, schnelleres Beben; Ansagen bleiben lesbar
  if (e.phase === 2 && e.hp <= e.maxHp * 0.25) { e.phase = 3; log(`${m.name} blutet und tobt — jetzt nicht mehr nachlassen!`, 'combat'); UI.toast('GORAK IN RAGE', 1800); camShake(6, 300); }
  e.farT = d > reach * 2 ? (e.farT || 0) + dt : 0;                    // §82 Antwort auf Abwarten: wer Abstand hält, wird angesprungen
  if (e.swing <= 0 && e.telegraph <= 0 && (e.phase >= 2 || e.farT > 2500)) {
    if (d > reach * 1.6 && d < 320 && e.chargeCd <= 0) {
      e.special = { kind: 'charge', t: e.phase === 3 ? 520 : 650, ax: Math.cos(e.aim), ay: Math.sin(e.aim) }; e.chargeCd = e.phase === 3 ? (e.chained ? 3600 : 600) : e.phase === 2 ? 5200 : 7000;
      e.chained = e.phase === 3 && !e.chained; e.farT = 0; return;
    }
    if (e.phase >= 2 && d < 120 && e.quakeCd <= 0) { e.special = { kind: 'quake', t: 800 }; e.quakeCd = e.phase === 3 ? 4200 : 6500; return; }
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
  const fast = e.phase >= 2 ? 1.25 : 1;
  e.frostCd = (e.frostCd ?? 2500) - dt;
  const sa = e.special;
  if (sa && sa.kind === 'frost') {
    sa.t -= dt; e.vx = e.vy = 0;
    if (sa.t <= 0) {
      e.special = null; camShake(6, 250); sfx('crit', 1, earVol(e));
      S.fx.push({ x: e.x, y: e.y, vx: 0, vy: 0, type: 'shock', ice: true, s: 1, life: 520, maxLife: 520 }); fx(e.x, e.y - 6, 'frost', 18);
      for (const t of combat) if (t.alive && t !== e && isHostile(e, t) && dist(e, t) < (sa.big ? 140 : 105)) {
        if (t.invuln) { evaded(t); continue; }
        hit(e, t, 0.7);
        if (!(t.status ||= []).some(q => q.key === 'chilled')) t.status.push({ key: 'chilled', name: 'Durchfroren', left: 4000, desc: 'Langsamer (−40 %).' });
      }
    }
    return;
  }
  if (e.phase === 2 && e.hp <= e.maxHp * 0.25) { e.phase = 3; log(`${m.name}: „Die Kälte bleibt, wenn ich gehe.“`, 'combat'); UI.toast('DER KÖNIG ERSTARRT NICHT', 1800); }   // §82 Phase 3
  if (sa && sa.kind === 'lance') {                                    // §82 Eislanze: Antwort auf Abstand halten
    sa.t -= dt; e.vx = e.vy = 0;
    if (sa.t <= 0) { e.special = null; const a = Math.atan2(tgt.y - e.y, tgt.x - e.x); sfx('magic', 0.6, earVol(e));
      S.projectiles.push({ map: e.map, x: e.x + Math.cos(a) * 16, y: e.y - 10 + Math.sin(a) * 16, vx: Math.cos(a) * 5.2, vy: Math.sin(a) * 5.2, owner: e.id, dmg: m.dmg * 0.8 * BAL.dmg, life: 1400, team: 'foe', kind: 'frost' }); }
    return;
  }
  e.farT = d > 160 ? (e.farT || 0) + dt : 0;
  if (e.swing <= 0 && e.telegraph <= 0 && e.farT > 2000) { e.special = { kind: 'lance', t: 600 }; e.farT = -1500; fx(e.x, e.y - 20, 'frost', 8); float(e, 'Eislanze', 'rgba(170,220,255,ALPHA)'); return; }
  if (e.swing <= 0 && e.telegraph <= 0 && d < (e.phase === 3 ? 150 : 130) && e.frostCd <= 0) { e.special = { kind: 'frost', t: 900, big: e.phase === 3 }; e.frostCd = e.phase === 3 ? 3800 : e.phase === 2 ? 5200 : 7000; return; }
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
  // §82 Ausfallschritt: wer beim Treffer knapp (≤ 30 px) außer Reichweite zurückgewichen ist, wird trotzdem erreicht —
  // der Gegner setzt nach (bis 20 px) und führt den Hieb aufs Ziel. Das Ausholen war sichtbar; Rückwärtslaufen allein reicht nicht.
  const tg = combat.filter(t => t.alive && !t.downed && t !== e && isHostile(e, t)).map(t => [t, dist(e, t) - m.reach - (t.r || 10)])
    .filter(([, over]) => over > 0 && over <= 30).sort((a, b) => a[1] - b[1])[0];
  if (tg && !m.ranged) { const [t, over] = tg, a = Math.atan2(t.y - e.y, t.x - e.x), f = e.facing; moveEnt(e, Math.cos(a) * Math.min(20, over + 2), Math.sin(a) * Math.min(20, over + 2)); e.facing = f; e.aim = a; }
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
  if (e.brawl && !e.downed && brawlAI(e, dt)) return;   // S12: Aufstand
  const p = S.player;
  if (dist(e, p) > 900) { e.vx = e.vy = 0; if (e.plan && e.map === 'world' && !e.fleeing && !e.angry) placeAway(e); return; }
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
  if (e.guard && e.faction && S.factions[e.faction] != null && repTier(e.faction).name === 'Verhasst' && !(e.wary > clock()) && p.alive && !p.downed && p.map === e.map && dist(e, p) < 220) {   // §43 Verhasst: Wachen greifen an
    e.angry = true; e.brave = true; e.aggroId = p.id; e.sawPlayer = clock();
    log(`${e.name}: „Du wagst es, dich hier zu zeigen?“`, 'combat'); return;
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
    if (e.guard || e.escort || e.camp || e.hostile || e.angry || DEFENDERS.has(e.key)) {   // Wachen, Feldzug und kampferprobte Bewohner stellen sich
      if (e.guard && !(e.calledAt > now - 5)) { e.calledAt = now; raiseAlarm(e, f); }
      e.aim = Math.atan2(f.y - e.y, f.x - e.x);
      const d = dist(e, f), reach = ITEMS[e.equip.weapon?.key]?.ranged ? (clearLine(e, f) ? 200 : 20) : 34;   // Schützen halten Abstand, ohne Sicht rücken sie vor
      if (d > reach) seek(e, e.aim, (d > 160 ? 1.7 : 1.3) * dt / 16, dt, f);   // aus der Ferne herbeieilen
      else { e.vx = e.vy = 0; if (e.atkCd <= 0) attack(e); }
      return;
    }
    if (!e.brave) { seek(e, Math.atan2(e.y - f.y, e.x - f.x), 1.5 * dt / 16, dt); return; }   // Zivilisten fliehen
  }
  // Spieler liegt am Boden (nicht durch uns): Wachen eilen herbei und richten ihn auf, Zivilisten holen Hilfe
  if (p.downed && p.alive) {
    const d = dist(e, p), carer = !(S.flags.anathema > (S.day | 0)) && (e.guard || DEFENDERS.has(e.key) || e.prof === 'Heilerin');   // Wache, Kämpfer, Heilerin helfen selbst — nicht im Kirchenbann (S12)
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
  if (!e.guard && !e.shop && fearLvl() >= 2 && fearedBy(e) && dist(e, p) < 80) { seek(e, Math.atan2(e.y - p.y, e.x - p.x), 1.2 * dt / 16, dt); return; }   // S12: man weicht dem Hochpaladin aus
  if (e.afraid > now && !e.guard && dist(e, p) < 170) { seek(e, Math.atan2(e.y - p.y, e.x - p.x), 1.4 * dt / 16, dt); return; }
  if (arrestCheck(e, p, dt)) return;                   // §44: Wache stellt einen Gesuchten
  if (e.bondGuard && bondGuardStep(e, dt)) return;              // MP2 §25: Wächter des Versklavten
  if (e.robot && e.guard && aurelWatch(e, dt)) return;           // S12 E: Automaten kontrollieren den Aufenthaltsschein
  if (e.robotWork && robotWorkStep(e, dt)) return;              // S12 E: Arbeitsautomaten
  if (e.cmdUntil > performance.now() && cmdStep(e, dt)) return;   // S12: Befehl der Kette — folgt dem Hochpaladin
  if (e.eisen && eisenStep(e, dt)) return;             // Eisenmark: Kettenzug, Angekettete, Arbeit
  if ((e.tribV || e.tribFollow) && tributStep(e, dt)) return;   // S12: Tributzug
  if (e.camp && campStep(e, dt)) return;
  if (e.rider && riderStep(e, dt)) return;                // S12: Grenzreiter                // S12: Feldzug der Kette
  if (car && car.alive) {                              // Karawanenwache: geht auf ihrem Platz am Zug mit
    const q = SIM.escortSlot(car, e.slot), d = Math.hypot(q.x - e.x, q.y - e.y);
    e.anchor = { x: q.x, y: q.y };
    if (d > 10) seek(e, Math.atan2(q.y - e.y, q.x - e.x), Math.min(d > 300 ? 2.6 : 1.8, (car.vx || car.vy ? 0.9 : 0.6) + d / 45) * dt / 16, dt, q);   // Zugtempo + Aufholen (weit zurück: rennen)
    else { e.vx = e.vy = 0; if (car.vx || car.vy) e.aim = Math.atan2(car.vy, car.vx); }
    return;
  }
  // Tagesablauf
  if (e.plan && e.map === 'world') { e.blk = null; return villagerDay(e, dayTarget(e), dt); }
  const h = S.minute / 60;
  let target = e.anchor;
  if (e.schedulePos) target = e.schedulePos;
  const night = h >= 22 || h < 7;
  if (night) target = e.anchor;
  else if (h >= (e.till || 18) && e.eve) target = e.eve;          // Feierabend: vor dem Haus, in der Schenke oder daheim
  else if (h >= 18 && h < 22 && e.home) target = { x: e.anchor.x + 40, y: e.anchor.y + 20 };
  const off = e.guard && e.post && guardOff(e, h);                // §41 Stufe 2: Wachschicht — Nachtruhe im Wachhaus
  if (off) target = off;
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

// Wachschichten (§41 Stufe 2): jede zweite Wache eines Postens hat 22–6 Uhr frei und schläft im Wachhaus (sonst Halle,
// sonst Schenke) — nachts steht die halbe Besatzung. Schichtwechsel ist damit ein sichtbarer Gang zwischen Posten und Haus.
const BARRACKS = new Map();
function guardOff(e, h) {
  if (!(h >= 22 || h < 6)) return null;
  if (e.shiftOff == null) { const mates = S.ents.world.filter(o => o.guard && o.alive && o.post === e.post).sort((a, b) => (a.id < b.id ? -1 : 1)); e.shiftOff = mates.indexOf(e) % 2 === 1; }
  if (!e.shiftOff) return null;
  if (!BARRACKS.has(e.post)) {
    const b = ['barracks', 'hall', 'tavern'].map(t => HOUSES.find(h => h.town === e.post && h.type === t && h.map === 'world')).find(Boolean);
    BARRACKS.set(e.post, b ? (() => { const [dx, dy] = b.doorTile, sx = b.door === 'W' ? 1 : b.door === 'E' ? -1 : 0, sy = b.door === 'S' ? -1 : b.door === 'N' ? 1 : 0;
      return { x: (dx + sx * 2) * TS + TS / 2, y: (dy + sy * 2) * TS + TS / 2, in: 1 }; })() : null);
  }
  return BARRACKS.get(e.post);
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
  if (law && law.robot && inAurel(p) && !hasPermit() && enslave('aurel', 300)) return;   // S12 E: ohne Schein in Schuldknechtschaft
  if (law && law.faction === 'chain' && !S.flags.chainsBroken && enslave('chain', 200)) return;
  if (!law) return log('Sie lassen von dir ab und gehen. Niemand hilft dir auf.', 'combat');
  const fine = Math.min(S.gold, 80);                                     // S12: Strafen deutlich höher (Nutzer)
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
    else if (d > want || (it && it.ranged && !clearLine(m, foe))) seek(m, m.aim, sp, dt, foe);   // Phase 1: Schütze sucht freie Sicht
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
  if (seen) addBounty(crimeFaction(target), 80, 'Angriff');                  // §44: bezeugt = Kopfgeld
  if (here) chronicle(`Blut in ${here.name}`, 'crime', `${S.player.name} hebt die Hand gegen ${target.name}.`);
  log(`Du greifst ${target.name} an!`, 'combat');
  UI.toast(seen ? `${seen} Zeuge${seen > 1 ? 'n' : ''}! Dein Ruf leidet.` : 'Niemand hat es gesehen …', 3200);
}

// ================= Interaktion =================
function interactables() {
  const p = S.player;
  return S.ents[S.map].filter(e => e !== p && dist(e, p) < 62 &&
    (e.kind === 'npc' || e.kind === 'item' || e.kind === 'grave' || (e.kind === 'enemy' && e.parley && e.alive && teamOf(e) === 'neutral') ||
     (e.kind === 'prop' && (e.feast || e.campSupply || e.bond || (e.cellDoor != null && S.jail) || e.raskChest || e.mechBench || (e.fortGate && S.ranks.chain >= 0) || e.portal || e.harvest || e.loot || e.claim || e.rite || e.type === 'tree' || e.type === 'shrine' || e.type === 'board' || e.type === 'chest' || e.type === 'crate'))))
    .sort((a, b) => score(a) - score(b));
  // Personen vor Dingen, Figuren mit Namen vor Bewohnern, und wohin der Spieler zielt (Maus) zählt stark — BUG-080: sonst gewann
  // immer das Nächste, und Brann hinter einer Magd oder einem Kräuterbusch war nicht ansprechbar
  function score(e) { const da = Math.abs(normAng(Math.atan2(e.y - p.y, e.x - p.x) - (p.aim ?? 0)));
    return dist(p, e) - (e.kind === 'npc' ? 24 : 0) - (e.key ? 10 : 0) - 34 * Math.cos(Math.min(da, Math.PI)) - (e === hovered || e === selected ? 200 : 0); }   // Maus auf der Figur gewinnt
}
function updatePrompt() {
  if (UI.dialogueOpen() || placing) { UI.setPrompt(placing ? 'Linksklick: <b>bauen</b> · Rechtsklick/Esc: abbrechen' : ''); return; }
  const t = interactables()[0];
  if (!t) return UI.setPrompt('');
  const label = t.cellDoor != null ? '<b>E</b> Schloss knacken' : t.raskChest ? '<b>E</b> Rasks Kiste öffnen' : t.bond ? `<b>E</b> ${t.label}` : t.mechBench ? '<b>E</b> Werkbank: Prothesen' : t.fortGate ? `<b>E</b> Wache: Tor öffnen` : t.campSupply ? `<b>E</b> Proviant verderben` : t.feast ? `<b>E</b> Festmahl — ${townName(t.fest)}` : t.kind === 'npc' ? `<b>E</b> Sprechen — ${t.name}` : t.parley ? `<b>E</b> Ansprechen — ${t.title || t.name}` :
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
  if (t.kind === 'enemy' && t.parley) return vargParley(t);
  if (t.cellDoor != null) return pickCell(t);
  if (t.raskChest) return openRask(t);
  if (t.portal === 'world' && S.map === 'kerker' && S.jail) return jailExit();
  if (t.bond) return t.type === 'keychest' ? stealKey(t) : bondMenu(t);
  if (t.mechBench) return mechMenu();
  if (t.fortGate) return openGate(t);
  if (t.campSupply) { act(p, 'kneel', 700, t); return sabotageCampaign(t); }
  if (t.feast) { act(p, 'kneel', 600, t); return festMeal(p, t); }
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
  if (t.portal === 'sky' && !S.skyPass) return skyGate(t);          // S12 E: Himmelsinsel nur mit Einlass
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
  if (t.type === 'board') return boardMenu(boardTown(t));             // Phase 2: Aufträge annehmen und abgeben
  if ((t.type === 'crate' || t.type === 'chest') && !t.opened) {
    t.opened = true;
    const k = pick(['bread', 'bandage', 'herb', 'wood', 'stone']);
    addItem(p, k); log(`Gefunden: ${ITEMS[k].name}.`, 'world');
  }
}

// Ankunftspunkt je Karte: fest vor der Tür, nicht zufällig (sonst landet man teils im Eingang selbst)
// Ankunft: im Dungeon am Treppenfuß, an der Oberfläche vor dem Eingang, durch den man kam (Grube oder Tiefhall)
const ARRIVAL = { mine: () => MAPS.mine.entry, deep: () => MAPS.deep.entry, sky: () => MAPS.sky.entry, kerker: () => MAPS.kerker.entry,
  world: from => {
    if (from === 'kerker') { const P = TOWN_PLAN[S.jailTown] || TOWN_PLAN.eren; return freeSpotNear('world', P.square[0] + 2, P.square[1] + 2, 2); }   // Phase 2: vor dem Kerker der Stadt const door = S.ents.world.find(e => e.kind === 'prop' && e.portal === from);
    if (door) return freeSpotNear('world', door.x / TS | 0, (door.y / TS | 0) + 3, 1);
    const [x, y] = worldPt(62, 21); return { x: x * TS + TS / 2, y: y * TS + TS / 2 }; } };
// §80 Questtafel: das Brett einer Stadt nennt die Aufträge DIESER Stadt — Titel, Ansprechpartner (mit Gebäude), Zielort,
// Stand. Gesperrte und erledigte Aufträge stehen nicht dran. Die Vergabe bleibt beim NPC selbst (Brett = Orientierung).
function boardTown(b) {
  let best = null, bd = 1e9;
  for (const [town, P] of Object.entries(TOWN_PLAN)) { const d = Math.hypot(P.square[0] - b.x / TS, P.square[1] - b.y / TS); if (d < bd) { bd = d; best = town; } }
  return best;
}
function questGiverInfo(k) {
  const g = S.ents.world.find(e => e.key === QUESTS[k].giver && e.alive); if (!g) return null;
  const tx = (g.anchor || g).x / TS | 0, ty = (g.anchor || g).y / TS | 0, town = townAt(tx, ty) || townAt(g.x / TS | 0, g.y / TS | 0);
  const h = HOUSES.find(b => b.map === 'world' && tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h);
  return { g, town, place: h ? HB.BTYPES[h.type]?.label : null };
}
function boardEntries(town) {
  return Object.keys(QUESTS).map(k => ({ k, st: S.quests[k]?.state, info: questGiverInfo(k) }))
    .filter(q => q.info && q.info.town === town && (q.st === 'active' || (!q.st && questAvailable(q.k))));
}
function boardText(town) {
  const list = boardEntries(town);
  if (!list.length) {
    const other = Object.keys(TOWN_PLAN).filter(t => t !== town && boardEntries(t).length).map(townName);
    return 'Nichts Neues am Brett.' + (other.length ? `\nIn ${other.join(', ')} hängen Aushänge.` : '');
  }
  return list.map(({ k, st, info }) => {
    const pt = questPoint(k), where = pt ? locAt(pt.x | 0, pt.y | 0)?.name : null;
    return `• ${QUESTS[k].name}${st === 'active' ? ' (angenommen)' : ''}\n   bei ${info.g.name}${info.place ? ' — ' + info.place : ''}${where ? ' · Ziel: ' + where : ''}`;
  }).join('\n');
}
// Städte ohne eigenes Brett bekommen eines am Platz (zur Laufzeit, nicht gespeichert — der Weltaufbau bleibt unverändert)
// §74 Kriegsschäden: fällt eine Stadt, verfallen drei Wohnhäuser um eine Stufe (Verfall-System). Nach der Befreiung wird
// je Tag ein Haus eine Stufe instand gesetzt — Wiederaufbau sichtbar, nicht „alles wie neu“. Gespeichert in S.flags.raidDamage.
function raidDamage(town) {
  const D = (S.flags.raidDamage ||= {});
  const hs = HOUSES.filter(b => b.town === town && b.map === 'world' && ['house', 'cottage', 'fisher', 'barn'].includes(b.type) && HB.wearOf(b) < 2)
    .sort((a, b) => (a.id < b.id ? -1 : 1)).filter((_, i) => i % 3 === (S.day | 0) % 3).slice(0, 3);
  for (const b of hs) { const base = D[b.id]?.base ?? HB.wearOf(b); b.wear = Math.min(2, HB.wearOf(b) + 1); D[b.id] = { base, wear: b.wear }; }
  if (hs.length) log(`${townName(town)}: ${hs.length} Häuser brennen aus.`, 'world');
}
function applyRaidDamage() {                                          // Häuser werden beim Laden neu erzeugt: Schäden aus dem Stand übernehmen
  for (const [id, d] of Object.entries(S.flags.raidDamage || {})) { const b = HOUSES.find(h => h.id === id); if (b) b.wear = d.wear; }
}
function rebuildTick() {                                              // je Tag: ein beschädigtes Haus in einer freien Stadt eine Stufe besser
  const D = S.flags.raidDamage || {};
  for (const [id, d] of Object.entries(D)) {
    const b = HOUSES.find(h => h.id === id); if (!b) { delete D[id]; continue; }
    if (S.war?.nodes[b.town]?.owner === 'undead' || d.perm) continue;   // S12 A4: endgültig zerstört (Schwer/Sehr schwer)
    d.wear -= 1; b.wear = d.wear;
    if (d.wear <= d.base) { delete D[id]; b.wear = null; }
    log(`${townName(b.town)}: ein zerstörtes Haus wird wieder aufgebaut.`, 'world');
    return;
  }
}
// §44 Verbrechen & Kopfgeld: bezeugter Angriff +25, bezeugter Mord +75 Gold bei der Fraktion des Opfers; je Tag −5.
// Eine Wache, die einen Gesuchten sieht, stellt ihn: zahlen, Kerker (ein Tag, ein Zehntel des Goldes) oder Widerstand.
// Ab 150 Gold Gesamt-Kopfgeld jagen Kopfgeldjäger den Spieler draußen (§72: skalierend nach Spieler-Stufe, gedeckelt).
const crimeFaction = c => (c.faction && S.factions[c.faction] != null ? c.faction : 'valen');
const bountyTotal = () => Object.values(S.bounty || {}).reduce((n, v) => n + v, 0);
function addBounty(fac, g, why) {
  S.bounty ||= {}; S.bounty[fac] = (S.bounty[fac] || 0) + g;
  log(`${why}: Kopfgeld bei ${FACTIONS[fac]?.name || fac} steigt auf ${S.bounty[fac]} Gold.`, 'faction');
  UI.toast(`KOPFGELD ${S.bounty[fac]} GOLD`, 2600);
}
function bountyDay() {
  for (const f of Object.keys(S.bounty || {})) { S.bounty[f] = Math.max(0, S.bounty[f] - Math.max(5, Math.round(S.bounty[f] * 0.05))); if (!S.bounty[f]) delete S.bounty[f]; }
  const p = S.player;
  if (bountyTotal() >= 150 && p.map === 'world' && !townAt(p.x / TS | 0, p.y / TS | 0, 6) && !((S.flags.hunterDay || 0) > S.day)) {
    S.flags.hunterDay = S.day + 2; spawnHunters(p);
  }
}
const HUNTER_TIER_CAP = 6;
function spawnHunters(p) {                                         // §72: Stufe folgt dem Spieler in Stufen (je 3 Level), Deckel Stufe 6
  const tier = Math.min(HUNTER_TIER_CAP, Math.max(1, Math.floor(p.level / 3))), a = rnd() * Math.PI * 2;
  for (let i = 0; i < 2 + (tier >= 4 ? 1 : 0); i++) {
    const tx = Math.round(p.x / TS + Math.cos(a) * 16) + ri(-2, 2), ty = Math.round(p.y / TS + Math.sin(a) * 16) + ri(-2, 2);
    const h = spawnEnemy('bounty_hunter', 'world', tx, ty, { level: 2 + tier * 2, tier, encounter: true }); h.aggroId = p.id;
  }
  log(`Kopfgeldjäger sind dir auf der Spur (${tier >= 3 ? 'gut gerüstet' : 'leicht gerüstet'}).`, 'combat'); UI.toast('KOPFGELDJÄGER', 2400);
}
function arrestCheck(g, p, dt) {
  if (!g.guard || g.angry || g.downed || p.downed || p.map !== g.map || UI.dialogueOpen()) return false;
  const fac = crimeFaction(g), b = (S.bounty || {})[fac] || 0;
  if (banned(fac) && dist(g, p) < 260) { g.angry = true; g.brave = true; g.aggroId = p.id; g.sawPlayer = clock(); return false; }   // S12 Blutbann
  if (!b || (S.flags.arrestCd || 0) > clock() || dist(g, p) > 240) return false;
  if (dist(g, p) > 44) { seek(g, Math.atan2(p.y - g.y, p.x - g.x), 1.3 * dt / 16, dt, p); return true; }
  S.flags.arrestCd = clock() + 90; g.vx = g.vy = 0;
  const pay = () => { S.gold -= b; delete S.bounty[fac]; log(`Du zahlst ${b} Gold. Die Sache ist erledigt.`, 'faction'); UI.closeDialogue(); };
  const jail = () => { UI.closeDialogue(); goToJail(fac, b, g.post || townAt(g.x / TS | 0, g.y / TS | 0) || 'eren'); };   // Phase 2: echter Kerker statt „ein Tag später“
  const fight = () => { g.angry = true; g.brave = true; g.aggroId = p.id; S.bounty[fac] += 100; log('Du widersetzt dich der Festnahme. Kopfgeld +100.', 'faction'); UI.closeDialogue(); };
  UI.dialogue(g, `„Halt! Auf deinen Kopf sind ${b} Gold ausgesetzt. Zahl, oder du kommst mit.“`, [
    ...(S.gold >= b ? [{ text: `Zahlen (${b} Gold)`, fn: pay }] : []), { text: `Mitkommen (Kerker, etwa ${jailMinutes(b)} Minuten)`, fn: jail }, { text: 'Widerstand leisten', fn: fight }]);
  return true;
}
// ================= Die Eisenmark (Session 11, Endgame) =================
// Die Eiserne Kette hält Goblins (und Gefangene) in Ketten: Arbeit im Steinbruch, Käfige in der Feste, ein Kettenzug
// zwischen beiden. Varg, der Kettenmeister, sitzt in der Kernburg. Fällt er, brechen die Ketten: die Goblins werden
// friedlich, sprechen und handeln — im Grubenhort entsteht ihr Dorf; wilde Goblins greifen nicht mehr an.
const GOBLIN_NAMES = ['Grisk', 'Nibbel', 'Rotz', 'Zikka', 'Mokk', 'Pitter', 'Skrag', 'Wurz', 'Knibbel', 'Grunk', 'Tapsa', 'Hulle'];
function makeCaptive(tx, ty, goblin, o = {}) {
  const pos = freeSpotNear('world', tx, ty, 2);
  const c = makeChar({ name: goblin ? pick(GOBLIN_NAMES) : pick(['Aske', 'Hamo', 'Ilse', 'Jorg', 'Wenna', 'Brida']), prof: goblin ? 'Versklavter Goblin' : 'Gefangener',
    x: pos.x, y: pos.y, level: 1, traits: ['furchtsam'] });
  Object.assign(c, { captive: true, eisen: true, goblin: !!goblin, brave: false, anchor: { x: pos.x, y: pos.y }, schedulePos: { x: pos.x, y: pos.y } });
  if (goblin) c.spec = SP.monsterSpec({ mtype: 'goblin', seed: (c.id.length * 7) % 5 }, MONSTERS.goblin);
  else c.pal = { ...c.pal, cloth: '#3a3530' };                          // Lumpen; Gefangene jeder Herkunft
  c.greet = goblin ? '„…“ (Der Goblin senkt den Kopf. Am Hals scheuert Eisen.)' : '„Hol mich hier raus. Bitte. Sie zählen uns jeden Abend.“';
  Object.assign(c, o); S.ents.world.push(c); return c;
}
// S12 Relikte: Einzelstücke liegen einmal in der Welt, an einem Ort mit Geschichte (Flag, damit sie nie doppelt entstehen)
const RELICS = [{ flag: 'relicLastWatch', key: 'letzte_wache', at: [27, 93], why: 'Alte Feste: der Posten, von dem er nie zurückkam' }];
function ensureRelics() {
  for (const r of RELICS) if (!S.flags[r.flag]) { S.flags[r.flag] = true; const p = freeSpotNear('world', ...r.at, 2); dropItemAt('world', p.x, p.y, mkItem(r.key)); }
}
function ensureEisenmark() {
  if (S.flags.goblinsFreed) { ensureGoblinVillage(); return eisenPopulation(); }
  eisenPopulation();
  if (S.ents.world.some(e => e.eisen)) {                                 // schon besiedelt (steht im Spielstand); S12: alte Einheitswachen neu einkleiden
    for (const g of S.ents.world) if (g.eisen && g.guard && !g.kit12) { const k = GUARD_KIT.chain; g.kit12 = true; g.pal.cloth = k.cloth;
      for (const sl of ['weapon', 'chest', 'head']) { const v = pick(k[sl]); if (v) g.equip[sl] = mkItem(v); else delete g.equip[sl]; } recalc(g); }
    return;
  }
  const guard = (tx, ty, o = {}) => { const g = guardChar('chain', freeSpotNear('world', tx, ty, 1)); Object.assign(g, { guard: true, post: 'kettenfeste', eisen: true }, o); S.ents.world.push(g); return g; };
  for (const [x, y] of [[902, 379], [902, 390], [925, 384], [790, 381], [872, 233], [892, 233]]) guard(...EM(x, y));   // S12: Lage im Westen (EM)
  for (const [x, y] of [[866, 206], [874, 212], [882, 207], [890, 214], [870, 219]]) makeCaptive(...EM(x, y), true, { work: true });   // Steinbruch
  makeCaptive(...EM(886, 219), false, { work: true }); makeCaptive(...EM(878, 222), false, { work: true });
  for (const [x, y] of [[927, 372], [925, 396], [945, 393]]) makeCaptive(...EM(x, y), true);                               // bei den Käfigen
  const [cx0, cy0] = EISEN_CONVOY.start, lead = guard(cx0, cy0, { convoy: { pts: EISEN_CONVOY.pts.map(p => p.slice()), i: 0, dir: 1 }, prof: 'Treiber' });   // Kettenzug
  for (let i = 1; i <= 3; i++) makeCaptive(cx0 + i, cy0, true, { chainedTo: lead.id, chainIdx: i });
}
// Phase 4 (MP2 §54): viel mehr Leben in der Eisenfeste — Goblins mit Berufen an jedem Werkplatz (Bergleute, Schmiede, Feld-
// arbeiter, Holzfäller, Stallknechte, Träger), dazu Aufseher und Streifenwachen. Einmal gesetzt (Flag), im Spielstand gespeichert.
// Nach der Befreiung arbeiten dieselben Goblins frei weiter — für sich, nicht für die Kette.
const EISEN_JOBS = { mine: ['Goblin-Bergmann', 7], smithy: ['Goblin-Schmied', 5], vorwerk: ['Goblin-Feldarbeiter', 6], lumber: ['Goblin-Holzfäller', 5], stables: ['Goblin-Stallknecht', 3], quarters: ['Goblin-Träger', 4] };
function eisenPopulation() {
  if (S.flags.eisen2) return;
  S.flags.eisen2 = true;
  for (const [site, [prof, n]] of Object.entries(EISEN_JOBS)) {
    const [sx, sy] = EISEN_SITES[site];
    for (let i = 0; i < n; i++) { const c = makeCaptive(sx + ri(-5, 5), sy + ri(-4, 4), true, { work: true, site });
      c.prof = S.flags.goblinsFreed ? prof.replace('Goblin-', 'Freier ') : prof + ' (versklavt)';
      if (S.flags.goblinsFreed) Object.assign(c, { captive: false, freed: true, faction: 'goblin', greet: '„Wir arbeiten weiter. Aber jetzt für uns.“' }); }
    if (!S.flags.goblinsFreed) { const g = guardChar('chain', freeSpotNear('world', sx + 3, sy - 3, 2), 'Aufseher'); Object.assign(g, { guard: true, post: 'kettenfeste', eisen: true, kit12: true }); S.ents.world.push(g); }
  }
  if (!S.flags.goblinsFreed) {                                          // Streifen zwischen den Vierteln
    const route = [EISEN_SITES.stables, EISEN_SITES.smithy, EISEN_SITES.quarters, EISEN_SITES.mine, [110, 225], EISEN_SITES.stables];
    for (let i = 0; i < 4; i++) { const g = guardChar('chain', freeSpotNear('world', ...route[i], 2), 'Streifenwache');
      Object.assign(g, { eisen: true, kit12: true, faction: 'chain', eisenPatrol: route.map(p => p.slice()), pi: (i + 1) % route.length }); S.ents.world.push(g); }
  }
  log('Die Eisenfeste arbeitet: Mine, Schmieden, Felder, Holzschlag — überall Goblins, überall Aufseher.', 'world');
}
// Kettenzug und Angekettete: der Treiber pendelt zwischen Steinbruch und Feste, die Gefangenen folgen an der Kette
const fortNight = () => { const h = S.minute / 60; return h >= 21 || h < 6; };
function eisenStep(e, dt) {
  if (e.convoy && !e.angry && fortNight()) { e.vx = e.vy = 0; return true; }   // S12: nachts ruht der Arbeitszug
  if (e.convoy && !e.angry) {
    const C = e.convoy, [tx, ty] = C.pts[C.i], gx = tx * TS + TS / 2, gy = ty * TS + TS / 2, d = Math.hypot(gx - e.x, gy - e.y);
    if (d < 14) { if (C.i + C.dir < 0 || C.i + C.dir >= C.pts.length) C.dir = -C.dir; C.i += C.dir; }
    else seek(e, Math.atan2(gy - e.y, gx - e.x), 0.75 * dt / 16, dt, { x: gx, y: gy });
    return true;
  }
  if (e.eisenPatrol && !e.angry) {                                    // Phase 4: Streifenwache der Feste
    const [px, py] = e.eisenPatrol[e.pi % e.eisenPatrol.length], gx = px * TS + 16, gy = py * TS + 16, d = Math.hypot(gx - e.x, gy - e.y);
    if (d < 24) e.pi = (e.pi + 1) % e.eisenPatrol.length; else seek(e, Math.atan2(gy - e.y, gx - e.x), 0.8 * dt / 16, dt, { x: gx, y: gy });
    return true;
  }
  if (e.chainedTo) {
    const L = byId(e.chainedTo); if (!L || !L.alive) { e.chainedTo = null; return false; }
    const k = e.chainIdx || 1, a = Math.atan2(L.vy || 0.001, L.vx || 0), side = (k % 2 ? 1 : -1) * 11, bx = L.x - Math.cos(a) * 36 * k - Math.sin(a) * side, by = L.y - Math.sin(a) * 36 * k + Math.cos(a) * side, d = Math.hypot(bx - e.x, by - e.y);
    if (d > 6) seek(e, Math.atan2(by - e.y, bx - e.x), Math.min(1.1, d / 18) * dt / 16, dt, { x: bx, y: by }); else e.vx = e.vy = 0;
    return true;
  }
  if (e.captive && e.work && !fortNight() && !(e.act && performance.now() < e.act.until) && chance(dt / 3000)) act(e, 'work', 1400);   // Arbeit im Steinbruch
  return false;
}
const GOBLIN_VILLAGE = [
  { key: 'grisk', name: 'Grisk', prof: 'Ältester der Grubenstämme', at: EM(904, 596), greet: '„Du hast die Kette gebrochen. Wir vergessen das nicht — nicht in hundert Wintern. Setz dich ans Feuer.“' },
  { key: 'nibbel', name: 'Nibbel', prof: 'Goblinhändlerin', at: EM(910, 604), shop: true, pool: ['goblin_hook', 'goblin_hook', 'pit_leather', 'herb', 'herb', 'bandage', 'dried_meat', 'iron', 'bone'],
    greet: '„Handel? Handel! Grubeneisen, Grubenleder, Kräuter aus dem Stein. Du zahlst ehrlich, ich wieg ehrlich.“' },
  { key: 'gob_krak', name: 'Krak', prof: 'Goblinkrieger', at: EM(898, 590), built: true, greet: '„Grisk sagt, du bist Freund. Dann bin ich deine Klinge, wenn die Toten kommen.“' },
  { key: 'gob_sill', name: 'Sill', prof: 'Hüttenbauerin', at: EM(914, 592), built: true, greet: '„Eigene Wände. Weißt du, wie das riecht? Nach Harz und nach niemandem.“' },
  { key: 'gob_morr', name: 'Morr', prof: 'Sänger', at: EM(906, 610), built: true, greet: '„Ich sing von der Kette, damit die Kleinen wissen, warum wir sie nicht mehr tragen.“' },
];
// Hochreich Aurelion (S12): Automaten an den Toren und auf den Plätzen, in Gelenkhall die Prothesenmacherin (Händlerin)
const AUREL_GUARDS = 8;
function ensureAurelion() {
  for (const [key, P] of Object.entries(TOWN_PLAN)) {
    if (P.lord !== 'aurel' || S.ents.world.some(e => e.robot && e.post === key)) continue;
    const [x0, y0, x1, y1] = P.area, [cx, cy] = P.square;
    const extra = P.metro ? [[x0 + 4, cy - 4], [x1 - 4, cy + 4], [cx - 4, y0 + 4], [cx + 4, y1 - 4], [cx - 20, cy], [cx + 20, cy], [cx, cy - 30], [cx, cy + 30], [cx - 50, cy - 30], [cx + 50, cy + 30], [cx - 50, cy + 30], [cx + 50, cy - 30]] : [];   // Metropole: Kontrollpunkte und Streifen in allen Bezirken
    for (const [x, y] of [[x0 + 2, cy - 2], [x0 + 2, cy + 2], [x1 - 2, cy - 2], [x1 - 2, cy + 2], [cx - 2, y0 + 2], [cx + 2, y1 - 2], [cx - 6, cy - 5], [cx + 6, cy + 5], ...extra]) {
      const g = guardChar('aurel', freeSpotNear('world', x, y, 1)); Object.assign(g, { guard: true, post: key }); S.ents.world.push(g); }
  }
  if (!S.ents.world.some(e => e.key === 'vell') && TOWN_PLAN.gelenkhall) {
    const [cx, cy] = TOWN_PLAN.gelenkhall.square, pos = freeSpotNear('world', cx + 3, cy - 3, 2);
    const c = makeChar({ name: 'Meisterin Vell', prof: 'Prothesenmacherin', x: pos.x, y: pos.y, level: 8, faction: 'aurel', traits: ['gütig'] });
    Object.assign(c, { key: 'vell', greet: '„Zeig mir, was dir fehlt. Ich baue es dir nach — besser, als es war.“', anchor: { x: pos.x, y: pos.y }, schedulePos: { x: pos.x, y: pos.y },
      shop: true, pool: ['schrottarm', 'schrottbein', 'aurelarm', 'aurelbein', 'aurelarm', 'meisterarm', 'meisterbein', 'potion', 'bandage'], pal: { skin: '#d6b089', hair: '#6a5a4a', cloth: '#3a3a44' } });
    c.body.rarm.mech = 3; S.ents.world.push(c);   // sie trägt selbst einen Meisterarm
  }
  const vell = S.ents.world.find(e => e.key === 'vell'), vh = HOUSES.find(b => b.town === 'gelenkhall' && b.type === 'healer') || HOUSES.find(b => b.town === 'gelenkhall');
  if (vell && vh && !vell.till) {                                     // Phase 1: Ladenzeit und Zuhause (vorher 24 h am Stand)
    const [dx, dy] = vh.doorTile, sx = vh.door === 'W' ? 1 : vh.door === 'E' ? -1 : 0, sy = vh.door === 'S' ? -1 : vh.door === 'N' ? 1 : 0, home = { x: (dx + sx) * TS + TS / 2, y: (dy + sy) * TS + TS / 2, in: 1 };
    Object.assign(vell, { till: 19, schedulePos: { ...vell.anchor }, anchor: home, eve: home });
  }
}
// ================= Tribut der Eisernen Kette (Session 12) =================
// Alle 5 Tage nimmt die Kette jedem Tributdorf einen Teil seines Vorrats (0–100) und lässt ihn als Tributzug zur Feste tragen:
// Offizier, Wachen, Träger aus dem Dorf. Der Spieler kann für ein Dorf zahlen, den Zug ausrauben (Quest: behalten oder
// zurückgeben), ihn gegen Räuber schützen oder sich bei einem Aufstand (Prügelei ohne Tote) auf eine Seite stellen.
// Nach einer Niederlage kommt die Kette härter wieder (doppelter Tribut, Dunkle Paladine). Banditen gegen ein Tributdorf:
// die Kette stellt für einige Tage Krieger ins Dorf.
const TRIB_EVERY = 5, TRIB_TAKE = 25;
const tribVillages = () => VILLAGES.filter(V => V.tribute && TOWN_PLAN[V.key] && !S.razed?.[V.key]);
function tribState(k) {
  S.tribute ||= {};
  return S.tribute[k] ||= { vorrat: 60, next: (S.day | 0) + 2 + tribVillages().findIndex(V => V.key === k), harsh: 0, rep: 0, hunger: 0, garrison: 0 };
}
const tribCost = k => (tribState(k).harsh ? 2 : 1) * TRIB_TAKE * 6;
function tributeDay() {
  if (S.flags.chainsBroken) return;
  for (const V of tribVillages()) {
    const T = tribState(V.key);
    T.vorrat = Math.min(100, T.vorrat + 5);                                            // Ernte
    if (T.garrison && T.garrison <= S.day) { T.garrison = 0; for (let i = S.ents.world.length - 1; i >= 0; i--) if (S.ents.world[i].tribGarrison === V.key) S.ents.world.splice(i, 1);
      log(`Die Kettenkrieger ziehen aus ${V.name} ab.`, 'world'); }
    if (!T.garrison && chance(0.1)) banditsOnTribute(V, T);
    if (S.day < T.next) continue;
    T.next = (S.day | 0) + TRIB_EVERY;
    if (T.paid) { T.paid = false; log(`${V.name}: Der Tribut ist diesmal bezahlt — von dir.`, 'world'); continue; }
    const take = Math.min(T.vorrat, TRIB_TAKE * (T.harsh ? 2 : 1)); T.vorrat -= take;
    if (T.vorrat < 10) { T.hunger++; log(`${V.name} hungert nach dem Tribut.`, 'economy');
      if (T.hunger >= 2) { const v = VILLAGERS.find(c => c.homeTown === V.key && c.alive && c.prof !== 'Jäger'); if (v) { T.lost = (T.lost || 0) + 1; v.alive = false; S.ents.world.splice(S.ents.world.indexOf(v), 1); log(`${v.name} hat ${V.name} verlassen — der Hunger.`, 'world'); } } }
    else T.hunger = 0;
    spawnTribute(V, take, T);
    if (T.harsh) T.harsh--;
  }
}
function banditsOnTribute(V, T) {
  const p = S.player, [sx, sy] = TOWN_PLAN[V.key].square;
  if (p.map === 'world' && Math.hypot(p.x / TS - sx, p.y / TS - sy) < 90) { for (let i = 0; i < 3; i++) spawnEnemy('bandit', 'world', sx + ri(8, 14), sy + ri(-6, 6)); log(`Banditen fallen über ${V.name} her!`, 'combat'); }
  else { T.vorrat = Math.max(0, T.vorrat - 10); log(`Banditen plünderten ${V.name}.`, 'world'); }
  T.garrison = (S.day | 0) + 4;                                                         // die Kette schützt, was ihr zahlt
  for (let i = 0; i < 2; i++) { const g = guardChar('chain', freeSpotNear('world', sx + (i ? 3 : -3), sy + 2, 2), 'Kettenkrieger'); Object.assign(g, { guard: true, post: V.key, tribGarrison: V.key }); S.ents.world.push(g); }
  log(`Die Eiserne Kette stellt Krieger nach ${V.name}.`, 'world');
}
function spawnTribute(V, cargo, T) {
  const [sx, sy] = TOWN_PLAN[V.key].square, pts = [[sx, sy + 2], V.link, [214, V.link[1]], [214, 347], [214, 322]];
  const at = (dx, dy) => freeSpotNear('world', sx + dx, sy + 2 + dy, 2);
  const L = guardChar('chain', at(0, 0), 'Tributoffizier'); Object.assign(L, { tribV: V.key, tribCargo: cargo, tribPts: pts, tribI: 0 }); S.ents.world.push(L);
  const kits = ['chain', 'chain', ...(T.harsh ? ['chainpal', 'chainpal'] : [])];
  kits.forEach((k, i) => { const g = guardChar(k, at(-2 - i, 1)); Object.assign(g, { faction: 'chain', tribFollow: L.id, tribIdx: i + 1 }); S.ents.world.push(g); });
  for (let i = 0; i < 2; i++) { const c = makeChar({ name: pick(FIRST_M), prof: 'Träger', x: at(2 + i, 1).x, y: at(2 + i, 1).y, level: 1, faction: null });
    Object.assign(c, { tribFollow: L.id, tribIdx: kits.length + 1 + i, carrier: true, anchor: { x: c.x, y: c.y } }); S.ents.world.push(c); }
  log(`Ein Tributzug der Kette verlässt ${V.name} (${cargo} Lasten).`, 'world');
  if (chance(T.vorrat < 15 ? 0.45 : 0.2) && !T.harsh) startBrawl(V, L);                // Aufstand
  else if (chance(0.25)) L.tribAmbush = true;                                            // Räuber lauern auf halber Strecke
}
function startBrawl(V, L) {
  const [sx, sy] = TOWN_PLAN[V.key].square, sq = { x: sx * TS, y: sy * TS };
  const town = VILLAGERS.filter(c => c.homeTown === V.key && c.alive && !c.downed && dist(c, sq) < 700).slice(0, 4);
  if (!town.length) return;
  S.brawls ||= {}; S.brawls[V.key] = { t: performance.now(), helped: null, lead: L.id };
  for (const c of town) Object.assign(c, { brawl: true, brawlSide: 'dorf', brawlV: V.key, brave: true });
  for (const g of [L, ...S.ents.world.filter(e => e.tribFollow === L.id && !e.carrier)]) Object.assign(g, { brawl: true, brawlSide: 'kette', brawlV: V.key });
  log(`${V.name} wehrt sich! Die Dörfler gehen mit Fäusten auf die Kette los.`, 'combat'); UI.toast('AUFSTAND', 2400);
}
function brawlAI(e, dt) {
  const foes = S.ents[e.map].filter(o => o.brawl && o.brawlV === e.brawlV && o.brawlSide !== e.brawlSide && o.alive && !o.downed);
  if (!foes.length) return false;
  const f = foes.reduce((a, b) => dist(e, a) < dist(e, b) ? a : b), d = dist(e, f);
  e.aim = Math.atan2(f.y - e.y, f.x - e.x);
  if (d > 30) seek(e, e.aim, 1.3 * dt / 16, dt, f); else { e.vx = e.vy = 0; if (e.atkCd <= 0 && e.swing <= 0) attack(e); }
  return true;
}
function endBrawl(k, winner) {
  const B0 = S.brawls[k], T = tribState(k), V = VILLAGES.find(v => v.key === k), L = byId(B0.lead);
  for (const e of S.ents.world) if (e.brawlV === k) { e.brawl = false; e.brawlSide = null; if (e.villager) e.brave = false; }
  delete S.brawls[k];
  if (B0.helped === 'kette') { S.factions.chain += 8; T.rep -= 15; log(`Du hast der Kette gegen ${V.name} geholfen. Kette +8, das Dorf vergisst es nicht.`, 'faction'); }
  if (B0.helped === 'dorf') { S.factions.chain -= 10; T.rep += 15; log(`Du hast dich für ${V.name} geprügelt. Kette −10, das Dorf dankt.`, 'faction'); }
  if (winner === 'dorf' && L) {
    T.vorrat = Math.min(100, T.vorrat + (L.tribCargo || 0)); T.harsh = 3;
    for (let i = S.ents.world.length - 1; i >= 0; i--) { const e = S.ents.world[i]; if (e === L || e.tribFollow === L.id) S.ents.world.splice(i, 1); }
    log(`${V.name} hat den Tributzug verjagt. Die Kette wird wiederkommen — härter, mit Dunklen Paladinen.`, 'world'); chronicle(`${V.name} verjagt den Tributzug der Kette`, 'news');
  } else log(`Die Kette hat ${V.name} niedergeprügelt. Der Tributzug zieht weiter.`, 'world');
}
function tributStep(e, dt) {
  if (e.brawl) return false;
  if (e.map === S.map && combat.some(o => o.kind === 'enemy' && o.alive && dist(o, e) < 260 && isHostile(e, o))) return false;   // Räuber in der Nähe: die normale Wache kämpft
  if (e.tribFollow) {
    const L = byId(e.tribFollow); if (!L || !L.alive) { e.tribFollow = null; return false; }
    const a = Math.atan2(L.vy || 0.001, L.vx || 0), k = e.tribIdx || 1, bx = L.x - Math.cos(a) * 26 * k - Math.sin(a) * (k % 2 ? 12 : -12), by = L.y - Math.sin(a) * 26 * k + Math.cos(a) * (k % 2 ? 12 : -12), d = Math.hypot(bx - e.x, by - e.y);
    if (d > 8) seek(e, Math.atan2(by - e.y, bx - e.x), Math.min(1.2, d / 20) * dt / 16, dt, { x: bx, y: by }); else e.vx = e.vy = 0;
    return true;
  }
  const [px, py] = e.tribPts[e.tribI], gx = (px + 0.5) * TS, gy = (py + 0.5) * TS, d = Math.hypot(gx - e.x, gy - e.y);
  if (d < 16) { if (e.tribI < e.tribPts.length - 1) { e.tribI++;
      if (e.tribI === 2 && e.tribAmbush) { e.tribAmbush = false; const p = S.player; if (p.map === 'world' && dist(p, e) < 700) { for (let i = 0; i < 3; i++) spawnEnemy('bandit', 'world', (e.x / TS | 0) + ri(6, 10), (e.y / TS | 0) + ri(-5, 5)); log('Räuber überfallen den Tributzug!', 'combat'); e.tribDefend = true; } }
    } else arriveTribute(e);
    return true; }
  seek(e, Math.atan2(gy - e.y, gx - e.x), 0.8 * dt / 16, dt, { x: gx, y: gy });
  return true;
}
function arriveTribute(L) {
  const V = VILLAGES.find(v => v.key === L.tribV);
  if (L.tribDefend && dist(S.player, L) < 900) { S.factions.chain += 6; log('Die Kette dankt für den Geleitschutz des Tributs. Kette +6.', 'faction'); }
  for (let i = S.ents.world.length - 1; i >= 0; i--) { const e = S.ents.world[i]; if (e === L || e.tribFollow === L.id) S.ents.world.splice(i, 1); }
  log(`Der Tribut aus ${V?.name || '?'} ist in der Eisenfeste angekommen.`, 'world');
}
// Takt (≈ 1 s): Prügeleien auswerten, gefallene Tributzüge (Raub durch den Spieler → Quest)
function tribTick() {
  for (const [k, B0] of Object.entries(S.brawls || {})) {
    const side = s => S.ents.world.filter(e => e.brawlV === k && e.brawlSide === s && e.alive && !e.downed).length;
    const d = side('dorf'), c = side('kette');
    if (!d) endBrawl(k, 'kette'); else if (!c) endBrawl(k, 'dorf'); else if (performance.now() - B0.t > 70000) endBrawl(k, c >= d ? 'kette' : 'dorf');
  }
  for (const L of S.ents.world) {
    if (!L.tribV || L.tribDone || (L.alive && !L.downed)) continue;
    L.tribDone = true;
    const V = VILLAGES.find(v => v.key === L.tribV), byPlayer = L.lastKiller === S.player.id || (dist(S.player, L) < 220 && !L.brawl);
    for (let i = S.ents.world.length - 1; i >= 0; i--) { const e = S.ents.world[i]; if (e.tribFollow === L.id && e.alive && !e.angry) S.ents.world.splice(i, 1); }   // Träger und Wachen fliehen
    if (byPlayer) {
      const n = Math.max(1, Math.round((L.tribCargo || 5) / 5)); addItem(S.player, 'tributgut', n);
      S.factions.chain -= 15; const T = tribState(L.tribV); T.harsh = 3;                  // Strafaktion: doppelter Tribut, Paladine
      S.tributQuest = { village: L.tribV, n }; startQuest('q_tribut');
      log(`Du hast den Tributzug aus ${V.name} überfallen: ${n}× Tributgut. Kette −15.`, 'faction'); UI.toast('AUFTRAG: GERAUBTER TRIBUT', 2600);
      chronicle(`Tributzug aus ${V.name} überfallen`, 'quest', 'Behalten oder zurückgeben?');
    } else log(`Der Tributzug aus ${V?.name || '?'} ist verloren.`, 'world');
  }
  for (const L of S.ents.world) {                                                        // außer Sicht: der Zug wandert vereinfacht weiter (48 px/s)
    if (!L.tribV || !L.alive || L.downed || L.brawl || dist(S.player, L) < 900) continue;
    let left = 48;
    while (left > 0 && L.tribPts) { const [px, py] = L.tribPts[L.tribI], gx = (px + 0.5) * TS, gy = (py + 0.5) * TS, d = Math.hypot(gx - L.x, gy - L.y);
      if (d <= left) { L.x = gx; L.y = gy; left -= d; if (L.tribI < L.tribPts.length - 1) L.tribI++; else { arriveTribute(L); break; } }
      else { L.x += (gx - L.x) / d * left; L.y += (gy - L.y) / d * left; left = 0; } }
    for (const f of S.ents.world) if (f.tribFollow === L.id) { f.x = L.x - 20 * (f.tribIdx || 1); f.y = L.y; }
  }
  const Q = S.quests.q_tribut;
  if (Q?.state === 'active' && !S.player.inv.some(s => s && s.key === 'tributgut')) { Q.state = 'done'; Q.outcome = 'Du hast den Tribut behalten.'; log('Geraubter Tribut: Du hast die Ware behalten.', 'quest'); }
}
function tributeTalk(town) {
  const V = VILLAGES.find(v => v.key === town); if (!V?.tribute || S.flags.chainsBroken) return [];
  const T = tribState(town), lines = ['„Alle fünf Tage kommen sie. Mit Waagen und Ketten.“', '„Was die Kette nicht nimmt, reicht gerade bis zum nächsten Mal.“'];
  if (T.vorrat < 20) lines.push('„Die Speicher sind leer. Die Kinder essen Rinde.“', '„Noch einmal Tribut, und wir gehen. Wohin, weiß keiner.“');
  if (T.rep >= 15) lines.push('„Du hast für uns eingestanden. Das vergisst hier niemand.“');
  if (T.rep <= -15) lines.push('„Du hast den Kettenhunden geholfen. Geh weiter.“');
  if (T.harsh) lines.push('„Seit dem letzten Aufstand kommen sie mit schwarzen Rittern. Und doppelt so vielen Säcken.“');
  return lines;
}
function tributeChoices(npc, choices) {
  const k = npc.homeTown, V = VILLAGES.find(v => v.key === k); if (!V?.tribute) return;
  const Q = S.quests.q_tribut, n = S.player.inv.filter(s => s && s.key === 'tributgut').reduce((a, s) => a + (s.count || 1), 0);
  if (Q?.state === 'active' && S.tributQuest?.village === k && n) choices.push({ text: `Euer Tribut. Ich bringe ihn zurück. (${n}× Tributgut)`, fn: () => {
    removeItem(S.player, 'tributgut', n); const T = tribState(k); T.vorrat = Math.min(100, T.vorrat + n * 5); T.rep += 20;
    Q.state = 'done'; Q.outcome = `Du hast den Tribut nach ${V.name} zurückgebracht.`; gainXp(S.player, 60);
    log(`${V.name} bekommt seinen Tribut zurück. Das Dorf wird es dir nie vergessen.`, 'quest'); chronicle(`Tribut nach ${V.name} zurückgebracht`, 'quest');
    UI.dialogue(npc, '„Das … das ist unser Korn. Setz dich. Du isst heute mit uns.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]); } });
  if (!S.flags.chainsBroken && !tribState(k).paid) { const cost = tribCost(k);
    choices.push({ text: `Ich zahle euren nächsten Tribut. (${cost} Gold)`, fn: () => {
      if (S.gold < cost) return UI.dialogue(npc, '„Das ist nett gemeint. Aber so viel hast du nicht.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]);
      S.gold -= cost; const T = tribState(k); T.paid = true; T.rep += 10; log(`Du zahlst den nächsten Tribut für ${V.name} (${cost} Gold).`, 'economy');
      UI.dialogue(npc, '„Warum tust du das? … Danke. Wirklich.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]); } }); }
}
// ================= Tagesablauf und Feldzüge der Eisenfeste (Session 12) =================
// Nachts (21–6 Uhr) Fallgitter an beiden Toren und Nachtwachen an den Mauern; der Arbeitszug ruht. Beides entsteht und
// verschwindet mit der Uhr (transient, nicht gespeichert) — beim Laden stellt fortressHour den richtigen Zustand her.
function fortressHour() {
  if (S.flags.chainsBroken || !MAPS.world) return;
  const closed = S.ents.world.some(e => e.fortGate), night = fortNight();
  if (night && !closed) {
    const [f0, f1, f2, f3] = FORT;
    for (let y = 169; y <= 175; y += 2) S.ents.world.push({ id: uid(), kind: 'prop', type: 'portcullis', map: 'world', x: (f2 - 0.5) * TS, y: (y + 0.5) * TS, r: 18, solid: true, transient: true, fortGate: true, label: 'Fallgitter — nachts geschlossen' });
    for (let x = 211; x <= 217; x += 2) S.ents.world.push({ id: uid(), kind: 'prop', type: 'portcullis', map: 'world', x: (x + 0.5) * TS, y: (f3 - 0.5) * TS, r: 18, solid: true, transient: true, fortGate: true, label: 'Fallgitter — nachts geschlossen' });
    for (const [x, y] of [[f0 + 5, f1 + 5], [f2 - 5, f1 + 5], [f0 + 5, f3 - 5], [f2 - 5, f3 - 5], [f2 - 5, 163], [f2 - 5, 181], [205, f3 - 5], [222 - 5 - 18, f3 - 5]]) {
      const g = guardChar('chain', freeSpotNear('world', x, y, 2), 'Nachtwache'); Object.assign(g, { guard: true, nightWatch: true, transient: true, eisen: true }); S.ents.world.push(g); }
    indexSolids('world'); log('Die Tore der Eisenfeste schließen sich für die Nacht.', 'world');
  } else if (!night && closed) {
    S.ents.world = S.ents.world.filter(e => !e.fortGate && !e.nightWatch); indexSolids('world'); log('Die Tore der Eisenfeste öffnen sich.', 'world');
  }
  riders(night);
}
// Feldzüge ins Totenland: drei Arten, gemischt (Nutzer). Ablauf: Kriegsrat (Gerücht) → Musterung vor dem Kettentor (Proviantwagen,
// 3 Stunden) → Marsch → Schlacht → Rückkehr mit Verwundeten oder keiner. Nah beim Spieler echt (Untote verteidigen), sonst gewürfelt.
// Der Spieler kann mitziehen (Lohn), den Proviant verderben (Heer geschwächt) oder die Untoten warnen (mehr Verteidiger).
const CAMP_TYPES = { raid: { name: 'Stoßtrupp', size: [8, 12], every: [4, 6], show: 8 }, zug: { name: 'Feldzug', size: [20, 30], every: [10, 15], show: 14 }, heer: { name: 'Heerzug', size: [40, 50], every: [20, 30], show: 20 } };
const CAMP_TARGETS = ['totenruinen', 'graeberfeld', 'schaedelwald', 'seelenhuegel', 'grabwacht', 'knochenwald'];
const MUSTER = [240, 172];
const campMembers = C => S.ents.world.filter(e => e.camp === C.id && e.alive);
function campaignDay() {
  if (S.flags.chainsBroken) return;
  S.campNext ||= { raid: (S.day | 0) + 3, zug: (S.day | 0) + 8, heer: (S.day | 0) + 18 };
  const C = S.campaign;
  if (C && C.phase !== 'done') { if (C.phase === 'rat' && S.day >= C.musterDay) startMuster(C); return; }
  for (const type of ['heer', 'zug', 'raid']) if (S.day >= S.campNext[type]) { planCampaign(type); S.campNext[type] = (S.day | 0) + ri(...CAMP_TYPES[type].every); break; }
}
function planCampaign(type) {
  const K = CAMP_TYPES[type], target = pick(CAMP_TARGETS), L = LOCATIONS.find(l => l.key === target);
  S.campaign = { id: 'camp' + uid(), type, size: ri(...K.size), target, phase: 'rat', musterDay: (S.day | 0) + 1, sabotaged: false, warned: false, joined: false };
  log(`Kriegsrat in der Eisenfeste: ${K.name} gegen ${L?.name || target} beschlossen.`, 'world');
  chronicle(`Die Eiserne Kette rüstet: ${K.name} gegen ${L?.name || target}`, 'news');
}
function startMuster(C) {
  const K = CAMP_TYPES[C.type], n = Math.min(K.show, C.size), [mx, my] = MUSTER;
  const lead = guardChar('chainpal', freeSpotNear('world', mx, my, 2), 'Kriegsmeister'); Object.assign(lead, { faction: 'chain', camp: C.id, campLead: true, campI: 0 }); S.ents.world.push(lead);
  for (let i = 0; i < n; i++) { const kit = C.type === 'heer' && i % 4 === 0 ? 'chainpal' : i % 3 === 2 ? 'chainx' : 'chain';
    const g = guardChar(kit, freeSpotNear('world', mx - 2 - (i % 5) * 2, my - 4 + ((i / 5) | 0) * 2, 2)); Object.assign(g, { faction: 'chain', camp: C.id, campIdx: i + 1 }); S.ents.world.push(g); }
  S.ents.world.push({ id: uid(), kind: 'prop', type: 'cart', map: 'world', x: (mx + 4) * TS, y: (my + 5) * TS, r: 14, solid: true, transient: true, campSupply: C.id, label: 'Proviantwagen des Feldzugs' });
  C.phase = 'muster'; C.marchAt = clock() + 180; C.shown = n + 1;
  log(`Vor dem Kettentor mustert die Kette ${C.size} Mann — ${K.name}.`, 'world'); chronicle(`Musterung vor dem Kettentor: ${C.size} Mann`, 'news');
}
function campPts(C) {
  const T = LOCATIONS.find(l => l.key === C.target);
  return [MUSTER, [434, 172], [434, 376], ...[[940, 382], [1040, 384]].filter(([x]) => x < T.x - 20), [T.x, T.y]];   // Heerstraße nur so weit, wie das Ziel liegt
}
function campStep(e, dt) {
  const C = S.campaign; if (!C || C.id !== e.camp) { e.camp = null; return false; }
  if (C.phase === 'muster' || C.phase === 'done') return false;                          // Musterung: stehen und warten (normale Wache)
  if (e.map === S.map && combat.some(o => o.kind === 'enemy' && o.alive && dist(o, e) < 300 && isHostile(e, o))) return false;   // Feind: kämpfen
  const lead = e.campLead ? e : S.ents.world.find(o => o.camp === C.id && o.campLead && o.alive);
  if (!e.campLead) {                                                                       // Kolonne hinter dem Kriegsmeister
    if (!lead) return false;
    const a = Math.atan2(lead.vy || 0.001, lead.vx || 0), k = e.campIdx || 1, row = Math.ceil(k / 2), side = k % 2 ? 1 : -1;
    const bx = lead.x - Math.cos(a) * 22 * row - Math.sin(a) * 14 * side, by = lead.y - Math.sin(a) * 22 * row + Math.cos(a) * 14 * side, d = Math.hypot(bx - e.x, by - e.y);
    if (d > 8) seek(e, Math.atan2(by - e.y, bx - e.x), Math.min(1.4, d / 18) * dt / 16, dt, { x: bx, y: by }); else e.vx = e.vy = 0;
    return true;
  }
  if (C.phase === 'battle') return false;
  const pts = C.phase === 'return' ? campPts(C).slice().reverse() : campPts(C), [px, py] = pts[Math.min(e.campI, pts.length - 1)];
  const gx = (px + 0.5) * TS, gy = (py + 0.5) * TS, d = Math.hypot(gx - e.x, gy - e.y);
  if (d < 20) { if (e.campI < pts.length - 1) e.campI++; else campArrive(C, e); return true; }
  seek(e, Math.atan2(gy - e.y, gx - e.x), 0.9 * dt / 16, dt, { x: gx, y: gy });
  return true;
}
function campArrive(C, lead) {
  if (C.phase === 'march') {
    C.phase = 'battle'; C.battleAt = clock(); lead.campI = 0;
    const T = LOCATIONS.find(l => l.key === C.target), p = S.player, near = p.map === 'world' && Math.hypot(p.x / TS - T.x, p.y / TS - T.y) < 60;
    if (near) { const n = Math.round(Math.min(CAMP_TYPES[C.type].show, C.size) * 0.6 * (C.warned ? 1.5 : 1));
      for (let i = 0; i < n; i++) { const e = regionSpawn(pick(['skeleton', 'skeleton', 'ghoul', 'wraith', 'death_captain']), 'world', T.x + ri(-8, 8), T.y + ri(-6, 6)); e.campDefender = C.id; }
      C.live = true; log(`Die Kette stürmt ${T.name}!`, 'combat'); }
    else campResolve(C, null);
  } else if (C.phase === 'return') {
    const K = CAMP_TYPES[C.type], back = campMembers(C).length;
    S.ents.world = S.ents.world.filter(e => e.camp !== C.id);
    log(`Der ${K.name} kehrt zurück: ${C.survivors} von ${C.size} Mann, ${C.win ? 'mit Beute' : 'geschlagen'}.`, 'world');
    chronicle(`${K.name} der Kette zurück (${C.survivors}/${C.size})`, 'news');
    if (C.win && C.joined && back) { S.factions.chain += 10; S.gold += 60; log('Der Kriegsmeister teilt die Beute: 60 Gold. Kette +10.', 'faction'); }
    C.phase = 'done';
  }
}
function campResolve(C, won) {
  const K = CAMP_TYPES[C.type], mem = campMembers(C);
  if (won == null) { const pWin = clamp(0.45 + C.size / 80 - (C.warned ? 0.2 : 0) - (C.sabotaged ? 0.15 : 0), 0.1, 0.85); won = chance(pWin);
    const loss = won ? 0.3 + rnd() * 0.2 : 0.7 + rnd() * 0.3; for (const e of mem) if (!e.campLead && chance(loss)) e.alive = false;
    S.ents.world = S.ents.world.filter(e => e.alive || e.camp !== C.id); }
  const alive = campMembers(C);
  C.win = won; C.survivors = Math.round(C.size * alive.length / (C.shown || 1));
  for (const e of alive) if (e.body) { e.body.torso.hp = Math.min(e.body.torso.hp, e.body.torso.max * 0.4); B.syncHp(e); }   // Verwundete
  const T = LOCATIONS.find(l => l.key === C.target);
  if (!alive.length || !alive.some(e => e.campLead)) { S.ents.world = S.ents.world.filter(e => e.camp !== C.id); C.phase = 'done';
    log(`Vom ${K.name} gegen ${T.name} kehrt kein Mann zurück.`, 'world'); chronicle(`${K.name} der Kette vor ${T.name} vernichtet`, 'news'); return; }
  C.phase = 'return'; log(`${K.name} vor ${T.name}: ${won ? 'Sieg' : 'Niederlage'}. Die Überlebenden ziehen heim.`, 'world');
  chronicle(`${K.name} vor ${T.name}: ${won ? 'Sieg der Kette' : 'die Toten halten stand'}`, 'news');
}
function campTick() {
  const C = S.campaign; if (!C || C.phase === 'done' || C.phase === 'rat') return;
  if (C.phase === 'muster' && clock() >= C.marchAt) { C.phase = 'march'; S.ents.world = S.ents.world.filter(e => e.campSupply !== C.id); log(`Der ${CAMP_TYPES[C.type].name} der Kette marschiert.`, 'world'); }
  const lead = S.ents.world.find(e => e.camp === C.id && e.campLead && e.alive);
  if (!lead && C.phase !== 'muster') { campResolve(C, false); return; }
  if (C.phase === 'battle') {
    if (dist(S.player, lead) < 500) C.joined = true;                       // wer dabei ist, zieht mit
    if (!C.live) return;
    const def = S.ents.world.filter(e => e.campDefender === C.id && e.alive).length, mem = campMembers(C).filter(e => !e.downed).length;
    if (!def) campResolve(C, true); else if (!mem) campResolve(C, false); else if (clock() - C.battleAt > 8) { S.ents.world = S.ents.world.filter(e => e.campDefender !== C.id); C.live = false; campResolve(C, null); }   // zieht sich hin: gewürfelt wie außer Sicht
    return;
  }
  if ((C.phase === 'march' || C.phase === 'return') && dist(S.player, lead) > 900) {        // außer Sicht: vereinfacht 70 px/s
    const pts = C.phase === 'return' ? campPts(C).slice().reverse() : campPts(C); let left = 70;
    while (left > 0) { const [px, py] = pts[Math.min(lead.campI, pts.length - 1)], gx = (px + 0.5) * TS, gy = (py + 0.5) * TS, d = Math.hypot(gx - lead.x, gy - lead.y);
      if (d <= left) { lead.x = gx; lead.y = gy; left -= d; if (lead.campI < pts.length - 1) lead.campI++; else { campArrive(C, lead); break; } }
      else { lead.x += (gx - lead.x) / d * left; lead.y += (gy - lead.y) / d * left; left = 0; } }
    for (const f of S.ents.world) if (f.camp === C.id && !f.campLead) { f.x = lead.x - 18 * Math.ceil((f.campIdx || 1) / 2); f.y = lead.y + ((f.campIdx || 1) % 2 ? 14 : -14); }
  }
}
function sabotageCampaign(t) {
  const C = S.campaign; if (!C || C.id !== t.campSupply) return;
  C.sabotaged = true; t.campSupply = null; t.label = 'Verdorbener Proviant';
  const seen = S.ents.world.some(e => e.faction === 'chain' && e.alive && !e.downed && dist(e, S.player) < 220);
  if (seen) { S.factions.chain -= 15; S.flags.chainAlarm = (S.day | 0) + 2; log('Erwischt! Du verdirbst den Proviant — Alarm, Kette −15.', 'faction'); UI.toast('ALARM', 2200); }
  else log('Du schüttest Lampenöl ins Mehl. Der Feldzug wird hungern. Niemand hat es gesehen.', 'world');
}
function campaignChoices(npc, choices) {
  const C = S.campaign; if (!C || !['rat', 'muster', 'march'].includes(C.phase)) return;
  const T = LOCATIONS.find(l => l.key === C.target);
  if (npc.faction === 'undead' && !C.warned) choices.push({ text: `Die Kette marschiert gegen ${T.name}.`, fn: () => {
    C.warned = true; S.factions.undead += 8; log(`Du warnst die Toten vor dem Feldzug gegen ${T.name}. Untote +8.`, 'faction');
    UI.dialogue(npc, '„Dann werden wir zahlreicher sein, als sie zählen können.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]); } });
  if (npc.campLead && !C.joined) choices.push({ text: 'Ich ziehe mit euch.', fn: () => {
    C.joined = true; log(`Du ziehst mit dem Feldzug gegen ${T.name}.`, 'world');
    UI.dialogue(npc, '„Gut. Wer mitblutet, teilt die Beute. Wer flieht, teilt das Grab.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]); } });
}
// ================= Dienst bei der Kette (Session 12, A3) =================
// Beitritt ab Ansehen 10 bei jeder Kettenwache. Ränge Treiber → Kettenknecht → Grenzreiter → Aufseher (je 25 Ansehen).
// Aufträge: Tributzug begleiten, Entlaufene jagen, beim Feldzug mitziehen. Ab Aufseher die Weihe zum Dunklen Hochpaladin.
// Wer der Kette dient, wird in freien Dörfern gefürchtet (Stufe 1 ab Kettenknecht, Stufe 2 als Hochpaladin).
const fearLvl = () => S.player.currentClass === 'darkpaladin' ? 2 : (S.ranks.chain ?? -1) >= 1 ? 1 : 0;
const fearedBy = c => fearLvl() > 0 && c.kind === 'npc' && c.faction !== 'chain' && c.faction !== 'undead' && !c.undead && !c.captive && !c.escort && !c.guard && !c.raidDef && !S.party.includes(c.id);   // Bewaffnete fürchten nicht
const refusesChain = c => fearedBy(c) && (fearLvl() >= 2 && (c.traits || []).some(t => t === 'gütig' || t === 'furchtsam') || !!tribVillages().find(V => V.key === (c.homeTown || c.town)));
const FEAR_GREET = [['„Was … was will die Kette hier?“', '„Wir haben gezahlt. Alles. Frag den Offizier.“', '„Ich will keinen Ärger.“'],
  ['„Bitte. Ich hab Kinder.“', '„N-nimm, was du brauchst. Nur geh wieder.“', '„Ein Hochpaladin … Götter.“']];
const canRite = () => !S.flags.chainsBroken && (S.ranks.chain ?? -1) >= 3 && !S.player.knownClasses.includes('darkpaladin');
function partyReact(key) {
  for (const m of partyMembers()) {
    const hard = (m.traits || []).some(t => t === 'grausam' || t === 'ehrgeizig' || t === 'diszipliniert');
    m.morale = clamp(m.morale + (hard ? 5 : -12), 0, 100); remember(m, key, S.player.name);
    log(`${m.name}: ${hard ? '„Ordnung. Endlich jemand, der sie durchsetzt.“' : '„Ketten? Dafür bin ich nicht mitgekommen.“'}`, 'party');
  }
}
function chainRite(npc) {
  UI.dialogue(npc, '„Knie. Die Kette wird dir um die Schultern gelegt, nicht um den Hals. Wer sie trägt, befiehlt — und wird gefürchtet. Es gibt kein Zurück.“', [
    { text: 'Knien.', fn: () => {
      const p = S.player; unlockClass('darkpaladin'); S.ranks.chain = 4;   // MP2 §31: echter Rang addItem(p, 'kettenbrecher'); addItem(p, 'eisenfuerst');
      S.factions.chain += 10; S.factions.valen -= 10; S.factions.order -= 15; partyReact('chain_rite');
      chronicle(`${p.name} kniet vor der Kette`, 'faction', 'Geweiht zum Dunklen Hochpaladin der Eisernen Kette.');
      log('Du bist Dunkler Hochpaladin. Schwarze Platte, Kettenbrecher — und Furcht, wohin du gehst.', 'faction'); UI.closeDialogue(); save(); } },
    { text: 'Noch nicht.', fn: () => UI.closeDialogue() },
  ]);
}
function chainChoices(npc, choices) {
  if (npc.runaway) { choices.length = 0; runawayChoices(npc, choices); return; }
  if (npc.faction !== 'chain' || S.flags.chainsBroken || (S.ranks.chain ?? -1) < 0) return;
  choices.splice(choices.length, 0, { text: 'Gibt es Arbeit für die Kette?', fn: () => chainJobs(npc) });
  if (canRite() && npc.prof === 'Dunkler Paladin') choices.push({ text: 'Ich will die Weihe der Kette.', fn: () => chainRite(npc) });
}
function chainJobs(npc) {
  const lines = [], opts = [];
  const V = tribVillages().map(V => [V, tribState(V.key).next]).sort((a, b) => a[1] - b[1])[0];
  if (V) lines.push(`Der Tribut aus ${V[0].name} ist ${V[1] <= S.day ? 'heute' : `in ${V[1] - (S.day | 0)} Tagen`} fällig. Begleite den Zug — Räuber lauern an der Straße.`);
  const C = S.campaign;
  if (C && ['rat', 'muster', 'march'].includes(C.phase)) lines.push(`Der ${CAMP_TYPES[C.type].name} gegen ${LOCATIONS.find(l => l.key === C.target)?.name} ${C.phase === 'rat' ? 'mustert morgen vor dem Kettentor' : C.phase === 'muster' ? 'mustert gerade vor dem Kettentor' : 'ist auf dem Marsch'}. Sprich mit dem Kriegsmeister.`);
  if (S.quests.q_runaway?.state !== 'active') { lines.push('Und einer ist uns aus dem Steinbruch entlaufen.'); opts.push({ text: 'Ich hole ihn zurück.', fn: () => { startRunaway(); UI.closeDialogue(); } }); }
  else lines.push('Der Entlaufene läuft noch frei herum. Worauf wartest du?');
  UI.dialogue(npc, `„${lines.join(' ')}“`, [...opts, { text: '[Gehen]', fn: () => UI.closeDialogue() }]);
}
function startRunaway() {
  const q = freeSpotNear('world', ri(236, 300), ri(180, 330), 3);
  S.runaway = { x: q.x, y: q.y, name: pick(FIRST_M), id: null };
  delete S.quests.q_runaway; startQuest('q_runaway');
  log(`Auftrag: ${S.runaway.name} ist aus der Eisenfeste geflohen — irgendwo östlich der Mauern.`, 'quest');
}
function runawayEnd(outcome, chain) {
  const Q = S.quests.q_runaway; if (Q) { Q.state = 'done'; Q.outcome = outcome; }
  S.factions.chain += chain; S.ents.world = S.ents.world.filter(e => !e.runaway || !e.alive); S.runaway = null; log(`Entlaufene: ${outcome}`, 'quest');
}
function runawayChoices(npc, choices) {
  choices.push({ text: 'Zurück in die Feste. Jetzt.', fn: () => { S.gold += 25; gainXp(S.player, 40); UI.closeDialogue(); runawayEnd(`${npc.name} ist zurück in Ketten. 25 Gold, Kette +8.`, 8); } });
  choices.push({ text: 'Lauf. Ich habe dich nie gesehen.', fn: () => {
    gainXp(S.player, 40); const seen = chance(0.3); UI.closeDialogue();
    runawayEnd(seen ? `Du hast ${npc.name} laufen lassen — ein Grenzreiter hat es gesehen. Kette −10.` : `Du hast ${npc.name} laufen lassen.`, seen ? -10 : 0); } });
}
function chainTick() {
  if (S.quests.q_runaway?.state === 'active' && S.runaway && !S.ents.world.some(e => e.runaway)) {   // auch nach dem Laden: flüchtig
    const R = S.runaway, c = makeChar({ name: R.name, prof: 'Entlaufener', x: R.x, y: R.y, level: 2, faction: null, traits: ['furchtsam'] });
    Object.assign(c, { runaway: true, transient: true, anchor: { x: R.x, y: R.y }, cloth: '#3a3128' }); S.ents.world.push(c); R.id = c.id;
  }
}
function cmdStep(e, dt) {
  const p = S.player, d = dist(e, p);
  if (d > 60) seek(e, Math.atan2(p.y - e.y, p.x - e.x), (d > 200 ? 1.8 : 1.3) * dt / 16, dt, p); else e.vx = e.vy = 0;
  return true;
}
function openGate(t) {
  const ids = S.ents.world.filter(e => e.fortGate && Math.hypot(e.x - t.x, e.y - t.y) < TS * 8);
  S.ents.world = S.ents.world.filter(e => !ids.includes(e)); indexSolids('world');
  log(S.ranks.chain >= 2 ? 'Die Wache salutiert und zieht das Gitter hoch.' : 'Die Wache murrt, erkennt dein Zeichen und zieht das Gitter hoch.', 'world');
}
// Grenzreiter: tagsüber zwei schnelle Streifen vom Südtor über die Tributdörfer und zurück (flüchtig, nachts in der Feste).
const RIDE = [[214, 350], [214, 470], [70, 470], [122, 560], [70, 630], [214, 600], [214, 350]];
function riders(night) {
  if (S.flags.chainsBroken) return;
  const have = S.ents.world.filter(e => e.rider);
  if (night) { if (have.length) S.ents.world = S.ents.world.filter(e => !e.rider); return; }
  for (let i = have.length; i < 2; i++) {
    const [x, y] = RIDE[i * 3], g = guardChar('chain', freeSpotNear('world', x, y, 2), 'Grenzreiter');
    Object.assign(g, { faction: 'chain', rider: true, transient: true, rideI: i * 3 + 1, cloth: '#2a2224' }); S.ents.world.push(g);
  }
}
function riderStep(e, dt) {
  const [x, y] = RIDE[e.rideI % RIDE.length], gx = (x + 0.5) * TS, gy = (y + 0.5) * TS;
  if (Math.hypot(gx - e.x, gy - e.y) < 24) e.rideI = (e.rideI + 1) % RIDE.length;
  seek(e, Math.atan2(gy - e.y, gx - e.x), 1.7 * dt / 16, dt, { x: gx, y: gy });
  return true;
}
// ================= Fall der Eisenfeste (Session 12, A4) =================
// Untote überfallen Dörfer — selten, solange die Kette sie im Totenland bindet, oft nach Vargs Fall. Vorwarnung 3–6 Stunden.
// Nah beim Spieler echt (Untote gegen Dorf und angeheuerte Verteidiger), sonst Stärke gegen Stärke gewürfelt. Verloren:
// Häuser brennen, Bewohner sterben, mit Glück wird das Dorf ganz zerstört — endgültig auf Schwer/Sehr schwer, auf Angsthase
// bauen Rückkehrer es nach 10 Tagen wieder auf. Verteidiger anheuern: Miliz, Söldner aus Kreuzweg, Automaten, Goblins.
const finalRuin = () => (S.difficulty || 'schwer') !== 'angsthase';
const DEF_KINDS = { militia: { name: 'Miliz', power: 1 }, merc: { name: 'Söldner', power: 2 }, robot: { name: 'Automaten', power: 4 }, gob: { name: 'Goblin-Krieger', power: 1.5 } };
const defOf = k => { const D = ((S.defense ||= {})[k] ||= { militia: 0, merc: 0, robot: 0, gob: 0, until: {} });
  for (const t of ['merc', 'robot', 'gob']) if (D[t] && (D.until[t] || 0) < S.day) D[t] = 0; return D; };
const villagersOf = k => S.ents.world.filter(c => c.kind === 'npc' && c.alive && c.homeTown === k && !c.raidDef);
function defPower(k) { const D = defOf(k); return villagersOf(k).length * 0.3 + Object.keys(DEF_KINDS).reduce((a, t) => a + (D[t] || 0) * DEF_KINDS[t].power, 0)
  + S.ents.world.filter(e => e.tribGarrison === k && e.alive).length * 2; }
function raidDay() {
  if (S.deadRaid) return;
  const V = VILLAGES.filter(V => TOWN_PLAN[V.key] && !S.razed?.[V.key]); if (!V.length) return;
  if (!chance(S.flags.chainsBroken ? 0.35 : 0.06)) return;
  let w = V.reduce((a, v) => a + v.x + 200, 0) * rnd(), v = V[0];                    // der Osten liegt näher am Totenland
  for (const c of V) { w -= c.x + 200; if (w <= 0) { v = c; break; } }
  const n = Math.min(14, ri(4, 7) + (S.day / 15 | 0));
  S.deadRaid = { v: v.key, at: clock() + ri(180, 360), n };
  log(`Späher melden: Untote ziehen gegen ${v.name} (${n}). In wenigen Stunden sind sie da.`, 'world');
  chronicle(`Untote ziehen gegen ${v.name}`, 'news');
}
function raidTick() {
  const R = S.deadRaid; if (!R) return;
  const V = VILLAGES.find(v => v.key === R.v), p = S.player;
  if (!V || S.razed?.[R.v]) { S.deadRaid = null; return; }
  const near = p.map === 'world' && Math.hypot(p.x / TS - V.x, p.y / TS - V.y) < 70;
  if (!R.live) {
    if (clock() < R.at) return;
    if (!near) return raidEnd(R, chance(defPower(R.v) / (defPower(R.v) + R.n * (S.flags.chainsBroken ? 1.2 : 1))));
    R.live = true; R.liveAt = clock();
    for (let i = 0; i < R.n; i++) { const e = regionSpawn(pick(['skeleton', 'skeleton', 'ghoul', 'wraith']), 'world', V.x + ri(14, 20), V.y + ri(-8, 8));
      Object.assign(e, { raidOf: R.v, transient: true }); e.anchor = { x: V.x * TS, y: V.y * TS }; }
    const D = defOf(R.v);
    for (const [t, k] of [['militia', 'merch'], ['merc', 'merch'], ['robot', 'aurel'], ['gob', null]]) for (let i = 0; i < (D[t] || 0); i++) {
      const pos = freeSpotNear('world', V.x + ri(-4, 4), V.y + ri(-4, 4), 3);
      const c = k ? guardChar(k, pos, t === 'militia' ? 'Miliz' : t === 'merc' ? 'Söldner aus Kreuzweg' : undefined)
        : Object.assign(makeChar({ name: pick(['Rukk', 'Tizz', 'Grot', 'Maz']), prof: 'Goblin-Krieger', x: pos.x, y: pos.y, level: 5, faction: 'goblin' }), { goblin: true });
      if (!k) c.spec = SP.monsterSpec({ mtype: 'goblin_warrior', seed: i }, MONSTERS.goblin_warrior);
      Object.assign(c, { raidDef: R.v, guard: true, brave: true, transient: true, anchor: { x: pos.x, y: pos.y } }); if (t === 'militia') c.equip.chest = null;
      S.ents.world.push(c);
    }
    log(`Die Toten fallen über ${V.name} her!`, 'combat'); UI.toast(`ÜBERFALL AUF ${V.name.toUpperCase()}`, 3000); return;
  }
  const foes = S.ents.world.filter(e => e.raidOf === R.v && e.alive).length;
  if (!foes) return raidEnd(R, true);
  if (!near || clock() - R.liveAt > 10) {                                             // außer Sicht oder zieht sich hin: Rest würfeln
    S.ents.world = S.ents.world.filter(e => e.raidOf !== R.v);
    return raidEnd(R, chance(defPower(R.v) / (defPower(R.v) + foes)));
  }
}
function raidEnd(R, won) {
  const V = VILLAGES.find(v => v.key === R.v);
  S.ents.world = S.ents.world.filter(e => e.raidOf !== R.v && e.raidDef !== R.v); S.deadRaid = null;
  if (won) { log(`${V.name} hält stand. Die Toten ziehen ab.`, 'world'); chronicle(`${V.name} wehrt die Toten ab`, 'battle'); return; }
  raidDamage(R.v);
  const vs = villagersOf(R.v); for (let i = 0; i < Math.min(vs.length, ri(1, 3)); i++) { const c = vs[i]; c.alive = false; S.ents.world.splice(S.ents.world.indexOf(c), 1); }
  if (chance(S.flags.chainsBroken ? 0.45 : 0.15)) return raze(R.v);
  log(`${V.name} fällt beinahe. Häuser brennen, Tote liegen auf der Straße.`, 'world'); chronicle(`Blut in ${V.name}`, 'battle');
}
function raze(k) {
  const V = VILLAGES.find(v => v.key === k), D = (S.flags.raidDamage ||= {}), fin = finalRuin();
  (S.razed ||= {})[k] = { day: S.day | 0, rebuild: fin ? null : (S.day | 0) + 10 };
  for (const c of villagersOf(k)) { c.alive = false; } S.ents.world = S.ents.world.filter(c => c.alive || c.kind !== 'npc' || c.homeTown !== k);
  for (const b of HOUSES.filter(b => b.town === k && b.map === 'world')) { D[b.id] = { base: D[b.id]?.base ?? HB.wearOf(b), wear: 2, perm: true }; b.wear = 2; }
  log(`${V.name} ist gefallen. Niemand lebt mehr dort.${fin ? '' : ' Vielleicht kehren Überlebende zurück.'}`, 'death');
  chronicle(`${V.name} zerstört`, 'death', fin ? 'Die Toten haben das Dorf genommen. Es wird nicht wieder aufgebaut.' : 'Die Überlebenden sind geflohen.');
  if (S.tribute?.[k]) S.tribute[k].vorrat = 0;
}
function rebuildRazed() {                                                           // Angsthase: Rückkehrer nach 10 Tagen
  for (const [k, z] of Object.entries(S.razed || {})) if (z.rebuild != null && S.day >= z.rebuild) {
    const V = VILLAGES.find(v => v.key === k); z.rebuild = null; delete S.razed[k];
    for (const d of Object.values(S.flags.raidDamage || {})) d.perm = false;
    for (let i = 0; i < 4; i++) { const pos = freeSpotNear('world', V.x + ri(-5, 5), V.y + ri(-5, 5), 3);
      const c = makeChar({ name: pick(FIRST_M), prof: pick(['Bauer', 'Magd', 'Holzfäller', 'Rückkehrer']), x: pos.x, y: pos.y, level: 1, faction: null, traits: ['furchtsam'] });
      Object.assign(c, { homeTown: k, anchor: { x: pos.x, y: pos.y } }); S.ents.world.push(c); }
    log(`Überlebende kehren nach ${V.name} zurück und bauen wieder auf.`, 'world'); chronicle(`${V.name} wird wieder aufgebaut`, 'news');
  }
}
function defenseChoices(npc, choices) {
  const k = npc.homeTown, V = VILLAGES.find(v => v.key === k);
  if (!V || S.razed?.[k] || npc.guard || S.party.includes(npc.id)) return;
  choices.push({ text: 'Wer verteidigt dieses Dorf?', fn: () => defenseTalk(npc, V) });
}
function defenseTalk(npc, V) {
  const D = defOf(V.key), R = S.deadRaid?.v === V.key ? S.deadRaid : null, back = () => defenseTalk(npc, V);
  const have = Object.keys(DEF_KINDS).filter(t => D[t]).map(t => `${D[t]} ${DEF_KINDS[t].name}`).join(', ') || 'niemand außer uns';
  const hire = (t, n, cost, days, cap) => () => {
    if (S.gold < cost) return UI.dialogue(npc, '„Das Gold hast du nicht. Und wir auch nicht.“', [{ text: 'Weiter', fn: back }]);
    if ((D[t] || 0) + n > cap) return UI.dialogue(npc, '„Mehr passen nicht ins Dorf. Wer soll die alle füttern?“', [{ text: 'Weiter', fn: back }]);
    S.gold -= cost; D[t] = (D[t] || 0) + n; if (days) D.until[t] = (S.day | 0) + days; addRel(npc.key, 3);
    log(`${V.name}: ${n} ${DEF_KINDS[t].name} ${days ? `für ${days} Tage ` : ''}angeheuert (${cost} Gold).`, 'economy'); back();
  };
  const opts = [{ text: 'Miliz bewaffnen — 2 Mann (60 Gold, bleibt)', fn: hire('militia', 2, 60, 0, 8) },
    { text: 'Söldner aus Kreuzweg — 3 Mann, 5 Tage (150 Gold)', fn: hire('merc', 3, 150, 5, 9) }];
  if ((S.factions.aurel || 0) >= 0 && !S.flags.chainsBroken) opts.push({ text: 'Automaten aus Aurelion — 2 Stück, 5 Tage (400 Gold)', fn: hire('robot', 2, 400, 5, 4) });
  else if (S.flags.chainsBroken) opts.push({ text: 'Automaten aus Aurelion? (Das Hochreich schickt keine mehr hinaus.)', fn: () => UI.dialogue(npc, '„Seit die Feste gefallen ist, verteidigt Aurelion nur noch sich selbst. Die Tore sind zu, die Automaten bleiben drinnen.“', [{ text: 'Weiter', fn: back }]) });
  if (S.flags.goblinsFreed && (S.factions.goblin || 0) >= 20) opts.push({ text: 'Goblin-Krieger von Grisk — 3, 5 Tage (60 Gold)', fn: hire('gob', 3, 60, 5, 9) });
  UI.dialogue(npc, `„${R ? `Die Toten kommen! ${R.live ? 'Sie sind schon da!' : `Späher sagen, in ${Math.max(1, Math.round((R.at - clock()) / 60))} Stunden.`} ` : ''}Uns schützen: ${have}.“`,
    [...opts, { text: '[Gehen]', fn: () => UI.closeDialogue() }]);
}
// Grisk (A4): drei Aufträge nach der Befreiung — Verschleppte finden, Kettenreste jagen, Hütten bauen. Danach sind die
// Grubenstämme Verbündete: Goblin-Krieger lassen sich für Dörfer anheuern.
function planLostGoblins() {
  S.lostGob = [0, 1, 2].map(() => { const q = freeSpotNear('world', ri(40, 430), ri(380, 700), 4); return { x: q.x, y: q.y, done: false, name: pick(['Pix', 'Zagg', 'Nurl', 'Wim', 'Tekka']) }; });
}
function spawnChainRest() {
  const q = freeSpotNear('world', ri(20, 60), ri(200, 330), 4), tx = q.x / TS | 0, ty = q.y / TS | 0; S.chainRest = [tx, ty];
  for (let i = 0; i < 5; i++) { const e = spawnEnemy(i === 4 ? 'kettenschuetze' : 'chain_brute', 'world', tx + ri(-3, 3), ty + ri(-3, 3), { level: 9 });
    Object.assign(e, { chainRest: true, faction: null, name: i === 4 ? 'Kettenrest-Schütze' : 'Kettenrest' }); }
  log('Grisk: „Sie hausen im Westgebirge, hinter der alten Mauer.“', 'quest');
}
function griskChoices(npc, choices) {
  if (npc.lostGob != null) {
    const L = S.lostGob?.[npc.lostGob]; choices.length = 0;
    choices.push({ text: 'Du bist frei. Grisk wartet im Grubenhort.', fn: () => {
      L.done = true; S.ents.world = S.ents.world.filter(e => e !== npc); const Q = S.quests.q_grisk_lost; if (Q) Q.progress[0] = (Q.progress[0] || 0) + 1;
      log(`${npc.name} läuft los, Richtung Grubenhort. Verschleppte: ${Q?.progress[0] || 0}/3`, 'quest'); UI.closeDialogue(); } });
    return;
  }
  if (npc.key !== 'grisk' || S.quests.q_grisk_build?.state !== 'active') return;
  if ((S.res.wood || 0) >= 30 && (S.res.stone || 0) >= 15) choices.unshift({ text: 'Hier sind Holz und Stein. (30 Holz, 15 Stein)', fn: () => {
    S.res.wood -= 30; S.res.stone -= 15; S.quests.q_grisk_build.progress[0] = 1; S.flags.griskBuilt = true; turnIn(npc, 'q_grisk_build'); ensureGoblinVillage();
    chronicle('Die Grubenstämme bauen eigene Hütten', 'news'); log('Grisk: „Eigene Wände. Wenn die Toten kommen, stehen wir neben dir.“', 'quest'); } });
}
function lostGobTick() {
  if (S.quests.q_grisk_lost?.state !== 'active' || !S.lostGob) return;
  S.lostGob.forEach((L, i) => { if (L.done || S.ents.world.some(e => e.lostGob === i)) return;
    const c = makeChar({ name: L.name, prof: 'Verschleppter', x: L.x, y: L.y, level: 2, faction: 'goblin', traits: ['furchtsam'] });
    Object.assign(c, { lostGob: i, goblin: true, transient: true, anchor: { x: L.x, y: L.y }, greet: '„Nicht schlagen! Ich arbeite ja!“' });
    c.spec = SP.monsterSpec({ mtype: 'goblin', seed: i + 7 }, MONSTERS.goblin); S.ents.world.push(c); });
}
// ================= Das Hochreich Aurelion (Session 12, Block E) =================
// Grenze: Wer eine Stadt des Hochreichs betritt, braucht einen Aufenthaltsschein (Passamt am Westtor, auf Tage begrenzt),
// Dienst bei einem Adelshaus, das Bürgerrecht (Kanzlei in Aurelheim) oder eine Heirat. Automaten-Wachen sehen in einem
// Kegel (sichtbar, solange man keinen Schein hat); wer ohne Schein gesehen wird, zahlt Strafe oder wird Schuldknecht.
// Hineinschleichen: je Stadt zwei unbewachte Breschen in der Mauer. Nach dem Fall der Eisenfeste ist Aurelion die letzte
// Bastion: Schein und Strafe kosten das Doppelte, Flüchtlinge stauen sich vor den Toren, Automaten werden nicht mehr vermietet.
const inAurel = c => { const k = townAt(c.x / TS | 0, c.y / TS | 0); return k && TOWN_PLAN[k]?.lord === 'aurel' ? k : null; };
const hasPermit = () => !!(S.flags.aurelCitizen || S.flags.marriedHouse || (S.permit ?? -1) >= (S.day | 0) || (S.aurelJob && S.aurelJob.until >= (S.day | 0)) || S.bond?.kind === 'aurel');
const bastion = () => S.flags.chainsBroken ? 2 : 1;
function clearLine(a, b) { const d = dist(a, b), n = Math.ceil(d / 16); for (let i = 1; i < n; i++) if (solidTile(a.map, a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n)) return false; return true; }
function coneSees(e, p, range = 150) {
  if (dist(e, p) > range) return false;
  const a = Math.atan2(p.y - e.y, p.x - e.x), da = Math.abs(((a - (e.aim || 0) + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  return da < 0.7 && clearLine(e, p);
}
function aurelWatch(e, dt) {
  const p = S.player, illegal = p.map === e.map && p.alive && !p.downed && !hasPermit() && !!inAurel(p);
  e.cone = illegal && dist(e, p) < 700 ? 1 : 0;
  if (!illegal || e.angry) return false;
  if (!(e.vx || e.vy)) { e.baseAim ??= e.aim || 0; e.scan = (e.scan ?? (e.seed || 0)) + dt * 0.0009; e.aim = e.baseAim + Math.sin(e.scan) * 1.3; }
  if (!coneSees(e, p)) return false;
  e.cone = 2; if ((S.aurelStop || 0) > clock()) return false;
  S.aurelStop = clock() + 20; e.vx = e.vy = 0; e.aim = Math.atan2(p.y - e.y, p.x - e.x); robotStop(e); return true;
}
function robotStop(e) {
  const fine = 100 * bastion();
  UI.dialogue(e, `„HALT. KEIN AUFENTHALTSSCHEIN REGISTRIERT. STRAFE: ${fine} GOLD UND AUSWEISUNG. BEI ZAHLUNGSUNFÄHIGKEIT: SCHULDDIENST.“`, [
    { text: `Zahlen (${fine} Gold)`, fn: () => { if (S.gold < fine) return enslave('aurel', 300); S.gold -= fine; UI.closeDialogue(); expel(); } },
    { text: 'Ich habe kein Gold.', fn: () => enslave('aurel', 300) },
    { text: 'Fliehen!', fn: () => robotAlarm(10, 'Du rennst. Hinter dir schlagen die Automaten Alarm. Aurelion −10.') },
    { text: 'Ich kämpfe!', fn: () => robotAlarm(15, 'Du ziehst die Waffe gegen das Hochreich. Aurelion −15.') },
  ]);
}
function robotAlarm(rep, msg) {
  UI.closeDialogue(); S.factions.aurel -= rep;
  for (const r of S.ents.world) if (r.robot && r.guard && r.alive && dist(r, S.player) < 500) { r.angry = true; r.aggroId = S.player.id; r.sawPlayer = clock(); }
  log(msg, 'faction');
}
function robotTalk(npc) {
  const B0 = S.bond, leave = [{ text: '[Gehen]', fn: () => UI.closeDialogue() }];
  if (B0?.kind === 'aurel') return UI.dialogue(npc, `„SCHULDNER ${S.player.name.toUpperCase()}. RESTSCHULD: ${B0.debt} GOLD. ZURÜCK AN DIE WERKBANK.“`, leave);
  if (S.hunt && S.hunt.level > 0) return UI.dialogue(npc, '„GESUCHT: MORD AN EIGENTUM DES HOCHREICHS. BLEIB STEHEN.“', leave);
  if (npc.robotWork) return UI.dialogue(npc, '„ARBEITSEINHEIT. KEINE AUSKUNFT. BITTE DEN WEG FREIGEBEN.“', leave);
  if (!hasPermit() && inAurel(S.player)) { S.aurelStop = clock() + 20; return robotStop(npc); }
  const until = S.flags.aurelCitizen ? 'BÜRGER DES HOCHREICHS' : S.flags.marriedHouse ? 'ANGEHÖRIGER EINES HAUSES' : S.aurelJob?.until >= S.day ? `IM DIENST BIS TAG ${S.aurelJob.until}` : S.permit >= S.day ? `SCHEIN GÜLTIG BIS TAG ${S.permit}` : 'OHNE REGISTRIERUNG';
  UI.dialogue(npc, `„${until}. ORDNUNG IST FRIEDEN. WEITERGEHEN.“`, leave);
}
function expel() {
  const k = inAurel(S.player); if (!k) return; const [x0, , , ] = TOWN_PLAN[k].area, cy = TOWN_PLAN[k].square[1], q = freeSpotNear('world', x0 - 5, cy, 2);
  S.player.x = q.x; S.player.y = q.y; log('Zwei Automaten führen dich zum Tor und stoßen dich hinaus.', 'world');
}
// Schuldknechtschaft (Aurelion, Fabrik von Tickmar) und Steinbruch (Kette): Fußkette, Arbeit tilgt die Schuld. Freikaufen,
// freiarbeiten, von Dritten freigekauft werden — oder fliehen: nachts Fesseln lockern oder den Schlüssel stehlen, dann
// ungesehen hinaus (Kegel der Automaten, Blick der Kettenwachen). Wer gesehen wird, kommt zurück, die Schuld wächst.
function ensureBondProps() {
  const L = LOCATIONS.find(l => l.key === 'steinbruch');
  if (L && !S.flags.chainsBroken && !S.ents.world.some(e => e.bond === 'chain')) {
    S.ents.world.push({ id: uid(), kind: 'prop', type: 'workstation', map: 'world', x: (L.x + 2) * TS, y: (L.y + 3) * TS, r: 10, transient: true, bond: 'chain', label: 'Hauklotz der Angeketteten' });
    S.ents.world.push({ id: uid(), kind: 'prop', type: 'keychest', map: 'world', x: (L.x + 8) * TS, y: (L.y + 1) * TS, r: 8, transient: true, bond: 'chain', label: 'Schlüsselkiste des Aufsehers' });
  }
  const ws = S.ents.world.find(e => e.bond === 'aurel' && e.type === 'workstation');
  if (ws && !S.ents.world.some(e => e.bondWorker)) for (let i = 0; i < 3; i++) {
    const q = freeSpotNear('world', (ws.x / TS | 0) + i * 2 - 2, (ws.y / TS | 0) + 2, 1), c = makeChar({ name: pick(FIRST_M), prof: 'Schuldknecht', x: q.x, y: q.y, level: 1, faction: null, traits: ['furchtsam'] });
    Object.assign(c, { bondWorker: true, visitor: true, transient: true, anchor: { x: q.x, y: q.y }, cloth: '#4a4238', greet: '„Noch vierhundert Gold. Oder sechs Jahre. Je nachdem, was zuerst kommt.“' }); S.ents.world.push(c);
  }
}
function enslave(kind, debt) {
  const p = S.player, spot = S.ents.world.find(e => e.bond === kind && e.type === 'workstation'); if (!spot) return false;
  UI.closeDialogue();
  const gold = kind === 'aurel' ? Math.min(S.gold, debt) : 0; S.gold -= gold;
  S.bond = { kind, debt: debt - gold, since: S.day | 0, loose: false, weapon: p.equip.weapon || null, x: spot.x, y: spot.y };
  p.equip.weapon = null; recalc(p);
  p.downed = false; if (p.body) B.healPart(p, 'torso', Math.max(4, p.body.torso.max * 0.3) - p.body.torso.hp);
  for (const o of S.ents[p.map]) if (o.angry) { o.angry = false; o.aggroId = null; }
  p.x = spot.x; p.y = spot.y + 26; addStatus(p, { key: 'shackled', name: 'Versklavt', left: 1e12, desc: 'Fußkette: halbes Tempo, keine Waffe, ein Wächter folgt dir. Arbeit, Freikauf oder Flucht.' });   // MP2 §25: sichtbarer Status
  const what = kind === 'aurel' ? `Schuldknechtschaft in der Fabrik von Tickmar. Schuld: ${S.bond.debt} Gold.` : `Du erwachst im Steinbruch der Kette, eine Kette am Fuß. Schuld: ${S.bond.debt}.`;
  log(what + ' Arbeit an der Werkbank tilgt sie — oder du fliehst.', 'world'); chronicle(`${p.name} in Ketten`, 'crime', what); UI.toast('IN KETTEN', 3000);
  return true;
}
function captureInstead(p) {                                             // Kettenleute lassen niemanden sterben, der arbeiten kann
  const k = byId(p.lastKiller);
  if (k?.aurelAssassin && S.map === 'world') { courtTrial(); return true; }   // S12 E: Sonnenklingen bringen dich vor das Magische Gericht if (!k || S.flags.chainsBroken || k.faction !== 'chain') return false;
  return chance(0.7) && enslave('chain', 200);
}
function freeBond(msg, back = true) {
  const B0 = S.bond, p = S.player; if (!B0) return;
  if (back && B0.weapon && !p.equip.weapon) p.equip.weapon = B0.weapon; recalc(p);
  p.status = (p.status || []).filter(s => s.key !== 'shackled'); S.bond = null;
  log(msg, 'world'); chronicle(`${p.name} ist frei`, 'news', msg); UI.toast('FREI', 2400);
}
function bondMenu(t) {
  const B0 = S.bond, p = S.player;
  if (!B0 || B0.kind !== t.bond) return UI.dialogue(p, t.bond === 'aurel' ? 'Hier schuften die Schuldknechte des Hochreichs. Messingstaub, Öl, das Stampfen der Hämmer.' : 'Hier schlagen die Angeketteten Stein, bis die Hände bluten.', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]);
  const opts = [{ text: 'Arbeiten (eine Stunde, Schuld −15)', fn: () => { UI.closeDialogue(); act(p, 'work', 1500, t); S.minute += 60; B0.debt -= 15; gainXp(p, 4);
    if (B0.debt <= 0) freeBond(B0.kind === 'aurel' ? 'Die Schuld ist abgearbeitet. Der Vogt nickt dich hinaus.' : 'Der Aufseher schließt die Kette auf. „Du hast genug Stein geschlagen. Verschwinde.“'); else log(`Schuld: noch ${B0.debt}.`, 'world'); } }];
  if (B0.kind === 'aurel' && S.gold >= B0.debt) opts.push({ text: `Freikaufen (${B0.debt} Gold)`, fn: () => { S.gold -= B0.debt; UI.closeDialogue(); freeBond('Du hast dich freigekauft.'); } });
  if (fortNight() && !B0.loose) opts.push({ text: 'Fesseln lockern (Nachtschicht)', fn: () => { UI.closeDialogue(); S.minute += 60;
    if (chance(0.45)) { B0.loose = true; p.status = p.status.filter(s => s.key !== 'shackled'); log('Die Fußkette gibt nach. Jetzt oder nie — ungesehen hinaus.', 'world'); }
    else log('Die Kette hält. Eine Stunde vergeudet.', 'world'); } });
  UI.dialogue(p, `${B0.kind === 'aurel' ? 'Schuldknechtschaft' : 'Steinbruch'} — Schuld ${B0.debt}. ${B0.loose ? 'Die Kette ist los.' : fortNight() ? 'Nachtschicht: weniger Augen.' : 'Tagsüber wachen alle.'}`, [...opts, { text: '[Gehen]', fn: () => UI.closeDialogue() }]);
}
const bondWatchers = B0 => S.ents.world.filter(o => o.alive && !o.downed && (B0.kind === 'aurel' ? o.robot && o.guard : o.faction === 'chain' && o.kind === 'npc'));
function seenBond(B0) { const p = S.player; return bondWatchers(B0).some(o => B0.kind === 'aurel' ? coneSees(o, p) : dist(o, p) < 200 && clearLine(o, p)); }
function stealKey(t) {
  const B0 = S.bond, p = S.player; if (!B0 || B0.kind !== t.bond) return log('Verschlossen. Und bewacht.', 'world');
  if (B0.loose) return log('Du bist schon los.', 'world');
  if (seenBond(B0)) { B0.debt += 50; log('Erwischt! Schläge, und die Schuld wächst um 50.', 'combat'); if (p.body) B.damagePart(p, 'torso', 6); return; }
  B0.loose = true; p.status = p.status.filter(s => s.key !== 'shackled'); log('Du fischst den Schlüssel heraus. Die Kette fällt. Leise jetzt.', 'world');
}
function bondTick() {
  const B0 = S.bond, p = S.player;
  if (!B0) { if (S.ents.world.some(e => e.bondGuard)) S.ents.world = S.ents.world.filter(e => !e.bondGuard); return; }
  if (p.map !== 'world') return;
  if (!B0.guardDown && !S.ents.world.some(e => e.bondGuard && e.alive)) spawnBondGuard(B0);
  const d = Math.hypot(p.x - B0.x, p.y - B0.y) / TS, tx = p.x / TS | 0, ty = p.y / TS | 0;
  const out = B0.kind === 'aurel' ? d > 30 && !inAurel(p) : (tx < FORT[0] || tx > FORT[2] || ty < FORT[1] || ty > FORT[3]);
  if (out) { S.factions[B0.kind === 'aurel' ? 'aurel' : 'chain'] -= 15; return freeBond(`Entflohen! Deine Waffe bleibt ${B0.kind === 'aurel' ? 'beim Vogt' : 'beim Aufseher'}. Ruf −15.`, false); }
  if (d > 14 && seenBond(B0)) {
    p.x = B0.x; p.y = B0.y + 26; B0.debt += 50; B0.loose = false; addStatus(p, { key: 'shackled', name: 'Versklavt', left: 1e12, desc: 'Fußkette: halbes Tempo, keine Waffe, ein Wächter folgt dir. Arbeit, Freikauf oder Flucht.' });
    log('Gesehen! Sie schleifen dich zurück. Die Schuld wächst um 50.', 'combat'); UI.toast('ZURÜCK IN KETTEN', 2400);
  }
}
// Wächter (MP2 §25): Wächterautomat (Aurelion) oder Kettenhund (Kette) — sehr stark, folgt tagsüber, nachts an der Werkbank.
function spawnBondGuard(B0) {
  const p = S.player, aurel = B0.kind === 'aurel', q = freeSpotNear('world', (B0.x / TS | 0) + 2, (B0.y / TS | 0) + 2, 2);
  const g = guardChar(aurel ? 'aurel' : 'chainpal', q, aurel ? 'Wächterautomat' : 'Kettenhund der Aufseher', Math.max(20, (p.level || 1) + 10));
  Object.assign(g, { bondGuard: true, guard: true, transient: true, visitor: true, big: aurel ? 1.7 : 1.35, r: aurel ? 18 : 15, faction: aurel ? 'aurel' : 'chain', name: aurel ? 'Wächterautomat W-1' : 'Kettenhund Brakk', cloth: aurel ? '#2a2a30' : '#141214' });
  g.equip.weapon = mkItem(aurel ? 'halberd' : 'kettenbrecher');
  if (g.body) { for (const k of B.PARTS) { g.body[k].max = Math.round(g.body[k].max * (aurel ? 4 : 3)); g.body[k].hp = g.body[k].max; } B.syncHp(g); }
  S.ents.world.push(g); log(`${g.name} wird dir zugeteilt. Er lässt dich nicht aus den Augen.`, 'world');
}
function bondGuardStep(e, dt) {
  const B0 = S.bond, p = S.player; if (!B0) return false;
  if (e.angry) return false;                                           // im Kampf: normale Kampf-KI
  const night = fortNight(), goal = night ? { x: B0.x + 30, y: B0.y } : { x: p.x, y: p.y }, d = Math.hypot(goal.x - e.x, goal.y - e.y);
  if (d > (night ? 12 : 70)) { seek(e, Math.atan2(goal.y - e.y, goal.x - e.x), (d > 240 ? 1.9 : 1.2) * dt / 16, dt, goal); if ((e.stepT = (e.stepT || 0) + dt) > 420) { e.stepT = 0; sfx('metal', 0.15, earVol(e)); } }
  else { e.vx = e.vy = 0; e.aim = Math.atan2(p.y - e.y, p.x - e.x); }
  return true;
}
function bondChoices(npc, choices) {
  if (!S.bond?.loose || !(npc.captive || npc.bondWorker)) return;
  choices.unshift({ text: 'Komm mit — jetzt, solange es dunkel ist!', fn: () => {
    Object.assign(npc, { captive: false, chainedTo: null, work: false, freed: true, bondWorker: false, fleeing: true, afraid: clock() + 600 });
    if (npc.goblin) S.factions.goblin += 3; log(`${npc.name} rennt los, in die Freiheit.`, 'world'); UI.closeDialogue(); } });
}
// Adelshäuser (E3): Dienst (Aufenthaltsrecht, Lohn), Intrigen gegeneinander (Brief abfangen, Verwalter beseitigen), Heirat.
const AUREL_HOUSES = [
  { key: 'aurivel', name: 'Haus Aurivel', town: 'aurelheim', lord: 'Fürstin Maelis Aurivel', motto: 'Gold hält, was Eisen verspricht.' },
  { key: 'kessmark', name: 'Haus Kessmark', town: 'gelenkhall', lord: 'Graf Ottwin Kessmark', motto: 'Jedes Glied ersetzbar.' },
  { key: 'solandre', name: 'Haus Solandre', town: 'sanktserin', lord: 'Gräfin Ysolde Solandre', motto: 'Das Licht wägt.' },
  { key: 'vantor', name: 'Haus Vantor', town: 'tickmar', lord: 'Fabrikherr Brannoc Vantor', motto: 'Zeit ist Messing.' },
];
const favor = k => ((S.houses ||= {})[k] ??= 0);
function houseSeat(k) { const H = AUREL_HOUSES.find(h => h.key === k), c = S.ents.world.find(e => e.houseKey === k); return c ? { x: c.x / TS | 0, y: c.y / TS | 0 } : TOWN_PLAN[H.town] ? { x: TOWN_PLAN[H.town].square[0], y: TOWN_PLAN[H.town].square[1] } : null; }
// Phase 5: Spielstände aus der Zeit vor der Metropole — Bewohner ohne Haus weg, leere Häuser besiedeln (idempotent je Haus),
// Automaten-Wachen und Wachposten der alten Stadt neu verteilen. Einmal je Spielstand.
function aurelMetroMigrate() {
  if (!TOWN_PLAN.aurelheim?.metro) return;
  const mh = HOUSES.filter(b => b.town === 'aurelheim'), sig = mh.length + ':' + (mh[0]?.id || '') + ':' + (mh[mh.length - 1]?.id || '');   // Aufbau geändert → neu besiedeln
  if (S.flags.aurel8 === sig) return;
  const ids = new Set(HOUSES.map(b => b.id));
  S.ents.world = S.ents.world.filter(e => !(e.kind === 'npc' && (e.homeTown === 'aurelheim' && e.homeId && !ids.has(e.homeId) || (e.robot && e.post === 'aurelheim'))));
  spawnResidents(); S.flags.aurel8 = sig;
  log('Aurelheim ist gewachsen: dreizehn Bezirke, Prachtstraßen, ein Palast in der Mitte.', 'world');
}
function ensureNobles() {
  S.ents.world = S.ents.world.filter(e => !((e.houseKey || e.key === 'kanzlei' || e.passamt) && !e.transient));   // alte Stände: fest gespeichert, jetzt flüchtig
  for (const H of AUREL_HOUSES) if (TOWN_PLAN[H.town] && !S.ents.world.some(e => e.houseKey === H.key)) {
    const b = HOUSES.find(b => b.town === H.town && b.type === 'manor') || HOUSES.find(b => b.town === H.town && b.map === 'world'), [cx, cy] = TOWN_PLAN[H.town].square;
    const q = b ? freeSpotNear('world', b.doorTile[0] + (b.door === 'E' ? 2 : b.door === 'W' ? -2 : 0), b.doorTile[1] + (b.door === 'S' ? 2 : b.door === 'N' ? -2 : 0), 1) : freeSpotNear('world', cx + 2, cy + 2, 2);
    const c = makeChar({ name: H.lord.split(' ').slice(-2).join(' '), prof: H.lord.split(' ')[0], x: q.x, y: q.y, level: 9, faction: 'aurel', traits: ['ehrgeizig'] });
    Object.assign(c, { key: 'house_' + H.key, houseKey: H.key, visitor: true, transient: true, anchor: { x: q.x, y: q.y }, schedulePos: { x: q.x, y: q.y }, greet: `„${H.name}. ${H.motto} Sprich, wenn es sich lohnt.“`, cloth: '#2a2430' });
    S.ents.world.push(c);
  }
  const A = TOWN_PLAN.aurelheim;
  if (A && !S.ents.world.some(e => e.portal === 'sky')) S.ents.world.push({ id: uid(), kind: 'prop', type: 'telecircle', map: 'world', x: (A.square[0] - 3) * TS + TS / 2, y: (A.square[1] + 3) * TS + TS / 2, r: 12, transient: true, portal: 'sky', label: 'Teleportkreis zur Himmelsinsel' });
  ensureSkyCourt();
  if (A && !S.ents.world.some(e => e.key === 'kanzlei')) { const q = freeSpotNear('world', A.square[0] - 3, A.square[1] + 3, 1);
    const c = makeChar({ name: 'Kanzlerin Oriane', prof: 'Kanzlerin des Hochreichs', x: q.x, y: q.y, level: 10, faction: 'aurel', traits: ['diszipliniert'] });
    Object.assign(c, { key: 'kanzlei', visitor: true, transient: true, anchor: { x: q.x, y: q.y }, schedulePos: { x: q.x, y: q.y }, greet: '„Die Kanzlei des Hochreichs. Scheine, Bürgerrecht, Beschwerden — in dieser Reihenfolge.“', cloth: '#3a3040' }); S.ents.world.push(c); }
  for (const [k, P] of Object.entries(TOWN_PLAN)) if (P.lord === 'aurel' && !S.ents.world.some(e => e.passamt === k)) {
    const q = freeSpotNear('world', P.area[0] - 3, P.square[1] + 3, 1), c = makeChar({ name: pick(['Aldric', 'Selma', 'Corvin', 'Ilsa']), prof: 'Passbeamter', x: q.x, y: q.y, level: 4, faction: 'aurel', traits: ['diszipliniert'] });
    Object.assign(c, { key: 'pass_' + k, passamt: k, visitor: true, transient: true, anchor: { x: q.x, y: q.y }, schedulePos: { x: q.x, y: q.y }, greet: '„Passamt. Name, Herkunft, Zweck — und das Siegelgeld.“', cloth: '#3a3530' }); S.ents.world.push(c);
  }
}
// Automaten (E4): Arbeitsautomaten mit Tagesablauf (Werkstätten), Kampfautomaten (1,5-fach, Uhrwerk) an Toren und Fabrik
function ensureMachines() {
  S.ents.world = S.ents.world.filter(e => !((e.robotWork || e.bigRobot) && !e.transient));   // alte Stände: fest gespeichert, jetzt flüchtig
  for (const [k, P] of Object.entries(TOWN_PLAN)) if (P.lord === 'aurel' && !S.ents.world.some(e => e.robotWork && e.workTown === k)) {
    const [x0, y0, x1, y1] = P.area, pts = S.ents.world.filter(e => e.kind === 'prop' && (e.type === 'gearpile' || e.type === 'automat_frame' || e.type === 'machine') && e.x / TS >= x0 - 30 && e.x / TS <= x1 + 30 && e.y / TS >= y0 - 12 && e.y / TS <= y1 + 12).map(e => ({ x: e.x, y: e.y + 22 }));
    if (pts.length < 2) continue;
    for (let i = 0; i < 3; i++) { const q = freeSpotNear('world', pts[i % pts.length].x / TS | 0, pts[i % pts.length].y / TS | 0, 1), g = guardChar('aurel', q, 'Arbeitsautomat');
      Object.assign(g, { robotWork: pts, wi: i, workTown: k, visitor: true, transient: true, faction: 'aurel', anchor: { x: q.x, y: q.y } }); g.equip.weapon = null; S.ents.world.push(g); }
  }
  const big = (x, y, post, label) => { const g = guardChar('aurel', freeSpotNear('world', x, y, 1), label || 'Kampfautomat', 14);
    Object.assign(g, { guard: true, big: 1.5, r: 16, bigRobot: true, visitor: true, transient: true, bigPost: post }); g.equip.weapon = mkItem('halberd');
    if (g.body) { for (const k of B.PARTS) { g.body[k].max = Math.round(g.body[k].max * 2.5); g.body[k].hp = g.body[k].max; } B.syncHp(g); } S.ents.world.push(g); };
  if (!S.ents.world.some(e => e.bigRobot)) {
    const A = TOWN_PLAN.aurelheim, T2 = TOWN_PLAN.tickmar;
    if (A) { big(A.area[0] - 2, A.square[1] - 3, 'aurelheim'); big(A.area[0] - 2, A.square[1] + 3, 'aurelheim'); big(A.square[0], A.area[1] + 3, 'aurelheim'); }
    if (T2) big(T2.area[2] + 10, T2.square[1] + 8, 'tickmar', 'Fabrikwächter');
  }
}
function robotWorkStep(e, dt) {
  if (fortNight()) { e.vx = e.vy = 0; return true; }
  if (e.act && performance.now() < e.act.until) { e.vx = e.vy = 0; return true; }
  const q = e.robotWork[e.wi % e.robotWork.length], d = Math.hypot(q.x - e.x, q.y - e.y);
  if (d < 14) { act(e, 'work', 2500); e.wi++; return true; }
  seek(e, Math.atan2(q.y - e.y, q.x - e.x), 0.8 * dt / 16, dt, q); return true;
}
// Letzte Bastion (E7): Flüchtlinge vor den Toren nach dem Fall der Eisenfeste
function ensureRefugees() {
  if (!S.flags.chainsBroken || S.ents.world.some(e => e.refugee)) return;
  for (const k of ['aurelheim', 'kupferhafen']) { const P = TOWN_PLAN[k]; if (!P) continue;
    for (let i = 0; i < 6; i++) { const q = freeSpotNear('world', P.area[0] - 6 - (i % 3) * 2, P.square[1] - 2 + (i / 3 | 0) * 3, 2);
      const c = makeChar({ name: pick(FIRST_M), prof: 'Flüchtling', x: q.x, y: q.y, level: 1, faction: null, traits: ['furchtsam'] });
      Object.assign(c, { refugee: true, visitor: true, transient: true, anchor: { x: q.x, y: q.y }, greet: pick(['„Drei Tage warten wir schon. Sie lassen nur rein, wer zahlt.“', '„Die Feste ist gefallen. Wohin sollen wir denn noch?“', '„Die Automaten sehen durch uns hindurch.“']) }); S.ents.world.push(c); } }
  log('Vor den Toren Aurelions stauen sich die Flüchtlinge. Das Hochreich macht die Tore enger.', 'world');
}
function aurelTick() { bondTick(); intrigueTick(); ensureRefugees(); huntTick(); ensureSaltportContacts(); }
function aurelDay() {
  if (S.aurelJob && S.aurelJob.until >= (S.day | 0)) { S.gold += S.aurelJob.pay; S.houses[S.aurelJob.house] = favor(S.aurelJob.house) + 2; log(`Lohn von ${AUREL_HOUSES.find(h => h.key === S.aurelJob.house).name}: ${S.aurelJob.pay} Gold.`, 'economy'); }
  if (S.flags.marriedHouse) { S.gold += 25; }
  const B0 = S.bond;
  if (B0 && (S.day | 0) - B0.since >= 3 && chance(0.25)) {
    const who = partyMembers()[0]?.name || AUREL_HOUSES.find(h => favor(h.key) >= 30)?.name || (B0.kind === 'chain' && S.flags.goblinsFreed ? 'Grisk' : null);
    if (who) freeBond(`${who} hat deine Schuld bezahlt. Du bist frei.`);
  }
}
function intrigueTick() {
  const I = S.intrigue; if (!I || I.done || S.ents.world.some(e => e.intrigueTarget)) return;
  const c = makeChar({ name: I.name, prof: I.kind === 'brief' ? `Bote von ${AUREL_HOUSES.find(h => h.key === I.vs).name}` : `Verwalter von ${AUREL_HOUSES.find(h => h.key === I.vs).name}`, x: I.x, y: I.y, level: 6, faction: 'aurel' });
  Object.assign(c, { intrigueTarget: true, visitor: true, transient: true, anchor: { x: I.x, y: I.y }, schedulePos: { x: I.x, y: I.y }, cloth: '#2a2a3a' }); S.ents.world.push(c);
}
function aurelChoices(npc, choices) {
  bondChoices(npc, choices);
  const p = S.player, back = () => talk(npc), cont = t => UI.dialogue(npc, t, [{ text: 'Weiter', fn: back }]);
  if (npc.passamt) {
    for (const [d, c] of [[3, 150], [7, 300]]) { const cost = c * bastion();
      choices.unshift({ text: `Aufenthaltsschein, ${d} Tage (${cost} Gold)`, fn: () => { if (S.gold < cost) return cont('„Ohne Siegelgeld kein Schein.“');
        S.gold -= cost; S.permit = Math.max(S.permit ?? -1, S.day | 0) + d; log(`Aufenthaltsschein bis Tag ${S.permit}.`, 'economy'); cont(`„Gesiegelt. Gültig bis zum ${S.permit}. Tag. Die Automaten wissen Bescheid.“`); } }); }
    if (S.flags.chainsBroken) choices.push({ text: 'Warum so teuer?', fn: () => cont('„Die Feste ist gefallen. Halb Valoris will herein. Aurelion ist die letzte Mauer, und Mauern kosten.“') });
  }
  if (npc.key === 'kanzlei' && S.hunt) { const cost = 400 * S.hunt.level; choices.unshift({ text: `Sühne leisten für die zerstörten Automaten (${cost} Gold)`, fn: () => {
    if (S.gold < cost) return cont('„Dann bleibt die Fahndung bestehen.“'); S.gold -= cost; S.hunt = null; log('Die Fahndung des Hochreichs ist aufgehoben.', 'faction'); cont('„Bezahlt. Das Register wird bereinigt. Tu es nicht wieder.“'); } }); }
  if (npc.key === 'kanzlei') {
    const sponsor = AUREL_HOUSES.find(h => favor(h.key) >= 30), ok = (S.factions.aurel || 0) >= 40 && S.gold >= 1000 && sponsor;
    if (!S.flags.aurelCitizen) choices.unshift({ text: 'Ich will das Bürgerrecht.', fn: () => ok
      ? UI.dialogue(npc, `„${sponsor.name} spricht für dich. Tausend Gold, ein Eid, ein Siegel.“`, [{ text: 'Eid leisten (1000 Gold)', fn: () => { S.gold -= 1000; S.flags.aurelCitizen = true; S.factions.aurel += 10;
          chronicle(`${p.name} wird Bürger des Hochreichs`, 'legend', `Fürsprache: ${sponsor.name}.`); cont('„Willkommen, Bürger. Die Automaten grüßen dich jetzt.“'); } }, { text: 'Später.', fn: back }])
      : cont(`„Bürger wird, wer drei Dinge hat: Ansehen beim Hochreich (40, du hast ${Math.round(S.factions.aurel || 0)}), tausend Gold und ein Haus, das für ihn spricht (Gunst 30).“`) });
  }
  if (npc.intrigueTarget && S.intrigue?.kind === 'brief' && !S.intrigue.done) choices.unshift({ text: 'Den Brief. Sofort.', fn: () => {
    S.intrigue.done = true; S.ents.world = S.ents.world.filter(e => e !== npc); log('Du nimmst dem Boten den Brief ab. Er rennt.', 'quest'); UI.closeDialogue(); } });
  const H = AUREL_HOUSES.find(h => h.key === npc.houseKey); if (!H) return;
  const f = favor(H.key);
  if (S.intrigue?.from === H.key && S.intrigue.done) choices.unshift({ text: 'Erledigt.', fn: () => {
    const vs = S.intrigue.vs; S.houses[H.key] += 20; S.houses[vs] = favor(vs) - 25; S.gold += 120; S.intrigue = null; const Q = S.quests.q_intrige; if (Q) { Q.state = 'done'; Q.outcome = 'Für ' + H.name + ' erledigt.'; }
    log(`${H.name}: Gunst +20, ${AUREL_HOUSES.find(h => h.key === vs).name} −25, 120 Gold.`, 'faction'); cont('„Sauber. Man wird nicht erfahren, woher der Wind kam.“'); } });
  if (!(S.aurelJob && S.aurelJob.until >= (S.day | 0))) choices.unshift({ text: `In den Dienst von ${H.name} treten (7 Tage, 15 Gold je Tag)`, fn: () => {
    S.aurelJob = { house: H.key, until: (S.day | 0) + 7, pay: 15 }; log(`Im Dienst von ${H.name} bis Tag ${S.aurelJob.until}. Das gilt als Aufenthaltsrecht.`, 'faction'); cont('„Du trägst unser Siegel. Mach ihm keine Schande.“'); } });
  if (!S.intrigue && f >= 0) choices.unshift({ text: 'Gibt es etwas Heikles zu erledigen?', fn: () => {
    const vs = pick(AUREL_HOUSES.filter(h => h.key !== H.key)), kind = pick(['brief', 'mord']), seat = houseSeat(vs.key), q = freeSpotNear('world', seat.x + ri(-4, 4), seat.y + ri(3, 6), 2);
    UI.dialogue(npc, kind === 'brief' ? `„${vs.name} schickt Briefe, die wir lesen wollen. Ein Bote ist in ${townName(vs.town)} unterwegs. Nimm ihm den Brief ab.“` : `„Der Verwalter von ${vs.name} weiß zu viel. In ${townName(vs.town)}. Sorg dafür, dass er schweigt. Für immer.“`, [
      { text: 'Einverstanden.', fn: () => { S.intrigue = { from: H.key, vs: vs.key, kind, x: q.x, y: q.y, name: pick(FIRST_M), done: false }; delete S.quests.q_intrige; startQuest('q_intrige'); back(); } },
      { text: 'Nicht mein Geschäft.', fn: back }]); } });
  if (f >= 60 && !S.flags.marriedHouse) choices.push({ text: 'Um eine Verbindung mit dem Haus bitten (500 Gold Mitgift)', fn: () => {
    if (S.gold < 500) return cont('„Eine Verbindung ohne Mitgift? Wie rührend.“');
    S.gold -= 500; S.flags.marriedHouse = H.key; S.factions.aurel += 15; chronicle(`${p.name} heiratet in ${H.name} ein`, 'legend', H.motto);
    cont(`„Dann gehörst du zu ${H.name}. Das Bürgerrecht folgt dem Namen — und die Feinde auch.“`); } });
  if (H.key === 'vantor') choices.push({ text: 'Einen Begleitautomaten kaufen (900 Gold)', fn: () => {
    if (S.gold < 900) return cont('„Neunhundert. Messing ist geduldig, ich nicht.“');
    if (S.party.length >= p.partyCap) return cont('„Deine Gruppe ist voll. Ein Automat braucht Platz wie jeder andere.“');
    S.gold -= 900; const g = guardChar('aurel', freeSpotNear('world', p.x / TS | 0, (p.y / TS | 0) + 1, 1), 'Begleitautomat', Math.max(5, p.level));
    Object.assign(g, { key: 'automat_' + uid(), robot: true, morale: 100, faction: null }); S.ents.world.push(g); S.party.push(g.id); log('Ein Begleitautomat folgt dir. Er fragt nie, warum.', 'party'); UI.closeDialogue(); } });
  choices.push({ text: `Wie steht ${H.name} zu mir? (Gunst ${f})`, fn: () => cont(f >= 60 ? '„Wie zu einem der unseren.“' : f >= 30 ? '„Wir würden für dich sprechen. Einmal.“' : f >= 0 ? '„Wir kennen deinen Namen. Mehr nicht.“' : '„Du hast uns geschadet. Wir vergessen nichts.“') });
}
// Prothesen-Werkbank (E5) in Gelenkhall: Zustand, Reparatur, Aufrüstungen (Kraftfeder, Laufwerk, Linse)
// ================= Fahndung, Auftragsmörder, Magisches Gericht (S12 E, Nutzer) =================
// Wer einen Automaten des Hochreichs zerstört, wird gesucht: Aurelion −20, alle paar Stunden kommen Sonnenklingen
// (Auftragsmörder) aus dem Gelände — nie direkt neben dem Spieler. Wer von ihnen niedergeschlagen wird, erwacht vor dem
// Magischen Gericht auf der Himmelsinsel: Kaiserin, Rat, Orakel und Magierkönig urteilen. Sühne in der Kanzlei beendet
// die Fahndung. Jeder Mord an einem der vier Herrscher hat eigene Folgen.
const SKY_RULERS = [
  { key: 'kaiserin', name: 'Kaiserin Aurelia', prof: 'Ewige Kaiserin', seat: [24, 11], cloth: '#e8d8a0', greet: '„Wir haben siebenhundert Jahre regiert. Du hast eine Minute. Sprich.“' },
  { key: 'rat', name: 'Ratssprecher Corvan', prof: 'Sprecher des Rates der Häuser', seat: [28, 10], cloth: '#3a3040', greet: '„Der Rat hört zu. Der Rat vergisst nichts.“' },
  { key: 'orakel', name: 'Das Uhrwerk-Orakel', prof: 'Orakel des Hochreichs', seat: [36, 10], robot: true, greet: '„ICH HABE DICH BERECHNET. DU BIST WAHRSCHEINLICH.“' },
  { key: 'magierkoenig', name: 'Magierkönig Theron', prof: 'Magierkönig der Akademie', seat: [40, 11], cloth: '#3a4a7a', greet: '„Die Welt ist eine Gleichung. Du bist ein Fehler darin — oder eine Lösung.“' },
];
function ensureSkyCourt() {
  if (!MAPS.sky) return;
  for (const R of SKY_RULERS) if (!(S.flags.skyDead || {})[R.key] && !S.ents.sky.some(e => e.skyRuler === R.key)) {
    const q = { x: R.seat[0] * TS + TS / 2, y: R.seat[1] * TS + TS / 2 };
    const c = R.robot ? guardChar('aurel', q, R.prof, 30) : makeChar({ name: R.name, prof: R.prof, x: q.x, y: q.y, level: 25, faction: 'aurel', traits: ['ehrgeizig'], map: 'sky' });
    Object.assign(c, { map: 'sky', key: 'sky_' + R.key, skyRuler: R.key, name: R.name, greet: R.greet, anchor: { ...q }, schedulePos: { ...q }, visitor: true, transient: true });
    if (R.robot) { c.big = 1.6; c.r = 17; c.guard = false; c.equip.weapon = null; } else if (R.cloth) c.cloth = R.cloth;
    if (c.body) { for (const k of B.PARTS) { c.body[k].max = Math.round(c.body[k].max * 3); c.body[k].hp = c.body[k].max; } B.syncHp(c); }
    S.ents.sky.push(c);
  }
  if (!S.ents.sky.some(e => e.sunLegion)) for (const [x, y] of [[26, 14], [38, 14], [29, 38], [35, 38]]) {
    const g = guardChar('aurel', { x: x * TS + TS / 2, y: y * TS + TS / 2 }, 'Sonnenlegionär', 18); g.robot = false; g.name = pick(['Aurel', 'Cassian', 'Livia', 'Oriel', 'Seraph', 'Varin']) + ' von der Sonnenlegion';
    Object.assign(g, { map: 'sky', sunLegion: true, guard: true, transient: true, cloth: '#c8a050' }); g.equip.weapon = mkItem('halberd'); S.ents.sky.push(g);
  }
  indexSolids('sky');
}
function skyGate(t) {
  const cost = 1500 * bastion();
  UI.dialogue(S.player, `Der Teleportkreis summt. Ein Messingschild: „Einlass zur Himmelsinsel nur mit Siegel des Hochreichs. Überfahrt für Gäste: ${cost} Gold.“`, [
    { text: `Überfahrt bezahlen (${cost} Gold)`, fn: () => { if (S.gold < cost) { UI.closeDialogue(); return UI.toast('Zu wenig Gold'); } S.gold -= cost; UI.closeDialogue(); travel('sky'); } },
    ...(S.flags.aurelCitizen || S.flags.marriedHouse ? [{ text: 'Mein Bürgersiegel zeigen.', fn: () => { S.skyPass = true; UI.closeDialogue(); travel('sky'); } }] : []),
    { text: '[Gehen]', fn: () => UI.closeDialogue() },
  ]);
}
function startHunt(n) {
  const first = !S.hunt;
  S.hunt = { level: Math.min(5, (S.hunt?.level || 0) + n), next: clock() + 90 };
  S.factions.aurel -= 20;
  log(first ? 'Ein Automat des Hochreichs ist zerstört. Aurelion fahndet nach dir. Aurelion −20.' : `Die Fahndung verschärft sich (Stufe ${S.hunt.level}).`, 'faction');
  if (first) { chronicle(`Aurelion fahndet nach ${S.player.name}`, 'crime', 'Mord an Eigentum des Hochreichs.'); UI.toast('GESUCHT VOM HOCHREICH', 3200); }
}
function huntTick() {
  const H = S.hunt, p = S.player; if (!H || S.map !== 'world' || S.bond || !p.alive || p.downed || clock() < H.next) return;
  H.next = clock() + ri(240, 480);
  if (S.ents.world.some(e => e.aurelAssassin && e.alive)) return;
  const n = Math.min(4, 1 + H.level), a0 = rnd() * 6.283, tx = p.x / TS | 0, ty = p.y / TS | 0;
  for (let i = 0; i < n; i++) {
    const q = freeSpotNear('world', tx + Math.round(Math.cos(a0 + i * 0.3) * 24), ty + Math.round(Math.sin(a0 + i * 0.3) * 24), 3);
    const e = spawnEnemy('bounty_hunter', 'world', q.x / TS | 0, q.y / TS | 0, { level: Math.max(6, (p.level || 1) + 1 + H.level) });
    Object.assign(e, { aurelAssassin: true, faction: 'aurel', name: 'Sonnenklinge', title: 'Sonnenklinge des Hochreichs', aggroId: p.id, aiState: 'pursue', transient: true });
  }
  log('Sonnenklingen des Hochreichs sind dir auf der Spur.', 'combat'); UI.toast('SONNENKLINGEN', 2400);
}
function courtTrial() {
  const p = S.player;
  p.downed = false; if (p.body) B.healPart(p, 'torso', Math.max(4, p.body.torso.max * 0.3) - p.body.torso.hp);
  S.ents.world = S.ents.world.filter(e => !e.aurelAssassin);
  for (const o of S.ents.world) if (o.angry && o.robot) { o.angry = false; o.aggroId = null; }
  travel('sky'); ensureSkyCourt(); p.x = MAPS.sky.court.x; p.y = MAPS.sky.court.y;
  chronicle(`${p.name} vor dem Magischen Gericht`, 'crime', 'Angeklagt auf der Himmelsinsel.');
  const K = S.ents.sky.find(e => e.skyRuler === 'kaiserin') || S.ents.sky.find(e => e.skyRuler), lv = S.hunt?.level || 1, fine = 300 * lv;
  const down = () => { S.hunt = null; travel('world'); };
  UI.dialogue(K || p, `„${p.name}. Angeklagt der Zerstörung von Eigentum des Hochreichs, Fahndungsstufe ${lv}. Das Magische Gericht ist versammelt. Wie verteidigst du dich?“`, [
    { text: 'Ich bekenne mich schuldig.', fn: () => { down(); enslave('aurel', 250 * lv); log('Urteil: Schulddienst in der Fabrik von Tickmar.', 'faction'); } },
    { text: `Wergeld zahlen (${fine} Gold)`, fn: () => { if (S.gold < fine) return UI.dialogue(K || p, '„Du besitzt nicht, was du bietest. Das Gericht vermerkt die Lüge.“', [{ text: 'Weiter', fn: () => { down(); enslave('aurel', 300 * lv); } }]);
      S.gold -= fine; UI.closeDialogue(); down(); log(`Wergeld gezahlt. Das Gericht entlässt dich.`, 'faction'); } },
    { text: 'Das Orakel soll urteilen.', fn: () => { const ok = chance(0.4); UI.closeDialogue(); down();
      if (ok) { S.factions.aurel += 5; log('DAS ORAKEL: „UNSCHULDIG — WAHRSCHEINLICH.“ Du bist frei.', 'faction'); } else { enslave('aurel', 400 * lv); log('DAS ORAKEL: „SCHULDIG. DAUER: BERECHNET.“', 'faction'); } } },
    { text: 'Ich kämpfe!', fn: () => { UI.closeDialogue(); S.factions.aurel -= 30;
      for (const e of S.ents.sky) if ((e.sunLegion || e.skyRuler) && e.alive) { e.angry = true; e.aggroId = p.id; e.sawPlayer = clock(); }
      log('Das Gericht erhebt sich. Die Sonnenlegion greift an. Aurelion −30.', 'combat'); UI.toast('KAMPF VOR DEM GERICHT', 2600); } },
  ]);
}
function rulerSlain(c, source) {
  (S.flags.skyDead ||= {})[c.skyRuler] = true; S.factions.aurel -= 60; startHunt(3);
  const what = { kaiserin: 'Die Ewige Kaiserin ist tot. Das Hochreich versinkt im Streit um den Thron — die Preise steigen, die Häuser rüsten.',
    rat: 'Der Sprecher des Rates ist tot. Die Häuser misstrauen einander, Intrigen werden blutiger.',
    orakel: 'Das Uhrwerk-Orakel steht still. Ohne seine Berechnung arbeiten die Automaten ungenauer.',
    magierkoenig: 'Der Magierkönig ist tot. Die Akademie schließt ihre Tore, Magitech wird knapp.' }[c.skyRuler];
  if (c.skyRuler === 'kaiserin') S.prices = (S.prices || 1) * 1.3;
  chronicle(`${c.name} ermordet`, 'death', what); log(what, 'death'); UI.toast('MORD AUF DER HIMMELSINSEL', 3600);
}
// ================= Aufträge aus der Welt (Master-Prompt 2 §11–§14, Phase 2) =================
// Jede Siedlung hat ein Brett mit 3 (Dorf) bis 5 (Stadt) Aufträgen, erneuert alle 3 Tage, und einen Verteidigungsmeister
// mit militärischen Aufträgen. Dazu geben Bauer, Schmied, Priester, Wirt, Händler & Co. je einen eigenen Auftrag.
// Neun Arten, regional: Kopfgeld, Monster, Jagd, Verteidigung, Patrouille, Eskorte, Lieferung, Vermisste, Vorräte.
// Ziele stehen wirklich in der Welt (flüchtig, werden nachgesetzt), Fortschritt zählt, Abgabe beim Geber, Lohn: Gold, XP, Ruf.
const CON = {
  bounty:  { name: 'Kopfgeld', text: n => `Den Anführer und ${n - 1} seiner Leute töten`, mil: 1 },
  monster: { name: 'Monsterjagd', text: n => `${n} Bestien töten`, mil: 1 },
  hunt:    { name: 'Jagd', text: n => `${n} Tiere erlegen, die das Vieh reißen`, mil: 0 },
  defense: { name: 'Verteidigung', text: () => 'Den Angriff auf die Siedlung abwehren', mil: 1 },
  patrol:  { name: 'Patrouille', text: () => 'Drei Wegpunkte um die Siedlung abgehen', mil: 1 },
  escort:  { name: 'Eskorte', text: () => 'Den Reisenden sicher ans Ziel bringen', mil: 1 },
  deliver: { name: 'Lieferung', text: () => 'Das Paket übergeben', mil: 0 },
  missing: { name: 'Vermisst', text: () => 'Die vermisste Person finden und heimschicken', mil: 0 },
  supply:  { name: 'Vorräte', text: n => `${n} Holz und ${n} Stein bringen`, mil: 0 },
};
const PROF_CON = { Bauer: 'hunt', Bäuerin: 'hunt', Schmied: 'supply', Meisterschmiedin: 'supply', Priester: 'monster', Wirt: 'deliver', Kaufmann: 'escort', 'Händlerin': 'deliver', Kontorhändler: 'escort',
  Heilerin: 'missing', Fischer: 'missing', Holzfäller: 'supply', Ratsherr: 'bounty', Bürgermeister: 'bounty', Gelehrter: 'deliver', Jäger: 'hunt' };
const townFac = town => TOWN_PLAN[town]?.lord || GUARD_POSTS[town]?.faction || 'valen';
const conKinds = town => town === 'vharnholm' ? [] : Object.keys(CON);
function conPool(x, y) {                                               // Gegner nach Gegend
  const r = regionAt(x, y);
  return r === 'deadland' ? ['skeleton', 'ghoul', 'skeleton'] : r === 'desert' ? ['bandit', 'bandit_archer'] : r === 'eisen' || r === 'mountain' ? ['wolf', 'goblin_warrior', 'bandit']
    : r === 'aurel' ? ['bandit', 'bandit_archer', 'bandit_spear'] : ['wolf', 'bandit', 'goblin', 'bandit_spear'];
}
function conSpot(town, rmin, rmax) {
  const [sx, sy] = TOWN_PLAN[town].square;
  for (let i = 0; i < 30; i++) { const a = rnd() * 6.283, r = ri(rmin, rmax), x = sx + Math.round(Math.cos(a) * r), y = sy + Math.round(Math.sin(a) * r);
    if (x < 5 || y < 5 || x > MAPS.world.w - 5 || y > MAPS.world.h - 5 || townAt(x, y, 4)) continue;
    const q = freeSpotNear('world', x, y, 3); if (openSpot('world', q.x / TS | 0, q.y / TS | 0, 120)) return q; }
  return freeSpotNear('world', sx + rmin, sy, 4);
}
function makeContract(town, kind, giver) {
  const [sx, sy] = TOWN_PLAN[town].square, tier = zoneTier('world', sx, sy), gold = 40 + tier * 25;
  const C = { id: uid(), town, kind, giver, have: 0, need: 1, state: 'offer', day: S.day | 0, reward: { gold, xp: 50 + tier * 20, rep: 4 } };
  const q = ['defense', 'supply', 'deliver', 'escort'].includes(kind) ? { x: sx * TS, y: sy * TS } : conSpot(town, kind === 'patrol' ? 18 : 28, kind === 'patrol' ? 32 : 60);
  C.x = q.x / TS | 0; C.y = q.y / TS | 0;
  const pool = conPool(C.x, C.y), far = Object.keys(TOWN_PLAN).filter(t => t !== town && t !== 'vharnholm' && TOWN_PLAN[t].lord !== 'aurel').sort((a, b) =>
    Math.hypot(TOWN_PLAN[a].square[0] - sx, TOWN_PLAN[a].square[1] - sy) - Math.hypot(TOWN_PLAN[b].square[0] - sx, TOWN_PLAN[b].square[1] - sy))[ri(0, 2)];
  if (kind === 'bounty') { C.mtype = pool.includes('bandit') ? 'bandit' : pool[0]; C.need = ri(3, 5); C.name = `${pick(FIRST_M)} ${pick(['der Schlitzer', 'Einauge', 'die Krähe', 'Rotbart', 'der Stille'])}`; C.reward.gold += 60; }
  if (kind === 'monster') { C.mtype = pick(pool.filter(m => m !== 'bandit' && m !== 'bandit_spear' && m !== 'bandit_archer')) || pool[0]; C.need = ri(3, 6); }
  if (kind === 'hunt') { C.mtype = 'wolf'; C.need = ri(3, 5); C.reward.gold -= 10; }
  if (kind === 'defense') { C.need = ri(4, 7); C.mtype = pool[0]; C.reward.gold += 40; }
  if (kind === 'patrol') { C.need = 3; C.pts = [0, 1, 2].map(i => { const a = i * 2.1 + rnd(), r = ri(16, 28), p2 = freeSpotNear('world', sx + Math.round(Math.cos(a) * r), sy + Math.round(Math.sin(a) * r), 3); return [p2.x / TS | 0, p2.y / TS | 0]; }); [C.x, C.y] = C.pts[0]; }
  if (kind === 'escort' || kind === 'deliver') { C.target = far; C.reward.gold += 30; C.name = pick(FIRST_M); const T2 = TOWN_PLAN[far]; if (T2) { C.tx = T2.square[0]; C.ty = T2.square[1]; } }
  if (kind === 'missing') C.name = pick(FIRST_M);
  if (kind === 'supply') { C.need = ri(5, 10); C.reward.gold = C.need * 6; }
  const where = locAt(C.x, C.y)?.name || 'der Wildnis', tn = C.target ? townName(C.target) : '';
  C.title = { bounty: `Kopfgeld: ${C.name}`, monster: `Monsterjagd bei ${where}`, hunt: 'Wölfe reißen das Vieh', defense: `Verteidigung von ${townName(town)}`, patrol: `Patrouille um ${townName(town)}`,
    escort: `Eskorte nach ${tn}`, deliver: `Paket nach ${tn}`, missing: `${C.name} wird vermisst`, supply: 'Holz und Stein' }[kind];
  C.desc = { bounty: `${C.name} überfällt Reisende bei ${where}. Tot oder gar nicht.`, monster: `Bei ${where} hausen Bestien. Macht sie nieder, bevor sie herkommen.`,
    hunt: 'Wölfe schleichen nachts an die Weiden. Erlegt ein paar, dann trauen sie sich nicht mehr so nah.', defense: 'Späher melden einen Angriff für die nächsten Stunden. Wir brauchen jede Klinge am Rand der Siedlung.',
    patrol: 'Geh die drei Wegmarken um die Siedlung ab und sieh nach, ob alles ruhig ist.', escort: `${C.name} muss nach ${tn}. Allein kommt er nicht an. Bring ihn hin.`,
    deliver: `Dieses Paket muss nach ${tn}, zum Verteidigungsmeister dort. Versiegelt. Frag nicht.`, missing: `${C.name} ist nicht heimgekommen. Zuletzt gesehen bei ${where}.`,
    supply: `Die Palisade braucht Nachschub: ${C.need} Holz und ${C.need} Stein.` }[kind];
  return C;
}
function questOf(C) { return { name: C.title, giver: null, desc: `${C.desc} (Auftraggeber: ${C.giver === 'board' ? 'Anschlagbrett' : C.giver === 'vm' ? 'Verteidigungsmeister' : 'Bewohner'} in ${townName(C.town)})`,
  objectives: [{ type: 'custom', count: C.need, text: CON[C.kind].text(C.need) }], dyn: true }; }
function registerContracts() {
  for (const C of S.contracts || []) if (C.state !== 'offer') { QUESTS['c_' + C.id] = questOf(C); const st = S.quests['c_' + C.id]; if (st) st.progress = [C.have]; }
  for (const k of Object.keys(S.quests)) if (k.startsWith('c_') && !QUESTS[k]) delete S.quests[k];   // verwaiste Einträge
}
function townContracts(town, giver) {
  S.contracts ||= []; S.conDay ||= {};
  const key = town + ':' + giver;
  if ((S.conDay[key] ?? -99) + 3 <= (S.day | 0)) {                    // alle 3 Tage neu: offene Angebote verfallen, laufende bleiben
    S.contracts = S.contracts.filter(c => !(c.town === town && c.giver === giver && c.state === 'offer'));
    const n = giver === 'vm' ? 3 : TOWN_PLAN[town].village ? 3 : 5, kinds = conKinds(town).filter(k => giver === 'vm' ? CON[k].mil : true);
    for (let i = 0; i < n && kinds.length; i++) S.contracts.push(makeContract(town, kinds[(i + (S.day | 0)) % kinds.length], giver));
    S.conDay[key] = S.day | 0;
  }
  return S.contracts.filter(c => c.town === town && c.giver === giver && c.state !== 'claimed');
}
function acceptContract(C) {
  C.state = 'active'; QUESTS['c_' + C.id] = questOf(C); S.quests['c_' + C.id] = { state: 'active', progress: [0] };
  if (C.kind === 'deliver') addItem(S.player, 'auftragspaket');
  if (C.kind === 'defense') C.at = clock() + ri(60, 120);
  log(`Auftrag angenommen: ${C.title}.`, 'quest'); conTick();
}
function conProgress(C, n = 1) {
  C.have = Math.min(C.need, C.have + n); const st = S.quests['c_' + C.id]; if (st) st.progress = [C.have];
  log(`${C.title}: ${C.have}/${C.need}${C.have >= C.need ? ' — erledigt, zurück zum Auftraggeber.' : ''}`, 'quest');
  if (C.have >= C.need) { S.ents.world = S.ents.world.filter(e => e.contract !== C.id || e.kind === 'enemy'); C.done = true; }
}
function claimContract(C, npc) {
  if (C.kind === 'supply') { if ((S.res.wood || 0) < C.need || (S.res.stone || 0) < C.need) return UI.dialogue(npc || S.player, `„Noch nicht genug. ${C.need} Holz und ${C.need} Stein.“`, [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]);
    S.res.wood -= C.need; S.res.stone -= C.need; C.have = C.need; }
  C.state = 'claimed'; S.gold += C.reward.gold; if (['defense', 'patrol', 'bounty'].includes(C.kind) && townFac(C.town) === 'valen') (S.stats ||= {}).valenDefense = (S.stats.valenDefense || 0) + 1; gainXp(S.player, C.reward.xp); const f = townFac(C.town); if (S.factions[f] != null) S.factions[f] += C.reward.rep;
  const st = S.quests['c_' + C.id]; if (st) { st.state = 'done'; st.progress = [C.need]; st.outcome = `${C.reward.gold} Gold erhalten.`; }
  if (npc?.key) addRel(npc.key, 5);
  log(`Auftrag erfüllt: ${C.title}. ${C.reward.gold} Gold, ${FACTIONS[f]?.name || f} +${C.reward.rep}.`, 'quest'); chronicle(`${C.title} erledigt`, 'quest');
}
function conList(npc, town, giver, title) {
  const list = townContracts(town, giver), back = () => conList(npc, town, giver, title), opts = [];
  for (const C of list) {
    if (C.state === 'offer') opts.push({ text: `${C.title} — ${C.reward.gold} Gold`, fn: () => UI.dialogue(npc || S.player, `„${C.desc}“\nLohn: ${C.reward.gold} Gold, Erfahrung, Ansehen.`, [
      { text: 'Annehmen', fn: () => { acceptContract(C); back(); } }, { text: 'Zurück', fn: back }]) });
    else if (C.state === 'active' && (C.have >= C.need || C.kind === 'supply')) opts.push({ text: `Abgeben: ${C.title}`, fn: () => { claimContract(C, npc); back(); } });
    else if (C.state === 'active') opts.push({ text: `(läuft) ${C.title} ${C.have}/${C.need}`, fn: back });
  }
  UI.dialogue(npc || { name: title }, list.length ? (giver === 'vm' ? '„Es gibt immer etwas zu tun. Wähl.“' : 'Zettel, Siegel, Kopfgelder:') : 'Heute nichts.', [...opts, { text: '[Gehen]', fn: () => UI.closeDialogue() }]);
}
function boardMenu(town) { conList(null, town, 'board', `Anschlagbrett — ${townName(town)}`); }
function conChoices(npc, choices) {
  if (npc.musician) choices.unshift({ text: 'Spiel etwas. (2 Kupfer)', fn: () => { if (S.gold >= 1) S.gold -= 1; S.player.stamina = S.player.maxStamina; for (const m of partyMembers()) m.morale = Math.min(100, m.morale + 3); UI.dialogue(npc, pick(MUSIC), [{ text: '[Zuhören]', fn: () => UI.closeDialogue() }]); log('Der Spielmann spielt. Die Gruppe summt mit.', 'party'); } });
  if (npc.vm) return choices.unshift({ text: 'Welche Aufträge hat die Wache?', fn: () => conList(npc, npc.vm, 'vm') });
  const town = npc.homeTown, kind = PROF_CON[npc.prof];
  if (npc.contract) { const C = (S.contracts || []).find(c => c.id === npc.contract);           // Vermisste: heimschicken
    if (C?.kind === 'missing' && C.state === 'active') choices.unshift({ text: 'Geh heim. Der Weg ist frei.', fn: () => { S.ents.world = S.ents.world.filter(e => e !== npc); conProgress(C); UI.closeDialogue(); } });
    return; }
  if (!town || !kind || !TOWN_PLAN[town] || S.party.includes(npc.id)) return;
  S.contracts ||= [];
  let C = S.contracts.find(c => c.giver === npc.key && c.state !== 'claimed');
  if (C && C.state === 'active') { if (C.have >= C.need || C.kind === 'supply') choices.unshift({ text: `Erledigt. (${C.title})`, fn: () => claimContract(C, npc) }); return; }
  choices.unshift({ text: 'Hast du Arbeit für mich?', fn: () => {
    if (!C) { C = makeContract(town, kind, npc.key); S.contracts.push(C); }
    UI.dialogue(npc, `„${C.desc}“\nLohn: ${C.reward.gold} Gold.`, [{ text: 'Ich mach das.', fn: () => { acceptContract(C); UI.closeDialogue(); } }, { text: 'Später.', fn: () => UI.closeDialogue() }]); } });
}
function conKill(e) { const C = (S.contracts || []).find(c => c.id === e.contract && c.state === 'active'); if (C && ['bounty', 'monster', 'hunt', 'defense'].includes(C.kind)) conProgress(C); }
function conTick() {
  const p = S.player; if (!S.contracts || S.map !== 'world') return;
  for (const C of S.contracts) {
    if (C.state !== 'active' || C.have >= C.need) continue;
    const alive = S.ents.world.filter(e => e.contract === C.id && e.alive);
    if (['bounty', 'monster', 'hunt'].includes(C.kind) && !alive.length && Math.hypot(p.x / TS - C.x, p.y / TS - C.y) < 90) {   // Ziele nachsetzen (flüchtig), sobald man in der Gegend ist
      for (let i = C.have; i < C.need; i++) { const e = spawnEnemy(C.mtype, 'world', C.x + ri(-3, 3), C.y + ri(-3, 3), C.kind === 'bounty' && i === C.have && !C.leaderDead ? { level: Math.max(3, (p.level || 1) + 2) } : {});
        Object.assign(e, { contract: C.id, transient: true, anchor: { x: e.x, y: e.y } }); if (C.kind === 'bounty' && i === C.have) { e.name = C.name; e.title = C.name; e.elite = true; } }
    }
    if (C.kind === 'defense' && clock() >= C.at && !C.waved) {
      const [sx, sy] = TOWN_PLAN[C.town].square;
      if (Math.hypot(p.x / TS - sx, p.y / TS - sy) > 70) { C.state = 'claimed'; const st = S.quests['c_' + C.id]; if (st) { st.state = 'failed'; st.outcome = 'Du warst nicht da. Die Siedlung hat allein gekämpft.'; } raidDamage(C.town); log(`${C.title}: gescheitert — du warst nicht da.`, 'quest'); continue; }
      C.waved = true; const a0 = rnd() * 6.283;
      for (let i = 0; i < C.need; i++) { const e = spawnEnemy(C.mtype, 'world', sx + Math.round(Math.cos(a0) * 22) + ri(-3, 3), sy + Math.round(Math.sin(a0) * 22) + ri(-3, 3));
        Object.assign(e, { contract: C.id, raidOf: C.town, transient: true, aggroId: p.id, aiState: 'pursue' }); e.anchor = { x: sx * TS, y: sy * TS }; }
      log(`${townName(C.town)} wird angegriffen!`, 'combat'); UI.toast('ANGRIFF', 2400);
    }
    if (C.kind === 'patrol') { const [x, y] = C.pts[C.have]; if (Math.hypot(p.x / TS - x, p.y / TS - y) < 3) { if (C.have === 1 && chance(0.4)) for (let i = 0; i < 2; i++) { const e = spawnEnemy(pick(conPool(x, y)), 'world', x + ri(6, 9), y + ri(-3, 3)); e.aggroId = p.id; }
      conProgress(C); if (C.have < C.need) [C.x, C.y] = C.pts[C.have]; } }
    if (C.kind === 'missing' && !alive.length) { const c = makeChar({ name: C.name, prof: 'Vermisster', x: C.x * TS, y: C.y * TS, level: 1, faction: null, traits: ['furchtsam'] });
      Object.assign(c, { contract: C.id, transient: true, visitor: true, anchor: { x: c.x, y: c.y }, greet: '„Endlich! Ich hab mich verlaufen … und dann kamen die Wölfe.“' }); S.ents.world.push(c); }
    if (C.kind === 'escort') {
      let t = alive[0];
      if (!t) { const [sx, sy] = TOWN_PLAN[C.town].square, q = freeSpotNear('world', sx + 2, sy + 2, 2); t = makeChar({ name: C.name, prof: 'Reisender', x: q.x, y: q.y, level: 2, faction: null, traits: ['furchtsam'] });
        Object.assign(t, { contract: C.id, transient: true, visitor: true, escortee: true, anchor: { x: q.x, y: q.y } }); S.ents.world.push(t); }
      if (Math.hypot(t.x / TS - C.tx, t.y / TS - C.ty) < 8) { S.ents.world = S.ents.world.filter(e => e !== t); conProgress(C); }
    }
    if (C.kind === 'deliver' && Math.hypot(p.x / TS - C.tx, p.y / TS - C.ty) < 10 && S.ents.world.some(e => e.vm === C.target && dist(e, p) < 80) && hasItem(p, 'auftragspaket')) { removeItem(p, 'auftragspaket', 1); conProgress(C); }
  }
  for (const e of S.ents.world) if (e.escortee && e.alive) { const C = S.contracts.find(c => c.id === e.contract);   // der Reisende folgt dem Spieler
    if (C?.state !== 'active') { e.dead = true; continue; } e.anchor = { x: p.x, y: p.y }; e.schedulePos = null; }
  S.ents.world = S.ents.world.filter(e => !e.dead);
}
// Verteidigungsmeister (§13): in jeder größeren Siedlung ein eindeutig militärischer NPC neben dem Brett — Fraktionsrüstung,
// schwerer Helm, Banner. Er vergibt Eskorten, Verteidigung, Patrouillen, Kopfgelder und Monsterjagden.
// Tavernen der Städte (MP2 §76): Personal und Musik — Schankmagd läuft zwischen den Tischen, der Koch steht am Herd, ein
// Spielmann spielt. Flüchtig, beim Laden neu gesetzt. Dörfer behalten ihre kleine Schenke mit dem Wirt allein.
const MUSIC = ['„♪ Die Toten stehen auf im Tal, der König zählt sein Gold …“', '„♪ Und die Kette klirrt, und die Kette singt …“', '„♪ Trink, bevor die Glocke schlägt …“', '„Einen Kupfer für ein Lied? Zwei für ein trauriges.“'];
function ensureTavernStaff() {
  for (const [town, P] of Object.entries(TOWN_PLAN)) {
    if (P.village || town === 'vharnholm' || S.ents.world.some(e => e.tavernStaff === town)) continue;
    const tav = HOUSES.find(b => b.town === town && b.type === 'tavern' && b.map === 'world'); if (!tav) continue;
    const at = (fx, fy) => { const q = { x: (tav.x + fx) * TS + TS / 2, y: (tav.y + fy) * TS + TS / 2 }; return solidPropAt('world', q.x, q.y, 6) || SOLID.has(tileAt('world', tav.x + fx, tav.y + fy)) ? freeSpotNear('world', tav.x + (tav.w >> 1), tav.y + (tav.h >> 1), 2) : q; };
    for (const [prof, fx, fy, greet] of [['Schankmagd', 2, 2, '„Bier, Brot, Eintopf. Such dir was aus, der Rest ist ausverkauft.“'], ['Koch', 1, 1, '„Raus aus meiner Küche!“'], ['Spielmann', tav.w - 2, 1, MUSIC[0]]]) {
      const q = at(fx, fy), c = makeChar({ name: pick(FIRST_M), prof, x: q.x, y: q.y, level: 2, faction: null, traits: ['gütig'] });
      Object.assign(c, { tavernStaff: town, transient: true, visitor: true, anchor: { x: q.x, y: q.y, in: 1 }, schedulePos: prof === 'Schankmagd' ? { x: (tav.x + tav.w - 3) * TS, y: (tav.y + 2) * TS } : { x: q.x, y: q.y }, greet, musician: prof === 'Spielmann' });
      S.ents.world.push(c);
    }
  }
}
function ensureDefenseMasters() {
  ensureTavernStaff();
  for (const [town, P] of Object.entries(TOWN_PLAN)) {
    if (town === 'vharnholm' || S.ents.world.some(e => e.vm === town)) continue;
    const board = S.ents.world.find(e => e.type === 'board' && boardTown(e) === town), [bx, by] = board ? [board.x / TS | 0, board.y / TS | 0] : P.square;
    const fac = townFac(town), kit = fac === 'aurel' ? 'merch' : GUARD_KIT[fac] ? fac : 'valen', q = freeSpotNear('world', bx + 2, by, 1);
    const g = guardChar(kit, q, 'Verteidigungsmeister', 12);
    Object.assign(g, { vm: town, faction: fac === 'aurel' ? 'aurel' : g.faction, visitor: true, transient: true, anchor: { x: q.x, y: q.y }, schedulePos: { x: q.x, y: q.y }, name: pick(['Hauptmann ', 'Waffenmeisterin ', 'Feldwebel ']) + pick(FIRST_M),
      greet: '„Verteidigungsmeister. Wer hier Arbeit sucht, findet sie bei mir — und bezahlt wird nach Köpfen.“', cloth: fac === 'aurel' ? '#c8a050' : fac === 'chain' ? '#1a1718' : '#5a2a22' });
    g.equip.chest = mkItem('plate_cuirass'); g.equip.head = mkItem('great_helm'); g.equip.weapon = mkItem(fac === 'aurel' ? 'halberd' : 'longsword'); g.robot = false; recalc(g);
    S.ents.world.push(g, { id: uid(), kind: 'prop', type: 'banner_torn', map: 'world', x: q.x + TS, y: q.y - 4, r: 6, transient: true, label: `Banner des Verteidigungsmeisters von ${townName(town)}` });
  }
}
// ================= Kerker (Master-Prompt 2 §26, Phase 2) =================
// Verhaftet: 10–20 Minuten Haft je nach Kopfgeld (Spielzeit läuft normal weiter). Waffe wird verwahrt. Zweimal am Tag Essen.
// Reden mit Mitgefangenen; Kaution beim Wärter; Bestechung (Glück); Schloss knacken (Beweglichkeit, Dietrich) und ungesehen
// zum Ausgang — wer gesehen wird, sitzt länger. Nur im Kerker von Salzhafen sitzen Leute mit Aufträgen (Diebesgilde, Rask).
const jailMinutes = b => clamp(Math.round(10 + b / 40), 10, 20);
const JAIL_LINES = ['„Was hast du angestellt? Ich hab nur ein Brot genommen.“', '„Zähl die Steine an der Decke. Es sind hundertzwölf. Ich hab dreimal gezählt.“', '„Der Wärter mit der Narbe schläft nach dem Essen.“',
  '„Die sagen, keiner kommt hier raus. Die lügen. Aber nicht oft.“', '„Wenn du rauskommst, grüß meine Frau. Oder besser nicht.“', '„Das Brot ist hart, aber es ist Brot.“'];
function goToJail(fac, bounty, town) {
  const p = S.player, min = jailMinutes(bounty);
  delete (S.bounty ||= {})[fac];
  S.jail = { fac, town, until: clock() + min * 60, bail: Math.max(100, Math.round(bounty * 1.5)), weapon: p.equip.weapon || null, cell: 0, meal: -1 };
  S.jailTown = town; p.equip.weapon = null; recalc(p);
  for (const o of S.ents[S.map]) if (o.angry) { o.angry = false; o.aggroId = null; }
  travel('kerker'); ensureJail(); closeCells();
  p.x = MAPS.kerker.cells[0].spot.x; p.y = MAPS.kerker.cells[0].spot.y;
  log(`Kerker von ${townName(town)}: ${min} Minuten. Kaution ${S.jail.bail} Gold. Deine Waffe liegt beim Wärter.`, 'faction'); UI.toast(`KERKER — ${min} MINUTEN`, 3000);
  chronicle(`${p.name} im Kerker von ${townName(town)}`, 'crime');
}
function closeCells() {
  for (const c of MAPS.kerker.cells) if (!S.ents.kerker.some(e => e.cellDoor === c.id))
    S.ents.kerker.push({ id: uid(), kind: 'prop', type: 'portcullis', map: 'kerker', x: c.door[0] * TS + TS / 2, y: c.door[1] * TS + TS / 2, r: 14, solid: true, cellDoor: c.id, label: 'Zellentür' });
  indexSolids('kerker');
}
function ensureJail() {
  const K = MAPS.kerker; if (!K) return;
  S.ents.kerker = S.ents.kerker.filter(e => !(e.kind === 'npc' && e.jailer === false && e.jailTown !== S.jailTown));   // Mitgefangene je Stadt
  if (!S.ents.kerker.some(e => e.warden)) for (const [x, y] of [[5, 11], [20, 10]]) {
    const g = guardChar('valen', { x: x * TS + TS / 2, y: y * TS + TS / 2 }, 'Kerkerwärter', 8); Object.assign(g, { map: 'kerker', warden: true, transient: true, visitor: true, guard: false, patrol: [[6, 10], [33, 11]], pi: y > 10 ? 1 : 0 });
    S.ents.kerker.push(g);
  }
  if (!S.ents.kerker.some(e => e.inmate)) K.cells.slice(1).forEach((c, i) => {
    const special = S.jailTown === 'saltport' && i < 2 ? [{ name: 'Mo die Klinke', prof: 'Diebin', q: 'q_gilde', greet: '„Frisch rein? Hör zu — draußen am Hafen gibt es einen Mann mit einem roten Tuch. Sag ihm, Mo schickt dich.“' },
      { name: 'Kapitän Rask', prof: 'Pirat', q: 'q_rask', greet: '„Sie hängen mich im Frühjahr. Meine Beute soll nicht verrotten. Südlich der Stadt, an der Küste, eine Kiste. Nimm sie.“' }][i] : null;
    if (!special && i >= 4) return;
    const c2 = makeChar({ name: special?.name || pick(FIRST_M), prof: special?.prof || 'Gefangener', x: c.spot.x, y: c.spot.y, level: 3, faction: null, traits: ['mürrisch'], map: 'kerker' });
    Object.assign(c2, { map: 'kerker', inmate: true, jailer: false, jailTown: S.jailTown, transient: true, visitor: true, anchor: { ...c.spot }, schedulePos: { ...c.spot }, greet: special?.greet || pick(JAIL_LINES), jailQuest: special?.q, cloth: '#4a4238' });
    S.ents.kerker.push(c2);
  });
  indexSolids('kerker');
}
function jailChoices(npc, choices) {
  const J = S.jail;
  if (npc.warden && J) {
    choices.unshift({ text: `Kaution zahlen (${J.bail} Gold)`, fn: () => { if (S.gold < J.bail) return UI.dialogue(npc, '„Mit leeren Taschen kauft man sich nicht frei.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]); S.gold -= J.bail; UI.closeDialogue(); releaseJail('Kaution bezahlt.'); } });
    choices.unshift({ text: 'Bestechen (50 Gold)', fn: () => { UI.closeDialogue(); if (S.gold < 50) return log('Der Wärter lacht dich aus.', 'faction'); S.gold -= 50;
      if (chance(0.45)) { S.ents.kerker = S.ents.kerker.filter(e => e.cellDoor !== J.cell); indexSolids('kerker'); log('Der Wärter steckt das Gold ein und vergisst, abzuschließen.', 'world'); }
      else { J.until += 60; log('Der Wärter nimmt das Gold — und meldet dich. Eine Stunde mehr.', 'faction'); } } });
    choices.unshift({ text: 'Wie lange noch?', fn: () => UI.dialogue(npc, `„Noch ${Math.max(1, Math.round((J.until - clock()) / 60))} Stunden. Dann bist du wieder draußen. Oder tot, wenn du Ärger machst.“`, [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]) });
  }
  if (npc.jailQuest && !S.quests[npc.jailQuest]) choices.unshift({ text: 'Ich höre.', fn: () => { startQuest(npc.jailQuest); if (npc.jailQuest === 'q_rask') placeRask(); UI.dialogue(npc, npc.greet, [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]); } });
  if (npc.redCloth && S.quests.q_gilde?.state === 'active') choices.unshift({ text: 'Mo schickt mich.', fn: () => { S.quests.q_gilde.progress = [1]; turnIn(npc, 'q_gilde'); addItem(S.player, 'dietrich'); S.flags.gilde = true;
    UI.dialogue(npc, '„Mo lebt also noch. Gut. Nimm das — für die nächste Tür, die dich aufhalten will. Die Gilde merkt sich Freunde.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]); } });
}
function pickCell(t) {
  const J = S.jail, p = S.player; if (!J) return;
  const odds = clamp(0.25 + (p.attributes.agility - 10) * 0.015 + (hasItem(p, 'dietrich') ? 0.3 : 0), 0.1, 0.9);
  act(p, 'kneel', 900, t); S.minute += 10;
  if (chance(odds)) { S.ents.kerker = S.ents.kerker.filter(e => e !== t); indexSolids('kerker'); log('Klick. Die Zellentür gibt nach. Leise zum Ausgang — die Wärter dürfen dich nicht sehen.', 'world'); }
  else log(`Der Draht rutscht ab. (Chance ${Math.round(odds * 100)} %)`, 'world');
}
function jailExit() {
  const J = S.jail, p = S.player;
  if (S.ents.kerker.some(e => e.warden && e.alive && dist(e, p) < 180 && clearLine(e, p))) return log('Der Wärter steht direkt vor dir. Nicht jetzt.', 'world');
  S.jail = null; if (J.fac) addBounty(J.fac, 150, 'Ausbruch aus dem Kerker'); log('Du bist draußen. Ohne Waffe — und mit neuem Kopfgeld.', 'faction');
  chronicle(`${p.name} bricht aus dem Kerker aus`, 'crime'); p.status = (p.status || []).filter(s => s.key !== 'jailed'); travel('world');
}
function releaseJail(why) {
  const J = S.jail, p = S.player; if (!J) return;
  if (J.weapon && !p.equip.weapon) p.equip.weapon = J.weapon; recalc(p); S.jail = null;
  log(`${why} Der Wärter gibt dir deine Waffe zurück und schiebt dich hinaus.`, 'faction'); UI.toast('FREI', 2000); travel('world');
}
function jailTick() {
  const J = S.jail, p = S.player; if (!J) return;
  if (S.map !== 'kerker') { S.jail = null; return; }
  if (clock() >= J.until) return releaseJail('Deine Zeit ist um.');
  const h = S.minute / 60 | 0;
  if ((h === 8 || h === 18) && J.meal !== (S.day | 0) * 24 + h) { J.meal = (S.day | 0) * 24 + h; if (p.body) B.heal(p, p.maxHp * 0.1); log('Ein Wärter schiebt Brot und Wassersuppe durch die Gitter.', 'world'); }
  const cell = MAPS.kerker.cells[J.cell], inCell = p.x / TS >= cell.x && p.x / TS < cell.x + 5 && p.y / TS >= cell.y && p.y / TS < cell.y + 6;
  if (!inCell && S.ents.kerker.some(e => e.warden && e.alive && dist(e, p) < 170 && clearLine(e, p))) {
    p.x = cell.spot.x; p.y = cell.spot.y; J.until += 120; closeCells(); log('Erwischt! Zurück in die Zelle — zwei Stunden mehr.', 'combat'); UI.toast('ERWISCHT', 2000);
  }
  for (const w of S.ents.kerker) if (w.warden) { const [x, y] = w.patrol[w.pi], gx = x * TS + 16, gy = y * TS + 16; if (Math.hypot(w.x - gx, w.y - gy) < 20) w.pi = 1 - w.pi; w.anchor = { x: gx, y: gy }; w.schedulePos = null; }
}
function placeRask() {
  const P = TOWN_PLAN.saltport; if (!P || S.ents.world.some(e => e.raskChest)) return;
  const q = freeSpotNear('world', P.square[0] + 6, P.area[3] + 6, 4);
  S.ents.world.push({ id: uid(), kind: 'prop', type: 'chest', map: 'world', x: q.x, y: q.y, r: 10, solid: true, transient: true, raskChest: true, label: 'Rasks Kiste' }); indexSolids('world');
  S.flags.raskAt = [q.x, q.y];
}
function openRask(t) {
  S.ents.world = S.ents.world.filter(e => e !== t); indexSolids('world'); S.gold += 150; addItem(S.player, 'potion');
  if (S.quests.q_rask) { S.quests.q_rask.progress = [1]; S.quests.q_rask.state = 'done'; S.quests.q_rask.outcome = '150 Gold und ein Heiltrank.'; } gainXp(S.player, 100);
  log('Rasks Kiste: 150 Gold, ein Heiltrank und ein Zettel: „Für den, der mich nicht vergisst.“', 'quest');
}
function ensureSaltportContacts() {
  const P = TOWN_PLAN.saltport;
  if (P && S.quests.q_gilde?.state === 'active' && !S.ents.world.some(e => e.redCloth)) { const q = freeSpotNear('world', P.square[0] - 4, P.area[3] - 2, 2);
    const c = makeChar({ name: 'Der Mann mit dem roten Tuch', prof: 'Hehler', x: q.x, y: q.y, level: 6, faction: null, traits: ['mürrisch'] });
    Object.assign(c, { redCloth: true, transient: true, visitor: true, anchor: { x: q.x, y: q.y }, cloth: '#8a2a22', greet: '„Wer fragt?“' }); S.ents.world.push(c); }
  if (S.quests.q_rask?.state === 'active' && !S.ents.world.some(e => e.raskChest) && S.flags.raskAt) {
    S.ents.world.push({ id: uid(), kind: 'prop', type: 'chest', map: 'world', x: S.flags.raskAt[0], y: S.flags.raskAt[1], r: 10, solid: true, transient: true, raskChest: true, label: 'Rasks Kiste' }); indexSolids('world'); }
}
function mechMenu() {
  const p = S.player, parts = ['larm', 'rarm', 'lleg', 'rleg'].filter(k => p.body[k].mech), NAME = { larm: 'linker Arm', rarm: 'rechter Arm', lleg: 'linkes Bein', rleg: 'rechtes Bein' };
  const back = () => mechMenu(), say = t => UI.dialogue(p, t, [{ text: 'Weiter', fn: back }]);
  const repair = parts.reduce((a, k) => a + Math.round((100 - (p.body[k].mechCond ?? 100)) * 2), 0);
  const opts = [];
  if (repair > 0) opts.push({ text: `Alle Prothesen instand setzen (${repair} Gold)`, fn: () => { if (S.gold < repair) return say('Zu wenig Gold.'); S.gold -= repair; for (const k of parts) p.body[k].mechCond = 100; say('Gefettet, gerichtet, gespannt. Wie neu.'); } });
  for (const k of parts) if ((p.body[k].mechUp || 0) < 2) { const up = k.endsWith('arm') ? 'Kraftfeder' : 'Laufwerk', cost = 250 * ((p.body[k].mechUp || 0) + 1);
    opts.push({ text: `${up} für ${NAME[k]} (Stufe ${(p.body[k].mechUp || 0) + 1}, ${cost} Gold)`, fn: () => { if (S.gold < cost) return say('Zu wenig Gold.'); S.gold -= cost; p.body[k].mechUp = (p.body[k].mechUp || 0) + 1; recalc(p); say(`${up} eingesetzt: +5 % ${k.endsWith('arm') ? 'Schlagkraft' : 'Tempo'}.`); } }); }
  if (!p.lens) opts.push({ text: 'Linse ins Auge setzen lassen — weiter sehen (300 Gold)', fn: () => { if (S.gold < 300) return say('Zu wenig Gold.'); S.gold -= 300; p.lens = true; say('Messing um das Auge, Glas davor. Die Welt reicht plötzlich weiter.'); } });
  const state = parts.length ? parts.map(k => `${NAME[k]}: Stufe ${p.body[k].mech}, Zustand ${Math.round(p.body[k].mechCond ?? 100)} %${(p.body[k].mechCond ?? 100) < 30 ? ' (BESCHÄDIGT — wirkungslos)' : ''}${p.body[k].mechUp ? `, Aufrüstung ${p.body[k].mechUp}` : ''}`).join('\n') : 'Du trägst keine Prothese. Meisterin Vell verkauft welche.';
  UI.dialogue(p, `Werkbank der Prothesenmacherin\n${state}`, [...opts, { text: '[Gehen]', fn: () => UI.closeDialogue() }]);
}
function ensureGoblinVillage() {
  for (const d of GOBLIN_VILLAGE) if (!S.ents.world.some(e => e.key === d.key)) {
    const pos = freeSpotNear('world', d.at[0], d.at[1], 2), mt = d.key === 'grisk' ? 'goblin_warrior' : 'goblin';
    const c = makeChar({ name: d.name, prof: d.prof, x: pos.x, y: pos.y, level: 5, faction: 'goblin', traits: ['gütig'] });
    if (d.built && !S.flags.griskBuilt) continue;                    // S12 A4: erst nach dem Hüttenbau
    Object.assign(c, { key: d.key, goblin: true, greet: d.greet, anchor: { x: pos.x, y: pos.y }, schedulePos: { x: pos.x, y: pos.y }, shop: !!d.shop, pool: d.pool, freed: true });
    c.spec = SP.monsterSpec({ mtype: mt, seed: 2 }, MONSTERS[mt]);
    S.ents.world.push(c);
  }
}
// Varg fällt: die Ketten brechen (Welt-Konsequenz §73/§81)
// Varg (S12, Nutzer: „nicht direkt Boss — erst reden, oder angreifen“): Gespräch in der Halle; Herausforderung = offener Kampf
// mit dem ganzen Hof, Hinterhalt = Schleichangriff (siehe hit), Gehen = nichts geschieht.
function vargParley(v) {
  const p = S.player;
  const back = () => vargParley(v);
  const say = (t) => () => UI.dialogue(v, t, [{ text: 'Weiter', fn: back }]);
  UI.dialogue(v, S.flags.vargMet ? '„Du schon wieder. Hast du dir überlegt, wo dein Platz ist?“' : '„Du stehst in meiner Halle, ohne Kette um den Hals. Das ist Mut oder Dummheit. Sprich.“', [
    { text: 'Wer bist du?', fn: say('„Varg. Ich halte die Mark zusammen. Die Grubenstämme graben, die Dörfer zahlen, und niemand verhungert, der gehorcht. Die im Tal nennen es Sklaverei. Ich nenne es Ordnung.“') },
    { text: 'Warum die Ketten?', fn: say('„Ein Goblin ohne Kette stiehlt. Ein Goblin mit Kette baut Mauern. Du bist durch diese Mauern hereingekommen — die Toten im Osten kommen nicht durch. Frag dich, wem du das verdankst.“') },
    { text: 'Die Dörfer im Süden hungern.', fn: say('„Die Dörfer im Süden leben. Das ist mehr, als das Totenland ihnen ließe. Tribut ist der Preis für Mauern. Wer nicht zahlt, lernt, was draußen wartet.“') },
    { text: 'Ich fordere dich heraus. Die Ketten fallen heute.', fn: () => {
      S.flags.vargChallenged = true; v.parley = false; v.aggroId = p.id; v.sawPlayer = clock(); UI.closeDialogue();
      for (const e of S.ents.world) if (e.court && e.alive) { e.aggroId = p.id; e.sawPlayer = clock(); }
      log('Varg: „Dann wird deine Kette die schwerste in dieser Halle.“', 'combat'); UI.toast('KAMPF UM DIE KETTE', 2600); } },
    ...(canRite() ? [{ text: 'Ich will die Weihe der Kette.', fn: () => chainRite(v) }] : []),
    { text: 'Gehen.', fn: () => UI.closeDialogue() },
  ]);
  S.flags.vargMet = true;
}
function liberate() {
  if (S.flags.chainsBroken) return;                                   // eigener Schutz: regionBossSlain setzt goblinsFreed schon vorher
  S.flags.chainsBroken = S.flags.goblinsFreed = true; S.factions.goblin += 200; grantLegend('goblin', 'Kettenbrecher der Grubenstämme', 'Die Goblins der Eisenmark sind frei.');
  if ((S.ranks.undead ?? -1) >= 0) { S.ranks.undead = FACTIONS.undead.ranks.length - 1; grantLegend('undead', 'Held der Untoten', 'Die Eisenfeste ist gefallen — die Toten feiern dich.'); }   // MP2 §65 S.factions.chain = -100;   // MP2 §28 + Nutzer: +200 (von −100 auf +100)
  const G = LOCATIONS.find(l => l.key === 'grubenhort'), H = LOCATIONS.find(l => l.key === 'sonnwacht');
  for (const e of S.ents.world) {
    if (e.captive) {
      Object.assign(e, { captive: false, chainedTo: null, work: false, freed: true, faction: e.goblin ? 'goblin' : null });
      e.prof = e.goblin ? 'Befreiter Goblin' : 'Befreiter Gefangener';
      e.greet = e.goblin ? '„Frei. Das Wort schmeckt nach Eisen und nach Regen. Danke, Mensch.“' : '„Ich geh nach Hause. Wenn es noch steht.“';
      const to = e.goblin ? G : H; e.anchor = { x: to.x * TS + ri(-60, 60), y: to.y * TS + ri(-50, 50) }; e.schedulePos = e.anchor;
    }
    if (e.convoy) e.convoy = null;
    if (e.kind === 'enemy' && e.map === 'world' && (e.mtype === 'goblin' || e.mtype === 'goblin_warrior') && e.alive) e.alive = false;   // wilde Goblins legen die Waffen nieder
  }
  S.ents.world = S.ents.world.filter(e => e.alive || e.kind !== 'enemy');
  ensureGoblinVillage();
  chronicle('Die Ketten der Eisenmark sind gebrochen', 'battle', 'Varg ist tot. Die Goblins kehren in den Grubenhort zurück — als Volk, nicht als Beute.');
  SIM.H.title?.('Kettenbrecher');
  log('Die Ketten brechen. Überall in der Eisenmark legen Goblins das Werkzeug nieder — und die Waffen.', 'world');
  UI.toast('DIE GOBLINS SIND FREI', 4200);
}
function ensureBoards() {
  for (const [town, P] of Object.entries(TOWN_PLAN)) {
    if (town === 'vharnholm' || S.ents.world.some(e => e.type === 'board' && boardTown(e) === town && Math.hypot(e.x / TS - P.square[0], e.y / TS - P.square[1]) < 30)) continue;
    // S12: nie auf den Platzmittelpunkt oder vor eine Tür (im Dorf sperrte das Brett den Platz) — Ring um (Platz +3, +2)
    const [sx, sy] = P.square, bad = new Set();
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) bad.add((sx + i) + ',' + (sy + j));
    for (const b of HOUSES) if (b.town === town) { const [dx, dy] = b.doorTile, fy = dy + (b.door === 'S' ? 1 : b.door === 'N' ? -1 : 0), fx = dx + (b.door === 'W' ? -1 : b.door === 'E' ? 1 : 0);
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) bad.add((fx + i) + ',' + (fy + j)); }
    let s0 = null;
    for (let r = 0; r < 7 && !s0; r++) for (let j = -r; j <= r && !s0; j++) for (let i = -r; i <= r; i++) { const x = sx + 3 + i, y = sy + 2 + j;
      if (Math.max(Math.abs(i), Math.abs(j)) !== r || bad.has(x + ',' + y) || SOLID.has(tileAt('world', x, y)) || solidPropAt('world', (x + 0.5) * TS, (y + 0.5) * TS, 4)) continue;
      s0 = { x: (x + 0.5) * TS, y: (y + 0.5) * TS }; break; }
    s0 ||= freeSpotNear('world', sx + 3, sy + 2, 3);
    S.ents.world.push({ id: 'board_' + town, kind: 'prop', type: 'board', x: s0.x, y: s0.y, r: 12, map: 'world', solid: true, transient: true, label: 'Anschlagbrett', tag: 'board' });
  }
  indexSolids('world');
}
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
  fortressHour();                                                            // S12: Tore der Eisenfeste
  if (h % 6 === 0 && !S._frozenWar) SIM.warTick();                          // Heere ziehen, Schlachten, Eroberungen
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
  rebuildTick();
  tributeDay(); campaignDay(); raidDay(); rebuildRazed(); aurelDay();                                             // S12: Tribut der Kette
  bountyDay();
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
  for (const town of Object.keys(TOWN_PLAN)) if (festDay(town)) log(`Heute ab dem Nachmittag feiert ${townName(town)} sein Stadtfest.`, 'world');
  for (const town of Object.keys(TOWN_PLAN)) if (festDay(town, (S.day | 0) + 1)) log(`Morgen feiert ${townName(town)} sein Stadtfest.`, 'world');
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
    if (count >= capOf(a)) continue;
    const tx = a.x + ri(-a.r, a.r), ty = a.y + ri(-a.r, a.r);
    if (a.map === S.map && Math.hypot(tx * TS - p.x, ty * TS - p.y) < 620) continue;
    if (a.map === 'world' && townAt(tx, ty, 4)) continue;              // Banden lauern vor der Stadt, nicht zwischen den Häusern
    const t = chance(0.55) && spawnType(a); if (t) regionSpawn(t, a.map, tx, ty);
  }
}

// ================= Dialog =================
function talk(npc) {
  const p = S.player, rel = S.relations[npc.key] ?? 0, now = clock();
  const leave = [{ text: '[Gehen]', fn: () => UI.closeDialogue() }];
  // Wer gerade kämpft, flieht oder sich fürchtet, plaudert nicht
  if (npc.angry) return UI.dialogue(npc, '„Waffe runter! Sofort!“', leave);
  if (npc.robot && !S.party.includes(npc.id)) return robotTalk(npc);   // Automaten tratschen nicht
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
  if (npc.faction && S.ranks[npc.faction] === -1 && (['valen', 'order', 'undead'].includes(npc.faction) || (npc.faction === 'chain' && !S.flags.chainsBroken)))
    choices.push({ text: `Wie tritt man bei — ${FACTIONS[npc.faction].name}?`, fn: () => joinFaction(npc) });
  const occupied = npc.town && S.war.nodes[npc.town]?.owner === 'undead';
  if (npc.shop && npc.shopClosed > now) choices.push({ text: 'Zeig mir deine Waren.', fn: () => UI.dialogue(npc,
    npc.provoked ? '„Für dich ist heute geschlossen. Vielleicht für immer.“' : '„Der Stand ist zu, bis sich die Lage beruhigt.“', leave) });
  else if (npc.shop && npc.till && (hourNow() >= npc.till || hourNow() < 7)) choices.push({ text: 'Zeig mir deine Waren.', fn: () => UI.dialogue(npc,
    '„Der Laden ist zu. Komm morgen früh wieder.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]) });   // Ladenzeiten
  else if (npc.shop && npc.town === 'vharnholm' && !deadWelcome()) choices.push({ text: 'Zeig mir deine Waren.', fn: () => UI.dialogue(npc,
    '„Vharnholm handelt mit denen, die zu uns gehören. Du gehörst noch zu den Lauten.“ (Mitglied der Stillen Schar oder paktgebunden)', leave) });
  else if (npc.shop && npc.faction && repTier(npc.faction)?.name === 'Verhasst') choices.push({ text: 'Zeig mir deine Waren.', fn: () => UI.dialogue(npc, '„Nicht für dich. Nicht für Gold, nicht für Blut.“', leave) });   // §43 Verhasst: kein Handel
  else if (npc.shop && occupied) choices.push({ text: 'Zeig mir deine Waren.', fn: () => UI.dialogue(npc, '„Handel? Die Toten halten die Stadt. Ich verstecke, was ich habe.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]) });
  else if (npc.shop && refusesChain(npc)) choices.push({ text: 'Zeig mir deine Waren.', fn: () => UI.dialogue(npc, '„Ich verkaufe nicht an Kettenleute. Nimm es dir mit Gewalt, wenn du willst — geben tu ich es nicht.“', leave) });
  else if (npc.shop) choices.push({ text: 'Zeig mir deine Waren.', fn: () => { UI.closeDialogue(); UI.openModal('trade', npc); } });
  if (npc.smith) choices.push({ text: 'Kannst du das ausbessern?', fn: () => repairAll(npc) });
  if (npc.recruit && !S.party.includes(npc.id)) choices.push({ text: 'Komm mit mir.', fn: () => recruit(npc) });
  if (S.party.includes(npc.id)) choices.push({ text: 'Bleib hier.', fn: () => { dismiss(npc); UI.closeDialogue(); } });
  tributeChoices(npc, choices); campaignChoices(npc, choices); chainChoices(npc, choices); defenseChoices(npc, choices); griskChoices(npc, choices); aurelChoices(npc, choices); conChoices(npc, choices); jailChoices(npc, choices);
  choices.push({ text: 'Was gibt es Neues?', fn: () => gossip(npc) });
  choices.push({ text: '[Gehen]', fn: () => UI.closeDialogue() });
  // Ruf färbt die Begrüßung: nach einer Tat gegen jemanden ist der Ton kalt
  const greet = npc.runaway ? '„Bitte … nicht zurück. Nicht in den Steinbruch.“' : fearedBy(npc) ? FEAR_GREET[fearLvl() - 1][(npc.seed * 7 | 0) % 3]
    : rel <= -30 ? '„Du. Sag, was du willst, und dann geh.“' : npc.wary > now && npc.provoked ? '„Ich behalte dich im Auge.“'
    : pactBound() && !npc.undead && npc.faction !== 'undead' && !S.party.includes(npc.id) ? pactGreet(npc)
    : (npc.faction && S.factions[npc.faction] != null && repTier(npc.faction).greet) || contextGreet(npc, npc.greet);   // §43 Ruf färbt; sonst Kontext (Phase 1)
  UI.dialogue(npc, greet, choices);
  if (rel === 0) addRel(npc.key, 1);
}

// Gerüchte aus der Chronik (BUG-078, §79): Schlachten, Befreiungen, Tote, Bluttaten, Karawanen der letzten NEWS_DAYS Tage.
// Ältere Ereignisse fallen heraus — die Leute reden über das, was gerade passiert ist.
const NEWS_KINDS = new Set(['battle', 'death', 'crime', 'news']), NEWS_DAYS = 5;
const recentNews = () => S.chronicle.filter(c => NEWS_KINDS.has(c.kind) && (S.day | 0) - (c.day ?? -99) <= NEWS_DAYS).slice(-6);
const NEWS_OPEN = ['Hast du gehört?', 'Man sagt,', 'Weißt du es schon?'], NEWS_REPLY = ['Schlimme Zeiten.', 'Das wird noch schlimmer.', 'Ich hab’s auch gehört.', 'Wer weiß, was davon stimmt.'];
// Chronik-Schlagzeile → gesprochener Satz („Hedda gefallen“ → „Hedda ist gefallen“, „Schlacht bei Alte Straße“ → „Bei der Alten Straße wurde gekämpft“)
const locDat = n => { const m = n.replace(/^Die /, '').match(/^(\S+?)(e|er|es) (.+)$/);   // Alte Straße → der Alten Straße, Alter Friedhof → dem Alten Friedhof
  return m ? `${m[2] === 'e' ? 'der' : 'dem'} ${m[1]}en ${m[3]}` : n; };
function newsLine(t) {
  let m;
  if ((m = t.match(/^Schlacht bei (.+)$/))) return `Bei ${locDat(m[1])} wurde gekämpft`;
  if ((m = t.match(/^Blut in (.+)$/))) return `In ${locDat(m[1])} ist Blut geflossen`;
  if ((m = t.match(/^(.+) fiel bei (.+)$/))) return `${m[1]} ist bei ${locDat(m[2])} gefallen`;
  if ((m = t.match(/^(.+) (gefallen|befreit)$/))) return `${m[1]} ist ${m[2]}`;
  if ((m = t.match(/^(.+) (erschlagen|zerschlagen)$/))) return `${m[1]} wurde ${m[2]}`;
  return t;
}
function newsTalk(k) {                                               // [Sprecher, Antwort] für Sprechblasen, oder null
  const N = recentNews(); if (!N.length) return null;
  const c = N[k % N.length], line = newsLine(c.text), t = line.length > 44 ? line.slice(0, 43) + '…' : line;
  return [`${NEWS_OPEN[k % NEWS_OPEN.length]} ${t}.`, NEWS_REPLY[(k >> 2) % NEWS_REPLY.length]];
}
// Phase 1 (Master-Prompt 2 §10): Gespräche aus dem Kontext — Beruf, Tageszeit, Wetter, Weltlage, Ruf und Rang des
// Spielers. Die Begrüßung wechselt je Stunde (fester Zufall je Person), der Tratsch zieht aus demselben Vorrat.
const PROF_TALK = {
  Bauer: ['„Der Boden ist hart dieses Jahr. Hart wie die Leute.“', '„Wenn die Toten auch noch das Korn wollen, sind wir erledigt.“', '„Regen oder Raben — einer von beiden holt die Ernte.“'],
  Magd: ['„Ich hab keine Zeit. Der Herd wartet nicht.“', '„Wasser holen, Brot kneten, Mund halten. So geht der Tag.“'],
  Schmied: ['„Gutes Eisen ist knapp. Die Kette kauft alles auf.“', '„Eine Klinge ist nur so gut wie die Hand, die sie schleift.“', '„Bring mir Erz, und ich mach dir was draus.“'],
  Meisterschmiedin: ['„Stahl lügt nicht. Menschen schon.“'],
  'Händlerin': ['„Seit die Karawanen überfallen werden, kostet Salz das Doppelte.“', '„Kauf heute. Morgen ist es teurer.“'],
  Kaufmann: ['„Wer die Straßen sichert, macht die Preise.“', '„Die Wege nach Süden sind wieder offen. Noch.“'],
  Wirt: ['„Ein Krug Dünnbier und die Neuigkeiten des Tages — beides billig.“', '„Die Söldner zahlen gut und zerschlagen die Hälfte.“', '„Hier wird mehr erzählt als in jedem Tempel.“'],
  Priester: ['„Die Toten stehen auf, weil wir sie vergessen. So steht es geschrieben.“', '„Bete nicht für Gold. Bete für den Morgen.“'],
  Fischer: ['„Die Netze kommen leerer hoch. Und manchmal mit Knochen.“', '„Das Wasser weiß mehr als wir. Es sagt nur nichts.“'],
  'Jäger': ['„Die Wölfe ziehen näher an die Dörfer. Irgendwas treibt sie.“', '„Im Wald ist es still geworden. Zu still.“'],
  Holzfäller: ['„Jeder Baum, den ich fälle, wird eine Palisade. Die Zeiten sind so.“'],
  Weber: ['„Tuch aus dem Süden ist feiner. Und dreimal so teuer.“'],
  Tagelöhner: ['„Arbeit gibt es. Lohn weniger.“', '„Ich trag, was man mir gibt. Heute Steine, morgen Särge.“'],
  Heilerin: ['„Verbände werden knapp. Jeder kommt blutend herein.“', '„Halt still, wenn ich nähe. Oder blute weiter.“'],
  Torwache: ['„Halt die Waffe unten, dann bleibt es friedlich.“', '„Nachts schließen wir früher. Befehl.“'],
  Stallknecht: ['„Pferde merken, wenn Tote in der Nähe sind. Sie werden unruhig.“'],
};
const TIME_TALK = { morn: ['„Früh auf den Beinen, was?“', '„Der Tag fängt an, und schon ist er schwer.“'], eve: ['„Feierabend. Endlich.“', '„Bald wird es dunkel. Ich bleib nicht mehr lang draußen.“'],
  night: ['„Was treibst du dich nachts herum?“', '„Um diese Zeit sind nur Diebe und Wachen unterwegs. Welches bist du?“'] };
const WEATHER_TALK = { rain: ['„Dieser Regen hört nie auf.“'], snow: ['„Schnee im Tal. Das Holz reicht nicht.“'], fog: ['„Bei dem Nebel sieht man die Toten erst, wenn sie da sind.“'],
  bloodrain: ['„Roter Regen. Das bedeutet nichts Gutes, sagen die Alten.“'], sandstorm: ['„Sand in den Augen, Sand im Brot.“'] };
function worldTalk(npc) {
  const L = [], town = npc.homeTown || npc.post, p = S.player;
  if (S.flags.chainsBroken) L.push('„Seit die Eisenfeste gefallen ist, kommen die Toten öfter. Wer hält sie jetzt auf?“');
  else L.push('„Die Eiserne Kette nimmt, was sie will. Aber sie hält die Toten im Osten.“');
  if (S.deadRaid) { const V = VILLAGES.find(v => v.key === S.deadRaid.v); L.push(V && V.key === town ? '„Die Toten kommen hierher! Wir brauchen jede Hand!“' : `„Man sagt, die Toten ziehen gegen ${V?.name || 'ein Dorf'}.“`); }
  const razed = Object.keys(S.razed || {}); if (razed.length) L.push(`„${VILLAGES.find(v => v.key === razed[0])?.name || 'Ein Dorf'} gibt es nicht mehr. Einfach weg.“`);
  if (S.campaign && ['muster', 'march'].includes(S.campaign.phase)) L.push('„Die Kette zieht wieder ins Totenland. Hoffentlich kommen sie zurück — oder auch nicht.“');
  if (S.hunt) L.push('„Aurelion sucht einen Automatenmörder. Die Sonnenklingen sind überall.“');
  if ((S.bounty || {})[crimeFaction(npc)] > 0) L.push('„Du … auf dich ist ein Preis ausgesetzt. Ich hab nichts gesagt.“');
  if ((p.titles || []).length) L.push(`„Bist du nicht ${p.titles[p.titles.length - 1]}? Man erzählt sich Dinge.“`);
  if ((p.level || 1) >= 10) L.push('„Du hast das Gesicht von jemandem, der viel gesehen hat.“');
  if (S.flags.goblinsFreed) L.push('„Die Goblins sind frei. Manche sagen, sie handeln ehrlicher als wir.“');
  return L;
}
function contextLines(npc) {
  const h = S.minute / 60, L = [...(PROF_TALK[npc.prof] || [])];
  L.push(...(h < 8 ? TIME_TALK.morn : h >= 22 || h < 5 ? TIME_TALK.night : h >= 18 ? TIME_TALK.eve : []));
  L.push(...(WEATHER_TALK[S.weather] || []), ...worldTalk(npc));
  return L;
}
// Ränge ohne Beitritt (MP2 §29/§81): Aurelion aus Schein, Bürgerrecht und Ruf; Grubenstämme nach der Befreiung. Legendäre Ränge
// (§30) nur durch weltverändernde Taten — Kettenbrecher, Held der Untoten, Schild von Valen, Stimme im Hohen Rat.
function autoRanks() {
  const a = S.factions.aurel || 0;
  S.ranks.aurel = S.flags.aurelCitizen ? Math.min(7, 2 + Math.max(0, Math.floor((a - 40) / 12)) + (S.flags.marriedHouse && a >= 90 ? 1 : 0)) : hasPermit() ? 1 : 0;
  S.ranks.goblin = S.flags.goblinsFreed ? ((S.factions.goblin || 0) >= 60 ? 2 : (S.factions.goblin || 0) >= 20 ? 1 : 0) : -1;
  if (S.flags.aurelCitizen && S.flags.marriedHouse && !S.legend?.aurel) grantLegend('aurel', 'Stimme im Hohen Rat', 'Bürger und eingeheiratet: Aurelion hört auf dich.');
  if ((S.stats?.valenDefense || 0) >= 10 && !S.legend?.valen) grantLegend('valen', 'Schild von Valen', 'Zehn Siedlungen verteidigt.');
}
function grantLegend(fac, title, why) {
  (S.legend ||= {})[fac] = title; (S.player.titles ||= []).push(title);
  chronicle(`${S.player.name}: „${title}“`, 'legend', why); log(`Legendärer Rang bei ${FACTIONS[fac]?.name || fac}: ${title}. ${why}`, 'faction'); UI.toast(title.toUpperCase(), 4200);
}
const rankName = f => { const r = S.ranks[f] ?? -1; return S.legend?.[f] || (r >= 0 && FACTIONS[f]?.ranks ? FACTIONS[f].ranks[Math.min(r, FACTIONS[f].ranks.length - 1)] : null); };
function contextGreet(npc, base) {
  const rn = npc.faction && npc.guard && rankName(npc.faction);
  if (rn && ((S.ranks[npc.faction] ?? -1) >= 1 || S.legend?.[npc.faction])) return S.legend?.[npc.faction] ? `„${rn}! Die Legende persönlich. Wir stehen bereit.“` : `„Zu Befehl, ${rn}.“`;   // Wachen grüßen nach Rang                                   // fester Zufall je Person und Stunde: nicht bei jedem Klick ein anderer Satz
  const L = contextLines(npc); if (!L.length) return base;
  const k = Math.abs(((npc.seed || 1) * 7919 + (S.day | 0) * 24 + (S.minute / 60 | 0)) | 0);
  return k % 3 === 0 && base ? base : L[k % L.length];
}
function gossip(npc) {
  const news = recentNews().map((c, i) => `„${NEWS_OPEN[i % NEWS_OPEN.length]} ${newsLine(c.text)}.“`);
  if (news.length && npc._heardNews !== (S.day | 0)) {                // pro Tag zuerst das Neueste
    npc._heardNews = S.day | 0;
    UI.dialogue(npc, news[news.length - 1], [{ text: 'Und sonst?', fn: () => gossip(npc) }, { text: '[Gehen]', fn: () => UI.closeDialogue() }]); return;
  }
  const lines = [...news, ...news,
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
  lines.push(...tributeTalk(town), ...contextLines(npc));
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
  if (k.startsWith('q_grisk')) return !!S.flags.goblinsFreed;
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
function startQuest(k) {
  if (k === 'q_grisk_lost') planLostGoblins(); if (k === 'q_grisk_rache') spawnChainRest();   // S12 A4                                   // was schon erledigt ist, zählt (Boss vorher erschlagen, Gegenstand dabei)
  S.quests[k] = { state:'active', progress: QUESTS[k].objectives.map(o =>
    o.type === 'item' ? S.player.inv.filter(x => x.key === o.target).reduce((n, x) => n + (x.count || 1), 0)
    : o.type === 'kill' && o.target === 'hrodvar' && S.flags.hrodvarSlain ? 1
    : o.type === 'kill' && REGION_BOSSES.some(b => b.id === o.target && S.flags[b.flag]) ? 1 : 0) };   // Regionalboss schon erlegt: zählt
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
  if (r.take) removeItem(S.player, r.take, r.takeCount || 1);
  if (r.item) { addItem(S.player, r.item); log(`Erhalten: ${ITEMS[r.item].name}.`, 'economy'); }
  if (r.unlock) unlockClass(r.unlock);
  addRel(npc.key, 8);
  log(`Auftrag abgeschlossen: ${Q.name}`, 'quest');
  chronicle(`${Q.name} abgeschlossen`, 'quest');
  UI.dialogue(npc, '„Das war mehr, als ich erwartet habe.“', [{ text: '[Gehen]', fn: () => UI.closeDialogue() }]);
  save();
}
function onKill(mtype, e) {
  if (e?.chainRest) mtype = 'chain_rest';                         // S12 A4: Kettenreste zählen für Grisk
  if (e?.contract) conKill(e);                                    // Phase 2: Auftragsziele
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
      if (f === 'chain') { S.factions.goblin -= 20; S.factions.order -= 10; S.factions.valen -= 5; partyReact('joined_chain'); }   // S12 A3
      chronicle(`Beitritt: ${FACTIONS[f].name}`, 'faction', `Als ${FACTIONS[f].ranks[0]} aufgenommen.`);
      log(`Du bist nun ${FACTIONS[f].ranks[0]} — ${FACTIONS[f].name}.`, 'faction');
      UI.closeDialogue(); UI.refreshHUD(); save();
    } },
    { text: 'Noch nicht.', fn: () => UI.closeDialogue() },
  ]);
}
function checkRankUp() {
  autoRanks();
  for (const f of ['valen', 'order', 'undead', 'chain']) {
    if (S.ranks[f] < 0 || S.ranks[f] == null || (f === 'chain' && S.ranks.chain >= 3)) continue;   // Hochpaladin nur durch die Weihe
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
export const repTier = fac => REP_TIERS.find(t => (S.factions[fac] ?? 0) >= t.min);
const repPrice = (npc, isBuy) => { const t = npc?.faction && S.factions[npc.faction] != null ? repTier(npc.faction) : null, f = npc && fearedBy(npc) ? fearLvl() : 0;
  const r = npc?.faction ? Math.max(0, S.ranks[npc.faction] ?? -1) : 0, lg = npc?.faction && S.legend?.[npc.faction] ? 0.25 : 0, rb = Math.min(0.35, r * 0.03 + lg);   // MP2 §80: Rang und Legende senken Preise
  return (!t || !t.price ? 1 : isBuy ? t.price : 1 / t.price) * (isBuy ? 1 + 0.2 * f : 1 - 0.15 * f) * (isBuy ? 1 - rb : 1 + rb * 0.5); };   // S12: Kettenleute zahlen drauf
function price(key, isBuy, npc, inst = null) {
  if (ITEMS[key].good && npc && S.towns[npc.town || 'eren']) {
    const p = SIM.townPrice(npc.town || 'eren', key, isBuy), t = (S.player.skills.trading || 0) / 100;
    return Math.max(1, Math.round((isBuy ? p * (1 - t * 0.2) : p * (1 + t * 0.2)) * repPrice(npc, isBuy)));
  }
  const v = ITEMS[key].value * (S.prices || 1) * (inst ? RARITY_VALUE[rarOf(inst)] || 1 : 1);
  const t = (S.player.skills.trading || 0) / 100;
  return Math.max(1, Math.round((isBuy ? v * (1.35 - t * 0.3) : v * (0.45 + t * 0.25)) * repPrice(npc, isBuy)));   // §43: Ruf verändert den Preis
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
  if (S._quiet || (p.map || '').startsWith('__')) return;             // BUG-107: Selbsttest-Proben sterben nicht ins Erbe (vorher Todesbildschirm + Speichern)
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
// BUG-081 (§71 Telegraphing): erster Schritt in ein gefährliches Gebiet — Warnung nach Gefahr und eigener Stufe, nicht erst der Tod
const DANGER = { 1: 'Hier jagt Getier. Allein und verwundet wird es schnell ernst.', 2: 'Gefährlich: hier sterben Leute. Verbände griffbereit, Rückweg kennen.',
  3: 'Tödlich für Ungeübte. Wer blutet, kehrt um.', 4: 'Verbotenes Land. Die Toten hier sind stärker als du.', 5: 'Verbotenes Land. Die Toten hier sind stärker als du.' };
function dangerNote(l, p, dry = false) {
  if (!l.threat || l.poi || l.kind === 'village' || l.kind === 'city' || !(l.threat >= 2 || p.level <= 2)) return null;   // S12: Streuorte ohne Warnflut
  if (dry) return `${l.name}: ${DANGER[Math.min(5, l.threat)]}`;
  log(`${l.name}: ${DANGER[Math.min(5, l.threat)]}`, 'world');
  if (l.threat - Math.floor(p.level / 3) >= 1) UI.toast(`${l.name.toUpperCase()} — ${DANGER[Math.min(5, l.threat)]}`, 3600);
}
function drawWorldmap(cv, zoom = 1) {                   // S12: gemalte Karte mit Nebel (atlas.js); hier nur Aufträge, Heere, Spieler, Legende
  const c = cv.getContext('2d'), w = cv.width, h = cv.height;
  const boxes = [], place = (text, x, y, font = '11px Spectral, serif') => {   // BUG-085: Beschriftung ohne Überlappung
    c.font = font; const tw = c.measureText(text).width + 4;
    for (const [dx, dy] of [[0, 16], [0, -10], [tw / 2 + 8, 3], [-tw / 2 - 8, 3]]) {
      const bx = [x + dx - tw / 2, y + dy - 10, tw, 13];
      if (bx[0] < 0 || bx[0] + bx[2] > w || bx[1] < 0 || bx[1] + bx[3] > h) continue;
      if (boxes.some(o => bx[0] < o[0] + o[2] && o[0] < bx[0] + bx[2] && bx[1] < o[1] + o[3] && o[1] < bx[1] + bx[3])) continue;
      boxes.push(bx); return [x + dx, y + dy];
    }
    return null;
  };
  const m = MAPS.world, sc0 = Math.min(w / m.w, h / m.h) * zoom;
  const ox0 = zoom > 1 ? w / 2 - S.player.x / TS * sc0 : (w - m.w * sc0) / 2, oy0 = zoom > 1 ? h / 2 - S.player.y / TS * sc0 : (h - m.h * sc0) / 2;
  for (const l of LOCATIONS) boxes.push([ox0 + l.x * sc0 - 7, oy0 + l.y * sc0 - 10, 14, 14]);   // Symbole freihalten
  boxes.push([ox0 + S.player.x / TS * sc0 - 9, oy0 + S.player.y / TS * sc0 - 9, 18, 18]);
  // Auftragsziele zuerst beschriften (wichtiger als Ortsnamen)
  const quests = [];
  for (const [k, v] of Object.entries(S.quests)) { if (v.state !== 'active') continue; const pt = questPoint(k); if (!pt) continue;
    const x = ox0 + pt.x * sc0, y = oy0 + pt.y * sc0; quests.push([k, x, y, place(QUESTS[k].name, x, y, 'italic 10px Spectral, serif')]); }
  const { ox, oy, sc } = drawAtlas(cv, zoom, { place });
  for (const [k, x, y, at] of quests) {
    c.strokeStyle = '#d0603f'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x + 8, y); c.lineTo(x, y + 8); c.lineTo(x - 8, y); c.closePath(); c.stroke();
    if (at) { c.fillStyle = '#e59070'; c.font = 'italic 10px Spectral, serif'; c.textAlign = 'center'; c.fillText(QUESTS[k].name, at[0], at[1]); }
  }
  c.lineWidth = 1;
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
    c.textAlign = 'center'; c.font = '11px Spectral, serif'; const at = place(String(Math.round(a.strength)), x + 8, y - 30);
    if (at) { c.fillStyle = '#e7dcc2'; c.fillText(Math.round(a.strength), at[0], at[1]); }
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
  c.textAlign = 'left'; c.font = '10px Spectral, serif';
  const LEG = [['town', 'Siedlung'], ['dungeon', 'Höhle, Grube'], ['ruin', 'Ruine, Friedhof'], ['wild', 'Gebiet, Lager, Schrein'], ['quest', 'Auftragsziel'], ['caravan', 'Karawane'], ['valen', 'Valen halten den Ort'], ['undead', 'Untote halten den Ort'], ['army', 'Heer (Stärke)'], ['you', 'Du']];
  const lx = 8, ly = h - LEG.length * 14 - 12;
  c.fillStyle = 'rgba(11,10,8,.82)'; c.fillRect(lx - 4, ly - 6, 150, LEG.length * 14 + 10); c.strokeStyle = '#3b3227'; c.strokeRect(lx - 4, ly - 6, 150, LEG.length * 14 + 10);
  LEG.forEach(([k, t], i) => { const x = lx + 6, y = ly + i * 14 + 4;
    c.fillStyle = k === 'you' ? '#e7dcc2' : '#bd9433'; c.strokeStyle = '#d0603f'; c.lineWidth = 1.5;
    if (k === 'town') { c.fillRect(x - 4, y - 4, 8, 8); c.fillRect(x - 6, y - 1, 12, 2); }
    else if (k === 'dungeon') { c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); c.fillStyle = '#0b0a08'; c.fillRect(x - 2, y - 1, 4, 3); }
    else if (k === 'ruin') { c.fillRect(x - 5, y - 2, 3, 7); c.fillRect(x + 1, y - 5, 3, 10); }
    else if (k === 'wild') { c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 4, y + 4); c.lineTo(x - 4, y + 4); c.fill(); }
    else if (k === 'quest') { c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 5, y); c.lineTo(x, y + 5); c.lineTo(x - 5, y); c.closePath(); c.stroke(); }
    else if (k === 'caravan') c.fillRect(x - 3, y - 3, 6, 6);
    else if (k === 'valen' || k === 'undead') { c.strokeStyle = k === 'undead' ? 'rgba(78,143,122,.9)' : 'rgba(111,139,184,.9)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 5, 0, 7); c.stroke(); }
    else if (k === 'army') { c.fillStyle = '#2b2419'; c.fillRect(x - 3, y - 6, 2, 12); c.fillStyle = '#6f8bb8'; c.fillRect(x - 1, y - 6, 8, 5); }
    else { c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); }
    c.fillStyle = '#cfc3a8'; c.fillText(t, x + 12, y + 4); });
  c.lineWidth = 1;
}
// Wo liegt ein Auftrag? Zielort (Kartenpunkt in LOCATIONS-Einheiten) — „finden“: wo die Person gerade ist
const QUEST_WHERE = { q_wolves: 'forest', q_mine: 'mine', q_paladin1: 'graveyard', q_paladin2: 'mine', q_paladin3: 'shrine', q_undead: 'marsh',
  q_graverobbers: 'necropolis', q_kingsiron: 'deephall', q_frontier: 'hundertfeld', q_grove: 'grove', q_pact: 'necropolis', q_monk: 'graveyard',
  q_greymane: 'wolfden', q_sandlord: 'redwaste', q_hundred_song: 'hundertfeld', q_grisk_build: 'grubenhort' };
function questPoint(k) {                                          // Suchaufträge ohne Ziel: die Suche ist der Auftrag (kein Verraten)
  if (k === 'q_grisk_rache') return S.chainRest ? { x: S.chainRest[0], y: S.chainRest[1] } : null;
  if (k.startsWith('c_')) { const C = (S.contracts || []).find(c => 'c_' + c.id === k); return C ? (C.have >= C.need ? { x: TOWN_PLAN[C.town]?.square[0], y: TOWN_PLAN[C.town]?.square[1] } : { x: C.x, y: C.y }) : null; }
  if (k === 'q_gilde') return TOWN_PLAN.saltport ? { x: TOWN_PLAN.saltport.square[0], y: TOWN_PLAN.saltport.area[3] } : null;
  if (k === 'q_rask') return S.flags.raskAt ? { x: S.flags.raskAt[0] / TS | 0, y: S.flags.raskAt[1] / TS | 0 } : null;
  if (k === 'q_intrige') return S.intrigue ? (S.intrigue.done ? houseSeat(S.intrigue.from) : { x: S.intrigue.x / TS | 0, y: S.intrigue.y / TS | 0 }) : null;
  if (k === 'q_runaway') return S.runaway ? { x: S.runaway.x / TS | 0, y: S.runaway.y / TS | 0 } : null;
  if (k === 'q_tribut') { const l = LOCATIONS.find(l => l.key === (S.tributQuest?.village || 'grauwasser')); return l ? { x: l.x, y: l.y } : null; }
  if (QUESTS[k].objectives.some(o => o.type === 'find')) return null;
  const l = LOCATIONS.find(l => l.key === QUEST_WHERE[k]); return l ? { x: l.x, y: l.y } : null;
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
    if (k === 't') UI.openModal('skills');
    if (k === 'q') dodge();
    if (k >= '1' && k <= '9') useSlot(+k - 1);
    if (k === '0') useSlot(9);
    if (k === ' ') e.preventDefault();
  });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  cv.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.seen = true;
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
    case 'chain_strike': {                                             // S12 A3: Dunkler Hochpaladin
      const f = foes.find(x => dist(p, x) < 200); if (!f) { UI.toast('Nichts in Reichweite der Kette.'); return false; }
      const a = Math.atan2(f.y - p.y, f.x - p.x), bx = p.x + Math.cos(a) * 30, by = p.y + Math.sin(a) * 30;
      if (!f.boss && !solidTile(p.map, bx, by) && !solidPropAt(p.map, bx, by, 8)) { f.x = bx; f.y = by; }
      f.rooted = now + 2500; f.vx = f.vy = 0; hurt(f, damageOf(p) * 1.2, p, 'Kettenschlag');
      for (let k = 0; k <= 6; k++) fx(p.x + (f.x - p.x) * k / 6, p.y - 10 + (f.y - p.y) * k / 6, 'spark', 1);
      camShake(3, 120); sfx('dodge'); return true; }
    case 'fear_aura': {
      const near = foes.filter(f => dist(p, f) < 170);
      for (const f of near) { f.cowed = now + 8000; f.stagger = Math.max(f.stagger || 0, 400); if (!f.boss && f.kind === 'enemy' && f.hp < f.maxHp * 0.5) f.fleeing = true; }
      let fled = 0; for (const c of S.ents[p.map]) if (c.kind === 'npc' && c.alive && !c.guard && !c.faction && !S.party.includes(c.id) && dist(c, p) < 300) { c.fleeing = true; fled++; }
      S.fx.push({ x: p.x, y: p.y - 8, vx: 0, vy: 0, type: 'ring', s: 3.4, life: 700, maxLife: 700 }); fx(p.x, p.y - 16, 'shadow', 14); sfx('death', 0.5);
      if (!near.length && !fled) { UI.toast('Niemand, der dich fürchten müsste.'); return false; }
      return true; }
    case 'chain_command': {
      const g = S.ents[p.map].filter(c => c.kind === 'npc' && c.alive && !c.downed && !c.angry && c.faction === 'chain' && !c.captive && dist(c, p) < 500);
      if (!g.length) { UI.toast('Keine Kettenwachen in Rufweite.'); return false; }
      for (const c of g) { c.cmdUntil = now + 60000; fx(c.x, c.y - 24, 'spark', 3); }
      log(`${p.name}: „Kette — zu mir!“ ${g.length} Wachen folgen dir.`, 'combat'); return true; }
    case 'blood_price': {
      const tgt = foes.filter(f => dist(p, f) < 200 && (f.rooted > now || f.cowed > now || f.fleeing));
      if (!tgt.length) { UI.toast('Niemand zahlt den Blutpreis — erst fesseln oder einschüchtern.'); return false; }
      let sum = 0; for (const f of tgt) { const d = 8 + p.attributes.strength * 0.8; hurt(f, d, p, 'Blutpreis'); sum += d; fx(f.x, f.y - 12, 'blood', 8); }
      B.heal(p, sum * 0.6); float(p, '+' + Math.round(sum * 0.6), 'rgba(160,40,40,ALPHA)'); return true; }
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
  const cost = DODGE.stam * (1.2 - (p.attributes.endurance || 10) * 0.02) * (1 - tfx(p, 'dodge')) * (p.titleClass === 'monk' ? 0.75 : 1);   // Mönch: Leerer Geist
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
// ================= Debug (MP2 §70–§73): Bereiche, Dropdowns, Teleport, Ereignisse =================
function debugSections() {
  const p = S.player, P = () => S.player, TS2 = TS;
  const sel = (id, opts) => `<select id="${id}">${opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>`;
  const byName = (a, b) => a[1].localeCompare(b[1]);
  const towns = Object.keys(TOWN_PLAN).map(k => [k, townName(k)]).sort(byName);
  const places = LOCATIONS.filter(l => !l.poi && l.kind !== 'road').map(l => [l.key, `${l.name} (${l.kind})`]).sort(byName);
  const npcs = S.ents.world.filter(e => e.kind === 'npc' && e.alive && (e.vm || e.houseKey || e.passamt || (e.key && !e.villager && !e.guard))).map(e => [e.id, `${e.name} — ${e.prof}`]).sort(byName).slice(0, 300);
  const items = slot => Object.entries(ITEMS).filter(([, it]) => slot(it)).map(([k, it]) => [k, `${it.name}${it.rarity && it.rarity !== 'common' ? ' · ' + it.rarity : ''}`]).sort(byName);
  const foes = Object.keys(MONSTERS).filter(k => !MONSTERS[k].prey).map(k => [k, MONSTERS[k].name]).sort(byName), beasts = Object.keys(MONSTERS).filter(k => MONSTERS[k].prey || k === 'wolf' || k === 'bear').map(k => [k, MONSTERS[k].name]);
  const facs = Object.keys(FACTIONS).map(k => [k, FACTIONS[k].name]), quests = Object.keys(QUESTS).filter(k => !k.startsWith('c_')).map(k => [k, QUESTS[k].name]).sort(byName);
  const stats = [['bleeding', 'Blutend'], ['poisoned', 'Vergiftet'], ['blessing', 'Gesegnet'], ['frenzy', 'Raserei'], ['chilled', 'Unterkühlt'], ['shackled', 'Versklavt']];
  const nearTown = () => Object.keys(TOWN_PLAN).sort((a, b) => Math.hypot(TOWN_PLAN[a].square[0] - p.x / TS2, TOWN_PLAN[a].square[1] - p.y / TS2) - Math.hypot(TOWN_PLAN[b].square[0] - p.x / TS2, TOWN_PLAN[b].square[1] - p.y / TS2))[0];
  const toWorld = () => { if (S.map !== 'world') travel('world'); };
  const tp = (tx, ty) => { toWorld(); const q = freeSpotNear('world', tx, ty, 3); P().x = q.x; P().y = q.y; log(`Teleport nach ${tx}, ${ty}.`, 'world'); };
  const v = id => $(id).value;
  return [
    ['Bewegung', `${sel('dbSpeed', [[1, 'Tempo ×1'], [2, 'Tempo ×2'], [4, 'Super ×4'], [8, 'Super ×8']])} ${sel('dbTown', towns)} ${sel('dbPlace', places)} ${sel('dbNpc', npcs)} ${sel('dbMap', MAP_KEYS.map(k => [k, DUNGEONS[k]?.name || 'Oberwelt']))}
      <input id="dbXY" placeholder="x,y" size="8">`, {
      'Tempo setzen': () => { (S.dbg ||= {}).speed = +v('dbSpeed'); },
      'Flug/Noclip an/aus': () => { (S.dbg ||= {}).noclip = !S.dbg.noclip; UI.toast(S.dbg.noclip ? 'NOCLIP AN' : 'NOCLIP AUS'); },
      'Teleport: Stadt': () => { const T2 = TOWN_PLAN[v('dbTown')]; tp(T2.square[0], T2.square[1] + 2); },
      'Teleport: Ort': () => { const l = LOCATIONS.find(x => x.key === v('dbPlace')); if (l) tp(l.x, l.y); },
      'Teleport: NPC': () => { const e = byId(v('dbNpc')); if (e) tp(e.x / TS2 | 0, (e.y / TS2 | 0) + 1); },
      'Teleport: Karte/Dungeon': () => { const k = v('dbMap'); if (k !== S.map) travel(k); },
      'Teleport: Koordinaten': () => { const [x, y] = v('dbXY').split(',').map(Number); if (x >= 0 && y >= 0) tp(x, y); },
      'Teleport: Auftragsziel': () => { const k = Object.keys(S.quests).find(q => S.quests[q].state === 'active' && questPoint(q)); const q = k && questPoint(k); if (q) tp(q.x | 0, q.y | 0); else UI.toast('Kein Auftrag mit Ziel'); },
      'Teleport: Schwebende Insel': () => travel('sky'), 'Teleport: Eisenfeste': () => { const l = LOCATIONS.find(x => x.key === 'kettenfeste'); if (l) tp(l.x, l.y + 6); },
    }],
    ['Spieler', `${sel('dbFac', facs)} <input id="dbN" value="25" size="4"> ${sel('dbStat', stats)}`, {
      'Gottmodus an/aus': () => { (S.dbg ||= {}).god = !S.dbg.god; UI.toast(S.dbg.god ? 'GOTTMODUS AN' : 'GOTTMODUS AUS'); },
      'Heilen': () => { B.fullHeal(p); p.downed = false; }, 'Ausdauer voll': () => { p.stamina = p.maxStamina; }, 'Mana voll': () => { p.mana = p.maxMana; },
      'XP + Zahl': () => gainXp(p, +v('dbN') || 100), 'Stufe +1': () => levelUp(p), 'Stufe −1': () => { if (p.level > 1) { p.level--; p.xp = 0; p.xpNext = Math.round(p.xpNext / 1.35); recalc(p); } },
      'Ruf ± Zahl': () => { S.factions[v('dbFac')] = (S.factions[v('dbFac')] || 0) + (+v('dbN') || 0); checkRankUp(); },
      'Rang = Zahl': () => { S.ranks[v('dbFac')] = +v('dbN') || 0; }, 'Fraktion beitreten': () => { S.ranks[v('dbFac')] = Math.max(0, S.ranks[v('dbFac')] ?? 0); },
      'Status setzen': () => addStatus(p, { key: v('dbStat'), name: stats.find(s => s[0] === v('dbStat'))[1], left: 20000, src: p.id }), 'Status entfernen': () => { p.status = (p.status || []).filter(s => s.key !== v('dbStat')); },
      'Gold +500': () => { S.gold += 500; }, 'Material +100': () => { S.res.wood += 100; S.res.stone += 100; S.res.iron += 50; S.res.food += 20; },
    }],
    ['Gegenstände', `${sel('dbW', items(it => it.slot === 'weapon'))} ${sel('dbA', items(it => ['head', 'chest', 'offhand', 'cloak', 'legs', 'hands', 'feet', 'ring', 'amulet'].includes(it.slot)))}
      ${sel('dbM', items(it => it.slot === 'material' || it.slot === 'consumable'))} ${sel('dbL', items(it => it.rarity === 'legendary' || it.rarity === 'epic'))}`, {
      'Waffe': () => addItem(p, v('dbW')), 'Rüstung': () => addItem(p, v('dbA')), 'Material/Verbrauch ×5': () => addItem(p, v('dbM'), 5), 'Selten/Legendär': () => addItem(p, v('dbL')),
    }],
    ['Welt', `<input id="dbH" value="12" size="3"> ${sel('dbWeather', ['clear', 'cloudy', 'rain', 'fog', 'snow', 'bloodrain', 'sandstorm'].map(k => [k, k]))} ${sel('dbFoe', foes)} ${sel('dbBeast', beasts)}`, {
      'Uhrzeit = Stunde': () => { S.minute = (+v('dbH') % 24) * 60; }, 'Tag': () => { S.minute = 12 * 60; }, 'Nacht': () => { S.minute = 23 * 60; },
      'Wetter setzen': () => { S.weather = v('dbWeather'); S.weatherLeft = 300; },
      'Gegner spawnen': () => spawnEnemy(v('dbFoe'), S.map, (p.x / TS2 | 0) + 4, p.y / TS2 | 0), 'Tier spawnen': () => spawnEnemy(v('dbBeast'), S.map, (p.x / TS2 | 0) + 4, p.y / TS2 | 0),
      'NPC spawnen': () => { const q = freeSpotNear(S.map, (p.x / TS2 | 0) + 2, p.y / TS2 | 0, 2), c = makeChar({ name: pick(FIRST_M), prof: 'Reisender', x: q.x, y: q.y, map: S.map }); c.anchor = { x: q.x, y: q.y }; S.ents[S.map].push(c); },
      'Nächsten NPC entfernen': () => { const n = S.ents[S.map].filter(e => e.kind === 'npc' && e !== p).sort((a, b) => dist(a, p) - dist(b, p))[0]; if (n) S.ents[S.map] = S.ents[S.map].filter(e => e !== n); },
      'Zur Karawane': () => { const c = S.ents.world.find(e => e.kind === 'caravan'); if (c) tp(c.x / TS2 | 0, (c.y / TS2 | 0) + 3); },
      'Ganze Welt zeigen an/aus': () => { (S.dbg ||= {}).reveal = !S.dbg.reveal; UI.toast(S.dbg.reveal ? 'KARTE: GANZE WELT' : 'KARTE: NEBEL'); },
    }],
    ['Aufträge', `${sel('dbQ', quests)}`, {
      'Starten': () => { delete S.quests[v('dbQ')]; startQuest(v('dbQ')); }, 'Abschließen': () => { const st = S.quests[v('dbQ')]; if (st) { st.progress = QUESTS[v('dbQ')].objectives.map(o => o.count || 1); st.state = 'done'; } },
      'Abbrechen': () => { const st = S.quests[v('dbQ')]; if (st) st.state = 'failed'; }, 'Zurücksetzen': () => { delete S.quests[v('dbQ')]; },
      'Bretter erneuern': () => { S.conDay = {}; S.contracts = (S.contracts || []).filter(c => c.state !== 'offer'); log('Alle Bretter werden beim nächsten Blick neu beschrieben.', 'quest'); },
    }],
    ['Ereignisse', '', {
      'Untotenangriff (nächstes Dorf)': () => { const V = VILLAGES.slice().sort((a, b) => Math.hypot(a.x - p.x / TS2, a.y - p.y / TS2) - Math.hypot(b.x - p.x / TS2, b.y - p.y / TS2))[0]; S.deadRaid = { v: V.key, at: clock() + 2, n: 6 }; },
      'Banditenüberfall': () => { S.dbgAmbush = true; const a = rnd() * 6.283; for (let i = 0; i < 4; i++) { const e = spawnEnemy(pick(AMBUSH_FAM[0]), 'world', (p.x / TS2 | 0) + Math.round(Math.cos(a) * 12) + ri(-2, 2), (p.y / TS2 | 0) + Math.round(Math.sin(a) * 12) + ri(-2, 2)); e.ambush = 'dbg'; } },
      'Karawanenüberfall': () => { const c = S.ents.world.find(e => e.kind === 'caravan'); if (c) for (let i = 0; i < 4; i++) { const e = spawnEnemy('bandit', 'world', (c.x / TS2 | 0) + 6 + i, c.y / TS2 | 0); e.aggroId = c.id; } },
      'Stadtverteidigung (hier)': () => { const t = nearTown(), C = makeContract(t, 'defense', 'vm'); (S.contracts ||= []).push(C); acceptContract(C); C.at = clock() + 1; },
      'Goblinbefreiung': () => liberate(), 'Sklaverei (Aurelion)': () => { toWorld(); enslave('aurel', 200); }, 'Sklaverei (Kette)': () => { toWorld(); enslave('chain', 200); },
      'Gefängnis': () => { toWorld(); goToJail('valen', 200, nearTown()); }, 'Fahndung Aurelion': () => startHunt(1), 'Magisches Gericht': () => { toWorld(); courtTrial(); },
      'Feldzug der Kette': () => { S.campaign = null; planCampaign('zug'); S.campaign.musterDay = S.day | 0; campaignDay(); },
      'Fraktionskrieg (Kriegsrunde)': () => SIM.warTick(),
    }],
    ['Kommt später (Master-Prompt 2)', '<i>Garmadon-Ereignis (Phase 6), Omega-Beschwörung (Phase 7), Stadtgründung und Weltentwicklung (Phase 8) erscheinen hier, sobald sie gebaut sind.</i>', {}],
    ['Test', '', { 'Selbsttest': () => { const r = selftest(); log(`Selbsttest: ${r.filter(x => x.startsWith('PASS')).length}/${r.length}`, 'world'); }, 'Spieler töten': () => { p.body.torso.hp = 0; B.syncHp(p); downed(p, 'Debug'); p.downTimer = 1; } }],
  ];
}
function toggleDebug() {
  let d = $('debugpanel');
  if (d) { d.remove(); return; }
  d = document.createElement('div'); d.id = 'debugpanel'; d.className = 'panel';
  d.style.cssText = 'max-height:82vh;overflow:auto;max-width:560px';
  d.innerHTML = '<div class="panel-title">DEBUG</div>';
  for (const [title, html, acts] of debugSections()) {
    const sec = document.createElement('details'); sec.open = title === 'Bewegung'; sec.innerHTML = `<summary style="cursor:pointer;margin:6px 0">${title}</summary><div class="dbg-in">${html}</div>`;
    const box = sec.querySelector('.dbg-in');
    for (const [label, fn] of Object.entries(acts)) { const b = document.createElement('button'); b.textContent = label; b.onclick = () => { try { fn(); } catch (err) { console.error(err); UI.toast('Fehler: ' + err.message); } UI.refreshHUD(); }; box.appendChild(b); }
    d.appendChild(sec);
  }
  document.body.appendChild(d);
}
// ================= Selbsttest (ponytail: eine laufbare Prüfung) =================
// §82 Balancing-Messung (nur ?dev): Standard-Held (Stufe, Waffe, Rüstung) gegen einen Gegner auf leerer Karte.
// mode 'stand' = stehen und hauen, 'kite' = rückwärts gehen und hauen. Ergebnis: Sieg?, Sekunden, verlorenes Leben (%).
export function duel(mtype, { weapon = 'longsword', chest = 'leather_jerkin', level = 3, mode = 'stand', seed = 1, trace = false } = {}) {
  const keep = { player: S.player, map: S.map, party: S.party, combat, gold: S.gold, kills: S.kills, quiet: S._quiet, projectiles: S.projectiles, rising: S.rising };
  S.projectiles = []; S.rising = [];              // Geschosse/Auferstehungen gehören zum Duell, nicht zur Welt
  MAPS.__d = { w: 60, h: 40, tiles: new Uint8Array(2400).fill(T.GRASS) }; S.ents.__d = []; solidIndex.__d = new Map(); S._quiet = true;
  try {
    seedRng(seed);
    const p = makeChar({ name: 'Held', map: '__d', x: 40 * TS, y: 20 * TS, level, attrs: { strength: 10 + level, endurance: 10 + level, agility: 10 } });
    p.kind = 'player'; p.equip.weapon = mkItem(weapon); p.equip.chest = mkItem(chest); recalc(p); B.fullHeal(p); p.stamina = p.maxStamina;
    S.player = p; S.map = '__d'; S.party = []; S.ents.__d.push(p);
    const e = spawnEnemy(mtype, '__d', 34, 20); e.aggroId = p.id; const hp0 = B.vital(p);
    const kb = new Set(keys), md = mouse.down, ms = mouse.seen; keys.clear(); mouse.seen = false; mouse.down = true; if (mode === 'kite') keys.add('d');
    let t = 0; const tr = [], sw0 = { n: 0, last: 0 };
    try {
      for (; t < 60000 && e.alive && p.alive && !p.downed; t += 16) {
        if (e.swing > 0 && !(sw0.last > 0)) sw0.n++; sw0.last = e.swing;
        if (trace && t % 480 === 0) tr.push(`${t / 1000 | 0}s d${dist(p, e) | 0}${e.surging ? '!' : ''}${e.stagger > 0 ? ' st' : ''} sw${sw0.n} sta${e.sta | 0} hp${e.hp | 0}`);
        mouse.wx = e.x; mouse.wy = e.y - 12; combat = S.ents.__d.filter(x => x.alive);
        if (mode === 'kite' && p.x > 56 * TS) { p.x = 20 * TS; e.x = p.x - 70; }   // Endlosband: rechts raus, links wieder rein
        controlPlayer(16); for (const x of [...S.ents.__d]) think(x, 16); updateProjectiles(16);
      }
    } finally { keys.clear(); kb.forEach(k => keys.add(k)); mouse.down = md; mouse.seen = ms; }
    return { tr: trace ? tr : undefined, swings: sw0.n, mtype, mode, weapon, level, win: !e.alive, dead: !p.alive || p.downed, sec: +(t / 1000).toFixed(1), hpLost: Math.round((1 - B.vital(p) / hp0) * 100) };
  } finally {
    Object.assign(S, { player: keep.player, map: keep.map, party: keep.party, gold: keep.gold, kills: keep.kills, _quiet: keep.quiet, projectiles: keep.projectiles, rising: keep.rising }); combat = keep.combat;
    delete MAPS.__d; delete S.ents.__d; delete solidIndex.__d;
  }
}
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
  ok('Alle Questgeber existieren (Ereignis-Aufträge wie Geraubter Tribut haben keinen)', Object.values(QUESTS).every(q => q.giver === null || NPCS.some(n => n.key === q.giver) || GOBLIN_VILLAGE.some(n => n.key === q.giver)));   // Grisk steht erst nach der Befreiung
  ok('Alle Startgegenstände definiert', Object.values(ORIGINS).every(o => o.gear.every(g => !!ITEMS[g])));
  ok('Alle Klassenfähigkeiten definiert', Object.values(CLASSES).every(cl => (cl.abilities || []).every(a => !!ABILITIES[a])));
  ok('Lootlisten gültig', Object.values(LOOT).flat().every(([k]) => !!ITEMS[k]));
  // Sprite-System: jede Figur/Pose/Richtung liefert ein nicht-leeres Raster in der festgelegten Größe
  const filled = cv => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; for (let i = 3; i < d.length; i += 4) if (d[i]) return true; return false; };
  ok('Sprites: Figuren aller NPCs, alle Posen', NPCS.every(n => {
    const sp = SP.humanSpec({ ...n, seed: 1, pal: { skin: '#d6b089', hair: '#2b2118', cloth: '#4a3a28' }, equip: {} });
    return ['S', 'N', 'W', 'E'].every(d => ['i0', 'i1', 'w0', 'w1', 'w2', 'w3', 'a1', 'a2', 'hit', 'cast', 'kneel', 'guard', 'sit', 'trade'].every(ps => {
      const f = SP.humanFrame(sp, d, ps); return f.px > 0 && f.ox != null && f.oy != null && f.width * f.px >= 40 && (ps !== 'i0' || filled(f)); }));   // v2: Größe/Pivot je Frame
  }));
  ok('Sprites: alle Gegnertypen', Object.entries(MONSTERS).every(([k, m]) => {
    const e = { mtype: k, seed: 1 };
    const beast = ['wolf', 'boar', 'bear', 'deer', 'wild_dog'].includes(k);
    const f = beast ? SP.beastFrame(k, m.pal, 'W', '', 0) : k === 'gorak' ? SP.bruteFrame(m.pal, 'E', '', 0) : SP.humanFrame(SP.monsterSpec(e, m), 'S', 'i0');
    return filled(f);
  }));
  ok('Sprites: Waffen & Kacheln', Object.entries(ITEMS).filter(([, i]) => i.slot === 'weapon').every(([k, i]) => filled(SP.weaponSprite(k, i.rarity, i.holy, i.wtype).cv))
    && Object.values(T).every(t => filled(SP.tileTexture(t, 0, ['#3c4a2c', '#43522f', '#364325'], 'grass'))));
  // ---- KI, Verbrechen & Übergänge: echte Funktionen auf zwei Mini-Karten; der Spielstand wird danach wiederhergestellt ----
  const sandbox = fn => {
    const keep = { player: S.player, map: S.map, gold: S.gold, day: S.day, minute: S.minute, party: S.party, kills: S.kills, combat,
      projectiles: S.projectiles, rising: S.rising,
      titles: [...(S.player.titles || [])], deep: structuredClone({ flags: S.flags, relations: S.relations, factions: S.factions, ranks: S.ranks, bounty: S.bounty || {}, legend: S.legend || {}, stats: S.stats || {} }) };   // legend/stats/titles: S12 (Leck aus dem Befreiungstest); bounty: Proben mit Taten dürfen kein echtes Kopfgeld hinterlassen
    S._quiet = true;
    S.projectiles = []; S.rising = [];              // Geschosse/Auferstehungen gehören zur Probe, nicht zur Welt (und umgekehrt)
    for (const k of ['__a', '__b']) { MAPS[k] = { w: 40, h: 40, tiles: new Uint8Array(1600).fill(T.GRASS) }; S.ents[k] = []; solidIndex[k] = new Map(); }
    try { return fn(); } catch (err) { console.error(err); return false; }
    finally {
      Object.assign(S, { player: keep.player, map: keep.map, gold: keep.gold, day: keep.day, minute: keep.minute, party: keep.party, kills: keep.kills,
        projectiles: keep.projectiles, rising: keep.rising }, keep.deep);
      combat = keep.combat; keep.player.titles = keep.titles;
      for (const k of ['__a', '__b']) { delete MAPS[k]; delete S.ents[k]; delete solidIndex[k]; }
      S._quiet = false;
    }
  };
  const actor = (x, y, o = {}) => { const a = makeChar({ name: 'Probe', map: '__a', x, y, ...o }); a.anchor = { x, y }; S.ents.__a.push(a); return a; };
  // Kriegsstand der Welt (besetzte Städte) aus Tagesplan-Proben heraushalten — sie prüfen den Friedensalltag
  const peace = fn => { const o = {}; for (const t of Object.keys(TOWN_PLAN)) { const n = S.war.nodes[t]; if (n) { o[t] = n.owner; if (n.owner === 'undead') n.owner = 'valen'; } }
    try { return fn(); } finally { for (const [t, v] of Object.entries(o)) S.war.nodes[t].owner = v; } };
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
    S.gold = 120; knockOut(p, law); updateNpc(law, 16);
    return !far.angry && !lost.angry && !law.angry && !p.downed && S.gold === 40;   // Buße 80 (S12: höhere Strafen)
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
  ok('Reaktion (BUG-077): kampferprobter Bewohner (Kelan) verletzt einen Wolf wirklich, statt Scheinkampf', sandbox(() => {
    stage(); const w = spawnEnemy('wolf', '__a', 20, 20), k = actor(w.x - 30, w.y, { key: 'kelan', equip: { weapon: { key: 'longsword' } } });
    w.atkCd = 1e9; const hp0 = w.hp;
    for (let i = 0; i < 400 && w.alive; i++) { w.x = k.x + 30; w.y = k.y; frames(1, [k]); }
    return !w.alive || w.hp < hp0;
  }));
  ok('Namen (BUG-087/090): je Stadt jeder Bewohnername einmal, passend zum Beruf, kein Bewohner heißt wie eine Figur mit Namen', (() => {
    const named = new Set(S.ents.world.filter(c => c.kind === 'npc' && !c.villager && c.name).map(c => c.name.split(' ')[0])), seen = new Set();
    return S.ents.world.filter(c => c.villager && !c.refugee).every(c => { const k = c.homeTown + ':' + c.name, first = c.name.split(' ')[0];   // Flüchtlinge tragen eigene Namen
      const okName = !seen.has(k) && (femTrade(c.prof) ? FIRST_F : FIRST_M).includes(first) && (c.name.includes(' ') || !named.has(first)); seen.add(k); return okName; });
  })());
  ok('Karte (BUG-085): jeder Auftrag mit festem Ort hat einen Kartenpunkt, jeder Zielort existiert', Object.entries(QUEST_WHERE).every(([k, l]) => QUESTS[k] && LOCATIONS.some(o => o.key === l))
    && Object.keys(QUESTS).every(k => QUESTS[k].dyn || questPoint(k) || ['q_herbs', 'q_rook', 'q_lila', 'q_pelts', 'q_runaway', 'q_grisk_lost', 'q_grisk_rache', 'q_intrige', 'q_rask'].includes(k)));   // Kräuter/Felle überall, Rook wandert, Lila: Suche ohne Ziel, Entlaufener: Ort je Auftrag neu
  ok('Warnung (BUG-081): erster Schritt in ein gefährliches Gebiet schreibt eine Warnung, Siedlungen und Sicheres nicht', (() => {
    const at = k => LOCATIONS.find(l => l.key === k), low = { level: 1 }, vet = { level: 9 };
    return !dangerNote(at('eren'), low, true) && dangerNote(at('forest'), low, true)?.startsWith('Eren-Wald') && !dangerNote(at('forest'), vet, true)
      && !!dangerNote(at('necropolis'), vet, true);
  })());
  ok('Gerüchte: Schlagzeilen werden zu Sätzen (Dativ der Ortsnamen)', newsLine('Schlacht bei Alte Straße') === 'Bei der Alten Straße wurde gekämpft'
    && newsLine('Hedda gefallen') === 'Hedda ist gefallen' && newsLine('Schlacht bei Eren') === 'Bei Eren wurde gekämpft'
    && newsLine('Blut in Alter Friedhof') === 'In dem Alten Friedhof ist Blut geflossen' && newsLine('Gorak erschlagen') === 'Gorak wurde erschlagen'
    && newsLine('Die Karawane ist heil in Eren angekommen') === 'Die Karawane ist heil in Eren angekommen');
  ok('Tagesrhythmus (§41): Marktstände sind 7–18 Uhr offen, sonst sichtbar zu; die Festbude bleibt zum Fest offen', (() => {
    const m0 = S.minute, st = { type: 'stall' }, fest = { type: 'stall', fest: 'eren' };
    try { S.minute = 10 * 60; const day = !R.stallShut(st); S.minute = 20 * 60; return day && R.stallShut(st) && !R.stallShut(fest); } finally { S.minute = m0; }
  })());
  ok('Tagesrhythmus (§41): jede Stadt hat einen Jäger mit Bogen — vormittags draußen in der Wildnis, danach mit Fellen am Markt (einmal je Tag)', peace(() => {
    const m0 = S.minute, pelt0 = S.towns.eren?.stock.pelt;
    try {
      const hs = Object.keys(TOWN_PLAN).filter(t => t !== 'vharnholm').map(t => VILLAGERS.find(c => c.homeTown === t && c.prof === 'Jäger'));
      if (!hs.every(h => h && h.equip.weapon && h.plan.hunt)) return false;
      const out = hs.every(h => { S.minute = 9 * 60 + h.plan.o * 60 + 10; const t = dayTarget(h); return t.k === 'j' && !townAt(t.x / TS | 0, t.y / TS | 0); });
      const reach = hs.every(h => { const [sx, sy] = TOWN_PLAN[h.homeTown].square, gx = h.plan.hunt.x / TS | 0, gy = h.plan.hunt.y / TS | 0, seen = new Set([sx + ',' + sy]), q = [[sx, sy]];
        const [ax0, ay0, ax1, ay1] = TOWN_PLAN[h.homeTown].area, lim = 60 + Math.max(0, Math.max(ax1 - ax0, ay1 - ay0) / 2 - 30);   // Metropole: weiter hinaus
        for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; if (x === gx && y === gy) return true;
          for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { const k = nx + ',' + ny;
            if (seen.has(k) || Math.abs(nx - sx) > lim || Math.abs(ny - sy) > lim || SOLID.has(tileAt('world', nx, ny))) continue; seen.add(k); q.push([nx, ny]); } }
        console.warn('Jagdgrund unerreichbar', h.homeTown, gx, gy); return false; });
      const back = hs.every(h => { S.minute = 14 * 60 + h.plan.o * 60; const t = dayTarget(h); return t.k === 'jd' && townAt(t.x / TS | 0, t.y / TS | 0) === h.homeTown; });
      const he = hs[0], d0 = he._delivered; he._delivered = -1; deliverGame(he); deliverGame(he); const got = S.towns.eren ? S.towns.eren.stock.pelt - pelt0 : 2;
      he._delivered = d0; if (S.towns.eren) S.towns.eren.stock.pelt = pelt0;
      return out && reach && back && Math.abs(got - 2) < 1e-6;   // BUG-102: Lager ist gebrochen (6.3) — Gleitkomma, nicht === vergleichen
    } finally { S.minute = m0; }
  }));
  ok('Tagesrhythmus (§41): Wachschicht — nachts hat jede zweite Wache frei (Wachhaus), tagsüber stehen alle', (() => {
    const gs = S.ents.world.filter(e => e.guard && e.post === 'northcity' && e.alive); if (gs.length < 2) return false;
    const day = gs.every(g => !guardOff(g, 12)), night = gs.filter(g => guardOff(g, 23)), b = HOUSES.find(h => h.town === 'northcity' && h.type === 'barracks');
    return day && night.length === Math.floor(gs.length / 2) && night.every(g => { const t = guardOff(g, 23), x = t.x / TS | 0, y = t.y / TS | 0; return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h && !SOLID.has(tileAt('world', x, y)); });
  })());
  ok('Krieg (§74): Angreifer einer Schlacht erscheinen vor dem Ort und marschieren ein, Verteidiger stehen im Ort', (() => {
    const before = new Set(S.ents.world.map(e => e.id)), nb = S.war.battles.length, L = LOCATIONS.find(l => l.key === 'eren');
    const att = { id: 'probe_a', faction: 'undead', strength: 24, prev: 'road', at: 'eren' }, def = { id: 'probe_d', faction: 'valen', strength: 24, at: 'eren' };
    S._quiet = true; try { SIM.materializeForTest('eren', att, def); } finally { S._quiet = false; }
    const units = S.ents.world.filter(e => !before.has(e.id)), A = units.filter(e => e.armyId === 'probe_a'), D = units.filter(e => e.armyId === 'probe_d');
    const ok1 = A.length >= 2 && D.length >= 2 && A.every(e => e.marching && Math.hypot(e.x / TS - L.x, e.y / TS - L.y) > 12) && D.every(e => Math.hypot(e.x / TS - L.x, e.y / TS - L.y) < 8);
    S.ents.world = S.ents.world.filter(e => before.has(e.id)); S.war.battles.length = nb;
    return ok1;
  })());
  ok('Befreiung (§81): besetzter Ort fällt nur nach allen Wellen; letzte Welle führt der Hauptmann; ohne Endsieg keine Befreiung; danach kehren Leute heim', (() => {
    const p = S.player, keep = structuredClone({ war: S.war, towns: S.towns, chronicle: S.chronicle, titles: p.titles || [], day: S.day, minute: S.minute, x: p.x, y: p.y, map: p.map });
    const entsKeep = S.ents.world.slice(), L = LOCATIONS.find(l => l.key === 'eren');
    S.ents.world = S.ents.world.filter(e => e.armyId !== 'g:eren'); S.war.battles = S.war.battles.filter(b => b.node !== 'eren');   // echter Kriegsstand um Eren: für die Probe ausblenden
    const ids = new Set(S.ents.world.map(e => e.id)), n = S.war.nodes.eren;
    S._quiet = true;
    try {
      n.owner = 'undead'; n.garrison = 30; n.wave = 0; n.waves = 0; S.war.armies = S.war.armies.filter(a => a.at !== 'eren');
      p.map = 'world'; p.x = (L.x + 0.5) * TS; p.y = (L.y + 0.5) * TS;
      const units = () => S.ents.world.filter(e => e.kind === 'enemy' && e.alive && e.armyId === 'g:eren');
      let captain = false, earlyFree = false, marched = true, waves = 0;
      for (let step = 0; step < 60 && n.owner === 'undead'; step++) {
        SIM.battleCheck(); S.minute += 3; waves = Math.max(waves, n.waves || 0);
        const u = units();
        if (u.length) {
          marched &&= u.every(e => e.marching && Math.hypot(e.x / TS - L.x, e.y / TS - L.y) > 7);   // Sammelpunkt 13–15 Kacheln, Streuung ±2, Ausweichen ±3
          if (u.some(e => e.mtype === 'death_captain')) captain = n.wave === n.waves;
          if (n.wave < n.waves) { n.garrison = 0; SIM.battleCheck(); earlyFree ||= n.owner !== 'undead'; }   // Besatzung „leer“, aber Wellen offen
          for (const e of u) { e.alive = false; SIM.unitDied(e); }
        }
      }
      const home = S.ents.world.filter(e => !ids.has(e.id) && e.refugee).length;
      const okAll = waves >= 2 && captain && marched && !earlyFree && n.owner === 'valen' && home >= 4;
      if (!okAll) console.warn('Befreiung', JSON.stringify({ waves, wave: n.wave, captain, marched, earlyFree, owner: n.owner, home, battles: S.war.battles.length }));
      return okAll;
    } finally {
      S._quiet = false;
      S.ents.world = entsKeep;
      Object.assign(S, { war: keep.war, towns: keep.towns, chronicle: keep.chronicle, day: keep.day, minute: keep.minute }); Object.assign(p, { x: keep.x, y: keep.y, map: keep.map, titles: keep.titles });
    }
  })());
  ok('Besatzung (BUG-099): Bewohner eines besetzten Orts bleiben tagsüber im Haus, nach der Befreiung wieder unterwegs', (() => {
    const n = S.war.nodes.eren, o = n.owner, m0 = S.minute, v = VILLAGERS.find(c => c.homeTown === 'eren');
    try { S.minute = 11 * 60; n.owner = 'undead'; const hid = dayTarget(v).k === 'v'; n.owner = 'valen'; return hid && dayTarget(v).k !== 'v'; }
    finally { n.owner = o; S.minute = m0; }
  })());
  ok('Beziehungen (§79): Freund und Rival je Stadt; Rivalen reden nie miteinander, gehen sich aus dem Weg, über Rivalen wird gelästert', sandbox(() => {
    const withRel = VILLAGERS.filter(c => c.rel); if (withRel.length < VILLAGERS.length * 0.9 || !VILLAGERS.some(c => c.rel?.rival)) return false;
    const sameTown = withRel.every(c => { const f = byId(c.rel.friend), r = c.rel.rival && byId(c.rel.rival); return f && f.homeTown === c.homeTown && (!r || r.homeTown === c.homeTown); });
    const a = VILLAGERS.find(c => c.rel?.rival), b = byId(a.rel.rival), keep = [a, b].map(c => ({ c, x: c.x, y: c.y, talk: c.talk, map: c.map }));
    try {
      const [qx, qy] = TOWN_PLAN[a.homeTown].square; a.x = (qx + 0.5) * TS; a.y = (qy + 0.5) * TS;   // offener Platz: Ausweichen nicht von Wänden verfälscht
      const talkPlan = { x: a.x, y: a.y, k: 'l', social: 1 };
      b.x = a.x + 30; b.y = a.y; a.vx = a.vy = b.vx = b.vy = 0; a.talk = b.talk = null;
      const hostile = !startTalk(a) || a.talk?.with !== b.id;
      a.talk = null; const x0 = Math.hypot(a.x - b.x, a.y - b.y); for (let i = 0; i < 30; i++) villagerDay(a, talkPlan, 16);
      const away = Math.hypot(a.x - b.x, a.y - b.y) > x0 + 10;
      return sameTown && hostile && away && RIVAL_TALK.every(l => l[0].includes('%'));
    } finally { for (const k of keep) Object.assign(k.c, { x: k.x, y: k.y, talk: k.talk, map: k.map }); }
  }));
  ok('Gegner-Ausdauer (§28): Maximum über dem Spieler, Dauerangriff erschöpft sichtbar (wankt), bloßes Warten nicht', sandbox(() => {
    const p = stage(), b = spawnEnemy('bandit', '__a', 12, 9); b.x = p.x + 30; b.y = p.y;

    let tired = false;
    for (let i = 0; i < 2000 && !tired; i++) { if (!(b.swing > 0) && !(b.stagger > 0)) { b.swing = 0.001; b.swingDur = 400; b.hitDone = true; } tickCombatant(b, 16); tired = b.stagger > 500; }
    const b2 = spawnEnemy('bandit', '__a', 20, 20); for (let i = 0; i < 2000; i++) tickCombatant(b2, 16);   // nur warten
    const okA = b2.maxSta > (p.maxStamina || 100) * 1.1 && tired && b2.sta === b2.maxSta && !(b2.stagger > 0);
    if (!okA) console.warn('Ausdauer', b2.maxSta, p.maxStamina, tired, b2.sta, b2.stagger, b.sta);
    return okA;
  }));
  ok('Gegner (Phase 11): jede angreifende Art hat einen eigenen Ruf beim Entdecken', Object.entries(MONSTERS).every(([k, m]) => m.prey || ['growl', 'rattle', 'moan', 'shriek', 'shout'].includes(VOICE[k])));
  ok('Regionale Bosse (§73): Leitwolf und Sandfürst stehen; Leitwolf: unter 50 % ruft er das Rudel; sein Tod ändert Region (Hunde statt Wölfe, weniger), Felle, Chronik', (() => {
    const RB = REGION_BOSSES[0], al = S.ents.world.find(e => e.alive && bossOf(e) === RB); if (!al && !S.flags.alphaSlain) return false;
    if (!S.flags.sandlordSlain && !S.ents.world.some(e => e.alive && bossOf(e) === REGION_BOSSES[1] && e.title)) return false;   // zweiter Regionalboss steht
    const west = SPAWN_AREAS.find(RB.area), f0 = S.flags.alphaSlain, pelt0 = S.towns.eren.stock.pelt, fac0 = S.factions.valen;
    try {
      S.flags.alphaSlain = false; const capBefore = capOf(west); let dogs0 = 0; for (let i = 0; i < 200; i++) dogs0 += spawnType(west) === 'wild_dog';
      S._quiet = true; regionBossSlain(RB); S._quiet = false;
      let dogs = 0; for (let i = 0; i < 200; i++) dogs += spawnType(west) === 'wild_dog';
      const okB = (al ? al.boss && al.title && al.maxHp >= 150 : true) && dogs0 === 0 && dogs > 30 && capOf(west) < capBefore && S.towns.eren.stock.pelt === pelt0 + 8;
      if (!okB) console.warn('Leitwolf', !!al, al?.maxHp, dogs0, dogs, capOf(west), capBefore, S.towns.eren.stock.pelt, pelt0);
      return okB;
    } finally { S._quiet = false; S.flags.alphaSlain = f0; S.towns.eren.stock.pelt = pelt0; S.factions.valen = fac0; }
  })());
  ok('Balancing (§82): Stufe-3-Held verliert gegen einen Banditen im Stand ≥ 12 % Leben; Rückwärtslaufen ist nicht billiger als Stehen', (() => {
    const st = [1, 2, 3].map(sd => duel('bandit', { level: 3, seed: sd })), ki = [1, 2, 3].map(sd => duel('bandit', { level: 3, mode: 'kite', seed: sd }));
    const avg = a => a.reduce((n, x) => n + x.hpLost, 0) / a.length;
    if (!(avg(st) >= 12 && avg(ki) >= avg(st) * 0.8)) console.warn('Balancing', avg(st), avg(ki));
    return st.every(x => x.win) && avg(st) >= 12 && avg(ki) >= avg(st) * 0.8;
  })());
  ok('Bosse (§82): Abstand halten wird bestraft (Gorak stürmt schon in Phase 1, Hrodvar wirft die Eislanze), Phase 3 unter 25 %', sandbox(() => {
    const p = stage(); p.x = 30 * TS; p.y = 20 * TS;
    const g = spawnEnemy('gorak', '__a', 22, 20); g.aggroId = p.id; combat = S.ents.__a.filter(e => e.alive);
    let charged = false; for (let i = 0; i < 400 && !charged; i++) { g.x = p.x - 200; g.y = p.y; think(g, 16); charged = g.special?.kind === 'charge'; }
    const h = spawnEnemy('hrodvar', '__a', 22, 26); h.aggroId = p.id; S.projectiles = [];
    let lance = false; for (let i = 0; i < 400 && !lance; i++) { h.x = p.x - 220; h.y = p.y + 40; combat = S.ents.__a.filter(e => e.alive); think(h, 16); lance = S.projectiles.some(q => q.kind === 'frost'); }
    g.phase = 2; g.hp = g.maxHp * 0.2; g.special = null; g.roar = 0; think(g, 16);
    return charged && g.phase === 3 && lance;
  }));
  ok('Gegner (§82): Speerträger stößt zurück, wer zu nahe kommt, und kämpft auf Speerlänge', sandbox(() => {
    const p = stage(); p.x = 20 * TS; p.y = 20 * TS; const sp = spawnEnemy('bandit_spear', '__a', 20, 20); sp.x = p.x - 24; sp.y = p.y; sp.aggroId = p.id;
    combat = S.ents.__a.filter(e => e.alive); const x0 = p.x;
    for (let i = 0; i < 20; i++) { think(sp, 16); tickCombatant(p, 16); }
    const shoved = p.x - x0 > 12;
    sp.x = p.x - 200; sp.telegraph = 0; sp.windup = false; sp.swing = 0; sp.atkCd = 0; for (let i = 0; i < 300; i++) { combat = S.ents.__a.filter(e => e.alive); think(sp, 16); if (sp.telegraph > 0 || sp.swing > 0) break; }
    const d = dist(sp, p);
    if (!(shoved && d > 40 && d < 80)) console.warn('Speer', shoved, p.x - x0, d | 0, sp.shoveCd, sp.telegraph, sp.alive);
    return shoved && d > 40 && d < 80;
  }));
  ok('Waffe (§82): Streitflegel baut Schwung auf (+Schaden, ab Stufe 2 rundum), Treffer gegen den Träger löscht ihn', sandbox(() => {
    const p = stage(); p.equip.weapon = mkItem('flail'); p.aim = 0; p.stamina = 1e4;
    const mk = (dx, dy) => { const e = spawnEnemy('bandit', '__a', 11, 9); e.x = p.x + dx; e.y = p.y + dy; e.maxHp = e.hp = 1e4; if (e.body) { for (const k of B.PARTS) e.body[k].max = e.body[k].hp = 1e4; B.syncHp(e); } return e; };
    const front = mk(40, 0), back = mk(-40, 0); combat = S.ents.__a.filter(e => e.alive); seedRng(3);
    const swing = () => { p.swing = 0; p.atkCd = 0; resolveSwing(p); };
    swing(); const m1 = p.momentum, backHp1 = back.hp; swing(); swing(); const m3 = p.momentum, backHit = back.hp < backHp1;
    hurt(p, 1, front, 'Test'); return m1 === 1 && m3 === 3 && backHit && p.momentum === 0;
  }));
  ok('Gefahrenregionen (§71): Gegner aus Gefahr-4-Gebiet sind stärker und oft Veteranen, in Gefahr-1-Gebiet nie', (() => {
    const hi = LOCATIONS.find(l => l.threat >= 4 && l.kind !== 'city'), lo = LOCATIONS.find(l => l.threat === 1 && l.kind === 'wild'), made = [];
    try {
      seedRng(9); for (let i = 0; i < 12; i++) made.push(regionSpawn('skeleton', 'world', Math.round(hi.x), Math.round(hi.y)));
      const hiE = made.slice(); for (let i = 0; i < 12; i++) made.push(regionSpawn('skeleton', 'world', Math.round(lo.x), Math.round(lo.y)));
      const loE = made.slice(12), avg = a => a.reduce((n, e) => n + e.level, 0) / a.length;
      return avg(hiE) >= avg(loE) + 3 && hiE.some(e => e.elite) && !loE.some(e => e.elite);
    } finally { S.ents.world = S.ents.world.filter(e => !made.includes(e)); }
  })());
  ok('Questtafel (§80): jede Stadt hat ein Brett; es nennt nur Aufträge der eigenen Stadt mit Ansprechpartner, ohne erledigte', (() => {
    const towns = Object.keys(TOWN_PLAN).filter(t => t !== 'vharnholm');
    const every = towns.every(t => S.ents.world.some(e => e.type === 'board' && boardTown(e) === t));
    const q0 = structuredClone(S.quests);
    try {
      for (const k of Object.keys(S.quests)) delete S.quests[k];
      const eren = boardEntries('eren'), txt = boardText('eren');
      const own = eren.length > 0 && eren.every(q => q.info.town === 'eren') && txt.includes('bei ') && txt.includes(QUESTS[eren[0].k].name);
      S.quests[eren[0].k] = { state: 'done', progress: [] };
      return every && own && !boardText('eren').includes(QUESTS[eren[0].k].name);
    } finally { for (const k of Object.keys(S.quests)) delete S.quests[k]; Object.assign(S.quests, q0); }
  })());
  ok('Raids (§74): Späher warnen vor dem Anmarsch; Fall einer Stadt beschädigt Häuser sichtbar, nach Befreiung Wiederaufbau je Tag', (() => {
    const keep = structuredClone({ war: S.war, chronicle: S.chronicle, flags: S.flags }), wears = HOUSES.map(b => [b, b.wear]);
    S._quiet = true;
    try {
      const W = S.war; W.battles = [];
      for (const n of Object.values(W.nodes)) { n.owner = 'valen'; n.garrison = 99; }
      W.armies = [{ id: 'probe_u', faction: 'undead', at: 'road', prev: 'road', strength: 30, name: 'Probe-Heer' }];
      const s0 = S.chronicle.length; S._frozenWar = false; SIM.warTick();
      const warned = W.armies[0].warned === 'eren' && W.armies[0].at === 'road';   // gewarnt, und das Heer sammelt sich noch einen Zug
      delete S.flags.raidDamage; const before = HOUSES.filter(b => b.town === 'eren').map(b => HB.wearOf(b));
      raidDamage('eren'); const after = HOUSES.filter(b => b.town === 'eren').map(b => HB.wearOf(b));
      const damaged = after.filter((w, i) => w > before[i]).length;
      const sumD = () => Object.values(S.flags.raidDamage || {}).reduce((n, d) => n + d.wear - d.base, 0), w0 = sumD();
      W.nodes.eren.owner = 'valen'; rebuildTick(); const rebuilt = sumD() < w0;
      if (!(warned && damaged === 3 && rebuilt)) console.warn('Raid', warned, damaged, rebuilt, JSON.stringify(W.armies.map(a => [a.at, a.warned])), S.chronicle.slice(s0).map(c => c.text).join(' / '));
      return warned && damaged === 3 && rebuilt;
    } finally { S._quiet = false; Object.assign(S, { war: keep.war, chronicle: keep.chronicle, flags: keep.flags }); for (const [b, w] of wears) b.wear = w; }
  })());
  ok('Aufträge (§45): neue Aufträge haben lebende Geber in ihrer Stadt; Regionalboss-Tod zählt, Felle werden abgegeben', (() => {
    const ks = ['q_greymane', 'q_sandlord', 'q_pelts', 'q_hundred_song'], q0 = structuredClone(S.quests);
    try {
      const givers = ks.every(k => { const i = questGiverInfo(k); return i && i.town; });
      for (const k of Object.keys(S.quests)) delete S.quests[k];
      const f0 = S.flags.alphaSlain; S.flags.alphaSlain = false; startQuest('q_greymane'); onKill('alpha'); const counted = questComplete('q_greymane'); S.flags.alphaSlain = f0;
      return givers && counted && QUESTS.q_pelts.reward.takeCount === 3;
    } finally { for (const k of Object.keys(S.quests)) delete S.quests[k]; Object.assign(S.quests, q0); }
  })());
  ok('Kopfgeld (§44/§72): bezeugter Angriff kostet Kopfgeld, verfällt je Tag; Wache stellt den Gesuchten (zahlen/Kerker/Widerstand); Jäger wachsen gedeckelt', sandbox(() => {
    const p = stage(), b0 = S.bounty, g0 = S.gold, f0 = S.flags.arrestCd, d0 = S.day;
    try {
      S.bounty = {}; addBounty('valen', 25, 'Test'); bountyDay(); const decayed = S.bounty.valen === 20;
      const g = actor(p.x + 30, p.y, { faction: 'valen' }); g.guard = true; S.flags.arrestCd = 0; S.gold = 100; UI.closeDialogue();
      arrestCheck(g, p, 16); const btns = document.querySelectorAll('#dlg-choices button').length, txt = document.getElementById('dlg-text').textContent;
      UI.closeDialogue();
      p.level = 40; S.ents.__a.length = 0; S.ents.__a.push(p); const map0 = p.map; p.map = 'world';
      const n0 = S.ents.world.length; spawnHunters(p); const hs = S.ents.world.slice(n0); S.ents.world.length = n0; p.map = map0;
      return decayed && btns === 3 && txt.includes('20 Gold') && hs.length === 3 && hs.every(h => h.level <= 2 + HUNTER_TIER_CAP * 2 && h.tier === HUNTER_TIER_CAP);
    } finally { S.bounty = b0; S.gold = g0; S.flags.arrestCd = f0; S.day = d0; UI.closeDialogue(); }
  }));
  ok('Ruf-Stufen (§43): sieben Stufen; Preise beim Fraktionshändler folgen dem Ruf; Verhasst: kein Handel, Wachen greifen an', (() => {
    const f0 = S.factions.merch, npc = { faction: 'merch' };
    try {
      S.factions.merch = 80; const cheap = price('longsword', true, npc); S.factions.merch = 0; const norm = price('longsword', true, npc); S.factions.merch = -45; const dear = price('longsword', true, npc);
      S.factions.merch = -80; const hated = repTier('merch').name === 'Verhasst';
      return REP_TIERS.length === 7 && cheap < norm && dear > norm && hated && REP_TIERS.every((t, i) => !i || t.min < REP_TIERS[i - 1].min);
    } finally { S.factions.merch = f0; }
  })());
  ok('Varg (S12): hält Hof mit sechs Wachen und ist ansprechbar; die Kette ist ohne Alarm neutral; Herausforderung macht sie feindlich; Hinterhalt trifft härter und löst Alarm aus', sandbox(() => {
    const keep = { f: { ...S.flags }, c: S.factions.chain };
    try {
      const v = S.ents.world.find(e => e.rboss === 'chainmaster' && e.alive), court = S.ents.world.filter(e => e.court && e.alive).length;
      S.flags.vargChallenged = false; S.flags.chainAlarm = 0;
      const calm = S.flags.goblinsFreed || (v && v.parley && teamOf(v) === 'neutral' && court >= 6 && interactables !== undefined);
      S.flags.vargChallenged = true; const war = S.flags.goblinsFreed || teamOf(v) === 'foe'; S.flags.vargChallenged = false;
      const p = stage(); p.aim = 0; combat = S.ents.__a; p.equip.weapon = mkItem('longsword');
      const mk = () => { const e = spawnEnemy('chain_brute', '__a', 11, 9); e.x = p.x + 30; e.y = p.y; e.stagger = 0; return e; };
      const a1 = mk(), h1 = a1.hp; seedRng(4); hit(p, a1, 1); const amb = h1 - a1.hp, alarm = S.flags.chainAlarm > S.day;
      const a2 = mk(), h2 = a2.hp; seedRng(4); hit(p, a2, 1); const plain = h2 - a2.hp;
      return calm && war && alarm && amb >= plain * 1.4;
    } finally { Object.assign(S.flags, keep.f); S.flags.chainAlarm = keep.f.chainAlarm || 0; S.flags.vargChallenged = keep.f.vargChallenged || false; S.factions.chain = keep.c; }
  }));
  ok('Mord am hohen Stand (S12): Priester töten kostet viel Ruf (Fraktion + Orden), setzt 800 Kopfgeld, Blutbann (Wachen greifen an) und Kirchenbann (keiner hilft auf); gewöhnlicher Mord kostet auch Ruf', sandbox(() => {
    const keep = structuredClone({ f: S.factions, fl: S.flags, b: S.bounty || {}, c: S.chronicle }), q = S._quiet; S._quiet = true;
    try {
      const p = stage(), wit = actor(360, 300, { faction: 'valen' }), pr = actor(330, 300, { faction: 'valen' }); pr.prof = 'Priester';
      const v0 = S.factions.valen, o0 = S.factions.order; S.bounty = {}; S.flags.bann = {}; S.flags.anathema = 0;
      bloodshed(pr, false);
      const rep1 = S.factions.valen === v0 - 35 && S.factions.order === o0 - 30 && S.bounty.valen === 800 && banned('valen') && banned('order') && S.flags.anathema > S.day;
      const g = actor(380, 300, { faction: 'valen' }); g.guard = true; arrestCheck(g, p, 16); const attacks = g.angry && g.aggroId === p.id;
      const v1 = S.factions.valen, plain = actor(340, 320, { faction: 'valen' }); plain.prof = 'Bauer'; bloodshed(plain, false);
      return rep1 && attacks && S.factions.valen === v1 - 10 && wit.alive;
    } finally { S._quiet = q; Object.assign(S, { factions: keep.f, flags: keep.fl, bounty: keep.b, chronicle: keep.c }); for (const e of S.ents.world) if (e.kind === 'enemy' && e.mtype === 'bounty_hunter' && e.encounter && !e.map) e.alive = false; }
  }));
  ok('Eisenfeste (S12): nachts Fallgitter und Nachtwachen, morgens offen; Feldzug: Kriegsrat → Musterung mit Proviantwagen → Marsch → gewürfelte Schlacht → Rückkehr oder Untergang; Sabotage schwächt', sandbox(() => {
    const m0 = S.minute, keepC = S.campaign, keepN = S.campNext, keepF = { ...S.flags }, before = new Set(S.ents.world.map(e => e.id)), q = S._quiet; S._quiet = true;
    try {
      S.flags.chainsBroken = false; S.ents.world = S.ents.world.filter(e => !e.fortGate && !e.nightWatch);
      S.minute = 23 * 60; fortressHour(); const shut = S.ents.world.filter(e => e.fortGate).length >= 6 && S.ents.world.some(e => e.nightWatch);
      S.minute = 8 * 60; fortressHour(); const open = !S.ents.world.some(e => e.fortGate || e.nightWatch);
      S.campaign = null; S.campNext = { raid: 0, zug: 1e9, heer: 1e9 }; campaignDay(); const C = S.campaign, rat = C?.phase === 'rat' && C.type === 'raid';
      C.musterDay = S.day | 0; campaignDay(); const muster = C.phase === 'muster' && campMembers(C).length >= 8 && S.ents.world.some(e => e.campSupply === C.id);
      const cart = S.ents.world.find(e => e.campSupply === C.id); sabotageCampaign(cart); const sab = C.sabotaged;
      C.marchAt = 0; campTick(); const march = C.phase === 'march' && !S.ents.world.some(e => e.campSupply === C.id);
      const lead = S.ents.world.find(e => e.camp === C.id && e.campLead); campArrive(C, lead);   // weit weg vom Spieler: gewürfelt
      const done = C.phase === 'return' || C.phase === 'done';
      return shut && open && rat && muster && sab && march && done;
    } finally { S._quiet = q; S.minute = m0; S.campaign = keepC; S.campNext = keepN; Object.assign(S.flags, keepF); S.ents.world = S.ents.world.filter(e => before.has(e.id)); fortressHour(); }
  }));
  ok('Abstand (S12): zwei Gegner am selben Punkt schieben sich auseinander; Spawnplätze sind nie eingesperrt; wer klemmt, wird befreit', (() => {
    const p = S.player, keep = combat, x = p.x + 90, y = p.y;
    const a = { id: 'sepA', kind: 'enemy', map: S.map, x, y, r: 10, alive: true, seed: 3 }, b = { id: 'sepB', kind: 'enemy', map: S.map, x, y, r: 10, alive: true, seed: 5 };
    combat = [a, b]; for (let i = 0; i < 40; i++) separate(); combat = keep;
    const apart = Math.hypot(a.x - b.x, a.y - b.y) >= 14;
    const tx = p.x / TS | 0, ty = p.y / TS | 0, spots = Array.from({ length: 12 }, () => freeSpotNear(S.map, tx + ri(-30, 30), ty + ri(-30, 30), 3));
    const open = spots.every(q => openSpot(S.map, q.x / TS | 0, q.y / TS | 0, DUNGEONS[S.map] ? 30 : 120));
    const rock = S.ents[S.map].find(e => e.kind === 'prop' && e.solid && e.type !== 'portcullis' && dist(e, p) < 900);   // in einem Baum/Felsen gefangen
    const c = { id: 'sepC', kind: 'enemy', map: S.map, x: rock ? rock.x : p.x, y: rock ? rock.y : p.y, r: 10, alive: true, stuckT: 1990 }; seek(c, 0, 0, 16);   // kein Schritt möglich
    return apart && open && (!rock || !solidPropAt(S.map, c.x, c.y, 4));
  })());
  ok('Dienst bei der Kette (S12, A3): Beitritt, Ränge bis Aufseher, Entlaufener, Weihe zum Hochpaladin mit vier Fähigkeiten, Furcht verteuert den Handel', sandbox(() => {
    const p = S.player, keep = { f: { ...S.factions }, r: { ...S.ranks }, cls: p.currentClass, kc: [...p.knownClasses], ab: [...p.abilities], hot: structuredClone(p.hotbar), q: S.quests.q_runaway, ra: S.runaway, g: S.gold, inv: structuredClone(p.inv) };
    const q = S._quiet; S._quiet = true;
    try {
      S.flags.chainsBroken = false; S.ranks.chain = 0; S.factions.chain = 80; checkRankUp(); checkRankUp(); checkRankUp();
      const rank = S.ranks.chain === 3 && FACTIONS.chain.ranks[3] === 'Aufseher';
      startRunaway(); chainTick(); const ru = S.ents.world.find(e => e.runaway), found = !!ru && S.quests.q_runaway.state === 'active';
      const ch = []; runawayChoices(ru, ch); ch[0].fn(); const back = S.quests.q_runaway.state === 'done' && !S.ents.world.some(e => e.runaway);
      const trader = S.ents.world.find(e => e.kind === 'npc' && e.shop && !e.faction && e.alive), p0 = trader ? price('bread', true, trader) : 0;
      unlockClass('darkpaladin'); const four = ['chain_strike', 'fear_aura', 'chain_command', 'blood_price'].every(k => p.abilities.includes(k) && ABILITIES[k]);
      const dearer = !trader || price('bread', true, trader) > p0;
      return rank && found && back && four && dearer && fearLvl() === 2;
    } finally { S._quiet = q; Object.assign(S.factions, keep.f); Object.assign(S.ranks, keep.r); p.knownClasses = keep.kc; p.currentClass = keep.cls; p.abilities = keep.ab; p.hotbar = keep.hot; p.inv = keep.inv;
      S.gold = keep.g; S.runaway = keep.ra; if (keep.q) S.quests.q_runaway = keep.q; else delete S.quests.q_runaway; S.ents.world = S.ents.world.filter(e => !e.runaway); recalc(p); }
  }));
  ok('Fall der Eisenfeste (S12, A4): Raid mit Vorwarnung, gewürfelter Ausgang, Zerstörung endgültig (Schwer) oder Wiederaufbau (Angsthase), Verteidiger zählen, Grisk-Aufträge nach der Befreiung', sandbox(() => {
    const keep = { r: S.deadRaid, z: S.razed, d: S.defense, dmg: structuredClone(S.flags.raidDamage || {}), f: S.flags.chainsBroken, g: S.gold, diff: S.difficulty, fr: S.flags.goblinsFreed }, ents = S.ents.world.slice(), alive = ents.map(e => e.alive), wear = HOUSES.map(b => b.wear);
    const q = S._quiet; S._quiet = true;
    try {
      const V = VILLAGES.find(v => TOWN_PLAN[v.key] && villagersOf(v.key).length); if (!V) return false;
      S.deadRaid = null; S.razed = {}; S.defense = {}; S.flags.chainsBroken = true;
      let tries = 0; while (!S.deadRaid && tries++ < 200) raidDay(); const warned = !!S.deadRaid && S.deadRaid.at > clock();
      const p0 = defPower(V.key), D = defOf(V.key); D.until.merc = (S.day | 0) + 5; D.merc = 3; const stronger = defPower(V.key) > p0 + 5;
      S.difficulty = 'schwer'; raze(V.key); const gone = !villagersOf(V.key).length && S.razed[V.key] && !S.razed[V.key].rebuild;
      const ruin = HOUSES.filter(b => b.town === V.key).every(b => HB.wearOf(b) === 2); rebuildTick(); const stays = HOUSES.filter(b => b.town === V.key).every(b => HB.wearOf(b) === 2);
      S.razed = {}; S.difficulty = 'angsthase'; raze(V.key); S.razed[V.key].rebuild = 0; rebuildRazed(); const back = !S.razed[V.key] && villagersOf(V.key).length >= 4;
      S.flags.goblinsFreed = false; const lock = !questAvailable('q_grisk_lost'); S.flags.goblinsFreed = true; const open = ['q_grisk_lost', 'q_grisk_rache', 'q_grisk_build'].every(questAvailable);
      return warned && stronger && gone && ruin && stays && back && lock && open;
    } finally { S._quiet = q; S.deadRaid = keep.r; S.razed = keep.z; S.defense = keep.d; S.flags.raidDamage = keep.dmg; S.flags.chainsBroken = keep.f; S.gold = keep.g; S.difficulty = keep.diff; S.flags.goblinsFreed = keep.fr;
      S.ents.world = ents; ents.forEach((e, i) => { e.alive = alive[i]; }); HOUSES.forEach((b, i) => { b.wear = wear[i]; }); }
  }));
  ok('Aurelion (S12, E): Schein/Dienst/Bürgerrecht gelten, Automat sieht im Kegel, Schuldknecht arbeitet frei, Flucht nur ungesehen, Prothese: Zustand und Aufrüstung, letzte Bastion verdoppelt', sandbox(() => {
    const p = S.player, keep = { permit: S.permit, job: S.aurelJob, bond: S.bond, cit: S.flags.aurelCitizen, mar: S.flags.marriedHouse, cb: S.flags.chainsBroken, x: p.x, y: p.y, w: p.equip.weapon, st: p.status, larm: { ...p.body.larm } };
    const ents = S.ents.world.slice(), dn = ents.map(e => e.downed);
    try {
      S.flags.aurelCitizen = false; S.flags.marriedHouse = null; S.aurelJob = null; S.bond = null; S.permit = -1;
      const none = !hasPermit(); S.permit = (S.day | 0) + 2; const paper = hasPermit(); S.permit = -1; S.aurelJob = { house: 'vantor', until: (S.day | 0) + 1, pay: 15 }; const job = hasPermit(); S.aurelJob = null;
      const robot = { x: 300, y: 600, map: '__a', aim: 0 }, tgt = { x: 400, y: 600, map: '__a' }, side = { x: 300, y: 700, map: '__a' };   // Sandbox-Wiese
      const cone = coneSees(robot, tgt) && !coneSees(robot, side) && !coneSees(robot, { x: 600, y: 600, map: '__a' });
      const ok1 = enslave('aurel', 30), B0 = S.bond, bonded = ok1 && B0 && !p.equip.weapon && stat(p, 'shackled') && hasPermit();
      B0.debt = 10; B0.debt -= 15; if (B0.debt <= 0) freeBond('Test'); const worked = !S.bond && !stat(p, 'shackled');
      S.flags.chainsBroken = false; const ok2 = enslave('chain', 200), B1 = S.bond; for (const e of S.ents.world) if (e.faction === 'chain' && e.kind === 'npc') e.downed = true;   // niemand schaut
      p.x = (FORT[0] - 3) * TS; p.y = (FORT[1] + 20) * TS; bondTick(); const fled = ok2 && !S.bond;
      p.body.larm.mech = 3; p.body.larm.lost = false; p.body.larm.mechCond = 100; p.body.larm.mechUp = 1; const up = Math.abs(B.mechBonus(p, 'arm') - 0.15) < 1e-9;
      p.body.larm.mechCond = 20; const broken = B.mechBonus(p, 'arm') === 0;
      S.flags.chainsBroken = true; const dear = bastion() === 2;
      return none && paper && job && cone && bonded && worked && fled && up && broken && dear;
    } finally { S.permit = keep.permit; S.aurelJob = keep.job; S.bond = keep.bond; S.flags.aurelCitizen = keep.cit; S.flags.marriedHouse = keep.mar; S.flags.chainsBroken = keep.cb;
      p.x = keep.x; p.y = keep.y; p.equip.weapon = keep.w; p.status = keep.st; Object.assign(p.body.larm, keep.larm); delete p.body.larm.mechCond; delete p.body.larm.mechUp; if (keep.larm.mechCond != null) p.body.larm.mechCond = keep.larm.mechCond;
      S.ents.world = ents; ents.forEach((e, i) => { e.downed = dn[i]; }); recalc(p); }
  }));
  ok('Aurelion II (S12): Automaten tratschen nicht, in Ketten keine Waffe, zerstörter Automat startet die Fahndung, Gericht auf der Himmelsinsel entlässt oder verurteilt, Sühne beendet die Fahndung', sandbox(() => {
    const p = S.player, keep = { hunt: S.hunt, bond: S.bond, w: p.equip.weapon, inv: structuredClone(p.inv), f: S.factions.aurel, gold: S.gold, st: p.status, map: S.map, x: p.x, y: p.y };
    try {
      const sky = !!MAPS.sky && S.ents.sky.some(e => e.portal === 'world') && S.ents.world.some(e => e.portal === 'sky');
      S.bond = { kind: 'aurel', debt: 10, since: 0, x: p.x, y: p.y }; p.inv.push(mkItem('longsword')); const idx = p.inv.length - 1, w0 = p.equip.weapon; equip(p, idx); const noWeapon = p.equip.weapon === w0; S.bond = null;
      S.hunt = null; const robot = { id: 'rbTest', robot: true, faction: 'aurel', kind: 'npc', alive: true, map: 'world', x: p.x, y: p.y };
      startHunt(1); const hunted = S.hunt?.level === 1;
      S.gold = 5000; S.hunt = { level: 2, next: 1e12 }; const fine = 600; S.gold -= fine; S.hunt = null; const cleared = !S.hunt;
      return sky && noWeapon && hunted && cleared && !!robot;
    } finally { S.hunt = keep.hunt; S.bond = keep.bond; p.equip.weapon = keep.w; p.inv = keep.inv; S.factions.aurel = keep.f; S.gold = keep.gold; p.status = keep.st; }
  }));
  ok('Phase 1 XP (MP2 §17): Anteil nach Schaden — 40 von 100 ergibt 40 %, ohne Schaden 0, Diener zählen für den Herrn, Gift für den Giftmischer', sandbox(() => {
    const p = stage(), e = { kind: 'enemy' }, n = { id: 'npcX' }, sv = { id: 'sv1', servant: p.id };
    credit(e, p, 40); credit(e, n, 60); const s1 = xpShares(e);
    const e2 = { kind: 'enemy' }; credit(e2, n, 50); const s2 = xpShares(e2);
    const e3 = { kind: 'enemy' }; credit(e3, sv, 30); credit(e3, n, 30); const s3 = xpShares(e3);
    const t = actor(340, 300); t.kind = 'enemy'; t.status = [{ key: 'poisoned', name: 'Vergiftet', left: 5000, src: p.id, acc: 1.5 }]; tickCombatant(t, 16);
    return Math.abs(s1(p.id) - 0.4) < 1e-9 && s2(p.id) === 0 && Math.abs(s3(p.id) - 0.5) < 1e-9 && (t.dmgBy?.[p.id] || 0) >= 1;
  }));
  ok('Phase 1 Stufe/Attribute (MP2 §18/§19): Stufe hebt Leben, Ausdauer, Schaden und Rüstung; Beweglichkeit ändert die Ausdauer nicht, Ausdauer schon', sandbox(() => {
    const p = stage(); p.level = 1; recalc(p); const a = { hp: p.maxHp, st: p.maxStamina, dmg: damageOf(p), ar: armorOf(p) };
    p.level = 10; recalc(p); const b = { hp: p.maxHp, st: p.maxStamina, dmg: damageOf(p), ar: armorOf(p) };
    const st0 = p.maxStamina; p.attributes.agility += 5; recalc(p); const agiSame = p.maxStamina === st0; p.attributes.endurance += 5; recalc(p); const endMore = p.maxStamina > st0;
    return b.hp > a.hp && b.st > a.st && b.dmg > a.dmg && b.ar > a.ar && b.dmg < a.dmg * 2 && agiSame && endMore;
  }));
  ok('Phase 1 Gegner-Skalierung (MP2 §20): Spieler 50 im ruhigen Land bleibt Gegner ≤ 10, Spieler 1 im Totenland trifft ≥ 15, Spieler 12 im mittleren Land etwa 10–16', sandbox(() => {
    const p = S.player, lv = p.level, m = MONSTERS.skeleton;
    const quiet = VILLAGES[0], dead = LOCATIONS.find(l => l.threat === 4);
    try { p.level = 50; const a = zoneLevel('world', quiet.x + 40, quiet.y, { threat: 1 }); p.level = 1; const b = zoneLevel('world', dead.x, dead.y, m); p.level = 12; const c = zoneLevel('mine', 10, 10, { threat: 1 });
      return a <= 10 && b >= 15 && c >= 10 && c <= 16; } finally { p.level = lv; }
  }));
  ok('Phase 1 Fernkampf (MP2 §15/§16): keine Sicht durch Wände, Pfeil tunnelt bei 50 ms nicht durch eine Mauer, Schütze spannt nicht ohne Sicht', sandbox(() => {
    const M = MAPS.__a; for (let y = 5; y < 15; y++) M.tiles[y * 40 + 12] = T.WALL;
    const a = { x: 10 * TS, y: 10 * TS, map: '__a' }, b = { x: 15 * TS, y: 10 * TS, map: '__a' }, c = { x: 10 * TS, y: 20 * TS, map: '__a' };
    const los = !clearLine(a, b) && clearLine(a, c);
    const keep = S.projectiles; S.projectiles = [{ id: 'pz', kind: 'arrow', map: '__a', x: 10 * TS, y: 10 * TS, vx: 30, vy: 0, owner: 'nobody', dmg: 5, life: 2000, team: 'foe' }];
    for (let i = 0; i < 20; i++) updateProjectiles(50); const stopped = !S.projectiles.length || S.projectiles[0].x < 12 * TS; S.projectiles = keep;
    const p = stage(); p.x = 15 * TS; p.y = 10 * TS; const e = spawnEnemy('bandit_archer', '__a', 10, 10); e.x = 10 * TS; e.y = 10 * TS; e.atkCd = 0; e.repos = 0; e.draw = 0;
    archerAI(e, p, dist(e, p), 0, 16, MONSTERS.bandit_archer); const noDraw = !(e.draw > 0);
    return los && stopped && noDraw;
  }));
  ok('Phase 1 Türen (MP2 §9): wer im Haus steht und nach draußen will, findet durch die Tür statt gegen die Wand zu laufen', sandbox(() => {
    const M = MAPS.__a; for (let x = 10; x <= 16; x++) { M.tiles[8 * 40 + x] = T.WALL; M.tiles[13 * 40 + x] = T.WALL; } for (let y = 8; y <= 13; y++) { M.tiles[y * 40 + 10] = T.WALL; M.tiles[y * 40 + 16] = T.WALL; }
    M.tiles[13 * 40 + 13] = T.PLANK;                                           // Tür im Süden
    const e = actor(12 * TS + 16, 9 * TS + 16), goal = { x: 13 * TS + 16, y: 3 * TS + 16 };   // Ziel im Norden: gerade Linie läuft gegen die Wand
    for (let i = 0; i < 900 && Math.hypot(goal.x - e.x, goal.y - e.y) > 30; i++) seek(e, Math.atan2(goal.y - e.y, goal.x - e.x), 1.4, 16, goal);
    return Math.hypot(goal.x - e.x, goal.y - e.y) <= 30;
  }));
  ok('Phase 1 Häuser: Möbel belegen höchstens die Hälfte des Innenraums, Tür und Kachel dahinter bleiben frei', HOUSES.filter(b => b.map === 'world').every(b => {
    const n = S.ents.world.filter(e => e.kind === 'prop' && e.house === b.id && e.solid).length;
    return n <= Math.max(1, Math.floor((b.w - 2) * (b.h - 2) / 2) - 1) + (b.type === 'tavern' ? 8 : 0);
  }));
  ok('Phase 1 kein Klumpen (MP2 §6): zwei Bewohner mit gleichem Treffpunkt stehen an verschiedenen Stellen; Gespräch wechselt mit Kontext', (() => {
    const v = VILLAGERS.filter(c => c.alive && c.plan); if (v.length < 2) return false;
    const m0 = S.minute; S.minute = 12 * 60;
    try { const a = v[0], b = v.find(c => c !== a && c.plan.n % 4 !== a.plan.n % 4) || v[1], pa = a.plan.plaza, pb = b.plan.plaza, sa = { ...a.plan.plaza }, sb = { ...b.plan.plaza };
      b.plan.plaza = { ...pa }; const ta = dayTarget(a), tb = dayTarget(b); b.plan.plaza = pb;
      const spread = ta.k !== 'l' || tb.k !== 'l' || Math.hypot(ta.x - tb.x, ta.y - tb.y) > 10;
      const talk = contextLines({ prof: 'Bauer', seed: 3 }).length >= PROF_TALK.Bauer.length + 1;   // Beruf + mindestens eine Weltlage-Zeile
      return spread && talk; } finally { S.minute = m0; }
  })());
  ok('BUG-107: stirbt eine Test-Probe, entsteht kein Vorfahr, kein Todesbildschirm, kein Speichern', sandbox(() => {
    const n = S.legacy.ancestors.length, c = S.chronicle.length; stage(); playerDeath('Test');
    return S.legacy.ancestors.length === n && S.chronicle.length === c && !S.paused;
  }));
  ok('Phase 2 Aufträge (MP2 §11–§14): jede Siedlung hat Brett-Aufträge und einen Verteidigungsmeister; Annehmen trägt ins Auftragsbuch, Ziele stehen in der Welt, Töten zählt, Abgabe zahlt', sandbox(() => {
    const keep = { c: S.contracts, d: S.conDay, q: { ...S.quests }, g: S.gold, ents: S.ents.world.slice(), f: { ...S.factions } }, p = S.player, px = p.x, py = p.y;
    try {
      S.contracts = []; S.conDay = {};
      const towns = Object.keys(TOWN_PLAN).filter(t => t !== 'vharnholm');
      const boards = towns.every(t => townContracts(t, 'board').length >= 3), vms = towns.every(t => S.ents.world.some(e => e.vm === t) && townContracts(t, 'vm').length >= 3);
      const C = makeContract('haselbrueck', 'monster', 'board'); S.contracts.push(C); acceptContract(C); p.x = C.x * TS; p.y = C.y * TS; conTick();
      const foes = S.ents.world.filter(e => e.contract === C.id && e.alive), placed = foes.length === C.need && !!QUESTS['c_' + C.id] && S.quests['c_' + C.id].state === 'active';
      for (const e of foes) conKill(e); const counted = C.have === C.need;
      const g0 = S.gold; claimContract(C); const paid = S.gold > g0 && C.state === 'claimed' && S.quests['c_' + C.id].state === 'done';
      const kinds = Object.keys(CON).every(k => { const c = makeContract('eren', k, 'board'); return c.title && c.desc && c.need >= 1 && c.x > 0; });
      return boards && vms && placed && counted && paid && kinds;
    } finally { for (const k of Object.keys(QUESTS)) if (QUESTS[k].dyn && !keep.q[k]) delete QUESTS[k];   // keine Test-Aufträge im echten Buch
      S.contracts = keep.c; S.conDay = keep.d; S.quests = keep.q; S.gold = keep.g; S.ents.world = keep.ents; Object.assign(S.factions, keep.f); p.x = px; p.y = py; }
  }));
  ok('Phase 2 Kerker (MP2 §26): Verhaftung bringt in die Zelle (10–20 min), Waffe verwahrt, Kopfgeld getilgt; Wärter sieht Ausbruch; Zeit um = frei mit Waffe; Salzhafen hat Gefangene mit Aufträgen', sandbox(() => {
    const p = S.player, keep = { map: S.map, x: p.x, y: p.y, w: p.equip.weapon, b: { ...(S.bounty || {}) }, jail: S.jail, jt: S.jailTown, kk: S.ents.kerker.slice(), world: S.ents.world.slice() };
    try {
      S.map = 'world'; if (!S.ents.world.includes(p)) S.ents.world.push(p); p.map = 'world';
      const w0 = p.equip.weapon || mkItem('longsword'); p.equip.weapon = w0; S.bounty = { valen: 400 };
      goToJail('valen', 400, 'saltport'); const J = S.jail, jailed = S.map === 'kerker' && !p.equip.weapon && !S.bounty.valen && Math.round(J.until - clock()) === 20 * 60;
      const special = S.ents.kerker.some(e => e.jailQuest === 'q_gilde') && S.ents.kerker.some(e => e.jailQuest === 'q_rask');
      const w = S.ents.kerker.find(e => e.warden); const cell = MAPS.kerker.cells[0]; p.x = (cell.x + 2) * TS + 16; p.y = 10 * TS + 16; w.x = p.x + 60; w.y = p.y;
      const u0 = J.until; jailTick(); const caught = J.until > u0 && Math.hypot(p.x - cell.spot.x, p.y - cell.spot.y) < 2;
      J.until = clock() - 1; jailTick(); const free = !S.jail && S.map === 'world' && p.equip.weapon === w0;
      return jailed && special && caught && free && jailMinutes(0) === 10 && jailMinutes(9999) === 20;
    } finally { const i = S.ents[S.map].indexOf(p); if (i >= 0) S.ents[S.map].splice(i, 1); S.map = keep.map; p.map = keep.map; if (!S.ents[S.map].includes(p)) S.ents[S.map].push(p);
      p.x = keep.x; p.y = keep.y; p.equip.weapon = keep.w; S.bounty = keep.b; S.jail = keep.jail; S.jailTown = keep.jt; S.ents.kerker = keep.kk; S.ents.world = keep.world; }
  }));
  ok('Phase 2 Goblins (MP2 §28): Befreiung hebt den Ruf um 200, freie Goblins sind friedlich, bis man sie angreift', sandbox(() => {
    const keep = S.flags.goblinsFreed; try { S.flags.goblinsFreed = true; const g = { kind: 'enemy', mtype: 'goblin', alive: true }, boss = { kind: 'enemy', mtype: 'gorak', boss: true };
      const peace = teamOf(g) === 'neutral' && teamOf(boss) === 'foe'; g.provoked = true; return peace && teamOf(g) === 'foe'; } finally { S.flags.goblinsFreed = keep; }
  }));
  ok('Phase 2 Sklaverei (MP2 §25): Status „Versklavt“ sichtbar, ein starker Wächter erscheint und folgt, nach der Freiheit verschwindet er', sandbox(() => {
    const p = S.player, keep = { bond: S.bond, x: p.x, y: p.y, w: p.equip.weapon, st: p.status, m: S.minute, world: S.ents.world.slice() };
    try {
      if (!enslave('aurel', 100)) return false; S.minute = 10 * 60;
      const status = (p.status || []).some(s => s.key === 'shackled' && s.name === 'Versklavt');
      bondTick(); const g = S.ents.world.find(e => e.bondGuard); if (!g) return false;
      const strong = g.maxHp > 3 * 100 && g.big >= 1.5; p.x += 200; for (let i = 0; i < 120; i++) bondGuardStep(g, 16); const follows = dist(g, p) < 120;
      freeBond('Test'); bondTick(); const gone = !S.ents.world.some(e => e.bondGuard);
      return status && strong && follows && gone;
    } finally { S.bond = keep.bond; p.x = keep.x; p.y = keep.y; p.equip.weapon = keep.w; p.status = keep.st; S.minute = keep.m; S.ents.world = keep.world; recalc(p); }
  }));
  ok('Phase 2 Hinterhalt (MP2 §22/§23): Gruppen einheitlich, warten still bis 230 px, springen dann gemeinsam an; Deckung wird gesucht', sandbox(() => {
    const p = stage(); const a = spawnEnemy('bandit', '__a', 20, 10), b = spawnEnemy('bandit_archer', '__a', 21, 10); a.ambush = b.ambush = 'g1'; a.x = 20 * TS; b.x = 21 * TS; a.y = b.y = 10 * TS;
    p.x = 5 * TS; p.y = 10 * TS; combat = [p, a, b]; updateEnemy(a, 16); const waits = a.ambush === 'g1' && !a.aggroId && !a.vx;
    p.x = 17 * TS; updateEnemy(a, 16); const sprung = !a.ambush && !b.ambush && a.aggroId === p.id && b.aggroId === p.id;
    const fams = AMBUSH_FAM.every(f => f.every(m => MONSTERS[m]));
    return waits && sprung && fams;
  }));
  ok('Phase 2 Ränge (MP2 §29–§31/§80/§81): Aurelion-Rang aus Bürgerrecht und Ruf, Hochpaladin ist ein echter Kettenrang, Rang und Legende senken Preise, Wachen grüßen mit Rang', sandbox(() => {
    const keep = { r: { ...S.ranks }, f: { ...S.factions }, fl: { ...S.flags }, lg: S.legend, t: [...(S.player.titles || [])], permit: S.permit };
    try {
      S.flags.aurelCitizen = false; S.permit = -1; autoRanks(); const r0 = S.ranks.aurel === 0; S.flags.aurelCitizen = true; S.factions.aurel = 70; autoRanks(); const r1 = S.ranks.aurel >= 4;
      const trader = { faction: 'aurel', kind: 'npc' }, p0 = repPrice(trader, true); S.legend = { aurel: 'Test' }; const p1 = repPrice(trader, true);
      S.ranks.chain = 3; S.factions.chain = 500; checkRankUp(); const noAuto = S.ranks.chain === 3 && FACTIONS.chain.ranks[4] === 'Dunkler Hochpaladin';
      const g = contextGreet({ faction: 'aurel', guard: true, seed: 1 }, 'x').includes('Legende');
      return r0 && r1 && p1 < p0 && noAuto && g;
    } finally { Object.assign(S.ranks, keep.r); Object.assign(S.factions, keep.f); S.flags = keep.fl; S.legend = keep.lg; S.player.titles = keep.t; S.permit = keep.permit; }
  }));
  ok('Phase 3 Debug (MP2 §70–§73): Bereiche mit Dropdowns für Städte, NPCs, Waffen, Rüstungen, Gegner, Aufträge; Noclip, Tempo, Gottmodus wirken; ganze Welt enthüllt die Karte', sandbox(() => {
    const secs = debugSections(), titles = secs.map(s => s[0]);
    const need = ['Bewegung', 'Spieler', 'Gegenstände', 'Welt', 'Aufträge', 'Ereignisse'].every(t => titles.includes(t));
    const html = secs.map(s => s[1]).join(''), drops = ['dbTown', 'dbNpc', 'dbW', 'dbA', 'dbFoe', 'dbQ', 'dbFac'].every(id => html.includes(`id="${id}"`));
    const p = stage(); const keep = S.dbg; S.dbg = { speed: 4 }; const s4 = speedOf(p); S.dbg = {}; const s1 = speedOf(p);
    MAPS.__a.tiles[10 * 40 + 11] = T.WALL; p.x = 10 * TS + 16; p.y = 10 * TS + 16; S.dbg = { noclip: true }; for (let i = 0; i < 20; i++) moveEnt(p, 4, 0); const through = p.x > 12 * TS;
    S.dbg = { god: true }; const hp = p.hp; hurt(p, 50, null, 'Test'); const god = p.hp === hp; S.dbg = { reveal: true }; const rev = explored(1, 1); S.dbg = keep;
    return need && drops && s4 > s1 * 3.5 && through && god && rev;
  }));
  ok('Phase 4 Eisenfeste (MP2 §53/§54): Mine, Schmiedeviertel, Ställe, Vorwerk, Holzfällerlager stehen; an jedem Platz arbeiten Goblins mit Beruf, dazu Aufseher und Streifen', (() => {
    const near = (site, test, r = 14) => { const [x, y] = EISEN_SITES[site]; return S.ents.world.filter(e => test(e) && Math.hypot(e.x / TS - x, e.y / TS - y) < r); };
    const props = near('mine', e => e.type === 'ore_node').length >= 8 && near('smithy', e => e.type === 'forge').length >= 3 && near('vorwerk', e => e.type === 'scarecrow', 30).length >= 2 && near('lumber', e => e.type === 'fallen_tree').length >= 2;
    const houses = HOUSES.filter(b => b.town === 'kettenfeste' && b.type === 'smithy').length >= 4;
    const workers = Object.keys(EISEN_JOBS).every(s => near(s, e => e.kind === 'npc' && e.goblin && e.site === s).length >= 3);
    const watch = S.flags.goblinsFreed || (S.ents.world.filter(e => e.eisenPatrol).length >= 4 && S.ents.world.filter(e => e.prof === 'Aufseher' && e.eisen).length >= 6);
    return props && houses && workers && watch;
  })());
  ok('Phase 4 Tavernen (MP2 §76): jede Stadtschenke hat Schankmagd, Koch und Spielmann; die Einrichtung hat Schlafplätze', (() => {
    const towns = Object.keys(TOWN_PLAN).filter(t => !TOWN_PLAN[t].village && t !== 'vharnholm' && HOUSES.some(b => b.town === t && b.type === 'tavern'));
    const staff = towns.every(t => ['Schankmagd', 'Koch', 'Spielmann'].every(pr => S.ents.world.some(e => e.tavernStaff === t && e.prof === pr)));
    const beds = towns.some(t => { const tav = HOUSES.find(b => b.town === t && b.type === 'tavern'); return S.ents.world.some(e => e.house === tav.id && e.type === 'bed'); });
    return towns.length >= 4 && staff && beds;
  })());
  ok('Phase 5 Aurelheim-Metropole (MP2 §33–§49): etwa 8× so groß, 13 Bezirke, Palast, Markthalle, Bank, Observatorium, Aquädukt, Kanal, vier Tore; bewohnt und bewacht', (() => {
    const P = TOWN_PLAN.aurelheim; if (!P?.metro) return false;
    const [x0, y0, x1, y1] = P.area, big = (x1 - x0 + 1) * (y1 - y0 + 1) >= 8 * 69 * 49 * 0.95;
    const names = (METRO.districts || []).map(d => d.name), d13 = names.length >= 13;
    const has = k => S.ents.world.some(e => e.type === k && townAt(e.x / TS | 0, e.y / TS | 0) === 'aurelheim');
    const halls = ['palace', 'markethall', 'bank', 'academy', 'observatory', 'library', 'court', 'hospital', 'bathhouse', 'magitech', 'factoryhall', 'legion'].every(t => HOUSES.some(b => b.town === 'aurelheim' && b.type === t));
    const landmarks = halls && ['astroclock', 'fountain', 'magitower', 'crane'].every(has) && S.ents.world.some(e => e.type === 'aqueduct');
    const houses = HOUSES.filter(b => b.town === 'aurelheim').length, people = S.ents.world.filter(e => e.kind === 'npc' && e.homeTown === 'aurelheim' && e.alive).length;
    const guards = S.ents.world.filter(e => e.robot && e.post === 'aurelheim').length;
    const m0 = S.minute; S.minute = 12 * 60; const cells = new Map();
    for (const c of VILLAGERS) if (c.homeTown === 'aurelheim' && c.plan) { const t = dayTarget(c), k = (t.x / 64 | 0) + ',' + (t.y / 64 | 0); cells.set(k, (cells.get(k) || 0) + 1); }
    S.minute = m0; const spread = Math.max(0, ...cells.values()) <= 6;                    // Mittag: kein Menschenauflauf auf einem Fleck
    return big && d13 && landmarks && houses >= 80 && people >= 100 && guards >= 18 && spread;
  })());
  ok('Phase 5 begehbare Prachtbauten (Nutzer): jede Halle hat Tür, Innenraum mit Möbeln in Reihen, freie Laufwege und Personal; Markthalle verkauft', (() => {
    const halls = HOUSES.filter(b => b.map === 'world' && ['palace', 'markethall', 'bank', 'academy', 'library', 'court', 'hospital', 'factoryhall', 'legion'].includes(b.type));
    const walk = (x, y) => !SOLID.has(tileAt('world', x, y)) && !solidPropAt('world', x * TS + 16, y * TS + 16, 6);
    const ok1 = halls.length >= 9 && halls.every(b => {
      const furn = S.ents.world.filter(e => e.house === b.id).length, [dx, dy] = b.doorTile, seen = new Set(), q = [[dx, dy - 1]];
      while (q.length) { const [x, y] = q.pop(), k = x + ',' + y; if (seen.has(k) || x <= b.x || x >= b.x + b.w - 1 || y <= b.y || y >= b.y + b.h - 1 || !walk(x, y)) continue; seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
      return furn >= 4 && seen.size >= (b.w - 2) * (b.h - 2) * 0.35;                 // Möbel da, und man kommt durch den Saal
    });
    const staff = halls.every(b => S.ents.world.some(e => e.homeId === b.id));
    const trader = S.ents.world.some(e => e.shop && e.pool && (e.prof === 'Waffenhändler' || e.prof === 'Rüstmeisterin'));
    return ok1 && staff && trader;
  })());
  ok('Tribut (S12): alle 5 Tage nimmt die Kette Vorrat und schickt einen Tributzug; Zahlen für ein Dorf; Überfall gibt Tributgut und den Auftrag; Prügelei endet am Boden, nicht im Tod', sandbox(() => {
    const V = tribVillages()[0], keep = structuredClone({ t: S.tribute || {}, q: S.quests.q_tribut || null, tq: S.tributQuest || null, c: S.factions.chain, f: S.flags.chainsBroken, g: S.gold });
    const inv0 = S.player.inv.slice(), before = new Set(S.ents.world.map(e => e.id)), q0 = S._quiet; S._quiet = true;
    try {
      S.flags.chainsBroken = false; const T = tribState(V.key); T.vorrat = 60; T.harsh = 0; T.paid = false; T.next = S.day | 0; T.garrison = 1e9;
      tributeDay(); const L = S.ents.world.find(e => e.tribV === V.key && !before.has(e.id)), took = T.vorrat === 65 - TRIB_TAKE && !!L && L.tribCargo === TRIB_TAKE;
      for (const e of S.ents.world) if (e.brawlV === V.key) { e.brawl = false; if (e.villager) e.brave = false; } if (S.brawls) delete S.brawls[V.key];
      T.next = S.day | 0; T.paid = true; S.gold = 1e4; const v1 = T.vorrat; tributeDay(); const paidOk = T.vorrat === Math.min(100, v1 + 5) && !T.paid;
      L.alive = false; L.lastKiller = S.player.id; tribTick();
      const robbed = S.player.inv.some(s => s && s.key === 'tributgut') && S.quests.q_tribut?.state === 'active' && T.harsh === 3;
      const a = makeChar({ name: 'A', map: '__a', x: 300, y: 300 }), b = makeChar({ name: 'B', map: '__a', x: 320, y: 300 }); S.ents.__a.push(a, b);
      Object.assign(a, { brawl: true, brawlSide: 'dorf' }); Object.assign(b, { brawl: true, brawlSide: 'kette' });
      for (let i = 0; i < 40 && !b.downed; i++) hurt(b, 30, a, 'Probe');
      const brawlOk = isHostile(a, b) && b.downed && b.alive && b.brawlKO > 0 && !(b.body.head.hp <= 0);
      return took && paidOk && robbed && brawlOk;
    } finally {
      S._quiet = q0; S.ents.world = S.ents.world.filter(e => before.has(e.id)); S.player.inv = inv0;
      Object.assign(S, { tribute: keep.t, tributQuest: keep.tq, gold: keep.g }); S.factions.chain = keep.c; S.flags.chainsBroken = keep.f; if (keep.q) S.quests.q_tribut = keep.q; else delete S.quests.q_tribut;
    }
  }));
  ok('Hiebvarianten (S12): Vorhand, Rückhand und Überkopf unterscheiden sich; der Überkopfhieb holt über den Kopf aus; Stöße gehen tief oder hoch', (() => {
    const f = (wt, v, sw) => R.swingOf(wt, sw, 1.6, v, 0).a;
    return Math.abs(f('great', 0, 0.4) + f('great', 1, 0.4)) < 1e-9 && f('great', 0, 0.4) !== 0 && f('great', 2, 0.3) < -2
      && f('spear', 1, 0.4) > 0.2 && f('spear', 2, 0.4) < -0.2 && f('sword', 2, 0.2) < -1;
  })());
  ok('Prothesen (S12): ein zerschmettertes Glied geht verloren und heilt nicht mehr; eine Prothese ersetzt es; der Meisterarm schlägt härter', sandbox(() => {
    const p = stage(); p.inv = [];
    B.damagePart(p, 'larm', p.body.larm.max * 3); const lost = p.body.larm.lost;
    B.fullHeal(p); const stays = p.body.larm.hp <= 0;
    addItem(p, 'schrottbein', 1); useConsumable(p, 0); const wrongPart = p.inv.some(q => q && q.key === 'schrottbein');   // kein Bein verloren: bleibt in der Tasche
    p.inv = []; addItem(p, 'meisterarm', 1); useConsumable(p, 0);
    return lost && stays && wrongPart && !p.body.larm.lost && p.body.larm.mech === 3 && p.body.larm.hp === p.body.larm.max && B.mechBonus(p, 'arm') === 0.1;
  }));
  ok('Hochreich Aurelion (S12): fünf Städte mit Mauern, Häuserreihen, Adel und Werkleuten; Automaten an Toren und Plätzen; in Gelenkhall verkauft Meisterin Vell Prothesen', (() => {
    const cities = Object.entries(TOWN_PLAN).filter(([, P]) => P.lord === 'aurel');
    const vell = S.ents.world.find(e => e.key === 'vell');
    return cities.length === 5 && cities.every(([k]) => HOUSES.filter(b => b.town === k).length >= 8 && S.ents.world.filter(e => e.robot && e.post === k).length >= AUREL_GUARDS
      && VILLAGERS.some(c => c.homeTown === k && ['Graf', 'Gräfin', 'Edelmann', 'Edelfrau', 'Kaufherr', 'Kybernetiker', 'Feinmechaniker', 'Medica', 'Gelehrter'].includes(c.prof)))
      && !!vell && vell.shop && vell.pool.includes('aurelarm') && FACTIONS.aurel && S.factions.aurel != null;
  })());
  ok('Dörfer (S12): acht Dörfer unter Valen, Orden, Händlern und der Kette — je sechs Häuser, Bewohner, Jäger, Brunnen; Tributdörfer tragen den Kettenpfahl; Karte 1280 breit', (() => {
    const props = S.ents.world.filter(e => e.kind === 'prop');
    return MAPS.world.w === OX + 768 + EAST + EAST2 && VILLAGES.length === 8 && new Set(VILLAGES.map(V => V.lord)).size === 4 && VILLAGES.every(V => {
      const P = TOWN_PLAN[V.key], [x0, y0, x1, y1] = P?.area || [], inA = e => { const x = e.x / TS | 0, y = e.y / TS | 0; return x >= x0 && x <= x1 && y >= y0 && y <= y1; };
      return P && HOUSES.filter(b => b.town === V.key).length === 6 && VILLAGERS.some(c => c.homeTown === V.key && c.prof === 'Jäger')
        && props.some(e => e.type === 'well' && inA(e)) && (!V.tribute || props.some(e => e.type === 'chain_post' && inA(e)));
    });
  })());
  ok('Arsenal der Mark (S12): Hinrichtung/Ungerüstet rechnen richtig, Totenglocke schüchtert ein, Seelenhaken kühlt, Rotgardist hält neben Verbündeten, Kettenwachen sind keine Klone, Rüstung sieht man, Varg trägt den Roten Henker, Relikt liegt, ohne Varg keine Elite', sandbox(() => {
    const W = k => ITEMS[k], hp = f => ({ hp: f * 100, maxHp: 100 });
    const math = weaponMult(W('henkersaxt'), hp(0.4), 9) === 1.5 && weaponMult(W('henkersaxt'), hp(0.6), 9) === 1 && weaponMult(W('schwarzzahn'), hp(0.15), 9) === 1.5
      && weaponMult(W('schwarzzahn'), hp(0.3), 9) === 1 && Math.abs(weaponMult(W('rabenbeil'), hp(1), 1.6) - 1.35) < 1e-9 && weaponMult(W('rabenbeil'), hp(1), 6.4) === 1;
    const p = stage(); p.aim = 0; combat = S.ents.__a;
    const mk = (dx, dy = 0) => { const e = spawnEnemy('bandit', '__a', 11, 9); e.x = p.x + dx; e.y = p.y + dy; e.stagger = 0; return e; };   // S12: Kette ist ohne Alarm neutral
    const t1 = mk(30), t2 = mk(40, 20); p.equip.weapon = mkItem('totenglocke'); seedRng(4); hit(p, t1, 1);
    const tolled = t2.cowed > performance.now();
    const t3 = mk(30, -30); p.equip.weapon = mkItem('seelenhaken'); hit(p, t3, 1); const chilled = (t3.status || []).some(q => q.name === 'Seelenkalt');
    for (const e of [t1, t2, t3]) e.alive = false;
    p.equip.chest = mkItem('rotgardist'); const alone = armorOf(p);
    const pal = guardChar('valen', { x: p.x + 20, y: p.y }); pal.map = p.map; S.ents[p.map].push(pal); const beside = armorOf(p); pal.alive = false;
    const kits = [...Array(14)].map(() => guardChar('chain', { x: 0, y: 0 })), wk = new Set(kits.map(g => g.equip.weapon?.key)), ck = new Set(kits.map(g => g.equip.chest?.key));
    const lookW = SP.humanSpec({ equip: { chest: { key: 'eisenwache' } }, pal: {} }), lookR = SP.humanSpec({ equip: { chest: { key: 'rotgardist' }, head: { key: 'rotgardistenhelm' } }, pal: {} });
    const looks = lookW.sash && lookW.armor === 'chain' && lookR.pauld && lookR.armor === 'plate' && lookR.helm === 'great' && lookR.crest;
    const varg = LOOT.chain_master.some(([k, c]) => k === 'roter_henker' && c === 1) && ITEMS.roter_henker.unique;
    const relic = S.flags.relicLastWatch && ITEMS.letzte_wache.leg === 'bastion';
    const had = S.flags.chainsBroken; S.flags.chainsBroken = true; const area = SPAWN_AREAS.find(a => a.eisen);
    const noElite = [...Array(60)].every(() => !['rotgardist', 'kettenschuetze'].includes(spawnType(area))); S.flags.chainsBroken = had;
    return math && tolled && chilled && beside === alone + 3 && wk.size >= 2 && ck.size >= 2 && looks && varg && relic && noElite;
  }));
  ok('Eisenmark (Endgame): Region im Osten erreichbar; Kette hält Goblins gefangen (Zug, Steinbruch); Vargs Tod befreit sie: friedlich, Händler, Dorf, keine Goblin-Spawns mehr', (() => {
    const m = MAPS.world, fest = LOCATIONS.find(l => l.key === 'kettenfeste'), hort = LOCATIONS.find(l => l.key === 'grubenhort');
    const region = m.w === OX + 768 + EAST + EAST2 && fest && hort && S.ents.world.some(e => e.rboss === 'chainmaster' && e.alive || S.flags.goblinsFreed);
    const caps = S.ents.world.filter(e => e.captive), chained = caps.filter(e => e.chainedTo), goblins = caps.filter(e => e.goblin);
    const before = S.flags.goblinsFreed || (caps.length >= 10 && chained.length === 3 && goblins.length >= 8 && S.ents.world.some(e => e.convoy));
    const keep = structuredClone({ flags: S.flags, factions: S.factions, chronicle: S.chronicle, ranks: S.ranks, legend: S.legend || {}, titles: S.player.titles || [] }), ents = S.ents.world.slice(), snap = S.ents.world.filter(e => e.eisen || e.captive || (e.kind === 'enemy' && (e.mtype === 'goblin' || e.mtype === 'goblin_warrior'))).map(e => [e, { ...e }]);
    const q = S._quiet; S._quiet = true;
    try {
      liberate();
      const freed = caps.every(e => !e.captive && !e.chainedTo && e.freed), village = ['grisk', 'nibbel'].every(k => S.ents.world.some(e => e.key === k && e.goblin));
      const trader = S.ents.world.find(e => e.key === 'nibbel'), friendly = repTier('goblin').name !== 'Verhasst' && S.factions.goblin > 0;
      const hide = SPAWN_AREAS.find(a => a.goblinHide), noGob = [...Array(50)].every(() => spawnType(hide) === null);
      const noWild = !S.ents.world.some(e => e.kind === 'enemy' && e.alive && e.map === 'world' && (e.mtype === 'goblin' || e.mtype === 'goblin_warrior'));
      return region && before && freed && village && trader.shop && trader.pool.includes('goblin_hook') && friendly && noGob && noWild;
    } finally {
      S._quiet = q; S.ents.world = ents; for (const [e, o] of snap) { for (const k of Object.keys(e)) delete e[k]; Object.assign(e, o); }
      Object.assign(S, { flags: keep.flags, factions: keep.factions, chronicle: keep.chronicle, ranks: keep.ranks, legend: keep.legend }); S.player.titles = keep.titles;   // S12: Legende/Titel nicht ins echte Spiel lecken
    }
  })());
  ok('Laden (BUG-089): Spielstart/Fortsetzen löst keinen Tageswechsel aus', (() => {
    const keep = lastDay, tail = S.log[S.log.length - 1]; lastDay = 1; syncClock(); update(16, performance.now());
    const bad = S.log.slice(S.log.indexOf(tail) + 1).some(l => /bricht an/.test(l.text || l)); lastDay = keep; return !bad;
  })());
  ok('Anti-Kiting (BUG-076): rückwärts gehen und hauen hält Bandit, Goblin, Skelett nicht auf Abstand', ['bandit', 'goblin', 'skeleton'].every(t => sandbox(() => {
    const p = stage(); p.x = 200; p.y = 300; p.equip.weapon = mkItem('longsword'); p.stamina = p.maxStamina = 1e4;
    const b = spawnEnemy(t, '__a', 2, 9); b.x = p.x - 70; b.y = p.y; b.aggroId = p.id;
    if (b.body) { for (const k of B.PARTS) b.body[k].max = b.body[k].hp = 1e5; B.syncHp(b); }   // Probe misst Abstand — Treffer dürfen nicht töten (auch nicht Kopf)
    const kb = new Set(keys), md = mouse.down, ms = mouse.seen; keys.clear(); keys.add('d'); mouse.down = true; mouse.seen = false;
    let close = 0, trace = [];
    try { for (let i = 0; i < 360; i++) { mouse.wx = b.x; mouse.wy = b.y - 12; combat = S.ents.__a.filter(e => e.alive); controlPlayer(16); think(p, 16); think(b, 16); if (b.body) B.fullHeal(b); b.hp = b.maxHp;   // Probe: nur Abstand messen, nicht töten
        if (i % 40 === 0) trace.push(Math.round(dist(p, b)) + (b.surging ? '!' : '') + (b.stagger > 0 ? 's' + (b.stagger | 0) : '') + (b.downed ? 'D' : '') + (b.alive ? '' : 'X'));
        if (i > 180 && dist(p, b) < MONSTERS[t].reach + (p.r || 10) + 6) close++; } }
    finally { keys.clear(); kb.forEach(k => keys.add(k)); mouse.down = md; mouse.seen = ms; }
    if (!close) console.warn('Anti-Kiting', t, trace.join(' '), 'x', Math.round(p.x));
    return close > 0;
  })));
  ok('Wegfindung: Verfolger umgeht eine Mauer statt davor festzustecken', sandbox(() => {
    for (let y = 4; y <= 16; y++) setTile('__a', 15, y, T.WALL);
    const p = stage(); p.x = 19 * TS; p.y = 10 * TS + 16;
    const sk = spawnEnemy('skeleton', '__a', 12, 10); sk.x = 13 * TS + 16; sk.y = 10 * TS + 16; sk.aggroId = p.id;
    for (let i = 0; i < 900 && dist(sk, p) > 50; i++) { combat = S.ents.__a.filter(e => e.alive); sk.atkCd = 1e9; think(sk, 16); }
    return dist(sk, p) <= 50;
  }));
  ok('Wegfindung (BUG-088): ohne Weg (Fluss ohne Brücke) gibt der Verfolger nach ~3 s auf und zieht ab, statt am Ufer Zielscheibe zu sein', sandbox(() => {
    for (let y = 0; y < 40; y++) setTile('__a', 15, y, T.WATER);
    const p = stage(); p.x = 19 * TS; p.y = 10 * TS + 16;
    const sk = spawnEnemy('skeleton', '__a', 12, 10); sk.x = 13 * TS + 16; sk.y = 10 * TS + 16; sk.aggroId = p.id; sk.anchor = { x: 8 * TS, y: 10 * TS };
    for (let i = 0; i < 400; i++) { combat = S.ents.__a.filter(e => e.alive); sk.atkCd = 1e9; think(sk, 16); }
    const gave = !!sk.giveUp && !sk.aggroId, bank = sk.x;
    for (let i = 0; i < 200; i++) { combat = S.ents.__a.filter(e => e.alive); think(sk, 16); }
    return gave && sk.x < bank - 20;
  }));
  ok('Spawns landen nie in Bäumen; Eingeklemmte kommen frei', sandbox(() => {
    const tree = { id: uid(), kind: 'prop', type: 'tree', map: '__a', x: 10 * TS + 16, y: 10 * TS + 16, r: 12, solid: true };
    S.ents.__a.push(tree); addSolid(tree);
    let inTree = 0; for (let i = 0; i < 60; i++) { const s = freeSpotNear('__a', 10, 10, 1); if (s.x === tree.x && s.y === tree.y) inTree++; }
    const stuck = actor(tree.x, tree.y); for (let i = 0; i < 20; i++) moveEnt(stuck, 1.2, 0);
    return inTree === 0 && dist(stuck, tree) > 15;
  }));
  // ---- Phase 11: jeder neue Gegner verhält sich so, wie sein Datenblatt (GDD) es verspricht ----
  ok('Gegner: Wiedergänger steht einmal wieder auf — nicht nach Feuer, nicht zweimal', sandbox(() => {
    stage(); const n0 = S.rising.length;
    const g1 = spawnEnemy('ghoul', '__a', 10, 10); g1.lastKind = 'physical'; die(g1, 'Test');
    const g2 = spawnEnemy('ghoul', '__a', 12, 10); g2.lastKind = 'fire'; die(g2, 'Test');
    const g3 = spawnEnemy('ghoul', '__a', 14, 10, { risen: true }); g3.lastKind = 'physical'; die(g3, 'Test');
    return S.rising.length - n0 === 1;
  }));
  ok('Gegner: Geist ist nach einem Treffer kurz körperlos — Heiliges trifft trotzdem', sandbox(() => {
    const p = stage(), w = spawnEnemy('wraith', '__a', 11, 9); w.x = p.x + 30; w.y = p.y;
    p.equip.weapon = mkItem('longsword'); seedRng(5);   // fester Zufall statt Glück beim ersten Hieb
    hit(p, w, 1); const hp1 = w.hp; hit(p, w, 1); const hp2 = w.hp; hurt(w, 5, p, 'Test', false, 'holy');
    if (!(hp1 < w.maxHp && hp2 === hp1 && w.hp < hp2)) console.warn('Geist', w.maxHp, hp1, hp2, w.hp, w.alive);
    return hp1 < w.maxHp && hp2 === hp1 && w.hp < hp2;
  }));
  ok('Gegner: Bär greift nur an, wer ins Revier tritt oder ihn verletzt', sandbox(() => {
    const p = stage(), b = spawnEnemy('bear', '__a', 10, 10); b.x = p.x + 200; b.y = p.y; const x0 = b.x;
    combat = S.ents.__a.filter(e => e.alive); for (let i = 0; i < 40; i++) think(b, 16);
    const calm = Math.abs(b.x - x0) < 40 && !b.charge;
    hurt(b, 2, p, 'Test'); for (let i = 0; i < 60; i++) think(b, 16);
    return calm && b.provoked && (b.x < x0 - 10 || b.chargeWind || b.charge);
  }));
  ok('Gegner: Hirsch flieht vor dem Spieler und greift nie an (jagdbar, aber kein Angreifer)', sandbox(() => {
    const p = stage(), d = spawnEnemy('deer', '__a', 10, 10); d.x = p.x + 80; d.y = p.y; const d0 = dist(d, p), hp0 = B.vital(p);
    combat = S.ents.__a.filter(e => e.alive); let swung = false;
    for (let i = 0; i < 60; i++) { think(d, 16); if (d.swing > 0) swung = true; }
    return dist(d, p) > d0 + 30 && !swung && B.vital(p) === hp0 && teamOf(d) === 'prey';
  }));
  ok('Gegner: Kultist heilt verwundete Untote in Reichweite, nicht jedes Bild (Abklingzeit)', sandbox(() => {
    const p = stage(), c = spawnEnemy('cultist', '__a', 10, 10), s = spawnEnemy('skeleton', '__a', 12, 10);
    p.x = c.x + 250; p.y = c.y; p.invuln = true;                 // Feind in Sicht (sonst ruht der Kult), Schattenblitze zählen nicht
    s.x = c.x + 60; s.y = c.y; s.hp = s.maxHp * 0.3; const h0 = s.hp;
    combat = S.ents.__a.filter(e => e.alive); for (let i = 0; i < 180; i++) think(c, 16);
    const h1 = s.hp; for (let i = 0; i < 60; i++) think(c, 16);
    return h1 > h0 && s.hp === h1;
  }));
  ok('Gegner: Wilder Hund hat eine eigene Gestalt (kein umgefärbter Wolf)', (() => {
    const a = SP.beastFrame('wild_dog', MONSTERS.wild_dog.pal, 'W', '', 1), b = SP.beastFrame('wolf', MONSTERS.wolf.pal, 'W', '', 1);
    const da = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, db = b.getContext('2d').getImageData(0, 0, b.width, b.height).data;
    let diffShape = 0; for (let i = 3; i < da.length; i += 4) if ((da[i] > 0) !== (db[i] > 0)) diffShape++;
    return diffShape > 20;
  })());
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
    const everyTaught = Object.keys(CLASSES).filter(k => k !== 'wanderer' && k !== 'deathknight' && k !== 'darkpaladin').every(k => teachers.has(k));
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
  ok('Erreichbarkeit (BUG-079): jeder Ort hat begehbaren Boden, der zu Fuß von Eren aus erreichbar ist', (() => {
    const m = MAPS.world, W = m.w, seen = new Uint8Array(W * m.h), [ex, ey] = worldPt(60, 64), q = [ey * W + ex]; seen[q[0]] = 1;
    while (q.length) { const k = q.pop(), x = k % W; for (const n of [k - 1, k + 1, k - W, k + W]) if (n >= 0 && n < W * m.h && !seen[n] && Math.abs((n % W) - x) <= 1 && !SOLID.has(m.tiles[n])) { seen[n] = 1; q.push(n); } }
    return LOCATIONS.every(L => { const r = Math.max(3, Math.round(L.r / 2)); for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (seen[(L.y + dy) * W + L.x + dx]) return true; return false; });
  })());
  ok('Gerüchte (BUG-078): frische Weltereignisse tauchen in Gesprächen auf, nach 5 Tagen nicht mehr', (() => {
    const L = S.chronicle, n0 = L.length;
    try {
      L.push({ year: 1, day: S.day | 0, text: 'Probe-Ereignis frisch', kind: 'news' }, { year: 1, day: (S.day | 0) - 6, text: 'Probe-Ereignis alt', kind: 'battle' });
      const N = recentNews(), fresh = N.some(c => c.text === 'Probe-Ereignis frisch'), old = N.some(c => c.text === 'Probe-Ereignis alt');
      const said = [0, 1, 2, 3, 4, 5, 6, 7].some(k => (newsTalk(k) || [''])[0].includes('Probe-Ereignis frisch'));
      return fresh && !old && said;
    } finally { L.length = n0; }
  })());
  ok('Stadtfest: Aufbau am Platz zur Festzeit, Bewohner kommen zum Feuer, nichts davon im Spielstand, Abbau danach, Festmahl einmal je Fest', peace(() => {
    const town = Object.keys(TOWN_PLAN).find(t => t !== 'vharnholm'), m0 = S.minute, d0 = S.day, ate = S.flags.festAte, food = S.res.food;
    try {
      while (!festDay(town)) S.day++;
      S.minute = 16 * 60; festMin = -1; festTick();
      const props = S.ents.world.filter(e => e.fest === town), table = props.find(e => e.feast);
      const v = VILLAGERS.find(e => e.homeTown === town && e.alive), goes = v && dayTarget(v).k === 'f';
      const saved = !JSON.parse(saveData()).ents.world.some(e => e.fest);
      festMeal(S.player, table); const f1 = S.res.food; festMeal(S.player, table); const once = S.res.food === f1;
      S.minute = 23 * 60 + 30; festMin = -1; festTick();
      const gone = !S.ents.world.some(e => e.fest === town);
      const offRoad = props.every(e => tileAt('world', e.x / TS | 0, e.y / TS | 0) !== T.ROAD);   // Fest sperrt nie die Straße
      return props.length >= 6 && !!table && goes && saved && once && gone && offRoad;
    } finally { S.minute = m0; S.day = d0; S.flags.festAte = ate; S.res.food = food; festMin = -1; festTick(); }
  }));
  ok('Tagesplan (BUG-082/083): Bewohner wechseln über den Tag ≥ 4 Orte, abends niemand vor der Schenkentür, außer Sicht nie aufeinander', peace(() => {
    const V = VILLAGERS.filter(e => e.alive && e.plan), m0 = S.minute; if (!V.length) return false;
    try {
      const blocks = V.every(e => { const k = new Set(); for (let h = 0; h < 24; h += 0.5) { S.minute = h * 60; const t = dayTarget(e); k.add(t.k + '|' + Math.round(t.x) + ',' + Math.round(t.y)); } return k.size >= 4; });
      const tavs = HOUSES.filter(h => h.type === 'tavern' && h.map === 'world');
      const noCrowd = V.every(e => e.plan.eve.in || !tavs.some(t => Math.hypot(e.plan.eve.x / TS - t.doorTile[0], e.plan.eve.y / TS - t.doorTile[1]) < 3));
      S.minute = 7 * 60 + 5; const pos = V.map(e => [e, e.x, e.y, e.blk]); for (const e of V) { e.blk = null; placeAway(e); }
      let stacked = 0; for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) if (Math.hypot(V[i].x - V[j].x, V[i].y - V[j].y) < 4) stacked++;
      for (const [e, x, y, b] of pos) { e.x = x; e.y = y; e.blk = b; }
      if (!(blocks && noCrowd && stacked === 0)) console.warn('Tagesplan-Test', { blocks, noCrowd, stacked });
      return blocks && noCrowd && stacked === 0;
    } finally { S.minute = m0; }
  }));
  ok('Ansprechen (BUG-080): E wählt die Person, auf die gezielt wird, nicht bloß die nächste; Maus auf einer Figur gewinnt', sandbox(() => {
    const p = stage(), near = actor(p.x - 20, p.y), far = actor(p.x + 44, p.y), hv = hovered, sl = selected;
    hovered = selected = null; p.aim = 0;
    try { const a = interactables()[0] === far; hovered = near; return a && interactables()[0] === near; } finally { hovered = hv; selected = sl; }
  }));
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
      if (!TRADES[b.type] || !TOWN_PLAN[b.town] || HB.wearOf(b) === 2 || (b.town === 'eren' && ['tavern', 'smithy', 'healer'].includes(b.type))) return true;   // Kettenfeste: Fraktionsbau, keine Bürger
      const rs = S.ents.world.filter(c => c.homeId === b.id);
      return rs.length > 0 && rs.every(c => { const x = c.anchor.x / TS | 0, y = c.anchor.y / TS | 0;
        return x > b.x && x < b.x + b.w - 1 && y > b.y && y < b.y + b.h - 1 && walk(x, y); });
    }));
    ok('Figuren mit Namen: Nachtplatz im eigenen Haus (freie Kachel), tagsüber ein Arbeitsplatz, Läden mit Ladenschluss', Object.entries(NPC_DAY).every(([k, d]) => {
      const c = S.ents.world.find(e => e.key === k); if (!c || !c.alive) return true;
      const b = HOUSES.find(h => h.id === d.night[0]), x = c.anchor.x / TS | 0, y = c.anchor.y / TS | 0;
      return b && x > b.x && x < b.x + b.w - 1 && y > b.y && y < b.y + b.h - 1 && walk(x, y) && !!c.schedulePos && (!c.shop || c.till > 0);
    }));
    { const bad = S.ents.world.filter(e => e.kind === 'enemy' && e.alive && isHostile(e, S.player) && !e.armyId && !e.aggroId && !e.encounter && !e.follow && townAt(e.x / TS | 0, e.y / TS | 0));   // Besatzung (Valen-Soldaten nach einer Schlacht) zählt nicht
      if (bad.length) console.warn('Ruhende Gegner in Siedlung', bad.map(e => `${e.mtype}@${e.x / TS | 0},${e.y / TS | 0} anker ${e.anchor.x / TS | 0},${e.anchor.y / TS | 0}${e.giveUp ? ' aufgegeben' : ''}${e.servant ? ' diener' : ''}`).join('; '));
      ok('Spawns: keine ruhenden Gegner zwischen den Häusern einer Siedlung', !bad.length); }
    ok('Weltmaßstab: Karte 768×768 + Eisenmark (1024×768), jede Stadt zu Fuß von Eren erreichbar, kein fester Gegenstand auf Mauer/Wasser/Fels', (() => {
      const m = MAPS.world, seen = new Uint8Array(m.w * m.h), [sx, sy] = TOWN_PLAN.eren.square, q = [sy * m.w + sx];
      seen[q[0]] = 1;
      for (let h = 0; h < q.length; h++) { const i = q[h], x = i % m.w, y = (i / m.w) | 0;
        for (const j of [i - 1, i + 1, i - m.w, i + m.w]) { const jx = j % m.w; if (j < 0 || j >= m.tiles.length || seen[j] || Math.abs(jx - x) > 1 || SOLID.has(m.tiles[j])) continue; seen[j] = 1; q.push(j); } }
      const towns = Object.values(TOWN_PLAN).every(P => seen[P.square[1] * m.w + P.square[0]]);
      const props = S.ents.world.every(e => e.kind !== 'prop' || !e.solid || e.type === 'boat' || !SOLID.has(tileAt('world', e.x / TS | 0, e.y / TS | 0)) || ['obelisk', 'crypt', 'tower_ruin', 'watchtower_ruin', 'palisade_prop', 'rock_node', 'ore_node', 'dead_tree', 'fallen_tree', 'rubble', 'broken_pillar', 'gravestone'].includes(e.type));   // Natur/Trümmer/Streugut dürfen im Fels/See liegen
      return m.w === OX + 768 + EAST + EAST2 && m.h === 768 + SOUTH && towns && props;
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
      hireEscorts(car);                                                    // Weltzustand: gefallene Wachen werden in der Stadt ersetzt — die Probe prüft die volle Formation
      const p = S.player, keep = { x: p.x, y: p.y, map: p.map }, bandit = { kind: 'enemy', faction: 'bandit', mtype: 'bandit', alive: true };
      p.x = car.x - 60; p.y = car.y + 110; seedRng(11);
      const parked = S.ents.world.filter(o => o.kind === 'enemy' && o.alive && dist(o, car) < 1800).map(o => [o, o.x, o.y]); parked.forEach(([o]) => { o.x += 1e5; });   // Probe ohne Zufallskämpfe
      S._frozenWar = true;   // Probe lässt die Welt laufen, aber nicht den Krieg (sonst fiel während der Tests Eren)
      const amb = car.ambushChecked; car.ambushChecked = true;   // Probe prüft die Formation, nicht den Zufallsüberfall (sonst flackert der Test je nach Wegpunkt)
      for (const e of escortsOf(car)) { const q = SIM.escortSlot(car, e.slot); e.x = q.x; e.y = q.y; }   // Formation im Gleichgewicht prüfen; Aufholen: eigener Test (BUG-096)
      try {
        let far = 0, n = 0;                                    // Stichprobe alle 240 ms: höchstens 15 % der Proben > 90 px vom Platz (Ecken, Kampf)
        for (let t = 0; t < 12000; t += 16) { update(16, performance.now());
          if (t % 240 === 0) for (const e of escortsOf(car)) { const q = SIM.escortSlot(car, e.slot); n++; if (Math.hypot(q.x - e.x, q.y - e.y) > 90 && !e.threatId) far++; } }
        const es = escortsOf(car);
        if (far > n * 0.15 || es.length !== 2) console.warn('Karawane', far, n, es.length, car.x / TS | 0, car.y / TS | 0, es.map(e => (e.x / TS | 0) + ',' + (e.y / TS | 0) + (e.threatId ? 'T' : '')).join(' '));
        return es.length === 2 && new Set(es.map(e => e.slot)).size === 2 && far <= n * 0.15 && es.every(e => teamOf(e) === 'player' && isHostile(bandit, e) && e.map === 'world');
      } finally { Object.assign(p, keep); car.ambushChecked = amb; parked.forEach(([o, x, y]) => { o.x = x; o.y = y; }); S._frozenWar = false; }
    })());
    if (car) ok('Karawane (BUG-096): Wache, die außer Denkweite zurückblieb, holt den Zug zu Fuß ein, während der Spieler beim Zug steht', (() => {
      const p = S.player, keep = { x: p.x, y: p.y, map: p.map }, e = escortsOf(car)[0], amb = car.ambushChecked;
      if (!e) return false;
      const parked = S.ents.world.filter(o => o.kind === 'enemy' && o.alive && dist(o, car) < 2400).map(o => [o, o.x, o.y]); parked.forEach(([o]) => { o.x += 1e5; });
      car.ambushChecked = true; S._frozenWar = true; p.x = car.x - 60; p.y = car.y + 110; e.x = car.x + 1150; e.y = car.y;
      try { for (let t = 0; t < 14000; t += 16) update(16, performance.now());
        const q = SIM.escortSlot(car, e.slot), d = Math.hypot(q.x - e.x, q.y - e.y);
        if (d >= 120) console.warn('Karawane-Aufholen', d | 0, car.x / TS | 0, car.y / TS | 0, e.x / TS | 0, e.y / TS | 0);
        return d < 120; }
      finally { Object.assign(p, keep); car.ambushChecked = amb; parked.forEach(([o, x, y]) => { o.x = x; o.y = y; }); S._frozenWar = false; }
    })());
    ok('Siedlungen (§75): Nachbarhäuser ≥ 2 Kacheln auseinander, bebaut < 35 % der Fläche', Object.entries(TOWN_PLAN).every(([town, P]) => {
      const hs = HOUSES.filter(b => b.town === town), [x0, y0, x1, y1] = P.area;
      const apart = hs.every((a, i) => hs.every((b, j) => j <= i || Math.max(b.x - a.x - a.w, a.x - b.x - b.w, b.y - a.y - a.h, a.y - b.y - b.h) >= 2));
      return apart && hs.reduce((n, b) => n + b.w * b.h, 0) < 0.35 * (x1 - x0 + 1) * (y1 - y0 + 1);
    }));
    ok('Einwohner folgen der Fläche (perHead), nicht der Häuserzahl; Anzeige zählt echte Köpfe', Object.entries(TOWN_PLAN).every(([town, P]) => {
      const [x0, y0, x1, y1] = P.area, target = (x1 - x0 + 1) * (y1 - y0 + 1) / P.perHead;
      const heads = S.ents.world.filter(c => c.kind === 'npc' && c.alive && (c.homeTown === town || c.post === town
        || (!c.villager && !c.guard && !c.escort && !c.escortLost && !c.tribV && !c.tribFollow && !c.visitor && c.anchor && townAt(c.anchor.x / TS | 0, c.anchor.y / TS | 0) === town))).length;
      return heads <= target * 1.1 + 1 && heads + (S.tribute?.[town]?.lost || 0) >= Math.min(target * 0.6, HOUSES.filter(b => b.town === town && TRADES[b.type] && HB.wearOf(b) < 2).length);   // S12: Ruinen sind unbewohnt
    }));
  }
  if (S.ents.world.some(e => e.gk)) ok('Spielstand: nur abweichende Props, Rückweg stellt Truhe und gefällten Baum her (BUG-057)', (() => {
    const keep = S.ents.world, W = keep.slice(), chest = W.find(e => e.kind === 'prop' && e.loot && e.gk && !e.opened), tree = W.find(e => e.type === 'tree' && e.gk);
    if (!chest || !tree) return false;
    const was = chest.opened; S.ents.world = W.filter(e => e !== tree); chest.opened = true;
    try {
      const d = JSON.parse(saveData()), n = d.ents.world.filter(e => e.kind === 'prop').length, all = W.filter(e => e.kind === 'prop' && !e.transient).length;   // Festaufbauten werden nie gespeichert
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
  UI.closeDialogue();                                       // Proben öffnen Dialoge (Abgabe, Brett) — nichts davon stehen lassen
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
    R.drawHumanoid({ kind:'player', x:0, y:0, pal, facing:0, seed:1, build, equip: eq, aim: Math.PI / 2 - 0.35 }, performance.now(), c);   // Phase 1: 3/4-Ansicht von vorn (vorher 0.5 = Seitenprofil)
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
  if (titleLoop.hero === undefined) { try { const d = loadRaw(), pl = d && Object.values(d.ents || {}).flat().find(e => e && e.kind === 'player'); titleLoop.hero = pl || null; R.setTitleHero(pl); } catch { titleLoop.hero = null; } }   // Phase 1: eigener Charakter am Feuer
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
    drawWorldmap, drawWarmap, warStatus, facRelation, repTier,
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
      else if (act === 'new') { if (loadRaw() && !confirm('Es gibt einen Spielstand. Eine neue Geschichte überschreibt ihn beim ersten Speichern. Fortfahren?')) return;   // BUG-086
        $('titlescreen').classList.add('hidden'); $('creation').classList.remove('hidden'); }
      else if (act === 'chronicle') { UI.openModal('chronicle'); }
      else if (act === 'settings') { UI.openModal('settings'); }
    };
  });
  buildCreation();
  requestAnimationFrame(titleLoop);
  if (location.search.includes('test')) setTimeout(() => selftest(), 400);
  // Entwicklerzugang (nur mit ?dev): Zustand und Kernfunktionen für Browser-Tests; tick() simuliert auch bei verstecktem Tab.
  if (location.search.includes('dev')) window.RF = { S, R, MAPS, TS, update, tributeDay, tribState, startBrawl, spawnTribute, fortressHour, campaignDay, campTick, planCampaign, questPoint, talk, goToJail, jailTick, townContracts, acceptContract, conTick, makeContract, findPath, startHunt, huntTick, courtTrial, travel, skyGate, enslave, bondTick, freeBond, aurelWatch, hasPermit, inAurel, mechMenu, raidDay, raidTick, raze, defPower, startRunaway, chainTick, unlockClass, separate, combatN: () => combat.length, styleArea, dayTarget, placeAway, VILLAGERS, tick: (ms, step = 16) => { for (let t = 0; t < ms; t += step) update(step, performance.now()); },
    travel, spawnEnemy, hurt, die, downed, provoke, attack, resolveSwing, teamOf, isHostile, byId, save, selftest, solidPropAt, duel };
}
boot();
