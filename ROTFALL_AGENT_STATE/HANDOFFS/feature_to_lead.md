# feature_to_lead

FROM: Feature Designer (Agent 3) · TO: Lead · 01.10.2026

TASK: §5g.2 / T07 Blutkult als festschreibbares Design.

CURRENT STATE: Vorschlag vollständig in `ROTFALL_AGENT_STATE/proposals/blutkult.md` (Ablauf, Vampir-Titelklasse, STIGMA, Katakomben, Boss, Folgen, Code-Plan, 15 Proben, 5 Scheiben). Status WAITING_FOR_DEVELOPER — 6 Fragen (§18) an den Entwickler weitergeben. Nichts in `src/` geändert.

IMPORTANT DISCOVERIES (FAKT):
- `titleTick`/`titleDeed` laufen nur für `S.player` (game.js:2739, 12342) → Koop-Gast-Vampir braucht Erweiterung.
- Mentor-Probe (game.js:15867) verlangt Mentor in `NPCS`; Hedda wäre transient → Probe anpassen. Klassen-Quest-Zähler `=== 12` (game.js:15908) nicht berühren.
- Feld `reversible` in TITLE_CLASSES wird nirgends gelesen.
- `FRESH` (game.js:1967) braucht `katakomben: []`; `S.ents[m] ||= []` beim Laden ist schon da (1968).
- Namenskollisionen: „Blutkatakomben“ (Garmadon, world.js:2167), „Blutfürst“ (Todesritter-Knoten, data.js:869), „Blutdurst“ (Affix, data.js:45), „Blutbann“ (Adelsmord).
- Neue Fraktion mit `ranks` würde die Rangführer-Probe (game.js:16038) brechen → `blut` ohne `ranks`.
- Aldhelm-Andeutungen stehen schon im Spiel (game.js:8232, 8263).

RELEVANT FILES: data.js (TITLE_CLASSES 691, ABILITIES 577, MAGIC_VIEW 765, FACTIONS 875, BOSS_LOOT 428), game.js (Varon 8186–8280, magicSeen 11764, Titelklassen 12324–12480, S.after 9906ff, teamOf 3045, cinematic 8911, garmadonAI 4044), sim.js warDay 357, world.js DUNGEONS 2016.

DECISIONS (meine, als VORSCHLAG markiert): Katakomben beim Betreten gebaut ohne Zufall; Kult-Fraktion `blut` ohne Ränge; Hedda als Mentorin; Vampir ohne Klassen-Questreihe in T07; Todesritter-Knoten „Blutfürst“ → „Blutritter“ umbenennen (braucht Lead-Ja).

OPEN QUESTIONS: F1 Stufe · F2 Sonnenhärte · F3 Trinken · F4 Spieler als Blutfürst · F5 §5g.8-Bedingung · F6 Heilung endgültig (alle in blutkult.md §18).

BLOCKERS: Entwickler-Antworten.

EXPECTED NEXT STEP: Lead legt die 6 Fragen vor → Antworten in DESIGN_DECISIONS.md → Systems Designer prüft (Kriegsgraph-Abzug, Durst-Tempo) → DESIGN_LOCKED → Scheibe 1 (Vampir + Stigma).

---

FROM: Feature Designer (Agent 3, zweiter Auftrag) · TO: Lead · 01.10.2026

TASK: T08, T09, T10 als festschreibbare Designs.

CURRENT STATE: Drei Vorschläge in `ROTFALL_AGENT_STATE/proposals/` (`t08_gefangene_steckbriefe_ruf.md`, `t09_laeden_stadtlager.md`, `t10_ahnenfeind_heldentod.md`). Jeder mit Code-Plan, Proben und 4 Scheiben. Status WAITING_FOR_DEVELOPER, je 2–3 Fragen (Abschnitt 17). Nichts in `src/` oder `docs/` geändert.

IMPORTANT DISCOVERIES (FAKT):
- Es gibt kein `guardChoices`, kein Seil-Item und keine Kettenpeitsche. Ergebene sind `neutral` (game.js:3049) und unangreifbar; Steckbrief-Ziele (`e.contract`) ergeben sich nie (game.js:3852).
- Kopfgeld-Anführer und Bandenleute sind `transient` (game.js:7052, 10838). Ein Gefangener muss beim Fesseln `transient = false` bekommen, sonst ist er nach dem Laden weg.
- `Object.values(S.fame)` (game.js:5054): Der Ruf der Klinge darf nicht als verschachteltes Objekt in `S.fame` liegen → eigenes Feld `S.fameStyle`.
- `S.after.tmul` wird bei game.js:10185 komplett geleert → ungeeignet für Aurelions Zölle (TASKS T09 sagt das Gegenteil) → `S.tollMul`.
- **Wahrscheinlicher Fehler:** `riskOf` liest `S.laws.toll` (economy.js:284), `applyLaw` löscht es sofort (game.js:9126). Das Zollgesetz senkt das Überfallrisiko nie. Bitte in BUG_DATABASE aufnehmen (Bug Hunter prüft).
- 17 Spielstellen schreiben `S.prices`. Eine Probe (game.js:15611) hängt daran. Der Wegfall von `rnd()` in `dayTick` (10684) verschiebt die Zufallsfolge.
- Todesabläufe laufen nach Echtzeit (render.js:2110). Für die Zeitlupe braucht der Leichnam ein `slow`-Feld. Ausbluten übergibt den Mörder als id (game.js:2771).
- `continueGame` prüft nicht, ob der Held tot ist (ANNAHME: Stand zwischen Tod und Erbenwahl ungeklärt) → Hunter.

RELEVANT FILES: game.js (updateEnemy 3851, interactables 4637, doInteract 4886, surrenderOffer 6948, makeContract 6688, conKill 7009, travel 9348, bands 10800–10870, rawPrice/shopStock 12173–12195, playerDeath 12768, adoptSuccessor 12930, camAim 8893, loop 2127), economy.js (ecoPrice 125, caravanDay 287), state.js (SKIP 141, save 212), render.js 2110, ui.js 725/991.

DECISIONS (meine, als VORSCHLAG markiert): Gefangene reisen wie Diener mit (statt „abgeführt beim Kartenwechsel“); Steckbriefe am vorhandenen Brett und beim Verteidigungsmeister; Leitware abgeleitet statt von Hand eingetragen; `S.prices` beim Laden löschen; ein Ahnenfeind zur Zeit; kein Ahnenfeind bei Wache, Boss, Umwelt und Goblinsturm.

OPEN QUESTIONS: T08 F1–F3 (Brett-Ort, Strick, Härte der Grausamkeit) · T09 F1–F3 (Preisspanne, Leitware, alter `S.prices`) · T10 F1–F3 (Dauer des Todes, zweiter Mörder, Härte der Familienangriffe).

BLOCKERS: Entwickler-Antworten. T10 S4 braucht T08 S2.

EXPECTED NEXT STEP: Lead legt die 9 Fragen vor → DESIGN_DECISIONS.md → Systems Designer (T09-Balance, T08-Kapitulationsformel mit RF.simFight) → DESIGN_LOCKED. Empfohlene Bauordnung: T09 S1 → T08 S1/S2 → T10 S1/S2 → Rest.

---

FROM: Feature Designer (Agent 3, dritter Auftrag) · TO: Lead · 01.10.2026

TASK: „Varonheim wird belagerbar“ festschreibbar machen.

CURRENT STATE: Vorschlag in `ROTFALL_AGENT_STATE/proposals/varonheim_belagerung.md` (Knoten, Bedrohung → Heerzug, Belagerung mehrtägig, vier Spielerwege, Fall/Exil/Hof, Rückeroberung, Kult, §5g.8, Codeplan, 9 Proben, 4 Scheiben, Messung). Status WAITING_FOR_DEVELOPER, 4 Fragen (§18). Nichts in `src/` oder `docs/` geändert.

IMPORTANT DISCOVERIES (FAKT):
- Ohne eigenen Auslöser erreichen die Toten Varonheim nie (Python-Nachbau der kopflosen Schleife, 200 Läufe × 60/120/200 Tage, 0 % Fall in allen Szenarien) → Heerzug über `S.war.capThreat` nötig.
- Entsatz ist heute ein Teleport nach Nordfurt (sim.js:375–378); `afterBattle` gibt dem Sieger einer Heer-gegen-Heer-Schlacht den Knoten (sim.js:311) → ein verlorener Entsatz würde die Hauptstadt übergeben; Sonderregel nötig.
- `die` setzt bei jedem Tod des Königs Valen −100, ohne `source` zu prüfen (game.js:3551) → Bug, sobald der König außerhalb der Burg sterben kann.
- `capture` schickt Flüchtlinge fest nach Eren (sim.js:326); `aurelFreed` leert `S.after.tmul` komplett (game.js:~10217).
- `TOWN_PLAN.varonheim.village === true` (world.js:1394) sperrt `armyTargets` (game.js:6110) für den Totenfürst-Spieler.
- `continueGame` ruft `ensure*` vor `SIM.initSim()` (game.js:2058 vor 2112) → neue ensure-Funktionen müssen ohne Knoten auskommen.
- Probe „Audit T02“ (game.js:17028) bricht mit der neuen Entsatzregel → anpassen (Varonheim Valen lassen, Entsatz `at === 'varonheim'`).
- Nachbau ist valenfreundlicher als die Hunter-Messung → Scheibe 1 muss im Spiel nachmessen (6× „Krieg 10 Tage vorspulen“).

RELEVANT FILES: sim.js (warTick 254, resolveNode 276, battleAbstract 297, capture 314, warDay 356, materialize 385, battleCheck 448), data.js 1332–1347, world.js 1357–1394, game.js (die 3551, armyTargets 6110, keepSiege 7858–7880, Varon 8215–8300, AF/afterSay 9938, aurelFall 10188, Kult 12602–12890, Debug-Krieg 14134, Proben 17028/17170).

DECISIONS (meine, VORSCHLAG): Kanten nur Nordfurt und Aschfurt (am Ende angehängt); Besatzung 60/+3, Mauern 100/+10; Heerzug 70 (Sehr schwer 80) ab Bedrohung 20, kein Heerzug auf Angsthase/nach Garmadon; Entsatz bleibt, entsteht in Varonheim, nicht bei Belagerung; Fall → Kult „ruling“ → „hidden“, Krönungsuhr ruht; zerstreute Adlige kehren nie zurück; Totenfürst ab Rang 3 (Scheibe 4, streichbar).

OPEN QUESTIONS: F1 Gefährlichkeit · F2 Exilort · F3 Endgültigkeit · F4 §5g.8 nach Fall/Königstod (Wortlaut in §18).

BLOCKERS: Entwickler-Antworten; T02 und T07 sollten VERIFIED sein, bevor Scheibe 1 startet.

EXPECTED NEXT STEP: Lead legt F1–F4 vor → DESIGN_DECISIONS.md → Systems Designer/Kampf-Spezialist prüfen §17 im Spiel → DESIGN_LOCKED → Scheibe 1.
