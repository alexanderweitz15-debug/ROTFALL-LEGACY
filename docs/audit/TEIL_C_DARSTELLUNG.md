# Audit Teil C — Darstellung, Animation, Zwischensequenzen, UI/UX, Klang, Technik, Bloat

Stand 01.10.2026, Version `v=22`, Stil R. Nur gelesen und im Browser gemessen (eigener Tab, Stand `rotfall.backup.s14c`, `S._quiet`,
nichts gespeichert). Punkte aus `PLAN_ROADMAP.md` §5g werden nicht als neue Idee geführt, nur bewertet oder geschärft (markiert „§5g.N“).
Messwerte stammen aus einem Hintergrund-Tab (1024 × 768); sie sind Größenordnungen, keine Benchmarks.

---

## 1. Ist-Zustand (kurz, belegt)

| Bereich | Was da ist | Beleg |
|---|---|---|
| Figuren | Stil R (Standard seit S15): Raster 40 × 56, 4 Richtungen, Atmen, Gehen, Hieb je Waffenklasse, Treffer, Rückstoß, Deckung, Zaubern, Knien, Sitzen, Tragen, Rolle; Varianten `vs` 0–7, Körperbau `BUILDS`. Dazu Stil D (`figure.js`, 1067 Zeilen) und F (Atlas-PNG). | `fig5.js`, `sprites.js` `humanFrame`/`SPEC_KEYS`, `game.js:1963` |
| Gegner | 49 Arten in `MONSTERS`; Tiere eigene Rahmen (`beastFrame`), Goblins ×0,82, Bosse über `scale`. | `render.js:2031`, `render.js:2070` |
| Tode | 9 datengetriebene Todesarten (Sturz, Rückwärts, Wucht, Brand, Frost, Auflösen, Zerfall, Abschalten, Enthauptung) mit Ereignisachse. | `anim.js` `ANIM_DEFS.death`, `deathPose` |
| Treffer | Hit-Stop (40–120 ms), Rückstoß `kb`, Taumeln, Aufprallstern, Krit-Ring, Material-Klang (Klinge/Wucht/Stich, Rüstung). | `game.js:3310`, `:3384`, `sfx.js` `hit` |
| Gebäude | 437 Häuser (Oberwelt); Material je Stadt (`TOWN_STYLE`), Funktion über ein Merkmal; Innenansicht, Rauch. | `buildings.js`, `render.js:772` |
| Props | 92 Arten, 14 681 Stück in der Oberwelt (Bäume 7024); Vektor gemalt, gerastert, gecacht. `drawProp` ist ein Switch mit 697 Zeilen. | `render.js:989`, Browser |
| Zwischensequenzen | 7 Fahrten (Teleport, Legion, Fall Vargs, Fall der Untoten, Ende der Brüder, Ratssitzung, Abstimmung); Letterbox, Text, Abblende, Zoom/Fokus je Shot, `to` für Schwenk. | `game.js:8877–8980` |
| Gesten | 3 Gesten (zeigen, abwehren, achsel), genutzt im Gespräch und beim Omega-Jubel. | `anim.js`, `game.js:11031` |
| UI | 16 Fenster, 14 Einträge in der Menüleiste, HUD links, Log unten, Kontextfeld, Kodex mit Handbuch. | `ui.js:34`, `ui.js:513` |
| Klang | 20 synthetisierte Klänge, Wind, regionaler Zweiklang, Zufallsgeräusche; eine Lautstärke. Keine Musik (→ §5g.16). | `sfx.js` |
| Spielstand | 2,17 MB JSON (Browser: `rotfall.legacy.save`); `saveData()` 142 ms synchron. | Browser-Messung |

---

## 2. Visuelles

**Gut.** Die R-Figuren sind das Stärkste am Spiel: Materialrampen, Gesicht im Schatten, Abnutzung, Klassen-Silhouetten (Totenkragen,
Hörnerkrone, Geweih). Elitegegner (Rotgardist, Kettenmeister, Todesritter, Garmadon, Engel) haben klare, eigene Umrisse. Der Magierturm
(`drawMageTower`) zeigt, wie ein Wahrzeichen wirken kann: einmal gemalt, darüber lebendige Fenster und Funken.

**Schwach — im Browser geprüft (Sammelbild aus 36 Bewohnern und 36 Gegnerarten, Pose `i0`, Richtung S):**
- **Bewohner lesen sich nur über Farbe.** Weber, Jäger, Bäcker, Holzfäller, Witwe, Kaufmann, Bürgerin, Rekrut stehen als dieselbe
  Säule aus Wams/Kittel da; Unterschied = Stofffarbe und Hut. Das ist Audit A-03 aus S13, weiterhin offen. Der Style Guide fordert
  ausdrücklich „Beruf und Rang am Umriss“.
- **Untote Zauberer verschmelzen.** `shade`, `necromancer`, `cultist` sind drei fast gleiche schwarze Kapuzensäulen; `wraith` ist eine
  graue Variante davon. Im Kampf ist nicht lesbar, wer heilt, wer beschwört, wer meuchelt.
- **Monster ohne Monsterkörper.** `flesh_golem` (Leichenkoloss) sieht im Rahmen aus wie ein Bauer im braunen Kittel (nur ×1,6 skaliert);
  `ash_demon` ist ein Kapuzenmann. Goblins haben Menschenproportionen (nur ×0,82). Dodon wirkt allein über `scale 2,1`.
- **Fraktionsarchitektur nur über Material.** `TOWN_STYLE` (buildings.js:15): Kettenfeste = Schiefer + Schwarzstein, **Varonheim =
  Schiefer + Schwarzstein**, **Tickmar (Aurelion) = Schiefer + Schwarzstein**. Sonnwacht (Orden), Lichtenrain, Aurelheim und Sankt Serin
  teilen Schiefer + heller Stein. Die Form ist überall dieselbe (Sattel-/Walmdach-Kasten). Das verletzt den Auftrag (Punkt 2: „nicht nur
  durch Farben unterscheiden“).
- **Besetzte Städte** bekommen Trümmer und Knochenwachen, aber kein anderes Stadtbild (Banner, Tore) — Scout B7, eingeplant §5g.35.
- **Stil-Dreifachung.** Jede neue Tracht, Pose oder Waffe muss in R gemalt werden; D und F laufen mit, `STYLE_GUIDE.md` nennt noch
  D als „Standard“ (veraltet), und `sprites.js:124` lädt `src/assets/ref5_atlas.png` immer, auch wenn F aus ist.

---

## 3. Animation

**Gut.** Todesarten nach Ursache sind datengetrieben (`ANIM_DEFS.death`), Treffer haben Hit-Stop, Rückstoß und Materialklang, Arbeiter
zeigen Funken/Staub (`workAnim`), Blut tropft beim Laufen, Taumeln wankt.

**Fehler (belegt):**
- **Geist-Partikel zeichnen den Helden.** `drawFx` Typ `'ghost'` (render.js:2332) malt immer `SP.humanFrame(SP.humanSpec(S.player), 'S', 'tuck')`
  — gedacht als Nachbild der Ausweichrolle. Derselbe Typ wird aber auch benutzt von `UNDEAD_FX.wraith` (game.js:3819, alle ~420 ms)
  und von der Todesart `dissolve` (`anim.js`, `{ t: 0.9, fx: 'ghost', n: 3 }`). Browser-Probe: ein Gespenst erzeugte in 3 s sieben
  `ghost`-Partikel bis 30 px neben sich. Folge: Jedes Gespenst zieht halbdurchsichtige Kopien **des Helden in Rollpose** hinter sich her,
  und jeder aufgelöste Gegner hinterlässt drei Heldenschemen.
- **Partikel ohne Deckel.** `fx()` (game.js:3735) schiebt ohne Obergrenze in `S.fx`; `float()` ebenso in `S.floats`. `ANIMATION_REFERENZ §6`
  fordert „max. 20 gleichzeitig im Bosskampf“ — nirgends umgesetzt. Bei Goblinsturm (12 Goblins + Dodon + Varg) oder Legion (8) gegen
  Garmadon wächst die Liste unbegrenzt.

**Lücken:**
- Nur drei Gesten. Es fehlen die Posen, die Szenen tragen würden: jubeln, knien/aufgeben (existiert als Figurenpose `kneel`, aber nicht als
  Geste), fliehen mit Armen über dem Kopf, auf den Boden schlagen, salutieren, trauern.
- **Zuschauer reagieren nicht.** Bewohner neben einem Kampf laufen ihren Tagesplan weiter oder fliehen (`fleeing`), aber es gibt keine
  Zwischenstufe (hinsehen, zurückweichen, Tür zu). `gesture(…, 'abwehren')` wäre sofort nutzbar.
- **Der Heldentod ist nicht zu sehen.** `playerDeath` (game.js:12765) setzt im selben Tick `S.paused = true` und öffnet den Todesbildschirm
  (2,2 s CSS-Einblendung). Die Todesart des Helden (`deathPose`) spielt hinter einer 90 % schwarzen Fläche. Der wichtigste Moment eines
  Erbfolge-Spiels hat keinen eigenen Takt.

---

## 4. Zwischensequenzen

### 4.1 Wie das System arbeitet (game.js:8877–8940)
Der Held wird unsichtbar (`cineGhost`) an den Ort jeder Einstellung **teleportiert** (`cineMove`); die Kamera folgt ihm wie immer.
`setup()` jeder Einstellung verändert die Welt (spawnt, heilt, ergibt sich); `cineEnd` holt übersprungene `setup` nach. Überblendung per
DOM-`animate` (650–900 ms), Text in schwarzen Balken (Schrift Georgia — das UI nutzt Cinzel/Spectral). Kein Klang, keine Musik, keine Posen.

### 4.2 Gemessen: Fall Vargs (`RF.vargCinematic()`, 6 Einstellungen)
| Shot | erstes Update | erstes Zeichnen |
|---|---|---|
| 0 Held | 18 ms | 17 ms |
| 1 Steinbruch | 6 ms | **426 ms** |
| 2 Schmiedeviertel (Kampf) | 31 ms | 25 ms |
| 4 Tributdorf brennt | 27 ms | 29 ms |
| 5 Aurelion, Flüchtlinge | 7 ms | 55 ms |
| Ende (zurück) | 16 ms | 41 ms |

Der Schnitt zum Steinbruch friert das Bild fast eine halbe Sekunde ein (Boden-Chunks und Figurenbilder werden erst beim Zeichnen gebacken,
BUG-142). Die Abblende läuft als DOM-Animation weiter, verdeckt den Hänger also nur teilweise.

### 4.3 Beispiel des Nutzers: Goblins befreien sich — und sterben
Drei Stellen im Code gehören dazu, keine davon ist heute eine Szene:

1. **Goblinsturm** (`goblinStorm`, game.js:7559). Auslöser: der Spieler greift Varg an. Heute: Dodon wird 70 px neben Varg gesetzt, zwölf
   Goblins entstehen 3–7 Kacheln daneben (`spawnEnemy`), Toast, `camShake(8, 700)`, Logzeile. Kein Anmarsch, kein Tor, kein Horn (die
   Logzeile spricht von „Hörnern aus Knochen“ — zu hören ist nichts).
2. **Sieg** (`goblinStormWon`, :7569). Überlebende Sturmgoblins werden `alive = false` gesetzt und sofort aus der Liste gefiltert — sie
   **verschwinden**, statt heimzuziehen. Dodon wird nach Morrgrund teleportiert. Direkt danach läuft `vargCinematic` (1,5 s später), die
   wieder frische Goblins erzeugt.
3. **Niederlage** (`morrFall`, :7577, aus `playerDeath`). Stirbt der Held im Sturm, werden **alle** Goblins des Dorfs und des Sturms im
   selben Tick gelöscht (keine Leichen, keine Gräber), die Hütten werden zu `camp_ruin`, eine Chronikzeile. Der Erbe erfährt es nur aus der
   Chronik. Das ist genau die „statische Szene“, die der Nutzer nicht will — sie ist sogar unsichtbar.
4. **Sklavenaufstand der Eisenfeste** (`revoltStart`, :10027) — ebenfalls Befreiung, ebenfalls nur `afterSay` (Log + Chronik + Toast).
   Der Ausgang (`revoltWon`) baut ein Lager mit Zelten und Feuer — ohne dass der Spieler den Auszug sieht.

### 4.4 Bewertung
Das System ist tragfähig (Shot-Liste, Fokus, Zoom, Schwenk, Überspringen ohne Folgenverlust, Koop sieht mit). Es fehlt eine **Regie-Ebene**:
Figuren, die sich bewegen und posieren, Klang je Shot, Schnitt ohne Hänger, Ereignisse auf einer Zeitachse innerhalb des Shots. Heute
tragen Text und Floats („Frei!“) die ganze Szene.

---

## 5. UI/UX

- **Menüleiste läuft über.** 14 Einträge; bei 1024 px Breite `scrollWidth 906 > clientWidth 650` (Browser). Kodex, Effekte, Optionen
  sind nur per Tastatur oder Scrollen erreichbar. Charakter / Ausbildung / Talente / Zauberbuch / Effekte sind fünf Fenster für einen Helden.
- **Gespräche sind eine flache Liste.** `talk()` (game.js:11024–11111) hängt über 30 Hook-Funktionen an; jede Figur bietet zusätzlich
  „Was gibt es Neues?“, „Was hältst du von Omega?“, oft „Ich hätte da eine Frage …“. Keine Gruppen, keine Sortierung, **keine Zifferntasten**
  (`ui.js:464` erzeugt nur Buttons). Bei Händlern mit Auftrag, Rang und Kontor entstehen 10+ Knöpfe untereinander.
- **Kontextfeld teuer.** `renderContext` kostet 1,8 ms und läuft zusammen mit `refreshHUD` (0,6 ms, `innerHTML`) alle 180 ms (game.js:2414),
  auch wenn sich nichts ändert.
- **Heldentod** ohne Takt (siehe 3.). **Zwischensequenz-Schrift** Georgia statt Spectral.
- Bekannt und eingeplant: Kartenlegende, eigene Markierungen, Inventar sortieren, Chronik-Filter (§5g.37), Einstieg in Eren (§5g.38).
  Schärfung dazu in V9/V10 unten.

---

## 6. Klang

**Fehler (belegt): falsche Umgebung in drei großen Regionen und allen Frost-Gewölben.** `MOOD` (sfx.js) kennt nur `greenmark, plains,
forest, marsh, mountain, desert, badland, blight`. `regionAt` liefert aber auch `aurel`, `deadland`, `eisen` (world.js:227), und Gewölbe
setzen `amb: 'frozen'`, `'aurel'`, `'coast'` (world.js:2017–2028). Für alle diese Werte:
- fällt der Grundklang auf Grünland zurück (Quinte 110/164,8 Hz — „Weite“), und
- `ambienceTick` rutscht in den Zweig `if (day)` → **Vogelgezwitscher bei Tag, Grillen bei Nacht** — im Totenland, in der Eisenmark,
  in Aurelion, in Tiefhall, in der Varonsburg und bei den Zwergen (Tag/Nacht kommt von der Oberweltuhr, auch unter der Erde).

**Lücken:** nur ein Lautstärkeregler, keine Busse (Effekte/UI/Umgebung/Musik), keine Stimmenbegrenzung (jeder `sfx`-Aufruf baut neue
Knoten), kein Ducking bei Zwischensequenzen, keine Klänge in Zwischensequenzen, ein einziger UI-Klick (Scout B13, §5g.37), keine Musik (§5g.16).

---

## 7. Technik

| # | Befund | Beleg | Wirkung |
|---|---|---|---|
| T1 | Spielstand 2,17 MB, davon `ents` 2,11 MB: 843 NPCs × Ø 1,9 KB, 727 Gegner (428 KB). Größte Felder: `plan` 157 KB (wird beim Laden neu gebaut, P-02), `body` 139 KB, `equip` 92 KB, `attributes` 84 KB. gzip → **205 KB** (Faktor 11). | Browser | localStorage-Kontingent ~5 MB: **nur zwei Spielstand-Plätze passen**; der Rest bricht mit „quota“. |
| T2 | `saveData()` 142 ms synchron (JSON), bei jedem Tagesbeginn, bei `beforeunload` und an ≥ 15 direkten `save()`-Stellen in Dialogen (game.js). | Browser, `state.js:182` | Spürbarer Ruckler mitten im Spiel. |
| T3 | Kalter Aufbau: erstes Bild in einer Stadt 201 ms, Szenenschnitt 426 ms. | Browser, BUG-142 | Hänger bei Teleport, Kutsche, Zwischensequenz. |
| T4 | Caches werden **ganz** geleert statt ältestes zu verwerfen: `frameCache` bei 4000 (`sprites.js:1036`, leert auch `warmed`), `propCache` bei 600 (`render.js:953`), `houseCache` bei 120 (`:779`), `bakeCache` 400, `SWING_V` 3000. Animierte Props belegen je 6 Schlüssel. | Code | Sobald eine Grenze fällt, müssen alle sichtbaren Figuren/Props neu gemalt werden (~10 ms je Figurbild laut BUG-093) — ein Spitzenruckler, der sich wiederholt. |
| T5 | **Partikel ziehen aus dem Spiel-RNG.** `fx()` ruft `rnd()` dreimal je Partikel (game.js:3739; `rnd` = mulberry32 aus state.js). Gewaltstufe „Kaum Blut“ springt vor dem Ziehen raus. | Code | Eine reine Grafikeinstellung ändert Beute, Treffer, KI-Würfe. Jede neue Staubwolke verschiebt alle folgenden Würfe — Ursache für wackelnde Proben (CLAUDE.md „Probes and RNG“, BUG-111). |
| T6 | Zeichnen/Logik in einer Häusergruppe (15 Häuser): Median 4,0 / 4,6 ms, 95 % 11,9 / 12,2 ms. | Browser | BUG-108 weiter offen. |
| T7 | Große Funktionen: `selftest` 3099 Zeilen, `drawProp` 697, `debugSections` 229, `titleAbility` 170, `continueGame` 157. | awk | Jede Prop-Änderung trifft einen 700-Zeilen-Switch; Konflikte zwischen parallelen Agenten. |
| T8 | Offene Bugs mit Darstellungsbezug: BUG-108 (HIGH), BUG-142, BUG-093, BUG-143 (Totenland schwarz, Goblin im Totenland), BUG-062 (Beiwagen springt), A-02/A-03 (Bewohner in einer Reihe, gleich aussehend), V-02 (Grabsteine vor Schenkentüren). | `docs/BUGS.md` | — |

---

## 8. Bloat und Merge

| Kandidat | Befund | Vorschlag |
|---|---|---|
| Drei Grafikstile | D (`figure.js` + Teile `sprites.js`), R (`fig5.js`), F (Atlas-PNG + `ref5_atlas.js`). R ist Standard, F „vorerst abgeschaltet“ (game.js:1962). | F entfernen (inkl. PNG-Laden); D einfrieren (keine neuen Merkmale mehr nachziehen). STYLE_GUIDE auf R umschreiben. |
| 5 Heldenfenster | Charakter, Ausbildung, Talente, Zauberbuch, Effekte. | Ein Fenster „Held“ mit Reitern. |
| 3 Wissensfenster | Chronik, Aufträge, Kodex. | Ein „Tagebuch“ mit Reitern Aufträge · Chronik · Kodex (+ Chronik-Filter §5g.37). |
| Gruppe + Stall | zwei Fenster für Begleiter. | Stall als Reiter in „Gruppe“ (passt zu §5g.7 Tier als 4. Mitglied). |
| Gesprächsknöpfe | „Was gibt es Neues?“, „Was hältst du von Omega?“, „Ich hätte da eine Frage …“ an jeder Figur. | Zu einem Knopf „Reden …“ mit Unterliste zusammenlegen. |
| Zwei Toast-/Textsysteme für Szenen | `cineBars` (Georgia) und `coop-cine` (Spectral) für dieselbe Sache. | Eine Funktion, eine Schrift. |
| `ghost`-Partikel | ein Typ für drei Zwecke (Rolle, Gespenst, Auflösen). | Trennen (siehe V3). |

---

## 9. Verbesserungen (Struktur nach AUFTRAG Punkt 13)

### V1 — Regiebuch für Zwischensequenzen
- **Problem:** Szenen sind Diashows: Kamera springt, Text trägt alles, keine Bewegung, kein Klang, Hänger beim Schnitt (426 ms).
- **Gameplay:** Der Spieler sieht die Folgen seiner Taten *geschehen* (Goblins rennen durch das Tor, Paladine knien nieder, Flüchtlinge ziehen
  los) und erkennt danach die Orte in der Welt wieder.
- **Interaktion:** Kamera (`camAim`), KI (Figuren bekommen Ziele), `gesture`, `sfx`, Chronik, Koop (`coop.js:389` sendet schon Kamera + Text).
- **Emergenz:** Weil Shots Figuren aus der laufenden Welt wählen („der nächste Goblin am Tor“), sieht jede Szene je nach Weltlage anders aus.
- **Risiko:** Mehr Zustandsänderung während der Fahrt; Überspringen muss weiter alle Folgen anwenden (heute gelöst über `setup`).
- **Umsetzung:**
  - Shot-Felder ergänzen (game.js `cinematic`/`cineNext`/`cineTick`): `cast: [{ sel: e => …, n, to: {x,y}, pose, say, at }]`,
    `beats: [{ t: 0–1, fx, sfx, shake, gesture, float }]` (gleiches Schema wie `ANIM_DEFS.death.ev`, `animEvents` wiederverwenden),
    `hold` (ms ohne Text), `sfx` beim Schnitt.
  - Vor jedem Schnitt vorbacken: in `cineNext` für `C.shots[C.i + 1]` `R.prefetchAt(map, x, y)` (neuer Export um `prefetchChunk`) und
    `SP.warm()` für Figuren im Umkreis; Schnitt erst, wenn die Warteschlange leer ist oder 300 ms vergangen sind.
  - `cineBars` auf Spectral umstellen, Balken ein- und ausfahren statt schalten.
  - Während der Fahrt `ambience` dämpfen (V11).
- **Tests:** Probe „Regiebuch: Beats feuern genau einmal je Shot, auch beim Überspringen; cast-Figuren erreichen ihr Ziel“ (Muster wie
  game.js:14764); Messprobe „Schnitt < 60 ms nach Vorbacken“ im Debug. Koop: Gast sieht Text und Kamera weiter.
- **Priorität:** High · **Umfang:** Medium

### V2 — Goblinsturm, Sieg und Fall von Morrgrund inszenieren (Beispiel des Nutzers)
- **Problem:** siehe 4.3 — Spawn neben Varg, Verschwinden der Sieger, unsichtbarer Untergang des Dorfs.
- **Gameplay:**
  - *Aufbau (0–4 s):* Horn (neuer Klang `horn`), Kamera schwenkt zum Kettentor, Dodon bricht es auf (Tor-Prop wird `rubble`, Staub, Shake),
    die Goblins **laufen** von dort in die Halle (Spawn am Tor, `aiState: 'pursue'` auf Varg), Dodon brüllt (`float`, `growl` tief).
  - *Kampf:* kein Shot, der Spieler kämpft; wichtige Tode bekommen einen kurzen Fokus (500 ms Zoom auf Dodon, falls er fällt).
  - *Sieg:* Überlebende jubeln (neue Geste `jubeln`), heben Varg-Banner auf, ziehen danach **zu Fuß** nach Morrgrund (`anchor` = MORR,
    `transient` bis zur Ankunft); in Morrgrund am nächsten Abend ein Fest (vorhandenes `festTick`/Feuer) mit so vielen Goblins, wie überlebt haben.
  - *Niederlage (Held stirbt):* der Erbe startet mit einer kurzen Fahrt „Morrgrund brennt“: Hütten als `camp_ruin` mit `fire`-Partikeln,
    **Leichen und Gräber** statt Löschen (vorhandene `grave`-Entität), zwei bis drei überlebende Goblins als Flüchtlinge Richtung Grubenhort.
- **Interaktion:** Fraktion Goblin (Ruf), Chronik, Erbfolge (`chooseSuccessor`), Flüchtlinge (`refugeeWave`-Muster), Siedlung Grubenhort,
  Gerüchte (`rumorChoices` lesen Chronik).
- **Emergenz:** Die Zahl der Überlebenden bestimmt Festgröße, Händler in Morrgrund und spätere Aufträge (Grisk); Gräber bleiben als Ort, an
  dem ein Erbe trauern oder plündern kann.
- **Risiko:** `morrFall` läuft aus `playerDeath` — die Fahrt muss nach der Erbenwahl kommen (`cineLater` erst nach `chooseSuccessor`),
  sonst kollidiert sie mit dem Todesbildschirm. Probe 15953 prüft heute „kein Goblin mehr“ — muss auf „keine lebenden, aber Gräber“ angepasst werden.
- **Umsetzung:** `goblinStorm(v)` → Spawn an `gateOf('kettenfeste')` statt an Varg + Regiebuch-Shot (V1); `goblinStormWon` → `g.stormHome = true`,
  Heimweg in `updateEnemy`/`partyAI`-ähnlichem Schritt, Entfernen erst bei Ankunft; `morrFall` → `grave` je Goblin, `S.flags.morrFallScene = true`,
  Fahrt in `chooseSuccessor`-Rückruf. Gleiches Muster für `revoltStart`/`revoltWon` (Auszug zum Grubenhort als Kolonne).
- **Tests:** Proben „Sturm: Goblins entstehen am Tor, nicht neben Varg“, „Sieg: Überlebende sind nach 1 Tag in Morrgrund“, „Fall: Gräber =
  Zahl der gefallenen Goblins, keine lebenden Morr-Goblins, Fahrt erst nach Erbenwahl“; Debug-Knöpfe „Goblinsturm“, „Morrgrund fällt (Szene)“.
- **Priorität:** High · **Umfang:** Medium

### V3 — Geist-Partikel reparieren
- **Problem:** Gespenster und aufgelöste Gegner zeigen den Helden in Rollpose (belegt, siehe 3.).
- **Gameplay:** Gespenster bekommen einen eigenen Schleier; die Rolle behält ihr Nachbild.
- **Interaktion:** `UNDEAD_FX`, `ANIM_DEFS.death.dissolve`, Ausweichrolle (game.js:2891).
- **Emergenz:** keine; Lesbarkeit.
- **Risiko:** gering.
- **Umsetzung:** Rolle schreibt `type: 'afterimage'` mit `src: p.id`; `drawFx` zeichnet für `afterimage` die Figur `byId(src)`, für `ghost`
  einen Schleier (3–4 senkrechte, nach oben blassere 2-px-Streifen, Farbe `--frost` gedämpft). Stilprobe in `styleArea` (game.js:1608) anpassen.
- **Tests:** Probe „Gespenst erzeugt keine Heldenschemen“: Gespenst spawnen, 3 s ticken, kein Partikel mit Typ `afterimage` außer nach Rolle.
- **Priorität:** Critical (sichtbarer Fehler) · **Umfang:** Small

### V4 — Umgebungsklang je Region richtig
- **Problem:** Vogelgezwitscher im Totenland, in Aurelion, der Eisenmark und in allen Frost-Gewölben (siehe 6.).
- **Gameplay:** Man hört, wo man ist, bevor man es sieht: Knochenwind im Totenland, Dampf und Messing in Aurelion, Hämmer und Ketten in der
  Eisenmark, Tropfen und Hall unter der Erde, Möwen an der Küste.
- **Interaktion:** Region, Tageszeit, Weltzustand (nach Fall der Kette: keine Hämmer mehr in der Eisenmark; besetzte Stadt: kein Marktgemurmel).
- **Emergenz:** Klang meldet Weltveränderung (stille Schmieden nach `S.halt`, Glocken bei Ratssitzung).
- **Risiko:** gering; Klangbudget (V11).
- **Umsetzung:** `MOOD` um `aurel, deadland, eisen, frozen, coast, sky` ergänzen; `ambienceTick(region, day, town, under)` — `under` aus
  `DUNGEONS[S.map]` (game.js:2430), unter der Erde kein Tag/Nacht-Zweig; eigene Zweige je neuer Region. Baut die Grundlage für §5g.16 Musik
  (gleiche Regionsschlüssel).
- **Tests:** reine Funktion `ambienceKind(region, day, under)` exportieren und prüfen: `deadland`/`frozen` liefern nie `'birds'`.
- **Priorität:** High · **Umfang:** Small

### V5 — Eigener Zufall für Effekte, Deckel für Partikel
- **Problem:** Partikel ziehen aus dem Spiel-RNG (T5); `S.fx`/`S.floats` unbegrenzt.
- **Gameplay:** Grafikeinstellungen ändern nie mehr den Spielverlauf; große Schlachten bleiben flüssig.
- **Interaktion:** alle Proben (stabilere Ergebnisse), Koop (Host und Gast würfeln Effekte unabhängig — schon heute so, aber ohne Nebenwirkung).
- **Emergenz:** —
- **Risiko:** Proben, die zufällig von der Partikelzahl abhingen, ändern ihr Ergebnis einmalig (dann stabil). Vorher/Nachher `RF.selftest()` vergleichen.
- **Umsetzung:** in game.js `const vrnd = Math.random` (oder eigener mulberry-Zustand) und in `fx()` statt `rnd()`; `fx()` bricht ab, wenn
  `S.fx.length > 400` (Boss-Deckel wie ANIMATION_REFERENZ §6 als weiche Grenze); `float()` mit gleichem Text am gleichen Ziel innerhalb 300 ms zusammenfassen.
- **Tests:** Probe „Gewalt ‚Kaum Blut‘ ändert den Spiel-RNG nicht“: `seedRng(7)`, Treffer mit Blut, `rnd()` vergleichen mit Lauf ohne Blut.
- **Priorität:** High · **Umfang:** Small

### V6 — Spielstand komprimiert und ohne Neubau-Felder (schärft §5g.13)
- **Problem:** 2,17 MB je Stand, 142 ms synchron, nur zwei Plätze im Browser-Kontingent (T1, T2).
- **Gameplay:** Mehrere Häuser/Welten parallel, kein Ruckler beim Tageswechsel, keine „Speicher voll“-Meldung.
- **Interaktion:** Spielstand-Plätze, Cloud-Export (nutzt gzip schon: `cloudsave.js:21`), Koop (Host speichert).
- **Emergenz:** —
- **Risiko:** Formatwechsel; alte Stände müssen lesbar bleiben (`loadRaw` erkennt Präfix).
- **Umsetzung:** (1) `SKIP`-Liste je Figur: `plan`, `schedulePos` (Neubau beim Laden, P-02) nicht schreiben — spart ~200 KB; Standardwerte
  (`attributes`, `skills`, `body` voll gesund) nur als Abweichung speichern. (2) `save()` → `saveAsync()`: `CompressionStream('gzip')`,
  Base64, Präfix `RFZ1:`; `loadRaw` erkennt Präfix, sonst JSON wie bisher. (3) Ein Speichern je Frame bündeln (heute ≥ 15 direkte `save()` in Dialogen).
- **Tests:** Probe „Speichern → Laden ergibt gleiche Figurenzahl, gleiche Beziehungen, gleiche Quests“; Größenprobe < 400 KB; `loadProbe` für
  alten JSON-Stand und neuen gzip-Stand.
- **Priorität:** Critical · **Umfang:** Medium

### V7 — Caches mit Verdrängung und Vorwärmen (BUG-142, BUG-093)
- **Problem:** Leeren statt Verdrängen (T4); kalter Aufbau 200–430 ms (T3).
- **Gameplay:** Keine Hänger beim Betreten einer Stadt, beim Schnitt, beim Stilwechsel des Tages.
- **Interaktion:** V1 (Schnitt), Reisen (`travel`), Kutschen, Teleport.
- **Emergenz:** —
- **Risiko:** Speicherbedarf; Grenzen messen (`frameCacheInfo`).
- **Umsetzung:** kleine LRU-Hilfe (Muster steht schon in `anim.js` `tinted`: löschen + neu einfügen = zuletzt benutzt) für `frameCache`,
  `propCache`, `houseCache`, `bakeCache`; beim Überlauf nur die ältesten 10 % verwerfen, `warmed` nicht mehr mitleeren. `travel()` und
  `cineMove()` rufen `R.prefetchAt()` + `SP.warm()` für den Zielumkreis vor dem ersten Bild.
- **Tests:** Probe „4200 verschiedene Figurenbilder → `clears` bleibt 0, Größe ≤ Grenze“; Messung im Debug „Kalter Aufbau“ (erste 5 Bilder).
- **Priorität:** High · **Umfang:** Small

### V8 — Der Tod des Helden als Moment
- **Problem:** Pause und Todesbildschirm im selben Tick; der Tod selbst ist nicht zu sehen.
- **Gameplay:** 1,5–2 s: Zeit läuft mit 25 %, Kamera rückt heran (Zoom 1,4 auf den Helden), Umgebung verstummt, Todesart spielt sichtbar,
  der Mörder bleibt stehen (Geste oder `float`), dann erst die Einblendung.
- **Interaktion:** `deathKind`/`ANIM_DEFS.death`, `camAim`, Klang (V11 Ducking), Koop (`coopHooks.hostDied`).
- **Emergenz:** Der Mörder wird sichtbar zur Figur, die der Erbe wiedererkennt (Rache als Anlass — Chronik hat die Ursache schon).
- **Risiko:** In den 2 s darf nichts mehr passieren (Unverwundbarkeit der Gruppe, kein zweiter Tod); Proben laufen mit `_quiet` ohnehin nicht hier hinein.
- **Umsetzung:** `playerDeath` → `S.dying = { t0, killer }`, `update` mit `dt * 0.25` solange `S.dying`, nach 1800 ms der bisherige Ablauf;
  ESC überspringt. `ANIMATION_REFERENZ §5` („Finisher“, „stiller Tod“: bei Gift/Erschöpfung kein Shake) gilt.
- **Tests:** Probe mit `S._quiet` aufgehoben in Sandbox: nach `playerDeath` ist der Todesbildschirm erst nach ≥ 1,5 s sichtbar; Erbe wird genau einmal gewählt.
- **Priorität:** Medium · **Umfang:** Small

### V9 — Gespräche gruppiert und mit Zifferntasten
- **Problem:** flache Liste aus 30+ Hooks, keine Tasten (siehe 5.).
- **Gameplay:** Oben stehen die zwei, drei Dinge, derentwegen man kommt (Auftrag erledigen, Handel, Ausbildung); darunter „Reden …“,
  „Dienste …“; 1–9 wählt, Esc geht.
- **Interaktion:** alle Hooks in `talk()`; Koop (`uiHooks.dialogue` bekommt dieselben Daten).
- **Emergenz:** —
- **Risiko:** Proben klicken Knöpfe über Text (`#dlg-choices button` + `textContent`, z. B. game.js:15446) — Texte bleiben gleich, nur in
  Untermenüs verschoben; betroffene Proben anpassen.
- **Umsetzung:** Choices bekommen optional `grp: 'quest'|'trade'|'serve'|'talk'`; `UI.dialogue` sortiert nach Gruppe und faltet `talk` ab
  vier Einträgen in „Reden …“. Zifferntasten im vorhandenen `keydown` (game.js:13100) wenn `UI.dialogueOpen()`.
- **Tests:** Probe „Händler mit Auftrag: erster Knopf ist ‚Erledigt‘ oder ‚Was liegt an?‘, höchstens 7 Knöpfe auf oberster Ebene“; Taste „1“ löst ersten Knopf aus.
- **Priorität:** High · **Umfang:** Small

### V10 — Menüs zusammenlegen: Held, Tagebuch, Gruppe (schärft §5g.37)
- **Problem:** 14 Einträge, Überlauf ab 1024 px; fünf Fenster für den Helden.
- **Gameplay:** Sechs Einträge: Held (C) · Gruppe (G) · Inventar (I) · Tagebuch (J) · Karte (M) · Lager (B); Fraktion als Reiter im Tagebuch
  oder Held; Optionen als Zahnrad.
- **Interaktion:** Tastenkürzel bleiben (T öffnet Held → Reiter Talente usw.); Touch (`nav` ist dort der einzige Weg).
- **Emergenz:** Das Tagebuch kann Aufträge, Chronik-Einträge und Kodex verknüpfen (Auftrag → Ort auf der Karte → Chronik der Tat).
- **Risiko:** Gewohnheit; Proben öffnen Fenster über `openModal(name)` — Namen bleiben als Reiter-Aliase gültig.
- **Umsetzung:** `NAV` (ui.js:34) auf 6; `openModal` bekommt Tabelle `ALIAS = { skills: ['hero', 'skills'], … }`; Reiterleiste wie in `codexUI`.
- **Tests:** Probe „jeder alte Fenstername öffnet das richtige Fenster und den richtigen Reiter“; Browser 1024 px: `nav.scrollWidth <= clientWidth`.
- **Priorität:** High · **Umfang:** Medium

### V11 — Klang-Busse, Stimmenlimit, Signale (schärft §5g.16, §5g.37)
- **Problem:** ein Regler, keine Busse, keine Grenze, keine Klänge in Szenen, ein UI-Klick für alles.
- **Gameplay:** Regler Effekte/Umgebung/Musik/Oberfläche; eigene kurze Signale für Stufenaufstieg, Auftrag erfüllt, seltene Beute, Rang,
  Chronik-Legende; Zwischensequenzen dämpfen die Welt und spielen ihren Beat-Klang.
- **Interaktion:** V1, V4, V8, Musik (§5g.16) hängt am Musik-Bus.
- **Emergenz:** —
- **Risiko:** WebAudio-Knotenlast; darum Limit.
- **Umsetzung:** `sfx.js`: `bus = { sfx, ui, amb, music }` als GainNodes an `master`; `sfx(name, …, bus='sfx')`; Zähler aktiver Stimmen
  (onended), über 24 leiseste verwerfen; `duck(ms, level)`; neue Namen `horn`, `levelup`, `quest`, `loot_rare`, `rank`. Einstellungen in `settingsUI`.
- **Tests:** Probe „100 Treffer in einem Tick → höchstens 24 Stimmen“ (Zähler exportieren); Einstellungen überleben Speichern/Laden.
- **Priorität:** Medium · **Umfang:** Small

### V12 — Silhouetten nach Beruf und Rolle (A-03)
- **Problem:** Bewohner und untote Zauberer unterscheiden sich fast nur in Farbe (Sammelbild, siehe 2.).
- **Gameplay:** Man erkennt auf einen Blick, wer Händler, Heiler, Schmied, Holzfäller ist — und im Kampf, wer beschwört (Nekromant:
  Stab mit Schädel, Knochenkragen) und wer meuchelt (Schatten: gekrümmt, Klauen, kein Saum).
- **Interaktion:** Tagesplan (Werkzeug nur während der Arbeitszeit, `workAnim`), Kontextfeld, Ziel-Priorität im Kampf.
- **Emergenz:** Plünderung/Verlust des Werkzeugs wird sichtbar (Schmied ohne Hammer nach Überfall).
- **Risiko:** Frame-Cache-Größe: jedes neue `SPEC_KEYS`-Feld vervielfacht Bilder — nur ein Feld `tool` mit ≤ 12 Werten.
- **Umsetzung:** `SPEC_KEYS` + `tool` (Axt, Korb, Hammer, Schürze, Laute, Hirtenstab, Buch, Laterne …) aus `prof` in `humanSpec`;
  in `fig5.js` an der vorhandenen Handposition malen (`carry`-Arme existieren, fig5.js:190). Untote: `monsterSpec` für `shade` eigene
  Kontur (vorgebeugt, ohne Saum), `necromancer` Schädelstab, `cultist` Blutmaske (passt zum Blutkult §5g.2); `flesh_golem` als `brute`-Körper
  (`bruteFrame` existiert).
- **Tests:** Probe „zwei Berufe mit gleicher Farbe erzeugen verschiedene Bilder“; Sammelbild im Debug (Stilbereich) erweitern.
- **Priorität:** Medium · **Umfang:** Medium

### V13 — Fraktionsarchitektur über Form (schärft §5g.35)
- **Problem:** Kette, Varonheim und Tickmar teilen Material; alle Häuser teilen die Form (siehe 2.).
- **Gameplay:** Man weiß, in wessen Land man steht: Kette = Wehrgänge, Kettenzinnen, vergitterte Fenster; Varon = Schieferhelme, Wappenbahnen;
  Aurelion = Messingkuppeln, Rohre, Dampf; Totenland = Knochengiebel, verhängte Fenster; Goblins = Schrottanbauten; Seevolk = Kiel als Dach.
- **Interaktion:** Krieg und Besatzung (Banner und ein Anbau wechseln mit dem Besitzer `S.war.nodes[k].owner`), Verfall (`wearOf`), Wiederbesiedlung.
- **Emergenz:** Eine Stadt, die dreimal den Besitzer wechselt, trägt Spuren aller drei (Banner neu, Anbau alt, Brandspuren).
- **Risiko:** `houseSprite` ist 257 Zeilen; Hausbilder kosten beim Erzeugen viel (Einzelmessung `HB.houseSprite` außerhalb des Spiels: ~15 ms je Bild; der Tag-Nacht-Wechsel in einer
  Häusergruppe kostete im Spiel ein Bild von 12 ms);
  der Besitzer gehört in den Cache-Schlüssel (`render.js:777`) → nur bei Wechsel neu.
- **Umsetzung:** `TOWN_STYLE` um `form: 'chain'|'varon'|'aurel'|'dead'|'goblin'|'sea'|'men'` ergänzen; `houseSprite` bekommt je Form
  2–3 Zusatzbauteile (Funktionen `formChain(g, b)` usw.) statt neuer Häuser; Banner nach aktuellem Besitzer.
- **Tests:** Probe „Stadt wechselt Besitzer → Hausbild-Schlüssel ändert sich, Bild ist neu“; Gebäudetest (P-04, 30 s) dabei auf gecachte Bilder umstellen.
- **Priorität:** Medium · **Umfang:** Medium

### V14 — Zuschauer reagieren (Weltanimation)
- **Problem:** Bewohner neben Kampf, Brand oder Hinrichtung tun nichts oder fliehen sofort.
- **Gameplay:** Hinschauen → zurückweichen → Tür zu/Stand zu (`stallShut`) → Wache rufen; nach dem Kampf kommen sie zurück und reden darüber.
- **Interaktion:** Verbrechen (Zeugen, `provoked`), Gerüchte, Wachen, Taschendiebstahl (§5g.23: abgelenkte Zuschauer sind leichter zu bestehlen).
- **Emergenz:** Ein Kampf auf dem Markt leert ihn für eine Stunde, Preise dort steigen kurz; ein Dieb nutzt die Menge.
- **Risiko:** KI-Kosten in Städten (BUG-108) — nur Figuren in 300 px, Prüfung alle 500 ms.
- **Umsetzung:** in `updateNpc` ein Zustand `watch` (Blick zum Kampf, `gesture('abwehren')`, Schritt zurück), Neue Gesten `jubeln`, `trauern`,
  `salut`, `knien` in `ANIM_DEFS.gesture` + `fig5 rigS/rigW`.
- **Tests:** Probe „Kampf 150 px neben Händler → Händler schaut hin, Stand nach 3 s zu, nach Kampfende wieder offen“.
- **Priorität:** Medium · **Umfang:** Medium

### V15 — Boss-Auftritte über das Regiebuch (schärft §5g.5)
- **Problem:** Eingeplant, aber ohne Form. Die Referenz (ANIMATION_REFERENZ §5) sagt: Zoom 400–600 ms, dann zurück — kein Letterbox-Film.
- **Gameplay:** Erster Sichtkontakt: kurze Namenskarte (Cinzel, unten), Boss-Beat (Varg: Ketten rasseln; Hrodvar: Eiskreis; Garmadon: Herzschlag;
  Dodon: Brüllen, Schlamm; Blutfürst: Kerzen verlöschen), Kamera 500 ms heran, dann Kampf. Jede Karte nur einmal je Haus (`S.flags.introSeen[mtype]`).
- **Interaktion:** V1 (Beats), V11 (Klang), Kodex (Eintrag „Gegner“ öffnet sich).
- **Emergenz:** Ein Erbe sieht den Auftritt erneut, wenn er den Boss noch nicht getroffen hat — der Vorgänger schon.
- **Risiko:** Auslösen im Kampf (Boss greift an, während Karte läuft) → Welt läuft weiter, nur Kamera/Karte; kein `cineGhost`.
- **Umsetzung:** leichte Variante `bossIntro(e)` ohne Teleport, nutzt `camAim`-Zoom über ein kurzes `S.cine`-ähnliches Feld `S.intro`.
- **Tests:** Probe „Intro einmal je Haus; kein Intro unter `_quiet`; Steuerung bleibt aktiv“.
- **Priorität:** Medium · **Umfang:** Small

### V16 — HUD nur bei Änderung neu zeichnen
- **Problem:** `renderContext` 1,8 ms + `refreshHUD` 0,6 ms alle 180 ms, `innerHTML` jedes Mal.
- **Gameplay:** — (Leistung in Städten, BUG-108).
- **Interaktion:** Koop (HUD eines Gastes).
- **Umsetzung:** Signatur je Block (Werte-String) merken, nur bei Abweichung schreiben; Porträt nur bei Ausrüstungswechsel.
- **Tests:** Probe „zweiter Aufruf ohne Änderung schreibt kein DOM“ (MutationObserver).
- **Priorität:** Low · **Umfang:** Small

### V17 — `drawProp` in eine Tabelle zerlegen
- **Problem:** 697-Zeilen-Switch mit 100 Fällen; parallele Agenten kollidieren, Fehler betreffen alle Props.
- **Umsetzung:** neue Datei `src/props.js` mit `PROP_PAINT = { tree(ctx, e) {…}, … }`; `drawPropPixel` ruft `PROP_PAINT[e.type]`. Mechanisch, Schritt für
  Schritt je 10 Typen; `propSprite` (Export für Sammelbilder) als Vergleich vorher/nachher (Pixelgleichheit).
- **Tests:** Probe „jedes Prop-Bild ist nach dem Umzug pixelgleich“ (Hash der ImageData je Typ und Variante).
- **Priorität:** Low · **Umfang:** Medium

---

## 10. Einordnung

**NOW** (sofort, klein, hohe Wirkung)
- V3 Geist-Partikel (Critical, Small)
- V6 Spielstand komprimiert (Critical, Medium) — Grundlage für mehrere Spielstände
- V4 Umgebungsklang je Region (High, Small)
- V5 Effekt-RNG und Partikeldeckel (High, Small)
- V7 LRU-Caches und Vorwärmen (High, Small)
- V9 Gespräche gruppiert, Zifferntasten (High, Small)

**NEXT**
- V1 Regiebuch (High, Medium) → danach V2 Goblinsturm/Morrgrund/Aufstand (High, Medium) und V15 Boss-Auftritte (§5g.5)
- V10 Menüs zusammenlegen (High, Medium), zusammen mit §5g.37
- V8 Heldentod als Moment (Medium, Small)
- V11 Klang-Busse und Signale (Medium, Small), vor §5g.16 Musik

**LATER**
- V12 Silhouetten nach Beruf und Rolle (Medium, Medium)
- V13 Fraktionsarchitektur über Form (Medium, Medium), zusammen mit §5g.35
- V14 Zuschauer reagieren (Medium, Medium), zusammen mit §5g.23 Taschendiebstahl
- V16 HUD-Diff, V17 `drawProp` zerlegen (Low)

**EXPERIMENTAL**
- **Erbfolge-Rückblick:** Nach der Erbenwahl eine 3–4-Shot-Fahrt über die Orte, die der Vorgänger verändert hat (aus `S.legacy.ancestors[].deeds`,
  Chronik-Orten, `S.resettle`, Gräbern). Nutzt V1; macht das Erbe sichtbar statt nur im Chronik-Fenster.
- **Nachrichten-Vignetten:** Große Weltereignisse fern vom Spieler (Stadt fällt, Karawane überfallen) optional als 2-s-Shot, wenn ein Späher/Bote
  die Nachricht bringt — nur mit Boten-NPC (sonst weiß der Held es nicht). Einstellung „Weltereignisse zeigen: aus/wichtige/alle“.

**CUT / MERGE**
- Stil F entfernen (inkl. immer geladenem Atlas-PNG); Stil D einfrieren; `STYLE_GUIDE.md` auf R.
- Charakter + Ausbildung + Talente + Zauberbuch + Effekte → „Held“; Chronik + Aufträge + Kodex → „Tagebuch“; Stall → Reiter in „Gruppe“ (V10).
- „Was gibt es Neues?“ + „Was hältst du von Omega?“ + „Ich hätte da eine Frage …“ → „Reden …“ (V9).
- `cineBars` und `coop-cine` → eine Textfunktion, eine Schrift.
- Partikeltyp `ghost` aufteilen in `afterimage` und `ghost` (V3).
