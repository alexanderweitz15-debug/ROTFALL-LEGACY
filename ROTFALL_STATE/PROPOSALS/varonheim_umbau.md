# Varonheim-Umbau: Kronfels, Burg ohne Portal, Torkontrolle, Start in der Hauptstadt

**Status:** APPROVED (Antworten 01.10.2026 in DECISIONS.md)
Kennzeichnung: **FAKT** = belegt (Datei:Zeile, Stand der Lesung), **GEMESSEN** = im Browser gemessen (`genWorld()` auf dem Titelbildschirm, Seed 1, ohne Spielstand), **VORSCHLAG**, **ANNAHME**.

Entwicklerwunsch (01.10.2026, grundsätzlich freigegeben):
> „Der Ort von Varon ist viel zu klein, das soll viel größer sein. Das soll auch weiter nördlich sein. Vielleicht soll der Spieler auch direkt dort starten.“
> „Die Burg soll direkt betretbar sein und nicht über ein Portal. Um in die Burg reinzukommen, wird man vorher von Wachen durchsucht und darf keine Waffen mit reinnehmen (man kann später welche schmuggeln) oder für 5k die Wache bestechen mit einer 30 % Chance.“

---

## 1. Kurzfassung
- Varonheim zieht **auf den Kronfels**: ein Steinplateau östlich von Nordfurt, direkt an der Königsstraße Nordfurt–Aschfurt. Der Mittelpunkt liegt **40 Kacheln nördlicher** als heute. Die Burg steht im Norden auf dem Fels über dem Nordmeer.
- Größe **117 × 87 Kacheln statt 71 × 47** (Faktor 3,05 in der Fläche), etwa 70 Häuser statt 21.
- Die **Varonsburg wird Teil der Weltkarte**: Thronsaal, Adelsflügel, Kanzlei, Burgverlies und Kronschmiede sind begehbare Gebäude mit ausblendendem Dach, wie der Palast in Aurelheim. Es gibt kein Portal und keine eigene Karte mehr.
- **Burgfrieden:** Der Burgbezirk hat ein einziges Tor. Dort durchsucht die Torwache jeden. Waffen kommen in die Waffenkammer und gehen beim Hinausgehen zurück. Bestechung kostet 5000 Gold, gelingt zu 30 %, und beim Scheitern ist das Gold weg und ein Kopfgeld folgt. Schmuggel kommt in einer späteren Scheibe.
- Optionaler **Start in Varonheim** als Wahl des Startorts, unabhängig von der Herkunft. Die Herkunft bestimmt das Viertel, in dem man startet.
- Die **Weltfolge bleibt stabil**: Weder `buildCapital` noch `house()` ziehen `rnd()`. Der Aufruf wandert hinter `coastline()`.

---

## 2. Heutiger Stand (FAKT)

**Welt (`world.js`)**
- `CAPITAL = { x: 475, y: 147, hw: 35, hh: 23 }`, Burg-Eingang `keep = [475, 137]` (`world.js:1357–1358`). In `LOCATIONS` mit `r: 36` und `fin: true` (`world.js:1359`).
- `buildCapital()` (`world.js:1361–1393`):
  - Ringmauer mit vier Toren, Türmen und Burgbezirk (31 × 17), Bergfried als massiver Block, Straßen, Häuser über `put()`.
  - `TOWN_PLAN.varonheim` hat `village: true` und `perHead: 45`.
  - Der Aufruf steht in `extendSouth()` (`world.js:1323`), also nach `shiftWest()` und vor `coastline()`, `lakes()`, `buildVillages()` und `scatterPOIs()` (`world.js:1174–1181`).
- **Kein `rnd()`** in `buildCapital` und `house()` (gegrept: `world.js:141–226` und `1361–1393` ohne `rnd`, `ri(`, `pick(` oder `chance(`). `prop()` zieht nur `uid()` (`world.js:92`).
- `lakes()` und `scatterPOIs()` weichen Städten über `townAt()` aus (`world.js:1581`, `1619`). `coastline()` prüft keine Städte (`world.js:1658`).
- `regionAt()`: Für Städte mit `village: true` gilt die rohe Region der Kachel (`world.js:232`).
- **GEMESSEN:**
  - `TOWN_PLAN`-Flächen: Varonheim 440–510 × 124–170 mit **21 Häusern**; Nordfurt 423–484 × 62–112; Eren 309–384 × 75–125; Aschfurt 787–852 × 123–168; Kreuzweg 594–672 × 345–407; Mühlbach 504–534 × 216–236.
  - Tiefhall (Dungeon) liegt bei 631, 54 mit r 15.
  - Nördlich von Nordfurt ist ab y ≈ 48 Meer; zwischen x 528 und 580 reicht es bis y ≈ 55.
  - Östlich von Nordfurt (x 500–720, y 48–200) liegt Region **`mountain`**: Steinplateau (STONE), dazu Felsgrate bei y 50–92.
  - Die Königsstraße verläuft auf y ≈ 96 von Nordfurt bis Aschfurt. Die Straße nach Kreuzweg verläuft auf x ≈ 630 von y 96 nach Süden.
  - `genWorld` dauert 2,8 s.

**Burg (`game.js`)**
- `buildVaronburg()` (`game.js:8328–8363`) baut bei jedem Betreten die Karte `varonburg` (72 × 62) neu:
  - König, Aldhelm, Brandt, Ysmay, drei Adlige, Grimm, drei Gefangene, Hagen, Wendel, acht Gardisten und drei Diener
  - alles `transient`; gespeichert werden nur Flags (`varonExecuted`, `varonFreed`, `varonScattered`)
- Zugänge:
  - Das Portal zur Burg setzt `ensureVaronGate()` (`game.js:8262`). `ARRIVAL.varonburg` steht in `game.js:5022`.
  - Gesperrt ist es bei gefallener Stadt (`game.js:4970`).
  - Wer beim Laden in der Burg steht, für den wird sie neu gebaut (`game.js:2062`).
  - Der Katakomben-Ausgang B führt zu `varonburg` (`game.js:12934`, `12942`), Eingang B ist eine Kellertreppe (`game.js:8346`).
- Weitere Stellen:
  - Hof: `varonChoices` (`game.js:8365`). Garde und Besiedlung: `capitalMigrate` (`game.js:8268`).
  - Fall: `capitalFall` (`8278`). Exil: `ensureVaronExile` (`8299`). Befreiung: `capitalFreed` (`8317ff.`). Szenen: `capitalScene` (`9128`, rechnet relativ zu `CAPITAL`).
  - Kult: `ensureBloodCult` stellt die Verdächtigen relativ zu `square` auf (`12840ff.`); Kultstart (`12888`: in Varonheim ab Tag 3, sonst Tag 12); Gruft A über `area`, also `x0 + 6`, `y0 + 9` (`12962–12966`).
- Kerker-Muster: `goToJail()` nimmt die Waffe in `S.jail.weapon`, `releaseJail()` gibt sie zurück und verliert nie etwas (`game.js:7982–7990`, `8102–8105`).
- Kontroll-Muster in Aurelion: eine Zone (`inAurel`), ein Sichtkegel (`coneSees`) und ein Haltedialog (`robotStop`) (`game.js:6297–6320`).
- Ruf der Klinge: Stufen `styleTier` (`game.js:13261`). Ränge bei Valen: Rekrut, Soldat, Veteran, Ritter, Offizier (`data.js:932`).
- Start: Für alle Herkünfte gilt `worldPt(66, 70)` vor Eren (`game.js:1873–1874`). Ein Tutorial gibt es nicht; nur ein Log-Hinweis zeigt nach Eren (`game.js:1898–1902`). `ORIGINS` hat fünf Einträge ohne Startort (`data.js:2–13`).

**Krieg (`sim.js`, `data.js`)**
- Kanten `northcity–varonheim` und `ashford–varonheim` (`data.js:1362`). Der Ort kommt aus `LOCATIONS`.
- `nearPlayer(node, r = 40)` entscheidet, ob eine Schlacht vor Ort ausgetragen wird (`sim.js:323`). `materialize` lässt die Angreifer 20 Kacheln vor dem Ort erscheinen (`sim.js:476ff.`). `CAP_SIEGE.from` ist Tag 20 (`sim.js:34`).

**Darstellung (`render.js`)**
- Kachel-Chunks 16 × 16, Cache 140 (`render.js:214`). Häuser blenden das Dach aus, wenn man darin steht (`playerInside`, `render.js:793`). Begehbare Großbauten gibt es schon: Palast 22 × 12 mit Thron und der Typ `court` (`world.js:174`, `1520`).

---

## 3. Lage und Größe (VORSCHLAG)

### 3.1 Wo: der Kronfels
| | heute | neu |
|---|---|---|
| Mitte | 475, 147 | **558, 107** |
| Fläche (Ringmauer) | 440–510 × 124–170 (71 × 47) | **500–616 × 64–150 (117 × 87)** |
| Burgbezirk | 460–490 × 125–141 | **528–588 × 65–86** (auf dem Fels, Nordrand) |
| `LOCATIONS.r` | 36 | **62** |

Begründung:
- **Weiter nördlich:** Die Burg (y 65–86) liegt nördlicher als Nordfurts Mitte (y 82), die Stadtmitte 40 Kacheln nördlicher als heute.
  - Direkt „über“ Nordfurt geht es nicht: Dort beginnt ab y ≈ 48 das Meer (GEMESSEN).
  - Nordfurt zu verschieben würde den Kriegsgraphen, Exil-Ziele und Wege brechen.
- **Nachbarn:**
  - Nordfurts Ostrand liegt bei x 484, also 16 Kacheln Abstand zum Westtor; die Straße ist schon da.
  - Bis Tiefhall (631, 54, r 15) sind es von der Nordostecke 18 Kacheln.
  - Das Meer endet bei y ≈ 55; dazwischen bleiben 9 Kacheln Fels als Klippe.
  - Mühlbach, Aschfurt und Kreuzweg sind weit weg.
- **Wege:**
  - Die Königsstraße (y 96) wird die Hauptachse: Westtor bei 500, 96 Richtung Nordfurt, Osttor bei 616, 96 Richtung Aschfurt.
  - Die Kreuzweg-Straße (x 630) mündet zwei Kacheln vor dem Osttor.
  - Das Südtor (558, 150) führt zu den Königsfeldern (§3.4) und weiter nach Mühlbach.
- **Kriegsgraph:** Varonheim liegt jetzt auf der Linie Nordfurt–Aschfurt statt dahinter. Die Kanten bleiben unverändert.
  - `nearPlayer` bekommt für die Hauptstadt r = 70, sonst greift die Schlacht vor Ort am Stadtrand nicht.
  - `materialize` bleibt: Angreifer erscheinen 20 Kacheln vor dem Mittelpunkt, also vor der Mauer.
- **Regionen:** Das Plateau ist `mountain`. Damit Spawns, Wetter und Klang stimmen, bekommt `regionAt` eine Ausnahme: Kacheln in der Hauptstadt plus 8 Kacheln Ring zählen als `greenmark` (Menschenland, passt zu „Mitte Menschen“).

### 3.2 Grundriss (Kachelangaben, alles in `buildCapital`)
- **Ringmauer** x 500–616 / y 64–150. Etwa alle 14 Kacheln ein Turm.
  - Vier Tore: W (500, 95–97), O (616, 95–97), S (557–559, 150).
  - Das Nordtor entfällt, dort ist die Burg.
- **Achsen:**
  - Königsstraße y 95–97 (W–O).
  - Kronweg x 557–559 vom Wallplatz zum Südtor.
  - Wallstraße y 88 vor dem Burggraben.
- **Burgbezirk (Kronfels)** x 528–588 / y 65–86, eigene Mauer und ein Tor (Burgtor 557–559, 86); siehe §4.
- **Wallplatz** x 545–571 / y 87–92: Torhaus mit Waffenkammer, Paradeplatz, Aushang „Burgfrieden“.
- **Viertel:**
  - Tempel und Friedhof (NW, x 501–527, y 65–94): Kapelle, Heiler, Friedhof x 503–515 / y 66–76. Dort liegt die Gruft A, die heutige Regel `x0 + 6`, `y0 + 9` passt weiter.
  - Adelsviertel (NO, x 589–615, y 65–94): sechs bis acht Herrenhäuser.
  - Händlerviertel (W, x 501–543, y 98–112): Laden, Taverne, Bäcker, Kontor.
  - Markt (Mitte, x 545–571, y 99–112): Brunnen, Galgen, Standbild Varons, Stände, Vermisstenliste (Kult).
  - Gildenviertel (O, x 573–615, y 98–112): Kontor, Laden, Schneider, Badehaus.
  - Armenviertel (SW, x 501–543, y 114–149): dichte Hütten, schmale Gassen. Gut zum Untertauchen; die Kultentführungen geschehen meist hier.
  - Handwerk und Garnison (SO, x 573–615, y 114–149): Kaserne, Stall, Schmiede und Exerzierplatz. Hier mustert Valen das Entsatzheer.
  - Zwischen Kronweg und den Vierteln im Süden (x 545–571, y 114–149): Wohnhäuser und Gärten.
- **Bauweise** wie heute: dunkler Stein, Schiefer, Laternen auf der Königsstraße, schwarze Banner an den Toren. `CAP_SIZE` und `put()` bleiben, die Viertel-Funktion `district()` bekommt die neuen Rechtecke.
- **Bewohner:** `perHead` 60 statt 45 (größer, aber nicht so voll), ANNAHME etwa 160–180 Bewohner. Zum Vergleich: Aurelheim ist größer und läuft schon.

### 3.3 Weltfolge: warum nichts verrutscht
- `buildCapital` ruft weder `rnd()`, `ri()`, `pick()` noch `chance()` auf; `house()` auch nicht (FAKT, gegrept). Lage und Größe zu ändern verschiebt die Zufallsfolge der Welt also nicht.
- **Reihenfolge ändern:** `buildCapital()` raus aus `extendSouth()` (`world.js:1323`) und in `genWorld` direkt nach `coastline()` und vor `lakes()` setzen (`world.js:1178`):
  - Die Küste frisst die Nordmauer nicht.
  - Seen weichen der Stadt aus (`townAt`).
  - Dörfer und Streuorte, die danach kommen, sehen die neue Stadt.
  - Alle drei Funktionen arbeiten mit Hash und ohne `rnd()`, die Reihenfolge ist zufallsneutral.
- **Was sich bewusst ändert:**
  - Streuorte (POIs, Schlüssel `poi_x_y`) im Umkreis beider Stadtflächen, denn sie weichen Städten aus.
  - Props (`gk` = Typ@Kachel) auf beiden Flächen.
  - Alles andere bleibt Kachel für Kachel gleich (Probe P1).
- **Spiel-Zufall:**
  - Mehr Häuser bedeuten mehr `spawnResidents()`-Würfe beim Neustart (`game.js:1864`). Fremde Proben mit Zufall können kippen.
  - Die Proben laufen in `sandbox()`; bei einem fremden Fehlschlag erst die Zwischenwerte loggen (CLAUDE.md).

### 3.4 Die alte Fläche
VORSCHLAG: Aus 440–510 × 124–170 werden die **Königsfelder**, ein Vorwerk der Hauptstadt.
- Felder (`T.FIELD`), drei Höfe, eine Scheune und ein Kornspeicher, alles ohne `rnd()`. Die Straße vom Südtor führt hindurch.
- Das ist billig, füllt die Lücke und speist die Kornrechnung der Hauptstadt. Hier startet die Herkunft Feldknecht (§6).

---

## 4. Die Burg ohne Portal

### 4.1 Vergleich
| | **A) Burg in der Weltkarte** (empfohlen) | B) Eigene Karte, Übergang ohne Blende |
|---|---|---|
| Wunsch „nicht über ein Portal“ | voll erfüllt: man geht hinein | halb: Kartenwechsel, nur ohne Schwarzblende |
| Bild außen = innen | ja (ein Bau) | nein (Außenbild und Innenkarte passen nicht zusammen) |
| Torkontrolle, Schmuggel über Keller oder Diener | natürlich: Zone, Sicht, Wege | Kontrolle am Übergang; Schmuggel nur als Dialog |
| Belagerung, Fall, Szenen | Burg sichtbar; Knochenwachen stehen im Burghof | Burg bleibt ein schwarzer Kasten |
| Koop | Gäste gehen frei; jeder wird einzeln durchsucht | „Ihr reist nur zusammen“ (`coop.js:296`); einzeln durchsuchen geht schlecht |
| Simulation | Hof lebt mit der Welt (Fernfiguren nur jedes 3./8. Bild, `game.js:2504–2506`) | Hof ruht, solange man draußen ist (`game.js:9600`) |
| Leistung | +30 Figuren in `S.ents.world`; Chunks unverändert (Kacheln liegen ohnehin in der Welt); Dachbilder je Bau im Cache wie beim Palast | Neubau bei jedem Betreten (heute ebenso), kein Dauerposten |
| Aufwand | mittel: Hof wird ein flüchtiges `ensureVaronCourt()` in der Welt, alle `varonburg`-Bezüge umstellen | klein |

**Empfehlung A.** Der Mehraufwand für die Leistung ist gering:
- Die Burg besteht aus Kacheln, die die Welt ohnehin zeichnet.
- Die Hofleute ruhen wie alle fernen Figuren.
- Begehbare Großbauten mit Thron (Palast in Aurelheim) laufen bereits.
- Unter Tage bleiben nur die **Katakomben** (echter Dungeon, Karte bleibt).

### 4.2 Aufbau des Burgbezirks (x 528–588, y 65–86)
- **Burgmauer** mit vier Ecktürmen. Das **Burgtor** (557–559, 86) ist das einzige Tor, ein Fallgitter-Prop, im Normalbetrieb offen.
  - Davor steht das Torhaus am Wallplatz mit Torwache und Waffenkammer.
- **Burghof** (Stein, DFLOOR vor dem Bergfried): Gardezelte, Brunnen, Wendels Stand und drei Diener.
- **Thronsaal** als Haus-Typ `court`, 30 × 14 bei x 543–572 / y 67–80, Tür S:
  - Thron, Säulenreihen, Banner und Tafel
  - König, Aldhelm und Brandt
  - Dach blendet aus wie beim Palast
- **Adelsflügel** (W, 12 × 10, x 530–541 / y 68–77): drei Adlige; es gelten die bisherigen Flags `varonExecuted` und `varonScattered`.
- **Kanzlei** (O, 12 × 10, x 575–586 / y 68–77): Ysmay. Die **Kellertreppe** ist ein Portal in die Katakomben (Eingang B, nur mit `S.cult.keyB`).
- **Burgverlies** (W, 10 × 6, x 530–539 / y 79–84): Grimm und die drei Gefangenen aus Aurelion (Flag `varonFreed`).
- **Kronschmiede** (O, 10 × 6, x 577–586 / y 79–84): Hagen.
- **Gesindekammer** (4 × 4 am Burghof): später für den Schmuggel (§5.4).
- **Flüchtigkeit:** Das Personal ist `transient` und wird von `ensureVaronCourt()` gebaut, aufgerufen in `newGame()` und `continueGame()` (Muster `ensureDefenseMasters();`).
  - Die Gebäude entstehen deterministisch in `buildCapital`.
- **Schutz:** Weltereignisse wie Raub, Seuche oder Heerschlacht töten den König nicht nebenbei. `varonCourt`-Figuren nehmen nur Schaden vom Spieler, von Koop-Gästen oder in der Belagerung (Fall). Getötet werden kann Varon weiter wie heute.

### 4.3 Umbau bestehender Bezüge
- `ensureVaronGate` und `ARRIVAL.varonburg` entfallen; `MAP_KEYS` behält `varonburg` (leer), damit alte Stände laden.
- Katakomben-Ausgang B (`game.js:12934`): Die Treppe führt in die Welt an die Kellertreppe der Kanzlei.
  - `ARRIVAL.katakomben(from)` unterscheidet A und B über das Portal-Prop (`portalTag: 'B'`), nicht mehr über `from === 'varonburg'`.
- Fall der Stadt (`game.js:4970`): Statt „Portal gesperrt“ stehen zwei Knochenwachen am Burgtor; der Burghof ist besetztes Gebiet. Der Exilhof bleibt unverändert.
- `capitalMigrate`: Die Wachposten wandern ans Burgtor (zwei), an die vier Stadttore (je zwei) und auf den Markt. Der Log-Text „Südlich von Nordfurt …“ wird angepasst.
- Debug „Varon: in die Varonsburg“ wird zu „Varon: ans Burgtor“. Die Hofszene (`game.js:14430`) teleportiert in den Thronsaal.

---

## 5. Burgfrieden: Torkontrolle

### 5.1 Ablauf
1. **Zone:** Der Burgbezirk ist eine Zone, Muster `inAurel` (`game.js:6297`).
   - Wer sie betritt, ohne Passierstatus (`S.keepPass[entId]`) oder mit einer Waffe ohne Erlaubnis, wird angehalten.
   - Am Tor hält immer die Torwache an. Im Inneren hält jede Burgwache, die einen im Sichtkegel hat (`coneSees`), dazu §5.5.
2. **Haltedialog** (Torwache Gerold, Königsgarde Stufe 13):
   > „Burgfrieden. Keine Klinge in des Königs Halle. Arme hoch.“
   - **Durchsuchen lassen** → Waffen gehen in die Waffenkammer, man bekommt den Pass.
   - **Bestechen (5000 Gold)** → §5.3.
   - **Umkehren** → man wird einen Schritt zurückgeschoben (`pushOut`).
3. **Hinausgehen:** Wer die Zone durch das Burgtor verlässt, bekommt beim Waffenmeister im Torhaus alles automatisch zurück:
   > „Hier. Zähl nach, ich tue es auch.“
   - Das Log listet die Gegenstände. Rückgabe auch per Gespräch („Meine Waffen zurück“).
4. Kommt man anders heraus (Katakomben, Kerker, Tod, Kartenwechsel), bleibt das Lager liegen und kann jederzeit am Torhaus abgeholt werden. **Nie geht etwas verloren** (wie `releaseJail`).

### 5.2 Was abgegeben wird
- **Alles mit `slot: 'weapon'`**, angelegt und im Gepäck: Klingen, Äxte, Bögen, Stäbe, Feuerwaffen, Wurfwaffen.
- Bomben und Sprengsätze, Gifte, Dietriche, Fesselstricke (T08).
- Während der Kultkrise (`S.cult.stage ≥ 2`) zusätzlich **Blutphiolen**:
  > „Seit die Leute verschwinden, trägt keiner Blut in die Burg.“
  - Wird ein **Vampir-Held** dabei ertappt, gibt es Alarm, Valen −15 und Kopfgeld 300.
- **Erlaubt:** Rüstung, **Schilde** („Der König fürchtet Klingen, nicht Bretter“), Talismane, Tränke, Nahrung, Auftragspakete.
- **Zauber** lassen sich nicht abgeben. Wer im Burgbezirk einen Angriffszauber wirkt, löst sofort Alarm aus (wie eine gezogene Waffe).
- **Datenform:** `S.keepDepot = { [entId]: { items: [...], equip: { weapon, offhand }, day } }`.
  - Gespeichert, die Exemplare bleiben unverändert (Rarität, Affixe, Geschichte der Ahnenwaffe).
  - Fällt die Stadt, nimmt Hagen das Lager ins Exil mit, die Rückgabe geht dann am Exilhof.
  - Stirbt der Held, kann der Erbe das Lager abholen („Auf den Namen deines Hauses verwahrt“).

### 5.3 Bestechung: 5000 Gold, 30 %
- Nur bei der Torwache, höchstens einmal am Tag je Held. Die 5000 Gold sind sofort weg.
- Die Chance ist fest 30 % (Wunsch des Entwicklers). Weder Ruf noch Handel ändern sie, das hält die Zahl ehrlich.
- **Gelingt:** Man darf mit allen Waffen hinein, bis man die Zone verlässt.
  > „Ich habe nichts gesehen. Und du hast mich nie gesehen.“
  - Der Hinweis im Log sagt, dass eine gezogene Waffe drinnen trotzdem Alarm auslöst (§5.5).
- **Scheitert** (VORSCHLAG, gilt ohne Widerspruch):
  - Das Gold ist weg („als Beweisstück“).
  - Valen −10, Kopfgeld 250 bei Valen (`addBounty`, „Bestechung eines Königsgardisten“).
  - Die Torwache ruft: Wer stehen bleibt, kommt in den Kerker (`goToJail('valen', 250, 'varonheim')`), wer rennt, wird verfolgt (vorhandene Festnahmelogik).
  - Danach drei Tage **Verdacht**: Durchsuchung immer gründlich, keine Bestechung.
  - So lohnt der Versuch erst ab sehr viel Gold, und das Risiko bleibt spürbar.

### 5.4 Wer wird wie durchsucht (Ruf, Rang, Titel)
| Lage | Folge am Tor |
|---|---|
| Kopfgeld bei Valen | keine Durchsuchung: Festnahme (vorhandenes `arrestCheck`) |
| Valen „Verhasst“ | kein Zutritt („Nicht du. Mit oder ohne Klinge.“) |
| Ruf der Klinge „Schlächter“ (≤ −60, Menschenland) | **kein Zutritt**; Ausnahme Ritter Varons oder Rang Offizier |
| „Gnadenlos“ (−59…−20) | gründlich: Schmuggel −20 % |
| „Gnädig“/„Barmherzig“ | Schmuggel +10 % („Dich kennt man. Geh.“) |
| Aurelion-Ruf ≥ 25 (Varons Argwohn) | gründlich: Schmuggel −15 %, Spruch „Messinggeruch“ |
| Rang **Veteran** (2) bei Valen | flüchtig: Schmuggel +25 % |
| Rang **Ritter** (3) oder Titel **„Ritter Varons“** | behält **eine** angelegte Klinge („Ein Ritter des Königs trägt sein Schwert“); der Rest wird durchsucht |
| Rang **Offizier** (4) | keine Durchsuchung, voller Pass |

Die Durchsuchung selbst bleibt eine Gesprächszeile ohne Zufall. Würfel gibt es nur beim Schmuggel.

### 5.5 In der Burg
- Wer eine Waffe **zieht** (Angriff, angelegter Bogen oder Stab beim Zielen, Angriffszauber) und dabei von einer Burgwache gesehen wird:
  - Erste Warnung: „Waffe weg!“ (zwei Sekunden).
  - Danach Alarm: alle Königsgarden der Burg feindlich, Valen −20, Kopfgeld.
- Bestochene oder mit Pass Eingetretene, die nur etwas **tragen**, fallen nicht auf.

### 5.6 Gefährten, Tiere, Gefangene, Koop
- **Menschliche Gefährten** werden genauso durchsucht. Ihr Lager steht unter ihrer ID im selben Depot, die Rückgabe läuft beim Hinausgehen automatisch.
  - Ein Gefährte mit Rang oder Titel gibt es nicht; es gilt der Status des Helden, außer bei „Ritter behält Schwert“.
- **Tiere und Pferd** warten im **Zwinger am Torhaus**, wie das Pferd vor Türen (`game.js:9588`). Automaten und Prothesenträger aus Aurelion lässt Varon nicht herein:
  > „Messing kommt nicht in des Königs Halle.“
  - Messingträger dürfen mit Pass hinein, werden aber gründlich durchsucht.
- **Gefesselte Gefangene (T08)** müssen draußen abgegeben werden (Wache nimmt sie wie üblich ab).
- **Koop:**
  - Jeder Held wird einzeln angehalten; die Dialoge laufen über `uiHooks` zum jeweiligen Gast.
  - Jeder zahlt seine eigene Bestechung, das Depot läuft je Entity-ID.
  - Ein Gast, der drinnen die Verbindung verliert, wird geparkt (`S.coopHeroes`), sein Depot bleibt. Beim Wiederkommen kann er drinnen weiter, unbewaffnet.
  - Ein Gast, der einen Gefährten steuert, wird wie ein Gefährte behandelt.
  - Der Wirt rechnet alles; Gäste speichern nichts.

### 5.7 Schmuggel (spätere Scheibe)
1. **Versteckte Kleinwaffe:** Dolch, Wurfmesser, neues *Stilett*, Dietrich.
   - Mit „Verstecken“ beim Durchsuchen gibt es einen Wurf: 15 % + Schleichen × 1,5 (höchstens +45), plus die Zuschläge aus §5.4, begrenzt auf 5–90 %.
   - **Erwischt (erstes Mal):** abgegeben, 150 Gold Strafe, Valen −5, drei Tage Verdacht. **Zweites Mal im Verdacht:** Kerker.
2. **Geheimfach:**
   - Kaufbar als Stiefelscheide oder Doppelboden-Gürtel (Schmuggelgut im Basar von Karak-Atar, `game.js:7879`), oder an der Werkbank herstellbar (Leder + Eisen).
   - Fasst eine Kleinwaffe und gibt +30 % auf den Wurf.
3. **Diener bestechen** (Mette, Kuno, Ilse oder Bero im Armenviertel, 300 Gold):
   - Am nächsten Tag liegt **eine** Waffe in der Gesindekammer.
   - 15 %: Sie verrät dich, die Waffe ist weg, Valen −5, ein Tag Verdacht.
4. **Katakombenweg:** Über den Kanzleikeller (Eingang B, `S.cult.keyB`) kommt man bewaffnet und ohne Kontrolle in die Burg.
   - Wer drinnen **ohne Pass** gesehen wird: „Wie bist du hier hereingekommen?“ — Durchsuchen lassen (Strafe 150) oder Alarm.
5. **Lieferkiste** (optional): Wendels Proviantkiste vom Markt zum Burghof tragen. Der Auftrag ist bekannt, die Wache sieht nur flüchtig nach (+40 %).

---

## 6. Start in Varonheim (VORSCHLAG)
- **Wahl des Startorts** im Erstellungsbildschirm, getrennt von der Herkunft: „Varonheim, die Hauptstadt“ (Vorgabe) oder „Grenzland vor Eren (klassisch)“.
  - Neues Feld `cfg.start`; `newGame` ersetzt `worldPt(66, 70)` (`game.js:1874`) durch einen Startpunkt je Ort.
  - `ORIGINS` bleibt unverändert.
- **Viertel nach Herkunft** (gibt Stimmung ohne neue Herkunft):
  - Feldknecht: Königsfelder vor dem Südtor
  - Jäger: Westtor (Wildhändler)
  - Lehrling: Tempelviertel beim Heiler
  - Ehemaliger Soldat: Garnison (Rang „Rekrut“ bleibt wie heute über `rep`)
  - Wanderer: Taverne am Markt
- **Erste Schritte** (es gibt kein Tutorial, also nur Hinweise):
  - Log-Zeile mit Richtung zur Tafel am Markt, zum Torhaus („Burgfrieden“) und zur Straße nach Nordfurt.
  - Die Tafel der Hauptstadt bekommt drei leichte Aufträge (Stufe 1–3): Ratten im Kornspeicher der Königsfelder, ein Botengang nach Nordfurt, Wolfsfelle für den Kürschner. Muster `registerContracts` und `ensureBoards`.
- **Schutz vor zu frühem Ärger:**
  - Der Kultstart „in Varonheim ab Tag 3“ (`game.js:12888`) gilt für Spieler, die hier starten, erst ab Tag 10 und Stufe 5, sonst ab Tag 16. Die Katakomben sind Stufe 12–16.
  - Die Belagerung beginnt ohnehin erst ab Tag 20 (`CAP_SIEGE.from`).
- **Koop:** Gäste erscheinen neben dem Wirt wie heute (`game.js:18382`).
- **Chronik:** „bricht in Varonheim auf“.

---

## 7. Migration alter Stände
Grundsatz (DECISIONS: „Alte Spielstände dürfen bei Weltumbau brechen, Migration nur wenn billig“): Die Migration ist billig und läuft einmal über das Flag `S.flags.capital2` in `continueGame()`.
1. **Kacheln, Häuser und Props** kommen neu aus `genWorld()`.
   - Gespeicherte Props mit veraltetem `gk` in der **alten Fläche ±3** (`planned`, `capProp`, Blutzeichen, Möbel alter Häuser) werden gelöscht. Sonst bleiben sie als Geister stehen, siehe `mergeProps` (`state.js:166–173`).
   - Bauten des Spielers in der neuen Fläche werden entfernt, ihre Baustoffe kommen ins Stadtlager; das Log sagt es.
2. **Figuren:** Alle gespeicherten Welt-Figuren in der alten Fläche ±5 (Bewohner mit `homeTown === 'varonheim'`, Kult-Verdächtige, Knochenwachen `heldGuard`) werden um Δ = neuer Platz − alter Platz verschoben, dann `freeSpotNear`.
   - Bewohner bekommen ein neues Haus gleichen Typs (Zuordnung nach Reihenfolge).
   - Gefährten und Reisende bleiben, wo sie sind.
3. **Kult:** `S.cult.missing[*]` bekommen dieselbe Hauszuordnung. Blutzeichen und Vermisstenliste baut `ensureBloodCult` neu. Gruft A rechnet ohnehin relativ zu `area`.
4. **Hausbezogene Werte:** `S.flags.raidDamage`-Einträge alter Varonheim-Häuser fallen weg. `S.growth.varonheim`, `S.towns.varonheim`, `S.war.nodes.varonheim` und `S.after.capital` bleiben (sie hängen nicht an Kacheln).
5. **Spieler:**
   - Steht er auf der Karte `varonburg`, kommt er vor das Burgtor auf den Wallplatz (ohne Durchsuchung, Pass für diesen Besuch). `S.ents.varonburg` wird geleert.
   - Steht er in der alten Fläche, landet er auf den Königsfeldern.
6. **Hinweis:** Log und Chronik melden:
   > „Varonheim ist gewachsen: Die Hauptstadt liegt jetzt auf dem Kronfels östlich von Nordfurt, die Varonsburg ist zu Fuß zu erreichen. Am Burgtor gilt der Burgfrieden.“
   - Die alte Stelle bleibt auf der Atlaskarte aufgedeckt; die neue wird beim ersten Besuch aufgedeckt.
7. **Streuorte** (POIs) in der Nähe beider Flächen können sich verschieben. Keine Migration (entspricht der Entscheidung).

---

## 8. Scheiben
| # | Inhalt | Dateien |
|---|---|---|
| **S1** | Umzug und Vergrößerung: `CAPITAL` neu, neuer Grundriss mit Burgbezirk als Kacheln (Thronsaal noch geschlossen, Portal bleibt vorerst am Burgtor), Aufruf nach `coastline()`, Ausnahme in `regionAt`, `LOCATIONS.r`, `nearPlayer` r 70, Königsfelder, Migration §7.1–7.4, 7.6 | world.js, game.js, sim.js |
| **S2** | Burg in der Welt: `ensureVaronCourt()`, Hofbauten begehbar, Portal und `buildVaronburg` entfallen, Katakomben-Ausgang B in die Welt, Fall und Befreiung am Burgtor, Migration §7.5 | game.js, world.js |
| **S3** | Burgfrieden: Zone, Halt, Depot, Rückgabe, Bestechung, Tabelle §5.4, Gefährten, Tiere, Koop, Alarm §5.5 | game.js, data.js, coop.js (nur Hook) |
| **S4** | Schmuggel §5.7: Kleinwaffen, Geheimfach, Diener, Katakombenweg, Lieferkiste | game.js, data.js |
| **S5** | Start in Varonheim §6: Startort-Wahl, Startviertel, Anfängeraufträge, Kult-Verzögerung | game.js, ui.js, index.html (Auswahl) |

Jede Scheibe bekommt einen Eintrag in `docs/MECHANIKEN.md`, Debug-Einträge und Proben. Der Cache-Schlüssel wird erst beim Ausliefern erhöht.

---

## 9. Proben
- **P1 Weltfolge stabil:**
  - Prüfsumme der Weltkacheln außerhalb von 60 Kacheln um beide Stadtflächen ist gleich der Prüfsumme vor dem Umbau. Der Engineer misst die Konstante vor dem ersten Edit.
  - Zweimal `genWorld()` mit gleichem Seed ergibt dieselben Kacheln.
- **P2 Varonheim 2, Lage:**
  - Fläche mindestens 110 × 80, Mitte y < 115, kein Überlapp mit `TOWN_PLAN.northcity`, Abstand zu Tiefhall mindestens 15.
  - Mindestens 60 Häuser, mindestens 100 Bewohner.
  - Alle vier Tore, der Wallplatz und der Thronsaal sind per Breitensuche von Nordfurt erreichbar (Muster der heutigen Probe `game.js:17705–17708`).
  - Die Burgmauer ist geschlossen bis auf das Burgtor.
- **P3 Hof in der Welt:**
  - König, Aldhelm, Brandt, Ysmay, Grimm und Hagen stehen in ihren Bauten. Kein `portal: 'varonburg'` mehr.
  - Katakomben B führt in die Kanzlei.
  - `varonExecuted`, `varonScattered` und `varonFreed` wirken nach einem Neubau.
- **P4 Burgfrieden:**
  - Held mit Schwert, Dolch im Gepäck und Bogen: nach der Durchsuchung keine Waffe mehr, drei im Depot.
  - Nach dem Hinausgehen alles zurück, mit gleicher Rarität und gleichen Affixen.
  - Schild und Rüstung bleiben am Körper.
- **P5 Bestechung:**
  - 5000 Gold werden abgezogen.
  - Bei 2000 Würfen in der Sandbox liegt die Erfolgsquote bei 30 ± 3 %.
  - Ein Fehlschlag bringt Kopfgeld 250, Valen −10 und Verdacht; kein Gegenstand geht verloren.
  - Unter 5000 Gold wird die Option nicht angeboten.
- **P6 Status:**
  - Ritter behält eine Klinge, Offizier hat freien Zutritt, Schlächter wird abgewiesen, wer Kopfgeld hat, wird festgenommen.
- **P7 Gefährten und Koop:**
  - Ein Gefährte wird entwaffnet, ein Hund wartet im Zwinger.
  - Das Depot eines falschen Gasts ist getrennt; geparkt und wieder zurück bleibt das Depot gleich.
- **P8 Migration:**
  - Ein künstlicher Altstand mit Bewohnern, Kult-Vermissten und Spieler auf `varonburg` ergibt nach dem Laden: alle in der neuen Fläche, keine Geister-Props in der alten, Spieler am Wallplatz, Flag gesetzt.
  - Zweimaliges Laden ist idempotent.
- **P9 Start** (Wegwerf-Slot):
  - Mit Startort Varonheim steht der Held im Viertel seiner Herkunft, und die Tafel hat Aufträge der Stufe 1–3.
  - Kein Kultstart vor Tag 10.
- **Anpassen:**
  - die Probe „Varonheim (Nutzer §5g.1)“ (`game.js:17705–17712`)
  - „König Varon (§5d.4)“
  - die Kult-Proben mit `buildCatacombs` und `varonburg` (`game.js:17418–17460`)
  - „Varonheim S1/S2“ und „RB-023“

## 10. Debug (Strg+Umschalt+D, Abschnitt „Varonheim 2“)
- Ans Burgtor, In den Thronsaal, Zonen anzeigen (Umriss Stadt, Burgbezirk, alte Fläche)
- Durchsuchung jetzt, Depot zeigen, Depot leeren (zurückgeben)
- Bestechung erzwingen (Erfolg / Fehlschlag), Verdacht an/aus
- Schmuggel-Wurf anzeigen (mit allen Zuschlägen), Diener-Schmuggel jetzt
- Rang/Titel setzen (Veteran, Ritter, Offizier, Ritter Varons), Klinge auf Schlächter
- Migration auf künstlichen Altstand (in der Sandbox), Startort Varonheim im Wegwerf-Slot

## 11. Hinweise für den Spieler
- **Schild** am Wallplatz:
  > „Burgfrieden. Keine Waffen in des Königs Halle. Abgabe in der Waffenkammer.“
- **Beim ersten Nähern** ein Meldungsfluss: „Am Burgtor wird durchsucht.“
- Durchsuchung und Rückgabe werden **im Log** einzeln gelistet.
- **Bestechung:** Der Text nennt Preis und Risiko vorher deutlich:
  > „Fünftausend. Und wenn ich Nein sage, sage ich es laut.“
- **Ortskarte** (Scout-Feature) und `MECHANIKEN.md`: Viertel, Tore, Burgfrieden, Rangregeln.
- **Heldenfenster:** Zustand „Waffen verwahrt: 3 (Torhaus Varonheim)“.

---

## 12. Fragen an den Entwickler (höchstens 4)
1. **Größe:** Faktor 3 (117 × 87, etwa 70 Häuser) **[Empfehlung]**, Faktor 2 (etwa 100 × 66) oder Aurelheim-Format (191 × 137)? Aurelheim-Format passt nur, wenn Nordfurt weichen muss.
2. **Lage:** Kronfels östlich von Nordfurt, Mitte 558/107, Burg auf dem Fels über dem Meer, die alte Stelle wird zu den Königsfeldern **[Empfehlung]**? Oder Nordfurt verschieben und Varonheim an seine Stelle setzen? Das wäre teurer: Kriegsgraph, Exil, Wege und alte Stände.
3. **Start:** Wahl des Startorts im Erstellungsbildschirm, Varonheim als Vorgabe und Viertel nach Herkunft **[Empfehlung]**? Oder eine eigene Herkunft „Stadtkind“? Oder Varonheim fest für alle?
4. **Burg-Innenraum:** in der Weltkarte, begehbare Bauten ohne Kartenwechsel **[Empfehlung]**? Oder eine eigene Karte, die man durch das Tor ohne Blende betritt?

Bestechung beim Scheitern: Gold weg, Valen −10, Kopfgeld 250, drei Tage Verdacht. Das gilt als Vorgabe, wenn der Entwickler nicht widerspricht.
