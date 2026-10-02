// Roadmap P8 (Teil B, Grundstein): datengetriebene Animation. Keine neuen Frame-Blätter — Todesarten sind Zahlen (Dauer, Drehung,
// Verschiebung, Farbstich, Ausblenden) auf den vorhandenen Bildern hit/die1/dead plus Ereignisse (fx) auf einer Zeitachse 0–1
// (ANIMATION_REFERENZ §4 und §7). render.js malt den Ablauf (drawCorpse), game.js feuert die Ereignisse (deathTick) und wählt die
// Ursache (deathKind). Eigener kleiner LRU-Cache für eingefärbte Todesbilder, damit der Figuren-Cache (sprites.js) nie geleert wird.

// Todesursachen: dur = ms bis zur Endlage; rot = Drehung am Ende (+ zur Seite, − nach hinten); slide = px Rutschen nach hinten;
// tint = Farbstich über die ganze Figur; fade = Figur verblasst; squash = sackt in sich zusammen; freeze = ms starr in der Trefferpose;
// shatter = zerspringt nach freeze; rigid = kippt als Brett (ohne Knie); pool = Blutlache; ev = Ereignisse (t, fx, n, dy, shake, sfx).
export const ANIM_DEFS = {
  death: {
    fall:     { name: 'Sturz zur Seite', dur: 440, rot: 1, pool: true, ev: [{ t: 0.9, fx: 'dust', n: 5 }] },
    fallB:    { name: 'Sturz rückwärts (Krit)', dur: 380, rot: -1, back: true, pool: true, ev: [{ t: 0.05, fx: 'blood', n: 8, dy: -18 }, { t: 0.95, fx: 'dust', n: 6 }] },
    heavy:    { name: 'Wuchtschlag (Rückstoß)', dur: 320, rot: -1, back: true, slide: 22, pool: true, ev: [{ t: 0.1, fx: 'blood', n: 6, dy: -16 }, { t: 0.95, fx: 'dust', n: 9, shake: 3 }] },
    burn:     { name: 'Verbrennen', dur: 650, rot: 1, tint: 'rgba(255,120,30,.55)', char: 'rgba(24,14,10,.72)', ev: [{ t: 0, fx: 'fire', n: 10, dy: -16 }, { t: 0.4, fx: 'fire', n: 8, dy: -10 }, { t: 0.8, fx: 'shadow', n: 6, dy: -8 }] },
    frost:    { name: 'Erfrieren', dur: 520, freeze: 360, shatter: true, tint: 'rgba(150,210,245,.7)', ev: [{ t: 0, fx: 'frost', n: 8, dy: -14 }, { t: 0.72, fx: 'frost', n: 16, dy: -12, sfx: 'bone' }] },
    dissolve: { name: 'Auflösen', dur: 700, fade: true, tint: 'rgba(170,150,230,.45)', ev: [{ t: 0.1, fx: 'necro', n: 6, dy: -20 }, { t: 0.5, fx: 'necro', n: 6, dy: -14 }, { t: 0.9, fx: 'ghost', n: 3, dy: -24 }] },
    crumble:  { name: 'Zerfallen (Untote)', dur: 300, squash: true, tint: 'rgba(150,140,120,.35)', ev: [{ t: 0.3, fx: 'bone', n: 9, dy: -8, sfx: 'bone' }, { t: 0.95, fx: 'dust', n: 5 }] },
    sparks:   { name: 'Abschalten (Automat)', dur: 460, freeze: 160, rigid: true, rot: 1, ev: [{ t: 0, fx: 'spark', n: 10, dy: -18, sfx: 'metal' }, { t: 0.95, fx: 'spark', n: 8 }, { t: 0.97, fx: 'dust', n: 6 }] },
    decap:    { name: 'Enthauptung', dur: 440, rot: 1, pool: true, head: true, ev: [{ t: 0, fx: 'blood', n: 12, dy: -26 }, { t: 0.35, fx: 'blood', n: 8, dy: -18 }] },
  },
  gesture: {                                                         // Mischposen in fig5 rigS/rigW; ms = Standarddauer
    zeigen: { name: 'Zeigen', ms: 1400 }, abwehren: { name: 'Abwehren', ms: 1200 }, achsel: { name: 'Achselzucken', ms: 1100 },
    salutieren: { name: 'Salutieren', ms: 900 }, jubeln: { name: 'Jubeln', ms: 1000 }, trauern: { name: 'Trauern', ms: 1800 }, knien: { name: 'Knien', ms: 1600 },   /* T17 */
  },
  /* Kampfanimation Scheibe 1 (COMBAT_ANIM, DECISIONS 02.10.): Angriffe als Daten je Animationsklasse (heute = wtype) und Pack.
     Zwei Ebenen, damit der Figuren-Cache nicht je Pack wächst:
     - shapes: Bewegungsform (Klingenwinkel a relativ zur Zielrichtung, Handvorschub ext) über der Formzeit u 0..1 mit festen Ankern:
       u 0–0,4 Ausholen, 0,4–0,5 Schlag, u = 0,5 Einschlag (Impact-Bild = Schaden), 0,5–0,7 Nachschwung, 0,7–1 Erholung.
       Figurenbilder gibt es nur an den 11 Stützstellen ATK_U — gleich für alle Packs (Pack ist kein Cache-Schlüssel).
     - Pack (A Grounded, B Heroic, C Endgame): welche Form je Kombo-Schritt, wann im Takt ausgeholt (w) und getroffen (h) wird,
       Körper-Transform (push: Vorschub in px, nur Bild) und Effekte. Packs ändern nur die Optik und die Verteilung im gleichen Takt;
       der Abbruchpunkt der Erholung (Treffer + 40 %) kommt immer aus Pack A, damit kein Pack mehr Schaden je Sekunde macht.
     Kombo: Schritt 0 und 1 normal, Schritt 2 = Wuchtschlag (+15 % Dauer, in B/C als Finisher-Animation). */
  attack: {
    sword: {                                                         // Langschwert (alle wtype 'sword'): kontrolliert, klare Bögen
      name: 'Langschwert',
      shapes: [                                                      // Index = W.v im Figuren-Cache
        { name: 'Vorhand', a0: 0.6, from: 2.0, hit: -0.12, end: -1.05, a1: -0.6, eW: 0, eS: 2 },   // holt tief/hinten aus, quert die Zielachse erst im Einschlag
        { name: 'Rückhand', a0: -1.05, from: -2.0, hit: 0.12, end: 1.05, a1: 0.6, eW: 0, eS: 2 },   // läuft aus der Endlage der Vorhand weiter
        { name: 'Überkopf', a0: 1.05, from: -2.3, hit: 0.2, end: 0.8, a1: 0.6, eW: -4, eS: 4 },
        { name: 'Wirbel', a0: 1.05, from: 1.8, hit: 2 * Math.PI - 0.12, end: 2 * Math.PI + 0.9, a1: 2 * Math.PI + 0.6, eW: -2, eS: 3, spin: true },
        { name: 'Doppelwirbel', a0: 1.05, from: 1.9, hit: 4 * Math.PI - 0.12, end: 4 * Math.PI + 0.9, a1: 4 * Math.PI + 0.6, eW: -3, eS: 4, spin: true },
      ],
      A: { name: 'A Grounded', steps: [{ s: 0, w: 0.30, h: 0.446 }, { s: 1, w: 0.232, h: 0.375 }, { s: 2, w: 0.357, h: 0.497 }],
        fx: { stop: 1, shake: 1, trail: 6, push: 1, slash: 0, after: 0, fin: 0 } },
      B: { name: 'B Heroic', steps: [{ s: 0, w: 0.268, h: 0.375 }, { s: 1, w: 0.196, h: 0.304 }, { s: 3, w: 0.311, h: 0.497 }],
        fx: { stop: 1.4, shake: 1.33, trail: 8, push: 3, slash: 1, after: 0, fin: 1 } },
      C: { name: 'C Endgame', steps: [{ s: 0, w: 0.196, h: 0.286 }, { s: 1, w: 0.143, h: 0.232 }, { s: 4, w: 0.30, h: 0.45 }],
        fx: { stop: 1.8, shake: 1.67, trail: 10, push: 7, slash: 2, after: 1, fin: 2 } },
    },
  },
};
/* ---- Kampfanimation: Rechenhilfen (rein rechnend; game.js, render.js, fig5.js und die Proben lesen dasselbe) ---- */
export const ATK_U = [0, 0.13, 0.27, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9, 1];   // Stützstellen der Figurenbilder (Formzeit u)
export const ATK_PACKS = ['A', 'B', 'C'];
export const atkProfile = wt => ANIM_DEFS.attack[wt] || null;
// Klassen ohne eigenes Profil (Scheibe 2 folgt): heutige Kurven aus fig5.swingOf, Schaden am Ende des Schlags (Stoß: volle Streckung)
const THRUST_W = new Set(['spear', 'dagger', 'rapier']), HEAVY_W = new Set(['great', 'axe', 'mace', 'hammer', 'polearm']);
export function legacyTiming(wt) {
  if (THRUST_W.has(wt)) return { w: 0.3, h: 0.45 };
  return { w: wt === 'hammer' ? 0.44 : HEAVY_W.has(wt) ? 0.36 : 0.28, h: 0.5 };
}
const cancelOf = h => Math.round((h + 0.4 * (1 - h)) * 1000) / 1000;   // Erholung ab Treffer + 40 % abbrechbar
// Plan eines Schwungs: s = Form, w = Ausholen bis, h = Treffer (Schaden) bei, c = Erholung abbrechbar ab (alles Anteile des Takts)
export function atkPlan(wt, pack = 'A', step = 0) {
  const P = atkProfile(wt), k = Math.max(0, Math.min(2, step | 0));
  if (P) { const st = (P[pack] || P.A).steps[k], A = P.A.steps[k]; return { s: st.s, w: st.w, h: st.h, c: cancelOf(A.h) }; }
  const T = legacyTiming(wt); return { s: k, w: T.w, h: T.h, c: cancelOf(T.h) };
}
export const atkFx = (wt, pack = 'A') => { const P = atkProfile(wt); return (P && (P[pack] || P.A).fx) || ANIM_DEFS.attack.sword.A.fx; };
// Takt → Formzeit: Ausholen [0, w] → u [0, 0,4], Schlag [w, h] → [0,4, 0,5], Rest → [0,5, 1]
export function atkU(w, h, sw) {
  if (!(sw > 0)) return 0; if (sw >= 1) return 1;
  w = Math.max(0.01, Math.min(w, h - 0.01));
  return sw < w ? 0.4 * sw / w : sw < h ? 0.4 + 0.1 * (sw - w) / (h - w) : 0.5 + 0.5 * (sw - h) / (1 - h);
}
// Formzeit → Takt für die alten Kurven (Umkehrung von atkU mit legacyTiming)
export function legacySw(wt, u) { const T = legacyTiming(wt); return u < 0.4 ? u / 0.4 * T.w : u < 0.5 ? T.w + (u - 0.4) / 0.1 * (T.h - T.w) : T.h + (u - 0.5) / 0.5 * (1 - T.h); }
// Bild-Stützstelle: die größte ≤ u — das Impact-Bild (u 0,5) erscheint nie vor dem Schaden
export function snapU(u) { let r = 0; for (const x of ATK_U) { if (x <= u + 1e-9) r = x; else break; } return r; }
const eo = t => 1 - (1 - t) ** 3, ei = t => t * t;
// Klingenwinkel/Handvorschub einer Form zur Formzeit u (null = Klasse ohne Daten)
export function atkShape(wt, s, u) {
  const P = atkProfile(wt); if (!P) return null; const F = P.shapes[s] || P.shapes[0];
  if (u <= 0) return { a: F.a0, ext: 0 };
  if (u < 0.4) { const k = eo(u / 0.4); return { a: F.a0 + (F.from - F.a0) * k, ext: F.eW * k }; }
  if (u <= 0.5) return { a: F.from + (F.hit - F.from) * ei((u - 0.4) / 0.1), ext: F.eS };
  if (u < 0.7) { const k = (u - 0.5) / 0.2; return { a: F.hit + (F.end - F.hit) * eo(k), ext: F.eS * (1 - k * 0.5) }; }
  const k = Math.min(1, (u - 0.7) / 0.3); return { a: F.end + (F.a1 - F.end) * eo(k), ext: F.eS * 0.5 * (1 - k) };
}
export const atkSpin = (wt, s) => !!atkProfile(wt)?.shapes[s]?.spin;
export const DEATH_KINDS = Object.keys(ANIM_DEFS.death);
// Ereignisse zwischen t0 (ausschließlich) und t1 (einschließlich); t0 < 0 heißt „von Anfang an“
export function animEvents(def, t0, t1) { return (def?.ev || []).filter(e => e.t > t0 && e.t <= t1); }
// Ablauf eines Todes zum Zeitpunkt age (ms): welches Bild, wie gedreht/verschoben/eingefärbt. Rein rechnend, für render.js und Tests.
export function deathPose(dc, age) {
  const D = ANIM_DEFS.death[dc] || ANIM_DEFS.death.fall, k = Math.min(1, age / D.dur), o = { k, rot: 0, slide: 0, alpha: 1, squash: 1, tint: null, frame: 'dead', dir: 'W', shards: false, head: 0 };
  if (D.freeze && age < D.freeze) return { ...o, frame: 'hit', dir: 'S', tint: D.tint || null, jitter: !D.shatter };
  if (D.shatter) return { ...o, frame: null, shards: true, tint: D.tint };
  if (D.fade) return { ...o, frame: 'hit', dir: 'S', alpha: Math.max(0, 1 - k), tint: D.tint, lift: -k * 6 };
  if (D.squash) return { ...o, frame: k < 1 ? 'die1' : 'dead', squash: Math.max(0.3, 1 - k * 0.7), tint: D.tint };
  const k2 = D.freeze ? Math.min(1, (age - D.freeze) / Math.max(1, D.dur - D.freeze)) : k;
  if (D.rigid) return { ...o, frame: 'i0', dir: 'S', rot: (D.rot || 1) * k2 * Math.PI / 2, tint: k2 < 0.1 ? 'rgba(255,230,150,.5)' : null };
  const tint = D.char && k >= 1 ? D.char : D.tint && k < 1 ? D.tint : D.char ? D.char : null;
  o.slide = (D.slide || 0) * Math.min(1, k * 1.6); o.head = D.head ? Math.min(1, k * 1.4) : 0;
  if (D.back) return { ...o, frame: k < 0.25 ? 'hit' : k < 1 ? 'hit' : 'dead', dir: k < 1 ? 'S' : 'W', rot: k < 0.25 ? 0 : k < 1 ? -((k - 0.25) / 0.75) * Math.PI / 2 : 0, flip: k >= 1, tint };
  if (age < 120) return { ...o, frame: 'hit', dir: 'S', tint };
  if (k < 0.68) return { ...o, frame: 'die1', dir: 'W', tint };
  if (k < 1) return { ...o, frame: 'die1', dir: 'W', rot: (k - 0.68) / 0.32 * Math.PI / 2, tint };
  return { ...o, tint };
}
// Eingefärbte Bilder: eigener LRU (200 Einträge), Schlüssel = Bildnummer + Farbe. Das Bild behält Pixelmaß und Ankerpunkt.
const TINT = new Map(); let tintId = 0;
export const tintCacheInfo = () => ({ size: TINT.size });
export function tinted(f, color) {
  if (!f || !color || typeof document === 'undefined') return f;
  f.__aid ||= ++tintId; const key = f.__aid + '|' + color;
  let t = TINT.get(key); if (t) { TINT.delete(key); TINT.set(key, t); return t; }
  t = document.createElement('canvas'); t.width = f.width; t.height = f.height; const c = t.getContext('2d');
  c.drawImage(f, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = color; c.fillRect(0, 0, t.width, t.height);
  t.px = f.px; t.ox = f.ox; t.oy = f.oy;
  TINT.set(key, t); if (TINT.size > 200) TINT.delete(TINT.keys().next().value);
  return t;
}
