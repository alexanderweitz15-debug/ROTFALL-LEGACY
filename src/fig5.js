// Stil R (Session 14, Nutzer: „Referenz 5 selbst im Code nachzeichnen, mit Animation — erst nur optional wählbar“).
// Stil D bleibt Standard; R wird unter Optionen → Grafikstil gewählt (sprites.js setArt('R')).
//
// Raster: Figuren werden direkt im Zielraster gemalt — ein Pixel = RPX Frame-Einheiten, der Renderer vergrößert um
// FIGK (1,2) → 1,5 Welt-Einheiten je Pixel wie Props und Boden. Kein Vergröbern, keine Nachbearbeitung.
// Regeln (B3): Silhouette zuerst; 4-Stufen-Rampe je Material, Licht oben links; Außenkontur im dunkelsten Ton des
// angrenzenden Materials; Gesicht im Schatten, Augen als 1–2 Akzentpixel; lange Mäntel mit Faltenclustern; Stoff, Leder,
// Metall getrennt schattiert; Details nur in Clustern (kein Einzelpixel-Rauschen).
// Arme gehören zum Bild: Waffenhand (und zweite Hand) folgen derselben Schwungkurve wie im Renderer (armPlan), der
// Renderer setzt nur noch die Waffe an die Hand. Jede Kombination wird einmal gemalt und in sprites.js gecacht.
import { mix } from './sprites.js?v=15';

// S14c: Rahmen 40 breit (Nutzer: Schulterplatten und Rüstung brauchen Platz); gemalt wird weiter in 32er-Koordinaten, Px verschiebt um DX
export const RW = 40, RH = 56, ROX = 20, ROY = 53, RPX = 1.25, DX = 4, DY = 6;   // S15: 6 Zeilen Kopffreiheit (Hörner, Geweih, Dornenkrone, Flammen)
const K = 1 / RPX;
export const RANGED = new Set(['bow', 'crossbow', 'wand', 'throw', 'sling']);
const THRUST = new Set(['spear', 'dagger', 'rapier']);
const HEAVY = new Set(['great', 'axe', 'mace', 'hammer', 'polearm']);
const hsh = (a, b) => { let n = (a * 374761393 + b * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const dimR = (R, k) => R && ({ hi: mix(R.hi, '#000', k), b: mix(R.b, '#000', k), sh: mix(R.sh, '#000', k), dk: mix(R.dk, '#000', k) });
const flatR = c => ({ hi: c, b: c, sh: c, dk: c });
const VOID = '#0b0909';

// ---- Raster mit Teilen (ID = Tiefe), Materialschattierung, Kontur ----
class Px {
  constructor(w, h, dx = 0, dy = 0) { this.dx = dx; this.dy = dy; this.w = w; this.h = h; this.id = new Int16Array(w * h).fill(-1); this.P = []; this.col = new Array(w * h).fill(null); }
  part(R, mat = 'cloth', o) { if (!R) return -1; this.P.push({ R, mat, ...o }); return this.P.length - 1; }
  put(p, x, y) { x = Math.floor(x + this.dx); y = Math.floor(y + this.dy); if (p >= 0 && x >= 0 && y >= 0 && x < this.w && y < this.h) this.id[y * this.w + x] = p; }
  rows(p, y0, spans, dx = 0) { spans.forEach((s, i) => { if (s) for (let x = s[0]; x <= s[1]; x++) this.put(p, x + dx, y0 + i); }); }
  rect(p, x0, y0, x1, y1) { for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) this.put(p, x, y); }
  poly(p, pts) {
    if (p < 0) return;
    let y0 = this.h, y1 = 0; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(this.h - 1, Math.ceil(y1)); y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc) !== (by <= yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) this.put(p, x, y);
    }
  }
  ell(p, cx, cy, rx, ry) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
    if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) this.put(p, x, y); }
  limb(p, pts, w0, w1 = w0) {                                  // Glied: Segmente mit Dicke, runde Gelenke
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], t0 = i / (pts.length - 1), t1 = (i + 1) / (pts.length - 1);
      const wa = (w0 + (w1 - w0) * t0) / 2, wb = (w0 + (w1 - w0) * t1) / 2, l = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / l, ny = (bx - ax) / l;
      this.poly(p, [[ax + nx * wa, ay + ny * wa], [bx + nx * wb, by + ny * wb], [bx - nx * wb, by - ny * wb], [ax - nx * wa, ay - ny * wa]]);
      if (i + 1 < pts.length - 1) this.ell(p, bx, by, wb, wb);
    }
  }
  at(x, y) { x += this.dx; y += this.dy; return x < 0 || y < 0 || x >= this.w || y >= this.h ? -1 : this.id[y * this.w + x]; }
  // Volumen je Teil und Zeile (Licht links oben), Kantenlicht oben, Schlagschatten unter vorderen Teilen, selektive Innenkontur:
  // rechts/unten dunkel, links weich — so trennen sich Arm, Rumpf, Gürtel, ohne dass alles schwarz umrandet ist.
  shade() {
    const { w, h, id, P } = this, span = new Map(), vs = P.map(() => [h, -1]), hs = P.map(() => [w, -1]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = id[y * w + x]; if (p < 0) continue;
      const k = p * h + y, s = span.get(k); if (!s) span.set(k, [x, x]); else s[1] = x; if (y < vs[p][0]) vs[p][0] = y; if (y > vs[p][1]) vs[p][1] = y; if (x < hs[p][0]) hs[p][0] = x; if (x > hs[p][1]) hs[p][1] = x; }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, p = id[i]; if (p < 0) continue;
      const Q = P[p], R = Q.R, [a, b] = span.get(p * h + y), wd = b - a, [ha, hb] = hs[p], tp = hb > ha ? (x - ha) / (hb - ha) : 0.5, t = wd ? 0.5 * (x - a) / wd + 0.5 * tp : tp, [v0, v1] = vs[p], tv = v1 > v0 ? (y - v0) / (v1 - v0) : 0.5;
      let c;
      if (Q.flat) c = R.b;
      else if (Q.mat === 'metal') c = t < 0.26 ? R.hi : t < 0.56 ? R.b : t < 0.86 ? R.sh : R.dk;
      else if (Q.mat === 'skin' || Q.mat === 'bone') c = t > 0.67 ? R.sh : t < 0.34 && tv < 0.55 ? R.hi : R.b;
      else { c = t > 0.7 ? R.sh : t < 0.22 && wd >= 3 && tv < 0.6 ? mix(R.b, R.hi, 0.55) : R.b; if (wd >= 7 && t > 0.9) c = R.dk; }
      if (!Q.flat && v1 - v0 >= 5 && y === v1 && Q.mat !== 'metal') c = R.sh;                  // Unterkante
      const up = y > 0 ? id[i - w] : -1, lf = x > 0 ? id[i - 1] : -1, rt = x < w - 1 ? id[i + 1] : -1, dn = y < h - 1 ? id[i + w] : -1;
      if (!Q.flat && (up < 0 || (up < p && P[up].mat !== Q.mat)) && t < 0.65) c = Q.mat === 'metal' ? mix(R.hi, '#f4ecd8', 0.3) : mix(R.b, R.hi, 0.75);
      else if (up > p && !P[up].noCast && !Q.flat) c = Q.mat === 'metal' ? R.sh : mix(c, R.dk, 0.6);
      if (!Q.noLine) {
        const hard = (rt >= 0 && rt < p && !same(Q, P[rt])) || (dn >= 0 && dn < p && !same(Q, P[dn]));
        if (hard) c = mix(R.dk, '#070506', 0.3);
        else if (lf >= 0 && lf < p && !same(Q, P[lf])) c = mix(c, R.dk, 0.45);
      }
      this.col[i] = c;
    }
    this.tidy();
  }
  // S15 Politur (Nutzer: „kein Pixelrauschen“): ein Pixel, dessen beide Nachbarn (waagrecht oder senkrecht) im selben Teil
  // gleich und anders gefärbt sind, übernimmt deren Farbe. Nur Schattierung, Details kommen danach und bleiben.
  tidy() {
    const { w, h, id, col } = this, out = col.slice();
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x, p = id[i]; if (p < 0 || !col[i]) continue;
      if (id[i - 1] === p && id[i + 1] === p && col[i - 1] === col[i + 1] && col[i - 1] !== col[i]) out[i] = col[i - 1];
      else if (id[i - w] === p && id[i + w] === p && col[i - w] === col[i + w] && col[i - w] !== col[i]) out[i] = col[i - w]; }
    this.col = out;
  }
  set(x, y, c) { x = Math.floor(x + this.dx); y = Math.floor(y + this.dy); if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) { this.col[y * this.w + x] = c; if (this.id[y * this.w + x] < 0) this.id[y * this.w + x] = 999; } }
  on(p, x, y, c) { x = Math.floor(x + this.dx); y = Math.floor(y + this.dy); if (c && p >= 0 && x >= 0 && y >= 0 && x < this.w && y < this.h && this.id[y * this.w + x] === p) this.col[y * this.w + x] = c; }
  clear(x, y) { x = Math.floor(x + this.dx); y = Math.floor(y + this.dy); if (x >= 0 && y >= 0 && x < this.w && y < this.h) { this.col[y * this.w + x] = null; this.id[y * this.w + x] = -1; } }
  // Außenkontur: dunkelster Ton des angrenzenden Materials (4er-Nachbarschaft), nicht Einheitsschwarz
  outline() {
    const { w, h, id, P, col } = this, out = col.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (col[i]) continue;
      let best = null, lum = 1e9;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) { if (j < 0 || !col[j]) continue;
        const q = id[j], c = q >= 0 && q < 999 ? P[q].R.dk : '#1a1614', l = lumOf(c); if (l < lum) { lum = l; best = c; } }
      if (best) out[i] = mix(best, '#050404', 0.45);
    }
    this.col = out;
  }
  toG() { const { w, h } = this, a = this.col.map(pop); return { w, h, a, at: (x, y) => x < 0 || y < 0 || x >= w || y >= h ? null : a[y * w + x] }; }
}
const same = (A, B) => A.grp && A.grp === B.grp;
// S15 Klassen-Silhouetten (Nutzer: „Klasse am Umriss erkennen, nicht nur an Farbe“). L.sil ist eine Liste von Merkmalen:
// collar (hoher Totenkragen), horns (Hörner über der Kapuze), antlers (Geweih), spikes (Dornenkrone), boiler (Kessel mit Schlot),
// flames (Seelenflammen über den Schultern), motes (schwebende Funken). Gemalt als Teile, damit Licht und Kontur gleich bleiben.
const hasSil = (L, k) => !!L.sil && L.sil.split(' ').includes(k);
function silHead(C, L, X, hx, y0, view) {
  if (!L.sil) return;
  const side = view === 'W', mir = pts => pts.map(([x, y]) => [31 - x, y]), top = y0 + 8;
  if (hasSil(L, 'collar')) { const c = C.part(L.cloak || L.hood || X.coat, 'cloth', { grp: 'collar' });
    const wing = [[12.5 + hx, top], [10 + hx, top - 1], [8.5 + hx, y0 + 1], [9.5 + hx, y0], [11.5 + hx, y0 + 3], [12.5 + hx, top - 2]];
    if (side) C.poly(c, [[16 + hx, top], [19 + hx, top - 1], [21 + hx, y0 + 1], [20 + hx, y0], [18.5 + hx, y0 + 3], [16.5 + hx, top - 2]]);
    else { C.poly(c, wing); C.poly(c, mir(wing).map(([x, y]) => [x + 2 * hx, y])); } }
  if (hasSil(L, 'horns')) { const h = C.part(dimR(L.bone, 0.62), 'bone');
    const horn = [[13.5 + hx, y0 + 1], [10 + hx, y0], [8 + hx, y0 - 3], [7.5 + hx, y0 - 7], [9 + hx, y0 - 5], [11 + hx, y0 - 3], [14 + hx, y0 - 1.5]];
    if (side) C.poly(h, [[16 + hx, y0 - 1], [19 + hx, y0 - 3], [22 + hx, y0 - 6], [21 + hx, y0 - 3], [17.5 + hx, y0 + 0.5]]);
    else { C.poly(h, horn); C.poly(h, mir(horn).map(([x, y]) => [x + 2 * hx, y])); } }
  if (hasSil(L, 'antlers')) { const a = C.part(L.bone, 'bone');
    const one = s0 => { const x = side ? 16 + hx : s0 < 0 ? 13 + hx : 18 + hx, d = side ? 1 : s0;
      C.limb(a, [[x, y0 - 1], [x + 2 * d, y0 - 4], [x + 3.5 * d, y0 - 8]], 1.3, 1); C.limb(a, [[x + 1.5 * d, y0 - 3], [x + 0.5 * d, y0 - 6]], 1.1, 1);
      C.limb(a, [[x + 3 * d, y0 - 6], [x + 5.5 * d, y0 - 7]], 1.1, 1); };
    if (side) one(1); else { one(-1); one(1); } }
  if (hasSil(L, 'spikes')) { const sp = C.part(dimR(L.bone, 0.2), 'bone');
    const xs = side ? [12, 14, 16, 18] : [12, 13.5, 15.5, 17.5, 19];
    xs.forEach((x, i) => { const tall = side ? 6 + (i % 2) * 4 : [6, 9, 12, 9, 6][i]; C.poly(sp, [[x - 0.8 + hx, y0 - 1], [x + 0.8 + hx, y0 - 1], [x + hx, y0 - 1 - tall]]); }); }
}
function boiler(C, L, top, view) {
  const k = C.part(dimR(L.metal, 0.15), 'metal'), band = C.part(L.gold, 'metal');
  if (view === 'W') { C.rect(k, 18, top - 3, 22, top + 7); C.rect(band, 18, top + 1, 22, top + 1); C.rect(k, 20, top - 9, 21, top - 3); }
  else { C.rect(k, 7, top - 5, 24, top + 4); C.rect(band, 7, top - 2, 24, top - 2); for (const x of [8, 22]) C.rect(k, x, top - 13, x + 1, top - 5); }   // Kessel breiter als die Schultern, zwei Schlote neben dem Kopf
}
// Leuchtendes ohne Kontur (nach der Außenkontur): Seelenflammen über den Schultern, schwebende Funken um die Figur
function silGlow(C, L, M, view) {
  if (!L.sil) return; const g = L.mc || L.ge || L.glow || '#6fd8ff', hi = mix(g, '#ffffff', 0.55), dk = mix(g, '#000000', 0.45), top = M.top, sd = (L.wseed | 0) + 3;
  if (hasSil(L, 'flames')) for (const cx of view === 'W' ? [19] : [7, 25]) for (let i = 0; i < 3; i++) {
    const x = cx + i - 1, h = 3 + ((hsh(x, sd) * 3) | 0) + (i === 1 ? 2 : 0); let y0 = top + 2; while (y0 > -C.dy && C.at(x, y0 - 1) >= 0) y0--;   // über dem höchsten Teil der Schulter
    for (let k = 0; k < h; k++) C.set(x, y0 - 1 - k, k === 0 ? dk : k < h - 1 ? (i === 1 ? hi : g) : dk); }
  if (hasSil(L, 'motes')) for (const [x, y] of [[5, top + 2], [27, top - 1], [4, top + 12], [28, top + 9], [7, top - 5]]) if (C.at(x, y) < 0) { C.set(x, y, hi); if (C.at(x, y + 1) < 0) C.set(x, y + 1, dk); }
}
// S15 Politur: je größeres Metallteil ein Glanzpunkt aus zwei Pixeln an der ersten Innenstelle oben links
function glint(C) {
  const { w, h, id, P } = C, done = new Set();
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x, p = id[i];
    if (p < 0 || p >= 999 || done.has(p) || P[p].mat !== 'metal' || P[p].flat) continue;
    if (id[i - w] === p && id[i - 1] === p && id[i + 1] === p && id[i + w] === p) { done.add(p); C.col[i] = mix(P[p].R.hi, '#fff6e0', 0.55); C.col[i + 1] = P[p].R.hi; } }
}
// S15 Politur (Nutzer: „zu dunkel und matschig, dunkle Ästhetik behalten“): Mitteltöne heller und satter, Tiefen bleiben
const POP = new Map();
function pop(c) {
  if (!c || c[0] !== '#' || c.length !== 7) return c; let o = POP.get(c); if (o) return o;
  const n = parseInt(c.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const l = (r * 0.3 + g * 0.59 + b * 0.11) / 255, lift = 1 + 0.5 * Math.max(0, Math.min(1, (l - 0.1) / 0.25)) * (1 - Math.max(0, (l - 0.55) / 0.45)) * 0.36, sat = 1.18;
  const m = (r + g + b) / 3; [r, g, b] = [r, g, b].map(v => Math.max(0, Math.min(255, Math.round((m + (v - m) * sat) * lift))));
  o = '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1); POP.set(c, o); return o;
}
const lumOf = c => { const n = parseInt(c.slice(1), 16); return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11; };

// ---- Rig: Gelenke je Ansicht und Pose (Pixel im Frame). S = vorn, N = hinten (gleiche Bildkoordinaten), W = Blick links ----
// Arme [Schulter, Ellbogen, Hand], Beine [Hüfte, Knie, Fuß (Knöchel)]. by: Rumpf auf/ab, hx/hy: Kopf, lean: Rumpf seitlich
// (W: + = nach hinten), sw: Rocksaum schwingt (Sekundärbewegung, eine Phase verzögert), cs: Umhang schwingt.
function rigS(pose) {
  const R = { by: 0, hx: 0, hy: 0, sw: 0, cs: 0, lean: 0,
    aL: [[11, 14.5], [10, 20.5], [9.8, 26.5]], aR: [[21, 14.5], [22, 20.5], [22.2, 26.5]],
    lL: [[13.5, 26], [13.5, 33.5], [13.5, 41]], lR: [[18.5, 26], [18.5, 33.5], [18.5, 41]] };
  const walk = { w0: 1, w1: 0, w2: -1, w3: 0 }[pose];
  if (pose === 'i1') R.by = 1;
  if (walk != null) {
    R.sw = { w0: 0, w1: 1, w2: 0, w3: -1 }[pose]; R.cs = { w0: -1, w1: 0, w2: 1, w3: 0 }[pose];
    if (walk === 1) { R.lL = [[13.5, 26], [13.5, 34], [13, 42]]; R.lR = [[18.5, 26], [18.5, 32.5], [19, 39]];
      R.aR = [[21.5, 14.5], [22.5, 21], [22.5, 27.5]]; R.aL = [[10.5, 14.5], [9.5, 20], [9.5, 25.5]]; }
    else if (walk === -1) { R.lR = [[18.5, 26], [18.5, 34], [19, 42]]; R.lL = [[13.5, 26], [13.5, 32.5], [13, 39]];
      R.aL = [[10.5, 14.5], [9.5, 21], [9.5, 27.5]]; R.aR = [[21.5, 14.5], [22.5, 20], [22.5, 25.5]]; }
    else { R.by = -1; if (pose === 'w1') R.lR = [[18.5, 26], [18.5, 33], [18.5, 40]]; else R.lL = [[13.5, 26], [13.5, 33], [13.5, 40]]; }
  }
  switch (pose) {
    case 'hit': R.by = -1; R.hy = -1; R.hx = 1; R.aL = [[10.5, 14.5], [7.5, 17], [6.5, 21]]; R.aR = [[21.5, 14.5], [24.5, 17], [25.5, 21]];
      R.lL = [[13.5, 26], [13, 33.5], [12.5, 41]]; break;
    case 'kb': R.by = 1; R.hy = -1; R.aL = [[10.5, 14.5], [9, 19.5], [11, 23]]; R.aR = [[21.5, 14.5], [23, 19.5], [21, 23]];
      R.lL = [[13.5, 26], [12.5, 34], [11.5, 41]]; R.lR = [[18.5, 26], [19.5, 34], [20.5, 41]]; break;
    case 'guard': R.by = 1; R.aL = [[10.5, 14.5], [10, 20], [13, 22]]; R.aR = [[21.5, 14.5], [22, 20], [19, 22]];
      R.lL = [[13.5, 26], [12.5, 34], [11.5, 41]]; R.lR = [[18.5, 26], [19.5, 34], [20.5, 41]]; break;
    case 'cast': R.aL = [[10.5, 14.5], [8.5, 18.5], [10.5, 16]]; R.aR = [[21.5, 14.5], [23.5, 18.5], [21.5, 16]]; break;
    case 'trade': R.aR = [[21.5, 14.5], [22.5, 19.5], [20, 22]]; break;
    case 'carry': R.aL = [[10.5, 14.5], [10, 20], [14, 23]]; R.aR = [[21.5, 14.5], [22, 20], [18, 23]]; break;
    case 'kneel': case 'search': case 'die1':
      R.by = 5; R.lL = [[13.5, 31], [12.5, 39], [14, 44]]; R.lR = [[18.5, 31], [19.5, 36], [19.5, 42]]; R.kneel = 1;
      R.aL = [[10.5, 19.5], [10, 25], [12, 31]]; R.aR = [[21.5, 19.5], [22.5, 25], [20.5, 32]];
      if (pose === 'search') R.aR = [[21.5, 19.5], [21, 26], [17.5, 37]];
      if (pose === 'die1') { R.hy = -1; R.hx = -1; R.aL = [[10.5, 19.5], [7.5, 23], [6, 27]]; R.aR = [[21.5, 19.5], [24.5, 23], [26, 27]]; }
      break;
    case 'sit': R.by = 7; R.lL = [[13.5, 33], [13, 37.5], [13, 43]]; R.lR = [[18.5, 33], [19, 37.5], [19, 43]]; R.sit = 1;
      R.aL = [[10.5, 21.5], [9.5, 27], [12, 32]]; R.aR = [[21.5, 21.5], [22.5, 27], [20, 32]]; break;
  }
  return R;
}
function rigW(pose) {
  const R = { by: 0, hx: 0, hy: 0, sw: 1, cs: 2, lean: 0,
    aN: [[15.5, 14.5], [15, 20.5], [15, 26.5]], aF: [[17, 14.5], [17, 20.5], [17, 26.5]],
    lN: [[15.5, 26], [15.5, 33.5], [15.5, 41]], lF: [[16.5, 26], [16.5, 33.5], [16.5, 41]] };
  if (pose === 'i1') R.by = 1;
  if (pose === 'i0' || pose === 'i1') { R.sw = 0; R.cs = 0; }
  switch (pose) {
    case 'w0': R.cs = 2; R.sw = 1; R.lN = [[15.5, 26], [13.5, 33], [11.5, 41]]; R.lF = [[16.5, 26], [18.5, 33.5], [20.5, 41]];
      R.aN = [[15.5, 14.5], [17, 20.5], [19, 25.5]]; R.aF = [[17, 14.5], [15.5, 20.5], [13, 25.5]]; break;
    case 'w1': R.by = -1; R.cs = 3; R.sw = 2; R.lF = [[16.5, 26], [14.5, 32], [16, 39]]; break;
    case 'w2': R.cs = 2; R.sw = 1; R.lF = [[16.5, 26], [14.5, 33], [12.5, 41]]; R.lN = [[15.5, 26], [17.5, 33.5], [19.5, 41]];
      R.aN = [[15.5, 14.5], [14, 20.5], [12, 25.5]]; R.aF = [[17, 14.5], [18.5, 20.5], [20, 25.5]]; break;
    case 'w3': R.by = -1; R.cs = 3; R.sw = 2; R.lN = [[15.5, 26], [13.5, 32], [15, 39]]; break;
    case 'hit': R.lean = 1; R.hx = 1; R.hy = -1; R.by = -1; R.aN = [[15.5, 14.5], [18, 17], [20, 13]]; R.lN = [[15.5, 26], [13.5, 33.5], [12.5, 41]]; R.cs = -1; break;
    case 'kb': R.lean = 2; R.hx = 1; R.by = 1; R.aN = [[15.5, 14.5], [13.5, 19], [11, 21]]; R.aF = [[17, 14.5], [15, 19.5], [12.5, 22]];
      R.lN = [[15.5, 26], [13.5, 33.5], [11.5, 41]]; R.lF = [[16.5, 26], [15, 33.5], [13.5, 41]]; R.cs = 3; R.sw = 2; break;
    case 'guard': R.by = 1; R.aN = [[15.5, 14.5], [13.5, 19.5], [11.5, 21]]; R.aF = [[17, 14.5], [15, 20], [12.5, 21.5]];
      R.lN = [[15.5, 26], [13.5, 33.5], [12, 41]]; R.lF = [[16.5, 26], [18.5, 33.5], [20, 41]]; break;
    case 'cast': R.aN = [[15.5, 14.5], [13, 17.5], [10, 16.5]]; R.aF = [[17, 14.5], [14.5, 18], [11.5, 18]]; break;
    case 'trade': R.aN = [[15.5, 14.5], [14, 20], [10.5, 22.5]]; break;
    case 'carry': R.aN = [[15.5, 14.5], [14.5, 20.5], [11.5, 23]]; R.aF = [[17, 14.5], [15.5, 20.5], [12.5, 23]]; break;
    case 'kneel': case 'search': case 'die1':
      R.by = 5; R.kneel = 1; R.lN = [[15.5, 31], [11.5, 35.5], [12.5, 42]]; R.lF = [[16.5, 31], [16, 40], [20.5, 43]];
      R.aN = [[15.5, 19.5], [14, 25], [12, 31]]; R.aF = [[17, 19.5], [16, 25], [13.5, 31]];
      if (pose === 'search') R.aN = [[15.5, 19.5], [13, 26], [9.5, 37]];
      if (pose === 'die1') { R.lean = 2; R.hx = 2; R.aN = [[15.5, 19.5], [18, 23], [21, 21]]; }
      break;
    case 'sit': R.by = 7; R.sit = 1; R.lN = [[15.5, 33], [10.5, 34], [10.5, 43]]; R.lF = [[16.5, 33], [11.5, 34.5], [11.5, 43]];
      R.aN = [[15.5, 21.5], [14.5, 27], [11.5, 31]]; R.aF = [[17, 21.5], [16, 27], [13, 31]]; break;
  }
  return R;
}

const eo = t => 1 - (1 - t) ** 3, ei = t => t * t;
// S12 (Nutzer: „neue Animations-Sets je Waffe, immer etwas Variation“): v 0 Vorhand, 1 Rückhand, 2 Überkopfhieb (schwere Waffen,
// Schwerter) bzw. Stoß tief/hoch (Stoßwaffen); j = kleine Abweichung je Hieb. Treffer bleiben unabhängig davon (resolveSwing).
export function swingOf(wt, sw, arc, v = 0, j = 0) {
  if (sw <= 0) return { a: 0.6, ext: 0 };
  const wob = j * Math.sin(Math.min(1, sw) * Math.PI);
  if (wt === 'spear' || wt === 'dagger' || wt === 'rapier') {       // Stoß: zurückziehen, vorschnellen, einholen
    const back = wt === 'spear' ? -9 : wt === 'rapier' ? -6 : -4, fwd = (wt === 'spear' ? 22 : wt === 'rapier' ? 17 : 11) * (v === 2 ? 1.15 : 1), off = [0, 0.24, -0.24][v] + wob;
    if (sw < 0.3) return { a: 0.15 * (1 - sw / 0.3) + off, ext: back * eo(sw / 0.3) };
    if (sw < 0.45) return { a: off, ext: back + (fwd - back) * ei((sw - 0.3) / 0.15) };
    return { a: off, ext: fwd * (1 - eo((sw - 0.45) / 0.55)) };
  }
  const heavy = wt === 'great' || wt === 'axe' || wt === 'mace' || wt === 'hammer' || wt === 'polearm';
  const w0 = wt === 'hammer' ? 0.44 : heavy ? 0.36 : 0.28, half = arc / 2;           // Hammer: langes Ausholen
  if (v === 2 && (heavy || wt === 'sword')) {                        // Überkopfhieb: hoch über den Kopf, steil nach vorn herunter
    const up = -Math.PI * (heavy ? 0.85 : 0.7), down = 0.25 + wob;
    if (sw < w0) return { a: 0.6 + (up - 0.6) * eo(sw / w0), ext: -4 * sw / w0 };
    if (sw < 0.5) return { a: up + (down - up) * ei((sw - w0) / (0.5 - w0)), ext: 4 };
    return { a: down + (0.6 - down) * eo((sw - 0.5) / 0.5), ext: 4 * (1 - (sw - 0.5) * 2) };
  }
  const start = -half - (heavy ? 0.75 : 0.4), end = half + (heavy ? 0.5 : 0.28), k = v === 1 ? -1 : 1;   // Rückhand: gespiegelter Bogen
  if (sw < w0) return { a: k * (0.6 + (start - 0.6) * eo(sw / w0)) + wob, ext: heavy ? -3 * sw / w0 : 0 };       // ausholen
  if (sw < 0.5) return { a: k * (start + (end - start) * ei((sw - w0) / (0.5 - w0))) + wob, ext: 2 };            // Schlag
  return { a: k * (end + (0.6 - end) * eo((sw - 0.5) / 0.5)) + wob, ext: 2 * (1 - (sw - 0.5) * 2) };             // Nachschwung
}
// ---- Waffenhand: dieselbe Kurve wie render.js (swingOf), an den Schultern dieses Rigs ----
// W = { mode: 'swing' | 'work' | 'cover' | 'rest' | 'aim' | 'aimRest', wt, arc, q (Schwung 0..1), v (Hiebvariante), oct (0..7) }
export const octOf = a => ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
export const upright = wt => wt === 'spear' || wt === 'polearm';
export const onShoulder = wt => wt === 'great' || wt === 'hammer';
export function phaseOf(W) {
  if (!(W.mode === 'swing' || W.mode === 'work')) return null;
  const w0 = W.wt === 'hammer' ? 0.44 : HEAVY.has(W.wt) ? 0.36 : 0.28;
  return W.q < w0 ? 'wind' : W.q < 0.5 ? 'strike' : W.q < 0.82 ? 'follow' : null;
}
function svOf(W) { return RANGED.has(W.wt) ? { a: 0, ext: 0 } : W.mode === 'cover' ? { a: -1.15, ext: -2 } : swingOf(W.wt, W.q, W.arc, W.v, 0); }
// Winkel der Waffe (Welt, Kanvas-Winkel) — gleich der Regel in render.js weaponPose
export function weaponAngle(W, dir) {
  const sgn = Math.cos(dir) < -1e-9 ? -1 : 1, wt = W.wt, bowA = (sgn > 0 ? 0 : Math.PI) + Math.sin(dir) * 0.3 * sgn;
  if (wt === 'bow') return bowA;
  if (RANGED.has(wt)) return W.mode === 'aim' ? (wt === 'crossbow' ? dir : dir) : wt === 'crossbow' ? Math.PI / 2 - sgn * 0.2 : bowA;
  if (W.mode === 'rest') return upright(wt) ? -Math.PI / 2 + sgn * 0.1 : onShoulder(wt) ? (Math.abs(Math.cos(dir)) < 0.4 ? -Math.PI / 2 + 0.55 : -Math.PI / 2 - sgn * 0.75) : sgn > 0 ? 1.2 : Math.PI - 1.2;
  return dir + svOf(W).a * sgn;
}
function armPlan(view, R, W) {
  const a = W.oct * Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a), sgn = ca < -1e-9 ? -1 : 1, left = view !== 'W' && sgn < 0;
  const S = view === 'W' ? R.aN[0] : left ? R.aL[0] : R.aR[0], low = W.low || 0, wt = W.wt;
  let h;
  if (W.mode === 'aim') h = [16 + ca * (wt === 'bow' ? 21 : 8) * K, ROY - DY + ((wt === 'bow' ? -34 : -26) + sa * 5) * K + R.by];   // S15 P3: Bogenarm gestreckt, auf Brusthöhe
  else if (W.mode === 'aimRest') h = [S[0] + ca * 4 * K, S[1] + (14 + low) * K];
  else if (W.mode === 'rest') h = upright(wt) ? [S[0] + ca * 6 * K, S[1] + (11 + low) * K] : onShoulder(wt) ? [S[0] + ca * 3 * K, S[1] + (9 + low) * K]
    : [S[0] + ca * 5 * K, S[1] + (16 + low + Math.max(0, sa) * 2) * K];
  else { const sv = svOf(W);
    if (THRUST.has(wt)) { const r = 11 + sv.ext * 0.8; h = [S[0] + ca * r * K, S[1] + (6 + low + sa * r * 0.8) * K]; }
    else { const ha = a + sv.a * sgn * 0.55, r = 13 + sv.ext * 0.5; h = [S[0] + Math.cos(ha) * r * K, S[1] + (5 + low - (W.mode === 'cover' ? 4 : 0) + Math.sin(ha) * r * 0.75) * K]; } }
  const aw = weaponAngle(W, a);
  let off = null;
  if (W.two && !RANGED.has(wt)) off = [h[0] + Math.cos(aw) * 9 * K, h[1] + Math.sin(aw) * 9 * K];
  else if (wt === 'bow' && W.mode === 'aim') { const pl = W.pull || 0; off = [h[0] - ca * (2.5 + 9 * pl), h[1] - sa * 3 - 1 - pl * 1.5]; }   // S15 (Nutzer: „man soll sehen, wie der Bogen gespannt wird“): Zughand wandert mit dem Spannen bis ans Kinn
  else if (wt === 'crossbow' && W.mode === 'aim') off = [h[0] - ca * 3.5, h[1] - sa * 2 + 1];
  return { h, off, left, aw };
}
function ik(s, h, L1, L2, pick) {                                   // Ellbogen: zwei Lösungen, pick wählt die natürliche
  const dx = h[0] - s[0], dy = h[1] - s[1], d = Math.max(0.01, Math.min(Math.hypot(dx, dy), L1 + L2 - 0.05)), a0 = Math.atan2(dy, dx);
  const A = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const e1 = [s[0] + Math.cos(a0 + A) * L1, s[1] + Math.sin(a0 + A) * L1], e2 = [s[0] + Math.cos(a0 - A) * L1, s[1] + Math.sin(a0 - A) * L1];
  return pick(e1) >= pick(e2) ? e1 : e2;
}

// ---- Maler ----
// L: aufgelöste Spec (sprites.js resolve), dir S/N/W, pose, W: Waffenzustand (oder null). Rückgabe: Pixel + Hand-Metadaten.
export function paintR(L, dir, pose, W = null) {
  const view = dir === 'W' || dir === 'E' ? 'W' : dir === 'N' ? 'N' : 'S';
  const [base, extra] = pose.split('+'), R = view === 'W' ? rigW(base) : rigS(base), ph = W ? phaseOf(W) : null;
  if (extra) { const A = view === 'W' ? rigW(extra) : rigS(extra), dy = R.by - A.by;   // Mischpose: Beine der Grundpose, Arme der Zusatzpose
    for (const k of ['aL', 'aR', 'aN', 'aF']) if (A[k]) R[k] = A[k].map(([x, y]) => [x, y + dy]); }
  pose = base;
  if (ph === 'wind') { R.by -= 1; if (view === 'W') { R.lean += 1; R.cs = 1; } }
  if (ph === 'strike' || ph === 'follow') { R.by += 1; if (view === 'W') { R.lean -= 1; R.cs = 3; R.sw = 2; R.lN = [[15.5, 26], [13.5, 33.5], [12, 41]]; R.lF = [[16.5, 26], [18, 33.5], [19.5, 41]]; }
    else { R.lL = [[13.5, 26], [13, 34], [12.5, 41]]; R.lR = [[18.5, 26], [19, 34], [19.5, 41]]; } }
  { const X0 = looks(L); AB = X0.ab; const mv = (a, dx) => a && a.map(([x, y]) => [x + dx, y + X0.by]);
    R.by += X0.by; R.hy += 0; if (view === 'W') { R.aN = mv(R.aN, 0); R.aF = mv(R.aF, 0); } else { R.aL = mv(R.aL, -X0.sh); R.aR = mv(R.aR, X0.sh); } }
  if (view !== 'W' && (AB >= 2 || L.stance) && (pose === 'i0' || pose === 'i1' || pose === 'guard')) { const sp = AB >= 3 ? 1.5 : 1;   // S15: Gewicht im Stand
    R.lL = R.lL.map(([x, y], i) => [x - sp * i / 2, y]); R.lR = R.lR.map(([x, y], i) => [x + sp * i / 2, y]); }
  const plan = W ? armPlan(view, R, W) : null;
  const C = new Px(RW, RH, DX, DY); STUMPS = [];
  if (view === 'W') { if (limbSt(L, 'rleg') === 2) R.lN = stumpOf(R.lN); if (limbSt(L, 'lleg') === 2) R.lF = stumpOf(R.lF); }
  else { const b = view === 'N'; if (limbSt(L, b ? 'lleg' : 'rleg') === 2) R.lL = stumpOf(R.lL); if (limbSt(L, b ? 'rleg' : 'lleg') === 2) R.lR = stumpOf(R.lR); }
  const meta = view === 'W' ? paintW(C, L, R, plan, W, pose) : paintSN(C, L, R, view === 'N', plan, W, pose);
  C.shade(); glint(C); details(C, L, R, view, meta, pose); wear(C, L, meta); C.outline(); silGlow(C, L, meta, view);
  const sx = q => q && [q[0] + DX, q[1] + DY], limbs = {}; for (const k in meta.limbs) limbs[k] = sx(meta.limbs[k]);   // Bildkoordinaten (Rahmen 40)
  return { g: C.toG(), hand: plan ? sx(plan.h) : null, off: plan ? sx(plan.off) : null, eyeY: meta.eyeY + DY, behind: meta.behind, limbs };
}

// S14 (Nutzer: „verschiedene Breiten, dick, breites Schlüsselbein“): Körperbau aus body.js BUILDS als Maß, nicht als Streckung —
// sh Schultern, wa Taille, by Höhe (− = größer), aw Armdicke; Bauch (be) je Person aus der Variante, nicht bei Drahtigen und Platte.
const BUILD_R = { drahtig: { sh: -1, wa: -1, by: 0, aw: 2.6 }, bullig: { sh: 1, wa: 1, by: 0, aw: 3.6 }, hochgewachsen: { sh: 0, wa: 0, by: -2, aw: 3 }, gedrungen: { sh: 0, wa: 1, by: 2, aw: 3.2 } };
function buildR(L, bone, gob) {
  const B = BUILD_R[L.bd] || { sh: 0, wa: 0, by: 0, aw: 3 }, v = L.vs | 0;
  const be = bone || gob || L.bd === 'drahtig' || L.armor === 'plate' ? 0 : (L.bd === 'bullig' || L.bd === 'gedrungen') && v % 2 === 0 ? 2 : v % 5 === 1 ? 1 : 0;
  const sh = B.sh + (!L.bd || L.bd === 'ausgewogen' ? (v === 6 ? 1 : 0) : 0);          // manche Ausgewogene: breites Schlüsselbein
  const hv = L.hv && !bone ? 1 : 0;                                    // schwere Waffe: breite Schultern, dicke Arme, Nacken
  // S14b (Nutzer: „nicht imposant genug, breiter, Schlüsselbein, Push-up“): V-Form — Schultern weit über die Hüfte, Eisen trägt auf
  // S14c (Nutzer: „nicht den Körper breit machen — die Rüstung selbst trägt auf“): Zivil schlank wie gehabt; ab = Rüstungswucht
  // (Kette/Platte 1, große Schulterplatten +1, riesige +2, Endgame-Zier +1) verbreitert Brustplatte, Schultern, Arme, Handschuhe, Beine, Stiefel
  const base = gob || (bone && !L.armor) ? 0 : 1, metal = L.armor === 'plate' || L.armor === 'chain';
  const ab = gob ? 0 : Math.min(4, (metal ? 1 : 0) + (L.pb | 0) + (metal && (L.spk || L.gg || L.rn || L.core) ? 1 : 0));
  return { ab, sh: Math.min(3, Math.max(sh, 0) + hv + base) + ab + (ab >= 3 ? 1 : 0), wa: B.wa + (hv && B.wa < 0 ? 1 : 0), by: B.by, aw: bone && !L.armor ? 2.4 : Math.max(B.aw, hv ? 3.2 : 0) + 0.5 + (sh > B.sh ? 0.4 : 0) + hv * 0.8 + ab * 0.6, be: ab ? 0 : be, hv };
}
const wideS = (spans, X, i0 = 0) => spans.map(([a, b], i) => { const k = i + i0, d = k === 0 ? X.sh - 1 : k < 5 ? X.sh : k < 7 ? Math.round((X.sh + X.wa) / 2) : X.wa,   // Nacken, Brust, Verjüngung, Taille
    bl = k >= 5 && k <= 10 ? X.be - (k === 5 || k === 10 ? 1 : 0) : 0; return [a - d - Math.max(0, bl), b + d + Math.max(0, bl)]; });
// Maße, die beide Ansichten teilen
function looks(L) {
  const bone = L.sp === 'skeleton', gob = L.sp === 'goblin';
  const coat = L.robe || L.cloth, metalArm = L.armor === 'plate' || L.armor === 'chain';
  const hemRow = L.robe ? 44 : ({ 35: 28, 39: 32, 44: 37 }[L.hem] ?? (L.cloak || L.hooded ? 33 : 29));
  const helmet = L.helm === 'great' || L.helm === 'bascinet' || XHELM.has(L.helm);
  const hood = !!L.hooded && !helmet && L.helm !== 'wide' && L.helm !== 'hat';
  return { bone, gob, coat, sleeve: metalArm ? L.armorR : coat, sleeveMat: metalArm ? 'metal' : 'cloth', hand: L.glove || L.skin,
    pants: bone ? L.skin : L.pants, boots: bone ? null : L.boots, hemRow, helmet, hood, legW: (buildR(L, bone, gob).ab >= 3 ? 0.8 : 0) + (bone ? 2.5 : L.bd === 'bullig' || L.hv ? 5 : L.bd === 'drahtig' ? 4 : 4.6) + (L.armor === 'plate' || L.armor === 'chain' ? 0.5 + (L.pb | 0) * 0.4 : 0), ...buildR(L, bone, gob) };
}

let STUMPS = [], AB = 0;   // AB: Rüstungswucht der gerade gemalten Figur (Handschuhe, Stiefel)                                                    // Enden abgetrennter Glieder (Blut, nach der Schattierung)
const XHELM = new Set(['horned', 'crown', 'plume', 'visor', 'mech', 'skull']);
const LIMB_I = { larm: 0, rarm: 1, lleg: 2, rleg: 3 }, limbSt = (L, p) => L.ms ? +L.ms[LIMB_I[p]] || 0 : 0;
const stumpOf = a => [a[0], [a[0][0] + (a[1][0] - a[0][0]) * 0.75, a[0][1] + (a[1][1] - a[0][1]) * 0.75]];
const limpOf = (a, sx) => [a[0], [a[0][0] + sx * 0.5, a[0][1] + 6], [a[0][0] + sx, a[0][1] + 12]];   // schlaff herabhängend
const fixArm = (L, part, a, sx) => { const st = limbSt(L, part); if (st === 1) { const l = limpOf(a, sx); STUMPS.push(l[1]); return l; } return st === 2 ? stumpOf(a) : a; };   // schlaff: Blut am Ellbogen
function arm(C, pid, hid, pts, w, hand, bone) {
  if (pid < 0) return;
  C.limb(pid, pts, w, w - (bone ? 0 : 0.5));
  if (pts.length === 2) { STUMPS.push(pts[1]); return; }
  const [hx, hy] = pts[2], g = bone ? 0 : AB >= 3 ? 1.5 : AB >= 2 ? 1 : 0;   // schwere Rüstung: große Panzerhandschuhe (S15 P1: noch größer ab Wucht 3)
  if (hid >= 0) { if (bone && !g) C.rect(hid, hx - 1, hy - 1, hx, hy); else C.rect(hid, hx - 1.5 - g, hy - 1.5 - g * 0.5, hx + 0.5 + g, hy + 0.5 + g * 0.5); }
}
function bootS(C, pid, [fx, fy], out, bare) {
  if (bare) { C.rect(pid, fx - 1, fy + 1, fx, fy + 4); C.rect(pid, fx - 1 + (out < 0 ? -1 : 0), fy + 4, fx + (out > 0 ? 1 : 0), fy + 4); return; }
  const b = AB >= 2 ? 1 : AB ? 0.5 : 0;   // Rüstung: breitere, höhere Stiefel
  C.poly(pid, [[fx - 2 - b, fy - 1 - b * 2], [fx + 2 + b, fy - 1 - b * 2], [fx + 2 + b + (out > 0 ? 1 : 0), fy + 5], [fx - 2 - b - (out < 0 ? 1 : 0), fy + 5]]);
}

// ---- Vorder- und Rückansicht ----
function paintSN(C, L, R, back, plan, W, pose) {
  const X = looks(L), by = R.by, hy = R.hy + by, hx = R.hx, top = 13 + by, waist = 24 + by, meta = { behind: false, limbs: {} };
  const hem = Math.min(46, X.hemRow + by + (R.sit ? -2 : 0)), longCoat = X.hemRow >= 32;
  // Waffen- und Nebenarm
  let aL = R.aL, aR = R.aR;
  const side = e => e[0] < 16 ? -1 : 1;
  if (plan) {
    const S0 = plan.left ? R.aL[0] : R.aR[0], el = ik(S0, plan.h, 6, 6.5, e => Math.abs(e[0] - 16) + e[1] * 0.4), wArm = [S0, el, plan.h];
    if (plan.left) aL = wArm; else aR = wArm;
    if (plan.off) { const S1 = plan.left ? R.aR[0] : R.aL[0], e1 = ik(S1, plan.off, 6, 6.5, e => Math.abs(e[0] - 16) + e[1] * 0.4), oArm = [S1, e1, plan.off];
      if (plan.left) aR = oArm; else aL = oArm; }
  }
  const shieldArm = L.shield && !(W && W.two) ? (plan ? (plan.left ? 'R' : 'L') : 'L') : null;   // Schild am Nebenarm
  if (L.shield && pose === 'guard' && shieldArm) { const g = [[shieldArm === 'L' ? 10.5 : 21.5, 14.5 + by], [shieldArm === 'L' ? 11 : 21, 20 + by], [16, 22 + by]];
    if (shieldArm === 'L') aL = g; else aR = g; }
  // Hand im Rücken (N) oder hinter dem Körper: vor der Brust nach innen → hinter den Rumpf
  aL = fixArm(L, back ? 'larm' : 'rarm', aL, -0.5); aR = fixArm(L, back ? 'rarm' : 'larm', aR, 0.5);
  const armBehind = a => back && a.length === 3 && Math.abs(a[2][0] - 16) < 5 && a[2][1] < waist + 2;
  meta.behind = back;
  // 1 Umhang hinten (vorn sichtbar an den Seiten)
  const cloakHem = L.capeL ? 46 : Math.min(46, Math.max(X.hemRow + 4, 38) + by);
  const cloakPts = (x0, x1) => [[x0 + 1, top], [x1 - 1, top], [x1 + 1, top + 7], [x1 + 1 + R.cs * 0.5, cloakHem], ...rag(x1 + 1 + R.cs, x0 - R.cs * 0.5, cloakHem, 7, 2), [x0 - R.cs * 0.5, cloakHem], [x0, top + 7]];
  if (L.cloak && !back) C.poly(C.part(L.cloak, 'cloth', { grp: 'cloak' }), L.capeL ? cloakPts(7 - X.sh, 25 + X.sh) : cloakPts(9 - X.sh, 23 + X.sh));
  if (L.quiver && !back) { const q = C.part(L.leather, 'leather'); C.poly(q, [[20, 6 + by], [22, 5 + by], [23.5, 13 + by], [21.5, 14 + by]]); meta.quiverTop = [21, 5 + by]; }
  if (L.pack && !back) C.rect(C.part(L.wood ? dimR(L.leather, 0.1) : L.leather, 'cloth'), 11, 10 + by, 20, 12 + by);
  const ids = {};
  for (const [k, a] of [['L', aL], ['R', aR]]) if (armBehind(a)) { ids['arm' + k] = C.part(dimR(X.sleeve, 0.2), X.sleeveMat, { grp: 'arm' + k }); ids['hand' + k] = C.part(dimR(X.hand, 0.2), 'skin'); arm(C, ids['arm' + k], ids['hand' + k], a, X.bone ? 2 : 3, X.hand, X.bone); }
  // 2 Beine und Stiefel
  const walkBack = R.lL[2]?.[1] < 40.5 ? 'L' : R.lR[2]?.[1] < 40.5 ? 'R' : '';
  for (const [k, l] of [['L', R.lL], ['R', R.lR]]) {
    const dim = k === walkBack ? 0.12 : 0, pl = C.part(dimR(X.pants, dim), X.bone ? 'bone' : 'cloth', { grp: 'leg' + k });
    C.limb(pl, l, X.legW, X.legW - (X.bone ? 0 : 0.5)); meta.limbs[k === 'L' ? (back ? 'rleg' : 'lleg') : (back ? 'lleg' : 'rleg')] = [l[1][0], l[1][1]];
    if (l.length === 2) { STUMPS.push(l[1]); ids['leg' + k] = pl; continue; }
    const pb = C.part(X.boots ? dimR(X.boots, dim) : dimR(L.skin, dim + 0.1), X.boots ? 'leather' : 'skin');
    bootS(C, pb, l[2], side(l[2]), !X.boots); ids['boot' + k] = pb; ids['leg' + k] = pl;
  }
  // 3 Rock (Unterteil) mit Schwung
  const skirt = C.part(X.coat, 'cloth', { grp: 'coat', folds: longCoat });
  const flare = X.hemRow >= 44 ? 2 : longCoat ? 1 : 0, sw = R.sw;
  if (X.bone && !L.robe) C.poly(skirt, [[12, waist + 1], [20, waist + 1], [20.5, waist + 5], ...rag(20.5, 11.5, waist + 5, 5, 1.5), [11.5, waist + 5]]);   // Lumpen über Knochen
  else { const e = X.wa + X.be * 0.5; C.poly(skirt, [[11 - e, waist + 1], [21 + e, waist + 1], [21 + e + flare + sw, hem], ...rag(21 + e + flare + sw, 11 - e - flare + sw, hem, 3, longCoat ? 1.5 : 1), [11 - e - flare + sw, hem]]); }
  ids.skirt = skirt; meta.hem = hem;
  if (hasSil(L, 'boiler') && !back) boiler(C, L, top, 'S');
  // 4 Rumpf
  const torso = C.part(X.coat, 'cloth', { grp: 'coat' });
  if (X.bone && !L.robe && !L.armor) { C.rows(torso, top, [[12, 19], [11, 20], [12, 19], [12, 19], [12, 19], [12, 19], [13, 18], [13, 18], [14, 17], [14, 17], [14, 17], [14, 17]]); ids.ribs = true; }
  else C.rows(torso, top, wideS([[11, 20], [10, 21], [10, 21], [10, 21], [10, 21], [10, 21], [10, 21], [10, 21], [11, 20], [11, 20], [11, 20], [11, 20]], X), 0);
  ids.torso = torso;
  // 5 Rüstung
  if (L.armor === 'leather') { const j = C.part(L.armorR, 'leather'); C.rows(j, top + 1, wideS([[11, 20], ...Array(9).fill([11, 20]), [11, 20], [11, 20], [12, 19], [12, 19]], X, 1)); ids.jerkin = j; }
  if (L.armor === 'plate') { const pl = C.part(L.armorR, 'metal'); C.rows(pl, top + 1, wideS([[11, 20], [11, 20], [11, 20], [11, 20], [11, 20], [11, 20], [12, 19], [12, 19], [12, 19], [12, 19]], X, 1));
    const fd = C.part(dimR(L.armorR, 0.12), 'metal'); C.rect(fd, 11 - X.wa, waist + 2, 20 + X.wa, waist + 4); ids.plate = pl; ids.fauld = fd; }
  if (L.armor === 'chain') { const cs = C.part(L.armorR, 'metal', { grp: 'coat' }); C.rect(cs, 11, waist + 1, 20, Math.min(hem, waist + 5)); ids.chainSkirt = cs; }
  if (L.apron && !back) { const ap = C.part(L.apronR || L.leather, 'leather'); C.poly(ap, [[12, top + 4], [19.99, top + 4], [20.5, Math.min(hem, 38)], [11.5, Math.min(hem, 38)]]); ids.apron = ap; }
  if (L.tabard) { const tb = C.part(L.tabard, 'cloth', { folds: true }); C.poly(tb, [[13, top + 2], [19, top + 2], [19.3, hem - 1], ...rag(19.3, 12.7, hem - 1, 11, 1), [12.7, hem - 1]]); ids.tabard = tb; }
  if (L.stoleR && !back) { const st = C.part(L.stoleR, 'cloth'); C.rect(st, 13, top, 13, Math.min(hem + 1, 40)); C.rect(st, 18, top, 18, Math.min(hem + 1, 40)); }
  // 6 Gürtel, Riemen, Schärpe, Tasche
  const belt = C.part(L.belt, 'leather'), bw = X.wa + Math.max(0, X.be - 1); C.rect(belt, 11 - bw, waist, 20 + bw, waist + 1); ids.belt = belt;
  if (L.strap && !ids.plate && !ids.tabard) { const s = C.part(dimR(L.leather, 0.15), 'leather'); for (let i = 0; i <= 10; i++) C.put(s, back ? 20 - i * 0.9 : 11 + i * 0.9, top + 1 + i); ids.strap = s; }
  if (L.sashR && !back) { const s = C.part(L.sashR, 'cloth'); for (let i = 0; i <= 10; i++) { C.put(s, 20 - i * 0.9, top + 1 + i); C.put(s, 21 - i * 0.9, top + 1 + i); } }
  if (L.pouch) C.rect(C.part(L.leather, 'leather'), back ? 12 : 18, waist + 1, back ? 13 : 19, waist + 3);
  // S15 P1 (Referenz 6): schwere Rüstung trägt auch unten auf — Beinplatten an den Hüften (ab Wucht 2), Taschen am Gürtel (ab 3)
  if (X.ab >= 2 && (L.armor === 'plate' || L.armor === 'chain') && !L.robe) { const T0 = L.armorR, tl = C.part(T0, 'metal', { grp: 'tasset' }), tr = C.part(dimR(T0, 0.1), 'metal', { grp: 'tasset' }), w0 = X.wa + (X.ab >= 3 ? 1 : 0) + (X.ab >= 4 ? 1 : 0), d = X.ab >= 3 ? 7 : 5;
    C.poly(tl, [[10.5 - w0, waist + 1.5], [15.5, waist + 1.5], [15, waist + d], [9.5 - w0, waist + d - 1]]); C.poly(tr, [[16.5, waist + 1.5], [21.5 + w0, waist + 1.5], [22.5 + w0, waist + d - 1], [17, waist + d]]);
    ids.tassets = [tl, tr]; }
  if (X.ab >= 3 && !back) { const pk = C.part(L.leather, 'leather'); C.rect(pk, 11 - X.wa, waist, 12 - X.wa, waist + 2); C.rect(pk, 19 + X.wa, waist, 20 + X.wa, waist + 2); }
  // Rückansicht: Umhang über dem Rücken, Köcher, Rucksack
  if (back && L.cloak) C.poly(C.part(L.cloak, 'cloth', { folds: true }), cloakPts(9 - X.sh, 22 + X.sh));
  if (back && L.quiver) { const q = C.part(L.leather, 'leather'); C.poly(q, [[19, 6 + by], [21, 5 + by], [14, 27 + by], [12, 26 + by]]); meta.quiverTop = [20, 5 + by]; }
  if (hasSil(L, 'boiler') && back) boiler(C, L, top, 'N');
  if (back && L.pack) { const pk = C.part(L.leather, 'leather'); C.rect(pk, 11, top + 1, 20, top + 11); C.rect(C.part(dimR(L.cloth, 0.05), 'cloth'), 11, top - 1, 20, top); ids.pack = pk; }
  // 7 Arme
  for (const [k, a] of [['L', aL], ['R', aR]]) if (!armBehind(a)) {
    const pa = C.part(X.sleeve, X.sleeveMat, { grp: 'arm' + k }), ph = C.part(X.hand, 'skin');
    arm(C, pa, ph, a, X.aw, X.hand, X.bone); ids['arm' + k] = pa; ids['hand' + k] = ph; (meta.arms ||= []).push([pa, a]);
    meta.limbs[(k === 'L') !== back ? 'rarm' : 'larm'] = [a[1][0], a[1][1]];
  }
  // 8 Schulterstücke
  if (L.pauldR || L.armor === 'plate' || L.pb) { const P = L.pauldR || L.armorR, pl = C.part(P, 'metal'), pr = C.part(dimR(P, 0.1), 'metal'), PB = Math.min(3, (L.pb | 0) + (X.ab >= 3 ? 1 : 0));
    const shape = n => n === 3 ? [[8, 12], [6, 13], [4, 13], [3, 13], [3, 13], [3, 12], [4, 12], [5, 11], [7, 10]] : n === 2 ? [[8, 11], [6, 12], [5, 13], [5, 13], [5, 12], [5, 12], [6, 11]] : n === 1 ? [[8, 11], [7, 12], [6, 12], [6, 12], [6, 11], [7, 10]] : [[9, 11], [8, 12], [8, 12], [8, 11], [9, 10]];
    const nL = L.asy ? (back ? 0 : PB) : PB, nR = L.asy ? (back ? PB : 0) : PB;   // asymmetrisch: eine riesige, eine kleine Schulter
    const po = Math.min(X.sh, 5); C.rows(pl, top - 1 - nL, shape(nL), -po); C.rows(pr, top - 1 - nR, shape(nR).map(([a, b]) => [31 - b, 31 - a]), po); ids.pauld = [pl, pr]; }
  if (!L.furR && X.ab >= 4 && L.cloak && !X.hood) { const m = C.part(L.cloak, 'cloth', { grp: 'mantleC' }); C.poly(m, [[10 - X.sh, top + 1], [12, top - 2], [20, top - 2], [22 + X.sh, top + 1], ...rag(22 + X.sh, 10 - X.sh, top + 3, 23, 1.8), [10 - X.sh, top + 3]]); }   // S15 P1: schwerer Stoffkragen über den Schultern (Referenz 6)
  if (L.furR) { const f = C.part(L.furR, 'cloth', { grp: 'fur' }); C.poly(f, [[10 - X.sh, top + 1], [12, top - 2], [20, top - 2], [22 + X.sh, top + 1], ...rag(22 + X.sh, 10 - X.sh, top + 2, 17, 1.6), [10 - X.sh, top + 2]]); ids.fur = f; }   // Pelzkragen
  if (L.gg && !X.hood) { const g = C.part(L.armorR || L.metal, 'metal'); C.rows(g, top - 2, X.ab >= 3 ? [[12, 19], [11, 20], [11, 20]] : [[13, 18], [12, 19]]); ids.gorget = g; }   // Halsberge
  // 9 Kapuzenkragen / Schulterumhang / Halstuch
  if (X.hood) { const m = C.part(L.hood, 'cloth', { grp: 'hood' }); C.poly(m, [[12, top - 1], [20, top - 1], [22.5 + X.sh, top + 2], ...rag(22.5 + X.sh, 9.5 - X.sh, top + 3, 5, 1.2), [9.5 - X.sh, top + 2]]); ids.mantle = m; }
  else if (L.capeR && !X.helmet) { const m = C.part(L.capeR, 'cloth'); C.poly(m, [[11, top - 1], [21, top - 1], [23 + X.sh, top + 3], [23 + X.sh + R.cs * 0.3, top + 6], ...rag(23 + X.sh, 9 - X.sh, top + 6, 13, 1.5), [9 - X.sh - R.cs * 0.3, top + 6], [9 - X.sh, top + 3]]); ids.mantle = m; }
  else if (L.scarf && L.face !== 'cloth') { const m = C.part(L.scarf, 'cloth'); C.rows(m, top - 1, [[13, 18], [12, 19]]); ids.collar = m; }
  // 10 Kopf
  headSN(C, L, X, hx, hy, back, ids, meta);
  silHead(C, L, X, hx, 5 + hy, back ? 'N' : 'S');   // nach dem Kopf, auch über der Kapuze
  // 11 Schild
  if (L.shield && shieldArm) {
    const a = shieldArm === 'L' ? aL : aR, [sx, sy] = back ? [shieldArm === 'L' ? 10 : 22, 23 + by] : [a[2][0] + (pose === 'guard' ? 0 : shieldArm === 'L' ? -1 : 1), a[2][1] - 1];
    const sp = C.part(L.shieldR, L.shield === 'round' ? 'wood' : 'metal', { grp: 'shield' });
    if (L.shield === 'round') C.ell(sp, sx, sy, 3.6, 4.1); else C.poly(sp, [[sx - 3.5, sy - 4.5], [sx + 3.5, sy - 4.5], [sx + 3.5, sy + 1], [sx, sy + 5], [sx - 3.5, sy + 1]]);
    ids.shield = sp; meta.shieldAt = [sx, sy];
  }
  Object.assign(meta, { ids, top, waist, back, hy, hx, X });
  return meta;
}
// zerfetzter Saum: Punkte von xa nach xb in 2-px-Zacken
function rag(xa, xb, y, seed, depth) {
  const pts = [], n = Math.max(1, Math.round(Math.abs(xb - xa) / 2));
  for (let i = 1; i < n; i++) { const x = xa + (xb - xa) * i / n; pts.push([x, y + (i % 2 ? Math.round(hsh(i, seed) * depth + 0.4) : 0)]); }
  return pts;
}

// Kopf vorn/hinten: Hals, Kopf, Haar, Bart, Helm, Kamm, Kapuze mit Gesicht im Schatten
function headSN(C, L, X, hx, hy, back, ids, meta) {
  const y0 = 5 + hy, gob = X.gob;
  meta.eyeY = y0 + 4;
  C.rect(C.part(L.skin, 'skin', { grp: 'head' }), 15 + hx, y0 + 7, 16 + hx, y0 + 8);          // Hals
  if (X.hood) {
    const hd = C.part(L.hood, 'cloth', { grp: 'hood' });
    C.rows(hd, y0 - 2, [[14, 17], [13, 18], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [13, 18]], hx);
    if (!back) { const f = C.part(flatR(VOID), 'cloth', { flat: true, noLine: true }); C.rows(f, y0 + 2, [[14, 17], [13, 18], [13, 18], [13, 18], [14, 17]], hx); ids.face = f; }
    ids.hood = hd; return;
  }
  const hd = C.part(L.skin, gob ? 'skin' : X.bone ? 'bone' : 'skin', { grp: 'head' });
  if (gob) { C.rows(hd, y0 + 1, [[13, 18], [12, 19], [12, 19], [12, 19], [12, 19], [13, 18], [14, 17]], hx);     // breiter, tiefer Kopf
    const ear = C.part(L.skin, 'skin'); C.poly(ear, [[12 + hx, y0 + 3], [8 + hx, y0 + 1], [9 + hx, y0 + 3], [12 + hx, y0 + 5]]); C.poly(ear, [[20 + hx, y0 + 3], [24 + hx, y0 + 1], [23 + hx, y0 + 3], [20 + hx, y0 + 5]]); }
  else C.rows(hd, y0, [[14, 17], [13, 18], [13, 18], [13, 18], [13, 18], [13, 18], [14, 17], [14, 17]], hx);
  ids.head = hd;
  const t = L.helm;
  if (L.hs !== 2 && !X.helmet && !X.bone && !gob && t !== 'scarf') {                    // Haar
    const hr = C.part(L.hair, 'cloth', { grp: 'head' });
    if (back) C.rows(hr, y0 - 1, [[14, 17], [13, 18], [13, 18], [13, 18], [13, 18], [13, 18], [14, 17]], hx);
    else { C.rows(hr, y0 - 1, [[14, 17], [13, 18], [13, 18]], hx); C.put(hr, 13 + hx, y0 + 2); C.put(hr, 18 + hx, y0 + 2); C.put(hr, 13 + hx, y0 + 3); C.put(hr, 18 + hx, y0 + 3); }
    if (L.hs === 1) { C.rect(hr, 12 + hx, y0 + 2, 12 + hx, y0 + 9); C.rect(hr, 19 + hx, y0 + 2, 19 + hx, y0 + 9); if (back) C.rect(hr, 13 + hx, y0 + 6, 18 + hx, y0 + 9); }
    if (L.hs === 3 && back) C.rect(hr, 15 + hx, y0 + 6, 16 + hx, y0 + 12);
    ids.hair = hr;
  }
  if (L.beard && !back && !X.helmet && !X.bone) { const bd = C.part(L.hair, 'cloth'); C.rows(bd, y0 + 5, [[13, 18], [13, 18], [14, 17], [15, 16]], hx); ids.beard = bd; }
  if (t) {
    const hm = C.part(L.helmR, ['cap', 'scarf', 'wide', 'hat'].includes(t) ? 'cloth' : 'metal', { grp: 'helm' });
    if (XHELM.has(t)) {                                              // S14 Endgame-Helme: Hörner, Krone, Federbusch, Visier, Magitech, Schädel
      const base = t === 'visor' ? [[14, 17], [13, 18], [12, 19], [12, 19], [11, 20], [11, 20], [12, 19], [12, 19], [12, 19], [13, 18], [13, 18]]
        : t === 'mech' ? [[14, 17], [13, 18], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [13, 18], [13, 18], [14, 17]]
        : t === 'skull' ? [[13, 18], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [13, 18], [14, 17]]
        : [[13, 18], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [13, 18]];
      C.rows(hm, y0 - (t === 'visor' || t === 'mech' ? 3 : 2), base, hx);
      const bone = t === 'skull' || t === 'horned', acc = C.part(bone ? L.bone : L.gold, bone ? 'bone' : 'metal');
      if (t === 'horned') { C.poly(acc, [[12.5 + hx, y0], [9 + hx, y0 - 3], [7.5 + hx, y0 - 7], [10.5 + hx, y0 - 5], [13.5 + hx, y0 - 1.5]]); C.poly(acc, [[19.5 + hx, y0], [23 + hx, y0 - 3], [24.5 + hx, y0 - 7], [21.5 + hx, y0 - 5], [18.5 + hx, y0 - 1.5]]); }
      else if (t === 'crown') { C.rect(acc, 12 + hx, y0 - 3, 19 + hx, y0 - 3); for (const x of [12, 14, 17, 19]) C.rect(acc, x + hx, y0 - 5, x + hx, y0 - 4); C.rect(acc, 15 + hx, y0 - 6, 16 + hx, y0 - 4); }
      else if (t === 'plume') C.poly(C.part(L.crest || L.markR || L.gold, 'cloth'), [[15 + hx, y0 - 2], [17 + hx, y0 - 2], [20 + hx, y0 - 6], [18 + hx, y0 - 10], [14 + hx, y0 - 6]]);
      else if (t === 'mech') { C.rect(acc, 11 + hx, y0 - 1, 11 + hx, y0 + 5); C.rect(acc, 20 + hx, y0 - 1, 20 + hx, y0 + 5); C.rect(acc, 15 + hx, y0 - 5, 16 + hx, y0); }
      else if (t === 'skull') for (const x of [12, 14, 17, 19]) C.rect(acc, x + hx, y0 - 4 - (x === 14 || x === 17 ? 1 : 0), x + hx, y0 - 3);
    }
    else if (t === 'great') C.rows(hm, y0 - 2, [[13, 18], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [13, 18]], hx);
    else if (t === 'bascinet') C.rows(hm, y0 - 4, [[15, 16], [14, 17], [13, 18], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [13, 18]], hx);
    else if (t === 'kettle') { C.rows(hm, y0 - 2, [[14, 17], [13, 18], [13, 18]], hx); C.rows(hm, y0 + 1, [[10, 21], [11, 20]], hx); }
    else if (t === 'nasal') { C.rows(hm, y0 - 2, [[14, 17], [13, 18], [12, 19], [12, 19]], hx); if (!back) C.rect(hm, 15 + hx, y0 + 2, 16 + hx, y0 + 4); }
    else if (t === 'wide') { C.rows(hm, y0 - 4, [[14, 17], [13, 18], [13, 18], [13, 18]], hx); C.rows(hm, y0, [[8, 23], [9, 22]], hx); }
    else if (t === 'hat') { C.rows(hm, y0 - 3, [[14, 17], [13, 18], [13, 18]], hx); C.rows(hm, y0, [[10, 21]], hx); }
    else if (t === 'scarf') { C.rows(hm, y0 - 1, [[14, 17], [13, 18], [12, 19], [12, 19]], hx); C.rect(hm, 12 + hx, y0 + 3, 12 + hx, y0 + 8); C.rect(hm, 19 + hx, y0 + 3, 19 + hx, y0 + 8); if (back) C.rect(hm, 13 + hx, y0 + 3, 18 + hx, y0 + 8); }
    else C.rows(hm, y0 - 1, [[14, 17], [13, 18], [13, 18], [12, 19]], gob ? hx : hx);    // Kappe
    ids.helm = hm;
    if (L.crest) { const cr = C.part(L.crest, 'cloth'); const cy = t === 'great' ? y0 - 5 : t === 'bascinet' ? y0 - 6 : y0 - 4; C.rect(cr, 15 + hx, cy, 16 + hx, cy + 2); C.put(cr, 17 + hx, cy + 1); ids.crest = cr; }
  }
  if (L.face === 'cloth' && L.scarf && !back) ids.mouth = true;
}

// ---- Seitenansicht (Blick nach links; E wird gespiegelt) ----
function paintW(C, L, R, plan, W, pose) {
  const X = looks(L), by = R.by, ln = R.lean, top = 13 + by, waist = 24 + by, meta = { behind: false, limbs: {} };
  const hem = Math.min(46, X.hemRow + by + (R.sit ? -3 : 0)), longCoat = X.hemRow >= 32, ids = {};
  let aN = R.aN, aF = R.aF;
  if (plan) { aN = [R.aN[0], ik(R.aN[0], plan.h, 6, 6.5, e => e[1] + (e[0] > R.aN[0][0] ? 1.5 : 0)), plan.h];
    if (plan.off) aF = [R.aF[0], ik(R.aF[0], plan.off, 6, 6.5, e => e[1]), plan.off]; }
  const shield = L.shield && !(W && W.two);
  if (shield && pose === 'guard') aF = [R.aF[0], [15, 19.5 + by], [11.5, 21 + by]];
  aN = fixArm(L, 'rarm', aN, -0.5); aF = fixArm(L, 'larm', aF, 0.5);
  const sh = (pts, dx) => pts.map(([x, y]) => [x + dx, y]);
  if (hasSil(L, 'boiler')) boiler(C, L, top, 'W');
  // 1 Umhang hinten, schwingt nach
  const cloakHem = L.capeL ? 46 : Math.min(46, Math.max(X.hemRow + 4, 38) + by), cs = R.cs;
  if (L.cloak) C.poly(C.part(L.cloak, 'cloth', { grp: 'cloak', folds: true }), [[16 + ln, top - 1], [19 + ln, top], [21 + ln + cs * 0.5, top + 8], [22 + cs, cloakHem], ...rag(22 + cs, 13 + cs * 0.5, cloakHem, 9, 2), [13 + cs * 0.5, cloakHem - 1], [15 + ln, top + 10]]);
  // 2 ferner Arm, fernes Bein
  const far = 0.28, farArm = C.part(dimR(X.sleeve, far), X.sleeveMat, { grp: 'armF' }), farHand = C.part(dimR(X.hand, far), 'skin');
  arm(C, farArm, farHand, sh(aF, ln), X.aw, X.hand, X.bone); meta.limbs.larm = aF[1];
  const lF = C.part(dimR(X.pants, 0.22), X.bone ? 'bone' : 'cloth', { grp: 'legF' }), bF = C.part(X.boots ? dimR(X.boots, 0.2) : dimR(L.skin, 0.3), X.boots ? 'leather' : 'skin');
  C.limb(lF, R.lF, X.legW, X.legW - 0.5); if (R.lF.length === 3) bootW(C, bF, R.lF[2], !X.boots); else STUMPS.push(R.lF[1]); meta.limbs.lleg = R.lF[1];
  // 3 Rucksack, Köcher (auf dem Rücken)
  if (L.pack) { const pk = C.part(L.leather, 'leather'); C.rect(pk, 18 + ln, top + 1, 21 + ln, top + 11); C.rect(C.part(dimR(L.cloth, 0.05), 'cloth'), 17 + ln, top - 1, 21 + ln, top); ids.pack = pk; }
  if (L.quiver) { const q = C.part(L.leather, 'leather'); C.poly(q, [[18 + ln, 5 + by], [20 + ln, 5 + by], [21 + ln, 22 + by], [19 + ln, 22 + by]]); meta.quiverTop = [19 + ln, 5 + by]; }
  // 4 nahes Bein
  const lN = C.part(X.pants, X.bone ? 'bone' : 'cloth', { grp: 'legN' }), bN = C.part(X.boots || dimR(L.skin, 0.1), X.boots ? 'leather' : 'skin');
  C.limb(lN, R.lN, X.legW, X.legW - 0.5); if (R.lN.length === 3) bootW(C, bN, R.lN[2], !X.boots); else STUMPS.push(R.lN[1]); meta.limbs.rleg = R.lN[1];
  ids.legL = lN; ids.legR = lF; ids.bootL = bN; ids.bootR = bF;
  // 5 Rock
  const skirt = C.part(X.coat, 'cloth', { grp: 'coat', folds: longCoat }), flare = X.hemRow >= 44 ? 2 : longCoat ? 1 : 0, sw = R.sw;
  if (X.bone && !L.robe) C.poly(skirt, [[13, waist + 1], [19, waist + 1], [19.5, waist + 5], ...rag(19.5, 12.5, waist + 5, 5, 1.5), [12.5, waist + 5]]);
  else C.poly(skirt, [[13 + ln * 0.5 - X.be, waist + 1], [19 + ln * 0.5 + X.wa, waist + 1], [19 + flare + sw + X.wa, hem], ...rag(19 + flare + sw, 12 - flare * 0.5 + sw * 0.5, hem, 5, longCoat ? 1.5 : 1), [12 - flare * 0.5 + sw * 0.5, hem]]);
  ids.skirt = skirt; meta.hem = hem;
  // 6 Rumpf (Brust vorn = links)
  const torso = C.part(X.coat, 'cloth', { grp: 'coat' });
  if (X.bone && !L.robe && !L.armor) { C.rows(torso, top, [[15, 17], [14, 18], [14, 18], [14, 18], [14, 18], [14, 18], [14, 17], [15, 17], [15, 17], [15, 17], [15, 17], [15, 17]], ln); ids.ribs = true; }
  else C.rows(torso, top, [[13, 18], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [13, 19], [13, 19], [13, 19]].map(([a, b], i) => [a - (i >= 5 && i <= 10 ? X.be : 0) - (i > 0 && i < 7 ? (X.sh + 1) >> 1 : 0), b + Math.max(0, i === 0 ? X.sh - 2 : i < 6 ? X.sh : i < 8 ? X.sh >> 1 : X.wa)]), ln);
  ids.torso = torso;
  if (L.armor === 'leather') { const j = C.part(L.armorR, 'leather'); C.rows(j, top + 1, Array(11).fill([13, 18]).concat([[13, 18], [13, 18]]), ln); ids.jerkin = j; }
  if (L.armor === 'plate') { const pl = C.part(L.armorR, 'metal'); C.rows(pl, top + 1, [[13, 18], [12, 18], [12, 18], [12, 18], [13, 18], [13, 18], [13, 18], [13, 18], [13, 18], [13, 18]], ln);
    C.rect(C.part(dimR(L.armorR, 0.12), 'metal'), 13 + ln, waist + 2, 18 + ln, waist + 4); ids.plate = pl; }
  if (L.armor === 'chain') { const cs2 = C.part(L.armorR, 'metal', { grp: 'coat' }); C.rect(cs2, 13, waist + 1, 18, Math.min(hem, waist + 5)); ids.chainSkirt = cs2; }
  if (L.apron) { const ap = C.part(L.apronR || L.leather, 'leather'); C.poly(ap, [[12.5 + ln, top + 4], [14.5 + ln, top + 4], [14.5, Math.min(hem, 38)], [11.5, Math.min(hem, 38)]]); ids.apron = ap; }
  if (L.tabard) { const tb = C.part(L.tabard, 'cloth'); C.poly(tb, [[13 + ln, top + 2], [15.5 + ln, top + 2], [15.5, hem - 1], [12.5, hem - 1]]); ids.tabard = tb; }
  if (L.stoleR) C.rect(C.part(L.stoleR, 'cloth'), 14 + ln, top, 14 + ln, Math.min(hem + 1, 40));
  const belt = C.part(L.belt, 'leather'); C.rect(belt, 13 + ln - Math.max(0, X.be - 1), waist, 18 + ln + Math.max(0, X.wa), waist + 1); ids.belt = belt;
  if (L.strap && !ids.plate && !ids.tabard) { const s = C.part(dimR(L.leather, 0.15), 'leather'); for (let i = 0; i <= 10; i++) C.put(s, 15.5 + ln + i * 0.25, top + 1 + i); }
  if (L.sashR) { const s = C.part(L.sashR, 'cloth'); for (let i = 0; i <= 10; i++) { C.put(s, 17 + ln - i * 0.35, top + 1 + i); C.put(s, 16 + ln - i * 0.35, top + 1 + i); } }
  if (L.pouch) C.rect(C.part(L.leather, 'leather'), 17 + ln, waist + 1, 18 + ln, waist + 3);
  if (X.ab >= 2 && (L.armor === 'plate' || L.armor === 'chain') && !L.robe) { const tp = C.part(L.armorR, 'metal', { grp: 'tasset' }), d = X.ab >= 3 ? 7 : 5;   // S15 P1: Beinplatte
    C.poly(tp, [[12 + ln, waist + 1.5], [17.5 + ln, waist + 1.5], [17 + ln, waist + d], [11 + ln, waist + d - 1]]); ids.tassets = [tp]; }
  // 7 naher Arm
  const nArm = C.part(X.sleeve, X.sleeveMat, { grp: 'armN' }), nHand = C.part(X.hand, 'skin');
  arm(C, nArm, nHand, sh(aN, ln), X.aw, X.hand, X.bone); ids.armL = nArm; ids.handL = nHand; meta.limbs.rarm = aN[1]; meta.arms = [[nArm, sh(aN, ln)]];
  if (L.pauldR || L.armor === 'plate' || L.pb) { const PB = L.asy ? 0 : L.pb | 0, pp = C.part(L.pauldR || L.armorR, 'metal');
    C.rows(pp, top - 1 - PB, (PB === 2 ? [[14, 18], [12, 19], [11, 19], [11, 19], [12, 19], [12, 18], [13, 17]] : PB === 1 ? [[14, 17], [12, 19], [12, 19], [12, 18], [13, 17]] : [[14, 17], [13, 18], [13, 18], [14, 17]]).map(([a, b]) => [a - (X.sh >> 1), b + (X.sh >> 1)]), ln); ids.pauld = [pp]; }
  if (L.furR) { const f = C.part(L.furR, 'cloth', { grp: 'fur' }); C.rows(f, top - 2, [[13, 19], [12, 20], [12, 20]], ln); ids.fur = f; }
  if (L.gg && !X.hood) C.rows(C.part(L.armorR || L.metal, 'metal'), top - 2, [[14, 17]], ln);
  // 8 Kragen/Umhang
  if (X.hood) C.poly(C.part(L.hood, 'cloth', { grp: 'hood' }), [[14 + ln, top - 1], [19 + ln, top - 1], [21 + ln + cs * 0.3, top + 3], ...rag(21 + ln + cs * 0.3, 12.5 + ln, top + 3, 5, 1.2), [12.5 + ln, top + 1]]);
  else if (L.capeR && !X.helmet) C.poly(C.part(L.capeR, 'cloth'), [[14 + ln, top - 1], [19 + ln, top - 1], [21.5 + cs * 0.6, top + 6], ...rag(21.5 + cs * 0.6, 13 + ln, top + 6, 13, 1.5), [13 + ln, top + 2]]);
  else if (L.scarf && L.face !== 'cloth') C.rows(C.part(L.scarf, 'cloth'), top - 1, [[14, 18], [13, 18]], ln);
  // 9 Kopf
  headW(C, L, X, R.hx + ln, R.hy + by, ids, meta);
  silHead(C, L, X, R.hx + ln, 5 + R.hy + by, 'W');
  // 10 Schild (nahe Seite vor dem Rumpf, in Deckung vorn)
  if (shield) { const [sx, sy] = pose === 'guard' ? [11.5, 21 + by] : [15 + ln, 25 + by], sp = C.part(L.shieldR, L.shield === 'round' ? 'wood' : 'metal', { grp: 'shield' });
    if (L.shield === 'round') C.ell(sp, sx, sy, 2, 4.2); else C.poly(sp, [[sx - 1.5, sy - 4.5], [sx + 1.5, sy - 4.5], [sx + 1.5, sy + 1.5], [sx - 0.5, sy + 5], [sx - 1.5, sy + 1.5]]);
    ids.shield = sp; meta.shieldAt = [sx, sy]; }
  Object.assign(meta, { ids, top, waist, back: false, side: true, hy: R.hy + by, hx: R.hx + ln, X });
  return meta;
}
function bootW(C, pid, [fx, fy], bare) {
  if (bare) { C.rect(pid, fx - 0.5, fy + 1, fx + 0.5, fy + 4); C.rect(pid, fx - 2.5, fy + 4, fx + 0.5, fy + 4); return; }
  const b = AB >= 2 ? 1 : AB ? 0.5 : 0;
  C.poly(pid, [[fx - 1.5 - b, fy - 1 - b * 2], [fx + 1.8 + b, fy - 1 - b * 2], [fx + 1.8 + b, fy + 5], [fx - 3.5 - b, fy + 5], [fx - 3.5 - b, fy + 3.2], [fx - 1.5 - b, fy + 2.5]]);
}
function headW(C, L, X, hx, hy, ids, meta) {
  const y0 = 5 + hy, gob = X.gob;
  meta.eyeY = y0 + 4;
  C.rect(C.part(L.skin, 'skin', { grp: 'head' }), 15 + hx, y0 + 7, 16 + hx, y0 + 8);
  if (X.hood) {
    const hd = C.part(L.hood, 'cloth', { grp: 'hood' });
    C.rows(hd, y0 - 2, [[14, 17], [13, 18], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [13, 19], [13, 19], [14, 18]], hx);
    const f = C.part(flatR(VOID), 'cloth', { flat: true, noLine: true }); C.rows(f, y0 + 2, [[12, 14], [12, 15], [12, 15], [12, 14], [13, 14]], hx);
    ids.face = f; ids.hood = hd; return;
  }
  const hd = C.part(L.skin, X.bone ? 'bone' : 'skin', { grp: 'head' });
  if (gob) { C.rows(hd, y0 + 1, [[13, 18], [12, 18], [12, 18], [11, 18], [12, 18], [13, 17], [14, 16]], hx);
    const ear = C.part(L.skin, 'skin'); C.poly(ear, [[17 + hx, y0 + 3], [22 + hx, y0], [21 + hx, y0 + 3], [18 + hx, y0 + 5]]); C.put(hd, 10 + hx, y0 + 5); }
  else { C.rows(hd, y0, [[14, 17], [13, 18], [13, 18], [13, 18], [12, 18], [13, 18], [13, 17], [14, 17]], hx); }
  ids.head = hd;
  const t = L.helm;
  if (L.hs !== 2 && !X.helmet && !X.bone && !gob && t !== 'scarf') {
    const hr = C.part(L.hair, 'cloth', { grp: 'head' });
    C.rows(hr, y0 - 1, [[14, 17], [13, 18], [15, 18], [16, 18], [16, 18], [17, 18]], hx);
    if (L.hs === 1) C.rect(hr, 17 + hx, y0 + 5, 18 + hx, y0 + 10);
    if (L.hs === 3) C.rect(hr, 19 + hx, y0 + 4, 19 + hx, y0 + 10);
    ids.hair = hr;
  }
  if (L.beard && !X.helmet && !X.bone) { const bd = C.part(L.hair, 'cloth'); C.rows(bd, y0 + 5, [[13, 16], [13, 16], [14, 15]], hx); ids.beard = bd; }
  if (t) {
    const hm = C.part(L.helmR, ['cap', 'scarf', 'wide', 'hat'].includes(t) ? 'cloth' : 'metal', { grp: 'helm' });
    if (XHELM.has(t)) {                                              // S14 Endgame-Helme: Hörner, Krone, Federbusch, Visier, Magitech, Schädel
      const base = t === 'visor' ? [[14, 17], [13, 18], [12, 19], [12, 19], [11, 20], [11, 20], [12, 19], [12, 19], [12, 19], [13, 18], [13, 18]]
        : t === 'mech' ? [[14, 17], [13, 18], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [13, 18], [13, 18], [14, 17]]
        : t === 'skull' ? [[13, 18], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [13, 18], [14, 17]]
        : [[13, 18], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [13, 18]];
      C.rows(hm, y0 - (t === 'visor' || t === 'mech' ? 3 : 2), base, hx);
      const bone = t === 'skull' || t === 'horned', acc = C.part(bone ? L.bone : L.gold, bone ? 'bone' : 'metal');
      if (t === 'horned') { C.poly(acc, [[12.5 + hx, y0], [9 + hx, y0 - 3], [7.5 + hx, y0 - 7], [10.5 + hx, y0 - 5], [13.5 + hx, y0 - 1.5]]); C.poly(acc, [[19.5 + hx, y0], [23 + hx, y0 - 3], [24.5 + hx, y0 - 7], [21.5 + hx, y0 - 5], [18.5 + hx, y0 - 1.5]]); }
      else if (t === 'crown') { C.rect(acc, 12 + hx, y0 - 3, 19 + hx, y0 - 3); for (const x of [12, 14, 17, 19]) C.rect(acc, x + hx, y0 - 5, x + hx, y0 - 4); C.rect(acc, 15 + hx, y0 - 6, 16 + hx, y0 - 4); }
      else if (t === 'plume') C.poly(C.part(L.crest || L.markR || L.gold, 'cloth'), [[15 + hx, y0 - 2], [17 + hx, y0 - 2], [20 + hx, y0 - 6], [18 + hx, y0 - 10], [14 + hx, y0 - 6]]);
      else if (t === 'mech') { C.rect(acc, 11 + hx, y0 - 1, 11 + hx, y0 + 5); C.rect(acc, 20 + hx, y0 - 1, 20 + hx, y0 + 5); C.rect(acc, 15 + hx, y0 - 5, 16 + hx, y0); }
      else if (t === 'skull') for (const x of [12, 14, 17, 19]) C.rect(acc, x + hx, y0 - 4 - (x === 14 || x === 17 ? 1 : 0), x + hx, y0 - 3);
    }
    else if (t === 'great') C.rows(hm, y0 - 2, [[13, 18], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [13, 18]], hx);
    else if (t === 'bascinet') C.rows(hm, y0 - 4, [[16, 17], [15, 18], [13, 18], [12, 19], [11, 19], [11, 19], [12, 19], [12, 19], [12, 19], [12, 19], [12, 19], [13, 18]], hx);
    else if (t === 'kettle') { C.rows(hm, y0 - 2, [[14, 17], [13, 18], [13, 18]], hx); C.rows(hm, y0 + 1, [[10, 21], [11, 20]], hx); }
    else if (t === 'nasal') { C.rows(hm, y0 - 2, [[14, 17], [13, 18], [12, 19], [12, 19]], hx); C.rect(hm, 12 + hx, y0 + 2, 12 + hx, y0 + 4); }
    else if (t === 'wide') { C.rows(hm, y0 - 4, [[14, 17], [13, 18], [13, 18], [13, 18]], hx); C.rows(hm, y0, [[8, 23], [9, 22]], hx); }
    else if (t === 'hat') { C.rows(hm, y0 - 3, [[14, 17], [13, 18], [13, 18]], hx); C.rows(hm, y0, [[10, 21]], hx); }
    else if (t === 'scarf') { C.rows(hm, y0 - 1, [[14, 17], [13, 18], [13, 19], [14, 19]], hx); C.rect(hm, 16 + hx, y0 + 3, 19 + hx, y0 + 8); }
    else C.rows(hm, y0 - 1, [[14, 17], [13, 18], [13, 18], [12, 19]], hx);
    ids.helm = hm;
    if (L.crest) { const cr = C.part(L.crest, 'cloth'); const cy = t === 'great' ? y0 - 5 : t === 'bascinet' ? y0 - 6 : y0 - 4; C.rect(cr, 15 + hx, cy, 17 + hx, cy + 1); C.put(cr, 18 + hx, cy + 2); C.put(cr, 19 + hx, cy + 3); ids.crest = cr; }
  }
  if (L.face === 'cloth' && L.scarf) ids.mouth = true;
}

// ---- Details nach der Schattierung: Gesicht, Augen, Schnalle, Zeichen, Kette, Nieten, Falten, Wickel, Stulpen ----
function details(C, L, R, view, M, pose) {
  const I = M.ids, X = M.X, side = view === 'W', back = view === 'N', hx = M.hx, y0 = 5 + M.hy, S = L.skin, G1 = L.glow;
  const eye = G1 || '#1a1210';
  // Gesicht
  if (!back) {
    if (I.face !== undefined) {                                      // Kapuze: Gesicht im Schatten, Augen als Akzent
      const ex = side ? [13] : [14, 17], ey = y0 + 4;
      if (L.face === 'skull') { for (const x of ex) { C.set(x + hx, ey - 1, L.bone.sh); C.set(x + hx, ey, G1 || '#0a0808'); } for (let x = side ? 12 : 15; x <= (side ? 14 : 16); x++) C.set(x + hx, ey + 2, x % 2 ? L.bone.b : L.bone.sh); }
      else if (L.face === 'mask') { const Mk = L.metal; for (let y = ey - 1; y <= ey + 2; y++) for (let x = side ? 12 : 14; x <= (side ? 14 : 17); x++) C.on(I.face, x + hx, y, y === ey - 1 ? Mk.hi : Mk.b); for (const x of ex) C.set(x + hx, ey, G1 || '#0a0808'); }
      else if (L.face === 'cloth' && L.scarf) { for (const x of ex) C.set(x + hx, ey, G1 || '#d09048'); for (let y = ey + 1; y <= ey + 3; y++) for (let x = side ? 12 : 13; x <= (side ? 15 : 18); x++) C.on(I.face, x + hx, y, y === ey + 1 ? L.scarf.hi : L.scarf.b); }
      else { for (let x = side ? 12 : 14; x <= (side ? 14 : 17); x++) C.on(I.face, x + hx, ey + 1, mix(S.dk, VOID, 0.35)); for (const x of ex) C.set(x + hx, ey, G1 || '#c89048'); }
    } else if (I.head !== undefined) {
      const ey = y0 + 3 + (X.gob ? 2 : 0), exs = side ? [14] : [14, 17];
      if (L.face === 'eyes') { const h = I.head, E = G1 || '#ffe8a0';                           // Engel: kein Mund, drei Augen, Gold rinnt
        for (let y = y0; y <= y0 + 7; y++) for (let x = 11; x <= 20; x++) C.on(h, x + hx, y, (side ? x >= 16 : x >= 17) ? S.sh : S.hi);
        const eyes = side ? [[13, ey - 2], [13, ey], [13, ey + 2]] : [[15.5, ey - 2.5], [14, ey], [17, ey]];
        for (const [x, y] of eyes) { C.set(x + hx, y, '#0a0806'); C.set(x + hx + 1, y, E); }
        for (const [x, y] of eyes.slice(1)) { C.set(x + hx + 1, y + 1, '#c8a040'); C.set(x + hx + 1, y + 2, '#8a6a20'); }
      } else if (XHELM.has(L.helm)) { const HG = L.ge || G1, t = L.helm;
        if (t === 'skull') { for (const x of side ? [13] : [14, 17]) { C.set(x + hx, ey, VOID); C.set(x + hx, ey + 1, VOID); if (HG) C.set(x + hx, ey, HG); } for (let x = side ? 12 : 14; x <= (side ? 14 : 17); x++) C.set(x + hx, ey + 4, x % 2 ? L.bone.hi : VOID); if (!side) C.set(15 + hx, ey + 2, VOID); }
        else if (t === 'mech') { for (let x = side ? 11 : 12; x <= (side ? 15 : 19); x++) C.set(x + hx, ey, HG || '#6ab8ff'); C.set((side ? 13 : 15) + hx, ey, '#e8f6ff'); if (!side) C.set(16 + hx, ey, '#e8f6ff'); for (let x = side ? 11 : 13; x <= (side ? 15 : 18); x++) if (x % 2) C.set(x + hx, ey + 3, VOID); }
        else if (t === 'visor') { for (let x = side ? 10 : 12; x <= (side ? 15 : 19); x++) { C.set(x + hx, ey, VOID); C.set(x + hx, ey + 1, L.helmR.dk); } if (HG) for (const x of exs) C.set(x + hx, ey, HG); }
        else { for (let x = side ? 11 : 13; x <= (side ? 16 : 18); x++) C.set(x + hx, ey, VOID); if (!side) { C.set(15 + hx, ey + 2, VOID); C.set(16 + hx, ey + 2, VOID); } if (HG) for (const x of exs) C.set(x + hx, ey, HG); }
      } else if (L.helm === 'great' || L.helm === 'bascinet') { for (let x = side ? 11 : 13; x <= (side ? 16 : 18); x++) C.set(x + hx, ey, VOID); if (!side) { C.set(15 + hx, ey + 2, VOID); C.set(16 + hx, ey + 2, VOID); } if (G1) for (const x of exs) C.set(x + hx, ey, G1); }
      else if (X.bone) { for (const x of exs) { C.set(x + hx, ey, VOID); C.set(x + hx + (side ? -1 : x < 16 ? 0 : 0), ey + 1, G1 || VOID); } for (let x = side ? 12 : 14; x <= (side ? 15 : 17); x++) C.set(x + hx, ey + 3, x % 2 ? S.sh : VOID); }
      else if (X.gob) { for (const x of side ? [13] : [14, 17]) { C.set(x + hx, ey, '#e0c24a'); C.set(x + hx, ey - 1, S.dk); } for (let x = side ? 11 : 14; x <= (side ? 13 : 17); x++) C.set(x + hx, ey + 2, x % 2 ? L.bone.b : VOID); if (!side) { C.set(15 + hx, ey + 1, S.sh); C.set(16 + hx, ey + 1, S.sh); } }
      else {                                                         // Mensch: Brauenschatten, Schattenhälfte, zwei Augenpixel
        const h = I.head, x0 = side ? 12 : 13, x1 = side ? 18 : 18;
        for (let x = x0; x <= x1; x++) C.on(h, x + hx, ey - 1, S.sh);
        if (!side) for (let y = ey; y <= y0 + 7; y++) for (let x = 17; x <= 18; x++) C.on(h, x + hx, y, S.sh);
        else for (let y = ey; y <= y0 + 7; y++) C.on(h, 16 + hx, y, S.sh);
        for (const x of exs) C.on(h, x + hx, ey, eye);
        const Hd = L.hs === 2 || !L.hair ? S.dk : L.hair.dk;                                // S14: Gesicht detaillierter
        if (!side) { for (const x of [13, 14, 17, 18]) C.on(h, x + hx, ey - 1, Hd); C.on(h, 13 + hx, ey + 1, S.hi); C.on(h, 15 + hx, ey, S.hi); C.on(h, 15 + hx, ey + 1, S.b); C.on(h, 16 + hx, ey + 2, S.dk);
          if (!L.beard) { C.on(h, 15 + hx, ey + 3, mix(S.dk, '#5a2020', 0.3)); C.on(h, 16 + hx, ey + 3, mix(S.dk, '#5a2020', 0.3)); } for (let x = 14; x <= 17; x++) C.on(h, x + hx, y0 + 7, S.sh); C.set(12 + hx, ey + 1, S.sh); C.set(19 + hx, ey + 1, S.dk); }
        else { C.on(h, 13 + hx, ey - 1, Hd); C.on(h, 14 + hx, ey - 1, Hd); C.on(h, 13 + hx, ey + 1, S.hi); C.set(11 + hx, ey + 1, S.b); C.set(11 + hx, ey + 2, S.sh); C.on(h, 16 + hx, ey + 1, S.dk); C.on(h, 17 + hx, ey + 1, S.sh); }
        if (!side) C.on(h, 16 + hx, ey + 1, S.sh);                                       // Nase (seitlich: Kopfkontur)
        if (!L.beard) { if (!side) { C.on(h, 15 + hx, ey + 3, S.sh); C.on(h, 16 + hx, ey + 3, S.dk); } else C.on(h, 13 + hx, ey + 3, S.sh); }
        if (L.helm === 'wide' || L.helm === 'hat' || L.helm === 'kettle') for (let x = 13; x <= 18; x++) C.on(h, x + hx, ey - 1, S.dk);   // Krempe wirft Schatten
      }
      if (L.face === 'cloth' && L.scarf) for (let y = ey + 1; y <= ey + 3; y++) for (let x = side ? 11 : 13; x <= (side ? 15 : 18); x++) C.set(x + hx, y, y === ey + 1 ? L.scarf.hi : L.scarf.b);
    }
  }
  // Kapuzennaht und -spitze
  if (I.hood !== undefined && !side) C.set(15.5 + hx, y0 - 1, L.hood.sh);
  // Gürtelschnalle, Tasche
  if (!back && I.belt !== undefined) { const bx = side ? 13 + hx : 15; C.set(bx, M.waist, L.gold.hi); C.set(bx + 1, M.waist, L.gold.b); C.set(bx, M.waist + 1, L.gold.b); C.set(bx + 1, M.waist + 1, L.gold.sh); }
  // Kettenhemd: versetzte Ringreihen auf Rumpf, Ärmeln, Kettenrock
  if (L.armor === 'chain') { const Mm = L.armorR, ok = new Set([I.torso, I.chainSkirt, I.armL, I.armR].filter(v => v !== undefined));
    for (let y = 0; y < C.h; y++) for (let x = 0; x < C.w; x++) { const i = y * C.w + x; if (!ok.has(C.id[i])) continue; const c = C.col[i]; if (c === Mm.dk || c === mix(Mm.dk, '#070506', 0.3)) continue;
      C.col[i] = ((x >> 1) + (y >> 1)) % 2 ? (y % 2 ? Mm.sh : Mm.b) : (y % 2 ? Mm.b : mix(Mm.b, Mm.hi, 0.45)); } }   // S15: versetzte Ringe in Zweier-Clustern (keine Streifen)
  // Platte: Mittelgrat, Nieten
  if (I.plate !== undefined) { const Mm = L.armorR; if (!side) for (let y = M.top + 2; y <= M.top + 8; y++) C.on(I.plate, 16, y, Mm.hi);
    for (const [x, y] of side ? [[14 + hx, M.top + 2], [14 + hx, M.top + 7]] : [[12, M.top + 2], [19, M.top + 2], [12, M.top + 8], [19, M.top + 8]]) C.on(I.plate, x, y, mix(Mm.hi, '#fff', 0.35)); }
  // Leder: Naht
  if (I.jerkin !== undefined && !side) for (let y = M.top + 2; y <= M.top + 11; y += 2) C.on(I.jerkin, 16, y, L.armorR.dk);
  // Wappenrock-Zeichen
  if (I.tabard !== undefined && L.markR && !back) { const Mk = L.markR, cx = side ? 14 + hx : 15.5, cy = M.top + 5;
    if (L.mark === 'quarter') { for (let y = M.top + 2; y <= M.hem; y++) for (let x = 13; x <= 18; x++) if ((x < 16) !== (y < cy + 1)) C.on(I.tabard, x, y, mix(C.col[(y + C.dy) * C.w + x + C.dx] || Mk.b, Mk.b, 0.65)); }
    else if (L.mark === 'chevron') { if (side) { C.on(I.tabard, cx, cy, Mk.hi); C.on(I.tabard, cx, cy + 1, Mk.b); } else { C.set(14, cy + 1, Mk.b); C.set(15, cy, Mk.hi); C.set(16, cy, Mk.hi); C.set(17, cy + 1, Mk.b); } }
    else { for (let y = cy - 1; y <= cy + 3; y++) C.on(I.tabard, side ? cx : 15, y, Mk.b); if (!side) { C.on(I.tabard, 16, cy - 1, Mk.b); for (let y = cy - 1; y <= cy + 3; y++) C.on(I.tabard, 16, y, Mk.b); C.on(I.tabard, 14, cy, Mk.b); C.on(I.tabard, 17, cy, Mk.b); } } }
  // Schildzeichen
  if (I.shield !== undefined && L.markR && M.shieldAt) { const [sx, sy] = M.shieldAt.map(Math.floor), Mk = L.markR;
    if (L.mark === 'cross' && !side) { for (let d = -2; d <= 2; d++) C.on(I.shield, sx, sy + d, Mk.b); C.on(I.shield, sx - 1, sy - 1, Mk.b); C.on(I.shield, sx + 1, sy - 1, Mk.b); }
    else if (L.mark === 'chevron' && !side) { C.on(I.shield, sx - 1, sy + 1, Mk.b); C.on(I.shield, sx, sy, Mk.hi); C.on(I.shield, sx + 1, sy + 1, Mk.b); }
    else { C.on(I.shield, sx, sy, Mk.hi); C.on(I.shield, sx, sy + 1, Mk.sh); } }
  // Faltencluster in langen Mänteln, Roben, Umhängen: senkrechte Schattenzüge vom Saum aufwärts, Licht daneben
  for (const pid of [I.skirt, I.tabard].concat(C.P.map((p, i) => p.folds && p.grp === 'cloak' ? i : -1).filter(i => i >= 0))) {
    if (pid === undefined || pid < 0 || !C.P[pid]?.folds) continue; const Rr = C.P[pid].R;
    for (let x = 0; x < C.w; x++) { let y = C.h - 1; while (y >= 0 && C.id[y * C.w + x] !== pid) y--; if (y < 0) continue;
      if ((x + (L.wseed | 0)) % 3 !== 0) continue; const len = 3 + ((hsh(x, pid) * 4) | 0);
      for (let k = 1; k <= len; k++) { const i = (y - k) * C.w + x; if (C.id[i] !== pid) break; C.col[i] = Rr.sh; if (k === len && C.id[i - 1] === pid) C.col[i - 1] = mix(Rr.b, Rr.hi, 0.5); } }
  }
  // Rippen (Skelett ohne Rüstung)
  if (I.ribs) for (let y = M.top + 1; y <= M.top + 7; y += 2) for (let x = side ? 14 : 12; x <= (side ? 17 : 19); x++) C.on(I.torso, x, y, VOID);
  // Beinwickel, Stiefelstulpe
  if (L.wraps) for (const pid of [I.legL, I.legR]) for (let y = 36 + C.dy; y <= 40 + C.dy; y++) for (let x = 0; x < C.w; x++) if (C.id[y * C.w + x] === pid && y % 2 === 0) C.col[y * C.w + x] = mix(C.col[y * C.w + x], '#8a7a5e', 0.25);
  for (const pid of [I.bootL, I.bootR]) { if (pid === undefined || !X.boots) continue; for (let x = 0; x < C.w; x++) { let y = 0; while (y < C.h && C.id[y * C.w + x] !== pid) y++; if (y < C.h) C.col[y * C.w + x] = mix(X.boots.b, '#9a8a6a', 0.35); } }
  // Köcher: Federn
  if (M.quiverTop) { const [qx, qy] = M.quiverTop; C.set(qx, qy - 1, '#c8bca0'); C.set(qx + 1, qy - 2, '#8a2a20'); C.set(qx - 1, qy - 2, '#c8bca0'); }
  // Rucksack vorn: Tragriemen
  if (L.pack && !back && !side) for (const x of [12, 19]) for (let y = M.top; y <= M.top + 9; y++) if (C.at(x, y) !== I.armL && C.at(x, y) !== I.armR) C.set(x, y, y % 3 ? L.leather.sh : L.leather.b);
  variants(C, L, M, view);
  endgame(C, L, M, view);
  for (const [x, y] of STUMPS) { C.set(x, y, '#6e1410'); C.set(x - 1, y, '#4a0c0a'); C.set(x, y + 1, '#8a1c14'); C.set(x + 1, y + 1, '#3a0a08'); }
}

// S14 (Nutzer: „nicht jeder mit gleich aussehender Rüstung“): Varianten je Person (L.vs 0–7), fest aus der Spec.
// Leder: beschlagen, geschnürt, gesteppt, schlicht; Platte: Grat mit Nieten, Bänder (Geschübe), gravierter Rand; Kette: Ringe
// oder Schuppen; Schulterstücke rund, geschichtet, mit Dornen (Kette, Tote); dazu Armschienen, Halsberge, Saumborte mit Knöpfen,
// Mantelschließe, Kapuzenborte, hochgekrempelte Ärmel bei Arbeitern.
function variants(C, L, M, view) {
  const I = M.ids, v = L.vs | 0, side = view === 'W', back = view === 'N', W = C.w;
  const each = (pid, fn) => { if (pid === undefined || pid < 0) return; for (let y = 0; y < C.h; y++) for (let x = 0; x < W; x++) if (C.id[y * W + x] === pid) fn(x - C.dx, y - C.dy, y * W + x); };
  const span = pid => { let x0 = 99, x1 = -1, y0 = 99, y1 = -1; each(pid, (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }); return [x0, x1, y0, y1]; };
  if (I.jerkin !== undefined) { const A = L.armorR, [x0, x1, y0, y1] = span(I.jerkin), k = v % 4;
    if (k === 0) each(I.jerkin, (x, y, i) => { if ((x - x0) % 3 === 1 && (y - y0) % 3 === 1) C.col[i] = mix(A.hi, '#d8c8a0', 0.4); });               // beschlagen
    else if (k === 1 && !side) for (let y = y0 + 1; y <= y1 - 1; y++) { const x = Math.round((x0 + x1) / 2) + (y % 2 ? 0 : -1); C.on(I.jerkin, x, y, mix(A.hi, '#c8b890', 0.3)); }   // geschnürt
    else if (k === 2) each(I.jerkin, (x, y, i) => { if ((y - y0) % 3 === 2) C.col[i] = mix(C.col[i], A.dk, 0.55); });                             // gesteppt
    else each(I.jerkin, (x, y, i) => { if (!side && y === y0 + 1 && x > x0 && x < x1) C.col[i] = mix(A.hi, A.b, 0.4); }); }                         // schlicht mit Kante
  if (I.plate !== undefined) { const A = L.armorR, [x0, x1, y0, y1] = span(I.plate), k = v % 3;
    if (k === 1) each(I.plate, (x, y, i) => { if ((y - y0) % 3 === 2) C.col[i] = A.dk; else if ((y - y0) % 3 === 0 && x < x1) C.col[i] = mix(C.col[i], A.hi, 0.4); });   // Geschübe
    else if (k === 2) each(I.plate, (x, y, i) => { const edge = x === x0 + 1 || x === x1 - 1 || y === y0 + 1; if (edge && x > x0 && x < x1) C.col[i] = mix(A.hi, '#e8d8a8', 0.3); }); }   // gravierter Rand
  if (L.armor === 'chain' && v % 2 && I.torso !== undefined) { const A = L.armorR;                                                            // Schuppen statt Ringe
    for (const pid of [I.torso, I.chainSkirt]) each(pid, (x, y, i) => { const r = ((x >> 1) + (y >> 1)) % 2; C.col[i] = y % 2 === 0 ? (r ? A.hi : A.b) : (r ? A.sh : A.b); }); }   // S15: Schuppen als Zweier-Cluster
  if (I.pauld) { const A = L.pauldR || L.armorR, k = (L.markCol === '#5a1a1c' || L.sp === 'skeleton' || v === 5) ? 2 : v % 3;
    for (const pid of I.pauld) { const [x0, x1, y0] = span(pid);
      if (k === 1) each(pid, (x, y, i) => { if ((y - y0) % 2 === 1) C.col[i] = A.dk; });                                                          // geschichtet
      else if (k === 2) for (let x = x0; x <= x1; x += 2) { C.set(x, y0 - 1, A.hi); if (x > x0 && x < x1) C.set(x, y0 - 2, A.b); } } }            // Dornen
  if (!back && M.arms && v % 3 === 0 && L.sp !== 'skeleton') for (const [pid, a] of M.arms) { if (a.length < 3) continue;                                                   // Armschienen
    const [ex, ey] = a[1], [hx, hy] = a[2], col = L.armor === 'plate' || L.armor === 'chain' ? L.metal : L.leather;
    each(pid, (x, y, i) => { const t = ((x + 0.5 - ex) * (hx - ex) + (y + 0.5 - ey) * (hy - ey)) / ((hx - ex) ** 2 + (hy - ey) ** 2 || 1); if (t > 0.35 && t < 0.8) C.col[i] = t < 0.45 ? col.hi : col.sh; }); }
  if (!back && !side && (L.armor === 'plate' || L.armor === 'chain') && v % 4 === 1 && I.head !== undefined) { const y = M.top - 1;                // Halsberge
    for (let x = 14; x <= 17; x++) C.set(x, y, x === 14 ? L.metal.hi : L.metal.b); }
  if (!L.armor && !L.robe && I.skirt !== undefined && v % 4 === 2) { const R = L.cloth, [x0, x1, , y1] = span(I.skirt);                         // Saumborte, Knopfleiste
    each(I.skirt, (x, y, i) => { if (y === y1 - 1) C.col[i] = mix(R.hi, R.b, 0.3); });
    if (!side && !back) for (let y = M.top + 2; y < M.waist; y += 2) C.on(I.torso, 16, y, y % 4 ? L.gold.sh : L.leather.dk); }
  if (L.cloak && !back && !side && I.mantle === undefined) C.set(16, M.top, L.gold.hi);
  if (L.star && !back) { const cx = side ? 14 + M.hx : 16, cy = M.top + 3, G = L.gold;                                  // Stern Omegas
    C.set(cx, cy, G.hi); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) C.set(cx + dx, cy + dy, G.b); if (!side) { C.set(cx - 1, cy - 1, G.dk); C.set(cx + 1, cy + 1, G.dk); } }
  if (L.charm && !back) { const cx = side ? 15 + M.hx : 18; C.set(cx, M.waist + 2, '#d8d0bc'); C.set(cx, M.waist + 3, '#a89e88'); C.set(cx + 1, M.waist + 2, '#0c0a08'); }   // Knochenamulett
  if (L.straw && I.mantle !== undefined) each(I.mantle, (x, y, i) => { if (x % 2 === 0) C.col[i] = mix(C.col[i], '#d0bc80', 0.3); else if ((x + y) % 3 === 0) C.col[i] = mix(C.col[i], '#1a140c', 0.35); });   // Strohhalme
  if ((M.X.hv || L.bare) && !back && M.arms && !L.armor && L.sp !== 'skeleton') for (const [pid, a] of M.arms) { if (a.length < 3) continue; const [ex, ey] = a[1], [hx, hy] = a[2];   // kräftig: Unterarm frei, Muskel im Licht
    each(pid, (x, y, i) => { const t = ((x + 0.5 - ex) * (hx - ex) + (y + 0.5 - ey) * (hy - ey)) / ((hx - ex) ** 2 + (hy - ey) ** 2 || 1); if (t > 0.05) C.col[i] = t < 0.2 ? L.cloth.hi : t < 0.55 ? L.skin.hi : L.skin.b; }); }                                                      // Mantelschließe
  if (I.hood !== undefined && v % 3 === 1 && !back) each(I.hood, (x, y, i) => { const n = [i - 1, i + 1, i + W, i - W].some(j => C.id[j] === I.face); if (n) C.col[i] = mix(L.hood.hi, L.hood.b, 0.2); });   // Kapuzenborte
  if (L.apron && !L.armor && M.arms && v % 2 === 0) for (const [pid, a] of M.arms) { if (a.length < 3) continue; const [ex, ey] = a[1], [hx, hy] = a[2];                      // hochgekrempelt
    each(pid, (x, y, i) => { const t = ((x + 0.5 - ex) * (hx - ex) + (y + 0.5 - ey) * (hy - ey)) / ((hx - ex) ** 2 + (hy - ey) ** 2 || 1); if (t > 0.1) C.col[i] = t < 0.25 ? L.cloth.hi : t < 0.6 ? L.skin.b : L.skin.sh; }); }
}

// Abnutzung (Referenz 3) und Blut — nur in Clustern und fest aus dem Hash
function endgame(C, L, M, view) {
  const I = M.ids, side = view === 'W', back = view === 'N', W = C.w, top = M.top, X = M.X;
  const each = (pid, fn) => { if (pid === undefined || pid < 0) return; for (let i = 0; i < C.col.length; i++) if (C.id[i] === pid) fn(i % W - C.dx, ((i / W) | 0) - C.dy, i); };
  // S14c geschichtete Platten (Nutzer: „mehrere überlappende Platten statt Hemd“): Lamellen auf Schultern und Bauchplatte, Mittelgrat vorn
  const lames = (pid, R0, from, step) => { if (pid === undefined || pid < 0 || !R0) return; let y0 = 99, y1 = -1; each(pid, (x, y) => { y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    each(pid, (x, y, i) => { const r = y - y0; if (r >= from && y < y1 && (r - from) % step === 0 && C.id[i - 1] === pid && C.id[i + 1] === pid) C.col[i] = R0.dk; }); };
  if (I.pauld && X.ab >= 1) for (const pid of I.pauld) lames(pid, L.pauldR || L.armorR, 2, 2);
  if (I.plate !== undefined && L.armorR) { lames(I.plate, L.armorR, 5, 2); if (!side && !back) each(I.plate, (x, y, i) => { if (x === 15 && y < top + 6) C.col[i] = L.armorR.hi; if (x === 16 && y < top + 6) C.col[i] = L.armorR.sh; }); }
  if (L.spk && I.pauld) for (const pid of I.pauld) { let x0 = 99, x1 = -1, y0 = 99; each(pid, (x, y) => { if (y < y0) y0 = y; if (x < x0) x0 = x; if (x > x1) x1 = x; });   // Dornen auf den Schultern
    const Pm = L.pauldR || L.armorR; for (let x = x0 + 1; x < x1; x += 2) { let yt = 99; each(pid, (xx, y) => { if (xx === x && y < yt) yt = y; }); if (yt < 99) { C.set(x, yt - 1, Pm.hi); C.set(x, yt - 2, Pm.b); if ((x - x0) % 4 === 1) C.set(x, yt - 3, Pm.hi); } } }
  if (I.fur !== undefined) each(I.fur, (x, y, i) => { const k = (x + (y >> 1)) % 3; if (k === 0) C.col[i] = mix(C.col[i], L.furR.hi, 0.35); else if (k === 2 && y % 2) C.col[i] = L.furR.dk; });   // S15: Fellsträhnen statt Schachbrett
  const chest = I.plate ?? I.jerkin ?? I.torso;
  if (L.rn && !back) { const R0 = L.rn, R1 = mix(L.rn, '#ffffff', 0.45), cx = side ? 15 + M.hx : 16;                   // Runen glimmen
    for (let y = top + 2; y <= top + 9; y++) C.on(chest, cx, y, y % 2 ? R0 : R1);
    if (!side) { C.on(chest, 13, top + 5, R0); C.on(chest, 14, top + 4, R1); C.on(chest, 18, top + 4, R1); C.on(chest, 19, top + 5, R0); }
    if (I.pauld) for (const pid of I.pauld) { let n = 0; each(pid, (x, y, i) => { if (n < 3 && (x + y) % 5 === 0) { C.col[i] = R0; n++; } }); } }
  if (L.core && !back && !side) { const c = L.core; for (const [x, y] of [[15, top + 4], [16, top + 4], [15, top + 5], [16, top + 5]]) C.set(x, y, c); C.set(15, top + 4, mix(c, '#ffffff', 0.6));   // Magitech-Kern
    for (const [x, y] of [[14, top + 4], [17, top + 4], [14, top + 5], [17, top + 5], [15, top + 3], [16, top + 3], [15, top + 6], [16, top + 6]]) C.set(x, y, L.gold.dk); }
  if (L.chn && !back) { const n = side ? 8 : 11; for (let i = 0; i <= n; i++) { const x = side ? 13 + M.hx + i * 0.5 : 11 - X.sh + i * (9 + X.sh + X.wa) / n, y = top + 1 + i; C.set(x, y, i % 2 ? '#8a8a86' : '#3a3a38'); } }   // Kette quer
  if (X.ab >= 3 && I.pauld && L.gold) for (const pid of I.pauld) { const low = new Map(); each(pid, (x, y) => { if (!low.has(x) || y > low.get(x)) low.set(x, y); });   // S15 P1: Goldkante unten an den Schulterplatten
    for (const [x, y] of low) { C.set(x, y, L.gold.b); if ((x & 1) === 0) C.set(x, y, L.gold.hi); } }
  if (X.ab >= 3 && I.tassets && L.gold) for (const pid of I.tassets) { const low = new Map(); each(pid, (x, y) => { if (!low.has(x) || y > low.get(x)) low.set(x, y); }); for (const [x, y] of low) C.set(x, y, L.gold.sh); }
  if (I.tassets) for (const pid of I.tassets) { let y0 = 99; each(pid, (x, y) => { if (y < y0) y0 = y; }); each(pid, (x, y, i) => { if ((y - y0) % 2 === 1) C.col[i] = mix(C.col[i], '#000000', 0.35); }); }   // Lamellen
  if ((L.kn || (X.ab >= 2 && L.armor === 'plate')) && M.limbs) for (const k of ['lleg', 'rleg']) { const p = M.limbs[k]; if (!p) continue; const [x, y] = p, Mt = L.armorR || L.metal; C.set(x - 1, y, Mt.hi); C.set(x, y, Mt.b); C.set(x + 1, y, Mt.sh); C.set(x, y - 1, Mt.hi); C.set(x, y + 1, Mt.dk); }   // Kniekacheln
  if (L.mark === 'star' && I.tabard !== undefined && !back) { const cx = side ? 14 + M.hx : 16, cy = top + 5, G = L.markR || L.gold;   // Omega-Stern auf dem Wappenrock
    C.on(I.tabard, cx, cy, G.hi); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) C.on(I.tabard, cx + dx, cy + dy, G.b); for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) C.on(I.tabard, cx + dx, cy + dy, G.sh); }
}
function wear(C, L, M) {
  const I = M.ids, w = L.wear | 0, bl = L.blood | 0, sd = (L.wseed | 0) * 97 + 13;
  const cloth = [I.skirt, I.torso, I.tabard, I.mantle].filter(v => v !== undefined && v >= 0);
  const pick = (pid, k) => { const px = []; for (let i = 0; i < C.col.length; i++) if (C.id[i] === pid) px.push(i); return px.length ? px[(hsh(k, sd) * px.length) | 0] : -1; };
  if (w >= 1) for (let k = 0; k < w * 2; k++) { const pid = cloth[k % cloth.length]; if (pid === undefined) break; const i = pick(pid, k + 3); if (i < 0) continue;
    for (const d of [0, 1]) if (C.id[i + d] === pid) C.col[i + d] = mix(C.col[i + d], '#0a0808', 0.28); }
  if (w >= 2 && I.skirt !== undefined) for (let x = 0; x < C.w; x += 2) {                   // zerrissener Saum: 2-px-Kerben
    if (hsh(x, sd) > (w - 1) * 0.3) continue; let y = C.h - 1; while (y >= 0 && C.id[y * C.w + x] !== I.skirt) y--; if (y < 0) continue;
    for (const d of [0, 1]) { const i = y * C.w + x + d; if (C.id[i] === I.skirt) { C.col[i] = null; C.id[i] = -1; } } }
  if (w >= 2 && I.torso !== undefined) { const i = pick(I.torso, 7); if (i >= 0) for (const d of [0, 1, C.w, C.w + 1]) if (C.id[i + d] === I.torso) C.col[i + d] = mix(C.col[i + d], '#7a6a4c', 0.35); }   // Flicken
  if (I.plate !== undefined || I.helm !== undefined) for (const pid of [I.plate, I.helm]) { if (pid === undefined || C.P[pid]?.mat !== 'metal') continue;
    for (let k = 0; k < 1 + w; k++) { const i = pick(pid, 20 + k); if (i >= 0) { C.col[i] = mix(C.col[i], '#6a3a1e', 0.5); if (C.id[i + C.w] === pid) C.col[i + C.w] = mix(C.col[i + C.w], '#5a2e18', 0.45); } } }
  if (bl) for (let s = 0; s < bl * 2; s++) { const pid = [I.torso, I.skirt, I.legL][s % 3]; if (pid === undefined) continue; const i = pick(pid, 40 + s); if (i < 0) continue;
    for (const d of [0, 1, C.w]) if (C.id[i + d] >= 0 && C.id[i + d] < 999) C.col[i + d] = d === C.w ? '#3a0a0a' : '#5e1010';
    if (C.id[i + 2 * C.w] >= 0 && C.id[i + 2 * C.w] < 999) C.col[i + 2 * C.w] = '#3a0a0a'; }
}

// ---- Rolle: Kugel (Umhang/Rock, Kopf eingezogen, Knie) — der Renderer dreht in 90°-Schritten ----
export function paintTuckR(L) {
  const C = new Px(20, 20), X = looks(L), body = C.part(L.cloak || X.coat, 'cloth'), leg = C.part(X.pants, 'cloth'), hd = C.part(L.hood || L.hair, 'cloth');
  C.ell(body, 10, 10, 7, 6.5); C.limb(leg, [[8, 13], [12, 15], [15, 12]], 3.5); C.ell(hd, 6, 7, 3, 3);
  C.shade(); C.outline(); return C.toG();
}

// ---- Tiere (Blick links; E gespiegelt). Aufbau wie Stil D (Rumpf, vier Beine mit Gelenken, Hals, Kopf, Schwanz), neu im Zielraster:
// Maße aus der Tabelle werden auf 1,25 Frame-Einheiten je Pixel umgerechnet, schattiert und konturiert wie die Menschen.
export const BRW = 48, BRH = 32, BROX = 24, BROY = 30;
const BEASTR = {
  wolf:     { body: [31, 21, 13, 6.2], fx: 22, hx: 40, leg: 16, lw: 3.4, head: [13, 15, 4.6, 3.8], snout: 5, neck: 1, tail: 'bushy', ear: 'point', mane: 1 },
  wild_dog: { body: [31, 22, 11.5, 5.2], fx: 23, hx: 39, leg: 15, lw: 2.8, head: [15, 16, 4, 3.4], snout: 8, neck: 1, tail: 'sickle', ear: 'flop', ribs: 1, spots: 1 },
  boar:     { body: [31, 22, 14, 8.2], fx: 21, hx: 41, leg: 10, lw: 4.2, head: [13, 22, 6, 5], snout: 4, neck: 0, tail: 'curl', ear: 'small', crest: 1, tusk: 1 },
  bear:     { body: [31, 19, 15, 9.5], fx: 21, hx: 41, leg: 13, lw: 5.6, head: [12, 19, 5.6, 4.8], snout: 5, neck: 0, tail: 'stub', ear: 'round', hump: 1 },
  horse:    { body: [33, 17, 12.5, 6.2], fx: 24, hx: 42, leg: 19, lw: 3.2, head: [12, 6, 3.4, 3.2], snout: 5, neck: 2, tail: 'long', ear: 'point', mane: 1, hoof: 1 },
  cow:      { body: [31, 19, 15, 7.5], fx: 21, hx: 41, leg: 12, lw: 4.2, head: [13, 18, 4.4, 4.2], snout: 7, neck: 0, tail: 'tuft', ear: 'side', boxy: 1, udder: 1, horns: 1, patches: 1, hoof: 1 },
  ox:       { body: [31, 19, 15.5, 8], fx: 21, hx: 41, leg: 12, lw: 4.6, head: [13, 18, 4.6, 4.4], snout: 7, neck: 0, tail: 'tuft', ear: 'side', boxy: 1, horns: 1, hump: 1, hoof: 1 },   // S14 Zugtiere
  mule:     { body: [32, 18, 11.5, 6], fx: 24, hx: 41, leg: 16, lw: 3, head: [13, 8, 3.4, 3.2], snout: 5, neck: 2, tail: 'long', ear: 'long', hoof: 1 },
  sheep:    { body: [31, 21, 12, 8], fx: 23, hx: 39, leg: 10, lw: 2.4, head: [16, 18, 3.4, 3.6], snout: 12, neck: 0, tail: 'stub', ear: 'side', wool: 1, darkLeg: 1, hoof: 1 },
  deer:     { body: [32, 18, 11, 5.4], fx: 25, hx: 39, leg: 19, lw: 2.4, head: [14, 11, 3.6, 3], snout: 8, neck: 2, tail: 'short', ear: 'long', antler: 1, rump: 1, hoof: 1 },
};
export function paintBeastR(type, pal, frame, act, ramp) {
  const T = BEASTR[type] || BEASTR.wolf, Cx = new Px(BRW, BRH), k = 0.8;           // Entwurf 60×40 → 48×32
  const C = { part: (...a) => Cx.part(...a), poly: (p, pts) => Cx.poly(p, pts.map(([x, y]) => [x * k, y * k])), ell: (p, x, y, rx, ry) => Cx.ell(p, x * k, y * k, rx * k, ry * k),
    limb: (p, pts, w0, w1) => Cx.limb(p, pts.map(([x, y]) => [x * k, y * k]), Math.max(1.6, w0 * k), Math.max(1.4, (w1 ?? w0) * k)) };
  const F = ramp(pal.body || '#5b5145'), D = ramp(pal.dark || '#3a332b'), eye = pal.eye || '#c8a545';
  const belly = ramp(mix(pal.body || '#5b5145', '#c8b89a', type === 'boar' ? 0.1 : 0.3));
  const s = act ? 0 : [1, 0, -1, 0][frame & 3], crouch = act === 'a1' ? 3 : 0, lunge = act === 'a2' ? -3 : 0, up = act === 'a2' ? -2 : 0;
  const LG = T.darkLeg ? ramp('#3a302a') : F, HD = T.darkLeg ? ramp('#4a3e34') : F, feet = [];   // Schaf: dunkle Beine und Gesicht
  const P = { tail: C.part(F, 'cloth', { grp: 't' }), legFF: C.part(dimR(LG, 0.3), 'cloth'), legHF: C.part(dimR(LG, 0.3), 'cloth'), udder: T.udder ? C.part(ramp('#c89a88'), 'skin') : -1, body: C.part(F, 'cloth', { grp: 'b' }),
    belly: C.part(belly, 'cloth', { grp: 'b' }), legFN: C.part(LG, 'cloth'), legHN: C.part(LG, 'cloth'), neck: C.part(F, 'cloth', { grp: 'b' }), head: C.part(HD, 'cloth', { grp: 'h' }),
    muzzle: C.part(ramp(T.darkLeg ? '#3a302a' : mix(pal.body || '#5b5145', '#d8c8b0', 0.45)), 'skin', { grp: 'h' }), horn: C.part(ramp('#d8ccb0'), 'bone'),
    mane: C.part(D, 'cloth'), ear: C.part(D, 'cloth'), antler: C.part(ramp('#c9b28a'), 'bone') };
  const [bx, by, brx, bry] = T.body, cy = by + crouch + up, cx = bx + lunge, ground = 37, L0 = T.leg;
  const leg = (pid, hipX, dx, lift, hind) => {
    const hy = Math.min(cy + bry * 0.4, ground - L0 + 2), fx = hipX + dx + lunge, fy = ground - lift;
    const kx = hind ? (hipX + fx) / 2 + 3 : (hipX + fx) / 2 - 1, ky = (hy + fy) / 2 + (hind ? -1 : 1);
    C.limb(pid, [[hipX + lunge, hy], [kx, ky], [fx, fy]], T.lw * 1.25, T.lw * 0.8); C.ell(pid, fx - 1, fy, T.lw * 0.7, 1.3); feet.push([fx - 1, fy]);
  };
  leg(P.legFF, T.fx + 3, -s * 4, s < 0 ? 2 : 0, false); leg(P.legHF, T.hx - 3, s * 4, s > 0 ? 2 : 0, true);
  const tx = cx + brx - 1, ty = cy - bry * 0.4;
  if (T.tail === 'bushy') C.limb(P.tail, [[tx, ty], [tx + 6, ty + 3 - s], [tx + 11, ty + 9 - s]], 4, 3);
  else if (T.tail === 'sickle') C.limb(P.tail, [[tx, ty], [tx + 5, ty - 4], [tx + 4, ty - 8 + s]], 2, 1.6);
  else if (T.tail === 'curl') C.limb(P.tail, [[tx, ty + 1], [tx + 3, ty - 1], [tx + 2, ty - 3]], 1.6, 1.4);
  else if (T.tail === 'long') { C.limb(P.tail, [[tx, ty - 1], [tx + 4, ty + 3 - s], [tx + 6, ty + 12 - s], [tx + 5, ty + 18 - s]], 4.5, 3); }
  else if (T.tail === 'tuft') { C.limb(P.tail, [[tx, ty], [tx + 2, ty + 6], [tx + 2, ty + 13]], 1.5, 1.4); C.ell(P.mane, tx + 2, ty + 14, 1.8, 2.2); }
  else C.ell(P.tail, tx + 2, ty, 2.2, 1.8);
  C.ell(P.body, cx, cy, brx, bry);
  if (T.boxy) C.poly(P.body, [[cx - brx + 2, cy - bry + 0.5], [cx + brx - 1, cy - bry + 1.5], [cx + brx, cy + bry - 1], [cx - brx + 1, cy + bry - 0.5]]);   // Kuh: gerader Rücken, kantige Hüfte
  if (T.wool) for (let i = 0; i < 9; i++) { const a = Math.PI * (0.95 + i * 0.13); C.ell(P.body, cx + Math.cos(a) * brx * 0.92, cy + Math.sin(a) * bry * 0.85, 3.2, 3); }   // Schaf: Wollbausch
  if (T.udder) C.ell(P.udder, cx + 5, cy + bry + 0.5, 3.2, 2.4);
  if (T.hump) C.ell(P.body, cx - 5, cy - bry * 0.55, brx * 0.55, bry * 0.6);
  C.ell(P.belly, cx - 2, cy + bry * 0.55, brx * 0.7, bry * 0.4);
  leg(P.legFN, T.fx, s * 4, s > 0 ? 2 : 0, false); leg(P.legHN, T.hx, -s * 4, s < 0 ? 2 : 0, true);
  let [hx, hy, hrx, hry] = T.head; hx += lunge * 1.5; hy += crouch * (type === 'wolf' || type === 'wild_dog' ? 1.6 : 1) + up;
  if (type === 'horse') C.limb(P.neck, [[cx - brx * 0.55, cy - bry * 0.1], [cx - brx * 0.85, cy - bry - 3], [hx + 3, hy + 1.5]], 7, 4.5);
  else if (T.neck) C.limb(P.neck, [[cx - brx * 0.6, cy - bry * 0.3], [hx + 3, hy + 1]], T.neck === 2 ? 4 : bry * 1.2, T.neck === 2 ? 3.2 : 5);
  C.ell(P.head, hx, hy, hrx, hry);
  const sn = T.snout + lunge * 1.5;
  C.poly(P.head, [[hx - hrx * 0.5, hy - hry * 0.5], [sn, hy + (type === 'boar' ? 1 : 0)], [sn, hy + hry * 0.7], [hx - hrx * 0.3, hy + hry * 0.8]]);
  if (act === 'a2' && type !== 'deer') C.poly(P.head, [[sn + 1, hy + hry * 0.7], [hx - 2, hy + hry], [sn + 2, hy + hry + 2.5]]);
  if (T.hoof || type === 'boar') C.ell(P.muzzle, sn + 1.5, hy + hry * 0.3, type === 'horse' ? 2.4 : 2.8, hry * 0.62);          // helles Maul / Rüsselscheibe
  if (T.horns) { C.limb(P.horn, [[hx + 1, hy - hry + 1], [hx - 1, hy - hry - 2], [hx - 3, hy - hry - 2.5]], 1.6, 1.2); C.limb(P.horn, [[hx + 3, hy - hry + 1], [hx + 4, hy - hry - 2], [hx + 6, hy - hry - 2.5]], 1.4, 1.1); }
  if (T.ear === 'point') C.poly(P.ear, [[hx - 1, hy - hry + 1], [hx + 1, hy - hry - 4], [hx + 3, hy - hry + 1]]);
  else if (T.ear === 'flop') C.poly(P.ear, [[hx + 1, hy - hry + 1], [hx + 4, hy - hry], [hx + 5, hy + 1], [hx + 3, hy + 2]]);
  else if (T.ear === 'long') C.poly(P.ear, [[hx + 1, hy - hry + 1], [hx + 6, hy - hry - 2], [hx + 3, hy - hry + 2]]);
  else if (T.ear === 'round') C.ell(P.ear, hx + 2, hy - hry + 0.5, 1.8, 1.6);
  else if (T.ear === 'side') C.poly(P.ear, [[hx + 2, hy - hry + 2], [hx + 7, hy - hry + 1], [hx + 6, hy - hry + 3.5], [hx + 2, hy - hry + 4]]);
  else C.poly(P.ear, [[hx, hy - hry + 1], [hx + 2, hy - hry - 2], [hx + 3, hy - hry + 1]]);
  if (T.mane && type === 'horse') C.limb(P.mane, [[hx + 4, hy - 2], [cx - brx * 0.85 + 2, cy - bry - 4], [cx - brx * 0.4, cy - bry + 1]], 3, 2.4);   // Mähne auf dem Hals
  else if (T.mane) C.poly(P.mane, [[hx + 3, hy - 2], [hx + 7, hy - 3], [cx - brx * 0.5, cy - bry - 1], [cx - brx * 0.2, cy - bry + 1], [hx + 6, hy + 3]]);
  if (T.crest) for (let i = 0; i < 5; i++) C.poly(P.mane, [[cx - 9 + i * 4, cy - bry + 1], [cx - 8 + i * 4, cy - bry - 2 - (i % 2)], [cx - 6 + i * 4, cy - bry + 1]]);
  if (T.antler) { const ax = hx + 1, ay = hy - hry; C.limb(P.antler, [[ax, ay], [ax + 1, ay - 5], [ax - 2, ay - 9]], 1.5, 1.3); C.limb(P.antler, [[ax + 1, ay - 5], [ax + 4, ay - 8]], 1.3, 1.3); }
  Cx.shade();
  const set = (x, y, c) => Cx.set(x * k, y * k, c);
  set(hx - hrx * 0.35, hy - 1, eye);
  set(sn, hy + (type === 'boar' ? 1 : 0), '#0d0b0a');
  if (T.tusk) { set(sn + 3, hy + hry * 0.6, '#e0d6bc'); set(sn + 3, hy + hry * 0.6 - 1.4, '#e0d6bc'); }
  if (act === 'a2' && type !== 'deer') for (let i = 0; i < 3; i++) set(sn + 1.5 + i * 2.2, hy + hry * 0.7 + 1.2, i % 2 ? '#0d0b0a' : '#e0d6bc');
  if (T.ribs) for (const x of [-3, 1]) set(cx + x, cy - 0.5, F.sh);
  if (T.spots) for (const [dx, dy] of [[-5, -3], [4, -2], [7, 1]]) { set(cx + dx, cy + dy, D.b); set(cx + dx + 1.3, cy + dy, D.b); }
  if (T.wool) for (let i = 0; i < 14; i++) { const x = cx - brx + 2 + (i % 7) * brx * 0.3, y = cy - bry * 0.4 + (i / 7 | 0) * bry * 0.8; set(x, y, F.hi); set(x + 1.3, y + 1.2, F.sh); }   // Locken
  if (T.hoof) for (const [fx, fy] of feet) { set(fx - 1, fy + 1, '#141010'); set(fx + 0.3, fy + 1, '#141010'); set(fx + 1.4, fy + 1, '#141010'); }   // Hufe
  if (T.patches) for (const [dx, dy, r] of [[-6, -3, 3.2], [5, -1, 2.6], [1, 3, 2.2], [9, -4, 1.8]]) for (let y = -r; y <= r; y += 1.25) for (let x = -r * 1.3; x <= r * 1.3; x += 1.25) if ((x / 1.3) ** 2 + y ** 2 <= r * r && Cx.at(Math.floor((cx + dx + x) * k), Math.floor((cy + dy + y) * k)) === P.body) set(cx + dx + x, cy + dy + y, x + y < 0 ? '#ece4d4' : '#c8c0b0');   // Kuh: weiße Flecken
  if (type === 'horse') { for (let y = hy - 1; y <= hy + 2; y += 1.25) set(hx - 1, y, '#e8e0d0'); }                                   // Blesse
  if (T.rump) for (let y = -2; y <= 2; y += 1.3) set(cx + brx - 1.5, cy + y, '#e0d4bc');
  if (type === 'wolf') for (let i = 0; i < 4; i++) set(cx - 6 + i * 4, cy - bry + 1.3, F.hi);
  Cx.outline(); return Cx.toG();
}
