// Gebäude als Pixel-Art (3/4-Aufsicht): Dach über dem Grundriss, sichtbare Vorderfassade, Funktionsdetails.
// Jedes Gebäude ist ein Datensatz (world.js → HOUSES): Typ, Stadt, Grundriss, Tür. Stil = Stadt (Material) + Typ (Funktion).
//
// Regeln (STYLE_GUIDE):
//   Maßstab   1 Texel = 2 Welt-Einheiten (wie Figuren). Eine Kachel = 16 Texel.
//   Aufbau    Dach bedeckt den Grundriss bis zur Traufe; darunter FH Texel Vorderwand (Tür, Fenster, Schild).
//             Über dem Grundriss ragt das Dach RISE Texel auf (Höhe) — Figuren dahinter werden verdeckt.
//   Licht     oben links: Nordhang heller, Südhang Grundton, zur Traufe dunkler; Traufkante tiefdunkel.
//   Material  Dach: Stroh / Holzschindel / Schiefer / Ziegel. Wand: Fachwerk / Holz / Stein / Putz / heller Stein.
//   Funktion  von außen lesbar: Schild mit Symbol, Esse mit Glut, Banner, Kräuterbündel, Rosette, Wappen.
import { G, toCanvas, ramp, mix } from './sprites.js';

const hh = (x, y, s = 0) => { let n = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };

// Stadt → Bauweise. Arm/einfach/wohlhabend spiegelt sich im Material.
export const TOWN_STYLE = {
  eren:      { roof: 'thatch',  wall: 'timber' },     // Dorf: Stroh, Fachwerk
  northcity: { roof: 'shingle', wall: 'stone' },      // Grenzstadt: Schindeln, Bruchstein
  saltport:  { roof: 'tile',    wall: 'plaster' },    // Hafen: Ziegel, Putz
  kreuzweg:  { roof: 'shingle', wall: 'wood' },       // Söldnerstadt: Holz
  ashford:   { roof: 'slate',   wall: 'stone' },      // befestigter Posten: Schiefer
  sonnwacht: { roof: 'slate',   wall: 'palestone' },  // Orden: heller Stein
};
const ROOF = { thatch: '#7a6238', shingle: '#5b4a3c', slate: '#4a525c', tile: '#7c4432' };
const WALL = { timber: '#b1a283', wood: '#5d4632', stone: '#6c665c', plaster: '#a89a7e', palestone: '#9b968a' };
const BEAM = '#3e2e20', DOORW = '#4a3322', IRON = '#35332f';
const SHUTTER = ['#4a5a3a', '#5a3a2a', '#3a4a5a', '#5a5030'];

// Funktion → Merkmale. label: was man beim Anschauen liest.
export const BTYPES = {
  tavern:   { label: 'Taverne',        chimney: 1, sign: 'tankard', big: 1 },
  smithy:   { label: 'Schmiede',       chimney: 1, sign: 'hammer', forge: 1 },
  healer:   { label: 'Heilerhaus',     sign: 'herb', herbs: 1 },
  hall:     { label: 'Haus des Vorstehers', banner: 'valen', bigDoor: 1, chimney: 1 },
  kontor:   { label: 'Handelskontor',  sign: 'scales', sacks: 1 },
  barracks: { label: 'Wachhaus',       banner: 'valen', crest: 1 },
  chapel:   { label: 'Kapelle',        rose: 1, cross: 1, bigDoor: 1 },
  merc:     { label: 'Söldnerhalle',   sign: 'swords', banner: 'merc' },
  house:    { label: 'Wohnhaus',       chimney: 0.5, flowers: 0.5, woodpile: 0.5 },
};

// 5×4-Symbole für Schilder ('#' = Farbe, '+' = Licht)
const ICON = {
  tankard: ['.###.', '+##.#', '.##.#', '.###.'],
  hammer:  ['####.', '####.', '..#..', '..#..'],
  herb:    ['.#.#.', '##.##', '.###.', '..#..'],
  scales:  ['#.#.#', '#####', '..#..', '.###.'],
  swords:  ['#...#', '.#.#.', '..#..', '.#.#.'],
};

// Wandhöhe FH: höher als eine Figur (25 Texel inkl. Kopf ≈ Tür 16). Firsthöhe RISE wächst mit der Tiefe.
export function houseDims(b) { const RISE = 10 + b.h * 2, FH = b.big || BTYPES[b.type]?.big ? 24 : 21; return { OV: 2, RISE, FH, W: b.w * 16 + 4, H: RISE + b.h * 16 + 1 }; }
const ridgeOf = eave => Math.max(4, Math.round(eave * 0.3));

// Schornstein-Mündung in Texeln (für Rauch im Renderer) oder null. Gleiche Würfel wie beim Zeichnen.
export function chimneyOf(b) {
  const T = BTYPES[b.type] || BTYPES.house, { RISE, FH, W } = houseDims(b);
  const on = T.forge || (T.chimney && (T.chimney >= 1 || hh(b.x, b.y, 7 + 'chimney'.length) < T.chimney));
  if (!on) return null;
  const eave = RISE + b.h * 16 - FH + 1, ridge = ridgeOf(eave);
  return { x: Math.round(W * (hh(4, 4, b.seed || 1) > 0.5 ? 0.7 : 0.24)) + 3, y: ridge - 10, soot: !!T.forge };
}

export function houseSprite(b, lit) {
  const T = BTYPES[b.type] || BTYPES.house, st = TOWN_STYLE[b.town] || TOWN_STYLE.eren;
  const roofKind = b.roof || st.roof, wallKind = b.wall || st.wall;
  const { OV, RISE, FH, W, H } = houseDims(b), s = b.seed || 1;
  const g = new G(W, H);
  const n = (x, y) => hh(x, y, s);
  const yF = RISE + b.h * 16 - FH, yB = RISE + b.h * 16;           // Fassade oben / Grundlinie
  const fx0 = OV, fx1 = OV + b.w * 16 - 1;                           // Fassade links/rechts
  const has = k => T[k] && (T[k] >= 1 || hh(b.x, b.y, 7 + k.length) < T[k]);

  // ---- Fassade ----
  const Wr = ramp(mix(WALL[wallKind], '#806a50', (n(3, 3) - 0.5) * 0.18)), Br = ramp(BEAM);
  for (let y = yF; y < yB; y++) for (let x = fx0; x <= fx1; x++) {
    let c = Wr.b; const r = n(x, y);
    if (wallKind === 'stone' || wallKind === 'palestone') {
      const bw = wallKind === 'stone' ? 5 : 7, row = ((y - yF) / 3) | 0, xo = (x - fx0 + (row & 1) * 3) % bw;
      c = (y - yF) % 3 === 2 || xo === 0 ? Wr.sh : xo === 1 && (y - yF) % 3 === 0 ? Wr.hi : r > 0.9 ? mix(Wr.b, Wr.sh, 0.4) : Wr.b;
    } else if (wallKind === 'wood') {
      const xo = (x - fx0) % 3; c = xo === 0 ? Wr.dk : xo === 1 ? Wr.hi : Wr.b; if (r > 0.95) c = Wr.sh;
    } else {                                                       // Fachwerk/Putz: Putzfläche mit Flecken
      c = r > 0.93 ? mix(Wr.b, Wr.sh, 0.5) : r < 0.05 ? Wr.hi : Wr.b;
    }
    g.p(x, y, c);
  }
  if (wallKind === 'timber') {                                     // Balkenwerk: Schwelle, Rähm, Ständer, Streben
    for (let x = fx0; x <= fx1; x++) { g.p(x, yF, Br.b); g.p(x, yF + 1, Br.sh); g.p(x, yB - 3, Br.b); }
    for (let x = fx0; x <= fx1; x += 13) for (let y = yF; y < yB - 2; y++) { g.p(x, y, Br.b); g.p(x + 1, y, Br.sh); }
    for (let x = fx0 + 2; x + 11 <= fx1; x += 13) if (n(x, 1) > 0.45) for (let k = 0; k < 8; k++) { g.p(x + k, yF + 2 + k, Br.sh); g.p(x + k + 1, yF + 2 + k, Br.b); }
  }
  for (let x = fx0; x <= fx1; x++) { g.p(x, yB - 2, '#4a463f'); g.p(x, yB - 1, '#34312c'); if (n(x, 9) > 0.7) g.p(x, yB - 3, mix(Wr.b, '#3a3a2a', 0.5)); }   // Sockel, Spritzschmutz
  for (let x = fx0; x <= fx1; x++) g.p(x, yF, mix(g.at(x, yF) || Wr.b, '#120e0c', 0.45));   // Schatten unter der Traufe

  // ---- Tür & Fenster ----
  const midT = b.w >> 1, big = has('bigDoor');
  const dw = big ? 12 : 8, dh = FH - 6, dx = fx0 + midT * 16 + ((16 - dw) >> 1), dy = yB - 2 - dh;
  const door = (x0, y0, w, hgt) => {
    const D = ramp(DOORW);
    g.r(x0 - 1, y0 - 1, w + 2, hgt + 1, Br.dk);
    for (let y = y0; y < y0 + hgt; y++) for (let x = x0; x < x0 + w; x++) g.p(x, y, (x - x0) % 3 === 0 ? D.sh : (x - x0) % 3 === 1 ? D.hi : D.b);
    if (w >= 10) for (let y = y0; y < y0 + hgt; y++) g.p(x0 + (w >> 1), y, D.dk);   // Doppeltür
    g.p(x0 + w - 2, y0 + (hgt >> 1), '#b89a5a'); g.r(x0, y0 + 2, w, 1, IRON); g.r(x0, y0 + hgt - 3, w, 1, IRON);
    g.r(x0 - 1, y0 + hgt, w + 2, 1, '#57524a');                    // Stufe
  };
  if (b.door === 'S') door(dx, dy, dw, dh);
  else if (b.door === 'W') door(fx0 + 1, dy + 2, 4, dh - 2);
  else if (b.door === 'E') door(fx1 - 4, dy + 2, 4, dh - 2);
  const shut = SHUTTER[(n(5, 5) * SHUTTER.length) | 0];
  const win = (x0, y0) => {
    g.r(x0 - 1, y0 - 1, 8, 8, Br.dk); g.r(x0 - 1, y0 + 6, 8, 1, '#8a8274');            // Rahmen, Fensterbank
    for (let y = y0; y < y0 + 6; y++) for (let x = x0; x < x0 + 6; x++)
      g.p(x, y, lit ? (x === x0 + 2 || y === y0 + 2 ? '#8a5020' : (x + y) % 3 ? '#e2a95a' : '#f2cf8a') : (x === x0 + 2 || y === y0 + 2 ? Br.dk : x === x0 + 1 && y === y0 + 1 ? '#6a7480' : y > y0 + 3 ? '#15181c' : '#1d2126'));
    if (wallKind === 'timber' || wallKind === 'wood') { const Sr = ramp(shut); g.r(x0 - 3, y0, 2, 6, Sr.b); g.p(x0 - 3, y0, Sr.hi); g.p(x0 - 3, y0 + 3, Sr.dk); g.r(x0 + 7, y0, 2, 6, Sr.sh); g.p(x0 + 7, y0 + 3, Sr.dk); }
    return [x0, y0];
  };
  const wins = [];
  const slots = Math.max(1, Math.floor((b.w * 16 - 8) / 16));
  for (let i = 0; i < slots + 1; i++) {
    const cx = fx0 + 5 + Math.round(i * (b.w * 16 - 16) / Math.max(1, slots));
    if (b.door === 'S' && cx + 8 > dx - 3 && cx < dx + dw + 3) continue;
    if (T.forge && i === 0) continue;
    if ((b.door === 'W' && cx < fx0 + 8) || (b.door === 'E' && cx > fx1 - 12)) continue;
    wins.push(win(cx, yF + 5));
  }

  // ---- Dach ----
  // Walmdach (Stroh, Ziegel) oder Satteldach mit Giebelbrettern (Schindel, Schiefer). Licht von Nordwest:
  // Nordhang und Westwalm hell, Südhang Grundton → Traufe dunkel, Ostwalm im Schatten. Material in Lagen.
  const R = ramp(mix(ROOF[roofKind], '#6a5a48', (n(1, 2) - 0.5) * 0.25));
  const eave = yF + 1, ridge = ridgeOf(eave), hip = roofKind === 'thatch' || roofKind === 'tile';
  const hw = hip ? Math.min(Math.round(W * 0.2), eave - ridge) : 0;
  const wet = (x, y) => hh((x / 6) | 0, (y / 4) | 0, s + 11);            // grobe Flecken: Nässe, Moos, Ausbesserung
  for (let y = 0; y <= eave; y++) for (let x = 0; x < W; x++) {
    const d = y < ridge ? (ridge - y) / ridge : (y - ridge) / Math.max(1, eave - ridge);
    const hipX = hw * (1 - d);                                            // Walmgrenze in dieser Zeile
    if ((y === 0 && (x < 2 || x >= W - 2)) || (y === 1 && (x < 1 || x >= W - 1))) continue;   // abgerundete Ecken oben
    let face = y < ridge ? 'N' : 'S', c;
    if (hip && x < hipX) face = 'W'; else if (hip && x > W - 1 - hipX) face = 'E';
    if (face === 'N') c = mix(R.hi, R.b, 0.25);
    else if (face === 'W') c = mix(R.hi, R.b, 0.55);
    else if (face === 'E') c = mix(R.b, R.sh, 0.7);
    else c = d < 0.55 ? R.b : mix(R.b, R.sh, (d - 0.55) / 0.45 * 0.85);
    const r = n(x, y), row = y - ridge + 400;
    if (roofKind === 'thatch') {
      const k = row % 4;
      if (k === 3) c = mix(c, R.dk, 0.45); else if (k === 0) c = mix(c, R.hi, 0.18);        // Lagen: Schatten der nächsten Lage
      if ((x + ((row / 4) | 0)) % 2) c = mix(c, R.sh, 0.12);                              // Halmrichtung
      if (r > 0.86) c = mix(c, R.hi, 0.45); else if (r < 0.08) c = mix(c, R.dk, 0.4);
    } else if (roofKind === 'tile') {
      const k = row % 4, cx = (x + (((row / 4) | 0) & 1) * 2) % 4;
      c = k === 3 ? mix(c, R.dk, 0.65) : cx === 0 ? mix(c, R.hi, 0.35) : cx === 3 ? mix(c, R.sh, 0.45) : c;
    } else {                                                                // Schindel / Schiefer: versetzte Plättchen
      const bw = roofKind === 'slate' ? 5 : 4, rw = (row / 3) | 0, xo = (x + (rw & 1) * 2) % bw;
      const tone = hh(((x + (rw & 1) * 2) / bw) | 0, rw, s);
      if (row % 3 === 2) c = mix(c, R.dk, 0.7); else if (xo === 0) c = mix(c, R.sh, 0.55);
      else if (tone > 0.82) c = mix(c, R.hi, 0.28); else if (tone < 0.12) c = mix(c, R.dk, 0.35);
    }
    const w = wet(x, y);
    if (w > 0.8 && face !== 'N') c = mix(c, roofKind === 'thatch' ? '#3e3a26' : '#3a4230', 0.3);   // Nässe/Moos
    if (y > eave - 3 && n(x, y + 40) > 0.9 && roofKind !== 'tile') c = mix(c, '#4a5a32', 0.55);
    if (hip && Math.abs(x - hipX) < 0.8 || hip && Math.abs(x - (W - 1 - hipX)) < 0.8) c = mix(c, R.dk, 0.55);   // Gratlinien
    if (y === eave) c = R.dk;
    g.p(x, y, c);
  }
  for (let x = hw; x < W - hw; x++) {                                      // First: Kappe mit Bindungen
    g.p(x, ridge, R.dk); g.p(x, ridge - 1, (x % 6 === 0 && roofKind === 'thatch') ? R.sh : mix(R.hi, '#f2e3c2', 0.15));
    if (roofKind === 'thatch') g.p(x, ridge + 1, mix(R.b, R.dk, 0.35));
  }
  if (!hip) for (let y = 1; y <= eave; y++) { g.p(0, y, Br.dk); g.p(1, y, Br.sh); g.p(W - 1, y, Br.dk); g.p(W - 2, y, Br.b); }   // Ortgang
  if (roofKind === 'thatch') for (let x = 1; x < W - 1; x++) if (n(x, 77) > 0.45) g.p(x, eave + 1, n(x, 78) > 0.5 ? R.sh : R.dk);   // Strohfransen
  for (let x = 2; x < W - 2; x++) if (!g.at(x, eave + 1) || n(x, 79) > 0.4) g.p(x, eave + 1, mix(g.at(x, eave + 1) || '#2a2218', '#0c0a08', 0.5));   // Traufschatten auf der Wand
  if (b.door === 'N') { const nx = fx0 + midT * 16 + 4; g.r(nx - 1, 0, 10, 3, Br.dk); g.r(nx, 1, 8, 1, DOORW); }       // Hintertür: Vordach

  // ---- Funktion von außen ----
  const chimX = Math.round(W * (n(4, 4) > 0.5 ? 0.7 : 0.24));
  if (has('chimney') || T.forge) {                                          // gemauerter Schornstein mit Schlagschatten
    const C = ramp('#6c665c'), top = ridge - 9;
    for (let y = top + 2; y < ridge + 4; y++) for (let x = chimX + 7; x < chimX + 10; x++) g.p(x, y + 2, mix(g.at(x, y + 2) || R.b, '#0c0a08', 0.45));
    for (let y = top; y < ridge + 4; y++) for (let x = chimX; x < chimX + 7; x++) {
      const row = (y - top) >> 1, xo = (x - chimX + (row & 1) * 2) % 4;
      g.p(x, y, x === chimX ? C.hi : x === chimX + 6 ? C.sh : (y - top) % 2 === 1 || xo === 0 ? mix(C.b, C.sh, 0.5) : C.b);
    }
    g.r(chimX - 1, top - 2, 9, 2, C.dk); g.r(chimX - 1, top - 2, 9, 1, C.sh); g.r(chimX + 1, top - 2, 5, 1, '#0e0c0a');
    if (T.forge) for (let x = chimX - 4; x < chimX + 10; x++) for (let y = ridge + 3; y < ridge + 9; y++) if (n(x, y + 90) > 0.5) g.p(x, y, mix(g.at(x, y) || R.b, '#16120e', 0.45));   // Ruß
  }
  const signAt = (icon) => {                                        // Ausleger mit hängendem Schild an der Fassadenecke
    const sx = b.door === 'S' ? Math.min(fx1 - 10, dx + dw + 3) : fx1 - 10, sy = yF + 2;
    g.r(sx, sy, 7, 1, IRON); g.p(sx + 1, sy + 1, IRON); g.p(sx + 6, sy + 1, IRON);
    const Sr = ramp('#6a5236');
    g.r(sx, sy + 2, 8, 7, Sr.b); g.r(sx, sy + 2, 8, 1, Sr.hi); g.r(sx, sy + 8, 8, 1, Sr.sh);
    const I = ICON[icon];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) { const ch = I[j][i]; if (ch !== '.') g.p(sx + 1 + i + 1, sy + 3 + j + 1, ch === '+' ? '#e8dcb8' : '#1c1612'); }
  };
  if (T.sign) signAt(T.sign);
  if (T.forge) {                                                    // offene Esse in der Wand, Glut
    const ex = fx0 + 3, ey = yB - 10;
    g.r(ex - 1, ey - 1, 10, 9, '#3a3631');
    for (let y = ey; y < ey + 7; y++) for (let x = ex; x < ex + 8; x++) g.p(x, y, n(x, y + 5) > 0.55 ? '#f0a040' : n(x, y + 6) > 0.4 ? '#c05020' : '#5a1e10');
    g.r(ex - 1, ey - 3, 10, 2, '#1e1a16');                          // Ruß über der Esse
    g.r(fx1 - 7, yF + 4, 1, 6, '#6a5a44'); g.r(fx1 - 9, yF + 4, 5, 2, IRON);   // Hammer an der Wand
  }
  if (T.herbs) for (let i = 0; i < 4; i++) { const hx = fx0 + 6 + i * Math.floor((b.w * 16 - 12) / 4);   // Kräuterbündel unter der Traufe
    g.p(hx, yF + 1, BEAM); for (let k = 0; k < 3; k++) g.p(hx + (k === 1 ? 1 : 0), yF + 2 + k, k === 2 ? '#8a7a44' : '#5a7a3a'); }
  const bannerKind = T.banner && (({ sonnwacht: 'order', kreuzweg: 'merch', ashford: 'merch' })[b.town] || T.banner);   // wer hier herrscht
  if (bannerKind) {                                                 // Banner an der Wand
    const col = bannerKind === 'valen' ? ['#2f4260', '#b9c3d2'] : bannerKind === 'order' ? ['#d9d2c0', '#9b2e26'] : ['#5a4630', '#bd9433'];
    for (const bx of [fx0 + 4, fx1 - 9]) { if (b.door === 'S' && bx + 6 > dx - 1 && bx < dx + dw + 1) continue;
      const Bn = ramp(col[0]); g.r(bx - 1, yF + 1, 8, 1, BEAM);
      for (let y = yF + 2; y < yF + 11; y++) for (let x = bx; x < bx + 6; x++) g.p(x, y, x === bx ? Bn.hi : x === bx + 5 ? Bn.sh : Bn.b);
      g.p(bx + 1, yF + 11, Bn.b); g.p(bx + 4, yF + 11, Bn.b);
      for (let k = 0; k < 3; k++) { g.p(bx + 1 + k, yF + 4 + k, col[1]); g.p(bx + 4 - k, yF + 4 + k, col[1]); } }
  }
  if (T.crest && b.door === 'S') { const cx = dx + (dw >> 1) - 3, cy = dy - 7; const Cr = ramp('#8a8f98'); g.r(cx, cy, 6, 5, Cr.b); g.r(cx, cy, 6, 1, Cr.hi); g.r(cx + 1, cy + 5, 4, 1, Cr.sh); g.r(cx + 2, cy + 1, 2, 3, '#2f4260'); }
  if (T.rose) { const cx = fx0 + (b.w * 8) - 3, cy = yF - 1;     // Rosette im Giebel über dem Portal
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) { const d = Math.hypot(i - 3, j - 3); if (d < 3.6) g.p(cx + i, cy - 9 + j, d < 1.2 ? '#e8c070' : d < 2.6 ? ((i + j) % 2 ? '#9b2e26' : '#3a4a6a') : Br.dk); } }
  if (T.cross) { const cx = (W >> 1) - 1; g.r(cx, 0, 2, 7, '#d9d2c0'); g.r(cx - 2, 2, 6, 2, '#d9d2c0'); g.p(cx, 0, '#f2ead6'); }
  if (has('flowers') && wins.length) { const [wx, wy] = wins[(n(8, 8) * wins.length) | 0]; g.r(wx - 1, wy + 6, 8, 2, '#4a3322');
    for (let i = 0; i < 6; i++) g.p(wx + i, wy + 5, n(i, 3) > 0.5 ? '#b04a3a' : '#c9a84a'); }
  if (has('woodpile')) { const wx = b.door === 'E' ? fx0 + 1 : fx1 - 7, wy = yB - 6;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 6 - (j === 0 ? 2 : 0); i++) g.p(wx + i + (j === 0 ? 1 : 0), wy + j, (i + j) % 2 ? '#7a5a38' : '#5a4028'); }
  if (T.sacks) for (let i = 0; i < 3; i++) { const sx = fx1 - 18 + i * 5, sy = yB - 7; const Sk = ramp('#9a8a66');   // Säcke an der Wand
    g.r(sx, sy + 1, 4, 5, Sk.b); g.r(sx + 1, sy, 2, 1, Sk.sh); g.p(sx, sy + 1, Sk.hi); g.r(sx + 3, sy + 2, 1, 4, Sk.sh); }
  return toCanvas(g);
}

// Innenausstattung je Funktion: Möbel, die zur Nutzung passen (Welt-Props, von world.js platziert).
// Koordinaten relativ zur Innenfläche (x+1..x+w-2, y+1..y+h-2). Die Türachse bleibt frei.
export const FURNISH = {
  tavern:   [['hearth', 0, 0], ['table', 2, 1], ['bench', 2, 2], ['table', -2, 1], ['bench', -2, 2], ['counter', -1, 0], ['cask_rack', -1, -1]],
  smithy:   [['forge', 0, 0], ['workbench_int', 2, 0], ['weapon_rack', -1, 0], ['barrel', -1, 1]],
  healer:   [['bed', 0, 1], ['bed', 0, 2], ['shelf', 2, 0], ['table', -1, 0]],
  hall:     [['desk', 1, 1], ['shelf', 0, 0], ['shelf', -1, 0], ['bench', -1, 2]],
  kontor:   [['counter', 1, 0], ['crate_stack', 0, 0], ['crate_stack', -1, 0], ['sack', 0, 2], ['sack', -1, 2]],
  barracks: [['bunk', 0, 0], ['bunk', 0, 2], ['weapon_rack', -1, 0], ['table', -1, 2]],
  chapel:   [['altar_small', 1, 0], ['bench', 1, 2], ['bench', -2, 2], ['candles', 0, 0]],
  merc:     [['table', 1, 1], ['bench', 1, 2], ['weapon_rack', -1, 0], ['hearth', 0, 0]],
  house:    [['bed', 0, 0], ['table', -1, 1], ['hearth', -1, 0], ['shelf', 1, 0]],
};
