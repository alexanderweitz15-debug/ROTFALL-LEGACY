# PERF-R (Zeichnen) — 02.10.2026

Dateien: nur `src/render.js` (buildings.js, atlas.js, game.js unverändert).

## Profil vorher (Abschnitte in drawFrame, Mittel je Bild, Bench-Szenen, Nacht ~4:46)
Eingeschwungen (Kamera steht): Gesamt 2,5–4,3 ms. Größte Posten:
| Posten | ms | Ursache |
|---|---|---|
| Bosslebensbalken | ~1,0 | `S.ents[map].find` + hypot über ~17 000 Objekte je Bild |
| Licht | ~0,75 | Kopie aller Lichter der Karte je Bild, Schleife über alle 521 Häuser samt `wearOf`, Überblenden ~0,25 |
| Sichtliste | ~0,33 | ~2000 Figuren/Gegner je Bild einzeln geprüft (+ Neubau über 17 000 bei jeder Längenänderung / 1,5 s) |
| Figuren | ~0,07 je NPC | davon ~0,017 ms `humanFrameR`-Schlüssel (`specKey`) + `humanSpec` in sprites.js |
| Häuser / Props / Chunks | 0,02 / 0,005 je Stück / 0,06 | schon gebacken — kein Hebel |
Spitzen (p95): Chunk backen Median 8,5 ms (bis 290 ms kalt), Haus backen 13 ms (bis 43 ms), Lichtersuche alle 3 s und Sichtlisten-Neubau (3–12 ms).

## Maßnahmen
1. Bosslebensbalken aus der Sichtliste (Bossliste nebenbei gesammelt) → ~1,0 ms weniger.
2. Sichtliste: bewegliche Objekte alle 150 ms in 512-px-Raster (Abfrage mit 160 px Rand), Spieler/Gefolge immer einzeln; nur angehängte Objekte einsortieren statt Neubau; Voll-Neubau bei Entfernen/anderer Liste/letztes Objekt geändert/4 s.
3. Licht: statische Lichter + Fensterlicht der Häuser beim Sichtlisten-Neubau gesammelt (kein eigener 17 000er-Lauf alle 3 s), je Bild nur Lichter im Bild, keine Kopie/Allokation.
4. Chunk backen (gleiches Bild, geprüft per Pixel-Hash über 49 Chunks: 0 Abweichungen): Grundtexturen direkt in einen Pixelpuffer statt 256 drawImage; Grenzpixel ohne Rauschauswertung, wenn der Sieger mit > 0,55 Vorsprung feststeht; fehlende Texeldaten gesammelt mit einem getImageData (vorher ~1–16 ms je Textur); einmaliges Vorwärmen aller Bodentexturen in Leerlaufzeit; Wasser: Küstenlinie je Spalte statt je Pixel.
5. Chunk-Vorabbacken lief im Spiel praktisch nie (Bedingung > 8 ms Leerlauf) → jetzt spätestens alle 300 ms ein Ring-Chunk.
6. Häuser: Hausbilder LRU (220) und Vorabbacken in Leerlaufzeit (bis ~700 px ums Bild, 20 Spielminuten vor 19/6/22 Uhr schon das andere Bild) — vorher bis zu ~10 Häuser zugleich beim Betreten einer Stadt bzw. beim Tag/Nacht-Wechsel.
Städte-Ebenen-Cache (Wunsch Entwickler) geprüft und **nicht** gebaut: Häuser/Dächer/Props sind schon einzeln gebacken, ihr Zeichnen kostet zusammen nur ~0,1 ms; eine gemeinsame Ebene würde die Tiefensortierung mit Figuren (Dach verdeckt Figur dahinter) brechen. Der echte Kostenpunkt war das Backen (Punkt 6).

## Messung (bench.js, A/B direkt nacheinander, gleiche Last, dpr 1, je 3 Läufe; Median draw ms / p95 gesamt Läufe 2–3)
| Szene | draw vorher | draw nachher | p95 vorher | p95 nachher |
|---|---|---|---|---|
| Varonheim Markt | 7,7–8,4 | 4,2–4,8 | 21–27 | 19–21 |
| Aurelheim | 7,6–8,3 | 3,8–4,2 | 22–24 | 19 |
| Nordfurt | 9,1–10,0 | 5,3–6,0 | 23–28 | 20 |
| Wildnis | 6,1–6,3 | 2,7–2,8 | 18–21 | 13–14 |
Last war hoch (update ~3 ms in beiden). Bei ruhigerer Maschine (frühere Läufe): draw nachher 1,7–1,9 / 1,6–1,9 / 2,2–2,6 / 1,2–1,4.
Chunk backen (warm): Median 8,5 → ~6,5 ms, Boden-Anteil 13,9 → ~5 ms, Grenzen 8,2 → ~1,1 ms, Wasser ~6 → ~2,3 ms.

Optik: Vorher/Nachher Varonheim Tag/Nacht in `docs/screenshots/perf_r_varonheim_{tag,nacht}_{vorher,nachher}.png` — gleich (nur Figurenstellung anders).

## Bewusste kleine Abweichungen
- Ein Objekt, das (ohne Spieler/Gefolge zu sein) innerhalb der Karte springt, erscheint bis zu 150 ms später; Bosslebensbalken eines neu ernannten Bosses ≤ 150 ms später.
- Neue Lichter/Fensterlicht nach Verfall: spätestens beim nächsten Sichtlisten-Neubau (sofort bei Objektänderung, sonst ≤ 4 s; vorher ≤ 3 s).

## Nächste Hebel
- sprites.js (Artist): `specKey(spec)` je Aufruf ~11 µs, `humanSpec` ~6 µs — bei 20 NPC ~0,35 ms; Schlüssel am Spec zwischenspeichern.
- Gemeinsames Raster mit PERF-U (`nearEnts`/`actorsOf` bauen ein eigenes über dieselben 17 000 Objekte).
- Haus-Sprite selbst backen (buildings.js über sprites.G) ~13 ms; Licht-Überblenden ~0,25 ms (Ebene `dark` wird je Bild neu gezeichnet).
- Chunk: `mottleR` ~2 ms je Chunk (zeilenweise Rauschauswertung möglich, bitgleich).
