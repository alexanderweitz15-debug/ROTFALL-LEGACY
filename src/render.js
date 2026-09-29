// Rendering: Kacheln, Props, Sprites (prozedural gezeichnet), Effekte, Licht, Wetter.
import { S, clamp, seasonOf } from './state.js?v=17';
import { MAPS, T, TS, tileAt, regionAt, townAt, seaLine, HOUSES, DUNGEONS } from './world.js?v=17';
import * as HB from './buildings.js?v=17';
import { ITEMS, MONSTERS } from './data.js?v=17';
import { buildOf, crawling } from './body.js?v=17';
import * as SP from './sprites.js?v=17';
import { trailPt, WAGON_GAP } from './sim.js?v=17';
import { ICON_R } from './iconsR.js?v=17';
const PX = SP.PX;
const OUT_COL = '#0c0a08';

export const cam = { x: 0, y: 0, zoom: 1 };
let cv, ctx, W = 0, H = 0, dpr = 1;
const dark = document.createElement('canvas');
const dctx = dark.getContext('2d');

export function initCanvas(canvas) {
  cv = canvas; ctx = cv.getContext('2d');
  resize();
  new ResizeObserver(resize).observe(cv.parentElement);
}
export function resize() {
  if (!cv) return;
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  W = cv.parentElement.clientWidth; H = cv.parentElement.clientHeight;
  cv.width = Math.max(2, W * dpr); cv.height = Math.max(2, H * dpr);
  dark.width = Math.ceil(cv.width / 2); dark.height = Math.ceil(cv.height / 2);   // Licht ist weich: halbe Auflösung, ¼ der Pixel (Phase 20)
  ctx.imageSmoothingEnabled = false;
}
export const view = () => ({ W, H });
export function screenToWorld(sx, sy) { return { x: sx / cam.zoom + cam.x, y: sy / cam.zoom + cam.y }; }

function h2(x, y) { let n = (x * 374761393 + y * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }

const TILE_COL = {
  [T.GRASS]: ['#3e4c2a', '#46542d', '#384524'],   // Referenz 4: wärmer, oliv, mehr Tiefe
  [T.DIRT]:  ['#50402c', '#5a4730', '#463826'],
  [T.ROAD]:  ['#5a4d3a', '#645640', '#524634'],
  [T.WATER]: ['#22384a', '#284058', '#1d3040'],
  [T.MARSH]: ['#333a26', '#3b422c', '#2b3120'],
  [T.STONE]: ['#4a4741', '#534f48', '#413e39'],
  [T.PLANK]: ['#56402a', '#5e452c', '#4b3824'],
  [T.ROCK]:  ['#3a3733', '#44403a', '#312e2b'],
  [T.WALL]:  ['#3f3a33', '#48423a', '#36322c'],
  [T.SAND]:  ['#5c5540', '#665e47', '#544d3a'],
  [T.DFLOOR]:['#2e2a25', '#35302a', '#28241f'],
  [T.DWALL]: ['#1b1815', '#201d19', '#171411'],
  [T.ASH]:   ['#37332e', '#3e3934', '#2f2b27'],
  [T.FIELD]: ['#4f3e28', '#58452b', '#473824'],
};

// ---------------- Hauptbild ----------------
// Sichtliste (S12): alle Props je Bild zu filtern kostete bei ~14 000 Props ~0,4 ms. Props bewegen sich nicht: Raster (256 px)
// je Karte, neu gebaut, wenn sich die Objektzahl ändert (spätestens alle 1,5 s); Bewegliches (Figuren, Gegner, Beute) als kurze Liste.
const VIS = { arr: null, n: -1, grid: null, dyn: null, t: 0 }, GC = 256;
function visibleEnts(arr, xa, ya, xb, yb) {
  const now = performance.now();
  if (VIS.arr !== arr || VIS.n !== arr.length || now - VIS.t > 1500) {
    VIS.arr = arr; VIS.n = arr.length; VIS.t = now; VIS.grid = new Map(); VIS.dyn = [];
    for (const e of arr) { if (e.kind === 'prop' || e.kind === 'grave') { const k = ((e.x / GC) | 0) * 4096 + ((e.y / GC) | 0); let c = VIS.grid.get(k); if (!c) VIS.grid.set(k, c = []); c.push(e); } else VIS.dyn.push(e); }
  }
  const out = [], inView = e => e.x > xa && e.x < xb && e.y > ya && e.y < yb;
  for (let gy = Math.floor(ya / GC); gy <= Math.floor(yb / GC); gy++) for (let gx = Math.floor(xa / GC); gx <= Math.floor(xb / GC); gx++) { const c = VIS.grid.get(gx * 4096 + gy); if (c) for (const e of c) if (inView(e)) out.push(e); }
  for (const e of VIS.dyn) if (inView(e)) out.push(e);
  return out;
}
export function drawFrame(now) {
  if (!ctx) return;
  const m = MAPS[S.map]; if (!m) return;
  curRegion = S.map === 'world' && S.player ? regionAt(S.player.x / TS | 0, S.player.y / TS | 0) : 'greenmark';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#070906'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (cam.punch) { ctx.translate(W / 2, H / 2); ctx.scale(1 + cam.punch, 1 + cam.punch); ctx.translate(-W / 2, -H / 2); }   // Krit-Zoomstoß
  ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.x, -cam.y);

  const x0 = Math.max(0, Math.floor(cam.x / TS) - 1), y0 = Math.max(0, Math.floor(cam.y / TS) - 1);
  const x1 = Math.min(m.w - 1, Math.ceil((cam.x + W / cam.zoom) / TS)), y1 = Math.min(m.h - 1, Math.ceil((cam.y + H / cam.zoom) / TS));

  // Boden: gecachte 16×16-Kachel-Chunks (wenige drawImage statt tausender), danach nur Wasser animiert
  for (let cy = Math.floor(y0 / CH); cy <= Math.floor(y1 / CH); cy++)
    for (let cx = Math.floor(x0 / CH); cx <= Math.floor(x1 / CH); cx++)
      ctx.drawImage(chunkCanvas(m, cx, cy), cx * CH * TS, cy * CH * TS, CH * TS + 0.5, CH * TS + 0.5);
  prefetchChunk(m, Math.floor(x0 / CH), Math.floor(y0 / CH), Math.floor(x1 / CH), Math.floor(y1 / CH));
  const isW = (tx, ty) => tileAt(S.map, tx, ty) === T.WATER;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (m.tiles[ty * m.w + tx] === T.WATER && isW(tx - 1, ty) && isW(tx + 1, ty) && isW(tx, ty - 1) && isW(tx, ty + 1)) drawWater(tx, ty, now);

  // Objekte nach y sortiert; Gebäude sortieren an ihrer Grundlinie (was dahinter steht, verdeckt das Dach)
  const list = visibleEnts(S.ents[S.map], cam.x - 80, cam.y - 100, cam.x + W / cam.zoom + 80, cam.y + H / cam.zoom + 120);   // S12: Raster statt 14 000 Prüfungen
  for (const b of HOUSES) if (b.map === S.map && (b.x + b.w) * TS > cam.x - 40 && b.x * TS < cam.x + W / cam.zoom + 40 && (b.y + b.h) * TS > cam.y && b.y * TS - 60 < cam.y + H / cam.zoom)
    list.push(houseEnt(b));
  if (S.map === 'world') { if (TOWER_AT.arr !== S.ents.world) TOWER_AT = { arr: S.ents.world, e: S.ents.world.find(e => e.type === 'mage_tower') };   // S15 P6: der hohe Turm bleibt sichtbar, auch wenn sein Fuß unter dem Bildrand liegt
    const MT = TOWER_AT.e; if (MT && !list.includes(MT) && MT.x > cam.x - 220 && MT.x < cam.x + W / cam.zoom + 220 && MT.y > cam.y && MT.y < cam.y + H / cam.zoom + 900) list.push(MT); }
  list.sort((a, b) => (a.y + (a.kind === 'corpse' ? -999 : 0)) - (b.y + (b.kind === 'corpse' ? -999 : 0)));
  for (const e of list) if (e.cone && e.alive && !e.downed) {        // S12 E: Sichtkegel der Automaten (nur ohne Aufenthaltsschein)
    const a = e.aim || 0; ctx.fillStyle = e.cone === 2 ? 'rgba(220,60,40,.16)' : 'rgba(240,200,90,.10)';
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 150, a - 0.7, a + 0.7); ctx.closePath(); ctx.fill(); }
  for (const e of list) drawEntity(e, now);
  shown = list;
  for (const p of S.projectiles) drawProjectile(p);
  drawFx(now);
  const ch = S.player && S.player.channel;
  if (ch) {
    const t = S.ents[S.map].find(e => e.id === ch.targetId) || S.player, k = Math.min(1, ch.t / ch.dur);
    ctx.fillStyle = 'rgba(12,10,8,.85)'; ctx.fillRect(t.x - 16, t.y - 46, 32, 5);
    ctx.fillStyle = '#b8a370'; ctx.fillRect(t.x - 15, t.y - 45, 30 * k, 3);
  }

  drawSkyLife(now);   // Nutzer S13: Luftschiffe über Aurelion, Vögel über dem Land
  drawFires(now);     // S14: Brand in der Stadt
  ctx.restore();
  drawLight(now);
  drawWeather(now);
  drawFloats();
  drawBubbles(performance.now());
  drawBossBar();
  drawTrack(now);
}
// S13 (Nutzer: „man weiß nicht wohin“): Kompass zum verfolgten Auftrag — Pfeil am Bildrand mit Entfernung, im Bild eine Raute über dem Ziel
let track = null;
export function setTrack(t) { track = t; }
function drawTrack(now) {
  if (!track || !S.player || S.map !== 'world' || track.x == null) return;
  const tx = (track.x + 0.5) * TS, ty = (track.y + 0.5) * TS, sx = (tx - cam.x) * cam.zoom, sy = (ty - cam.y) * cam.zoom, w = W, h = H, m = 28;
  const d = Math.hypot(tx - S.player.x, ty - S.player.y), label = d > 999 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m';
  ctx.save(); ctx.font = `11px serif`; ctx.textAlign = 'center';
  if (sx > m && sx < w - m && sy > m && sy < h - m) {                // im Bild: pulsierende Raute über dem Ziel
    const b = Math.sin(now / 300) * 3; ctx.fillStyle = '#e0b75a'; ctx.beginPath(); ctx.moveTo(sx, sy - 40 + b); ctx.lineTo(sx + 6, sy - 32 + b); ctx.lineTo(sx, sy - 24 + b); ctx.lineTo(sx - 6, sy - 32 + b); ctx.fill();
  } else {                                                          // außerhalb: Pfeil am Rand
    const a = Math.atan2(sy - h / 2, sx - w / 2), k = Math.min((w / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (h / 2 - m) / Math.abs(Math.sin(a) || 1e-6)), px = w / 2 + Math.cos(a) * k, py = h / 2 + Math.sin(a) * k;
    ctx.translate(px, py); ctx.rotate(a); ctx.fillStyle = '#e0b75a'; ctx.strokeStyle = '#1a140c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-7, -8); ctx.lineTo(-3, 0); ctx.lineTo(-7, 8); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.rotate(-a); ctx.translate(-Math.cos(a) * 22, -Math.sin(a) * 22);
  }
  ctx.fillStyle = '#e8dcb8'; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.lineWidth = 3; const lx = 0, ly = 4;
  if (sx > m && sx < w - m && sy > m && sy < h - m) { ctx.strokeText(`${track.name} · ${label}`, sx, sy - 46); ctx.fillText(`${track.name} · ${label}`, sx, sy - 46); }
  else { ctx.strokeText(label, lx, ly); ctx.fillText(label, lx, ly); }
  ctx.restore();
}
// Sprechblasen der Bewohner (Talk-Pairs): über Licht und Wetter, damit sie lesbar bleiben; dunkles Feld mit Pergamentkante
let shown = [];
function drawBubbles(now) {
  const z = cam.zoom, placed = []; ctx.font = `${Math.round(10 * z * 0.75 + 4)}px Cinzel, serif`; ctx.textAlign = 'center';
  const hidden = e => { const tx = e.x / TS | 0, ty = e.y / TS | 0;   // unter einem Dach: nur hörbar, wenn man selbst im Haus ist (S14: zählt nicht gegen die 4 Plätze)
    return HOUSES.some(b => b.map === S.map && tx > b.x && tx < b.x + b.w - 1 && ty > b.y && ty < b.y + b.h - 1 && !playerInside(b)); };
  const P = S.player, talking = shown.filter(e => { const t = e.talk; return t && now >= t.at && now <= t.at + 2500 && now <= t.until && !hidden(e); })
    .sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y)).slice(0, 4);   // höchstens 4 Blasen, die nächsten zum Spieler
  for (const e of talking) {
    const t = e.talk;
    const a = Math.min(1, (now - t.at) / 150, (t.at + 2500 - now) / 250);
    const sx = Math.round((e.x - cam.x) * z), w = Math.ceil(ctx.measureText(t.say).width) + 10, h = Math.round(10 * z * 0.75 + 12);
    let sy = Math.round((e.y - 72 - cam.y) * z);                          // überlappt eine schon gezeichnete Blase: darüber ausweichen
    for (let k = 0; k < 6 && placed.some(r => Math.abs(r[0] - sx) < (r[2] + w) / 2 + 2 && Math.abs(r[1] - sy) < h + 2); k++) sy -= h + 3;
    placed.push([sx, sy, w]);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#c8b89a'; ctx.fillRect(sx - w / 2 - 1, sy - h - 1, w + 2, h + 2); ctx.fillRect(sx - 3, sy + 1, 6, 2); ctx.fillRect(sx - 1, sy + 3, 2, 2);   // Kante + Zipfel
    ctx.fillStyle = '#1a1612'; ctx.fillRect(sx - w / 2, sy - h, w, h); ctx.fillRect(sx - 2, sy, 4, 2);
    ctx.fillStyle = '#eadcc0'; ctx.fillText(t.say, sx, sy - h / 2 + 4);
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}
function drawBossBar() {
  const p = S.player; if (!p) return;
  const b = S.ents[S.map].find(e => e.boss && e.alive && Math.hypot(e.x - p.x, e.y - p.y) < 520);
  if (!b) return;
  const w = Math.min(420, W - 40), x = Math.round((W - w) / 2), y = H - 46, k = clamp(b.hp / b.maxHp, 0, 1);
  ctx.fillStyle = '#0c0a08'; ctx.fillRect(x - 3, y - 3, w + 6, 16);
  ctx.fillStyle = '#2a1512'; ctx.fillRect(x, y, w, 10);
  ctx.fillStyle = '#8c2a22'; ctx.fillRect(x, y, Math.round(w * k), 10);
  ctx.fillStyle = '#c0503a'; ctx.fillRect(x, y, Math.round(w * k), 2);
  ctx.fillStyle = '#e7dcc2'; ctx.fillRect(x + w / 2 - 1, y - 3, 2, 16);               // Phasenwechsel bei 50 %
  ctx.font = '600 13px Cinzel, serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#0c0a08'; ctx.fillText(b.title || (MONSTERS[b.mtype] || {}).name || 'Boss', W / 2 + 1, y - 7);
  ctx.fillStyle = b.phase >= 2 ? '#e0806a' : '#e7dcc2'; ctx.fillText(b.title || (MONSTERS[b.mtype] || {}).name || 'Boss', W / 2, y - 8);
  ctx.textAlign = 'left';
}

const TILE_KIND = {
  [T.GRASS]: 'grass', [T.DIRT]: 'dirt', [T.ROAD]: 'road', [T.WATER]: 'water', [T.MARSH]: 'marsh', [T.STONE]: 'stone',
  [T.PLANK]: 'plank', [T.ROCK]: 'rock', [T.WALL]: 'wall', [T.SAND]: 'sand', [T.DFLOOR]: 'dfloor', [T.DWALL]: 'dwall',
  [T.ASH]: 'ash', [T.FIELD]: 'field',
};
const SOLID_T = new Set([T.WALL, T.ROCK, T.DWALL]);
// Regionen: Farbwelt (Tönung des Bodens), Baumarten, Nahdetails, Atmosphäre (Nebel, Partikel, Dunkelheit).
const REGION = {
  greenmark: { tint: null,                     trees: ['oak', 'pine', 'birch'],  decor: 'meadow' },
  plains:    { tint: 'rgba(170,150,70,.10)',   trees: ['oak', 'birch', 'oak'],   decor: 'meadow', dust: '#c9b98a' },
  forest:    { tint: 'rgba(6,22,16,.24)',      trees: ['pine', 'pine', 'oak'],   decor: 'forest', dark: 0.06, fog: 'rgba(20,40,30,.06)', mote: '#8a6a3a' },
  marsh:     { tint: 'rgba(24,44,34,.16)',     trees: ['willow', 'dead', 'willow'], decor: 'marsh', dark: 0.05, fog: 'rgba(110,130,110,.12)' },
  mountain:  { tint: 'rgba(190,200,215,.10)',  trees: ['snowpine'],              decor: 'snow',  mote: '#e8eef2', fall: 1 },
  desert:    { tint: 'rgba(180,90,40,.10)',    trees: ['dead'],                  decor: 'desert', dust: '#c89a6a' },
  badland:   { tint: 'rgba(90,40,30,.16)',     trees: ['dead'],                  decor: 'ember', mote: '#d06a2a', rise: 1 },
  aurel:     { tint: 'rgba(120,130,60,.05)',   trees: ['oak', 'birch', 'oak'],   decor: 'meadow' },   // S12 Hochreich Aurelion: gepflegtes Land
  eisen:     { tint: 'rgba(30,24,22,.18)',     trees: ['pine', 'dead', 'pine'],  decor: 'snow',  dark: 0.05, mote: '#7a746a', fall: 1 },   // S12 Eisenmark (Westen): Asche fällt
  deadland:  { tint: 'rgba(90,12,14,.24)',     trees: ['dead'],                  decor: 'blight', dark: 0.16, fog: 'rgba(80,16,16,.10)', mote: '#8a2a22', fall: 1 },   // S12 Totenland (Osten)
  blight:    { tint: 'rgba(16,26,24,.26)',     trees: ['dead'],                  decor: 'blight', dark: 0.15, fog: 'rgba(50,80,70,.14)', mote: '#7a7a72', fall: 1 },
};
let curRegion = 'greenmark';                              // Region des Spielers (je Frame)
const propRegion = new WeakMap();
const regionOfProp = e => { let r = propRegion.get(e); if (!r) { r = regionAt(e.x / TS | 0, e.y / TS | 0); propRegion.set(e, r); } return r; };
// Kacheln: 16×16-Pixeltexturen (sprites.js) werden in Chunks zu 16×16 Kacheln in Texturauflösung gebacken
// (256×256 px, doppelt skaliert gezeichnet). LRU-begrenzt; neu gebacken, wenn sich die Karte ändert (m.ver).
const CH = 16, CHUNK_MAX = 140, chunkCache = new Map(), chunkRef = {};
// Chunks im Ring um das Sichtfeld vorab backen — in der Leerlaufzeit des Browsers zwischen zwei Frames, solange
// genug Zeit bleibt. Sonst kostet das Backen (Boden pro Pixel, Fels, Wasser) beim Laufen einen spürbaren Ruckler,
// sobald ein neuer Chunk ins Bild kommt. Ohne requestIdleCallback: kurzer Timeout, je Aufruf ein Chunk.
let pfArgs = null, pfQueued = false;
const idle = window.requestIdleCallback || (f => setTimeout(() => f({ timeRemaining: () => 12 }), 30));
function prefetchChunk(m, cx0, cy0, cx1, cy1) {
  pfArgs = [m, S.map, cx0, cy0, cx1, cy1];
  if (pfQueued) return;
  pfQueued = true;
  idle(dl => {
    pfQueued = false;
    while (dl.timeRemaining() > 8 && prefetchOne()) {}
  });
}
function prefetchOne() {
  const [m, map, cx0, cy0, cx1, cy1] = pfArgs || [];
  if (!m || map !== S.map || MAPS[S.map] !== m) return false;
  const mw = Math.ceil(m.w / CH), mh = Math.ceil(m.h / CH);
  for (let cy = cy0 - 1; cy <= cy1 + 1; cy++) for (let cx = cx0 - 1; cx <= cx1 + 1; cx++) {
    if (cx >= cx0 && cx <= cx1 && cy >= cy0 && cy <= cy1) continue;
    if (cx < 0 || cy < 0 || cx >= mw || cy >= mh || chunkCache.has(S.map + ':' + cx + ',' + cy)) continue;
    chunkCanvas(m, cx, cy); return true;
  }
  return false;
}
function chunkCanvas(m, cx, cy) {
  const ref = chunkRef[S.map];
  if (!ref || ref.tiles !== m.tiles || ref.ver !== (m.ver || 0)) {
    for (const k of [...chunkCache.keys()]) if (k.startsWith(S.map + ':')) chunkCache.delete(k);
    chunkRef[S.map] = { tiles: m.tiles, ver: m.ver || 0 };
  }
  const key = S.map + ':' + cx + ',' + cy;
  let cv = chunkCache.get(key);
  if (cv) { chunkCache.delete(key); chunkCache.set(key, cv); return cv; }
  cv = document.createElement('canvas'); cv.width = cv.height = CH * 16;
  const o = cv.getContext('2d');
  bakeGround(o, m, cx, cy);
  for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {      // Nahdetails
    const tx = cx * CH + i, ty = cy * CH + j; if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) continue;
    const t = m.tiles[ty * m.w + tx], X = i * 16, Y = j * 16;
    const reg = S.map === 'world' ? REGION[regionAt(tx, ty)] : REGION.greenmark;
    if (t === T.ROCK || t === T.WATER) continue;
    const r = h2(tx * 7 + 1, ty * 13 + 5), px = X + 2 + ((h2(tx, ty * 3) * 11) | 0), py = Y + 3 + ((h2(tx * 5, ty) * 10) | 0);
    if (regionDecor(o, reg.decor, t, r, px, py)) continue;
    if (t === T.GRASS) {
      if (r < 0.07) { const c = DECOR_FLOWERS[(r * 57 | 0) % 4]; o.fillStyle = '#2c3a22'; o.fillRect(px, py + 1, 1, 2); o.fillRect(px + 3, py + 2, 1, 2);
        o.fillStyle = c; o.fillRect(px, py, 1, 1); o.fillRect(px + 3, py + 1, 1, 1); o.fillRect(px + 1, py + 3, 1, 1); }
      else if (r < 0.2) { o.fillStyle = '#1f2a18'; o.fillRect(px, py, 1, 3); o.fillRect(px + 2, py - 1, 1, 4); o.fillStyle = '#5a6a3a'; o.fillRect(px + 1, py, 1, 3); o.fillRect(px + 2, py - 1, 1, 1); }
      else if (r < 0.24) { o.fillStyle = '#5a554c'; o.fillRect(px, py, 2, 1); o.fillStyle = '#2a2722'; o.fillRect(px, py + 1, 2, 1); }
    } else if ((t === T.DIRT || t === T.ROAD) && r < 0.12) { o.fillStyle = '#6a6252'; o.fillRect(px, py, 2, 1); o.fillStyle = '#2a241c'; o.fillRect(px, py + 1, 2, 1); }
    else if (t === T.ASH && r < 0.05) { o.fillStyle = '#cfc6b0'; o.fillRect(px, py, 3, 1); o.fillRect(px + 1, py - 1, 1, 3); }
  }
  paintWater(o, m, cx, cy);
  paintRock(o, m, cx, cy);
  paintRock(o, m, cx, cy, T.DWALL);
  paintWalls(o, m, cx, cy);
  for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {      // Mauerfuß: Schatten nur, wo unten keine Mauer anschließt
    const tx = cx * CH + i, ty = cy * CH + j; if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) continue;
    const t = m.tiles[ty * m.w + tx];
    if (t === T.ROCK || t === T.DWALL || !SOLID_T.has(t)) continue;
    const below = ty + 1 < m.h ? m.tiles[(ty + 1) * m.w + tx] : t;
    if (!SOLID_T.has(below)) { o.fillStyle = 'rgba(0,0,0,.38)'; o.fillRect(i * 16, j * 16 + 14, 16, 2); o.fillStyle = 'rgba(0,0,0,.2)'; o.fillRect(i * 16, j * 16 + 16, 16, 2); }
  }
  chunkCache.set(key, cv);
  if (chunkCache.size > CHUNK_MAX) chunkCache.delete(chunkCache.keys().next().value);
  return cv;
}
// ---------------- Fels als Masse statt Kachelblock (BUG-035) ----------------
// Die Felskacheln bleiben die Kollision; gemalt wird ein weiches Feld (bilineare Belegung der Kachelmitten + Rauschen),
// das Ecken rundet, Einzelkacheln zu Findlingen macht und Kanten ausfranst. Oben die Felskuppe mit Relief (Licht von
// links oben), Risse, nach Süden eine Felswand mit Schichtung, darunter Schlagschatten und Geröll. Farbe je Region.
const ROCK_PAL = {             // dunkel, Schatten, Grund, Licht, Kante (+ Schnee)
  greenmark: ['#1d1b19', '#34312c', '#4a463f', '#625d53', '#7c766a'],
  plains:    ['#1f1c18', '#38332b', '#50493d', '#6a6150', '#857a64'],
  forest:    ['#171a16', '#2b302a', '#3f453c', '#565d50', '#6e7564'],
  marsh:     ['#171a16', '#2b302a', '#3f453c', '#565d50', '#6e7564'],
  mountain:  ['#1b1d21', '#33373d', '#4b5057', '#666d76', '#848c95', '#dfe6ea', '#b9c3cb'],
  desert:    ['#261a12', '#463023', '#624533', '#7e5f44', '#977656'],
  badland:   ['#131110', '#24201d', '#36302c', '#4b433e', '#645a52'],
  blight:    ['#121614', '#232a27', '#343d39', '#48534d', '#5e6b64'],
  cave:      ['#0c0b0a', '#1a1815', '#27241f', '#36322b', '#48423a'],   // Minen-/Höhlenwände
};
const rgbOf = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const ROCK_RGB = Object.fromEntries(Object.entries(ROCK_PAL).map(([k, v]) => [k, v.map(rgbOf)]));
function groundUnder(m, tx, ty) {                    // häufigster begehbarer Nachbarboden, sonst Erde
  const cnt = {}; let best = T.DIRT, bn = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const x = tx + i, y = ty + j; if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
    const t = m.tiles[y * m.w + x]; if (SOLID_T.has(t) || t === T.WATER) continue;
    cnt[t] = (cnt[t] || 0) + 1; if (cnt[t] > bn) { bn = cnt[t]; best = t; }
  }
  return best;
}
// ---------------- Boden pro Pixel (statt Kachelrechtecke) ----------------
// Jeder Pixel nimmt Bodenart, Helligkeit und Regionstönung aus den vier umliegenden Kachelmitten: an Grenzen natürlicher
// Böden gewinnt die Art mit dem höchsten Gewicht + Rauschen (ausgefranste, runde Übergänge), Helligkeit und Tönung
// werden bilinear verlaufen und mit geordnetem Dithering in Pixelstufen gesetzt — kein Kachel-Schachbrett mehr.
// Menschengemachte Böden (Pflaster, Dielen, Acker, Mauern) behalten ihre harten Kanten.
const SOFT_T = new Set([T.GRASS, T.DIRT, T.ROAD, T.MARSH, T.SAND, T.ASH]);
const SOFT = new Uint8Array(32); for (const t of SOFT_T) SOFT[t] = 1;
const texData = new Map();
function texel(t, v, kind) {
  const key = t + '|' + v + '|' + kind; let d = texData.get(key);
  if (!d) { const c = SP.tileTexture(t, v, TILE_COL[t] || TILE_COL[T.GRASS], kind); d = c.getContext('2d').getImageData(0, 0, 16, 16).data; texData.set(key, d); }
  return d;
}
const TINT_RGBA = {};                                    // 'rgba(r,g,b,a)' → [r,g,b,a]
const tintOf = str => TINT_RGBA[str] || (TINT_RGBA[str] = str.match(/[\d.]+/g).map(Number));
const shadeCv = document.createElement('canvas'), shadeCtx = shadeCv.getContext('2d');
function bakeGround(o, m, cx, cy) {
  const x0t = cx * CH, y0t = cy * CH, TW = CH + 2, SZ = CH * 16, world = S.map === 'world';
  const typ = new Uint8Array(TW * TW), kin = [], vari = new Uint8Array(TW * TW);
  shadeCv.width = shadeCv.height = TW;                   // 1 Pixel je Kachel: Helligkeit (weich hochskaliert)
  const tintCv = document.createElement('canvas'); tintCv.width = tintCv.height = TW;
  const sd = shadeCtx.createImageData(TW, TW), tctx = tintCv.getContext('2d'), td = tctx.createImageData(TW, TW);
  for (let j = 0; j < TW; j++) for (let i = 0; i < TW; i++) {   // Kachelraster mit 1 Kachel Rand
    const tx = Math.max(0, Math.min(m.w - 1, x0t - 1 + i)), ty = Math.max(0, Math.min(m.h - 1, y0t - 1 + j)), k = j * TW + i, raw = m.tiles[ty * m.w + tx];
    let t = raw;
    if (t === T.ROCK || t === T.WATER || t === T.DWALL) t = groundUnder(m, tx, ty);   // Fels/Wasser/Höhlenwand werden danach als weiche Masse gemalt
    let kind = TILE_KIND[t] || 'grass';
    if (t === T.DFLOOR && DUNGEONS[S.map]?.floor === 'scree') kind = 'scree';   // Minenboden: Geröll, kein Pflaster (Tiefhall: gebaute Halle, Pflaster)
    if (t === T.STONE && world && !townAt(tx, ty, 2) && regionAt(tx, ty) === 'mountain') kind = 'scree';   // Hochgebirge: Geröll, kein Pflaster
    typ[k] = t; kin[k] = kind; vari[k] = (h2(tx, ty) * 4) | 0;
    if (t === T.GRASS || t === T.DIRT) {                  // Wiesen hell, Senken dunkel
      const n = vnoise(tx / 11, ty / 11) * 0.7 + vnoise(tx / 4, ty / 4) * 0.3;
      if (n > 0.58) { sd.data[k * 4] = 150; sd.data[k * 4 + 1] = 160; sd.data[k * 4 + 2] = 90; sd.data[k * 4 + 3] = (n - 0.58) * 0.35 * 255; }
      else { sd.data[k * 4] = 8; sd.data[k * 4 + 1] = 10; sd.data[k * 4 + 2] = 6; sd.data[k * 4 + 3] = Math.max(0, 0.42 - n) * 0.45 * 255; }
    }
    const reg = world ? REGION[regionAt(tx, ty)] : REGION.greenmark;
    if (reg.tint && !(SOLID_T.has(raw) && raw !== T.ROCK)) { const c = tintOf(reg.tint); td.data.set([c[0], c[1], c[2], c[3] * 255], k * 4); }
  }
  for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {     // Grundtexturen
    const k = (j + 1) * TW + i + 1;
    o.drawImage(SP.tileTexture(typ[k], vari[k], TILE_COL[typ[k]] || TILE_COL[T.GRASS], kin[k]), i * 16, j * 16);
  }
  // Grenzen natürlicher Böden pro Pixel: nur Kacheln, deren 3×3-Umfeld gemischt ist
  const noise = [], G0x = x0t * 16 - 2, G0y = y0t * 16 - 2, AWn = SZ + 4;
  const nz = t => noise[t] || (noise[t] = ((A, B) => (X, Y) => A(X, Y) * 0.75 + B(X, Y) * 0.25)(latNoise(G0x, G0y, AWn, 5, t * 37, 0), latNoise(G0x, G0y, AWn, 3, t * 11, 40)));
  const cand = (t, a, b, c, d, fx, fy, X, Y) => (a === t) * (1 - fx) * (1 - fy) + (b === t) * fx * (1 - fy) + (c === t) * (1 - fx) * fy + (d === t) * fx * fy + (nz(t)(X, Y) - 0.5) * 0.55;
  let wK = 0;                                             // Quelle (Kachelindex) des letzten winAt — spart Array-Rückgaben
  const winAt = (X, Y, own) => {                          // Bodenart eines Pixels (Weltkoordinaten in Texeln)
    const gx = (X - 8) / 16 - x0t + 1, gy = (Y - 8) / 16 - y0t + 1, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy, k = iy * TW + ix;
    const a = typ[k], b = typ[k + 1], c = typ[k + TW], d = typ[k + TW + 1];
    if ((a === b && a === c && a === d) || !SOFT[own]) { wK = k; return own; }
    let best = -9, w = own, wt;
    if (SOFT[a]) { wt = cand(a, a, b, c, d, fx, fy, X, Y); if (wt > best) { best = wt; w = a; } }
    if (b !== a && SOFT[b]) { wt = cand(b, a, b, c, d, fx, fy, X, Y); if (wt > best) { best = wt; w = b; } }
    if (c !== a && c !== b && SOFT[c]) { wt = cand(c, a, b, c, d, fx, fy, X, Y); if (wt > best) { best = wt; w = c; } }
    if (d !== a && d !== b && d !== c && SOFT[d]) { wt = cand(d, a, b, c, d, fx, fy, X, Y); if (wt > best) { best = wt; w = d; } }
    wK = w === a ? k : w === b ? k + 1 : w === c ? k + TW : k + TW + 1;
    return w;
  };
  let img = null;
  const tc = [];                                          // Texeldaten je Quellkachel
  const wb = new Uint8Array(17 * 16), sb = new Int16Array(16 * 16);   // Sieger je Pixel der Kachel (+1 Zeile darunter)
  for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
    const k = (j + 1) * TW + i + 1, own = typ[k];
    if (!SOFT[own]) continue;
    let mixed = false;
    for (let b = -1; b <= 1 && !mixed; b++) for (let a = -1; a <= 1; a++) if (typ[k + b * TW + a] !== own) { mixed = true; break; }
    if (!mixed) continue;
    const X0 = (x0t + i) * 16, Y0 = (y0t + j) * 16, below = typ[k + TW];
    let any = false;
    for (let y = 0; y < 17; y++) for (let x = 0; x < 16; x++) {
      const w = winAt(X0 + x, Y0 + y, y < 16 ? own : below); wb[y * 16 + x] = w;
      if (y < 16) { sb[y * 16 + x] = wK; if (w !== own || w === T.GRASS) any = true; }
    }
    if (!any) continue;
    img ||= new ImageData(SZ, SZ);
    const D = img.data;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const w = wb[y * 16 + x], lip = w === T.GRASS && wb[(y + 1) * 16 + x] !== T.GRASS && h2(X0 + x, Y0 + y) < 0.7;   // Grashalme an der Unterkante
      if (w === own && !lip) continue;
      const src = sb[y * 16 + x], T0 = tc[src] || (tc[src] = texel(typ[src], vari[src], kin[src])), ti = (y * 16 + x) * 4, o4 = ((j * 16 + y) * SZ + i * 16 + x) * 4;
      D[o4] = T0[ti] + (lip ? 22 : 0); D[o4 + 1] = T0[ti + 1] + (lip ? 26 : 0); D[o4 + 2] = T0[ti + 2] + (lip ? 10 : 0); D[o4 + 3] = 255;
    }
  }
  if (img) putLayer(o, img);
  // Helligkeit und Regionstönung: 1 Pixel je Kachelmitte, bilinear hochskaliert — weiche Verläufe statt Kachelrechtecke
  shadeCtx.putImageData(sd, 0, 0); tctx.putImageData(td, 0, 0);
  o.save(); o.imageSmoothingEnabled = true;
  o.drawImage(shadeCv, -16, -16, TW * 16, TW * 16); o.drawImage(tintCv, -16, -16, TW * 16, TW * 16);   // Pixelmitte i ↔ Kachelmitte
  o.restore();
}
// Wertrauschen mit vorab gehashten Gitterpunkten für ein Quadrat [gx0, gx0+AW) — gleiches Ergebnis wie
// vnoise(X/sc+ox, Y/scy+oy), aber ~50× weniger Hashes (Backen der Chunks bleibt billig).
function latNoise(gx0, gy0, AW, sc, ox, oy, scy = sc) {
  const lx0 = Math.floor(gx0 / sc + ox), ly0 = Math.floor(gy0 / scy + oy), nx = Math.ceil(AW / sc) + 3, ny = Math.ceil(AW / scy) + 3, L = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) L[j * nx + i] = h2(lx0 + i, ly0 + j);
  return (X, Y) => {
    const x = X / sc + ox, y = Y / scy + oy, xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi;
    const U = u * u * (3 - 2 * u), V = v * v * (3 - 2 * v), k = (yi - ly0) * nx + xi - lx0, a = L[k], b = L[k + 1], c = L[k + nx];
    return a + (b - a) * U + (c - a) * V + (a - b - c + L[k + nx + 1]) * U * V;
  };
}
// Weiches Feld für eine Kachelart (Fels, Wasser): bilineare Belegung der Kachelmitten + Rauschen ergibt runde,
// ausgefranste Umrisse statt Kachelkanten. Alles pro Chunk vorberechnet, damit das Backen billig bleibt.
// Liefert null, wenn im Chunk samt Rand keine Kachel dieser Art liegt.
function softField(m, cx, cy, kind, M, G = 2) {
  const x0t = cx * CH, y0t = cy * CH;
  const isK = (tx, ty) => tx >= 0 && ty >= 0 && tx < m.w && ty < m.h && m.tiles[ty * m.w + tx] === kind;
  let any = false;
  for (let j = -1; j <= CH && !any; j++) for (let i = -1; i <= CH; i++) if (isK(x0t + i, y0t + j)) { any = true; break; }
  if (!any) return null;
  const SZ = CH * 16, AW = SZ + 2 * M, gx0 = x0t * 16 - M, gy0 = y0t * 16 - M;
  const TW = CH + 2 * G, reg = [], occ = new Uint8Array(TW * TW);   // Kachelraster mit G Kacheln Rand
  for (let j = 0; j < TW; j++) for (let i = 0; i < TW; i++) {
    const tx = x0t - G + i, ty = y0t - G + j; occ[j * TW + i] = isK(tx, ty) ? 1 : 0;
    reg[j * TW + i] = S.map === 'world' && tx >= 0 && ty >= 0 && tx < m.w && ty < m.h ? regionAt(tx, ty) : 'greenmark';
  }
  const oc = (tx, ty) => occ[(ty - y0t + G) * TW + (tx - x0t + G)];
  const regAt = (X, Y) => reg[(((Y >> 4) - y0t + G) * TW) + (X >> 4) - x0t + G];
  const lat = (sc, ox, oy, scy = sc) => latNoise(gx0, gy0, AW, sc, ox, oy, scy);
  const nEdge = lat(6, 0, 0), nEdge2 = lat(2.5, 30, 0);
  const mask = new Uint8Array(AW * AW);
  for (let y = 0; y < AW; y++) {
    const Y = gy0 + y, gy = (Y - 8) / 16, iy = Math.floor(gy), fy = gy - iy;
    for (let x = 0; x < AW; x++) {
      const X = gx0 + x, gx = (X - 8) / 16, ix = Math.floor(gx), fx = gx - ix;
      const a = oc(ix, iy), b = oc(ix + 1, iy), c = oc(ix, iy + 1), d = oc(ix + 1, iy + 1), sum = a + b + c + d;
      if (!sum) continue;
      if (sum === 4) { mask[y * AW + x] = 1; continue; }
      const f = a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
      if (f < 0.22 || f > 0.78) { if (f > 0.78) mask[y * AW + x] = 1; continue; }   // Rauschen reicht nicht über ±0,25
      if (f + (nEdge(X, Y) - 0.5) * 0.4 + (nEdge2(X, Y) - 0.5) * 0.1 > 0.5) mask[y * AW + x] = 1;
    }
  }
  return { mask, M, SZ, AW, gx0, gy0, x0t, y0t, oc, regAt, lat };
}
const layerCv = document.createElement('canvas'); layerCv.width = layerCv.height = CH * 16;
const layerCtx = layerCv.getContext('2d');
const putLayer = (o, img) => { layerCtx.putImageData(img, 0, 0); o.drawImage(layerCv, 0, 0); };   // eigene Ebene statt Rücklesen des Chunks
function paintRock(o, m, cx, cy, kind = T.ROCK) {      // auch Höhlenwände (DWALL) der Minen: gleiche Masse, Höhlenpalette
  const F = softField(m, cx, cy, kind, 10); if (!F) return;
  const cave = kind === T.DWALL;
  const { mask, M, SZ, AW, gx0, gy0, lat } = F;
  const nRel = lat(9, 0, 0), nRel2 = lat(4, 50, 0), nCrack = lat(9, 100, 0);
  const nSnow = m === MAPS.world ? lat(16, 7, 0) : null, nSnow2 = nSnow && lat(5, 0, 9);
  const below = new Uint8Array(AW * AW), above = new Uint8Array(AW * AW);   // Abstand zum nächsten Nicht-Fels darunter / Fels darüber
  for (let x = 0; x < AW; x++) {
    let d = 0; for (let y = AW - 1; y >= 0; y--) { d = mask[y * AW + x] ? Math.min(d + 1, 250) : 0; below[y * AW + x] = d; }
    d = 250; for (let y = 0; y < AW; y++) { d = mask[y * AW + x] ? 0 : Math.min(d + 1, 250); above[y * AW + x] = d; }
  }
  const R = (x, y) => mask[y * AW + x] === 1;            // x/y bleiben im Rand (M ≥ Wandhöhe + 2)
  const img = new ImageData(SZ, SZ), D = img.data;
  const rel = new Float32Array(AW * AW).fill(NaN);        // Relief nur, wo es gebraucht wird (Fels + Diagonalnachbarn)
  const relAt = q => { if (rel[q] !== rel[q]) { const X = gx0 + q % AW, Y = gy0 + (q / AW | 0); rel[q] = nRel(X, Y) + nRel2(X, Y) * 0.3; } return rel[q]; };
  for (let y = M; y < M + SZ; y++) for (let x = M; x < M + SZ; x++) {
    const X = gx0 + x, Y = gy0 + y, o4 = ((y - M) * SZ + (x - M)) * 4, q = y * AW + x;
    const rg = cave ? 'cave' : F.regAt(X, Y), P = ROCK_RGB[rg] || ROCK_RGB.greenmark;
    if (!mask[q]) {                                      // Boden: Schlagschatten unter/rechts der Wand, Geröll am Fuß
      let sh = above[q] <= 4 ? above[q] : 0;
      if (!sh && (R(x - 1, y - 1) || R(x - 2, y - 2))) sh = R(x - 1, y - 1) ? 1 : 2;
      if (sh) D[o4 + 3] = [0, 128, 97, 66, 36][sh];   // Schatten: Schwarz mit Deckkraft
      else if (above[q] < 9 || R(x - 3, y) || R(x + 3, y)) {
        if (h2(X * 3, Y * 5) < 0.05) { const c = P[h2(X, Y * 7) < 0.5 ? 3 : 2]; D[o4] = c[0]; D[o4 + 1] = c[1]; D[o4 + 2] = c[2]; D[o4 + 3] = 255; }
      }
      continue;
    }
    const CL = rg === 'mountain' || cave ? 8 : 6, bl = below[q];  // Wandhöhe in Texturpixeln; bl = Pixel bis zur Unterkante
    let c;
    if (bl <= CL) {                                       // Südwand: senkrechte Schichtung, unten dunkler, oben Lichtkante
      const depth = CL - bl, streak = h2(X, Y >> 3);
      c = bl === 1 ? P[0] : depth === 0 && !R(x, y - 1) ? P[3] : depth === 0 ? P[2]
        : streak > 0.82 ? P[0] : streak < 0.18 || (X + (h2(Y >> 3, 3) * 4 | 0)) % 5 === 0 ? P[2] : P[1];
      if (bl === 2 && h2(X, Y) < 0.5) c = P[0];
      if (!R(x - 1, y) && c !== P[0]) c = P[2];           // Westkante der Wand fängt Licht
    } else {                                              // Kuppe: Relief (Licht von links oben), Kanten, Risse
      const r = relAt(q - AW - 1) - relAt(q + AW + 1);
      c = P[r > 0.2 ? 4 : r > 0.07 ? 3 : r < -0.1 ? 1 : 2];
      if (!R(x, y - 1) || !R(x - 1, y)) c = P[4];         // Oberkante/Westkante: Licht
      else if (!R(x + 1, y)) c = P[1];                    // Ostkante: Schatten
      else if (R(x, y - 2) && Math.abs(nCrack(X, Y) - 0.5) < 0.016) c = P[0];   // Risslinie
      if (P[5] && nSnow) { const sn = nSnow(X, Y) + (nSnow2(X, Y) - 0.5) * 0.12;   // zusammenhängende Schneefelder
        if (sn > 0.6) c = sn < 0.625 || r < -0.1 ? P[6] : P[5]; }
    }
    D[o4] = c[0]; D[o4 + 1] = c[1]; D[o4 + 2] = c[2]; D[o4 + 3] = 255;
  }
  putLayer(o, img);
}
// ---------------- Mauern mit Höhe: Wehrgang oben, Quaderfront nach Süden, Zinnen an offenen Seiten ----------------
// Mauerkacheln sahen von oben wie Pflaster aus. Freistehende Mauern (Stadtmauer, Feste) bekommen Zinnen; Hauswände
// nur die Front (innen sichtbar, wenn das Dach ausblendet).
function paintWalls(o, m, cx, cy) {
  const x0t = cx * CH, y0t = cy * CH, isW = (tx, ty) => tx >= 0 && ty >= 0 && tx < m.w && ty < m.h && m.tiles[ty * m.w + tx] === T.WALL;
  let houses = null;
  const inHouse = (tx, ty) => (houses ||= HOUSES.filter(b => b.map === S.map && b.x < x0t + CH + 1 && b.x + b.w > x0t - 1 && b.y < y0t + CH + 1 && b.y + b.h > y0t - 1))
    .some(b => tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h);
  const P = (c, x, y, w = 1, h = 1) => { o.fillStyle = c; o.fillRect(x, y, w, h); };
  for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
    const tx = x0t + i, ty = y0t + j; if (!isW(tx, ty)) continue;
    const X = i * 16, Y = j * 16, N = isW(tx, ty - 1), Sd = isW(tx, ty + 1), Wd = isW(tx - 1, ty), E = isW(tx + 1, ty), house = inHouse(tx, ty);
    if (!N) P('#6a6258', X, Y, 16, 1);                    // Kantenlicht oben/links, Schatten rechts
    if (!Wd) P('#5e574d', X, Y, 1, 16);
    if (!E) P('#1e1b17', X + 15, Y, 1, 16);
    if (!Sd) {                                            // Front: 8 Texel Quader, Lichtlippe oben, dunkler Fuß
      for (let r = 0; r < 8; r++) for (let x = 0; x < 16; x++) {
        const joint = r === 3 || r === 7 || (x + (r < 4 ? 0 : 3) + (tx * 5 % 6)) % 6 === 0;
        P(r === 0 ? '#5a5248' : joint ? '#221e1a' : h2(tx * 16 + x, ty * 16 + r) < 0.12 ? '#433c34' : r > 5 ? '#2c2823' : '#37312a', X + x, Y + 8 + r);
      }
      if (!Wd) P('#4a443b', X, Y + 8, 1, 7);
      if (!E) P('#161310', X + 15, Y + 8, 1, 8);
    }
    if (house) continue;
    const merlon = (x, y, w, h) => { P('#6e665b', x, y, w, h); P('#827a6d', x, y, w, 1); P('#1a1714', x + w, y + 1, 1, h); P('#1a1714', x, y + h, w + 1, 1); };
    if (!N) for (let k = 1; k < 16; k += 5) merlon(X + k, Y + 1, 3, 2);       // Zinnen entlang offener Seiten
    if (!Sd) for (let k = 1; k < 16; k += 5) merlon(X + k, Y + 5, 3, 2);
    if (!Wd) for (let k = 2; k < (Sd ? 16 : 7); k += 5) merlon(X + 1, Y + k, 2, 3);
    if (!E) for (let k = 2; k < (Sd ? 16 : 7); k += 5) merlon(X + 12, Y + k, 2, 3);
  }
}
// ---------------- Wasser: weiche Ufer, Tiefe, Schaum, Schilf (statt Kachelquadrate) ----------------
const WATER_PAL = {            // tief, mittel, flach, Licht, Schaum
  greenmark: ['#132a44', '#1a3852', '#264e66', '#44748a', '#a4c0c8'],   // Referenz 4: tiefer, blauer, heller Schaum
  plains:    ['#132a44', '#1a3852', '#264e66', '#44748a', '#a4c0c8'],
  forest:    ['#122838', '#183444', '#224858', '#3a6670', '#90aca8'],
  marsh:     ['#19231f', '#212e28', '#2c3b30', '#3e4e3c', '#76866a'],
  mountain:  ['#182839', '#1f3549', '#2b475c', '#44657a', '#b4c8d0'],
  desert:    ['#1b272c', '#233439', '#2f4446', '#485c5a', '#a09e88'],
  badland:   ['#191e20', '#212a2c', '#2b3736', '#3e4c48', '#8a8a7a'],
  blight:    ['#121a1a', '#192523', '#22312d', '#30433b', '#6a8a7a'],
  deadland:  ['#1a0808', '#240b0c', '#2e1012', '#4a1a1c', '#8a4a44'],   // S12 Totenland: dunkle Blutseen
  sea:       ['#0f2036', '#152c46', '#1f3e5a', '#385e7a', '#a2bac6'],   // Südsee: kalt, grau-blau, heller Schaum
};
const WATER_RGB = Object.fromEntries(Object.entries(WATER_PAL).map(([k, v]) => [k, v.map(rgbOf)]));
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);   // geordnetes Dithering zwischen Tiefenstufen
function paintWater(o, m, cx, cy) {
  const F = softField(m, cx, cy, T.WATER, 4, 4); if (!F) return;
  const { mask, M, SZ, AW, gx0, gy0, oc, regAt, lat } = F;
  const TD = CH + 2, dep = new Float32Array(TD * TD);   // Tiefe je Kachel: Anteil Wasser im 5×5-Umfeld
  for (let j = 0; j < TD; j++) for (let i = 0; i < TD; i++) {
    let c = 0; for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) c += oc(F.x0t - 1 + i + a, F.y0t - 1 + j + b);
    dep[j * TD + i] = c / 25;
  }
  const depAt = (X, Y) => {
    const gx = (X - 8) / 16 - F.x0t + 1, gy = (Y - 8) / 16 - F.y0t + 1, ix = Math.max(0, Math.min(TD - 2, Math.floor(gx))), iy = Math.max(0, Math.min(TD - 2, Math.floor(gy)));
    const fx = Math.min(1, Math.max(0, gx - ix)), fy = Math.min(1, Math.max(0, gy - iy)), k = iy * TD + ix;
    return dep[k] * (1 - fx) * (1 - fy) + dep[k + 1] * fx * (1 - fy) + dep[k + TD] * (1 - fx) * fy + dep[k + TD + 1] * fx * fy;
  };
  const nRip = lat(7, 20, 0, 1.6);                       // langgezogene Glanzstreifen
  const W = (x, y) => mask[y * AW + x] === 1;
  const img = new ImageData(SZ, SZ), D = img.data;
  const set = (o4, c, a = 255) => { D[o4] = c[0]; D[o4 + 1] = c[1]; D[o4 + 2] = c[2]; D[o4 + 3] = a; };
  for (let y = M; y < M + SZ; y++) for (let x = M; x < M + SZ; x++) {
    const X = gx0 + x, Y = gy0 + y, o4 = ((y - M) * SZ + (x - M)) * 4, q = y * AW + x;
    const rg = m === MAPS.world && (Y >> 4) >= seaLine(X >> 4) - 2 ? 'sea' : regAt(X, Y), P = WATER_RGB[rg] || WATER_RGB.greenmark;
    const r1 = !W(x - 1, y) || !W(x + 1, y) || !W(x, y - 1) || !W(x, y + 1);
    if (!mask[q]) {                                      // Ufer: nasser, dunkler Saum auf dem Boden
      if (W(x - 1, y) || W(x + 1, y) || W(x, y - 1) || W(x, y + 1)) set(o4, [8, 10, 8], 90);
      else if (W(x - 2, y) || W(x + 2, y) || W(x, y - 2) || W(x, y + 2)) set(o4, [8, 10, 8], 45);
      continue;
    }
    if (r1) { set(o4, h2(X * 5, Y * 3) < 0.65 ? P[4] : P[3]); continue; }   // Schaumkante
    const r2 = !W(x - 2, y) || !W(x + 2, y) || !W(x, y - 2) || !W(x, y + 2) || !W(x - 3, y) || !W(x, y - 3) || !W(x + 3, y) || !W(x, y + 3);
    const t = r2 ? 2 : (1 - depAt(X, Y)) * 2.4, k = Math.min(2, Math.floor(t) + (t % 1 > BAYER[(Y & 3) * 4 + (X & 3)] ? 1 : 0));
    let c = P[k];
    if (k === 0 && nRip(X, Y) > 0.86) c = P[3];           // seltener Lichtreflex im tiefen Wasser
    set(o4, c);
    if (r2 && rg !== 'mountain' && rg !== 'desert' && h2(X * 7, Y * 3) < 0.035) {   // Schilf im Flachwasser
      const hgt = 3 + (h2(X, Y) * 3 | 0);
      for (let k2 = 0; k2 < hgt && y - M - k2 >= 0; k2++) { const oo = ((y - M - k2) * SZ + (x - M)) * 4; set(oo, k2 === hgt - 1 ? [106, 90, 48] : k2 & 1 ? [58, 74, 42] : [44, 60, 34]); }
    }
  }
  if (m === MAPS.world) for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {   // Seerosen im Sumpf
    const tx = F.x0t + i, ty = F.y0t + j; if (!oc(tx, ty) || regionAt(tx, ty) !== 'marsh' || h2(tx * 7 + 1, ty * 13 + 5) > 0.14) continue;
    const px = i * 16 + 4 + (h2(tx, ty * 3) * 8 | 0), py = j * 16 + 5 + (h2(tx * 5, ty) * 7 | 0);
    if (!W(px + M, py + M) || !W(px + 3 + M, py + 2 + M)) continue;
    for (const [dx, dy, c] of [[0, 0, [58, 90, 52]], [1, 0, [74, 106, 62]], [2, 0, [58, 90, 52]], [0, 1, [44, 70, 40]], [1, 1, [58, 90, 52]], [2, 1, [44, 70, 40]], [3, 1, [44, 70, 40]], [1, -1, [196, 186, 160]]])
      set(((py + dy) * SZ + px + dx) * 4, c);
  }
  putLayer(o, img);
}
const DECOR_FLOWERS = ['#b8a44a', '#a05a5a', '#c9c0a0', '#6a7ab0'];
// Regionale Nahdetails in Texturpixeln. true = Kachel ist erledigt (keine Wiesendetails mehr).
function regionDecor(o, kind, t, r, px, py) {
  const P = (c, x, y, w = 1, h = 1) => { o.fillStyle = c; o.fillRect(x, y, w, h); };
  switch (kind) {
    case 'forest':                                        // Pilze, Farne, Laub — kaum Blumen
      if (t !== T.GRASS && t !== T.DIRT) return false;
      if (r < 0.05) { P('#d6cdb4', px, py + 1, 1, 2); P('#a0402e', px - 1, py, 3, 1); P('#efe6d0', px, py, 1, 1); }
      else if (r < 0.16) { P('#2f4a2a', px, py, 1, 3); P('#2f4a2a', px - 1, py - 1); P('#2f4a2a', px + 1, py - 1); P('#446a3a', px - 2, py - 2); P('#446a3a', px + 2, py - 2); }
      else if (r < 0.26) { P(r < 0.21 ? '#7a5a2a' : '#8c4a22', px, py); P('#5a4020', px + 2, py + 1); }
      return true;
    case 'marsh':                                         // Schilf, Moospolster, Seerosen auf Wasser
      if (t === T.WATER && r < 0.12) { P('#3a5a34', px, py, 3, 2); P('#4a6a3e', px, py, 1, 1); return true; }
      if (r < 0.2) { P('#3a4a2a', px, py - 2, 1, 5); P('#4c5c34', px + 2, py - 1, 1, 4); P('#6a5a30', px, py - 3); return true; }
      return false;
    case 'snow':                                          // Schneeflecken, Eisglitzern
      if (SOLID_T.has(t) && r < 0.3) { P('#dfe6ea', px, py - 3, 4, 1); return true; }
      if (r < 0.3) { P('#dfe6ea', px, py, 3, 2); P('#c8d2d8', px + 1, py + 2, 2, 1); if (r < 0.06) P('#ffffff', px + 1, py); }
      return true;
    case 'desert':                                        // Risse, trockene Halme, gebleichte Knochen
      if (r < 0.1) { P('#5a3a24', px, py); P('#5a3a24', px + 1, py + 1); P('#5a3a24', px + 2, py + 1); P('#5a3a24', px + 3, py + 2); }
      else if (r < 0.17) { P('#a08a4a', px, py, 1, 2); P('#b89a52', px + 1, py - 1, 1, 3); }
      else if (r < 0.19) { P('#e0d6bc', px, py, 3, 1); }
      return true;
    case 'ember':                                         // verkohlte Flecken, Glut
      if (r < 0.12) { P('#1c1714', px, py, 4, 2); if (r < 0.04) P('#d06a2a', px + 1, py); }
      return r < 0.12;
    case 'blight':                                        // Knochen, Risse, türkis leuchtende Pilze
      if (SOLID_T.has(t) || t === T.WATER) return false;
      if (r < 0.05) { P('#cfc6b0', px, py, 3, 1); P('#cfc6b0', px + 1, py - 1, 1, 3); }
      else if (r < 0.1) { P('#141a18', px, py); P('#141a18', px + 1, py + 1); P('#141a18', px + 2, py + 1); P('#141a18', px + 3, py + 2); }
      else if (r < 0.13) { P('#2a3a34', px, py + 1, 1, 2); P('#5fb39a', px - 1, py, 3, 1); }
      return true;
  }
  return false;
}
function vnoise(x, y) {                                   // weiches Wertrauschen (bilinear, geglättet) für Geländefärbung
  const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, s = t => t * t * (3 - 2 * t);
  const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1), U = s(u), V = s(v);
  return a + (b - a) * U + (c - a) * V + (a - b - c + d) * U * V;
}
function drawWater(tx, ty, now) {                         // Wellenlinie in 2-px-Stufen
  const s = Math.sin(now / 700 + tx * 0.6 + ty * 0.4) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(150,190,210,${0.06 + s * 0.08})`;
  ctx.fillRect(tx * TS + 4, ty * TS + 6 + ((s * 5) | 0) * 2, TS - 12, 2);
}

// ---------------- Entities ----------------
function shadow(x, y, r, a = 0.35) {
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.beginPath(); ctx.ellipse(x, y + 2, r, r * 0.45, 0, 0, 7); ctx.fill();
}

// Trefferblitz: kurzes helles Aufleuchten der Figur nach einem Treffer. Nutzt e.lastHurt (gleicher Zeitgeber wie now).
const FLASH_MS = 130;
function flashAlpha(e, now) {
  if (!e || !e.lastHurt) return 0;
  const dt = now - e.lastHurt;
  return dt >= 0 && dt < FLASH_MS ? (1 - dt / FLASH_MS) * 0.6 : 0;
}

// Eisenmark (Session 11): Kette vom Treiber zum Gefangenen — Glieder mit Durchhang; Goblin-NPCs klein wie Goblin-Gegner.
// Der Treiber wird hier zwischengespeichert, nicht am Objekt (ein Verweis im Objekt ginge in den Spielstand).
const chainLead = new Map();
function drawChain(e) {
  let L = chainLead.get(e.id);
  if (!L || !L.alive) { const k = e.chainIdx || 1;                    // Glied an Glied: Treiber → 1 → 2 → 3
    L = k > 1 ? S.ents[e.map].find(x => x.chainedTo === e.chainedTo && x.chainIdx === k - 1) : S.ents[e.map].find(x => x.id === e.chainedTo);
    if (!L) return; chainLead.set(e.id, L); }
  const x0 = L.x + 6, y0 = L.y - 14, x1 = e.x, y1 = e.y - 16, n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 4));
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 5;
    ctx.fillStyle = '#1a1816'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4); ctx.fillStyle = i % 2 ? '#8a857e' : '#b8b2a8'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); }   // Glied mit Kontur, auch auf dunklem Boden lesbar
}
function drawGoblinNpc(e, now) {
  ctx.save(); ctx.translate(e.x, e.y); ctx.scale(0.82, 0.82); ctx.translate(-e.x, -e.y); drawHumanoid(e, now); ctx.restore();
  if (e.captive) { ctx.fillStyle = '#6e6a64'; ctx.fillRect(Math.round(e.x) - 3, Math.round(e.y) - 19, 6, 2); }   // Eisenkragen
}
// S13 (Nutzer: Reittiere, Kampf vom Pferd): das Reittier unter dem Helden, der Reiter 14 px höher
const MOUNT_PAL = { horse: { body: '#6a4a30', dark: '#2a1e14', eye: '#1a120c' }, mech_horse: { body: '#a8843a', dark: '#4a3a1e', eye: '#e8a040' }, dead_horse: { body: '#b8b2a0', dark: '#2a2a26', eye: '#5fb39a' } };
// S15 (Nutzer): Das Pferd schaut in die Laufrichtung (auch nach oben und unten); im Stand behält es die letzte Richtung.
// Nur Stil R hat Vorder- und Rückansicht, die anderen Stile bleiben seitlich.
function horseDir(e) {
  const vx = e.vx || 0, vy = e.vy || 0, side = vx < 0 || (!vx && Math.cos(e.aim ?? 0) < 0) ? 'W' : 'E';
  if (Math.abs(vx) + Math.abs(vy) > 0.05) e.hDir = SP.drawnOn() && Math.abs(vy) > Math.abs(vx) * 1.2 ? (vy < 0 ? 'N' : 'S') : side;
  return e.hDir || side;
}
function drawHorse(e, now, kind, rider) {
  const moving = e.vx || e.vy, fr = moving ? ((now / 70) | 0) & 3 : 1, pal = MOUNT_PAL[kind] || MOUNT_PAL.horse, dir = horseDir(e);
  const blit = f => { ctx.save(); ctx.translate(e.x, e.y); ctx.scale(1.35, 1.35); ctx.translate(-e.x, -e.y); SP.blit(ctx, f, e.x, e.y + 5); ctx.restore(); };
  const ns = dir === 'N' || dir === 'S', ride = () => { ctx.save(); ctx.translate(0, ns ? -17 : -14); drawHumanoid(e, now); ctx.restore(); };
  shadow(e.x, e.y + 3, 19, .35);
  if (rider && ns) ride();                                              // von vorn/hinten sitzt der Reiter im Rumpf: das Pferd verdeckt die Unterschenkel
  blit(SP.beastFrame('horse', pal, dir, '', fr));
  if (kind === 'dead_horse') { ctx.fillStyle = 'rgba(95,179,154,.15)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, 26, 10, 0, 0, 7); ctx.fill(); }
  if (rider && !ns) ride();
  if (dir === 'S') blit(SP.beastFrame('horse', pal, 'S', 'head', fr));   // von vorn: der Kopf verdeckt den Reiter
}
function drawDummy(e) {                                               // Pfahl, Querholz, Strohsack mit Zielscheibe
  const x = Math.round(e.x), y = Math.round(e.y);
  shadow(x, y + 3, 9, .35);
  ctx.fillStyle = '#4a3624'; ctx.fillRect(x - 1, y - 30, 3, 32); ctx.fillRect(x - 11, y - 24, 23, 3);
  ctx.fillStyle = '#b89a58'; ctx.fillRect(x - 7, y - 34, 15, 20); ctx.fillStyle = '#8a7040'; ctx.fillRect(x - 7, y - 16, 15, 2); ctx.fillRect(x - 7, y - 34, 2, 20);
  ctx.fillStyle = '#d8c080'; ctx.fillRect(x - 3, y - 41, 7, 7);
  ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x - 4, y - 29, 9, 9); ctx.fillStyle = '#a83a2a'; ctx.fillRect(x - 3, y - 28, 7, 7); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x - 2, y - 27, 5, 5); ctx.fillStyle = '#a83a2a'; ctx.fillRect(x - 1, y - 26, 3, 3);
}
function drawSpellWall(e, now) {
  const left = e.until - now, fade = Math.min(1, left / 600, (now - e.born) / 200), x = Math.round(e.x), y = Math.round(e.y);
  ctx.save(); ctx.globalAlpha = Math.max(0, fade);
  if (e.el === 'frost' && e.solid) {                                   // Eisblock: kantig, hell, mit Lichtkante
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x - 11, y + 2, 22, 4);
    ctx.fillStyle = '#5f8fb0'; ctx.fillRect(x - 10, y - 22, 20, 24); ctx.fillStyle = '#9fd0ec'; ctx.fillRect(x - 8, y - 24, 16, 22);
    ctx.fillStyle = '#d8f0ff'; ctx.fillRect(x - 6, y - 22, 3, 16); ctx.fillRect(x - 8, y - 24, 16, 2); ctx.fillStyle = '#3f6a88'; ctx.fillRect(x + 6, y - 20, 2, 20);
  } else if (e.el === 'frost') {                                      // Eisboden
    ctx.fillStyle = 'rgba(170,215,240,.35)'; ctx.beginPath(); ctx.ellipse(x, y, 16, 7, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(230,248,255,.5)'; ctx.fillRect(x - 6, y - 1, 5, 1); ctx.fillRect(x + 3, y + 2, 4, 1);
  } else {                                                             // Flammen: drei Zungen, flackernd; Brandfläche niedriger
    const h = e.patch ? 8 : 20; ctx.fillStyle = e.patch ? 'rgba(60,30,20,.35)' : 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y, 12, 5, 0, 0, 7); ctx.fill();
    for (let k = 0; k < 3; k++) { const f = Math.sin(now / 90 + k * 2.1 + e.x) * 0.5 + 0.5, hh = h * (0.6 + f * 0.4), fx0 = x - 8 + k * 6;
      ctx.fillStyle = '#c0401a'; ctx.fillRect(fx0, y - hh, 5, hh); ctx.fillStyle = '#f08a2a'; ctx.fillRect(fx0 + 1, y - hh * 0.8, 3, hh * 0.8); ctx.fillStyle = '#ffd870'; ctx.fillRect(fx0 + 2, y - hh * 0.45, 1, hh * 0.45); }
  }
  ctx.restore();
}
function drawRider(e, now) { drawHorse(e, now, e.mounted.kind, true); }
// S15 Druide, Grad III: der Spieler als großer Hainwolf. Fell der Wölfe, dunkler und mit dem Grün des Hains an den Augen.
const WOLF_FORM_PAL = { body: '#4a4638', dark: '#2a2a20', eye: '#b7d86a' };
function drawWolfForm(e, now) {
  const moving = e.vx || e.vy, sw = e.swing || 0, K = SP.FIGK * 1.35, pose = sw > 0 ? (sw < 0.35 ? 'a1' : 'a2') : '';
  const fr = moving ? ((now / 70) | 0) & 3 : 1, f = SP.beastFrame('wolf', { ...(MONSTERS.wolf.pal || {}), ...WOLF_FORM_PAL }, Math.cos(e.aim ?? 0) < 0 ? 'W' : 'E', pose, fr);
  ctx.save(); ctx.translate(e.x, e.y); ctx.scale(K, K); ctx.translate(-e.x, -e.y);
  shadow(e.x, e.y + 3, (e.r + 4) / K, .35); SP.blit(ctx, f, e.x, e.y + 5); ctx.restore();
  if (((now / 180) | 0) % 3 === 0) { ctx.fillStyle = 'rgba(183,216,106,0.5)'; ctx.fillRect(Math.round(e.x + Math.sin(now / 300) * 10), Math.round(e.y - 16 - (now / 30) % 12), 2, 2); }
}
function drawEntity(e, now) {
  switch (e.kind) {
    case 'prop': return drawPropPixel(e, now);
    case 'building': return drawBuilding(e, now);
    case 'item': return drawGroundItem(e, now);
    case 'corpse': return drawCorpse(e, now);
    case 'grave': return drawGrave(e);
    case 'enemy': return e.mtype === 'acad_dummy' ? drawDummy(e) : drawCreature(e, now);   // S15 P5: Übungspuppe der Akademie
    case 'npc': if (e.chainedTo) drawChain(e); if (e.goblin && e.spec) return drawGoblinNpc(e, now); return drawHumanoid(e, now);
    case 'player': if (e.cineGhost) return null; if (e.mounted) return drawRider(e, now); if (e.status?.some(s => s.key === 'wolf_form')) return drawWolfForm(e, now); return drawHumanoid(e, now);   // S15 Druide   // Kamerafahrt: unsichtbar
    case 'decal': return drawDecal(e);
    case 'caravan': return drawCaravan(e, now);
    case 'mount': return drawHorse(e, now, e.mkind, false);            // S15: gerufenes oder wartendes Pferd
    case 'spellwall': return drawSpellWall(e, now);                    // S15 P4: Feuerwand, Eiswand, Brandfläche, Eisboden
    case 'house': return drawHouse(e.b, now);
  }
}

// ---------------- Gebäude ----------------
// Sprite je Gebäude (Tag/Nacht) gecacht. Steht der Spieler im Haus (Innenfläche oder Türkachel), blendet das Dach
// weich aus: man sieht den Innenraum. Schornsteine rauchen, nachts leuchten die Fenster.
const houseEnts = new Map(), houseCache = new Map(), roofAlpha = new Map();
function houseEnt(b) { let e = houseEnts.get(b); if (!e) { e = { kind: 'house', b, x: (b.x + b.w / 2) * TS, y: (b.y + b.h) * TS - 2 }; houseEnts.set(b, e); } return e; }
export function playerInside(b, p = S.player) {
  if (!p || p.map !== b.map) return false;
  const tx = p.x / TS | 0, ty = p.y / TS | 0;
  return (tx > b.x && tx < b.x + b.w - 1 && ty > b.y && ty < b.y + b.h - 1) || (tx === b.doorTile[0] && ty === b.doorTile[1]);
}
const isNight = () => { const h = S.minute / 60; return h >= 19 || h < 6; };
const HOUSE_ATLAS = false;   // Nutzer S13: Blatt-Gebäude wirken aufgeblasen zu verpixelt; an, sobald große Gebäudebilder kommen
function drawHouse(b, now) {
  if (HOUSE_ATLAS && SP.atlasOn()) { const src = SP.atlasSprite(SP.houseAtlas(b)); if (src) {   // Gebäude aus dem Blatt — aus: im Blatt zu klein, aufgeblasen zu grob (Nutzer S13)
    const target = playerInside(b) ? 0.14 : 1, a = (roofAlpha.get(b) ?? target) + (target - (roofAlpha.get(b) ?? target)) * 0.15; roofAlpha.set(b, a);
    const dw = b.w * TS + 12, dh = dw * src.height / src.width, x0 = b.x * TS - 6, y0 = (b.y + b.h) * TS + 6 - dh;
    ctx.globalAlpha = a * (HB.wearOf(b) === 2 ? 0.75 : 1); ctx.imageSmoothingEnabled = false; ctx.drawImage(src, x0, y0, dw, dh); ctx.globalAlpha = 1; return; } }
  const lit = isNight() && (b.type !== 'kontor' || S.minute / 60 < 22), key = b.id + (lit ? 'n' : 'd') + HB.wearOf(b);   // Verfall (auch Kriegsschäden) im Schlüssel
  let cv = houseCache.get(key);
  if (!cv) { if (houseCache.size > 120) houseCache.clear(); cv = HB.houseSprite(b, lit); houseCache.set(key, cv); }
  const { OV, RISE } = HB.houseDims(b), target = playerInside(b) ? 0.14 : 1;
  const a = (roofAlpha.get(b) ?? target) + (target - (roofAlpha.get(b) ?? target)) * 0.15;
  roofAlpha.set(b, a);
  const x0 = b.x * TS - OV * PX, y0 = b.y * TS - RISE * PX;
  ctx.globalAlpha = a;
  ctx.drawImage(cv, x0, y0, cv.width * PX, cv.height * PX);
  ctx.globalAlpha = 1;
  const ch = a > 0.5 && HB.chimneyOf(b);
  if (ch) {                                                         // Rauch: Pixelwölkchen steigen auf und verwehen
    const cx = x0 + ch.x * PX, cy = y0 + ch.y * PX;
    for (let i = 0; i < 4; i++) {
      const k = ((now / 2600 + i / 4 + b.seed * 0.13) % 1), sx = cx + Math.sin(k * 5 + i) * 4 + k * 12, sy = cy - k * 46, s = (1 + k * 3) | 0;
      ctx.fillStyle = `rgba(${ch.soot ? '62,56,50' : '120,116,108'},${(1 - k) * 0.45})`;
      ctx.fillRect(Math.round(sx / 2) * 2 - s, Math.round(sy / 2) * 2 - s, s * 2, s * 2);
    }
  }
}

// Karawane (BUG-011): Leitwagen mit Plane, Kutscher und Ochsengespann; Beiwagen (offene Ladefläche, ein Maultier) folgt der Spur.
function drawCaravan(e, now) {
  const moving = !!(e.vx || e.vy), f = e.facing === 2 ? -1 : 1;
  const q = trailPt(e, WAGON_GAP), fb = Math.abs(Math.cos(q.a)) > 0.3 ? (Math.cos(q.a) < 0 ? -1 : 1) : f;
  if (q.y <= e.y) drawWagon(q.x, q.y, fb, now, moving, false, e);   // weiter hinten im Bild zuerst
  drawWagon(e.x, e.y, f, now, moving, true, e);
  if (q.y > e.y) drawWagon(q.x, q.y, fb, now, moving, false, e);
  if (e.hp < e.maxHp) { ctx.fillStyle = '#100d0a'; ctx.fillRect(e.x - 18, e.y - 70, 36, 4); ctx.fillStyle = '#8c2a22'; ctx.fillRect(e.x - 18, e.y - 70, 36 * Math.max(0, e.hp / e.maxHp), 4); }
}
function drawDraft(x, y, f, now, moving, big, ph) {       // Ochse (big) oder Maultier, Seitenansicht
  if (SP.drawnOn()) {                                        // S14 Stil R: gezeichnete Zugtiere (Ochse, Maultier) mit Laufbild
    const fr = moving ? ((now / 150 + ph * 2) | 0) & 3 : 0, B = SP.beastFrame(big ? 'ox' : 'mule', big ? { body: '#6a5236', dark: '#3a2c1e' } : { body: '#6b6056', dark: '#3e3630' }, f > 0 ? 'E' : 'W', '', fr);
    const k = SP.FIGK / WAGON_K * (big ? 1.3 : 1.1); ctx.save(); ctx.translate(x, y); ctx.scale(k, k); SP.blit(ctx, B, 0, 0); ctx.restore();
    ctx.fillStyle = '#2b2116'; ctx.fillRect(x + f * (big ? 9 : 7) - 1, y - (big ? 20 : 17), 2.5, 9); return;   // Joch/Kummet
  }
  const sw = moving ? Math.sin(now / 150 + ph) * 3 : 0, L = big ? 7 : 6, bw = big ? 11 : 8, bh = big ? 6.5 : 5;
  ctx.fillStyle = big ? '#3b2d1f' : '#4a4038';
  for (const [dx, s] of [[-bw + 3, sw], [-bw + 6, -sw], [bw - 5, -sw], [bw - 2, sw]]) ctx.fillRect(x + f * dx + s - 1, y - L, 2.4, L);   // Beine
  ctx.fillStyle = big ? '#5a4630' : '#6b5f52'; ctx.beginPath(); ctx.ellipse(x, y - L - bh + 2, bw, bh, 0, 0, 7); ctx.fill();          // Rumpf
  ctx.fillStyle = big ? '#6b543a' : '#7c7064'; ctx.beginPath(); ctx.ellipse(x - f * 2, y - L - bh, bw * 0.7, bh * 0.45, 0, 0, 7); ctx.fill();   // Rückenlicht
  const hx = x + f * (bw + 3), hy = y - L - bh - (moving ? Math.abs(sw) * 0.3 : 0);
  ctx.fillStyle = big ? '#4b3a26' : '#5c5147'; ctx.fillRect(hx - (f > 0 ? 1 : 5), hy - 2, 6, 5);                                        // Kopf
  if (big) { ctx.fillStyle = '#d8ccb0'; ctx.fillRect(hx + f * 1 - 1, hy - 5, 1.5, 3); ctx.fillRect(hx + f * 4 - 1, hy - 5, 1.5, 3); }       // Hörner
  else { ctx.fillStyle = '#5c5147'; ctx.fillRect(hx + f * 1 - 1, hy - 6, 1.5, 4); ctx.fillRect(hx + f * 3 - 1, hy - 6, 1.5, 4); }       // lange Ohren
  ctx.fillStyle = '#2b2116'; ctx.fillRect(x + f * (bw - 1) - 1, y - L - bh * 2 + 1, 2.5, bh * 1.6);                                     // Joch/Kummet
}
const WAGON_K = 1.5;                                        // Maßstab des Zugs: Wagen und Tiere im Verhältnis zu den Figuren
// MP2 §24: Der Zug wurde als glatte Vektorform gemalt und fiel neben der Pixelwelt heraus. Jetzt wird er wie die Props in ein
// feines Raster gemalt und pixelisiert (Kontur, Stufen), je Richtung, Ladung und einer von 6 Laufphasen gecacht.
const wagonCache = new Map();
function drawWagon(x, y, f, now, moving, lead, e) {
  const ph = moving ? Math.floor(((now / 150) % 6.2832) / 6.2832 * 6) : 0, load = lead ? 0 : Math.min(2, Math.floor(Object.values(e.cargo || {}).reduce((a, b) => a + b, 0) / 8.5) + (Object.values(e.cargo || {}).some(v => v > 0) ? 1 : 0));
  const key = `${lead ? 1 : 0}${f}${moving ? 1 : 0}${ph}${load}`, BW = 220, BH = 110, AX = 110, AY = 86;
  let cv = wagonCache.get(key);
  if (!cv) {
    cv = document.createElement('canvas'); cv.width = Math.round(BW * PROP_RES); cv.height = Math.round(BH * PROP_RES);
    const o = cv.getContext('2d', { willReadFrequently: true }), saved = ctx; o.setTransform(PROP_RES, 0, 0, PROP_RES, 0, 0); ctx = o;
    const fake = { cargo: load === 0 ? {} : load === 1 ? { a: 1 } : { a: 20 } };
    try { paintWagon(AX, AY, f, ph / 6 * 6.2832 * 150, moving, lead, fake); } finally { ctx = saved; }
    o.setTransform(1, 0, 0, 1, 0, 0); SP.pixelize(o, cv.width, cv.height, false, false); wagonCache.set(key, cv);
  }
  ctx.drawImage(cv, x - AX, y - AY, BW, BH);
}
function paintWagon(x, y, f, now, moving, lead, e) {
  ctx.save(); ctx.translate(x, y); ctx.scale(WAGON_K, WAGON_K);
  const rot = moving ? x / (7 * WAGON_K) : 0; x = 0; y = 0;
  shadow(x + f * (lead ? 18 : 12), y + 6, lead ? 40 : 30, .3);
  const sw = moving ? Math.sin(now / 150) : 0;
  // Zugtiere vor dem Wagen: zwei Ochsen hintereinander versetzt, der Beiwagen hat ein Maultier
  if (lead) { drawDraft(x + f * 50, y - 1, f, now, moving, true, 1.6); drawDraft(x + f * 32, y + 2, f, now, moving, true, 0); }
  else drawDraft(x + f * 30, y + 1, f, now, moving, false, 0.8);
  ctx.strokeStyle = '#2b2116'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + f * 16, y - 8); ctx.lineTo(x + f * (lead ? 42 : 26), y - 12); ctx.stroke();   // Deichsel
  const bob = moving ? Math.abs(sw) * 0.8 : 0, W0 = lead ? 20 : 16, W1 = lead ? 16 : 13;
  ctx.fillStyle = '#3e3020'; ctx.fillRect(x - W0, y - 15 - bob, W0 + W1, 12);                                   // Ladefläche (dunkles, altes Holz)
  ctx.fillStyle = '#3a2c1c'; for (let i = -W0 + 7; i < W1; i += 7) ctx.fillRect(x + i, y - 15 - bob, 1, 12);  // Bretterfugen
  ctx.fillStyle = '#5e4a31'; ctx.fillRect(x - W0, y - 15 - bob, W0 + W1, 2);
  if (lead) {                                                                                                     // Plane über Spriegeln
    ctx.fillStyle = '#8a7f68'; ctx.beginPath(); ctx.moveTo(x - W0, y - 15 - bob); ctx.quadraticCurveTo(x - 2, y - 40 - bob, x + W1, y - 15 - bob); ctx.fill();   // verwittertes Leinen
    ctx.fillStyle = '#9c917a'; ctx.beginPath(); ctx.moveTo(x - W0 + 3, y - 17 - bob); ctx.quadraticCurveTo(x - 6, y - 36 - bob, x + 2, y - 19 - bob); ctx.fill();   // Licht oben links
    ctx.fillStyle = 'rgba(40,30,20,.35)'; ctx.fillRect(x - W0 + 2, y - 19 - bob, W0 + W1 - 4, 3);   // Schmutzrand
    ctx.fillStyle = 'rgba(60,40,20,.22)'; for (const k of [-10, 0, 9]) ctx.fillRect(x + k, y - 33 - bob + Math.abs(k) * 0.5, 2, 18 - Math.abs(k) * 0.5);
    const dx = x + f * (W1 - 2);                                                                                 // Kutscher auf dem Bock
    ctx.fillStyle = '#6a4b2c'; ctx.fillRect(dx - 3, y - 26 - bob, 7, 10);
    ctx.fillStyle = '#c9a582'; ctx.beginPath(); ctx.arc(dx + 0.5, y - 29 - bob, 3.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#3d2f1f'; ctx.fillRect(dx - 4, y - 33 - bob, 9, 2); ctx.fillRect(dx - 2, y - 35 - bob, 5, 2);   // Hut
    ctx.strokeStyle = 'rgba(30,20,10,.7)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(dx + f * 3, y - 21 - bob); ctx.lineTo(x + f * 44, y - 16); ctx.stroke();   // Zügel
  } else {                                                                                                        // offene Ladung: Kisten, Säcke
    const n = Object.values(e.cargo || {}).reduce((a, b) => a + b, 0);
    if (n > 0) { ctx.fillStyle = '#7a5a35'; ctx.fillRect(x - 12, y - 24 - bob, 10, 9); ctx.fillStyle = '#5e4427'; ctx.fillRect(x - 12, y - 20 - bob, 10, 1); }
    if (n > 8) { ctx.fillStyle = '#b8a67e'; ctx.beginPath(); ctx.ellipse(x + 4, y - 19 - bob, 6, 4.5, 0, 0, 7); ctx.fill(); }
    if (n > 16) { ctx.fillStyle = '#6f5130'; ctx.fillRect(x - 6, y - 31 - bob, 8, 7); }
  }
  for (const wx of [x - W0 + 7, x + W1 - 6]) {                                                                   // Räder mit Speichen
    const R = lead ? 6.5 : 5.5, a = rot;
    ctx.fillStyle = '#2b2116'; ctx.beginPath(); ctx.arc(wx, y + 1, R, 0, 7); ctx.fill();
    ctx.strokeStyle = '#6b5438'; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 0; k < 3; k++) { const t = a + k * Math.PI / 3; ctx.moveTo(wx - Math.cos(t) * R * 0.8, y + 1 - Math.sin(t) * R * 0.8); ctx.lineTo(wx + Math.cos(t) * R * 0.8, y + 1 + Math.sin(t) * R * 0.8); }
    ctx.stroke(); ctx.fillStyle = '#8a7150'; ctx.fillRect(wx - 1, y, 2, 2);
  }
  ctx.restore();
}
function drawDecal(e) {
  ctx.fillStyle = `rgba(90,18,14,${clamp(e.life / e.maxLife, 0, 1) * 0.55})`;
  ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r, e.r * 0.5, 0, 0, 7); ctx.fill();
}

// Props werden einmal als Vektor gezeichnet, dann pixelisiert (harte Kanten, Kontur, Randlicht) und gecacht.
// Animierte Props bekommen wenige gecachte Phasen. Box: 96×96 Welt-Einheiten = 48×48 Pixel, Fuß bei (48, 70).
const VARIANTS = { crate: 3, barrel: 3, rock_node: 3, ore_node: 2, broken_pillar: 3, gravestone: 4 };                // Anzahl Detailvarianten je häufigem Prop (kein Einerlei)
const PROP_PERIOD = { machine: 600, omega_altar: 2500, omega_rift: 1570, star_shard: 1880, magitower: 1500, astroclock: 6000, fountain: 900, telecircle: 2000, chimney: 1130, factory: 1130, big_gear: 3000, hearth: 565, forge: 565, campfire_static: 565, campfire: 565, torch: 690, shrine: 3770, banner_torn: 5030, bone_spire: 3140, obelisk: 1880, candles: 690 };
const PROP_BOX = { star_shard: 160, omega_rift: 128, tower_ruin: 192, boat: 128, factory: 224, big_gear: 96, palace: 320, markethall: 288, observatory: 224, bank: 192, astroclock: 160, magitower: 160, crane: 160, fountain: 128, column: 96, aqueduct: 96 };                   // Kantenlänge der Back-Box (Welt-Einheiten), Standard 96
// Session 13 (Nutzer): Möbel und Stände in Menschengröße — gezeichnet wie bisher, um den Fußpunkt vergrößert
const PROP_SCALE = { bed: 1.5, bunk: 1.5, table: 1.45, bench: 1.4, stall: 1.6, counter: 1.45, desk: 1.45, workbench_int: 1.45, shelf: 1.45, hearth: 1.4, forge: 1.4, anvil: 1.35, cask_rack: 1.45, weapon_rack: 1.4, chest: 1.3, trough: 1.4, altar_small: 1.4, sack: 1.2, crate_stack: 1.25, hay: 1.3, throne: 1.3, workbench: 1.4, workstation: 1.4, machine: 1.3, gearpile: 1.3, candles: 1.3, well: 1.3, keychest: 1.3 };
const PROP_FLAT = new Set(['blood', 'flowers_prop']);  // Bodenflecken: keine Kontur
const PROP_ORGANIC = new Set(['tree', 'bush', 'dead_tree', 'fallen_tree', 'rock_node', 'ore_node', 'rubble', 'camp_ruin', 'standing_stone']);
const propCache = new Map();
SP.onArtChange(() => { propCache.clear(); houseCache.clear(); wagonCache.clear(); bakeCache.clear(); iconCache.clear(); groundIcons.clear(); chunkCache.clear(); });   // Stil gewechselt: alles neu backen
const PROP_RES = 1 / SP.COARSE;                           // Pixel je Welt-Einheit — Stil D: gleiches Raster wie die Figuren (1,5 Welt je Pixel)
const marketOpen = () => { const h = S.minute / 60; return h >= 7 && h < 18; };   // Markt: 7–18 Uhr
export const stallShut = e => e.type === 'stall' && !e.fest && !marketOpen();
// S15 P6: Turm des Nachtglases — ein Wahrzeichen: schmaler, sehr hoher Schaft aus dunklem Stein über breitem Sockel, Strebepfeiler,
// Galerie, Dornenkrone mit Seelenfeuer. Das Bild wird einmal gemalt (Pixelraster 2 × 2), darüber leben die Fenster und die Funken.
let TOWER_CV = null, TOWER_AT = { arr: null, e: null };
const TOWER_WIN = [];
function towerCanvas() {
  if (TOWER_CV) return TOWER_CV;
  const W = 120, H = 290, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const o = cv.getContext('2d'), R = (x, y, w, h, c) => { o.fillStyle = c; o.fillRect(x, y, w, h); };
  const cx = W / 2, stone = ['#1c1a1f', '#26232b', '#322e38', '#403a47'];
  for (let y = 250; y < 290; y++) { const hw = 50 - (y - 250) * 0.15; R(cx - hw, y, hw * 2, 1, y % 6 === 0 ? stone[0] : stone[1]); }   // Sockel mit Stufen
  for (let i = 0; i < 4; i++) R(cx - 18 + i * 2, 278 - i * 4, 36 - i * 4, 4, stone[2 + (i & 1)]);
  R(cx - 7, 262, 14, 26, '#0b0a0c'); R(cx - 5, 258, 10, 4, '#0b0a0c'); R(cx - 1, 256, 2, 2, '#8fd9b0');                 // Torbogen
  for (let y = 40; y < 252; y++) { const t = (y - 40) / 212, hw = 18 + t * 12;                                        // Schaft, nach unten breiter
    R(cx - hw, y, hw * 2, 1, stone[1]); R(cx - hw, y, 4, 1, stone[3]); R(cx + hw - 5, y, 5, 1, stone[0]);
    if (y % 9 === 0) R(cx - hw, y, hw * 2, 1, stone[0]); }                                                            // Steinlagen
  for (const s of [-1, 1]) for (let y = 120; y < 252; y++) { const t = (y - 40) / 212, hw = 18 + t * 12, bw = 4 + (y - 120) * 0.06; R(s < 0 ? cx - hw - bw : cx + hw, y, bw, 1, s < 0 ? stone[2] : stone[0]); }   // Strebepfeiler
  R(cx - 30, 118, 60, 5, stone[3]); R(cx - 30, 123, 60, 2, stone[0]); for (let x = cx - 28; x < cx + 28; x += 5) R(x, 112, 2, 6, stone[2]);   // Galerie
  for (let y = 26; y < 42; y++) { const hw = 22 - (y - 26) * 0.2; R(cx - hw, y, hw * 2, 1, stone[2]); }                // Kronenring
  for (let k = -4; k <= 4; k++) { const x = cx + k * 5, hgt = 12 + (k % 2 === 0 ? 8 : 0) - Math.abs(k); for (let i = 0; i < hgt; i++) R(x - Math.max(0, 1.5 - i * 0.12), 26 - i, Math.max(1, 3 - i * 0.2), 1, stone[3]); }   // Dornen
  TOWER_WIN.length = 0;
  for (const [y, n] of [[60, 2], [88, 3], [140, 2], [170, 3], [200, 2], [228, 3]]) for (let i = 0; i < n; i++) { const x = cx - (n - 1) * 5 + i * 10; TOWER_WIN.push([x, y]); R(x - 2, y - 1, 4, 9, '#0b0a0c'); }
  return (TOWER_CV = cv);
}
function drawMageTower(e, now) {
  const K = 3, cv = towerCanvas(), x0 = Math.round(e.x - cv.width * K / 2), y0 = Math.round(e.y + 60 - cv.height * K);
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 54, 165, 32, 0, 0, 7); ctx.fill();
  ctx.drawImage(cv, x0, y0, cv.width * K, cv.height * K);
  for (const [wx, wy] of TOWER_WIN) { const p = 0.55 + 0.45 * Math.sin(now / 700 + wx * 0.3 + wy * 0.1); ctx.fillStyle = `rgba(143,217,176,${p})`; ctx.fillRect(x0 + (wx - 1) * K, y0 + wy * K, 2 * K, 7 * K); }
  const fy = y0 + 18 * K, fl = 0.6 + 0.4 * Math.sin(now / 160);                                                      // Seelenfeuer in der Krone
  ctx.fillStyle = `rgba(143,217,176,${0.25 * fl})`; ctx.beginPath(); ctx.arc(e.x, fy, 26, 0, 7); ctx.fill(); ctx.fillStyle = `rgba(200,255,225,${0.8 * fl})`; ctx.fillRect(e.x - 4, fy - 8, 8, 12);
  for (let i = 0; i < 10; i++) { const t = ((now / 3200 + i * 0.1) % 1), sx = e.x + Math.sin(i * 2.3 + now / 900) * (20 + i * 3), sy = fy - t * 180;   // Seelenfunken steigen auf
    ctx.fillStyle = `rgba(160,240,200,${(1 - t) * 0.8})`; ctx.fillRect(Math.round(sx), Math.round(sy), 3, 3); }
  ctx.restore();
}
function drawPropPixel(e, now) {
  if (e.type === 'mage_tower') return drawMageTower(e, now);             // S15 P6
  if (e.type === 'tower_gate') return;                                   // das Tor ist Teil des Turmbilds
  const PA = SP.PROP_ATLAS[e.type] && SP.atlasOn() && SP.atlasSprite(SP.PROP_ATLAS[e.type]);   // Stil F: Objekt aus dem Blatt, in seiner eigenen Größe
  if (PA) { const k = SP.APX * SP.FIGK; ctx.drawImage(PA, Math.round(e.x - PA.width * k / 2), Math.round(e.y + 8 - PA.height * k), PA.width * k, PA.height * k); return; }
  const per = PROP_PERIOD[e.type];
  let key = e.type, v = 0, ph = 0;
  let sp = null;
  if (e.type === 'tree') { v = (h2(e.x | 0, e.y | 0) * 3) | 0; const list = REGION[e.map === 'world' ? regionOfProp(e) : 'greenmark'].trees;
    sp = list[v % list.length]; key += sp + v + (e.hp < 3 ? 'c' : ''); }
  let variant = 0;
  if (VARIANTS[e.type]) { variant = e.v ?? ((h2(e.x | 0, (e.y | 0) + 3) * VARIANTS[e.type]) | 0); key += 'v' + variant; }
  if (e.depleted) key += 'd';
  if (e.intact) key += 'I';
  if (e.opened) key += 'o';
  const shut = stallShut(e); if (shut) key += 'z';   // §41: Markt sichtbar zu (Plane), nicht nur eine Zahl
  let reg = null;                                         // Fels trägt die Gesteinsfarbe seiner Region
  if (e.type === 'rock_node' || e.type === 'ore_node') { reg = e.map === 'world' ? regionOfProp(e) : 'greenmark'; key += reg; }
  if (per) { ph = ((now / per * 6 + h2(e.x | 0, 7) * 6) | 0) % 6; key += '#' + ph; }
  let cv = propCache.get(key);
  if (!cv) {
    if (propCache.size > 600) propCache.clear();
    const B = PROP_BOX[e.type] || 96;
    cv = document.createElement('canvas'); cv.width = cv.height = Math.round(B * PROP_RES);   // G5: feines Raster (1 Welt je Pixel) wie Figuren
    const o = cv.getContext('2d', { willReadFrequently: true }), saved = ctx;
    o.setTransform(PROP_RES, 0, 0, PROP_RES, 0, 0);
    ctx = o;
    const sc = PROP_SCALE[e.type]; if (sc) { o.translate(B / 2, B * 0.73); o.scale(sc, sc); o.translate(-B / 2, -B * 0.73); }
    try { drawProp({ ...e, x: B / 2, y: B * 0.73, _v: (v + 0.5) / 3, _sp: sp, _var: variant, _reg: reg, _shut: shut }, per ? ph / 6 * per : 0); } finally { ctx = saved; }
    o.setTransform(1, 0, 0, 1, 0, 0);
    SP.pixelize(o, cv.width, cv.height, PROP_ORGANIC.has(e.type), PROP_FLAT.has(e.type));
    propCache.set(key, cv);
  }
  const B = cv.width / PROP_RES;
  ctx.drawImage(cv, e.x - B / 2, e.y - B * 0.73, B, B);
}

// Nutzer (S13): Sprites exportieren — ein Prop als Bild über denselben Bake-Pfad wie im Spiel
export function propSprite(type, o = {}) {
  const B = PROP_BOX[type] || 96, c = document.createElement('canvas'); c.width = c.height = B;
  const saved = ctx; ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  try { drawPropPixel({ kind: 'prop', type, map: 'world', x: B / 2, y: B * 0.73, r: 12, ...o }, 0); } finally { ctx = saved; }
  return c;
}
// Referenz 4: Krone aus Blattballen — Schatten unten rechts, Grundton, Licht oben links, Glanzpunkte; fest aus dem Hash
const LEAF = { summer: ['#141c10', '#26361a', '#3a5024', '#5e7432'], dark: ['#10170f', '#1e2c1a', '#2c4026', '#46603a'],
  autumn: ['#24140c', '#5a2c12', '#8a4a1a', '#b8782c'], birch: ['#182212', '#2e4020', '#4a6028', '#6e8a38'] };
function crown(cx, cy, R, pal, seed, n) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = h2(seed, i) * 6.283, r = Math.sqrt(h2(i, seed)) * R;
    pts.push([cx + Math.cos(a) * r * 1.05, cy + Math.sin(a) * r * 0.75, R * 0.42 * (0.7 + h2(i + 9, seed) * 0.5)]); }
  const layer = (col, f) => { ctx.fillStyle = col; ctx.beginPath(); for (const p of pts) { const q = f(p); if (q) { ctx.moveTo(q[0] + q[2], q[1]); ctx.arc(q[0], q[1], q[2], 0, 7); } } ctx.fill(); };
  layer(pal[0], ([x, y, r]) => [x + 2, y + 3, r]);
  layer(pal[1], p => p);
  layer(pal[2], ([x, y, r]) => y < cy + R * 0.35 ? [x - r * 0.22, y - r * 0.3, r * 0.72] : null);
  layer(pal[3], ([x, y, r]) => x < cx + R * 0.2 && y < cy ? [x - r * 0.42, y - r * 0.48, r * 0.34] : null);
}
function drawProp(e, now) {
  const x = e.x, y = e.y;
  switch (e.type) {
    case 'tree': {                                        // drei Arten: Eiche, Tanne, knorrige Birke
      const v = e._v ?? h2(x | 0, y | 0), sp = e._sp || ['oak', 'pine', 'birch'][(v * 3) | 0];
      shadow(x, y + 6, 14, .4);
      if (sp === 'dead') {                                // toter Baum: kahle, gekrümmte Äste
        ctx.strokeStyle = '#3a2e22'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x - 1, y - 26); ctx.moveTo(x, y - 12); ctx.lineTo(x - 12, y - 24); ctx.lineTo(x - 16, y - 34);
        ctx.moveTo(x - 1, y - 20); ctx.lineTo(x + 10, y - 32); ctx.moveTo(x - 1, y - 26); ctx.lineTo(x + 3, y - 40); ctx.stroke();
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 10, y - 32); ctx.lineTo(x + 15, y - 30); ctx.moveTo(x - 12, y - 24); ctx.lineTo(x - 18, y - 22); ctx.stroke(); ctx.lineCap = 'butt';
      } else if (sp === 'willow') {                       // Weide: hängende, dunkle Zweige
        ctx.fillStyle = '#3a2e22'; ctx.fillRect(x - 3, y - 18, 6, 24);
        ctx.fillStyle = '#2c3a28'; ctx.beginPath(); ctx.ellipse(x, y - 28, 18, 12, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#243024'; for (let i = -16; i <= 16; i += 4) ctx.fillRect(x + i, y - 28, 3, 20 - Math.abs(i) * 0.5);
        ctx.fillStyle = '#3a4a32'; ctx.beginPath(); ctx.ellipse(x - 5, y - 32, 8, 5, 0, 0, 7); ctx.fill();
      } else if (sp === 'pine' || sp === 'snowpine') {    // Tanne: gestufte, dunkle Kegel (im Gebirge mit Schnee)
        ctx.fillStyle = '#382a1d'; ctx.fillRect(x - 2, y - 8, 4, 14);
        for (let i = 0; i < 4; i++) { const w = 16 - i * 3, yy = y - 6 - i * 10;
          ctx.fillStyle = i & 1 ? '#233327' : '#2a3b2c'; ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x, yy - 16); ctx.lineTo(x + w, yy); ctx.fill();
          ctx.fillStyle = '#1a261d'; ctx.beginPath(); ctx.moveTo(x + 2, yy - 12); ctx.lineTo(x + w, yy); ctx.lineTo(x + 2, yy); ctx.fill();
          ctx.fillStyle = '#3e5638'; ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x - 1, yy - 15); ctx.lineTo(x - w + 5, yy); ctx.fill();   // Referenz 4: Licht an der linken Flanke
          ctx.fillStyle = '#10180f'; for (let k = -w + 2; k < w; k += 4) ctx.fillRect(x + k, yy - 1, 2, 2);                                          // gezackter Astsaum
          if (sp === 'snowpine') { ctx.fillStyle = '#dfe6ea'; ctx.beginPath(); ctx.moveTo(x - w * 0.7, yy - 4); ctx.lineTo(x, yy - 16); ctx.lineTo(x + w * 0.3, yy - 10); ctx.lineTo(x - w * 0.2, yy - 6); ctx.fill(); } }
      } else if (sp === 'birch') {                        // Birke: heller Stamm mit Kerben, lichte Krone aus Blattballen
        ctx.fillStyle = '#9a927e'; ctx.fillRect(x - 2.5, y - 34, 5, 40); ctx.fillStyle = '#b8b09a'; ctx.fillRect(x - 2.5, y - 34, 1.5, 40);
        ctx.fillStyle = '#2b2620'; for (let i = 0; i < 6; i++) ctx.fillRect(x - 2.5 + (i & 1) * 2, y - 30 + i * 6, 3, 1.5);
        crown(x, y - 42, 13, LEAF.birch, 31 + v * 97, 11);
      } else {                                            // Eiche (Referenz 4): Wurzeln, Astgabel, schwere Krone aus Blattballen
        ctx.fillStyle = '#2e2218'; ctx.beginPath(); ctx.moveTo(x - 9, y + 5); ctx.lineTo(x - 3, y - 2); ctx.lineTo(x - 3, y - 24); ctx.lineTo(x + 3, y - 24); ctx.lineTo(x + 3, y - 2); ctx.lineTo(x + 10, y + 5); ctx.fill();
        ctx.fillStyle = '#4a3826'; ctx.fillRect(x - 3, y - 22, 2, 24);
        ctx.strokeStyle = '#2e2218'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x - 11, y - 30); ctx.moveTo(x + 1, y - 20); ctx.lineTo(x + 12, y - 32); ctx.stroke();
        crown(x, y - 36, 21, v > 0.8 ? LEAF.autumn : v > 0.45 ? LEAF.dark : LEAF.summer, 7 + v * 131, 16);
      }
      if (e.hp < 3) { ctx.fillStyle = '#6b5a3a'; ctx.fillRect(x - 5, y - 6, 10, 3); }
      break; }
    case 'bush':
      shadow(x, y + 3, 9, .25);
      crown(x, y - 3, 9, e.depleted ? LEAF.dark : LEAF.summer, 5 + (x | 0), 7);
      if (!e.depleted) { ctx.fillStyle = '#9c5a4a'; ctx.fillRect(x - 2, y - 6, 2, 2); ctx.fillRect(x + 4, y - 2, 2, 2); }
      break;
    case 'rock_node': case 'ore_node': {                 // Findling: Facetten (Licht von links oben), Risse, Regionsgestein
      const [dk, sh, b, hi, top] = ROCK_PAL[e._reg] || ROCK_PAL.greenmark, reg = e._reg, v = e._var || 0;
      const poly = (c, pts) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + pts[0], y + pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(x + pts[i], y + pts[i + 1]); ctx.closePath(); ctx.fill(); };
      const line = (c, pts, w = 1) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x + pts[0], y + pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(x + pts[i], y + pts[i + 1]); ctx.stroke(); };
      if (e.depleted) {                                   // abgebaut: Schutthaufen
        shadow(x, y + 4, 10, .25);
        poly(sh, [-10, 6, -7, 0, -2, 2, -1, 6]); poly(b, [-3, 6, 0, -2, 6, -1, 8, 6]); poly(hi, [0, -2, 3, -3, 6, -1, 2, 1]); poly(sh, [5, 6, 8, 2, 11, 6]);
        break;
      }
      shadow(x, y + 5, 13, .32);
      if (v === 1) {                                      // hohe Platte mit kleinem Begleitstein
        poly(sh, [8, 7, 9, 1, 14, 0, 15, 7]); poly(hi, [9, 1, 11, -1, 14, 0, 12, 2]);
        poly(sh, [-9, 7, -10, -8, -5, -16, 2, -15, 5, -4, 4, 7]);
        poly(b, [-9, 7, -10, -8, -5, -16, -3, -6, -4, 7]); poly(hi, [-10, -8, -5, -16, 2, -15, -2, -11]);
        line(top, [-10, -8, -5, -16, 2, -15]); line(dk, [-3, -6, -1, 0, 1, 2, 0, 6]); line(dk, [-7, -2, -5, 1]);
      } else if (v === 2) {                               // flacher, breiter Block
        poly(sh, [-14, 7, -13, -2, -7, -8, 6, -8, 13, -3, 14, 7]);
        poly(b, [-14, 7, -13, -2, -4, -1, -3, 7]); poly(hi, [-13, -2, -7, -8, 6, -8, 13, -3, 4, -2, -4, -1]);
        line(top, [-13, -2, -7, -8, 6, -8]); line(dk, [4, -2, 5, 3, 3, 7]); line(dk, [-8, 1, -6, 4]); line(sh, [-9, -5, 1, -6]);
      } else {                                            // kantiger Findling
        poly(sh, [-12, 7, -10, -6, -4, -12, 5, -13, 11, -4, 12, 4, 7, 7]);
        poly(b, [-12, 7, -10, -6, -6, -2, -5, 7]); poly(hi, [-10, -6, -4, -12, 5, -13, 2, -5, -6, -2]);
        poly(SP.mix(sh, dk, 0.4), [2, -5, 5, -13, 11, -4]);
        line(top, [-10, -6, -4, -12, 5, -13]); line(dk, [2, -5, 3, 1, 1, 6]); line(dk, [-8, 1, -7, 4]);
      }
      if (reg === 'mountain') poly('#dfe6ea', v === 2 ? [-12, -3, -7, -8, 5, -8, 9, -5, 1, -4] : v === 1 ? [-9, -9, -5, -16, 2, -15, 0, -12, -5, -11] : [-9, -7, -4, -12, 5, -13, 3, -9, -3, -8]);
      else if (reg === 'greenmark' || reg === 'forest' || reg === 'marsh' || reg === 'plains') {   // Moos auf der Wetterseite
        ctx.fillStyle = '#3a4a2a'; ctx.fillRect(x - 9, y - 5 - v * 2, 4, 2); ctx.fillRect(x - 7, y - 7 - v * 2, 3, 2); ctx.fillStyle = '#4c5e34'; ctx.fillRect(x - 8, y - 7 - v * 2, 1, 1);
      }
      if (e.type === 'ore_node') {                        // Erzader: glänzende Einschlüsse entlang eines Risses
        line('#6a4a2a', [-6, 0, -1, -3, 5, -1], 2);
        ctx.fillStyle = '#c08a4a'; ctx.fillRect(x - 5, y - 1, 2, 2); ctx.fillRect(x + 1, y - 3, 2, 2); ctx.fillRect(x + 4, y - 1, 2, 1);
        ctx.fillStyle = '#e8c07a'; ctx.fillRect(x - 5, y - 1, 1, 1); ctx.fillRect(x + 1, y - 3, 1, 1);
      }
      break; }
    case 'crate': case 'crate_stack': {                   // Kiste: Bretter, Strebe/Eisenband/Schaden; offen = Deckel ab
      const v = e._var || 0, opened = e.opened;
      const box = (bx, by, vv) => {
        const W = ['#6a5134', '#5f4a30', '#574632'][vv], L = ['#846644', '#77603f', '#6e5a40'][vv], D = '#33261a';
        shadow(bx, by + 4, 12, .3);
        ctx.fillStyle = W; ctx.fillRect(bx - 11, by - 15, 22, 17);                      // Front
        ctx.fillStyle = L; ctx.fillRect(bx - 11, by - 20, 22, 5);                       // Deckel (Aufsicht)
        ctx.fillStyle = D; ctx.fillRect(bx - 11, by - 10, 22, 1.5); ctx.fillRect(bx - 11, by - 5, 22, 1.5); ctx.fillRect(bx - 1, by - 20, 1.5, 5);
        ctx.fillStyle = 'rgba(255,230,180,.12)'; ctx.fillRect(bx - 11, by - 15, 3, 17);
        if (vv === 0) { ctx.strokeStyle = D; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx - 9, by); ctx.lineTo(bx + 9, by - 14); ctx.stroke(); }
        if (vv === 1) { ctx.fillStyle = '#4a4843'; ctx.fillRect(bx - 7, by - 20, 3, 22); ctx.fillRect(bx + 5, by - 20, 3, 22);
          ctx.fillStyle = '#8a857a'; ctx.fillRect(bx - 6, by - 12, 1.5, 1.5); ctx.fillRect(bx + 6, by - 12, 1.5, 1.5); }
        if (vv === 2) { ctx.fillStyle = '#1c150e'; ctx.beginPath(); ctx.moveTo(bx + 11, by - 20); ctx.lineTo(bx + 3, by - 20); ctx.lineTo(bx + 11, by - 9); ctx.fill();
          ctx.fillStyle = L; ctx.fillRect(bx + 4, by - 23, 2, 4); ctx.fillRect(bx + 8, by - 22, 2, 3); }   // gesplitterte Ecke
      };
      if (e.type === 'crate_stack') { box(x - 3, y, 1); box(x + 4, y - 17, 0); break; }
      box(x, y, v);
      if (opened) { ctx.fillStyle = '#1c150e'; ctx.fillRect(x - 9, y - 19, 18, 3); ctx.fillStyle = '#6e5a40'; ctx.fillRect(x + 8, y - 24, 12, 4); }   // Deckel daneben
      break; }
    case 'chest': {                                       // Truhe: gewölbter Deckel, Eisenbänder, Schloss; offen = Deckel hoch
      shadow(x, y + 4, 12, .32);
      const Wd = '#4e3722', Lt = '#6a4b2e', Ir = '#3e3c38';
      ctx.fillStyle = Wd; ctx.fillRect(x - 12, y - 12, 24, 14);
      if (e.opened) { ctx.fillStyle = Lt; ctx.fillRect(x - 12, y - 24, 24, 9); ctx.fillStyle = '#16100a'; ctx.fillRect(x - 10, y - 14, 20, 4);
        ctx.fillStyle = Ir; ctx.fillRect(x - 8, y - 24, 3, 9); ctx.fillRect(x + 5, y - 24, 3, 9); }
      else { ctx.fillStyle = Lt; ctx.beginPath(); ctx.ellipse(x, y - 12, 12, 6, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(x - 12, y - 13, 24, 2);
        ctx.fillStyle = Ir; ctx.fillRect(x - 8, y - 18, 3, 20); ctx.fillRect(x + 5, y - 18, 3, 20);
        ctx.fillStyle = '#bd9433'; ctx.fillRect(x - 2, y - 11, 4, 5); ctx.fillStyle = '#2a1e10'; ctx.fillRect(x - 0.5, y - 9, 1, 2); }
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 12, y - 2, 24, 4);
      break; }
    case 'sack': {                                        // Sack: prall, oben gebunden
      shadow(x, y + 4, 9, .3);
      ctx.fillStyle = '#8f7f5c'; ctx.beginPath(); ctx.ellipse(x, y - 6, 9, 9, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#a8986f'; ctx.beginPath(); ctx.ellipse(x - 3, y - 9, 4, 4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#6e603f'; ctx.fillRect(x - 3, y - 17, 6, 4); ctx.fillStyle = '#3e3224'; ctx.fillRect(x - 3, y - 14, 6, 1.5);
      ctx.fillStyle = 'rgba(30,24,16,.35)'; ctx.fillRect(x + 3, y - 8, 4, 8);
      break; }
    case 'hay': {                                         // Heuballen: zwei gebundene Ballen, Halme stehen ab
      shadow(x, y + 4, 14, .3);
      const bale = (bx, by, w, h) => {
        ctx.fillStyle = '#9a7a34'; ctx.fillRect(bx - w / 2, by - h, w, h);
        ctx.fillStyle = '#c4a14e'; ctx.fillRect(bx - w / 2, by - h, w, 3);
        ctx.fillStyle = '#6e5424'; ctx.fillRect(bx + w / 2 - 3, by - h + 3, 3, h - 3);
        ctx.fillStyle = '#4a3a1c'; ctx.fillRect(bx - w / 2 + 4, by - h, 1.5, h); ctx.fillRect(bx + w / 2 - 8, by - h, 1.5, h);   // Bindeschnüre
        ctx.fillStyle = '#dcc068'; for (let i = 0; i < 5; i++) ctx.fillRect(bx - w / 2 + 2 + i * 4, by - h - 1 - (i & 1), 1.5, 2);
      };
      bale(x, y + 3, 26, 11); bale(x - 3, y - 8, 18, 9);
      break; }
    case 'boat': {                                        // Ruderboot am Steg: Rumpf, Duchten, Ruder, Wasserlinie
      ctx.save(); ctx.translate(x, y); ctx.scale(1.5, 1.5); ctx.translate(-x, -y);   // echte Bootsgröße (~2 Kacheln)
      ctx.fillStyle = 'rgba(8,18,28,.4)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 26, 7, 0, 0, 7); ctx.fill();
      const hull = (s, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 25 * s, y - 4); ctx.quadraticCurveTo(x, y - 18 * s, x + 25 * s, y - 4);
        ctx.quadraticCurveTo(x, y + 8 * s, x - 25 * s, y - 4); ctx.fill(); };
      hull(1, '#3a2a1a'); hull(0.82, '#6a4c30'); hull(0.62, '#2a2018');
      ctx.fillStyle = '#7a5a38'; ctx.fillRect(x - 8, y - 11, 3, 13); ctx.fillRect(x + 6, y - 10, 3, 11);   // Duchten
      ctx.fillStyle = '#8a6a44'; ctx.save(); ctx.translate(x + 2, y - 3); ctx.rotate(-0.35); ctx.fillRect(-18, -1, 36, 2); ctx.fillRect(14, -2.5, 7, 5); ctx.restore();   // Ruder
      ctx.fillStyle = 'rgba(200,210,215,.35)'; ctx.fillRect(x - 22, y + 3, 10, 1.5); ctx.fillRect(x + 12, y + 4, 8, 1.5);
      ctx.restore();
      break; }
    case 'net_rack': {                                    // Netzgestell: zwei Pfosten, Querstange, hängendes Netz mit Schwimmern
      shadow(x, y + 3, 14, .25);
      ctx.fillStyle = '#3d2f1f'; ctx.fillRect(x - 15, y - 26, 3, 28); ctx.fillRect(x + 12, y - 26, 3, 28); ctx.fillRect(x - 16, y - 27, 32, 3);
      ctx.strokeStyle = '#9a8a64'; ctx.lineWidth = 1;
      ctx.beginPath(); for (let i = -12; i <= 12; i += 4) { ctx.moveTo(x + i, y - 24); ctx.lineTo(x + i + 6, y - 4); ctx.moveTo(x + i + 4, y - 24); ctx.lineTo(x + i - 2, y - 4); } ctx.stroke();
      ctx.fillStyle = '#a84a3a'; for (let i = -12; i <= 12; i += 8) ctx.fillRect(x + i, y - 25, 3, 3);
      break; }
    case 'laundry': {                                     // Wäscheleine zwischen zwei Pfosten: Hemd, Tuch, Laken
      shadow(x, y + 3, 16, .2);
      ctx.fillStyle = '#3d2f1f'; ctx.fillRect(x - 18, y - 24, 3, 26); ctx.fillRect(x + 15, y - 24, 3, 26);
      ctx.fillStyle = '#6a5a44'; ctx.fillRect(x - 16, y - 23, 32, 1.5);
      const cloth = (cx, w, h, c, d) => { ctx.fillStyle = c; ctx.fillRect(cx, y - 22, w, h); ctx.fillStyle = d; ctx.fillRect(cx + w - 2, y - 22, 2, h); ctx.fillRect(cx, y - 22 + h - 2, w, 2); };
      cloth(x - 13, 8, 11, '#c9bfa6', '#9a917c'); cloth(x - 3, 7, 8, '#6a4a5a', '#4a3040'); cloth(x + 6, 7, 12, '#5a6a7a', '#3e4a58');
      break; }
    case 'omega_altar': {                                 // Phase 7: Altar Omegas — schwarzer Block, goldener Stern, rote Glut
      const f = 0.6 + 0.4 * Math.sin(now / 400);
      shadow(x, y + 5, 20, .4);
      ctx.fillStyle = '#16121a'; ctx.fillRect(x - 18, y - 16, 36, 20); ctx.fillStyle = '#2a2230'; ctx.fillRect(x - 18, y - 18, 36, 4);
      ctx.fillStyle = '#3a0a0c'; ctx.fillRect(x - 12, y - 14, 24, 14);
      ctx.fillStyle = '#c8a040'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - 1.571, r = i % 2 ? 3 : 7; ctx.lineTo(x + Math.cos(a) * r, y - 7 + Math.sin(a) * r); } ctx.fill();
      ctx.fillStyle = `rgba(230,60,40,${0.25 * f})`; ctx.beginPath(); ctx.ellipse(x, y - 7, 16, 10, 0, 0, 7); ctx.fill();
      for (const dx of [-15, 15]) { ctx.fillStyle = '#c9bfa6'; ctx.fillRect(x + dx - 1, y - 24, 2, 6); ctx.fillStyle = `rgba(255,190,90,${f})`; ctx.fillRect(x + dx - 1, y - 27, 2, 3); }
      break; }
    case 'omega_rift': {                                  // Phase 7: Riss zu Omega — senkrechter Spalt aus Licht und Blut
      const f = 0.5 + 0.5 * Math.sin(now / 250);
      ctx.fillStyle = `rgba(200,30,30,${0.18 + 0.1 * f})`; ctx.beginPath(); ctx.ellipse(x, y - 20, 16, 30, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#1a0406'; ctx.beginPath(); ctx.moveTo(x, y - 50); ctx.lineTo(x + 7, y - 22); ctx.lineTo(x, y + 4); ctx.lineTo(x - 6, y - 24); ctx.fill();
      ctx.fillStyle = `rgba(255,210,120,${0.6 + 0.4 * f})`; ctx.beginPath(); ctx.moveTo(x, y - 44); ctx.lineTo(x + 3, y - 22); ctx.lineTo(x, y - 2); ctx.lineTo(x - 2, y - 24); ctx.fill();
      break; }
    case 'star_shard': {                                  // Phase 7: Herz des Gefallenen Sterns — gezackter Kristall, rot-gold
      shadow(x, y + 6, 30, .45);
      const shard = (pts, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + pts[0], y + pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(x + pts[i], y + pts[i + 1]); ctx.fill(); };
      shard([-26, 4, -18, -30, -8, -10, 0, -62, 10, -14, 20, -38, 28, 4], '#5a1012');
      shard([-18, -30, -8, -10, 0, -62, -4, -8], '#9a2a1c'); shard([0, -62, 10, -14, 4, -6], '#c8a040'); shard([20, -38, 28, 4, 14, 0], '#7a1a14');
      ctx.fillStyle = `rgba(255,210,120,${0.4 + 0.3 * Math.sin(now / 300)})`; ctx.fillRect(x - 1, y - 58, 2, 40);
      break; }
    case 'trough': {                                      // Tränke: Holztrog mit Wasser
      shadow(x, y + 4, 14, .3);
      ctx.fillStyle = '#4b3a25'; ctx.fillRect(x - 14, y - 9, 28, 11); ctx.fillStyle = '#5e4a30'; ctx.fillRect(x - 14, y - 9, 28, 2);
      ctx.fillStyle = '#26384a'; ctx.fillRect(x - 11, y - 7, 22, 4); ctx.fillStyle = 'rgba(200,215,225,.4)'; ctx.fillRect(x - 8, y - 7, 6, 1);
      ctx.fillStyle = '#2b2116'; ctx.fillRect(x - 14, y + 1, 28, 1.5);
      break; }
    case 'lantern': {                                     // Laterne an einem Pfahl: gibt nachts Licht (staticLights)
      shadow(x, y + 3, 6, .25);
      ctx.fillStyle = '#2e2a26'; ctx.fillRect(x - 1.5, y - 30, 3, 32); ctx.fillRect(x - 1.5, y - 30, 9, 2);
      ctx.fillStyle = '#35332f'; ctx.fillRect(x + 3, y - 28, 6, 8); ctx.fillStyle = '#e2a95a'; ctx.fillRect(x + 4, y - 26, 4, 4);
      break; }
    case 'table': {                                       // Tisch mit Becher/Teller
      shadow(x, y + 4, 16, .3);
      ctx.fillStyle = '#3a2c1c'; ctx.fillRect(x - 12, y - 8, 3, 10); ctx.fillRect(x + 9, y - 8, 3, 10);
      ctx.fillStyle = '#6e5238'; ctx.fillRect(x - 15, y - 16, 30, 9); ctx.fillStyle = '#846444'; ctx.fillRect(x - 15, y - 16, 30, 2);
      ctx.fillStyle = '#2e2218'; ctx.fillRect(x - 15, y - 8, 30, 2);
      ctx.fillStyle = '#9a9488'; ctx.fillRect(x - 8, y - 15, 5, 4); ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x + 4, y - 16, 4, 5);
      break; }
    case 'bench':
      shadow(x, y + 3, 14, .25);
      ctx.fillStyle = '#3a2c1c'; ctx.fillRect(x - 12, y - 4, 3, 6); ctx.fillRect(x + 9, y - 4, 3, 6);
      ctx.fillStyle = '#6a4e34'; ctx.fillRect(x - 14, y - 8, 28, 5); ctx.fillStyle = '#80603f'; ctx.fillRect(x - 14, y - 8, 28, 1.5);
      break;
    case 'bed': case 'bunk': {                            // Bett (Etagenbett im Wachhaus)
      shadow(x, y + 4, 14, .3);
      const blanket = e.type === 'bunk' ? '#3e4a5a' : ['#6a3a30', '#3e4a3a', '#5a4a6a'][((x + y) | 0) % 3];
      ctx.fillStyle = '#3e2e1e'; ctx.fillRect(x - 11, y - 22, 22, 26);
      ctx.fillStyle = '#c9bfa6'; ctx.fillRect(x - 9, y - 20, 18, 6);
      ctx.fillStyle = blanket; ctx.fillRect(x - 9, y - 14, 18, 16); ctx.fillStyle = 'rgba(255,240,210,.14)'; ctx.fillRect(x - 9, y - 14, 18, 2);
      if (e.type === 'bunk') { ctx.fillStyle = '#3e2e1e'; ctx.fillRect(x - 11, y - 34, 3, 14); ctx.fillRect(x + 8, y - 34, 3, 14); ctx.fillRect(x - 11, y - 34, 22, 4); }
      break; }
    case 'shelf': {                                       // Regal an der Wand: Krüge, Bücher, Kräuter
      shadow(x, y + 3, 12, .25);
      ctx.fillStyle = '#3e2e1e'; ctx.fillRect(x - 12, y - 28, 24, 30);
      ctx.fillStyle = '#5a4430'; for (const sy of [-20, -11, -2]) ctx.fillRect(x - 11, y + sy, 22, 2);
      const cols = ['#8a5a3a', '#4a5a6a', '#6a7a4a', '#9a8a5a', '#6a3a3a'];
      for (let i = 0; i < 6; i++) { ctx.fillStyle = cols[(i * 3 + (x | 0)) % 5]; ctx.fillRect(x - 10 + i * 3.5, y - 26 + ((i & 1) * 2), 3, 6 - (i & 1) * 2); ctx.fillRect(x - 10 + i * 3.5, y - 17, 3, 6); }
      break; }
    case 'hearth': case 'forge': {                        // Feuerstelle / Esse: Stein, Glut (flackert)
      const t = now / 565, fl = 0.75 + 0.25 * Math.sin(t * 5.3);
      shadow(x, y + 4, 15, .3);
      ctx.fillStyle = '#5a554c'; ctx.fillRect(x - 14, y - 20, 28, 22);
      ctx.fillStyle = '#6c665c'; for (let i = 0; i < 4; i++) ctx.fillRect(x - 14 + i * 7, y - 20, 6, 4);
      ctx.fillStyle = '#16120e'; ctx.fillRect(x - 9, y - 14, 18, 12);
      ctx.fillStyle = `rgba(210,90,30,${fl})`; ctx.fillRect(x - 7, y - 8, 14, 5);
      ctx.fillStyle = `rgba(250,180,70,${fl})`; ctx.fillRect(x - 4, y - 10, 8, 4); ctx.fillRect(x - 1, y - 13, 3, 3);
      if (e.type === 'forge') { ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x + 14, y - 10, 8, 8); ctx.fillStyle = '#6a5040'; ctx.fillRect(x + 14, y - 10, 8, 2); }   // Blasebalg
      break; }
    case 'counter': case 'desk': case 'workbench_int': {  // Theke / Schreibpult / Werkbank
      shadow(x, y + 4, 15, .3);
      ctx.fillStyle = '#4e3a26'; ctx.fillRect(x - 15, y - 12, 30, 14);
      ctx.fillStyle = '#6e5238'; ctx.fillRect(x - 15, y - 16, 30, 5); ctx.fillStyle = '#2e2218'; ctx.fillRect(x - 15, y - 11, 30, 1.5);
      if (e.type === 'counter') { ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 10, y - 20, 4, 5); ctx.fillRect(x + 2, y - 20, 4, 5); ctx.fillStyle = '#c9bfa6'; ctx.fillRect(x - 10, y - 20, 4, 1); }
      if (e.type === 'desk') { ctx.fillStyle = '#d6ccb2'; ctx.fillRect(x - 10, y - 16, 8, 4); ctx.fillRect(x - 6, y - 15, 7, 3); ctx.fillStyle = '#e8c070'; ctx.fillRect(x + 8, y - 21, 2, 5); }
      if (e.type === 'workbench_int') { ctx.fillStyle = '#4a4843'; ctx.fillRect(x - 9, y - 18, 10, 2); ctx.fillRect(x + 4, y - 19, 2, 4); ctx.fillStyle = '#6a5a44'; ctx.fillRect(x - 3, y - 18, 3, 2); }
      break; }
    case 'cask_rack': {                                   // liegende Fässer auf einem Gestell
      shadow(x, y + 4, 15, .3);
      ctx.fillStyle = '#3a2c1c'; ctx.fillRect(x - 15, y - 4, 30, 5);
      for (const ox of [-8, 8]) { ctx.fillStyle = '#5b412a'; ctx.beginPath(); ctx.ellipse(x + ox, y - 11, 8, 8, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#6e5033'; ctx.beginPath(); ctx.ellipse(x + ox - 1, y - 12, 5, 5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#3a2a1c'; ctx.fillRect(x + ox - 1, y - 12, 2, 2); }
      break; }
    case 'weapon_rack': {                                 // Waffenständer: Speer, Schwert, Axt
      shadow(x, y + 3, 12, .25);
      ctx.fillStyle = '#3e2e1e'; ctx.fillRect(x - 12, y - 4, 24, 4); ctx.fillRect(x - 12, y - 22, 24, 3);
      ctx.fillStyle = '#8a8f98'; ctx.fillRect(x - 8, y - 30, 2, 28); ctx.fillRect(x - 9, y - 32, 4, 4);
      ctx.fillStyle = '#a8adb4'; ctx.fillRect(x - 1, y - 26, 3, 20); ctx.fillStyle = '#5a4430'; ctx.fillRect(x - 3, y - 8, 7, 2);
      ctx.fillStyle = '#5a4430'; ctx.fillRect(x + 7, y - 24, 2, 22); ctx.fillStyle = '#8a8f98'; ctx.fillRect(x + 8, y - 24, 6, 7);
      break; }
    case 'throne': {                                      // Thron unter dem Eis (Tiefhall): breite Stufe, gestufte Lehne, Armlehnen, Eiskristall
      shadow(x, y + 5, 24, .4);
      ctx.fillStyle = '#353b40'; ctx.fillRect(x - 24, y - 2, 48, 7); ctx.fillStyle = '#454c52'; ctx.fillRect(x - 24, y - 2, 48, 2);   // Stufe
      ctx.fillStyle = '#4f5960'; ctx.fillRect(x - 17, y - 40, 34, 28);                                                       // Lehne
      for (const [dx, h] of [[-17, 6], [-7, 10], [3, 10], [13, 6]]) ctx.fillRect(x + dx, y - 40 - h, 4 + (dx === -7 || dx === 3 ? 0 : 0), h);   // Zinnen
      ctx.fillStyle = '#5d6970'; ctx.fillRect(x - 7, y - 50, 14, 10);                                                        // Mittelstück
      ctx.fillStyle = '#434c52'; ctx.fillRect(x - 22, y - 20, 8, 18); ctx.fillRect(x + 14, y - 20, 8, 18);                  // Armlehnen
      ctx.fillStyle = '#5a656c'; ctx.fillRect(x - 22, y - 22, 8, 3); ctx.fillRect(x + 14, y - 22, 8, 3);
      ctx.fillStyle = '#39414a'; ctx.fillRect(x - 14, y - 12, 28, 10);                                                       // Sitz (Schatten)
      ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.moveTo(x, y - 36); ctx.lineTo(x + 5, y - 29); ctx.lineTo(x, y - 22); ctx.lineTo(x - 5, y - 29); ctx.fill();   // Eiskristall
      ctx.fillStyle = 'rgba(210,235,250,.5)'; ctx.fillRect(x - 17, y - 40, 10, 2); ctx.fillRect(x + 8, y - 26, 9, 2); ctx.fillRect(x - 22, y - 22, 8, 1);    // Reif
      ctx.fillStyle = 'rgba(150,210,245,.16)'; ctx.beginPath(); ctx.ellipse(x, y - 26, 26, 30, 0, 0, 7); ctx.fill();
      break; }
    case 'altar_small': {                                 // Altar mit Tuch des Ordens
      shadow(x, y + 4, 14, .3);
      ctx.fillStyle = '#8f8a7e'; ctx.fillRect(x - 13, y - 14, 26, 16); ctx.fillStyle = '#a7a194'; ctx.fillRect(x - 13, y - 16, 26, 3);
      ctx.fillStyle = '#d9d2c0'; ctx.fillRect(x - 6, y - 16, 12, 14); ctx.fillStyle = '#9b2e26'; ctx.fillRect(x - 1, y - 14, 2, 8); ctx.fillRect(x - 3, y - 12, 6, 2);
      ctx.fillStyle = '#e8c070'; ctx.fillRect(x - 11, y - 21, 2, 5); ctx.fillRect(x + 9, y - 21, 2, 5);
      break; }
    case 'well':
      shadow(x, y + 4, 13, .35);
      ctx.fillStyle = '#4a4741'; ctx.beginPath(); ctx.ellipse(x, y, 13, 8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#16181c'; ctx.beginPath(); ctx.ellipse(x, y - 1, 8, 4.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#3d2f1f'; ctx.fillRect(x - 11, y - 24, 3, 22); ctx.fillRect(x + 8, y - 24, 3, 22); ctx.fillRect(x - 13, y - 27, 26, 4);
      break;
    case 'sign': case 'board':
      shadow(x, y + 3, 7, .25);
      ctx.fillStyle = '#3d2f1f'; ctx.fillRect(x - 2, y - 14, 4, 16);
      ctx.fillStyle = '#5a462c'; ctx.fillRect(x - 12, y - 26, 24, 14);
      ctx.strokeStyle = '#2c2116'; ctx.strokeRect(x - 12.5, y - 26.5, 25, 15);
      ctx.fillStyle = 'rgba(30,24,16,.7)'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 8, y - 23 + i * 4, 16 - i * 3, 1.5);
      break;
    case 'cage': {                                        // Eiserne Kette (S11): Gitterkäfig auf Holzboden, Kette am Dach
      shadow(x, y + 4, 15, .35);
      ctx.fillStyle = '#3b2e22'; ctx.fillRect(x - 14, y - 2, 28, 5);
      ctx.fillStyle = '#2a2826'; ctx.fillRect(x - 14, y - 28, 28, 3);
      ctx.fillStyle = '#4a4744'; for (let i = 0; i < 6; i++) ctx.fillRect(x - 13 + i * 5, y - 26, 2, 25);
      ctx.fillStyle = '#6a6560'; for (let i = 0; i < 6; i++) ctx.fillRect(x - 13 + i * 5, y - 26, 1, 25);
      ctx.fillStyle = '#5a5652'; ctx.fillRect(x - 1, y - 34, 2, 6); ctx.fillRect(x - 3, y - 36, 6, 2);
      break; }
    case 'chain_post': {                                  // Pfahl mit Eisenring und herabhängender Kette
      shadow(x, y + 3, 6, .3);
      ctx.fillStyle = '#3d2f1f'; ctx.fillRect(x - 3, y - 26, 6, 29); ctx.fillStyle = '#4e3c28'; ctx.fillRect(x - 3, y - 26, 2, 29);
      ctx.fillStyle = '#5a5652'; ctx.fillRect(x - 5, y - 20, 10, 3);
      ctx.fillStyle = '#6e6a64'; for (let i = 0; i < 5; i++) ctx.fillRect(x + 3 + (i % 2), y - 17 + i * 3, 2, 2);
      break; }
    case 'anvil':
      shadow(x, y + 3, 11, .35);
      ctx.fillStyle = '#2f2c28'; ctx.fillRect(x - 9, y - 4, 18, 7);
      ctx.fillStyle = '#4b4741'; ctx.fillRect(x - 11, y - 12, 22, 6); ctx.fillRect(x - 5, y - 8, 10, 5);
      break;
    case 'stall':
      shadow(x, y + 5, 15, .3);
      ctx.fillStyle = '#4b3a25'; ctx.fillRect(x - 14, y - 6, 28, 9);
      if (e._shut) {                                      // geschlossen: Plane über der Theke, Markise eingerollt, keine Ware
        ctx.fillStyle = '#3d2f1f'; ctx.fillRect(x - 15, y - 16, 3, 14); ctx.fillRect(x + 12, y - 16, 3, 14);
        ctx.fillStyle = '#6a2f24'; ctx.fillRect(x - 17, y - 18, 34, 3);
        ctx.fillStyle = '#5c5343'; ctx.beginPath(); ctx.moveTo(x - 15, y - 7); ctx.lineTo(x - 12, y - 13); ctx.lineTo(x + 12, y - 13); ctx.lineTo(x + 15, y - 7); ctx.lineTo(x + 15, y + 2); ctx.lineTo(x - 15, y + 2); ctx.fill();
        ctx.fillStyle = '#4a4336'; ctx.fillRect(x - 15, y - 3, 30, 1.5); ctx.fillRect(x - 6, y - 13, 1.5, 15); ctx.fillRect(x + 5, y - 13, 1.5, 15);
        break;
      }
      ctx.fillStyle = '#7d3b2c'; ctx.fillRect(x - 17, y - 22, 34, 9);
      ctx.fillStyle = '#93503b'; for (let i = 0; i < 4; i++) ctx.fillRect(x - 17 + i * 9, y - 22, 4, 9);
      ctx.fillStyle = '#3d2f1f'; ctx.fillRect(x - 15, y - 14, 3, 12); ctx.fillRect(x + 12, y - 14, 3, 12);
      ctx.fillStyle = '#9c8452'; ctx.fillRect(x - 8, y - 10, 5, 4); ctx.fillRect(x + 1, y - 10, 5, 4);
      break;
    case 'campfire_static': case 'campfire': {
      const f = Math.sin(now / 90 + x) * 0.5 + 0.5;
      ctx.fillStyle = '#2b2620'; ctx.beginPath(); ctx.ellipse(x, y + 2, 12, 6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#3d2f1f'; ctx.fillRect(x - 9, y - 2, 18, 4); ctx.fillRect(x - 3, y - 6, 6, 10);
      ctx.fillStyle = `rgba(196,88,32,${.75 + f * .2})`;
      ctx.beginPath(); ctx.moveTo(x - 7, y - 2); ctx.quadraticCurveTo(x, y - 20 - f * 8, x + 7, y - 2); ctx.fill();
      ctx.fillStyle = `rgba(240,190,90,${.6 + f * .3})`;
      ctx.beginPath(); ctx.moveTo(x - 4, y - 2); ctx.quadraticCurveTo(x + 1, y - 13 - f * 5, x + 4, y - 2); ctx.fill();
      break; }
    case 'torch': {
      const f = Math.sin(now / 110 + x) * 0.5 + 0.5;
      ctx.fillStyle = '#3d2f1f'; ctx.fillRect(x - 2, y - 16, 4, 18);
      ctx.fillStyle = `rgba(230,150,60,${.7 + f * .3})`;
      ctx.beginPath(); ctx.arc(x, y - 19 - f * 2, 4.5, 0, 7); ctx.fill();
      break; }
    case 'gravestone': graveShape(x, y, e._var || 0, 0.8); break;
    case 'portcullis': {                                  // S12 Fallgitter im Tor der Eisenfeste: eiserne Stäbe, Querriegel
      ctx.fillStyle = '#1a1816'; ctx.fillRect(x - 16, y - 30, 32, 34);
      ctx.fillStyle = '#4a4640'; for (let i = -14; i <= 14; i += 5) ctx.fillRect(x + i, y - 30, 2.5, 34);
      for (const yy of [-24, -12, 0]) ctx.fillRect(x - 16, y + yy, 32, 2.5);
      ctx.fillStyle = '#6a665e'; for (let i = -14; i <= 14; i += 5) ctx.fillRect(x + i, y - 30, 1, 34); break; }
    // ---- Aurelheim (MP2 §35–§52): heller Stein, Säulen, Kuppeln, Gold, Glas ----
    case 'palace': {                                      // Regierungspalais: Freitreppe, Säulenfront, Kuppel, Banner
      const st = '#d8cfb8', sh = '#9a9280', dk = '#6a6458', gd = '#c8a050';
      shadow(x, y + 8, 110, .45);
      ctx.fillStyle = sh; ctx.fillRect(x - 100, y - 8, 200, 14); ctx.fillStyle = st; for (let k = 0; k < 4; k++) ctx.fillRect(x - 60 + k * 4, y - 8 + k * 3, 120 - k * 8, 3);   // Freitreppe
      ctx.fillStyle = st; ctx.fillRect(x - 96, y - 88, 192, 80); ctx.fillStyle = '#e8e0cc'; ctx.fillRect(x - 96, y - 88, 60, 80);
      ctx.fillStyle = dk; ctx.fillRect(x - 96, y - 92, 192, 6); ctx.fillStyle = gd; ctx.fillRect(x - 96, y - 94, 192, 2);
      for (let k = 0; k < 11; k++) { const cx2 = x - 80 + k * 16; ctx.fillStyle = '#f0e8d4'; ctx.fillRect(cx2 - 3, y - 84, 6, 74); ctx.fillStyle = sh; ctx.fillRect(cx2 + 2, y - 84, 1.5, 74); }
      for (let k = 0; k < 5; k++) { ctx.fillStyle = '#2a3440'; ctx.fillRect(x - 70 + k * 32, y - 60, 12, 22); ctx.fillStyle = 'rgba(140,190,220,.55)'; ctx.fillRect(x - 69 + k * 32, y - 59, 10, 8); }
      ctx.fillStyle = '#6a8098'; ctx.beginPath(); ctx.arc(x, y - 96, 40, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#8aa0b8'; ctx.beginPath(); ctx.arc(x - 12, y - 104, 18, Math.PI, 0); ctx.fill();   // Kuppel
      ctx.fillStyle = gd; ctx.fillRect(x - 2, y - 150, 4, 16); ctx.beginPath(); ctx.arc(x, y - 152, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a2016'; ctx.fillRect(x - 14, y - 40, 28, 32); ctx.fillStyle = gd; ctx.fillRect(x - 14, y - 42, 28, 3);
      for (const bx of [x - 88, x + 84]) { ctx.fillStyle = '#5a4a2a'; ctx.fillRect(bx, y - 130, 2, 44); ctx.fillStyle = '#c8a050'; ctx.fillRect(bx + 2, y - 128, 12, 18); ctx.fillStyle = '#8a2a22'; ctx.fillRect(bx + 2, y - 122, 12, 4); }
      break; }
    case 'markethall': {                                  // Große Markthalle: lange Halle, Bogenfenster, Glasdach
      shadow(x, y + 6, 100, .4); ctx.fillStyle = '#cfc6b0'; ctx.fillRect(x - 96, y - 60, 192, 66); ctx.fillStyle = '#e0d8c4'; ctx.fillRect(x - 96, y - 60, 50, 66);
      ctx.fillStyle = '#4a5058'; ctx.beginPath(); ctx.moveTo(x - 100, y - 60); ctx.lineTo(x, y - 96); ctx.lineTo(x + 100, y - 60); ctx.fill();
      ctx.fillStyle = 'rgba(150,200,230,.5)'; for (let k = 0; k < 9; k++) ctx.fillRect(x - 84 + k * 20, y - 78 + Math.abs(k - 4) * 3.5, 12, 10);
      for (let k = 0; k < 8; k++) { const ax = x - 84 + k * 24; ctx.fillStyle = '#2a2016'; ctx.fillRect(ax, y - 36, 14, 42); ctx.beginPath(); ctx.arc(ax + 7, y - 36, 7, Math.PI, 0); ctx.fill(); ctx.fillStyle = `rgba(232,170,80,${0.35 + 0.1 * (k % 3)})`; ctx.fillRect(ax + 2, y - 30, 10, 12); }
      ctx.fillStyle = '#c8a050'; ctx.fillRect(x - 96, y - 62, 192, 2); break; }
    case 'observatory': {                                 // Observatorium: Rundbau, Kuppel mit Spalt, Fernrohr
      shadow(x, y + 6, 60, .4); ctx.fillStyle = '#d4cbb4'; ctx.fillRect(x - 50, y - 50, 100, 56); ctx.fillStyle = '#e6dec8'; ctx.fillRect(x - 50, y - 50, 30, 56);
      ctx.fillStyle = '#5a6a7a'; ctx.beginPath(); ctx.arc(x, y - 50, 48, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#7a8a9a'; ctx.beginPath(); ctx.arc(x - 14, y - 60, 22, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#141820'; ctx.fillRect(x + 6, y - 96, 8, 46); ctx.save(); ctx.translate(x + 10, y - 80); ctx.rotate(-0.7); ctx.fillStyle = '#b08a44'; ctx.fillRect(-3, -30, 6, 34); ctx.restore();
      ctx.fillStyle = '#2a2016'; ctx.fillRect(x - 8, y - 24, 16, 30); break; }
    case 'bank': {                                        // Zentralbank: Tempelfront, Giebel mit Münze, schwere Tür
      shadow(x, y + 6, 60, .4); ctx.fillStyle = '#d8cfb8'; ctx.fillRect(x - 56, y - 52, 112, 58);
      ctx.fillStyle = '#c4bba4'; ctx.beginPath(); ctx.moveTo(x - 62, y - 52); ctx.lineTo(x, y - 80); ctx.lineTo(x + 62, y - 52); ctx.fill();
      ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(x, y - 62, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#8a6a30'; ctx.fillRect(x - 1, y - 66, 2, 8);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = '#f0e8d4'; ctx.fillRect(x - 48 + k * 19, y - 50, 6, 52); }
      ctx.fillStyle = '#3a3026'; ctx.fillRect(x - 10, y - 30, 20, 36); ctx.fillStyle = '#c8a050'; ctx.fillRect(x - 1, y - 16, 2, 4); break; }
    case 'astroclock': {                                  // Astronomische Uhr: Turm, Zifferblatt mit Tierkreis, Zeiger drehen
      shadow(x, y + 4, 22, .4); ctx.fillStyle = '#d4cbb4'; ctx.fillRect(x - 16, y - 100, 32, 104); ctx.fillStyle = '#e6dec8'; ctx.fillRect(x - 16, y - 100, 10, 104);
      ctx.fillStyle = '#4a5058'; ctx.beginPath(); ctx.moveTo(x - 20, y - 100); ctx.lineTo(x, y - 128); ctx.lineTo(x + 20, y - 100); ctx.fill();
      ctx.fillStyle = '#1a2440'; ctx.beginPath(); ctx.arc(x, y - 70, 13, 0, 7); ctx.fill(); ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#e8d8a0'; for (let k = 0; k < 12; k++) { const a = k * 0.5236; ctx.fillRect(x + Math.cos(a) * 10 - 0.8, y - 70 + Math.sin(a) * 10 - 0.8, 1.6, 1.6); }
      const a1 = now / 6000 * 6.283; ctx.strokeStyle = '#e8d8a0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - 70); ctx.lineTo(x + Math.cos(a1) * 9, y - 70 + Math.sin(a1) * 9); ctx.stroke();
      ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(x, y - 44, 6, 0, 7); ctx.fill(); break; }
    case 'magitower': {                                   // Magitech-Turm: schlanker Turm, Messingringe, pulsierender Kristall
      shadow(x, y + 4, 16, .4); ctx.fillStyle = '#c4bba4'; ctx.fillRect(x - 9, y - 90, 18, 94); ctx.fillStyle = '#d8cfb8'; ctx.fillRect(x - 9, y - 90, 6, 94);
      ctx.fillStyle = '#b08a44'; for (const yy of [-30, -55, -80]) ctx.fillRect(x - 12, y + yy, 24, 3);
      const pl = 0.5 + 0.5 * Math.sin(now / 1500 * 6.283); ctx.fillStyle = `rgba(120,200,255,${0.25 * pl})`; ctx.beginPath(); ctx.arc(x, y - 104, 16, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(150,220,255,${0.7 + 0.3 * pl})`; ctx.beginPath(); ctx.moveTo(x, y - 116); ctx.lineTo(x + 7, y - 104); ctx.lineTo(x, y - 92); ctx.lineTo(x - 7, y - 104); ctx.fill(); break; }
    case 'crane': {                                       // Lastkran: Holzgerüst, Ausleger, Seil, Last
      shadow(x, y + 4, 18, .35); ctx.fillStyle = '#5a4630'; ctx.fillRect(x - 10, y - 4, 20, 6); ctx.fillRect(x - 2, y - 90, 5, 88);
      ctx.fillRect(x - 2, y - 90, 54, 4); ctx.strokeStyle = '#3a2c1c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 1, y - 60); ctx.lineTo(x + 40, y - 88); ctx.moveTo(x + 44, y - 86); ctx.lineTo(x + 44, y - 40); ctx.stroke();
      ctx.fillStyle = '#6a6460'; ctx.fillRect(x + 38, y - 40, 12, 10); ctx.fillStyle = '#8a6a34'; ctx.beginPath(); ctx.arc(x, y - 30, 7, 0, 7); ctx.fill(); break; }
    case 'fountain': {                                    // Brunnen: Becken, Säule, Wasserschleier
      const r = e.r > 16 ? 26 : 18; shadow(x, y + 4, r + 6, .35);
      ctx.fillStyle = '#c4bba4'; ctx.beginPath(); ctx.ellipse(x, y - 4, r, r * 0.45, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#4a7a9a'; ctx.beginPath(); ctx.ellipse(x, y - 5, r - 4, r * 0.45 - 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#d8cfb8'; ctx.fillRect(x - 3, y - 30, 6, 26); ctx.beginPath(); ctx.ellipse(x, y - 30, 9, 3, 0, 0, 7); ctx.fill();
      const f = now / 900 * 6.283; ctx.fillStyle = 'rgba(180,220,240,.55)'; for (let k = 0; k < 6; k++) { const a = k * 1.047 + f * 0.1; ctx.fillRect(x + Math.cos(a) * 7, y - 30 + Math.abs(Math.sin(f + k)) * 18, 1.5, 3); }
      ctx.fillStyle = 'rgba(210,235,250,.35)'; ctx.fillRect(x - 1, y - 40, 2, 10); break; }
    case 'column': {                                      // Säule der Arkaden
      shadow(x, y + 3, 6, .3); ctx.fillStyle = '#e8e0cc'; ctx.fillRect(x - 4, y - 44, 8, 46); ctx.fillStyle = '#b8b09c'; ctx.fillRect(x + 2, y - 44, 2, 46);
      ctx.fillStyle = '#d4cbb4'; ctx.fillRect(x - 6, y - 48, 12, 4); ctx.fillRect(x - 6, y, 12, 3); break; }
    case 'aqueduct': {                                    // Aquäduktbogen: zwei Pfeiler, Bogen, Rinne mit Wasser
      shadow(x, y + 3, 16, .3); ctx.fillStyle = '#c4bba4'; ctx.fillRect(x - 16, y - 52, 32, 10); ctx.fillRect(x - 16, y - 44, 7, 46); ctx.fillRect(x + 9, y - 44, 7, 46);
      ctx.fillStyle = '#9a9280'; ctx.beginPath(); ctx.arc(x, y - 30, 9, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#2a261e'; ctx.beginPath(); ctx.arc(x, y - 28, 8, Math.PI, 0); ctx.fill(); ctx.fillRect(x - 8, y - 28, 16, 30);
      ctx.fillStyle = '#5a8aa8'; ctx.fillRect(x - 16, y - 54, 32, 3); break; }
    case 'telecircle': {                                  // S12 E: Teleportkreis zur Himmelsinsel — Messingring, Glyphen, Licht
      const t = now / 1000; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y, 20, 9, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#b08a44'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x, y, 18, 8, 0, 0, 7); ctx.stroke();
      ctx.strokeStyle = `rgba(150,200,255,${0.45 + 0.25 * Math.sin(t * 3)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, 13, 5.5, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = '#e8d8a0'; for (let k = 0; k < 8; k++) { const a = t * 0.6 + k * 0.785; ctx.fillRect(x + Math.cos(a) * 18 - 1, y + Math.sin(a) * 8 - 1, 2, 2); }
      ctx.fillStyle = `rgba(160,210,255,${0.18 + 0.1 * Math.sin(t * 2)})`; ctx.fillRect(x - 10, y - 40, 20, 40); break; }
    case 'chimney': {                                     // S12 E: Ziegelschornstein mit Rauch
      shadow(x, y + 3, 7, .3);
      ctx.fillStyle = '#4a2e24'; ctx.fillRect(x - 5, y - 44, 10, 46); ctx.fillStyle = '#6a4232'; ctx.fillRect(x - 5, y - 44, 3, 46);
      ctx.fillStyle = '#2a1a14'; for (let k = 0; k < 8; k++) ctx.fillRect(x - 5 + (k % 2) * 5, y - 40 + k * 5, 5, 1);
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(x - 6, y - 47, 12, 4);
      for (let k = 0; k < 3; k++) { const t = ((now / 1130) + k / 3) % 1; ctx.fillStyle = `rgba(90,86,80,${0.45 * (1 - t)})`; ctx.beginPath(); ctx.arc(x + t * 8, y - 50 - t * 22, 3 + t * 5, 0, 7); ctx.fill(); }
      break; }
    case 'big_gear': {                                    // S12 E: großes Messingrad am Tor, dreht langsam
      shadow(x, y + 4, 12, .3); const a0 = (now / 3000) * 1.05;
      ctx.fillStyle = '#3a3026'; ctx.fillRect(x - 2, y - 14, 4, 18);
      ctx.fillStyle = '#8a6a34'; ctx.beginPath(); ctx.arc(x, y - 22, 13, 0, 7); ctx.fill();
      for (let k = 0; k < 10; k++) { const a = a0 + k * 0.628; ctx.fillRect(x + Math.cos(a) * 14 - 2, y - 22 + Math.sin(a) * 14 - 2, 4, 4); }
      ctx.fillStyle = '#b08a44'; ctx.beginPath(); ctx.arc(x - 3, y - 25, 6, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.arc(x, y - 22, 4, 0, 7); ctx.fill();
      for (let k = 0; k < 4; k++) { const a = a0 + k * 1.57; ctx.fillRect(x + Math.cos(a) * 8 - 1, y - 22 + Math.sin(a) * 8 - 1, 2, 2); } break; }
    case 'factory': {                                     // S12 E: Fabrikhalle von Tickmar — Sägezahndach, Schornsteine, glühende Fenster
      shadow(x, y + 6, 70, .45);
      ctx.fillStyle = '#3a2e28'; ctx.fillRect(x - 64, y - 60, 128, 64); ctx.fillStyle = '#4e3c32'; ctx.fillRect(x - 64, y - 60, 30, 64);
      ctx.fillStyle = '#26201c'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 64 + k * 32, y - 60); ctx.lineTo(x - 64 + k * 32 + 32, y - 60); ctx.lineTo(x - 64 + k * 32 + 32, y - 80); ctx.fill(); }
      ctx.fillStyle = '#6a7478'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 62 + k * 32 + 20, y - 78, 10, 16);
      for (let k = 0; k < 5; k++) { ctx.fillStyle = '#1a1412'; ctx.fillRect(x - 56 + k * 24, y - 44, 12, 16); ctx.fillStyle = `rgba(232,150,60,${0.55 + 0.25 * Math.sin(now / 180 + k)})`; ctx.fillRect(x - 55 + k * 24, y - 43, 10, 14); }
      ctx.fillStyle = '#1a1412'; ctx.fillRect(x - 10, y - 22, 20, 26); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 10, y - 22, 20, 3);
      for (const cx2 of [x - 46, x + 40]) { ctx.fillStyle = '#4a2e24'; ctx.fillRect(cx2, y - 108, 10, 48); ctx.fillStyle = '#6a4232'; ctx.fillRect(cx2, y - 108, 3, 48);
        for (let k = 0; k < 3; k++) { const t = ((now / 1130) + k / 3) % 1; ctx.fillStyle = `rgba(70,66,62,${0.5 * (1 - t)})`; ctx.beginPath(); ctx.arc(cx2 + 5 + t * 12, y - 112 - t * 26, 5 + t * 8, 0, 7); ctx.fill(); } }
      ctx.fillStyle = '#8a6a34'; ctx.beginPath(); ctx.arc(x + 20, y - 50, 9, 0, 7); ctx.fill(); ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.arc(x + 20, y - 50, 3, 0, 7); ctx.fill(); break; }
    case 'machine': {                                     // S12 E: Dampfhammer
      shadow(x, y + 3, 10, .35); ctx.fillStyle = '#3a3634'; ctx.fillRect(x - 8, y - 6, 16, 9); ctx.fillStyle = '#5a5450'; ctx.fillRect(x - 6, y - 26, 3, 20); ctx.fillRect(x + 3, y - 26, 3, 20);
      const hy = y - 22 + Math.abs(Math.sin(now / 300)) * 12; ctx.fillStyle = '#7a6a50'; ctx.fillRect(x - 5, hy, 10, 6); ctx.fillStyle = '#8a6a34'; ctx.fillRect(x - 7, y - 28, 14, 3); break; }
    case 'workstation': case 'workbench': {               // S12 E: Werkbank mit Schraubstock und Teilen
      shadow(x, y + 3, 11, .3); ctx.fillStyle = '#4a3624'; ctx.fillRect(x - 11, y - 12, 22, 4); ctx.fillStyle = '#3a2a1c'; ctx.fillRect(x - 10, y - 8, 3, 10); ctx.fillRect(x + 7, y - 8, 3, 10);
      ctx.fillStyle = '#6a6460'; ctx.fillRect(x - 8, y - 17, 6, 5); ctx.fillStyle = '#8a6a34'; ctx.beginPath(); ctx.arc(x + 4, y - 15, 3, 0, 7); ctx.fill();
      if (e.type === 'workbench') { ctx.fillStyle = '#9a8a6a'; ctx.fillRect(x - 1, y - 16, 7, 2); ctx.fillRect(x + 5, y - 18, 2, 5); } break; }
    case 'keychest': {                                    // S12 E: Schlüsselkasten des Vogts
      shadow(x, y + 3, 7, .3); ctx.fillStyle = '#3a2c20'; ctx.fillRect(x - 6, y - 12, 12, 13); ctx.fillStyle = '#6a5a3a'; ctx.fillRect(x - 6, y - 12, 12, 2);
      ctx.fillStyle = '#c8a050'; ctx.fillRect(x - 1, y - 8, 2, 3); break; }
    case 'gearpile': {                                    // S12 Zahnräder, Federn, Wellen — Werkstatt des Hochreichs
      shadow(x, y + 3, 10, .3);
      for (const [dx, dy, r, col] of [[-4, -2, 6, '#8a7040'], [4, -4, 5, '#6a6258'], [0, -8, 4, '#a08850']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, 7); ctx.fill();
        ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.arc(x + dx, y + dy, r * 0.35, 0, 7); ctx.fill(); ctx.fillStyle = col; for (let k = 0; k < 8; k++) { const a = k * 0.785; ctx.fillRect(x + dx + Math.cos(a) * r - 1, y + dy + Math.sin(a) * r - 1, 2.5, 2.5); } }
      ctx.strokeStyle = '#c8b890'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 10; k++) ctx.lineTo(x + 6 + (k % 2) * 3, y - 2 - k); ctx.stroke(); break; }
    case 'automat_frame': {                               // ruhender Automat: Messingrumpf, Maskenkopf, Kolbengelenke
      shadow(x, y + 4, 9, .35);
      ctx.fillStyle = '#4a4640'; ctx.fillRect(x - 5, y - 4, 3, 8); ctx.fillRect(x + 2, y - 4, 3, 8);                          // Beine
      ctx.fillStyle = '#7a6038'; ctx.fillRect(x - 7, y - 20, 14, 16); ctx.fillStyle = '#9a7c48'; ctx.fillRect(x - 7, y - 20, 4, 16);   // Rumpf, Licht links
      ctx.fillStyle = '#5a4a34'; ctx.fillRect(x - 10, y - 18, 3, 12); ctx.fillRect(x + 7, y - 18, 3, 12);                      // Arme
      ctx.fillStyle = '#8a7a58'; ctx.fillRect(x - 4, y - 28, 8, 8); ctx.fillStyle = '#1a1614'; ctx.fillRect(x - 3, y - 25, 6, 1.5);   // Kopf, Sehschlitz
      ctx.fillStyle = e.label && e.label.includes('Zerstört') ? '#3a2a1a' : '#e8a040'; ctx.fillRect(x - 2, y - 25, 1.5, 1.5); ctx.fillRect(x + 1, y - 25, 1.5, 1.5);
      ctx.fillStyle = '#2a2420'; ctx.fillRect(x - 1, y - 16, 2, 8); break; }
    case 'statue': {                                      // Standbild auf Sockel: Adelsherr mit Mantel
      shadow(x, y + 4, 11, .35);
      ctx.fillStyle = '#6a665e'; ctx.fillRect(x - 8, y - 4, 16, 8); ctx.fillStyle = '#8a857a'; ctx.fillRect(x - 8, y - 4, 16, 2);
      ctx.fillStyle = '#9a958a'; ctx.beginPath(); ctx.moveTo(x - 5, y - 4); ctx.lineTo(x - 3, y - 26); ctx.lineTo(x + 3, y - 26); ctx.lineTo(x + 6, y - 4); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - 29, 3.5, 0, 7); ctx.fill(); ctx.fillStyle = '#6a665e'; ctx.fillRect(x + 1, y - 24, 4, 20); ctx.fillStyle = '#7a8a6a'; ctx.fillRect(x - 3, y - 20, 2, 3); break; }
    case 'hedge': {                                       // geschnittene Hecke im Adelsgarten
      shadow(x, y + 3, 10, .3);
      ctx.fillStyle = '#1e3018'; ctx.fillRect(x - 10, y - 12, 20, 14); ctx.fillStyle = '#2e4a22'; ctx.fillRect(x - 10, y - 12, 20, 5); ctx.fillStyle = '#3e5e2c'; ctx.fillRect(x - 10, y - 12, 7, 3);
      ctx.fillStyle = '#9a4a5a'; ctx.fillRect(x - 4, y - 9, 2, 2); ctx.fillRect(x + 5, y - 6, 2, 2); break; }
    case 'shrine':
      shadow(x, y + 4, 14, .3);
      ctx.fillStyle = '#54504a'; ctx.fillRect(x - 12, y - 6, 24, 9);
      ctx.fillStyle = '#635e56'; ctx.fillRect(x - 8, y - 28, 16, 23);
      ctx.fillStyle = 'rgba(214,198,150,.55)'; ctx.beginPath(); ctx.arc(x, y - 20, 5, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(230,214,160,.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y - 20, 9 + Math.sin(now / 600) * 1.5, 0, 7); ctx.stroke();
      break;
    case 'broken_pillar': {                               // Säule: Sockel, kannelierter Schaft; ganz (intact) mit Kapitell, sonst Bruchkante
      const H = e.intact ? 46 : 16 + (e._var || 0) * 6;
      shadow(x, y + 4, 12, .35);
      ctx.fillStyle = '#4a4741'; ctx.fillRect(x - 11, y - 4, 22, 7);                           // Sockel
      ctx.fillStyle = '#5c5850'; ctx.fillRect(x - 11, y - 4, 22, 2);
      ctx.fillStyle = '#6a665d'; ctx.fillRect(x - 7, y - H, 14, H - 3);                        // Schaft
      ctx.fillStyle = 'rgba(0,0,0,.28)'; for (const k of [-4, 0, 4]) ctx.fillRect(x + k - 0.5, y - H + 2, 1, H - 6);   // Kanneluren
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x - 7, y - H, 3, H - 3);
      if (e.intact) { ctx.fillStyle = '#5c5850'; ctx.fillRect(x - 10, y - H - 5, 20, 6); ctx.fillStyle = '#6f6b62'; ctx.fillRect(x - 10, y - H - 5, 20, 2); }
      else { ctx.fillStyle = '#2a2824'; ctx.beginPath(); ctx.moveTo(x - 7, y - H); ctx.lineTo(x - 3, y - H - 4); ctx.lineTo(x + 1, y - H + 1); ctx.lineTo(x + 4, y - H - 3); ctx.lineTo(x + 7, y - H); ctx.lineTo(x + 7, y - H + 2); ctx.lineTo(x - 7, y - H + 2); ctx.fill();
        ctx.fillStyle = '#5c5850'; ctx.fillRect(x + 9, y, 5, 3); ctx.fillRect(x - 14, y + 1, 4, 2); }   // Bruchstücke am Fuß
      break; }
    case 'crypt': case 'marsh_ruin':
      shadow(x, y + 4, 14, .35);
      ctx.fillStyle = '#3f3b35'; ctx.fillRect(x - 14, y - 22, 28, 26);
      ctx.fillStyle = '#16140f'; ctx.fillRect(x - 5, y - 12, 10, 16);
      ctx.fillStyle = 'rgba(78,143,122,.25)'; ctx.fillRect(x - 5, y - 12, 10, 16);
      break;
    case 'rubble':
      ctx.fillStyle = '#3c3833'; ctx.fillRect(x - 8, y - 3, 8, 5); ctx.fillRect(x + 1, y - 6, 6, 8);
      break;
    case 'palisade_prop': {                               // Palisade: angespitzte Stämme, geschnürt, Schattenseite rechts
      shadow(x, y + 4, 16, .3);
      for (let i = 0; i < 4; i++) {
        const sx = x - 15 + i * 8, h = 30 + ((i * 7 + (x | 0)) % 5);
        ctx.fillStyle = '#4a3a26'; ctx.fillRect(sx, y - h + 6, 7, h - 2);
        ctx.fillStyle = '#5e4a30'; ctx.fillRect(sx, y - h + 6, 2, h - 2);
        ctx.fillStyle = '#33271a'; ctx.fillRect(sx + 5, y - h + 6, 2, h - 2);
        ctx.fillStyle = '#4a3a26'; ctx.beginPath(); ctx.moveTo(sx, y - h + 6); ctx.lineTo(sx + 3.5, y - h - 1); ctx.lineTo(sx + 7, y - h + 6); ctx.fill();
      }
      ctx.fillStyle = '#2a2016'; ctx.fillRect(x - 16, y - 18, 32, 2); ctx.fillRect(x - 16, y - 7, 32, 2);   // Querbinder
      break; }
    case 'fence': case 'fallen_tree':
      shadow(x, y + 3, 11, .25);
      ctx.fillStyle = '#43331f';
      if (e.type === 'fallen_tree') { ctx.fillRect(x - 16, y - 5, 32, 9); ctx.fillStyle = '#5b452a'; ctx.fillRect(x - 16, y - 5, 32, 3); }
      else { for (let i = -1; i <= 1; i++) ctx.fillRect(x + i * 9 - 2, y - 16, 5, 20); ctx.fillStyle = '#5b452a'; ctx.fillRect(x - 14, y - 11, 28, 3); }
      break;
    case 'tent_prop':
      shadow(x, y + 5, 15, .3);
      ctx.fillStyle = '#4a3f2c'; ctx.beginPath(); ctx.moveTo(x - 16, y + 4); ctx.lineTo(x, y - 20); ctx.lineTo(x + 16, y + 4); ctx.fill();
      ctx.fillStyle = '#231d14'; ctx.beginPath(); ctx.moveTo(x - 5, y + 4); ctx.lineTo(x, y - 9); ctx.lineTo(x + 5, y + 4); ctx.fill();
      break;
    case 'mine_entrance': case 'mine_exit':
      shadow(x, y + 5, 20, .4);
      ctx.fillStyle = '#3a3733'; ctx.fillRect(x - 20, y - 26, 40, 30);
      ctx.fillStyle = '#0a0908'; ctx.beginPath(); ctx.moveTo(x - 13, y + 4); ctx.lineTo(x - 13, y - 12); ctx.quadraticCurveTo(x, y - 26, x + 13, y - 12); ctx.lineTo(x + 13, y + 4); ctx.fill();
      ctx.fillStyle = '#4b3a25'; ctx.fillRect(x - 16, y - 14, 4, 18); ctx.fillRect(x + 12, y - 14, 4, 18); ctx.fillRect(x - 18, y - 18, 36, 5);
      break;
    case 'cart':
      shadow(x, y + 4, 14, .3);
      ctx.fillStyle = '#4b3a25'; ctx.fillRect(x - 14, y - 10, 28, 12);
      ctx.fillStyle = '#2b2116'; ctx.beginPath(); ctx.arc(x - 8, y + 3, 5, 0, 7); ctx.arc(x + 8, y + 3, 5, 0, 7); ctx.fill();
      break;
    case 'banner_torn': {
      const s = Math.sin(now / 800 + x) * 2;
      ctx.fillStyle = '#2a2018'; ctx.fillRect(x - 2, y - 40, 3, 42); ctx.fillStyle = '#4a4640'; ctx.fillRect(x - 3, y - 43, 5, 3);   // Referenz 4: Stange mit Eisenknauf
      ctx.fillStyle = '#2a1a14'; ctx.fillRect(x - 1, y - 38, 18, 2);                                                                        // Querstange
      ctx.fillStyle = '#5a1618'; ctx.beginPath(); ctx.moveTo(x + 1, y - 37); ctx.lineTo(x + 16 + s * 0.5, y - 37); ctx.lineTo(x + 16 + s, y - 14);
      ctx.lineTo(x + 13 + s, y - 17); ctx.lineTo(x + 10 + s, y - 12); ctx.lineTo(x + 7 + s, y - 16); ctx.lineTo(x + 4 + s * 0.5, y - 13); ctx.lineTo(x + 1, y - 16); ctx.fill();   // zerrissener Saum
      ctx.fillStyle = '#7a2224'; ctx.fillRect(x + 1, y - 37, 3, 21);                                                                         // Licht links
      ctx.fillStyle = '#3a0e10'; ctx.fillRect(x + 12 + s * 0.5, y - 36, 3, 20);                                                              // Faltenschatten
      ctx.fillStyle = '#a0843a'; ctx.beginPath(); ctx.moveTo(x + 5 + s * 0.3, y - 31); ctx.lineTo(x + 8.5 + s * 0.4, y - 26); ctx.lineTo(x + 12 + s * 0.5, y - 31); ctx.lineTo(x + 12 + s * 0.5, y - 28); ctx.lineTo(x + 8.5 + s * 0.4, y - 23); ctx.lineTo(x + 5 + s * 0.3, y - 28); ctx.fill();   // Wappen (Winkel)
      break; }
    case 'claim_stone':
      shadow(x, y + 3, 10, .3);
      ctx.fillStyle = '#56514a'; ctx.fillRect(x - 8, y - 18, 16, 20);
      ctx.fillStyle = 'rgba(189,148,51,.5)'; ctx.fillRect(x - 4, y - 13, 8, 2); ctx.fillRect(x - 4, y - 9, 8, 2);
      break;
    case 'scarecrow':
      shadow(x, y + 3, 8, .25);
      ctx.fillStyle = '#3d2f1f'; ctx.fillRect(x - 1, y - 26, 3, 28); ctx.fillRect(x - 11, y - 20, 23, 3);
      ctx.fillStyle = '#6b5a35'; ctx.beginPath(); ctx.arc(x, y - 29, 5, 0, 7); ctx.fill();
      break;
    case 'camp_ruin':
      ctx.fillStyle = '#2f2820'; ctx.beginPath(); ctx.ellipse(x, y, 14, 7, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#463a28'; ctx.fillRect(x - 10, y - 3, 20, 3);
      break;
    case 'spikes':
      ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.ellipse(x, y, 13, 7, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#7d7466';
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 5 - 2, y + 3); ctx.lineTo(x + i * 5, y - 8); ctx.lineTo(x + i * 5 + 2, y + 3); ctx.fill(); }
      break;
    case 'dead_tree': {                                   // kahler Baum: Wüste und Blight — drei Wuchsformen in Baumgröße (Session 5)
      const v = e._v ?? h2(x | 0, (y | 0) + 7), k = v < 0.34 ? 0 : v < 0.67 ? 1 : 2, tall = 0.85 + h2((x | 0) + 3, y | 0) * 0.4;
      shadow(x, y + 5, 12, .32);
      const limb = (w, c, pts) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x + pts[0], y + pts[1] * tall);
        for (let i = 2; i < pts.length; i += 2) ctx.lineTo(x + pts[i], y + pts[i + 1] * tall); ctx.stroke(); };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const D = '#2e241a', M = '#43362a', L = '#5a4a38';
      if (k === 0) {                                      // Galgenbaum: gerader Stamm, ein weiter Ast zur Seite
        limb(6, D, [0, 5, -1, -22, 1, -38]); limb(3, D, [0, -24, 12, -30, 18, -28]); limb(2, D, [-1, -16, -10, -24, -14, -34]); limb(2, D, [1, -34, 6, -44]);
        limb(2, L, [-2, 2, -3, -20]); limb(1, M, [18, -28, 19, -22]);
      } else if (k === 1) {                               // Gabelbaum: zwei Stämme, verdreht
        limb(6, D, [0, 5, 0, -14]); limb(4, D, [0, -14, -8, -30, -10, -42]); limb(4, D, [0, -14, 7, -28, 12, -38]);
        limb(2, D, [-8, -30, -16, -34]); limb(2, D, [7, -28, 14, -26]); limb(2, D, [12, -38, 16, -44]); limb(2, L, [-2, 2, -2, -12]);
      } else {                                            // Krüppel: gebeugt, abgebrochene Krone
        limb(7, D, [0, 5, 3, -12, 8, -24]); limb(3, D, [3, -12, -8, -18, -13, -16]); limb(3, D, [8, -24, 4, -32]); limb(2, D, [8, -24, 14, -27]);
        limb(2, L, [-2, 3, 1, -10]); ctx.fillStyle = M; ctx.fillRect(x + 6, y - 26 * tall, 5, 3);
      }
      ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
      if (regionOfProp(e) === 'blight' && v > 0.8) { ctx.fillStyle = '#cfc8b4'; ctx.fillRect(x + 9, y - 30 * tall, 2, 5); ctx.fillRect(x + 8, y - 25 * tall, 4, 2); }   // im Totenreich: aufgehängte Knochen
      break; }
    case 'bone_spire': {                                  // Knochenturm der Untoten
      shadow(x, y + 4, 10, .35);
      const g = Math.sin(now / 500 + x) * 0.5 + 0.5;
      ctx.fillStyle = '#cfc8b4';
      ctx.beginPath(); ctx.moveTo(x - 7, y + 4); ctx.lineTo(x - 3, y - 30); ctx.lineTo(x, y - 34); ctx.lineTo(x + 3, y - 30); ctx.lineTo(x + 7, y + 4); ctx.fill();
      ctx.fillStyle = '#a79f8b'; for (let i = 0; i < 4; i++) ctx.fillRect(x - 5 + i, y - 6 - i * 7, 10 - i * 2, 2);
      ctx.fillStyle = `rgba(78,143,122,${.3 + g * .4})`; ctx.beginPath(); ctx.arc(x, y - 33, 3, 0, 7); ctx.fill();
      break; }
    case 'obelisk': {                                     // nekromantischer Obelisk
      shadow(x, y + 4, 12, .4);
      ctx.fillStyle = '#20262a'; ctx.beginPath(); ctx.moveTo(x - 7, y + 4); ctx.lineTo(x - 5, y - 34); ctx.lineTo(x, y - 40); ctx.lineTo(x + 5, y - 34); ctx.lineTo(x + 7, y + 4); ctx.fill();
      ctx.strokeStyle = `rgba(78,143,122,${.4 + .3 * Math.sin(now / 300)})`; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x, y - 8); ctx.moveTo(x - 3, y - 22); ctx.lineTo(x + 3, y - 22); ctx.stroke();
      break; }
    case 'watchtower_ruin':                               // verfallener Wachturm
      shadow(x, y + 5, 13, .4);
      ctx.fillStyle = '#3a3733'; ctx.fillRect(x - 9, y - 30, 18, 34);
      ctx.fillStyle = '#2b2824'; ctx.fillRect(x - 9, y - 30, 18, 4);
      ctx.fillStyle = '#16140f'; ctx.fillRect(x - 4, y - 14, 8, 12);
      ctx.fillStyle = '#4a463f'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 9 + i * 7, y - 34, 4, 5);
      break;
    case 'tower_ruin': {                                  // Landmarke: hoher, oben abgebrochener Wachturm
      shadow(x + 8, y + 6, 34, .45);
      ctx.fillStyle = '#3d3a35'; ctx.fillRect(x - 24, y - 96, 48, 100);
      ctx.fillStyle = '#4a4640'; ctx.fillRect(x - 24, y - 96, 16, 100);                      // Lichtseite
      ctx.fillStyle = '#2e2b27'; ctx.fillRect(x + 12, y - 96, 12, 100);                      // Schattenseite
      ctx.fillStyle = '#26231f';                                                            // Mauerfugen
      for (let r = 0; r < 12; r++) for (let c = 0; c < 4; c++) ctx.fillRect(x - 24 + c * 12 + (r & 1) * 6, y - 92 + r * 8, 1.5, 7);
      for (let r = 0; r < 12; r++) ctx.fillRect(x - 24, y - 90 + r * 8, 48, 1.2);
      ctx.fillStyle = '#070706'; ctx.fillRect(x - 5, y - 70, 8, 16); ctx.fillRect(x - 8, y - 18, 16, 22);   // Schießscharte, Tor
      ctx.beginPath(); ctx.arc(x, y - 18, 8, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#3d3a35';                                                            // gezackter Abbruch oben
      ctx.beginPath(); ctx.moveTo(x - 24, y - 96); ctx.lineTo(x - 18, y - 110); ctx.lineTo(x - 12, y - 100); ctx.lineTo(x - 4, y - 116);
      ctx.lineTo(x + 4, y - 104); ctx.lineTo(x + 12, y - 108); ctx.lineTo(x + 24, y - 96); ctx.fill();
      ctx.fillStyle = '#4a4640'; ctx.fillRect(x - 18, y - 110, 6, 14);
      ctx.fillStyle = '#34402a'; ctx.fillRect(x + 10, y - 60, 14, 6); ctx.fillRect(x + 16, y - 54, 8, 12); ctx.fillRect(x - 24, y - 30, 8, 10);   // Efeu
      ctx.fillStyle = '#44403a'; ctx.fillRect(x + 20, y - 4, 14, 8); ctx.fillRect(x - 34, y - 2, 10, 6);        // herabgefallene Steine
      break; }
    case 'mushrooms':                                     // Pilzgruppe (Hexenring im Wald)
      for (const [dx, dy, h, c] of [[-5, 0, 6, '#a0402e'], [1, -2, 8, '#c9bfa6'], [6, 1, 5, '#a0402e']]) {
        ctx.fillStyle = '#d6cdb4'; ctx.fillRect(x + dx - 1, y + dy - h, 3, h);
        ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + dx + 0.5, y + dy - h, 5, 3, 0, Math.PI, 0); ctx.fill();
        if (c !== '#c9bfa6') { ctx.fillStyle = '#efe6d0'; ctx.fillRect(x + dx - 2, y + dy - h - 2, 2, 1.5); }
      }
      break;
    case 'standing_stone':                                // Menhir mit Moos und eingeritztem Zeichen
      shadow(x, y + 4, 10, .38);
      ctx.fillStyle = '#4e4b45'; ctx.beginPath(); ctx.moveTo(x - 8, y + 4); ctx.lineTo(x - 7, y - 30); ctx.lineTo(x - 1, y - 38); ctx.lineTo(x + 6, y - 32); ctx.lineTo(x + 8, y + 4); ctx.fill();
      ctx.fillStyle = '#5e5a53'; ctx.beginPath(); ctx.moveTo(x - 8, y + 4); ctx.lineTo(x - 7, y - 30); ctx.lineTo(x - 1, y - 38); ctx.lineTo(x - 3, y + 4); ctx.fill();
      ctx.fillStyle = '#34402a'; ctx.fillRect(x - 8, y - 6, 6, 8); ctx.fillRect(x + 3, y - 2, 5, 5);
      ctx.fillStyle = '#23201c'; ctx.fillRect(x - 1, y - 24, 2, 10); ctx.fillRect(x - 4, y - 20, 8, 2);
      break;
    case 'wayshrine':                                     // Wegschrein: Steinstele mit Sonnenzeichen
      shadow(x, y + 4, 9, .35);
      ctx.fillStyle = '#56524a'; ctx.fillRect(x - 6, y - 26, 12, 30); ctx.fillRect(x - 8, y - 2, 16, 6);
      ctx.fillStyle = '#6a655b'; ctx.fillRect(x - 6, y - 26, 4, 28);
      ctx.beginPath(); ctx.moveTo(x - 8, y - 26); ctx.lineTo(x, y - 34); ctx.lineTo(x + 8, y - 26); ctx.fill();
      ctx.fillStyle = '#b8963e'; ctx.beginPath(); ctx.arc(x, y - 17, 3.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#2c3a22'; ctx.fillRect(x - 8, y - 6, 5, 5); ctx.fillRect(x + 4, y - 10, 4, 7);           // Moos
      break;
    case 'candles': {                                     // Kerzen mit flackernder Flamme (Phasen gecacht)
      const f = Math.sin(now / 110 + x) * 0.5 + 0.5;
      for (const [dx, h] of [[-5, 8], [0, 12], [5, 6]]) {
        ctx.fillStyle = '#d6cdb4'; ctx.fillRect(x + dx - 1.5, y - h, 3, h);
        ctx.fillStyle = f > 0.5 ? '#f2c060' : '#e08a3a'; ctx.fillRect(x + dx - 1, y - h - 4 - f * 2, 2, 4);
      }
      ctx.fillStyle = 'rgba(214,205,180,.5)'; ctx.fillRect(x - 7, y, 14, 2);                                   // Wachs
      break; }
    case 'flowers_prop':
      for (const [dx, dy, c] of [[-6, 0, '#b8a44a'], [-1, -3, '#a05a5a'], [4, 1, '#c9c0a0'], [7, -2, '#b8a44a']]) {
        ctx.fillStyle = '#3c4a2c'; ctx.fillRect(x + dx, y + dy, 2, 6); ctx.fillStyle = c; ctx.fillRect(x + dx - 1, y + dy - 2, 4, 3);
      }
      break;
    case 'waysign':                                       // Wegweiser mit drei Brettern
      shadow(x, y + 3, 7, .3);
      ctx.fillStyle = '#3d2f1f'; ctx.fillRect(x - 2, y - 36, 4, 38);
      ctx.fillStyle = '#6b5234';
      ctx.beginPath(); ctx.moveTo(x - 2, y - 34); ctx.lineTo(x + 14, y - 34); ctx.lineTo(x + 18, y - 30); ctx.lineTo(x + 14, y - 26); ctx.lineTo(x - 2, y - 26); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 2, y - 22); ctx.lineTo(x - 14, y - 22); ctx.lineTo(x - 18, y - 18); ctx.lineTo(x - 14, y - 14); ctx.lineTo(x + 2, y - 14); ctx.fill();
      ctx.fillStyle = '#5a452b'; ctx.fillRect(x - 5, y - 44, 10, 8);
      ctx.fillStyle = 'rgba(20,14,8,.6)'; ctx.fillRect(x + 2, y - 31, 10, 1.5); ctx.fillRect(x - 12, y - 19, 10, 1.5); ctx.fillRect(x - 3, y - 41, 6, 1.5);
      break;
    case 'barrel': {                                      // Fass: Dauben, Eisenreifen; Varianten: Deckel / offen mit Wasser / Deckel mit Kelle
      const v = e._var || 0;
      shadow(x, y + 4, 9, .35);
      ctx.fillStyle = '#5b412a'; ctx.beginPath(); ctx.moveTo(x - 8, y - 18); ctx.quadraticCurveTo(x - 11, y - 8, x - 8, y + 3); ctx.lineTo(x + 8, y + 3); ctx.quadraticCurveTo(x + 11, y - 8, x + 8, y - 18); ctx.fill();
      ctx.fillStyle = '#6e5033'; ctx.fillRect(x - 7, y - 17, 4, 19);
      ctx.fillStyle = 'rgba(20,14,8,.35)'; ctx.fillRect(x - 1, y - 17, 1, 19); ctx.fillRect(x + 4, y - 17, 1, 19);   // Dauben
      ctx.fillStyle = '#3a3834'; ctx.fillRect(x - 9, y - 14, 18, 2); ctx.fillRect(x - 9, y - 3, 18, 2);          // Reifen
      ctx.fillStyle = v === 1 ? '#1d2a33' : '#4a3522'; ctx.beginPath(); ctx.ellipse(x, y - 18, 8, 3, 0, 0, 7); ctx.fill();
      if (v === 1) { ctx.fillStyle = '#4a6070'; ctx.fillRect(x - 3, y - 19, 3, 1); }
      if (v === 2) { ctx.fillStyle = '#6a5a44'; ctx.fillRect(x - 2, y - 20, 9, 2); ctx.fillRect(x + 6, y - 22, 3, 3); }
      break; }
    case 'bones':                                         // Schädel und Knochen
      ctx.fillStyle = '#cfc6b0'; ctx.beginPath(); ctx.arc(x - 3, y - 4, 4.5, 0, 7); ctx.fill(); ctx.fillRect(x - 6, y - 2, 6, 3);
      ctx.fillStyle = '#1a1612'; ctx.fillRect(x - 5, y - 5, 2, 2); ctx.fillRect(x - 2, y - 5, 2, 2);
      ctx.fillStyle = '#b8b09a'; ctx.fillRect(x + 2, y - 1, 10, 2); ctx.fillRect(x + 11, y - 2, 2, 4); ctx.fillRect(x - 12, y + 1, 7, 2);
      break;
    case 'broken_cart':                                   // umgestürzter Wagen mit gebrochenem Rad
      shadow(x, y + 5, 22, .38);
      ctx.fillStyle = '#4b3a25'; ctx.beginPath(); ctx.moveTo(x - 20, y - 2); ctx.lineTo(x + 16, y - 16); ctx.lineTo(x + 20, y - 6); ctx.lineTo(x - 16, y + 6); ctx.fill();
      ctx.fillStyle = '#5b452a'; ctx.beginPath(); ctx.moveTo(x - 20, y - 2); ctx.lineTo(x + 16, y - 16); ctx.lineTo(x + 17, y - 13); ctx.lineTo(x - 19, y + 1); ctx.fill();
      ctx.fillStyle = '#b9ad90'; ctx.beginPath(); ctx.moveTo(x - 14, y - 6); ctx.quadraticCurveTo(x, y - 30, x + 12, y - 16); ctx.lineTo(x + 8, y - 10); ctx.fill();   // zerrissene Plane
      ctx.fillStyle = '#2b2116'; ctx.beginPath(); ctx.arc(x - 12, y + 4, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#4b3a25'; ctx.beginPath(); ctx.arc(x - 12, y + 4, 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#2b2116'; ctx.fillRect(x + 18, y + 2, 10, 3); ctx.fillRect(x + 22, y - 2, 3, 8);           // Radtrümmer
      break;
    case 'firepit':                                       // kalte Feuerstelle: Steinring, Asche, verkohlte Scheite
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.fillStyle = i & 1 ? '#5a554c' : '#4a463f';
        ctx.fillRect(x + Math.cos(a) * 10 - 2.5, y + Math.sin(a) * 5 - 2.5, 5, 5); }
      ctx.fillStyle = '#2e2b28'; ctx.beginPath(); ctx.ellipse(x, y, 7, 3.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#1a1512'; ctx.fillRect(x - 6, y - 2, 12, 2); ctx.fillRect(x - 2, y - 4, 3, 6);
      break;
    case 'debris':                                        // verstreute Waren: Bretter, Sack, Tonscherben
      ctx.fillStyle = '#5b452a'; ctx.fillRect(x - 10, y - 2, 12, 3); ctx.fillRect(x + 1, y + 2, 9, 3);
      ctx.fillStyle = '#8a7a58'; ctx.beginPath(); ctx.ellipse(x + 4, y - 4, 5, 4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#8c5a3a'; ctx.fillRect(x - 6, y + 3, 3, 2); ctx.fillRect(x - 2, y + 5, 2, 2);
      break;
    case 'blood':                                         // Blutspur am Boden
      ctx.fillStyle = '#4e1410'; ctx.beginPath(); ctx.ellipse(x, y, 6, 3, 0.3, 0, 7); ctx.fill();
      ctx.fillStyle = '#6a1a14'; ctx.fillRect(x + 6, y + 1, 3, 2); ctx.fillRect(x - 9, y - 2, 2, 2);
      break;
    default:
      ctx.fillStyle = '#4a443c'; ctx.fillRect(x - 7, y - 7, 14, 12);
  }
}

// Figuren: Pixel-Sprites aus sprites.js (Raster, Kontur, Rampen, Posen). Pivot = Fußmitte (x, y+6).
const LIMB_PX = { S: { rarm: [3, 14], larm: [15, 14], rleg: [6, 19], lleg: [12, 19] }, N: { rarm: [15, 14], larm: [3, 14], rleg: [12, 19], lleg: [6, 19] },
                  W: { rarm: [9, 13], larm: [9, 13], rleg: [8, 19], lleg: [10, 19] }, E: { rarm: [9, 13], larm: [9, 13], rleg: [10, 19], lleg: [8, 19] } };
// S12: ganze Figur (Körper, Arme, Waffe) um den Fußpunkt vergrößert — Hand, Griff und Klinge bleiben beieinander
export function drawHumanoid(e, now, override) {
  const c = override || ctx, k = SP.FIGK * (e.big || 1); c.save(); c.translate(e.x, e.y + 6); c.scale(k, k); c.translate(-e.x, -e.y - 6);
  try { drawHumanoidAt(e, now, override);
    if (e.bondGuard && !e.downed) {                                      // MP2 §25: Wächter — glühende rote Augen, pulsierend
      const pl = 0.6 + 0.4 * Math.sin(now / 260); c.fillStyle = `rgba(255,50,30,${pl})`; c.fillRect(e.x - 2.5, e.y - 33, 1.6, 1.2); c.fillRect(e.x + 1, e.y - 33, 1.6, 1.2);
      c.fillStyle = `rgba(255,60,30,${0.15 * pl})`; c.beginPath(); c.arc(e.x, e.y - 32.5, 5, 0, 7); c.fill(); }
    if (e.big && !e.downed) {                                            // S12 E: Uhrwerk in der Brust des Kampfautomaten
      const gx = e.x, gy = e.y - 22, a0 = now / 400; c.fillStyle = '#1a1612'; c.beginPath(); c.arc(gx, gy, 5, 0, 7); c.fill();
      c.fillStyle = '#b08a44'; c.beginPath(); c.arc(gx, gy, 3.5, 0, 7); c.fill(); for (let q = 0; q < 6; q++) { const a = a0 + q * 1.047; c.fillRect(gx + Math.cos(a) * 4 - 0.8, gy + Math.sin(a) * 4 - 0.8, 1.6, 1.6); }
      c.fillStyle = '#2a2018'; c.beginPath(); c.arc(gx, gy, 1.2, 0, 7); c.fill(); }
  } finally { c.restore(); }
}
function drawHumanoidAt(e, now, override) {
  const c = override || ctx;
  c.imageSmoothingEnabled = false;
  const x = e.x, y = e.y;
  const spec = e.spec || SP.humanSpec(e);
  c.fillStyle = `rgba(0,0,0,${e.downed ? .2 : .38})`;
  c.beginPath(); c.ellipse(x, y + 5, 10, 4, 0, 0, 7); c.fill();
  if (e.casting && !e.downed) {                                          // S15 P4: Rune in der Schulfarbe, solange der Zauber sammelt
    const r0 = 14, a0 = now / 450; c.globalAlpha = 0.75; c.strokeStyle = c.fillStyle = e.casting.col || '#b88af0'; c.lineWidth = 1;
    c.beginPath(); c.ellipse(x, y + 5, r0, r0 * 0.45, 0, 0, 7); c.stroke();
    for (let q = 0; q < 6; q++) { const a = a0 + q * 1.047; c.fillRect(Math.round(x + Math.cos(a) * r0 - 1), Math.round(y + 5 + Math.sin(a) * r0 * 0.45), 2, 1); }
    c.globalAlpha = 1; }
  if (e.downed) {                                                   // am Boden: liegende Figur, leicht atmend
    const f = SP.humanFrame(spec, 'W', 'down'), br = ((now / 700) | 0) & 1;
    SP.blit(c, f, x, y + 6 - br);
    return;
  }
  if (crawling(e)) {                                               // S14: beide Beine ausgefallen — kriecht bäuchlings, zieht sich mit den Armen vor
    const f = SP.humanFrame(spec, 'W', 'down'), k = (e.vx || e.vy) ? ((now / 260) | 0) & 1 : 0, fl = (e.vx ?? 0) > 0 || (e.aim != null && Math.cos(e.aim) > 0);
    c.save(); c.translate(x, y + 6 - k); if (fl) c.scale(-1, 1); SP.blit(c, f, 0, 0); c.restore(); return;
  }
  const tool = e.act && e.act.tool && now >= e.act.at && now < e.act.until ? { key: e.act.tool } : null;   // S13: bei der Arbeit das Werkzeug statt der Waffe
  const w = tool || (e.equip && e.equip.weapon), wit = w ? ITEMS[w.key] || {} : null;
  const pz = SP.poseOf(e, now, wit && ['bow', 'crossbow', 'wand'].includes(wit.wtype));   // Fernwaffen: Zielhaltung statt Schwung
  if (pz.pose === 'tuck') {                                         // Ausweichrolle: Kugel in 90°-Schritten gedreht
    const f = SP.humanFrame(spec, 'S', 'tuck'), sgn = e.dodge && e.dodge.ax < 0 ? -1 : 1;
    c.save(); c.translate(Math.round(x), Math.round(y - 8)); c.rotate(pz.rot * Math.PI / 2 * sgn);
    SP.blit(c, f, 0, 0); c.restore();
    return;
  }
  if (SP.drawnOn()) return drawHumanoidR(e, now, c, spec, pz, w, wit);   // S14 Stil R: Arme im Bild, Waffe an der Hand
  const armed = w && !e.sitting;                                   // wer sitzt, hat die Waffe abgelegt
  const wp = armed ? weaponPose(e, now, wit, pz) : null, melee = wp && !wp.ranged;
  const two = melee && wit.twohand, noArm = melee ? (two ? 'both' : wp.armSide) : null;   // S12: Zweihänder mit beiden Händen
  const f = SP.humanFrame(spec, pz.dir, pz.pose, noArm);   // Nahkampf: Waffenarm(e) zeichnet drawArm zur Hand
  if (f.atlas) {                                                    // Stil F (Referenz 5): Bild aus dem Blatt — Waffe ist schon darin
    SP.blit(c, f, x, y + 6); const fa = flashAlpha(e, now); if (fa > 0) { c.globalAlpha = fa; const fl = SP.flashOf(f); Object.assign(fl, { px: f.px, ox: f.ox, oy: f.oy }); SP.blit(c, fl, x, y + 6); c.globalAlpha = 1; }
    if (spec.glow && pz.dir !== 'N') { c.globalCompositeOperation = 'lighter'; c.fillStyle = spec.glow; c.globalAlpha = 0.16 + 0.06 * Math.sin(now / 300 + (e.seed || 0)); c.beginPath(); c.arc(x, y - 48, 6, 0, 7); c.fill(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    if (melee && e.swing > 0) { const a = e.aim ?? 0; c.strokeStyle = `rgba(230,220,200,${0.5 * (1 - Math.abs(e.swing - 0.5) * 2)})`; c.lineWidth = 2; c.beginPath(); c.arc(x, y - 22, 30, a - 0.9, a + 0.9); c.stroke(); }   // Schwung als Bogen
    return; }
  SP.warm(spec, noArm);
  const arms = () => { if (!melee) return; drawArm(c, e, spec, wp, f); if (two) drawArm(c, e, spec, offGrip(e, wp, pz), f); };   // Hand über den Griff                         // BUG-093: übrige Richtungen/Posen in Leerlaufzeit vorbacken
  const behind = w && (pz.dir === 'N' || Math.sin(e.aim ?? 0) < -0.45);
  if (armed && behind) { drawWeapon(c, e, now, wit, wp, w); arms(); }
  const [sx, sy] = buildOf(e).scale;
  c.save(); c.translate(x, y + 6); c.scale(sx, sy);
  SP.blit(c, f, 0, 0);
  const bd = e.body;                                                // verlorene/zerstörte Gliedmaßen: blutige Stellen
  if (bd && pz.dir) for (const k of ['rarm', 'larm', 'rleg', 'lleg']) if (bd[k] && bd[k].hp <= 0) {
    const [gx, gy] = LIMB_PX[pz.dir][k]; c.fillStyle = '#6b1a12'; c.fillRect((gx - 10) * PX, (gy + 1 - 23) * PX, 2 * PX, 2 * PX);
  }
  const fa = flashAlpha(e, now);
  if (fa > 0) { c.globalAlpha = fa; const fl = SP.flashOf(f); Object.assign(fl, { px: f.px, ox: f.ox, oy: f.oy }); SP.blit(c, fl, 0, 0); c.globalAlpha = 1; }
  c.restore();
  if (spec.glow && pz.dir !== 'N') {                                // Glimmen der Untoten-Augen
    c.globalCompositeOperation = 'lighter'; c.fillStyle = spec.glow; c.globalAlpha = 0.16 + 0.06 * Math.sin(now / 300 + (e.seed || 0));
    c.beginPath(); c.arc(x, y - (f.px < 2 ? 40 : 29), 6, 0, 7); c.fill(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';   // Augenhöhe je Raster
  }
  if (armed && !behind) { drawWeapon(c, e, now, wit, wp, w); arms(); }
  if (e.carry && pz.dir !== 'N') { const ic = groundIcon(e.carry), bob = (e.vx || e.vy) ? ((now / 180 | 0) & 1) : 0; c.drawImage(ic, Math.round(x - 8 + (pz.dir === 'E' ? 5 : pz.dir === 'W' ? -5 : 0)), Math.round(y - 22 - bob), 16, 16); }   // S13: getragene Ware vor der Brust
  if (e.marked) { c.strokeStyle = 'rgba(200,80,60,.8)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y - (f.px < 2 ? 58 : 44), 4, 0, 7); c.stroke(); }
}

// S14 Stil R: Waffenzustand → Bild mit Armen (sprites.humanFrameR); die Waffe sitzt an der Hand, die im Bild steht.
// Schwung in Zehntelschritten (Ausholen → Schlag → Nachschwung als echte Einzelbilder), Ziel in Achteln.
function drawHumanoidR(e, now, c, spec, pz, w, wit) {
  const x = e.x, y = e.y, moving = e.vx || e.vy, walkP = 'w' + (((now / 115 + (e.seed || 0) * 3) | 0) & 3);
  let W = null, dir = e.aim ?? 0;
  if (w && !e.sitting) {
    const wt = wit.wtype || 'sword', ranged = RANGED_W.has(wt);
    const A = e.act && now >= e.act.at && now < e.act.until && !moving && !(e.swing > 0) ? e.act : null;
    const ak = A ? (now - A.at) / (A.until - A.at) : 0, work = A && A.kind === 'work', low = A && !work ? (A.kind === 'rise' ? Math.round(7 * (1 - ak)) : 7) : 0;
    const sw = work ? 0.05 + ((ak * (A.rate || 2)) % 1) * 0.6 : e.swing || 0;
    if (A && A.dir) dir = { E: 0, W: Math.PI, S: Math.PI / 2, N: -Math.PI / 2 }[A.dir];
    const aimingR = ranged && (sw > 0 || e.draw > 0 || (e.reloadUntil && now < e.reloadUntil) || (e.castT && now - e.castT < 600) || (e.lastShot && now - e.lastShot < 1200));
    const mode = ranged ? (aimingR ? 'aim' : 'aimRest') : e.cover ? 'cover' : work ? 'work' : sw > 0 ? 'swing' : 'rest', vv = swingVar(e, sw);
    const pull = wt === 'bow' && mode === 'aim' ? Math.round(Math.min(1, e.draw > 0 ? 1 - e.draw / 520 : sw > 0 && sw < 0.75 ? sw / 0.75 : 0) * 4) / 4 : 0;   // S15: Bogen spannen, sichtbar
    W = { mode, wt, arc: wit.arc || 1.4, q: mode === 'swing' || mode === 'work' ? Math.round(sw * 10) / 10 : 0, v: mode === 'swing' ? vv.v : 0, oct: SP.octOf(dir), two: !!wit.twohand && !ranged, low, pull };
  }
  let pose = pz.pose;
  if (/^a[123]$/.test(pose) || (pose === 'cast' && W && W.mode === 'aim')) pose = moving && W && W.mode !== 'work' ? walkP : 'i0';
  if (e.kb && e.kb.t > 0 && !e.cover) pose = 'kb';
  else if (e.stagger > 300 && pose === 'hit') pose = ((now / 140) | 0) & 1 ? 'kb' : 'hit';   // S14: langes Taumeln wankt vor und zurück
  if (e.carry && /^(i[01]|w[0-3])$/.test(pose)) pose += '+carry';
  if (e.mounted) pose = (/^w[0-3]$/.test(pose) ? 'i0' : pose) + '~r';   // S15 (Nutzer: „soll drauf sitzen, nicht stehen“): Reitsitz
  const f = SP.humanFrameR(spec, pz.dir, pose, W), bsx = 1, bsy = 1;   // Körperbau ist im Bild gemalt (spec.bd), nicht gestreckt
  const behind = W && (pz.dir === 'N' || Math.sin(dir) < -0.45);
  const weapon = () => { if (!W || !f.hand) return; drawWeaponR(c, e, now, wit, w, W, x + (f.hand[0] - f.ox) * f.px * bsx, y + 6 + (f.hand[1] - f.oy) * f.px * bsy, dir); };
  if (behind) weapon();
  c.save(); c.translate(x, y + 6); c.scale(bsx, bsy); SP.blit(c, f, 0, 0);
  const bd = e.body;                                                // verlorene Gliedmaßen: blutige Stelle am Gelenk
  if (bd && f.limbs) for (const k of ['rarm', 'larm', 'rleg', 'lleg']) if (bd[k] && bd[k].hp <= 0 && f.limbs[k]) { const [gx, gy] = f.limbs[k]; c.fillStyle = '#6b1a12'; c.fillRect((gx - f.ox - 1) * f.px, (gy - f.oy - 1) * f.px, 2 * f.px, 2 * f.px); }
  const fa = flashAlpha(e, now);
  if (fa > 0) { c.globalAlpha = fa; const fl = SP.flashOf(f); Object.assign(fl, { px: f.px, ox: f.ox, oy: f.oy }); SP.blit(c, fl, 0, 0); c.globalAlpha = 1; }
  c.restore();
  if (spec.glow && pz.dir !== 'N') { c.globalCompositeOperation = 'lighter'; c.fillStyle = spec.glow; c.globalAlpha = 0.16 + 0.06 * Math.sin(now / 300 + (e.seed || 0));
    c.beginPath(); c.arc(x, y + 6 + (f.eyeY - f.oy) * f.px, 6, 0, 7); c.fill(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
  if (!behind) weapon();
  if (e.carry && pz.dir !== 'N') { const ic = groundIcon(e.carry), bob = moving ? ((now / 180 | 0) & 1) : 0; c.drawImage(ic, Math.round(x - 8 + (pz.dir === 'E' ? 5 : pz.dir === 'W' ? -5 : 0)), Math.round(y - 24 - bob), 16, 16); }
  if (e.marked) { c.strokeStyle = 'rgba(200,80,60,.8)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y - 58, 4, 0, 7); c.stroke(); }
}
function drawWeaponR(c, e, now, it, wi, W, hx, hy, dir) {
  const wt = W.wt, a = SP.weaponAngle(W, dir), Wsp = SP.weaponSprite(wi.key, wi.rar || it.rarity, it.holy, wt, wt === 'bow' && W.mode === 'aim'), WP = Wsp.px || PX, len = (Wsp.cv.width - Wsp.gx) * WP;
  if (W.mode === 'swing' && !RANGED_W.has(wt)) {                  // Klingenspur: frühere Winkel derselben Kurve um die Hand
    const col = Wsp.runes ? (it.holy ? '242,230,176' : '255,200,110') : '240,232,210', sw = e.swing || W.q;
    for (let k = 1; k <= 6; k++) { const past = sw - k * 0.03; if (past <= 0) break; const pa = SP.weaponAngle({ ...W, q: past }, dir), t = 1 - k / 7;
      const bx = hx + Math.cos(pa) * len * 0.9, by = hy + Math.sin(pa) * len * 0.9, s2 = Math.round(2 * t + 1);
      c.fillStyle = `rgba(${col},${0.6 * t})`; c.fillRect(Math.round(bx - s2), Math.round(by - s2), s2 * 2, s2 * 2); }
  }
  if (wt === 'bow' && W.mode === 'aim') {                         // S15: Sehne und Pfeil — die Sehne läuft von beiden Bogenenden zur Zughand
    const ax = Math.cos(dir), ay = Math.sin(dir), pl = W.pull || 0, st = Wsp.str || [4, 2, Wsp.cv.height - 2];
    const ca = Math.cos(a), sa = Math.sin(a), on = (sx0, sy0) => { const lx = (sx0 - Wsp.gx) * WP, ly = (sy0 - Wsp.gy) * WP; return [hx + lx * ca - ly * sa, hy + lx * sa + ly * ca]; };   // Bildpunkt des Bogens → Welt
    const [t1x, t1y] = on(st[0], st[1]), [t2x, t2y] = on(st[0], st[2]);   // Bogenspitzen, dort hängt die Sehne
    const mx = (t1x + t2x) / 2, my = (t1y + t2y) / 2, sx = mx - ax * pl * 13, sy = my - ay * pl * 13;   // Nockpunkt: Sehnenmitte, beim Spannen zur Brust
    c.strokeStyle = 'rgba(232,224,200,0.9)'; c.lineWidth = 1; c.beginPath(); c.moveTo(Math.round(t1x), Math.round(t1y)); c.lineTo(Math.round(sx), Math.round(sy)); c.lineTo(Math.round(t2x), Math.round(t2y)); c.stroke();
    const fresh = e.lastShot && now - e.lastShot < 180;              // eben losgelassen: kein Pfeil, die Sehne zittert
    if (!fresh) { const tx = hx + ax * 6, ty = hy + ay * 6;
      c.strokeStyle = '#b8a47e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(Math.round(sx), Math.round(sy)); c.lineTo(Math.round(tx), Math.round(ty)); c.stroke();
      c.fillStyle = '#d8d0c0'; c.fillRect(Math.round(tx - 1), Math.round(ty - 1), 2, 2); c.fillStyle = '#8a2a20'; c.fillRect(Math.round(sx - 1), Math.round(sy - 1), 2, 2); } }
  c.save(); c.translate(Math.round(hx), Math.round(hy)); c.rotate(a);
  if (wt !== 'bow' && Math.cos(dir) < 0) c.scale(1, -1);
  c.drawImage(Wsp.cv, -Wsp.gx * WP, -Wsp.gy * WP, Wsp.cv.width * WP, Wsp.cv.height * WP);
  if (Wsp.orb) { const f = ((now / 90 + (e.seed || 0)) | 0) % 5; c.fillStyle = f === 0 ? '#e8f4ff' : f < 3 ? '#8fb7e8' : '#5f8fd0'; c.fillRect((Wsp.orb[0] - Wsp.gx) * WP, (Wsp.orb[1] - Wsp.gy - 2) * WP, 2, 2); }
  if (Wsp.runes && ((now / 140 + (e.seed || 0)) | 0) % 6 === 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; c.drawImage(Wsp.cv, -Wsp.gx * WP, -Wsp.gy * WP, Wsp.cv.width * WP, Wsp.cv.height * WP); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
  c.restore();
}
// Schwungkurve je Waffentyp: Ausholen (Antizipation) → Schlag → Nachschwung. sw 0..1, Trefferprüfung bei 0.42.
// a = Winkel relativ zur Zielrichtung, ext = Vorschub der Hand entlang der Zielrichtung (Stoßwaffen).
// S14: swingOf wohnt in fig5.js (eine Quelle für Stil D und R, kein Import-Zyklus)
export const swingOf = SP.swingOf;
// Hiebvariante je Schlag: beim Beginn eines Schwungs gewählt (Kombo mit Zufall), je Figur gemerkt (Gegner zeichnen über Kopien → id)
const SWING_V = new Map();
function swingVar(e, sw) {
  if (SWING_V.size > 3000) SWING_V.clear();                          // ponytail: grobe Aufräumung, reicht bei ein paar hundert Kämpfern
  let st = SWING_V.get(e.id); if (!st) SWING_V.set(e.id, st = { v: 0, j: 0, live: false });
  if (sw > 0 && !st.live) { st.live = true; st.v = (st.v + 1 + (Math.random() < 0.35 ? 1 : 0)) % 3; st.j = (Math.random() - 0.5) * 0.35; }
  if (!(sw > 0)) st.live = false;
  return st;
}
// Hand + Winkel der Waffe (G3): Nahkampf — die Hand sitzt am Ende des Arms und läuft beim Schlag auf einem Bogen um die
// Schulter; in Ruhe hängt sie locker. Fernwaffen/Zauberstab: Hand vor dem Körper (Arm im Sprite, Zielhaltung).
const RANGED_W = new Set(['bow', 'crossbow', 'wand', 'throw', 'sling']);
function weaponPose(e, now, it, pz) {
  const A = e.act && now >= e.act.at && now < e.act.until && !(e.vx || e.vy) && !(e.swing > 0) ? e.act : null;   // Interaktion
  const ak = A ? (now - A.at) / (A.until - A.at) : 0, low = A && A.kind !== 'work' ? (A.kind === 'rise' ? 7 * (1 - ak) : 7) : 0;
  const sw = A && A.kind === 'work' ? 0.05 + ((ak * (A.rate || 2)) % 1) * 0.6 : e.swing || 0;             // Arbeitsschwung: zwei Hiebe (S13: Werkzeug bestimmt das Tempo)
  const dir = A && A.dir ? { E: 0, W: Math.PI, S: Math.PI / 2, N: -Math.PI / 2 }[A.dir] : e.aim ?? 0, wt = it.wtype || 'sword', arc = it.arc || 1.4;
  const ranged = RANGED_W.has(wt), sgn = Math.cos(dir) < 0 ? -1 : 1;   // nach links gespiegelt: Waffe hängt unten, Hieb von oben
  const thrust = wt === 'spear' || wt === 'dagger' || wt === 'rapier';
  const side = pz.dir === 'W' || pz.dir === 'E', armSide = side ? 'near' : (Math.cos(dir) < 0 ? 'L' : 'R');
  const [sox, soy] = SP.shoulderOf(pz.dir, pz.pose, armSide === 'L' ? 'L' : 'R'), shx = e.x + sox, shy = e.y + 6 + soy;
  const aimingR = ranged && (sw > 0 || e.draw > 0 || (e.reloadUntil && now < e.reloadUntil) || (e.castT && now - e.castT < 600) || (e.lastShot && now - e.lastShot < 1200));
  const upright = wt === 'spear' || wt === 'polearm', onShoulder = wt === 'great' || wt === 'hammer';   // S12: Stangenwaffen aufrecht, Zweihänder auf der Schulter
  const hand = (swv, sv) => {                                         // Hand für einen Schwungzustand
    if (ranged) return aimingR ? [e.x + Math.cos(dir) * 8, e.y - 16 + Math.sin(dir) * 5] : [shx + Math.cos(dir) * 4, shy + 14 + low];   // Phase 1: in Ruhe hängt die Fernwaffe an der Seite
    const active = swv > 0 || e.cover || (A && A.kind === 'work');
    if (!active) return upright ? [shx + Math.cos(dir) * 6, shy + 11 + low] : onShoulder ? [shx + Math.cos(dir) * 3, shy + 9 + low]
      : [shx + Math.cos(dir) * 5, shy + 16 + low + Math.max(0, Math.sin(dir)) * 2];   // Ruhe: Arm hängt, Waffe locker vorn
    if (thrust) { const r = 11 + sv.ext * 0.8; return [shx + Math.cos(dir) * r, shy + 6 + low + Math.sin(dir) * r * 0.8]; }
    const ha = dir + sv.a * sgn * 0.55, r = 13 + sv.ext * 0.5;       // Hand läuft mit der Klinge um die Schulter
    return [shx + Math.cos(ha) * r, shy + 5 + low - (e.cover ? 4 : 0) + Math.sin(ha) * r * 0.75];
  };
  const vv = swingVar(e, sw), sv = ranged ? { a: 0, ext: 0 } : e.cover ? { a: -1.15, ext: -2 } : swingOf(wt, sw, arc, vv.v, vv.j);   // Deckung: Klinge schräg hoch vor dem Körper
  const [hx, hy] = hand(sw, sv);
  // In Ruhe getragen, nicht gezielt: Klinge gesenkt zur Blickseite (sonst zeigte sie wie ein Zeiger zur Maus und kreiste um die Figur)
  const rest = !ranged && !(sw > 0) && !e.cover && !(A && A.kind === 'work');
  // Bogen (Phase 1): wird senkrecht gehalten — in der Draufsicht bleiben die Wurfarme senkrecht, nur leicht zur Zielseite geneigt
  // (vorher drehte er ganz mit dem Ziel und lag beim Blick nach unten waagrecht wie eine Armbrust vor dem Bauch).
  const bowA = (sgn > 0 ? 0 : Math.PI) + Math.sin(dir) * 0.3 * sgn;
  const a = wt === 'bow' ? bowA : ranged && !aimingR ? (wt === 'crossbow' ? Math.PI / 2 - sgn * 0.2 : bowA)
    : rest ? (upright ? -Math.PI / 2 + sgn * 0.1 : onShoulder ? -Math.PI / 2 - sgn * 0.75 : sgn > 0 ? 1.2 : Math.PI - 1.2) : dir + sv.a * sgn;
  return { A, sw, dir, wt, arc, ranged, sgn, thrust, sv, a, hx, hy, shx, shy, armSide, hand, vv };
}
// Zweite Hand am Schaft (Zweihänder): von der anderen Schulter zu einem Punkt 9 Welt-Einheiten weiter oben auf der Waffenachse —
// dreht mit Schwung und Blickrichtung mit, weil sie an der Waffe hängt, nicht am Körper.
function offGrip(e, wp, pz) {
  const [ox, oy] = SP.shoulderOf(pz.dir, pz.pose, wp.armSide === 'L' ? 'R' : 'L'), k = 9;
  return { shx: e.x + ox, shy: e.y + 6 + oy, hx: wp.hx + Math.cos(wp.a) * k, hy: wp.hy + Math.sin(wp.a) * k };
}
// Arm von der Schulter zur Hand (feines Raster): Kontur, Ärmel mit Licht oben links, Hand/Handschuh
function drawArm(c, e, spec, wp, f) {
  // Farben einmal je Figurenbild (Frame ist nach Spec gecacht)
  const L = f._look || (f._look = SP.lookOf(spec)), mech = e.body && (e.body.rarm?.mech || e.body.larm?.mech);   // S12: Prothese sichtbar als Messingarm
  const sl = mech ? L.gold : L.armor === 'plate' || L.armor === 'chain' ? L.armorR : L.robe || L.cloth, hd = mech ? L.metal : L.glove || L.skin;
  const x0 = wp.shx, y0 = wp.shy, x1 = wp.hx, y1 = wp.hy, n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  const mx = (x0 + x1) / 2 + (x1 > x0 ? -1.5 : 1.5), my = (y0 + y1) / 2 + 2.5;   // Ellbogen leicht nach außen/unten
  const pt = t => t < 0.5 ? [x0 + (mx - x0) * t * 2, y0 + (my - y0) * t * 2] : [mx + (x1 - mx) * (t - 0.5) * 2, my + (y1 - my) * (t - 0.5) * 2];
  const Q = f.px || 1, R = (x, y, w, h) => c.fillRect(Math.round(x / Q) * Q, Math.round(y / Q) * Q, w * Q, h * Q);   // Stil D: Armraster = Figurenraster
  const stamp = (col, r, w) => { c.fillStyle = col; for (let i = 0; i <= n; i++) { const [px, py] = pt(i / n); R(px - r * Q, py - r * Q, w, w); } };
  stamp('#0c0a08', 2, 5); stamp(sl.sh, 1, 3); stamp(sl.b, 1, 2);
  c.fillStyle = sl.hi; for (let i = 1; i < n * 0.45; i += Q) { const [px, py] = pt(i / n); R(px - Q, py - Q, 1, 1); }
  c.fillStyle = '#0c0a08'; R(x1 - 2 * Q, y1 - 2 * Q, 5, 5);
  c.fillStyle = hd.b; R(x1 - Q, y1 - Q, 3, 3); c.fillStyle = hd.hi; R(x1 - Q, y1 - Q, 2, 1);
  c.fillStyle = hd.sh; R(x1, y1 + Q, 2, 1);
}
function drawWeapon(c, e, now, it, wp, wi = e.equip.weapon) {   // wi: Exemplar in der Hand (S13: auch ein Werkzeug)
  it = it || ITEMS[wi.key] || {};
  wp = wp || weaponPose(e, now, it, SP.poseOf(e, now, RANGED_W.has(it.wtype)));
  const { A, sw, dir, wt, arc, ranged, sgn, sv, a, hx, hy } = wp;
  const W = SP.weaponSprite(wi.key, wi.rar || it.rarity, it.holy, wt);   // Rarität des Exemplars
  const WP = W.px || PX, len = (W.cv.width - W.gx) * WP;
  // Klingenspur: dieselbe Kurve ein paar Schritte zurück — Hand und Klinge der Vergangenheit, die Spur folgt der Klinge
  if (sw > 0 && !it.ranged && !A) {
    const heavy = wt === 'great' || wt === 'axe' || wt === 'mace' || wt === 'hammer' || wt === 'polearm';
    const col = W.runes ? (it.holy ? '242,230,176' : '255,200,110') : '240,232,210';
    for (let k = 1; k <= 7; k++) {
      const past = sw - k * 0.022; if (past <= 0) break;
      const pv = swingOf(wt, past, arc, wp.vv.v, wp.vv.j), t = 1 - k / 8;
      if (Math.abs(pv.a - sv.a) < 0.02 && Math.abs(pv.ext - sv.ext) < 0.5) continue;   // keine Bewegung, keine Spur
      const ph = wp.hand(past, pv), pa = wp.thrust ? dir : dir + pv.a * sgn, r = len * 0.9;
      const bx = ph[0] + Math.cos(pa) * r, by = ph[1] + Math.sin(pa) * r;
      const s2 = Math.round((heavy ? 3 : 2) * t + 1) * PX / 2;
      c.fillStyle = `rgba(${col},${0.65 * t})`; c.fillRect(Math.round(bx - s2), Math.round(by - s2), s2 * 2, s2 * 2);
    }
  }
  c.save(); c.translate(Math.round(hx), Math.round(hy));
  c.rotate(ranged && (wt === 'wand' || wt === 'throw' || wt === 'sling') ? dir : a);                          // Phase 1: Bogen/Armbrust nach ihrer Haltung (Bogen senkrecht)
  if (wt !== 'bow' && Math.cos(dir) < 0) c.scale(1, -1);          // nach Blickrichtung, nie mitten im Schwung (Bogen ist symmetrisch)
  c.drawImage(W.cv, -W.gx * WP, -W.gy * WP, W.cv.width * WP, W.cv.height * WP);
  if (W.orb) {                                                      // Kristall des Stabs flackert (Magie sichtbar, kein Glühschleier)
    const f = ((now / 90 + (e.seed || 0)) | 0) % 5;
    c.fillStyle = f === 0 ? '#e8f4ff' : f < 3 ? '#8fb7e8' : '#5f8fd0';
    c.fillRect((W.orb[0] - W.gx) * WP, (W.orb[1] - W.gy - 2) * WP, 2, 2);
  }
  if (W.runes && ((now / 140 + (e.seed || 0)) | 0) % 6 === 0) {   // Runen pulsieren kurz auf
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5;
    c.drawImage(W.cv, -W.gx * WP, -W.gy * WP, W.cv.width * WP, W.cv.height * WP);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
  c.restore();
}

// Gegner: Vierbeiner / Boss / humanoide Gegner — alle als Pixel-Sprites derselben Familie.
const monsterSpecs = new WeakMap();
function monsterSpecOf(e, m) { let s = monsterSpecs.get(e); if (!s || s.blood !== SP.bloodOf(e) || s.ms !== SP.msOf(e)) { s = SP.monsterSpec(e, m); monsterSpecs.set(e, s); } return s; }   // Blut folgt dem Leben
function sideDir(e) {
  if (e.swing > 0 && e.aim != null) return Math.cos(e.aim) < 0 ? 'W' : 'E';
  if (e.facing === 2) e._side = 'W'; else if (e.facing === 3) e._side = 'E';
  return e._side || 'W';
}
// Aasschwinge (Phase 6): fliegt — Schatten am Boden, Körper 18 px darüber, die Schwingen schlagen
function drawWing(e, now, p) {
  const s0 = e.seed || 0, f = Math.sin(now / 70 + s0), hgt = 18 + Math.sin(now / 300 + s0) * 3, x = Math.round(e.x), y = Math.round(e.y - hgt), dir = sideDir(e) === 'E' ? 1 : -1, lift = Math.round(f * 7);
  shadow(e.x, e.y + 3, 9, .3);
  ctx.fillStyle = p.dark || '#141012';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 3, y); ctx.lineTo(x + s * 15, y - lift - 4); ctx.lineTo(x + s * 12, y - lift + 3); ctx.lineTo(x + s * 8, y - lift + 1); ctx.lineTo(x + s * 4, y + 4); ctx.fill(); }
  ctx.fillStyle = p.body || '#2a2426'; ctx.fillRect(x - 3, y - 3, 6, 8); ctx.fillRect(dir > 0 ? x + 2 : x - 6, y - 6, 4, 4);
  ctx.fillStyle = p.eye || '#e05a3a'; ctx.fillRect(dir > 0 ? x + 4 : x - 5, y - 5, 1.5, 1.5);
  const fw = flashAlpha(e, now); if (fw > 0) { ctx.globalAlpha = fw; ctx.fillStyle = '#fff'; ctx.fillRect(x - 3, y - 3, 6, 8); ctx.globalAlpha = 1; }
}
// Nutzer (S13): Rollen-Symbol der Untoten über dem Kopf (in der Nähe des Spielers) — 5×5-Pixelzeichen in der Farbe der Rolle
const ROLE_GLYPH = { Nahkampf: ['#c8c0a8', '00100,00100,00100,01110,00100'], Schildwall: ['#b8c4cc', '11111,11111,11111,01110,00100'], Fernkampf: ['#a8d0a0', '00111,00011,00101,01000,10000'],
  Beschwörer: ['#8fe0b0', '01110,10101,11111,01110,01010'], Heiler: ['#b07ae0', '00100,00100,11111,00100,00100'], Masse: ['#b0c070', '00100,01110,11111,11111,01110'],
  Brecher: ['#ff7a2a', '00100,01100,01110,11111,01110'], Meuchler: ['#9a7ae0', '00001,00010,10100,01000,10100'], Hetzer: ['#d8d0b8', '10101,00000,01110,11111,01110'],
  Flieger: ['#e05a3a', '10001,11011,01110,00100,00000'], Belagerung: ['#c05a3a', '11111,11111,00100,00100,00100'], Elite: ['#6fd8ff', '10101,11111,11111,11111,00000'] };
function roleBadge(e, m, top) {
  const G = ROLE_GLYPH[m.role], P = S.player; if (!G || !P || Math.hypot(e.x - P.x, e.y - P.y) > 360) return;
  const rows = G[1].split(','), x0 = Math.round(e.x - 5), y0 = Math.round(top - 12);
  ctx.fillStyle = 'rgba(10,8,8,.7)'; ctx.fillRect(x0 - 2, y0 - 2, 14, 14);
  ctx.fillStyle = G[0]; rows.forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === '1') ctx.fillRect(x0 + i * 2, y0 + j * 2, 2, 2); });
}
// Nekromant: zwei kleine Schädel kreisen um ihn
function orbitSkulls(e, now) {
  for (let k = 0; k < 2; k++) { const a = now / 600 + k * Math.PI, x = Math.round(e.x + Math.cos(a) * 16), y = Math.round(e.y - 30 + Math.sin(a) * 6);
    ctx.fillStyle = '#d8d0ba'; ctx.fillRect(x - 2, y - 2, 5, 4); ctx.fillRect(x - 1, y + 2, 3, 1); ctx.fillStyle = '#8fe0b0'; ctx.fillRect(x - 1, y - 1, 1, 1); ctx.fillRect(x + 1, y - 1, 1, 1); }
}
// Garmadon: Krone aus schwarzem Eisen mit roten Steinen, über dem Helm
function crownOf(e, top) {
  const x = Math.round(e.x), y = Math.round(top + 2);
  ctx.fillStyle = '#2a2220'; ctx.fillRect(x - 9, y, 18, 4); for (const dx of [-9, -3, 3, 8]) ctx.fillRect(x + dx, y - 5, 2, 5);
  ctx.fillStyle = '#b8942e'; ctx.fillRect(x - 9, y, 18, 1); ctx.fillStyle = '#e03a2a'; for (const dx of [-6, 0, 5]) ctx.fillRect(x + dx, y + 1, 2, 2);
}
// Omega (Nutzer S13): ein gigantisches Auge — schwebt, Lid und Adern, die Iris folgt dem Spieler, Heiligenschein und Strahlen,
// blinzelt; Ophanim sind kleine Rad-Augen derselben Art. R = Radius in Welt-Einheiten.
function drawEye(e, now, R) {
  const P = S.player, s0 = e.seed || 0, hov = R * 0.9 + Math.sin(now / 600 + s0) * 4, cx = e.x, cy = e.y - hov;
  shadow(e.x, e.y + 2, R * 0.8, .45);
  const rot = now / 3000 + s0;
  ctx.strokeStyle = `rgba(255,214,130,${0.5 + 0.2 * Math.sin(now / 400)})`; ctx.lineWidth = Math.max(1, R / 20);
  for (const k of [1.35, 1.6]) { ctx.beginPath(); ctx.ellipse(cx, cy, R * k, R * k * 0.38, Math.sin(rot) * 0.3, 0, 7); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,220,150,.35)';
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + rot * 0.5, r0 = R * 1.05, r1 = R * (1.45 + 0.15 * Math.sin(now / 300 + i));
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a - 0.05) * r0, cy + Math.sin(a - 0.05) * r0 * 0.7); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.7); ctx.lineTo(cx + Math.cos(a + 0.05) * r0, cy + Math.sin(a + 0.05) * r0 * 0.7); ctx.fill(); }
  ctx.fillStyle = '#4a1414'; ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.12, R * 0.78, 0, 0, 7); ctx.fill();          // Lid, Fleisch
  ctx.fillStyle = '#6a2020'; ctx.beginPath(); ctx.ellipse(cx, cy - R * 0.05, R * 1.05, R * 0.7, 0, 0, 7); ctx.fill();
  const blink = ((now + s0 * 997) % 5200) < 160, open = e.special ? 1.1 : blink ? 0.08 : 1;
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.98, R * 0.6 * open, 0, 0, 7); ctx.clip();
  ctx.fillStyle = '#efe4c8'; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);                                             // Lederhaut
  ctx.strokeStyle = 'rgba(170,30,30,.7)'; ctx.lineWidth = Math.max(1, R / 40);
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + s0; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.6); ctx.quadraticCurveTo(cx + Math.cos(a + 0.3) * R * 0.7, cy + Math.sin(a + 0.3) * R * 0.45, cx + Math.cos(a) * R * 0.42, cy + Math.sin(a) * R * 0.3); ctx.stroke(); }
  const la = P ? Math.atan2(P.y - cy, P.x - cx) : 0, ld = P ? Math.min(R * 0.36, Math.hypot(P.x - cx, P.y - cy) / 6) : 0, ix = cx + Math.cos(la) * ld, iy = cy + Math.sin(la) * ld * 0.6;
  ctx.fillStyle = '#8a1a14'; ctx.beginPath(); ctx.arc(ix, iy, R * 0.36, 0, 7); ctx.fill();                            // Iris
  ctx.fillStyle = '#c8502a'; ctx.beginPath(); ctx.arc(ix, iy, R * 0.28, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.arc(ix, iy, R * 0.16, 0, 7); ctx.fill();
  ctx.fillStyle = '#0a0404'; const pw = e.special ? R * 0.14 : R * 0.06; ctx.fillRect(ix - pw / 2, iy - R * 0.2, pw, R * 0.4);   // Schlitzpupille, weit im Angriff
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(ix - R * 0.16, iy - R * 0.18, R * 0.08, R * 0.08);
  ctx.restore();
  if (e.mtype === 'omega') { ctx.fillStyle = 'rgba(150,10,10,.8)'; for (const dx of [-0.5, 0.35]) { const t = ((now / 900 + dx * 3) % 1); ctx.fillRect(cx + R * dx, cy + R * 0.55 + t * R * 0.9, Math.max(2, R / 25), Math.max(4, R / 10)); } }   // Bluttränen
  const fw = flashAlpha(e, now); if (fw > 0) { ctx.globalAlpha = fw * 0.7; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.62, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
}
// Engel (Nutzer S13): zwei Flügel hinter der Figur, weiß-golden, schlagen langsam
function drawWings(e, now, scale) {
  scale *= 1.35; const f = Math.sin(now / 260 + (e.seed || 0)) * 0.25, y0 = e.y - 37 * scale;   // S14: größer, an den Schultern
  // S14 (Nutzer: „Engel gruseliger“): zweites, tieferes Flügelpaar; zerrupfte Federn mit dunklen Spalten; Augen auf den Schwingen, die blinzeln
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(e.x + s * 6 * scale, y0 + 14 * scale); ctx.rotate(s * (0.9 - f * 0.6)); ctx.scale(s * scale * 0.85, scale * 0.85);
    ctx.fillStyle = '#a89c84'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(20, -10, 30, 2); ctx.lineTo(24, 8); ctx.lineTo(27, 14); ctx.lineTo(18, 12); ctx.lineTo(16, 18); ctx.quadraticCurveTo(8, 12, 0, 10); ctx.fill();
    ctx.fillStyle = '#2a2018'; for (let k = 0; k < 3; k++) ctx.fillRect(10 + k * 6, 2 + k * 2, 1, 8);
    ctx.restore(); }
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(e.x + s * 5 * scale, y0); ctx.rotate(s * (0.35 + f)); ctx.scale(s * scale, scale);
    ctx.fillStyle = '#d8ccb0'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(22, -18, 34, -6); ctx.quadraticCurveTo(28, 6, 30, 16); ctx.quadraticCurveTo(18, 10, 0, 14); ctx.fill();
    ctx.fillStyle = '#f4ecd8'; for (let k = 0; k < 4; k++) ctx.fillRect(8 + k * 6, -6 + k * 3, 5, 12 - k);
    ctx.fillStyle = '#c8a040'; ctx.fillRect(0, -1, 26, 2);
    ctx.fillStyle = '#1a1410'; for (const [x, y] of [[14, -8], [24, -5], [20, 6]]) ctx.fillRect(x, y, 1, 7);                       // Spalten zwischen den Federn
    const blink = ((now / 180 + (e.seed || 0) * 7 + s) | 0) % 23 === 0;
    for (const [x, y] of [[12, 0], [22, -2], [26, 8]]) { ctx.fillStyle = '#f2ead6'; ctx.fillRect(x - 2, y - 1, 5, blink ? 1 : 3); if (!blink) { ctx.fillStyle = '#0a0806'; ctx.fillRect(x, y, 1, 1); ctx.fillStyle = '#c8a040'; ctx.fillRect(x - 2, y + 2, 5, 1); } }
    ctx.restore(); }
}
function drawCreature(e, now) {
  const m = MONSTERS[e.mtype] || {};
  const p = m.pal || {};
  if (e.special && e.special.kind === 'frost' && e.special.t > 0) {       // Hrodvars Eiskreis: Ansage-Ring, zieht sich zusammen
    const k = 1 - e.special.t / 900, R = e.special.big ? 140 : 105, Ry = R * 0.63; ctx.fillStyle = `rgba(160,215,245,${0.35 + 0.4 * k})`;   // Phase 3: großer Kreis — Ansage = Trefferfläche
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; ctx.fillRect(Math.round(e.x + Math.cos(a) * R) - 2, Math.round(e.y + Math.sin(a) * Ry) - 2, 4, 4); }
    ctx.fillStyle = `rgba(160,215,245,${0.08 + 0.12 * k})`; ctx.beginPath(); ctx.ellipse(e.x, e.y, R, Ry, 0, 0, 7); ctx.fill();
  }
  if (e.special?.kind === 'beam' && e.special.t > 0) dottedLine(e.x, e.y - 20, e.special.a, 420, now);   // Phase 7: Omegas Strahl
  if (e.special && ['stomp', 'bloodrain', 'meteor', 'nova'].includes(e.special.kind) && e.special.t > 0) {   // Phase 6: Stampfen des Kolosses, Omegas Blut (Garmadon)
    const st = e.special.kind === 'stomp', k = 1 - e.special.t / (e.special.T || (st ? 900 : 1000)), R = e.special.R || (st ? 95 : 48), col = `rgba(200,40,30,${0.35 + 0.45 * k})`;
    for (const s of e.special.spots || [{ x: e.x, y: e.y }]) {
      ctx.fillStyle = col; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; ctx.fillRect(Math.round(s.x + Math.cos(a) * R) - 2, Math.round(s.y + Math.sin(a) * R * 0.63) - 2, 4, 4); }
      ctx.fillStyle = `rgba(160,20,20,${0.08 + 0.15 * k})`; ctx.beginPath(); ctx.ellipse(s.x, s.y, R, R * 0.63, 0, 0, 7); ctx.fill(); }
  }
  if (e.mtype === 'carrion_wing') return drawWing(e, now, p);
  if (m.eye) return drawEye(e, now, 70 * m.eye);   // Omega (und Ophanim): Auge statt Figur
  if (['wolf', 'boar', 'bear', 'deer', 'wild_dog', 'bone_hound', 'cow', 'sheep', 'horse'].includes(e.mtype)) {
    const moving = e.vx || e.vy, sw = e.swing || 0, K = SP.FIGK * (SP.atlasOn() ? 1 : e.mtype === 'bear' ? 1.45 : e.mtype === 'wild_dog' ? 0.85 : e.mtype === 'horse' ? 1.35 : e.mtype === 'cow' ? 1.3 : 1) * (e.elite ? 1.15 : e.alpha || e.rboss ? 1.3 : 1);   // Leitwolf sichtbar größer   // Bär groß, Hund klein
    if (K !== 1) { ctx.save(); ctx.translate(e.x, e.y); ctx.scale(K, K); ctx.translate(-e.x, -e.y); }
    const pose = e.telegraph > 0 ? 'a1' : e.leap ? 'a2' : sw > 0 ? (sw < 0.35 ? 'a1' : 'a2') : '';
    const fr = e.leap ? 2 : moving ? ((now / 85 + (e.seed || 0) * 5) | 0) & 3 : 1;
    const f = SP.beastFrame(e.mtype, p, sideDir(e), pose, fr);
    shadow(e.x, e.y + 3, (e.r + 4) / K, .35);
    SP.blit(ctx, f, e.x, e.y + 5);
    const fw = flashAlpha(e, now);
    if (fw > 0) { ctx.globalAlpha = fw; SP.blit(ctx, Object.assign(SP.flashOf(f), { px: f.px, ox: f.ox, oy: f.oy }), e.x, e.y + 5); ctx.globalAlpha = 1; }
    if (K !== 1) ctx.restore();
    if (e.mtype === 'bear' && e.telegraph > 0) dottedLine(e.x, e.y - 8, e.aim ?? 0, 200, now);   // Ansage des Sturmlaufs
    return;
  }
  if (e.mtype === 'gorak') {
    const moving = e.vx || e.vy, sw = e.swing || 0;
    const sa = e.special, winding = sa && sa.t > 0;
    const pose = e.telegraph > 0 || winding || e.roar > 0 ? 'a1' : sw > 0 || (sa && sa.kind === 'charge') ? 'a2' : '';
    if (winding && sa.kind === 'charge') dottedLine(e.x, e.y - 6, Math.atan2(sa.ay, sa.ax), 230, now);
    if (winding && sa.kind === 'quake') { ctx.fillStyle = `rgba(210,70,48,${0.45 + 0.35 * Math.sin(now / 60)})`;
      for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; ctx.fillRect(Math.round(e.x + Math.cos(a) * 110) - 2, Math.round(e.y + Math.sin(a) * 66) - 2, 4, 4); } }
    const fr = moving ? ((now / 160) | 0) & 3 : ((now / 500) | 0) & 1;
    const dir = sideDir(e), f = SP.bruteFrame(p, dir, pose, fr);
    shadow(e.x, e.y + 5, 24, .45);
    // Hackmesser: großes Pixel-Beil, beim Ausholen erhoben
    const a = (e.aim ?? 0) + (sw > 0 ? -0.9 + sw * 1.8 : pose === 'a1' ? -1.6 : 0.5);
    const W = SP.weaponSprite('gorak_cleaver', 'common', false, 'axe');
    const fl = dir === 'W' ? -1 : 1, hp = pose === 'a1' ? [23.5, -61] : [22, -10];   // Messer sitzt in der Hand (erhoben bzw. hängend)
    ctx.save(); ctx.translate(Math.round(e.x + hp[0] * fl), Math.round(e.y + hp[1])); ctx.rotate(a); if (Math.cos(a) < 0) ctx.scale(1, -1);
    const GP = (W.px || PX) * 1.6; ctx.drawImage(W.cv, -W.gx * GP, -W.gy * GP, W.cv.width * GP, W.cv.height * GP); ctx.restore();
    SP.blit(ctx, f, e.x, e.y + 8);
    if (e.telegraph > 0) telegraphArc(e, m.reach + 12, 0.9, now);
    const fg = flashAlpha(e, now);
    if (fg > 0) { ctx.globalAlpha = fg; SP.blit(ctx, Object.assign(SP.flashOf(f), { px: f.px, ox: f.ox, oy: f.oy }), e.x, e.y + 8); ctx.globalAlpha = 1; }
    return;
  }
  // humanoide Gegner (Goblin, Bandit, Untoter, Soldat)
  const scale = (e.mtype === 'goblin' ? 0.82 : e.mtype === 'goblin_warrior' ? 0.9 : 1) * (e.elite ? 1.12 : e.rboss ? 1.18 : 1) * (m.scale || 1) * ({ veteran: 1.06, armored: 1.08, leader: 1.1, starved: 0.94 }[e.variant] || 1);   // §71 Veteran / §73 Regionalboss: größere Silhouette
  const proxy = { ...e, spec: monsterSpecOf(e, m), equip: { weapon: e.weaponKey ? { key: e.weaponKey } : null } };
  if (e.mtype === 'zombie') { ctx.fillStyle = 'rgba(140,170,70,.13)'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 4, 26, 14, 0, 0, 7); ctx.fill(); }   // Seuchendunst
  if (e.shadowServ) { ctx.fillStyle = 'rgba(120,80,190,.18)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 2, 18, 8, 0, 0, 7); ctx.fill(); }   // Schattenskelett des Hexenmeisters
  const lean = e.mtype === 'zombie' ? (sideDir(e) === 'E' ? 0.16 : -0.16) : 0, sx = e.mtype === 'flesh_golem' ? 1.22 : m.angel ? 1.16 : 1, sy = e.mtype === 'zombie' ? 0.9 : 1, lift = e.mtype === 'shade' ? 5 + Math.sin(now / 260) * 3 : 0;   // Silhouetten: gebückt, massig, schwebend
  ctx.save(); ctx.translate(e.x, e.y - lift); ctx.rotate(lean); ctx.scale(scale * sx, scale * sy); ctx.translate(-e.x, -e.y);
  if (e.mtype === 'wraith') ctx.globalAlpha = e.phased > performance.now() ? 0.28 : 0.62 + 0.1 * Math.sin(now / 200);   // Geist: halb da, körperlos fast weg
  if (e.mtype === 'shade') ctx.globalAlpha = S.player && Math.hypot(e.x - S.player.x, e.y - S.player.y) > 150 ? 0.2 : 0.85;   // Phase 6: aus der Ferne kaum zu sehen
  if (e.mtype === 'omega') { ctx.fillStyle = `rgba(200,30,30,${0.1 + 0.05 * Math.sin(now / 200)})`; ctx.beginPath(); ctx.ellipse(e.x, e.y, 90 / scale, 50 / scale, 0, 0, 7); ctx.fill(); }   // Phase 7: rote Aura
  if (e.mtype === 'ash_demon') { ctx.fillStyle = `rgba(255,110,40,${0.1 + 0.05 * Math.sin(now / 160)})`; ctx.beginPath(); ctx.ellipse(e.x, e.y, 56 / scale, 35 / scale, 0, 0, 7); ctx.fill(); }   // Glutaura
  if (e.shadowServ) ctx.globalAlpha = 0.72;
  if (m.angel) drawWings(e, now, 1);
  if (e.variant === 'frenzied') { ctx.fillStyle = `rgba(190,40,30,${0.12 + 0.06 * Math.sin(now / 140)})`; ctx.beginPath(); ctx.ellipse(e.x, e.y - 2, 20, 10, 0, 0, 7); ctx.fill(); }   // S13: Raserei
  if (e.variant === 'leader') { ctx.fillStyle = '#3a2a1a'; ctx.fillRect(e.x + 9, e.y - 54, 2, 44); ctx.fillStyle = '#8a2a1e'; ctx.fillRect(e.x + 11, e.y - 54, 11, 7); ctx.fillRect(e.x + 11, e.y - 47, 7, 3); }   // S13: Feldzeichen des Anführers
  drawHumanoid(proxy, now);
  ctx.globalAlpha = 1; ctx.restore();
  if (e.mtype === 'shade') { ctx.fillStyle = 'rgba(14,12,20,.55)'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 2, 12, 7, 0, 0, 7); ctx.fill(); }   // kein Fuß berührt den Boden
  if (e.mtype === 'necromancer') orbitSkulls(e, now);
  const top = e.y - 46 * scale * sy - lift;
  if (e.mtype === 'garmadon') crownOf(e, top);
  if (e.mtype === 'omega') { const f = 0.5 + 0.5 * Math.sin(now / 300); ctx.strokeStyle = `rgba(255,210,120,${0.55 + 0.35 * f})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(e.x, top + 4, 22, 7, 0, 0, 7); ctx.stroke(); ctx.lineWidth = 1; }   // Phase 7: Heiligenschein
  if (m.faction === 'undead' && !e.servant) roleBadge(e, m, top - (e.mtype === 'garmadon' ? 10 : 0));
  if (e.telegraph > 0) telegraphArc(e, m.reach + 10, 0.9, now);   // Ansage: gepunkteter Pixelbogen in Schlagrichtung
  if (e.draw > 0) dottedLine(e.x, e.y - 14, e.aim ?? 0, 70 + (520 - e.draw) / 3, now);
}

function dottedLine(x, y, a, len, now) {                    // Ansage als Pixel-Punktlinie (Schuss, Sturmangriff)
  ctx.fillStyle = `rgba(210,70,48,${0.45 + 0.35 * Math.sin(now / 60)})`;
  for (let r = 18; r < len; r += 10) ctx.fillRect(Math.round(x + Math.cos(a) * r) - 2, Math.round(y + Math.sin(a) * r) - 2, 4, 4);
}
function telegraphArc(e, R, half, now) {
  const a0 = (e.aim ?? 0) - half, n = Math.round(half * R / 5);
  ctx.fillStyle = `rgba(210,70,48,${0.45 + 0.35 * Math.sin(now / 60)})`;
  for (let i = 0; i <= n; i++) { const a = a0 + (2 * half) * i / n; ctx.fillRect(Math.round(e.x + Math.cos(a) * R) - 2, Math.round(e.y - 10 + Math.sin(a) * R * 0.8) - 2, 4, 4); }
}

// Leichen: kurze Sterbeanimation (Treffer → Knien → Fallen), dann liegend, Blutlache wächst.
function drawCorpse(e, now) {
  const age = e.born ? Math.max(0, now - e.born) : 9999;   // born kann nach dem Frame-Zeitstempel liegen (Tod während eines langen Update-Schritts)
  ctx.globalAlpha = clamp(e.life / 1000, 0, 1);
  const pool = Math.min(14, 5 + age / 70);
  ctx.fillStyle = 'rgba(90,18,14,.55)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 3, pool, pool * 0.45, 0, 0, 7); ctx.fill();
  const m = e.mtype && MONSTERS[e.mtype];
  if (!m) {
    shadow(e.x, e.y + 2, 12, .25);
    ctx.fillStyle = e.pal || '#3a3229'; ctx.fillRect(e.x - 13, e.y - 6, 26, 10);
  } else if (m.eye) {                                         // Nutzer S13: das Auge schließt sich und sinkt
    ctx.fillStyle = '#4a1414'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 6, 70 * m.eye, 12 * m.eye + 4, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#2a0a0a'; ctx.fillRect(e.x - 60 * m.eye, e.y - 7, 120 * m.eye, 2);
  } else if (e.mtype === 'carrion_wing') {                     // Phase 6: gefallene Schwinge
    ctx.fillStyle = '#141012'; ctx.fillRect(e.x - 11, e.y - 1, 22, 3); ctx.fillStyle = '#2a2426'; ctx.fillRect(e.x - 3, e.y - 3, 6, 5);
  } else if (['wolf', 'boar', 'bear', 'deer', 'wild_dog', 'bone_hound', 'cow', 'sheep', 'horse'].includes(e.mtype)) {
    const f = SP.beastFrame(e.mtype, m.pal || {}, e.facing === 3 ? 'E' : 'W', age < 160 ? 'a1' : 'dead', 0);
    ctx.save(); ctx.translate(e.x, e.y + 5); ctx.scale(SP.FIGK, SP.FIGK); SP.blit(ctx, f, 0, 0); ctx.restore();
  } else if (e.mtype === 'gorak') {
    const f = SP.bruteFrame(m.pal || {}, 'E', '', 0), k = Math.min(1, age / 500);
    ctx.save(); ctx.translate(e.x, e.y + 6); ctx.rotate(k * Math.PI / 2); SP.blit(ctx, f, 0, 2); ctx.restore();
  } else {
    const spec = SP.monsterSpec(e, m), sc = SP.FIGK * (e.mtype === 'goblin' ? 0.82 : 1) * (m.scale || 1);
    ctx.save(); ctx.translate(e.x, e.y + 6); ctx.scale(sc, sc);
    // S14 Todesablauf (Nutzer: mehr Kampfanimationen): Treffer, in die Knie, zur Seite kippen, liegen
    const kn = SP.drawnOn() ? 'die1' : 'kneel';
    if (age < 120) SP.blit(ctx, SP.humanFrame(spec, 'S', 'hit'), 0, 0);
    else if (age < 300) SP.blit(ctx, SP.humanFrame(spec, 'W', kn), 0, 0);
    else if (age < 440) { ctx.rotate((age - 300) / 140 * Math.PI / 2); SP.blit(ctx, SP.humanFrame(spec, 'W', kn), 0, 0); }
    else SP.blit(ctx, SP.humanFrame(spec, 'W', 'dead'), 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawGrave(e) { const v = (h2(e.x | 0, e.y | 0) * 4) | 0; drawBaked('grave' + v, { ...e, _gv: v }, 96, drawGraveVec); }
// Referenz 4 (Friedhof): Rundstein, Kreuz, Stele, schiefer Stein — Kante im Licht, Riss, Moos am Fuß
function graveShape(x, y, v, k = 1) {
  shadow(x, y + 2, 9 * k, .35);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); if (v === 3) ctx.rotate(-0.12);
  const S = '#4e4a44', L = '#6a655c', D = '#2e2b27';
  ctx.fillStyle = S; ctx.beginPath();
  if (v === 1) { ctx.rect(-2, -24, 5, 27); ctx.rect(-8, -18, 17, 5); }                                         // Kreuz
  else if (v === 2) { ctx.moveTo(-6, 3); ctx.lineTo(-6, -22); ctx.lineTo(0, -28); ctx.lineTo(6, -22); ctx.lineTo(6, 3); }   // Stele
  else { ctx.moveTo(-9, 3); ctx.lineTo(-9, -14); ctx.quadraticCurveTo(0, -25, 9, -14); ctx.lineTo(9, 3); }     // Rundstein
  ctx.fill();
  ctx.fillStyle = L; if (v === 1) ctx.fillRect(-2, -24, 2, 27); else ctx.fillRect(v === 2 ? -6 : -9, -14, 2, 17);   // Licht links
  ctx.fillStyle = D; if (v !== 1) { ctx.fillRect(-4, -10, 8, 1.5); ctx.fillRect(-4, -6, 8, 1.5); ctx.fillRect(2, -16, 1, 5); ctx.fillRect(3, -12, 1, 4); }   // Inschrift, Riss
  ctx.fillStyle = '#3a4a2a'; ctx.fillRect(-8, 0, 6, 3); ctx.fillRect(3, 1, 4, 2);                                // Moos
  ctx.restore();
}
function drawGraveVec(e) {
  graveShape(e.x, e.y, e._gv || 0);
}

// Beute am Boden: dasselbe Pixel-Icon wie im Inventar, mit Seltenheits-Schimmer.
const groundIcons = new Map();
function groundIcon(key) {
  let cv = groundIcons.get(key + SP.drawnOn()); if (cv) return cv;
  if (SP.drawnOn()) { cv = document.createElement('canvas'); cv.width = cv.height = 24; if (iconR(cv.getContext('2d'), ITEMS[key] || {}, key, 24, 24)) { groundIcons.set(key + true, cv); return cv; } }   // S14 Stil R: 24 px, keine Nachpixelung
  cv = document.createElement('canvas'); cv.width = cv.height = 16;
  const tmp = document.createElement('canvas'); tmp.width = tmp.height = 48;
  drawItemIconTo(tmp, key, true);
  const o = cv.getContext('2d', { willReadFrequently: true }); o.imageSmoothingEnabled = true; o.drawImage(tmp, 0, 0, 16, 16);
  SP.pixelize(o, 16, 16); groundIcons.set(key + false, cv); return cv;
}
function drawGroundItem(e, now) {
  const f = Math.round(Math.sin(now / 400 + e.seed) * 1.5) * 2;
  shadow(e.x, e.y + 2, 7, .3);
  const it = ITEMS[e.item.key] || {}, rar = e.item.rar || it.rarity;
  if (rar && rar !== 'common') {
    const col = { uncommon:'137,160,90', rare:'95,146,189', epic:'160,119,187', legendary:'189,148,51', mythic:'150,215,240' }[rar] || '183,171,146';
    ctx.fillStyle = `rgba(${col},${.16 + .08 * Math.sin(now / 300)})`;
    ctx.beginPath(); ctx.arc(e.x, e.y - 7 + f, 12, 0, 7); ctx.fill();
  }
  const A = SP.itemAtlas(e.item.key, it); if (A) { const s = 26 / Math.max(A.width, A.height); ctx.drawImage(A, e.x - A.width * s / 2, e.y - 4 + f - A.height * s, A.width * s, A.height * s); return; }   // Stil F
  ctx.drawImage(groundIcon(e.item.key), e.x - 12, e.y - 20 + f, 24, 24);
}

// Gebäude und Gräber laufen durch dieselbe Pixelisierung wie Props (gecacht je Typ/Zustand).
const bakeCache = new Map();
function drawBaked(key, e, box, fn) {
  let cv = bakeCache.get(key);
  if (!cv) {
    if (bakeCache.size > 400) bakeCache.clear();
    cv = document.createElement('canvas'); cv.width = cv.height = box / 2;
    const o = cv.getContext('2d', { willReadFrequently: true }), saved = ctx;
    o.setTransform(0.5, 0, 0, 0.5, 0, 0); ctx = o;
    try { fn({ ...e, x: box / 2, y: box * 0.73 }); } finally { ctx = saved; }
    o.setTransform(1, 0, 0, 1, 0, 0); SP.pixelize(o, box / 2, box / 2);
    bakeCache.set(key, cv);
  }
  ctx.drawImage(cv, e.x - box / 2, e.y - box * 0.73, box, box);
}
function drawBuilding(e, now) {
  if (e.ghost || !(e.built > 0) || e.type === 'campfire' || e.type === 'smithy') return drawBuildingVec(e, now);
  const b = e.def, box = Math.ceil((Math.max(b.w, b.h) * TS * 1.5 + 40) / 32) * 32;
  const stage = e.built >= 1 ? 3 : e.built > 0.4 ? 2 : 1;
  drawBaked('b|' + e.type + stage + '|' + Math.round((e.cond ?? 1) * 4), e, box, o => drawBuildingVec(o, now));
}
function drawBuildingVec(e, now) {
  const b = e.def, w = b.w * TS, h = b.h * TS;
  const x = e.x - w / 2, y = e.y - h / 2;
  const stage = e.built >= 1 ? 3 : e.built > 0.4 ? 2 : e.built > 0 ? 1 : 0;
  if (e.ghost) { ctx.globalAlpha = .45; }
  shadow(e.x, y + h - 4, w * 0.4, .3);
  if (stage === 0) { ctx.strokeStyle = e.blocked ? 'rgba(200,60,40,.8)' : 'rgba(189,148,51,.8)'; ctx.setLineDash([5, 4]); ctx.strokeRect(x, y, w, h); ctx.setLineDash([]); ctx.globalAlpha = 1; return; }
  if (stage === 1) { ctx.fillStyle = '#463c2c'; ctx.fillRect(x, y + h - 10, w, 10); ctx.fillStyle = '#2f2820'; ctx.fillRect(x, y + h - 10, w, 3); }
  else {
    const dmg = (e.cond ?? 1);
    if (e.type === 'campfire') drawProp({ ...e, type:'campfire' }, now);
    else if (e.type === 'palisade' || e.type === 'gate') {
      ctx.fillStyle = '#43331f';
      for (let i = 0; i < b.w * 2; i++) { const px = x + i * (w / (b.w * 2)); ctx.fillRect(px, y + (e.type === 'gate' ? 6 : 0), w / (b.w * 2) - 2, h - 4); }
      ctx.fillStyle = '#5b452a'; ctx.fillRect(x, y + h * 0.45, w, 3);
    } else if (e.type === 'farm') {
      ctx.fillStyle = '#4b3f26'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#5f7a3a'; for (let j = 0; j < b.h * 2; j++) for (let i = 0; i < b.w * 2; i++) ctx.fillRect(x + 6 + i * 14, y + 6 + j * 14, 5, 5);
    } else if (e.type === 'pasture') {                             // S14: Weide mit Zaun und Unterstand in der Ecke
      ctx.fillStyle = '#4e6a32'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#5c7a3a'; for (let i = 0; i < 14; i++) ctx.fillRect(x + 4 + (i * 37) % (w - 8), y + 6 + (i * 23) % (h - 10), 3, 2);
      ctx.fillStyle = '#5b452a'; ctx.fillRect(x, y, w, 2); ctx.fillRect(x, y + h - 2, w, 2); ctx.fillRect(x, y, 2, h); ctx.fillRect(x + w - 2, y, 2, h);
      ctx.fillStyle = '#43331f'; for (let i = 0; i <= 4; i++) { ctx.fillRect(x + i * (w - 3) / 4, y - 3, 3, 6); ctx.fillRect(x + i * (w - 3) / 4, y + h - 4, 3, 6); }
      ctx.fillStyle = '#3e3020'; ctx.fillRect(x + w - 30, y + 4, 26, 18); ctx.fillStyle = '#6b4a2a'; ctx.beginPath(); ctx.moveTo(x + w - 33, y + 8); ctx.lineTo(x + w - 17, y - 4); ctx.lineTo(x + w - 1, y + 8); ctx.fill();
      ctx.fillStyle = '#c8b070'; ctx.fillRect(x + w - 26, y + 14, 8, 6);   // Heu im Unterstand
    } else if (e.type === 'well') { drawProp({ ...e, type:'well' }, now); }
    else if (e.type === 'workbench' || e.type === 'storage') {
      ctx.fillStyle = '#4b3a25'; ctx.fillRect(x, y + 6, w, h - 8);
      ctx.fillStyle = '#5b452a'; ctx.fillRect(x, y + 6, w, 4);
      ctx.fillStyle = '#2b2116'; ctx.fillRect(x + 4, y + h - 12, w - 8, 3);
    } else {
      // Hütte / Zelt / Schmiede / Turm
      const roof = e.type === 'smithy' ? '#4a3128' : e.type === 'watchtower' ? '#3e3a33' : '#5a3b27';
      ctx.fillStyle = '#463726'; ctx.fillRect(x, y + h * 0.35, w, h * 0.65);
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - 4, y + h * 0.4); ctx.lineTo(e.x, y - 6); ctx.lineTo(x + w + 4, y + h * 0.4); ctx.fill();
      ctx.fillStyle = '#231b12'; ctx.fillRect(e.x - 6, y + h - 16, 12, 16);
      if (e.type === 'smithy') { ctx.fillStyle = `rgba(230,120,50,${.4 + .2 * Math.sin(now / 200)})`; ctx.fillRect(x + 4, y + h * 0.55, 8, 8); }
      if (e.type === 'watchtower') { ctx.fillStyle = '#3a3128'; ctx.fillRect(x + 4, y - 18, w - 8, 14); }
    }
    if (dmg < 0.99) { ctx.fillStyle = `rgba(0,0,0,${(1 - dmg) * 0.45})`; ctx.fillRect(x, y, w, h); }
  }
  ctx.globalAlpha = 1;
}

function drawProjectile(p) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
  if (p.kind === 'arrow') { ctx.fillStyle = OUT_COL; ctx.fillRect(-11, -2, 24, 4); ctx.fillStyle = '#b8ab8e'; ctx.fillRect(-8, -1, 16, 2);
    ctx.fillStyle = '#9a9488'; ctx.fillRect(8, -2, 4, 4); ctx.fillStyle = '#7a2a20'; ctx.fillRect(-10, -1, 4, 2); }
  else if (p.kind === 'fire') {                                      // Pixel-Feuerball mit Schweif
    ctx.fillStyle = 'rgba(140,50,20,.7)'; ctx.fillRect(-14, -2, 6, 4); ctx.fillRect(-10, -4, 4, 8);
    ctx.fillStyle = '#c2582a'; ctx.fillRect(-6, -6, 12, 12); ctx.fillRect(-8, -4, 16, 8);
    ctx.fillStyle = '#f0b050'; ctx.fillRect(-4, -4, 8, 8); ctx.fillStyle = '#ffe6a8'; ctx.fillRect(0, -2, 4, 4);
  }
  else if (p.kind === 'bullet') {                                    // S13: Magitech-Kugel mit Glutspur
    ctx.fillStyle = 'rgba(255,190,90,.35)'; ctx.fillRect(-22, -1, 18, 2); ctx.fillStyle = '#c89a4a'; ctx.fillRect(-4, -2, 7, 4); ctx.fillStyle = '#fff0c0'; ctx.fillRect(1, -1, 2, 2); }
  else if (p.kind === 'stone') { ctx.fillStyle = OUT_COL; ctx.fillRect(-3, -3, 6, 6); ctx.fillStyle = '#8a8478'; ctx.fillRect(-2, -2, 4, 4); }   // Schleuderstein
  else if (p.kind === 'knife' || p.kind === 'taxe') {                  // Wurfwaffen drehen sich im Flug
    ctx.rotate(performance.now() / 45); ctx.fillStyle = OUT_COL; ctx.fillRect(-8, -2, 16, 4); ctx.fillStyle = '#5a4030'; ctx.fillRect(-7, -1, 6, 2);
    ctx.fillStyle = '#b8b2a4'; if (p.kind === 'taxe') ctx.fillRect(2, -5, 5, 10); else ctx.fillRect(-1, -1, 8, 2); }
  else if (p.kind === 'bolt') {                                      // Armbrustbolzen: kurz, dick, Eisenspitze
    ctx.fillStyle = OUT_COL; ctx.fillRect(-7, -2, 16, 4); ctx.fillStyle = '#8a7658'; ctx.fillRect(-5, -1, 10, 2);
    ctx.fillStyle = '#6d6154'; ctx.fillRect(5, -2, 4, 4); ctx.fillStyle = '#c9bfa6'; ctx.fillRect(-7, -2, 2, 4); }
  else if (p.kind === 'light') {                                     // Nutzer S13: Lichtpfeil der Engel
    ctx.fillStyle = 'rgba(255,220,140,.45)'; ctx.fillRect(-18, -2, 12, 4); ctx.fillStyle = '#fff0b0'; ctx.fillRect(-8, -2, 18, 4); ctx.fillStyle = '#ffffff'; ctx.fillRect(4, -1, 8, 2); }
  else if (p.kind === 'frost') {                                     // Hrodvars Eislanze: lange, blasse Spitze mit Frostschweif
    ctx.fillStyle = 'rgba(150,200,240,.45)'; ctx.fillRect(-18, -2, 10, 4);
    ctx.fillStyle = OUT_COL; ctx.fillRect(-9, -3, 22, 6); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(-8, -2, 18, 4);
    ctx.fillStyle = '#e8f6ff'; ctx.fillRect(4, -1, 8, 2); ctx.fillRect(12, -1, 3, 2); }
  else if (p.kind === 'spark') {                                     // Funke des Zauberstabs
    ctx.fillStyle = 'rgba(120,170,230,.5)'; ctx.fillRect(-10, -2, 8, 4);
    ctx.fillStyle = '#8fb7e8'; ctx.fillRect(-3, -4, 8, 8); ctx.fillStyle = '#e8f4ff'; ctx.fillRect(-1, -2, 4, 4); }
  else {                                                             // Schattenblitz
    ctx.fillStyle = 'rgba(60,34,70,.7)'; ctx.fillRect(-14, -2, 8, 4);
    ctx.fillStyle = '#5b3a6b'; ctx.fillRect(-6, -6, 12, 12); ctx.fillRect(-8, -4, 16, 8);
    ctx.fillStyle = '#b89ad0'; ctx.fillRect(-2, -2, 4, 4);
  }
  ctx.restore();
}

function drawFx(now) {
  for (const f of S.fx) {
    const t = 1 - f.life / f.maxLife;
    ctx.globalAlpha = clamp(f.life / f.maxLife, 0, 1);
    if (f.type === 'blood') { const s = f.s > 2.7 ? 4 : 2; ctx.fillStyle = s > 2 ? '#7a1812' : '#9a241a'; ctx.fillRect(Math.round(f.x), Math.round(f.y), s, s); }
    else if (f.type === 'spark') { ctx.fillStyle = '#e3c07a'; ctx.fillRect(f.x, f.y, 2, 2); }
    else if (f.type === 'dust') { const s = Math.round(f.s + t * 4) & ~1; ctx.fillStyle = 'rgba(160,150,130,.45)'; ctx.fillRect(f.x - s, f.y - s / 2, s * 2, s); ctx.fillRect(f.x - s / 2, f.y - s, s, s * 2); }
    else if (f.type === 'heal') {                          // Heilung: kleine goldene Pluszeichen steigen auf
      const X = Math.round(f.x), Y = Math.round(f.y); ctx.fillStyle = '#e8d890'; ctx.fillRect(X - 2, Y, 6, 2); ctx.fillRect(X, Y - 2, 2, 6); }
    else if (f.type === 'bone') { const s = f.s > 2.7 ? 4 : 2; ctx.fillStyle = s > 2 ? '#cfc6b0' : '#a79f8b'; ctx.fillRect(Math.round(f.x), Math.round(f.y), s, s / 2 + 1); }
    else if (f.type === 'impact' || f.type === 'crit') {  // Aufprall: Pixelstern quer zur Schlagrichtung, Krit größer mit Ring
      const k = t, big = f.type === 'crit', L = Math.round((big ? 8 : 5) * f.s * (0.4 + k)) * 2, X = Math.round(f.x), Y = Math.round(f.y);
      ctx.fillStyle = k < 0.35 ? '#ffffff' : big ? '#ffd27a' : '#f0e6c8';
      const ca = Math.cos(f.a), sa = Math.sin(f.a);
      for (let i = 2; i <= L; i += 2) { ctx.fillRect(X - sa * i - 1, Y + ca * i - 1, 2, 2); ctx.fillRect(X + sa * i - 1, Y - ca * i - 1, 2, 2); }
      for (let i = 2; i <= L * 0.6; i += 2) ctx.fillRect(X + ca * i - 1, Y + sa * i - 1, 2, 2);
      if (k < 0.3) ctx.fillRect(X - 3, Y - 3, 6, 6);
      if (big) for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2, r = 6 + k * 22; ctx.fillRect(Math.round(X + Math.cos(an) * r) - 1, Math.round(Y + Math.sin(an) * r * 0.7) - 1, 2, 2); }
    }
    else if (f.type === 'shadow') { ctx.fillStyle = 'rgba(110,74,125,.8)'; ctx.fillRect(f.x, f.y, 3, 3); }
    else if (f.type === 'fire') { ctx.fillStyle = `rgba(${230 - t * 80 | 0},${140 - t * 90 | 0},60,.9)`; ctx.fillRect(f.x, f.y, f.s, f.s); }
    else if (f.type === 'frost') { ctx.fillStyle = 'rgba(190,230,250,.85)'; ctx.fillRect(f.x, f.y, 3, 3); }
    else if (f.type === 'necro') { ctx.fillStyle = 'rgba(78,143,122,.7)'; ctx.fillRect(f.x, f.y, 3, 3); }
    else if (f.type === 'ghost') {                         // Nachbild der Ausweichrolle: helle Silhouette der gerollten Figur
      const pl = S.player; if (pl) { const tk = SP.humanFrame(SP.humanSpec(pl), 'S', 'tuck'), fr = Object.assign(SP.flashOf(tk), { px: tk.px, ox: tk.ox, oy: tk.oy });
        ctx.globalAlpha *= 0.3; SP.blit(ctx, fr, f.x, f.y - 8); } }
    else if (f.type === 'shock') {                         // Bodenbeben: Staubring breitet sich aus
      const r = 14 + t * 110; ctx.fillStyle = f.ice ? (t < 0.5 ? '#bfe3f5' : '#7fb0c8') : t < 0.5 ? '#8a7a5a' : '#5a4d38';   // ice: Hrodvars Eiskreis
      for (let i = 0; i < 40; i++) { const an = i / 40 * Math.PI * 2, j = (i * 7) % 3 * 2;
        ctx.fillRect(Math.round(f.x + Math.cos(an) * (r + j)) - 2, Math.round(f.y + Math.sin(an) * (r + j) * 0.6) - 2, 4, 4); } }
    else if (f.type === 'ring') {                          // Segen/Stärkung: Pixelring, der sich ausbreitet
      ctx.fillStyle = '#d6c696'; const r = 6 + t * 40;
      for (let i = 0; i < 20; i++) { const an = i / 20 * Math.PI * 2; ctx.fillRect(Math.round(f.x + Math.cos(an) * r) - 1, Math.round(f.y + Math.sin(an) * r * 0.55) - 1, 2, 2); } }
    ctx.globalAlpha = 1;
  }
}

// ---------------- Licht & Wetter ----------------
export function ambient() {
  const h = S.minute / 60;
  if (DUNGEONS[S.map] && !DUNGEONS[S.map].open) return 0.82;   // Himmelsinsel: Tageslicht
  let a = 0;
  if (h < 5) a = 0.72; else if (h < 7) a = 0.72 - (h - 5) / 2 * 0.62;
  else if (h < 17) a = 0.08; else if (h < 20) a = 0.08 + (h - 17) / 3 * 0.5;
  else a = 0.58 + (h - 20) / 4 * 0.18;
  a += { rain: 0.12, fog: 0.06, cloudy: 0.05, bloodrain: 0.14, sandstorm: 0.08, snow: 0.03 }[S.weather] || 0;
  a += (REGION[curRegion] && REGION[curRegion].dark) || 0;          // Wald und Totenreich sind dunkler
  return clamp(a, 0, 0.86);
}
// Lichtquellen stehen still: einmal je Karte sammeln statt jedes Bild alle ~6500 Objekte zu prüfen.
// Neu gesammelt, wenn sich die Objektzahl der Karte ändert (Bau, Abriss, Laden) oder die Karte wechselt.
let lightCache = { map: null, n: -1, list: [] };
function staticLights() {
  const arr = S.ents[S.map], n = S.settlement ? S.settlement.buildings.reduce((k, b) => k + (b.built >= 1), 0) : 0, now = performance.now();   // fertige Bauten
  // Phase 20: früher Schlüssel = Objektzahl — jede verschwundene Blutspur ließ alle ~9000 Objekte neu prüfen (~0,5 ms).
  // Jetzt: Kartenwechsel, neuer Bau, sonst höchstens alle 3 s (neue Fackeln, z. B. Fest, leuchten spätestens dann).
  if (lightCache.map === S.map && lightCache.n === n && now - (lightCache.t || 0) < 3000) return lightCache.list;
  const list = [];
  for (const e of arr) {
    if (e.kind === 'prop' && (e.type === 'torch' || e.type === 'campfire_static' || e.type === 'lantern')) list.push({ x: e.x, y: e.y, r: e.type === 'campfire_static' ? 140 : 95 });
    if (e.kind === 'building' && e.type === 'campfire' && e.built >= 1) list.push({ x: e.x, y: e.y, r: 150 });
    if (e.kind === 'building' && e.type === 'smithy' && e.built >= 1) list.push({ x: e.x, y: e.y, r: 110 });
    if (e.kind === 'prop' && e.type === 'shrine') list.push({ x: e.x, y: e.y, r: 90 });
    if (e.kind === 'prop' && e.type === 'candles') list.push({ x: e.x, y: e.y - 8, r: 60 });
    if (e.kind === 'prop' && (e.type === 'hearth' || e.type === 'forge')) list.push({ x: e.x, y: e.y - 8, r: 80 });
  }
  lightCache = { map: S.map, n, list, t: now };
  return list;
}
// Licht als vorgemalte Stempel (Radialverlauf einmal gebacken, danach nur drawImage) — vorher zwei createRadialGradient
// je Lampe und Bild, ~0,7–1,0 ms in beleuchteten Städten (Phase 20).
const stamp = stops => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return c; };
let HOLE = null, WARM = null;
function drawLight(now) {
  HOLE ||= stamp([[0, 'rgba(0,0,0,1)'], [0.55, 'rgba(0,0,0,.72)'], [1, 'rgba(0,0,0,0)']]); WARM ||= stamp([[0, 'rgba(210,140,60,.10)'], [1, 'rgba(0,0,0,0)']]);
  const a = ambient();
  if (a < 0.06) return;
  dctx.setTransform(1, 0, 0, 1, 0, 0);
  dctx.clearRect(0, 0, dark.width, dark.height);          // sonst summiert sich die Dunkelheit jeden Frame
  dctx.setTransform(dpr / 2, 0, 0, dpr / 2, 0, 0);
  const night = S.map === 'deep' ? '8,12,18' : DUNGEONS[S.map] && !DUNGEONS[S.map].open ? '6,8,10' : (S.minute / 60 > 18 || S.minute / 60 < 6) ? '10,14,28' : '20,18,14';
  dctx.globalCompositeOperation = 'source-over';
  dctx.fillStyle = `rgba(${night},${a})`;
  dctx.fillRect(0, 0, W, H);
  dctx.globalCompositeOperation = 'destination-out';
  const pl = S.player;
  const lights = [...staticLights()];
  if (pl && pl.map === S.map) lights.push({ x: pl.x, y: pl.y, r: DUNGEONS[S.map] ? 150 : 120 });
  if (isNight()) for (const b of HOUSES) if (b.map === S.map && !HB.BTYPES[b.type]?.noWin && HB.wearOf(b) < 2)   // erleuchtete Fenster werfen warmes Licht auf die Straße
    lights.push({ x: (b.x + b.w / 2) * TS, y: (b.y + b.h) * TS + 6, r: b.type === 'tavern' ? 110 : 70 });
  for (const l of lights) {
    const sx = (l.x - cam.x) * cam.zoom, sy = (l.y - cam.y) * cam.zoom;
    if (sx < -260 || sy < -260 || sx > W + 260 || sy > H + 260) continue;
    const r = l.r * cam.zoom * (0.94 + 0.06 * Math.sin(now / 160 + l.x));
    dctx.drawImage(HOLE, sx - r, sy - r, r * 2, r * 2);
  }
 
  dctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(dark, 0, 0, dark.width * 2, dark.height * 2); ctx.imageSmoothingEnabled = false;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // warmer Lichtstich
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    const sx = (l.x - cam.x) * cam.zoom, sy = (l.y - cam.y) * cam.zoom;
    if (sx < -200 || sy < -200 || sx > W + 200 || sy > H + 200) continue;
    const r = l.r * cam.zoom * 0.8;
    ctx.drawImage(WARM, sx - r, sy - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
}

const rainDrops = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random() }));
// Nutzer S13: kleine Animationen am Himmel — Luftschiffe über dem Hochreich (mit Schatten), Vogelschwärme am Tag im Freien
function drawSkyLife(now) {
  if (S.map !== 'world' || !S.player) return;
  const P = S.player, day = S.minute > 360 && S.minute < 1170;
  if (curRegion === 'aurel') for (let i = 0; i < 2; i++) {
    const x = P.x + ((now / 55 + i * 1300) % 2600) - 1300, y = P.y - 260 + i * 190, s = i ? 0.8 : 1;
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(x + 40, y + 260, 60 * s, 14 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.ellipse(x, y, 58 * s, 22 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#c8a050'; ctx.fillRect(x - 58 * s, y - 2, 116 * s, 4 * s); ctx.fillStyle = '#9a7a4a'; ctx.beginPath(); ctx.ellipse(x - 10 * s, y - 6 * s, 40 * s, 10 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 16 * s, y + 24 * s, 32 * s, 9 * s); ctx.fillStyle = '#5a4630'; ctx.fillRect(x - 12 * s, y + 18 * s, 2, 7 * s); ctx.fillRect(x + 10 * s, y + 18 * s, 2, 7 * s);
    ctx.fillStyle = '#e8c070'; for (let k = -12; k <= 10; k += 6) ctx.fillRect(x + k * s, y + 27 * s, 2, 2);
    const pr = (now / 60) % 6.283; ctx.fillStyle = '#4a4440'; ctx.fillRect(x + 58 * s, y - 1 + Math.sin(pr) * 8 * s, 3, 3);
  }
  if (day && !['aurel', 'deadland', 'blight'].includes(curRegion) && !DUNGEONS[S.map]) {
    const cyc = (now / 26000) % 1, bx = P.x - 700 + cyc * 1400, by = P.y - 240 + Math.sin(now / 5000) * 60;
    ctx.strokeStyle = 'rgba(30,26,22,.7)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { const x = bx - (i % 3) * 16 - (i > 2 ? 8 : 0), y = by + (i % 3) * 7 * (i > 2 ? -1 : 1), f = Math.sin(now / 120 + i) * 3;
      ctx.beginPath(); ctx.moveTo(x - 5, y - f); ctx.lineTo(x, y); ctx.lineTo(x + 5, y - f); ctx.stroke(); }
  }
}
// S14 Brand: Flammenzungen über dem Dach, Glut in den Fenstern, Rauchsäule — Größe nach Hitze (0–100). Pixelblöcke statt Verläufe.
function drawFires(now) {
  for (const F of S.fires || []) {
    const b = HOUSES.find(h => h.id === F.house); if (!b || b.map !== S.map) continue;
    const k = Math.min(1, F.heat / 100), x0 = b.x * TS, w = b.w * TS, top = b.y * TS - 6, n = 3 + Math.round(k * 6);
    ctx.fillStyle = `rgba(255,120,40,${0.10 + k * 0.14})`; ctx.fillRect(x0 - 10, top - 10, w + 20, b.h * TS + 20);   // Glutschein
    for (let i = 0; i < n; i++) {                                    // Flammenzungen: drei Farbringe, flackernd
      const fx0 = x0 + 8 + ((i * 37 + b.seed) % Math.max(10, w - 16)), fl = 14 + k * 30 + Math.sin(now / 90 + i * 1.7) * 6, fw = 8 + k * 6;
      for (const [c, s] of [['#b8401c', 1], ['#e07828', 0.7], ['#f6c868', 0.38]]) { ctx.fillStyle = c; const hh = fl * s, ww = fw * s;
        ctx.beginPath(); ctx.moveTo(fx0 - ww, top + 8); ctx.lineTo(fx0 + Math.sin(now / 120 + i) * 3, top + 8 - hh); ctx.lineTo(fx0 + ww, top + 8); ctx.fill(); }
    }
    for (let i = 0; i < 6; i++) {                                    // Rauchsäule, treibt nach Osten
      const t = ((now / 2400 + i / 6) % 1), sx = x0 + w / 2 + t * 40 + Math.sin(now / 700 + i) * 6, sy = top - 10 - t * (90 + k * 80), r = 8 + t * 18;
      ctx.fillStyle = `rgba(40,36,34,${(1 - t) * (0.25 + k * 0.35)})`; ctx.fillRect(sx - r, sy - r * 0.7, r * 2, r * 1.4);
    }
  }
}
function drawWeather(now) {
  if (DUNGEONS[S.map]) return;
  if (seasonOf() === 3 && S.weather !== 'snow') { ctx.fillStyle = 'rgba(205,215,235,.07)'; ctx.fillRect(0, 0, W, H); }   // S14: Winter — kaltes Licht
  if (S.weather === 'rain') {
    ctx.strokeStyle = 'rgba(170,190,210,.25)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of rainDrops) {
      const x = ((d.x + now / 9000) % 1) * W, y = ((d.y + now / (900 / d.s)) % 1) * H;
      ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 11 * d.s);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(30,40,55,.18)'; ctx.fillRect(0, 0, W, H);
  } else if (S.weather === 'fog') {
    for (let i = 0; i < 3; i++) {
      const off = (now / (7000 + i * 2500)) % 1;
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, 'rgba(150,155,150,0)'); g.addColorStop(clamp(off, 0.05, 0.95), 'rgba(150,158,152,.10)'); g.addColorStop(1, 'rgba(150,155,150,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  } else if (S.weather === 'cloudy') { ctx.fillStyle = 'rgba(40,42,45,.12)'; ctx.fillRect(0, 0, W, H); }
  else if (S.weather === 'bloodrain') {                   // Referenz 4: Blutregen — dunkelrote Schlieren, roter Himmel
    ctx.strokeStyle = 'rgba(175,32,30,.55)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (const d of rainDrops) { const x = ((d.x + now / 11000) % 1) * W, y = ((d.y + now / (1100 / d.s)) % 1) * H; ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 9 * d.s); }
    ctx.stroke(); ctx.fillStyle = 'rgba(80,6,8,.3)'; ctx.fillRect(0, 0, W, H);
  } else if (S.weather === 'sandstorm') {                 // Sandsturm: waagrechte Schwaden, ockerne Sicht
    ctx.fillStyle = 'rgba(150,110,60,.26)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(210,170,110,.5)';
    for (const d of rainDrops) { const x = ((d.x + now / (700 / d.s)) % 1) * W, y = ((d.y + Math.sin(now / 900 + d.x * 9) * 0.01) % 1) * H; ctx.fillRect(Math.round(x), Math.round(y), 8 + 10 * d.s, 1 + (d.s > 1.2)); }
  } else if (S.weather === 'snow') {                      // Schnee: große, langsame Flocken
    ctx.fillStyle = 'rgba(230,236,240,.75)';
    for (const d of rainDrops) { const x = ((d.x + now / 20000 + Math.sin(now / 1500 + d.y * 20) * 0.01) % 1) * W, y = ((d.y + now / (6000 / d.s)) % 1) * H; const sz = d.s > 1.2 ? 3 : 2; ctx.fillRect(Math.round(x), Math.round(y), sz, sz); }
    ctx.fillStyle = 'rgba(200,210,225,.08)'; ctx.fillRect(0, 0, W, H);
  }
  const R = REGION[curRegion];
  if (S.map === 'world' && R) {
    if (R.fog) { ctx.fillStyle = R.fog; ctx.fillRect(0, 0, W, H); }
    const col = R.mote || R.dust;
    if (col) {                                            // wenige, ruhige Partikel: Asche/Schnee fallen, Glut steigt, Staub treibt
      ctx.fillStyle = col; const n = R.dust ? 40 : 70;
      for (let i = 0; i < n; i++) { const d = rainDrops[i];
        const x = ((d.x + now / (R.dust ? 14000 : 30000) * d.s + Math.sin(now / 2000 + i) * 0.01) % 1) * W;
        const y = R.rise ? (1 - ((d.y + now / 18000 * d.s) % 1)) * H : R.fall ? ((d.y + now / 16000 * d.s) % 1) * H : d.y * H;
        const sz = d.s > 1.2 ? 3 : 2; ctx.globalAlpha = R.dust ? 0.25 : 0.55; ctx.fillRect(Math.round(x), Math.round(y), sz, sz); }
      ctx.globalAlpha = 1;
    }
  }
  // Vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

function drawFloats() {
  ctx.textAlign = 'center';
  for (const f of S.floats) {
    const sx = (f.x - cam.x) * cam.zoom, sy = (f.y - f.rise - cam.y) * cam.zoom;
    const a = clamp(f.life / f.maxLife, 0, 1);
    ctx.font = `${f.big ? 700 : 400} ${(f.big ? 20 : 15) * cam.zoom * 0.85}px Cinzel, serif`;
    ctx.fillStyle = `rgba(0,0,0,${a * .6})`; ctx.fillText(f.text, sx + 1, sy + 1);
    ctx.fillStyle = f.color.replace('ALPHA', a);
    ctx.fillText(f.text, sx, sy);
  }
  ctx.textAlign = 'left';
}

// ---------------- Kleine Zeichner für UI ----------------
// Porträt: Brustbild aus demselben Pixel-Sprite (Kopf + Schultern), ganzzahlig vergrößert.
export function drawPortraitTo(canvas, ch) {
  const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, w, h);
  c.fillStyle = '#14110d'; c.fillRect(0, 0, w, h);
  const g = c.createRadialGradient(w * .5, h * .35, 2, w * .5, h * .5, w * .8);
  g.addColorStop(0, 'rgba(90,76,56,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  if (ch) {
    const f = SP.humanFrame(ch.spec || SP.humanSpec(ch), 'S', 'i0'), fine = f.px < 2, q = fine ? 1 / f.px : 1;   // Porträt: Kopf und Schultern (Ausschnitt in 1-Welt-Pixeln, je Raster skaliert)
    const sx = Math.round((fine ? 7 : 2) * q), sy = fine ? 1 : 0, cw = Math.round((fine ? 26 : 16) * q), chh = Math.round((fine ? 26 : 15) * q), k = Math.max(1, Math.floor(Math.min(w / cw, h / chh)));
    c.drawImage(f, sx, sy, cw, chh, Math.round((w - cw * k) / 2), h - chh * k, cw * k, chh * k);
  }
  c.strokeStyle = 'rgba(0,0,0,.5)'; c.strokeRect(0.5, 0.5, w - 1, h - 1);
}

// Ganzfigur (Charakterbogen): Vorder-, Seiten- und Rückansicht mit aktueller Ausrüstung
export function drawFigureTo(canvas, ch) {
  const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  c.imageSmoothingEnabled = false; c.clearRect(0, 0, w, h);
  const spec = ch.spec || SP.humanSpec(ch), k = Math.max(1, Math.floor(h / 26));
  ['S', 'W', 'N'].forEach((d, i) => {
    const f = SP.humanFrame(spec, d, 'i0'), cx = Math.round(w / 2 + (i - 1) * 18 * k), sc = k * (f.px || 2) / 2;   // 1 alter Sprite-Pixel = k
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(cx - 5 * k, h - 3 * k, 10 * k, k);
    c.drawImage(f, Math.round(cx - f.ox * sc), Math.round(h - k - f.oy * sc), Math.round(f.width * sc), Math.round(f.height * sc));
  });
}

// Item-Icons: Vektor-Vorzeichnung, dann auf ein grobes Raster pixelisiert (Kontur + Randlicht) wie die Figuren.
const iconCache = new Map();
// S14 Stil R (Nutzer: „den Stil auf alles“): Waffen-Symbol = das Waffen-Sprite schräg; Rüstung = die Probefigur mit genau diesem Teil,
// auf Rumpf, Kopf oder Schild zugeschnitten — das Symbol zeigt, wie es am Körper aussieht. Pixel bleiben scharf (ganzzahlig vergrößert).
const MANNEQUIN = { kind: 'player', pal: { skin: '#b89878', hair: '#2b2118', cloth: '#3a3026' }, seed: 1 };   // seed 1: kein Zufallsumhang
function iconR(c, it, key, w, h) {
  let src = null;
  const IR = ICON_R[key];
  if (IR) { const [pal, rows] = IR; src = document.createElement('canvas'); src.width = src.height = 16; const t = src.getContext('2d');   // gezeichnetes 16×16-Symbol
    rows.forEach((r, y) => { for (let x = 0; x < 16; x++) { const ch = r[x] || '.'; if (ch === '.') continue; t.fillStyle = ch === 'o' ? '#1c1512' : pal[ch] || '#ff00ff'; t.fillRect(x, y, 1, 1); } }); }
  else if (it.slot === 'weapon') { const W = SP.weaponSprite(key, it.rarity, it.holy, it.wtype), L = Math.hypot(W.cv.width, W.cv.height), n = Math.ceil(L * 0.72) + 2;
    src = document.createElement('canvas'); src.width = src.height = n; const t = src.getContext('2d'); t.imageSmoothingEnabled = false;
    t.translate(n / 2, n / 2); t.rotate(it.wtype === 'bow' ? -0.35 : -Math.PI / 4); t.drawImage(W.cv, -W.cv.width / 2, -W.cv.height / 2); }
  else if (['chest', 'head', 'offhand', 'cloak'].includes(it.slot)) {
    const f = SP.humanFrameR(SP.humanSpec({ ...MANNEQUIN, equip: { [it.slot]: { key } } }), it.slot === 'offhand' ? 'W' : 'S', it.slot === 'offhand' ? 'guard' : 'i0');
    const [y0, y1] = it.slot === 'head' ? [0, 12] : it.slot === 'offhand' ? [12, 30] : it.slot === 'cloak' ? [3, 46] : [11, 38];
    const band = document.createElement('canvas'); band.width = f.width; band.height = y1 - y0; const bc = band.getContext('2d', { willReadFrequently: true }); bc.drawImage(f, 0, -y0);
    const d = bc.getImageData(0, 0, band.width, band.height).data; let x0 = band.width, x1 = 0;   // S14: Zuschnitt nach Inhalt (Rahmen 40, breite Rüstung)
    for (let i = 3; i < d.length; i += 4) if (d[i]) { const x = (i >> 2) % band.width; if (x < x0) x0 = x; if (x > x1) x1 = x; }
    if (x1 < x0) return false;
    if (it.slot === 'offhand') { const dx = (f.width - 32) / 2; x0 = 5 + dx; x1 = 19 + dx; }   // Schild: nur die Nebenhand, nicht der Körper
    src = document.createElement('canvas'); src.width = x1 - x0 + 1; src.height = band.height; src.getContext('2d').drawImage(band, -x0, 0); }
  if (!src) return false;
  const k0 = Math.min((w - 2) / src.width, (h - 2) / src.height), k = k0 >= 2 ? Math.floor(k0) : k0, dw = Math.round(src.width * k), dh = Math.round(src.height * k);   // ab 2× ganzzahlig
  c.imageSmoothingEnabled = false; c.drawImage(src, Math.round((w - dw) / 2), Math.round((h - dh) / 2), dw, dh); return true;
}
export function drawItemIconTo(canvas, key, raw) {
  const it = ITEMS[key]; const c = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 48, h = canvas.height = canvas.clientHeight || 48;
  c.clearRect(0, 0, w, h); if (!it) return;
  if (SP.drawnOn() && iconR(c, it, key, w, h)) return;               // S14 Stil R: Symbol aus dem echten Sprite
  if (raw) return drawItemVec(c, it, key, w, h);
  const A = SP.itemAtlas(key, it); if (A) { const s = Math.min((w - 4) / A.width, (h - 4) / A.height), dw = A.width * s, dh = A.height * s; c.imageSmoothingEnabled = false; c.drawImage(A, (w - dw) / 2, (h - dh) / 2, dw, dh); return; }   // Stil F: Symbol aus dem Blatt
  const ck = key + '|' + w + 'x' + h;
  let px = iconCache.get(ck);
  if (!px) {
    const n = Math.max(12, Math.round(w / 3)), m = Math.max(12, Math.round(h / 3));
    const src = document.createElement('canvas'); src.width = w; src.height = h;
    drawItemVec(src.getContext('2d'), it, key, w, h);
    px = document.createElement('canvas'); px.width = n; px.height = m;
    const t = px.getContext('2d', { willReadFrequently: true }); t.imageSmoothingEnabled = true; t.drawImage(src, 0, 0, n, m);
    SP.pixelize(t, n, m);
    iconCache.set(ck, px);
  }
  c.imageSmoothingEnabled = false; c.drawImage(px, 0, 0, w, h);
}
function drawItemVec(c, it, key, w, h) {
  c.save(); c.translate(w / 2, h / 2); const s = w / 48; c.scale(s, s);
  c.shadowColor = 'rgba(6,5,4,0.9)'; c.shadowBlur = 1.6; c.shadowOffsetY = 1;   // einheitliche dunkle Kontur wie bei den Referenz-Assets
  const metal = it.rarity === 'legendary' ? '#d8b25a' : it.rarity === 'epic' ? '#b39b6a' : '#a8a196';
  const wood = '#5b452a';
  if (it.slot === 'weapon') {
    c.rotate(-0.7);
    if (it.wtype === 'bow') { c.strokeStyle = wood; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 13, -1.8, 1.8); c.stroke(); c.strokeStyle = '#ddd3c0'; c.lineWidth = 1; c.beginPath(); c.moveTo(-3, -12.8); c.lineTo(-3, 12.8); c.stroke(); }
    else if (it.wtype === 'staff') { c.fillStyle = wood; c.fillRect(-2, -18, 4, 34);   // Zauberstab: blauer Kristall
      c.fillStyle = '#3f6fb0'; c.beginPath(); c.moveTo(0, -25); c.lineTo(4, -19); c.lineTo(0, -13); c.lineTo(-4, -19); c.closePath(); c.fill();
      c.fillStyle = 'rgba(150,200,255,.8)'; c.beginPath(); c.moveTo(0, -23); c.lineTo(2, -19); c.lineTo(0, -16); c.closePath(); c.fill(); }
    else if (it.wtype === 'axe') { c.fillStyle = wood; c.fillRect(-2, -16, 4, 32); c.fillStyle = metal; c.beginPath(); c.moveTo(2, -14); c.lineTo(15, -8); c.lineTo(15, 2); c.lineTo(2, 0); c.fill(); }
    else if (it.wtype === 'spear') { c.fillStyle = wood; c.fillRect(-1.5, -14, 3, 32); c.fillStyle = metal; c.beginPath(); c.moveTo(-4, -14); c.lineTo(0, -22); c.lineTo(4, -14); c.fill(); }
    else if (it.wtype === 'mace') { c.fillStyle = wood; c.fillRect(-2, -8, 4, 26); c.fillStyle = metal; c.beginPath(); c.arc(0, -12, 7, 0, 7); c.fill(); }
    else if (it.wtype === 'whip') { c.fillStyle = '#3a2a1c'; c.fillRect(-2, 8, 4, 12); c.fillStyle = metal;   // Kettenpeitsche: Griff, Kettenglieder im Bogen
      for (let k = 0; k < 7; k++) c.fillRect(Math.round(Math.sin(k * 0.8) * 6) - 1.5, 6 - k * 4, 3, 3); }
    else { c.fillStyle = metal; c.fillRect(-2.5, -18, 5, 28); c.beginPath(); c.moveTo(-2.5, -18); c.lineTo(0, -23); c.lineTo(2.5, -18); c.fill();
           c.fillStyle = '#6d6154'; c.fillRect(-7, 9, 14, 3); c.fillStyle = '#2f2519'; c.fillRect(-2, 12, 4, 8); }
  } else if (it.slot === 'offhand') {
    c.fillStyle = wood; c.beginPath(); c.moveTo(0, -17); c.lineTo(13, -9); c.lineTo(11, 9); c.lineTo(0, 19); c.lineTo(-11, 9); c.lineTo(-13, -9); c.fill();
    c.fillStyle = metal; c.beginPath(); c.arc(0, 0, 4, 0, 7); c.fill();
  } else if (it.slot === 'chest' || it.slot === 'cloak') {
    c.fillStyle = it.armor > 8 ? metal : it.armor > 3 ? '#6b4f33' : '#8b8271';
    c.beginPath(); c.moveTo(-12, -13); c.lineTo(12, -13); c.lineTo(15, -6); c.lineTo(10, -4); c.lineTo(10, 15); c.lineTo(-10, 15); c.lineTo(-10, -4); c.lineTo(-15, -6); c.fill();
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-10, 0, 20, 2);
  } else if (it.slot === 'head') {
    c.fillStyle = it.armor > 3 ? metal : '#6b4f33'; c.beginPath(); c.arc(0, 0, 12, Math.PI, 0); c.fill(); c.fillRect(-12, 0, 24, 6);
    c.fillStyle = '#1b1815'; c.fillRect(-6, -2, 12, 4);
  } else if (it.slot === 'feet') { c.fillStyle = '#6b4f33'; c.fillRect(-10, -4, 8, 16); c.fillRect(2, -4, 8, 16); c.fillStyle = '#2f2519'; c.fillRect(-11, 10, 22, 4); }
  else if (it.slot === 'consumable') {
    if (it.use === 'food') { c.fillStyle = '#8a6a3c'; c.beginPath(); c.ellipse(0, 2, 13, 9, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(-8, -2, 16, 2); }
    else if (it.use === 'bandage') { c.fillStyle = '#ddd3c0'; c.fillRect(-12, -6, 24, 12); c.fillStyle = '#b9ae98'; c.fillRect(-12, -1, 24, 2); }
    else if (key === 'herb') { c.fillStyle = '#5f7a3a'; c.beginPath(); c.ellipse(-5, 0, 6, 11, .5, 0, 7); c.ellipse(5, 2, 6, 11, -.5, 0, 7); c.fill(); }
    else { c.fillStyle = 'rgba(160,60,60,.9)'; c.beginPath(); c.moveTo(-6, -2); c.lineTo(6, -2); c.lineTo(8, 14); c.lineTo(-8, 14); c.fill(); c.fillStyle = '#6d6154'; c.fillRect(-3, -12, 6, 10); }
  } else {
    if (key === 'wood') { c.fillStyle = wood; c.fillRect(-14, -6, 28, 6); c.fillRect(-12, 2, 24, 6); }
    else if (key === 'stone') { c.fillStyle = '#6a655c'; c.beginPath(); c.moveTo(-12, 8); c.lineTo(-6, -8); c.lineTo(8, -6); c.lineTo(12, 8); c.fill(); }
    else if (key === 'iron') { c.fillStyle = '#6a655c'; c.beginPath(); c.moveTo(-12, 8); c.lineTo(-6, -8); c.lineTo(8, -6); c.lineTo(12, 8); c.fill(); c.fillStyle = '#a3854c'; c.fillRect(-5, -2, 5, 5); c.fillRect(3, 2, 4, 4); }
    else if (key === 'pelt') { c.fillStyle = '#6a5c4a'; c.beginPath(); c.ellipse(0, 0, 13, 10, 0, 0, 7); c.fill(); }
    else if (key === 'bone') { c.fillStyle = '#cfc8b4'; c.fillRect(-11, -2, 22, 5); c.beginPath(); c.arc(-11, 0, 4, 0, 7); c.arc(11, 0, 4, 0, 7); c.fill(); }
    else { c.fillStyle = metal; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill(); c.fillStyle = '#2b2419'; c.beginPath(); c.arc(0, 0, 4, 0, 7); c.fill(); }
  }
  c.restore();
}

// ---------------- Titelbild ----------------
const TITLE_A = SP.humanSpec({ seed: 2, pal: { skin: '#b98f66', hair: '#2b2118', cloth: '#4a3a28' }, equip: { cloak: { key: 'traveler_cloak' }, chest: { key: 'leather_jerkin' } } });
const TITLE_B = SP.humanSpec({ seed: 1, faction: 'order', prof: 'Alter Paladin', pal: { skin: '#d6b089', cloth: '#c7bda6', helm: '#c3bba5', crest: '#9b2e26', shield: '#d9d2c0', shieldBoss: '#9b2e26' },
  equip: { chest: { key: 'plate_cuirass' }, offhand: { key: 'kite_shield' } } });
// Titelbild (BUG-016): die ganze Szene wird in Sprite-Pixeln gemalt (1 Pixel = k Bildschirmpixel, wie die Figuren) und
// scharf hochskaliert. Himmel/Berge und Hügel/Feste sind je Größe gecachte Ebenen; animiert sind Wolken, Fenster,
// Banner, Feuer, Funken und Gras. Licht: Abendglut hinter der Feste (Randlicht oben/links), Feuer vorn.
const titleCache = { key: '', back: null, mid: null };
const TITLE_SKY = [[0, '#171a24'], [0.45, '#3a2a26'], [0.62, '#7d3a24'], [0.75, '#2a1e18'], [1, '#0c0a08']];
function titleLayers(lw, lh) {
  const key = lw + 'x' + lh; if (titleCache.key === key) return titleCache;
  const mk = () => { const cv = document.createElement('canvas'); cv.width = lw; cv.height = lh; return cv; };
  const back = mk(), mid = mk(), b = back.getContext('2d'), g = mid.getContext('2d');
  const P = (o, col, x, y, w = 1, h = 1) => { o.fillStyle = col; o.fillRect(Math.round(x), Math.round(y), w, h); };
  // Himmel: Verlauf in Stufen, an den Übergängen geordnet gedithert (keine glatten Web-Verläufe)
  const skyAt = f => { let i = 0; while (i < TITLE_SKY.length - 2 && f > TITLE_SKY[i + 1][0]) i++; const [f0, c0] = TITLE_SKY[i], [f1, c1] = TITLE_SKY[i + 1]; return SP.mix(c0, c1, Math.min(1, Math.max(0, (f - f0) / (f1 - f0)))); };
  const STEPS = 22, band = Array.from({ length: STEPS + 2 }, (_, i) => skyAt(i / STEPS));
  for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
    const f = y / lh * STEPS, lo = Math.floor(f), fr = f - lo;
    P(b, band[fr > BAYER[(y & 3) * 4 + (x & 3)] ? lo + 1 : lo], x, y);
  }
  for (let i = 0; i < 26; i++) { const x = h2(i, 5) * lw | 0, y = h2(5, i) * lh * 0.3 | 0; P(b, i % 5 ? '#6a6660' : '#b0a894', x, y); }   // Sterne im oberen Dunkel
  const ridge = (o, base, amp, sc, col, rim) => {           // Bergkette: gezackte Silhouette mit Randlicht
    for (let x = 0; x < lw; x++) {
      const yy = Math.round(base - (vnoise(x / sc, 3) * 0.7 + vnoise(x / (sc / 3), 9) * 0.3) * amp);
      P(o, col, x, yy, 1, lh - yy); if (rim) P(o, rim, x, yy);
    }
  };
  ridge(b, lh * 0.62, lh * 0.2, 38, '#2c2126', '#5a2e24');
  ridge(b, lh * 0.66, lh * 0.12, 24, '#231a1d', '#4a2620');
  // Hügel mit der Feste
  for (let x = 0; x < lw; x++) { const yy = Math.round(lh * 0.69 - Math.sin(x / (lw / 4.9)) * lh * 0.045 - Math.sin(x / 17) * 1.5); P(g, '#1c1514', x, yy, 1, lh - yy); P(g, '#3a2420', x, yy); }
  const bx = Math.round(lw * (lw < 200 ? 0.66 : 0.62)), by = Math.round(lh * 0.70), stone = '#241c1b', dk = '#150f0e', rim = '#6e3a26', rim2 = '#4a2a20';
  const block = (x0, y0, w, h, o = {}) => {                 // Mauerkörper: Quader, Fugen, Randlicht oben/links, Zinnen
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const row = y - y0, joint = row % 4 === 3 || (x + (row >> 2) * 3) % 7 === 0;
      P(g, joint ? dk : h2(x, y) < 0.08 ? '#2e2322' : stone, x, y);
    }
    for (let x = x0; x < x0 + w; x++) P(g, rim, x, y0); for (let y = y0; y < y0 + h; y++) P(g, rim2, x0, y);
    if (o.crenel) for (let x = x0; x < x0 + w; x += 4) { P(g, stone, x, y0 - 3, 2, 3); P(g, rim, x, y0 - 3, 2, 1); P(g, rim2, x, y0 - 2, 1, 2); }
  };
  block(bx - 58, by - 22, 116, 30, { crenel: true });       // Ringmauer
  block(bx - 72, by - 36, 15, 44, { crenel: true });        // linker Turm
  block(bx - 12, by - 32, 24, 40, { crenel: true });        // Torhaus
  block(bx + 36, by - 58, 20, 66);                          // Bergfried
  for (let x = bx + 36; x < bx + 56; x++) {                 // Bergfried oben zerbrochen (die Welt ist im Niedergang)
    const drop = x < bx + 42 ? 0 : Math.round((x - bx - 42) * 1.1 + h2(x, 1) * 3);
    g.clearRect(x, by - 58, 1, drop); P(g, rim, x, by - 58 + drop);
  }
  for (let x = bx + 36; x < bx + 42; x += 3) { P(g, stone, x, by - 61, 2, 3); P(g, rim, x, by - 61, 2, 1); }
  P(g, dk, bx + 49, by - 44, 1, 4); P(g, dk, bx + 50, by - 46, 1, 3); P(g, dk, bx + 51, by - 45, 1, 1);   // Riss
  for (let y = by - 18; y < by + 8; y++) for (let x = bx - 6; x < bx + 6; x++) {   // Tor: Bogen, Fallgitter
    const dx = x - bx + 0.5, top = by - 12 - Math.sqrt(Math.max(0, 36 - dx * dx)) * 0.9;
    if (y >= top) P(g, (x - bx + 6) % 3 === 0 || (y - by) % 4 === 0 ? '#2a201c' : '#070505', x, y);
  }
  titleCache.windows = [[bx - 66, by - 26], [bx - 64, by - 14], [bx + 42, by - 44], [bx + 44, by - 30], [bx + 50, by - 18], [bx - 30, by - 12], [bx + 22, by - 12], [bx - 4, by - 26]];
  for (const [x, y] of titleCache.windows) { P(g, '#0a0707', x - 1, y - 1, 3, 5); }
  titleCache.banner = [bx + 1, by - 36]; titleCache.fire = [Math.max(Math.round(lw * 0.30), 40), Math.round(lh * 0.86)];   // schmal: Rastende nicht abschneiden   // Banner auf dem Torhaus
  // Vordergrund: dunkler Boden, zerbrochener Torpfeiler links
  for (let x = 0; x < lw; x++) { const yy = Math.round(lh * 0.9 + Math.sin(x / 23) * 1.5); P(g, '#0e0b0a', x, yy, 1, lh - yy); }
  for (let y = Math.round(lh * 0.78); y < lh; y++) { const w = Math.round((y - lh * 0.78) * 0.9 + 10 + h2(1, y) * 2); P(g, y % 5 === 0 ? '#050404' : '#0a0807', 0, y, w, 1); P(g, '#231a18', w, y); }
  titleCache.key = key; titleCache.back = back; titleCache.mid = mid;
  return titleCache;
}
let TITLE_HERO = null;
export function setTitleHero(ch) { TITLE_HERO = ch ? { kind: 'player', pal: ch.pal, seed: ch.seed || 1, build: ch.build, equip: ch.equip || {}, body: ch.body, prof: ch.prof, spec: null } : null; }
export function drawTitleScene(canvas, t) {
  const c = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth, h = canvas.height = canvas.clientHeight;
  if (!w || !h) return;                                      // Phase 1: verstecktes Canvas (Größe 0) — sonst wirft drawImage
  const k = Math.max(3, Math.round(h / 190)), lw = Math.ceil(w / k), lh = Math.ceil(h / k);
  const L = titleLayers(lw, lh);
  const cv = L.frame || (L.frame = document.createElement('canvas'));
  if (cv.width !== lw || cv.height !== lh) { cv.width = lw; cv.height = lh; }
  const o = cv.getContext('2d'), P = (col, x, y, ww = 1, hh = 1) => { o.fillStyle = col; o.fillRect(Math.round(x), Math.round(y), ww, hh); };
  o.imageSmoothingEnabled = false;
  o.drawImage(L.back, 0, 0);
  for (let i = 0; i < 6; i++) {                             // Wolkenbänder: flache Pixelstreifen, ziehen langsam
    const y = Math.round(lh * (0.12 + i * 0.055)), len = 60 - i * 4, off = ((t / (160 + i * 50)) % (lw + 160)) - 80;
    for (let j = 0; j < 3; j++) { const x0 = off + j * (lw / 2.2) - (i * 37 % 50), l = len - j * 9;
      P(i < 3 ? '#1c181c' : '#2a1d1c', x0, y, l, 2); P(i < 3 ? '#1c181c' : '#2a1d1c', x0 + 6, y - 1, l - 14, 1); P('#4a2a22', x0 + 4, y + 2, l - 10, 1); }
  }
  o.drawImage(L.mid, 0, 0);
  for (const [i, [x, y]] of L.windows.entries()) {         // Fenster: einige erleuchtet, flackernd
    if (i % 3 === 2) continue;
    const fl = Math.sin(t / 230 + i * 1.7) > -0.6;
    P(fl ? '#d08a3a' : '#8a4a22', x, y, 1, 2); if (fl) P('#f0c070', x, y);
  }
  const [bnx, bny] = L.banner, sway = Math.round(Math.sin(t / 700) * 1.5);   // zerrissenes Banner am Bergfried
  P('#3a2a22', bnx - 1, bny - 14, 1, 14); P('#6e3a26', bnx - 1, bny - 14);
  for (let y = 0; y < 12; y++) { const wv = Math.round(Math.sin(t / 500 + y / 3) * 0.8) + (y > 8 ? sway : 0), ww = y > 9 ? 3 + (y & 1) : 5;
    P(y % 4 === 0 ? '#7a2c20' : '#5b2119', bnx + wv, bny - 13 + y, ww, 1); }
  const [fx, fy] = L.fire, f = Math.sin(t / 90) * 0.5 + 0.5;   // Lagerfeuer
  for (let r = 7; r >= 1; r--) { o.fillStyle = `rgba(200,100,40,${0.035 * (8 - r) * (0.8 + f * 0.3)})`; o.beginPath(); o.ellipse(fx, fy + 2, r * 4, r * 1.4, 0, 0, 7); o.fill(); }
  P('#2a1f16', fx - 6, fy, 12, 2); P('#3a2a1c', fx - 5, fy - 1, 4, 1); P('#3a2a1c', fx + 1, fy + 1, 5, 1); P('#15100c', fx - 7, fy + 2, 14, 1);
  const fh = 10 + Math.round(f * 3);                        // Flamme: roter Saum, oranger Körper, heller Kern
  for (let y = 0; y < fh; y++) {
    const q = 1 - y / fh, jit = Math.round(Math.sin(t / 55 + y * 1.3) * (1 - q) * 1.4), wo = Math.round(Math.pow(q, 0.8) * 5), wi = wo - 2, wc = wo - 4;
    if (wo < 0) continue;
    P(y > fh * 0.7 ? '#7a2814' : '#b8401c', fx - wo + jit, fy - 1 - y, wo * 2 + 1, 1);
    if (wi >= 0) P('#e07828', fx - wi + jit, fy - 1 - y, wi * 2 + 1, 1);
    if (wc >= 0) P('#f6c868', fx - wc + jit, fy - 1 - y, wc * 2 + 1, 1);
  }
  if (f > 0.6) P('#b8401c', fx - 2 + Math.round(Math.sin(t / 70) * 2), fy - fh - 2);   // abreißende Flammenzunge
  for (let i = 0; i < 18; i++) {                            // Funken
    const pp = (t / 26 + i * 97) % 90, px = fx + Math.sin(t / 400 + i) * (2 + pp / 10), py = fy - 6 - pp;
    if (pp < 80) P(pp < 40 ? '#f0b060' : '#b8602a', px, py);
  }
  for (let x = 0; x < lw; x += 2) {                         // Gras vorn, wiegt im Wind
    const sw = Math.round(Math.sin(t / 900 + x / 14) * 1), hh = 4 + (h2(x, 3) * 4 | 0);
    for (let y = 0; y < hh; y++) P(y > hh - 2 ? '#1a1410' : '#0c0a08', x + (y < hh / 2 ? sw : 0), lh - y);
  }
  c.imageSmoothingEnabled = false;
  c.drawImage(cv, 0, 0, lw * k, lh * k);
  // Rastende am Feuer (S14, Nutzer: sahen schlecht aus): direkt aufs Bild in ganzzahligen Pixeln, nicht ins grobe Szenenraster
  // (dort wurden feine Frames auf 0,6 Rasterpunkte gestaucht und verschmierten)
  const B = SP.humanFrame(TITLE_B, 'W', 'i0'), bp = B.px || 2, sp = Math.max(3, Math.round(k * bp * 0.75)), gx = fx * k, gy = (fy + 4) * k;
  c.filter = 'brightness(0.9) sepia(0.15)';
  c.drawImage(B, Math.round(gx + 12 * k), Math.round(gy - B.oy * sp), B.width * sp, B.height * sp);
  if (TITLE_HERO) {                                                    // Phase 1: der eigene Charakter, 3/4 von vorn, mit Ausrüstung und Waffe wie im Spiel
    c.save(); c.translate(Math.round(gx - 22 * k), Math.round(gy)); const hs = sp / (bp * SP.FIGK); c.scale(hs, hs);
    try { drawHumanoid({ ...TITLE_HERO, x: 0, y: 0, facing: 0, aim: Math.PI / 2 - 0.35, swing: 0, downed: false, act: null, vx: 0, vy: 0 }, t, c); } finally { c.restore(); }
  } else { const A = SP.humanFrame(TITLE_A, 'S', t % 1300 < 650 ? 'i0' : 'i1'); c.drawImage(A, Math.round(gx - 22 * k - A.width * sp / 2), Math.round(gy - A.oy * sp), A.width * sp, A.height * sp); }
  c.filter = 'none';
  const shade = c.createLinearGradient(0, 0, w * .62, 0);              // Lesbarkeit links (UI-Schrift), weich auslaufend
  shade.addColorStop(0, 'rgba(10,8,7,.62)'); shade.addColorStop(1, 'rgba(10,8,7,0)');
  c.fillStyle = shade; c.fillRect(0, 0, w, h);
}
