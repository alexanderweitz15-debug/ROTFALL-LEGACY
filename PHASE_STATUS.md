# Phasenstatus — Rotfall: Legacy

Letzte Aktualisierung: Session 11 (2026-09-26). Nächster Einstieg: SESSION_LOG.md → offene HIGH-Einträge in BUGS.md.

| # | Phase | Status | DoD erfüllt | Fehlt noch |
|---|---|---|---|---|
| 0 | Complete Playthrough & Audit | ABGESCHLOSSEN | JA | — (zweiter Durchlauf ist Phase 21) |
| 1 | Critical Bugfixes | ABGESCHLOSSEN | JA | — |
| 2 | World Logic & NPC Reactions | ABGESCHLOSSEN | JA (Grundsystem) | Kopfgeld/Gefängnis → Phase 17 |
| 3 | Szenenübergänge, Pathfinding, Spawns | ABGESCHLOSSEN | JA | — (Tiefhall betretbar seit Session 6) |
| 4 | Gebäude & Props | ABGESCHLOSSEN | JA, mit Grenzen | Nordseiten/Nord-Türen nur angedeutet; Wildnis-Szenen nur in neuen Spielständen |
| 5 | Visual Style Revision (restliche Welt) | TESTEN | JA, im Kern | Session 3: Testbereich §25, Fels, Wasser, Boden, Mauern, Grube, Titel. Offen: Leere Flächen (Totenreich) sind Inhalt → Phase 16 |
| 6 | Animation & Combat Polish | ABGESCHLOSSEN (Nutzerprüfung offen) | JA, technisch | Session 7: Deckung/Parade, Rollen-Landung, Sitzen, Handeln. Nutzer: Kampfgefühl und Klänge gegenhören. Bewusst nicht: Sprint (Shift ist Deckung), Türen als Objekte |
| 7 | Weapon Expansion | ABGESCHLOSSEN (Nutzerprüfung offen) | JA, technisch | Session 7: 19 Waffen, 13 Klassen; Rapier, Kriegshammer, Hellebarde, Armbrust, Zauberstab mit eigener Mechanik. Bewusst nicht: Kombos |
| 8 | Rarity & Loot | ABGESCHLOSSEN (Nutzerprüfung offen) | JA, technisch | Session 7: Rarität je Exemplar, 12 Affixe, 3 legendäre Effekte, 2 Unikate, Tabelle im GDD |
| 9 | Skill Tree | ABGESCHLOSSEN (Nutzerprüfung offen) | JA, technisch | Session 7: aktive Knoten (3), Umlernen beim Lehrer, 4 Titelzweige. Balancing nur im Spiel prüfbar |
| 10 | Classes | ABGESCHLOSSEN (Nutzerprüfung offen) | JA, technisch | 14 Grundklassen (+Berserker, Assassine, Barde, Alchemist), 4 Titelklassen; jede lernbar, jede mit Schwäche. Kopfgeldjäger → Phase 17 |
| 11 | Enemy Expansion | TESTEN | JA, technisch | 18 Gegnertypen mit Verhalten, Datenblatt (GDD), Ruf je Art, Anti-Kiting, Ausdauer (S11). Offen: Geist-Optik gegenprüfen, neue Gegnerwelle (§82) |
| 12 | Bosses | IN ARBEIT | teilweise | Gorak, Hrodvar; S11: Hauptmann der Toten (§81), Oberwelt-Boss Graumähne mit Welt-Folgen (§73). Offen: weitere Regionalbosse Stufe 3–4, Boss-Beute mit Identität, Schwarze Feste (BUG-100) |
| 13 | Cities | IN ARBEIT | teilweise | Siedlungsdichte §75 (S4, Reality-Check S11), Questtafel §80 (S11), Stadtfeste, Schenken. Offen: organische Anordnung (Nutzerentscheid), Quests für Aschfurt/Sonnwacht/Salzhafen |
| 14 | Dungeons | IN ARBEIT | teilweise | Session 6: Tiefhall (gebaute Halle, 8 Räume, Boss), Dungeon-Register. Offen: Rätsel/Fallen jenseits Stacheln, Questanbindung, dritter Dungeon |
| 15 | NPCs & Wildlife | IN ARBEIT | — | S10/11: Tagesplan Stufe 1, Gespräche, Gerüchte, Stadtfeste, Namen eindeutig. Offen: Stufe 2 (Jäger, Läden, Wachschichten), Beziehungen §79 |
| 16 | World Simulation / Gefahrenregionen | IN ARBEIT | teilweise | S11: §71 Stufen wirken (Veteranen, +Stufen), §74 Anmarsch. Session 6: Karawane als Zug mit Wachen, Route aus der Straße (BUG-011 ✓). Offen: nur eine Route (Eren–Nordfurt) |
| 17 | Factions & Consequences | IN ARBEIT | teilweise | S11: Kopfgeld, Festnahme, Kerker, Kopfgeldjäger (§44/§72); Regionalboss-Folgen (§73); Raids (§74); Befreiung (§81). Ruf-Stufen §43 (S11). Offen: Schwarze Feste (BUG-100), Beitritt/Ränge mit mehr Vorteilen |
| 18 | Audio & Atmosphere | NICHT BEGONNEN | — | Schmiede-/Tavernengeräusche an Gebäude koppeln |
| 19 | UI Polish | IN ARBEIT | — | Touch-Steuerung ✓ (Session 3, Gerätetest offen) |
| 20 | Performance | TEILWEISE | — | Spielstand 0,53 MB (BUG-017/057 ✓). S11: Figurenbilder ×24 schneller, Ruckler weg (BUG-093); Licht-Cache, Stempel, halbe Dunkel-Ebene. Median Stadtkern 1,9–2,1 ms, Wald 1,8 ms (versteckter Tab). Offen: Messung im sichtbaren Browser |
| 21 | Second Complete Playthrough | NICHT BEGONNEN | — | |
| 22 | Final Quality Pass | NICHT BEGONNEN | — | |

## Sofort-Prioritäten (§54) — Stand Session 11
| # | Thema | Stand |
|---|---|---|
| 1 | Siedlungsdichte §75 | Reality-Check S11 (`dichte-kreuzweg.png`, `dichte-saltport.png`): kein Wand-an-Wand mehr, Abstände 2–5 Kacheln. Offen: Anordnung rasterhaft (§75 „organisch“) — Umbau der Stadtpläne, Nutzerentscheid |
| 2 | Tagesrhythmus §41 | Stufe 1 (S10) + Stufe 2 (S11: Jäger, Markt auf/zu, Wachschichten) FERTIG. §79 Beziehungen Stufe 1 FERTIG (S11) |
| 3 | Erreichbarkeit §7 | FERTIG (BUG-079, Test BFS) |
| 4 | Kampforientierung §27 + Anti-Kiting §34 | FERTIG (BUG-084, BUG-076), Gegner-Ausdauer §28 FERTIG (S11) |
| 5 | Skelett-Stadt §81 | S11: Befreiungskampf mit Wellen, Anmarsch, Hauptmann, Heimkehr — DoD-Punkte 2–4 erfüllt. Offen: eigene Arena für die Schwarze Feste (BUG-100), Bewohner im besetzten Ort (BUG-099) |

## PRIORITÄT 1 (Nutzer, Session 9): Grafik-Revision v2 — Variante A (ganze Welt auf das feine Raster)
Anlass: Figuren wirkten wie Graveyard Keeper (Chibi, Klötze). Referenzbild (grimdarke Kapuzenfiguren) ist verbindlich.
Grundlage freigegeben („okay“, Proportionen danach korrigiert): `src/figure.js`, Bilder `screenshots/figur-v2-*`.
Raster neu: 1 Welt-Einheit je Pixel (vorher 2) — Figuren 40×60, Boss 60×76. Schätzung 2,0–3,2 Mio. Tokens.
| Schritt | Inhalt | Status |
|---|---|---|
| G0 | Grundlage: Spieler (S/N/W, Laufen), Bandit, Grabwächter (Elite), Hüne (Boss) | FERTIG (Nutzer: ok) |
| G1 | Menschen-Zeichner aus dem bestehenden Spec-System (alle Berufe, Rüstungen, Helme, Schilde, Posen, Richtungen) | TECHNISCH FERTIG — Feinschliff offen (Gesichter der Dorfbewohner, Handschuhe/Wickel) |
| G2 | Einbau ins Spiel (Pivot/Größe je Frame, Blitz, Schatten, Rolle, Liegen, Leichen, Porträts, Titel, Tests) | EINGEBAUT (82/82, Zeichnen 1,25 ms) — Goblins noch alt (G4), Waffenhand noch alte Höhe (G3) |
| G3 | Waffen neu im feinen Raster + Arm verbindet Körper und Waffe (auch Prio 6 „Waffe folgt nicht nur der Maus“) | EINGEBAUT — 20 Waffen neu (dunkles Eisen, helle Kanten); Waffenarm wird zur Hand gezogen, Hand läuft beim Schlag um die Schulter; 82/82, Zeichnen ≤ 2,0 ms |
| G4 | Gegner: Goblin-, Skelettkörper, Tiere, Gorak, Hrodvar, neue Bosse | EINGEBAUT — Goblin-Körper, 5 Tiere (Laufzyklus, Ducken, Biss, tot), Gorak als Goblin-Hüne mit Messer in der Hand; 82/82. Offen: eigene Bossgestalt für Hrodvar |
| G5 | Props im feinen Raster (pixelize ×2), schwache einzeln | IN ARBEIT — alle Props im feinen Raster (`PROP_RES = 1`), 82/82; einzelne Nacharbeit offen |
| G6 | Gebäude | GEBAUT S10 — Tür ≈ Figur, dunkler, Traufschatten, Feuchte; Stadtstile bleiben (Vorschläge V1–V4 als Referenz) |
| G-D | Stil D: gröberes Raster (1,5 Welt/Pixel) für Figuren, Waffen, Tiere, Props | FERTIG — S10, 82/82 |
| G-R2 | Referenz 2: Gesichter, schlanke Proportionen, dunkle Kleidung, Bürger-Silhouetten | FERTIG — S10 |
| G7 | Boden/Fels/Wasser im feinen Raster + Performance | offen |
| G8 | UI-Porträts, Titel, Effekte | offen |
Weitere Prioritäten aus dem „World Alive“-Prompt (NPC-Leben, Quests, Kampf, Events, Skelett-Stadt) folgen danach;
das Durchlauf-Audit (`AUDIT_PLAYTHROUGH_S9.md`) läuft parallel und wird eingearbeitet.

## Phase 9/10 — Definition of Done (§31–32) — Session 7
- [x] Knotenformen: passiv, aktiv (Fähigkeit), Schlüssel mit designIntent; Umlernen gegen Gold
- [x] Jede Klasse hat Lehrer (Ursache: drei Klassen waren unerlernbar), jede neue Klasse eine mechanische Schwäche
- [x] Nekromant/Hexenmeister weiter nur über §78 (Titel), nicht in der Startliste
- [x] EDGE CASES: Kraut über mehrere Stapel, volle Leiste, Schattenschritt in Platte/ohne Platz, Zauber ohne Mana
- [x] REGRESSION 76/76 · [x] DOKUMENTATION
- [ ] Nicht umgesetzt: Kopfgeldjäger (braucht Kopfgeldsystem → Phase 17); Balancing der Werte nur im Spiel

## Phase 8 — Definition of Done (§30, §48) — Session 7
- [x] Rarität ist nicht nur Farbe: Affixe, Werte, Sondereffekte, Wert, Bild (Klinge, Runen, Bodenglanz, Zelle)
- [x] Drop-Chancen abgestuft und als Tabelle im GDD (gemessen), Mythisch nur als Unikat; Loot bleibt kontrolliert (Tabellen je Gegner)
- [x] Ursachen behoben: Aufheben verlor das Exemplar, Verkaufen traf das falsche Exemplar
- [x] REGRESSION 73/73 · [x] DOKUMENTATION
- [ ] Nutzer: fühlen sich Funde besonders an? (Werte sind Startwerte)

## Phase 7 — Definition of Done (§29) — Session 7
- [x] Bestehende 14 Waffen erhalten; 5 Klassen dazu, jede mit eigener Regel (nicht nur Werte), eigenem Gefühl und Bild
- [x] WORLD LOGIC: jede neue Waffe hat eine Bezugsquelle, die zur Welt passt (Schmiedin, Kontor, Grenzposten, Totenschreiber)
- [x] EDGE CASES: Zauberstab ohne Magie (Meldung), Armbrust beim Spannen, Hammer gegen Deckung, unbekannte Schilde
- [x] REGRESSION 72/72 · [x] DOKUMENTATION (GDD-Matrix, Schemata)
- [ ] Nutzer: Gefühl je Klasse anspielen (Timing, Stärke) — Werte sind Startwerte

## Phase 6 — Definition of Done (§26–28, §36, §64) — Session 7
- [x] TECHNIK: Selbsttests Parade/Block/Deckungsbruch, Rollen-Landung; keine Konsolenfehler im Browserlauf
- [x] GAMEPLAY: Deckung ist echte Entscheidung (Tempo, keine Erholung, Bruch bei leerer Ausdauer), Parade belohnt Timing
- [x] WORLD LOGIC: Figuren sitzen abends in der Schenke (Ursache fehlender Bänke behoben), Händler zeigen Ware
- [x] VISUAL/ANIMATION: Posen Deckung (Klinge schräg, Schild vor), Sitzen (Waffe abgelegt), Handeln, Landung in den Knien
- [x] AUDIO: Metallklang bei Deckung/Block/Parade (vorhandene Klänge) — Gegenhören durch den Nutzer offen
- [x] EDGE CASES: Rolle beendet Deckung; Stadtwachen (guard-Flag) blocken nicht (Regressionstest); Geschosse nicht parierbar
- [x] REGRESSION 71/71 · [x] DOKUMENTATION
- [ ] Nicht umgesetzt (bewusst): Sprint, Türen öffnen (Türen sind Lücken, keine Objekte), Aufladeangriff

## Phase 4 — Definition of Done (Gebäude §20 / Props §22)
- [x] Funktion von außen erkennbar (Schild mit Symbol, Esse, Banner, Kräuter, Rosette/Kreuz, Wappen, Säcke)
- [x] Dach mit Material, Tür, Fenster passend zur Größe, Material-/Wetterdetails (Nässe, Moos, Ruß, Spritzschmutz)
- [x] Silhouetten variieren (Walm/Sattel, Größe, Schornstein ja/nein, Holzstapel, Blumenkasten); Städte unterscheiden sich im Material
- [x] Innenraum passt zur Funktion; Feuerschein innen = Feuerstelle vorhanden
- [x] Kein „Box mit Dach“-Platzhalter mehr in Siedlungen
- [x] Props: Kiste/Fass je 3 Varianten, Platzierung mit Grund, Wildnis-Truhen als Szene
- [ ] Stichprobe „10 zufällige Props anklicken“ — nur teilweise (Städte ja, Wildnis alter Spielstände nicht umgebaut)

## Phase 5 — Definition of Done (§23–25)
- [x] Testbereich (§25): `RF.styleArea()` — Spieler, NPC, Wache, 6 Gegner, 5 Gebäudetypen inkl. Ruine, Kisten/Fässer
      in allen Varianten, Fels, Wasser, Sumpf, Sand, Acker, Asche, Bäume, Effekte nebeneinander; Bilder `stil-testbereich-*`
- [x] Keine Kachelblöcke mehr bei Fels, Wasser, natürlichen Böden; Mauern und Höhlen mit Höhe
- [x] Materialdefinition: Regionsgestein, Wassertiefe, Geröll statt Pflaster in der Wildnis
- [x] Titelbild im Pixelraster (BUG-016)
- [x] Performance: Backen in Leerlaufzeit, Lauftest 2000 Frames Median 1,8 ms (verdecktes Fenster, gedrosselt)
- [ ] Regionen mit großen leeren Flächen (Totenreich) — kein Stil-, sondern Inhaltsproblem → Phase 16/§38

## §75 Siedlungsdichte — Definition of Done (Session 4)
- [x] Mindestabstand zwischen Gebäuden (≥ 2 Kacheln, Selbsttest); Ausnahmen: keine
- [x] Hauptwege ≥ 3 Kacheln, Gassen 1–2
- [x] Bebaute Fläche 11–18 % (Richtwert < 50 %)
- [x] Einwohner nach Fläche (perHead), Tagesziele verteilt
- [x] Peripherie: Felder, Höfe, Gärten; Übergang zur Wildnis ohne harten Schnitt (Trampelpfade, Hofränder)
- [x] Vorher/Nachher-Bilder `stadt-vorher-*` / `stadt-nachher-*`
- [ ] Stresstest „viele NPCs gleichzeitig unterwegs“ nur als Messung (Update 0,9 ms), nicht als Gedränge-Sichtprüfung

## §78 Nekromant/Hexenmeister — Definition of Done (Session 4)
- [x] 5 Stufen (Kontakt, Prüfung, Entscheidung, Initiation, Titelklasse), kein Einzeldialog
- [x] Pfade unterscheiden sich in Ressource, Ton, Fähigkeiten, Makel, Preis
- [x] Totenreich: Ahnenaltar, Schattenkreis, Gruft (S4) + Vharnholm, Knochenwald, Aschensee/Seelenbrunnen (S5)
- [x] Ordensreaktion getestet (Gespräch verweigert, Wachen greifen an)
- [x] Sichtbares Merkmal (glimmende Augen), nicht nur Variable
- [x] Skill-Tree-Keystone (Legion bzw. Blutpakt), erst nach der Freischaltung erreichbar (Session 5)
- [x] Unumkehrbarkeit im GDD dokumentiert

## Nächster sinnvoller Schritt
Rückmeldung des Nutzers zur großen Karte (Reisewege). Dann BUG-017/057 Spielstandgröße, BUG-011 Karawane, BUG-009 Tiefhall.

## Session 11: Endgame Eisenmark
- [x] Welt nach Osten erweitert (1024×768), Kettenpass, Kettenfeste, Steinbruch, Grubenhort
- [x] 7 Fraktionen (neu: Eiserne Kette, Grubenstämme); Befreiung macht Goblins friedlich, mit Dorf und Händlerin
- [x] 2 neue Waffen, 7 neue Rüstungsteile, 2 neue Gegner, Endboss Varg; Selbsttest 117/117
- [x] Übergabe-Dokument für externe Mitarbeit: `HANDOFF_WELT_FRAKTIONEN_AUSRUESTUNG.md`
- [ ] Grisk-Aufträge, Gespräche mit Gefangenen, Schwierigkeitsgrade (Hebel `BAL`)

## Session 12: Arsenal der Mark
- [x] 16 Waffen, 14 Rüstungsteile, 2 Gegner, Rüstungskomponenten, Kette in Schwarz-Rot, variierte Wachen, Relikt; Selbsttest 118/118
- [ ] Kettenfeste als lebende Militärstadt (Tagesablauf, Kriegsraum), Tribut und Tributkarawane, Feldzüge der Kette gegen die Untoten
- [ ] Grisk-Aufträge, Schwierigkeitsgrade (`BAL`)
- [x] Stil Referenz 3/4, erste Runde: Figuren (Abnutzung, Blut, Umhänge, Wickel, Rucksack), Boden, Dächer, Bäume
- [ ] Stil Referenz 4, weiter: Wasser/Klippen, Ruinen, Friedhof, Wetter (Blutregen, Sandsturm), Markt-Planen, Banner
- [x] Leute Teil 2 (Wappenrock, Stola, Hüte, Helme), Wetter je Gegend, Wasser, Banner, Grabsteine
- [x] Karte 1280×768 (Grauland), 8 Dörfer unter Valen, Orden, Händlern und der Kette; Selbsttest 119/119
- [ ] Nächster Block (Nutzer): Masterplan-Phasen, weitere Waffen und Rüstungen, Lore und Leben der Eisenfeste (Tribut, Feldzüge, Tagesablauf)
- [x] Neuordnung West (Eisenfeste-Festungsgebiet, Goblins, Tribut) / Mitte (Menschen) / Ost (Totenland), fließende Übergänge; Weltkarte mit Nebel; Varg hält Hof; Waffen neu gezeichnet, Griff mit beiden Händen; Mordfolgen; 121/121
- [ ] Tribut-Karawanen und Klagen der Dörfer, Feldzüge der Kette, Tagesablauf der Feste; Grisk-Aufträge; Schwierigkeitsgrade
- [x] Welt von Valoris: 1536×1024, Wüstensporn, Inseln, Küste, Seen, ~100–190 Streuorte, Karte mit Symbolen; 121/121 über vier Seeds
- [ ] Figuren-Neuaufbau (Nutzer: 48–64 px, schwerer, mehr Details, Animationen idle/laufen/angriff/treffer/tod je Waffenklasse)
- [x] Hochreich Aurelion (5 Städte, Adel, Automaten, Prothesen, Gliedverlust), Karte ruhiger, Sichtliste im Raster; 123/123
- [x] Figuren feiner (kein Vergröbern) und 1,2× größer, schwererer Körperbau, Detailpass
- [ ] Figuren Runde 2 nach Nutzer-Rückmeldung: eigene Silhouetten je Klasse (Fell, Schulterpanzer, Gesichter), Laufzyklus mit Armpendeln, Angriffsposen je Waffenklasse feiner
