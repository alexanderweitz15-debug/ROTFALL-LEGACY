# Game Design Document — Rotfall: Legacy (lebend)

Browser-RPG, Vanilla-ES-Module, Canvas 2D, keine Bild-Assets (alle Sprites prozedural in `src/sprites.js`).
Leitfragen jeder Änderung: 1) spielbar & stabil? 2) logisch (World Logic)? 3) fühlt es sich hochwertig an?

---

## Kern & Architektur (Kurz)
- Ein globaler Zustand `S` (state.js), deterministischer RNG (mulberry32, Seed je Spielstand).
- Nur die aktuelle Karte `S.map` wird simuliert (Leistungsgrenze). Zeitgebundene Zustände über Kartengrenzen laufen
  deshalb auf der **Spieluhr** `clock() = Tag·1440 + Minute` (1 s Echtzeit = 1 Spielminute), nicht auf `performance.now()`.
- Einziger Einstieg in die KI: `think(e, dt)`. Wer tot oder am Boden ist, entscheidet nichts.
- Entwicklerzugang: `?dev` → `window.RF`; Selbsttest: `?test` oder `RF.selftest()`.

## Tod & Boden (Death State)
- **Tod ist terminal**: `die()` nullt Schwung, Ansage, Sonderangriff, Sprung, Ziel, Zorn, Verfolgung; Gegner werden
  durch ein `corpse`-Objekt ersetzt (kein KI-Objekt mehr), Personen durch ein Grab.
- **Boden** (`downed`, Rumpf/Vitalwerte 0): keine KI, keine Bewegung, kein Resthieb. Nach 11 s (NPC) / 15 s (Spieler)
  verblutet die Figur, wenn niemand hilft.
- **Aufhelfen**: nur wer nicht verfeindet ist (`!isHostile`, nicht zornig) stabilisiert eine gestürzte Figur.
- **Gnadenstoß**: ein Nahkampftreffer auf einen gestürzten *Feind* tötet ihn. Stehende Ziele im Schlagbogen haben
  Vorrang. Pfeile fliegen über Liegende hinweg.

## Szenenübergänge (Exterior ↔ Interior)
Entscheidung (Master-Prompt §21, Optionen A/B, keine stille Variante D):

| Gegner | `interiors` | Verhalten beim Kartenwechsel des Spielers |
|---|---|---|
| Bandit, Banditenschütze | ja | **A — folgt** durch dieselbe Tür, nach Laufzeit zur Tür (Abstand / Tempo + 1,5 min) |
| Goblin, Goblin-Krieger | ja | **A — folgt** (Tunnelbewohner) |
| Untoter Krieger | ja | **A — folgt** |
| Soldat Valens | ja | A (derzeit nie feindlich zum Spieler) |
| Wolf, Wildschwein | nein | **B — lauert** 90 Spielminuten am Eingang; kommt der Spieler zurück, greift es sofort an. Danach misstrauisch zurück (Sichtweite ×1,5 für 5 h) |
| Gorak (Boss) | nein | **Hält seine Halle**: verlässt die Grube nie, bricht die Jagd ab (Arena-Bindung als bewusste Designentscheidung) |

- Verfolger: nur wer den Spieler ins Visier hatte (Aggro/Verfolgung) und < 560 px entfernt war.
- Enge Tür: höchstens 4 Folgende, weitere lauern draußen.
- Kommt der Spieler zurück, bevor ein Folgender die Tür erreicht, steht dieser draußen vor dem Eingang.
- Eine Folge-Absicht verfällt 60 Spielminuten nach der geplanten Ankunft (Spur kalt).
- Zornige NPCs: Die Außenwelt ruht, während der Spieler unten ist. Bei Rückkehr gilt: > 12 Spielminuten ohne
  Sichtkontakt = aufgegeben (siehe Verbrechen).
- Ankunftspunkte sind fest (vor der Tür), nicht zufällig.

## Zorn, Verbrechen & Konsequenz (Grundsystem, wird in Phase 17 ausgebaut)
- Strg+Angriff auf Neutrale = Provokation. Wachen/Kämpfer werden zornig, Zivilisten und Händler fliehen,
  Zeugen im Umkreis 240 px zählen für den Rufverlust der Fraktion.
- **Leine**: Zorn endet, wenn die Figur > 640 px von ihrem Posten weg ist oder 12 Spielminuten keinen Sichtkontakt
  (320 px) hatte. Sie kehrt zurück und bleibt 3 h misstrauisch.
- **Überwältigt**: Liegt der Spieler am Boden, beenden alle Zornigen im Umkreis den Kampf. Ist die Ordnungsmacht
  dabei (Wache, Valen, Orden), nimmt sie bis zu 30 Gold Buße und richtet den Spieler auf. Ohne Ordnungsmacht
  gehen sie; niemand hilft.

## NPC-Reaktionsmatrix
Legende: ✓ umgesetzt · ◐ teilweise · ○ geplant (Phase in Klammern). Jede Zelle ist eine bewusste Antwort.

| Ereignis | Wache | Verbündeter (Gruppe) | Händler | Zivilist | anderer Gegner | Tier |
|---|---|---|---|---|---|---|
| Spieler wird angegriffen | ✓ greift Angreifer an (Bedrohung < 300 px), ✓ ruft Wachen < 480 px (Alarm, zieht bis 700 px) | ✓ kämpft mit | ✓ flieht vor Bedrohung, ✓ Stand zu bis Ruhe | ✓ flieht | ✓ Gleiche derselben Fraktion < 240 px eilen herbei (Rudel/Bande) | ○ Wild flieht (P15) |
| Spieler greift Neutrale an | ✓ greift ein (Zeuge) | ✓ Moral −5, „Was tust du da?!“ (außer „grausam“) | ✓ flieht, Laden bis morgen zu | ✓ flieht | — keine Reaktion (kein Interesse) | — |
| Spieler greift Händler an | ✓ wie oben | ✓ wie oben | ✓ flieht, Laden bis morgen zu, danach kalter Ton | ✓ flieht | — | — |
| Spieler tötet jemanden | ✓ Zeugen-Wachen werden zornig (bei Unschuldigen) · ○ Kopfgeld (P17) | ✓ Moral −10, Erinnerung „hat einen der Meinen getötet“ | ○ Preise steigen (P17) | ✓ meidet/flieht den Spieler 1 Tag | — | — |
| Spieler wird bewusstlos | ✓ eilt herbei (< 520 px oder gerufen) und richtet auf; ✓ Buße statt Tod, wenn er selbst der Gegner war | ✓ stabilisiert | ✓ hält Abstand (flieht vor Feinden) | ✓ holt die nächste Wache (< 1400 px, einer genügt) | ✓ wechselt das Ziel (Liegende sind kein Ziel) | — |
| NPC wird bewusstlos | ✓ bekämpft den Angreifer | ✓ stabilisiert | ✓ flieht | ✓ flieht | ✓ nächstes Ziel | — |
| NPC stirbt | ✓ Grab, Chronik, Zeugen (s. o.) | ✓ Moral −14, Erinnerung | — | ✓ Angst (bei Tat des Spielers) | — | — |
| Gegner kommt in Stadt | ✓ greift an, ruft Wachen | ✓ kämpft | ✓ flieht, Stand zu | ✓ flieht | — | — |
| Kampf neben Händler | ✓ greift ein | ✓ | ✓ Stand geschlossen bis Ruhe („Nicht jetzt!“) | ✓ flieht | — | — |

Rollen: **Wache** (Posten, Alarm, hilft auf) · **Verteidiger** Borin/Kelan/Aldric/Tomas (wehren Feinde am Posten ab,
Leine 360 px, helfen auf) · **Heilerin** (kämpft nie, hilft Verwundeten auf) · **Zivilist** (flieht, holt Hilfe) ·
**Händler** (flieht, schließt den Stand). Gespräche mit Zornigen/Fliehenden/Kämpfenden sind gesperrt.
| Tier wird angegriffen | — | ✓ hilft | — | — | — | ○ flieht / Rudel wehrt sich (P15) |

## Kampf
- Waffengefühl-Tabelle `FEEL` (game.js): Gewicht, Hit-Stop, Kamerawackeln, Ausfallschritt je Waffentyp.
- Treffer: Körperteile (body.js), Krit (Wahrnehmung, Dolch von hinten), Block (Schild), Rüstung/Durchschlag.
- Messwerte Session 1 (Selbst-Simulation gegen Untoten, 1 Ziel): Langschwert ~0,5 s, Beil ~0,6 s, Streitkolben ~0,7 s,
  Speer ~1,0 s, Dolch ~0,9 s, Zweihänder ~1,5 s, Große Axt ~1,7 s, Kurzbogen ~2,7 s bis zum Tod — plausibel gestaffelt.

## Waffenklassen (Leitplanken)
| Klasse | Stärke | Schwäche | Spielstil |
|---|---|---|---|
| Dolch | sehr schnell, Krit ×2,6 von hinten | kurze Reichweite (26), kaum Wucht | umgehen, Rücken |
| Schwert | ausgewogen, weiter Bogen | nichts herausragend | Allrounder |
| Zweihänder / Große Axt | Wucht, breiter Bogen, langer Hit-Stop | langsam (≈1 s), teuer an Ausdauer | Timing, Positionierung |
| Beil / Streitkolben | Rüstungsdurchschlag, Wucht | kurze Reichweite | gegen Gerüstete |
| Speer | Reichweite 74, trifft mehrere in Linie | schmaler Bogen | Abstand halten |
| Bogen | Distanz | schwach im Nahkampf | Kiten |
| Stab | Magie-Skalierung (Mana) | geringer Waffenschaden | Kontrolle |

## Gegner (Kurzblätter)
| Gegner | Verhalten | Ansage | Region | interiors |
|---|---|---|---|---|
| Wolf | duckt sich, springt an | Ducken 280 ms | Wald, Schlucht, Frostkamm | nein |
| Wildschwein | stürmt | — | Wald | nein |
| Goblin | tänzelt seitlich, Hieb, springt zurück | — | Lager, Grube, Ruinen | ja |
| Goblin-Krieger | wie Goblin, schwerer, Schild | — | Grube, Wüste | ja |
| Bandit | Duellant: umkreist, weicht Ausholen aus | — | Straßen, Lager | ja |
| Banditenschütze | hält 190 px, spannt sichtbar, springt zurück | Bogen spannen 520 ms | Straßen, Wüste | ja |
| Untoter Krieger | langsam, kündigt Hiebe an | 380 ms | Friedhof, Totenreich | ja |
| Gorak (Boss) | Phase 1 Hieb; ab 50 %: Brüllen, Sturmangriff, Bodenbeben | 800 ms / Linie / Ring | Grube | nein (Arena) |

## Spawns
- Feste Spawn-Gebiete mit Deckel (`SPAWN_AREAS`), Nachschub nur außerhalb der Sicht (> 620 px).
- Reise-Begegnungen: nur fern der Siedlungen und des Startgebiets, beim Gehen, Abklingzeit 26 s.
- Ruhe-Regel (Richtwert, Phase 3 prüft): Greenmark ≥ 30 s ruhiges Gehen zwischen Begegnungen, Wildnis ≥ 20 s,
  Totenreich ≥ 10 s.

## Erbe
- Tod → Kandidaten: Gefährten + Verwandte (Glück nach Alter/Generation). Niemand → Haus erlischt, Stand wird gelöscht.
- Verwandte bringen eigene, bescheidene Habe mit (Klassenwaffe, Kittel, 2 Brot, 1 Verband). Die Ausrüstung des
  Toten liegt am Grab.
- Ankunft in Eren, 3 s Schonfrist, Gold 70 %, Ruf 50 %.

## Gebäude & Props
- **Entscheidung (Phase 4):** Innenräume sind keine eigenen Karten. Das Dach blendet beim Betreten aus, der Grundriss
  ist begehbar. Warum: Innen = Außen ist automatisch plausibel (§20), kein Ladewechsel, keine Übergangsprobleme
  (Verfolger laufen einfach mit hinein), Kampf im Haus funktioniert ohne Sonderfall.
- Bauweise je Stadt (Material zeigt Wohlstand/Herrschaft), Funktion je Gebäudetyp von außen lesbar (Schild, Esse,
  Banner …), Innenausstattung nach Funktion. Beim Betreten wird der Name kurz eingeblendet.
- Props folgen dem „Warum ist das hier?“-Test: Waren am Markt, Fässer vor der Taverne, Löschwasser an der Schmiede,
  Fracht an den Stegen; Wildnis-Truhen nur als Szene (toter Reisender, Wurzelversteck, kaltes Lager, Schmuggler).

## Offene Designfragen
- Rarität/Affixe, Skill Tree, Klassen: siehe PHASE_STATUS (Phasen 8–10).
