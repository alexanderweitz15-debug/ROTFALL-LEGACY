# Phasenstatus — Rotfall: Legacy

Letzte Aktualisierung: Session 5 (2026-09-25). Nächster Einstieg: SESSION_LOG.md → offene HIGH-Einträge in BUGS.md.

| # | Phase | Status | DoD erfüllt | Fehlt noch |
|---|---|---|---|---|
| 0 | Complete Playthrough & Audit | ABGESCHLOSSEN | JA | — (zweiter Durchlauf ist Phase 21) |
| 1 | Critical Bugfixes | ABGESCHLOSSEN | JA | — |
| 2 | World Logic & NPC Reactions | ABGESCHLOSSEN | JA (Grundsystem) | Kopfgeld/Gefängnis → Phase 17 |
| 3 | Szenenübergänge, Pathfinding, Spawns | ABGESCHLOSSEN | JA | Tiefhall betretbar machen → Phase 14 |
| 4 | Gebäude & Props | ABGESCHLOSSEN | JA, mit Grenzen | Nordseiten/Nord-Türen nur angedeutet; Wildnis-Szenen nur in neuen Spielständen |
| 5 | Visual Style Revision (restliche Welt) | TESTEN | JA, im Kern | Session 3: Testbereich §25, Fels, Wasser, Boden, Mauern, Grube, Titel. Offen: Leere Flächen (Totenreich) sind Inhalt → Phase 16 |
| 6 | Animation & Combat Polish | IN ARBEIT | teilweise | Session 3: Taumeln/Unterbrechen, rutschender Rückstoß, Interaktionsposen. Treffer-Klang je Material. Offen: Sitzen/Handeln-Posen; Klänge vom Nutzer gegenhören lassen |
| 7 | Weapon Expansion | NICHT BEGONNEN | — | |
| 8 | Rarity & Loot | NICHT BEGONNEN | — | Rarität ist nur Etikett |
| 9 | Skill Tree | IN ARBEIT | teilweise | Session 5: 3 allgemeine + 3 Titelzweige, Schlüsselknoten mit Preis/Absicht. Offen: Umlernen, Balancing im Spiel |
| 10 | Classes | IN ARBEIT | teilweise | Titelklassen Nekromant/Hexenmeister/Druide, max. 2 je Figur, Titelzweige im Skill-Baum (§78 Keystone ✓). Weitere Titelklassen nur Entwurf |
| 11 | Enemy Expansion | NICHT BEGONNEN | — | |
| 12 | Bosses | NICHT BEGONNEN | — | |
| 13 | Cities | IN ARBEIT | teilweise | Session 4: Siedlungsdichte §75 erfüllt (Abstand, Fläche, Einwohner nach Größe). Landmarken, Händler je Stadt, Quests fehlen |
| 14 | Dungeons | NICHT BEGONNEN | — | BUG-009 Tiefhall |
| 15 | NPCs & Wildlife | IN ARBEIT | — | Bewohner mit Tagesablauf ✓; benannte NPCs, Tiere offen |
| 16 | World Simulation | IN ARBEIT | — | Session 5: Totenreich erweitert (Vharnholm, Knochenwald, Aschensee). BUG-011 Karawane offen |
| 17 | Factions & Consequences | NICHT BEGONNEN | — | Kopfgeld |
| 18 | Audio & Atmosphere | NICHT BEGONNEN | — | Schmiede-/Tavernengeräusche an Gebäude koppeln |
| 19 | UI Polish | IN ARBEIT | — | Touch-Steuerung ✓ (Session 3, Gerätetest offen) |
| 20 | Performance | TEILWEISE | — | Wald-Zeichnen 2,8 ms (Budget 2,0); Spielstand 800 KB (BUG-017) |
| 21 | Second Complete Playthrough | NICHT BEGONNEN | — | |
| 22 | Final Quality Pass | NICHT BEGONNEN | — | |

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
