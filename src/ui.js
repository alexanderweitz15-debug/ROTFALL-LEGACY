// Oberfläche: Panels, Modale, Dialog, Chronik. Spiel-Logik hängt über bind() dran.
import { S, onLog, timeStr, year, partyMembers, byId, clamp, dist, seasonOf, SEASONS, SAVE_KEY, saveData, readRaw } from './state.js?v=24';
import * as CS from './cloudsave.js?v=24';
import { ITEMS, RARITY, RARITY_VALUE, ARMOR_SETS, AFFIXES, LEGENDS, CLASSES, ABILITIES, FACTIONS, BUILDINGS, MONSTERS, MEMORY_TEXT, QUESTS, SKILL_NAMES, TITLE_CLASSES, SKILL_TREE, SKILL_BRANCHES } from './data.js?v=24';
import { drawPortraitTo, drawItemIconTo, drawFigureTo, cam, mountPalOf } from './render.js?v=24';
import { LOCATIONS, locAt, nearestLocations, TS, MAPS, TOWN_PLAN, townAt, DUNGEONS, HOUSES } from './world.js?v=24';
import { wearOf } from './buildings.js?v=24';
import * as SP from './sprites.js?v=24';   /* Bestiarium: Gegnerbilder */
import { townState, townPrice } from './sim.js?v=24';
import { GOODS } from './data.js?v=24';
import { target as ecoTarget } from './economy.js?v=24';
import { PARTS, PART_NAME, partState, buildOf, BUILDS, MECH_Q, MECH_MOD, EYE_Q, barOf } from './body.js?v=24';
import { sfx, ambience } from './sfx.js?v=24';
import * as SKY from './sky.js?v=24';   /* Klassen und Talente, Scheibe 2: Sternenhimmel */
import * as ATL from './atlas.js?v=24';   /* Karte Scheibe 1: Ortskarte-Panel bekommt das gezeichnete Ortssymbol (drawLocIcon) */

export let A = {};
// Wettersymbole: eigene Strichzeichnungen, eine Linienstärke
const ico = d => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#b8ac93" stroke-width="1.2" stroke-linecap="round">${d}</svg>`;
const WEATHER_ICON = {
  clear: ico('<circle cx="8" cy="8" r="3"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/>'),
  cloudy: ico('<path d="M4.5 12h7.5a2.8 2.8 0 0 0 .3-5.6A3.8 3.8 0 0 0 5 6.8 2.6 2.6 0 0 0 4.5 12z"/>'),
  rain: ico('<path d="M4.5 9h7.5a2.6 2.6 0 0 0 .3-5.2A3.6 3.6 0 0 0 5 4.2 2.4 2.4 0 0 0 4.5 9z"/><path d="M5.5 11l-.8 2.5M8.5 11l-.8 2.5M11.5 11l-.8 2.5"/>'),
  fog: ico('<path d="M2 5.5h12M3.5 8.5h9M2 11.5h12"/>'),
  bloodrain: ico('<path d="M4.5 9h7.5a2.6 2.6 0 0 0 .3-5.2A3.6 3.6 0 0 0 5 4.2 2.4 2.4 0 0 0 4.5 9z"/><path d="M5.5 11v2.5M8.5 11v2.5M11.5 11v2.5" stroke="#a03030"/>'),
  sandstorm: ico('<path d="M2 5h9M4 8h10M2 11h8"/>'),
  snow: ico('<path d="M8 2v12M2.8 5l10.4 6M2.8 11l10.4-6"/>'),
};                        // Aktionen aus game.js
// Koop: diese Knöpfe verändern die eigene Figur; beim Gast gehen sie an den Host (uiHooks.act), der sie mit der Gastfigur ausführt
const ROUTED = ['setClass', 'setTitleClass', 'learnNode'];
let RAW = {};
export const uiRaw = n => RAW[n];
export function bind(actions) { A = actions; RAW = { ...actions }; for (const k of ROUTED) if (typeof RAW[k] === 'function') A[k] = (...a) => uiHooks.act?.(k, a) ? undefined : RAW[k](...a); }
const $ = id => document.getElementById(id);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

// UI-Umbau Scheibe 1 (Entwickler 01.10.2026): 8 Gruppen mit Piktogramm statt 14 Textreitern; Unterthemen als Reiter im Fenster.
// [Gruppe, Name (Tooltip), Taste, Fenster der Gruppe — das erste öffnet der Reiter]. Optionen bleiben als Reiter (Touch ohne Esc).
const NAV = [
  ['char', 'Charakter', 'C', ['character', 'skills', 'spells', 'effects', 'classes']]   /* Entwickler 02.10.2026: Talentbäume versteckt, bis jede Klasse ihren eigenen Baum hat (Punkte sammeln sich weiter) */, ['inv', 'Gepäck', 'I', ['inventory']],
  ['party', 'Gruppe', 'G', ['party', 'stable']], ['build', 'Lager & Siedlung', 'B', ['settlement', 'business']], ['map', 'Karte', 'M', ['map']],
  ['quest', 'Aufträge', 'J', ['quests']], ['powers', 'Mächte', 'F', ['faction', 'chronicle']], ['codex', 'Kodex', 'H', ['codex']], ['options', 'Optionen', 'Esc', ['settings']],
];
const NAV_SHORT = { char: 'Charakter', inv: 'Inventar', party: 'Gruppe', build: 'Siedlung', map: 'Karte', quest: 'Aufträge', powers: 'Mächte', codex: 'Kodex', options: 'Optionen' };
const SUBTAB = { settlement: 'Lager (B)', business: 'Betriebe', character: 'Werte (C)', skills: 'Talente (T)', spells: 'Zauber (Z)', effects: 'Effekte (X)', faction: 'Fraktionen (F)', chronicle: 'Chronik (K)' };
// Pixel-Piktogramme (icons.js, Artist). Fehlt die Datei noch, bleibt die Schrift — nichts bricht.
let ICO = null;
const pico = (k, s = 2) => { try { return ICO?.iconURL?.(k, s) || ''; } catch (e) { return ''; } };
const icoImg = (k, s = 2, cls = 'ico') => { const u = pico(k, s); return u ? `<img class="${cls}" src="${u}" alt="">` : ''; };
function loadIcons() { import('./icons.js?v=24').then(m => { ICO = m; paintNav(); iconCss(); HUD_LAST.clear(); renderLog(); }).catch(() => {}); }
function paintNav() {
  for (const b of $('nav')?.children || []) { const G = NAV.find(n => n[0] === b.dataset.g); if (!G) continue; const u = pico('nav_' + G[0], 3);
    b.innerHTML = (u ? `<img class="navico" src="${u}" alt="">` : '') + `<span class="navlbl">${NAV_SHORT[G[0]] || G[1]}</span>` + (G[2] ? `<i>${G[2]}</i>` : '') + '<b class="dot"></b>'; }   /* Entwickler: größere Symbole, Beschriftung darunter */
}
function iconCss() {                                                   /* Protokoll-Zeichen als CSS-Hintergrund: nicht 90 Bilder je Neuaufbau */
  let st = $('ico-css'); if (!st) { st = document.createElement('style'); st.id = 'ico-css'; document.head.appendChild(st); }
  st.textContent = ['combat', 'party', 'world', 'quest', 'faction', 'economy', 'death'].map(c => { const u = pico('log_' + c, 1); return u ? `#log .lc-${c}{background-image:url(${u})}` : ''; }).join('\n');
}
const LOGCATS = ['Alle', 'Kampf', 'Gruppe', 'Welt', 'Quest', 'Fraktion', 'Handel'];
const CATKEY = { Alle:null, Kampf:'combat', Gruppe:'party', Welt:'world', Quest:'quest', Fraktion:'faction', Handel:'economy' };
let logFilter = null;

export function initUI() {
  const nav = $('nav');
  NAV.forEach(([g, label, key, wins]) => {
    const b = el('button', '', ''); b.dataset.g = g; b.title = `${label}${key ? ` (${key})` : ''}`;
    b.onclick = () => wins.includes(modalOpen) ? closeModal() : openModal(wins[0]);
    nav.appendChild(b);
  });
  paintNav(); loadIcons();
  const lf = $('log-filters');
  LOGCATS.forEach((c, i) => {
    const b = el('button', i === 0 ? 'on' : '', c);
    b.onclick = () => { logFilter = CATKEY[c]; [...lf.children].forEach(x => x.classList.remove('on')); b.classList.add('on'); logStick = true; renderLog(); };   /* neuer Filter: unten beginnen */
    lf.appendChild(b);
  });
  $('modal-close').onclick = closeModal;
  $('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  onLog(() => renderLog());
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('button')) sfx('ui'); });
  // Tooltips: title-Attribute werden abgefangen (kein Browser-Kasten) und als Pixel-Tafel gezeigt.
  const tip = el('div', 'tip'); tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip);
  const tipText = t => { const n = t.closest && t.closest('[title],[data-tip]');
    if (n && n.hasAttribute('title')) { n.dataset.tip = n.getAttribute('title'); n.removeAttribute('title'); } return n; };
  let cardFor = null;                                          /* P5: Gegenstände zeigen ihre Bildkarte (data-card + _card) statt einer Textzeile */
  const showCard = (c, x, y) => { const h = c._card?.(); if (!h) return false; if (cardFor !== c || !tip.classList.contains('on')) { tip.innerHTML = h; cardFor = c; }
    tip.classList.add('on', 'card'); paintIcons(tip); if (x != null) tip.style.transform = `translate(${Math.round(Math.max(6, Math.min(x - tip.offsetWidth / 2, innerWidth - tip.offsetWidth - 6)))}px,${Math.round(Math.max(6, y - tip.offsetHeight - 24))}px)`; return true; };
  document.addEventListener('mouseover', e => {
    const c = e.target.closest && e.target.closest('[data-card]');
    if (c && showCard(c)) return;
    cardFor = null; tip.classList.remove('card');
    const n = tipText(e.target), text = n && n.dataset.tip;
    if (!text) { tip.classList.remove('on'); return; }
    tip.textContent = text; tip.classList.add('on');
  });
  let lpT = 0;                                                 /* Touch: langes Drücken zeigt die Karte, Loslassen schließt sie */
  document.addEventListener('pointerdown', e => { tip.classList.remove('on'); cardFor = null; if (e.pointerType !== 'touch') return; const c = e.target.closest && e.target.closest('[data-card]'); if (!c) return;
    clearTimeout(lpT); lpT = setTimeout(() => showCard(c, e.clientX, e.clientY), 420); });
  document.addEventListener('pointerup', e => { clearTimeout(lpT); if (e.pointerType === 'touch') setTimeout(() => tip.classList.remove('on'), 900); });
  document.addEventListener('mousemove', e => { if (!tip.classList.contains('on')) return;
    const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 6), y = Math.min(e.clientY + 18, innerHeight - tip.offsetHeight - 6);
    tip.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`; });
  document.addEventListener('mouseout', e => { const r = e.relatedTarget; if (!r || !(tipText(r) || (r.closest && r.closest('[data-card]')))) { tip.classList.remove('on'); cardFor = null; } });
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && $('findcard')?.classList.contains('on')) { closeFind(); e.stopImmediatePropagation(); e.preventDefault(); } }, true);   /* Fund-Karte: Esc schließt nur sie */
  renderHotbar();
}

// ---------------- HUD ----------------
function bar(label, val, max, cls, extra = '') {
  return `<div class="bar"><div class="bar-label"><span>${label}</span><span>${Math.ceil(val)}/${Math.ceil(max)}${extra}</span></div>
    <div class="bar-track"><div class="bar-fill ${cls}" style="transform:scaleX(${clamp(val / max, 0, 1)})"></div></div></div>`;
}

let hudFor = null;                                                  /* Koop K2: der Gast sieht die Werte seiner Gastfigur statt des Helden */
export function setHudTarget(m) { hudFor = m; }
// Audit D16: das HUD schreibt nur, was sich geändert hat (vorher alle 180 ms jedes innerHTML neu: Umbruch und Neuzeichnen in Städten).
const HUD_LAST = new Map();
function hudSet(id, v, html) { const k = id + (html ? '#h' : '#t'); if (HUD_LAST.get(k) === v) return; HUD_LAST.set(k, v); if (html) $(id).innerHTML = v; else $(id).textContent = v; }
export function refreshHUD() {
  const p = hudFor || S.player; if (!p) return;
  hudSet('pc-name', p.name);
  const TT = p.titleClass && TITLE_CLASSES[p.titleClass];
  hudSet('pc-class', `Stufe ${p.level} · ${CLASSES[p.currentClass].name}${TT ? ' · ' + TT.name : ''}${p.attrPoints > 0 || p.skillPoints > 0 ? ' ✦' : ''}`);   // S15 (Nutzer): freie Punkte sichtbar — UI-Umbau: als Goldpunkt am Reiter Charakter
  { const free = [p.attrPoints > 0 ? `${p.attrPoints} Statpunkt${p.attrPoints > 1 ? 'e' : ''} frei` : '', p.skillPoints > 0 ? `${p.skillPoints} Talentpunkt${p.skillPoints > 1 ? 'e' : ''} (T)` : ''].filter(Boolean).join(' · '), nb = $('nav')?.querySelector('[data-g="char"]');
    if (nb && nb.dataset.free !== free) { nb.dataset.free = free; nb.classList.toggle('badge', !!free); nb.title = free ? `Charakter (C) — ${free}` : 'Charakter (C)'; $('pc-class').title = free; } }
  const fr = topRank(p);
  hudSet('pc-rank', fr || 'Ohne Banner');
  drawPortraitTo($('pc-portrait'), p);
  let html = bar('Leben', ...barOf(p), 'hp') + bar('Ausdauer', p.stamina, p.maxStamina, 'sta');
  if (p.maxMana > 0) html += bar('Mana', p.mana, p.maxMana, 'mana');
  if (TT) html += bar(TT.resource.name, A.tres(p), TT.resource.max, TT.resource.css);   // Ressource der Titelklasse
  html += bar('Erfahrung', p.xp, p.xpNext, 'xp', p.level >= 60 ? ' · Höchststufe' : '');   // Balance-Runde: Höchststufe 60 (game.js MAX_LEVEL)
  hudSet('pc-bars', html, true);
  hudSet('pc-status', statusIcons(p), true);
  if (!$('pc-status').dataset.fx) { $('pc-status').dataset.fx = 1; $('pc-status').addEventListener('mouseover', fxTip); $('pc-status').addEventListener('mouseleave', () => $('fx-tip')?.classList.add('hidden'));
    $('pc-status').addEventListener('click', e => { if (e.target.closest('[data-fx]')) openModal('effects'); });
    if (!$('fx-tip')) { const d = document.createElement('div'); d.id = 'fx-tip'; d.className = 'hidden'; document.body.appendChild(d); } }
  const worst = PARTS.filter(k => partState(p.body[k]) !== 'heil').map(k => `${PART_NAME[k]} <em>${STATE_WORD[partState(p.body[k])]}</em>`);
  hudSet('pc-body', bodyChart(p) + `<div class="pc-wounds">${worst.join('<br>') || 'Keine Wunden'}</div>`, true);
  // Gruppe
  const mem = partyMembers();
  hudSet('party-title', `GRUPPE ${mem.length} / ${p.partyCap}`);
  const list = $('party-list'), sig = mem.map(m => [m.id, m.name, m.level, m.currentClass, m.downed ? 1 : 0, Math.round(m.morale), Math.round(m.loyal ?? 50), m.friend ? 1 : 0, Math.round(m.hp / m.maxHp * 50),
    Object.values(m.equip || {}).map(i => i?.key || '').join('.')].join(',')).join('|');
  if (HUD_LAST.get('party') !== sig || !list.childElementCount) { HUD_LAST.set('party', sig); list.innerHTML = '';
  if (!mem.length) list.appendChild(el('div', 'cr-desc', 'Du reist allein.'));
  for (const m of mem) {
    const d = el('div', 'member' + (m.downed ? ' downed' : ''));
    const cv = el('canvas'); cv.width = cv.height = 34;
    d.appendChild(cv);
    d.appendChild(el('div', '', `<div class="m-name">${m.name}</div>
      <div class="m-sub">St. ${m.level} ${CLASSES[m.currentClass].name} · Moral ${Math.round(m.morale)}${m.coopHero ? '' : ` · Loyalität ${Math.round(m.loyal ?? 50)}${m.friend ? ' ♥' : ''}`}</div>
      <div class="m-bar"><div style="width:${clamp(barOf(m)[0] / barOf(m)[1] * 100, 0, 100)}%"></div></div>`));
    d.onclick = () => { A.select(m); };
    list.appendChild(d);
    drawPortraitTo(cv, m);
  } }
  hudSet('res-list', [['wood', 'Holz', S.res.wood], ['stone', 'Stein', S.res.stone], ['iron', 'Eisen', S.res.iron],
    ['herb', 'Kraut', S.res.herb], ['food', 'Nahrung', A.provisions ? Math.round(A.provisions() * 10) / 10 : S.res.food], ['gold', 'Gold', S.gold]]
    .map(([i, k, v]) => { const im = icoImg('res_' + i, 2, 'resico'); return `<span title="${k}" class="${im ? 'hasico' : ''}">${im || k}<b>${Math.floor(v)}</b></span>`; }).join(''), true);   /* UI-Umbau: Piktogramm + Zahl */
  // Kopfzeile
  hudSet('clock-time', `Tag ${S.day} · ${timeStr()} · ${SEASONS[seasonOf()]}`);   // S15 Fehlersuche: S.season blieb ewig „Später Frühling“
  if ($('clock-time').title !== `Jahr ${year()}`) $('clock-time').title = `Jahr ${year()}`;   /* UI-Umbau: Zeit, Wetter, Jahr stehen nur noch oben */
  if ($('clock-weather').dataset.w !== S.weather) { $('clock-weather').dataset.w = S.weather; $('clock-weather').innerHTML = icoImg('w_' + (S.weather === 'sandstorm' ? 'heat' : S.weather), 2, 'wico') || WEATHER_ICON[S.weather] || WEATHER_ICON.clear; $('clock-weather').title = ({ clear:'Klar', cloudy:'Bewölkt', rain:'Regen', fog:'Nebel', snow:'Schnee', sandstorm:'Sandsturm', bloodrain:'Blutregen' }[S.weather] || S.weather) + (A.wxText?.() ? ' — ' + A.wxText() : ''); }   /* Roadmap C.12: Wirkung im Tooltip */
  goldShow(S.gold);   /* Q8-5: Gold zählt hoch */
  paintWarn();   /* UI-Scheibe 4: Warnchip */
  questWatch();   /* Q-1: Brief mit Siegel bei Abschluss/Scheitern */
  paintTracker();   /* Q-4: Tracker */
  renderHotbar();
}

function topRank(p) {
  let best = null;
  for (const f of ['order', 'valen', 'undead']) {
    const r = S.ranks[f];
    if (r >= 0) { const n = FACTIONS[f].ranks[Math.min(r, FACTIONS[f].ranks.length - 1)]; if (!best) best = `${n} · ${FACTIONS[f].name}`; }
  }
  return best;
}

// S13 (Nutzer: Hinweise auf aktive Effekte): Symbolleiste unter den Balken, Maus drüber = Name und Wirkung; alles im Fenster „Effekte“ (X)
let fxList = [];
function statusIcons(p) {
  fxList = A.effects ? A.effects() : [];
  const hud = fxList.map((f, i) => [f, i]).filter(([f]) => f.hud);
  return hud.map(([f, i]) => `<span class="fx-ic k-${f.kind}" data-fx="${i}">${f.icon}</span>`).join('') + (fxList.length ? `<span class="fx-ic k-more" data-fx="all" title="Alle Effekte (X)">…</span>` : '');
}
function fxTip(ev) {
  const t = ev.target.closest?.('[data-fx]'), tip = $('fx-tip'); if (!tip) return;
  if (!t || t.dataset.fx === 'all') { tip.classList.add('hidden'); return; }
  const f = fxList[+t.dataset.fx]; if (!f) return;
  tip.innerHTML = `<b class="k-${f.kind}">${f.icon} ${f.name}</b><small>${f.g}</small>${f.lines.map(l => `<div>${l}</div>`).join('')}`;
  tip.classList.remove('hidden'); const r = t.getBoundingClientRect(); tip.style.left = Math.min(innerWidth - 300, r.left) + 'px'; tip.style.top = (r.bottom + 6) + 'px';
}
function effectsUI(body) {
  const L = A.effects ? A.effects() : [], groups = {};
  for (const f of L) (groups[f.g] ||= []).push(f);
  body.innerHTML = Object.keys(groups).length ? `<div class="fx-grid">${Object.entries(groups).map(([g, fs]) => `<div class="fx-group"><h3>${g}</h3>${fs.map(f =>
    `<div class="fx-row"><span class="fx-ic k-${f.kind}">${f.icon}</span><div><b>${f.name}</b>${f.lines.map(l => `<div class="ledger">${l}</div>`).join('')}</div></div>`).join('')}</div>`).join('')}</div>`
    : '<div class="ledger">Keine besonderen Effekte. Du bist ein unbeschriebenes Blatt.</div>';
}

// S13 (Nutzer: „Codex/Handbuch im Spiel“): Taste H. Das Handbuch ist docs/GUIDE.md selbst (eine Quelle für Spieler und Doku; ohne ?dev
// ohne den Debug-Abschnitt), dazu alle Rangfolgen, alle Zustände mit Erklärung und die Gegner, die man schon getroffen hat. Suche filtert.
let guideMd = null, codexTab = 'guide';
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inl = t => esc(t).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/`(.+?)`/g, '<code>$1</code>');
export function mdToHtml(md) {
  const out = []; let list = false, table = false;
  const close = () => { if (list) out.push('</ul>'); if (table) out.push('</table>'); list = table = false; };
  for (const raw of md.split('\n')) {
    const l = raw.trimEnd(), t = l.trim();
    if (/^\|[\s|:-]+\|$/.test(t)) continue;                                  // Tabellen-Trennzeile
    if (t.startsWith('|')) { if (!table) { close(); out.push('<table class="rank-tab">'); table = true; } out.push('<tr>' + t.slice(1, -1).split('|').map(c => `<td>${inl(c.trim())}</td>`).join('') + '</tr>'); continue; }
    const li = /^(\s*)(?:[-*]|\d+\.)\s+(.*)$/.exec(l);
    if (li) { if (!list) { close(); out.push('<ul>'); list = true; } out.push(`<li style="margin-left:${li[1].length * 7}px">${inl(li[2])}</li>`); continue; }
    close();
    const h = /^(#{1,3})\s+(.*)$/.exec(t);
    if (h) out.push(`<h${h[1].length + 1}>${inl(h[2])}</h${h[1].length + 1}>`);
    else if (t === '---') out.push('<hr>');
    else if (t) out.push(`<p>${inl(t)}</p>`);
  }
  close(); return out.join('');
}
function guideSections(md) {                                               // nach „## “ geteilt; Debug-Abschnitt nur mit ?dev
  const parts = md.split(/\n(?=## )/), dev = /[?&]dev/.test(location.search);
  return parts.filter(p => dev || !/^## \d+\. Zum Ausprobieren/.test(p));
}
// S15 (Nutzer): Kapitel des Handbuchs öffnen sich im Spiel; der Code im Kodex schaltet alles frei
function guideLock(sec) {
  if (S.flags?.codexAll) return null; const h = sec.split('\n')[0];
  if (/^## 8\./.test(h) && !S.flags.crimeSeen) return 'öffnet sich mit deinem ersten Kopfgeld.';
  if (/^## 10\./.test(h) && !(S.chronicle || []).some(c => ['war', 'legend', 'battle'].includes(c.kind))) return 'öffnet sich, wenn Großes in der Welt geschieht.';
  if (/^## 11\. Aurelion/.test(h) && !S.flags.visitAurel) return 'öffnet sich in Aurelion.';
  if (/^## 11b\./.test(h) && !S.ents?.isle?.some?.(e => e.visited) && !S.flags.seaSeen) return 'öffnet sich auf den Gischtinseln.';
  return null;
}
function codexUI(body) {
  const tabs = [['guide', 'Handbuch'], ['teachers', 'Lehrer'], ['magic', 'Magie'], ['ranks', 'Ränge'], ['states', 'Zustände'], ['foes', 'Gegner']];
  body.innerHTML = `<div class="codex-top">${tabs.map(([k, l]) => `<button class="txtbtn${k === codexTab ? ' active' : ''}" data-t="${k}">${l}</button>`).join('')}<input id="codex-q" placeholder="Suchen …"><input id="codex-code" placeholder="Code" style="width:90px"><button class="txtbtn" id="codex-go">Einlösen</button></div><div id="codex-body" class="codex"></div>`;
  const q = $('codex-q'), cb = $('codex-body');
  const render = () => {
    const needle = q.value.trim().toLowerCase(), hit = t => !needle || t.toLowerCase().includes(needle);
    if (codexTab === 'guide') {
      if (guideMd == null) { cb.innerHTML = '<div class="ledger">Lade das Handbuch …</div>'; fetch('docs/GUIDE.md').then(r => r.ok ? r.text() : Promise.reject()).then(t => { guideMd = t; render(); }).catch(() => { guideMd = ''; cb.innerHTML = '<div class="ledger">Das Handbuch liegt nicht bei (docs/GUIDE.md fehlt).</div>'; }); return; }
      const secs = guideSections(guideMd).map(s => { const lk = guideLock(s); return lk ? `${s.split('\n')[0]}\n\n*Noch unbekannt — ${lk}*\n` : s; }).filter(hit); cb.innerHTML = secs.length ? mdToHtml(secs.join('\n')) : '<div class="ledger">Nichts gefunden.</div>';   // S15: Kapitel öffnen sich im Spiel
    } else if (codexTab === 'magic') {                                     // S15 P5: Schulen, Zauber, Lehrer, Haltung der Mächte
      const SC = A.schools || {}, keys = A.spellKeys || [], p = S.player;
      const VIEW = Object.entries(A.magicView || {}).map(([f, v]) => [FACTIONS[f]?.name || f, v.say + (v.hate.length ? ` Verboten: ${v.hate.map(s => SC[s]?.name || (s === 'faith' ? 'Glaube' : s)).join(', ')} — wer das vor ihren Leuten wirkt, bekommt Kopfgeld.` : '')]);   // S15 P7: aus data.js MAGIC_VIEW
      cb.innerHTML = Object.entries(SC).filter(([s, S0]) => hit(S0.name + keys.filter(k => ABILITIES[k].school === s).map(k => ABILITIES[k].name).join(' '))).map(([s, S0]) =>
        `<h3 style="color:${S0.col}">${S0.name}</h3><table class="rank-tab">${keys.filter(k => ABILITIES[k].school === s).map(k => `<tr><td>${p.spells?.[k] ? '✓ ' : ''}${ABILITIES[k].name} <span class="ledger">(Stufe ${ABILITIES[k].tier})</span></td><td>${A.spellTeachers?.(k)?.join('<br>') || '<i>Niemand, den du kennst, lehrt das.</i>'}</td></tr>`).join('')}</table>`).join('')
        + `<h3>Wie die Mächte über Magie denken</h3>${VIEW.filter(([n, t]) => hit(n + t)).map(([n, t]) => `<div class="fx-row"><div><b>${n}:</b> ${t}</div></div>`).join('')}`;
    } else if (codexTab === 'teachers') {                                  // S15 (Nutzer: „ich finde den Krieger-Lehrer nicht“)
      const L0 = A.teacherList?.() || [], L = L0.filter(t => A.codexKnown('met', t.key)), rows = Object.entries(CLASSES).filter(([k]) => L.some(t => t.cls.includes(k))).filter(([k, C]) => hit(C.name + L.filter(t => t.cls.includes(k)).map(t => t.name + t.where).join(' ')));
      cb.innerHTML = `<div class="ledger">Ein Lehrer bildet dich erst aus, wenn er dich mag (Beziehung 20, bei Rook 40). Eine Folgeklasse braucht die Klasse davor. Auf der Karte (M) sind Lehrer gelb umrandet. Hier stehen nur Lehrer, mit denen du schon gesprochen hast${L0.length > L.length ? ` — ${L0.length - L.length} kennst du noch nicht` : ''}.</div>
        <table class="rank-tab">${rows.map(([k, C]) => `<tr><td>${C.name}${C.parent && C.parent !== 'wanderer' ? ` <span class="ledger">(braucht ${[C.parent, ...(C.alt || [])].map(a => CLASSES[a]?.name).join(' oder ')}${C.chainRank != null ? `, Kettenrang ${FACTIONS.chain?.ranks?.[C.chainRank] || C.chainRank}` : ''})</span>` : ''}</td><td>${L.filter(t => t.cls.includes(k)).map(t => `${t.name} — ${t.where}`).join('<br>')}</td></tr>`).join('')}</table>`;
    } else if (codexTab === 'ranks') {
      cb.innerHTML = Object.entries(FACTIONS).filter(([f, F]) => F.ranks && (S.flags.codexAll || (S.factions[f] || 0) !== 0 || (S.ranks[f] ?? -1) >= 0) && hit(F.name + F.ranks.join(' '))).map(([f, F]) => { const G = A.rankGuide?.(f); return G ? `<h3>${F.name}</h3><div class="ledger">${G.next || ''}</div><table class="rank-tab">${G.rows.map(x => `<tr class="r-${x.state}"><td>${x.name}</td><td>${x.need}</td><td>${x.perk}</td></tr>`).join('')}</table>` : ''; }).join('');
    } else if (codexTab === 'states') {
      const D = A.fxDesc || {}; cb.innerHTML = Object.entries(D).filter(([k, d]) => A.codexKnown('states', k) && hit(k + d)).map(([k, d]) => `<div class="fx-row"><div>${d}</div></div>`).join('') || '<div class="ledger">Nichts gefunden.</div>';
    } else {
      const seen = S.seenFoes || {}, list = Object.entries(MONSTERS).filter(([k]) => seen[k] && hit(MONSTERS[k].name));
      cb.innerHTML = list.length ? list.map(([k, m]) => `<div class="fx-row beast-row"><canvas class="beast-pic" data-mt="${k}" width="72" height="72"></canvas><div><b>${m.name}</b>${m.role ? ` · ${m.role}` : ''}${m.faction ? ` · ${FACTIONS[m.faction]?.name || m.faction}` : ''}<div class="ledger">Erschlagen: ${seen[k]}${m.lore ? ` · ${m.lore}` : ''}</div></div></div>`).join('')
        : '<div class="ledger">Hier stehen die Gegner, die du schon erschlagen hast.</div>';
      cb.querySelectorAll('canvas[data-mt]').forEach(c => drawMonsterTo(c, c.dataset.mt));   /* Scout #8: Bestiarium mit Bild */
    }
  };
  body.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { codexTab = b.dataset.t; codexUI(body); });
  $('codex-go').onclick = () => { if (A.codexCode($('codex-code').value)) { toast('KODEX VOLLSTÄNDIG FREIGESCHALTET', 2600); codexUI(body); } else toast('Unbekannter Code', 1500); };   // S15
  q.oninput = render; render();
}

// ---------------- Stall (S15) ----------------
// Pferde als Karten: Bild, Werte als Balken, Preis; mit eigenem Pferd wird eingetauscht (40 % Anrechnung).
// ---------------- Prothesen-Werkbank (GUI, 03.10.2026) ----------------
// Links ein Körperschema: vier Glieder und das Auge, Farbe nach Zustand (Fleisch grau, Messing gold, beschädigt rot); rechts Zustand,
// Aufrüstung und die Aktionen (dieselben wie im Gespräch). Aktionen mit Rückfrage (Ersetzen, Auge) öffnen das Gespräch.
function mechUI(body, npc) {
  const V = A.mechView(npc); if (!V) return;
  const col = q => !q.mech ? (q.lost ? '#3a2a24' : '#7a6a58') : q.cond < 30 ? '#b0453a' : q.cond < 70 ? '#c9a45a' : '#e0c27a';
  const limb = (q, x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${col(q)}" stroke="#14100b" stroke-width="2"><title>${q.name}</title></rect>`;
  const P = Object.fromEntries(V.parts.map(q => [q.k, q]));
  const svg = `<svg viewBox="0 0 120 200" class="mech-fig"><circle cx="60" cy="24" r="16" fill="#7a6a58" stroke="#14100b" stroke-width="2"/>
    ${V.eye ? `<circle cx="66" cy="22" r="4" fill="${V.eye.cond < 30 ? '#b0453a' : '#7fe0ff'}"/>` : ''}<rect x="40" y="44" width="40" height="66" rx="6" fill="#6a5a4a" stroke="#14100b" stroke-width="2"/>
    ${limb(P.larm, 20, 46, 16, 64)}${limb(P.rarm, 84, 46, 16, 64)}${limb(P.lleg, 42, 112, 16, 76)}${limb(P.rleg, 62, 112, 16, 76)}</svg>`;
  const row = q => `<div class="mech-row"><b>${q.name}</b> ${q.lost && !q.mech ? '<span class="bad">fehlt</span>' : q.mech ? `Prothese Stufe ${q.mech}${q.up ? ` · Aufrüstung ${q.up}` : ''}` : 'Fleisch'}
    ${q.mech ? `<div class="bst-bar"><i style="width:${q.cond}%;background:${col(q)}"></i></div><span class="ledger">Zustand ${q.cond} %${q.cond < 30 ? ' — beschädigt, wirkungslos' : ''}</span>` : ''}</div>`;
  body.innerHTML = `<div class="ledger">${qa(V.title)} · Dein Gold: ${V.gold}</div><div class="mech-wrap">${svg}<div class="mech-info">${V.parts.map(row).join('')}
    ${V.eye ? `<div class="mech-row"><b>Auge</b> ${qa(V.eye.name)} (Stufe ${V.eye.q})<div class="bst-bar"><i style="width:${V.eye.cond}%;background:${V.eye.cond < 30 ? '#b0453a' : '#7fe0ff'}"></i></div><span class="ledger">Zustand ${V.eye.cond} %</span></div>` : ''}
    <div class="ledger">${qa(V.priceLine)}${V.scope ? '<br>' + qa(V.scope) : ''}</div></div></div>
    <div class="tr-sec">Was die Werkbank kann</div><div class="mech-acts">${V.opts.map((o, i) => `<button data-mo="${i}">${qa(o.text)}</button>`).join('') || '<div class="ledger">Hier gibt es für dich gerade nichts zu tun.</div>'}</div>`;
  body.querySelectorAll('[data-mo]').forEach(b => b.onclick = () => { const o = V.opts[+b.dataset.mo]; o.fn?.(); if (dialogueOpen()) closeModal(); else if (modalOpen === 'mech') mechUI(body, npc); });
}
// ---------------- Tierhändler (GUI, 03.10.2026) ----------------
function beastsUI(body, npc) {
  const I = A.beastInfo(), bar = (v, max, col) => `<div class="bst-bar"><i style="width:${Math.min(100, v / max * 100)}%;background:${col}"></i></div>`;
  const card = w => `<div class="bst-card${I.pet ? ' off' : ''}"><canvas data-m="${w.m}" width="96" height="72"></canvas><b>${w.name}</b>
    <div class="ledger">Leben ${w.hp}${bar(w.hp, 60, '#b0453a')}Biss ${w.dmg}${bar(w.dmg, 12, '#c9a45a')}Tempo ${w.speed.toFixed(2)}${bar(w.speed - 1, 0.8, '#7fae6e')}</div>
    <button data-buy="${w.m}" ${I.pet || I.gold < w.price ? 'disabled' : ''} class="${I.gold < w.price ? 'poor' : ''}">${w.price} Gold</button></div>`;
  body.innerHTML = `<div class="ledger">${npc?.name || 'Tierhändler'}: ${I.pet ? `„${I.pet.name} sieht gut aus. Ein zweites Tier? Das hält niemand lange durch.“` : '„Treu, ehrlich, beißt nur, wen du willst. Welches?“'} · Dein Gold: ${I.gold}</div>
    ${I.pet ? `<div class="tr-sec">Dein Begleiter</div><div class="bst-own"><canvas data-m="${I.pet.mtype}" width="96" height="72"></canvas><div><b>${I.pet.name}</b><div class="ledger">Leben ${I.pet.hp}/${I.pet.maxHp}${bar(I.pet.hp, I.pet.maxHp, '#b0453a')}</div>
      <button id="bst-free" class="txtbtn">${I.pet.name} freilassen</button></div></div>` : ''}
    <div class="tr-sec">Begleittiere${I.pet ? ' — erst, wenn dein Tier fort ist' : ''}</div><div class="bst-grid">${I.wares.map(card).join('')}</div>
    <div class="tr-sec">Reittiere</div><div class="ctx-actions"><button id="bst-stable">${I.mount ? `Reittiere ansehen (${I.mount.name} eintauschen)` : 'Reittiere ansehen'}</button>${I.mount?.mech ? `<button id="bst-oil">${I.mount.name} warten (1 Automatenkern)</button>` : ''}</div>
    ${I.farm ? `<div class="tr-sec">Für deinen Hof (${I.farm.cow + I.farm.sheep}/${I.farm.cap} Tiere auf der Weide)</div><div class="bst-grid">
      <div class="bst-card"><canvas data-m="cow" width="96" height="72"></canvas><b>Kuh</b><div class="ledger">Milch und Fleisch für die Siedlung</div><button data-farm="cow">70 Gold</button></div>
      <div class="bst-card"><canvas data-m="sheep" width="96" height="72"></canvas><b>Schaf</b><div class="ledger">Wolle und Fleisch für die Siedlung</div><button data-farm="sheep">40 Gold</button></div></div>` : ''}`;
  body.querySelectorAll('canvas[data-m]').forEach(cv => drawMonsterTo(cv, cv.dataset.m, 1));
  body.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { if (A.buyBeast(b.dataset.buy)) { sfx?.('coin'); closeModal(); } else beastsUI(body, npc); });
  body.querySelectorAll('[data-farm]').forEach(b => b.onclick = () => { A.buyFarmAnimal(b.dataset.farm); beastsUI(body, npc); });
  if ($('bst-free')) $('bst-free').onclick = () => { A.releasePet(); beastsUI(body, npc); };
  if ($('bst-oil')) $('bst-oil').onclick = () => { A.oilMount(); beastsUI(body, npc); };
  $('bst-stable').onclick = () => openModal('stable', npc);
}
function stableUI(body, npc) {
  if (!npc) { body.innerHTML = '<div class="ledger">Hier steht kein Stall.</div>'; return; }   /* HB2-11 */
  const offers = A.stableOffers(npc), cur = S.mount && A.mountStats(), credit = cur ? Math.round(A.horseValue(cur) * 0.4) : 0;
  const bar = (v, max, col) => `<div style="height:5px;background:#2a2418;margin:2px 0 6px"><div style="height:100%;width:${Math.min(100, v / max * 100)}%;background:${col}"></div></div>`;
  body.innerHTML = `<div class="ledger">${npc.name}: ${offers.length ? 'Das hier steht diese Woche im Stall.' : 'Diese Woche ist alles verkauft. Komm nächste Woche wieder.'} Dein Gold: ${S.gold}.${cur ? ` Dein ${cur.name} wird mit ${credit} Gold angerechnet.` : ''}</div>
    <div class="sheet" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr));margin-top:10px">${offers.map(H => `<div class="panel" style="padding:10px">
      <canvas data-h="${H.id}" width="150" height="100" style="width:150px;height:100px;image-rendering:pixelated;display:block;margin:0 auto"></canvas>
      <b>${H.name}</b><div class="ledger">Tempo ${Math.round(H.tempo * 100)} %${bar(H.tempo - 0.85, 0.4, '#c9a45a')}Ausdauer ${H.staminaMax}${bar(H.staminaMax, 160, '#7fae6e')}Mut ${H.mut}${H.mut >= 70 ? ' (kommt im Kampf)' : ''}${bar(H.mut, 100, '#b86a4a')}</div>
      <div class="ctx-actions"><button data-buy="${H.id}">${cur ? `Eintauschen — ${Math.max(0, H.price - credit)} Gold` : `Kaufen — ${H.price} Gold`}</button></div></div>`).join('')}</div>`;
  // Pferde-Überarbeitung (02.10.2026): echte Fellfarbe (H.coat) statt zufälliger Namenslänge — das Porträt zeigt dasselbe Pferd wie draußen im Spiel.
  for (const H of offers) { const cv = body.querySelector(`[data-h="${H.id}"]`); if (!cv) continue; import('./sprites.js?v=24').then(SP => { const f = SP.beastFrame('horse', mountPalOf(H.kind, H.coat), 'W', '', 1);
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(f, (150 - f.width * 2.4) / 2, 100 - f.height * 2.4, f.width * 2.4, f.height * 2.4); }); }
  body.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { if (A.buyHorse(npc, b.dataset.buy)) closeModal(); else stableUI(body, npc); });
}

// ---------------- Anschlagbrett (GUI, 08.10.2026) ----------------
// Holzbrett mit angepinnten Zetteln: Art-Symbol, Titel, Text, Ziel, Lohn, Frist, Entfernung. Kopfgelder mit Totenkopf. Annehmen/Abgeben direkt.
function boardUI(body, town) {
  const V = A.boardView?.(town); if (!V) return;
  const card = it => `<div class="bb-note${it.elite ? ' elite' : ''}${it.state === 'active' ? ' mine' : ''}"><i class="bb-pin"></i>
    <div class="bb-top">${icoImg(it.ico, 2, 'bb-ico')}<b>${qa(it.title)}</b>${it.elite ? '<span class="bb-skull" title="Gefährlicher Anführer">☠</span>' : ''}</div>
    <div class="bb-kind">${qa(it.kindName)}${it.dist != null ? ` · ${it.dist} Felder` : ''}${it.days ? ` · ${it.days} Tag${it.days === 1 ? '' : 'e'}` : ''}</div>
    <p class="bb-desc">${qa(it.desc || '')}</p>
    <div class="bb-obj">${it.state === 'active' ? `<i class="qb-chk">${it.ready ? '☑' : '☐'}</i>` : ''}${qa(it.objText)}${it.state === 'active' ? ` <span class="ledger">${it.have}/${it.need}</span>` : ''}</div>
    <div class="bb-foot"><span class="bb-rew">${rewardHTML(it.rew, true)}</span>${it.state === 'offer' ? `<button class="mini" data-acc="${it.id}">Annehmen</button>` : it.ready ? `<button class="mini" data-claim="${it.id}">Abgeben</button>` : '<span class="ledger">läuft</span>'}</div></div>`;
  body.innerHTML = `<div class="bb-head"><b>Anschlagbrett — ${qa(V.name)}</b><span class="ledger">${V.active}/${V.max} Aufträge angenommen</span></div>
    ${V.shut ? `<div class="bb-shut">${qa(V.shut)}</div>` : ''}
    <div class="bb-board">${V.items.length ? V.items.map(card).join('') : '<div class="bb-empty">Heute hängt hier nichts. Morgen wieder.</div>'}</div>
    ${V.invest ? `<div class="ctx-actions"><button id="bb-invest">In die Stadt investieren …</button></div>` : ''}`;
  paintIcons(body);
  body.querySelectorAll('[data-acc]').forEach(b => b.onclick = () => { const r = A.boardAct(town, b.dataset.acc, 'accept'); if (r) toast(r); else sfx('coin', 0.3, 0.5); boardUI(body, town); });
  body.querySelectorAll('[data-claim]').forEach(b => b.onclick = () => { const r = A.boardAct(town, b.dataset.claim, 'claim'); if (r) toast(r); else sfx('coin', 0.6, 0.7); boardUI(body, town); });
  if ($('bb-invest')) $('bb-invest').onclick = () => A.boardInvest(town);
}
// ---------------- Heiler (GUI, 03.10.2026) ----------------
// Je Gruppenmitglied eine Karte: Leben, sechs Glieder als Balken (gebrochen rot, geschient gelb, fehlend grau), Zustände; unten die beiden
// Behandlungen als Knöpfe. Heilen läuft wie im Gespräch als Kanal (3,5 s) und schließt das Fenster.
function healerUI(body, npc) {
  const V = A.healerView?.(npc); if (!V) return;
  const col = q => q.lost ? '#3a3230' : q.mech ? '#c9a45a' : q.broken ? (q.splinted ? '#c9a45a' : '#b0453a') : q.hp < q.max * 0.5 ? '#c07040' : '#7fae6e';
  const card = c => `<div class="hl-card${c.hurt || c.splint ? '' : ' off'}"><b>${qa(c.name)}</b> <span class="ledger">Leben ${c.hp}/${c.max}</span><div class="bst-bar"><i style="width:${c.max ? c.hp / c.max * 100 : 0}%;background:#b0453a"></i></div>
    <div class="hl-parts">${c.parts.map(q => `<div title="${qa(q.name)}: ${q.lost ? 'fehlt' : q.mech ? 'Prothese (Werkbank)' : q.broken ? (q.splinted ? 'gebrochen, geschient' : 'GEBROCHEN') : `${q.hp}/${q.max}`}"><span class="ledger">${qa(q.name.replace('Linker ', 'L. ').replace('Rechter ', 'R. ').replace('Linkes ', 'L. ').replace('Rechtes ', 'R. '))}</span><div class="bst-bar"><i style="width:${q.max ? q.hp / q.max * 100 : 0}%;background:${col(q)}"></i></div></div>`).join('')}</div>
    ${c.status.length ? `<div class="ledger">Zustand: ${qa(c.status.join(', '))}</div>` : ''}</div>`;
  body.innerHTML = `<div class="ledger">${qa(V.title)}: „${V.wounded ? 'Zeig her. Das wird teuer, aber du behältst alles dran.' : 'Dir fehlt nichts. Komm wieder, wenn es blutet.'}“ · Dein Gold: ${V.gold}</div>
    <div class="hl-grid">${V.group.map(card).join('')}</div>
    <div class="tr-sec">Behandlung</div><div class="ctx-actions">
      <button id="hl-heal"${V.wounded && V.gold >= V.cost && !V.busy ? '' : ' disabled'}>Wunden versorgen — ${V.cost} Gold${V.wounded ? '' : ' (niemand verletzt)'}</button>
      <button id="hl-splint"${V.splint && V.gold >= V.splintCost ? '' : ' disabled'}>Brüche schienen, Wunden reinigen — ${V.splintCost} Gold${V.splint ? '' : ' (nichts zu schienen)'}</button></div>
    <div class="ledger">Heilen dauert ein paar Herzschläge; geschiente Brüche heilen doppelt so schnell. Fehlende Glieder ersetzt nur die Prothesenmacherin.</div>`;
  $('hl-heal').onclick = () => { const r = A.healerAct(npc, 'heal'); if (r) toast(r); else closeModal(); };
  $('hl-splint').onclick = () => { const r = A.healerAct(npc, 'splint'); if (r) toast(r); else sfx('coin', 0.4, 0.6); healerUI(body, npc); };
}
// ---------------- Zauber lernen (GUI, 03.10.2026) ----------------
// Fenster des Zauberlehrers: alle Formeln des Lehrers in Schulfarbe, Stufe, Mana, Preis; was fehlt, steht rot darunter; „Lehren“ ruft learnFrom.
function learnUI(body, npc) {
  const V = A.spellLearnView?.(npc); if (!V) return;
  const SC = A.schools || {};
  body.innerHTML = `<div class="ledger">${qa(V.title)}: „Welche Formel? Ein Zauber sitzt erst, wenn du ihn oft wirkst.“ · Gold ${V.gold} · Intelligenz ${V.int} · Beziehung ${V.rel}</div>
    <div class="codex-list">${V.list.map((s, i) => `<div class="fx-row spell-row${s.have ? ' off' : ''}"><div><b style="color:${SC[s.school]?.col || '#e0c27a'}">${qa(s.name)}</b> · Stufe ${['', 'I', 'II', 'III'][s.tier] || s.tier} · ${s.mana} Mana
      <div class="ledger">${qa(s.desc)}${s.have ? '' : s.lack.length ? `<br><span class="bad">Fehlt: ${qa(s.lack.join(', '))}</span>` : ''}</div></div>
      ${s.have ? '<span class="ledger">✓ kannst du</span>' : `<button data-learn="${i}"${s.lack.length ? ' disabled' : ''}>${s.price} Gold</button>`}</div>`).join('')}</div>`;
  body.querySelectorAll('[data-learn]').forEach(b => b.onclick = () => { const s = V.list[+b.dataset.learn]; if (A.learnFrom(npc, s.key)) { sfx('magic', 0.5, 0.7); toast(`${s.name} gelernt — im Zauberbuch (Taste Z) auf die Leiste legen.`, 3000); } learnUI(body, npc); });
}
// ---------------- Zauberbuch (S15 P4) ----------------
// Reiter je Schule. Bekannte Zauber: Rang, Kosten, Wirkung, Übung bis zum nächsten Rang, „Auf Leiste“. Unbekannte: wo man sie lernt.
let spellTab = 'fire';
function spellUI(body) {
  const p = S.player, SC = A.schools || {}, keys = A.spellKeys || [];
  body.innerHTML = `<div class="codex-top">${Object.entries(SC).map(([k, s]) => `<button class="txtbtn${k === spellTab ? ' active' : ''}" data-s="${k}" style="color:${s.col}">${s.name} ${keys.filter(q => ABILITIES[q].school === k && p.spells?.[q]).length}/${keys.filter(q => ABILITIES[q].school === k).length}</button>`).join('')}</div>
    <div class="ledger">Mana ${Math.round(p.mana || 0)}/${p.maxMana || 0}${p.maxMana ? '' : ' — ohne gelernten Zauber hast du kein Mana.'} · Ein Treffer in der Sammelzeit bricht den Zauber ab (halbes Mana zurück). Rang II nach 25, Rang III nach 100 Einsätzen.</div><div id="spell-list" class="codex"></div>`;
  $('spell-list').innerHTML = keys.filter(k => ABILITIES[k].school === spellTab).map(k => {
    const ab = ABILITIES[k], r = p.spells?.[k] || 0, n = p.spellUse?.[k] || 0, need = r === 1 ? 25 : r === 2 ? 100 : 0;
    const cost = `Stufe ${ab.tier} · ${ab.mana} Mana · ${(ab.cd / 1000).toFixed(1)} s Abklingzeit · ${ab.cast ? (ab.cast / 1000).toFixed(2) + ' s Sammeln' : 'sofort'}`;
    return r ? `<div class="fx-row spell-row"><div><b style="color:${SC[spellTab].col}">${ab.name}</b> · Rang ${['', 'I', 'II', 'III'][r]}<div class="ledger">${ab.desc}<br>${cost}</div>
        ${need ? `<div class="bar" style="height:4px;background:#2a2418;margin:4px 0"><div style="height:100%;width:${Math.min(100, n / need * 100)}%;background:${SC[spellTab].col}"></div></div><div class="ledger">Übung ${n}/${need}</div>` : '<div class="ledger">Gemeistert.</div>'}</div>
        <button class="txtbtn" data-bar="${k}">${p.hotbar?.some(s => s?.key === k) ? 'Auf der Leiste' : 'Auf Leiste legen'}</button></div>`
      : `<div class="fx-row spell-row" style="opacity:.55"><div><b>${ab.name}</b> · unbekannt<div class="ledger">${ab.desc}<br>${cost}<br>Lehrer: ${A.spellTeachers?.(k)?.join(', ') || ab.teach || 'unbekannt'}</div></div></div>`;
  }).join('');
  body.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { spellTab = b.dataset.s; spellUI(body); });
  body.querySelectorAll('[data-bar]').forEach(b => b.onclick = () => { A.spellToBar(b.dataset.bar); spellUI(body); });
}

// Scout #8 (Entwickler 01.10.2026): Gegnerbild für den Kodex — dieselben Raster wie im Spiel (Tier, Brocken, Menschengestalt)
const BEAST_KEYS = ['wolf', 'boar', 'bear', 'deer', 'wild_dog', 'bone_hound', 'cow', 'sheep', 'horse'];
function drawMonsterTo(cv, mt, seed = 2) {
  const m = MONSTERS[mt], c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, cv.width, cv.height);
  c.fillStyle = '#14110d'; c.fillRect(0, 0, cv.width, cv.height); if (!m || m.eye || mt === 'carrion_wing') return;
  try {
    const f = BEAST_KEYS.includes(mt) ? SP.beastFrame(mt, m.pal || {}, 'E', '', 1) : mt === 'gorak' ? SP.bruteFrame(m.pal || {}, 'E', '', 0) : SP.humanFrame(SP.monsterSpec({ kind: 'enemy', mtype: mt, seed }, m), 'S', 'i0');
    const k = Math.max(1, Math.floor(Math.min((cv.width - 4) / f.width, (cv.height - 4) / f.height)));
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(cv.width / 2 - f.width * k * 0.3, cv.height - 5, f.width * k * 0.6, 2);
    c.drawImage(f, Math.round((cv.width - f.width * k) / 2), cv.height - 3 - f.height * k, f.width * k, f.height * k);
  } catch (e) { /* unbekanntes Raster: leeres Bild */ }
}
// ---------------- Log ----------------
// Nutzer 01.10.2026: der Log sprang nach oben (alte Einträge sichtbar). Ob er unten „klebt“, entscheidet jetzt nur das Scrollen des
// Spielers (nicht die Höhe beim Neuaufbau, die bei verstecktem oder frisch gefülltem Kasten 0 ist); neu = unten, nach dem Layout.
let logStick = true;
function renderLog() {
  const box = $('log'); if (!box) return;
  if (!box._stick) { box._stick = true; box.addEventListener('scroll', () => { if (box.clientHeight) logStick = box.scrollTop + box.clientHeight >= box.scrollHeight - 24; }, { passive: true }); }
  box.innerHTML = S.log.filter(e => !logFilter || e.cat === logFilter).slice(-90)
    .map(e => `<div class="c-${e.cat}"><span class="lc lc-${e.cat}"></span><time>${e.t}</time>${e.text}</div>`).join('');
  let pill = $('log-new'); if (!pill) { pill = el('button', 'hidden', 'Neu ↓'); pill.id = 'log-new'; pill.onclick = () => { logStick = true; box.scrollTop = box.scrollHeight; pill.classList.add('hidden'); }; box.parentElement?.appendChild(pill);
    box.addEventListener('scroll', () => { if (logStick) pill.classList.add('hidden'); }, { passive: true }); }   /* UI-Umbau: hochgescrollt → Hinweis auf Neues */
  if (logStick) { box.scrollTop = box.scrollHeight; requestAnimationFrame(() => { if (logStick) box.scrollTop = box.scrollHeight; }); } else pill.classList.remove('hidden');
}

// ---------------- Kontextpanel ----------------
// Einwohner = wer tatsächlich dort lebt (Bewohner, Wachen, Figuren mit Namen) — nicht mehr die abstrakte Marktgröße,
// die in Nordfurt 90 zeigte, während 22 Menschen zu sehen waren.
/* PERF-S: das Infofeld läuft alle 180 ms; teure Zählungen über alle ~17 000 Einträge der Welt höchstens alle 1,5 s neu */
const CTX_MEMO = new Map();
const ctxMemo = (k, ms, f) => { const t = performance.now(), m = CTX_MEMO.get(k); if (m && t - m[0] < ms && t >= m[0]) return m[1]; const v = f(); CTX_MEMO.set(k, [t, v]); return v; };
function townHeads(key) { return ctxMemo('heads:' + key, 1500, () => townHeadsNow(key)); }
function townHeadsNow(key) {
  let n = 0; const ar = TOWN_PLAN[key]?.area;
  /* PERF-S: townAt nur, wenn der Anker im Gebiet dieser Stadt liegt (sonst kann townAt nie key liefern) — gleiches Ergebnis, ohne 1000× alle Städte durchzugehen */
  const inA = (x, y) => !ar || (x >= ar[0] && x <= ar[2] && y >= ar[1] && y <= ar[3]);
  for (const c of S.ents.world) if (c.kind === 'npc' && c.alive && !S.party.includes(c.id)
    && (c.homeTown === key || c.post === key || (!c.villager && !c.guard && !c.escort && !c.escortLost && c.anchor && inA(c.anchor.x / TS | 0, c.anchor.y / TS | 0) && townAt(c.anchor.x / TS | 0, c.anchor.y / TS | 0) === key))) n++;   // Karawanenwachen sind Reisende
  return n;
}
// S14: Haus, in dem oder direkt vor dessen Tür der Held steht — Name und Zweck je Typ
const HOUSE_INFO = { house: ['Wohnhaus', 'Hier leben Bewohner des Ortes.'], cottage: ['Kate', 'Kleines Wohnhaus, oft ein Hof am Rand.'], hall: ['Halle des Vorstehers', 'Versammlungen, Aufträge der Verteidigung.'],
  healer: ['Heilerhaus', 'Wunden versorgen, Tränke kaufen.'], smithy: ['Schmiede', 'Waffen, Rüstung, Reparatur. Tagsüber hämmert es.'], tavern: ['Schenke', 'Essen, Betten, Söldner, Gerüchte.'],
  barn: ['Scheune', 'Heu, Getreide, Vieh im Winter.'], bakery: ['Bäckerei', 'Brot für den Ort — frühmorgens duftet es.'], barracks: ['Kaserne', 'Wachen schlafen hier; die Nachtschicht hat frei.'],
  kontor: ['Kontor', 'Großhandel, Handelswagen, Betriebe kaufen.'], chapel: ['Kapelle', 'Gebet, Segen, Bestattungen.'], manor: ['Herrenhaus', 'Sitz einer vornehmen Familie.'],
  store: ['Lagerhaus', 'Vorräte des Ortes; mehr Lager heißt mehr Platz für Waren.'], stable: ['Stall', 'Pferde, Zugtiere, Fleisch und Felle.'], fisher: ['Fischerhütte', 'Netze, Boote, Fisch für den Markt.'],
  merc: ['Söldnerhaus', 'Klingen zum Mieten.'], palace: ['Palast', 'Sitz des Hohen Rates.'], court: ['Gericht', 'Das Heilige Gericht Aurelions.'], library: ['Bibliothek', 'Schriften, Karten, das Wissen des Hochreichs.'],
  academy: ['Akademie', 'Magitech und Gelehrsamkeit.'], observatory: ['Observatorium', 'Sterne, Himmelsrisse, der Rotfall.'], magitech: ['Magitech-Werkstatt', 'Prothesen, Kerne, Messingwaffen.'],
  markethall: ['Markthalle', 'Händler unter einem Dach.'], bank: ['Bank', 'Gold, Schuldscheine, Schuldknechtschaft.'], hospital: ['Hospital', 'Pflege für Arme und Soldaten.'], bathhouse: ['Badehaus', 'Dampf, Klatsch, Politik.'],
  factoryhall: ['Fabrikhalle', 'Werkbänke, Schuldknechte, Automaten.'], legion: ['Legionskaserne', 'Die Sonnenlegion Aurelions.'] };
function houseHere(tx, ty) {
  for (const b of HOUSES) if ((b.map || 'world') === S.map && tx >= b.x - 1 && tx <= b.x + b.w && ty >= b.y - 1 && ty <= b.y + b.h + 1) return b;
  return null;
}
export function renderContext(target) {
  const box = $('context'); if (!box) return;
  const p = S.player;
  if (!target) {
    const tx = Math.floor(p.x / TS), ty = Math.floor(p.y / TS);
    const here = locAt(tx, ty);
    const threat = here ? here.threat : 1;
    const tName = ['Sicher', 'Gering', 'Mittel', 'Hoch', 'Tödlich'][threat] || 'Mittel';
    const tCls = threat <= 1 ? 'threat-low' : threat === 2 ? 'threat-med' : 'threat-high';
    let h = `<div class="ctx-head">${DUNGEONS[S.map] ? DUNGEONS[S.map].name : (here ? here.name : 'Greenmark-Grenzland')}</div>
      <div class="ctx-sub">${DUNGEONS[S.map] ? 'Dungeon' : here ? ({ village:'Dorf', wild:'Wildnis', dungeon:'Dungeon', road:'Straße', ruin:'Ruine', camp:'Lager', shrine:'Schrein', city:'Stadt' })[here.kind] : 'Wildnis'}</div>
      <div class="ctx-line"><span>Gefahr</span><b class="${tCls}">${tName}</b></div>
      ${A.zoneRange ? (z => `<div class="ctx-line"><span>Gegnerstufen</span><b class="${z[0] > p.level + 2 ? 'threat-high' : z[1] < p.level - 3 ? 'threat-low' : 'threat-med'}">${z[0]}–${z[1]}</b></div>`)(A.zoneRange(S.map, tx, ty)) : ''}
`;   /* UI-Umbau: Wetter, Zeit, Jahreszeit, Jahr stehen in der Kopfleiste (vorher doppelt) */
    if (here && S.towns && S.towns[here.key]) {
      const t = S.towns[here.key], owner = S.war.nodes[here.key]?.owner;
      h += `<div class="ctx-block"><div class="ctx-sub">Stadt</div>
        <div class="ctx-line"><span>Lage</span><b>${townState(here.key)}</b></div>
        <div class="ctx-line"><span>Herrschaft</span><b>${owner ? FACTIONS[owner].name : 'frei'}</b></div>
        <div class="ctx-line"><span>Einwohner</span><b>${townHeads(here.key)}</b></div>` +
        ['grain', ...GOODS.filter(g => g !== 'grain' && (t.use[g] || 0) > 0.1 && t.stock[g] < ecoTarget(t, g) * 0.5).slice(0, 3)].map(g =>
          `<div class="ctx-line"><span>${ITEMS[g].name}</span><b>${townPrice(here.key, g, true)} Gold · ${Math.floor(t.stock[g])}</b></div>`).join('') + '</div>';   // S13: Getreide und die knappsten Waren
    } else if (S.war && S.map === 'world' && here && S.war.nodes[here.key]?.owner) {
      h += `<div class="ctx-line"><span>Herrschaft</span><b>${FACTIONS[S.war.nodes[here.key].owner].name}</b></div>`;
      if (TOWN_PLAN[here.key]) h += `<div class="ctx-line"><span>Einwohner</span><b>${townHeads(here.key)}</b></div>`;
    }
    const hb = houseHere(tx, ty);                                        // S14 (Nutzer, §20/§47): Gebäude-Infos im Infofeld
    if (hb) {
      const [nm, what] = HOUSE_INFO[hb.type] || ['Gebäude', ''], who = ctxMemo('who:' + hb.id, 1500, () => S.ents[hb.map || 'world'].filter(e => e.kind === 'npc' && e.alive && e.homeId === hb.id));
      h += `<div class="ctx-block"><div class="ctx-sub">Gebäude</div><div class="ctx-line"><span>${nm}</span><b>${['gepflegt', 'abgenutzt', 'verlassen'][wearOf(hb)] || ''}</b></div>`
        + (what ? `<div class="ctx-line q-sub"><span>${what}</span></div>` : '')
        + (who.length ? `<div class="ctx-line"><span>Hier wohnen</span><b>${who.slice(0, 3).map(e => e.name).join(', ')}${who.length > 3 ? ` +${who.length - 3}` : ''}</b></div>` : '') + '</div>';
    }
    if (S.map === 'world') {
      h += `<div class="ctx-block"><div class="ctx-sub">In der Nähe</div>` +
        nearestLocations(tx, ty, 5).map(({ l, d }) =>
          `<div class="ctx-line"><span>${l.name}</span><b>${d < 1 ? 'hier' : d * TS > 999 ? (d * TS / 1000).toFixed(1) + ' km' : Math.round(d * TS) + ' m'}</b></div>`).join('') + '</div>';
    }
    const q = Object.entries(S.quests).filter(([, v]) => v.state === 'active');
    if (q.length) {
      h += `<div class="ctx-block"><div class="ctx-sub">Aufträge</div>` + q.map(([k, v]) => {
        const Q = QUESTS[k];
        const I = A.questInfo ? A.questInfo(k) : {};   // S13: Ziel, Entfernung, Frist/Angriff
        return `<div class="ctx-line${I.tracked ? ' tracked' : ''}"><span>${I.tracked ? '◆ ' : ''}${Q.name}</span><b>${Q.objectives.map((o, i) => pips(v.progress[i] || 0, o.count || 1)).join(' ')}</b></div>`
          + (I.where || I.timer ? `<div class="ctx-line q-sub"><span>${I.where || ''}</span><b>${I.timer || ''}</b></div>` : '');
      }).join('') + '</div>';
    }
    if (box.__h !== h) { box.innerHTML = h; box.__h = h; }   /* PERF-S: DOM nur bei Änderung schreiben */
    return;
  }
  box.__h = null;
  if (target.kind === 'caravan') {
    box.innerHTML = `<div class="ctx-head">${target.name}</div><div class="ctx-sub">Eren — Nordfurt</div>
      ${bar('Zustand', target.hp, target.maxHp, 'hp')}
      <div class="ctx-line"><span>Richtung</span><b>${target.dir > 0 ? 'Nordfurt' : 'Eren'}</b></div>
      ${Object.entries(target.cargo || {}).map(([g, n]) => `<div class="ctx-line"><span>${ITEMS[g].name}</span><b>${n}</b></div>`).join('')}
      <div class="ctx-block ledger">Begleite sie bis ans Ziel. Überfälle unterwegs sind häufig.</div>`;
    return;
  }
  if (target.kind === 'enemy') {
    const m = MONSTERS[target.mtype];
    box.innerHTML = `<div class="ctx-head">${target.title || (target.vname ? target.vname + ' ' : target.elite ? 'Veteran: ' : '') + m.name}</div><div class="ctx-sub">${target.boss || m.boss ? 'Anführer' : target.elite ? 'Veteran — stärker als üblich' : 'Feind'}</div>
      <div class="ctx-line"><span>Stufe</span><b>${target.level}</b></div>
      ${bar('Leben', ...barOf(target), 'hp')}
      <div class="ctx-line"><span>Gefahr</span><b class="${m.threat >= 3 ? 'threat-high' : m.threat === 2 ? 'threat-med' : 'threat-low'}">${['','Gering','Mittel','Hoch','Tödlich'][m.threat]}</b></div>
      <div class="ctx-line"><span>Rüstung</span><b>${target.armor || 0}</b></div>
      <div class="ctx-line"><span>Fraktion</span><b>${FACTIONS[m.faction] ? FACTIONS[m.faction].name : 'Wild'}</b></div>`;
    return;
  }
  if (target.kind === 'npc') {
    const rel = S.relations?.[target.key] ?? target.rel ?? 0;
    const inParty = S.party.includes(target.id);
    box.innerHTML = `<div class="ctx-head">${target.name}</div><div class="ctx-sub">${target.prof}</div>
      <div class="ctx-line"><span>Alter</span><b>${target.age || '—'}</b></div>
      <div class="ctx-line"><span>Klasse</span><b>${CLASSES[target.currentClass].name}</b></div>
      <div class="ctx-line"><span>Fraktion</span><b>${target.faction ? FACTIONS[target.faction].name : 'Unabhängig'}</b></div>
      <div class="ctx-line"><span>Beziehung</span><b>${rel > 0 ? '+' : ''}${Math.round(rel)} · ${relLabel(rel)}</b></div>
      <div class="relbar"><i class="${rel >= 0 ? 'pos' : 'neg'}" style="width:${Math.abs(rel) / 2}%"></i></div>
      ${target.traits ? `<div class="ctx-block">${target.traits.map(t => `<span class="trait">${t}</span>`).join('')}</div>` : ''}
      ${(o => o.length ? `<div class="ctx-block q-sub">Bietet: ${o.join(' · ')}</div>` : '')(A.offers ? A.offers(target) : [])}
      <div class="ctx-actions">
        <button id="ctx-talk">Sprechen</button>
        ${target.shop ? '<button id="ctx-trade">Handeln</button>' : ''}
        ${target.smith ? '<button id="ctx-smith">Reparieren</button>' : ''}
        ${target.recruit && !inParty ? '<button id="ctx-recruit">Anwerben</button>' : ''}
        ${inParty ? '<button id="ctx-dismiss">Entlassen</button>' : ''}
      </div>`;
    const near = dist(S.player, target) < 70;
    $('ctx-talk').onclick = () => near ? A.talk(target) : toast('Zu weit entfernt');
    if ($('ctx-trade')) $('ctx-trade').onclick = () => near ? openModal('trade', target) : toast('Zu weit entfernt');
    if ($('ctx-smith')) $('ctx-smith').onclick = () => near ? A.repairAll(target) : toast('Zu weit entfernt');
    if ($('ctx-recruit')) $('ctx-recruit').onclick = () => near ? A.recruit(target) : toast('Zu weit entfernt');
    if ($('ctx-dismiss')) $('ctx-dismiss').onclick = () => A.dismiss(target);
    return;
  }
  if (target.kind === 'prop' || target.kind === 'grave' || target.kind === 'building') {
    const label = target.label || (target.def ? target.def.name : propName(target.type));
    box.innerHTML = `<div class="ctx-head">${label}</div><div class="ctx-sub">${target.kind === 'grave' ? 'Grab' : 'Objekt'}</div>
      ${target.epitaph ? `<div class="epitaph">${target.epitaph}</div>` : ''}
      ${target.def ? `<div class="ctx-line"><span>Zustand</span><b>${Math.round((target.cond ?? 1) * 100)}%</b></div>
        <div class="ctx-line"><span>Bau</span><b>${Math.round(target.built * 100)}%</b></div>` : ''}
      ${target.history ? `<div class="ctx-block"><div class="ctx-sub">Geschichte</div>${target.history.map(h => `<div class="ctx-line"><span>${h.text}</span><b>J. ${h.year}</b></div>`).join('')}</div>` : ''}`;
    return;
  }
  box.innerHTML = '';
}
const propName = t => ({ tree:'Baum', bush:'Strauch', rock_node:'Felsbrocken', ore_node:'Erzader', crate:'Kiste', chest:'Truhe',
  well:'Brunnen', sign:'Schild', board:'Anschlagbrett', anvil:'Amboss', shrine:'Schrein', gravestone:'Grabstein',
  mine_entrance:'Grubeneingang', mine_exit:'Ausgang', campfire_static:'Feuerstelle', claim_stone:'Grenzstein',
  dead_tree:'Toter Baum', bone_spire:'Knochenturm', obelisk:'Obelisk', watchtower_ruin:'Turmruine',
  marsh_ruin:'Ruine', broken_pillar:'Gebrochene Säule', crypt:'Gruft', wayshrine:'Wegschrein', candles:'Kerzen',
  waysign:'Wegweiser', barrel:'Fass', tower_ruin:'Alter Wachturm', bones:'Knochen', broken_cart:'Umgestürzter Wagen',
  firepit:'Kalte Feuerstelle', debris:'Verstreute Waren', blood:'Blutspur', flowers_prop:'Blumen',
  sack:'Sack', crate_stack:'Kistenstapel', table:'Tisch', bench:'Bank', bed:'Bett', bunk:'Etagenbett', shelf:'Regal',
  hearth:'Herdfeuer', forge:'Esse', counter:'Theke', desk:'Schreibpult', workbench_int:'Werkbank', cask_rack:'Fassgestell',
  weapon_rack:'Waffenständer', altar_small:'Altar', camp_ruin:'Verlassenes Lager', fallen_tree:'Umgestürzter Baum', rubble:'Geröll',
  mushrooms:'Pilze', standing_stone:'Menhir', tent_prop:'Zelt', cart:'Karren', stall:'Marktstand', scarecrow:'Vogelscheuche', fence:'Zaun',
  hay:'Heuballen', boat:'Fischerboot', net_rack:'Netzgestell', laundry:'Wäscheleine', lantern:'Laterne', trough:'Tränke', palisade_prop:'Palisade' }[t] || 'Objekt');

export function relLabel(v) {
  if (v <= -60) return 'Feind'; if (v <= -20) return 'Rivale'; if (v < 10) return 'Fremder';
  if (v < 35) return 'Bekannter'; if (v < 65) return 'Freund'; return 'Enger Freund';
}

// ---------------- Hotbar ----------------
let hbSig = '';
export function renderHotbar() {
  const hb = $('hotbar'); if (!hb) return;
  const p = (hudFor || S.player); if (!p) return;
  const slots = p.hotbar || [];
  // Nur neu aufbauen, wenn sich Belegung, Anzahl oder Abklingzeit (Viertelsekunden) ändern — sonst flackern die Icons.
  const sig = slots.map(s => !s ? '-' : s.type + ':' + s.key + ':' + (s.type === 'item' ? countItem(s.key) : Math.ceil((p.cooldowns?.[s.key] || 0) / 250))).join('|');
  if (sig === hbSig && hb.childElementCount) return;
  hbSig = sig;
  hb.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const s = slots[i];
    const d = el('div', 'slot' + (s ? '' : ' empty'));
    d.innerHTML = `<b>${(i + 1) % 10}</b>`;
    if (s) {
      if (s.type === 'item') {
        const cv = el('canvas'); cv.width = cv.height = 48; d.appendChild(cv);
        d.insertAdjacentHTML('beforeend', `<u>${countItem(s.key)}</u>`);
        setTimeout(() => drawItemIconTo(cv, s.key), 0);
        d.title = ITEMS[s.key]?.name || '';
      } else {
        const ab = ABILITIES[s.key];
        d.insertAdjacentHTML('beforeend', `<span style="font-size:10px;text-align:center;line-height:1.1;color:${ab.title ? TITLE_CLASSES[ab.title].glow : '#cbbf8a'};padding:0 2px">${ab.name}</span>`);
        if (ab.title) d.classList.add('title-ab');
        if (ab.spell) d.firstElementChild.nextElementSibling.style.color = A.schools?.[ab.school]?.col || '#b88af0';   // S15 P4: Zauber in Schulfarbe
        d.title = ab.desc;
        const cd = (p.cooldowns?.[s.key] || 0);
        if (cd > 0) { const c = el('div', 'cd'); c.style.height = `${clamp(cd / ab.cd * 100, 0, 100)}%`; c.style.top = 'auto'; c.style.bottom = '0'; d.appendChild(c); }
      }
      d.onclick = () => A.useSlot(i);
      d.oncontextmenu = ev => { ev.preventDefault(); S.player.hotbar[i] = null; hbSig = ''; renderHotbar(); toast('Platz geleert. Gegenstände über das Inventar wieder auf die Leiste legen.', 1800); };   // S13 (Nutzer): aus der Leiste entfernen
      d.title = (d.title ? d.title + ' — ' : '') + 'Rechtsklick: entfernen';
    }
    hb.appendChild(d);
  }
}
function countItem(key) { return S.player.inv.filter(x => x && x.key === key).reduce((n, x) => n + (x.count || 1), 0); }   // alle Stapel

// ---------------- Dialog ----------------
export let dlgWith = null;
export const uiHooks = {};                                           /* Koop: Gespräche eines Gasts laufen beim Host, das Fenster erscheint beim Gast (coop.js) */
// Visuell D (02.10.2026): Antwortart als Zeichen vor der Wahl (Reihenfolge bleibt — Proben klicken [0]); c.k setzt sie ausdrücklich.
const DLG_K = [['leave', /^\[?(Gehen|Nicht jetzt|Abbrechen|Zurück|Lass|Später|Nein)/i], ['fight', /angreif|kämpf|herausforder|Duell|töte|stirb|Klinge/i],
  ['gold', /\d+\s*Gold|bezahl|besteche|Bestechung|zahle/i], ['quest', /Was liegt an|Erledigt\.|Ich mache es|Auftrag|Abgeben/], ['trade', /Handel|Waren|Zeig mir|kaufen|verkaufen/i], ['ask', /\?/]];
let dlgTyper = 0;
export function dialogue(npc, text, choices, opt = null) {   /* opt.brief: Auftragsbrief (Q-3) unter dem Text */
  if (uiHooks.dialogue?.(npc, text, choices)) return;
  { let bx = $('dlg-brief'); if (!bx) { bx = el('div', 'dlg-brief'); bx.id = 'dlg-brief'; $('dlg-text').after(bx); }
    bx.innerHTML = opt?.brief ? briefHTML(opt.brief) : ''; bx.classList.toggle('hidden', !opt?.brief); if (opt?.brief) paintBrief(bx); }
  const box = $('dialogue'), opening = box.classList.contains('hidden') || dlgWith !== npc;
  box.classList.remove('hidden'); dlgWith = npc;
  const story = !!A.dlgStory?.(npc, choices);
  box.classList.toggle('story', story); box.dataset.mood = A.dlgMood?.(npc) || '';
  if (opening && S.settings.motion) { box.classList.remove('dlg-in'); void box.offsetWidth; box.classList.add('dlg-in'); }
  $('dlg-name').textContent = npc.name;
  let sub = $('dlg-sub'); if (!sub) { sub = el('div', 'dlg-sub'); sub.id = 'dlg-sub'; $('dlg-name').after(sub); }
  sub.textContent = story ? [npc.title && npc.title !== npc.name ? npc.title : npc.prof, FACTIONS[npc.faction]?.name].filter(Boolean).join(' · ') : '';
  // Text läuft ein (Klick vervollständigt; aus bei reduzierter Bewegung). textContent bleibt immer der volle Text.
  const t = $('dlg-text'); t.style.whiteSpace = 'pre-line'; clearInterval(dlgTyper); t.onclick = null;
  if (S.settings.motion && text && text.length > 12) {
    const a = el('span'), r = el('span', 'dlg-rest'); a.textContent = ''; r.textContent = text; t.replaceChildren(a, r);
    let i = 0; const done = () => { clearInterval(dlgTyper); a.textContent = text; r.textContent = ''; t.onclick = null; };
    dlgTyper = setInterval(() => { i += 2; if (i >= text.length) return done(); a.textContent = text.slice(0, i); r.textContent = text.slice(i); }, 18);
    t.onclick = done;
  } else t.textContent = text;
  drawPortraitTo($('dlg-portrait'), npc);
  const cc = $('dlg-choices'); cc.innerHTML = '';
  choices.forEach(c => { const b = el('button', '', c.text); b.dataset.k = c.k || (DLG_K.find(([, re]) => re.test(b.textContent)) || [''])[0]; b.onclick = () => { if (c.fn) c.fn(); else closeDialogue(); }; cc.appendChild(b); });
  flowLift();
}
export function closeDialogue() { if (uiHooks.close?.()) return; clearInterval(dlgTyper); $('dialogue').classList.add('hidden'); flowLift(); }
export const dialogueOpen = () => !$('dialogue').classList.contains('hidden');

// S13: Schlafen — das Bild blendet ab, Text, Mond, dann langsam wieder auf (rein sichtbar; die Zeit ist schon vergangen)
export function sleepFade(text) {
  let d = $('sleep-fade'); if (!d) { d = document.createElement('div'); d.id = 'sleep-fade'; document.getElementById('viewport')?.appendChild(d); }
  d.innerHTML = `<div>☾</div><p>${text}</p><small>Zzz …</small>`; d.className = 'on';
  clearTimeout(d._t); d._t = setTimeout(() => { d.className = 'off'; }, 2400);
}
export function toast(text, ms = 2200) {
  if (S._quiet) return;                                   // Selbsttest-Sandbox: keine Einblendungen
  notify({ text: String(text), ms, loud: isLoud(String(text)) });   /* UI-Scheibe 4: jede Meldung wird eine Zeile im Meldungsfluss */
}
// ---------------- Meldungsfluss (UI-Scheibe 4, Entwickler 01.10.2026: mehrere verblassende Meldungen zugleich statt Einzel-Toast) ----------------
// Unten links im Spielfeld, neueste unten, ältere blasser. Gleiche Meldung zählt hoch (×2) statt zu stapeln. Mehr als FLOW_MAX zugleich:
// die älteste, die schon FLOW_MIN zu sehen war, geht früher; sonst wartet die neue in flowQ — nichts geht verloren. Großbuchstaben-Toasts
// (bisher die lauten: Angriff, Stufe, Ereignis) bekommen die laute Form. Aufnahme-Stapel (items.md §6) und Aufträge nutzen dieselbe Zeile.
const FLOW_MIN = 900, flowMax = () => innerWidth < 820 ? 3 : 4;   /* schmal: 3 Zeilen */
let flowQ = [], flowQT = 0;
export const flowQueue = () => flowQ.length;
export function flowReset() { flowQ = []; clearTimeout(flowQT); $('flow')?.replaceChildren(); }   /* Proben */
const isLoud = t => t.length > 3 && /[A-ZÄÖÜ]/.test(t) && t === t.toUpperCase();
function flowBox() {
  let b = $('flow'); if (b) return b; const vp = $('viewport'); if (!vp) return null;
  b = el('div', ''); b.id = 'flow'; b.setAttribute('aria-live', 'polite'); vp.appendChild(b); return b;
}
const flowLive = box => [...box.children].filter(r => !r.classList.contains('out'));
function flowOut(r, fast) {
  if (!r || r.classList.contains('out')) return; clearTimeout(r._tm); r.classList.add('out');
  setTimeout(() => { r.remove(); flowNext(); }, fast || S.settings?.motion === false ? 60 : 420);
}
function flowNext() { const box = $('flow'); while (box && flowQ.length && flowLive(box).length < flowMax()) notify(flowQ.shift()); }
function flowDrain() {                                            /* Warteschlange: die älteste Zeile geht, sobald sie FLOW_MIN zu sehen war */
  clearTimeout(flowQT); const box = $('flow'); if (!box || !flowQ.length) return; flowNext(); if (!flowQ.length) return;
  const old = flowLive(box).find(r => performance.now() - r._t0 >= FLOW_MIN); if (old) flowOut(old, true); flowQT = setTimeout(flowDrain, 250);
}
function flowCount(r) { const c = r.querySelector('.fl-n'); if (c) c.textContent = r._n > 1 ? (r._plus ? '+' : '×') + r._n : ''; }
/* o: { text, ms, loud, key (Zusammenzählen), add (Menge), ico (Gegenstand), cls, glyph } — ohne Sperre durch S._quiet (die prüft toast/pickup) */
export function notify(o) {
  const box = flowBox(); if (!box || !o) return null;
  document.body.classList.toggle('nomotion', S.settings?.motion === false);
  const key = o.key || o.text, ms = Math.max(1200, o.ms || 2200), live = flowLive(box);
  const same = live.find(r => r._key === key);
  if (same) { same._n += o.add || 1; flowCount(same); clearTimeout(same._tm); same._tm = setTimeout(() => flowOut(same), ms);
    same.classList.remove('bump'); void same.offsetWidth; same.classList.add('bump'); return same; }
  if (live.length >= flowMax()) { const old = live.find(r => performance.now() - r._t0 >= FLOW_MIN); if (old) flowOut(old, true); else { flowQ.push(o); clearTimeout(flowQT); flowQT = setTimeout(flowDrain, 250); return null; } }
  const r = el('div', `fl-row${o.loud ? ' loud' : ''}${o.cls ? ' ' + o.cls : ''}`);
  r._key = key; r._n = o.add || 1; r._plus = !!o.ico; r._t0 = performance.now();
  const ic = o.ico ? '<canvas class="fl-ico" width="20" height="20"></canvas>' : `<i class="fl-g ${o.glyph || (o.loud ? 'g-loud' : 'g-info')}"></i>`;
  r.innerHTML = `${ic}<span class="fl-t"></span><b class="fl-n"></b>`; r.querySelector('.fl-t').textContent = o.text; flowCount(r);
  r.onclick = () => flowOut(r, true); r.title = 'Klick: ausblenden · alles steht im Protokoll unten';
  box.appendChild(r); if (o.ico) drawItemIconTo(r.firstChild, o.ico); r._tm = setTimeout(() => flowOut(r), ms);
  return r;
}
/* Gesprächsfenster offen: der Fluss rückt darüber (sonst verdeckt) */
function flowLift() { const b = $('flow'), d = $('dialogue'); if (!b || !d) return; b.style.bottom = d.classList.contains('hidden') ? '' : (d.offsetHeight + 26) + 'px'; }
// Aufnahme-Stapel (items.md §6 Wahl 10): Icon + Name in Seltenheitsfarbe, gleiche Teile zählen hoch, Icon fliegt zum Reiter „Gepäck“,
// Punkt am Reiter bis das Gepäck geöffnet wird. Legendär/Mythisch: große Fund-Karte (Entwickler 02.10.: ohne Pause).
export function pickup(s) {
  if (S._quiet || !s || !ITEMS[s.key]) return;
  const it = ITEMS[s.key], r = rarOfS(s), n = s.count || 1;
  const row = notify({ key: 'loot:' + s.key + ':' + r + ':' + (s.name || ''), text: s.name || it.name, add: n, ico: s.key, cls: 'loot r-' + r, ms: 2600 });
  if (!it.res) { const b = navBtn('inv'); if (b) { b.classList.add('badge'); b.title = 'Gepäck (I) — Neues im Gepäck'; } if (row) flyTo(row.firstChild, s.key); }
  if (r === 'legendary' || r === 'mythic') findCard(s);
}
const navBtn = g => $('nav')?.querySelector(`[data-g="${g}"]`);
function flyTo(src, key) {
  const b = navBtn('inv'); if (S.settings?.motion === false || !b || !src?.getBoundingClientRect || !document.body.animate) return;
  const a = src.getBoundingClientRect(), z = b.getBoundingClientRect(); if (!a.width || !z.width) return;
  const cv = el('canvas', 'fl-fly'); cv.width = cv.height = 32; drawItemIconTo(cv, key); cv.style.left = a.left - 6 + 'px'; cv.style.top = a.top - 6 + 'px'; document.body.appendChild(cv);
  const an = cv.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${z.left + z.width / 2 - a.left - 10}px,${z.top + z.height / 2 - a.top - 10}px) scale(.45)`, opacity: .35 }], { duration: 700, easing: 'cubic-bezier(.5,0,.75,.35)' });
  an.onfinish = () => { cv.remove(); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); };
}
// Fund-Karte: mittig oben (Höhe der Namenskarte, nie zugleich), 2,8 s, Klick oder Esc schließt. Die Welt läuft weiter.
let findQ = [], findT = 0;
export function findCard(s) { if (S._quiet || !s) return; findQ.push(s); if (!$('findcard')?.classList.contains('on')) findNext(); }
function findNext() {
  const s = findQ.shift(); if (!s) return;
  const nc = document.getElementById('nameCard'); if (nc?.getAnimations?.().some(a => a.playState === 'running')) { findQ.unshift(s); clearTimeout(findT); findT = setTimeout(findNext, 400); return; }
  let d = $('findcard'); if (!d) { d = el('div', ''); d.id = 'findcard'; d.onclick = closeFind; document.body.appendChild(d); }
  const it = ITEMS[s.key], r = rarOfS(s), leg = s.leg || it.leg;
  d.className = 'fc-' + r; document.body.classList.toggle('nomotion', S.settings?.motion === false);
  d.innerHTML = `<div class="fc-in"><i class="fc-ray"></i><canvas class="fc-ico" width="64" height="64"></canvas><div class="fc-rar">${rarMark(r)}${RARITY[r]}</div>
    <div class="fc-name r-${r}"></div>${leg && LEGENDS[leg] ? `<div class="fc-leg">«${LEGENDS[leg].name}»</div>` : ''}<small>Im Gepäck (I) · Klick oder Esc schließt</small></div>`;
  d.querySelector('.fc-name').textContent = s.name || it.name; drawItemIconTo(d.querySelector('canvas'), s.key);
  void d.offsetWidth; d.classList.add('on'); sfx('loot', RAR_ORD.indexOf(r), 0.7);
  clearTimeout(findT); findT = setTimeout(closeFind, 2800);
}
export function closeFind() { const d = $('findcard'); if (!d?.classList.contains('on')) return; clearTimeout(findT); d.classList.remove('on'); findT = setTimeout(findNext, 350); }
// Warnchip (ui_redesign §5): das Wichtigste in der Kopfleiste, klickbar. Inhalt liefert game.js (A.warnings) — nur, was das Spiel schon ansagt.
let warnSig = null;
function paintWarn() {
  let c = $('warnchip');
  if (!c) { const wc = document.querySelector('#topbar .worldclock'); if (!wc) return; c = el('button', 'hidden'); c.id = 'warnchip'; wc.before(c); c.onclick = () => { if (c._w?.open) openModal(c._w.open); }; }
  const L = A.warnings?.() || [], sig = L.map(w => w.k + w.text).join('|'); if (sig === warnSig) return; warnSig = sig;
  if (!L.length) { c.className = 'hidden'; c._w = null; return; }
  const w = L[0]; c._w = w; c.className = 'w-' + w.k;
  c.innerHTML = `<i></i><span></span>${L.length > 1 ? `<b>+${L.length - 1}</b>` : ''}`; c.querySelector('span').textContent = w.text;
  c.title = L.map(x => '• ' + x.text).join('\n') + `\nKlick: ${{ settlement: 'Siedlung', quests: 'Aufträge', party: 'Gruppe' }[w.open] || 'öffnen'}`;
}
// ---------------- Aufträge sichtbar (visual/quests.md Q-1, Entscheidungen 02.10.2026) ----------------
// Fortschritt als Kerben statt „2/3“ (die Zahl steht im Tooltip); ab 9 Zielen ein Balken.
export function pips(h, n) {
  n = Math.max(1, n | 0); h = Math.max(0, Math.min(h | 0, n)); const t = `${h}/${n}`;
  return n <= 8 ? `<span class="pips${h >= n ? ' full' : ''}" title="${t}">${'<i class="on"></i>'.repeat(h)}${'<i></i>'.repeat(n - h)}</span>`
    : `<span class="pips bar${h >= n ? ' full' : ''}" title="${t}"><u style="width:${Math.round(h / n * 100)}%"></u></span>`;
}
// Q-3 (quests.md Q2-1, Q8-1/4; Entscheidung 02.10.2026): Auftragsbrief — Ziel-Piktogramme (Gegnerbild, Gegenstand, Auge für Suche, Zeichen der Auftragsart)
// und Lohn. nums = false: nur die Lohnart als Symbol, die Zahl im Tooltip (feste Aufträge vor der Annahme); Ruf als Wappen + Richtung.
function objIco(o) {
  if (o.t === 'kill') return MONSTERS[o.mt] ? `<canvas class="br-mon" data-mt="${o.mt}" width="36" height="36"></canvas>` : icoImg('log_death', 2, 'br-ico');
  if (o.t === 'item') return ITEMS[o.key] ? `<canvas class="br-itm" data-ico="${o.key}"></canvas>` : icoImg('log_economy', 2, 'br-ico');
  if (o.t === 'find') return '<i class="br-eye"></i>';
  return icoImg(o.ico || 'log_quest', 2, 'br-ico');
}
const qa = t => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export function rewardHTML(R, nums) {
  if (!R) return ''; const out = [], sg = v => (v > 0 ? '+' : '') + v;
  if (R.gold) out.push(`<span class="rw" title="Gold: ${R.gold}">${icoImg('res_gold', 2, 'rw-i')}${nums ? `<b>${R.gold}</b>` : ''}</span>`);
  if (R.xp) out.push(`<span class="rw" title="Erfahrung: ${R.xp}">${icoImg('bar_xp', 2, 'rw-i')}${nums ? `<b>${R.xp}</b>` : ''}</span>`);
  for (const k of R.items || []) out.push(`<span class="rw" title="Gegenstand: ${qa(ITEMS[k]?.name || k)}">${nums ? `<canvas class="rw-itm" data-ico="${k}"></canvas>` : icoImg('log_economy', 2, 'rw-i')}</span>`);
  for (const [f, v] of R.rep || []) { const F = FACTIONS[f]; out.push(`<span class="rw ${v >= 0 ? 'up' : 'dn'}" title="${qa(F?.name || f)}: ${sg(v)} Ansehen"><i class="rw-ban" style="background:${F?.colors?.[0] || '#555'};border-color:${F?.colors?.[1] || '#999'}"></i><em>${v >= 0 ? '▲' : '▼'}</em>${nums ? `<b>${sg(v)}</b>` : ''}</span>`); }
  for (const [who, v] of R.rel || []) out.push(`<span class="rw ${v >= 0 ? 'up' : 'dn'}" title="Beziehung zu ${qa(who)}: ${sg(v)}">${icoImg('bar_hp', 2, 'rw-i')}<em>${v >= 0 ? '▲' : '▼'}</em>${nums ? `<b>${sg(v)}</b>` : ''}</span>`);
  if (R.unlock) out.push(`<span class="rw" title="Ausbildung: ${qa(R.unlock)}">${icoImg('nav_codex', 2, 'rw-i')}</span>`);
  if (R.promote) out.push(`<span class="rw" title="Beförderung: ${qa(R.promote)}">${icoImg('set_level', 2, 'rw-i')}</span>`);
  if (R.share != null) out.push(`<span class="rw" title="Dein Anteil an der Arbeit: ${Math.round((R.work || 0) * 100)} % — der Lohn ist auf ${Math.round(R.share * 100)} % gekürzt. Wer die Wachen kämpfen lässt, bekommt weniger."><i class="rw-pie" style="--p:${Math.round(R.share * 100)}%"></i></span>`);
  return out.join('');
}
function briefHTML(B) {
  const objs = (B.objs || []).map(o => `<span class="br-obj" title="${qa(o.text || '')}">${objIco(o)}${o.n > 1 ? `<b>×${o.n}</b>` : ''}</span>`).join('');
  return `<div class="br-objs">${objs}</div>${B.days ? `<span class="br-days" title="Frist: ${B.days} Tage ab Annahme">${icoImg('time', 2, 'rw-i')}<b>${B.days}</b></span>` : ''}<div class="br-rew" title="${B.nums ? 'Lohn' : 'Lohn — die Maus zeigt, wie viel'}">${rewardHTML(B.rew, B.nums)}</div>`;
}
function paintBrief(root) { paintIcons(root); root.querySelectorAll('canvas[data-mt]').forEach(c => drawMonsterTo(c, c.dataset.mt)); }
// Brief mit Siegel (Q7-1, Q9-1): erfüllt = Stempel, gescheitert = der Brief reißt, das Siegel bricht schwarz. Oben Mitte im Spielfeld, einer nach
// dem anderen. Ausgelöst vom Zustandswechsel des Auftrags (aktiv → erledigt/gescheitert) — gleich wo im Spiel er passiert, im Einzelspiel wie beim
// Koop-Gast (dessen S.quests kommt vom Host): genau ein Brief je Wechsel. Neuer Held (Erbe) oder Proben (S._quiet): nur still neu merken.
let qSnap = null, qSnapP = null, letterQ = [], letterT = 0;
export let letterCount = 0;                                       /* Proben: ausgelöste Briefe */
export function questSnap() { qSnap = new Map(Object.entries(S.quests || {}).map(([k, v]) => [k, v?.state])); qSnapP = S.player; }
export function questWatch() {
  if (!qSnap || qSnapP !== S.player || !S.player) return questSnap();   /* unter S._quiet zählt questLetter nur (keine Anzeige) */
  for (const [k, v] of Object.entries(S.quests || {})) { const o = qSnap.get(k);
    if (o === 'active' && (v?.state === 'done' || v?.state === 'failed')) questLetter(v.state, k, v.state === 'done' ? { rew: `<div class="ql-rew">${rewardHTML(A.questReward?.(k), true)}</div>` } : {});
    else if (o !== 'active' && v?.state === 'active') questLetter('accept', k);   /* Q2-2: Annahme = Brief mit Stempel, fliegt zum Reiter */ }
  questSnap();
}
export function questLetter(kind, k, o = {}) {
  letterCount++; if (S._quiet) return;
  letterQ.push({ kind, k, name: o.name || QUESTS[k]?.name || String(k), ...o }); if (!$('qletter')?.classList.contains('on')) letterNext();
}
function letterNext() {
  const L = letterQ.shift(), vp = $('viewport'); if (!L || !vp) return;
  let d = $('qletter'); if (!d) { d = el('div', ''); d.id = 'qletter'; d.onclick = () => letterEnd(); vp.appendChild(d); }
  const word = { done: 'Erfüllt', failed: 'Gescheitert', accept: 'Angenommen' }[L.kind] || '';
  const paper = `<div class="ql-paper"><div class="ql-head">Auftrag</div><div class="ql-title"></div>${L.rew || ''}</div>`;
  d.className = 'ql-' + L.kind; document.body.classList.toggle('nomotion', S.settings?.motion === false);
  d.innerHTML = (L.kind === 'failed' ? `<div class="ql-half l">${paper}</div><div class="ql-half r">${paper}</div>` : paper) + `<div class="ql-seal"><b>${word}</b></div>`;
  d.querySelectorAll('.ql-title').forEach(t => { t.textContent = L.name; }); paintBrief(d);
  d.title = (L.kind === 'failed' ? 'Auftrag gescheitert' : L.kind === 'done' ? 'Auftrag erfüllt' : 'Auftrag angenommen') + ' — Klick: weg. Alles steht im Protokoll und im Auftragsbuch (J).';
  void d.offsetWidth; d.classList.add('on');
  sfx(L.kind === 'failed' ? 'crack' : L.kind === 'done' ? 'bell' : 'ui', 0, L.kind === 'done' ? 0.35 : 0.5);
  clearTimeout(letterT); letterT = setTimeout(L.kind === 'accept' ? letterFly : letterEnd, L.kind === 'failed' ? 2700 : L.kind === 'accept' ? 1500 : 2600);
}
function letterFly() {                                           /* Q2-2: der angenommene Brief fliegt zum Reiter „Aufträge“, der kurz aufleuchtet */
  const d = $('qletter'), b = navBtn('quest'), pp = d?.querySelector('.ql-paper'); if (!d || !b || !pp || S.settings?.motion === false || !pp.animate) return letterEnd();
  const a = pp.getBoundingClientRect(), z = b.getBoundingClientRect(), an = d.animate([{ transform: 'translate(-50%,0) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.round(z.left + z.width / 2 - (a.left + a.width / 2))}px),${Math.round(z.top - a.top)}px) scale(.12)`, opacity: .2 }], { duration: 620, easing: 'cubic-bezier(.5,0,.8,.5)' });
  an.onfinish = () => { d.classList.remove('on'); an.cancel(); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); trackerFlash(); clearTimeout(letterT); letterT = setTimeout(letterNext, 200); };
}
function letterEnd() { const d = $('qletter'); if (!d) return; clearTimeout(letterT); d.classList.remove('on'); letterT = setTimeout(letterNext, 320); }
// Goldzähler in der Kopfleiste zählt hoch (Q8-5); weniger Gold springt sofort. Ohne Bildtakt (verdecktes Fenster): Endstand nach 0,9 s.
let goldShown = null, goldTo = 0, goldFrom = 0, goldT0 = 0, goldRaf = 0;
function goldShow(v) {
  const g = $('clock-gold'); if (!g) return;
  const fin = () => { cancelAnimationFrame(goldRaf); goldRaf = 0; goldShown = v; g.textContent = String(v); g.classList.remove('up'); };
  if (goldShown === null || v <= goldShown || S.settings?.motion === false) { if (goldShown !== v || goldRaf) fin(); return; }
  if (goldRaf && goldTo === v) { if (performance.now() - goldT0 > 900) fin(); return; }
  goldFrom = goldShown; goldTo = v; goldT0 = performance.now(); g.classList.add('up');
  const step = now => { const k = Math.min(1, (now - goldT0) / 600); goldShown = Math.round(goldFrom + (goldTo - goldFrom) * (1 - Math.pow(1 - k, 3))); g.textContent = String(goldShown); if (k < 1) goldRaf = requestAnimationFrame(step); else fin(); };
  cancelAnimationFrame(goldRaf); goldRaf = requestAnimationFrame(step);
}
// ---------------- Auftrags-Tracker (Visuell Q-4, Entscheidung 02.10.2026) ----------------
// Oben rechts im Spielfeld (unter der Minikarte): verfolgter Auftrag groß — Ziel-Bild, Kerben, Richtungspfeil + Entfernung, Frist-Sanduhr bzw.
// Zeit bis zum Angriff; bis zu 3 weitere klein (Klick = verfolgen). Im Kampf klappt er auf Siegel + Kerben ein. Klick auf den großen: Auftragsbuch.
// Neu gebaut wird nur, wenn sich Inhalt ändert (Signatur); Pfeil, Entfernung, Sanduhr und Angriffszeit werden je Takt nur gesetzt.
let trkSig = '';
function paintTracker() {
  const vp = $('viewport'); if (!vp) return;
  let t = $('trk');
  if (!t) { t = el('div', 'trk hidden'); t.id = 'trk'; vp.appendChild(t);
    t.onclick = e => { const r = e.target.closest('[data-k]'); if (!r) return; if (r.classList.contains('tk-main')) openModal('quests'); else { A.trackQuest?.(r.dataset.k); trkSig = ''; paintTracker(); } }; }
  const I = A.tracker?.();
  if (!I?.list?.length || S.cine) { if (!t.classList.contains('hidden')) { t.classList.add('hidden'); trkSig = ''; } return; }
  const mm = $('minimap'); t.style.top = mm && mm.style.display !== 'none' ? (mm.offsetTop + mm.offsetHeight + 8) + 'px' : '';
  const sig = [I.fight ? 1 : 0, ...I.list.map(o => [o.k, o.name, o.objs.join(';'), o.late ? 1 : 0, o.attack ? 1 : 0, o.frac != null ? 1 : 0, o.ico ? JSON.stringify(o.ico) : ''].join('|'))].join('#');
  if (sig !== trkSig) { trkSig = sig; t.classList.remove('hidden'); t.classList.toggle('fight', !!I.fight);
    t.innerHTML = I.list.map(o => o.big ? `<div class="tk-main" data-k="${o.k}" title="Verfolgter Auftrag — Klick öffnet das Auftragsbuch (J). Im Kampf klappt er ein.">
      <div class="tk-r1"><i class="tk-seal"></i><span class="tk-name"></span><span class="tk-dir hidden"><i class="tk-arrow"></i><b class="tk-d"></b></span></div>
      <div class="tk-r2">${o.ico ? objIco(o.ico) : ''}${o.objs.map(([h, n]) => pips(h, n)).join('')}${o.frac != null ? `<span class="tk-time${o.late ? ' late' : ''}" title="${o.late ? 'Die Frist endet heute.' : 'Frist: so viel Zeit bleibt noch.'}"><i class="tk-glass"></i></span>` : ''}${o.attack ? `<span class="tk-att">${icoImg('log_combat', 1, 'tk-i')}<b></b></span>` : ''}</div></div>`
      : `<div class="tk-small" data-k="${o.k}" title="Klick: diesen Auftrag verfolgen"><i class="tk-seal s"></i><span class="tk-name"></span>${o.objs.map(([h, n]) => pips(h, n)).join('')}</div>`).join('');
    [...t.querySelectorAll('[data-k]')].forEach((r, i) => { r.querySelector('.tk-name').textContent = I.list[i].name; }); paintBrief(t); }
  const B = I.list[0]; if (!B?.big) return;
  const ar = t.querySelector('.tk-dir'); if (ar) { const has = B.ang != null; ar.classList.toggle('hidden', !has);
    if (has) { ar.firstChild.style.transform = `rotate(${B.ang.toFixed(2)}rad)`; ar.lastChild.textContent = B.d > 999 ? (B.d / 1000).toFixed(1) + ' km' : Math.round(B.d) + ' m'; ar.title = B.where || ''; } }
  const g = t.querySelector('.tk-glass'); if (g) g.style.setProperty('--f', (B.frac ?? 0).toFixed(2));
  const at = t.querySelector('.tk-att'); if (at && B.attack) { at.lastChild.textContent = B.attack.replace(/^Angriff in /, ''); at.title = B.attack; }
}
function trackerFlash() { const t = $('trk'); if (!t || S.settings?.motion === false) return; t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); }
export function setPrompt(text) {
  const p = $('prompt');
  if (!text) { p.classList.add('hidden'); return; }
  if (p.__t !== text) { p.innerHTML = text; p.__t = text; } p.classList.remove('hidden');   /* PERF-S: DOM nur bei Änderung */
}

// ---------------- Modale ----------------
export let modalOpen = null;
// Fenster neu zeichnen, ohne es umzuschalten (openModal schließt bei gleichem Namen).
export function refreshModal(arg) { const n = modalOpen; if (!n) return; modalOpen = null; openModal(n, arg); }
const DOCKED = new Set(['trade', 'settlement', 'business', 'party', 'craft', 'smith', 'travel']);
function leaveWin(next) {                                     /* P6/P7: Fenster verlassen — Inventar-Takt stoppen, Kontor-Besuch beenden, Dock lösen */
  if (modalOpen === 'inventory' && next !== 'inventory') { clearInterval(invTimer); figPrev = null; DRAG = null; }
  if (modalOpen === 'trade' && next !== 'trade') { A.tradeEnd?.(trNpc); trNpc = null; TRD = null; }
  if (next === 'inventory') { const b = navBtn('inv'); if (b) { b.classList.remove('badge'); b.title = 'Gepäck (I)'; } }   /* Aufnahme-Stapel: Punkt bis das Gepäck offen war */
  $('modal')?.classList.toggle('dock', DOCKED.has(next)); if ($('modal')) $('modal').dataset.win = next || '';   /* UI-Scheibe 3: Handel, Siedlung, Gruppe, Handwerk angedockt — die Welt bleibt sichtbar */
  $('modal')?.classList.toggle('parch', ['codex', 'chronicle', 'quests'].includes(next));   /* UI-Scheibe 5: Pergament nur für die Lesefenster */
  document.body.classList.toggle('nomotion', S.settings?.motion === false);   /* „Reduzierte Bewegung“: kein Glanz, kein Pulsieren */
}
export function closeModal() { leaveWin(null); $('modal').classList.add('hidden'); modalOpen = null; [...$('nav').children].forEach(b => b.classList.remove('active')); S.paused = false; }
export function openModal(name, arg) {
  if (uiHooks.modal?.(name, arg)) return;
  if (modalOpen === name) return closeModal();
  leaveWin(name);
  modalOpen = name;
  const m = $('modal'); m.classList.remove('hidden');
  const body = $('modal-body'); body.innerHTML = ''; body.className = '';
  const grp = NAV.find(n => n[3].includes(name));
  [...$('nav').children].forEach(b => b.classList.toggle('active', b.dataset.g === grp?.[0]));
  const R = { inventory:[ 'Inventar', invUI ], character:[ 'Charakter', charUI ], party:[ 'Gruppe', partyUI ],
    settlement:[ 'Lager & Siedlung', settleUI ], faction:[ 'Fraktionen', facUI ], chronicle:[ 'Chronik', chronUI ],
    map:[ 'Weltkarte', mapUI ], trade:[ 'Handel', tradeUI ], settings:[ 'Einstellungen', settingsUI ],
    classes:[ 'Ausbildung', classUI ], quests:[ 'Aufträge', questUI ], skills:[ 'Talente', skillUI ], effects:[ 'Aktive Effekte', effectsUI ], codex:[ 'Kodex', codexUI ], spells:[ 'Zauberbuch', spellUI ], stable:[ 'Stall', stableUI ], beasts:[ 'Tierhändler', beastsUI ], mech:[ 'Prothesen-Werkbank', mechUI ], learn:[ 'Zauber lernen', learnUI ], healer:[ 'Heiler', healerUI ], board:[ 'Anschlagbrett', boardUI ], craft:[ 'Handwerk', craftUI ], business:[ 'Betriebe', bizUI ], smith:[ 'Schmiede', smithUI ], travel:[ 'Kutsche', travelUI ] }[name];
  $('modal-title').textContent = R ? R[0] : name;
  let tabs = $('modal-tabs'); if (!tabs) { tabs = el('div', ''); tabs.id = 'modal-tabs'; $('modal-title').after(tabs); }   /* Unterthemen der Gruppe als Reiter */
  const subs = (grp?.[3] || []).filter(k => SUBTAB[k]);
  tabs.innerHTML = subs.length > 1 && subs.includes(name) ? subs.map(k => `<button data-sub="${k}" class="${k === name ? 'on' : ''}">${SUBTAB[k]}</button>`).join('') : '';
  tabs.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => { if (b.dataset.sub !== modalOpen) openModal(b.dataset.sub); });
  if (R) R[1](body, arg);
}

// ---- Inventar (Visueller Umbau P6, IMPL-ITEMS 02.10.2026) ----
// Papierpuppe mit großer, laufend aktualisierter Figur; Filter als Piktogramme; „Ordnen“ ändert nur die Anzeige (p.inv bleibt wie es ist);
// Klick = ansehen (Entwickler 02.10.), Doppelklick, Ziehen oder Knopf = handeln; Antippen: Teil wählen, dann den leuchtenden Platz tippen.
// Das Fenster wird einmal gebaut; danach malt invPaint nur, was sich geändert hat (Signatur je Zelle, wie renderHotbar).
const RAR_ORD = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
const GEAR_SL = new Set(['weapon', 'offhand', 'head', 'chest', 'feet', 'cloak', 'hands', 'legs', 'talisman']);
const rarOfS = s => (s && (s.rar || ITEMS[s.key]?.rarity)) || 'common';
const rarLv = s => Math.max(0, RAR_ORD.indexOf(rarOfS(s)));
const rarMark = r => r && r !== 'common' ? `<i class="rm rm-${r}"></i>` : '';
const LOCK_SVG = '<svg class="lk" viewBox="0 0 8 9" width="9" height="10" aria-hidden="true"><path d="M2 4V2.6a2 2 0 0 1 4 0V4" stroke="#d8cdb6" stroke-width="1.2" fill="none"/><rect x="1" y="4" width="6" height="5" fill="#bd9433"/><rect x="3.5" y="5.6" width="1" height="1.6" fill="#3b2a12"/></svg>';
const DOLL = [['head', 'Kopf', 1, 1], ['chest', 'Rumpf', 1, 2], ['hands', 'Hände', 1, 3], ['legs', 'Beine', 1, 4], ['talisman', 'Talisman', 3, 1], ['cloak', 'Umhang', 3, 2], ['feet', 'Füße', 3, 4], ['weapon', 'Waffe', 1, 5], ['offhand', 'Nebenhand', 3, 5]];
const DOLL_ICO = { head: 'nav_char', weapon: 'log_combat', offhand: 'set_level', feet: 'bar_st', talisman: 'bar_xp' };
const INV_CAT = [['all', 'nav_inv', 'Alles'], ['weapon', 'log_combat', 'Waffen'], ['armor', 'nav_char', 'Rüstung und Schmuck'], ['use', 'res_food', 'Verbrauch'], ['good', 'log_economy', 'Handelswaren'], ['mat', 'res_stone', 'Material'], ['quest', 'nav_quest', 'Auftrags- und Schlüsselstücke']];
const CAT_ORDER = ['weapon', 'armor', 'use', 'good', 'mat', 'quest'];
const catOf = it => !it ? 'mat' : it.slot === 'weapon' ? 'weapon' : GEAR_SL.has(it.slot) ? 'armor' : it.slot === 'consumable' ? 'use' : it.good ? 'good' : it.slot === 'material' && !it.value ? 'quest' : 'mat';
const INV_SORT = [['found', 'Fund'], ['cat', 'Art'], ['rar', 'Seltenheit'], ['val', 'Wert']];
const FIG_DIRS = ['S', 'W', 'N', 'E'];
let invSel = null, invFilter = 'all', figDir = 0, figPrev = null, figT = 0, invTimer = 0, DRAG = null, moreOpen = false;
const icoTag = (k, s = 1, cls = 'kpi-ico') => icoImg(k, s, cls);
function paintIcons(root) { root?.querySelectorAll?.('canvas[data-ico]').forEach(cv => drawItemIconTo(cv, cv.dataset.ico)); root?.querySelectorAll?.('canvas[data-skbr]').forEach(cv => drawSkillIconTo(cv, cv.dataset.skbr, cv.dataset.sktype)); }
function chipBar(box, list, cur, on) {
  if (!box) return;
  box.innerHTML = list.map(([k, ico, name]) => `<button class="chip${k === cur ? ' on' : ''}" data-k="${k}" title="${name}">${icoTag(ico, 2, 'chip-ico') || name.slice(0, 4)}</button>`).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => on(b.dataset.k));
}
function invView(p) {                                        /* Anzeige-Reihenfolge: Indizes in p.inv (Daten bleiben unberührt) */
  const idx = []; p.inv.forEach((s, i) => { if (s) idx.push(i); });
  const m = S.settings?.invSort || 'found'; if (m === 'found') return idx;
  const k = i => { const s = p.inv[i], it = ITEMS[s.key] || {}, c = CAT_ORDER.indexOf(catOf(it));
    return m === 'cat' ? c * 100 - rarLv(s) : m === 'rar' ? -rarLv(s) * 100 + c : -(it.value || 0) * (RARITY_VALUE[rarOfS(s)] || 1) * (s.count || 1); };
  return idx.sort((a, b) => k(a) - k(b) || a - b);
}
function cmpArrow(s) {                                       /* Pfeil nur, wo das Spiel selbst vergleicht: Schaden (Waffe) und Rüstung (gleicher Platz) */
  const it = ITEMS[s.key], p = S.player; if (!it || !GEAR_SL.has(it.slot)) return '';
  const cur = p.equip?.[it.slot], ci = cur && ITEMS[cur.key];
  if (it.dmg) return ci?.dmg ? (it.dmg > ci.dmg ? 'up' : it.dmg < ci.dmg ? 'dn' : '') : 'up';
  if (it.armor) return !ci ? 'up' : it.armor > (ci.armor || 0) ? 'up' : it.armor < (ci.armor || 0) ? 'dn' : '';
  return '';
}
function paintCell(c, s, o = {}) {
  const sig = s ? [s.key, s.count || 1, Math.round((s.cond ?? 1) * 40), rarOfS(s), s.lock ? 1 : 0, s.nw ? 1 : 0, o.dim ? 1 : 0, o.sel ? 1 : 0, o.cmp || '', o.tag || '', o.mk ? 1 : 0, o.cls || ''].join('|') : 'leer|' + (o.empty || '') + (o.cls || '');
  if (c._sig === sig) return; c._sig = sig;
  const base = c.dataset.base || 'cell';
  if (!s) { c.className = base + ' empty' + (o.cls ? ' ' + o.cls : ''); c.innerHTML = o.empty || ''; return; }
  const r = rarOfS(s);
  c.className = `${base} r-${r}${o.dim ? ' dim' : ''}${o.sel ? ' sel' : ''}${s.lock ? ' locked' : ''}${o.mk ? ' mk' : ''}${o.cls ? ' ' + o.cls : ''}`;
  c.innerHTML = `<canvas></canvas>${rarMark(r)}${(s.count || 1) > 1 ? `<span class="cnt">${s.count}</span>` : ''}` +
    (s.cond != null && s.cond < 1 ? `<span class="cond"><i style="width:${s.cond * 100}%;background:${s.cond > .5 ? '#5c6b3c' : '#8c3b2a'}"></i></span>` : '') +
    (s.nw ? '<span class="nwm">NEU</span>' : '') + (s.lock ? LOCK_SVG : '') + (o.cmp ? `<span class="cmpa ${o.cmp}">${o.cmp === 'up' ? '▲' : '▼'}</span>` : '') +
    (o.tag || '') + (o.mk ? '<span class="mkm">✓</span>' : '');
  drawItemIconTo(c.firstChild, s.key);
}
function invStateSig() { const p = S.player; return p.inv.map(s => s ? s.key + ':' + (s.count || 1) + (s.lock ? 'L' : '') : '-').join(',') + '#' + [...GEAR_SL].map(k => p.equip?.[k]?.key || '').join(',') + '#' + (S.stash?.length || 0); }
function hasStore() { return !!S.settlement?.buildings?.some(b => b.type === 'storage' && b.built >= 1); }
function fitsSlot(k, s) {                                    /* passt das Teil auf diesen Platz? (Zweiwaffen: zweite Einhandwaffe auf die Nebenhand) */
  const it = s && ITEMS[s.key]; if (!it || !GEAR_SL.has(it.slot)) return false;
  return k === it.slot || A.previewEquip?.(s)?.slot === k;
}
function markTargets(s) {
  for (const d of document.querySelectorAll('#doll .dslot')) { const k = d.dataset.k, f = !!s && fitsSlot(k, s), no = f && !!A.equipBlock?.(ITEMS[s.key]);
    d.classList.toggle('can', f && !no); d.classList.toggle('no', no); }
}
function invAct(fn, flash) {                                  /* Aktion ausführen, gezielt neu malen, Rückmeldung: Einrasten oder Wackeln */
  const p = S.player, sig0 = invStateSig(), o = invSel?.o; fn(); const changed = invStateSig() !== sig0;
  if (invSel?.src === 'inv' && o && !p.inv.includes(o)) { const k = Object.keys(p.equip || {}).find(k2 => p.equip[k2] === o); invSel = k ? { src: 'eq', k } : null; }
  if (invSel?.src === 'stash' && !S.stash.includes(invSel.o)) invSel = null;
  if (invSel?.src === 'eq' && !p.equip?.[invSel.k]) invSel = null;
  if (modalOpen !== 'inventory') return changed;
  invPaint(true);
  const tgt = typeof flash === 'function' ? flash() : flash;
  if (tgt && S.settings.motion !== false) { const cls = changed ? 'flash' : 'shake'; tgt.classList.remove('flash', 'shake'); void tgt.offsetWidth; tgt.classList.add(cls); setTimeout(() => tgt.classList.remove(cls), 520); }
  if (changed) sfx('metal', 0.3, 0.22);
  return changed;
}
const dollEl = k => document.querySelector(`#doll .dslot[data-k="${k}"]`);
function invUI(body) {
  const p = S.player;
  body.className = '';
  body.innerHTML = `<div class="inv-layout inv2">
      <div class="inv-left"><div class="inv-bar"><div class="chips" id="inv-f"></div>
          <label class="inv-sort" title="Ordnen ändert nur die Anzeige. Die Reihenfolge im Gepäck bleibt.">Ordnen <select id="inv-sort">${INV_SORT.map(([k, n]) => `<option value="${k}"${(S.settings.invSort || 'found') === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
          <span class="inv-cnt" id="inv-cnt" title="Traglast: Plätze in der Tasche"></span></div>
        <div class="inv-grid" id="ig"></div>
        <div class="panel-title" style="margin-left:0;margin-top:12px">Lagerbestand</div><div class="inv-grid" id="sg"></div></div>
      <div class="inv-mid"><div class="doll" id="doll"><canvas id="doll-fig" width="150" height="214" title="Klick: Figur drehen"></canvas></div>
        <div class="doll-kpi" id="doll-kpi"></div></div>
      <div class="item-detail" id="det"></div></div>`;
  const onF = k => { invFilter = k; chipBar($('inv-f'), INV_CAT, invFilter, onF); invPaint(); }; chipBar($('inv-f'), INV_CAT, invFilter, onF);
  $('inv-sort').onchange = e => { S.settings.invSort = e.target.value; invPaint(); };
  const doll = $('doll');
  for (const [k, label, col, row] of DOLL) {
    const d = el('div', 'cell dslot'); d.dataset.k = k; d.dataset.base = 'cell dslot'; d.style.gridColumn = col; d.style.gridRow = row; d.dataset.card = '1';
    d._card = () => p.equip?.[k] ? itemCardHTML(p.equip[k], { short: true, equipped: true }) : `<div class="icard"><div class="ic-sub">${label}: leer</div></div>`;
    d.onclick = () => { const sel = invSel?.src === 'inv' ? invSel.o : null;
      if (sel && d.classList.contains('can')) return invAct(() => A.useOrEquip(p.inv.indexOf(sel)), () => dollEl(k));
      if (sel && d.classList.contains('no')) { toast(A.equipBlock(ITEMS[sel.key])); return invAct(() => {}, d); }
      invSel = p.equip?.[k] ? { src: 'eq', k } : null; invPaint(true); };
    d.ondblclick = () => { if (p.equip?.[k]) invAct(() => A.unequip(k), () => $('ig')); };
    d.draggable = true;
    d.ondragstart = e => { if (!p.equip?.[k]) return e.preventDefault(); DRAG = { src: 'eq', k }; e.dataTransfer.setData('text/plain', 'rf'); };
    d.ondragend = () => { DRAG = null; markTargets(invSel?.src === 'inv' ? invSel.o : null); };
    d.ondragover = e => { if (DRAG?.src === 'inv' && fitsSlot(k, DRAG.o)) e.preventDefault(); };
    d.ondrop = e => { e.preventDefault(); const o = DRAG?.o; DRAG = null; if (!o) return; const no = A.equipBlock?.(ITEMS[o.key]); if (no) { toast(no); return invAct(() => {}, d); }
      invAct(() => A.useOrEquip(p.inv.indexOf(o)), () => dollEl(k)); };
    doll.appendChild(d);
  }
  $('doll-fig').onclick = () => { figDir = (figDir + 1) % 4; paintFig(true); };
  const ig = $('ig');
  ig.ondragover = e => { if (DRAG && DRAG.src !== 'inv') e.preventDefault(); };
  ig.ondrop = e => { e.preventDefault(); const D = DRAG; DRAG = null; if (D?.src === 'eq') invAct(() => A.unequip(D.k), ig); else if (D?.src === 'stash') invAct(() => A.takeFromStash(S.stash.indexOf(D.o)), ig); };
  const sg = $('sg');
  if (hasStore()) { sg.ondragover = e => { if (DRAG?.src === 'inv') e.preventDefault(); }; sg.ondrop = e => { e.preventDefault(); const o = DRAG?.o; DRAG = null; if (o) invAct(() => A.toStash(p.inv.indexOf(o)), sg); }; }
  else sg.outerHTML = '<div class="ledger">Ohne Lagergebäude gibt es keinen gemeinsamen Vorrat.</div>';
  clearInterval(invTimer); invTimer = setInterval(() => { if (modalOpen !== 'inventory' || !$('ig')) return clearInterval(invTimer); invPaint(); }, 1000);   /* Figur und Rüstung laufend (Zustand, Verbündete nah) */
  invPaint(true);
}
function invCell(pos) {
  const c = el('div', 'cell'); c.dataset.card = '1';
  const at = () => { const i = $('ig')?._view?.[pos]; return i == null ? null : { i, s: S.player.inv[i] }; };
  c._card = () => { const r = at(); return r?.s ? itemCardHTML(r.s, { short: true }) : ''; };
  c.onclick = () => { const r = at(); if (!r?.s) { invSel = null; return invPaint(true); } delete r.s.nw; invSel = { src: 'inv', o: r.s }; invPaint(true); };
  c.ondblclick = () => { const r = at(); if (!r?.s) return; const sl = ITEMS[r.s.key]?.slot; invAct(() => A.useOrEquip(r.i), () => GEAR_SL.has(sl) ? dollEl(A.previewEquip?.(r.s)?.slot || sl) : c); };
  c.onmouseenter = () => { const r = at(); if (r?.s?.nw) { delete r.s.nw; setTimeout(invPaint, 0); } figHover(r?.s); };
  c.onmouseleave = () => figHover(null);
  c.draggable = true;
  c.ondragstart = e => { const r = at(); if (!r?.s) return e.preventDefault(); DRAG = { src: 'inv', o: r.s }; e.dataTransfer.setData('text/plain', 'rf'); markTargets(r.s); };
  c.ondragend = () => { DRAG = null; markTargets(invSel?.src === 'inv' ? invSel.o : null); };
  return c;
}
function stashCell(i) {
  const c = el('div', 'cell'); c.dataset.card = '1';
  c._card = () => S.stash[i] ? itemCardHTML(S.stash[i], { short: true }) : '';
  c.onclick = () => { invSel = S.stash[i] ? { src: 'stash', o: S.stash[i] } : null; invPaint(true); };
  c.ondblclick = () => { if (S.stash[i]) invAct(() => A.takeFromStash(i), () => $('ig')); };
  c.draggable = true;
  c.ondragstart = e => { if (!S.stash[i]) return e.preventDefault(); DRAG = { src: 'stash', o: S.stash[i] }; e.dataTransfer.setData('text/plain', 'rf'); };
  c.ondragend = () => { DRAG = null; };
  return c;
}
function invPaint(force = false) {
  const p = S.player, ig = $('ig'); if (!ig || !p) return;
  if (ig.childElementCount !== p.invCap) { ig.innerHTML = ''; for (let i = 0; i < p.invCap; i++) ig.appendChild(invCell(i)); }
  const view = invView(p); ig._view = view;
  [...ig.children].forEach((c, pos) => { const i = view[pos], s = i != null ? p.inv[i] : null;
    paintCell(c, s, { dim: !!s && invFilter !== 'all' && catOf(ITEMS[s.key]) !== invFilter, sel: !!s && invSel?.src === 'inv' && invSel.o === s, cmp: s ? cmpArrow(s) : '' }); });
  const cnt = $('inv-cnt'); if (cnt) { const k = p.inv.length / Math.max(1, p.invCap); cnt.innerHTML = `${icoTag('nav_inv', 1)} <b>${p.inv.length}/${p.invCap}</b><i class="bagbar"><u style="width:${Math.round(k * 100)}%" class="${k >= 1 ? 'full' : k > .8 ? 'high' : ''}"></u></i>`; }
  const sg = $('sg');
  const here = A.stashHere ? A.stashHere() : true; if (sg) sg.classList.toggle('stash-far', !here); if (sg) sg.title = here ? '' : 'Das Lager liegt in deiner Siedlung — dort kannst du ein- und auslagern.';
  const nS = Math.max(24, Math.ceil((S.stash.length + 1) / 6) * 6); if (sg) sg.title = (sg.title ? sg.title + ' ' : '') + `Lager ${S.stash.length}/${A.stashCap ? A.stashCap() : '∞'} (ein Lagerhaus bringt 24 Felder mehr)`;   /* Audit 3.4 */   /* D-7: das Lager zeigt alle Teile (vorher fest 24 Felder, der Rest war unsichtbar) */
  if (sg) { if (sg.childElementCount !== nS) { sg.innerHTML = ''; for (let i = 0; i < nS; i++) sg.appendChild(stashCell(i)); }
    [...sg.children].forEach((c, i) => paintCell(c, S.stash[i] || null, { sel: !!S.stash[i] && invSel?.src === 'stash' && invSel.o === S.stash[i] })); }
  for (const [k, label] of DOLL) { const d = dollEl(k); if (!d) continue; const s = p.equip?.[k];
    paintCell(d, s || null, { sel: invSel?.src === 'eq' && invSel.k === k, cls: s && s.cond != null && s.cond < .5 ? 'worn' : '', empty: `${DOLL_ICO[k] ? icoTag(DOLL_ICO[k], 2, 'ghost-ico') : ''}<span class="dlab">${label}</span>` }); }
  if (!DRAG) markTargets(invSel?.src === 'inv' ? invSel.o : null);
  paintFig(); paintKpi(); invDetail(force);
}
function figHover(s) {
  clearTimeout(figT);
  if (!s || !GEAR_SL.has(ITEMS[s.key]?.slot)) { if (figPrev) { figPrev = null; paintFig(); } return; }
  figT = setTimeout(() => { if (modalOpen !== 'inventory') return; figPrev = s; paintFig(); }, 350);   /* gedrosselt: Vorschau erst nach kurzem Verweilen (Bildcache) */
}
function paintFig(force = false) {
  const cv = $('doll-fig'), p = S.player; if (!cv || !p) return;
  let spec;
  try { if (figPrev) { const pv = A.previewEquip?.(figPrev), eq = { ...p.equip }; if (pv) { eq[pv.slot] = figPrev; if (ITEMS[figPrev.key]?.twohand) eq.offhand = null; } spec = SP.humanSpec({ ...p, spec: null, equip: eq }); }
    else spec = SP.humanSpec(p); } catch (e) { return; }
  const sig = JSON.stringify(spec) + figDir; if (!force && cv._sig === sig) return; cv._sig = sig;
  const c = cv.getContext('2d'), f = SP.humanFrame(spec, FIG_DIRS[figDir], 'i0'); if (!f) return;
  c.imageSmoothingEnabled = false; c.clearRect(0, 0, cv.width, cv.height);
  const s = Math.max(1, Math.floor(Math.min((cv.width - 8) / f.width, (cv.height - 12) / f.height)));
  c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(cv.width / 2, cv.height - 9, 13 * s, 3 * s, 0, 0, 7); c.fill();
  c.drawImage(f, Math.round((cv.width - f.width * s) / 2), Math.round(cv.height - 8 - f.height * s), f.width * s, f.height * s);
  cv.classList.toggle('prev', !!figPrev);
}
const r1 = v => Math.round(v * 10) / 10;
function paintKpi() {
  const box = $('doll-kpi'), p = S.player; if (!box) return;
  const ap = A.armorParts?.(p) || { total: A.armorOf(p), pieces: [], sum: A.armorOf(p), wear: 0, sturdy: 0, set: 0, rest: 0, setName: '' }, dmg = Math.round(A.damageOf?.(p) || 0);
  const worn = Object.values(p.equip || {}).some(s => s && s.cond != null && s.cond < .5);
  const tip = `Rüstung ${ap.total} — Teile ${r1(ap.sum)}${ap.wear >= 0.5 ? ` (Verschleiß kostet ${r1(ap.wear)})` : ''}${ap.sturdy ? ` · Härte +${r1(ap.sturdy)}` : ''}${ap.set ? ` · Set ${ap.setName} +${ap.set}` : ''}${Math.abs(ap.rest) >= 0.5 ? ` · Stufe, Talente, Narben, Segen ${ap.rest > 0 ? '+' : ''}${r1(ap.rest)}` : ''}. Rüstung mindert jeden Treffer.`;
  const all = Math.max(1, ap.total + ap.wear), seg = (v, cls, t) => v > 0.05 ? `<i class="${cls}" style="width:${(v / all * 100).toFixed(1)}%" title="${t}"></i>` : '';
  const h = `<div class="kpi-row"><span class="kpi big" title="${tip}">${icoTag('set_level', 2)}<b>${ap.total}</b></span>
      <span class="kpi" title="Schaden je Hieb mit Waffe, Zustand, Fertigkeit, Stufe und Talenten">${icoTag('log_combat', 2)}<b>${dmg}</b></span>
      ${worn ? `<span class="kpi warn" title="Abgenutzt (unter 50 %): ein Schmied bessert aus — „Kannst du das ausbessern?“">${icoTag('nav_build', 2)}</span>` : ''}
      ${ap.setName ? `<span class="kpi set" title="Set aktiv: ${ap.setName}">${icoTag('bar_xp', 2)}</span>` : ''}</div>
    <div class="abar" title="${tip}">${seg(ap.sum, 'a-piece', 'Teile')}${seg(ap.wear, 'a-wear', 'Verschleiß')}${seg(ap.sturdy, 'a-sturdy', 'Härte')}${seg(ap.set, 'a-set', 'Set')}${seg(Math.max(0, ap.rest), 'a-rest', 'Stufe, Talente, Narben, Segen')}</div>`;
  if (box._h !== h) { box._h = h; box.innerHTML = h; }
}
function invDetail(force) {
  const d = $('det'), p = S.player; if (!d) return;
  const sig = (invSel ? invSel.src + (invSel.k || '') + (invSel.o ? (p.inv.indexOf(invSel.o) + '/' + S.stash.indexOf(invSel.o)) : '') : '-') + '#' + invStateSig() + (invSel?.o?.lock ? 'L' : '');
  if (!force && d._sig === sig) return; d._sig = sig;
  if (!invSel) { d.innerHTML = `<div class="inv-help"><p class="lore">Ein Gegenstand, der zählt, wiegt mehr als zehn, die es nicht tun.</p>
    <div class="ledger">Klick: ansehen · Doppelklick: anlegen oder benutzen · Ziehen: auf die Figur, ins Lager, zurück in die Tasche.<br>Antippen: Teil wählen, dann den leuchtenden Platz an der Figur tippen.<br>${LOCK_SVG} Gesperrtes lässt sich nicht verkaufen und nicht ablegen. <span class="nwm inl">NEU</span> verschwindet, wenn du es ansiehst.</div></div>`; return; }
  const wire = (id, f) => { const b = $(id); if (b) b.onclick = f; };
  if (invSel.src === 'eq') { const k = invSel.k, s = p.equip[k];
    d.innerHTML = itemCardHTML(s, { equipped: true, more: true }) + `<div class="ctx-actions"><button id="d-off">Ablegen (in die Tasche)</button></div>`;
    wire('d-off', () => invAct(() => A.unequip(k), () => $('ig')));
  } else if (invSel.src === 'stash') { const i = S.stash.indexOf(invSel.o);
    d.innerHTML = itemCardHTML(invSel.o, { more: true }) + `<div class="ctx-actions"><button id="d-take">Entnehmen</button></div>`;
    wire('d-take', () => invAct(() => A.takeFromStash(i), () => $('ig')));
  } else { const slot = invSel.o, i = p.inv.indexOf(slot), it = ITEMS[slot.key]; if (i < 0) { invSel = null; return invDetail(true); }
    d.innerHTML = itemCardHTML(slot, { more: true }) + `<div class="ctx-actions">
      ${it.slot === 'consumable' ? `<button id="d-use">${it.use === 'bandage' ? 'Anlegen' : 'Benutzen'}</button>` : it.slot !== 'material' ? '<button id="d-use">Anlegen</button>' : ''}
      ${it.slot === 'consumable' || it.slot === 'weapon' ? '<button id="d-hot">Auf Leiste legen</button>' : ''}
      ${A.bandageFrom(slot.key) ? `<button id="d-craft">${A.bandageFrom(slot.key)} Verbände schneiden</button>` : ''}
      ${slot.key === 'magiekern' ? '<button id="d-smash">Zerschlagen</button>' : ''}
      <button id="d-lock" class="${slot.lock ? 'on' : ''}" title="Gesperrtes lässt sich nicht verkaufen und nicht ablegen.">${LOCK_SVG} ${slot.lock ? 'Entsperren' : 'Sperren'}</button>
      <button id="d-drop"${slot.lock ? ' disabled title="Gesperrt"' : ''}>Ablegen</button>
      ${hasStore() ? '<button id="d-stash">Ins Lager</button>' : ''}</div>`;
    const sl = it.slot;
    wire('d-use', () => invAct(() => A.useOrEquip(p.inv.indexOf(slot)), () => GEAR_SL.has(sl) ? dollEl(A.previewEquip?.(slot)?.slot || sl) : null));
    wire('d-hot', () => { if (A.toHotbar(slot.key) !== false) toast('Auf Leiste gelegt'); });
    wire('d-craft', () => invAct(() => A.craftBandage(p.inv.indexOf(slot))));
    wire('d-smash', () => invAct(() => A.coreSmash?.()));   // S15 P7: Magiekern zerschlagen
    wire('d-lock', () => { if (slot.lock) delete slot.lock; else slot.lock = true; invPaint(true); });
    wire('d-drop', () => invAct(() => A.dropItem(p.inv.indexOf(slot))));
    wire('d-stash', () => invAct(() => A.toStash(p.inv.indexOf(slot)), () => $('sg')));
  }
  const det = d.querySelector('details.ic-more'); if (det) det.ontoggle = () => { moreOpen = det.open; };
  paintIcons(d);
}
// S13 (Nutzer: „beim Kauf ein kleines Info-Fenster, was es ist und was es macht“): Beschreibung eines Gegenstands — Werte wie im
// Inventar plus ein Satz, wofür er gut ist. Genutzt von Inventar und Handel.
const USE_TXT = { bandage: 'Anlegen dauert 2,5 s: heilt das schlimmste Körperteil und stillt Blutungen.', heal: 'Trinken: heilt sofort Leben.', food: 'Essen: gibt Ausdauer zurück, heilt keine Wunden.',
  soul: 'Seelenphiole: Essenz für Totenrufer, Linderung für Hexer.', prosthesis: 'Ersetzt ein verlorenes Glied (in Gelenkhall anpassen lassen).',
  eye: 'Roboterauge einsetzen: ersetzt ein schwächeres Auge. Magie- und Schattentreffer nutzen es ab, unter 30 % wirkt es nicht.',   /* Roadmap P2 */
  mechmod: 'Modul auf eine Prothese stecken (Arm- oder Beinprothese nötig). Ein altes Modul kommt zurück in die Tasche.',   /* Roadmap P3 */
  mechkit: 'Wartung: bringt die am stärksten abgenutzte Prothese oder das Auge um 25 Punkte hoch (höchstens 90 %).' };   /* Roadmap P4 */
function itemPurpose(it) {
  if (it.good) return 'Handelsware: jede Stadt zahlt einen anderen Preis — billig kaufen, wo es viel gibt, teuer verkaufen, wo es fehlt.';
  if (it.res) return 'Baustoff: kommt in deinen Vorrat (Lager, Siedlung, Ausbessern).';
  if (it.slot === 'consumable') return USE_TXT[it.use] || 'Verbrauchsgut.';
  if (it.slot === 'weapon') return `${{ sword: 'Schwert', axe: 'Axt', great: 'Zweihänder', mace: 'Streitkolben', hammer: 'Hammer', spear: 'Speer', polearm: 'Stangenwaffe', dagger: 'Dolch', rapier: 'Rapier', bow: 'Bogen', crossbow: 'Armbrust', staff: 'Stab', wand: 'Zauberstab', whip: 'Peitsche' }[it.wtype] || 'Waffe'}${it.twohand ? ' (zweihändig)' : ''}: ${it.ranged ? 'Fernkampf — braucht freie Sicht.' : it.twohand ? 'schwer und langsam, trifft hart und unterbricht Angriffe.' : 'Nahkampf.'}`;
  if (it.slot === 'offhand') return 'Schild: blockt Treffer von vorn, wenn du in Deckung gehst.';
  if (it.armor) return 'Rüstung: mindert jeden Treffer um den Rüstungswert.';
  if (it.slot === 'material') return 'Material: für Aufträge, Handwerk oder zum Verkauf.';
  return '';
}
export function itemInfoHTML(slot, cmpWith = true, lite = false) {   /* lite: ohne Kopf und Affixe (stehen schon in der Bildkarte) */
  const it = ITEMS[slot.key], p = S.player, cur = cmpWith && it.slot && p.equip?.[it.slot];
  const cmp = (a, b) => a === b ? '' : a > b ? `<span class="better">+${+(a - b).toFixed(1)}</span>` : `<span class="worse">${+(a - b).toFixed(1)}</span>`;
  const rar = slot.rar || it.rarity || 'common', leg = slot.leg || it.leg;
  let h = lite ? '' : `<h3 class="r-${rar}">${slot.name || it.name}</h3><div class="s-key">${RARITY[rar]} · ${slotLabel(it.slot)}</div>`;
  const pu = itemPurpose(it); if (pu) h += `<div class="ledger" style="margin:4px 0">${pu}</div>`;
  if (it.sdesc) h += `<div class="ledger" style="margin:4px 0">${it.sdesc}</div>`;   /* Schildart erklären */
  if (slot.qual) h += `<div class="ledger" style="margin:4px 0">Güte: ${slot.qual}${slot.maker ? ` · gefertigt von ${slot.maker}` : ''}</div>`;   /* Nutzer §5d.8: Handwerk */
  if (it.energy) h += `<div class="ledger" style="margin:4px 0">Magitech · Energie ${slot.charge ?? 100}/100 · ${it.energy} je Schuss${it.splash ? ' · Streuung' : ''}${it.pierce ? ' · durchschlägt einen Gegner' : ''}${it.mstatus ? ` · ${it.mstatus.key === 'shocked' ? 'lähmt' : 'setzt in Brand'} (${Math.round(it.mstatus.chance * 100)} %)` : ''}. Leer schießt sie nicht — Energiezelle benutzen.</div>`;   /* Roadmap C.10 */
  if (it.desc && ['prosthesis', 'eye', 'mechmod', 'mechkit'].includes(it.use)) h += `<div class="ledger" style="margin:4px 0">${it.desc}</div>`;   /* Bionik-Test: Wirkung des Teils zeigen (desc stand sonst nirgends) */
  if (slot.used) h += `<div class="stat" title="Gebraucht vom Schwarzmarkt: kommt beim Einsetzen mit weniger Zustand."><span>Gebraucht</span><b>${slot.used} % Zustand</b></div>`;
  if (!lite) for (const [k, v] of Object.entries(slot.afx || {})) h += `<div class="affix${AFFIXES[k]?.major ? ' major' : ''}">${AFFIXES[k]?.name}: ${AFFIXES[k]?.fmt(v)}</div>`;
  if (!lite && leg && LEGENDS[leg]) h += `<div class="legend-fx">«${LEGENDS[leg].name}» — ${LEGENDS[leg].desc}</div>`;
  if (it.lore || slot.lore) h += `<div class="lore">${slot.lore || it.lore}</div>`;
  if (slot.history) h += `<div class="lore">${slot.history.join('<br>')}</div>`;
  if (it.dmg) h += `<div class="stat"><span>Schaden</span><b>${it.dmg} ${cur && ITEMS[cur.key].dmg ? cmp(it.dmg, ITEMS[cur.key].dmg) : ''}</b></div>`;
  if (it.speed) h += `<div class="stat"><span>Angriffszeit</span><b>${(it.speed / 1000).toFixed(2)} s</b></div>`;
  if (it.reach) h += `<div class="stat"><span>Reichweite</span><b>${it.reach}</b></div>`;
  if (it.stam) h += `<div class="stat"><span>Ausdauer je Hieb</span><b>${it.stam}</b></div>`;
  if (it.ap) h += `<div class="stat"><span>Panzerbrechend</span><b>${Math.round(it.ap * 100)}%</b></div>`;
  if (it.crit) h += `<div class="stat"><span>Kritischer Faktor</span><b>×${it.crit}</b></div>`;
  if (it.armor) h += `<div class="stat"><span>Rüstung</span><b>${it.armor} ${cur ? cmp(it.armor, ITEMS[cur.key].armor || 0) : ''}</b></div>`;
  if (it.block) h += `<div class="stat"><span>Block</span><b>${Math.round(it.block * 100)}%</b></div>`;
  if (it.heal) h += `<div class="stat"><span>Heilung</span><b>${it.heal}</b></div>`;
  if (slot.cond != null) h += `<div class="stat" title="${it.dmg ? 'Abgenutzte Waffen verlieren bis zu 45 % Schaden' : 'Abgenutzte Rüstung schützt bis zu 60 % weniger'}. Ein Schmied bessert alles aus (Kannst du das ausbessern?). Selbst an Esse, Amboss oder Werkbank mit Eisenerz, aber nur bis 80 %."><span>Zustand</span><b>${Math.round(slot.cond * 100)}%</b></div>`;
  h += `<div class="stat"><span>Grundwert</span><b>${Math.round(it.value * (RARITY_VALUE[rar] || 1))} Gold</b></div>`;
  return h;
}
/* Visueller Umbau P5 (IMPL-ITEMS): Bildkarte — großes Pixel-Icon, Name in Seltenheitsfarbe mit Marke (Form zuerst, dann Farbe),
   Kennzahlen als Piktogramme mit Vergleichspfeil, Werte-Vorschau aus armorOf/damageOf (previewEquip), Affixe mit Spanne,
   Set-Liste; der Rest (Zweck, Lore, alle Werte) aufklappbar. o.short = Kurzform für den schwebenden Tooltip. */
const KP = (ico, val, tip, d = '', cls = '') => `<span class="kp${cls ? ' ' + cls : ''}" title="${tip}">${icoTag(ico, 2)}<b>${val}</b>${d}</span>`;
const dlt = (a, b, dig = 1) => { const d = +(a - b).toFixed(dig); return !d ? '' : `<em class="${d > 0 ? 'up' : 'dn'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</em>`; };
export function itemCardHTML(slot, o = {}) {
  const it = slot && ITEMS[slot.key]; if (!it) return '';
  const p = S.player, rar = rarOfS(slot), gear = GEAR_SL.has(it.slot), leg = slot.leg || it.leg;
  const curS = !o.equipped && gear ? p?.equip?.[it.slot] : null, cur = curS && ITEMS[curS.key];
  const k = [];
  if (it.dmg) k.push(KP('log_combat', it.dmg, 'Schaden der Waffe', cur?.dmg ? dlt(it.dmg, cur.dmg) : ''));
  if (it.armor) k.push(KP('set_level', it.armor, 'Rüstung des Teils', gear && !o.equipped ? dlt(it.armor, cur?.armor || 0) : ''));
  if (it.block) k.push(KP('set_level', Math.round(it.block * 100) + '%', 'Block (Schild)'));
  if (it.speed) k.push(KP('time', (it.speed / 1000).toFixed(2) + ' s', 'Angriffszeit — kürzer ist schneller', cur?.speed ? dlt(cur.speed / 1000, it.speed / 1000, 2) : ''));
  if (it.stam) k.push(KP('bar_st', it.stam, 'Ausdauer je Hieb'));
  if (it.heal) k.push(KP('bar_hp', it.heal, 'Heilung'));
  if (slot.cond != null) k.push(KP('nav_build', Math.round(slot.cond * 100) + '%', 'Zustand — abgenutzt wirkt es schwächer; ein Schmied bessert aus.', '', slot.cond > .5 ? '' : 'bad'));
  else if (o.shop && gear) k.push(KP('nav_build', '55–100%', 'Ladenware kommt gebraucht: Zustand 55 bis 100 %.'));
  if ((slot.count || 1) > 1) k.push(KP('nav_inv', '×' + slot.count, 'Anzahl im Stapel'));
  let h = `<div class="icard ic-${rar}"><div class="ic-head"><canvas class="ic-ico" data-ico="${slot.key}"></canvas>
    <div class="ic-ttl"><div class="ic-name r-${rar}">${slot.name || it.name}</div><div class="ic-sub">${rarMark(rar)}${RARITY[rar]} · ${slotLabel(it.slot)}${slot.lock ? ' · ' + LOCK_SVG + ' gesperrt' : ''}${o.equipped ? ' · angelegt' : ''}</div></div></div>`;
  if (k.length) h += `<div class="ic-kpi">${k.join('')}</div>`;
  if (gear && !o.equipped && !o.short && A.previewEquip) {          /* Werte-Vorschau nur mit den Formeln des Spiels */
    const pv = A.previewEquip(o.shop ? { ...slot, cond: 1 } : slot), pl = o.shop ? A.previewEquip({ ...slot, cond: 0.55 }) : null;
    const row = (ico, name, a, b, lo) => { const d = +(b - a).toFixed(1); if (Math.abs(d) < 0.05 && (!lo || Math.abs(lo - a) < 0.05)) return '';
      return `<span class="pv" title="${name} gesamt nach dem Anlegen${lo != null ? ' (je nach Zustand der Ware)' : ''}">${icoTag(ico, 1)} ${r1(a)} → <b>${lo != null && Math.abs(lo - b) >= 0.05 ? r1(lo) + '–' : ''}${r1(b)}</b>${dlt(b, a)}</span>`; };
    if (pv) { const s = row('set_level', 'Rüstung', pv.armor[0], pv.armor[1], pl?.armor[1]) + row('log_combat', 'Schaden je Hieb', pv.dmg[0], pv.dmg[1], pl?.dmg[1]);
      if (s) h += `<div class="ic-prev">${s}</div>`; }
    const set0 = A.setOf?.(); if (set0 && curS && (ARMOR_SETS[set0.key]?.pieces || []).includes(curS.key) && !(ARMOR_SETS[set0.key]?.pieces || []).includes(slot.key)) h += `<div class="ic-warn">Bricht das Set „${set0.name}“</div>`;
  }
  const afx = Object.entries(slot.afx || {});
  if (afx.length) h += `<div class="ic-afx">${afx.map(([ak, v]) => { const Af = AFFIXES[ak]; if (!Af) return ''; const [a, b] = Af.v || [v, v], q = b > a ? Math.max(0, Math.min(1, (v - a) / (b - a))) : 1;
    return `<div class="affix${Af.major ? ' major' : ''}" title="${Af.v ? 'Spanne ' + Af.fmt(a) + ' bis ' + Af.fmt(b) : ''}">${Af.major ? '<i class="rune"></i>' : '<i class="afd"></i>'}${Af.name}: ${Af.fmt(v)}<span class="afr"><u style="width:${Math.round(q * 100)}%"></u></span></div>`; }).join('')}</div>`;
  if (leg && LEGENDS[leg]) h += `<div class="legend-fx"><i class="rune leg"></i>«${LEGENDS[leg].name}» — ${LEGENDS[leg].desc}</div>`;
  const SET = Object.values(ARMOR_SETS).find(St => St.pieces.includes(slot.key) || (St.extra || []).includes(slot.key));
  if (SET) { const all = [...SET.pieces, ...(SET.extra || [])], worn = pk => Object.values(p?.equip || {}).some(s => s && s.key === pk), n = all.filter(worn).length;
    h += `<div class="ic-set"><div><b>Set ${SET.name}</b> <span class="setn">${n}/${all.length}</span></div><div class="setp">${all.map(pk => `<span class="${worn(pk) ? 'on' : ''}">${ITEMS[pk]?.name || pk}</span>`).join('')}</div>
      <small>Alle Grundteile (${SET.pieces.length}): ${SET.desc}${SET.tdesc ? ' · ' + SET.tdesc : ''}</small></div>`; }
  if (o.price) h += o.price;
  if (!o.short) h += `<details class="ic-more"${moreOpen || o.open ? ' open' : ''}><summary>Mehr: Zweck, Herkunft, alle Werte</summary>${itemInfoHTML(slot, !o.equipped, true)}</details>`;
  else if (it.lore || slot.lore) h += `<div class="lore ic-lore">${slot.lore || it.lore}</div>`;
  return h + '</div>';
}
const slotLabel = s => ({ weapon:'Waffe', offhand:'Nebenhand', head:'Kopf', chest:'Rumpf', hands:'Hände', legs:'Beine', feet:'Füße', cloak:'Umhang', talisman:'Talisman', consumable:'Verbrauch', material:'Material' }[s] || s || 'Gegenstand');   /* P5-Fehler: Hände, Beine, Talisman fehlten */

// ---- Körpertafel (Trefferzonen) ----
// Vorderansicht wie auf einer Feldschertafel: die rechte Körperseite liegt im Bild links.
// Pixelfigur auf einem 30×54-Raster (dieselbe Sprache wie die Sprites): Rechtecke, harte Kanten, dunkle Kontur.
const PART_PX = {
  head:  [[11, 1, 8, 1], [10, 2, 10, 8], [11, 10, 8, 1]],
  torso: [[9, 12, 12, 2], [8, 14, 14, 12], [9, 26, 12, 5]],
  rarm:  [[5, 13, 3, 2], [4, 15, 3, 10], [3, 25, 3, 5]],
  larm:  [[22, 13, 3, 2], [23, 15, 3, 10], [24, 25, 3, 5]],
  rleg:  [[9, 32, 5, 16], [8, 48, 6, 3]],
  lleg:  [[16, 32, 5, 16], [16, 48, 6, 3]],
};
const STATE_WORD = { heil:'heil', verwundet:'verwundet', kritisch:'kritisch', aus:'ausgefallen' };
export function bodyChart(c, { big = false, click = false } = {}) {
  if (!c.body) return '';
  const uid = 'h' + Math.random().toString(36).slice(2, 7);
  const rects = (list, pad, attrs = '') => list.map(([x, y, w, h]) => `<rect x="${x - pad}" y="${y - pad}" width="${w + pad * 2}" height="${h + pad * 2}"${attrs}/>`).join('');
  return `<svg class="bodychart ${big ? 'big' : ''}" viewBox="0 0 30 54" shape-rendering="crispEdges" role="img" aria-label="Körperzustand ${c.name}">
    <defs><pattern id="${uid}" width="2" height="2" patternUnits="userSpaceOnUse">
      <rect width="2" height="2" fill="#2a120e"/><rect width="1" height="1" fill="#8c2a22"/><rect x="1" y="1" width="1" height="1" fill="#8c2a22"/></pattern></defs>
    <g fill="#0c0a08">${PARTS.map(p => rects(PART_PX[p], 1)).join('')}</g>
    ${PARTS.map(p => {
      const st = partState(c.body[p]), mn = mechNote(c.body[p]);   /* Roadmap P5: Prothese markieren */
      const label = `${PART_NAME[p]}: ${Math.max(0, Math.round(c.body[p].hp))}/${c.body[p].max} — ${STATE_WORD[st]}${mn ? ` · ${mn}` : ''}`;
      return `<g class="bp bp-${st}${c.body[p].mech ? ' bp-mech' : ''}${click ? ' bp-click' : ''}" data-part="${p}" data-tip="${label}" aria-label="${label}" ${st === 'aus' ? `fill="url(#${uid})"` : ''}>${rects(PART_PX[p], 0)}
        ${rects(PART_PX[p].slice(0, 1), 0, ' class="bp-hi"')}</g>`;
    }).join('')}
  </svg>`;
}
/* Roadmap P5: Kurztext einer Prothese (Stufe, Zustand, Modul) oder '' */
const brokeNote = P => P?.broken ? `Gebrochen: heilt nur bis 40 %, noch ${P.broken} Tag(e)${P.splint ? ', geschient' : ' — Heilerin kann schienen'}` : '';   /* Nutzer §5e.7 */
const mechNote = P => { if (!P?.mech) return brokeNote(P); const c = Math.round(P.mechCond ?? 100);
  return `Prothese ${MECH_Q[P.mech]?.name || ''} (Stufe ${P.mech}), Zustand ${c} %${c < 30 ? ' — wirkungslos' : c < 50 ? ' — halbe Wirkung' : ''}${P.mechUp ? `, Aufrüstung ${P.mechUp}` : ''}${P.mod && MECH_MOD[P.mod] ? `, Modul ${MECH_MOD[P.mod].name}` : ''}`; };
/* Roadmap P5: Bionik im Charakterbogen — jede Prothese und das Auge mit Stufe, Zustand, Modul; Hinweis auf Wartung */
function bionicBlock(p) {
  const rows = PARTS.filter(k => p.body?.[k]?.mech).map(k => `<div class="bp-mech" title="${mechNote(p.body[k])}"><dt>${PART_NAME[k]} ⚙</dt><dd>${mechNote(p.body[k]).replace(/^Prothese /, '')}</dd></div>`);
  const E = p.eye, ec = Math.round(E?.cond ?? 100), X = E?.q ? EYE_Q[E.q] || EYE_Q[2] : null;
  rows.push(`<div title="${X ? `Sichtweite ${X.fog} Felder${X.crit ? `, Fernkampf-Krit +${Math.round(X.crit * 100)} %` : ''}${X.light ? `, Nachtsicht +${Math.round(X.light * 100)} %` : ''}${X.heat ? ', Wärmesicht' : ''}. Magie nutzt es ab.` : 'Roboteraugen setzen Medica in Aurelion und Meisterin Vell ein.'}"><dt>Auge</dt><dd>${X ? `${X.name} (Stufe ${E.q}), Zustand ${ec} %${ec < 30 ? ' — gestört' : ''}` : 'natürlich'}</dd></div>`);
  return `<h3>Bionik</h3><dl class="ledger-list">${rows.join('')}</dl>${rows.length > 1 || X ? '<p class="tafel-hint">Wartung: Spezialöl, Feinwerkzeug an Werkbank oder Amboss, Kybernetiker in Aurelion.</p>' : ''}`;
}
function woundNotes(c, click) {
  return PARTS.map(p => {
    const P = c.body[p], st = partState(P), pct = Math.max(0, P.hp / P.max * 100), mn = mechNote(P);
    return `<button class="wound w-${st}${P.mech ? ' bp-mech' : ''}" data-part="${p}" ${click ? '' : 'tabindex="-1"'}${mn ? ` title="${mn}"` : ''}>
      <span class="w-name">${PART_NAME[p]}${P.mech ? ' ⚙' : ''}${P.broken ? ' ✚' : ''}</span><span class="w-val">${P.lost ? 'ab' : Math.round(P.hp)}<small>/${P.max}</small></span>
      <span class="w-bar"><i style="width:${pct}%"></i></span><span class="w-state">${STATE_WORD[st]}</span></button>`;
  }).join('');
}

// ---- Charakterbogen: Wundarzt-Tafel ----
function charUI(body, who) {
  const p = who || S.player, isPlayer = p === S.player;
  const ATTRS = { strength:'Stärke', agility:'Beweglichkeit', endurance:'Ausdauer', intelligence:'Intelligenz', perception:'Wahrnehmung', willpower:'Willenskraft' };
  const ATTR_TIP = { strength: 'Nahkampfschaden', agility: 'Fernkampfschaden, Lauftempo, Ausweichen', endurance: 'Leben, Ausdauer, Erholung', intelligence: 'Mana und Zauberschaden; manche Zauber verlangen einen Mindestwert',
    perception: 'Chance auf kritische Treffer', willpower: 'Mana, Überzeugen im Rat und in Gesprächen' };   // S15 (Nutzer): erklären, was ein Punkt bringt
  const SKILLS = SKILL_NAMES;
  /* S15 Hinweise: jede Fertigkeit erklärt beim Überfahren, wie sie steigt und was sie bewirkt. Ohne Wirkung wird es offen gesagt. */
  const WPN_TIP = 'Steigt mit jedem Treffer mit dieser Waffenart. Mehr Schaden und schnellere Hiebe.';
  const SKILL_TIP = { onehanded: WPN_TIP, twohanded: WPN_TIP, polearms: WPN_TIP, archery: 'Steigt mit jedem Schuss. Mehr Schaden und schnelleres Spannen.',
    defense: 'Steigt, wenn du getroffen wirst oder abwehrst. Chance, Hiebe von vorn abzuwehren (weniger Schaden).',
    medicine: 'Steigt beim Verbinden und Heilen mit Verbänden und Kräutern. Jeder Verband heilt mehr.',
    toughness: 'Steigt mit jedem Treffer, den du einsteckst. Du liegst kürzer bewusstlos.',
    survival: 'Steigt beim Holzfällen und beim Zähmen von Tieren. Zähmen gelingt öfter.',
    trading: 'Steigt mit jedem Kauf und Verkauf. Bessere Preise bei Händlern.',
    leadership: 'Steigt bei Siegen mit Gefährten und bei Befehlen im Kampf. Je 10 Punkte ein Gefährte mehr in der Gruppe; Loyalität wächst schneller.',
    smithing: 'Steigt beim Ausbessern an Esse, Amboss oder Werkbank. Hebt die Grenze der Selbstwartung von Prothesen (70 % + Wert/5).',   /* Roadmap P4 */
    hunting: 'Steigt beim Erlegen von Tieren. Mehr Felle, Fleisch und Knochen (bis +60 %); Tiere bemerken dich später (bis 40 % kürzere Sicht).',
    crafting: 'Steigt beim Herstellen an der Werkbank. Bessere Qualität, schwerere Rezepte; hilft beim Anpacken.',
    stealth: 'Schleichen (Taste V): Gegner bemerken dich später (bis nur noch 30 % ihrer Sicht). Wächst, wenn du nah an ahnungslosen Gegnern vorbeischleichst. Hilft auch beim Hineinschleichen und Stehlen.' };
  const chain = classChain(p.currentClass), bld = buildOf(p);
  const bandages = S.player.inv.filter(x => x.key === 'bandage').reduce((n, x) => n + (x.count || 1), 0);
  const skills = Object.entries(SKILLS).filter(([k]) => (p.skills[k] || 0) >= 1);
  const EQ = [['weapon', 'Waffe'], ['offhand', 'Nebenhand'], ['head', 'Kopf'], ['chest', 'Rumpf'], ['hands', 'Hände'], ['legs', 'Beine'], ['feet', 'Füße'], ['cloak', 'Umhang'], ['talisman', 'Talisman']];
  body.innerHTML = `<div class="tafel">
    <header class="tafel-head">
      <h2>${p.name}</h2>
      <p>${CLASSES[p.currentClass].name} · Stufe ${p.level} · ${bld.name} · ${p.age} Jahre${isPlayer ? ` · Haus ${S.legacy.house}, Generation ${S.legacy.gen}` : ''}</p>
      ${p.titles?.length ? `<p class="titles">${p.titles.map(t => `„${t}“`).join(' · ')}</p>` : ''}
      ${isPlayer && A.fameList ? `<p class="ledger">Ruhm: ${A.fameList().map(f => `${f.n} <b>${f.t}</b> (${f.v})`).join(' · ')}</p>` : ''}
      ${isPlayer && A.styleList?.().length ? `<p class="ledger" title="Gnade (Verschonen, Laufenlassen, Anwerben) gegen Grausamkeit (Hinrichten, hartes Verhör, Gnadenstoß an Menschen). Barmherzig: Menschen ergeben sich öfter, Banden verlangen weniger. Schlächter: niemand ergibt sich mehr, Gegner fliehen früher, Banden meiden dich.">Klinge: ${A.styleList().map(f => `${f.n} <b>${f.t}</b> (${f.v > 0 ? '+' : ''}${f.v})`).join(' · ')}</p>` : ''}
    </header>
    <section class="tafel-befund">
      <h3>Befund</h3>
      <dl class="ledger-list">${Object.entries(ATTRS).map(([k, n]) => `<div><dt>${n}</dt><dd>${p.attributes[k]}</dd></div>`).join('')}</dl>
      ${isPlayer && p.attrPoints > 0 ? `<div class="ap-box" id="ap-box"><p>${p.attrPoints} freie${p.attrPoints > 1 ? '' : 'r'} Punkt${p.attrPoints > 1 ? 'e' : ''}</p>
        ${Object.entries(ATTRS).map(([k, n]) => `<button data-a="${k}" title="${ATTR_TIP[k]}">${n} +1</button>`).join('')}<p class="ledger">Einen Punkt je Stufe, einen extra alle fünf Stufen. Maus über den Knopf zeigt, was der Wert bewirkt.</p></div>` : ''}
      <h3>Werte</h3>
      <dl class="ledger-list">
        <div><dt>Rüstung</dt><dd>${A.armorOf(p)}</dd></div>
        <div><dt>Schaden</dt><dd>${A.damageOf(p).toFixed(1)}</dd></div>
        <div><dt>Ausdauer</dt><dd>${Math.round(p.stamina)}/${p.maxStamina}</dd></div>
        <div><dt>Tempo</dt><dd>${Math.round(bld.speed * 100)} %</dd></div>
        <div><dt>Feinde getötet</dt><dd>${p.kills || 0}</dd></div>
      </dl>
      <h3>Wesen</h3><p class="traits">${(p.traits || []).join(' · ') || '—'}</p>
    </section>
    <section class="tafel-koerper">
      <div class="chart-wrap">${bodyChart(p, { big: true, click: true })}</div>
      <div class="wounds" id="wounds">${woundNotes(p, true)}</div>
      <p class="tafel-hint">${bandages ? `Körperteil anklicken, um einen Verband anzulegen · ${bandages} Verbände im Gepäck` : 'Keine Verbände im Gepäck. Mara und Gerold verkaufen welche, aus Tuch lassen sie sich schneiden.'}</p>
      ${bionicBlock(p)}
    </section>
    <section class="tafel-ruest">
      <h3>Rüstzeug</h3>
      <canvas id="ch-figure" width="232" height="110" style="display:block;margin:0 0 8px;background:#120f0b;border:1px solid #2f271d"></canvas>
      <dl class="ledger-list">${EQ.map(([k, n]) => `<div><dt>${n}</dt><dd>${p.equip[k] ? ITEMS[p.equip[k].key].name : '—'}</dd></div>`).join('')}</dl>
      <h3>Klassenweg</h3>
      <ol class="path">${chain.map((c, i) => `<li class="${i === chain.length - 1 ? 'now' : ''}">${CLASSES[c].name}</li>`).join('')}</ol>
      ${isPlayer && p.knownClasses?.length > 1 ? '<button class="txtbtn" id="ch-switch">Klasse wechseln</button>' : ''}
      <h3>Fähigkeiten</h3>
      <p class="traits">${(p.abilities || []).map(a => ABILITIES[a].name).join(' · ') || 'Noch keine. Lehrer findet man in der Welt.'}</p>
      ${titleBlock(p, isPlayer)}
      ${isPlayer ? `<h3>Talente</h3><p class="traits">${Object.keys(p.tree || {}).map(k => SKILL_TREE[k]?.name).filter(Boolean).join(' · ') || 'Noch keine.'}${p.skillPoints ? ` · <b style="color:var(--gold)">${p.skillPoints} frei (T)</b>` : ''}</p>` : ''}
      <h3>Fertigkeiten</h3>
      <dl class="ledger-list">${skills.map(([k, n]) => `<div title="${SKILL_TIP[k] || ''}"><dt>${n}</dt><dd>${Math.floor(p.skills[k])}</dd></div>`).join('') || '<div><dt>Noch ungeübt</dt><dd>—</dd></div>'}</dl>
    </section>
  </div>`;
  if ($('ch-figure')) drawFigureTo($('ch-figure'), p);
  const doBandage = part => { A.bandage(p, part); closeModal(); };
  body.querySelectorAll('[data-part]').forEach(el => el.addEventListener('click', () => doBandage(el.dataset.part)));
  if ($('ap-box')) [...$('ap-box').querySelectorAll('button')].forEach(b => b.onclick = () => { A.spendAttr(b.dataset.a); refreshModal(); });
  if ($('ch-switch')) $('ch-switch').onclick = () => openModal('classes');
  if ($('ch-title')) $('ch-title').onclick = () => openModal('classes');
}
// Titelklasse im Charakterbogen: was sie gibt, was sie nimmt, woher die Ressource kommt
function titleBlock(p, isPlayer) {
  const T = p.titleClass && TITLE_CLASSES[p.titleClass];
  if (!T) return p.titleClasses?.length && isPlayer ? '<h3>Titelklasse</h3><p class="traits">Abgelegt. Der Pakt bleibt.</p><button class="txtbtn" id="ch-title">Titel tragen</button>' : '';
  return `<h3>Titelklasse · ${T.name}</h3>
    <p class="traits" style="color:${T.glow}">„${T.title}“ — ${T.resource.name} ${Math.floor(A.tres(p))}/${T.resource.max}</p>
    <dl class="ledger-list">
      <div><dt>Ressource</dt><dd>${T.resource.rule}</dd></div>
      <div><dt>Fähigkeiten</dt><dd>${T.abilities.map(a => ABILITIES[a].name).join(' · ')}</dd></div>
      <div><dt>${T.passive.name}</dt><dd>${T.passive.desc}</dd></div>
      <div><dt>Makel: ${T.flaw.name}</dt><dd>${T.flaw.desc}</dd></div>
      <div><dt>Preis des Paktes</dt><dd>${T.cost.desc}</dd></div>
    </dl>${isPlayer ? '<button class="txtbtn" id="ch-title">Titel wechseln/ablegen</button>' : ''}`;
}
function classChain(c) { const out = []; let k = c; while (k) { out.unshift(k); k = CLASSES[k].parent; } return out; }

function classUI(body) {
  const p = S.player;
  body.innerHTML = `<div class="ledger">Klassen werden in der Welt gelernt, nicht im Menü gewählt. Was du beherrschst, kannst du hier führen.</div>
    <div class="inv-grid" style="grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px">
    ${(p.knownClasses || []).map(c => `<button class="build-item" data-c="${c}">${CLASSES[c].name}
      <small>${c === p.currentClass ? 'aktiv' : 'wählen'}</small><br><span class="ledger">${CLASSES[c].desc || ''}${CLASSES[c].weak ? ` <i>Schwäche: ${CLASSES[c].weak}</i>` : ''}</span></button>`).join('')}</div>`;
  [...body.querySelectorAll('[data-c]')].forEach(b => b.onclick = () => { A.setClass(b.dataset.c); closeModal(); });
  // Titelklassen: neben der Grundklasse getragen; freigeschaltet nur durch Taten in der Welt
  const known = p.titleClasses || [];
  body.insertAdjacentHTML('beforeend', `<div class="ledger" style="margin-top:16px">Titelklassen trägst du zusätzlich zur Klasse — wie einen Titel.
    Sie werden in der Welt erworben, nie gewählt. Höchstens zwei je Figur, getragen wird eine; ihre Talentzweige gelten beide
    (${known.length}/2)${known.length ? '' : ' — du hast noch keine'}.</div>
    <div class="inv-grid" style="grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px">
    ${known.map(k => `<button class="build-item" data-t="${k}" style="border-color:${TITLE_CLASSES[k].glow}">${TITLE_CLASSES[k].name}
      <small>${k === p.titleClass ? 'getragen · ablegen' : 'tragen'}</small><br><span class="ledger">${TITLE_CLASSES[k].desc}</span></button>`).join('')}</div>`);
  [...body.querySelectorAll('[data-t]')].forEach(b => b.onclick = () => { A.setTitleClass(b.dataset.t === p.titleClass ? null : b.dataset.t); closeModal(); });
}

// ---- Skill-Baum (Visueller Umbau 02.10.2026, Scheibe 1+2: Linien zwischen Knoten, Icons je Zweig, Hover-Vorschaukarte) ----
// Spalten je Zweig, Zeilen = Tiefe. Titelzweige stehen darunter; solange die Titelklasse fehlt, versiegelt (sichtbar, damit man
// weiß, wofür sich der Weg lohnt). Zustandsmaschine (nodeState/learnNode) und Datenquelle (SKILL_TREE) bleiben unverändert —
// nur die Darstellung ändert sich: ein <canvas> hinter den Knöpfen zeichnet die Voraussetzungs-Linien (read-only, pro Zweig,
// da requires laut Datenmodell nie den Zweig verlassen), und die Hover-Vorschaukarte nutzt dieselbe Textquelle wie der frühere
// Browser-Tooltip, nur über das vorhandene data-card/_card-System (wie bei Gegenständen) statt title.
const ST_LABEL = { learned: 'gelernt', open: 'lernen', sealed: 'versiegelt', barred: 'ausgeschlossen', locked: 'gesperrt' };
function treeCardHTML(n, st, req, pts) {
  const stTxt = st === 'open' ? (pts ? 'lernen' : 'offen') : ST_LABEL[st] || st;
  const typeTxt = n.type === 'keystone' ? 'Schlüsselknoten' : n.type === 'active' ? 'Aktive Fähigkeit' : n.type === 'notable' ? 'Merkmal' : 'Talent';
  return `<div class="icard"><div class="ic-head"><canvas class="ic-ico" data-skbr="${n.branch}" data-sktype="${n.type || ''}"></canvas>
    <div class="ic-ttl"><div class="ic-name">${n.name}</div><div class="ic-sub">${typeTxt} · ${stTxt}</div></div></div>
    <div class="ledger" style="margin:6px 0 0">${n.desc}</div>
    ${n.designIntent ? `<div class="ledger" style="color:#8d836e;margin-top:4px">Absicht: ${n.designIntent}</div>` : ''}
    ${req ? `<div class="ledger" style="margin-top:4px">Braucht: ${req}</div>` : ''}</div>`;
}
// Zweigfarbe und Umriss je Zweig — ein einfaches, gezeichnetes Symbol (keine Fremdwerkzeuge), damit man Zweige auf einen Blick erkennt.
const TREE_COL = { combat: '#b2503a', magic: '#5a8ec0', survival: '#6a9a4a', necromancer: '#8ab0a0', warlock: '#a860c8', druid: '#7aa850', monk: '#c8a860', deathknight: '#8ac0d8' };
function drawSkillIconTo(cv, branch, type) {
  const c = cv.getContext('2d'), w = cv.width = cv.clientWidth || 18, h = cv.height = cv.clientHeight || 18;
  c.clearRect(0, 0, w, h); c.save(); c.translate(w / 2, h / 2); const s = w / 18; c.scale(s, s);
  c.shadowColor = 'rgba(6,5,4,.85)'; c.shadowBlur = 1; c.shadowOffsetY = 0.6;
  const col = TREE_COL[branch] || '#b8ac93';
  switch (branch) {
    case 'combat': c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(-5, 5); c.lineTo(4, -5); c.stroke();
      c.fillStyle = '#6a5a3a'; c.fillRect(-7, 2.5, 4, 4); break;                                  // Klinge und Griff
    case 'magic': c.fillStyle = col; c.beginPath(); c.moveTo(0, -6); c.lineTo(1.7, -1.7); c.lineTo(6, 0); c.lineTo(1.7, 1.7);
      c.lineTo(0, 6); c.lineTo(-1.7, 1.7); c.lineTo(-6, 0); c.lineTo(-1.7, -1.7); c.closePath(); c.fill(); break;   // Stern
    case 'survival': c.fillStyle = col; c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(6, -1, 0, 6); c.quadraticCurveTo(-6, -1, 0, -6); c.fill();
      c.strokeStyle = 'rgba(10,8,6,.7)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, -4.5); c.lineTo(0, 4.5); c.stroke(); break;   // Blatt
    case 'necromancer': c.fillStyle = '#d8cdb6'; c.beginPath(); c.arc(0, -1, 5, 0, 7); c.fill();
      c.fillStyle = '#1a1510'; c.fillRect(-2.6, -2.2, 1.8, 1.8); c.fillRect(0.8, -2.2, 1.8, 1.8); c.fillRect(-2.6, 2, 2, 2.6); c.fillRect(0.6, 2, 2, 2.6); break;   // Schädel
    case 'warlock': c.strokeStyle = col; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(0, -5, 6, 0); c.quadraticCurveTo(0, 5, -6, 0); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(0, 0, 2, 0, 7); c.fill(); break;                     // Auge
    case 'druid': c.fillStyle = col; c.beginPath(); c.arc(0, 1.6, 3.4, 0, 7); c.fill();
      for (const [dx, dy] of [[-3, -3], [0, -4.6], [3, -3]]) { c.beginPath(); c.arc(dx, dy, 1.3, 0, 7); c.fill(); } break;   // Pranke
    case 'monk': c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 5.4, 0, Math.PI * 2); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(0, -2.6, 1.5, 0, 7); c.fill(); break;                // Stiller Kreis
    case 'deathknight': c.fillStyle = col; c.beginPath(); c.moveTo(0, -6); c.lineTo(3, 0); c.lineTo(0, 6); c.lineTo(-3, 0); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(0, -5); c.lineTo(1, 0); c.lineTo(0, 1.6); c.lineTo(-1, 0); c.closePath(); c.fill(); break;   // Frostsplitter
    default: c.fillStyle = col; c.fillRect(-4, -4, 8, 8);
  }
  if (type === 'keystone') { c.strokeStyle = 'rgba(189,148,51,.9)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 7.6, 0, 7); c.stroke(); }
  c.restore();
}
// Linien zwischen einem Knoten und seinen Voraussetzungen, auf ein Canvas hinter den Knöpfen gezeichnet (Positionen aus dem
// echten Layout, nicht neu berechnet — läuft nur beim Öffnen/Lernen, nicht in der Spielschleife). Mehrere requires (= „oder“)
// bekommen alle ihre Linie; die von einem bereits gelernten Knoten leuchtet, die anderen bleiben blass (offene Entscheidung 2
// aus visual/skilltree.md: hier so gelöst, da es immer korrekt bleibt, unabhängig vom Spielstand).
function drawTreeLines(branchEl, p) {
  const cv = branchEl.querySelector('.tree-lines'); if (!cv) return;
  const r0 = branchEl.getBoundingClientRect();
  const w = cv.width = branchEl.clientWidth, h = cv.height = branchEl.clientHeight;
  const c = cv.getContext('2d'); c.clearRect(0, 0, w, h);
  const rectOf = k => { const b = branchEl.querySelector(`[data-k="${k}"]`); if (!b) return null; const r = b.getBoundingClientRect();
    return { cx: r.left - r0.left + r.width / 2, top: r.top - r0.top, bot: r.top - r0.top + r.height }; };
  branchEl.querySelectorAll('[data-k]').forEach(btn => {
    const k = btn.dataset.k, n = SKILL_TREE[k], to = rectOf(k); if (!to || !n.requires.length) return;
    for (const rk of n.requires) { const from = rectOf(rk); if (!from) continue;
      const lit = A.nodeState(p, rk) === 'learned';
      c.strokeStyle = lit ? 'rgba(189,148,51,.75)' : 'rgba(110,98,76,.4)'; c.lineWidth = lit ? 2 : 1.3;
      c.beginPath(); c.moveTo(from.cx, from.bot); c.lineTo(to.cx, to.top); c.stroke();
    }
  });
}
function skillUI(body) { SKY.skyUI(body, A, { refresh: refreshModal }); }   /* Scheibe 2: Sternenhimmel statt Spaltenraster (das alte Raster bleibt als skillUIOld) */
function skillUIOld(body) {
  const p = S.player, pts = p.skillPoints || 0;
  const col = b => {
    const N = Object.entries(SKILL_TREE).filter(([, n]) => n.branch === b), rows = Math.max(...N.map(([, n]) => n.row)) + 1, B_ = SKILL_BRANCHES[b];
    const sealed = B_.cls ? !(p.knownClasses || []).includes(B_.cls) : B_.title && !(p.titleClasses || []).includes(B_.title);
    return `<div class="tree-branch${sealed ? ' sealed' : ''}" data-b="${b}"><canvas class="tree-lines"></canvas><h3>${B_.name}</h3><p class="ledger">${sealed ? (B_.cls ? `Versiegelt — öffnet sich mit der Klasse ${CLASSES[B_.cls]?.name || B_.cls} (Todesweihe bei Sael oder Ysra).` : `Versiegelt — öffnet sich mit der Titelklasse ${TITLE_CLASSES[B_.title]?.name || B_.title}.`) : B_.desc}</p>
      ${Array.from({ length: rows }, (_, r) => `<div class="tree-row">${N.filter(([, n]) => n.row === r).map(([k, n]) => {
        const st = A.nodeState(p, k);
        return `<button class="tree-node ${st} ${n.type || 'minor'}" data-k="${k}" data-card="1"><canvas class="tree-ico" data-skbr="${n.branch}" data-sktype="${n.type || ''}"></canvas>${n.name}<small>${st === 'learned' ? 'gelernt' : st === 'open' ? (pts ? 'lernen' : 'offen') : st === 'sealed' ? 'versiegelt' : st === 'barred' ? 'ausgeschlossen' : 'gesperrt'}</small></button>`;
      }).join('')}</div>`).join('')}</div>`;
  };
  const base = ['combat', 'magic', 'survival'], titles = Object.keys(SKILL_BRANCHES).filter(b => !base.includes(b));
  body.innerHTML = `<div class="ledger">Talentpunkte frei: <b style="color:var(--gold)">${pts}</b> · einer je Stufe. Ein Knoten braucht einen gelernten
    Knoten darüber (einer genügt). Schlüsselknoten verändern die Spielweise und haben einen Preis.</div>
    <div class="tree-wrap">${base.map(col).join('')}</div>
    <div class="ledger" style="margin-top:12px">Zweige der Titelklassen</div>
    <div class="tree-wrap">${titles.map(col).join('')}</div>`;
  body.querySelectorAll('[data-k]').forEach(b => {
    b.onclick = () => { A.learnNode(b.dataset.k); refreshModal(); };
    const n = SKILL_TREE[b.dataset.k], st = A.nodeState(p, b.dataset.k), req = n.requires.map(x => SKILL_TREE[x].name).join(' oder ');
    b._card = () => treeCardHTML(n, st, req, pts);                         // Hover-Vorschaukarte statt Browser-title (gleiche Textquelle)
  });
  paintIcons(body);
  body.querySelectorAll('.tree-branch').forEach(el2 => drawTreeLines(el2, p));
}

// ---- Gruppe ----
function partyUI(body) {
  const mem = partyMembers();
  body.innerHTML = `<div class="ledger">Befehle gelten für die ganze Gruppe. Moral entscheidet, ob sie befolgt werden.</div>
    ${S.mount ? (() => { const H = A.mountInfo?.() || { name: S.mount.name }; return `<div class="panel" style="padding:10px;margin-top:8px"><b>${H.name}</b> <span class="ledger">(${H.kind || 'Reittier'})</span><div class="ledger">Tempo ${H.tempo}% · Ausdauer ${H.stamina}/${H.staminaMax} · Mut ${H.mut}${H.mut >= 70 ? ' (kommt auch im Kampf)' : ' (scheut den Kampf)'}<br>${S.player.mounted ? 'Du reitest. R zum Absitzen.' : 'R pfeift es heran, E sitzt auf. In Häusern und Höhlen wartet es draußen.'}</div><div class="ctx-actions" style="margin-top:6px"><button id="mount-release">Verstoßen</button></div></div>`; })() : ''}
    <div class="ctx-actions" style="flex-direction:row;flex-wrap:wrap;margin:10px 0">
      ${['follow:Folgen', 'attack:Angreifen', 'hold:Stellung halten', 'retreat:Zurückziehen', 'protect:Anführer schützen'].map(c => {
        const [k, n] = c.split(':'); return `<button data-cmd="${k}" class="${S.partyCmd === k ? 'on' : ''}" aria-pressed="${S.partyCmd === k}" style="flex:0 0 auto">${n}</button>`; }).join('')}
    </div>
    <div class="sheet" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">
    ${mem.map(m => `<div class="panel" style="padding:12px">
      <h3>${m.name} <span style="float:right;color:#8d836e">${CLASSES[m.currentClass].name} St.${m.level}</span></h3>
      <div class="statline"><span>Leben</span><b>${Math.ceil(m.hp)}/${m.maxHp}</b></div>
      <div class="statline"><span>Moral</span><b>${Math.round(m.morale)}</b></div>
      <div class="statline"><span>Beziehung zu dir</span><b>${Math.round(S.relations[m.key] ?? 0)} · ${relLabel(S.relations[m.key] ?? 0)}</b></div>
      <div class="statline"><span>Waffe</span><b>${m.equip.weapon ? ITEMS[m.equip.weapon.key].name : 'Fäuste'}</b></div>
      <div style="margin-top:6px">${(m.traits || []).map(t => `<span class="trait">${t}</span>`).join('')}</div>
      <h3 style="margin-top:10px">Erinnerungen</h3>
      <div class="ledger">${(m.memories || []).slice(-5).map(mm => `· ${MEMORY_TEXT[mm.key] || mm.key}${mm.about ? ' (' + mm.about + ')' : ''} <span style="color:#5f5648">J.${mm.year}</span>`).join('<br>') || 'Noch nichts Bemerkenswertes.'}</div>
      <div class="member-body">${bodyChart(m)}</div>
      <div class="ctx-actions"><button data-bandage="${m.id}">Verbinden</button><button data-sheet="${m.id}">Körpertafel</button><button data-gear="${m.id}">Ausrüstung geben</button><button data-dismiss="${m.id}">Entlassen</button></div>
    </div>`).join('') || '<div class="ledger">Du reist allein. Sprich mit Leuten. Hilf ihnen. Dann frage.</div>'}</div>`;
  [...body.querySelectorAll('[data-cmd]')].forEach(b => b.onclick = () => { A.partyCommand(b.dataset.cmd); refreshModal(); });
  const rb = $('mount-release'); if (rb) rb.onclick = () => { if (rb.dataset.sure) { A.releaseMount(); refreshModal(); } else { rb.dataset.sure = 1; rb.textContent = 'Wirklich verstoßen? Es kommt nicht zurück.'; } };   // S15 P17
  [...body.querySelectorAll('[data-dismiss]')].forEach(b => b.onclick = () => { A.dismiss(byId(b.dataset.dismiss)); refreshModal(); });
  [...body.querySelectorAll('[data-bandage]')].forEach(b => b.onclick = () => { A.bandage(byId(b.dataset.bandage)); closeModal(); });
  [...body.querySelectorAll('[data-sheet]')].forEach(b => b.onclick = () => { modalOpen = null; openModal('character', byId(b.dataset.sheet)); });
  [...body.querySelectorAll('[data-gear]')].forEach(b => b.onclick = () => { A.giveGear(byId(b.dataset.gear)); refreshModal(); });
}

// ---- Siedlung ----
function settleUI(body) {
  const st = S.settlement;
  if (!st) {
    body.innerHTML = `<div class="ledger">Du hast noch kein Lager. Suche einen freien Platz in der Welt und gründe eins.
      <div class="ctx-actions"><button id="found">Lager hier gründen (5 Holz)</button></div>
      <p style="margin-top:10px">Mit eigenem Lager darfst du einen vierten Gefährten mitnehmen (sonst bis zu drei).</p>
      <p style="margin-top:14px;color:#6d6454">Ein Lager ist kein Menü. Es steht in der Welt, es brennt, es wächst, es kann fallen.</p></div>`;
    $('found').onclick = () => { A.foundCamp(); closeModal(); };
    return;
  }
  const cats = {};
  for (const [k, b] of Object.entries(BUILDINGS)) (cats[b.cat] ||= []).push([k, b]);
  /* UI-Scheibe 2 (Artist R8): Baukarten mit Bild, Kosten-Piktogrammen und Bauzeit; Detail mit Grundriss; Prioritäten als ziehbare Karten */
  body.innerHTML = `<div class="build-layout">
    <div class="bcards-col">${Object.entries(cats).map(([c, list]) => `<div class="build-cat">${c}</div><div class="bcards">` +
      list.map(([k, b]) => bldCard(k, b)).join('') + '</div>').join('')}
      <div class="ledger bhint">Klick: Bauplan ansehen · Doppelklick: sofort platzieren. Rote Zahl = es fehlt Material.</div></div>
    <div><h3>${st.name}</h3>
      <div class="ledger">Stufe: ${settleTier(st)} · Gebäude ${st.buildings.filter(b => b.built >= 1).length}/${st.buildings.length}
        · Bevölkerung ${A.population()}</div>
      ${st.stage === 2 ? '<div class="ledger" style="color:#d0563f">Schutzlos: Niemand arbeitet, Fremde meiden das Lager. Wirb in einer Schenke Lagerwachen an (beim Wirt, 80 Gold).</div>' : st.stage === 1 ? '<div class="ledger" style="color:#c9a24a">Geschwächt: Viele Schützer sind gefallen.</div>' : ''}
      ${A.campGuards?.() ? `<div class="ledger">Lagerwachen: ${A.campGuards()} (je 5 Gold Sold am Tag)</div>` : ''}
      ${(() => { const I = A.raidInfo?.(); if (!I) return ''; return `<div class="ledger" title="Reichtum lockt an, wer in der Nähe ist. Schutzgeld an eine Bande schützt auch das Lager.">Bedrohung · Reichtum ${I.W} · Überfallgefahr je Nacht <b>${Math.round(I.ch * 100)} %</b><br><small>${I.L.length ? I.L.map(x => `◆ ${x.label} — ${x.dist} Felder`).join(' · ') : 'Keine Macht in der Nähe, nur Wölfe.'}</small></div>`; })()}
      ${(() => { const m = Math.round(st.morale ?? 60), B = A.moraleBand ? A.moraleBand(m) : { name: '', mul: 1 }, col = m >= 70 ? '#89a05a' : m >= 40 ? '#c9a24a' : m >= 20 ? '#c07a3a' : '#b0412e';
        return `<div class="ledger" title="Moral wirkt auf Ertrag und Zuzug. Ursachen: Brunnen, Ruhe, Anführer da, Hunger, Überbelegung, Tote.">Moral <b>${m}</b> · ${B.name}
          <div style="height:7px;background:#2a241c;margin:4px 0;border:1px solid #4a3f30"><div style="height:100%;width:${m}%;background:${col}"></div></div>
          <small>${B.mul !== 1 ? `Ertrag ×${B.mul}. ` : ''}${(st.moraleLog || []).slice(0, 3).map(x => `${x.v > 0 ? '+' : ''}${x.v} ${x.why} (Tag ${x.d})`).join(' · ') || 'Noch keine Ursachen.'}</small></div>`; })()}
      <div id="detail" class="bdetail ledger">Wähle links eine Baukarte. Der Bauplan zeigt Bild, Kosten und Grundriss; „Platzieren“ setzt einen Geist in die Welt.</div>
      <h3 style="margin-top:16px">Arbeitsprioritäten</h3>
      <div id="prio" class="prio-list"></div>
      <div class="ledger" style="margin-top:6px">Karten mit der Maus ziehen, um die Reihenfolge zu ändern (oben = zuerst); ▲ schiebt eine Stufe höher. Alle Siedler arbeiten an der obersten Aufgabe. Siedler kommen nur, wenn es ein Dach (Hütten) und Nahrung gibt; jeder isst täglich. Nachts kommen Angreifer — ein Wachturm warnt eine Stunde vorher.</div>
      <h3 style="margin-top:16px">Ortsgedächtnis</h3>
      <div class="ledger">${(st.history || []).map(h => `${h.text} — Jahr ${h.year}`).join('<br>') || 'Noch keine Geschichte.'}</div>
    </div>
    <div><h3>Bestand</h3>
      ${['wood:Holz', 'stone:Stein', 'iron:Eisen', 'food:Nahrung', 'herb:Kraut'].map(s => { const [k, n] = s.split(':');
        return `<div class="statline"><span>${icoImg('res_' + k, 1, 'ico bres')}${n}</span><b>${Math.floor(S.res[k])}</b></div>`; }).join('')}
      <h3 style="margin-top:14px">Gebäude</h3>
      ${st.buildings.map(b => `<div class="statline"><span>${BUILDINGS[b.type].name}</span><b>${b.built < 1 ? Math.round(b.built * 100) + '% Bau' : Math.round(b.cond * 100) + '%'}</b></div>`).join('') || '<div class="ledger">Nichts gebaut.</div>'}
    </div></div>`;
  prioCards($('prio'), st);
  const place = k => { A.startPlacing(k); closeModal(); };
  const show = k => { selBld = k; [...body.querySelectorAll('[data-b]')].forEach(c => c.classList.toggle('sel', c.dataset.b === k)); bldDetail($('detail'), k, place); };
  [...body.querySelectorAll('[data-b]')].forEach(b => { b.onclick = () => show(b.dataset.b); b.ondblclick = () => place(b.dataset.b); });
  if (selBld && BUILDINGS[selBld]) show(selBld);
}
let selBld = null;
const RES_NAME = { wood:'Holz', stone:'Stein', iron:'Eisen' };
const bldImg = (k, s, cls) => { let u = ''; try { u = ICO?.bldURL?.(k, s) || ''; } catch (e) {} return u ? `<img class="${cls}" src="${u}" alt="">` : `<span class="${cls} bimg-none"></span>`; };
function costPics(cost, big) {                                          /* je Rohstoff: Piktogramm + Zahl, rot wenn es fehlt */
  return Object.entries(cost).map(([k, v]) => { const have = Math.floor(S.res[k] || 0), miss = have < v;
    return `<span class="bcost${miss ? ' miss' : ''}" title="${v} ${RES_NAME[k] || k} — vorhanden ${have}">${icoImg('res_' + k, 1, 'ico') || (RES_NAME[k] || k) + ' '}${v}${big && miss ? ` <small>(${have})</small>` : ''}</span>`; }).join('');
}
function bldCard(k, b) {
  const can = A.canAfford(b.cost);
  return `<button class="bcard${can ? '' : ' cant'}" data-b="${k}" title="${b.name}: ${b.desc}">
    ${bldImg(k, 3, 'bimg')}<span class="bname">${b.name}</span>
    <span class="bfoot">${costPics(b.cost)}<span class="btime" title="Bauzeit">${icoImg('time', 1, 'ico')}${b.time}s</span></span></button>`;
}
function bldDetail(box, k, place) {
  const def = BUILDINGS[k], can0 = A.canAfford(def.cost), mg = can0 ? 0 : (A.missGold?.(def.cost) || 0), buy = !can0 && mg > 0 && S.gold >= mg, can = can0 || buy;   /* Gold-Sog: Zukauf */
  box.innerHTML = `<div class="bd-head">${bldImg(k, 5, 'bimg-big')}<div><h3>${def.name}</h3><div>${def.desc}</div></div></div>
    <div class="bd-row"><div class="bd-plan"><canvas id="bdplan"></canvas><small>Grundriss ${def.w}×${def.h} Felder · Punkt = ein Mensch</small></div>
      <div class="bd-facts"><div class="statline"><span>Kosten</span><b>${costPics(def.cost, true)}</b></div>
        <div class="statline" title="Mit einem Helfer in der Nähe; jeder weitere Helfer (Gefährten) baut mit."><span>Bauzeit</span><b>${def.time} s</b></div>
        <div class="statline"><span>Fläche</span><b>${def.w}×${def.h}</b></div>
        ${def.pop ? `<div class="statline"><span>Schlafplätze</span><b>${def.pop}</b></div>` : ''}</div></div>
    <div class="ctx-actions"><button id="place"${can ? '' : ' class="cant"'}>Platzieren</button></div>
    <div class="bd-hint">${can ? 'In der Welt: grüne Felder sind frei, rote belegt. Der Kreis um dich ist die Reichweite. Linksklick baut, Rechtsklick oder Esc bricht ab.' : 'Es fehlt Material (rot markiert). Holz, Stein und Eisen kommen aus Sammeln und Siedlerarbeit.'}${buy ? ` Fehlendes Material kaufen Fuhrleute zu: <b>${mg} Gold</b>.` : !can0 && mg ? ` Zukauf möglich ab ${mg} Gold.` : ''}</div>`;
  $('place').onclick = () => place(k);
  drawPlan($('bdplan'), k, def);
}
function drawPlan(cv, k, def) {                                          /* Grundriss von oben: Bauland, Mauern, Tür, ein Mensch als Maßstab */
  if (!cv) return;
  const m = 1, cw = def.w + m * 2, ch = def.h + m * 2, c = Math.max(8, Math.min(18, Math.floor(130 / Math.max(cw, ch))));
  cv.width = cw * c; cv.height = ch * c;
  const g = cv.getContext('2d'), x0 = m * c, y0 = m * c, W = def.w * c, H = def.h * c;
  g.fillStyle = '#1b2014'; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = 'rgba(255,255,255,.035)'; for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) if ((i + j) % 2) g.fillRect(i * c, j * c, c, c);
  const fill = { Unterkunft:'#5a4630', Produktion:'#4b3f33', Versorgung:'#4f5a2c', Verteidigung:'#5a4a36', Grundlage:'#3a2f24', Zonen:'rgba(120,160,80,.15)' }[def.cat] || '#4b3f33';
  g.fillStyle = fill; g.fillRect(x0, y0, W, H);
  if (k === 'farm') { g.fillStyle = '#3a2c1c'; for (let y = y0 + 2; y < y0 + H; y += 4) g.fillRect(x0 + 2, y, W - 4, 2); }
  else if (k === 'pasture') { g.strokeStyle = '#8a6a40'; g.lineWidth = 2; g.strokeRect(x0 + 2, y0 + 2, W - 4, H - 4); g.fillStyle = '#5a4630'; g.fillRect(x0 + W - c - 2, y0 + 2, c, c); }
  else if (k === 'campfire' || k === 'well') { g.fillStyle = k === 'well' ? '#5c6a78' : '#c86a28'; g.beginPath(); g.arc(x0 + W / 2, y0 + H / 2, c * .36, 0, 7); g.fill(); }
  else if (k === 'wohnzone') { g.strokeStyle = 'rgba(150,190,110,.8)'; g.setLineDash([4, 3]); g.strokeRect(x0 + .5, y0 + .5, W - 1, H - 1); g.setLineDash([]); g.fillStyle = '#6a5030'; for (const [px, py] of [[x0, y0], [x0 + W, y0], [x0, y0 + H], [x0 + W, y0 + H]]) g.fillRect(px - 2, py - 2, 4, 4); }
  else { g.strokeStyle = '#a08458'; g.lineWidth = 2; g.strokeRect(x0 + 1, y0 + 1, W - 2, H - 2);
    if (['hut', 'tent', 'storage', 'smithy', 'watchtower', 'gate'].includes(k)) { g.fillStyle = '#1b2014'; g.fillRect(x0 + W / 2 - c * .35, y0 + H - 3, c * .7, 3); } }
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1;
  for (let i = 0; i <= def.w; i++) { g.beginPath(); g.moveTo(x0 + i * c + .5, y0); g.lineTo(x0 + i * c + .5, y0 + H); g.stroke(); }
  for (let j = 0; j <= def.h; j++) { g.beginPath(); g.moveTo(x0, y0 + j * c + .5); g.lineTo(x0 + W, y0 + j * c + .5); g.stroke(); }
  g.fillStyle = '#e8c070'; g.beginPath(); g.arc(c / 2, ch * c - c / 2, Math.max(2, c * .22), 0, 7); g.fill();   /* Mensch als Maßstab: ein Feld */
}
function prioCards(box, st) {                                           /* ziehbare Karten; Umsortieren nur über raisePriority (gleiche Regel wie „höher“) */
  const pr = st.priorities || [];
  const move = (from, to) => { if (to < from) for (let k = from; k > to; k--) A.raisePriority(k); else for (let k = from + 1; k <= to; k++) A.raisePriority(k); refreshModal(); };
  let drag = -1;
  pr.forEach((p, i) => {
    const card = el('div', 'prio-card' + (i ? '' : ' top'), `<span class="pgrip">⠿</span><b>${i + 1}</b><span class="pname">${p}</span>${i ? `<button class="txtbtn" data-up="${i}" title="Eine Stufe höher">▲</button>` : '<small>jetzt</small>'}`);
    card.draggable = true; card.title = 'Ziehen zum Umsortieren';
    card.ondragstart = ev => { drag = i; card.classList.add('drag'); try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', String(i)); } catch (e) {} };
    card.ondragend = () => { card.classList.remove('drag'); [...box.children].forEach(c => c.classList.remove('over')); };
    card.ondragover = ev => { ev.preventDefault(); [...box.children].forEach(c => c.classList.toggle('over', c === card)); };
    card.ondrop = ev => { ev.preventDefault(); if (drag >= 0 && drag !== i) move(drag, i); drag = -1; };
    box.appendChild(card);
  });
  [...box.querySelectorAll('[data-up]')].forEach(b => b.onclick = () => move(+b.dataset.up, +b.dataset.up - 1));
}
function settleTier(st) {
  const n = st.buildings.filter(b => b.built >= 1).length;
  return n >= 12 ? 'Befestigte Siedlung' : n >= 7 ? 'Dorf' : n >= 3 ? 'Befestigtes Lager' : 'Lager';
}

// ---- Fraktionen ----
let selFac = 'valen';
function facUI(body) {
  const f = FACTIONS[selFac], rep = S.factions[selFac], rank = S.ranks[selFac];
  body.innerHTML = `<div class="fac-grid">
    <div><canvas class="banner" id="banner"></canvas>
      <div style="margin-top:10px">${Object.keys(FACTIONS).map(k => `<div class="fac-row ${k === selFac ? 'sel' : ''}" data-f="${k}">
        <span>${FACTIONS[k].name}</span><b>${S.factions[k] > 0 ? '+' : ''}${Math.round(S.factions[k])}</b></div>`).join('')}</div></div>
    <div><h3>${f.name}</h3><div class="ledger">${f.desc}</div>
      <div class="statline"><span>Ansehen</span><b>${rep > 0 ? '+' : ''}${Math.round(rep)} · ${A.repTier(selFac).name}</b></div>
      <div class="ledger">${(t => t.price == null ? 'Kein Handel, Wachen greifen an.' : `Preise ${t.price < 1 ? '−' + Math.round((1 - t.price) * 100) + ' %' : t.price > 1 ? '+' + Math.round((t.price - 1) * 100) + ' %' : 'normal'}${t.greet ? ', ' + (t.price < 1 ? 'herzliche' : 'kühle') + ' Begrüßung' : ''}.`)(A.repTier(selFac))}${(S.bounty || {})[selFac] ? ` Kopfgeld: <b>${S.bounty[selFac]} Gold</b>.` : ''}</div>
      <div class="statline"><span>Rang</span><b>${rank >= 0 ? f.ranks[Math.min(rank, f.ranks.length - 1)] : 'Kein Mitglied'}</b></div>
      <h3 style="margin-top:14px">Rangfolge</h3>
      ${(G => G ? `<div class="ledger"><b>${G.next}</b></div><table class="rank-tab">${G.rows.map(x => `<tr class="r-${x.state}"><td>${x.state === 'done' ? '✔' : x.state === 'next' ? '➜' : '·'} ${x.name}</td><td>${x.need}</td><td>${x.perk}</td></tr>`).join('')}</table>` : '')(A.rankGuide(selFac))}
      <h3 style="margin-top:14px">Krieg</h3>
      <canvas class="warmap" id="warmap" width="260" height="180"></canvas>
      <div class="ledger">${A.warStatus()}</div>
    </div>
    <div><h3>Beziehungen</h3>
      ${Object.keys(FACTIONS).filter(k => k !== selFac).map(k => `<div class="statline"><span>${FACTIONS[k].name}</span><b>${A.facRelation(selFac, k)}</b></div>`).join('')}
      <h3 style="margin-top:14px">Aufträge</h3>
      <div class="ledger">${Object.entries(S.quests).filter(([k, v]) => v.state === 'active').map(([k]) => '· ' + QUESTS[k].name).join('<br>') || 'Keine offenen Aufträge.'}</div>
    </div></div>`;
  [...body.querySelectorAll('[data-f]')].forEach(b => b.onclick = () => { selFac = b.dataset.f; refreshModal(); });
  drawBanner($('banner'), f);
  A.drawWarmap($('warmap'));
}
function drawBanner(cv, f) {
  cv.width = cv.clientWidth; cv.height = 210;
  const c = cv.getContext('2d'), w = cv.width, h = cv.height;
  c.fillStyle = f.colors[0]; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < h; i += 6) c.fillRect(0, i, w, 1);
  c.fillStyle = f.colors[1];
  c.beginPath(); c.arc(w / 2, h / 2 - 10, 34, 0, 7); c.fill();
  c.fillStyle = f.colors[0];
  c.beginPath(); c.arc(w / 2, h / 2 - 10, 26, 0, 7); c.fill();
  c.fillStyle = f.colors[1]; c.fillRect(w / 2 - 3, h / 2 - 46, 6, 74);
  c.fillRect(w / 2 - 16, h / 2 - 22, 32, 6);
  c.fillStyle = 'rgba(0,0,0,.5)';
  c.beginPath(); c.moveTo(0, h); c.lineTo(w / 2, h - 26); c.lineTo(w, h); c.fill();
}

// ---- Chronik ----
let selEv = -1;
export function chronUI(body) {
  const evs = S.chronicle;
  const years = [...new Set(evs.map(e => e.year))].sort((a, b) => a - b);
  const st = S.stats || {}, ms = st.playMs || 0, P = S.player, done = Object.values(S.quests).filter(q => q.state === 'done').length;   // S13 (Nutzer): Spielstand-Info
  const info = [['Spielzeit', `${Math.floor(ms / 3.6e6)} Std ${Math.floor(ms / 6e4) % 60} Min`], ['Generation', `${S.legacy.gen} (Haus ${S.legacy.house})`], ['Vorfahren', S.legacy.ancestors.length],
    ['Tag / Jahr', `${S.day | 0} / ${year()}`], ['Getötet', S.kills || 0], ['Schlachten', S.battles || 0], ['Aufträge erfüllt', done], ['Held', P ? `${P.name}, Stufe ${P.level}` : '—'],
    ['Legenden', Object.values(S.legend || {}).join(', ') || '—']].map(([k, v]) => `<div class="statline"><span>${k}</span><b>${v}</b></div>`).join('');
  body.innerHTML = `<div class="panel" style="padding:10px 14px;margin-bottom:12px"><h3>Spielstand</h3><div class="save-info">${info}</div></div><div class="chron"><div class="timeline">${years.map(y =>
    `<div class="tl-year">JAHR ${y}</div>` + evs.map((e, i) => [e, i]).filter(([e]) => e.year === y)
      .map(([e, i]) => `<div class="tl-ev ${e.kind} ${i === selEv ? 'sel' : ''}" data-i="${i}"><span class="dot"></span><span>${e.text}</span></div>`).join('')
  ).join('') || '<div class="ledger">Die Chronik ist leer. Noch.</div>'}</div>
  <div class="chron-detail" id="cd"></div></div>`;
  [...body.querySelectorAll('[data-i]')].forEach(b => b.onclick = () => { selEv = +b.dataset.i; chronUI(body); });
  const cd = $('cd');
  const e = evs[selEv] || evs[evs.length - 1];
  if (!e) { cd.innerHTML = '<div class="ledger">Noch nichts geschehen, das es wert wäre.</div>'; return; }
  cd.innerHTML = `<h2>${e.text}</h2><div class="s-key">Jahr ${e.year} · Tag ${e.day}</div>
    ${e.detail ? `<div class="epitaph">${e.detail}</div>` : ''}
    <h3 style="margin-top:16px">Haus ${S.legacy.house}</h3>
    <div class="ledger">Generation ${S.legacy.gen}<br>
      ${S.legacy.ancestors.map(a => `† ${a.name} — ${a.cause}, Jahr ${a.year} (${a.days} Tage, ${a.kills} Feinde)`).join('<br>') || 'Noch keine Toten.'}</div>`;
}

// ---- Karte ----
function mapUI(body) {
  const z = S.settings.mapZoom ?? 3;
  body.innerHTML = `<canvas id="wm" style="width:100%;height:calc(100% - 44px);border:1px solid #2b2419;background:#0b0a08"></canvas>
    <div class="ctx-actions" style="margin-top:8px"><button data-z="3" class="${z === 3 ? 'on' : ''}" aria-pressed="${z === 3}">Umgebung</button><button data-z="1" class="${z === 1 ? 'on' : ''}" aria-pressed="${z === 1}">Welt</button>
    <span class="ledger" style="margin-left:10px">Entdeckte Orte erscheinen dauerhaft. Dunkel = unentdeckt.</span></div>`;
  const cv = $('wm'); cv.width = cv.clientWidth; cv.height = cv.clientHeight;
  A.drawWorldmap(cv, z);
  cv.style.cursor = 'pointer'; body.style.position = 'relative';
  cv.onclick = e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * cv.width / r.width, y = (e.clientY - r.top) * cv.height / r.height, P = A.mapPick?.(x, y);   /* Scout #5: Ortskarte */
    $('map-card')?.remove(); if (!P) return;
    // Karte Scheibe 1 (02.10.2026): Bild-Panel statt reinem Text — kleines Icon-Canvas (dieselbe Zeichnung wie auf der Weltkarte, atlas.drawLocIcon).
    const d = el('div', 'map-card', `<div class="map-card-head">${P.loc ? '<canvas class="map-card-ico"></canvas>' : ''}<div class="ctx-head">${P.title}</div></div>${P.html}`); d.id = 'map-card';
    d.style.left = Math.min(e.clientX - r.left + 14, r.width - 270) + 'px'; d.style.top = Math.max(4, Math.min(e.clientY - r.top - 20, r.height - 180)) + 'px'; d.onclick = () => d.remove(); body.appendChild(d);
    if (P.loc) ATL.drawLocIcon(d.querySelector('.map-card-ico'), P.loc); };
  [...body.querySelectorAll('[data-z]')].forEach(b => b.onclick = () => { S.settings.mapZoom = +b.dataset.z; mapUI(body); });
}

// ---- Handel (Visueller Umbau P7, IMPL-ITEMS 02.10.2026) ----
// Angedocktes Seitenfenster rechts (die Welt bleibt sichtbar), Händlerporträt, Warenraster mit Preisschild, Stadtwaren als Kreidetafel,
// Klick = ansehen; Kaufen und Verkaufen per Knopf, Doppelklick oder Ziehen; Mengenschieber mit Preis je Stück und Gesamtpreis vorher
// (buyQuote rechnet wie buy, an einer Kopie); Mehrfachverkauf markierter Teile (gleicher Preis je Stück wie einzeln, kein Rückkauf);
// Preisvergleich gegen S.priceSeen; Goldzähler rollt mit Münzklang; Händler antwortet mit Sprechblase und Geste (shopBark).
// Angezeigter Preis = gezahlter Preis: Verkauf immer mit dem Exemplar (Rarität), wie sell() rechnet (vorher ohne — Fehler aus shops.md).
const SHOP_ICO = { smith: 'nav_build', tavern: 'set_morale', heal: 'res_herb', tech: 'nav_options', black: 'log_death', market: 'log_economy' };
const SHOP_NAME = { smith: 'Schmiede', tavern: 'Schenke', heal: 'Heilkunde', tech: 'Feinwerk', black: 'Hehlerware', market: 'Markt' };
const TR_CAT = [['all', 'nav_inv', 'Alles'], ['weapon', 'log_combat', 'Waffen'], ['armor', 'nav_char', 'Rüstung und Schmuck'], ['use', 'res_food', 'Vorrat'], ['good', 'log_economy', 'Stadtwaren'], ['mat', 'res_stone', 'Material']];
export const tradeWith = () => trNpc;                       /* Kamera (game.js): Held und Händler links neben dem Dock */
let trNpc = null, trSel = null, trCat = 'all', trQty = 1, trMarks = new Set(), trMark = false, TRD = null;
const catIn = (it, cat) => cat === 'all' || catOf(it) === cat || (cat === 'mat' && catOf(it) === 'quest');
function seenOther(npc, key) {                                  /* zuletzt gesehene Preise dieser Ware in anderen Städten (S.priceSeen) */
  const here = A.ecoTownOf?.(npc) || npc.homeTown || npc.town;
  return Object.entries(S.priceSeen || {}).filter(([k, v]) => k !== here && S.towns?.[k] && v.p?.[key] != null).map(([k, v]) => ({ k, name: S.towns[k].name || k, p: v.p[key], day: v.day })).sort((a, b) => b.day - a.day);
}
function tradeUI(body, npc) {
  npc = npc || trNpc; if (!npc) return;
  if (trNpc !== npc) { trSel = null; trCat = 'all'; trMarks = new Set(); trMark = false; trQty = 1; }
  trNpc = npc;
  const kind = A.shopKind?.(npc) || 'market';
  body.className = 'tr-body';
  body.innerHTML = `<div class="tr">
    <div class="tr-head"><canvas id="tr-por" width="56" height="56"></canvas>
      <div class="tr-who"><div class="tr-name">${npc.name}</div><div class="tr-prof">${icoTag(SHOP_ICO[kind], 1)} ${npc.prof || SHOP_NAME[kind]}${npc.till ? ` · ${icoTag('time', 1)} bis ${npc.till} Uhr` : ''}</div></div>
      <div class="tr-gold" id="tr-gold" title="Dein Gold">${icoTag('res_gold', 2, 'gold-ico')}<b id="trg">${S.gold}</b><span id="tr-dl"></span></div></div>
    <div class="tr-cols"><div class="tr-main">
      <div class="chips" id="tr-f"></div>
      <div id="tr-chalk"></div>
      <div class="tr-sec">${icoTag(SHOP_ICO[kind], 1)} Ware</div><div class="tr-grid" id="tr-buy"></div>
      <div class="tr-sec">${icoTag('nav_inv', 1)} Dein Gepäck <button id="tr-mark" class="mini${trMark ? ' on' : ''}" title="Mehrere Teile antippen und zusammen verkaufen">Mehrere wählen</button></div><div class="tr-grid" id="tr-sell"></div>
      <div id="tr-multi"></div>
    </div><div class="tr-deal" id="tr-deal"></div></div></div>`;
  drawPortraitTo($('tr-por'), npc);
  const onC = k => { trCat = k; chipBar($('tr-f'), TR_CAT, trCat, onC); trPaint(); }; chipBar($('tr-f'), TR_CAT, trCat, onC);
  $('tr-mark').onclick = () => { trMark = !trMark; if (!trMark) trMarks.clear(); $('tr-mark').classList.toggle('on', trMark); trPaint(); };
  const bz = $('tr-buy'), sz = $('tr-sell');
  bz.ondragover = e => { if (TRD?.side === 'sell') e.preventDefault(); };
  bz.ondrop = e => { e.preventDefault(); const D = TRD; TRD = null; if (D?.side === 'sell') trSell([D.o], 1); };
  sz.ondragover = e => { if (TRD?.side === 'buy') e.preventDefault(); };
  sz.ondrop = e => { e.preventDefault(); const D = TRD; TRD = null; if (D?.side === 'buy') trBuy(D.key, 1); };
  trPaint();
}
function trTag(v, cls = '') { return `<span class="ptag${cls ? ' ' + cls : ''}">${v}</span>`; }
function trPaint() {
  const npc = trNpc, p = S.player; if (!npc || !$('tr-buy')) return;
  const stock = A.shopStock(npc), goods = stock.filter(s => ITEMS[s.key]?.good && s.count >= 1), wares = stock.filter(s => !ITEMS[s.key]?.good);
  if (trSel?.side === 'buy' && !stock.some(s => s.key === trSel.key && s.count >= 1)) trSel = null;
  if (trSel?.side === 'sell' && !p.inv.includes(trSel.o)) trSel = null;
  for (const o of [...trMarks]) if (!p.inv.includes(o)) trMarks.delete(o);
  /* Kreidetafel: Stadtwaren mit Bestand, Preis und Pfeil gegen den zuletzt gesehenen Preis anderswo */
  const ch = $('tr-chalk');
  if (goods.length && (trCat === 'all' || trCat === 'good')) {
    const here = S.towns?.[A.ecoTownOf?.(npc)]?.name || 'hier';
    ch.innerHTML = `<div class="chalk"><div class="chalk-h">Stadtwaren · ${here}</div>${goods.map(s => { const pr = A.price(s.key, true, npc), so = seenOther(npc, s.key), last = so[0];
      const ar = last ? (pr > last.p ? `<span class="cmpa dn" title="Teurer als zuletzt in ${last.name} (${last.p}, Tag ${last.day})">▲</span>` : pr < last.p ? `<span class="cmpa up" title="Billiger als zuletzt in ${last.name} (${last.p}, Tag ${last.day})">▼</span>` : '<span class="cmpa">=</span>') : '<span class="cmpa" title="Noch keine Preise anderer Städte gesehen">·</span>';
      const tip = so.length ? 'Zuletzt gesehen (Kaufpreis): ' + so.map(x => `${x.name} ${x.p} (vor ${Math.max(0, (S.day | 0) - x.day)} T.)`).join(' · ') : 'Andere Städte: noch nicht gesehen.';
      const have = p.inv.filter(x => x.key === s.key).reduce((n, x) => n + (x.count || 1), 0);
      return `<div class="ch-row${trSel?.side === 'buy' && trSel.key === s.key ? ' sel' : ''}${S.gold < pr ? ' poor' : ''}" data-k="${s.key}" title="${tip}" draggable="true"><canvas data-ico="${s.key}"></canvas><span class="nm">${ITEMS[s.key].name}</span><span class="st">×${s.count}</span><span class="pr">${pr}</span>${ar}${have ? `<span class="hv" title="Davon trägst du">${have}</span>` : ''}</div>`; }).join('')}</div>`;
    ch.querySelectorAll('.ch-row').forEach(r => { const key = r.dataset.k;
      r.onclick = () => { trSel = { side: 'buy', key }; trQty = 1; trPaint(); };
      r.ondblclick = () => trBuy(key, 1);
      r.ondragstart = e => { TRD = { side: 'buy', key }; e.dataTransfer.setData('text/plain', 'rf'); };
      r.ondragend = () => { TRD = null; };
      r.ondragover = e => { if (TRD?.side === 'sell') e.preventDefault(); }; r.ondrop = e => { e.preventDefault(); const D = TRD; TRD = null; if (D?.side === 'sell') trSell([D.o], 1); }; });
    paintIcons(ch);
  } else ch.innerHTML = '';
  /* Warenraster */
  const bz = $('tr-buy'); bz.innerHTML = '';
  const shown = wares.filter(s => catIn(ITEMS[s.key], trCat));
  if (!shown.length) bz.innerHTML = `<div class="ledger tr-empty">${wares.length ? 'Nichts in dieser Auswahl.' : goods.length ? 'Nur Stadtwaren.' : 'Heute nichts mehr. Morgen kommt neue Ware.'}</div>`;
  for (const s of shown) {
    const pr = A.price(s.key, true, npc), poor = S.gold < pr, full = !A.buyQuote?.(npc, s.key, 1)?.room;
    const c = el('div', 'cell'); bz.appendChild(c); c.dataset.card = '1';
    c._card = () => itemCardHTML(s, { short: true, shop: true, price: `<div class="ic-price">${icoTag('res_gold', 1)} <b>${pr}</b> Gold je Stück${poor ? ' · <span class="bad">zu teuer</span>' : ''}</div>` });
    paintCell(c, s, { sel: trSel?.side === 'buy' && trSel.key === s.key, cls: (poor ? 'poor' : '') + (full ? ' full' : ''), tag: trTag(pr, poor ? 'bad' : ''), cmp: cmpArrow(s) });
    c.onclick = () => { trSel = { side: 'buy', key: s.key }; trQty = 1; trPaint(); };
    c.ondblclick = () => trBuy(s.key, 1);
    c.draggable = true; c.ondragstart = e => { TRD = { side: 'buy', key: s.key }; e.dataTransfer.setData('text/plain', 'rf'); }; c.ondragend = () => { TRD = null; };
  }
  /* Gepäck mit Verkaufspreis des Exemplars */
  const sz = $('tr-sell'); sz.innerHTML = '';
  p.inv.forEach((s, i) => { if (!s) return;
    const it = ITEMS[s.key], no = it?.bound || s.lock, pr = no ? 0 : A.price(s.key, false, npc, s);
    const c = el('div', 'cell'); sz.appendChild(c); c.dataset.card = '1';
    c._card = () => itemCardHTML(s, { short: true, price: no ? `<div class="ic-price bad">${it?.bound ? 'An dich gebunden — unverkäuflich.' : 'Gesperrt — erst im Gepäck entsperren.'}</div>` : `<div class="ic-price">${icoTag('res_gold', 1)} Erlös <b>${pr}</b> Gold${(s.count || 1) > 1 ? ' je Stück' : ''}</div>` });
    paintCell(c, s, { dim: !catIn(it, trCat), sel: trSel?.side === 'sell' && trSel.o === s, mk: trMarks.has(s), tag: no ? trTag(it?.bound ? 'gebunden' : '—', 'no') : trTag(pr) });
    c.onclick = () => { delete s.nw; if (trMark) { if (!no) { if (trMarks.has(s)) trMarks.delete(s); else trMarks.add(s); } else toast(it?.bound ? 'An dich gebunden. Das verkauft man nicht.' : 'Gesperrt.'); } else { trSel = { side: 'sell', o: s }; trQty = 1; } trPaint(); };
    c.ondblclick = () => { if (!trMark) trSell([s], 1); };
    c.draggable = true; c.ondragstart = e => { TRD = { side: 'sell', o: s }; e.dataTransfer.setData('text/plain', 'rf'); }; c.ondragend = () => { TRD = null; };
  });
  /* Mehrfachverkauf */
  const mu = $('tr-multi');
  if (trMark) { const list = [...trMarks].map(o => ({ idx: p.inv.indexOf(o), n: o.count || 1 })), q = A.sellQuote?.(npc, list) || { each: [], total: 0 };
    mu.innerHTML = `<div class="tr-multi"><span>${trMarks.size} gewählt · ${q.each.length} Stück · Erlös <b>${q.total}</b> Gold</span><button id="tr-msell"${q.each.length ? '' : ' disabled'}>Gewählte verkaufen</button><button id="tr-mclr" class="mini">Leeren</button></div>`;
    $('tr-msell').onclick = () => { const objs = [...trMarks]; trMarks.clear(); trSell(objs, Infinity); };
    $('tr-mclr').onclick = () => { trMarks.clear(); trPaint(); };
  } else mu.innerHTML = '';
  trDeal();
}
function trDeal() {
  const d = $('tr-deal'), npc = trNpc, p = S.player; if (!d) return;
  if (!trSel) { d.innerHTML = `<div class="ledger tr-help">Klick: ansehen. Doppelklick, Knopf oder Ziehen: kaufen oder verkaufen.<br>Rote Preise kannst du dir nicht leisten.<br>▲▼ an Stadtwaren: Preis gegen den zuletzt gesehenen in einer anderen Stadt.</div>`; return; }
  if (trSel.side === 'buy') {
    const key = trSel.key, st = A.shopStock(npc).find(s => s.key === key), it = ITEMS[key]; if (!st) { trSel = null; return trDeal(); }
    const full = A.buyQuote(npc, key, st.count), max = Math.max(1, full.each.length); trQty = Math.max(1, Math.min(trQty, max));
    const q = A.buyQuote(npc, key, trQty), lo = Math.min(...(q.each.length ? q.each : [q.one])), hi = Math.max(...(q.each.length ? q.each : [q.one]));
    const note = A.priceNote?.(key, npc);
    d.innerHTML = itemCardHTML({ key }, { shop: true }) +
      `<div class="tr-box">${max > 1 ? `<label class="qty">${icoTag('nav_inv', 1)} <input type="range" id="tr-q" min="1" max="${max}" value="${trQty}"> <b id="tr-qn">${trQty}</b></label>` : ''}
        <div class="tr-sum" id="tr-sum">${trSum(q, lo, hi, true)}</div>
        ${note ? `<div class="ledger" style="color:${/^Teuer/.test(note) ? '#d08a6a' : '#9ac08a'}">${note}</div>` : ''}
        ${!full.room ? '<div class="bad">Tasche voll.</div>' : ''}
        <button id="tr-do" class="big">Kaufen${trQty > 1 ? ` (${trQty})` : ''}</button></div>`;
    const r = $('tr-q'); if (r) r.oninput = () => { trQty = +r.value; const q2 = A.buyQuote(npc, key, trQty), e = q2.each.length ? q2.each : [q2.one];
      $('tr-qn').textContent = trQty; $('tr-sum').innerHTML = trSum(q2, Math.min(...e), Math.max(...e), true); $('tr-do').textContent = `Kaufen${trQty > 1 ? ` (${trQty})` : ''}`; };
    $('tr-do').onclick = () => trBuy(key, trQty);
  } else {
    const s = trSel.o, i = p.inv.indexOf(s), it = ITEMS[s.key], no = it?.bound || s.lock, n0 = s.count || 1; trQty = Math.max(1, Math.min(trQty, n0));
    const q = no ? { each: [], total: 0 } : A.sellQuote(npc, [{ idx: i, n: trQty }]);
    d.innerHTML = itemCardHTML(s, {}) + `<div class="tr-box">${n0 > 1 && !no ? `<label class="qty">${icoTag('nav_inv', 1)} <input type="range" id="tr-q" min="1" max="${n0}" value="${trQty}"> <b id="tr-qn">${trQty}</b></label>` : ''}
      ${no ? `<div class="bad">${it?.bound ? 'An dich gebunden — unverkäuflich.' : 'Gesperrt — erst entsperren.'}</div>` : `<div class="tr-sum" id="tr-sum">${trSum(q, Math.min(...q.each), Math.max(...q.each), false)}</div>`}
      <div class="ctx-actions">${no && it?.bound ? '' : `<button id="tr-lock" class="${s.lock ? 'on' : ''}">${LOCK_SVG} ${s.lock ? 'Entsperren' : 'Sperren'}</button>`}${no ? '' : `<button id="tr-do" class="big">Verkaufen${trQty > 1 ? ` (${trQty})` : ''}</button>`}</div></div>`;
    const r = $('tr-q'); if (r) r.oninput = () => { trQty = +r.value; const q2 = A.sellQuote(npc, [{ idx: p.inv.indexOf(s), n: trQty }]);
      $('tr-qn').textContent = trQty; $('tr-sum').innerHTML = trSum(q2, Math.min(...q2.each), Math.max(...q2.each), false); $('tr-do').textContent = `Verkaufen${trQty > 1 ? ` (${trQty})` : ''}`; };
    if ($('tr-do')) $('tr-do').onclick = () => trSell([s], trQty);
    if ($('tr-lock')) $('tr-lock').onclick = () => { if (s.lock) delete s.lock; else { s.lock = true; trMarks.delete(s); } trPaint(); };
  }
  paintIcons(d);
}
function trSum(q, lo, hi, buy) {
  if (!q.each.length) return buy ? `<span class="bad">${S.gold < (q.one || 0) ? 'Zu wenig Gold' : 'Nicht verfügbar'}</span> · ${icoTag('res_gold', 1)} ${q.one || 0} je Stück` : '—';
  return `${icoTag('res_gold', 1)} je Stück <b>${lo === hi ? lo : lo + '–' + hi}</b> · Gesamt <b class="tot">${q.total}</b> Gold${buy && q.each.length < trQty ? ` <span class="bad">(nur ${q.each.length} bezahlbar)</span>` : ''}`;
}
function trGold(a, b) {                                          /* rollender Goldzähler + Münzklang + Betrag; ohne Bewegung springt er */
  const g = $('trg'), dl = $('tr-dl'); if (!g || a === b) return;
  sfx('coin', Math.min(1, Math.abs(b - a) / 250), 0.8);
  if (dl) { dl.textContent = (b > a ? '+' : '−') + Math.abs(b - a); dl.className = 'on ' + (b > a ? 'up' : 'dn'); clearTimeout(dl._t); dl._t = setTimeout(() => { dl.className = ''; }, 1400); }
  if (S.settings.motion === false) { g.textContent = b; return; }
  const t0 = performance.now(), D = 480, step = now => { const k = Math.min(1, (now - t0) / D); if ($('trg') !== g) return; g.textContent = Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step); clearTimeout(g._t); g._t = setTimeout(() => { if ($('trg') === g) g.textContent = S.gold; }, D + 80);   /* ohne Bildtakt (Fenster verdeckt): Endstand sicher */
}
function trFail() { const g = $('tr-gold'); if (!g) return; g.classList.remove('fail'); void g.offsetWidth; g.classList.add('fail'); }
function trBuy(key, n) {
  const npc = trNpc, g0 = S.gold, q = A.buyQuote(npc, key, n);
  if (!q.each.length) { if (S.gold < q.one) { trFail(); toast('Zu wenig Gold'); A.shopBark?.(npc, 'poor'); } else if (!q.room) toast('Tasche voll'); else toast('Ausverkauft.'); return trPaint(); }
  A.buyMany(npc, key, n);
  if (S.gold !== g0) { trGold(g0, S.gold); A.shopBark?.(npc, rarLv({ key }) >= 2 ? 'rare' : 'buy'); }
  trPaint();
}
// Entwickler 02.10.2026: Verkauf ab Selten nur nach Rückfrage (kein Rückkauf). ok = schon bestätigt.
function trSell(objs, n, ok = false) {
  const rare = objs.filter(o => rarLv(o) >= 2 && !o.lock);
  if (!ok && rare.length) {
    document.querySelector('.tr-ask')?.remove();
    const names = rare.slice(0, 3).map(o => `<b>${o.name || ITEMS[o.key]?.name || o.key}</b>`).join(', ') + (rare.length > 3 ? ` und ${rare.length - 3} weitere` : '');
    const d = el('div', 'tr-ask', `<div>${names} wirklich verkaufen?<br><small>Einen Rückkauf gibt es nicht.</small></div><div class="tr-ask-b"><button class="yes">Verkaufen</button><button class="no">Behalten</button></div>`);
    document.body.appendChild(d);
    d.querySelector('.yes').onclick = () => { d.remove(); trSell(objs, n, true); };
    d.querySelector('.no').onclick = () => { d.remove(); trPaint(); };
    return;
  }
  const npc = trNpc, p = S.player, g0 = S.gold, list = objs.map(o => ({ idx: p.inv.indexOf(o), n: Math.min(n, o.count || 1) })).filter(x => x.idx >= 0);
  if (objs.some(o => o.lock) && objs.length === 1) { toast('Gesperrt. Erst entsperren, dann verkaufen.'); return trPaint(); }
  const r = A.sellMany(npc, list);
  if (S.gold !== g0) { trGold(g0, S.gold); A.shopBark?.(npc, r.rare ? 'rare' : 'sell'); }
  trPaint();
}

// UI-Scheibe 5 + quests.md Q11 (Entscheidung 01.10.: Pergament für das Auftragsbuch): Doppelseite — links die Liste mit Siegeln (offen, bereit
// zur Abgabe, erfüllt, zerrissen), rechts der Brief des gewählten Auftrags: Geber mit Bild (Bewohner auf „Sehr schwer“ ohne), Ziel-Piktogramme mit
// Kerben, Ort, Frist, Lohn (feste Aufträge vor dem Abschluss nur als Symbol). Ordnen nach Stand oder Entfernung (nur Anzeige).
// ---- Handwerk als Dock (UI-Scheibe 3, ui_redesign §5 „Handwerk“) ----
// Rezeptkarten statt Gesprächszeilen: Bild des Ergebnisses, Material als Piktogramm + Zahl (rot, wenn es fehlt), Schloss bei zu niedriger Fertigkeit.
// Rechts die Bildkarte des Ergebnisses, die Güte-Chancen als Balken (exakt aus der Regel des Spiels), Herstellen / mit Königseisen / Ausbessern.
let crSel = null, crArg = null;
const RES_ICO = { wood: 'res_wood', stone: 'res_stone', iron: 'res_iron', herb: 'res_herb', food: 'res_food' };
function matPic(m) {
  const nm = ITEMS[m.key]?.name || RES_NAME[m.key] || m.key, ic = RES_ICO[m.key] ? icoImg(RES_ICO[m.key], 1, 'ico') : `<canvas class="cr-mi" data-ico="${m.key}"></canvas>`;
  return `<span class="bcost${m.have < m.n ? ' miss' : ''}" title="${qa(nm)}: ${m.n} nötig, ${Math.floor(m.have)} vorhanden">${ic}${m.n}</span>`;
}
function craftUI(body, arg) {
  if (arg) crArg = arg; if (!crArg) return; const V = A.craftView?.(crArg.st); if (!V) return;
  $('modal-title').textContent = V.name; body.className = 'cr-body';
  if (!V.list.some(r => r.key === crSel)) crSel = (V.list.find(r => r.ok) || V.list[0])?.key || null;
  body.innerHTML = `<div class="cr-head"><span title="Höhere Fertigkeit: bessere Güte, schwerere Rezepte">${qa(V.skillName)} <b>${V.skill}</b></span>${V.mend ? `<button class="mini" id="cr-mend" title="${V.st === 'bench' ? 'Ausrüstung ausbessern' : 'Ausrüstung ausbessern oder Prothesen warten'}">Ausbessern</button>` : ''}</div>
    <div class="cr-cols"><div><div class="cr-grid">${V.list.map(r => `<button class="cr-card${r.ok ? '' : ' cant'}${r.key === crSel ? ' sel' : ''}" data-k="${r.key}"><canvas class="cr-ic" data-ico="${r.key}"></canvas><span class="cr-n"></span>${r.n > 1 ? `<b class="cr-x">×${r.n}</b>` : ''}<span class="cr-need">${r.need.map(matPic).join('')}</span>${r.min && V.skill < r.min ? `<span class="cr-lock" title="Braucht ${qa(V.skillName)} ${r.min}">${LOCK_SVG}${r.min}</span>` : ''}</button>`).join('') || '<div class="ledger">Hier lässt sich nichts herstellen.</div>'}</div>
      <div class="ledger cr-hint">Klick: ansehen · Doppelklick: herstellen. Rote Zahl = Material fehlt, Schloss = Fertigkeit zu niedrig.</div></div>
      <div class="cr-detail" id="cr-det"></div></div>`;
  body.querySelectorAll('.cr-card').forEach(b => { const r = V.list.find(x => x.key === b.dataset.k); b.querySelector('.cr-n').textContent = ITEMS[r.key].name;
    b.onclick = () => { crSel = r.key; craftUI(body); }; b.ondblclick = () => crDo(body, r, false); });
  if ($('cr-mend')) $('cr-mend').onclick = () => { const t = crArg.t; closeModal(); A.craftMend?.(t); };
  const r = V.list.find(x => x.key === crSel), d = $('cr-det');
  if (r) { const bar = (ch, lab) => `<div class="cr-q" title="${lab}: ${V.quals.map((q, i) => `${q} ${Math.round(ch[i] * 100)} %`).filter((_, i) => ch[i] > 0.004).join(' · ')}"><small>${lab}</small><div class="cr-qbar">${ch.map((c, i) => c > 0.004 ? `<i class="q${i}" style="width:${(c * 100).toFixed(1)}%">${c > 0.14 ? V.quals[i] : ''}</i>` : '').join('')}</div></div>`;
    d.innerHTML = itemCardHTML({ key: r.key }, { short: true }) + `<div class="cr-needl">${r.need.map(matPic).join('')}</div>` + bar(V.chances, 'Erwartete Güte')
      + (V.ke ? bar(V.chancesKE, 'Mit Königseisen') : '')
      + `<div class="tr-box"><button id="cr-do" class="big"${r.ok ? '' : ' disabled'}>${r.ok ? 'Herstellen' : r.min && V.skill < r.min ? `Braucht ${qa(V.skillName)} ${r.min}` : 'Material fehlt'}</button>${V.ke ? `<button id="cr-ke"${r.ok ? '' : ' disabled'}>Mit Königseisen (eine Güte höher)</button>` : ''}</div>`;
    $('cr-do').onclick = () => crDo(body, r, false); if ($('cr-ke')) $('cr-ke').onclick = () => crDo(body, r, true); }
  else d.innerHTML = '';
  paintIcons(body);
}
function crDo(body, r, ke) {
  const before = S.player.inv.length; A.craftDo?.(r.key, ke); craftUI(body);
  const c = body.querySelector(`.cr-card[data-k="${r.key}"]`); if (c && S.settings?.motion !== false) { c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); }
  if (S.player.inv.length !== before) sfx('metal', 0.3, 0.3);
}
// ---- Betriebe (Reiter unter Siedlung, Entwickler 02.10.2026) ----
// Links die eigenen Betriebe als Karten mit dem Bild ihres Hauses und der Kasse; rechts der gewählte: Haus groß, Ertrag gestern und im Schnitt,
// Arbeiter (Stadt + angeworben), Vorprodukte und Ware mit dem Vorrat der Stadt, Stufe, Kasse mit „Abholen“ (nur vor Ort).
let bzSel = null;
function houseTo(cv, h) {
  const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.fillStyle = '#14110d'; c.fillRect(0, 0, cv.width, cv.height);
  let im = null; try { im = h && A.houseSprite?.(h, false); } catch (e) { im = null; }
  if (!im) { c.fillStyle = '#3b3227'; c.fillRect(cv.width / 2 - 14, cv.height / 2 - 6, 28, 18); c.beginPath(); c.moveTo(cv.width / 2 - 18, cv.height / 2 - 6); c.lineTo(cv.width / 2, cv.height / 2 - 20); c.lineTo(cv.width / 2 + 18, cv.height / 2 - 6); c.fill(); return; }
  const k = Math.min((cv.width - 4) / im.width, (cv.height - 4) / im.height); c.drawImage(im, Math.round((cv.width - im.width * k) / 2), Math.round(cv.height - 2 - im.height * k), Math.round(im.width * k), Math.round(im.height * k));
}
const goodPic = (x, extra) => `<span class="bz-g" title="${qa(ITEMS[x.g]?.name || x.g)}: ${extra}"><canvas data-ico="${x.g}"></canvas><b>${x.n}</b><small>${x.stock}</small></span>`;
function bizUI(body) {
  const L = A.bizView?.() || []; body.className = 'bz-body';
  if (!L.length) { body.innerHTML = `<div class="ledger">Dir gehört noch kein Betrieb. Im Handelskontor einer Stadt (beim Markthändler: „Handelskontor … Betriebe“) kannst du Werkstätten, Höfe und Webereien kaufen. Der Gewinn sammelt sich dann hier in ihrer Kasse.</div>`; return; }
  if (!L.some(b => b.id === bzSel)) bzSel = L[0].id;
  const sum = L.reduce((n, b) => n + b.kasse, 0);
  body.innerHTML = `<div class="bz-top">${icoImg('res_gold', 1, 'ico')} In allen Kassen <b>${sum}</b> Gold</div><div class="bz"><div class="bz-list">${L.map(b => `<button class="bz-card${b.id === bzSel ? ' sel' : ''}${b.lost ? ' lost' : ''}" data-b="${b.id}"><canvas class="bz-pic" width="96" height="64"></canvas><span class="bz-n"></span><span class="bz-k">${icoImg('res_gold', 1, 'ico')}${b.kasse}</span></button>`).join('')}</div><div class="bz-det" id="bz-det"></div></div>`;
  body.querySelectorAll('.bz-card').forEach((c, i) => { const b = L[i]; c.querySelector('.bz-n').textContent = b.name; houseTo(c.querySelector('canvas'), b.house); c.onclick = () => { bzSel = b.id; bizUI(body); }; });
  const b = L.find(x => x.id === bzSel), d = $('bz-det'), sg = v => v == null ? '—' : (v > 0 ? '+' : '') + v;
  d.innerHTML = `<canvas class="bz-big" width="240" height="150"></canvas><h3 class="bz-h"></h3><div class="ledger bz-sub">${qa(b.trade)} · ${qa(b.town)} · Stufe ${b.level}${b.lost ? ' · <span class="bad">die Stadt ist verloren</span>' : ''}</div>
    <div class="statline" title="Dein Anteil (gut ein Drittel des Warenwerts) abzüglich Lohn der Angeworbenen"><span>Ertrag gestern</span><b class="${(b.last || 0) < 0 ? 'bad' : ''}">${sg(b.last)} Gold</b></div>
    <div class="statline" title="Schnitt über ${b.days} Tag(e), seit der Betrieb dir gehört"><span>Schnitt je Tag</span><b>${sg(b.avg)} Gold</b></div>
    <div class="statline" title="Bewohner, die in diesem Gewerbe arbeiten, und von dir angeworbene Hände (je 3 Gold Lohn am Tag)"><span>Arbeiter</span><b>${b.folk} aus der Stadt · ${b.hired} angeworben</b></div>
    <div class="statline" title="Warenwert, den der Betrieb gestern gemacht hat"><span>Ware gestern</span><b>${b.made} Gold</b></div>
    ${b.inp.length ? `<div class="bz-row"><small>Vorprodukte je Arbeiter</small>${b.inp.map(x => goodPic(x, `${x.n} je Arbeiter und Tag · Vorrat der Stadt ${x.stock}`)).join('')}</div>` : ''}
    <div class="bz-row"><small>Ware je Arbeiter</small>${b.out.map(x => goodPic(x, `${x.n} je Arbeiter und Tag · Vorrat der Stadt ${x.stock}`)).join('') || '<span class="ledger">—</span>'}</div>
    <div class="bz-kasse"><span>${icoImg('res_gold', 2, 'gold-ico')}<b>${b.kasse}</b> Gold in der Kasse</span><button id="bz-take" class="big"${b.here && b.kasse > 0 ? '' : ' disabled'} title="${b.here ? 'In die eigene Tasche' : 'Nur vor Ort — in ' + qa(b.town)}">${b.here ? 'Abholen' : 'Nur vor Ort'}</button></div>
    <div class="ledger bz-hint">Der Gewinn sammelt sich jeden Tag in der Kasse. Abholen kannst du ihn in ${qa(b.town)} — hier oder im Handelskontor. Fällt die Stadt an die Toten oder wird zerstört, ist die Kasse verloren.</div>`;
  d.querySelector('.bz-h').textContent = b.name; houseTo(d.querySelector('.bz-big'), b.house); paintIcons(d);
  $('bz-take').onclick = () => { const g0 = S.gold, r = A.bizCollect?.(b.id); if (r) toast(r); else sfx('coin', Math.min(1, (S.gold - g0) / 250), 0.8); bizUI(body); refreshHUD(); };
}
// ---- Schmiede als Dock (Entwickler 02.10.2026) ----
// Links alle abgenutzten Teile (angelegte zuerst) mit Zustandsbalken, Klick wählt ab/an (alle sind gewählt); rechts Auswahl, Preis nach der alten
// Regel des Schmieds, „Ausbessern“. Dazu: Waren des Schmieds (Handels-Dock) und — steht eine Esse oder ein Amboss nahe — selbst schmieden.
let smNpc = null, smOff = new Set();
function smithUI(body, npc) {
  if (npc && npc !== smNpc) { smNpc = npc; smOff = new Set(); } npc = smNpc; if (!npc) return;
  body.className = 'tr-body sm-body'; $('modal-title').textContent = 'Schmiede';
  const L = A.smithItems?.() || [], sel = L.filter(x => !smOff.has(x.o)), cost = A.smithPrice?.(sel.map(x => x.o)) || 0, forge = A.smithForge?.(npc);
  body.innerHTML = `<div class="tr"><div class="tr-head"><canvas id="tr-por" width="56" height="56"></canvas><div class="tr-who"><div class="tr-name"></div><div class="tr-prof">${icoImg('nav_build', 1, 'kpi-ico')} ${qa(npc.prof || 'Schmied')}</div></div>
      <div class="tr-gold" title="Dein Gold">${icoImg('res_gold', 2, 'gold-ico')}<b>${S.gold}</b></div></div>
    <div class="sm-tabs">${npc.shop ? '<button id="sm-shop" class="mini">Waren ansehen</button>' : ''}${forge ? '<button id="sm-forge" class="mini" title="Selbst schmieden an der Esse nebenan (Rezeptkarten)">An der Esse selbst schmieden</button>' : ''}</div>
    <div class="tr-cols"><div class="tr-main"><div class="tr-sec">${icoImg('nav_build', 1, 'kpi-ico')} Ausbessern</div>
      <div class="sm-grid" id="sm-grid">${L.length ? '' : '<div class="ledger">„Nichts davon braucht mich.“ — alles ist heil.</div>'}</div></div>
      <div class="tr-deal" id="sm-deal"></div></div></div>`;
  body.querySelector('.tr-name').textContent = npc.name; drawPortraitTo($('tr-por'), npc);
  const g = $('sm-grid');
  for (const x of L) { const c = el('div', 'cell'); c.dataset.card = '1'; c._card = () => itemCardHTML(x.o, { short: true, equipped: !!x.eq }); g.appendChild(c);
    paintCell(c, x.o, { mk: !smOff.has(x.o), tag: x.eq ? '<span class="sm-eq" title="angelegt">●</span>' : '' });
    c.onclick = () => { if (smOff.has(x.o)) smOff.delete(x.o); else smOff.add(x.o); smithUI(body); }; }
  $('sm-deal').innerHTML = L.length ? `<div class="ledger">${sel.length} von ${L.length} Stücken gewählt. Klick auf ein Teil wählt es ab oder wieder an.</div>
      <div class="tr-box"><div class="tr-sum">${icoImg('res_gold', 1, 'kpi-ico')} Preis <b class="tot">${cost}</b> Gold${S.gold < cost ? ' · <span class="bad">zu wenig Gold</span>' : ''}</div>
      <button id="sm-do" class="big"${sel.length && S.gold >= cost ? '' : ' disabled'}>Ausbessern${sel.length ? ` (${sel.length})` : ''}</button>
      <button id="sm-all" class="mini">${smOff.size ? 'Alle wählen' : 'Keins wählen'}</button></div>
      <div class="ledger tr-help">Der Schmied macht jedes Stück wieder ganz (100 %). Preis: der Schaden am Stück mal halber Wert, zusammen mindestens 5 Gold. Selbst ausbessern geht an Esse, Amboss oder Werkbank nur bis 80 %.</div>` : '';
  if ($('sm-do')) $('sm-do').onclick = () => { const g0 = S.gold, r = A.smithRepair?.(npc, sel.map(x => x.o)); if (r) { toast(r); return; } sfx('metal', 0.5, 0.5); sfx('coin', Math.min(1, (g0 - S.gold) / 250), 0.6); A.shopBark?.(npc, 'buy'); smOff = new Set(); smithUI(body); };
  if ($('sm-all')) $('sm-all').onclick = () => { smOff = smOff.size ? new Set() : new Set(L.map(x => x.o)); smithUI(body); };
  if ($('sm-shop')) $('sm-shop').onclick = () => openModal('trade', npc);
  if ($('sm-forge')) $('sm-forge').onclick = () => { closeModal(); A.openForge?.(forge); };
  /* Verbessern und Schmieden lassen (03.10.2026) */
  const U = A.smithUpgList?.(npc) || [], O = A.smithOrders?.() || [], main = body.querySelector('.tr-main');
  const sec = document.createElement('div'); sec.innerHTML = `<div class="tr-sec">${icoImg('nav_build', 1, 'kpi-ico')} Verbessern <span class="ledger">— eine Gütestufe höher, bis „Meisterlich“</span></div>
    <div class="sm-rows">${U.length ? U.map((x, i) => `<div class="sm-row"><span class="sm-cell" data-u="${i}"></span><span class="sm-txt"><b>${qa(ITEMS[x.o.key].name)}</b>${x.eq ? ' <span class="sm-eq">●</span>' : ''}<br><span class="ledger">${x.u.from} → <b>${x.u.to}</b> · ${x.u.gold} Gold · ${x.u.iron} Eisen</span></span><button class="mini" data-up="${i}"${S.gold < x.u.gold ? ' disabled' : ''}>Verbessern</button></div>`).join('') : '<div class="ledger">Nichts, was sich verbessern lässt.</div>'}</div>
    <div class="tr-sec">${icoImg('nav_build', 1, 'kpi-ico')} Schmieden lassen <span class="ledger">— aus deinem Material, gegen Lohn</span></div>
    <div class="sm-rows">${O.map((x, i) => `<div class="sm-row${x.ok ? '' : ' off'}"><span class="sm-cell" data-o="${i}"></span><span class="sm-txt"><b>${qa(x.name)}</b><br><span class="ledger">${Object.entries(x.need).map(([m, n]) => `${n} ${qa(ITEMS[m]?.name || m)}`).join(', ')} · Lohn ${x.fee} Gold</span></span><button class="mini" data-or="${i}"${x.ok && S.gold >= x.fee ? '' : ' disabled'}>Schmieden</button></div>`).join('')}</div>`;
  main?.appendChild(sec);
  sec.querySelectorAll('[data-u]').forEach(c => { const x = U[+c.dataset.u]; paintCell(c, x.o, {}); });
  sec.querySelectorAll('[data-o]').forEach(c => { const x = O[+c.dataset.o]; paintCell(c, { key: x.key }, {}); });
  sec.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const r = A.smithUpgrade(npc, U[+b.dataset.up].o); if (r) toast(r); else { sfx('metal', 0.6, 0.7); sfx('coin', 0.4, 0.6); } smithUI(body); });
  sec.querySelectorAll('[data-or]').forEach(b => b.onclick = () => { const r = A.smithCommission(npc, O[+b.dataset.or].key); if (r) toast(r); else { sfx('metal', 0.6, 0.5); sfx('coin', 0.4, 0.6); } smithUI(body); });
}
// ---- Kutsche und Fähre als Dock (Entwickler 02.10.2026: Dialog-Listen mit GUI) ----
// Oben die Weltkarte (dieselbe gemalte Karte wie M, mit Nebel) mit Abfahrt und Zielen; darunter je Ziel eine Karte: Name, Preis, Dauer,
// „unsichere Strecke“, Schloss ohne Aufenthaltsschein. Klick auf Karte oder Kartenpunkt = abfahren.
let tvNpc = null;
function travelUI(body, npc) {
  if (npc) tvNpc = npc; npc = tvNpc; if (!npc) return; const V = A.coachView?.(npc); if (!V) return;
  body.className = 'tr-body tv-body'; $('modal-title').textContent = V.ferry ? 'Fähre' : 'Kutsche';
  body.innerHTML = `<div class="tr-head"><canvas id="tr-por" width="56" height="56"></canvas><div class="tr-who"><div class="tr-name"></div><div class="tr-prof"></div></div>
      <div class="tr-gold" title="Dein Gold">${icoImg('res_gold', 2, 'gold-ico')}<b>${S.gold}</b></div></div>
    <canvas id="tv-map" class="tv-map" width="560" height="300" title="Klick auf ein Ziel: abfahren"></canvas>
    <div class="tv-list">${V.dests.map(d => `<button class="tv-card${d.locked || S.gold < d.price ? ' cant' : ''}${d.risky ? ' risky' : ''}" data-k="${d.k}"><span class="tv-n"></span>
      <span class="tv-f"><span title="Preis">${icoImg('res_gold', 1, 'kpi-ico')}${d.price}</span><span title="Dauer der Fahrt">${icoImg('time', 1, 'kpi-ico')}~${d.hours} Std</span>${d.risky ? `<span class="bad" title="Auf dieser Strecke wird öfter überfallen">${icoImg('warn', 1, 'kpi-ico')}unsicher</span>` : ''}${d.locked ? `<span class="bad" title="Ins Hochreich nur mit Aufenthaltsschein">${LOCK_SVG}Schein</span>` : ''}</span></button>`).join('')}</div>
    <div class="ledger tr-help">Die Zeit vergeht unterwegs. Auf unsicheren Strecken hält ein Überfall die Fahrt auf halber Strecke an — dann musst du dich durchschlagen.</div>`;
  body.querySelector('.tr-name').textContent = npc.name; body.querySelector('.tr-prof').textContent = `${npc.prof || ''} · ${V.fromName}`; drawPortraitTo($('tr-por'), npc);
  body.querySelectorAll('.tv-card').forEach((b, i) => { b.querySelector('.tv-n').textContent = V.dests[i].name; b.onclick = () => { const r = A.coachGo?.(npc, b.dataset.k); if (r) toast(r); }; });
  const cv = $('tv-map'); let X = null; try { X = A.drawAtlas?.(cv, 1); } catch (e) { X = null; }
  if (X) { const c = cv.getContext('2d'), P = (x, y) => [X.ox + x * X.sc, X.oy + y * X.sc], [fx, fy] = P(V.sx, V.sy);
    for (const d of V.dests) { const [x, y] = P(d.x, d.y); c.strokeStyle = d.risky ? 'rgba(208,96,63,.85)' : 'rgba(224,183,90,.85)'; c.lineWidth = 2; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(fx, fy); c.lineTo(x, y); c.stroke(); c.setLineDash([]);
      c.fillStyle = d.locked ? '#6d6454' : '#e0b75a'; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); c.fillStyle = '#e7dcc2'; c.font = '11px Spectral, serif'; c.textAlign = 'center'; c.fillText(d.name, x, y - 9); }
    c.fillStyle = '#c0503a'; c.beginPath(); c.arc(fx, fy, 6, 0, 7); c.fill(); c.strokeStyle = '#1a140c'; c.lineWidth = 2; c.stroke();
    cv.onclick = e => { const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) * cv.width / r.width, my = (e.clientY - r.top) * cv.height / r.height;
      const d = V.dests.map(d => [d, Math.hypot(P(d.x, d.y)[0] - mx, P(d.x, d.y)[1] - my)]).sort((a, b) => a[1] - b[1])[0]; if (d && d[1] < 18) { const m = A.coachGo?.(npc, d[0].k); if (m) toast(m); } }; }
  else cv.remove();
}
let qbSel = null;
const QB_WORD = { active: 'offen', ready: 'bereit', done: 'erfüllt', failed: 'gescheitert' };
function questUI(body) {
  body.className = 'qb-body';
  const ord = { active: 0, done: 1, failed: 2 }, byDist = S.settings?.qSort === 'dist';
  const L = Object.entries(S.quests).filter(([k]) => QUESTS[k]).map(([k, v]) => { const Q = QUESTS[k], I = v.state === 'active' && A.questInfo ? A.questInfo(k) : {};
    const ready = v.state === 'active' && Q.objectives.every((o, i) => (v.progress?.[i] || 0) >= (o.count || 1)); return { k, v, Q, I, st: ready ? 'ready' : v.state }; })
    .sort((a, b) => ord[a.v.state] - ord[b.v.state] || (b.I.tracked ? 1 : 0) - (a.I.tracked ? 1 : 0) || (byDist && a.v.state === 'active' ? (a.I.dist ?? 1e12) - (b.I.dist ?? 1e12) : 0));
  if (!L.length) { body.innerHTML = '<div class="qb"><div class="qb-empty">Keine Aufträge. Frag im Dorf nach — wer Arbeit hat, trägt ein Siegel über dem Kopf; am Anschlagbrett hängen Zettel.</div></div>'; return; }
  if (!L.some(x => x.k === qbSel)) qbSel = (L.find(x => x.I.tracked) || L[0]).k;
  body.innerHTML = `<div class="qb"><div class="qb-left"><div class="qb-sort">Ordnen <button data-s="state" class="${byDist ? '' : 'on'}">Stand</button><button data-s="dist" class="${byDist ? 'on' : ''}" title="Offene Aufträge nach Entfernung">Entfernung</button></div>
    <div class="qb-list">${L.map(x => `<button class="qb-it st-${x.st}${x.k === qbSel ? ' sel' : ''}" data-q="${x.k}" title="${QB_WORD[x.st]}${x.I.tracked ? ' · wird verfolgt' : ''}"><i class="qb-seal"></i><span class="qb-n"></span>${x.v.state === 'active' ? x.Q.objectives.map((o, i) => pips(x.v.progress?.[i] || 0, o.count || 1)).join('') : ''}${x.I.tracked ? '<i class="qb-trk"></i>' : ''}</button>`).join('')}</div></div>
    <div class="qb-page" id="qb-page"></div></div>`;
  body.querySelectorAll('.qb-it').forEach((b, i) => { b.querySelector('.qb-n').textContent = L[i].Q.name; b.onclick = () => { qbSel = b.dataset.q; questUI(body); }; });
  body.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { S.settings.qSort = b.dataset.s; questUI(body); });
  const x = L.find(y => y.k === qbSel), pg = $('qb-page'), G = A.questGiver?.(x.k) || { label: '' }, B = A.bookBrief?.(x.k), active = x.v.state === 'active';
  pg.innerHTML = `<div class="qb-letter st-${x.st}"><div class="qb-head">${G.npc ? '<canvas id="qb-por" width="56" height="56"></canvas>' : `<span class="qb-por0">${icoImg(G.label.startsWith('Anschlag') ? 'log_quest' : 'set_level', 3, 'qb-pi')}</span>`}
      <div class="qb-ttl"><h2></h2><div class="qb-giver"></div></div><div class="qb-stamp">${QB_WORD[x.st]}</div></div>
    <p class="qb-desc"></p>
    <div class="qb-objs">${x.Q.objectives.map((o, i) => { const done = (x.v.progress?.[i] || 0) >= (o.count || 1), cur = !done && x.Q.objectives.slice(0, i).every((q, j) => (x.v.progress?.[j] || 0) >= (q.count || 1));
      return `<div class="qb-obj${done ? ' done' : cur ? ' cur' : ''}"><i class="qb-chk">${done ? '☑' : cur ? '▸' : '☐'}</i>${B?.objs?.[i] ? objIco(B.objs[i]) : ''}<span class="qb-ot"></span>${pips(x.v.progress?.[i] || 0, o.count || 1)}</div>`; }).join('')}</div>
    ${x.I.where ? `<div class="qb-line">${icoImg('nav_map', 1, 'qb-li')}<span>${qa(x.I.where)}</span></div>` : active && x.Q.objectives.some(o => o.type === 'find') ? `<div class="qb-line">${icoImg('nav_map', 1, 'qb-li')}<span>Kein Ziel auf der Karte — die Suche ist der Auftrag.</span></div>` : ''}
    ${x.I.timer ? `<div class="qb-line">${icoImg('time', 1, 'qb-li')}<span>${qa(x.I.timer)}</span></div>` : ''}
    ${x.v.outcome ? `<p class="qb-out"></p>` : ''}
    ${B?.rew ? `<div class="qb-rew"><span>Lohn</span>${rewardHTML(B.rew, B.nums)}</div>` : ''}
    ${active ? `<div class="qb-act"><button data-track="${x.k}">${x.I.tracked ? 'Wird verfolgt' : 'Verfolgen'}</button>${x.I.cancel ? `<button data-cancel="${x.k}">Abbrechen</button>` : ''}</div>` : ''}</div>`;
  pg.querySelector('h2').textContent = x.Q.name; pg.querySelector('.qb-giver').textContent = G.label ? 'Auftraggeber: ' + G.label : '';
  pg.querySelector('.qb-desc').textContent = x.Q.desc || ''; pg.querySelectorAll('.qb-ot').forEach((t, i) => { t.textContent = x.Q.objectives[i].text; });
  if (x.v.outcome) pg.querySelector('.qb-out').textContent = x.v.outcome;
  if (G.npc && $('qb-por')) drawPortraitTo($('qb-por'), G.npc); paintBrief(pg);
  pg.querySelectorAll('[data-track]').forEach(b => b.onclick = () => { A.trackQuest(b.dataset.track); questUI(body); });
  pg.querySelectorAll('[data-cancel]').forEach(b => b.onclick = () => { if (b.dataset.sure) { A.cancelQuest(b.dataset.cancel); questUI(body); } else { b.dataset.sure = 1; b.textContent = 'Wirklich abbrechen?'; } });
}

function settingsUI(body) {
  body.innerHTML = `<div class="sheet" style="grid-template-columns:1fr 1fr">
    <div><h3>Darstellung</h3>
      <div class="ctx-actions">${['low:Kaum Blut', 'reduced:Reduziert', 'standard:Voll'].map(s => { const [k, n] = s.split(':');
        return `<button data-v="${k}" class="${S.settings.violence === k ? 'on' : ''}" aria-pressed="${S.settings.violence === k}">${n}</button>`; }).join('')}</div>
      <h3 style="margin-top:14px">Grafikstil</h3>
      <div class="ctx-actions"><button data-art="D" class="${S.settings.art === 'D' ? 'on' : ''}">Klassisch</button><button data-art="R" class="${S.settings.art === 'R' ? 'on' : ''}">Neu (gezeichnet)</button></div>
      <h3 style="margin-top:14px">Schadenszahlen</h3>
      <div class="ctx-actions" title="Reduziert: nur dein eigener Schaden und kritische Treffer. Die Farbe zeigt die Schadensart (hell Hieb, orange Feuer, blau Frost, grün Gift, dunkelrot Blutung, violett Magie/Schatten, gold Krit).">${[['off', 'Aus'], ['reduced', 'Reduziert'], ['full', 'Voll']].map(([k, n]) =>
        `<button data-dn="${k}" class="${(S.settings.dmgNums || 'full') === k ? 'on' : ''}" aria-pressed="${(S.settings.dmgNums || 'full') === k}">${n}</button>`).join('')}</div>
      <h3 style="margin-top:14px">Bewegung</h3>
      <div class="ctx-actions"><button id="mot">Reduzierte Bewegung: ${S.settings.motion ? 'aus' : 'an'}</button></div>
      <h3 style="margin-top:14px">Ton</h3>
      <div class="ctx-actions">${[[0, 'Aus'], [0.35, 'Leise'], [0.7, 'Normal'], [1, 'Laut']].map(([v, n]) =>
        `<button data-vol="${v}" class="${(S.settings.volume ?? 0.7) === v ? 'on' : ''}">${n}</button>`).join('')}</div>
      <h3 style="margin-top:14px">Textgröße</h3>
      <div class="ctx-actions"><button data-t="0.9">Klein</button><button data-t="1">Normal</button><button data-t="1.15">Groß</button></div>
    </div>
    <div><h3>Steuerung</h3><div class="ledger">
      WASD — Bewegen<br>Linksklick / Leertaste — Angriff<br><b>Strg + Angriff</b> — Neutrale angreifen (Ruf-Folgen)<br>E — Interagieren<br>Q — Ausweichen<br>V — Schleichen an/aus<br>Umschalt (halten) — Deckung; im ersten Augenblick eines Hiebs parieren<br>R — Pferd pfeifen / absitzen<br>1–9, 0 — Fähigkeiten und Zauber<br>Rechtsklick auf eine Figur — auswählen (Infos rechts)<br>Esc / Leertaste — Kamerafahrt überspringen<br>
      I Inventar · C Charakter · G Gruppe · B Lager · F Fraktion · K Chronik · M Karte<br>J — Aufträge · T — Talente · Z — Zauberbuch · H — Kodex · X — Effekte · N — Minikarte<br>Rechtsklick auf die Leiste — Platz leeren<br>Mausrad — Zoom<br>Esc — Schließen<br>Strg+Shift+D — Debug</div>
      <h3 style="margin-top:14px">Spielstand</h3>
      <div class="ctx-actions"><button id="sv">Jetzt speichern</button><button id="quit">Zum Hauptmenü</button><button id="coopb" title="Zu zweit über das Netz: Code erzeugen oder beitreten">Koop (Netzwerk)</button></div>
      <h3 style="margin-top:14px">Auf anderem Gerät weiterspielen</h3>
      <div class="ledger">Der Spielstand wird hier im Browser mit deinem Passwort verschlüsselt (AES-256). Leg die Datei in einen
        Cloud-Ordner (OneDrive, Google Drive, Dropbox) und lade sie auf dem anderen Gerät mit demselben Passwort. Ohne Passwort
        kann niemand die Datei lesen — auch du nicht, wenn du es vergisst.</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">
        <input id="cs-pw" type="password" autocomplete="new-password" placeholder="Passwort (mind. ${CS.MIN_PW} Zeichen)" class="cs-in" style="height:28px;box-sizing:border-box;background:#15120e;color:#e8dcc4;border:1px solid #5a4a34;padding:4px 8px;font:inherit">
        <input id="cs-pw2" type="password" autocomplete="new-password" placeholder="Passwort wiederholen (nur für Export)" class="cs-in" style="height:28px;box-sizing:border-box;background:#15120e;color:#e8dcc4;border:1px solid #5a4a34;padding:4px 8px;font:inherit">
      </div>
      <div class="ctx-actions" style="margin-top:6px"><button id="cs-exp">Verschlüsselt exportieren</button><button id="cs-imp">Datei laden …</button>
        <input id="cs-file" type="file" accept=".rfsave" hidden></div>
      <div class="ledger" id="cs-msg"></div>
    </div></div>`;
  [...body.querySelectorAll('[data-v]')].forEach(b => b.onclick = () => { S.settings.violence = b.dataset.v; refreshModal(); });
  [...body.querySelectorAll('[data-t]')].forEach(b => b.onclick = () => { document.documentElement.style.fontSize = (14 * +b.dataset.t) + 'px'; S.settings.textScale = +b.dataset.t; });
  $('mot').onclick = () => { S.settings.motion = !S.settings.motion; refreshModal(); };
  [...body.querySelectorAll('[data-dn]')].forEach(b => b.onclick = () => { S.settings.dmgNums = b.dataset.dn; refreshModal(); });   /* Kampf-Feedback: Schadenszahlen Aus/Reduziert/Voll */
  [...body.querySelectorAll('[data-art]')].forEach(b => b.onclick = () => { S.settings.art = b.dataset.art; A.setArt?.(b.dataset.art); refreshModal(); });   // Nutzer S13: Stil wählbar
  [...body.querySelectorAll('[data-vol]')].forEach(b => b.onclick = () => { S.settings.volume = +b.dataset.vol; ambience(S.settings.volume > 0); refreshModal(); });
  $('sv').onclick = async () => { const ok = await A.saveNow(); toast(ok ? 'Gespeichert' : S.cine ? 'Während einer Kamerafahrt wird nicht gespeichert.' : 'Speichern fehlgeschlagen — der Browser-Speicher ist voll. Exportiere den Stand unten als Datei.', ok ? 1500 : 5000); };   // S15 (Nutzer: „speichern klappt nicht“)
  $('quit').onclick = () => { Promise.resolve(A.saveNow()).finally(() => { S._quiet = true; location.reload(); }); };   /* komprimiert speichern, dann ohne zweites (JSON-)Speichern beim Entladen neu laden */
  $('coopb').onclick = () => { closeModal(); A.openCoop?.(); };
  cloudButtons();
}
// S15 Paket S: verschlüsselter Export und Import (cloudsave.js). Import behält den bisherigen Stand als Sicherung.
let cloudUrl = null;
function cloudButtons() {
  const msg = t => { $('cs-msg').textContent = t; };
  $('cs-exp').onclick = async () => {
    const pw = $('cs-pw').value;
    if (pw.length < CS.MIN_PW) return msg(`Das Passwort braucht mindestens ${CS.MIN_PW} Zeichen.`);
    if (pw !== $('cs-pw2').value) return msg('Die beiden Passwörter sind nicht gleich.');
    if (!window.isSecureContext || !crypto.subtle) return msg('Verschlüsseln geht nur über https oder localhost. Öffne das Spiel über http://localhost:… statt über eine Netzwerkadresse.');
    let raw = null; try { raw = S.player && !S._quiet ? saveData() : readRaw(); } catch (e) { raw = readRaw(); }   // S15: frisch aus dem Spiel, nicht aus dem (vielleicht vollen) Browser-Speicher
    if (!raw) return msg('Es gibt noch keinen Spielstand.');
    msg('Verschlüssle …');
    try {
      const bytes = await CS.encryptSave(raw, pw), I = CS.saveInfo(raw) || { house: 'Haus', day: 0 };
      if (cloudUrl) URL.revokeObjectURL(cloudUrl);
      cloudUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
      const name = `rotfall-${I.house}-tag${I.day}-${new Date().toISOString().slice(0, 10)}.rfsave`.replace(/[^\w.\-äöüÄÖÜß]/g, '_');
      const a = document.createElement('a'); a.href = cloudUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();   // Versuch 1: automatisch
      $('cs-pw').value = $('cs-pw2').value = '';
      $('cs-msg').innerHTML = `Fertig: Haus ${I.house}, Tag ${I.day}. Kam kein Download? Dann hier klicken: <a href="${cloudUrl}" download="${name}" style="color:#e8c070;text-decoration:underline">${name}</a> (${Math.round(bytes.length / 1024)} KB). Leg die Datei in deinen Cloud-Ordner.`;   // Versuch 2: echter Klick (Safari, iPhone, eingebettete Browser)
    } catch (e) { msg(e.message); }
  };
  $('cs-imp').onclick = () => { if ($('cs-pw').value.length < CS.MIN_PW) return msg('Erst das Passwort eingeben, mit dem die Datei exportiert wurde.'); $('cs-file').click(); };
  $('cs-file').onchange = async () => {
    const f = $('cs-file').files[0]; $('cs-file').value = ''; if (!f) return;
    msg('Entschlüssle …');
    try {
      const inner = await CS.decryptSave(new Uint8Array(await f.arrayBuffer()), $('cs-pw').value), I = CS.saveInfo(inner.save);
      const when = new Date(inner.at).toLocaleString('de-DE');
      if (!confirm(`Spielstand laden?\n\nHaus ${I.house}, Generation ${I.gen}, ${I.name}, Tag ${I.day}\nexportiert am ${when}\n\nDein bisheriger Stand bleibt als Sicherung erhalten.`)) return msg('Abgebrochen.');
      const old = localStorage.getItem(SAVE_KEY);
      try { if (old) localStorage.setItem(SAVE_KEY + '.vor-import', old); }
      catch { return msg('Kein Platz für die Sicherung des bisherigen Stands. Exportiere ihn zuerst, dann lösche alte Stände.'); }
      localStorage.setItem(SAVE_KEY, inner.save);
      S._quiet = true;                                                  // beim Neuladen nicht den alten Stand darüber speichern
      $('cs-pw').value = ''; msg('Geladen. Das Spiel startet neu …'); setTimeout(() => location.reload(), 600);
    } catch (e) { msg(e.message); }
  };
}

// ---------------- Tod & Erbe ----------------
export function showDeath(rec, onLegacy) {
  $('deathscreen').classList.remove('hidden');
  $('death-name').textContent = `${rec.name.toUpperCase()} IST GEFALLEN`;
  $('death-stats').innerHTML = [
    ['Alter', rec.age], ['Tage gelebt', rec.days], ['Getötete Feinde', rec.kills], ['Schlachten', rec.battles],
    ['Gegründete Siedlungen', rec.settlements], ['Familie', rec.family || '—'],
    ['Todesursache', rec.cause], ['Titel', rec.titles || '—'], ['Ort', rec.location], ['Jahr', rec.year],
  ].map(([k, v]) => `<span><span>${k}</span><b>${v}</b></span>`).join('');
  $('death-legacy').onclick = onLegacy;
  $('death-chronicle').onclick = () => { $('deathscreen').classList.add('hidden'); openModal('chronicle'); $('modal').style.zIndex = 40; };
}
export function hideDeath() { $('deathscreen').classList.add('hidden'); }

export function showSuccessors(cands, pick) {
  $('successor').classList.remove('hidden');
  const box = $('succ-cards'); box.innerHTML = '';
  cands.forEach(c => {
    const card = el('div', 'succ-card');
    const cv = el('canvas'); cv.width = cv.height = 72; card.appendChild(cv);
    card.appendChild(el('h3', '', c.name));
    card.appendChild(el('div', 'rel', `${c.relation} · ${c.age} Jahre`));
    card.appendChild(el('div', '', `<div class="row"><span>Klasse</span><b>${CLASSES[c.currentClass].name}</b></div>
      <div class="row"><span>STR</span><b>${c.attributes.strength}</b></div>
      <div class="row"><span>AGI</span><b>${c.attributes.agility}</b></div>
      <div class="row"><span>END</span><b>${c.attributes.endurance}</b></div>
      <div class="row"><span>INT</span><b>${c.attributes.intelligence}</b></div>`));
    card.onclick = () => { $('successor').classList.add('hidden'); pick(c); };
    box.appendChild(card);
    drawPortraitTo(cv, c);
  });
}

