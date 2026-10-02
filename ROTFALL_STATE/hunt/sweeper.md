# Sweeper — Hunt 1 (02.10.2026)

Arbeitsweise: statische Prüfung über src/*.js und index.html (grep, Python-Parser für data.js-Tabellen). **Browser/Selbsttest-Teil des Auftrags konnte nicht ausgeführt werden** — siehe „Nicht geprüft“. Keine Spielcode-Änderung.

## Kandidaten

### SW-01 · `.find(...).name` ohne Null-Prüfung bei Aurelion-Häusern/Rat
- **Ort:** `src/game.js:6593` (`aurelDay`), `6603` (`intrigueTick`, 2×), `6651` (Intrigen-Abschluss), `9870` (`councilDecide`), `9892` (Rat-Dialog, 2×), `17510` (Selbsttest-Elixier-Probe).
- **Was passiert:** `AUREL_HOUSES.find(h => h.key === X).name` bzw. `COUNCIL.find(m => m.key === k).name` wird direkt ohne `?.` an `.name` gehängt. Wenn `find` `undefined` liefert, stürzt die Stelle mit `TypeError: Cannot read properties of undefined` ab.
- **Was passieren sollte:** Entweder ist durch Konstruktion garantiert, dass der Schlüssel immer existiert (dann ungefährlich), oder es fehlt eine Absicherung.
- **Auslöser:** `S.aurelJob.house` bzw. `S.intrigue.vs`/`.from` referenziert einen `key`, der nicht (mehr) in `AUREL_HOUSES`/`COUNCIL` steht — z. B. ein alter Spielstand aus einer Version, in der die Häuser-/Ratsliste anders aussah, oder ein künftiger Edit an `AUREL_HOUSES`/`COUNCIL`, der einen Key entfernt/umbenennt, während `S.aurelJob`/`S.intrigue` (nicht in `SKIP`, werden also gespeichert) den alten Key noch tragen.
- **Beleg:** `grep -noE "\.find\([^()]*\)\.[A-Za-z_][A-Za-z0-9_]*" src/game.js | grep -v "?\."` liefert genau diese 6 Stellen (8 Treffer). Code gelesen (siehe Zeilen oben) — in allen aktuell im Code sichtbaren Zuweisungen (`S.aurelJob = { house: H.key, ... }` bei `6653`, `S.intrigue = { from: H.key, vs: vs.key, ... }` bei `6657`) stammt der Key im selben Lauf immer aus `AUREL_HOUSES`/`COUNCIL` selbst — innerhalb einer Sitzung also unverdächtig.
- **Sicherheit:** niedrig–mittel. Kein beobachteter Crash (Selbsttest/Spiellauf nicht möglich, siehe unten); die Gefahr ist strukturell (Save-Kompatibilität bei künftigen Daten-Edits), nicht akut im jetzigen Code nachgewiesen.
- **Vorschlag zur Reproduktion:** In `AUREL_HOUSES` oder `COUNCIL` (Test-Build) einen Eintrag entfernen/umbenennen, dann einen Spielstand mit `S.aurelJob.house` bzw. `S.intrigue.vs` auf den alten Key laden und `aurelDay()`/`councilDecide()`/Rat-Dialog aufrufen.

### SW-02 · `ITEMS.__wall` im Selbsttest ist ein Schreibzugriff auf die globale Datentabelle
- **Ort:** `src/game.js:16726-16727` (Waffen-P7-Probe).
- **Was passiert:** Die Probe schreibt `ITEMS.__wall = {...}` auf das echte, modulweite `ITEMS`-Objekt (nicht auf eine Kopie) und löscht es danach wieder (`delete ITEMS.__wall`).
- **Was passieren sollte:** Laut `FORMATS.md`/`CLAUDE.md` sollen Proben nur Sandkästen (`sandbox()`/`stage()`/`actor()`) anfassen; `ITEMS` ist eine geteilte, importierte Konstante, kein Sandkasten-Objekt.
- **Auslöser:** jeder `RF.selftest()`-Lauf durchläuft diese Probe.
- **Beleg:** Zeilen gelesen, siehe oben. Zwischen dem Setzen und dem `delete` liegen mehrere Codezeilen (`dealt('longsword', sh)`, `dealt('warhammer', sh)`); läuft zwischen diesen Zeilen parallel/asynchron etwas anderes, das `ITEMS.__wall` läse (unwahrscheinlich, da synchron), wäre das ein Fenster für Seiteneffekte.
- **Sicherheit:** niedrig (wirkt in der Praxis harmlos, da synchron und am Ende aufgeräumt) — als Hinweis, nicht als bewiesener Bug.
- **Vorschlag zur Reproduktion:** `RF.selftest()` einmal mit einem Haltepunkt/Log direkt nach der Zuweisung laufen lassen und prüfen, ob irgendein anderer Code in diesem Fenster `ITEMS.__wall` liest.

## Selbsttest-Läufe

**Nicht durchgeführt.** Der Browser-Tab-Pool war während des gesamten Laufs ausgeschöpft (`mcp__Claude_Browser__tabs_create` lieferte wiederholt `Could not open a new tab (... tab cap reached)`; belegte Tabs laut `tabs_context`: tab-10, 13, 14, 15, 17, 20, 31, 32, 34 — alle `http://localhost:8770`, keiner als „frei“ erkennbar). Mehrere Versuche über den Lauf verteilt, kein Erfolg. Damit konnten weder `RF.selftest()` (3×), noch `RF.tick()`-Spielzeit in Welt/Varonheim/Dungeon, noch die Konsole live geprüft werden.

## Hinweise für Hunter

- SW-01 (Aurelion-Häuser/Rat `.find().name`): verdient einen echten Testlauf — Spielstand mit künstlich ungültigem `S.aurelJob.house`/`S.intrigue.vs` laden und `aurelDay()` bzw. den Rat-Dialog auslösen, um zu sehen, ob es tatsächlich crasht oder ob an anderer Stelle (z. B. Migration in `continueGame()`) bereits abgesichert wird (das habe ich nicht gefunden, aber nicht vollständig ausgeschlossen).
- Browser-Selbsttest/Konsolen-Check aus dem Auftrag (Schritt 1) steht komplett aus — sollte ein anderer Agent/Lead übernehmen, sobald ein Tab frei wird, inklusive RB-060-Nachprüfung (3× `RF.selftest()`, siehe BUGS.md).
- Datenbank-Querverweise (ITEMS/MONSTERS/ABILITIES/QUESTS/ELITES/BOSS_LOOT/FACTIONS/RECIPES/CLASSES/TITLE_CLASSES) wurden per Skript gegen alle `TABLE.key`/`TABLE['key']`-Zugriffe in game.js/world.js/sim.js/economy.js/ui.js geprüft — keine fehlenden Referenzen gefunden (alle ursprünglichen Treffer waren Fehlalarme: Kommentartext oder Teilstring-Kollision, z. B. `TITLE_CLASSES.x` fälschlich als `CLASSES.x` erkannt). Zugriffe über Variablen (`TABLE[variable]`) sind damit **nicht** abgedeckt — das bräuchte Laufzeitprüfung.

## Nicht geprüft

- Live-Spiel/Browser komplett (Schritt 1 des Auftrags): kein freier Tab, siehe oben. Keine Konsole, kein `RF.selftest()`, kein `RF.tick()`.
- Dynamische Datenprüfung über `import('/src/data.js?v=23')` im Browser (Auftragsvorschlag) — nicht möglich ohne Tab; stattdessen rein statische Python-Extraktion der Top-Level-Keys von `ITEMS`, `MONSTERS`, `ABILITIES`, `QUESTS`, `ELITES`, `BOSS_LOOT`, `FACTIONS`, `TITLE_CLASSES`, `CLASSES`, `SKILL_TREE`, `RECIPES`, `WAR_NODES`, `TOWNS` (keine doppelten Top-Level-Keys gefunden) und Kreuzvergleich mit `TABLE.key`-Literalen in game.js/world.js — Rezepte/Zutaten-Inhalte, Wertebereiche (z. B. `value`, `slot`) und NPC-Array (`NPCS`, `GOBLIN_VILLAGE`, `AUREL_HOUSES`, `COUNCIL` — letztere drei auf doppelte `key`s geprüft, NPCS selbst nicht, da andere Feldstruktur) wurden nicht inhaltlich geprüft.
- Schleifen-Mutations-Suche (Python, `for(i<arr.length;i++)` + `arr.push/splice` im selben Block) fand nur 2 Treffer, beide klassische/absichtliche BFS-Muster (Zeilen 15541, 16915) — kein Bug. Die Suche deckt nur dieses eine for-Muster ab, nicht `for...of`/`forEach`/`while`.
- „Code hinter `//` auf derselben Zeile“ (Projektregel) — keine verlässliche automatische Prüfung in der verfügbaren Zeit gefunden; nur stichprobenhaft über andere Greps mitgelesen, nichts Auffälliges gesehen.
- Copy-Paste-Blöcke mit nicht umbenannter Variable — keine systematische Duplikatsuche über große Codeblöcke durchgeführt (zeitlich nicht machbar bei ~19k Zeilen ohne Werkzeugunterstützung).
- TODO/FIXME/HACK/XXX/„noch nicht implementiert“: `grep -nE "\b(TODO|FIXME|HACK|XXX)\b" src/*.js` → keine Treffer. „noch nicht“ kommt nur in Spielertexten/Dialogen vor (keine Bugs beschrieben, z. B. „Stealth wächst noch nicht durch Übung“ in `ui.js:756` — das ist ein dokumentiertes Zukunfts-Feature, kein Fehlverhalten).
- `index.html` nur auf die Versionsnummer (`v23`, konsistent mit `CLAUDE.md`) geprüft, nicht auf andere Fehler.
- Division-durch-Null- und Typvergleich-Suchen waren nur stichprobenhaft (wenige Regex-Muster); keine erschöpfende Analyse.

## Beobachtungen

- `TOWNS` in `data.js` hat nur 2 Einträge (`eren`, `northcity`) — wirkt im Vergleich zu `TOWN_PLAN` (viele Städte) unvollständig, ist aber vermutlich nur eine alte/reduzierte Referenztabelle für Wirtschafts-Basiswerte, keine vollständige Städteliste. Nicht weiter verfolgt (Stilfrage, keine Zeit für Tiefenprüfung) — ggf. Fit-Befund für einen anderen Agenten, falls `TOWNS` irgendwo aktiv benutzt wird, wo neuere Städte fehlen.
