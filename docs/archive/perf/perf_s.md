# PERF-S: Hintergrund, UI, Spitzen (02.10.2026)

## Methode
- Zuordnung mit einer instrumentierten Kopie von `src/` (Zeitmessung um jeden Aufruf in `update`, `hourTick`, `dayTick`, `conTick`, `aurelTick`, `roadTick`); die Kopie ist wieder gelöscht.
- Reihe: 600 × `RF.tick(16)`; alle 100 Bilder springt die Uhr auf xx:59,99 (Stundenwechsel). Spielstand-Sicherheit wie in HUNT.md, `S._quiet`.

## Ursachen der Spitzen (vorher)
| Takt | Kosten | Ursache |
|---|---|---|
| alle 180 ms (jedes 12. Bild, ~8 % der Bilder → bestimmt p95) | +5–7 ms | `UI.renderContext` 2–4 ms (`townHeads`: 17 000 Einträge × `townAt`, Hausbewohner-Filter, `innerHTML` jedes Mal), `updatePrompt` 2–4 ms (`interactables` filtert alle 17 000 mit `hypot`, `innerHTML` jedes Mal), `refreshHUD` ~1 ms |
| alle ~1,1 s (jedes 72. Bild → p99) | +5–20 ms | alle 11 Sekunden-Haken in einem Bild: `conTick` 1–12, `tribTick` 2–6, `aurelTick`/`bondTick` 1–3,5 |
| jedes Bild, solange Wege gesucht werden | 0,8 ms, Ausreißer 3–16 ms | `pumpRoads`: A* gibt nur alle 512 Schritte ab (bis 7 ms am Stück trotz 0,8-ms-Budget), Heap legt je Eintrag ein `[f, i]`-Feld an (GC) und je Schritt eine neue Richtungsliste |
| jede Spielstunde (1×/min) | 8–24 ms | `fortressHour` 3–11 (Tore: `indexSolids('world')`), `ensureOmegaShrine` 2–3,5 (zwei Voll-Durchläufe), `travelHour` 2–3 |
| jeder Spieltag (1×/24 min) | 50–66 ms + Speichern | `successorDay` 22–28 (je Rolle `find` über alle ~18 000), `warDay` 9–23 (davon `ecoDay`/`census` ~10), `herdEvents` 7–10 |
| jedes `save()` | ~85 ms | `saveData`: Prop-Signaturen 28 ms + `JSON.stringify` von 2,6 MB (Hauptthread; Komprimieren selbst läuft asynchron, `pack` ~2 ms) |

## Maßnahmen (keine Spielregel geändert, kein neuer rnd()-Aufruf)
- **sim.js** Wegsuche: Heap als zwei parallele Zahlenlisten (gleiche Vergleiche → nachweislich gleiche Wege, 11 Strecken verglichen), Richtungen als Konstante, Abgabe alle 64 Schritte. Ergebnis: Suche ~1,8× schneller, größtes Stück 1–3 ms statt 3–16 ms. Zusätzlich `requestIdleCallback`: Wege werden im Leerlauf zwischen den Bildern gerechnet; `pumpRoads` im Bild bleibt als Untergrenze.
- **ui.js** Infofeld: `townHeads` und Hausbewohner höchstens alle 1,5 s neu (`ctxMemo`); `townAt` nur noch, wenn der Anker im Gebiet der Stadt liegt (gleiches Ergebnis); `innerHTML` von Infofeld und Hinweis nur bei Änderung. Infofeld 2–4 ms → ~0,1–0,3 ms.
- **game.js** (kleine, abgegrenzte Stellen): Sekunden-Haken in drei Gruppen auf verschiedene HUD-Takte verteilt (jeder weiter einmal je ~1,1 s); `refreshHUD` einen halben Takt (90 ms) versetzt; `ensureOmegaShrine` ein Durchlauf statt zwei; `successorDay` Nachschlagetabelle statt `find` je Rolle (gleiches Ergebnis, Fallback für Rollen ohne Schlüssel); Vorprüfung `Math.abs` in `interactables` (PERF-U hat dort inzwischen `nearEnts` eingesetzt).
- **state.js** `saveData`: Schnellprüfung „gleiche Schlüssel, gleiche einfache Werte“ vor dem JSON-Vergleich der Props. Ausgabe byte-gleich geprüft (auch mit geänderter Truhe); ~85 → ~65–75 ms.

## Messwerte (update je Bild, Reihe mit Stundenwechseln; Browser wird von anderen Agenten mitbenutzt → Spanne)
| | Median | p95 | p99 | max |
|---|---|---|---|---|
| vorher (3 Läufe) | 4,6–5,5 | 10,7–11,6 | 15,4–20,2 | 47–54 |
| nachher (3 Läufe, inkl. PERF-U-Änderungen) | 2,0–7,0 | 5,5–11,6 | 13,9–16,4 | 33–64 |
| HUD-Bild minus Median | 2,5–3,2 | | | |
| HUD-Bild minus Median nachher | ~1,9 (vor dem 90-ms-Versatz) | | | |

bench.js (2. Lauf, gesamt / p95 ms): Varonheim 4,0 / 7,2 · Aurelheim 4,8 / 8,6 · Nordfurt 4,5 / 8,3 · Wildnis 2,9 / 7,0 (Ausgang Lead: p95 57,9 / 35,7 / 44,7 / 26,8). Der Anteil von PERF-S lässt sich wegen paralleler Änderungen nicht sauber trennen.

Selbsttest nach allen Änderungen: 376/376 PASS.

## Offen / Vorschläge (nicht umgesetzt)
1. **Nachts deutlich teurer:** um 22 Uhr Median 5,5 ms statt 2 ms bei gleicher Szene (Update). Für PERF-U (Tagesplan/Nachtwachen?) prüfen.
2. **`mountTick` ~0,8–1 ms in jedem Bild** (vor PERF-U-Umbau gemessen) — für PERF-U.
3. **Stundenwechsel 8–24 ms:** Haken über die folgenden Bilder verteilen (Warteschlange) oder `fortressHour`/`fortLifeHour`/`riders` ohne mehrfache Voll-Durchläufe; das Neuindizieren `indexSolids('world')` beim Öffnen/Schließen der Tore durch `addSolid`/`removeSolid` ersetzen. Nicht umgesetzt, weil Proben mit `RF.tick` den Stundeneffekt sofort erwarten könnten.
4. **Speichern ~65 ms im Hauptthread:** bleibt die größte Einzel-Spitze (1× je Spieltag + bei Ereignissen). Möglich: JSON je Figur zwischenspeichern und nur geänderte neu schreiben (braucht „schmutzig“-Kennzeichen) oder Speichern nur in ruhigen Momenten (kein Kampf, Leerlauf). Aufteilen über mehrere Bilder ist riskant (inkonsistenter Stand, z. B. Gegenstand doppelt).
5. `ecoDay`/`census` ~10 ms je Tag (Regex je NPC, `townKeyOf`) und `herdEvents` 7–10 ms: Kandidaten für Verteilung über mehrere Bilder am Tageswechsel.
6. Ferne Wegsuchen ohne Ergebnis (Inseln) laufen bis zur 600 000-Schritte-Grenze (~300 ms CPU, jetzt im Leerlauf); Erreichbarkeit vorab per Zusammenhangskomponente prüfen.

## UNVERIFIED
- Wirkung von `requestIdleCallback` im echten Spiel (rAF-Schleife) nicht gemessen; bench und Reihen laufen über `RF.tick` ohne Leerlauf.
- Speichern selbst nicht in einem Wegwerf-Slot geschrieben; geprüft wurde nur, dass `saveData()` byte-gleich bleibt.
- Neue Zahlen enthalten Änderungen von PERF-U/PERF-R; reine PERF-S-Wirkung je Takt nur aus der Instrumentierung abgeleitet.
