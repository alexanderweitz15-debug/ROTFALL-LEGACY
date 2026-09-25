# Changelog — Rotfall: Legacy

Neueste oben. Je Eintrag: was, warum, welche Bugs. Refactorings nennen den Grund (Master-Prompt §2, Punkte 1–4).

## Session 6 — 2026-09-25 · Spielstand, Karawane, Tiefhall

### Spielstand (state.js, world.js, game.js) — BUG-017, BUG-057, BUG-058
- Props tragen `gk` (Typ@Kachel); `setPropBase` hält den Grundzustand nach jeder Generierung fest; `saveData` schreibt
  nur Abweichungen und `propsGone`, Zahlen auf 2 Nachkommastellen; `mergeProps`/`adoptPropKeys` beim Laden.
  1,43 → 0,53 MB. Speichern 28 → 38 ms (Signaturvergleich), Speichern ist ereignisgesteuert.
- continueGame fasst Props nicht mehr an (act/hexed/rooted) — sonst wich jedes Prop nach dem Laden ab.

### Karawane (sim.js, game.js, render.js, ui.js) — BUG-011, BUG-061
- Zug aus Leitwagen (Kutscher, zwei Ochsen, Plane) und Beiwagen (Maultier, sichtbare Ladung) auf der Spur des
  Leitwagens; Maßstab 1,5. Zwei Karawanenwachen (`escort`, `slot`), Rast am Tor, Hinterhalt nach Wachenzahl.
- **Refactoring nach §2, Punkt 2** (Duplikation): `guardChar` aus `spawnGuardPosts` gelöst — zweiter Nutzer.
- Route per Dijkstra aus der Straße (`buildRoute`) statt fester Wegpunkte.

### Tiefhall (world.js, game.js, render.js, ui.js, data.js, sprites.js, state.js) — BUG-009, BUG-060
- **Refactoring nach §2, Punkt 1** (blockierte die Erweiterung): `DUNGEONS`/`MAP_KEYS` statt ~25 fester 'mine'-Stellen.
- `genDeep`, Thron-Objekt, Säulen neu gezeichnet, Hrodvar (Boss) mit Beute, Spawngebiete, Migration deep1,
  Ankunft vor dem benutzten Eingang.

### Tiefhall eingebunden (game.js, data.js, render.js) — BUG-064, BUG-065
- Brann (Nordfurt), Quest Königseisen, Frostklinge; `reward.item`/`reward.take`; `startQuest` zählt Erledigtes.
- Hrodvar: `frostKingAI` (Eiskreis, Durchfroren, Leibwache); Thron neu gezeichnet.

### Titelklasse Mönch (data.js, game.js, sprites.js, style.css)
- `TITLE_CLASSES.monk`, drei Fähigkeiten, Zweig Stille Hand, Ilva + Quest in Sonnwacht, `evaded()` als eine Stelle für
  „im letzten Moment ausgewichen“ (Nahkampf, Geschosse, Eiskreis, Bodenbeben), Sprint über `p.dodge.dist/dur/dash`.
- Nekromant/Hexenmeister schließen den Mönch aus (beidseitig, Selbsttest prüft die Symmetrie).

### Grenzöde (world.js, game.js, data.js) — BUG-051
- `borderScenes` (Hash, kein rnd), Orte Grenzwacht/Hundertfeld, Oda + Warenpool, Wachposten, Quest `q_frontier`,
  Spawngebiet, Migration border1, Selbsttest.

### Kleinkram
- Leichen: Alter nie negativ (BUG-059).

## Session 5 — 2026-09-25 · Größere Welt, Skill-Baum, Druide, Totenreich

Nutzerwunsch: Weltkarte größer (mehr Häuser, mehr Abstand), Diener folgen, Skill-Baum mit allgemeinen Knoten und eigenen
Zweigen der Titelklassen, höchstens 2 Klassen je Figur, Totenreich erweitern. Fünf Commits, je Thema einer.

### Weltmaßstab (world.js, game.js, sim.js, state.js)
- **Refactoring nach §2, Punkt 1** (blockiert die geforderte Erweiterung): ~300 feste Koordinaten der Generierung stehen
  im 512er-Maßstab. Statt sie umzuschreiben: `resampleWorld` rechnet die fertige Entwurfswelt auf 768×768 hoch, Städte
  werden danach im Weltmaßstab gebaut (`sp`: Anker × WS, Streckung wie geplant). `phase` trennt Entwurf und Laufzeit
  (`regionAt`, `seaLine`, `naturalAt` rechnen Weltkacheln auf den Entwurf zurück).
- `worldPt`/`wT`/`dT`; `townPt` bleibt als Alias. SPAWN_AREAS, Ankunft an der Grube, Lila, Startgebiet, Karawanen-
  Hinterhalt laufen über den Maßstab. `grow`-Einträge mit `s0` umgerechnet; neue `outskirts` (Randhäuser nach Regeln).
- Spielstand v3: `rescaleSave` — Props neu (Truhenzustand über Typ+Etikett+Nähe), Figuren/Gegner/Gräber/Gegenstände/
  Karawanen/Lager ×1,5, Bewohner neu, Wachen auf neue Posten, wer in Mauer stünde, tritt heraus.
- Messung (headless, 300 Frames): Update Eren 1,2 → 1,7 ms, Nordfurt 0,9 → 1,3 ms (Budget 3,0); Spielstand 1,1 → 1,4 MB.

### Diener (game.js)
- travel(): Diener gehen wie Gruppenmitglieder mit durch jeden Eingang.

### Skill-Baum (data.js, game.js, ui.js, style.css)
- `SKILL_TREE`/`SKILL_BRANCHES`, `treeFx`/`node`/`nodeState`/`learnNode`; Wirkung in recalc, damageOf, armorOf, speedOf,
  hit (Krit), hurt (Berserker, Zweiter Atem), Regeneration, Heilgegenständen, Ausweichen, Abklingzeiten, Zauber- und
  Titelzauberschaden, Titelknoten (Dienerzahl/-dauer/-leben, Essenzgrenze, Fluch, Chaosblitz, Entfesseln, Blutpakt,
  Ranken, Geisterwolf, Erdsegen, Hüter des Hains). Fenster „Talente“ (T, auch im Menü), Talente im Charakterbogen.
- Stufenaufstieg vergibt 1 Talentpunkt; mehrere Stufen auf einmal werden jetzt vergeben (BUG-054).

### Druide, Obergrenze (data.js, game.js, world.js, ui.js)
- Titelklasse Druide (Wildkraft, Rankenfessel, Geisterwolf, Erdsegen, Waldgänger, Metall erstickt, Stärke −1),
  Quest „Der Ruf des Hains“, Mira, Alter Hain im Westwald (`groveScene`). `MAX_TITLES = 2`, Titelwechsel nicht im Kampf.

### Totenreich (world.js, game.js, data.js, buildings.js, render.js)
- Zwei Aschland-Zentren; `deadScenes` (Knochenwald, Aschensee, Seelenbrunnen); Stadtplan Vharnholm (Stil blackstone/
  bone, untote Bewohner `DEAD_TRADES`, Stille Wächter), Sael mit eigenem Warenpool (`npc.pool`, Orte ohne Markt),
  Quest „Grabräuber in der Asche“, Seelenphiole (`use:'soul'`), Seelenbrunnen (`rite:'soulwell'`), Spawngebiete.
- Gleiche Fraktion bekämpft sich nicht (isHostile, Bedrohungssuche) — BUG-055.
- Tote Bäume neu gezeichnet (BUG-056). `planned`-Props im Stadtplan sind keine Wildnis-Streu.

### Tests
- Selbsttest 54 → 60: Weltmaßstab/Erreichbarkeit, Diener durch Eingänge, Skill-Baum-Daten, Skill-Baum-Wirkung, Druide +
  Obergrenze, Totenreich (Fraktionsfrieden, Brunnen, Phiole). Gegenproben für Diener und Fraktionsregel. Grün auf 5 Seeds
  und auf zwei alten v2-Ständen. Druiden- und Nekromanten-Kette über die Oberfläche durchgespielt.

## Session 4 — 2026-09-25 · Siedlungsdichte (§75) und Titelklassen (§32/§78)

Nutzerwunsch: „Klassen, die man später freischalten kann, wie Titel mit besonderen Fähigkeiten“ — Ressourcen und
Fähigkeiten dieser Titelklassen neu strukturieren; Menschen und Häuser deutlich weiter auseinander, Einwohner je nach Größe.

### Siedlungen (world.js, game.js, sim.js, ui.js)
- Streckung je Stadt (`spread`, `spreadHouse`, `townPt`): Entwurfskoordinaten bleiben, Abstände wachsen um 1,2–1,5,
  Häuser an der Türseite verankert. Fläche aller Siedlungen 10 651 → 19 322 Kacheln; Mindestabstand 0–1 → 2 Kacheln.
- **Refactoring nach §2, Punkt 1** (blockiert die geforderte Erweiterung): Der alte Stadtkern war in `genWorld` fest
  verdrahtet und ließ sich nicht verschieben, ohne die Zufallsfolge (und damit alte Welten) zu ändern. Er bleibt dort
  (Zufallsfolge stabil) und zieht in `expandTowns` um: Häuser/Möbel ab, Boden zurück zur Natur, Kern-Props wandern mit
  ihrem Haus (`attachedPt`), Häuser neu an gestreckter Stelle (id und Aussehen aus dem Entwurf: `meta.id`, `hx/hy`).
- Anschluss: abgehängte Straßenstücke per Breitensuche ans Stadtnetz; Trampelpfad von jeder Tür; Props auf Türachsen
  rücken zur Seite; Hauptstraßen mindestens 3 Kacheln breit.
- Nordfurt: Flächenpflaster entfernt (Markt gepflastert, Höfe, Gemüsebeete), +7 Häuser (`grow`, Weltkoordinaten);
  Aschfurt +3 Häuser. Siedlungen übernehmen die Region ihres Ankers (Nordfurt lag halb im Gebirgsbiom).
- Einwohner nach Fläche (`perHead`, `residentPlan`, `HOUSE_CAP`); Tagesziele verteilt (Platz, Nachbarn, eigenes Haus)
  statt 5×3 Kacheln; Anzeige „Einwohner“ zählt echte Köpfe, jetzt in allen Städten (`townHeads`).
- Entfernt: `spawnVillagers` (9 hauslose Zusatzdörfler in Eren, stammten aus der Zeit vor den Bewohnern — trieben die
  Dichte hoch, ohne Zuhause).
- Feste Koordinaten (Wachposten, Arbeitsplätze, Karawanenroute, Startpunkt, Erbe-Ankunft) laufen durch `townPt`;
  Karawanen-Hinterhalt von x 92 (jetzt im Dorf) nach x 101; Route auf Brücke und Torstraße (der alte Endpunkt läge in
  einem neuen Nordfurter Haus — Karawanen fahren ohne Kollision).
- Migration `flags.gen4`: Stadt-Props und Bewohner neu, Truhen behalten ihren Inhalt (über Typ + Etikett), Wachen
  beziehen die neuen Posten, wer in einer Mauer stünde, tritt heraus. Getestet mit einem Stand des alten Codes.
- Performance (headless, 300 Frames): Update Nordfurt 0,7 → 0,9 ms, Eren 1,2 → 1,2 ms; Zeichnen unverändert.

### Titelklassen (data.js, game.js, ui.js, sprites.js, world.js, style.css)
- `TITLE_CLASSES` (Nekromant, Hexenmeister): eigene Ressource mit Regel, 3 Fähigkeiten, Passiv, Makel, Paktpreis,
  Ruf, Merkmal, Ausschluss. Titelfähigkeiten in `ABILITIES` mit `title`/`cost`/`gain` statt Mana/Ausdauer.
- Spiel: `unlockTitle`, `setTitleClass`, `tres/setTres`, `corrupt`, `titleTick`, `titleOnDeath`, `titleAbility`;
  Diener (`servant`, Team Spieler, folgen, zerfallen nach 60 s, flüchtig), Fluch (`hexed`: +25 % Schaden, −30 %
  Tempo), Knochenschild (Status mit `absorb`), Makel im Treffer- und Heilcode, Paktkosten in `recalc`.
- Questkette „Der Pakt der Stillen Schar“: Morvath → Ysra (Alt-Vharn) → Ahnenurne aus der Nekropole (Wächter oder,
  als Mitglied der Schar, freier Zugang) → Ysra (Nekromant) oder Vhal (Hexenmeister) → Ritual. Neue Figuren Ysra, Vhal;
  neuer Gegner „Wächter der Nekropole“ (Sprite: Plattenpanzer, Großhelm, Grünlicht); Ortsszenen `pactScenes`.
- Folgen: Orden verweigert Gespräche, Ordenswachen greifen ab Ruf −25 an, Stadtbewohner grüßen anders.
- Hexenmeister aus dem Klassenbaum entfernt (war Lehrklasse bei Morvath). Migration alter Stände: → Magier + Titel.
- Oberfläche: Ressourcenleiste im HUD (Essenz grün, Verderbnis violett), Titelfähigkeiten farbig in der Leiste,
  Titelblock im Charakterbogen (Ressource, Passiv, Makel, Preis), Titel tragen/ablegen im Ausbildungsfenster.

### Tests
- Selbsttest 46 → 54: Siedlungsabstand/-bebauung, Einwohner nach Fläche, Karawanenroute frei, Titelklassen-Daten, Nekromant, Hexenmeister,
  Pakt-Kette (Kampf/Überzeugung), Ordensreaktion. Gegenprobe: je ein Mechanismus ausgebaut → der zugehörige Test fällt.
- Zufallsabhängiger Kampftest deterministisch gemacht (BUG-049). Grün auf 8 Seeds und auf einem migrierten alten Stand.
- Durchgespielt über die Oberfläche (E, Dialogknöpfe, Tasten 1–3): beide Pfade bis zur Titelklasse.

## Session 3 — 2026-09-25 · Phase 5: Visual Style Revision, Phase 15: Tagesablauf benannter Figuren

### Phase 6 — Kampfgefühl & Animation
- Taumeln (BUG-043): das Datenfeld `stagger` (Streitkolben) war ohne Wirkung, nur der Boss konnte taumeln. Jetzt je
  Waffenklasse (`FEEL.stag`, Kolben aus seinem Datenwert): Schwert ~90 ms, Axt ~180, Kolben/Zweihänder ~250 ms ohne
  KI-Entscheidung; ab Axt unterbricht ein Treffer die Angriffsansage („Unterbrochen“). Dolch/Bogen lassen nicht taumeln
  (Dolch schlägt alle 300 ms — sonst Dauerlähmung). Spieler und Gefährten taumeln nie (Steuerung bleibt direkt).
  Kampfsimulation 6×5 Duelle gegen Banditen: Gegner 8–14 % der Zeit taumelnd, keine Dauerlähmung.
- Rückstoß rutscht (~140 ms, abklingend) statt in einem Frame zu springen; Stärke nach Waffengewicht.
- Interaktionen mit Körpersprache (§26): Durchsuchen/Sammeln/Grab = knien, Holz/Stein/Erz = zwei Arbeitshiebe mit der
  Waffe, Beten = längeres Knien, Aufstehen nach dem Niederschlag = Knie → wankend. Rein sichtbar, blockiert nichts;
  Laufen oder Angreifen bricht die Pose sofort ab. Bild `anim-nachher-interaktion.png`.
- Treffer-Klang nach Waffenmaterial (sfx.js): Klinge (Zisch), Wucht (tiefer Schlag + Knacken), Stich (kurz, trocken),
  Metall am Ziel (Soldat, Goblin-Krieger, Gorak, gepanzerter Spieler) scheppert zusätzlich; eigener Klang fürs
  Unterbrechen. Vorher klangen alle Waffen gleich (nur Tonhöhe nach Gewicht). Nur synthetisch geprüft (fehlerfrei),
  nicht angehört — bitte beim Spielen gegenhören.
- Selbsttest 44 → 46 (Taumeln/Rückstoß, Interaktionsposen).

### Mobil (BUG-012)
- Touch-Steuerung (`bindTouch`, `touchAim`, `#touchui`): Stick, Hieb/Rolle/E im Stil der Paneele; Auto-Zielen.
  `setPointerCapture` abgesichert (ein Fehler dort hätte die Eingabe verschluckt).
- Menüleiste: „Aufträge“ und „Optionen“ ergänzt — ohne Tastatur waren sie unerreichbar.

### Figuren mit Namen (game.js `NPC_DAY`, `assignNpcDays`)
- Arbeitsplatz, Feierabend (`till`), Abendort und Zuhause je Figur, an echte Häuser gebunden; freie Innenkacheln je Haus
  (niemand stapelt sich). Läuft bei Neustart und bei jedem Laden (alte Stände bekommen es automatisch).
- `think()`: Feierabend je Figur statt fest 18 Uhr; drinnen kleine Schritte (`in`-Ziele), draußen normale Streuung.
- Läden: nach Feierabend „Der Laden ist zu. Komm morgen früh wieder.“
- Selbsttest: „Figuren mit Namen: Nachtplatz im eigenen Haus …“ (44/44).


### Fels & Gelände (render.js `paintRock`, sprites.js `scree`)
- Fels wird als Masse gemalt statt als Kachelblock (BUG-035): weiches Feld aus bilinearer Kachelbelegung + Rauschen →
  runde Ecken, ausgefranste Kanten, Einzelkacheln werden Findlinge. Kuppe mit Relief (Licht links oben), Risse,
  Südwand mit Schichtung, Schlagschatten, Geröll am Fuß. Gestein je Region (Sandstein Wüste, Granit + Schneefelder im
  Gebirge, Basalt Ödland …). Kollision unverändert (Kacheln), keine Welt-/Speicheränderung.
- Performance: Rauschgitter je Chunk vorab gehasht, Fels auf eigener Ebene statt Rücklesen des Chunks, Chunks am
  Sichtrand werden vorab gebacken (höchstens einer pro Frame) — Laufen durchs Gebirge ohne Backruckler.
- Losen Felsbrocken (`rock_node`/`ore_node`): 3 Formvarianten mit Facetten, Regionsgestein, Schnee/Moos, Erzader,
  abgebaut = Schutthaufen (war ein einfarbiges Vieleck — Platzhalter nach §22).
- Hochgebirge: Boden (STONE) außerhalb von Siedlungen als Geröll statt als Straßenpflaster.
- Wasser mit demselben weichen Feld (`softField`, aus `paintRock` herausgelöst — kein Refactoring im Sinne §2, nur
  gemeinsame Nutzung): runde Ufer statt Kachelquadrate, Tiefe mit Dithering, Schaumkante, nasser Ufersaum,
  Schilf, Seerosen im Sumpf, Palette je Region und eigene Palette für die Südsee. Die alte Uferstrich-Kante entfällt;
  Wellenlinien nur noch im offenen Wasser.
- Boden pro Pixel (`bakeGround`): Grenzen natürlicher Böden (Gras, Erde, Weg, Sumpf, Sand, Asche) werden je Pixel
  aus den vier Kachelmitten + Rauschen entschieden → ausgefranste, runde Übergänge statt Kachelkanten; Graskante mit
  Halmlicht. Helligkeit (Wiese/Senke) und Regionstönung als 1-Pixel-je-Kachel-Bild weich hochskaliert — das
  Kachel-Schachbrett im Gras ist weg. Pflaster, Dielen, Acker, Mauern bleiben hart. Die alte Fransen-Logik (`FRAY`)
  entfällt (ersetzt, nicht umgebaut: sie arbeitete nur entlang gerader Kachelkanten).
- Vorausbacken der Chunks am Sichtrand in der Leerlaufzeit (`requestIdleCallback`) statt im Frame.
- Grube: Höhlenwände (DWALL) mit dem Fels-Zeichner als Höhlenfels (eigene Palette, Wand nach Süden, Schatten),
  Minenboden als Geröll statt Pflaster — die Grube war ein Raster aus Ziegelstreifen (BUG-042).
- Mauern mit Höhe (`paintWalls`): Quaderfront nach Süden, Kantenlicht, Zinnen an offenen Seiten freistehender
  Mauern (Hauswände ohne Zinnen) — Stadtmauern sahen wie Pflaster aus (BUG-041).
- Titelbild (BUG-016) als Pixel-Szene statt Vektorflächen; Himmel/Feste als gecachte Ebenen, animiert nur Wolken,
  Fenster, Banner, Feuer, Funken, Gras.
- §25 Stil-Testbereich: `RF.styleArea()` (nur `?dev`), Spiel pausiert dort; `save()` speichert nie auf Testkarten
  (`__…`), damit ein Autosave dort keinen kaputten Stand erzeugt.

## Session 2 — 2026-09-25 · Dächer & Städteausbau

### Gebäude (buildings.js)
- Dächer: Giebel nach vorn statt Walm-/Traufplatte (BUG-028). Kein Refactoring im Sinne §2 — Neuzeichnung des
  Dach-Abschnitts, Schnittstellen (`houseSprite`, `houseDims`, `chimneyOf`) unverändert; neu `gableOf`.
- Moos/Nässe als unregelmäßige Flecken statt Rechtecke.
- 7 neue Gebäudetypen mit eigener Silhouette/Funktion: Kate (geflicktes Dach), Bürgerhaus (zwei Geschosse),
  Bäckerei (Backofen, Brotschild), Scheune (Scheunentor mit Z-Streben, Heuluke, Heu), Stall (Stalltüren), Lagerhaus
  (Ladeluke, Ladebalken mit Seil und Sack), Fischerhütte (Netze). Je Typ Innenausstattung (`FURNISH`).
- Farbvariation je Haus aus der Materialfamilie (`ROOF_VAR`/`WALL_VAR`) — Nachbarn sind keine Klone (§20).

### Verfall & Stilvarianten (Nutzerwunsch „dystopisch, teils zerstört“)
- `wearOf(b)`: 0 gepflegt, 1 heruntergekommen (Risse, abgeplatzter Putz, vernageltes Fenster, fehlende Dachdeckung),
  2 verlassen (eingebrochenes Dach mit offenen Sparren, Ruß über den Fenstern, vernagelte Tür, eingestürzter Schornstein,
  Schutt, Ranken). Anteil je Ort (Aschfurt/Kreuzweg am stärksten, Sonnwacht kaum); Betriebe verfallen nie ganz.
  Einzelne Ruinen bewusst gesetzt (ausgebrannte Kate in Aschfurt, Speicher am Salzhafener Kai, Kate in Kreuzweg).
- Folgen im Spiel: verlassene Häuser ohne Bewohner, ohne Licht und Rauch; innen Schutt statt Möbel.
- Stil je Haus: Dachneigung variiert, Dachgauben, Vordächer über Türen, Bruchsteinsockel unter Holz/Fachwerk/Putz.

### Siedlungen (world.js `TOWN_PLAN`, `expandTowns`, `townAt`)
- Alle 6 Siedlungen ausgebaut: 23 → 104 Gebäude. Eren (Dorf, Felder, Scheunen), Nordfurt (ummauerte Stadt, 4 Tore,
  Markt), Salzhafen (bis zur Küste, Kai, Stege, Boote), Kreuzweg (vier Viertel, Marktplatz, Stall), Aschfurt (Vorstadt
  hinter Palisaden, Karawanenhof, Nord-/Westtor), Sonnwacht (Komturei in der Feste, Unterstadt).
- Ausbau läuft am Ende von `genWorld` ohne `rnd()` → Zufallsfolge der restlichen Welt unverändert (BUG-027 bleibt gelöst).
- Aufräumen: Wildnis-Streugut raus, Felsen im Festungskern repariert (BUG-033/034). `locAt` kennt die Stadtflächen.
- Neue Props: Heuballen, Fischerboot, Netzgestell, Wäscheleine, Tränke, Laterne (leuchtet nachts); Palisade als
  angespitzte Stämme statt Zaun. Scheunen/Ställe ohne Fenster werfen nachts kein Fensterlicht.

### Leben (game.js)
- `spawnResidents`: ~100 Bewohner mit Beruf, Begrüßung, Tagesablauf (BUG-008, BUG-013 teilweise); Ortsgerüchte je Stadt.
- Wachposten an die neuen Tore verlegt, 17 → 25 Wachen; `spawnGuardPosts` idempotent (verlegt vorhandene Wachen).
- Gegner-Spawns nie in Siedlungen (+4 Kacheln Rand) (BUG-032).
- Migration `flags.gen3`: alte Spielstände übernehmen neue Viertel, Figuren in Mauern treten heraus, Wachen ziehen um,
  Bewohner ziehen ein, ruhende Gegner in Städten verschwinden. Mit einem echten Spielstand geprüft.
- `newGame({ seed })` optional (reproduzierbare Tests).
- Selbsttest 37 → 41: Türen erreichbar, keine Wildnis-Streu, Bewohner wohnen im eigenen Haus, keine Gegner in Städten.

## Session 1 — 2026-09-24 · Phasen 0–3

### Phase 0 — Durchspielen & Audit
- `docs/` angelegt: BUGS, GDD, CHANGELOG, SESSION_LOG, PHASE_STATUS, STYLE_GUIDE, DATA_SCHEMAS.
- Entwicklerzugang `?dev` → `window.RF` (Zustand, `tick(ms)` für Simulation bei verstecktem Tab, Kernfunktionen).
  Grund: KI- und Übergangsfälle lassen sich sonst nicht reproduzierbar im Browser testen.

### Phase 1 — Kritische Fehler
- **Tod/Boden terminal** (BUG-001): neuer einziger KI-Einstieg `think(e, dt)`; `downed()`/`die()` räumen Kampfzustand
  auf; kein Resthieb am Boden. Refactoring-Grund: Punkt 2 (gleiche Fehlerart in drei Zweigen von `updateNpc`) —
  eine Sperre an der gemeinsamen Stelle statt drei Einzel-Flicken.
- **Aufhelfen nur durch Nicht-Feinde** (BUG-002), **Gnadenstoß** auf gestürzte Feinde (BUG-019), Pfeile fliegen über Liegende.
- **Zorn mit Leine** (BUG-004): Spur verloren (12 Spielmin.) / Leine 640 px / Spieler überwältigt → Buße 30 Gold statt Tod.
- **Szenenübergänge** (BUG-003): `MONSTERS.interiors`; Verfolger folgen durch die Tür nach Laufzeit, Tiere lauern
  90 Spielmin., Gorak hält seine Halle. Fristen auf der Spieluhr `clock()` (Außenwelt ruht, solange man innen ist).
  Feste Ankunftspunkte (BUG-015).
- **Erbe mit eigener Habe** (BUG-005): `kinKit()`.
- Charaktererstellung: deutsche Fertigkeitsnamen (`SKILL_NAMES` in data.js, BUG-014).
- `solidPropAt` robust für Karten ohne Objekt-Index.
- `log`/`chronicle` schweigen im Selbsttest-Sandkasten (`S._quiet`).

### Phase 2 — Weltlogik & NPC-Reaktionen
- Wachen alarmieren Wachen (480 px), eilen aus 700 px herbei; Wachen/Verteidiger/Heilerin richten den bewusstlosen
  Spieler auf; Zivilisten holen die nächste Wache (einer genügt).
- Händler schließen den Stand bei Kampf in der Nähe; nach Angriff bis morgen (BUG-020).
- Gegner-Gruppen: Gleiche derselben Fraktion < 240 px übernehmen das Ziel (Rudel/Bande).
- Bluttat (`bloodshed`): Zeugen meiden den Spieler 1 Tag, Wachen werden zornig (bei Unschuldigen), Gruppe −10 Moral.
- Provokation: Gruppe kommentiert, −5 Moral.
- Dialog-Sperren für Zornige/Fliehende/Kämpfende, kalter Ton bei schlechter Beziehung (BUG-021).
- Rollen: Verteidiger (Borin, Kelan, Aldric, Tomas; Leine 360 px, Schützen halten Abstand), Heilerin kämpft nie (BUG-022).
- Wachposten je Siedlung (18 Wachen; Valen/Söldner/Orden mit eigener Ausrüstung und Farbe, neue Sprite-Berufe
  Torwache/Söldnerwache/Ordenswache), Nachrüstung alter Spielstände (BUG-023).

### Phase 3 — Übergänge, Wegfindung, Spawns
- `seek()` + `findPath()` (A* auf Kacheln, gecacht) für alle Verfolgungs-, Hilfe- und Wanderbewegungen (BUG-010).
- Spawns nie in festen Objekten; Eingeklemmte kommen frei (BUG-024).
- Reise-Begegnungen erscheinen knapp außerhalb des Bildes; Ruhezeit je Region (Heimat 40 s, Wildnis 26 s,
  Ödland 20 s, Totenreich 14 s).
- Gruppe greift den nächsten statt den ersten Feind der Liste an.

### Phase 4 — Gebäude & Props
- Neues Modul `src/buildings.js` (Refactoring-Grund: Punkt 1 — Gebäude existierten nur als Kacheln; Funktion,
  Material und Innenraum ließen sich ohne Datensatz nicht ausdrücken). Pixel-Art im bestehenden Rampen-/Kontursystem.
- `house()` in world.js legt einen `HOUSES`-Datensatz an (Typ, Stadt, Tür) und möbliert nach Funktion (`FURNISH`).
  21 Gebäude typisiert: Taverne, Schmiede, Heilerhaus, Vorsteherhaus, Kontor, Wachhaus, Kapelle, Söldnerhalle, Wohnhaus.
- Bauweise je Stadt: Eren Stroh/Fachwerk · Nordfurt Schindel/Stein · Salzhafen Ziegel/Putz · Kreuzweg Schindel/Holz ·
  Aschfurt Schiefer/Stein · Sonnwacht Schiefer/heller Stein. Banner je Herrschaft (Valen/Orden/Händler).
- Renderer: Gebäude y-sortiert an der Grundlinie, Dach blendet beim Betreten aus, Schornsteinrauch, nachts Fensterlicht
  auf der Straße; Hinweis beim Betreten („Taverne · Eren“). `sprites.js` exportiert `G`/`toCanvas`.
- Neue Props: Tisch, Bank, Bett, Etagenbett, Regal, Herdfeuer, Esse (flackern, leuchten), Theke, Schreibpult, Werkbank,
  Fassgestell, Waffenständer, Altar, Sack, Kistenstapel; Kiste/Fass je 3 Varianten, Truhe/Kiste offen/geschlossen.
- Städte: Warenstapel statt Zufallskisten; Schilder/Amboss nicht mehr vor Türen. Wildnis: Truhen als Mini-Szenen.
- Alte Spielstände: Siedlungs-Props einmalig neu ausgestattet (`flags.gen2`), Zufallsfolge der Generierung bleibt
  identisch (BUG-027), Salzhafen ohne Sumpflöcher (BUG-025).

### Performance
- Kämpferliste je Frame auf den Umkreis des Spielers (1700 px) begrenzt: Eren-Update 3,2 → 2,2 ms, Wald 4,3 → 2,4 ms.
- Lichtquellen je Karte gecacht (statt ~6500 Objekte pro Bild): Eren-Zeichnen 2,9 → 1,8 ms.
- `moveEnt` prüft „stecke ich fest?“ nur bei Blockade.

### Tests
Selbsttest 22 → 37 Prüfungen (alle bestanden, 10–15 Wiederholungen stabil). Gegenprobe: Mit wieder eingebautem
BUG-001 bzw. BUG-002 schlagen die jeweiligen Tests fehl.
