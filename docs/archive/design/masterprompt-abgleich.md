# Abgleich mit dem großen Master-Prompt (MP2) — Stand S14

✅ erfüllt · 🟡 teilweise (Lücke dabei) · ⬜ offen. Quellen: PHASE_STATUS, WELTREGELN, BUGS, Selbsttest (215 Proben).

## Sofort-Priorität (§54, wieder geöffnete Punkte)
| Punkt | Stand | Lücke |
|---|---|---|
| Siedlungsdichte §75 | 🟡 | Mindestabstand ≥ 2 statt ≥ 5 Kacheln; organische statt gerasterte Anordnung offen (Designfrage) |
| NPC-Tagesrhythmus §41 | ✅ | Jäger, Läden, Wachschicht, Talk-Pairs mit Proben; Rest: A-02 (morgens laufen viele in einer Reihe) |
| Erreichbarkeit §7 | ✅ | BFS-Test; A-04 behoben (Rohstoffe auf Fels rücken auf die nächste begehbare Kachel, Probe) |
| Kampforientierung §27 / Anti-Kiting §34 | ✅ | Körper folgt dem Ziel; Nachsetzen, Speer, Gorak/Hrodvar bestrafen Abstand |
| Befreiungsorte §81 | 🟡 | Skelett-Stadt mit Wellen und Hauptmann ✅; Schwarze Feste praktisch nicht befreibar (BUG-100) |

## Grundlagen und Prozess
| § | Thema | Stand | Lücke |
|---|---|---|---|
| 0/3/6 | Lebende Dokumente, Sessionroutine | ✅ | — |
| 7 | Kompletter Agent-Durchlauf | 🟡 | Phase 0 einmal; zweiter vollständiger Durchlauf (§53, Phase 21) fehlt |
| 8 | Bug Ledger | ✅ | 1 HIGH, 3 MEDIUM, 3 LOW offen |
| 12 | Reaktionsmatrix | ✅ | im GDD ausgefüllt |
| 14 | Tod terminal | ✅ | Probe vorhanden |
| 16 | Karawanen | 🟡 | Wrack/Gerücht/Wirtschaft ✅; „Karawane neu spawnen“ offen, Beiwagen springt (BUG-062) |
| 20/22 | Gebäude, Props | ✅ | Gebäude-Infos im Infofeld ✅ (S14); Props-Stichprobe (10 Stück) neu machen |
| 21 | Szenenübergänge | ✅ | Bandit folgt, Wolf lauert, Gorak hält Halle |
| 24/25 | Stil, Figuren | 🟡 | Stil R optional fertig; Nutzerurteil offen; Boden, Bäume, Aasschwinge, Omega, Effekte noch alt |
| 26/64 | Animationen | 🟡 | Tod, Taumeln, Block-Ruck neu; eigene Silhouetten je Klasse (Figuren Runde 2) offen |
| 28 | Gegner-Ausdauer | ✅ | Probe vorhanden |
| 29 | Waffen | ✅ | 11 neue in S13; Magitech-Feuerwaffen vorhanden (WELTREGELN Zeile 44 ist veraltet) |
| 30–32 | Rarität, Skill-Baum, Klassen | ✅ | Titel „Kopfgeldjäger“ nur Vorschlag |
| 33/34/72 | Gegner, KI, Skalierung | ✅ | — |
| 35/73 | Bosse | 🟡 | Boss-Beute mit eigener Identität teils; Schwarze Feste |
| 36 | VFX | 🟡 | Eis/Blitz nur, wenn es Nutzen gibt — offen |
| 37/38/71 | Welt, Regionen, Gefahr | ✅ | — |
| 40 | Dungeons | 🟡 | Rätsel und Fallen fehlen; sehr schwere Gewölbe in Aurelion/Totenland prüfen |
| 41/79 | Tagesrhythmus, Beziehungen | ✅ | Beziehungen ändern sich noch nicht durch Taten des Spielers |
| 42 | Wildtiere | 🟡 | Vögel, Jungtiere, Bestände außerhalb der aktiven Region fehlen |
| 43/44 | Fraktionen, Verbrechen | ✅ | Rang-Questlines für Händler, Bande, Aurelion, Goblins fehlen |
| 45 | Quests | ✅ | — |
| 46 | Audio | 🟡 | `sfx.js`: Klänge, Wind, Stimmung je Region, Stadtgeräusche (Hammer, Gemurmel) vorhanden; fehlt: Musik, Klang je Gebäude, gedämpft innen |
| 47 | UI | 🟡 | Touch auf echtem Gerät testen; Tastenbelegung ändern prüfen |
| 49 | Architektur | 🟡 | Spielstand 2 MB (P-02: Tagespläne mitgespeichert) |
| 50/52 | Leistung, Stresstest | 🟡 | BUG-108 (Städte über 3 ms), BUG-093 (Fest über 2 ms) |
| 51 | Tests | 🟡 | 216 Proben; Ladeprobe `RF.loadProbe` ✅ (fand BUG-141); Selbsttest 45 s (P-04) |
| 74 | Raids | ✅ | Schwierigkeitsgrade für Wiederaufbau offen (Block B) |
| 76 | Prozedurale Dungeons | 🟡 | Gewölbe mit Ebenen, Loot nach Schwere ✅; angekündigte Events (Einsturz, Gefangener, Elite) prüfen |
| 77 | Prozedurale Städte | ⬜ | bewusst später (nach §76) |
| 78 | Titel-Klassen | ✅ | Nekromant/Hexenmeister über Pakt |
| 82 | Balancing | ✅ | Messwerte vorhanden; nach Schwierigkeitsgraden erneut messen |

## Reihenfolge der Arbeit
1. Stabilität und Grundlagen aus dem Master-Prompt, klein und messbar: Probe fürs Laden eines Spielstands (§51), A-04 (§7),
   Gebäude-Infos im Infofeld (§20/§47), Props-Stichprobe (§22).
2. Dann die Nutzerliste (`PLAN_OFFEN.md`, S14 · Reihenfolge): Seevolk → Ereignisse mit neuem System → Kleinkram → Schwierigkeitsgrade.
3. Parallel die großen Lücken: Audio (§46), Leistung (BUG-108), Siedlungsdichte ≥ 5 Kacheln (§75, braucht Designentscheidung),
   zweiter Durchlauf (§53).
