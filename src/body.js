// Trefferzonen (Kenshi-artig): jede Figur hat eigene HP pro Körperteil.
// Kopf 0 = Enthauptung. Rumpf 0 = am Boden/Tod. Arm 0 = Waffe fällt. Bein 0 = lahm, beide = kriechen.
// c.hp / c.maxHp bleiben als Summe erhalten, damit Balken und KI-Schwellen ohne Umbau weiterlaufen.
import { rnd, clamp } from './state.js';

export const PARTS = ['head', 'torso', 'larm', 'rarm', 'lleg', 'rleg'];
export const PART_NAME = { head:'Kopf', torso:'Rumpf', larm:'Linker Arm', rarm:'Rechter Arm', lleg:'Linkes Bein', rleg:'Rechtes Bein' };
const SHARE = { head:0.25, torso:0.45, larm:0.2, rarm:0.2, lleg:0.25, rleg:0.25 };   // Anteil der Basis-HP
const HIT_W = { head:6, torso:46, larm:12, rarm:12, lleg:12, rleg:12 };              // Trefferwahrscheinlichkeit
const HEAD_CAP = 0.6;                                                                // max. Kopfschaden pro Treffer ohne Krit

// Körperbau: Aussehen UND Werte. scale = Breite/Höhe des Sprites.
export const BUILDS = {
  ausgewogen:   { name:'Ausgewogen', desc:'Nichts Besonderes. Nichts fehlt.', parts:{}, speed:1, headHit:1, stamina:0, scale:[1, 1] },
  drahtig:      { name:'Drahtig', desc:'Schnell und ausdauernd, aber der Rumpf hält weniger aus.', parts:{ torso:0.85, larm:0.85, rarm:0.85 }, speed:1.1, headHit:1, stamina:12, scale:[0.84, 1.02] },
  bullig:       { name:'Bullig', desc:'Breiter Rumpf, starke Arme. Langsamer auf den Beinen.', parts:{ torso:1.25, larm:1.12, rarm:1.12, head:1.05 }, speed:0.9, headHit:1, stamina:-8, scale:[1.2, 0.98] },
  hochgewachsen:{ name:'Hochgewachsen', desc:'Lange Beine, weiter Schritt. Der Kopf ist ein leichteres Ziel.', parts:{ lleg:1.15, rleg:1.15, torso:0.95 }, speed:1.06, headHit:1.35, stamina:0, scale:[0.94, 1.14] },
  gedrungen:    { name:'Gedrungen', desc:'Klein und fest. Schwer am Kopf zu treffen, zähe Beine.', parts:{ lleg:1.2, rleg:1.2, head:1.1 }, speed:0.95, headHit:0.6, stamina:5, scale:[1.08, 0.88] },
};
export const buildOf = c => BUILDS[c.build] || BUILDS.ausgewogen;

export function initBody(c, base) {
  const b = buildOf(c);
  c.body = {};
  for (const p of PARTS) { const max = Math.round(base * SHARE[p] * (b.parts[p] || 1)); c.body[p] = { hp: max, max }; }
  syncHp(c);
}
export function rescale(c, base) {                     // Stufenaufstieg: Maxima wachsen, Wunden bleiben anteilig
  const b = buildOf(c);
  for (const p of PARTS) {
    const part = c.body[p], max = Math.round(base * SHARE[p] * (b.parts[p] || 1));
    const ratio = part.max ? part.hp / part.max : 1;
    part.max = max; part.hp = Math.round(max * ratio * 10) / 10;
  }
  syncHp(c);
}
export function syncHp(c) {
  let hp = 0, max = 0;
  for (const p of PARTS) { hp += Math.max(0, c.body[p].hp); max += c.body[p].max; }
  c.hp = hp; c.maxHp = max;
}
export const vital = c => c.body ? c.body.torso.hp : c.hp;            // > 0 heißt: nicht am Boden
export const isDisabled = (c, p) => !!c.body && c.body[p].hp <= 0;

// Seite aus der Geometrie: trifft der Angreifer von links, sind die linken Glieder näher.
export function pickPart(attacker, target, crit) {
  const w = { ...HIT_W };
  w.head *= buildOf(target).headHit * (crit ? 2.5 : 1);
  if (attacker) {
    const a = Math.atan2(attacker.y - target.y, attacker.x - target.x);
    const facing = target.aim ?? [Math.PI / 2, -Math.PI / 2, Math.PI, 0][target.facing || 0];
    const side = Math.sin(a - facing);                  // >0: von rechts, <0: von links
    const k = 1 + Math.abs(side);
    if (side > 0) { w.rarm *= k; w.rleg *= k; } else { w.larm *= k; w.lleg *= k; }
  }
  let r = rnd() * Object.values(w).reduce((s, v) => s + v, 0);
  for (const p of PARTS) { r -= w[p]; if (r <= 0) return p; }
  return 'torso';
}

// Liefert, was passiert ist: 'hit' | 'disabled' | 'decap' | 'down'
export function damagePart(c, part, dmg, crit) {
  const P = c.body[part];
  if (part === 'head' && !crit) dmg = Math.min(dmg, P.max * HEAD_CAP);
  const wasUp = P.hp > 0;
  P.hp -= dmg;
  let result = 'hit';
  if (part === 'head' && P.hp <= 0) result = 'decap';
  else if (part !== 'torso' && part !== 'head' && P.hp < 0) {
    const spill = Math.min(-P.hp, dmg) * 0.5;           // Überschuss geht halb in den Rumpf
    P.hp = Math.max(P.hp, -P.max);
    c.body.torso.hp -= spill;
    if (wasUp) result = 'disabled';
  } else if (part !== 'torso' && part !== 'head' && P.hp === 0 && wasUp) result = 'disabled';
  if (c.body.torso.hp <= 0 && result !== 'decap') result = 'down';
  syncHp(c);
  return result;
}

export function healPart(c, part, amount) {
  const P = c.body[part], was = P.hp;
  P.hp = Math.min(P.max, P.hp + amount);
  syncHp(c);
  return { restored: was <= 0 && P.hp > 0, gained: P.hp - was };
}
// Verteilt Heilung auf die am schwersten verletzten Teile (für Tränke und Magie).
export function heal(c, amount) {
  if (!c.body) { c.hp = Math.min(c.maxHp, c.hp + amount); return; }
  for (let guard = 0; amount > 0.1 && guard < 12; guard++) {
    const p = c.body.torso.hp <= 0 ? 'torso' : worstPart(c); if (!p) break;   // wer am Boden liegt, braucht zuerst den Rumpf
    const P = c.body[p], give = Math.min(amount, P.max - P.hp, Math.max(4, amount / 2));
    P.hp += give; amount -= give;
  }
  syncHp(c);
}
export function fullHeal(c) { if (!c.body) { c.hp = c.maxHp; return; } for (const p of PARTS) c.body[p].hp = c.body[p].max; syncHp(c); }
export function worstPart(c) {
  let best = null, br = 1;
  for (const p of PARTS) { const r = c.body[p].hp / c.body[p].max; if (r < br - 1e-6) { br = r; best = p; } }
  return best;
}
export function speedFactor(c) {
  if (!c.body) return 1;
  const lame = (c.body.lleg.hp <= 0) + (c.body.rleg.hp <= 0);
  return (lame === 2 ? 0.2 : lame === 1 ? 0.55 : 1) * buildOf(c).speed;
}
export function partState(P) {
  const r = P.hp / P.max;
  return P.hp <= 0 ? 'aus' : r < 0.35 ? 'kritisch' : r < 0.7 ? 'verwundet' : 'heil';
}
