// Figuren-Grundlage v2 (Session 9, Nutzer: „Figuren wirken wie Graveyard Keeper — Formensprache der Referenz übernehmen“).
// Referenz: grimdarke Kapuzenfiguren — schwerer Körper, breite Schultern, kleiner Kopf unter der Kapuze (~5 Köpfe hoch),
// große Hände, dicke Beine, breiter Stand; Schichten: Kapuze → Capelet → Mantel mit zerfetztem Saum → Gurte/Gürtel →
// gewickelte Unterarme, Handschuhe → Stiefel mit Riemen. Sehr dunkle Grundwerte, wenige Akzente, dunkle Kontur.
//
// Technik: Körperteile sind Formen (Vielecke) auf einem 40×56-Raster (1 Welt-Einheit je Pixel = doppelte Auflösung des
// alten 20×25-Rasters). Jedes Teil wird mit eigenem Volumen schattiert (Licht oben links, Formschatten rechts), wirft
// Schlagschatten auf Teile dahinter; danach Kontur und handgesetzte Details. Noch nicht im Spiel verdrahtet —
// erst die Grundlage gegen die Referenz prüfen (Nutzervorgabe), dann übertragen.
import { ramp, mix, toCanvas } from './sprites.js?v=26';

export const FW = 40, FH = 66, FPX = 1, FOX = 20, FOY = 57;   // Rastergröße, Welt je Pixel, Pivot (Fußmitte)
// Proportion (Nutzer: „noch etwas weird“): Formen werden im Entwurfsmaß (Füße bei y 53) gezeichnet und beim Rastern
// verzerrt — Figur 7 % schmaler, alles unterhalb des Rocksaums (y ≥ 39) 4 px tiefer → längere Beine, Verhältnis
// Schulterbreite : Höhe ≈ 0,48 wie in der Referenz.
// Stilparameter (Session 9, Nutzer: „Figuren sehen weird aus → 5 Stile zeigen“): Breite, Beinlänge, Kopf-/Kapuzengröße
// (um den Hals skaliert), Rumpfbreite. Standard = bisheriger Stand.
export const FIG = { narrow: 0.98, leg: 5, head: 0.9, torso: 1.06 };   // S12 (Nutzer: „schwerer, glaubwürdiger“): breiterer Rumpf, kräftigere Schultern; Kopf bleibt klein
const warpP = (x, y) => {
  let X = x, Y = y;
  if (y < 17.5) { X = 20 + (x - 20) * FIG.head; Y = 17.5 - (17.5 - y) * FIG.head; } else if (y < 38) X = 20 + (x - 20) * FIG.torso;
  return [20 + (X - 20) * FIG.narrow, Y >= 39 ? Y + FIG.leg : Y > 36 ? Y + (Y - 36) * FIG.leg / 3 : Y];
};
const warpX = x => 20 + (x - 20) * FIG.narrow;
const OUT = '#0b0907';

// ---- Raster mit Teil-IDs (Tiefe = Zeichenreihenfolge) ----
class Canvas2 {
  constructor(w = FW, h = FH, warp = false) { this.warp = warp; this.W = w; this.H = h; this.id = new Int16Array(w * h).fill(-1); this.parts = []; this.col = new Array(w * h).fill(null); }
  part(name, color) { this.parts.push({ name, R: ramp(color) }); return this.parts.length - 1; }
  partR(name, R, lie = false) { this.parts.push({ name, R, lie }); return this.parts.length - 1; }   // lie: liegendes Teil (Klinge) → Licht von oben quer   // Teil mit fertiger Rampe (aus dem Spec)
  limb(pid, pts, w0, w1) {                                    // Gliedmaße: Segmente mit Dicke w0 → w1, runde Gelenke
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], t0 = i / (pts.length - 1), t1 = (i + 1) / (pts.length - 1);
      const wa = (w0 + (w1 - w0) * t0) / 2, wb = (w0 + (w1 - w0) * t1) / 2, l = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / l, ny = (bx - ax) / l;
      this.poly(pid, [[ax + nx * wa, ay + ny * wa], [bx + nx * wb, by + ny * wb], [bx - nx * wb, by - ny * wb], [ax - nx * wa, ay - ny * wa]]);
      if (i + 1 < pts.length - 1) this.ell(pid, bx, by, wb, wb);
    }
  }
  poly(pid, pts) {                                            // Scanline-Füllung (Pixelmitte im Vieleck), keine Kantenglättung
    if (this.warp) pts = pts.map(([x, y]) => warpP(x, y));
    let y0 = this.H, y1 = 0; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(this.H - 1, Math.ceil(y1)); y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc) !== (by <= yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++)
        if (x >= 0 && x < this.W) this.id[y * this.W + x] = pid;
    }
  }
  ell(pid, cx, cy, rx, ry) { if (this.warp) { const k = (cy < 17.5 ? FIG.head : cy < 38 ? FIG.torso : 1); [cx, cy] = warpP(cx, cy); rx *= FIG.narrow * k; ry *= cy < 17.5 ? FIG.head : 1; } for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
    if (x >= 0 && y >= 0 && x < this.W && y < this.H && ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) this.id[y * this.W + x] = pid; }
  at(x, y) { return x < 0 || y < 0 || x >= this.W || y >= this.H ? -1 : this.id[y * this.W + x]; }
  // Volumen: je Teil und Zeile Spanne bestimmen → Licht links/oben, Formschatten rechts; Schlagschatten unter/rechts
  // von Teilen, die davor liegen (höhere ID); Kantenlicht, wo das Teil oben/links an Leere oder ein hinteres Teil grenzt.
  shade() {
    const span = new Map();
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) { const p = this.id[y * this.W + x]; if (p < 0) continue;
      const k = p * this.H + y, s = span.get(k); if (!s) span.set(k, [x, x]); else s[1] = x; }
    const cspan = new Map();                                    // Spalten-Spanne für liegende Teile
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) { const p = this.id[y * this.W + x]; if (p < 0 || !this.parts[p]?.lie) continue;
      const k = p * this.W + x, s = cspan.get(k); if (!s) cspan.set(k, [y, y]); else s[1] = y; }
    const vspan = this.parts.map(() => [this.H, 0]);
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) { const p = this.id[y * this.W + x]; if (p >= 0) { vspan[p][0] = Math.min(vspan[p][0], y); vspan[p][1] = Math.max(vspan[p][1], y); } }
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) {
      const p = this.id[y * this.W + x]; if (p < 0) continue;
      const R = this.parts[p].R, [a, b] = span.get(p * this.H + y), t = b > a ? (x - a) / (b - a) : 0.5;
      const [v0, v1] = vspan[p], tv = v1 > v0 ? (y - v0) / (v1 - v0) : 0.5;
      let c = t > 0.9 && b - a > 6 ? R.dk : t > 0.68 ? R.sh : t < 0.2 && tv < 0.75 ? mix(R.b, R.hi, 0.35) : R.b;
      if (tv > 0.88 && t > 0.35) c = R.sh;                                       // Unterkante der Form
      if (this.parts[p].lie) { const [c0, c1] = cspan.get(p * this.W + x), tc = c1 > c0 ? (y - c0) / (c1 - c0) : 0.5;   // quer: oben hell, unten dunkel
        c = tc > 0.7 ? R.sh : tc < 0.3 ? mix(R.b, R.hi, 0.5) : R.b; if (c1 - c0 >= 4 && tc > 0.9) c = R.dk; }
      const up = this.at(x, y - 1), lf = this.at(x - 1, y);
      const rim = ((up < 0 || (up < p && up !== 999)) || (lf < 0 && t < 0.3)) && t < 0.6;
      if (rim) c = mix(R.hi, '#e6d6b4', 0.12);                                   // Kantenlicht oben links (Silhouette + über hinteren Teilen)
      else {                                                                      // selektive Innenkontur: vorderes Teil gegen hinteres
        const rt = this.at(x + 1, y), dn = this.at(x, y + 1);
        if ((rt >= 0 && rt < p) || (dn >= 0 && dn < p) || (lf >= 0 && lf < p)) c = mix(c, '#0a0808', 0.5);
      }
      let occ = 0;                                                                // Schlagschatten/Trennung: Teil davor grenzt an
      for (const [dx, dy, k] of [[0, -1, 0.55], [0, -2, 0.3], [-1, 0, 0.35], [1, 0, 0.45], [-1, -1, 0.3], [1, -1, 0.35]]) { const q = this.at(x + dx, y + dy);
        if (q > p && q !== 999) occ = Math.max(occ, k); }
      if (occ) c = mix(c, '#0a0808', occ);
      this.col[y * this.W + x] = c;
    }
  }
  setOn(pid, x, y, c) {                                       // nur auf Pixel eines Teils (Gesichtsschatten bleibt im Kopf)
    if (!c) return; let X = x, Y = y; if (this.warp) { const [wx, wy] = warpP(x + 0.5, y + 0.5); X = Math.round(wx - 0.5); Y = Math.round(wy - 0.5); }
    if (X >= 0 && Y >= 0 && X < this.W && Y < this.H && this.id[Y * this.W + X] === pid) this.col[Y * this.W + X] = c; }
  set(x, y, c) { if (this.warp) { const [wx, wy] = warpP(x + 0.5, y + 0.5); x = Math.round(wx - 0.5); y = Math.round(wy - 0.5); } if (x >= 0 && y >= 0 && x < this.W && y < this.H && c) { this.col[y * this.W + x] = c; if (this.id[y * this.W + x] < 0) this.id[y * this.W + x] = 999; } }
  toG() {                                                     // → Pixel-Array mit Außenkontur (Innenkanten trennt die Schattierung)
    const g = { w: this.W, h: this.H, a: this.col.slice(), at: (x, y) => x < 0 || y < 0 || x >= this.W || y >= this.H ? null : this.col[y * this.W + x] };
    return g;
  }
}
const h = (a, b) => { let n = (a * 374761393 + b * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
// zerfetzter Saum: Punkte entlang y von xa nach xb, Zacken 1–4 px nach unten, fest aus dem Hash (kein Flackern)
const h2 = h;                                                    // Hash-Alias (in paintWeapon2 ist h die Höhe)
function hem(xa, xb, y, seed, depth = 4) {
  const pts = [], n = Math.max(2, Math.round(Math.abs(xb - xa) / 2.2));
  for (let i = 0; i <= n; i++) { const x = xa + (xb - xa) * i / n; pts.push([x, y + (i % 2 ? Math.round(1 + h(i, seed) * depth) : Math.round(h(seed, i) * 1.2))]); }
  return pts;
}

// ---- Die Grundlage: Kapuzen-Wanderer (Referenz oben links), Vorderansicht ----
// look: Farben (Referenzwerte); pose 'i0'/'i1' (Atem), weitere Posen folgen erst nach Freigabe der Grundlage.
export const WANDERER = {
  hood: '#2c231d', cloak: '#1f1915', coat: '#4a3829', mantle: '#2e241d', leather: '#5e4630', strap: '#735a3c', metal: '#9a8a64',
  pants: '#302822', boots: '#1d1712', wrap: '#86765e', glove: '#2a2019', skin: '#120e0c', eye: '#d6ae5e', accent: '',
};
// Normaler Gegner: Straßenbandit — Kapuze, rotes Halstuch vor dem Gesicht (Referenz 3. Reihe), Lederwams, kein Capelet
export const BANDIT = { ...WANDERER, hood: '#352a20', cloak: '', coat: '#56402c', mantle: '', leather: '#6a4c32', scarf: '#7a2a20',
  pants: '#3a3028', eye: '#a8573c', face: 'dark', hem: 34, wrap: '#7a6a54' };
// Elitegegner: Grabwächter — Schädel unter der Kapuze, Kettenhemd, Schulterstücke, blutroter Wappenrock (Referenz oben Mitte)
export const WARDEN = { ...WANDERER, hood: '#1f1f22', cloak: '#1a1719', coat: '#2c2a2c', mantle: '#5a1f1a', skin: '#a89f8a', eye: '#7fe0c0',
  face: 'skull', armor: 'chain', metal: '#76767a', pauldrons: '#6a6c70', tabard: '#6e2420', leather: '#3a2a20', glove: '#3a3a3c', boots: '#1b1a1c' };
// Pestdoktor/Kultist-Variante für die Probe der Formenvielfalt (Schnabelmaske)
export const PLAGUE = { ...WANDERER, hood: '#1c1c20', coat: '#262428', cloak: '#161418', mantle: '#2a2a30', skin: '#6e685e', eye: '#9c3b30', face: 'beak', leather: '#4a3a2c' };
export function paintFigureFront(look = WANDERER, pose = 'i0') {
  const C = new Canvas2(FW, FH, true), b = pose === 'i1' ? 1 : 0;   // Atem: Oberkörper 1 px tiefer
  const P = {
    cloak: C.part('cloak', look.cloak || '#000'), legL: C.part('legL', look.pants), legR: C.part('legR', mix(look.pants, '#000', 0.15)),
    bootL: C.part('bootL', look.boots), bootR: C.part('bootR', look.boots), coat: C.part('coat', look.coat),
    armR: C.part('armR', mix(look.coat, '#000', 0.12)), gloveR: C.part('gloveR', look.glove), armL: C.part('armL', look.coat), gloveL: C.part('gloveL', look.glove),
    tabard: look.tabard ? C.part('tabard', look.tabard) : -1, plate: look.armor === 'plate' ? C.part('plate', look.metal) : -1,
    belt: C.part('belt', look.leather), mantle: look.mantle ? C.part('mantle', look.mantle) : -1,
    pauldL: look.pauldrons ? C.part('pauldL', look.pauldrons) : -1, pauldR: look.pauldrons ? C.part('pauldR', mix(look.pauldrons, '#000', 0.15)) : -1,
    hood: look.hood ? C.part('hood', look.hood) : -1, face: C.part('face', look.skin), scarf: look.scarf ? C.part('scarf', look.scarf) : -1,
  };
  // Umhang hinten: nur außerhalb des Körpers sichtbar, endet über den Stiefeln (Beinlücke bleibt frei)
  if (look.cloak) C.poly(P.cloak, [[12, 17 + b], [28, 17 + b], [31, 30], [32, 41], ...hem(32, 8, 41, 11, 5).slice(1, -1), [8, 41], [9, 30]]);
  // Beine: kräftig, mit Lücke; Hose bis in den Stiefelschaft
  C.poly(P.legL, [[13, 37], [19, 37], [18, 47], [13, 47]]);
  C.poly(P.legR, [[21, 37], [27, 37], [27, 47], [22, 47]]);
  C.poly(P.bootL, [[12, 46], [19, 46], [19, 53], [9, 53], [10, 50], [12, 49]]);
  C.poly(P.bootR, [[21, 46], [28, 46], [28, 49], [30, 50], [31, 53], [21, 53]]);
  // Mantel: breite Brust, schmale Taille, Rock mit Fetzensaum
  const hm = look.hem ?? 39;                                      // Saumhöhe: Mantel (39) oder kurzer Wams (34)
  C.poly(P.coat, [[13, 17 + b], [27, 17 + b], [28, 22 + b], [26, 29 + b], [28, Math.min(34, hm - 1)], [hm > 36 ? 30 : 28, hm], ...hem(hm > 36 ? 30 : 28, hm > 36 ? 10 : 12, hm, 5, hm > 36 ? 4 : 2).slice(1, -1), [hm > 36 ? 10 : 12, hm], [12, Math.min(34, hm - 1)], [14, 29 + b], [12, 22 + b]]);
  // Arme: vom Körper abgesetzt (Lücke), Unterarm nach außen, große Hände
  C.poly(P.armL, [[13, 17 + b], [9, 18 + b], [7, 25 + b], [6, 34 + b], [9, 34 + b], [10, 26 + b], [12, 22 + b]]);
  C.poly(P.armR, [[27, 17 + b], [31, 18 + b], [33, 25 + b], [34, 34 + b], [31, 34 + b], [30, 26 + b], [28, 22 + b]]);
  C.ell(P.gloveL, 7.5, 36 + b, 2.7, 2.9); C.ell(P.gloveR, 32.5, 36 + b, 2.7, 2.9);
  // Wappenrock (Elite/Orden): Bahn von der Brust bis unter den Saum, zerfetzt
  if (P.tabard >= 0) C.poly(P.tabard, [[17, 20 + b], [23, 20 + b], [24, 38], ...hem(24, 16, 41, 17, 3).slice(1, -1), [16, 38]]);
  // Brustplatte (Platte): gewölbt, sitzt auf dem Wams
  if (P.plate >= 0) C.poly(P.plate, [[14, 18 + b], [26, 18 + b], [26, 24 + b], [24, 28 + b], [16, 28 + b], [14, 24 + b]]);
  // Gürtel + schräger Riemen (kein Riemen über Platte/Wappenrock)
  C.poly(P.belt, [[13, 28 + b], [27, 28 + b], [27, 31 + b], [13, 31 + b]]);
  if (P.plate < 0 && P.tabard < 0) C.poly(P.belt, [[14, 18 + b], [16, 17 + b], [26, 28 + b], [24, 28 + b]]);
  // Capelet: kurz, über den Schultern, gezackter Rand
  if (P.mantle >= 0) C.poly(P.mantle, [[15, 14 + b], [25, 14 + b], [30, 17 + b], [31, 20 + b], ...hem(31, 9, 20 + b, 3, 2).slice(1, -1), [9, 20 + b], [10, 17 + b]]);
  // Schulterstücke (Metall): gewölbte Kappen, überragen die Schulterlinie → schwerere Silhouette
  if (P.pauldL >= 0) { C.poly(P.pauldL, [[14, 16 + b], [9, 16 + b], [6, 19 + b], [6, 22 + b], [9, 23 + b], [13, 21 + b]]);
    C.poly(P.pauldR, [[26, 16 + b], [31, 16 + b], [34, 19 + b], [34, 22 + b], [31, 23 + b], [27, 21 + b]]); }
  // Kapuze: klein, Spitze oben, fällt auf die Schultern; Öffnung spitz gewölbt. Ohne Kapuze: Kopf mit Maske
  if (P.hood >= 0) C.poly(P.hood, [[20, 4 + b], [23, 6 + b], [26, 10 + b], [26, 14 + b], [27, 17 + b], [13, 17 + b], [14, 14 + b], [14, 10 + b], [17, 6 + b]]);
  if (look.face === 'skull' || look.face === 'beak') C.poly(P.face, [[20, 8 + b], [23, 10 + b], [24, 13 + b], [22, 17 + b], [18, 17 + b], [16, 13 + b], [17, 10 + b]]);
  else C.poly(P.face, [[20, 8 + b], [23, 11 + b], [23, 14 + b], [21, 16 + b], [19, 16 + b], [17, 14 + b], [17, 11 + b]]);
  if (look.face === 'beak') C.poly(P.face, [[19, 13 + b], [21, 13 + b], [21, 19 + b], [20, 21 + b], [19, 19 + b]]);      // Pestmaske: Schnabel über die Brust
  // Schal über Mund und Nase (Bandit), Ende hängt über die Schulter
  if (P.scarf >= 0) { C.poly(P.scarf, [[16, 13 + b], [24, 13 + b], [25, 16 + b], [24, 18 + b], [16, 18 + b], [15, 16 + b]]);
    C.poly(P.scarf, [[23, 17 + b], [26, 17 + b], [27, 24 + b], ...hem(27, 23, 24 + b, 21, 2).slice(1, -1), [23, 23 + b]]); }
  C.shade();
  // ---- Details (handgesetzt, Referenz: Schnallen, Nähte, Wickel, Fetzen, Augen) ----
  const Lh = ramp(look.hood || look.coat), Lc = ramp(look.coat), Ll = ramp(look.leather), Ls = ramp(look.strap), Lm = ramp(look.metal), Lw = ramp(look.wrap), Lb = ramp(look.boots);
  if (look.face === 'skull') {                                                               // Schädel: Augenhöhlen mit Glimmen, Nasenloch, Zahnreihe
    const B = ramp(look.skin);
    for (const [x, y] of [[17, 11], [18, 11], [22, 11], [23, 11], [17, 12], [18, 12], [22, 12], [23, 12]]) C.set(x, y + b, '#0b0908');
    C.set(18, 12 + b, look.eye); C.set(22, 12 + b, mix(look.eye, '#000', 0.25)); C.set(20, 14 + b, '#0b0908');
    for (let x = 18; x <= 22; x++) C.set(x, 16 + b, x % 2 ? B.sh : '#0b0908'); C.set(19, 9 + b, B.hi); C.set(18, 10 + b, B.hi);
  } else if (look.face === 'beak') {                                                          // Pestmaske: runde Gläser, Nähte am Schnabel
    const B = ramp(look.skin);
    for (const [x, y] of [[17, 11], [18, 11], [17, 12], [18, 12], [22, 11], [23, 11], [22, 12], [23, 12]]) C.set(x, y + b, B.dk);
    C.set(17, 11 + b, look.eye); C.set(22, 11 + b, mix(look.eye, '#000', 0.2)); C.set(20, 15 + b, B.hi); C.set(20, 17 + b, B.sh); C.set(19, 19 + b, B.hi);
  } else {
    C.set(18, 12 + b, look.eye); C.set(22, 12 + b, mix(look.eye, '#000', 0.3));               // Augen glimmen im Dunkel der Kapuze
    C.set(19, 12 + b, mix(look.eye, '#000', 0.7));
  }
  if (look.armor === 'chain') for (let y = 18 + b; y <= 38; y++) for (let x = 11; x <= 29; x++) {   // Kettenhemd: Ringmuster, wo Wams sichtbar ist
    const i = C.id[y * FW + x]; if (i !== P.coat && i !== P.armL && i !== P.armR) continue;
    const M = ramp(look.metal), cur = C.col[y * FW + x], dark = cur === ramp(look.coat).sh || cur === ramp(look.coat).dk;
    C.set(x, y, y % 2 ? M.dk : ((x + (y >> 1)) % 2 ? (dark ? M.sh : mix(M.b, M.sh, 0.4)) : mix(M.dk, M.sh, 0.5)));
  }
  if (P.plate >= 0) { const M = ramp(look.metal); for (let y = 19 + b; y <= 26 + b; y++) C.set(20, y, M.hi); C.set(15, 19 + b, M.hi); for (let x = 16; x <= 24; x++) C.set(x, 24 + b, M.dk); }
  if (P.pauldL >= 0) { const M = ramp(look.pauldrons); C.set(8, 18 + b, M.hi); C.set(9, 17 + b, M.hi); C.set(10, 17 + b, M.hi); for (let x = 7; x <= 12; x++) C.set(x, 20 + b, M.dk); for (let x = 28; x <= 33; x++) C.set(x, 20 + b, M.dk); }
  if (P.scarf >= 0) { const Sc = ramp(look.scarf); for (let x = 16; x <= 24; x += 2) C.set(x, 15 + b, Sc.sh); C.set(16, 13 + b, Sc.hi); C.set(17, 13 + b, Sc.hi); }
  if (P.hood >= 0) { for (let y = 5 + b; y <= 8 + b; y++) C.set(20, y, Lh.sh);                  // Kapuzennaht
    C.set(19, 5 + b, Lh.hi); C.set(17, 7 + b, Lh.hi); C.set(15, 10 + b, Lh.hi); }
  for (let y = 31; y <= (look.hem ?? 39); y++) C.set(20, y + (y < 32 ? b : 0), Lc.dk);            // Mantelschlitz unter dem Gürtel
  if ((look.hem ?? 39) > 36) for (const [x, y] of [[16, 34], [16, 35], [24, 35], [24, 36], [13, 37], [27, 36]]) C.set(x, y, Lc.sh);   // Falten im Rock
  else { const Lw2 = ramp(look.wrap); for (const [x0, x1] of [[13, 18], [22, 27]]) for (let x = x0; x <= x1; x++) { C.set(x, 41, Lw2.b); C.set(x, 43, Lw2.sh); } C.set(13, 41, Lw2.hi); C.set(22, 41, Lw2.hi); }   // Kniewickel
  for (let x = 13; x <= 27; x++) { C.set(x, 28 + b, Ll.hi); C.set(x, 31 + b, Ll.dk); }          // Gürtelkanten
  for (const [x, y] of [[19, 29], [20, 29], [21, 29], [19, 30], [21, 30]]) C.set(x, y + b, Lm.b);   // Schnalle
  C.set(19, 29 + b, Lm.hi); C.set(20, 30 + b, Ll.dk);
  C.set(16, 19 + b, Lm.hi); C.set(16, 20 + b, Lm.sh);                                            // Riemenschnalle
  for (const [x, y] of [[23, 30], [24, 30], [23, 31], [24, 31], [25, 31], [23, 32], [24, 32]]) C.set(x, y + b, Ll.b);   // Tasche
  C.set(23, 30 + b, Ls.hi); C.set(25, 32 + b, Ll.dk); C.set(24, 33 + b, Ll.sh);
  for (let y = 27 + b; y <= 33 + b; y += 2) { C.set(7, y, Lw.b); C.set(8, y, Lw.b); C.set(9, y - 1, Lw.hi); C.set(32, y, Lw.sh); C.set(33, y, Lw.sh); C.set(31, y - 1, Lw.b); }   // Wickel
  for (const [x, y] of [[12, 49], [13, 49], [14, 49], [22, 49], [23, 49], [24, 49]]) C.set(x, y, Ls.b);   // Stiefelriemen
  C.set(12, 49, Ls.hi); C.set(22, 49, Ls.hi);
  for (let y = 30; y <= 36; y++) C.set(12, y + b, y < 32 ? Ll.b : Lm.sh); C.set(12, 37 + b, Lm.dk);   // Dolchscheide am Gürtel
  return toCanvas(C.toG());
}

// ---- Seitenansicht (Blick nach links; rechts = gespiegelt) mit Laufzyklus ----
// pose: i0/i1 (stehen, atmen), w0–w3 (Schritt: Beine schwingen gegenläufig, Körper wippt, Umhang schwingt nach)
const STEP = { w0: 1, w1: 0, w2: -1, w3: 0 };
export function paintFigureSide(look = WANDERER, pose = 'i0') {
  const C = new Canvas2(FW, FH, true), s = STEP[pose] ?? 0, walk = pose in STEP, b = pose === 'i1' || (walk && s === 0) ? 1 : 0;
  const P = {
    cloak: C.part('cloak', look.cloak), farArm: C.part('farArm', mix(look.coat, '#000', 0.3)), farGlove: C.part('farGlove', mix(look.glove, '#000', 0.3)),
    legF: C.part('legF', mix(look.pants, '#000', 0.25)), bootF: C.part('bootF', mix(look.boots, '#000', 0.2)),
    legN: C.part('legN', look.pants), bootN: C.part('bootN', look.boots), coat: C.part('coat', look.coat), belt: C.part('belt', look.leather),
    mantle: C.part('mantle', look.mantle), hood: C.part('hood', look.hood), face: C.part('face', look.skin),
    arm: C.part('arm', look.coat), glove: C.part('glove', look.glove),
  };
  const sw = walk ? s * 2 : 0;                                    // Umhang weht beim Gehen nach hinten
  C.poly(P.cloak, [[22, 16 + b], [28, 17 + b], [31 + sw, 29], [34 + sw, 41], ...hem(34 + sw, 16, 41, 7, 5).slice(1, -1), [16, 39], [18, 25 + b]]);
  C.poly(P.farArm, [[23, 19 + b], [27, 20 + b], [27 - s * 2, 33 + b], [23 - s * 2, 33 + b]]);
  C.ell(P.farGlove, 25 - s * 2, 35 + b, 2.6, 2.6);
  // Beine: Hüfte bei (20, 37), kräftig (7 px); Fuß vor/zurück je Schritt, das hintere Bein hebt die Ferse
  const leg = (pl, pb, dx, lift) => {
    const fx = 20 + dx;
    C.poly(pl, [[16, 36], [24, 36], [fx + 4, 46 - lift], [fx - 3, 46 - lift]]);
    C.poly(pb, [[fx - 3, 45 - lift], [fx + 4, 45 - lift], [fx + 4, 53 - lift], [fx - 8, 53 - lift], [fx - 7, 50 - lift], [fx - 3, 49 - lift]]);
  };
  leg(P.legF, P.bootF, walk ? s * 6 : 3, walk && s < 0 ? 1 : 0);
  leg(P.legN, P.bootN, walk ? -s * 6 : -2, walk && s > 0 ? 1 : 0);
  // Rumpf: schwer, tief (Brust vorn bei x 13, Rücken bei 27), Rock mit Fetzensaum
  C.poly(P.coat, [[15, 18 + b], [26, 17 + b], [27, 24 + b], [26, 29 + b], [28, 34], [29, 38], ...hem(29, 11, 39, 9, 4).slice(1, -1), [11, 38], [13, 33], [14, 29 + b], [13, 23 + b]]);
  C.poly(P.belt, [[14, 28 + b], [26, 28 + b], [26, 31 + b], [14, 31 + b]]);
  C.poly(P.belt, [[17, 18 + b], [20, 18 + b], [26, 27 + b], [23, 28 + b]]);
  C.poly(P.mantle, [[16, 14 + b], [25, 14 + b], [29, 18 + b], [29, 21 + b], ...hem(29, 13, 21 + b, 4, 2).slice(1, -1), [13, 21 + b], [14, 17 + b]]);
  C.poly(P.hood, [[21, 4 + b], [25, 6 + b], [27, 10 + b], [27, 14 + b], [25, 17 + b], [16, 17 + b], [15, 13 + b], [16, 8 + b], [18, 5 + b]]);
  C.poly(P.face, [[15, 9 + b], [18, 9 + b], [19, 12 + b], [18, 16 + b], [15, 16 + b], [14, 12 + b]]);
  // Arm vorn: kräftig, schwingt gegen das nahe Bein; große Hand
  const ax = walk ? s * 3 : 0;
  C.poly(P.arm, [[16, 18 + b], [23, 18 + b], [23, 25 + b], [21 + ax, 34 + b], [16 + ax, 34 + b], [17, 25 + b]]);
  C.ell(P.glove, 18.5 + ax, 36 + b, 3, 3);
  C.shade();
  const Lh = ramp(look.hood), Lc = ramp(look.coat), Ll = ramp(look.leather), Ls = ramp(look.strap), Lm = ramp(look.metal), Lw = ramp(look.wrap);
  C.set(15, 12 + b, look.eye); C.set(16, 12 + b, mix(look.eye, '#000', 0.65));                  // ein Auge im Profil
  C.set(21, 5 + b, Lh.hi); C.set(19, 6 + b, Lh.hi); C.set(17, 8 + b, Lh.hi); C.set(23, 9 + b, Lh.sh); C.set(24, 11 + b, Lh.sh);
  for (let x = 14; x <= 26; x++) { C.set(x, 28 + b, Ll.hi); C.set(x, 31 + b, Ll.dk); }
  for (const [x, y] of [[14, 29], [15, 29], [14, 30]]) C.set(x, y + b, Lm.b); C.set(14, 29 + b, Lm.hi);   // Schnalle vorn
  for (const [x, y] of [[24, 29], [25, 29], [24, 30], [25, 30], [24, 31]]) C.set(x, y + b, Ll.b); C.set(24, 29 + b, Ls.hi);   // Tasche hinten
  for (let y = 27 + b; y <= 33 + b; y += 2) { const wx = 17 + (walk ? Math.round(ax * (y - 24 - b) / 10) : 0); C.set(wx, y, Lw.hi); C.set(wx + 1, y, Lw.b); C.set(wx + 2, y, Lw.b); C.set(wx + 3, y, Lw.sh); }   // Wickel
  for (const [x, y] of [[16, 34], [16, 35], [22, 35], [22, 36]]) C.set(x, y, Lc.sh);
  return toCanvas(C.toG());
}

// ---- Rückenansicht: Umhang bedeckt den Rücken, Kapuze von hinten ----
export function paintFigureBack(look = WANDERER, pose = 'i0') {
  const C = new Canvas2(FW, FH, true), walk = pose in STEP, s = STEP[pose] ?? 0, b = pose === 'i1' || (walk && s === 0) ? 1 : 0;
  const P = {
    legL: C.part('legL', look.pants), legR: C.part('legR', mix(look.pants, '#000', 0.15)), bootL: C.part('bootL', look.boots), bootR: C.part('bootR', look.boots),
    armL: C.part('armL', look.coat), gloveL: C.part('gloveL', look.glove), armR: C.part('armR', mix(look.coat, '#000', 0.12)), gloveR: C.part('gloveR', look.glove),
    cloak: C.part('cloak', mix(look.cloak, '#fff', 0.05)), mantle: C.part('mantle', look.mantle), hood: C.part('hood', look.hood),
  };
  const lL = walk && s > 0 ? 2 : 0, lR = walk && s < 0 ? 2 : 0;
  C.poly(P.legL, [[13, 37], [19, 37], [18, 47 - lL], [13, 47 - lL]]); C.poly(P.legR, [[21, 37], [27, 37], [27, 47 - lR], [22, 47 - lR]]);
  C.poly(P.bootL, [[12, 46 - lL], [19, 46 - lL], [19, 53 - lL], [12, 53 - lL]]); C.poly(P.bootR, [[21, 46 - lR], [28, 46 - lR], [28, 53 - lR], [21, 53 - lR]]);
  C.poly(P.armL, [[13, 17 + b], [9, 18 + b], [7, 25 + b], [6, 34 + b + lR], [9, 34 + b + lR], [10, 26 + b], [12, 22 + b]]); C.ell(P.gloveL, 7.5, 36 + b + lR, 2.7, 2.9);
  C.poly(P.armR, [[27, 17 + b], [31, 18 + b], [33, 25 + b], [34, 34 + b + lL], [31, 34 + b + lL], [30, 26 + b], [28, 22 + b]]); C.ell(P.gloveR, 32.5, 36 + b + lL, 2.7, 2.9);
  C.poly(P.cloak, [[13, 17 + b], [27, 17 + b], [30, 29], [31, 42], ...hem(31, 9, 42, 13, 5).slice(1, -1), [9, 42], [10, 29]]);
  C.poly(P.mantle, [[15, 14 + b], [25, 14 + b], [30, 17 + b], [31, 20 + b], ...hem(31, 9, 20 + b, 3, 2).slice(1, -1), [9, 20 + b], [10, 17 + b]]);
  C.poly(P.hood, [[20, 4 + b], [23, 6 + b], [26, 10 + b], [26, 14 + b], [27, 17 + b], [13, 17 + b], [14, 14 + b], [14, 10 + b], [17, 6 + b]]);
  C.shade();
  const Lh = ramp(look.hood), Lk = ramp(look.cloak);
  for (let y = 6 + b; y <= 15 + b; y++) C.set(20, y, Lh.sh); C.set(19, 5 + b, Lh.hi);             // Kapuzennaht
  for (const x of [15, 20, 25]) for (let y = 24; y <= 40; y += 1) if (h(x, y) > 0.3) C.set(x + (y > 32 ? (x < 20 ? -1 : x > 20 ? 1 : 0) : 0), y, Lk.dk);   // Faltenwurf
  return toCanvas(C.toG());
}

// ---- Boss-Grundlage: der Hüne (Referenz unten rechts) — 60×76, eigene Formen statt hochskalierter Figur ----
// Massiger Oberkörper (nackte Brust mit Muskeln, Narben), kleine Kapuze mit Schädelmaske, Fetzenumhang bis fast zum
// Boden, riesige Hände mit Armschienen, Lendentuch, Keule. Detailgrad bewusst höher als bei normalen Figuren.
export const BW = 60, BH = 76, BOX = 30, BOY = 73;
export const BRUTE = { hood: '#1d1c22', cloak: '#1b1a20', skin: '#9c745a', mask: '#b8ad94', eye: '#d0452c', leather: '#3e2e22', strap: '#5a4230',
  metal: '#7a7468', pants: '#2a2420', boots: '#1c1712', wrap: '#6e604c', cloth: '#3a2c24' };
// S14 Stil R: dieselben Formen im gröberen Zielraster (alle Koordinaten ×sc), statt ein fertiges Bild zu verkleinern
function scaleCanvas(C, sc) {
  const P = C.poly.bind(C), E = C.ell.bind(C), Lm = C.limb.bind(C), St = C.set.bind(C), So = C.setOn.bind(C), f = v => Math.floor(v * sc);
  C.poly = (p, pts) => P(p, pts.map(([x, y]) => [x * sc, y * sc])); C.ell = (p, x, y, rx, ry) => E(p, x * sc, y * sc, Math.max(0.7, rx * sc), Math.max(0.7, ry * sc));
  C.limb = (p, pts, a, b) => Lm(p, pts.map(([x, y]) => [x * sc, y * sc]), Math.max(1.2, a * sc), Math.max(1.2, b * sc));
  C.set = (x, y, c) => St(f(x), f(y), c); C.setOn = (p, x, y, c) => So(p, f(x), f(y), c); C.idAt = (x, y) => C.at(f(x), f(y)); return C;
}
export function paintBrute(look = BRUTE, pose = 'i0', frame = 0, sc = 1) {   // look.goblin: Goblin-Kopf statt Kapuze/Maske; look.noClub: Waffe zeichnet der Renderer
  const C = sc === 1 ? new Canvas2(BW, BH) : scaleCanvas(new Canvas2(Math.ceil(BW * sc), Math.ceil(BH * sc)), sc), b = pose === 'i1' || (pose === 'walk' && frame & 1) ? 1 : 0, gob = !!look.goblin, up = pose === 'a1';
  const lL = pose === 'walk' && frame === 0 ? 3 : 0, lR = pose === 'walk' && frame === 2 ? 3 : 0;   // Schritt: Fuß hebt sich
  const P = {
    cloak: C.part('cloak', look.cloak), legL: C.part('legL', look.pants), legR: C.part('legR', mix(look.pants, '#000', 0.15)),
    bootL: C.part('bootL', look.boots), bootR: C.part('bootR', look.boots), loin: C.part('loin', look.cloth),
    torso: C.part('torso', mix(look.skin, '#000', 0.1)),
    pecL: C.part('pecL', look.skin), pecR: C.part('pecR', mix(look.skin, '#000', 0.08)),
    ab1: C.part('ab1', look.skin), ab2: C.part('ab2', mix(look.skin, '#000', 0.08)), ab3: C.part('ab3', look.skin), ab4: C.part('ab4', mix(look.skin, '#000', 0.08)),
    belt: C.part('belt', look.leather),
    armL: C.part('armL', look.skin), armR: C.part('armR', mix(look.skin, '#000', 0.12)),
    delL: C.part('delL', look.skin), delR: C.part('delR', mix(look.skin, '#000', 0.1)),
    brL: C.part('brL', look.leather), brR: C.part('brR', mix(look.leather, '#000', 0.15)),
    handL: C.part('handL', mix(look.skin, '#000', 0.05)), club: C.part('club', '#7a6448'), handR: C.part('handR', mix(look.skin, '#000', 0.15)),
    mantle: C.part('mantle', look.hood), hood: C.part('hood', look.hood), mask: C.part('mask', look.mask || look.skin),
    ears: C.part('ears', mix(look.skin, '#000', 0.1)), head: C.part('head', look.skin), tusk: C.part('tusk', '#d8ccb0'),
  };
  C.poly(P.cloak, [[16, 20 + b], [44, 20 + b], [52, 40], [55, 62], ...hem(55, 5, 64, 23, 6).slice(1, -1), [5, 62], [8, 40]]);
  C.poly(P.legL, [[17, 55], [28, 55], [27, 66 - lL], [18, 66 - lL]]); C.poly(P.legR, [[32, 55], [43, 55], [42, 66 - lR], [33, 66 - lR]]);
  C.poly(P.bootL, [[16, 64 - lL], [28, 64 - lL], [28, 73 - lL], [12, 73 - lL], [13, 69 - lL], [16, 68 - lL]]); C.poly(P.bootR, [[32, 64 - lR], [44, 64 - lR], [44, 68 - lR], [47, 69 - lR], [48, 73 - lR], [32, 73 - lR]]);
  C.poly(P.loin, [[17, 45 + b], [43, 45 + b], [45, 56], ...hem(45, 15, 58, 29, 4).slice(1, -1), [15, 56]]);
  C.poly(P.torso, [[18, 23 + b], [42, 23 + b], [46, 30 + b], [44, 38 + b], [41, 45 + b], [19, 45 + b], [16, 38 + b], [14, 30 + b]]);
  C.ell(P.pecL, 24.5, 29 + b, 6.2, 4.2); C.ell(P.pecR, 35.5, 29 + b, 6.2, 4.2);                   // Brustmuskeln
  C.ell(P.ab1, 27.6, 35.5 + b, 2.6, 1.9); C.ell(P.ab2, 32.4, 35.5 + b, 2.6, 1.9); C.ell(P.ab3, 27.8, 39.5 + b, 2.4, 1.8); C.ell(P.ab4, 32.2, 39.5 + b, 2.4, 1.8);   // Bauch
  C.poly(P.belt, [[17, 42 + b], [43, 42 + b], [43, 47 + b], [17, 47 + b]]);
  C.poly(P.belt, [[18, 25 + b], [22, 23 + b], [42, 41 + b], [38, 42 + b]]);                       // Brustgurt quer
  C.poly(P.armL, [[16, 24 + b], [10, 25 + b], [6, 32 + b], [4, 42 + b], [5, 51 + b], [11, 51 + b], [12, 42 + b], [14, 34 + b]]);
  if (up) C.poly(P.armR, [[44, 24 + b], [50, 23 + b], [55, 16 + b], [56, 6 + b], [51, 5 + b], [49, 14 + b], [45, 20 + b]]);   // Ausholen: Arm hoch
  else C.poly(P.armR, [[44, 24 + b], [50, 25 + b], [54, 32 + b], [56, 42 + b], [55, 51 + b], [49, 51 + b], [48, 42 + b], [46, 34 + b]]);
  C.ell(P.delL, 12, 28 + b, 5.2, 5.4); C.ell(P.delR, 48, 28 + b, 5.2, 5.4);                       // Schultermuskeln
  C.poly(P.brL, [[4, 43 + b], [12, 43 + b], [12, 51 + b], [5, 51 + b]]); if (up) C.poly(P.brR, [[50, 5 + b], [56, 6 + b], [55, 12 + b], [50, 11 + b]]); else C.poly(P.brR, [[48, 43 + b], [56, 43 + b], [55, 51 + b], [48, 51 + b]]);
  C.ell(P.handL, 8, 55 + b, 5, 4.6);
  if (!look.noClub) C.poly(P.club, [[47, 30 + b], [52, 27 + b], [57, 30 + b], [59, 40 + b], [58, 50 + b], [59, 66], [55, 68], [53, 58 + b], [51, 42 + b]]);  // Keule mit schwerem Kopf, auf den Boden gestützt
  if (up) C.ell(P.handR, 53.5, 3.5 + b, 4.6, 4.2); else C.ell(P.handR, 52, 55 + b, 5, 4.6);
  C.poly(P.mantle, [[20, 17 + b], [40, 17 + b], [49, 23 + b], [51, 28 + b], ...hem(51, 9, 28 + b, 31, 3).slice(1, -1), [9, 28 + b], [11, 23 + b]]);
  if (gob) {                                                        // Goblin-Hüne: breiter Schädel, lange Ohren, Unterbiss mit Hauern
    C.poly(P.ears, [[23, 14 + b], [10, 9 + b], [14, 15 + b], [23, 19 + b]]); C.poly(P.ears, [[37, 14 + b], [50, 9 + b], [46, 15 + b], [37, 19 + b]]);
    C.ell(P.head, 30, 16 + b, 8.5, 7.5); C.poly(P.head, [[23, 18 + b], [37, 18 + b], [36, 24 + b], [24, 24 + b]]);
    C.poly(P.tusk, [[25, 20 + b], [27, 20 + b], [26, 16 + b]]); C.poly(P.tusk, [[33, 20 + b], [35, 20 + b], [34, 16 + b]]);
  } else {
    C.poly(P.hood, [[30, 5 + b], [35, 8 + b], [38, 13 + b], [38, 19 + b], [40, 23 + b], [20, 23 + b], [22, 19 + b], [22, 13 + b], [25, 8 + b]]);
    C.poly(P.mask, [[30, 10 + b], [34, 12 + b], [35, 17 + b], [33, 22 + b], [27, 22 + b], [25, 17 + b], [26, 12 + b]]);
  }
  C.shade();
  const S = ramp(look.skin), M = ramp(look.mask), L = ramp(look.leather), St = ramp(look.strap), Me = ramp(look.metal), W = ramp(look.wrap), H = ramp(look.hood);
  if (gob) {                                                        // Goblin-Gesicht: gelbe Augen unter schwerer Braue, Nase, Maul
    for (const [x, y] of [[26, 14], [27, 14], [33, 14], [34, 14]]) C.set(x, y + b, look.eye);
    for (let x = 24; x <= 36; x++) C.set(x, 12 + b, S.dk); C.set(30, 16 + b, S.dk); C.set(29, 17 + b, S.sh); C.set(31, 17 + b, S.sh);
    for (let x = 26; x <= 34; x++) C.set(x, 20 + b, '#0b0908'); C.set(25, 11 + b, S.hi); C.set(26, 10 + b, S.hi);
  }
  // Schädelmaske: Augenhöhlen mit rotem Glimmen, Nasenloch, Zähne, Riss
  if (!gob) for (const [x, y] of [[27, 15], [28, 15], [27, 16], [28, 16], [32, 15], [33, 15], [32, 16], [33, 16]]) C.set(x, y + b, '#0b0908');
  if (!gob) { C.set(28, 16 + b, look.eye); C.set(32, 16 + b, mix(look.eye, '#000', 0.2)); C.set(30, 18 + b, '#0b0908'); C.set(29, 18 + b, M.dk);
    for (let x = 27; x <= 33; x++) C.set(x, 20 + b, x % 2 ? M.sh : '#0b0908'); C.set(28, 11 + b, M.hi); C.set(27, 12 + b, M.hi); C.set(33, 13 + b, M.dk); C.set(34, 14 + b, M.dk);
    for (let y = 7 + b; y <= 11 + b; y++) C.set(30, y, H.sh); }
  // Muskeln: Brust, Bauch, Rippen, Schlüsselbein, Narben
  C.set(30, 40 + b, S.dk); C.set(21, 29 + b, S.hi); C.set(22, 28 + b, S.hi); C.set(23, 28 + b, S.hi);                                   // Licht auf der Brust
  for (let i = 0; i < 6; i++) C.set(34 + i, 27 + b + i, mix(S.b, '#6a2a22', 0.5));                // Narbe quer über die Brust
  for (const [x, y] of [[36, 36], [37, 37], [38, 38]]) C.set(x, y + b, S.sh);                         // Rippen
  // Gürtel mit Schädelschnalle, Taschen; Brustgurt mit Nieten
  for (let x = 17; x <= 43; x++) { C.set(x, 42 + b, L.hi); C.set(x, 47 + b, L.dk); }
  for (const [x, y] of [[28, 43], [29, 43], [30, 43], [31, 43], [32, 43], [28, 44], [32, 44], [29, 45], [31, 45], [29, 46], [30, 46], [31, 46]]) C.set(x, y + b, Me.b);
  C.set(29, 44 + b, '#0b0908'); C.set(31, 44 + b, '#0b0908'); C.set(28, 43 + b, Me.hi);
  for (let i = 0; i < 5; i++) C.set(24 + i * 4, 28 + b + Math.round(i * 3.4), Me.hi);                // Nieten am Brustgurt
  for (const [x0, y0] of [[19, 44], [38, 44]]) { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) C.set(x0 + i, y0 + j + b, L.b); C.set(x0, y0 + b, St.hi); C.set(x0 + 3, y0 + 3 + b, L.dk); }
  // Armschienen mit Bändern, Wickel über den Knöcheln
  for (let y = 44 + b; y <= 50 + b; y += 3) { for (let x = 4; x <= 12; x++) C.set(x, y, L.dk); if (!up) for (let x = 48; x <= 56; x++) C.set(x, y, L.dk); }
  C.set(5, 43 + b, L.hi); C.set(6, 43 + b, L.hi);
  for (const [x0, x1, l] of [[18, 27, lL], [33, 42, lR]]) for (let y = 58; y <= 64; y += 3) for (let x = x0; x <= x1; x++) C.set(x, y - l, y === 58 ? W.hi : W.b);
  // Keule: Holz mit Eisenbändern und Nägeln
  const K = ramp('#5a4a38');
  if (!look.noClub) { for (const y of [42, 46]) for (let x = 50; x <= 59; x++) if ((C.idAt ? C.idAt(x, y + b) : C.id[(y + b) * BW + x]) === P.club) C.set(x, y + b, Me.sh);   // Eisenbänder
    for (const [x, y] of [[53, 30], [56, 33], [57, 38], [54, 36], [52, 32]]) { C.set(x, y + b, Me.hi); C.set(x + 1, y + 1 + b, '#0b0908'); } C.set(49, 30 + b, K.hi); C.set(50, 29 + b, K.hi); }   // Nägel im Keulenkopf
  const w = C.W, h = C.H; return { w, h, a: C.col.slice(), at: (x, y) => x < 0 || y < 0 || x >= w || y >= h ? null : C.col[y * w + x] };   // Raster wie paintHuman
}

// =====================================================================================================================
// G1: Menschen aus dem bestehenden Spec-System (sprites.js humanSpec/monsterSpec → resolve → L mit Rampen).
// Skelett je Richtung und Pose (Gelenke), Gliedmaßen als Formen mit Dicke; Kleidung/Rüstung/Kopf nach Spec.
// Richtungen S (vorn), N (hinten), W (seitlich, Blick links; E = gespiegelt). Posen wie bisher (sprites.js POSES).
// =====================================================================================================================
const DARKF = '#0b0908';
// Vorn (S): Waffenarm im Bild links (wa), anderer Arm (oa) je [Schulter, Ellbogen, Hand]; Beine [Hüfte, Knie, Fuß]
function frontRig(pose) {
  const walk = { w0: 1, w1: 0, w2: -1, w3: 0 }[pose];
  const r = { b: pose === 'i1' || walk === 0 ? 1 : 0, u: 0, hx: 0,
    wa: [[12, 19], [8, 26], [7.5, 35]], oa: [[28, 19], [32, 26], [32.5, 35]],
    ll: [[16.5, 37], [16, 44], [15.5, 51]], rl: [[23.5, 37], [24, 44], [24.5, 51]] };
  if (walk) { if (walk > 0) { r.ll = [[16.5, 37], [16, 43], [16, 49]]; r.oa[2] = [32, 33]; } else { r.rl = [[23.5, 37], [24, 43], [24, 49]]; r.wa[2] = [8, 33]; } }
  switch (pose) {
    case 'a1': r.wa = [[12, 19], [8, 15], [9, 8]]; break;                                 // ausholen: Waffenarm hoch
    case 'a2': r.wa = [[12, 19], [10, 25], [15, 29]]; r.u = 1; break;                     // Schlag: Hand vor den Körper
    case 'a3': r.wa = [[12, 19], [14, 27], [22, 31]]; break;                              // Nachschwung quer
    case 'cast': r.wa = [[12, 19], [9, 16], [10, 10]]; r.oa = [[28, 19], [31, 16], [30, 10]]; break;
    case 'hit': r.wa = [[12, 19], [7, 21], [5, 16]]; r.oa = [[28, 19], [33, 21], [35, 16]]; r.hx = 1; break;
    case 'guard': r.u = 2; r.wa = [[12, 19], [11, 27], [18, 24]]; r.oa = [[28, 19], [29, 27], [22, 25]]; break;
    case 'kneel': r.u = 6; r.ll = [[16.5, 37], [13, 45], [15.5, 51]]; r.rl = [[23.5, 37], [24, 47], [24.5, 51]]; break;
    case 'sit': r.u = 7; r.ll = [[16.5, 37], [15.5, 42], [15.5, 51]]; r.rl = [[23.5, 37], [24.5, 42], [24.5, 51]];
      r.wa = [[12, 19], [10, 28], [14, 36]]; r.oa = [[28, 19], [30, 28], [26, 36]]; break;
    case 'trade': r.oa = [[28, 19], [31, 25], [27, 28]]; break;
  }
  return r;
}
function sideRig(pose) {
  const walk = { w0: 1, w1: 0, w2: -1, w3: 0 }[pose], s = walk ?? 0;
  const r = { b: pose === 'i1' || walk === 0 ? 1 : 0, u: 0, hx: 0,
    na: [[20, 19], [19, 26], [18.5 - s * 3, 35]], fa: [[24, 19], [25, 26], [25 + s * 2, 34]],
    nl: [[19, 37], [19 - s * 3, 44], [18 - s * 6, 51]], fl: [[21, 37], [21 + s * 3, 44], [22 + s * 6, 51 - (s > 0 ? 1 : 0)]] };
  switch (pose) {
    case 'a1': r.na = [[20, 19], [23, 13], [21, 7]]; break;
    case 'a2': r.na = [[20, 19], [15, 23], [9, 26]]; r.u = 1; break;
    case 'a3': r.na = [[20, 19], [17, 27], [12, 33]]; break;
    case 'cast': r.na = [[20, 19], [15, 21], [10, 18]]; break;
    case 'hit': r.na = [[20, 19], [23, 22], [24, 15]]; r.hx = 1; break;
    case 'guard': r.u = 2; r.na = [[20, 19], [16, 23], [13, 17]]; break;
    case 'kneel': r.u = 6; r.nl = [[19, 37], [13, 42], [14, 51]]; r.fl = [[21, 37], [22, 47], [26, 51]]; break;
    case 'sit': r.u = 7; r.nl = [[19, 40], [12, 40], [12, 51]]; r.fl = [[21, 40], [14, 40], [14, 51]]; r.na = [[20, 19], [18, 27], [13, 33]]; break;
    case 'trade': r.na = [[20, 19], [15, 24], [9, 25]]; break;
  }
  return r;
}
const shift = (pts, dy, dx = 0) => pts.map(([x, y]) => [x + dx, y + dy]);
const dim = (Rm, k) => ({ hi: mix(Rm.hi, '#000', k), b: mix(Rm.b, '#000', k), sh: mix(Rm.sh, '#000', k), dk: mix(Rm.dk, '#000', k) });

// Schulter des Waffenarms relativ zum Fußpunkt der Figur (Welt-Einheiten; Pivot = (e.x, e.y + 6)); side: 'L'/'R' im Bild
export function shoulderOf(dir, pose, side) {
  const R = dir === 'W' || dir === 'E' ? sideRig(pose) : frontRig(pose), dy = 19 + R.b + R.u - 57;
  return dir === 'W' || dir === 'E' ? [0, dy] : [side === 'L' ? warpX(12) - 20 : warpX(28) - 20, dy];
}
export function paintHuman(L, dir, pose, noArm = null) {   // noArm: 'L'/'R' (Bildseite) bzw. 'near' — Arm zeichnet der Renderer zur Waffe
  const C = new Canvas2(FW, FH, true), side = dir === 'W' || dir === 'E', back = dir === 'N';
  const R = side ? sideRig(pose) : frontRig(pose), b = R.b + R.u, hx = R.hx, gob = L.sp === 'goblin';   // Goblin: gebückt, Kopf tief
  const bone = L.sp === 'skeleton', sleeve = L.armor === 'plate' || L.armor === 'chain' ? L.armorR : L.robe || L.cloth;
  const hand = L.glove || L.skin, pants = bone ? L.skin : L.pants, boots = bone ? L.skin : (L.boots || L.skin);
  const coatR = L.robe || L.cloth, hm = L.robe ? 48 : L.hem || (L.cloak || L.hooded ? 39 : 35);   // Robe bis zu den Knöcheln, Mantel, Wams
  const helmet = L.helm === 'great' || L.helm === 'bascinet', hood = L.hooded && !helmet && L.helm !== 'wide';
  const P = {};
  // --- Tiefenreihenfolge: was zuerst angelegt wird, liegt hinten ---
  if (L.cloak && !back) P.cloak = C.partR('cloak', L.cloak);
  if (L.pack && side) { P.pack = C.partR('pack', L.leather); P.roll = C.partR('roll', ramp('#5e5040')); }
  if (L.quiver && !back) P.quiver = C.partR('quiver', L.leather);
  if (side) { P.farArm = C.partR('farArm', dim(sleeve, 0.3)); P.farHand = C.partR('farHand', dim(hand, 0.3)); }
  P.legF = C.partR('legF', dim(pants, 0.18)); P.bootF = C.partR('bootF', dim(boots, 0.12));
  P.legN = C.partR('legN', pants); P.bootN = C.partR('bootN', boots);
  P.coat = C.partR('coat', coatR);
  if (L.armor === 'leather') P.jerkin = C.partR('jerkin', L.armorR);
  if (L.armor === 'plate') P.plate = C.partR('plate', L.armorR);
  if (L.apron && !back) P.apron = C.partR('apron', L.apronR || L.leather);
  if (L.tabard) P.tabard = C.partR('tabard', L.tabard);
  if (L.stoleR && !back) P.stole = C.partR('stole', L.stoleR);
  P.belt = C.partR('belt', L.belt);
  if (back && L.cloak) P.cloak = C.partR('cloak', L.cloak);
  if (L.pack && back) { P.pack = C.partR('pack', L.leather); P.roll = C.partR('roll', ramp('#5e5040')); }
  if (back && L.quiver) P.quiver = C.partR('quiver', L.leather);
  if (!side) { P.armW = C.partR('armW', sleeve); P.handW = C.partR('handW', hand); P.armO = C.partR('armO', dim(sleeve, 0.1)); P.handO = C.partR('handO', dim(hand, 0.08)); }
  if (L.armor === 'plate' || L.pauldR) { const Pr = L.pauldR || L.armorR; P.pauldL = C.partR('pauldL', Pr); P.pauldR = C.partR('pauldR', dim(Pr, 0.12)); }
  if (L.sashR && !back) P.sash = C.partR('sash', L.sashR);
  if (hood) P.mantle = C.partR('mantle', L.hood);
  else if (L.capeR && !helmet) P.mantle = C.partR('mantle', L.capeR);   // Referenz 3: Schulterumhang
  else if (L.scarf && L.face !== 'cloth') P.collar = C.partR('collar', L.scarf);
  if (hood) { P.hood = C.partR('hood', L.hood); P.face = C.partR('face', { hi: DARKF, b: DARKF, sh: DARKF, dk: DARKF }); }
  else { P.head = C.partR('head', L.skin); if (L.hs !== 2 && !helmet) P.hair = C.partR('hair', L.hair); if (L.beard && !back && !helmet) P.beard = C.partR('beard', L.hair);
    if (L.helm) P.helm = C.partR('helm', L.helmR); if (L.crest) P.crest = C.partR('crest', L.crest); }
  if (L.face === 'cloth' && L.scarf && hood && !back) P.mouthcloth = C.partR('mouthcloth', L.scarf);
  if (side) { P.arm = C.partR('arm', sleeve); P.hand = C.partR('hand', hand); }
  if (L.shield) P.shield = C.partR('shield', L.shieldR);

  const legW = bone ? 3 : 6.5, legW2 = bone ? 2.5 : 5.5, aw = bone ? 2.6 : 5, aw2 = bone ? 2.2 : 4.2;
  if (!side) {
    const cloakPts = back ? [[13, 17 + b], [27, 17 + b], [30, 29], [31, 42], ...hem(31, 9, 42, 13, 5).slice(1, -1), [9, 42], [10, 29]]
      : [[12, 17 + b], [28, 17 + b], [31, 30], [32, 41], ...hem(32, 8, 41, 11, 5).slice(1, -1), [8, 41], [9, 30]];
    if (P.cloak !== undefined && !back) C.poly(P.cloak, cloakPts);
    const [lA, lB] = back ? [R.rl.map(([x, y]) => [40 - x, y]), R.ll.map(([x, y]) => [40 - x, y])] : [R.ll, R.rl];
    C.limb(P.legF, lB, legW, legW2); C.limb(P.legN, lA, legW, legW2);
    const boot = (pid, [fx, fy], outward) => { if (bone) { C.ell(pid, fx, fy + 1, 3, 1.4); return; }
      C.poly(pid, [[fx - 3.5, fy - 5], [fx + 3.5, fy - 5], [fx + 3.5 + (outward > 0 ? 1.5 : 0), fy + 2], [fx - 3.5 - (outward < 0 ? 1.5 : 0), fy + 2]]); };
    boot(P.bootF, lB[2], lB[2][0] > 20 ? 1 : -1); boot(P.bootN, lA[2], lA[2][0] > 20 ? 1 : -1);
    const top = 17 + b, waist = 29 + b, wide = hm > 36;
    if (bone) C.poly(P.coat, [[14, top], [26, top], [25, waist], [26, 36], ...hem(26, 14, 37, 5, 2).slice(1, -1), [14, 36], [15, waist]]);   // Lumpen über Knochen
    else C.poly(P.coat, [[13, top], [27, top], [28, 22 + b], [26, waist], [28, Math.min(34, hm - 1)], [wide ? 30 : 28, hm], ...hem(wide ? 30 : 28, wide ? 10 : 12, hm, 5, wide ? 4 : 2).slice(1, -1), [wide ? 10 : 12, hm], [12, Math.min(34, hm - 1)], [14, waist], [12, 22 + b]]);
    if (P.jerkin !== undefined) C.poly(P.jerkin, [[14, top + 1], [26, top + 1], [27, 23 + b], [25, waist + 2], [15, waist + 2], [13, 23 + b]]);
    if (P.plate !== undefined) C.poly(P.plate, [[14, top + 1], [26, top + 1], [26, 24 + b], [24, waist], [16, waist], [14, 24 + b]]);
    if (P.apron !== undefined) C.poly(P.apron, [[15, 22 + b], [25, 22 + b], [26, 40], [14, 40]]);
    if (P.tabard !== undefined) C.poly(P.tabard, [[17, 20 + b], [23, 20 + b], [24, 38], ...hem(24, 16, 41, 17, 3).slice(1, -1), [16, 38]]);
    if (P.stole !== undefined) { C.poly(P.stole, [[16.5, 16 + b], [18.5, 17 + b], [18.5, 40], [16.5, 41]]); C.poly(P.stole, [[21.5, 17 + b], [23.5, 16 + b], [23.5, 41], [21.5, 40]]); }   // Referenz 3: Stola
    C.poly(P.belt, [[13, waist - 1], [27, waist - 1], [27, waist + 2], [13, waist + 2]]);
    if (L.strap && P.plate === undefined && P.tabard === undefined) C.poly(P.belt, back ? [[26, 18 + b], [24, 17 + b], [14, 28 + b], [16, 28 + b]] : [[14, 18 + b], [16, 17 + b], [26, 28 + b], [24, 28 + b]]);
    if (P.sash !== undefined) C.poly(P.sash, [[24, 17 + b], [27, 18 + b], [17, 31 + b], [14, 30 + b]]);   // S12 Schärpe quer über die Brust
    if (P.cloak !== undefined && back) C.poly(P.cloak, cloakPts);
    if (P.pack !== undefined) { C.poly(P.pack, [[14, 19 + b], [26, 19 + b], [27, 33 + b], [13, 33 + b]]); C.ell(P.roll, 20, 18 + b, 7.5, 2.2); }   // Referenz 3: Rucksack mit Deckenrolle
    if (P.quiver !== undefined) C.poly(P.quiver, back ? [[23, 14 + b], [27, 13 + b], [30, 30 + b], [26, 31 + b]] : [[25, 11 + b], [28, 10 + b], [29, 16 + b], [26, 17 + b]]);
    const [wA, oA] = back ? [R.oa.map(([x, y]) => [40 - x, y]), R.wa.map(([x, y]) => [40 - x, y])] : [R.wa, R.oa];
    const skip = arm => noArm === 'both' || (noArm && (arm[0][0] < 20 ? 'L' : 'R') === noArm);   // both: Zweihänder — beide Arme zeichnet der Renderer
    if (!skip(wA)) { C.limb(P.armW, shift(wA, b), aw, aw2); C.ell(P.handW, wA[2][0], wA[2][1] + b + 1, bone ? 1.8 : 2.7, bone ? 1.8 : 2.9); }
    if (!skip(oA)) { C.limb(P.armO, shift(oA, b), aw, aw2); C.ell(P.handO, oA[2][0], oA[2][1] + b + 1, bone ? 1.8 : 2.7, bone ? 1.8 : 2.9); }
    if (P.pauldL !== undefined) { C.poly(P.pauldL, [[14, 16 + b], [9, 16 + b], [6, 19 + b], [6, 22 + b], [9, 23 + b], [13, 21 + b]]);
      C.poly(P.pauldR, [[26, 16 + b], [31, 16 + b], [34, 19 + b], [34, 22 + b], [31, 23 + b], [27, 21 + b]]); }
    if (P.mantle !== undefined) C.poly(P.mantle, [[15, 14 + b], [25, 14 + b], [30, 17 + b], [31, 20 + b], ...hem(31, 9, 20 + b, 3, 2).slice(1, -1), [9, 20 + b], [10, 17 + b]]);
    if (P.collar !== undefined) C.poly(P.collar, [[15, 15 + b], [25, 15 + b], [27, 18 + b], [13, 18 + b]]);
    if (hood) {
      C.poly(P.hood, [[20 + hx, 4 + b], [23 + hx, 6 + b], [26 + hx, 10 + b], [26 + hx, 14 + b], [27, 17 + b], [13, 17 + b], [14 + hx, 14 + b], [14 + hx, 10 + b], [17 + hx, 6 + b]]);
      if (!back) C.poly(P.face, [[20 + hx, 8 + b], [23 + hx, 11 + b], [23 + hx, 14 + b], [21 + hx, 16 + b], [19 + hx, 16 + b], [17 + hx, 14 + b], [17 + hx, 11 + b]]);
    } else {
      if (gob) {                                                  // Goblin: breiter Kopf tief zwischen den Schultern, lange Ohren, Hakennase
        C.ell(P.head, 20 + hx, 13 + b, 5.6, 4.6);
        C.poly(P.head, [[15 + hx, 11 + b], [8 + hx, 8 + b], [10 + hx, 12 + b], [15 + hx, 14 + b]]); C.poly(P.head, [[25 + hx, 11 + b], [32 + hx, 8 + b], [30 + hx, 12 + b], [25 + hx, 14 + b]]);
        C.poly(P.head, [[19 + hx, 13 + b], [21 + hx, 13 + b], [21 + hx, 17 + b], [20 + hx, 18 + b], [19 + hx, 17 + b]]);
      } else C.ell(P.head, 20 + hx, 11 + b, 4.6, 5.4);
      C.poly(P.head, [[18.5 + hx, 15 + b], [21.5 + hx, 15 + b], [21.5, 18 + b], [18.5, 18 + b]]);   // Hals
      if (P.hair !== undefined) {
        if (back) C.ell(P.hair, 20 + hx, 10.5 + b, 4.9, 5.4);
        else C.poly(P.hair, [[15.3 + hx, 13 + b], [15.5 + hx, 7.5 + b], [17.5 + hx, 5.2 + b], [22.5 + hx, 5.2 + b], [24.5 + hx, 7.5 + b], [24.7 + hx, 13 + b], [23.6 + hx, 9.6 + b], [20 + hx, 9 + b], [16.4 + hx, 9.6 + b]]);
        if (L.hs === 1) { C.poly(P.hair, [[15 + hx, 9 + b], [16.5 + hx, 9 + b], [16.5 + hx, 18 + b], [15 + hx, 17 + b]]); C.poly(P.hair, [[23.5 + hx, 9 + b], [25 + hx, 9 + b], [25 + hx, 17 + b], [23.5 + hx, 18 + b]]); }
        if (L.hs === 3 && back) C.poly(P.hair, [[19.5, 14 + b], [20.5, 14 + b], [21, 21 + b], [19, 21 + b]]);
      }
      if (P.beard !== undefined) C.poly(P.beard, [[16.2 + hx, 12 + b], [23.8 + hx, 12 + b], [23 + hx, 16 + b], [20.5 + hx, 18.5 + b], [19.5 + hx, 18.5 + b], [17 + hx, 16 + b]]);
      if (P.helm !== undefined) {
        const t = L.helm;
        if (t === 'great') C.poly(P.helm, [[15 + hx, 6 + b], [25 + hx, 6 + b], [25.5 + hx, 16 + b], [14.5 + hx, 16 + b]]);
        else if (t === 'bascinet') C.poly(P.helm, [[14.8 + hx, 16 + b], [15 + hx, 8 + b], [17 + hx, 4.5 + b], [20 + hx, 1.5 + b], [23 + hx, 4.5 + b], [25 + hx, 8 + b], [25.2 + hx, 16 + b]]);   // Beckenhaube, spitz
        else if (t === 'kettle') { C.poly(P.helm, [[15.3 + hx, 10 + b], [15.6 + hx, 6.5 + b], [18 + hx, 4.5 + b], [22 + hx, 4.5 + b], [24.4 + hx, 6.5 + b], [24.7 + hx, 10 + b]]); C.poly(P.helm, [[11.5 + hx, 9.5 + b], [28.5 + hx, 9.5 + b], [27 + hx, 11.5 + b], [13 + hx, 11.5 + b]]); }   // Eisenhut mit Krempe
        else if (t === 'wide') { C.poly(P.helm, [[16.5 + hx, 2.5 + b], [23.5 + hx, 2.5 + b], [24.5 + hx, 7.5 + b], [15.5 + hx, 7.5 + b]]); C.poly(P.helm, [[8.5 + hx, 8 + b], [31.5 + hx, 8 + b], [30 + hx, 10 + b], [10 + hx, 10 + b]]); }   // breiter Hut
        else if (t === 'hat') { C.poly(P.helm, [[17 + hx, 3 + b], [23 + hx, 3 + b], [24 + hx, 7.5 + b], [16 + hx, 7.5 + b]]); C.poly(P.helm, [[11 + hx, 7 + b], [29 + hx, 7 + b], [28 + hx, 9 + b], [12 + hx, 9 + b]]); }
        else if (t === 'scarf') C.poly(P.helm, [[15.3 + hx, 11 + b], [15.6 + hx, 7 + b], [18 + hx, 5 + b], [22 + hx, 5 + b], [24.4 + hx, 7 + b], [24.7 + hx, 11 + b], [25 + hx, 18 + b], [23.8 + hx, 17 + b], [23.8 + hx, 10 + b], [16.2 + hx, 10 + b], [16.2 + hx, 17 + b], [15 + hx, 18 + b]]);
        else { const g3 = gob ? 3 : 0; C.poly(P.helm, [[15.3 + hx - g3 / 3, 10.5 + b + g3], [15.6 + hx - g3 / 3, 7 + b + g3], [18 + hx, 5 + b + g3], [22 + hx, 5 + b + g3], [24.4 + hx + g3 / 3, 7 + b + g3], [24.7 + hx + g3 / 3, 10.5 + b + g3]]); }   // Kappe / Nasalhelm
      }
      if (P.crest !== undefined) C.poly(P.crest, [[18.5 + hx, 1 + b], [21.5 + hx, 1 + b], [22 + hx, 6 + b], [18 + hx, 6 + b]]);
    }
    if (P.mouthcloth !== undefined) C.poly(P.mouthcloth, [[16, 13 + b], [24, 13 + b], [25, 16 + b], [24, 18 + b], [16, 18 + b], [15, 16 + b]]);
    if (P.shield !== undefined) { const [sx, sy] = back ? [8, 26 + b] : pose === 'guard' ? [20, 24 + b] : [31, 29 + b];
      if (L.shield === 'round') C.ell(P.shield, sx, sy, 5.2, 5.4); else C.poly(P.shield, [[sx - 5, sy - 6], [sx + 5, sy - 6], [sx + 5, sy + 1], [sx, sy + 7], [sx - 5, sy + 1]]); }
  } else {
    if (P.cloak !== undefined) { const sw = { w0: 2, w2: -2 }[pose] || 0;
      C.poly(P.cloak, [[22, 16 + b], [28, 17 + b], [31 + sw, 29], [34 + sw, 41], ...hem(34 + sw, 16, 41, 7, 5).slice(1, -1), [16, 39], [18, 25 + b]]); }
    if (P.quiver !== undefined) C.poly(P.quiver, [[25, 14 + b], [28, 13 + b], [31, 29 + b], [28, 30 + b]]);
    if (P.pack !== undefined) { C.poly(P.pack, [[24, 18 + b], [31, 19 + b], [31, 32 + b], [24, 32 + b]]); C.ell(P.roll, 28, 17 + b, 3.5, 2.2); }
    if (noArm !== 'both') { C.limb(P.farArm, shift(R.fa, b), bone ? 2.4 : 4.6, bone ? 2 : 3.8); C.ell(P.farHand, R.fa[2][0], R.fa[2][1] + b + 1, 2.4, 2.5); }
    C.limb(P.legF, R.fl, legW, legW2); C.limb(P.legN, R.nl, legW, legW2);
    const boot = (pid, [fx, fy]) => { if (bone) { C.ell(pid, fx - 1, fy + 1, 3, 1.4); return; } C.poly(pid, [[fx - 3, fy - 5], [fx + 4, fy - 5], [fx + 4, fy + 2], [fx - 8, fy + 2], [fx - 7, fy - 1], [fx - 3, fy - 2]]); };
    boot(P.bootF, R.fl[2]); boot(P.bootN, R.nl[2]);
    const top = 17 + b, waist = 29 + b;
    if (bone) C.poly(P.coat, [[16, top], [25, top], [25, waist], [26, 36], ...hem(26, 14, 37, 9, 2).slice(1, -1), [14, 36], [15, waist]]);
    else C.poly(P.coat, [[15, top + 1], [26, top], [27, 24 + b], [26, waist], [28, Math.min(34, hm - 1)], [29, hm - 1], ...hem(29, 11, hm, 9, hm > 36 ? 4 : 2).slice(1, -1), [11, hm - 1], [13, Math.min(33, hm - 1)], [14, waist], [13, 23 + b]]);
    if (P.jerkin !== undefined) C.poly(P.jerkin, [[15, top + 1], [26, top + 1], [26, waist + 2], [14, waist + 2], [13, 23 + b]]);
    if (P.plate !== undefined) C.poly(P.plate, [[14, top + 1], [25, top + 1], [26, 25 + b], [24, waist], [15, waist], [13, 24 + b]]);
    if (P.apron !== undefined) C.poly(P.apron, [[12, 22 + b], [15, 22 + b], [15, 41], [11, 41]]);
    if (P.tabard !== undefined) C.poly(P.tabard, [[13, 20 + b], [17, 20 + b], [17, 39], [12, 40]]);
    if (P.stole !== undefined) C.poly(P.stole, [[15, 16 + b], [17, 17 + b], [16.5, 40], [14.5, 40]]);
    C.poly(P.belt, [[14, waist - 1], [26, waist - 1], [26, waist + 2], [14, waist + 2]]);
    if (L.strap && P.plate === undefined && P.tabard === undefined) C.poly(P.belt, [[17, 18 + b], [20, 18 + b], [26, 27 + b], [23, 28 + b]]);
    if (P.sash !== undefined) C.poly(P.sash, [[18, 17 + b], [21, 17 + b], [24, 30 + b], [21, 31 + b]]);
    if (P.pauldL !== undefined) C.poly(P.pauldL, [[17, 16 + b], [24, 16 + b], [25, 21 + b], [17, 22 + b]]);
    if (P.mantle !== undefined) C.poly(P.mantle, [[16, 14 + b], [25, 14 + b], [29, 18 + b], [29, 21 + b], ...hem(29, 13, 21 + b, 4, 2).slice(1, -1), [13, 21 + b], [14, 17 + b]]);
    if (P.collar !== undefined) C.poly(P.collar, [[16, 15 + b], [25, 15 + b], [26, 18 + b], [15, 18 + b]]);
    if (hood) {
      C.poly(P.hood, [[21 + hx, 4 + b], [25 + hx, 6 + b], [27 + hx, 10 + b], [27, 14 + b], [25, 17 + b], [16, 17 + b], [15 + hx, 13 + b], [16 + hx, 8 + b], [18 + hx, 5 + b]]);
      C.poly(P.face, [[15 + hx, 9 + b], [18 + hx, 9 + b], [19 + hx, 12 + b], [18 + hx, 16 + b], [15 + hx, 16 + b], [14 + hx, 12 + b]]);
    } else {
      if (gob) { C.ell(P.head, 18.5 + hx, 13 + b, 5, 4.4); C.poly(P.head, [[22 + hx, 11 + b], [28 + hx, 8 + b], [26 + hx, 12 + b], [22 + hx, 14 + b]]);   // Ohr nach hinten
        C.poly(P.head, [[14.5 + hx, 12 + b], [11 + hx, 15 + b], [13 + hx, 16 + b], [15 + hx, 15 + b]]); }                                               // lange Nase
      else { C.ell(P.head, 19.5 + hx, 11 + b, 4.4, 5.3); C.poly(P.head, [[19 + hx, 15 + b], [22 + hx, 15 + b], [22, 18 + b], [19, 18 + b]]); }
      C.poly(P.head, [[15.2 + hx, 10 + b], [14 + hx, 12.5 + b], [15.4 + hx, 13 + b]]);           // Nase
      if (P.hair !== undefined) { C.poly(P.hair, [[16 + hx, 8 + b], [17.5 + hx, 5.6 + b], [22 + hx, 5.6 + b], [24 + hx, 8 + b], [24.2 + hx, 14 + b], [21 + hx, 14 + b], [21 + hx, 9 + b], [16 + hx, 9 + b]]);
        if (L.hs === 1) C.poly(P.hair, [[21 + hx, 12 + b], [24 + hx, 12 + b], [24.5, 19 + b], [21.5, 19 + b]]);
        if (L.hs === 3) C.poly(P.hair, [[23.5 + hx, 13 + b], [25 + hx, 13 + b], [26, 20 + b], [24.5, 20 + b]]); }
      if (P.beard !== undefined) C.poly(P.beard, [[15 + hx, 12.5 + b], [19 + hx, 12.5 + b], [20 + hx, 15 + b], [17.5 + hx, 18 + b], [15.5 + hx, 16 + b]]);
      if (P.helm !== undefined) {
        const t = L.helm;
        if (t === 'great') C.poly(P.helm, [[15 + hx, 6 + b], [24 + hx, 6 + b], [24.5 + hx, 16 + b], [14.5 + hx, 16 + b]]);
        else if (t === 'bascinet') C.poly(P.helm, [[14 + hx, 16 + b], [14.5 + hx, 8 + b], [17 + hx, 4.5 + b], [19.5 + hx, 1.5 + b], [22 + hx, 5 + b], [24 + hx, 8 + b], [24.5 + hx, 16 + b]]);
        else if (t === 'kettle') { C.poly(P.helm, [[14.5 + hx, 10 + b], [15.5 + hx, 6.5 + b], [18 + hx, 4.5 + b], [21.5 + hx, 5 + b], [23.2 + hx, 7.5 + b], [23.4 + hx, 10 + b]]); C.poly(P.helm, [[11 + hx, 9.5 + b], [27 + hx, 9.5 + b], [26 + hx, 11.5 + b], [12 + hx, 11.5 + b]]); }
        else if (t === 'wide') { C.poly(P.helm, [[17 + hx, 2.5 + b], [23 + hx, 2.5 + b], [23.5 + hx, 7.5 + b], [16.5 + hx, 7.5 + b]]); C.poly(P.helm, [[9.5 + hx, 8 + b], [29.5 + hx, 8 + b], [28 + hx, 10 + b], [11 + hx, 10 + b]]); }
        else if (t === 'hat') { C.poly(P.helm, [[17 + hx, 3 + b], [23 + hx, 3 + b], [23.5 + hx, 7.5 + b], [16.5 + hx, 7.5 + b]]); C.poly(P.helm, [[12 + hx, 7 + b], [27 + hx, 7 + b], [26 + hx, 9 + b], [13 + hx, 9 + b]]); }
        else if (t === 'scarf') C.poly(P.helm, [[16 + hx, 9 + b], [17.5 + hx, 5 + b], [22.5 + hx, 5 + b], [24.5 + hx, 8 + b], [25 + hx, 18 + b], [21 + hx, 17 + b], [21 + hx, 10 + b], [16 + hx, 10 + b]]);
        else { const g3 = gob ? 3 : 0; C.poly(P.helm, [[14.5 + hx, 10 + b + g3], [15.5 + hx, 6.5 + b + g3], [18 + hx, 5 + b + g3], [21.5 + hx, 5.5 + b + g3], [23.2 + hx, 8 + b + g3], [23.4 + hx, 11 + b + g3]]); }
      }
      if (P.crest !== undefined) C.poly(P.crest, [[18 + hx, 2 + b], [23 + hx, 2 + b], [27 + hx, 9 + b], [24 + hx, 8 + b], [22 + hx, 6 + b], [18 + hx, 6 + b]]);
    }
    if (P.mouthcloth !== undefined) C.poly(P.mouthcloth, [[14, 13 + b], [19, 13 + b], [20, 17 + b], [15, 18 + b], [13.5, 16 + b]]);
    if (noArm !== 'near' && noArm !== 'both') { C.limb(P.arm, shift(R.na, b), aw, aw2); C.ell(P.hand, R.na[2][0], R.na[2][1] + b + 1, bone ? 1.8 : 2.8, bone ? 1.8 : 2.9); }
    if (P.shield !== undefined) { const [sx, sy] = pose === 'guard' ? [12, 20 + b] : [14, 27 + b];
      if (L.shield === 'round') C.ell(P.shield, sx, sy, 3, 5.4); else C.poly(P.shield, [[sx - 2, sy - 6], [sx + 2, sy - 6], [sx + 2, sy + 2], [sx, sy + 6], [sx - 2, sy + 2]]); }
  }
  C.shade();
  humanDetails(C, L, P, side, back, b, hood);
  weather(C, L, P, side, back, b);
  return { w: FW, h: FH, a: C.col.slice(), at: (x, y) => x < 0 || y < 0 || x >= FW || y >= FH ? null : C.col[y * FW + x] };
}

// Referenz 3: Stoff hat Schmutz und Falten, Metall Rost und Kerben; Abnutzung (L.wear 0–3) reißt Säume, setzt Flicken;
// Blut (L.blood 0–2) spritzt auf Rumpf und Beine. Alles fest aus dem Hash (kein Flackern), nur auf vorhandene Pixel.
function weather(C, L, P, side, back, b) {
  const W = C.W, wear = L.wear | 0, bl = L.blood | 0, sd = (L.wseed | 0) * 97 + 13;
  const def = a => a.filter(v => v !== undefined);
  const cloth = new Set(def([P.cloak, P.coat, P.mantle, P.hood, P.legF, P.legN, P.tabard, P.jerkin, P.apron, P.pack]));
  const metal = new Set(def([P.plate, P.pauldL, P.pauldR, L.helm && !['hat', 'scarf', 'wide'].includes(L.helm) ? P.helm : undefined]));
  if (L.armor === 'chain') { cloth.delete(P.coat); metal.add(P.coat); }
  const torso = [];
  for (let y = 0; y < C.H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, id = C.id[i], col = C.col[i]; if (id < 0 || !col) continue;
    const n = h(x + sd, y * 7 + sd), n2 = h((x >> 1) + sd, (y >> 1) * 3 + sd);
    if (cloth.has(id)) {
      if (n2 < 0.1 + wear * 0.05) C.col[i] = mix(col, '#0a0808', 0.2 + wear * 0.04);        // Schmutz, Falten
      else if (n2 > 0.96 - wear * 0.02) C.col[i] = mix(col, '#8a7a5c', 0.14);              // ausgeblichen
    } else if (metal.has(id)) {
      if (n < 0.04 + wear * 0.05) C.col[i] = mix(col, '#6a3a1e', 0.5);                      // Rost
      else if (n > 0.975) C.col[i] = mix(col, '#0a0808', 0.4);                              // Kerbe
    }
    if (id === P.coat || id === P.plate || id === P.jerkin || id === P.tabard || id === P.legN || id === P.legF) torso.push(i);
  }
  if (wear >= 2) {                                                   // zerrissener Saum: Löcher von unten in Umhang und Rock
    for (const pid of def([P.cloak, P.coat, P.tabard])) for (let x = 0; x < W; x++) {
      let y = C.H - 1; while (y >= 0 && C.id[y * W + x] !== pid) y--; if (y < 0 || h(x * 3 + sd, pid) > (wear - 1) * 0.28) continue;
      const cut = 1 + ((h(x, sd + pid) * (wear + 1)) | 0);
      for (let k = 0; k < cut; k++) { const i = (y - k) * W + x; if (C.id[i] !== pid) break; C.col[i] = null; C.id[i] = -1; }
    }
    if (torso.length) for (let p = 0; p < wear - 1; p++) {            // Flicken
      const i0 = torso[(h(p + 5, sd) * torso.length) | 0], x0 = i0 % W, y0 = (i0 / W) | 0;
      for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 2; dx++) { const i = (y0 + dy) * W + x0 + dx; if (C.col[i] && C.id[i] === C.id[i0]) C.col[i] = mix(C.col[i], dy === 0 ? '#7a6a4c' : '#5a4a34', 0.4); }
    }
  }
  // S12 Detail (Referenz: Gurte, Nieten, Falten): Faltenwurf im Umhang/Rock, Nieten auf Platte, helle Stiefelstulpe
  const boots = new Set(def([P.bootN, P.bootF])), foldP = new Set(def([P.cloak, P.coat, P.robe, P.tabard])), plateP = new Set(def([P.plate, P.pauldL, P.pauldR]));
  const topOf = new Map();
  for (let y = 0; y < C.H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, id = C.id[i], col = C.col[i]; if (id < 0 || !col) continue;
    if (foldP.has(id) && x % 4 === (sd & 3) && y > 30 && C.id[i - W] === id && C.id[i + W] === id) C.col[i] = mix(col, '#0a0808', 0.2);
    if (plateP.has(id) && (x * 7 + y * 3) % 13 === 0 && C.id[i - 1] === id && C.id[i + 1] === id) C.col[i] = mix(col, '#e6dcc8', 0.45);
    if (boots.has(id)) { const k = id * 100 + x; if (!topOf.has(k)) { topOf.set(k, y); C.col[i] = mix(col, '#8a7a5e', 0.4); } } }
  if (bl && torso.length) for (let s = 0; s < bl * 3; s++) {          // Blutspritzer mit kurzem Lauf nach unten
    const i0 = torso[(h(s * 11 + 3, sd + 7) * torso.length) | 0], x0 = i0 % W, y0 = (i0 / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const i = (y0 + dy) * W + x0 + dx;
      if (C.col[i] && C.id[i] >= 0 && (dx === 0 && dy === 0 || h(x0 + dx + s, y0 + dy) < 0.55)) C.col[i] = h(dx + 9, dy + s) < 0.5 ? '#5a1010' : '#3a0a0a'; }
    for (let k = 1; k <= 1 + ((h(s, sd) * 3) | 0); k++) { const i = (y0 + 1 + k) * W + x0; if (C.col[i] && C.id[i] >= 0) C.col[i] = '#3a0a0a'; }
  }
  if (L.wraps) for (const pid of def([P.legN, P.legF])) for (let x = 0; x < W; x++) {   // Beinwickel: helle Bänder über dem Stiefel
    let yb = C.H - 1; while (yb >= 0 && C.id[yb * W + x] !== P.bootN && C.id[yb * W + x] !== P.bootF) yb--;
    let y = yb; while (y >= 0 && C.id[y * W + x] !== pid) y--; if (y < 0 || yb < 0) continue;
    for (let k = 0; k < 6; k++) { const i = (y - k) * W + x; if (C.id[i] !== pid) break; if ((y - k + x) % 3 !== 0) C.col[i] = mix(C.col[i], '#8a7a5e', k % 3 === 1 ? 0.45 : 0.3); }
  }
  if (L.pack && !side && !back) for (const x of [16, 24]) for (let y = 17 + b; y <= 27 + b; y++) { const i = y * W + Math.round(warpX(x)); if (C.col[i] && C.id[i] >= 0) C.col[i] = y % 3 ? L.leather.sh : L.leather.b; }   // Tragriemen vorn
}

// Handgesetzte Details nach der Schattierung (Gesicht, Schnallen, Nähte, Wappen, Kettenglieder)
function humanDetails(C, L, P, side, back, b, hood) {
  const S = L.skin, B = L.bone, G1 = L.glow, bone = L.sp === 'skeleton';
  if (!back) {
    if (hood) {
      const eyes = side ? [[15, 12]] : [[18, 12], [22, 12]];
      if (L.face === 'skull') { for (const [x, y] of eyes) { C.set(x, y - 1 + b, B.b); C.set(x, y + b, G1 || DARKF); }
        for (let x = side ? 15 : 18; x <= (side ? 17 : 22); x++) C.set(x, 15 + b, x % 2 ? B.sh : DARKF); C.set(side ? 16 : 19, 10 + b, B.hi); }
      else if (L.face === 'mask') { const M = ramp('#6b675e'); for (let y = 10; y <= 15; y++) for (let x = side ? 14 : 18; x <= (side ? 17 : 22); x++) C.set(x, y + b, y === 10 ? M.hi : M.b);
        for (const [x, y] of eyes) C.set(x, y + b, G1 || DARKF); C.set(side ? 15 : 20, 14 + b, M.dk); }
      else if (L.face === 'cloth' || L.face === 'shadow' || G1) for (const [x, y] of eyes) C.set(x, y + b, G1 || '#b0412f');
      else { for (let y = 11; y <= 15; y++) for (let x = side ? 14 : 18; x <= (side ? 17 : 22); x++) C.set(x, y + b, y < 12 ? S.dk : S.sh);   // Gesicht im Kapuzenschatten
        for (const [x, y] of eyes) C.set(x, y + b, '#1b1411'); }
    } else if (P.head !== undefined) {
      const eyes = side ? [[16, 11]] : [[18, 11], [22, 11]];
      if (L.helm === 'great' || L.helm === 'bascinet') { const M = L.helmR; for (let x = side ? 14 : 16; x <= (side ? 19 : 24); x++) C.set(x, 10 + b, DARKF); if (!side) { C.set(20, 11 + b, DARKF); C.set(20, 12 + b, DARKF); }
        if (G1) for (const [x, y] of eyes) C.set(x, y - 1 + b, G1); }
      else if (L.sp === 'goblin') { const ge = side ? [[15, 12]] : [[18, 12], [22, 12]];
        for (const [x, y] of ge) { C.set(x, y + b, '#e0c24a'); C.set(x + (side ? 1 : 0), y - 1 + b, S.dk); }
        for (let x = side ? 13 : 18; x <= (side ? 15 : 22); x++) C.set(x, 16 + b, x % 2 ? L.bone.b : DARKF); }
      else if (bone) { for (const [x, y] of eyes) { C.set(x, y + b, DARKF); C.set(x + (side ? -1 : 1), y + b, DARKF); if (G1) C.set(x, y + b, G1); }
        C.set(side ? 15 : 20, 13 + b, DARKF); for (let x = side ? 15 : 18; x <= (side ? 18 : 22); x++) C.set(x, 15 + b, x % 2 ? S.sh : DARKF); }
      else if (L.face === 'eyes') { const h = P.head, E = G1 || '#ffe8a0';                 // S14 Engel: drei Augen, kein Mund
        for (const [x, y] of side ? [[16, 9], [16, 11], [16, 13]] : [[20, 8], [18, 11], [22, 11]]) { C.setOn(h, x, y + b, '#0a0806'); C.setOn(h, x + 1, y + b, E); C.setOn(h, x + 1, y + 1 + b, '#c8a040'); } }
      else {                                                  // Gesicht (Referenz 2): Schattenhälfte, Brauenschatten, 2 px Augen, keine Mundlinie
        const h = P.head;
        for (let y = 9; y <= 18; y++) for (let x = side ? 13 : 15; x <= (side ? 20 : 25); x++)
          C.setOn(h, x, y + b, y === 10 ? S.sh : y >= 15 ? (y >= 16 ? S.dk : S.sh) : (side ? x >= 17 : x >= 21) ? S.sh : null);
        for (const [x, y] of eyes) { C.setOn(h, x, y + b, DARKF); C.setOn(h, side ? x + 1 : x < 20 ? x - 1 : x + 1, y + b, DARKF); }
        if (L.helm === 'nasal' && !side) for (let y = 9; y <= 13; y++) C.set(20, y + b, L.helmR.b); }
    }
  }
  const Bt = L.belt, waist = 29 + b, bx0 = side ? 14 : 13, bx1 = side ? 26 : 27;
  for (let x = bx0; x <= bx1; x++) { C.set(x, waist - 1, Bt.hi); C.set(x, waist + 2, Bt.dk); }
  if (!back) { const gx = side ? 14 : 19; for (const [x, y] of [[gx, waist], [gx + 1, waist], [gx + 2, waist], [gx, waist + 1], [gx + 2, waist + 1]]) C.set(x, y, L.gold.b); C.set(gx, waist, L.gold.hi); }
  if (L.pouch) { const px = back ? 14 : 23; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) C.set(px + i, waist + 1 + j, L.leather.b); C.set(px, waist + 1, L.leather.hi); C.set(px + 2, waist + 3, L.leather.dk); }
  if (L.armor === 'chain') for (let y = 17 + b; y <= 40; y++) for (let x = 6; x <= 34; x++) {           // Kettenhemd: versetzte Ringreihen
    const i = C.id[y * FW + x]; if (i !== P.coat && i !== P.armW && i !== P.armO && i !== P.arm) continue;
    const M = L.armorR, cur = C.col[y * FW + x], dark = cur === (L.robe || L.cloth).sh || cur === (L.robe || L.cloth).dk || cur === M.sh || cur === M.dk;
    C.col[y * FW + x] = y % 2 ? M.dk : ((x + (y >> 1)) % 2 ? (dark ? M.sh : mix(M.b, M.sh, 0.4)) : mix(M.dk, M.sh, 0.5));
  }
  if (P.tabard !== undefined && L.markR && L.mark === 'quarter') {                       // Referenz 3: gevierter Wappenrock (Adel)
    let x0 = 99, x1 = 0, y0 = 99, y1 = 0; for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (C.id[y * FW + x] === P.tabard) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const mx = (x0 + x1 + 1) / 2, my = y0 + (y1 - y0) * 0.45;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * FW + x; if (C.id[i] === P.tabard && C.col[i] && ((x < mx) !== (y < my))) C.col[i] = mix(C.col[i], L.markR.b, 0.7); }
  } else if (P.tabard !== undefined && L.markR && !back) { const M = L.markR, cx = side ? 15 : 20;
    if (L.mark === 'chevron') { C.set(cx - 2, 26 + b, M.b); C.set(cx - 1, 25 + b, M.hi); C.set(cx, 24 + b, M.hi); C.set(cx + 1, 25 + b, M.b); C.set(cx + 2, 26 + b, M.sh); }
    else { for (let y = 22; y <= 27; y++) C.set(cx, y + b, M.b); for (let x = cx - 2; x <= cx + 2; x++) C.set(x, 24 + b, M.b); C.set(cx, 22 + b, M.hi); } }
  if (P.shield !== undefined && L.markR) { let sx = 0, sy = 0, n = 0;
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (C.id[y * FW + x] === P.shield) { sx += x; sy += y; n++; }
    if (n) { sx = Math.round(sx / n); sy = Math.round(sy / n); const M = L.markR, put = (x, y, c) => { if (C.id[y * FW + x] === P.shield) C.col[y * FW + x] = c; };
      if (L.mark === 'cross') for (let d = -3; d <= 3; d++) { put(sx, sy + d, M.b); if (!side) put(sx + d, sy - 1, M.b); }
      else if (L.mark === 'chevron') for (let d = -3; d <= 3; d++) put(sx + d, sy + (3 - Math.abs(d)) - 2, d === 0 ? M.hi : M.b);
      else { put(sx, sy, M.hi); put(sx + 1, sy + 1, M.sh); } } }
  if (P.hood !== undefined && !side) for (let y = 5; y <= 8; y++) C.set(20, y + b, L.hood.sh);
}

// =====================================================================================================================
// G3: Waffen im feinen Raster (1 Welt-Einheit je Pixel). Liegend, Spitze nach +x, Griff bei (gx, gy). Formen mit Volumen
// (liegende Teile: Licht oben), danach Details (Wicklung, Hohlkehle, Nieten, Rost, Scharten). Jede Waffe eigene Form.
// =====================================================================================================================
/* Runde 9 (Artist): Sensenblatt quer zum Schaft. Mittellinie = quadratische Kurve Wurzel (x0,y0) → Kontrollpunkt (cx,cy) → Spitze (tx,ty),
   Breite w an der Wurzel, zur Spitze schmal (Exponent pw). Rücken (außen, konvex) bekommt den Anteil bk der Breite, die Schneide den Rest.
   s = -1 spiegelt die Seiten (Blatt zur anderen Schaftseite). Liefert Rücken- und Schneidenlinie für die Details. +y = vorn, wenn die Sense aufrecht steht. */
const qpt = (x0, y0, cx, cy, tx, ty, t) => { const u = 1 - t; return [u * u * x0 + 2 * u * t * cx + t * t * tx, u * u * y0 + 2 * u * t * cy + t * t * ty]; };
function sickle(C, pid, x0, y0, cx, cy, tx, ty, w, pw = 0.9, bk = 0.4, s = 1, n = 20) {
  const Bk = [], Ed = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t, [x, y] = qpt(x0, y0, cx, cy, tx, ty, t);
    const dx = 2 * u * (cx - x0) + 2 * t * (tx - cx), dy = 2 * u * (cy - y0) + 2 * t * (ty - cy), l = Math.hypot(dx, dy) || 1, nx = s * dy / l, ny = -s * dx / l;
    const hw = Math.max(0.3, w * Math.pow(1 - t, pw));
    Bk.push([x + nx * hw * bk, y + ny * hw * bk]); Ed.push([x - nx * hw * (1 - bk), y - ny * hw * (1 - bk)]);
  }
  C.poly(pid, [...Bk, ...Ed.slice().reverse()]);
  return { back: Bk, edge: Ed };
}
const dense = P => P.flatMap((p, i) => i + 1 < P.length ? [p, [(p[0] + P[i + 1][0]) / 2, (p[1] + P[i + 1][1]) / 2]] : [p]);   /* dichtere Linie für Einzelpixel */
const inset = (A, B, k) => A.map(([x, y], i) => [x + (B[i][0] - x) * k, y + (B[i][1] - y) * k]);   /* Linie zwischen Schneide (k=0) und Rücken (k=1) */
const WDES = {
  rusty_sword: [40, 12, (C, M) => { const { St } = M;
    C.ell(M.ir, 2.5, 6, 2.3, 2.3); C.poly(M.wr, [[4, 4.6], [11, 4.6], [11, 7.4], [4, 7.4]]); C.poly(M.ir, [[11, 1.5], [13, 1.5], [13, 10.5], [11, 10.5]]);
    C.poly(M.st, [[13, 4], [34, 4.3], [39, 6], [34, 7.8], [13, 8]]);
    return { gx: 7, gy: 6, blade: [14, 34, 6], after: (set) => { for (const [x, y] of [[17, 5], [21, 7], [25, 5], [28, 6], [30, 7], [19, 6]]) set(x, y, x % 2 ? '#7a4a2a' : '#8c5a30');
      for (const x of [23, 31]) { set(x, 4, null); set(x, 8, null); } } }; }],
  longsword: [54, 14, (C, M) => {
    C.ell(M.ir, 3, 7, 2.8, 2.8); C.poly(M.wr, [[5, 5.4], [15, 5.4], [15, 8.6], [5, 8.6]]);
    C.poly(M.ir, [[15, 1], [18, 2], [18, 12], [15, 13], [16, 7]]); C.poly(M.st, [[18, 4.8], [49, 5.2], [53, 7], [49, 8.8], [18, 9.2]]);
    return { gx: 10, gy: 7, blade: [20, 48, 6], after: (set, S) => { for (let x = 20; x <= 44; x++) set(x, 7, S.sh); } }; }],
  greatsword: [72, 18, (C, M) => {
    C.ell(M.ir, 3.5, 9, 3.2, 3.2); C.poly(M.wr, [[6, 7.2], [21, 7.2], [21, 10.8], [6, 10.8]]);
    C.poly(M.ir, [[21, 0.5], [24, 1.5], [24, 16.5], [21, 17.5], [22.5, 9]]); C.poly(M.st, [[24, 6.4], [31, 6.4], [31, 11.6], [24, 11.6]]);   // Fehlschärfe
    C.poly(M.ir, [[31, 4], [33, 4], [33, 14], [31, 14]]);                                                                            // Parierhaken
    C.poly(M.st, [[33, 4.8], [64, 5.4], [71, 9], [64, 12.6], [33, 13.2]]);
    return { gx: 13, gy: 9, blade: [35, 62, 8], after: (set, S) => { for (let x = 35; x <= 58; x++) { set(x, 8, S.sh); set(x, 9, S.dk); } } }; }],
  // Werkzeuge der Arbeiter (S13, Nutzer: „jeder Beruf eigene Bewegung“) — nur in der Hand bei der Arbeit, nicht zu kaufen
  tool_hammer: [30, 16, (C, M) => {                                  // Schmiedehammer: kurzer Stiel, schwerer Kopf
    C.poly(M.wd, [[1, 7], [22, 7], [22, 9.4], [1, 9.4]]); C.poly(M.wr, [[2, 6.7], [7, 6.7], [7, 9.7], [2, 9.7]]);
    C.poly(M.ir, [[20, 2], [27, 2], [28, 3], [28, 13], [27, 14], [20, 14]]);
    return { gx: 4, gy: 8, blade: null, after: (set) => { for (let y = 3; y <= 13; y++) set(27, y, '#8e877c'); } }; }],
  tool_hoe: [42, 18, (C, M) => {                                     // Hacke: langer Stiel, Blatt quer nach unten
    C.poly(M.wd, [[1, 7.2], [37, 7.2], [37, 9.4], [1, 9.4]]);
    C.poly(M.ir, [[35, 6], [39, 6], [39, 10], [35, 10]]); C.poly(M.st, [[37, 10], [41, 10], [41, 17], [37, 16]]);
    return { gx: 8, gy: 8, blade: null }; }],
  tool_saw: [36, 14, (C, M) => {                                     // Säge: Holzgriff, gezahntes Blatt
    C.poly(M.wd, [[1, 3], [9, 3], [9, 11], [1, 11]]); C.poly(M.wr, [[3, 5], [7, 5], [7, 9], [3, 9]]);
    C.poly(M.st, [[9, 4], [34, 5.5], [34, 9.5], [9, 11]]);
    return { gx: 5, gy: 7, blade: null, after: (set) => { for (let x = 10; x <= 33; x += 2) set(x, 10, '#3a3630'); } }; }],
  tool_spoon: [26, 10, (C, M) => {                                   // Kochlöffel
    C.poly(M.wd, [[1, 4.2], [18, 4.2], [18, 6], [1, 6]]); C.ell(M.wd, 21.5, 5, 3.6, 3);
    return { gx: 5, gy: 5, blade: null, after: (set) => { set(21, 4, '#2a1d14'); set(22, 5, '#2a1d14'); } }; }],
  tool_rod: [62, 10, (C, M) => {                                     // Angel: lange, dünne Rute mit Schnur
    C.limb(M.wd, [[1, 5], [30, 4.6], [60, 3.4]], 2.2, 1); C.poly(M.wr, [[2, 4], [8, 4], [8, 6.4], [2, 6.4]]);
    return { gx: 5, gy: 5, blade: null, after: (set) => { for (let y = 4; y <= 9; y++) set(60, y, '#cfc8b6'); } }; }],
  tool_fork: [48, 16, (C, M) => {                                    // Heugabel: Stiel, drei Zinken
    C.poly(M.wd, [[1, 7], [36, 7], [36, 9.2], [1, 9.2]]);
    C.poly(M.ir, [[35, 2], [37.5, 2], [37.5, 14], [35, 14]]);
    for (const y of [2.4, 7.2, 12]) C.poly(M.st, [[37, y], [47, y + 0.3], [47, y + 1.6], [37, y + 1.9]]);
    return { gx: 8, gy: 8, blade: null }; }],
  // S14 Seevolk: Entermesser (Korbgriff, breite gebogene Klinge), Walharpune (Widerhaken), Weißbarts Sturmanker (Kettenring, Stock, Arme)
  entermesser: [42, 16, (C, M) => { C.poly(M.wr, [[0, 7], [9, 7], [9, 9.6], [0, 9.6]]); C.ell(M.ir, 10.5, 8.3, 2.6, 5); C.poly(M.ir, [[2, 4], [10, 3.4], [10, 5], [3, 5.4]]);
    C.poly(M.st, [[12, 6.4], [26, 5.6], [35, 4.6], [41, 7.2], [38, 10.8], [27, 10.4], [12, 10]]); return { gx: 5, gy: 8, blade: [13, 36, 8] }; }],
  harpune: [74, 14, (C, M) => { C.poly(M.wd, [[0, 6], [58, 6], [58, 8.2], [0, 8.2]]); C.poly(M.wr, [[10, 5.6], [17, 5.6], [17, 8.6], [10, 8.6]]); C.poly(M.ir, [[57, 5], [61, 5], [61, 9.2], [57, 9.2]]);
    C.poly(M.st, [[61, 5.2], [70, 5.8], [74, 7.1], [70, 8.4], [61, 9]]); C.poly(M.st, [[63, 5.4], [67, 2.6], [66, 5.6]]); C.poly(M.st, [[63, 8.8], [67, 11.6], [66, 8.6]]); return { gx: 20, gy: 7, blade: null }; }],
  sturmanker: [62, 30, (C, M) => { for (let k = 0; k < 3; k++) C.ell(M.ir, 2 + k * 2.6, 15, 1.5, 1.2);
    C.poly(M.wr, [[7, 13.4], [15, 13.4], [15, 16.6], [7, 16.6]]); C.poly(M.ir, [[15, 13.8], [49, 13.6], [49, 16.4], [15, 16.2]]); C.poly(M.ir, [[18, 5], [21, 5], [21, 25], [18, 25]]);   // Stiel, Schaft, Querstock
    C.ell(M.ir, 50.5, 15, 3.6, 3.6); C.poly(M.st, [[50, 13], [54, 9], [55, 4], [51, 0.5], [45, 2.5], [48.5, 5], [49.5, 9], [47, 12]]); C.poly(M.st, [[50, 17], [54, 21], [55, 26], [51, 29.5], [45, 27.5], [48.5, 25], [49.5, 21], [47, 18]]);
    return { gx: 11, gy: 15, blade: null }; }],
  // S13: neue Waffenarten (Nutzer)
  /* Runde 9 (Artist): Sensen — langes, gebogenes Blatt quer zum Schaft (+y = vorn, wenn sie aufrecht steht), je Sense eigene Form.
     Grassense: Hofsense mit Griffbügel und Rost. Erntesense/Kriegssense: halb gerade geschmiedet (Bürgerwehr), Blatt steiler nach vorn.
     Doppelsense: zwei Blätter Rücken an Rücken. Mondsense: Halbmond aus Mondsilber, schwarzer Stiel. Sturmsense: große Bauernsense mit rotem Band.
     Blutkult-Sense: eigenes Dark-Fantasy-Design (Aldhelms Erntewerkzeug) — Klauenblatt mit Adern, Knochendornen, Maul am Blattansatz, Sehnenwicklung. */
  grassense: [66, 34, (C, M) => { C.poly(M.wd, [[0, 4.6], [58, 4.6], [58, 7.2], [0, 7.2]]);
    C.poly(M.wd, [[25, 6.5], [27.6, 6.5], [28.2, 13], [25.6, 13]]); C.poly(M.wr, [[25.2, 11], [28.4, 11], [28.6, 14.2], [25.2, 14.2]]);   /* Griffbügel */
    C.poly(M.ir, [[54, 3.6], [59, 3.6], [59, 8.4], [54, 8.4]]);
    const Bl = C.partR('blade', M.St), B = sickle(C, Bl, 57, 6, 66, 20, 42, 31, 7, 0.85, 0.35);
    return { gx: 18, gy: 6, blade: null, after: (set) => { for (const [x, y] of dense(inset(B.edge, B.back, 0.15)).slice(2, -3)) set(x, y, '#cfc8b8');
      for (const i of [5, 6, 11, 15]) { const [x, y] = inset(B.edge, B.back, 0.6)[i]; set(x, y, i % 2 ? '#7a4a2a' : '#8c5a30'); } } }; }],
  erntesense: [66, 34, (C, M) => { C.poly(M.wd, [[0, 4.6], [58, 4.6], [58, 7.2], [0, 7.2]]);
    C.poly(M.wd, [[27, 6.5], [29.6, 6.5], [30.2, 13], [27.6, 13]]); C.poly(M.wr, [[27.2, 11], [30.4, 11], [30.6, 14.2], [27.2, 14.2]]);
    for (const x of [13, 40]) C.poly(M.ir, [[x, 4], [x + 2, 4], [x + 2, 7.8], [x, 7.8]]);                                       /* Eisenbänder der Bürgerwehr */
    C.poly(M.ir, [[53, 3.4], [59, 3.4], [59, 8.6], [53, 8.6]]);
    const Bl = C.partR('blade', M.St), B = sickle(C, Bl, 57, 6, 67, 17, 61, 31, 6.5, 0.8, 0.35);
    return { gx: 18, gy: 6, blade: null, after: (set, S) => { for (const [x, y] of dense(inset(B.edge, B.back, 0.15)).slice(2, -3)) set(x, y, '#d8d2c4');
      for (const [x, y] of dense(inset(B.edge, B.back, 0.8)).slice(3, -6)) set(x, y, S.dk); set(55, 4.5, '#d8d0c0'); set(55, 7.5, '#d8d0c0'); } }; }],
  doppelsense: [66, 40, (C, M) => { C.poly(M.wd, [[0, 18.7], [57, 18.7], [57, 21.3], [0, 21.3]]); C.poly(M.wr, [[4, 18.4], [14, 18.4], [14, 21.6], [4, 21.6]]);
    C.poly(M.ir, [[52, 16.4], [59, 16.4], [59, 23.6], [52, 23.6]]);
    const Bl = C.partR('blade', M.St), A = sickle(C, Bl, 57, 22, 65, 33, 45, 39, 6.5, 0.9, 0.35), B = sickle(C, Bl, 57, 18, 65, 7, 45, 1, 6.5, 0.9, 0.35, -1);
    return { gx: 9, gy: 20, blade: null, after: (set) => { for (const P of [A, B]) { for (const [x, y] of dense(inset(P.edge, P.back, 0.15)).slice(2, -3)) set(x, y, '#d8d2c4');
      for (const i of [7, 12]) { const [x, y] = inset(P.edge, P.back, 0.3)[i]; set(x, y, '#5a1416'); } } set(55, 20, '#1b1411'); } }; }],
  mondsense: [70, 38, (C, M) => { const Dk = C.partR('ebony', ramp('#2c2a32'), true); C.poly(Dk, [[0, 4.6], [58, 4.6], [58, 7.2], [0, 7.2]]);
    C.poly(M.wr, [[6, 4.3], [16, 4.3], [16, 7.5], [6, 7.5]]);
    const Mo = C.partR('blade', ramp('#9aa6b8')), B = sickle(C, Mo, 57, 6.5, 79, 31, 38, 35, 8.5, 1, 0.4);
    const Pa = C.partR('moon', ramp('#dfe6ee')); C.ell(Pa, 55.5, 5.9, 3, 3);                                                     /* Mondscheibe am Ansatz */
    return { gx: 18, gy: 6, blade: null, after: (set) => { for (const [x, y] of dense(inset(B.edge, B.back, 0.12)).slice(1, -2)) set(x, y, '#f2f6ff');
      for (const [x, y] of inset(B.edge, B.back, 0.7).slice(2, -5).filter((p, i) => i % 3 === 0)) set(x, y, '#9fd8ff');
      for (const [x, y] of [[56.5, 4.2], [57.2, 5.6], [56.5, 7]]) set(x, y, '#2c2a32'); } }; }],
  kriegssense: [74, 34, (C, M) => { C.poly(M.wd, [[0, 4.6], [60, 4.6], [60, 7.2], [0, 7.2]]); C.poly(M.wr, [[4, 4.3], [13, 4.3], [13, 7.5], [4, 7.5]]);
    for (const y of [3.6, 6.8]) C.poly(M.ir, [[45, y], [60, y], [60, y + 1.6], [45, y + 1.6]]);                                    /* Schaftfedern */
    C.poly(M.ir, [[57, 3], [62, 3], [62, 8.8], [57, 8.8]]);
    const Bl = C.partR('blade', M.St), B = sickle(C, Bl, 60, 6.5, 62, 20, 72, 31, 7, 0.85, 0.4, -1);
    C.poly(Bl, [[58, 8], [53, 12.5], [57, 9.5]]);                                                                                   /* Bartdorn nach hinten */
    return { gx: 18, gy: 6, blade: null, after: (set) => { for (const [x, y] of dense(inset(B.edge, B.back, 0.15)).slice(2, -3)) set(x, y, '#d8d2c4');
      for (const x of [48, 54]) { set(x, 4, '#d8d0c0'); set(x, 7.5, '#d8d0c0'); } } }; }],
  sturmsense: [76, 38, (C, M) => { C.poly(M.wd, [[0, 4.6], [62, 4.6], [62, 7.2], [0, 7.2]]); for (const x of [8, 20, 36]) C.poly(M.wr, [[x, 4.1], [x + 3, 4.1], [x + 3, 7.6], [x, 7.6]]);
    C.poly(M.wd, [[28, 6.5], [30.6, 6.5], [31.2, 13], [28.6, 13]]); C.poly(M.wr, [[28.2, 11], [31.4, 11], [31.6, 14.2], [28.2, 14.2]]);
    C.poly(M.ir, [[58, 3.2], [63, 3.2], [63, 8.8], [58, 8.8]]);
    const Bl = C.partR('blade', M.St), B = sickle(C, Bl, 61, 6.5, 72, 24, 42, 36, 8.5, 0.85, 0.38);
    const Rd = C.partR('red', ramp('#7a2024')); C.poly(Rd, [[56.5, 7], [58.5, 7], [55, 15], [52, 17.5], [53.5, 13]]); C.poly(Rd, [[56, 7], [57.6, 7.6], [51, 12.5], [48.5, 12]]);   /* rotes Band der Bäuerin */
    return { gx: 20, gy: 6, blade: null, after: (set) => { for (const [x, y] of dense(inset(B.edge, B.back, 0.13)).slice(2, -3)) set(x, y, '#eef0f4');
      for (const [x, y] of dense(inset(B.edge, B.back, 0.78)).slice(3, -8).filter((p, i) => i % 3 === 0)) set(x, y, '#ffd27a'); } }; }],
  blutsense: [84, 50, (C, M) => {
    const Dk = C.partR('ebony', ramp('#241a1c'), true); C.poly(Dk, [[3, 6.6], [64, 6.6], [64, 9.4], [3, 9.4]]);                       /* schwarzer Schaft */
    const Bo = C.partR('bone', ramp('#cbbf9f')); C.poly(Bo, [[0, 8], [4, 6.2], [4, 9.8]]);                                          /* Knochendorn am Fuß */
    const Fl = C.partR('flesh', ramp('#6e1a1c')); for (const x0 of [7, 36]) for (let x = x0; x < x0 + 12; x += 3) C.poly(Fl, [[x, 6.2], [x + 1.6, 6.2], [x + 2.6, 9.8], [x + 1, 9.8]]);   /* Sehnenwicklung */
    for (const x of [25, 30, 50, 55]) C.ell(Bo, x, 8, 1.2, 1.8);                                                                     /* Wirbelknoten */
    const T = sickle(C, Bo, 63, 6, 69, 0.6, 57, 1.2, 2.6, 0.9, 0.5, -1);                                                         /* Rückendorn, nach hinten gekrallt */
    const Bd = C.partR('blood', ramp('#4a0c10')), B = sickle(C, Bd, 64, 11, 86, 36, 38, 48, 12, 1, 0.42);                         /* Klauenblatt */
    [4, 8, 12, 15].forEach(i => { const [bx, by] = B.back[i], [ex, ey] = B.edge[i], l = Math.hypot(bx - ex, by - ey) || 1, ux = (bx - ex) / l, uy = (by - ey) / l;
      const [ax, ay] = B.back[i - 1], [cx, cy] = B.back[i + 1], lt = Math.hypot(cx - ax, cy - ay) || 1, tx = (cx - ax) / lt, ty = (cy - ay) / lt, k = i === 15 ? 3 : 5;
      C.poly(Bo, [[bx - tx * 2.2 - ux, by - ty * 2.2 - uy], [bx + ux * k + tx * 2.4, by + uy * k + ty * 2.4], [bx + tx * 1.8 - ux, by + ty * 1.8 - uy]]); });
    const Mw = C.partR('maw', ramp('#4a1014')); C.ell(Mw, 64, 8.5, 5.4, 5.2);                                                     /* Maul am Blattansatz */
    const veins = dense(inset(B.edge, B.back, 0.5)).slice(2, -8);
    for (const i of [5, 9, 13]) { const [x0, y0] = inset(B.edge, B.back, 0.48)[i], [x1, y1] = inset(B.edge, B.back, 0.2)[i + 1]; veins.push([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2]); }   /* Seitenadern zur Schneide */
    const throat = [[64, 8.5], [64.8, 8.5]], pulse = [...veins, ...throat];
    return { gx: 14, gy: 8, blade: null, pulse, after: (set) => {
      dense(inset(B.edge, B.back, 0.14)).slice(2, -2).forEach(([x, y], i) => set(x, y, i % 4 === 3 ? '#2a0608' : i > 30 ? '#ff7a66' : '#d43a3a'));   /* gezahnte, nasse Schneide */
      for (const [x, y] of veins) set(x, y, '#8e1820');
      for (let x = 60; x <= 68; x += 1.5) set(x, 8.5, '#120506');                                                               /* Maulspalt quer, kein Auge */
      for (const x of [60.5, 63.5, 66.5]) { set(x, 7, '#e8dfc6'); set(x + 1.5, 10, '#e8dfc6'); }                                  /* Zähne oben/unten versetzt */
      for (const [x, y] of throat) set(x, y, '#ff3a30');
      for (const [x, y] of dense(T.edge).slice(1, -1)) set(x, y, '#efe6cc');
      } }; }],
  kriegssichel: [40, 20, (C, M) => { C.poly(M.wr, [[0, 9], [14, 9], [14, 12], [0, 12]]); C.ell(M.ir, 1.5, 10.5, 1.6, 1.6);
    C.poly(M.st, [[14, 8.5], [22, 4.5], [31, 3.5], [38, 7], [39, 11], [34, 8], [25, 8], [19, 11.5], [14, 12]]); return { gx: 6, gy: 10, blade: [18, 34, 7] }; }],
  doppelklinge: [64, 12, (C, M) => { C.poly(M.wr, [[26, 4.8], [38, 4.8], [38, 7.2], [26, 7.2]]); C.poly(M.ir, [[24, 3.5], [26, 3.5], [26, 8.5], [24, 8.5]]); C.poly(M.ir, [[38, 3.5], [40, 3.5], [40, 8.5], [38, 8.5]]);
    C.poly(M.st, [[0, 6], [6, 4.4], [24, 4.8], [24, 7.2], [6, 7.6]]); C.poly(M.st, [[40, 4.8], [58, 4.4], [64, 6], [58, 7.6], [40, 7.2]]); return { gx: 32, gy: 6, blade: [42, 58, 6] }; }],
  schlagkralle: [24, 12, (C, M) => { C.poly(M.wr, [[0, 3.5], [8, 3.5], [8, 8.5], [0, 8.5]]); C.poly(M.ir, [[7, 2], [10, 2], [10, 10], [7, 10]]);
    for (const y of [3, 6, 9]) C.poly(M.st, [[10, y - 0.8], [21, y - 0.5], [24, y], [21, y + 0.6], [10, y + 0.8]]); return { gx: 4, gy: 6, blade: [11, 20, 6] }; }],
  wurfmesser: [22, 8, (C, M) => { C.poly(M.wr, [[0, 3], [8, 3], [8, 5], [0, 5]]); C.poly(M.st, [[8, 2.4], [18, 3], [22, 4], [18, 5], [8, 5.6]]); return { gx: 4, gy: 4, blade: [9, 18, 4] }; }],
  wurfbeil: [26, 16, (C, M) => { C.poly(M.wd, [[0, 7], [18, 7], [18, 9], [0, 9]]); C.poly(M.st, [[15, 2], [21, 2.5], [25, 8], [21, 13.5], [15, 14], [18, 8]]); return { gx: 5, gy: 8, blade: null }; }],
  schleuder: [26, 10, (C, M) => { C.poly(M.wr, [[0, 4], [18, 4.4], [18, 5.6], [0, 6]]); C.ell(M.wd, 21, 5, 3.2, 3); return { gx: 3, gy: 5, blade: null }; }],
  messingpistole: [30, 12, (C, M) => { C.poly(M.wd, [[0, 7], [6, 5], [9, 6], [6, 11], [1, 11]]); C.poly(M.ir, [[7, 3.5], [29, 4], [29, 6.2], [7, 6.6]]); C.ell(M.st, 10, 7.5, 1.6, 1.6);
    return { gx: 5, gy: 7, blade: null, orb: [12, 6] }; }],
  donnerbuechse: [54, 14, (C, M) => { C.poly(M.wd, [[0, 6], [14, 5], [19, 8], [19, 12], [3, 12]]); C.poly(M.ir, [[16, 4], [52, 4.5], [53, 6.8], [16, 7.2]]);
    for (const x of [24, 34, 44]) C.poly(M.st, [[x, 3.2], [x + 2, 3.2], [x + 2, 8], [x, 8]]); C.ell(M.st, 21, 8.5, 2, 2); return { gx: 16, gy: 8, blade: null, orb: [22, 7] }; }],
  donnerwort: [56, 14, (C, M) => { C.poly(M.wd, [[0, 6], [14, 5], [19, 8], [19, 12], [3, 12]]); C.poly(M.st, [[16, 3.6], [54, 4.2], [55, 7], [16, 7.6]]);
    for (const x of [22, 30, 38, 46]) C.poly(M.ir, [[x, 3], [x + 2, 3], [x + 2, 8.4], [x, 8.4]]); C.ell(M.st, 21, 8.5, 2.2, 2.2); return { gx: 16, gy: 8, blade: [17, 52, 5], orb: [22, 7] }; }],
  axe: [40, 22, (C, M) => {                                          // S12: schlanker Schaft, Bartklinge mit heller Schneide
    C.poly(M.wd, [[1, 9.6], [33, 9.6], [33, 12.2], [1, 12.2]]); C.poly(M.wr, [[2, 9.3], [9, 9.3], [9, 12.5], [2, 12.5]]);
    C.poly(M.ir, [[28, 7.5], [32.5, 7.5], [32.5, 14.5], [28, 14.5]]);
    C.poly(M.st, [[32, 8.5], [35, 3.5], [38, 2], [39.5, 6.5], [39, 14], [37.5, 19.5], [34.5, 18], [32, 13.5]]);
    return { gx: 6, gy: 11, blade: null, after: (set) => { set(30, 9, '#1b1411'); set(30, 13, '#1b1411'); } }; }],
  greataxe: [58, 26, (C, M) => {                                     // S12: Doppelblatt als Halbmonde, nicht als Platte
    C.poly(M.wd, [[1, 11.8], [52, 11.8], [52, 14.4], [1, 14.4]]); C.poly(M.wr, [[2, 11.5], [11, 11.5], [11, 14.7], [2, 14.7]]);
    C.poly(M.ir, [[41, 9.5], [46, 9.5], [46, 16.5], [41, 16.5]]);
    C.poly(M.st, [[46, 10.5], [49, 4], [53, 1.5], [56, 3.5], [54.5, 9], [54.5, 17], [56, 22.5], [53, 24.5], [49, 22], [46, 15.5]]);
    C.poly(M.st, [[41, 10.5], [38, 6.5], [35.5, 8.5], [35.5, 17.5], [38, 19.5], [41, 15.5]]);
    return { gx: 8, gy: 13, blade: null, after: (set) => { for (let y = 3; y <= 23; y++) set(y < 12 ? 55 : 54, y, '#d8d2c4'); set(43, 13, '#1b1411'); } }; }],
  chain_whip: [64, 20, (C, M) => {                                    // Kettenpeitsche: Griff, lange Eisenkette, Haken am Ende
    C.poly(M.wr, [[1, 8.6], [12, 8.6], [12, 11.4], [1, 11.4]]); C.ell(M.ir, 13, 10, 1.8, 2.2);
    for (let k = 0; k < 15; k++) C.ell(M.ir, 16 + k * 3, 10 + Math.sin(k * 0.9) * 2.2, 1.4, 1);
    C.poly(M.st, [[59, 8], [63, 10], [60, 14], [58, 12]]);
    return { gx: 6, gy: 10, blade: null, after: (set, S) => { for (let k = 0; k < 15; k += 2) set(16 + k * 3, 9 + Math.round(Math.sin(k * 0.9) * 2.2), S.hi); } }; }],
  goblin_hook: [30, 14, (C, M) => {                                   // Hakenmesser: Wickelgriff, gebogene Klinge mit Haken
    C.poly(M.wr, [[1, 6], [9, 6], [9, 8.6], [1, 8.6]]); C.poly(M.ir, [[9, 4.5], [11, 4.5], [11, 10], [9, 10]]);
    C.poly(M.st, [[11, 5.5], [21, 4.5], [27, 2], [28, 5], [24, 6], [26, 9], [21, 8.4], [11, 8.2]]);
    return { gx: 5, gy: 7, blade: [12, 25, 6], after: (set, S) => { for (let x = 12; x <= 21; x++) set(x, 6, S.hi); } }; }],
  flail: [46, 24, (C, M) => {                                         // Streitflegel: Griff, kurzer Schaft, Kette, Dornenkugel
    C.poly(M.wr, [[1, 12.4], [11, 12.4], [11, 15.6], [1, 15.6]]); C.poly(M.wd, [[11, 12.6], [19, 12.6], [19, 15.4], [11, 15.4]]); C.ell(M.ir, 19.5, 14, 1.8, 2.2);
    for (let k = 0; k < 4; k++) C.ell(M.ir, 22 + k * 3, 13 - k * 1.3, 1.4, 1.1);                                  // Kettenglieder, leicht schwingend
    C.ell(M.st, 38, 8.5, 5.5, 5.5);
    for (const pts of [[[36, 3.5], [40, 3.5], [38, 0]], [[36, 13.5], [40, 13.5], [38, 17]], [[43, 6.5], [43, 10.5], [46, 8.5]], [[33, 6.5], [33, 10.5], [31, 8.5]]]) C.poly(M.ir, pts);
    return { gx: 6, gy: 14, blade: null, after: (set, S) => { set(36, 6, S.hi); set(37, 5, S.hi); for (let y = 5; y <= 12; y += 2) set(39, y, S.dk); } }; }],
  morgenstern: [40, 24, (C, M) => {                                   /* Nutzer §5f: Dornenkugel auf dem Stiel */
    C.poly(M.wr, [[1, 10.4], [12, 10.4], [12, 13.6], [1, 13.6]]); C.poly(M.wd, [[12, 10.6], [26, 10.6], [26, 13.4], [12, 13.4]]); C.poly(M.ir, [[24, 9.5], [27, 9.5], [27, 14.5], [24, 14.5]]);
    C.ell(M.st, 32, 12, 6.5, 6.5);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, x = 32 + Math.cos(a) * 6.5, y = 12 + Math.sin(a) * 6.5, tx = 32 + Math.cos(a) * 10, ty = 12 + Math.sin(a) * 10, px = -Math.sin(a) * 1.5, py = Math.cos(a) * 1.5;
      C.poly(M.ir, [[x + px, y + py], [x - px, y - py], [tx, ty]]); }
    return { gx: 6, gy: 12, blade: null, after: (set, S) => { set(30, 9, S.hi); set(31, 8, S.hi); set(34, 15, S.dk); } }; }],
  kettenkugel: [54, 30, (C, M) => {                                   /* Nutzer §5f: lange Kette, schwere Kugel */
    C.poly(M.wr, [[1, 8.4], [11, 8.4], [11, 11.6], [1, 11.6]]); C.poly(M.wd, [[11, 8.6], [17, 8.6], [17, 11.4], [11, 11.4]]); C.ell(M.ir, 17.5, 10, 1.8, 2.2);
    for (let k = 0; k < 8; k++) C.ell(M.ir, 20 + k * 3, 10 + k * 1.6, 1.3, 1);
    C.ell(M.st, 46, 22, 6, 6); for (const pts of [[[44, 16], [48, 16], [46, 12.5]], [[44, 28], [48, 28], [46, 30]], [[52, 20], [52, 24], [54, 22]], [[40, 20], [40, 24], [38, 22]]]) C.poly(M.ir, pts);
    return { gx: 6, gy: 10, blade: null, after: (set, S) => { set(44, 19, S.hi); set(45, 18, S.hi); set(48, 25, S.dk); } }; }],
  katar: [28, 14, (C, M) => {                                         /* Nutzer §5f: H-Griff, Stoßklinge */
    C.poly(M.ir, [[1, 1.5], [3.5, 1.5], [3.5, 12.5], [1, 12.5]]); C.poly(M.ir, [[8, 1.5], [10.5, 1.5], [10.5, 12.5], [8, 12.5]]); C.poly(M.wr, [[3.5, 5.6], [8, 5.6], [8, 8.4], [3.5, 8.4]]);
    C.poly(M.st, [[10.5, 3.5], [20, 4.5], [27.5, 7], [20, 9.5], [10.5, 10.5]]);
    return { gx: 5, gy: 7, blade: [11, 24, 7], after: (set, S) => { for (let x = 11; x <= 22; x++) set(x, 7, S.sh); } }; }],
  schrottkeule: [38, 24, (C, M) => {                                  /* Nutzer §5f: Goblin-Knüppel mit Nägeln und Blech */
    C.poly(M.wr, [[1, 10.6], [9, 10.6], [9, 13.4], [1, 13.4]]); C.poly(M.wd, [[9, 10.2], [26, 8.5], [34, 8], [36, 12], [34, 16], [26, 15.5], [9, 13.8]]);
    const Rs = C.partR('rust', ramp('#6a3a1e')); C.poly(Rs, [[22, 7.5], [29, 7], [29, 10], [22, 10.5]]);
    for (const [x, y] of [[27, 7], [31, 7.5], [35, 11], [31, 16.5], [27, 16], [33, 12]]) C.poly(M.ir, [[x - 0.8, y], [x + 0.8, y], [x, y + (y < 12 ? -3 : 3)]]);
    return { gx: 5, gy: 12, blade: null, after: (set, S) => { set(24, 9, '#8a5a2a'); set(28, 12, '#2a1a10'); } }; }],
  schrottklinge: [42, 16, (C, M) => {                                 /* Nutzer §5f: gezackte Goblinklinge aus einer Kettenschelle */
    const Rg = C.partR('rag', ramp('#5a4a3a')); C.poly(Rg, [[1, 6.6], [10, 6.6], [10, 9.4], [1, 9.4]]); C.poly(M.ir, [[10, 3], [12.5, 3], [12.5, 13], [10, 13]]);
    const pts = [[12.5, 5]]; for (let x = 15; x <= 36; x += 3) pts.push([x, 5 + ((x / 3) % 2 ? -1.2 : 0.4)]); pts.push([41, 8], [36, 11], [12.5, 11]); C.poly(M.st, pts);
    return { gx: 6, gy: 8, blade: [13, 36, 8], after: (set, S) => { for (let x = 14; x <= 34; x += 2) set(x, 8, S.sh); for (let x = 16; x <= 34; x += 6) set(x, 10, '#6a3a1e'); } }; }],
  mace: [36, 22, (C, M) => {
    C.poly(M.wr, [[1, 9.4], [12, 9.4], [12, 12.6], [1, 12.6]]); C.poly(M.wd, [[12, 9.6], [24, 9.6], [24, 12.4], [12, 12.4]]);
    C.ell(M.st, 28, 11, 6, 6);
    for (const pts of [[[26, 5], [30, 5], [29, 1], [27, 1]], [[26, 17], [30, 17], [29, 21], [27, 21]], [[33, 9], [33, 13], [36, 11]], [[22, 6], [24, 8], [22, 9]], [[22, 13], [24, 14], [22, 16]]]) C.poly(M.ir, pts);
    return { gx: 6, gy: 11, blade: null, after: (set, S) => { set(26, 8, S.hi); set(27, 7, S.hi); for (let y = 6; y <= 16; y += 2) set(28, y, S.dk); } }; }],
  spear: [78, 20, (C, M) => {
    C.poly(M.wd, [[1, 8.8], [60, 8.8], [60, 11.4], [1, 11.4]]); C.poly(M.ir, [[58, 7.5], [63, 7.5], [63, 12.5], [58, 12.5]]);
    C.poly(M.st, [[63, 8.2], [69, 5], [77, 10], [69, 15], [63, 11.8]]);
    const R = C.partR('pennant', ramp('#8c2e22')); C.poly(R, [[52, 11.4], [58, 11.4], [57, 19], [55, 16.5], [52, 19]]);
    return { gx: 20, gy: 10, blade: [64, 75, 10], after: (set, S) => { for (let x = 64; x <= 73; x++) set(x, 10, S.sh); set(20, 9, '#7a6040'); set(38, 9, '#7a6040'); } }; }],
  dagger: [30, 12, (C, M) => {
    C.ell(M.ir, 2.5, 6, 2.2, 2.2); C.poly(M.wr, [[4, 4.8], [10, 4.8], [10, 7.2], [4, 7.2]]); C.poly(M.ir, [[10, 2], [12, 2], [12, 10], [10, 10]]);
    C.poly(M.st, [[12, 4.4], [24, 4.6], [29, 5.6], [24, 7.4], [12, 7.6]]);
    return { gx: 7, gy: 6, blade: [13, 25, 6], after: (set, S) => { for (let x = 13; x <= 22; x++) set(x, 6, S.sh); } }; }],
  pickaxe: [38, 32, (C, M) => {
    C.poly(M.wd, [[1, 14.5], [32, 14.5], [32, 17.5], [1, 17.5]]); C.poly(M.wr, [[2, 14.2], [8, 14.2], [8, 17.8], [2, 17.8]]);
    C.poly(M.st, [[30, 13], [34, 13], [36, 5], [35, 1], [33, 6], [32, 13], [32, 19], [33, 26], [35, 31], [36, 27], [34, 19], [30, 19]]);
    C.poly(M.ir, [[29, 12.5], [34, 12.5], [34, 19.5], [29, 19.5]]);
    return { gx: 6, gy: 16, blade: null }; }],
  staff: [56, 22, (C, M) => {
    C.limb(M.wd, [[1, 11], [14, 10], [26, 12], [38, 10], [46, 11]], 3.4, 3); C.ell(M.wd, 26, 12, 2.4, 2.4);   // knorriger Stab
    C.poly(M.wd, [[44, 9], [47, 4], [49, 5], [47, 10]]); C.poly(M.wd, [[44, 13], [47, 18], [49, 17], [47, 12]]); C.poly(M.wd, [[46, 10], [54, 8], [54, 9], [47, 11]]);   // Klaue
    const Cr = C.partR('crystal', ramp('#3f6fb0')); C.ell(Cr, 50, 11, 3.6, 3.2);
    return { gx: 12, gy: 11, blade: null, orb: [50, 10], after: (set) => { set(49, 9, '#cfe6ff'); set(50, 9, '#e8f4ff'); } }; }],
  rapier: [60, 16, (C, M) => {
    C.ell(M.ir, 2.5, 8, 2.2, 2.2); C.poly(M.wr, [[4, 6.6], [11, 6.6], [11, 9.4], [4, 9.4]]);
    C.limb(M.ir, [[11, 2], [9, 4], [8, 8], [9, 12], [11, 14]], 1.4, 1.4); C.limb(M.ir, [[11, 3], [14, 5], [15, 8], [14, 11], [11, 13]], 1.4, 1.4);   // Korbbügel
    C.poly(M.ir, [[11, 6], [14, 6], [14, 10], [11, 10]]); C.poly(M.st, [[14, 7], [55, 7.6], [59, 8], [55, 8.4], [14, 9]]);
    return { gx: 7, gy: 8, blade: [16, 54, 8] }; }],
  /* E38 Katana (Entwickler 09.10.2026: eigene Waffenklasse): lange Wicklung für zwei Hände, runde Tsuba, Habaki, leicht gebogene Klinge
     (Spitze hebt sich), Härtelinie nahe der Schneide. Gischtklinge: Griff aus heller Haifischhaut, Tsuba aus Messing.
     Nebelklinge: länger, blasser Stahl, Nebelschleier an der Härtelinie. */
  katana: [62, 14, (C, M) => katanaW(C, M, {})],
  gischtklinge: [62, 14, (C, M) => katanaW(C, M, { ray: true })],
  nebelkatana: [66, 14, (C, M) => katanaW(C, M, { long: 4, mist: true })],
  warhammer: [52, 20, (C, M) => {
    C.poly(M.wd, [[1, 8.8], [42, 8.8], [42, 11.2], [1, 11.2]]); C.poly(M.wr, [[2, 8.5], [10, 8.5], [10, 11.5], [2, 11.5]]);
    C.poly(M.st, [[37, 4], [45, 4], [45, 16], [37, 16]]); C.poly(M.st, [[45, 6.5], [49, 6.5], [49, 13.5], [45, 13.5]]);
    C.poly(M.ir, [[37, 9], [30, 10], [37, 11]]);
    return { gx: 6, gy: 10, blade: null, after: (set) => { for (const [x, y] of [[39, 5], [43, 5], [39, 15], [43, 15]]) set(x, y, '#d8d0c0'); for (let y = 7; y <= 13; y++) set(48, y, '#c8c2b8'); } }; }],
  halberd: [80, 24, (C, M) => {
    C.poly(M.wd, [[1, 10.6], [66, 10.6], [66, 13.4], [1, 13.4]]);
    C.poly(M.st, [[58, 11], [59, 2], [64, 1], [67, 5], [67, 11]]);                                                                   // Beilblatt
    C.poly(M.st, [[58, 13], [62, 13], [61, 20], [58, 22], [59, 17]]);                                                               // Haken
    C.poly(M.ir, [[56, 9.5], [67, 9.5], [67, 14.5], [56, 14.5]]); C.poly(M.st, [[67, 10.4], [79, 12], [67, 13.6]]);                   // Tülle, Spitze
    return { gx: 22, gy: 12, blade: [68, 77, 12], after: (set, S) => { for (let y = 2; y <= 10; y++) set(59, y, S.hi); set(40, 11, '#7a6040'); } }; }],
  crossbow: [40, 28, (C, M) => {
    C.poly(M.wd, [[1, 12], [35, 12], [35, 16], [8, 16], [4, 19], [1, 18]]);                                                         // Schaft, Kolben
    C.limb(M.st, [[31, 1], [33, 7], [34, 14], [33, 21], [31, 27]], 2.4, 2.4);                                                       // Stahlbogen
    C.poly(M.ir, [[14, 16], [16, 16], [16, 21], [14, 20]]);                                                                          // Abzug
    return { gx: 8, gy: 14, blade: null, after: (set) => { for (let y = 2; y <= 26; y++) set(Math.round(26 + Math.abs(y - 14) * 0.38), y, '#c9bfa6'); set(34, 14, '#8a8a88'); } }; }],
  wand: [32, 12, (C, M) => {
    C.poly(M.wd, [[1, 5], [22, 5], [22, 7.4], [1, 7.4]]); C.poly(M.ir, [[20, 3.5], [23, 3.5], [23, 8.5], [20, 8.5]]);
    const Cr = C.partR('crystal', ramp('#6f8fd0')); C.poly(Cr, [[23, 6], [26, 2], [30, 4], [31, 6], [30, 8], [26, 10]]);
    return { gx: 6, gy: 6, blade: null, orb: [27, 5], after: (set) => { set(26, 4, '#e8f4ff'); } }; }],
  gorak_cleaver: [50, 20, (C, M) => {
    C.poly(M.wr, [[1, 8.5], [13, 8.5], [13, 11.8], [1, 11.8]]);
    const D = C.partR('dark', ramp('#6a645a'), true); C.poly(D, [[13, 3.5], [42, 3], [48, 6], [47, 16.5], [13, 16.5]]);
    return { gx: 6, gy: 10, blade: [15, 45, 10], after: (set) => { for (let x = 14; x < 47; x++) set(x, 16, '#c8c2b8'); for (const [x, y] of [[19, 7], [20, 7]]) set(x, y, null);
      for (const [x, y] of [[24, 12], [30, 6], [37, 13], [42, 8], [28, 14]]) set(x, y, x % 2 ? '#6a3a22' : '#4a2a18'); } }; }],
  shortbow: [16, 40, (C, M) => {
    C.limb(M.wd, [[5, 1], [9, 8], [11, 20], [9, 32], [5, 39]], 2.8, 2.8); C.poly(M.wr, [[9, 17], [13, 17], [13, 23], [9, 23]]);
    return { gx: 11, gy: 20, blade: null, str: [4, 2, 38], after: (set) => { for (let y = 2; y <= 38; y++) set(4, y, '#c9bfa6'); } }; }],
  // --- S12: Arsenal der Mark (Nieten, Flickwerk, Rot nur als Akzent) ---
  schrott_hellebarde: [80, 26, (C, M) => {
    C.poly(M.wd, [[1, 11.6], [64, 11.6], [64, 14.4], [1, 14.4]]); C.poly(M.wr, [[30, 11.2], [36, 11.2], [36, 14.8], [30, 14.8]]);   // Flickwicklung
    C.poly(M.ir, [[56, 10], [60, 10], [60, 16], [56, 16]]); C.poly(M.st, [[60, 12], [64, 3], [68, 2], [67, 12]]);                    // verbogenes Blatt
    C.poly(M.ir, [[60, 14], [63, 14], [62, 22], [60, 20]]); C.poly(M.st, [[64, 11], [79, 13], [64, 15]]);
    return { gx: 22, gy: 13, blade: [65, 77, 13], after: (set, S) => { for (const [x, y] of [[57, 11], [59, 15], [65, 6]]) set(x, y, '#d8d0c0'); for (let y = 4; y <= 11; y++) set(66, y, S.hi); set(67, 8, null); } }; }],
  rabenbeil: [40, 26, (C, M) => {
    C.poly(M.wd, [[1, 11.5], [30, 11.5], [30, 14.5], [1, 14.5]]); C.poly(M.wr, [[2, 11.2], [9, 11.2], [9, 14.8], [2, 14.8]]);
    C.poly(M.ir, [[26, 9], [31, 9], [31, 17], [26, 17]]);
    C.poly(M.st, [[31, 10], [35, 4], [39, 5], [37, 9], [36, 15], [38, 22], [34, 20], [31, 16]]);                                   // Schnabel nach hinten gebogen
    C.poly(M.ir, [[26, 11], [21, 8], [22, 12]]);
    return { gx: 6, gy: 13, blade: null, after: (set, S) => { for (let y = 5; y <= 20; y++) set(y < 10 ? 38 : 37, y, S.hi); set(28, 13, '#1b1411'); } }; }],
  dornensaebel: [52, 16, (C, M) => {
    C.ell(M.ir, 3, 8, 2.4, 2.4); C.poly(M.wr, [[5, 6.6], [13, 6.6], [13, 9.4], [5, 9.4]]); C.poly(M.ir, [[13, 3], [15, 3], [15, 13], [13, 13]]);
    C.poly(M.st, [[15, 6], [34, 5.5], [46, 7], [51, 10], [44, 10], [34, 9.6], [15, 10]]);                                           // gebogen
    for (const x of [22, 28, 34, 40]) C.poly(M.st, [[x, 5.8], [x + 3, 3], [x + 2.5, 5.8]]);                                       // Widerhaken
    return { gx: 9, gy: 8, blade: [16, 46, 8], after: (set, S) => { for (let x = 16; x <= 44; x++) set(x, 9, S.sh); } }; }],
  grabraeuber: [40, 16, (C, M) => {
    C.ell(M.ir, 2.5, 8, 2.3, 2.3); C.poly(M.wr, [[4, 6.6], [11, 6.6], [11, 9.4], [4, 9.4]]); C.poly(M.ir, [[11, 3], [13, 3], [13, 13], [11, 13]]);
    C.poly(M.st, [[13, 4], [30, 3.5], [38, 7], [33, 12], [13, 12]]);                                                                // breit, asymmetrisch
    return { gx: 7, gy: 8, blade: [14, 33, 8], after: (set, S) => { for (const x of [18, 24, 29]) set(x, 3 + (x % 2), null); for (const x of [16, 21, 27]) set(x, 12, null); set(22, 7, '#7a4a2a'); set(26, 9, '#8c5a30'); } }; }],
  kriegspicke: [40, 30, (C, M) => {
    C.poly(M.wd, [[1, 13.5], [33, 13.5], [33, 16.5], [1, 16.5]]); C.poly(M.wr, [[2, 13.2], [8, 13.2], [8, 16.8], [2, 16.8]]);
    C.poly(M.ir, [[29, 11.5], [35, 11.5], [35, 18.5], [29, 18.5]]); C.ell(M.ir, 27, 15, 1.2, 3.4);                                  // Metallring
    C.poly(M.st, [[33, 12], [36, 2], [38, 1], [36, 12]]); C.poly(M.st, [[33, 18], [36, 18], [39, 29], [37, 28]]);                  // zwei lange Spitzen
    return { gx: 6, gy: 15, blade: null, after: (set, S) => { for (let y = 3; y <= 11; y++) set(36, y, S.hi); } }; }],
  sensenlanze: [90, 30, (C, M) => {
    C.poly(M.wd, [[1, 15.6], [74, 15.6], [74, 18.4], [1, 18.4]]); C.poly(M.ir, [[72, 14], [77, 14], [77, 20], [72, 20]]);
    C.poly(M.st, [[77, 15], [89, 17], [77, 19]]);                                                                                   // Spitze
    C.poly(M.st, [[70, 14], [72, 14], [64, 6], [52, 1], [58, 5], [66, 12]]);                                                       // Sensenblatt quer
    return { gx: 24, gy: 17, blade: [78, 88, 17], after: (set, S) => { for (let x = 55; x <= 68; x++) set(x, Math.round(2 + (x - 55) * 0.8), S.hi); } }; }],
  knochenspalter: [54, 20, (C, M) => {                               // S12: Hackbeil, Griff mit Knochenwicklung
    C.poly(M.wr, [[1, 8.5], [17, 8.5], [17, 11.5], [1, 11.5]]); const Bo = C.partR('bone', ramp('#cfc6b0')); for (const x of [5, 11]) C.ell(Bo, x, 10, 1.4, 2);
    const D = C.partR('dark', ramp('#48443e'), true); C.poly(D, [[17, 4], [45, 3], [52, 6.5], [51, 16], [17, 16]]);
    return { gx: 9, gy: 10, blade: [19, 49, 10], after: (set) => { for (let x = 18; x <= 50; x++) set(x, 16, '#c8c2b8'); set(22, 6, '#d8d0c0'); set(24, 7, '#1b1411'); } }; }],
  henkersaxt: [60, 26, (C, M) => {                                   // S12: Richtbeil — langer Bart, eine Schneide
    C.poly(M.wd, [[1, 11.8], [53, 11.8], [53, 14.4], [1, 14.4]]); C.poly(M.wr, [[2, 11.5], [12, 11.5], [12, 14.7], [2, 14.7]]);
    C.poly(M.ir, [[45, 9.5], [50, 9.5], [50, 16.5], [45, 16.5]]);
    C.poly(M.st, [[50, 10.5], [51, 4], [55, 2], [58.5, 4.5], [57.5, 12], [58.5, 21], [55.5, 25], [51.5, 20], [50, 15.5]]);
    return { gx: 8, gy: 13, blade: null, after: (set) => { for (let y = 4; y <= 23; y++) set(y < 13 ? 58 : 58, y, '#d8d2c4'); set(47, 13, '#1b1411'); set(53, 8, '#1b1411'); } }; }],
  mauerbrecher: [58, 22, (C, M) => {                                 // S12: kleinerer Kopf, Eisenbänder, Kette am Griff
    C.poly(M.wd, [[1, 9.8], [46, 9.8], [46, 12.2], [1, 12.2]]); C.poly(M.wr, [[2, 9.5], [11, 9.5], [11, 12.5], [2, 12.5]]);
    for (let k = 0; k < 4; k++) C.ell(M.ir, 14 + k * 3, 14 + Math.sin(k) * 1.2, 1.1, 0.9);
    C.poly(M.st, [[42, 4], [51, 4], [51, 18], [42, 18]]); C.poly(M.st, [[51, 7], [56, 7], [56, 15], [51, 15]]);
    C.poly(M.ir, [[42, 10], [35, 11], [42, 12]]); C.poly(M.ir, [[41.5, 6], [51.5, 6], [51.5, 7.5], [41.5, 7.5]]); C.poly(M.ir, [[41.5, 14.5], [51.5, 14.5], [51.5, 16], [41.5, 16]]);
    return { gx: 7, gy: 11, blade: null, after: (set) => { for (const [x, y] of [[44, 5], [49, 5], [44, 17], [49, 17]]) set(x, y, '#d8d0c0'); for (let y = 8; y <= 14; y++) set(55, y, '#c8c2b8'); } }; }],
  seelenhaken: [74, 24, (C, M) => {
    const D = C.partR('dark', ramp('#23282a'), true); C.poly(D, [[1, 10.8], [60, 10.8], [60, 13.2], [1, 13.2]]);
    C.poly(M.st, [[58, 10], [66, 4], [72, 6], [70, 13], [65, 20], [64, 14], [67, 9], [62, 12]]);                                   // Haken
    const G = C.partR('rune', ramp('#4e8f7a')); C.ell(G, 30, 12, 1.4, 1.4);
    return { gx: 18, gy: 12, blade: null, after: (set) => { set(30, 12, '#9fe0c8'); set(69, 7, '#7fd0b8'); } }; }],
  totenglocke: [52, 24, (C, M) => {                                  // S12: kleinere Glocke, Rune
    C.poly(M.wd, [[1, 10.8], [39, 10.8], [39, 13.2], [1, 13.2]]); C.poly(M.wr, [[2, 10.5], [10, 10.5], [10, 13.5], [2, 13.5]]);
    C.poly(M.ir, [[37, 9], [40, 9], [40, 15], [37, 15]]);
    C.poly(M.st, [[40, 7.5], [42.5, 3.5], [46.5, 3.5], [49, 7.5], [49, 16.5], [46.5, 20.5], [42.5, 20.5], [40, 16.5]]);
    return { gx: 6, gy: 12, blade: null, after: (set) => { for (let y = 8; y <= 16; y++) set(44, y, '#141210'); set(47, 9, '#4e8f7a'); set(47, 15, '#4e8f7a'); } }; }],
  rotklaue: [56, 16, (C, M) => {
    C.ell(M.ir, 3, 8, 2.8, 2.8); C.poly(M.wr, [[5, 6.4], [15, 6.4], [15, 9.6], [5, 9.6]]);
    const Rd = C.partR('red', ramp('#6a1e20')); C.poly(Rd, [[15, 1], [18, 2], [18, 14], [15, 15], [16, 8]]);                       // rote Parierstange
    const D = C.partR('dark', ramp('#2e2e32'), true); C.poly(D, [[18, 5.4], [48, 5.6], [55, 8], [48, 10.4], [18, 10.6]]);
    return { gx: 10, gy: 8, blade: [20, 50, 8], after: (set) => { for (let x = 20; x <= 46; x++) set(x, 5, '#8a8a90'); } }; }],
  schwarzzahn: [74, 20, (C, M) => {
    C.ell(M.ir, 3.5, 10, 3.2, 3.2); C.poly(M.wr, [[6, 8.2], [21, 8.2], [21, 11.8], [6, 11.8]]); C.poly(M.ir, [[21, 1], [24, 2], [24, 18], [21, 19], [22.5, 10]]);
    const D = C.partR('dark', ramp('#222226'), true); C.poly(D, [[24, 4], [64, 4.5], [73, 10], [64, 15.5], [24, 16]]);             // sehr breit
    return { gx: 13, gy: 10, blade: [26, 66, 10], after: (set) => { for (let x = 26; x <= 60; x++) set(x, 10, '#5a1a1c'); for (let x = 26; x <= 62; x++) set(x, 4, '#8a8a90'); } }; }],
  kettenbrecher: [52, 30, (C, M) => {
    C.poly(M.wr, [[1, 13.4], [11, 13.4], [11, 16.6], [1, 16.6]]); C.poly(M.wd, [[11, 13.6], [19, 13.6], [19, 16.4], [11, 16.4]]); C.ell(M.ir, 19.5, 15, 1.8, 2.2);
    for (const [dy, len] of [[-9, 26], [0, 30], [9, 26]]) { for (let k = 0; k < 4; k++) C.ell(M.ir, 22 + k * 3, 15 + dy * k / 5, 1.2, 0.9); C.ell(M.st, 20 + len, 15 + dy, 3.4, 3.4); }   // drei Eisenkörper
    return { gx: 6, gy: 15, blade: null, after: (set, S) => { for (const [x, y] of [[45, 5], [49, 14], [45, 23]]) set(x, y, S.hi); } }; }],
  eisenfalke: [48, 32, (C, M) => {
    const D = C.partR('dark', ramp('#26262a'), true); C.poly(D, [[1, 14], [42, 14], [42, 18], [8, 18], [4, 22], [1, 21]]);
    C.limb(M.st, [[36, 1], [39, 8], [40, 16], [39, 24], [36, 31]], 3, 3); C.poly(M.ir, [[16, 18], [18, 18], [18, 24], [16, 23]]);
    C.ell(M.ir, 10, 16, 2.6, 2.6);                                                                                                  // Winde
    return { gx: 9, gy: 16, blade: null, after: (set) => { for (let y = 2; y <= 30; y++) set(Math.round(30 + Math.abs(y - 16) * 0.38), y, '#c9bfa6'); set(41, 16, '#8a8a88'); } }; }],
  roter_henker: [64, 28, (C, M) => {                                 // S12: Vargs Axt — schwarzer Halbmond, rote Kerbe, Stoffstreifen
    const Dk = C.partR('dark', ramp('#2a2a2e'), true);
    C.poly(Dk, [[1, 12.8], [56, 12.8], [56, 15.4], [1, 15.4]]); C.poly(M.wr, [[2, 12.5], [12, 12.5], [12, 15.7], [2, 15.7]]);
    const Rd = C.partR('red', ramp('#6a1e20')); C.poly(Rd, [[14, 15.4], [16, 15.4], [15.5, 22], [14, 20.5]]); C.poly(Rd, [[19, 15.4], [20.5, 15.4], [21, 20], [19.5, 19]]);
    C.poly(M.ir, [[47, 10.5], [53, 10.5], [53, 17.5], [47, 17.5]]); C.poly(M.ir, [[47, 13], [41, 11.5], [41, 13.5]]);     // Tülle, Rückendorn
    C.poly(Dk, [[53, 11.5], [54, 4], [58, 1.5], [62.5, 4.5], [61, 13.5], [62.5, 22.5], [58, 26.5], [54, 23], [53, 17]]);
    return { gx: 8, gy: 14, blade: null, after: (set) => { for (let y = 3; y <= 25; y++) set(61 + (y > 5 && y < 22 ? 0 : 0), y, '#c8c2b8'); for (let y = 6; y <= 21; y += 2) set(57, y, '#7a2224'); set(50, 14, '#1b1411'); } }; }],
  longbow: [18, 56, (C, M) => {
    C.limb(M.wd, [[5, 1], [10, 12], [12, 28], [10, 44], [5, 55]], 3, 3); C.poly(M.wr, [[10, 24], [14, 24], [14, 32], [10, 32]]);
    return { gx: 12, gy: 28, blade: null, str: [4, 2, 54], after: (set) => { for (let y = 2; y <= 54; y++) set(4, y, '#c9bfa6'); } }; }],
};
function katanaW(C, M, o) {                                         /* E38: gemeinsame Form der Katanas (Maße im 1er-Raster, wie WDES) */
  const L = o.long || 0, Ry = o.ray ? C.partR('ray', ramp('#d8d2c0')) : M.wr;
  C.ell(M.ir, 1.6, 7, 1.5, 1.9);                                    // Kashira (Knaufkappe)
  C.poly(Ry, [[2.5, 5.5], [15, 5.6], [15, 8.4], [2.5, 8.5]]);         // Tsuka: lange Wicklung
  C.ell(o.ray ? C.partR('brass', ramp('#b08a3a'), true) : M.ir, 16.4, 7, 1.5, 3.4);   // Tsuba (runde Scheibe, kleiner als eine Parierstange)
  C.poly(M.ir, [[17.6, 5.7], [19.6, 5.6], [19.6, 8.3], [17.6, 8.4]]); // Habaki
  C.poly(M.st, [[19.6, 5.3], [31, 4.6], [43 + L, 3.3], [52 + L, 1.8], [57 + L, 0.9], [61 + L, 1.4], [57.5 + L, 3.2], [48 + L, 5.0], [36, 6.7], [19.6, 8.5]]);   // Klinge mit Sori (Spitze hebt sich deutlich)
  return { gx: 9, gy: 7, blade: [21, 34, 6], after: (set, S) => {   // Härtelinie (Hamon), leicht gewellt, nahe der Schneide
    for (let x = 22; x <= 55 + L; x++) { const y = Math.round(7.7 - (x - 20) * 0.13 - (x % 5 < 2 ? 0.4 : 0)); set(x, y, o.mist ? '#dfe8f0' : '#ebe6da'); }
    if (o.mist) for (let x = 26; x <= 50 + L; x += 6) set(x, Math.round(6.0 - (x - 20) * 0.12), '#bcd0e0'); } };
}
const WBY = { sword: 'longsword', great: 'greatsword', axe: 'axe', mace: 'mace', spear: 'spear', dagger: 'dagger', staff: 'staff', whip: 'chain_whip',
  rapier: 'rapier', katana: 'katana', hammer: 'warhammer', polearm: 'halberd', crossbow: 'crossbow', wand: 'wand', bow: 'shortbow', throw: 'wurfmesser', sling: 'schleuder' };
export function paintWeapon2(key, wtype, St, Wood, Wrap, Iron, sc = 1, rar = '', bare = false) {   // bare: Bogen ohne Sehne (die Sehne zeichnet render.js beim Spannen)   // sc < 1: S14 Stil R — dieselbe Form im gröberen Zielraster gemalt
  const d = WDES[key] ? key : WBY[wtype] || 'longsword', [w0, h0, fn] = WDES[d], w = Math.ceil(w0 * sc), h = Math.ceil(h0 * sc);
  const C = new Canvas2(w, h);
  if (sc !== 1) { const P = C.poly.bind(C), E = C.ell.bind(C), Lm = C.limb.bind(C); C.poly = (p, pts) => P(p, pts.map(([x, y]) => [x * sc, y * sc]));
    C.ell = (p, x, y, rx, ry) => E(p, x * sc, y * sc, Math.max(0.7, rx * sc), Math.max(0.7, ry * sc)); C.limb = (p, pts, a, b = a) => Lm(p, pts, Math.max(1.2 / sc, a), Math.max(1.2 / sc, b)); }   // S15: Lm ruft das skalierende poly/ell selbst — vorher doppelt skaliert (Bogen ohne unteren Arm)
  St = { hi: mix(St.hi, St.b, 0.35), b: mix(St.b, '#1e1c1a', 0.46), sh: mix(St.sh, '#141210', 0.52), dk: mix(St.dk, '#0c0b0a', 0.4) };   // S12: dunkle Fläche, Licht nur an der Kante (Referenz 3)
  const M = { St, wd: C.partR('wood', Wood, true), wr: C.partR('wrap', Wrap, true), ir: C.partR('iron', Iron, true), st: C.partR('steel', St, true) };
  const info = fn(C, M);
  if (sc !== 1) { info.gx *= sc; info.gy *= sc; if (info.blade) info.blade = info.blade.map(v => Math.round(v * sc)); if (info.orb) info.orb = info.orb.map(v => v * sc); }
  C.shade();
  const metal = new Set([M.st, M.ir, ...C.parts.map((p, i) => p.name === 'dark' ? i : -1).filter(i => i >= 0)]);   // S12 Kantenpass: Schneide oben hell, Unterkante dunkel
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!metal.has(C.id[i]) || !C.col[i]) continue;
    const up = y > 0 ? C.id[i - w] : -1, dn = y < h - 1 ? C.id[i + w] : -1;
    if (up < 0) C.col[i] = mix(C.col[i], '#e2ddd2', 0.5); else if (dn < 0) C.col[i] = mix(C.col[i], '#0c0b0a', 0.45); }
  if (info.str) info.str = info.str.map(v => v * sc);
  if (info.pulse) { const seen = new Set(); info.pulse = info.pulse.map(([x, y]) => [Math.floor(x * sc), Math.floor(y * sc)]).filter(([x, y]) => { const k = x + ',' + y; if (seen.has(k) || x < 0 || y < 0 || x >= w || y >= h) return false; seen.add(k); return true; }); }   /* Runde 9: pulsierende Adern (Blutkult-Sense), Bildpixel */
  if (info.after && !(bare && info.str)) info.after((x, y, c) => { x = Math.floor(x * sc); y = Math.floor(y * sc); if (x < 0 || y < 0 || x >= w || y >= h) return; if (c === null) { C.col[y * w + x] = null; C.id[y * w + x] = -1; } else C.col[y * w + x] = c; }, St);
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) if (C.id[y * w + x] === M.wr && (x % 3 === 0)) C.col[y * w + x] = Wrap.dk;   // Wicklung
  if (sc !== 1) {                                                   // S14 Stil R (Nutzer: „Waffen hübscher“): Hohlkehle und Schliff, Messing/Gold und Stein nach Rarität, Wickel schräg
    const hi = ['epic', 'legendary', 'mythic'].includes(rar), mid = rar === 'rare' || rar === 'uncommon', Br = hi ? ramp('#c8a048') : mid ? ramp('#9a7c4c') : null;
    const lum = c => { const n = parseInt(c.slice(1), 16); return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255); };
    if (Br) for (let i = 0; i < w * h; i++) if (C.id[i] === M.ir && C.col[i] && C.col[i][0] === '#') { const l = lum(C.col[i]); C.col[i] = l > 330 ? Br.hi : l > 200 ? Br.b : l > 110 ? Br.sh : Br.dk; }
    for (let i = 0; i < w * h; i++) if (C.id[i] === M.wr && C.col[i]) { const x = i % w, y = (i / w) | 0; C.col[i] = (x + y) % 3 === 0 ? Wrap.dk : (x + y) % 3 === 1 ? Wrap.b : Wrap.hi; }
    if (info.blade) { const [b0, b1, by] = info.blade; for (let x = b0 + 1; x <= b1 - 2; x++) { const i = by * w + x; if (C.id[i] === M.st) { C.col[i] = St.sh; if (C.id[i - w] === M.st) C.col[i - w] = mix(St.hi, '#f0ece0', 0.25); } } }
    if (rar && rar !== 'common' && rar !== 'uncommon') { let px = -1; for (let x = 0; x < w && px < 0; x++) for (let y = 0; y < h; y++) if (C.id[y * w + x] === M.ir) { px = y * w + x; break; }   // Knaufstein
      if (px >= 0) C.col[px] = { rare: '#4a8ad8', epic: '#a050d0', legendary: '#e8a030', mythic: '#8fe8ff' }[rar] || '#4a8ad8'; }
  }
  let ks = 0; for (const ch of key) ks = (ks * 31 + ch.charCodeAt(0)) | 0;                            // Referenz 3: benutzter Stahl — Rost, Scharten
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) { const i = y * w + x; if ((C.id[i] === M.st || C.id[i] === M.ir) && C.col[i]) { const n = h2(x + ks, y * 5 + ks);
    if (sc !== 1) continue;   // S15 Stil R: keine Einzelpixel-Scharten (Rauschen)
    if (n < 0.03) C.col[i] = mix(C.col[i], '#6a3a1e', 0.35); else if (n > 0.98) C.col[i] = mix(C.col[i], '#0c0b0a', 0.4); } }
  return { g: { w, h, a: C.col.slice(), at: (x, y) => x < 0 || y < 0 || x >= w || y >= h ? null : C.col[y * w + x] }, gx: info.gx, gy: info.gy, blade: info.blade, orb: info.orb, str: info.str, pulse: info.pulse };
}

// =====================================================================================================================
// G4: Tiere im feinen Raster (60×40, 1 Welt je Pixel, Blick nach links). Gemeinsamer Aufbau (Rumpf, 4 Beine mit Gelenken,
// Hals, Kopf, Schwanz), je Art eigene Maße und Merkmale. Posen: '' (stehen/laufen, 4 Schritte), a1 (ducken/Ansage),
// a2 (Sprung/Biss), dead (liegt). Pivot: Pfoten-Mitte (30, 37).
// =====================================================================================================================
export const BEW = 60, BEH = 40, BEOX = 30, BEOY = 37;
const BEAST = {
  //         Rumpf cx,cy,rx,ry | Hüfte vorn/hinten | Beinlänge, -dicke | Kopf x,y,rx,ry | Schnauze bis x | Schwanz
  wolf:     { body: [31, 21, 13, 6.2], fx: 22, hx: 40, leg: 16, lw: 3.4, head: [13, 15, 4.6, 3.8], snout: 5, neck: 1, tail: 'bushy', ear: 'point', mane: 1 },
  wild_dog: { body: [31, 22, 11.5, 5.2], fx: 23, hx: 39, leg: 15, lw: 2.8, head: [15, 16, 4, 3.4], snout: 8, neck: 1, tail: 'sickle', ear: 'flop', ribs: 1, spots: 1 },
  boar:     { body: [31, 22, 14, 8.2], fx: 21, hx: 41, leg: 10, lw: 4.2, head: [13, 22, 6, 5], snout: 4, neck: 0, tail: 'curl', ear: 'small', crest: 1, tusk: 1 },
  bear:     { body: [31, 19, 15, 9.5], fx: 21, hx: 41, leg: 13, lw: 5.6, head: [12, 19, 5.6, 4.8], snout: 5, neck: 0, tail: 'stub', ear: 'round', hump: 1 },
  // S13 (Nutzer, Tiere): Reittiere und Nutztiere
  horse:    { body: [32, 16, 13, 6], fx: 23, hx: 41, leg: 20, lw: 3, head: [13, 8, 3.6, 3.4], snout: 7, neck: 2, tail: 'bushy', ear: 'point', mane: 1 },
  cow:      { body: [31, 19, 15, 8], fx: 21, hx: 41, leg: 13, lw: 4, head: [12, 17, 4.6, 4], snout: 4, neck: 0, tail: 'short', ear: 'small', spots: 1 },
  sheep:    { body: [31, 22, 12, 7.5], fx: 23, hx: 39, leg: 9, lw: 2.6, head: [15, 19, 3.6, 3.2], snout: 3, neck: 0, tail: 'stub', ear: 'flop', mane: 1 },
  deer:     { body: [32, 18, 11, 5.4], fx: 25, hx: 39, leg: 19, lw: 2.4, head: [14, 11, 3.6, 3], snout: 8, neck: 2, tail: 'short', ear: 'long', antler: 1, rump: 1 },
};
export function paintBeast2(type, pal, frame, act) {
  const K = BEAST[type] || BEAST.wolf, C = new Canvas2(BEW, BEH);
  const F = ramp(pal.body || '#5b5145'), D = ramp(pal.dark || '#3a332b'), eye = pal.eye || '#c8a545';
  const belly = ramp(mix(pal.body || '#5b5145', '#c8b89a', type === 'boar' ? 0.1 : 0.3));
  const s = act ? 0 : [1, 0, -1, 0][frame & 3], crouch = act === 'a1' ? 3 : 0, lunge = act === 'a2' ? -3 : 0, up = act === 'a2' ? -2 : 0;
  const dim = (Rm, k) => ({ hi: mix(Rm.hi, '#000', k), b: mix(Rm.b, '#000', k), sh: mix(Rm.sh, '#000', k), dk: mix(Rm.dk, '#000', k) });
  const P = { tail: C.partR('tail', F), legFF: C.partR('legFF', dim(F, 0.3)), legHF: C.partR('legHF', dim(F, 0.3)), body: C.partR('body', F),
    belly: C.partR('belly', belly), legFN: C.partR('legFN', F), legHN: C.partR('legHN', F), neck: C.partR('neck', F), head: C.partR('head', F),
    mane: C.partR('mane', D), ear: C.partR('ear', D), antler: C.partR('antler', ramp('#c9b28a')) };
  const [bx, by, brx, bry] = K.body, cy = by + crouch + up, cx = bx + lunge;
  const ground = 37, L0 = K.leg;
  // Beine: Hüfte → Knie/Sprunggelenk → Pfote. Vorn knickt das Knie nach hinten, hinten das Sprunggelenk nach hinten
  const leg = (pid, hipX, dx, lift, hind) => {
    const hy = Math.min(cy + bry * 0.4, ground - L0 + 2), fx = hipX + dx + lunge, fy = ground - lift;
    const kx = hind ? (hipX + fx) / 2 + 3 : (hipX + fx) / 2 - 1, ky = (hy + fy) / 2 + (hind ? -1 : 1);
    C.limb(pid, [[hipX + lunge, hy], [kx, ky], [fx, fy]], K.lw * 1.25, K.lw * 0.8);
    C.ell(pid, fx - 1, fy, K.lw * 0.7, 1.1);
  };
  leg(P.legFF, K.fx + 3, -s * 4, s < 0 ? 2 : 0, false); leg(P.legHF, K.hx - 3, s * 4, s > 0 ? 2 : 0, true);
  // Schwanz
  const tx = cx + brx - 1, ty = cy - bry * 0.4;
  if (K.tail === 'bushy') C.limb(P.tail, [[tx, ty], [tx + 6, ty + 3 - s], [tx + 11, ty + 9 - s]], 4, 3);
  else if (K.tail === 'sickle') C.limb(P.tail, [[tx, ty], [tx + 5, ty - 4], [tx + 4, ty - 8 + s]], 2, 1.6);
  else if (K.tail === 'curl') C.limb(P.tail, [[tx, ty + 1], [tx + 3, ty - 1], [tx + 2, ty - 3]], 1.4, 1.2);
  else C.ell(P.tail, tx + 2, ty, 2.2, 1.8);
  // Rumpf, Bauch, Buckel/Borstenkamm
  C.ell(P.body, cx, cy, brx, bry);
  if (K.hump) C.ell(P.body, cx - 5, cy - bry * 0.55, brx * 0.55, bry * 0.6);
  C.ell(P.belly, cx - 2, cy + bry * 0.55, brx * 0.7, bry * 0.4);
  // Beine vorn (nahe Seite)
  leg(P.legFN, K.fx, s * 4, s > 0 ? 2 : 0, false); leg(P.legHN, K.hx, -s * 4, s < 0 ? 2 : 0, true);
  // Hals + Kopf
  let [hx, hy, hrx, hry] = K.head; hx += lunge * 1.5; hy += crouch * (type === 'wolf' || type === 'wild_dog' ? 1.6 : 1) + up;
  if (K.neck) C.limb(P.neck, [[cx - brx * 0.6, cy - bry * 0.3], [hx + 3, hy + 1]], K.neck === 2 ? 4 : bry * 1.2, K.neck === 2 ? 3.2 : 5);
  C.ell(P.head, hx, hy, hrx, hry);
  const sn = K.snout + lunge * 1.5;                                  // Schnauze
  C.poly(P.head, [[hx - hrx * 0.5, hy - hry * 0.5], [sn, hy + (type === 'boar' ? 1 : 0)], [sn, hy + hry * 0.7], [hx - hrx * 0.3, hy + hry * 0.8]]);
  if (act === 'a2' && type !== 'deer') C.poly(P.head, [[sn + 1, hy + hry * 0.7], [hx - 2, hy + hry], [sn + 2, hy + hry + 2.5]]);   // Unterkiefer offen
  // Ohren
  if (K.ear === 'point') { C.poly(P.ear, [[hx - 1, hy - hry + 1], [hx + 1, hy - hry - 4], [hx + 3, hy - hry + 1]]); }
  else if (K.ear === 'flop') C.poly(P.ear, [[hx + 1, hy - hry + 1], [hx + 4, hy - hry], [hx + 5, hy + 1], [hx + 3, hy + 2]]);
  else if (K.ear === 'long') C.poly(P.ear, [[hx + 1, hy - hry + 1], [hx + 6, hy - hry - 2], [hx + 3, hy - hry + 2]]);
  else if (K.ear === 'round') C.ell(P.ear, hx + 2, hy - hry + 0.5, 1.8, 1.6);
  else C.poly(P.ear, [[hx, hy - hry + 1], [hx + 2, hy - hry - 2], [hx + 3, hy - hry + 1]]);
  // Mähne (Wolf): gesträubtes Nackenfell
  if (K.mane) C.poly(P.mane, [[hx + 3, hy - 2], [hx + 7, hy - 3], [cx - brx * 0.5, cy - bry - 1], [cx - brx * 0.2, cy - bry + 1], [hx + 6, hy + 3]]);
  if (K.crest) for (let i = 0; i < 7; i++) C.poly(P.mane, [[cx - 9 + i * 3, cy - bry + 1], [cx - 8 + i * 3, cy - bry - 2 - (i % 2)], [cx - 6 + i * 3, cy - bry + 1]]);   // Borstenkamm
  if (K.antler) { const ax = hx + 1, ay = hy - hry; C.limb(P.antler, [[ax, ay], [ax + 1, ay - 5], [ax - 2, ay - 9]], 1.2, 1); C.limb(P.antler, [[ax + 1, ay - 5], [ax + 4, ay - 8]], 1, 1);
    C.limb(P.antler, [[ax - 1, ay - 7], [ax - 4, ay - 8]], 1, 1); }
  C.shade();
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < BEW && y < BEH) C.col[y * BEW + x] = c; };
  set(hx - hrx * 0.35, hy - 1, eye); set(hx - hrx * 0.35 + 1, hy - 1, '#1b1411');                 // Auge
  set(sn, hy + (type === 'boar' ? 1 : 0), '#0d0b0a'); set(sn + 1, hy + 1, '#0d0b0a');              // Nase
  if (K.tusk) { set(sn + 3, hy + hry * 0.6, '#e0d6bc'); set(sn + 3, hy + hry * 0.6 - 1, '#e0d6bc'); set(sn + 2, hy + hry * 0.6 - 2, '#e0d6bc'); }
  if (act === 'a2' && type !== 'deer') for (let i = 0; i < 4; i++) set(sn + 1 + i * 1.5, hy + hry * 0.7 + 1, i % 2 ? '#0d0b0a' : '#e0d6bc');   // Zähne
  if (K.ribs) for (const x of [-3, 0, 3]) { set(cx + x, cy - 1, F.sh); set(cx + x, cy, F.sh); }
  if (K.spots) for (const [dx, dy] of [[-5, -3], [4, -2], [7, 1], [-1, -4]]) { set(cx + dx, cy + dy, D.b); set(cx + dx + 1, cy + dy, D.b); }
  if (K.rump) for (let y = -2; y <= 2; y++) { set(cx + brx - 1, cy + y, '#e8dcc4'); set(cx + brx - 2, cy + y, '#d8ccb4'); }
  if (type === 'wolf') for (let i = 0; i < 5; i++) set(cx - 6 + i * 3, cy - bry + 1, F.hi);        // Fellspitzen im Licht
  return { w: BEW, h: BEH, a: C.col.slice(), at: (x, y) => x < 0 || y < 0 || x >= BEW || y >= BEH ? null : C.col[y * BEW + x] };
}
