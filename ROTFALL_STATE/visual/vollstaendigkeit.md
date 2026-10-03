# Vollständigkeitsprüfung — Systeme, halbe Features, Text statt Bild

Stand: 03.10.2026 (Prüf-Agent). **Nur Prüfung, kein Code geändert.** Grundlage: CLAUDE.md, GATE.md, VISUAL.md,
docs/IST_ZUSTAND.md (Stand v19, 29.09.), docs/MECHANIKEN.md, ROTFALL_STATE/OFFEN.md, ROTFALL_STATE/visual/ui_menues.md,
plus eigener Codeabgleich (`src/ui.js` `openModal`-Liste, `src/game.js` Menüfunktionen, `debugSections`). Die Systeme mit
eigenem Dock wurden gegen den aktuellen Code geprüft (03.10.); IST_ZUSTAND.md ist 4 Tage älter, einiges ist seither
gebaut (Stall, Tierhändler, Schmiede-Dock, Reise-Dock, Handwerk, Betriebe-Reiter) — das ist unten korrigiert.

## 1. Inventar der Spieler-Systeme

Legende GUI: **Dock** = eigenes Fenster (`UI.openModal`) · **Liste** = nur `UI.dialogue`-Textzeilen beim NPC.

| System | Code | GUI | Hinweis im Spiel | Debug | MECHANIKEN.md | Koop | Speicher-Verträglich | Bewertung |
|---|---|---|---|---|---|---|---|---|
| Inventar | `invUI` | **Dock** (Papierpuppe, Filter, Drag&Drop) | ja (Tooltips, Zustand) | ja | ja | ja (eigener Bestand) | ja | gut |
| Charakter/Körper | `charUI`, `bodyChart` | **Dock** | ja (Hover-Erklärung je Wert) | ja | ja | ja | ja | gut |
| Gruppe/Gefährten | `partyUI` | **Dock** | teilweise | ja | ja | ja | ja | ok, Gefährten ohne eigene Ausrüstungsverwaltung (s. halbe Features) |
| Lager & Siedlung | `settleUI` | **Dock** (2-spaltig seit 02.10.) | ja | ja | ja | ja | ja | gut, aber nur 12 Bauten, kein Städtebau (P14 offen) |
| Fraktionen/Ruf | `facUI` | **Dock** | ja (Rangführer-Text) | ja | ja | ja | ja | gut |
| Chronik | `chronUI` | **Dock** (Pergament seit 02.10.) | ja | ja | ja | ja | ja | gut |
| Weltkarte | `mapUI`/`atlas.js` | **Dock** | ja (POIs, Lehrer gelb) | ja | ja | ja | ja | gut |
| Handel (Händler) | `tradeUI` | **Dock** | ja | ja | ja | **Gast: nur Dialog-Liste, kein Dock** (s. unten) | ja | Host gut, Koop-Gast halb |
| Einstellungen | `settingsUI` | **Dock** | ja | – | – | ja | ja | gut |
| Ausbildung/Klassen | `classUI` | **Dock** (Wechsel, Respec) | ja | ja | ja | unklar, nicht geprüft | ja | gut; **Lernen beim Lehrer selbst bleibt Dialog** (`teach()`) |
| Aufträge | `questUI` | **Dock** (Brief, Tracker Q-1..Q-4) | ja | ja | ja | ja | ja | gut |
| Talente/Skilltree | `skillUI` | **Dock** (Knoten, Linien, Icons) | ja | ja | ja | unklar | ja | gut |
| Aktive Effekte | `effectsUI` | **Dock** | ja | ja | ja | ja | ja | gut |
| Kodex/Handbuch | `codexUI` | **Dock** | ja | ja | ja | ja | ja | gut |
| Zauberbuch (bekannte Zauber) | `spellUI` | **Dock** | ja | ja | ja | unklar | ja | gut; **Zauber lernen beim Lehrer bleibt Dialog** (`spellMenu()`) |
| Stall/Pferdehof | `stableUI` | **Dock** (Pferdekarten) | ja | ja | ja | unklar | ja | gut |
| Tierhändler (zahm) | `beastsUI` | **Dock** (seit 03.10. früh) | ja | ja | nein (MECHANIKEN.md noch nicht nachgetragen) | unklar | ja | gut, Doku-Nachtrag fehlt |
| Handwerk (Esse/Werkbank/Kessel) | `craftUI` | **Dock** (Rezeptkarten, Güte) | ja | ja | ja | unklar | ja | gut |
| Betriebe (Kontor-Teil) | `bizUI` | **Dock** (Reiter, Kasse) | ja | ja | ja | unklar | ja | gut |
| Schmiede (Reparatur) | `smithUI` | **Dock** (seit 03.10.) | ja | ja | nein (Doku-Nachtrag fehlt) | unklar | ja | gut |
| Kutsche/Fähre | `travelUI` (`coachTalk`) | **Dock** (Weltkarte, Fallback Dialog für Koop-Gast) | ja | ja | ja | Gast: Dialog-Fallback | ja | gut |
| **Prothesen-Werkbank** | `mechMenu` | **Liste** | ja (X-Fenster zeigt Zustand) | ja | ja | unklar | ja | **Text statt Bild** — nächste Priorität laut OFFEN.md |
| **Kontor (Markt, Wagen, Lieferungen)** | `ecoMenu`, `ordersMenu` | **Liste** | teilweise | ja | ja | unklar | ja | **Text statt Bild** — nach Prothesen-Werkbank geplant |
| **Lehrer-Dialog (Klasse lernen)** | `teach` | **Liste** | ja (Kodex „Lehrer“) | ja | ja | unklar | ja | Text statt Bild, aber mit Vorgeschichte/Beziehung — eher Dialog-geeignet |
| **Zauber lernen** | `spellMenu` | **Liste** | ja | ja | ja | unklar | ja | Text statt Bild |
| **Schwarzmarkt** | `blackMarket` | **Liste** | teilweise | unklar | nein | unklar | ja | Text statt Bild, kein eigener Debug-Einstieg gefunden |
| **Luftschiff-Hafen** | `harborTalk` | **Liste** | teilweise | unklar | ja (Aurelion) | unklar | ja | Text statt Bild |
| **Frachtschiff** | `cargoMenu` | **Liste** | teilweise | unklar | ja (Überfahrt) | unklar | ja | Text statt Bild, niedriger Nutzen (selten genutzt) |
| **Heiler** | `healerTreat` | **Liste** (1 Knopf) | ja | unklar | ja | unklar | ja | Text ok — Funktion ist trivial, GUI würde kaum helfen |
| **In die Stadt investieren** | `investMenu` | **Liste** | teilweise | unklar | ja (Wohlstand 100) | unklar | ja | Text statt Bild |
| **Akademie-Prüfung** | `trialMenu` | **Liste** | ja | ja | ja | unklar | ja | Text ok (Prüfung selbst ist ein Minispiel, Menü ist nur Auswahl) |
| **Schuldknechtschaft (Bond)** | `bondMenu` | **Liste** | ja | ja | ja | unklar | ja | Text statt Bild |
| Gericht/Haft (Kerker) | `jail`-Funktionen | **Liste** + Minispiel (Schloss knacken) | ja | ja | ja | unklar | ja | ok, Minispiel ersetzt reinen Text teilweise |
| Bionik/Roboterauge | `mechMenu` (s. o.) | **Liste** | ja (X-Fenster, Warnung bei 30 %) | ja | ja | unklar | ja | Text statt Bild (gleiches Menü wie Prothesen) |
| Ehe/Erbe | `chooseSuccessor`, Todesbildschirm | Bildschirm (Erbenkarten, Pergament) | ja | ja | ja | unklar | ja | gut für den Erbfall; **laufende Ehe/Bindungen während des Spiels nur über Dialog/Beziehungswert**, kein eigenes Fenster |
| Fraktionsränge (Rangprüfung) | `rankGuide`, Fraktions-NPC | Text im `facUI`-Dock + Dialog für die Prüfung selbst | ja | ja | ja | unklar | ja | Rangübersicht gut, Prüfungsablauf bleibt Dialog (vertretbar) |

**Bereits vor dieser Prüfung erledigt (aus OFFEN.md, hier nur bestätigt):** Stall, Tierhändler, Schmiede-Dock,
Reise-Dock (Kutsche/Fähre), Handwerk, Betriebe-Reiter, Skilltree-Linien/Icons, Pergament (Kodex/Chronik/Aufträge),
Meldungsfluss/Fund-Karte/Warnchip (Scheibe 4), Aufträge Q-1..Q-4.

## 2. Halbe Features (angekündigt/teilweise, aber nicht fertig)

| # | Befund | Beleg | Aufwand | Priorität |
|---|---|---|---|---|
| H1 | **Koop-Gast handelt nicht im Handels-Dock**, sondern über eine Text-Dialogliste (`guestShop()` in coop.js), weil `tradeUI` einen lebenden NPC statt der Momentaufnahme `shopData` braucht. Als BLOCKIERT gemeldet (OFFEN.md 02.10.). | `src/coop.js guestShop`, `src/ui.js tradeUI` | M | Hoch — sichtbarer Unterschied Host/Gast |
| H2 | **Ritter hat die Fähigkeit „Segen“, aber ohne gelernten Zauber kein Mana** — die Segen-Sterne im Talentbaum sind für diese Klasse wirkungslos, bis ein Heilzauber gelernt ist. Offene Designfrage, nicht gebaut. | OFFEN.md „03.10. früh“ | S (Fix) / Design nötig | Mittel |
| H3 | **Koop-Gäste bekommen beim Stufenaufstieg keine Talentpunkte.** Bug, als Fehler aus der Klassen-Analyse gemeldet, noch nicht behoben. | OFFEN.md „Nacht (02.10., 22:00)“ | S–M | Hoch (Koop-Spieler bemerken es sofort) |
| H4 | **Der Erbe hat bis zum Neuladen 0 Talentpunkte.** Nachfolge-Übergabe vergisst die Punktzuteilung. | OFFEN.md ebd. | S | Hoch |
| H5 | **Vampir und Grubenhäuptling (Titel/Fraktionsklassen) haben keinen eigenen Talentzweig** trotz Erwähnung in der Klassenanalyse. | OFFEN.md ebd. | M–L | Mittel |
| H6 | **Schleich-Fertigkeit wächst nicht durch Übung** — das Spiel sagt das selbst im Tooltip („Wächst noch nicht durch Übung — das kommt mit dem Schleich-System“). Jagd, Handwerk-Fertigkeit und Schmieden ebenso als „noch ohne Wirkung“ markiert. Ehrlich kommuniziert, aber vier Fertigkeiten im Charakterfenster sind faktisch Platzhalter. | `src/ui.js:1204`, MECHANIKEN.md „Hinweise für Spieler“ | L (echtes Schleich-System) | Mittel |
| H7 | **Zauberlehrer ohne zugehörige NPC-Figur:** `sp_regen` nennt „Druidin“, `sp_shock` „Magitech-Ingenieurin“ als Lehrer — keine NPC-Definition hat dafür `spellsTaught`. `sp_staunch` nennt „Elena“, die laut Datentabelle aber nur `sp_minorheal` lehrt. Der Zauber ist im Spiel nicht erlernbar, der Kodex verweist auf eine Sackgasse. | docs/IST_ZUSTAND.md §3.2 | S–M (NPC zuordnen oder Text ändern) | Hoch — direkte Spieler-Sackgasse |
| H8 | **Seevolk-Ränge 2 und 4 sind nie erreichbar**, das Spiel sagt nur „Dieser Rang ist noch nicht erreichbar“ dauerhaft. Für den Spieler wirkt der Rangpfad kaputt, obwohl es als Zwischenstand gemeint war. | docs/IST_ZUSTAND.md §3.3, `game.js:14101` | M | Mittel |
| H9 | **Schwarze Feste nicht befreibar** (BUG-100): Das Untotenheer steht dauerhaft dort, die Umgebung ist leer; ein Goblin steht an der falschen Stelle im Totenland (BUG-143). Wirkt wie ein unvollendeter Questort. | docs/IST_ZUSTAND.md §3.8 | L | Mittel |
| H10 | **Fall Aurelions fehlt als Weltereignis:** Tötet man den ganzen Hohen Rat, gibt es nur Einzelfolgen je Herrscher, keine Gesamtreaktion der Welt (Fraktionen, Nachfolge, Chronik-Großereignis) — widerspricht GATE.md §11 (wichtige Ereignisse müssen Weltzustand sein). | docs/IST_ZUSTAND.md §3.14, PLAN_S15 P18 | L | Hoch (Gate-Verstoß) |
| H11 | **Akademie ohne Innenleben:** Studenten haben keinen Tagesablauf, zwei Bücher-Rückgabequests für Ilvar fehlen, „verbotene Magie“ ist im Magischen Gericht nicht als Anklagepunkt verankert — obwohl Verbotene-Magie-Kopfgeld an anderer Stelle existiert (Inkonsistenz zwischen Teilsystemen). | docs/IST_ZUSTAND.md §3.17 | L | Mittel |
| H12 | **Boss-Intros fehlen komplett:** kein Kamerafahrt-Erstkontakt bei Varg, Hrodvar, Garmadon, Gorak, Dodon, kein Kerkerausbruch-Intro. VISUAL.md fordert aber genau solche Momente bei wichtigen NPCs/Bossen. | docs/IST_ZUSTAND.md §3.7 | M (Kamera-System existiert bereits, `cinematic`) | Hoch (VISUAL-Priorität „Welt/Bosskämpfe“) |
| H13 | **Doppelte Ereignis-Einträge:** `evTaxman` und `evFailedHarvest` stehen je zweimal in `EVENTS` und laufen deshalb doppelt so oft wie andere Zufallsereignisse — ungeprüft, ob gewollt. | docs/IST_ZUSTAND.md §3.19 | S | Niedrig |
| H14 | **Nach jedem Selbsttest bleiben fremde Probe-Aufträge** („Die Auftraggeberin: Probe“, „Die Ladung zurückholen: …“) im (nicht gespeicherten) Tab-Zustand sichtbar im Auftragsbuch — kein Speicherschaden, aber ein sichtbarer Blindgänger direkt nach dem Test. | OFFEN.md „03.10. nachts“ | S | Niedrig |
| H15 | **Mehrere Pläne explizit als „teilweise“ markiert, ohne Restpunkte zu nennen** (P5 Akademie, P10 Aurelion-Magitech, P14 Städtebau, P18 Aurelion-Fall, P21 Seevolk, P22 Gruppe) — nach GATE.md §10 dürfen diese nicht als „fertig“ gelten; sie sind korrekt als offen gelistet, aber in MECHANIKEN.md teils gar nicht erwähnt, sodass ein Spieler sie für vollständig halten könnte. | docs/IST_ZUSTAND.md §4 | – (Dokupflege) | Niedrig |

## 3. Text statt Bild (VISUAL.md-Lücken)

Systeme, bei denen der Spieler noch einen Absatz NPC-Text lesen muss, statt es zu sehen (Rangfolge nach VISUAL.md §4 und Nutzen/Aufwand aus ui_menues.md):

| # | Bereich | Was fehlt visuell | Aufwand | Priorität |
|---|---|---|---|---|
| T1 | Prothesen-Werkbank (`mechMenu`) | Keine Körper-Karte mit Gliedern, Stufen, Modulen als Bilder — nur Textzeilen. Höchster Nutzen laut UI-Agent-Bewertung. | M–L | **Höchste** (bereits als nächstes GUI-Projekt entschieden, OFFEN.md) |
| T2 | Kontor (`ecoMenu`, `ordersMenu`) | Markt/Lieferungen/Wagen als reine Preislisten; keine Warenkarten, keine Kartenübersicht der Lieferziele. | L | **Hoch** (als übernächstes Projekt entschieden) |
| T3 | Schwarzmarkt (`blackMarket`) | Soll laut items.md als Raster wie der normale Handel kommen — bisher nur Dialogliste. | M | Mittel |
| T4 | Zauber lernen (`spellMenu`) | Keine Zauberkarten mit Schule/Kosten/Rang-Vorschau beim Lehrer (das Zauberbuch selbst hat das bereits, der Lernvorgang nicht). | M | Mittel |
| T5 | Luftschiff-Hafen / Frachtschiff (`harborTalk`, `cargoMenu`) | Reiseziele nur als Textzeilen statt als Kartenpunkte wie beim neuen Reise-Dock. | M | Mittel (Hafen selten genutzt) |
| T6 | In die Stadt investieren (`investMenu`) | Keine Visualisierung des Wohlstands/Bauplans; nur Zahlen im Text. | S–M | Niedrig–Mittel |
| T7 | Schuldknechtschaft (`bondMenu`) | Kein Fortschrittsbalken für die Schuld, keine Darstellung der sechs Auswege außer Text. | M | Niedrig–Mittel |
| T8 | Boss-Mechaniken (`heavy`-Angriffe) | Bodenmarkierung existiert bereits (gut), aber **Bossgespräche** (Weißbart, Garmadon) laufen als reiner Text-Dialog ohne Gesicht/Pose-Wechsel, obwohl VISUAL.md §3 „Dialoge“ Priorität 1 ist. | M | Hoch (Dialoge sind VISUAL-Priorität 1) |
| T9 | Fraktionsrang-Prüfungen | Bestehen/Scheitern wird nur als Textmeldung gemeldet, keine eigene Abschluss-Animation wie bei Quests (Q-3/Q-4 haben das bereits). | S–M | Niedrig |

## 4. Top 10 Empfehlungen (für den Lead)

1. **H3/H4 sofort fixen** (Koop-Talentpunkte bei Level-up und Nachfolge) — reine Bugs, kleiner Aufwand, aktuell spürbar für Koop/Erbe-Spieler.
2. **T1 Prothesen-Werkbank als Dock bauen** — höchster GUI-Nutzen laut eigener Bewertung, bereits als nächstes eingeplant; hier nur bestätigt.
3. **T2 Kontor als Dock bauen** — zweitgrößter Hebel, aber groß (L); danach ist praktisch kein Kernsystem mehr reine Textliste außer Nischen (Heiler, Hafen, Frachtschiff).
4. **H7 Zauberlehrer-Zuordnung klären** — toter Questpfad, Spieler findet online drei Zauber, die niemand lehrt; kleine Korrektur mit großer Wirkung gegen Frust.
5. **H1 Koop-Handels-Dock** — sichtbarer Qualitätsunterschied zwischen Host und Gast; braucht einen Adapter für `tradeUI`, wie vom UI-Agenten skizziert.
6. **H10 Fall Aurelions als Weltereignis** — verstößt gegen GATE.md §11 (wichtige Tode/Stadtfälle müssen Weltzustand sein); aktuell nur Einzelreaktionen.
7. **H12 Boss-Intros** — VISUAL.md fordert genau das für Bosskämpfe (Priorität 4/10); das Kamerasystem existiert schon, es fehlt nur die Anwendung auf 5 Bosse + Kerkerausbruch.
8. **T8 Bossgespräche visuell aufwerten** — Dialoge sind VISUAL-Priorität 1, aber ausgerechnet die wichtigsten Gespräche (Weißbart, Garmadon) sind reiner Text ohne die Dialog-Verbesserungen, die sonst schon gebaut wurden.
9. **H8 Seevolk-Ränge 2/4 reparieren oder umbenennen** — dauerhafte „nicht erreichbar“-Meldung wirkt wie ein kaputter Fortschrittspfad; entweder Zwischenschritt einbauen oder Rang entfernen/umbenennen.
10. **H6 Schleich-/Jagd-/Schmied-Fertigkeit** — vier Fertigkeiten im Charakterfenster sind Platzhalter ohne Spielwirkung; entweder ans Übungssystem anschließen (wie alle anderen Fertigkeiten) oder im UI klarer als „geplant“ statt als Wert zwischen echten Fertigkeiten zeigen.

Vollständige Belege, Dateipfade und Zeilennummern stehen in den Abschnitten 1–3 oben bzw. in den zitierten
Quelldokumenten (IST_ZUSTAND.md §3/§4, OFFEN.md, ui_menues.md).
