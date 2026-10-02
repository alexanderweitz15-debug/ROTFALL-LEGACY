# ROTFALL — Bug Hunt and Fit Review Team (Hunt 1, gestartet 02.10.2026)

Vom Entwickler vorgegebene Arbeitsanweisung (vollständig unten). Die Hauptsitzung ist Lead. Alle Berichte auf Deutsch.

## 2. Project facts (ausgefüllt vom Lead)

- **Engine, language, framework:** Kein Engine/Framework. Reines JavaScript (ES-Module, ES2022), Canvas-2D, WebAudio. Kein Build-Schritt, kein npm, keine Abhängigkeiten. Alle Sprites werden im Code gezeichnet.
- **How to start the game:** Statischer Server im Repo-Wurzelordner; in dieser Arbeitsumgebung läuft schon ein No-Cache-Server auf `http://localhost:8770`. `?dev` stellt `window.RF` bereit (State `RF.S`, `RF.tick(ms)`, `RF.selftest()`, `RF.spawnEnemy`, `RF.travel`, `RF.simFight`, `RF.shot(name)` …). Strg+Umschalt+D = Debug-Menü (`debugSections()` in game.js). Ist der Browser-Bereich versteckt, laufen keine Animation-Frames → `RF.tick(ms)` benutzen.
- **How to run tests:** `RF.selftest()` (Liste von `ok(name, cond)`-Proben in `selftest()` in src/game.js, ~360 Stück, ~40 s). JS-Aufrufe im Browser-Tool brechen nach 45 s ab: `setTimeout(() => window.__st = RF.selftest(), 50)` starten, in getrennten Aufrufen `window.__st` lesen. Kein Linter. Parse-Check: Seite laden und prüfen, ob `window.RF` existiert.
- **Source layout:** `index.html` → `src/game.js` (Einstieg, Hauptschleife, Kampf, KI, Dialog, Quests/Aufträge, Ereignisse, Debug, Selbsttest; ~19k Zeilen). `state.js` (State `S`, RNG, Speichern), `data.js` (Inhalte: ITEMS, MONSTERS, NPCS, QUESTS …), `world.js` (deterministische Weltgenerierung), `sim.js`/`economy.js` (Krieg, Märkte, Karawanen), `body.js` (Trefferzonen, Gliedmaßen, Bionik), `render.js`, `sprites.js`/`fig5.js`/`figure.js` (Figuren), `anim.js`, `buildings.js`, `atlas.js`, `sfx.js`, `cloudsave.js`, `ui.js` (HUD, Fenster, Dialoge), `coop.js` (Netz-Koop), `icons.js`. Mehr: `CLAUDE.md`, `docs/IST_ZUSTAND.md`, `docs/MECHANIKEN.md`.
- **Where tests live:** Nur in `selftest()` in src/game.js (Helfer `sandbox()`, `stage()`, `actor()`). Kein Testordner. Der Reproducer schreibt KEINE Datei in src/; Reproduktionen als JS-Schnipsel im Browser (im Bericht notieren) oder als Datei unter `ROTFALL_STATE/hunt/repro/`.
- **Save/load format and location:** `localStorage`, JSON (komprimiert) über `saveData()`/`applySave()` in state.js. Aktiver Slot `rotfall.slot.active`, Legacy-Slot `rotfall.legacy.save`. `SKIP` in state.js = nie gespeicherte Schlüssel. Viele NPC-Gruppen sind `transient` und werden von `ensure*()` in `continueGame()` neu gebaut. **Spielstand-Sicherheit (Pflicht):** vor jedem Reload `localStorage.setItem('rotfall.legacy.save', localStorage.getItem('rotfall.backup.s14c')); localStorage.setItem('rotfall.slot.active','legacy');` dann `/?dev&x=<ts>`, `RF.S._quiet = true`, `[data-act="continue"]` klicken. Echte Neustarts/Speichertests nur in Wegwerf-Slots, danach löschen und auf `legacy` zurück.
- **Known bugs are listed in:** `ROTFALL_STATE/BUGS.md` (RB-001…RB-060, SC-01…SC-04). Entscheidungen: `ROTFALL_STATE/DECISIONS.md`. Offene Entwürfe: `ROTFALL_STATE/PROPOSALS/`.
- **Browser:** Jeder Agent öffnet einen eigenen Tab (`mcp__Claude_Browser__tabs_create`); bei Tab-Limit nur eigene Tabs schließen, NIE `tab-10` (Lead).
- **Ablage der Ergebnisse:** `ROTFALL_STATE/hunt/<agent>.md` (Kandidaten, Fit-Befunde, Quest-Blätter im Format von §7).

## 3. Ergänzung zu den Weltregeln (aus DECISIONS.md, vom Lead)
- Region: Westen Kette (Sklaverei, Eisenmark), Mitte Menschen (Valen, König Varon, Hauptstadt Varonheim), Süden Aurelion (Adel, Automaten, Bionik, Magitech), Osten Totenland (Morvath, Untote). Luftschiffe/Seefahrt existieren.
- Knockout-Regel (Kenshi): am Boden keine Selbstheilung, schrittweises Aufrichten.
- Schwierigkeit: Angsthase (Folgen heilen), Schwer, Sehr schwer.

---

(Die vollständige Anweisung des Entwicklers folgt unverändert in der Chat-Nachricht vom 02.10.2026; die Abschnitte 1, 3–8 gelten wörtlich. Kurzfassung der Pflichten:)
- Ziel: bewiesene Bugs (Rangliste mit Repro + Ursache), getrennte Fit-Liste, Quest-Review (jede Questreihe Ende-zu-Ende, eigene Kernaufgabe, eigenes Aussehen je Questreihe).
- Niemand ändert Spielcode. Bekannte Bugs (BUGS.md) nicht erneut melden, außer mit neuer Information.
- Formate: Candidate, Bug entry, Fit finding, Quest sheet, Severity 1–4 (Critical, High, Medium, Low).
- Lesen vor Behaupten; sagen, was nicht geprüft wurde; im Auftrag bleiben.
