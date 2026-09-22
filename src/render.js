// Rendering: Kacheln, Props, Sprites (prozedural gezeichnet), Effekte, Licht, Wetter.
import { S, clamp } from './state.js';
import { MAPS, T, TS, tileAt } from './world.js';
import { ITEMS, MONSTERS } from './data.js';
import { buildOf } from './body.js';

export const cam = { x: 0, y: 0, zoom: 1 };
let cv, ctx, W = 0, H = 0, dpr = 1;
const dark = document.createElement('canvas');
const dctx = dark.getContext('2d');

export function initCanvas(canvas) {
  cv = canvas; ctx = cv.getContext('2d');
  resize();
  new ResizeObserver(resize).observe(cv.parentElement);
}
function resize() {
  if (!cv) return;
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  W = cv.parentElement.clientWidth; H = cv.parentElement.clientHeight;
  cv.width = Math.max(2, W * dpr); cv.height = Math.max(2, H * dpr);
  dark.width = cv.width; dark.height = cv.height;
  ctx.imageSmoothingEnabled = false;
}
export const view = () => ({ W, H });
export function screenToWorld(sx, sy) { return { x: sx / cam.zoom + cam.x, y: sy / cam.zoom + cam.y }; }

function h2(x, y) { let n = (x * 374761393 + y * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }

const TILE_COL = {
  [T.GRASS]: ['#3c4a2c', '#43522f', '#364325'],
  [T.DIRT]:  ['#4a3d2c', '#534531', '#413527'],
  [T.ROAD]:  ['#5a4d3a', '#645640', '#524634'],
  [T.WATER]: ['#22384a', '#284058', '#1d3040'],
  [T.MARSH]: ['#333a26', '#3b422c', '#2b3120'],
  [T.STONE]: ['#4a4741', '#534f48', '#413e39'],
  [T.PLANK]: ['#4e3d2a', '#573f2c', '#453525'],
  [T.ROCK]:  ['#3a3733', '#44403a', '#312e2b'],
  [T.WALL]:  ['#3f3a33', '#48423a', '#36322c'],
  [T.SAND]:  ['#5c5540', '#665e47', '#544d3a'],
  [T.DFLOOR]:['#2e2a25', '#35302a', '#28241f'],
  [T.DWALL]: ['#1b1815', '#201d19', '#171411'],
  [T.ASH]:   ['#37332e', '#3e3934', '#2f2b27'],
  [T.FIELD]: ['#55492c', '#5e5131', '#4b4026'],
};

// ---------------- Hauptbild ----------------
export function drawFrame(now) {
  if (!ctx) return;
  const m = MAPS[S.map]; if (!m) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#070906'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.x, -cam.y);

  const x0 = Math.max(0, Math.floor(cam.x / TS) - 1), y0 = Math.max(0, Math.floor(cam.y / TS) - 1);
  const x1 = Math.min(m.w - 1, Math.ceil((cam.x + W / cam.zoom) / TS)), y1 = Math.min(m.h - 1, Math.ceil((cam.y + H / cam.zoom) / TS));

  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) drawTile(tx, ty, m.tiles[ty * m.w + tx], now);

  // Objekte nach y sortiert
  const list = S.ents[S.map].filter(e => e.x > cam.x - 80 && e.x < cam.x + W / cam.zoom + 80 && e.y > cam.y - 100 && e.y < cam.y + H / cam.zoom + 120);
  list.sort((a, b) => (a.y + (a.kind === 'corpse' ? -999 : 0)) - (b.y + (b.kind === 'corpse' ? -999 : 0)));
  for (const e of list) drawEntity(e, now);
  for (const p of S.projectiles) drawProjectile(p);
  drawFx(now);
  const ch = S.player && S.player.channel;
  if (ch) {
    const t = S.ents[S.map].find(e => e.id === ch.targetId) || S.player, k = Math.min(1, ch.t / ch.dur);
    ctx.fillStyle = 'rgba(12,10,8,.85)'; ctx.fillRect(t.x - 16, t.y - 46, 32, 5);
    ctx.fillStyle = '#b8a370'; ctx.fillRect(t.x - 15, t.y - 45, 30 * k, 3);
  }

  ctx.restore();
  drawLight(now);
  drawWeather(now);
  drawFloats();
}

function drawTile(tx, ty, t, now) {
  const v = h2(tx, ty), pal = TILE_COL[t] || TILE_COL[T.GRASS];
  ctx.fillStyle = pal[(v * 3) | 0];
  const X = tx * TS, Y = ty * TS;
  ctx.fillRect(X, Y, TS, TS);
  if (t === T.GRASS && v > 0.72) {
    ctx.fillStyle = 'rgba(120,140,80,.22)';
    ctx.fillRect(X + 6 + v * 12, Y + 8 + v * 10, 2, 5);
    ctx.fillRect(X + 18 - v * 8, Y + 18, 2, 4);
    if (v > 0.965) { ctx.fillStyle = '#7a6f3c'; ctx.fillRect(X + 12, Y + 14, 3, 3); }
  } else if (t === T.ROAD) {
    if (v > 0.8) { ctx.fillStyle = 'rgba(30,25,18,.4)'; ctx.fillRect(X + (v * 20 | 0), Y + (v * 24 | 0), 4, 3); }
    ctx.fillStyle = 'rgba(0,0,0,.10)'; ctx.fillRect(X, Y + 13, TS, 2);
  } else if (t === T.WATER) {
    const s = Math.sin(now / 700 + tx * 0.6 + ty * 0.4) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(150,190,210,${0.05 + s * 0.07})`;
    ctx.fillRect(X, Y + 6 + s * 10, TS, 2);
  } else if (t === T.MARSH) {
    if (v > 0.6) { ctx.fillStyle = '#2a3220'; ctx.fillRect(X + 4, Y + 6, 3, 9); ctx.fillRect(X + 20, Y + 12, 3, 8); }
    if (v > 0.9) { ctx.fillStyle = '#26332e'; ctx.beginPath(); ctx.ellipse(X + 16, Y + 18, 9, 5, 0, 0, 7); ctx.fill(); }
  } else if (t === T.PLANK) {
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(X, Y + 10, TS, 1); ctx.fillRect(X, Y + 22, TS, 1);
  } else if (t === T.WALL || t === T.ROCK || t === T.DWALL) {
    ctx.fillStyle = 'rgba(255,255,255,.045)'; ctx.fillRect(X, Y, TS, 3);
    ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.fillRect(X, Y + TS - 4, TS, 4);
    if (v > 0.7) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(X + 5, Y + 9, 12, 2); }
  } else if (t === T.FIELD) {
    ctx.fillStyle = 'rgba(30,24,14,.35)';
    for (let i = 0; i < 4; i++) ctx.fillRect(X, Y + 3 + i * 8, TS, 2);
  } else if (t === T.DFLOOR && v > 0.85) {
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(X + 8, Y + 10, 8, 5);
  }
}

// ---------------- Entities ----------------
function shadow(x, y, r, a = 0.35) {
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.beginPath(); ctx.ellipse(x, y + 2, r, r * 0.45, 0, 0, 7); ctx.fill();
}

function drawEntity(e, now) {
  switch (e.kind) {
    case 'prop': return drawProp(e, now);
    case 'building': return drawBuilding(e, now);
    case 'item': return drawGroundItem(e, now);
    case 'corpse': return drawCorpse(e);
    case 'grave': return drawGrave(e);
    case 'enemy': return drawCreature(e, now);
    case 'npc': case 'player': return drawHumanoid(e, now);
    case 'decal': return drawDecal(e);
    case 'caravan': return drawCaravan(e, now);
  }
}

function drawCaravan(e, now) {
  const x = e.x, y = e.y, f = e.facing === 2 ? -1 : 1, bob = (e.vx || e.vy) ? Math.sin(now / 120) * 1 : 0;
  shadow(x, y + 6, 26, .35);
  ctx.fillStyle = '#5a4630'; ctx.beginPath(); ctx.ellipse(x + f * 26, y - 6 + bob, 10, 7, 0, 0, 7); ctx.fill();   // Ochse
  ctx.fillStyle = '#3d2f1f'; ctx.fillRect(x + f * 33 - 3, y - 12 + bob, 6, 5);
  ctx.fillStyle = '#4b3a25'; ctx.fillRect(x - 20, y - 14, 36, 14);                                               // Wagen
  ctx.fillStyle = '#c9bfa6'; ctx.beginPath(); ctx.moveTo(x - 20, y - 14); ctx.quadraticCurveTo(x - 2, y - 36, x + 16, y - 14); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x - 6, y - 30, 2, 16);
  ctx.fillStyle = '#2b2116'; ctx.beginPath(); ctx.arc(x - 12, y + 2, 6, 0, 7); ctx.arc(x + 9, y + 2, 6, 0, 7); ctx.fill();
  if (e.hp < e.maxHp) { ctx.fillStyle = '#100d0a'; ctx.fillRect(x - 18, y - 44, 36, 4); ctx.fillStyle = '#8c2a22'; ctx.fillRect(x - 18, y - 44, 36 * Math.max(0, e.hp / e.maxHp), 4); }
}
function drawDecal(e) {
  ctx.fillStyle = `rgba(90,18,14,${clamp(e.life / e.maxLife, 0, 1) * 0.55})`;
  ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r, e.r * 0.5, 0, 0, 7); ctx.fill();
}

function drawProp(e, now) {
  const x = e.x, y = e.y;
  switch (e.type) {
    case 'tree': {
      shadow(x, y + 6, 13);
      ctx.fillStyle = '#382a1d'; ctx.fillRect(x - 3, y - 14, 6, 20);
      const v = h2(x | 0, y | 0);
      const g = ['#2c3a22', '#334224', '#28331d'][(v * 3) | 0];
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y - 26, 15, 0, 7); ctx.arc(x - 11, y - 18, 11, 0, 7); ctx.arc(x + 11, y - 18, 11, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(x + 5, y - 14, 10, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(190,200,150,.10)'; ctx.beginPath(); ctx.arc(x - 6, y - 32, 7, 0, 7); ctx.fill();
      if (e.hp < 3) { ctx.fillStyle = '#6b5a3a'; ctx.fillRect(x - 5, y - 6, 10, 3); }
      break; }
    case 'bush':
      shadow(x, y + 3, 9, .25);
      ctx.fillStyle = e.depleted ? '#333d26' : '#38492a';
      ctx.beginPath(); ctx.arc(x, y - 4, 9, 0, 7); ctx.arc(x - 6, y, 7, 0, 7); ctx.arc(x + 6, y, 7, 0, 7); ctx.fill();
      if (!e.depleted) { ctx.fillStyle = '#9c5a4a'; ctx.fillRect(x - 2, y - 6, 2, 2); ctx.fillRect(x + 4, y - 2, 2, 2); }
      break;
    case 'rock_node': case 'ore_node':
      shadow(x, y + 4, 11, .3);
      ctx.fillStyle = e.depleted ? '#332f2b' : '#4b4740';
      ctx.beginPath(); ctx.moveTo(x - 12, y + 6); ctx.lineTo(x - 7, y - 9); ctx.lineTo(x + 3, y - 12); ctx.lineTo(x + 12, y + 2); ctx.lineTo(x + 8, y + 7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x - 6, y - 7, 7, 3);
      if (e.type === 'ore_node' && !e.depleted) { ctx.fillStyle = '#8a6f3f'; ctx.fillRect(x - 3, y - 3, 3, 3); ctx.fillRect(x + 4, y + 1, 3, 3); }
      break;
    case 'crate': case 'chest': {
      shadow(x, y + 4, 10, .3);
      ctx.fillStyle = e.type === 'chest' ? '#4a3521' : '#513f28';
      ctx.fillRect(x - 10, y - 12, 20, 16);
      ctx.strokeStyle = '#2b2116'; ctx.lineWidth = 1; ctx.strokeRect(x - 10.5, y - 12.5, 21, 17);
      ctx.fillStyle = '#6d6154'; ctx.fillRect(x - 10, y - 5, 20, 2);
      if (e.type === 'chest') { ctx.fillStyle = e.opened ? '#4a4237' : '#bd9433'; ctx.fillRect(x - 2, y - 6, 4, 5); }
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
    case 'anvil':
      shadow(x, y + 3, 11, .35);
      ctx.fillStyle = '#2f2c28'; ctx.fillRect(x - 9, y - 4, 18, 7);
      ctx.fillStyle = '#4b4741'; ctx.fillRect(x - 11, y - 12, 22, 6); ctx.fillRect(x - 5, y - 8, 10, 5);
      break;
    case 'stall':
      shadow(x, y + 5, 15, .3);
      ctx.fillStyle = '#4b3a25'; ctx.fillRect(x - 14, y - 6, 28, 9);
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
    case 'gravestone':
      shadow(x, y + 2, 8, .3);
      ctx.fillStyle = '#4a4741'; ctx.beginPath(); ctx.moveTo(x - 7, y + 2); ctx.lineTo(x - 7, y - 12); ctx.quadraticCurveTo(x, y - 20, x + 7, y - 12); ctx.lineTo(x + 7, y + 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x - 4, y - 10, 8, 1.5); ctx.fillRect(x - 4, y - 6, 8, 1.5);
      break;
    case 'shrine':
      shadow(x, y + 4, 14, .3);
      ctx.fillStyle = '#54504a'; ctx.fillRect(x - 12, y - 6, 24, 9);
      ctx.fillStyle = '#635e56'; ctx.fillRect(x - 8, y - 28, 16, 23);
      ctx.fillStyle = 'rgba(214,198,150,.55)'; ctx.beginPath(); ctx.arc(x, y - 20, 5, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(230,214,160,.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y - 20, 9 + Math.sin(now / 600) * 1.5, 0, 7); ctx.stroke();
      break;
    case 'crypt': case 'marsh_ruin': case 'broken_pillar':
      shadow(x, y + 4, 14, .35);
      ctx.fillStyle = '#3f3b35'; ctx.fillRect(x - 14, y - 22, 28, 26);
      ctx.fillStyle = '#16140f'; ctx.fillRect(x - 5, y - 12, 10, 16);
      ctx.fillStyle = 'rgba(78,143,122,.25)'; ctx.fillRect(x - 5, y - 12, 10, 16);
      break;
    case 'rubble':
      ctx.fillStyle = '#3c3833'; ctx.fillRect(x - 8, y - 3, 8, 5); ctx.fillRect(x + 1, y - 6, 6, 8);
      break;
    case 'fence': case 'palisade_prop': case 'fallen_tree':
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
      ctx.fillStyle = '#3d2f1f'; ctx.fillRect(x - 2, y - 30, 3, 32);
      ctx.fillStyle = '#5b2a20'; ctx.beginPath(); ctx.moveTo(x, y - 29); ctx.lineTo(x + 14 + s, y - 27); ctx.lineTo(x + 11 + s, y - 12); ctx.lineTo(x, y - 14); ctx.fill();
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
    default:
      ctx.fillStyle = '#4a443c'; ctx.fillRect(x - 7, y - 7, 14, 12);
  }
}

// ---- Sprite-Bausteine ----
const SKIN = ['#d6b089', '#b98f66', '#8d6644', '#f0d2ae', '#6d4a30'];
const HAIR = ['#2b2118', '#5a3a1e', '#8a7a52', '#c9bfa6', '#7d2f1d'];

export function drawHumanoid(e, now, override) {
  const c = override || ctx;
  const x = e.x, y = e.y;
  const walking = e.vx || e.vy;
  const bob = walking ? Math.sin(now / 110 + (e.seed || 0)) * 1.6 : Math.sin(now / 600 + (e.seed || 0)) * 0.6;
  const p = e.pal || {};
  const skin = p.skin || SKIN[0], cloth = p.cloth || '#4a3a28', hair = p.hair || HAIR[0];
  const face = e.facing || 0;
  c.fillStyle = `rgba(0,0,0,${e.downed ? .18 : .35})`;
  c.beginPath(); c.ellipse(x, y + 6, 9, 4, 0, 0, 7); c.fill();
  if (e.downed || e.kind === 'corpse') {
    c.fillStyle = cloth; c.fillRect(x - 12, y - 5, 24, 9);
    c.fillStyle = skin; c.beginPath(); c.arc(x + 13, y - 2, 5, 0, 7); c.fill();
    return;
  }
  const armed = e.equip && e.equip.weapon;
  const [sx, sy] = buildOf(e).scale;
  c.save(); c.translate(x, y + 6); c.scale(sx, sy); c.translate(-x, -(y + 6));
  // Von vorn (Blick nach unten) ist die rechte Körperseite links im Bild.
  const bd = e.body, off = k => bd && bd[k].hp <= 0;
  const [screenL, screenR] = face === 0 ? ['r', 'l'] : ['l', 'r'];
  // Beine
  const step = walking ? Math.sin(now / 90 + (e.seed || 0)) * 3 : 0;
  c.fillStyle = off(screenL + 'leg') ? '#4a1c16' : '#2f2519'; c.fillRect(x - 5, y - 6 + bob, 4, 9 + step * 0.3);
  c.fillStyle = off(screenR + 'leg') ? '#4a1c16' : '#2f2519'; c.fillRect(x + 1, y - 6 + bob, 4, 9 - step * 0.3);
  // Umhang
  if (e.equip && e.equip.cloak) { c.fillStyle = p.cloak || '#5b2a20'; c.fillRect(x - 8, y - 22 + bob, 16, 18); }
  // Rumpf
  c.fillStyle = cloth; c.fillRect(x - 7, y - 20 + bob, 14, 15);
  if (p.armor) { c.fillStyle = p.armor; c.fillRect(x - 7, y - 20 + bob, 14, 9); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x - 7, y - 20 + bob, 14, 2); }
  c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x - 7, y - 8 + bob, 14, 3);
  // Arme
  c.fillStyle = off(screenL + 'arm') ? '#6b2a20' : skin; c.fillRect(x - 9, y - 19 + bob + (off(screenL + 'arm') ? 3 : 0), 3, 10);
  c.fillStyle = off(screenR + 'arm') ? '#6b2a20' : skin; c.fillRect(x + 6, y - 19 + bob + (off(screenR + 'arm') ? 3 : 0), 3, 10);
  // Kopf
  c.fillStyle = skin; c.beginPath(); c.arc(x, y - 25 + bob, 6, 0, 7); c.fill();
  if (face !== 1) { c.fillStyle = 'rgba(20,14,10,.75)';
    if (face === 0) { c.fillRect(x - 3, y - 26 + bob, 1.6, 2); c.fillRect(x + 1.5, y - 26 + bob, 1.6, 2); }
    if (face === 2) { c.fillRect(x - 4, y - 26 + bob, 1.6, 2); }
    if (face === 3) { c.fillRect(x + 2.5, y - 26 + bob, 1.6, 2); }
  }
  // Haar / Helm
  if (p.helm) { c.fillStyle = p.helm; c.beginPath(); c.arc(x, y - 26 + bob, 6.6, Math.PI, 0); c.fill(); c.fillRect(x - 6.6, y - 26 + bob, 13, 3); }
  else { c.fillStyle = hair; c.beginPath(); c.arc(x, y - 27 + bob, 6.2, Math.PI, 0); c.fill(); c.fillRect(x - 6, y - 27 + bob, 12, 3); }
  // Waffe
  if (armed) drawWeapon(c, e, now, bob);
  if (e.equip && e.equip.offhand) {
    c.fillStyle = '#5b452a'; c.beginPath(); c.ellipse(x + (face === 2 ? 10 : -10), y - 14 + bob, 4.5, 7, 0, 0, 7); c.fill();
    c.fillStyle = '#7d7466'; c.beginPath(); c.arc(x + (face === 2 ? 10 : -10), y - 14 + bob, 1.8, 0, 7); c.fill();
  }
  c.restore();
  if (e.marked) { c.strokeStyle = 'rgba(200,80,60,.8)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y - 34, 4, 0, 7); c.stroke(); }
}

function drawWeapon(c, e, now, bob) {
  const it = ITEMS[e.equip.weapon.key] || {};
  const sw = e.swing || 0;                       // 0..1 Animationsfortschritt
  const dir = e.aim ?? 0;
  const len = it.wtype === 'great' ? 26 : it.wtype === 'spear' ? 30 : it.wtype === 'dagger' ? 10 : 18;
  const a = dir + (sw > 0 ? (-0.9 + sw * 1.8) : 0.6);
  const hx = e.x + Math.cos(dir) * 7, hy = e.y - 14 + bob + Math.sin(dir) * 4;
  c.save(); c.translate(hx, hy); c.rotate(a);
  if (it.wtype === 'bow') {
    c.strokeStyle = '#6b5a35'; c.lineWidth = 2.2; c.beginPath(); c.arc(4, 0, 9, -1.9, 1.9); c.stroke();
    c.strokeStyle = 'rgba(220,210,180,.6)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(1, -8.6); c.lineTo(1 - sw * 5, 0); c.lineTo(1, 8.6); c.stroke();
  } else if (it.wtype === 'staff') {
    c.fillStyle = '#4a3a22'; c.fillRect(0, -1.5, 24, 3);
    c.fillStyle = 'rgba(120,90,160,.8)'; c.beginPath(); c.arc(25, 0, 3.5, 0, 7); c.fill();
  } else {
    c.fillStyle = '#2f2519'; c.fillRect(-3, -1.6, 6, 3.2);           // Griff
    c.fillStyle = '#6d6154'; c.fillRect(2, -2.8, 2.5, 5.6);          // Parier
    c.fillStyle = it.rarity === 'epic' ? '#b39b6a' : '#a8a196';
    if (it.wtype === 'axe') { c.fillRect(3, -1.4, len * .7, 2.8); c.beginPath(); c.moveTo(len * .6, -7); c.lineTo(len * .95, 0); c.lineTo(len * .6, 7); c.fill(); }
    else if (it.wtype === 'spear') { c.fillRect(3, -1.1, len, 2.2); c.beginPath(); c.moveTo(len + 3, -3); c.lineTo(len + 10, 0); c.lineTo(len + 3, 3); c.fill(); }
    else if (it.wtype === 'mace') { c.fillRect(3, -1.4, len * .7, 2.8); c.beginPath(); c.arc(len * .8, 0, 4.5, 0, 7); c.fill(); }
    else { c.fillRect(3, -1.6, len, 3.2); c.beginPath(); c.moveTo(len + 3, -1.6); c.lineTo(len + 7, 0); c.lineTo(len + 3, 1.6); c.fill(); }
  }
  c.restore();
  if (sw > 0 && !it.ranged) {                                        // Hiebbogen
    const arc = it.arc || 1.4;
    c.strokeStyle = `rgba(230,226,210,${0.45 * (1 - sw)})`; c.lineWidth = 3 * (1 - sw) + 1;
    c.beginPath(); c.arc(e.x, e.y - 12, (it.reach || 40) * 0.8, dir - arc / 2, dir + arc / 2); c.stroke();
  }
}

function drawCreature(e, now) {
  const m = MONSTERS[e.mtype] || {};
  const p = m.pal || {};
  if (e.mtype === 'wolf' || e.mtype === 'boar') {
    const bob = (e.vx || e.vy) ? Math.sin(now / 70 + e.seed) * 1.4 : 0;
    shadow(e.x, e.y + 3, e.r + 3, .35);
    const big = e.mtype === 'boar';
    ctx.fillStyle = p.body; 
    ctx.beginPath(); ctx.ellipse(e.x, e.y - 8 + bob, big ? 15 : 14, big ? 10 : 8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = p.dark; ctx.fillRect(e.x - 11, e.y - 3, 3, 6); ctx.fillRect(e.x + 8, e.y - 3, 3, 6);
    const hx = e.x + (e.facing === 2 ? -14 : 14);
    ctx.fillStyle = p.body; ctx.beginPath(); ctx.arc(hx, e.y - 10 + bob, big ? 8 : 7, 0, 7); ctx.fill();
    ctx.fillStyle = p.dark;                       // Ohren / Hauer
    if (big) { ctx.fillStyle = '#d6cdb4'; ctx.fillRect(hx + (e.facing === 2 ? -6 : 3), e.y - 7 + bob, 4, 2); }
    else { ctx.beginPath(); ctx.moveTo(hx - 4, e.y - 15 + bob); ctx.lineTo(hx - 1, e.y - 21 + bob); ctx.lineTo(hx + 2, e.y - 15 + bob); ctx.fill(); }
    ctx.fillStyle = p.eye; ctx.fillRect(hx + (e.facing === 2 ? -4 : 2), e.y - 11 + bob, 2, 2);
    ctx.fillStyle = p.dark; ctx.fillRect(e.x + (e.facing === 2 ? 12 : -16), e.y - 12 + bob, 5, 3);
    return;
  }
  if (e.mtype === 'gorak') {
    const bob = Math.sin(now / 200) * 1.5;
    shadow(e.x, e.y + 5, 22, .45);
    ctx.fillStyle = p.cloth; ctx.fillRect(e.x - 16, y0(e) + bob, 32, 26);
    ctx.fillStyle = p.skin; ctx.fillRect(e.x - 18, y0(e) - 4 + bob, 36, 14);
    ctx.beginPath(); ctx.arc(e.x, y0(e) - 14 + bob, 12, 0, 7); ctx.fill();
    ctx.fillStyle = '#1c1a15'; ctx.fillRect(e.x - 7, y0(e) - 17 + bob, 4, 3); ctx.fillRect(e.x + 3, y0(e) - 17 + bob, 4, 3);
    ctx.fillStyle = '#d6cdb4'; ctx.fillRect(e.x - 5, y0(e) - 10 + bob, 10, 3);
    ctx.fillStyle = p.metal; 
    const a = (e.aim ?? 0) + (e.swing > 0 ? -0.9 + e.swing * 1.8 : 0.5);
    ctx.save(); ctx.translate(e.x + Math.cos(a) * 14, e.y - 22 + Math.sin(a) * 8); ctx.rotate(a);
    ctx.fillRect(0, -3, 26, 6); ctx.beginPath(); ctx.moveTo(20, -12); ctx.lineTo(32, 0); ctx.lineTo(20, 12); ctx.fill(); ctx.restore();
    if (e.telegraph > 0) {
      ctx.strokeStyle = `rgba(200,60,40,${0.3 + 0.4 * Math.sin(now / 60)})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y - 10, m.reach + 12, (e.aim ?? 0) - 0.9, (e.aim ?? 0) + 0.9); ctx.stroke();
    }
    return;
  }
  // humanoide Gegner (Goblin, Bandit, Skelett)
  const scale = e.mtype === 'goblin' ? 0.8 : 1;
  const proxy = { ...e, pal: { skin: p.skin || p.metal, cloth: p.cloth, hair: '#241c14', armor: e.mtype === 'skeleton' ? null : p.metal },
                  equip: { weapon: e.weaponKey ? { key: e.weaponKey } : null, offhand: e.shield } };
  ctx.save(); ctx.translate(e.x, e.y); ctx.scale(scale, scale); ctx.translate(-e.x, -e.y);
  drawHumanoid(proxy, now);
  ctx.restore();
  if (e.mtype === 'skeleton') {
    ctx.fillStyle = 'rgba(78,143,122,.5)';
    ctx.beginPath(); ctx.arc(e.x - 2, e.y - 25, 1.8, 0, 7); ctx.arc(e.x + 2.5, e.y - 25, 1.8, 0, 7); ctx.fill();
  }
  if (e.telegraph > 0) { ctx.strokeStyle = 'rgba(200,60,40,.4)'; ctx.beginPath(); ctx.arc(e.x, e.y - 10, m.reach, 0, 7); ctx.stroke(); }
}
const y0 = e => e.y - 26;

function drawCorpse(e) {
  ctx.globalAlpha = clamp(e.life / 1000, 0, 1);
  shadow(e.x, e.y + 2, 12, .25);
  ctx.fillStyle = e.pal || '#3a3229'; ctx.fillRect(e.x - 13, e.y - 6, 26, 10);
  ctx.fillStyle = 'rgba(90,18,14,.5)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 3, 14, 6, 0, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawGrave(e) {
  shadow(e.x, e.y + 2, 10, .35);
  ctx.fillStyle = '#524d46'; ctx.beginPath(); ctx.moveTo(e.x - 9, e.y + 3); ctx.lineTo(e.x - 9, e.y - 16); ctx.quadraticCurveTo(e.x, e.y - 26, e.x + 9, e.y - 16); ctx.lineTo(e.x + 9, e.y + 3); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(e.x - 5, e.y - 14, 10, 1.6); ctx.fillRect(e.x - 5, e.y - 10, 10, 1.6);
  ctx.fillStyle = 'rgba(189,148,51,.35)'; ctx.fillRect(e.x - 3, e.y - 20, 6, 1.6);
}

function drawGroundItem(e, now) {
  const f = Math.sin(now / 400 + e.seed) * 2;
  shadow(e.x, e.y + 2, 6, .25);
  const it = ITEMS[e.item.key] || {};
  const col = { common:'#b7ab92', uncommon:'#89a05a', rare:'#5f92bd', epic:'#a077bb', legendary:'#bd9433' }[it.rarity] || '#b7ab92';
  ctx.fillStyle = col; ctx.globalAlpha = .9;
  ctx.fillRect(e.x - 4, e.y - 10 + f, 8, 8);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeRect(e.x - 4.5, e.y - 10.5 + f, 9, 9);
  if (it.rarity === 'epic' || it.rarity === 'legendary') {
    ctx.fillStyle = `rgba(189,148,51,${.12 + .08 * Math.sin(now / 300)})`;
    ctx.beginPath(); ctx.arc(e.x, e.y - 6, 12, 0, 7); ctx.fill();
  }
}

function drawBuilding(e, now) {
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
  if (p.kind === 'arrow') { ctx.fillStyle = '#c9bfa6'; ctx.fillRect(-8, -0.8, 16, 1.6); ctx.fillStyle = '#7d7466'; ctx.fillRect(6, -2, 4, 4); }
  else if (p.kind === 'fire') { ctx.fillStyle = 'rgba(240,150,50,.9)'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,220,140,.9)'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill(); }
  else { ctx.fillStyle = 'rgba(110,74,125,.9)'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(190,160,220,.7)'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, 7); ctx.fill(); }
  ctx.restore();
}

function drawFx(now) {
  for (const f of S.fx) {
    const t = 1 - f.life / f.maxLife;
    ctx.globalAlpha = clamp(f.life / f.maxLife, 0, 1);
    if (f.type === 'blood') { ctx.fillStyle = '#8f1e16'; ctx.fillRect(f.x, f.y, f.s, f.s); }
    else if (f.type === 'spark') { ctx.fillStyle = '#e3c07a'; ctx.fillRect(f.x, f.y, 2, 2); }
    else if (f.type === 'dust') { ctx.fillStyle = 'rgba(160,150,130,.5)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.s + t * 4, 0, 7); ctx.fill(); }
    else if (f.type === 'heal') { ctx.fillStyle = 'rgba(214,198,150,.85)'; ctx.fillRect(f.x, f.y, 2.5, 2.5); }
    else if (f.type === 'shadow') { ctx.fillStyle = 'rgba(110,74,125,.8)'; ctx.fillRect(f.x, f.y, 3, 3); }
    else if (f.type === 'fire') { ctx.fillStyle = `rgba(${230 - t * 80 | 0},${140 - t * 90 | 0},60,.9)`; ctx.fillRect(f.x, f.y, f.s, f.s); }
    else if (f.type === 'necro') { ctx.fillStyle = 'rgba(78,143,122,.7)'; ctx.fillRect(f.x, f.y, 3, 3); }
    else if (f.type === 'ghost') { ctx.fillStyle = 'rgba(216,205,182,.22)'; ctx.fillRect(f.x - 7, f.y - 30, 14, 34); ctx.beginPath(); ctx.arc(f.x, f.y - 25, 6, 0, 7); ctx.fill(); }
    else if (f.type === 'ring') { ctx.strokeStyle = `rgba(214,198,150,${1 - t})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + t * 40, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
}

// ---------------- Licht & Wetter ----------------
export function ambient() {
  const h = S.minute / 60;
  if (S.map === 'mine') return 0.82;
  let a = 0;
  if (h < 5) a = 0.72; else if (h < 7) a = 0.72 - (h - 5) / 2 * 0.62;
  else if (h < 17) a = 0.08; else if (h < 20) a = 0.08 + (h - 17) / 3 * 0.5;
  else a = 0.58 + (h - 20) / 4 * 0.18;
  if (S.weather === 'rain') a += 0.12; if (S.weather === 'fog') a += 0.06; if (S.weather === 'cloudy') a += 0.05;
  return clamp(a, 0, 0.86);
}
function drawLight(now) {
  const a = ambient();
  if (a < 0.06) return;
  dctx.setTransform(1, 0, 0, 1, 0, 0);
  dctx.clearRect(0, 0, dark.width, dark.height);          // sonst summiert sich die Dunkelheit jeden Frame
  dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const night = S.map === 'mine' ? '6,8,10' : (S.minute / 60 > 18 || S.minute / 60 < 6) ? '10,14,28' : '20,18,14';
  dctx.globalCompositeOperation = 'source-over';
  dctx.fillStyle = `rgba(${night},${a})`;
  dctx.fillRect(0, 0, W, H);
  dctx.globalCompositeOperation = 'destination-out';
  const lights = [];
  const pl = S.player;
  if (pl && pl.map === S.map) lights.push({ x: pl.x, y: pl.y, r: S.map === 'mine' ? 150 : 120 });
  for (const e of S.ents[S.map]) {
    if (e.kind === 'prop' && (e.type === 'torch' || e.type === 'campfire_static')) lights.push({ x: e.x, y: e.y, r: e.type === 'torch' ? 95 : 140 });
    if (e.kind === 'building' && e.type === 'campfire' && e.built >= 1) lights.push({ x: e.x, y: e.y, r: 150 });
    if (e.kind === 'building' && e.type === 'smithy' && e.built >= 1) lights.push({ x: e.x, y: e.y, r: 110 });
    if (e.kind === 'prop' && e.type === 'shrine') lights.push({ x: e.x, y: e.y, r: 90 });
  }
  for (const l of lights) {
    const sx = (l.x - cam.x) * cam.zoom, sy = (l.y - cam.y) * cam.zoom;
    if (sx < -260 || sy < -260 || sx > W + 260 || sy > H + 260) continue;
    const r = l.r * cam.zoom * (0.94 + 0.06 * Math.sin(now / 160 + l.x));
    const g = dctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,.72)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g; dctx.beginPath(); dctx.arc(sx, sy, r, 0, 7); dctx.fill();
  }
  dctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(dark, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // warmer Lichtstich
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    const sx = (l.x - cam.x) * cam.zoom, sy = (l.y - cam.y) * cam.zoom;
    if (sx < -200 || sy < -200 || sx > W + 200 || sy > H + 200) continue;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, l.r * cam.zoom * 0.8);
    g.addColorStop(0, 'rgba(210,140,60,.10)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, l.r * cam.zoom * 0.8, 0, 7); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

const rainDrops = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random() }));
function drawWeather(now) {
  if (S.map === 'mine') return;
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
export function drawPortraitTo(canvas, ch) {
  const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  c.clearRect(0, 0, w, h);
  c.fillStyle = '#14110d'; c.fillRect(0, 0, w, h);
  const g = c.createRadialGradient(w * .5, h * .35, 2, w * .5, h * .5, w * .8);
  g.addColorStop(0, 'rgba(90,76,56,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const p = (ch && ch.pal) || {}; const s = w / 56;
  c.save(); c.translate(w / 2, h * 0.92); c.scale(s * 1.9, s * 1.9);
  c.fillStyle = p.cloth || '#4a3a28'; c.fillRect(-9, -13, 18, 13);
  if (p.armor) { c.fillStyle = p.armor; c.fillRect(-9, -13, 18, 6); }
  c.fillStyle = p.skin || SKIN[0]; c.beginPath(); c.arc(0, -19, 7.5, 0, 7); c.fill();
  c.fillStyle = 'rgba(20,14,10,.8)'; c.fillRect(-3.4, -20.5, 2, 2.2); c.fillRect(1.6, -20.5, 2, 2.2);
  if (p.helm) { c.fillStyle = p.helm; c.beginPath(); c.arc(0, -20, 8, Math.PI, 0); c.fill(); c.fillRect(-8, -20, 16, 3); }
  else { c.fillStyle = p.hair || HAIR[0]; c.beginPath(); c.arc(0, -21, 7.8, Math.PI, 0); c.fill(); c.fillRect(-7.6, -21, 15.2, 3.4); }
  if (ch && ch.undead) { c.fillStyle = 'rgba(78,143,122,.55)'; c.beginPath(); c.arc(-2, -20, 1.8, 0, 7); c.arc(2.4, -20, 1.8, 0, 7); c.fill(); }
  c.restore();
  c.strokeStyle = 'rgba(0,0,0,.5)'; c.strokeRect(0.5, 0.5, w - 1, h - 1);
}

export function drawItemIconTo(canvas, key) {
  const it = ITEMS[key]; const c = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 48, h = canvas.height = canvas.clientHeight || 48;
  c.clearRect(0, 0, w, h); if (!it) return;
  c.save(); c.translate(w / 2, h / 2); const s = w / 48; c.scale(s, s);
  const metal = it.rarity === 'legendary' ? '#d8b25a' : it.rarity === 'epic' ? '#b39b6a' : '#a8a196';
  const wood = '#5b452a';
  if (it.slot === 'weapon') {
    c.rotate(-0.7);
    if (it.wtype === 'bow') { c.strokeStyle = wood; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 13, -1.8, 1.8); c.stroke(); c.strokeStyle = '#ddd3c0'; c.lineWidth = 1; c.beginPath(); c.moveTo(-3, -12.8); c.lineTo(-3, 12.8); c.stroke(); }
    else if (it.wtype === 'staff') { c.fillStyle = wood; c.fillRect(-2, -18, 4, 34); c.fillStyle = '#7b5aa0'; c.beginPath(); c.arc(0, -19, 5, 0, 7); c.fill(); }
    else if (it.wtype === 'axe') { c.fillStyle = wood; c.fillRect(-2, -16, 4, 32); c.fillStyle = metal; c.beginPath(); c.moveTo(2, -14); c.lineTo(15, -8); c.lineTo(15, 2); c.lineTo(2, 0); c.fill(); }
    else if (it.wtype === 'spear') { c.fillStyle = wood; c.fillRect(-1.5, -14, 3, 32); c.fillStyle = metal; c.beginPath(); c.moveTo(-4, -14); c.lineTo(0, -22); c.lineTo(4, -14); c.fill(); }
    else if (it.wtype === 'mace') { c.fillStyle = wood; c.fillRect(-2, -8, 4, 26); c.fillStyle = metal; c.beginPath(); c.arc(0, -12, 7, 0, 7); c.fill(); }
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
export function drawTitleScene(canvas, t) {
  const c = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth, h = canvas.height = canvas.clientHeight;
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#171a24'); sky.addColorStop(.45, '#3a2a26'); sky.addColorStop(.62, '#7d3a24'); sky.addColorStop(.75, '#2a1e18'); sky.addColorStop(1, '#0c0a08');
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  // Wolkenbänder
  for (let i = 0; i < 7; i++) {
    const y = h * (.12 + i * .055), off = (t / (40 + i * 12)) % (w + 400) - 200;
    c.fillStyle = `rgba(20,16,18,${.18 + i * .03})`;
    c.beginPath(); c.ellipse(off, y, 220 - i * 12, 12 + i, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(off + 420, y + 8, 160, 10, 0, 0, 7); c.fill();
  }
  // Hügel
  c.fillStyle = '#231a19'; c.beginPath(); c.moveTo(0, h * .68);
  for (let x = 0; x <= w; x += 40) c.lineTo(x, h * .68 - Math.sin(x / 260) * 34 - Math.sin(x / 70) * 6);
  c.lineTo(w, h); c.lineTo(0, h); c.fill();
  // Feste (Mittelgrund)
  const bx = w * .62, by = h * .70;
  c.fillStyle = '#191413';
  c.fillRect(bx - 200, by - 90, 400, 120);
  c.fillRect(bx - 250, by - 55, 60, 85); c.fillRect(bx + 190, by - 130, 70, 160);
  c.fillStyle = '#0f0c0b';
  for (let i = 0; i < 9; i++) c.fillRect(bx - 200 + i * 45, by - 110, 22, 22);   // Zinnen (Lücken)
  c.fillStyle = '#221a18'; c.fillRect(bx - 40, by - 30, 80, 60);                  // Torbogen
  c.fillStyle = '#060505'; c.beginPath(); c.moveTo(bx - 28, by + 30); c.lineTo(bx - 28, by - 6); c.quadraticCurveTo(bx, by - 34, bx + 28, by - 6); c.lineTo(bx + 28, by + 30); c.fill();
  // Banner
  const sway = Math.sin(t / 700) * 4;
  c.fillStyle = '#5b2119'; c.beginPath(); c.moveTo(bx + 214, by - 120); c.lineTo(bx + 250 + sway, by - 114); c.lineTo(bx + 244 + sway, by - 60); c.lineTo(bx + 214, by - 66); c.fill();
  // Lagerfeuer vorn
  const fx = w * .30, fy = h * .86, f = Math.sin(t / 90) * .5 + .5;
  c.fillStyle = '#100d0b'; c.beginPath(); c.ellipse(fx, fy + 6, 60, 16, 0, 0, 7); c.fill();
  c.fillStyle = '#2a1f16'; c.fillRect(fx - 34, fy - 4, 68, 10); c.fillRect(fx - 8, fy - 20, 16, 26);
  c.fillStyle = `rgba(190,80,28,${.6 + f * .25})`; c.beginPath(); c.moveTo(fx - 22, fy); c.quadraticCurveTo(fx, fy - 70 - f * 22, fx + 22, fy); c.fill();
  c.fillStyle = `rgba(240,180,80,${.5 + f * .3})`; c.beginPath(); c.moveTo(fx - 11, fy); c.quadraticCurveTo(fx + 3, fy - 44 - f * 14, fx + 12, fy); c.fill();
  // Funken
  for (let i = 0; i < 40; i++) {
    const p = (t / 26 + i * 97) % 300;
    const px = fx + Math.sin((t / 400) + i) * (18 + p / 7), py = fy - p;
    c.fillStyle = `rgba(230,150,60,${Math.max(0, .75 - p / 300)})`;
    c.fillRect(px, py, 2, 2);
  }
  // Vordergrund: kaputtes Tor + Gras
  c.fillStyle = '#0a0807';
  c.beginPath(); c.moveTo(0, h); c.lineTo(0, h * .80); c.lineTo(w * .1, h * .84); c.lineTo(w * .16, h); c.fill();
  c.fillStyle = '#100d0b';
  for (let x = 0; x < w; x += 9) {
    const s = Math.sin(t / 900 + x / 60) * 4;
    c.fillRect(x, h - 26 - (x % 3) * 5, 2, 30);
    c.fillRect(x + 4 + s * .3, h - 18, 2, 22);
  }
  const shade = c.createLinearGradient(0, 0, w * .62, 0);              // Lesbarkeit links, weich auslaufend
  shade.addColorStop(0, 'rgba(10,8,7,.62)'); shade.addColorStop(1, 'rgba(10,8,7,0)');
  c.fillStyle = shade; c.fillRect(0, 0, w, h);
}
