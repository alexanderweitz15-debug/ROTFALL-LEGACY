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
