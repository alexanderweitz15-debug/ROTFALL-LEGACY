// Netzwerk-Koop (Roadmap K2, docs/PLAN_COOP.md). Wird nur geladen, wenn der Spieler auf dem Titelbildschirm „Koop (Netzwerk)“ drückt.
// Grundsatz: Der Host rechnet die ganze Welt wie im Einzelspieler. Der Gast schickt nur seine Eingaben und bekommt zurück, was um
// seine Figur herum passiert. Der Gast erstellt vorher im Warteraum seinen eigenen Charakter (oder spielt seinen gespeicherten weiter,
// oder übernimmt einen Gefährten) und drückt „Bereit“; der Host startet. Die Figur ist ein Gruppenmitglied mit m.coopPilot = Peer-ID. Verbindung über
// WebRTC mit PeerJS (öffentlicher Vermittler, die Daten laufen direkt zwischen den Browsern). Der Gast speichert nie.
// Nachrichten: siehe docs/PLAN_COOP.md §3.2. Alles hier ruft nur bestehende Spielfunktionen über das API-Objekt aus game.js auf.

let A = null;                                   // API aus game.js (S, R, UI, Funktionen)
let peer = null, conn = null, muteLog = false;   /* muteLog: Chatzeilen gehen als 'chat', nicht zusätzlich als 'log' */                   // PeerJS
const VER = 21;                                 // muss zu ?v= in index.html passen; Host und Gast müssen gleich sein
const PEERJS = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
const NEAR = 1400;                              // px um die Gastfigur, die der Host schickt
const DYN = ['x', 'y', 'vx', 'vy', 'facing', 'aim', 'hp', 'maxHp', 'downed', 'alive', 'swing', 'swingDur', 'act', 'stagger', 'cover', 'telegraph', 'mounted', 'fleeing', 'angry', 'aiState', 'hDir', 'come'];
const SENT = new Set(['enemy', 'npc', 'player', 'caravan', 'mount', 'item', 'grave']);   /* Props entstehen beim Gast aus derselben Generierung */
const HEAVY = new Set(['inv', 'memories', 'plan', 'path', 'schedule', 'dmgBy', 'rel', 'talk', 'lastInput', 'hitIds', 'cooldowns', 'tree', 'spells', 'spellUse', 'hotbar']);
const rnd6 = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');

function loadPeer() {
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
      <div class="coop-row"><button id="coop-host" class="plaque">Spiel öffnen (Host)</button><span class="ledger">nutzt deinen Spielstand</span></div>
      <div class="coop-row"><input id="coop-code" placeholder="Code" maxlength="6" style="text-transform:uppercase"><button id="coop-join" class="plaque">Beitreten (Gast)</button></div>
      <div id="coop-status" class="ledger">Bereit.</div>
      <div id="coop-guests"></div>
      <button id="coop-close" class="plaque">Schließen</button>
    </div>`;
    document.body.appendChild(el);
    $('coop-close').onclick = () => { el.classList.add('hidden'); };
    $('coop-host').onclick = () => host().catch(e => status('Fehler: ' + e.message));
    $('coop-join').onclick = () => join($('coop-code').value.trim().toUpperCase()).catch(e => status('Fehler: ' + e.message));
  }
  el.classList.remove('hidden');
}
const myName = () => { const n = ($('coop-name')?.value || 'Gast').trim().slice(0, 14) || 'Gast'; localStorage.setItem('rotfall.coop.name', n); return n; };

// ---------------------------------------------------------------- Host
async function host() {
  const { S } = A;
  if (!A.isRunning() && !A.hasSave()) return status('Kein Spielstand. Erst eine Geschichte anfangen, dann Koop öffnen.');
  status('Verbinde mit dem Vermittler …');
  const Peer = await loadPeer(); const code = rnd6();
  peer = new Peer('rotfall-' + code, { debug: 0 });
  await new Promise((ok, no) => { peer.on('open', ok); peer.on('error', e => no(new Error(e.type || 'Peer-Fehler'))); });
  S.coop = { role: 'host', code, guests: {}, bytes: 0, t0: now() };
  A.coopHooks.hostTick = hostTick; A.coopHooks.remote = remoteControl; A.coopHooks.guestAct = guestAct;
  A.coopHooks.key = k => { if (k !== 'enter' || A.UI.dialogueOpen() || A.UI.modalOpen) return false; const t = window.prompt('Nachricht an die Gäste:'); if (t) { muteLog = true; A.log(`${S.player.name}: ${t.slice(0, 200)}`, 'party'); muteLog = false; broadcast({ t: 'chat', from: S.player.name, text: t.slice(0, 200) }); } A.keys.delete('enter'); return true; };
  A.onLog(e => { if (!muteLog) broadcast({ t: 'log', text: e.text, cat: e.cat }); });
  setInterval(() => { if (document.hidden) A.stepHidden(); }, 50);
  setInterval(() => { if (A.S.paused) broadcast({ t: 'ping' }); }, 2000);   /* Welt steht (Todesbildschirm): Lebenszeichen, sonst meldet der Gast „Host antwortet nicht“ */
  { const b = document.createElement('button'); b.id = 'coop-hud'; b.className = 'plaque'; b.textContent = 'Koop: Tauschen'; b.title = 'Gegenstände an einen Gast geben; sein Goldanteil und seine Beute'; b.style.cssText = 'position:fixed;right:12px;top:52px;z-index:30;font-size:12px;padding:4px 10px'; b.onclick = hostTrade; document.body.appendChild(b); }   /* Host-Fenster im Hintergrund: Welt läuft (gedrosselt) weiter, siehe game.js stepHidden */
  peer.on('disconnected', () => setTimeout(() => { if (!peer.destroyed && peer.disconnected) try { peer.reconnect(); } catch (e) { /* nächster Versuch beim nächsten Abbruch */ } }, 1500));   /* Vermittler weg (Netz-Schluckauf): sonst finden neue Gäste den Code nie wieder */
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
    `<div class="coop-lobby"><div>★ ${esc(S.player?.name || myName())} (Host) — bereit</div>` +
    G.map(g => `<div>${g.ready ? '✔' : '…'} ${esc(g.name)} — ${g.choice ? esc(choiceText(g.choice)) : 'wählt noch'}${g.ready ? ' — bereit' : ''}</div>`).join('') + '</div>' +
    (S.coop.started ? '<button class="plaque" id="coop-back">Weiterspielen</button>' : `<button class="plaque" id="coop-start" ${all ? '' : 'disabled'}>Spiel starten${G.length ? '' : ' (allein, Gäste können später dazukommen)'}</button>`);
  if ($('coop-start')) $('coop-start').onclick = startCoop;
  if ($('coop-back')) $('coop-back').onclick = () => $('coop-panel').classList.add('hidden');
}
const esc = t => String(t).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
function choiceText(c) { return c.mode === 'new' ? `neuer Charakter „${c.cfg?.name}“ (${A.ORIGINS[c.cfg?.origin]?.name || 'Wanderer'})` : c.mode === 'saved' ? `spielt „${c.name}“ weiter` : `übernimmt ${c.name}`; }
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
  if (c.mode === 'new') { const old = S.coopHeroes?.[g.name]; if (old) delete S.coopHeroes[g.name]; m = A.makeGuestHero(c.cfg, g.name); }
  else if (c.mode === 'saved') m = A.unparkCoopHero(g.name);
  else { m = A.byId(c.entId); if (!m || !S.party.includes(m.id) || !m.alive || (m.coopPilot && m.coopPilot !== g.id)) m = null; }
  if (!m) { g.ready = false; g.choice = null; sendLobby(g, 'Diese Wahl geht nicht mehr. Bitte neu wählen.'); hostLobby(); return; }
  if (!m.hotbar?.length) m.hotbar = A.GUEST_BAR.map(key => ({ type: 'item', key }));
  m.coopPilot = g.id; m.coopName = g.name; g.entId = m.id; g.known = new Set(); g.map = null; g.seen = now();
  sendTo(g, { t: 'welcome', save: A.saveData(), hostName: S.player.name }); sendTo(g, { t: 'assign', entId: m.id });
  A.log(`Koop: ${g.name} ist im Spiel als ${m.name}.`, 'party'); A.UI.toast(`${g.name.toUpperCase()} IST IM SPIEL`, 2400); hostLobby();
}
function sendLobby(g, note) {
  const S = A.S, saved = S.coopHeroes?.[g.name];
  sendTo(g, { t: 'lobby', hostName: S.player?.name || myName(), note: note || null, started: !!S.coop.started, party: partyList().filter(p => !A.byId(p.id)?.coopHero),
    saved: saved && saved.alive ? { name: saved.name, level: saved.level, prof: saved.prof } : null });
}
function broadcast(msg) { const G = A.S.coop?.guests; if (!G) return; const s = JSON.stringify(msg); for (const g of Object.values(G)) { try { g.conn.send(s); A.S.coop.bytes += s.length; } catch (e) { /* Verbindung tot: dropGuest kommt über close */ } } }
function sendTo(g, msg) { const s = typeof msg === 'string' ? msg : JSON.stringify(msg); try { g.conn.send(s); A.S.coop.bytes += s.length; } catch (e) { /* siehe oben */ } }
function partyList() { return (A.S.player ? A.partyMembers() : []).filter(m => m.alive && m.kind === 'npc').map(m => ({ id: m.id, name: m.name, prof: m.prof, level: m.level, taken: !!m.coopPilot })); }
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
    g.choice = d.mode === 'new' ? { mode: 'new', cfg: { name: String(d.cfg?.name || g.name).slice(0, 18), origin: A.ORIGINS[d.cfg?.origin] ? d.cfg.origin : 'wanderer', pal: d.cfg?.pal, build: d.cfg?.build } }
      : d.mode === 'saved' && S.coopHeroes?.[g.name] ? { mode: 'saved', name: S.coopHeroes[g.name].name }
      : m ? { mode: 'companion', entId: m.id, name: m.name } : null;
    g.ready = false; hostLobby(); return; }
  if (d.t === 'ready') { if (g.entId) return; g.ready = !!d.on && !!g.choice; hostLobby(); if (g.ready && S.coop.started) admit(g); return; }
  if (d.t === 'ping') return;
  if (d.t === 'in') { g.inp = d; g.at = now(); return; }
  if (d.t === 'cmd') { const m = A.byId(g.entId); if (!m) return; guestCommand(m, d, g); return; }
  if (d.t === 'chat') { muteLog = true; A.log(`${g.name}: ${String(d.text).slice(0, 200)}`, 'party'); muteLog = false; broadcast({ t: 'chat', from: g.name, text: String(d.text).slice(0, 200) }); return; }
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
  else if (d.kind === 'gold' && (m.coopGold || 0) > 0) { A.S.gold += m.coopGold; A.log(`${g.name} gibt dir ${m.coopGold} Gold.`, 'party'); m.coopGold = 0; }
  g.selfAt = 0;   /* Selbst-Zustand sofort neu schicken */
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
  sendTo(g, { t: 'toast', text: `${t.name}: Gespräche führt ${S.player.name}. Händler kannst du selbst ansprechen.` }); return { kind: 'talk' };
}
function sendShop(m, g, npc) {
  const I = A.ITEMS, buy = A.shopStock(npc).filter(s => s.count >= 1).slice(0, 16).map(s => ({ key: s.key, count: s.count, name: I[s.key].name, price: A.price(s.key, true, npc) }));
  const sell = m.inv.map((s, idx) => ({ idx, name: I[s.key]?.name || s.key, count: s.count || 1, price: I[s.key]?.bound ? null : A.price(s.key, false, npc, s) }));
  g.shopNpc = npc.id; sendTo(g, { t: 'shop', npcId: npc.id, name: npc.name, prof: npc.prof, gold: m.coopGold || 0, buy, sell });
}
function guestShopDeal(m, g, d) {
  const S = A.S, I = A.ITEMS, npc = A.byId(d.npcId); if (!npc || npc.id !== g.shopNpc || A.shopRefusal(npc) || A.dist(npc, m) > 140) return sendTo(g, { t: 'toast', text: 'Der Händler ist nicht mehr da.' });
  if (d.kind === 'buy') {
    const it = I[d.key]; if (!it) return; const c = A.price(d.key, true, npc); if ((m.coopGold || 0) < c) return sendTo(g, { t: 'toast', text: 'Zu wenig Gold im Beutel.' });
    if (it.good) { const town = S.towns[A.ecoTown(npc)]; if (!town || town.stock[d.key] < 1 || !A.addItem(m, d.key, 1)) return; town.stock[d.key] -= 1; }
    else { const s = (npc._stock || []).find(x => x.key === d.key); if (!s || !A.addItem(m, d.key, 1)) return; s.count--; if (s.count <= 0) npc._stock.splice(npc._stock.indexOf(s), 1); }
    m.coopGold -= c; A.log(`${g.name} kauft ${it.name} für ${c} Gold.`, 'economy');
  } else {
    const s = m.inv[d.idx]; if (!s || I[s.key]?.bound) return; const c = A.price(s.key, false, npc, s);
    if ((s.count || 1) > 1) s.count--; else m.inv.splice(d.idx, 1);
    if (I[s.key].good && A.ecoTown(npc)) S.towns[A.ecoTown(npc)].stock[s.key] += 1;
    m.coopGold = (m.coopGold || 0) + c; A.log(`${g.name} verkauft ${I[s.key].name} für ${c} Gold.`, 'economy');
  }
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
  for (const [id, g] of Object.entries(G)) if (now() - (g.seen || now()) > 10000) { try { g.conn.close(); } catch (e) { /* schon zu */ } dropGuest(id); }   /* 10 s ohne Lebenszeichen: Gast gilt als getrennt */
  for (const g of Object.values(G)) { if (g.entId) { const m = A.byId(g.entId); if (m) { m.dodgeCd = Math.max(0, (m.dodgeCd || 0) - dt); m.landT ??= 0; } } }
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
      if (n) upd.push(u);
    }
    const del = [...g.known].filter(id => !seen.has(id)); for (const id of del) { g.known.delete(id); delete g.last[id]; }
    const fx = S.fx.filter(f => f.maxLife - f.life < 60 && Math.hypot(f.x - m.x, f.y - m.y) < NEAR).slice(0, 40).map(f => [Math.round(f.x), Math.round(f.y), f.type]);
    const fl = S.floats.filter(f => (f.maxLife || 900) - f.life < 60 && Math.hypot(f.x - m.x, f.y - m.y) < NEAR).slice(0, 12).map(f => ({ x: f.x, y: f.y, text: f.text, color: f.color, big: f.big }));
    const pr = S.projectiles.filter(p => p.map === m.map && Math.hypot(p.x - m.x, p.y - m.y) < NEAR).map(p => ({ x: Math.round(p.x), y: Math.round(p.y), vx: p.vx, vy: p.vy, kind: p.kind, map: p.map }));
    if (upd.length || add.length || del.length || fx.length || fl.length || pr.length) sendTo(g, { t: 'ents', map: m.map, upd, add, del, fx, fl, pr });
    if (now() - (g.selfAt || 0) > 200) { g.selfAt = now(); sendTo(g, { t: 'self', inv: m.inv, equip: m.equip, stamina: m.stamina, maxStamina: m.maxStamina, mana: m.mana, maxMana: m.maxMana, morale: m.morale, body: m.body, hp: m.hp, maxHp: m.maxHp, hotbar: m.hotbar, level: m.level, xp: m.xp, xpNext: m.xpNext, dodgeCd: m.dodgeCd, coopGold: m.coopGold || 0, attributes: m.attributes, attrPoints: m.attrPoints || 0, skills: m.skills }); }
  }
  if (S.cine) broadcast({ t: 'cam', x: Math.round(A.R.cam.x), y: Math.round(A.R.cam.y), z: A.R.cam.zoom, text: S.cine.shots?.[S.cine.i]?.text || '' }); else if (camOn) { camOn = false; broadcast({ t: 'cam', off: 1 }); }   /* Kamerafahrt: Gäste sehen mit */
  if (S.cine) camOn = true;
  if (wAcc >= 500) { const qs = JSON.stringify([S.quests, S.contracts || [], S.track || null]); if (qs !== lastQuests) { lastQuests = qs; broadcast({ t: 'quests', q: qs }); } }   /* Aufträge und Wegpunkt für die Gäste (nur bei Änderung) */
  if (wAcc >= 500) { wAcc = 0; broadcast({ t: 'world', day: S.day, minute: S.minute, weather: S.weather, paused: !!S.paused, map: S.map, gold: S.gold, res: S.res, factions: S.factions, cine: S.cine ? { text: S.cine.shots[S.cine.i]?.text } : null, dlg: A.UI.dialogueOpen(), hostName: S.player.name }); }
}
// Figur ohne schwere Felder für die erste Übertragung
function lightEnt(e) { const o = {}; for (const k of Object.keys(e)) if (!HEAVY.has(k)) o[k] = e[k]; if (e.equip) o.equip = e.equip; return o; }

// ---------------------------------------------------------------- Gast
let me = null, joined = false, inSeq = 0, inAcc = 0, lastIn = '';
async function join(code) {
  if (!/^[A-Z0-9]{6}$/.test(code)) return status('Der Code hat 6 Zeichen.');
  status('Verbinde …'); const Peer = await loadPeer();
  peer = new Peer({ debug: 0 }); await new Promise((ok, no) => { peer.on('open', ok); peer.on('error', e => no(new Error(e.type || 'Peer-Fehler'))); });
  conn = peer.connect('rotfall-' + code, { reliable: true });
  { const c0 = conn; setTimeout(() => { if (c0 === conn && !c0.open && A.S.coop?.role !== 'guest') status('Keine Antwort vom Host. Code prüfen; der Host muss sein Spiel offen haben. Nochmal „Beitreten“ drücken.'); }, 20000); }
  setInterval(() => send({ t: 'ping' }), 2000);   /* Lebenszeichen auch bei der Figurenwahl und im Hintergrund (keine Bildschleife), sonst trennt der Host nach 10 s */
  conn.on('open', () => { conn.send(JSON.stringify({ t: 'hello', name: myName(), ver: VER })); status('Verbunden. Warte auf den Spielstand des Hosts …'); });
  conn.on('data', onGuestData); conn.on('close', () => { status('Verbindung beendet.'); A.UI.toast('KOOP: VERBINDUNG BEENDET', 4000); A.log('Koop: Die Verbindung zum Host ist weg. Zum Weiterspielen die Seite neu laden.', 'party'); });
  peer.on('error', e => status(e.type === 'peer-unavailable' ? 'Kein offenes Spiel mit diesem Code. Code prüfen oder den Host neu öffnen lassen.' : 'Fehler: ' + (e.type || e.message)));
}
function send(msg) { if (conn?.open) conn.send(JSON.stringify(msg)); }
function onGuestData(raw) {
  const { S } = A; let d; try { d = JSON.parse(raw); } catch (e) { return; }
  hostSeen = now(); lostWarned = false;
  if (d.t === 'bye') { status(d.why); A.UI.toast?.(d.why, 5000); return; }
  if (d.t === 'welcome') {
    S.coop = { role: 'guest', hostName: d.hostName, me: null, targets: {} };
    const data = JSON.parse(d.save); A.continueGame(data);   /* Welt aus dem Spielstand des Hosts bauen, ohne Speichern */
    for (const k of Object.keys(S.ents)) S.ents[k] = keepLocal(S.ents[k]);   /* Figuren, Beute und Gräber kommen vom Host; alte Kopien aus dem Stand wären Geister (beim Host längst tot oder weg) */
    A.UI.toast(`KOOP: WELT VON ${String(d.hostName).toUpperCase()}`, 3000); return; }
  if (d.t === 'lobby') { joined = false; A.coopHooks.guestTick = null; showLobby(d); return; }
  if (d.t === 'quests') { const [q, c, tr] = JSON.parse(d.q); S.quests = q; S.contracts = c; S.track = tr; if (A.UI.modalOpen === 'quests') A.UI.refreshModal(); return; }
  if (d.t === 'assign') { me = A.byId(d.entId); S.coop.me = d.entId; joined = true; $('coop-panel')?.classList.add('hidden');
    S.player = me; A.UI.setHudTarget(me);   /* beim Gast ist „der Spieler“ seine Figur: Häuser öffnen sich für ihn, Licht, Nebel, Inventar (I), Charakter (C) und Leiste zeigen seine Sachen */
    A.coopHooks.cmd = c => { send({ t: 'cmd', ...c }); return true; }; A.coopHooks.guestTick = guestTick; A.coopHooks.key = guestKey; A.bindInput();
    A.UI.toast(`DU STEUERST ${me.name.toUpperCase()}`, 3000); A.log(`Koop: Du steuerst ${me.name}. WASD laufen, Maus zielen, Klick oder Leertaste angreifen, Q rollen, Umschalt decken, E aufheben (wer zuerst aufhebt, hat es), bei Händlern handeln, an Eingängen den Host fragen, I Gepäck, U Tausch mit dem Host, C Charakter, J Aufträge (die des Hosts), Enter schreiben. Erfahrung bekommst du wie der Held, vom Auftragsgold einen gleichen Anteil. Der Host (${S.coop.hostName}) speichert und führt Gespräche.`, 'party'); return; }
  if (d.t === 'travel') { if (S.map !== d.map) { S.map = d.map; S.ents[d.map] = keepLocal(S.ents[d.map] || []); S.coop.targets = {}; } return; }
  if (d.t === 'ents') { applyEnts(d); return; }
  if (d.t === 'cam') { S.coop.cam = d.off ? null : d; showCineText(d.off ? '' : d.text); return; }
  if (d.t === 'self') { if (!me) return; Object.assign(me, { inv: d.inv, equip: d.equip, stamina: d.stamina, maxStamina: d.maxStamina, mana: d.mana, maxMana: d.maxMana, morale: d.morale, body: d.body, hp: d.hp, maxHp: d.maxHp, hotbar: d.hotbar, level: d.level, xp: d.xp, xpNext: d.xpNext, dodgeCd: d.dodgeCd, coopGold: d.coopGold, attributes: d.attributes, attrPoints: d.attrPoints, skills: d.skills }); A.UI.refreshHUD(); if (['inventory', 'character'].includes(A.UI.modalOpen)) A.UI.refreshModal(me); if (A.UI.dialogueOpen() && tradeOpen) guestTrade(); return; }
  if (d.t === 'world') { Object.assign(S, { day: d.day, minute: d.minute, weather: d.weather, paused: d.paused, gold: d.gold, res: d.res, factions: d.factions }); S.coop.hostMap = d.map; S.coop.hostBusy = d.paused || d.dlg; S.coop.cineText = d.cine?.text || null; return; }
  if (d.t === 'toast') { A.UI.toast(d.text); return; }
  if (d.t === 'shop') { shopData = d; guestShop(); return; }
  if (d.t === 'log') { A.log(d.text, d.cat); return; }
  if (d.t === 'chat') { A.log(`${d.from}: ${d.text}`, 'party'); A.UI.toast(`${d.from}: ${d.text}`, 3500); return; }
}
function keepLocal(list) { const S = A.S; return list.filter(e => e.kind === 'prop' || e === S.player || S.party.includes(e.id) || (!SENT.has(e.kind) && !e.transient)); }   /* Gast: nur was der Host nie schickt */
// Gast: Warteraum. Eigenen Charakter erstellen (dieselbe Maske wie bei einer neuen Geschichte), gespeicherten weiterspielen
// oder einen Gefährten übernehmen; dann „Bereit“. Der Host startet, wenn alle bereit sind (läuft das Spiel schon: sofort).
let myChoice = null, iAmReady = false;
function showLobby(d) {
  const el = $('coop-panel'); el.classList.remove('hidden'); if (d) showLobby.d = d; d = showLobby.d; if (!d) return;
  const box = $('coop-guests');
  box.innerHTML = `<h3>Warteraum bei ${esc(d.hostName)}</h3>${d.note ? `<p class="ledger">${esc(d.note)}</p>` : ''}` +
    `<div class="ledger">Deine Wahl: <b>${myChoice ? esc(choiceText(myChoice)) : 'noch keine'}</b></div>` +
    `<button class="plaque" id="coop-new">Eigenen Charakter erstellen</button>` +
    (d.saved ? `<button class="plaque" id="coop-saved">Mit ${esc(d.saved.name)} weiterspielen (Stufe ${d.saved.level})</button>` : '') +
    (d.party.length ? '<div class="ledger">Oder einen Gefährten des Hosts übernehmen:</div>' + d.party.map(p => `<button class="plaque" data-pick="${p.id}" ${p.taken ? 'disabled' : ''}>${esc(p.name)} — ${esc(p.prof)}, Stufe ${p.level}${p.taken ? ' (vergeben)' : ''}</button>`).join('') : '') +
    `<button class="plaque" id="coop-ready" ${myChoice ? '' : 'disabled'}>${iAmReady ? 'Doch nicht bereit' : 'Bereit'}</button>` +
    `<div class="ledger">${d.started ? 'Das Spiel läuft schon: mit „Bereit“ bist du sofort drin.' : 'Wenn alle bereit sind, startet der Host.'}</div>`;
  const choose = c => { myChoice = c; iAmReady = false; send({ t: 'choice', ...c }); showLobby(); };
  $('coop-new').onclick = () => { el.classList.add('hidden'); A.openCreation(cfg => { el.classList.remove('hidden'); choose({ mode: 'new', cfg }); }, () => el.classList.remove('hidden'), myName()); };
  if ($('coop-saved')) $('coop-saved').onclick = () => choose({ mode: 'saved', name: d.saved.name });
  [...box.querySelectorAll('[data-pick]')].forEach(b => b.onclick = () => choose({ mode: 'companion', entId: b.dataset.pick, name: d.party.find(p => p.id === b.dataset.pick)?.name }));
  $('coop-ready').onclick = () => { iAmReady = !iAmReady; send({ t: 'ready', on: iAmReady }); showLobby(); };
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
  for (const f of d.fl) S.floats.push({ x: f.x, y: f.y, text: f.text, color: f.color, big: f.big, life: 900, maxLife: 900 });
  S.projectiles = d.pr.map(p => ({ ...p, life: 200 }));
}
function guestKey(k, e) {
  if (!joined) return false;
  if (k === 'i') { A.UI.openModal('inventory'); return true; }
  if (k === 'u') { guestTrade(); return true; }
  if (k === 'escape' && A.UI.dialogueOpen()) { tradeOpen = false; shopData = null; A.UI.closeDialogue(); return true; }
  if (k === 'c' || k === 'g') { A.UI.openModal(k === 'g' ? 'party' : 'character', me); return true; }
  if (k === 'enter') { const t = window.prompt('Nachricht an den Host:'); A.keys.delete('enter'); if (t) send({ t: 'chat', text: t.slice(0, 200) }); return true; }
  if (k === 'e' || k === 'q' || (k >= '0' && k <= '9')) { inSeq++; pending[k === 'e' ? 'use' : k === 'q' ? 'dodge' : 'slot'] = k === 'e' || k === 'q' ? true : (k === '0' ? 9 : +k - 1); return true; }
  if (k === 'j') { A.UI.openModal('quests'); return true; }
  if (['b', 'f', 'k', 'm', 't', 'x', 'h', 'z', 'r', 'n'].includes(k)) { if (k === 'm') { A.UI.openModal('map'); return true; } A.UI.toast('Im Koop nur der Host.', 1400); return true; }
  return false;
}
const pending = { use: false, dodge: false, slot: null };
// Gast: Gepäck und Tausch (Taste I). Wer zuerst aufhebt, hat es; hier gibt man ab, legt an oder benutzt. Der Host führt alles aus.
let tradeOpen = false, shopData = null, shopSell = false;
// Gast beim Händler: kaufen und verkaufen mit dem eigenen Beutel (Anteil am Auftragsgold, Verkäufe)
function guestShop() {
  const d = shopData; if (!d) return; tradeOpen = false;
  const ch = shopSell
    ? d.sell.map(s => s.price == null ? { text: `${s.name} — gebunden, unverkäuflich`, fn: () => {} } : { text: `Verkaufen: ${s.name}${s.count > 1 ? ' ×' + s.count : ''} — ${s.price} Gold`, fn: () => send({ t: 'cmd', kind: 'sell', npcId: d.npcId, idx: s.idx }) })
    : d.buy.map(s => ({ text: `Kaufen: ${s.name}${s.count > 1 ? ' (' + s.count + ')' : ''} — ${s.price} Gold`, fn: () => send({ t: 'cmd', kind: 'buy', npcId: d.npcId, key: s.key }) }));
  ch.push({ text: shopSell ? 'Zum Kaufen' : 'Zum Verkaufen', fn: () => { shopSell = !shopSell; guestShop(); } }, { text: 'Gehen', fn: () => { shopData = null; A.UI.closeDialogue(); } });
  A.dialogue({ ...me, name: d.name }, `${d.name}${d.prof ? ', ' + d.prof : ''}. Dein Beutel: ${d.gold} Gold.\n${shopSell ? 'Was verkaufst du?' : 'Was kaufst du?'}`, ch);
}
function guestTrade() {
  if (!me) return; tradeOpen = true; const I = A.ITEMS, host = A.S.coop.hostName;
  const ch = [];
  if (me.coopGold > 0) ch.push({ text: `${me.coopGold} Gold an ${host} geben`, fn: () => send({ t: 'cmd', kind: 'gold' }) });
  me.inv.slice(0, 14).forEach((it, idx) => { const d = I[it.key] || { name: it.key }, gear = d.slot && d.slot !== 'consumable';
    ch.push({ text: `${d.name}${it.count > 1 ? ' ×' + it.count : ''} — an ${host} geben`, fn: () => send({ t: 'cmd', kind: 'give', idx }) });
    if (gear) ch.push({ text: `   ${d.name} anlegen`, fn: () => send({ t: 'cmd', kind: 'equip', idx }) });
    else if (d.use) ch.push({ text: `   ${d.name} benutzen`, fn: () => send({ t: 'cmd', kind: 'use', idx }) }); });
  ch.push({ text: 'Schließen', fn: () => { tradeOpen = false; A.UI.closeDialogue(); } });
  A.UI.dialogue(me, `Gepäck von ${me.name} · Beutel: ${me.coopGold || 0} Gold (Anteil an Auftragsgold)
Was du zuerst aufhebst (E), gehört dir. Hier gibst du Sachen oder Gold an ${host} ab.${me.inv.length > 14 ? `
(Nur die ersten 14 von ${me.inv.length} Sachen)` : ''}`, ch);
}
// Host: Tauschmenü mit einem Gast (Knopf oben rechts). Gibt Sachen aus dem Gepäck des Helden an die Gastfigur.
function hostTrade() {
  const S = A.S, I = A.ITEMS, pilots = A.partyMembers().filter(m => m.coopPilot); if (!pilots.length) return A.UI.toast('Kein Gast steuert gerade eine Figur.');
  const m = pilots[0], ch = [];
  S.player.inv.slice(0, 16).forEach((it, idx) => { const d = I[it.key] || { name: it.key };
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
  const msg = { t: 'in', seq: inSeq, mv: [mv.dx, mv.dy], aim, atk: (A.mouse.down || A.keys.has(' ')) && !A.UI.modalOpen && !A.UI.dialogueOpen() ? 1 : 0, guard: A.keys.has('shift') ? 1 : 0, dodge: pending.dodge ? 1 : 0, use: pending.use ? 1 : 0, slot: pending.slot };
  pending.dodge = false; pending.use = false; pending.slot = null;
  const s = JSON.stringify(msg); if (s !== lastIn || msg.seq !== lastSeq || A.keys.size || now() - lastSent > 2000) { lastIn = s; lastSeq = msg.seq; lastSent = now(); send(msg); }   /* alle 2 s ein Lebenszeichen */
  if (now() - hostSeen > 10000 && !lostWarned) { lostWarned = true; A.UI.toast('KOOP: HOST ANTWORTET NICHT', 5000); A.log('Koop: Seit 10 Sekunden kommt nichts vom Host. Ist sein Fenster zu? Zum Weiterspielen die Seite neu laden.', 'party'); }
  A.UI.refreshHUD(); A.updatePrompt();   /* E-Hinweise (Aufheben, Händler, Eingang) aus Sicht der eigenen Figur */
  const el = $('coop-hud') || (() => { const d = document.createElement('div'); d.id = 'coop-hud'; d.className = 'ledger'; d.style.cssText = 'position:fixed;right:12px;top:52px;z-index:30;font-size:12px;color:#c9bfa6;text-align:right'; document.body.appendChild(d); return d; })();
  el.textContent = `Koop: Gast bei ${S.coop.hostName}${S.coop.hostBusy ? ' · Host ist im Menü oder Gespräch' : ''}${S.coop.cineText ? ' · Kamerafahrt läuft' : ''}`;
}
let lastSeq = -1, lastSent = 0, hostSeen = now(), lostWarned = false;
// Text der Kamerafahrt beim Gast (unten mittig, wie beim Host)
function showCineText(t) {
  let el = $('coop-cine'); if (!el) { el = document.createElement('div'); el.id = 'coop-cine'; el.style.cssText = 'position:fixed;left:50%;bottom:18%;transform:translateX(-50%);max-width:70vw;z-index:40;font:18px Spectral,serif;color:#f0e6cd;text-align:center;text-shadow:0 2px 6px #000;pointer-events:none'; document.body.appendChild(el); }
  el.textContent = t || '';
}

// Für Tests ohne Netz (?dev): der Host bekommt einen Gast im selben Browser, der über eine Attrappe verbunden ist
export function fakeGuest(api, entId) {
  A = api; const S = A.S; S.coop ||= { role: 'host', code: 'TEST00', guests: {}, bytes: 0, t0: now() };
  A.coopHooks.hostTick = hostTick; A.coopHooks.remote = remoteControl; A.coopHooks.guestAct = guestAct;
  const c = { peer: 'fake', open: true, sent: [], send(s) { c.sent.push(s); if (c.sent.length > 50) c.sent.shift(); }, close() {} };
  S.coop.guests.fake = { id: 'fake', conn: c, name: 'Attrappe', entId, inp: null, at: 0, known: new Set(), last: {}, map: null, selfAt: 0 };
  const m = A.byId(entId); if (m) m.coopPilot = 'fake';
  return { conn: c, input: inp => { const g = S.coop.guests.fake; g.inp = { seq: (g.inp?.seq || 0) + 1, ...inp }; g.at = now(); }, drop: () => dropGuest('fake'), send: d => onHostData(c, JSON.stringify(d)) };   /* send: Nachricht wie vom Gast (cmd, chat, pick) */
}
export const version = VER;
