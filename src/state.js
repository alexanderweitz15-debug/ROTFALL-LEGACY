// Globaler Spielzustand + Hilfsfunktionen. Ein mutierbares Objekt, absichtlich ohne Store-Framework.
export const SAVE_KEY = 'rotfall.legacy.save';
export const SAVE_VERSION = 2;   // 2: erweitertes Grenzland (256×256). Ältere Stände sind geometrisch inkompatibel.

export const S = {
  ver: SAVE_VERSION,
  seed: 1,
  day: 1, minute: 8 * 60, season: 'Später Frühling',
  weather: 'clear', weatherLeft: 40,
  map: 'world',
  ents: { world: [], mine: [] },
  player: null,
  party: [],
  gold: 20,
  res: { wood: 0, stone: 0, iron: 0, herb: 0, food: 3 },
  stash: [],
  factions: { valen: 0, order: 0, undead: 0, merch: 0, bandit: 0 },
  ranks: { valen: -1, order: -1, undead: -1 },
  quests: {},
  relations: {},
  partyCmd: 'follow',
  prices: 1,
  chronicle: [],
  legacy: { house: 'Ragnar', gen: 1, ancestors: [] },
  settlement: null,
  flags: {},
  settings: { violence: 'standard', motion: true, textScale: 1 },
  kills: 0, battles: 0,
  log: [],
  // transient (nicht gespeichert)
  fx: [], floats: [], projectiles: [], paused: false, uiDirty: true,
};

// ---- deterministischer RNG (mulberry32) ----
let rngState = 1;
export function seedRng(n) { rngState = n >>> 0 || 1; }
export function rnd() {
  rngState |= 0; rngState = (rngState + 0x6D2B79F5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
export const chance = (p) => rnd() < p;
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const uid = () => 'e' + (S._uid = (S._uid || 0) + 1);

export function timeStr() {
  const h = Math.floor(S.minute / 60), m = Math.floor(S.minute % 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}
export function year() { return 17 + Math.floor((S.day - 1) / 60); }

const logListeners = [];
export function onLog(fn) { logListeners.push(fn); }
export function log(text, cat = 'world') {
  const e = { t: timeStr(), text, cat };
  S.log.push(e);
  if (S.log.length > 220) S.log.shift();
  logListeners.forEach(f => f(e));
}

export function chronicle(text, kind = 'event', detail = '') {
  S.chronicle.push({ year: year(), day: S.day, text, kind, detail });
  if (kind === 'death') log(text, 'death'); 
}

export function ents(map = S.map) { return S.ents[map]; }
export function byId(id) {
  for (const m of Object.keys(S.ents)) { const e = S.ents[m].find(x => x.id === id); if (e) return e; }
  return null;
}
export function partyMembers() { return S.party.map(byId).filter(x => x && x.alive); }

// ---- Speichern ----
const SKIP = new Set(['fx', 'floats', 'projectiles', 'paused', 'uiDirty']);
export function save() {
  try {
    const out = {};
    for (const k of Object.keys(S)) if (!SKIP.has(k)) out[k] = S[k];
    out.ents = {
      world: S.ents.world.filter(e => !e.transient),
      mine: S.ents.mine.filter(e => !e.transient),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(out));
    return true;
  } catch (err) {
    console.warn('Speichern fehlgeschlagen', err);
    log('Spielstand konnte nicht geschrieben werden: ' + err.message, 'world');
    return false;
  }
}
export function loadRaw() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.ver !== SAVE_VERSION) return migrate(data);
    return data;
  } catch (err) { console.warn('Spielstand unlesbar', err); return null; }
}
function migrate(data) {
  // v1 → v2: Die Welt wurde von 128×128 auf 256×256 vergrößert. Alte Positionen und Kriegsknoten
  // passen nicht mehr zur neuen Geometrie, darum wird ein inkompatibler Stand verworfen statt halb geladen.
  if ((data.ver || 1) < 2) { wipeSave(); return null; }
  data.ver = SAVE_VERSION; return data;
}
export function applySave(data) {
  for (const k of Object.keys(data)) S[k] = data[k];
  S.fx = []; S.floats = []; S.projectiles = []; S.paused = false;
}
export function hasSave() { return !!localStorage.getItem(SAVE_KEY); }
export function wipeSave() { localStorage.removeItem(SAVE_KEY); }
