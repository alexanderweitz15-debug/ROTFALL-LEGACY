// Pixel-Sprite-System. Die Referenzblätter (grimdark, gedrungen, Kapuzen, Masken, zerlumpte Säume) sind die Art Direction.
//
// Regeln — jede neue Figur folgt ihnen:
//   Raster      Humanoide 20×25 Sprite-Pixel (oy = 1 Rand oben), Tiere 28×18 (Pivot x 15), Boss 34×38.
//   Maßstab     PX = 2 Welt-Einheiten je Sprite-Pixel; gezeichnet ohne Glättung (nearest neighbour).
//   Pivot       Fußmitte: Sprite-Punkt (10, 23) liegt auf Welt (e.x, e.y + 6). Hitbox bleibt e.r (Spiellogik unverändert).
//   Proportion  gedrungen: Kopf/Kapuze ≈ 1/3 der Höhe, breite Schultern, kurze Beine — wie die Referenzfiguren.
//   Kontur      1 px OUT (#0c0a08) um jede Silhouette (4er-Nachbarschaft), keine weichen Kanten.
//   Licht       oben links. Rampen: hi / b / sh / dk mit Farbverschiebung (hell → warm, Schatten → kühl violett).
//   Palette     Eingangsfarben werden entsättigt (mute): gedämpfte Erd-, Asche-, Knochen- und Rosttöne, Akzente sparsam.
//   Animation   Idle (2), Walk (4), Ausholen, Schlag, Treffer, Zaubern/Interagieren, Rolle (4 Rotationen), Knien, Liegen.
//   Cache       Jeder Frame wird einmal gemalt und gecacht; pro Bildschirm-Frame nur drawImage.

export const PX = 2;
const OUT = '#0c0a08';
const DEEP = '#0d0b0a';

// ---------------- Farbe ----------------
function rgb(h) {
  if (!h) return [0, 0, 0];
  if (h[0] === '#') {
    if (h.length === 4) return [parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16), parseInt(h[3] + h[3], 16)];
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  const m = h.match(/\d+/g) || [0, 0, 0];
  return [+m[0], +m[1], +m[2]];
}
const hex = (r, g, b) => '#' + ((1 << 24) | (clamp8(r) << 16) | (clamp8(g) << 8) | clamp8(b)).toString(16).slice(1);
const clamp8 = v => Math.max(0, Math.min(255, Math.round(v)));
export function mix(a, b, t) { const A = rgb(a), B = rgb(b); return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
function mute(h, k = 0.16) { const [r, g, b] = rgb(h), m = (r + g + b) / 3; return hex(r + (m - r) * k, g + (m - g) * k, b + (m - b) * k); }
const rampCache = new Map();
export function ramp(h) {
  let R = rampCache.get(h); if (R) return R;
  const m = mute(h);
  R = { hi: mix(m, '#f2e3c2', 0.24), b: m, sh: mix(m, '#17131c', 0.36), dk: mix(m, '#0c0a0f', 0.62) };
  rampCache.set(h, R); return R;
}

// ---------------- Pixelraster ----------------
export class G {
  constructor(w, h, oy = 0, ox = 0) { this.w = w; this.h = h; this.oy = oy; this.ox = ox; this.a = new Array(w * h).fill(null); }
  p(x, y, c) { y += this.oy; x += this.ox; if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.a[y * this.w + x] = c; }
  r(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, c); }
  at(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.a[y * this.w + x]; }
  flipX() { const n = new G(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) n.a[y * this.w + x] = this.a[y * this.w + (this.w - 1 - x)]; return n; }
  flipY() { const n = new G(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) n.a[y * this.w + x] = this.a[(this.h - 1 - y) * this.w + x]; return n; }
  rotCW() { const n = new G(this.h, this.w); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) n.a[x * n.w + (this.h - 1 - y)] = this.a[y * this.w + x]; return n; }
}
export function toCanvas(g, outline = true) {
  const cv = document.createElement('canvas'); cv.width = g.w; cv.height = g.h;
  const c = cv.getContext('2d');
  const a = g.a.slice();
  if (outline) for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const i = y * g.w + x;
    if (!g.a[i] && (g.at(x - 1, y) || g.at(x + 1, y) || g.at(x, y - 1) || g.at(x, y + 1))) a[i] = OUT;
  }
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const col = a[y * g.w + x]; if (col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); } }
  return cv;
}

// Weiße Silhouette für den Trefferblitz (einmal je Frame).
const flashCache = new WeakMap();
export function flashOf(cv) {
  let f = flashCache.get(cv); if (f) return f;
  f = document.createElement('canvas'); f.width = cv.width; f.height = cv.height;
  const c = f.getContext('2d'); c.drawImage(cv, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = '#fff1d6'; c.fillRect(0, 0, f.width, f.height);
  flashCache.set(cv, f); return f;
}

// ---------------- Aussehen (Spec → aufgelöste Rampen) ----------------
const SPEC_KEYS = ['sp', 'skin', 'hair', 'cloth', 'pants', 'boots', 'belt', 'hooded', 'hood', 'cloak', 'face', 'glow', 'armor', 'armorCol',
  'helm', 'helmCol', 'crest', 'hs', 'beard', 'robe', 'apron', 'tabard', 'mark', 'markCol', 'strap', 'pouch', 'scarf', 'shield', 'shieldCol', 'quiver', 'glove'];
function baseSpec() {
  return { sp: 'human', skin: '#d6b089', hair: '#2b2118', cloth: '#4a3a28', pants: '#2f2519', boots: '#241b13', belt: '#2a2016',
    hooded: 0, hood: '', cloak: '', face: 'human', glow: '', armor: '', armorCol: '', helm: '', helmCol: '', crest: '', hs: 0, beard: 0,
    robe: '', apron: 0, tabard: '', mark: '', markCol: '', strap: 0, pouch: 0, scarf: '', shield: '', shieldCol: '', quiver: 0, glove: '' };
}
const darkOf = c => mix(c, '#16120e', 0.45);

// Personen (Spieler, NPCs): aus Palette, Ausrüstung, Beruf.
export function humanSpec(e) {
  const p = e.pal || {}, eq = e.equip || {}, s = baseSpec();
  const prof = e.prof || '', key = e.key || '';
  s.skin = p.skin || s.skin; s.hair = p.hair || s.hair; s.cloth = p.cloth || s.cloth; s.glow = p.glow || '';
  s.hs = p.hs != null ? p.hs : e.kind === 'player' ? 0 : (((e.seed || 0) * 7) | 0) % 4;   // Frisur: 0 kurz, 1 lang, 2 kahl, 3 Zopf
  const chest = eq.chest && eq.chest.key, head = eq.head && eq.head.key, off = eq.offhand && eq.offhand.key;
  if (chest === 'leather_jerkin') { s.armor = 'leather'; s.armorCol = '#5a4030'; }
  else if (chest === 'chain_hauberk') { s.armor = 'chain'; s.armorCol = '#7c7b76'; }
  else if (chest === 'plate_cuirass') { s.armor = 'plate'; s.armorCol = p.armor || '#a39d8e'; }
  else if (p.armor) { s.armor = 'chain'; s.armorCol = p.armor; }
  if (head === 'leather_cap') { s.helm = 'cap'; s.helmCol = '#5a4030'; }
  else if (head === 'iron_helm') { s.helm = 'nasal'; s.helmCol = '#8b8a85'; }
  if (p.helm) { s.helm = 'great'; s.helmCol = p.helm; }
  s.crest = p.crest || '';
  if (eq.cloak || e.hooded || p.hood) {
    s.hooded = 1; s.cloak = p.cloak || (eq.cloak && eq.cloak.key === 'order_seal' ? '#d9d2c0' : darkOf(s.cloth));
    s.hood = p.hood || s.cloak;
  }
  if (off === 'wooden_shield') { s.shield = 'round'; s.shieldCol = '#5a4630'; s.mark = 'boss'; s.markCol = '#8a8172'; }
  else if (off === 'buckler') { s.shield = 'round'; s.shieldCol = '#77736a'; s.mark = 'boss'; s.markCol = '#a8a196'; }
  else if (off) { s.shield = 'heater'; s.shieldCol = p.shield || '#4a3f30'; s.markCol = p.shieldBoss || '#8a8172';
    s.mark = e.faction === 'order' ? 'cross' : e.faction === 'valen' ? 'chevron' : 'boss'; }
  const w = eq.weapon && eq.weapon.key;
  if (w === 'shortbow' || w === 'longbow' || w === 'hunting_bow') s.quiver = 1;
  const cls = e.currentClass;
  if (cls === 'mage' || cls === 'warlock') { s.robe = s.cloth; }
  if (e.undead) { s.face = 'skull'; s.glow = s.glow || '#4e8f7a'; }
  // Berufe und Figuren
  if (prof === 'Dorfvorsteher') { s.robe = s.cloth; s.scarf = '#6b5a45'; s.beard = 1; s.hs = 2; }
  else if (prof === 'Heilerin') { s.robe = '#c7bda6'; s.cloth = '#c7bda6'; s.hooded = 1; s.hood = '#7a2a22'; s.cloak = ''; s.face = 'human'; s.belt = '#7a2a22'; }
  else if (prof === 'Schmied') { s.apron = 1; s.hs = 2; s.beard = 1; s.glove = '#3a2c20'; }
  else if (prof === 'Bauer') { s.helm = s.helm || 'hat'; s.helmCol = s.helmCol || '#8a7a4a'; s.beard = s.hs & 1; }
  else if (prof === 'Holzfäller') { s.beard = 1; s.strap = 1; }
  else if (prof === 'Magd' || prof === 'Jorans Tochter' || prof === 'Kind des Dorfes') { s.helm = s.helm || 'scarf'; s.helmCol = s.helmCol || '#8a7d62'; s.hs = 1; }
  else if (prof === 'Händlerin' || prof === 'Kontorhändler' || prof === 'Händler') { s.pouch = 1; s.strap = 1; s.scarf = '#8c6a2e';
    if (prof !== 'Händlerin') { s.helm = s.helm || 'hat'; s.helmCol = s.helmCol || '#3a2c20'; s.beard = 1; } }
  else if (prof === 'Wache') { s.helm = 'nasal'; s.helmCol = '#8b8a85'; s.armor = 'chain'; s.armorCol = '#7c7b76'; s.tabard = '#2f4260'; s.mark = 'chevron'; s.markCol = '#b9c3d2'; }
  else if (prof === 'Torwache') { s.tabard = '#2f4260'; s.mark = 'chevron'; s.markCol = '#b9c3d2'; }                   // Valen: Blau, Silberwinkel
  else if (prof === 'Ordenswache') { s.tabard = '#d9d2c0'; s.mark = 'cross'; s.markCol = '#9b2e26'; s.helm = 'great'; s.helmCol = '#b9b19c'; }   // Orden: Elfenbein & Rot
  else if (prof === 'Söldnerwache') { s.scarf = '#7a5a2a'; s.strap = 1; s.pouch = 1; s.beard = s.hs & 1; }             // gekauft, nicht vereidigt
  else if (prof === 'Ehemaliger Söldner') { s.beard = 1; s.strap = 1; s.pouch = 1; }
  else if (prof === 'Jägerbursche') { s.hooded = 1; s.hood = '#3a4a2c'; s.cloak = '#2e3a24'; s.quiver = 1; s.strap = 1; }
  else if (prof === 'Bandenführer') { s.hooded = 1; s.hood = '#2a2119'; s.cloak = '#211a14'; s.face = 'cloth'; s.scarf = '#7a2a20'; s.strap = 1; s.armor = s.armor || 'leather'; s.armorCol = s.armorCol || '#4a3525'; }
  else if (prof === 'Grabgebundener') { s.robe = '#232a28'; s.hooded = 1; s.hood = '#1b2120'; s.cloak = '#161b1a'; s.face = 'mask'; s.glow = '#5fb39a'; }
  else if (prof === 'Alter Paladin') { s.tabard = '#d9d2c0'; s.mark = s.mark || 'cross'; s.markCol = '#9b2e26'; s.beard = 1; }
  else if (prof === 'Reisender' || prof === 'Flüchtling') { s.hooded = s.hooded || ((e.seed | 0) % 2); s.cloak = s.cloak || darkOf(s.cloth); s.hood = s.hood || s.cloak; s.strap = 1; s.pouch = 1; }
  if (key === 'kelan') { s.tabard = '#d9d2c0'; s.markCol = '#9b2e26'; }
  if (s.tabard && !s.mark) s.mark = 'cross';
  if (!s.markCol && s.tabard) s.markCol = '#9b2e26';
  return s;
}

// Humanoide Gegner (Goblins, Banditen, Untote, Soldaten).
export function monsterSpec(e, m) {
  const p = (m && m.pal) || {}, s = baseSpec(), t = e.mtype;
  s.skin = p.skin || '#b2926f'; s.cloth = p.cloth || '#3a3229'; s.hs = (((e.seed || 0) * 7) | 0) % 4;
  if (t === 'goblin' || t === 'goblin_warrior') {
    s.sp = 'goblin'; s.pants = '#3a2e1e'; s.boots = ''; s.hs = 2;
    if (t === 'goblin_warrior') { s.helm = 'cap'; s.helmCol = '#6b6156'; s.armor = 'leather'; s.armorCol = '#4a3a28'; s.shield = 'round'; s.shieldCol = '#3d2f20'; s.mark = 'boss'; s.markCol = '#6b6156'; }
  } else if (t === 'bandit' || t === 'bandit_archer') {
    s.hooded = 1; s.face = 'cloth'; s.strap = 1; s.pouch = 1;
    s.hood = t === 'bandit' ? '#2e241a' : '#2f3a24'; s.cloak = t === 'bandit' ? '#261e16' : '#26301d';
    s.scarf = t === 'bandit' ? '#7a2a20' : ''; s.armor = 'leather'; s.armorCol = '#4a3525';
    if (t === 'bandit_archer') s.quiver = 1;
  } else if (t === 'skeleton' || t === 'crypt_warden' || t === 'hrodvar') {
    s.sp = 'skeleton'; s.skin = p.skin || '#cfc8b4'; s.hooded = 1; s.hood = '#20252a'; s.cloak = '#191c20'; s.cloth = '#22252a';
    s.face = 'skull'; s.glow = e.glow || p.glow || '#4e8f7a'; s.boots = ''; s.pants = '#22252a';   // e.glow: Diener eines Nekromanten
    if (t === 'crypt_warden') { s.hooded = 0; s.helm = 'great'; s.helmCol = '#4a4f55'; s.armor = 'plate'; s.armorCol = '#3d4247'; s.tabard = '#1c1f24';
      s.mark = 'chevron'; s.markCol = '#7fd0b8'; s.shield = 'heater'; s.shieldCol = '#262a2e'; }
    if (t === 'hrodvar') { s.hooded = 0; s.helm = 'great'; s.helmCol = '#8fb3c7'; s.crest = '#c8e6f5'; s.armor = 'plate'; s.armorCol = '#5d7383'; s.tabard = '#1d2a36';
      s.mark = 'chevron'; s.markCol = '#9fd8ff'; s.cloak = '#16202a'; }   // Frostkönig: bereifte Platte, Kammhelm, kein Schild (Zweihänder)
  } else if (t === 'valen_soldier') {
    s.armor = 'chain'; s.armorCol = '#8a8f98'; s.helm = 'great'; s.helmCol = '#9aa3b0'; s.crest = '#39599c';
    s.tabard = '#2f4260'; s.mark = 'chevron'; s.markCol = '#b9c3d2'; s.shield = 'heater'; s.shieldCol = '#2f4260'; s.glove = '#5a5d63';
  }
  if (e.shield && !s.shield) { s.shield = 'round'; s.shieldCol = '#4a3f30'; s.mark = 'boss'; s.markCol = '#8a8172'; }
  return s;
}

const specKey = s => { let k = ''; for (const f of SPEC_KEYS) k += s[f] + '|'; return k; };
const lookCache = new Map();
function resolve(s, k) {
  let L = lookCache.get(k); if (L) return L;
  const pants = s.pants || '#2f2519';
  L = { ...s,
    skin: ramp(s.skin), hair: ramp(s.hair), cloth: ramp(s.cloth), pants: ramp(pants), boots: s.boots ? ramp(s.boots) : null,
    belt: ramp(s.belt), leather: ramp('#5a4030'), hood: s.hooded ? ramp(s.hood || darkOf(s.cloth)) : null, cloak: s.cloak ? ramp(s.cloak) : null,
    armorR: s.armor ? ramp(s.armorCol) : null, helmR: s.helm ? ramp(s.helmCol || '#8b8a85') : null, crest: s.crest ? ramp(s.crest) : null,
    robe: s.robe ? ramp(s.robe) : null, tabard: s.tabard ? ramp(s.tabard) : null, markR: s.markCol ? ramp(s.markCol) : null,
    scarf: s.scarf ? ramp(s.scarf) : null, shieldR: s.shield ? ramp(s.shieldCol) : null, glove: s.glove ? ramp(s.glove) : null,
    bone: ramp('#cfc6b0'), metal: ramp('#8b8a85'), gold: ramp('#b8963e'), wood: ramp('#5b452a'),
  };
  lookCache.set(k, L); return L;
}

// ---------------- Posen ----------------
const POSES = {
  i0: { u: 0, leg: 0 }, i1: { u: 0, leg: 0, hdy: 1 },
  w0: { u: 0, leg: 1, arm: 1 }, w1: { u: -1, leg: 0 }, w2: { u: 0, leg: -1, arm: -1 }, w3: { u: -1, leg: 0 },
  a1: { u: 0, leg: 0, act: 'a1' }, a2: { u: 1, leg: 1, act: 'a2' }, a3: { u: 0, leg: 1, act: 'a3' },
  hit: { u: 0, leg: 0, act: 'hit', hx: 1 }, cast: { u: 0, leg: 0, act: 'cast' },
  kneel: { u: 3, leg: 0, act: 'kneel' },
  guard: { u: 1, leg: 1, act: 'guard' },                              // Deckung: tief, Schrittstellung, Arme vor dem Körper
  sit: { u: 4, leg: 0, act: 'sit' },                                  // Sitzen (Bank, Schenke): Oberschenkel waagrecht
  trade: { u: 0, leg: 0, act: 'trade' },                              // Handeln: Ware vorzeigen, Hand offen
};

// ---------------- Menschen / Goblins / Skelette ----------------
function sleeveOf(L) { return L.armor === 'plate' || L.armor === 'chain' ? L.armorR : L.robe || L.cloth; }
function handOf(L) { return L.glove || L.skin; }

function legsFront(g, L, P) {
  const kneel = P.act === 'kneel', rl = P.leg > 0 ? 1 : 0, rr = P.leg < 0 ? 1 : 0;
  if (P.act === 'sit') {                                              // von vorn: Knie vorn, Unterschenkel hängen
    const Pn = L.sp === 'skeleton' ? L.skin : L.pants, Bo = L.sp === 'skeleton' ? L.skin : (L.boots || L.skin);
    g.r(6, 19, 3, 2, Pn.b); g.r(11, 19, 3, 2, Pn.b); g.p(8, 19, Pn.sh); g.p(13, 19, Pn.sh);
    g.r(6, 21, 3, 1, Bo.b); g.r(11, 21, 3, 1, Bo.b); return;
  }
  const top = kneel ? 19 : 17;
  if (L.sp === 'skeleton') {
    const B = L.skin;
    g.r(7, top, 2, 20 - rl - top, B.b); g.p(8, top, B.sh); g.r(6, 20 - rl, 3, 1, B.sh); g.p(6, 20 - rl, B.b);
    g.r(11, top, 2, 20 - rr - top, B.sh); g.r(11, 20 - rr, 3, 1, B.sh); g.p(13, 20 - rr, B.dk);
    return;
  }
  const Pn = L.pants;
  g.r(6, top, 3, 20 - rl - top, Pn.b); g.r(8, top, 1, 20 - rl - top, Pn.sh);
  g.r(11, top, 3, 20 - rr - top, Pn.b); g.r(11, top, 1, 20 - rr - top, Pn.sh); g.r(13, top, 1, 20 - rr - top, Pn.sh);
  const Bo = L.boots || L.skin;
  g.r(5, 20 - rl, 4, 2, Bo.sh); g.r(5, 20 - rl, 4, 1, Bo.b); g.p(5, 20 - rl, Bo.hi); g.p(8, 21 - rl, Bo.dk);
  g.r(11, 20 - rr, 4, 2, Bo.sh); g.r(11, 20 - rr, 4, 1, Bo.b); g.p(14, 21 - rr, Bo.dk);
}
function legsSide(g, L, P) {
  if (P.act === 'sit') {                                              // seitlich: Oberschenkel nach vorn, Unterschenkel senkrecht
    const Pn = L.sp === 'skeleton' ? L.skin : L.pants, Bo = L.sp === 'skeleton' ? L.skin : (L.boots || L.skin);
    g.r(4, 19, 6, 2, Pn.b); g.r(4, 20, 6, 1, Pn.sh); g.r(4, 21, 2, 1, Pn.sh); g.r(3, 22, 3, 1, Bo.b); return;
  }
  const kneel = P.act === 'kneel', top = kneel ? 19 : 17;
  // Schrittstellung: near = zugewandtes Bein, far = abgewandtes (dunkler)
  const nearX = P.leg > 0 ? 6 : P.leg < 0 ? 11 : 8, farX = P.leg > 0 ? 11 : P.leg < 0 ? 6 : 10;
  const bone = L.sp === 'skeleton';
  const leg = (x, far) => {
    const Pn = bone ? L.skin : L.pants, Bo = bone ? L.skin : (L.boots || L.skin);
    if (bone) { g.r(x + 1, top, 1, 3, far ? Pn.sh : Pn.b); g.r(x, 20, 3, 1, far ? Pn.dk : Pn.sh); return; }
    g.r(x, top, 2, 3, far ? Pn.sh : Pn.b); if (!far) g.p(x + 1, top, Pn.sh);
    g.r(x - 1, 20, 3, 2, far ? Bo.dk : Bo.sh); if (!far) { g.r(x - 1, 20, 3, 1, Bo.b); g.p(x - 1, 20, Bo.hi); }
  };
  leg(farX, true); leg(nearX, false);
}

function headFront(g, L, P, back) {
  const u = P.u + (P.hdy || 0), x = P.hx || 0;
  const S = L.skin;
  if (L.sp === 'goblin') {
    g.r(6 + x, 4 + u, 8, 6, S.b); g.r(7 + x, 3 + u, 6, 1, S.b); g.r(13 + x, 4 + u, 1, 6, S.sh); g.r(7 + x, 9 + u, 6, 1, S.sh);
    g.p(7 + x, 4 + u, S.hi); g.p(8 + x, 3 + u, S.hi);
    g.r(3 + x, 5 + u, 3, 1, S.b); g.p(4 + x, 6 + u, S.sh); g.p(3 + x, 4 + u, S.b);          // Ohren
    g.r(14 + x, 5 + u, 3, 1, S.sh); g.p(15 + x, 6 + u, S.dk); g.p(16 + x, 4 + u, S.sh);
    if (!back) { g.p(8 + x, 6 + u, '#e0c24a'); g.p(11 + x, 6 + u, '#e0c24a'); g.p(9 + x, 7 + u, S.sh); g.p(10 + x, 7 + u, S.dk);
      g.r(8 + x, 8 + u, 4, 1, DEEP); g.p(8 + x, 8 + u, L.bone.b); g.p(11 + x, 8 + u, L.bone.b); }
    if (L.helm === 'cap') { const H = L.helmR; g.r(6 + x, 2 + u, 8, 3, H.b); g.r(7 + x, 2 + u, 3, 1, H.hi); g.r(12 + x, 2 + u, 2, 3, H.sh); g.r(5 + x, 4 + u, 10, 1, H.dk); }
    return;
  }
  if (L.hooded && L.helm !== 'great') return hoodFront(g, L, u, x, back);
  if (L.helm === 'great') return greatHelm(g, L, u, x, back ? 'N' : 'S');
  // Gesicht
  g.r(7 + x, 3 + u, 6, 1, S.b); g.r(6 + x, 4 + u, 8, 5, S.b); g.r(7 + x, 9 + u, 6, 1, S.sh);
  g.r(13 + x, 4 + u, 1, 5, S.sh); g.p(7 + x, 4 + u, S.hi); g.p(8 + x, 4 + u, S.hi);
  if (L.sp === 'skeleton' && !back) { g.p(8 + x, 6 + u, DEEP); g.p(11 + x, 6 + u, DEEP); g.p(9 + x, 8 + u, DEEP); g.p(11 + x, 8 + u, DEEP); }
  else if (!back) {
    g.p(7 + x, 5 + u, S.sh); g.p(8 + x, 5 + u, S.sh); g.p(11 + x, 5 + u, S.sh); g.p(12 + x, 5 + u, S.sh);
    g.p(8 + x, 6 + u, '#1b1411'); g.p(11 + x, 6 + u, '#1b1411'); g.p(10 + x, 7 + u, S.sh); g.r(9 + x, 8 + u, 2, 1, S.dk);
  }
  const H = L.hair, hs = L.hs;
  if (back) { if (hs !== 2) { g.r(6 + x, 3 + u, 8, 6, H.b); g.r(7 + x, 2 + u, 6, 1, H.b); g.r(12 + x, 3 + u, 2, 6, H.sh); g.p(8 + x, 2 + u, H.hi); g.p(9 + x, 2 + u, H.hi);
      if (hs === 1) g.r(6 + x, 9 + u, 8, 2, H.sh); }
    else g.r(8 + x, 4 + u, 3, 1, S.hi); }
  else if (!L.helm || L.helm === 'nasal' || L.helm === 'cap') {
    if (hs !== 2) { g.r(7 + x, 2 + u, 6, 1, H.b); g.r(6 + x, 3 + u, 8, 1, H.b); g.p(8 + x, 2 + u, H.hi); g.p(9 + x, 2 + u, H.hi); g.r(12 + x, 2 + u, 2, 2, H.sh);
      g.p(6 + x, 4 + u, H.b); g.p(13 + x, 4 + u, H.sh); g.p(6 + x, 5 + u, H.sh); g.p(13 + x, 5 + u, H.dk);
      if (hs === 1) { g.r(5 + x, 4 + u, 1, 6, H.b); g.r(14 + x, 4 + u, 1, 6, H.sh); }
      if (hs === 3) { g.r(9 + x, 1 + u, 2, 1, H.b); } }
    else { g.p(6 + x, 5 + u, H.sh); g.p(13 + x, 5 + u, H.dk); }
  }
  if (L.beard && !back) { g.r(7 + x, 7 + u, 6, 2, H.b); g.r(9 + x, 7 + u, 2, 1, S.sh); g.r(8 + x, 9 + u, 4, 1, H.sh); g.r(12 + x, 7 + u, 1, 2, H.sh); g.r(9 + x, 8 + u, 2, 1, H.dk); }
  const M = L.helmR;
  if (L.helm === 'nasal') { g.r(7 + x, 2 + u, 6, 1, M.b); g.r(6 + x, 3 + u, 8, 2, M.b); g.r(7 + x, 2 + u, 2, 1, M.hi); g.p(6 + x, 3 + u, M.hi); g.r(12 + x, 2 + u, 2, 3, M.sh); g.r(6 + x, 5 + u, 8, 1, M.dk);
    if (!back) { g.r(9 + x, 5 + u, 2, 3, M.b); g.p(9 + x, 5 + u, M.hi); } }
  else if (L.helm === 'cap') { g.r(7 + x, 2 + u, 6, 1, M.b); g.r(6 + x, 3 + u, 8, 2, M.b); g.p(7 + x, 2 + u, M.hi); g.r(12 + x, 2 + u, 2, 3, M.sh); g.r(6 + x, 4 + u, 8, 1, M.sh); }
  else if (L.helm === 'hat') { g.r(8 + x, 0 + u, 4, 1, M.b); g.r(7 + x, 1 + u, 6, 2, M.b); g.p(8 + x, 1 + u, M.hi); g.r(11 + x, 1 + u, 2, 2, M.sh);
    g.r(4 + x, 3 + u, 12, 1, M.b); g.r(4 + x, 3 + u, 4, 1, M.hi); g.r(13 + x, 3 + u, 3, 1, M.sh); g.r(7 + x, 2 + u, 6, 1, L.belt.dk); }
  else if (L.helm === 'scarf') { g.r(7 + x, 2 + u, 6, 1, M.b); g.r(6 + x, 3 + u, 8, 2, M.b); g.p(7 + x, 2 + u, M.hi); g.r(12 + x, 2 + u, 2, 3, M.sh);
    g.r(5 + x, 5 + u, 1, 4, M.b); g.r(14 + x, 5 + u, 1, 4, M.sh); }
}
function hoodFront(g, L, u, x, back) {
  const H = L.hood;
  g.r(8 + x, 1 + u, 4, 1, H.b); g.r(7 + x, 2 + u, 6, 1, H.b); g.r(6 + x, 3 + u, 8, 1, H.b); g.r(5 + x, 4 + u, 10, 6, H.b);
  g.p(8 + x, 1 + u, H.hi); g.r(7 + x, 2 + u, 2, 1, H.hi); g.p(6 + x, 3 + u, H.hi); g.r(5 + x, 4 + u, 1, 3, H.hi);   // Randlicht oben links
  g.r(13 + x, 4 + u, 2, 6, H.sh); g.p(12 + x, 2 + u, H.sh); g.p(13 + x, 3 + u, H.sh); g.r(5 + x, 9 + u, 10, 1, H.sh); g.p(14 + x, 9 + u, H.dk);
  if (back) { for (let y = 2; y <= 8; y++) g.p((y % 2 ? 10 : 9) + x, y + u, H.sh); return; }                        // Naht
  // Gesichtsöffnung
  g.r(8 + x, 4 + u, 4, 1, H.dk); g.r(7 + x, 5 + u, 6, 4, H.dk);
  g.r(8 + x, 5 + u, 4, 1, DEEP); g.r(7 + x, 6 + u, 6, 3, DEEP); g.r(8 + x, 9 + u, 4, 1, DEEP);
  const G1 = L.glow;
  if (L.face === 'skull') {
    const B = L.bone; g.r(8 + x, 6 + u, 4, 3, B.b); g.r(8 + x, 6 + u, 2, 1, B.hi); g.p(11 + x, 7 + u, B.sh);
    g.p(8 + x, 7 + u, G1 || DEEP); g.p(11 + x, 7 + u, G1 || DEEP); g.p(9 + x, 8 + u, DEEP); g.p(10 + x, 8 + u, B.sh);
    g.p(8 + x, 9 + u, B.sh); g.p(10 + x, 9 + u, B.sh);
  } else if (L.face === 'mask') {
    const M = ramp('#6b675e'); g.r(8 + x, 6 + u, 4, 4, M.b); g.r(8 + x, 6 + u, 4, 1, M.hi); g.r(11 + x, 7 + u, 1, 3, M.sh);
    g.p(8 + x, 7 + u, G1 || DEEP); g.p(11 + x, 7 + u, G1 || DEEP); g.r(9 + x, 9 + u, 2, 1, M.dk); g.p(9 + x, 8 + u, M.sh);
  } else if (L.face === 'cloth') {
    const S = L.skin; g.r(8 + x, 6 + u, 4, 1, S.sh); g.p(8 + x, 6 + u, '#1b1411'); g.p(11 + x, 6 + u, '#1b1411');
    const C = L.scarf || ramp('#3a3026'); g.r(7 + x, 7 + u, 6, 2, C.b); g.r(7 + x, 7 + u, 6, 1, C.hi); g.r(11 + x, 8 + u, 2, 1, C.sh);
  } else if (L.face === 'shadow' || G1) {
    g.p(8 + x, 7 + u, G1 || '#b0412f'); g.p(11 + x, 7 + u, G1 || '#b0412f');
  } else {
    const S = L.skin; g.r(8 + x, 7 + u, 4, 3, S.sh); g.r(8 + x, 6 + u, 4, 1, S.dk);
    g.p(8 + x, 7 + u, '#1b1411'); g.p(11 + x, 7 + u, '#1b1411'); g.p(10 + x, 8 + u, S.dk);
    if (L.beard) { g.r(8 + x, 9 + u, 4, 1, L.hair.sh); }
  }
}
function greatHelm(g, L, u, x, dir) {
  const M = L.helmR;
  if (dir === 'W') {
    g.r(8 + x, 2 + u, 5, 1, M.b); g.r(7 + x, 3 + u, 7, 7, M.b); g.p(8 + x, 2 + u, M.hi); g.r(7 + x, 3 + u, 1, 3, M.hi);
    g.r(12 + x, 3 + u, 2, 7, M.sh); g.r(7 + x, 9 + u, 7, 1, M.sh);
    g.r(7 + x, 6 + u, 3, 1, DEEP); g.p(8 + x, 8 + u, DEEP); g.p(10 + x, 7 + u, M.dk);
    if (L.crest) { const C = L.crest; g.r(9 + x, 0 + u, 3, 1, C.hi); g.r(8 + x, 1 + u, 6, 1, C.b); g.p(14 + x, 2 + u, C.b); g.p(15 + x, 3 + u, C.sh); g.p(15 + x, 4 + u, C.sh); g.p(13 + x, 1 + u, C.sh); }
    return;
  }
  g.r(7 + x, 2 + u, 6, 1, M.b); g.r(6 + x, 3 + u, 8, 7, M.b);
  g.r(7 + x, 2 + u, 2, 1, M.hi); g.r(6 + x, 3 + u, 1, 4, M.hi); g.r(13 + x, 3 + u, 1, 7, M.sh); g.r(6 + x, 9 + u, 8, 1, M.sh); g.r(12 + x, 3 + u, 1, 6, M.sh);
  if (dir === 'S') { g.r(7 + x, 6 + u, 6, 1, DEEP); g.r(9 + x, 7 + u, 2, 2, DEEP); g.p(8 + x, 8 + u, M.dk); g.p(11 + x, 8 + u, M.dk); g.p(9 + x, 3 + u, M.hi); g.p(9 + x, 4 + u, M.hi); }
  else { g.r(9 + x, 3 + u, 1, 6, M.sh); }
  if (L.crest) { const C = L.crest; g.r(9 + x, 0 + u, 2, 1, C.hi); g.r(8 + x, 1 + u, 4, 1, C.b); g.p(11 + x, 1 + u, C.sh);
    if (dir === 'N') { g.r(9 + x, 2 + u, 2, 4, C.sh); } }
}

function shieldAt(g, L, x0, y0, narrow) {
  const R = L.shieldR, M = L.markR;
  if (L.shield === 'round') {
    const cx = x0 + 2, cy = y0 + 3;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) g.p(cx + i, cy + j, i + j < -1 ? R.hi : i + j > 1 ? R.sh : R.b);
    g.p(cx, cy, M ? M.hi : R.hi); if (M) { g.p(cx + 1, cy, M.sh); g.p(cx, cy + 1, M.sh); }
    return;
  }
  const w = narrow ? 4 : 5;
  g.r(x0, y0, w, 5, R.b); g.r(x0, y0, w, 1, R.hi); g.r(x0 + w - 1, y0 + 1, 1, 4, R.sh);
  g.r(x0 + 1, y0 + 5, w - 2, 1, R.sh); g.p(x0 + ((w - 1) >> 1), y0 + 6, R.dk); if (!narrow) g.p(x0 + 2, y0 + 6, R.dk);
  if (!M) return;
  const cx = x0 + (w >> 1);
  if (L.mark === 'cross') { g.r(cx, y0 + 1, 1, 5, M.b); g.r(x0 + 1, y0 + 2, w - 2, 1, M.b); if (!narrow) g.r(cx - 1, y0 + 1, 1, 1, M.hi); }
  else if (L.mark === 'chevron') { g.p(x0 + 1, y0 + 3, M.b); g.p(cx, y0 + 2, M.hi); g.p(x0 + w - 2, y0 + 3, M.b); if (!narrow) { g.p(x0, y0 + 4, M.sh); g.p(x0 + w - 1, y0 + 4, M.sh); } }
  else { g.p(cx, y0 + 2, M.hi); g.p(cx, y0 + 3, M.sh); }
}

function torsoFront(g, L, P, back) {
  const u = P.u, T = L.cloth;
  // Umhang hinten (vorn nur an den Seiten sichtbar)
  if (L.cloak) {
    const C = L.cloak;
    if (back) {
      g.r(4, 10 + u, 12, 10 - u, C.b); g.r(4, 10 + u, 12, 1, C.hi); g.r(13, 10 + u, 3, 10 - u, C.sh);
      for (let y = 12 + u; y < 20; y++) g.p(9 + ((y >> 1) & 1), y, C.sh);
      for (let x = 4; x <= 15; x++) if ((x + (P.leg & 1)) % 2 === 0) g.p(x, 20, C.dk);
    } else {
      g.r(3, 10 + u, 2, 10 - u, C.sh); g.r(15, 10 + u, 2, 10 - u, C.dk); g.p(3, 10 + u, C.b);
      for (const xx of [3, 16]) g.p(xx, 20, (P.leg & 1) ? null : C.dk);
    }
  }
  if (L.robe) {
    const R = L.robe;
    g.r(5, 15 + u, 10, 18 - 15 - u, R.b); g.r(4, 18, 12, 2, R.b); g.r(13, 15 + u, 2, 5 - u, R.sh); g.r(15, 18, 1, 2, R.dk); g.p(4, 18, R.hi);
    for (let y = 16 + u; y <= 19; y++) g.p(9, y, R.sh);
    for (let x = 4; x <= 15; x++) if (x % 2 === 0) g.p(x, 20, R.sh);
    const Bo = L.boots || L.skin, rl = P.leg > 0, rr = P.leg < 0;
    if (!rl) g.r(6, 21, 2, 1, Bo.sh); if (!rr) g.r(12, 21, 2, 1, Bo.sh);
    if (rl) g.r(6, 20, 2, 1, Bo.b); if (rr) g.r(12, 20, 2, 1, Bo.b);
  }
  g.r(5, 10 + u, 10, 6, T.b); g.r(6, 10 + u, 6, 1, T.hi); g.r(13, 10 + u, 2, 6, T.sh);
  if (!L.robe) { g.r(5, 16 + u, 10, 2, T.sh); g.r(12, 16 + u, 3, 2, T.dk); for (const xx of [5, 8, 10, 13]) g.p(xx, 18 + u, T.dk); }
  if (L.sp === 'skeleton' && !back) { const B = L.skin; g.r(7, 11 + u, 6, 1, B.b); g.r(7, 13 + u, 6, 1, B.sh); g.r(9, 11 + u, 2, 4, B.hi); g.p(7, 12 + u, DEEP); g.p(12, 12 + u, DEEP); }
  const A = L.armorR;
  if (L.armor === 'leather') { g.r(6, 10 + u, 8, 5, A.b); g.r(6, 10 + u, 5, 1, A.hi); g.r(12, 10 + u, 2, 5, A.sh);
    if (!back) { g.p(9, 11 + u, A.dk); g.p(10, 12 + u, A.dk); g.p(9, 13 + u, A.dk); } }
  else if (L.armor === 'chain') { for (let y = 10; y <= 16; y++) for (let x = 5; x <= 14; x++) g.p(x, y + u, x >= 13 ? ((x + y) % 2 ? A.sh : A.dk) : ((x + y) % 2 ? A.b : A.sh));
    g.r(6, 10 + u, 5, 1, A.hi); for (let x = 5; x <= 14; x += 2) g.p(x, 17 + u, A.sh); }
  else if (L.armor === 'plate') { g.r(5, 10 + u, 10, 5, A.b); g.r(5, 10 + u, 8, 1, A.hi); if (!back) g.r(9, 11 + u, 1, 3, A.hi);
    g.r(12, 10 + u, 3, 5, A.sh); g.r(5, 14 + u, 10, 1, A.dk); g.r(5, 16 + u, 10, 1, A.sh); }
  if (L.apron && !back) { const Lr = L.leather; g.r(7, 12 + u, 6, 7, Lr.b); g.r(7, 12 + u, 6, 1, Lr.hi); g.r(11, 13 + u, 2, 6, Lr.sh); g.p(7, 11 + u, Lr.sh); g.p(12, 11 + u, Lr.sh); }
  if (L.tabard) { const B = L.tabard; g.r(8, 11 + u, 4, 7, B.b); g.r(8, 11 + u, 2, 1, B.hi); g.r(11, 11 + u, 1, 7, B.sh); g.p(8, 18 + u, B.sh); g.p(10, 18 + u, B.sh);
    if (L.markR && !back) { const M = L.markR;
      if (L.mark === 'chevron') { g.p(8, 14 + u, M.b); g.p(9, 13 + u, M.hi); g.p(10, 13 + u, M.b); g.p(11, 14 + u, M.sh); }
      else { g.r(9, 12 + u, 2, 4, M.b); g.r(8, 13 + u, 4, 1, M.b); g.p(9, 12 + u, M.hi); } } }
  if (L.strap) { const S = L.belt; for (let i = 0; i < 6; i++) { const sx = back ? 13 - i : 6 + i; g.p(sx, 10 + i + u, S.b); g.p(sx + (back ? -1 : 1), 10 + i + u, S.dk); }
    if (!back) g.p(9, 13 + u, L.metal.hi); }
  const Bt = L.belt;
  g.r(5, 15 + u, 10, 1, Bt.dk);
  if (!back) { g.p(9, 15 + u, L.gold.b); g.p(10, 15 + u, L.gold.sh); }
  if (L.pouch) { const Lr = L.leather, px = back ? 6 : 12; g.r(px, 15 + u, 2, 2, Lr.b); g.p(px + 1, 16 + u, Lr.sh); g.p(px, 15 + u, Lr.hi); }
  if (L.scarf && L.face !== 'cloth') { const Sc = L.scarf; g.r(6, 10 + u, 8, 1, Sc.b); g.r(6, 10 + u, 3, 1, Sc.hi); if (!back) { g.r(12, 11 + u, 2, 3, Sc.sh); g.p(13, 14 + u, Sc.dk); } }
  if (L.face === 'cloth' && L.scarf) { const Sc = L.scarf; g.r(6, 10 + u, 8, 1, Sc.sh); if (!back) { g.r(12, 11 + u, 1, 3, Sc.b); g.p(12, 14 + u, Sc.sh); } }
  if (L.quiver && back) { const W = L.wood; g.r(12, 8 + u, 2, 8, L.leather.b); g.r(13, 8 + u, 1, 8, L.leather.sh); g.p(12, 7 + u, '#c9bfa6'); g.p(13, 6 + u, '#c9bfa6'); g.p(12, 6 + u, W.b); }
}

function armsFront(g, L, P, back) {
  const u = P.u, S = sleeveOf(L), Hd = handOf(L), act = P.act;
  const wx = back ? 15 : 3, ox = back ? 3 : 15;                      // Waffenarm / Schildarm (Bildseiten)
  const arm = (x, dy, lit) => { g.r(x, 10 + u + dy, 2, 5, S.b); g.r(x + (lit ? 1 : 0), 10 + u + dy, 1, 5, S.sh); g.p(x + (lit ? 0 : 1), 10 + u + dy, lit ? S.hi : S.sh);
    g.r(x, 15 + u + dy, 2, 2, Hd.b); g.p(x + (lit ? 1 : 0), 16 + u + dy, Hd.sh); };
  const armUp = (x, top) => { g.r(x, top + u, 2, 11 - top, S.b); g.r(x + 1, top + u, 1, 11 - top, S.sh); g.r(x, top - 2 + u, 2, 2, Hd.b); g.p(x + 1, top - 1 + u, Hd.sh); };
  if (act === 'a1') { armUp(wx, 6); arm(ox, 0, ox < 10); }
  else if (act === 'a2') {
    const d = back ? 1 : -1; g.r(wx, 10 + u, 2, 3, S.b); g.r(wx + d, 12 + u, 3, 2, S.b); g.r(wx + d, 13 + u, 3, 1, S.sh);
    g.r(wx + d * 2, 14 + u, 2, 2, Hd.b); g.p(wx + d * 2 + 1, 15 + u, Hd.sh); arm(ox, 1, ox < 10);
  }
  else if (act === 'a3') {                                        // Nachschwung: Waffenarm quer vor dem Körper
    const x0 = back ? 10 : 6; g.r(wx, 10 + u, 2, 2, S.b); g.r(x0, 12 + u, 4, 2, S.b); g.r(x0, 13 + u, 4, 1, S.sh);
    g.r(back ? x0 - 2 : x0 + 4, 12 + u, 2, 2, Hd.b); arm(ox, 1, ox < 10);
  }
  else if (act === 'cast') { armUp(4, 8); armUp(14, 8); if (L.glow) { g.p(4, 5 + u, L.glow); g.p(15, 5 + u, L.glow); } }
  else if (act === 'hit') { armUp(2, 9); armUp(16, 9); }
  else if (act === 'kneel') { arm(3, 1, true); arm(15, 1, false); }
  else if (act === 'guard') {                                        // beide Unterarme quer vor der Brust
    const y = 11 + u; g.r(wx, 10 + u, 2, 2, S.b); g.r(back ? 12 : 5, y, 4, 2, S.b); g.r(back ? 12 : 5, y + 1, 4, 1, S.sh); g.r(back ? 11 : 8, y - 1, 2, 2, Hd.b);
    g.r(ox, 10 + u, 2, 2, S.b); g.r(back ? 5 : 11, y + 1, 4, 2, S.b); g.r(back ? 5 : 11, y + 2, 4, 1, S.sh); }
  else if (act === 'sit') { arm(3, 1, true); arm(15, 1, false); g.r(5, 16 + u, 2, 1, Hd.b); g.r(13, 16 + u, 2, 1, Hd.b); }   // Hände auf den Knien
  else if (act === 'trade') { arm(3, 0, true); const x0 = back ? 12 : 12; g.r(15, 10 + u, 2, 2, S.b); g.r(x0, 12 + u, 4, 2, S.b); g.r(x0 - 1, 11 + u, 2, 2, Hd.b); }   // Hand offen nach vorn
  else { arm(3, P.arm > 0 ? 1 : 0, true); arm(15, P.arm < 0 ? 1 : 0, false); }
  // Kapuzen-Schulterkragen über den Armansätzen
  if (L.hooded) { const H = L.hood, v = u + (P.hdy || 0);
    g.r(5, 9 + v, 10, 1, H.sh); g.r(4, 10 + v, 12, 2, H.b); g.r(4, 10 + v, 5, 1, H.hi); g.r(12, 10 + v, 4, 2, H.sh);
    for (const xx of [4, 6, 9, 11, 13, 15]) g.p(xx, 12 + v, xx > 10 ? H.dk : H.sh); }
  if (L.armor === 'plate') { const A = L.armorR; g.r(3, 9 + u, 3, 3, A.b); g.r(3, 9 + u, 2, 1, A.hi); g.r(3, 11 + u, 3, 1, A.sh); g.r(14, 9 + u, 3, 3, A.sh); g.r(14, 9 + u, 3, 1, A.b); g.r(14, 11 + u, 3, 1, A.dk); }
}

function paintFront(L, pose, back) {
  const P = POSES[pose] || POSES.i0, g = new G(20, 25, 1);
  if (L.robe) { /* Beine unter der Robe */ } else legsFront(g, L, P);
  torsoFront(g, L, P, back);
  if (back) { armsFront(g, L, P, true); headFront(g, L, P, true); if (L.shield) shieldAt(g, L, 1, 11 + P.u, false); }
  else { armsFront(g, L, P, false); headFront(g, L, P, false); if (L.shield) shieldAt(g, L, P.act === 'guard' ? 8 : 14, P.act === 'guard' ? 10 + P.u : 11 + P.u, false); }
  if (L.quiver && !back) { g.p(15, 8 + P.u, '#c9bfa6'); g.p(16, 7 + P.u, '#c9bfa6'); }
  return g;
}

// Seitenansicht (Blick nach links; rechts = gespiegelt)
function paintSide(L, pose) {
  const P = POSES[pose] || POSES.i0, g = new G(20, 25, 1), u = P.u, T = L.cloth, hx = P.hx || 0, act = P.act;
  const flare = P.leg !== 0 || act === 'a2';
  if (L.cloak) { const C = L.cloak; g.r(11, 9 + u, 4, 11 - u, C.sh); g.r(14, 10 + u, 1, 10 - u, C.dk); g.p(11, 9 + u, C.b);
    if (flare) g.r(15, 13 + u, 1, 6, C.dk);
    for (let y = 20; y <= 20; y++) for (let x = 11; x <= 15; x++) if ((x + (P.leg & 1)) % 2) g.p(x, y, C.dk); }
  if (L.quiver) { g.r(12, 8 + u, 2, 7, L.leather.b); g.p(13, 8 + u, L.leather.sh); g.p(12, 7 + u, '#c9bfa6'); g.p(13, 6 + u, '#c9bfa6'); }
  if (!L.robe) legsSide(g, L, P);
  if (L.robe) { const R = L.robe; g.r(7, 15 + u, 6, 3 - u, R.b); g.r(6, 18, 8, 2, R.b); g.r(11, 15 + u, 2, 5 - u, R.sh); g.p(6, 18, R.hi);
    for (let x = 6; x <= 13; x++) if (x % 2) g.p(x, 20, R.sh);
    const Bo = L.boots || L.skin; g.r(P.leg > 0 ? 5 : 7, 21, 2, 1, Bo.sh); }
  g.r(7, 10 + u, 6, 6, T.b); g.r(7, 10 + u, 4, 1, T.hi); g.r(11, 10 + u, 2, 6, T.sh);
  if (!L.robe) { g.r(7, 16 + u, 6, 2, T.sh); g.r(11, 16 + u, 2, 2, T.dk); for (const xx of [7, 9, 12]) g.p(xx, 18 + u, T.dk); }
  if (L.sp === 'skeleton') { const B = L.skin; g.r(8, 11 + u, 3, 1, B.b); g.r(8, 13 + u, 3, 1, B.sh); }
  const A = L.armorR;
  if (L.armor === 'leather') { g.r(7, 10 + u, 5, 5, A.b); g.r(7, 10 + u, 3, 1, A.hi); g.r(11, 10 + u, 1, 5, A.sh); }
  else if (L.armor === 'chain') { for (let y = 10; y <= 16; y++) for (let x = 7; x <= 12; x++) g.p(x, y + u, x >= 11 ? ((x + y) % 2 ? A.sh : A.dk) : ((x + y) % 2 ? A.b : A.sh)); g.r(7, 10 + u, 3, 1, A.hi); }
  else if (L.armor === 'plate') { g.r(7, 10 + u, 6, 5, A.b); g.r(7, 10 + u, 4, 1, A.hi); g.r(7, 11 + u, 1, 3, A.hi); g.r(11, 10 + u, 2, 5, A.sh); g.r(7, 14 + u, 6, 1, A.dk); }
  if (L.apron) { const Lr = L.leather; g.r(6, 12 + u, 3, 7, Lr.b); g.p(6, 12 + u, Lr.hi); }
  if (L.tabard) { const B = L.tabard; g.r(7, 11 + u, 3, 7, B.b); g.p(7, 11 + u, B.hi); g.r(9, 11 + u, 1, 7, B.sh); if (L.markR) { g.p(8, 13 + u, L.markR.b); g.p(8, 14 + u, L.markR.b); g.p(7, 13 + u, L.markR.sh); } }
  if (L.strap) { for (let i = 0; i < 5; i++) g.p(8 + i, 10 + i + u, L.belt.b); }
  g.r(7, 15 + u, 6, 1, L.belt.dk); g.p(7, 15 + u, L.gold.b);
  if (L.pouch) { g.r(11, 15 + u, 2, 2, L.leather.b); g.p(12, 16 + u, L.leather.sh); }
  if (L.scarf && L.face !== 'cloth') { g.r(7, 10 + u, 5, 1, L.scarf.b); g.r(12, 10 + u, 2, 1, L.scarf.sh); g.p(13, 11 + u, L.scarf.sh); g.p(14, 12 + u, L.scarf.dk); }
  // Arm (zugewandt)
  const S = sleeveOf(L), Hd = handOf(L);
  if (act === 'a1') { g.r(10, 6 + u, 2, 5, S.b); g.r(11, 6 + u, 1, 5, S.sh); g.r(10, 4 + u, 2, 2, Hd.b); }
  else if (act === 'a2') { g.r(8, 11 + u, 2, 2, S.b); g.r(5, 12 + u, 4, 2, S.b); g.r(5, 13 + u, 4, 1, S.sh); g.r(3, 12 + u, 2, 2, Hd.b); g.p(4, 13 + u, Hd.sh); }
  else if (act === 'a3') { g.r(8, 12 + u, 2, 3, S.b); g.r(6, 14 + u, 3, 2, S.b); g.p(8, 15 + u, S.sh); g.r(5, 15 + u, 2, 2, Hd.b); }
  else if (act === 'cast') { g.r(6, 10 + u, 4, 2, S.b); g.r(6, 11 + u, 4, 1, S.sh); g.r(4, 9 + u, 2, 2, Hd.b); if (L.glow) g.p(3, 8 + u, L.glow); }
  else if (act === 'hit') { g.r(11, 7 + u, 2, 4, S.b); g.p(12, 7 + u, S.sh); g.r(11, 5 + u, 2, 2, Hd.b); }
  else if (act === 'guard') { g.r(8, 10 + u, 2, 2, S.b); g.r(5, 10 + u, 4, 2, S.b); g.r(5, 11 + u, 4, 1, S.sh); g.r(4, 8 + u, 2, 2, Hd.b); }   // Arm hoch vor dem Gesicht
  else if (act === 'sit') { g.r(8, 10 + u, 2, 4, S.b); g.r(6, 14 + u, 3, 1, S.b); g.r(5, 14 + u, 2, 1, Hd.b); }                                 // Hand auf dem Knie
  else if (act === 'trade') { g.r(8, 11 + u, 2, 2, S.b); g.r(4, 12 + u, 5, 2, S.b); g.r(4, 13 + u, 5, 1, S.sh); g.r(2, 11 + u, 2, 2, Hd.b); }   // Hand nach vorn
  else { const ax = 9 + (P.arm > 0 ? 1 : P.arm < 0 ? -1 : 0) + (act === 'kneel' ? -1 : 0);
    g.r(ax, 10 + u, 2, 5, S.b); g.r(ax + 1, 10 + u, 1, 5, S.sh); g.p(ax, 10 + u, S.hi); g.r(ax, 15 + u, 2, 2, Hd.b); g.p(ax + 1, 16 + u, Hd.sh); }
  if (L.armor === 'plate') { g.r(8, 9 + u, 4, 2, A.b); g.r(8, 9 + u, 3, 1, A.hi); g.r(8, 11 + u, 4, 1, A.sh); }
  // Kopf
  headSide(g, L, { u: u + (P.hdy || 0), hx });
  if (L.shield) shieldAt(g, L, act === 'guard' ? 1 : 3, act === 'guard' ? 8 + u : 11 + u, true);   // Deckung: Schild hoch und vor
  return g;
}
function headSide(g, L, P) {
  const u = P.u, x = P.hx, S = L.skin;
  if (L.sp === 'goblin') {
    g.r(6 + x, 4 + u, 7, 6, S.b); g.r(7 + x, 3 + u, 5, 1, S.b); g.r(11 + x, 4 + u, 2, 6, S.sh); g.p(7 + x, 4 + u, S.hi); g.p(8 + x, 3 + u, S.hi);
    g.r(3 + x, 6 + u, 3, 2, S.b); g.p(3 + x, 7 + u, S.sh);                                          // lange Nase
    g.r(12 + x, 4 + u, 2, 1, S.sh); g.p(14 + x, 3 + u, S.sh); g.p(13 + x, 5 + u, S.dk);                 // Ohr
    g.p(7 + x, 6 + u, '#e0c24a'); g.r(5 + x, 8 + u, 3, 1, DEEP); g.p(6 + x, 8 + u, L.bone.b);
    if (L.helm === 'cap') { const H = L.helmR; g.r(6 + x, 2 + u, 7, 3, H.b); g.r(7 + x, 2 + u, 3, 1, H.hi); g.r(11 + x, 2 + u, 2, 3, H.sh); g.r(5 + x, 4 + u, 9, 1, H.dk); }
    return;
  }
  if (L.helm === 'great') return greatHelm(g, L, u, x, 'W');
  if (L.hooded) {
    const H = L.hood;
    g.r(11 + x, 1 + u, 2, 1, H.b); g.r(9 + x, 2 + u, 5, 1, H.b); g.r(8 + x, 3 + u, 7, 1, H.b); g.r(6 + x, 4 + u, 9, 6, H.b); g.r(7 + x, 10 + u, 6, 1, H.sh);
    g.r(9 + x, 2 + u, 2, 1, H.hi); g.r(8 + x, 3 + u, 2, 1, H.hi); g.r(6 + x, 4 + u, 2, 1, H.hi);
    g.r(13 + x, 3 + u, 2, 7, H.sh); g.p(14 + x, 9 + u, H.dk); g.p(12 + x, 1 + u, H.sh);
    g.r(6 + x, 5 + u, 3, 1, H.dk); g.r(6 + x, 6 + u, 3, 3, DEEP); g.r(7 + x, 9 + u, 2, 1, DEEP); g.p(9 + x, 6 + u, H.dk); g.p(9 + x, 7 + u, H.dk);
    const G1 = L.glow;
    if (L.face === 'skull') { g.r(6 + x, 6 + u, 2, 3, L.bone.b); g.p(6 + x, 6 + u, L.bone.hi); g.p(7 + x, 7 + u, G1 || DEEP); g.p(6 + x, 9 + u, L.bone.sh); }
    else if (L.face === 'mask') { const M = ramp('#6b675e'); g.r(6 + x, 6 + u, 2, 4, M.b); g.p(6 + x, 6 + u, M.hi); g.p(7 + x, 7 + u, G1 || DEEP); g.p(5 + x, 8 + u, M.sh); }
    else if (L.face === 'cloth') { g.r(6 + x, 6 + u, 2, 1, S.sh); g.p(6 + x, 6 + u, '#1b1411'); const C = L.scarf || ramp('#3a3026'); g.r(5 + x, 7 + u, 3, 2, C.b); g.p(5 + x, 7 + u, C.hi); }
    else if (L.face === 'shadow' || G1) { g.p(6 + x, 7 + u, G1 || '#b0412f'); }
    else { g.r(6 + x, 7 + u, 2, 3, S.sh); g.p(6 + x, 7 + u, '#1b1411'); g.p(5 + x, 8 + u, S.sh); }
    return;
  }
  g.r(8 + x, 3 + u, 4, 1, S.b); g.r(7 + x, 4 + u, 6, 5, S.b); g.r(8 + x, 9 + u, 4, 1, S.sh); g.r(11 + x, 4 + u, 2, 5, S.sh);
  g.p(6 + x, 6 + u, S.b); g.p(6 + x, 7 + u, S.sh); g.p(8 + x, 4 + u, S.hi);
  if (L.sp === 'skeleton') { g.p(8 + x, 6 + u, DEEP); g.p(7 + x, 8 + u, DEEP); }
  else { g.p(8 + x, 5 + u, S.sh); g.p(8 + x, 6 + u, '#1b1411'); g.p(7 + x, 8 + u, S.dk); g.p(11 + x, 6 + u, S.dk); }
  const H = L.hair, hs = L.hs;
  if (!L.helm || L.helm === 'nasal' || L.helm === 'cap') {
    if (hs !== 2) { g.r(8 + x, 2 + u, 5, 1, H.b); g.r(7 + x, 3 + u, 7, 1, H.b); g.r(11 + x, 4 + u, 3, 3, H.b); g.p(9 + x, 2 + u, H.hi); g.p(8 + x, 3 + u, H.hi); g.r(13 + x, 3 + u, 1, 4, H.sh);
      if (hs === 1) g.r(11 + x, 7 + u, 3, 4, H.sh); if (hs === 3) g.r(13 + x, 2 + u, 2, 1, H.b); }
    else g.r(12 + x, 5 + u, 1, 2, H.sh);
  }
  if (L.beard) { g.r(7 + x, 8 + u, 4, 2, H.b); g.p(7 + x, 8 + u, H.hi); g.r(8 + x, 10 + u, 2, 1, H.sh); }
  const M = L.helmR;
  if (L.helm === 'nasal') { g.r(8 + x, 2 + u, 5, 1, M.b); g.r(7 + x, 3 + u, 7, 2, M.b); g.p(8 + x, 2 + u, M.hi); g.r(7 + x, 3 + u, 2, 1, M.hi); g.r(12 + x, 3 + u, 2, 2, M.sh); g.r(7 + x, 5 + u, 7, 1, M.dk); g.r(6 + x, 5 + u, 1, 2, M.b); }
  else if (L.helm === 'cap') { g.r(8 + x, 2 + u, 5, 1, M.b); g.r(7 + x, 3 + u, 7, 2, M.b); g.p(8 + x, 2 + u, M.hi); g.r(12 + x, 3 + u, 2, 2, M.sh); }
  else if (L.helm === 'hat') { g.r(8 + x, 0 + u, 4, 1, M.b); g.r(8 + x, 1 + u, 5, 2, M.b); g.p(8 + x, 1 + u, M.hi); g.r(4 + x, 3 + u, 11, 1, M.b); g.r(4 + x, 3 + u, 3, 1, M.hi); g.r(8 + x, 2 + u, 5, 1, L.belt.dk); }
  else if (L.helm === 'scarf') { g.r(8 + x, 2 + u, 5, 1, M.b); g.r(7 + x, 3 + u, 7, 2, M.b); g.p(8 + x, 2 + u, M.hi); g.r(12 + x, 3 + u, 2, 6, M.sh); g.r(11 + x, 5 + u, 1, 4, M.b); }
}

// Ausweichrolle: zusammengerollte Figur (wird beim Zeichnen in 90°-Schritten gedreht)
function paintTuck(L) {
  const g = new G(20, 25, 1), C = L.cloak || L.cloth, H = L.hood || L.hair;
  for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) {
    const d = i * i + j * j; if (d > 38) continue;
    g.p(10 + i, 15 + j, i + j < -5 ? C.hi : i + j > 4 ? C.dk : i + j > 0 ? C.sh : C.b);
  }
  for (let j = -4; j <= -1; j++) for (let i = -5; i <= -2; i++) g.p(10 + i, 15 + j, (i + j) < -7 ? H.hi : H.b);
  const Bo = L.boots || L.skin; g.r(14, 18, 2, 2, Bo.sh); g.p(15, 17, Bo.b);
  g.r(8, 16, 4, 1, L.belt.dk);
  return g;
}

// ---------------- Frame-Cache ----------------
const frameCache = new Map();
function cacheGet(k, make) {
  let f = frameCache.get(k); if (f) return f;
  if (frameCache.size > 4000) frameCache.clear();
  f = make(); frameCache.set(k, f); return f;
}
// dir: 'S' | 'N' | 'W' | 'E'. pose: i0 i1 w0..w3 a1 a2 hit cast kneel tuck down dead
export function humanFrame(spec, dir, pose) {
  const sk = specKey(spec);
  return cacheGet(sk + dir + pose, () => {
    const L = resolve(spec, sk);
    if (pose === 'tuck') return toCanvas(paintTuck(L));
    if (pose === 'down' || pose === 'dead') {
      const s2 = pose === 'dead' ? { ...L, glow: '' } : L;
      return toCanvas(paintSide(s2, 'i0').rotCW());
    }
    if (dir === 'S') return toCanvas(paintFront(L, pose, false));
    if (dir === 'N') return toCanvas(paintFront(L, pose, true));
    const g = paintSide(L, pose);
    return toCanvas(dir === 'E' ? g.flipX() : g);
  });
}

// Pose aus dem Spielzustand
export function poseOf(e, now, bow) {
  let face = e.facing || 0;
  const sw = e.swing || 0;
  if ((sw > 0 || e.channel) && e.aim != null) {
    const ca = Math.cos(e.aim), sa = Math.sin(e.aim);
    face = Math.abs(ca) > Math.abs(sa) * 0.9 ? (ca > 0 ? 3 : 2) : (sa > 0 ? 0 : 1);
  }
  const dir = 'SNWE'[face] || 'S';
  if (e.dodge) return { dir, pose: 'tuck', rot: ((e.dodge.t / 65) | 0) % 4 };
  if (e.landT > now) return { dir, pose: 'kneel' };                    // Landung nach der Rolle: kurz in die Knie
  if (e.cover) return { dir, pose: 'guard' };                          // Deckung des Spielers (nicht e.guard: das ist die Stadtwache)
  if (e.act && now < e.act.until && now >= e.act.at && !(e.vx || e.vy) && !(sw > 0)) {   // Interaktion: knien, arbeiten, aufrichten
    const k = (now - e.act.at) / (e.act.until - e.act.at), d = e.act.dir || dir;
    if (e.act.kind === 'work') return { dir: d, pose: ((k * 4) | 0) & 1 ? 'a2' : 'a1' };           // Axt/Hacke: zwei Schläge
    if (e.act.kind === 'rise') return { dir: d, pose: k < 0.5 ? 'kneel' : 'hit' };                // vom Boden hoch: Knie, dann wankend
    if (e.act.kind === 'strike') return { dir: d, pose: k < 0.4 ? 'a2' : 'a3' };                  // Handkante: Stoß und Nachgehen
    if (e.act.kind === 'trade') return { dir: d, pose: 'trade' };
    return { dir: d, pose: 'kneel' };                                                             // suchen, sammeln, beten
  }
  if (e.draw > 0) return { dir, pose: 'cast' };                         // Bogen gespannt
  if (e.telegraph > 0 && !(sw > 0)) return { dir, pose: 'a1' };          // Ansage: erhobene Waffe
  if (sw > 0) return { dir, pose: bow ? 'cast' : sw < 0.3 ? 'a1' : sw < 0.72 ? 'a2' : 'a3' };
  if (e.channel || (e.castT && now - e.castT < 450 && now >= e.castT)) return { dir, pose: 'cast' };
  if ((e.lastHurt && now - e.lastHurt < 170 && now >= e.lastHurt) || e.stagger > 0) return { dir, pose: 'hit' };   // Treffer / Taumeln
  if (e.vx || e.vy) return { dir, pose: 'w' + (((now / 115 + (e.seed || 0) * 3) | 0) & 3) };
  if (e.sitting) return { dir: e.sitDir || dir, pose: 'sit' };           // sitzt auf Bank/Stuhl (Schenke, Feierabend)
  return { dir, pose: ((now / 650 + (e.seed || 0)) | 0) & 1 ? 'i1' : 'i0' };
}

// ---------------- Waffen (liegend, Spitze nach +x, Griff bei gx/gy) ----------------
// Jede Waffe hat ein eigenes Design (Form, Griff, Material, Abnutzung). Seltene/heilige Klingen tragen Runen.
const WPN = new Map();
const WOOD = () => ramp('#5b452a'), WRAP = () => ramp('#3a2a1c'), IRON = () => ramp('#6d6154');
function steelOf(r) { return ramp(r === 'mythic' ? '#a9d4e8' : r === 'legendary' ? '#d8b25a' : r === 'epic' ? '#b7a27a' : r === 'rare' ? '#b4b8bd' : '#a8a196'); }
function wrapGrip(g, x0, x1, y) { const W = WRAP(); for (let x = x0; x <= x1; x++) g.p(x, y, (x & 1) ? W.b : W.hi); }
const DESIGNS = {
  rusty_sword(g, St) {                                   // kurz, schartig, rostfleckig
    wrapGrip(g, 1, 3, 3); g.p(0, 3, IRON().b); g.r(4, 1, 1, 5, IRON().sh); g.p(4, 1, IRON().b);
    g.r(5, 2, 10, 1, St.hi); g.r(5, 3, 10, 1, St.b); g.p(15, 3, St.b); g.p(16, 3, St.sh);
    for (const [x, y] of [[7, 3], [9, 2], [12, 3], [13, 2], [6, 2]]) g.p(x, y, (x & 1) ? '#7a4a2a' : '#8c5a30');
    g.a[2 * g.w + 11] = null;                                           // Scharte
    return { gx: 2, gy: 3, blade: [5, 15, 3] };
  },
  longsword(g, St) {                                     // lange Klinge mit Hohlkehle, Scheibenknauf
    wrapGrip(g, 2, 5, 4); g.r(0, 3, 2, 3, IRON().b); g.p(0, 3, IRON().hi);
    g.r(6, 1, 1, 7, IRON().b); g.p(6, 1, IRON().hi); g.p(6, 7, IRON().sh); g.p(7, 1, IRON().sh); g.p(7, 7, IRON().sh);
    g.r(7, 3, 15, 1, St.hi); g.r(7, 4, 15, 1, St.b); g.r(7, 5, 15, 1, St.sh); g.r(8, 4, 11, 1, St.sh);
    g.p(22, 4, St.b); g.p(23, 4, St.sh);
    return { gx: 3, gy: 4, blade: [7, 22, 4] };
  },
  greatsword(g, St) {                                    // Zweihänder: Parierhaken, Fehlschärfe, breite Klinge
    wrapGrip(g, 1, 7, 5); g.r(0, 4, 1, 3, IRON().b);
    g.r(8, 1, 1, 9, IRON().b); g.p(8, 1, IRON().hi); g.p(9, 1, IRON().b); g.p(9, 9, IRON().sh); g.p(8, 9, IRON().sh);
    g.r(9, 4, 3, 3, St.sh); g.p(10, 3, IRON().b); g.p(10, 7, IRON().b);
    g.r(12, 3, 17, 1, St.hi); g.r(12, 4, 17, 2, St.b); g.r(12, 6, 17, 1, St.sh); g.r(13, 5, 12, 1, St.sh);
    g.r(29, 4, 1, 2, St.b); g.p(30, 5, St.sh);
    return { gx: 4, gy: 5, blade: [12, 29, 4] };
  },
  axe(g, St) {                                           // Bartbeil: kurzer Stiel, nach unten gezogene Klinge
    const W = WOOD(); g.r(1, 6, 13, 1, W.b); g.r(1, 7, 13, 1, W.sh); g.p(4, 6, W.hi); g.p(9, 7, W.dk);
    g.r(11, 4, 2, 5, IRON().b); g.p(11, 4, IRON().hi);                      // Tülle
    for (const [x, y0, y1] of [[13, 4, 8], [14, 3, 9], [15, 2, 10], [16, 1, 11]]) {  // fächerförmiges Blatt mit Bart
      g.r(x, y0, 1, y1 - y0 + 1, x === 16 ? St.hi : St.b); g.p(x, y1, St.sh); }
    g.p(15, 2, St.hi); g.p(14, 9, St.sh); g.p(13, 8, St.sh);
    return { gx: 3, gy: 6, blade: null };
  },
  greataxe(g, St) {                                      // Kriegsaxt: langer Schaft, Doppelblatt
    const W = WOOD(); g.r(1, 8, 21, 1, W.b); g.r(1, 9, 21, 1, W.sh); wrapGrip(g, 2, 6, 8); g.p(22, 8, IRON().b);
    for (let dy = -7; dy <= 7; dy++) { const w = 4 - Math.round(Math.abs(dy) / 2.4); if (w <= 0) continue;
      g.r(18 - w, 8 + dy, w, 1, dy < 0 ? St.b : St.sh); g.r(21, 8 + dy, w, 1, dy < 0 ? St.b : St.sh); g.p(17 - w, 8 + dy, St.hi); g.p(20 + w, 8 + dy, St.hi); }
    g.r(18, 6, 3, 5, IRON().b); g.p(18, 6, IRON().hi);
    return { gx: 5, gy: 8, blade: null };
  },
  mace(g, St) {                                          // Flanschkolben mit Dornen
    wrapGrip(g, 1, 4, 5); const W = WOOD(); g.r(5, 5, 5, 1, W.b); g.r(5, 6, 5, 1, W.sh);
    g.r(10, 3, 4, 5, St.b); g.r(10, 3, 4, 1, St.hi); g.r(13, 4, 1, 4, St.sh);
    for (const [x, y] of [[11, 1], [11, 2], [11, 8], [11, 9], [14, 5], [15, 5], [9, 3], [9, 7]]) g.p(x, y, St.sh);
    g.p(11, 1, St.hi);
    return { gx: 2, gy: 5, blade: null };
  },
  spear(g, St) {                                         // Blattspitze, Tülle, roter Wimpel
    const W = WOOD(); g.r(1, 4, 25, 1, W.b); g.r(1, 5, 25, 1, W.sh); g.p(8, 4, W.hi); g.p(16, 5, W.dk);
    g.r(26, 3, 2, 3, IRON().b); g.p(26, 3, IRON().hi);
    g.r(28, 3, 5, 3, St.b); g.r(28, 3, 5, 1, St.hi); g.p(29, 2, St.hi); g.p(30, 2, St.b); g.p(29, 6, St.sh); g.p(30, 6, St.sh); g.p(33, 4, St.b); g.p(34, 4, St.sh);
    const R = ramp('#8c2e22'); g.r(24, 6, 2, 3, R.b); g.p(24, 9, R.sh); g.p(25, 8, R.sh);
    return { gx: 9, gy: 4, blade: [28, 34, 4] };
  },
  dagger(g, St) {                                        // Ringparierstange, leicht gebogene Klinge
    wrapGrip(g, 1, 3, 3); g.p(0, 3, IRON().b); g.r(4, 1, 1, 5, IRON().b); g.p(4, 1, IRON().hi); g.p(5, 1, IRON().sh);
    g.r(5, 3, 6, 1, St.b); g.r(5, 2, 5, 1, St.hi); g.p(11, 2, St.b); g.p(12, 2, St.sh);
    return { gx: 2, gy: 3, blade: [5, 12, 3] };
  },
  pickaxe(g, St) {
    const W = WOOD(); g.r(1, 7, 13, 1, W.b); g.r(1, 8, 13, 1, W.sh);
    g.r(13, 1, 2, 13, St.b); g.r(13, 1, 1, 13, St.hi); g.p(12, 1, St.sh); g.p(12, 13, St.sh); g.p(15, 7, IRON().b);
    return { gx: 3, gy: 7, blade: null };
  },
  staff(g) {                                             // knorriger Stab, Klaue hält einen Kristall
    const W = WOOD(), C = ramp('#3f6fb0');
    for (let x = 1; x <= 19; x++) { const y = 5 + ((x % 7 === 3) ? -1 : 0); g.p(x, y, W.b); g.p(x, y + 1, W.sh); }
    g.p(6, 4, W.dk); g.p(13, 7, W.dk);
    g.p(20, 3, W.b); g.p(21, 2, W.b); g.p(20, 8, W.sh); g.p(21, 9, W.sh); g.p(24, 2, W.sh);   // Klaue
    g.r(21, 4, 3, 3, C.b); g.p(22, 3, C.hi); g.p(21, 4, C.hi); g.p(24, 5, C.sh); g.p(22, 7, C.dk); g.p(23, 5, '#cfe6ff');
    return { gx: 6, gy: 5, blade: null, orb: [22, 5] };
  },
  rapier(g, St) {                                        // Korbgefäß, lange schmale Klinge, Ricasso
    wrapGrip(g, 2, 4, 4); g.p(1, 4, IRON().b); g.p(0, 4, IRON().hi);
    g.r(5, 1, 1, 7, IRON().b); g.p(5, 1, IRON().hi); g.p(6, 1, IRON().sh); g.p(6, 7, IRON().sh); g.p(4, 2, IRON().sh); g.p(4, 6, IRON().sh);   // Bügel
    g.r(6, 4, 3, 1, St.b); g.r(9, 4, 17, 1, St.hi); g.p(26, 4, St.b); g.p(27, 4, St.sh);
    return { gx: 3, gy: 4, blade: [9, 26, 4] };
  },
  warhammer(g, St) {                                     // langer Schaft, Hammerkopf, Rückseitendorn
    const W = WOOD(); g.r(1, 7, 20, 1, W.b); g.r(1, 8, 20, 1, W.sh); wrapGrip(g, 2, 6, 7); g.p(10, 7, W.hi);
    g.r(19, 3, 5, 9, St.b); g.r(19, 3, 5, 1, St.hi); g.r(23, 4, 1, 8, St.sh); g.r(19, 11, 5, 1, St.dk);
    g.r(24, 5, 2, 5, St.sh); g.p(25, 5, St.b);                              // Schlagfläche
    g.p(18, 6, St.sh); g.p(17, 6, St.sh); g.p(16, 7, St.sh);                  // Dorn
    return { gx: 5, gy: 7, blade: null };
  },
  halberd(g, St) {                                       // Schaft, Beilblatt, Haken, Stoßspitze
    const W = WOOD(); g.r(1, 7, 29, 1, W.b); g.r(1, 8, 29, 1, W.sh); g.p(10, 7, W.hi); g.p(20, 8, W.dk);
    for (const [x, y0, y1] of [[27, 1, 7], [28, 0, 7], [29, 1, 7], [30, 2, 7]]) g.r(x, y0, 1, y1 - y0 + 1, x === 28 ? St.hi : St.b);
    g.p(27, 9, St.sh); g.p(28, 10, St.sh);                                   // Haken
    g.r(31, 7, 5, 1, St.hi); g.r(31, 8, 4, 1, St.b); g.p(36, 7, St.sh);      // Spitze
    return { gx: 9, gy: 7, blade: [31, 36, 7] };
  },
  crossbow(g, St) {                                      // Schaft nach vorn, Bogen quer, Sehne, Abzug
    const W = WOOD(); g.r(1, 5, 16, 2, W.b); g.r(1, 6, 16, 1, W.sh); g.p(3, 5, W.hi); g.r(2, 7, 2, 2, W.sh);   // Schaft, Kolben
    g.r(15, 0, 1, 12, St.b); g.p(15, 0, St.hi); g.p(14, 0, St.sh); g.p(14, 11, St.sh);                            // Bogen (Stahl)
    for (let y = 1; y <= 10; y++) g.p(12, y, '#c9bfa6');                                                          // Sehne gespannt
    g.p(8, 7, IRON().b); g.p(8, 8, IRON().sh);                                                                     // Abzug
    return { gx: 4, gy: 6, blade: null };
  },
  wand(g) {                                              // kurzer Stab, gebundener Kristall
    const W = WOOD(), C = ramp('#6f8fd0'); g.r(1, 3, 10, 1, W.b); g.r(1, 4, 10, 1, W.sh); g.p(4, 3, W.dk);
    g.r(11, 2, 3, 3, C.b); g.p(12, 1, C.hi); g.p(11, 2, C.hi); g.p(13, 4, C.sh); g.p(12, 3, '#e8f4ff');
    return { gx: 2, gy: 3, blade: null, orb: [12, 3] };
  },
  gorak_cleaver(g, St) {      // eigener dunkler Stahl                                 // riesiges Hackmesser: Loch, Rost, gezackte Kante
    wrapGrip(g, 1, 7, 7); const R = ramp('#7a4a2a'); St = ramp('#7d766a');
    g.r(8, 2, 15, 9, St.b); g.r(8, 2, 15, 1, St.hi); g.r(8, 10, 15, 1, St.sh); g.r(22, 3, 1, 7, St.hi);
    g.a[5 * g.w + 11] = null; g.a[5 * g.w + 12] = null;                       // Aufhängeloch
    for (const [x, y] of [[10, 8], [14, 4], [17, 9], [19, 6], [12, 9]]) g.p(x, y, (x & 1) ? R.b : R.sh);
    for (let x = 9; x < 23; x += 3) g.a[11 * g.w + x] = null;                  // Scharten
    return { gx: 3, gy: 7, blade: [8, 22, 6] };
  },
};
const SIZE = { rusty_sword: [18, 7], longsword: [25, 9], greatsword: [32, 11], axe: [18, 13], greataxe: [27, 17], mace: [17, 11],
  spear: [36, 10], dagger: [14, 7], pickaxe: [17, 15], staff: [26, 11], gorak_cleaver: [25, 13],
  rapier: [28, 9], warhammer: [27, 13], halberd: [37, 12], crossbow: [18, 12], wand: [15, 6] };
const BY_TYPE = { sword: 'longsword', great: 'greatsword', axe: 'axe', mace: 'mace', spear: 'spear', dagger: 'dagger', staff: 'staff',
  rapier: 'rapier', hammer: 'warhammer', polearm: 'halberd', crossbow: 'crossbow', wand: 'wand' };

export function weaponSprite(key, rarity, holy, wtype) {
  const k = key + '|' + rarity + '|' + (holy ? 1 : 0);
  let w = WPN.get(k); if (w) return w;
  const St = steelOf(rarity);
  let g, info;
  if (wtype === 'bow' || key === 'shortbow' || key === 'longbow') {
    const L = key === 'longbow' ? 12 : 8, wood = WOOD(), grip = WRAP();
    g = new G(9, L * 2 + 3); info = { gx: 2, gy: L + 1, blade: null };
    for (let y = 1; y <= L * 2 + 1; y++) { const t = (y - L - 1) / L, x = Math.round(1 + 4 * (1 - t * t));
      g.p(x, y, Math.abs(t) < 0.25 ? grip.b : wood.b); g.p(x + 1, y, wood.sh); }
    g.p(6, 1, wood.dk); g.p(6, L * 2 + 1, wood.dk);                          // geschwungene Enden
    for (let y = 2; y <= L * 2; y++) g.p(1, y, '#c9bfa6');
  } else {
    const d = DESIGNS[key] ? key : BY_TYPE[wtype] || 'longsword';
    const [W0, H0] = SIZE[d]; g = new G(W0, H0);
    info = DESIGNS[d](g, St);
  }
  const runes = rarity === 'mythic' || rarity === 'legendary' || rarity === 'epic' || holy;
  if (runes && info.blade) { const [x0, x1, y] = info.blade, rc = holy ? '#f2e6b0' : rarity === 'mythic' ? '#e8f8ff' : rarity === 'legendary' ? '#ffd27a' : '#e0a060';
    for (let x = x0 + 2; x < x1 - 1; x += 3) g.p(x, y, rc); }
  w = { cv: toCanvas(g), ...info, runes };
  WPN.set(k, w); return w;
}

// ---------------- Vierbeiner (Seitenansicht, Blick nach links) ----------------
function paintBeast(type, pal, frame, act) {
  const g = new G(28, 18, 0, 2), boar = type === 'boar';
  const F = ramp(pal.body || '#5b5145'), D = ramp(pal.dark || '#3a332b'), eye = pal.eye || '#c8a545';
  const belly = ramp(mix(pal.body || '#5b5145', '#c8b89a', boar ? 0.12 : 0.32));
  const sw = [1, 0, -1, 0][frame & 3], lunge = act === 'a2' ? -2 : act === 'a1' ? 1 : 0, low = act === 'a1' ? 1 : 0;
  // Beine: Oberschenkel 2 px, Unterschenkel 1 px, Pfote/Huf 2 px; ferne Beine dunkel
  const legTop = boar ? 11 : 10, legBot = boar ? 15 : 16;
  const legs = boar ? [[8, 0], [10, 1], [17, 0], [19, 1]] : [[7, 0], [9, 1], [17, 0], [19, 1]];
  for (const [lx, near] of legs) {
    const s = (near ? sw : -sw), C = near ? F : D;
    g.r(lx, legTop, 2, 2, C.sh);
    for (let y = legTop + 2; y < legBot; y++) g.p(lx + (y > legTop + 2 ? s : 0) + (near ? 0 : 1), y, near ? C.sh : C.dk);
    g.r(lx + s - (boar ? 0 : 1) + (near ? 0 : 1), legBot, 2, 1, near ? D.b : D.dk);
  }
  if (boar) {
    for (let x = 5; x <= 21; x++) {
      const top = x >= 7 && x <= 12 ? 3 : x <= 16 ? 4 : 5, bot = x <= 18 ? 11 : 10;
      for (let y = top; y <= bot; y++) g.p(x, y, y === top ? F.hi : y >= bot - 1 ? F.sh : x >= 19 ? F.sh : F.b);
    }
    for (let x = 6; x <= 15; x += 2) g.p(x, 2 + (x > 12 ? 1 : 0), D.b);                // Borstenkamm
    for (let x = 7; x <= 13; x += 2) g.p(x, 3, D.sh);
    g.r(9, 7, 7, 1, F.sh);
    const hx = lunge, hy = low;
    for (let x = 0; x <= 6; x++) { const top = 5 + (x < 3 ? 2 : x < 5 ? 1 : 0) + hy, bot = 10 + hy; for (let y = top; y <= bot; y++) g.p(x + hx + 1, y, y === top ? F.hi : y === bot ? F.sh : F.b); }
    g.r(hx, 8 + hy, 2, 3, D.b); g.p(hx, 9 + hy, DEEP);                              // Rüssel
    g.p(hx + 3, 8 + hy, '#e0d6bc'); g.p(hx + 3, 7 + hy, '#e0d6bc'); g.p(hx + 2, 6 + hy, '#e0d6bc');   // Hauer
    g.p(hx + 4, 6 + hy, eye); g.p(hx + 6, 4 + hy, D.b); g.p(hx + 7, 3 + hy, D.sh);
    g.p(22, 6, D.b); g.p(23, 7, D.sh); g.p(23, 8, D.dk);
  } else {
    for (let x = 6; x <= 20; x++) {
      const top = x <= 10 ? 5 : x <= 15 ? 6 : 5, bot = x <= 10 ? 11 : x <= 12 ? 10 : x <= 15 ? 9 : 11;
      for (let y = top; y <= bot; y++) g.p(x, y, y === top ? F.hi : y === bot ? (x <= 10 ? belly.b : F.sh) : x >= 19 ? F.sh : F.b);
    }
    for (let x = 7; x <= 13; x += 2) g.p(x, 4, D.b);                               // gesträubtes Nackenfell
    g.p(12, 7, D.sh); g.p(14, 7, D.sh); g.p(13, 8, D.sh);                           // Rippen
    g.r(16, 7, 2, 2, F.sh);
    const hx = lunge, hy = low + (act === 'a2' ? 1 : 0);
    g.r(3 + hx, 4 + hy, 4, 5, F.b); g.p(6 + hx, 4 + hy, F.hi);                       // Hals
    g.r(1 + hx, 3 + hy, 4, 4, F.b); g.r(2 + hx, 3 + hy, 3, 1, F.hi);                // Schädel
    g.r(-1 + hx + 1, 5 + hy, 2, 2, F.b); g.p(hx, 5 + hy, DEEP);                     // Schnauze + Nase
    g.p(3 + hx, 1 + hy, D.b); g.p(3 + hx, 2 + hy, F.b); g.p(4 + hx, 2 + hy, D.sh);   // Ohr
    g.p(2 + hx, 4 + hy, eye);
    if (act === 'a2') { g.r(hx, 7 + hy, 3, 1, DEEP); g.p(hx + 1, 7 + hy, '#e0d6bc'); g.r(hx + 1, 8 + hy, 2, 1, F.sh); }
    else g.r(1 + hx, 7 + hy, 3, 1, F.sh);
    const tw = sw * 0;                                                             // Rute, buschig nach hinten unten
    g.r(21, 5 + tw, 2, 2, F.b); g.r(22, 6, 2, 2, F.b); g.r(23, 7, 2, 3, F.sh); g.p(24, 10, D.b); g.p(21, 5, F.hi);
  }
  return g;
}
export function beastFrame(type, pal, dir, pose, frame) {
  return cacheGet('beast|' + type + dir + pose + frame, () => {
    let g = paintBeast(type, pal, frame, pose);
    if (pose === 'dead') g = g.flipY();
    return toCanvas(dir === 'E' ? g.flipX() : g);
  });
}

// ---------------- Gorak (Boss): massiger Grubenwart ----------------
function paintBrute(pal, frame, act) {
  const g = new G(34, 38);
  const S = ramp(mix(pal.skin || '#556b34', '#1a1712', 0.28)), C = ramp(pal.cloth || '#33261a'), M = ramp(pal.metal || '#9a8e78');
  const Lr = ramp('#4a3525'), bone = ramp('#d6cdb4');
  const b = (frame & 1) ? 1 : 0, lf = [1, 0, -1, 0][frame & 3];
  const span = (y, x0, x1, R, light) => { for (let x = x0; x <= x1; x++) g.p(x, y, x <= x0 + 1 && light ? R.hi : x >= x1 - 2 ? R.sh : R.b); };
  // Beine: kurz, O-beinig, Fußlappen
  for (let y = 28; y <= 33; y++) { g.r(9 + (y > 31 ? -1 : 0), y - (lf > 0 ? 1 : 0), 5, 1, S.sh); g.r(20 + (y > 31 ? 1 : 0), y - (lf < 0 ? 1 : 0), 5, 1, S.dk); }
  g.r(7, 34 - (lf > 0 ? 1 : 0), 8, 2, C.dk); g.r(19, 34 - (lf < 0 ? 1 : 0), 8, 2, C.dk); g.p(7, 34 - (lf > 0 ? 1 : 0), C.sh);
  // Rumpf: Nacken → Schultern → Bauch (gewölbt)
  const rows = [[8, 12, 21], [9, 9, 24], [10, 7, 26], [11, 6, 27], [12, 6, 27], [13, 6, 27], [14, 6, 27], [15, 7, 26], [16, 7, 26], [17, 7, 26],
                [18, 7, 26], [19, 7, 26], [20, 8, 25], [21, 8, 25], [22, 9, 24], [23, 9, 24], [24, 10, 23]];
  for (const [y, x0, x1] of rows) span(y + b, x0, x1, S, true);
  g.r(10, 10 + b, 6, 2, S.hi); g.r(14, 17 + b, 6, 1, S.sh); g.r(16, 12 + b, 1, 5, S.sh); g.r(12, 19 + b, 10, 1, S.hi);   // Brust, Bauch
  g.p(11, 15 + b, S.dk); g.p(12, 16 + b, S.dk); g.p(22, 13 + b, S.dk); g.p(23, 14 + b, S.dk);                            // Narben
  for (let i = 0; i < 11; i++) { g.p(9 + i * 1.5 | 0, 10 + i + b, Lr.b); g.p((10 + i * 1.5) | 0, 10 + i + b, Lr.dk); }       // Riemen
  g.r(8, 22 + b, 18, 2, Lr.dk); g.r(15, 21 + b, 3, 3, bone.b); g.p(15, 22 + b, DEEP); g.p(17, 22 + b, DEEP); g.p(16, 21 + b, bone.hi);   // Gürtel, Schädelschnalle
  // Lendenschurz, zerlumpt
  for (let y = 24; y <= 28; y++) span(y + b, 10, 23, C, true);
  for (let x = 10; x <= 23; x++) if (x % 3 !== 1) g.p(x, 29 + b, (x % 3) ? C.sh : C.dk);
  // Schulterpanzer mit Dornen (links), Fell (rechts)
  g.r(3, 8 + b, 8, 5, M.b); g.r(3, 8 + b, 6, 1, M.hi); g.r(3, 12 + b, 8, 1, M.sh); g.r(9, 9 + b, 2, 3, M.sh);
  g.p(4, 7 + b, M.b); g.p(4, 6 + b, M.hi); g.p(7, 7 + b, M.b); g.p(7, 6 + b, M.hi); g.p(5, 10 + b, M.dk);
  const fur = ramp('#4a3f33'); for (let x = 23; x <= 30; x++) { g.p(x, 9 + b + (x & 1), fur.b); g.p(x, 10 + b, fur.sh); g.p(x, 11 + b, fur.dk); }
  // Arme: lang, Lederschienen, große Fäuste
  const up = act === 'a1', hit = act === 'a2';
  if (up) { g.r(3, 13 + b, 5, 6, S.b); g.r(3, 13 + b, 2, 6, S.hi); g.r(2, 19 + b, 6, 4, S.sh); }
  else { g.r(2, 13 + b, 5, 13, S.b); g.r(2, 13 + b, 2, 13, S.hi); g.r(2, 19 + b, 5, 3, Lr.b); g.p(2, 19 + b, Lr.hi); g.r(1, 26 + b, 7, 4, S.sh); g.r(1, 26 + b, 7, 1, S.b); }
  if (up) { g.r(27, 3 + b, 5, 10, S.sh); g.r(27, 3 + b, 1, 10, S.b); g.r(26, 0 + b, 7, 4, S.dk); g.r(27, 7 + b, 5, 2, Lr.sh); }
  else { const hy = hit ? 2 : 0; g.r(27, 12 + b, 5, 13 + hy, S.sh); g.r(27, 19 + b, 5, 3, Lr.sh); g.r(26, 25 + b + hy, 7, 4, S.dk); g.r(26, 25 + b + hy, 7, 1, S.sh); }
  // Kopf: tief zwischen den Schultern, Eisenmaske, glühende Augen, Hauer
  g.r(13, 4 + b, 8, 9, S.b); g.r(14, 3 + b, 6, 1, S.b); g.r(13, 4 + b, 2, 3, S.hi); g.r(19, 4 + b, 2, 9, S.sh);
  g.r(13, 5 + b, 8, 4, M.b); g.r(13, 5 + b, 8, 1, M.hi); g.r(19, 6 + b, 2, 3, M.sh); g.r(16, 5 + b, 2, 4, M.sh);
  g.r(14, 7 + b, 2, 1, '#d2452e'); g.r(18, 7 + b, 2, 1, '#d2452e');
  g.r(14, 10 + b, 6, 2, DEEP); g.p(14, 9 + b, bone.b); g.p(14, 10 + b, bone.hi); g.p(19, 9 + b, bone.b); g.p(19, 10 + b, bone.sh);
  g.p(11, 6 + b, S.sh); g.p(12, 7 + b, S.sh); g.p(22, 6 + b, S.dk); g.p(21, 7 + b, S.dk);                                 // Ohren
  return g;
}
export function bruteFrame(pal, dir, pose, frame) {
  return cacheGet('brute|' + dir + pose + frame, () => { const g = paintBrute(pal, frame, pose); return toCanvas(dir === 'W' ? g.flipX() : g); });
}

// ---------------- Pixelisieren (Props, Icons): Vektorzeichnung → echtes Pixelraster ----------------
// Kanten werden hart (Alpha-Schwelle), Schlagschatten bleiben halbtransparent, 1 px Kontur,
// Randlicht oben links / Schatten unten rechts, leichte Pixelstreuung für organische Oberflächen.
function h2(x, y) { let n = (x * 374761393 + y * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
export function pixelize(c, w, h, organic = 0, flat = false) {
  const img = c.getImageData(0, 0, w, h), d = img.data, solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = d[i * 4 + 3];
    if (a >= 150) { solid[i] = 1; d[i * 4 + 3] = 255; }
    else if (a > 24 && d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2] < 90) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0; d[i * 4 + 3] = 96; }   // Schatten
    else d[i * 4 + 3] = 0;
  }
  const S = (x, y) => x >= 0 && y >= 0 && x < w && y < h && solid[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, o = i * 4;
    if (solid[i]) {
      let f = 1;
      if (!S(x, y - 1) || !S(x - 1, y)) f = 1.2; else if (!S(x, y + 1) || !S(x + 1, y)) f = 0.72;
      if (organic) { const n = h2(x, y); f *= n > 0.82 ? 1.14 : n < 0.2 ? 0.84 : 1; }
      if (f !== 1) { d[o] = clamp8(d[o] * f + (f > 1 ? 6 : 0)); d[o + 1] = clamp8(d[o + 1] * f + (f > 1 ? 5 : 0)); d[o + 2] = clamp8(d[o + 2] * f); }
    } else if (!flat && (S(x - 1, y) || S(x + 1, y) || S(x, y - 1) || S(x, y + 1))) { d[o] = 12; d[o + 1] = 10; d[o + 2] = 8; d[o + 3] = 255; }
  }
  c.putImageData(img, 0, 0);
}

// ---------------- Bodentexturen (16×16, doppelt skaliert = 1 Kachel) ----------------
export function tileTexture(t, v, cols, kind) {
  return cacheGet('tile|' + t + '|' + v + '|' + kind + '|' + cols[0], () => {   // Art + Farbe im Schlüssel: sonst verschmutzt ein Aufruf mit fremder Palette den Cache
    const cv = document.createElement('canvas'); cv.width = cv.height = 16;
    const c = cv.getContext('2d');
    // Grundton je Typ fast konstant (sonst Schachbrett-Muster); Varianten unterscheiden sich über Streupixel.
    const base = ramp(mix(cols[0], cols[v % cols.length], 0.3)), alt = ramp(cols[(v + 1) % cols.length]);
    const P = (x, y, col) => { c.fillStyle = col; c.fillRect(x, y, 1, 1); };
    c.fillStyle = base.b; c.fillRect(0, 0, 16, 16);
    const seed = t * 97 + v * 13;
    const n = (x, y) => h2(x + seed * 31, y + seed * 17);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = n(x, y); if (r > 0.84) P(x, y, mix(base.b, alt.b, 0.6)); else if (r < 0.1) P(x, y, mix(base.b, base.sh, 0.6)); else if (r < 0.13) P(x, y, mix(base.b, base.hi, 0.35)); }
    if (kind === 'grass') {
      for (let i = 0; i < 7; i++) { const x = (n(i, 99) * 15) | 0, y = 2 + ((n(99, i) * 12) | 0); P(x, y, base.hi); P(x, y + 1, base.b); P(x + 1, y + 1, base.sh); }
      if (n(5, 5) > 0.8) { P((n(7, 1) * 14) | 0, (n(1, 7) * 14) | 0, '#8a7a44'); }
    } else if (kind === 'road' || kind === 'stone' || kind === 'dfloor') {
      const bw = kind === 'road' ? 5 : 8, bh = kind === 'road' ? 4 : 8;
      for (let y = 0; y < 16; y += bh) for (let x = -((y / bh) % 2) * (bw >> 1); x < 16; x += bw) {
        for (let i = 0; i < bw; i++) P(x + i, y, base.sh); for (let j = 0; j < bh; j++) P(x, y + j, base.sh);
        P(x + 1, y + 1, base.hi); if (bw > 5) P(x + 2, y + 1, base.hi);
      }
    } else if (kind === 'scree') {                        // Geröllboden: lose Steine mit Licht oben, Schatten unten
      for (let i = 0; i < 7; i++) { const x = (n(i, 21) * 15) | 0, y = (n(21, i) * 15) | 0; P(x, y, base.hi); P(x, y + 1, base.dk); if (i < 3) { P(x + 1, y, base.b); P(x + 1, y + 1, base.dk); } }
      if (n(4, 4) > 0.5) { const x = 2 + ((n(5, 2) * 10) | 0), y = 2 + ((n(2, 5) * 10) | 0);
        P(x, y, base.hi); P(x + 1, y, base.hi); P(x + 2, y, base.b); P(x, y + 1, base.b); P(x + 1, y + 1, base.b); P(x + 2, y + 1, base.sh); P(x, y + 2, base.dk); P(x + 1, y + 2, base.dk); P(x + 2, y + 2, base.dk); }
      for (let i = 0; i < 2; i++) { let x = (n(i, 33) * 13) | 0, y = (n(33, i) * 13) | 0; for (let k = 0; k < 3; k++) { P(x, y, mix(base.b, base.dk, 0.5)); x++; y += n(k, i + 3) > 0.5 ? 1 : 0; } }
    } else if (kind === 'plank') {
      for (let y = 0; y < 16; y += 4) { for (let x = 0; x < 16; x++) P(x, y, base.dk); P(((y * 7) % 13) + 1, y + 2, base.sh); P(3 + (y % 8), y + 1, base.hi); }
    } else if (kind === 'wall' || kind === 'dwall') {
      for (let y = 0; y < 16; y += 4) for (let x = -((y / 4) % 2) * 3; x < 16; x += 6) {
        for (let i = 0; i < 6; i++) P(x + i, y + 3, base.dk); P(x + 5, y, base.dk); P(x + 5, y + 1, base.dk); P(x + 5, y + 2, base.dk);
        P(x, y, base.hi); P(x + 1, y, base.hi);
      }
      for (let x = 0; x < 16; x++) P(x, 0, base.hi);
    } else if (kind === 'rock') {
      for (let i = 0; i < 3; i++) { let x = (n(i, 3) * 14) | 0, y = (n(3, i) * 12) | 0; for (let k = 0; k < 5; k++) { P(x, y, base.dk); x += n(k, i) > 0.5 ? 1 : 0; y++; } }
      for (let x = 0; x < 16; x++) P(x, 0, base.hi);
    } else if (kind === 'field') {
      for (let y = 1; y < 16; y += 4) for (let x = 0; x < 16; x++) { P(x, y, base.dk); if ((x + y) % 3 === 0) P(x, y - 1, '#6d6a36'); }
    } else if (kind === 'water') {
      for (let i = 0; i < 4; i++) { const x = (n(i, 9) * 12) | 0, y = (n(9, i) * 15) | 0; P(x, y, base.hi); P(x + 1, y, base.hi); P(x + 2, y, base.b); }
    } else if (kind === 'marsh') {
      for (let i = 0; i < 3; i++) { const x = (n(i, 4) * 14) | 0, y = 4 + ((n(4, i) * 9) | 0); P(x, y, '#2a3220'); P(x, y + 1, '#2a3220'); P(x, y + 2, '#1f2618'); P(x + 1, y - 1, '#46502e'); }
      if (n(2, 2) > 0.6) for (let i = 3; i < 9; i++) { P(i + 3, 10, '#243029'); P(i + 3, 11, '#26332e'); }
    } else if (kind === 'ash') {
      if (n(8, 8) > 0.7) { const x = 3 + ((n(1, 2) * 9) | 0), y = 3 + ((n(2, 1) * 9) | 0); P(x, y, '#b8b09a'); P(x + 1, y, '#b8b09a'); P(x + 2, y + 1, '#8e8776'); }
      if (n(6, 3) > 0.85) P((n(3, 6) * 15) | 0, (n(6, 6) * 15) | 0, '#7a3a22');
    } else if (kind === 'sand' || kind === 'dirt') {
      for (let i = 0; i < 4; i++) { const x = (n(i, 7) * 15) | 0, y = (n(7, i) * 15) | 0; P(x, y, base.hi); P(x + 1, y + 1, base.dk); }
    }
    return cv;
  });
}
