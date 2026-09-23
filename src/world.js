// Weltgenerierung: Greenmark-Grenzland (128x128) und die Verlassene Grube.
import { S, rnd, ri, pick, chance, seedRng, uid } from './state.js';

export const TS = 32;                // Kachelgröße
export const T = { GRASS:0, DIRT:1, ROAD:2, WATER:3, MARSH:4, STONE:5, PLANK:6, ROCK:7, WALL:8, SAND:9, DFLOOR:10, DWALL:11, ASH:12, FIELD:13 };
export const SOLID = new Set([T.WATER, T.ROCK, T.WALL, T.DWALL]);
export const SLOW = { [T.MARSH]:0.55, [T.WATER]:0.4, [T.SAND]:0.85 };

export const MAPS = {};              // {world:{w,h,tiles}, mine:{...}}

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
function house(map, x, y, w, h, doorSide = 'S') {
  rect(map, x, y, w, h, T.WALL);
  rect(map, x + 1, y + 1, w - 2, h - 2, T.PLANK);
  if (doorSide === 'S') setTile(map, x + (w >> 1), y + h - 1, T.PLANK);
  if (doorSide === 'N') setTile(map, x + (w >> 1), y, T.PLANK);
  if (doorSide === 'W') setTile(map, x, y + (h >> 1), T.PLANK);
  if (doorSide === 'E') setTile(map, x + w - 1, y + (h >> 1), T.PLANK);
}

// ---------------- Oberwelt ----------------
export function genWorld() {
  props.length = 0;
  seedRng(S.seed);
  const w = 512, h = 512, tiles = new Uint8Array(w * h).fill(T.GRASS);
  MAPS.world = { w, h, tiles };

  // Gelände
  for (let i = 0; i < 260; i++) blob('world', ri(4, w - 5), ri(4, h - 5), ri(2, 5), T.DIRT, 0.5);
  blob('world', 52, 100, 17, T.MARSH, 0.9);
  blob('world', 46, 108, 9, T.MARSH, 0.8);
  for (let i = 0; i < 26; i++) blob('world', ri(40, 64), ri(90, 112), ri(1, 3), T.WATER, 0.7);
  blob('world', 114, 96, 10, T.WATER, 0.85);            // See im Südosten
  for (let j = 0; j < h; j++) { setTile('world', 108 + ((j / 9) | 0) % 3, j, T.WATER); } // Fluss
  blob('world', 62, 16, 9, T.ROCK, 0.75);               // Grubenberg
  blob('world', 24, 20, 8, T.ROCK, 0.6);
  blob('world', 14, 110, 7, T.ROCK, 0.55);

  // Straßen
  for (let x = 20; x < 120; x++) { setTile('world', x, 64, T.ROAD); if (chance(0.5)) setTile('world', x, 63, T.ROAD); }
  for (let y = 18; y < 64; y++) { setTile('world', 62, y, T.ROAD); if (chance(0.4)) setTile('world', 63, y, T.ROAD); }
  for (let y = 64; y < 116; y++) { setTile('world', 60, y, T.DIRT); if (chance(0.3)) setTile('world', 61, y, T.DIRT); }

  // ---- Eren ----
  rect('world', 50, 56, 22, 18, T.DIRT);
  for (let x = 50; x < 72; x++) setTile('world', x, 64, T.ROAD);
  house('world', 53, 58, 6, 5, 'S'); prop('sign', 56, 63, { label:'Taverne „Zur Grauen Hand“', tag:'tavern' });
  house('world', 62, 58, 5, 4, 'S'); prop('anvil', 64, 62, { tag:'smithy', solid:true });
  house('world', 68, 59, 5, 4, 'W'); prop('sign', 67, 61, { label:'Heilerin', tag:'healer' });
  house('world', 52, 68, 5, 4, 'N'); prop('sign', 54, 67, { label:'Haus des Vorstehers', tag:'mayor' });
  house('world', 66, 68, 6, 5, 'N');
  rect('world', 58, 68, 6, 4, T.FIELD); prop('scarecrow', 60, 70);
  prop('stall', 59, 62, { tag:'market' }); prop('stall', 61, 62, { tag:'market' });
  prop('well', 60, 66, { solid:true });
  prop('board', 58, 65, { label:'Anschlagbrett', tag:'board' });
  prop('campfire_static', 57, 61);
  for (let i = 0; i < 12; i++) prop('crate', ri(51, 71), ri(57, 73));
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
  house('world', 114, 53, 5, 4, 'S'); house('world', 120, 53, 5, 4, 'S');
  prop('sign', 113, 57, { label:'Nordfurt — Tor' });

  // Moorruine mit Grabsiegel
  prop('marsh_ruin', 48, 104, { label:'Versunkener Stein', loot:['grave_seal'] });

  // ======================================================================
  //  DAS GRENZLAND VON EORL — große, zusammenhängende Welt (512×512)
  //  Greenmark ist nur die Heimat im Nordwesten. Dahinter liegen Großregionen,
  //  durch bewussten Raum getrennt: Reisen → Entdecken → Risiko → Belohnung.
  // ======================================================================
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
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (protectedNW(x, y)) continue;
    const idx = y * w + x; if (tiles[idx] !== T.GRASS) continue;   // handgebaute Kacheln nie überschreiben
    const jx = x + (nz(x, y) - 0.5) * 26, jy = y + (nz(y, x) - 0.5) * 26;   // organische Ränder
    let best = null, bd = 1e9;
    for (const c of centers) { const d = (c.x - jx) ** 2 + (c.y - jy) ** 2; if (d < bd) { bd = d; best = c; } }
    const base = BIOME[best.b];
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
  forestBelt(210, 200, 46, 600);    // Mittellandhaine
  forestBelt(150, 150, 40, 500);    // Übergangswald
  for (let i = 0; i < 140; i++) prop('bush', ri(20, 120), ri(240, 360), { harvest:'herb' });

  // ---- Salzhafen: große Hafenstadt an der Südküste ----
  rect('world', 138, 438, 26, 24, T.DIRT);
  for (let x = 138; x < 164; x++) setTile('world', x, 450, T.ROAD);
  house('world', 140, 440, 6, 5, 'S'); prop('sign', 143, 445, { label:'Salzhafen — Kontor', tag:'harbor' });
  house('world', 150, 440, 5, 4, 'S'); house('world', 158, 440, 5, 4, 'S');
  house('world', 140, 452, 5, 4, 'N'); house('world', 152, 452, 6, 5, 'N');
  prop('stall', 147, 449, { tag:'market' }); prop('stall', 149, 449, { tag:'market' });
  prop('well', 150, 451, { solid:true }); prop('board', 145, 450, { label:'Anschlagbrett', tag:'board' });
  for (let i = 0; i < 12; i++) prop('crate', ri(139, 162), ri(439, 461));
  for (let d = 0; d < 8; d++) { setTile('world', 146, 463 + d, T.PLANK); setTile('world', 147, 463 + d, T.PLANK); setTile('world', 156, 463 + d, T.PLANK); }   // Stege
  prop('cart', 142, 460); prop('campfire_static', 159, 458);

  // ---- Kreuzweg: Söldnerstadt im Herzen des Mittellands ----
  rect('world', 240, 240, 22, 18, T.DIRT);
  for (let x = 240; x < 262; x++) setTile('world', x, 250, T.ROAD);
  house('world', 242, 242, 6, 5, 'S'); prop('sign', 245, 247, { label:'Kreuzweg — Rasthaus', tag:'tavern' });
  house('world', 250, 242, 5, 4, 'S'); house('world', 256, 243, 5, 4, 'W');
  house('world', 242, 252, 5, 4, 'N'); house('world', 254, 251, 6, 5, 'N');
  prop('stall', 248, 249, { tag:'market' }); prop('stall', 250, 249, { tag:'market' });
  prop('well', 250, 247, { solid:true }); prop('board', 246, 250, { label:'Anschlagbrett', tag:'board' });
  prop('anvil', 253, 246, { tag:'smithy', solid:true });
  for (let i = 0; i < 10; i++) prop('crate', ri(241, 260), ri(241, 257));

  // ---- Aschfurt: befestigter Grenzposten (Händlerland) ----
  rect('world', 372, 84, 16, 16, T.DIRT);
  for (let x = 372; x < 388; x++) { setTile('world', x, 84, T.WALL); if (x < 378 || x > 381) setTile('world', x, 99, T.WALL); }
  for (let y = 84; y < 100; y++) { setTile('world', 372, y, T.WALL); setTile('world', 387, y, T.WALL); }
  house('world', 375, 87, 5, 4, 'S'); house('world', 381, 87, 5, 4, 'S');
  prop('stall', 378, 94, { tag:'market' }); prop('well', 380, 96, { solid:true });
  prop('sign', 376, 93, { label:'Aschfurt — Tor' }); prop('board', 382, 94, { label:'Anschlagbrett', tag:'board' });
  prop('watchtower_ruin', 373, 85, { solid:true });

  // ---- Sonnwacht: Feste des Ordens im Osten (Fraktionsgebiet) ----
  rect('world', 446, 246, 20, 20, T.STONE);
  for (let x = 446; x < 466; x++) { setTile('world', x, 246, T.WALL); if (x < 453 || x > 458) setTile('world', x, 265, T.WALL); }
  for (let y = 246; y < 266; y++) { setTile('world', 446, y, T.WALL); setTile('world', 465, y, T.WALL); }
  house('world', 449, 249, 6, 5, 'S'); house('world', 458, 249, 5, 4, 'S');
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
  prop('crypt', 404, 437, { solid:true, label:'Große Nekropole' });
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

  // ======================================================================
  //  ENTDECKEN — Streugut der Wildnis: nicht jeder Ort trägt eine Quest.
  // ======================================================================
  const inWild = (x, y) => !protectedNW(x, y) && ![T.WATER, T.ROAD, T.PLANK, T.WALL, T.DWALL].includes(tileAt('world', x, y));
  const cacheLoot = [['potion','longsword'], ['kite_shield','iron'], ['bandage','herb','herb'], ['dried_meat','bread'],
    ['chain_hauberk'], ['longbow'], ['iron_helm','potion'], ['mace','bandage'], ['leather_jerkin','bread']];
  let placed = 0;
  for (let i = 0; i < 900 && placed < 60; i++) {           // versteckte Truhen/Verstecke
    const x = ri(20, 500), y = ri(20, 500);
    if (inWild(x, y) && Math.hypot(x - 70, y - 70) > 60) { prop('chest', x, y, { loot: pick(cacheLoot), label: pick(['Verstecktes Bündel', 'Vergessene Truhe', 'Beutelager', 'Alter Vorrat']) }); placed++; }
  }
  for (let i = 0; i < 500; i++) {                          // verlassene Lager (Umgebungsstorytelling)
    const x = ri(20, 500), y = ri(20, 500);
    if (inWild(x, y) && chance(0.5)) { prop('camp_ruin', x, y, { label: pick(['Verlassenes Lager', 'Ausgebranntes Feuer', 'Zurückgelassene Habe']) });
      if (chance(0.4)) prop('crate', x + ri(-2, 2), y + ri(-2, 2), { loot: pick(cacheLoot) }); }
  }
  for (let i = 0; i < 400; i++) {                          // Ruinen und Säulen
    const x = ri(20, 500), y = ri(20, 500);
    if (inWild(x, y) && chance(0.4)) prop(pick(['broken_pillar', 'rubble', 'gravestone', 'fallen_tree']), x, y, { solid: chance(0.5) });
  }
  for (let i = 0; i < 260; i++) { const x = ri(20, 500), y = ri(20, 500); if (inWild(x, y)) prop('rock_node', x, y, { harvest:'stone', solid:true }); }
  for (let i = 0; i < 200; i++) { const x = ri(20, 300), y = ri(120, 460); if (tileAt('world', x, y) === T.GRASS) prop('bush', x, y, { harvest:'herb' }); }

  // Lichtungen entstehen nach dem Wald: Bäume nur auf Gras stehen lassen
  return props.filter(p => p.type !== 'tree' || tileAt('world', p.x / TS | 0, p.y / TS | 0) === T.GRASS);
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

export function freeSpotNear(map, tx, ty, radius = 6) {
  for (let i = 0; i < 200; i++) {
    const x = tx + ri(-radius, radius), y = ty + ri(-radius, radius);
    if (!SOLID.has(tileAt(map, x, y))) return { x: x * TS + TS / 2, y: y * TS + TS / 2 };
  }
  return { x: tx * TS, y: ty * TS };
}
