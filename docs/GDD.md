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
| Diener (Nekromant) | — | folgen ihrem Herrn nicht über Kartengrenzen; der Ruf verklingt nach 60 s ohnehin (flüchtig, nie gespeichert) |

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
- Nicht getan: die Weltkarte selbst (512×512) ist nicht größer geworden. Zwischen Eren und Nordfurt liegen jetzt ~18 statt
  ~24 Kacheln (Fluss, Brücke). Eine größere Karte bräuchte ein neues Spielstandformat → Rückfrage an den Nutzer.

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

**Geplante weitere Titelklassen (nicht umgesetzt, Vorschlag):** Druide (Ressource „Wildkraft“ nur in der Natur; Tat:
den Waldschrein gegen die Toten halten), Kopfgeldjäger („Fährte“ je markiertem Ziel; braucht das Kopfgeldsystem aus
Phase 17), Barde („Inspiration“ aus Treffern der Gruppe; Tat in einer Schenke), Mönch („Fokus“ aus Ausweichen im
letzten Moment), Alchemist („Tinkturen“, an Feuerstellen gebraut), Todesritter (liegt als Grundklasse ohne Lehrer im
Klassenbaum — Kandidat, als Titel der Stillen Schar neu gedacht zu werden). Jede braucht zuerst eine Tat in der Welt.

## Offene Designfragen
- Rarität/Affixe, Skill Tree, Klassen: siehe PHASE_STATUS (Phasen 8–10).
