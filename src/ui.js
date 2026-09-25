// Oberfläche: Panels, Modale, Dialog, Chronik. Spiel-Logik hängt über bind() dran.
import { S, onLog, timeStr, year, partyMembers, byId, clamp, dist } from './state.js';
import { ITEMS, RARITY, CLASSES, ABILITIES, FACTIONS, BUILDINGS, MONSTERS, MEMORY_TEXT, QUESTS, SKILL_NAMES, TITLE_CLASSES, SKILL_TREE, SKILL_BRANCHES } from './data.js';
import { drawPortraitTo, drawItemIconTo, drawFigureTo, cam } from './render.js';
import { LOCATIONS, locAt, nearestLocations, TS, MAPS, TOWN_PLAN, townAt, DUNGEONS } from './world.js';
import { townState, townPrice } from './sim.js';
import { PARTS, PART_NAME, partState, buildOf, BUILDS } from './body.js';
import { sfx, ambience } from './sfx.js';

export let A = {};
// Wettersymbole: eigene Strichzeichnungen, eine Linienstärke
const ico = d => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#b8ac93" stroke-width="1.2" stroke-linecap="round">${d}</svg>`;
const WEATHER_ICON = {
  clear: ico('<circle cx="8" cy="8" r="3"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/>'),
  cloudy: ico('<path d="M4.5 12h7.5a2.8 2.8 0 0 0 .3-5.6A3.8 3.8 0 0 0 5 6.8 2.6 2.6 0 0 0 4.5 12z"/>'),
  rain: ico('<path d="M4.5 9h7.5a2.6 2.6 0 0 0 .3-5.2A3.6 3.6 0 0 0 5 4.2 2.4 2.4 0 0 0 4.5 9z"/><path d="M5.5 11l-.8 2.5M8.5 11l-.8 2.5M11.5 11l-.8 2.5"/>'),
  fog: ico('<path d="M2 5.5h12M3.5 8.5h9M2 11.5h12"/>'),
};                        // Aktionen aus game.js
export function bind(actions) { A = actions; }
const $ = id => document.getElementById(id);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

const NAV = [
  ['world', 'Welt', ''], ['character', 'Charakter', 'C'], ['party', 'Gruppe', 'G'], ['inventory', 'Inventar', 'I'],
  ['settlement', 'Lager', 'B'], ['faction', 'Fraktion', 'F'], ['chronicle', 'Chronik', 'K'], ['map', 'Karte', 'M'],
  ['skills', 'Talente', 'T'], ['quests', 'Aufträge', 'J'], ['settings', 'Optionen', 'Esc'],       // ohne Tastatur (Touch) sonst unerreichbar
];
const LOGCATS = ['Alle', 'Kampf', 'Gruppe', 'Welt', 'Quest', 'Fraktion', 'Handel'];
const CATKEY = { Alle:null, Kampf:'combat', Gruppe:'party', Welt:'world', Quest:'quest', Fraktion:'faction', Handel:'economy' };
let logFilter = null;

export function initUI() {
  const nav = $('nav');
  NAV.forEach(([k, label, key]) => {
    const b = el('button', '', label + (key ? `<i>${key}</i>` : ''));
    b.onclick = () => k === 'world' ? closeModal() : openModal(k);
    nav.appendChild(b);
  });
  const lf = $('log-filters');
  LOGCATS.forEach((c, i) => {
    const b = el('button', i === 0 ? 'on' : '', c);
    b.onclick = () => { logFilter = CATKEY[c]; [...lf.children].forEach(x => x.classList.remove('on')); b.classList.add('on'); renderLog(); };
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

export function refreshHUD() {
  const p = S.player; if (!p) return;
  $('pc-name').textContent = p.name;
  const TT = p.titleClass && TITLE_CLASSES[p.titleClass];
  $('pc-class').textContent = `Stufe ${p.level} · ${CLASSES[p.currentClass].name}${TT ? ' · ' + TT.name : ''}`;
  const fr = topRank(p);
  $('pc-rank').textContent = fr || 'Ohne Banner';
  drawPortraitTo($('pc-portrait'), p);
  let html = bar('Leben', p.hp, p.maxHp, 'hp') + bar('Ausdauer', p.stamina, p.maxStamina, 'sta');
  if (p.maxMana > 0) html += bar('Mana', p.mana, p.maxMana, 'mana');
  if (TT) html += bar(TT.resource.name, A.tres(p), TT.resource.max, TT.resource.css);   // Ressource der Titelklasse
  html += bar('Erfahrung', p.xp, p.xpNext, 'xp');
  $('pc-bars').innerHTML = html;
  $('pc-status').innerHTML = statusIcons(p);
  const worst = PARTS.filter(k => partState(p.body[k]) !== 'heil').map(k => `${PART_NAME[k]} <em>${STATE_WORD[partState(p.body[k])]}</em>`);
  $('pc-body').innerHTML = bodyChart(p) + `<div class="pc-wounds">${worst.join('<br>') || 'Keine Wunden'}</div>`;
  // Gruppe
  const mem = partyMembers();
  $('party-title').textContent = `GRUPPE ${mem.length} / ${p.partyCap}`;
  const list = $('party-list'); list.innerHTML = '';
  if (!mem.length) list.appendChild(el('div', 'cr-desc', 'Du reist allein.'));
  for (const m of mem) {
    const d = el('div', 'member' + (m.downed ? ' downed' : ''));
    const cv = el('canvas'); cv.width = cv.height = 34;
    d.appendChild(cv);
    d.appendChild(el('div', '', `<div class="m-name">${m.name}</div>
      <div class="m-sub">St. ${m.level} ${CLASSES[m.currentClass].name} · Moral ${Math.round(m.morale)}</div>
      <div class="m-bar"><div style="width:${clamp(m.hp / m.maxHp * 100, 0, 100)}%"></div></div>`));
    d.onclick = () => { A.select(m); };
    list.appendChild(d);
    drawPortraitTo(cv, m);
  }
  $('res-list').innerHTML = [['Holz', S.res.wood], ['Stein', S.res.stone], ['Eisen', S.res.iron],
    ['Kraut', S.res.herb], ['Nahrung', S.res.food], ['Gold', S.gold]]
    .map(([k, v]) => `<span>${k}<b>${Math.floor(v)}</b></span>`).join('');
  // Kopfzeile
  $('clock-time').textContent = `Tag ${S.day} · ${timeStr()} · ${S.season}`;
  if ($('clock-weather').dataset.w !== S.weather) { $('clock-weather').dataset.w = S.weather; $('clock-weather').innerHTML = WEATHER_ICON[S.weather] || WEATHER_ICON.clear; $('clock-weather').title = { clear:'Klar', cloudy:'Bewölkt', rain:'Regen', fog:'Nebel' }[S.weather]; }
  $('clock-gold').textContent = S.gold;
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

function statusIcons(p) {
  const out = [];
  for (const s of p.status || []) out.push(`<span class="st-icon ${s.good ? 'good' : 'bad'}" title="${s.desc || ''}">${s.name}</span>`);
  if (p.stamina < p.maxStamina * 0.2) out.push('<span class="st-icon bad">Erschöpft</span>');
  if (S.res.food <= 0) out.push('<span class="st-icon bad">Hungrig</span>');
  return out.join('');
}

// ---------------- Log ----------------
function renderLog() {
  const box = $('log'); if (!box) return;
  const near = box.scrollTop + box.clientHeight >= box.scrollHeight - 24;
  box.innerHTML = S.log.filter(e => !logFilter || e.cat === logFilter).slice(-90)
    .map(e => `<div class="c-${e.cat}"><time>${e.t}</time>${e.text}</div>`).join('');
  if (near) box.scrollTop = box.scrollHeight;
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
      <div class="ctx-line"><span>Wetter</span><b>${{clear:'Klar',cloudy:'Bewölkt',rain:'Regen',fog:'Nebel'}[S.weather]}</b></div>
      <div class="ctx-line"><span>Zeit</span><b>${timeStr()}</b></div>
      <div class="ctx-line"><span>Jahr</span><b>${year()}</b></div>`;
    if (here && S.towns && S.towns[here.key]) {
      const t = S.towns[here.key], owner = S.war.nodes[here.key]?.owner;
      h += `<div class="ctx-block"><div class="ctx-sub">Stadt</div>
        <div class="ctx-line"><span>Lage</span><b>${townState(here.key)}</b></div>
        <div class="ctx-line"><span>Herrschaft</span><b>${owner ? FACTIONS[owner].name : 'frei'}</b></div>
        <div class="ctx-line"><span>Einwohner</span><b>${townHeads(here.key)}</b></div>` +
        ['grain', 'salt', 'cloth', 'pelt'].map(g => `<div class="ctx-line"><span>${ITEMS[g].name}</span><b>${townPrice(here.key, g, true)} Gold · ${Math.floor(t.stock[g])}</b></div>`).join('') + '</div>';
    } else if (S.war && S.map === 'world' && here && S.war.nodes[here.key]?.owner) {
      h += `<div class="ctx-line"><span>Herrschaft</span><b>${FACTIONS[S.war.nodes[here.key].owner].name}</b></div>`;
      if (TOWN_PLAN[here.key]) h += `<div class="ctx-line"><span>Einwohner</span><b>${townHeads(here.key)}</b></div>`;
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
        return `<div class="ctx-line"><span>${Q.name}</span><b>${Q.objectives.map((o, i) => `${v.progress[i] || 0}/${o.count || 1}`).join(' ')}</b></div>`;
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
    box.innerHTML = `<div class="ctx-head">${m.name}</div><div class="ctx-sub">${m.boss ? 'Anführer' : 'Feind'}</div>
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
  const p = S.player; if (!p) return;
  const slots = p.hotbar || [];
  // Nur neu aufbauen, wenn sich Belegung, Anzahl oder Abklingzeit (Viertelsekunden) ändern — sonst flackern die Icons.
  const sig = slots.map(s => !s ? '-' : s.type + ':' + s.key + ':' + (s.type === 'item' ? countItem(s.key) : Math.ceil((p.cooldowns?.[s.key] || 0) / 250))).join('|');
  if (sig === hbSig && hb.childElementCount) return;
  hbSig = sig;
  hb.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const s = slots[i];
    const d = el('div', 'slot' + (s ? '' : ' empty'));
    d.innerHTML = `<b>${i + 1}</b>`;
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
        d.title = ab.desc;
        const cd = (p.cooldowns?.[s.key] || 0);
        if (cd > 0) { const c = el('div', 'cd'); c.style.height = `${clamp(cd / ab.cd * 100, 0, 100)}%`; c.style.top = 'auto'; c.style.bottom = '0'; d.appendChild(c); }
      }
      d.onclick = () => A.useSlot(i);
    }
    hb.appendChild(d);
  }
}
function countItem(key) { const s = S.player.inv.find(x => x.key === key); return s ? (s.count || 1) : 0; }

// ---------------- Dialog ----------------
export function dialogue(npc, text, choices) {
  const box = $('dialogue');
  box.classList.remove('hidden');
  $('dlg-name').textContent = npc.name;
  $('dlg-text').textContent = text;
  drawPortraitTo($('dlg-portrait'), npc);
  const cc = $('dlg-choices'); cc.innerHTML = '';
  choices.forEach(c => {
    const b = el('button', '', c.text);
    b.onclick = () => { if (c.fn) c.fn(); else closeDialogue(); };
    cc.appendChild(b);
  });
}
export function closeDialogue() { $('dialogue').classList.add('hidden'); }
export const dialogueOpen = () => !$('dialogue').classList.contains('hidden');

let toastTimer = 0;
export function toast(text, ms = 2200) {
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
  if (modalOpen === name) return closeModal();
  modalOpen = name;
  const m = $('modal'); m.classList.remove('hidden');
  const body = $('modal-body'); body.innerHTML = '';
  const idx = NAV.findIndex(n => n[0] === name);
  [...$('nav').children].forEach((b, i) => b.classList.toggle('active', i === idx));
  const R = { inventory:[ 'Inventar', invUI ], character:[ 'Charakter', charUI ], party:[ 'Gruppe', partyUI ],
    settlement:[ 'Lager & Siedlung', settleUI ], faction:[ 'Fraktionen', facUI ], chronicle:[ 'Chronik', chronUI ],
    map:[ 'Weltkarte', mapUI ], trade:[ 'Handel', tradeUI ], settings:[ 'Einstellungen', settingsUI ],
    classes:[ 'Ausbildung', classUI ], quests:[ 'Aufträge', questUI ], skills:[ 'Talente', skillUI ] }[name];
  $('modal-title').textContent = R ? R[0] : name;
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
    const c = el('div', 'cell' + (slot ? ' r-' + (ITEMS[slot.key]?.rarity || 'common') : ''));
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
  [['weapon', 'Waffe'], ['offhand', 'Nebenhand'], ['head', 'Kopf'], ['chest', 'Rumpf'], ['feet', 'Füße'], ['cloak', 'Umhang']].forEach(([k, label]) => {
    const item = p.equip[k];
    const d = el('div', 'eq-slot');
    const cv = el('canvas'); cv.width = cv.height = 34; d.appendChild(cv);
    d.appendChild(el('div', '', `<div class="s-key">${label}</div><div class="s-name">${item ? ITEMS[item.key].name : '—'}</div>`));
    if (item) { setTimeout(() => drawItemIconTo(cv, item.key), 0); d.onclick = () => { A.unequip(k); refreshModal(); }; }
    eq.appendChild(d);
  });
  if (selIdx >= 0 && p.inv[selIdx]) showDetail(p.inv[selIdx], selIdx);
}
function showDetail(slot, i) {
  const it = ITEMS[slot.key], p = S.player, d = $('det');
  const cur = it.slot && p.equip[it.slot];
  const cmp = (a, b) => a === b ? '' : a > b ? `<span class="better">+${+(a - b).toFixed(1)}</span>` : `<span class="worse">${+(a - b).toFixed(1)}</span>`;
  let h = `<h3 class="r-${it.rarity}">${slot.name || it.name}</h3>
    <div class="s-key">${RARITY[it.rarity]} · ${slotLabel(it.slot)}</div>`;
  if (it.lore || slot.lore) h += `<div class="lore">${slot.lore || it.lore}</div>`;
  if (slot.history) h += `<div class="lore">${slot.history.join('<br>')}</div>`;
  if (it.dmg) h += `<div class="stat"><span>Schaden</span><b>${it.dmg} ${cur && ITEMS[cur.key].dmg ? cmp(it.dmg, ITEMS[cur.key].dmg) : ''}</b></div>`;
  if (it.speed) h += `<div class="stat"><span>Angriffszeit</span><b>${(it.speed / 1000).toFixed(2)} s</b></div>`;
  if (it.reach) h += `<div class="stat"><span>Reichweite</span><b>${it.reach}</b></div>`;
  if (it.ap) h += `<div class="stat"><span>Panzerbrechend</span><b>${Math.round(it.ap * 100)}%</b></div>`;
  if (it.crit) h += `<div class="stat"><span>Kritischer Faktor</span><b>×${it.crit}</b></div>`;
  if (it.armor) h += `<div class="stat"><span>Rüstung</span><b>${it.armor} ${cur ? cmp(it.armor, ITEMS[cur.key].armor || 0) : ''}</b></div>`;
  if (it.block) h += `<div class="stat"><span>Block</span><b>${Math.round(it.block * 100)}%</b></div>`;
  if (it.heal) h += `<div class="stat"><span>Heilung</span><b>${it.heal}</b></div>`;
  if (slot.cond != null) h += `<div class="stat"><span>Zustand</span><b>${Math.round(slot.cond * 100)}%</b></div>`;
  h += `<div class="stat"><span>Wert</span><b>${it.value} Gold</b></div>`;
  h += `<div class="ctx-actions">
      ${it.slot === 'consumable' ? `<button id="d-use">${it.use === 'bandage' ? 'Anlegen' : 'Benutzen'}</button>` : it.slot !== 'material' ? '<button id="d-use">Anlegen</button>' : ''}
      ${it.slot === 'consumable' || it.slot === 'weapon' ? '<button id="d-hot">Auf Leiste legen</button>' : ''}
      ${A.bandageFrom(slot.key) ? `<button id="d-craft">${A.bandageFrom(slot.key)} Verbände schneiden</button>` : ''}
      <button id="d-drop">Ablegen</button>
      ${S.settlement && S.settlement.buildings.some(b => b.type === 'storage' && b.built >= 1) ? '<button id="d-stash">Ins Lager</button>' : ''}
    </div>`;
  d.innerHTML = h;
  const refresh = () => { refreshModal(); };
  if ($('d-use')) $('d-use').onclick = () => { A.useOrEquip(i); refresh(); };
  if ($('d-hot')) $('d-hot').onclick = () => { A.toHotbar(slot.key); toast('Auf Leiste gelegt'); };
  if ($('d-craft')) $('d-craft').onclick = () => { A.craftBandage(i); refresh(); };
  if ($('d-drop')) $('d-drop').onclick = () => { A.dropItem(i); refresh(); };
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
      const st = partState(c.body[p]);
      const label = `${PART_NAME[p]}: ${Math.max(0, Math.round(c.body[p].hp))}/${c.body[p].max} — ${STATE_WORD[st]}`;
      return `<g class="bp bp-${st}${click ? ' bp-click' : ''}" data-part="${p}" data-tip="${label}" aria-label="${label}" ${st === 'aus' ? `fill="url(#${uid})"` : ''}>${rects(PART_PX[p], 0)}
        ${rects(PART_PX[p].slice(0, 1), 0, ' class="bp-hi"')}</g>`;
    }).join('')}
  </svg>`;
}
function woundNotes(c, click) {
  return PARTS.map(p => {
    const P = c.body[p], st = partState(P), pct = Math.max(0, P.hp / P.max * 100);
    return `<button class="wound w-${st}" data-part="${p}" ${click ? '' : 'tabindex="-1"'}>
      <span class="w-name">${PART_NAME[p]}</span><span class="w-val">${Math.max(0, Math.round(P.hp))}<small>/${P.max}</small></span>
      <span class="w-bar"><i style="width:${pct}%"></i></span><span class="w-state">${STATE_WORD[st]}</span></button>`;
  }).join('');
}

// ---- Charakterbogen: Wundarzt-Tafel ----
function charUI(body, who) {
  const p = who || S.player, isPlayer = p === S.player;
  const ATTRS = { strength:'Stärke', agility:'Beweglichkeit', endurance:'Ausdauer', intelligence:'Intelligenz', perception:'Wahrnehmung', willpower:'Willenskraft' };
  const SKILLS = SKILL_NAMES;
  const chain = classChain(p.currentClass), bld = buildOf(p);
  const bandages = S.player.inv.filter(x => x.key === 'bandage').reduce((n, x) => n + (x.count || 1), 0);
  const skills = Object.entries(SKILLS).filter(([k]) => (p.skills[k] || 0) >= 1);
  const EQ = [['weapon', 'Waffe'], ['offhand', 'Nebenhand'], ['head', 'Kopf'], ['chest', 'Rumpf'], ['feet', 'Füße'], ['cloak', 'Umhang']];
  body.innerHTML = `<div class="tafel">
    <header class="tafel-head">
      <h2>${p.name}</h2>
      <p>${CLASSES[p.currentClass].name} · Stufe ${p.level} · ${bld.name} · ${p.age} Jahre${isPlayer ? ` · Haus ${S.legacy.house}, Generation ${S.legacy.gen}` : ''}</p>
      ${p.titles?.length ? `<p class="titles">${p.titles.map(t => `„${t}“`).join(' · ')}</p>` : ''}
    </header>
    <section class="tafel-befund">
      <h3>Befund</h3>
      <dl class="ledger-list">${Object.entries(ATTRS).map(([k, n]) => `<div><dt>${n}</dt><dd>${p.attributes[k]}</dd></div>`).join('')}</dl>
      ${isPlayer && p.attrPoints > 0 ? `<div class="ap-box" id="ap-box"><p>${p.attrPoints} freie${p.attrPoints > 1 ? '' : 'r'} Punkt${p.attrPoints > 1 ? 'e' : ''}</p>
        ${Object.entries(ATTRS).map(([k, n]) => `<button data-a="${k}">${n} +1</button>`).join('')}</div>` : ''}
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
      <dl class="ledger-list">${skills.map(([k, n]) => `<div><dt>${n}</dt><dd>${Math.floor(p.skills[k])}</dd></div>`).join('') || '<div><dt>Noch ungeübt</dt><dd>—</dd></div>'}</dl>
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
      <small>${c === p.currentClass ? 'aktiv' : 'wählen'}</small><br><span class="ledger">${CLASSES[c].desc || ''}</span></button>`).join('')}</div>`;
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
    const sealed = B_.title && !(p.titleClasses || []).includes(B_.title);
    return `<div class="tree-branch${sealed ? ' sealed' : ''}"><h3>${B_.name}</h3><p class="ledger">${sealed ? `Versiegelt — öffnet sich mit der Titelklasse ${TITLE_CLASSES[B_.title]?.name || B_.title}.` : B_.desc}</p>
      ${Array.from({ length: rows }, (_, r) => `<div class="tree-row">${N.filter(([, n]) => n.row === r).map(([k, n]) => {
        const st = A.nodeState(p, k), req = n.requires.map(x => SKILL_TREE[x].name).join(' oder ');
        const tip = `${n.name}${n.type === 'keystone' ? ' — Schlüsselknoten' : ''}: ${n.desc}${n.designIntent ? ' · Absicht: ' + n.designIntent : ''}${req ? ' · Braucht: ' + req : ''}`;
        return `<button class="tree-node ${st} ${n.type || 'minor'}" data-k="${k}" title="${tip.replace(/"/g, '&quot;')}">${n.name}<small>${st === 'learned' ? 'gelernt' : st === 'open' ? (pts ? 'lernen' : 'offen') : st === 'sealed' ? 'versiegelt' : 'gesperrt'}</small></button>`;
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
      <div class="statline"><span>Ansehen</span><b>${rep > 0 ? '+' : ''}${Math.round(rep)}</b></div>
      <div class="statline"><span>Rang</span><b>${rank >= 0 ? f.ranks[Math.min(rank, f.ranks.length - 1)] : 'Kein Mitglied'}</b></div>
      <h3 style="margin-top:14px">Rangfolge</h3>
      <div class="classtree">${f.ranks.map((r, i) => `<span class="${i === rank ? 'on' : ''}">${r}</span>${i < f.ranks.length - 1 ? '<em>│</em>' : ''}`).join('')}</div>
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
  body.innerHTML = `<div class="chron"><div class="timeline">${years.map(y =>
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
  body.innerHTML = `<canvas id="wm" style="width:100%;height:calc(100% - 40px);border:1px solid #2b2419;background:#0b0a08"></canvas>
    <div class="ledger" style="margin-top:8px">Entdeckte Orte erscheinen dauerhaft. Grau = Gerücht, unentdeckt.</div>`;
  const cv = $('wm'); cv.width = cv.clientWidth; cv.height = cv.clientHeight;
  A.drawWorldmap(cv);
}

// ---- Handel ----
function tradeUI(body, npc) {
  const p = S.player;
  const stock = A.shopStock(npc);
  body.innerHTML = `<div class="inv-layout" style="grid-template-columns:1fr 1fr">
    <div><h3>${npc.name} bietet</h3><div id="buy"></div></div>
    <div><h3>Du bietest (Gold: ${S.gold})</h3><div id="sell"></div></div></div>`;
  const mk = (list, box, isBuy) => list.forEach((slot, i) => {
    const it = ITEMS[slot.key];
    const price = A.price(slot.key, isBuy, npc);
    const row = el('div', 'eq-slot');
    const cv = el('canvas'); cv.width = cv.height = 34; row.appendChild(cv);
    row.appendChild(el('div', '', `<div class="s-name">${it.name}${slot.count > 1 ? ' ×' + slot.count : ''}</div><div class="s-key">${price} Gold</div>`));
    setTimeout(() => drawItemIconTo(cv, slot.key), 0);
    row.onclick = () => { isBuy ? A.buy(npc, slot.key) : A.sell(i, npc); refreshModal(npc); };
    box.appendChild(row);
  });
  const other = npc.town === 'northcity' ? 'eren' : 'northcity', seen = S.priceSeen?.[other];
  if (seen) $('buy').appendChild(el('div', 'ledger', `Zuletzt in ${S.towns[other].name} (Tag ${seen.day}): ` +
    Object.entries(seen.p).map(([g, v]) => `${ITEMS[g].name} ${v}`).join(' · ')));
  mk(stock, $('buy'), true);
  mk(p.inv.filter(s => s), $('sell'), false);
}

function questUI(body) {
  body.innerHTML = Object.entries(S.quests).map(([k, v]) => {
    const Q = QUESTS[k];
    return `<div class="panel" style="padding:12px;margin-bottom:8px"><h3>${Q.name} <span style="float:right;color:#8d836e">${
      { active:'offen', done:'abgeschlossen', failed:'gescheitert' }[v.state]}</span></h3>
      <div class="ledger">${Q.desc}<br>${Q.objectives.map((o, i) => `· ${o.text} ${v.progress[i] || 0}/${o.count || 1}`).join('<br>')}
      ${v.outcome ? `<br><i>${v.outcome}</i>` : ''}</div></div>`;
  }).join('') || '<div class="ledger">Keine Aufträge. Frag im Dorf nach.</div>';
}

function settingsUI(body) {
  body.innerHTML = `<div class="sheet" style="grid-template-columns:1fr 1fr">
    <div><h3>Darstellung</h3>
      <div class="ctx-actions">${['low:Kaum Blut', 'reduced:Reduziert', 'standard:Voll'].map(s => { const [k, n] = s.split(':');
        return `<button data-v="${k}" class="${S.settings.violence === k ? 'on' : ''}" aria-pressed="${S.settings.violence === k}">${n}</button>`; }).join('')}</div>
      <h3 style="margin-top:14px">Bewegung</h3>
      <div class="ctx-actions"><button id="mot">Reduzierte Bewegung: ${S.settings.motion ? 'aus' : 'an'}</button></div>
      <h3 style="margin-top:14px">Ton</h3>
      <div class="ctx-actions">${[[0, 'Aus'], [0.35, 'Leise'], [0.7, 'Normal'], [1, 'Laut']].map(([v, n]) =>
        `<button data-vol="${v}" class="${(S.settings.volume ?? 0.7) === v ? 'on' : ''}">${n}</button>`).join('')}</div>
      <h3 style="margin-top:14px">Textgröße</h3>
      <div class="ctx-actions"><button data-t="0.9">Klein</button><button data-t="1">Normal</button><button data-t="1.15">Groß</button></div>
    </div>
    <div><h3>Steuerung</h3><div class="ledger">
      WASD — Bewegen<br>Linksklick / Leertaste — Angriff<br><b>Strg + Angriff</b> — Neutrale angreifen (Ruf-Folgen)<br>E — Interagieren<br>Q — Ausweichen<br>1–8 — Fähigkeiten<br>
      I Inventar · C Charakter · G Gruppe · B Lager · F Fraktion · K Chronik · M Karte<br>J — Aufträge<br>Mausrad — Zoom<br>Esc — Schließen<br>Strg+Shift+D — Debug</div>
      <h3 style="margin-top:14px">Spielstand</h3>
      <div class="ctx-actions"><button id="sv">Jetzt speichern</button><button id="quit">Zum Hauptmenü</button></div>
    </div></div>`;
  [...body.querySelectorAll('[data-v]')].forEach(b => b.onclick = () => { S.settings.violence = b.dataset.v; refreshModal(); });
  [...body.querySelectorAll('[data-t]')].forEach(b => b.onclick = () => { document.documentElement.style.fontSize = (14 * +b.dataset.t) + 'px'; S.settings.textScale = +b.dataset.t; });
  $('mot').onclick = () => { S.settings.motion = !S.settings.motion; refreshModal(); };
  [...body.querySelectorAll('[data-vol]')].forEach(b => b.onclick = () => { S.settings.volume = +b.dataset.vol; ambience(S.settings.volume > 0); refreshModal(); });
  $('sv').onclick = () => { A.saveNow(); toast('Gespeichert'); };
  $('quit').onclick = () => { A.saveNow(); location.reload(); };
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

export function setNavActive() { [...$('nav').children].forEach(b => b.classList.remove('active')); }
