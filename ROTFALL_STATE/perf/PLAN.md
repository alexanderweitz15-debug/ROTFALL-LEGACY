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

## Stand nach Runde 1 + PERF-U2 (Teil), Lead-Messung 02.10.2026 (Commit 0e02b74, 150 Bilder, andere Agenten liefen parallel)
| Szene | update | draw | gesamt | p95 |
|---|---|---|---|---|
| Varonheim Markt | 0,8–1,5 | 1,2–2,0 | 2,1–3,7 | 4,5–11,7 |
| Aurelheim | 0,9–1,0 | 1,2 | 2,4 | 6,5–7 |
| Nordfurt | 1,2–1,3 | 1,9–2,0 | 3,3–3,4 | 9–15 |
| Wildnis | 0,7–0,8 | 0,8–0,9 | 1,7 | 3,6–4,5 |
- Median ist in Wildnis/Aurelheim/Varonheim (ohne Last) unter 3 ms, Nordfurt knapp darüber. Offen: Ausreißer (p95). Ursache laut Messung: einzelne Bilder mit 20–30 ms beim Zeichnen von NPCs (keine Frame-Cache-Fehlgriffe — die kosten nur ~1 ms), vermutlich Müllsammlung oder seltene Pfade; dazu Stunden-/Tageshaken (perf_s.md).
- Nächste Runde (PERF-U2 wurde durch Nutzungsgrenze abgebrochen): Ausreißer gezielt jagen (Bilder > 10 ms protokollieren und zuordnen), Allokationen je Bild senken.
