# Bugs

Eine Zeile je Bug (ausführliche Berichte: ROTFALL_AGENT_STATE/HANDOFFS/bug_to_implementation.md). Übernommen aus BUG_DATABASE.md.


Ältere Fehler: `docs/BUGS.md`.

| ID | Titel | Schwere | System | Status |
|---|---|---|---|---|
| RB-001 | Untote nehmen ohne Eingriff alle 15 Kriegsknoten in 15 Tagen | HIGH | sim.js Krieg | TESTING (Gegengewicht, 60-Tage-Messung wogt) |
| RB-002 | simFight lässt neue S-Schlüssel (S.difficulty) zurück | MEDIUM | game.js simFight | TESTING (Hunter-Fix) |
| RB-003 | ARMY_CAP ohne S.difficulty = 80 statt 110 | LOW | sim.js | TESTING (Hunter-Fix) |
| RB-004 | Seuchenende setzt sick=false auf jede Entität, 14 000 Props voll gespeichert | HIGH | game.js Seuche, Speichern | TESTING (Fix + Bereinigung beim Laden) |
| RB-005 | Geist-Partikel malen den Helden | CRITICAL | render.js | TESTING |
| RB-006 | Zufallsabhängige Proben (Kutsche, Raserei, Ruhm) | LOW | Selbsttest | TESTING (Proben robust) |
| RB-007 | Tageswechsel mit `if` statt `while` (Hunter-Vorschlag) | LOW | game.js update | REJECTED: `if` verarbeitet jeden Tag einzeln, `while` würde dayTick überspringen |
| RB-008 | Slotwechsel direkt nach save() schreibt den Stand in den neuen Slot | CRITICAL | state.js save/flushSave, setSlot | TESTING (setSlot schreibt Ausstehendes sofort in den alten Platz; live geprüft) |
| RB-009 | readRaw liefert null für komprimierten Slot, der nach dem Boot entstand (anderer Tab) | MEDIUM | state.js readRaw, game.js slotCards/continueGame | TESTING (Cache mit Rohwert, Nachentpacken bei Laden/Fortsetzen/Liste; live geprüft) |
| RB-010 | Zollgesetz senkt das Überfallrisiko nie (economy.js:284 gegen game.js:9126) — Verdacht des Designers | ? | economy.js | zu prüfen in T09 |
| RB-011 | Stand zwischen Tod und Erbenwahl gespeichert: lädt er richtig? — Annahme des Designers | ? | game.js continueGame | zu prüfen in T10 |
| RB-013 | Sonnenbrand verteilt sich über Trefferzonen, kommt nur zu ~60 % an (Hunter 3) | HIGH | game.js hurt/vampTick | TESTING (Schadensart 'sun' trifft den Rumpf; Probe misst die Menge) |
| RB-014 | Kult-Haken in die() fielen bei fernen/verbündeten Toten weg (Aldhelm-Tod ohne Folgen) | HIGH | game.js die | TESTING (Haken vor den Ausstieg gezogen) |
| RB-015 | Licht im Bosskampf zählte während der Unverwundbarkeit gegen den Deckel | LOW | game.js aldhelmAI | TESTING |
| RB-016 | Gemischte Zeilenenden in game.js durch die Bearbeitungshilfe | LOW | Werkzeug | VERIFIED (normalisiert, Hilfe korrigiert) |
| RB-017 | T08-Feld `captive` kollidierte mit den Goblin-Gefangenen der Kette (Konvoi stand still) | HIGH | game.js | TESTING (Feld heißt `prisoner`; Eisenmark-Probe grün) |
| RB-018 | `acceptContract` gibt nichts zurück — Rückgabeprüfung entfernte neue Aufträge | MEDIUM | game.js captiveAsk/informantDay | TESTING |
| RB-019 | Hedda verkauft 7–28 Blutphiolen am Tag statt 3 (Hunter 4; dort RB-017 genannt) | HIGH | game.js shopStock | TESTING (fester Tagesbestand `fixedStock`) |
| RB-020 | Befreite Verschwundene konnten erneut entführt werden (Hunter 4; dort RB-018 genannt) | MEDIUM | game.js cultTake | TESTING |
| RB-021 | Balance-Messung Aldhelm mit `ehp` umging den Boss-Faktor ×2 (Grundleben 560 war zu hoch) | MEDIUM | data.js aldhelm, docs/BALANCE.md | TESTING (Grundleben 340, 8 Seeds nachgemessen) |
| RB-022 | Proben sicherten nur `S.prices`; nach T09 verändern Ereignisse Stadtlager und Zoll | LOW | Selbsttest | TESTING (Sicherungen erweitert, BUG-123 grün) |
| RB-023 | Stirbt König Varon, fällt Valen auf −100 — egal wer ihn tötet (`game.js` die, `source` ungeprüft; Designer-Befund) | MEDIUM | game.js die | TESTING (Belagerung S2: nur Spieler/Gruppe; Probe „RB-023“) — alt: OPEN (gehört zu Varonheim-Belagerung / Rote Krönung) |
| RB-024 | Fesseln setzte `anchor: null` — nach Loslassen/Losreißen warf die Gegner-KI jedes Bild einen Fehler (Hunter 5, dort RB-023) | CRITICAL | game.js captiveMenu/captiveTick | TESTING (Anker bleibt, beim Loslassen neu gesetzt; Probe RB-024) |
| RB-025 | Hauptmenü zeigte „v22“ (index.html:71) | LOW | index.html | TESTING |
| RB-026 | Automaten-Wachen nahmen keine Gefangenen an (robotTalk vor captiveChoices) | MEDIUM | game.js talk | TESTING |
| RB-027 | Ab „Schlächter“ ergaben sich noch 8–16 % (Nutzer: niemand) (Control 2) | MEDIUM | game.js updateEnemy | TESTING (`surrenderP`, Probe „Control 2“) |
| RB-028 | `deleteSlot` schreibt bei ausstehendem Speichern in den gelöschten Platz (Control 2) | LOW | state.js | OPEN |
| RB-029 | Handel billig/teuer ohne Grenze (+71 % je Stück), Verkauf füllte kein Lager (Control 2) | MEDIUM | game.js sell/rawPrice | TESTING (Verkauf +0,5 Lager, Verkaufsfaktor ≤ 1,3; Probe „Control 2“) |
| RB-030 | Vampir-Spieler brannte im Lichtschacht nicht (Control 2) | MEDIUM | game.js sunOn | TESTING (Probe „Control 2“) |
| RB-031 | Nach der Erpressung ist das Rote Siegel weg — Kult nie mehr zerschlagbar (Control 2) | MEDIUM | game.js cultPathChoices | WAITING_FOR_DEVELOPER |
| RB-032 | Text der Roten Krönung nennt eine Ausgangssperre, die es nicht gibt (Control 2) | LOW | game.js cultCrown | TESTING (Text geändert) |
| RB-033 | Gift, Feuer, Blutung kommen nur zu ~60 % an (Control 2) | LOW | game.js status | OPEN (Systems-Entscheid) |
| RB-034 | Ahnenfeind: die alte Mörder-Figur sperrte jede neue Begegnung, wenn er weiterzog (Hunter 6, dort RB-027) | HIGH | game.js nemesisTick | TESTING |
| RB-035 | Heldentod während einer Kamerafahrt: Speichern verworfen (guardSave), Tod nicht gesichert (Hunter 6, dort RB-028) | HIGH | game.js playerDeath | TESTING (cineEnd vor dem Speichern) |
| RB-036 | Ahnenfeind heilte bei jedem Neuerscheinen voll (Hunter 6, dort RB-029) | MEDIUM | game.js nemesisTick/Day | TESTING (hpFrac, +20 %/Tag; Probe „RB-036“) |
| RB-037 | `cultHeroDied` lief vor der Stumm-Prüfung in Proben (Hunter 6, dort RB-030) | LOW | game.js playerDeath | TESTING |
| RB-038 | Entsatz-Vorrang: mehrere Valen-Heere vor Varonheim kämpften einzeln (Verifier 7) | HIGH | sim.js warTick | IMPLEMENTED (vereinen sich; Probe „RB-039 + RB-038“) |
| RB-039 | Gewöhnliche Totenheere zogen ohne Heerzug auf Varonheim (Verifier 7) | HIGH | sim.js warTick | IMPLEMENTED (Hauptstadt nur für Heerzug/Befehl Ziel) |
| RB-041 | Erpressungs-Dialog (cultPathChoices) warnt vor der Wahl „Abgemacht“ nicht, dass das Rote Siegel damit für immer weg ist und die Rote Krönung ausgelöst wird; die Folge steht erst im Log danach (Verifier, Blutkult S2–S5) | MEDIUM | game.js cultPathChoices | OPEN |
| RB-042 | Neues Spiel: schon an Tag 1 (nicht erst Tag 4) zeigt baseMul in mehreren Städten den Deckel 1,8× bzw. den rohen Faktor 3 (z. B. northcity Korn use 8,64 → Lager nur 12 statt ~45 bei 80 % Zielwert; eren Leder-Lager 0) — Startlager/Zielwert-Rechnung in initEco/economy.js passt für manche Waren-Stadt-Kombinationen nicht zur Bevölkerung (Verifier, T09) | HIGH | economy.js initEco/target | OPEN |
