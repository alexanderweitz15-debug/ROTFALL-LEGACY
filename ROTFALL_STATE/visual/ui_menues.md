# UI-Umbau: Meldungsfluss, Aufträge, Pergament, Docks (UI-Agent, 02.10.2026)

Grundlage: PROPOSALS/ui_redesign.md (§5, §6 Scheiben 3–5), visual/quests.md (Q-1..Q-4), visual/items.md (§6, I-1), DECISIONS 01.10./02.10.
Kennzeichnung wie GATE.md: was nicht entschieden oder aus bestehenden Systemen ableitbar ist, wird nicht gebaut, sondern unten gemeldet.

## Layout-Plan Spielfeld (vor dem Bau)

| Ort im Spielfeld | Was | Warum dort |
|---|---|---|
| oben rechts | Minikarte (180 px, N, vorhanden) | unverändert |
| oben rechts, unter der Minikarte (ohne Minikarte ganz oben) | **Auftrags-Tracker** (Q-4): verfolgter Auftrag groß, bis 3 weitere klein; klappt im Kampf ein | Ziel-Info gehört an den Rand, nicht in die Mitte (ui_redesign §2.5) |
| oben Mitte | Namenskarte (`nameCard`, vorhanden, 24vh) und **Fund-Karte** Legendär/Mythisch (24vh, gleiche Höhe, nie gleichzeitig: Fund-Karte wartet, bis die Namenskarte weg ist) | großer Moment = Mitte; ohne Pause (I-1) |
| unten links, über der Boss-Leiste | **Meldungsfluss** (bis 4 Zeilen, verblassend, neueste unten); rückt über das Gesprächsfenster, solange eines offen ist | Variante B (entschieden), Boss-Balken bleibt unten Mitte frei |
| unten Mitte | Boss-Balken (Canvas, vorhanden), Hinweiszeile (`#prompt`) | unverändert |
| Kopfleiste vor der Uhr | **Warnchip** (das Wichtigste, klickbar) | Variante C (entschieden); bleibt unter 820 px sichtbar (Uhr nicht) |

Schmal (< 820 px): Protokoll ist ausgeblendet → der Meldungsfluss ist dort die einzige Meldungsfläche (schmaler, 3 Zeilen). Tracker nur der verfolgte Auftrag.

## Scheibe 4 — Meldungsfluss, Toast-Warteschlange, Warnchip, Fund-Karte (Gate)

- **Betroffen:** `ui.js toast()` (590 Aufrufe in game.js, coop.js schickt Toasts an Gäste und ruft dort `UI.toast`), `#toast` (index.html), Aufheben (game.js `doInteract`, `giveItem`), Reiter `inv` (Punkt), `refreshHUD` (180-ms-Takt), Koop-Gäste (sehen Toasts über `t:'toast'`).
- **Vorhanden:** `toast(text, ms)`, Protokoll mit Kategorien, `.dot` am Reiter, Seltenheitsmarken (`.rm-*`), `drawItemIconTo`, `S.settings.motion`, `S._quiet` (Proben zeigen nichts).
- **Regeln aus dem Bestand:** Großbuchstaben-Toasts sind heute die lauten (Ereignis, Angriff, Stufe) → im Fluss „laut“ gesetzt. Frist: ein Vertrag scheitert, wenn `S.day > until` (conTick) → „läuft ab“ = heute ist der letzte Tag. Überfall auf die Siedlung ist nur mit Wachturm angesagt (game.js Stunde 2) → Chip nur mit Wachturm. Verteidigungsauftrag hat `C.at` (Info zeigt schon „Angriff in …“). Gefährte: `downed` bzw. Körperteil „kritisch“ (`partState`).
- **Entschieden:** Fluss statt Einzel-Toast, mehrere zugleich (01.10.); Fund-Karte nur Legendär/Mythisch, ohne Pause (02.10., I-1); Aufnahme-Stapel (items.md §6 Wahl 10).
- **Nicht gebaut (offen):** I-6 „seltene Beute im Protokoll ankündigen“ (nicht entschieden); Herold-Banner/Randbriefe für Weltereignisse (Q-6, Q-OE7 offen) — der Fluss ist die Grundlage dafür.
- **Speichern:** nichts Neues im Spielstand (Fluss, Karte, Chip flüchtig).
- **Proben:** keine bestehende Probe liest `#toast`; Toasts sind unter `S._quiet` stumm (bleibt so).

## Stand
- Scheibe 4 grün um 17:01 (Meldungsfluss, Aufnahme-Stapel, Fund-Karte, Warnchip; Proben „UI-Scheibe 4: …“ grün). Fremde rote Proben im selben Lauf: „Ratgeber …“ (Talent-Tipp ist seit heute abgeschaltet), „HB-07“, „HB-18“ (neue Proben anderer) — nicht aus dieser Scheibe.
- Aufträge Q-1 grün um 17:01 (Kerben, Zählkerbe, Brief mit Siegel/zerrissen, Geste, Goldzähler).
- Aufträge Q-2 grün um 17:01 (Geber-Siegel, Ansprech-Zeile, Karte/Minikarte).
- Aufträge Q-3 grün um 17:01 (Auftragsbrief im Gespräch, Annahme-Brief fliegt zum Reiter, Steckbrief mit Gesicht, Lohnleiste mit Anteil-Kreis).
- Aufträge Q-4 grün um 17:08 (Tracker groß + 3 klein, klappt im Kampf ein, Zielmarker nur verfolgt/nicht Sehr schwer, Wegmarken, Karte: Gebietskreis, gefüllt/hohl). Selbsttest 436/437, rot nur „Ratgeber …“ (fremd: Talent-Tipp seit heute aus).
