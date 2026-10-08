// Designvorschläge Gebäude (Session 10, Stil D). Nur Vorschau — im Browser mit ?dev: `await import('/docs/design/haus_vorschlaege.js')`.
// Raster wie die Welt: 1 Texel = 2 Welt. Figur (Stil D, 1,5 Welt/Pixel) daneben als Maßstab. Tür ≈ Figurenhöhe.
import { G, toCanvas, ramp, mix, humanFrame, humanSpec, blit } from '../../src/sprites.js';

let sd = 11; const rn = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
const W = 84, H = 100, RY = 46, RIDGE = 18;           // Dach 0..RY, Fassade RY..H
const X0 = 6, X1 = 78;                                  // Fassade
const OUT = '#0c0a08';

function roof(g, kind, col, opt = {}) {
  const R = ramp(col), moss = ramp('#4a5a30');
  const blobs = opt.moss ? Array.from({ length: 7 }, () => [4 + rn() * (W - 8), RIDGE + 8 + rn() * (RY - RIDGE - 6), 3 + rn() * 5]) : [];   // Moospolster, dichter zur Traufe
  for (let y = 2; y < RY + 2; y++) for (let x = 1; x < W - 1; x++) {
    const back = y < RIDGE;                                // hintere Fläche: Licht von oben
    let c;
    if (kind === 'thatch') {
      const row = (y - RIDGE + 30) % 3 === 2;
      c = back ? (rn() < 0.35 ? R.hi : R.b) : (rn() < 0.22 ? R.b : R.sh);
      if (row) c = back ? R.b : R.dk;
      if (!back && ((x * 7 + y * 3) % 11 === 0)) c = R.dk;  // Halmbündel
    } else if (kind === 'slate') {
      const ty = y % 5, off = ((y / 5) | 0) % 2 ? 3 : 0, tx = (x + off) % 7;
      c = back ? R.b : R.sh; if (ty === 0) c = back ? R.hi : R.b; if (ty === 4 || tx === 0) c = R.dk;
      if (rn() < 0.05) c = mix(c, '#000', 0.3);
    } else {                                                // Holzschindeln
      const ty = y % 4, off = ((y / 4) | 0) % 2 ? 2 : 0, tx = (x + off) % 5;
      c = back ? (rn() < 0.3 ? R.hi : R.b) : (rn() < 0.3 ? R.b : R.sh); if (ty === 3 || tx === 0) c = R.dk;
    }
    if (!back && blobs.some(([bx, by, br]) => (x - bx) ** 2 + ((y - by) * 1.6) ** 2 < br * br * (0.6 + rn() * 0.5))) c = rn() < 0.3 ? moss.hi : rn() < 0.6 ? moss.b : moss.sh;
    if (x < 3 || x > W - 4) c = R.dk;                       // Ortgang
    g.p(x, y, c);
  }
  for (let x = 1; x < W - 1; x++) { g.p(x, RIDGE, R.dk); g.p(x, RIDGE - 1, R.hi); }   // First
  // Traufe: ausgefranst bei Stroh, gerade bei Schiefer/Schindel
  for (let x = 1; x < W - 1; x++) { const d = kind === 'thatch' ? (rn() * 3) | 0 : 0; for (let k = 0; k <= d; k++) g.p(x, RY + 2 + k, k === d ? R.dk : R.sh); }
  if (opt.holes) for (const [hx, hy, hw, hh] of opt.holes) {   // eingebrochen: Sparren sichtbar
    for (let y = hy; y < hy + hh; y++) for (let x = hx; x < hx + hw; x++) g.p(x, y, (x - hx) % 4 === 1 ? '#3a2a1c' : '#120e0b');
  }
}
function eaveShadow(g) { for (let y = RY + 2; y < RY + 7; y++) for (let x = X0; x < X1; x++) { const c = g.at(x, y); if (c) g.p(x, y, mix(c, '#0a0808', y < RY + 5 ? 0.6 : 0.3)); } }
function plinth(g, col, rows = 3) {
  const R = ramp(col);
  for (let y = H - rows * 3 - 1; y < H - 1; y++) for (let x = X0; x < X1; x++) {
    const r = ((y - (H - rows * 3 - 1)) / 3) | 0, off = r % 2 ? 3 : 0, bx = (x + off) % 6;
    g.p(x, y, (y - (H - 1)) % 3 === 0 || bx === 0 ? R.dk : rn() < 0.3 ? R.hi : R.b);
  }
}
function door(g, cx, h, col, opt = {}) {
  const R = ramp(col), I = ramp('#4a4640'), w = 14, x0 = cx - w / 2, y1 = H - 1, y0 = y1 - h;
  for (let y = y0 - 2; y < y1; y++) for (let x = x0 - 2; x < x0 + w + 2; x++) g.p(x, y, '#1c140e');   // Zarge
  for (let y = y0; y < y1; y++) for (let x = x0; x < x0 + w; x++) {
    if (opt.arch && y < y0 + 4 && Math.abs(x - cx + 0.5) > 2 + (y - y0) * 1.5) continue;
    g.p(x, y, (x - x0) % 4 === 0 ? R.dk : x < x0 + 2 ? R.hi : R.b);
  }
  for (const yy of [y0 + 5, y1 - 6]) for (let x = x0; x < x0 + w; x++) g.p(x, yy, I.b);   // Eisenbänder
  g.p(x0 + w - 3, (y0 + y1) >> 1, '#c8a545');
  if (opt.plague) { const P = '#8c2a20'; for (let k = -4; k <= 4; k++) { g.p(cx + k, (y0 + y1) / 2 | 0, P); g.p(cx, ((y0 + y1) / 2 | 0) + k, P); } }
}
function window_(g, x, y, opt = {}) {
  const w = 8, h = 9;
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) g.p(x + i, y + j, '#1a120c');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g.p(x + i, y + j, opt.lit ? (j < 3 ? '#e0a050' : '#b06a2a') : (j < 2 ? '#2a3440' : '#141a22'));
  for (let j = 0; j < h; j++) g.p(x + 3, y + j, '#1a120c'); for (let i = 0; i < w; i++) g.p(x + i, y + 4, '#1a120c');
  if (opt.boarded) for (let k = 0; k < 3; k++) for (let i = -1; i <= w; i++) g.p(x + i, y + 1 + k * 3 + ((i + k) % 5 === 0 ? 1 : 0), k % 2 ? '#5a4632' : '#6a553c');
  if (opt.shutters) { const S = ramp('#3e4a3a'); for (let j = 0; j < h; j++) { g.p(x - 3, y + j, S.b); g.p(x - 2, y + j, S.sh); g.p(x + w + 1, y + j, S.b); g.p(x + w + 2, y + j, S.sh); } }
}
function grime(g, from, k = 0.35) {                         // Feuchte/Schmutz steigt vom Boden auf
  for (let y = from; y < H; y++) for (let x = X0; x < X1; x++) { const c = g.at(x, y); if (c && rn() < (y - from) / (H - from) * k * 2) g.p(x, y, mix(c, '#1d1a14', 0.35)); }
}

// --- V1: Fachwerk, düster (gealterter Putz, schwere Balken, Strohdach mit Moos) -------------------------------------
function v1(g, ruin) {
  roof(g, 'thatch', '#6a5634', { moss: true, holes: ruin ? [[16, 21, 14, 9], [50, 28, 10, 8], [66, 6, 8, 6]] : null });
  const P = ramp(ruin ? '#6e6658' : '#7c7262'), T = ramp('#2e2219');
  for (let y = RY + 2; y < H - 1; y++) for (let x = X0; x < X1; x++) g.p(x, y, rn() < 0.12 ? P.sh : rn() < 0.1 ? P.hi : P.b);
  for (const bx of [X0, X0 + 18, X0 + 36, X0 + 54, X1 - 3]) for (let y = RY + 2; y < H - 1; y++) { g.p(bx, y, T.b); g.p(bx + 1, y, T.b); g.p(bx + 2, y, T.dk); }
  for (let x = X0; x < X1; x++) { g.p(x, RY + 2, T.dk); g.p(x, RY + 3, T.b); g.p(x, RY + 21, T.b); g.p(x, RY + 22, T.dk); }
  for (let i = 0; i < 14; i++) { g.p(X0 + 3 + i, RY + 21 - i, T.b); g.p(X0 + 4 + i, RY + 21 - i, T.dk); g.p(X0 + 69 - i, RY + 21 - i, T.b); g.p(X0 + 68 - i, RY + 21 - i, T.dk); }   // Streben
  if (ruin) for (let i = 0; i < 40; i++) { const x = X0 + 40 + (rn() * 12 | 0), y = RY + 8 + (rn() * 10 | 0); g.p(x, y, (x % 2) ? '#4a3a2a' : '#2a2018'); }   // abgeplatzter Putz: Lattung
  plinth(g, '#4a4640', 3); eaveShadow(g);
  window_(g, X0 + 8, RY + 9, { shutters: true, boarded: ruin }); window_(g, X0 + 58, RY + 9, { shutters: true, lit: !ruin });
  door(g, 42, 30, ruin ? '#3a2a1c' : '#4a3424', { plague: ruin });
  grime(g, H - 16, ruin ? 0.6 : 0.35);
}
// --- V2: Stein & Schiefer (Feldstein, Schieferdach, Rundbogentür, Schornstein) ---------------------------------------
function v2(g) {
  roof(g, 'slate', '#4a5058');
  const C = ramp('#3e3a36'); for (let y = 0; y < 16; y++) for (let x = 58; x < 67; x++) g.p(x, y + 4, y < 2 ? '#1a1612' : x === 58 ? C.hi : x > 64 ? C.sh : (y % 4 === 0 || (x + (y / 4 | 0) * 2) % 5 === 0) ? C.dk : C.b);   // Schornstein
  const S = ramp('#6a645a');
  for (let y = RY + 2; y < H - 1; y++) for (let x = X0; x < X1; x++) {   // unregelmäßige Feldsteine
    const r = (y - RY) / 5 | 0, off = (r * 7) % 9, bx = (x + off) % 9, by = (y - RY) % 5;
    g.p(x, y, by === 0 || bx === 0 ? S.dk : by === 1 && bx < 4 ? S.hi : ((x * 13 + r * 5) % 7 === 0 ? S.sh : S.b));
  }
  eaveShadow(g);
  window_(g, X0 + 9, RY + 12); window_(g, X0 + 55, RY + 12, { lit: true });
  door(g, 42, 30, '#3a2a1e', { arch: true });
  for (let x = 30; x < 55; x++) g.p(x, H - 34, S.dk);        // Sturzbalken aus Stein
  grime(g, H - 12, 0.4);
}
// --- V3: Langhaus (dunkle Bohlen, Schindeldach, Giebelhörner, Laterne) -----------------------------------------------
function v3(g) {
  roof(g, 'shingle', '#4a3a2c', { moss: true });
  const Hn = ramp('#cfc2a0'); for (const [x, s] of [[2, -1], [W - 3, 1]]) for (let k = 0; k < 7; k++) { g.p(x + s * (k > 3 ? k - 3 : 0), RIDGE - 2 - k, k > 4 ? Hn.hi : Hn.b); }   // Hörner am First
  const B = ramp('#4a3626');
  for (let y = RY + 2; y < H - 1; y++) for (let x = X0; x < X1; x++) { const bx = (x - X0) % 6; g.p(x, y, bx === 0 ? B.dk : bx === 1 ? B.hi : ((y * 5 + x) % 17 === 0 ? B.sh : B.b)); }
  plinth(g, '#3a3632', 2); eaveShadow(g);
  window_(g, X0 + 10, RY + 12, { lit: true });
  door(g, 44, 30, '#2e2016');
  const Sh = ramp('#6a2a22'); for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) if ((i - 4) ** 2 + (j - 4) ** 2 < 19) g.p(61 + i, RY + 10 + j, (i + j) % 5 === 0 ? Sh.hi : i > 4 ? Sh.sh : Sh.b);   // Schild an der Wand
  g.p(65, RY + 14, '#c8a545');
  for (let k = 0; k < 4; k++) g.p(33, RY + 8 + k, '#1a120c'); for (const [dx, dy, c] of [[-1, 12, '#1a120c'], [0, 12, '#e8b060'], [1, 12, '#1a120c'], [0, 13, '#f0c070'], [-1, 14, '#1a120c'], [0, 14, '#1a120c'], [1, 14, '#1a120c']]) g.p(33 + dx, RY + dy, c);   // Laterne
  grime(g, H - 12, 0.3);
}

// Boden je Variante (ohne Kontur): Hof-Schlamm, Pflaster, Holzsteg, verwildert
function ground(kind, w, h) {
  const g = new G(w, h), M = ramp('#4a3e2e'), C = ramp('#5a5650'), Wd = ramp('#5a4430'), Gr = ramp('#3c4a2c');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c;
    if (kind === 'mud') { c = rn() < 0.2 ? M.sh : rn() < 0.1 ? M.hi : M.b; if (Math.abs(y - h * 0.55 - Math.sin(x * 0.2) * 2) < 1.2) c = M.dk;   // Fahrspur
      if ((x - 60) ** 2 / 60 + (y - 14) ** 2 / 6 < 1) c = (x + y) % 5 ? '#2a3038' : '#44505a'; }                   // Pfütze
    else if (kind === 'cobble') { const r = y / 4 | 0, bx = (x + (r % 2) * 3) % 6, by = y % 4; c = bx === 0 || by === 0 ? (rn() < 0.4 ? M.b : M.dk) : by === 1 && bx < 3 ? C.hi : rn() < 0.2 ? C.sh : C.b; }
    else if (kind === 'boards') { c = y < 12 ? ((x % 7 === 0) ? Wd.dk : (y % 12 === 0 ? Wd.hi : Wd.b)) : rn() < 0.2 ? M.sh : M.b; }
    else { c = rn() < 0.25 ? Gr.sh : rn() < 0.12 ? Gr.hi : Gr.b; if (rn() < 0.04) c = '#5a6a34'; if ((x * 3 + y) % 23 === 0) c = M.b; }
    g.p(x, y, c);
  }
  if (kind === 'wild') for (let i = 0; i < 26; i++) { const x = rn() * w | 0, y = rn() * 8 | 0; for (let k = 0; k < 3; k++) g.p(x + (k % 2), y + k, k ? Gr.sh : '#6a7a3a'); }   // Unkraut an der Wand
  return toCanvas(g, false);
}

const DES = [
  ['V1 · Fachwerk düster', 'gealterter Putz, schwere Balken, Stroh mit Moos, Steinsockel', g => v1(g, false), 'mud'],
  ['V2 · Stein & Schiefer', 'Feldstein, Schiefer, Rundbogen, Schornstein — Stadt/Burg', v2, 'cobble'],
  ['V3 · Langhaus', 'dunkle Bohlen, Schindeln, Giebelhörner, Schild, Laterne', v3, 'boards'],
  ['V4 · verfallen / Pest', 'V1 eingestürzt: Dachlöcher, Bretter, Pestkreuz, Unkraut', g => v1(g, true), 'wild'],
];
export async function render(sink = 'http://127.0.0.1:8771/haus-vorschlaege.png') {
  const Z = 4, cellW = (W + 34) * Z, out = document.createElement('canvas'); out.width = cellW * DES.length + 20; out.height = (H + 40) * Z + 80;
  const o = out.getContext('2d'); o.imageSmoothingEnabled = false; o.fillStyle = '#2a2622'; o.fillRect(0, 0, out.width, out.height);
  o.fillStyle = '#f0e6cd'; o.font = '15px sans-serif'; o.fillText('Gebäude-Vorschläge (Stil D) · Raster wie die Welt, Figur als Maßstab — Tür ≈ Figurenhöhe', 12, 22);
  const pl = humanFrame(humanSpec({ kind: 'player', pal: { skin: '#b08a68', hair: '#2b2118', cloth: '#3a2d23' }, hooded: true, equip: {} }), 'S', 'i0');
  DES.forEach(([name, sub, paint, gk], i) => {
    sd = 11 + i * 97;
    const x0 = 10 + i * cellW, y0 = 40, gr = ground(gk, W + 30, 44);
    o.drawImage(gr, x0, y0 + (H - 8) * Z, gr.width * Z, gr.height * Z);
    const g = new G(W, H); paint(g); const cv = toCanvas(g);
    o.fillStyle = 'rgba(0,0,0,.35)'; o.fillRect(x0 + 4 * Z, y0 + (H - 1) * Z, (W + 2) * Z, 4 * Z);   // Schlagschatten
    o.drawImage(cv, x0, y0, W * Z, H * Z);
    o.save(); o.translate(x0 + (W + 18) * Z, y0 + (H + 8) * Z); o.scale(Z / 2, Z / 2); blit(o, pl, 0, 0); o.restore();   // Figur (1 Texel = 2 Welt)
    o.fillStyle = '#f0e6cd'; o.font = 'bold 15px sans-serif'; o.fillText(name, x0, y0 + (H + 40) * Z + 6);
    o.fillStyle = '#b8ab90'; o.font = '12px sans-serif'; o.fillText(sub, x0, y0 + (H + 40) * Z + 24);
  });
  if (sink) await fetch(sink, { method: 'POST', body: out.toDataURL('image/png') });
  return out;
}
