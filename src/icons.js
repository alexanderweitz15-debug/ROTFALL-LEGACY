/* ROTFALL — UI-Symbole (Navigation, Rohstoffe, Leisten, Wetter, Protokoll).
   Reine Pixelraster 16×16, im Code gezeichnet; keine Bilddateien.
   Schnittstelle (vom Engineer genutzt, nicht ändern):
     iconURL(key, scale = 2)  liefert eine data:-URL (PNG), je key+scale gecacht; unbekannter key liefert ''.
     ICON_KEYS                alle gültigen Schlüssel.
   Aufbau: ein Symbol besteht aus Ebenen [raster, x, y, palette?, ohneKontur?].
   Jede Ebene bekommt automatisch eine 1-px-Kontur (dunkles Eisen) rund um ihre Pixel;
   spätere Ebenen überdecken frühere samt Kontur, so bleiben Überlappungen lesbar.
   Licht fällt von links oben: helle Töne links/oben, dunkle rechts/unten. */

const N = 16;
const KONTUR = '#140e0b';

/* Grundpalette aus HUD und Sprites (style.css: iron, bone, gold, blood, rust). */
const PAL = {
  o: '#140e0b',
  /* Eisen */ i: '#2e2c30', I: '#4a4850', j: '#74727a', J: '#a8a6ae', K: '#dcdae0',
  /* Knochen */ b: '#8a7e68', B: '#c8bea6', W: '#f0e8d4',
  /* Pergament */ p: '#9a7e50', P: '#d2b884', Q: '#eedcae',
  /* Gold */ g: '#7a5a1c', G: '#bd9433', Y: '#ecc860',
  /* Blut */ r: '#5a1412', R: '#9a2620', E: '#d04a3a',
  /* Holz/Leder */ w: '#4a2e1a', x: '#7a4e2a', X: '#a87442',
  /* Moos */ l: '#24401c', L: '#3e6a2e', k: '#6a9a44',
  /* Mana */ m: '#1c3456', M: '#2f5a90', n: '#7aa8d8',
  /* Stein */ s: '#4a4640', S: '#7a756c', T: '#aaa498',
  /* Wolke */ c: '#3e3e48', C: '#74747e', D: '#b4b4be',
  /* Magie */ v: '#3a1e5a', V: '#6b4a9d', U: '#b890e0',
  /* Sonne */ y: '#c8781e', A: '#fff2b0',
  Z: '#ffffff',
};

/* ---------- Grundformen ---------- */
const R = {
  helm: [
    '................',
    '......IIII......',
    '....IjJJjjII....',
    '...IjJJjjjjiI...',
    '...IjJjjjjjiI...',
    '..IjJjjjjjjjiI..',
    '..IjooooooooiI..',
    '..IjjjjoojjjiI..',
    '..IjjjjoojjjiI..',
    '..IjjjjoojjiiI..',
    '...IjjjoojjiI...',
    '...IIiiiiiiII...',
    '..gGGGGGGGGGGg..',
    '.gGYGGGGGGGGGGg.',
    '.gggggggggggggg.',
    '................'],
  tasche: [
    '................',
    '.....wxxxxw.....',
    '.....x....x.....',
    '..wXXXXXXXXXXw..',
    '..xXXXXXXXXXXx..',
    '..xXxxxxxxxxXx..',
    '..xxxxxGGxxxxx..',
    '..wwwwwgYwwwww..',
    '..xXxxxggxxxxw..',
    '..xXxxxxxxxxxw..',
    '..xXxxxxxxxxxw..',
    '..xxxxxxxxxxxw..',
    '..xxxxxxxxxxww..',
    '..wwwwwwwwwwww..',
    '................',
    '................'],
  gruppe: [
    '................',
    '................',
    '...SS......SS...',
    '..STSS....STSS..',
    '..SSSSoBBoSSSS..',
    '..SSSoBWBBoSSs..',
    '...SSoBBBBoSs...',
    '..sSSSoBBoSSSs..',
    '.sSSSoPPPPoSSSs.',
    '.sSSoPQPPPPoSSs.',
    '.sSSoPPPPPPoSSs.',
    '.sssoPPPPPposss.',
    '.sssoPPPPPposss.',
    '................',
    '................',
    '................'],
  hammer: [
    '................',
    '................',
    '..IJKKJJJJJJJI..',
    '..IJjjjjjjjjiI..',
    '..IjjjjjjjjiiI..',
    '..IiiiiiiiiiiI..',
    '......gGYg......',
    '.......Xx.......',
    '.......Xx.......',
    '.......Xx.......',
    '.......Xx.......',
    '.......Xx.......',
    '.......Xx.......',
    '.......Xx.......',
    '.......xw.......',
    '................'],
  karte: [
    '................',
    '.xXXXXXXXXXXXXx.',
    '..pPPPPPPPPPPp..',
    '..pPQQQPPPPPPp..',
    '..pPQPPPPPEPEp..',
    '..pPPPPbPPPEPp..',
    '..pPPPbPPPEPEp..',
    '..pPPbPPPPPPPp..',
    '..pPPPbPPPPPPp..',
    '..pPPPPbbPPPPp..',
    '..pPPPPPPbPPPp..',
    '..pPPPPPPPPPPp..',
    '..pppppppppppp..',
    '.xwwwwwwwwwwwwx.',
    '................',
    '................'],
  rolle: [
    '................',
    '..pPPPPPPPPPPp..',
    '..pppppppppppp..',
    '...PQQQQQQQQP...',
    '...PQbbbbbbQP...',
    '...PQQQQQQQQP...',
    '...PQbbbbbQQP...',
    '...PQQQQQQQQP...',
    '...PQbbbbbbQP...',
    '...PQQQQQRRQP...',
    '...PQQQQREERP...',
    '...PQQQQRERRP...',
    '..pppppppRRppp..',
    '..pPPPPPPrRPPp..',
    '.........r.r....',
    '................'],
  flamme: [
    '................',
    '.......v........',
    '......vV........',
    '......VUv.......',
    '.....vVUVv...v..',
    '....vVUUUVv.vV..',
    '...vVUUZUUVvVV..',
    '...vVUZZZUUVVv..',
    '..vVUUZZZZUUVv..',
    '..vVUZZZZZZUVv..',
    '..vVUZZZZZZUVv..',
    '..vVUUZZZZUUVv..',
    '...vVUUUUUUVv...',
    '....vvVVVVvv....',
    '................',
    '................'],
  buch: [
    '................',
    '...GrrrrrrrrG...',
    '...rRERRRRRRrP..',
    '...rERRRRRRRrP..',
    '...rRRRGGRRRrP..',
    '...rRRGYYGRRrP..',
    '...rRRGYYGRRrP..',
    '...rRRRGGRRRrP..',
    '...rRRRRRRRRrP..',
    '...rRRRRRRRRrP..',
    '...rRRRRRRRRrP..',
    '...rRRRRRRRRrP..',
    '...rRRRRRRRRrP..',
    '...GrrrrrrrrGP..',
    '....PPPPPPPPPP..',
    '................'],
  zahnrad: [
    '................',
    '.......JJ.......',
    '...JJ.JJjj.ij...',
    '...JJJJjjjjii...',
    '....JJjjjjji....',
    '..JJJjjiiijjji..',
    '.JJJjjioooijjjj.',
    '..JJjjiooojjii..',
    '..Jjjjiooojjii..',
    '.Jjjjjjiiijjiii.',
    '..jjjjjjjjjiii..',
    '....jjjjjiii....',
    '...jjjjjiiiii...',
    '...ii.jjii.ii...',
    '.......ii.......',
    '................'],
  stein: [
    '................',
    '................',
    '................',
    '................',
    '......TTTT......',
    '....TTSSSSs.....',
    '...TSSSSSSSs....',
    '..TSSSTSSSSSs...',
    '..TSSTSSSSSSss..',
    '.TSSSSSSSSsSss..',
    '.SSSSSSSSsSsss..',
    '.sSSSSSssSssss..',
    '..ssssssssssss..',
    '................',
    '................',
    '................'],
  kraut: [
    '................',
    '.......kk.......',
    '......kkLl......',
    '......kLLl......',
    '..kk...kLl..kk..',
    '.kkLk..xl..kkLl.',
    '.kLLLk.x..kLLLl.',
    '..kLLLkx.kLLLl..',
    '...kLLLxkLLl....',
    '....llLxLll.....',
    '.......x........',
    '.......x........',
    '......xw........',
    '......w.........',
    '................',
    '................'],
  brot: [
    '................',
    '................',
    '................',
    '................',
    '.....XXXXXX.....',
    '...XXPXXXPXXX...',
    '..XXXXPXXXPXXX..',
    '.XxXXXXPXXXPXXx.',
    '.xxXXXXXPXXXXxx.',
    '.xxxxxxxxxxxxxw.',
    '..wxxxxxxxxxxw..',
    '...wwwwwwwwww...',
    '................',
    '................',
    '................',
    '................'],
  muenzen: [
    '................',
    '................',
    '.....GYYYYG.....',
    '....GYYZYYYG....',
    '....gGYYYYGg....',
    '....gggggggg....',
    '....GYYYYYYG....',
    '....gggggggg....',
    '...GYYYYYYG.....',
    '...gggggggg.....',
    '....GYYYYYYG....',
    '....gggggggg....',
    '....GYYYYYYG....',
    '....gggggggg....',
    '................',
    '................'],
  herz: [
    '................',
    '................',
    '................',
    '...RRR....RRR...',
    '..REERR..RRRRr..',
    '..REZRRRRRRRRr..',
    '..RERRRRRRRRRr..',
    '..RRRRRRRRRRrr..',
    '...RRRRRRRRrr...',
    '....RRRRRRrr....',
    '.....RRRRrr.....',
    '......RRrr......',
    '.......rr.......',
    '................',
    '................',
    '................'],
  stiefel: [
    '................',
    '................',
    '.....wxxxw......',
    '.....xXXxw......',
    '.kkk.xXxxw......',
    '.....xXxxw......',
    'kkkk.xXxxw......',
    '.....xXxxxw.....',
    '.kkk.xXxxxxww...',
    '.....xXxxxxxxw..',
    '.....xxxxxxxxxw.',
    '.....wwwwwwwwww.',
    '................',
    '................',
    '................',
    '................'],
  stern: [
    '................',
    '.......YG.......',
    '.......YG.......',
    '......YYGg......',
    '......YZGg......',
    '.....YYYGGg.....',
    '..YYYYYZYGGGgg..',
    '.YYYYYZZGGGGGgg.',
    '..GGGGGGGGGggg..',
    '.....GGGGgg.....',
    '......GGgg......',
    '......GGgg......',
    '.......Gg.......',
    '.......gg.......',
    '................',
    '................'],
  tropfen: [
    '................',
    '.......n........',
    '.......nM.......',
    '......nnMm......',
    '......nMMm......',
    '.....nnMMMm.....',
    '....nZnMMMMm....',
    '....nZMMMMMm....',
    '...nnMMMMMMMm...',
    '...nMMMMMMMMm...',
    '...nMMMMMMMmm...',
    '...mMMMMMMMmm...',
    '....mMMMMMmm....',
    '.....mmmmmm.....',
    '................',
    '................'],
  sonne: [
    '................',
    '.......YY.......',
    '..Y....yy....Y..',
    '...Y........Y...',
    '.....YYYYYY.....',
    '....YAAAYYYy....',
    '....YAAYYYYy....',
    'YY..YAYYYYYy..yy',
    'yy..YYYYYYYy..yy',
    '....YYYYYYyy....',
    '....yYYYYyyy....',
    '.....yyyyyy.....',
    '...y........y...',
    '..y....yy....y..',
    '.......yy.......',
    '................'],
  mond: [
    '................',
    '......BBBB......',
    '....BWWWB.......',
    '...BWWWB........',
    '..BWWWB.........',
    '..BWWB....W.....',
    '.BWWWB..........',
    '.BWWWB..........',
    '.BWWWB..........',
    '.BWWWb.......D..',
    '..BWWBb.........',
    '..bBWWBb........',
    '...bBWWWBb......',
    '....bbBBBBb.....',
    '......bbbb......',
    '................'],
  warnung: [
    '................',
    '.......GG.......',
    '......GYYG......',
    '......GYYG......',
    '.....GYYYYG.....',
    '.....GYooYG.....',
    '....GYYooYYG....',
    '....GYYooYYG....',
    '...GYYYooYYYG...',
    '...GYYYooYYYG...',
    '..GYYYYYYYYYYG..',
    '..GYYYYooYYYYG..',
    '.GYYYYYooYYYYYG.',
    '.GYYYYYYYYYYYYG.',
    '.gggggggggggggg.',
    '................'],
  schwerter: [
    '................',
    '.KJ..........JK.',
    '..KJ........JK..',
    '...KJ......JK...',
    '....KJ....JK....',
    '.....KJ..JK.....',
    '......KJJK......',
    '.......JJ.......',
    '......JKKJ......',
    '....GJK..KJG....',
    '...GGG....GGG...',
    '....x......x....',
    '...x........x...',
    '..Y..........Y..',
    '................',
    '................'],
  turm: [
    '................',
    '....TT.TT.TT....',
    '....TTSTTSTS....',
    '....TSSSSSSs....',
    '.....TSSSSs.....',
    '.....TSooSs.....',
    '.....TSooSs.....',
    '.....TSSSSs.....',
    '.....TSsSSs.....',
    '.....TSSSSs.....',
    '....TSSSsSSs....',
    '....TSSooSSs....',
    '...TSSSooSSSs...',
    '..kLLLLLLLLLLl..',
    '................',
    '................'],
  banner: [
    '................',
    '..XXXXXXXXXXXX..',
    '...RRRRRRRRRR...',
    '...RERRRRRRRr...',
    '...RERRGGRRRr...',
    '...RERGYYGRRr...',
    '...RERGYYGRRr...',
    '...RERRGGRRRr...',
    '...RERRRRRRRr...',
    '...RERRRRRRRr...',
    '...RRRRRRRRRr...',
    '...RRRRrrRRRr...',
    '...RRRr..rRRr...',
    '...RRr....rRr...',
    '...Rr......rr...',
    '................'],
  beutel: [
    '................',
    '................',
    '................',
    '......wxxw......',
    '.......ww.......',
    '......xXXx......',
    '.....xXXXXx.....',
    '....xXXXXXXx....',
    '...xXXXXXXXxx...',
    '...xXXXGGXXxx...',
    '...xXXGYYGXxx...',
    '...xXXXGGXxxx...',
    '...wxxxxxxxxw...',
    '....wwwwwwww....',
    '................',
    '................'],
  schaedel: [
    '................',
    '................',
    '................',
    '.....BWWWWB.....',
    '....BWWWWWWB....',
    '...BWWWWWWWWb...',
    '...BWWWWWWWBb...',
    '...BWooWWooBb...',
    '...BWooWWooBb...',
    '...bBWWoWWBbb...',
    '....bBBBBBBb....',
    '....bWoWoWob....',
    '.....bbbbbb.....',
    '................',
    '................',
    '................'],
  /* Wetterteile (kleiner als 16, werden versetzt gestempelt) */
  wolke: [
    '......DDD.....',
    '..DD.DDDDDC...',
    '.DDDDDDDDDDC..',
    'DDDDDDDDDDDCCC',
    'DDDDDDDDDDCCCC',
    'CCDCCCCCCCCCCc',
    '.cccccccccccc.'],
  woelkchen: [
    '...DDD...',
    '.DDDDDC..',
    'DDDDDDDCC',
    'CCCCCCCCc',
    '.ccccccc.'],
  regen: [
    '.n...n...n..',
    'n...n...n...',
    '............',
    '..n...n...n.',
    '.n...n...n..'],
  flocke: [
    '.W.',
    'WDW',
    '.W.'],
  stamm: [
    '.PPPxxxxxxxxw',
    'PXXPXXXXXXXXw',
    'PXwXxxxxxxxxw',
    'PXXPxxwxxxwxw',
    '.PPPwwwwwwwww'],
  barren2: [
    '.JKKKKKKJ.',
    'JJKKKKKKJJ',
    'jjjjjjjjjj',
    'jJjjjjjjji',
    'iiiiiiiiii'],
  blitz: [
    '...AYY',
    '..AYY.',
    '.AYY..',
    'AYYYYY',
    '..YYY.',
    '.YYY..',
    '.YY...',
    'YY....',
    'Y.....'],
  nebel: [
    '...DDDDDDDDD..',
    '...CCCCCCCCC..',
    '..............',
    '..............',
    'DDDDDD..DDDDDD',
    'CCCCCC..CCCCCC',
    '..............',
    '..............',
    '.....DDDDDDDDD',
    '.....CCCCCCCCC'],
};

/* Paletten-Varianten */
const DUNKEL = { D: '#74747e', C: '#4e4e58', c: '#30303a' };
const GEWITTER = { D: '#5a5a66', C: '#3e3e48', c: '#26262e' };
const BLUTWOLKE = { D: '#8a4a44', C: '#5e2a26', c: '#3a1614' };
const BLUTREGEN = { n: '#d04a3a' };
const HITZE = { Y: '#e8883a', A: '#ffd890', y: '#a8321a' };
const AUSDAUER = { k: '#b8a040' };
const BROT = { X: '#c89050', P: '#f0d090', x: '#9a6630', w: '#5e3a1c' };
const EISEN_BARREN = { K: '#c8ccd6', J: '#9298a4', j: '#646a76', i: '#3a3e48' };

/* Symbol = Liste von Ebenen [rasterName, x, y, palette, ohneKontur] */
const ICONS = {
  nav_char: [['helm', 0, 0]],
  nav_inv: [['tasche', 0, 0]],
  nav_party: [['gruppe', 0, 0]],
  nav_build: [['hammer', 0, 0]],
  nav_map: [['karte', 0, 0]],
  nav_quest: [['rolle', 0, 0]],
  nav_powers: [['flamme', 0, 0]],
  nav_codex: [['buch', 0, 0]],
  nav_options: [['zahnrad', 0, 0]],
  res_wood: [['stamm', 2, 4], ['stamm', 1, 9]],
  res_stone: [['stein', 0, 0]],
  res_iron: [['barren2', 5, 4, EISEN_BARREN], ['barren2', 1, 9, EISEN_BARREN]],
  res_herb: [['kraut', 0, 0]],
  res_food: [['brot', 0, 0, BROT]],
  res_gold: [['muenzen', 0, 0]],
  bar_hp: [['herz', 0, 0]],
  bar_st: [['stiefel', 0, 0, AUSDAUER]],
  bar_xp: [['stern', 0, 0]],
  bar_mana: [['tropfen', 0, 0]],
  w_clear: [['sonne', 0, 0]],
  w_cloudy: [['woelkchen', 6, 2, DUNKEL], ['wolke', 1, 6]],
  w_rain: [['wolke', 1, 2, DUNKEL], ['regen', 2, 10, null, true]],
  w_snow: [['wolke', 1, 2], ['flocke', 2, 11], ['flocke', 7, 13], ['flocke', 12, 11]],
  w_storm: [['wolke', 1, 1, GEWITTER], ['blitz', 7, 7]],
  w_fog: [['nebel', 1, 3]],
  w_heat: [['sonne', 0, 0, HITZE]],
  w_bloodrain: [['wolke', 1, 2, BLUTWOLKE], ['regen', 2, 10, BLUTREGEN, true]],
  sun: [['sonne', 0, 0]],
  moon: [['mond', 0, 0]],
  warn: [['warnung', 0, 0]],
  log_combat: [['schwerter', 0, 0]],
  log_party: [['gruppe', 0, 0]],
  log_world: [['turm', 0, 0]],
  log_quest: [['rolle', 0, 0]],
  log_faction: [['banner', 0, 0]],
  log_economy: [['beutel', 0, 0]],
  log_death: [['schaedel', 0, 0]],
};

export const ICON_KEYS = Object.keys(ICONS);

/* Baut das 16×16-Farbgitter eines Symbols (Array von Farbstrings oder null). */
function buildGrid(key) {
  const layers = ICONS[key];
  const grid = new Array(N * N).fill(null);
  for (const [name, ox, oy, over, noOutline] of layers) {
    const rows = R[name];
    if (!rows) continue;
    const h = rows.length, w = rows[0].length;
    const pal = over ? Object.assign({}, PAL, over) : PAL;
    /* Ebene mit 1 px Rand rendern, damit die Kontur Platz hat */
    const lw = w + 2, lh = h + 2;
    const layer = new Array(lw * lh).fill(null);
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        if (ch && ch !== '.') layer[(y + 1) * lw + x + 1] = pal[ch] || KONTUR;
      }
    }
    if (!noOutline) {
      const filled = layer.map(Boolean);
      for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
        if (filled[y * lw + x]) continue;
        if ((x > 0 && filled[y * lw + x - 1]) || (x < lw - 1 && filled[y * lw + x + 1]) ||
            (y > 0 && filled[(y - 1) * lw + x]) || (y < lh - 1 && filled[(y + 1) * lw + x])) layer[y * lw + x] = KONTUR;
      }
    }
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
      const col = layer[y * lw + x];
      if (!col) continue;
      const gx = ox - 1 + x, gy = oy - 1 + y;
      if (gx < 0 || gy < 0 || gx >= N || gy >= N) continue;
      grid[gy * N + gx] = col;
    }
  }
  return grid;
}

const urlCache = new Map();
let cv = null, cx = null;

export function iconURL(key, scale = 2) {
  if (!Object.prototype.hasOwnProperty.call(ICONS, key)) return '';
  const s = Math.max(1, Math.min(8, Math.round(+scale || 2)));
  const ck = key + '@' + s;
  const hit = urlCache.get(ck);
  if (hit !== undefined) return hit;
  try {
    if (typeof document === 'undefined') return '';
    if (!cv) { cv = document.createElement('canvas'); cx = cv.getContext('2d'); }
    cv.width = N * s; cv.height = N * s;
    cx.clearRect(0, 0, cv.width, cv.height);
    const grid = buildGrid(key);
    for (let i = 0; i < grid.length; i++) {
      const col = grid[i];
      if (!col) continue;
      cx.fillStyle = col;
      cx.fillRect((i % N) * s, ((i / N) | 0) * s, s, s);
    }
    const url = cv.toDataURL('image/png');
    urlCache.set(ck, url);
    return url;
  } catch (e) {
    return '';
  }
}
