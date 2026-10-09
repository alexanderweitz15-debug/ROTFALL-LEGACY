// Trefferzonen (Kenshi-artig): jede Figur hat eigene HP pro Körperteil.
// Kopf 0 = Enthauptung. Rumpf 0 = am Boden/Tod. Arm 0 = Waffe fällt. Bein 0 = lahm, beide = kriechen.
// c.hp / c.maxHp bleiben als Summe erhalten, damit Balken und KI-Schwellen ohne Umbau weiterlaufen.
import { rnd, clamp, S } from './state.js?v=27';

export const PARTS = ['head', 'torso', 'larm', 'rarm', 'lleg', 'rleg'];
export const PART_NAME = { head:'Kopf', torso:'Rumpf', larm:'Linker Arm', rarm:'Rechter Arm', lleg:'Linkes Bein', rleg:'Rechtes Bein' };
const SHARE = { head:0.25, torso:0.45, larm:0.2, rarm:0.2, lleg:0.25, rleg:0.25 };   // Anteil der Basis-HP
export const HIT_W = { head:6, torso:46, larm:12, rarm:12, lleg:12, rleg:12 };              // Trefferwahrscheinlichkeit
const HEAD_CAP = 0.6;
// S14 (Nutzer): Arme und Beine haben feste 100 LP (× Körperbau), fallen bei 0 aus (funktionslos bis Heilung) und sind erst ab −200 ab
export const LIMB_HP = 100, LIMB_CUT = -200;
// Schwierigkeit (Nutzer): Sehr schwer ab −100, Schwer ab −200, Angsthase nie
export const cutOf = () => ({ sehr_schwer: -100, angsthase: -Infinity })[S?.difficulty] ?? LIMB_CUT;
const LIMBS = new Set(['larm', 'rarm', 'lleg', 'rleg']);
const maxOf = (c, p, base) => LIMBS.has(p) ? Math.round(LIMB_HP * (buildOf(c).parts[p] || 1)) : Math.round(base * SHARE[p] * (buildOf(c).parts[p] || 1));                                                                // max. Kopfschaden pro Treffer ohne Krit

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
  for (const p of PARTS) { const max = maxOf(c, p, base); c.body[p] = { hp: max, max }; }
  syncHp(c);
}
export function rescale(c, base) {                     // Stufenaufstieg: Maxima wachsen, Wunden bleiben anteilig
  const b = buildOf(c);
  for (const p of PARTS) {
    const part = c.body[p], max = maxOf(c, p, base);
    const ratio = part.max ? part.hp / part.max : 1;
    part.max = max; part.hp = Math.round(max * ratio * 10) / 10;
  }
  syncHp(c);
}
export function syncHp(c) {
  let hp = 0, max = 0;
  for (const p of PARTS) { const P = c.body[p]; if (LIMBS.has(p)) { if (P.max < LIMB_HP * 0.8) { const r = P.hp / P.max; P.max = maxOf(c, p, 0); P.hp = P.lost ? LIMB_CUT : r * P.max; } continue; }   // alte Spielstände: Glieder auf 100
    hp += Math.max(0, P.hp); max += P.max; }   // Balken und KI-Schwellen: Kopf und Rumpf; Glieder zeigt die Körperanzeige
  c.hp = hp; c.maxHp = max;
  c.barHp = Math.max(0, c.body.torso.hp); c.barMax = c.body.torso.max;   /* HB2-01 (Entwickler 03.10.: „Balken = Rumpf“): Lebensbalken zeigen den Rumpf — leer heißt tot bzw. am Boden. hp/maxHp (Kopf+Rumpf) bleiben für Heilung, KI und Balance */
}
/* Anzeige-Leben (Balken, HUD, Gruppe, Ziel, Boss): Rumpf bei Figuren mit Körper, sonst hp/maxHp */
export const barOf = c => c && c.barMax ? [c.barHp, c.barMax] : [c?.hp || 0, c?.maxHp || 1];
/* Anzeige 09.10. (Entwickler: „die Trefferanzeige soll das gesamte Leben zeigen, nicht nur den Körper“): Summe aller Körperteile (Glieder
   zählen mit, verlorene als leer). Liegt der Rumpf oder Kopf bei 0, ist der Balken leer — am Boden bzw. tot. barOf bleibt für die Spiellogik. */
export const lifeOf = c => { if (!c?.body) return barOf(c); if (c.body.torso.hp <= 0 || c.body.head.hp <= 0) return [0, 1];
  let h = 0, m = 0; for (const p of PARTS) { const P = c.body[p]; m += P.max; if (!P.lost) h += clamp(P.hp, 0, P.max); } return [h, m || 1]; };
export const vital = c => c.body ? c.body.torso.hp : c.hp;            // > 0 heißt: nicht am Boden
export const isDisabled = (c, p) => !!c.body && c.body[p].hp <= 0;
// S14 (Nutzer): ohne Arme kein Hieb, ohne Beine kein Gehen — nur Kriechen
export const armless = c => !!c.body && c.body.larm.hp <= 0 && c.body.rarm.hp <= 0;
export const crawling = c => !!c.body && c.body.lleg.hp <= 0 && c.body.rleg.hp <= 0 && c.body.torso.hp > 0;

// Seite aus der Geometrie: trifft der Angreifer von links, sind die linken Glieder näher.
export function pickPart(attacker, target, crit) {
  const w = { ...HIT_W };
  for (const p of LIMBS) if (target.body[p].lost) w[p] = 0;   /* Behoben HB-17: ein abgetrenntes Glied fing noch Treffer — es ist nicht mehr da */
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
  if (part !== 'torso' && part !== 'head') { const glance = dmg * 0.4; dmg -= glance; c.body.torso.hp -= glance * 0.5; }   // BUG-140: Glied nimmt 60 %, ein Teil geht in den Rumpf
  P.hp -= dmg;
  let result = 'hit';
  if (part === 'head' && P.hp <= 0) {                   // S13 (Nutzer: Enthauptung viel seltener): nur kritisch UND mit großem Überschuss;
    if (crit && P.hp <= -P.max * 0.5) result = 'decap';   // sonst bewusstlos am Boden (Kopf 0, Rumpf 0 — aufrichten oder verbluten)
    else { P.hp = 0; c.body.torso.hp = Math.min(c.body.torso.hp, 0); result = 'down'; }
  }
  else if (part !== 'torso' && part !== 'head' && P.hp < 0) {
    const spill = Math.min(-P.hp, dmg) * 0.5;           // Überschuss geht halb in den Rumpf
    c.body.torso.hp -= spill;
    const cut = cutOf();
    if (!P.lost && P.hp <= cut) { P.lost = true; P.mech = 0; delete P.mechCond; delete P.mechUp; delete P.mod; delete P.broken; delete P.splint; P.hp = cut; result = 'severed'; }   /* Roadmap P1: kein alter Prothesenzustand am Stumpf; Behoben HB-15: ein Bruch ueberlebte das Abtrennen und deckelte die naechste Prothese auf 40 % */   // erst ab −200 ab (Sehr schwer −100)
    else if (wasUp) result = 'disabled';
    P.hp = Math.max(P.hp, cut === -Infinity ? LIMB_CUT : cut);
  } else if (part !== 'torso' && part !== 'head' && P.hp === 0 && wasUp) result = 'disabled';
  if (c.body.torso.hp <= 0 && result !== 'decap') result = 'down';
  syncHp(c);
  return result;
}

// Nutzer §5e.7: ein gebrochenes Glied heilt nur bis 40 %, bis der Bruch nach Tagen verheilt ist.
export const topOf = P => P.broken ? Math.round(P.max * 0.4) : P.max;
export function healPart(c, part, amount) {
  const P = c.body[part], was = P.hp;
  if (P.lost || P.mech) return { restored: false, gained: 0 };   /* Behoben HB-16: „Medizin heilt Fleisch, Werkzeug repariert Maschine“ (docs/MECHANIKEN.md) — Verbände/Heiler wirkten bisher auch auf Prothesen */
  P.hp = Math.max(P.hp, Math.min(topOf(P), P.hp + amount));
  syncHp(c);
  return { restored: was <= 0 && P.hp > 0, gained: P.hp - was };
}
// Verteilt Heilung auf die am schwersten verletzten Teile (für Tränke und Magie).
export function heal(c, amount) {
  if (c.lifeBlood != null) c.lifeBlood = Math.min(100, c.lifeBlood + amount * 0.5);   /* Blut (09.10.): Heilung bringt auch Blut zurück */
  if (!c.body) { c.hp = Math.min(c.maxHp, c.hp + amount); return; }
  for (let guard = 0; amount > 0.1 && guard < 12; guard++) {
    const p = c.body.torso.hp <= 0 ? 'torso' : worstPart(c, true); if (!p) break;   // wer am Boden liegt, braucht zuerst den Rumpf
    const P = c.body[p], give = Math.min(amount, topOf(P) - P.hp, Math.max(4, amount / 2)); if (give <= 0) break;
    P.hp += give; amount -= give;
  }
  syncHp(c);
}
export function fullHeal(c) { delete c.lifeBlood;   /* Blut wieder voll */ if (!c.body) { c.hp = c.maxHp; return; } for (const p of PARTS) if (!c.body[p].lost && !c.body[p].mech) c.body[p].hp = Math.max(c.body[p].hp, topOf(c.body[p])); syncHp(c); }   /* Behoben HB-16: Medizin heilt kein Messing */
// Roadmap P1 (Bionik-Qualität): Stufe 1 Schrott ist schlechter als ein echtes Glied, 2 Aurelion gleichwertig, 3 Meisterstück besser,
// 4 Prototyp selten und am besten. wear = wie schnell sie sich abnutzt (×), name für Anzeige und Händler.
export const MECH_Q = {
  1: { name: 'Schrott',      arm: -0.08, leg: -0.06, wear: 2.0 },
  2: { name: 'Aurelionisch', arm: 0,     leg: 0,     wear: 1.0 },
  3: { name: 'Meisterstück', arm: 0.10,  leg: 0.06,  wear: 0.7 },
  4: { name: 'Prototyp',     arm: 0.15,  leg: 0.10,  wear: 0.5 },
};
// S12: Prothese an ein verlorenes Glied. Sie kommt immer frisch: voller Zustand, keine Aufrüstung (vorher erbte sie den alten Stumpf).
export function attachProsthesis(c, part, tier) { const P = c.body[part]; if ((tier | 0) >= 4) c.cellDay = S.day | 0;   /* T15: frisch geladen */ P.lost = false; P.mech = Math.max(1, Math.min(4, tier | 0)); P.mechCond = 100; P.mechUp = 0; delete P.mod; delete P.broken; delete P.splint; P.hp = P.max; syncHp(c); }   /* Behoben HB-15: ein alter Bruch deckelte sonst auch die frische Prothese auf 40 % */
// Roadmap P3: Hand- und Fußmodule auf einer Prothese (c.body[k].mod). Nur auf Gliedern mit mech; wirken nur, solange die Prothese ≥ 30 % hat.
export const MECH_MOD = {
  greifhand:   { part: 'arm', name: 'Greifhand',   arm: 0,    desc: 'Schwere Rüstung und Schild bremsen 30 % weniger; selbst ausbessern bis 90 %.' },
  klingenhand: { part: 'arm', name: 'Klingenhand', arm: 0.12, desc: '+12 % Nahkampf, aber diese Hand hält keinen Schild mehr (kein Schildblock).' },
  federfuss:   { part: 'leg', name: 'Federfuß',    leg: 0.08, desc: '+8 % Tempo.' },
  ankerfuss:   { part: 'leg', name: 'Ankerfuß',    leg: -0.05, desc: 'Kein Rückstoß durch Treffer, aber −5 % Tempo.' },
  uhrmacherhand: { part: 'arm', name: 'Uhrmacherhand', arm: -0.10, desc: 'Feinwerk des Ersten Uhrmachers: Handwerksgüte eine Stufe höher (wie Königseisen, nicht zusätzlich), aber −10 % Nahkampf.' },   /* Geheime Orte S5 (08.10.) */
};
export const hasMod = (c, mod) => { if (!c?.body) return false; for (const k of ['larm', 'rarm', 'lleg', 'rleg']) { const P = c.body[k]; if (P?.mech && P.mod === mod && (P.mechCond ?? 100) >= 30) return true; } return false; };
// Bonus oder Malus der Prothesen einer Art (Summe beider Seiten): Schrott zieht ab, Meisterstück und Prototyp geben dazu, Aufrüstung +5 % je Stufe.
// Unter 30 % Zustand wirkt eine Prothese nicht, weder gut noch schlecht (sie hängt nur noch dran).
export const mechBonus = (c, kind) => { if (!c.body) return 0; let b = 0;
  for (const s of ['l', 'r']) { const P = c.body[s + kind]; if (!P?.mech || (P.mechCond ?? 100) < 30) continue; const plus = (MECH_Q[P.mech] || MECH_Q[2])[kind] + (P.mechUp || 0) * 0.05 + (MECH_MOD[P.mod]?.[kind] || 0);   /* Roadmap P3: Modul-Bonus */
    b += plus > 0 && ((P.mechCond ?? 100) < 50 || (P.mech === 4 && cellEmpty(c))) ? plus * 0.5 : plus; }   /* T15 V10: Prototyp ohne Energiezelle nur halb */   /* Roadmap P4: unter 50 % Zustand nur noch der halbe Vorteil (Nachteile bleiben ganz) */
  return b; };
/* T15 V10 (Entscheidung 01.10.): Prothesen der Stufe 4 (Prototyp) brauchen alle 3 Tage eine Energiezelle, sonst wirken sie nur halb.
   Eine Zelle versorgt alle Prototypen einer Figur. Alte Stände ohne Ladetag gelten ab dem ersten Blick als geladen. */
export const CELL_DAYS = 3;
export const needsCell = c => ['larm', 'rarm', 'lleg', 'rleg'].some(k => c?.body?.[k]?.mech === 4);
export const cellEmpty = c => needsCell(c) && (S.day | 0) - (c.cellDay ??= S.day | 0) >= CELL_DAYS;
// Verschleiß eines getroffenen Prothesenglieds (Roadmap P1): nur echte Treffer, nur das getroffene Teil, Schrott doppelt so schnell.
export function wearProsthesis(c, part, base = 1.2) { const P = c.body?.[part]; if (!P?.mech) return null; const was = P.mechCond ?? 100;
  P.mechCond = Math.max(0, was - base * (MECH_Q[P.mech] || MECH_Q[2]).wear); return { was, now: P.mechCond, broke: was >= 30 && P.mechCond < 30, half: was >= 50 && P.mechCond < 50 }; }
// Roadmap P2 (Roboterauge): eigenes Feld c.eye = { q: 1..4, cond: 0..100 }, bewusst KEIN Teil in PARTS (Trefferverteilung und alte Körper bleiben).
// fog = Kartennebel-Radius in Kacheln (ohne Auge 18), light = Spielerlicht +Anteil (Nachtsicht ab Stufe 3), crit = Fernkampf-Krit, heat = Wärmesicht (Stufe 4).
export const EYE_Q = {
  1: { name: 'Schrott',      fog: 22, light: 0,    crit: 0,    wear: 2.0 },
  2: { name: 'Aurelionisch', fog: 28, light: 0,    crit: 0.02, wear: 1.0 },
  3: { name: 'Meisterstück', fog: 32, light: 0.4,  crit: 0.04, wear: 0.7 },
  4: { name: 'Prototyp',     fog: 36, light: 0.5,  crit: 0.06, wear: 0.5, heat: true },
};
/* wirkendes Auge oder null: unter 30 % Zustand ist es blind wie Glas */
export const eyeOf = c => { const E = c?.eye; if (!E?.q || (E.cond ?? 100) < 30) return null; return EYE_Q[E.q] || EYE_Q[2]; };
export const fogR = c => eyeOf(c)?.fog ?? (c?.lens && !c?.eye ? 28 : 18);
export const lightR = (c, base) => base * (1 + (eyeOf(c)?.light || 0));
export const eyeCrit = c => eyeOf(c)?.crit || 0;
export function attachEye(c, q) { c.eye = { q: Math.max(1, Math.min(4, q | 0)), cond: 100 }; c.lens = true; return c.eye; }
export function wearEye(c, amt) { const E = c?.eye; if (!E?.q) return null; const was = E.cond ?? 100;
  E.cond = Math.max(0, was - amt * (EYE_Q[E.q] || EYE_Q[2]).wear); return { was, now: E.cond, broke: was >= 30 && E.cond < 30 }; }
/* Roadmap P4: alle Bionik-Teile einer Figur mit Zustand (Glieder mit mech und das Auge) — für Öl, Selbstwartung, Händler */
export const bionicParts = c => [...['larm', 'rarm', 'lleg', 'rleg'].filter(k => c?.body?.[k]?.mech).map(k => ({ k, name: PART_NAME[k], cond: c.body[k].mechCond ?? 100 })), ...(c?.eye?.q ? [{ k: 'eye', name: 'Roboterauge', cond: c.eye.cond ?? 100 }] : [])];
export function setBionicCond(c, k, v) { v = Math.max(0, Math.min(100, v)); if (k === 'eye') { if (c.eye) c.eye.cond = v; } else if (c.body?.[k]?.mech) c.body[k].mechCond = v; }
/* Roadmap P2: Save-Defaults für Bionik — alte Linse (p.lens) wird ein Aurelion-Auge; p.lens bleibt als Lesefallback stehen */
export function bionicDefaults(c) { if (!c) return c; if (c.lens && !c.eye) c.eye = { q: 2, cond: 100 }; if (c.eye) c.eye.cond ??= 100; return c; }
export function worstPart(c, room = false) {   /* room: nur Teile, die noch heilen können (Bruch) */
  let best = null, br = 1;
  for (const p of PARTS) { if (c.body[p].lost || c.body[p].mech || (room && c.body[p].hp >= topOf(c.body[p]) - 1e-6)) continue; const r = c.body[p].hp / c.body[p].max; if (r < br - 1e-6) { br = r; best = p; } }   /* Behoben HB-16: Medizin waehlt keine Prothese als Ziel */
  return best;
}
export function speedFactor(c) {
  if (!c.body) return 1;
  const lame = (c.body.lleg.hp <= 0) + (c.body.rleg.hp <= 0);
  return (lame === 2 ? 0.2 : lame === 1 ? 0.55 : 1) * buildOf(c).speed * (1 + mechBonus(c, 'leg'));
}
export function partState(P) {
  const r = P.hp / P.max;
  return P.hp <= 0 ? 'aus' : r < 0.35 ? 'kritisch' : r < 0.7 ? 'verwundet' : 'heil';
}
