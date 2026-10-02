// Gebäude als Pixel-Art (3/4-Aufsicht): Dach über dem Grundriss, sichtbare Vorderfassade, Funktionsdetails.
// Jedes Gebäude ist ein Datensatz (world.js → HOUSES): Typ, Stadt, Grundriss, Tür. Stil = Stadt (Material) + Typ (Funktion).
//
// Regeln (STYLE_GUIDE):
//   Maßstab   1 Texel = 2 Welt-Einheiten (wie Figuren). Eine Kachel = 16 Texel.
//   Aufbau    Dach bedeckt den Grundriss bis zur Traufe; darunter FH Texel Vorderwand (Tür, Fenster, Schild).
//             Über dem Grundriss ragt das Dach RISE Texel auf (Höhe) — Figuren dahinter werden verdeckt.
//   Licht     oben links: Nordhang heller, Südhang Grundton, zur Traufe dunkler; Traufkante tiefdunkel.
//   Material  Dach: Stroh / Holzschindel / Schiefer / Ziegel. Wand: Fachwerk / Holz / Stein / Putz / heller Stein.
//   Funktion  von außen lesbar: Schild mit Symbol, Esse mit Glut, Banner, Kräuterbündel, Rosette, Wappen.
import { G, toCanvas, ramp, mix, drawnOn } from './sprites.js?v=23';

const hh = (x, y, s = 0) => { let n = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };

// Stadt → Bauweise. Arm/einfach/wohlhabend spiegelt sich im Material.
export const TOWN_STYLE = {
  eren:      { roof: 'thatch',  wall: 'timber', alt: 'shingle' },     // Dorf: Stroh, Fachwerk
  northcity: { roof: 'shingle', wall: 'stone', alt: 'tile' },      // Grenzstadt: Schindeln, Bruchstein
  saltport:  { roof: 'tile',    wall: 'plaster', alt: 'slate' },    // Hafen: Ziegel, Putz
  kreuzweg:  { roof: 'shingle', wall: 'wood', alt: 'thatch' },       // Söldnerstadt: Holz
  ashford:   { roof: 'slate',   wall: 'stone', alt: 'shingle' },      // befestigter Posten: Schiefer
  sonnwacht: { roof: 'slate',   wall: 'palestone', alt: 'tile' },  // Orden: heller Stein
  vharnholm: { roof: 'bone',    wall: 'blackstone' }, // Stadt der Stillen: aschgraue Schindeln, schwarzer Basalt
  karak: { roof: 'tile', wall: 'plaster', alt: 'shingle' },
  // Hochreich Aurelion (S12): heller Stein, Schiefer und Ziegel — sichtbar reicher als der Norden
  aurelheim: { roof: 'slate', wall: 'palestone', alt: 'tile' }, kupferhafen: { roof: 'tile', wall: 'plaster', alt: 'slate' }, gelenkhall: { roof: 'tile', wall: 'stone', alt: 'slate' },
  tickmar: { roof: 'slate', wall: 'blackstone', alt: 'tile' }, sanktserin: { roof: 'slate', wall: 'palestone' }, aurelheim_land: { roof: 'slate', wall: 'palestone', alt: 'tile' },           // S12 Karak-Atar: Lehmputz, Ziegel
  kettenfeste: { roof: 'slate', wall: 'blackstone' }, varonheim: { roof: 'slate', wall: 'blackstone', alt: 'shingle' }, varonburg: { roof: 'slate', wall: 'blackstone' },   /* Nutzer §5g.1: Varons Hauptstadt */ // Eiserne Kette (Session 11): Schiefer, schwarzer Stein
  // Dörfer (Session 12): Bauweise nach Herrschaft — Valen Stroh/Fachwerk, Orden Schiefer/heller Stein, Händler Holz, Tributdörfer ärmlich
  haselbrueck: { roof: 'thatch', wall: 'timber', alt: 'shingle' }, muehlbach: { roof: 'thatch', wall: 'timber', alt: 'tile' }, weidenau: { roof: 'thatch', wall: 'wood', alt: 'shingle' },
  rastfurt: { roof: 'shingle', wall: 'wood', alt: 'tile' }, lichtenrain: { roof: 'slate', wall: 'palestone', alt: 'tile' },
  grauwasser: { roof: 'thatch', wall: 'wood' }, hohlstein: { roof: 'shingle', wall: 'stone' }, eisenried: { roof: 'thatch', wall: 'wood' },
};
// Materialtöne; Nachbarn unterscheiden sich: je Haus ein gedämpfter Ton aus der Familie (neu gedeckt, verwittert, anderer Kalk)
// Referenz 4 (Session 12): kräftigere Dachfarben — goldenes Stroh, rotbraune Schindeln, blauer Schiefer, tiefrote Ziegel
const ROOF_VAR = { thatch: ['#8a6a34', '#7e6232', '#94703a', '#6e5a30'], shingle: ['#6a4436', '#5e4a3a', '#744a38', '#54483a'],
  slate: ['#3e4a5e', '#465264', '#38445a', '#4a5068'], bone: ['#5a564c', '#4f4c44', '#625d51', '#48453e'], tile: ['#8a3a2a', '#963f2e', '#7a3428', '#8e4a34', '#823e2c'] };
const WALL_VAR = { timber: ['#b1a283', '#a8997b', '#b9ac90'], wood: ['#5d4632', '#534030', '#654d37'], stone: ['#6c665c', '#645f58', '#736b5f'],
  plaster: ['#a89a7e', '#b4a88d', '#a39177', '#aba390', '#b39a85'], palestone: ['#9b968a', '#a39d91', '#938e83'], blackstone: ['#3f3d39', '#383633', '#46423c'] };
const DIM = { timber: 0.42, plaster: 0.38, palestone: 0.22, stone: 0.15, wood: 0.12 };                       // Session 10: dunkler, gealtert
// S14 Stil R (Referenz 5): kräftigere Dächer (goldenes Stroh, rotbraune Schindeln, blauer Schiefer, rote Ziegel), Wände weniger abgedunkelt
const ROOF_VAR_R = { thatch: ['#b08a3e', '#a07a34', '#bc9444', '#9a7434'], shingle: ['#7a4a34', '#6e4230', '#84523a', '#704636'], slate: ['#3a4c6a', '#445878', '#34465e', '#40506c'],
  bone: ['#5e5a50', '#54504a', '#686256', '#4c4842'], tile: ['#a8402a', '#b44a30', '#963a26', '#a44632', '#9c3e2c'] };
const varOf = (tab, kind, b, salt) => { const R = drawnOn(), a = (R && tab === ROOF_VAR ? ROOF_VAR_R : tab)[kind], c = a[(hh(b.hx ?? b.x, b.hy ?? b.y, salt) * a.length) | 0];
  return tab === WALL_VAR && DIM[kind] ? mix(c, '#2a221a', DIM[kind] * (R ? 0.55 : 1)) : c; };
const BEAM = '#3e2e20', DOORW = '#4a3322', IRON = '#35332f';
const SHUTTER = ['#4a5a3a', '#5a3a2a', '#3a4a5a', '#5a5030'];
/* Artist Runde 5 (Varonheim): Viertel der Hauptstadt auf dem Kronfels. Spiegel von CAPITAL und district() in world.js — fester Wert
   statt Import, denn world.js lädt buildings.js (ein Rückimport wäre ein Ladezyklus). Nur Optik; Würfel aus der Lage, nie rnd(). */
const VQ = { x: 558, y: 107, hh: 43 };
export function quarterOf(b) {
  if (!b || b.map !== 'world') return null;
  if (b.town === 'varonburg') return 'castle';                     // Burgbauten auf dem Fels (Thronsaal, Flügel, Verlies …)
  if (b.town !== 'varonheim') return null;
  const gy = VQ.y - 11, west = b.x < VQ.x;
  return b.y < gy ? (west ? 'temple' : 'noble') : b.y < VQ.y + 7 ? (west ? 'merchant' : 'guild') : (west ? 'slum' : 'craft');
}
const isNoble = b => quarterOf(b) === 'noble' && b.type !== 'cottage';   /* Adelshäuser: zwei Geschosse, höher, Schiefer, zwei Schornsteine */

// Funktion → Merkmale. label: was man beim Anschauen liest.
export const BTYPES = {
  tavern:   { label: 'Taverne',        chimney: 1, sign: 'tankard', big: 1 },
  smithy:   { label: 'Schmiede',       chimney: 1, sign: 'hammer', forge: 1 },
  healer:   { label: 'Heilerhaus',     sign: 'herb', herbs: 1 },
  hall:     { label: 'Haus des Vorstehers', banner: 'valen', bigDoor: 1, chimney: 1 },
  kontor:   { label: 'Handelskontor',  sign: 'scales', sacks: 1 },
  barracks: { label: 'Wachhaus',       banner: 'valen', crest: 1 },
  chapel:   { label: 'Kapelle',        rose: 1, cross: 1, bigDoor: 1 },
  merc:     { label: 'Söldnerhalle',   sign: 'swords', banner: 'merc' },
  house:    { label: 'Wohnhaus',       chimney: 0.5, flowers: 0.5, woodpile: 0.5 },
  cottage:  { label: 'Kate',           chimney: 0.4, woodpile: 0.6, patch: 1, fewWin: 1 },     // arm: geflicktes Dach, wenig Fenster
  manor:    { label: 'Bürgerhaus',     floors: 2, chimney: 1, flowers: 1 },                     // wohlhabend: zwei Geschosse
  bakery:   { label: 'Bäckerei',       chimney: 1, sign: 'bread', oven: 1, sacks: 1 },
  barn:     { label: 'Scheune',        bigDoor: 1, barnDoor: 1, noWin: 1, hay: 1, wall: 'wood' },
  stable:   { label: 'Stall',          stalls: 1, noWin: 1, hay: 1, wall: 'wood' },
  store:    { label: 'Lagerhaus',      bigDoor: 1, crane: 1, sacks: 1, fewWin: 1 },
  fisher:   { label: 'Fischerhütte',   nets: 1, wall: 'wood', woodpile: 0.3 },
  // Monumentalbauten (Phase 5, Nutzer: „mehr Gebäude betretbar“): eigene Fassade (monumentSprite), begehbar wie Häuser
  palace:      { label: 'Regierungspalais',            mono: 1, columns: 1, dome: 1, towers: 1, emblem: 'sun' },
  markethall:  { label: 'Große Markthalle',            mono: 1, glass: 1, arches: 1, emblem: 'scales' },
  bank:        { label: 'Zentralbank und Börse',       mono: 1, columns: 1, emblem: 'coin' },
  academy:     { label: 'Akademie von Aurelion',       mono: 1, columns: 1, towers: 1, emblem: 'book' },
  observatory: { label: 'Aurelionisches Observatorium', mono: 1, dome: 1, emblem: 'star' },
  library:     { label: 'Große Bibliothek',            mono: 1, arches: 1, emblem: 'book' },
  thronsaal:    { label: 'Thronsaal der Varonsburg' }, adelsfluegel: { label: 'Adelsflügel' }, kanzlei: { label: 'Kanzlei' },   /* Varonheim-Umbau S2: Burg in der Welt */
  verlies:      { label: 'Verlies' }, kronschmiede: { label: 'Kronschmiede', chimney: 1, sign: 'hammer', forge: 1 },
  court:       { label: 'Hoher Gerichtshof',           mono: 1, columns: 1, emblem: 'scales' },
  hospital:    { label: 'Hospital der Kaiserin',       mono: 1, arches: 1, emblem: 'cross' },
  bathhouse:   { label: 'Badehaus',                    mono: 1, dome: 1, arches: 1, emblem: 'wave' },
  magitech:    { label: 'Magitech-Werkstatt',          mono: 1, glass: 1, emblem: 'gear', glow: 1 },
  factoryhall: { label: 'Werkhalle',                   mono: 1, glass: 1, saw: 1, emblem: 'gear', dark: 1 },
  legion:      { label: 'Kaserne der Sonnenlegion',    mono: 1, towers: 1, emblem: 'sun' },
};

// 5×4-Symbole für Schilder ('#' = Farbe, '+' = Licht)
const ICON = {
  key:     ['##...', '#####', '##.#.', '.....'],   /* Artist Runde 5: Schlossergilde */
  tankard: ['.###.', '+##.#', '.##.#', '.###.'],
  hammer:  ['####.', '####.', '..#..', '..#..'],
  herb:    ['.#.#.', '##.##', '.###.', '..#..'],
  scales:  ['#.#.#', '#####', '..#..', '.###.'],
  swords:  ['#...#', '.#.#.', '..#..', '.#.#.'],
  bread:   ['.###.', '#+#+#', '#####', '.....'],
};

// Zustand je Haus (dystopische Welt): 0 bewohnt/gepflegt, 1 heruntergekommen, 2 verlassen/zerstört (kein Licht, keine
// Bewohner). Je Ort unterschiedlich stark: die Grenzorte verfallen, die Ordensfeste hält ihre Häuser instand.
// Betriebe (Taverne, Schmiede …) werden nie ganz aufgegeben — sonst fehlt der Ort, der sie braucht.
const WEAR_BIAS = { varonburg: 0, varonheim: 0.1, aurelheim: 0.02, kupferhafen: 0.06, gelenkhall: 0.08, tickmar: 0.1, sanktserin: 0.04, aurelheim_land: 0.05, grauwasser: 0.6, hohlstein: 0.6, eisenried: 0.6, eren: 0.38, northcity: 0.22, saltport: 0.32, kreuzweg: 0.48, ashford: 0.62, sonnwacht: 0.12, vharnholm: 0.5 };
const KEEP = new Set(['tavern', 'smithy', 'healer', 'hall', 'kontor', 'barracks', 'chapel', 'merc', 'bakery', 'manor', 'store', 'palace', 'markethall', 'bank', 'academy', 'observatory', 'library', 'court', 'hospital', 'bathhouse', 'magitech', 'factoryhall', 'legion']);
export function wearOf(b) {
  if (b.wear != null) return b.wear;
  const bias = WEAR_BIAS[b.town] ?? 0.3, r = hh(b.hx ?? b.x, b.hy ?? b.y, 55);
  return !KEEP.has(b.type) && r < bias * 0.45 ? 2 : r < bias ? 1 : 0;
}
// Stilvarianten je Haus (Würfel aus der Lage, stabil): Dachneigung, Gaube, Vordach, Steinsockel
const styleOf = b => ({ pitch: 0.34 + hh(b.hx ?? b.x, b.hy ?? b.y, 61) * 0.17, dormer: b.w >= 5 && hh(b.hx ?? b.x, b.hy ?? b.y, 62) < 0.4,
  awning: hh(b.hx ?? b.x, b.hy ?? b.y, 63) < 0.35, plinth: hh(b.hx ?? b.x, b.hy ?? b.y, 64) < 0.45 });

// Wandhöhe FH: höher als eine Figur (25 Texel inkl. Kopf ≈ Tür 16). Firsthöhe RISE wächst mit der Tiefe.
// Session 10: Fassade höher (Tür ≈ Figurenhöhe, Figuren sind seit v2 größer); das Dach behält mindestens 24 Texel.
export function houseDims(b) { const T = BTYPES[b.type] || {}; if (T.mono) { const RISE = 12 + b.h * 2 + (T.dome ? 30 : T.towers ? 16 : 0), FH = Math.min(52, RISE + b.h * 16 - 24); return { OV: 2, RISE, FH, W: b.w * 16 + 4, H: RISE + b.h * 16 }; }
  const RISE = 10 + b.h * 2 + (isNoble(b) ? 8 : b.type === 'chapel' && quarterOf(b) === 'temple' ? 34 : 0), FH = Math.min(T.floors === 2 || isNoble(b) ? 46 : b.big || T.big ? 34 : 32, RISE + b.h * 16 - 24); return { OV: 2, RISE, FH, W: b.w * 16 + 4, H: RISE + b.h * 16 + 1 }; }
// Giebel nach vorn: über der Vorderwand ein Giebeldreieck (Höhe GH), dahinter zwei Dachflächen, die nach hinten laufen.
export function gableOf(b) {
  const { OV, RISE, FH, W } = houseDims(b), yF = RISE + b.h * 16 - FH, halfW = (b.w * 16) / 2;
  const GH = Math.min(Math.round(b.w * 16 * styleOf(b).pitch), yF - 10);   // Dachneigung variiert von Haus zu Haus
  return { cx: OV + halfW - 0.5, halfW, apexY: yF - GH, GH, yF, W };
}

// Schornstein-Mündung in Texeln (für Rauch im Renderer) oder null. Gleiche Würfel wie beim Zeichnen.
export function chimneyOf(b) {
  if (BTYPES[b.type]?.mono && !BTYPES[b.type].dark) return null;   // Prachtbauten rauchen nicht (Werkhalle schon)
  const T = BTYPES[b.type] || BTYPES.house, { RISE, FH, W } = houseDims(b);
  const on = T.forge || isNoble(b) || (T.chimney && (T.chimney >= 1 || hh(b.hx ?? b.x, b.hy ?? b.y, 7 + 'chimney'.length) < T.chimney));
  if (!on || wearOf(b) === 2) return null;                           // verlassen: Schornstein eingestürzt, kein Rauch
  const G = gableOf(b), side = hh(4, 4, b.seed || 1) > 0.5 ? 1 : -1;
  return { x: Math.round(G.cx + side * G.halfW * 0.5) + 1, y: Math.max(2, G.apexY - 14) - 2, soot: !!T.forge };
}

// Monumentalfassade (MP2 §52): heller Quaderstein, Säulen oder Bögen, hohe Bogenfenster, Goldgesims, Freitreppe, Wappen;
// darüber ein flaches Dach mit Balustrade, dazu Kuppel, Glasdach, Sägezahn oder Ecktürme je nach Bau. Gleiche Maße-Logik
// wie Häuser (houseDims), damit Renderer, Dach-Ausblenden beim Betreten und Kollision unverändert bleiben.
const EMBLEM = { sun: ['.#.#.', '#+++#', '.+#+.', '#+++#', '.#.#.'], scales: ['#.#.#', '#####', '..#..', '.###.'], coin: ['.###.', '#+#+#', '##+##', '#+#+#', '.###.'],
  book: ['##.##', '#+#+#', '#+#+#', '#####'], star: ['..#..', '.###.', '#####', '.#.#.'], cross: ['.###.', '#####', '.###.', '.###.'], wave: ['#..#.', '.##.#', '#..#.'], gear: ['.#.#.', '#####', '##.##', '#####', '.#.#.'] };
function monumentSprite(b, lit) {
  const T = BTYPES[b.type], { OV, RISE, FH, W, H } = houseDims(b), s = b.seed || 1, n = (x, y) => hh(x, y, s), g = new G(W, H);
  const yF = RISE + b.h * 16 - FH, yB = RISE + b.h * 16, fx0 = OV, fx1 = OV + b.w * 16 - 1, cx = OV + ((b.w * 16) >> 1);
  const St = ramp(T.dark ? '#6a655c' : '#b8b0a0'), Gd = ramp('#b08a44'), Ld = ramp(T.dark ? '#3a3e44' : '#5a6878');
  // ---- Dach über dem Grundriss: flach, Bleibahnen, Balustrade an der Traufe ----
  const roofTop = RISE, roofBot = yF;
  for (let y = roofTop; y < roofBot; y++) for (let x = fx0; x <= fx1; x++) {
    const r = n(x, y), seam = (x - fx0) % 10 === 0;
    let c = seam ? Ld.sh : r > 0.93 ? Ld.hi : Ld.b;
    if (T.glass && (x - fx0) % 20 > 3 && (x - fx0) % 20 < 17 && (y - roofTop) % 12 > 2 && (y - roofTop) % 12 < 10) c = lit ? '#d8a860' : (y - roofTop) % 12 < 5 ? '#9ac0d4' : '#6a90a8';   // Glasfelder
    if (T.saw && (x - fx0) % 24 < 6) c = Ld.dk;                                                                    // Sägezahndach
    if (x === fx0 || x === fx1) c = Ld.dk;
    g.p(x, y, c);
  }
  for (let x = fx0; x <= fx1; x++) { g.p(x, roofTop, St.hi); g.p(x, roofTop + 1, St.b); }                         // Attika hinten
  for (let x = fx0; x <= fx1; x++) for (let y = roofBot - 6; y < roofBot; y++) g.p(x, y, y === roofBot - 6 ? St.hi : (x - fx0) % 4 === 0 && y < roofBot - 1 ? St.sh : St.b);   // Balustrade
  if (T.towers) for (const tx of [fx0, fx1 - 13]) { for (let y = roofTop - 14; y < roofBot; y++) for (let x = tx; x < tx + 14; x++) g.p(x, y, x === tx || y === roofTop - 14 ? St.hi : x === tx + 13 ? St.sh : St.b);
    for (let y = roofTop - 20; y < roofTop - 14; y++) for (let x = tx + 2; x < tx + 12; x++) if (Math.abs(x - tx - 7) <= (y - roofTop + 20)) g.p(x, y, Ld.b);   // Turmdach
    g.r(tx + 5, roofTop - 6, 4, 6, lit ? '#e2a95a' : '#2a3440'); }
  if (T.dome) { const dr = Math.min(Math.round((fx1 - fx0) * 0.28), 36), dcy = roofTop + Math.round((roofBot - roofTop) * 0.45);
    for (let y = dcy - dr; y <= dcy; y++) for (let x = cx - dr; x <= cx + dr; x++) { const d = Math.hypot(x - cx, (y - dcy) * 1.1); if (d > dr) continue;
      g.p(x, y, x < cx - dr * 0.35 && y < dcy - dr * 0.4 ? mix(Ld.hi, '#8ab0c8', 0.4) : (x - cx) % 6 === 0 ? Ld.sh : d > dr - 1.5 ? Ld.dk : Ld.b); }
    g.r(cx - dr, dcy, dr * 2 + 1, 3, St.b); g.r(cx - 1, dcy - dr - 8, 3, 8, Gd.b); g.p(cx, dcy - dr - 9, Gd.hi); }
  // ---- Fassade ----
  for (let y = yF; y < yB; y++) for (let x = fx0; x <= fx1; x++) { const row = ((y - yF) / 4) | 0, xo = (x - fx0 + (row & 1) * 4) % 9;
    g.p(x, y, (y - yF) % 4 === 3 || xo === 0 ? St.sh : xo === 1 && (y - yF) % 4 === 0 ? St.hi : n(x, y) > 0.94 ? mix(St.b, St.sh, 0.5) : St.b); }
  for (let x = fx0; x <= fx1; x++) { g.p(x, yF, Gd.b); g.p(x, yF + 1, Gd.sh); g.p(x, yF + 2, St.dk); g.p(x, yB - 2, St.sh); g.p(x, yB - 1, St.dk); }   // Goldgesims, Sockel
  const dw = Math.min(22, 10 + b.w), dh = Math.min(FH - 10, 30), dx = cx - (dw >> 1), dy = yB - 3 - dh;
  const pier = x => { for (let y = yF + 3; y < yB - 3; y++) { g.p(x, y, St.hi); g.p(x + 1, y, mix(St.hi, St.b, 0.4)); g.p(x + 2, y, St.b); g.p(x + 3, y, St.sh); } g.r(x - 1, yF + 3, 6, 2, St.hi); g.r(x - 1, yB - 5, 6, 2, St.sh); };
  const archWin = (x0, y0, w, h2) => { for (let y = y0; y < y0 + h2; y++) for (let x = x0; x < x0 + w; x++) { const top = y < y0 + (w >> 1) && Math.hypot(x - x0 - (w - 1) / 2, y - y0 - (w >> 1)) > w / 2; if (top) continue;
      g.p(x, y, lit ? ((x + y) % 4 ? '#e2a95a' : '#f2cf8a') : x === x0 + (w >> 1) || y === y0 + (h2 >> 1) ? '#1e2630' : y < y0 + 4 ? '#6a8aa0' : '#2a3440'); }
    g.r(x0 - 1, y0 + h2, w + 2, 1, St.hi); };
  const step = T.columns ? 12 : 16, winH = Math.min(FH - 16, 22);
  for (let x = fx0 + 6; x < fx1 - 8; x += step) {
    const nearDoor = x + 8 > dx - 2 && x < dx + dw + 2;
    if (T.columns) pier(x);
    if (!nearDoor && (T.arches || !T.columns || (x - fx0) % 24 === 6)) archWin(x + (T.columns ? 5 : 0), yF + 8, 6, winH);
  }
  // Portal: Freitreppe, Doppeltür, Bogen, Wappen
  for (let k = 0; k < 3; k++) g.r(dx - 6 + k * 2, yB - 3 + k - 2, dw + 12 - k * 4, 1, k ? St.hi : St.sh);
  for (let y = dy; y < yB - 3; y++) for (let x = dx; x < dx + dw; x++) { const top = y < dy + (dw >> 1) && Math.hypot(x - dx - (dw - 1) / 2, y - dy - (dw >> 1)) > dw / 2; if (top) continue;
    g.p(x, y, x === dx + (dw >> 1) ? '#1a1410' : (x - dx) % 3 === 0 ? '#3a2a1c' : '#4e3a26'); }
  g.r(dx - 2, dy - 2, dw + 4, 2, Gd.b);
  const E = EMBLEM[T.emblem]; if (E) { const ex = cx - 2, ey = yF + 4; E.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') g.p(ex + i, ey + j, ch === '+' ? Gd.hi : Gd.b); })); }
  if (T.glow) for (let x = fx0 + 3; x < fx1 - 3; x += 20) { g.r(x, yF + 5, 3, 3, '#9ad8ff'); g.p(x + 1, yF + 4, '#e0f4ff'); }        // Magitech: blaue Leuchtsteine
  if (b.door !== 'S') for (let y = dy; y < yB - 3; y++) for (let x = dx - 6; x < dx + dw + 6; x++) g.p(x, y, St.b);                        // Seiteneingang: Front geschlossen
  return toCanvas(g);
}
export function houseSprite(b, lit) {
  if (BTYPES[b.type]?.mono) return monumentSprite(b, lit);
  const T = BTYPES[b.type] || BTYPES.house, st = TOWN_STYLE[b.town] || TOWN_STYLE.eren;
  const wear = wearOf(b), sty = styleOf(b), q = quarterOf(b), qh = k => hh(b.x, b.y, 300 + k), noble = isNoble(b);
  if (wear === 2) lit = false;                                      // verlassen: nachts dunkel
  /* Artist Runde 5: Varonheims Viertel — Adel, Tempel und Gilden unter dunklem Schiefer, die Elendsgasse unter Stroh und Flickschindeln
     mit Bretterwänden, die Händler im Fachwerk. */
  const qRoof = q === 'noble' || q === 'temple' || q === 'guild' || q === 'castle' ? 'slate' : q === 'slum' ? (qh(1) < 0.45 ? 'thatch' : 'shingle') : null;
  const qWall = q === 'slum' && qh(2) < 0.55 ? 'wood' : q === 'merchant' && qh(2) < 0.4 ? 'timber' : q === 'guild' && qh(2) < 0.45 ? 'stone' : null;
  const roofKind = b.roof || qRoof || (st.alt && hh(b.hx ?? b.x, b.hy ?? b.y, 71) < 0.3 ? st.alt : st.roof), wallKind = b.wall || T.wall || qWall || st.wall;   // Referenz 4: gemischte Dächer im Ort
  const { OV, RISE, FH, W, H } = houseDims(b), s = b.seed || 1, RR = drawnOn();
  const g = new G(W, H);
  const n = (x, y) => hh(x, y, s);
  const yF = RISE + b.h * 16 - FH, yB = RISE + b.h * 16;           // Fassade oben / Grundlinie
  const fx0 = OV, fx1 = OV + b.w * 16 - 1;                           // Fassade links/rechts
  const has = k => T[k] && (T[k] >= 1 || hh(b.hx ?? b.x, b.hy ?? b.y, 7 + k.length) < T[k]);

  // ---- Fassade ----
  const Wr = ramp(mix(varOf(WALL_VAR, wallKind, b, 93), '#806a50', (n(3, 3) - 0.5) * 0.18)), Br = ramp(BEAM);
  function wallAt(x, y) {
    const r = n(x, y), yy = y - yF + 300;
    if (wallKind === 'stone' || wallKind === 'palestone' || wallKind === 'blackstone') {
      const bw = wallKind === 'palestone' ? 7 : 5, row = (yy / 3) | 0, xo = (x - fx0 + (row & 1) * 3) % bw;
      return yy % 3 === 2 || xo === 0 ? Wr.sh : xo === 1 && yy % 3 === 0 ? Wr.hi : r > 0.9 ? mix(Wr.b, Wr.sh, 0.4) : Wr.b;
    }
    if (wallKind === 'wood') { const xo = (x - fx0) % 3; return r > 0.95 ? Wr.sh : xo === 0 ? Wr.dk : xo === 1 ? Wr.hi : Wr.b; }
    return r > 0.93 ? mix(Wr.b, Wr.sh, 0.5) : r < 0.05 ? Wr.hi : Wr.b;   // Fachwerk/Putz: Putzfläche mit Flecken
  }
  for (let y = yF; y < yB; y++) for (let x = fx0; x <= fx1; x++) g.p(x, y, wallAt(x, y));
  if (wallKind === 'timber') {                                     // Balkenwerk: Schwelle, Rähm, Ständer, Streben
    for (let x = fx0; x <= fx1; x++) { g.p(x, yF, Br.b); g.p(x, yF + 1, Br.sh); g.p(x, yB - 3, Br.b); }
    for (let x = fx0; x <= fx1; x += 13) for (let y = yF; y < yB - 2; y++) { g.p(x, y, Br.b); g.p(x + 1, y, Br.sh); }
    for (let x = fx0 + 2; x + 11 <= fx1; x += 13) if (n(x, 1) > 0.45) for (let k = 0; k < 8; k++) { g.p(x + k, yF + 2 + k, Br.sh); g.p(x + k + 1, yF + 2 + k, Br.b); }
  }
  if (sty.plinth && wallKind !== 'stone' && wallKind !== 'palestone' && wallKind !== 'blackstone')    // Bruchsteinsockel unter Holz/Fachwerk/Putz
    for (let y = yB - 9; y < yB - 2; y++) for (let x = fx0; x <= fx1; x++) { const row = (y - yB + 9) >> 1, xo = (x - fx0 + (row & 1) * 3) % 6;
      g.p(x, y, y === yB - 9 ? '#3a352e' : (y - yB + 9) % 2 === 1 || xo === 0 ? '#4e4a42' : n(x, y + 7) > 0.8 ? '#7a756a' : '#66615a'); }
  for (let x = fx0; x <= fx1; x++) { g.p(x, yB - 2, '#4a463f'); g.p(x, yB - 1, '#34312c'); if (n(x, 9) > 0.7) g.p(x, yB - 3, mix(Wr.b, '#3a3a2a', 0.5)); }   // Sockel, Spritzschmutz
  for (let x = fx0; x <= fx1; x++) g.p(x, yF, mix(g.at(x, yF) || Wr.b, '#120e0c', 0.45));   // Schatten unter der Traufe

  // ---- Tür & Fenster ----
  const floors2 = T.floors === 2 || noble;
  if (floors2) for (let x = fx0; x <= fx1; x++) { g.p(x, yB - 20, wallKind === 'timber' ? Br.b : mix(Wr.sh, '#120e0c', 0.3)); g.p(x, yB - 19, mix(Wr.b, '#120e0c', 0.25)); }   // Geschossgesims
  const midT = b.w >> 1, big = has('bigDoor');
  const dw = T.barnDoor ? 20 : big ? 14 : 10, dh = floors2 ? 26 : FH - 6, dx = fx0 + midT * 16 + ((16 - dw) >> 1), dy = yB - 2 - dh;
  const door = (x0, y0, w, hgt) => {
    const D = ramp(DOORW);
    g.r(x0 - 1, y0 - 1, w + 2, hgt + 1, Br.dk);
    for (let y = y0; y < y0 + hgt; y++) for (let x = x0; x < x0 + w; x++) g.p(x, y, (x - x0) % 3 === 0 ? D.sh : (x - x0) % 3 === 1 ? D.hi : D.b);
    if (w >= 10) for (let y = y0; y < y0 + hgt; y++) g.p(x0 + (w >> 1), y, D.dk);   // Doppeltür
    if (w >= 16) for (const [lx, lw] of [[x0, w >> 1], [x0 + (w >> 1) + 1, (w >> 1) - 1]])   // Scheunentor: Z-Streben je Flügel
      for (let k = 0; k < hgt - 6; k++) { const xx = lx + Math.round(k * (lw - 2) / (hgt - 7)); g.p(xx, y0 + hgt - 4 - k, D.hi); g.p(xx + 1, y0 + hgt - 4 - k, D.sh); }
    g.p(x0 + w - 2, y0 + (hgt >> 1), '#b89a5a'); g.r(x0, y0 + 2, w, 1, IRON); g.r(x0, y0 + hgt - 3, w, 1, IRON);
    g.r(x0 - 1, y0 + hgt, w + 2, 1, '#57524a');                    // Stufe
  };
  if (b.door === 'S') door(dx, dy, dw, dh);
  else if (b.door === 'W') door(fx0 + 1, dy + 2, 4, dh - 2);
  else if (b.door === 'E') door(fx1 - 4, dy + 2, 4, dh - 2);
  const shut = SHUTTER[(n(5, 5) * SHUTTER.length) | 0];
  const win = (x0, y0) => {
    g.r(x0 - 1, y0 - 1, 8, 10, Br.dk); g.r(x0 - 1, y0 + 8, 8, 1, '#6a6458');            // Rahmen, Fensterbank (6×8 Glas)
    for (let y = y0; y < y0 + 8; y++) for (let x = x0; x < x0 + 6; x++)
      g.p(x, y, lit ? (x === x0 + 2 || y === y0 + 3 ? '#8a5020' : (x + y) % 3 ? '#e2a95a' : '#f2cf8a') : (x === x0 + 2 || y === y0 + 3 ? Br.dk : x === x0 + 1 && y === y0 + 1 ? '#5a6470' : y > y0 + 4 ? '#101316' : '#181c21'));
    if (RR) { g.r(x0 - 1, y0 + 8, 8, 1, '#8a8274'); g.r(x0 - 1, y0 + 9, 8, 1, '#3a3630'); if (lit) for (let y = y0 + 10; y < Math.min(yB - 3, y0 + 14); y++) for (let x = x0; x < x0 + 6; x++) { const c = g.at(x, y); if (c) g.p(x, y, mix(c, '#e2a95a', 0.18 - (y - y0 - 10) * 0.04)); } }   // S14 Stil R: Bank, Lichtschein
    if (wallKind === 'timber' || wallKind === 'wood') { const Sr = ramp(shut); g.r(x0 - 3, y0, 2, 8, Sr.b); g.p(x0 - 3, y0, Sr.hi); g.p(x0 - 3, y0 + 4, Sr.dk); g.r(x0 + 7, y0, 2, 8, Sr.sh); g.p(x0 + 7, y0 + 4, Sr.dk); }
    return [x0, y0];
  };
  const stallDoor = (x0) => {                                      // Stalltür: oben offen (dunkel), unten Bretter
    const D = ramp(DOORW), top = yB - 2 - (FH - 7);
    g.r(x0 - 1, top - 1, 10, FH - 6, Br.dk);
    for (let y = top; y < yB - 2; y++) for (let x = x0; x < x0 + 8; x++)
      g.p(x, y, y < top + 7 ? (y === top ? '#0e0c0a' : '#17130f') : (x - x0) % 3 === 0 ? D.sh : D.b);
    g.r(x0, top + 7, 8, 1, IRON); g.p(x0 + 6, top + 10, '#b89a5a');
  };
  const wins = [];
  const slots = Math.max(1, Math.floor((b.w * 16 - 8) / 16));
  for (const wy of floors2 ? [yF + 7, yB - 20] : [yF + 8]) for (let i = 0; i < slots + 1; i++) {
    const cx = fx0 + 5 + Math.round(i * (b.w * 16 - 16) / Math.max(1, slots));
    if (b.door === 'S' && cx + 8 > dx - 3 && cx < dx + dw + 3 && wy + 9 > dy - 2) continue;
    if ((T.forge || T.oven) && i === 0 && wy > yB - 20) continue;
    if ((b.door === 'W' && cx < fx0 + 8) || (b.door === 'E' && cx > fx1 - 12)) continue;
    if (T.stalls) { stallDoor(cx - 1); continue; }
    if (T.noWin || (T.fewWin && i % 2)) continue;
    wins.push(win(cx, wy));
  }

  // ---- Dach: Giebel nach vorn ----
  // Über der Vorderwand das Giebeldreieck (Wandmaterial, Lüftungsluke), gerahmt von Windbrettern. Dahinter laufen
  // zwei Dachflächen nach hinten: West im Licht, Ost im Schatten (Licht von Nordwest). Lagen parallel zum First.
  const R = ramp(mix(mix(varOf(ROOF_VAR, roofKind, b, 91), '#1e222a', q && roofKind === 'slate' ? (q === 'castle' ? 0.42 : 0.32) : 0), '#6a5a48', (n(1, 2) - 0.5) * 0.25));   /* Varonheim: dunkler Schiefer */
  const { cx, halfW, apexY, GH } = gableOf(b);
  const inGable = (x, y) => y >= apexY && y < yF && Math.abs(x - cx) <= halfW * (y - apexY) / GH;
  /* Artist Runde 2 (Stil R): Fachwerk- und Putzhäuser tragen im Giebel eine senkrechte Bretterschalung statt einer hellen Putzfläche —
     das große helle Dreieck verschwindet, Dach und Giebel trennen sich im Wert. Je Brett eigener Ton, helle Kante links, Fuge dunkel. */
  const boards = RR && (wallKind === 'timber' || wallKind === 'plaster'), Gw = ramp(mix('#5e4630', '#6a5a48', n(6, 6) * 0.5));
  const boardAt = (x, y) => { const bx = Math.floor((x + 1) / 3), xo = (x + 1) - bx * 3, tn = hh(bx, 17, s); if (xo === 2) return Gw.dk;
    let c = tn > 0.7 ? mix(Gw.b, Gw.hi, 0.35) : tn < 0.25 ? mix(Gw.b, Gw.sh, 0.4) : Gw.b; if (xo === 0) c = mix(c, Gw.hi, 0.3); if (n(x, y + 300) > 0.93) c = mix(c, Gw.dk, 0.4); return c; };
  const cw = roofKind === 'thatch' ? 3 : 4;                               // Lagenbreite (Texel)
  const patches = T.patch || q === 'slum' ? [0, 1].map(i => ({ x: Math.round(cx + (i ? 1 : -1) * halfW * (0.3 + hh(i, 3, s) * 0.45)) - 3, y: 3 + Math.round(hh(i, 4, s) * Math.max(1, apexY - 6)) })) : [];
  for (let y = 0; y < yF; y++) for (let x = 0; x < W; x++) {
    if (inGable(x, y)) {                                                   // Giebelfeld in Wandmaterial
      if (y < yF) g.p(x, y, mix(boards ? boardAt(x, y) : wallAt(x, y), '#1a1510', 0.12 + 0.1 * (1 - (y - apexY) / GH)));   // Giebelfeld liegt im Schatten des Dachs
      continue;
    }
    const k = Math.abs(x - cx), west = x < cx, depth = 1 - y / (yF + 2);
    if (y === 0 && (x < 2 || x >= W - 2)) continue;
    let c = west ? mix(R.hi, R.b, 0.15) : mix(R.sh, R.dk, 0.25);          // Westfläche im Licht, Ostfläche deutlich im Schatten
    c = mix(c, R.dk, depth * 0.18);                                        // hintere Dachhälfte etwas dunkler (Tiefe)
    const lane = Math.floor(k / cw), pos = k - lane * cw, r = n(x, y);
    if (RR) {                                                              // S14 Stil R: Lagen quer, Stoßfugen versetzt, Licht an der Oberkante jeder Lage
      const rh = roofKind === 'thatch' ? 3 : roofKind === 'tile' ? 4 : 3, row = Math.floor(y / rh), ry = y - row * rh, jw = roofKind === 'slate' ? 5 : roofKind === 'tile' ? 4 : 6;
      const jx = (x + (row & 1) * (jw >> 1) + ((hh(row, 3, s) * 3) | 0)) % jw, tone = hh(Math.floor((x + (row & 1) * (jw >> 1)) / jw), row, s);
      if (ry === rh - 1) c = mix(c, R.dk, roofKind === 'thatch' ? 0.45 : 0.65);                      // Schattenkante unter der Lage
      else if (ry === 0) c = mix(c, R.hi, 0.3);
      if (roofKind !== 'thatch' && jx === 0 && ry < rh - 1) c = mix(c, R.dk, 0.5);                  // Stoßfuge
      else if (roofKind === 'thatch' && (x + row) % 2 === 0 && ry === 1) c = mix(c, R.dk, 0.18);    // Halme
      if (tone > 0.84) c = mix(c, R.hi, 0.18); else if (tone < 0.12) c = mix(c, R.dk, 0.22);
      if (roofKind === 'tile' && ry === 1 && jx === 1) c = mix(c, R.hi, 0.35);                     // Wölbung der Ziegel
    } else if (roofKind === 'thatch') {
      if (pos >= cw - 1) c = mix(c, R.dk, 0.5);                            // Lagenkante
      else if (pos === 0) c = mix(c, R.hi, 0.2);
      if ((y + lane * 3) % 4 === 0) c = mix(c, R.dk, 0.22);                // Halmbündel
      if (r > 0.87) c = mix(c, R.hi, 0.45); else if (r < 0.08) c = mix(c, R.dk, 0.4);
    } else if (roofKind === 'tile') {                                      // Mönch-Nonne: gerundete Rinnen
      c = pos === 0 ? mix(c, R.hi, 0.35) : pos === cw - 1 ? mix(c, R.dk, 0.55) : c;
      if ((y + (lane & 1) * 3) % 6 === 0) c = mix(c, R.dk, 0.35);
    } else {                                                               // Schindel/Schiefer: versetzte Plättchen
      const len = roofKind === 'slate' ? 5 : 6, yy = y + (lane & 1) * 3;
      const tone = hh(lane, (yy / len) | 0, s);
      if (pos >= cw - 1 || yy % len === 0) c = mix(c, R.dk, 0.6);
      else if (tone > 0.8) c = mix(c, R.hi, 0.25); else if (tone < 0.14) c = mix(c, R.dk, 0.3);
    }
    // Nässe/Moos: unregelmäßige Flecken (zwei versetzte Raster überlagert), bevorzugt auf der Schattenseite und zur Traufe hin
    const moss = Math.min(hh(((x + 2) / 5) | 0, (y / 4) | 0, s + 11), hh((x / 4) | 0, ((y + 2) / 6) | 0, s + 12));
    if (k > halfW * 0.35 && moss > (west ? 0.74 : 0.6)) c = mix(c, roofKind === 'thatch' ? '#3e3a26' : '#3a4230', west ? 0.22 : 0.32);
    const pa = patches.find(P => x >= P.x && x < P.x + 7 && y >= P.y && y < P.y + 5);   // Flickstellen (arme Kate): frischeres Material
    if (pa) c = x === pa.x || y === pa.y + 4 ? mix(c, R.dk, 0.4) : mix(c, roofKind === 'thatch' ? '#b09a5c' : '#7a6a54', 0.35);
    if (k < 2.2 && y < apexY) c = k < 1 ? (roofKind === 'thatch' ? mix(R.b, R.dk, (y % 5 === 0) ? 0.75 : 0.35) : mix(R.hi, '#f2e3c2', 0.25))
      : mix(c, R.dk, 0.35);                                                // First mit Kappe
    if (x === 0 || x === W - 1 || y === 0) c = R.dk;                       // Traufkanten
    if (y === yF - 1) c = R.dk;                                            // Traufkante über der Wand
    g.p(x, y, c);
  }
  const Bb = ramp('#5a4028');                                              // Windbretter entlang der Giebelkanten
  for (let y = apexY - 1; y < yF; y++) {
    const e = halfW * Math.max(0, y - apexY) / GH;
    for (const sgn of [-1, 1]) {
      const x = Math.round(cx + sgn * (e + 1));
      g.p(x, y, sgn < 0 ? Bb.hi : Bb.b); g.p(x + sgn, y, Bb.sh); g.p(x + 2 * sgn, y, Bb.dk);
    }
  }
  g.r(Math.round(cx) - 1, apexY - 3, 2, 3, Bb.b);                         // Firstbalken-Kopf
  for (let y = apexY + 1; y < yF; y++) {                                   // Schatten des Dachüberstands auf dem Giebelfeld
    const e = halfW * (y - apexY) / GH;
    for (let d = 0; d < 3; d++) for (const sgn of [-1, 1]) { const x = Math.round(cx + sgn * (e - d)); if (inGable(x, y)) g.p(x, y, mix(g.at(x, y) || Wr.b, '#0c0a08', 0.45 - d * 0.12)); }
  }
  if (roofKind === 'thatch') for (let x = 1; x < W - 1; x++) {             // Strohfransen an der Traufe (Seiten)
    const k = Math.abs(x - cx); if (k > halfW - 2 && n(x, 77) > 0.4) g.p(x, yF + 2, R.dk); }
  // Giebel-Luke bzw. Rosette/Heuluke
  const gy = apexY + Math.round(GH * 0.5), gx = Math.round(cx);
  let hatch = null;
  if (T.rose) {
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) { const d = Math.hypot(i - 3, j - 3); if (d < 3.6) g.p(gx - 3 + i, gy - 3 + j, d < 1.2 ? '#e8c070' : d < 2.6 ? ((i + j) % 2 ? '#9b2e26' : '#3a4a6a') : Br.dk); }
  } else if ((T.crane || T.hay) && GH > 16) {                         // Ladeluke: Heuboden bzw. Speicher
    const D = ramp(DOORW), ly = gy - 3; hatch = [ly - 1, ly + 10];
    g.r(gx - 5, ly - 1, 10, 11, Br.dk);
    for (let y = ly; y < ly + 9; y++) for (let x = gx - 4; x < gx + 4; x++) g.p(x, y, T.hay && y > ly + 4 ? (n(x, y + 3) > 0.4 ? '#c9a44a' : '#8a6a2a') : y < ly + 3 ? '#15120e' : (x - gx) % 3 === 0 ? D.sh : D.b);
    if (T.crane) {                                                    // Ladebalken mit Seil und Haken
      g.r(gx - 1, ly - 7, 3, 3, Bb.hi); g.p(gx + 1, ly - 5, Bb.dk); g.r(gx - 1, ly - 4, 3, 1, mix(wallAt(gx, ly - 4), '#0c0a08', 0.5));
      for (let y = ly - 4; y < yF + 6; y++) g.p(gx + 3, y, '#6a5a44');
      const Sk = ramp('#9a8a66'); g.r(gx + 1, yF + 6, 5, 5, Sk.b); g.p(gx + 1, yF + 6, Sk.hi); g.r(gx + 5, yF + 7, 1, 4, Sk.sh);
    }
  } else if (GH > 14) {
    g.r(gx - 2, gy - 2, 5, 5, Br.dk); g.r(gx - 1, gy - 1, 3, 3, lit ? '#e2a95a' : '#15181c'); g.p(gx, gy - 1, Br.dk);
  }
  if (wallKind === 'timber') for (let y = apexY + 4; y < yF; y++) {        // Fachwerk im Giebel: Mittelständer, Kehlbalken
    if (!inGable(gx, y) || (hatch && y >= hatch[0] && y <= hatch[1])) continue; if (Math.abs(y - gy) > 3) g.p(gx, y, Br.b);
    if (y === yF - Math.round(GH * 0.3)) for (let x = 0; x < W; x++) if (inGable(x, y) && inGable(x, y - 1)) g.p(x, y, Br.b);
  }
  for (let x = fx0; x <= fx1; x++) for (let d = 0; d < 4; d++) g.p(x, yF + d, mix(g.at(x, yF + d) || Wr.b, '#0e0b09', [0.55, 0.4, 0.26, 0.14][d]));   // Traufschatten (Verlauf)
  if (b.door === 'N') { const nx = Math.round(cx) - 4; g.r(nx - 1, 1, 10, 3, Br.dk); g.r(nx, 2, 8, 1, DOORW); }

  // ---- Funktion von außen ----
  const ch = chimneyOf(b);
  const chim = (chx, chy, forge) => {                                       // gemauerter Schornstein mit Schlagschatten
    const C = ramp('#6c665c'), x0 = chx - 3, top = chy + 2, bot = Math.min(apexY + 2, top + 16);
    for (let y = top + 3; y < bot + 3; y++) for (let x = x0 + 7; x < x0 + 10; x++) if (g.at(x, y)) g.p(x, y, mix(g.at(x, y), '#0c0a08', 0.45));
    for (let y = top; y < bot; y++) for (let x = x0; x < x0 + 7; x++) {
      const row = (y - top) >> 1, xo = (x - x0 + (row & 1) * 2) % 4;
      g.p(x, y, x === x0 ? C.hi : x === x0 + 6 ? C.sh : (y - top) % 2 === 1 || xo === 0 ? mix(C.b, C.sh, 0.5) : C.b);
    }
    g.r(x0 - 1, top - 2, 9, 2, C.dk); g.r(x0 - 1, top - 2, 9, 1, C.sh); g.r(x0 + 1, top - 2, 5, 1, '#0e0c0a');
    if (forge) for (let x = x0 - 4; x < x0 + 11; x++) for (let y = bot; y < bot + 6; y++) if (g.at(x, y) && n(x, y + 90) > 0.5) g.p(x, y, mix(g.at(x, y), '#16120e', 0.45));   // Ruß
  };
  if (ch) { chim(ch.x, ch.y, T.forge); if (noble) chim(Math.round(2 * cx - ch.x), ch.y, 0); }   /* Adelshaus: zweiter Schornstein gespiegelt */
  const signAt = (icon) => {                                        // Ausleger mit hängendem Schild an der Fassadenecke
    const sx = b.door === 'S' ? Math.min(fx1 - 10, dx + dw + 3) : fx1 - 10, sy = yF + 2;
    g.r(sx, sy, 7, 1, IRON); g.p(sx + 1, sy + 1, IRON); g.p(sx + 6, sy + 1, IRON);
    const Sr = ramp('#6a5236');
    g.r(sx, sy + 2, 8, 7, Sr.b); g.r(sx, sy + 2, 8, 1, Sr.hi); g.r(sx, sy + 8, 8, 1, Sr.sh);
    const I = ICON[icon];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) { const ch = I[j][i]; if (ch !== '.') g.p(sx + 1 + i + 1, sy + 3 + j + 1, ch === '+' ? '#e8dcb8' : '#1c1612'); }
  };
  if (sty.dormer && !noble && wear < 2 && apexY > 12) {                       // Dachgaube auf der Seite ohne Schornstein
    const side = ch ? (ch.x > cx ? -1 : 1) : 1, gx0 = Math.round(cx + side * halfW * 0.55) - 4, gy0 = Math.max(4, apexY - 13);
    for (let j = 0; j < 4; j++) for (let i = 4 - j; i <= 4 + j; i++) g.p(gx0 + i, gy0 + j, j === 0 ? R.dk : i < 4 ? mix(R.hi, R.b, 0.3) : mix(R.sh, R.dk, 0.2));   // Gaubendach
    g.r(gx0, gy0 + 4, 9, 6, wallAt(gx0, gy0 + 20)); g.r(gx0 + 2, gy0 + 5, 5, 4, Br.dk);
    g.r(gx0 + 3, gy0 + 6, 3, 3, lit ? '#e2a95a' : '#15181c'); g.r(gx0, gy0 + 10, 9, 1, mix(R.dk, '#0c0a08', 0.4));
  }
  if (sty.awning && b.door === 'S' && !T.barnDoor && !big) {        // Vordach über der Tür auf zwei Knaggen
    const ax0 = dx - 3, ax1 = dx + dw + 2, ay = dy - 4;
    for (let x = ax0; x <= ax1; x++) { g.p(x, ay, R.dk); g.p(x, ay + 1, x % 3 ? R.b : R.sh); g.p(x, ay + 2, R.sh); g.p(x, ay + 3, mix(g.at(x, ay + 3) || Wr.b, '#0c0a08', 0.45)); }
    g.p(ax0, ay + 3, Br.b); g.p(ax1, ay + 3, Br.b); g.p(ax0, ay + 4, Br.sh); g.p(ax1, ay + 4, Br.sh);
  }
  if (q) quarterFront();
  if (T.sign) signAt(T.sign);
  if (T.forge) {                                                    // offene Esse in der Wand, Glut
    const ex = fx0 + 3, ey = yB - 10;
    g.r(ex - 1, ey - 1, 10, 9, '#3a3631');
    for (let y = ey; y < ey + 7; y++) for (let x = ex; x < ex + 8; x++) g.p(x, y, n(x, y + 5) > 0.55 ? '#f0a040' : n(x, y + 6) > 0.4 ? '#c05020' : '#5a1e10');
    g.r(ex - 1, ey - 3, 10, 2, '#1e1a16');                          // Ruß über der Esse
    g.r(fx1 - 7, yF + 4, 1, 6, '#6a5a44'); g.r(fx1 - 9, yF + 4, 5, 2, IRON);   // Hammer an der Wand
  }
  if (T.oven) {                                                     // Backofen: gemauerter Bogen mit Glut, Brote auf dem Sims
    const ex = fx0 + 3, ey = yB - 12, C = ramp('#7a6a58');
    for (let y = ey - 2; y < yB - 2; y++) for (let x = ex - 1; x < ex + 11; x++) { const dxx = x - ex - 4.5, top = ey + Math.abs(dxx) * 0.5 - 2;
      if (y >= top) g.p(x, y, (x + (y >> 1)) % 4 === 0 ? C.sh : y === Math.ceil(top) ? C.hi : C.b); }
    for (let y = ey + 2; y < yB - 4; y++) for (let x = ex + 2; x < ex + 8; x++) if (y >= ey + 2 + Math.abs(x - ex - 4.5) * 0.6) g.p(x, y, n(x, y + 5) > 0.5 ? '#f0a040' : n(x, y + 6) > 0.35 ? '#b04818' : '#4a1a0c');
    for (let i = 0; i < 3; i++) { g.r(ex + 1 + i * 3, ey - 4, 3, 2, '#b07a3a'); g.p(ex + 1 + i * 3, ey - 4, '#d09a5a'); }
  }
  if (T.nets) {                                                     // Fischernetz an der Wand, Schwimmer oben
    const nx0 = b.door === 'S' ? Math.max(fx0 + 2, dx + dw + 3) : fx1 - 20, nx1 = Math.min(fx1 - 2, nx0 + 18);
    for (let y = yF + 3; y < yB - 5; y++) for (let x = nx0; x <= nx1; x++) if ((x + y) % 4 === 0 || (x - y + 400) % 4 === 0) g.p(x, y, (y - yF) % 7 === 0 ? '#6a5a40' : '#9a8a64');
    for (let x = nx0; x <= nx1; x += 4) { g.p(x, yF + 3, '#a84a3a'); g.p(x + 1, yF + 3, '#c9bfa6'); }
  }
  if (T.hay) {                                                      // Heu an der Seitenwand
    const hx = b.door === 'S' && dx - fx0 > 18 ? fx0 + 2 : fx1 - 14;
    for (let y = yB - 9; y < yB - 1; y++) for (let x = hx; x < hx + 13; x++) { const d = Math.abs(x - hx - 6) / 6.5, top = yB - 2 - (1 - d * d) * 7;
      if (y >= top) g.p(x, y, y < top + 1.5 ? '#d9b85a' : n(x, y + 9) > 0.55 ? '#b08a3a' : (x + y) % 3 ? '#9a7a30' : '#7a5a22'); }
    g.r(hx + 11, yB - 16, 1, 14, '#6a5a44'); g.r(hx + 10, yB - 17, 3, 1, IRON);   // Heugabel an der Wand
  }
  if (T.herbs) for (let i = 0; i < 4; i++) { const hx = fx0 + 6 + i * Math.floor((b.w * 16 - 12) / 4);   // Kräuterbündel unter der Traufe
    g.p(hx, yF + 1, BEAM); for (let k = 0; k < 3; k++) g.p(hx + (k === 1 ? 1 : 0), yF + 2 + k, k === 2 ? '#8a7a44' : '#5a7a3a'); }
  const bannerKind = q && (T.banner || noble || q === 'castle') ? 'varon' : T.banner && (({ sonnwacht: 'order', kreuzweg: 'merch', ashford: 'merch' })[b.town] || T.banner);   // wer hier herrscht
  if (bannerKind) {                                                 // Banner an der Wand
    const col = bannerKind === 'varon' ? ['#5a1618', '#c9a24a'] : bannerKind === 'valen' ? ['#2f4260', '#b9c3d2'] : bannerKind === 'order' ? ['#d9d2c0', '#9b2e26'] : ['#5a4630', '#bd9433'];
    for (const bx of q === 'castle' && b.w >= 6 ? [fx0 + 14, fx1 - 19] : [fx0 + 4, fx1 - 9]) { if (b.door === 'S' && bx + 6 > dx - 1 && bx < dx + dw + 1) continue;
      const Bn = ramp(col[0]); g.r(bx - 1, yF + 1, 8, 1, BEAM);
      for (let y = yF + 2; y < yF + 11; y++) for (let x = bx; x < bx + 6; x++) g.p(x, y, x === bx ? Bn.hi : x === bx + 5 ? Bn.sh : Bn.b);
      g.p(bx + 1, yF + 11, Bn.b); g.p(bx + 4, yF + 11, Bn.b);
      for (let k = 0; k < 3; k++) { g.p(bx + 1 + k, yF + 4 + k, col[1]); g.p(bx + 4 - k, yF + 4 + k, col[1]); } }
  }
  if (T.crest && b.door === 'S') { const cx = dx + (dw >> 1) - 3, cy = dy - 7; const Cr = ramp('#8a8f98'); g.r(cx, cy, 6, 5, Cr.b); g.r(cx, cy, 6, 1, Cr.hi); g.r(cx + 1, cy + 5, 4, 1, Cr.sh); g.r(cx + 2, cy + 1, 2, 3, '#2f4260'); }
  if (T.cross) { const x0 = Math.round(gableOf(b).cx) - 1, y0 = Math.max(0, gableOf(b).apexY - 11); g.r(x0, y0, 2, 9, '#d9d2c0'); g.r(x0 - 2, y0 + 2, 6, 2, '#d9d2c0'); g.p(x0, y0, '#f2ead6'); }
  if (q) quarterTop();
  if (has('flowers') && wins.length) { const [wx, wy] = wins[(n(8, 8) * wins.length) | 0]; g.r(wx - 1, wy + 6, 8, 2, '#4a3322');
    for (let i = 0; i < 6; i++) g.p(wx + i, wy + 5, n(i, 3) > 0.5 ? '#b04a3a' : '#c9a84a'); }
  if (has('woodpile')) { const wx = b.door === 'E' ? fx0 + 1 : fx1 - 7, wy = yB - 6;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 6 - (j === 0 ? 2 : 0); i++) g.p(wx + i + (j === 0 ? 1 : 0), wy + j, (i + j) % 2 ? '#7a5a38' : '#5a4028'); }
  if (T.sacks) for (let i = 0; i < 3; i++) { const sx = fx1 - 18 + i * 5, sy = yB - 7; const Sk = ramp('#9a8a66');   // Säcke an der Wand
    g.r(sx, sy + 1, 4, 5, Sk.b); g.r(sx + 1, sy, 2, 1, Sk.sh); g.p(sx, sy + 1, Sk.hi); g.r(sx + 3, sy + 2, 1, 4, Sk.sh); }
  for (let y = yB - 12; y < yB - 2; y++) for (let x = fx0; x <= fx1; x++) { const c = g.at(x, y), t = (y - yB + 12) / 10;   // Spritzwasser, Feuchte
    if (c && n(x, y + 200) < t * 0.55) g.p(x, y, mix(c, '#1b1812', 0.3)); }
  /* Artist Runde 5 (Varonheim): Merkmale je Viertel, an der Fassade (vor dem Schild) und über dem Dach (nach dem Kreuz) */
  function quarterFront() {
    if (q === 'castle') {                                           // Burg: Zinnenkranz vor dem Dach, Ecktürmchen mit Kegelhelm, Scharten
      const St = ramp(mix(Wr.b, '#1a1820', 0.2)), Sl = ramp('#262c36');
      for (let x = fx0; x <= fx1; x++) { for (let y = yF - 2; y < yF + 2; y++) g.p(x, y, y === yF - 2 ? St.hi : St.b);
        if ((x - fx0) % 8 < 5) for (let y = Math.max(0, yF - 6); y < yF - 2; y++) g.p(x, y, y === yF - 6 ? St.hi : (x - fx0) % 8 === 4 ? St.dk : St.b); }
      if (b.w >= 6) for (const tx0 of [fx0, fx1 - 9]) {
        const t0 = Math.max(16, yF - 12);
        for (let y = t0; y < yB - 1; y++) for (let x = tx0; x < tx0 + 10; x++) g.p(x, y, x === tx0 ? St.hi : x >= tx0 + 8 ? St.dk : (y - t0) % 4 === 3 || ((x - tx0 + ((y - t0) >> 2) * 3) % 5 === 0) ? St.sh : St.b);
        for (const sy of [t0 + 6, yF + 10]) if (sy + 6 < yB - 4) { g.r(tx0 + 4, sy, 2, 6, '#08080a'); if (lit) g.p(tx0 + 4, sy + 3, '#b07a3a'); }
        for (let j = 0; j < 14; j++) { const hw = Math.round(6 * (j + 1) / 14), y = t0 - 14 + j; if (y < 0) continue;
          for (let i = -hw; i <= hw; i++) g.p(tx0 + 5 + i, y, i < 0 ? (j % 3 ? Sl.hi : Sl.b) : (j % 3 ? Sl.sh : Sl.dk)); }
        g.r(tx0 + 5, Math.max(0, t0 - 18), 1, 4, IRON);
      }
    }
    if (noble) {                                                    // Eckquader aus hellem Stein, eiserne Firstspitze
      for (let y = yF + 3; y < yB - 3; y++) { const row = ((y - yF - 3) / 4) | 0, w = row & 1 ? 3 : 5;
        for (const [x0, sg] of [[fx0, 1], [fx1, -1]]) for (let i = 0; i < w; i++) { const x = x0 + sg * i, yy = (y - yF - 3) % 4;
          g.p(x, y, yy === 3 ? '#2a2724' : i === 0 && sg > 0 ? '#9a948a' : i === w - 1 ? '#5e5952' : '#7d776d'); } }
      g.r(Math.round(cx) - 1, apexY - 9, 1, 6, IRON); g.p(Math.round(cx) - 2, apexY - 7, IRON); g.p(Math.round(cx), apexY - 7, IRON); g.p(Math.round(cx) - 1, apexY - 10, '#6a6660');
    }
    if (q === 'merchant') {                                         // gestreifte Markise über der ganzen Front, Ware darunter
      const AW = [['#7d3b2c', '#c9b98a'], ['#2f5034', '#c9b98a'], ['#2f4260', '#b8973e'], ['#6a5020', '#d9cfb0']][(qh(8) * 4) | 0], ay = yF + 3;
      for (let x = fx0 + 1; x < fx1; x++) { const c = ((x - fx0) >> 2) & 1 ? AW[1] : AW[0], C = ramp(c);
        for (let y = ay; y < ay + 5; y++) g.p(x, y, y === ay ? C.hi : y === ay + 4 ? C.sh : C.b);
        if ((x - fx0) % 4 < 2) g.p(x, ay + 5, C.sh);                                                     // gezackter Saum
        for (let d = 0; d < 3; d++) { const y = ay + 6 + d, c0 = g.at(x, y); if (c0) g.p(x, y, mix(c0, '#0c0a08', 0.45 - d * 0.13)); } }
      for (const x of [fx0 + 1, fx1 - 1]) for (let y = ay; y < ay + 10; y++) g.p(x, y, BEAM);           // Stangen
      const gx0 = b.door === 'E' || (b.door === 'S' && dx - fx0 < 24) ? fx1 - 16 : fx0 + 3;               // Körbe mit Ware an der Wand
      for (let i = 0; i < 2; i++) { const kx = gx0 + i * 7, ky = yB - 7, ware = ['#a04a2a', '#c9a84a', '#6a8a3a', '#8a5a8a'][(qh(9 + i) * 4) | 0];
        g.r(kx, ky + 2, 6, 4, '#6a4a2a'); g.r(kx, ky + 2, 6, 1, '#8a6a3a'); for (let k = 0; k < 5; k++) g.p(kx + (k % 3) * 2, ky + 1 - (k > 2 ? 1 : 0), k % 2 ? mix(ware, '#ffffff', 0.25) : ware); }
    }
    if (q === 'guild') {                                            // Zunftwappen im Giebel, Wimpel unter der Traufe, Zunftschild
      const GU = [['hammer', '#2f4260'], ['scales', '#5a1618'], ['tankard', '#2f5034'], ['swords', '#4a3458'], ['key', '#6a5020'], ['bread', '#6a3a1a']], [gi, gc] = GU[(qh(6) * GU.length) | 0];
      if (!T.sign) signAt(gi);
      if (GH > 22) { const sy = gy - 6, Gc = ramp(gc), I = ICON[gi];
        for (let j = 0; j < 12; j++) { const hw = j < 7 ? 5 : 11 - j; for (let i = -hw; i <= hw; i++) g.p(gx + i, sy + j, Math.abs(i) === hw || j === 0 ? '#b8973e' : i < 0 ? Gc.hi : Gc.b); }
        for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) if (I[j][i] !== '.') g.p(gx - 2 + i, sy + 2 + j, '#e8dcb8'); }
      for (let k = 0, x = fx0 + 5; x < fx1 - 6; x += 12, k++) { if (b.door === 'S' && x + 5 > dx - 2 && x < dx + dw + 2) continue;
        for (let j = 0; j < 7; j++) for (let i = 0; i < 5 - ((j * 5 / 7) | 0); i++) g.p(x + i, yF + 2 + j, k % 2 ? '#c9b98a' : gc); g.r(x - 1, yF + 1, 7, 1, IRON); }
    }
    if (q === 'slum') {                                             // angelehnter Bretterverschlag mit Pultdach, Lumpenvorhang
      const left = b.door === 'W' ? false : b.door === 'E' ? true : qh(3) < 0.5, lw = 15 + ((qh(4) * 6) | 0), lx0 = left ? fx0 : fx1 - lw + 1;
      const Pl = ramp(mix('#3e3228', '#2a231c', qh(5) * 0.6)), Rf = ramp(qh(13) < 0.5 ? '#8a7a5a' : '#6e7068');   /* Verschlag hebt sich ab: dunkle Bretter, helles Altholz- oder Blechdach */
      for (let i = 0; i < lw; i++) { const x = lx0 + i, outer = left ? i : lw - 1 - i, top = yB - 18 - Math.round(outer * 7 / lw);
        g.p(x, top - 1, '#1a1510');   /* Kontur über dem Pultdach */
        for (let y = top; y < top + 3; y++) g.p(x, y, y === top ? Rf.hi : y === top + 2 ? Rf.dk : (x + y) % 3 ? Rf.b : Rf.sh);
        for (let y = top + 3; y < yB - 1; y++) g.p(x, y, (x - lx0) % 4 === 0 ? Pl.dk : n(x, y + 40) > 0.9 ? Pl.hi : y === top + 3 ? Pl.sh : Pl.b); }
      const ox = lx0 + (lw >> 1) - 3;
      for (let y = yB - 13; y < yB - 1; y++) for (let x = ox; x < ox + 6; x++) g.p(x, y, y < yB - 11 ? '#120f0c' : (x + (y >> 1)) % 3 ? '#5a4a3a' : '#463a2e');
      if (qh(12) < 0.6) for (let x = fx0 + 6; x < fx1 - 6; x++) { const y = yF + 6 + Math.round(Math.sin((x - fx0) / (fx1 - fx0) * Math.PI) * 3);   // Wäscheleine
        g.p(x, y, '#2a241e'); if ((x * 7) % 11 < 4) for (let k = 1; k < 5; k++) g.p(x, y + k, ['#8a7a64', '#6a4a3a', '#7a7a6a'][(x >> 2) % 3]); }
    }
    if (q === 'craft' && !T.forge && !T.stalls) {                  // Fässer und Kisten an der Wand
      const bx = b.door === 'W' || (b.door !== 'E' && qh(7) < 0.5) ? fx1 - 21 : fx0 + 2, Bf = ramp('#6a4a2c'), Kc = ramp('#7a5a35');
      for (let k = 0; k < 2; k++) { const x0 = bx + k * 7, y0 = yB - 11;
        for (let y = y0; y < yB - 1; y++) for (let x = x0; x < x0 + 6; x++) { const e = x === x0 || x === x0 + 5;
          g.p(x, y, y - y0 === 2 || y - y0 === 7 ? IRON : y === y0 ? Bf.hi : e ? Bf.dk : (x - x0) % 2 ? Bf.b : Bf.sh); } }
      const kx = bx + 14; for (let y = yB - 8; y < yB - 1; y++) for (let x = kx; x < kx + 7; x++)
        g.p(x, y, y === yB - 8 ? Kc.hi : x === kx || x === kx + 6 || y === yB - 2 ? Kc.dk : x - kx === y - yB + 8 ? Kc.sh : Kc.b);
    }
  }
  function quarterTop() {
    if (!(q === 'temple' && b.type === 'chapel')) return;           // Tempel: Turm mit Spitzhelm aus Schiefer über dem Giebel
    const tx = Math.round(cx), tw = 8, base = apexY + 8, top = Math.max(32, apexY - 16), St = ramp(mix(Wr.b, '#2a2830', 0.15)), Sl = ramp('#2c3440');
    for (let y = top; y < base; y++) for (let x = tx - tw; x <= tx + tw; x++) { const row = ((y - top) / 3) | 0, xo = (x - tx + 40 + (row & 1) * 2) % 5;
      g.p(x, y, x === tx - tw ? St.hi : x >= tx + tw - 1 ? St.dk : (y - top) % 3 === 2 || xo === 0 ? St.sh : St.b); }
    for (const ox of [-5, 2]) { g.r(tx + ox, top + 5, 3, 8, '#0e0c10'); g.p(tx + ox + 1, top + 4, '#0e0c10'); if (lit) g.r(tx + ox, top + 9, 3, 3, '#b07a3a'); }   // Schallarkaden
    for (let y = base; y < base + 3; y++) for (let x = tx - tw; x <= tx + tw; x++) { const c0 = g.at(x, y); if (c0) g.p(x, y, mix(c0, '#0c0a08', 0.4)); }
    g.r(tx - tw - 1, top - 2, tw * 2 + 3, 2, St.dk); g.r(tx - tw - 1, top - 2, tw * 2 + 3, 1, St.hi);   // Gesims
    const sh = Math.min(30, top - 10), tip = top - 2 - sh;
    for (let j = 0; j < sh; j++) { const hw = Math.round((tw + 1) * (j + 1) / sh), y = tip + j;
      for (let i = -hw; i <= hw; i++) g.p(tx + i, y, i < 0 ? (j % 3 === 0 ? Sl.b : Sl.hi) : i === 0 ? Sl.b : (j % 3 === 0 ? Sl.dk : Sl.sh)); }
    g.r(tx, tip - 8, 1, 8, '#b8973e'); g.r(tx - 2, tip - 6, 5, 1, '#b8973e'); g.p(tx, tip - 8, '#e8d8a0');   // goldenes Kreuz
  }
  if (wear) weather(g, { b, wear, n, W, yF, yB, fx0, fx1, cx, halfW, apexY, GH, inGable, R, Wr, Br, wins, dx, dy, dw, dh, wallKind, roofKind, door: b.door });
  return toCanvas(g);
}

// Verfall: Risse, abgeplatzter Putz, vernagelte Fenster, fehlende Dachdeckung; bei 2 ein eingebrochenes Dach mit
// offenen Sparren, Brandspuren, vernagelte Tür, Schutt am Sockel.
function weather(g, o) {
  const { b, wear, n, W, yF, yB, fx0, fx1, cx, halfW, apexY, inGable, R, Wr, Br, wins, dx, dy, dw, dh, wallKind } = o;
  const plank = (x0, y0, w, h) => {                                 // Bretter kreuzweise über eine Öffnung genagelt
    for (let k = 0; k < w; k++) { const y1 = y0 + Math.round(k * (h - 1) / Math.max(1, w - 1)), y2 = y0 + h - 1 - Math.round(k * (h - 1) / Math.max(1, w - 1));
      g.p(x0 + k, y1, '#7a6040'); g.p(x0 + k, y1 + 1, '#4a3826'); g.p(x0 + k, y2, '#6a5236'); }
    g.p(x0, y0, '#2a2622'); g.p(x0 + w - 1, y0, '#2a2622');
  };
  // Risse in der Wand: kurze, geknickte Linien
  for (let c = 0; c < wear + 1; c++) {
    let x = fx0 + 4 + Math.round(n(c, 31) * (fx1 - fx0 - 8)), y = yF + 3 + Math.round(n(c, 32) * (yB - yF - 10));
    for (let k = 0; k < 7 + wear * 3; k++) { if (x > fx0 && x < fx1 && y < yB - 2) g.p(x, y, mix(Wr.sh, '#16110c', 0.6)); y++; x += n(k, c + 40) > 0.6 ? 1 : n(k, c + 41) > 0.7 ? -1 : 0; }
  }
  // Abgeplatzter Putz: darunter Lehm/Ziegel
  if (wallKind === 'plaster' || wallKind === 'timber' || wallKind === 'palestone') for (let c = 0; c < wear; c++) {
    const px = fx0 + 3 + Math.round(n(c, 51) * (fx1 - fx0 - 12)), py = yF + 4 + Math.round(n(c, 52) * Math.max(1, yB - yF - 14));
    for (let y = py; y < py + 5; y++) for (let x = px; x < px + 8; x++) {
      const d = Math.abs(x - px - 3.5) / 4 + Math.abs(y - py - 2) / 3; if (d > 1 + n(x, y) * 0.4) continue;
      g.p(x, y, (y - py) % 2 === 1 || (x + ((y - py) >> 1) * 2) % 4 === 0 ? '#5a3e30' : '#7c5440');
    }
  }
  // Fenster: eins (bzw. alle bei 2) vernagelt oder eingeschlagen
  wins.forEach(([x0, y0], i) => {
    if (wear === 1 && i !== ((n(9, 9) * wins.length) | 0)) return;
    if (wear === 2 && n(i, 60) < 0.4) {                             // eingeschlagen: schwarz mit Scherbenrand
      g.r(x0, y0, 6, 8, '#0b0a09'); g.p(x0, y0, '#6a7480'); g.p(x0 + 5, y0 + 1, '#6a7480'); g.p(x0 + 1, y0 + 7, '#5a646e');
    } else plank(x0 - 1, y0, 8, 8);
    if (wear === 2) for (let y = y0 - 6; y < y0; y++) for (let x = x0 - 1; x < x0 + 7; x++)   // Rußfahne über dem Fenster
      if (g.at(x, y) && n(x, y + 70) < 0.75 - (y0 - y) * 0.1) g.p(x, y, mix(g.at(x, y), '#15110d', 0.55));
  });
  if (wear === 2 && o.door === 'S') plank(dx - 1, dy + 2, dw + 2, dh - 4);   // Tür vernagelt
  // Dach: fehlende Deckung (Löcher mit Latten darunter)
  const hole = (hx, hy, rw, rh) => {                                // eingebrochene Deckung: ausgefranster Rand, offene Sparren
    const top = [], bot = [];
    for (let x = hx - rw; x <= hx + rw; x++) {                       // je Spalte eigener, gezackter Ober-/Unterrand
      const env = Math.sqrt(Math.max(0, 1 - ((x - hx) / (rw + 0.5)) ** 2));
      top[x] = Math.round(hy - rh * env * (0.55 + n(x, 91) * 0.45)); bot[x] = Math.round(hy + rh * env * (0.45 + n(x, 92) * 0.55));
    }
    const inside = (x, y) => top[x] != null && y >= top[x] && y <= bot[x] && bot[x] > top[x];
    for (let x = hx - rw; x <= hx + rw; x++) for (let y = top[x] - 1; y <= bot[x] + 1; y++) {
      if (y < 1 || y >= yF - 1 || x < 1 || x >= W - 1 || inGable(x, y)) continue;
      if (!inside(x, y)) { if (n(x, y + 93) > 0.35 && (inside(x, y + 1) || inside(x, y - 1))) g.p(x, y, R.dk); continue; }   // Bruchkante
      g.p(x, y, n(x, y + 94) > 0.9 ? '#2a211a' : '#0f0c0a');           // Dunkel im Dachstuhl
    }
    const beams = rh > 3 ? [hy - Math.round(rh * 0.4), hy + Math.round(rh * 0.35)] : [hy];
    beams.forEach((by, i) => {                                         // Latten quer, eine gebrochen und abgesackt
      for (let x = hx - rw; x <= hx + rw; x++) {
        if (!inside(x, by) || inGable(x, by)) continue;
        const broken = i === 0 && rw > 5 && x > hx + rw * 0.2, yy = broken ? by + Math.round((x - hx - rw * 0.2) * 0.5) : by;
        if (broken && !inside(x, yy)) continue;
        g.p(x, yy, '#6a5238'); g.p(x, yy + 1, '#3a2c1e');
      }
    });
    if (rw > 5) { const sx = hx - Math.round(rw * 0.35);                 // ein Sparren vom First zur Traufe
      for (let x = hx - rw; x <= hx + rw; x++) for (let y = top[x]; y <= bot[x]; y++) if (Math.abs(x - sx) < 1 && !inGable(x, y)) { g.p(x, y, '#5a4430'); g.p(x + 1, y, '#2e241a'); } }
  };
  const side = n(7, 7) > 0.5 ? 1 : -1;
  if (wear === 1) for (let c = 0; c < 3; c++) hole(Math.round(cx + (c % 2 ? side : -side) * halfW * (0.35 + n(c, 80) * 0.45)), 3 + Math.round(n(c, 81) * Math.max(1, yF - 10)), 2, 1);
  else {
    hole(Math.round(cx + side * halfW * 0.52), Math.round(Math.min(apexY, yF - 8) * 0.5) + 4, Math.round(halfW * 0.4), Math.max(5, Math.round(yF * 0.26)));
    hole(Math.round(cx - side * halfW * 0.6), Math.round(yF * 0.75), 3, 2);
    for (let x = fx0; x <= fx1; x++) if (n(x, 95) > 0.55) {        // Schutt am Sockel
      g.p(x, yB - 1, n(x, 96) > 0.5 ? '#5a554c' : '#3e3a33'); if (n(x, 97) > 0.7) g.p(x, yB - 2, '#6a655a'); }
    for (let x = fx0; x <= fx1; x += 1) if (n(x, 98) > 0.82) for (let k = 0; k < 4 + (n(x, 99) * 6 | 0); k++) g.p(x, yF + 1 + k, k % 2 ? '#3a4a2a' : '#4a5a32');   // Ranken
  }
}

// Innenausstattung je Funktion: Möbel, die zur Nutzung passen (Welt-Props, von world.js platziert).
// Koordinaten relativ zur Innenfläche (x+1..x+w-2, y+1..y+h-2). Die Türachse bleibt frei.
export const FURNISH = {
  tavern:   [['hearth', 0, 0], ['table', 2, 1], ['bench', 2, 2], ['table', -2, 1], ['bench', -2, 2], ['counter', -1, 0], ['cask_rack', -1, -1], ['bed', 0, -1], ['bed', 1, -1], ['shelf', -3, 0], ['barrel', -2, -1]],   // MP2 §76: Schlafraum, Lager
  smithy:   [['forge', 0, 0], ['workbench_int', 2, 0], ['weapon_rack', -1, 0], ['barrel', -1, 1]],
  healer:   [['bed', 0, 1], ['bed', 0, 2], ['shelf', 2, 0], ['table', -1, 0]],
  hall:     [['desk', 1, 1], ['shelf', 0, 0], ['shelf', -1, 0], ['bench', -1, 2]],
  kontor:   [['counter', 1, 0], ['crate_stack', 0, 0], ['crate_stack', -1, 0], ['sack', 0, 2], ['sack', -1, 2]],
  barracks: [['bunk', 0, 0], ['bunk', 0, 2], ['weapon_rack', -1, 0], ['table', -1, 2]],
  chapel:   [['altar_small', 1, 0], ['bench', 1, 2], ['bench', -2, 2], ['candles', 0, 0]],
  merc:     [['table', 1, 1], ['bench', 1, 2], ['weapon_rack', -1, 0], ['hearth', 0, 0]],
  house:    [['bed', 0, 0], ['table', -1, 1], ['hearth', -1, 0], ['shelf', 1, 0]],
  cottage:  [['bed', 0, 0], ['hearth', -1, 0], ['sack', 0, 1]],
  manor:    [['bed', 0, 0], ['desk', -1, 0], ['shelf', 1, 0], ['hearth', 2, 0], ['table', 1, 2], ['bench', -1, 2]],
  bakery:   [['hearth', 0, 0], ['table', -1, 1], ['sack', -1, 0], ['shelf', 1, 0], ['sack', 0, 2]],
  barn:     [['hay', 0, 0], ['hay', 1, 0], ['hay', -1, 0], ['hay', 0, 1], ['sack', -1, 2]],
  stable:   [['hay', 0, 0], ['hay', -1, 0], ['barrel', 1, 0], ['hay', -1, 2]],
  store:    [['crate_stack', 0, 0], ['crate_stack', -1, 0], ['cask_rack', 1, 0], ['sack', 0, 2], ['barrel', -1, 2], ['crate_stack', -2, 0]],
  fisher:   [['bed', 0, 0], ['barrel', -1, 0], ['table', -1, 1]],
};
