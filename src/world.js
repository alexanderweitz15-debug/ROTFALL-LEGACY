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
  const w = 128, h = 128, tiles = new Uint8Array(w * h).fill(T.GRASS);
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
