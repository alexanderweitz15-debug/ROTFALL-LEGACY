// Pixel-Sprite-System. Die Referenzblätter (grimdark, gedrungen, Kapuzen, Masken, zerlumpte Säume) sind die Art Direction.
//
// Regeln — jede neue Figur folgt ihnen:
//   Raster      Humanoide 20×25 Sprite-Pixel (oy = 1 Rand oben), Tiere 28×18 (Pivot x 15), Boss 34×38.
//   Maßstab     PX = 2 Welt-Einheiten je Sprite-Pixel; gezeichnet ohne Glättung (nearest neighbour).
//   Pivot       Fußmitte: Sprite-Punkt (10, 23) liegt auf Welt (e.x, e.y + 6). Hitbox bleibt e.r (Spiellogik unverändert).
//   Proportion  gedrungen: Kopf/Kapuze ≈ 1/3 der Höhe, breite Schultern, kurze Beine — wie die Referenzfiguren.
//   Kontur      1 px OUT (#0c0a08) um jede Silhouette (4er-Nachbarschaft), keine weichen Kanten.
//   Licht       oben links. Rampen: hi / b / sh / dk mit Farbverschiebung (hell → warm, Schatten → kühl violett).
//   Palette     Eingangsfarben werden entsättigt (mute): gedämpfte Erd-, Asche-, Knochen- und Rosttöne, Akzente sparsam.
//   Animation   Idle (2), Walk (4), Ausholen, Schlag, Treffer, Zaubern/Interagieren, Rolle (4 Rotationen), Knien, Liegen.
//   Cache       Jeder Frame wird einmal gemalt und gecacht; pro Bildschirm-Frame nur drawImage.

export const PX = 2;
import { ATLAS } from './ref5_atlas.js?v=24';
import { ITEMS } from './data.js?v=24';   // Nutzer S13: Sprites aus dem Referenzblatt
import { paintHuman, paintWeapon2, paintBeast2, paintBrute as paintBrute2, shoulderOf, FW as FW2, FH as FH2, BEOX, BEOY, BOX, BOY } from './figure.js?v=24';
export { shoulderOf };   // Figuren v2 (Session 9): feines Raster, Referenz-Formensprache
import { paintR, paintTuckR, paintBeastR, paintHorseNSR, octOf, weaponAngle, swingOf, RW, ROX, ROY, RPX, BROX, BROY, DX } from './fig5.js?v=24';   // S14 Stil R: Referenz 5, im Code gezeichnet (optional)
export { octOf, weaponAngle, swingOf };
// Jeder Figuren-Frame trägt Maßstab und Drehpunkt (px: Welt je Pixel, ox/oy: Pivot im Frame) — alte (20×25, px 2) und neue
// Frames (40×60, px 1) laufen so nebeneinander; gezeichnet wird überall über blit().
// Stil D (Session 10): feine Frames werden auf ein gröberes Raster gebracht (COARSE Welt je Pixel) — näher an der pixeligen
// Welt. Nächster-Nachbar-Abtastung, danach wird die Kontur wieder geschlossen (ausgelassene Randpixel).
export const COARSE = 1.5;
// S12 (Nutzer: „feiner und größer“): Figuren, Tiere und Waffen bleiben im feinen Raster (1 Pixel = 1 Einheit) und werden als
// Ganzes um FIGK vergrößert gezeichnet — 1,5-mal mehr Pixel je Figur, 1,2-mal größer. Props und Boden bleiben im groben Raster.
export const FIGK = 1.2;
// BUG-093: ohne CPU-Kopie (cv._px) lief das über drawImage + getImageData — GPU-Rücklesen, 1,5–16 ms je Bild, mitten im Frame.
export function coarse(cv, k = COARSE) {
  const w = Math.round(cv.width / k), h = Math.round(cv.height / k), s = document.createElement('canvas'); s.width = w; s.height = h;
  const c = s.getContext('2d');
  let im;
  if (cv._px) {                                                      // Nächster Nachbar auf der CPU-Kopie (wie drawImage ohne Glättung)
    im = new ImageData(w, h); const src = cv._px, W0 = cv.width, H0 = cv.height;
    for (let y = 0; y < h; y++) { const sy = Math.min(H0 - 1, Math.floor((y + 0.5) * k));
      for (let x = 0; x < w; x++) { const sx = Math.min(W0 - 1, Math.floor((x + 0.5) * k)), si = (sy * W0 + sx) * 4, di = (y * w + x) * 4;
        im.data[di] = src[si]; im.data[di + 1] = src[si + 1]; im.data[di + 2] = src[si + 2]; im.data[di + 3] = src[si + 3]; } }
  } else { c.imageSmoothingEnabled = false; c.drawImage(cv, 0, 0, w, h); im = c.getImageData(0, 0, w, h); }
  const d = im.data, a = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3] > 0 ? (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2] > 75 ? 2 : 1) : 0;   // 2 = Farbe, 1 = Kontur
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (a[i]) continue;
    if ((x > 0 && a[i - 1] === 2) || (x < w - 1 && a[i + 1] === 2) || (y > 0 && a[i - w] === 2) || (y < h - 1 && a[i + w] === 2)) {
      d[i * 4] = 12; d[i * 4 + 1] = 10; d[i * 4 + 2] = 8; d[i * 4 + 3] = 255; } }
  c.putImageData(im, 0, 0); return s;
}
const meta = (f, px, ox, oy) => {
  f.px = px; f.ox = ox; f.oy = oy; return f;   // S12: kein Vergröbern mehr (FIGK)
};
export function blit(c, f, dx, dy) { const px = f.px || PX; c.drawImage(f, dx - (f.ox ?? 10) * px, dy - (f.oy ?? 23) * px, f.width * px, f.height * px); }
const OUT = '#0c0a08';
const DEEP = '#0d0b0a';

// ---------------- Farbe ----------------
function rgb(h) {
  if (!h) return [0, 0, 0];
  if (h[0] === '#') {
    if (h.length === 4) return [parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16), parseInt(h[3] + h[3], 16)];
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  const m = h.match(/\d+/g) || [0, 0, 0];
  return [+m[0], +m[1], +m[2]];
}
const hex = (r, g, b) => '#' + ((1 << 24) | (clamp8(r) << 16) | (clamp8(g) << 8) | clamp8(b)).toString(16).slice(1);
const clamp8 = v => Math.max(0, Math.min(255, Math.round(v)));
export function mix(a, b, t) { const A = rgb(a), B = rgb(b); return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
function mute(h, k = 0.16) { const [r, g, b] = rgb(h), m = (r + g + b) / 3; return hex(r + (m - r) * k, g + (m - g) * k, b + (m - b) * k); }
const rampCache = new Map();
export function ramp(h) {
  let R = rampCache.get(h); if (R) return R;
  const m = mute(h);
  R = { hi: mix(m, '#f2e3c2', 0.24), b: m, sh: mix(m, '#17131c', 0.36), dk: mix(m, '#0c0a0f', 0.62) };
  rampCache.set(h, R); return R;
}

// ---------------- Pixelraster ----------------
export class G {
  constructor(w, h, oy = 0, ox = 0) { this.w = w; this.h = h; this.oy = oy; this.ox = ox; this.a = new Array(w * h).fill(null); }
  p(x, y, c) { y += this.oy; x += this.ox; if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.a[y * this.w + x] = c; }
  r(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, c); }
  at(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.a[y * this.w + x]; }
  flipX() { const n = new G(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) n.a[y * this.w + x] = this.a[y * this.w + (this.w - 1 - x)]; return n; }
  flipY() { const n = new G(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) n.a[y * this.w + x] = this.a[(this.h - 1 - y) * this.w + x]; return n; }
  rotCW() { const n = new G(this.h, this.w); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) n.a[x * n.w + (this.h - 1 - y)] = this.a[y * this.w + x]; return n; }
}
export function toCanvas(g, outline = true) {
  const cv = document.createElement('canvas'); cv.width = g.w; cv.height = g.h;
  const c = cv.getContext('2d');
  const a = g.a.slice();
  if (outline) for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const i = y * g.w + x;
    if (!g.a[i] && (g.at(x - 1, y) || g.at(x + 1, y) || g.at(x, y - 1) || g.at(x, y + 1))) a[i] = OUT;
  }
  const im = new ImageData(g.w, g.h), D = im.data;                   // BUG-093: ein putImageData statt Tausender fillRect; CPU-Kopie für coarse()
  for (let i = 0; i < a.length; i++) { const col = a[i]; if (!col) continue; const q = rgbaOf(col); D[i * 4] = q[0]; D[i * 4 + 1] = q[1]; D[i * 4 + 2] = q[2]; D[i * 4 + 3] = q[3]; }
  c.putImageData(im, 0, 0); cv._px = D;
  return cv;
}
const rgbaCache = new Map();
let probe = null;
function rgbaOf(col) {                                               // Farbstring → [r,g,b,a], einmal je Farbe
  let q = rgbaCache.get(col); if (q) return q;
  if (col[0] === '#' && (col.length === 7 || col.length === 4)) q = [...rgb(col), 255];
  else { probe ||= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    probe.clearRect(0, 0, 1, 1); probe.fillStyle = col; probe.fillRect(0, 0, 1, 1); q = [...probe.getImageData(0, 0, 1, 1).data]; }
  rgbaCache.set(col, q); return q;
}

// ---------------- Stil F (Nutzer S13, Referenz 5: docs/reference/ref5-hauptstil-sprites.png) ----------------
// Neuer Hauptstil: die Sprites aus dem Blatt des Nutzers, 1:1 ausgeschnitten (assets/ref5_atlas.png, Tabelle ref5_atlas.js).
// Der bisherige, im Code gemalte Stil („D“) bleibt in den Optionen wählbar. ART steht in S.settings.art; setArt leert die Caches.
export let ART = 'D';
const artHooks = [];
export const onArtChange = fn => artHooks.push(fn);
export const drawnOn = () => ART === 'R';                          // S14: Stil R (Nutzer: erst nur optional wählbar)
export function setArt(v) {
  v = v === 'R' || v === 'F' ? 'R' : 'D'; if (v === ART) return; ART = v;   /* Audit T05: Stil F (Referenzblatt) abgeschaltet — gespeichertes F wird R; Code bleibt eingefroren */
  frameCache.clear(); lookCache.clear(); WPN.clear(); warmed.clear();
  for (const f of artHooks) f();
}
// ---- Atlas (Referenz 5) ----
const atlasImg = new Image(); let atlasReady = false;
atlasImg.onload = () => { atlasReady = true; frameCache.clear(); warmed.clear(); for (const f of artHooks) f(); };
/* Audit T05: das Atlas-PNG lädt nicht mehr (Stil F ist aus). Zum Wiederbeleben: atlasImg.src = new URL('./assets/ref5_atlas.png', import.meta.url).href; */
export const atlasOn = () => ART === 'F' && atlasReady;
export const APX = 0.95;                                            // Welt-Einheiten je Atlas-Pixel (Figur ~70 px → ~66 Einheiten, dann FIGK)
const atlasCache = new Map();
export function atlasSprite(key) {
  let c = atlasCache.get(key); if (c) return c; const r = ATLAS[key]; if (!r || !atlasReady) return null;
  c = document.createElement('canvas'); c.width = r[2]; c.height = r[3]; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(atlasImg, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
  const d = g.getImageData(0, 0, r[2], Math.max(1, Math.round(r[3] * 0.45))).data; let sx = 0, n = 0;   // Blickrichtung (Tiere): wo liegt der Kopf?
  for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { sx += (i / 4) % r[2]; n++; }
  c._left = n ? sx / n < r[2] / 2 : true; atlasCache.set(key, c); return c;
}
// Posen aus einem Einzelbild: Laufen wippt, Angriff neigt sich in Blickrichtung, Treffer zurück, Knien/Sitzen gestaucht,
// Liegen um 90° gedreht. Menschen schauen im Blatt nach vorn; nach Osten wird gespiegelt. Tiere nach ihrer Kopfseite.
const APOSE = { w0: [0, -2, 0.035], w2: [0, -2, -0.035], a1: [0, 0, -0.14], a2: [3, 0, 0.2], a3: [1, 0, 0.09], hit: [-2, 0, -0.12], cast: [0, -1, 0], guard: [0, 1, 0.05] };
export function atlasPose(key, dir, pose, beast = false) {
  const src = atlasSprite(key); if (!src) return null;
  return cacheGet('A|' + key + '|' + dir + '|' + pose + '|' + (beast ? 1 : 0), () => {
    const W = src.width, H = src.height, flip = beast ? (dir === 'E') === src._left : dir === 'E', sgn = dir === 'W' ? -1 : 1;
    if (pose === 'down' || pose === 'dead') {
      const c = document.createElement('canvas'); c.width = H; c.height = W; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      g.translate(flip ? 0 : H, flip ? W : 0); g.rotate(flip ? -Math.PI / 2 : Math.PI / 2); g.drawImage(src, 0, 0);
      const f = meta(c, APX, H / 2, W); f.atlas = true; return f; }
    const [dx, dy, ang] = APOSE[pose] || [0, 0, 0], sy = pose === 'kneel' || pose === 'sit' ? 0.8 : pose === 'tuck' ? 0.55 : 1;
    const M = Math.ceil(Math.max(W, H) * 0.3), c = document.createElement('canvas'); c.width = W + 2 * M; c.height = H + 2 * M;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.translate(M + W / 2 + dx * sgn, M + H + dy); g.rotate(ang * sgn); g.scale(flip ? -1 : 1, sy); g.drawImage(src, -W / 2, -H);
    const f = meta(c, APX, M + W / 2, M + H); f.atlas = true; return f;
  });
}
// Zuordnung Spielfigur → Sprite aus dem Blatt (Beruf, Fraktion, Gegnerart); Bürger ohne eigenes Bild wechseln je Person
const PROF_ATLAS = { Wache: 'waechter', Torwache: 'waechter', Stadtwache: 'waechter', 'Söldnerwache': 'soeldner', 'Söldner': 'soeldner', 'Ehemaliger Söldner': 'veteran', Ordenswache: 'paladin', 'Alter Paladin': 'paladin',
  Eisenpaladin: 'ritter', Sternenpaladin: 'kleriker', Inquisitor: 'armbrustschuetze', Hochinquisitorin: 'assassine', Sternenprophet: 'schamane', Paladinmarschall: 'veteran', 'Priesterin Omegas': 'schamane',
  Bauer: 'bauer', 'Bäuerin': 'bauer', Magd: 'bauer', Knecht: 'bauer', Schmied: 'handwerker', Schmiedin: 'handwerker', Handwerker: 'handwerker', Koch: 'handwerker', Werkmeister: 'techniker', Fabrikarbeiter: 'techniker',
  Feinmechaniker: 'techniker', 'Magitech-Ingenieurin': 'techniker', Prothesenmacherin: 'techniker', 'Prothesenhändlerin': 'techniker', 'Händler': 'haendler', 'Händlerin': 'haendler', 'Kontorhändler': 'haendler', Kaufherr: 'haendler',
  Hausierer: 'nomade', Reisender: 'nomade', Pilger: 'nomade', Heimkehrer: 'nomade', 'Flüchtling': 'sklave', Bettler: 'sklave', Beschuldigte: 'sklave', Befreite: 'sklave', 'Jäger': 'jaeger', 'Jägerbursche': 'jaeger',
  'Holzfäller': 'waldlaeufer', Fischer: 'hutmann', Heilerin: 'sanitaeter', Heiler: 'sanitaeter', Medica: 'sanitaeter', Pfleger: 'sanitaeter', Magister: 'magier', Gelehrter: 'magier', Archivar: 'magier', Sternkundiger: 'magier',
  Wirt: 'hutmann', Schankmagd: 'rotkappe', Spielmann: 'rotkappe', Edelmann: 'haendler', Edelfrau: 'haendler', Graf: 'ritter', 'Gräfin': 'haendler', 'Sonnenlegionär': 'infanterist', 'Offizier der Sonnenlegion': 'veteran',
  Kettenwache: 'krieger', Kettenkrieger: 'krieger', Aufseher: 'berserker', Streifenwache: 'krieger', Grenzreiter: 'kavallerist', Kundschafter: 'kundschafter', 'Soldat Valens': 'infanterist', Miliz: 'infanterist',
  Verteidigungsmeister: 'veteran', Richterin: 'magier', Gerichtsschreiber: 'magier', Dorfvorsteher: 'hutmann', Paladinmarschall2: 'veteran' };
const CIV_ATLAS = ['mensch', 'bauer', 'hutmann', 'handwerker', 'rotkappe', 'dunkelmann', 'nomade', 'soeldner'];
function humanAtlas(e) {
  if (e.kind === 'player') return 'mensch';
  if (e.goblin) return e.prof && /Krieger|Aufseher/.test(e.prof) ? 'ork' : 'goblin';
  if (e.undead) return 'untoter';
  if (e.robot) return 'scharfschuetze';
  if (e.captive) return 'sklave';
  const p = (e.prof || '').replace(' (versklavt)', '');
  if (PROF_ATLAS[p]) return PROF_ATLAS[p];
  if (e.guard) return e.faction === 'chain' ? 'krieger' : e.faction === 'order' ? 'paladin' : e.faction === 'aurel' ? 'infanterist' : 'waechter';
  return CIV_ATLAS[((((e.seed || 0) * 7919) | 0) >>> 0) % CIV_ATLAS.length];
}
const MON_ATLAS = { acad_student: 'magier', acad_dummy: 'bauer', dodon: 'ork', sea_raider: 'bandit', sea_harpooner: 'speertraeger', whitebeard: 'berserker', goblin: 'goblin', goblin_warrior: 'ork', bandit: 'bandit', bandit_archer: 'bogenschuetze', bandit_spear: 'speertraeger', bounty_hunter: 'assassine', chain_brute: 'berserker', rotgardist: 'krieger',
  kettenschuetze: 'armbrustschuetze', automat: 'scharfschuetze', chain_master: 'veteran', skeleton: 'skelett', crypt_warden: 'skelett', death_captain: 'skelett', hrodvar: 'eisgolem', valen_soldier: 'infanterist',
  cultist: 'schamane', blood_cultist: 'schamane', blood_mage: 'schamane', aldhelm: 'veteran', thrall: 'untoter', chalice_guard: 'ritter', ghoul: 'untoter', wraith: 'untoter', bone_knight: 'skelett', bone_archer: 'skelett', necromancer: 'schamane', zombie: 'untoter', ash_demon: 'feuerelementar', shade: 'dunkelmann',
  flesh_golem: 'riese', death_knight: 'ritter', garmadon: 'daemon', angel_blade: 'kleriker', angel_archer: 'bogenschuetze', gorak: 'riese' };
export const ATLAS_KEYS = () => ATLAS;
// Waffen und Schilde (Stil F): Symbole im Inventar und am Boden aus dem Blatt — erst nach Name, dann nach Waffenart
const ITEM_ATLAS = { longsword: 'w_langschwert', rusty_sword: 'w_kurzschwert', greatsword: 'w_zweihaender', dagger: 'w_dolch', axe: 'w_beil', spear: 'w_speer', halberd: 'w_hellebarde', flail: 'w_streitflegel',
  crossbow: 'w_armbrust', shortbow: 'w_bogen', staff: 'w_stab', wand: 'w_zauberstab', totenglocke: 'w_totenglocke', rotklaue: 'w_rotklaue', schwarzzahn: 'w_schwarzzahn', kettenbrecher: 'w_kettenbrecher',
  eisenfalke: 'w_eisenfalke', roter_henker: 'w_roter_henker', garmadons_reue: 'w_garmadons_reue', nachfrost: 'w_nachfrost', gorak_cleaver: 'w_goraks_hackmesser', mauerbrecher: 'w_mauerbrecher',
  schrott_hellebarde: 'w_schotthellebarde', henkersaxt: 'w_kriegsaxt', kite_shield: 'w_schild', wooden_shield: 'w_schild', buckler: 'w_schild', chain_whip: 'w_kettenbrecher' };
const WTYPE_ATLAS = { sword: 'w_langschwert', rapier: 'w_kurzschwert', dagger: 'w_dolch', axe: 'w_beil', great: 'w_zweihaender', mace: 'w_streitkolben', hammer: 'w_kriegsaxt', spear: 'w_speer',
  polearm: 'w_hellebarde', bow: 'w_bogen', crossbow: 'w_armbrust', staff: 'w_stab', wand: 'w_zauberstab', whip: 'w_streitflegel' };
export function itemAtlas(key, it) { if (!atlasOn()) return null; const k = ITEM_ATLAS[key] || (it?.slot === 'weapon' && WTYPE_ATLAS[it.wtype]) || (it?.slot === 'offhand' ? 'w_schild' : null); return k ? atlasSprite(k) : null; }
// Objekte in Objektgröße aus dem Blatt (nicht aufgeblasen): Brunnen, Schrein, Pumpe, Falle, Belagerungsgerät
export const PROP_ATLAS = { well: 'b_brunnen', shrine: 'b_heiligtum', wayshrine: 'b_heiligtum', spikes: 'u_falle', catapult: 'u_katapult', ballista: 'u_ballista', ram: 'u_rammbock' };
export const BEAST_ATLAS = { wolf: 'wolf', wild_dog: 'wilder_hund', bear: 'baer', boar: 'wildschwein', deer: 'hirsch', bone_hound: 'leichhund', horse: 'hirsch', cow: 'wildschwein', sheep: 'wildschwein' };   // S13: Stil F hat keine eigenen Bilder für Nutz- und Reittiere (nächstes passendes)
// Gebäude (Typ → Bild aus dem Blatt)
export function houseAtlas(b) {
  const T = { cottage: 'b_holzhuette', tavern: 'b_taverne', smithy: 'b_schmiede', barracks: 'b_kaserne', legion: 'b_kaserne', merc: 'b_kaserne', chapel: 'b_kirche', manor: 'b_steinhaus', healer: 'b_steinhaus',
    barn: 'b_getreidespeicher', stable: 'b_bauernhof', store: 'b_handelsposten', kontor: 'b_handelshaus', hall: 'b_handelshaus', bank: 'b_handelshaus', bakery: 'b_werkstatt', fisher: 'b_fischerhuette',
    palace: 'b_festung', court: 'b_festung', markethall: 'b_marktplatz', academy: 'b_kirche', library: 'b_steinhaus', observatory: 'b_burgturm', hospital: 'b_steinhaus', bathhouse: 'b_steinhaus',
    magitech: 'b_werkstatt', factoryhall: 'b_saegewerk' };
  return T[b.type] || ((b.seed || 0) % 2 ? 'b_holzhuette' : 'b_steinhaus');
}
// Weiße Silhouette für den Trefferblitz (einmal je Frame).
const flashCache = new WeakMap();
export function flashOf(cv) {
  let f = flashCache.get(cv); if (f) return f;
  f = document.createElement('canvas'); f.width = cv.width; f.height = cv.height;
  const c = f.getContext('2d'); c.drawImage(cv, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = '#fff1d6'; c.fillRect(0, 0, f.width, f.height);
  flashCache.set(cv, f); return f;
}

// ---------------- Aussehen (Spec → aufgelöste Rampen) ----------------
const SPEC_KEYS = ['sp', 'skin', 'hair', 'cloth', 'pants', 'boots', 'belt', 'hooded', 'hood', 'cloak', 'face', 'glow', 'armor', 'armorCol',
  'helm', 'helmCol', 'crest', 'hs', 'beard', 'robe', 'apron', 'tabard', 'mark', 'markCol', 'strap', 'pouch', 'scarf', 'shield', 'shieldCol', 'quiver', 'glove', 'hem', 'apronCol', 'pauld', 'sash', 'wear', 'blood', 'wseed', 'pack', 'cape', 'wraps', 'stole', 'bd', 'vs', 'hv', 'star', 'charm', 'straw', 'ms', 'pb', 'spk', 'gg', 'fur', 'rn', 'core', 'chn', 'kn', 'capeL', 'ge', 'asy', 'sil', 'stance', 'bare', 'mc', 'ag', 'sc', 'fc', 'trim', 'cw', 'hd', 'cln', 'ctr', 'cfb', 'cfr'];   /* Artist 02.10.: Umhangform, Kapuzenform, Futter, Saum, Fibel, Fransen */
function baseSpec() {
  return { sp: 'human', skin: '#d6b089', hair: '#2b2118', cloth: '#4a3a28', pants: '#2f2519', boots: '#241b13', belt: '#2a2016',
    hooded: 0, hood: '', cloak: '', face: 'human', glow: '', armor: '', armorCol: '', helm: '', helmCol: '', crest: '', hs: 0, beard: 0,
    robe: '', apron: 0, tabard: '', mark: '', markCol: '', strap: 0, pouch: 0, scarf: '', shield: '', shieldCol: '', quiver: 0, glove: '', pauld: '', sash: '', wear: 0, blood: 0, wseed: 0, pack: 0, cape: '', wraps: 0, stole: '', bd: '', vs: 0, hv: 0, star: 0, charm: 0, straw: 0, pb: 0, spk: 0, gg: 0, fur: '', rn: '', core: '', chn: 0, kn: 0, capeL: 0, ge: '', asy: 0, sil: '', stance: 0, bare: 0, mc: '', ag: 0, sc: 0, fc: 0, trim: '', cw: '', hd: '', cln: '', ctr: '', cfb: '', cfr: 0 };
}
const darkOf = c => mix(c, '#16120e', 0.45);

// Bürger je Beruf (Session 10). 'cloth' = eigene Kleidfarbe. hem: Saumhöhe (35 Wams, 39 Kittel, 44 Rock/Mantel).
const CIVIC = {
  Bauer: { hem: 39, pouch: 1 },
  Magd: { robe: 'cloth', apron: 1, apronCol: '#8a8270' },
  'Bürgerin': { robe: 'cloth', helm: 'scarf', helmCol: '#5a5048', scarf: '#4a3a30' },
  'Tagelöhner': { hem: 35, strap: 1 },
  Weber: { hem: 44, scarf: '#6a4a3a' },
  'Böttcher': { apron: 1, glove: '#3a2c20', hem: 35 },
  'Bäcker': { apron: 1, apronCol: '#b8ae98', helm: 'cap', helmCol: '#a8a090', hem: 35 },
  Witwe: { robe: '#1c191c', helm: 'scarf', helmCol: '#141216' },
  /* Nutzer §5d.6: Zwerge der Tiefhall — Bärte, dunkle Stoffe, Leder und Königseisen */
  'König': { beard: 1, cape: '#5a1a1a', tabard: '#1a1a1a', mark: 'quarter', markCol: '#8a2a2a', helm: 'crown', helmCol: '#c8a050', hem: 44 }, Kanzler: { robe: '#2a2a3a', cape: '#1a1a24', beard: 1, hem: 44 },   /* Nutzer §5d.4: Hof König Varons */
  Marschall: { cape: '#3a1a1a', beard: 1, hem: 40 }, Spitzelmeisterin: { hooded: 1, cape: '#1a1a1a', hem: 44 }, Kerkermeister: { apron: 1, apronCol: '#2a2420', glove: '#2a2016', hem: 35 },
  'Zwergenkönig': { beard: 1, cape: '#2a3a6a', tabard: '#1a2440', helm: 'crown', helmCol: '#c8a050', hem: 44 }, 'Runenschmiedin': { apron: 1, apronCol: '#3a2a1c', glove: '#2a2016', hem: 35 },
  'Zwergenhändler': { beard: 1, scarf: '#6a3a2a', hem: 44 }, Braumeister: { beard: 1, apron: 1, apronCol: '#8a7a5a', hem: 35 }, 'Zwergenwache': { beard: 1, helm: 'nasal', helmCol: '#5a5a62', tabard: '#2a3a6a', hem: 40 },
  Bergmann: { beard: 1, helm: 'cap', helmCol: '#6a5a3a', hem: 35 }, Steinmetz: { beard: 1, apron: 1, apronCol: '#7a7468', hem: 35 },
  Graf: { hem: 44, tabard: '#2a2a50', mark: 'quarter', markCol: '#c8a050', cape: '#5a1a2a', beard: 1 }, 'Gräfin': { robe: '#4a1a2a', cape: '#2a2a50', helm: 'scarf', helmCol: '#c8a050' },
  Edelmann: { hem: 44, tabard: '#1f3a3a', mark: 'quarter', markCol: '#b89a50', cape: '#2a2030' }, Edelfrau: { robe: '#2a3a4a', cape: '#5a3a2a', helm: 'scarf', helmCol: '#b89a50' },
  Kaufherr: { hem: 44, cape: '#3a2a1a', helm: 'wide', helmCol: '#2a2018', pouch: 1, strap: 1 }, Feinmechaniker: { apron: 1, apronCol: '#4a4038', glove: '#3a2c20', pouch: 1, hem: 35 },
  Kybernetiker: { robe: '#c8c0b0', apron: 1, apronCol: '#6a2020', glove: '#3a3a3a' }, Medica: { robe: '#b8b0a0', stole: '#6a2420' }, Prothesenhändlerin: { robe: 'cloth', apron: 1, apronCol: '#5a4a3a', pouch: 1 },
  Gelehrter: { robe: '#2a2a3a', hooded: 1, hood: '#2a2a3a', stole: '#b89a50' }, Prothesenmacherin: { apron: 1, apronCol: '#5a3a2a', glove: '#8a7040', strap: 1 },
  Priester: { robe: '#3a3026', hooded: 1, hood: '#2e2620', stole: '#6a2420', hs: 2 },   // Referenz 3: Kutte, Kapuze, rote Stola
  Kaufmann: { hem: 44, scarf: '#6a5a44', pouch: 1, helm: 'wide', helmCol: '#2a2420', cape: '#4a2a3a' },
  Ratsherr: { hem: 44, tabard: '#44202a', mark: 'quarter', markCol: '#a88a48', cape: '#2a1418', beard: 1 },   // Adel: gevierter Wappenrock, Umhang
  Lagerknecht: { hem: 35, strap: 1, pouch: 1 },
  Kesselflicker: { helm: 'wide', helmCol: '#3a2e22', strap: 1, pouch: 1 },
  Wirt: { apron: 1, apronCol: '#8a8270', hem: 35, beard: 1 },
  Handwerker: { apron: 1, hem: 35 },
  Stallknecht: { hem: 35, helm: 'cap', helmCol: '#4a3a2a' },
  Fischer: { hooded: 1, hood: '#34443a', cloak: '#28342c', hem: 44 },
  Netzflickerin: { robe: 'cloth', helm: 'scarf', helmCol: '#6a6250', apron: 1, apronCol: '#5a5040' },
  Spielfrau: { hooded: 1, hood: '#5a2230', cloak: '#3a1820', robe: 'cloth' },
  Alchemist: { robe: '#26302e', pouch: 1, strap: 1 },
  'Händlerin': { robe: 'cloth' },
  // §5d.1 Leute der Eisenfeste (Nutzer §5b: mehr Vielfalt) — jeder Stand an der Silhouette erkennbar
  Drillmeister: { beard: 1, cape: '#3a1114', scarf: '#5a1a1c', hs: 2 }, Zuchtmeister: { hooded: 1, hood: '#141012', face: 'cloth', glove: '#2a1a14', strap: 1 },
  'Sklavenhändler': { hem: 44, cape: '#4a2a1a', helm: 'wide', helmCol: '#2a1a14', pouch: 1, strap: 1, beard: 1, charm: 1 },
  'Schreiber der Kette': { robe: '#2a2622', stole: '#5a1a1c', hooded: 1, hood: '#1e1a18', pouch: 1 },
  Kettenpriester: { robe: '#2a0e10', hooded: 1, hood: '#1a0a0c', stole: '#8a1a1c', chn: 1 },
  'Hochpriester der Kette': { robe: '#1e0a0c', stole: '#b02a20', hooded: 1, hood: '#140608', chn: 1, cape: '#3a0e10' },
  Soldatenfrau: { robe: 'cloth', helm: 'scarf', helmCol: '#4a3a30', apron: 1, apronCol: '#6a5a48' }, Soldatenkind: { hem: 35, scarf: '#5a1a1c' },
  Quartiermeister: { hem: 44, apron: 1, apronCol: '#3a3026', pouch: 1, strap: 1, beard: 1 }, Feldscher: { robe: '#8a8070', apron: 1, apronCol: '#7a2a20', glove: '#5a2a20', pouch: 1 },
  'Waffenschmied der Kette': { apron: 1, apronCol: '#2a2420', glove: '#3a2c20', beard: 1, hs: 2 },
  Kettenkrämerin: { robe: 'cloth', scarf: '#5a1a1c', pouch: 1 }, Marketenderin: { robe: 'cloth', apron: 1, apronCol: '#8a7a60', helm: 'scarf', helmCol: '#6a5040' },
  Käufer: { hem: 44, cape: '#3a2a3a', helm: 'wide', helmCol: '#2a2018', pouch: 1 }, Käuferin: { robe: '#3a2a3a', cape: '#2a2018', helm: 'scarf', helmCol: '#5a4a3a', pouch: 1 },
  'Meister der Kettenjäger': { hooded: 1, hood: '#2a2218', cloak: '#1e1a14', quiver: 1, fur: '#3a2e22', strap: 1 },
  'Henker der Kette': { hooded: 1, hood: '#141012', face: 'cloth', apron: 1, apronCol: '#3a1a14', glove: '#2a1a14' },
  Kettenbardin: { robe: 'cloth', sash: '#5a1a1c', strap: 1, charm: 1 },
  'Gefangene im Pferch': { robe: '#3a3530', wraps: 1 }, 'Am Schandpfahl': { bare: 1, wraps: 1 },
  'Sprecherin der Freien Feste': { robe: 'cloth', scarf: '#6a8a5a', pouch: 1 }, 'Hauptmann der Garnison': { cape: '#2f4260', beard: 1 },
};
// S12 Automaten des Hochreichs: Messingpanzer, Maskengesicht, bernsteinfarbene Augen
const ROBOT_LOOK = { skin: '#8a8272', hair: '#8a8272', hs: 2, beard: 0, face: 'mask', glow: '#8a5420', armor: 'plate', armorCol: '#7a6038', pauld: '#8a7040', helm: 'great', helmCol: '#8a7a58',
  crest: '', hooded: 0, cloak: '', robe: '', cape: '', glove: '#5a5248', boots: '#3a3630', pants: '#4a4640', tabard: '#2a2a30', mark: 'chevron', markCol: '#c8a050', wraps: 0, pouch: 0, strap: 0, sil: 'boiler' };
// S12: Rüstungsbild je Teil (Material, Farbe, Schulterstücke, Schärpe, Helm). Neue Rüstung = eine Zeile hier.
const ARMOR_LOOK = {
  eisenwache: { armor: 'chain', armorCol: '#2a2a2e', sash: '#5a1a1c', pb: 1 },
  rotgardist: { armor: 'plate', armorCol: '#26272b', pauld: '#4a1418', pb: 2, gg: 1, kn: 1 },
  aufsehermantel: { armor: 'leather', armorCol: '#1e1a18', glove: '#4a1418', scarf: '#4a4640', hem: 44 },
  tiefenschuerfer: { armor: 'leather', armorCol: '#4a3e30', pauld: '#5a5650', glove: '#3a2c20' },
  kettenkoloss: { armor: 'chain', armorCol: '#3e3c38', strap: 1, glove: '#2a2622', pb: 1, chn: 1 },
  plattenmantel: { armor: 'plate', armorCol: '#4a4640', hem: 44, pauld: '#3a3834', pb: 1, gg: 1 },
  pluendererharnisch: { armor: 'leather', armorCol: '#4a3a2a', pauld: '#6a665e', strap: 1, pouch: 1 },
  grenzlaeufer: { armor: 'leather', armorCol: '#3e3a2c', strap: 1, pouch: 1 },
  legionaersplatte: { armor: 'plate', armorCol: '#5a4636' },
  kronharnisch: { armor: 'plate', armorCol: '#3a4a66', tabard: '#2f4260', mark: 'chevron', markCol: '#b9c3d2' }, kronhelm: { helm: 'nasal', helmCol: '#5a5852', crest: '#3a5a9a' },   // S13: Fraktionssets
  totenrufer_kapuze: { hooded: 1, hood: '#141a18', helm: '' }, gewand_stille_schar: { robe: '#161c18', stole: '#1a2420', charm: 1, rn: '#8fd9b0', pauld: '#b8b09a', asy: 1, pb: 1, sil: 'collar' },   // S15 Klassen-Rüstung
  grabsteinkragen: { cloak: '#101512', sil: 'collar motes', mc: '#8fd9b0' },
  todesritter_helm: { helm: 'great', helmCol: '#22262e', crest: '#6fd8ff', ge: '#6fd8ff' },   // S15 P19: Eidwacht (Todesritter)
  todesritter_harnisch: { armor: 'plate', armorCol: '#20242c', pauld: '#3a4250', pb: 2, spk: 1, rn: '#6fd8ff', kn: 1, glove: '#2a2e36', tabard: '#12141a' },
  todesritter_mantel: { cloak: '#10161e', capeL: 1, sil: 'flames', mc: '#6fd8ff' },
  hoernerkrone: { hooded: 1, hood: '#1e1624', helm: '', sil: 'horns' }, robe_fluesternder: { robe: '#221a2a', sash: '#4a2a5e', rn: '#b07ae0', core: '#c890ff' }, schattenmantel: { cloak: '#140f18', sil: 'motes', mc: '#c890ff' },
  hainfell: { fur: '#5a4a30', wraps: 1, armor: 'leather', armorCol: '#4a3a26' }, fellmantel_hain: { cloak: '#3e3222', capeL: 1 }, geweih_hirsch: { helm: '', sil: 'antlers' },
  gebetsband: { helm: '', hs: 2, charm: 1 }, robe_stille_hand: { sash: '#e6cf8a', stole: '#d9d2c0', bare: 1, stance: 1, wraps: 1 }, wickel_stille_hand: { wraps: 1, sil: 'motes', mc: '#e6cf8a' },
  ordensharnisch: { armor: 'chain', armorCol: '#8a8880', tabard: '#d9d2c0', mark: 'cross', markCol: '#9b2e26' }, ordenshelm: { helm: 'great', helmCol: '#b9b19c' },
  sonnenharnisch: { armor: 'plate', armorCol: '#a8843a', pauld: '#c8a050', sash: '#e0c070' }, sonnenhelm: { helm: 'great', helmCol: '#c8a050', crest: '#e0c070' },
  eisenfuerst: { armor: 'plate', armorCol: '#1e1f22', pauld: '#4a1418', sash: '#3a1114', pb: 2, spk: 1, gg: 1, kn: 1, cloak: '#2a0c0e' },
  // S14 Endgame-Sets (Nutzer: „krass, imposant, breite Schultern“): pb Schulterplatten 1 groß / 2 riesig, spk Dornen, gg Halsberge, fur Pelzkragen,
  // rn Runen (Leuchtfarbe), core Magitech-Kern, chn Ketten über der Brust, kn Kniekacheln, capeL langer Umhang, ge Augenglühen im Helm, asy asymmetrisch
  thronharnisch: { armor: 'plate', armorCol: '#2a3e6a', pauld: '#c8a040', pb: 2, gg: 1, rn: '#7ad0ff', core: '#6ae0ff', cloak: '#1e3060', capeL: 1, tabard: '#243a70', mark: 'chevron', markCol: '#e0c070', kn: 1, glove: '#c8a040' },
  thronhelm: { helm: 'mech', helmCol: '#c8a040', ge: '#6ab8ff' },
  blutkette: { armor: 'plate', armorCol: '#1a1a1e', pauld: '#5a1418', pb: 2, spk: 1, gg: 1, chn: 1, fur: '#3a2a22', cloak: '#3a0e10', capeL: 1, rn: '#d23a2a', kn: 1, glove: '#2a2426' },
  blutkettenhelm: { helm: 'horned', helmCol: '#1c1c20', ge: '#ff3a20' },
  sternwacht: { armor: 'plate', armorCol: '#2a2420', pauld: '#b8903a', pb: 1, gg: 1, tabard: '#6a1a14', mark: 'star', markCol: '#e8c060', cloak: '#5a1010', capeL: 1, rn: '#ffd070', kn: 1 },
  sternwachthelm: { helm: 'crown', helmCol: '#3a3028', ge: '#ffd070' },
  totenkrone: { armor: 'plate', armorCol: '#2a2e2a', pauld: '#8a8470', pb: 2, spk: 1, rn: '#6affb0', cloak: '#1a1420', capeL: 1, kn: 1, glove: '#3a3a34' },
  schaedelhelm: { helm: 'skull', helmCol: '#cfc6b0', ge: '#6affb0' },
  grubenkoenig: { armor: 'leather', armorCol: '#4a3a28', pauld: '#6a5a44', pb: 2, asy: 1, fur: '#5a4a30', chn: 1, kn: 1, glove: '#4a3a28' },
  schrotthelm: { helm: 'horned', helmCol: '#6a5a44' },
  generalspanzer: { armor: 'plate', armorCol: '#2a1e1a', pauld: '#5a1a14', pb: 1, gg: 1, cloak: '#5a1a14', capeL: 1, fur: '#2a221a', kn: 1 },
  generalshelm: { helm: 'visor', helmCol: '#3a2a24', ge: '#ff5a3a' },
  hochritter: { armor: 'plate', armorCol: '#3a4a66', pauld: '#9aa6b8', pb: 1, gg: 1, tabard: '#2f4260', mark: 'chevron', markCol: '#b9c3d2', cloak: '#1e2a44', capeL: 1, kn: 1 },
  federhelm: { helm: 'plume', helmCol: '#8a94a4', crest: '#3a5a9a' },
  meisterharnisch: { armor: 'plate', armorCol: '#b8b09c', pauld: '#d9d2c0', pb: 1, gg: 1, tabard: '#d9d2c0', mark: 'cross', markCol: '#9b2e26', cloak: '#e8e0cc', capeL: 1, kn: 1 },
  meisterhelm: { helm: 'crown', helmCol: '#c8c0aa', crest: '#9b2e26' },
  letzte_wache: { armor: 'plate', armorCol: '#5e5044', tabard: '#2a3448', mark: 'chevron', markCol: '#8a8a80' },
  rotgardistenhelm: { helm: 'great', helmCol: '#1e1f22', crest: '#5a1a1c' },
  bergmannshelm: { helm: 'cap', helmCol: '#5a5650' },
  eisenfuersthelm: { helm: 'great', helmCol: '#18181a', crest: '#3a1114' },
};
// S12: Leute der Kette sehen nicht geklont aus — Schulterstück, Schärpe, Maske, Umhang je nach Person (seed)
// Nutzer (Dauerauftrag, PLAN_ROADMAP §5b): mehr Vielfalt bei Goblins und Untoten. Varianten kommen aus dem Seed der Figur,
// damit jede nach dem Laden gleich aussieht. Nur Felder aus SPEC_KEYS (Frame-Cache); je Art wenige Stufen, damit der Cache klein bleibt.
const pickH = (arr, h, k) => arr[Math.abs((h >> (k * 3)) | 0) % arr.length];
/* Artist Runde 6: gut gemischter Hash aus dem Seed (h >> 15 war bei Seeds 0–100 fast immer 0) */
const mixH = (seed, salt) => { let n = Math.imul(((seed * 1000) | 0) ^ salt, 2654435761); n ^= n >>> 15; n = Math.imul(n, 2246822519); return (n ^ (n >>> 13)) >>> 0; };
// Nutzer §5f: Varianten für alle. Automaten: Metall (Messing, Stahl, Kupfer, geschwärzt), Verschleiß, Leuchtfarbe. Engel: Goldtöne,
// Mantel, Lichtfarbe. Bewohner: graues Haar im Alter, Hut/Kappe/Tuch, geflickte Kleidung. Wachen: Wappenfarbe je Stadt.
function varyMachine(s, seed) {
  const h = (seed * 1231) | 0, M = pickH([['#7a6038', '#8a7a58', '#8a7040'], ['#6a6a70', '#7a7a82', '#5a5a62'], ['#8a5436', '#9a6a44', '#7a4a2e'], ['#2e2c2a', '#3a3834', '#4a4238']], h, 0);
  Object.assign(s, { armorCol: M[0], helmCol: M[1], pauld: M[2], glow: pickH(['#8a5420', '#3a9ad8', '#9ad05a', '#d8b03a', '#c85a3a'], h, 1), wear: pickH([0, 0, 1, 2], h, 2), markCol: pickH(['#c8a050', '#b9c3d2', '#8a2a2a'], h, 3) });
}
function varyAngel(s, seed) {
  const h = (seed * 733) | 0;
  Object.assign(s, { armorCol: pickH(['#d8c080', '#e0cc90', '#c8a860', '#d8d0b8'], h, 0), cloak: pickH(['#e8dcc0', '#dce4ec', '#f0e8d8', '#e0d0b0'], h, 1), tabard: pickH(['#f4ecd8', '#e8eef4', '#f8f0e0'], h, 2),
    glow: pickH(['#ffe8a0', '#bfe0ff', '#ffd27a', '#f0f0ff'], h, 3), markCol: pickH(['#c8a040', '#8ab0d8', '#d8a860'], h, 4) });
}
const TOWN_MARK = ['#b9c3d2', '#d8c070', '#c8c4bc', '#9ac0d8', '#d88a5a', '#a8d0a0'];
function varyCivil(s, e, prof) {
  const h = (((e.seed || 0) * 409) | 0), armored = s.armor || s.robe && s.helm;
  if ((e.age || 30) >= 55) s.hair = pickH(['#b8b4ac', '#8a8680', '#d8d4cc'], h, 0);
  if (s.tabard && e.homeTown && e.faction === 'valen') { let t = 0; for (const ch of e.homeTown) t = (t * 31 + ch.charCodeAt(0)) | 0; s.markCol = TOWN_MARK[Math.abs(t) % TOWN_MARK.length]; }
  if (armored || s.tabard) return;
  const v = Math.abs(h >> 4) % 10;
  if (!s.helm && !s.hooded && v < 2) { s.helm = pickH(['hat', 'cap', 'scarf', 'wide'], h, 2); s.helmCol = s.helmCol || pickH(['#3a2c20', '#5a4a36', '#4a3a2a', '#6a5a40'], h, 3); }
  if (!s.scarf && v >= 2 && v < 4) s.scarf = pickH(['#7a3a2a', '#3a5a6a', '#6a6a3a', '#5a3a5a', '#8a6a2e'], h, 4);
  if (v === 9) s.wear = Math.max(s.wear || 0, 1);
}
function varyGoblin(s, t, seed) {
  const h = (seed * 977) | 0;
  s.skin = pickH(['#556b34', '#4a6a3a', '#6a7a3a', '#5a5a3e', '#3e5a44', '#6b6a44'], h, 0);   // Moosgrün, Olive, Lehmgrau, Sumpfgrün
  s.bd = pickH(['', 'drahtig', 'gedrungen', '', 'drahtig'], h, 1);
  s.cloth = pickH(['#3a2e1e', '#4a3a24', '#2e2a1e', '#3e3222', '#4a2e1e'], h, 2);
  if (t === 'goblin') {
    const look = Math.abs(h >> 9) % 6;
    if (look === 1) Object.assign(s, { helm: 'cap', helmCol: pickH(['#5a4e40', '#6b6156', '#4a3a2a'], h, 4) });   // Blechkappe
    else if (look === 2) Object.assign(s, { hooded: 1, hood: pickH(['#3a2e1e', '#2e3a24', '#4a3a28'], h, 4), cloak: '#2a2418' });   // Späher mit Kapuze
    else if (look === 3) Object.assign(s, { fur: pickH(['#4a3a26', '#6a5a3a', '#3a2e22'], h, 4) });   // Fellkragen
    else if (look === 4) Object.assign(s, { mark: 'chevron', markCol: pickH(['#8a2a20', '#c8bca0', '#6a8a3a'], h, 4), sash: '#6a2a1c' });   // Kriegsbemalung
    else if (look === 5) Object.assign(s, { armor: 'leather', armorCol: '#4a3a28', strap: 1, pouch: 1 });   // Plünderer mit Riemen
    if (!s.scarf && look !== 2 && Math.abs(h >> 13) % 3 === 0) s.scarf = pickH(['#5a4a30', '#6a2a1c', '#4a4a3a'], h, 5);   /* Artist Runde 4: Lumpentuch um den Hals */
  } else if (t === 'goblin_warrior') {
    const look = Math.abs(h >> 9) % 4;
    if (look === 1) Object.assign(s, { helm: 'horned', helmCol: '#4a4038', pauld: '#c8bca0' });   // Hörnerhelm, Knochenschulter
    else if (look === 2) Object.assign(s, { armor: 'chain', armorCol: '#5a5650', shield: '', fur: '#4a3a26' });   // erbeutetes Kettenhemd
    else if (look === 3) Object.assign(s, { helm: 'nasal', helmCol: '#6a6258', shieldCol: '#5a2a1c', markCol: '#8a2a20' });
  }
  /* Artist Runde 6 (Nutzer §5b): weitere Goblin-Grundformen — Tierschädel, Strohumhang, Schrott-Schulterplatten mit Dornen */
  const h2 = mixH(seed, 97), l2 = h2 % 7;
  if (t === 'goblin') {
    if (l2 === 5) Object.assign(s, { hooded: 0, helm: 'skull', helmCol: '#c8bca0', charm: 1 });                                /* Schädelträger mit Knochenamulett */
    else if (l2 === 6) Object.assign(s, { hooded: 1, hood: '#6a5c3c', cloak: '#5a4a2a', straw: 1, helm: '' });                  /* Sumpfgänger im Strohumhang */
  } else if (t === 'goblin_warrior') {
    s.shieldCol = pickH(['#3d2f20', '#5a2a1c', '#2e3a24', '#4a4038'], h2, 1);
    if (l2 === 4) Object.assign(s, { pauld: '#5a5650', pb: 1, spk: 1, asy: 1 });                                               /* Schrottplatte mit Dornen */
    else if (l2 === 5) Object.assign(s, { helm: 'skull', helmCol: '#c8bca0', fur: '#4a3a26', chn: 1 });                         /* Schädelhelm, Beutekette */
    else if (l2 === 6) Object.assign(s, { helm: '', hs: 1, mark: 'chevron', markCol: '#8a2a20', sash: '#6a2a1c', bare: 1, armor: '' });   /* Berserker: bemalt, ohne Rüstung */
  }
}
// Nutzer §5f: Banditen und Söldner — Masken, Tücher, Beutestücke (fremde Helme, Schulterplatten), verschiedene Mäntel
function varyBandit(s, t, seed) {
  const h = (seed * 571) | 0, look = Math.abs(h >> 9) % 7;
  s.skin = pickH(['#b2926f', '#c8a07a', '#8d6644', '#d6b089', '#6d4a30'], h, 0);
  s.bd = pickH(['', 'drahtig', 'bullig', '', 'gedrungen'], h, 1);
  if (s.hooded) { s.hood = pickH(['#2e241a', '#2f3a24', '#3a2a22', '#1e1c1a', '#4a3a26'], h, 2); s.cloak = pickH(['#261e16', '#26301d', '#2a1e1a', '#1a1816'], h, 3); }
  if (look === 1) Object.assign(s, { hooded: 0, face: 'mask', helm: 'cap', helmCol: '#5a4e40' });         // Maske und Kappe
  else if (look === 2) Object.assign(s, { hooded: 0, helm: 'nasal', helmCol: '#7a7874', pauld: '#6a6a66' });   // erbeuteter Soldatenhelm
  else if (look === 3) Object.assign(s, { scarf: pickH(['#7a2a20', '#b8a070', '#2a4a6a', '#4a6a2a'], h, 4) });   // buntes Halstuch
  else if (look === 4) Object.assign(s, { fur: pickH(['#4a3a26', '#6a5a3a'], h, 4), armor: 'leather', armorCol: '#3a2a1c' });   // Fellkragen
  else if (look === 5) Object.assign(s, { hooded: 0, helm: 'hat', helmCol: '#2a2622', beard: 1 });   // Hut und Bart
  else if (look === 6) Object.assign(s, { armor: 'chain', armorCol: '#5a5a56', sash: '#5a1a1c' });   // Söldner im Kettenhemd
  /* Artist Runde 6 (Nutzer §5f „Narben“): Gesichter der Räuber — Narbe, Stoppeln, Augenklappe; selten kahl mit Schulterbeute */
  const h2 = mixH(seed, 53), l2 = h2 % 6;
  if (!s.hooded && s.face !== 'mask') { s.sc = (h2 >> 4) % 4; s.beard = s.beard || pickH([0, 2, 1, 3, 2], h2, 2); }
  if (l2 === 5) Object.assign(s, { hooded: 0, helm: '', face: 'human', hs: 1, pauld: '#6a665e', pb: 1, asy: 1, sc: 1 + (h2 >> 8) % 3 });   /* kahl, eine erbeutete Schulterplatte */
}
function varyUndead(s, t, seed) {
  const h = (seed * 613) | 0;
  if (s.sp === 'skeleton') s.skin = pickH(['#cfc8b4', '#d8d0b0', '#b8ae96', '#a8a498', '#c8b890', '#9a9488'], h, 0);   // Elfenbein, vergilbt, grau, erdig
  if (!s.glow || s.glow === '#4e8f7a') s.glow = pickH(['#4e8f7a', '#4e8f7a', '#6fb04a', '#5a8ac8', '#8fe0b0', '#c05a3a'], h, 1);   // meist Grün-Türkis, selten Blau, Rot
  s.bd = pickH(['', 'drahtig', '', 'gedrungen', 'drahtig'], h, 2);
  const look = Math.abs(h >> 9) % 6;
  if (t === 'skeleton') {
    if (look === 1) Object.assign(s, { hooded: 0, helm: 'cap', helmCol: pickH(['#5a4e40', '#6a5a44', '#4a4640'], h, 4) });   // rostige Kappe
    else if (look === 2) Object.assign(s, { hooded: 0, armor: 'chain', armorCol: '#4a4a46', tabard: pickH(['#2a1416', '#1c2230', '#2a2a1c'], h, 4) });   // Reste einer Rüstung
    else if (look === 3) Object.assign(s, { hooded: 0, helm: '', shield: 'round', shieldCol: '#3a3228' });   // barhäuptig mit Schildrest
    else if (look === 4) Object.assign(s, { hood: pickH(['#2a1a1a', '#1a2a24', '#2a2a30'], h, 4), cloak: '#141214' });   // andere Leichentücher
    else if (look === 5) Object.assign(s, { hooded: 0, helm: 'nasal', helmCol: '#5a6068', pauld: '#3a3e44' });   // gefallener Soldat
  } else if (t === 'zombie' || t === 'ghoul') {
    s.cloth = pickH(['#3a3024', '#2e3a2a', '#3a2a2a', '#2a2a30', '#4a3a28'], h, 3);   // verschiedene Totenhemden
    s.pants = pickH(['#2e281e', '#2a2a24', '#3a2e24'], h, 4);
    if (look === 1) Object.assign(s, { apron: 1, apronCol: '#5a5040' });   // Handwerker
    else if (look === 2) Object.assign(s, { hooded: 1, hood: '#2a2620' });  // Bettler mit Kapuze
    else if (look === 3) Object.assign(s, { armor: 'chain', armorCol: '#4a463e' });   // Söldner
    else if (look === 4) Object.assign(s, { robe: s.cloth, stole: '#4a1418' });   // Priesterrock
  } else if (t === 'bone_archer') {
    if (look % 2) Object.assign(s, { hooded: 0, helm: 'cap', helmCol: '#4a4640' });
    if (look >= 3) s.cloak = pickH(['#1a1c20', '#2a1a14', '#1a2a20'], h, 4);
  }
  /* Artist Runde 6 (Nutzer §5b: „immer mehr Varianten für Untote“): weitere Grundformen je Art, alles fest aus e.seed */
  const h2 = mixH(seed, 61), l2 = h2 % 8;
  if (t === 'skeleton') {
    if (l2 === 6) Object.assign(s, { hooded: 0, helm: 'horned', helmCol: '#4a4038', fur: pickH(['#4a3a26', '#3a2e22'], h2, 1), armor: '' });   /* toter Nordmann: Hörnerhelm, Fellkragen */
    else if (l2 === 7) Object.assign(s, { hooded: 0, helm: '', robe: pickH(['#2a2620', '#1e1a24', '#2a1a1a'], h2, 1), stole: '#4a1418', charm: 1, armor: '' });   /* toter Priester: Kuttenrest, Stola, Knochenamulett */
    else if (l2 === 5 && !s.hooded) s.chn = 1;   /* rostige Kette quer über der Brust */
  } else if (t === 'zombie' || t === 'ghoul') {
    const base = s.skin || '#7e8a64';
    s.skin = mix(base, pickH(['#9aa070', '#6a6a5a', '#7a5a4a', '#b8b49a', '#5a6a4a'], h2, 1), 0.45);   /* Verwesungsfarbe: aufgedunsen, grau, braun, bleich, moosig */
    if (l2 === 5) Object.assign(s, { bare: 1, armor: '', robe: '', apron: 0, hooded: 0 });   /* Hemd längst verrottet: nackter Oberkörper */
    else if (l2 === 6) Object.assign(s, { hooded: 0, helm: pickH(['wide', 'scarf', 'hat'], h2, 2), helmCol: pickH(['#5a4a2e', '#4a3a2a', '#3a342a'], h2, 3) });   /* toter Bauer: Hut oder Kopftuch */
    else if (l2 === 7) Object.assign(s, { hooded: 0, helm: 'nasal', helmCol: '#5a5048', armor: 'chain', armorCol: '#4a463e', tabard: pickH(['#2a3a5a', '#3a1a1a', '#2a2a1c'], h2, 2) });   /* gefallener Soldat mit Wappenrest */
  } else if (t === 'bone_archer') {
    if (l2 === 2 || l2 === 6) Object.assign(s, { hooded: 0, helm: 'nasal', helmCol: '#5a6068', armor: 'leather', armorCol: '#3a3228' });   /* Schütze der alten Garde */
    else if (l2 === 4) Object.assign(s, { hooded: 0, helm: '', scarf: pickH(['#4a1418', '#2a3a2a', '#3a3a44'], h2, 2) });   /* barhäuptig mit Tuchfetzen */
    else if (l2 === 7) Object.assign(s, { hood: pickH(['#2a1a1a', '#1a2a24', '#2a2a30'], h2, 2), cloak: '#141214', fur: '#3a2e22' });
  }
}
/* Artist Runde 6: Untote, die bisher nur ein Aussehen hatten (Geist, Schattenwesen, Knochenritter, Wächter, Nekromant, Koloss) */
function varyDead(s, t, seed, own) {
  const h = (seed * 829) | 0, look = Math.abs(h >> 9) % 4;
  if (t === 'wraith') {
    const V = pickH([['#aab4c0', '#8a96a4'], ['#a8b8a0', '#7a8c74'], ['#9c9a94', '#76746e'], ['#b0a8c0', '#8a80a0']], h, 0);   /* Schleier: bleichblau, grabgrün, aschgrau, dämmerviolett */
    Object.assign(s, { hood: V[0], cloth: V[0], pants: V[0], cloak: V[1] });
    if (!own) s.glow = pickH(['#cfe6ff', '#cfe6ff', '#a8f0c8', '#e8d0ff'], h, 1);
    if (look === 1) Object.assign(s, { chn: 1, wraps: 1 });                                       /* gebundene Seele in Ketten */
    else if (look === 2) Object.assign(s, { sil: 'motes', mc: s.glow, capeL: 1 });                /* Irrlicht: schwebende Funken, langer Schleier */
    else if (look === 3) Object.assign(s, { hooded: 0, helm: 'crown', helmCol: '#8a8470', capeL: 1 });   /* gekrönter Geist eines alten Herrn */
  } else if (t === 'shade') {
    if (!own) s.glow = pickH(['#9a7ae0', '#c03a3a', '#5a9ae0', '#8ad05a'], h, 0);
    if (look === 1) Object.assign(s, { sil: 'motes', mc: s.glow });
    else if (look === 2) Object.assign(s, { sil: 'horns', capeL: 1 });                              /* gehörnter Schatten */
    else if (look === 3) Object.assign(s, { sil: 'flames', mc: s.glow, hood: '#16121e' });          /* Schatten mit Seelenflammen */
  } else if (t === 'bone_knight') {
    const C = pickH([['#1a1d22', '#7fd0b8'], ['#2a1416', '#c05a3a'], ['#1c2a1e', '#9fd06a'], ['#24202e', '#b07ae0']], h, 0);
    Object.assign(s, { tabard: C[0], markCol: C[1], shield: pickH(['heater', 'round', 'kite', 'heater'], h, 1), shieldCol: pickH(['#2a2e34', '#3a2a22', '#2a2a24'], h, 2) });
    if (look === 1) Object.assign(s, { helm: 'great', helmCol: '#4a4f55', armor: 'plate', armorCol: '#3d4247' });        /* Topfhelm, Plattenreste */
    else if (look === 2) Object.assign(s, { helm: 'horned', helmCol: '#3a3632', pauld: '#c8bca0', fur: '#3a2e22' });     /* Hörnerhelm, Knochenschulter */
    else if (look === 3) Object.assign(s, { helm: 'skull', helmCol: '#cfc6b0', cloak: '#141214', armor: 'plate', armorCol: '#4a4038' });   /* Schädelkrone, rostige Platte */
  } else if (t === 'crypt_warden') {
    const C = pickH([['#1c1f24', '#7fd0b8'], ['#2a1a14', '#d8b060'], ['#1a2224', '#9fd8ff']], h, 0);
    Object.assign(s, { tabard: C[0], markCol: C[1] });
    if (look === 1) Object.assign(s, { helm: 'visor', crest: '', cloak: '#141619' });
    else if (look === 2) Object.assign(s, { helm: 'crown', helmCol: '#6a6450', pauld: '#4a4f55', pb: 1 });                /* Ahnenwächter mit Grabkrone */
    else if (look === 3) Object.assign(s, { shield: 'kite', crest: '#5a2a22', cloak: '#1c1012', capeL: 1 });
  } else if (t === 'necromancer') {
    const R = pickH([['#1a1420', '#141018', '#8fe0b0'], ['#2a2622', '#1e1a16', '#c8bca0'], ['#200c0e', '#140808', '#c05a3a'], ['#141a14', '#0e140e', '#9fd06a']], h, 0);
    Object.assign(s, { robe: R[0], hood: R[1], markCol: R[2] });
    if (look === 1) Object.assign(s, { charm: 1, sil: 'collar' });                                 /* hoher Totenkragen */
    else if (look === 2) Object.assign(s, { hooded: 0, helm: 'skull', helmCol: '#cfc6b0', stole: '#4a1418' });   /* Schädelkappe statt Kapuze */
    else if (look === 3) Object.assign(s, { chn: 1, sil: 'motes', mc: s.glow || '#8fe0b0' });
  } else if (t === 'flesh_golem') {
    s.skin = mix(s.skin || '#8a7064', pickH(['#9a7a6a', '#7a8a6a', '#a89a8a', '#6a5a5a'], h, 0), 0.4);   /* Flickwerk aus verschiedenem Fleisch */
    if (look === 1) Object.assign(s, { chn: 1, glove: '#3a3a38' });                                 /* Ketten des Erbauers */
    else if (look === 2) Object.assign(s, { asy: 1, pauld: '#c8bca0', pb: 1, spk: 1 });              /* Knochenplatten auf einer Schulter */
    else if (look === 3) Object.assign(s, { face: 'mask', helm: 'cap', helmCol: '#4a4640' });       /* eiserne Maske */
  }
}
/* Artist Runde 6: Kopfgeldjäger sehen nicht mehr alle gleich aus (Tuch, Hut, Maske, Narbe) */
function varyHunter(s, seed, tier) {
  const h = (seed * 449) | 0, look = Math.abs(h >> 9) % 4;
  s.skin = pickH(['#b2926f', '#c8a07a', '#8d6644', '#d6b089', '#6d4a30'], h, 0);
  s.cloak = pickH(['#2a2622', '#1e1c1a', '#2a221c', '#1c2024'], h, 1);
  if (look === 1) Object.assign(s, { scarf: pickH(['#4a1a1a', '#3a3a30', '#2a3a4a'], h, 2) });
  else if (look === 2 && tier < 3) Object.assign(s, { hooded: 0, helm: 'wide', helmCol: '#1e1a16', sc: 1 + Math.abs(h >> 13) % 3, beard: 2 });   /* breitkrempiger Hut, Narbe */
  else if (look === 3 && tier < 3) Object.assign(s, { face: 'mask' });
}
// Artist Runde 4 (Nutzer: „viel zu kacke von den Sprites“, PLAN_ROADMAP §5b): Leute in den Städten. Alles fest aus e.seed, damit jede Figur
// nach dem Laden gleich aussieht. fc Gesichtsvariante (Brauen), ag Alter 0 jung / 1 grau an den Schläfen / 2 alt (Falten, gebeugt),
// sc Narbe 0 keine / 1 Wange / 2 über dem Auge / 3 Augenklappe, beard 1 Vollbart / 2 Stoppeln / 3 Schnurrbart / 4 Kinnbart, trim Messingborte.
const FEM_PROF = /(in|frau|Magd|Witwe|dame|Tochter|Gräfin)$/;
const AUREL_TOWNS = new Set(['aurelheim', 'kupferhafen', 'gelenkhall', 'tickmar', 'sanktserin']), CHAIN_TOWNS = new Set(['kettenfeste', 'hohlstein', 'grauwasser', 'eisenried']);
const VALEN_TOWNS = new Set(['eren', 'northcity', 'saltport', 'varonheim', 'grenzwacht']);
const GUARD_PROF = new Set(['Torwache', 'Wache', 'Königsgarde', 'Streifenwache', 'Söldnerwache', 'Söldner', 'Ehemaliger Söldner', 'Kettenwache', 'Kettensoldat', 'Kettenschütze', 'Karawanenwache', 'Quarantänewache', 'Sonnenlegionär', 'Offizier der Sonnenlegion', 'Hauptmann der Garnison', 'Marschall', 'Drillmeister', 'Zwergenwache']);
const SILK = ['#3a2a5a', '#5a1a2a', '#1e4a4a', '#6a4a1a', '#2a3a6a', '#4a1a3a', '#2e4a2a'];
function regionOf(e) {
  const t = e.homeTown || e.post || '';
  if (e.faction === 'chain' || e.eisen || CHAIN_TOWNS.has(t)) return 'kette';
  if (AUREL_TOWNS.has(t)) return 'aurel';
  if (VALEN_TOWNS.has(t) || e.faction === 'valen') return 'valen';
  const tx = ((e.anchor?.x ?? e.x) || 0) / 32, ty = ((e.anchor?.y ?? e.y) || 0) / 32;
  return ty > 780 && tx > 560 ? 'aurel' : tx > 0 && tx < 200 ? 'kette' : '';
}
function varyPeople(s, e, prof, named) {
  const h = Math.abs(((e.seed || 0) * 2654435) | 0), fem = FEM_PROF.test(prof) || (!!s.robe && s.helm === 'scarf');
  const guard = GUARD_PROF.has(prof) || !!e.guard, old = (e.age || 0) >= 55, kid = /Kind/.test(prof);
  s.fc = h % 3;
  s.ag = kid ? 0 : old ? 2 : (h >> 11) % 12 === 5 ? 2 : (h >> 11) % 5 === 1 ? 1 : 0;
  if (s.ag === 2 && !named) s.hair = ['#b8b4ac', '#8a8680', '#d8d4cc', '#a09a90'][(h >> 3) % 4];
  s.sc = (e.scars | 0) > 0 ? 1 + ((h >> 5) % 2) : guard ? [0, 1, 0, 2, 0, 3, 1, 0][(h >> 5) % 8] : (h >> 5) % 13 === 4 ? 1 : 0;
  if (kid) s.sc = 0;
  if (!named && !fem && !kid && !s.beard && !e.goblin) s.beard = [0, 2, 0, 3, 4, 2, 0, 1][(h >> 8) % 8];
  if (named || e.goblin || s.armor === 'plate') return;
  const reg = regionOf(e), plain = !s.armor && !s.tabard && !FARMERS.has(prof);
  if (reg === 'aurel' && plain) {                                    // Hochreich: Seide in satten Farben, Messingborte, Schärpe, hoher Hut
    s.cloth = SILK[(h >> 2) % SILK.length]; s.trim = (h >> 4) % 3 ? '#b8963e' : '#c8b070';
    if (!s.sash && (h >> 6) % 3 === 0) s.sash = '#c8a050';
    if (!s.helm && !s.hooded && (h >> 7) % 4 === 0) { s.helm = 'toque'; s.helmCol = SILK[(h >> 9) % SILK.length]; }
    s.belt = '#3a2a18';
  } else if (reg === 'kette') {                                      // Kette: schwarzes Eisen, dunkle Stoffe, Eisenkragen der Unfreien
    if (plain) { s.cloth = mix(s.cloth, '#18161a', 0.55); s.belt = '#3a3a3e'; }
    if (/Gefangen|Versklavt|Schuldknecht|Pferch|Schandpfahl/.test(prof)) s.gg = 1;
  } else if (reg === 'valen' && plain) s.cloth = mix(s.cloth, '#46505e', 0.38);   // Valen: Blaugrau
  if (guard && !s.robe) {                                            // Wachen: klar von Bürgern getrennt — Kamm in Wappenfarbe, Schulterstücke
    if (s.helm && !s.crest && s.helm !== 'great') s.crest = s.markCol || (reg === 'kette' ? '#5a1a1c' : reg === 'aurel' ? '#c8a050' : '#b9c3d2');
    if (!s.pauld && (s.armor === 'chain' || s.armor === 'leather')) s.pauld = s.armor === 'chain' ? '#6a6a70' : '#5a4632';
    if (prof === 'Königsgarde' && !s.tabard) Object.assign(s, { tabard: '#1a1a1a', mark: 'quarter', markCol: '#8a2a2a', crest: '#8a2a2a', cape: '#5a1a1a' });
  }
}
function varyChain(s, seed) {
  const h = (seed * 131) | 0;
  if (!s.pauld && h % 3 === 0) s.pauld = h % 2 ? '#26272b' : '#4a1418';
  if (!s.sash && h % 4 === 1) s.sash = '#5a1a1c';
  if (!s.hooded && s.helm !== 'great' && h % 5 === 2) { s.face = 'mask'; }
  if (!s.cloak && h % 6 === 3) s.cloak = '#1a0c0e';
}
// Referenz 3 (Session 12): Zustand sichtbar — Abnutzung 0 neu … 3 zerschlissen, Blut 0/1/2 nach Leben. Diskrete Stufen halten den Frame-Cache klein.
// S14: Zustand der Glieder (larm rarm lleg rleg): 0 heil, 1 ausgefallen, 2 verloren (Prothese = heil) — für den Stil R sichtbar
export const msOf = e => !e?.body ? '' : ['larm', 'rarm', 'lleg', 'rleg'].map(k => { const P = e.body[k]; return P.mech ? 3 : P.lost ? 2 : P.hp <= 0 ? 1 : 0; }).join('');   /* Roadmap P3: 3 = Prothese (Messingglied in Stil R) */
export const bloodOf = e => !e || !e.alive || !e.maxHp ? 0 : e.hp < e.maxHp * 0.25 ? 2 : e.hp < e.maxHp * 0.5 ? 1 : 0;
const HAT_PROF = { 'Flüchtling': 'wide', Reisender: 'wide' };
const WEAR_PROF = { 'Flüchtling': 3, Bettler: 3, Bauer: 1, 'Tagelöhner': 2, Reisender: 1, 'Holzfäller': 1, 'Jägerbursche': 1, Fischer: 1, 'Ehemaliger Söldner': 2, 'Söldnerwache': 1 };
const PACK_PROF = new Set(['Reisender', 'Flüchtling', 'Händler', 'Kontorhändler', 'Hausierer']);
function condition(s, e, eq) {
  const cs = Object.values(eq || {}).filter(i => i && i.cond != null).map(i => i.cond), avg = cs.length ? cs.reduce((a, b) => a + b, 0) / cs.length : 1;
  s.wear = Math.max(s.wear || 0, avg > 0.8 ? 0 : avg > 0.5 ? 1 : avg > 0.25 ? 2 : 3, WEAR_PROF[e.prof] || 0, e.captive ? 3 : 0);
  s.blood = bloodOf(e); s.wseed = (((e.seed || 0) * 3) | 0) % 4;
  if (PACK_PROF.has(e.prof)) s.pack = 1;
  if (HAT_PROF[e.prof] && !s.helm && (((e.seed || 0) | 0) % 2)) { s.helm = HAT_PROF[e.prof]; s.helmCol = '#3a3026'; s.hooded = 0; }
  // Referenz 3: Schichten statt Einheitskittel — Schulterumhang in gedämpften Farben, Beinwickel, Handschuhe, Taschen (je Person fest)
  const r = (((e.seed || 0) * 7919) | 0) >>> 0;
  if (!s.hooded && !s.robe && !s.cloak && !s.cape && r % 3 === 0) s.cape = CAPE_COLS[(r >> 3) % CAPE_COLS.length];
  if (!s.robe && !s.armor && r % 2 === 0) s.wraps = 1;
  if (s.armor && !s.glove) s.glove = s.armor === 'leather' ? '#3a2c20' : '#4a4640';
  if (!s.robe && (r >> 5) % 2 === 0) s.pouch = 1;
}
const CAPE_COLS = ['#5a1a1c', '#6a2a1e', '#2a3448', '#4a3a28', '#3a4428', '#3a3634', '#5a4a3a', '#4a2a3a'];
// Personen (Spieler, NPCs): aus Palette, Ausrüstung, Beruf.
// S13 (Nutzer: „wichtige Figuren sehen anders aus — Statur, Haare, Bart, Kleidung“). Feste Merkmale je benannter Figur, über Beruf und
// Ausrüstung gelegt: so erkennt man Havel, Borin oder Brann auf den ersten Blick wieder.
const NAMED_LOOK = {
  havel: { hair: '#c8c2b4', hs: 2, beard: 1, cloth: '#4a3a52', scarf: '#8a6a3a', stole: '#6b5a45' },
  elena: { hair: '#6a2a1a', hs: 3, stole: '#6a2420' },
  tomas: { hair: '#c89a4a', hs: 0, beard: 0, hood: '#4a5a2c', cloak: '#35421f' },
  borin: { hair: '#3a2a1e', hs: 2, beard: 1, cloth: '#3a3026', scarf: '#6a2a1e', cape: '#2a221a' },
  mara: { hair: '#1e1612', hs: 3, cloth: '#7a5a2a', scarf: '#b08a3a', sash: '#6a3a1a' },
  gerold: { hair: '#8a8478', hs: 2, beard: 1, cloth: '#2f3a4a', sash: '#b08a3a' },
  aldric: { hair: '#2a1e16', hs: 2, beard: 1, cloth: '#3a2a20' },
  jorun: { hair: '#8a6a3a', hs: 0, beard: 1, cloth: '#5a4a30' },
  kelan: { hair: '#d8d2c6', hs: 1, beard: 1, cape: '#9b2e26' },
  rook: { hair: '#1a1410', hs: 1, beard: 1, scarf: '#7a2a20', cape: '#3a1a14' },
  mira: { hair: '#e0dccf', hs: 1, cloth: '#3e4a2a', robe: '#3e4a2a', stole: '#7a8a4a', hooded: 0 },
  brann: { hair: '#a8421e', hs: 3, cloth: '#3a2e26', apron: 1, glove: '#2a1e16' },
  ilva: { hair: '#1a1612', hs: 3, cloth: '#d9d2c0', robe: '#d9d2c0', sash: '#9b2e26' },
  oda: { hair: '#c89a4a', hs: 3, cape: '#2f4260', sash: '#b9c3d2' },
  lioba: { hair: '#d08a3a', hs: 1, cloth: '#6a2a4a', scarf: '#c8a050', cape: '#3a1a3a' },
  quirin: { hair: '#5a5a52', hs: 2, beard: 1, cloth: '#3a4a3a', robe: '#3a4a3a', pouch: 1, strap: 1 },
  sael: { hair: '#2a2622', hs: 1, cloth: '#232a28', robe: '#232a28', stole: '#5fb39a' },
  lila: { hair: '#c89a4a', hs: 3, helm: '', cloth: '#8a7a5a' },
};
export function humanSpec(e) {
  const p = e.pal || {}, eq = e.equip || {}, s = baseSpec();
  const prof = e.prof || '', key = e.key || '';
  s.skin = p.skin || s.skin; s.hair = p.hair || s.hair; s.cloth = p.cloth || s.cloth; s.glow = p.glow || '';
  s.hs = p.hs != null ? p.hs : e.kind === 'player' ? 0 : (((e.seed || 0) * 7) | 0) % 4;   // Frisur: 0 kurz, 1 lang, 2 kahl, 3 Zopf
  const chest = eq.chest && eq.chest.key, head = eq.head && eq.head.key, off = eq.offhand && eq.offhand.key;
  const AL = ARMOR_LOOK[chest]; if (AL) Object.assign(s, AL);
  const HL = ARMOR_LOOK[head]; if (HL) Object.assign(s, HL);
  if (AL) {}
  else if (chest === 'leather_jerkin') { s.armor = 'leather'; s.armorCol = '#5a4030'; }
  else if (chest === 'gambeson') { s.armor = 'leather'; s.armorCol = '#8a7a5c'; }
  else if (chest === 'pit_leather') { s.armor = 'leather'; s.armorCol = '#4a5230'; }
  else if (chest === 'brigandine') { s.armor = 'chain'; s.armorCol = '#5a3e32'; }
  else if (chest === 'scale_mail') { s.armor = 'chain'; s.armorCol = '#8a7e62'; }
  else if (chest === 'chain_hauberk') { s.armor = 'chain'; s.armorCol = '#64635e'; }
  else if (chest === 'plate_cuirass') { s.armor = 'plate'; s.armorCol = p.armor || '#5e5a52'; }
  else if (p.armor) { s.armor = 'chain'; s.armorCol = p.armor; }
  if (HL) {}
  else if (head === 'leather_cap') { s.helm = 'cap'; s.helmCol = '#5a4030'; }
  else if (head === 'iron_helm') { s.helm = 'nasal'; s.helmCol = '#5a5852'; }
  else if (head === 'kettle_hat') { s.helm = 'kettle'; s.helmCol = '#6a6862'; }
  else if (head === 'great_helm') { s.helm = 'great'; s.helmCol = '#5a5852'; }
  if (p.helm) { s.helm = 'great'; s.helmCol = p.helm; }
  s.crest = p.crest || s.crest || '';
  if (e.faction === 'chain' && !e.captive) varyChain(s, e.seed || 0);
  if (eq.cloak || e.hooded || p.hood) {
    s.hooded = 1; s.cloak = p.cloak || (eq.cloak && eq.cloak.key === 'order_seal' ? '#d9d2c0' : darkOf(s.cloth));
    s.hood = p.hood || s.cloak;
  }
  const hk = eq.hands?.key, lk = eq.legs?.key;   // S15 P2: Handschuhe und Beinschutz färben Hände und Beine, Beinschienen mit Kniebuckeln
  if (hk) s.glove = hk === 'panzerhandschuhe' ? '#6a6660' : hk === 'kettenhandschuhe' ? '#7a7870' : '#5a4030';
  if (lk) { s.pants = lk === 'beinschienen' ? '#6a6660' : lk === 'kettenbeinlinge' ? '#6e6c66' : '#4a3626'; if (lk === 'beinschienen') s.kn = 1; }
  const CL = ARMOR_LOOK[eq.cloak?.key], FL = ARMOR_LOOK[eq.feet?.key];   // S15 Klassen-Rüstung: auch Umhang und Füße haben ein Bild
  if (CL || FL) { Object.assign(s, CL, FL); if (CL && !HL?.hooded && !e.hooded) s.hooded = 0; if (HL?.hooded) s.hooded = 1; }
  const sils = [AL, HL, CL, FL].map(x => x?.sil).filter(Boolean); if (sils.length) s.sil = [...new Set(sils.join(' ').split(' '))].join(' ');
  itemLook(s, eq, !!(HL?.hooded || e.hooded));
  if (off === 'wooden_shield') { s.shield = 'round'; s.shieldCol = '#5a4630'; s.mark = 'boss'; s.markCol = '#8a8172'; }
  else if (off === 'buckler') { s.shield = 'round'; s.shieldCol = '#77736a'; s.mark = 'boss'; s.markCol = '#a8a196'; }
  else if (off && ITEMS[off]?.slot === 'weapon') { /* Zweiwaffen: keine Schildzeichnung */ }
  else if (off) { s.shield = 'heater'; s.shieldCol = p.shield || '#4a3f30'; s.markCol = p.shieldBoss || '#8a8172';
    s.mark = e.faction === 'order' ? 'cross' : e.faction === 'valen' ? 'chevron' : 'boss'; }
  const w = eq.weapon && eq.weapon.key;
  if (w === 'shortbow' || w === 'longbow' || w === 'hunting_bow') s.quiver = 1;
  const cls = e.currentClass;
  if (cls === 'mage' || cls === 'warlock') { s.robe = s.cloth; }
  if (e.undead) { s.face = 'skull'; s.glow = s.glow || '#4e8f7a'; }
  // Berufe und Figuren
  if (prof === 'Dorfvorsteher') { s.robe = s.cloth; s.scarf = '#6b5a45'; s.beard = 1; s.hs = 2; }
  else if (prof === 'Heilerin') { s.robe = '#a89c84'; s.cloth = '#a89c84'; s.hooded = 1; s.hood = '#6a2420'; s.cloak = ''; s.face = 'human'; s.belt = '#6a2420'; s.stole = '#6a2420'; }
  else if (prof === 'Schmied') { s.apron = 1; s.hs = 2; s.beard = 1; s.glove = '#3a2c20'; }
  else if (prof === 'Bauer') { s.helm = s.helm || ((e.seed | 0) % 2 ? 'wide' : 'hat'); s.helmCol = s.helmCol || ((e.seed | 0) % 3 ? '#8a7a4a' : '#5a4a36'); s.beard = s.hs & 1; }
  else if (prof === 'Holzfäller') { s.beard = 1; s.strap = 1; }
  else if (prof === 'Magd' || prof === 'Jorans Tochter' || prof === 'Kind des Dorfes') { s.helm = s.helm || 'scarf'; s.helmCol = s.helmCol || '#8a7d62'; s.hs = 1; }
  else if (prof === 'Händlerin' || prof === 'Kontorhändler' || prof === 'Händler') { s.pouch = 1; s.strap = 1; s.scarf = '#8c6a2e';
    if (prof !== 'Händlerin') { s.helm = s.helm || 'hat'; s.helmCol = s.helmCol || '#3a2c20'; s.beard = 1; } }
  else if (prof === 'Wache') { s.helm = ['nasal', 'kettle', 'bascinet'][(e.seed | 0) % 3]; s.helmCol = '#5a5852'; s.armor = 'chain'; s.armorCol = '#64635e'; s.tabard = '#2f4260'; s.mark = 'chevron'; s.markCol = '#b9c3d2'; }
  else if (prof === 'Torwache') { if (!s.helm || s.helm === 'nasal') s.helm = ['nasal', 'kettle', 'bascinet'][(e.seed | 0) % 3]; s.tabard = '#2f4260'; s.mark = 'chevron'; s.markCol = '#b9c3d2'; }                   // Valen: Blau, Silberwinkel
  else if (prof === 'Ordenswache') { s.tabard = '#d9d2c0'; s.mark = 'cross'; s.markCol = '#9b2e26'; s.helm = 'great'; s.helmCol = '#b9b19c'; }   // Orden: Elfenbein & Rot
  else if (prof === 'Söldnerwache') { s.scarf = '#7a5a2a'; s.strap = 1; s.pouch = 1; s.beard = s.hs & 1; }             // gekauft, nicht vereidigt
  else if (prof === 'Ehemaliger Söldner') { s.beard = 1; s.strap = 1; s.pouch = 1; }
  else if (prof === 'Jägerbursche') { s.hooded = 1; s.hood = '#3a4a2c'; s.cloak = '#2e3a24'; s.quiver = 1; s.strap = 1; }
  else if (prof === 'Bandenführer') { s.hooded = 1; s.hood = '#2a2119'; s.cloak = '#211a14'; s.face = 'cloth'; s.scarf = '#7a2a20'; s.strap = 1; s.armor = s.armor || 'leather'; s.armorCol = s.armorCol || '#4a3525'; }
  else if (prof === 'Grabgebundener') { s.robe = '#232a28'; s.hooded = 1; s.hood = '#1b2120'; s.cloak = '#161b1a'; s.face = 'mask'; s.glow = '#5fb39a'; }
  else if (prof === 'Alter Paladin') { s.tabard = '#d9d2c0'; s.mark = s.mark || 'cross'; s.markCol = '#9b2e26'; s.beard = 1; }
  else if (prof === 'Reisender' || prof === 'Flüchtling') { s.hooded = s.hooded || ((e.seed | 0) % 2); s.cloak = s.cloak || darkOf(s.cloth); s.hood = s.hood || s.cloak; s.strap = 1; s.pouch = 1; }
  // Stände an der Silhouette (Referenz 2): Kleid/Robe, langer Rock, Schürze, Kapuze — nicht nur Farbe
  const K = CIVIC[prof]; if (K) { for (const k in K) if (s[k] == null || s[k] === '' || s[k] === 0 || k === 'robe' || k === 'hem') s[k] = K[k] === 'cloth' ? s.cloth : K[k]; }
  if (!K && !s.robe && /(in|frau)$/.test(prof) && !s.armor) { s.robe = s.cloth; s.helm = s.helm || 'scarf'; s.helmCol = s.helmCol || darkOf(s.cloth); }
  if (key === 'kelan') { s.tabard = '#d9d2c0'; s.markCol = '#9b2e26'; }
  const NL = NAMED_LOOK[key]; if (NL) Object.assign(s, NL);
  condition(s, e, eq);
  if (e.robot) { Object.assign(s, ROBOT_LOOK); varyMachine(s, e.seed || 0); }   /* §5f */
  else if (e.kind === 'npc' && !NAMED_LOOK[key] && !e.undead) varyCivil(s, e, prof);
  if (e.kind === 'npc' && !e.robot && !e.undead) varyPeople(s, e, prof, !!NAMED_LOOK[key]);
  else if (e.kind === 'player' && (e.scars | 0) > 0) s.sc = 1;   /* Artist Runde 4: Narben des Helden sieht man */
  if (s.tabard && !s.mark) s.mark = 'cross';
  if (!s.markCol && s.tabard) s.markCol = '#9b2e26';
  regionFarmer(s, e, prof, key);
  s.hv = heavyOf(w); s.ms = msOf(e);
  s.atlas = humanAtlas(e);   // Stil F
  s.bd = e.build || ''; s.vs = NL || e.kind === 'player' ? 0 : Math.abs(((e.seed || 0) * 131) | 0) % 8;   // S14 Stil R: Körperbau und Variante je Person
  if (e.kind === 'npc' && !e.robot) varyDrape(s, e.seed || 0, '');
  return s;
}
/* Artist 02.10. (Entwickler: „coolere Umhänge und Kapuzen, nur eine Form ist lahm“): Aussehen aus ITEMS[k].look.
   Umhang: cape → cw (Form), col, lin → cln (Futter), trim → ctr (Saum), fib → cfb (Fibel), fr → cfr (Fransen), fur (Pelzkragen), hood (angesetzte Kapuze).
   Kopf: hood → hd (rund | spitz | weit | kette | maske | gugel), col, mask (Gesichtstuch). Ohne look bleibt alles wie bisher. */
const HOOD_OF = h => h === 'rund' ? '' : h || '';
function itemLook(s, eq, keepHood) {
  const C = eq.cloak && ITEMS[eq.cloak.key]?.look, H = eq.head && ITEMS[eq.head.key]?.look;
  if (C) {
    if (C.col) s.cloak = C.col;
    s.cw = C.cape || ''; if (C.lin) s.cln = C.lin; if (C.trim) s.ctr = C.trim; if (C.fib) s.cfb = C.fib; if (C.fr) s.cfr = 1; if (C.fur) s.fur = C.fur;
    if (C.hood) { s.hooded = 1; s.hd = HOOD_OF(C.hood); s.hood = C.hoodCol || s.cloak; }
    else if (!keepHood) s.hooded = 0;
  }
  if (H && H.hood) { s.hooded = 1; s.hd = HOOD_OF(H.hood); s.hood = H.col || s.hood || s.cloak; s.helm = ''; s.crest = '';
    if (H.mask) { s.face = 'cloth'; s.scarf = H.mask; }
    if (H.trim && !s.ctr) s.ctr = H.trim; }
}
// Leute und Gegner mit Umhang/Kapuze bekommen eine Form aus dem Seed (fest je Figur, wenige Stufen für den Frame-Cache)
function varyDrape(s, seed, t) {
  const h = mixH(seed, 0x5a17), dead = s.sp === 'skeleton' || s.face === 'skull', gob = s.sp === 'goblin';
  if (s.hooded && !s.hd) s.hd = (dead || gob ? ['', 'spitz', 'weit', ''] : ['', 'spitz', 'weit', 'gugel', ''])[h % (dead || gob ? 4 : 5)];
  if (s.cloak && !s.cw && !s.capeL) { const P = (s.wear | 0) >= 2 || dead ? ['zerfetzt', 'zerfetzt', '', 'lang'] : ['', 'schulter', 'halb', 'lang', 'zerfetzt', ''];
    s.cw = P[(h >>> 5) % P.length]; if (s.cw === 'zerfetzt' && (h >>> 9) % 2) s.cfr = 1; }
}

// S14 (Nutzer: „wer große Waffen trägt, soll auch so aussehen“): Zweihänder, Hämmer, große Äxte, Stangenwaffen → breiter, muskulöser
const HEAVY_W = new Set(['great', 'hammer', 'polearm', 'axe', 'mace']);
const heavyOf = k => { const it = k && ITEMS[k]; return it && it.twohand && HEAVY_W.has(it.wtype) ? 1 : 0; };
// S14 (Nutzer: „die westlichen Bauern, die an Omega glauben, sollen anders aussehen als die im Osten“). Grenzen wie omegaStance
// (game.js): Westen x < 330 Kacheln, Osten x > 700. Mitte bleibt wie bisher (Strohhut, Kittel).
// Westen: aschgraue Kittel, Haube oder schwarzer Hut, Stern Omegas auf der Brust, roter Strick als Gürtel, vom Tribut verschlissen.
// Osten: verblichenes Grün-Grau, Strohumhang mit Kapuze oder Filzkappe, Beinwickel, oft barfuß, Knochenamulett gegen die Toten.
const FARMERS = new Set(['Bauer', 'Bäuerin', 'Magd', 'Tagelöhner', 'Hirte', 'Knecht']);
function regionFarmer(s, e, prof, key) {
  if (!FARMERS.has(prof) || NAMED_LOOK[key]) return;
  const tx = ((e.anchor?.x ?? e.x) || 0) / 32, v = Math.abs(((e.seed || 0) * 977) | 0) % 3, fem = prof === 'Magd' || prof === 'Bäuerin';
  if (tx < 330) {
    Object.assign(s, { cloth: ['#3a3734', '#2e2c2a', '#44403a'][v], pants: '#24221f', belt: '#5a1a1c', star: 1, wear: Math.max(s.wear || 0, 1), cape: '', scarf: '' });
    if (fem) Object.assign(s, { robe: s.cloth, helm: 'scarf', helmCol: '#1c1a1a', apron: 1, apronCol: '#5a5650' });
    else if (v === 0) Object.assign(s, { helm: 'scarf', helmCol: '#4a4640', hs: 2 });                       // Haube
    else if (v === 1) Object.assign(s, { helm: 'hat', helmCol: '#161514', beard: 1 });                      // schwarzer Glaubenshut
    else Object.assign(s, { helm: '', hs: 2, beard: 0, hem: 44, stole: '#4a1418' });                     // geschoren, roter Streifen
  } else if (tx > 700) {
    Object.assign(s, { cloth: ['#4a4c3a', '#3e4234', '#55503e'][v], pants: '#34342a', charm: 1, wraps: 1, belt: '#4a3a28' });
    if (v !== 1) Object.assign(s, { hooded: 1, hood: '#6a5c3c', cape: '#8a7a48', straw: 1, helm: '', boots: v === 2 ? '' : s.boots });   // Strohumhang
    else Object.assign(s, { helm: 'cap', helmCol: '#4a3a2a', boots: '', hs: 1, beard: fem ? 0 : 1 });                                  // Filzkappe, barfuß
    if (fem) Object.assign(s, { robe: s.cloth, apron: 1, apronCol: '#6a6250' });
  }
}
// Humanoide Gegner (Goblins, Banditen, Untote, Soldaten).
export function monsterSpec(e, m) {
  const p = (m && m.pal) || {}, s = baseSpec(), t = e.mtype;
  s.skin = p.skin || '#b2926f'; s.cloth = p.cloth || '#3a3229'; s.hs = (((e.seed || 0) * 7) | 0) % 4;
  if (t === 'goblin' || t === 'goblin_warrior' || t === 'dodon') {
    s.sp = 'goblin'; s.pants = '#3a2e1e'; s.boots = ''; s.hs = 2;
    if (t === 'dodon') Object.assign(s, { armor: 'leather', armorCol: '#3a2c1c', fur: '#4a3a26', helm: 'horned', helmCol: '#4a4038', pauld: '#c8bca0', asy: 1, pb: 2, chn: 1, wraps: 1, bd: 'bullig', ge: '#e0c24a' });   // S15 Dodon: Hörnerhelm, Knochenschulter, gesprengte Kette quer über der Brust
    if (t === 'goblin_warrior') { s.helm = 'cap'; s.helmCol = '#6b6156'; s.armor = 'leather'; s.armorCol = '#4a3a28'; s.shield = 'round'; s.shieldCol = '#3d2f20'; s.mark = 'boss'; s.markCol = '#6b6156'; }
  } else if (t === 'automat') {
    Object.assign(s, ROBOT_LOOK, { tabard: '', armorCol: '#5a4a34', helmCol: '#6a5a44' });   // verwildert: stumpfes Messing
    if (!e.amok) { varyMachine(s, e.seed || 0); s.tabard = ''; s.wear = Math.max(1, s.wear); }   /* §5f: jeder Automat anders */
    if (e.amok) Object.assign(s, { glow: '#ff4020', ge: '#ff4020', armorCol: '#6a3a2a' });   // S14: Amok — rotes Glühen, versengtes Messing
  } else if (t === 'rotgardist') {                                    // S12 Rotgardist: schwarze Platte, rote Schultern, Vollhelm mit rotem Kamm
    Object.assign(s, ARMOR_LOOK.rotgardist, ARMOR_LOOK.rotgardistenhelm, { cloak: (e.seed | 0) % 3 ? '#2a0e10' : '' }); varyChain(s, e.seed || 0); s.helm = 'great';
  } else if (t === 'kettenschuetze') {                                // S12 Kettenschütze: Eisenwache mit Köcher, Bergmannshelm
    Object.assign(s, ARMOR_LOOK.eisenwache, ARMOR_LOOK.bergmannshelm); s.quiver = 1; varyChain(s, e.seed || 0);
  } else if (t === 'chain_brute' || t === 'chain_master') {             // Eiserne Kette: schwarze Kleidung, Brigantine/Schuppen, Topfhelm, Kette quer über der Brust
    s.hooded = 0; s.armor = 'chain'; s.armorCol = t === 'chain_master' ? '#6a6250' : '#4a3e34'; s.helm = 'great'; s.helmCol = t === 'chain_master' ? '#8a8278' : '#5a5652';
    s.crest = t === 'chain_master' ? '#6a1e18' : ''; s.tabard = '#141210'; s.mark = 'chevron'; s.markCol = '#5a1a1c'; s.cloak = t === 'chain_master' ? '#2a0e10' : ''; s.strap = 1;
    if (t === 'chain_master') { s.armor = 'plate'; s.armorCol = '#1e1f22'; s.pauld = '#4a1418'; s.helmCol = '#18181a'; s.crest = '#3a1114'; } else varyChain(s, e.seed || 0);
  } else if (t === 'bandit' || t === 'bandit_archer' || t === 'bandit_spear' || t === 'bounty_hunter') {
    s.hooded = 1; s.face = 'cloth'; s.strap = 1; s.pouch = 1;
    s.hood = t === 'bandit' ? '#2e241a' : '#2f3a24'; s.cloak = t === 'bandit' ? '#261e16' : '#26301d';
    s.scarf = t === 'bandit' ? '#7a2a20' : ''; s.armor = 'leather'; s.armorCol = '#4a3525';
    if (t === 'bandit_archer') s.quiver = 1;
    if (t === 'bounty_hunter') { s.hood = '#1e1c1a'; s.cloak = '#2a2622'; s.scarf = ''; s.strap = 1; s.quiver = 0;   // Kopfgeldjäger: schwarz; ab Stufe 3 (§72) Kettenhemd und Helm — sichtbar stärker
      if ((e.tier || 0) >= 3) { s.armor = 'chain'; s.armorCol = '#6a6a66'; s.hooded = 0; s.helm = 'nasal'; s.helmCol = '#7a7874'; } }
    if (t === 'bandit_spear') { s.hooded = 0; s.helm = 'cap'; s.helmCol = '#5a4e40'; s.hood = '#4a3a26'; s.cloak = '#3e3222'; s.scarf = '#b8a070'; }   // Speerträger: Kappe statt Kapuze, helles Halstuch
  } else if (t === 'sea_raider' || t === 'sea_harpooner' || t === 'whitebeard') {   // S14 Seevolk: Teerjacke, Kopftuch, Ohrring; Weißbart riesig mit weißem Bart
    Object.assign(s, { hooded: 0, armor: 'leather', armorCol: '#2c2a26', cloth: t === 'sea_harpooner' ? '#3a3a2c' : '#2c3a44', pants: '#3a3226', sash: '#8a2a20', strap: 1, helm: 'scarf', helmCol: ['#7a2a20', '#2a4a6a', '#6a5a2a'][(e.seed | 0) % 3], beard: (e.seed | 0) % 2 });
    if (t === 'sea_harpooner') Object.assign(s, { helm: 'hat', helmCol: '#2a2622', quiver: 0 });
    if (t === 'whitebeard') Object.assign(s, { bd: 'bullig', hv: 1, pb: 1, helm: 'hat', helmCol: '#141414', hair: '#e8e4dc', beard: 1, beardLong: 1, cloak: '#141c24', capeL: 1, armor: 'plate', armorCol: '#3a3e44', pauld: '#8a8a86', fur: '#d8d2c4', chn: 1, glove: '#4a3a2a' });
  } else if (t === 'aldhelm') {                                         // §5g.2 Aldhelm: Kanzlerschwarz, rotes Futter, rote Augen
    Object.assign(s, { cloth: '#141014', robe: '#1a1418', cloak: '#3a0a10', face: 'skin', glow: '#c0303a', ge: '#c0303a', hair: '#9a9a9a', hs: 1, sash: '#7a2228' });
  } else if (t === 'blood_mage') {                                      // §5g.2 Blutmagier: rote Robe, offene Kapuze, Glimmen
    s.hooded = 1; s.hood = '#3a0a10'; s.robe = '#4a0e14'; s.cloak = '#1a0608'; s.face = 'skin'; s.glow = '#c0303a'; s.mark = 'chevron'; s.markCol = '#c0303a';
  } else if (t === 'thrall') {                                          // Blutknecht: bleich, zerrissene Alltagskleidung (er war Bürger)
    s.skin = '#cdb8b0'; s.cloth = ['#5a4a3a', '#4a5a4a', '#5a4a5a'][((e.seed || 0) | 0) % 3]; s.wear = 3; s.blood = 2; s.glow = '#a02028';
  } else if (t === 'chalice_guard') {                                   // Kelchwächter: dunkle Platte, rotes Wappen
    Object.assign(s, { armor: 'plate', armorCol: '#2a1a1c', helm: 'great', helmCol: '#3a2224', tabard: '#5a1a1e', cloak: '#1a0a0c', shield: 'kite', shieldCol: '#4a1418' });
  } else if (t === 'blood_cultist') {                                   // §5g.2 Maskierter: Kapuze in Blutrot, Wachsmaske, dunkler Umhang (Farbe je Figur)
    s.hooded = 1; s.hood = ['#3a0e12', '#2a0a0e', '#40181a'][((e.seed || 0) | 0) % 3]; s.cloak = '#1a0a0c'; s.robe = '#24100f'; s.face = 'mask'; s.mark = 'chevron'; s.markCol = '#7a2228';
  } else if (t === 'cultist') {                                         // Kultist: Robe, tiefe Kapuze, violettes Glimmen
    s.hooded = 1; s.hood = '#241a28'; s.robe = '#2a1f2e'; s.cloak = '#1c1420'; s.face = 'skin'; s.glow = p.glow; s.mark = 'chevron'; s.markCol = '#5a4a66';
  } else if (t === 'ghoul' || t === 'wraith') {                         // Wiedergänger: Leichenhaut, Fetzen; Geist: bleich, Kapuze, Schleier
    s.sp = 'skeleton'; s.skin = p.skin; s.face = 'skull'; s.glow = p.glow; s.boots = '';
    if (t === 'ghoul') { s.hooded = 0; s.cloth = '#2c2a24'; s.pants = '#2c2a24'; s.armor = 'leather'; s.armorCol = '#3a342a'; }
    else { s.hooded = 1; s.hood = '#aab4c0'; s.cloak = '#8a96a4'; s.cloth = '#aab4c0'; s.pants = '#aab4c0'; }
  } else if (t === 'angel_blade' || t === 'angel_archer') {            // Nutzer S13: Engel — helle Haut, goldene Platte, weißer Mantel, Lichtglanz
    s.skin = '#e8e0cc'; s.face = 'eyes'; s.glow = p.glow; s.hooded = 0; s.helm = ''; s.hs = 2; s.beard = 0; s.crest = ''; s.bd = 'bullig'; s.armor = t === 'angel_blade' ? 'plate' : 'chain'; s.armorCol = '#d8c080'; s.tabard = '#f4ecd8'; s.cloak = '#e8dcc0'; s.mark = 'chevron'; s.markCol = '#c8a040'; if (t === 'angel_archer') s.quiver = 1;
    varyAngel(s, e.seed || 0);   /* §5f */
  } else if (t === 'omega') {                                          // Phase 7 Omega: goldene Platte, Blutmantel, Sternenkamm, leuchtend
    s.skin = p.skin; s.face = 'skin'; s.glow = p.glow; s.hooded = 0; s.helm = 'great'; s.helmCol = '#c8a040'; s.crest = '#ffd27a'; s.armor = 'plate'; s.armorCol = '#8a6a3a'; s.pauld = '#5a1010'; s.tabard = '#5a1010'; s.cloak = '#3a0808'; s.mark = 'chevron'; s.markCol = '#ffd27a';
  } else if (t === 'necromancer') {                                     // Phase 6 Nekromant: Knochengesicht unter schwarzer Kapuze, grünes Glimmen
    s.sp = 'skeleton'; s.skin = p.skin; s.face = 'skull'; s.glow = p.glow; s.boots = ''; s.hooded = 1; s.hood = '#141018'; s.robe = '#1a1420'; s.cloak = '#0e0a12'; s.mark = 'chevron'; s.markCol = '#8fe0b0';
  } else if (t === 'zombie') {                                          // Seuchenleiche: grünliche Haut, zerrissene Kleider, keine Stiefel
    s.hooded = 0; s.cloth = '#3a3024'; s.pants = '#2e281e'; s.boots = ''; s.glow = p.glow; s.hs = 3; s.armor = 'leather'; s.armorCol = '#2e2a20'; s.face = 'rot';   /* Artist Runde 2: eigenes Totengesicht (fig5 details) */
  } else if (t === 'shade') {                                           // Schattenwesen: schwarz in schwarz, violette Augen
    s.sp = 'skeleton'; s.skin = p.skin; s.face = 'skull'; s.glow = p.glow; s.boots = ''; s.hooded = 1; s.hood = '#0e0c14'; s.cloak = '#0a0810'; s.cloth = '#0e0c14'; s.pants = '#0e0c14';
  } else if (t === 'ash_demon') {                                       // Aschdämon: verkohlte Platte, Flammenkamm, glühende Augen
    s.skin = p.skin; s.face = 'skull'; s.glow = p.glow; s.hooded = 0; s.helm = 'great'; s.helmCol = '#2a1410'; s.crest = '#ff7a2a'; s.armor = 'plate'; s.armorCol = '#2a1410'; s.cloak = '#1a0e0c'; s.tabard = '#1a0e0c'; s.mark = 'chevron'; s.markCol = '#ff7a2a'; s.boots = '';
  } else if (t === 'flesh_golem') {                                     // Leichenkoloss: vernähtes Fleisch, Lederriemen, Ketten
    s.hooded = 0; s.skin = p.skin; s.cloth = '#2a2018'; s.pants = '#2a2018'; s.armor = 'leather'; s.armorCol = '#4a3a30'; s.strap = 1; s.glow = p.glow; s.hs = 3; s.boots = ''; s.mark = 'chevron'; s.markCol = '#6a2a1c';
  } else if (t === 'skeleton' || t === 'crypt_warden' || t === 'hrodvar' || t === 'death_captain' || t === 'bone_knight' || t === 'bone_archer' || t === 'death_knight' || t === 'garmadon') {
    s.sp = 'skeleton'; s.skin = p.skin || '#cfc8b4'; s.hooded = 1; s.hood = '#20252a'; s.cloak = '#191c20'; s.cloth = '#22252a';
    s.face = 'skull'; s.glow = e.glow || p.glow || '#4e8f7a'; s.boots = ''; s.pants = '#22252a';   // e.glow: Diener eines Nekromanten
    if (t === 'crypt_warden') { s.hooded = 0; s.helm = 'great'; s.helmCol = '#4a4f55'; s.armor = 'plate'; s.armorCol = '#3d4247'; s.tabard = '#1c1f24';
      s.mark = 'chevron'; s.markCol = '#7fd0b8'; s.shield = 'heater'; s.shieldCol = '#262a2e'; }
    if (t === 'death_captain') { s.hooded = 0; s.helm = 'great'; s.helmCol = '#50463f'; s.crest = '#7a2a22'; s.armor = 'plate'; s.armorCol = '#403834'; s.tabard = '#2a1416';
      s.mark = 'chevron'; s.markCol = '#c05a3a'; s.cloak = '#1c1012'; }   // Hauptmann: rostige Platte, roter Kamm, glühende Augen
    if (t === 'hrodvar') { s.hooded = 0; s.helm = 'great'; s.helmCol = '#8fb3c7'; s.crest = '#c8e6f5'; s.armor = 'plate'; s.armorCol = '#5d7383'; s.tabard = '#1d2a36';
      s.mark = 'chevron'; s.markCol = '#9fd8ff'; s.cloak = '#16202a'; }   // Frostkönig: bereifte Platte, Kammhelm, kein Schild (Zweihänder)
    if (t === 'bone_knight') { s.hooded = 0; s.helm = 'nasal'; s.helmCol = '#5a6068'; s.armor = 'chain'; s.armorCol = '#4a5058'; s.tabard = '#1a1d22'; s.mark = 'chevron'; s.markCol = '#7fd0b8'; s.shield = 'heater'; s.shieldCol = '#2a2e34'; }   // Phase 6
    if (t === 'bone_archer') s.quiver = 1;
    if (t === 'death_knight') { s.sil = 'flames'; s.ge = '#6fd8ff'; s.hooded = 0; s.helm = 'great'; s.helmCol = '#2a2e36'; s.crest = '#6fd8ff'; s.armor = 'plate'; s.armorCol = '#262a32'; s.tabard = '#12141a'; s.mark = 'chevron'; s.markCol = '#6fd8ff'; s.cloak = '#0c0e12'; }
    if (t === 'garmadon') { s.sil = 'spikes flames'; s.hooded = 0; s.helm = 'great'; s.helmCol = '#3a2a24'; s.crest = '#e03a2a'; s.armor = 'plate'; s.armorCol = '#2a1a18'; s.pauld = '#5a1418'; s.tabard = '#1a0a0c'; s.mark = 'chevron'; s.markCol = '#e03a2a'; s.cloak = '#2a0a0c'; }   // der Tote König: rostrote Platte, Blutkamm, Königsmantel
  } else if (t === 'valen_soldier') {
    s.armor = 'chain'; s.armorCol = '#8a8f98'; s.helm = 'great'; s.helmCol = '#9aa3b0'; s.crest = '#39599c';
    s.tabard = '#2f4260'; s.mark = 'chevron'; s.markCol = '#b9c3d2'; s.shield = 'heater'; s.shieldCol = '#2f4260'; s.glove = '#5a5d63';
  }
  if (t === 'goblin' || t === 'goblin_warrior') varyGoblin(s, t, e.seed || 0);   /* Nutzer §5b: Vielfalt */
  else if (['bandit', 'bandit_archer', 'bandit_spear'].includes(t) && !e.boss && !e.rboss) varyBandit(s, t, e.seed || 0);   /* Nutzer §5f */
  else if (['skeleton', 'zombie', 'ghoul', 'bone_archer'].includes(t) && !e.boss) varyUndead(s, t, e.seed || 0);
  else if (['wraith', 'shade', 'bone_knight', 'crypt_warden', 'necromancer', 'flesh_golem'].includes(t) && !e.boss && !e.rboss) varyDead(s, t, e.seed || 0, !!e.glow);   /* Artist Runde 6 */
  else if (t === 'bounty_hunter') varyHunter(s, e.seed || 0, e.tier || 0);
  const EL = { chain_master: ['blutkette', 'blutkettenhelm'], garmadon: ['totenkrone', 'schaedelhelm'], death_knight: ['totenkrone'], hrodvar: ['totenkrone'], death_captain: ['generalspanzer'] }[t];   // S14: Bosse im Endgame-Set
  if (EL) for (const k of EL) Object.assign(s, ARMOR_LOOK[k], t === 'hrodvar' ? { armorCol: '#5d7383', rn: '#9fd8ff', cloak: '#16202a', pauld: '#8fb3c7' } : t === 'garmadon' ? { cloak: '#2a0a0c', rn: '#e03a2a', ge: '#e03a2a' } : {});
  if (e.shield && !s.shield) { s.shield = 'round'; s.shieldCol = '#4a3f30'; s.mark = 'boss'; s.markCol = '#8a8172'; }
  const sd = ((e.seed || 0) | 0) % 2;                                   // Referenz 3: Räuber und Tote tragen, was sie haben
  s.wear = { goblin: 2, goblin_warrior: 2, bandit: 1 + sd, bandit_archer: 1 + sd, bandit_spear: 1 + sd, bounty_hunter: 1, ghoul: 3, skeleton: 2, crypt_warden: 2, death_captain: 2, cultist: 1, chain_brute: 1, kettenschuetze: 1, valen_soldier: 1 }[t] || 0;
  s.blood = bloodOf(e); s.wseed = (((e.seed || 0) * 3) | 0) % 4;
  if (t === 'goblin' || t === 'goblin_warrior') s.wear = 2 + ((((e.seed || 0) * 5) | 0) >> 1) % 2;   /* Artist Runde 4: Goblins in Lumpen, mal geflickt, mal zerfetzt */
  if (!e.boss && (t === 'skeleton' || t === 'zombie' || t === 'ghoul' || t === 'bone_archer' || t === 'wraith')) s.wear = 1 + Math.abs(((e.seed || 0) * 37) | 0) % 3;   /* Artist Runde 6: Verwesungsgrad 1–3 je Toter */
  if ((t === 'bandit' || t === 'bandit_spear') && ((e.seed | 0) % 2)) s.cape = '#5a1a1c';     // Referenz 3: rote Tücher der Räuber
  if (t === 'bandit' || t === 'bandit_spear' || t === 'goblin' || t === 'goblin_warrior') s.wraps = 1;
  s.ms = msOf(e); s.hv = heavyOf(e.weaponKey) || (t === 'angel_blade' || t === 'angel_archer' || t === 'chain_brute' || t === 'death_captain' || t === 'hrodvar' || t === 'garmadon' || t === 'flesh_golem' ? 1 : 0);
  s.atlas = MON_ATLAS[t] || (e.goblin ? 'goblin' : null);   // Stil F
  s.bd = m?.angel ? 'bullig' : e.build || s.bd || '';   /* Artist Runde 6: Körperbau aus den Varianten nicht mehr überschreiben */ s.vs = Math.abs(((e.seed || 0) * 131) | 0) % 8;
  if (!e.boss && !e.rboss && t !== 'garmadon' && t !== 'omega') varyDrape(s, e.seed || 0, t);
  if (e.elook) Object.assign(s, e.elook);   /* Nutzer: Elite-Mini-Bosse haben ihr eigenes Aussehen */   // S14 Stil R: Körperbau und Variante je Person
  return s;
}

const specKey = s => { let k = ''; for (const f of SPEC_KEYS) k += s[f] + '|'; return k; };
export const lookOf = s => resolve(s, specKey(s));             // aufgelöste Spec (Rampen) für figure.js
const lookCache = new Map();
function resolve(s, k, soft = 1) {                                  // soft < 1: Stil R dunkelt weniger ab (Referenz 5: mehr Farbe, mehr Kontrast)
  let L = lookCache.get(k); if (L) return L;
  const pants = s.pants || '#2f2519';
  const dk = (h, k = 0.3) => h && mix(h, '#0f0d12', k * soft);
  if (soft < 1 && s.vs) {                                           // S14 Stil R: gleiche Rüstung, andere Person — Farbe streut je Variante
    const v = s.vs, tint = ['#3a2a1a', '#1c2632', '#2c3420', '#32222e', '#44403a', '#4a3020', '#26262a', '#3a3424'][v], metal = ['#6a5a40', '#22262c', '#5a3a2a', '#4a4a4a', '#7a6a50', '#2a2a30', '#5a4a3a', '#3a3a40'][v];
    const hair = ['#2b2118', '#5a3a1e', '#8a6a3a', '#1a1612', '#6a5a4a', '#a8421e', '#3a2a1e', '#c8b8a0'][v];
    s = { ...s, cloth: mix(s.cloth, tint, 0.32), pants: mix(s.pants || '#2f2519', tint, 0.35), cape: s.cape && mix(s.cape, tint, 0.22), hood: s.hood && mix(s.hood, tint, 0.2),
      cloak: s.cloak && mix(s.cloak, tint, 0.2), armorCol: s.armorCol && mix(s.armorCol, metal, 0.28), boots: s.boots && mix(s.boots, tint, 0.3), belt: mix(s.belt, tint, 0.3),
      hair: s.hs === 2 || s.ag === 2 ? s.hair : mix(s.hair, hair, 0.45), helmCol: s.helmCol && mix(s.helmCol, metal, 0.2) };
  }             // Referenz 2: Kleidung dunkel, Akzente bleiben
  L = { ...s,
    skin: ramp(s.skin), hair: ramp(dk(s.hair, 0.15)), cloth: ramp(dk(s.cloth)), pants: ramp(dk(pants)), boots: s.boots ? ramp(s.boots) : null,
    belt: ramp(s.belt), leather: ramp('#5a4030'), apronR: s.apronCol ? ramp(s.apronCol) : null, hood: s.hooded ? ramp(dk(s.hood || darkOf(s.cloth))) : null, cloak: s.cloak ? ramp(dk(s.cloak)) : null,
    armorR: s.armor ? ramp(dk(s.armorCol, 0.2)) : null, furR: s.fur ? ramp(s.fur) : null, pauldR: s.pauld ? ramp(s.pauld) : null, capeR: s.cape ? ramp(dk(s.cape, 0.1)) : null, stoleR: s.stole ? ramp(s.stole) : null, sashR: s.sash ? ramp(s.sash) : null, helmR: s.helm ? ramp(dk(s.helmCol || '#5a5852', 0.2)) : null, crest: s.crest ? ramp(s.crest) : null, trimR: s.trim ? ramp(s.trim) : null,
    clnR: s.cln ? ramp(s.cln) : null, ctrR: s.ctr ? ramp(s.ctr) : null, cfbR: s.cfb ? ramp(s.cfb) : null,
    robe: s.robe ? ramp(dk(s.robe, 0.22)) : null, tabard: s.tabard ? ramp(dk(s.tabard, 0.15)) : null, markR: s.markCol ? ramp(s.markCol) : null,
    scarf: s.scarf ? ramp(s.scarf) : null, shieldR: s.shield ? ramp(s.shieldCol) : null, glove: s.glove ? ramp(s.glove) : null,
    bone: ramp('#cfc6b0'), metal: ramp('#5a5852'), gold: ramp('#b8963e'), wood: ramp('#5b452a'),
  };
  lookCache.set(k, L); return L;
}

// ---------------- Posen ----------------
const POSES = {
  i0: { u: 0, leg: 0 }, i1: { u: 0, leg: 0, hdy: 1 },
  w0: { u: 0, leg: 1, arm: 1 }, w1: { u: -1, leg: 0 }, w2: { u: 0, leg: -1, arm: -1 }, w3: { u: -1, leg: 0 },
  a1: { u: 0, leg: 0, act: 'a1' }, a2: { u: 1, leg: 1, act: 'a2' }, a3: { u: 0, leg: 1, act: 'a3' },
  hit: { u: 0, leg: 0, act: 'hit', hx: 1 }, cast: { u: 0, leg: 0, act: 'cast' },
  kneel: { u: 3, leg: 0, act: 'kneel' },
  guard: { u: 1, leg: 1, act: 'guard' },                              // Deckung: tief, Schrittstellung, Arme vor dem Körper
  sit: { u: 4, leg: 0, act: 'sit' },                                  // Sitzen (Bank, Schenke): Oberschenkel waagrecht
  trade: { u: 0, leg: 0, act: 'trade' },                              // Handeln: Ware vorzeigen, Hand offen
  zeigen: { u: 0, leg: 0, act: 'trade' }, abwehren: { u: 1, leg: 1, act: 'guard' }, achsel: { u: 0, leg: 0, act: 'cast' },
  salutieren: { u: 0, leg: 0, act: 'trade' }, jubeln: { u: -1, leg: 0, act: 'cast' }, trauern: { u: 1, leg: 1, act: 'guard' }, knien: { u: 3, leg: 0, act: 'kneel' },   /* T17 (Stil D) */   /* Roadmap P8 Gesten (Stil D: nächste vorhandene Haltung) */
};

// ---------------- Menschen / Goblins / Skelette ----------------
function sleeveOf(L) { return L.armor === 'plate' || L.armor === 'chain' ? L.armorR : L.robe || L.cloth; }
function handOf(L) { return L.glove || L.skin; }

function legsFront(g, L, P) {
  const kneel = P.act === 'kneel', rl = P.leg > 0 ? 1 : 0, rr = P.leg < 0 ? 1 : 0;
  if (P.act === 'sit') {                                              // von vorn: Knie vorn, Unterschenkel hängen
    const Pn = L.sp === 'skeleton' ? L.skin : L.pants, Bo = L.sp === 'skeleton' ? L.skin : (L.boots || L.skin);
    g.r(6, 19, 3, 2, Pn.b); g.r(11, 19, 3, 2, Pn.b); g.p(8, 19, Pn.sh); g.p(13, 19, Pn.sh);
    g.r(6, 21, 3, 1, Bo.b); g.r(11, 21, 3, 1, Bo.b); return;
  }
  const top = kneel ? 19 : 17;
  if (L.sp === 'skeleton') {
    const B = L.skin;
    g.r(7, top, 2, 20 - rl - top, B.b); g.p(8, top, B.sh); g.r(6, 20 - rl, 3, 1, B.sh); g.p(6, 20 - rl, B.b);
    g.r(11, top, 2, 20 - rr - top, B.sh); g.r(11, 20 - rr, 3, 1, B.sh); g.p(13, 20 - rr, B.dk);
    return;
  }
  const Pn = L.pants;
  g.r(6, top, 3, 20 - rl - top, Pn.b); g.r(8, top, 1, 20 - rl - top, Pn.sh);
  g.r(11, top, 3, 20 - rr - top, Pn.b); g.r(11, top, 1, 20 - rr - top, Pn.sh); g.r(13, top, 1, 20 - rr - top, Pn.sh);
  const Bo = L.boots || L.skin;
  g.r(5, 20 - rl, 4, 2, Bo.sh); g.r(5, 20 - rl, 4, 1, Bo.b); g.p(5, 20 - rl, Bo.hi); g.p(8, 21 - rl, Bo.dk);
  g.r(11, 20 - rr, 4, 2, Bo.sh); g.r(11, 20 - rr, 4, 1, Bo.b); g.p(14, 21 - rr, Bo.dk);
}
function legsSide(g, L, P) {
  if (P.act === 'sit') {                                              // seitlich: Oberschenkel nach vorn, Unterschenkel senkrecht
    const Pn = L.sp === 'skeleton' ? L.skin : L.pants, Bo = L.sp === 'skeleton' ? L.skin : (L.boots || L.skin);
    g.r(4, 19, 6, 2, Pn.b); g.r(4, 20, 6, 1, Pn.sh); g.r(4, 21, 2, 1, Pn.sh); g.r(3, 22, 3, 1, Bo.b); return;
  }
  const kneel = P.act === 'kneel', top = kneel ? 19 : 17;
  // Schrittstellung: near = zugewandtes Bein, far = abgewandtes (dunkler)
  const nearX = P.leg > 0 ? 6 : P.leg < 0 ? 11 : 8, farX = P.leg > 0 ? 11 : P.leg < 0 ? 6 : 10;
  const bone = L.sp === 'skeleton';
  const leg = (x, far) => {
    const Pn = bone ? L.skin : L.pants, Bo = bone ? L.skin : (L.boots || L.skin);
    if (bone) { g.r(x + 1, top, 1, 3, far ? Pn.sh : Pn.b); g.r(x, 20, 3, 1, far ? Pn.dk : Pn.sh); return; }
    g.r(x, top, 2, 3, far ? Pn.sh : Pn.b); if (!far) g.p(x + 1, top, Pn.sh);
    g.r(x - 1, 20, 3, 2, far ? Bo.dk : Bo.sh); if (!far) { g.r(x - 1, 20, 3, 1, Bo.b); g.p(x - 1, 20, Bo.hi); }
  };
  leg(farX, true); leg(nearX, false);
}

function headFront(g, L, P, back) {
  const u = P.u + (P.hdy || 0), x = P.hx || 0;
  const S = L.skin;
  if (L.sp === 'goblin') {
    g.r(6 + x, 4 + u, 8, 6, S.b); g.r(7 + x, 3 + u, 6, 1, S.b); g.r(13 + x, 4 + u, 1, 6, S.sh); g.r(7 + x, 9 + u, 6, 1, S.sh);
    g.p(7 + x, 4 + u, S.hi); g.p(8 + x, 3 + u, S.hi);
    g.r(3 + x, 5 + u, 3, 1, S.b); g.p(4 + x, 6 + u, S.sh); g.p(3 + x, 4 + u, S.b);          // Ohren
    g.r(14 + x, 5 + u, 3, 1, S.sh); g.p(15 + x, 6 + u, S.dk); g.p(16 + x, 4 + u, S.sh);
    if (!back) { g.p(8 + x, 6 + u, '#e0c24a'); g.p(11 + x, 6 + u, '#e0c24a'); g.p(9 + x, 7 + u, S.sh); g.p(10 + x, 7 + u, S.dk);
      g.r(8 + x, 8 + u, 4, 1, DEEP); g.p(8 + x, 8 + u, L.bone.b); g.p(11 + x, 8 + u, L.bone.b); }
    if (L.helm === 'cap') { const H = L.helmR; g.r(6 + x, 2 + u, 8, 3, H.b); g.r(7 + x, 2 + u, 3, 1, H.hi); g.r(12 + x, 2 + u, 2, 3, H.sh); g.r(5 + x, 4 + u, 10, 1, H.dk); }
    return;
  }
  if (L.hooded && L.helm !== 'great') return hoodFront(g, L, u, x, back);
  if (L.helm === 'great') return greatHelm(g, L, u, x, back ? 'N' : 'S');
  // Gesicht
  g.r(7 + x, 3 + u, 6, 1, S.b); g.r(6 + x, 4 + u, 8, 5, S.b); g.r(7 + x, 9 + u, 6, 1, S.sh);
  g.r(13 + x, 4 + u, 1, 5, S.sh); g.p(7 + x, 4 + u, S.hi); g.p(8 + x, 4 + u, S.hi);
  if (L.sp === 'skeleton' && !back) { g.p(8 + x, 6 + u, DEEP); g.p(11 + x, 6 + u, DEEP); g.p(9 + x, 8 + u, DEEP); g.p(11 + x, 8 + u, DEEP); }
  else if (!back) {
    g.p(7 + x, 5 + u, S.sh); g.p(8 + x, 5 + u, S.sh); g.p(11 + x, 5 + u, S.sh); g.p(12 + x, 5 + u, S.sh);
    g.p(8 + x, 6 + u, '#1b1411'); g.p(11 + x, 6 + u, '#1b1411'); g.p(10 + x, 7 + u, S.sh); g.r(9 + x, 8 + u, 2, 1, S.dk);
  }
  const H = L.hair, hs = L.hs;
  if (back) { if (hs !== 2) { g.r(6 + x, 3 + u, 8, 6, H.b); g.r(7 + x, 2 + u, 6, 1, H.b); g.r(12 + x, 3 + u, 2, 6, H.sh); g.p(8 + x, 2 + u, H.hi); g.p(9 + x, 2 + u, H.hi);
      if (hs === 1) g.r(6 + x, 9 + u, 8, 2, H.sh); }
    else g.r(8 + x, 4 + u, 3, 1, S.hi); }
  else if (!L.helm || L.helm === 'nasal' || L.helm === 'cap') {
    if (hs !== 2) { g.r(7 + x, 2 + u, 6, 1, H.b); g.r(6 + x, 3 + u, 8, 1, H.b); g.p(8 + x, 2 + u, H.hi); g.p(9 + x, 2 + u, H.hi); g.r(12 + x, 2 + u, 2, 2, H.sh);
      g.p(6 + x, 4 + u, H.b); g.p(13 + x, 4 + u, H.sh); g.p(6 + x, 5 + u, H.sh); g.p(13 + x, 5 + u, H.dk);
      if (hs === 1) { g.r(5 + x, 4 + u, 1, 6, H.b); g.r(14 + x, 4 + u, 1, 6, H.sh); }
      if (hs === 3) { g.r(9 + x, 1 + u, 2, 1, H.b); } }
    else { g.p(6 + x, 5 + u, H.sh); g.p(13 + x, 5 + u, H.dk); }
  }
  if (L.beard && !back) { g.r(7 + x, 7 + u, 6, 2, H.b); g.r(9 + x, 7 + u, 2, 1, S.sh); g.r(8 + x, 9 + u, 4, 1, H.sh); g.r(12 + x, 7 + u, 1, 2, H.sh); g.r(9 + x, 8 + u, 2, 1, H.dk); }
  const M = L.helmR;
  if (L.helm === 'nasal') { g.r(7 + x, 2 + u, 6, 1, M.b); g.r(6 + x, 3 + u, 8, 2, M.b); g.r(7 + x, 2 + u, 2, 1, M.hi); g.p(6 + x, 3 + u, M.hi); g.r(12 + x, 2 + u, 2, 3, M.sh); g.r(6 + x, 5 + u, 8, 1, M.dk);
    if (!back) { g.r(9 + x, 5 + u, 2, 3, M.b); g.p(9 + x, 5 + u, M.hi); } }
  else if (L.helm === 'cap') { g.r(7 + x, 2 + u, 6, 1, M.b); g.r(6 + x, 3 + u, 8, 2, M.b); g.p(7 + x, 2 + u, M.hi); g.r(12 + x, 2 + u, 2, 3, M.sh); g.r(6 + x, 4 + u, 8, 1, M.sh); }
  else if (L.helm === 'hat') { g.r(8 + x, 0 + u, 4, 1, M.b); g.r(7 + x, 1 + u, 6, 2, M.b); g.p(8 + x, 1 + u, M.hi); g.r(11 + x, 1 + u, 2, 2, M.sh);
    g.r(4 + x, 3 + u, 12, 1, M.b); g.r(4 + x, 3 + u, 4, 1, M.hi); g.r(13 + x, 3 + u, 3, 1, M.sh); g.r(7 + x, 2 + u, 6, 1, L.belt.dk); }
  else if (L.helm === 'scarf') { g.r(7 + x, 2 + u, 6, 1, M.b); g.r(6 + x, 3 + u, 8, 2, M.b); g.p(7 + x, 2 + u, M.hi); g.r(12 + x, 2 + u, 2, 3, M.sh);
    g.r(5 + x, 5 + u, 1, 4, M.b); g.r(14 + x, 5 + u, 1, 4, M.sh); }
}
function hoodFront(g, L, u, x, back) {
  const H = L.hood;
  g.r(8 + x, 1 + u, 4, 1, H.b); g.r(7 + x, 2 + u, 6, 1, H.b); g.r(6 + x, 3 + u, 8, 1, H.b); g.r(5 + x, 4 + u, 10, 6, H.b);
  g.p(8 + x, 1 + u, H.hi); g.r(7 + x, 2 + u, 2, 1, H.hi); g.p(6 + x, 3 + u, H.hi); g.r(5 + x, 4 + u, 1, 3, H.hi);   // Randlicht oben links
  g.r(13 + x, 4 + u, 2, 6, H.sh); g.p(12 + x, 2 + u, H.sh); g.p(13 + x, 3 + u, H.sh); g.r(5 + x, 9 + u, 10, 1, H.sh); g.p(14 + x, 9 + u, H.dk);
  if (back) { for (let y = 2; y <= 8; y++) g.p((y % 2 ? 10 : 9) + x, y + u, H.sh); return; }                        // Naht
  // Gesichtsöffnung
  g.r(8 + x, 4 + u, 4, 1, H.dk); g.r(7 + x, 5 + u, 6, 4, H.dk);
  g.r(8 + x, 5 + u, 4, 1, DEEP); g.r(7 + x, 6 + u, 6, 3, DEEP); g.r(8 + x, 9 + u, 4, 1, DEEP);
  const G1 = L.glow;
  if (L.face === 'skull') {
    const B = L.bone; g.r(8 + x, 6 + u, 4, 3, B.b); g.r(8 + x, 6 + u, 2, 1, B.hi); g.p(11 + x, 7 + u, B.sh);
    g.p(8 + x, 7 + u, G1 || DEEP); g.p(11 + x, 7 + u, G1 || DEEP); g.p(9 + x, 8 + u, DEEP); g.p(10 + x, 8 + u, B.sh);
    g.p(8 + x, 9 + u, B.sh); g.p(10 + x, 9 + u, B.sh);
  } else if (L.face === 'mask') {
    const M = ramp('#6b675e'); g.r(8 + x, 6 + u, 4, 4, M.b); g.r(8 + x, 6 + u, 4, 1, M.hi); g.r(11 + x, 7 + u, 1, 3, M.sh);
    g.p(8 + x, 7 + u, G1 || DEEP); g.p(11 + x, 7 + u, G1 || DEEP); g.r(9 + x, 9 + u, 2, 1, M.dk); g.p(9 + x, 8 + u, M.sh);
  } else if (L.face === 'cloth') {
    const S = L.skin; g.r(8 + x, 6 + u, 4, 1, S.sh); g.p(8 + x, 6 + u, '#1b1411'); g.p(11 + x, 6 + u, '#1b1411');
    const C = L.scarf || ramp('#3a3026'); g.r(7 + x, 7 + u, 6, 2, C.b); g.r(7 + x, 7 + u, 6, 1, C.hi); g.r(11 + x, 8 + u, 2, 1, C.sh);
  } else if (L.face === 'shadow' || G1) {
    g.p(8 + x, 7 + u, G1 || '#b0412f'); g.p(11 + x, 7 + u, G1 || '#b0412f');
  } else {
    const S = L.skin; g.r(8 + x, 7 + u, 4, 3, S.sh); g.r(8 + x, 6 + u, 4, 1, S.dk);
    g.p(8 + x, 7 + u, '#1b1411'); g.p(11 + x, 7 + u, '#1b1411'); g.p(10 + x, 8 + u, S.dk);
    if (L.beard) { g.r(8 + x, 9 + u, 4, 1, L.hair.sh); }
  }
}
function greatHelm(g, L, u, x, dir) {
  const M = L.helmR;
  if (dir === 'W') {
    g.r(8 + x, 2 + u, 5, 1, M.b); g.r(7 + x, 3 + u, 7, 7, M.b); g.p(8 + x, 2 + u, M.hi); g.r(7 + x, 3 + u, 1, 3, M.hi);
    g.r(12 + x, 3 + u, 2, 7, M.sh); g.r(7 + x, 9 + u, 7, 1, M.sh);
    g.r(7 + x, 6 + u, 3, 1, DEEP); g.p(8 + x, 8 + u, DEEP); g.p(10 + x, 7 + u, M.dk);
    if (L.crest) { const C = L.crest; g.r(9 + x, 0 + u, 3, 1, C.hi); g.r(8 + x, 1 + u, 6, 1, C.b); g.p(14 + x, 2 + u, C.b); g.p(15 + x, 3 + u, C.sh); g.p(15 + x, 4 + u, C.sh); g.p(13 + x, 1 + u, C.sh); }
    return;
  }
  g.r(7 + x, 2 + u, 6, 1, M.b); g.r(6 + x, 3 + u, 8, 7, M.b);
  g.r(7 + x, 2 + u, 2, 1, M.hi); g.r(6 + x, 3 + u, 1, 4, M.hi); g.r(13 + x, 3 + u, 1, 7, M.sh); g.r(6 + x, 9 + u, 8, 1, M.sh); g.r(12 + x, 3 + u, 1, 6, M.sh);
  if (dir === 'S') { g.r(7 + x, 6 + u, 6, 1, DEEP); g.r(9 + x, 7 + u, 2, 2, DEEP); g.p(8 + x, 8 + u, M.dk); g.p(11 + x, 8 + u, M.dk); g.p(9 + x, 3 + u, M.hi); g.p(9 + x, 4 + u, M.hi); }
  else { g.r(9 + x, 3 + u, 1, 6, M.sh); }
  if (L.crest) { const C = L.crest; g.r(9 + x, 0 + u, 2, 1, C.hi); g.r(8 + x, 1 + u, 4, 1, C.b); g.p(11 + x, 1 + u, C.sh);
    if (dir === 'N') { g.r(9 + x, 2 + u, 2, 4, C.sh); } }
}

function shieldAt(g, L, x0, y0, narrow) {
  const R = L.shieldR, M = L.markR;
  if (L.shield === 'round') {
    const cx = x0 + 2, cy = y0 + 3;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) g.p(cx + i, cy + j, i + j < -1 ? R.hi : i + j > 1 ? R.sh : R.b);
    g.p(cx, cy, M ? M.hi : R.hi); if (M) { g.p(cx + 1, cy, M.sh); g.p(cx, cy + 1, M.sh); }
    return;
  }
  const w = narrow ? 4 : 5;
  g.r(x0, y0, w, 5, R.b); g.r(x0, y0, w, 1, R.hi); g.r(x0 + w - 1, y0 + 1, 1, 4, R.sh);
  g.r(x0 + 1, y0 + 5, w - 2, 1, R.sh); g.p(x0 + ((w - 1) >> 1), y0 + 6, R.dk); if (!narrow) g.p(x0 + 2, y0 + 6, R.dk);
  if (!M) return;
  const cx = x0 + (w >> 1);
  if (L.mark === 'cross') { g.r(cx, y0 + 1, 1, 5, M.b); g.r(x0 + 1, y0 + 2, w - 2, 1, M.b); if (!narrow) g.r(cx - 1, y0 + 1, 1, 1, M.hi); }
  else if (L.mark === 'chevron') { g.p(x0 + 1, y0 + 3, M.b); g.p(cx, y0 + 2, M.hi); g.p(x0 + w - 2, y0 + 3, M.b); if (!narrow) { g.p(x0, y0 + 4, M.sh); g.p(x0 + w - 1, y0 + 4, M.sh); } }
  else { g.p(cx, y0 + 2, M.hi); g.p(cx, y0 + 3, M.sh); }
}

function torsoFront(g, L, P, back) {
  const u = P.u, T = L.cloth;
  // Umhang hinten (vorn nur an den Seiten sichtbar)
  if (L.cloak) {
    const C = L.cloak;
    if (back) {
      g.r(4, 10 + u, 12, 10 - u, C.b); g.r(4, 10 + u, 12, 1, C.hi); g.r(13, 10 + u, 3, 10 - u, C.sh);
      for (let y = 12 + u; y < 20; y++) g.p(9 + ((y >> 1) & 1), y, C.sh);
      for (let x = 4; x <= 15; x++) if ((x + (P.leg & 1)) % 2 === 0) g.p(x, 20, C.dk);
    } else {
      g.r(3, 10 + u, 2, 10 - u, C.sh); g.r(15, 10 + u, 2, 10 - u, C.dk); g.p(3, 10 + u, C.b);
      for (const xx of [3, 16]) g.p(xx, 20, (P.leg & 1) ? null : C.dk);
    }
  }
  if (L.robe) {
    const R = L.robe;
    g.r(5, 15 + u, 10, 18 - 15 - u, R.b); g.r(4, 18, 12, 2, R.b); g.r(13, 15 + u, 2, 5 - u, R.sh); g.r(15, 18, 1, 2, R.dk); g.p(4, 18, R.hi);
    for (let y = 16 + u; y <= 19; y++) g.p(9, y, R.sh);
    for (let x = 4; x <= 15; x++) if (x % 2 === 0) g.p(x, 20, R.sh);
    const Bo = L.boots || L.skin, rl = P.leg > 0, rr = P.leg < 0;
    if (!rl) g.r(6, 21, 2, 1, Bo.sh); if (!rr) g.r(12, 21, 2, 1, Bo.sh);
    if (rl) g.r(6, 20, 2, 1, Bo.b); if (rr) g.r(12, 20, 2, 1, Bo.b);
  }
  g.r(5, 10 + u, 10, 6, T.b); g.r(6, 10 + u, 6, 1, T.hi); g.r(13, 10 + u, 2, 6, T.sh);
  if (!L.robe) { g.r(5, 16 + u, 10, 2, T.sh); g.r(12, 16 + u, 3, 2, T.dk); for (const xx of [5, 8, 10, 13]) g.p(xx, 18 + u, T.dk); }
  if (L.sp === 'skeleton' && !back) { const B = L.skin; g.r(7, 11 + u, 6, 1, B.b); g.r(7, 13 + u, 6, 1, B.sh); g.r(9, 11 + u, 2, 4, B.hi); g.p(7, 12 + u, DEEP); g.p(12, 12 + u, DEEP); }
  const A = L.armorR;
  if (L.armor === 'leather') { g.r(6, 10 + u, 8, 5, A.b); g.r(6, 10 + u, 5, 1, A.hi); g.r(12, 10 + u, 2, 5, A.sh);
    if (!back) { g.p(9, 11 + u, A.dk); g.p(10, 12 + u, A.dk); g.p(9, 13 + u, A.dk); } }
  else if (L.armor === 'chain') { for (let y = 10; y <= 16; y++) for (let x = 5; x <= 14; x++) g.p(x, y + u, x >= 13 ? ((x + y) % 2 ? A.sh : A.dk) : ((x + y) % 2 ? A.b : A.sh));
    g.r(6, 10 + u, 5, 1, A.hi); for (let x = 5; x <= 14; x += 2) g.p(x, 17 + u, A.sh); }
  else if (L.armor === 'plate') { g.r(5, 10 + u, 10, 5, A.b); g.r(5, 10 + u, 8, 1, A.hi); if (!back) g.r(9, 11 + u, 1, 3, A.hi);
    g.r(12, 10 + u, 3, 5, A.sh); g.r(5, 14 + u, 10, 1, A.dk); g.r(5, 16 + u, 10, 1, A.sh); }
  if (L.apron && !back) { const Lr = L.leather; g.r(7, 12 + u, 6, 7, Lr.b); g.r(7, 12 + u, 6, 1, Lr.hi); g.r(11, 13 + u, 2, 6, Lr.sh); g.p(7, 11 + u, Lr.sh); g.p(12, 11 + u, Lr.sh); }
  if (L.tabard) { const B = L.tabard; g.r(8, 11 + u, 4, 7, B.b); g.r(8, 11 + u, 2, 1, B.hi); g.r(11, 11 + u, 1, 7, B.sh); g.p(8, 18 + u, B.sh); g.p(10, 18 + u, B.sh);
    if (L.markR && !back) { const M = L.markR;
      if (L.mark === 'chevron') { g.p(8, 14 + u, M.b); g.p(9, 13 + u, M.hi); g.p(10, 13 + u, M.b); g.p(11, 14 + u, M.sh); }
      else { g.r(9, 12 + u, 2, 4, M.b); g.r(8, 13 + u, 4, 1, M.b); g.p(9, 12 + u, M.hi); } } }
  if (L.strap) { const S = L.belt; for (let i = 0; i < 6; i++) { const sx = back ? 13 - i : 6 + i; g.p(sx, 10 + i + u, S.b); g.p(sx + (back ? -1 : 1), 10 + i + u, S.dk); }
    if (!back) g.p(9, 13 + u, L.metal.hi); }
  const Bt = L.belt;
  g.r(5, 15 + u, 10, 1, Bt.dk);
  if (!back) { g.p(9, 15 + u, L.gold.b); g.p(10, 15 + u, L.gold.sh); }
  if (L.pouch) { const Lr = L.leather, px = back ? 6 : 12; g.r(px, 15 + u, 2, 2, Lr.b); g.p(px + 1, 16 + u, Lr.sh); g.p(px, 15 + u, Lr.hi); }
  if (L.scarf && L.face !== 'cloth') { const Sc = L.scarf; g.r(6, 10 + u, 8, 1, Sc.b); g.r(6, 10 + u, 3, 1, Sc.hi); if (!back) { g.r(12, 11 + u, 2, 3, Sc.sh); g.p(13, 14 + u, Sc.dk); } }
  if (L.face === 'cloth' && L.scarf) { const Sc = L.scarf; g.r(6, 10 + u, 8, 1, Sc.sh); if (!back) { g.r(12, 11 + u, 1, 3, Sc.b); g.p(12, 14 + u, Sc.sh); } }
  if (L.quiver && back) { const W = L.wood; g.r(12, 8 + u, 2, 8, L.leather.b); g.r(13, 8 + u, 1, 8, L.leather.sh); g.p(12, 7 + u, '#c9bfa6'); g.p(13, 6 + u, '#c9bfa6'); g.p(12, 6 + u, W.b); }
}

function armsFront(g, L, P, back) {
  const u = P.u, S = sleeveOf(L), Hd = handOf(L), act = P.act;
  const wx = back ? 15 : 3, ox = back ? 3 : 15;                      // Waffenarm / Schildarm (Bildseiten)
  const arm = (x, dy, lit) => { g.r(x, 10 + u + dy, 2, 5, S.b); g.r(x + (lit ? 1 : 0), 10 + u + dy, 1, 5, S.sh); g.p(x + (lit ? 0 : 1), 10 + u + dy, lit ? S.hi : S.sh);
    g.r(x, 15 + u + dy, 2, 2, Hd.b); g.p(x + (lit ? 1 : 0), 16 + u + dy, Hd.sh); };
  const armUp = (x, top) => { g.r(x, top + u, 2, 11 - top, S.b); g.r(x + 1, top + u, 1, 11 - top, S.sh); g.r(x, top - 2 + u, 2, 2, Hd.b); g.p(x + 1, top - 1 + u, Hd.sh); };
  if (act === 'a1') { armUp(wx, 6); arm(ox, 0, ox < 10); }
  else if (act === 'a2') {
    const d = back ? 1 : -1; g.r(wx, 10 + u, 2, 3, S.b); g.r(wx + d, 12 + u, 3, 2, S.b); g.r(wx + d, 13 + u, 3, 1, S.sh);
    g.r(wx + d * 2, 14 + u, 2, 2, Hd.b); g.p(wx + d * 2 + 1, 15 + u, Hd.sh); arm(ox, 1, ox < 10);
  }
  else if (act === 'a3') {                                        // Nachschwung: Waffenarm quer vor dem Körper
    const x0 = back ? 10 : 6; g.r(wx, 10 + u, 2, 2, S.b); g.r(x0, 12 + u, 4, 2, S.b); g.r(x0, 13 + u, 4, 1, S.sh);
    g.r(back ? x0 - 2 : x0 + 4, 12 + u, 2, 2, Hd.b); arm(ox, 1, ox < 10);
  }
  else if (act === 'cast') { armUp(4, 8); armUp(14, 8); if (L.glow) { g.p(4, 5 + u, L.glow); g.p(15, 5 + u, L.glow); } }
  else if (act === 'hit') { armUp(2, 9); armUp(16, 9); }
  else if (act === 'kneel') { arm(3, 1, true); arm(15, 1, false); }
  else if (act === 'guard') {                                        // beide Unterarme quer vor der Brust
    const y = 11 + u; g.r(wx, 10 + u, 2, 2, S.b); g.r(back ? 12 : 5, y, 4, 2, S.b); g.r(back ? 12 : 5, y + 1, 4, 1, S.sh); g.r(back ? 11 : 8, y - 1, 2, 2, Hd.b);
    g.r(ox, 10 + u, 2, 2, S.b); g.r(back ? 5 : 11, y + 1, 4, 2, S.b); g.r(back ? 5 : 11, y + 2, 4, 1, S.sh); }
  else if (act === 'sit') { arm(3, 1, true); arm(15, 1, false); g.r(5, 16 + u, 2, 1, Hd.b); g.r(13, 16 + u, 2, 1, Hd.b); }   // Hände auf den Knien
  else if (act === 'trade') { arm(3, 0, true); const x0 = back ? 12 : 12; g.r(15, 10 + u, 2, 2, S.b); g.r(x0, 12 + u, 4, 2, S.b); g.r(x0 - 1, 11 + u, 2, 2, Hd.b); }   // Hand offen nach vorn
  else { arm(3, P.arm > 0 ? 1 : 0, true); arm(15, P.arm < 0 ? 1 : 0, false); }
  // Kapuzen-Schulterkragen über den Armansätzen
  if (L.hooded) { const H = L.hood, v = u + (P.hdy || 0);
    g.r(5, 9 + v, 10, 1, H.sh); g.r(4, 10 + v, 12, 2, H.b); g.r(4, 10 + v, 5, 1, H.hi); g.r(12, 10 + v, 4, 2, H.sh);
    for (const xx of [4, 6, 9, 11, 13, 15]) g.p(xx, 12 + v, xx > 10 ? H.dk : H.sh); }
  if (L.armor === 'plate') { const A = L.armorR; g.r(3, 9 + u, 3, 3, A.b); g.r(3, 9 + u, 2, 1, A.hi); g.r(3, 11 + u, 3, 1, A.sh); g.r(14, 9 + u, 3, 3, A.sh); g.r(14, 9 + u, 3, 1, A.b); g.r(14, 11 + u, 3, 1, A.dk); }
}

function paintFront(L, pose, back) {
  const P = POSES[pose] || POSES.i0, g = new G(20, 25, 1);
  if (L.robe) { /* Beine unter der Robe */ } else legsFront(g, L, P);
  torsoFront(g, L, P, back);
  if (back) { armsFront(g, L, P, true); headFront(g, L, P, true); if (L.shield) shieldAt(g, L, 1, 11 + P.u, false); }
  else { armsFront(g, L, P, false); headFront(g, L, P, false); if (L.shield) shieldAt(g, L, P.act === 'guard' ? 8 : 14, P.act === 'guard' ? 10 + P.u : 11 + P.u, false); }
  if (L.quiver && !back) { g.p(15, 8 + P.u, '#c9bfa6'); g.p(16, 7 + P.u, '#c9bfa6'); }
  return g;
}

// Seitenansicht (Blick nach links; rechts = gespiegelt)
function paintSide(L, pose) {
  const P = POSES[pose] || POSES.i0, g = new G(20, 25, 1), u = P.u, T = L.cloth, hx = P.hx || 0, act = P.act;
  const flare = P.leg !== 0 || act === 'a2';
  if (L.cloak) { const C = L.cloak; g.r(11, 9 + u, 4, 11 - u, C.sh); g.r(14, 10 + u, 1, 10 - u, C.dk); g.p(11, 9 + u, C.b);
    if (flare) g.r(15, 13 + u, 1, 6, C.dk);
    for (let y = 20; y <= 20; y++) for (let x = 11; x <= 15; x++) if ((x + (P.leg & 1)) % 2) g.p(x, y, C.dk); }
  if (L.quiver) { g.r(12, 8 + u, 2, 7, L.leather.b); g.p(13, 8 + u, L.leather.sh); g.p(12, 7 + u, '#c9bfa6'); g.p(13, 6 + u, '#c9bfa6'); }
  if (!L.robe) legsSide(g, L, P);
  if (L.robe) { const R = L.robe; g.r(7, 15 + u, 6, 3 - u, R.b); g.r(6, 18, 8, 2, R.b); g.r(11, 15 + u, 2, 5 - u, R.sh); g.p(6, 18, R.hi);
    for (let x = 6; x <= 13; x++) if (x % 2) g.p(x, 20, R.sh);
    const Bo = L.boots || L.skin; g.r(P.leg > 0 ? 5 : 7, 21, 2, 1, Bo.sh); }
  g.r(7, 10 + u, 6, 6, T.b); g.r(7, 10 + u, 4, 1, T.hi); g.r(11, 10 + u, 2, 6, T.sh);
  if (!L.robe) { g.r(7, 16 + u, 6, 2, T.sh); g.r(11, 16 + u, 2, 2, T.dk); for (const xx of [7, 9, 12]) g.p(xx, 18 + u, T.dk); }
  if (L.sp === 'skeleton') { const B = L.skin; g.r(8, 11 + u, 3, 1, B.b); g.r(8, 13 + u, 3, 1, B.sh); }
  const A = L.armorR;
  if (L.armor === 'leather') { g.r(7, 10 + u, 5, 5, A.b); g.r(7, 10 + u, 3, 1, A.hi); g.r(11, 10 + u, 1, 5, A.sh); }
  else if (L.armor === 'chain') { for (let y = 10; y <= 16; y++) for (let x = 7; x <= 12; x++) g.p(x, y + u, x >= 11 ? ((x + y) % 2 ? A.sh : A.dk) : ((x + y) % 2 ? A.b : A.sh)); g.r(7, 10 + u, 3, 1, A.hi); }
  else if (L.armor === 'plate') { g.r(7, 10 + u, 6, 5, A.b); g.r(7, 10 + u, 4, 1, A.hi); g.r(7, 11 + u, 1, 3, A.hi); g.r(11, 10 + u, 2, 5, A.sh); g.r(7, 14 + u, 6, 1, A.dk); }
  if (L.apron) { const Lr = L.leather; g.r(6, 12 + u, 3, 7, Lr.b); g.p(6, 12 + u, Lr.hi); }
  if (L.tabard) { const B = L.tabard; g.r(7, 11 + u, 3, 7, B.b); g.p(7, 11 + u, B.hi); g.r(9, 11 + u, 1, 7, B.sh); if (L.markR) { g.p(8, 13 + u, L.markR.b); g.p(8, 14 + u, L.markR.b); g.p(7, 13 + u, L.markR.sh); } }
  if (L.strap) { for (let i = 0; i < 5; i++) g.p(8 + i, 10 + i + u, L.belt.b); }
  g.r(7, 15 + u, 6, 1, L.belt.dk); g.p(7, 15 + u, L.gold.b);
  if (L.pouch) { g.r(11, 15 + u, 2, 2, L.leather.b); g.p(12, 16 + u, L.leather.sh); }
  if (L.scarf && L.face !== 'cloth') { g.r(7, 10 + u, 5, 1, L.scarf.b); g.r(12, 10 + u, 2, 1, L.scarf.sh); g.p(13, 11 + u, L.scarf.sh); g.p(14, 12 + u, L.scarf.dk); }
  // Arm (zugewandt)
  const S = sleeveOf(L), Hd = handOf(L);
  if (act === 'a1') { g.r(10, 6 + u, 2, 5, S.b); g.r(11, 6 + u, 1, 5, S.sh); g.r(10, 4 + u, 2, 2, Hd.b); }
  else if (act === 'a2') { g.r(8, 11 + u, 2, 2, S.b); g.r(5, 12 + u, 4, 2, S.b); g.r(5, 13 + u, 4, 1, S.sh); g.r(3, 12 + u, 2, 2, Hd.b); g.p(4, 13 + u, Hd.sh); }
  else if (act === 'a3') { g.r(8, 12 + u, 2, 3, S.b); g.r(6, 14 + u, 3, 2, S.b); g.p(8, 15 + u, S.sh); g.r(5, 15 + u, 2, 2, Hd.b); }
  else if (act === 'cast') { g.r(6, 10 + u, 4, 2, S.b); g.r(6, 11 + u, 4, 1, S.sh); g.r(4, 9 + u, 2, 2, Hd.b); if (L.glow) g.p(3, 8 + u, L.glow); }
  else if (act === 'hit') { g.r(11, 7 + u, 2, 4, S.b); g.p(12, 7 + u, S.sh); g.r(11, 5 + u, 2, 2, Hd.b); }
  else if (act === 'guard') { g.r(8, 10 + u, 2, 2, S.b); g.r(5, 10 + u, 4, 2, S.b); g.r(5, 11 + u, 4, 1, S.sh); g.r(4, 8 + u, 2, 2, Hd.b); }   // Arm hoch vor dem Gesicht
  else if (act === 'sit') { g.r(8, 10 + u, 2, 4, S.b); g.r(6, 14 + u, 3, 1, S.b); g.r(5, 14 + u, 2, 1, Hd.b); }                                 // Hand auf dem Knie
  else if (act === 'trade') { g.r(8, 11 + u, 2, 2, S.b); g.r(4, 12 + u, 5, 2, S.b); g.r(4, 13 + u, 5, 1, S.sh); g.r(2, 11 + u, 2, 2, Hd.b); }   // Hand nach vorn
  else { const ax = 9 + (P.arm > 0 ? 1 : P.arm < 0 ? -1 : 0) + (act === 'kneel' ? -1 : 0);
    g.r(ax, 10 + u, 2, 5, S.b); g.r(ax + 1, 10 + u, 1, 5, S.sh); g.p(ax, 10 + u, S.hi); g.r(ax, 15 + u, 2, 2, Hd.b); g.p(ax + 1, 16 + u, Hd.sh); }
  if (L.armor === 'plate') { g.r(8, 9 + u, 4, 2, A.b); g.r(8, 9 + u, 3, 1, A.hi); g.r(8, 11 + u, 4, 1, A.sh); }
  // Kopf
  headSide(g, L, { u: u + (P.hdy || 0), hx });
  if (L.shield) shieldAt(g, L, act === 'guard' ? 1 : 3, act === 'guard' ? 8 + u : 11 + u, true);   // Deckung: Schild hoch und vor
  return g;
}
function headSide(g, L, P) {
  const u = P.u, x = P.hx, S = L.skin;
  if (L.sp === 'goblin') {
    g.r(6 + x, 4 + u, 7, 6, S.b); g.r(7 + x, 3 + u, 5, 1, S.b); g.r(11 + x, 4 + u, 2, 6, S.sh); g.p(7 + x, 4 + u, S.hi); g.p(8 + x, 3 + u, S.hi);
    g.r(3 + x, 6 + u, 3, 2, S.b); g.p(3 + x, 7 + u, S.sh);                                          // lange Nase
    g.r(12 + x, 4 + u, 2, 1, S.sh); g.p(14 + x, 3 + u, S.sh); g.p(13 + x, 5 + u, S.dk);                 // Ohr
    g.p(7 + x, 6 + u, '#e0c24a'); g.r(5 + x, 8 + u, 3, 1, DEEP); g.p(6 + x, 8 + u, L.bone.b);
    if (L.helm === 'cap') { const H = L.helmR; g.r(6 + x, 2 + u, 7, 3, H.b); g.r(7 + x, 2 + u, 3, 1, H.hi); g.r(11 + x, 2 + u, 2, 3, H.sh); g.r(5 + x, 4 + u, 9, 1, H.dk); }
    return;
  }
  if (L.helm === 'great') return greatHelm(g, L, u, x, 'W');
  if (L.hooded) {
    const H = L.hood;
    g.r(11 + x, 1 + u, 2, 1, H.b); g.r(9 + x, 2 + u, 5, 1, H.b); g.r(8 + x, 3 + u, 7, 1, H.b); g.r(6 + x, 4 + u, 9, 6, H.b); g.r(7 + x, 10 + u, 6, 1, H.sh);
    g.r(9 + x, 2 + u, 2, 1, H.hi); g.r(8 + x, 3 + u, 2, 1, H.hi); g.r(6 + x, 4 + u, 2, 1, H.hi);
    g.r(13 + x, 3 + u, 2, 7, H.sh); g.p(14 + x, 9 + u, H.dk); g.p(12 + x, 1 + u, H.sh);
    g.r(6 + x, 5 + u, 3, 1, H.dk); g.r(6 + x, 6 + u, 3, 3, DEEP); g.r(7 + x, 9 + u, 2, 1, DEEP); g.p(9 + x, 6 + u, H.dk); g.p(9 + x, 7 + u, H.dk);
    const G1 = L.glow;
    if (L.face === 'skull') { g.r(6 + x, 6 + u, 2, 3, L.bone.b); g.p(6 + x, 6 + u, L.bone.hi); g.p(7 + x, 7 + u, G1 || DEEP); g.p(6 + x, 9 + u, L.bone.sh); }
    else if (L.face === 'mask') { const M = ramp('#6b675e'); g.r(6 + x, 6 + u, 2, 4, M.b); g.p(6 + x, 6 + u, M.hi); g.p(7 + x, 7 + u, G1 || DEEP); g.p(5 + x, 8 + u, M.sh); }
    else if (L.face === 'cloth') { g.r(6 + x, 6 + u, 2, 1, S.sh); g.p(6 + x, 6 + u, '#1b1411'); const C = L.scarf || ramp('#3a3026'); g.r(5 + x, 7 + u, 3, 2, C.b); g.p(5 + x, 7 + u, C.hi); }
    else if (L.face === 'shadow' || G1) { g.p(6 + x, 7 + u, G1 || '#b0412f'); }
    else { g.r(6 + x, 7 + u, 2, 3, S.sh); g.p(6 + x, 7 + u, '#1b1411'); g.p(5 + x, 8 + u, S.sh); }
    return;
  }
  g.r(8 + x, 3 + u, 4, 1, S.b); g.r(7 + x, 4 + u, 6, 5, S.b); g.r(8 + x, 9 + u, 4, 1, S.sh); g.r(11 + x, 4 + u, 2, 5, S.sh);
  g.p(6 + x, 6 + u, S.b); g.p(6 + x, 7 + u, S.sh); g.p(8 + x, 4 + u, S.hi);
  if (L.sp === 'skeleton') { g.p(8 + x, 6 + u, DEEP); g.p(7 + x, 8 + u, DEEP); }
  else { g.p(8 + x, 5 + u, S.sh); g.p(8 + x, 6 + u, '#1b1411'); g.p(7 + x, 8 + u, S.dk); g.p(11 + x, 6 + u, S.dk); }
  const H = L.hair, hs = L.hs;
  if (!L.helm || L.helm === 'nasal' || L.helm === 'cap') {
    if (hs !== 2) { g.r(8 + x, 2 + u, 5, 1, H.b); g.r(7 + x, 3 + u, 7, 1, H.b); g.r(11 + x, 4 + u, 3, 3, H.b); g.p(9 + x, 2 + u, H.hi); g.p(8 + x, 3 + u, H.hi); g.r(13 + x, 3 + u, 1, 4, H.sh);
      if (hs === 1) g.r(11 + x, 7 + u, 3, 4, H.sh); if (hs === 3) g.r(13 + x, 2 + u, 2, 1, H.b); }
    else g.r(12 + x, 5 + u, 1, 2, H.sh);
  }
  if (L.beard) { g.r(7 + x, 8 + u, 4, 2, H.b); g.p(7 + x, 8 + u, H.hi); g.r(8 + x, 10 + u, 2, 1, H.sh); }
  const M = L.helmR;
  if (L.helm === 'nasal') { g.r(8 + x, 2 + u, 5, 1, M.b); g.r(7 + x, 3 + u, 7, 2, M.b); g.p(8 + x, 2 + u, M.hi); g.r(7 + x, 3 + u, 2, 1, M.hi); g.r(12 + x, 3 + u, 2, 2, M.sh); g.r(7 + x, 5 + u, 7, 1, M.dk); g.r(6 + x, 5 + u, 1, 2, M.b); }
  else if (L.helm === 'cap') { g.r(8 + x, 2 + u, 5, 1, M.b); g.r(7 + x, 3 + u, 7, 2, M.b); g.p(8 + x, 2 + u, M.hi); g.r(12 + x, 3 + u, 2, 2, M.sh); }
  else if (L.helm === 'hat') { g.r(8 + x, 0 + u, 4, 1, M.b); g.r(8 + x, 1 + u, 5, 2, M.b); g.p(8 + x, 1 + u, M.hi); g.r(4 + x, 3 + u, 11, 1, M.b); g.r(4 + x, 3 + u, 3, 1, M.hi); g.r(8 + x, 2 + u, 5, 1, L.belt.dk); }
  else if (L.helm === 'scarf') { g.r(8 + x, 2 + u, 5, 1, M.b); g.r(7 + x, 3 + u, 7, 2, M.b); g.p(8 + x, 2 + u, M.hi); g.r(12 + x, 3 + u, 2, 6, M.sh); g.r(11 + x, 5 + u, 1, 4, M.b); }
}

// Ausweichrolle: zusammengerollte Figur (wird beim Zeichnen in 90°-Schritten gedreht)
function paintTuck(L) {
  const g = new G(20, 25, 1), C = L.cloak || L.cloth, H = L.hood || L.hair;
  for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) {
    const d = i * i + j * j; if (d > 38) continue;
    g.p(10 + i, 15 + j, i + j < -5 ? C.hi : i + j > 4 ? C.dk : i + j > 0 ? C.sh : C.b);
  }
  for (let j = -4; j <= -1; j++) for (let i = -5; i <= -2; i++) g.p(10 + i, 15 + j, (i + j) < -7 ? H.hi : H.b);
  const Bo = L.boots || L.skin; g.r(14, 18, 2, 2, Bo.sh); g.p(15, 17, Bo.b);
  g.r(8, 16, 4, 1, L.belt.dk);
  return g;
}

// Ausweichrolle v2: zusammengerollte Figur im feinen Raster (Kugel mit Kapuze/Kopf, Stiefel, Gürtel), um die Mitte gedreht
function paintTuck2(L) {
  const g = new G(40, 40), C = L.cloak || L.robe || L.cloth, H = L.hooded ? (L.hood || C) : L.hair, Bo = L.boots || L.skin;
  for (let j = -11; j <= 11; j++) for (let i = -11; i <= 11; i++) { const d = i * i + j * j; if (d > 121) continue;
    g.p(20 + i, 20 + j, d > 100 ? (i + j < 0 ? C.hi : C.dk) : i + j < -8 ? C.hi : i + j > 8 ? C.dk : i + j > 1 ? C.sh : C.b); }
  for (let j = -8; j <= -2; j++) for (let i = -9; i <= -3; i++) if (i * i + j * j < 40) g.p(20 + i, 20 + j, i + j < -12 ? H.hi : H.b);
  g.r(27, 25, 5, 4, Bo.sh); g.r(27, 25, 5, 1, Bo.b); g.r(14, 22, 12, 2, L.belt.dk); g.p(19, 22, L.gold.b);
  return g;
}

// ---------------- Frame-Cache ----------------
const frameCache = new Map(), cacheStat = { miss: 0, clears: 0 };
export const frameCacheInfo = () => ({ size: frameCache.size, ...cacheStat });
function cacheGet(k, make) {
  let f = frameCache.get(k); if (f) return f;
  if (frameCache.size > 4000) { let n = 400; for (const key of frameCache.keys()) { frameCache.delete(key); if (--n <= 0) break; } cacheStat.clears++; }   /* Audit D7: älteste 10 % verwerfen statt alles (kein Spitzenruckler), warmed bleibt */
  cacheStat.miss++;
  f = make(); frameCache.set(k, f); return f;
}
// BUG-093: ein neues Bild (Figur × Richtung × Pose) kostet beim ersten Zeichnen ~10 ms (Malen + Vergröbern) — mitten im Frame
// ein Ruckler. Sichtbare Figuren melden sich hier; Stand- und Laufposen aller vier Richtungen werden in Browser-Pausen vorgebacken.
const warmQ = [], warmed = new Set();
let warmOn = false;
const idleCb = window.requestIdleCallback || (f => setTimeout(() => f({ timeRemaining: () => 8 }), 40));
export function warm(spec, noArm = null) {
  const k = specKey(spec) + '|' + (noArm || '') + ART;
  if (warmed.has(k)) return;
  warmed.add(k);
  for (const d of 'SNWE') for (const p of ['i0', 'w0', 'w1', 'w2', 'w3', 'i1']) warmQ.push([spec, d, p, noArm]);
  if (!warmOn) { warmOn = true; idleCb(warmRun); }
}
function warmRun(dl) {
  warmOn = false;
  while (warmQ.length && dl.timeRemaining() > 4) { const [sp, d, p, n] = warmQ.shift(); humanFrame(sp, d, p, n); }
  if (warmQ.length) { warmOn = true; idleCb(warmRun); }
}
export const warmPending = () => warmQ.length;
// dir: 'S' | 'N' | 'W' | 'E'. pose: i0 i1 w0..w3 a1 a2 hit cast kneel tuck down dead
export function humanFrame(spec, dir, pose, noArm = null) {       // noArm: Waffenarm weglassen (zeichnet der Renderer zur Waffe)
  if (ART === 'R') return humanFrameR(spec, dir, pose);
  if (spec.atlas && atlasOn()) { const f = atlasPose(spec.atlas, dir, pose); if (f) return f; }   // Stil F: Bild aus dem Blatt
  const sk = specKey(spec);
  return cacheGet(sk + dir + pose + (noArm || ''), () => {
    const L = resolve(spec, sk);
    if (!OLD_FIGURES) {                                               // v2: Menschen, Untote, Goblins
      const asG = o => { const g = new G(o.w, o.h); g.a = o.a; return g; };
      if (pose === 'tuck') return meta(toCanvas(paintTuck2(L)), 1, 20, 20);
      if (pose === 'down' || pose === 'dead') return meta(toCanvas(asG(paintHuman(pose === 'dead' ? { ...L, glow: '' } : L, 'W', 'i0')).rotCW()), 1, 30, 31);
      const g = asG(paintHuman(L, dir === 'E' ? 'W' : dir, pose, noArm));
      return meta(toCanvas(dir === 'E' ? g.flipX() : g), 1, FW2 / 2, 57);
    }
    if (pose === 'tuck') return meta(toCanvas(paintTuck(L)), PX, 10, 16);
    if (pose === 'down' || pose === 'dead') {
      const s2 = pose === 'dead' ? { ...L, glow: '' } : L;
      return meta(toCanvas(paintSide(s2, 'i0').rotCW()), PX, 12.5, 16);
    }
    if (dir === 'S') return meta(toCanvas(paintFront(L, pose, false)), PX, 10, 23);
    if (dir === 'N') return meta(toCanvas(paintFront(L, pose, true)), PX, 10, 23);
    const g = paintSide(L, pose);
    return meta(toCanvas(dir === 'E' ? g.flipX() : g), PX, 10, 23);
  });
}

// S14 Stil R: ein Bild je Spec × Richtung × Pose × Waffenzustand (Arme gehören zum Bild, die Hand steht im Frame: f.hand/f.off).
// W = { mode, wt, q, v, oct, two, low } aus render.js; Osten = gespiegelter Westen (Zielwinkel gespiegelt).
const asG = o => { const g = new G(o.w, o.h); g.a = o.a; return g; };
export function humanFrameR(spec, dir, pose, W = null) {
  const sk = specKey(spec), wk = W ? `${W.mode},${W.wt},${W.q},${W.v},${W.oct},${W.two ? 1 : 0},${W.low || 0},${W.pull || 0}` : '';
  return cacheGet('R|' + sk + dir + pose + '|' + wk, () => {
    const L = resolve(spec, 'R' + sk, 0.35);
    if (pose === 'tuck') return meta(toCanvas(asG(paintTuckR(L)), false), RPX, 10, 10);
    if (pose === 'down' || pose === 'dead') { const o = paintR(pose === 'dead' ? { ...L, glow: '' } : L, 'W', 'i0'); return meta(toCanvas(asG(o.g).rotCW(), false), RPX, 25, 26 + DX); }
    const E = dir === 'E', o = paintR(L, E ? 'W' : dir, pose, W && E ? { ...W, oct: (12 - W.oct) % 8 } : W), g = asG(o.g);
    const f = meta(toCanvas(E ? g.flipX() : g, false), RPX, ROX, ROY), fx = p => p && (E ? [RW - p[0], p[1]] : p);
    f.hand = fx(o.hand); f.off = fx(o.off); f.eyeY = o.eyeY; f.limbs = {}; for (const k in o.limbs) f.limbs[k] = fx(o.limbs[k]);
    return f;
  });
}
// Pose aus dem Spielzustand
export function poseOf(e, now, bow) {
  let face = e.facing || 0;
  const sw = e.swing || 0;
  // Körper folgt der Zielrichtung (Master-Prompt §27): Spieler immer, andere im Kampf — sonst kreiste nur die Waffe um eine
  // Figur, die in Laufrichtung schaute. Rückwärtslaufen = Blick zum Ziel, Beine laufen (wie Zielen im Gehen).
  if ((sw > 0 || e.channel || e.kind === 'player' || e.aggroId || e.threatId) && e.aim != null) {
    const ca = Math.cos(e.aim), sa = Math.sin(e.aim);
    face = Math.abs(ca) > Math.abs(sa) * 0.9 ? (ca > 0 ? 3 : 2) : (sa > 0 ? 0 : 1);
  }
  const dir = 'SNWE'[face] || 'S';
  if (e.dodge) return { dir, pose: 'tuck', rot: ((e.dodge.t / 65) | 0) % 4 };
  if (e.landT > now) return { dir, pose: 'kneel' };                    // Landung nach der Rolle: kurz in die Knie
  if (e.cover) return { dir, pose: 'guard' };                          // Deckung des Spielers (nicht e.guard: das ist die Stadtwache)
  if (e.act && now < e.act.until && now >= e.act.at && !(e.vx || e.vy) && !(sw > 0)) {   // Interaktion: knien, arbeiten, aufrichten
    const k = (now - e.act.at) / (e.act.until - e.act.at), d = e.act.dir || dir;
    if (e.act.kind === 'work') return { dir: d, pose: ((k * 4) | 0) & 1 ? 'a2' : 'a1' };           // Axt/Hacke: zwei Schläge
    if (e.act.kind === 'rise') return { dir: d, pose: k < 0.5 ? 'kneel' : 'hit' };                // vom Boden hoch: Knie, dann wankend
    if (e.act.kind === 'strike') return { dir: d, pose: k < 0.4 ? 'a2' : 'a3' };                  // Handkante: Stoß und Nachgehen
    if (e.act.kind === 'trade') return { dir: d, pose: 'trade' };
    if (e.act.kind === 'gesture') return { dir: d, pose: e.act.pose || 'zeigen' };   /* Roadmap P8 */
    return { dir: d, pose: 'kneel' };                                                             // suchen, sammeln, beten
  }
  if (e.draw > 0) return { dir, pose: 'cast' };                         // Bogen gespannt
  if (e.telegraph > 0 && !(sw > 0)) return { dir, pose: 'a1' };          // Ansage: erhobene Waffe
  if (sw > 0) return { dir, pose: bow ? 'cast' : sw < 0.3 ? 'a1' : sw < 0.72 ? 'a2' : 'a3' };
  if (e.channel || e.casting || (e.castT && now - e.castT < 450 && now >= e.castT)) return { dir, pose: 'cast' };   // S15 P4: Sammelphase
  if ((e.lastHurt && now - e.lastHurt < 170 && now >= e.lastHurt) || e.stagger > 0) return { dir, pose: 'hit' };   // Treffer / Taumeln
  if (e.vx || e.vy) return { dir, pose: 'w' + (((now / 115 + (e.seed || 0) * 3) | 0) & 3) };
  if (e.sitting) return { dir: e.sitDir || dir, pose: 'sit' };           // sitzt auf Bank/Stuhl (Schenke, Feierabend)
  return { dir, pose: ((now / 650 + (e.seed || 0)) | 0) & 1 ? 'i1' : 'i0' };
}

// ---------------- Waffen (liegend, Spitze nach +x, Griff bei gx/gy) ----------------
// Jede Waffe hat ein eigenes Design (Form, Griff, Material, Abnutzung). Seltene/heilige Klingen tragen Runen.
const WPN = new Map();
const OLD_WEAPONS = false, OLD_FIGURES = false;                                          // Rückfall auf die 2-px-Designs (nur zum Vergleich)
const WOOD = () => ramp('#5b452a'), WRAP = () => ramp('#3a2a1c'), IRON = () => ramp('#6d6154');
function steelOf(r) { return ramp(r === 'mythic' ? '#a9d4e8' : r === 'legendary' ? '#d8b25a' : r === 'epic' ? '#b7a27a' : r === 'rare' ? '#b4b8bd' : '#a8a196'); }
function wrapGrip(g, x0, x1, y) { const W = WRAP(); for (let x = x0; x <= x1; x++) g.p(x, y, (x & 1) ? W.b : W.hi); }
const DESIGNS = {
  rusty_sword(g, St) {                                   // kurz, schartig, rostfleckig
    wrapGrip(g, 1, 3, 3); g.p(0, 3, IRON().b); g.r(4, 1, 1, 5, IRON().sh); g.p(4, 1, IRON().b);
    g.r(5, 2, 10, 1, St.hi); g.r(5, 3, 10, 1, St.b); g.p(15, 3, St.b); g.p(16, 3, St.sh);
    for (const [x, y] of [[7, 3], [9, 2], [12, 3], [13, 2], [6, 2]]) g.p(x, y, (x & 1) ? '#7a4a2a' : '#8c5a30');
    g.a[2 * g.w + 11] = null;                                           // Scharte
    return { gx: 2, gy: 3, blade: [5, 15, 3] };
  },
  longsword(g, St) {                                     // lange Klinge mit Hohlkehle, Scheibenknauf
    wrapGrip(g, 2, 5, 4); g.r(0, 3, 2, 3, IRON().b); g.p(0, 3, IRON().hi);
    g.r(6, 1, 1, 7, IRON().b); g.p(6, 1, IRON().hi); g.p(6, 7, IRON().sh); g.p(7, 1, IRON().sh); g.p(7, 7, IRON().sh);
    g.r(7, 3, 15, 1, St.hi); g.r(7, 4, 15, 1, St.b); g.r(7, 5, 15, 1, St.sh); g.r(8, 4, 11, 1, St.sh);
    g.p(22, 4, St.b); g.p(23, 4, St.sh);
    return { gx: 3, gy: 4, blade: [7, 22, 4] };
  },
  greatsword(g, St) {                                    // Zweihänder: Parierhaken, Fehlschärfe, breite Klinge
    wrapGrip(g, 1, 7, 5); g.r(0, 4, 1, 3, IRON().b);
    g.r(8, 1, 1, 9, IRON().b); g.p(8, 1, IRON().hi); g.p(9, 1, IRON().b); g.p(9, 9, IRON().sh); g.p(8, 9, IRON().sh);
    g.r(9, 4, 3, 3, St.sh); g.p(10, 3, IRON().b); g.p(10, 7, IRON().b);
    g.r(12, 3, 17, 1, St.hi); g.r(12, 4, 17, 2, St.b); g.r(12, 6, 17, 1, St.sh); g.r(13, 5, 12, 1, St.sh);
    g.r(29, 4, 1, 2, St.b); g.p(30, 5, St.sh);
    return { gx: 4, gy: 5, blade: [12, 29, 4] };
  },
  axe(g, St) {                                           // Bartbeil: kurzer Stiel, nach unten gezogene Klinge
    const W = WOOD(); g.r(1, 6, 13, 1, W.b); g.r(1, 7, 13, 1, W.sh); g.p(4, 6, W.hi); g.p(9, 7, W.dk);
    g.r(11, 4, 2, 5, IRON().b); g.p(11, 4, IRON().hi);                      // Tülle
    for (const [x, y0, y1] of [[13, 4, 8], [14, 3, 9], [15, 2, 10], [16, 1, 11]]) {  // fächerförmiges Blatt mit Bart
      g.r(x, y0, 1, y1 - y0 + 1, x === 16 ? St.hi : St.b); g.p(x, y1, St.sh); }
    g.p(15, 2, St.hi); g.p(14, 9, St.sh); g.p(13, 8, St.sh);
    return { gx: 3, gy: 6, blade: null };
  },
  greataxe(g, St) {                                      // Kriegsaxt: langer Schaft, Doppelblatt
    const W = WOOD(); g.r(1, 8, 21, 1, W.b); g.r(1, 9, 21, 1, W.sh); wrapGrip(g, 2, 6, 8); g.p(22, 8, IRON().b);
    for (let dy = -7; dy <= 7; dy++) { const w = 4 - Math.round(Math.abs(dy) / 2.4); if (w <= 0) continue;
      g.r(18 - w, 8 + dy, w, 1, dy < 0 ? St.b : St.sh); g.r(21, 8 + dy, w, 1, dy < 0 ? St.b : St.sh); g.p(17 - w, 8 + dy, St.hi); g.p(20 + w, 8 + dy, St.hi); }
    g.r(18, 6, 3, 5, IRON().b); g.p(18, 6, IRON().hi);
    return { gx: 5, gy: 8, blade: null };
  },
  mace(g, St) {                                          // Flanschkolben mit Dornen
    wrapGrip(g, 1, 4, 5); const W = WOOD(); g.r(5, 5, 5, 1, W.b); g.r(5, 6, 5, 1, W.sh);
    g.r(10, 3, 4, 5, St.b); g.r(10, 3, 4, 1, St.hi); g.r(13, 4, 1, 4, St.sh);
    for (const [x, y] of [[11, 1], [11, 2], [11, 8], [11, 9], [14, 5], [15, 5], [9, 3], [9, 7]]) g.p(x, y, St.sh);
    g.p(11, 1, St.hi);
    return { gx: 2, gy: 5, blade: null };
  },
  spear(g, St) {                                         // Blattspitze, Tülle, roter Wimpel
    const W = WOOD(); g.r(1, 4, 25, 1, W.b); g.r(1, 5, 25, 1, W.sh); g.p(8, 4, W.hi); g.p(16, 5, W.dk);
    g.r(26, 3, 2, 3, IRON().b); g.p(26, 3, IRON().hi);
    g.r(28, 3, 5, 3, St.b); g.r(28, 3, 5, 1, St.hi); g.p(29, 2, St.hi); g.p(30, 2, St.b); g.p(29, 6, St.sh); g.p(30, 6, St.sh); g.p(33, 4, St.b); g.p(34, 4, St.sh);
    const R = ramp('#8c2e22'); g.r(24, 6, 2, 3, R.b); g.p(24, 9, R.sh); g.p(25, 8, R.sh);
    return { gx: 9, gy: 4, blade: [28, 34, 4] };
  },
  dagger(g, St) {                                        // Ringparierstange, leicht gebogene Klinge
    wrapGrip(g, 1, 3, 3); g.p(0, 3, IRON().b); g.r(4, 1, 1, 5, IRON().b); g.p(4, 1, IRON().hi); g.p(5, 1, IRON().sh);
    g.r(5, 3, 6, 1, St.b); g.r(5, 2, 5, 1, St.hi); g.p(11, 2, St.b); g.p(12, 2, St.sh);
    return { gx: 2, gy: 3, blade: [5, 12, 3] };
  },
  pickaxe(g, St) {
    const W = WOOD(); g.r(1, 7, 13, 1, W.b); g.r(1, 8, 13, 1, W.sh);
    g.r(13, 1, 2, 13, St.b); g.r(13, 1, 1, 13, St.hi); g.p(12, 1, St.sh); g.p(12, 13, St.sh); g.p(15, 7, IRON().b);
    return { gx: 3, gy: 7, blade: null };
  },
  staff(g) {                                             // knorriger Stab, Klaue hält einen Kristall
    const W = WOOD(), C = ramp('#3f6fb0');
    for (let x = 1; x <= 19; x++) { const y = 5 + ((x % 7 === 3) ? -1 : 0); g.p(x, y, W.b); g.p(x, y + 1, W.sh); }
    g.p(6, 4, W.dk); g.p(13, 7, W.dk);
    g.p(20, 3, W.b); g.p(21, 2, W.b); g.p(20, 8, W.sh); g.p(21, 9, W.sh); g.p(24, 2, W.sh);   // Klaue
    g.r(21, 4, 3, 3, C.b); g.p(22, 3, C.hi); g.p(21, 4, C.hi); g.p(24, 5, C.sh); g.p(22, 7, C.dk); g.p(23, 5, '#cfe6ff');
    return { gx: 6, gy: 5, blade: null, orb: [22, 5] };
  },
  rapier(g, St) {                                        // Korbgefäß, lange schmale Klinge, Ricasso
    wrapGrip(g, 2, 4, 4); g.p(1, 4, IRON().b); g.p(0, 4, IRON().hi);
    g.r(5, 1, 1, 7, IRON().b); g.p(5, 1, IRON().hi); g.p(6, 1, IRON().sh); g.p(6, 7, IRON().sh); g.p(4, 2, IRON().sh); g.p(4, 6, IRON().sh);   // Bügel
    g.r(6, 4, 3, 1, St.b); g.r(9, 4, 17, 1, St.hi); g.p(26, 4, St.b); g.p(27, 4, St.sh);
    return { gx: 3, gy: 4, blade: [9, 26, 4] };
  },
  warhammer(g, St) {                                     // langer Schaft, Hammerkopf, Rückseitendorn
    const W = WOOD(); g.r(1, 7, 20, 1, W.b); g.r(1, 8, 20, 1, W.sh); wrapGrip(g, 2, 6, 7); g.p(10, 7, W.hi);
    g.r(19, 3, 5, 9, St.b); g.r(19, 3, 5, 1, St.hi); g.r(23, 4, 1, 8, St.sh); g.r(19, 11, 5, 1, St.dk);
    g.r(24, 5, 2, 5, St.sh); g.p(25, 5, St.b);                              // Schlagfläche
    g.p(18, 6, St.sh); g.p(17, 6, St.sh); g.p(16, 7, St.sh);                  // Dorn
    return { gx: 5, gy: 7, blade: null };
  },
  halberd(g, St) {                                       // Schaft, Beilblatt, Haken, Stoßspitze
    const W = WOOD(); g.r(1, 7, 29, 1, W.b); g.r(1, 8, 29, 1, W.sh); g.p(10, 7, W.hi); g.p(20, 8, W.dk);
    for (const [x, y0, y1] of [[27, 1, 7], [28, 0, 7], [29, 1, 7], [30, 2, 7]]) g.r(x, y0, 1, y1 - y0 + 1, x === 28 ? St.hi : St.b);
    g.p(27, 9, St.sh); g.p(28, 10, St.sh);                                   // Haken
    g.r(31, 7, 5, 1, St.hi); g.r(31, 8, 4, 1, St.b); g.p(36, 7, St.sh);      // Spitze
    return { gx: 9, gy: 7, blade: [31, 36, 7] };
  },
  crossbow(g, St) {                                      // Schaft nach vorn, Bogen quer, Sehne, Abzug
    const W = WOOD(); g.r(1, 5, 16, 2, W.b); g.r(1, 6, 16, 1, W.sh); g.p(3, 5, W.hi); g.r(2, 7, 2, 2, W.sh);   // Schaft, Kolben
    g.r(15, 0, 1, 12, St.b); g.p(15, 0, St.hi); g.p(14, 0, St.sh); g.p(14, 11, St.sh);                            // Bogen (Stahl)
    for (let y = 1; y <= 10; y++) g.p(12, y, '#c9bfa6');                                                          // Sehne gespannt
    g.p(8, 7, IRON().b); g.p(8, 8, IRON().sh);                                                                     // Abzug
    return { gx: 4, gy: 6, blade: null };
  },
  wand(g) {                                              // kurzer Stab, gebundener Kristall
    const W = WOOD(), C = ramp('#6f8fd0'); g.r(1, 3, 10, 1, W.b); g.r(1, 4, 10, 1, W.sh); g.p(4, 3, W.dk);
    g.r(11, 2, 3, 3, C.b); g.p(12, 1, C.hi); g.p(11, 2, C.hi); g.p(13, 4, C.sh); g.p(12, 3, '#e8f4ff');
    return { gx: 2, gy: 3, blade: null, orb: [12, 3] };
  },
  gorak_cleaver(g, St) {      // eigener dunkler Stahl                                 // riesiges Hackmesser: Loch, Rost, gezackte Kante
    wrapGrip(g, 1, 7, 7); const R = ramp('#7a4a2a'); St = ramp('#7d766a');
    g.r(8, 2, 15, 9, St.b); g.r(8, 2, 15, 1, St.hi); g.r(8, 10, 15, 1, St.sh); g.r(22, 3, 1, 7, St.hi);
    g.a[5 * g.w + 11] = null; g.a[5 * g.w + 12] = null;                       // Aufhängeloch
    for (const [x, y] of [[10, 8], [14, 4], [17, 9], [19, 6], [12, 9]]) g.p(x, y, (x & 1) ? R.b : R.sh);
    for (let x = 9; x < 23; x += 3) g.a[11 * g.w + x] = null;                  // Scharten
    return { gx: 3, gy: 7, blade: [8, 22, 6] };
  },
};
const SIZE = { rusty_sword: [18, 7], longsword: [25, 9], greatsword: [32, 11], axe: [18, 13], greataxe: [27, 17], mace: [17, 11],
  spear: [36, 10], dagger: [14, 7], pickaxe: [17, 15], staff: [26, 11], gorak_cleaver: [25, 13],
  rapier: [28, 9], warhammer: [27, 13], halberd: [37, 12], crossbow: [18, 12], wand: [15, 6] };
const BY_TYPE = { sword: 'longsword', great: 'greatsword', axe: 'axe', mace: 'mace', spear: 'spear', dagger: 'dagger', staff: 'staff',
  rapier: 'rapier', hammer: 'warhammer', polearm: 'halberd', crossbow: 'crossbow', wand: 'wand' };

export function weaponSprite(key, rarity, holy, wtype, bare = false) {
  const k = key + '|' + rarity + '|' + (holy ? 1 : 0) + ART + (bare ? '|bare' : '');
  let w = WPN.get(k); if (w) return w;
  const St = steelOf(rarity);
  let g, info;
  if (!OLD_WEAPONS) {                                               // G3: feines Raster (1 Welt je Pixel)
    const sc = ART === 'R' ? (['bow', 'crossbow'].includes(wtype) || key === 'longbow' || key === 'shortbow' ? 0.95 : 0.82) / RPX : 1;   // S14 Stil R: Waffen im 1,5er-Raster; S15 (Nutzer: Waffen zu groß): Nahkampf 18 % kleiner, gleiches Raster
    const r = paintWeapon2(key === 'longbow' || key === 'hunting_bow' ? (key === 'longbow' ? 'longbow' : 'shortbow') : key, wtype, St, WOOD(), WRAP(), IRON(), sc, rarity, bare);
    g = new G(r.g.w, r.g.h); g.a = r.g.a; info = { gx: r.gx, gy: r.gy, blade: r.blade, orb: r.orb, str: r.str, pulse: r.pulse, pulseCol: r.pulseCol, px: ART === 'R' ? RPX : 1 / sc };
  } else if (wtype === 'bow' || key === 'shortbow' || key === 'longbow') {
    const L = key === 'longbow' ? 12 : 8, wood = WOOD(), grip = WRAP();
    g = new G(9, L * 2 + 3); info = { gx: 2, gy: L + 1, blade: null };
    for (let y = 1; y <= L * 2 + 1; y++) { const t = (y - L - 1) / L, x = Math.round(1 + 4 * (1 - t * t));
      g.p(x, y, Math.abs(t) < 0.25 ? grip.b : wood.b); g.p(x + 1, y, wood.sh); }
    g.p(6, 1, wood.dk); g.p(6, L * 2 + 1, wood.dk);                          // geschwungene Enden
    for (let y = 2; y <= L * 2; y++) g.p(1, y, '#c9bfa6');
  } else {
    const d = DESIGNS[key] ? key : BY_TYPE[wtype] || 'longsword';
    const [W0, H0] = SIZE[d]; g = new G(W0, H0);
    info = DESIGNS[d](g, St);
  }
  const runes = rarity === 'mythic' || rarity === 'legendary' || rarity === 'epic' || holy;
  if (runes && info.blade) { const [x0, x1, y] = info.blade, rc = holy ? '#f2e6b0' : rarity === 'mythic' ? '#e8f8ff' : rarity === 'legendary' ? '#ffd27a' : '#e0a060';
    for (let x = x0 + 2; x < x1 - 1; x += 3) { g.p(x, y, rc); if (info.px === 1) g.p(x + 1, y, rc); } }
  w = { cv: toCanvas(g), px: PX, ...info, runes };
  // S12: Waffen im feinen Raster (vergrößert zeichnet drawHumanoid)
  WPN.set(k, w); return w;
}

// ---------------- Vierbeiner (Seitenansicht, Blick nach links) ----------------
function paintBeast(type, pal, frame, act) {
  const g = new G(28, 18, 0, 2), boar = type === 'boar';
  const F = ramp(pal.body || '#5b5145'), D = ramp(pal.dark || '#3a332b'), eye = pal.eye || '#c8a545';
  const belly = ramp(mix(pal.body || '#5b5145', '#c8b89a', boar ? 0.12 : 0.32));
  const sw = [1, 0, -1, 0][frame & 3], lunge = act === 'a2' ? -2 : act === 'a1' ? 1 : 0, low = act === 'a1' ? 1 : 0;
  // Beine: Oberschenkel 2 px, Unterschenkel 1 px, Pfote/Huf 2 px; ferne Beine dunkel
  const bear = type === 'bear', deer = type === 'deer', dog = type === 'wild_dog';
  const legTop = boar ? 11 : bear ? 12 : deer ? 10 : dog ? 10 : 10, legBot = boar ? 15 : bear ? 15 : deer ? 17 : 16;
  const legs = dog ? [[9, 0], [10, 1], [17, 0], [18, 1]] : boar ? [[8, 0], [10, 1], [17, 0], [19, 1]] : bear ? [[6, 0], [8, 1], [17, 0], [19, 1]] : deer ? [[8, 0], [9, 1], [17, 0], [18, 1]] : [[7, 0], [9, 1], [17, 0], [19, 1]];
  for (const [lx, near] of legs) {
    const s = (near ? sw : -sw), C = near ? F : D;
    g.r(lx, legTop, 2, 2, C.sh);
    for (let y = legTop + 2; y < legBot; y++) g.p(lx + (y > legTop + 2 ? s : 0) + (near ? 0 : 1), y, near ? C.sh : C.dk);
    g.r(lx + s - (boar ? 0 : 1) + (near ? 0 : 1), legBot, 2, 1, near ? D.b : D.dk);
  }
  if (type === 'bear') {                                 // Bär: massiger Buckel, runde Ohren, kurze Schnauze
    for (let x = 4; x <= 22; x++) {
      const top = x >= 8 && x <= 14 ? 2 : x <= 18 ? 3 : 4, bot = 12;
      for (let y = top; y <= bot; y++) g.p(x, y, y === top ? F.hi : y >= bot - 1 ? F.sh : x >= 20 ? F.sh : F.b);
    }
    for (let x = 9; x <= 14; x += 2) g.p(x, 3, F.hi);
    const hx = lunge, hy = low + (act === 'a1' ? -2 : 0);                        // Ansage: aufrichten
    g.r(hx, 4 + hy, 6, 6, F.b); g.r(hx + 1, 4 + hy, 4, 1, F.hi); g.p(hx + 1, 3 + hy, D.b); g.p(hx + 4, 3 + hy, D.b);   // Kopf, Ohren
    g.r(hx - 1, 7 + hy, 3, 2, belly.b); g.p(hx - 1, 7 + hy, DEEP); g.p(hx + 2, 5 + hy, eye);
    if (act === 'a2') { g.r(hx - 1, 9 + hy, 3, 1, DEEP); g.p(hx, 9 + hy, '#e0d6bc'); }
    g.p(23, 6, D.b); return g;
  }
  if (dog) {                                             // Wilder Hund: schmal, hochbeinig, ausgehungert (Rippen), Schlappohr,
    for (let x = 8; x <= 19; x++) {                      // Sichelrute nach oben, gefleckt — kein umgefärbter Wolf
      const top = x <= 11 ? 6 : 7, bot = x <= 10 ? 10 : x <= 16 ? 9 : 10;
      for (let y = top; y <= bot; y++) g.p(x, y, y === top ? F.hi : y === bot ? (x <= 11 ? belly.b : F.sh) : F.b);
    }
    for (const [x, y] of [[13, 7], [14, 8], [16, 7], [10, 8]]) g.p(x, y, D.b);           // Flecken
    g.p(12, 8, F.sh); g.p(14, 7, F.sh); g.p(12, 9, belly.sh);                            // Rippen, eingefallene Flanke
    const hx = lunge, hy = low + (act === 'a2' ? 1 : 0);
    g.r(5 + hx, 5 + hy, 3, 4, F.b); g.p(7 + hx, 5 + hy, F.hi);                              // dünner Hals
    g.r(2 + hx, 4 + hy, 4, 3, F.b); g.r(3 + hx, 4 + hy, 2, 1, F.hi);                        // Kopf
    g.r(0 + hx, 6 + hy, 3, 1, F.b); g.p(hx, 6 + hy, DEEP); g.p(hx + 1, 7 + hy, F.sh);       // spitze Schnauze
    g.p(5 + hx, 4 + hy, D.b); g.p(6 + hx, 5 + hy, D.b); g.p(6 + hx, 6 + hy, D.sh);          // Schlappohr
    g.p(3 + hx, 5 + hy, eye);
    if (act === 'a2') { g.r(hx, 7 + hy, 2, 1, DEEP); g.p(hx + 1, 7 + hy, '#e0d6bc'); }
    const wag = [0, -1, 0, 1][frame & 3];                                                // Rute wippt beim Laufen
    g.p(20, 6, F.b); g.p(21, 5, F.b); g.p(22, 4 + wag, F.b); g.p(22, 3 + wag, F.hi); g.p(21, 3 + wag, D.b);
    return g;
  }
  if (type === 'deer') {                                  // Hirsch: schlanker Rumpf, hohe Beine, Geweih, heller Spiegel
    for (let x = 7; x <= 19; x++) { const top = 5, bot = x <= 9 ? 9 : 10; for (let y = top; y <= bot; y++) g.p(x, y, y === top ? F.hi : y === bot ? belly.b : F.b); }
    g.r(19, 6, 2, 3, '#e8dcc4');                                                     // Spiegel
    const hx = lunge, hy = low;
    g.r(4 + hx, 2 + hy, 3, 5, F.b); g.r(2 + hx, 1 + hy, 4, 3, F.b); g.p(1 + hx, 2 + hy, DEEP); g.p(3 + hx, 2 + hy, eye);   // Hals, Kopf
    for (const [x, y] of [[3, -1], [4, -2], [5, -3], [2, -2], [6, -1], [5, -1]]) g.p(x + hx, y + hy, '#c9b28a');            // Geweih
    return g;
  }
  if (boar) {
    for (let x = 5; x <= 21; x++) {
      const top = x >= 7 && x <= 12 ? 3 : x <= 16 ? 4 : 5, bot = x <= 18 ? 11 : 10;
      for (let y = top; y <= bot; y++) g.p(x, y, y === top ? F.hi : y >= bot - 1 ? F.sh : x >= 19 ? F.sh : F.b);
    }
    for (let x = 6; x <= 15; x += 2) g.p(x, 2 + (x > 12 ? 1 : 0), D.b);                // Borstenkamm
    for (let x = 7; x <= 13; x += 2) g.p(x, 3, D.sh);
    g.r(9, 7, 7, 1, F.sh);
    const hx = lunge, hy = low;
    for (let x = 0; x <= 6; x++) { const top = 5 + (x < 3 ? 2 : x < 5 ? 1 : 0) + hy, bot = 10 + hy; for (let y = top; y <= bot; y++) g.p(x + hx + 1, y, y === top ? F.hi : y === bot ? F.sh : F.b); }
    g.r(hx, 8 + hy, 2, 3, D.b); g.p(hx, 9 + hy, DEEP);                              // Rüssel
    g.p(hx + 3, 8 + hy, '#e0d6bc'); g.p(hx + 3, 7 + hy, '#e0d6bc'); g.p(hx + 2, 6 + hy, '#e0d6bc');   // Hauer
    g.p(hx + 4, 6 + hy, eye); g.p(hx + 6, 4 + hy, D.b); g.p(hx + 7, 3 + hy, D.sh);
    g.p(22, 6, D.b); g.p(23, 7, D.sh); g.p(23, 8, D.dk);
  } else {
    for (let x = 6; x <= 20; x++) {
      const top = x <= 10 ? 5 : x <= 15 ? 6 : 5, bot = x <= 10 ? 11 : x <= 12 ? 10 : x <= 15 ? 9 : 11;
      for (let y = top; y <= bot; y++) g.p(x, y, y === top ? F.hi : y === bot ? (x <= 10 ? belly.b : F.sh) : x >= 19 ? F.sh : F.b);
    }
    for (let x = 7; x <= 13; x += 2) g.p(x, 4, D.b);                               // gesträubtes Nackenfell
    g.p(12, 7, D.sh); g.p(14, 7, D.sh); g.p(13, 8, D.sh);                           // Rippen
    g.r(16, 7, 2, 2, F.sh);
    const hx = lunge, hy = low + (act === 'a2' ? 1 : 0);
    g.r(3 + hx, 4 + hy, 4, 5, F.b); g.p(6 + hx, 4 + hy, F.hi);                       // Hals
    g.r(1 + hx, 3 + hy, 4, 4, F.b); g.r(2 + hx, 3 + hy, 3, 1, F.hi);                // Schädel
    g.r(-1 + hx + 1, 5 + hy, 2, 2, F.b); g.p(hx, 5 + hy, DEEP);                     // Schnauze + Nase
    g.p(3 + hx, 1 + hy, D.b); g.p(3 + hx, 2 + hy, F.b); g.p(4 + hx, 2 + hy, D.sh);   // Ohr
    g.p(2 + hx, 4 + hy, eye);
    if (act === 'a2') { g.r(hx, 7 + hy, 3, 1, DEEP); g.p(hx + 1, 7 + hy, '#e0d6bc'); g.r(hx + 1, 8 + hy, 2, 1, F.sh); }
    else g.r(1 + hx, 7 + hy, 3, 1, F.sh);
    const tw = sw * 0;                                                             // Rute, buschig nach hinten unten
    g.r(21, 5 + tw, 2, 2, F.b); g.r(22, 6, 2, 2, F.b); g.r(23, 7, 2, 3, F.sh); g.p(24, 10, D.b); g.p(21, 5, F.hi);
  }
  return g;
}
export function beastFrame(type, pal, dir, pose, frame) {
  if (BEAST_ATLAS[type] && atlasOn()) { const f = atlasPose(BEAST_ATLAS[type], dir, pose || (frame & 1 ? 'w0' : 'i0'), true); if (f) return f; }   // Stil F
  return cacheGet('beast|' + ART + type + '|' + (pal.body || '') + dir + pose + frame, () => {
    if (ART === 'R' && type === 'horse' && (dir === 'N' || dir === 'S')) return meta(toCanvas(asG(paintHorseNSR(pal, frame, dir, pose, ramp)), false), RPX, BROX, BROY);   // S15: Pferd von vorn/hinten
    if (ART === 'R') { const g0 = asG(paintBeastR(type, pal, frame, pose === 'dead' ? '' : pose, ramp)), g1 = pose === 'dead' ? g0.flipY() : g0;   // S14 Stil R
      return meta(toCanvas(dir === 'E' ? g1.flipX() : g1, false), RPX, BROX, pose === 'dead' ? g0.h - 12 : BROY); }
    if (!OLD_FIGURES) {                                               // G4: Tiere im feinen Raster
      const o = paintBeast2(type, pal, frame, pose === 'dead' ? '' : pose), g0 = new G(o.w, o.h); g0.a = o.a;
      const g1 = pose === 'dead' ? g0.flipY() : g0;
      return meta(toCanvas(dir === 'E' ? g1.flipX() : g1), 1, BEOX, pose === 'dead' ? o.h - 15 : BEOY);   // tot: liegt auf dem Rücken
    }   // Palette im Schlüssel: sonst erbt ein Tier die Farben eines anderen
    let g = paintBeast(type, pal, frame, pose);
    if (pose === 'dead') g = g.flipY();
    return meta(toCanvas(dir === 'E' ? g.flipX() : g), PX, 15, pose === 'dead' ? 12 : 17);
  });
}

// ---------------- Gorak (Boss): massiger Grubenwart ----------------
function paintBrute(pal, frame, act) {
  const g = new G(34, 38);
  const S = ramp(mix(pal.skin || '#556b34', '#1a1712', 0.28)), C = ramp(pal.cloth || '#33261a'), M = ramp(pal.metal || '#9a8e78');
  const Lr = ramp('#4a3525'), bone = ramp('#d6cdb4');
  const b = (frame & 1) ? 1 : 0, lf = [1, 0, -1, 0][frame & 3];
  const span = (y, x0, x1, R, light) => { for (let x = x0; x <= x1; x++) g.p(x, y, x <= x0 + 1 && light ? R.hi : x >= x1 - 2 ? R.sh : R.b); };
  // Beine: kurz, O-beinig, Fußlappen
  for (let y = 28; y <= 33; y++) { g.r(9 + (y > 31 ? -1 : 0), y - (lf > 0 ? 1 : 0), 5, 1, S.sh); g.r(20 + (y > 31 ? 1 : 0), y - (lf < 0 ? 1 : 0), 5, 1, S.dk); }
  g.r(7, 34 - (lf > 0 ? 1 : 0), 8, 2, C.dk); g.r(19, 34 - (lf < 0 ? 1 : 0), 8, 2, C.dk); g.p(7, 34 - (lf > 0 ? 1 : 0), C.sh);
  // Rumpf: Nacken → Schultern → Bauch (gewölbt)
  const rows = [[8, 12, 21], [9, 9, 24], [10, 7, 26], [11, 6, 27], [12, 6, 27], [13, 6, 27], [14, 6, 27], [15, 7, 26], [16, 7, 26], [17, 7, 26],
                [18, 7, 26], [19, 7, 26], [20, 8, 25], [21, 8, 25], [22, 9, 24], [23, 9, 24], [24, 10, 23]];
  for (const [y, x0, x1] of rows) span(y + b, x0, x1, S, true);
  g.r(10, 10 + b, 6, 2, S.hi); g.r(14, 17 + b, 6, 1, S.sh); g.r(16, 12 + b, 1, 5, S.sh); g.r(12, 19 + b, 10, 1, S.hi);   // Brust, Bauch
  g.p(11, 15 + b, S.dk); g.p(12, 16 + b, S.dk); g.p(22, 13 + b, S.dk); g.p(23, 14 + b, S.dk);                            // Narben
  for (let i = 0; i < 11; i++) { g.p(9 + i * 1.5 | 0, 10 + i + b, Lr.b); g.p((10 + i * 1.5) | 0, 10 + i + b, Lr.dk); }       // Riemen
  g.r(8, 22 + b, 18, 2, Lr.dk); g.r(15, 21 + b, 3, 3, bone.b); g.p(15, 22 + b, DEEP); g.p(17, 22 + b, DEEP); g.p(16, 21 + b, bone.hi);   // Gürtel, Schädelschnalle
  // Lendenschurz, zerlumpt
  for (let y = 24; y <= 28; y++) span(y + b, 10, 23, C, true);
  for (let x = 10; x <= 23; x++) if (x % 3 !== 1) g.p(x, 29 + b, (x % 3) ? C.sh : C.dk);
  // Schulterpanzer mit Dornen (links), Fell (rechts)
  g.r(3, 8 + b, 8, 5, M.b); g.r(3, 8 + b, 6, 1, M.hi); g.r(3, 12 + b, 8, 1, M.sh); g.r(9, 9 + b, 2, 3, M.sh);
  g.p(4, 7 + b, M.b); g.p(4, 6 + b, M.hi); g.p(7, 7 + b, M.b); g.p(7, 6 + b, M.hi); g.p(5, 10 + b, M.dk);
  const fur = ramp('#4a3f33'); for (let x = 23; x <= 30; x++) { g.p(x, 9 + b + (x & 1), fur.b); g.p(x, 10 + b, fur.sh); g.p(x, 11 + b, fur.dk); }
  // Arme: lang, Lederschienen, große Fäuste
  const up = act === 'a1', hit = act === 'a2';
  if (up) { g.r(3, 13 + b, 5, 6, S.b); g.r(3, 13 + b, 2, 6, S.hi); g.r(2, 19 + b, 6, 4, S.sh); }
  else { g.r(2, 13 + b, 5, 13, S.b); g.r(2, 13 + b, 2, 13, S.hi); g.r(2, 19 + b, 5, 3, Lr.b); g.p(2, 19 + b, Lr.hi); g.r(1, 26 + b, 7, 4, S.sh); g.r(1, 26 + b, 7, 1, S.b); }
  if (up) { g.r(27, 3 + b, 5, 10, S.sh); g.r(27, 3 + b, 1, 10, S.b); g.r(26, 0 + b, 7, 4, S.dk); g.r(27, 7 + b, 5, 2, Lr.sh); }
  else { const hy = hit ? 2 : 0; g.r(27, 12 + b, 5, 13 + hy, S.sh); g.r(27, 19 + b, 5, 3, Lr.sh); g.r(26, 25 + b + hy, 7, 4, S.dk); g.r(26, 25 + b + hy, 7, 1, S.sh); }
  // Kopf: tief zwischen den Schultern, Eisenmaske, glühende Augen, Hauer
  g.r(13, 4 + b, 8, 9, S.b); g.r(14, 3 + b, 6, 1, S.b); g.r(13, 4 + b, 2, 3, S.hi); g.r(19, 4 + b, 2, 9, S.sh);
  g.r(13, 5 + b, 8, 4, M.b); g.r(13, 5 + b, 8, 1, M.hi); g.r(19, 6 + b, 2, 3, M.sh); g.r(16, 5 + b, 2, 4, M.sh);
  g.r(14, 7 + b, 2, 1, '#d2452e'); g.r(18, 7 + b, 2, 1, '#d2452e');
  g.r(14, 10 + b, 6, 2, DEEP); g.p(14, 9 + b, bone.b); g.p(14, 10 + b, bone.hi); g.p(19, 9 + b, bone.b); g.p(19, 10 + b, bone.sh);
  g.p(11, 6 + b, S.sh); g.p(12, 7 + b, S.sh); g.p(22, 6 + b, S.dk); g.p(21, 7 + b, S.dk);                                 // Ohren
  return g;
}
export function bruteFrame(pal, dir, pose, frame) {
  if (atlasOn()) { const f = atlasPose('riese', dir, pose || (frame & 1 ? 'w0' : 'i0')); if (f) return f; }   // Stil F: Gorak
  return cacheGet('brute|' + ART + dir + pose + frame, () => {
    if (!OLD_FIGURES) {                                               // G4: Gorak als Goblin-Hüne im feinen Raster (Hackmesser zeichnet der Renderer)
      const look = { goblin: 1, noClub: 1, skin: pal.skin || '#556b34', hood: '#2a2019', cloak: mix(pal.cloth || '#33261a', '#000', 0.25), cloth: pal.cloth || '#33261a',
        leather: '#3e2e22', strap: '#5a4230', metal: pal.metal || '#9a8e78', pants: '#2a2420', boots: '#1c1712', wrap: '#6e604c', eye: '#e0c24a' };
      const sc = ART === 'R' ? 1 / RPX : 1, o = paintBrute2(look, pose === 'a1' || pose === 'a2' ? pose : frame ? 'walk' : 'i0', frame, sc), g = new G(o.w, o.h); g.a = o.a;   // S14 Stil R: Zielraster
      return meta(toCanvas(dir === 'W' ? g.flipX() : g), 1 / sc, BOX * sc, BOY * sc);
    }
    const g = paintBrute(pal, frame, pose); return meta(toCanvas(dir === 'W' ? g.flipX() : g), PX, 17, 35); });
}

// ---------------- Pixelisieren (Props, Icons): Vektorzeichnung → echtes Pixelraster ----------------
// Kanten werden hart (Alpha-Schwelle), Schlagschatten bleiben halbtransparent, 1 px Kontur,
// Randlicht oben links / Schatten unten rechts, leichte Pixelstreuung für organische Oberflächen.
function h2(x, y) { let n = (x * 374761393 + y * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
export function pixelize(c, w, h, organic = 0, flat = false) {
  const img = c.getImageData(0, 0, w, h), d = img.data, solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = d[i * 4 + 3];
    if (a >= 150) { solid[i] = 1; d[i * 4 + 3] = 255; }
    else if (a > 24 && d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2] < 90) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0; d[i * 4 + 3] = 96; }   // Schatten
    else d[i * 4 + 3] = 0;
  }
  const S = (x, y) => x >= 0 && y >= 0 && x < w && y < h && solid[y * w + x], RS = ART === 'R';
  if (RS) for (let i = 0; i < w * h; i++) if (solid[i]) { const o = i * 4, l = d[o] * 0.3 + d[o + 1] * 0.59 + d[o + 2] * 0.11;   // S14 Stil R (Referenz 5): satter, mehr Kontrast, Farbstufen
    for (let k = 0; k < 3; k++) { const v = (l + (d[o + k] - l) * 1.3 - 100) * 1.14 + 100; d[o + k] = clamp8(Math.round(v / 12) * 12 + 3); } }   // S14 Stil R: Farbstufen statt weicher Verläufe
  const src = RS ? d.slice() : null;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, o = i * 4;
    if (solid[i]) {
      let f = 1;
      if (!S(x, y - 1) || !S(x - 1, y)) f = RS ? 1.3 : 1.2; else if (!S(x, y + 1) || !S(x + 1, y)) f = RS ? 0.62 : 0.72;
      if (organic) { const n = h2(x, y); f *= n > 0.82 ? 1.14 : n < 0.2 ? 0.84 : 1; }
      if (f !== 1) { d[o] = clamp8(d[o] * f + (f > 1 ? 6 : 0)); d[o + 1] = clamp8(d[o + 1] * f + (f > 1 ? 5 : 0)); d[o + 2] = clamp8(d[o + 2] * f); }
    } else if (!flat && (S(x - 1, y) || S(x + 1, y) || S(x, y - 1) || S(x, y + 1))) {
      if (RS) { let j = -1, l = 1e9; for (const q of [i - 1, i + 1, i - w, i + w]) if (q >= 0 && q < w * h && solid[q] && Math.abs((q % w) - x) <= 1) { const s = src[q * 4] + src[q * 4 + 1] + src[q * 4 + 2]; if (s < l) { l = s; j = q; } }   // Kontur im dunkelsten Nachbarton
        d[o] = Math.round(src[j * 4] * 0.28 + 4); d[o + 1] = Math.round(src[j * 4 + 1] * 0.26 + 3); d[o + 2] = Math.round(src[j * 4 + 2] * 0.26 + 3); d[o + 3] = 255; }
      else { d[o] = 12; d[o + 1] = 10; d[o + 2] = 8; d[o + 3] = 255; } }
  }
  c.putImageData(img, 0, 0);
}

// ---------------- Bodentexturen (16×16, doppelt skaliert = 1 Kachel) ----------------
/* Artist 01.10.: Pflaster im Stil R. Drei Steinreihen (5/5/6 Texel), Fugen versetzt und über den Kachelrand gewickelt,
   damit Nachbarkacheln nahtlos anschließen. Je Stein eigener Ton (Variante v streut), Kante oben/links hell, unten/rechts
   dunkel, Fuge im dunkelsten Ton; selten Riss oder Moos in der Fuge. Ersetzt das starre 8×8-Raster (Lesbarkeit, Lichtrichtung). */
const PAVE_ROWS = [[0, 4, [3, 9, 14]], [5, 9, [1, 6, 12]], [10, 15, [4, 10, 15]]];
function paveR(P, base, v, n, moss) {
  const joint = mix(base.sh, base.dk, 0.4);
  PAVE_ROWS.forEach(([y0, y1, cuts0], r) => {
    const sh = ((v * 5 + r * 3) % 7) - 3, cuts = cuts0.map(c => (c + sh + 16) % 16).sort((a, b) => a - b);   /* Fugen je Variante versetzt: kein Ziegelmuster */
    for (let x = 0; x < 16; x++) P(x, y1, joint);
    for (const c of cuts) for (let y = y0; y < y1; y++) P(c, y, joint);
    cuts.forEach((c, k) => {
      const end = cuts[(k + 1) % cuts.length], len = ((end - c - 1) + 16) % 16, h = n(r * 5 + k, 61 + v);
      const tone = h > 0.66 ? mix(base.b, base.hi, 0.22) : h < 0.3 ? mix(base.b, base.sh, 0.22) : base.b;
      for (let i = 0; i < len; i++) { const x = (c + 1 + i) % 16;
        for (let y = y0; y < y1; y++) {
          let col = tone;
          if (y === y0 || i === 0) col = mix(tone, base.hi, i === 0 && y === y0 ? 0.6 : 0.4);
          else if (y === y1 - 1 || i === len - 1) col = mix(tone, base.sh, 0.45);
          else if (n(x * 3 + r, y * 7 + v) > 0.97) col = mix(tone, base.sh, 0.2);
          P(x, y, col);
        } }
      if (h > 0.94 && len >= 4) { const cx = (c + 2) % 16; P(cx, y0 + 1, joint); P((cx + 1) % 16, y0 + 2, joint); }
    });
  });
  if (moss) for (let i = 0; i < 2; i++) if (n(i, 77 + v) > 0.55) { const r = PAVE_ROWS[i + 1], x = (n(78 + v, i) * 16) | 0; P(x, r[0] - 1, mix(joint, '#4a5a2a', 0.55)); }
}
/* Artist Runde 2: Feldsteinweg (road) im Stil R — vier Reihen runder Steine verschiedener Breite, Erde in den Fugen, Ecken
   abgerundet, hie und da fehlt ein Stein (ausgetretene Lücke mit Erde). Licht oben links. Alles über den Kachelrand gewickelt. */
function cobbleR(P, base, v, n) {
  const earth = mix(base.dk, '#3a2c1e', 0.45), earthL = mix(base.sh, '#4a3a28', 0.4);
  for (let r = 0; r < 4; r++) {
    const y0 = r * 4, cuts = []; let x = ((r * 7 + v * 5) % 16 + (r & 1) * 2) % 16, left = 16;
    while (left > 0) { let w = 3 + ((n(r * 11 + cuts.length, 90 + v) * 3) | 0); if (left - w < 3) w = left; cuts.push([x, w]); x = (x + w) % 16; left -= w; }
    for (let xx = 0; xx < 16; xx++) P(xx, y0 + 3, n(xx, y0 + 40 + v) > 0.6 ? earthL : earth);
    cuts.forEach(([c, w], k) => {
      const h = n(r * 5 + k, 70 + v), gone = h < 0.1, tone = h > 0.7 ? mix(base.b, base.hi, 0.25) : h < 0.35 ? mix(base.b, base.sh, 0.25) : base.b;
      for (let i = 0; i < w; i++) { const xx = (c + i) % 16;
        for (let y = y0; y < y0 + 3; y++) {
          const edge = i === 0 || i === w - 1, corner = edge && (y === y0 || y === y0 + 2);
          let col = gone || corner ? (n(xx, y + 7 * v) > 0.5 ? earth : earthL) : tone;
          if (!gone && !corner) { if (i === 0) col = mix(tone, earth, 0.55); else if (y === y0) col = mix(tone, base.hi, 0.45); else if (y === y0 + 2 || i === w - 1) col = mix(tone, base.dk, 0.35); }
          P(xx, y, col);
        } }
      if (gone && n(k, r + 9 * v) > 0.5) P((c + 1) % 16, y0 + 1, mix(base.b, base.sh, 0.3));   /* Splitter in der Lücke */
    });
  }
}
/* Artist Runde 2: Gewölbeboden (dfloor) im Stil R — zwei Reihen großer Steinplatten statt Stadtpflaster, Fugen tief und schmutzig,
   Risse, abgeplatzte Ecken, Schmutz zur Fuge hin. Liest sich als Kerker, nicht als Marktplatz. */
function flagR(P, base, v, n) {
  const joint = mix(base.dk, '#050404', 0.35), grime = mix(base.sh, base.dk, 0.5);
  for (let r = 0; r < 2; r++) {
    const y0 = r * 8, y1 = y0 + 7, c0 = (r * 5 + v * 3) % 16, c1 = (c0 + 6 + ((n(r, 31 + v) * 5) | 0)) % 16, cuts = [c0, c1].sort((a, b) => a - b);
    for (let x = 0; x < 16; x++) P(x, y1, joint);
    for (const c of cuts) for (let y = y0; y < y1; y++) P(c, y, joint);
    cuts.forEach((c, k) => {
      const end = cuts[(k + 1) % 2], len = ((end - c - 1) + 16) % 16, h = n(r * 3 + k, 52 + v);
      const tone = h > 0.62 ? mix(base.b, base.hi, 0.18) : h < 0.3 ? mix(base.b, base.sh, 0.3) : base.b;
      for (let i = 0; i < len; i++) { const x = (c + 1 + i) % 16;
        for (let y = y0; y < y1; y++) {
          let col = tone; const g = n(x * 5 + 3, y * 3 + v);
          if (y === y0 || i === 0) col = mix(tone, base.hi, y === y0 && i === 0 ? 0.5 : 0.3);
          else if (y === y1 - 1 || i === len - 1) col = grime;
          else if (g > 0.9) col = mix(tone, base.sh, 0.35); else if (g < 0.05) col = mix(tone, base.hi, 0.2);
          P(x, y, col);
        } }
      if (h > 0.8 && len >= 5) { const dir = n(k, r + 40 + v) > 0.5 ? 1 : -1; let x = c + 2 + (dir < 0 ? len - 4 : 0), y = y0 + 1 + ((n(r, k + v) * 2) | 0); for (let s = 0; s < 4; s++) { P((x + 16) % 16, y, joint); x += n(s, k + r + v) > 0.5 ? dir : 0; y += 1; if (y >= y1 - 1) break; } }   /* Riss */
      if (h < 0.25) { P((c + 1) % 16, y0, joint); P((c + 2) % 16, y0, joint); P((c + 1) % 16, y0 + 1, grime); }   /* abgeplatzte Ecke */
    });
  }
  if (n(3, 77 + v) > 0.8) { const x = (n(4, v) * 13) | 0, y = 2 + ((n(v, 4) * 10) | 0); P(x, y, '#b8ae98'); P(x + 1, y, '#8e8674'); P(x + 1, y + 1, joint); }   /* Knochensplitter oder Kiesel */
}
export function tileTexture(t, v, cols, kind) {
  return cacheGet('tile|' + t + '|' + v + '|' + kind + '|' + cols[0] + (ART === 'R' ? '|R' : ''), () => {   // Art + Farbe im Schlüssel: sonst verschmutzt ein Aufruf mit fremder Palette den Cache
    const cv = document.createElement('canvas'); cv.width = cv.height = 16;
    const c = cv.getContext('2d');
    // Grundton je Typ fast konstant (sonst Schachbrett-Muster); Varianten unterscheiden sich über Streupixel.
    const base = ramp(mix(cols[0], cols[v % cols.length], 0.3)), alt = ramp(cols[(v + 1) % cols.length]);
    const P = (x, y, col) => { c.fillStyle = col; c.fillRect(x, y, 1, 1); };
    c.fillStyle = base.b; c.fillRect(0, 0, 16, 16);
    const seed = t * 97 + v * 13;
    const n = (x, y) => h2(x + seed * 31, y + seed * 17);
    // Session 10 (Referenz 2): ruhige Flächen — Flecken in 2×2-Clustern (versetzt) statt Einzelpixel-Rauschen
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = n((x + ((y >> 1) & 1)) >> 1, y >> 1), q = n(x, y);
      if (r > 0.86 && q > 0.2) P(x, y, mix(base.b, alt.b, 0.5)); else if (r < 0.1 && q > 0.25) P(x, y, mix(base.b, base.sh, 0.45)); else if (q < 0.02) P(x, y, mix(base.b, base.hi, 0.3)); }
    if (kind === 'grass') {                                // Referenz 4: Büschel (dunkler Fuß, helle Spitzen), selten Blüte oder Kiesel
      for (let i = 0; i < 4; i++) { const x = 1 + ((n(i, 99) * 13) | 0), y = 3 + ((n(99, i) * 11) | 0);   // ruhig: flache Büschel, keine Spitzen
        P(x, y + 1, base.sh); P(x + 1, y + 1, base.sh); P(x + 2, y + 1, mix(base.b, base.sh, 0.5)); P(x + 1, y, mix(base.b, base.hi, 0.6)); P(x, y, i % 2 ? mix(base.b, base.hi, 0.4) : base.b); }
      if (n(5, 5) > 0.82) { const x = (n(7, 1) * 14) | 0, y = (n(1, 7) * 14) | 0; P(x, y, ['#b8a050', '#a04a38', '#c8c0a0'][v % 3]); P(x + 1, y + 1, base.dk); }
      else if (n(5, 6) > 0.8) { const x = (n(8, 1) * 14) | 0, y = (n(1, 8) * 14) | 0; P(x, y, '#8a8070'); P(x + 1, y, '#6a6258'); P(x, y + 1, '#3a342c'); }
    } else if (kind === 'stone' && ART === 'R') {   /* Artist 01.10.: Kopfsteinpflaster statt 8er-Raster — unregelmäßige Steine, Licht oben links, Fugen dunkel */
      paveR(P, base, v, n, true);
    } else if (kind === 'dfloor' && ART === 'R') { flagR(P, base, v, n);   /* Artist Runde 2: Kerkerplatten */
    } else if (kind === 'road' && ART === 'R') { cobbleR(P, base, v, n);   /* Artist Runde 2: Feldsteinweg statt Ziegelraster */
    } else if (kind === 'road' || kind === 'stone' || kind === 'dfloor') {
      const bw = kind === 'road' ? 5 : 8, bh = kind === 'road' ? 4 : 8;
      for (let y = 0; y < 16; y += bh) for (let x = -((y / bh) % 2) * (bw >> 1); x < 16; x += bw) {
        for (let i = 0; i < bw; i++) P(x + i, y, base.sh); for (let j = 0; j < bh; j++) P(x, y + j, base.sh);
        P(x + 1, y + 1, base.hi); if (bw > 5) P(x + 2, y + 1, base.hi);
      }
    } else if (kind === 'scree') {                        // Geröllboden: lose Steine mit Licht oben, Schatten unten
      for (let i = 0; i < 7; i++) { const x = (n(i, 21) * 15) | 0, y = (n(21, i) * 15) | 0; P(x, y, base.hi); P(x, y + 1, base.dk); if (i < 3) { P(x + 1, y, base.b); P(x + 1, y + 1, base.dk); } }
      if (n(4, 4) > 0.5) { const x = 2 + ((n(5, 2) * 10) | 0), y = 2 + ((n(2, 5) * 10) | 0);
        P(x, y, base.hi); P(x + 1, y, base.hi); P(x + 2, y, base.b); P(x, y + 1, base.b); P(x + 1, y + 1, base.b); P(x + 2, y + 1, base.sh); P(x, y + 2, base.dk); P(x + 1, y + 2, base.dk); P(x + 2, y + 2, base.dk); }
      for (let i = 0; i < 2; i++) { let x = (n(i, 33) * 13) | 0, y = (n(33, i) * 13) | 0; for (let k = 0; k < 3; k++) { P(x, y, mix(base.b, base.dk, 0.5)); x++; y += n(k, i + 3) > 0.5 ? 1 : 0; } }
    } else if (kind === 'plank') {                         // Dielen: Fugen, Maserung, Nagelköpfe, Stoß versetzt
      for (let y = 0; y < 16; y += 4) { for (let x = 0; x < 16; x++) { P(x, y, base.dk); if (n(x, y + 3) > 0.7) P(x, y + 2, mix(base.b, base.sh, 0.5)); }
        P(3 + (y % 8), y + 1, base.hi); P(4 + (y % 8), y + 1, base.hi); const jx = ((y * 7) % 13) + 1; P(jx, y + 1, base.dk); P(jx, y + 2, base.dk); P(jx, y + 3, base.dk);
        P(jx + 1, y + 2, '#2a2420'); P(jx - 1, y + 2, '#2a2420'); }
    } else if (kind === 'wall' || kind === 'dwall') {
      for (let y = 0; y < 16; y += 4) for (let x = -((y / 4) % 2) * 3; x < 16; x += 6) {
        for (let i = 0; i < 6; i++) P(x + i, y + 3, base.dk); P(x + 5, y, base.dk); P(x + 5, y + 1, base.dk); P(x + 5, y + 2, base.dk);
        P(x, y, base.hi); P(x + 1, y, base.hi);
      }
      for (let x = 0; x < 16; x++) P(x, 0, base.hi);
    } else if (kind === 'rock') {
      for (let i = 0; i < 3; i++) { let x = (n(i, 3) * 14) | 0, y = (n(3, i) * 12) | 0; for (let k = 0; k < 5; k++) { P(x, y, base.dk); x += n(k, i) > 0.5 ? 1 : 0; y++; } }
      for (let x = 0; x < 16; x++) P(x, 0, base.hi);
    } else if (kind === 'field' && ART === 'R') {          // S14 Stil R: Getreide in Reihen — Halme mit dunklem Fuß, goldene Ähren, dazwischen Furche
      const crop = 'korn';                                   // ein Feld, eine Frucht (kein Flickenteppich je Kachel)
      for (let y = 0; y < 16; y += 4) { for (let x = 0; x < 16; x++) { P(x, y + 3, base.dk); P(x, y + 2, mix(base.b, base.dk, 0.35)); }
        if (crop === 'korn') for (let x = 0; x < 16; x++) { const t = n(x, y) > 0.42 + (v % 3) * 0.06; if (!t) continue;
          P(x, y + 2, '#4a5226'); P(x, y + 1, '#8a8a3a'); P(x, y, n(x + 3, y) > 0.5 ? '#d8b85a' : '#c09a44'); if (n(x, y + 9) > 0.6) P(x, y - 1 < 0 ? 0 : y - 1, '#e8cc70'); }
        else for (let x = 1 + ((y >> 2) & 1) * 2; x < 15; x += 4) { P(x, y, '#5a8a3a'); P(x + 1, y, '#78a84a'); P(x, y + 1, '#3e6a2a'); P(x + 1, y + 1, '#4e7a32'); P(x + 2, y + 1, '#2e4a20'); P(x - 1, y + 1, '#3e6a2a'); } }
    } else if (kind === 'field') {                         // Acker: Furchen mit Licht an der Kante, Keimlinge in Reihen
      for (let y = 1; y < 16; y += 4) for (let x = 0; x < 16; x++) { P(x, y, base.dk); P(x, y + 1, mix(base.b, base.dk, 0.3)); P(x, y - 1, mix(base.b, base.hi, 0.35));
        if ((x + y) % 3 === 0 && n(x, y) > 0.3) { P(x, y - 1, '#5a6a2c'); P(x, y - 2, '#7a8a3a'); } }
    } else if (kind === 'water') {
      for (let i = 0; i < 4; i++) { const x = (n(i, 9) * 12) | 0, y = (n(9, i) * 15) | 0; P(x, y, base.hi); P(x + 1, y, base.hi); P(x + 2, y, base.b); }
    } else if (kind === 'marsh') {
      for (let i = 0; i < 3; i++) { const x = (n(i, 4) * 14) | 0, y = 4 + ((n(4, i) * 9) | 0); P(x, y, '#2a3220'); P(x, y + 1, '#2a3220'); P(x, y + 2, '#1f2618'); P(x + 1, y - 1, '#46502e'); }
      if (n(2, 2) > 0.6) for (let i = 3; i < 9; i++) { P(i + 3, 10, '#243029'); P(i + 3, 11, '#26332e'); }
    } else if (kind === 'ash') {
      if (n(8, 8) > 0.7) { const x = 3 + ((n(1, 2) * 9) | 0), y = 3 + ((n(2, 1) * 9) | 0); P(x, y, '#b8b09a'); P(x + 1, y, '#b8b09a'); P(x + 2, y + 1, '#8e8776'); }
      if (n(6, 3) > 0.85) P((n(3, 6) * 15) | 0, (n(6, 6) * 15) | 0, '#7a3a22');
    } else if (kind === 'sand' || kind === 'dirt') {       // Kiesel mit Licht und Schatten, Erdklumpen, bei Erde vereinzelt Halme
      for (let i = 0; i < 5; i++) { const x = (n(i, 7) * 14) | 0, y = (n(7, i) * 14) | 0, big = i < 2;
        P(x, y, mix(base.hi, '#c8b890', 0.2)); P(x + 1, y + 1, base.dk); if (big) { P(x + 1, y, base.hi); P(x, y + 1, base.b); P(x + 2, y + 1, base.dk); P(x + 1, y + 2, base.dk); } }
      for (let i = 0; i < 2; i++) { let x = (n(i, 17) * 13) | 0, y = (n(17, i) * 13) | 0; for (let k = 0; k < 3; k++) { P(x, y, mix(base.b, base.dk, 0.55)); x++; y += n(k, i + 5) > 0.6 ? 1 : 0; } }
      if (kind === 'dirt' && n(3, 3) > 0.6) { const x = (n(4, 9) * 14) | 0, y = 2 + ((n(9, 4) * 12) | 0); P(x, y, '#4a5a2c'); P(x, y + 1, '#34401f'); P(x + 1, y - 1, '#6a7a38'); }
    }
    // S12 (Nutzer: „Boden detaillierter“): zweite Detailebene — feine Körnung, dazu je Boden eigene Kleinigkeiten, ruhig gehalten
    if (kind === 'grass' || kind === 'dirt' || kind === 'sand' || kind === 'ash' || kind === 'marsh' || kind === 'scree')
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const g = n(x * 3 + 7, y * 5 + 11); if (g > 0.93) P(x, y, mix(base.b, base.hi, 0.22)); else if (g < 0.06) P(x, y, mix(base.b, base.dk, 0.28)); }
    if (kind === 'grass') {                                   // Halme (dunkler Fuß → heller Kopf) und Klee
      for (let i = 0; i < 3; i++) { const x = 1 + ((n(i + 20, 40) * 14) | 0), y = 4 + ((n(40, i + 20) * 10) | 0); P(x, y + 1, base.dk); P(x, y, base.sh); P(x, y - 1, mix(base.b, base.hi, 0.5)); }
      if (n(9, 9) > 0.55) { const x = (n(10, 3) * 14) | 0, y = (n(3, 10) * 14) | 0; P(x, y, mix(base.hi, '#9ab060', 0.3)); P(x + 1, y, mix(base.hi, '#9ab060', 0.2)); P(x, y + 1, mix(base.b, base.sh, 0.4)); }
    } else if (kind === 'dirt') {                             // Risse und Wurzeln
      if (n(12, 4) > 0.45) { let x = (n(13, 5) * 12) | 0, y = (n(5, 13) * 12) | 0; for (let k = 0; k < 4; k++) { P(x, y, mix(base.dk, '#120e0a', 0.3)); x += 1; y += n(k, 14) > 0.5 ? 1 : 0; } }
      if (n(14, 6) > 0.7) { let x = (n(15, 7) * 12) | 0, y = (n(7, 15) * 12) | 0; for (let k = 0; k < 3; k++) { P(x, y, '#4a3622'); x += n(k, 16) > 0.5 ? 1 : -1; y += 1; } }
    } else if (kind === 'sand') {                             // Windrippel: helle Kante, Schatten darunter
      for (let y = 2 + (v % 3); y < 16; y += 5) for (let x = 0; x < 16; x++) { const yy = y + Math.round(Math.sin((x + v * 3) / 2.5)); P(x, yy, mix(base.b, base.hi, 0.35)); P(x, yy + 1, mix(base.b, base.sh, 0.3)); }
    } else if (kind === 'ash') {                              // Schlacke, Asche, seltene Glut
      for (let i = 0; i < 4; i++) { const x = (n(i, 50) * 15) | 0, y = (n(50, i) * 15) | 0; P(x, y, i % 2 ? '#6a6660' : '#2a2624'); }
      if (n(17, 17) > 0.9) P((n(18, 2) * 15) | 0, (n(2, 18) * 15) | 0, '#b0502a');
    } else if (kind === 'marsh') {                            // Pfützen mit Himmelsglanz
      if (n(19, 3) > 0.4) { const x = 2 + ((n(20, 4) * 10) | 0), y = 3 + ((n(4, 20) * 10) | 0); for (let i = 0; i < 4; i++) P(x + i, y, i === 1 ? '#6a7a80' : '#2a3a3a'); P(x + 1, y + 1, '#1e2a28'); P(x + 2, y + 1, '#1e2a28'); }
    }
    return cv;
  });
}
