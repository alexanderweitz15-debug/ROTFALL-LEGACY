# Phasenstatus — Rotfall: Legacy

Letzte Aktualisierung: Session 6 (2026-09-25). Nächster Einstieg: SESSION_LOG.md → offene HIGH-Einträge in BUGS.md.

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
| 9 | Skill Tree | IN ARBEIT | teilweise | Session 5: 3 allgemeine + 3 Titelzweige, Schlüsselknoten mit Preis/Absicht. Offen: Umlernen, Balancing im Spiel |
| 10 | Classes | IN ARBEIT | teilweise | Titelklassen Nekromant/Hexenmeister/Druide/Mönch (Session 6), max. 2 je Figur, Titelzweige im Skill-Baum (§78 Keystone ✓). Kopfgeldjäger/Barde/Alchemist nur Entwurf |
| 11 | Enemy Expansion | NICHT BEGONNEN | — | |
| 12 | Bosses | IN ARBEIT | teilweise | Gorak (Sturm, Beben), Hrodvar (Eiskreis, Leibwache, Session 6). Offen: Bosse der Oberwelt, Beute mit Eigenschaften (Phase 8) |
| 13 | Cities | IN ARBEIT | teilweise | Session 4: Siedlungsdichte §75 erfüllt (Abstand, Fläche, Einwohner nach Größe). Landmarken, Händler je Stadt, Quests fehlen |
| 14 | Dungeons | IN ARBEIT | teilweise | Session 6: Tiefhall (gebaute Halle, 8 Räume, Boss), Dungeon-Register. Offen: Rätsel/Fallen jenseits Stacheln, Questanbindung, dritter Dungeon |
| 15 | NPCs & Wildlife | IN ARBEIT | — | Bewohner mit Tagesablauf ✓; benannte NPCs, Tiere offen |
| 16 | World Simulation | IN ARBEIT | — | Session 6: Karawane als Zug mit Wachen, Route aus der Straße (BUG-011 ✓). Offen: nur eine Route (Eren–Nordfurt) |
| 17 | Factions & Consequences | NICHT BEGONNEN | — | Kopfgeld |
| 18 | Audio & Atmosphere | NICHT BEGONNEN | — | Schmiede-/Tavernengeräusche an Gebäude koppeln |
| 19 | UI Polish | IN ARBEIT | — | Touch-Steuerung ✓ (Session 3, Gerätetest offen) |
| 20 | Performance | TEILWEISE | — | Spielstand 0,53 MB (BUG-017/057 ✓). Offen: Wald-Zeichnen 2,8 ms (Budget 2,0), im echten Browser messen |
| 21 | Second Complete Playthrough | NICHT BEGONNEN | — | |
| 22 | Final Quality Pass | NICHT BEGONNEN | — | |

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
