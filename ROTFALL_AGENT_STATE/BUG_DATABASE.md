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
