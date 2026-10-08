# Vorschlag: Menü- und HUD-Umbau („mehr visuell, weniger Text“)

Agent 8 (Darstellung, Fable 5.1) mit Blick des Feature Designers · 01.10.2026 · Status: **WAITING_FOR_DEVELOPER**
Auftrag des Entwicklers: umfassende Menü-Veränderung, visuell statt Text; Kopfleiste entlasten; Protokoll unten springt (Hauptstrang behebt den Sprung selbst); Entwürfe mit Inspiration aus anderen Menüs vorlegen.

Mockups: `ROTFALL_AGENT_STATE/designs/uebersicht.html` (Vergleich), `ui_variante_A.html`, `ui_variante_B.html`, `ui_variante_C.html` (je 1280×720), Bildschirmfotos `ui_variante_A.png`, `_B.png`, `_C.png`.
Kennzeichnung: **FACT** (belegt mit Datei:Zeile oder Messung im laufenden Spiel), **PROPOSAL**, **ASSUMPTION**.

---

## 1. Befund: so sieht das Spiel heute aus

Gemessen im laufenden Spiel (Dev-Server 8770, Sicherungsstand, `S._quiet`, 1600×900 und 800×450):

**Kopfleiste**
- FACT `index.html:70-78`: Kopfleiste = Marke + `#nav` + Weltuhr (Wetter, Zeit, Gold). FACT `src/ui.js:34-38`: `NAV` hat **14 Textreiter** (Welt, Charakter, Gruppe, Inventar, Lager, Fraktion, Chronik, Karte, Talente, Zauber, Aufträge, Effekte, Kodex, Optionen), jeder in Cinzel-Versalien mit Tastenbuchstabe (`style.css:93-98`).
- FACT Messung: die Reiter brauchen 911 px (Scrollbreite bei 800 px Fenster), bei 1600 px nimmt `#nav` 1227 px der Leiste ein. Unter 1400 px fallen die Tastenbuchstaben weg (`style.css:521`), unter 1180 px scrollt die Leiste seitlich (`style.css:457, 511`). **Das ist das „oben geht zu viel ab“ des Entwicklers: 14 Wörter in Versalien konkurrieren mit Uhr, Wetter und Gold.**
- FACT: fünf Reiter sind Unterthemen anderer Fenster (Talente/Zauber/Effekte → Charakter; Fraktion/Chronik → Welt/Kodex), haben aber dieselbe Gewichtung wie Inventar.

**Protokoll unten**
- FACT `style.css:84`: `#game` ist `58px 1fr 104px`; das Protokoll hat bei 900 px Höhe **63 px sichtbare Höhe ≈ 3 Zeilen** (Messung `#log.clientHeight`). FACT `ui.js:276`: bei jedem Eintrag wird `innerHTML` der letzten 90 Einträge neu gebaut; `logStick` (ui.js:272-278) soll unten halten. Der vom Entwickler gemeldete Sprung wird vom Hauptstrang behoben; dieser Vorschlag plant nur das Erscheinungsbild.
- FACT `style.css:329`: unter 820 px ist das Protokoll ganz ausgeblendet; FACT `ui.js:496-501`: es gibt genau **einen** Toast, ein neuer löscht den alten (`clearTimeout`) — Meldungen in Kampfspitzen gehen verloren.
- FACT: Kategorien gibt es (`LOGCATS` ui.js:39, Farben `style.css:170-172`), aber nur als Textfarbe; kein Zeichen, keine Gruppierung, kein „Neu“-Hinweis.

**Linke Säule (HUD)**
- FACT `ui.js:87-126`: Balken mit Textbeschriftung („Leben 213/261“), Klasse als Textzeile mit angehängten Hinweisen („· 11 Statpunkte frei (C) · 12 Talentpunkte (T)“, ui.js:91) — bei einem frischen Stand drei Zeilen Text im Porträtblock (siehe Bildschirmfoto). Vorrat als Wortliste „Holz 80 / Stein 30“ (ui.js:124-126). Positiv: Körpersilhouette (`bodyChart` ui.js:663) und Porträts sind schon Bild.

**Rechte Säule (Kontext)**
- FACT `ui.js:304-411`: ausschließlich Schlüssel/Wert-Zeilen („Gefahr Sicher“, „Wetter Bewölkt“, „Zeit 10:00“, „Jahreszeit“, „Jahr“) — Zeit und Wetter stehen dort **und** in der Kopfleiste doppelt (ui.js:128-129 vs. 317-319).

**Fenster** (alle in einem Modal 1080×760, `style.css:210`, 16 Fenster `ui.js:521-524`)
- Inventar `ui.js:531-583`: Raster mit Icons (gut), Ausrüstung als **Liste** statt Papierpuppe, Lager-Raster darunter.
- Charakter `ui.js:700-773`: Tafel mit Körperbild und Figurenbild — das visuellste Fenster; Werte als `dl`-Listen.
- **Lager & Siedlung** `ui.js:863-909`: Gebäude als Textknöpfe mit Kostenzeile („20 Holz, 8 Stein“), Detail als Text, Prioritäten als Textliste mit „höher“; **kein Bild, keine Vorschau, kein Grundriss**. Platzieren über Geist in der Welt (`startPlacing` game.js, Toast „Linksklick“), ohne Reichweiten- oder Blockadeanzeige.
- Handel `ui.js:995-1018`: zwei Zeilenlisten + Infospalte; keine Kategorien, keine Mengenwahl, Preisvergleich nur als Satz.
- Aufträge `ui.js:1020-1033`: Textkarten; Karte `ui.js:984-992`: Leinwand mit zwei Zoomstufen, Legende (11 Zeichen in `drawWorldmap`), keine Markierung durch den Spieler.
- Gruppe `ui.js:833-860`: Textkarten, fünf Befehle als Knöpfe; Fraktionen `ui.js:918-942`: Banner, Rangtabelle, kleine Kriegskarte (gut).
- Kontor, Handwerk, Bionik, Schwarzmarkt: **Gesprächsmenüs** (`ecoMenu`, `craftMenu`, `mechMenu`, `blackMarket` in game.js) — Listen von Sätzen mit „✗“ als Markierung.

**Schnellleiste**: FACT `ui.js:441-459`: Gegenstände als Icon, **Fähigkeiten als Wort in 10 px** (ui.js:453).

Fazit (FACT-Summe): Rund 70 % der sichtbaren UI-Fläche ist Text; Bilder gibt es nur, wo schon eine Leinwand existiert (Porträt, Körper, Gegenstände, Banner, Karte). Die Kopfleiste trägt 14 gleichwertige Wörter. Das Protokoll ist drei Zeilen hoch.

---

## 2. Prinzipien (aus anderen Menüs gelernt, nicht kopiert)

1. **Ein Piktogramm + eine Zahl schlägt ein Wort + eine Zahl** (RimWorld-Ressourcenleiste, Diablo-Kugeln): Vorrat, Balken, Kosten.
2. **Angedockt statt übergeblendet** (Kenshi, RimWorld): Die Welt bleibt sichtbar, wenn ich baue, handle oder Siedlern Befehle gebe; Vollbild nur für „Lesefenster“.
3. **Karten statt Listen** (Hades-Segen, Battle-Brothers-Rekruten): Gebäude, Rezepte, Pferde (gibt es schon: `stableUI`), Söldner, Prothesen als Karte mit Bild, Kosten, Wirkung.
4. **Ein Material pro Stimmung** (Darkest Dungeon, Pentiment): Dunkles Eisen für Kampf/HUD, Pergament für Erbe, Chronik, Kodex, Auftragsbuch.
5. **Der Rand gehört der Information, die Mitte dem Spiel** (Mount & Blade, Hades): Ziele erhalten eine schwebende Karte am Ziel; Meldungen laufen als verblassender Fluss, das volle Protokoll ist eine Taste entfernt.
6. **Hierarchie durch Gruppen, nicht durch Menge** (Path of Exile Reiter, Disco Elysium Gedankenkabinett): 14 Reiter → 8 Gruppen, Unterthemen als Reiter im Fenster.
7. **Pixel-Identität behalten**: Piktogramme im selben Raster wie die Sprites (4-px-Pixel), Cinzel nur für Titel, Spectral für Werte; kein Glas, kein Neon.

---

## 3. Die drei Entwürfe

| | A „Ledger“ | B „Diegetisch-minimal“ | C „Taktisch“ |
|---|---|---|---|
| Kernidee | Jedes Fenster eine Pergament-Doppelseite mit Bändern als Reitern | Vollbild-Welt, Ringe am Porträt, Radialmenü, schwebende Karten | Angedockte Tafel rechts mit Reitern, Baukarten, dichtes Protokoll |
| Kopfleiste | 30 px: Siegel, Tagesbogen, Wetter, Gold, „Buch“ | 24 px durchsichtig: Tagesbogen, Wetter, Gold | 34 px: 9 Piktogramm-Reiter + Tastenbuchstabe, Warnchip, Uhr |
| Protokoll | Tagebuch-Streifen, neueste Zeile unten und fett, Kategorien als Tintenzeichen | 4 verblassende Zeilen links unten, „L“ öffnet das Tagebuch | Dichte Zeilen mit Kategoriezeichen, Filterchips, „Folgt ▾“ |
| Gezeigtes Menü | Charakter (Papierpuppe) + Gepäck | Rad → Bauen, Geist der Hütte mit Kostenkarte | Dock „Bau / Siedler / Bestand“ mit 9 Baukarten + Detail + Grundriss |
| Stärke | Identität, Erbe-Gefühl, Lesefenster | Bildraum, Touch, „Bauen in der Welt“ | Tiefe der Sandbox tragfähig, geringster Umbau |
| Schwäche | deckt alles ab; 14 Reiter passen nicht als Bänder | zu wenig Platz für Fraktionen/Wirtschaft, Rad mit Maus langsam | dichteste Optik; Dock muss < 1200 px überlagern |
| Aufwand | M–L | L | M |

ASSUMPTION zum Aufwand: C baut auf dem vorhandenen `openModal`-Register (ui.js:521-524) auf — ein Dock ist dasselbe Fenster an anderer Stelle; A braucht eine zweite Stilwelt für 16 Fenster; B braucht neue Weltkarten (Zielkarte, Kostenkarte) und ein Radialmenü mit Tastatur- und Touch-Pfad.

## 4. Empfehlung

**C als Grundgerüst, mit zwei Entleihungen:** aus **B** die textfreie, durchsichtige Kopfleiste und den verblassenden Meldungsfluss über dem Spielfeld (zusätzlich zum vollen Protokoll), aus **A** das Pergament nur für die Lesefenster Kodex, Chronik, Erbe und Auftragsbuch.
Begründung: ROTFALL ist eine Sandbox mit Fraktionen, Wirtschaft, Siedlung, Gruppe — die gleiche „Karten + Dock + Reiter“-Grammatik trägt alle diese Fenster, und der Baumodus wird genau das, was der Entwickler meint: Bild, Kosten, Vorschau. Das Pergament behält die Erbe-Identität dort, wo gelesen wird.

## 5. Einheitliches Menükonzept (PROPOSAL, Grundlage für die Scheiben)

**Kopfleiste (34 px):** 8 Gruppen als Piktogramm + Tastenbuchstabe: Charakter (C: Werte, Talente, Zauber, Effekte, Ausbildung), Gepäck (I), Gruppe (G: Gefährten, Stall, Siedler), Siedlung (B: Bau, Zonen, Prioritäten, Bestand), Karte (M), Aufträge (J: Aufträge, Verträge, Lieferaufträge), Mächte (F: Fraktionen, Ränge, Krieg, Chronik), Kodex (H). Optionen auf Esc ohne Reiter. Rechts: Tagesbogen (Sonne/Mond auf einem Bogen, Tooltip Tag/Zeit/Jahreszeit), Wettersymbol, Gold. Ein **Warnchip** für das Wichtigste (Überfall in X Stunden, Frist läuft ab, Gefährte verwundet), klickbar.
**Linke Säule:** Einheitenkarten (Held, Gefährten, später Siedler): Porträt, zwei dünne Balken, Zustandszeichen, Mini-Körper (nur bei Wunde), Tätigkeit als Wort unten rechts. Vorrat als Piktogramm + Zahl + Tagestrend (+2 / −1,5). Siedlungskasten mit Stufe, Bauten, Moralbalken.
**Rechte Säule → Dock:** Kontextkarte des Ziels oben; darunter das aktive Fenster als Tafel mit Reitern. Ohne Fenster: nur Kontext (wie heute), aber Zeit/Wetter/Jahr dort entfernt (steht oben).
**Protokoll:** 112 px, neueste Zeile unten, Kategorien als Zeichen + Farbe, Filterchips, Pille „Neu ↓“ wenn nach oben gescrollt, Knopf „Folgt ▾“. Zusätzlich ein **Meldungsfluss** (3–4 Zeilen, verblassend) am unteren Spielfeldrand für alles mit `toast()`; Toasts werden Warteschlange statt Ersetzen.
**Fenster-Grammatik:** Jede Liste mit mehr als 6 Einträgen wird ein Kartenraster (Gebäude, Rezepte, Waren nach Kategorie, Söldner, Pferde, Prothesen). Jede Karte: Bild (Pixelraster 14×10 bei Scale 4), Name, 1–3 Kostenpiktogramme (rot, wenn es fehlt), eine Kennzahl (Bauzeit, Güte, Preis), beim Wählen ein Detail mit Grundriss/Vergleich.
**Bauen:** Dock „Bau“ + Geist in der Welt mit 3×3-Feldraster (grün/rot je Feld), Reichweitenkreis 400 (`tryPlace` game.js prüft genau diesen Abstand), Tastenhinweis als Zeile. Drehen (R) ist Zukunft (ASSUMPTION: Bauten haben `w/h`, aber keine Ausrichtung).
**Handel:** Dock mit zwei Rastern (Händler / Du), Kategoriechips (Waffen, Rüstung, Vorrat, Waren, Messing), Mengen-Schieber für Stapel, Preis mit Pfeil gegen den zuletzt gesehenen Preis (`S.priceSeen` gibt es schon).
**Handwerk:** `craftMenu` wird eine Dock-Tafel mit Rezeptkarten (Bild des Ergebnisses, Material-Piktogramme, Mindestfertigkeit als Schloss, erwartete Güte als Balken) statt Gesprächszeilen.

## 6. Scheiben

**Scheibe 1 — Kopfleiste schlank, Protokoll, HUD-Zeichen (klein, sofort)**
- `NAV` auf 8 Gruppen reduzieren; Reiter = Piktogramm (Inline-SVG oder Pixelraster) + Tastenbuchstabe; Unterthemen als Reiter innerhalb der Fenster Charakter/Mächte/Aufträge/Gruppe.
- Protokoll: Sprungbehebung des Hauptstrangs übernehmen; Höhe 112 px; Kategoriezeichen; Pille „Neu ↓“; Filter als Chips.
- Linke Säule: Balkenbeschriftung durch Piktogramm ersetzen, Vorrat mit Piktogrammen, Hinweise „Punkte frei“ als goldener Punkt am Reiter Charakter statt Textzeile.
- Rechte Säule: Zeit/Wetter/Jahr streichen (steht oben).
- Doku: `docs/MECHANIKEN.md` Abschnitt „Menüleiste“ anpassen; Hinweis im Kodex-Handbuch.
**Scheibe 2 — Baumodus visuell:** Baukarten, Detail mit Grundriss, Geist mit Feldraster und Reichweitenkreis, Prioritäten als ziehbare Karten.
**Scheibe 3 — Dock statt Modal** für Siedlung, Handel, Gruppe, Handwerk; Modal bleibt für Charakter, Karte, Kodex, Chronik.
**Scheibe 4 — Meldungsfluss + Toast-Warteschlange + Warnchip.**
**Scheibe 5 — Pergament-Lesefenster** (Kodex, Chronik, Erbe, Aufträge) und Papierpuppe im Inventar.

## 7. Risiken

- **Koop:** `uiHooks.modal` (ui.js:471, 514) leitet Fenster beim Gast um; ein Dock muss denselben Haken bedienen. Gastfenster (Tausch, Gepäck) bleiben Vollbild-Modal, bis das Dock beim Gast geprüft ist. Handel/Bauen bleiben Host-Sache (PLAN_COOP).
- **Leistung:** `refreshHUD` schreibt nur Änderungen (ui.js:84-86); Karten dürfen das nicht brechen: Kartenraster nur bei Öffnen/Änderung aufbauen (Signatur wie `renderHotbar` ui.js:437). Pixel-Piktogramme als `box-shadow` sind billig, aber nicht in 180-ms-Takt neu zu erzeugen → einmal zeichnen, dann nur Zahlen ändern.
- **Kleine Bildschirme / Touch:** Dock überlagert unter 1200 px (wie heute `#rightpanel` unter 1180 px, style.css:320-325); Radial-Elemente aus B wären Touch-freundlich, kommen aber erst nach Scheibe 3. Protokoll unter 820 px heute ausgeblendet → der Meldungsfluss aus Scheibe 4 ersetzt es dort.
- **Selbsttest:** Proben greifen auf `#log`, `#nav`-Kinder (`closeModal` ui.js:512 iteriert `$('nav').children`) und Modal-Namen zu. Reiterzahl ändern = Proben prüfen, die `NAV`-Index nutzen (`openModal` ui.js:519-520).
- **Alte Spielstände:** keine Datenänderung in Scheibe 1–2; Scheibe 3 speichert höchstens `S.settings.dock`.

## 8. Proben / Tests

- Probe „Menüleiste 8 Gruppen“: `#nav` hat 8 Knöpfe, jeder mit `data-k`; `openModal('skills')` öffnet Charakter mit aktivem Reiter Talente.
- Probe „Protokoll folgt“: 30 Einträge, `#log.scrollTop + clientHeight >= scrollHeight - 2`; nach manuellem Hochscrollen erscheint die Pille, nach Klick folgt es wieder.
- Probe „Baukarten“: `settleUI` erzeugt eine Karte je `BUILDINGS`-Eintrag (13) mit Bild, Kosten-Piktogrammen; Karte `cant`, wenn `canAfford` falsch; Detail zeigt `w×h`.
- Probe „Toast-Warteschlange“: drei `toast()` hintereinander → drei Zeilen im Fluss, keine geht verloren.
- Messung: Kopfleiste ≤ 36 px, `#nav.scrollWidth ≤ clientWidth` bei 1280 px.
- Sichtprüfung mit den drei PNGs als Referenz.

## 9. Fragen an den Entwickler (max. 4, mit Empfehlung)

1. **Welche Variante?** A Ledger / B Diegetisch / C Taktisch / Mischung. **Empfehlung:** C mit B-Kopfleiste und -Meldungsfluss, A-Pergament nur für Lesefenster.
2. **Menüleiste: 8 Gruppen (Piktogramm + Buchstabe) statt 14 Wörter — und Talente/Zauber/Effekte als Reiter im Charakterfenster?** **Empfehlung:** ja; Hotkeys T/Z/X bleiben und springen direkt auf den Reiter.
3. **Protokoll: neueste Zeile unten (wie heute, repariert) plus verblassender Meldungsfluss am Spielfeldrand — oder nur eines davon?** **Empfehlung:** beides; der Fluss ersetzt den Einzel-Toast.
4. **Siedlung, Handel, Gruppe und Handwerk als angedockte Tafel rechts (Welt bleibt sichtbar) statt Vollbild-Fenster?** **Empfehlung:** ja ab Scheibe 3; Charakter, Karte, Kodex, Chronik bleiben Vollbild.
