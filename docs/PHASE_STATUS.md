# Phasenstatus — Rotfall: Legacy

Letzte Aktualisierung: Session 1 (2026-09-24). Nächster Einstieg: SESSION_LOG.md → offene HIGH-Einträge in BUGS.md.

| # | Phase | Status | DoD erfüllt | Fehlt noch |
|---|---|---|---|---|
| 0 | Complete Playthrough & Audit | ABGESCHLOSSEN | JA | — (zweiter Durchlauf ist Phase 21) |
| 1 | Critical Bugfixes | ABGESCHLOSSEN | JA | — |
| 2 | World Logic & NPC Reactions | ABGESCHLOSSEN | JA (Grundsystem) | Kopfgeld/Gefängnis → Phase 17 |
| 3 | Szenenübergänge, Pathfinding, Spawns | ABGESCHLOSSEN | JA | Tiefhall betretbar machen → Phase 14 |
| 4 | Gebäude & Props | ABGESCHLOSSEN | JA, mit Grenzen | Nordseiten/Nord-Türen nur angedeutet; Wildnis-Szenen nur in neuen Spielständen |
| 5 | Visual Style Revision (restliche Welt) | NICHT BEGONNEN | — | Test-Bereich (§25), Titelburg (BUG-016), „zu blockig“-Rückmeldung |
| 6 | Animation & Combat Polish | NICHT BEGONNEN | — | |
| 7 | Weapon Expansion | NICHT BEGONNEN | — | |
| 8 | Rarity & Loot | NICHT BEGONNEN | — | Rarität ist nur Etikett |
| 9 | Skill Tree | NICHT BEGONNEN | — | |
| 10 | Classes | NICHT BEGONNEN | — | |
| 11 | Enemy Expansion | NICHT BEGONNEN | — | |
| 12 | Bosses | NICHT BEGONNEN | — | |
| 13 | Cities | NICHT BEGONNEN | — | BUG-008: Städte ohne Bewohner (außer Wachen) |
| 14 | Dungeons | NICHT BEGONNEN | — | BUG-009 Tiefhall |
| 15 | NPCs & Wildlife | NICHT BEGONNEN | — | BUG-013 Tagesablauf |
| 16 | World Simulation | NICHT BEGONNEN | — | BUG-011 Karawane |
| 17 | Factions & Consequences | NICHT BEGONNEN | — | Kopfgeld |
| 18 | Audio & Atmosphere | NICHT BEGONNEN | — | Schmiede-/Tavernengeräusche an Gebäude koppeln |
| 19 | UI Polish | NICHT BEGONNEN | — | BUG-012 Touch-Steuerung |
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

## Nächster sinnvoller Schritt
Phase 5 mit Rückmeldung des Nutzers zum neuen Gebäude-Look beginnen: Testbereich (§25) mit Spieler, NPC, Gegner,
Waffe, Baum, Fels, 2 Gebäudetypen, Kiste in 2 Varianten, VFX, UI — dann die restliche Welt angleichen.
Parallel kandidiert BUG-008 (leere Städte), weil die neuen Gebäude jetzt Bewohner nahelegen.
