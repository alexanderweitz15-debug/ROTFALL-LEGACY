# PERF-U (Update/KI) — Ergebnis 02.10.2026

## Messwerte update (Median ms je Bild, bench.js, 120 Bilder; mehrere Läufe, CPU geteilt)
| Szene | vorher (eigene Messung / Lead) | nachher (3 Läufe) |
|---|---|---|
| Varonheim Markt | 5,2 / 6,1 | 1,2 · 1,2 · 1,1 |
| Aurelheim | 5,1 / 5,1 | 1,3 · 1,2 · 1,1 |
| Nordfurt | 5,8 / 5,6 | 1,5 · 1,4 · 1,4 |
| Wildnis | 5,0 / 4,8 | 0,8 · 0,9 · 0,8 |

Gesamt (mit PERF-R-Stand zum Messzeitpunkt): 2,9–4,3 ms; p95 im 2./3. Lauf 4–9 ms (1. Lauf nach dem Laden höher: Aufwärmen/JIT).

## Profil vorher (Abschnittszeiten in einer instrumentierten Kopie, inzwischen gelöscht)
think-Schleife über alle ~2040 Handelnden 2,1–2,8 ms · mountTick 0,85–1,0 ms (horseEnt: find über 17 000 Einträge je Bild, ohne Pferd ganz)
· combat-Filter 0,35–0,4 · Karawanen/escortsOf 0,3–0,4 · HUD-Block 0,4–0,56 (davon interactables ~0,2) · separate 0,13–0,25.
Ursache fast überall: megamorphe Eigenschaftszugriffe — jede Figur hat eine andere Form, ~50–100 ns je Zugriff; jede Voll-Schleife kostet.

## Maßnahmen (alle in src/game.js)
1. `horseEnt` merkt sich Fund + Index (gilt bei gleicher Liste/Länge, Eintrag noch am Platz, ≤ 3 s); kleine Karten wie vorher.
2. Stufenplan `tierOf` (+ `think(e, dt, pre)`): einmal je ACT-Neubau/15 Bilder/160 px Heldenweg wird ACT.list sortiert in
   hot (jedes Bild wie bisher), mid (ruhige Bewohner > 1150 px: jedes 3. Bild ×3 wie bisher, gestaffelt statt Zähler),
   cold (ruhige Bewohner > 1950 px: jedes 16. Bild ×16, vorher 8.), ruhige Gegner > 1400 px ganz aus (think tat dort nichts),
   pool (≤ 1950 px) → `combat`. Liegende, Zornige, Fliehende, Gruppe, Wachen, Elite, mit Zustand/Hieb, Prügelei/Panik bleiben hot.
   Zufallsaufrufe nur in hot, Reihenfolge unverändert. Unter 600 Handelnden (Selbsttest, Höhlen) alter Weg.
3. Karawanen-Wachen aus dem Stufenplan (Welt) bzw. `worldCars()`-Cache (außerhalb der Welt: vorher 2 Voll-Suchen je Bild).
4. `conTick`: filterte S.ents.world jede Sekunde neu → neue Liste → ACT, byId und render-Raster bauten jede Sekunde komplett neu.
   Jetzt nur bei wirklich zu Entfernenden; Eskorte/Auftraggeber/Ziele aus actorsOf.
5. `respawnTick`: je Spawngebiet (~80) ein Filter über die ganze Karte (Ruckler ~80 ms alle 12 s) → Gegner je Karte einmal sammeln, Neue nachtragen.
6. `interactables` über neues `nearEnts` (128-px-Raster ruhender Dinge + live Bewegliches + actorsOf).
7. `reactTick`, `tribTick`, `bondTick`, `dodonOf`: Liste der Handelnden statt S.ents.world. `separate`: Zahl- statt Text-Schlüssel.

## Selbsttest
377/377 PASS (nach allen Änderungen). Stichproben: Ansprech-/Holz-Hinweis auf der Welt korrekt; ferne Bewohner wechseln ihre Tagesblöcke (608/608 in 3 Spielstunden).

## UNVERIFIED / Restrisiko
- Bis ≤ 250 ms (bzw. 15 Bilder) Verzögerung, wenn eine ferne ruhige Figur ohne Listenänderung plötzlich in Reichweite gesetzt wird
  (z. B. placeAway-Teleport) — sie denkt dann kurz im 3er/16er-Takt bzw. fehlt kurz in `combat`.
- Fernkampf/Status, der eine kalte Figur trifft, wirkt erst nach dem nächsten Neubau (≤ 250 ms) auf ihren Takt.
- Koop-Host nicht eigens getestet (läuft durch dieselbe update-Schleife).

## Nächste Hebel (Spitzen → p95)
- `byId` (state.js, PERF-S): baut alle 250 ms eine Map über ~17 000 Einträge (~1–3 ms Spitze, 4× je Sekunde).
- `actorsOf`: Voll-Durchlauf alle 250 ms (~1 ms); mit byId zu einem gemeinsamen Durchlauf zusammenlegen oder Takt auf 1 s.
- tierOf-Neubau (~1 ms alle 15 Bilder) zeitlich von ACT/byId entkoppeln oder über Bilder verteilen.
- Stunden-Haken mit Voll-Suchen: ensureOmegaShrine, fortressHour/fortLifeHour/riders, cultMasks, hourTick (Festtag), roadTick-Filter.
- HUD-Block (alle 180 ms): HOUSES.find(playerInside), LOCATIONS-Schleife, UI.refreshHUD (PERF-S).
