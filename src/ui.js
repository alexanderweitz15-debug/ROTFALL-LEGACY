// Oberfläche: Panels, Modale, Dialog, Chronik. Spiel-Logik hängt über bind() dran.
import { S, onLog, timeStr, year, partyMembers, byId, clamp, dist, seasonOf, SEASONS, SAVE_KEY, saveData, readRaw } from './state.js?v=23';
import * as CS from './cloudsave.js?v=23';
import { ITEMS, RARITY, RARITY_VALUE, AFFIXES, LEGENDS, CLASSES, ABILITIES, FACTIONS, BUILDINGS, MONSTERS, MEMORY_TEXT, QUESTS, SKILL_NAMES, TITLE_CLASSES, SKILL_TREE, SKILL_BRANCHES } from './data.js?v=23';
import { drawPortraitTo, drawItemIconTo, drawFigureTo, cam } from './render.js?v=23';
import { LOCATIONS, locAt, nearestLocations, TS, MAPS, TOWN_PLAN, townAt, DUNGEONS, HOUSES } from './world.js?v=23';
import { wearOf } from './buildings.js?v=23';
import * as SP from './sprites.js?v=23';   /* Bestiarium: Gegnerbilder */
import { townState, townPrice } from './sim.js?v=23';
import { GOODS } from './data.js?v=23';
import { target as ecoTarget } from './economy.js?v=23';
import { PARTS, PART_NAME, partState, buildOf, BUILDS, MECH_Q, MECH_MOD, EYE_Q } from './body.js?v=23';
import { sfx, ambience } from './sfx.js?v=23';

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
  ['char', 'Charakter', 'C', ['character', 'skills', 'spells', 'effects', 'classes']], ['inv', 'Gepäck', 'I', ['inventory']],
  ['party', 'Gruppe', 'G', ['party', 'stable']], ['build', 'Lager & Siedlung', 'B', ['settlement']], ['map', 'Karte', 'M', ['map']],
  ['quest', 'Aufträge', 'J', ['quests']], ['powers', 'Mächte', 'F', ['faction', 'chronicle']], ['codex', 'Kodex', 'H', ['codex']], ['options', 'Optionen', 'Esc', ['settings']],
];
const NAV_SHORT = { char: 'Charakter', inv: 'Inventar', party: 'Gruppe', build: 'Siedlung', map: 'Karte', quest: 'Aufträge', powers: 'Mächte', codex: 'Kodex', options: 'Optionen' };
const SUBTAB = { character: 'Werte (C)', skills: 'Talente (T)', spells: 'Zauber (Z)', effects: 'Effekte (X)', faction: 'Fraktionen (F)', chronicle: 'Chronik (K)' };
// Pixel-Piktogramme (icons.js, Artist). Fehlt die Datei noch, bleibt die Schrift — nichts bricht.
let ICO = null;
const pico = (k, s = 2) => { try { return ICO?.iconURL?.(k, s) || ''; } catch (e) { return ''; } };
const icoImg = (k, s = 2, cls = 'ico') => { const u = pico(k, s); return u ? `<img class="${cls}" src="${u}" alt="">` : ''; };
function loadIcons() { import('./icons.js?v=23').then(m => { ICO = m; paintNav(); iconCss(); HUD_LAST.clear(); renderLog(); }).catch(() => {}); }
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
  document.addEventListener('mouseover', e => {
    const n = tipText(e.target), text = n && n.dataset.tip;
    if (!text) { tip.classList.remove('on'); return; }
    tip.textContent = text; tip.classList.add('on');
  });
  document.addEventListener('mousemove', e => { if (!tip.classList.contains('on')) return;
    const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 6), y = Math.min(e.clientY + 18, innerHeight - tip.offsetHeight - 6);
    tip.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`; });
  document.addEventListener('mouseout', e => { if (!e.relatedTarget || !tipText(e.relatedTarget)) tip.classList.remove('on'); });
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
  let html = bar('Leben', p.hp, p.maxHp, 'hp') + bar('Ausdauer', p.stamina, p.maxStamina, 'sta');
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
      <div class="m-bar"><div style="width:${clamp(m.hp / m.maxHp * 100, 0, 100)}%"></div></div>`));
    d.onclick = () => { A.select(m); };
    list.appendChild(d);
    drawPortraitTo(cv, m);
  } }
  hudSet('res-list', [['wood', 'Holz', S.res.wood], ['stone', 'Stein', S.res.stone], ['iron', 'Eisen', S.res.iron],
    ['herb', 'Kraut', S.res.herb], ['food', 'Nahrung', S.res.food], ['gold', 'Gold', S.gold]]
    .map(([i, k, v]) => { const im = icoImg('res_' + i, 2, 'resico'); return `<span title="${k}" class="${im ? 'hasico' : ''}">${im || k}<b>${Math.floor(v)}</b></span>`; }).join(''), true);   /* UI-Umbau: Piktogramm + Zahl */
  // Kopfzeile
  hudSet('clock-time', `Tag ${S.day} · ${timeStr()} · ${SEASONS[seasonOf()]}`);   // S15 Fehlersuche: S.season blieb ewig „Später Frühling“
  if ($('clock-time').title !== `Jahr ${year()}`) $('clock-time').title = `Jahr ${year()}`;   /* UI-Umbau: Zeit, Wetter, Jahr stehen nur noch oben */
  if ($('clock-weather').dataset.w !== S.weather) { $('clock-weather').dataset.w = S.weather; $('clock-weather').innerHTML = icoImg('w_' + (S.weather === 'sandstorm' ? 'heat' : S.weather), 2, 'wico') || WEATHER_ICON[S.weather] || WEATHER_ICON.clear; $('clock-weather').title = ({ clear:'Klar', cloudy:'Bewölkt', rain:'Regen', fog:'Nebel', snow:'Schnee', sandstorm:'Sandsturm', bloodrain:'Blutregen' }[S.weather] || S.weather) + (A.wxText?.() ? ' — ' + A.wxText() : ''); }   /* Roadmap C.12: Wirkung im Tooltip */
  hudSet('clock-gold', String(S.gold));
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
function stableUI(body, npc) {
  const offers = A.stableOffers(npc), cur = S.mount && A.mountStats(), credit = cur ? Math.round(A.horseValue(cur) * 0.4) : 0;
  const bar = (v, max, col) => `<div style="height:5px;background:#2a2418;margin:2px 0 6px"><div style="height:100%;width:${Math.min(100, v / max * 100)}%;background:${col}"></div></div>`;
  body.innerHTML = `<div class="ledger">${npc.name}: ${offers.length ? 'Das hier steht diese Woche im Stall.' : 'Diese Woche ist alles verkauft. Komm nächste Woche wieder.'} Dein Gold: ${S.gold}.${cur ? ` Dein ${cur.name} wird mit ${credit} Gold angerechnet.` : ''}</div>
    <div class="sheet" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr));margin-top:10px">${offers.map(H => `<div class="panel" style="padding:10px">
      <canvas data-h="${H.id}" width="150" height="100" style="width:150px;height:100px;image-rendering:pixelated;display:block;margin:0 auto"></canvas>
      <b>${H.name}</b><div class="ledger">Tempo ${Math.round(H.tempo * 100)} %${bar(H.tempo - 0.85, 0.4, '#c9a45a')}Ausdauer ${H.staminaMax}${bar(H.staminaMax, 160, '#7fae6e')}Mut ${H.mut}${H.mut >= 70 ? ' (kommt im Kampf)' : ''}${bar(H.mut, 100, '#b86a4a')}</div>
      <div class="ctx-actions"><button data-buy="${H.id}">${cur ? `Eintauschen — ${Math.max(0, H.price - credit)} Gold` : `Kaufen — ${H.price} Gold`}</button></div></div>`).join('')}</div>`;
  const PAL = { horse: { body: '#6a4a30', dark: '#2a1e14', eye: '#1a120c' }, mech_horse: { body: '#a8843a', dark: '#4a3a1e', eye: '#e8a040' }, dead_horse: { body: '#b8b2a0', dark: '#2a2a26', eye: '#5fb39a' } };
  for (const H of offers) { const cv = body.querySelector(`[data-h="${H.id}"]`); if (!cv) continue; import('./sprites.js?v=23').then(SP => { const f = SP.beastFrame('horse', { ...PAL[H.kind], body: H.kind === 'horse' ? ['#6a4a30', '#3a2a20', '#8a6a4a', '#2a2420', '#a08060'][H.name.length % 5] : PAL[H.kind].body }, 'W', '', 1);
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(f, (150 - f.width * 2.4) / 2, 100 - f.height * 2.4, f.width * 2.4, f.height * 2.4); }); }
  body.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { if (A.buyHorse(npc, b.dataset.buy)) closeModal(); else stableUI(body, npc); });
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
function townHeads(key) {
  let n = 0;
  for (const c of S.ents.world) if (c.kind === 'npc' && c.alive && !S.party.includes(c.id)
    && (c.homeTown === key || c.post === key || (!c.villager && !c.guard && !c.escort && !c.escortLost && c.anchor && townAt(c.anchor.x / TS | 0, c.anchor.y / TS | 0) === key))) n++;   // Karawanenwachen sind Reisende
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
      const [nm, what] = HOUSE_INFO[hb.type] || ['Gebäude', ''], who = S.ents[hb.map || 'world'].filter(e => e.kind === 'npc' && e.alive && e.homeId === hb.id);
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
        return `<div class="ctx-line${I.tracked ? ' tracked' : ''}"><span>${I.tracked ? '◆ ' : ''}${Q.name}</span><b>${Q.objectives.map((o, i) => `${v.progress[i] || 0}/${o.count || 1}`).join(' ')}</b></div>`
          + (I.where || I.timer ? `<div class="ctx-line q-sub"><span>${I.where || ''}</span><b>${I.timer || ''}</b></div>` : '');
      }).join('') + '</div>';
    }
    box.innerHTML = h;
    return;
  }
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
      ${bar('Leben', target.hp, target.maxHp, 'hp')}
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
export function dialogue(npc, text, choices) {
  if (uiHooks.dialogue?.(npc, text, choices)) return;
  const box = $('dialogue');
  box.classList.remove('hidden'); dlgWith = npc;   // S13: wer weggeht, beendet das Gespräch (game.js updatePrompt)
  $('dlg-name').textContent = npc.name;
  $('dlg-text').textContent = text; $('dlg-text').style.whiteSpace = 'pre-line';   // Anschlagbrett: mehrere Zeilen
  drawPortraitTo($('dlg-portrait'), npc);
  const cc = $('dlg-choices'); cc.innerHTML = '';
  choices.forEach(c => {
    const b = el('button', '', c.text);
    b.onclick = () => { if (c.fn) c.fn(); else closeDialogue(); };
    cc.appendChild(b);
  });
}
export function closeDialogue() { if (uiHooks.close?.()) return; $('dialogue').classList.add('hidden'); }
export const dialogueOpen = () => !$('dialogue').classList.contains('hidden');

let toastTimer = 0;
// S13: Schlafen — das Bild blendet ab, Text, Mond, dann langsam wieder auf (rein sichtbar; die Zeit ist schon vergangen)
export function sleepFade(text) {
  let d = $('sleep-fade'); if (!d) { d = document.createElement('div'); d.id = 'sleep-fade'; document.getElementById('viewport')?.appendChild(d); }
  d.innerHTML = `<div>☾</div><p>${text}</p><small>Zzz …</small>`; d.className = 'on';
  clearTimeout(d._t); d._t = setTimeout(() => { d.className = 'off'; }, 2400);
}
export function toast(text, ms = 2200) {
  if (S._quiet) return;                                   // Selbsttest-Sandbox: keine Einblendungen
  const t = $('toast'); t.textContent = text; t.classList.remove('hidden');
  t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}
export function setPrompt(text) {
  const p = $('prompt');
  if (!text) { p.classList.add('hidden'); return; }
  p.innerHTML = text; p.classList.remove('hidden');
}

// ---------------- Modale ----------------
export let modalOpen = null;
// Fenster neu zeichnen, ohne es umzuschalten (openModal schließt bei gleichem Namen).
export function refreshModal(arg) { const n = modalOpen; if (!n) return; modalOpen = null; openModal(n, arg); }
export function closeModal() { $('modal').classList.add('hidden'); modalOpen = null; [...$('nav').children].forEach(b => b.classList.remove('active')); S.paused = false; }
export function openModal(name, arg) {
  if (uiHooks.modal?.(name, arg)) return;
  if (modalOpen === name) return closeModal();
  modalOpen = name;
  const m = $('modal'); m.classList.remove('hidden');
  const body = $('modal-body'); body.innerHTML = '';
  const grp = NAV.find(n => n[3].includes(name));
  [...$('nav').children].forEach(b => b.classList.toggle('active', b.dataset.g === grp?.[0]));
  const R = { inventory:[ 'Inventar', invUI ], character:[ 'Charakter', charUI ], party:[ 'Gruppe', partyUI ],
    settlement:[ 'Lager & Siedlung', settleUI ], faction:[ 'Fraktionen', facUI ], chronicle:[ 'Chronik', chronUI ],
    map:[ 'Weltkarte', mapUI ], trade:[ 'Handel', tradeUI ], settings:[ 'Einstellungen', settingsUI ],
    classes:[ 'Ausbildung', classUI ], quests:[ 'Aufträge', questUI ], skills:[ 'Talente', skillUI ], effects:[ 'Aktive Effekte', effectsUI ], codex:[ 'Kodex', codexUI ], spells:[ 'Zauberbuch', spellUI ], stable:[ 'Stall', stableUI ] }[name];
  $('modal-title').textContent = R ? R[0] : name;
  let tabs = $('modal-tabs'); if (!tabs) { tabs = el('div', ''); tabs.id = 'modal-tabs'; $('modal-title').after(tabs); }   /* Unterthemen der Gruppe als Reiter */
  const subs = (grp?.[3] || []).filter(k => SUBTAB[k]);
  tabs.innerHTML = subs.length > 1 && subs.includes(name) ? subs.map(k => `<button data-sub="${k}" class="${k === name ? 'on' : ''}">${SUBTAB[k]}</button>`).join('') : '';
  tabs.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => { if (b.dataset.sub !== modalOpen) openModal(b.dataset.sub); });
  if (R) R[1](body, arg);
}

// ---- Inventar ----
let selIdx = -1;
function invUI(body) {
  const p = S.player;
  body.className = '';
  body.innerHTML = `<div class="inv-layout">
      <div><div class="panel-title" style="margin-left:0">Tasche ${p.inv.length}/${p.invCap}</div><div class="inv-grid" id="ig"></div>
        <div class="panel-title" style="margin-left:0;margin-top:14px">Lagerbestand</div><div class="inv-grid" id="sg"></div></div>
      <div><div class="panel-title" style="margin-left:0">Ausrüstung</div><div class="eq-list" id="eq"></div>
        <div class="ledger" style="margin-top:12px">Rüstung gesamt <b>${A.armorOf(p)}</b><br>Traglast ${p.inv.length}/${p.invCap}</div></div>
      <div class="item-detail" id="det">Ein Gegenstand, der zählt, wiegt mehr als zehn, die es nicht tun.</div></div>`;
  const grid = $('ig');
  for (let i = 0; i < p.invCap; i++) {
    const slot = p.inv[i];
    const c = el('div', 'cell' + (slot ? ' r-' + (slot.rar || ITEMS[slot.key]?.rarity || 'common') : ''));   // Rarität des Exemplars
    if (slot) {
      const it = ITEMS[slot.key];
      const cv = el('canvas'); cv.width = cv.height = 52; c.appendChild(cv);
      if (slot.count > 1) c.insertAdjacentHTML('beforeend', `<span class="cnt">${slot.count}</span>`);
      if (slot.cond != null && slot.cond < 1) c.insertAdjacentHTML('beforeend', `<span class="cond"><i style="width:${slot.cond * 100}%;background:${slot.cond > .5 ? '#5c6b3c' : '#8c3b2a'}"></i></span>`);
      c.title = it.name;
      setTimeout(() => drawItemIconTo(cv, slot.key), 0);
      c.onclick = () => { selIdx = i; showDetail(slot, i); };
      c.ondblclick = () => { A.useOrEquip(i); refreshModal(); };
    }
    grid.appendChild(c);
  }
  const sg = $('sg');
  if (!S.settlement || !S.settlement.buildings.some(b => b.type === 'storage' && b.built >= 1)) {
    sg.outerHTML = '<div class="ledger">Ohne Lagergebäude gibt es keinen gemeinsamen Vorrat.</div>';
  } else {
    for (let i = 0; i < 24; i++) {
      const slot = S.stash[i];
      const c = el('div', 'cell');
      if (slot) {
        const cv = el('canvas'); cv.width = cv.height = 52; c.appendChild(cv);
        if (slot.count > 1) c.insertAdjacentHTML('beforeend', `<span class="cnt">${slot.count}</span>`);
        setTimeout(() => drawItemIconTo(cv, slot.key), 0);
        c.title = ITEMS[slot.key].name + ' (Klick: entnehmen)';
        c.onclick = () => { A.takeFromStash(i); refreshModal(); };
      }
      sg.appendChild(c);
    }
  }
  const eq = $('eq');
  [['weapon', 'Waffe'], ['offhand', 'Nebenhand'], ['head', 'Kopf'], ['chest', 'Rumpf'], ['hands', 'Hände'], ['legs', 'Beine'], ['feet', 'Füße'], ['cloak', 'Umhang'], ['talisman', 'Talisman']].forEach(([k, label]) => {
    const item = p.equip[k];
    const d = el('div', 'eq-slot');
    const cv = el('canvas'); cv.width = cv.height = 34; d.appendChild(cv);
    d.appendChild(el('div', '', `<div class="s-key">${label}</div><div class="s-name">${item ? ITEMS[item.key].name : '—'}</div>`));
    if (item) { setTimeout(() => drawItemIconTo(cv, item.key), 0); d.onclick = () => { A.unequip(k); refreshModal(); }; }
    eq.appendChild(d);
  });
  if (selIdx >= 0 && p.inv[selIdx]) showDetail(p.inv[selIdx], selIdx);
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
export function itemInfoHTML(slot, cmpWith = true) {
  const it = ITEMS[slot.key], p = S.player, cur = cmpWith && it.slot && p.equip[it.slot];
  const cmp = (a, b) => a === b ? '' : a > b ? `<span class="better">+${+(a - b).toFixed(1)}</span>` : `<span class="worse">${+(a - b).toFixed(1)}</span>`;
  const rar = slot.rar || it.rarity || 'common', leg = slot.leg || it.leg;
  let h = `<h3 class="r-${rar}">${slot.name || it.name}</h3><div class="s-key">${RARITY[rar]} · ${slotLabel(it.slot)}</div>`;
  const pu = itemPurpose(it); if (pu) h += `<div class="ledger" style="margin:4px 0">${pu}</div>`;
  if (it.sdesc) h += `<div class="ledger" style="margin:4px 0">${it.sdesc}</div>`;   /* Schildart erklären */
  if (slot.qual) h += `<div class="ledger" style="margin:4px 0">Güte: ${slot.qual}${slot.maker ? ` · gefertigt von ${slot.maker}` : ''}</div>`;   /* Nutzer §5d.8: Handwerk */
  if (it.energy) h += `<div class="ledger" style="margin:4px 0">Magitech · Energie ${slot.charge ?? 100}/100 · ${it.energy} je Schuss${it.splash ? ' · Streuung' : ''}${it.pierce ? ' · durchschlägt einen Gegner' : ''}${it.mstatus ? ` · ${it.mstatus.key === 'shocked' ? 'lähmt' : 'setzt in Brand'} (${Math.round(it.mstatus.chance * 100)} %)` : ''}. Leer schießt sie nicht — Energiezelle benutzen.</div>`;   /* Roadmap C.10 */
  if (it.desc && ['prosthesis', 'eye', 'mechmod', 'mechkit'].includes(it.use)) h += `<div class="ledger" style="margin:4px 0">${it.desc}</div>`;   /* Bionik-Test: Wirkung des Teils zeigen (desc stand sonst nirgends) */
  if (slot.used) h += `<div class="stat" title="Gebraucht vom Schwarzmarkt: kommt beim Einsetzen mit weniger Zustand."><span>Gebraucht</span><b>${slot.used} % Zustand</b></div>`;
  for (const [k, v] of Object.entries(slot.afx || {})) h += `<div class="affix${AFFIXES[k]?.major ? ' major' : ''}">${AFFIXES[k]?.name}: ${AFFIXES[k]?.fmt(v)}</div>`;
  if (leg && LEGENDS[leg]) h += `<div class="legend-fx">«${LEGENDS[leg].name}» — ${LEGENDS[leg].desc}</div>`;
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
function showDetail(slot, i) {
  const it = ITEMS[slot.key], p = S.player, d = $('det');
  let h = itemInfoHTML(slot);                                       // S13: gemeinsame Beschreibung (Inventar und Handel)
  h += `<div class="ctx-actions">
      ${it.slot === 'consumable' ? `<button id="d-use">${it.use === 'bandage' ? 'Anlegen' : 'Benutzen'}</button>` : it.slot !== 'material' ? '<button id="d-use">Anlegen</button>' : ''}
      ${it.slot === 'consumable' || it.slot === 'weapon' ? '<button id="d-hot">Auf Leiste legen</button>' : ''}
      ${A.bandageFrom(slot.key) ? `<button id="d-craft">${A.bandageFrom(slot.key)} Verbände schneiden</button>` : ''}
      ${slot.key === 'magiekern' ? '<button id="d-smash">Zerschlagen</button>' : ''}
      <button id="d-drop">Ablegen</button>
      ${S.settlement && S.settlement.buildings.some(b => b.type === 'storage' && b.built >= 1) ? '<button id="d-stash">Ins Lager</button>' : ''}
    </div>`;
  d.innerHTML = h;
  const refresh = () => { refreshModal(); };
  if ($('d-use')) $('d-use').onclick = () => { A.useOrEquip(i); refresh(); };
  if ($('d-hot')) $('d-hot').onclick = () => { if (A.toHotbar(slot.key) !== false) toast('Auf Leiste gelegt'); };
  if ($('d-craft')) $('d-craft').onclick = () => { A.craftBandage(i); refresh(); };
  if ($('d-drop')) $('d-drop').onclick = () => { A.dropItem(i); refresh(); };
  if ($('d-smash')) $('d-smash').onclick = () => { A.coreSmash?.(); refresh(); };   // S15 P7: Magiekern zerschlagen
  if ($('d-stash')) $('d-stash').onclick = () => { A.toStash(i); refresh(); };
}
const slotLabel = s => ({ weapon:'Waffe', offhand:'Nebenhand', head:'Kopf', chest:'Rumpf', feet:'Füße', cloak:'Umhang', consumable:'Verbrauch', material:'Material' }[s] || s);

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
    hunting: 'Noch ohne Wirkung — bekommt sie mit „Jagd und Wildnis“ (Fährten, Fallen, Häuten).',
    crafting: 'Steigt beim Herstellen an der Werkbank. Bessere Qualität, schwerere Rezepte; hilft beim Anpacken.',
    stealth: 'Hilft beim Hineinschleichen und Stehlen. Wächst noch nicht durch Übung — das kommt mit dem Schleich-System.' };
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

// ---- Skill-Baum ----
// Spalten je Zweig, Zeilen = Tiefe. Titelzweige stehen darunter; solange die Titelklasse fehlt, versiegelt (sichtbar, damit man
// weiß, wofür sich der Weg lohnt). Tooltip zeigt Wirkung und — bei Schlüsselknoten — die Absicht.
function skillUI(body) {
  const p = S.player, pts = p.skillPoints || 0;
  const col = b => {
    const N = Object.entries(SKILL_TREE).filter(([, n]) => n.branch === b), rows = Math.max(...N.map(([, n]) => n.row)) + 1, B_ = SKILL_BRANCHES[b];
    const sealed = B_.cls ? !(p.knownClasses || []).includes(B_.cls) : B_.title && !(p.titleClasses || []).includes(B_.title);
    return `<div class="tree-branch${sealed ? ' sealed' : ''}"><h3>${B_.name}</h3><p class="ledger">${sealed ? (B_.cls ? `Versiegelt — öffnet sich mit der Klasse ${CLASSES[B_.cls]?.name || B_.cls} (Todesweihe bei Sael oder Ysra).` : `Versiegelt — öffnet sich mit der Titelklasse ${TITLE_CLASSES[B_.title]?.name || B_.title}.`) : B_.desc}</p>
      ${Array.from({ length: rows }, (_, r) => `<div class="tree-row">${N.filter(([, n]) => n.row === r).map(([k, n]) => {
        const st = A.nodeState(p, k), req = n.requires.map(x => SKILL_TREE[x].name).join(' oder ');
        const tip = `${n.name}${n.type === 'keystone' ? ' — Schlüsselknoten' : n.type === 'active' ? ' — aktive Fähigkeit' : ''}: ${n.desc}${n.designIntent ? ' · Absicht: ' + n.designIntent : ''}${req ? ' · Braucht: ' + req : ''}`;
        return `<button class="tree-node ${st} ${n.type || 'minor'}" data-k="${k}" title="${tip.replace(/"/g, '&quot;')}">${n.name}<small>${st === 'learned' ? 'gelernt' : st === 'open' ? (pts ? 'lernen' : 'offen') : st === 'sealed' ? 'versiegelt' : st === 'barred' ? 'ausgeschlossen' : 'gesperrt'}</small></button>`;
      }).join('')}</div>`).join('')}</div>`;
  };
  const base = ['combat', 'magic', 'survival'], titles = Object.keys(SKILL_BRANCHES).filter(b => !base.includes(b));
  body.innerHTML = `<div class="ledger">Talentpunkte frei: <b style="color:var(--gold)">${pts}</b> · einer je Stufe. Ein Knoten braucht einen gelernten
    Knoten darüber (einer genügt). Schlüsselknoten verändern die Spielweise und haben einen Preis.</div>
    <div class="tree-wrap">${base.map(col).join('')}</div>
    <div class="ledger" style="margin-top:12px">Zweige der Titelklassen</div>
    <div class="tree-wrap">${titles.map(col).join('')}</div>`;
  body.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { A.learnNode(b.dataset.k); refreshModal(); });
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
  body.innerHTML = `<div class="build-layout">
    <div>${Object.entries(cats).map(([c, list]) => `<div class="build-cat">${c}</div>` +
      list.map(([k, b]) => {
        const can = A.canAfford(b.cost);
        return `<button class="build-item ${can ? '' : 'cant'}" data-b="${k}">${b.name}<small>${costStr(b.cost)}</small></button>`;
      }).join('')).join('')}</div>
    <div><h3>${st.name}</h3>
      <div class="ledger">Stufe: ${settleTier(st)} · Gebäude ${st.buildings.filter(b => b.built >= 1).length}/${st.buildings.length}
        · Bevölkerung ${A.population()} · Moral ${Math.round(st.morale)}</div>
      <div id="detail" class="ledger" style="margin-top:12px">Wähle ein Gebäude links, dann platziere es in der Welt mit Linksklick.</div>
      <h3 style="margin-top:16px">Arbeitsprioritäten</h3>
      <div id="prio"></div>
      <div class="ledger" style="margin-top:6px">Alle Siedler arbeiten an der obersten Aufgabe. Siedler kommen nur, wenn es ein Dach (Hütten) und Nahrung gibt; jeder isst täglich. Nachts kommen Angreifer — ein Wachturm warnt eine Stunde vorher.</div>
      <h3 style="margin-top:16px">Ortsgedächtnis</h3>
      <div class="ledger">${(st.history || []).map(h => `${h.text} — Jahr ${h.year}`).join('<br>') || 'Noch keine Geschichte.'}</div>
    </div>
    <div><h3>Bestand</h3>
      ${['wood:Holz', 'stone:Stein', 'iron:Eisen', 'food:Nahrung', 'herb:Kraut'].map(s => { const [k, n] = s.split(':');
        return `<div class="statline"><span>${n}</span><b>${Math.floor(S.res[k])}</b></div>`; }).join('')}
      <h3 style="margin-top:14px">Gebäude</h3>
      ${st.buildings.map(b => `<div class="statline"><span>${BUILDINGS[b.type].name}</span><b>${b.built < 1 ? Math.round(b.built * 100) + '% Bau' : Math.round(b.cond * 100) + '%'}</b></div>`).join('') || '<div class="ledger">Nichts gebaut.</div>'}
    </div></div>`;
  const prio = $('prio');
  (st.priorities || []).forEach((p, i) => {
    const row = el('div', 'statline', `<span>${i + 1}. ${p}</span><b>${i ? `<button class="txtbtn" data-up="${i}">höher</button>` : ''}</b>`);
    prio.appendChild(row);
  });
  [...body.querySelectorAll('[data-up]')].forEach(b => b.onclick = () => { A.raisePriority(+b.dataset.up); refreshModal(); });
  [...body.querySelectorAll('[data-b]')].forEach(b => b.onclick = () => {
    const k = b.dataset.b, def = BUILDINGS[k];
    $('detail').innerHTML = `<h3>${def.name}</h3>${def.desc}<br><br>Kosten: ${costStr(def.cost)}<br>Bauzeit: ${def.time}s
      <div class="ctx-actions"><button id="place">Platzieren</button></div>`;
    $('place').onclick = () => { A.startPlacing(k); closeModal(); };
  });
}
const costStr = c => Object.entries(c).map(([k, v]) => `${v} ${({ wood:'Holz', stone:'Stein', iron:'Eisen' })[k]}`).join(', ');
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
    $('map-card')?.remove(); if (!P) return; const d = el('div', 'map-card', `<div class="ctx-head">${P.title}</div>${P.html}`); d.id = 'map-card';
    d.style.left = Math.min(e.clientX - r.left + 14, r.width - 270) + 'px'; d.style.top = Math.max(4, Math.min(e.clientY - r.top - 20, r.height - 180)) + 'px'; d.onclick = () => d.remove(); body.appendChild(d); };
  [...body.querySelectorAll('[data-z]')].forEach(b => b.onclick = () => { S.settings.mapZoom = +b.dataset.z; mapUI(body); });
}

// ---- Handel ----
function tradeUI(body, npc) {
  const p = S.player;
  const stock = A.shopStock(npc);
  body.innerHTML = `<div class="inv-layout" style="grid-template-columns:1fr 1fr 1fr">
    <div><h3>${npc.name} bietet</h3><div id="buy"></div></div>
    <div><h3>Du bietest (Gold: ${S.gold})</h3><div id="sell"></div></div>
    <div><h3>Info</h3><div id="trade-info" class="ledger">Fahr mit der Maus über eine Ware: hier steht, was sie ist und was sie tut.</div></div></div>`;   // S13 (Nutzer): Info beim Kauf
  const mk = (list, box, isBuy) => list.forEach((slot, i) => {
    const it = ITEMS[slot.key];
    const price = A.price(slot.key, isBuy, npc);
    const row = el('div', 'eq-slot');
    const cv = el('canvas'); cv.width = cv.height = 34; row.appendChild(cv);
    row.appendChild(el('div', '', `<div class="s-name">${it.name}${slot.count > 1 ? ' ×' + slot.count : ''}</div><div class="s-key">${price} Gold</div>`));
    setTimeout(() => drawItemIconTo(cv, slot.key), 0);
    row.onmouseenter = () => { $('trade-info').innerHTML = itemInfoHTML(slot) + `<div class="stat"><span>${isBuy ? 'Kaufpreis' : 'Verkaufspreis'}</span><b>${price} Gold</b></div>${A.priceNote?.(slot.key, npc) ? `<div class="ledger" style="color:${/^Teuer/.test(A.priceNote(slot.key, npc)) ? '#d08a6a' : '#9ac08a'}">${A.priceNote(slot.key, npc)}</div>` : ''}<div class="s-key">Klick: ${isBuy ? 'kaufen' : 'verkaufen'}</div>`; };
    row.onclick = () => { isBuy ? A.buy(npc, slot.key) : A.sell(i, npc); refreshModal(npc); };
    box.appendChild(row);
  });
  const here = npc.homeTown || npc.town, last = Object.entries(S.priceSeen || {}).filter(([k]) => k !== here && S.towns?.[k]).sort((a, b) => b[1].day - a[1].day)[0];
  if (last && stock.some(s => ITEMS[s.key].good)) $('buy').appendChild(el('div', 'ledger', `Zuletzt in ${S.towns[last[0]].name} (Tag ${last[1].day}): ` +
    Object.entries(last[1].p).filter(([g]) => stock.some(s => s.key === g)).map(([g, v]) => `${ITEMS[g].name} ${v}`).join(' · ')));
  mk(stock, $('buy'), true);
  mk(p.inv.filter(s => s), $('sell'), false);
}

function questUI(body) {
  const order = { active: 0, done: 1, failed: 2 };                 // S13: offene zuerst; Verfolgen, Abbrechen, Ziel und Frist sichtbar
  const list = Object.entries(S.quests).filter(([k]) => QUESTS[k]).sort((a, b) => order[a[1].state] - order[b[1].state]);
  body.innerHTML = list.map(([k, v]) => {
    const Q = QUESTS[k], I = v.state === 'active' && A.questInfo ? A.questInfo(k) : {};
    return `<div class="panel" style="padding:12px;margin-bottom:8px${v.state !== 'active' ? ';opacity:.6' : ''}"><h3>${I.tracked ? '◆ ' : ''}${Q.name} <span style="float:right;color:#8d836e">${
      { active:'offen', done:'abgeschlossen', failed:'gescheitert' }[v.state]}</span></h3>
      <div class="ledger">${Q.desc}<br>${Q.objectives.map((o, i) => `· ${o.text} ${v.progress[i] || 0}/${o.count || 1}`).join('<br>')}
      ${I.where ? `<br>Ziel: ${I.where}` : ''}${I.timer ? `<br>${I.timer}` : ''}${v.outcome ? `<br><i>${v.outcome}</i>` : ''}</div>
      ${v.state === 'active' ? `<div class="ctx-actions" style="margin-top:6px"><button data-track="${k}">${I.tracked ? 'Wird verfolgt' : 'Verfolgen'}</button>${I.cancel ? `<button data-cancel="${k}">Abbrechen</button>` : ''}</div>` : ''}</div>`;
  }).join('') || '<div class="ledger">Keine Aufträge. Frag im Dorf nach.</div>';
  body.querySelectorAll('[data-track]').forEach(b => b.onclick = () => { A.trackQuest(b.dataset.track); questUI(body); });
  body.querySelectorAll('[data-cancel]').forEach(b => b.onclick = () => { if (b.dataset.sure) { A.cancelQuest(b.dataset.cancel); questUI(body); } else { b.dataset.sure = 1; b.textContent = 'Wirklich abbrechen?'; } });
}

function settingsUI(body) {
  body.innerHTML = `<div class="sheet" style="grid-template-columns:1fr 1fr">
    <div><h3>Darstellung</h3>
      <div class="ctx-actions">${['low:Kaum Blut', 'reduced:Reduziert', 'standard:Voll'].map(s => { const [k, n] = s.split(':');
        return `<button data-v="${k}" class="${S.settings.violence === k ? 'on' : ''}" aria-pressed="${S.settings.violence === k}">${n}</button>`; }).join('')}</div>
      <h3 style="margin-top:14px">Grafikstil</h3>
      <div class="ctx-actions"><button data-art="D" class="${S.settings.art === 'D' ? 'on' : ''}">Klassisch</button><button data-art="R" class="${S.settings.art === 'R' ? 'on' : ''}">Neu (gezeichnet)</button></div>
      <h3 style="margin-top:14px">Bewegung</h3>
      <div class="ctx-actions"><button id="mot">Reduzierte Bewegung: ${S.settings.motion ? 'aus' : 'an'}</button></div>
      <h3 style="margin-top:14px">Ton</h3>
      <div class="ctx-actions">${[[0, 'Aus'], [0.35, 'Leise'], [0.7, 'Normal'], [1, 'Laut']].map(([v, n]) =>
        `<button data-vol="${v}" class="${(S.settings.volume ?? 0.7) === v ? 'on' : ''}">${n}</button>`).join('')}</div>
      <h3 style="margin-top:14px">Textgröße</h3>
      <div class="ctx-actions"><button data-t="0.9">Klein</button><button data-t="1">Normal</button><button data-t="1.15">Groß</button></div>
    </div>
    <div><h3>Steuerung</h3><div class="ledger">
      WASD — Bewegen<br>Linksklick / Leertaste — Angriff<br><b>Strg + Angriff</b> — Neutrale angreifen (Ruf-Folgen)<br>E — Interagieren<br>Q — Ausweichen<br>Umschalt (halten) — Deckung; im ersten Augenblick eines Hiebs parieren<br>R — Pferd pfeifen / absitzen<br>1–9, 0 — Fähigkeiten und Zauber<br>Rechtsklick auf eine Figur — auswählen (Infos rechts)<br>Esc / Leertaste — Kamerafahrt überspringen<br>
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

