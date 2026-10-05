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
| Wächter der Nekropole | ja | **A — folgt** (Untoter; steigt nur aus der Gruft, wenn ein Fremder die Urne holen will) |
| Diener (Nekromant), Geisterwolf (Druide) | — | **gehen mit ihrem Herrn** durch jeden Eingang (Session 5); flüchtig, nie gespeichert |

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
| Spieler ist paktgebunden (Titelklasse der Untoten) | ✓ Ordenswache greift an (Ruf ≤ −25) · Valen: nur Ruf | ✓ Orden verweigert das Gespräch | — | ✓ grüßt anders (Angst, Misstrauen) | ✓ Untote der Schar: Verbündete, wenn beigetreten | — |

## Deckung & Parade (Session 7)
- Umschalt halten (Touch: „Deckung“): Tempo ×0,45, keine Ausdauer-Erholung, kein Hieb. Hiebe von vorn (±70°):
  erste 180 ms **Parade** (eine je Deckung; Angreifer taumelt 0,9 s, Bosse 0,45 s; kein Schaden), danach **Block**:
  Schild 15 %, Waffe 45 % des Schadens nach Rüstung, Ausdauerkosten = Schaden × 0,8 (Schild) / 1,2 (Waffe).
  Reicht die Ausdauer nicht: Deckung bricht, der Hieb trifft voll, 0,5 s Taumeln, 0,9 s keine neue Deckung.
- Geschosse und Flächenangriffe lassen sich blocken, nicht parieren. Die Rolle beendet die Deckung.
- Designabsicht: Schild und Timing belohnen, ohne die Rolle zu ersetzen — Rolle = Raum, Deckung = Stand.

## Kampf
- Waffengefühl-Tabelle `FEEL` (game.js): Gewicht, Hit-Stop, Kamerawackeln, Ausfallschritt je Waffentyp.
- Treffer: Körperteile (body.js), Krit (Wahrnehmung, Dolch von hinten), Block (Schild), Rüstung/Durchschlag.
- Messwerte Session 1 (Selbst-Simulation gegen Untoten, 1 Ziel): Langschwert ~0,5 s, Beil ~0,6 s, Streitkolben ~0,7 s,
  Speer ~1,0 s, Dolch ~0,9 s, Zweihänder ~1,5 s, Große Axt ~1,7 s, Kurzbogen ~2,7 s bis zum Tod — plausibel gestaffelt.
- **Anti-Kiting (Session 10, BUG-076, §34).** Warum: der Spieler (2,25–2,7) war fast doppelt so schnell wie Nahkämpfer
  (1,1–1,55) und konnte rückwärts gehend endlos zuschlagen. Bausteine:
  - Spieler: während des eigenen Hiebs 55 % Tempo („wer schlägt, steht“); Rückwärtsgehen (Bewegung gegen die
    Zielrichtung, Gegner < 280 px) 70 %.
  - Alle Nahkämpfer inkl. Gorak/Hrodvar, nur gegen Spieler und Gefährten: „Nicht-mehr-nachgeben“ — nach ~2 s vergeblicher Verfolgung ×1,45 Tempo,
    angesagt durch rotes „!“ und Staubwolke (fair telegraphiert, kein Sofort-Treffer), klingt ab, sobald sie in Reichweite sind.
  - Zusätzlich je Typ: Wolf Sprung mit Ducken, Wilder Hund Flanke, Goblin Hit & Run, Bandit eigene Taktik, Bär Revier-Ansturm.
  - Fernkämpfer ausgenommen (halten Abstand von selbst).
- **Gegner-Ausdauer (Session 11, §28):** Maximum = 1,2 × Spieler-Maximum (beim ersten Kontakt). Hieb −26, Sprung −30,
  Erholung +14/s, Elite (Gefahr ≥ 3) und Boss +20/s. Bei 0: „erschöpft“, 1,1 s wanken (Boss 0,7 s), danach 25 Punkte.
  Warum: Öffnungen im Dauerkampf belohnen aktives Kämpfen; da nur Angriffe kosten, gewinnt reines Abwarten nichts.

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
| Rapier (S7) | schnell (380 ms), Krit ×2,2, **Riposte** ×2,2 nach Parade | schmaler Bogen (0,45), kaum Wucht | Deckung + Konter |
| Kriegshammer (S7) | **Wucht**: ignoriert Schilde, Ziel taumelt immer, 60 % Durchschlag | sehr langsam (1,15 s), 20 Ausdauer | gegen Schildträger, Platte |
| Hellebarde (S7) | Reichweite 82, **fegt** den Bogen, Spitze ×1,15 | Schaft (nah) nur 60 %, zweihändig | Abstand halten, Gruppen |
| Armbrust (S7) | sofort, Bolzen 50 % Durchschlag, hoher Schaden | **1,9 s spannen** (60 % Tempo) | ein Schuss, dann Stellung |
| Zauberstab (S7) | Einhand-Fernzauber, Intelligenz, Schild frei | 4 Mana je Funke, nur Zauberkundige | Magier mit Schild |

Bezugsquellen (Session 7): Brann (Nordfurt) Schwerwaffen, Gerold (Nordfurt) Rapier/Armbrust/Langbogen/Zauberstab,
Oda (Grenzwacht) Armbrust/Hellebarde, Sael (Vharnholm) Zauberstab. Kombos: bewusst keine (ein Hieb = eine Entscheidung,
Tempo und Gefühl unterscheiden die Klassen); Runenwaffen kommen über Rarität (Phase 8).

## Rarität & Beute (Session 7, Phase 8)
Jedes Ausrüstungs-Exemplar hat seine Rarität (nie unter der Grundrarität des Typs). Gewürfelt wird beim **Fund**
(Gegnerbeute, Truhen); Läden verkaufen Grundware — Glück findet man draußen, nicht am Stand.

| Stufe | Chance (Gefahr 0) | Gefahr 1 | Gefahr 3 | Affixe | Wert |
|---|---|---|---|---|---|
| Gewöhnlich | 62 % | 59 % | 51 % | — | ×1 |
| Ungewöhnlich | 24 % | 22 % | 19 % | 1 klein | ×1,35 |
| Selten | 10 % | 13,5 % | 21 % | 2 klein | ×1,9 |
| Episch | 3,5 % | 5 % | 8 % | 3, davon 1 spielverändernd | ×3 |
| Legendär | 0,5 % | 0,7 % | 0,8 % | Sondereffekt + 2 klein | ×5 |
| Mythisch | nie zufällig | — | — | eigenes Unikat mit Mechanik | ×8 |

Gefahr = Gefahrenstufe des Gegners − 1 (+1 für Bosse); Truhen zählen als Gefahr 1 (gemessen: 10 000 Würfe).
Kleine Affixe: Schärfe, Leichtigkeit, Auge, Durchschlag, Atem (Waffe); Härte, Lebenskraft, Leichtfuß, Zähigkeit (Rüstung).
Spielverändernd: Blutzoll (Heilung aus Schaden), Zerfetzen (Blutung), Dornen (Rückschaden). Legendäre Effekte: Blutdurst,
Nachhall, Ahnenwall. Unikate: **Nachtfrost** (mythisch, Hrodvar, Durchfrieren), **Goraks Hackmesser** (legendär, Blutdurst).
Geschosse tragen weder Blutzoll noch Zerfetzen (sie laufen nicht über den Nahkampftreffer) — deshalb nie auf Fernwaffen.

## Gegner (Datenblätter, §33 — Stand Session 11)
Alle Gegner sind **statisch** (§72: feste Stärke der Region, `scaling` aus). Level-skalierende Sondergegner gibt es noch
nicht — Kandidaten: Kopfgeldjäger (Phase 17). Gegner-Ausdauer (§28) und „Nicht-mehr-nachgeben“ (§34) gelten für alle
Nahkämpfer; die Spalte Anti-Kiting nennt den zusätzlichen, arteigenen Baustein.

| Gegner | LP / Tempo | Verhalten | Ansage | Anti-Kiting (eigen) | Schwäche | Region | Ruf | Innen |
|---|---|---|---|---|---|---|---|---|
| Wolf | 30 / 1,55 | duckt sich, springt an; Rudel | Ducken 280 ms | Sprung (Lücke schließen) | wenig LP | Wald, Schlucht, Frostkamm | Knurren | nein |
| Wilder Hund | 24 / 1,65 | Rudel flankiert von der Seite | — | Flanke, hohes Tempo | sehr wenig LP | Ödland, Straßenränder | Knurren | nein |
| Wildschwein | 46 / 1,35 | stürmt | — | Sturm | dreht schwer | Wald | Knurren | nein |
| Bär | 150 / 1,15 | Revier: greift nur Eindringlinge an | 480 ms | Revier-Ansturm | langsam, Ansage lang | tiefer Wald, Berge | Knurren | nein |
| Goblin | 28 / 1,35 | tänzelt seitlich, Hieb, springt zurück | — | Hit & Run | wenig LP | Lager, Grube, Ruinen | Ruf | ja |
| Goblin-Krieger | 54 / 1,25 | wie Goblin, schwerer, Schild | — | Schildvorstoß | träge | Grube, Wüste | Ruf | ja |
| Bandit | 48 / 1,4 | Duellant: umkreist, weicht Ausholen aus | — | Umkreisen, Ausweichen | Ausdauer im Dauerkampf | Straßen, Lager | Ruf | ja |
| Speerträger (S11) | 50 / 1,3 | hält Speerlänge (66), sticht mit Ansage, stößt zu Nahe zurück | 320 ms | Reichweite, Stoß | seitlich/Schild/Rolle, dann nah dran | Straßen, Banditenlager, Wüste | Ruf | ja |
| Banditenschütze | 36 / 1,35 | hält 190 px, spannt sichtbar, springt zurück | Spannen 520 ms | Fernkampf | Nahkampf | Straßen, Wüste | Ruf | ja |
| Untoter Krieger | 44 / 1,15 | langsam, kündigt Hiebe an | 380 ms | Nachsetzen (§34) | Heiliges, Wucht | Friedhof, Totenreich | Klappern | ja |
| Wiedergänger | 70 / 0,85 | Griff bremst, steht einmal wieder auf | 420 ms | Griff (−50 % Tempo) | Feuer verhindert Aufstehen | Moor, Totenreich | Stöhnen | ja |
| Geist | 38 / 1,7 | schnell, nach Treffer kurz körperlos | — | Tempo | Heiliges trifft immer | Totenreich | Kreischen | ja |
| Kultist der Asche | 34 / 1,2 | hält Abstand, Schattenblitz, heilt Untote | 1700 ms Zauber | Fernkampf | Nahkampf, wenig LP | Totenreich, Ruinen | Stöhnen | ja |
| Wächter der Nekropole | 150 / 1,1 | Elite, Schild, schwere Hiebe | 520 ms | Nachsetzen | Ansage lang | Große Nekropole | Klappern | ja |
| Hauptmann der Toten | 170 / 1,1 | führt die letzte Befreiungswelle (§81) | 500 ms | Nachsetzen, Zweihänder | Ausdauer | besetzte Orte | Klappern | ja |
| Gorak (Boss) | — | Phase 1 Hieb; ab 50 %: Brüllen, Sturm, Beben | 800 ms / Linie / Ring | Sturmangriff | prallt an Wänden ab | Grube | Knurren | nein (Arena) |
| Hrodvar (Boss) | 280 / 1,0 | Eiskreis, ruft unter 50 % drei Tote | 650 ms | Eiskreis bremst | Feuer | Tiefhall | Klappern | nein (Thronsaal) |
| Hirsch | 30 / 1,9 | flieht, greift nie an (Jagdwild) | — | — | — | Wald, Wiesen | — | nein |

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

## Siedlungen (Session 2)
Jede Siedlung ist ein Plan (`TOWN_PLAN` in world.js), kein Zufall. Grund: Gebäude sind Landmarken; Zufallsstreuung
erzeugt Häuser ohne Straße und Straßen ins Nichts.

| Stadt | Rolle | Herrschaft | Gebäude-Set | Landmarke | Atmosphäre |
|---|---|---|---|---|---|
| Eren | Dorf, Ackerbau, Rast an der Alten Straße | Valen | Taverne, Schmiede, Heilerin, Vorsteher, Bäckerei, 2 Scheunen, Häuser, Katen | Felder mit Vogelscheuchen | ärmlich, geduckt, heimelig |
| Nordfurt | Grenzstadt, Handel am Fluss, Garnison | Valen | Kapelle, Bürgerhäuser, Lagerhaus, Taverne, Schmiede, Bäckerei, Heilerhaus, Kontor, Wache | Mauer mit 4 Toren, Markt | ordentlich, kalt, wachsam |
| Salzhafen | Hafen: Salz, Fisch, Umschlag | Valen | Kontor, Lagerhäuser, Fischerhütten, Bürgerhäuser, Kapelle, Taverne, Wache | Kai mit drei Stegen und Booten | geschäftig, feucht, salzig |
| Kreuzweg | Marktflecken an der Kreuzung | Händler/Söldner | Rasthaus, Söldnerhalle, Schmiede, Stall, Lagerhäuser, Bäckerei, Heilerhaus, Bürgerhaus | Marktplatz im Süden | laut, rau, käuflich |
| Aschfurt | Grenzposten vor der Asche, Karawanenhalt | Händler | Kernburg (Kontor, Wache), Vorstadt (Taverne, Schmiede, Lager), Karawanenhof mit Stall | Palisade, Nordtor | staubig, eng, misstrauisch |
| Sonnwacht | Ordensfeste, Pilgerort | Orden | Kapelle, Komturei, 2 Wachhäuser; Unterstadt: Hospiz, Herberge, Bäckerei, Schmiede, Scheune | Feste mit Schrein | streng, hell, fromm |

- **Bewohner (Session 4): die Zahl folgt der Fläche, nicht der Häuserzahl.** Ziel = Siedlungsfläche / `perHead`
  (Kacheln je Kopf) − Wachen − Figuren mit Namen; jedes bewohnbare Haus hat mindestens einen Bewohner, der Rest verteilt
  sich reihum auf die größeren Häuser bis zur Obergrenze je Typ (Bürgerhaus 4, Wohnhaus 3/2, Kate 2 …). Wo die Häuser
  nicht reichen (Salzhafen, Sonnwacht), bleibt die Stadt dünner — lieber leerer als gestapelt. Die Anzeige „Einwohner“
  zählt die Köpfe, die wirklich dort leben. Tagesablauf: 7–18 Arbeit, sonst verteilt (Platz, bei Nachbarn, vor dem Haus),
  18–22 vor dem Haus / in der Schenke, 22–7 im Haus. Zivilisten fliehen vor Feinden. Heilerinnen helfen Gestürzten.
- **Figuren mit Namen** (`NPC_DAY` in game.js): eigener Ablauf, an Häuser gebunden.

  | Figur | Tag (7 – Feierabend) | Abend | Nacht |
  |---|---|---|---|
  | Havel (Vorsteher) | vor der Halle | Schenke | Wohnhaus am Platz |
  | Elena (Heilerin) | vor dem Heilerhaus | im Heilerhaus | im Heilerhaus |
  | Tomas (Jäger) | Dorfrand zum Wald | Schenke | Kate im Westen |
  | Borin (Söldner) | vor der Schenke | Schenke | Zimmer in der Schenke |
  | Mara (Händlerin) | Marktstand bis 20 Uhr | daheim | daheim |
  | Aldric (Schmied) | vor der Schmiede | Schenke | über der Werkstatt |
  | Jorun (Bauer) | Feld | vor dem Haus | Haus am Feld |
  | Gerold (Nordfurt) | vor dem Kontor bis 20 Uhr | Bürgerhaus | Bürgerhaus |

  Läden haben Öffnungszeiten (7 bis Feierabend). Kelan hält Wache am Schrein, Rook/Lila im Lager, Morvath am
  Friedhof — sie haben keinen Ort in einer Stadt und bleiben bewusst dort.
- **Wachen:** an Toren/Einfallstraßen und am Platz (4–5 je Siedlung).
- **Spawns:** Gegner-Gebiete setzen nie Feinde in eine Siedlung (Rand 4 Kacheln); Banden lauern davor.
- **Verfall:** jedes Haus hat eine Verfallsstufe (gepflegt / heruntergekommen / verlassen). Verlassene Häuser sind
  unbewohnt, dunkel, innen Schutt — die Welt ist im Niedergang, Grenzorte stärker als die Ordensfeste.
- **Technik:** Ausbau am Ende der Generierung ohne `rnd()`, Migration `flags.gen3` für alte Spielstände.

## Siedlungsdichte (Session 4, §75 — vom Nutzer als wichtiger markiert)
**Entscheidung: Streckung statt Neuplanung.** Jeder Plan bleibt in seinen Entwurfskoordinaten (so wurde er gestaltet);
`spread = { s, a }` streckt alle Abstände um den Faktor s um den Anker a. Häuser behalten ihre Größe und bleiben an der
Türseite verankert — die Tür steht weiter an ihrer Straße, dazwischen entstehen Höfe, Gärten, Wege. Warum nicht neu
zeichnen: die Anordnung (Straße, Platz, Tore, Kai) ist gut und getestet; zu eng waren nur die Abstände. Anker liegen auf
der Durchgangsstraße bzw. an Fluss/Kai, damit Weltstraßen anschließen und keine Stadt über Wasser wächst.

| Stadt | s (Anker) | vorher Fläche · Häuser · Köpfe | nachher Fläche · Häuser · Köpfe | Kacheln/Kopf | bebaut |
|---|---|---|---|---|---|
| Eren | 1,2 × 1,35 (Alte Straße; Westen Feste, Norden Grubenpfad) | 54×34 = 1836 · 16 · 29 | 65×46 = 2990 · 16 · 31 | 96 | 12 % |
| Nordfurt | 1,5 (Westmauer am Fluss, Hauptstraße) | 37×30 = 1110 · 15 · 22 | 56×45 = 2520 · 22 · 46 | 55 | 18 % |
| Salzhafen | 1,3 (Kai) | 43×58 = 2494 · 26 · 29 | 56×75 = 4200 · 26 · 51 | 82 | 14 % |
| Kreuzweg | 1,35 (Kreuzung) | 53×42 = 2226 · 23 · 28 | 71×57 = 4047 · 23 · 45 | 90 | 13 % |
| Aschfurt | 1,5 (Nordtor) | 39×27 = 1053 · 9 · 10 | 58×40 = 2320 · 12 · 23 | 101 | 12 % |
| Sonnwacht | 1,3 (Westtor) | 42×46 = 1932 · 15 · 16 | 55×59 = 3245 · 15 · 28 | 116 | 11 % |

- Regeln (Selbsttest): Nachbarhäuser ≥ 2 Kacheln auseinander (vorher 0–1), bebaute Fläche < 35 %, Hauptstraßen ≥ 3
  Kacheln (Gassen 1–2), jede Tür vom Platz aus erreichbar, Einwohner ≤ Ziel × 1,1.
- `grow`: Häuser, Beete und Props, die erst die Streckung möglich macht, in **Weltkoordinaten** (Nordfurt +7 Häuser:
  Reihe zur Hauptstraße, Garnisonsstall, Hinterhäuser; Aschfurt +3). Bewusst getrennt vom Entwurf.
- Nordfurt ohne Flächenpflaster: Markt gepflastert, sonst Höfe, Gras, Gemüsebeete. Rasterordnung bleibt nur, wo sie
  stilistisch stimmt (Kernburgen Aschfurt/Sonnwacht).
- Der alte Kern (aus der ersten Generierung) zieht beim Ausbau mit um; Straßenstücke, die dadurch ins Leere liefen, werden
  per Breitensuche an das Stadtnetz angeschlossen; jede Tür bekommt einen Trampelpfad (verlassene Häuser nicht).
- Eine Siedlung hat eine Region (die ihres Ankers) — für Farbwelt und Klang.
- Session 5: die Karte selbst ist jetzt 1,5× größer (siehe „Weltmaßstab“), die Städte sind zusätzlich um ~15 % gestreckt
  (Eren 1,4×1,5, Nordfurt 1,7, Salzhafen 1,45, Kreuzweg 1,5, Aschfurt 1,7, Sonnwacht 1,45) und bekommen **Randhäuser**
  nach Regeln statt Koordinaten (`outskirts`: freier Grund, ≥ 3 Kacheln zu jedem Haus, ≥ 2 zum Rand, Tür zur nächsten
  Straße ≤ 8 Kacheln, Kandidaten in Hash-Reihenfolge — deterministisch, nicht im Raster). Eren–Nordfurt: ~37 Kacheln (vorher ~18).

## Weltmaßstab (Session 5 — Nutzerwunsch: „die Weltkarte soll größer werden, damit mehr Häuser und mehr Abstand möglich sind“)
**Entscheidung: hochrechnen statt neu zeichnen.** Die Welt wird wie bisher im Entwurfsmaßstab 512×512 erzeugt — alle
handgesetzten Orte, Straßen, Szenen und der Grubenpfad stehen so im Code und bleiben lesbar — und dann um `WS = 1,5`
auf 768×768 hochgerechnet (`resampleWorld`): Gelände per nächstem Nachbarn (Straßen/Flüsse/Mauern 1–2 Kacheln breit),
Props auf die Mitte ihrer Entwurfskachel, Zäune/Palisaden lückenlos nachgezogen, Wälder mit Hash nachverdichtet
(sonst ×2,25 dünner). Erst danach entstehen die Städte im Weltmaßstab — Häuser verzerren nie.
- `worldPt(x, y)`: Entwurfspunkt → Weltkachel (in Städten über deren Streckung). Alle festen Koordinaten in game.js/sim.js
  (Spawngebiete, Wachposten, Arbeitsplätze, Karawane, Start, Ankunft an der Grube) laufen darüber.
- Spawngebiete wachsen mit (Radius ×1,5, Deckel ×1,25) → Gegnerdichte je Fläche sinkt: mehr Ruhe zwischen Begegnungen.
- Warum 1,5 und nicht 2: Generierung, Spielstand (1,1 → 1,4 MB) und Wegfindung wachsen quadratisch; 1,5 verdoppelt die
  Fläche und hält Update ≤ 1,7 ms. Die Grube (Innenkarte) bleibt unverändert.
- Spielstand v3; v2 wird umgerechnet (siehe CHANGELOG), v1 bleibt inkompatibel.

## Klassen — Ergänzung Session 7 (Vorlage §32)
| Klasse | Kernfantasie | Ressource | Signatur | Stärke | Schwäche | Lehrer |
|---|---|---|---|---|---|---|
| Berserker (Krieger →) | Wut als Rüstung | Ausdauer | Wuchtschlag, Raserei (8 s: +35 % Schaden, +15 % Tempo) | Ausbrüche | +20 % eingesteckt in Raserei | Oda (Grenzwacht) |
| Assassine (Schurke →) | nicht da, dann dort | Ausdauer | Meuchelstich, Schattenschritt (hinter das Ziel, nächster Hieb ×2,5) | erster Schlag | nicht in Kette/Platte | Rook |
| Barde | ein Lied trägt weiter | Ausdauer | Kriegslied (Gruppe +15 % Schaden, Ausdauer), Missklang (Gegner taumeln, 50 % daneben) | Gruppe, Kontrolle | −15 % eigener Waffenschaden | Lioba (Kreuzweg) |
| Alchemist | Kraut, Feuer, Geduld | Heilkraut | Feuerflasche (Fläche am Wurfziel), Giftöl (Treffer vergiften), Trank brauen | Fläche, Nachschub | ohne Kraut keine Fähigkeit | Quirin (Salzhafen) |
Lehrer aller Klassen: Borin Krieger · Tomas Schütze→Waldläufer · Rook Schurke→Assassine · Elena Kleriker · Morvath Magier ·
Kelan Ritter→Paladin · Oda Berserker. Todesritter bleibt Rang der Untoten-Fraktion (kein Lehrer, bewusst).

## Skill-Baum (Session 5)
- 1 Talentpunkt zum Start und je Stufe (alte Stände: Stufe − 1 rückwirkend). Knoten brauchen **einen** gelernten Knoten
  darüber (Pfade statt Pflichtketten). Daten: `SKILL_TREE`/`SKILL_BRANCHES` (data.js), Fenster „Talente“ (T).
- **Allgemeine Zweige** Kampf / Magie / Überleben, je 7 Knoten (Leben, Schaden, Rüstung, Krit, Ausdauer, Mana, Abklingzeit,
  Zauberschaden, Heilung, Tempo, Ausweichen, Gepäck) und je 2 Schlüsselknoten, die einander nicht ausschließen, aber
  jeder hat einen Preis: Berserker (+25 % Schaden unter 30 % Leben / +15 % erlittener Schaden), Bollwerk (Rüstung +30 % /
  Tempo −10 %), Glaskanone (Zauber +30 % / Leben −15 %), Gelehrter Geist (Abklingzeit −15 % / Waffenschaden −15 %),
  Zweiter Atem (Rettung unter 25 % alle 3 min / Leben −5 %), Wildnisläufer (draußen schneller / in Siedlungen langsamer).
- **Titelzweige** (Nekromantie, Hexerei, Hainkunde) sind sichtbar, aber versiegelt, bis die Titelklasse erworben ist —
  man soll sehen, wofür sich der Weg lohnt. Schlüsselknoten: Legion (3 Diener / Waffenschaden −20 %), Blutpakt
  (Titelzauber +25 % / Verderbnis sinkt nie), Hüter des Hains (Wald +15 % Schaden, +3 Rüstung / Stein, Stadt −10 %).
- Kein Zurücksetzen der Punkte (noch). Offene Frage: Umlernen gegen Gold bei einem Lehrer?

## Titelklassen (Session 4 — Nutzerwunsch: „Klassen, die man später freischaltet, wie Titel mit besonderen Fähigkeiten“)
**Struktur.** Zwei Schichten statt einer:
1. **Grundklasse** (Klassenbaum Wanderer → Krieger/Schütze/Schurke/Kleriker/Magier → …): Kampfbasis, Mana/Ausdauer,
   gelernt bei Lehrern. Unverändert.
2. **Titelklasse**: kommt dazu, ersetzt nichts. Nie im Menü, nur durch eine Tat in der Welt. Höchstens eine wird
   getragen; ablegen/wieder tragen jederzeit (die Ressource bleibt erhalten), der Pakt selbst bleibt.

Jede Titelklasse hat, als Datensatz (`TITLE_CLASSES`, Selbsttest prüft die Vollständigkeit):
- eine **eigene Ressource mit eigener Regel** — kein Mana, keine Ruhe-Regeneration; sie entsteht aus dem Spielstil;
- **drei Sonderfähigkeiten**, die nur diese Ressource nutzen (Kosten `cost` oder Aufladen `gain`);
- ein **Passiv**, einen **ehrlichen Makel** (mechanisch, nicht nur Text), einen **Preis beim Pakt** (dauerhaft);
- **Fraktionsfolgen**, ein **sichtbares Merkmal** (glimmende Augen, bleibt auch mit abgelegtem Titel) und den Titel
  als Namenszusatz („Totenrufer“, „Schattengebundener“).

| | Nekromant | Hexenmeister |
|---|---|---|
| Fantasie | Kontrolle, Geduld, eine kleine Armee | Macht auf Pump, Risiko, Chaos |
| Ressource | **Seelenessenz** 0–6: +1 je Tod in der Nähe (auch durch Diener); verfliegt nicht | **Verderbnis** 0–100: jede Fähigkeit lädt auf; außer Kampf −4/s; stirbt ein Verfluchter −15 |
| Fähigkeiten | Totenruf (2: Leiche → Diener 60 s, max. 2) · Knochenschild (1: fängt 25 ab) · Seelenernte (alle: heilt dich + Diener, entzieht Feinden) | Fluch (+20: +25 % Schaden, −30 % Tempo, 12 s) · Chaosblitz (+15: Schaden × (1 + V/100)) · Entfesseln (ab 40, alle: Ring, V × 0,6) |
| Passiv | Totenwache: Diener kämpfen, ihre Tötungen nähren dich | Macht aus Fäulnis: kein Mana, Schaden wächst mit V |
| Makel | Waffenschaden −15 %, heiliges Heilen auf dich halb | über 70 V: −1,5 Leben/s; bei 100 Ausbruch (15 Schaden, → 60) |
| Preis | Leben −10 % für immer | Ausdauer −10 für immer |
| Ruf | Untote +20, Orden −30, Valen −10 | Untote +15, Orden −30, Valen −10 |

**Freischaltung: „Der Pakt der Stillen Schar“** (§78, fünf Stufen, füllt das Totenreich):
1. Kontakt — Morvath am Alten Friedhof: „Das Grabsiegel“ (bestehend), danach schickt er nach Alt-Vharn.
2. Prüfung — Ysra, Stimme der Gruft (Alt-Vharn, Ahnenaltar): die Ahnenurne aus der Großen Nekropole. **Kampf oder
   Überzeugung**: Wer der Stillen Schar beigetreten ist (Morvath, ab Ansehen 15), dem tritt der Wächter beiseite; alle
   anderen müssen den Wächter der Nekropole besiegen.
3. Entscheidung — die Urne zu **Ysra** (Ahnenpakt → Nekromant) oder zu **Vhal**, dem Flüsternden, am Nekromanten-Turm
   (Schattenpakt → Hexenmeister). Zwei Figuren, die um den Spieler werben, keine Menüwahl.
4. Initiation — Ritual (knien, Ringe aus Totenlicht), Preis wird sofort fällig.
5. Titelklasse — Ressource, Fähigkeiten, Merkmal, Folgen.

**Entscheidungen:** unumkehrbar (`reversible:false`) — der Pakt soll wiegen. Nekromant und Hexenmeister schließen einander
aus. Der Hexenmeister war vorher eine Lehrklasse unter dem Magier (Morvath); er wurde herausgelöst, weil er sonst beides
wäre. Alte Stände: Hexenmeister-Grundklasse → Magier + Titel Hexenmeister (ohne nachträglichen Preis).

**Folgen des Paktes:** Der Orden spricht nicht mehr mit dem Spieler (Kelan, Elena, Ordensleute); Ordenswachen greifen
ab Ruf −25 an, wenn sie ihn sehen (Leine und Buße wie sonst, danach 3 h misstrauisch statt sofort wieder zornig).
Bewohner der Städte grüßen anders (je Stadt eine Zeile, dazu drei allgemeine).

**Session 5 — Druide und Obergrenze.** Höchstens **2 Titelklassen** je Figur (`MAX_TITLES`, Nutzerwunsch), getragen wird
eine (Wechsel im Ausbildungsfenster, nicht mitten im Kampf); die Talentzweige beider gelten. Nekromant und Hexenmeister
schließen einander weiter aus — ein Totenpakt plus der Druide ist erlaubt (Mira: „Der Wald hat schon Schlimmeres
überwachsen.“). Der Totenpakt überdeckt das Grün des Hains in den Augen.

| | Druide |
|---|---|
| Ressource | **Wildkraft** 0–100: wächst von selbst (+5/s), aber nur draußen auf Gras, Erde, Sumpf; Stadt, Stein, Asche, Grube: Stillstand |
| Fähigkeiten | Rankenfessel (25: Ziel 3 s festgehalten) · Geisterwolf (40: Wolf kämpft 30 s mit) · Erdsegen (30: Gruppe heilt 8 s) |
| Passiv | Waldgänger: draußen in der Natur 0,5 Leben/s |
| Makel | Metall erstickt: in Ketten-/Plattenpanzer wächst Wildkraft halb so schnell |
| Preis | Stärke −1 für immer |
| Freischaltung | „Der Ruf des Hains“: Mira im Alten Hain (Westwald) — 4 Wölfe vertreiben, 3 Heilkraut für die Quelle, Ritual |

**Session 6 — Mönch.** Vierte Titelklasse, die erste des Ordens. Gegenstück zum Nekromanten: nicht Masse, sondern
Aufmerksamkeit. Schließt Nekromant und Hexenmeister aus (beidseitig); mit dem Druiden kombinierbar.

| | Mönch |
|---|---|
| Ressource | **Fokus** 0–5: +1 je Ausweichrolle, die einen Hieb, ein Geschoss oder einen Flächenangriff ins Leere laufen lässt (einmal je Rolle); jeder Treffer kostet 1 |
| Fähigkeiten | Handkante (1: 1,4-fach, Ziel taumelt 0,7 s) · Stilles Wasser (2: heilt 6 s, stillt Blutung) · Hundert Schritte (alles, ab 3: unverwundbarer Sprint 180 px, trifft jeden im Weg einmal, Schaden 0,5 + 0,25 je Fokus) |
| Passiv | Leerer Geist: Ausweichen kostet 25 % weniger Ausdauer |
| Makel | Gelübde der Leichtigkeit: in Ketten-/Plattenpanzer kein Fokus |
| Preis | Gelübde der Armut: halbes Gold ans Kloster (einmalig), Rooks Bande −30 (bleibt) |
| Freischaltung | „Die Probe der Stillen Hand“: Meisterin Ilva vor der Ordenskapelle in Sonnwacht — 10× im letzten Moment ausweichen, 4 Tote, dann das Gelübde |
| Zweig | Stille Hand: Zweiter Atem des Klosters, Harte Hand, Tiefer Brunnen (+2 Fokus), Wind im Rücken; Schlüssel **Vollkommene Stille** (Treffer kosten keinen Fokus; mit Schild oder Zweihänder gar kein Fokus) |

**Geplante weitere Titelklassen (nicht umgesetzt, Vorschlag):** Kopfgeldjäger („Fährte“ je markiertem Ziel; braucht das Kopfgeldsystem aus
Phase 17), Barde („Inspiration“ aus Treffern der Gruppe; Tat in einer Schenke), Mönch („Fokus“ aus Ausweichen im
letzten Moment), Alchemist („Tinkturen“, an Feuerstellen gebraut), Todesritter (liegt als Grundklasse ohne Lehrer im
Klassenbaum — Kandidat, als Titel der Stillen Schar neu gedacht zu werden). Jede braucht zuerst eine Tat in der Welt.

## Totenreich (Session 5 — „erweitere das Totenreich“)
- Größer: zwei neue Aschland-Zentren (Ostküste, Aschensee). Neue Orte: **Knochenwald** (Stufe 3, dichter toter Wald,
  Skelette und Wölfe, Lager der Grabräuber), **Aschensee** (Stufe 3, schwarzes Wasser, **Seelenbrunnen**: einmal am Tag
  Essenz voll bzw. Verderbnis weg), **Vharnholm, Stadt der Stillen** (Stufe 1 — der einzige ruhige Ort im Reich).
- Vharnholm macht das Fraktionsbild wahr („eine Zivilisation, keine Monsterschar“): untote Bewohner mit eigenen Berufen,
  Stille Wächter, Markt, Seelenobelisk. Sael (Totenschreiber) handelt nur mit Mitgliedern der Schar oder Paktgebundenen
  und vergibt „Grabräuber in der Asche“ (5 Grabräuber, Untote +15) — ein zweiter Weg zum Ansehen neben Morvath.
- **Regel: gleiche Fraktion bekämpft sich nicht** (außer zornig oder Diener). Vorher flohen untote Figuren (Morvath) vor
  den Skeletten ihrer eigenen Fraktion und verweigerten deshalb das Gespräch.

## Grenzöde (Session 6 — Rest von „erweitere das Totenreich“)
- Die Öde zwischen Mittelland und Totenreich war leer. Jetzt: **Grenzwacht**, Valens letzter Posten (Palisade, zwei Tore,
  Turm, Zelte, Wachfeuer; drei Wachen, Hauptfrau Oda mit kleinem Laden) an einer neuen Straße, die von der
  Mittellandstraße nach Süden führt und in den Aschenpfad übergeht — der erste Weg ins Totenreich, der bewacht ist.
- **Hundertfeld** südlich davon: Gräberreihen einer verlorenen Schlacht, Wracks, Valens Banner; Skelette und Wölfe.
- Quest „Die Zahl der Toten“ (Oda): Tasche des vermissten Spähers holen, fünf Tote — Späherbericht: „Sie warten auf eine Zahl.“
  (Aufhänger für den Krieg: das Heer der Toten sammelt sich — Phase 16/17.)

## Karawanen (Session 6)
- Ein Zug, nicht ein Objekt: Leitwagen (Lebenspunkte, Ladung, Ziel der Räuber) mit Kutscher und zwei Ochsen, Beiwagen mit
  Maultier auf der Spur des Leitwagens, zwei angeheuerte Wachen (Söldner Stufe 2–4, keine Stadtwache).
- Wachen: seitlich am Leitwagen und hinter dem Beiwagen, stellen Räuber, entfernen sich nie weiter als 420 px vom Zug.
  Außer Sicht gehen sie auf ihrem Platz mit. Gefallene ersetzt die nächste Stadt; nach Verlust der Karawane gehen sie.
- Fahrt: Route über die Straße (aus der Karte berechnet), 40 Spielminuten Rast am Tor, dann zurück.
- Hinterhalt (35 %, halbe Strecke): in Sicht 3 Räuber + 1 je Wache; außer Sicht wehren Wachen mit 30 % + 15 % je Wache
  ab (eine kann fallen), sonst verliert der Zug die halbe Ladung. Geleitschutz des Spielers: 30 Gold, Händlerruf +4.

## Tiefhall (Session 6, Phase 14)
- Königshalle der alten Bergleute unter dem Frostkamm — gebaut, nicht gegraben: das Gegenstück zur Grube.
- Räume: Vorhalle (Frosttreppe) → Säulenhalle (Banner, Inschrift) → Eiskammern (Eiszapfen, Erfrorener, Versteck) /
  Ahnengruft (Grabsteinreihen, Ahnenstein) / Schmiede der Tiefe (Esse, Königsamboss, Erz, Goblins graben) →
  Thronsaal (Thron unter dem Eis, Kohlebecken, Hrodvar mit zwei Leibwächtern) → Hort.
- Hrodvar, König unter dem Eis: untoter Zweihänder, Stufe 11 — Endgegner für Stufe ~8–10. **Eiskreis**: Ring als Ansage
  (900 ms), dann Schaden im Umkreis und „Durchfroren“ (4 s, −40 % Tempo) — heraustreten oder durchrollen (zählt für den
  Mönch). Unter 50 %: ruft einmal drei Tote der Leibwache, danach schneller. Gegenstück zu Gorak: Raum verweigern statt rennen.
- Questanbindung: Brann, Meisterschmiedin in Nordfurt — „Königseisen“ (Hrodvar legen, Barren aus dem Hort) → Frostklinge.
  Gerüchte über die Treppe ins Eis überall, in Nordfurt über Brann. Ein vorher erschlagener Hrodvar zählt.

## Lebendige Städte — Entwurf Session 9 (Master-Prompt „World Alive“, Priorität 2–3)
**Ist-Stand (Code):** Bewohner haben drei Fixpunkte (Arbeit/Abend/Nacht) und schlendern zufällig ±46 px darum; Wachen
stehen fest am Posten; Figuren mit Namen haben dieselben drei Punkte (`NPC_DAY`). Kein Mittag, keine Wege, keine
Begegnungen, keine Beziehungen unter NPCs. Wirkung: „Figuren stehen herum“, Klumpen auf Plätzen.

**Entwurf (baut auf `schedulePos`/`eve`/`anchor`, `act()`-Posen und `seek()` auf — kein Ersatzsystem):**
1. **Tagesplan je Rolle als Daten** (`ROUTINES[rolle]` = Liste `[ab Stunde, Ort-Art, Tätigkeit]`), aus dem je Figur
   beim Erzeugen feste Orte werden (`e.day`). Ort-Arten: `home` (innen), `front`, `work` (Arbeitsort des Hauses: Feld,
   Steg, Amboss, Stand), `store` (Lagerhaus der Stadt), `market` (freier Platz auf dem Markt, reserviert), `tavern`
   (Sitzplatz), `friend` (Tür eines Bekannten), `well`. Beispiel Bauer: 6 front → 6:30 Feld (knien/hacken) → 9 Stall →
   12 essen (sitzen vor dem Haus) → 13 Feld → 17 Markt → 19 Schenke/zu Hause → 22 schlafen.
   Schmied: 7 Amboss (Arbeitshiebe, Funken) · Material aus dem Lager holen · 12 Pause · 13 Amboss · 18 Schenke.
   Händler: Stand · Lager · Nachbarhändler · 12 essen · Stand · 20 Unterkunft.
2. **Wachen im Schichtdienst:** zwei Schichten (6–14, 14–22, Nacht halbe Besetzung); aktive Wachen wechseln zwischen
   Posten, Mauer, Platz, Kontrollgang (Rundweg zwischen den Posten); freie Schicht schläft/isst in der Kaserne/Schenke.
   Nie alle am selben Ort.
3. **Kein Gedränge:** jeder Aufenthaltsort ist ein reservierter Platz (Kachel), Markt/Platz haben begrenzte Plätze;
   leichte Abstoßung (≥ 1 Kachel) zwischen stehenden Figuren; Ziel-Streuung klein, dafür echte Ortswechsel.
4. **Sichtbare Tätigkeit** über vorhandene Posen: arbeiten (Hiebe), knien (Feld, Wasser holen), sitzen, handeln;
   neu nur „reden“ (zwei Figuren drehen sich zueinander, selten eine Textblase).
5. **Beziehungen unter NPCs** (Priorität 3): `S.bonds` = Liste `{a, b, type, value, cause}` mit Ursache als Text
   (z. B. `{a:'aldric', b:'borin', type:'respect', value:40, cause:'Borin zog Aldric beim Überfall aus dem Feuer.'}`);
   Typen like/dislike/respect/fear/envy/love/hate/avoid/miss/blame. Beziehungen steuern: wer wen besucht (`friend`),
   wem man ausweicht, worüber man redet (Textblase/Gerücht), Trauer bei Tod (`NPC_DEATH`).
6. **Textblasen & Gerüchte** (Priorität 3): selten (höchstens 1–2 sichtbar), aus Weltereignissen (`S.news` —
   Karawane, Überfall, Boss, Tod, Befreiung) und Beziehungen; Gerüchte je NPC mit Wahrheitsgrad (korrekt / verzerrt /
   unbekannt).

Tests (geplant): NPC_SCHEDULE_TEST, NPC_CROWD_TEST (max. Figuren je 3×3 Kacheln), NPC_RELATIONSHIP_TEST, NPC_DIALOG_TEST.
Wartet auf das Durchlauf-Audit (Session 9), um Prioritäten zu bestätigen.

### Umgesetzt Session 10 (BUG-082/083) — Tagesplan der Bewohner, Stufe 1
`planDays()` / `dayTarget()` / `villagerDay()` in game.js. Orte je Bewohner aus Haus + Index (`spotsOf`), bei jedem
Laden neu berechnet (kein Spielstandfeld, keine Migration). Jede Person hat einen eigenen Zeitversatz (0–45 min).
| Zeit | Block | Tätigkeit |
|---|---|---|
| 22:00–06:30 | Nacht | drinnen (Schlafplatz) |
| 06:30–07:30 | Morgen | vor dem eigenen Haus |
| 07:30–11:30 | Arbeit | Arbeitsort; draußen Arbeitsanimation (`act 'work'`) alle 3–8 s |
| 11:30–13:00 | Mittag | Platz oder (jeder 2. mit Schenkenplatz) Schenke drinnen; Gespräche |
| 13:00–16:30 | Nachmittag | mit festem Beruf: Arbeit; sonst je Tag wechselnd Arbeit / Nachbarhaus / Platz |
| 16:30–18:00 | Markt | Platz (Beruf: weiter am Arbeitsort) |
| 18:00–20:30 | Abend | Schenke **drinnen** (nur so viele wie freie Innenkacheln) oder vor dem eigenen Haus |
| ab 20:30 | Heimweg | drinnen (wer in Schenke/Heilerhaus/Kapelle wohnt, bleibt drinnen) |
**Gespräche (Talk-Pairs, Stufe 1):** an sozialen Orten sucht ein ankommender Bewohner einen stehenden Nachbarn (≤ 64 px),
beide drehen sich zueinander, zwei Sprechblasen im Wechsel (je 2,5 s). Unter einem Dach nur sichtbar, wenn der Spieler
im selben Haus ist. Textpool `TALK` (12 Wechsel) — Gerüchte aus Weltereignissen (BUG-078, §79) folgen als Stufe 2.
**Außer Sicht (> 900 px):** keine Wegsuche; je Blockwechsel einmal an den Zielort gesetzt, im Kreis um das Ziel (eigene
Richtung je Person, belegte Stellen ausgelassen) — Update in Eren 3,03 → 1,2 ms.
**Unterbrechung:** Kampf/Flucht/Hilfe laufen vor dem Tagesplan; danach gilt wieder der Block der aktuellen Uhrzeit
(kein Reset auf den Tagesbeginn).
**Offen (DoD §41):** Jäger ziehen noch nicht in die Wildnis; Läden öffnen/schließen nicht sichtbar (Schild/Laden);
Wachen ohne Schichtdienst; Beziehungen (mag/meidet) und Gerüchte aus Weltereignissen fehlen; Schenke abends voll.

### Tagesrhythmus Stufe 2 (Session 11, §41)
| Rolle | Plan |
|---|---|
| Jäger (1 je Stadt) | 7–13:30 Jagdgrund (baumreichste Richtung, 40 Kacheln vor dem Ort, erreichbar), 13:30–15 Markt: Felle +2 in den Stadtvorrat, danach normaler Plan |
| Marktstände | 7–18 Uhr offen (Markise, Ware), sonst Plane — sichtbar, nicht nur Zahl; Festbude folgt dem Fest |
| Wache | tags alle am Posten; 22–6 Uhr schläft jede zweite im Wachhaus (Kaserne, sonst Halle, sonst Schenke) — halbe Nachtbesatzung |
Warum so: je Rolle ein sichtbarer Unterschied mit wenig Code. Wirtschaftliche Wirkung klein (Felle), damit nichts kippt.

### Raids (Session 11, §74)
Phasen: Vorwarnung (Späher-Meldung, Heer wartet 6 Std.) → Anmarsch (in Spielernähe sichtbar, s. u.) → Kampf → Ergebnis →
Nachwirkung (3 Wohnhäuser eine Verfallstufe schlechter, Flüchtlinge, Einwohner −40 %) → Befreiung (§81 Wellen) → Wiederaufbau
(ein Haus je Tag). Spieler: verteidigen (Schlacht vor Ort), ignorieren (abstrakte Schlacht), befreien. Offen: sich dem Raid
anschließen (Fraktionslogik), Raids durch Banditen auf Außenposten.

### Krieg: Anmarsch (Session 11, §74)
Schlacht in Spielernähe: Angreifer erscheinen ~20 Kacheln vor dem Ort auf der Seite ihres letzten Knotens und marschieren
(80 % Tempo) ein; Verteidiger stehen im Ort. Vorher erschienen beide Seiten mitten zwischen den Häusern.

### Befreiungskampf (Session 11, §81)
Besetzter Ort in Spielernähe → Kampf in Wellen statt Textwechsel. Wellen: 2–3 (nach Besatzungsstärke), Schwarze Feste 4.
Jede Welle marschiert von einem zu Fuß erreichbaren Sammelpunkt 13–15 Kacheln vor dem Ort ein (je Welle andere Seite).
Aufbau: 3 Skelette, ab Welle 2 dazu Wiedergänger/Geist abwechselnd, letzte Welle + „Hauptmann der Toten“ (170 LP,
Ansage 500 ms, Stufe 6 / Feste 9). Pause 8 Spielminuten mit Ansage. Fortschritt bleibt am Ort (Flucht kostet höchstens die
laufende Welle). Befreiung nur nach der letzten Welle. Folgen: Chronik, Titel, 4 Heimkehrer laufen sichtbar in den Ort,
Einwohner +6. Offen: Arena der Schwarzen Feste (BUG-100), Verhalten der Bewohner unter Besatzung (BUG-099).

### NPC-Beziehungen (Session 11, §79)
Fest aus der id-Reihenfolge je Stadt: Freund (jeder), Rivale (jeder Vierte, Abneigung gegenseitig, nie Hausgenosse).
Rivalen: kein Gespräch miteinander, ausweichen unter 70 px (außer drinnen), Lästern in Hörweite (160 px) mit Namen.
Freunde: jedes zweite Gespräch aus eigenen, wärmeren Zeilen. Gerüchte (Chronik) wie bisher. Spätere Stufe: Beziehung
ändert sich durch Spielerhandlungen.

### Regionaler Boss: Graumähne (Session 11, §73)
| Feld | Inhalt |
|---|---|
| Region / Gefahr | Wolfsschlucht, Stufe 1–2 (lokaler Boss) |
| Kampf | Wolf-Sprung mit Ansage, 170 LP; Phase 2 (< 50 %): Heulen, zwei Wölfe greifen ein |
| Machtverschiebung | Rudel zerfällt: Westwald/Schlucht −30 % Gegnerdeckel |
| Machtvakuum | 60 % der Wolf-Spawns im Westen werden verwilderte Hunde — nicht automatisch Frieden |
| Wirtschaft | Eren +8 Felle |
| Ruf / NPC | Valen +3; Gerücht „Graumähne wurde erschlagen“ (Chronik) |
Offen: Beute mit eigener Identität (Fell-Umhang), Jäger-Kommentar.

### Regionaler Boss: Karrak, der Sandfürst (Session 11, §73)
| Feld | Inhalt |
|---|---|
| Region / Gefahr | Rote Wüste, Stufe 3 (mittlerer Anführer) |
| Kampf | Bandit-Duellant (umkreist, weicht Ausholen aus), Stufe 12, größer; Phase 2: pfeift zwei Schützen herbei |
| Machtverschiebung | Wüstenbanden zerfallen: Gegnerdeckel −30 % |
| Machtvakuum | 60 % der Banditen-Spawns werden Goblin-Krieger |
| Ruf | Händler +8, Banditen −25 |
Weitere Kandidaten (Stufe 4): Kultführer in Alt-Vharn, Schwarze Feste (BUG-100).

### Balancing-Update §82 — Teil 1 (Session 11)
Methode: `RF.duel(gegner, {level, weapon, chest, mode:'stand'|'kite', seed})` (nur `?dev`) — Standard-Held gegen einen
Gegner auf leerer Karte, Mittel über mehrere Seeds. Der Bot weicht nie aus: für Bosse nur obere Schranke.

| Messung (Mittel) | vorher | nachher |
|---|---|---|
| Stufe 3, Langschwert, Leder — Bandit stehend | 3,1 s / 10 % | 4,0 s / 19 % |
| … Wolf stehend | 2,5 s / 8 % | 3,2 s / 19 % |
| … Skelett stehend | 4,4 s / 10 % | 4,7 s / 19 % |
| … Bandit rückwärts | (0 % ab Stufe 8) | 16 s / 25 % — nicht mehr billiger als Stehen |
| Stufe 8, Zweihänder, Kette — Bandit/Skelett rückwärts | 0 % | 2–4 % (Stufe 8 in Gefahr-1-Gebiet: gewollt leicht, §71) |

Hebel in dieser Reihenfolge (Verhalten vor Zahlen):
1. Standfestigkeit: nach einem Taumeln 1,2 s kein neues, Rückstoß 30 % — Zweihänder-Dauerlähmen war die Lücke hinter dem Cheese.
2. Ausfallschritt: knapp (≤ 30 px) zurückgewichen wird trotzdem getroffen; Ausholen bleibt sichtbar.
3. Nachsetzen mit Mindesttempo 2,0 (rückwärts gehender Spieler 1,9) — außer Wiedergänger.
4. Zahlen: `BAL = { hp: 1.7, dmg: 1.4 }` für alle Gegner — das ist „Schwer (Standard)“.
Teil 2 (S11): Bosse mit Antwort auf Abstand (Gorak-Sturm ab Phase 1, Hrodvars Eislanze) und dritter Phase (< 25 %);
neuer Gegnertyp Speerträger; neue Waffe Streitflegel (Schwung: +15 %/Stufe, ab Stufe 2 rundum — Druck statt Abwarten).
Offen: Gefahrenstufen 3/4 gegen „spürbar gefährlicher“ prüfen (§71); Schwierigkeitsstufen Sehr schwer / Schwer / Angsthase
(Nutzerwunsch, nach den übrigen Phasen).

### Gefahrenregionen (Session 11, §71)
| Stufe | Wirkung auf Gegner, die dort entstehen |
|---|---|
| 0–2 | unverändert |
| 3 Tödlich | +2 Stufen, 25 % Veteranen |
| 4 Verboten | +4 Stufen, 50 % Veteranen |
Veteran: +30 % Leben, größere Silhouette (Vorwarnung), Beute-Bonus +1. Dungeons zählen als Stufe 3. Vorwarnungen: Warnung beim
ersten Betreten (BUG-081), düstere Region-Tönung, Veteranen sichtbar größer. Offen: Flucht-Test je Stufe-4-Region.

### Verbrechen & Kopfgeld (Session 11, §44/§72)
Tat → Zeugen (< 240 px) → Kopfgeld bei der Fraktion des Opfers (Angriff 25, Mord 75) → Wache stellt bei Sichtkontakt
(zahlen / ein Tag Kerker + 10 % Gold / Widerstand +25) → ohne Klärung: Kopfgeldjäger ab 150 Gold (draußen, alle 2 Tage).
Kopfgeld verfällt 5 Gold je Tag. Kopfgeldjäger sind die bislang einzigen skalierenden Gegner (§72): Stufe folgt der
Spielerstufe in 3er-Schritten, Deckel 6 (Stufe 14), sichtbare Aufrüstung. Ohne Zeugen kein Kopfgeld.

### Ruf-Stufen (Session 11, §43)
| Stufe | ab Ansehen | Preis beim Fraktionshändler | Folge |
|---|---|---|---|
| Vertraut | 70 | −15 % | herzliche Begrüßung |
| Verbündet | 40 | −10 % | herzliche Begrüßung |
| Freundlich | 15 | −5 % | — |
| Neutral | −5 | normal | — |
| Misstrauisch | −30 | +12 % | kühle Begrüßung |
| Feindlich | −60 | +30 % | kalte Begrüßung |
| Verhasst | darunter | kein Handel | Wachen der Fraktion greifen an |

## Endgame: Die Eisenmark (Session 11)
**Pitch:** Im Osten, hinter dem Kettenpass, hält die Eiserne Kette ein ganzes Volk in Ketten. Wer ihren Kettenmeister
stürzt, verwandelt die Goblins von der häufigsten Bedrohung der Welt in Nachbarn, Händler und Verbündete.

| Element | Umsetzung |
|---|---|
| Region | Osten, 256 Kacheln breit (Welt 1024×768), Hash-Gelände (Asche, Erde, Stein, Felsnasen), Felskamm mit einem Pass |
| Kettenfeste | Gefahr 4; Mauer 64×44, Hof (Lager, Wagen, Schmiede, Wachfeuer, Käfige, Kettenpfähle), Kernburg mit Varg |
| Steinbruch | Gefahr 3; Goblins und Gefangene arbeiten, zwei Aufseher |
| Kettenzug | Treiber pendelt Steinbruch ↔ Feste, drei Goblins an der Kette (versetzt, Kette Glied an Glied) |
| Grubenhort | vor der Befreiung: Versteck feindseliger freier Goblins; danach: Goblin-Dorf (Grisk, Nibbel) |
| Endkampf | Varg (Kettenpeitsche: Reichweite 70, fesselt), 2 Kettenknechte; unter 50 % Verstärkung |
| Folgen | Befreiung, Goblins friedlich (sprechen, handeln), keine Goblin-Spawns auf der Oberwelt, Ruf Goblins +40, Kette −100 |

**Fraktionen (7):** Valen, Orden, Untote, Freie Händler, Rooks Bande, Eiserne Kette, Grubenstämme.

**Darstellung der Gefangenen:** Goblins und Menschen jeder Herkunft, erkennbar an Lumpen, Eisenkragen und Kette —
die Unterdrückung wird über Kleidung und Ketten erzählt, nicht über Hautfarbe.

**Offen:** Aufträge im Grubenhort (Grisk), Gespräch mit Gefangenen vor der Befreiung (Hinweise auf Varg), Händler der
Kette, Musik/Klang der Eisenmark, Veteranen-Dichte in der Mark prüfen, Kettenknechte in der Kernburg nach Befreiung.

## Arsenal und Eisenfeste-Ausbau (Session 12)
Leitlinie: Waffen sehen gebaut und benutzt aus (Nieten, Flickwerk, Kerben, asymmetrisch). Rot erscheint nur als Akzent der Kette (Schärpe, Schulter, Kamm, Klingenkerbe).

- **Eigenschaften, die vom Ziel abhängen** (`weaponMult`): `execute: [Schwelle, Faktor]` und `raw` (gegen Rüstung unter 4).
- **Weitere Waffenfelder:** `chill` (verlangsamt mit eigenem Namen), `toll` (schüchtert im Umkreis ein), `ally` bei Rüstung (Bonus neben Verbündeten).
- **Rüstungsbild aus Komponenten** (`ARMOR_LOOK`). Leute der Kette variieren nach Seed.
- **Bewusst nicht übernommen:**
  - Sklaven „arbeiten schneller“ beim Aufseher (würde Sklaverei positiv belohnen).
  - Skorpionschwanz und Käferpanzer (passen nicht zum Stil).
  - Repetierarmbrust und Harpune (brauchen Magazin- und Zugmechanik; später möglich).

**Geplant (aus der Vorlage, passt):**
- Die Kettenfeste wird zur lebenden Militärstadt:
  - Tagesablauf: morgens Arbeitszug, abends Rückkehr, nachts geschlossene Tore.
  - Mehr Bewohner im Budget.
  - Kriegsraum mit Offizieren.
- Tribut: Dörfer beklagen sich über Abgaben, eine Tributkarawane zieht zur Feste (überfallen, schützen oder plündern).
- Feldzüge der Kette gegen die Untoten über die Kriegssimulation: Musterung, Marsch, Rückkehr mit Verwundeten. Der Spieler kann mitziehen oder sabotieren.

## Dörfer und Einfluss (Session 12)
- Die Welt ist 1280×768 groß. Im Osten liegt das **Grauland**: offenes Land, dessen Dörfer der Eisernen Kette Tribut zahlen.
- Acht Dörfer mit je sechs Häusern:

| Herrschaft | Dörfer |
|---|---|
| Valen | Haselbrück, Mühlbach, Weidenau |
| Orden | Lichtenrain |
| Freie Händler | Rastfurt |
| Tribut an die Kette | Grauwasser, Hohlstein, Eisenried |

- Dörfer sind volle Siedlungen (`TOWN_PLAN`, `village: true`). Sie haben aber keine Wachen, keine Läden und keinen Kriegsknoten.
- **Anknüpfung für den Eisenfeste-Block:** Tributkarawanen aus Grauwasser, Hohlstein und Eisenried. Die Klagen der Dorfbewohner sind der Einstieg ins Tributsystem.

## Weltordnung (Session 12)
Die Welt ist 1536×768 groß. Es gibt keine geraden Grenzen: Die Länder gehen ineinander über.

| Richtung | Land |
|---|---|
| Westen | Land der Eisernen Kette: Westgebirge; Eisenfeste als ummauertes Festungsgebiet mit Zitadelle, Steinbruch, Baracken und Feldern; Goblin-Wälder mit dem Grubenhort; Tributdörfer |
| Mitte | Menschenland: Valen, Orden, Händler |
| Süden | Grenzland der Toten (Alt-Vharn, Nekropole, Schwarze Feste) |
| Osten | Totenland: rote Asche, Ruinen, Grabfelder |

**Varg** empfängt in seiner Halle. Man kann mit ihm reden, ihn herausfordern oder aus dem Hinterhalt angreifen. Freikauf oder Dienst bei der Kette sind als spätere Ideen offen.

**Karte (M):** gemalt, mit Kriegsnebel. Nur Erkundetes wird beschriftet.

## Das Hochreich Aurelion (Session 12)
Der Norden und die Mitte sind wild, rau und arm. Der Süden ist das Hochreich Aurelion: reich, adlig, geordnet und technisch weit voraus, aber seine Technik ist alt, abgenutzt und praktisch.

- **Städte:**

  | Stadt | Rolle |
  |---|---|
  | Aurelheim | Hauptstadt |
  | Kupferhafen | Handel |
  | Gelenkhall | Prothesen, Kybernetik |
  | Tickmar | Automatenfabrik |
  | Sankt Serin | Akademie, Labore |

- **Automaten** sind Wachen, Arbeiter und Diener; in Ruinen gibt es verwilderte Kriegsautomaten.
- **Prothesen:** Glieder können verloren gehen, das Hochreich verkauft den Ersatz. Das ist der Grund, in den Süden zu reisen.
- **Offen:**
  - Adelshäuser als Fraktionen mit Intrigen.
  - Aufträge in Aurelheim.
  - Handel des Hochreichs mit der Kette (Tribut in Automaten?).
  - Automaten-Arbeiter mit Tagesablauf (heute sind es Wachen).
  - Prothesen-Werkbank und Reparatur.

## Offene Designfragen
- Rarität/Affixe, Skill Tree, Klassen: siehe PHASE_STATUS (Phasen 8–10).
