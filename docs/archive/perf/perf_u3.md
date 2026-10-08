# PERF-U3 — Ausreißer-Jagd (02.10.2026)

## Methode
- Instrumentierte Kopie von `src/` (Messpunkte `__PF.m()` in `update` und `drawFrame`, Zeit je gezeichneter Figur, Bild-Fehlgriffe des
  Figuren-Caches samt Backzeit, Zeit in `humanSpec`/Schlüsselbau, später je NPC `updateNpc`/`villagerDay`/`seek`/`findPath`/`dayTarget`).
  Die Kopie (`perf/u3/`, `u3base/`, `u3x/`) ist wieder gelöscht. **Hinweis Lead:** `perf/u3/` war versehentlich in c06aab3 mitcommittet — jetzt gelöscht.
- Reihe `perf/u3mess.js`: Varonheim Tag/Nacht, Nordfurt Tag/Nacht, Aurelheim, Wildnis, Varonheim mit Kampf (4 Banditen), je 300 Bilder
  `RF.tick(16)` + `RF.R.drawFrame`; jedes Bild > 8 ms mit Abschnitten, teuerster Figur, Fehlgriffen und Heap-Abfall protokolliert.
- `perf/u3miss.js`: Fehlgriffe des Figuren-Caches IM Bild bei Spieltakt (16 ms, Leerlauf dazwischen) — CPU-unabhängige Kennzahl.
- `perf/u3inst.py`: Skript, das die Messpunkte in eine Kopie setzt (für spätere Runden).
- Die Maschine war die ganze Zeit stark belastet (andere Agenten): absolute Zeiten 2–5× höher als in der Lead-Messung und schwanken ±40 %
  zwischen Läufen. Vorher/Nachher darum **verschränkt** gemessen: zwei Tabs (ohne/mit meinen Änderungen, sonst gleicher Stand), abwechselnd je 60 Bilder.

## Gefundene Spitzen-Ursachen
| Ursache | Kosten | Häufigkeit |
|---|---|---|
| **Figuren-Bilder backen im Bild** (Stil R, `humanFrameR` → `paintR` + `toCanvas`) | 1,5–4 ms je Bild, bis 26 Bilder in einem Bild (Ankunft in Stadt, Tag/Nacht) | in Varonheim noch nach 800 Bildern ~0,7 je Bild; Hauptursache der 20–50-ms-Spitzen „beim Zeichnen von NPCs“ (die Lead-Schätzung ~1 ms je Fehlgriff war zu niedrig) |
| **`humanSpec` je Bild und Figur** (render `e.spec \|\| SP.humanSpec(e)`) | ~24 µs je Aufruf, ~120–145 Aufrufe je Bild in Varonheim = 2–3,5 ms je Bild, dazu viel Müll (Spec-Objekt mit ~80 Feldern, Regex, Hilfslisten) | jedes Bild |
| **Schlüsselbau `specKey`** (~80 Felder → Text ~200 Zeichen, dann neuer langer Cache-Schlüssel mit neuem Hash) | ~2 ms je Bild | jedes Bild |
| **`cycProps()`** (game.js, Arbeitskreislauf): Neuaufbau bei *jeder* Längenänderung der Weltliste, mit `townAt` (Schleife über alle Städte) für ~14 000 Props | **20–80 ms in einem Bild** (gemessen `villagerDay` 58–84 ms) | jedes Mal, wenn ein Bewohner seinen Kreislauf beginnt und sich die Liste seit dem letzten Mal geändert hat — im Kampf (Leichen, Beute) fast immer |
| Humanoide Gegner über `{ ...e }`-Kopie gezeichnet, `msOf` je Bild (Liste + join) | Müll je Gegner und Bild | jedes Bild mit Gegnern |
| Sichtliste: Sicherheits-Neusortierung alle 4 s (17 000 Objekte) | 3–12 ms | alle 4 s |
| Nicht behoben, nur zugeordnet: `nearEnts`-Neubau (u_prompt, bis 12 ms, alle 2 s/Längenänderung), `tierOf`-Neubau (bis 8 ms), `u_tail` (questCheck/battleCheck/travelTick/respawnTick, 11–19 ms alle 4–12 s), Licht ~2 ms je Bild | | |
- Müllsammlung: Heap fiel in Varonheim alle ~10–15 Bilder um 2–12 MB (GC-Bilder im Mittel 16–28 ms statt ~14). Hauptquellen waren die
  Spec-/Schlüssel-Allokationen je Figur; danach weniger GC-Bilder (Zählung über `performance.memory` grob, ±).
- `findPath` ist **kein** Ausreißer (84 ms Summe über 1600 Bilder, max 5–10 ms).

## Maßnahmen (keine Spielregel, kein rnd(), Optik unverändert)
- **sprites.js** `humanSpecOf(e)`: Spec je Figur gemerkt; gilt, solange jede Eingabe gleich ist, die `humanSpec` und seine Helfer lesen
  (21 Figurenfelder, 12 Palettenfelder, Ausrüstung je Platz mit Stück/Schlüssel/Zustand, Blutstufe, Glieder, Gegendgrenzen von regionOf/regionFarmer).
  Geprüft: für 1208 Figuren JSON-gleich mit `humanSpec`, auch nach Änderung von Leben, Helm, Zustand, Palette (in place), Ort und zurück.
- **sprites.js** Schlüssel: `pinSpec` merkt `specKey` je (unveränderlicher) Spec, Cache-Schlüssel nutzt eine kurze Nummer statt ~200 Zeichen.
  Fremde Specs (Proben, Vorschau) rechnen wie bisher. `asG` ohne verworfenes Leerfeld, `toCanvas` ohne Kopie, wenn keine Kontur.
- **sprites.js** Vorbacken in Leerlaufzeit: fehlt ein Bild, werden die Geschwister (Lauf w0–w3, Stand i0/i1; gleiche Richtung und Waffenhaltung)
  per `requestIdleCallback` gebacken (Warteschlange ≤ 240). Der Kampfanimations-Agent hat das inzwischen für Schwungbilder erweitert (`warmSwingR`).
- **render.js** `drawHumanoidAt` nutzt `humanSpecOf`; `monsterSpecOf` mit `msEq` (ohne Liste) + `pinSpec`; humanoide Gegner über einen
  bleibenden Stellvertreter (`Object.create(e)` mit eigenem spec/equip) statt `{ ...e }` je Bild (die Zeichenwege schreiben nichts in die Figur — geprüft).
- **render.js** Sichtliste: die 4-s-Sicherheits-Neusortierung läuft in einer Browser-Pause; im Bild erst, wenn bis 8 s keine Pause kam.
  Entfernen/andere Liste sortiert weiter sofort neu.
- **game.js** `cycProps`: Stadt je Prop gemerkt (gleiche Kachel + gleiche Stadtgebiete ⇒ gleiches `townAt`); ändert sich ein Stadtgebiet
  (Wachstum), wird der Merker verworfen. Gleiche Listen, gleiche Reihenfolge.

## Messwerte (verschränkt, gleiche Last, ms; Median / p95 / p99 / max)
| Szene | | ohne | mit |
|---|---|---|---|
| Varonheim Mittag, 360 Bilder | Zeichnen | 22,8 / 43,1 / 62,1 / 77 | **18,8 / 30,3 / 42,1 / 63** |
| | gesamt | 32,8 / 55,5 / 85,6 / 104 | **29,2 / 49,3 / 72,6 / 81** |
| Nordfurt Nacht, 300 Bilder | Zeichnen | 12,7 / 20,9 / 30,3 / 88,5 | **10,0 / 18,3 / 23,7 / 25,8** |
| | gesamt | 19,2 / 32,3 / 73,2 / 94 | **16,7 / 31,3 / 47,2 / 59** |
- Update unverändert (gleiche Werte in beiden Tabs) — erwartet; die `cycProps`-Spitze tritt nur auf, wenn Bewohner ihren Kreislauf beginnen
  (gezielt gemessen: `villagerDay` vorher 58–84 ms, Ursache `cycProps`; nachher nicht mehr unter den Spitzen).
- Bild-Fehlgriffe im Bild bei Spieltakt (u3miss, Varonheim, 600 Bilder): **1168 → 678** (−42 %), höchstens **26 → 9** in einem Bild,
  obwohl die Maschine kaum Leerlauf ließ (Bild 13–24 ms). Bei normaler Last (Bild ~3 ms, 13 ms Pause) fallen fast alle Geschwister in die Pause.
- Nicht verschränkte Läufe (u3mess, nacheinander): Zeichnen-Median je Szene 25–35 % niedriger (6,0→4,6 · 5,8→4,3 · 3,6→2,5 · 3,9→2,9 · 4,7→3,3 · 1,9→1,3 · 9,8→8,7).
  Lead-Bench (bench.js) bitte bei ruhiger Maschine wiederholen.

## Selbsttest
382/383 PASS. Einziger FAIL: „Balancing (§82): Stufe-3-Held verliert gegen einen Banditen …“ — **nicht von PERF-U3**: `duel('bandit',{seed:3})`
verliert deterministisch auch im Stand *ohne* meine Änderungen (Kopie u3x), gewinnt im Stand von vorher (u3base). Ursache sind die parallelen
Kampfanimations-Änderungen in game.js/anim.js (Treffpunkt `swingHit`, Ausfallschritt `atkH`, Abbruch). Bitte an den Kampfanimations-Agenten.

## UNVERIFIED / Restrisiko
- Absolute ms und die 3-ms-Marke: wegen Dauerlast nicht belastbar; nur relative, verschränkte Werte.
- Vorbacken in Leerlaufzeit im echten rAF-Spiel nicht im sichtbaren Browser gemessen (Bereich versteckt → keine Animation-Frames).
- `humanSpecOf`: Wer künftig in `humanSpec` ein neues Figurenfeld liest, muss es in `HS_ENT`/`HS_PAL` eintragen (Kommentar steht dort), sonst bleibt das Aussehen bis zur nächsten anderen Änderung alt.
- Monster-Stellvertreter: liest alles live von der Figur; schreibt künftig ein Zeichenweg in `e`, landet es am Stellvertreter (bisher an einer Wegwerfkopie).
- Sichtliste: neue Lichter/Fensterlicht ohne Listenänderung erscheinen jetzt ≤ 4 s (mit Pausen) bzw. ≤ 8 s (ohne) statt ≤ 4 s.

## Nächste Hebel (nicht umgesetzt)
1. Ankunfts-Schwall neuer Figuren (bis 9–26 Bilder backen in einem Bild): pro Bild ein Backbudget und für den Rest ein schon gebackenes
   Geschwisterbild derselben Figur (w1 statt w2 für ein Bild) — wäre eine (kaum sichtbare) Optikabweichung, darum nur Vorschlag. Größter Rest-Hebel: `paintR` (fig5.js, ~75 % der Backzeit) schneller machen.
2. `nearEnts` (game.js) wie die Sichtliste: angehängte Einträge einsortieren statt Neubau; 2-s-Neubau in die Pause.
3. `tierOf`- und `u_tail`-Spitzen (questCheck/battleCheck/travelTick) über Bilder verteilen.
4. Licht (~2 ms je Bild unter Last) — PERF-R.
