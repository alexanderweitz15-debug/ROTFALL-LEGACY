// Weltkarte (Session 12, Nutzer: „Karte wie auf dem Bild, mit Fog of War“): gemalte Landkarte statt Kachelfarben.
// Grundbild einmal je Welt (1 Pixel je Kachel, Relief, Rauschen, Küsten), darauf Symbole im Anzeigemaßstab (Gipfel, Wälder,
// Burgen, Dörfer, Ruinen), Herrschaftsgrenzen (Kette bernstein, Menschen gold, Totenland rot) und der Nebel des Unerkundeten.
import { S } from './state.js?v=19';
import { MAPS, T, TS, LOCATIONS, regionAt, OX } from './world.js?v=19';

// ---------------- Nebel: 8×8-Kachel-Zellen, bitweise, im Spielstand als Base64 (S.fog) ----------------
const FC = 8;
let fog = null, fogW = 0, fogH = 0;
function fogReady() {
  const m = MAPS.world; if (!m) return false;
  const w = Math.ceil(m.w / FC), h = Math.ceil(m.h / FC);
  if (fog && fogW === w && fogH === h) return true;
  fogW = w; fogH = h; fog = new Uint8Array(Math.ceil(w * h / 8));
  if (S.fog) { try { const b = atob(S.fog); if (b.length === fog.length) for (let i = 0; i < b.length; i++) fog[i] = b.charCodeAt(i); } catch (e) { /* leer lassen */ } }
  return true;
}
const fogAt = (cx, cy) => cx >= 0 && cy >= 0 && cx < fogW && cy < fogH && (fog[(cy * fogW + cx) >> 3] >> ((cy * fogW + cx) & 7)) & 1;
export function revealAround(tx, ty, r = 18) {                  // r in Kacheln (Sichtweite im Freien)
  if (!fogReady()) return;
  let changed = false; const rc = Math.ceil(r / FC), cx0 = Math.floor(tx / FC), cy0 = Math.floor(ty / FC);
  for (let cy = cy0 - rc; cy <= cy0 + rc; cy++) for (let cx = cx0 - rc; cx <= cx0 + rc; cx++) {
    if (cx < 0 || cy < 0 || cx >= fogW || cy >= fogH || Math.hypot((cx + 0.5) * FC - tx, (cy + 0.5) * FC - ty) > r + FC * 0.7) continue;
    const i = cy * fogW + cx; if (!((fog[i >> 3] >> (i & 7)) & 1)) { fog[i >> 3] |= 1 << (i & 7); changed = true; }
  }
  if (changed) { let s = ''; for (let i = 0; i < fog.length; i++) s += String.fromCharCode(fog[i]); S.fog = btoa(s); }
}
export function explored(tx, ty) { return !!S.dbg?.reveal || (fogReady() && !!fogAt(Math.floor(tx / FC), Math.floor(ty / FC))); }   // Debug: ganze Welt

// ---------------- Grundbild ----------------
const hsh = (x, y) => { let n = (x * 374761393 + y * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const vn = (x, y, s) => { const X = Math.floor(x / s), Y = Math.floor(y / s), fx = x / s - X, fy = y / s - Y, sm = t => t * t * (3 - 2 * t);
  const a = hsh(X, Y), b = hsh(X + 1, Y), c = hsh(X, Y + 1), d = hsh(X + 1, Y + 1), u = sm(fx), v = sm(fy); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const TCOL = { [T.GRASS]: [62, 88, 40], [T.DIRT]: [104, 82, 54], [T.ROAD]: [186, 158, 104], [T.WATER]: [28, 58, 96], [T.MARSH]: [40, 72, 62], [T.STONE]: [128, 124, 116],
  [T.PLANK]: [120, 92, 60], [T.ROCK]: [92, 86, 80], [T.WALL]: [60, 56, 52], [T.SAND]: [184, 152, 92], [T.ASH]: [74, 68, 64], [T.FIELD]: [140, 118, 58], [T.DFLOOR]: [52, 46, 44] };
const REGTINT = { aurel: [150, 160, 90, 0.07], deadland: [120, 20, 22, 0.42], blight: [60, 50, 64, 0.3], eisen: [70, 52, 36, 0.2], mountain: [210, 214, 222, 0.12], desert: [200, 150, 70, 0.12], forest: [20, 50, 24, 0.25] };
let base = null, baseKey = '';
function buildBase() {
  const m = MAPS.world, key = m.w + 'x' + m.h + '|' + S.seed;
  if (base && baseKey === key) return base;
  const cv = document.createElement('canvas'); cv.width = m.w; cv.height = m.h;
  const c = cv.getContext('2d'), img = c.createImageData(m.w, m.h), D = img.data;
  const isR = (x, y) => { const t = m.tiles[y * m.w + x]; return t === T.ROCK ? 1 : t === T.STONE ? 0.5 : 0; };
  const reg = new Array(Math.ceil(m.w / 4) * Math.ceil(m.h / 4)), RW = Math.ceil(m.w / 4);
  for (let y = 0; y < m.h; y += 4) for (let x = 0; x < m.w; x += 4) reg[(y >> 2) * RW + (x >> 2)] = regionAt(x, y);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const t = m.tiles[y * m.w + x], k = (y * m.w + x) * 4, rg = reg[(y >> 2) * RW + (x >> 2)];
    let [r, g, b] = TCOL[t] || TCOL[T.GRASS];
    const n = vn(x, y, 9) * 0.6 + vn(x, y, 3) * 0.4 - 0.5;                                // Pinselstruktur
    let f = 1 + n * 0.28;
    if (x > 0 && y > 0 && x < m.w - 1 && y < m.h - 1 && t !== T.WATER) f += (isR(x - 1, y - 1) - isR(x + 1, y + 1)) * 0.22;   // Relief: Licht von Nordwest
    if (t === T.ROCK && rg === 'mountain' && vn(x, y, 5) > 0.55) { r = 226; g = 230; b = 236; }   // Schneefelder
    if (t === T.WATER && !(x > 1 && y > 1 && x < m.w - 2 && y < m.h - 2 && [[3, 0], [-3, 0], [0, 3], [0, -3]].some(([dx, dy]) => m.tiles[(y + dy) * m.w + x + dx] !== T.WATER))) { r = 16; g = 30; b = 48; f = 0.85 + vn(x, y, 30) * 0.25 + (vn(x * 2, y * 5, 6) > 0.8 ? 0.2 : 0); }   // offenes Meer: tief, feine Wellen
    else if (t === T.WATER) { const shore = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => m.tiles[(y + dy) * m.w + x + dx] !== T.WATER); if (shore) { r = 70; g = 110; b = 140; } else f = 0.85 + vn(x, y, 14) * 0.3; if (rg === 'deadland' && y < 700) { r = shore ? 110 : 58; g = shore ? 40 : 14; b = shore ? 40 : 18; } }   // Totenland: dunkle Blutseen
    const tn = REGTINT[rg]; if (tn && t !== T.WATER && t !== T.ROAD) { r += (tn[0] - r) * tn[3]; g += (tn[1] - g) * tn[3]; b += (tn[2] - b) * tn[3]; }
    D[k] = Math.max(0, Math.min(255, r * f)); D[k + 1] = Math.max(0, Math.min(255, g * f)); D[k + 2] = Math.max(0, Math.min(255, b * f)); D[k + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  base = { cv, reg, RW }; baseKey = key; return base;
}

// ---------------- Symbole ----------------
function peak(c, x, y, s, snow) {
  c.fillStyle = '#4a4540'; c.beginPath(); c.moveTo(x - s, y + s * 0.6); c.lineTo(x, y - s); c.lineTo(x + s, y + s * 0.6); c.fill();
  c.fillStyle = '#6e6862'; c.beginPath(); c.moveTo(x - s, y + s * 0.6); c.lineTo(x, y - s); c.lineTo(x - s * 0.1, y + s * 0.6); c.fill();   // Lichtseite
  if (snow) { c.fillStyle = '#e8ecf0'; c.beginPath(); c.moveTo(x - s * 0.42, y - s * 0.16); c.lineTo(x, y - s); c.lineTo(x + s * 0.4, y - s * 0.2); c.lineTo(x + s * 0.1, y - s * 0.3); c.lineTo(x - s * 0.1, y - s * 0.08); c.fill(); }
  c.strokeStyle = 'rgba(12,10,8,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - s, y + s * 0.6); c.lineTo(x, y - s); c.lineTo(x + s, y + s * 0.6); c.stroke();
}
function tree(c, x, y, s, kind) {
  if (kind === 'dead') { c.strokeStyle = '#2a1a16'; c.lineWidth = Math.max(1, s * 0.25); c.beginPath(); c.moveTo(x, y + s); c.lineTo(x, y - s * 0.4); c.moveTo(x, y); c.lineTo(x - s * 0.6, y - s * 0.7); c.moveTo(x, y - s * 0.2); c.lineTo(x + s * 0.6, y - s * 0.8); c.stroke(); return; }
  if (kind === 'pine') { c.fillStyle = '#1c3020'; c.beginPath(); c.moveTo(x - s * 0.6, y + s * 0.7); c.lineTo(x, y - s); c.lineTo(x + s * 0.6, y + s * 0.7); c.fill(); c.fillStyle = '#2e4a2c'; c.beginPath(); c.moveTo(x - s * 0.6, y + s * 0.7); c.lineTo(x, y - s); c.lineTo(x - s * 0.05, y + s * 0.7); c.fill(); return; }
  c.fillStyle = '#20361a'; c.beginPath(); c.arc(x + s * 0.12, y + s * 0.1, s * 0.62, 0, 7); c.fill();
  c.fillStyle = '#35542a'; c.beginPath(); c.arc(x - s * 0.1, y - s * 0.12, s * 0.5, 0, 7); c.fill();
}
function castle(c, x, y, s, dark, col) {
  c.fillStyle = dark ? '#221c1c' : '#5a5046'; c.strokeStyle = '#0c0a08'; c.lineWidth = 1;
  c.fillRect(x - s, y - s * 0.5, s * 2, s); c.strokeRect(x - s, y - s * 0.5, s * 2, s);
  for (const dx of [-s, -s * 0.2, s * 0.6]) { c.fillRect(x + dx, y - s * 1.1, s * 0.4, s * 0.6); c.strokeRect(x + dx, y - s * 1.1, s * 0.4, s * 0.6); }
  c.fillRect(x - s * 0.25, y - s * 1.6, s * 0.5, s * 1.1); c.strokeRect(x - s * 0.25, y - s * 1.6, s * 0.5, s * 1.1);
  c.fillStyle = col; c.fillRect(x - s * 0.1, y - s * 2.3, s * 0.55, s * 0.4); c.fillStyle = '#0c0a08'; c.fillRect(x - s * 0.12, y - s * 2.3, 1, s * 0.75);   // Wimpel
  c.fillStyle = dark ? '#8a2020' : '#e0b860'; c.fillRect(x - s * 0.1, y - s * 0.05, s * 0.2, s * 0.25);                                       // Licht im Tor
}
function hamlet(c, x, y, s, roof) {
  for (const [dx, dy] of [[-s * 0.7, 0], [s * 0.5, -s * 0.3], [0, s * 0.5]]) {
    c.fillStyle = '#6a5a44'; c.fillRect(x + dx - s * 0.35, y + dy - s * 0.1, s * 0.7, s * 0.45);
    c.fillStyle = roof; c.beginPath(); c.moveTo(x + dx - s * 0.45, y + dy - s * 0.08); c.lineTo(x + dx, y + dy - s * 0.5); c.lineTo(x + dx + s * 0.45, y + dy - s * 0.08); c.fill();
    c.strokeStyle = '#0c0a08'; c.lineWidth = 1; c.strokeRect(x + dx - s * 0.35, y + dy - s * 0.1, s * 0.7, s * 0.45);
  }
}
function ruin(c, x, y, s, red) {
  c.fillStyle = red ? '#3a1414' : '#5a544c';
  for (const [dx, h] of [[-s * 0.6, s * 0.9], [-s * 0.1, s * 1.4], [s * 0.45, s * 0.7]]) { c.fillRect(x + dx, y - h, s * 0.32, h); }
  if (red) { c.fillStyle = '#c02a20'; c.fillRect(x - s * 0.02, y - s * 1.3, s * 0.12, s * 0.12); }
}
function label(c, text, x, y, size, col, italic = false) {
  c.font = `${italic ? 'italic ' : ''}bold ${size}px Spectral, serif`; c.textAlign = 'center';
  c.lineJoin = 'round'; c.lineWidth = Math.max(2, size / 4); c.strokeStyle = 'rgba(8,6,5,.92)'; c.strokeText(text, x, y); c.fillStyle = col; c.fillText(text, x, y);
}

// ---------------- Karte zeichnen ----------------
const FACCOL = { aurel: '#e8c878', chain: '#e0a040', goblin: '#b8a050', undead: '#e04a3a', valen: '#e8d070', order: '#f0e6c8', merch: '#e8c060', bandit: '#b86a40' };
// Debug-Karte (MP2 §71): alle Lebenden und Ziele — Gegner rot, Bosse groß, wichtige NPCs gold, Verteidigungsmeister blau,
// Karawanen weiß, Auftragsziele gelb, Heere (Feldzug) schwarz-rot, Spieler grün. Unabhängig vom Nebel.
function debugMarks(c, SX, SY, sc, w, h) {
  const dot = (x, y, r, col) => { const X = SX(x), Y = SY(y); if (X < -5 || Y < -5 || X > w + 5 || Y > h + 5) return; c.fillStyle = col; c.beginPath(); c.arc(X, Y, r, 0, 7); c.fill(); };
  for (const e of S.ents.world) {
    if (!e.alive && e.kind !== 'caravan') continue; const x = e.x / TS, y = e.y / TS;
    if (e.kind === 'enemy') dot(x, y, e.boss ? 4 : 1.4, e.boss ? '#ff3020' : 'rgba(230,60,40,.8)');
    else if (e.kind === 'caravan') dot(x, y, 3, '#f0f0e0');
    else if (e.kind === 'npc' && e.vm) dot(x, y, 2.5, '#60a0ff');
    else if (e.kind === 'npc' && e.camp) dot(x, y, 2, '#8a1a1a');
    else if (e.kind === 'npc' && (e.key && !e.villager && !e.guard)) dot(x, y, 2, '#f0c040');
  }
  for (const C of S.contracts || []) if (C.state === 'active') dot(C.x, C.y, 3.5, '#ffe040');
  dot(S.player.x / TS, S.player.y / TS, 4, '#40ff60');
}
export function drawAtlas(cv, zoom, extra = { place: () => true }) {   // S15 Fehlersuche: die Minikarte ruft ohne extra auf
  const c = cv.getContext('2d'), w = cv.width, h = cv.height, m = MAPS.world, p = S.player;
  const B = buildBase(); fogReady();
  const sc = Math.min(w / m.w, h / m.h) * zoom;
  const ox = zoom > 1 ? w / 2 - p.x / TS * sc : (w - m.w * sc) / 2, oy = zoom > 1 ? h / 2 - p.y / TS * sc : (h - m.h * sc) / 2;
  c.fillStyle = '#0b0a08'; c.fillRect(0, 0, w, h);
  c.imageSmoothingEnabled = sc < 1; c.drawImage(B.cv, ox, oy, m.w * sc, m.h * sc); c.imageSmoothingEnabled = true;
  const X0 = Math.max(0, Math.floor(-ox / sc)), X1 = Math.min(m.w, Math.ceil((w - ox) / sc)), Y0 = Math.max(0, Math.floor(-oy / sc)), Y1 = Math.min(m.h, Math.ceil((h - oy) / sc));
  const SX = x => ox + x * sc, SY = y => oy + y * sc;
  // Herrschaftsgrenzen: Linie, wo die Großregion wechselt (Kette | Menschen | Tote)
  const bloc = r => r === 'deadland' || r === 'blight' ? 'undead' : r === 'eisen' ? 'chain' : r === 'aurel' ? 'aurel' : r === 'mountain' ? 'mtn' : 'men';
  const g = 8; c.lineWidth = Math.max(1.5, sc * 2.2);
  for (let y = Y0 - Y0 % g; y < Y1; y += g) for (let x = X0 - X0 % g; x < X1; x += g) {
    const a = bloc(B.reg[(y >> 2) * B.RW + (x >> 2)]);
    for (const [dx, dy] of [[g, 0], [0, g]]) { if (x + dx >= m.w || y + dy >= m.h) continue;
      const b = bloc(B.reg[((y + dy) >> 2) * B.RW + ((x + dx) >> 2)]); if (a === b || a === 'mtn' || b === 'mtn') continue;
      if (m.tiles[y * m.w + x] === T.WATER || m.tiles[(y + dy) * m.w + x + dx] === T.WATER) continue;   // keine Grenze übers Wasser
      const u = a === 'undead' || b === 'undead', au = a === 'aurel' || b === 'aurel';
      c.strokeStyle = u ? 'rgba(224,60,48,.55)' : au ? 'rgba(236,210,140,.5)' : 'rgba(230,180,80,.5)'; c.beginPath();
      if (dx) { c.moveTo(SX(x + g), SY(y)); c.lineTo(SX(x + g), SY(y + g)); } else { c.moveTo(SX(x), SY(y + g)); c.lineTo(SX(x + g), SY(y + g)); } c.stroke(); }
  }
  // Gipfel und Wälder (Raster, versetzt; Größe folgt dem Maßstab)
  const step = Math.max(4, Math.round(10 / Math.max(0.5, sc)));
  for (let y = Y0 - Y0 % step; y < Y1; y += step) for (let x = X0 - X0 % step; x < X1; x += step) {
    const jx = x + Math.floor(hsh(x, y) * step * 0.6), jy = y + Math.floor(hsh(y, x) * step * 0.6); if (jx >= m.w || jy >= m.h) continue;
    const t = m.tiles[jy * m.w + jx], rg = B.reg[(jy >> 2) * B.RW + (jx >> 2)], s = Math.max(3, step * sc * 0.55);
    if (t === T.ROCK) peak(c, SX(jx), SY(jy), s * 1.1, rg === 'mountain' || jy < 140);
    else if (rg === 'deadland' && hsh(jx, jy + 3) < 0.35) tree(c, SX(jx), SY(jy), s * 0.8, 'dead');
    else if ((rg === 'forest' || rg === 'eisen') && (t === T.GRASS || t === T.DIRT) && hsh(jx + 1, jy) < 0.55) tree(c, SX(jx), SY(jy), s * 0.8, 'pine');
  }
  if (S.ents.world) for (const e of S.ents.world) if (e.type === 'tree' && hsh(e.x | 0, e.y | 0) < 0.08) {   // echte Wälder
    const x = e.x / TS, y = e.y / TS; if (x < X0 || x > X1 || y < Y0 || y > Y1) continue; tree(c, SX(x), SY(y), Math.max(2.5, 3.2 * sc), 'oak'); }
  // Orte
  const seen = S.flags.seen || {};
  for (const l of LOCATIONS) {
    const x = SX(l.x), y = SY(l.y), k = seen[l.key], s = Math.max(4, Math.min(12, 5 * sc + 3)), col = FACCOL[l.faction] || '#e8d070';
    if (x < -40 || y < -40 || x > w + 40 || y > h + 40) continue;
    if (l.poi && zoom < 2) continue;                                           // Weltansicht: keine Symbolflut (Nutzer)
    if (l.kind === 'city') castle(c, x, y, s * (l.faction === 'chain' || l.faction === 'undead' ? 1.2 : 1), l.faction === 'chain' || l.faction === 'undead', col);
    else if (l.kind === 'village') hamlet(c, x, y, s * 0.9, l.tribute ? '#4a3a2a' : l.faction === 'order' ? '#3e4a5e' : '#8a3a2a');
    else if (l.kind === 'ruin') ruin(c, x, y, s * 0.8, l.faction === 'undead');
    else if (l.kind === 'dungeon') { c.fillStyle = '#1a1614'; c.beginPath(); c.arc(x, y, s * 0.5, Math.PI, 0); c.lineTo(x + s * 0.5, y + s * 0.2); c.lineTo(x - s * 0.5, y + s * 0.2); c.fill(); }
    else if (l.kind === 'camp') { c.fillStyle = l.faction === 'goblin' ? '#6a7a3a' : l.faction === 'bandit' ? '#8a2a1a' : '#7a5a3a'; c.beginPath(); c.moveTo(x - s * 0.5, y + s * 0.3); c.lineTo(x, y - s * 0.5); c.lineTo(x + s * 0.5, y + s * 0.3); c.fill();
      if (l.poi === 'bandits') { c.strokeStyle = '#e0c080'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 3, y - 6); c.lineTo(x + 3, y); c.moveTo(x + 3, y - 6); c.lineTo(x - 3, y); c.stroke(); } }
    else if (l.kind === 'farm') hamlet(c, x, y, s * 0.55, '#7a5a30');
    else if (l.kind === 'tower') { c.fillStyle = '#4a4440'; c.fillRect(x - s * 0.18, y - s * 0.9, s * 0.36, s * 0.9); c.fillRect(x - s * 0.28, y - s * 1.05, s * 0.56, s * 0.2); c.strokeStyle = '#0c0a08'; c.lineWidth = 1; c.strokeRect(x - s * 0.18, y - s * 0.9, s * 0.36, s * 0.9); }
    else if (l.kind === 'mine') { c.strokeStyle = '#c8b890'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 4, y - 4); c.lineTo(x + 4, y + 4); c.moveTo(x + 4, y - 4); c.lineTo(x - 4, y + 4); c.stroke(); c.fillStyle = '#1a1614'; c.fillRect(x - 2, y + 2, 4, 3); }
    else if (l.kind === 'wreck') { c.strokeStyle = '#6a4a2a'; c.lineWidth = 2; c.beginPath(); c.arc(x, y - 1, s * 0.45, 0.2, Math.PI - 0.2); c.stroke(); c.fillStyle = '#6a4a2a'; c.fillRect(x - 0.5, y - s * 0.7, 1.5, s * 0.6); }
    else if (l.kind === 'shrine') { c.fillStyle = l.faction === 'undead' ? '#5a2a2a' : '#8a8478'; c.fillRect(x - 1.5, y - s * 0.7, 3, s * 0.7); c.fillRect(x - 3, y - s * 0.5, 6, 1.5); }
  }
  // Nebel: weiche Kante (kleine Maske, geglättet hochskaliert) — im Debug „ganze Welt“ aus, dafür alle Lebenden als Punkte
  if (S.dbg?.reveal) debugMarks(c, SX, SY, sc, w, h);
  else { const fcv = document.createElement('canvas'); fcv.width = fogW; fcv.height = fogH;
  const fc = fcv.getContext('2d'), fd = fc.createImageData(fogW, fogH);
  for (let i = 0; i < fogW * fogH; i++) { const on = (fog[i >> 3] >> (i & 7)) & 1; fd.data[i * 4] = 10; fd.data[i * 4 + 1] = 9; fd.data[i * 4 + 2] = 8; fd.data[i * 4 + 3] = on ? 0 : 246; }
  fc.putImageData(fd, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(fcv, ox - FC * sc / 2, oy - FC * sc / 2, fogW * FC * sc + FC * sc, fogH * FC * sc + FC * sc); }
  // Namen (nur Erkundetes), große Landesnamen
  const place = extra.place;
  for (const [text, tx, ty, col] of [['DIE EISENMARK', 120, 250, 'rgba(224,160,64,.8)'], ['KÖNIGREICH VALEN', OX + 330, 330, 'rgba(232,208,112,.8)'], ['DAS TOTENLAND', OX + 1024, 330, 'rgba(224,74,58,.8)'], ['GRENZLAND DER TOTEN', OX + 620, 560, 'rgba(192,112,96,.75)'], ['HOCHREICH AURELION', 860, 940, 'rgba(236,214,150,.85)']])
    if (explored(tx, ty)) label(c, text, SX(tx), SY(ty), Math.max(12, Math.min(26, 13 * sc + 8)), col, true);
  const RANK = { city: 0, village: 1, dungeon: 2, camp: 3, ruin: 4, shrine: 5, road: 6, wild: 7 };
  for (const l of LOCATIONS.slice().sort((a, b) => (RANK[a.kind] ?? 9) - (RANK[b.kind] ?? 9))) {
    if (!seen[l.key] && !explored(l.x, l.y)) continue;
    if (l.kind === 'wild' && l.r > 60) continue;                                   // große Gebiete tragen den Landesnamen
    if (l.poi && zoom < 2) continue;                                               // Streuorte: Namen erst in der Umgebungsansicht
    const at = place(l.name, SX(l.x), SY(l.y) + 4); if (at) label(c, l.name, at[0], at[1], l.kind === 'city' ? 13 : 11, l.faction === 'undead' ? '#f08070' : l.faction === 'chain' || l.faction === 'goblin' ? '#f0b860' : l.kind === 'city' ? '#f4e2b0' : '#e8e0cc');
  }
  for (const [text, tx, ty] of [['Südsee', 1000, 790], ['Roter Ozean', 1440, 1000]]) label(c, text, SX(tx), SY(ty), 12, 'rgba(160,180,200,.55)', true);
  if (zoom <= 1) { const ty = h - 62; c.fillStyle = 'rgba(14,12,10,.86)'; c.fillRect(10, ty, 196, 48); c.strokeStyle = '#6a5436'; c.lineWidth = 1.5; c.strokeRect(13.5, ty + 3.5, 190, 42);
    label(c, 'DIE WELT VON', 108, ty + 18, 10, '#bfb49c'); label(c, 'VALORIS', 108, ty + 40, 22, '#e6cf98'); }
  // Kompassrose und Maßstab (Referenzkarte)
  const cx = w - 190, cy = h - 34, R = 20;
  c.save(); c.translate(cx, cy); c.strokeStyle = 'rgba(220,210,190,.55)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, R * 0.62, 0, 7); c.stroke();
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, L = k % 2 ? R * 0.55 : R;
    c.fillStyle = k % 2 ? 'rgba(170,160,140,.8)' : 'rgba(230,222,204,.9)'; c.beginPath(); c.moveTo(Math.cos(a) * L, Math.sin(a) * L);
    c.lineTo(Math.cos(a + 0.28) * R * 0.18, Math.sin(a + 0.28) * R * 0.18); c.lineTo(0, 0); c.lineTo(Math.cos(a - 0.28) * R * 0.18, Math.sin(a - 0.28) * R * 0.18); c.fill(); }
  c.restore();
  for (const [t, dx, dy] of [['N', 0, -R - 8], ['S', 0, R + 14], ['W', -R - 10, 4], ['O', R + 10, 4]]) label(c, t, cx + dx, cy + dy, 12, '#e6dcc4');
  const km = 100, px = km / 2 * sc;                                   // 1 Kachel ≈ 0,5 km
  if (px > 30 && px < w * 0.4) { const bx = w - px - 30, by = h - 24; c.fillStyle = 'rgba(230,222,204,.9)'; c.fillRect(bx, by, px, 3); for (let k = 0; k <= 4; k++) c.fillRect(bx + px * k / 4 - 0.5, by - 4, 1, 7);
    label(c, '0', bx, by - 7, 10, '#e6dcc4'); label(c, km + ' km', bx + px, by - 7, 10, '#e6dcc4'); }
  // Rahmen
  c.strokeStyle = '#5a4630'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3); c.strokeStyle = '#1a1410'; c.lineWidth = 1; c.strokeRect(5.5, 5.5, w - 11, h - 11);
  return { ox, oy, sc };
}
