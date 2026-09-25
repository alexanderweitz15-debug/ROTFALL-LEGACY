// Weltgenerierung: Greenmark-Grenzland (128x128) und die Verlassene Grube.
import { S, rnd, ri, pick, chance, seedRng, uid } from './state.js';
import { FURNISH, wearOf } from './buildings.js';

export const TS = 32;                // Kachelgröße
export const T = { GRASS:0, DIRT:1, ROAD:2, WATER:3, MARSH:4, STONE:5, PLANK:6, ROCK:7, WALL:8, SAND:9, DFLOOR:10, DWALL:11, ASH:12, FIELD:13 };
export const SOLID = new Set([T.WATER, T.ROCK, T.WALL, T.DWALL]);
export const SLOW = { [T.MARSH]:0.55, [T.WATER]:0.4, [T.SAND]:0.85 };

export const MAPS = {};              // {world:{w,h,tiles}, mine:{...}}
// Weltmaßstab (Session 5, Nutzerwunsch: größere Karte, mehr Abstand). Die Oberwelt wird im Entwurfsmaßstab (512×512) erzeugt —
// alle handgesetzten Orte, Straßen, Szenen stehen so im Code — und dann um WS hochgerechnet (768×768). Häuser werden erst danach
// im Weltmaßstab gebaut, damit sie nicht verzerren. wT: Entwurfskachel → Weltkachel (Mitte), dT: Weltkachel → Entwurfskachel.
export const WS = 1.5;
export const wT = v => Math.floor((v + 0.5) * WS);
export const dT = v => Math.floor(v / WS);
const wRect = ([x0, y0, x1, y1]) => [Math.ceil(x0 * WS), Math.ceil(y0 * WS), Math.ceil((x1 + 1) * WS) - 1, Math.ceil((y1 + 1) * WS) - 1];
let phase = 'design';                // 'design' während der Entwurfsgenerierung, danach 'world'

export const LOCATIONS = [
  { key:'eren',      name:'Eren',               x:60, y:64, r:14, kind:'village', threat:0, faction:'valen' },
  { key:'forest',    name:'Eren-Wald',          x:88, y:44, r:26, kind:'wild',    threat:1 },
  { key:'mine',      name:'Verlassene Grube',   x:62, y:18, r:8,  kind:'dungeon', threat:3 },
  { key:'road',      name:'Alte Straße',        x:96, y:64, r:12, kind:'road',    threat:1 },
  { key:'fortress',  name:'Alte Feste',         x:18, y:62, r:11, kind:'ruin',    threat:2 },
  { key:'marsh',     name:'Moorland',           x:52, y:100,r:18, kind:'wild',    threat:2 },
  { key:'banditcamp',name:'Banditenlager',      x:66, y:116,r:9,  kind:'camp',    threat:3, faction:'bandit' },
  { key:'graveyard', name:'Alter Friedhof',     x:34, y:96, r:7,  kind:'ruin',    threat:2, faction:'undead' },
  { key:'shrine',    name:'Waldschrein',        x:76, y:52, r:5,  kind:'shrine',  threat:1, faction:'order' },
  { key:'ruins',     name:'Kleine Ruine',       x:40, y:40, r:7,  kind:'ruin',    threat:2 },
  { key:'northcity', name:'Nordfurt',           x:118,y:56, r:8,  kind:'city',    threat:0, faction:'valen' },
  { key:'grubenpfad',name:'Grubenpfad',         x:62, y:40, r:9,  kind:'road',    threat:1 },
  { key:'oldtower',  name:'Alter Wachturm',     x:56, y:37, r:4,  kind:'ruin',    threat:2 },
  { key:'raidcamp',  name:'Überfallenes Lager', x:67, y:28, r:4,  kind:'camp',    threat:2 },
  // --- Großregionen des erweiterten Grenzlands (512×512) ---
  { key:'oldbridge', name:'Steinbrücke',        x:110,y:300,r:10, kind:'road',    threat:1 },
  { key:'westwald',  name:'Westwald',           x:60, y:300,r:40, kind:'wild',    threat:2 },
  { key:'wolfden',   name:'Wolfsschlucht',      x:44, y:300,r:16, kind:'wild',    threat:3 },
  { key:'saltport',  name:'Salzhafen',          x:150,y:450,r:16, kind:'city',    threat:0, faction:'valen' },
  { key:'sunkentemple',name:'Versunkener Tempel',x:140,y:410,r:11,kind:'ruin',    threat:3 },
  { key:'kreuzweg',  name:'Kreuzweg',           x:250,y:250,r:14, kind:'village', threat:1, faction:'merch' },
  { key:'deephall',  name:'Tiefhall',           x:250,y:36, r:10, kind:'dungeon', threat:3 },
  { key:'frostpeak', name:'Frostkamm',          x:330,y:30, r:34, kind:'wild',    threat:2 },
  { key:'ashford',   name:'Aschfurt',           x:380,y:92, r:12, kind:'village', threat:1, faction:'merch' },
  { key:'redwaste',  name:'Rote Wüste',         x:440,y:155,r:48, kind:'wild',    threat:2 },
  { key:'sonnwacht', name:'Sonnwacht',          x:456,y:256,r:16, kind:'city',    threat:1, faction:'order' },
  { key:'altvharn',  name:'Alt-Vharn',          x:362,y:380,r:16, kind:'ruin',    threat:4, faction:'undead' },
  { key:'necropolis',name:'Große Nekropole',    x:404,y:437,r:14, kind:'ruin',    threat:4, faction:'undead' },
  { key:'blackkeep', name:'Die Schwarze Feste', x:431,y:430,r:18, kind:'city',    threat:5, faction:'undead' },
  { key:'mistisle',  name:'Nebelinsel',         x:90, y:500,r:12, kind:'wild',    threat:2 },
];

export function locAt(tx, ty) {
  const town = townAt(tx, ty); if (town) return LOCATIONS.find(l => l.key === town);   // ausgebaute Siedlung: ganzer Plan
  let best = null, bd = 1e9;
  for (const l of LOCATIONS) {
    const d = Math.hypot(l.x - tx, l.y - ty);
    if (d < l.r && d < bd) { bd = d; best = l; }
  }
  return best;
}
export function nearestLocations(tx, ty, n = 4) {
  return LOCATIONS.map(l => ({ l, d: Math.hypot(l.x - tx, l.y - ty) }))
    .sort((a, b) => a.d - b.d).slice(0, n);
}

export function tileAt(map, tx, ty) {
  const m = MAPS[map];
  if (!m || tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return T.ROCK;
  return m.tiles[ty * m.w + tx];
}
export function setTile(map, tx, ty, v) {
  const m = MAPS[map];
  if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return;
  m.tiles[ty * m.w + tx] = v;
  m.ver = (m.ver || 0) + 1;                      // Render-Chunks neu backen
}
export function solidTile(map, px, py) {
  return SOLID.has(tileAt(map, Math.floor(px / TS), Math.floor(py / TS)));
}
export function speedMul(map, px, py) {
  return SLOW[tileAt(map, Math.floor(px / TS), Math.floor(py / TS))] || 1;
}

const props = [];
function prop(kind, tx, ty, extra = {}) {
  const p = { id: uid(), kind: 'prop', type: kind, x: tx * TS + TS / 2, y: ty * TS + TS / 2,
              r: extra.r ?? 12, solid: extra.solid ?? false, map: extra.map || 'world', ...extra };
  props.push(p); return p;
}

function rect(map, x, y, w, h, t) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setTile(map, i, j, t);
}
function blob(map, cx, cy, r, t, density = 1) {
  for (let j = cy - r; j <= cy + r; j++) for (let i = cx - r; i <= cx + r; i++) {
    const d = Math.hypot(i - cx, j - cy);
    if (d <= r * (0.75 + rnd() * 0.35) && chance(density)) setTile(map, i, j, t);
  }
}
// Gebäude: Kacheln (Mauern, Dielen, Türlücke) + Datensatz in HOUSES (Typ, Stadt → Dach, Fassade, Innenausstattung).
// HOUSES entsteht bei jeder Generierung neu aus dem Seed (nicht gespeichert); Möbel sind Props (gen: 2).
export const HOUSES = [];
function house(map, x, y, w, h, doorSide = 'S', meta = {}) {
  rect(map, x, y, w, h, T.WALL);
  rect(map, x + 1, y + 1, w - 2, h - 2, T.PLANK);
  const door = doorSide === 'S' ? [x + (w >> 1), y + h - 1] : doorSide === 'N' ? [x + (w >> 1), y] : doorSide === 'W' ? [x, y + (h >> 1)] : [x + w - 1, y + (h >> 1)];
  setTile(map, door[0], door[1], T.PLANK);
  // id und seed aus dem Entwurf (Streckung): Bezüge (NPC_DAY) und Aussehen bleiben, auch wenn das Haus umzieht
  const b = { id: meta.id || 'h' + x + '_' + y, map, x, y, w, h, door: doorSide, doorTile: door, type: meta.type || 'house', town: meta.town, wear: meta.wear,
              seed: meta.seed || (x * 31 + y * 17) % 997 + 1, hx: meta.hx ?? x, hy: meta.hy ?? y };
  HOUSES.push(b);
  // Innenausstattung: die Kachel hinter der Tür bleibt frei; keine zwei Möbel auf einer Kachel
  const inside = [door[0] + (doorSide === 'W' ? 1 : doorSide === 'E' ? -1 : 0), door[1] + (doorSide === 'S' ? -1 : doorSide === 'N' ? 1 : 0)];
  const used = new Set([inside.join(',')]);
  const ruin = wearOf(b) === 2;                     // verlassen: Schutt, umgestürzter Rest, keine Wohnung mehr
  for (const [kind, ox, oy] of ruin ? [['rubble', 0, 0], ['debris', -1, 0], ['barrel', -1, -1], ['debris', 1, -1]] : FURNISH[b.type] || []) {
    const tx = ox >= 0 ? x + 1 + ox : x + w - 1 + ox, ty = oy >= 0 ? y + 1 + oy : y + h - 1 + oy, k = tx + ',' + ty;
    if (tx < x + 1 || tx > x + w - 2 || ty < y + 1 || ty > y + h - 2 || used.has(k)) continue;
    used.add(k);
    prop(kind, tx, ty, { map, gen: 2, house: b.id, solid: !['candles', 'sack', 'debris'].includes(kind), r: 10 });
  }
  return b;
}

const nz = (x, y) => { let n = (x * 374761393 + y * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
// Biom-Zentren (Voronoi-artig). base = Grundkachel der Region.
const BIOME = { plains:T.GRASS, forest:T.GRASS, desert:T.SAND, badland:T.SAND, marsh:T.MARSH, mountain:T.STONE, blight:T.ASH };
const centers = [
  { x:70,  y:70,  b:'plains'   },  // Greenmark (geschützt)
  { x:60,  y:300, b:'forest'   },  // Westwald
  { x:150, y:410, b:'marsh'    },  // Südsumpf
  { x:250, y:250, b:'plains'   },  // Mittelland
  { x:250, y:40,  b:'mountain' },  // Nordgebirge
  { x:340, y:36,  b:'mountain' },  // Frostkamm
  { x:430, y:150, b:'desert'   },  // Rote Wüste
  { x:380, y:90,  b:'badland'  },  // Aschmark
  { x:445, y:280, b:'plains'   },  // Ostmark (Orden)
  { x:330, y:360, b:'badland'  },  // Grenzöde (sichtbarer Rand zum Totenreich)
  { x:410, y:410, b:'blight'   },  // Totenreich-Kern
  { x:360, y:460, b:'blight'   },
  { x:470, y:440, b:'blight'   },
  { x:120, y:180, b:'plains'   },  // südliche Ebenen
];
const protectedNW = (x, y) => x < 140 && y < 150;      // Greenmark bleibt handgebaut
// Region einer Kachel (gleiche Formel wie die Generierung): 'greenmark' im handgebauten Nordwesten, sonst das Biom.
// Renderer und Klang nutzen sie für Farbwelt, Vegetation, Nahdetails, Atmosphäre und Umgebungsgeräusche.
const vn = (x, y) => {                                     // weiches Wertrauschen: Grenzen wellig statt pixelig verrauscht
  const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, s = t => t * t * (3 - 2 * t);
  const a = nz(xi, yi), b = nz(xi + 1, yi), c = nz(xi, yi + 1), d = nz(xi + 1, yi + 1), U = s(u), V = s(v);
  return a + (b - a) * U + (c - a) * V + (a - b - c + d) * U * V;
};
function biomeAt(x, y) {
  const jx = x + (vn(x / 14, y / 14) - 0.5) * 44 + (vn(x / 5, y / 5) - 0.5) * 8;
  const jy = y + (vn(y / 14 + 50, x / 14) - 0.5) * 44 + (vn(y / 5, x / 5 + 50) - 0.5) * 8;
  let best = null, bd = 1e9;
  for (const c of centers) { const d = (c.x - jx) ** 2 + (c.y - jy) ** 2; if (d < bd) { bd = d; best = c; } }
  return best.b;
}
const rawRegion = (tx, ty) => protectedNW(tx, ty) ? 'greenmark' : biomeAt(tx, ty);
// Eine Siedlung hat eine Region (die ihres Ankers): Nordfurts gestreckte Osthälfte läge sonst im Gebirge (Geröll, Schnee
// zwischen den Häusern). Erst nach der Generierung — sie selbst sieht die rohe Region, damit ihre Zufallsfolge gleich bleibt.
// Laufzeit (phase 'world'): Weltkacheln → Entwurfsregion. Während der Entwurfsgenerierung die rohe Entwurfsregion.
export const regionAt = (tx, ty) => { if (phase === 'design') return rawRegion(tx, ty);
  const k = townAt(tx, ty); return k ? rawRegion(...TOWN_PLAN[k].spread.a) : rawRegion(dT(tx), dT(ty)); };

// ---------------- Szenen: kleine, komponierte Orte, die eine Geschichte erzählen ----------------
// Keine Zufallsstreuung: jede Szene ist ein festes Arrangement. Gras darunter wird zur Lichtung,
// Bäume dort entfernt der Schlussfilter von genWorld.
const clearing = (x, y, r) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++)
  if (i * i + j * j <= r * r && tileAt('world', x + i, y + j) === T.GRASS) setTile('world', x + i, y + j, T.DIRT); };
function scene(kind, x, y) {
  const P = (t, dx, dy, o = {}) => prop(t, x + dx, y + dy, o);
  const barrel = (dx, dy) => P('barrel', dx, dy, { solid: true, r: 9 });
  switch (kind) {
    case 'huntcamp': clearing(x, y, 3); P('tent_prop', 0, -1, { solid: true }); P('firepit', 2, 1, { r: 8 }); barrel(-2, 1); P('bones', 3, -1, { r: 6 }); P('crate', -1, 2); break;
    case 'mushrooms': clearing(x, y, 2); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; P('mushrooms', Math.round(Math.cos(a) * 3), Math.round(Math.sin(a) * 2), { r: 4 }); } break;
    case 'battlefield': for (let i = 0; i < 7; i++) P(i % 2 ? 'bones' : 'blood', ri(-4, 4), ri(-3, 3), { r: 5 });
      P('banner_torn', 0, 0); P('debris', 2, 2, { r: 6 }); P('debris', -3, 1, { r: 6 }); P('rubble', -1, -3); break;
    case 'wreck': P('broken_cart', 0, 0, { solid: true, r: 14, label: 'Zerstörter Wagen' }); P('debris', 2, 1, { r: 6 }); P('bones', -2, 2, { r: 6 }); barrel(3, -1); P('blood', 1, 2, { r: 4 }); break;
    case 'shrine': clearing(x, y, 2); P('wayshrine', 0, 0, { solid: true, r: 8, label: 'Wegschrein' }); P('candles', 1, 1, { r: 6 }); P('flowers_prop', -1, 1, { r: 4 }); break;
    case 'stones': clearing(x, y, 3); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2;
      P('standing_stone', Math.round(Math.cos(a) * 3), Math.round(Math.sin(a) * 2), { solid: true, r: 9, label: 'Steinkreis' }); } P('candles', 0, 0, { r: 6 }); break;
    case 'frozen': P('firepit', 0, 0, { r: 8 }); P('bones', 1, 1, { r: 6 }); P('tent_prop', -2, -1, { solid: true }); P('banner_torn', 2, -1); P('crate', -1, 2); break;
    case 'altar': P('obelisk', 0, 0, { solid: true, label: 'Nekromantischer Altar' }); P('candles', -1, 1, { r: 6 }); P('candles', 1, 1, { r: 6 });
      for (let i = 0; i < 4; i++) P('bones', ri(-3, 3), ri(-2, 3), { r: 6 }); break;
    case 'drowned': for (let i = 0; i < 4; i++) P('gravestone', ri(-3, 3), ri(-2, 2)); P('candles', 0, 1, { r: 6 }); P('broken_pillar', 2, -1, { solid: true }); break;
    case 'farm': rect('world', x - 3, y - 2, 6, 4, T.FIELD); for (let i = -3; i < 3; i++) P('fence', i, 3, { solid: true }); P('scarecrow', 0, 0); barrel(4, 0); break;
    case 'village': for (let i = -4; i < 4; i++) if (i !== 0) P('fence', i, -4, { solid: true }); P('campfire_static', 0, 0); barrel(2, 1); barrel(3, 1); P('cart', -3, 1); break;
    case 'tower': clearing(x, y, 3); P('tower_ruin', 0, 0, { solid: true, r: 22, label: 'Verfallener Wachturm' }); P('rubble', 2, 2); P('rubble', -3, 1); P('bones', 1, 2, { r: 6 }); break;
  }
}
// Welche Szenen zu welchem Ort passen (aus Region und Geschichte des Ortes abgeleitet)
const SCENES = {
  forest: ['huntcamp', 'mushrooms'], fortress: ['battlefield', 'tower'], marsh: ['drowned'], banditcamp: ['wreck'],
  graveyard: ['drowned'], ruins: ['tower'], northcity: ['farm', 'village'], road: ['wreck'],
  westwald: ['huntcamp', 'mushrooms', 'shrine', 'mushrooms', 'tower'], wolfden: ['battlefield', 'huntcamp'],
  oldbridge: ['wreck', 'shrine'], saltport: ['village', 'wreck', 'farm'], sunkentemple: ['drowned', 'drowned'],
  kreuzweg: ['village', 'farm', 'shrine'], deephall: ['frozen', 'stones'], frostpeak: ['frozen', 'stones', 'tower'],
  ashford: ['village', 'battlefield'], redwaste: ['wreck', 'stones', 'wreck'], sonnwacht: ['shrine', 'farm', 'battlefield'],
  altvharn: ['altar', 'battlefield'], necropolis: ['altar'], blackkeep: ['battlefield', 'altar'], mistisle: ['drowned', 'shrine'],
};
// Regionstypische Gruppen auf einem gejitterten Raster: Haine, Felsgruppen, Knochenfelder — Rhythmus aus Dichte und Luft.
function regionClusters() {
  const tree = (x, y) => prop('tree', x, y, { solid: true, r: 12, hp: 3 });
  const around = (x, y, n, fn, rad = 2) => { for (let i = 0; i < n; i++) fn(x + ri(-rad, rad), y + ri(-rad, rad)); };
  const bad = t => [T.WATER, T.ROAD, T.PLANK, T.WALL, T.DWALL, T.ROCK, T.FIELD].includes(t);
  for (let cy = 8; cy < 470; cy += 14) for (let cx = 8; cx < 505; cx += 14) {
    const x = cx + ri(-5, 5), y = cy + ri(-5, 5);
    if (protectedNW(x, y) || bad(tileAt('world', x, y)) || !chance(0.55)) continue;
    const here = locAt(x, y); if (here && (here.kind === 'village' || here.kind === 'city')) continue;
    switch (biomeAt(x, y)) {
      case 'blight': if (chance(0.3)) { prop('bone_spire', x, y, { solid: true }); around(x, y, 2, (a, b) => prop('gravestone', a, b)); }
        else { around(x, y, ri(3, 5), tree); around(x, y, 2, (a, b) => prop('bones', a, b, { r: 6 }), 3); } break;
      case 'badland': around(x, y, ri(1, 2), tree); prop('rubble', x + 2, y + 1); if (chance(0.5)) prop('bones', x - 2, y + 1, { r: 6 }); break;
      case 'desert': around(x, y, 2, (a, b) => prop('rock_node', a, b, { harvest: 'stone', solid: true }), 3); if (chance(0.5)) tree(x + 3, y); if (chance(0.3)) prop('bones', x, y + 2, { r: 6 }); break;
      case 'mountain': around(x, y, ri(2, 4), tree); around(x, y, 2, (a, b) => prop('rock_node', a, b, { harvest: 'stone', solid: true }), 3); break;
      case 'marsh': around(x, y, ri(2, 3), tree); if (chance(0.5)) prop('bush', x + 2, y + 2, { harvest: 'herb' }); break;
      case 'forest': prop('fallen_tree', x, y, { solid: true }); around(x, y, 2, (a, b) => prop('bush', a, b, { harvest: 'herb' }), 3); if (chance(0.25)) prop('mushrooms', x + 2, y - 1, { r: 4 }); break;
      default: if (chance(0.6)) around(x, y, ri(3, 6), tree, 3); else { around(x, y, 2, (a, b) => prop('bush', a, b, { harvest: 'herb' })); if (chance(0.4)) prop('rock_node', x, y, { harvest: 'stone', solid: true }); }
    }
  }
}
function placeScenes() {
  const free = (x, y) => { for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++)
    if ([T.WATER, T.WALL, T.DWALL, T.ROCK, T.ROAD, T.PLANK].includes(tileAt('world', x + i, y + j))) return false; return true; };
  for (const l of LOCATIONS) (SCENES[l.key] || []).forEach((kind, i) => {
    for (let k = 0; k < 8; k++) {                          // Ring um den Ort, feste Winkel je Szene
      const a = i * 2.4 + k * 0.8 + l.x * 0.1, rr = l.r + 4 + (i % 2) * 4 + k;
      const x = Math.round(l.x + Math.cos(a) * rr), y = Math.round(l.y + Math.sin(a) * rr);
      if (x > 6 && y > 6 && x < 505 && y < 470 && free(x, y)) { scene(kind, x, y); break; }
    }
  });
}

// ---------------- Grubenpfad (Vertical Slice) ----------------
// Bewusst gebaute Route Eren → Grube. Jede Station erzählt ein Stück:
// Wegschrein (Aufbruch) → Waldweg → Kreuzung mit Wegweiser → Wachturm-Ruine (Landmarke, Untote)
// → überfallenes Händlerlager (Goblins, Blut, zerbrochene Waren) → Blutspur → Grubeneingang.
export const pathX = y => 62 + Math.round(Math.sin(y / 6) * 3);    // gewundener Weg (auch für Spawns)
function gruben() {
  for (let y = 18; y < 57; y++) {                       // Hauptweg, 2 Kacheln breit, mit ausgefransten Rändern
    const x = pathX(y); setTile('world', x, y, T.ROAD); setTile('world', x + 1, y, T.ROAD);
    if (chance(0.35)) setTile('world', x - 1, y, T.DIRT); if (chance(0.35)) setTile('world', x + 2, y, T.DIRT);
  }
  const trail = (x0, y0, x1, y1) => {                   // schmaler Nebenpfad mit leichtem Schlängeln
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) { const t = i / n, x = Math.round(x0 + (x1 - x0) * t + Math.sin(t * 9) * 1.2), y = Math.round(y0 + (y1 - y0) * t);
      setTile('world', x, y, T.DIRT); if (chance(0.4)) setTile('world', x, y + 1, T.DIRT); }
  };
  // 1) Wegschrein am Dorfrand
  const sx = pathX(54);
  prop('wayshrine', sx + 3, 54, { solid: true, r: 8, label: 'Wegschrein' }); prop('candles', sx + 4, 55, { r: 6 });
  prop('flowers_prop', sx + 3, 55, { r: 4 });
  // 2) Kreuzung mit Wegweiser: West zur Kleinen Ruine, Ost zum Waldschrein
  const cx = pathX(46);
  blob('world', cx, 46, 3, T.DIRT, 0.9);
  trail(cx - 2, 46, 44, 41); trail(cx + 3, 46, 74, 51);
  prop('waysign', cx + 3, 44, { solid: true, r: 6, label: 'Wegweiser: Grube ↑ · Ruine ← · Schrein →' });
  prop('barrel', cx - 3, 44, { solid: true, r: 9 }); prop('crate', cx - 3, 45);
  // 3) Wachturm-Ruine: weithin sichtbare Landmarke auf einer Lichtung, Knochen der letzten Wache
  blob('world', 56, 37, 4, T.STONE, 0.85); blob('world', 56, 37, 5, T.DIRT, 0.5);
  prop('tower_ruin', 55, 36, { solid: true, r: 22, label: 'Alter Wachturm' });
  for (const [x, y] of [[58, 39], [53, 38], [57, 34]]) prop('rubble', x, y);
  prop('bones', 58, 37, { r: 6 }); prop('banner_torn', 52, 36);
  trail(pathX(38) - 1, 38, 59, 38);
  // 4) Überfallenes Händlerlager: umgestürzter Wagen, verstreute Waren, kalte Feuerstelle, Blut
  const kx = pathX(29) + 5;
  blob('world', kx, 29, 4, T.DIRT, 0.9);
  prop('broken_cart', kx, 28, { solid: true, r: 14, label: 'Umgestürzter Händlerwagen' });
  prop('firepit', kx - 3, 30, { r: 8 }); prop('tent_prop', kx + 3, 27, { solid: true });
  prop('barrel', kx + 2, 30, { solid: true, r: 9 }); prop('debris', kx - 1, 31, { r: 6 }); prop('debris', kx + 3, 31, { r: 6 });
  prop('crate', kx - 2, 27); prop('chest', kx + 4, 29, { loot: ['bandage', 'potion'], label: 'Aufgebrochene Kiste' });
  for (const [x, y] of [[kx - 1, 29], [kx + 1, 30]]) prop('blood', x, y, { r: 4 });
  // 5) Blutspur vom Lager zur Grube — wer ihr folgt, findet den Eingang
  for (let y = 27; y > 20; y -= 2) prop('blood', pathX(y) + (y & 2 ? 1 : 0), y, { r: 4 });
  prop('bones', 60, 21, { r: 6 }); prop('candles', 64, 20, { r: 6 }); prop('bones', 65, 21, { r: 6 });
  // Dichter Wald links und rechts des Wegs, Lichtungen bleiben frei (keine Graskachel)
  for (let y = 21; y < 53; y++) for (let k = 0; k < 5; k++) {
    const side = chance(0.5) ? -1 : 1, x = pathX(y) + (side < 0 ? -ri(3, 11) : ri(4, 12));
    if (tileAt('world', x, y) === T.GRASS && chance(0.55)) prop('tree', x, y, { solid: true, r: 12, hp: 3 });
  }
  for (let i = 0; i < 26; i++) { const y = ri(22, 52), x = pathX(y) + (chance(0.5) ? -ri(2, 6) : ri(3, 7));
    if (tileAt('world', x, y) === T.GRASS) prop(chance(0.6) ? 'bush' : 'rock_node', x, y, chance(0.6) ? { harvest: 'herb' } : { harvest: 'stone', solid: true }); }
}

// ---------------- Siedlungen: Ausbau (Session 2) ----------------
// Jede Siedlung ist ein Plan statt Zufall: Straßen und Plätze, Mauern mit Toren, typisierte Häuser mit der Tür zur
// Straße, Felder und Props mit Grund. Läuft am Ende von genWorld und zieht kein rnd(): die Zufallsfolge der übrigen
// Welt bleibt unverändert (BUG-027); ältere Spielstände übernehmen den Ausbau per Migration (game.js, flags.gen3).
// Kachelkoordinaten, Rechtecke inklusiv. old = Kern vor dem Ausbau (seine Häuser bleiben stehen), area = ganze Siedlung,
// square = Platz (Treffpunkt der Bewohner am Tag). perHead = Kacheln Siedlungsfläche je Kopf (Bewohner + Wachen + Figuren
// mit Namen): die Einwohnerzahl folgt der Fläche, nicht der Häuserzahl (Stadt dichter als Dorf, Grenzposten am dünnsten).
const seaLineD = x => 476 + Math.round(Math.sin(x / 20) * 4);          // Küstenlinie der Südsee im Entwurf (wie die Generierung)
export const seaLine = x => Math.ceil(seaLineD(dT(x)) * WS);            // … in Weltkacheln (erste Wasserzeile)
export const TOWN_PLAN = {
  eren: {                                                         // Heimatdorf: Ackerbau, Rast an der Alten Straße
    area: [34, 50, 87, 83], old: [50, 56, 71, 73], square: [62, 66], spread: { s: [1.4, 1.5], a: [58, 64] }, perHead: 95, outskirts: ['cottage', 'house', 'barn', 'house', 'cottage'],   // West: Alte Feste, Nord: Grubenpfad
    streets: [[T.ROAD, 50, 64, 71, 64], [T.DIRT, 46, 55, 49, 56], [T.DIRT, 48, 57, 49, 63], [T.DIRT, 76, 61, 77, 63], [T.DIRT, 82, 61, 82, 63], [T.DIRT, 53, 72, 54, 75]],
    houses: [['house', 43, 58, 5, 4, 'S'], ['cottage', 37, 58, 4, 4, 'S'], ['house', 44, 51, 5, 4, 'S'], ['barn', 36, 66, 6, 5, 'N'],
      ['bakery', 44, 66, 5, 4, 'N'], ['house', 74, 57, 5, 4, 'S'], ['cottage', 80, 57, 4, 4, 'S'], ['house', 74, 66, 5, 4, 'N'],
      ['cottage', 80, 66, 4, 4, 'N'], ['barn', 51, 76, 6, 5, 'N'], ['house', 66, 76, 5, 4, 'N']],
    fields: [[36, 73, 46, 78], [72, 76, 83, 81], [58, 68, 63, 71]],
    props: [['hay', 42, 68], ['hay', 57, 78], ['cart', 35, 65], ['trough', 58, 80], ['laundry', 41, 55], ['laundry', 79, 71],
      ['lantern', 50, 62], ['lantern', 73, 63], ['flowers_prop', 47, 62], ['sack', 47, 65, { label: 'Mehlsack' }], ['barrel', 43, 65, { label: 'Regentonne' }]],
  },
  northcity: {                                                    // Grenzstadt der Valen: Handel am Fluss, Garnison
    area: [111, 44, 147, 73], old: [112, 50, 125, 62], square: [137, 60], spread: { s: 1.7, a: [111, 64] }, perHead: 55, outskirts: ['cottage', 'house'],
    fill: [[T.GRASS, 111, 44, 147, 73]],                                        // Grund innerhalb der Mauer (die Osthälfte liegt schon im Gebirgsgeröll)
    plazas: [[T.STONE, 133, 58, 146, 62]],                                      // Markt; sonst kein Flächenpflaster mehr (Höfe, Gärten)
    walls: { rect: [111, 44, 147, 73], gates: [[111, 62, 111, 64], [147, 63, 147, 65], [118, 73, 119, 73], [128, 44, 129, 44]] },
    streets: [[T.ROAD, 112, 63, 146, 64], [T.ROAD, 128, 45, 129, 62], [T.ROAD, 118, 65, 119, 72]],
    houses: [['chapel', 113, 45, 6, 5, 'S'], ['manor', 120, 45, 5, 5, 'S'], ['store', 131, 46, 6, 5, 'S'], ['house', 138, 46, 4, 4, 'S'],
      ['cottage', 143, 46, 4, 4, 'S'], ['tavern', 131, 53, 6, 5, 'S'], ['smithy', 138, 53, 4, 4, 'S'], ['house', 143, 53, 4, 4, 'S'],
      ['bakery', 113, 66, 5, 4, 'N'], ['house', 120, 66, 5, 4, 'N'], ['manor', 130, 66, 5, 5, 'N'], ['house', 136, 66, 5, 4, 'N'], ['healer', 142, 66, 5, 4, 'N']],
    props: [['stall', 137, 59, { tag: 'market' }], ['stall', 139, 59, { tag: 'market' }], ['stall', 141, 59, { tag: 'market' }],
      ['well', 131, 60], ['board', 144, 60, { label: 'Anschlagbrett', tag: 'board' }], ['crate', 138, 61, { label: 'Marktware' }], ['sack', 142, 61, { label: 'Getreidesack' }],
      ['barrel', 131, 58, { label: 'Bierfass' }], ['barrel', 132, 58, { label: 'Bierfass' }], ['lantern', 113, 61], ['lantern', 145, 62], ['lantern', 117, 71],
      ['lantern', 130, 47], ['lantern', 127, 61], ['laundry', 126, 69], ['trough', 145, 71]],
    // grow: erst durch die Streckung möglich, darum in Weltkoordinaten. Reihe zur Hauptstraße, Garnisonsstall an der
    // Südmauer, Hinterhäuser; Gemüsebeete in den Höfen.
    grow: { s0: 1.5, houses: [['house', 115, 57, 5, 4, 'S'], ['cottage', 123, 57, 4, 4, 'S'], ['house', 130, 57, 5, 4, 'S'],
        ['house', 115, 73, 5, 4, 'N'], ['stable', 132, 73, 6, 5, 'N'], ['cottage', 148, 73, 4, 4, 'N'], ['house', 157, 73, 5, 4, 'N']],
      gardens: [[123, 45, 127, 47], [147, 45, 151, 47], [133, 45, 136, 47], [125, 74, 129, 76]],
      props: [['sack', 128, 48, { label: 'Kartoffelsack' }], ['laundry', 121, 56], ['hay', 139, 76], ['trough', 131, 77]] },
  },
  saltport: {                                                     // Hafenstadt: Salz, Fisch, Umschlag an Kai und Stegen
    area: [132, 431, 174, 488], old: [138, 438, 163, 463], square: [157, 447], spread: { s: 1.45, a: [148, 472] }, perHead: 70, outskirts: ['fisher', 'house', 'cottage', 'store', 'fisher', 'house', 'cottage'],
    fill: [[T.DIRT, 132, 431, 174, 471, 'ragged']],
    clear: [[T.DIRT, 146, 463, 147, 471], [T.DIRT, 156, 463, 156, 471]],     // alte Stege endeten im Sumpf
    streets: [[T.ROAD, 147, 431, 148, 476], [T.ROAD, 149, 436, 150, 437], [T.ROAD, 132, 450, 174, 450], [T.ROAD, 132, 463, 174, 464],
      [T.DIRT, 140, 437, 146, 438], [T.DIRT, 149, 438, 158, 438], [T.DIRT, 135, 444, 136, 449], [T.DIRT, 166, 445, 166, 449], [T.DIRT, 172, 445, 172, 449]],
    plazas: [[T.STONE, 152, 445, 162, 449]],
    harbor: { x0: 132, x1: 174, top: 472, piers: [140, 153, 166], boats: [[143, 3], [156, 5], [164, 2]] },
    houses: [['house', 133, 440, 5, 4, 'S'], ['manor', 164, 440, 5, 5, 'S'], ['house', 170, 441, 4, 4, 'S'], ['store', 137, 432, 6, 5, 'S'], ['chapel', 155, 432, 6, 5, 'S'],
      ['house', 133, 452, 5, 4, 'N'], ['manor', 159, 452, 5, 5, 'N'], ['house', 165, 452, 5, 4, 'N'], ['cottage', 171, 452, 4, 4, 'N'],
      ['store', 133, 457, 6, 5, 'S'], ['store', 140, 457, 6, 5, 'S'], ['fisher', 150, 458, 4, 4, 'S'], ['fisher', 155, 458, 4, 4, 'S'], ['store', 160, 458, 6, 4, 'S'], ['fisher', 167, 458, 4, 4, 'S'],
      ['fisher', 133, 466, 4, 4, 'N'], ['store', 138, 466, 6, 5, 'N'], ['fisher', 150, 466, 4, 4, 'N'], ['store', 155, 466, 6, 5, 'N', 2], ['fisher', 162, 466, 4, 4, 'N'], ['house', 168, 466, 5, 4, 'N']],
    props: [['stall', 153, 446, { tag: 'market' }], ['stall', 155, 446, { tag: 'market' }], ['stall', 157, 446, { tag: 'market' }],
      ['board', 161, 448, { label: 'Anschlagbrett', tag: 'board' }], ['crate', 159, 446, { label: 'Marktware' }], ['sack', 154, 448, { label: 'Salzsack' }],
      ['crate_stack', 144, 473, { label: 'Hafenfracht' }], ['sack', 145, 474, { label: 'Salzsack' }], ['sack', 146, 473, { label: 'Salzsack' }],
      ['barrel', 157, 473, { label: 'Heringsfass' }], ['barrel', 158, 473, { label: 'Heringsfass' }], ['crate', 160, 474, { label: 'Hafenfracht' }], ['crate', 161, 473, { label: 'Hafenfracht', v: 2 }],
      ['net_rack', 135, 473], ['net_rack', 170, 473], ['cart', 150, 474], ['lantern', 139, 472], ['lantern', 152, 472], ['lantern', 165, 472],
      ['lantern', 146, 449], ['lantern', 163, 449], ['laundry', 138, 446], ['net_rack', 149, 462]],
  },
  kreuzweg: {                                                     // Marktflecken an der Kreuzung: Söldner, Rast, Handel
    area: [225, 230, 277, 271], old: [240, 240, 261, 257], square: [250, 261], spread: { s: 1.5, a: [249, 250] }, perHead: 90, outskirts: ['house', 'cottage', 'stable'],
    streets: [[T.ROAD, 248, 236, 249, 249], [T.ROAD, 225, 250, 277, 250],
      [T.DIRT, 230, 247, 230, 249], [T.DIRT, 236, 247, 236, 249], [T.DIRT, 232, 239, 239, 240], [T.DIRT, 238, 241, 239, 249],
      [T.DIRT, 266, 248, 266, 249], [T.DIRT, 273, 248, 273, 249], [T.DIRT, 265, 239, 274, 240], [T.DIRT, 269, 241, 269, 249],
      [T.DIRT, 228, 257, 239, 258], [T.DIRT, 238, 251, 239, 256], [T.DIRT, 248, 251, 251, 257], [T.DIRT, 261, 257, 272, 258]],
    plazas: [[T.STONE, 240, 258, 260, 264]],
    houses: [['house', 228, 243, 5, 4, 'S'], ['cottage', 234, 243, 4, 4, 'S'], ['bakery', 231, 235, 5, 4, 'S'],
      ['stable', 263, 243, 6, 5, 'S'], ['store', 270, 243, 6, 5, 'S'], ['house', 263, 235, 5, 4, 'S'], ['house', 270, 235, 5, 4, 'S'],
      ['house', 228, 252, 5, 4, 'N'], ['cottage', 234, 252, 4, 4, 'N'], ['barn', 228, 259, 6, 5, 'N'],
      ['healer', 262, 252, 5, 4, 'N'], ['house', 268, 252, 5, 4, 'N'], ['cottage', 274, 252, 4, 4, 'N', 2], ['house', 263, 260, 5, 4, 'N'], ['store', 269, 260, 6, 5, 'N'],
      ['manor', 243, 266, 5, 5, 'N'], ['house', 249, 266, 5, 4, 'N'], ['house', 255, 266, 5, 4, 'N']],
    fields: [[226, 265, 236, 269]],
    props: [['stall', 243, 260, { tag: 'market' }], ['stall', 246, 260, { tag: 'market' }], ['stall', 253, 260, { tag: 'market' }], ['stall', 256, 260, { tag: 'market' }],
      ['well', 250, 262], ['board', 258, 263, { label: 'Anschlagbrett', tag: 'board' }], ['crate', 244, 262, { label: 'Marktware' }], ['crate', 254, 262, { label: 'Marktware', v: 1 }],
      ['sack', 247, 262, { label: 'Getreidesack' }], ['trough', 262, 249], ['hay', 276, 245], ['cart', 276, 249], ['laundry', 233, 256],
      ['lantern', 247, 257], ['lantern', 240, 249], ['lantern', 261, 249], ['hay', 234, 261]],
  },
  ashford: {                                                      // Grenzposten: Kernburg, Vorstadt hinter Palisaden, Karawanenhof
    area: [357, 83, 395, 109], old: [372, 84, 387, 99], square: [379, 94], oldWalls: true, spread: { s: 1.7, a: [380, 92] }, perHead: 100, outskirts: ['cottage', 'house', 'stable'],
    oldFloor: T.DIRT, coreWalls: [372, 84, 387, 99],
    clear: [[T.DIRT, 380, 84, 380, 84], [T.DIRT, 372, 92, 372, 93], [T.DIRT, 378, 99, 381, 99]],       // Nordtor (die Oststraße endete an der Mauer), Westtor
    fill: [[T.DIRT, 358, 84, 371, 99, 'ragged'], [T.DIRT, 364, 101, 394, 108, 'ragged']],
    palisade: { rect: [357, 83, 371, 100], sides: 'NWS', gates: [[357, 92, 357, 93]] },
    streets: [[T.DIRT, 358, 92, 371, 93], [T.DIRT, 378, 100, 381, 102], [T.DIRT, 364, 101, 394, 102], [T.DIRT, 380, 80, 380, 83]],
    houses: [['tavern', 359, 86, 6, 5, 'S'], ['smithy', 366, 87, 5, 4, 'S'], ['store', 359, 95, 6, 5, 'N'], ['house', 366, 95, 5, 4, 'N'],
      ['stable', 368, 104, 6, 5, 'N'], ['house', 384, 104, 5, 4, 'N'], ['cottage', 390, 104, 4, 4, 'N', 2]],
    props: [['trough', 375, 104], ['hay', 366, 106], ['cart', 381, 105], ['crate', 358, 94, { label: 'Handelsware' }], ['barrel', 358, 91, { label: 'Wasserfass' }],
      ['anvil', 365, 91, { label: 'Amboss' }], ['lantern', 379, 97], ['lantern', 370, 91], ['lantern', 377, 101]],
    grow: { s0: 1.5, houses: [['house', 371, 96, 5, 4, 'N'], ['store', 384, 96, 6, 5, 'N'], ['house', 375, 110, 5, 4, 'N']],
      gardens: [[350, 82, 354, 84]],
      props: [['crate', 390, 95, { label: 'Handelsware' }], ['barrel', 389, 95, { label: 'Wasserfass' }]] },
  },
  sonnwacht: {                                                    // Ordensfeste: Kernburg mit Komturei, Unterstadt der Pilger
    area: [435, 245, 476, 290], old: [446, 246, 465, 265], square: [455, 277], oldWalls: true, spread: { s: 1.45, a: [455, 250] }, perHead: 85, outskirts: ['house', 'cottage', 'house', 'barn', 'house', 'cottage', 'house'],   // y 250: Westtor auf der Mittellandstraße
    oldFloor: T.STONE, coreWalls: [446, 246, 465, 265],
    clear: [[T.STONE, 446, 250, 446, 251], [T.STONE, 453, 265, 458, 265]],                       // Westtor zur Mittellandstraße
    fill: [[T.DIRT, 436, 266, 476, 289, 'ragged']],
    streets: [[T.ROAD, 455, 266, 456, 289], [T.ROAD, 436, 276, 476, 277], [T.DIRT, 450, 282, 454, 283]],
    houses: [['hall', 448, 257, 6, 5, 'S'], ['barracks', 459, 257, 5, 4, 'S'],
      ['healer', 437, 271, 6, 5, 'S'], ['house', 447, 272, 5, 4, 'S'], ['bakery', 458, 272, 5, 4, 'S'], ['store', 464, 271, 6, 5, 'S'], ['house', 471, 272, 5, 4, 'S'],
      ['tavern', 437, 278, 6, 5, 'N'], ['house', 447, 278, 5, 4, 'N'], ['smithy', 458, 278, 5, 4, 'N'], ['house', 464, 278, 5, 4, 'N'], ['cottage', 470, 278, 4, 4, 'N'],
      ['barn', 447, 284, 6, 5, 'N']],
    fields: [[458, 284, 470, 288]],
    props: [['sign', 453, 263, { label: 'Sonnwacht — Feste des Ordens' }], ['lantern', 446, 275], ['lantern', 454, 275], ['lantern', 463, 275], ['lantern', 454, 265],
      ['hay', 453, 286], ['trough', 444, 283], ['laundry', 443, 273], ['torch', 445, 249], ['torch', 445, 252]],
  },
};
// ---------------- Streckung (Session 4, Nutzerwunsch: Städte zu klein und zu voll) ----------------
// Die Pläne oben bleiben in Entwurfskoordinaten (so wurden sie gestaltet und so lesen sie sich). spread = { s, a }:
// alle Abstände wachsen um den Faktor s um den Anker a, Häuser behalten ihre Größe. Folge: Gassen werden Wege,
// zwischen den Häusern entsteht Hof, Garten, Grün — die Anordnung (Straße, Platz, Tor) bleibt die gestaltete.
// Der Anker liegt auf der Durchgangsstraße bzw. am Kai/Fluss, damit Straßen außerhalb anschließen und die
// Stadt nicht über Fluss/Küste wächst. Häuser werden an der Türseite verankert: die Tür bleibt an ihrer Straße.
const spS = (P, ax) => Array.isArray(P.spread.s) ? P.spread.s[ax] : P.spread.s;   // s: Faktor oder [sx, sy]
const sp = (P, v, ax) => P.spread.a[ax] * WS + (v - P.spread.a[ax]) * spS(P, ax);   // Anker wandert mit der Karte, die Stadt streckt um s
const spR = (P, v, ax) => Math.round(sp(P, v, ax));
const spRect = (P, [x0, y0, x1, y1, ...rest]) => [spR(P, x0, 0), spR(P, y0, 1), spR(P, x1 + 1, 0) - 1, spR(P, y1 + 1, 1) - 1, ...rest];
export function spreadHouse(P, x, y, w, h, door) {
  const nx = door === 'W' ? spR(P, x, 0) : door === 'E' ? spR(P, x + w, 0) - w : Math.round(sp(P, x + w / 2, 0) - w / 2);
  const ny = door === 'N' ? spR(P, y, 1) : door === 'S' ? spR(P, y + h, 1) - h : Math.round(sp(P, y + h / 2, 1) - h / 2);
  return [nx, ny];
}
// Entwurfspunkt → Weltkachel: in einer Siedlung über deren Streckung, sonst über den Weltmaßstab. Für alle festen
// Koordinaten in game.js/sim.js (Wachposten, Arbeitsplätze, Spawngebiete, Karawanenroute, Startpunkt, Ankunft).
export function worldPt(x, y) {
  for (const P of Object.values(TOWN_PLAN)) { const [x0, y0, x1, y1] = P.design.area;
    if (x >= x0 - 2 && x <= x1 + 2 && y >= y0 - 2 && y <= y1 + 2) return [spR(P, x, 0), spR(P, y, 1)]; }
  return [wT(x), wT(y)];
}
export const townPt = worldPt;
// grow-Einträge wurden in Weltkoordinaten einer früheren Fassung gebaut (Maßstab 1, Streckung s0). Umrechnung: gleiche
// Lage zum Anker, Abstände mit s/s0 — Häuser an der Türseite verankert wie im Entwurf.
function growPt(P, v, ax) { const a = P.spread.a[ax], k = spS(P, ax) / (P.grow.s0 || spS(P, ax)); return a * WS + (v - a) * k; }
function growHouse(P, x, y, w, h, door) {
  const R = (v, ax) => Math.round(growPt(P, v, ax));
  return [door === 'W' ? R(x, 0) : door === 'E' ? R(x + w, 0) - w : Math.round(growPt(P, x + w / 2, 0) - w / 2),
          door === 'N' ? R(y, 1) : door === 'S' ? R(y + h, 1) - h : Math.round(growPt(P, y + h / 2, 1) - h / 2)];
}
for (const [key, P] of Object.entries(TOWN_PLAN)) {
  P.design = { area: P.area.slice(), old: P.old.slice(), clear: (P.clear || []).map(r => r.slice()), houses: P.houses };
  const R4 = ([t, ...r]) => [t, ...spRect(P, r)];
  P.area = spRect(P, P.area); P.old = spRect(P, P.old); P.square = [spR(P, P.square[0], 0), spR(P, P.square[1], 1)];
  for (const k of ['fill', 'clear', 'plazas', 'streets']) if (P[k]) P[k] = P[k].map(R4);
  for (const r of P.streets) if (r[0] === T.ROAD) {                     // Hauptstraßen mindestens 3 breit — breiter als jede Gasse (§75)
    const ax = r[3] - r[1] >= r[4] - r[2] ? 2 : 1, w = r[ax + 2] - r[ax] + 1;       // quer zur Laufrichtung
    if (Math.max(r[3] - r[1], r[4] - r[2]) >= 10 && w < 3) { r[ax] -= (3 - w) >> 1; r[ax + 2] += (3 - w + 1) >> 1; }
  }
  if (P.fields) P.fields = P.fields.map(r => spRect(P, r));
  if (P.coreWalls) P.coreWalls = spRect(P, P.coreWalls);
  for (const k of ['walls', 'palisade']) if (P[k]) P[k] = { ...P[k], rect: spRect(P, P[k].rect), gates: P[k].gates.map(g => spRect(P, g)) };
  if (P.harbor) { const H = P.harbor;
    P.harbor = { x0: spR(P, H.x0, 0), x1: spR(P, H.x1 + 1, 0) - 1, top: spR(P, H.top, 1), piers: H.piers.map(x => spR(P, x, 0)), boats: H.boats.map(([x, d]) => [spR(P, x, 0), d]) }; }
  P.houses = P.houses.map(([type, x, y, w, h, door, wear]) => [type, ...spreadHouse(P, x, y, w, h, door), w, h, door, wear, 'h' + x + '_' + y, x, y]);
  P.props = (P.props || []).map(([kind, x, y, o]) => { const [nx, ny] = attachedPt(P, x, y); return [kind, nx, ny, o]; });
  if (P.grow) { const G = P.grow, R = (v, ax) => Math.round(growPt(P, v, ax));
    P.grow = { houses: (G.houses || []).map(([type, x, y, w, h, door, wear]) => [type, ...growHouse(P, x, y, w, h, door), w, h, door, wear, 'g' + x + '_' + y, x, y]),
      gardens: (G.gardens || []).map(([x0, y0, x1, y1]) => [R(x0, 0), R(y0, 1), R(x1 + 1, 0) - 1, R(y1 + 1, 1) - 1]),
      props: (G.props || []).map(([kind, x, y, o]) => [kind, R(x, 0), R(y, 1), o]) }; }
  const L = LOCATIONS.find(l => l.key === key);
  if (L) { [L.x, L.y] = [spR(P, L.x, 0), spR(P, L.y, 1)]; L.r = Math.round(L.r * Math.max(spS(P, 0), spS(P, 1))); L.town = true; }
}
for (const L of LOCATIONS) if (!L.town) { L.x = wT(L.x); L.y = wT(L.y); L.r = Math.round(L.r * WS); }   // übrige Orte: Weltmaßstab
// Props neben einem Haus (Schild an der Tür, Fässer vor der Schenke) ziehen mit dem Haus um; freie Props strecken.
function attachedPt(P, x, y, extra = []) {
  for (const [, hx, hy, w, h, door] of [...P.design.houses, ...extra])
    if (x >= hx - 2 && x <= hx + w + 1 && y >= hy - 2 && y <= hy + h + 1) { const [nx, ny] = spreadHouse(P, hx, hy, w, h, door); return [x - hx + nx, y - hy + ny]; }
  return [spR(P, x, 0), spR(P, y, 1)];
}
export function townAt(tx, ty, m = 0) {                    // m: Rand in Kacheln (z. B. Abstand für Gegner-Spawns)
  for (const k in TOWN_PLAN) { const [x0, y0, x1, y1] = TOWN_PLAN[k].area; if (tx >= x0 - m && tx <= x1 + m && ty >= y0 - m && ty <= y1 + m) return k; }
  return null;
}
const SOLID_PROP = new Set(['hay', 'boat', 'net_rack', 'trough', 'barrel', 'well', 'anvil', 'crate_stack', 'palisade_prop', 'fence']);
const NATURE = new Set(['tree', 'bush', 'flowers_prop', 'rock_node', 'dead_tree']);   // darf zwischen den Häusern bleiben, wenn es nichts verstellt
const NATURAL = new Set([T.GRASS, T.MARSH, T.SAND, T.FIELD, T.ASH, T.ROCK]);
const naturalAt = (x, y) => { const X = dT(x), Y = dT(y); return protectedNW(X, Y) ? T.GRASS : BIOME[biomeAt(X, Y)]; };   // Weltkachel
const PAVED = new Set([T.ROAD, T.STONE, T.PLANK]);
const HOUSE_SIZE = { house: [5, 4], cottage: [4, 4], barn: [6, 5], fisher: [4, 4], store: [6, 5], stable: [6, 5], manor: [5, 5], bakery: [5, 4] };
const SCATTER = new Set(['camp_ruin', 'rubble', 'bones', 'debris', 'broken_pillar', 'gravestone', 'firepit', 'tent_prop', 'blood', 'broken_cart', 'bone_spire']);
const TRAMPLE = new Set([T.GRASS, T.MARSH, T.SAND, T.ASH]);            // hier darf ein Trampelpfad entstehen
function expandTowns(wild) {
  for (const [town, P] of Object.entries(TOWN_PLAN)) {
    const claimed = new Set(), street = new Set(), K = (x, y) => x + ',' + y;
    const inR = (r, x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
    const own = () => HOUSES.filter(b => b.map === 'world' && b.x <= P.area[2] + 2 && b.x + b.w >= P.area[0] - 2 && b.y <= P.area[3] + 2 && b.y + b.h >= P.area[1] - 2);
    let near_h = own();
    const inHouse = (x, y) => near_h.some(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
    const paint = (x, y, t) => { if (!inHouse(x, y)) setTile('world', x, y, t); claimed.add(K(x, y)); };
    const pave = (x, y, t) => { paint(x, y, t); street.add(K(x, y)); };
    const box = (r, fn) => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) fn(x, y); };

    // 0) Umzug des alten Kerns (Streckung): Kernhäuser aus genWorld samt Möbeln abtragen, ihren Boden der Natur
    //    zurückgeben; Kern-Props ziehen mit ihrem Haus um (Schild an der Tür bleibt an der Tür).
    const core = [];
    for (let i = HOUSES.length - 1; i >= 0; i--) { const b = HOUSES[i];
      if (b.town === town && b.map === 'world') { core.push([b.type, b.x, b.y, b.w, b.h, b.door, b.wear]); HOUSES.splice(i, 1); } }
    const coreIds = new Set(core.map(([, x, y]) => 'h' + x + '_' + y));
    const moved = new Set();
    let k0 = 0;
    for (const p of props) {
      if (coreIds.has(p.house)) continue;                               // Möbel entstehen im neuen Haus neu
      const [tx, ty] = p._d || [dT(p.x / TS | 0), dT(p.y / TS | 0)];        // Entwurfskachel (die Hochrechnung merkt sie sich)
      if ((p.map || 'world') === 'world' && inR(P.design.old, tx, ty) && !NATURE.has(p.type) && !wild.has(p)) {
        if (p.type === 'fence' || p.type === 'scarecrow') continue;      // Kernfeld: Zaun und Scheuche setzt der Plan neu
        const [nx, ny] = attachedPt(P, tx, ty, core); p.x = nx * TS + TS / 2; p.y = ny * TS + TS / 2; moved.add(p);
      }
      props[k0++] = p;
    }
    props.length = k0;
    near_h = own();
    for (const r of [P.design.old, ...P.design.clear.map(c => c.slice(1))]) box(wRect(r), (x, y) => { if (tileAt('world', x, y) !== T.WATER) setTile('world', x, y, naturalAt(x, y)); });
    const houses = [...core.map(([type, x, y, w, h, door, wear]) => [type, ...spreadHouse(P, x, y, w, h, door), w, h, door, wear, 'h' + x + '_' + y, x, y]), ...P.houses,
      ...(P.grow?.houses || [])];
    const mark = props.length;

    for (const [t, ...r] of P.fill || []) box(r, (x, y) => {          // Grund: Pflaster bzw. festgetretene Erde; Ränder ausgefranst
      const edge = x - r[0] < 1 || r[2] - x < 1 || y - r[1] < 1 || r[3] - y < 1;
      if (tileAt('world', x, y) === T.ROAD || inHouse(x, y) || (r[4] === 'ragged' && edge && nz(x, y) > 0.5)) return;
      setTile('world', x, y, t);
    });
    box(P.old, (x, y) => {                                              // Boden des (gestreckten) Kerns; Felsen dort sind Reste
      const t = tileAt('world', x, y);
      if (P.oldFloor != null ? t !== T.WATER && t !== T.ROAD : t === T.ROCK) setTile('world', x, y, P.oldFloor ?? T.DIRT);
    });
    if (P.coreWalls) { const [x0, y0, x1, y1] = P.coreWalls;             // Kernburg: Ringmauer (Tore öffnet clear)
      box(P.coreWalls, (x, y) => { if (x === x0 || x === x1 || y === y0 || y === y1) paint(x, y, T.WALL); }); }
    for (const [t, ...r] of P.clear || []) box(r, (x, y) => pave(x, y, t));
    if (P.walls) { const [x0, y0, x1, y1] = P.walls.rect, gate = (x, y) => P.walls.gates.some(g => inR(g, x, y));
      box(P.walls.rect, (x, y) => { if (x === x0 || x === x1 || y === y0 || y === y1) (gate(x, y) ? pave : paint)(x, y, gate(x, y) ? T.ROAD : T.WALL); }); }
    for (const [t, ...r] of P.plazas || []) box(r, (x, y) => pave(x, y, t));
    for (const [t, ...r] of P.streets || []) box(r, (x, y) => { if (tileAt('world', x, y) !== T.ROAD) pave(x, y, t); else { claimed.add(K(x, y)); street.add(K(x, y)); } });
    if (P.harbor) { const H = P.harbor;                                // Kai bis ans Wasser, Stege hinaus, Boote daneben
      for (let x = H.x0; x <= H.x1; x++) for (let y = H.top; y < seaLine(x); y++) pave(x, y, T.STONE);
      for (const px of H.piers) for (let x = px; x <= px + 1; x++) for (let y = H.top; y <= seaLine(x) + 7; y++) paint(x, y, T.PLANK);
      for (const [bx, dy] of H.boats) prop('boat', bx, seaLine(bx) + dy, { solid: true, r: 14, label: 'Fischerboot' });
    }
    for (const r of P.fields || []) {                                  // Acker mit Zaun zur Straße hin und Vogelscheuche
      box(r, (x, y) => paint(x, y, T.FIELD));
      for (let x = r[0]; x <= r[2]; x++) { prop('fence', x, r[3] + 1, { solid: true }); claimed.add(K(x, r[3] + 1)); }
      prop('scarecrow', (r[0] + r[2]) >> 1, (r[1] + r[3]) >> 1);
    }
    for (const r of P.grow?.gardens || []) box(r, (x, y) => { if (!street.has(K(x, y))) paint(x, y, T.FIELD); });   // Gemüsebeete im Hof
    for (const [type, x, y, w, h, door, wear, id, hx, hy] of houses) {  // wear (optional): bewusst gesetzte Ruine
      box([x - 1, y - 1, x + w, y + h], (i, j) => {                     // Hofrand: Erde statt Gras, Ecken ausgefranst
        const corner = (i === x - 1 || i === x + w) && (j === y - 1 || j === y + h);
        if (!(corner && nz(i, j) > 0.5) && NATURAL.has(tileAt('world', i, j)) && !inHouse(i, j)) setTile('world', i, j, T.DIRT);
        claimed.add(K(i, j));
      });
      house('world', x, y, w, h, door, { type, town, wear, id, hx, hy });
      near_h = own();
    }
    // Randhäuser (Session 5): die größere Karte lässt Platz für Außengehöfte und Vorstadthäuser. Regeln statt Koordinaten:
    // freier Grund (kein Hof, keine Straße, kein Acker, kein Wasser/Fels), ≥ 3 Kacheln zu jedem Haus, ≥ 2 zum Stadtrand,
    // Tür zur nächsten Straße (≤ 8 Kacheln). Reihenfolge der Kandidaten nach Hash — deterministisch, aber nicht im Raster.
    if (P.outskirts) {
      const OK = new Set([T.GRASS, T.DIRT, T.SAND, T.ASH, T.MARSH, T.STONE]), [ax0, ay0, ax1, ay1] = P.area;
      const free = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
        if (!OK.has(tileAt('world', x, y)) || claimed.has(K(x, y))) return false; return true; };
      const gapOK = (x, y, w, h) => near_h.every(b => Math.max(b.x - x - w, x - b.x - b.w, b.y - y - h, y - b.y - b.h) >= 3);
      const streetDist = (x, y) => { for (let r = 1; r <= 8; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++)
        if ((Math.abs(i) === r || Math.abs(j) === r) && street.has(K(x + i, y + j))) return r; return 99; };
      const cands = [];
      for (let y = ay0 + 2; y <= ay1 - 7; y++) for (let x = ax0 + 2; x <= ax1 - 7; x++) cands.push([nz(x * 3 + 11, y * 5 + 7), x, y]);
      cands.sort((a, b) => a[0] - b[0]);
      let n = 0;
      for (const [, x, y] of cands) {
        if (n >= P.outskirts.length) break;
        const type = P.outskirts[n], [w, h] = HOUSE_SIZE[type] || [5, 4];
        if (x + w > ax1 - 2 || y + h > ay1 - 2 || !free(x - 1, y - 1, x + w, y + h) || !gapOK(x, y, w, h)) continue;
        const sides = [['S', x + (w >> 1), y + h], ['N', x + (w >> 1), y - 1], ['W', x - 1, y + (h >> 1)], ['E', x + w, y + (h >> 1)]]
          .map(([d, fx, fy]) => [d, streetDist(fx, fy)]).sort((a, b) => a[1] - b[1]);
        if (sides[0][1] > 8) continue;
        box([x - 1, y - 1, x + w, y + h], (i, j) => { if (NATURAL.has(tileAt('world', i, j))) setTile('world', i, j, T.DIRT); claimed.add(K(i, j)); });
        house('world', x, y, w, h, sides[0][0], { type, town, id: 'o' + town + n, hx: x, hy: y });
        near_h = own(); n++;
      }
    }
    if (P.palisade) { const [x0, y0, x1, y1] = P.palisade.rect, gate = (x, y) => P.palisade.gates.some(g => inR(g, x, y));
      box(P.palisade.rect, (x, y) => {
        const side = (y === y0 && P.palisade.sides.includes('N')) || (y === y1 && P.palisade.sides.includes('S')) || (x === x0 && P.palisade.sides.includes('W'));
        if (side && !gate(x, y)) { prop('palisade_prop', x, y, { solid: true, r: 14 }); claimed.add(K(x, y)); }
      });
    }
    for (const [kind, x, y, o = {}] of [...P.props || [], ...P.grow?.props || []]) prop(kind, x, y, { solid: SOLID_PROP.has(kind), r: SOLID_PROP.has(kind) ? 10 : 12, ...o });

    // Türachsen (Tür, davor, dahinter) bleiben frei: umgezogene oder gestreckte Props, die dort landen, rücken zur Seite
    const doorAxis = new Set();
    for (const b of near_h) { const [dx, dy] = b.doorTile, sx = b.door === 'W' ? 1 : b.door === 'E' ? -1 : 0, sy = b.door === 'S' ? -1 : b.door === 'N' ? 1 : 0;
      for (const [x, y] of [[dx, dy], [dx + sx, dy + sy], [dx - sx, dy - sy]]) doorAxis.add(K(x, y)); }
    const solidAt = new Set();
    for (const p of props) if (p.solid && (p.map || 'world') === 'world' && !NATURE.has(p.type)) solidAt.add(K(p.x / TS | 0, p.y / TS | 0));
    const bad = (x, y) => doorAxis.has(K(x, y)) || inHouse(x, y) || SOLID.has(tileAt('world', x, y)) || tileAt('world', x, y) === T.ROAD;
    for (let i = 0; i < props.length; i++) {
      const p = props[i]; if ((p.map || 'world') !== 'world' || p.house || NATURE.has(p.type) || p.type === 'boat' || p.type === 'palisade_prop' || p.type === 'fence') continue;
      const tx = p.x / TS | 0, ty = p.y / TS | 0;
      if (!inR(P.area, tx, ty) || !(i >= mark || moved.has(p)) || !bad(tx, ty)) continue;
      if (!doorAxis.has(K(tx, ty)) && !inHouse(tx, ty) && tileAt('world', tx, ty) === T.ROAD && i >= mark) continue;   // Planprops auf der Straße sind gewollt (Stände)
      for (let r = 1, done = false; r <= 3 && !done; r++) for (let j = -r; j <= r && !done; j++) for (let q = -r; q <= r && !done; q++) {
        const x = tx + q, y = ty + j;
        if (bad(x, y) || solidAt.has(K(x, y)) || street.has(K(x, y))) continue;
        if (p.solid) { solidAt.delete(K(tx, ty)); solidAt.add(K(x, y)); }
        p.x = x * TS + TS / 2; p.y = y * TS + TS / 2; done = true;
      }
    }

    // Anschluss: Straßenstücke der Welt, die jetzt ins Leere laufen (der Kern ist umgezogen), führen zur nächsten
    // Stadtstraße; jede Haustür bekommt einen Trampelpfad zum Pflaster. Breitensuche, nie durch Haus, Mauer, Möbel.
    const [ax0, ay0, ax1, ay1] = P.area, M = 4;
    const walk = (x, y) => x >= ax0 - M && x <= ax1 + M && y >= ay0 - M && y <= ay1 + M && !SOLID.has(tileAt('world', x, y)) && !inHouse(x, y) && !solidAt.has(K(x, y)) && tileAt('world', x, y) !== T.FIELD;
    const net = new Set(), q0 = [...street].map(s => s.split(',').map(Number));
    while (q0.length) { const [x, y] = q0.pop(), k = K(x, y);             // Straßennetz der Stadt: alles Pflaster, das an ihren Straßen hängt
      if (net.has(k) || !walk(x, y) || !(PAVED.has(tileAt('world', x, y)) || street.has(k))) continue;
      net.add(k); q0.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
    const route = (from, maxLen) => {                                  // kürzester Weg zum Netz, als Kachelliste
      const prev = new Map([[K(...from), null]]), q = [from];
      for (let h = 0; h < q.length; h++) { const [x, y] = q[h], k = K(x, y);
        if (net.has(k)) { const path = []; for (let c = k; c; c = prev.get(c)) path.push(c.split(',').map(Number)); return path.length <= maxLen ? path : null; }
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { const nk = K(nx, ny);
          if (!prev.has(nk) && walk(nx, ny)) { prev.set(nk, k); q.push([nx, ny]); } } }
      return null;
    };
    const seen = new Set();
    for (let y = ay0 - 1; y <= ay1 + 1; y++) for (let x = ax0 - 1; x <= ax1 + 1; x++) {
      if (tileAt('world', x, y) !== T.ROAD || net.has(K(x, y)) || seen.has(K(x, y))) continue;
      const comp = [], q = [[x, y]];                                     // zusammenhängendes, abgehängtes Straßenstück
      while (q.length) { const [cx, cy] = q.pop(), k = K(cx, cy);
        if (seen.has(k) || tileAt('world', cx, cy) !== T.ROAD || net.has(k)) continue;
        seen.add(k); comp.push([cx, cy]); q.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]); }
      if (comp.length < 4) { for (const [cx, cy] of comp) if (!street.has(K(cx, cy))) setTile('world', cx, cy, naturalAt(cx, cy)); continue; }   // Stummel
      const ends = comp.filter(([cx, cy]) => inR(P.area, cx, cy)).sort((a, b) => Math.hypot(a[0] - P.square[0], a[1] - P.square[1]) - Math.hypot(b[0] - P.square[0], b[1] - P.square[1]));
      const path = route(ends[0] || comp[0], 80);
      if (path) for (const [px, py] of path) { if (!PAVED.has(tileAt('world', px, py))) setTile('world', px, py, T.ROAD); claimed.add(K(px, py)); net.add(K(px, py)); }
    }
    for (const b of near_h) { if (b.town !== town || wearOf(b) === 2) continue;   // Trampelpfade (verlassene Häuser: zugewachsen)
      const [dx, dy] = b.doorTile, sx = b.door === 'W' ? -1 : b.door === 'E' ? 1 : 0, sy = b.door === 'S' ? 1 : b.door === 'N' ? -1 : 0;
      const path = route([dx + sx, dy + sy], 16); if (!path) continue;
      for (const [px, py] of path) { if (TRAMPLE.has(tileAt('world', px, py))) setTile('world', px, py, T.DIRT); claimed.add(K(px, py)); }
    }

    // Aufräumen: Streugut der Wildnis (Lager, Verstecke, Geröll, fremde Szenen) hat in einer Siedlung keinen Grund;
    // Bäume, Büsche, Felsen bleiben, wo sie nichts verstellen; Gebautes (Wegschrein, Schilder) nur nicht auf Straße/Hof.
    const near = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (claimed.has(K(x + i, y + j))) return true; return false; };
    let w = 0;
    for (let i = 0; i < props.length; i++) {
      const p = props[i], tx = p.x / TS | 0, ty = p.y / TS | 0;
      let drop = false;
      if (i < mark && !moved.has(p) && (p.map || 'world') === 'world' && inR(P.area, tx, ty))
        drop = (inHouse(tx, ty) && !p.house) || (NATURE.has(p.type) ? tileAt('world', tx, ty) !== T.GRASS || near(tx, ty)
          : wild.has(p) || claimed.has(K(tx, ty)) || (SCATTER.has(p.type) && !p.house));   // Straßenszenen, die die Streckung jetzt einschließt
      if (!drop) props[w++] = p;
    }
    props.length = w;
    box(P.area, (x, y) => { if (!inR(P.old, x, y) && !claimed.has(K(x, y)) && tileAt('world', x, y) === T.FIELD) setTile('world', x, y, T.GRASS); });   // Reste fremder Äcker
  }
}

// ---------------- Oberwelt ----------------
export function genWorld() {
  props.length = 0; HOUSES.length = 0; phase = 'design';
  seedRng(S.seed);
  const w = 512, h = 512, tiles = new Uint8Array(w * h).fill(T.GRASS);
  MAPS.world = { w, h, tiles };

  // Gelände
  for (let i = 0; i < 260; i++) blob('world', ri(4, w - 5), ri(4, h - 5), ri(2, 5), T.DIRT, 0.92);   // zusammenhängende Erdflecken
  blob('world', 52, 100, 17, T.MARSH, 0.9);
  blob('world', 46, 108, 9, T.MARSH, 0.8);
  for (let i = 0; i < 26; i++) blob('world', ri(40, 64), ri(90, 112), ri(1, 3), T.WATER, 0.7);
  blob('world', 114, 96, 10, T.WATER, 0.85);            // See im Südosten
  for (let j = 0; j < h; j++) { setTile('world', 108 + ((j / 9) | 0) % 3, j, T.WATER); } // Fluss
  blob('world', 62, 16, 9, T.ROCK, 0.75);               // Grubenberg
  blob('world', 24, 20, 8, T.ROCK, 0.6);
  blob('world', 14, 110, 7, T.ROCK, 0.55);

  // Straßen
  for (let x = 20; x < 120; x++) {                       // Alte Straße: außerhalb Erens leicht geschwungen
    const y = x > 49 && x < 73 ? 64 : 64 + Math.round(Math.sin(x / 9) * 1.4);
    setTile('world', x, y, T.ROAD); if (chance(0.5)) setTile('world', x, y - 1, T.ROAD);
  }
  gruben();
  for (let y = 64; y < 116; y++) { setTile('world', 60, y, T.DIRT); if (chance(0.3)) setTile('world', 61, y, T.DIRT); }

  // ---- Eren ----
  rect('world', 50, 56, 22, 18, T.DIRT);
  for (let x = 50; x < 72; x++) setTile('world', x, 64, T.ROAD);
  // Schilder stehen neben der Tür, nie davor; Waren und Fässer dort, wo gearbeitet und gehandelt wird
  house('world', 53, 58, 6, 5, 'S', { type:'tavern', town:'eren' }); prop('sign', 58, 63, { label:'Taverne „Zur Grauen Hand“', tag:'tavern' });
  house('world', 62, 58, 5, 4, 'S', { type:'smithy', town:'eren' }); prop('anvil', 66, 62, { tag:'smithy', solid:true, label:'Aldrics Amboss' });
  house('world', 68, 59, 5, 4, 'W', { type:'healer', town:'eren' }); prop('sign', 67, 63, { label:'Heilerin', tag:'healer' });
  house('world', 52, 68, 5, 4, 'N', { type:'hall', town:'eren' }); prop('sign', 56, 67, { label:'Haus des Vorstehers', tag:'mayor' });
  house('world', 66, 68, 6, 5, 'N', { type:'house', town:'eren' });
  rect('world', 58, 68, 6, 4, T.FIELD); prop('scarecrow', 60, 70);
  prop('stall', 59, 62, { tag:'market' }); prop('stall', 61, 62, { tag:'market' });
  prop('well', 60, 66, { solid:true });
  prop('board', 58, 65, { label:'Anschlagbrett', tag:'board' });
  prop('campfire_static', 57, 61);
  for (let i = 0; i < 12; i++) { ri(51, 71); ri(57, 73); }   // ehem. Zufallskisten: Zufallszüge bleiben, damit ältere Spielstände dieselbe Welt erzeugen
  for (const [x, y] of [[53, 63], [54, 63]]) prop('barrel', x, y, { solid:true, r:9, label:'Bierfass der Taverne' });   // vor der Taverne
  prop('crate', 62, 63, { label:'Marktware' }); prop('crate', 63, 63, { label:'Marktware', v:1 }); prop('sack', 60, 62, { label:'Getreidesack' });
  prop('barrel', 62, 62, { solid:true, r:9, label:'Löschwasser der Schmiede' });
  for (let i = 0; i < 8; i++) prop('fence', 57 + i, 72, { solid:true });

  // ---- Wald ----
  for (let i = 0; i < 1500; i++) {
    const x = ri(70, 118), y = ri(18, 62);
    if (Math.hypot(x - 88, y - 44) < 27 && tileAt('world', x, y) === T.GRASS && chance(0.55)) prop('tree', x, y, { solid:true, r:12, hp:3 });
  }
  for (let i = 0; i < 260; i++) {
    const x = ri(40, 120), y = ri(14, 120);
    if (tileAt('world', x, y) === T.GRASS && chance(0.3)) prop('tree', x, y, { solid:true, r:12, hp:3 });
  }
  for (let i = 0; i < 70; i++) prop('bush', ri(72, 116), ri(20, 60), { harvest:'herb' });
  for (let i = 0; i < 30; i++) prop('bush', ri(44, 70), ri(70, 96), { harvest:'herb' });
  for (let i = 0; i < 45; i++) prop('rock_node', ri(10, 120), ri(10, 122), { harvest:'stone', solid:true });
  prop('camp_ruin', 92, 36, { label:'Verlassenes Jägerlager' });
  prop('fallen_tree', 82, 50, { solid:true });

  // ---- Grubeneingang ----
  rect('world', 59, 15, 7, 6, T.STONE);
  prop('mine_entrance', 62, 18, { solid:false, portal:'mine', label:'Verlassene Grube' });
  prop('cart', 60, 20); prop('crate', 64, 19);

  // ---- Alte Feste ----
  rect('world', 10, 55, 17, 15, T.STONE);
  for (let x = 10; x < 27; x++) { setTile('world', x, 55, T.WALL); if (x < 14 || x > 17) setTile('world', x, 69, T.WALL); }
  for (let y = 55; y < 70; y++) { setTile('world', 10, y, T.WALL); if (y < 60 || y > 64) setTile('world', 26, y, T.WALL); }
  rect('world', 13, 58, 4, 4, T.WALL); rect('world', 14, 59, 2, 2, T.PLANK);
  for (let i = 0; i < 14; i++) setTile('world', ri(11, 25), ri(56, 68), T.DIRT);
  prop('banner_torn', 16, 57); prop('banner_torn', 22, 57);
  prop('claim_stone', 18, 62, { label:'Alte Feste', claim:true });
  for (let i = 0; i < 10; i++) prop('rubble', ri(11, 25), ri(56, 68));

  // ---- Friedhof ----
  rect('world', 30, 92, 9, 9, T.ASH);
  for (let i = 0; i < 12; i++) prop('gravestone', ri(31, 38), ri(93, 100), { solid:false });
  prop('crypt', 34, 96, { solid:true, label:'Alte Gruft' });

  // ---- Schrein ----
  rect('world', 74, 50, 5, 5, T.STONE);
  prop('shrine', 76, 52, { label:'Waldschrein', tag:'shrine' });
  prop('torch', 74, 50, {}); prop('torch', 78, 54, {});

  // ---- Banditenlager ----
  rect('world', 62, 112, 10, 9, T.DIRT);
  prop('campfire_static', 66, 116);
  for (let i = 0; i < 5; i++) prop('tent_prop', ri(63, 70), ri(113, 119), { solid:true });
  for (let i = 0; i < 16; i++) prop('palisade_prop', 62 + i % 10, i < 10 ? 112 : 120, { solid:true });
  for (let i = 0; i < 6; i++) prop('crate', ri(63, 70), ri(113, 119));

  // ---- Kleine Ruine ----
  rect('world', 37, 37, 7, 7, T.STONE);
  for (let i = 0; i < 9; i++) prop('rubble', ri(37, 43), ri(37, 43));
  prop('broken_pillar', 40, 40, { solid:true });
  prop('chest', 41, 42, { loot:['potion','longsword'], label:'Alte Truhe' });

  // ---- Nordfurt (Randstadt) ----
  rect('world', 112, 50, 14, 13, T.STONE);
  for (let x = 112; x < 126; x++) setTile('world', x, 50, T.WALL);
  house('world', 114, 53, 5, 4, 'S', { type:'kontor', town:'northcity' }); house('world', 120, 53, 5, 4, 'S', { type:'barracks', town:'northcity' });
  prop('sign', 113, 57, { label:'Nordfurt — Tor' });

  // Moorruine mit Grabsiegel
  prop('marsh_ruin', 48, 104, { label:'Versunkener Stein', loot:['grave_seal'] });

  // ======================================================================
  //  DAS GRENZLAND VON EORL — große, zusammenhängende Welt (512×512)
  //  Greenmark ist nur die Heimat im Nordwesten. Dahinter liegen Großregionen,
  //  durch bewussten Raum getrennt: Reisen → Entdecken → Risiko → Belohnung.
  // ======================================================================
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (protectedNW(x, y)) continue;
    const idx = y * w + x; if (tiles[idx] !== T.GRASS) continue;   // handgebaute Kacheln nie überschreiben
    const base = BIOME[biomeAt(x, y)];
    if (base !== T.GRASS) tiles[idx] = base;
  }

  // ---- Große Gewässer: Südmeer, Inseln, Bergseen, Ostfluss ----
  for (let x = 0; x < w; x++) { const line = 476 + Math.round(Math.sin(x / 20) * 4); for (let y = line; y < h; y++) setTile('world', x, y, T.WATER); }
  for (let x = 0; x < w; x++) { const line = 476 + Math.round(Math.sin(x / 20) * 4); for (let y = line - 3; y < line; y++) if (tileAt('world', x, y) !== T.WATER) setTile('world', x, y, T.SAND); }
  blob('world', 90, 500, 16, T.GRASS, 0.9); blob('world', 300, 505, 12, T.SAND, 0.85);   // Inseln (Insel-Kerne)
  blob('world', 90, 500, 12, T.GRASS, 0.7);
  blob('world', 250, 120, 10, T.WATER, 0.8); blob('world', 300, 300, 13, T.WATER, 0.8);    // Bergsee, Mittelsee
  blob('world', 175, 200, 9, T.WATER, 0.75);
  for (let y = 40; y < 476; y++) { const rx = 300 + Math.round(Math.sin(y / 30) * 6); if (tileAt('world', rx, y) !== T.ASH) { setTile('world', rx, y, T.WATER); setTile('world', rx + 1, y, T.WATER); } }  // Ostfluss

  // ---- Straßennetz: die großen Handelsstraßen ----
  const road = (x0, y0, x1, y1, wob = 1) => {                 // grobe Straße mit Knick
    prop('waysign', x0 + 2, y0 + 2, { solid: true, r: 6, label: 'Wegweiser' });
    const mx = x1, my = Math.round((y0 + y1) / 2) + 3;          // Knickpunkt: Rast oder Überfall
    if (tileAt('world', mx, my) !== T.WATER) scene(regionAt(mx, my) === 'blight' || regionAt(mx, my) === 'badland' ? 'wreck' : 'shrine', mx + 3, my);
    let x = x0, y = y0;
    const step = () => { const t = tileAt('world', x, y); if (t !== T.WATER) setTile('world', x, y, t === T.ASH ? T.DIRT : T.ROAD); else { setTile('world', x, y, T.PLANK); setTile('world', x, y + 1, T.PLANK); } };
    while (x !== x1) { step(); if (wob && chance(0.3)) setTile('world', x, y + 1, tileAt('world', x, y + 1) === T.WATER ? T.PLANK : T.ROAD); x += x < x1 ? 1 : -1; }
    while (y !== y1) { step(); if (wob && chance(0.3)) setTile('world', x + 1, y, tileAt('world', x + 1, y) === T.WATER ? T.PLANK : T.ROAD); y += y < y1 ? 1 : -1; }
  };
  road(118, 64, 380, 90);           // Oststraße: Nordfurt → Aschfurt
  road(64, 74, 118, 300);           // Südstraße: Eren → Steinbrücke-Region
  road(118, 300, 150, 448);         // weiter zur Küste: → Salzhafen
  road(120, 250, 250, 250);         // Mittellandstraße West
  road(250, 250, 445, 275);         // Mittellandstraße Ost → Ostmark/Sonnwacht
  road(250, 64, 250, 250);          // Nordachse: Nordgebirge → Mittelland
  road(330, 360, 410, 410, 0);      // Aschenpfad ins Totenreich (kein Wobble, karg)
  prop('sign', 110, 300, { label:'Steinbrücke' });
  for (let i = 0; i < 6; i++) prop('rubble', ri(105, 113), ri(296, 306));

  // ---- Wälder: dichte Baumgürtel je Biom ----
  const forestBelt = (cx, cy, r, n, kind = 'tree') => { for (let i = 0; i < n; i++) { const x = cx + ri(-r, r), y = cy + ri(-r, r);
    if (Math.hypot(x - cx, y - cy) < r && tileAt('world', x, y) === T.GRASS && chance(0.5)) prop(kind, x, y, kind === 'tree' ? { solid:true, r:12, hp:3 } : {}); } };
  forestBelt(60, 300, 60, 1600);    // Westwald
  forestBelt(60, 300, 34, 1800);    // Westwald-Kern: dichter, dunkler Hochwald
  forestBelt(210, 200, 46, 600);    // Mittellandhaine
  forestBelt(150, 150, 40, 500);    // Übergangswald
  for (let i = 0; i < 140; i++) prop('bush', ri(20, 120), ri(240, 360), { harvest:'herb' });

  // ---- Salzhafen: große Hafenstadt an der Südküste ----
  rect('world', 138, 438, 26, 24, T.DIRT);
  for (let x = 138; x < 164; x++) setTile('world', x, 450, T.ROAD);
  house('world', 140, 440, 6, 5, 'S', { type:'kontor', town:'saltport' }); prop('sign', 145, 445, { label:'Salzhafen — Kontor', tag:'harbor' });
  house('world', 150, 440, 5, 4, 'S', { type:'house', town:'saltport' }); house('world', 158, 440, 5, 4, 'S', { type:'barracks', town:'saltport' });
  house('world', 140, 452, 5, 4, 'N', { type:'house', town:'saltport' }); house('world', 152, 452, 6, 5, 'N', { type:'tavern', town:'saltport' });
  prop('stall', 147, 449, { tag:'market' }); prop('stall', 149, 449, { tag:'market' });
  prop('well', 150, 451, { solid:true }); prop('board', 145, 450, { label:'Anschlagbrett', tag:'board' });
  for (let i = 0; i < 12; i++) { ri(139, 162); ri(439, 461); }   // RNG-Folge stabil (s. Eren)
  for (const [x, y, k] of [[145, 462, 'crate'], [145, 461, 'crate'], [148, 462, 'sack'], [155, 462, 'crate'], [157, 462, 'barrel'], [158, 462, 'sack']])   // Umschlag an den Stegen
    prop(k, x, y, { solid: k !== 'sack', r: 9, label: k === 'sack' ? 'Salzsack' : 'Hafenfracht', v: (x + y) % 3 });
  for (let d = 0; d < 8; d++) { setTile('world', 146, 463 + d, T.PLANK); setTile('world', 147, 463 + d, T.PLANK); setTile('world', 156, 463 + d, T.PLANK); }   // Stege
  prop('cart', 142, 460); prop('campfire_static', 159, 458);

  // ---- Kreuzweg: Söldnerstadt im Herzen des Mittellands ----
  rect('world', 240, 240, 22, 18, T.DIRT);
  for (let x = 240; x < 262; x++) setTile('world', x, 250, T.ROAD);
  house('world', 242, 242, 6, 5, 'S', { type:'tavern', town:'kreuzweg' }); prop('sign', 247, 247, { label:'Kreuzweg — Rasthaus', tag:'tavern' });
  house('world', 250, 242, 5, 4, 'S', { type:'house', town:'kreuzweg' }); house('world', 256, 243, 5, 4, 'W', { type:'smithy', town:'kreuzweg' });
  house('world', 242, 252, 5, 4, 'N', { type:'house', town:'kreuzweg' }); house('world', 254, 251, 6, 5, 'N', { type:'merc', town:'kreuzweg' });
  prop('stall', 248, 249, { tag:'market' }); prop('stall', 250, 249, { tag:'market' });
  prop('well', 250, 247, { solid:true }); prop('board', 246, 250, { label:'Anschlagbrett', tag:'board' });
  prop('anvil', 253, 246, { tag:'smithy', solid:true });
  for (let i = 0; i < 10; i++) { ri(241, 260); ri(241, 257); }   // RNG-Folge stabil (s. Eren)
  for (const [x, y, k] of [[247, 248, 'crate'], [251, 248, 'crate'], [252, 248, 'sack'], [243, 247, 'barrel'], [244, 247, 'barrel']])   // Marktstände, Rasthaus
    prop(k, x, y, { solid: k !== 'sack', r: 9, label: k === 'barrel' ? 'Fass des Rasthauses' : 'Marktware', v: (x + y) % 3 });

  // ---- Aschfurt: befestigter Grenzposten (Händlerland) ----
  rect('world', 372, 84, 16, 16, T.DIRT);
  for (let x = 372; x < 388; x++) { setTile('world', x, 84, T.WALL); if (x < 378 || x > 381) setTile('world', x, 99, T.WALL); }
  for (let y = 84; y < 100; y++) { setTile('world', 372, y, T.WALL); setTile('world', 387, y, T.WALL); }
  house('world', 375, 87, 5, 4, 'S', { type:'kontor', town:'ashford' }); house('world', 381, 87, 5, 4, 'S', { type:'barracks', town:'ashford' });
  prop('stall', 378, 94, { tag:'market' }); prop('well', 380, 96, { solid:true });
  prop('sign', 376, 93, { label:'Aschfurt — Tor' }); prop('board', 382, 94, { label:'Anschlagbrett', tag:'board' });
  prop('watchtower_ruin', 373, 85, { solid:true });

  // ---- Sonnwacht: Feste des Ordens im Osten (Fraktionsgebiet) ----
  rect('world', 446, 246, 20, 20, T.STONE);
  for (let x = 446; x < 466; x++) { setTile('world', x, 246, T.WALL); if (x < 453 || x > 458) setTile('world', x, 265, T.WALL); }
  for (let y = 246; y < 266; y++) { setTile('world', 446, y, T.WALL); setTile('world', 465, y, T.WALL); }
  house('world', 449, 249, 6, 5, 'S', { type:'chapel', town:'sonnwacht' }); house('world', 458, 249, 5, 4, 'S', { type:'barracks', town:'sonnwacht' });
  prop('shrine', 456, 256, { label:'Schrein des Ordens', tag:'shrine' });
  prop('torch', 450, 248, {}); prop('torch', 462, 248, {});
  prop('banner_torn', 450, 246); prop('sign', 454, 261, { label:'Sonnwacht — Feste des Ordens' });
  prop('watchtower_ruin', 447, 247, { solid:true }); prop('watchtower_ruin', 463, 247, { solid:true });
  prop('chest', 456, 258, { loot:['order_seal', 'potion'], label:'Ordenskapelle' });

  // ---- Frostkamm & Tiefhall: nördliches Hochgebirge ----
  for (let i = 0; i < 140; i++) blob('world', ri(180, 380), ri(6, 60), ri(3, 8), T.ROCK, 0.72);
  rect('world', 244, 32, 12, 10, T.DFLOOR);
  prop('mine_entrance', 250, 36, { solid:false, label:'Tiefhall', tag:'delve' });
  prop('chest', 250, 34, { loot:['plate_cuirass', 'iron', 'iron'], label:'Tiefhall-Hort' });
  for (let i = 0; i < 24; i++) prop('ore_node', ri(200, 360), ri(8, 56), { harvest:'iron', solid:true });
  prop('banner_torn', 330, 24); prop('camp_ruin', 300, 50, { label:'Erfrorenes Lager' });

  // ---- Rote Wüste: Dünen und Mesas im Osten ----
  for (let i = 0; i < 60; i++) blob('world', ri(380, 500), ri(90, 220), ri(3, 6), T.ROCK, 0.55);   // Mesas
  for (let i = 0; i < 90; i++) prop('dead_tree', ri(380, 500), ri(90, 220), { solid:true });
  for (let i = 0; i < 40; i++) prop('rock_node', ri(380, 500), ri(90, 220), { harvest:'stone', solid:true });
  prop('camp_ruin', 430, 150, { label:'Verbrannte Karawane' });
  prop('chest', 470, 180, { loot:['greatsword', 'iron', 'potion'], label:'Wüstengruft' });

  // ---- Wolfsschlucht: gefährliche Felsschlucht im Westen ----
  blob('world', 44, 300, 16, T.ROCK, 0.7); rect('world', 40, 296, 10, 10, T.DIRT);
  for (let i = 0; i < 14; i++) prop('rock_node', ri(36, 54), ri(292, 310), { harvest:'stone', solid:true });
  for (let i = 0; i < 8; i++) prop('bone', ri(40, 50), ri(296, 306));
  prop('chest', 45, 300, { loot:['longbow', 'potion'], label:'Räuberversteck' });
  prop('fallen_tree', 48, 305, { solid:true });

  // ---- Südsumpf & Versunkener Tempel ----
  for (let i = 0; i < 40; i++) blob('world', ri(90, 200), ri(380, 450), ri(1, 3), T.WATER, 0.7);
  for (let y = 438; y < 463; y++) for (let x = 138; x < 164; x++) if (tileAt('world', x, y) === T.WATER) setTile('world', x, y, T.DIRT);   // Sumpflöcher nicht in Salzhafen (ohne Zufall)
  rect('world', 136, 406, 9, 9, T.STONE);
  prop('marsh_ruin', 140, 410, { label:'Versunkener Tempel' });
  for (let i = 0; i < 6; i++) prop('broken_pillar', ri(136, 145), ri(406, 415), { solid:true });
  prop('chest', 142, 412, { loot:['staff', 'potion', 'order_seal'], label:'Tempelkammer' });
  for (let i = 0; i < 10; i++) prop('gravestone', ri(132, 150), ri(404, 418));

  // ======================================================================
  //  DAS TOTENREICH — großes, zusammenhängendes Untoten-Einflussgebiet (SO)
  //  Verseuchte Asche, ruinierte Stadt, Nekropole, Nekromanten-Türme, Feste.
  // ======================================================================
  for (let i = 0; i < 40; i++) prop('dead_tree', ri(320, 500), ri(340, 470), { solid:true });   // toter Wald
  for (let i = 0; i < 30; i++) prop('gravestone', ri(320, 500), ri(340, 470));
  // sichtbare Grenze zur Ostmark
  for (let y = 320; y < 400; y++) { const bx = 322 + Math.round(Math.sin(y / 12) * 3); prop('bone_spire', bx, y, { solid:true }); y += 6; }

  // Alt-Vharn: ruinierte Stadt der Untoten
  rect('world', 350, 372, 24, 18, T.ASH);
  for (let x = 350; x < 374; x++) if (chance(0.6)) setTile('world', x, 372, T.DWALL);
  for (let y = 372; y < 390; y++) if (chance(0.6)) setTile('world', 350, y, T.DWALL);
  for (let i = 0; i < 16; i++) prop('rubble', ri(351, 372), ri(373, 388));
  for (let i = 0; i < 8; i++) prop('broken_pillar', ri(352, 371), ri(374, 388), { solid:true });
  prop('crypt', 360, 380, { solid:true, label:'Alt-Vharn — Gruft' });
  prop('chest', 362, 382, { loot:['grave_seal', 'chain_hauberk'], label:'Gruft von Alt-Vharn' });
  prop('sign', 356, 390, { label:'Alt-Vharn — was von der Stadt blieb' });

  // Nekromanten-Türme (zwei Wachtürme des Reichs)
  const necroTower = (tx, ty) => { rect('world', tx - 1, ty - 1, 3, 3, T.DWALL); prop('obelisk', tx, ty, { solid:true, label:'Nekromanten-Turm' });
    prop('torch', tx - 2, ty, {}); prop('torch', tx + 2, ty, {}); prop('bone_spire', tx, ty + 3, { solid:true }); };
  necroTower(392, 348); necroTower(452, 402);

  // Nekropole: großes Gräberfeld
  rect('world', 396, 430, 20, 16, T.ASH);
  for (let i = 0; i < 30; i++) prop('gravestone', ri(397, 415), ri(431, 445));
  prop('crypt', 404, 437, { solid:true, label:'Große Nekropole', rite:'urn' });   // Gruft der Ahnenurne (Pakt der Stillen Schar)
  prop('obelisk', 400, 433, { solid:true });

  // Die Schwarze Feste: Thron der Stillen Schar
  rect('world', 420, 418, 24, 24, T.ASH);
  for (let x = 420; x < 444; x++) { setTile('world', x, 418, T.DWALL); if (x < 428 || x > 433) setTile('world', x, 441, T.DWALL); }
  for (let y = 418; y < 442; y++) { setTile('world', 420, y, T.DWALL); setTile('world', 443, y, T.DWALL); }
  rect('world', 427, 425, 9, 9, T.DFLOOR);
  prop('crypt', 431, 430, { solid:true, label:'Thron der Stillen Schar' });
  prop('bone_spire', 423, 421, { solid:true }); prop('bone_spire', 440, 421, { solid:true });
  prop('bone_spire', 423, 438, { solid:true }); prop('bone_spire', 440, 438, { solid:true });
  prop('obelisk', 431, 436, { solid:true, label:'Nekromantischer Obelisk' });
  prop('torch', 427, 423, {}); prop('torch', 435, 423, {});
  prop('banner_torn', 427, 418); prop('banner_torn', 435, 418);
  prop('chest', 431, 432, { loot:['grave_seal', 'potion', 'plate_cuirass'], label:'Grabkammer der Feste' });

  const handMark = props.length;                           // ab hier: Streugut (Szenen, Haine, Verstecke, Lager, Geröll)
  placeScenes();
  regionClusters();

  // ======================================================================
  //  ENTDECKEN — Streugut der Wildnis: nicht jeder Ort trägt eine Quest.
  // ======================================================================
  const inWild = (x, y) => !protectedNW(x, y) && ![T.WATER, T.ROAD, T.PLANK, T.WALL, T.DWALL].includes(tileAt('world', x, y));
  const cacheLoot = [['potion','longsword'], ['kite_shield','iron'], ['bandage','herb','herb'], ['dried_meat','bread'],
    ['chain_hauberk'], ['longbow'], ['iron_helm','potion'], ['mace','bandage'], ['leather_jerkin','bread']];
  // Verstecke: nie eine Truhe allein im Nichts — jede hat eine kleine Geschichte, die ihren Fundort erklärt
  const CACHE = {
    traveler: (x, y, loot) => { prop('chest', x, y, { loot, label: 'Bündel eines toten Reisenden' }); prop('bones', x + 1, y + 1, { r: 6 }); prop('blood', x - 1, y + 1, { r: 4 }); },
    roots:    (x, y, loot) => { prop('fallen_tree', x, y - 1, { solid: true }); prop('chest', x + 1, y, { loot, label: 'Versteck unter Wurzeln' }); },
    camp:     (x, y, loot) => { prop('camp_ruin', x, y, { label: 'Kaltes Lager' }); prop('firepit', x + 2, y, { r: 8 }); prop('chest', x - 1, y + 1, { loot, label: 'Zurückgelassene Truhe' }); },
    smuggler: (x, y, loot) => { prop('broken_pillar', x, y, { solid: true }); prop('rubble', x + 1, y + 1); prop('chest', x - 1, y, { loot, label: 'Schmugglerversteck' }); },
  };
  let placed = 0;
  for (let i = 0; i < 900 && placed < 60; i++) {
    const x = ri(20, 500), y = ri(20, 500);
    if (inWild(x, y) && Math.hypot(x - 70, y - 70) > 60) { CACHE[pick(Object.keys(CACHE))](x, y, pick(cacheLoot)); placed++; }
  }
  for (let i = 0; i < 500; i++) {                          // verlassene Lager (Umgebungsstorytelling): Feuer, Habe, manchmal Spuren
    const x = ri(20, 500), y = ri(20, 500);
    if (inWild(x, y) && chance(0.5)) { prop('camp_ruin', x, y, { label: pick(['Verlassenes Lager', 'Ausgebranntes Feuer', 'Zurückgelassene Habe']) });
      if (chance(0.4)) { prop('crate', x + ri(1, 2), y + ri(-1, 1), { loot: pick(cacheLoot), label: 'Zurückgelassene Kiste' }); prop('firepit', x - 2, y + 1, { r: 8 }); }
      else if (nz(x, y) > 0.7) prop('bones', x + 1, y + 2, { r: 6 }); }   // Hash statt Zufall: RNG-Folge stabil
  }
  for (let i = 0; i < 400; i++) {                          // Ruinen und Säulen
    const x = ri(20, 500), y = ri(20, 500);
    if (inWild(x, y) && chance(0.4)) prop(pick(['broken_pillar', 'rubble', 'gravestone', 'fallen_tree']), x, y, { solid: chance(0.5) });
  }
  for (let i = 0; i < 260; i++) { const x = ri(20, 500), y = ri(20, 500); if (inWild(x, y)) prop('rock_node', x, y, { harvest:'stone', solid:true }); }
  for (let i = 0; i < 200; i++) { const x = ri(20, 300), y = ri(120, 460); if (tileAt('world', x, y) === T.GRASS) prop('bush', x, y, { harvest:'herb' }); }

  pactScenes();
  const wild = new Set(props.slice(handMark));
  resampleWorld();                                         // Entwurf → Weltmaßstab (ohne rnd())
  phase = 'world';
  expandTowns(wild);                                       // zuletzt und ohne rnd(): Zufallsfolge oben bleibt stabil

  // Lichtungen entstehen nach dem Wald: Bäume nur auf Gras stehen lassen
  // Bäume nicht auf Wegen, Lichtungen, Feldern oder in Mauern (Wüste, Asche, Sumpf, Gebirge dürfen tragen)
  const noTree = new Set([T.DIRT, T.ROAD, T.PLANK, T.FIELD, T.WATER, T.WALL, T.DWALL, T.ROCK, T.DFLOOR]);
  for (const p of props) delete p._d;                        // nur für den Umzug gebraucht, nicht speichern
  return props.filter(p => p.type !== 'tree' || !noTree.has(tileAt('world', p.x / TS | 0, p.y / TS | 0)));
}

// ---------------- Hochrechnung Entwurf → Weltmaßstab (Session 5) ----------------
// Gelände: nächster Nachbar (Straßen, Flüsse, Mauern werden 1–2 Kacheln breit). Props: auf die Mitte ihrer Entwurfskachel,
// die Entwurfskachel bleibt als _d erhalten (Stadtumzug). Zäune und Palisaden werden lückenlos nachgezogen. Wälder würden
// um den Faktor WS² dünner: je Baum entsteht mit Wahrscheinlichkeit 1/2 ein zweiter in der Zwischenkachel (Hash, kein rnd()).
function resampleWorld() {
  const D = MAPS.world, W = Math.round(D.w * WS), H = Math.round(D.h * WS), t = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) { const row = Math.min(D.h - 1, dT(y)) * D.w;
    for (let x = 0; x < W; x++) t[y * W + x] = D.tiles[row + Math.min(D.w - 1, dT(x))]; }
  MAPS.world = { w: W, h: H, tiles: t, design: { w: D.w, h: D.h } };
  const line = { fence: new Map(), palisade_prop: new Map() }, taken = new Set(), K = (x, y) => x + ',' + y;
  for (const p of props) {
    if ((p.map || 'world') !== 'world') continue;
    const dx = p.x / TS | 0, dy = p.y / TS | 0; p._d = [dx, dy];
    p.x = wT(dx) * TS + TS / 2; p.y = wT(dy) * TS + TS / 2; taken.add(K(wT(dx), wT(dy)));
    if (line[p.type]) line[p.type].set(K(dx, dy), p);
  }
  for (const [type, m] of Object.entries(line)) for (const [k, p] of m) {
    const [dx, dy] = p._d;
    for (const [ox, oy] of [[1, 0], [0, 1]]) { if (!m.has(K(dx + ox, dy + oy))) continue;
      for (let i = (ox ? wT(dx) : wT(dy)) + 1; i < (ox ? wT(dx + 1) : wT(dy + 1)); i++) {
        const x = ox ? i : wT(dx), y = ox ? wT(dy) : i;
        if (!taken.has(K(x, y))) { taken.add(K(x, y)); prop(type, 0, 0, { ...p, id: uid(), x: x * TS + TS / 2, y: y * TS + TS / 2, _d: [dT(x), dT(y)] }); } } }
  }
  const trees = props.filter(p => p.type === 'tree' && (p.map || 'world') === 'world');
  for (const p of trees) {
    const [dx, dy] = p._d; if (nz(dx * 3 + 1, dy * 7 + 2) < 0.5) continue;
    const x = wT(dx) + (nz(dx, dy) < 0.5 ? 1 : 0), y = wT(dy) + (nz(dx, dy) < 0.5 ? 0 : 1);
    if (x >= W || y >= H || taken.has(K(x, y)) || tileAt('world', x, y) !== T.GRASS) continue;
    taken.add(K(x, y)); prop('tree', 0, 0, { solid: true, r: 12, hp: 3, x: x * TS + TS / 2, y: y * TS + TS / 2, _d: [dT(x), dT(y)] });
  }
}

// ---------------- Totenreich: Orte des Paktes (Session 4) ----------------
// Die leeren Flächen um Alt-Vharn und den Nekromanten-Turm bekommen, was die Questkette dort braucht: Ysras Ahnenaltar
// mit Namenssteinen, Vhals Schattenkreis. Ohne rnd() und nach allem anderen; pactScene markiert sie für die Migration.
export function pactScenes() {
  const P = (t, x, y, o = {}) => prop(t, x, y, { pactScene: true, ...o });
  // Ahnenaltar vor der Gruft von Alt-Vharn: Ysra hält hier die Namen der Toten
  P('obelisk', 357, 384, { solid: true, r: 10, label: 'Ahnenaltar' }); P('candles', 356, 385, { r: 6 }); P('candles', 358, 385, { r: 6 });
  for (let i = 0; i < 5; i++) P('gravestone', 362 + i, 387, { label: 'Namensstein' });
  P('bones', 355, 383, { r: 6 }); P('torch', 354, 384); P('torch', 368, 384);
  // Schattenkreis am Nekromanten-Turm: Vhal flüstert aus dem Obelisken
  for (const [dx, dy] of [[-3, 1], [3, 1], [-2, 4], [2, 4], [0, 5]]) P('standing_stone', 392 + dx, 348 + dy, { solid: true, r: 8, label: 'Schattenstein' });
  P('candles', 391, 352, { r: 6 }); P('candles', 393, 352, { r: 6 }); P('blood', 393, 354, { r: 4 });
}

// ---------------- Grube (Dungeon) ----------------
export function genMine() {
  props.length = 0;
  seedRng(S.seed * 7 + 13);
  const w = 64, h = 64, tiles = new Uint8Array(w * h).fill(T.DWALL);
  MAPS.mine = { w, h, tiles };
  const rooms = [];
  function room(x, y, rw, rh, tag) { rect('mine', x, y, rw, rh, T.DFLOOR); const r = { x, y, w:rw, h:rh, cx:x + (rw >> 1), cy:y + (rh >> 1), tag }; rooms.push(r); return r; }
  function corr(a, b) {
    let x = a.cx, y = a.cy;
    while (x !== b.cx) { setTile('mine', x, y, T.DFLOOR); setTile('mine', x, y + 1, T.DFLOOR); x += x < b.cx ? 1 : -1; }
    while (y !== b.cy) { setTile('mine', x, y, T.DFLOOR); setTile('mine', x + 1, y, T.DFLOOR); y += y < b.cy ? 1 : -1; }
  }
  const entry   = room(28, 54, 8, 7, 'entry');
  const storage = room(16, 50, 7, 6, 'storage');
  const tunnel  = room(27, 40, 10, 8, 'tunnel');
  const gobl    = room(40, 34, 11, 9, 'goblin');
  const collapse= room(16, 33, 8, 7, 'collapsed');
  const forge   = room(26, 22, 12, 9, 'forge');
  const secret  = room(46, 20, 6, 5, 'secret');
  const boss    = room(24, 8, 16, 11, 'boss');
  const treasure= room(44, 6, 9, 8, 'treasure');
  corr(entry, storage); corr(entry, tunnel); corr(tunnel, gobl); corr(tunnel, collapse);
  corr(tunnel, forge); corr(gobl, secret); corr(forge, boss); corr(boss, treasure); corr(secret, treasure);

  prop('mine_exit', entry.cx, entry.y + entry.h - 1, { map:'mine', portal:'world', label:'Ausgang' });
  for (let i = 0; i < 8; i++) prop('torch', ri(entry.x + 1, entry.x + entry.w - 2), ri(entry.y + 1, entry.y + entry.h - 2), { map:'mine' });
  for (const r of rooms) {
    for (let i = 0; i < 3; i++) prop('torch', ri(r.x, r.x + r.w - 1), ri(r.y, r.y + r.h - 1), { map:'mine' });
    for (let i = 0; i < ri(2, 5); i++) prop('ore_node', ri(r.x, r.x + r.w - 1), ri(r.y, r.y + r.h - 1), { map:'mine', harvest:'iron', solid:true });
  }
  for (let i = 0; i < 6; i++) prop('crate', ri(storage.x + 1, storage.x + storage.w - 2), ri(storage.y + 1, storage.y + storage.h - 2), { map:'mine', loot:['bread','bandage'] });
  prop('anvil', forge.cx, forge.cy, { map:'mine', solid:true, label:'Alte Esse' });
  prop('chest', forge.cx + 3, forge.cy + 2, { map:'mine', loot:['order_seal'], label:'Verschütteter Ordenskasten' });
  prop('chest', treasure.cx, treasure.cy, { map:'mine', loot:['plate_cuirass','potion','potion'], label:'Schatzkammer' });
  prop('chest', secret.cx, secret.cy, { map:'mine', loot:['kite_shield','iron'], label:'Verborgener Vorrat' });
  prop('spikes', collapse.cx, collapse.cy, { map:'mine', hazard:14 });
  prop('spikes', collapse.cx + 2, collapse.cy + 1, { map:'mine', hazard:14 });
  prop('spikes', tunnel.cx + 3, tunnel.cy - 2, { map:'mine', hazard:12 });

  MAPS.mine.rooms = rooms;
  MAPS.mine.entry = { x: entry.cx * TS, y: (entry.y + entry.h - 3) * TS };
  return props.slice();
}

// Feste Objekte (Bäume, Felsen, Gebäude) kennt nur game.js (Objekt-Index); es trägt hier die Prüfung ein.
export const occupied = { at: null };                // (map, tx, ty) → true, wenn ein festes Objekt auf der Kachel steht
export function freeSpotNear(map, tx, ty, radius = 6) {
  for (let i = 0; i < 200; i++) {
    const x = tx + ri(-radius, radius), y = ty + ri(-radius, radius);
    if (!SOLID.has(tileAt(map, x, y)) && !(occupied.at && occupied.at(map, x, y))) return { x: x * TS + TS / 2, y: y * TS + TS / 2 };
  }
  return { x: tx * TS, y: ty * TS };
}
