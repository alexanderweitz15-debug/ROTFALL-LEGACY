// Weltgenerierung: Greenmark-Grenzland (128x128) und die Verlassene Grube.
import { S, rnd, ri, pick, chance, seedRng, uid, setPropBase } from './state.js?v=21';
import { FURNISH, wearOf } from './buildings.js?v=21';

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
  { key:'knochenwald',name:'Knochenwald',       x:470,y:366,r:18, kind:'wild',    threat:3, faction:'undead' },
  { key:'aschensee', name:'Aschensee',          x:318,y:438,r:12, kind:'wild',    threat:3, faction:'undead' },
  { key:'vharnholm', name:'Vharnholm',          x:487,y:443,r:10, kind:'city',    threat:1, faction:'undead' },
  { key:'grove',     name:'Alter Hain',         x:80, y:288,r:6,  kind:'shrine',  threat:1 },
  { key:'grenzwacht',name:'Grenzwacht',         x:330,y:350,r:8,  kind:'camp',    threat:1, faction:'valen' },
  { key:'hundertfeld',name:'Hundertfeld',       x:340,y:402,r:10, kind:'ruin',    threat:3 },
  { key:'mistisle',  name:'Nebelinsel',         x:90, y:500,r:12, kind:'wild',    threat:2 },
];

export function locAt(tx, ty) {
  const town = townAt(tx, ty); if (town) return LOCATIONS.find(l => l.key === town);   // ausgebaute Siedlung: ganzer Plan
  let best = null, bd = 1e9;
  for (const l of LOCATIONS) { if (l.fin && !SHIFT) continue;
    const d = Math.hypot(l.x - tx, l.y - ty);
    if (d < l.r && d < bd) { bd = d; best = l; }
  }
  return best;
}
export function nearestLocations(tx, ty, n = 4) {
  return LOCATIONS.filter(l => SHIFT || !l.fin).map(l => ({ l, d: Math.hypot(l.x - tx, l.y - ty) }))
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

// S15 (Nutzer): Morrgrund — das letzte freie Dorf der Grubenstämme, weit im Süden der Westlande, im Moor versteckt.
// Palisade aus angespitzten Stämmen, Hütten um ein Feuer, ein Totem mit Kettengliedern, die sie sich abgeschlagen haben.
// Feste Koordinaten, kein rnd(): die Weltfolge bleibt gleich. Wächst, wenn die Eisenfeste fällt (game.js morrGrow).
export const MORR = { x: 276, y: 622, x0: 262, y0: 610, x1: 291, y1: 635 };
// S15 P6: der Turm des Nachtglases (Ilvar). Steinplatz, Ring aus Grabsteinen, Knochenspitzen am Weg, der Turm selbst ist ein hohes
// Bild (render.js drawMageTower) über einem festen Sockel aus Fels. Das Tor davor führt in die Karte 'tower'.
export const NACHT = { x: 953, y: 630 };
function buildNachtglas() {
  const { x, y } = NACHT;
  for (let i = props.length - 1; i >= 0; i--) { const p = props[i], tx = p.x / TS | 0, ty = p.y / TS | 0; if (p.map === 'world' && Math.abs(tx - x) <= 11 && Math.abs(ty - y) <= 11) props.splice(i, 1); }
  rect('world', x - 10, y - 9, 21, 20, T.STONE);
  rect('world', x - 5, y - 4, 11, 4, T.ROCK);                             // Sockel: fest
  for (let k = 0; k < 16; k++) { const a = k * 0.3927; if (Math.abs(Math.sin(a) - 1) < 0.3) continue;   // Grabsteinring, im Süden offen
    prop('gravestone', Math.round(x + Math.cos(a) * 9), Math.round(y + Math.sin(a) * 8), { solid: true, r: 7 }); }
  for (const dy of [4, 7, 10]) for (const dx of [-2, 2]) prop('bone_spire', x + dx, y + dy, { solid: true, r: 8 });
  prop('mage_tower', x, y - 1, { r: 10, label: 'Turm des Nachtglases' });
  prop('tower_gate', x, y + 1, { solid: true, r: 12, portal: 'tower', label: 'Tor des Turms' });
  prop('sign', x + 4, y + 3, { label: 'In grünem Licht: „Wer lernen will, trete ein. Wer stehlen will, auch — einmal.“' });
  for (const dx of [-5, 5]) prop('candles', x + dx, y + 2, { r: 6 });
}
function buildMorrgrund() {
  const { x0, y0, x1, y1, x, y } = MORR;
  for (let i = props.length - 1; i >= 0; i--) { const p = props[i], tx = p.x / TS | 0, ty = p.y / TS | 0; if (p.map === 'world' && tx >= x0 - 1 && tx <= x1 + 1 && ty >= y0 - 1 && ty <= y1 + 1) props.splice(i, 1); }
  rect('world', x0, y0, x1 - x0 + 1, y1 - y0 + 1, T.DIRT);
  for (let tx = x0; tx <= x1; tx += 2) for (const ty of [y0, y1]) if (Math.abs(tx - x) > 2 || ty === y0) prop('palisade_prop', tx, ty, { solid: true, r: 14 });   // Tor im Süden
  for (let ty = y0 + 2; ty < y1; ty += 2) for (const tx of [x0, x1]) prop('palisade_prop', tx, ty, { solid: true, r: 14 });
  for (const [hx, hy] of [[x - 9, y - 7], [x - 1, y - 8], [x + 8, y - 7], [x - 10, y + 1], [x + 9, y + 1], [x - 6, y + 8], [x + 6, y + 8]]) prop('tent_prop', hx, hy, { solid: true, label: 'Goblinhütte', morr: 1 });
  prop('campfire_static', x, y, { solid: true, r: 10 }); prop('sign', x + 1, y1 + 1, { label: 'Morrgrund. (Darunter, in krummer Schrift: „Keine Ketten. Nie wieder.“)' });
  prop('banner_torn', x - 3, y - 3, { label: 'Totem der Grubenstämme — zerbrochene Kettenglieder an einem Pfahl' }); prop('bones', x + 3, y - 3, { r: 6 });
  for (const [bx, by] of [[x - 4, y + 3], [x + 4, y + 3]]) prop('barrel', bx, by, { solid: true, r: 8 });
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
  const cap = Math.max(1, Math.floor((w - 2) * (h - 2) / 2) - 1);   // Phase 1: höchstens halb voll — Bewohner brauchen Laufwege (Magd in Nordstadt saß auf dem Tisch fest)
  for (const [kind, ox, oy] of ruin ? [['rubble', 0, 0], ['debris', -1, 0], ['barrel', -1, -1], ['debris', 1, -1]] : FURNISH[b.type] || []) {
    if (used.size - 1 >= cap) break;
    let tx = ox >= 0 ? x + 1 + ox : x + w - 1 + ox, ty = oy >= 0 ? y + 1 + oy : y + h - 1 + oy;
    const free = (i, j) => i >= x + 1 && i <= x + w - 2 && j >= y + 1 && j <= y + h - 2 && !used.has(i + ',' + j);
    if (!free(tx, ty)) {                            // Platz belegt (z. B. Kachel hinter der Tür): nächste freie Innenkachel —
      const alt = [[tx - 1, ty], [tx + 1, ty], [tx, ty - 1], [tx - 1, ty - 1], [tx + 1, ty - 1]].find(([i, j]) => free(i, j));   // sonst fehlten kleinen Schenken die Bänke
      if (!alt) continue; [tx, ty] = alt;
    }
    used.add(tx + ',' + ty);
    prop(kind, tx, ty, { map, gen: 2, house: b.id, solid: !['candles', 'sack', 'debris'].includes(kind), r: 13 });   // Session 13: größere Möbel, größerer Körper
  }
  // Säle der Monumentalbauten (Phase 5): Möbel in Reihen mit Gängen, Türachse frei, Obergrenze wie oben
  const HALL = { palace: ['column', 'column', 'bench'], markethall: ['stall', 'stall', 'counter'], bank: ['counter', 'chest', 'desk'], academy: ['desk', 'shelf', 'desk'], library: ['shelf', 'shelf', 'desk'],
    court: ['bench', 'bench', 'desk'], hospital: ['bed', 'bed', 'shelf'], bathhouse: ['trough', 'barrel', 'trough'], observatory: ['desk', 'shelf', 'workbench'], magitech: ['workbench', 'gearpile', 'machine'],
    factoryhall: ['machine', 'machine', 'gearpile'], legion: ['bunk', 'bunk', 'weapon_rack'] }[b.type];
  if (HALL && !ruin) { const HC = Math.floor((w - 2) * (h - 2) / 2); let k = 0;
    for (let j = y + 2; j <= y + h - 3; j += 3) for (let i = x + 2; i <= x + w - 3; i += 3) {
      if (Math.abs(i - door[0]) <= 1 || used.has(i + ',' + j) || used.size - 1 >= HC) continue;
      used.add(i + ',' + j); prop(HALL[k++ % HALL.length], i, j, { map, gen: 2, house: b.id, solid: true, r: 12 }); }
    if (b.type === 'palace' || b.type === 'court') prop('throne', x + (w >> 1), y + 1, { map, gen: 2, house: b.id, solid: true, r: 12, label: b.type === 'palace' ? 'Thron im Regierungspalais' : 'Richterstuhl' });
    if (b.type === 'palace') for (const i of [x + 2, x + w - 3]) prop('banner_torn', i, y + 1, { map, gen: 2, house: b.id, label: 'Banner des Hochreichs' });
  }
  // Große Schenke (Session 10, gewachsene Häuser): weitere Tische mit Bank in der hinteren Reihe, Türachse ± 1 bleibt frei
  if (!ruin && b.type === 'tavern' && w >= 8 && h >= 6) for (let i = x + 2; i <= x + w - 3; i += 3) {
    const j = doorSide === 'N' ? y + h - 3 : y + 2 + (h >= 7 ? 2 : 1);
    if (Math.abs(i - door[0]) <= 1 || used.has(i + ',' + j) || used.has(i + ',' + (j + 1))) continue;
    used.add(i + ',' + j); used.add(i + ',' + (j + 1));
    prop('table', i, j, { map, gen: 2, house: b.id, solid: true, r: 10 }); prop('bench', i, j + 1, { map, gen: 2, house: b.id, solid: true, r: 10 });
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
  { x:492, y:372, b:'blight'   },  // Session 5: Totenreich erweitert — Knochenwald bis an die Ostküste
  { x:318, y:440, b:'blight'   },  //            … und westwärts bis zum Aschensee
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
  if (SHIFT && ty >= 700 && (ty >= 768 || spornAt(tx, ty) > 0)) return spornAt(tx, ty) > 0 ? (tx < 480 + (vnE(tx, ty + 300, 30) - 0.5) * 60 ? 'desert' : 'aurel') : tx > 1330 ? 'deadland' : 'aurel';   // S12: Wüstenzipfel, Hochreich, Inseln
  if (SHIFT && tx < SHIFT) { if (westMtnAt(tx, ty)) return 'mountain'; if (tx >= FORT[0] && tx <= FORT[2] && ty >= FORT[1] && ty <= FORT[3]) return 'eisen';
    const [sx, sy] = westSrc(tx, ty); return rawRegion(dT(sx - SHIFT), dT(sy)); }           // S12: Westen — Land setzt sich fort
  if (tx >= SHIFT + 768) { if (tx - SHIFT - 768 > deadBorder(ty)) return 'deadland'; const [sx, sy] = eastSrc(tx - SHIFT, ty); return rawRegion(dT(sx), dT(sy)); }   // S12: Osten
  const k = townAt(tx, ty); return k && !TOWN_PLAN[k].village ? rawRegion(...TOWN_PLAN[k].spread.a) : rawRegion(dT(tx - SHIFT), dT(ty)); };
const westMtn = x => 118 + (vnE(x, 3, 24) - 0.5) * 50;                                 // Südrand des Westgebirges

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
export const seaLine = x => Math.ceil(seaLineD(dT(x - SHIFT)) * WS);   // S12: Welt-x nach der Westverschiebung            // … in Weltkacheln (erste Wasserzeile)
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
  vharnholm: {                                                    // Stadt der Stillen (Session 5): Untote leben hier, handeln, schreiben Namen auf
    area: [468, 424, 506, 462], old: [482, 438, 492, 446], square: [487, 444], spread: { s: 1.3, a: [487, 442] }, perHead: 80,
    outskirts: ['cottage', 'house'],
    streets: [[T.ROAD, 468, 442, 506, 442], [T.ROAD, 487, 424, 487, 462], [T.DIRT, 476, 450, 500, 450], [T.DIRT, 480, 436, 480, 441], [T.DIRT, 497, 436, 497, 441]],
    plazas: [[T.STONE, 482, 438, 492, 446]],
    houses: [['hall', 470, 435, 6, 5, 'S'], ['house', 477, 436, 5, 4, 'S'], ['store', 494, 435, 6, 5, 'S'], ['cottage', 501, 436, 4, 4, 'S'],
      ['smithy', 470, 443, 5, 4, 'N'], ['house', 476, 443, 5, 4, 'N'], ['store', 494, 443, 6, 5, 'N'], ['house', 501, 443, 5, 4, 'N'],
      ['cottage', 481, 451, 4, 4, 'N'], ['house', 491, 451, 5, 4, 'N']],
    props: [['obelisk', 484, 440, { solid: true, label: 'Seelenobelisk von Vharnholm' }], ['stall', 490, 439, { tag: 'market' }], ['sack', 491, 439, { label: 'Knochenmehl' }],
      ['bone_spire', 468, 441, { solid: true, planned: true }], ['bone_spire', 468, 443, { solid: true, planned: true }], ['bone_spire', 506, 441, { solid: true, planned: true }], ['bone_spire', 506, 443, { solid: true, planned: true }],
      ['torch', 486, 437], ['torch', 486, 447], ['candles', 485, 441], ['gravestone', 483, 446, { label: 'Namensstein', planned: true }], ['gravestone', 489, 446, { label: 'Namensstein', planned: true }],
      ['sign', 487, 425, { label: 'Vharnholm — Stadt der Stillen' }], ['crate', 493, 441, { label: 'Grabgut, zurückgebracht' }]],
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
  for (const P of Object.values(TOWN_PLAN)) { if (P.village) continue; const [x0, y0, x1, y1] = P.design.area;
    if (x >= x0 - 2 && x <= x1 + 2 && y >= y0 - 2 && y <= y1 + 2) return [spR(P, x, 0) + OX, spR(P, y, 1)]; }
  return [wT(x) + OX, wT(y)];   // S12: alles rückt um OX nach Osten
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
// Session 11 — die Eisenmark (Nutzerwunsch: größere Welt, Endgame-Fraktion der Sklavenhalter). Ostlich angehängt, schon im
// Weltmaßstab (keine Umrechnung): bestehende Koordinaten und Spielstände bleiben gültig.
export const EAST = 256, EAST2 = 256, SOUTH = 448;   // S12: SOUTH — der Wüstensporn und die Südinseln                                     // S12: zweite Erweiterung — das Grauland hinter der Mark
// Session 12 — Neuordnung (Nutzer: „West Kette, Mitte Menschen, Ost Untote“). Die Karte wächst um OX nach Westen: dort liegen
// Westgebirge, Eisenfeste, Steinbruch, Grubenhort (Goblins) und die Tributdörfer. Die alte Osterweiterung wird zum Totenland.
// fin: schon Weltkoordinaten nach der Verschiebung; alle anderen Orte rücken beim Erzeugen um OX nach rechts (shiftCoords).
export const OX = 256;
let SHIFT = 0;                                                            // 0 während der Erzeugung, danach OX
LOCATIONS.push(
  { key:'westgebirge', name:'Das Westgebirge', x:128, y:56, r:80, kind:'wild', threat:3, fin:true },
  { key:'eisenmark',   name:'Die Eisenmark',  x:130, y:232, r:96, kind:'wild', threat:3, faction:'chain', fin:true },
  { key:'kettenfeste', name:'Die Eisenfeste', x:158, y:172, r:34, kind:'city', threat:4, faction:'chain', fin:true },
  { key:'steinbruch',  name:'Der Steinbruch', x:78,  y:318, r:24, kind:'camp', threat:3, faction:'chain', fin:true },
  { key:'grubenhort',  name:'Grubenhort',     x:185, y:430, r:20, kind:'camp', threat:2, faction:'goblin', fin:true },
  { key:'morrgrund',   name:'Morrgrund',      x:276, y:622, r:18, kind:'camp', threat:2, faction:'goblin', fin:true },
  { key:'nachtglas',   name:'Turm des Nachtglases', x:953, y:630, r:14, kind:'ruin', threat:5, faction:'undead', fin:true },   // S15 P6: Magierturm, östlich der Schwarzen Feste   // S15: das letzte Dorf der Grubenstämme, Dodons Dorf
  { key:'kettenpass',  name:'Kettentor',      x:226, y:172, r:10, kind:'road', threat:3, fin:true },
  // Totenland: in Koordinaten der Erzeugung (rückt mit)
  { key:'totenland',   name:'Das Totenland',  x:1024, y:400, r:250, kind:'wild', threat:4, faction:'undead' },
  { key:'knochenpass', name:'Knochentor',     x:778, y:384, r:10, kind:'road', threat:3, faction:'undead' },
  { key:'totenruinen', name:'Totenruinen',    x:900, y:180, r:22, kind:'ruin', threat:4, faction:'undead' },
  { key:'schaedelwald', name:'Schädelwald',   x:1050, y:300, r:26, kind:'wild', threat:4, faction:'undead' },
  { key:'graeberfeld', name:'Gräberfeld',     x:930, y:480, r:20, kind:'ruin', threat:3, faction:'undead' },
  { key:'seelenhuegel', name:'Seelenhügel',   x:1130, y:470, r:18, kind:'ruin', threat:4, faction:'undead' },
  { key:'grabwacht',   name:'Grabwacht',      x:1150, y:620, r:18, kind:'ruin', threat:4, faction:'undead' });
// Wüstensporn (Session 12, Referenzkarte „Valoris“): Halbinsel im Südwesten — Wüste, Dünen, Felsödland, Ruinen, Banditen.
LOCATIONS.push(
  { key:'wuestensporn', name:'Der Wüstensporn', x:470, y:880, r:220, kind:'wild', threat:3, fin:true },
  { key:'karak_atar',   name:'Karak-Atar',      x:430, y:900, r:26, kind:'city', threat:3, faction:'bandit', fin:true },
  { key:'duenenwacht',  name:'Dünenwacht',      x:330, y:800, r:14, kind:'camp', threat:3, faction:'bandit', fin:true },
  { key:'sandruinen',   name:'Sandruinen',      x:250, y:860, r:16, kind:'ruin', threat:3, fin:true },
  { key:'aurelion',     name:'Das Hochreich Aurelion', x:860, y:1010, r:300, kind:'wild', threat:1, faction:'aurel', fin:true },
  { key:'nekrosinsel',  name:'Nekrosinsel',     x:1390, y:800, r:30, kind:'ruin', threat:5, faction:'undead', fin:true });
// Dörfer (Session 12): Weltkoordinaten nach der Verschiebung. Eigener Bauplan (buildVillages), volle Siedlungen im Spiel.
// lord: wessen Einfluss — Valen, Orden, Händler; tribute: zahlt Abgaben an die Eiserne Kette (Westen).
export const VILLAGES = [
  { key: 'haselbrueck', name: 'Haselbrück', x: 360, y: 258, lord: 'valen', link: [434, 258] },
  { key: 'muehlbach',   name: 'Mühlbach',   x: 518, y: 226, lord: 'valen', link: [434, 226] },
  { key: 'weidenau',    name: 'Weidenau',   x: 366, y: 372, lord: 'valen', link: [434, 372] },
  { key: 'rastfurt',    name: 'Rastfurt',   x: 768, y: 334, lord: 'merch', link: [768, 376] },
  { key: 'lichtenrain', name: 'Lichtenrain', x: 860, y: 446, lord: 'order', link: [860, 386] },
  { key: 'grauwasser',  name: 'Grauwasser', x: 70,  y: 470, lord: 'chain', tribute: true, link: [214, 470] },
  { key: 'hohlstein',   name: 'Hohlstein',  x: 122, y: 560, lord: 'chain', tribute: true, link: [214, 560] },
  { key: 'eisenried',   name: 'Eisenried',  x: 70,  y: 630, lord: 'chain', tribute: true, link: [214, 630] },
];
for (const V of VILLAGES) LOCATIONS.push({ key: V.key, name: V.name, x: V.x, y: V.y, r: 16, kind: 'village', threat: 0, faction: V.lord, town: true, tribute: !!V.tribute, fin: true });
// Alte Eisenmark-Koordinaten (Session 11, Osten) → neuer Westen: Feste gespiegelt (Tor nach Osten), Steinbruch, Grubenhort, Pass.
export function EM(x, y) {
  if (x >= 890 && x <= 970 && y >= 355 && y <= 410) return [1090 - x, y - 212];
  if (x >= 855 && x <= 905 && y >= 195 && y <= 240) return [x - 802, y + 100];
  if (x >= 880 && x <= 930 && y >= 580 && y <= 615) return [x - 720, y - 170];
  if (x >= 770 && x <= 800 && y >= 370 && y <= 395) return [218, 172];                       // Wache am Kettentor (innen)
  return [x, y];
}
export const EISEN_CONVOY = { start: [150, 318], pts: [[95, 318], [214, 318], [214, 172], [192, 172]] };   // Steinbruch → Straße → Tor der Feste
// Props neben einem Haus (Schild an der Tür, Fässer vor der Schenke) ziehen mit dem Haus um; freie Props strecken.
function attachedPt(P, x, y, extra = []) {
  for (const [, hx, hy, w, h, door] of [...P.design.houses, ...extra])
    if (x >= hx - 2 && x <= hx + w + 1 && y >= hy - 2 && y <= hy + h + 1) { const [nx, ny] = spreadHouse(P, hx, hy, w, h, door); return [x - hx + nx, y - hy + ny]; }
  return [spR(P, x, 0), spR(P, y, 1)];
}
// Phase 8 (Nutzer: Städte wachsen von selbst und durch Investition): ein neues Haus am Rand einer Stadt. Gesucht wird eine freie
// Fläche (Wiese, Erde, Sand; 2 Kacheln Abstand zu anderen Häusern, keine Mauer, kein Wasser im Rand), deren Tür zum Platz zeigt
// und zu Fuß erreichbar ist. Ohne Zufall: gleiche Welt, gleiche Stelle. Das Stadtgebiet wächst mit (Dichte-Regel §75 bleibt).
const GROW_SIZE = { house: [5, 4], cottage: [4, 4], smithy: [6, 5], bakery: [5, 4], store: [6, 5], tavern: [8, 6] };
const BUILDABLE = new Set([T.GRASS, T.DIRT, T.SAND, T.ASH]);
export function findGrowSpot(town, type = 'house') {
  const P = TOWN_PLAN[town]; if (!P) return null;
  const [w, h] = GROW_SIZE[type] || GROW_SIZE.house, [x0, y0, x1, y1] = P.area, [sx, sy] = P.square, R = 10, cand = [];
  const near = (x, y) => HOUSES.some(b => b.map === 'world' && x - 2 < b.x + b.w && x + w + 2 > b.x && y - 2 < b.y + b.h && y + h + 2 > b.y);
  for (let y = y0 - R; y <= y1 + R - h; y++) for (let x = x0 - R; x <= x1 + R - w; x++) cand.push([x, y, Math.hypot(x + w / 2 - sx, y + h / 2 - sy)]);
  cand.sort((a, b) => a[2] - b[2]);
  for (const [x, y] of cand) {
    let ok = true;
    for (let j = y - 2; j < y + h + 2 && ok; j++) for (let i = x - 2; i < x + w + 2 && ok; i++) {
      const t = tileAt('world', i, j), inside = i >= x && i < x + w && j >= y && j < y + h;
      if (inside ? !BUILDABLE.has(t) : (t === T.WALL || t === T.WATER || t === T.PLANK || t === T.ROCK)) ok = false;
    }
    if (!ok || near(x, y)) continue;
    const dx = sx - (x + w / 2), dy = sy - (y + h / 2), door = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : (dy > 0 ? 'S' : 'N');
    const fx = door === 'E' ? x + w : door === 'W' ? x - 1 : x + (w >> 1), fy = door === 'S' ? y + h : door === 'N' ? y - 1 : y + (h >> 1);
    if (!reachable(fx, fy, sx, sy, x, y, w, h)) continue;
    return { town, type, x, y, w, h, door };
  }
  return null;
}
function reachable(fx, fy, sx, sy, hx, hy, w, h) {                 // BFS von der Tür zum Platz, das geplante Haus zählt als Mauer
  const seen = new Set([fx + ',' + fy]), q = [[fx, fy]];
  for (let k = 0; k < q.length && k < 6000; k++) { const [x, y] = q[k]; if (Math.abs(x - sx) <= 2 && Math.abs(y - sy) <= 2) return true;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { const key = nx + ',' + ny;
      if (seen.has(key) || SOLID.has(tileAt('world', nx, ny)) || (nx >= hx && nx < hx + w && ny >= hy && ny < hy + h)) continue; seen.add(key); q.push([nx, ny]); } }
  return false;
}
export function buildGrown(spec) {                                   // baut ein gefundenes (oder gespeichertes) Haus; gibt Haus, Möbel, alte Kacheln
  const P = TOWN_PLAN[spec.town]; if (!P) return null;
  const id = 'g' + spec.town + '_' + spec.x + '_' + spec.y; if (HOUSES.some(b => b.id === id)) return null;
  const before = []; for (let j = spec.y; j < spec.y + spec.h; j++) for (let i = spec.x; i < spec.x + spec.w; i++) before.push(tileAt('world', i, j));
  const area0 = P.area.slice(), n0 = props.length;
  const b = house('world', spec.x, spec.y, spec.w, spec.h, spec.door, { type: spec.type, town: spec.town, id, grown: true });
  const furn = props.splice(n0);
  P.area = [Math.min(P.area[0], spec.x - 2), Math.min(P.area[1], spec.y - 2), Math.max(P.area[2], spec.x + spec.w + 1), Math.max(P.area[3], spec.y + spec.h + 1)];
  return { b, props: furn, undo: () => { let k = 0; for (let j = spec.y; j < spec.y + spec.h; j++) for (let i = spec.x; i < spec.x + spec.w; i++) setTile('world', i, j, before[k++]); HOUSES.splice(HOUSES.indexOf(b), 1); P.area = area0; } };
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
    if (P.village) continue;                                          // Dörfer baut buildVillages
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
      ...(P.grow?.houses || [])].map(a => a.slice());                  // Kopien: das Wachsen unten darf TOWN_PLAN nicht verändern
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
    // Session 10 (Nutzer: „Schenke/Versammlungsorte größer, manche Häuser sehr klein“): vor dem Bauen nach hinten und zu
    // den Seiten wachsen, die Tür bleibt auf ihrer Kachel (Schilder, Schlafplätze, NPC_DAY-Bezüge stimmen weiter).
    // Nur auf freiem Grund: keine Straße/Platz, kein Acker/Wasser/Fels/Mauer, ≥ 2 Kacheln zu jedem anderen geplanten Haus.
    const GROW = { tavern: [[4, 2], [2, 2], [2, 1]], chapel: [[2, 2], [2, 1]], hall: [[2, 2], [2, 1]], merc: [[2, 2], [2, 1]] };
    const grown = (x, y, w, h, door, dw, dh) => door === 'S' ? [x - dw / 2, y - dh, w + dw, h + dh] : door === 'N' ? [x - dw / 2, y, w + dw, h + dh]
      : door === 'W' ? [x, y - dh / 2, w + dw, h + dh] : [x - dw, y - dh / 2, w + dw, h + dh];   // Tür-Kachel bleibt gleich
    const BAD = new Set([T.WATER, T.ROCK, T.WALL, T.FIELD, T.DWALL]);
    const fits = (me, [x, y, w, h]) => {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (street.has(K(i, j)) || BAD.has(tileAt('world', i, j))) return false;
      return houses.every(o => o === me || Math.max(o[1] - x - w, x - o[1] - o[3], o[2] - y - h, y - o[2] - o[4]) >= 2);
    };
    for (const hs of houses) {
      const [type, x, y, w, h, door] = hs, steps = GROW[type] || (w * h <= 16 ? [[2, 1]] : []);
      for (const [dw, dh] of steps) { const d = door === 'W' || door === 'E' ? [dw, dh % 2 ? dh + 1 : dh] : [dw, dh];   // Seitentür: Höhe gerade wachsen (Tür mittig)
        const r = grown(x, y, w, h, door, d[0], d[1]); if (fits(hs, r)) { [hs[1], hs[2], hs[3], hs[4]] = r; break; } }
    }
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
let PLAN0 = null;                                                        // BUG-141: Stadtplan vor dem ersten Erzeugen (Laden verändert ihn)
export function genWorld() {
  if (SHIFT) { shiftCoords(-SHIFT); SHIFT = 0; }                         // S12: zur Erzeugung in die Entwurfslage zurück
  if (!PLAN0) PLAN0 = structuredClone(TOWN_PLAN);                        // zweites Laden in derselben Sitzung: vom unveränderten Plan ausgehen
  else { const P1 = structuredClone(PLAN0);                             // Inhalt zurücksetzen, Objekte behalten (andere Module halten Verweise)
    for (const k of Object.keys(TOWN_PLAN)) if (!P1[k]) delete TOWN_PLAN[k];
    for (const [k, v] of Object.entries(P1)) { const t = TOWN_PLAN[k]; if (!t) { TOWN_PLAN[k] = v; continue; } for (const f of Object.keys(t)) delete t[f]; Object.assign(t, v); } }
  for (const k of Object.keys(TOWN_PLAN)) if (TOWN_PLAN[k].village) delete TOWN_PLAN[k];
  for (let i = LOCATIONS.length - 1; i >= 0; i--) if (LOCATIONS[i].poi) LOCATIONS.splice(i, 1);   // Streuorte entstehen je Welt neu
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
  prop('mine_entrance', 250, 36, { solid:false, portal:'deep', label:'Tiefhall', tag:'delve' });   // der Hort liegt jetzt drinnen (genDeep)
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

  pactScenes(); groveScene(); deadScenes(); borderScenes();
  const wild = new Set(props.slice(handMark));               // vor den Zugängen: Entfernen verschiebt sonst den Index
  // Zugänge (BUG-079, per Wegsuche gefunden): Wolfsschlucht war rundum Fels, die Nebelinsel ohne Übergang. Ohne rnd();
  // feste Props auf den Wegkacheln werden entfernt, sonst sperrt ein Erzbrocken den neuen Pass.
  const cut = [];
  for (let k = 0; k < 8; k++) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) cut.push([48 + k + dx, 298 - k + dy, T.DIRT]);   // Schluchtpass nach NO
  for (let y = 470; y <= 486; y++) for (const x of [90, 91]) if (SOLID.has(tileAt('world', x, y))) cut.push([x, y, T.PLANK]);   // Nebelsteg
  for (const [x, y, t] of cut) setTile('world', x, y, t);
  prop('sign', 92, 470, { label: 'Nebelsteg — zur Nebelinsel' });
  for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (q.solid && cut.some(([x, y]) => Math.floor(q.x / 32) === x && Math.floor(q.y / 32) === y)) props.splice(i, 1); }
  resampleWorld();                                         // Entwurf → Weltmaßstab (ohne rnd())
  phase = 'world';
  expandTowns(wild);                                       // zuletzt und ohne rnd(): Zufallsfolge oben bleibt stabil
  extendEast();                                            // Session 11: Eisenmark, ohne rnd() (Hash-Rauschen)
  extendFarEast();                                         // Session 12: Totenland (Osten)
  shiftWest();                                             // Session 12: Karte wächst nach Westen, alles rückt um OX
  buildWest();                                             // Session 12: Westgebirge, Eisenfeste, Steinbruch, Grubenhort
  extendSouth();                                           // Session 12: Wüstensporn, Südinseln, Nekrosinsel
  coastline(); lakes(); totenbruecke();                    // Session 12: zerklüftete Küste, Buchten, Binnenseen, Brücke zur Nekrosinsel
  buildVillages();                                         // Session 12: Dörfer in allen Einflussgebieten
  scatterPOIs();                                           // Session 12: Dichte — überall kleine Orte mit Geschichte
  tidyTowns(); clearDoors(); ensureReach();                              // Session 12: gilt für jeden Seed (neue Spiele haben neue Welten)
  buildMorrgrund();                                        // S15: das letzte Goblin-Dorf, weit im Süden der Westlande
  buildNachtglas();                                        // S15 P6: der Magierturm Ilvars

  // Lichtungen entstehen nach dem Wald: Bäume nur auf Gras stehen lassen
  // Bäume nicht auf Wegen, Lichtungen, Feldern oder in Mauern (Wüste, Asche, Sumpf, Gebirge dürfen tragen)
  const noTree = new Set([T.DIRT, T.ROAD, T.PLANK, T.FIELD, T.WATER, T.WALL, T.DWALL, T.ROCK, T.DFLOOR]);
  for (const p of props) delete p._d;                        // nur für den Umzug gebraucht, nicht speichern
  return baseProps('world', props.filter(p => p.type !== 'tree' || !noTree.has(tileAt('world', p.x / TS | 0, p.y / TS | 0))));
}

// Erzeugungsschlüssel gk = Typ@Kachel (+#n bei gleichem Typ auf derselben Kachel). Bewusst nicht die Reihenfolge:
// ändert eine spätere Session die Generierung, verschiebt ein Index-Schlüssel alle alten Spielstände, Typ+Kachel nur die betroffenen.
// Der Grundzustand (state.js) erlaubt, nur abweichende Props zu speichern (BUG-057).
function baseProps(map, list) {
  const n = new Map(), M = MAPS[map];
  // Audit A-04 (§7 Erreichbarkeit): Rohstoffe auf Fels/Wasser/Mauer wandern auf die nächste begehbare Kachel (Spirale, ohne Zufall)
  if (M) for (const p of list) if (p.harvest && SOLID.has(tileAt(map, p.x / TS | 0, p.y / TS | 0))) {
    const tx = p.x / TS | 0, ty = p.y / TS | 0; let to = null;
    for (let r = 1; r <= 6 && !to; r++) for (let dy = -r; dy <= r && !to; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || SOLID.has(tileAt(map, tx + dx, ty + dy))) continue; to = [tx + dx, ty + dy]; break; }
    if (to) { p.x = to[0] * TS + TS / 2; p.y = to[1] * TS + TS / 2; } else p.gone = true;
  }
  for (let i = list.length - 1; i >= 0; i--) if (list[i].gone) list.splice(i, 1);
  for (const p of list) { const k = `${p.type}@${p.x / TS | 0},${p.y / TS | 0}`, i = n.get(k) || 0; n.set(k, i + 1); p.gk = i ? `${k}#${i}` : k; }
  setPropBase(map, list);
  return list;
}

// ---------------- Die Eisenmark (Session 11) ----------------
// Karte wächst nach Osten (768 → 1024). Gelände aus Hash-Rauschen (kein rnd(): die Welt davor bleibt Kachel für Kachel gleich).
// Ein Felskamm trennt die Mark vom Grenzland, der Kettenpass öffnet ihn; die Straße führt von Sonnwacht zur Kettenfeste.
const vnE = (x, y, s) => { const X = Math.floor(x / s), Y = Math.floor(y / s), fx = x / s - X, fy = y / s - Y, sm = t => t * t * (3 - 2 * t);
  const a = nz(X, Y), b = nz(X + 1, Y), c = nz(X, Y + 1), d = nz(X + 1, Y + 1), u = sm(fx), v = sm(fy);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
// Weg aus 2×2-Kacheln (Straße, Erdweg); Mauern bleiben stehen
function lay(x0, y0, x1, y1, tile = T.ROAD) { const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (tileAt('world', x + dx, y + dy) !== T.WALL) setTile('world', x + dx, y + dy, tile); } }
// Session 12 (Nutzer: „links und rechts nicht so abgetrennt“): Land jenseits der alten Kartenränder setzt das Land davor fort —
// verzerrt gespiegelt an der Naht, nur natürliche Böden (keine Straßen, Häuser, Äcker). Im Osten geht es nach einer
// unregelmäßigen Grenze in das Totenland über (Asche, Erde, dunkle Seen); keine geraden Grate mehr. Kein rnd().
const NATURAL_T = new Set([T.GRASS, T.DIRT, T.MARSH, T.SAND, T.ASH, T.ROCK, T.STONE, T.WATER]);
export const deadBorder = y => 36 + vnE(7, y, 37) * 80;                             // Spalten hinter der alten Ostkante
const eastSrc = (x, y) => [Math.max(516, Math.min(760, 1535 - x + Math.round((vnE(x, y + 50, 31) - 0.5) * 34))), Math.max(0, Math.min(767, y + Math.round((vnE(x + 70, y, 29) - 0.5) * 34)))];
function extendEast() {
  const O = MAPS.world, W = O.w + EAST + EAST2, H = O.h, t = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) t.set(O.tiles.subarray(y * O.w, y * O.w + O.w), y * W);
  const X0 = O.w;
  for (let y = 0; y < H; y++) for (let x = X0; x < W; x++) {
    const [sx, sy] = eastSrc(x, y), src = O.tiles[sy * O.w + sx], n = vnE(x, y, 22), dead = x - X0 > deadBorder(y);
    let tl = NATURAL_T.has(src) ? src : T.GRASS;
    if (y < 2 || y >= H - 2 || x >= W - 3) tl = T.ROCK;
    else if (y >= seaLine(Math.min(x, 767))) tl = T.WATER;
    else if (dead) tl = vnE(x + 500, y, 9) > 0.87 ? T.ROCK : vnE(x + 900, y, 40) < 0.1 ? T.WATER : n < 0.45 ? T.ASH : n < 0.8 ? T.DIRT : T.STONE;   // eigenes Gelände: Asche, schwarze Seen
    t[y * W + x] = tl;
  }
  MAPS.world = { w: W, h: H, tiles: t, design: O.design };
  lay(712, 384, 1000, 384);                                                         // Sonnwacht → Knochentor → ins Totenland
  for (const [x, y] of [[776, 381], [776, 389]]) prop('bone_spire', x, y, { solid: true, r: 8, label: 'Knochentor' });
  prop('sign', 781, 386, { label: 'Knochentor — Das Totenland. Hier endet das Land der Lebenden.' });
}
function extendFarEast() { totenland(); }                                          // Karte ist schon breit genug (extendEast)
// Orte des Totenlands: Ruinen, Schädelwald, Gräberfeld, Seelenhügel, Grabwacht — dazwischen tote Bäume, Knochen, Grabsteine
function totenland() {
  const free = (x, y) => { const t = tileAt('world', x, y); return t !== T.WATER && t !== T.ROCK && t !== T.WALL && t !== T.ROAD; };
  const P = (t, x, y, o = {}) => { if (free(x, y)) prop(t, x, y, o); };
  const deadAt = (x, y) => x - 768 > deadBorder(y);
  lay(1000, 384, 1050, 300, T.DIRT); lay(1000, 384, 930, 480, T.DIRT); lay(1000, 384, 1130, 470, T.DIRT); lay(1130, 470, 1150, 620, T.DIRT); lay(1000, 384, 900, 190, T.DIRT);
  for (let i = 0; i < 1400; i++) { const x = 782 + Math.floor(nz(i, 91) * 492), y = 6 + Math.floor(nz(91, i) * 700), k = nz(i, 17);
    if (!free(x, y)) continue;
    if (!deadAt(x, y)) { if (k < 0.12 && tileAt('world', x, y) === T.GRASS) prop('tree', x, y, { solid: true, r: 12, hp: 3 }); continue; }   // Übergangsland: noch lebendig
    if (k < 0.42) P('dead_tree', x, y, { solid: true, r: 10 }); else if (k < 0.6) P('bones', x, y, { r: 6 }); else if (k < 0.7) P('gravestone', x, y, { solid: true, r: 7 });
    else if (k < 0.74) P('bone_spire', x, y, { solid: true, r: 8 }); else if (k < 0.8) P('blood', x, y); }
  // Totenruinen: Säulenring, Gruft, abgebrochener Turm
  rect('world', 884, 166, 32, 28, T.STONE);
  for (let k = 0; k < 10; k++) { const a = k * 0.63; P('broken_pillar', Math.round(900 + Math.cos(a) * 13), Math.round(180 + Math.sin(a) * 11), { solid: true, r: 10 }); }
  P('crypt', 900, 176, { solid: true, r: 16, label: 'Gruft der Totenruinen' }); P('tower_ruin', 912, 170, { solid: true, r: 18 }); P('rubble', 890, 186); P('rubble', 906, 188);
  // Schädelwald: dichter toter Wald, Knochenspitzen
  for (let i = 0; i < 90; i++) { const a = nz(i, 5) * 6.28, r = Math.sqrt(nz(5, i)) * 24; P(i % 7 ? 'dead_tree' : 'bone_spire', Math.round(1050 + Math.cos(a) * r), Math.round(300 + Math.sin(a) * r), { solid: true, r: 10 }); }
  // Gräberfeld: Reihen von Gräbern, Gruft, Kerzen
  for (let j = 0; j < 5; j++) for (let i = 0; i < 9; i++) P('gravestone', 918 + i * 3, 472 + j * 3, { solid: true, r: 7 });
  P('crypt', 944, 478, { solid: true, r: 16, label: 'Gruft des Gräberfelds' }); P('candles', 930, 486); P('candles', 936, 470);
  // Seelenhügel: Obelisk im Kerzenkreis
  P('obelisk', 1130, 470, { solid: true, r: 12 }); for (let k = 0; k < 8; k++) P('candles', Math.round(1130 + Math.cos(k * 0.785) * 5), Math.round(470 + Math.sin(k * 0.785) * 4));
  for (const [dx, dy] of [[-9, -6], [9, -5], [-8, 7], [10, 6]]) P('bone_spire', 1130 + dx, 470 + dy, { solid: true, r: 8 });
  // Grabwacht: verfallener Wachturm, Palisade, Gräber der Wächter
  // Phase 6 (MP2 §63): Pforte zur Gruft des Toten Königs — Steinplatz, Knochenspitzen im Kreis, Treppe hinab
  rect('world', 1188, 392, 13, 11, T.STONE); lay(1130, 470, 1194, 402, T.DIRT);
  for (let k = 0; k < 12; k++) { const a = k * 0.524; prop('bone_spire', Math.round(1194 + Math.cos(a) * 7), Math.round(397 + Math.sin(a) * 5), { solid: true, r: 8 }); }
  prop('mine_entrance', 1194, 396, { solid: true, r: 14, portal: 'garmadon', label: 'Gruft des Toten Königs' });
  prop('sign', 1194, 401, { label: 'In den Stein gekratzt: „Hier ruht kein König. Hier wartet einer.“' }); prop('banner_torn', 1190, 395, { label: 'Banner Garmadons' }); prop('banner_torn', 1198, 395, { label: 'Banner Garmadons' });
  P('watchtower_ruin', 1150, 616, { solid: true, r: 16 }); for (let i = -6; i <= 6; i++) P('palisade_prop', 1150 + i, 626, { solid: true });
  for (let i = 0; i < 6; i++) P('gravestone', 1142 + i * 3, 610, { solid: true, r: 7 }); P('banner_torn', 1156, 612, { label: 'Zerfetztes Banner der Grabwacht' });
}
// Kontinent (Session 12, Referenzkarte): an West-, Nord- und Ostrand frisst das Meer eine zerklüftete Küste ins Land, Buchten
// und Landzungen aus zwei Rauschlagen. Orte bleiben an Land (Schutzkreis), Straßen enden nicht im Wasser (sie liegen innen).
// Wüstensporn: Land entlang eines Rückgrats vom Südwestland nach Südosten, Breite und Küste aus Rauschen; > 0 = Land
const SPINE = [[200, 690], [250, 790], [400, 880], [620, 950], [860, 1010], [1060, 1040], [1180, 1090]];   // S12: Wüstenzipfel im Westen, dann das Hochreich
function spornAt(x, y) {
  let best = 1e9, tt = 0;
  for (let i = 0; i + 1 < SPINE.length; i++) { const [ax, ay] = SPINE[i], [bx, by] = SPINE[i + 1], dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))), d = Math.hypot(x - ax - dx * t, y - ay - dy * t);
    if (d < best) { best = d; tt = (i + t) / (SPINE.length - 1); } }
  const r = 55 + Math.sin(tt * Math.PI) * 160 + (vnE(x + 6000, y, 40) - 0.5) * 80 + (vnE(x + 7000, y, 11) - 0.5) * 18;
  return r - best;
}
function extendSouth() {
  const O = MAPS.world, W = O.w, H = O.h + SOUTH, t = new Uint8Array(W * H).fill(T.WATER);
  t.set(O.tiles, 0); MAPS.world = { w: W, h: H, tiles: t, design: O.design };
  for (let y = O.h - 4; y < O.h; y++) for (let x = 0; x < W; x++) if (t[y * W + x] === T.ROCK) t[y * W + x] = T.WATER;   // alter Randfels unten → Meer
  for (let y = 640; y < H - 3; y++) for (let x = 2; x < 1330; x++) {
    const v = spornAt(x, y); if (v <= 0) continue;
    const k = y * W + x; if (y < 700 && t[k] !== T.WATER) continue;                   // Festland bleibt, nur Meer wird zu Sporn
    const n = vnE(x + 800, y, 18), r = vnE(x + 900, y, 8);
    const west = x < 480 + (vnE(x, y + 300, 30) - 0.5) * 60;                       // Wüstenzipfel mit ausgefranster Grenze
    t[k] = west ? (v < 3 ? T.SAND : r > 0.9 ? T.ROCK : n < 0.05 && v > 45 ? T.WATER : n < 0.72 ? T.SAND : n < 0.86 ? T.DIRT : T.STONE)   // Dünen, Felsödland, seltene Oasen
      : v < 2 ? T.SAND : r > 0.93 ? T.ROCK : n < 0.035 && v > 50 ? T.WATER : n < 0.07 && v > 50 ? T.MARSH : n < 0.74 ? T.GRASS : n < 0.92 ? T.DIRT : T.STONE;   // Aurelion: fruchtbares, gepflegtes Land
  }
  for (let i = 0; i < 26; i++) {                                                      // Südinseln und Riffe
    const cx = 60 + Math.floor(nz(i, 81) * 1400), cy = 790 + Math.floor(nz(81, i) * 210), rr = 6 + Math.floor(nz(i, 82) * 22);
    if (spornAt(cx, cy) > -20) continue;
    for (let y = cy - rr - 6; y <= cy + rr + 6; y++) for (let x = cx - rr - 6; x <= cx + rr + 6; x++) {
      if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) continue;
      const d = Math.hypot(x - cx, (y - cy) * 1.3) - rr - (vnE(x + 20 * i, y, 6) - 0.5) * 10; if (d > 0) continue;
      t[y * W + x] = cx > 1100 ? (vnE(x, y, 5) > 0.5 ? T.ASH : T.DIRT) : d > -3 ? T.SAND : vnE(x, y, 7) > 0.55 ? T.GRASS : T.STONE; }
  }
  for (let y = 755; y <= 845; y++) for (let x = 1335; x <= 1445; x++) {               // Nekrosinsel, über die Totenbrücke erreichbar
    const d = Math.hypot(x - 1390, (y - 800) * 1.2) - 44 - (vnE(x, y + 40, 9) - 0.5) * 16; if (d < 0) t[y * W + x] = vnE(x, y, 6) > 0.6 ? T.STONE : T.ASH; }
  // Karak-Atar: Mauerstadt der Sandfürsten — Mauer mit Toren, Sandsteinhäuser, Markt, Brunnen
  const K = [404, 880, 456, 922];
  for (let y = K[1]; y <= K[3]; y++) for (let x = K[0]; x <= K[2]; x++) {
    const edge = x === K[0] || x === K[2] || y === K[1] || y === K[3], gate = (y >= 899 && y <= 902 && (x === K[0] || x === K[2])) || (x >= 429 && x <= 431 && (y === K[1] || y === K[3]));
    t[y * W + x] = edge && !gate ? T.WALL : T.SAND; }
  rect('world', 405, 899, 51, 4, T.STONE); rect('world', 429, 881, 3, 41, T.STONE); rect('world', 424, 895, 13, 11, T.STONE);
  for (const [x, y, dr] of [[408, 884, 'S'], [416, 884, 'S'], [436, 884, 'S'], [444, 884, 'S'], [408, 910, 'N'], [416, 910, 'N'], [436, 910, 'N'], [444, 910, 'N']])
    house('world', x, y, 6, 5, dr, { type: ['house', 'store', 'tavern', 'house'][(x + y) % 4], town: 'karak' });
  for (const [tp, x, y, o] of [['stall', 426, 897, {}], ['stall', 433, 897, {}], ['well', 430, 903, { solid: true }], ['banner_torn', 403, 897, { label: 'Zeichen der Sandfürsten' }], ['banner_torn', 403, 904, { label: 'Zeichen der Sandfürsten' }],
    ['torch', 428, 880], ['torch', 432, 880], ['barrel', 425, 904], ['crate', 436, 904], ['campfire_static', 430, 915, { solid: true, r: 10 }]]) prop(tp, x, y, o);
  lay(250, 700, 250, 790, T.DIRT); lay(250, 790, 404, 900, T.DIRT);                   // Karawanenweg durch den Sporn
  for (let i = 0; i < 1400; i++) { const x = 480 + Math.floor(nz(i, 71) * 840), y = 760 + Math.floor(nz(71, i) * 440);   // Aurelion: Haine und Alleen
    if (t[y * W + x] === T.GRASS && spornAt(x, y) > 8 && vnE(x + 1200, y, 26) > 0.56) prop('tree', x, y, { solid: true, r: 12, hp: 3 }); }
  for (const C of AUREL_CITIES) buildAurelCity(C);
  const G = k => AUREL_CITIES.find(c => c.key === k), gate = (c, s) => s === 'W' ? [c.x - c.hw, c.y] : s === 'E' ? [c.x + c.hw, c.y] : s === 'N' ? [c.x, c.y - c.hh] : [c.x, c.y + c.hh];
  for (const [a, sa, b, sb] of [['aurelheim', 'N', 'kupferhafen', 'S'], ['aurelheim', 'E', 'gelenkhall', 'W'], ['gelenkhall', 'E', 'tickmar', 'W'], ['aurelheim', 'S', 'sanktserin', 'N']]) {
    const [x0, y0] = gate(G(a), sa), [x1, y1] = gate(G(b), sb); lay(x0, y0, x1, y1); }
  lay(456, 900, 560, 980); lay(560, 980, 603, 980);                                   // Karak-Atar → Aurelheim (Westtor der Metropole, gerade hinein)
  prop('sign', 252, 704, { label: 'Wüstensporn — Karak-Atar, Stadt der Sandfürsten' });
  // Dünenwacht, Sandruinen, Nekrosinsel
  for (const [x, y] of [[322, 792], [338, 792], [322, 808], [338, 808]]) prop('watchtower_ruin', x, y, { solid: true, r: 14 });
  for (let i = -6; i <= 6; i++) { prop('palisade_prop', 330 + i, 790, { solid: true }); prop('palisade_prop', 330 + i, 810, { solid: true }); }
  prop('tent_prop', 328, 800, { solid: true, label: 'Zelt der Wüstenräuber' }); prop('campfire_static', 333, 801, { solid: true, r: 10 });
  for (let k = 0; k < 12; k++) prop(k % 3 ? 'broken_pillar' : 'rubble', Math.round(250 + Math.cos(k * 0.52) * 11), Math.round(860 + Math.sin(k * 0.52) * 8), { solid: k % 3 !== 0, r: 10 });
  prop('tower_ruin', 1390, 796, { solid: true, r: 18, label: 'Turm der Nekrosinsel' }); for (let k = 0; k < 8; k++) prop('bone_spire', Math.round(1390 + Math.cos(k * 0.8) * 22), Math.round(800 + Math.sin(k * 0.8) * 16), { solid: true, r: 8 });
  prop('sign', 1392, 700, { label: 'Totenbrücke — zur Nekrosinsel' });
}
// Totenbrücke: vom Inselrand nach Norden, bis Land kommt (nach der Küstenbildung, sonst frisst das Meer sie)
function totenbruecke() {
  const m = MAPS.world, W = m.w, t = m.tiles; let y = 800;
  while (y > 560 && t[y * W + 1390] !== T.WATER) y--;                                  // Nordrand der Insel
  for (; y > 560 && t[y * W + 1390] === T.WATER; y--) for (const x of [1389, 1390]) t[y * W + x] = T.PLANK;
}
// Das Hochreich Aurelion (Session 12, Nutzer): die reichste Nation der Welt — Adel, Handelsherren, Automaten, Prothesen.
// Ummauerte Städte mit Pflasterkreuz, Platz, Häuserreihen zur Straße, Laternen, Statuen, Werkstätten mit Zahnrädern und
// ruhenden Automaten. Volle Siedlungen im Spiel (TOWN_PLAN, lord 'aurel'): Bewohner (Adel, Feinmechaniker, Kybernetiker).
export const AUREL_CITIES = [
  { key: 'aurelheim',   name: 'Aurelheim',   x: 700,  y: 980,  hw: 95, hh: 68, capital: true, metro: true, types: ['manor', 'manor', 'house', 'store', 'manor', 'tavern', 'healer', 'house', 'chapel', 'manor', 'smithy', 'house'] },   // MP2 Phase 5: Metropole, ~8× so groß
  { key: 'kupferhafen', name: 'Kupferhafen', x: 600,  y: 800,  hw: 22, hh: 16, types: ['store', 'house', 'tavern', 'store', 'house', 'smithy', 'fisher'] },
  { key: 'gelenkhall',  name: 'Gelenkhall',  x: 930,  y: 1030, hw: 22, hh: 16, types: ['smithy', 'store', 'healer', 'smithy', 'house', 'manor', 'smithy'] },
  { key: 'tickmar',     name: 'Tickmar',     x: 1120, y: 1070, hw: 22, hh: 16, types: ['store', 'smithy', 'store', 'house', 'smithy', 'barn'] },
  { key: 'sanktserin',  name: 'Sankt Serin', x: 820,  y: 1110, hw: 22, hh: 16, types: ['chapel', 'manor', 'house', 'healer', 'manor', 'house'] },
];
for (const C of AUREL_CITIES) LOCATIONS.push({ key: C.key, name: C.name, x: C.x, y: C.y, r: Math.max(C.hw, C.hh), kind: 'city', threat: 0, faction: 'aurel', town: true, fin: true });
const HSIZE = { manor: [6, 5], house: [5, 4], store: [6, 5], tavern: [6, 5], healer: [5, 4], chapel: [6, 5], smithy: [5, 4], barn: [6, 5], fisher: [4, 4] };
function buildAurelCity(C) {
  if (C.metro) return buildMetropolis(C);
  const m = MAPS.world, W = m.w, t = m.tiles, { x: cx, y: cy, hw, hh } = C, x0 = cx - hw, x1 = cx + hw, y0 = cy - hh, y1 = cy + hh;
  for (let i = props.length - 1; i >= 0; i--) { const q = props[i], qx = q.x / TS | 0, qy = q.y / TS | 0; if ((q.map || 'world') === 'world' && qx >= x0 - 3 && qx <= x1 + 3 && qy >= y0 - 3 && qy <= y1 + 3) props.splice(i, 1); }
  const gate = (x, y) => (Math.abs(y - cy) <= 1 && (x === x0 || x === x1)) || (Math.abs(x - cx) <= 1 && (y === y0 || y === y1));
  for (let y = y0 - 3; y <= y1 + 3; y++) for (let x = x0 - 3; x <= x1 + 3; x++) {
    const edge = x === x0 || x === x1 || y === y0 || y === y1, inside = x > x0 && x < x1 && y > y0 && y < y1;
    t[y * W + x] = edge ? (gate(x, y) ? T.STONE : T.WALL) : inside ? T.GRASS : (t[y * W + x] === T.WATER ? T.DIRT : t[y * W + x]);
  }
  for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) t[(y + j) * W + x + i] = T.WALL;   // Ecktürme
  const street = (ax, ay, bx, by) => { for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) t[y * W + x] = T.STONE; };
  street(x0 + 1, cy - 1, x1 - 1, cy + 1); street(cx - 1, y0 + 1, cx + 1, y1 - 1); street(cx - 5, cy - 4, cx + 5, cy + 4);   // Pflasterkreuz und Platz
  const rows = C.capital ? [cy, cy - 13, cy + 13] : [cy];
  if (C.capital) for (const ry of [cy - 13, cy + 13]) street(x0 + 1, ry - 1, x1 - 1, ry + 1);
  const hs = [], at = (x, y) => t[y * W + x]; let ti = 0;
  const fits = (hx, hy, w, h) => hx > x0 + 1 && hx + w < x1 - 1 && hy > y0 + 1 && hy + h < y1 - 1
    && hs.every(([a, b, c, d]) => hx + w + 2 <= a || a + c + 2 <= hx || hy + h + 2 <= b || b + d + 2 <= hy)
    && [...Array(w * h).keys()].every(k => at(hx + (k % w), hy + ((k / w) | 0)) === T.GRASS);
  const put = (hx, hy, w, h, door, type) => { if (!fits(hx, hy, w, h)) return false; house('world', hx, hy, w, h, door, { type, town: C.key }); hs.push([hx, hy, w, h]); return true; };
  for (const ry of rows) for (let hx = x0 + 3; hx < x1 - 6; hx += 8) {
    let type = C.types[ti % C.types.length], [w, h] = HSIZE[type] || [5, 4]; if (put(hx, ry - 2 - h, w, h, 'S', type)) ti++;
    type = C.types[ti % C.types.length]; [w, h] = HSIZE[type] || [5, 4]; if (put(hx, ry + 2, w, h, 'N', type)) ti++;
  }
  for (let hy = y0 + 3; hy < y1 - 5; hy += 7) {
    let type = C.types[ti % C.types.length], [w, h] = HSIZE[type] || [5, 4]; if (put(cx - 2 - w, hy, w, h, 'E', type)) ti++;
    type = C.types[ti % C.types.length]; [w, h] = HSIZE[type] || [5, 4]; if (put(cx + 2, hy, w, h, 'W', type)) ti++;
  }
  const P = (tp, x, y, o = {}) => { if (at(x, y) !== T.WALL && !HOUSES.some(b => b.map === 'world' && x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h)) prop(tp, x, y, o); };
  P('well', cx + 3, cy + 3, { solid: true }); P('statue', cx - 4, cy - 3, { solid: true, r: 10, label: 'Standbild eines Stadtgründers' }); P('statue', cx + 4, cy - 3, { solid: true, r: 10, label: 'Standbild eines Stadtgründers' });
  for (let x = x0 + 4; x < x1 - 2; x += 7) { P('lantern', x, cy - 2); P('lantern', x + 3, cy + 2); }
  for (let y = y0 + 4; y < y1 - 2; y += 7) { P('lantern', cx - 2, y); P('lantern', cx + 2, y + 3); }
  for (const [x, y] of [[x0 - 1, cy - 3], [x0 - 1, cy + 3], [x1 + 1, cy - 3], [x1 + 1, cy + 3]]) P('banner_torn', x, y, { label: 'Banner des Hochreichs Aurelion' });
  for (const b of HOUSES.filter(b => b.town === C.key && (b.type === 'smithy' || b.type === 'store'))) {   // Werkstätten: Zahnräder, ruhende Automaten, Kisten
    const fx = b.door === 'S' ? b.x - 1 : b.door === 'N' ? b.x - 1 : b.door === 'E' ? b.x + 1 : b.x + 1, fy = b.door === 'S' ? b.y + 1 : b.door === 'N' ? b.y + b.h - 2 : b.y - 1;
    P('gearpile', b.x - 1, b.y + 1, { solid: true, r: 8, label: 'Zahnräder und Federn' }); P('automat_frame', b.x + b.w, b.y + 1, { solid: true, r: 9, label: 'Ruhender Automat' }); P('crate', fx, fy);
  }
  for (const [x, y] of [[cx - 8, cy - 6], [cx + 8, cy - 6], [cx - 8, cy + 6], [cx + 8, cy + 6]]) P('hedge', x, y, { solid: true, r: 8 });
  // S12 E: Stadtbild — Schornsteine an Werkstätten, Zahnräder an den Toren; zwei unbewachte Breschen in der Mauer (Reinschleichen)
  for (const b of HOUSES.filter(b => b.town === C.key && ['smithy', 'store', 'manor'].includes(b.type))) P('chimney', b.x + b.w, b.y + b.h - 1, { solid: true, r: 7, label: 'Schornstein' });
  for (const [x, y] of [[x0 - 2, cy - 5], [x0 - 2, cy + 5], [x1 + 2, cy - 5], [x1 + 2, cy + 5]]) P('big_gear', x, y, { solid: true, r: 10, label: 'Torrad des Hochreichs' });
  for (const [bx, by] of [[cx + Math.round(hw * 0.6), y0], [cx - Math.round(hw * 0.6), y1]]) { t[by * W + bx] = T.DIRT; P('rubble', bx, by + (by === y0 ? -1 : 1), { label: 'Bresche in der Mauer — unbewacht' }); }
  if (C.key === 'tickmar') {                                                            // Fabrikviertel vor dem Osttor
    const fx = x1 + 14;
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i], qx = q.x / TS | 0, qy = q.y / TS | 0; if ((q.map || 'world') === 'world' && qx >= x1 + 3 && qx <= x1 + 26 && qy >= cy - 10 && qy <= cy + 12) props.splice(i, 1); }
    for (let y = cy - 9; y <= cy + 11; y++) for (let x = x1 + 3; x <= x1 + 25; x++) if (t[y * W + x] !== T.WALL) t[y * W + x] = T.STONE;
    house('world', fx - 9, cy - 9, 18, 9, 'S', { type: 'factoryhall', town: 'tickmar_werk' });              // begehbar (Nutzer); vor der Mauer, eigener Ort
    for (const [dx, dy] of [[-8, 7], [-3, 8], [3, 8], [8, 7]]) prop('machine', fx + dx, cy + dy, { solid: true, r: 9, label: 'Dampfhammer' });
    prop('workstation', fx - 6, cy + 10, { bond: 'aurel', label: 'Werkbank der Schuldknechte' }); prop('keychest', fx + 7, cy + 10, { bond: 'aurel', label: 'Schlüsselkasten des Vogts' });
  }
  if (C.key === 'gelenkhall') prop('workbench', cx + 5, cy - 2, { solid: true, r: 9, label: 'Werkbank der Prothesenmacherin', mechBench: true });
  TOWN_PLAN[C.key] = { village: true, lord: 'aurel', area: [x0, y0, x1, y1], old: [x0, y0, x1, y1], square: [cx, cy], perHead: C.capital ? 55 : 65, fields: [],
    plazas: [[T.STONE, cx - 5, cy - 4, cx + 5, cy + 4]], spread: { s: 1, a: [0, 0] }, design: { area: [-99, -99, -99, -99] } };
}
// ================= Aurelheim, die Metropole (MP2 §33–§49, Phase 5) =================
// Rund 190×136 Kacheln: Mauerring mit vier mechanischen Toren, zwei Prachtachsen, Regierungsplatz mit Palast, Uhr und
// Brunnen, Aquädukt und Kanal, dreizehn Bezirke mit eigenem Gesicht. Heller Stein, Säulen, Kuppeln, Gold, Glas.
export const METRO = {};
function buildMetropolis(C) {
  const m = MAPS.world, W = m.w, t = m.tiles, { x: cx, y: cy, hw, hh } = C, x0 = cx - hw, x1 = cx + hw, y0 = cy - hh, y1 = cy + hh;
  for (let i = props.length - 1; i >= 0; i--) { const q = props[i], qx = q.x / TS | 0, qy = q.y / TS | 0; if ((q.map || 'world') === 'world' && qx >= x0 - 30 && qx <= x1 + 30 && qy >= y0 - 34 && qy <= y1 + 26) props.splice(i, 1); }
  const at = (x, y) => t[y * W + x], set = (x, y, v) => { if (x > 0 && y > 0 && x < W - 1 && y < m.h - 1) t[y * W + x] = v; };
  const fill = (ax, ay, bx, by, v) => { for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) set(x, y, v); };
  fill(x0 - 30, y0 - 34, x1 + 30, y1 + 26, T.GRASS);                                   // Umland ebnen (Wasser, Fels, Wald weg)
  fill(x0, y0, x1, y1, T.GRASS);
  const gate = (x, y) => (Math.abs(y - cy) <= 2 && (x === x0 || x === x1)) || (Math.abs(x - cx) <= 2 && (y === y0 || y === y1));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if ((x === x0 || x === x1 || y === y0 || y === y1) && !gate(x, y)) set(x, y, T.WALL);
  for (let y = y0; y <= y1; y++) for (const x of [x0 + 1, x1 - 1]) if (!gate(x0, y)) set(x, y, T.WALL);
  for (let x = x0; x <= x1; x++) for (const y of [y0 + 1, y1 - 1]) if (!gate(x, y0)) set(x, y, T.WALL);
  for (let k = 0; k <= 6; k++) for (const [tx, ty] of [[x0 + Math.round(k * hw * 2 / 6), y0], [x0 + Math.round(k * hw * 2 / 6), y1], [x0, y0 + Math.round(k * hh * 2 / 6)], [x1, y0 + Math.round(k * hh * 2 / 6)]])
    if (!(Math.abs(tx - cx) <= 4 && (ty === y0 || ty === y1)) && !(Math.abs(ty - cy) <= 4 && (tx === x0 || tx === x1))) fill(tx - 1, ty - 1, tx + 1, ty + 1, T.WALL);   // Wehrtürme
  // Prachtachsen (5 breit) mit Bordstein und Laternen, Ringstraße innen
  fill(x0 + 2, cy - 2, x1 - 2, cy + 2, T.STONE); fill(cx - 2, y0 + 2, cx + 2, y1 - 2, T.STONE);
  fill(x0 + 3, y0 + 3, x1 - 3, y0 + 4, T.STONE); fill(x0 + 3, y1 - 4, x1 - 3, y1 - 3, T.STONE); fill(x0 + 3, y0 + 3, x0 + 4, y1 - 3, T.STONE); fill(x1 - 4, y0 + 3, x1 - 3, y1 - 3, T.STONE);
  for (let x = x0 + 6; x < x1 - 4; x += 6) { if (Math.abs(x - cx) > 4) { prop('lantern', x, cy - 3); prop('lantern', x + 3, cy + 3); } }
  for (let y = y0 + 6; y < y1 - 4; y += 6) { if (Math.abs(y - cy) > 4) { prop('lantern', cx - 3, y); prop('lantern', cx + 3, y + 3); } }
  // Mechanische Tore mit Kontrollpunkt und Torrädern
  for (const [gx, gy, dir] of [[x0, cy, 'W'], [x1, cy, 'E'], [cx, y0, 'N'], [cx, y1, 'S']]) {
    const ox = dir === 'W' ? -2 : dir === 'E' ? 2 : 0, oy = dir === 'N' ? -2 : dir === 'S' ? 2 : 0, sx = dir === 'W' || dir === 'E' ? 0 : 1, sy = sx ? 0 : 1;
    for (const s of [-4, 4]) prop('big_gear', gx + ox + s * sx, gy + oy + s * sy, { solid: true, r: 10, label: 'Torwerk des Hochreichs' });
    prop('telecircle', gx + ox * 3, gy + oy * 3, { label: 'Kontrollpunkt — Siegelprüfung' });
  }
  // Regierungsplatz: Palast, astronomische Uhr, Brunnen, Standbild, Säulengänge
  fill(cx - 18, cy - 14, cx + 18, cy + 12, T.STONE);
  house('world', cx - 11, cy - 21, 22, 12, 'S', { type: 'palace', town: C.key });                      // begehbar (Nutzer), Tür zum Platz
  prop('fountain', cx, cy + 6, { solid: true, r: 18, label: 'Großer Brunnen der Wasser des Reiches' });
  prop('astroclock', cx + 15, cy - 6, { solid: true, r: 12, label: 'Astronomische Uhr' }); prop('statue', cx - 15, cy - 6, { solid: true, r: 10, label: 'Standbild der Ewigen Kaiserin' });
  for (let x = cx - 16; x <= cx + 16; x += 4) prop('column', x, cy + 11, { solid: true, r: 6, label: 'Arkade' });
  METRO.square = [cx - 8, cy + 4];                                                   // frei auf dem Platz (nicht im Brunnen)
  // Aquädukt von Norden bis zur Zisterne, Kanal im Süden mit Brücken
  const aqx = cx + 44;
  for (let y = y0 - 30; y <= y0 + 22; y += 2) prop('aqueduct', aqx, y, { solid: y < y0 - 1 || y > y0 + 1, r: 8, label: 'Aquädukt' });
  prop('fountain', aqx, y0 + 25, { solid: true, r: 14, label: 'Zisterne des Nordviertels' });
  const kany = cy + 36;
  fill(x0 + 5, kany, x1 - 5, kany + 1, T.WATER);
  for (let x = x0 + 5; x <= x1 - 5; x++) if (Math.abs(x - cx) <= 2 || (x - x0) % 22 === 0) { set(x, kany, T.PLANK); set(x, kany + 1, T.PLANK); }
  // Häuserblöcke: Querstraßen alle 11 Kacheln, Häuser an beiden Seiten, je Bezirk eigene Typen
  const hs = [];
  const fits = (hx, hy, w, h) => hx > x0 + 5 && hx + w < x1 - 5 && hy > y0 + 5 && hy + h < y1 - 5 && HOUSES.every(q => q.town !== C.key || hx + w + 2 <= q.x || q.x + q.w + 2 <= hx || hy + h + 2 <= q.y || q.y + q.h + 2 <= hy)   // auch Abstand zu den Prachtbauten
    && [...Array(w * h).keys()].every(k => at(hx + (k % w), hy + ((k / w) | 0)) === T.GRASS);
  const put = (hx, hy, w, h, door, type) => { if (!fits(hx, hy, w, h)) return false; house('world', hx, hy, w, h, door, { type, town: C.key }); hs.push([hx, hy, w, h]); return true; };
  const SZ = { manor: [7, 6], house: [5, 4], store: [6, 5], tavern: [8, 6], healer: [5, 4], chapel: [7, 6], smithy: [6, 5], barn: [7, 5], cottage: [4, 4], barracks: [8, 5], stable: [7, 5], hall: [8, 6] };
  const block = (bx0, by0, bx1, by1, types, road = T.STONE) => {
    for (let ry = by0 + 6; ry < by1 - 3; ry += 11) {
      fill(bx0, ry - 1, bx1, ry + 1, road);
      let ti = 0;
      for (let hx = bx0 + 1; hx < bx1 - 4; hx += 1) {
        const ty = types[ti % types.length], [w, h] = SZ[ty] || [5, 4];
        if (put(hx, ry - 2 - h, w, h, 'S', ty)) { ti++; hx += w + 1; continue; }
      }
      ti = 1;
      for (let hx = bx0 + 2; hx < bx1 - 4; hx += 1) {
        const ty = types[ti % types.length], [w, h] = SZ[ty] || [5, 4];
        if (put(hx, ry + 2, w, h, 'N', ty)) { ti++; hx += w + 1; }
      }
    }
  };
  const D = METRO.districts = [];
  const district = (name, bx0, by0, bx1, by1, types, road, deco) => { D.push({ name, x0: bx0, y0: by0, x1: bx1, y1: by1 }); const n0 = props.length; if (deco) deco(bx0, by0, bx1, by1);
    for (const q of props.slice(n0)) if ((q.r || 0) >= 14) { const px = q.x / TS | 0, py = q.y / TS | 0, k = Math.ceil(q.r / TS) + 2; fill(px - k, py - k * 2, px + k, py + 2, T.STONE); }   // Prachtbau: Grund pflastern, keine Häuser darauf
    if (types) block(bx0, by0, bx1, by1, types, road); prop('sign', bx0 + 2, by0 + 1, { label: `${name} — Aurelheim` }); };
  const L = cx - 20, R = cx + 20, U = cy - 16, B = cy + 14;
  district('Regierungsviertel', cx - 18, y0 + 6, cx + 18, cy - 23, ['hall', 'manor', 'store'], T.STONE, (a, b) => { house('world', a + 1, b + 2, 12, 8, 'S', { type: 'court', town: C.key }); house('world', a + 22, b + 2, 12, 8, 'S', { type: 'library', town: C.key }); });
  district('Adelsviertel', x0 + 6, y0 + 6, L, U - 12, ['manor', 'manor', 'chapel'], T.STONE, (a, b, c, d) => { for (let x = a + 4; x < c - 2; x += 9) { prop('hedge', x, d - 1, { solid: true, r: 8 }); prop('statue', x + 4, d - 1, { solid: true, r: 10, label: 'Ahnenstandbild eines Hauses' }); } });
  district('Transportbezirk', x0 + 6, U - 10, L, U + 6, null, null, (a, b, c, d) => { fill(a, b, c, d, T.DIRT); for (let x = a + 3; x < c - 3; x += 8) { prop('cart', x, b + 4, { solid: true, r: 14, label: 'Frachtwagen' }); prop('hay', x + 3, b + 9, { solid: true }); prop('trough', x + 5, b + 12, { solid: true }); } house('world', a + 2, d - 6, 8, 5, 'N', { type: 'stable', town: C.key }); });
  district('Akademieviertel', R, y0 + 6, R + 36, U, ['store', 'hall', 'house'], T.STONE, (a, b) => { house('world', a + 1, b + 2, 16, 10, 'S', { type: 'academy', town: C.key }); house('world', a + 20, b + 2, 10, 10, 'S', { type: 'observatory', town: C.key }); });
  district('Magitech-Viertel', R + 38, y0 + 6, x1 - 6, U, ['smithy', 'store'], T.STONE, (a, b, c) => { house('world', a + 1, b + 8, 14, 8, 'S', { type: 'magitech', town: C.key }); for (let x = a + 18; x < c - 3; x += 12) prop('magitower', x, b + 5, { solid: true, r: 10, label: 'Magitech-Turm' }); });
  district('Handelsviertel', x0 + 6, cy + 4, L, cy + 30, ['store', 'store', 'tavern', 'house'], T.STONE, (a, b) => { house('world', a + 1, b + 2, 22, 11, 'S', { type: 'markethall', town: C.key }); house('world', a + 26, b + 2, 12, 9, 'S', { type: 'bank', town: C.key }); for (let x = a + 6; x < a + 40; x += 5) prop('stall', x, b + 18, { solid: true, label: 'Marktstand' }); });
  district('Bürgerstadt', x0 + 6, kany + 3, cx - 24, y1 - 6, ['house', 'house', 'store', 'healer', 'house'], T.STONE, (a, b) => { house('world', a + 1, b + 2, 14, 8, 'S', { type: 'hospital', town: C.key }); house('world', a + 18, b + 2, 11, 8, 'S', { type: 'bathhouse', town: C.key }); });
  district('Armenviertel', cx - 22, kany + 3, cx - 4, y1 - 6, ['cottage', 'cottage', 'house'], T.DIRT, (a, b, c, d) => { for (let i = 0; i < 6; i++) prop(i % 2 ? 'sack' : 'barrel', a + 2 + i * 3, d - 2, { label: 'Lumpenbündel' }); });
  district('Gildenviertel', R, cy + 4, R + 38, cy + 30, ['smithy', 'store', 'healer', 'smithy'], T.STONE, (a, b) => { for (let x = a + 4; x < a + 34; x += 10) prop('gearpile', x, b + 2, { solid: true, r: 8 }); });
  district('Industrieviertel', R + 40, cy + 4, x1 - 6, cy + 30, ['barn', 'smithy', 'barn'], T.STONE, (a, b, c) => { house('world', a + 1, b + 2, 20, 10, 'S', { type: 'factoryhall', town: C.key }); for (let x = a + 4; x < c - 4; x += 14) { prop('crane', x, b + 17, { solid: true, r: 10, label: 'Lastkran' }); prop('chimney', x + 6, b + 19, { solid: true, r: 7 }); } });
  district('Militärbezirk', cx + 4, kany + 3, x1 - 6, y1 - 6, ['barracks', 'barracks', 'stable'], T.STONE, (a, b) => { house('world', a + 30, b + 2, 16, 8, 'S', { type: 'legion', town: C.key }); fill(a + 2, b + 2, a + 26, b + 12, T.DIRT); prop('weapon_rack', a + 4, b + 3, { solid: true, label: 'Waffenlager der Sonnenlegion' }); prop('banner_torn', a + 14, b + 2, { label: 'Banner der Sonnenlegion' }); for (let x = a + 6; x < a + 26; x += 5) prop('hay', x, b + 9, { solid: true, label: 'Strohziel der Sonnenlegion' }); });
  // Außenstadt und landwirtschaftliche Vorstadt (vor den Mauern)
  for (const [fx, fy] of [[x0 - 26, cy - 40], [x0 - 26, cy + 10], [x1 + 4, cy - 40], [x1 + 4, cy + 10], [cx - 60, y1 + 4], [cx + 30, y1 + 4]]) { fill(fx, fy, fx + 20, fy + 12, T.FIELD); prop('scarecrow', fx + 10, fy + 6); }
  for (const [hx, hy] of [[x0 - 18, cy - 22], [x1 + 10, cy - 22], [x0 - 18, cy + 28], [x1 + 10, cy + 28]]) { house('world', hx, hy, 6, 5, 'S', { type: 'barn', town: 'aurel_vorstadt' }); prop('big_gear', hx + 8, hy + 2, { solid: true, r: 10, label: 'Windmühlenrad' }); }
  D.push({ name: 'Außenstadt', x0: x0 - 30, y0: y0 - 34, x1: x1 + 30, y1: y1 + 26, outside: true }, { name: 'Landwirtschaftliche Vorstadt', x0: x0 - 30, y0: y1, x1: x1 + 30, y1: y1 + 26, outside: true });
  const nHouses = HOUSES.filter(b => b.town === C.key).length;
  TOWN_PLAN[C.key] = { village: false, lord: 'aurel', metro: true, area: [x0, y0, x1, y1], old: [x0, y0, x1, y1], square: [cx - 8, cy + 4], perHead: Math.max(40, Math.round((hw * 2 + 1) * (hh * 2 + 1) / Math.max(1, nHouses * 2.2))), fields: [],
    plazas: [[T.STONE, cx - 18, cy - 14, cx + 18, cy + 12]], spread: { s: 1, a: [0, 0] }, design: { area: [-99, -99, -99, -99] } };
}
// Binnenseen: ruhige Senken im offenen Land, fern von Orten und Straßen (Wege gräbt ensureReach nach)
function lakes() {
  const m = MAPS.world, W = m.w, t = m.tiles, far = (x, y, d) => LOCATIONS.every(l => Math.hypot(l.x - x, l.y - y) > l.r + d);
  for (let i = 0; i < 40; i++) { const cx = 20 + Math.floor(nz(i, 61) * (W - 40)), cy = 20 + Math.floor(nz(61, i) * (m.h - 300)), rr = 5 + Math.floor(nz(i, 62) * 12);
    const tl = t[cy * W + cx]; if (!(tl === T.GRASS || tl === T.DIRT || tl === T.ASH || tl === T.MARSH) || !far(cx, cy, rr + 14) || townAt(cx, cy, rr + 8) || (cx < 240 && cy < 360)) continue;
    for (let y = cy - rr - 4; y <= cy + rr + 4; y++) for (let x = cx - rr - 4; x <= cx + rr + 4; x++) { const k = y * W + x, v = t[k];
      if (v === T.ROAD || v === T.WALL || v === T.PLANK || v === T.FIELD) continue;
      const d = Math.hypot(x - cx, (y - cy) * 1.25) - rr - (vnE(x + 90 * i, y, 5) - 0.5) * 6; if (d < 0) t[k] = T.WATER; else if (d < 2 && v === T.GRASS) t[k] = T.MARSH; }
  }
  for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if ((q.map || 'world') === 'world' && t[(q.y / TS | 0) * W + (q.x / TS | 0)] === T.WATER && q.type !== 'boat') props.splice(i, 1); }
}
// Dichte (Nutzer: „fast jede Stelle der Karte soll Landschaft, Orte, Wege oder Bauten zeigen“): je 52×52-Zelle vielleicht ein
// kleiner Ort nach Gegend — Gehöft, Wachturm, Lager, Banditenlager, Mine, Friedhof, Tempel, Ruine, Steinkreis, Außenposten,
// Wrack an der Küste. Jeder bekommt einen Namen (Silben je Gegend) und steht als Ort in LOCATIONS (poi) — kein rnd().
const POI_SYL = {
  men: [['Linden', 'Dorn', 'Hasel', 'Eichen', 'Grün', 'Weiden', 'Moos', 'Kreuz', 'Mühl', 'Adler', 'Sonnen', 'Birken', 'Fuchs', 'Rabens'], ['hof', 'feld', 'au', 'wacht', 'bruch', 'furt', 'hain', 'grund', 'tal', 'eck', 'stein']],
  eisen: [['Stahl', 'Eisen', 'Klingen', 'Schlacken', 'Ruß', 'Erz', 'Tiefen', 'Kohlen', 'Grau', 'Hammer', 'Frost'], ['grat', 'schlucht', 'fels', 'schacht', 'stollen', 'halde', 'hütte', 'wacht']],
  desert: [['Sand', 'Dünen', 'Glut', 'Staub', 'Salz', 'Sonnen', 'Durst', 'Geier'], ['ruinen', 'wacht', 'grab', 'brunnen', 'lager', 'spitze', 'senke', 'fels']],
  aurel: [['Gold', 'Kupfer', 'Messing', 'Silber', 'Rosen', 'Lilien', 'Zahnrad', 'Feder', 'Glocken', 'Hohen', 'Löwen'], ['stein', 'hof', 'wacht', 'werk', 'hall', 'garten', 'burg', 'tor', 'au']],
  dead: [['Blut', 'Schädel', 'Knochen', 'Asche', 'Grab', 'Toten', 'Moder', 'Schatten', 'Nacht', 'Aas', 'Seelen'], ['höhe', 'feld', 'moor', 'wacht', 'ruinen', 'hain', 'grube', 'stein', 'tor', 'kreuz']],
};
const POI_KIND = {
  men: ['farm', 'farm', 'farm', 'tower', 'camp', 'bandits', 'grave', 'temple', 'ruin', 'stones', 'outpost'],
  eisen: ['mine', 'mine', 'mine', 'camp', 'tower', 'ruin', 'outpost', 'grave'],
  desert: ['ruin', 'ruin', 'bandits', 'camp', 'stones', 'grave', 'tower'],
  dead: ['grave', 'grave', 'ruin', 'ruin', 'temple', 'stones', 'tower'],
  aurel: ['estate', 'estate', 'farm', 'farm', 'workshop', 'tower', 'techruin'],
};
const POI_NOUN = { estate: 'Adelssitz', workshop: 'Werkstatt', techruin: 'Maschinenruine', farm: 'Gehöft', tower: 'Wachturm', camp: 'Lager', bandits: 'Banditenlager', mine: 'Stollen', grave: 'Gräber', temple: 'Tempel', ruin: 'Ruine', stones: 'Steinkreis', outpost: 'Posten', wreck: 'Wrack' };
function scatterPOIs() {
  const m = MAPS.world, W = m.w, H = m.h, t = m.tiles, C = 52, taken = [], reach = new Uint8Array(W * H), [sx, sy] = TOWN_PLAN.eren.square;   // nur erreichbares Land (keine Stege zu Inselchen)
  { const q = [sy * W + sx]; reach[q[0]] = 1; while (q.length) { const k = q.pop(), x = k % W; for (const n of [k - 1, k + 1, k - W, k + W]) if (n >= 0 && n < W * H && !reach[n] && Math.abs((n % W) - x) <= 1 && !SOLID.has(t[n])) { reach[n] = 1; q.push(n); } } }
  const land = (x, y) => { const v = t[y * W + x]; return v === T.GRASS || v === T.DIRT || v === T.SAND || v === T.ASH || v === T.STONE || v === T.MARSH; };
  for (let cy = 0; cy < H; cy += C) for (let cx = 0; cx < W; cx += C) {
    const h = nz(cx + 11, cy + 13); if (h > 0.62) continue;
    const x = cx + 6 + Math.floor(nz(cx, cy + 5) * (C - 12)), y = cy + 6 + Math.floor(nz(cy, cx + 5) * (C - 12));
    if (x < 8 || y < 8 || x >= W - 8 || y >= H - 8) continue;
    const rg = regionAt(x, y), fam = rg === 'aurel' ? 'aurel' : rg === 'deadland' || rg === 'blight' ? 'dead' : rg === 'desert' || rg === 'badland' ? 'desert' : rg === 'eisen' || rg === 'mountain' ? 'eisen' : 'men';
    let coast = false;
    for (const [dx, dy] of [[9, 0], [-9, 0], [0, 9], [0, -9]]) if (t[(y + dy) * W + x + dx] === T.WATER && (y + dy) > 700 || (t[(y + dy) * W + x + dx] === T.WATER && (x < 60 || x > W - 60 || y < 60))) coast = true;
    let ok = true; for (let j = -4; j <= 4 && ok; j++) for (let i = -4; i <= 4; i++) if (!land(x + i, y + j)) { ok = false; break; }
    if ((!ok && !coast) || !reach[y * W + x]) continue;
    if (townAt(x, y, 10) || LOCATIONS.some(l => Math.hypot(l.x - x, l.y - y) < l.r + 12) || taken.some(([a, b]) => Math.hypot(a - x, b - y) < 30)) continue;
    if (x >= FORT[0] - 4 && x <= FORT[2] + 4 && y >= FORT[1] - 4 && y <= FORT[3] + 4) continue;
    const kinds = POI_KIND[fam], kind = coast && nz(x, y + 9) < 0.7 ? 'wreck' : kinds[Math.floor(nz(x + 3, y) * kinds.length)];
    if (kind === 'wreck') { let wx = null; for (const [dx, dy] of [[9, 0], [-9, 0], [0, 9], [0, -9]]) if (t[(y + dy) * W + x + dx] === T.WATER) { wx = [x + Math.sign(dx) * 7, y + Math.sign(dy) * 7]; break; } if (!wx) continue;
      prop('boat', wx[0], wx[1], { solid: true, r: 14, label: 'Schiffswrack' }); prop('debris', x, y); prop('barrel', x + 1, y + 1); prop('crate', x - 1, y); }
    else {
      for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if ((q.map || 'world') === 'world' && Math.abs(q.x / TS - x) < 6 && Math.abs(q.y / TS - y) < 6) props.splice(i, 1); }   // Lichtung
      buildPOI(kind, x, y, fam);
    }
    const S = POI_SYL[fam], name = S[0][Math.floor(nz(x, y + 1) * S[0].length)] + S[1][Math.floor(nz(y, x + 1) * S[1].length)];
    const threat = fam === 'dead' ? 4 : kind === 'techruin' ? 3 : fam === 'men' || fam === 'aurel' ? (kind === 'bandits' ? 2 : 1) : 2;
    const spawn = kind === 'bandits' ? (fam === 'desert' ? ['bandit', 'bandit_archer', 'bandit_spear'] : ['bandit', 'bandit', 'bandit_archer']) : kind === 'grave' && fam === 'dead' ? ['skeleton', 'ghoul', 'wraith']
      : kind === 'techruin' ? ['automat'] : kind === 'mine' && fam === 'eisen' ? ['goblin', 'goblin_warrior'] : kind === 'ruin' && fam !== 'men' ? ['skeleton', 'wild_dog'] : null;
    LOCATIONS.push({ key: `poi_${x}_${y}`, name: kind === 'wreck' ? `Wrack bei ${name}` : `${name} (${POI_NOUN[kind]})`, x, y, r: 8, kind: { farm: 'farm', tower: 'tower', camp: 'camp', bandits: 'camp', mine: 'mine', grave: 'ruin', temple: 'shrine', ruin: 'ruin', stones: 'shrine', outpost: 'tower', wreck: 'wreck', estate: 'farm', workshop: 'mine', techruin: 'ruin' }[kind],
      poi: kind, threat, fin: true, spawn, faction: kind === 'bandits' ? 'bandit' : fam === 'dead' ? 'undead' : undefined });
    taken.push([x, y]);
  }
}
function buildPOI(kind, x, y, fam) {
  const P = (tp, dx, dy, o = {}) => prop(tp, x + dx, y + dy, o);
  const clear = r => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const k = (y + j) * MAPS.world.w + x + i, v = MAPS.world.tiles[k]; if (v === T.ROCK || v === T.MARSH) MAPS.world.tiles[k] = T.DIRT; } };
  switch (kind) {
    case 'farm': clear(4); house('world', x - 2, y - 3, 5, 4, 'S', { type: 'cottage' }); rect('world', x - 4, y + 2, 8, 3, T.FIELD); P('scarecrow', 0, 3); P('hay', 4, -1); P('fence', -5, 2, { solid: true }); P('fence', 4, 2, { solid: true }); P('barrel', 3, 0); break;
    case 'tower': P('watchtower_ruin', 0, 0, { solid: true, r: 14 }); P('rubble', 2, 2); P('torch', -2, 2); if (fam !== 'dead') P('banner_torn', 2, -1, { label: 'Zerrissenes Banner' }); break;
    case 'camp': P('tent_prop', -2, 0, { solid: true }); P('tent_prop', 2, -1, { solid: true }); P('campfire_static', 0, 2, { solid: true, r: 10 }); P('barrel', 3, 2); P('crate', -3, 2); break;
    case 'bandits': for (let i = -4; i <= 4; i++) { P('palisade_prop', i, -4, { solid: true }); if (Math.abs(i) > 1) P('palisade_prop', i, 4, { solid: true }); }
      P('tent_prop', -2, -1, { solid: true, label: 'Räuberzelt' }); P('tent_prop', 2, -1, { solid: true, label: 'Räuberzelt' }); P('campfire_static', 0, 1, { solid: true, r: 10 }); P('crate', 3, 2, { loot: [] }); P('blood', -2, 2); break;
    case 'mine': clear(3); for (const [dx, dy] of [[-3, -2], [-1, -3], [2, -3], [3, -1]]) P('ore_node', dx, dy, { harvest: 'iron', solid: true }); P('broken_cart', 1, 1, { solid: true }); P('tent_prop', -3, 2, { solid: true, label: 'Hütte der Bergleute' }); P('crate', 3, 2); P('torch', 0, -1); break;
    case 'grave': for (let j = -1; j <= 1; j++) for (let i = -2; i <= 2; i++) P('gravestone', i * 2, j * 2, { solid: true, r: 7 }); P('candles', 0, 3); if (fam === 'dead') P('crypt', 0, -5, { solid: true, r: 16, label: 'Gruft' }); break;
    case 'temple': P(fam === 'dead' ? 'obelisk' : 'wayshrine', 0, 0, { solid: true, r: 10 }); for (let k = 0; k < 6; k++) P('broken_pillar', Math.round(Math.cos(k * 1.05) * 4), Math.round(Math.sin(k * 1.05) * 3), { solid: true, r: 9 }); P('candles', 1, 2); break;
    case 'ruin': for (let k = 0; k < 5; k++) P(k % 2 ? 'broken_pillar' : 'rubble', Math.round(Math.cos(k * 1.3) * 4), Math.round(Math.sin(k * 1.3) * 3), { solid: k % 2 === 1, r: 10 }); P('camp_ruin', 0, 0); if (fam === 'dead') P('bone_spire', 3, -3, { solid: true, r: 8 }); break;
    case 'stones': for (let k = 0; k < 7; k++) P('standing_stone', Math.round(Math.cos(k * 0.9) * 4), Math.round(Math.sin(k * 0.9) * 3), { solid: true, r: 8 }); break;
    case 'estate': clear(6); house('world', x - 3, y - 3, 6, 5, 'S', { type: 'manor', town: 'aurelheim_land' }); for (let i = -6; i <= 6; i += 2) { P('hedge', i, -5, { solid: true, r: 8 }); P('hedge', i, 5, { solid: true, r: 8 }); }
      P('statue', -5, 3, { solid: true, r: 10, label: 'Standbild eines Ahnherrn' }); P('lantern', 3, 3); P('automat_frame', 5, 2, { solid: true, r: 9, label: 'Wachautomat (ruht)' }); P('well', -2, 3, { solid: true }); break;
    case 'workshop': clear(4); house('world', x - 2, y - 3, 5, 4, 'S', { type: 'smithy', town: 'aurelheim_land' }); P('gearpile', 3, 0, { solid: true, r: 8, label: 'Zahnräder und Federn' }); P('automat_frame', -4, 1, { solid: true, r: 9, label: 'Halbfertiger Automat' }); P('cart', 1, 3, { solid: true }); P('crate', -2, 2); break;
    case 'techruin': for (let k = 0; k < 6; k++) P(k % 2 ? 'broken_pillar' : 'gearpile', Math.round(Math.cos(k * 1.05) * 4), Math.round(Math.sin(k * 1.05) * 3), { solid: true, r: 9, label: k % 2 ? undefined : 'Verrostetes Getriebe' }); P('automat_frame', 0, 0, { solid: true, r: 9, label: 'Zerstörter Automat' }); P('rubble', 2, 2); break;
    case 'outpost': for (let i = -3; i <= 3; i++) P('palisade_prop', i, -3, { solid: true }); P('watchtower_ruin', 3, -1, { solid: true, r: 14 }); P('tent_prop', -2, 0, { solid: true }); P('campfire_static', 0, 2, { solid: true, r: 10 }); P('banner_torn', -3, -2, { label: 'Wimpel eines Außenpostens' }); break;
  }
}
function coastline() {
  const m = MAPS.world, W = m.w, H = m.h, t = m.tiles;
  const guard = LOCATIONS.map(l => [l.x, l.y, l.r + 8]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dS = y < 740 && spornAt(x, y) < -12 ? seaLine(x) - y : 999, dW = x, dE = W - 1 - x, dN = y, d = Math.min(dW, dE, dN * 1.4, dS * 1.3);
    if (d > 140) continue;
    const c = 12 + vnE(x + 3000, y, 70) ** 2 * 120 + vnE(x + 4000, y, 23) * 34 + vnE(x + 5000, y, 7) * 10;   // tiefe Buchten, Landzungen, feine Zacken
    if (d >= c || t[y * W + x] === T.WATER) continue;
    if (x >= FORT[0] - 6 && x <= FORT[2] + 6 && y >= FORT[1] - 6 && y <= FORT[3] + 6) continue;   // Festungsring bleibt an Land
    if (guard.some(([gx, gy, r]) => (gx - x) * (gx - x) + (gy - y) * (gy - y) < r * r)) continue;
    t[y * W + x] = T.WATER;
  }
  for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if ((q.map || 'world') === 'world' && t[(q.y / TS | 0) * W + (q.x / TS | 0)] === T.WATER && q.type !== 'boat') props.splice(i, 1); }
}
// Türachsen frei (Tür, Kachel davor, Kachel dahinter) und keine festen Props auf Fels/Wasser — je nach Seed kam beides vor.
const ON_ROCK_OK = new Set(['obelisk', 'crypt', 'tower_ruin', 'watchtower_ruin', 'palisade_prop', 'rock_node', 'ore_node', 'boat']);
function clearDoors() {
  const m = MAPS.world, W = m.w, block = new Map();
  for (const b of HOUSES) { if (b.map !== 'world') continue; const [dx, dy] = b.doorTile, sx = b.door === 'W' ? 1 : b.door === 'E' ? -1 : 0, sy = b.door === 'S' ? -1 : b.door === 'N' ? 1 : 0;
    for (const [x, y] of [[dx, dy], [dx + sx, dy + sy], [dx - sx, dy - sy]]) block.set(y * W + x, b.id);
    const ox = dx - sx, oy = dy - sy, k = oy * W + ox; if (SOLID.has(m.tiles[k])) m.tiles[k] = T.DIRT; }
  for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if ((q.map || 'world') !== 'world') continue; const k = (q.y / TS | 0) * W + (q.x / TS | 0);
    if ((block.has(k) && q.house !== block.get(k)) || (q.solid && !ON_ROCK_OK.has(q.type) && SOLID.has(m.tiles[k]))) props.splice(i, 1); }
}
// Streu (Geröll, Knochen, Gräber) gehört nicht zwischen Häuser — je nach Seed landet sie dort; in Vharnholm sind Gräber gewollt
function tidyTowns() {
  for (let i = props.length - 1; i >= 0; i--) { const p = props[i]; if ((p.map || 'world') !== 'world' || p.house || p.planned || !SCATTER.has(p.type)) continue;
    const k = townAt(p.x / TS | 0, p.y / TS | 0); if (!k) continue;
    if (k === 'vharnholm' && p.type === 'gravestone') p.planned = true; else props.splice(i, 1); }
}
// Jeder Ort muss zu Fuß von Eren erreichbar sein (BUG-079 für alle Seeds): Wegsuche über die Kacheln; ein abgeschnittener Ort
// bekommt einen Erdweg zur nächsten erreichbaren Kachel (Hohlweg durch Fels), feste Props auf dem Weg werden entfernt.
function ensureReach() {
  const m = MAPS.world, W = m.w, H = m.h, seen = new Uint8Array(W * H), [sx, sy] = TOWN_PLAN.eren.square;
  const flood = k0 => { const q = [k0]; seen[k0] = 1; while (q.length) { const k = q.pop(), x = k % W;
    for (const n of [k - 1, k + 1, k - W, k + W]) if (n >= 0 && n < W * H && !seen[n] && Math.abs((n % W) - x) <= 1 && !SOLID.has(m.tiles[n])) { seen[n] = 1; q.push(n); } } };
  flood(sy * W + sx);
  for (const L of LOCATIONS) {
    const r = Math.max(3, Math.round(L.r / 2)); let ok = false;
    for (let dy = -r; dy <= r && !ok; dy++) for (let dx = -r; dx <= r; dx++) if (seen[(L.y + dy) * W + L.x + dx]) { ok = true; break; }
    if (ok) continue;
    let best = null;
    for (let d = 1; d < 160 && !best; d++) for (let i = -d; i <= d && !best; i++) for (const [x, y] of [[L.x + i, L.y - d], [L.x + i, L.y + d], [L.x - d, L.y + i], [L.x + d, L.y + i]])
      if (x > 1 && y > 1 && x < W - 2 && y < H - 2 && seen[y * W + x]) { best = [x, y]; break; }
    if (!best) continue;
    const n = Math.max(Math.abs(best[0] - L.x), Math.abs(best[1] - L.y)), cut = new Set();
    for (let i = 0; i <= n; i++) { const x = Math.round(L.x + (best[0] - L.x) * i / n), y = Math.round(L.y + (best[1] - L.y) * i / n);
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const k = (y + dy) * W + x + dx; if (SOLID.has(m.tiles[k])) m.tiles[k] = m.tiles[k] === T.WATER ? T.PLANK : T.DIRT; cut.add(k); } }   // über Wasser: Steg
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (q.solid && (q.map || 'world') === 'world' && cut.has((q.y / TS | 0) * W + (q.x / TS | 0))) props.splice(i, 1); }
    flood((best[1]) * W + best[0]);   // neu Erreichtes mitzählen
    for (const k of cut) if (!seen[k]) flood(k);
  }
}
// Karte wächst nach Westen: OX Spalten vorn, alles Erzeugte rückt um OX (Kacheln, Props, Häuser, Orte, Stadtpläne)
function shiftWest() {
  const O = MAPS.world, W = O.w + OX, H = O.h, t = new Uint8Array(W * H).fill(T.ROCK);
  for (let y = 0; y < H; y++) t.set(O.tiles.subarray(y * O.w, y * O.w + O.w), y * W + OX);
  MAPS.world = { w: W, h: H, tiles: t, design: O.design };
  for (const p of props) if ((p.map || 'world') === 'world') p.x += OX * TS;
  for (const b of HOUSES) if (b.map === 'world') { b.x += OX; b.doorTile = [b.doorTile[0] + OX, b.doorTile[1]]; }
  shiftCoords(OX); SHIFT = OX;
}
function shiftCoords(d) {
  for (const L of LOCATIONS) if (!L.fin) L.x += d;
  const sh = r => { r[0] += d; r[2] += d; };
  for (const P of Object.values(TOWN_PLAN)) { if (P.village) continue;
    sh(P.area); sh(P.old); P.square[0] += d;
    for (const k of ['fill', 'clear', 'plazas', 'streets']) for (const r of P[k] || []) { r[1] += d; r[3] += d; }
    for (const r of P.fields || []) sh(r);
    if (P.coreWalls) sh(P.coreWalls);
    for (const k of ['walls', 'palisade']) if (P[k]) { sh(P[k].rect); for (const g of P[k].gates) sh(g); }
    if (P.harbor) { const Hb = P.harbor; Hb.x0 += d; Hb.x1 += d; Hb.piers = Hb.piers.map(x => x + d); Hb.boats = Hb.boats.map(([x, y]) => [x + d, y]); }
    for (const h of [...(P.houses || []), ...(P.grow?.houses || [])]) h[1] += d;   // BUG-141: Aurelheim (Metropole) hat keine Hausliste — zweites Laden stürzte ab
    for (const p of [...(P.props || []), ...(P.grow?.props || [])]) p[1] += d;
    for (const r of P.grow?.gardens || []) sh(r);
  }
}
// Der Westen (Session 12, Nutzer: „Eisenfeste nur ein großes Festungsgebiet“): das Land setzt sich an der Naht fort (verzerrter
// Spiegel, Wälder, Wiesen, Moor), im Nordwesten steigt das Westgebirge an. Darin liegt das Festungsgebiet der Eisernen Kette:
// ein Mauerring mit Türmen und zwei Toren um Zitadelle, Steinbruch, Sklavenpferche, Kasernen und Äcker. Der Grubenhort der
// Goblins liegt draußen in den Wäldern, die Tributdörfer im Süden.
export const FORT = [36, 118, 222, 344];                                             // Mauerring (Kacheln, inklusive)
const westSrc = (x, y) => [Math.max(OX + 4, Math.min(OX + 250, 2 * OX - 1 - x + Math.round((vnE(x, y + 90, 31) - 0.5) * 34))), Math.max(0, Math.min(767, y + Math.round((vnE(x + 170, y, 29) - 0.5) * 34)))];
const westMtnAt = (x, y) => y < westMtn(x) - Math.max(0, x - 150) * 1.4;              // Gebirge flacht zur Naht hin ab
function buildWest() {
  const m = MAPS.world, W = m.w, H = m.h, t = m.tiles;
  const [f0, f1, f2, f3] = FORT, inF = (x, y) => x >= f0 && x <= f2 && y >= f1 && y <= f3;
  for (let y = 0; y < H; y++) for (let x = 0; x < OX; x++) {
    const [sx, sy] = westSrc(x, y), src = t[sy * W + sx], n = vnE(x + 2000, y, 22);
    let tl = NATURAL_T.has(src) ? src : T.GRASS;
    if (x < 2 || y < 2 || y >= H - 2) tl = T.ROCK;
    else if (y >= seaLine(x)) tl = T.WATER;
    else if (westMtnAt(x, y)) tl = vnE(x + 40, y, 7) > 0.4 ? T.ROCK : T.STONE;
    else if (inF(x, y)) tl = n < 0.62 ? T.GRASS : T.DIRT;                                  // im Ring: Wiese, Trampelpfade (keine grauen Flecken)
    t[y * W + x] = tl;
  }
  for (let y = 0; y < H; y += 3) for (let x = 2; x < OX; x += 3) {                   // Wälder wie im Land davor
    const jx = x + Math.floor(nz(x, y) * 3), jy = y + Math.floor(nz(y, x) * 3); if (jy >= H) continue;
    const tl = t[jy * W + jx], rg = rawRegion(...westSrc(jx, jy).map((v, i) => dT(i ? v : v - OX)));
    if (tl !== T.GRASS || inF(jx, jy) || westMtnAt(jx, jy + 3)) continue;
    if (nz(jx + 7, jy) < (rg === 'forest' ? 0.55 : rg === 'marsh' ? 0.12 : 0.1)) prop('tree', jx, jy, { solid: true, r: 12, hp: 3 });
  }
  // S14 (Nutzer: „im ganzen Steingebiet kann man keinen Stein abbauen“): Westgebirge und sein Fuß bekamen nie Steinknoten — Hash statt Zufall
  for (let y = 4; y < H - 4; y += 4) for (let x = 4; x < OX; x += 4) {
    const jx = x + Math.floor(nz(x, y + 5) * 4), jy = y + Math.floor(nz(y + 5, x) * 4), tl = t[jy * W + jx]; if (inF(jx, jy)) continue;
    const foot = !westMtnAt(jx, jy) && westMtnAt(jx, jy - 14);
    if ((tl === T.STONE && nz(jx + 11, jy) < 0.22) || (foot && (tl === T.GRASS || tl === T.DIRT) && nz(jx + 13, jy) < 0.12)) prop('rock_node', jx, jy, { harvest: 'stone', solid: true });
    else if (tl === T.STONE && nz(jx + 17, jy) < 0.03) prop('ore_node', jx, jy, { harvest: 'iron', solid: true });
  }
  // Mauerring: 2 Kacheln stark, Türme (5×5) an Ecken und alle 30 Kacheln, Osttor (zum Menschenland) und Südtor (Dörfer, Goblinwälder)
  const gate = (x, y) => (x >= f2 - 1 && y >= 169 && y <= 175) || (y >= f3 - 1 && x >= 211 && x <= 217);
  for (let y = f1; y <= f3; y++) for (let x = f0; x <= f2; x++) if ((x <= f0 + 1 || x >= f2 - 1 || y <= f1 + 1 || y >= f3 - 1) && !gate(x, y)) t[y * W + x] = T.WALL;
  const tower = (cx, cy) => { for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (!gate(cx + i, cy + j)) t[(cy + j) * W + cx + i] = T.WALL; prop('torch', cx, cy + 3); };
  for (let x = f0; x <= f2; x += 31) { tower(x + 1, f1 + 1); tower(x + 1, f3 - 1); }
  for (let y = f1; y <= f3; y += 30) { tower(f0 + 1, y + 1); tower(f2 - 1, y + 1); }
  tower(f2 - 1, f3 - 1); tower(f2 - 1, 165); tower(f2 - 1, 179); tower(207, f3 - 1); tower(221, f3 - 1);
  for (const [x, y] of [[f2 + 1, 167], [f2 + 1, 177], [209, f3 + 1], [219, f3 + 1]]) prop('banner_torn', x, y, { label: 'Banner der Eisernen Kette' });
  lay(186, 172, 440, 172); lay(214, 172, 214, 318); lay(95, 318, 214, 318); lay(214, 318, 214, 630, T.DIRT); lay(214, 430, 200, 430, T.DIRT);   // Tor → Menschenland; Steinbruch; Süden
  // Zitadelle: die Kettenfeste der Session 11, gespiegelt (Tor nach Osten)
  const R = (x, y, w, h, tile) => rect('world', 1091 - x - w, y - 212, w, h, tile);
  const Hs = (x, y, w, h, door, o) => house('world', 1091 - x - w, y - 212, w, h, door, o);
  const Pp = (tp, x, y, o = {}) => prop(tp, 1090 - x, y - 212, o);
  R(900, 362, 64, 44, T.WALL); R(902, 364, 60, 40, T.DIRT); R(902, 382, 32, 6, T.STONE); R(918, 364, 4, 40, T.STONE); R(900, 382, 2, 6, T.ROAD);
  R(934, 376, 24, 16, T.WALL); R(935, 377, 22, 14, T.DFLOOR); R(934, 382, 1, 4, T.DFLOOR);
  Pp('throne', 954, 384, { solid: true, r: 12, label: 'Thron des Kettenmeisters' }); for (const y of [379, 389]) Pp('banner_torn', 955, y, { label: 'Banner der Eisernen Kette' });
  Hs(906, 366, 7, 5, 'S', { type: 'barracks', town: 'kettenfeste' }); Hs(906, 397, 7, 5, 'N', { type: 'barracks', town: 'kettenfeste' });
  Hs(916, 366, 6, 5, 'S', { type: 'store', town: 'kettenfeste' }); Hs(916, 397, 6, 5, 'N', { type: 'smithy', town: 'kettenfeste' });
  for (const [x, y] of [[903, 380], [903, 389], [930, 380], [930, 389], [936, 380], [936, 387], [955, 380], [955, 387]]) Pp('torch', x, y);
  for (const [x, y] of [[926, 370], [926, 398], [944, 395]]) Pp('cage', x, y, { solid: true, r: 13, label: 'Käfig' });
  for (const [x, y] of [[922, 384], [912, 379], [912, 390]]) Pp('chain_post', x, y, { solid: true, r: 6, label: 'Kettenpfahl' });
  Pp('banner_torn', 899, 380, { label: 'Banner der Eisernen Kette' }); Pp('banner_torn', 899, 389, { label: 'Banner der Eisernen Kette' });
  for (const [tp, x, y, o] of [
    ['cart', 906, 376, { solid: true, label: 'Sklavenkarren' }], ['crate', 923, 367], ['crate', 924, 367, { v: 1 }], ['crate', 923, 368, { v: 2 }], ['barrel', 925, 368], ['sack', 926, 367],
    ['barrel', 914, 372], ['barrel', 915, 372], ['cask_rack', 929, 366, { solid: true }],
    ['anvil', 924, 402, { solid: true }], ['barrel', 926, 403], ['crate', 912, 402],
    ['campfire_static', 928, 390, { solid: true, r: 10 }], ['bench', 926, 392], ['bench', 930, 392], ['table', 928, 393, { solid: true }],
    ['tent_prop', 908, 392, { solid: true, label: 'Wachzelt' }], ['tent_prop', 908, 373, { solid: true, label: 'Wachzelt' }],
    ['cage', 930, 370, { solid: true, r: 13, label: 'Käfig' }], ['cage', 930, 399, { solid: true, r: 13, label: 'Käfig' }], ['cage', 950, 371, { solid: true, r: 13, label: 'Käfig' }],
    ['chain_post', 946, 373, { solid: true, r: 6, label: 'Kettenpfahl' }], ['chain_post', 948, 398, { solid: true, r: 6, label: 'Kettenpfahl' }],
    ['well', 912, 384, { solid: true }], ['torch', 920, 372], ['torch', 920, 396], ['torch', 945, 377], ['torch', 945, 391],
    ['banner_torn', 944, 383, { label: 'Banner der Eisernen Kette' }], ['sack', 946, 402], ['sack', 947, 402], ['crate', 960, 366], ['crate', 960, 401]]) Pp(tp, x, y, o || {});
  // Festungsstadt im Ring: gepflasterte Hauptstraßen, Häuserreihen (Kasernen, Lager, Schmiede, Ställe) in schwarzem Stein
  lay(40, 225, 220, 225, T.STONE); lay(40, 282, 212, 282, T.STONE); lay(100, 122, 100, 340, T.STONE); lay(150, 196, 150, 225, T.STONE);
  const ROW = [['barracks', 42], ['store', 53], ['house', 63], ['barracks', 107], ['smithy', 117], ['stable', 126], ['store', 158], ['barracks', 168], ['house', 180], ['barracks', 191]];
  for (const [i, [type, x]] of ROW.entries()) { const w = type === 'stable' || type === 'store' ? 6 : type === 'barracks' ? 7 : 5;
    house('world', x, 219, w, 5, 'S', { type, town: 'kettenfeste' }); if (i % 3 !== 1) house('world', x, 229, w, 5, 'N', { type: i % 2 ? 'house' : 'barracks', town: 'kettenfeste' }); }
  for (const x of [48, 70, 112, 164, 186]) { prop('torch', x, 223); prop('torch', x + 2, 228); }
  for (const [x, y] of [[104, 227], [150, 283], [60, 283]]) prop('well', x, y, { solid: true });
  // Im Ring: Steinbruch, Sklavenpferche mit Arbeitsfeldern, Kasernenreihe, Zeltlager
  rect('world', 60, 300, 38, 26, T.STONE);
  for (let i = 0; i < 26; i++) { const x = 62 + Math.floor(nz(i, 7) * 34), y = 302 + Math.floor(nz(i, 11) * 22); prop('rock_node', x, y, { harvest: 'stone', solid: true }); }
  for (const [x, y] of [[68, 328], [88, 328]]) prop('cage', x, y, { solid: true, r: 13, label: 'Käfig' });
  prop('tent_prop', 82, 332, { solid: true, label: 'Aufseherzelt' }); prop('torch', 76, 332); prop('torch', 84, 332);
  for (const [x0, y0] of [[52, 150], [52, 200], [84, 200]]) { rect('world', x0, y0, 26, 12, T.FIELD); prop('scarecrow', x0 + 13, y0 + 6); }   // Arbeitsfelder der Gefangenen
  for (const [x, y] of [[56, 240], [70, 240], [84, 240]]) { house('world', x, y, 8, 5, 'S', { type: 'barracks', town: 'kettenfeste' }); prop('chain_post', x + 4, y + 7, { solid: true, r: 6, label: 'Kettenpfahl' }); }   // Sklavenbaracken
  for (const [x, y] of [[110, 262], [122, 262], [134, 262], [146, 262]]) prop('tent_prop', x, y, { solid: true, label: 'Soldatenzelt' });
  prop('campfire_static', 128, 270, { solid: true, r: 10 }); for (const [x, y] of [[124, 272], [132, 272]]) prop('bench', x, y);
  for (const [x, y] of [[160, 240], [170, 240], [180, 240]]) prop('cage', x, y, { solid: true, r: 13, label: 'Sklavenpferch' });
  // Grubenhort: Lichtung in den Goblin-Wäldern (draußen, südlich des Rings)
  for (let i = 0; i < 260; i++) { const x = 140 + Math.floor(nz(i, 23) * 95), y = 370 + Math.floor(nz(23, i) * 120);
    const tl = t[y * W + x]; if ((tl === T.GRASS || tl === T.DIRT) && vnE(x + 300, y, 12) > 0.42 && !(x > 166 && x < 204 && y > 416 && y < 446) && Math.abs(x - 214) > 2) prop('tree', x, y, { solid: true, r: 12, hp: 3 }); }
  rect('world', 170, 420, 30, 22, T.DIRT);
  for (const [x, y] of [[174, 424], [192, 424], [174, 436], [194, 436]]) prop('tent_prop', x, y, { solid: true, label: 'Goblinhütte' });
  prop('campfire_static', 184, 430, { solid: true, r: 10 });
  prop('sign', 226, 170, { label: 'Kettentor — Die Eisenfeste. Wer hier Ketten hört, kehre um.' });
  eisenDistricts();
}
// Phase 4 (MP2 §53/§54): Die Eisenfeste wird eine Region — im Ring Schmiedeviertel, Mine mit Erzadern, Ställe und Lager am
// Kettentor, Arbeiterquartiere; vor der Mauer das Vorwerk mit Höfen und Feldern im Osten und ein Holzfällerlager im Süden.
// Die Plätze (EISEN_SITES) nutzt game.js für Arbeiter, Aufseher und Wachen.
export const EISEN_SITES = { smithy: [182, 300], mine: [46, 272], stables: [200, 192], vorwerk: [252, 212], lumber: [236, 352], quarters: [48, 318] };
function eisenDistricts() {
  const m = MAPS.world, W = m.w, t = m.tiles, clear = (x0, y0, x1, y1, tile) => {
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i], qx = q.x / TS | 0, qy = q.y / TS | 0; if ((q.map || 'world') === 'world' && qx >= x0 && qx <= x1 && qy >= y0 && qy <= y1) props.splice(i, 1); }
    if (tile != null) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const v = t[y * W + x]; if (v !== T.WALL && v !== T.WATER && v !== T.ROAD) t[y * W + x] = tile; } };
  // Schmiedeviertel (im Ring, Südosten)
  clear(164, 290, 208, 330, T.STONE);
  for (const [x, y] of [[166, 292], [178, 292], [190, 292]]) { house('world', x, y, 6, 5, 'S', { type: 'smithy', town: 'kettenfeste' }); prop('forge', x + 3, y + 7, { solid: true, label: 'Esse der Kette' }); prop('anvil', x + 5, y + 7, { solid: true, label: 'Amboss' }); prop('chimney', x + 6, y + 4, { solid: true, r: 7, label: 'Schornstein' }); }
  for (const [x, y] of [[168, 312], [184, 312], [200, 312]]) { prop('weapon_rack', x, y, { solid: true, label: 'Kettenwaffen' }); prop('crate_stack', x + 3, y + 1, { solid: true, label: 'Erzbarren' }); }
  lay(164, 305, 208, 305, T.STONE); prop('sign', 164, 304, { label: 'Schmiedeviertel der Kette' });
  // Mine (Westmauer): Stollen, Erzadern, Loren, Abraum
  clear(38, 262, 58, 290, T.DIRT);
  prop('mine_entrance', 40, 268, { solid: true, label: 'Kettenmine — Stollen' });
  for (let i = 0; i < 14; i++) prop('ore_node', 42 + Math.floor(nz(i, 41) * 14), 264 + Math.floor(nz(41, i) * 24), { harvest: 'iron', solid: true });
  for (const [x, y] of [[48, 276], [53, 284]]) prop('broken_cart', x, y, { solid: true, label: 'Erzlore' });
  prop('sign', 56, 270, { label: 'Kettenmine — Eisen für die Feste' });
  // Arbeiterquartiere neben dem Steinbruch
  for (const [x, y] of [[38, 300], [38, 312]]) house('world', x, y, 8, 5, 'E', { type: 'barracks', town: 'kettenfeste' });
  prop('chain_post', 50, 318, { solid: true, r: 6, label: 'Kettenpfahl' }); prop('trough', 52, 306, { solid: true, label: 'Wassertrog' });
  // Ställe und Lagerhäuser am Kettentor
  clear(188, 180, 214, 212, T.DIRT);
  house('world', 190, 182, 7, 5, 'S', { type: 'stable', town: 'kettenfeste' }); house('world', 203, 182, 7, 5, 'S', { type: 'store', town: 'kettenfeste' });
  house('world', 190, 198, 7, 5, 'N', { type: 'store', town: 'kettenfeste' }); house('world', 203, 198, 7, 5, 'N', { type: 'barn', town: 'kettenfeste' });
  for (const [x, y] of [[199, 190], [201, 194]]) prop('hay', x, y, { solid: true }); prop('trough', 197, 191, { solid: true }); prop('cart', 208, 192, { solid: true, r: 14, label: 'Lastkarren' });
  // Vorwerk vor dem Kettentor: Höfe, Felder, Zäune
  clear(230, 196, 280, 236, T.GRASS);
  for (const [x0, y0] of [[232, 198], [258, 198], [232, 220]]) { rect('world', x0, y0, 20, 10, T.FIELD); prop('scarecrow', x0 + 10, y0 + 5); }
  house('world', 260, 222, 6, 5, 'N', { type: 'house', town: 'kettenfeste' }); house('world', 268, 222, 7, 5, 'N', { type: 'barn', town: 'kettenfeste' });
  for (let x = 230; x <= 278; x += 4) prop('fence', x, 196, { solid: true }); prop('sign', 229, 210, { label: 'Vorwerk der Eisenfeste' });
  // Holzfällerlager vor dem Südtor
  clear(226, 344, 250, 362, T.DIRT);
  for (const [x, y] of [[230, 348], [238, 350], [244, 356]]) prop('fallen_tree', x, y, { solid: true, label: 'Gefällter Stamm' });
  for (const [x, y] of [[232, 356], [240, 358]]) prop('crate_stack', x, y, { solid: true, label: 'Holzstapel' }); prop('tent_prop', 247, 346, { solid: true, label: 'Holzfällerzelt' }); prop('campfire_static', 236, 346, { solid: true, r: 10 });
}
// Dorf: Platz mit Brunnen, Dorfstraße Ost–West, vier bis sechs Häuser mit der Tür zur Straße (eine Kate: dort lebt der Jäger),
// Acker mit Zaun und Scheuche, Weg zur nächsten Straße (link). Tributdörfer: Kettenpfahl am Platz, Abgabenkiste, weniger Vorrat.
const V_HOUSES = [['house', -12, -7, 5, 4, 'S'], ['cottage', -5, -7, 4, 4, 'S'], ['house', 3, -7, 5, 4, 'S'], ['barn', 10, -8, 6, 5, 'S'],
  ['cottage', -11, 3, 4, 4, 'N'], ['house', 4, 3, 5, 4, 'N']];
function buildVillages() {
  for (const V of VILLAGES) {
    const { x: cx, y: cy } = V, area = [cx - 14, cy - 10, cx + 16, cy + 10];
    const inA = (x, y) => x >= area[0] && x <= area[2] && y >= area[1] && y <= area[3];
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if ((q.map || 'world') === 'world' && inA(q.x / TS | 0, q.y / TS | 0)) props.splice(i, 1); }
    for (let y = area[1]; y <= area[3]; y++) for (let x = area[0]; x <= area[2]; x++) {       // Grund: Wiese, Hofränder, keine Felsen/Wasser
      const t = tileAt('world', x, y); if (t === T.ROCK || t === T.WATER || t === T.WALL || t === T.MARSH || t === T.ASH || t === T.SAND || t === T.STONE) setTile('world', x, y, V.tribute ? T.DIRT : T.GRASS); }
    // Weg zur Straße (2 breit), danach Dorfstraße und Platz — der Weg darf durch Fels und Wasser (Furt, Hohlweg)
    const [lx, ly] = V.link, n = Math.max(Math.abs(lx - cx), Math.abs(ly - cy));
    for (let i = 0; i <= n; i++) { const x = Math.round(cx + (lx - cx) * i / n), y = Math.round(cy + (ly - cy) * i / n);
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const t = tileAt('world', x + dx, y + dy); if (t !== T.ROAD && t !== T.WALL && t !== T.PLANK) setTile('world', x + dx, y + dy, T.DIRT); } }
    for (let i = props.length - 1; i >= 0; i--) { const q = props[i], qx = q.x / TS | 0, qy = q.y / TS | 0;
      if ((q.map || 'world') === 'world' && q.solid && tileAt('world', qx, qy) === T.DIRT && Math.abs((lx - cx) * (qy - cy) - (ly - cy) * (qx - cx)) / Math.max(1, n) < 2.5) props.splice(i, 1); }
    rect('world', area[0], cy - 1, area[2] - area[0] + 1, 3, T.DIRT);
    rect('world', cx - 3, cy - 3, 7, 7, T.DIRT); rect('world', cx - 1, cy - 1, 3, 3, T.STONE);
    for (const [type, ox, oy, w, h, door] of V_HOUSES) house('world', cx + ox, cy + oy, w, h, door, { type, town: V.key });
    const f = [cx - 13, cy + 8, cx - 5, cy + 10];                                                   // Acker im Süden
    for (let y = f[1]; y <= f[3]; y++) for (let x = f[0]; x <= f[2]; x++) setTile('world', x, y, T.FIELD);
    prop('scarecrow', cx - 9, cy + 9);
    prop('well', cx, cy - 2, { solid: true, r: 10 });
    for (const [t, dx, dy, o] of [['hay', 12, -2], ['laundry', -8, -2], ['barrel', 2, -3, { label: 'Regentonne' }], ['lantern', -3, 1], ['lantern', 4, 1],
      ['cart', 13, 2, { solid: true }], ['sack', 11, -2, { label: 'Kornsack' }], ['trough', 15, -2, { solid: true }]]) prop(t, cx + dx, cy + dy, o || {});
    if (V.tribute) { prop('chain_post', cx + 2, cy + 2, { solid: true, r: 6, label: 'Kettenpfahl — hier wird der Tribut gewogen' });
      prop('crate', cx - 2, cy + 2, { label: 'Abgabenkiste der Eisernen Kette' }); prop('banner_torn', cx + 3, cy - 3, { label: 'Banner der Eisernen Kette' }); }
    else prop('banner_torn', cx + 3, cy - 3, { label: { valen: 'Banner Valens', order: 'Banner des Ordens', merch: 'Zeichen der Freien Händler' }[V.lord] });
    prop('sign', lx + (lx > cx ? -1 : 1), ly + (ly > cy ? -1 : 1), { label: `${V.name}${V.tribute ? ' — zinst der Eisernen Kette' : ''}` });
    TOWN_PLAN[V.key] = { village: true, lord: V.lord, tribute: !!V.tribute, area, old: area, square: [cx, cy], perHead: 70, fields: [f],
      spread: { s: 1, a: [dT(cx), dT(cy)] }, design: { area: [-99, -99, -99, -99] } };
  }
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

// Der Alte Hain im Westwald (Session 5): Lichtung mit Quelle, Steinkreis, Pilzen — Miras Ort, Freischaltung des Druiden.
export function groveScene() {
  const P = (t, x, y, o = {}) => prop(t, x, y, { groveScene: true, ...o }), cx = 80, cy = 288;
  clearing(cx, cy, 5);
  setTile('world', cx, cy, T.WATER); setTile('world', cx + 1, cy, T.WATER);                    // die kranke Quelle
  for (const [dx, dy] of [[-4, -1], [-3, -3], [0, -4], [3, -3], [4, -1], [-3, 3], [3, 3]]) P('standing_stone', cx + dx, cy + dy, { solid: true, r: 8, label: 'Hainstein' });
  for (const [dx, dy] of [[-1, 2], [2, 2], [-2, -1], [3, 1]]) P('mushrooms', cx + dx, cy + dy, { r: 4 });
  P('flowers_prop', cx, cy + 2, { r: 4 }); P('flowers_prop', cx + 1, cy - 2, { r: 4 }); P('fallen_tree', cx - 2, cy + 4, { solid: true });
  P('candles', cx + 2, cy - 1, { r: 6 });
}

// Grenzöde (Session 6): Valens letzter Posten vor dem Totenreich und das Schlachtfeld davor. Hash statt rnd().
// Grenzwacht: Palisade 15×13 mit Tor nach Norden (Straße vom Kreuzweg) und nach Süden (Aschenpfad), Turm, Zelte, Feuer.
// Hundertfeld: Gräberreihen einer verlorenen Schlacht, Wracks, Valens zerrissene Banner, ein toter Späher mit seiner Tasche.
export function borderScenes() {
  const P = (t, x, y, o = {}) => prop(t, x, y, { borderScene: true, ...o });
  const x0 = 323, y0 = 343, x1 = 337, y1 = 355, gx = 330;
  for (let y = 250; y <= 360; y++) for (const x of [gx, gx + 1]) { const t = tileAt('world', x, y);   // Straße Kreuzweg-Oststraße → Grenzwacht → Aschenpfad
    if (!SOLID.has(t) || t === T.ROCK) setTile('world', x, y, t === T.ASH ? T.DIRT : T.ROAD); }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (tileAt('world', x, y) !== T.ROAD) setTile('world', x, y, T.DIRT);
  let k = 0; for (const p of props) { const x = p.x / TS | 0, y = p.y / TS | 0;               // Platz schaffen: Lager und Straße
    const inCamp = x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1, onRoad = (x === gx || x === gx + 1) && y >= 250 && y <= 360;
    if (!((inCamp || onRoad) && (p.map || 'world') === 'world')) props[k++] = p; }
  props.length = k;
  for (let x = x0; x <= x1; x++) for (const y of [y0, y1]) if (x !== gx && x !== gx + 1) P('palisade_prop', x, y, { solid: true, r: 10 });
  for (let y = y0 + 1; y < y1; y++) for (const x of [x0, x1]) P('palisade_prop', x, y, { solid: true, r: 10 });
  P('watchtower_ruin', x0 + 2, y0 + 2, { solid: true, label: 'Wachturm der Grenzwacht' });
  P('sign', gx - 1, y0 - 1, { label: 'Grenzwacht — letzter Posten Valens. Dahinter: niemandes Land.' });
  for (const [dx, dy] of [[4, 3], [9, 3], [11, 7]]) P('tent_prop', x0 + dx, y0 + dy, { solid: true });
  P('campfire_static', gx, y0 + 7, { solid: true, label: 'Wachfeuer' });
  P('weapon_rack', x0 + 2, y1 - 2, { solid: true }); P('weapon_rack', x0 + 4, y1 - 2, { solid: true });
  P('crate_stack', x1 - 2, y1 - 2, { solid: true }); P('barrel', x1 - 3, y1 - 3, { solid: true }); P('cart', x1 - 2, y0 + 4, { solid: true });
  P('banner_torn', gx - 2, y0 + 1); P('banner_torn', gx + 3, y0 + 1); P('banner_torn', gx - 2, y1 - 1);
  for (const [dx, dy] of [[4, 6], [9, 9], [3, 9]]) P('tent_prop', x0 + dx, y0 + dy, { solid: true });         // Mannschaftszelte
  P('firepit', x1 - 3, y0 + 9, { solid: true, label: 'Kochstelle' }); P('trough', x0 + 2, y0 + 5, { solid: true }); P('hay', x0 + 1, y0 + 6, { solid: true });
  P('barrel', x1 - 2, y1 - 4, { solid: true }); P('crate', x1 - 4, y1 - 2, { loot: ['bandage', 'dried_meat'], label: 'Vorratskiste der Wacht' });
  P('lantern', gx - 1, y0 + 1, { r: 6 }); P('lantern', gx + 2, y1 - 1, { r: 6 });
  // Hundertfeld
  const hx = 340, hy = 402;
  for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const x = hx - 9 + i * 3, y = hy - 3 + r * 3, h = nz(x * 7 + 1, y * 13 + 5);
    if (SOLID.has(tileAt('world', x, y))) continue;
    P(h < 0.75 ? 'gravestone' : 'bones', x, y, h < 0.75 ? { solid: true, r: 8 } : { r: 6 }); }
  for (const [dx, dy, t] of [[-12, -5, 'broken_cart'], [11, 5, 'broken_cart'], [-7, 6, 'banner_torn'], [4, -6, 'banner_torn'], [12, -3, 'banner_torn'],
    [-13, 2, 'rubble'], [8, 8, 'rubble'], [0, 8, 'bones'], [-4, -7, 'bones']]) if (!SOLID.has(tileAt('world', hx + dx, hy + dy))) P(t, hx + dx, hy + dy, t === 'broken_cart' ? { solid: true } : { r: 8 });
  P('bones', hx + 6, hy + 7, { r: 6, label: 'Toter Späher' });
  P('sack', hx + 7, hy + 7, { loot: ['scout_report', 'bandage'], label: 'Tasche des Spähers' });
}

// Totenreich-Erweiterung (Session 5): Knochenwald, Aschensee mit Seelenbrunnen. Hash statt rnd(), damit nichts verrutscht.
export function deadScenes() {
  const P = (t, x, y, o = {}) => prop(t, x, y, { deadScene: true, ...o });
  for (let y = 348; y <= 384; y++) for (let x = 452; x <= 490; x++) {                     // Knochenwald: tote Bäume, Knochentürme
    const d = Math.hypot(x - 470, y - 366), h = nz(x * 5 + 3, y * 11 + 1);
    if (d > 18 || [T.WATER, T.ROCK, T.DWALL, T.ROAD].includes(tileAt('world', x, y))) continue;
    const dense = d < 11 ? 0.26 : 0.16;                                                   // zur Mitte hin dichter
    if (h < dense) P('dead_tree', x, y, { solid: true }); else if (h < dense + 0.03) P('bone_spire', x, y, { solid: true }); else if (h < dense + 0.06) P('bones', x, y, { r: 6 });
  }
  P('camp_ruin', 472, 368, { label: 'Lager der Grabräuber' }); P('crate', 473, 369, { loot: ['bone', 'grave_seal'], label: 'Geraubtes Grabgut' });
  for (let y = 428; y <= 448; y++) for (let x = 306; x <= 330; x++) {                     // Aschensee: schwarzes Wasser, Rand aus Asche
    const d = Math.hypot((x - 318) * 0.9, y - 438) + (nz(x, y) - 0.5) * 2.2;
    if (d < 7.5) setTile('world', x, y, T.WATER); else if (d < 9 && tileAt('world', x, y) !== T.ROAD) setTile('world', x, y, T.ASH);
  }
  let k = 0; for (const p of props) { const x = p.x / TS | 0, y = p.y / TS | 0;         // was im neuen See stünde, versinkt
    if (!(x >= 306 && x <= 330 && y >= 428 && y <= 448 && tileAt('world', x, y) === T.WATER && (p.map || 'world') === 'world')) props[k++] = p; }
  props.length = k;
  P('well', 318, 447, { solid: true, rite: 'soulwell', label: 'Seelenbrunnen' }); P('candles', 317, 448, { r: 6 }); P('candles', 319, 448, { r: 6 });
  for (const [x, y] of [[309, 432], [327, 431], [308, 444], [328, 446]]) P('dead_tree', x, y, { solid: true });
  P('bones', 322, 449, { r: 6 }); P('obelisk', 318, 451, { solid: true, label: 'Brunnenwächter-Stein' });
}

// ---------------- Dungeons ----------------
// Register der Unterwelt-Karten: Name, Bodenbild, Ankunftstext. Alles, was früher „S.map === 'mine'“ prüfte, fragt hier
// (Refactoring §2, Punkt 1: ein zweiter Dungeon war mit der festen Verdrahtung nicht möglich — BUG-009).
export const DUNGEONS = {
  mine: { name: 'Verlassene Grube', floor: 'scree', amb: 'blight', enter: 'Du steigst in die Verlassene Grube hinab. Es riecht nach kaltem Eisen.' },
  deep: { name: 'Tiefhall', floor: 'dfloor', amb: 'frozen', enter: 'Du steigst die Frosttreppe hinab. Reif sitzt in den Fugen alter Steinmetzarbeit — hier hat jemand gebaut, der für die Ewigkeit baute.' },
  kerker: { name: 'Kerker', floor: 'dfloor', amb: 'blight', enter: 'Die Tür fällt ins Schloss. Stroh, Eisen, der Geruch von zu vielen Leuten auf zu wenig Raum.' },   // Phase 2 §26
  omega: { name: 'Krater des Gefallenen Sterns', floor: 'scree', amb: 'blight', open: true, enter: 'Du trittst durch den Riss. Der Himmel ist rot, der Boden warm. In der Mitte des Kraters atmet etwas, das größer ist als ein Haus.' },   // Phase 7
  garmadon: { name: 'Gruft des Toten Königs', floor: 'dfloor', amb: 'blight', enter: 'Stufen aus Knochen führen hinab. Die Luft ist warm und riecht nach altem Blut. Irgendwo unten schlägt etwas wie ein Herz.' },   // Phase 6 MP2 §63
  zwerge: { name: 'Tiefhall — Königsstadt der Zwerge', floor: 'dfloor', amb: 'frozen', bright: true, enter: 'Unter der toten Halle brennt Licht. Hämmer, Stimmen, der Geruch von Bier und Kohle: die Zwerge leben.' },   /* Nutzer §5d.6 */
  vault: { name: 'Gewölbe', floor: 'dfloor', amb: 'blight', enter: '' },   // S13: zufällige Gewölbe (game.js buildVault)
  sky: { name: 'Himmelsinsel von Aurelion', floor: 'marble', amb: 'aurel', open: true, enter: 'Licht, Wind, Stille. Unter dir liegt Aurelion wie eine Karte aus Messing und Stein.' },   // S12 E
  isle: { name: 'Tangkron, Gischtinseln', floor: 'grass', amb: 'coast', open: true, enter: 'Salz in der Luft, Möwen, Teer. Tangkron riecht nach Fisch und Streit. Auf dem Hügel liegt ein Schiff kieloben — dort wohnt Weißbart.' },   // S14 Seevolk
  tower: { name: 'Turm des Nachtglases', floor: 'dfloor', amb: 'blight', enter: 'Das Tor schließt sich lautlos. Grünes Licht wandert die Wände hinauf. Irgendwo über dir blättert jemand in einem Buch.' },   // S15 P6
  deck: { name: 'Auf See', floor: 'plank', amb: 'coast', open: true, enter: 'Die Taue knarren, das Land wird schmal. Vor euch nur Grau und Wasser.' },
};
export const MAP_KEYS = ['world', ...Object.keys(DUNGEONS)];
MAPS.vault = { w: 8, h: 8, tiles: new Uint8Array(64).fill(T.DWALL), entry: { x: 4 * TS, y: 4 * TS } };   // Platzhalter bis zur ersten Ebene

// Kerker (Phase 2, Master-Prompt 2 §26): ein Gang, oben und unten je vier Zellen hinter Gittern, Wachstube im Westen mit dem
// Ausgang. Wer verhaftet wird, sitzt hier seine Zeit ab (10–20 Minuten), isst, redet mit Mitgefangenen — oder bricht aus.
export function genKerker() {
  props.length = 0;
  seedRng(S.seed * 17 + 9);
  const w = 38, h = 22, tiles = new Uint8Array(w * h).fill(T.DWALL), M = 'kerker', o = { map: M };
  MAPS.kerker = { w, h, tiles };
  rect(M, 2, 10, 34, 2, T.DFLOOR); rect(M, 2, 7, 6, 8, T.DFLOOR);                      // Gang, Wachstube
  const cells = [];
  for (let i = 0; i < 4; i++) for (const top of [true, false]) {
    const x = 10 + i * 7, y = top ? 3 : 13; rect(M, x, y, 5, 6, T.DFLOOR);
    const dy = top ? 9 : 12; setTile(M, x + 2, dy, T.DFLOOR);                            // Zellentür zum Gang
    const c = { id: cells.length, x, y, door: [x + 2, dy], spot: { x: (x + 2) * TS + TS / 2, y: (top ? y + 2 : y + 3) * TS + TS / 2 } }; cells.push(c);
    prop('portcullis', x + 2, dy, { ...o, solid: true, r: 14, cellDoor: c.id, label: 'Zellentür' });
    prop('sack', x + 1, top ? y + 1 : y + 4, { ...o, label: 'Strohlager' }); prop('barrel', x + 4, top ? y + 1 : y + 4, { ...o, solid: true, r: 7, label: 'Eimer' });
  }
  prop('mine_exit', 2, 10, { ...o, portal: 'world', label: 'Ausgang des Kerkers' });
  prop('table', 5, 8, { ...o, solid: true, r: 10, label: 'Tisch der Wärter' }); prop('weapon_rack', 3, 7, { ...o, solid: true, label: 'Verwahrte Waffen' });
  for (const x of [9, 16, 23, 30, 35]) prop('torch', x, 10, o);
  MAPS.kerker.cells = cells; MAPS.kerker.entry = cells[0].spot; MAPS.kerker.exit = { x: 3 * TS + TS / 2, y: 10 * TS + TS / 2 };
  return baseProps('kerker', props.slice());
}
// Die schwebende Insel über Aurelheim (S12 E, Master-Prompt 2 §50): Marmorplateau im Himmel, Gärten, Palast, der Hof des
// Magischen Gerichts mit vier Thronen (Ewige Kaiserin, Rat der Häuser, Uhrwerk-Orakel, Magierkönig). Zugang: teurer
// Teleport vom Platz in Aurelheim oder als Angeklagter. Eigener Seed-Zweig, keine Zufälle aus der Weltgenerierung.
export function genSky() {
  props.length = 0;
  seedRng(S.seed * 13 + 3);
  const w = 64, h = 48, tiles = new Uint8Array(w * h).fill(T.WATER), M = 'sky', o = { map: M };
  MAPS.sky = { w, h, tiles };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot((x - 32) / 26, (y - 24) / 19) + (nz(x * 3, y * 5) - 0.5) * 0.08;
    if (d < 1) tiles[y * w + x] = d < 0.62 ? T.DFLOOR : T.GRASS;
  }
  rect(M, 30, 8, 5, 34, T.DFLOOR); rect(M, 12, 22, 40, 5, T.DFLOOR);                  // Kreuz der Hauptwege
  for (let x = 20; x <= 44; x++) { setTile(M, x, 7, T.DWALL); } for (let y = 7; y <= 14; y++) { setTile(M, 20, y, T.DWALL); setTile(M, 44, y, T.DWALL); }   // Rückwand des Gerichtshofs
  prop('mine_exit', 32, 40, { ...o, portal: 'world', label: 'Teleportkreis — hinab nach Aurelheim' });
  const seats = [[24, 10, 'Thron der Ewigen Kaiserin'], [28, 9, 'Bank des Rates der Häuser'], [36, 9, 'Sockel des Uhrwerk-Orakels'], [40, 10, 'Stuhl des Magierkönigs']];
  for (const [x, y, label] of seats) prop('throne', x, y, { ...o, solid: true, r: 12, label });
  for (const x of [22, 42]) { prop('big_gear', x, 13, { ...o, solid: true, r: 10, label: 'Rad der Rechtsprechung' }); prop('banner_torn', x, 8, { ...o, label: 'Banner des Hochreichs' }); }
  prop('chest', 32, 9, { ...o, loot: ['himmelssplitter'], label: 'Schrein des Himmelssplitters' });   // Phase 7: Artefakt für Omegas Ruf
  for (const [x, y] of [[26, 19], [38, 19], [26, 30], [38, 30]]) prop('statue', x, y, { ...o, solid: true, r: 10, label: 'Standbild eines Kaisers der ersten Zeit' });
  for (let y = 16; y <= 36; y += 4) { prop('lantern', 29, y, o); prop('lantern', 35, y, o); }
  for (let i = 0; i < 26; i++) { const x = 8 + ((i * 17) % 48), y = 14 + ((i * 11) % 22); if (tiles[y * w + x] === T.GRASS) prop(i % 3 ? 'hedge' : 'tree', x, y, { ...o, solid: true, r: 9 }); }
  prop('well', 32, 24, { ...o, solid: true, label: 'Sternbrunnen' }); prop('chimney', 46, 12, { ...o, solid: true, r: 7, label: 'Kessel des Palastes' });
  MAPS.sky.entry = { x: 32 * TS + TS / 2, y: 37 * TS };
  MAPS.sky.court = { x: 32 * TS + TS / 2, y: 15 * TS };
  return baseProps('sky', props.slice());
}
// S14 Seevolk (Nutzer): die Gischtinseln. Hauptstadt Tangkron an der Ostküste — Hafen mit Stegen, das Viertel des Salzbunds
// (Händler: Kontor, Lager, Markt, Schenke „Zur Salzwitwe“), das Viertel der Sturmklinge (Plünderer: Langhaus, Kampfgrube,
// Beutestapel) und dazwischen Weißbarts Halle im Rumpf der gestrandeten „Salzwitwe“. Im Südwesten das Fischerdorf Netzbucht
// (Netzleute, neutral). Eigener Seed-Zweig, keine Zufälle der Weltgenerierung.
export function genIsle() {
  props.length = 0;
  seedRng(S.seed * 29 + 5);
  const w = 112, h = 84, tiles = new Uint8Array(w * h).fill(T.WATER), M = 'isle', o = { map: M };
  MAPS.isle = { w, h, tiles };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot((x - 54) / 44, (y - 42) / 33) + (vnE(x * 2, y * 2, 9) - 0.5) * 0.22;
    if (d < 1) tiles[y * w + x] = d > 0.9 ? T.SAND : vnE(x + 40, y, 6) > 0.72 ? T.DIRT : T.GRASS;
  }
  for (let y = 10; y < 20; y++) for (let x = 44; x < 58; x++) if (tiles[y * w + x] !== T.WATER && vnE(x, y + 70, 4) > 0.5) tiles[y * w + x] = T.ROCK;   // Klippen im Norden
  const H = (x, y, hw, hh, door, type, name) => { const b = house(M, x, y, hw, hh, door, { type, town: 'tangkron' }); if (name) b.name = name; return b; };
  // Hafen: Kai (Planken) und drei Stege nach Osten, Boote dazwischen
  rect(M, 86, 30, 4, 26, T.PLANK);
  for (const y of [33, 42, 51]) rect(M, 90, y, 12, 2, T.PLANK);
  for (const [x, y] of [[96, 36], [99, 46], [95, 54]]) prop('boat', x, y, { ...o, solid: true, r: 14, label: 'Langboot' });
  prop('boat', 103, 38, { ...o, solid: true, r: 16, label: 'Die Möwe — Fährschiff des Salzbunds' });
  for (const [x, y] of [[88, 31], [87, 36], [88, 48], [87, 54]]) prop(x % 2 ? 'crate_stack' : 'barrel', x, y, { ...o, solid: true });
  prop('net_rack', 89, 44, { ...o, solid: true });
  // Straßen: Hafen → Markt → Halle; Querstraße Nord (Sturmklinge) – Süd (Salzbund)
  rect(M, 60, 41, 26, 3, T.ROAD); rect(M, 70, 24, 3, 32, T.ROAD); rect(M, 44, 42, 16, 2, T.DIRT); rect(M, 28, 43, 16, 2, T.DIRT);
  // Salzbund (Süden): Kontor, zwei Lager, Schenke, Markt mit Ständen
  H(74, 47, 9, 6, 'N', 'kontor', 'Kontor des Salzbunds'); H(62, 48, 7, 5, 'N', 'store', 'Salzlager'); H(62, 55, 7, 5, 'N', 'store', 'Tuchlager');
  H(75, 55, 9, 7, 'N', 'tavern', 'Schenke „Zur Salzwitwe“');
  for (const [x, y] of [[64, 45], [67, 45], [76, 45], [79, 45]]) prop('stall', x, y, { ...o, solid: true, r: 12, label: 'Marktstand des Salzbunds' });
  prop('sign', 73, 45, { ...o, label: 'Salzbund — gewogen, gezählt, verzollt. Wer betrügt, wird kielgeholt.' });
  // Sturmklinge (Norden): Langhaus, Kampfgrube, Beute
  H(74, 26, 11, 6, 'S', 'barracks', 'Langhaus der Sturmklinge'); H(60, 30, 6, 5, 'S', 'house'); H(60, 23, 6, 5, 'S', 'cottage');
  rect(M, 76, 34, 7, 5, T.SAND); for (const [x, y] of [[76, 34], [82, 34], [76, 38], [82, 38]]) prop('torch', x, y, o);
  prop('sign', 79, 39, { ...o, label: 'Die Grube. Wer fällt, zahlt die Runde. Wer liegen bleibt, zahlt nichts mehr.' });
  for (const [x, y] of [[73, 33], [84, 32]]) prop('weapon_rack', x, y, { ...o, solid: true, label: 'Beute der Sturmklinge' });
  for (const [x, y] of [[86, 26], [87, 27]]) prop('crate_stack', x, y, { ...o, solid: true, label: 'Geraubte Fracht mit Valens Siegel' });
  prop('banner_torn', 72, 25, { ...o, label: 'Banner der Sturmklinge: weißer Anker auf Schwarz' });
  // Weißbarts Halle: der Rumpf der Salzwitwe, kieloben auf den Strand gezogen
  const hall = H(46, 32, 14, 9, 'E', 'hall', 'Rumpf der Salzwitwe — Weißbarts Halle');
  prop('bench', 47, 36, { ...o, solid: true, r: 12, label: 'Stuhl aus Kiel und Walbein', seaThrone: true });
  prop('broken_pillar', 53, 31, { ...o, solid: true, r: 10, intact: true, label: 'Mast der Salzwitwe' });
  for (const [x, y] of [[57, 33], [57, 39]]) prop('banner_torn', x, y, { ...o, label: 'Weißer Anker auf Schwarz' });
  // Wohnhäuser zwischen den Vierteln
  for (const [x, y, d] of [[52, 24, 'S'], [64, 62, 'N'], [55, 49, 'N'], [48, 49, 'N'], [82, 60, 'N']]) H(x, y, 5, 4, d, x % 3 ? 'house' : 'cottage');
  prop('well', 67, 42, { ...o, solid: true, label: 'Zisterne' });
  // Netzbucht (Südwesten): Fischer, Boote, Netze
  for (const [x, y] of [[22, 55], [29, 57], [18, 49], [26, 49]]) H(x, y, 5, 4, 'S', 'fisher');
  for (const [x, y] of [[20, 63], [30, 64]]) prop('boat', x, y, { ...o, solid: true, r: 14, label: 'Fischerboot' });
  for (const [x, y] of [[24, 61], [27, 61], [33, 60]]) prop('net_rack', x, y, { ...o, solid: true });
  prop('campfire_static', 25, 58, { ...o, solid: true, r: 10 });
  // Wildnis: Kiefern, Klippen, Kräuter, Steine; Möwenfelsen im Norden
  for (let i = 0; i < 90; i++) { const x = 12 + Math.floor(nz(i, 31) * 80), y = 12 + Math.floor(nz(31, i) * 60), t = tiles[y * w + x];
    if (t === T.GRASS && !(x > 42 && x < 90 && y > 20 && y < 66) && !(x > 14 && x < 36 && y > 45 && y < 66)) prop(i % 5 ? 'tree' : 'bush', x, y, i % 5 ? { ...o, solid: true, r: 12, hp: 3 } : { ...o, harvest: 'herb' }); }
  for (let i = 0; i < 16; i++) { const x = 14 + Math.floor(nz(i, 37) * 76), y = 12 + Math.floor(nz(37, i) * 58); if (tiles[y * w + x] === T.GRASS || tiles[y * w + x] === T.SAND) prop('rock_node', x, y, { ...o, harvest: 'stone', solid: true }); }
  for (let i = 0; i < 6; i++) prop('bones', 46 + i * 2, 21 + (i % 2), { ...o, label: 'Möwenknochen' });
  MAPS.isle.entry = { x: 98 * TS + TS / 2, y: 42 * TS + TS / 2 };
  MAPS.isle.hall = { x: (hall.x + 3) * TS, y: (hall.y + 4) * TS + TS / 2 };
  MAPS.isle.pit = { x: 79 * TS + TS / 2, y: 36 * TS + TS / 2 };
  return baseProps('isle', props.slice());
}
// Deck für die Überfahrt (S14): ein Handelsschiff des Salzbunds auf offener See. Hier toben Sturm und Enterkampf.
export function genDeck() {
  props.length = 0;
  const w = 64, h = 40, tiles = new Uint8Array(w * h).fill(T.WATER), M = 'deck', o = { map: M }, X = 19, Y = 17;   // offene See ringsum
  MAPS.deck = { w, h, tiles };
  rect(M, X + 1, Y, 24, 7, T.PLANK); rect(M, X - 1, Y + 1, 2, 5, T.PLANK); rect(M, X + 25, Y + 1, 3, 5, T.PLANK); setTile(M, X + 28, Y + 3, T.PLANK);   // Rumpf mit Heck und Bug
  for (let x = X; x <= X + 27; x += 2) { prop('fence', x, Y - 1, { ...o, solid: true, r: 8, label: 'Reling' }); prop('fence', x, Y + 7, { ...o, solid: true, r: 8, label: 'Reling' }); }
  prop('broken_pillar', X + 8, Y + 3, { ...o, solid: true, r: 10, intact: true, label: 'Großmast' }); prop('broken_pillar', X + 19, Y + 3, { ...o, solid: true, r: 10, intact: true, label: 'Fockmast' });
  for (const [dx, dy] of [[3, 5], [12, 1], [23, 5], [25, 2]]) prop(dx % 2 ? 'barrel' : 'crate_stack', X + dx, Y + dy, { ...o, solid: true });
  prop('net_rack', X + 15, Y + 5, { ...o, solid: true, label: 'Tauwerk' });
  MAPS.deck.entry = { x: (X + 14) * TS, y: (Y + 3) * TS }; MAPS.deck.box = [X + 1, Y, X + 25, Y + 6];
  return baseProps('deck', props.slice());
}
// Gruft des Toten Königs (Phase 6, MP2 §63): drei Ebenen nach Norden hinab — das Beinhaus (Knochen, Fallen), die Blutkatakomben
// (Nekromanten, Blutbecken, Stachelfallen) und der Thronsaal Garmadons mit Leibwache und Hort. Eigener Seed-Zweig.
export function genGarmadon() {
  props.length = 0;
  seedRng(S.seed * 19 + 7);
  const w = 90, h = 96, tiles = new Uint8Array(w * h).fill(T.DWALL), M = 'garmadon', o = { map: M }, rooms = [];
  MAPS.garmadon = { w, h, tiles };
  const room = (x, y, rw, rh, tag, lvl) => { rect(M, x, y, rw, rh, T.DFLOOR); const r = { x, y, w: rw, h: rh, cx: x + (rw >> 1), cy: y + (rh >> 1), tag, lvl }; rooms.push(r); return r; };
  const corr = (a, b, wide = 3) => { let x = a.cx, y = a.cy;
    while (x !== b.cx) { for (let k = 0; k < wide; k++) setTile(M, x, y + k, T.DFLOOR); x += x < b.cx ? 1 : -1; }
    while (y !== b.cy) { for (let k = 0; k < wide; k++) setTile(M, x + k, y, T.DFLOOR); y += y < b.cy ? 1 : -1; } };
  // Ebene 1: Beinhaus
  const entry = room(38, 84, 14, 9, 'entry', 1), ossuary = room(12, 64, 26, 14, 'ossuary', 1), pits = room(54, 64, 24, 14, 'pits', 1);
  // Ebene 2: Blutkatakomben
  const stair1 = room(40, 52, 10, 6, 'stair1', 2), lab = room(8, 34, 22, 14, 'lab', 2), pool = room(36, 34, 18, 12, 'pool', 2), cata = room(60, 32, 22, 16, 'cata', 2);
  // Ebene 3: Thronsaal
  const stair2 = room(40, 24, 10, 5, 'stair2', 3), throne = room(22, 3, 46, 18, 'throne', 3), hoard = room(72, 6, 12, 10, 'hoard', 3);
  corr(entry, ossuary); corr(entry, pits); corr(ossuary, stair1); corr(pits, stair1); corr(stair1, lab); corr(stair1, pool); corr(stair1, cata);
  corr(pool, stair2); corr(stair2, throne, 4); corr(throne, hoard);
  prop('mine_exit', entry.cx, entry.y + entry.h - 1, { ...o, portal: 'world', label: 'Aufstieg ins Totenland' });
  for (const r of rooms) for (let i = 0; i < 2; i++) prop('torch', ri(r.x + 1, r.x + r.w - 2), r.y, o);
  const sign = (r, label) => prop('sign', r.cx, r.y + r.h - 2, { ...o, label });
  sign(stair1, 'Zweite Ebene — Die Blutkatakomben. Wer hier blutet, nährt den König.'); sign(stair2, 'Dritte Ebene — Der Thronsaal. Knie, oder steh zum letzten Mal.');
  // Beinhaus: Knochenwände, Schädelstapel, Gruben mit Stacheln
  for (let i = 0; i < 16; i++) prop(i % 3 ? 'bones' : 'bone_spire', ri(ossuary.x + 1, ossuary.x + ossuary.w - 2), ri(ossuary.y + 1, ossuary.y + ossuary.h - 2), { ...o, solid: i % 3 === 0, r: 8 });
  for (let i = 0; i < 8; i++) prop('spikes', ri(pits.x + 2, pits.x + pits.w - 3), ri(pits.y + 2, pits.y + pits.h - 3), { ...o, hazard: 16, label: 'Knochengrube' });
  for (let i = 0; i < 4; i++) prop('gravestone', pits.x + 3 + i * 5, pits.y + 1, { ...o, solid: true, r: 8 });
  prop('crate', ossuary.x + 1, ossuary.y + ossuary.h - 2, { ...o, loot: ['bandage', 'bandage', 'potion'], label: 'Vorrat eines Grabräubers' });
  // Blutkatakomben: Labor der Nekromanten, Blutbecken (Fallen), Grabnischen
  for (const [dx, dy] of [[3, 3], [8, 3], [13, 3], [3, 9], [13, 9]]) prop(dx === 8 ? 'altar_small' : 'candles', lab.x + dx, lab.y + dy, { ...o, solid: dx === 8, r: 8 });
  prop('shelf', lab.x + 18, lab.y + 1, { ...o, solid: true, r: 10 }); prop('desk', lab.x + 18, lab.y + 4, { ...o, solid: true, r: 10 });
  prop('chest', lab.x + lab.w - 2, lab.y + lab.h - 2, { ...o, loot: ['soul_vial', 'potion', 'bandage'], label: 'Truhe der Nekromanten' });
  for (let i = 0; i < 10; i++) prop('blood', ri(pool.x + 2, pool.x + pool.w - 3), ri(pool.y + 2, pool.y + pool.h - 3), o);
  for (let i = 0; i < 6; i++) prop('spikes', ri(pool.x + 2, pool.x + pool.w - 3), ri(pool.y + 2, pool.y + pool.h - 3), { ...o, hazard: 18, label: 'Blutdorn' });
  for (let y = cata.y + 2; y < cata.y + cata.h - 1; y += 3) for (let x = cata.x + 2; x < cata.x + cata.w - 1; x += 4) prop('gravestone', x, y, { ...o, solid: true, r: 8 });
  // Thronsaal: Säulenreihen, Kohlebecken, Banner, Thron; dahinter der Hort
  for (let i = 0; i < 7; i++) for (const y of [throne.y + 4, throne.y + throne.h - 4]) prop('broken_pillar', throne.x + 4 + i * 6, y, { ...o, solid: true, r: 11, intact: true });
  prop('throne', throne.cx, throne.y + 1, { ...o, solid: true, r: 16, label: 'Knochenthron Garmadons' });
  for (const dx of [-6, 6]) { prop('campfire_static', throne.cx + dx, throne.y + 3, { ...o, solid: true, label: 'Blutfeuer' }); prop('banner_torn', throne.cx + dx, throne.y, { ...o, label: 'Banner Garmadons' }); }
  prop('chest', hoard.cx, hoard.cy, { ...o, loot: ['garmadon_krone', 'garmadons_reue', 'potion', 'potion'], label: 'Hort des Toten Königs', garmHoard: true });
  for (let i = 0; i < 4; i++) prop(pick(['crate_stack', 'barrel', 'sack']), ri(hoard.x, hoard.x + hoard.w - 1), ri(hoard.y + 6, hoard.y + hoard.h - 1), { ...o, solid: true });
  MAPS.garmadon.rooms = rooms;
  MAPS.garmadon.entry = { x: entry.cx * TS + TS / 2, y: (entry.y + entry.h - 3) * TS };
  return baseProps('garmadon', props.slice());
}
// S15 P6: Turm des Nachtglases, innen. Zehn Ebenen übereinander (unten Eingang, oben Ilvars Studierzimmer), verbunden durch die
// Wendeltreppe (Gang in der Mitte), dazu die verbotene Bibliothek neben Ebene 8 (versiegelt, towerSeal) und die Krypta unter dem Turm.
export const TOWER_LEVELS = ['Eingangshalle', 'Bibliothek', 'Lehrsäle', 'Alchemielabor', 'Beschwörungskammer', 'Ritualraum', 'Observatorium', 'Seelenkammer', 'Verbotene Bibliothek', 'Ilvars Studierzimmer'];
export function genTower() {
  props.length = 0;
  seedRng(S.seed * 29 + 13);
  const w = 64, h = 160, tiles = new Uint8Array(w * h).fill(T.DWALL), M = 'tower', o = { map: M }, rooms = [];
  MAPS.tower = { w, h, tiles };
  const room = (x, y, rw, rh, lvl) => { rect(M, x, y, rw, rh, T.DFLOOR); const r = { x, y, w: rw, h: rh, cx: x + (rw >> 1), cy: y + (rh >> 1), lvl }; rooms.push(r); return r; };
  const col = [];                                                        // Ebenen 1–8 und 10 in der Säule; 9 daneben
  for (let i = 1; i <= 10; i++) col[i] = i === 9 ? null : room(20, 146 - (i - (i > 9 ? 2 : 1)) * 15, 24, 11, i);
  for (let i = 1; i < 10; i++) { const a = col[i], b = col[i + 1] || col[i + 2]; if (!a || !b || a === b) continue; rect(M, 31, b.y + b.h, 3, a.y - b.y - b.h, T.DFLOOR); }
  const lib9 = room(48, col[8].y + 1, 13, 9, 9); rect(M, 44, col[8].cy, 4, 2, T.DFLOOR);
  const crypt = room(2, 136, 14, 20, 0); rect(M, 16, 150, 4, 2, T.DFLOOR);
  const sign = (r, n) => prop('sign', r.x + 2, r.y + r.h - 2, { ...o, label: n });
  for (let i = 1; i <= 10; i++) { const r = i === 9 ? lib9 : col[i]; sign(r, `Ebene ${i} — ${TOWER_LEVELS[i - 1]}`); for (const dx of [2, r.w - 3]) prop('candles', r.x + dx, r.y + 1, { ...o, r: 6 }); }
  sign(crypt, 'Unter dem Turm — Krypta. Nicht alles hier ist tot. Nicht alles hier ist eingesperrt.');
  const L = col;
  prop('mine_exit', L[1].cx, L[1].y + L[1].h - 1, { ...o, portal: 'world', label: 'Tor hinaus ins Totenland' });
  for (const dx of [-8, 8]) prop('bone_spire', L[1].cx + dx, L[1].cy, { ...o, solid: true, r: 8 });
  for (let i = 0; i < 6; i++) prop('shelf', L[2].x + 2 + i * 4, L[2].y + 1, { ...o, solid: true, r: 10, label: 'Regal: Schriften über Seelen, Sterne und Gräber' });
  for (const dx of [6, 16]) prop('desk', L[2].x + dx, L[2].cy + 2, { ...o, solid: true, r: 10 });
  for (let i = 0; i < 4; i++) prop('desk', L[3].x + 4 + i * 5, L[3].cy, { ...o, solid: true, r: 10 });
  prop('campfire_static', L[4].cx, L[4].cy, { ...o, solid: true, r: 10, label: 'Kessel voll grüner Brühe' }); for (const dx of [-8, 8]) prop('barrel', L[4].cx + dx, L[4].y + 2, { ...o, solid: true, r: 8 }); prop('crate_stack', L[4].x + L[4].w - 3, L[4].cy, { ...o, solid: true });
  for (let k = 0; k < 10; k++) prop('candles', Math.round(L[5].cx + Math.cos(k * 0.628) * 5), Math.round(L[5].cy + Math.sin(k * 0.628) * 3), { ...o, r: 6 }); prop('blood', L[5].cx, L[5].cy, o);
  prop('altar_small', L[6].cx, L[6].y + 3, { ...o, solid: true, r: 10, label: 'Altar der verbotenen Rituale (erkaltet)' }); for (const dx of [-4, 4]) prop('banner_torn', L[6].cx + dx, L[6].y + 1, { ...o, label: 'Banner mit einem Auge, halb geschlossen' });
  prop('obelisk', L[7].cx, L[7].y + 3, { ...o, solid: true, r: 12, label: 'Sternrohr: Es zeigt nach Westen, auf den Krater des Gefallenen Sterns.' }); prop('desk', L[7].cx + 6, L[7].cy, { ...o, solid: true, r: 10, label: 'Sternkarte mit einem roten Riss mitten hindurch' });
  for (let i = 0; i < 5; i++) prop('crate_stack', L[8].x + 3 + i * 4, L[8].y + 2, { ...o, solid: true, soulJar: true, label: 'Gläser voller grünem Licht. In jedem bewegt sich etwas.' });
  for (let i = 0; i < 3; i++) prop('bone_spire', 44 + (i === 1 ? 1 : 0), L[8].cy - 1 + i, { ...o, solid: true, r: 9, towerSeal: true, label: 'Eine Kette aus Knochen versperrt den Gang' });
  for (let i = 0; i < 3; i++) prop('shelf', lib9.x + 2 + i * 4, lib9.y + 1, { ...o, solid: true, r: 10, label: 'Verbotene Schriften' }); prop('chest', lib9.cx, lib9.cy + 2, { ...o, loot: ['soul_vial', 'soul_vial', 'potion'], label: 'Ilvars verschlossene Truhe' });
  prop('desk', L[10].cx, L[10].y + 3, { ...o, solid: true, r: 10, label: 'Ilvars Pult: Aufzeichnungen über den Rotfall' }); prop('shelf', L[10].x + 2, L[10].y + 1, { ...o, solid: true, r: 10 }); prop('shelf', L[10].x + L[10].w - 3, L[10].y + 1, { ...o, solid: true, r: 10 });
  for (let y = crypt.y + 2; y < crypt.y + crypt.h - 3; y += 3) for (const x of [crypt.x + 3, crypt.x + crypt.w - 4]) prop('gravestone', x, y, { ...o, solid: true, r: 8 });
  for (let i = 0; i < 4; i++) prop('spikes', crypt.x + 5 + (i % 2) * 3, crypt.y + 4 + i * 4, { ...o, hazard: 14, label: 'Seelenfalle' });
  MAPS.tower.rooms = rooms; MAPS.tower.levels = L; MAPS.tower.lib9 = lib9; MAPS.tower.crypt = crypt;
  MAPS.tower.entry = { x: L[1].cx * TS + TS / 2, y: (L[1].y + L[1].h - 3) * TS };
  return baseProps('tower', props.slice());
}
// Krater des Gefallenen Sterns (Phase 7): Arena des Endkampfs — Asche, Blutlachen, ein Ring aus Obelisken, im Norden der Splitter
export function genOmega() {
  props.length = 0;
  seedRng(S.seed * 23 + 11);
  const w = 64, h = 56, tiles = new Uint8Array(w * h).fill(T.ROCK), M = 'omega', o = { map: M };
  MAPS.omega = { w, h, tiles };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot((x - 32) / 26, (y - 28) / 22) + (nz(x * 5, y * 3) - 0.5) * 0.1; if (d < 1) tiles[y * w + x] = d < 0.28 ? T.STONE : T.ASH; }
  prop('star_shard', 32, 9, { ...o, solid: true, r: 22, label: 'Herz des Gefallenen Sterns' });
  for (let k = 0; k < 12; k++) { const a = k * 0.524; prop('obelisk', Math.round(32 + Math.cos(a) * 21), Math.round(28 + Math.sin(a) * 17), { ...o, solid: true, r: 12 }); }
  for (let i = 0; i < 18; i++) prop('blood', 14 + ((i * 17) % 36), 14 + ((i * 11) % 28), o);
  for (let k = 0; k < 8; k++) prop('candles', Math.round(32 + Math.cos(k * 0.785) * 6), Math.round(28 + Math.sin(k * 0.785) * 5), o);
  prop('mine_exit', 32, 47, { ...o, portal: 'world', label: 'Riss zurück in die Welt' });
  MAPS.omega.entry = { x: 32 * TS + TS / 2, y: 44 * TS };
  return baseProps('omega', props.slice());
}

// Tiefhall (Frostkamm): Königshalle der alten Bergleute, unter dem Eis versiegelt. Anders als die Grube gebaut, nicht gegraben:
// gerade Hallen, Säulen, Gruft der Ahnen, Schmiede der Tiefe, Thronsaal mit Hrodvar, dahinter der Hort. Eigener Seed-Zweig.
export function genDeep() {
  props.length = 0;
  seedRng(S.seed * 11 + 5);
  const w = 72, h = 62, tiles = new Uint8Array(w * h).fill(T.DWALL);
  MAPS.deep = { w, h, tiles };
  const rooms = [], M = 'deep', o = { map: M };
  const room = (x, y, rw, rh, tag) => { rect(M, x, y, rw, rh, T.DFLOOR); const r = { x, y, w: rw, h: rh, cx: x + (rw >> 1), cy: y + (rh >> 1), tag }; rooms.push(r); return r; };
  const corr = (a, b, wide = 2) => {                          // gerade gebaute Gänge: erst waagrecht, dann senkrecht
    let x = a.cx, y = a.cy;
    while (x !== b.cx) { for (let k = 0; k < wide; k++) setTile(M, x, y + k, T.DFLOOR); x += x < b.cx ? 1 : -1; }
    while (y !== b.cy) { for (let k = 0; k < wide; k++) setTile(M, x + k, y, T.DFLOOR); y += y < b.cy ? 1 : -1; }
  };
  const entry  = room(30, 51, 12, 8, 'entry');
  const hall   = room(22, 30, 28, 15, 'hall');
  const ice    = room(4, 31, 12, 10, 'ice');
  const crypt  = room(56, 28, 12, 15, 'crypt');
  const forge  = room(5, 12, 15, 11, 'forge');
  const throne = room(24, 4, 24, 13, 'throne');
  const hoard  = room(54, 6, 10, 8, 'hoard');
  const secret = room(4, 46, 8, 6, 'secret');
  corr(entry, hall, 4); corr(hall, ice, 3); corr(hall, crypt, 3); corr(ice, forge); corr(forge, throne); corr(hall, throne, 4); corr(throne, hoard); corr(ice, secret);

  prop('mine_exit', entry.cx, entry.y + entry.h - 1, { ...o, portal: 'world', label: 'Aufstieg zum Frostkamm' });
  for (const [x, y] of [[entry.x + 1, entry.y + 1], [entry.x + entry.w - 2, entry.y + 1]]) prop('torch', x, y, o);
  prop('broken_pillar', entry.x + 2, entry.y + 4, { ...o, solid: true }); prop('broken_pillar', entry.x + entry.w - 3, entry.y + 4, { ...o, solid: true });
  // Säulenhalle: zwei Säulenreihen, zerrissene Banner an der Nordwand, Kerzen an den Säulenfüßen
  for (let i = 0; i < 5; i++) for (const y of [hall.y + 3, hall.y + hall.h - 4]) {
    const x = hall.x + 3 + i * 5; prop('broken_pillar', x, y, { ...o, solid: true, r: 11, intact: !(i === 1 && y > hall.cy) && i !== 4 });   // zwei sind gebrochen
    if (chance(0.4)) prop('candles', x + 1, y + 1, { ...o, r: 6 });
  }
  for (let i = 0; i < 4; i++) prop('banner_torn', hall.x + 5 + i * 6, hall.y, o);
  for (let i = 0; i < 6; i++) prop(pick(['rubble', 'bones', 'debris']), ri(hall.x + 1, hall.x + hall.w - 2), ri(hall.y + 5, hall.y + hall.h - 6), { ...o, r: 8 });
  prop('sign', hall.cx, hall.y + hall.h - 2, { ...o, label: 'Gemeißelt: „Wer hier gräbt, gräbt für den König. Wer hier stiehlt, bleibt.“' });
  // Eiskammern: eingestürzt, Eiszapfen fallen (Gefahr), Erfrorene
  for (let i = 0; i < 7; i++) prop('rubble', ri(ice.x, ice.x + ice.w - 1), ri(ice.y, ice.y + ice.h - 1), { ...o, r: 9 });
  for (let i = 0; i < 4; i++) prop('spikes', ri(ice.x + 1, ice.x + ice.w - 2), ri(ice.y + 1, ice.y + ice.h - 2), { ...o, hazard: 12, label: 'Eiszapfen' });
  prop('bones', ice.cx, ice.cy, { ...o, r: 6, label: 'Erfrorener Bergmann' });
  prop('crate', ice.x + 1, ice.y + ice.h - 2, { ...o, loot: ['bandage', 'dried_meat'], label: 'Proviantkiste' });
  // Ahnengruft: Grabsteine in Reihen, Altar, Kerzen
  for (let y = crypt.y + 2; y < crypt.y + crypt.h - 2; y += 3) for (let x = crypt.x + 2; x < crypt.x + crypt.w - 1; x += 3) prop('gravestone', x, y, { ...o, solid: true, r: 8 });
  prop('standing_stone', crypt.cx, crypt.y + 1, { ...o, solid: true, label: 'Ahnenstein der Bergleute' });   // kein Altar (Ordenstuch), kein Obelisk (nekromantisch)
  for (const dx of [-2, 2]) prop('candles', crypt.cx + dx, crypt.y + 1, { ...o, r: 6 });
  // Schmiede der Tiefe: Esse, Amboss, Waffengestell, Erz in den Wänden
  prop('forge', forge.x + 3, forge.y + 2, { ...o, solid: true, label: 'Esse der Tiefe' });
  prop('anvil', forge.x + 6, forge.y + 3, { ...o, solid: true, label: 'Königsamboss' });
  prop('weapon_rack', forge.x + forge.w - 3, forge.y + 1, { ...o, solid: true });
  for (let i = 0; i < 5; i++) prop('ore_node', ri(forge.x, forge.x + forge.w - 1), ri(forge.y + 5, forge.y + forge.h - 1), { ...o, harvest: 'iron', solid: true });
  prop('chest', forge.x + forge.w - 2, forge.y + forge.h - 2, { ...o, loot: ['pickaxe', 'iron', 'iron'], label: 'Werkzeugtruhe' });
  // Thronsaal: Thron am Nordende, Kohlebecken, Banner; Hrodvar wartet davor (game.js)
  prop('throne', throne.cx, throne.y + 1, { ...o, solid: true, r: 16, label: 'Thron unter dem Eis' });
  for (const dx of [-5, 5]) { prop('campfire_static', throne.cx + dx, throne.y + 3, { ...o, solid: true, label: 'Kohlebecken' }); prop('banner_torn', throne.cx + dx, throne.y, o); }
  for (let i = 0; i < 4; i++) prop('broken_pillar', throne.x + 2 + i * 6, throne.y + throne.h - 3, { ...o, solid: true, r: 11, intact: true });
  // Hort und Versteck
  prop('chest', hoard.cx, hoard.cy, { ...o, loot: ['kings_iron', 'plate_cuirass', 'iron', 'potion'], label: 'Tiefhall-Hort' });
  for (let i = 0; i < 3; i++) prop(pick(['crate_stack', 'barrel', 'sack']), ri(hoard.x, hoard.x + hoard.w - 1), ri(hoard.y, hoard.y + hoard.h - 1), { ...o, solid: true });
  prop('chest', secret.cx, secret.cy, { ...o, loot: ['kite_shield', 'potion'], label: 'Vergessene Nische' });
  for (const r of rooms) for (let i = 0; i < 2; i++) prop('torch', ri(r.x, r.x + r.w - 1), r.y, o);   // Fackeln an den Nordwänden

  MAPS.deep.rooms = rooms;
  MAPS.deep.entry = { x: entry.cx * TS + TS / 2, y: (entry.y + entry.h - 3) * TS };
  return baseProps('deep', props.slice());
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
  return baseProps('mine', props.slice());
}

// Feste Objekte (Bäume, Felsen, Gebäude) kennt nur game.js (Objekt-Index); es trägt hier die Prüfung ein.
export const occupied = { at: null };                // (map, tx, ty) → true, wenn ein festes Objekt auf der Kachel steht
const walkable = (map, x, y) => !SOLID.has(tileAt(map, x, y)) && !(occupied.at && occupied.at(map, x, y));
// Offen heißt: von der Kachel aus sind mindestens `need` Kacheln zu Fuß erreichbar (Flutfüllung, 4 Nachbarn). Verhindert
// Figuren, die in einem Felskessel, zwischen Bäumen oder hinter Zäunen eingesperrt entstehen (S12).
export function openSpot(map, x, y, need = 120) {
  if (!walkable(map, x, y)) return false;
  const seen = new Set([x + ',' + y]), q = [[x, y]];
  for (let i = 0; i < q.length; i++) {
    if (seen.size >= need) return true;
    const [cx, cy] = q[i];
    for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
      const k = nx + ',' + ny; if (seen.has(k) || !walkable(map, nx, ny)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen.size >= need;
}
export function freeSpotNear(map, tx, ty, radius = 6) {
  const need = MAPS[map] && MAPS[map].w * MAPS[map].h < 20000 ? 30 : 120;       // kleine Karten (Höhlen, Innenräume): kleinere Mindestfläche
  for (let r = radius; r <= radius + 12; r += 4)                                  // kein offener Platz: Suchkreis wachsen lassen
    for (let i = 0; i < 200; i++) {
      const x = tx + ri(-r, r), y = ty + ri(-r, r);
      if (walkable(map, x, y) && (!occupied.at || openSpot(map, x, y, need))) return { x: x * TS + TS / 2, y: y * TS + TS / 2 };
    }
  return { x: tx * TS, y: ty * TS };
}
