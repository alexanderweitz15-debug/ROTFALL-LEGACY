# Plan K2 — LAN-/Internet-Koop für ROTFALL: LEGACY

Stand 2026-09-30. Arbeitsgrundlage für Opus 5.5. Nutzerwunsch: Koop direkt als Netzwerk-Koop (kein Couch-Koop), **eigener Knopf, standardmäßig aus**, damit der Einzelspieler unangetastet bleibt. Beide Spieler laden das Spiel von GitHub Pages; ein eigener Server ist nicht nötig.

Vor dem Bauen gelten die Regeln aus `docs/MASTER_ROADMAP.md` Teil A (Skills prüfen, bestehende Systeme lesen, erweitern statt duplizieren, Definition of Done). Der Ist-Zustand steht in `docs/IST_ZUSTAND.md`; die Selbsttest-Regeln in `docs/MASTER_PROMPT.md` (Tests ändern nie den echten Spielstand; Backup und `S._quiet` vor jedem Neuladen).

---

## 1. Grundentscheidungen

| Frage | Entscheidung | Grund |
|---|---|---|
| Wer rechnet die Welt? | **Nur der Host.** Der Gast ist ein dünner Client: schickt Eingaben, bekommt Zustand. | Die Simulation ist nicht deterministisch (`Math.random`, `performance.now`). Zwei parallele Simulationen laufen auseinander. |
| Was steuert der Gast? | **Einen Gefährten aus der Gruppe des Hosts** (`S.party`). | Das ganze Spiel hängt an `S.player`. Ein zweiter Held würde hunderte Stellen berühren. Ein Gefährte hat schon Körper, Inventar, KI, Speicherung. |
| Verbindung | **WebRTC-Datenkanal**, Verbindungsaufbau über PeerJS (öffentlicher Broker) oder manuellen Code-Tausch als Ersatz. | Statische Seite auf GitHub Pages, kein eigener Server. PeerJS liefert IDs und Signalisierung; die Daten fließen direkt zwischen den Browsern. |
| Wo liegt der Code? | Neues Modul `src/coop.js`, dynamisch geladen (`import('./coop.js?v=N')`) nur beim Klick auf den Knopf. PeerJS ebenfalls dynamisch von `https://cdn.jsdelivr.net/npm/peerjs@1/dist/peerjs.min.js`. | Einzelspieler lädt keine Zeile Koop-Code. |
| Schalter | Knopf **„Koop (Netzwerk)“** auf dem Titelbildschirm (`index.html` `.menu-plaques`). Öffnet ein Fenster mit „Spiel öffnen (Host)“ und „Beitreten (Gast)“. | Nutzerwunsch: nichts läuft automatisch. |
| Speichern | **Nur der Host** speichert, wie bisher. Der Gast speichert nie (`S._quiet`-ähnliche Sperre `S.coopGuest = true` in `save()`). | Ein Spielstand, keine Konflikte. |
| Pause | Menüs des **Hosts** pausieren die Welt wie bisher (beide sehen die Pause). Menüs des **Gasts** pausieren nichts. | Einfach und ehrlich; später verbesserbar. |
| Tod | Stirbt der Gefährte des Gasts, gelten die normalen Regeln (am Boden, Aufrichten, Tod, Grab). Der Gast wählt danach einen anderen Gefährten oder wartet. Stirbt der Host, endet die Runde (Erbe wie bisher, Gast wird getrennt). | Keine neue Todeslogik. |

---

## 2. Was existiert und wiederverwendet wird (aus dem Code)

- **Eingabe:** `keys` (Set), `mouse`, `touch` in `game.js`; `moveInput()` liest WASD/Pfeile; `controlPlayer(dt)` bewegt `S.player`, `attack(c, forceDir)`, `dodge()`, `doInteract()`, `useSlot(i)`, `bindInput()`/`bindTouch()`.
- **Gefährten:** `partyMembers()`, `partyAI(m, dt)`, `S.partyCmd`, `giveGear`, `dismiss`, `recruit`, `charUI(m)` in `ui.js` (Körpertafel, Ausrüstung eines Gefährten), `openModal('character', m)`.
- **Welt:** `genWorld()` und alle `gen*` sind **deterministisch aus `S.seed`** (`world.js`, `seedRng(S.seed)`). Props werden nur als Abweichung gespeichert (`PROP_BASE`, `mergeProps`, `propsGone`). Das heißt: Der Gast kann die Welt lokal aus dem Seed bauen und braucht nur den Spielstand des Hosts einmal.
- **Spielstand:** `saveData()` liefert den kompletten Zustand als JSON (rund 2 MB), `applySave()` übernimmt ihn, `continueGame()` baut die Welt danach (Migrationen, `spawnResidents`, `ensure*`). Ein Gast kann also mit `applySave(hostSave)` + dem Welt-Neuaufbau starten.
- **Kamera:** `R.cam` in `render.js`; `update()` folgt `S.player` (Zeilen um „// Kamera“, Blickvorlauf zur Maus, Kampfzoom). Muss beim Gast der gesteuerten Figur folgen.
- **Render:** `drawFrame(now)` zeichnet `S.ents[S.map]`; braucht keine Änderung, solange die Entitäten korrekt in `S.ents` liegen.
- **Ticks:** `loop(now)` → `update(dt, now)` bei `!S.paused`. Der Gast darf **kein** `update()` der Welt laufen lassen, nur Kamera, HUD, Effekte, Interpolation.
- **Entities:** `S.ents[map]` Arrays; `byId(id)`; `uid()`; `transient` steuert Speicherung.

---

## 3. Architektur

```
Host-Browser (rechnet alles)                Gast-Browser (zeigt an, schickt Eingaben)
┌──────────────────────────┐   PeerJS/WebRTC   ┌──────────────────────────┐
│ game.js: update() läuft  │ ◀── input 30 Hz ──│ coop.js: liest keys/mouse│
│ coop.js Host:            │                   │  sendet {mv, aim, act}   │
│  - hat Gäste {peer, entId}│ ── hello (Save) ─▶│ applySave + Welt bauen   │
│  - applyGuestInput()     │ ── delta 20 Hz ──▶│ coop.js Guest:           │
│  - snapshotFor(guest)    │ ── world 2 Hz ───▶│  - übernimmt Deltas      │
│  - Ereignisse (log,toast)│ ── events ───────▶│  - Kamera auf eigene Fig.│
└──────────────────────────┘                   │  - HUD/Menüs der Figur   │
                                               └──────────────────────────┘
```

### 3.1 Zustand im Spielstand
- `S.coop` wird **nicht** gespeichert (in `state.js` `SKIP` aufnehmen). Laufzeit: `{ role: 'host'|'guest', peer, conns, guests: { [peerId]: { entId, name, lastInput, seq } } }`.
- Gefährte, der gesteuert wird: `m.coopPilot = peerId` (transient-ähnlich: beim Speichern entfernen, `saveData()` filtert `coopPilot` heraus oder setzt es beim Laden zurück). `partyAI(m, dt)` gibt sofort zurück, wenn `m.coopPilot` gesetzt ist und eine Eingabe jünger als 1 s vorliegt; sonst greift die normale KI (Gast hängt → Figur folgt wieder von selbst).

### 3.2 Nachrichten (JSON, klein halten)
```
Gast → Host
{ t:'hello', name, ver }                       Beitritt, Versionsprüfung (?v= und SAVE_VERSION)
{ t:'pick', entId }                            Gefährte gewählt
{ t:'in', seq, mv:[dx,dy], aim, atk:0|1, guard:0|1, dodge:0|1, use:0|1, slot:n|null, dropSlot… }  30 Hz, nur bei Änderung sonst 10 Hz
{ t:'cmd', kind:'equip'|'unequip'|'useItem'|'drop'|'stash', idx|slot }   Inventar-Aktionen der eigenen Figur
{ t:'chat', text }

Host → Gast
{ t:'welcome', save: <saveData() als String>, party:[{id,name,prof,level}], seq }
{ t:'assign', entId }                          welche Figur der Gast steuert
{ t:'ents', map, upd:[{id, x,y,vx,vy,facing,aim,hp,maxHp,downed,alive,swing,swingDur,act,stagger,kb,status:[keys],mounted,cover}], add:[<volle Entity ohne schwere Felder>], del:[ids] }  20 Hz, nur Entitäten im Umkreis von 1400 px um die Gastfigur (+ alle Gruppenmitglieder)
{ t:'world', day, minute, weather, paused, map (des Hosts), gold, res, factions, quests (nur active), track }  2 Hz
{ t:'self', inv, equip, stamina, mana, morale, skills, body }   die gesteuerte Figur voll, 5 Hz oder bei Änderung
{ t:'fx', list:[{x,y,type,n}] , floats:[…], toasts:[…], log:[…] }  gebündelt je Tick, nur nahe Ereignisse
{ t:'travel', map, x, y }                      die Gastfigur hat die Karte gewechselt (mit dem Host oder allein)
{ t:'cine', shots… } / { t:'cineEnd' }          Kamerafahrt spiegeln (Gast schaut zu)
{ t:'chat', from, text }
{ t:'bye', why }
```
Entities, die der Gast noch nicht kennt, kommen als `add` mit allen zum Zeichnen nötigen Feldern: `kind, mtype, key, name, prof, level, pal, build, equip (nur Schlüssel), faction, r, big, hooded, undead, glow, spec (falls gesetzt), traits`. Schwere Felder (`inv`, `memories`, `plan`, `schedule`, `path`) nie senden. Der Gast baut fehlende Ableitungen mit den vorhandenen Funktionen (`recalc`, `SP.humanSpec` läuft beim Zeichnen ohnehin).

### 3.3 Host: Eingaben anwenden
Neue Funktion in `coop.js` (mit Zugriff auf die von `game.js` bereitgestellten Hooks, siehe §4): `controlRemote(m, inp, dt)`:
- Bewegung wie `controlPlayer`: `speedOf(m) * dt / 16`, `moveEnt(m, dx*s, dy*s)`, `m.aim = inp.aim`, Rückwärtsfaktor `backMul`.
- `inp.atk` → `attack(m)`; `inp.dodge` → eigene Rolle für Gefährten (die bestehende `dodge()` hängt an `S.player`; Variante `dodgeFor(c)` aus `dodge()` herauslösen, so dass `dodge()` = `dodgeFor(S.player)`).
- `inp.guard` → `m.cover = true/false` wie `updateGuard` (herauslösen zu `guardFor(c, held, dt)`).
- `inp.use` → Interaktion der Gastfigur: Phase 1 nur **Gegenstand aufheben, Grab, Truhe, Kiste, Rohstoff, Tür/Portal (nur wenn der Host auf derselben Karte ist oder mitgeht)**. `doInteract()` ist an `S.player` gebunden; nötig ist `interactablesFor(c)`/`doInteractFor(c)` mit denselben Listen, ohne NPC-Gespräche. NPC-Gespräche für den Gast kommen in Phase 3 (Dialog wird als Text an den Gast gespiegelt, Wahl zurück).
- `inp.slot` → `useSlotFor(m, i)`: Fähigkeit oder Verbrauchsgut aus `m.hotbar`/`m.inv` (aus `useSlot`/`useAbility` herauslösen; Fähigkeiten für Gefährten zunächst nur `classAbility`-Fälle ohne Spieler-Sonderlogik; Zauber später).

### 3.4 Gast: Anzeige
- Der Gast lädt `applySave(welcome.save)` und ruft die Welt-Aufbau-Teile von `continueGame()` auf, **aber ohne** Speichern, ohne `startGame()`-Autosave, ohne `SIM.initSim` Nebenwirkungen (Karawane spawnen). Dafür `continueGame(opts = { coopGuest: true })` mit Sperren an den Stellen `save()`, `spawnCaravan`, Log „Die Welt erinnert sich“.
- `loop()` auf dem Gast: `if (S.coop?.role === 'guest') { coop.guestTick(dt); } else update(dt, now)`. `guestTick`: Deltas anwenden, Interpolation (`x += (tx-x)*min(1, dt/80)`), lokale `updateFx`, Kamera auf `coop.me()`, HUD (`refreshHUD` zeigt heute `S.player`; für den Gast eine Umschaltung `UI.setHudTarget(m)` in `ui.js refreshHUD`, die `p` durch die Gastfigur ersetzt).
- Menüs: `openModal('character'|'inventory'|'party'|'map', …)` funktionieren mit einer Zielfigur (`charUI(m)` kann das schon; `invUI` muss `p` parametrisierbar bekommen). Inventar-Aktionen senden `cmd` an den Host; die Anzeige aktualisiert sich mit dem nächsten `self`.
- `S.paused` beim Gast spiegelt den Host (aus `world`), aber der Gast rechnet nichts, also ist die Pause nur Anzeige (Hinweis „Der Host ist im Menü“).
- Gast darf nie: `save()`, `travel()` selbst auslösen, `worldEvent`, `dayTick`, Dialoge mit Weltfolgen.

### 3.5 Kartenwechsel
- Der Gast folgt dem Host durch Türen wie heute jeder Gefährte (`travel()` nimmt `partyMembers()` mit). Zusätzlich: Wenn der **Gast** ein Portal benutzt, entscheidet der Host: Erlaubt sind Wechsel, bei denen die Gastfigur allein reisen kann (Weltkarte ↔ Dungeon); der Host bleibt, wo er ist. Dazu muss `S.ents[map]` je Karte weiter simuliert werden: `update()` denkt heute nur `actorsOf(S.map)`. **Phase 1: der Gast kann die Karte nicht allein wechseln** (Toast „Der Host muss mit“); Phase 4 erweitert `update()` um eine Zweitkarte (`S.coop.maps = Set` der Karten mit Gästen, Feinde dort denken mit `think` in reduzierter Rate).

---

## 4. Änderungen in bestehenden Dateien (klein, klar abgegrenzt)

| Datei | Änderung |
|---|---|
| `index.html` | Knopf `data-act="coop"` „Koop (Netzwerk)“ neben „Fortsetzen“. Ein Fenster `#coop-panel` (versteckt) mit: Name, „Spiel öffnen“ → zeigt Raumcode, Liste der Gäste, Freigabe je Gefährte; „Beitreten“ → Codefeld, Verbinden, Figurenwahl. Statusfeld (Ping, Bytes/s). |
| `src/game.js` | 1) `boot()`: Klick auf `coop` lädt `import('./coop.js?v=N')` und ruft `coop.openPanel(API)`. 2) `loop()`: Gast-Zweig (§3.4). 3) `partyAI(m, dt)`: erste Zeile `if (m.coopPilot && coopHooks.remote?.(m, dt)) return;`. 4) Herauslösen ohne Verhaltensänderung: `dodge()`→`dodgeFor(c)`, `updateGuard`→`guardFor(c,…)`, `useSlot(i)`→`useSlotFor(c, i)`, `doInteract()`→`doInteractFor(c)` (Gespräche nur wenn `c === S.player`). 5) Kamera in `update()`: Ziel `camTarget()` = `S.coop?.role === 'guest' ? coop.me() : S.player`. 6) `travel()`: Gäste-Figuren zählen zu `members` (tun sie als Gefährten schon). 7) `continueGame(opts)`: Gast-Sperren. 8) `window.RF` bekommt `coop` für Tests. 9) Ereignis-Spiegel: `log`, `UI.toast`, `fx`, `float` rufen zusätzlich `coopHooks.emit?.(…)` auf (eine Zeile je Funktion, nur wenn Host). |
| `src/ui.js` | `refreshHUD(target)`/`setHudTarget(m)`; `invUI(m)` parametrisierbar; Chat-Zeile unten im Log (Taste T ist belegt → Enter öffnet Chat im Koop). Kleines Koop-Statusfeld oben rechts (Ping, Gäste). |
| `src/state.js` | `SKIP` um `coop` ergänzen; `saveData()` entfernt `coopPilot` aus Entitäten; `save()` gibt `false` zurück, wenn `S.coop?.role === 'guest'`. |
| `src/coop.js` (neu) | Verbindung (PeerJS laden, Host-ID = Raumcode, `peer.on('connection')`), Nachrichten (§3.2), `controlRemote`, Snapshot-Erzeugung mit Delta-Vergleich je Entität (letzter gesendeter Wert je Feld je Gast), Interpolation, Panel-Logik, Debug/Statistik. Keine Spiellogik neu implementieren: nur bestehende Funktionen über das übergebene `API`-Objekt aufrufen. |
| `src/style.css` | Panel, Chat, Statusfeld. |
| `docs/` | `MECHANIKEN.md` Abschnitt „Koop“, `GUIDE.md` Kapitel „Zusammen spielen“, `CHANGELOG.md`. |

Kein zweites Bewegungs- oder Kampfsystem. Alles, was die Gastfigur tut, läuft durch dieselben Funktionen wie beim Helden.

---

## 5. Phasen und Pakete

### K2.1 — Verbindung und Knopf (1 Sitzung)
- Knopf, Panel, PeerJS-Laden, Host-Raumcode (6 Zeichen aus der Peer-ID), Gast verbindet, `hello`/`welcome` mit Versionsprüfung, Chat.
- Debug: `RF.coop.fakeGuest()` erzeugt einen lokalen Gast im selben Browser (zweiter `Peer` oder direkter Kanal ohne Netz), um alles ohne zweiten PC zu testen.
- Selbsttest: Panel öffnet und schließt, ohne `S` zu verändern; `save()` beim Gast liefert `false`; `SKIP` enthält `coop`.

### K2.2 — Gast sieht die Welt (1–2 Sitzungen)
- `welcome` überträgt `saveData()`; Gast baut die Welt (§3.4), Kamera auf die zugewiesene Figur, `ents`-Deltas 20 Hz, `world` 2 Hz, Interpolation.
- Messen: Bytes/s bei 40 Entitäten in Sicht; Ziel unter 150 kB/s; sonst Felder kürzen (Zahlen runden, `x|0`).
- Selbsttest (Host-seitig, ohne Netz): `snapshotFor(fakeGuest)` liefert nur Entitäten im Umkreis; zweiter Aufruf ohne Änderung liefert leeres `upd`.

### K2.3 — Gast steuert (1–2 Sitzungen)
- `in`-Nachrichten, `controlRemote`, `partyAI`-Übergabe, Angriff, Rolle, Deckung, Aufheben, Leiste. Gastfigur zeigt Namen des Gasts über dem Kopf.
- Selbsttest: `controlRemote(m, {mv:[1,0]}, 16)` bewegt die Figur nach rechts, `partyAI` überspringt sie; bleibt die Eingabe 1 s aus, folgt sie wieder.

### K2.4 — Inventar und Menüs des Gasts (1 Sitzung)
- `cmd equip/unequip/useItem/drop`, `self`-Nachricht, `invUI(m)`, `charUI(m)`, Gruppenfenster ohne Befehle für den Gast.

### K2.5 — Karten, Kämpfe, Ereignisse (1–2 Sitzungen)
- Kartenwechsel mit dem Host; Ereignis-Spiegel (Toast, Log, Effekte, Kamerafahrten als Zuschauer); Tod der Gastfigur → Figurwahl neu.
- Regressionsliste: Speichern beim Host während der Gast verbunden ist; Laden eines Stands ohne Koop (keine `coopPilot`-Reste); Gast trennt mitten im Kampf (Figur fällt in KI zurück); Host schließt Browser (Gast bekommt `bye`); Version passt nicht (klare Meldung).

### K2.6 — Zweitkarte für den Gast (optional, 1–2 Sitzungen)
- Gast darf allein in Dungeons; `update()` simuliert `S.coop.maps` mit.

### K2.7 — Gespräche für den Gast (optional, später)
- Dialog-Spiegelung: Host führt `talk(npc)` mit der Gastfigur als Sprecher aus, sendet Text und Optionen, Gast wählt. Erfordert, dass `talk()` einen Sprecher-Parameter bekommt; viele Stellen lesen `S.player` — nur sicherer Teil (Händler kaufen/verkaufen mit dem Inventar der Gastfigur, Heilerin).

Gesamt: 6–9 Sitzungen für K2.1–K2.5, danach optional.

---

## 6. Debug und Tests

- Debug-Menü, neuer Bereich „Koop“: Panel öffnen, Fake-Gast an/aus, Fake-Gast bewegen (Kreis), Verbindung trennen, Bytes/s anzeigen, Delta-Größe anzeigen.
- Selbsttest-Proben (im `?dev`-Selbsttest, ohne Netz, mit Fake-Gast): siehe je Paket. Alle Proben laufen in `sandbox()` und dürfen `S.coop` nur temporär setzen.
- Zwei-Browser-Test auf demselben Rechner: zwei Tabs, einer Host, einer Gast (PeerJS verbindet auch lokal). Screenshot beider Ansichten in `docs/screenshots/coop_*.png`.
- Regressionen: Der komplette bestehende Selbsttest (272 Proben) muss weiter grün sein; ohne Koop-Knopf darf sich nichts ändern (Diff der Netzwerk-Requests: kein PeerJS-Laden im Einzelspieler).

---

## 7. Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Spielstand 2 MB beim Beitritt | Einmalig, über den Datenkanal in Stücken (16 kB) mit Fortschrittsanzeige; PeerJS erledigt das Chunking. |
| Zu viel Datenverkehr | Nur Entitäten im Umkreis, Delta je Feld, Zahlen runden, 20 Hz; `fx` nur nahe. |
| Versionsdrift | `hello.ver` = `?v=N` aus dem Import-Pfad plus `SAVE_VERSION`; bei Abweichung Abbruch mit Meldung „Beide brauchen Version N“. |
| Reste im Spielstand | `coopPilot` beim Speichern entfernen; `S.coop` in `SKIP`. Ladeprobe (`RF.loadProbe`) im Koop ausführen. |
| Host-Menü pausiert Gast | Ehrlich anzeigen („Host im Menü“). Später: nur Kampfstillstand statt Weltpause. |
| PeerJS-Broker nicht erreichbar | Ersatz: manueller Code-Tausch (Offer/Answer als Text), `coop.js` kapselt den Transport, damit beide Wege dieselbe Nachrichten-Schnittstelle nutzen. |
| Cheaten | Nicht relevant (Freunde im LAN). Host prüft trotzdem Reichweiten (Aufheben nur unter 62 px, wie `interactables`). |

---

## 8. Definition of Done für K2 (Pakete 1–5)

- Knopf auf dem Titelbildschirm; ohne Klick wird kein Koop-Code geladen.
- Zwei Browser verbinden sich über den Raumcode; der Gast sieht die Welt des Hosts und steuert einen Gefährten: laufen, kämpfen, ausweichen, decken, aufheben, Leiste, Inventar, Ausrüstung.
- Kamerafahrten, Toasts und Log erscheinen beim Gast.
- Der Host speichert und lädt wie bisher; ein danach geladener Stand enthält keine Koop-Reste.
- Trennung, Tod, Versionsfehler, Host-Ende werden sauber gemeldet.
- Bestehender Selbsttest grün; neue Proben grün; Zwei-Tab-Test mit Screenshots.
- `docs/MECHANIKEN.md`, `docs/GUIDE.md` (Kapitel „Zusammen spielen“ mit Anleitung: Knopf, Code, was der Gast kann und was nicht) und `CHANGELOG.md` ergänzt; Versionsnummer und `?v=` erhöht.
