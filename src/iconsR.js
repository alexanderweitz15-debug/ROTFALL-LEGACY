// S14 Stil R: handgezeichnete 16×16-Symbole für Verbrauchsgüter und Material (Nutzer: „restliche Sprites“).
// Zeichen → Farbe je Symbol; '.' leer, 'o' Kontur. Waffen und Rüstung kommen weiter aus den echten Sprites (render.js iconR).
import { G, ramp, mix, toCanvas } from './sprites.js?v=29';   /* Regel-Symbole (09.10.) */
const O = '#1c1512';
/* Fischen (08.10.2026): ein Fischumriss, je Art eigene Farben (B Rücken, b Bauch, w Auge, T Schwanz) */
const FISH_ROWS = ['................', '................', '................', '................', '.....oooooo...oo', '...ooBBBBBBo.oTo',
  '..oBBBBBBBBBooTo', '.oBwoBBBBBBBBTTo', 'oBBBBBBBBBBBBTTo', 'obbbbbbbbbbbbTTo', '.obbbbbbbbbbooTo', '..oobbbbbbbo.oTo',
  '....ooooooo...oo', '................', '................', '................'];
const fishIcon = (B, b, T) => [{ B, b, T, w: '#f0ece0' }, FISH_ROWS];
export const ICON_R = {
  forelle: fishIcon('#6a7a5a', '#d8c8a8', '#4a5a3e'), lachs: fishIcon('#7a8a98', '#e0a088', '#5a6a78'), hecht: fishIcon('#4a6a3a', '#c8c890', '#2e4a26'),
  karpfen: fishIcon('#8a7a3a', '#d8c070', '#6a5a2a'), barsch: fishIcon('#5a7a4a', '#d8b878', '#c06a3a'), wels: fishIcon('#4a4440', '#9a9080', '#2e2a26'),
  hering: fishIcon('#6a8aa0', '#e8eef0', '#4a6a80'), kabeljau: fishIcon('#8a8a70', '#e0dccc', '#6a6a56'), rotbarsch: fishIcon('#b84a3a', '#e8a088', '#8a2e22'),
  schlammbeisser: fishIcon('#5a4a32', '#9a8a60', '#3e3222'), giftbarbe: fishIcon('#5a7a3a', '#c8d060', '#7a3a7a'), moorhecht: fishIcon('#3a4a32', '#8a9a6a', '#22301e'),
  any_fish: fishIcon('#7a7a7a', '#c8c8c8', '#5a5a5a'),
  angel: [{ s: '#8a5a2a', l: '#d8d0c0', h: '#9aa0a8' }, ['..............oo', '.............oso', '............oso.', '...........oso..', '..........oso.l.', '.........oso..l.',
    '........oso...l.', '.......oso....l.', '......oso.....l.', '.....oso......l.', '....oso.......l.', '...oso........l.', '..oso.........h.', '.oso.........hh.', 'oso.............', 'oo..............']],
  fischsuppe: [{ f: '#d8d8d0', s: '#c8a060', S: '#a8783a', B: '#6a4a2a' }, ['................', '................', '....f...f.......', '.....f...f......', '....f...f.......', '..oooooooooooo..',
    '.osssssssssssso.', '.oSSSsSSSsSSSSo.', '..oBBBBBBBBBBo..', '...oBBBBBBBBo...', '....oooooooo....', '................', '................', '................', '................', '................']],
  potion: [{ c: '#8a6a42', g: '#a9c4bc', w: '#eef4ee', r: '#b8322a', R: '#e0685a', d: '#7a1c18' }, [
    '................', '......oooo......', '.....occcco.....', '......oggo......', '......oggo......', '.....oggggo.....',
    '....oggwgggo....', '...ogrrrrrrgo...', '...orRrrrrrro...', '..orRrrrrrrrro..', '..orRrrrrrrrro..', '..orrrrrrrrdro..',
    '..orrrrrrrddro..', '...orrrrrddro...', '....oddddddo....', '.....oooooo.....']],
  soul_vial: [{ c: '#4a4450', g: '#8aa0a8', w: '#e8fff8', r: '#5ad0b0', R: '#b8fff0', d: '#2a7a6a' }, [
    '................', '......oooo......', '.....occcco.....', '......oggo......', '......oggo......', '.....oggggo.....',
    '....oggwgggo....', '...ogrrRrrrgo...', '...orRRrrRrro...', '..orrRrrrRrrro..', '..orRrrRrrrRro..', '..orrrRrrrrdro..',
    '..orrrrrRrddro..', '...orrrrrddro...', '....oddddddo....', '.....oooooo.....']],
  herb: [{ L: '#6aa04a', l: '#3e7a32', d: '#2a5222', s: '#8a6a3a' }, [
    '................', '.......oo.......', '......oLLo......', '..oo..oLlo..oo..', '.oLLo.oLlo.oLLo.', '.oLlLooLlooLlLo.',
    '..oLlLoLloLlLo..', '...oLlLLlLlLo...', '....ooLlLloo....', '.......oso......', '..oo...oso...oo.', '.oLLo..oso..oLLo',
    '..oLloooso.oLlo.', '...oolLsLlloo...', '.....oosoo......', '.......oo.......']],
  bread: [{ b: '#c08a48', B: '#e0b070', d: '#8a5a2a', c: '#f0d8a0' }, [
    '................', '................', '................', '.....oooooo.....', '...ooBBBBBBoo...', '..oBBcBBBcBBBo..',
    '.oBBBBcBBBcBBBo.', '.oBbBBBcBBBcBbo.', 'obbBbBBBcBBBbbbo', 'obbbbbBBBBbbbbdo', 'odbbbbbbbbbbbddo', '.oddbbbbbbbbddo.',
    '..oodddddddddo..', '....oooooooo....', '................', '................']],
  dried_meat: [{ m: '#8a3a2a', M: '#b85a44', f: '#e0c0a0', d: '#5a2018' }, [
    '................', '................', '....ooo.........', '...oMMMoo.......', '..oMMmMMMoo.....', '..oMmmfmMMMoo...',
    '...omMmmfmMMMo..', '...oommMmmfmMMo.', '.....oommMmmfmo.', '.......oommmmdo.', '.........oomddo.', '...........ooo..',
    '................', '................', '................', '................']],
  bandage: [{ w: '#e8e0cc', W: '#fffaf0', s: '#b8ac90', r: '#a83a2a' }, [
    '................', '................', '.....oooooo.....', '....oWWWWWWo....', '...oWwwwwwwWo...', '..oWwsssssswWo..',
    '..oWwsooooswWo..', '..oWwso..oswWo..', '..oWwso..oswWo..', '..oWwsooooswWo..', '..oWwsssssswWo..', '...oWwwwwwwWoooo',
    '....oWWWWWWowwWo', '.....oooooo.orro', '.............oo.', '................']],
  iron: [{ s: '#6a6660', S: '#8a857c', d: '#44403a', r: '#9a5a3a', R: '#c07a4a' }, [
    '................', '................', '......ooo.......', '....ooSSSoo.....', '...oSSsSrSSo....', '..oSsRssssSso...',
    '..oSssssRsssoo..', '.oSsrssssssSSo..', '.osssssRsssssso.', '.ossRsssssrssso.', '.odssssssssssdo.', '..oddsssRssddo..',
    '...ooddddddoo...', '.....oooooo.....', '................', '................']],
  pelt: [{ p: '#8a7050', P: '#a88a64', d: '#5a4632', l: '#c8b08a' }, [
    '................', '..oo........oo..', '.oPPo......oPPo.', '.oPpPooooooPpPo.', '..oPpPPPPPPpPo..', '...oPpPPlPPpPo..',
    '...oPPPlPlPPPo..', '..oPPpPPlPPpPPo.', '.oPPppPPPPPppPPo', '.oPpppPPPPPpppPo', '..oppPPPPPPPppo.', '...ooPPPPPPPoo..',
    '....oPpPddPpPo..', '...oPpo.oo.opPo.', '...ooo......ooo.', '................']],
  bone: [{ b: '#d8d0bc', B: '#f4eee0', d: '#a89c84' }, [
    '................', '................', '..oo........oo..', '.oBBo......oBBo.', '.oBbBo....oBbBo.', '..oBbBooooBbBo..',
    '...obBBBBBBbo...', '....obbbbbbo....', '....obbbbbbo....', '...obddddddbo...', '..oBbdoooodbBo..', '.oBbdo....odbBo.',
    '.oBdo......odBo.', '..oo........oo..', '................', '................']],
  grabgut: [{ g: '#b08a40', G: '#e8d090', d: '#6a4a22', r: '#8a2a3a', R: '#d06070' }, [   /* E40.5: Ring mit Stein und zwei alte Münzen */
    '................', '.......oo.......', '......orRo......', '.....oooooo.....', '....oGggggGo....', '...oGo....oGo...',
    '...og......go...', '...og......go...', '...odo....odo...', '....oddddddo....', '.....oooooo.....', '................',
    '..oooo....oooo..', '.oGggdo..oGggdo.', '..oooo....oooo..', '................']],
  dietrich: [{ m: '#8a8680', M: '#c8c4bc', d: '#4a4640', r: '#a0302a' }, [
    '................', '.....oooo.......', '....oMMMMo......', '...oMmoomMo.....', '...oMo..oMo.....', '...oMmoomMo.....',
    '....oMMMMo......', '.....oMmo.......', '.....oMmo.......', '.....oMmo.......', '.....oMmoooo....', '.....oMmMMMo....',
    '.....oMmoooo....', '.....oMmo.......', '.....oddo.......', '......oo........']],
  ingot: [{ s: '#8a8a90', S: '#c0c0c8', W: '#e8e8f0', d: '#5a5a62' }, [
    '................', '................', '................', '................', '......oooooo....', '....ooSWWWWSoo..',
    '...oSSSSSSSSSSo.', '..oSSSSSSSSSSdo.', '.oSSSSSSSSSSddo.', '.osssssssssddo..', '.osssssssssdo...', '.odddddddddoo...',
    '..ooooooooooo...', '................', '................', '................']],
  grain: [{ s: '#c8a868', S: '#e0c888', d: '#8a6a3a', g: '#d8b04a', G: '#f0d070' }, [
    '................', '.......oGo......', '......oGgGo.....', '.......ogo......', '.....oosSsoo....', '....oSSSSSSSo...',
    '...oSSsSSSsSSo..', '...oSSSSSSSSSo..', '..oSsSSSSSSSsSo.', '..oSSSSsSSSSSSo.', '..oSSSSSSSsSSdo.', '..odSSsSSSSSddo.',
    '...oddSSSSSddo..', '....ooddddoo....', '......oooo......', '................']],
};
/* Sammeln, Werkzeuge und Kochen (08.10.2026): neue Symbole, meist umgefärbte vorhandene Umrisse; Stamm und Schriftrolle neu gezeichnet */
const LOG_ROWS = ['................', '................', '................', '................', '..oooooooooooo..', '.obbbbbbbbbbbbro',
  '.oBbBbbBbbBbbrRo', '.obbbbbbbbbbbbro', '.oBbbBbbbBbbbrRo', '.obbbbbbbbbbbbro', '..oooooooooooo..', '................', '................', '................', '................', '................'];
const SCROLL_ROWS = ['................', '................', '...oooooooooo...', '..oppppppppppo..', '..opllllllllpo..', '..oppppppppppo..',
  '..opllllllpppo..', '..oppppppppppo..', '..opllllllllpo..', '..oppppppppppo..', '..opllllpppppo..', '..oppppppppppo..', '...oooooooooo...', '................', '................', '................'];
Object.assign(ICON_R, {
  hartholz: [{ b: '#6a4a2a', B: '#4a3220', r: '#c8a070', R: '#8a6a40' }, LOG_ROWS], schwarzholz: [{ b: '#2a2420', B: '#14100e', r: '#6a5a4a', R: '#3e342a' }, LOG_ROWS],
  harz: [{ c: '#8a6a2a', g: '#c89a3a', w: '#f0d890', r: '#d8a040', R: '#f0c060', d: '#8a5a1a' }, ICON_R.potion[1]],
  kohle: [{ s: '#2a2826', S: '#3e3a36', d: '#141210', r: '#4a4440', R: '#6a6460' }, ICON_R.iron[1]], silbererz: [{ s: '#6a6a70', S: '#9a9aa4', d: '#3e3e44', r: '#c8ccd8', R: '#eef0f8' }, ICON_R.iron[1]],
  bergminze: [{ L: '#8ad0a0', l: '#4a9a6a', d: '#2a6a4a', s: '#7a6a4a' }, ICON_R.herb[1]], nachtschatten: [{ L: '#8a6aa0', l: '#5a3a7a', d: '#3a2250', s: '#5a4a3a' }, ICON_R.herb[1]],
  angel_gut: [{ s: '#a06a32', l: '#e8e0d0', h: '#b0b8c0' }, ICON_R.angel[1]], angel_stahl: [{ s: '#5a5a62', l: '#e8e0d0', h: '#d8e0e8' }, ICON_R.angel[1]],
  bratfisch: [{ B: '#a0602a', b: '#d8a060', T: '#7a4420', w: '#f0e0c0' }, ICON_R.forelle[1]],
  jaegertopf: [{ f: '#d8d8d0', s: '#8a4a2a', S: '#6a3220', B: '#4a3420' }, ICON_R.fischsuppe[1]], bergminztee: [{ f: '#d8d8d0', s: '#8ad0a0', S: '#5aa070', B: '#6a5a4a' }, ICON_R.fischsuppe[1]],
  kraeuterbrot: [{ b: '#a08a48', B: '#c8b070', d: '#6a5a2a', c: '#8ab060' }, ICON_R.bread[1]],
  alter_wels: fishIcon('#3a3430', '#c8a860', '#d8b040'), buch_erzkunde: [{ p: '#7a6a5a', l: '#c8ccd8' }, SCROLL_ROWS], buch_kraeuter: [{ p: '#6a7a4a', l: '#d8e8a0' }, SCROLL_ROWS],
  rezept_jaegertopf: [{ p: '#e8dcc0', l: '#8a6a4a' }, SCROLL_ROWS], rezept_bergminztee: [{ p: '#e8dcc0', l: '#4a8a6a' }, SCROLL_ROWS], kochbuch: [{ p: '#c8a878', l: '#6a3a2a' }, SCROLL_ROWS],
});
/* ---------------- Gegenstands-Symbole nach Regel (Entwickler 09.10.: „manche Items sehen aus wie Menschen“) ----------------
   Vorher zeigten Rüstung, Kopfschutz, Umhang und Schild die Probefigur (Kopf, Gesicht, Hände, beim Schild sogar nur den Menschen),
   und rund 100 Gegenstände ohne eigenes Bild fielen auf eine Münze oder eine rote Flasche zurück. Jetzt malt jedes Stück ohne
   handgezeichnetes Symbol (ICON_R) ein eigenes 16×16-Symbol: Form aus Schlüssel, Slot, Art und Verwendung; Farben aus dem echten
   Aussehen am Körper (humanSpec: armorCol, helm, hood, cloak, glove, pants …), damit Symbol und Figur zusammenpassen.
   Licht oben links (Rampe hi/b/sh), Kontur automatisch (toCanvas). Neue Gegenstände bekommen über die Regeln nach Slot und
   Verwendung immer ein Gegenstandsbild, nie eine Figur. */
const VOIDC = '#100c0a', BRASS = '#b08a40', GOLD = '#d8b25a', IRON = '#8a8a88', STEEL = '#a4aab2', BONE = '#d8ccb0', WOOD = '#6a4a2a', LEATH = '#5a4030', PARCH = '#d8c8a0', ROPE = '#a08a5a';
const hashK = k => { let h = 7; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0; return Math.abs(h); };
class Pic {   /* 16×16-Flächenbild: Teile mit Grundfarbe, Licht automatisch */
  constructor() { this.id = new Int16Array(256).fill(-1); this.c = []; this.dt = new Array(256).fill(null); }
  m(col) { this.c.push(col || '#5a4a3a'); return this.c.length - 1; }
  p(i, x, y) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < 16 && y < 16) { this.id[y * 16 + x] = i; this.dt[y * 16 + x] = null; } }
  x(x, y) { if (x >= 0 && y >= 0 && x < 16 && y < 16) { this.id[y * 16 + x] = -1; this.dt[y * 16 + x] = null; } }
  h(i, y, x0, x1) { for (let x = x0; x <= x1; x++) this.p(i, x, y); }
  r(i, x, y, w, h) { for (let j = 0; j < h; j++) this.h(i, y + j, x, x + w - 1); }
  s(i, y, hw, cx = 7.5) { for (let x = 0; x < 16; x++) if (Math.abs(x - cx) <= hw) this.p(i, x, y); }
  rows(i, y0, list, cx = 7.5) { list.forEach((hw, j) => { if (hw >= 0) this.s(i, y0 + j, hw, cx); }); }
  e(i, cx, cy, rx, ry = rx) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.p(i, x, y); }
  seg(i, x0, y0, x1, y1, w) { const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy || 1;   /* dicke Linie: Abstand der Pixelmitte zur Strecke */
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / L)), ex = x - x0 - t * dx, ey = y - y0 - t * dy; if (ex * ex + ey * ey <= w * w) this.p(i, x, y); } }
  poly(i, pts) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const px = x + 0.5, py = y + 0.5; let ins = false;
    for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) { const [xa, ya] = pts[a], [xb, yb] = pts[b]; if ((ya > py) !== (yb > py) && px < (xb - xa) * (py - ya) / (yb - ya) + xa) ins = !ins; }
    if (ins) this.p(i, x, y); } }
  d(x, y, col) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < 16 && y < 16 && this.id[y * 16 + x] >= 0) this.dt[y * 16 + x] = col; }   /* Detail: Farbe oder 'hi'/'sh'/'dk' der Fläche */
  dl(x0, y0, x1, y1, col) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let k = 0; k <= n; k++) this.d(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, col); }
  pat(i, f) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (this.id[y * 16 + x] === i) { const c = f(x, y); if (c) this.dt[y * 16 + x] = c; } }
  at(x, y) { return x < 0 || y < 0 || x > 15 || y > 15 ? -1 : this.id[y * 16 + x]; }
  done() {
    const g = new G(16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const i = this.id[y * 16 + x]; if (i < 0) continue;
      const R = ramp(this.c[i]), up = this.at(x, y - 1) !== i || this.at(x - 1, y) !== i, dn = this.at(x, y + 1) !== i || this.at(x + 1, y) !== i, t = this.dt[y * 16 + x];
      g.a[y * 16 + x] = t ? (R[t] || t) : up && !dn ? R.hi : dn && !up ? R.sh : R.b; }
    return toCanvas(g, true);
  }
}
const lighter = (c, k = 0.2) => mix(c, '#f0e6d0', k), darker = (c, k = 0.3) => mix(c, '#0c0a0f', k);

// ---- Rüstung am Rumpf: Wams, Kettenhemd, Harnisch, Robe — Farben und Zier aus dem Aussehen am Körper ----
function chestIcon(P, L, key) {
  const kind = L.armor || (L.robe ? 'robe' : 'tunic'), robeCol = L.robe && L.robe !== 'cloth' ? L.robe : '';
  const base = L.armorCol || robeCol || '#8a7e66';
  if (L.cloak && L.capeL) { const k = P.m(L.cloak); for (let y = 4; y <= 14; y++) P.s(k, y, y < 6 ? 6 : 6.5); }   /* langer Umhang hinter dem Harnisch */
  const b = P.m(base), sl = P.m(kind === 'plate' ? darker(base, 0.2) : base), v = P.m(VOIDC);
  P.h(b, 2, 4, 6); P.h(b, 2, 9, 11); P.h(b, 3, 2, 13);
  for (let y = 4; y <= 9; y++) { P.h(sl, y, y < 6 ? 2 : 1, 3); P.h(sl, y, 12, y < 6 ? 13 : 14); }
  for (let y = 3; y <= 11; y++) P.h(b, y, 4, 11);
  P.p(v, 7, 2); P.p(v, 8, 2); P.d(7, 3, 'dk'); P.d(8, 3, 'dk');
  for (const x of [1, 2, 3, 12, 13, 14]) P.d(x, 9, 'dk');
  if (kind === 'robe') { P.rows(b, 12, [4.5, 5, 5.5]); P.dl(6, 6, 6, 14, 'sh'); P.dl(9, 7, 9, 14, 'sh'); P.dl(7, 3, 7, 6, 'dk'); }
  else if (kind === 'chain') { P.h(b, 12, 3, 12); for (let x = 3; x <= 12; x += 2) P.p(b, x, 13); P.pat(b, (x, y) => (x + y) & 1 ? 'sh' : 0); P.pat(sl, (x, y) => (x + y) & 1 ? 'sh' : 0); }
  else if (kind === 'plate') { P.h(b, 12, 4, 11); P.h(b, 13, 5, 10); for (let y = 4; y <= 9; y++) { P.d(7, y, 'hi'); P.d(8, y, 'sh'); } P.dl(4, 10, 11, 10, 'dk'); P.dl(5, 12, 10, 12, 'dk'); }
  else { P.h(b, 12, 4, 11); if (kind === 'tunic') { P.h(b, 13, 4, 11); P.dl(6, 8, 6, 13, 'sh'); P.dl(9, 9, 9, 13, 'sh'); } }
  if (kind === 'leather') { for (const [x, y] of [[5, 5], [10, 5], [5, 8], [10, 8], [5, 11], [10, 11]]) P.d(x, y, '#a8a196'); for (let y = 4; y <= 8; y++) P.d(y & 1 ? 7 : 8, y, 'dk'); }
  if (kind !== 'plate' && kind !== 'robe') { const bt = P.m('#3a2a1c'); P.h(bt, 10, 4, 11); P.d(7, 10, BRASS); P.d(8, 10, BRASS); }
  if (L.tabard) { const t = P.m(L.tabard); P.r(t, 5, 4, 6, kind === 'robe' ? 10 : 9); const mk = L.markCol || GOLD;
    if (L.mark === 'cross') { P.dl(7, 5, 7, 10, mk); P.dl(8, 5, 8, 10, mk); P.dl(5, 7, 10, 7, mk); }
    else if (L.mark === 'chevron') { P.dl(5, 6, 7, 8, mk); P.dl(8, 8, 10, 6, mk); P.dl(5, 8, 7, 10, mk); P.dl(8, 10, 10, 8, mk); }
    else if (L.mark === 'star') { P.dl(7, 5, 7, 9, mk); P.dl(8, 5, 8, 9, mk); P.dl(5, 7, 10, 7, mk); P.d(6, 6, mk); P.d(9, 6, mk); P.d(6, 8, mk); P.d(9, 8, mk); }
    else if (L.mark === 'quarter') { P.pat(t, (x, y) => (x < 8) === (y < 8) ? mk : 0); } }
  if (L.sash) P.dl(4, 3, 11, 10, L.sash);
  if (L.stole) { P.dl(5, 3, 5, 12, L.stole); P.dl(10, 3, 10, 12, L.stole); }
  if (L.chn) for (let k = 0; k <= 7; k++) P.d(4 + k, 4 + k * 6 / 7, k & 1 ? '#4a4a50' : '#9a9aa2');
  if (L.strap) { P.dl(11, 3, 4, 10, '#3a2a1c'); if (L.pouch) { P.d(10, 11, '#4a3424'); P.d(11, 11, '#4a3424'); } }
  if (kind === 'plate' || L.pauld) { const pc = P.m(L.pauld || lighter(base, 0.15)), big = (L.pb | 0) >= 2, rx = big ? 2.6 : 2, ry = big ? 2.2 : 1.7;
    P.e(pc, 3, 4, rx, ry); if (!L.asy) P.e(pc, 12, 4, rx, ry);
    if (L.spk) { P.p(pc, 2, 1); P.p(pc, 3, 1); if (!L.asy) { P.p(pc, 12, 1); P.p(pc, 13, 1); } } }
  if (L.gg) { const gg = P.m(lighter(base, 0.25)); P.h(gg, 2, 5, 10); P.h(gg, 3, 6, 9); }
  if (L.fur) { const fu = P.m(L.fur); P.h(fu, 2, 4, 11); P.h(fu, 3, 5, 10); P.pat(fu, (x, y) => (x + y) % 3 === 0 ? 'hi' : 0); }
  if (L.rn) for (const [x, y] of [[5, 6], [10, 9], [6, 11], [9, 5]]) P.d(x, y, L.rn);
  if (L.core) { P.d(7, 6, L.core); P.d(8, 6, L.core); P.d(7, 7, L.core); P.d(8, 7, lighter(L.core, 0.6)); }
}

// ---- Kopfschutz: Helmform aus helm, Kapuze aus hood (ohne Gesicht: dunkle Öffnung), Sonderformen ----
function hoodIcon(P, L) {
  const hc = L.hood || L.cloak || '#3a3026', hd = L.hd || '', h = P.m(hc), v = P.m(VOIDC);
  const top = hd === 'spitz' || hd === 'gugel' ? [0.5, 1, 1.5, 2.5, 3.5, 4.5, 5, 5.5, 5.5, 6, 6, 6, 6.5, 6.5] : hd === 'weit' ? [-1, 3, 4.5, 5.5, 6, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 7, 7, 7] : [-1, 2.5, 3.5, 4.5, 5, 5.5, 5.5, 5.5, 6, 6, 6, 6.5, 6.5, 6.5];
  P.rows(h, 1, top, hd === 'spitz' || hd === 'gugel' ? 8 : 7.5);
  if (hd === 'gugel') for (let x = 1; x <= 14; x += 2) P.x(x, 14);
  if (hd === 'henker' || hd === 'maske') { P.e(v, 5.5, 7.5, 1, 0.6); P.e(v, 9.5, 7.5, 1, 0.6); P.dl(4, 10, 11, 10, 'sh'); }
  else { P.e(v, 7.5, 8.5, hd === 'kutte' || hd === 'weit' ? 2.6 : 2.4, 3.1);
    if (L.hc2) P.pat(h, (x, y) => [P.at(x + 1, y), P.at(x - 1, y), P.at(x, y + 1), P.at(x, y - 1)].includes(v) ? L.hc2 : 0);
    if (L.ctr) P.pat(h, (x, y) => [P.at(x + 1, y), P.at(x - 1, y), P.at(x, y + 1)].includes(v) ? L.ctr : 0);
    if (L.face === 'cloth' && L.scarf) { const mk = P.m(L.scarf); P.s(mk, 10, 2.5); P.s(mk, 11, 2); }
    if (hd === 'pest') { const bk = P.m('#b8a888'); P.seg(bk, 8, 9, 12, 13, 0.8); P.d(6, 8, '#8aa0a8'); P.d(9, 8, '#8aa0a8'); }
    if (hd === 'tuch') P.pat(h, (x, y) => (x + y) % 4 === 0 ? 'sh' : 0); }
  if (hd === 'kette') P.pat(h, (x, y) => (x + y) & 1 ? 'sh' : 0);
  if (L.ctr && hd === 'gugel') P.pat(h, (x, y) => y === 13 ? L.ctr : 0);
  if (hd === 'horn' || /horns/.test(L.sil || '')) { const hn = P.m(BONE); for (const [x, y] of [[3, 3], [2, 2], [2, 1], [3, 0]]) { P.p(hn, x, y); P.p(hn, 15 - x, y); } P.p(hn, 3, 2); P.p(hn, 12, 2); }
}
function headIcon(P, L, key) {
  if (/antlers/.test(L.sil || '')) { const a = P.m('#8a6a44'), bd = P.m('#6a5038');   /* Hirschgeweih am Stirnband */
    P.h(bd, 11, 3, 12); P.h(bd, 12, 4, 11); for (const s of [1, -1]) { const X = x => s > 0 ? x : 15 - x;
      P.seg(a, X(5), 10, X(3), 4, 0.6); P.seg(a, X(3), 4, X(1), 1, 0.5); P.seg(a, X(3.5), 6, X(6), 3, 0.5); P.seg(a, X(2.5), 8, X(0.5), 6, 0.5); } return; }
  if (key === 'gebetsband' || (!L.helm && !L.hooded && L.charm)) { const bd = P.m('#d9d2c0'), bead = P.m('#a8843a');   /* Stirnband mit Gebetsperlen */
    P.e(bd, 7.5, 6, 6, 3.2); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (((x - 7.5) / 4.6) ** 2 + ((y - 5.6) / 2) ** 2 <= 1) P.x(x, y);
    P.seg(bd, 10, 8, 11, 12, 0.5); P.seg(bd, 11, 8, 13, 11, 0.5); for (const [x, y] of [[11, 13], [13, 12], [7, 9], [5, 9]]) P.p(bead, x, y); return; }
  if (L.hooded && !L.helm) return hoodIcon(P, L);
  const hc = L.helmCol || '#6a6862', t = L.helm || 'cap', h = P.m(hc), v = P.m(VOIDC), ge = L.ge;
  const crest = c => { if (!c) return; const cr = P.m(c); P.h(cr, 1, 6, 9); P.h(cr, 2, 7, 8); };
  if (t === 'great' || t === 'horned' || t === 'mech') {
    P.s(h, 2, 3.5); for (let y = 3; y <= 13; y++) P.s(h, y, t === 'mech' ? 5.5 : 5); if (t === 'mech') P.s(h, 13, 4.5);
    if (t === 'mech') { P.r(v, 4, 7, 3, 1); P.r(v, 9, 7, 3, 1); for (const x of [5, 7, 8, 10]) P.d(x, 10, 'dk'); P.d(2, 6, 'hi'); P.d(13, 6, 'sh'); }
    else { P.h(v, 7, 4, 11); for (let y = 8; y <= 12; y++) P.d(7, y, 'hi'); for (const [x, y] of [[5, 10], [5, 11], [10, 10], [10, 11]]) P.d(x, y, 'dk'); }
    if (ge) { P.d(5, 7, ge); P.d(10, 7, ge); }
    if (t === 'horned') { const hn = P.m(BONE); for (const [x, y] of [[2, 5], [1, 4], [1, 3], [1, 2], [2, 1], [2, 4]]) { P.p(hn, x, y); P.p(hn, 15 - x, y); } }
    else crest(L.crest);
  } else if (t === 'visor') {
    P.rows(h, 2, [2, 3.5, 4.5, 5, 5.5, 5.5, 5.5, 5.5]); const vs = P.m(lighter(hc, 0.12)); P.rows(vs, 8, [5.5, 5, 4.5, 4, 3]); P.h(v, 7, 3, 12);
    if (ge) { P.d(5, 7, ge); P.d(10, 7, ge); } P.dl(7, 9, 7, 12, 'dk'); crest(L.crest);
  } else if (t === 'skull') {
    P.rows(h, 2, [3, 4.5, 5.5, 5.5, 5.5, 5.5, 5, 5, 4.5, 4]); P.s(h, 12, 3.5); P.s(h, 13, 3);
    P.e(v, 5.5, 7.5, 1.2, 1); P.e(v, 9.5, 7.5, 1.2, 1); P.p(v, 7, 9); P.p(v, 8, 9); for (let x = 5; x <= 10; x += 2) P.d(x, 12, 'dk');
    if (ge) { P.d(5, 7, ge); P.d(10, 7, ge); }
  } else if (t === 'crown') {
    const cap = P.m(L.crest && L.crest !== hc ? darker(L.crest, 0.3) : '#4a1a1e'); P.rows(cap, 4, [3, 4, 4.5, 5, 5]);   /* Samtkappe unter dem Reif */
    for (let y = 9; y <= 11; y++) P.s(h, y, 6); for (const x of [2, 5, 7, 8, 10, 13]) P.p(h, x, 8); for (const x of [2, 7, 8, 13]) P.p(h, x, 7); P.p(h, 7, 6); P.p(h, 8, 6);
    const gem = ge || L.crest || '#9b2e26'; P.d(7, 10, gem); P.d(8, 10, gem); P.d(4, 10, gem); P.d(11, 10, gem); P.dl(2, 11, 13, 11, 'sh');
  } else if (t === 'hat' || t === 'wide') {
    if (t === 'hat') { P.rows(h, 4, [3, 4, 4.5, 4.5, 4.5]); P.s(h, 9, 7); P.s(h, 10, 6); for (const [x, y] of [[1, 8], [1, 7], [2, 8], [14, 8], [14, 7], [13, 8]]) P.p(h, x, y); P.dl(1, 9, 14, 9, BRASS); }
    else { P.r(h, 5, 4, 6, 5); P.s(h, 9, 6.5); P.s(h, 10, 6); } P.dl(4, 8, 11, 8, 'dk');
  } else if (t === 'kettle') {
    P.rows(h, 3, [1.5, 3, 4, 4.5, 4.5, 4.5, 4.5]); P.s(h, 10, 7); P.s(h, 11, 6.5); P.s(v, 12, 4); crest(L.crest);
  } else if (t === 'plume') {
    P.rows(h, 4, [2, 3.5, 4.5, 5, 5, 5.5, 5.5]); P.s(v, 11, 4.5); P.r(h, 7, 10, 2, 4); const pl = P.m(L.crest || '#9b2e26'); P.e(pl, 10, 2.5, 3.5, 1.6); P.p(pl, 8, 3);
  } else if (t === 'pot') {
    P.s(h, 3, 3); P.r(h, 4, 4, 8, 6); P.s(h, 10, 5); P.s(v, 11, 4); P.d(3, 7, 'dk'); P.d(12, 7, 'dk');
  } else {   /* cap, nasal und alles Übrige: Kalotte */
    const nasal = t === 'nasal'; P.rows(h, nasal ? 3 : 5, nasal ? [1.5, 3, 4, 4.5, 5, 5, 5.5, 5.5] : [2.5, 3.5, 4.5, 5, 5.5, 5.5]);
    P.s(v, 11, 4.5); P.dl(2, 10, 13, 10, 'dk'); if (nasal) P.r(h, 7, 10, 2, 4); crest(L.crest);
  }
  if (L.hooded) { const hd = P.m(L.hood || darker(hc)); P.s(hd, 13, 6.5); P.s(hd, 14, 7); }   /* Helm über Kapuze: Kragen der Kapuze */
}

// ---- Umhang von hinten: Kragen, Schulter, Saum nach Schnitt (cape), Kapuze, Pelz, Zier ----
function cloakIcon(P, L) {
  const cc = L.cloak || '#3a3026', c = P.m(cc), cw = L.cw || (L.capeL ? 'lang' : ''), end = cw === 'schulter' ? 8 : cw === 'halb' ? 11 : 14;
  const hwOf = y => y === 2 ? 2 : y === 3 ? 3.5 : y === 4 ? 4.5 : Math.min(7, 4.8 + (y - 5) * 0.3);
  for (let y = 2; y <= end; y++) P.s(c, y, hwOf(y));
  if (cw !== 'wappen' && cw !== 'schulter') { const ln = P.m(L.cln || darker(cc, 0.5)); for (let y = 4; y <= end; y++) P.s(ln, y, 0.5 + (y - 4) * 0.16); }   /* offene Vorderkante: Futter statt Körper */
  if (cw === 'zerfetzt' || /flames/.test(L.sil || '')) for (let x = 0; x < 16; x++) { if (x % 2) P.x(x, end); if (x % 3 === 1) P.x(x, end - 1); }
  for (let y = 6; y < end; y++) { P.d(4, y, 'sh'); P.d(11, y, 'sh'); if (y > 8) P.d(2 + (y & 1), y, 'sh'); }
  if (L.ctr) P.dl(1, end, 14, end, L.ctr);
  if (cw === 'kette') P.pat(c, (x, y) => (x + y) & 1 ? 'sh' : 0);
  if (cw === 'feder') P.pat(c, (x, y) => y > 4 && (x + (y >> 1)) % 3 === 0 ? 'dk' : 0);
  if (cw === 'knochen') for (const x of [3, 6, 9, 12]) { P.d(x, end, BONE); P.d(x, end - 1, BONE); }
  if (cw === 'wappen') { const mk = L.ctr || '#b9c3d2'; P.dl(5, 7, 7, 9, mk); P.dl(8, 9, 10, 7, mk); P.dl(5, 9, 7, 11, mk); P.dl(8, 11, 10, 9, mk); }
  if (cw === 'kapitaen') { for (let y = 5; y <= 11; y += 2) { P.d(6, y, BRASS); P.d(9, y, BRASS); } P.dl(7, 3, 7, end, 'dk'); }
  if (cw === 'doppel') { const c2 = P.m(L.hc2 || darker(cc, 0.25)); for (let y = 3; y <= 8; y++) P.s(c2, y, Math.min(6.5, 4 + (y - 3) * 0.6)); for (let x = 2; x <= 13; x += 2) P.x(x, 8); }
  if (L.fur || cw === 'pelzkragen') { const fu = P.m(L.fur || '#6a5a44'); P.rows(fu, 2, [3.5, 4.5, 5]); P.pat(fu, (x, y) => (x + y) % 2 ? 'hi' : 0); }
  if (/collar/.test(L.sil || '')) { const st = P.m('#5a5e58'); P.rows(st, 1, [3.5, 5, 6, 6]); for (const x of [4, 7, 11]) P.d(x, 3, L.mc || '#8fd9b0'); }
  if (L.hooded || cw === 'burnus' || cw === 'tierkopf') { const hd = P.m(L.hood || cc); P.rows(hd, 1, [2, 3, 3.5, 4, 4]);
    if (cw === 'tierkopf') { P.p(hd, 4, 0); P.p(hd, 11, 0); P.d(7, 4, 'dk'); P.d(8, 4, 'dk'); } }
  else { P.d(7, 3, BRASS); P.d(8, 3, BRASS); }
  if (L.cfb) P.d(7, 4, L.cfb);
  if (/motes|flames/.test(L.sil || '')) { const mo = P.m(L.mc || '#8fd9b0'); for (const [x, y] of [[1, 3], [14, 6], [0, 10], [15, 12]]) P.p(mo, x, y);
    if (/flames/.test(L.sil)) for (const x of [2, 5, 8, 11]) { P.d(x, end - 1, L.mc); P.d(x + 1, end - 2, L.mc); } }
}

// ---- Schild: Form nach Name (Rund, Faust, Drachen, Turm, Dorn, Magitech) ----
function shieldIcon(P, L, key) {
  const col = L.shieldCol || '#4a3f30', rim = P.m(key === 'magitechschild' ? BRASS : IRON);
  if (key === 'wooden_shield' || key === 'buckler' || key === 'stachelschild' || L.shield === 'round') {
    const r = key === 'buckler' ? 4.8 : 6.4, f = P.m(key === 'wooden_shield' ? '#6a4a2a' : col);
    P.e(rim, 7.5, 7.5, r, r); P.e(f, 7.5, 7.5, r - 1, r - 1);
    if (key === 'wooden_shield') for (const x of [4, 7, 10]) P.pat(f, (X, y) => X === x ? 'sh' : 0);
    const bs = P.m(STEEL); P.e(bs, 7.5, 7.5, 1.6, 1.6);
    if (key === 'stachelschild') { const sp = P.m(STEEL); for (const [x, y] of [[1, 1], [14, 1], [1, 14], [14, 14]]) P.seg(sp, x, y, x < 7 ? 3 : 12, y < 7 ? 3 : 12, 0.5); P.p(sp, 7, 6); P.p(sp, 8, 6); }
    return;
  }
  const f = P.m(key === 'magitechschild' ? '#3a4250' : col);
  if (key === 'tower_shield') { P.r(rim, 2, 1, 12, 14); P.r(f, 3, 2, 10, 12); for (const [x, y] of [[3, 2], [12, 2], [3, 13], [12, 13]]) P.d(x, y, STEEL); P.dl(7, 2, 7, 13, 'hi'); P.dl(8, 2, 8, 13, 'sh'); return; }
  const kite = key === 'kite_shield', out = kite ? [5, 6, 6, 6, 6, 5.5, 5, 4.5, 4, 3.5, 2.5, 1.5, 1, 0.5] : [6, 6.5, 6.5, 6.5, 6.5, 6.5, 6, 5.5, 5, 4, 3, 2, 1, 0.5];
  P.rows(rim, 1, out); P.rows(f, 2, out.slice(1).map(w => w - 1.2));
  if (key === 'magitechschild') { const g = P.m('#6ae0ff'); P.e(g, 7.5, 6.5, 1.6, 1.6); P.dl(7, 8, 7, 12, '#6ae0ff'); P.dl(3, 4, 6, 6, '#6ae0ff'); P.dl(12, 4, 9, 6, '#6ae0ff'); }
  else if (kite) { const mk = L.markCol || '#8a8172'; P.pat(f, (x, y) => Math.abs(x - y + 1) <= 0.5 || Math.abs(x - y) <= 0.5 ? mk : 0); }
  else { const bs = P.m(STEEL); P.e(bs, 7.5, 6, 1.4, 1.4); }
}

// ---- Hände, Beine, Füße ----
const matOf = (key, it) => /ketten|chain/.test(key) ? 'chain' : /leder|wickel/.test(key) ? 'leather' : (it.armor | 0) >= 2 || /panzer|schien|thron|blut|toten|hochritter|iron/.test(key) ? 'plate' : 'leather';
function handIcon(P, L, key, it) {
  const col = L.glove || '#5a4030', m = P.m(col), mat = matOf(key, it), cf = P.m(darker(col, 0.15));
  P.r(m, 4, 3, 6, 6); for (const x of [4, 6, 8]) { P.r(m, x, 1, 1, 2); P.d(x + 1, 2, 'dk'); } P.p(m, 9, 2); P.seg(m, 10, 6, 12, 4, 0.7);
  P.rows(cf, 9, [3, 3, 3.5, 3.5, 4], 7);
  if (mat === 'plate') { P.dl(4, 5, 9, 5, 'hi'); P.dl(4, 6, 9, 6, 'dk'); P.dl(4, 11, 10, 11, 'dk'); }
  else if (mat === 'chain') { P.pat(m, (x, y) => (x + y) & 1 ? 'sh' : 0); P.pat(cf, (x, y) => (x + y) & 1 ? 'sh' : 0); }
  else { P.dl(7, 4, 7, 8, 'dk'); P.dl(4, 10, 9, 10, 'hi'); }
  const tr = { epic: GOLD, legendary: GOLD, rare: STEEL }[it.rarity]; if (tr) P.dl(4, 13, 10, 13, tr);
}
function legIcon(P, L, key, it) {
  const col = L.pants && L.pants !== '#2f2519' ? L.pants : '#4a3626', m = P.m(col), mat = matOf(key, it), wb = P.m(darker(col, 0.25));
  P.h(wb, 1, 3, 12); P.h(wb, 2, 3, 12);
  for (let y = 3; y <= 14; y++) { const w = y < 8 ? 3 : y < 12 ? 2.5 : 2; P.s(m, y, w / 2 + 0.5, 4.5); P.s(m, y, w / 2 + 0.5, 10.5); }
  if (mat === 'chain') P.pat(m, (x, y) => (x + y) & 1 ? 'sh' : 0);
  else if (mat === 'plate') for (let y = 9; y <= 14; y++) { P.d(4, y, 'hi'); P.d(10, y, 'hi'); }
  else { P.dl(5, 4, 5, 14, 'dk'); P.dl(11, 4, 11, 14, 'dk'); }
  if (L.kn || mat === 'plate') { const kn = P.m(lighter(col, 0.2)); P.e(kn, 4.5, 8.5, 1.6, 1.2); P.e(kn, 10.5, 8.5, 1.6, 1.2); }
  const tr = { epic: GOLD, legendary: GOLD }[it.rarity]; if (tr) { P.dl(3, 2, 12, 2, tr); }
}
function bootIcon(P, L, key, it) {
  const col = key === 'wickel_stille_hand' ? '#d9d2c0' : L.boots && L.boots !== '#241b13' ? L.boots : '#3a2a1c', m = P.m(col), so = P.m('#1e1610');
  const boot = (x0, y0) => { P.r(m, x0, y0, 4, 8); P.r(m, x0 - 2, y0 + 7, 6, 2); P.h(so, y0 + 9, x0 - 2, x0 + 3); };
  boot(3, 2); boot(10, 3);
  if (key === 'wickel_stille_hand') { P.pat(m, (x, y) => (x + y) % 3 === 0 ? 'sh' : 0); const mo = P.m(L.mc || '#e6cf8a'); for (const [x, y] of [[1, 2], [8, 1], [15, 6]]) P.p(mo, x, y); }
  else if (matOf(key, it) === 'plate') { const pl = P.m(lighter(col, 0.25)); P.r(pl, 3, 2, 4, 2); P.r(pl, 10, 3, 4, 2); P.d(1, 9, 'hi'); P.d(8, 10, 'hi'); }
  else { P.dl(3, 3, 6, 3, 'dk'); P.dl(10, 4, 13, 4, 'dk'); }
}

// ---- Flaschen, Talismane, Technik, Werkzeug, Waren ----
function flask(P, liq, o = {}) {   /* schlanke, eckige oder bauchige Flasche */
  const g = P.m(o.glass || '#8aa0a0'), l = P.m(liq), k = P.m(o.cork || '#8a6a42'), sh = o.shape || 'slim';
  P.r(k, 7, 1, 2, 2); P.r(g, 7, 3, 2, 3);
  if (sh === 'square') { P.r(g, 4, 6, 8, 9); P.r(l, 5, 8, 6, 6); }
  else if (sh === 'round') { P.e(g, 7.5, 10.5, 5, 4.5); P.e(l, 7.5, 11, 3.8, 3.2); }
  else { P.rows(g, 6, [1.5, 2.5, 3, 3.5, 3.5, 3.5, 3.5, 3, 2.5]); P.rows(l, 9, [2.5, 2.5, 2.5, 2.5, 2, 1.5]); }
  P.d(sh === 'square' ? 5 : 6, 7, '#eef4ee');
  if (o.label) { const lb = P.m(PARCH); P.r(lb, 6, 10, 4, 2); P.d(7, 10, 'dk'); }
  if (o.spark) for (const [x, y] of [[6, 11], [9, 12]]) P.d(x, y, o.spark);
}
function cord(P) { const c = P.m('#6a5a44'); P.seg(c, 2, 1, 7, 6, 0.5); P.seg(c, 13, 1, 8, 6, 0.5); }
function amulet(P, gem, shape) {
  cord(P); const m = P.m(shape === 'rune' ? '#6a6a62' : BRASS), g = P.m(gem);
  if (shape === 'rund') { P.e(m, 7.5, 10, 3.8, 3.8); P.e(g, 7.5, 10, 2.3, 2.3); P.d(6.6, 9, '#f4eee0'); }
  else if (shape === 'raute') { P.rows(m, 7, [0.5, 1.5, 2.5, 3.5, 2.5, 1.5, 0.5]); P.rows(g, 8, [0.5, 1.5, 2.5, 1.5, 0.5]); }
  else if (shape === 'zahn') { P.r(m, 6, 7, 4, 1); P.p(g, 7, 7); P.p(g, 8, 7); const b = P.m(BONE); P.poly(b, [[6, 8], [10, 8], [9.5, 11], [8.5, 14.5], [7.5, 15], [7.5, 12], [6.5, 10]]); }
  else if (shape === 'feder') { P.r(m, 7, 7, 2, 1); const f = P.m(gem); P.poly(f, [[7.5, 8], [10, 10], [9.5, 13], [8, 15], [6, 12], [6, 9.5]]); P.dl(8, 8, 8, 14, 'dk'); }
  else if (shape === 'rune') { P.r(m, 5, 7, 6, 7); P.x(5, 7); P.x(10, 13); P.dl(6, 8, 9, 12, gem); P.dl(9, 8, 6, 12, gem); P.dl(7, 8, 7, 12, gem); }
  else { P.rows(m, 7, [3, 3, 3, 3, 2.5, 1.5, 0.5]); P.rows(g, 8, [2, 2, 2, 1.5, 0.5]); }
}
function shard(P, col, glow) { const s = P.m(col); P.poly(s, [[10, 1], [13, 4], [9, 14.5], [5.5, 12]]); P.poly(s, [[4.5, 6], [7, 8], [5.5, 13], [3, 11]]); P.dl(10, 2, 7, 12, 'hi'); P.dl(4, 8, 5, 11, 'hi'); if (glow) { P.d(9, 6, glow); P.d(8, 9, glow); P.d(10, 4, glow); } }
function orb(P, core, cage, hi) { const g = P.m(core), m = P.m(cage); P.e(g, 7.5, 7.5, 6, 6); P.h(m, 4, 2, 13); P.h(m, 11, 2, 13); P.dl(7, 1, 7, 14, darker(cage, 0.1)); P.r(m, 6, 0, 4, 1); P.d(5, 6, hi || '#f4fff8'); P.d(6, 6, hi || '#f4fff8'); }
function seal(P, wax, emblem, o = {}) {
  if (o.ribbon) { const rb = P.m(o.ribbon); P.seg(rb, 5, 10, 3, 15, 0.9); P.seg(rb, 10, 10, 12, 15, 0.9); }
  const w = P.m(wax); P.e(w, 7.5, 7.5, 5.5, 5.5); for (const [x, y] of [[2, 4], [13, 9], [5, 13], [11, 2]]) P.p(w, x, y);
  P.pat(w, (x, y) => Math.abs(Math.hypot(x - 7.5, y - 7.5) - 3.3) < 0.5 ? 'sh' : 0);
  if (emblem === 'cross') { P.dl(7, 5, 7, 10, o.mk || 'dk'); P.dl(8, 5, 8, 10, o.mk || 'dk'); P.dl(5, 7, 10, 7, o.mk || 'dk'); }
  else if (emblem === 'skull') { P.d(6, 6, 'dk'); P.d(9, 6, 'dk'); P.dl(6, 9, 9, 9, 'dk'); if (o.glow) { P.d(6, 6, o.glow); P.d(9, 6, o.glow); } }
  else if (emblem === 'salt') { P.dl(5, 6, 10, 6, 'hi'); P.dl(6, 8, 9, 8, 'hi'); P.dl(7, 10, 8, 10, 'hi'); }
  else { P.d(7, 7, 'hi'); P.d(8, 7, 'hi'); P.d(7, 8, 'dk'); P.d(8, 8, 'dk'); }
}
function letter(P, paper, wax) { const p = P.m(paper); P.r(p, 1, 4, 14, 9); P.dl(1, 4, 7, 9, 'sh'); P.dl(8, 9, 14, 4, 'sh'); P.dl(1, 12, 5, 9, 'sh'); P.dl(10, 9, 14, 12, 'sh'); const w = P.m(wax); P.e(w, 7.5, 9, 1.6, 1.4); }
function sack(P, col, o = {}) { const s = P.m(col); P.poly(s, [[5, 3], [10, 3], [9, 5], [13, 9], [13, 13], [11, 15], [4, 15], [2, 13], [2, 9], [6, 5]]); const t = P.m(ROPE); P.h(t, 5, 6, 9);
  P.dl(5, 8, 4, 13, 'sh'); P.dl(10, 8, 11, 13, 'sh'); if (o.spill) { const sp = P.m(o.spill); for (const [x, y] of [[13, 14], [14, 13], [1, 14]]) P.p(sp, x, y); } if (o.mark) { P.d(7, 10, o.mark); P.d(8, 10, o.mark); P.d(7, 11, o.mark); P.d(8, 11, o.mark); } }
function crate(P, wood, o = {}) { const w = P.m(wood); P.r(w, 1, 6, 14, 9); P.dl(1, 9, 14, 9, 'dk'); P.dl(1, 12, 14, 12, 'dk'); P.dl(2, 7, 13, 13, 'sh'); for (const [x, y] of [[2, 7], [13, 7], [2, 13], [13, 13]]) P.d(x, y, IRON); }
function gear(P, col, cx, cy, r, hub) { const g = P.m(col); P.e(g, cx, cy, r, r); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; P.p(g, cx + Math.cos(a) * (r + 1), cy + Math.sin(a) * (r + 1)); } const v = P.m(hub || VOIDC); P.e(v, cx, cy, Math.max(0.6, r * 0.35), Math.max(0.6, r * 0.35)); return g; }
const TIER = { schrott: ['#7a5a40', '#4a4440', '#9a6a3a'], aurel: [BRASS, '#e0d8c0', '#e8c060'], meister: [STEEL, GOLD, '#8ad0e8'], proto: ['#3a4250', '#6fd8ff', '#6fd8ff'] };
const tierOf = k => k.startsWith('schrott') || k.endsWith('_schrott') ? 'schrott' : /aurel/.test(k) ? 'aurel' : /meister/.test(k) ? 'meister' : 'proto';
function protArm(P, T) { const m = P.m(T[0]), j = P.m(T[1]), st = P.m(LEATH); P.seg(m, 3, 2, 6, 8, 1.8); P.seg(st, 2, 1, 5, 0.5, 0.9); P.seg(m, 7, 9, 11, 12, 1.4); P.e(j, 6.5, 8.5, 1.6, 1.6);
  const c = P.m(darker(T[0], 0.1)); P.seg(c, 11, 12, 14, 13, 0.6); P.seg(c, 11, 12, 12, 15, 0.6); P.seg(c, 11, 12, 14.5, 10.5, 0.5); P.dl(4, 3, 6, 7, 'dk'); if (T[2]) P.d(6, 8, T[2]); }
function protLeg(P, T) { const m = P.m(T[0]), j = P.m(T[1]); P.seg(m, 7.5, 1, 7.5, 7, 2.2); P.seg(m, 7.5, 9, 7.5, 12.5, 1.3); P.e(j, 7.5, 8, 1.8, 1.8); const f = P.m(darker(T[0], 0.15)); P.poly(f, [[5, 12.5], [12.5, 12.5], [13, 14.5], [5, 14.5]]);
  P.dl(9, 2, 9, 6, 'dk'); P.dl(6, 10, 6, 12, 'hi'); if (T[2]) P.d(7, 8, T[2]); }
const KEYED = {
  // Elixiere: drei Flaschenformen, Farbe nach Wirkung
  elixier_staerke: P => flask(P, '#c0482a', { shape: 'square', label: 1 }), elixier_ausdauer: P => flask(P, '#d8a030', { label: 1 }), elixier_eile: P => flask(P, '#a8c840', { shape: 'round' }),
  elixier_stein: P => flask(P, '#8a8a80', { shape: 'square', spark: '#c8c8c0' }), elixier_wut: P => flask(P, '#7a1418', { shape: 'round', spark: '#e0402a' }), elixier_arkan: P => flask(P, '#4a6ad0', { spark: '#c0d8ff' }),
  elixier_auge: P => flask(P, '#40b8b0', { shape: 'round', label: 1 }), elixier_wacht: P => flask(P, '#5a7aa0', { shape: 'square' }), elixier_regen: P => flask(P, '#4aa04a', { label: 1 }), elixier_lehre: P => flask(P, '#8a50b0', { shape: 'round', spark: '#e0c0ff' }),
  blutphiole: P => flask(P, '#6a0e12', { glass: '#6a7a7a', cork: '#3a2a20', spark: '#a01a1a' }), spezialoel: P => flask(P, '#d8b850', { shape: 'square', glass: '#a0b0b0', cork: '#4a4a52', spark: '#fff0b0' }),
  // Talismane
  talisman_ausdauer: P => amulet(P, '#d89a30', 'rund'), talisman_leichtfuss: P => amulet(P, '#9ab8a0', 'feder'), talisman_krieger: P => amulet(P, '#b8322a', 'raute'),
  talisman_waechter: P => amulet(P, '#4a6a9a', 'schild'), talisman_jaeger: P => amulet(P, '#4a7a3a', 'zahn'), talisman_toten: P => amulet(P, '#6affb0', 'rune'),
  talisman_magie: P => amulet(P, '#9a6ad0', 'raute'), talisman_leben: P => amulet(P, '#5ab04a', 'rund'),
  glocke_moorbach: P => { const m = P.m('#8a7a5a'); P.r(m, 7, 1, 2, 2); P.rows(m, 3, [1.5, 2.5, 3, 3.5, 3.5, 4, 4.5, 5, 6, 6.5]); P.dl(2, 12, 13, 12, 'dk'); P.dl(4, 6, 4, 11, 'hi'); const k = P.m('#4a4038'); P.r(k, 7, 13, 2, 2); P.pat(m, (x, y) => y === 9 && x % 2 ? '#4a6a4a' : 0); },
  magiekern: P => orb(P, '#4a8ae0', BRASS), automatenkern: P => orb(P, '#5ac08a', '#7a6a50', '#d0ffe0'),
  splitter_rotfall: P => shard(P, '#b8302a', '#ff8a6a'), meteorsplitter: P => shard(P, '#5a5470', '#e08a3a'), himmelssplitter: P => shard(P, '#a9d4e8', '#ffffff'),
  blutstein: P => { const g = P.m('#8a1418'); P.poly(g, [[4, 3], [11, 2], [14, 7], [11, 14], [4, 13], [2, 8]]); P.dl(4, 4, 7, 8, 'hi'); P.dl(11, 3, 8, 8, 'hi'); P.dl(7, 8, 8, 8, 'hi'); P.dl(8, 9, 10, 13, 'dk'); P.d(5, 5, '#ff6a5a'); },
  eulenauge: P => { const m = P.m(BRASS), g = P.m('#d89a30'), v = P.m(VOIDC); P.e(m, 7.5, 7.5, 6, 5); P.e(g, 7.5, 7.5, 4.5, 3.6); P.r(v, 7, 5, 2, 6); P.d(5, 6, '#fff0c0'); },
  totenmuenze: P => { const m = P.m('#a8945a'); P.e(m, 7.5, 7.5, 6, 6); const b = P.m(BONE); P.rows(b, 4, [2, 2.5, 2.5, 2]); P.r(b, 6, 8, 4, 2); P.d(6, 6, VOIDC); P.d(9, 6, VOIDC); P.d(7, 9, 'dk'); P.d(8, 9, 'dk'); P.pat(m, (x, y) => Math.hypot(x - 7.5, y - 7.5) > 5 ? 'sh' : 0); },
  // Bionik: Prothesen, Module, Augen, Zelle
  schrottarm: P => protArm(P, TIER.schrott), aurelarm: P => protArm(P, TIER.aurel), meisterarm: P => protArm(P, TIER.meister), protoarm: P => protArm(P, TIER.proto),
  schrottbein: P => protLeg(P, TIER.schrott), aurelbein: P => protLeg(P, TIER.aurel), meisterbein: P => protLeg(P, TIER.meister), protobein: P => protLeg(P, TIER.proto),
  greifhand: P => { const m = P.m(STEEL), j = P.m(BRASS); P.e(j, 7.5, 3.5, 3, 2.2); P.seg(m, 5.5, 5, 3, 11, 0.8); P.seg(m, 7.5, 6, 7.5, 13, 0.8); P.seg(m, 9.5, 5, 12, 11, 0.8); P.p(m, 4, 12); P.p(m, 11, 12); P.p(m, 8, 14); },
  klingenhand: P => { const c = P.m('#4a4a52'), b = P.m('#c8ccd4'); P.r(c, 5, 1, 6, 4); P.dl(5, 2, 10, 2, BRASS); P.poly(b, [[6, 5], [9.5, 5], [9, 13], [7.5, 15], [6.5, 13]]); P.dl(7, 6, 7, 13, 'hi'); },
  uhrmacherhand: P => { const m = P.m(BRASS); P.r(m, 4, 6, 6, 5); P.r(m, 5, 11, 4, 3); for (const x of [4, 6, 8]) P.seg(m, x + 0.5, 6, x + 0.5, 1.5, 0.45); P.seg(m, 10, 8, 12.5, 6, 0.45); gear(P, '#8a7a5a', 12, 12, 2); },
  federfuss: P => { const m = P.m(STEEL); for (let k = 0; k < 4; k++) P.seg(m, 5, 2 + k * 2.5, 10, 3.2 + k * 2.5, 0.55); P.r(P.m(BRASS), 6, 0, 4, 2); const f = P.m('#3a3a40'); P.r(f, 3, 12, 10, 3); },
  ankerfuss: P => { const m = P.m('#5a5a62'); P.e(m, 7.5, 2, 1.8, 1.6); P.x(7, 2); P.x(8, 2); P.r(m, 7, 3, 2, 9); P.h(m, 5, 5, 10); P.seg(m, 2, 9, 4, 13, 0.8); P.seg(m, 13, 9, 11, 13, 0.8); P.seg(m, 4, 13, 11, 13, 0.9); P.p(m, 2, 8); P.p(m, 13, 8); },
  auge_schrott: P => eyeIcon(P, '#7a5a40', '#8ab070'), auge_aurel: P => eyeIcon(P, BRASS, '#d89a30'), auge_meister: P => eyeIcon(P, STEEL, '#8ad0e8'), auge_proto: P => eyeIcon(P, '#3a4250', '#6fd8ff'),
  energiezelle: P => { const m = P.m('#5a5a62'), c = P.m(BRASS), g = P.m('#6ae0ff'); P.r(m, 4, 3, 8, 11); P.r(c, 4, 2, 8, 2); P.r(c, 4, 13, 8, 2); P.r(c, 6, 0, 4, 2); P.r(g, 6, 5, 4, 7); P.d(7, 6, '#e0ffff'); P.dl(6, 9, 9, 9, '#e0ffff'); },
  wasserschlauch: P => { const s = P.m('#7a5a3a'); P.poly(s, [[6, 3], [10, 3], [13, 8], [13, 13], [10, 15], [4, 15], [2, 12], [3, 7]]); const k = P.m('#4a3a2a'); P.r(k, 7, 1, 2, 3); P.seg(P.m('#3a2a1c'), 3, 6, 6, 1, 0.5); P.dl(5, 8, 4, 13, 'hi'); P.d(9, 10, '#7ab0c8'); },
  koederpfeife: P => { const b = P.m(BONE); P.seg(b, 2, 10, 11, 5, 1.4); const m = P.m('#6a4a2a'); P.seg(m, 11, 5, 14, 3.5, 0.9); P.d(6, 8, VOIDC); P.d(8, 7, VOIDC); const c = P.m('#8a2a20'); P.seg(c, 2, 11, 4, 14, 0.5); },
  // Werkzeug
  tool_hammer: P => { const w = P.m(WOOD), m = P.m('#5a5a60'); P.seg(w, 3, 14, 10, 6, 0.8); P.seg(m, 7, 2.5, 13, 8.5, 1.7); P.d(12, 7, 'hi'); P.d(13, 8, 'dk'); },
  tool_hoe: P => { const w = P.m(WOOD), m = P.m('#6a6862'); P.seg(w, 3, 14, 11, 3, 0.7); P.poly(m, [[10, 1.5], [14, 3], [13, 7], [11, 5]]); P.dl(13, 4, 13, 6, 'hi'); },
  tool_saw: P => { const m = P.m('#9aa0a8'), w = P.m(WOOD); P.poly(m, [[1.5, 11], [10.5, 3], [12.5, 5.5], [3.5, 13.5]]); P.pat(m, (x, y) => (x + y) % 2 === 0 && x + y >= 15 ? 'dk' : 0); P.e(w, 12.5, 3.5, 2.2, 2.6); P.d(12, 3, VOIDC); P.d(13, 4, VOIDC); },
  tool_spoon: P => { const w = P.m('#8a6a40'); P.seg(w, 3, 14, 9.5, 6, 0.7); P.e(w, 11, 4, 2.6, 3); P.d(11, 4, 'dk'); P.d(10, 3, 'sh'); P.d(11, 5, 'sh'); },
  tool_fork: P => { const w = P.m(WOOD), m = P.m('#6a6862'); P.seg(w, 8, 6.5, 8, 15, 0.6); P.seg(m, 4, 6, 12, 6, 0.6); for (const x of [4, 8, 12]) P.seg(m, x, 1, x, 6, 0.6); },
  // Waren und Aufträge
  wood: P => { const a = P.m('#8a6a42'), b = P.m('#6a4e30'); P.r(a, 1, 4, 14, 3); P.r(b, 2, 8, 13, 3); P.r(a, 1, 12, 14, 3); for (const y of [5, 9, 13]) P.dl(3, y, 12, y, 'sh'); for (const y of [4, 8, 12]) P.d(14, y + 1, '#d0aa78'); },
  stone: P => { const s = P.m('#6a655c'), t = P.m('#7a7468'); P.poly(s, [[1, 14], [2, 9], [6, 7], [9, 10], [9, 14.5]]); P.poly(t, [[7, 14.5], [8, 8], [12, 5], [15, 9], [14.5, 14.5]]); P.poly(s, [[4, 7], [6, 3], [10, 2], [11, 5], [8, 8]]); },
  stoneware: P => { const a = P.m('#8a8478'), b = P.m('#7a7468'), c = P.m('#968f82'); P.r(a, 1, 9, 7, 5); P.r(b, 8, 9, 7, 5); P.r(c, 4, 3, 8, 6); for (const [x, y] of [[3, 11], [11, 12], [7, 5]]) P.d(x, y, 'sh'); },
  salt: P => sack(P, '#c8c4b8', { spill: '#f0f0ec' }), tributgut: P => sack(P, '#7a6040', { mark: GOLD }),
  cloth: P => { const c = P.m('#7a3a34'), e = P.m('#9a5a4a'); P.r(c, 3, 4, 12, 9); P.e(e, 3, 8.5, 2, 4.5); P.d(3, 8, 'dk'); P.d(3, 9, 'dk'); P.dl(5, 6, 14, 6, 'hi'); P.dl(5, 11, 14, 11, 'sh'); },
  meat: P => { const m = P.m('#9a3a2a'), b = P.m(BONE); P.e(m, 8.5, 7, 5.5, 4.5); P.seg(m, 6, 9, 3.5, 12.5, 1.6); P.seg(b, 3.5, 12.5, 1.5, 14.5, 0.8); P.d(8, 6, '#e0c0a0'); P.d(10, 7, '#e0c0a0'); P.dl(5, 4, 9, 3, 'hi'); },
  woodware: P => { const w = P.m('#7a5a34'); P.rows(w, 2, [4, 4.5, 5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5, 4.5, 4]); for (const y of [4, 10]) P.dl(2, y, 13, y, '#4a4a4a'); P.dl(5, 3, 5, 12, 'sh'); P.dl(10, 3, 10, 12, 'sh'); },
  tools: P => { crate(P, '#7a5a34'); const m = P.m('#6a6862'), w = P.m(WOOD); P.seg(w, 4, 6, 6, 1, 0.6); P.seg(m, 4, 1.5, 8, 1.5, 0.9); P.seg(m, 10, 6, 12, 2, 0.5); P.seg(m, 12, 6, 10, 2, 0.5); },
  arms: P => { crate(P, '#5a4630'); const s = P.m(STEEL), g = P.m(BRASS); P.seg(s, 5, 0.5, 5, 5, 0.6); P.h(g, 4, 3, 7); P.seg(s, 10, 0.5, 11, 5, 0.6); P.p(s, 9, 0); P.p(s, 10, 0); },
  magitech: P => { gear(P, '#5a5a62', 6, 9, 3.5, '#6ae0ff'); gear(P, BRASS, 12, 4, 2); },
  ersatzteile: P => { gear(P, '#6a6862', 6, 7, 3.5); const b = P.m(STEEL); P.seg(b, 9, 13, 14, 9, 0.6); P.r(b, 8, 12, 2, 2); },
  feinwerkzeug: P => { const r = P.m(LEATH); P.r(r, 1, 8, 14, 7); P.dl(1, 11, 14, 11, 'sh'); const m = P.m(STEEL); P.seg(m, 4, 8, 3, 2, 0.5); P.seg(m, 7, 8, 7, 1.5, 0.5); P.seg(m, 10, 8, 11, 2, 0.5); P.seg(m, 12, 8, 13.5, 3, 0.5); P.d(3, 2, '#d8c8a0'); P.d(7, 2, BRASS); },
  wassereimer: P => { const w = P.m('#6a4a2a'), a = P.m('#4a7a9a'), h = P.m('#4a4a50'); P.poly(w, [[2, 6], [14, 6], [12.5, 15], [3.5, 15]]); P.e(a, 8, 6.5, 5.5, 1.2); for (const y of [8, 13]) P.dl(3, y, 13, y, '#3a3a40'); P.seg(h, 2, 6, 5, 1.5, 0.45); P.seg(h, 5, 1.5, 11, 1.5, 0.45); P.seg(h, 11, 1.5, 14, 6, 0.45); P.d(6, 6, '#c8e8f0'); },
  seekarte: P => { const p = P.m(PARCH), r = P.m('#b8a478'); P.r(p, 3, 2, 10, 12); P.r(r, 1, 1, 2, 14); P.r(r, 13, 1, 2, 14); P.dl(4, 5, 7, 7, '#6a7a8a'); P.dl(7, 7, 6, 11, '#6a7a8a'); P.dl(9, 4, 11, 6, '#6a7a8a'); P.d(10, 10, '#a02a20'); P.d(11, 11, '#a02a20'); P.d(11, 9, '#a02a20'); P.d(9, 11, '#a02a20'); },
  auftragsbrief: P => letter(P, PARCH, '#9b2e26'), antwortbrief: P => letter(P, '#c8bca0', '#5a3a6a'),
  auftragspaket: P => { const b = P.m('#8a6a44'), t = P.m(ROPE); P.r(b, 2, 4, 12, 10); P.r(t, 7, 4, 2, 10); P.r(t, 2, 8, 12, 2); P.dl(2, 4, 13, 4, 'hi'); P.e(P.m('#9b2e26'), 7.5, 8.5, 1.4, 1.4); },
  vargs_tagebuch: P => { const c = P.m('#3a2a24'), p = P.m(PARCH); P.r(p, 4, 3, 10, 11); P.r(c, 2, 2, 10, 12); P.dl(3, 2, 3, 13, 'dk'); P.r(P.m(BRASS), 10, 7, 3, 2); P.dl(5, 5, 9, 5, '#6a1a14'); },
  fernrohr: P => { const b = P.m(BRASS), d = P.m('#6a5030'); P.seg(d, 1.5, 13.5, 6, 9, 1.8); P.seg(b, 6, 9, 10.5, 4.5, 1.4); P.seg(b, 10.5, 4.5, 14, 1, 1); P.dl(6, 8, 7, 10, 'dk'); P.dl(10, 4, 11, 5, 'dk'); P.d(14, 1, '#c8e8f0'); },
  vargs_kette: P => { const m = P.m('#7a7a80'), v = P.m(VOIDC); for (let k = 0; k < 4; k++) { const cx = 3 + k * 3.2, cy = 3 + k * 3.2; P.e(m, cx, cy, 2.2, 1.6); P.p(v, cx, cy); } },
  strick: P => { const r = P.m(ROPE); P.e(r, 7.5, 8, 6.5, 5.5); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (((x - 7.5) / 4) ** 2 + ((y - 8) / 3) ** 2 <= 1) P.x(x, y);
    const r2 = P.m(darker(ROPE, 0.15)); P.e(r2, 7.5, 8, 3, 2); P.x(7, 8); P.x(8, 8); P.seg(r, 12, 12, 14.5, 15, 0.6); P.pat(r, (x, y) => (x + y) % 3 === 0 ? 'sh' : 0); },
  rotes_siegel: P => seal(P, '#9b2e26', 'cross', { mk: '#5a1210' }), salzsiegel: P => seal(P, '#c8c4b8', 'salt', { ribbon: '#3a5a7a' }),
  grave_seal: P => seal(P, '#2a3a32', 'skull', { glow: '#6affb0' }), order_seal: P => seal(P, '#d9d2c0', 'cross', { mk: '#9b2e26', ribbon: '#9b2e26' }),
  blutmaske: P => { const m = P.m('#7a1418'), v = P.m(VOIDC); P.rows(m, 3, [4, 5, 5.5, 5.5, 5.5, 5, 4.5, 4, 3, 2]); P.e(v, 5.5, 7, 1.3, 0.8); P.e(v, 9.5, 7, 1.3, 0.8); P.dl(7, 10, 8, 10, 'dk'); const s = P.m(LEATH); P.seg(s, 1, 6, 2, 7, 0.5); P.seg(s, 14, 6, 13, 7, 0.5); P.dl(7, 3, 7, 6, 'hi'); },
  stiefelscheide: P => { const l = P.m(LEATH), s = P.m('#5a5a60'); P.poly(l, [[5.5, 6], [10.5, 6], [9, 15], [7, 15]]); P.r(s, 5, 4, 6, 1); P.r(P.m('#3a2a1c'), 7, 1, 2, 3); P.d(7, 0, BRASS); P.dl(6, 8, 10, 8, 'dk'); P.dl(6, 11, 9, 11, 'dk'); },
  trophaee: P => { const w = P.m('#5a3e24'), b = P.m(BONE), v = P.m(VOIDC); P.e(w, 7.5, 9, 6, 5.5); P.rows(b, 5, [2.5, 3, 3, 2.5, 1.5, 1]); P.p(v, 6, 7); P.p(v, 9, 7); const h = P.m('#c8b890'); P.seg(h, 5, 5, 2, 3, 0.6); P.seg(h, 2, 3, 2, 0.5, 0.5); P.seg(h, 10, 5, 13, 3, 0.6); P.seg(h, 13, 3, 13, 0.5, 0.5); },
  ancestor_urn: P => { const u = P.m('#6a5a48'), g = P.m(GOLD); P.r(u, 6, 1, 4, 1); P.rows(u, 2, [2.5, 1.5, 2, 3.5, 4.5, 5, 5, 5, 4.5, 4, 3, 3.5]); P.dl(3, 7, 12, 7, GOLD); P.dl(3, 11, 12, 11, GOLD); P.p(g, 7, 0); P.p(g, 8, 0); P.d(5, 8, '#a8d0b0'); P.d(10, 9, '#a8d0b0'); },
  scout_report: P => { letter(P, '#c8b890', '#4a5a3a'); P.dl(3, 6, 6, 6, 'dk'); },
};
function eyeIcon(P, met, iris) { const m = P.m(met), l = P.m('#d8e0e0'), i = P.m(iris), v = P.m(VOIDC); P.e(m, 7.5, 7.5, 6.2, 6.2); P.e(l, 7.5, 7.5, 4.3, 4.3); P.e(i, 7.5, 7.5, 2.4, 2.4); P.r(v, 7, 7, 2, 2);
  for (const [x, y] of [[7, 1], [1, 8], [14, 7], [8, 14]]) P.d(x, y, 'dk'); P.d(5, 5, '#ffffff'); }
/* Aliase: vorhandene Umrisse in eigenen Farben (jede Farbkombination nur einmal) */
const ALIAS = {
  koenigseisen: ['ingot', { s: '#3a4258', S: '#5a6a8a', W: '#9ab0d0', d: '#22283a' }], ore: ['iron', { s: '#5a5048', S: '#7a6e60', d: '#3a322a', r: '#8a6a4a', R: '#b08a5a' }],
  timber: ['hartholz', { b: '#7a5a34', B: '#5a4024', r: '#d0aa78', R: '#9a7444' }], pferchschluessel: ['dietrich', { m: '#6a5a4a', M: '#9a8a74', d: '#3a3028', r: '#5a4a3a' }],
  tool_rod: ['angel', { s: '#6a4a2a', l: '#c8c0b0', h: '#7a8088' }], bauplan_uhrmacherhand: ['buch_erzkunde', { p: '#3a5a8a', l: '#c8d8f0' }],
};
const RULE_CACHE = new Map();
/* Regel-Symbol für jeden Gegenstand ohne ICON_R-Bild und ohne Waffen-Sprite. look(): Aussehen am Körper (nur für Rüstung gebraucht, faul berechnet). */
export function ruleIcon(key, it, look) {
  let cv = RULE_CACHE.get(key); if (cv) return cv;
  const A = ALIAS[key];
  if (A) { const rows = ICON_R[A[0]][1]; cv = document.createElement('canvas'); cv.width = cv.height = 16; const t = cv.getContext('2d');
    rows.forEach((r, y) => { for (let x = 0; x < 16; x++) { const ch = r[x] || '.'; if (ch === '.') continue; t.fillStyle = ch === 'o' ? O : A[1][ch] || ICON_R[A[0]][0][ch] || '#ff00ff'; t.fillRect(x, y, 1, 1); } }); }
  else {
    const P = new Pic(), sl = it.slot, u = it.use, hk = hashK(key);
    if (KEYED[key]) KEYED[key](P, it, key);
    else if (sl === 'chest') chestIcon(P, look(), key);
    else if (sl === 'head') headIcon(P, look(), key);
    else if (sl === 'cloak') cloakIcon(P, look());
    else if (sl === 'offhand') shieldIcon(P, look(), key);
    else if (sl === 'hands') handIcon(P, look(), key, it);
    else if (sl === 'legs') legIcon(P, look(), key, it);
    else if (sl === 'feet') bootIcon(P, look(), key, it);
    else if (sl === 'talisman') amulet(P, ['#b8322a', '#4a6ad0', '#5ab04a', '#d89a30', '#9a6ad0'][hk % 5], ['rund', 'raute', 'zahn', 'feder', 'rune', 'schild'][hk % 6]);
    else if (u === 'prosthesis') (/bein/.test(key) ? protLeg : protArm)(P, TIER[tierOf(key)]);
    else if (u === 'eye') eyeIcon(P, TIER[tierOf(key)][0], TIER[tierOf(key)][2]);
    else if (u === 'mechmod') gear(P, BRASS, 7.5, 7.5, 4.5);
    else if (sl === 'consumable') flask(P, ['#c0482a', '#d8a030', '#4a6ad0', '#4aa04a', '#8a50b0'][hk % 5], { shape: ['slim', 'square', 'round'][hk % 3], label: hk & 1 });
    else if (sl === 'tool') { const w = P.m(WOOD), m = P.m('#6a6862'); P.seg(w, 3, 14, 10, 5, 0.7); P.seg(m, 8, 2.5, 13, 7.5, 1.3); }
    else if (/brief|bericht|report|letter/.test(key)) letter(P, PARCH, '#9b2e26');
    else if (/siegel|seal/.test(key)) seal(P, '#9b2e26', 'cross');
    else [P => sack(P, '#8a7a5a'), P => crate(P, '#7a5a34'), P => letter(P, PARCH, '#5a3a2a')][hk % 3](P);
    cv = P.done();
  }
  RULE_CACHE.set(key, cv); return cv;
}
