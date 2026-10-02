# Reproduktions-Liste 3 (Quests, neutral)
Je Eintrag: Behauptung (Titel), Ort, Auslöser, Repro-Vorschlag. Urteil: CONFIRMED / NOT REPRODUCED / CANNOT TEST.

### R-QA-01 Paladinprüfung „Der Schrein“ läuft an der falschen Stelle
- **Ort:** game.js:12365 (`offerQuest`), :12441 (`questCheck`).
- **Auslöser:** q_paladin3 annehmen.
- **Reproduktion:** `?dev`, `RF.S.quests.q_paladin2={state:'done',progress:[1]}`, `RF.S.relations.kelan=20`; q_paladin3 bei Kelan annehmen; Positionen der neuen Skelette ausgeben und mit `LOCATIONS.find(l=>l.key==='shrine')` vergleichen.

### R-QA-02 Mönch-Klassenaufträge c_mon1–3 sind unerfüllbar
- **Ort:** game.js:13858 (`evaded`); data.js:1174–1179.
- **Auslöser:** Als Mönch Grad II c_mon1 annehmen und ausweichen.
- **Reproduktion:** Mönch Grad II, c_mon1 starten, Ausweicher erzeugen, `RF.S.quests.c_mon1.progress` bleibt [0].

### R-QA-03 Vampir friert nach dem Laden ein
- **Ort:** game.js:2918 (Steuerungssperre), :13266 (`vampFrenzy` setzt `frenzyT = performance.now()+dur`); Lade-Reset ~2075–2111 enthält `vamp` nicht.
- **Auslöser:** Als Vampir einmal Raserei nach längerer Sitzung, speichern, neu laden.
- **Reproduktion:** Wegwerf-Slot, `RF.S.player.vamp={frenzyT: performance.now()+3.6e6}`, speichern, neu laden: Spieler bewegt sich nicht.

### R-QA-04 Herausforderung an Weißbart sperrt ihn für immer
- **Ort:** game.js:7813; `parley` wird nur beim Erzeugen gesetzt (7740 bzw. `spawnEnemy` mit parley).
- **Auslöser:** „Ich fordere dich heraus“, dann fliehen.

### R-QA-05 Königsauftrag abbrechen beendet die Varon-Reihe für immer
- **Ort:** game.js:6911 (`cancelQuest` → `failContract`), :8887 (Angebot nur bei Q 0), :8912ff (`royalStart`/`royalTick`).
- **Auslöser:** Im Auftragsbuch „König Varon: …“ abbrechen.

### R-QA-06 q_mine unerfüllbar, wenn Gorak vor der Annahme stirbt
- **Ort:** game.js:1832 (Gorak einmalig), `startQuest` 12349ff (Vorab-Anrechnung nur für Hrodvar und Regionalbosse).
- **Auslöser:** Grube vor dem Gespräch mit Mara säubern.

### R-QA-07 Geleitschutz für den Tributzug wird als Raub gewertet
- **Ort:** game.js:5825 (`byPlayer`), :5801 (Hinterhalt).
- **Auslöser:** Zug begleiten, Hinterhalt nicht schnell genug stoppen.

### R-QA-08 „Die Pferche öffnen“ hängt nach Vargs Fall
- **Ort:** game.js:5579 (`openPen` kehrt bei `chainsBroken` oder leerem Pferch zurück); kein anderer Code schließt q_pferch.

### R-QA-09 „Die Spur des Rotfalls“ wird nie abgeschlossen
- **Ort:** game.js:9200–9204 (`omegaFrag`); data.js `q_rotfall.reward.xp 400`.

### R-QA-10 Dodon bleibt nach abgebrochenem Sturm stumm
- **Ort:** game.js:7760 (`stormCheck` setzt `parley` und `anchor` nicht zurück; `goblinStorm` hatte `parley=false` gesetzt).

### R-QA-11 Aldhelm steht nach dem Tod des Spieler-Blutfürsten wieder auf
- **Ort:** game.js:13632 (`cultHeroDied` → `end='hidden'`); `buildCatacombs` 13452 (+33): prüft `end`, nicht `aldhelmDead`.

### R-QA-12 Abbrechen und neu annehmen häuft dauerhafte Gegner an
- **Ort:** game.js:7790 (`seaQuestStart`), 7785 (`seaTagSpawn` ohne `transient`), 6331 (`spawnChainRest` ohne `transient`); `cancelQuest` 6911 erlaubt das Neuangebot.

### R-QA-13 Rangaufträge zielen auf Gegner, die es nach Vargs Fall kaum noch gibt
- **Ort:** game.js:1795 (`spawnType`), 12790ff (Valen 4b, Untote 4b), g_dod2.

### R-QA-14 c_nec2: Wegpunkt zeigt auf die Nekropole, der Wächter steht dort nie wieder
- **Ort:** `QUEST_WHERE.c_nec2`; `urnRite` 12290 (Wächter nur bei aktivem q_pact); einzige weitere Quelle ist der Boss der Tempelgruft (10235).

### R-QA-15 Fern oder von Verbündeten getötete Regionalbosse zählen nicht
- **Ort:** game.js:3617–3625 (früher Ausstieg ohne `onKill`/`regionBossSlain`); 1778 (`ensureRegionBosses` beim Laden).
- **Reproduktion:** Graumähne von Begleitern töten lassen, während der Spieler weiter als 500 px weg ist.

### R-QA-16 Einmalige Quest-Gegenstände sind verkaufbar, der Auftrag hängt dann ewig
- **Ort:** `sell` 13001 (sperrt nur `bound`); scout_report (world.js:2001), kings_iron (world.js:2321).

### R-QA-17 Ratssitz zahlt die 600 EP nicht aus
- **Ort:** game.js:9929 (`corvanTalk` setzt `done` ohne `turnIn`/`gainXp`); data.js `q_ratssitz.reward.xp 600`.

### R-QA-18 Heiliges Gericht: Gold und Gunst ohne Grenze
- **Ort:** game.js:10016 (Klage deterministisch, +350 für 100), 10027 (Verhandlung +3 Gunst je Klick, keine Tagessperre).

### R-QA-19 Entführtes Kind wird nie zurückgegeben
- **Ort:** game.js:13711 (`kid.taken = true`, `kidId` gesetzt); `kidId` wird nirgends gelesen, `taken` nie zurückgesetzt.

### R-QA-20 „Verborgene Truhe“ im Gewölbe beliebig oft plünderbar
- **Ort:** game.js:10295 (Truhe bei jedem Neubau, ohne Eintrag in `prog`).
