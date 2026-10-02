// ROTFALL: LEGACY — Sternenhimmel der Talente (Klassen und Talente, Scheibe 2; Entwickler 02.10.2026, Entwurf
// ROTFALL_STATE/PROPOSALS/designs/talente_sternbild.html). Jedes Sternbild ist ein Talentbaum: der Wanderer (die alten Zweige
// Kampf, Magie, Überleben), je Klasse eins, je Titelklasse eins, dazu das Sternbild der Gefährten. Sterne = Knoten aus
// SKILL_TREE (Lage: n.sky, n.pos aus data.js). Zustände und Lernen kommen aus game.js (A.nodeState, A.learnNode …) — diese Datei
// zeichnet nur. Der Himmel läuft in einem eigenen Canvas im Fenster, nicht in der Spielschleife; er hält an, sobald das Fenster zu ist.
import { S, partyMembers } from './state.js?v=24';
import { SKILL_TREE, SKILL_BRANCHES, SKIES, CLASSES } from './data.js?v=24';

const TYPE = { keystone: 'Schlüsselstern', notable: 'Merkmal', active: 'Aktive Fähigkeit', '': 'Talent' };
const STX = { learned: 'gelernt', open: 'lernbar', locked: 'gesperrt', sealed: 'versiegelt', barred: 'ausgeschlossen' };
const esc = t => String(t ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
let V = null;   // laufende Ansicht (eine zugleich)

function css() {
  if (document.getElementById('sky-css')) return;
  const st = document.createElement('style'); st.id = 'sky-css';
  st.textContent = `
#modal-body.sky-body{padding:0;overflow:hidden;position:relative;display:flex;flex-direction:column}
.sky-bar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;padding:8px 12px;background:linear-gradient(#0c0a08,#0c0a0800);font:13px Spectral,Georgia,serif;color:#cfc3a6;z-index:2}
.sky-bar .sky-crumb{font-style:italic;color:#8d836e}
.sky-bar .sky-pts{margin-left:auto;font:600 14px Cinzel,Georgia,serif;color:#c9a24a;letter-spacing:.04em}
.sky-bar button,.sky-bar select{background:#1a150f;color:#e7dcc2;border:1px solid #5a4a30;padding:4px 9px;font:12px Spectral,Georgia,serif;border-radius:2px;cursor:pointer}
.sky-bar button:hover{border-color:#c9a24a;color:#fff3cf}
.sky-bar button.gold{border-color:#c9a24a;color:#f3e2b0}
.sky-wrap{position:relative;flex:1;min-height:420px;height:min(72vh,700px);background:#07060a;overflow:hidden}
.sky-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none}
.sky-wrap canvas.drag{cursor:grabbing}
.sky-card{position:absolute;width:270px;max-width:calc(100% - 16px);background:#120f0b;border:1px solid #6a5634;box-shadow:0 6px 24px #000c;padding:10px 12px;display:none;z-index:3;font:13px/1.4 Spectral,Georgia,serif;color:#e7dcc2}
.sky-card .n{font:700 15px Cinzel,Georgia,serif;color:#f0dfb0;letter-spacing:.05em}
.sky-card .s{color:#8d836e;font-size:12px;margin-bottom:6px}
.sky-card .i{color:#8d836e;font-size:12px;margin-top:4px}
.sky-card .r{color:#b09a6e;font-size:12px;margin-top:4px}
.sky-card .rest{color:#9ab0c8;font-size:12px;margin-top:4px}
.sky-card .act{display:flex;gap:8px;margin-top:10px}
.sky-card button{background:#1a150f;color:#e7dcc2;border:1px solid #5a4a30;padding:4px 10px;font:13px Spectral,Georgia,serif;cursor:pointer}
.sky-card button.gold{border-color:#c9a24a;color:#f3e2b0}
.sky-card button:disabled{opacity:.45;cursor:default}
.sky-legend{position:absolute;right:10px;bottom:8px;max-width:330px;background:rgba(16,13,10,.86);border:1px solid #3a3226;padding:6px 10px;font:11px/1.45 Spectral,Georgia,serif;color:#8d836e;z-index:2;pointer-events:none}
.sky-legend b{color:#e7dcc2;font-weight:600}
@media (max-width:700px){.sky-legend{display:none}.sky-wrap{height:62vh}}`;
  document.head.appendChild(st);
}

// Welt-Lage eines Sterns: Mitte des Sternbilds + Lage im Sternbild
const skyOf = k => SKIES[SKILL_TREE[k]?.sky];
const wpos = k => { const n = SKILL_TREE[k], s = SKIES[n.sky]; return { x: s.at[0] + n.pos[0], y: s.at[1] + n.pos[1] }; };
const rad = n => n.type === 'keystone' ? 13 : n.type === 'notable' ? 9.5 : n.type === 'active' ? 9 : 6.5;

// who: der Held oder ein Gefährte. Der Gefährte sieht nur sein Sternbild.
function skyList(v) { return Object.keys(SKIES).filter(s => (v.comp ? SKIES[s].comp : !SKIES[s].comp) && Object.values(SKILL_TREE).some(n => n.sky === s)); }
function nodesOf(v) { const L = new Set(skyList(v)); return Object.keys(SKILL_TREE).filter(k => L.has(SKILL_TREE[k].sky)); }

export function skyUI(body, A, { refresh } = {}) {
  css(); if (V) stop();
  body.className = 'sky-body';
  const mem = (partyMembers?.() || []).filter(m => !m.coopPilot && !m.coopHero && m.alive);
  const v = V = { A, body, who: S.player, comp: false, focus: null, hover: null, picked: null, t0: performance.now(), sparks: [], rings: [], reveal: new Map(),
    cam: { x: 0, y: 150, z: 0.2, tx: 0, ty: 150, tz: 0.2 }, W: 0, H: 0, DPR: 1, alive: true, refresh };
  const prev = S.flags?.skyWho && mem.find(m => m.id === S.flags.skyWho);
  if (prev) { v.who = prev; v.comp = true; }
  body.innerHTML = `<div class="sky-bar"><span class="sky-crumb" id="sky-crumb">Sternenhimmel</span><button id="sky-back" style="display:none">◂ Zum Himmel</button>
    ${mem.length ? `<label>Für: <select id="sky-who"><option value="">${esc(S.player.name)} (du)</option>${mem.map(m => `<option value="${m.id}" ${v.who === m ? 'selected' : ''}>${esc(m.name)} (Gefährte)</option>`).join('')}</select></label>` : ''}
    <button id="sky-free" class="gold" style="display:none" title="Einmal kostenlos: alle Punkte zurück, neu verteilen">Die Sterne neu ordnen (kostenlos)</button>
    <button id="sky-zin" title="Heranzoomen (+)">+</button><button id="sky-zout" title="Wegzoomen (−)">−</button>
    <span class="sky-pts" id="sky-pts"></span></div>
    <div class="sky-wrap" id="sky-wrap"><canvas id="sky-cv"></canvas><div class="sky-card" id="sky-card"></div>
    <div class="sky-legend"><b>Klein</b> Talent · <b>mittel</b> Merkmal · <b>Goldring</b> Schlüsselstern · <b>Raute</b> aktive Fähigkeit.<br>
    <b>Gold</b> gelernt · <b>pulsierend</b> lernbar · <b>dunkel</b> gesperrt · <b>Riss</b> ausgeschlossen · <b>Umriss</b> versiegelt · <b>bläulich</b> ruht (Klasse nicht aktiv).<br>
    Ziehen = schwenken · Mausrad/± = zoomen · Klick aufs Sternbild = hinein · Klick auf einen Stern = Karte mit „Lernen“.</div></div>`;
  v.cv = body.querySelector('#sky-cv'); v.cx = v.cv.getContext('2d'); v.card = body.querySelector('#sky-card');
  body.querySelector('#sky-back').onclick = () => back(v);
  body.querySelector('#sky-zin').onclick = () => zoomBy(v, 1.3); body.querySelector('#sky-zout').onclick = () => zoomBy(v, 1 / 1.3);
  const sel = body.querySelector('#sky-who');
  if (sel) sel.onchange = () => { const m = mem.find(x => String(x.id) === sel.value); v.who = m || S.player; v.comp = !!m; (S.flags ||= {}).skyWho = m ? m.id : null; v.picked = null; hideCard(v); v.focus = null; ui(v); fit(v, true); if (v.comp) zoomTo(v, 'companion'); };
  body.querySelector('#sky-free').onclick = () => { A.freeRespec?.(); ui(v); };
  bindInput(v); resize(v); ui(v); fit(v, true);
  if (v.comp) zoomTo(v, 'companion');
  else { const cur = v.who.currentClass; if (cur && SKIES[cur] && skyList(v).includes(cur) && !S.flags?.skyOverview) zoomTo(v, cur); }
  v.onResize = () => resize(v); addEventListener('resize', v.onResize);
  v.onKey = e => { if (!v.cv.isConnected) return stop(); const k = e.key;
    if (k === 'Escape' && (v.picked || v.focus)) { e.preventDefault(); e.stopImmediatePropagation(); if (v.picked) { v.picked = null; hideCard(v); } else back(v); }
    else if (k === '+' || k === '=') { zoomBy(v, 1.25); e.stopImmediatePropagation(); } else if (k === '-') { zoomBy(v, 0.8); e.stopImmediatePropagation(); } };
  addEventListener('keydown', v.onKey, true);
  requestAnimationFrame(t => draw(v, t));
}
function stop() { const v = V; if (!v) return; v.alive = false; removeEventListener('resize', v.onResize); removeEventListener('keydown', v.onKey, true); V = null; }

// Zustand eines Sterns für die gewählte Figur
const state = (v, k) => v.comp ? v.A.compNodeState(v.who, k) : v.A.nodeState(v.who, k);
const pts = v => v.comp ? v.A.compPoints(v.who) : (v.who.skillPoints || 0);
const resting = (v, k) => { const n = SKILL_TREE[k]; return !v.comp && (n.type === 'keystone' || n.ab) && !v.A.skyActive(v.who, n.branch); };
const skyOpen = (v, s) => v.comp || !!v.info?.[s]?.open;

function ui(v) {
  v.info = {}; for (const s of skyList(v)) v.info[s] = v.comp ? { open: true, sub: v.who.name } : v.A.skyInfo(v.who, s);   /* einmal je Stand, nicht je Bild */
  const p = v.body.querySelector('#sky-pts'); if (p) p.textContent = `Talentpunkte frei: ${pts(v)}${v.comp ? ` · ${v.who.name}` : ''}`;
  const f = v.body.querySelector('#sky-free'); if (f) f.style.display = !v.comp && v.who.freeRespec && v.A.talentSpent?.(v.who) ? '' : 'none';
}
function resize(v) {
  const r = v.cv.getBoundingClientRect(); v.DPR = Math.min(2, devicePixelRatio || 1); v.W = r.width || 800; v.H = r.height || 500;
  v.cv.width = v.W * v.DPR; v.cv.height = v.H * v.DPR; if (!v.focus) fit(v, true);
}
function bounds(v) { const L = skyList(v); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const s of L) { const [x, y] = SKIES[s].at; x0 = Math.min(x0, x - 260); x1 = Math.max(x1, x + 260); y0 = Math.min(y0, y - 260); y1 = Math.max(y1, y + 300); } return { x0, y0, x1, y1 }; }
function fit(v, now) { const b = bounds(v), z = Math.min(v.W / (b.x1 - b.x0), v.H / (b.y1 - b.y0)) * 0.96; Object.assign(v.cam, { tx: (b.x0 + b.x1) / 2, ty: (b.y0 + b.y1) / 2, tz: z }); if (now) Object.assign(v.cam, { x: v.cam.tx, y: v.cam.ty, z }); }
const toS = (v, x, y) => ({ x: (x - v.cam.x) * v.cam.z + v.W / 2, y: (y - v.cam.y) * v.cam.z + v.H / 2 });
const toW = (v, x, y) => ({ x: (x - v.W / 2) / v.cam.z + v.cam.x, y: (y - v.H / 2) / v.cam.z + v.cam.y });
function zoomBy(v, f) { v.cam.tz = Math.max(0.08, Math.min(2.6, v.cam.tz * f)); }
function zoomTo(v, s) { const K = SKIES[s]; if (!K) return; v.focus = s; Object.assign(v.cam, { tx: K.at[0], ty: K.at[1] + 10, tz: Math.min(v.W / (K.size || 620), v.H / ((K.size || 620) - 60), 1.6) });
  const c = v.body.querySelector('#sky-crumb'); if (c) c.textContent = 'Sternenhimmel › ' + K.name; const b = v.body.querySelector('#sky-back'); if (b) b.style.display = v.comp ? 'none' : ''; }
function back(v) { v.focus = null; v.picked = null; hideCard(v); fit(v, false); const c = v.body.querySelector('#sky-crumb'); if (c) c.textContent = 'Sternenhimmel'; const b = v.body.querySelector('#sky-back'); if (b) b.style.display = 'none'; }

// Hintergrund: fester Zufall (eigener Generator, nie rnd() des Spiels)
let seed = 7; const prng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const BG = Array.from({ length: 1100 }, () => ({ x: (prng() - 0.5) * 7000, y: (prng() - 0.5) * 5200, r: prng() * 1.3 + 0.2, a: prng() * 0.6 + 0.15, p: prng() * 6 }));

function draw(v, now) {
  if (!v.alive || !v.cv.isConnected) { if (V === v) stop(); return; }
  const cx = v.cx, t = (now - v.t0) / 1000, motion = S.settings?.motion !== false, cam = v.cam;
  cam.x += (cam.tx - cam.x) * 0.14; cam.y += (cam.ty - cam.y) * 0.14; cam.z += (cam.tz - cam.z) * 0.14;
  cx.setTransform(v.DPR, 0, 0, v.DPR, 0, 0);
  const g = cx.createRadialGradient(v.W * 0.5, v.H * 0.55, 40, v.W * 0.5, v.H * 0.55, Math.max(v.W, v.H) * 0.8);
  g.addColorStop(0, '#141022'); g.addColorStop(0.55, '#0a0812'); g.addColorStop(1, '#040306'); cx.fillStyle = g; cx.fillRect(0, 0, v.W, v.H);
  const L = skyList(v);
  for (const s of L) { const K = SKIES[s], p = toS(v, K.at[0], K.at[1]), r = 330 * cam.z, gg = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);   // Nebel je Sternbild
    gg.addColorStop(0, hexA(K.col, skyOpen(v, s) ? 0.09 : 0.035)); gg.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = gg; cx.fillRect(p.x - r, p.y - r, r * 2, r * 2); }
  for (const b of BG) { const x = (b.x - cam.x * 0.6) * cam.z * 0.6 + v.W / 2, y = (b.y - cam.y * 0.6) * cam.z * 0.6 + v.H / 2;
    if (x < -2 || y < -2 || x > v.W + 2 || y > v.H + 2) continue; cx.globalAlpha = b.a * (motion ? 0.75 + 0.25 * Math.sin(t * 1.3 + b.p) : 0.9); cx.fillStyle = '#dcd6f0'; cx.fillRect(x, y, b.r, b.r); }
  cx.globalAlpha = 1;
  const K = nodesOf(v), ST = Object.fromEntries(K.map(k => [k, state(v, k)]));
  for (const k of K) { const n = SKILL_TREE[k], b = toS(v, wpos(k).x, wpos(k).y), sealed = ST[k] === 'sealed', rv = v.reveal.get(k);   // Linien
    for (const r of n.requires) { if (!SKILL_TREE[r]) continue; const a = toS(v, wpos(r).x, wpos(r).y), lit = ST[r] === 'learned' && ST[k] === 'learned', half = ST[r] === 'learned' && !sealed;
      cx.strokeStyle = lit ? 'rgba(232,196,110,.85)' : half ? 'rgba(200,170,110,.4)' : sealed ? 'rgba(120,110,95,.16)' : 'rgba(150,135,110,.26)';
      cx.lineWidth = lit ? 2.2 : 1.2; if (lit) { cx.shadowColor = '#e8c46e'; cx.shadowBlur = 8; } cx.globalAlpha = rv != null ? Math.max(0, Math.min(1, rv)) : 1;
      cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke(); cx.shadowBlur = 0; cx.globalAlpha = 1; } }
  for (const k of K) { const n = SKILL_TREE[k]; if (!n.excl || !SKILL_TREE[n.excl] || k > n.excl) continue;   // Riss zwischen Schlüsselsternen
    const a = toS(v, wpos(k).x, wpos(k).y), b = toS(v, wpos(n.excl).x, wpos(n.excl).y), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, s = 7 * cam.z + 3;
    cx.strokeStyle = ST[k] === 'learned' || ST[n.excl] === 'learned' ? 'rgba(200,80,60,.75)' : 'rgba(160,120,90,.35)'; cx.lineWidth = 1.2;
    cx.beginPath(); cx.moveTo(m.x - s * 0.4, m.y - s); cx.lineTo(m.x + s * 0.3, m.y - s * 0.2); cx.lineTo(m.x - s * 0.3, m.y + s * 0.2); cx.lineTo(m.x + s * 0.4, m.y + s); cx.stroke(); }
  for (const k of K) { const n = SKILL_TREE[k], P = wpos(k), s = toS(v, P.x, P.y), st = ST[k], rest = resting(v, k), rv = v.reveal.get(k);   // Sterne
    if (s.x < -40 || s.y < -40 || s.x > v.W + 40 || s.y > v.H + 40) continue;
    const r = rad(n) * Math.max(0.3, Math.min(1.4, cam.z)) * (v.hover === k ? 1.25 : 1), col = skyOf(k).col;
    cx.globalAlpha = rv != null ? Math.max(0, Math.min(1, rv)) : 1;
    if (st === 'learned') { const gl = cx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3.2); gl.addColorStop(0, rest ? 'rgba(150,180,220,.55)' : 'rgba(255,225,150,.75)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = gl; cx.fillRect(s.x - r * 3.2, s.y - r * 3.2, r * 6.4, r * 6.4); star(cx, s.x, s.y, r, n.type, rest ? '#b8cce4' : '#ffe9b0'); }
    else if (st === 'open') { const pu = motion ? 0.55 + 0.45 * Math.sin(t * 3 + P.x * 0.01) : 0.8; cx.shadowColor = col; cx.shadowBlur = 10 * pu; star(cx, s.x, s.y, r, n.type, col); cx.shadowBlur = 0;
      if (pts(v) > 0) { cx.strokeStyle = `rgba(232,200,120,${0.35 + 0.4 * pu})`; cx.lineWidth = 1; cx.beginPath(); cx.arc(s.x, s.y, r * 1.5 + 2 * pu, 0, 7); cx.stroke(); } }
    else if (st === 'sealed') { cx.strokeStyle = 'rgba(150,138,118,.42)'; cx.lineWidth = 1; cx.beginPath(); cx.arc(s.x, s.y, r * 0.8, 0, 7); cx.stroke(); }
    else if (st === 'barred') { star(cx, s.x, s.y, r * 0.8, n.type, '#4a2a24'); cx.strokeStyle = 'rgba(200,80,60,.6)'; cx.beginPath(); cx.moveTo(s.x - r, s.y - r); cx.lineTo(s.x + r, s.y + r); cx.stroke(); }
    else star(cx, s.x, s.y, r * 0.85, n.type, '#3e3628');
    if (n.type === 'keystone') { cx.strokeStyle = st === 'sealed' ? 'rgba(150,130,90,.3)' : 'rgba(201,162,74,.9)'; cx.lineWidth = 1.4; cx.beginPath(); cx.arc(s.x, s.y, r * 1.3, 0, 7); cx.stroke(); }
    if (cam.z > 0.55 && (v.focus === n.sky || cam.z > 0.9)) { cx.font = `${Math.round(11 * Math.min(1.3, cam.z))}px Spectral, Georgia, serif`; cx.textAlign = 'center';
      cx.fillStyle = st === 'learned' ? (rest ? '#a9bcd6' : '#f3e2b0') : st === 'open' ? '#d8c8a0' : st === 'sealed' ? 'rgba(150,138,118,.55)' : '#8d836e';
      cx.fillText(n.name, s.x, s.y + r + 14 * Math.min(1.2, cam.z)); }
    cx.globalAlpha = 1; }
  for (const s of L) { const Kk = SKIES[s], c = toS(v, Kk.at[0], Kk.at[1] + (Kk.lab || 235)), info = v.info?.[s] || { open: false, sub: '' };   // Namen
    label(v, Kk.name, info.sub, c.x, c.y, info.open ? Kk.col : 'rgba(170,158,135,.6)', Kk); }
  for (let i = v.sparks.length - 1; i >= 0; i--) { const s = v.sparks[i]; s.u += 0.03; if (s.u >= 1) { v.sparks.splice(i, 1); continue; }   // Funkenlauf
    const a = toS(v, s.a.x, s.a.y), b = toS(v, s.b.x, s.b.y), x = a.x + (b.x - a.x) * s.u, y = a.y + (b.y - a.y) * s.u, gl = cx.createRadialGradient(x, y, 0, x, y, 12);
    gl.addColorStop(0, 'rgba(255,240,190,1)'); gl.addColorStop(1, 'rgba(255,200,90,0)'); cx.fillStyle = gl; cx.fillRect(x - 12, y - 12, 24, 24); }
  for (let i = v.rings.length - 1; i >= 0; i--) { const r = v.rings[i]; if (r.wait > 0) { r.wait -= 0.03; continue; } r.u += 0.022; if (r.u >= 1) { v.rings.splice(i, 1); continue; }
    const p = toS(v, r.x, r.y); cx.strokeStyle = `rgba(255,220,140,${1 - r.u})`; cx.lineWidth = 2; cx.beginPath(); cx.arc(p.x, p.y, 8 + r.u * 46 * Math.max(0.6, cam.z), 0, 7); cx.stroke();
    for (const d of r.dots) { const q = r.u * d.v * Math.max(0.6, cam.z); cx.fillStyle = `rgba(255,230,160,${1 - r.u})`; cx.fillRect(p.x + Math.cos(d.a) * q, p.y + Math.sin(d.a) * q, 2, 2); } }
  for (const [k, x] of v.reveal) { if (x >= 1.2) v.reveal.delete(k); else v.reveal.set(k, x + 0.03); }
  requestAnimationFrame(t2 => draw(v, t2));
}
function star(cx, x, y, r, t, col) {
  cx.fillStyle = col; cx.beginPath();
  if (t === 'active') { cx.moveTo(x, y - r); cx.lineTo(x + r, y); cx.lineTo(x, y + r); cx.lineTo(x - r, y); }
  else { const sp = t === 'keystone' ? 8 : 4; for (let i = 0; i < sp * 2; i++) { const a = i * Math.PI / sp - Math.PI / 2, rr = i % 2 ? r * (t === 'keystone' ? 0.45 : 0.38) : r; cx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } }
  cx.closePath(); cx.fill();
}
function label(v, name, sub, x, y, col, ref) {
  const cx = v.cx, z = Math.max(0.5, Math.min(1.3, v.cam.z * 2.4));
  cx.textAlign = 'center'; cx.font = `700 ${Math.round(15 * z)}px Cinzel, Georgia, serif`; cx.fillStyle = col; cx.fillText(name.toUpperCase(), x, y);
  if (sub) { cx.font = `italic ${Math.round(11 * z)}px Spectral, Georgia, serif`; cx.fillStyle = 'rgba(185,170,140,.78)'; cx.fillText(sub.length > 70 ? sub.slice(0, 68) + '…' : sub, x, y + 15 * z); }
}
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }

// ---- Bedienung: Ziehen, Mausrad, Zwei-Finger-Zoom, Klick ----
function bindInput(v) {
  const cv = v.cv, ptrs = new Map(); let drag = null, moved = false, pinch = null;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: v.cam.tz }; drag = null; return; }
    drag = { x: e.clientX, y: e.clientY, cx: v.cam.tx, cy: v.cam.ty }; moved = false; cv.classList.add('drag'); });
  cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; v.cam.tz = Math.max(0.08, Math.min(2.6, pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / (pinch.d || 1))); moved = true; return; }
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      if (moved) { v.cam.tx = drag.cx - dx / v.cam.z; v.cam.ty = drag.cy - dy / v.cam.z; v.cam.x = v.cam.tx; v.cam.y = v.cam.ty; } return; }
    v.hover = hit(v, mx, my); cv.style.cursor = v.hover ? 'pointer' : 'grab';
    if (v.hover && !v.picked) showCard(v, v.hover, mx, my, false); else if (!v.picked) hideCard(v); });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; cv.classList.remove('drag'); const was = drag; drag = null; if (!was || moved) return;
    const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, k = hit(v, mx, my);
    if (k && (v.focus || v.cam.z > 0.5)) { v.picked = k; showCard(v, k, mx, my, true); return; }
    v.picked = null; hideCard(v); const s = skyAt(v, mx, my); if (s) zoomTo(v, s); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); pinch = null; drag = null; });
  cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, f = Math.exp(-e.deltaY * 0.0012), before = toW(v, mx, my);
    v.cam.tz = Math.max(0.08, Math.min(2.6, v.cam.tz * f)); v.cam.z = v.cam.tz; const after = toW(v, mx, my);
    v.cam.tx += before.x - after.x; v.cam.ty += before.y - after.y; v.cam.x = v.cam.tx; v.cam.y = v.cam.ty; }, { passive: false });
}
function hit(v, mx, my) { let best = null, bd = 1e9; for (const k of nodesOf(v)) { const p = wpos(k), s = toS(v, p.x, p.y), d = Math.hypot(s.x - mx, s.y - my), r = rad(SKILL_TREE[k]) * Math.max(0.3, Math.min(1.4, v.cam.z)) + 6;
  if (d < r && d < bd) { bd = d; best = k; } } return best; }
function skyAt(v, mx, my) { const w = toW(v, mx, my); let best = null, bd = 1e9; for (const s of skyList(v)) { const K = SKIES[s], d = Math.hypot(w.x - K.at[0], w.y - K.at[1]); if (d < 300 && d < bd) { bd = d; best = s; } } return best; }

function cardHTML(v, k, pin) {
  const n = SKILL_TREE[k], st = state(v, k), K = skyOf(k), rest = resting(v, k), info = v.info?.[n.sky] || { open: true };
  const req = n.requires.map(r => SKILL_TREE[r]?.name).filter(Boolean).join(' oder ');
  const owner = SKILL_BRANCHES[n.branch]?.cls ? CLASSES[SKILL_BRANCHES[n.branch].cls]?.name : SKILL_BRANCHES[n.branch]?.title ? info.titleName : null;
  return `<div class="n">${esc(n.name)}</div><div class="s">${TYPE[n.type || ''] || 'Talent'} · ${STX[st] || st} · ${esc(K.name)}</div>
    <div>${esc(n.desc)}</div>${n.designIntent ? `<div class="i">Absicht: ${esc(n.designIntent)}</div>` : ''}
    ${req ? `<div class="r">Braucht: ${esc(req)}</div>` : ''}${n.excl && SKILL_TREE[n.excl] ? `<div class="r">Schließt aus: ${esc(SKILL_TREE[n.excl].name)}</div>` : ''}
    ${st === 'sealed' ? `<div class="r">Versiegelt — ${esc(info.where || '')}</div>` : ''}
    ${rest && st !== 'sealed' ? `<div class="rest">Ruht, solange du nicht ${esc(owner || 'in dieser Rolle')} bist (oder eine Folgeklasse davon).</div>` : ''}
    ${!v.comp && SKILL_BRANCHES[n.branch]?.cls && !n.ab && n.type !== 'keystone' ? `<div class="i">Wertestern: wirkt immer, auch wenn eine andere Klasse aktiv ist.</div>` : ''}
    ${pin ? `<div class="act">${st === 'open' ? `<button class="gold" data-learn="${k}" ${pts(v) < 1 ? 'disabled' : ''}>Lernen (1 Punkt)</button>` : ''}<button data-close="1">Schließen</button></div>${st === 'open' && pts(v) < 1 ? '<div class="i">Kein Punkt frei: einer auf jeder zweiten Stufe und je bestandener Klassenprüfung.</div>' : ''}` : ''}`;
}
function showCard(v, k, mx, my, pin) {
  const el = v.card; el.innerHTML = cardHTML(v, k, pin); el.style.display = 'block';
  const w = el.offsetWidth || 270, h = el.offsetHeight; el.style.left = Math.max(8, Math.min(v.W - w - 8, mx + 18)) + 'px'; el.style.top = Math.max(8, Math.min(v.H - h - 8, my - 20)) + 'px';
  if (pin) { const l = el.querySelector('[data-learn]'); if (l) l.onclick = () => learn(v, k); el.querySelector('[data-close]').onclick = () => { v.picked = null; hideCard(v); }; }
}
function hideCard(v) { if (v.card) v.card.style.display = 'none'; }
function learn(v, k) {
  if (state(v, k) !== 'open' || pts(v) < 1) return;
  if (v.comp) v.A.learnCompNode(v.who.id, k); else v.A.learnNode(k);
  if (state(v, k) !== 'learned') return;                                 /* Koop-Gast: der Host entscheidet; das Bild folgt mit dem nächsten Stand */
  v.picked = null; hideCard(v); ui(v);
  const to = wpos(k), from = SKILL_TREE[k].requires.filter(r => SKILL_TREE[r] && state(v, r) === 'learned');
  for (const r of from) v.sparks.push({ a: wpos(r), b: to, u: 0 });
  v.rings.push({ x: to.x, y: to.y, u: 0, wait: from.length ? 0.9 : 0, dots: Array.from({ length: 14 }, (_, i) => ({ a: i / 14 * 6.28, v: 30 + (i * 37 % 30) })) });
}
// Neu erschienene Sterne einer Klasse blenden ein (nach der Aufnahme)
export function skyReveal(cls) { const v = V; if (!v) return; let i = 0; for (const [k, n] of Object.entries(SKILL_TREE)) if (n.sky === cls) v.reveal.set(k, -0.2 * i++); }
// Probe: Zahlen der laufenden Ansicht (für den Selbsttest)
export const skyDebug = () => V ? { focus: V.focus, z: V.cam.tz, comp: V.comp, skies: skyList(V).length, nodes: nodesOf(V).length } : null;
export { skyList as _skyList };
