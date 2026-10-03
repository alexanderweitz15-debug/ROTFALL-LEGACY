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
- Scheibe 5 grün um 22:06 (Pergament: Kodex, Chronik, Auftragsbuch als Doppelseite mit Siegeln + Brief, Erbenkarten). Selbsttest 438/438. Nicht gebaut: Kartenausschnitt im Brief (Q11-2) — drawAtlas zentriert nur auf den Helden (atlas.js, Karte-Agent).
- Scheibe 3 (Docks) grün um 22:09: Siedlung, Gruppe, Handwerk angedockt; Handwerk mit Rezeptkarten und Güte-Balken. Selbsttest 439/439.

## Spacing-Durchgang (Entwickler 02.10.2026) — Befunde (eigener Tab, 1280×720, 1024×700, 760×640)
- **Alle Fenster mit Unterreitern (Charakter, Mächte):** Die Reiter „Werte (C) / Zauber (Z) / Effekte (X)“ bzw. „Fraktionen (F) / Chronik (K)“ liegen übereinander und über dem Titel. Ursache: die Regel für den Schließen-Knopf (`.modal-head button{width:28px;height:28px}`) traf auch die Reiter. → Reiter eigene Breite, kein Umbruch.
- **Gepäck:** Bei ≤ 1180 px und < 820 px blieb das Drei-Spalten-Raster (`.inv2` überschrieb die Schmal-Regel) — bei 760 px war die Taschenspalte 78 px breit (eine Zelle). → 1180: Tasche + Figur nebeneinander, Detail darunter; < 820: alles untereinander. Traglast-Zähler bricht um → bleibt in einer Zeile.
- **Charakter:** ≤ 1180 px steht die Körpertafel zuerst und füllt das ganze erste Bild (Körperbild bis 460 px hoch). → Körperbild dort höchstens 260 px.
- **Siedlung (Dock):** einspaltig ist der Bauplan einer gewählten Karte weit unten (Scrollen nach jedem Klick). → im Dock zwei Spalten: Baukarten links, Lage/Bauplan/Prioritäten rechts, Bestand darunter über volle Breite.
- **Optionen:** jede Wahl (Blut, Stil, Schadenszahlen, Ton, Textgröße) als volle Zeile untereinander → lange Liste. → Wahlknöpfe nebeneinander (umbrechend).
- **Mächte:** Rangtabelle: Spalte mit dem Rangnamen zu schmal („→ Rekrut“ bricht). → Mindestbreite.
- **Kein Überlauf** (horizontal) in irgendeinem Fenster bei 760 px gemessen (Gepäck, Charakter, Siedlung, Gruppe, Karte, Aufträge, Mächte, Chronik, Kodex, Optionen, Handwerk).
- **Raster:** Abstände waren frei gewählt (6, 8, 10, 12, 14, 16, 18, 20, 22 px). → Tokens `--sp1..--sp6` (4/8/12/16/24/32 px) in `:root`; Kopf, Körper, Abschnitte, Knopfreihen und Raster der Fenster laufen darüber.
- Spacing-Durchgang grün um 22:21 (Tokens --sp1..6, Reiter-Überlappung behoben, Gepäck/Charakter schmal, Siedlungs-Dock zweispaltig, Optionen-Knopfreihen, Rangtabelle). Selbsttest 444/444.
- Betriebe-Reiter grün um 22:21 (Kasse statt Gold, Abholen vor Ort im Reiter oder im Kontor, Besetzung/Zerstörung leert die Kasse, Verlust erst aus der Kasse dann aus dem Gold). Selbsttest 444/444.

## Betriebe-Reiter — Gate
- **Bestand:** economy.js ecoDay (Ertrag 35 % des Warenwerts − 3 Gold je Angeworbenem), bizMenu im Kontor (kaufen, ausbauen, anwerben), Effekt „Besitz“, HB-18 (Verlust trifft das Gold).
- **Entschieden (Entwickler):** Gewinn in die Kasse, Abholen vor Ort oder im Reiter, Besetzung/Zerstörung (vorläufig) ganze Kasse weg; alte Stände ohne Feld = 0.
- **Abgeleitet:** „vor Ort“ = der Held steht in der Stadt des Betriebs (townAt mit 4 Feldern Rand) oder spricht im Kontor dieser Stadt. Schnitt = über alle Tage seit Kauf (kein erfundenes Fenster). Haus-Bild: Gebäude des Gewerbes (TRADES.site), sonst Wohnhaus eines dort arbeitenden Bewohners.
- **Regeländerung an einer Probe:** „Nutzer S13 Wirtschaft … 6. Betrieb kaufen“ prüfte „Gold steigt am nächsten Tag“ → jetzt „Kasse steigt, Gold bleibt“ (Entwicklerentscheidung, nicht aufgeweicht).
- **OFFEN:** (1) Was nimmt ein Überfall auf die Stadt (raidDamage, Verteidigung gescheitert) aus der Kasse? — nicht ableitbar, nicht gebaut. (2) Verlusttage: zahlt die Kasse zuerst, Rest das Gold — so gebaut, weil HB-18 Verluste echt haben will; bitte bestätigen. (3) Abholen direkt am Haus (E an der Tür) nicht gebaut: ein Betrieb kennt sein Haus nicht fest (bei Gewerben ohne eigenes Gebäude nur über einen Bewohner ableitbar) — braucht eine Zuordnung Betrieb → Haus.

## Schmiede-GUI und Dialog-Listen mit GUI (Entwickler 02.10.2026)
**Schmiede heute (Gate):** Ein Schmied kann (1) handeln (Laden → Handels-Dock, gab es), (2) „Kannst du das ausbessern?“ = alles oder nichts zum Preis Σ (1 − Zustand) × Wert × 0,5, mindestens 5 Gold, Beziehung +3. **Schmieden lassen** oder **Verbessern** (Aufwerten, Schärfen) gibt es heute nicht — selbst schmieden geht nur an Esse/Amboss/Werkbank (Handwerk). → gebaut: Schmiede-Dock mit Ausbessern **je Stück** (gleiche Preisregel), Knopf zu den Waren, Knopf „An der Esse selbst schmieden“, wenn Esse/Amboss in 200 Px steht.
**OFFEN:** „Schmieden lassen“ (Auftragsarbeit beim Schmied: Preis, Dauer, Güte?) und „Verbessern“ (was steigt, um wie viel, wie oft, Kosten?) sind neue Regeln — nicht erfunden, nicht gebaut.

**Systeme, die heute nur als Gesprächsliste laufen — Nutzen / Aufwand**
| System | Funktion (game.js) | Nutzen | Aufwand | Stand |
|---|---|---|---|---|
| Kutsche / Fähre | `coachTalk` | hoch (Ziele auf einer Karte statt Zeilen, Preis/Dauer/Gefahr als Zeichen) | klein | **gebaut** (Reise-Dock mit Weltkarte) |
| Schmied Ausbessern | `repairAll` | hoch | klein | **gebaut** |
| Handwerk Esse/Werkbank/Kessel | `craftMenu` | hoch | mittel | **gebaut** (Scheibe 3) |
| Prothesen-Werkbank | `mechMenu` | hoch (Teile, Stufen, Module als Karten mit Körperbild) | mittel–groß | Liste |
| Kontor (Markt, Wagen, Betriebe, Lieferungen) | `ecoMenu`, `bizMenu`, `ordersMenu` | hoch (Betriebe kaufen als Karten neben dem neuen Reiter) | groß | Liste |
| Lehrer / Zauber lernen | `teach`, `spellMenu` | mittel (Zauberkarten mit Kosten, Schule) | mittel | Liste |
| Schwarzmarkt | `blackMarket` | mittel (Raster wie Handel; items.md hat es schon als [B]) | mittel | Liste |
| Tierhändler | `beastMenu` | mittel (Karten wie der Stall) | klein–mittel | Liste |
| Luftschiff-Hafen | `harborTalk` | mittel (Ziele auf der Karte wie Kutsche) | mittel | Liste |
| Frachtschiff | `cargoMenu` | mittel | mittel | Liste |
| Heiler | `healerTreat` | gering (ein Knopf, ein Preis) | klein | Liste — lohnt kaum |
| In die Stadt investieren | `investMenu` | gering–mittel | klein | Liste |
| Akademie-Prüfung | `trialMenu` | gering | klein | Liste |
| Schuldknechtschaft | `bondMenu` | gering | mittel | Liste |
Empfehlung für die nächste Runde: Tierhändler (wie Stall, klein) und Prothesen-Werkbank (größter Nutzen), dann Kontor.
- Schmiede-Dock und Reise-Dock (Kutsche/Fähre) grün um 00:21. Selbsttest 448/448.

## Aufträge Q-1..Q-4 — Gate-Notizen
- **Auslöser der Briefe:** Zustandswechsel in S.quests (aktiv → erledigt/gescheitert, neu aktiv), geprüft im HUD-Takt — ein Brief je Wechsel, gleich wo im Code er passiert; Koop-Gäste sehen ihn über den übertragenen Auftragsstand. Proben/Erbe/Laden merken still neu (Selbsttest ruft am Ende `UI.questSnap()`).
- **Toasts ersetzt:** „AUFTRAG GESCHEITERT“ (failContract) und „Auftrag: …“ (offerQuest) → Brief; Log und Chronik unverändert.
- **Siegel-Sichtbarkeit (Deutung):** Wahl Q1 = 1+5: feste Geber, Wache, Brett im Bild sichtbar; **Bewohner-Siegel nur in Ansprech-Nähe (62, wie interactables) oder unter der Maus** (Variante 5 gegen den Symbolwald). → bitte bestätigen, ob Bewohner-Siegel auch auf Sichtweite gewünscht sind.
- **Geste beim Abschluss (Deutung):** Wachen/Verteidigungsmeister salutieren, alle anderen jubeln; „trauern“ für Trauer-Aufträge nicht gebaut (keine Auftragsart markiert Trauer).
- **Frist-Sanduhr:** Anteil der Vertragsfrist (CON_DAYS); rot am letzten Tag (wie Warnchip/conTick) — keine neue Schwelle.
- **Nicht gebaut / OFFEN:** Q-OE8 Bewohner rufen den Helden (Häufigkeit offen); Q-OE3 Szene bei Story-Abschluss (Brief läuft ohne Pause); Q2-3/Q11-2 Kartenausschnitt (atlas.js zentriert nur auf den Helden); Q-OE6 Aurelion-Messingbrett und Q-5 Brettansicht, Q-6 Herold-Banner (nicht Teil dieses Auftrags); I-6 seltene Beute im Protokoll.
- **Fremdbefund:** Nach dem Selbsttest stehen im (stummen) Tab-Zustand Probe-Aufträge „Die Auftraggeberin: Probe“ und „Die Ladung zurückholen: …“ in S.quests — kommen aus fremden Proben (E-Quests), nicht aus diesen; wird nie gespeichert (S._quiet), fällt aber im Auftragsbuch nach einem Selbsttest auf.
