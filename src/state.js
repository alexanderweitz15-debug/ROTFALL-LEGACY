// Globaler Spielzustand + Hilfsfunktionen. Ein mutierbares Objekt, absichtlich ohne Store-Framework.
// Nutzer (30.09.2026): mehrere Spielstände, Einzelspieler und Koop getrennt. Jeder Platz hat einen eigenen Schlüssel; der alte Stand
// bleibt als Platz „legacy“ unter seinem alten Schlüssel (keine Umkopie, der Speicher im Browser ist knapp). SAVE_KEY zeigt immer auf den
// aktiven Platz (live gebunden: game.js und ui.js sehen den Wechsel). Übersicht (Name, Stufe, Tag, Erfolge) in rotfall.slots.
const LEGACY_KEY = 'rotfall.legacy.save', SLOTS_KEY = 'rotfall.slots', ACTIVE_KEY = 'rotfall.slot.active';
export const slotKey = id => id === 'legacy' ? LEGACY_KEY : 'rotfall.slot.' + id;
export let SLOT = localStorage.getItem(ACTIVE_KEY) || 'legacy';
export let SAVE_KEY = slotKey(SLOT);
export function setSlot(id) { SLOT = id; SAVE_KEY = slotKey(id); localStorage.setItem(ACTIVE_KEY, id); }
export function slotIndex() {
  let idx = {}; try { idx = JSON.parse(localStorage.getItem(SLOTS_KEY) || '{}') || {}; } catch (e) { idx = {}; }
  if (!idx.legacy && localStorage.getItem(LEGACY_KEY)) idx.legacy = { id: 'legacy', mode: 'single', at: 0 };   /* alter Stand: Daten füllt slotMetaFrom beim ersten Blick */
  for (const id of Object.keys(idx)) if (!localStorage.getItem(slotKey(id))) delete idx[id];   /* Platz ohne Daten (gelöscht, voller Speicher): weg */
  return idx;
}
function saveIndex(idx) { try { localStorage.setItem(SLOTS_KEY, JSON.stringify(idx)); } catch (e) { /* Übersicht ist nur Komfort */ } }
export function newSlot(mode) { const id = (mode === 'coop' ? 'c' : 's') + Date.now().toString(36); const idx = slotIndex(); idx[id] = { id, mode, at: Date.now() }; saveIndex(idx); return id; }
export function deleteSlot(id) { localStorage.removeItem(slotKey(id)); const idx = slotIndex(); delete idx[id]; saveIndex(idx); if (SLOT === id) setSlot('legacy'); }
// Kurzbeschreibung eines Stands für die Liste: Held, Haus, Stufe, Tag, Generation und Erfolge als Symbole
export const ACHIEVE = [
  ['garm', '💀', 'Garmadon ist tot', d => d.flags?.garmadonSlain],
  ['omega', '☀', 'Omega bezwungen', d => d.omega?.ending === 'slain'],
  ['omegaPact', '✦', 'Omegas Weg zu Ende gegangen', d => d.omega?.ending && d.omega.ending !== 'slain'],
  ['chains', '⛓', 'Die Eiserne Kette ist gebrochen', d => d.flags?.chainsBroken],
  ['goblins', '♣', 'Die Grubenstämme sind frei', d => d.flags?.goblinsFreed],
  ['hrodvar', '❄', 'Der Frostkönig Hrodvar ist gefallen', d => d.flags?.hrodvarSlain],
  ['whitebeard', '⚓', 'Weißbart ist besiegt', d => d.flags?.whitebeardSlain],
  ['ilvar', '⌛', 'Ilvar Nachtglas ist tot', d => d.flags?.ilvarDead],
  ['dodon', '🪓', 'Dodon ist tot', d => d.flags?.dodonDead],
  ['empress', '👑', 'Die Ewige Kaiserin ist tot', d => d.flags?.skyDead?.kaiserin],
  ['citizen', '⚙', 'Bürger von Aurelion', d => d.flags?.aurelCitizen],
  ['varonKnight', '⚔', 'Ritter König Varons', d => d.flags?.varonKnight],   /* Nutzer §5d.4 */
  ['varonDead', '☠', 'König Varon ist tot', d => d.flags?.varonDead],
];
export function slotMetaFrom(d) {
  const hero = d && Object.values(d.ents || {}).flat().find(e => e && e.kind === 'player');
  return { name: hero?.name || '—', house: d?.legacy?.house || '', level: hero?.level || 1, day: d?.day | 0, gen: d?.legacy?.gen || 1, dead: hero ? !hero.alive : false,
    marks: ACHIEVE.filter(a => { try { return a[3](d || {}); } catch (e) { return false; } }).map(a => a[0]) };
}
function touchSlot() {
  const idx = slotIndex(), cur = idx[SLOT] || { id: SLOT, mode: SLOT.startsWith('c') ? 'coop' : 'single' };
  try { Object.assign(cur, slotMetaFrom(S), { at: Date.now() }); } catch (e) { cur.at = Date.now(); }
  idx[SLOT] = cur; saveIndex(idx); if (cur.mode === 'single') localStorage.setItem('rotfall.slot.lastSingle', SLOT);
}
export const SAVE_VERSION = 4;   // 4 (S12): Neuordnung West/Mitte/Ost — ältere Stände werden gesichert, nicht geladen   // 2: erweitertes Grenzland (512×512); 3: Weltmaßstab ×1,5 (768×768), v2 wird beim Laden umgerechnet

export const S = {
  ver: SAVE_VERSION,
  seed: 1,
  day: 1, minute: 8 * 60, season: 'Später Frühling',
  weather: 'clear', weatherLeft: 40,
  map: 'world',
  ents: { world: [], mine: [], deep: [], sky: [], kerker: [], garmadon: [], omega: [] },
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
  settings: { violence: 'standard', motion: true, textScale: 1, volume: 0.7, art: 'R' },   // Nutzer S15: Stil R ist Standard; D und F bleiben in den Optionen wählbar
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
// S14 (Nutzer: Jahreszeiten mit Wirkung): je 7 Tage Frühling, Sommer, Herbst, Winter. Wirkung: Wetter, Ernte, Herden, Wolfswinter.
export const SEASONS = ['Frühling', 'Sommer', 'Herbst', 'Winter'];
export const seasonOf = (d = S.day) => Math.floor(Math.max(0, (d | 0) - 1) / 7) % 4;   // 0 Frühling … 3 Winter
export const SEASON_FARM = [0.9, 1.1, 1.4, 0.4];                                         // Getreide je Jahreszeit (Herbst: Ernte)

const logListeners = [];
export function onLog(fn) { logListeners.push(fn); }
export function log(text, cat = 'world') {
  if (S._quiet) return;                           // Selbsttest-Sandbox: keine Einträge im echten Protokoll
  const e = { t: timeStr(), text, cat };
  S.log.push(e);
  if (S.log.length > 220) S.log.shift();
  logListeners.forEach(f => f(e));
}

export function chronicle(text, kind = 'event', detail = '') {
  if (S._quiet) return;
  S.chronicle.push({ year: year(), day: S.day, text, kind, detail });
  if (kind === 'death') log(text, 'death'); 
}

export function ents(map = S.map) { return S.ents[map]; }
// id → Entity. Index statt linearer Suche über ~3500 Entities (wird pro Frame vielfach gerufen: Aggro, Gruppe, Bedrohung).
// Alle 250 ms neu aufgebaut und sofort bei neuem Weltstand; ein Treffer wird geprüft (gleiche Karte, noch dort), ein Fehlgriff sucht linear nach.
let idIndex = new Map(), idStamp = 0, idEnts = null, idWorld = null, idMiss = new Set();
export function byId(id) {
  if (id == null) return null;
  const now = performance.now();
  if (idEnts !== S.ents || idWorld !== S.ents.world || now - idStamp > 250) {
    idIndex = new Map(); idMiss = new Set(); idStamp = now; idEnts = S.ents; idWorld = S.ents.world;
    for (const m of Object.keys(S.ents)) for (const e of S.ents[m]) idIndex.set(e.id, e);
  }
  // AUDIT P-03: vorher prüfte jeder Treffer auf eine Tote per includes() über ~17 000 Einträge, und jeder Fehlgriff (Beziehung zu
  // einer Weggezogenen, Ziel eines Toten) suchte jedes Mal linear. Jetzt: Treffer gilt bis zum nächsten Neubau (≤ 250 ms), Fehlgriffe
  // werden bis dahin gemerkt.
  const hit = idIndex.get(id);
  if (hit && S.ents[hit.map]) return hit;
  if (idMiss.has(id)) return null;
  for (const m of Object.keys(S.ents)) { const e = S.ents[m].find(x => x.id === id); if (e) { idIndex.set(id, e); return e; } }
  idMiss.add(id); return null;
}
export function partyMembers() { return S.party.map(byId).filter(x => x && x.alive); }

// ---- Speichern ----
const SKIP = new Set(['fx', 'floats', 'projectiles', 'paused', 'uiDirty', '_quiet', '_frozenWar', 'dbg', 'cine', 'coop']);   /* Koop K2: Verbindungszustand wird nie gespeichert */
// Props, die die Generierung aus dem Seed ohnehin wieder erzeugt, werden nicht gespeichert (BUG-057): gespeichert werden nur
// Props mit Abweichung vom Grundzustand (geöffnete Truhe, verschobene Kiste) und die Schlüssel entfernter Props (propsGone).
// Grundzustand = Signatur jedes erzeugten Props direkt nach genWorld/genMine, ohne id (ids vergibt jede Generierung neu).
const PROP_BASE = {};                                        // je Karte: gk → Signatur
const r2 = (k, v) => typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 100) / 100 : v;   // Positionen/Timer: 2 Nachkommastellen genügen
const sig = p => { const { id, ...rest } = p; return JSON.stringify(rest); };   /* Audit D6: ohne Replacer 4× schneller (14 000 Props je Speichern); Props tragen nur ganze Zahlen, Grundzustand und Stand rechnen gleich */
export function setPropBase(map, list) { const B = new Map(); for (const p of list) B.set(p.gk, sig(p)); PROP_BASE[map] = B; }
export function saveData() {
  const out = {}; out.ents = {}; out.propsGone = {};
  for (const k of Object.keys(S)) if (!SKIP.has(k) && k !== 'ents') out[k] = S[k];
  for (const m of Object.keys(S.ents)) {
    if (m.startsWith('__')) continue;                  // Test-/Stilkarten
    const B = PROP_BASE[m], list = S.ents[m].filter(e => !e.transient).map(e => e.coopPilot ? { ...e, coopPilot: null, coopName: null } : e);   /* Koop K2: keine Gastzuordnung im Stand */
    if (!B || !B.size) { out.ents[m] = list; continue; }       // ohne Grundzustand (sollte nicht vorkommen): alles speichern
    const have = new Set();
    out.ents[m] = list.filter(e => { if (e.kind !== 'prop' || !e.gk || !B.has(e.gk) || have.has(e.gk)) return true; have.add(e.gk); return sig(e) !== B.get(e.gk); });
    out.propsGone[m] = [...B.keys()].filter(k => !have.has(k));
  }
  return JSON.stringify(out, r2);
}
// Laden: gespeicherte Liste + erzeugte Props zusammenführen. Reihenfolge: erzeugte Props (bzw. ihre gespeicherte Fassung) zuerst, dann der Rest.
// Ein gespeichertes Prop, dessen Schlüssel die heutige Generierung nicht mehr kennt, bleibt erhalten (Spielerzustand geht vor).
// Hinweis für Migrationen: nach dem Zusammenführen stecken erzeugte Props schon in S.ents — nicht noch einmal aus fresh pushen.
export function mergeProps(map, fresh, goneList) {
  const gone = new Set(goneList), saved = new Map(), rest = [];
  for (const e of S.ents[map]) { if (e.kind === 'prop' && e.gk && !saved.has(e.gk)) saved.set(e.gk, e); else rest.push(e); }
  const out = [];
  for (const p of fresh) { const s = saved.get(p.gk); if (s) { out.push(s); saved.delete(p.gk); } else if (!gone.has(p.gk)) out.push(p); }
  S.ents[map] = [...out, ...saved.values(), ...rest];
}
// Alte Vollstände: ihren Props die Schlüssel der passenden erzeugten Props geben (gleicher Typ, gleiche Kachel), damit ab dem
// nächsten Speichern nur noch Abweichungen geschrieben werden. Was nicht passt, bleibt ohne Schlüssel und wird weiter voll gespeichert.
export function adoptPropKeys(map, fresh) {
  const free = new Map(), list = S.ents[map], used = new Set(list.map(e => e.gk).filter(Boolean));
  for (const p of fresh) if (!used.has(p.gk)) { const b = p.gk.split('#')[0]; (free.get(b) || free.set(b, []).get(b)).push(p.gk); }
  for (const e of list) if (e.kind === 'prop' && !e.gk) {
    const q = free.get(`${e.type}@${e.x / 32 | 0},${e.y / 32 | 0}`);   // 32 = TS (world.js importiert state.js, nicht umgekehrt)
    if (q?.length) e.gk = q.shift();
  }
}
// Audit D6 (§5g.13): Spielstand komprimiert. Format „RFZ1:“ + Bytezahl + „:“ + gzip-Bytes, je 15 Bit in einem Zeichen (+32:
// keine Steuerzeichen, keine Surrogate) — gut 5× kleiner als JSON und 2,5× dichter als Base64. Komprimieren ist asynchron
// (CompressionStream); darum sammelt save() Aufrufe und schreibt einmal im nächsten Leerlauf. Laden bleibt synchron: boot()
// entpackt vorher alle Plätze in UNZ (unpackAll). saveSync() schreibt sofort als JSON (Beenden, beforeunload) — der nächste
// normale Speichervorgang komprimiert wieder. Alte JSON-Stände laden unverändert.
const ZIP = 'RFZ1:', UNZ = new Map();
export function pack(u8) {
  const out = []; let acc = 0, bits = 0;
  for (let i = 0; i < u8.length; i++) { acc = (acc << 8) | u8[i]; bits += 8;
    if (bits >= 15) { bits -= 15; out.push(String.fromCharCode(((acc >> bits) & 0x7fff) + 32)); acc &= (1 << bits) - 1; } }
  if (bits) out.push(String.fromCharCode(((acc << (15 - bits)) & 0x7fff) + 32));
  return u8.length + ':' + out.join('');
}
export function unpack(s) {
  const c = s.indexOf(':'), n = +s.slice(0, c), u8 = new Uint8Array(n); let acc = 0, bits = 0, k = 0;
  for (let j = c + 1; j < s.length && k < n; j++) { acc = (acc << 15) | (s.charCodeAt(j) - 32); bits += 15;
    while (bits >= 8 && k < n) { bits -= 8; u8[k++] = (acc >> bits) & 255; } acc &= (1 << bits) - 1; }
  return u8;
}
export async function zipSave(str) { return ZIP + pack(new Uint8Array(await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer())); }
export async function unzipSave(raw) { return raw?.startsWith(ZIP) ? new Response(new Blob([unpack(raw.slice(ZIP.length))]).stream().pipeThrough(new DecompressionStream('gzip'))).text() : raw; }
// Roher Stand als JSON-Text (entpackt aus UNZ); null, wenn es keinen gibt oder er noch nicht entpackt ist.
export function readRaw(key = SAVE_KEY) { const raw = localStorage.getItem(key); return raw?.startsWith(ZIP) ? UNZ.get(key) ?? null : raw; }
export async function unpackAll() {
  const keys = new Set([SAVE_KEY, LEGACY_KEY, ...Object.keys(slotIndex()).map(slotKey)]);
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^rotfall\./.test(k)) keys.add(k); }   /* auch Sicherungen (…vor-import, backup) */
  for (const k of keys) { const raw = localStorage.getItem(k); if (raw?.startsWith(ZIP) && !UNZ.has(k)) try { UNZ.set(k, await unzipSave(raw)); } catch (e) { console.warn('Spielstand nicht entpackbar', k, e); } }
}
function guardSave() {
  if (S.map && S.map.startsWith('__')) return false;    // Test-/Stilkarten (__a, __style) nie speichern — Spieler stünde im Nichts
  if (S._quiet || S.cine) return false;
  if (!S.player) return false;                                   // S15 Fehlersuche
  if (S.coop?.role === 'guest') return false;                    // Koop K2: der Gast spielt in der Welt des Hosts und speichert nie: im Titelmenü gibt es noch keinen Helden — nie einen leeren Stand über den echten schreiben                           // S12: Selbsttest-Proben (auch Kartenwechsel darin) schreiben nie in den echten Stand
  return true;
}
function saveFail(err) {
  console.warn('Speichern fehlgeschlagen', err);
  log('Spielstand konnte nicht geschrieben werden: ' + err.message + (/quota/i.test(err.message) ? ' — der Browser-Speicher ist voll. Im Titelmenü unter „Spielstände“ einen alten Stand löschen.' : ''), 'world');
}
let saveTimer = 0, saveGen = 0;
export function save() {
  if (!guardSave()) return false;
  if (!saveTimer) saveTimer = setTimeout(flushSave, 0);   /* viele save() im selben Moment = ein Schreibvorgang */
  return true;
}
async function flushSave() {
  saveTimer = 0; if (!guardSave()) return;
  const key = SAVE_KEY, gen = ++saveGen;
  try {
    const str = saveData(), z = typeof CompressionStream === 'function' ? await zipSave(str) : str;
    if (gen !== saveGen || key !== SAVE_KEY) return;     /* inzwischen neuer gespeichert oder Platz gewechselt */
    localStorage.setItem(key, z); if (z !== str) UNZ.set(key, str); else UNZ.delete(key); touchSlot();
  } catch (err) { saveFail(err); }
}
// Sofort und synchron (Beenden, Seite schließen): JSON. Scheitert das am Platz, bleibt der letzte komprimierte Stand stehen.
export function saveSync() {
  if (!guardSave()) return false;
  saveGen++; clearTimeout(saveTimer); saveTimer = 0;
  try { const str = saveData(); localStorage.setItem(SAVE_KEY, str); UNZ.delete(SAVE_KEY); touchSlot(); return true; }
  catch (err) { if (!/quota/i.test(err.message)) saveFail(err); return false; }
}
export function loadRaw() {
  try {
    const raw = readRaw();
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.ver !== SAVE_VERSION) return migrate(data);
    return data;
  } catch (err) { console.warn('Spielstand unlesbar', err); return null; }
}
function migrate(data) {
  // v1 → v2: Die Welt wurde von 128×128 auf 512×512 vergrößert. Alte Positionen und Kriegsknoten
  // passen nicht mehr zur neuen Geometrie, darum wird ein inkompatibler Stand verworfen statt halb geladen.
  if ((data.ver || 1) < 2) { wipeSave(); return null; }
  if (data.ver < 4) { try { localStorage.setItem(SAVE_KEY + '.v' + data.ver + '.backup', readRaw()); } catch (e) {} wipeSave(); return null; }   // S12: Welt neu geordnet — nur neues Spiel
  // v2 → v3: dieselbe Welt (gleicher Seed), nur größer. Positionen rechnet continueGame nach der Weltgenerierung um.
  if (data.ver === 2) (data.flags ||= {}).rescale = true;
  data.ver = SAVE_VERSION; return data;
}
export function applySave(data) {
  for (const k of Object.keys(data)) S[k] = data[k];
  S.fx = []; S.floats = []; S.projectiles = []; S.paused = false;
}
export function hasSave() { return !!localStorage.getItem(SAVE_KEY); }
export function wipeSave() { clearTimeout(saveTimer); saveTimer = 0; saveGen++; localStorage.removeItem(SAVE_KEY); UNZ.delete(SAVE_KEY); }   /* auch ein laufendes Komprimieren verwerfen */
