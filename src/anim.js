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
  },
};
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
