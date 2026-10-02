# Performance (Entwickler 02.10.2026: „wir brauchen die 3-ms-Marke … z. B. dass Städte gecacht werden“)

Ziel: Median je Bild (update + Zeichnen) ≤ 3 ms in allen Bench-Szenen; p95 deutlich runter (heute bis 58 ms).
Messung: `ROTFALL_STATE/perf/bench.js` (Anleitung im Kopf der Datei). Rauschen: andere Agenten nutzen denselben Browser — mehrfach messen, Median der Mediane.

## Ausgangswerte (Lead, Commit 1a6e7b0, 60 Bilder je Szene)
| Szene | Entitäten Welt | update ms | draw ms | gesamt ms | p95 ms |
|---|---|---|---|---|---|
| Varonheim Markt | 16 996 | 6,1 | 9,9 | 16,9 | 57,9 |
| Aurelheim | 16 996 | 5,1 | 7,6 | 13,0 | 35,7 |
| Nordfurt | 16 996 | 5,6 | 6,2 | 12,0 | 44,7 |
| Wildnis | 16 996 | 4,8 | 4,2 | 9,2 | 26,8 |

## Zuständigkeiten (je Agent eigene Dateien/Bereiche — nicht in fremden Bereichen ändern)
- **PERF-R (Zeichnen):** render.js (+ buildings.js, atlas.js). Städte/Häuser/Dächer/statische Props in Offscreen-Ebenen cachen, Culling, Batching, Licht/Wetter/Partikel. NICHT fig5.js/sprites.js/figure.js (Artist arbeitet dort).
- **PERF-U (Update):** game.js Hauptschleife und KI (update, think, updateEnemy/updateNpc/partyAI, Ticks, Abfragen über S.ents.world). Räumliches Gitter statt Voll-Schleifen, ferne Entitäten seltener, keine Allokation je Bild.
- **PERF-S (Hintergrund + UI):** sim.js, economy.js, ui.js (HUD/DOM), state.js (Speichern), Stunden-/Tageshaken (Spitzen → p95), Speicher-/Müllspitzen.
Regeln: keine Spielregel ändern, kein neuer rnd()-Aufruf (Proben/Weltgen), Selbsttest grün, Spielstand-Sicherheit wie in HUNT.md, Inline-Kommentare nur /* */, Zeilenenden erhalten (game.js/sim.js CRLF — nie sed -i), vor jedem Edit die Stelle frisch lesen (andere arbeiten parallel in derselben Datei). Kein Commit (der Lead committet).
