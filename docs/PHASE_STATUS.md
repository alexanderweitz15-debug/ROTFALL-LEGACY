# Phasenstatus — Rotfall: Legacy

Letzte Aktualisierung: Session 3 (2026-09-25). Nächster Einstieg: SESSION_LOG.md → offene HIGH-Einträge in BUGS.md.

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
| 9 | Skill Tree | NICHT BEGONNEN | — | |
| 10 | Classes | NICHT BEGONNEN | — | |
| 11 | Enemy Expansion | NICHT BEGONNEN | — | |
| 12 | Bosses | NICHT BEGONNEN | — | |
| 13 | Cities | IN ARBEIT | teilweise | Ausbau + Bewohner fertig (Session 2); Landmarken, Händler je Stadt, Quests fehlen |
| 14 | Dungeons | NICHT BEGONNEN | — | BUG-009 Tiefhall |
| 15 | NPCs & Wildlife | IN ARBEIT | — | Bewohner mit Tagesablauf ✓; benannte NPCs, Tiere offen |
| 16 | World Simulation | NICHT BEGONNEN | — | BUG-011 Karawane |
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

## Nächster sinnvoller Schritt
BUG-011 Karawane (Wagen, Tiere, Wachen), dann BUG-009 Tiefhall, dann BUG-017 Spielstandgröße. Details: SESSION_LOG Session 3.
