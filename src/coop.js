// Netzwerk-Koop (Roadmap K2, docs/PLAN_COOP.md). Wird nur geladen, wenn der Spieler auf dem Titelbildschirm „Koop (Netzwerk)“ drückt.
// Grundsatz: Der Host rechnet die ganze Welt wie im Einzelspieler. Der Gast schickt nur seine Eingaben und bekommt zurück, was um
// seine Figur herum passiert. Der Gast erstellt vorher im Warteraum seinen eigenen Charakter (oder spielt seinen gespeicherten weiter,
// oder übernimmt einen Gefährten) und drückt „Bereit“; der Host startet. Die Figur ist ein Gruppenmitglied mit m.coopPilot = Peer-ID. Verbindung über
// WebRTC mit PeerJS (öffentlicher Vermittler, die Daten laufen direkt zwischen den Browsern). Der Gast speichert nie.
// Nachrichten: siehe docs/PLAN_COOP.md §3.2. Alles hier ruft nur bestehende Spielfunktionen über das API-Objekt aus game.js auf.

let A = null;                                   // API aus game.js (S, R, UI, Funktionen)
let peer = null, conn = null, muteLog = false;   /* muteLog: Chatzeilen gehen als 'chat', nicht zusätzlich als 'log' */                   // PeerJS
const VER = 26;                                 // muss zu ?v= in index.html passen; Host und Gast müssen gleich sein
const PEERJS = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
const NEAR = 1400;                              // px um die Gastfigur, die der Host schickt
const DYN = ['x', 'y', 'vx', 'vy', 'facing', 'aim', 'hp', 'maxHp', 'barHp', 'barMax', 'downed', 'alive', 'swing', 'swingDur', 'atkS', 'atkW', 'atkH', 'atkPk', 'atkStep', 'chargeK', 'act', 'stagger', 'cover', 'telegraph', 'mounted', 'fleeing', 'angry', 'aiState', 'hDir', 'come'];
const SENT = new Set(['enemy', 'npc', 'player', 'caravan', 'mount', 'item', 'grave']);   /* Props entstehen beim Gast aus derselben Generierung */
const HEAVY = new Set(['inv', 'memories', 'plan', 'path', 'schedule', 'dmgBy', 'rel', 'talk', 'lastInput', 'hitIds', 'cooldowns', 'tree', 'spells', 'spellUse', 'hotbar']);
const rnd6 = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');

// Testweg ohne Netz: zwei Fenster im selben Browser reden über einen BroadcastChannel. Bildet nur das nach, was dieses Modul von
// PeerJS braucht (open, connection, connect, data, close, send). Einschalten mit ?coopLocal in der Adresse.
const LOCAL = /[?&]coopLocal/.test(location.search);
class Ev { constructor() { this.h = {}; } on(k, f) { (this.h[k] ||= []).push(f); return this; } emit(k, ...a) { for (const f of this.h[k] || []) f(...a); } }
class LocalConn extends Ev {
  constructor(bc, me, other) { super(); this.bc = bc; this.me = me; this.peer = other; this.open = false; }
  send(d) { if (this.open) this.bc.postMessage({ k: 'data', from: this.me, to: this.peer, d }); }
  close() { if (!this.open) return; this.open = false; this.bc.postMessage({ k: 'bye', from: this.me, to: this.peer }); this.emit('close'); }
}
class LocalPeer extends Ev {
  constructor(id) { super(); if (typeof id === 'object') id = null; this.id = id || 'local-' + Math.random().toString(36).slice(2, 10); this.open = true; this.conns = {};
    this.bc = new BroadcastChannel('rotfall-local'); this.bc.onmessage = e => this.msg(e.data); setTimeout(() => this.emit('open', this.id), 50);
    window.addEventListener('beforeunload', () => { for (const c of Object.values(this.conns)) c.close(); }); }
  msg(m) { if (m.to !== this.id) return; let c = this.conns[m.from];
    if (m.k === 'hello') { c = this.conns[m.from] = new LocalConn(this.bc, this.id, m.from); this.emit('connection', c); c.open = true; this.bc.postMessage({ k: 'ack', from: this.id, to: m.from }); setTimeout(() => c.emit('open'), 0); }
    else if (m.k === 'ack' && c) { c.open = true; c.emit('open'); }
    else if (m.k === 'data' && c) c.emit('data', m.d);
    else if (m.k === 'bye' && c) { c.open = false; c.emit('close'); } }
  connect(id) { const c = this.conns[id] = new LocalConn(this.bc, this.id, id); this.bc.postMessage({ k: 'hello', from: this.id, to: id }); return c; }
  reconnect() {} get disconnected() { return false; } get destroyed() { return false; }
}
function loadPeer() {
  if (LOCAL) return Promise.resolve(LocalPeer);
  if (window.Peer) return Promise.resolve(window.Peer);
  return new Promise((ok, no) => { const s = document.createElement('script'); s.src = PEERJS; s.onload = () => ok(window.Peer); s.onerror = () => no(new Error('PeerJS nicht ladbar')); document.head.appendChild(s); });
}
const $ = id => document.getElementById(id);
const status = t => { const el = $('coop-status'); if (el) el.textContent = t; };
const now = () => performance.now();

// ---------------------------------------------------------------- Panel (Titelbildschirm)
export function openPanel(api) {
  A = api;
  let el = $('coop-panel');
  if (!el) {
    el = document.createElement('div'); el.id = 'coop-panel';
    el.innerHTML = `<div class="coop-box">
      <h2>Koop (Netzwerk)</h2>
      <p class="ledger">Ein Spieler öffnet sein Spiel und bekommt einen Code. Der andere gibt den Code ein, erstellt im Warteraum seinen eigenen Charakter und drückt „Bereit“; dann startet der Host. Beide brauchen dieselbe Version (${VER}). Nur der Host speichert. Fragt der Browser beim Verbinden, ob das Spiel Geräte im lokalen Netzwerk finden darf: bitte erlauben, sonst klappt die direkte Verbindung im selben WLAN oft nicht. Die Frage kommt nur bei dem, der beitritt oder dessen Browser sie verlangt — das ist normal.</p>
      <label>Dein Name <input id="coop-name" maxlength="14" value="${(localStorage.getItem('rotfall.coop.name') || 'Gast').replace(/"/g, '')}"></label>
      <div class="ledger"><b>Host:</b> einen Koop-Spielstand wählen (getrennt vom Einzelspieler) oder einen neuen anfangen.</div>
      <div id="coop-slots"></div>
      <div class="coop-row"><button id="coop-newslot" class="plaque">Neuer Koop-Spielstand</button><button id="coop-host" class="plaque" style="display:none">Spiel öffnen (Host)</button></div>
      <div class="coop-row"><input id="coop-code" placeholder="Code" maxlength="6" style="text-transform:uppercase"><button id="coop-join" class="plaque">Beitreten (Gast)</button></div>
      <details class="ledger"><summary>Verbindung klappt nicht? (Schul- oder Firmennetz)</summary>
        Manche Netze sperren direkte Verbindungen zwischen Rechnern. Dann hilft ein Relay-Server (TURN), z. B. ein kostenloses Konto bei metered.ca oder ein eigener coturn. Beide Spieler tragen dasselbe ein.
        <label>TURN-Adresse <input id="coop-turn" placeholder="turn:beispiel.de:443" value="${(localStorage.getItem('rotfall.coop.turn') || '').replace(/"/g, '')}"></label>
        <label>Benutzer <input id="coop-tuser" value="${(localStorage.getItem('rotfall.coop.tuser') || '').replace(/"/g, '')}"></label>
        <label>Passwort <input id="coop-tpass" type="password" value="${(localStorage.getItem('rotfall.coop.tpass') || '').replace(/"/g, '')}"></label>
      </details>
      <div id="coop-status" class="ledger">Bereit.</div>
      <div id="coop-guests"></div>
      <button id="coop-close" class="plaque">Schließen</button>
    </div>`;
    document.body.appendChild(el);
    $('coop-close').onclick = () => { el.classList.add('hidden'); };
    $('coop-host').onclick = () => host().catch(e => status('Fehler: ' + e.message));
    const hostSlot = id => { A.setSlot(id); if (A.isRunning()) A.continueGame(); host().catch(e => status('Fehler: ' + e.message)); };   /* Koop-Stand laden (auch aus dem laufenden Spiel) und öffnen */
    $('coop-slots').appendChild(A.slotCards('coop', hostSlot));
    $('coop-newslot').onclick = () => { A.setSlot(A.newSlot('coop')); A.coopHooks.afterNew = () => { A.coopHooks.afterNew = null; openPanel(A); host().catch(e => status('Fehler: ' + e.message)); };
      el.classList.add('hidden'); $('titlescreen').classList.add('hidden'); $('game').classList.add('hidden'); $('creation').classList.remove('hidden'); };
    $('coop-join').onclick = () => join($('coop-code').value.trim().toUpperCase()).catch(e => status('Fehler: ' + e.message));
  }
  el.classList.remove('hidden');
}
// Verbindungsdaten: öffentliche STUN-Server von Google, dazu optional ein eigener TURN-Server (Relay) aus dem Koop-Fenster
function peerOpts() {
  const url = ($('coop-turn')?.value || '').trim(), user = ($('coop-tuser')?.value || '').trim(), pass = $('coop-tpass')?.value || '';
  localStorage.setItem('rotfall.coop.turn', url); localStorage.setItem('rotfall.coop.tuser', user); localStorage.setItem('rotfall.coop.tpass', pass);
  const ice = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  if (url) ice.push({ urls: url.split(/[\s,]+/).filter(Boolean), username: user, credential: pass });
  return { debug: 0, config: { iceServers: ice } };
}
const myName = () => { const n = ($('coop-name')?.value || 'Gast').trim().slice(0, 14) || 'Gast'; localStorage.setItem('rotfall.coop.name', n); return n; };

// ---------------------------------------------------------------- Host
async function host() {
  const { S } = A;
  if (!A.isRunning() && !A.hasSave()) return status('Dieser Koop-Stand ist leer. „Neuer Koop-Spielstand“ drücken.');
  if (!A.SLOT().startsWith('c')) return status('Wähle oben einen Koop-Spielstand oder fang einen neuen an — Einzelspieler-Stände bleiben getrennt.');
  status('Verbinde mit dem Vermittler …');
  const Peer = await loadPeer(); const code = rnd6();
  peer = new Peer('rotfall-' + code, peerOpts());
  await new Promise((ok, no) => { peer.on('open', ok); peer.on('error', e => no(new Error(e.type || 'Peer-Fehler'))); });
  S.coop = { role: 'host', code, guests: {}, bytes: 0, t0: now(), started: A.isRunning() };   /* aus dem laufenden Spiel geöffnet: wer bereit ist, kommt sofort dazu */
  A.coopHooks.hostTick = hostTick; A.coopHooks.remote = remoteControl; A.coopHooks.guestAct = guestAct; A.coopHooks.hostDied = hostDied; A.coopHooks.heirCount = heirCount; A.coopHooks.afterHeir = afterHeir;
  A.coopHooks.card = (title, sub, snd) => broadcast({ t: 'card', title, sub, snd });   /* E22 im Koop (09.10.): Ereigniskarten auch beim Gast (ohne Pause, der Gast rechnet nichts) */
  A.coopHooks.key = k => { if (k !== 'enter' || A.UI.dialogueOpen() || A.UI.modalOpen) return false; A.keys.delete('enter'); openChat(t => { chatLine(S.player.name, t); muteLog = true; A.log(`${S.player.name}: ${t}`, 'party'); muteLog = false; broadcast({ t: 'chat', from: S.player.name, text: t }); }); return true; };
  A.onLog(e => { if (!muteLog) broadcast({ t: 'log', text: e.text, cat: e.cat }); });
  setInterval(() => { if (document.hidden) A.stepHidden(); }, 50);
  setInterval(() => { if (A.S.paused) broadcast({ t: 'ping' }); }, 2000);   /* Welt steht (Todesbildschirm): Lebenszeichen, sonst meldet der Gast „Host antwortet nicht“ */
  { const b = document.createElement('button'); b.id = 'coop-hud'; b.className = 'plaque'; b.textContent = `Koop · Code ${code} · Tauschen`; b.title = 'Gegenstände an einen Gast geben; sein Goldanteil und seine Beute'; b.style.cssText = 'position:fixed;right:12px;top:52px;z-index:30;font-size:12px;padding:4px 10px'; b.onclick = hostTrade; document.body.appendChild(b); }   /* Host-Fenster im Hintergrund: Welt läuft (gedrosselt) weiter, siehe game.js stepHidden */
  peer.on('disconnected', () => setTimeout(() => { if (!peer.destroyed && peer.disconnected) try { peer.reconnect(); } catch (e) { /* nächster Versuch beim nächsten Abbruch */ } }, 1500));   /* Vermittler weg (Netz-Schluckauf): sonst finden neue Gäste den Code nie wieder */
  window.addEventListener('pagehide', () => broadcast({ t: 'bye', why: 'Der Host hat das Spiel geschlossen.' }));
  peer.on('connection', c => { c.on('open', () => { c.on('data', d => onHostData(c, d)); c.on('close', () => dropGuest(c.peer)); }); });
  status(`Warteraum offen. Code: ${code} — sag ihn deinen Mitspielern.`);
  $('coop-host').disabled = $('coop-join').disabled = true;
  hostLobby();
}
// Host: Warteraum. Zeigt jeden Gast mit seiner Wahl und ob er bereit ist. „Spiel starten“ geht, wenn alle bereit sind.
function hostLobby() {
  const S = A.S, G = Object.values(S.coop.guests), box = $('coop-guests'); if (!box) return;
  const all = G.every(g => g.ready && g.choice);
  box.innerHTML = `<h3>Warteraum</h3><div class="ledger">${S.coop.started ? 'Das Spiel läuft. Wer bereit ist, kommt sofort dazu.' : 'Wenn alle bereit sind, startest du.'}</div>` +
    '<div id="coop-cards" class="coop-cards"></div>' +
    (S.coop.started ? '<button class="plaque" id="coop-back">Weiterspielen</button>' : `<button class="plaque" id="coop-start" ${all ? '' : 'disabled'}>Spiel starten${G.length ? '' : ' (allein, Gäste können später dazukommen)'}</button>`);
  const cards = lobbyCards(); drawCards($('coop-cards'), cards); broadcast({ t: 'cards', cards });   /* alle sehen dieselben Karten */
  if ($('coop-start')) $('coop-start').onclick = startCoop;
  if ($('coop-back')) $('coop-back').onclick = () => $('coop-panel').classList.add('hidden');
}
// Karten im Warteraum wie bei einem Kampfspiel: Spielername oben, Figur, Charaktername, Stufe, Klasse, Bereit
function figOf(e) { if (!e) return null; const eq = {}; for (const k of ['weapon', 'offhand', 'head', 'chest', 'cloak']) if (e.equip?.[k]) eq[k] = { key: e.equip[k].key };
  return { name: e.name, level: e.level, cls: A.CLASSES[e.currentClass]?.name || e.prof || '', pal: e.pal, build: e.build, equip: eq }; }
function heroFig() { const S = A.S; if (S.player) return figOf(S.player); try { const d = A.loadRaw(); return figOf(d && Object.values(d.ents || {}).flat().find(e => e?.kind === 'player')); } catch (e) { return null; } }
function choiceFig(g) {
  const S = A.S, c = g.choice; if (!c) return null;
  if (c.mode === 'new') { const o = A.ORIGINS[c.cfg.origin] || {}, eq = {}; for (const k of o.gear || []) { const sl = A.ITEMS[k]?.slot; if (['weapon', 'offhand', 'head', 'chest', 'cloak'].includes(sl) && !eq[sl]) eq[sl] = { key: k }; }
    return { name: c.cfg.name, level: c.cfg.level || Math.max(1, (heroFig()?.level || 1) - 2), cls: o.name || '', pal: c.cfg.pal, build: c.cfg.build, equip: eq }; }
  if (c.mode === 'saved') return figOf(S.coopHeroes?.[g.name]);
  return figOf(A.byId(c.entId));
}
function lobbyCards() {
  const S = A.S;
  return [{ who: myName(), host: true, ready: true, fig: heroFig() }, ...Object.values(S.coop.guests).map(g => ({ who: g.name, ready: g.ready || !!g.entId, fig: g.entId ? figOf(A.byId(g.entId)) : choiceFig(g) }))];
}
function drawCards(box, cards) {
  if (!box) return;
  box.innerHTML = cards.map((c, i) => `<div class="coop-card${c.ready ? ' ready' : ''}"><div class="cc-who">${esc(c.who)}${c.host ? ' ★' : ''}</div><canvas width="120" height="150" data-card="${i}"></canvas>` +
    (c.fig ? `<div class="cc-name">${esc(c.fig.name)}</div><div class="cc-sub">Stufe ${c.fig.level || 1}${c.fig.cls ? ' · ' + esc(c.fig.cls) : ''}</div>` : '<div class="cc-name">…</div><div class="cc-sub">wählt noch</div>') +
    `<div class="cc-state">${c.ready ? 'BEREIT' : 'nicht bereit'}</div></div>`).join('');
  [...box.querySelectorAll('canvas[data-card]')].forEach(cv => { const c = cards[+cv.dataset.card]; if (!c.fig) return; const x = cv.getContext('2d');
    x.save(); x.translate(60, 128); x.scale(2.4, 2.4);
    try { A.R.drawHumanoid({ kind: 'npc', x: 0, y: 0, pal: c.fig.pal || {}, facing: 0, seed: 1, build: c.fig.build || 'ausgewogen', equip: c.fig.equip || {}, aim: Math.PI / 2 - 0.35 }, performance.now(), x); } catch (e) { /* Figur nicht zeichenbar: Karte bleibt leer */ }
    x.restore(); });
}
// Chat im Spiel: Enter öffnet die Eingabe unten links, Enter schickt, Esc bricht ab. Zeilen bleiben 15 s sichtbar (bei offener Eingabe alle).
function chatBox() {
  let b = $('coop-chat'); if (b) return b;
  b = document.createElement('div'); b.id = 'coop-chat';
  b.innerHTML = '<div id="coop-chat-log"></div><input id="coop-chat-in" maxlength="200" placeholder="Nachricht … (Enter schickt, Esc schließt)" class="hidden">';
  document.body.appendChild(b); return b;
}
function chatLine(from, text) {
  chatBox(); const log = $('coop-chat-log'), row = document.createElement('div'); row.className = 'cc-line';
  row.innerHTML = `<b>${esc(from)}:</b> ${esc(text)}`; log.appendChild(row); while (log.children.length > 30) log.firstChild.remove();
  setTimeout(() => row.classList.add('old'), 15000);
}
function openChat(onSend) {
  chatBox(); const inp = $('coop-chat-in'); $('coop-chat').classList.add('open'); inp.classList.remove('hidden'); inp.value = ''; setTimeout(() => inp.focus(), 0);
  const close = () => { inp.classList.add('hidden'); $('coop-chat').classList.remove('open'); inp.onkeydown = null; inp.blur(); };
  inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') { const t = inp.value.trim().slice(0, 200); close(); if (t) onSend(t); } else if (e.key === 'Escape') close(); };
}
const esc = t => String(t).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
function choiceText(c) { return c.mode === 'heir' || c.heir ? `Erbe „${c.name || c.cfg?.name}“` : c.mode === 'new' ? `neuer Charakter „${c.cfg?.name}“ (${A.ORIGINS[c.cfg?.origin]?.name || 'Wanderer'})` : c.mode === 'saved' ? `spielt „${c.name}“ weiter` : `übernimmt ${c.name}`; }
// Koop (Nutzer): Stirbt der Held, sind alle Spieler am Boden. Jeder Gast wählt dann wie der Host einen Erben, gleich viele zur Auswahl;
// er kommt dazu, sobald der Host seinen Erben gewählt hat.
function hostDied(n, level) {
  const S = A.S;
  for (const g of Object.values(S.coop?.guests || {})) {
    const m = g.entId && A.byId(g.entId); if (m) { m.coopPilot = null; m.coopName = null; }
    g.deadLevel = m?.level || level || 1; g.entId = null; g.ready = false; g.choice = null; g.heirs = null;
    sendLobby(g, 'Alle sind gefallen. Gleich wählst du deinen Erben — genau so viele zur Auswahl wie der Host.');
  }
  hostLobby();
}
function heirCount(n) {
  const pk = a => a[Math.floor(Math.random() * a.length)], O = Object.keys(A.ORIGINS);
  for (const g of Object.values(A.S.coop?.guests || {})) { if (g.entId) continue;
    g.heirs = Array.from({ length: Math.max(1, n) }, () => ({ name: pk(A.FIRST_M), origin: pk(O), pal: { skin: pk(A.SKIN), hair: pk(A.HAIR), cloth: pk(A.CLOTH) }, build: 'ausgewogen', level: Math.max(1, (g.deadLevel || 1) - 1) }));
    sendLobby(g, 'Alle sind gefallen. Wähle deinen Erben — er stößt zur Gruppe, sobald der Host seinen gewählt hat.'); }
}
function afterHeir() { for (const g of Object.values(A.S.coop?.guests || {})) if (g.ready && g.choice && !g.entId) admit(g); }
function startCoop() {
  const S = A.S; S.coop.started = true; $('coop-panel').classList.add('hidden');
  if (!A.isRunning()) { A.bindInput(); A.continueGame(); }
  A.UI.toast(`KOOP — CODE ${S.coop.code}`, 5000);
  A.log(`Koop: Code ${S.coop.code}. Mitspieler spielen eigene Charaktere in deiner Gruppe. Erfahrung und Auftragsgold werden geteilt; Beute hat, wer sie zuerst aufhebt. Tauschen über den Knopf oben rechts. Enter schreibt.`, 'party');
  for (const g of Object.values(S.coop.guests)) if (g.ready && g.choice && !g.entId) admit(g);
}
// Gast kommt ins Spiel: Figur bauen oder holen, Welt schicken, zuweisen
function admit(g) {
  const S = A.S, c = g.choice; let m = null;
  if (S.paused && S.player && !S.player.alive) return;   /* Host wählt noch seinen Erben: afterHeir holt den Gast dann */
  if (c.mode === 'new') { const old = S.coopHeroes?.[g.name]; if (old) delete S.coopHeroes[g.name]; m = A.makeGuestHero(c.cfg, g.name); }
  else if (c.mode === 'saved') m = A.unparkCoopHero(g.name);
  else { m = A.byId(c.entId); if (!m || !S.party.includes(m.id) || !m.alive || (m.coopPilot && m.coopPilot !== g.id) || (A.raceOf && A.raceOf(m) !== 'mensch')) m = null; }   /* E17 */
  if (!m) { g.ready = false; g.choice = null; sendLobby(g, 'Diese Wahl geht nicht mehr. Bitte neu wählen.'); hostLobby(); return; }
  g.deadLevel = 0;
  if (!m.hotbar?.length) m.hotbar = A.GUEST_BAR.map(key => ({ type: 'item', key }));
  m.coopPilot = g.id; m.coopName = g.name; g.entId = m.id; g.known = new Set(); g.map = null; g.seen = now() + 40000;   /* der Gast baut jetzt die Welt auf (dauert, im Hintergrundfenster noch länger): so lange nicht als getrennt werten */
  sendTo(g, { t: 'welcome', save: A.saveData(), hostName: S.player.name }); sendTo(g, { t: 'assign', entId: m.id });
  lastQuests = '';   /* Aufträge gleich an den neuen Gast */
  A.log(`Koop: ${g.name} ist im Spiel als ${m.name}.`, 'party'); A.UI.toast(`${g.name.toUpperCase()} IST IM SPIEL`, 2400); hostLobby();
}
function sendLobby(g, note) {
  const S = A.S, saved = S.coopHeroes?.[g.name];
  sendTo(g, { t: 'lobby', hostName: S.player?.name || myName(), note: note || null, started: !!S.coop.started, party: partyList().filter(p => !A.byId(p.id)?.coopHero),
    saved: saved && saved.alive && !g.heirs ? { name: saved.name, level: saved.level, prof: saved.prof } : null, heirs: g.heirs ? g.heirs.map(h => ({ name: h.name, origin: A.ORIGINS[h.origin]?.name, level: h.level })) : null, locked: !!g.deadLevel && !g.heirs });
}
const INGAME = new Set(['world', 'quests', 'cam', 'log', 'toast', 'card']);   /* nur an Gäste, die schon im Spiel sind (nicht im Warteraum) */
function broadcast(msg) { const G = A.S.coop?.guests; if (!G) return; const s = JSON.stringify(msg); for (const g of Object.values(G)) { if (INGAME.has(msg.t) && !g.entId) continue; try { g.conn.send(s); A.S.coop.bytes += s.length; } catch (e) { /* Verbindung tot: dropGuest kommt über close */ } } }
function sendTo(g, msg) { const s = typeof msg === 'string' ? msg : JSON.stringify(msg); try { g.conn.send(s); A.S.coop.bytes += s.length; } catch (e) { /* siehe oben */ } }
function partyList() { return (A.S.player ? A.partyMembers() : []).filter(m => m.alive && m.kind === 'npc' && (!A.raceOf || A.raceOf(m) === 'mensch')).map(   /* E17 ⚖ (09.10.): Gäste spielen nur Menschen — Goblin-, Skelett-, Zwergen-Gefährten bleiben beim Host */m => ({ id: m.id, name: m.name, prof: m.prof, level: m.level, taken: !!m.coopPilot })); }
function onHostData(c, raw) {
  const { S } = A; let d; try { d = JSON.parse(raw); } catch (e) { return; }
  const G = S.coop.guests;
  if (d.t === 'hello') {
    if (d.ver !== VER) { sendTo({ conn: c }, { t: 'bye', why: `Version passt nicht: Host ${VER}, Gast ${d.ver}. Beide Seiten neu laden.` }); setTimeout(() => c.close(), 500); return; }
    G[c.peer] = { id: c.peer, conn: c, name: (d.name || 'Gast').slice(0, 14), entId: null, inp: null, at: 0, known: new Set(), last: {}, map: null, selfAt: 0, seen: now(), choice: null, ready: false };
    sendLobby(G[c.peer]); hostLobby();
    if (A.S.player) { A.log(`Koop: ${G[c.peer].name} ist im Warteraum.`, 'party'); A.UI.toast(`${G[c.peer].name.toUpperCase()} IST DA`, 2400); }
    return; }
  const g = G[c.peer]; if (!g) return;
  g.seen = now();
  if (d.t === 'choice') { if (g.entId) return; const m = d.mode === 'companion' && A.byId(d.entId);
    if (d.mode === 'heir' && g.heirs?.[d.i]) { g.choice = { mode: 'new', cfg: g.heirs[d.i], heir: true }; g.heirs = null; g.ready = false; hostLobby(); return; }
    g.choice = d.mode === 'new' ? { mode: 'new', cfg: { name: String(d.cfg?.name || g.name).slice(0, 18), origin: A.ORIGINS[d.cfg?.origin] ? d.cfg.origin : 'wanderer', pal: d.cfg?.pal, build: d.cfg?.build } }
      : d.mode === 'saved' && S.coopHeroes?.[g.name] ? { mode: 'saved', name: S.coopHeroes[g.name].name }
      : m ? { mode: 'companion', entId: m.id, name: m.name } : null;
    g.ready = false; hostLobby(); return; }
  if (d.t === 'ready') { if (g.entId) return; g.ready = !!d.on && !!g.choice; hostLobby(); if (g.ready && S.coop.started) admit(g); return; }
  if (d.t === 'ping') return;
  if (d.t === 'leave') { try { c.close(); } catch (e) { /* schon zu */ } dropGuest(c.peer); return; }
  if (d.t === 'in') { g.inp = d; g.at = now(); return; }
  if (d.t === 'cmd') { const m = A.byId(g.entId); if (!m) return; guestCommand(m, d, g); return; }
  if (d.t === 'chat') { chatLine(g.name, String(d.text).slice(0, 200)); muteLog = true; A.log(`${g.name}: ${String(d.text).slice(0, 200)}`, 'party'); muteLog = false; broadcast({ t: 'chat', from: g.name, text: String(d.text).slice(0, 200) }); return; }
  if (d.t === 'party') { sendLobby(g); return; }
}
function dropGuest(peerId) {
  const S = A.S, g = S.coop?.guests?.[peerId]; if (!g) return;
  const m = g.entId && A.byId(g.entId); if (m) { m.coopPilot = null; m.coopName = null; if (m.coopHero && m.alive) A.parkCoopHero(m); }
  delete S.coop.guests[peerId]; hostLobby(); A.log(`Koop: ${g.name} hat die Verbindung getrennt.${m ? m.coopHero ? ` ${m.name} wartet, bis ${g.name} wiederkommt (wird mit deinem Spiel gespeichert).` : ` ${m.name} folgt dir wieder von selbst.` : ''}`, 'party');
}
// Inventar-Befehle des Gasts an seiner Figur: nur eigene Sachen, nur bestehende Funktionen
function guestCommand(m, d, g) {
  if (d.kind === 'equip' && m.inv[d.idx]) A.equip(m, d.idx);
  else if (d.kind === 'unequip' && m.equip[d.slot]) A.unequip(m, d.slot);
  else if (d.kind === 'use' && m.inv[d.idx]) A.useConsumable(m, d.idx);
  else if (d.kind === 'drop' && m.inv[d.idx]) { const it = m.inv.splice(d.idx, 1)[0]; A.dropItemAt(m.map, m.x, m.y + 10, it); }
  else if (d.kind === 'give' && m.inv[d.idx]) { const it = m.inv[d.idx]; if (A.giveItem(A.S.player, it)) { m.inv.splice(d.idx, 1); A.log(`${g.name} gibt dir ${A.ITEMS[it.key]?.name || it.key}.`, 'party'); } else sendTo(g, { t: 'toast', text: 'Die Tasche des Helden ist voll.' }); }
  else if (d.kind === 'attr' && m.attrPoints > 0 && m.attributes?.[d.key] != null) { m.attributes[d.key]++; m.attrPoints--; A.recalc(m); }
  else if (d.kind === 'buy' || d.kind === 'sell') { guestShopDeal(m, g, d); return; }
  else if (d.kind === 'dlg') { const c = g.dlg?.[d.i]; g.dlg = null; if (c?.fn) runAs(m, g, () => c.fn()); return; }
  else if (d.kind === 'act' && ['setClass', 'setTitleClass', 'learnNode'].includes(d.name) && A.UI.uiRaw(d.name)) { runAs(m, g, () => A.UI.uiRaw(d.name)(...(d.args || []))); }
  else if (d.kind === 'gold' && (m.coopGold || 0) > 0) { A.S.gold += m.coopGold; A.log(`${g.name} gibt dir ${m.coopGold} Gold.`, 'party'); m.coopGold = 0; }
  g.selfAt = 0;   /* Selbst-Zustand sofort neu schicken */
}

// K2.7: Gespräche und Figurenknöpfe des Gasts. Der Host führt sie aus, als wäre die Gastfigur der Held (S.player) und mit ihren
// eigenen Fraktionsrängen (S.ranks); der Ruf (S.factions) bleibt gemeinsam. Dialogfenster gehen an den Gast, Händlerfenster als Gastladen.
// Nimmt der Gast dabei einen Auftrag an, fragt ein Fenster beim Host, ob er einverstanden ist (sonst wird er zurückgenommen).
const RANK0 = { valen: -1, order: -1, undead: -1, chain: -1 };
function runAs(m, g, fn) {
  const S = A.S, P = S.player, Rk = S.ranks, H = A.UI.uiHooks, before = JSON.stringify([S.quests, S.contracts || []]);
  m.ranks ||= Object.fromEntries(Object.keys(Rk || RANK0).map(k => [k, -1]));
  H.dialogue = (npc, text, choices) => { g.dlg = choices; sendTo(g, { t: 'dlg', name: npc.name, npcId: npc.id, text, opts: choices.map(c => c.text) }); return true; };
  H.close = () => { g.dlg = null; sendTo(g, { t: 'dlg', close: 1 }); return true; };
  H.modal = (name, arg) => { if (name === 'trade' && arg?.shop) sendShop(m, g, arg); else sendTo(g, { t: 'modal', name }); return true; };
  S.player = m; S.ranks = m.ranks; S._hostHero = P;   /* HB2-08: gainXp gibt dem Helden seinen Anteil */
  try { fn(); } catch (e) { console.error(e); sendTo(g, { t: 'toast', text: 'Das ging nicht: ' + e.message }); }
  finally { m.ranks = S.ranks; S.player = P; S.ranks = Rk; delete S._hostHero; H.dialogue = H.close = H.modal = null; }
  g.selfAt = 0;
  const after = JSON.stringify([S.quests, S.contracts || []]); if (after !== before) askHostQuest(g, m, before, after);
}
function askHostQuest(g, m, before, after) {
  const S = A.S, [q0, c0] = JSON.parse(before), gained = Object.keys(S.quests).filter(k => !q0[k] || (q0[k].state !== S.quests[k].state && S.quests[k].state === 'active'));
  const newC = (S.contracts || []).filter(c => c.state === 'active' && !c0.some(o => o.id === c.id && o.state === 'active'));
  const names = [...new Set([...gained.filter(k => !k.startsWith('c_')).map(k => A.QUESTS?.[k]?.name || S.quests[k]?.title || k), ...newC.map(c => c.title)])]; if (!names.length) return;
  const detail = [...gained.filter(k => !k.startsWith('c_')).map(k => `• ${A.QUESTS?.[k]?.name || k}: ${A.QUESTS?.[k]?.desc || ''}`), ...newC.map(c => `• ${c.title}${c.town ? ` (${A.townName?.(c.town) || c.town})` : ''}: ${c.desc || ''}${c.reward?.gold ? ` Lohn ${c.reward.gold} Gold.` : ''}`)].join('\n');   /* was und wo */
  A.dialogue(m, `${g.name} (${m.name}) hat angenommen:\n${detail}\nWollt ihr das gemeinsam machen? Aufträge gelten für die ganze Gruppe; der Wegpunkt steht auf der Karte (M).`, [
    { text: 'Ja, machen wir.', fn: () => { A.UI.closeDialogue(); sendTo(g, { t: 'toast', text: `${S.player.name} ist dabei.` }); } },
    { text: 'Nein, lass das.', fn: () => { A.UI.closeDialogue(); const [q1, c1] = JSON.parse(before); for (const k of gained) { if (q1[k]) S.quests[k] = q1[k]; else delete S.quests[k]; } for (const c of newC) { const o = c1.find(x => x.id === c.id); if (o) Object.assign(c, o); else c.state = 'offer'; }
      sendTo(g, { t: 'toast', text: `${S.player.name} will das nicht. Auftrag zurückgegeben.` }); A.log(`Auftrag zurückgegeben: ${names.join(', ')}.`, 'quest'); } }]);
}

// K2.6/K2.7 (einfach): was die Gastfigur mit E vor sich hat, wenn es kein Gegenstand ist
function guestAct(m, t) {
  const S = A.S, g = S.coop?.guests?.[m.coopPilot]; if (!g) return null;
  if (t.kind === 'prop' && t.portal) {                   /* Eingang: der Host entscheidet, die Gruppe reist zusammen */
    if (Math.hypot(S.player.x - t.x, S.player.y - t.y) > 700 || S.player.map !== m.map) { sendTo(g, { t: 'toast', text: `${S.player.name} ist zu weit weg. Ihr reist nur zusammen.` }); return { kind: 'far' }; }
    if (A.UI.dialogueOpen() || A.UI.modalOpen || S.cine) { sendTo(g, { t: 'toast', text: `${S.player.name} ist gerade beschäftigt.` }); return { kind: 'busy' }; }
    A.dialogue(m, `${g.name} (${m.name}) steht am Eingang und will hindurch. Gehst du mit? Die ganze Gruppe reist zusammen.`, [
      { text: 'Gehen wir.', fn: () => { A.UI.closeDialogue(); A.travelVia(t); } },
      { text: 'Nicht jetzt.', fn: () => { A.UI.closeDialogue(); sendTo(g, { t: 'toast', text: `${S.player.name} will noch nicht.` }); } }]);
    sendTo(g, { t: 'toast', text: `Du fragst ${S.player.name}, ob ihr hindurchgeht.` }); return { kind: 'ask' };
  }
  if (t.kind === 'npc' && t.shop) { const no = A.shopRefusal(t); if (no) { sendTo(g, { t: 'toast', text: `${t.name}: ${no}` }); return { kind: 'closed' }; } sendShop(m, g, t); return { kind: 'shop' }; }
  if (t.kind === 'prop' && t.type === 'board') { runAs(m, g, () => A.doInteract(t)); return { kind: 'board' }; }   /* Anschlagbrett: Aufträge wie der Held */
  if (t.kind === 'npc') { runAs(m, g, () => A.talk(t)); return { kind: 'talk' }; }
  return null;
}
function sendShop(m, g, npc) {
  const I = A.ITEMS, buy = A.shopStock(npc).filter(s => s.count >= 1).slice(0, 16).map(s => ({ key: s.key, count: s.count, name: I[s.key].name, price: A.price(s.key, true, npc) }));
  const RAR = ['rare', 'epic', 'legendary', 'mythic'];   /* HB-30: gesperrt/gebunden unverkäuflich, ab Selten mit Rückfrage beim Gast */
  const sell = m.inv.map((s, idx) => ({ idx, name: I[s.key]?.name || s.key, count: s.count || 1, price: I[s.key]?.bound || s.lock ? null : A.price(s.key, false, npc, s), lock: !!s.lock, rare: RAR.includes(s.rarity || I[s.key]?.rarity) }));
  g.shopNpc = npc.id; sendTo(g, { t: 'shop', npcId: npc.id, name: npc.name, prof: npc.prof, gold: m.coopGold || 0, buy, sell });
}
function guestShopDeal(m, g, d) {
  const S = A.S, I = A.ITEMS, npc = A.byId(d.npcId); if (!npc || npc.id !== g.shopNpc || A.shopRefusal(npc) || A.dist(npc, m) > 140) return sendTo(g, { t: 'toast', text: 'Der Händler ist nicht mehr da.' });
  /* HB-30 (09.10.): derselbe Weg wie beim Helden (buy/sell): Stadtlager auch bei Ausrüstung, onItemGained, Handel-Fertigkeit der Gastfigur,
     Sperre und Auftragsgegenstände. Dafür stehen kurz Gastfigur und Gastbeutel an Stelle von Held und Heldengold (wie runAs). */
  const P = S.player, G0 = S.gold, key = d.kind === 'buy' ? d.key : m.inv[d.idx]?.key, n0 = m.inv.reduce((n, s) => n + (s.key === key ? (s.count || 1) : 0), 0), g0 = m.coopGold || 0;
  if (!key || !I[key]) return;
  if (d.kind === 'buy' && g0 < A.price(key, true, npc)) return sendTo(g, { t: 'toast', text: 'Zu wenig Gold im Beutel.' });   /* sonst stünde der Hinweis beim Host */
  if (d.kind === 'sell' && (m.inv[d.idx].lock || I[key].bound)) return sendTo(g, { t: 'toast', text: 'Gesperrt oder gebunden — nicht verkäuflich.' });
  S.player = m; S.gold = g0;
  try { if (d.kind === 'buy') A.buy(npc, d.key, true); else A.sell(d.idx, npc, true); } catch (e) { console.error(e); }
  finally { m.coopGold = S.gold; S.gold = G0; S.player = P; }
  const n1 = m.inv.reduce((n, s) => n + (s.key === key ? (s.count || 1) : 0), 0);
  if (n1 !== n0) A.log(`${g.name} ${d.kind === 'buy' ? 'kauft' : 'verkauft'} ${I[key].name} für ${Math.abs(m.coopGold - g0)} Gold.`, 'economy');
  else sendTo(g, { t: 'toast', text: d.kind === 'buy' ? (g0 < A.price(key, true, npc) ? 'Zu wenig Gold im Beutel.' : 'Das geht gerade nicht (Tasche voll oder ausverkauft).') : 'Das verkauft man nicht (gesperrt, gebunden oder für einen Auftrag nötig).' });
  sendShop(m, g, npc); g.selfAt = 0;
}

// Bewegung und Kampf der Gastfigur auf dem Host: dieselben Funktionen wie beim Helden (moveEnt, attack, Deckung, Rolle)
function remoteControl(m, dt) {
  const S = A.S, g = S.coop?.guests?.[m.coopPilot]; if (!g || !g.inp || now() - g.at > 1000) return false;   /* keine Eingabe seit 1 s: KI übernimmt */
  if (m.downed) { m.vx = m.vy = 0; return true; }
  const inp = g.inp, [dx, dy] = inp.mv || [0, 0], l = Math.hypot(dx, dy);
  if (inp.aim != null) m.aim = inp.aim;
  if (l && !inp.atk && !inp.guard && !(m.swing > 0)) m.aim = Math.atan2(dy, dx);   /* läuft er nur, schaut er in Laufrichtung (sonst Rückwärtsgang-Bild beim Host) */
  if (m.dodge) {                                                   /* Rolle läuft: wie beim Helden (controlPlayer) */
    const d = m.dodge, D = A.DODGE, ease = k => 1 - (1 - k) * (1 - k), L = D.dist, U = D.dur, sp = L * (ease(Math.min(1, (d.t + dt) / U)) - ease(d.t / U));
    A.moveEnt(m, d.ax * sp, d.ay * sp); d.t += dt; if (d.t >= U - 40) m.invuln = false;
    if (d.t >= U) { m.dodge = null; m.invuln = false; m.landT = now() + 110; A.fx(m.x, m.y + 4, 'dust', 4); } return true; }
  if (inp.dodge && inp.seq !== g.dodgeSeq) { g.dodgeSeq = inp.seq; startDodge(m, dx, dy); if (m.dodge) return true; }
  A.updateGuard(m, !!inp.guard);
  if (l && m.landT <= now()) {
    let sp = A.speedOf(m) * dt / 16 * (m.cover ? 0.45 : 1); if (m.swing > 0) sp *= 0.55;
    if ((dx * Math.cos(m.aim) + dy * Math.sin(m.aim)) / l < -0.35 && A.hostilesOf(m).some(f => A.dist(m, f) < 280)) sp *= 0.7;
    A.moveEnt(m, dx / l * sp, dy / l * sp); m.stamina = Math.max(0, m.stamina - dt / 1000 * 1.2);
  } else { m.vx = m.vy = 0; }
  if (inp.atk && !m.cover) A.attack(m);
  if (inp.use && inp.seq !== g.useSeq) { g.useSeq = inp.seq; A.doInteractFor(m); }
  if (inp.slot != null && inp.seq !== g.slotSeq) { g.slotSeq = inp.seq; A.useSlotFor(m, inp.slot); }
  return true;
}
function startDodge(m, dx, dy) {
  const D = A.DODGE; if (m.dodge || m.channel || (m.dodgeCd || 0) > 0) return;
  const cost = D.stam * (1.2 - (m.attributes?.endurance || 10) * 0.02); if (m.stamina < cost || A.B.speedFactor(m) < 0.5) return;
  const l = Math.hypot(dx, dy), ax = l ? dx / l : -Math.cos(m.aim), ay = l ? dy / l : -Math.sin(m.aim);
  m.stamina -= cost; m.dodgeCd = D.cd + D.dur; m.dodge = { t: 0, ax, ay }; m.invuln = true; m.swing = 0; m.cover = null; A.fx(m.x, m.y + 4, 'dust', 6);
}

// Zustand an die Gäste: nahe Figuren (Delta je Feld), Welt, eigene Figur, Effekte
let acc = 0, wAcc = 0, lastQuests = '', camOn = false;
function hostTick(dt) {
  const S = A.S, G = S.coop?.guests; if (!G) return; acc += dt; wAcc += dt;
  mateArrows(A.partyMembers().filter(m => m.coopPilot && m.map === S.map));
  for (const [id, g] of Object.entries(G)) if (now() - (g.seen || now()) > 20000) { try { g.conn.close(); } catch (e) { /* schon zu */ } dropGuest(id); }   /* 20 s ohne Lebenszeichen: Gast gilt als getrennt */
  for (const g of Object.values(G)) { if (g.entId) { const m = A.byId(g.entId); if (m) { m.dodgeCd = Math.max(0, (m.dodgeCd || 0) - dt); m.landT ??= 0; if (m.map !== S.map && m.alive) remoteControl(m, dt); } } }   /* Figur auf einer anderen Karte (Held im Kerker): die Welt dort rechnet nicht, aber laufen darf sie */
  if (acc < 50) return; acc = 0;
  for (const g of Object.values(G)) {
    if (!g.entId) continue; const m = A.byId(g.entId);
    if (!m || !m.alive || !S.party.includes(m.id)) { if (m) { m.coopPilot = null; m.coopName = null; } g.entId = null; g.ready = false; g.choice = null; sendLobby(g, m && !m.alive ? `${m.name} ist tot. Erstelle einen neuen Charakter oder übernimm einen Gefährten.` : 'Deine Figur ist nicht mehr in der Gruppe. Wähl neu.'); hostLobby(); continue; }   /* tot, entlassen oder weg: neu wählen */
    if (m.coopPilot !== g.id) { m.coopPilot = g.id; m.coopName = g.name; }   /* nach Laden im laufenden Spiel fehlt die Zuordnung (wird nie gespeichert) */
    if (g.map !== m.map) { g.map = m.map; g.known = new Set(); g.last = {}; sendTo(g, { t: 'travel', map: m.map, x: m.x, y: m.y }); }
    const ents = S.ents[m.map] || [], upd = [], add = [], seen = new Set();
    for (const e of ents) {
      if (e === m) { seen.add(e.id); } else { if (!SENT.has(e.kind)) continue; if (Math.hypot(e.x - m.x, e.y - m.y) > NEAR + (g.known.has(e.id) ? 200 : 0) && !S.party.includes(e.id) && e !== S.player) continue; seen.add(e.id); }   /* 200 px Nachlauf, sonst flackert der Rand */
      if (!g.known.has(e.id)) { g.known.add(e.id); add.push(lightEnt(e)); g.last[e.id] = {}; continue; }
      const L = g.last[e.id], u = { id: e.id }; let n = 0;
      for (const k of DYN) { let v = e[k]; if (v && typeof v === 'object') v = v.kind || true; if (typeof v === 'number') v = Math.round(v * 100) / 100; if (L[k] !== v) { L[k] = v; u[k] = v; n++; } }
      const st = (e.status || []).map(s => s.key).join(','); if (L._st !== st) { L._st = st; u.status = st; n++; }
      const eq = e.equip ? Object.values(e.equip).map(x => x?.key || '').join(',') : ''; if (L._eq !== eq) { L._eq = eq; u.equip = e.equip; n++; }   /* neue Waffe oder Rüstung sieht der Gast sofort */
      const sp = e.special ? JSON.stringify(e.special) : ''; if (L._sp !== sp) { L._sp = sp; u.special = e.special || null; n++; }   /* Koop: Bodenmarke/Warnzeichen schwerer Angriffe (special ist ein Objekt, DYN reduziert Objekte auf einen Namen) */
      if (n) upd.push(u);
    }
    const del = [...g.known].filter(id => !seen.has(id)); for (const id of del) { g.known.delete(id); delete g.last[id]; }
    const fx = S.fx.filter(f => f.maxLife - f.life < 60 && Math.hypot(f.x - m.x, f.y - m.y) < NEAR).slice(0, 40).map(f => [Math.round(f.x), Math.round(f.y), f.type]);
    const fl = S.floats.filter(f => (f.maxLife || 900) - f.life < 60 && Math.hypot(f.x - m.x, f.y - m.y) < NEAR).slice(0, 12).map(f => ({ x: f.x, y: f.y, text: f.text, color: f.color, big: f.big, num: f.num, mine: f.num ? f.srcId === m.id : f.mine }));   /* Koop: „mine“ je Gast-Held neu berechnet (eigener Schaden statt immer der des Hosts), sonst zeigt „Reduziert“ beim Gast nur Krits */
    const pr = S.projectiles.filter(p => p.map === m.map && Math.hypot(p.x - m.x, p.y - m.y) < NEAR).map(p => ({ x: Math.round(p.x), y: Math.round(p.y), vx: p.vx, vy: p.vy, kind: p.kind, map: p.map }));
    if (upd.length || add.length || del.length || fx.length || fl.length || pr.length) sendTo(g, { t: 'ents', map: m.map, upd, add, del, fx, fl, pr });
    if (now() - (g.selfAt || 0) > 200) { g.selfAt = now(); sendTo(g, { t: 'self', inv: m.inv, equip: m.equip, stamina: m.stamina, maxStamina: m.maxStamina, mana: m.mana, maxMana: m.maxMana, morale: m.morale, body: m.body, hp: m.hp, maxHp: m.maxHp, hotbar: m.hotbar, level: m.level, xp: m.xp, xpNext: m.xpNext, dodgeCd: m.dodgeCd, coopGold: m.coopGold || 0, attributes: m.attributes, attrPoints: m.attrPoints || 0, skills: m.skills, currentClass: m.currentClass, knownClasses: m.knownClasses, titleClass: m.titleClass, titleClasses: m.titleClasses, tgrade: m.tgrade, tree: m.tree, skillPoints: m.skillPoints || 0, abilities: m.abilities, spells: m.spells, ranks: m.ranks || null, titles: m.titles, lastHit: m.lastHitAt && now() - m.lastHitAt < 5000 ? m.lastHitId : null, hitAge: m.lastHitAt ? Math.round(now() - m.lastHitAt) : null }); }   /* E2: Ersatz-Lebensbalken beim Gast */
  }
  if (S.cine) broadcast({ t: 'cam', x: Math.round(A.R.cam.x), y: Math.round(A.R.cam.y), z: A.R.cam.zoom, text: S.cine.shots?.[S.cine.i]?.text || '' }); else if (camOn) { camOn = false; broadcast({ t: 'cam', off: 1 }); }   /* Kamerafahrt: Gäste sehen mit */
  if (S.cine) camOn = true;
  if (wAcc >= 500) { const qs = JSON.stringify([S.quests, S.contracts || [], S.track || null]); if (qs !== lastQuests) { lastQuests = qs; broadcast({ t: 'quests', q: qs }); } }   /* Aufträge und Wegpunkt für die Gäste (nur bei Änderung) */
  if (wAcc >= 500) { wAcc = 0; broadcast({ t: 'world', day: S.day, minute: S.minute, weather: S.weather, paused: !!S.paused, map: S.map, gold: S.gold, res: S.res, factions: S.factions, facRes: S.facRes, cine: S.cine ? { text: S.cine.shots[S.cine.i]?.text } : null, dlg: A.UI.dialogueOpen(), hostName: S.player.name }); }
}
// Figur ohne schwere Felder für die erste Übertragung
function lightEnt(e) { const o = {}; for (const k of Object.keys(e)) if (!HEAVY.has(k)) o[k] = e[k]; if (e.equip) o.equip = e.equip; return o; }

// ---------------------------------------------------------------- Gast
let lastCode = '', me = null, joined = false, inSeq = 0, inAcc = 0, lastIn = '';
async function join(code) {
  if (!/^[A-Z0-9]{6}$/.test(code)) return status('Der Code hat 6 Zeichen.');
  status('Verbinde …'); const Peer = await loadPeer();
  peer = new Peer(peerOpts()); await new Promise((ok, no) => { peer.on('open', ok); peer.on('error', e => no(new Error(e.type || 'Peer-Fehler'))); });
  conn = peer.connect('rotfall-' + code, { reliable: true }); lastCode = code;
  window.addEventListener('pagehide', () => { try { send({ t: 'leave' }); conn.close(); } catch (e) { /* schon zu */ } });   /* Fenster zu: sofort abmelden, damit die Figur beim Host gleich verschwindet */
  { const c0 = conn; setTimeout(() => { if (c0 === conn && !c0.open && A.S.coop?.role !== 'guest') status('Keine Verbindung zum Host. Entweder stimmt der Code nicht, der Host hat sein Spiel nicht offen — oder euer Netz sperrt direkte Verbindungen (oft in Schul- und Firmennetzen). Dann einen TURN-Server eintragen (siehe oben) oder ein anderes Netz nutzen, z. B. einen Handy-Hotspot.'); }, 20000); }
  setInterval(() => send({ t: 'ping' }), 2000);   /* Lebenszeichen auch bei der Figurenwahl und im Hintergrund (keine Bildschleife), sonst trennt der Host nach 10 s */
  conn.on('open', () => { conn.send(JSON.stringify({ t: 'hello', name: myName(), ver: VER })); status('Verbunden. Warte auf den Spielstand des Hosts …'); });
  conn.on('data', onGuestData); conn.on('close', () => { status('Verbindung beendet.'); A.UI.toast('KOOP: VERBINDUNG BEENDET', 4000); A.log('Koop: Die Verbindung zum Host ist weg. Zum Weiterspielen die Seite neu laden.', 'party'); });
  peer.on('error', e => status(e.type === 'peer-unavailable' ? 'Kein offenes Spiel mit diesem Code. Code prüfen oder den Host neu öffnen lassen.' : 'Fehler: ' + (e.type || e.message)));
}
function send(msg) { if (conn?.open) conn.send(JSON.stringify(msg)); }
function onGuestData(raw) {
  const { S } = A; let d; try { d = JSON.parse(raw); } catch (e) { return; }
  hostSeen = now(); lostWarned = false;
  if (!S.coop && ['world', 'ents', 'self', 'quests', 'cam', 'travel', 'assign'].includes(d.t)) return;   /* noch im Warteraum: Weltdaten kommen erst mit „welcome“ */
  if (d.t === 'bye') { status(d.why); A.UI.toast?.(d.why, 5000); return; }
  if (d.t === 'welcome') {
    S.coop = { role: 'guest', hostName: d.hostName, me: null, targets: {} };
    const data = JSON.parse(d.save); A.continueGame(data);   /* Welt aus dem Spielstand des Hosts bauen, ohne Speichern */
    for (const k of Object.keys(S.ents)) S.ents[k] = keepLocal(S.ents[k]);   /* Figuren, Beute und Gräber kommen vom Host; alte Kopien aus dem Stand wären Geister (beim Host längst tot oder weg) */
    A.UI.toast(`KOOP: WELT VON ${String(d.hostName).toUpperCase()}`, 3000); return; }
  if (d.t === 'lobby') { joined = false; A.coopHooks.guestTick = null; if (d.heirs || d.note) { myChoice = null; iAmReady = false; } showLobby(d); return; }   /* neu wählen: alte Wahl gilt nicht mehr */
  if (d.t === 'quests') { const [q, c, tr] = JSON.parse(d.q); S.quests = q; S.contracts = c; S.track = tr; if (A.UI.modalOpen === 'quests') A.UI.refreshModal(); return; }
  if (d.t === 'assign') { me = A.byId(d.entId); S.coop.me = d.entId; joined = true; $('coop-panel')?.classList.add('hidden');
    S.player = me; A.UI.setHudTarget(me);   /* beim Gast ist „der Spieler“ seine Figur: Häuser öffnen sich für ihn, Licht, Nebel, Inventar (I), Charakter (C) und Leiste zeigen seine Sachen */
    A.coopHooks.cmd = c => { send({ t: 'cmd', ...c }); return true; };
    $('game-canvas')?.addEventListener('mousedown', e => { if (e.button === 0) pending.atk = true; });
    A.UI.uiHooks.act = (name, args) => { send({ t: 'cmd', kind: 'act', name, args }); return true; }; A.coopHooks.guestTick = guestTick; A.coopHooks.key = guestKey; A.bindInput();
    A.UI.toast(`DU STEUERST ${me.name.toUpperCase()}`, 3000); A.log(`Koop: Du steuerst ${me.name}. WASD laufen, Maus zielen, Klick oder Leertaste angreifen, Q rollen, Umschalt decken, E aufheben (wer zuerst aufhebt, hat es), mit Leuten reden (auch Lehrer, Fraktionen, Aufträge), bei Händlern handeln, an Eingängen den Host fragen, I Gepäck, U Tausch mit dem Host, C Charakter, J Aufträge (die des Hosts), Enter schreiben. Erfahrung bekommst du wie der Held, vom Auftragsgold einen gleichen Anteil. Der Host (${S.coop.hostName}) speichert und führt Gespräche.`, 'party'); return; }
  if (d.t === 'travel') { if (S.map !== d.map) { S.map = d.map; S.ents[d.map] = keepLocal(S.ents[d.map] || []); S.coop.targets = {}; } return; }
  if (d.t === 'ents') { applyEnts(d); return; }
  if (d.t === 'cam') { S.coop.cam = d.off ? null : d; showCineText(d.off ? '' : d.text); return; }
  if (d.t === 'self') { if (!me) return; Object.assign(me, { inv: d.inv, equip: d.equip, stamina: d.stamina, maxStamina: d.maxStamina, mana: d.mana, maxMana: d.maxMana, morale: d.morale, body: d.body, hp: d.hp, maxHp: d.maxHp, hotbar: d.hotbar, level: d.level, xp: d.xp, xpNext: d.xpNext, dodgeCd: d.dodgeCd, coopGold: d.coopGold, attributes: d.attributes, attrPoints: d.attrPoints, skills: d.skills, currentClass: d.currentClass, knownClasses: d.knownClasses, titleClass: d.titleClass, titleClasses: d.titleClasses, tgrade: d.tgrade, tree: d.tree, skillPoints: d.skillPoints, abilities: d.abilities, spells: d.spells, titles: d.titles }); if (d.ranks) S.ranks = d.ranks;   /* eigene Ränge des Gasts */ guestHitBar(d); A.UI.refreshHUD(); if (['inventory', 'character'].includes(A.UI.modalOpen)) A.UI.refreshModal(me); if (A.UI.dialogueOpen() && tradeOpen) guestTrade(); return; }
  if (d.t === 'world') { Object.assign(S, { day: d.day, minute: d.minute, weather: d.weather, paused: d.paused, gold: d.gold, res: d.res, factions: d.factions }); if (d.facRes) S.facRes = d.facRes;   /* T23: Kodex „Mächte“ beim Gast */ S.coop.hostMap = d.map; S.coop.hostBusy = d.paused || d.dlg; S.coop.cineText = d.cine?.text || null; return; }
  if (d.t === 'toast') { A.UI.toast(d.text); return; }
  if (d.t === 'card') { A.nameCard?.(d.title, d.sub || '', 3200); A.sfx?.(d.snd || 'bell', 0.4, 0.8); return; }   /* E22: Ereigniskarte vom Host */
  if (d.t === 'cards') { lobbyCardsData = d.cards; drawCards($('coop-cards'), d.cards); return; }
  if (d.t === 'shop') { shopData = d; guestShop(); return; }
  if (d.t === 'dlg') { if (d.close) { if (!shopData && !tradeOpen) A.UI.closeDialogue(); return; } const npc = A.byId(d.npcId) || { name: d.name }; A.UI.dialogue(npc, d.text, d.opts.map((text, i) => ({ text, fn: () => send({ t: 'cmd', kind: 'dlg', i }) }))); return; }
  if (d.t === 'modal') { A.UI.openModal(d.name, me); return; }
  if (d.t === 'log') { A.log(d.text, d.cat); return; }
  if (d.t === 'chat') { chatLine(d.from, d.text); A.log(`${d.from}: ${d.text}`, 'party'); return; }
}
/* E2 (09.10.): Ersatz-Lebensbalken beim Gast — der Gegner, den die eigene Figur zuletzt traf, zeigt 5 s seinen Balken (wie beim Host, render.js barTarget) */
function guestHitBar(d) { const F = A.R.focus; if (!F) return; if (d.lastHit) { const e = A.byId(d.lastHit); if (e) { F.last = e; F.lastAt = now() - (d.hitAge || 0); } } }
function keepLocal(list) { const S = A.S; return list.filter(e => e.kind === 'prop' || e === S.player || S.party.includes(e.id) || (!SENT.has(e.kind) && !e.transient)); }   /* Gast: nur was der Host nie schickt */
// Gast: Warteraum. Eigenen Charakter erstellen (dieselbe Maske wie bei einer neuen Geschichte), gespeicherten weiterspielen
// oder einen Gefährten übernehmen; dann „Bereit“. Der Host startet, wenn alle bereit sind (läuft das Spiel schon: sofort).
let myChoice = null, iAmReady = false, lobbyCardsData = null;
function showLobby(d) {
  const el = $('coop-panel'); el.classList.remove('hidden'); if (d) showLobby.d = d; d = showLobby.d; if (!d) return;
  const box = $('coop-guests');
  box.innerHTML = `<h3>Warteraum bei ${esc(d.hostName)}</h3>${d.note ? `<p class="ledger">${esc(d.note)}</p>` : ''}<div id="coop-cards" class="coop-cards"></div>` +
    `<div class="ledger">Deine Wahl: <b>${myChoice ? esc(choiceText(myChoice)) : 'noch keine'}</b></div>` +
    (d.heirs ? '<div class="ledger">Deine Erben:</div>' + d.heirs.map((h, i) => `<button class="plaque" data-heir="${i}">${esc(h.name)} — ${esc(h.origin)}, Stufe ${h.level}</button>`).join('') : d.locked ? '' : `<button class="plaque" id="coop-new">Eigenen Charakter erstellen</button>`) +
    (d.saved ? `<button class="plaque" id="coop-saved">Mit ${esc(d.saved.name)} weiterspielen (Stufe ${d.saved.level})</button>` : '') +
    (d.party.length && !d.locked ? '<div class="ledger">Oder einen Gefährten des Hosts übernehmen:</div>' + d.party.map(p => `<button class="plaque" data-pick="${p.id}" ${p.taken ? 'disabled' : ''}>${esc(p.name)} — ${esc(p.prof)}, Stufe ${p.level}${p.taken ? ' (vergeben)' : ''}</button>`).join('') : '') +
    `<button class="plaque" id="coop-ready" ${myChoice ? '' : 'disabled'}>${iAmReady ? 'Doch nicht bereit' : 'Bereit'}</button>` +
    `<div class="ledger">${d.started ? 'Das Spiel läuft schon: mit „Bereit“ bist du sofort drin.' : 'Wenn alle bereit sind, startet der Host.'}</div>`;
  const choose = c => { myChoice = c; iAmReady = false; send({ t: 'choice', ...c }); showLobby(); };
  [...box.querySelectorAll('[data-heir]')].forEach(b => b.onclick = () => { const h = d.heirs[+b.dataset.heir]; showLobby.d = { ...d, heirs: null, party: [], locked: true }; choose({ mode: 'heir', i: +b.dataset.heir, name: h.name, cfg: { name: h.name, origin: '' } }); });
  if ($('coop-new')) $('coop-new').onclick = () => { el.classList.add('hidden'); A.openCreation(cfg => { el.classList.remove('hidden'); choose({ mode: 'new', cfg }); }, () => el.classList.remove('hidden'), myName()); };
  if ($('coop-saved')) $('coop-saved').onclick = () => choose({ mode: 'saved', name: d.saved.name });
  [...box.querySelectorAll('[data-pick]')].forEach(b => b.onclick = () => choose({ mode: 'companion', entId: b.dataset.pick, name: d.party.find(p => p.id === b.dataset.pick)?.name }));
  $('coop-ready').onclick = () => { iAmReady = !iAmReady; send({ t: 'ready', on: iAmReady }); showLobby(); };
  if (lobbyCardsData) drawCards($('coop-cards'), lobbyCardsData);
  status(iAmReady ? 'Bereit. Warte auf den Host …' : 'Verbunden.');
}
function applyEnts(d) {
  const { S } = A, arr = S.ents[d.map] ||= [], T = S.coop.targets;
  for (const e of d.add) { let o = arr.find(x => x.id === e.id);
    if (!o && (e.id === S.player?.id || S.party.includes(e.id))) for (const [k, l] of Object.entries(S.ents)) { const j = k === d.map ? -1 : l.findIndex(x => x.id === e.id); if (j >= 0) { o = l.splice(j, 1)[0]; arr.push(o); break; } }   /* Kartenwechsel: Held und Gruppe bleiben dasselbe Objekt, sonst zeigt das HUD alte Werte */
    if (o) Object.assign(o, e); else arr.push(o = e);
    if (e.id === S.coop.me && me !== o) { me = o; S.player = me; A.UI.setHudTarget(me); } }
  for (const u of d.upd) { const e = arr.find(x => x.id === u.id); if (!e) continue;
    for (const k of Object.keys(u)) { if (k === 'id') continue; if (k === 'status') { e.status = u.status ? u.status.split(',').map(key => ({ key, left: 9999 })) : []; continue; }
      if (k === 'x' || k === 'y') { (T[e.id] ||= {})[k] = u[k]; if (Math.abs(e[k] - u[k]) > 160) e[k] = u[k]; continue; } e[k] = u[k]; } }
  for (const id of d.del) { const i = arr.findIndex(x => x.id === id); if (i >= 0 && arr[i] !== me && arr[i] !== S.player) arr.splice(i, 1); delete T[id]; }
  for (const [x, y, type] of d.fx) A.fx(x, y, type, 3);
  { const h = me && d.fx.find(([x, y, t]) => (t === 'blood' || t === 'impact') && Math.hypot(x - me.x, y - me.y) < 520); if (h) A.sfx?.('hit', 0.6, Math.max(0.2, 1 - Math.hypot(h[0] - me.x, h[1] - me.y) / 520)); }   /* Koop 09.10.: Trefferklang beim Gast (vorher stumm), einmal je Paket */
  for (const f of d.fl) S.floats.push({ x: f.x, y: f.y, text: f.text, color: f.color, big: f.big, num: f.num, mine: f.mine, life: 900, maxLife: 900 });   /* Koop: num/mine übernehmen, sonst greift die Einstellung „Reduziert“ beim Gast nie */
  S.projectiles = d.pr.map(p => ({ ...p, life: 200 }));
}
function guestKey(k, e) {
  if (!joined) return false;
  if (k === 'i') { A.UI.openModal('inventory'); return true; }
  if (k === 'u') { guestTrade(); return true; }
  if (k === 'escape' && A.UI.dialogueOpen()) { tradeOpen = false; shopData = null; A.UI.closeDialogue(); return true; }
  if (k === 'c' || k === 'g') { A.UI.openModal(k === 'g' ? 'party' : 'character', me); return true; }
  if (k === 'enter') { A.keys.delete('enter'); openChat(t => send({ t: 'chat', text: t })); return true; }
  if (k === 'e' || k === 'q' || (k >= '0' && k <= '9')) { inSeq++; pending[k === 'e' ? 'use' : k === 'q' ? 'dodge' : 'slot'] = k === 'e' || k === 'q' ? true : (k === '0' ? 9 : +k - 1); return true; }
  if (k === 'j') { A.UI.openModal('quests'); return true; }
  if (['b', 'f', 'k', 'm', 't', 'x', 'h', 'z', 'r', 'n'].includes(k)) { if (k === 'm') { A.UI.openModal('map'); return true; } A.UI.toast('Im Koop nur der Host.', 1400); return true; }
  return false;
}
const pending = { use: false, dodge: false, slot: null, atk: false };   /* atk: ein kurzer Klick zwischen zwei Sendungen geht nicht verloren */
// Gast: Gepäck und Tausch (Taste I). Wer zuerst aufhebt, hat es; hier gibt man ab, legt an oder benutzt. Der Host führt alles aus.
let tradeOpen = false, shopData = null, shopSell = false, shopConfirm = null, tradePage = 0, hostPage = 0;   /* HB-30: Rückfrage ab Selten, Seiten im Gepäck/Tausch */
// Gast beim Händler: kaufen und verkaufen mit dem eigenen Beutel (Anteil am Auftragsgold, Verkäufe)
function guestShop() {
  const d = shopData; if (!d) return; tradeOpen = false;
  const ch = shopSell
    ? d.sell.map(s => s.price == null ? { text: `${s.name} — ${s.lock ? 'gesperrt' : 'gebunden'}, unverkäuflich`, fn: () => {} }
      : s.rare && shopConfirm !== s.idx ? { text: `Verkaufen: ${s.name} — ${s.price} Gold (selten: nochmal klicken zum Bestätigen)`, fn: () => { shopConfirm = s.idx; guestShop(); } }   /* HB-30: Rückfrage ab Selten */
      : { text: `${shopConfirm === s.idx ? 'Wirklich verkaufen' : 'Verkaufen'}: ${s.name}${s.count > 1 ? ' ×' + s.count : ''} — ${s.price} Gold`, fn: () => { shopConfirm = null; send({ t: 'cmd', kind: 'sell', npcId: d.npcId, idx: s.idx }); } })
    : d.buy.map(s => ({ text: `Kaufen: ${s.name}${s.count > 1 ? ' (' + s.count + ')' : ''} — ${s.price} Gold`, fn: () => send({ t: 'cmd', kind: 'buy', npcId: d.npcId, key: s.key }) }));
  ch.push({ text: shopSell ? 'Zum Kaufen' : 'Zum Verkaufen', fn: () => { shopSell = !shopSell; guestShop(); } }, { text: 'Gehen', fn: () => { shopData = null; A.UI.closeDialogue(); } });
  A.dialogue({ ...me, name: d.name }, `${d.name}${d.prof ? ', ' + d.prof : ''}. Dein Beutel: ${d.gold} Gold.\n${shopSell ? 'Was verkaufst du?' : 'Was kaufst du?'}`, ch);
}
function guestTrade() {
  if (!me) return; tradeOpen = true; const I = A.ITEMS, host = A.S.coop.hostName;
  const ch = [];
  if (me.coopGold > 0) ch.push({ text: `${me.coopGold} Gold an ${host} geben`, fn: () => send({ t: 'cmd', kind: 'gold' }) });
  if (tradePage * 14 >= me.inv.length) tradePage = 0; const P0 = tradePage * 14;   /* HB-30: alle Sachen über Seiten erreichbar (vorher nur die ersten 14) */
  if (me.inv.length > 14) ch.push({ text: `Weitere Sachen ▸ (Seite ${tradePage + 1} von ${Math.ceil(me.inv.length / 14)})`, fn: () => { tradePage++; guestTrade(); } });
  me.inv.slice(P0, P0 + 14).forEach((it, j) => { const idx = P0 + j, d = I[it.key] || { name: it.key }, gear = d.slot && d.slot !== 'consumable';
    ch.push({ text: `${d.name}${it.count > 1 ? ' ×' + it.count : ''} — an ${host} geben`, fn: () => send({ t: 'cmd', kind: 'give', idx }) });
    if (gear) ch.push({ text: `   ${d.name} anlegen`, fn: () => send({ t: 'cmd', kind: 'equip', idx }) });
    else if (d.use) ch.push({ text: `   ${d.name} benutzen`, fn: () => send({ t: 'cmd', kind: 'use', idx }) }); });
  ch.push({ text: 'Schließen', fn: () => { tradeOpen = false; A.UI.closeDialogue(); } });
  A.UI.dialogue(me, `Gepäck von ${me.name} · Beutel: ${me.coopGold || 0} Gold (Anteil an Auftragsgold)
Was du zuerst aufhebst (E), gehört dir. Hier gibst du Sachen oder Gold an ${host} ab.${me.inv.length > 14 ? `
(Sachen ${P0 + 1}–${Math.min(me.inv.length, P0 + 14)} von ${me.inv.length})` : ''}`, ch);
}
// Host: Tauschmenü mit einem Gast (Knopf oben rechts). Gibt Sachen aus dem Gepäck des Helden an die Gastfigur.
function hostTrade() {
  const S = A.S, I = A.ITEMS, pilots = A.partyMembers().filter(m => m.coopPilot); if (!pilots.length) return A.UI.toast('Kein Gast steuert gerade eine Figur.');
  const m = pilots[0], ch = []; if (hostPage * 16 >= S.player.inv.length) hostPage = 0; const P0 = hostPage * 16;   /* HB-30: Seiten statt nur der ersten 16 */
  if (S.player.inv.length > 16) ch.push({ text: `Weitere Sachen ▸ (Seite ${hostPage + 1} von ${Math.ceil(S.player.inv.length / 16)})`, fn: () => { hostPage++; hostTrade(); } });
  S.player.inv.slice(P0, P0 + 16).forEach((it, j) => { const idx = P0 + j, d = I[it.key] || { name: it.key };
    ch.push({ text: `${d.name}${it.count > 1 ? ' ×' + it.count : ''} an ${m.coopName} (${m.name}) geben`, fn: () => { const x = S.player.inv[idx]; if (x !== it) return hostTrade(); if (A.giveItem(m, it)) { S.player.inv.splice(idx, 1); A.log(`Du gibst ${m.coopName} ${d.name}.`, 'party'); } else A.UI.toast(`${m.name}: Tasche voll`); hostTrade(); } }); });
  if (pilots.length > 1) ch.push({ text: `Nächster Gast (${pilots[1].coopName})`, fn: () => { pilots.push(pilots.shift()); hostTrade(); } });
  ch.push({ text: 'Schließen', fn: () => A.UI.closeDialogue() });
  A.UI.dialogue(m, `Tausch mit ${m.coopName}, der ${m.name} steuert. Beutel des Gasts: ${m.coopGold || 0} Gold (Anteil an Auftragsgold, er kann ihn dir geben).
Wer Beute zuerst aufhebt, hat sie. Hier gibst du etwas ab.`, ch);
}
function guestTick(dt) {
  const { S, R } = A; if (!joined || !me) return;
  for (const [id, t] of Object.entries(S.coop.targets)) { const e = A.byId(id); if (!e) { delete S.coop.targets[id]; continue; } if (t.x != null) e.x += (t.x - e.x) * Math.min(1, dt / 80); if (t.y != null) e.y += (t.y - e.y) * Math.min(1, dt / 80); }
  A.updateFx(dt); for (const f of S.floats) f.life -= dt; S.floats = S.floats.filter(f => f.life > 0);
  for (const p of S.projectiles) { p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.life -= dt; } S.projectiles = S.projectiles.filter(p => p.life > 0);
  const V = R.view(), cc = S.coop.cam; R.cam.zoom = cc ? cc.z : R.cam.base || 1.3; const tx = cc ? cc.x : me.x - V.W / (2 * R.cam.zoom), ty = cc ? cc.y : me.y - V.H / (2 * R.cam.zoom);
  R.cam.x += (tx - R.cam.x) * Math.min(1, dt / 120); R.cam.y += (ty - R.cam.y) * Math.min(1, dt / 120);
  const m = A.MAPS[S.map]; if (m) { R.cam.x = Math.max(0, Math.min(R.cam.x, m.w * A.TS - V.W / R.cam.zoom)); R.cam.y = Math.max(0, Math.min(R.cam.y, m.h * A.TS - V.H / R.cam.zoom)); }
  inAcc += dt; if (inAcc < 33) return; inAcc = 0;
  const wp = R.screenToWorld(A.mouse.x, A.mouse.y), mv = A.moveInput(), aim = Math.round(Math.atan2(wp.y - me.y + 12, wp.x - me.x) * 100) / 100;
  const talking = A.UI.dialogueOpen(), msg = { t: 'in', seq: inSeq, mv: talking ? [0, 0] : [mv.dx, mv.dy], aim, atk: (A.mouse.down || A.keys.has(' ') || pending.atk) && !A.UI.modalOpen && !A.UI.dialogueOpen() ? 1 : 0, guard: A.keys.has('shift') ? 1 : 0, dodge: pending.dodge ? 1 : 0, use: pending.use ? 1 : 0, slot: pending.slot };
  pending.dodge = false; pending.use = false; pending.slot = null; pending.atk = false;
  const s = JSON.stringify(msg); if (s !== lastIn || msg.seq !== lastSeq || A.keys.size || A.mouse.down || now() - lastSent > 250) { lastIn = s; lastSeq = msg.seq; lastSent = now(); send(msg); }   /* gehaltene Maustaste und Stillstand: spätestens alle 250 ms neu schicken, sonst übernimmt beim Host nach 1 s die KI */
  if (now() - hostSeen > 10000 && !lostWarned) { lostWarned = true; A.UI.toast('KOOP: HOST ANTWORTET NICHT', 5000); A.log('Koop: Seit 10 Sekunden kommt nichts vom Host. Ist sein Fenster zu? Zum Weiterspielen die Seite neu laden.', 'party'); }
  A.UI.refreshHUD(); A.updatePrompt();
  if (S.map === 'world' && now() - (revealAt || 0) > 500) { revealAt = now(); A.revealAround(me.x / A.TS | 0, me.y / A.TS | 0, A.B.fogR(me)); }   /* Karte deckt sich beim Gast um seine Figur auf */
  mateArrows((S.ents[S.map] || []).filter(e => e !== me && e.alive && (e.kind === 'player' || e.coopPilot)));   /* E-Hinweise (Aufheben, Händler, Eingang) aus Sicht der eigenen Figur */
  const el = $('coop-hud') || (() => { const d = document.createElement('div'); d.id = 'coop-hud'; d.className = 'ledger'; d.style.cssText = 'position:fixed;right:12px;top:52px;z-index:30;font-size:12px;color:#c9bfa6;text-align:right'; document.body.appendChild(d); return d; })();
  el.textContent = `Koop: Gast bei ${S.coop.hostName} · Code ${lastCode}${S.coop.hostBusy ? ' · Host ist im Menü oder Gespräch' : ''}${S.coop.cineText ? ' · Kamerafahrt läuft' : ''}`;
}
let revealAt = 0, lastSeq = -1, lastSent = 0, hostSeen = now(), lostWarned = false;
// Pfeil am Bildrand zu jedem Mitspieler, der gerade nicht zu sehen ist (Name und Entfernung dabei)
const arrows = new Map();
function mateArrows(list) {
  const R = A.R, V = R.view(), z = R.cam.zoom || 1, seen = new Set();
  for (const e of list) {
    const sx = (e.x - R.cam.x) * z, sy = (e.y - 20 - R.cam.y) * z; if (sx > 0 && sx < V.W && sy > 0 && sy < V.H) continue;
    seen.add(e.id); let el = arrows.get(e.id);
    if (!el) { el = document.createElement('div'); el.className = 'coop-arrow'; el.style.cssText = 'position:fixed;z-index:35;pointer-events:none;font:12px Spectral,serif;color:#f0e6cd;text-shadow:0 1px 3px #000;text-align:center;transform:translate(-50%,-50%)'; document.body.appendChild(el); arrows.set(e.id, el); }
    const cx = V.W / 2, cy = V.H / 2, a = Math.atan2(sy - cy, sx - cx), k = Math.min((V.W / 2 - 40) / Math.abs(Math.cos(a) || 1e-6), (V.H / 2 - 40) / Math.abs(Math.sin(a) || 1e-6));
    const r = $('game-canvas')?.getBoundingClientRect() || { left: 0, top: 0 }, d = Math.round(Math.hypot(e.x - A.S.player.x, e.y - A.S.player.y) / 32);
    el.style.left = (r.left + cx + Math.cos(a) * k) + 'px'; el.style.top = (r.top + cy + Math.sin(a) * k) + 'px';
    el.innerHTML = `<div style="font-size:22px;color:#e8c070;transform:rotate(${a}rad)">➤</div>${esc(e.coopName || e.name)} · ${d} m`;
  }
  for (const [id, el] of arrows) if (!seen.has(id)) { el.remove(); arrows.delete(id); }
}
// Text der Kamerafahrt beim Gast (unten mittig, wie beim Host)
function showCineText(t) {
  let el = $('coop-cine'); if (!el) { el = document.createElement('div'); el.id = 'coop-cine'; el.style.cssText = 'position:fixed;left:50%;bottom:18%;transform:translateX(-50%);max-width:70vw;z-index:40;font:18px Spectral,serif;color:#f0e6cd;text-align:center;text-shadow:0 2px 6px #000;pointer-events:none'; document.body.appendChild(el); }
  el.textContent = t || '';
}

// Für Tests ohne Netz (?dev): der Host bekommt einen Gast im selben Browser, der über eine Attrappe verbunden ist
export function fakeGuest(api, entId) {
  A = api; const S = A.S; S.coop ||= { role: 'host', code: 'TEST00', guests: {}, bytes: 0, t0: now() };
  A.coopHooks.hostTick = hostTick; A.coopHooks.remote = remoteControl; A.coopHooks.guestAct = guestAct; A.coopHooks.card = (title, sub, snd) => broadcast({ t: 'card', title, sub, snd });
  const c = { peer: 'fake', open: true, sent: [], send(s) { c.sent.push(s); if (c.sent.length > 50) c.sent.shift(); }, close() {} };
  S.coop.guests.fake = { id: 'fake', conn: c, name: 'Attrappe', entId, inp: null, at: 0, known: new Set(), last: {}, map: null, selfAt: 0 };
  const m = A.byId(entId); if (m) m.coopPilot = 'fake';
  return { conn: c, input: inp => { const g = S.coop.guests.fake; g.inp = { seq: (g.inp?.seq || 0) + 1, ...inp }; g.at = now(); }, drop: () => dropGuest('fake'), send: d => onHostData(c, JSON.stringify(d)) };   /* send: Nachricht wie vom Gast (cmd, chat, pick) */
}
export const version = VER;
export const peerState = () => ({ id: peer?.id, open: peer?.open, disconnected: peer?.disconnected, destroyed: peer?.destroyed, conn: conn?.open });   /* Fehlersuche (?dev) */
