# Fehlerdatenbank (ab 01.10.2026)

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
| RB-023 | Stirbt König Varon, fällt Valen auf −100 — egal wer ihn tötet (`game.js` die, `source` ungeprüft; Designer-Befund) | MEDIUM | game.js die | OPEN (gehört zu Varonheim-Belagerung / Rote Krönung) |
