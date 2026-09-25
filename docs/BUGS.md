# Bug Ledger — Rotfall: Legacy

Format je Eintrag: ID · Problem · Reproduzierbar · Schritte · Erwartet · Tatsächlich · Kategorie · Priorität ·
Vermutete Ursache · Betroffene Systeme · Lösung · Test (Regression) · Status (OFFEN / IN ARBEIT / BEHOBEN / VERIFIZIERT).

Werkzeug für Reproduktionen: `index.html?dev` stellt `window.RF` bereit (Zustand `RF.S`, `RF.tick(ms)` simuliert
auch bei verstecktem Tab, dazu `spawnEnemy`, `provoke`, `hurt`, `travel` …). `?test` startet den Selbsttest.

Quelle Session 1: Phase-0-Durchspielen (neues Spiel „Ehemaliger Soldat“, Tod, Erbe, Speichern/Laden, Mobil),
dazu Code-Lesen der KI-, Übergangs- und Weltgenerierungspfade.

---

## CRITICAL

### BUG-001 — Niedergestreckter NPC verfolgt den Spieler weiter („Leiche verfolgt“)
- Reproduzierbar: JA
- Schritte: Strg+Angriff auf Wache (Havel) → Wache wird zornig → Rumpf auf 0 → Spieler 120 px entfernt → 1,5 s warten.
- Erwartet: Am Boden = kampfunfähig. Keine Bewegung, keine Zielsuche, keine Angriffe.
- Tatsächlich: Die liegende Figur rutscht 16 px auf den Spieler zu (Pose „am Boden“, bewegt sich trotzdem).
- Kategorie: AI · Priorität: CRITICAL
- Ursache: `updateNpc` prüft nur `alive`, nicht `downed`; Zorn-, Bedrohungs- und Fluchtzweig rufen `moveEnt` auch am Boden.
- Betroffene Systeme: NPC-KI, Provokation, Körpersystem.
- Lösung: Zentrale Sperre im Update-Dispatcher — `downed` oder `!alive` → keine KI, Bewegung/Schwung/Ansage genullt.
  `downed()` räumt beim Fallen Kampfzustand auf (Schwung, Ansage, Ziel, Wanderziel). Siehe CHANGELOG Session 1.
- Test: Selbsttest „Tod/Boden ist terminal für die KI“.
- Status: VERIFIZIERT

## HIGH

### BUG-002 — Spieler „stabilisiert“ automatisch den Feind, den er gerade niedergestreckt hat
- Reproduzierbar: JA
- Schritte: wie BUG-001, dann neben die liegende zornige Wache stellen.
- Erwartet: Nur Verbündete helfen Gestürzten auf. Wer mich eben töten wollte, bleibt liegen.
- Tatsächlich: `downed=false`, `angry=true` — die Wache steht auf und schlägt sofort wieder zu (Spieler 136 → 128 LP).
- Kategorie: WORLD LOGIC / AI · Priorität: HIGH
- Ursache: `tickCombatant` wählt als Helfer jeden Spieler/Gefährten < 40 px, ohne Feindschaft zu prüfen.
- Lösung: Helfer muss nicht feindlich zum Gestürzten sein (`!isHostile(helper, c)` und nicht zornig).
- Test: Selbsttest „Feind wird nicht vom Spieler aufgerichtet“.
- Status: VERIFIZIERT

### BUG-003 — Verfolgung endet beim Betreten der Grube (Szenenübergang)
- Reproduzierbar: JA
- Schritte: Bandit + Wolf mit Aggro am Grubeneingang → Grube betreten → 5 s warten → zurück.
- Erwartet: Bewusst definiertes Verhalten je Gegnertyp (folgen / am Eingang lauern / aufgeben mit Grund).
- Tatsächlich: Niemand folgt. Die Außenwelt friert komplett ein; Überfall-Gegner (`encounter`) werden sogar
  gelöscht, solange der Spieler unten ist. Wer bleibt, steht bei Rückkehr exakt am alten Fleck (Variante „D“).
- Kategorie: SZENENÜBERGANG · Priorität: HIGH (Exploit: jede Tür wäre ein Fluchtpunkt)
- Ursache: Nur `S.ents[S.map]` wird simuliert; `travel()` behandelt Verfolgerzustand gar nicht; `respawnTick`
  räumt `encounter`-Gegner ab, sobald `p.map !== 'world'`.
- Lösung: `canEnterInteriors` je Gegnertyp (data.js). Verfolger folgen mit Laufzeitverzögerung, Tiere lauern am
  Eingang (Spieluhr-Frist), danach misstrauisch zurück. Gorak verlässt seine Grube nicht. Siehe GDD §Übergänge.
- Test: Selbsttest „Verfolger folgen in die Grube, Wolf lauert“ + Browser-Szenario (`RF.travel`).
- Status: VERIFIZIERT

### BUG-004 — Zornige NPCs beruhigen sich nie und jagen über die ganze Karte
- Reproduzierbar: JA
- Schritte: Wache provozieren (Zeugen werden ebenfalls zornig) → weggehen.
- Erwartet: Verfolgung mit Grenze; Rückkehr auf den Posten; Konsequenz statt endloser Jagd.
- Tatsächlich: „Enthauptet durch Hilde“ — eine Zeugin verfolgte den Spieler bis in den Eren-Wald und tötete ihn.
  Zorn endet nur mit dem Tod des Spielers.
- Kategorie: AI / FACTION · Priorität: HIGH
- Ursache: `angry` hat keine Abbruchbedingung und keine Leine; auch ein am Boden liegender Spieler wird weiter angegriffen.
- Lösung: Leine (Abstand zum Posten) + Sichtverlust-Frist → „gibt auf“, kehrt zurück, bleibt misstrauisch.
  Spieler am Boden → Wache beendet den Kampf und verlangt eine Buße (einfaches Verbrechen→Konsequenz).
- Test: Selbsttest „Zorn hat eine Leine“.
- Status: VERIFIZIERT

### BUG-005 — Erbe startet ohne Waffe und ohne Inventar
- Reproduzierbar: JA
- Schritte: Charakter sterben lassen → Erbe wählen (z. B. „Base … · Schütze“).
- Erwartet: Verwandte bringen eigene, einfache Habe mit (Schütze: Bogen). Die Habe des Toten liegt am Grab.
- Tatsächlich: `equip` leer, Inventar leer; Hotbar zeigt Gegenstände des Toten mit Anzahl 0; Fähigkeit „Gezielter
  Schuss“ ohne Bogen nutzlos.
- Kategorie: GAMEPLAY · Priorität: HIGH
- Ursache: `makeSuccessorCandidates` erzeugt Verwandte ohne Ausrüstung; `syncHotbar` übernimmt veraltete Einträge.
- Lösung: Verwandte erhalten ein bescheidenes Klassen-Bündel (Waffe, Kittel, Brot, Verband); Hotbar neu aufgebaut.
- Test: Selbsttest „Erbe bringt eigene Habe mit“.
- Status: VERIFIZIERT

### BUG-006 — Gebäude sind dachlose Mauerrechtecke ohne erkennbare Funktion
- Reproduzierbar: JA (jede Siedlung)
- Erwartet: Dach mit Material, funktionsspezifische Außendetails, Tür/Fenster, Silhouetten-Variation (Master-Prompt §20).
- Tatsächlich: `house()` setzt Mauer- und Dielenkacheln; von oben sieht man in leere Räume. Schmiede = Haus + Amboss davor.
- Kategorie: GEBÄUDE · Priorität: HIGH
- Ursache: Gebäude existieren nur als Kacheln, nicht als Objekte mit Typ/Funktion.
- Lösung (Phase 4): `HOUSES`-Datensätze (Typ, Stadt, Grundriss, Tür) + `src/buildings.js`: Walm-/Satteldach aus
  Stroh/Schindel/Schiefer/Ziegel je Stadt, Fassade (Fachwerk/Holz/Stein/Putz), Tür, Fenster mit Läden, Funktionszeichen
  (Schild mit Symbol, Esse mit Glut, Banner, Kräuterbündel, Rosette/Kreuz, Wappen, Säcke), Schornstein mit Rauch,
  nachts erleuchtete Fenster. Dach blendet beim Betreten aus; Möbel nach Funktion (Taverne, Schmiede, Heilerhaus,
  Vorsteherhaus, Kontor, Wachhaus, Kapelle, Söldnerhalle, Wohnhaus). Beim Betreten: kurzer Name („Taverne · Eren“).
- Test: Selbsttest „jeder Typ × jede Stadt ergibt ein Sprite“, „Türen frei“ (fand BUG-025).
- Status: VERIFIZIERT (Grenzen: nur Süd-Fassaden sichtbar; Nord-Türen nur als Vordach angedeutet)

### BUG-007 — Kisten/Truhen/Fässer ohne Kontext
- Reproduzierbar: JA
- Befund (Zählung Welt): ~60 Kisten, 53 Truhen, 12 Fässer stehen allein in der Wildnis; je Stadt 10–12 Kisten per
  Zufall über Straßen und in Häusern verteilt (`for … prop('crate', ri(…), ri(…))`). Alle Kisten sehen gleich aus.
- Erwartet: Jede Kiste hat einen Grund (Lager, Händler, Überfall, Versteck mit Szene), 2–3 Varianten.
- Kategorie: PROPS · Priorität: HIGH
- Lösung (Phase 4): Städte — Zufallskisten ersetzt durch Waren an Markt, Taverne, Schmiede, Stegen (mit Namen:
  „Marktware“, „Bierfass der Taverne“, „Löschwasser der Schmiede“, „Hafenfracht“). Wildnis — jede Truhe ist eine
  Mini-Szene (toter Reisender, Versteck unter Wurzeln, kaltes Lager, Schmugglerversteck). Kiste 3 Varianten
  (Strebe, Eisenbänder, gesplittert) + offen, Truhe geschlossen/offen, Fass 3 Varianten, Sack, Kistenstapel.
  Alte Spielstände: Siedlungs-Props werden einmalig neu ausgestattet (`flags.gen2`); Wildnis-Truhen alter Stände bleiben.
- Status: VERIFIZIERT (Wildnis nur für neue Spielstände)

### BUG-008 — Städte sind leer
- Reproduzierbar: JA
- Befund: Eren 16 NPCs, Nordfurt 1, Salzhafen/Kreuzweg/Aschfurt/Sonnwacht 0.
- Erwartet: Bewohner, Händler, Wachen je Stadt (Master-Prompt §39, §41).
- Kategorie: NPC / WORLD LOGIC · Priorität: HIGH
- Lösung (Session 2): Bewohner aus den Gebäuden abgeleitet (`spawnResidents`): jedes Wohn-/Arbeitshaus hat 1–2
  Leute mit Beruf, Begrüßung und Ortsgerüchten; ~100 Bewohner in 6 Siedlungen, 25 Wachen an Toren und Plätzen.
- Test: Selbsttest „Bewohner: jedes Wohn- und Arbeitshaus bewohnt, ihr Nachtplatz liegt im eigenen Haus“.
- Status: VERIFIZIERT

## MEDIUM

### BUG-009 — Tiefhall sieht aus wie ein Mineneingang, ist aber nicht betretbar
- Lösung (Session 6): eigener Dungeon `deep` (genDeep), Register `DUNGEONS`/`MAP_KEYS` statt fest verdrahtetem 'mine',
  Boss Hrodvar, Hort nach innen verlegt, Migration deep1. Selbsttest: alle Räume vom Treppenfuß begehbar.
- Kategorie: SZENENÜBERGANG / CONTENT · Status: BEHOBEN

### BUG-010 — Keine Wegfindung: Verfolger laufen stur geradeaus und hängen an Mauern/Bäumen
- Ursache: `moveEnt` gleitet nur achsweise; kein Umgehen von Hindernissen.
- Erster Versuch (nur seitliches Tasten) scheiterte im Test an einer 13 Kacheln langen Mauer (Pendeln) → verworfen.
- Lösung: `seek()` — geradeaus solange möglich; blockiert + Ziel bekannt → A* auf dem Kachelraster (Fenster ±14
  Kacheln, ≤ 2400 Schritte, gecacht 3 s); ohne Ziel seitliches Tasten. Kosten gemessen: ~0,05 ms/Frame bei 20 Verfolgern.
- Test: Selbsttest „Verfolger umgeht eine Mauer“ (10 Läufe stabil).
- Kategorie: PATHING · Priorität: MEDIUM → HIGH (siehe BUG-024) · Status: VERIFIZIERT

### BUG-024 — Gegner/NPCs spawnen mitten in Bäumen und Felsen und stecken für immer fest
- Reproduzierbar: JA (Eren-Wald: 16 von 20 Verfolgern standen exakt auf einem Baummittelpunkt, Abstand 0,0 px)
- Ursache: `freeSpotNear` prüfte nur feste Kacheln, nicht feste Objekte; `moveEnt` erlaubte kein Herausbewegen.
- Lösung: `freeSpotNear` fragt den Objekt-Index (`occupied.at`); `moveEnt` erlaubt Bewegung aus einem Objekt heraus.
  Wirkt für alle Aufrufer (Gegner, NPCs, Wachen, Ankunftspunkte, Erbe) und rettet Eingeklemmte in alten Spielständen.
- Test: Selbsttest „Spawns landen nie in Bäumen; Eingeklemmte kommen frei“.
- Kategorie: SPAWNING / PATHING · Priorität: HIGH · Status: VERIFIZIERT

### BUG-011 — Karawane ist ein einzelnes Objekt ohne Wagen, Tiere, Wachen
- Lösung (Session 6): Leitwagen mit Kutscher und zwei Ochsen, Beiwagen mit Maultier auf der Spur, zwei Karawanenwachen
  als echte Figuren (Platz am Zug, Leine 420 px, Ersatz bei Ankunft), Rast am Tor, Hinterhalt nach Wachenzahl.
- Kategorie: WORLD LOGIC / VISUAL · Status: BEHOBEN (Bild: `screenshots/karawane-2.png`)

### BUG-012 — Mobil nicht spielbar: keine Touch-Steuerung
- Layout passt (keine horizontale Scrollbar), aber es gibt keine Touch-Eingabe (0 Treffer für touch/pointer).
- Lösung (Session 3): Touch-Bedienfeld im Spielfenster (nur Touch-Geräte): Stick links (Totzone), Knöpfe Hieb (halten =
  weiter schlagen), Rolle, E. Zielen ohne Maus: nächster Feind < 220 px, sonst Lauf-/Blickrichtung. Aufträge und
  Einstellungen in die Menüleiste (waren nur per J/Esc erreichbar). Geprüft bei 375×812 mit Pointer-Ereignissen:
  Laufen, Stoppen, Dauerhieb, Rolle, Auto-Ziel, Menüs. Nicht auf echtem Gerät getestet.
- Kategorie: MOBILE · Status: BEHOBEN (Gerätetest durch Nutzer offen)

### BUG-013 — NPCs ohne echten Tagesablauf (Händler stehen rund um die Uhr am Fleck)
- Session 2: Bewohner haben einen Ablauf — 7–18 Uhr Arbeit (Fischer am Steg, Bauer am Feld, Bäcker vor dem Laden,
  andere auf dem Platz), 18–22 Uhr vor dem Haus oder in der Schenke, nachts im eigenen Haus. Geprüft: 12/12 Erener
  Bewohner um 23:30 im Haus, morgens am Arbeitsplatz. Offen: benannte Händler/Figuren aus Session 1 (Phase 15).
- Session 3: Figuren mit Namen (`NPC_DAY`): Arbeitsplatz, Feierabend, Zuhause an echte Häuser gebunden (Aldric wohnt
  in der Schmiede, Elena im Heilerhaus, Borin in der Schenke, Havel/Mara/Jorun/Tomas/Gerold in Wohnhäusern); abends
  Schenke; Läden (Mara, Gerold) bis 20 Uhr, danach „Der Laden ist zu“. Geprüft im Spiel: nachts 7/7 im eigenen Haus,
  mittags am Arbeitsplatz, abends 3 in der Schenke. Kelan/Rook/Lila/Morvath bleiben bewusst an ihren Orten.
- Kategorie: NPC · Status: VERIFIZIERT (Selbsttest „Figuren mit Namen …“)

### BUG-019 — Niedergestreckte Feinde können nicht erledigt werden
- `resolveSwing` überspringt `downed`; `hurt` auf Gestürzte bewirkt nichts. Zusammen mit BUG-002 stand der Feind wieder auf.
- Lösung: Treffer auf einen gestürzten Feind = Gnadenstoß (`die`).
- Kategorie: COMBAT · Status: VERIFIZIERT

### BUG-020 — Händler-Laden „geschlossen“ wurde nie ausgewertet
- `provoke` setzte `shopClosed = true`, aber nichts las das Feld: Nach einem Angriff konnte man sofort weiter handeln.
- Lösung: `shopClosed` ist jetzt eine Spieluhr-Frist (Angriff: bis morgen, Kampf in der Nähe: bis Ruhe) und wird im Dialog geprüft.
- Kategorie: WORLD LOGIC / ECONOMY · Priorität: MEDIUM · Status: VERIFIZIERT

### BUG-021 — Zornige, fliehende oder verängstigte NPCs führen normale Gespräche
- „E Sprechen“ mit einer Wache, die einen gerade angreift, öffnete die freundliche Begrüßung samt Handel/Quests.
- Lösung: Dialog-Sperre mit passender Zeile („Waffe runter!“, „Bleib weg von mir!“, „Nicht jetzt!“); kalte Begrüßung bei Beziehung ≤ −30.
- Kategorie: IMMERSION · Priorität: MEDIUM · Status: VERIFIZIERT

### BUG-022 — Heilerin greift als „Zeugin“ den Spieler an; Söldner Borin flieht vor Goblins
- Rollenlogik war nur Fraktion: Orden = kämpft. Borin (Ex-Söldner, Langschwert) floh wie ein Zivilist.
- Lösung: Heilerin flieht und hilft Verwundeten; Verteidiger-Rolle (Borin, Kelan, Aldric, Tomas) wehrt Feinde nahe
  dem Posten ab (Leine 360 px), Schützen halten Abstand.
- Kategorie: AI / NPC · Priorität: MEDIUM · Status: VERIFIZIERT

### BUG-023 — Eren hat eine einzige Wache; andere Städte keine
- Lösung (Teil von BUG-008): feste Wachposten je Siedlung (18 Wachen, Ausrüstung/Farbe nach Dienstherr: Valen,
  Händler, Orden). Ältere Spielstände werden beim Laden nachgerüstet.
- Kategorie: WORLD LOGIC · Priorität: HIGH · Status: VERIFIZIERT

## LOW / POLISH

### BUG-014 — Charaktererstellung zeigt englische Rohschlüssel („survival, crafting“)
- Kategorie: UI · Priorität: LOW · Status: VERIFIZIERT

### BUG-015 — Rückkehr aus der Grube: Zufallsplatz im Radius 3, teils auf dem Eingang selbst
- Kategorie: SZENENÜBERGANG · Priorität: LOW · Status: VERIFIZIERT (fester Austrittspunkt vor dem Eingang)

### BUG-025 — Sumpf-Wasserlöcher überschreiben Salzhafen: Tür des Wachhauses öffnet ins Wasser
- Gefunden vom neuen Selbsttest „Türen frei“. Ursache: Südsumpf-Wasser wird nach der Stadt generiert.
- Lösung: Stadtfläche nach dem Sumpf ohne Zufall repariert (Zufallsfolge bleibt gleich → alte Stände passen).
- Kategorie: WORLD LOGIC · Priorität: MEDIUM · Status: VERIFIZIERT

### BUG-026 — Selbsttest veränderte den echten Spielstand (Mordzähler, Ruf)
- Der Sandkasten stellte `flags`, `relations`, `factions`, `ranks` nicht wieder her → `murders: 1` in neuer Welt.
- Lösung: Sandkasten sichert diese Felder tief und stellt sie wieder her. Geprüft: Zustand vor/nach Selbsttest identisch.
- Kategorie: ARCHITECTURE · Priorität: HIGH · Status: VERIFIZIERT

### BUG-027 — Weltänderungen hätten die Zufallsfolge verschoben (alte Spielstände)
- Alte Stände laden Props aus dem Speicher, Kacheln werden neu generiert. Entfernte Zufallsaufrufe (Zufallskisten)
  hätten alle späteren Geländeblobs verschoben → Bäume auf Fels/Wasser.
- Lösung: gleiche Zahl Zufallszüge beibehalten, neue Entscheidungen per Hash statt `rnd()`. Kontrolle: 47 von 4032
  Bäumen/Felsen auf Fels/Wasser — entspricht der ursprünglichen Generierung.
- Kategorie: SAVE-LOAD · Priorität: CRITICAL (verhindert) · Status: VERIFIZIERT

### BUG-016 — Titelbild: Burg ist eine flache Vektorsilhouette, passt nicht zum Pixelstil
- Lösung (Session 3): ganze Szene im Sprite-Pixelraster gemalt und scharf hochskaliert; Feste mit Quadern, Zinnen,
  Torhaus mit Fallgitter, zerbrochenem Bergfried, flackernden Fenstern, Banner; gedithertes Abendrot, Bergketten mit
  Randlicht, Pixel-Feuer. Mobil (Hochformat) geprüft. Bilder `titel-vorher.png` / `titel-nachher*.png`.
- Kategorie: VISUAL · Priorität: POLISH · Status: VERIFIZIERT

### BUG-017 — Spielstand ~800 KB (alle Props werden gespeichert)
- Risiko für das localStorage-Limit (~5 MB), wenn die Welt wächst. Props sind aus dem Seed reproduzierbar.
- Lösung (Session 6): nur vom Seed abweichende Props werden gespeichert (siehe BUG-057). SAVE-LOAD · BEHOBEN

---

## Session 2 — Städteausbau

### BUG-028 — Häuser hatten „keine richtigen Dächer“ (Nutzer-Rückmeldung)
- Befund: Walm-/Traufdach von vorn wirkte wie eine flache Platte über der Fassade.
- Lösung: Giebel nach vorn (Giebeldreieck in Wandmaterial, Windbretter, zwei Dachflächen mit Licht/Schatten, First,
  Überstandschatten, Schornstein durchs Dach, Kreuz auf dem First). Vorher/Nachher: `screenshots/dach-*`.
- Kategorie: GEBÄUDE / VISUAL · Priorität: HIGH · Status: VERIFIZIERT

### BUG-029 — Siedlungen viel zu klein (Nutzer-Rückmeldung)
- Befund: 2–5 Häuser je Ort; „Stadt“ Nordfurt = 2 Gebäude.
- Lösung: Ausbauplan je Siedlung (`TOWN_PLAN`, world.js): 104 statt 23 Gebäude, Straßen, Plätze, Mauern mit Toren,
  Felder, Hafen. Vorher/Nachher: `screenshots/dorf-*`.
- Kategorie: WORLD LOGIC / CONTENT · Priorität: HIGH · Status: VERIFIZIERT

### BUG-030 — Salzhafen: Hafenstadt ohne Hafen, Stege endeten im Sumpf
- Lösung: Stadt bis zur Küste erweitert, Kai an der echten Küstenlinie, drei Stege ins Meer, Boote; alte Stege entfernt.
- Kategorie: WORLD LOGIC · Priorität: HIGH · Status: VERIFIZIERT

### BUG-031 — Straßen endeten an Mauern bzw. Hauswänden
- Aschfurt: Oststraße endete an der Nordmauer (kein Tor) → Nordtor. Kreuzweg: Nordstraße lief in eine Hausrückwand →
  Straße daneben. Sonnwacht: Mittellandstraße lief an der Mauer vorbei → Westtor.
- Test: Selbsttest „jede Haustür ist vom Platz aus zu Fuß erreichbar“ (Flutfüllung über Kacheln + feste Objekte).
- Kategorie: WORLD LOGIC / PATHING · Priorität: MEDIUM · Status: VERIFIZIERT

### BUG-032 — Gegner-Gebiete setzten Banditen/Wölfe mitten in Kreuzweg und Aschfurt
- Ursache: Spawn-Gebiete „um Kreuzweg“/„um Aschfurt“ lagen auf der Stadtmitte, kein Siedlungs-Ausschluss.
- Lösung: Erst- und Nachspawns nie in einer Siedlung (+4 Kacheln Rand); Migration entfernt ruhende Gegner aus Städten.
- Test: Selbsttest „keine ruhenden Gegner zwischen den Häusern einer Siedlung“.
- Kategorie: SPAWNING · Priorität: HIGH · Status: VERIFIZIERT

### BUG-033 — Wüstenfelsen und tote Bäume in der Festung Aschfurt (je nach Seed auch auf der Tür der Wache)
- Ursache: Mesas/tote Bäume der Roten Wüste werden nach der Festung gewürfelt und überschreiben Boden, Mauer, Tür.
- Lösung: Stadtausbau räumt den alten Kern: Fels → Boden, auf dem Mauerring → Mauer, in Häusern → Wand/Diele; fremde
  Objekte auf Hausflächen entfernt. Gefunden durch Selbsttest über 8 Seeds (1 schlug fehl), danach 8/8 grün.
- Kategorie: WORLD LOGIC · Priorität: MEDIUM · Status: VERIFIZIERT

### BUG-034 — Wildnis-Streugut in Siedlungen (Lager, Geröll, Verstecke zwischen den Häusern)
- Lösung: alles ab `placeScenes` gewürfelte Streugut wird in Siedlungsflächen entfernt; Bäume/Büsche/Felsen bleiben nur
  auf Gras, wenn sie nichts verstellen. Test: Selbsttest „keine Wildnis-Streu … zwischen den Häusern“.
- Kategorie: PROPS / IMMERSION · Priorität: MEDIUM · Status: VERIFIZIERT

### BUG-036 — Häuser zu heil und gleichförmig für eine dystopische Welt (Nutzer-Rückmeldung)
- Lösung: Verfallsstufen und Stilvarianten (siehe CHANGELOG Session 2). Bilder: `screenshots/nachher-ruine-*`.
- Kategorie: GEBÄUDE / IMMERSION · Priorität: MEDIUM · Status: VERIFIZIERT

### BUG-035 — Wüstenfelsen (ROCK-Kacheln) sind harte dunkle Blöcke
- Sichtbar um Aschfurt; wirkt blockig, nicht wie Fels. Kategorie: VISUAL · Priorität: MEDIUM
- Ursache: jede Felskachel war dieselbe 16×16-Textur mit Lichtkante oben → Raster/Schachbrett aus Einzelkacheln.
- Lösung (Session 3): Fels als zusammenhängende Masse gemalt (`paintRock`), Findlinge, Wand, Schatten, Regionsgestein.
  Bilder: `screenshots/fels-vorher-*` / `fels-nachher-*`. Status: VERIFIZIERT (Sicht + Lauftest, Selbsttest 41/41)

### BUG-037 — Hochgebirge mit Straßenpflaster als Naturboden
- Der Gebirgsgrund (STONE) nutzte die Pflastertextur der Stadtplätze → Wildnis sah gepflastert aus.
- Lösung: außerhalb von Siedlungen im Gebirge Geröll-Textur. Kategorie: VISUAL / WORLD LOGIC · LOW · VERIFIZIERT

### BUG-043 — Waffenwert „stagger“ ohne Wirkung (Scheinsystem); Rückstoß als 1-Frame-Sprung
- Befund Session 3: `ITEMS.mace.stagger = 1.6` wurde nirgends gelesen; Taumeln gab es nur beim Boss. Waffen
  unterschieden sich im Treffer nur über Hit-Stop/Wackeln.
- Lösung: Taumeln je Waffenklasse mit Unterbrechung ab Axt, rutschender Rückstoß (siehe CHANGELOG Phase 6).
- Kategorie: COMBAT · MEDIUM · Status: VERIFIZIERT (Selbsttest + Duell-Simulation)

### BUG-044 — Interaktionen ohne Körpersprache (Figur steht starr beim Durchsuchen, Holzfällen, Beten, Aufstehen)
- Lösung: `act()` + Posen knien/arbeiten/aufrichten. ANIMATION · LOW · VERIFIZIERT

### BUG-042 — Grube sah aus wie ein gepflastertes Ziegelraster statt wie eine Mine
- Lösung: Höhlenfels statt Ziegelstreifen, Geröllboden. Bilder `grube-nachher-*`. VISUAL · MEDIUM · VERIFIZIERT

### BUG-041 — Stadtmauern sahen von oben wie gepflasterte Wege aus
- Lösung: Front nach Süden, Zinnen, Kantenlicht (`paintWalls`). Bilder `mauer-vorher-*` / `mauer-nachher-*`.
- Kategorie: VISUAL / WORLD LOGIC · MEDIUM · Status: VERIFIZIERT

### BUG-040 — Boden: Kachel-Schachbrett im Gras, eckige Erd-/Sand-/Sumpfflecken
- Ursache: Helligkeit und Regionstönung wurden je Kachel als Rechteck gefüllt; Bodengrenzen folgten Kachelkanten.
- Lösung: `bakeGround` (siehe CHANGELOG Session 3). Bilder `boden-vorher-*` / `boden-nachher-*`.
- Kategorie: VISUAL · HIGH (prägt jedes Bild der Welt) · Status: VERIFIZIERT

### BUG-039 — Wasser als Kachelquadrate (Ufer eckig, einzelne Grasquadrate im Sumpf)
- Lösung: weiches Uferfeld, Tiefe, Schaum, Schilf, Regionspaletten, Südsee. Bilder `wasser-vorher-*`/`wasser-nachher-*`.
- Kategorie: VISUAL · MEDIUM · Status: VERIFIZIERT (Sicht, Lauftest, Selbsttest 41/41)

### BUG-038 — Lose Felsbrocken waren einfarbige Vielecke (Platzhalter)
- Lösung: 3 facettierte Varianten in Regionsgestein, Erzader, Schutthaufen bei Abbau. PROPS · LOW · VERIFIZIERT

## Session 4 — Siedlungsdichte & Titelklassen

### BUG-045 — Städte zu klein und zu voll (Nutzerbefund, Screenshot)
- Reproduzierbar: JA · Schritte: Nordfurt betreten, Gesamtansicht (Bild `stadt-vorher-northcity.png`).
- Erwartet (§75): Wege zwischen den Häusern, Höfe/Grün, Hauptstraße breiter als Gassen, Einwohner passend zur Fläche.
- Tatsächlich: Nordfurt 37×30 Kacheln, 15 Häuser Wand an Wand (0–1 Kachel Abstand), alles gepflastert; Eren-Kern,
  Kreuzweg, Sonnwacht-Unterstadt ebenso 1 Kachel; Aschfurt 1053 Kacheln.
- Kategorie: WORLD LOGIC / GEBÄUDE · Priorität: HIGH (Nutzer: „wichtiger machen“)
- Ursache: Pläne mit 1-Kachel-Raster entworfen; der alte Kern (genWorld) war fest verdrahtet und nicht verschiebbar,
  ohne die Zufallsfolge der Welt (alte Spielstände) zu verändern.
- Lösung: Streckung je Stadt (`spread` in TOWN_PLAN, Faktor 1,2–1,5 um einen Anker auf Durchgangsstraße/Kai/Fluss),
  Häuser behalten Größe und bleiben an ihrer Türseite verankert; der alte Kern zieht in `expandTowns` um (Häuser + Props,
  Boden zurück zur Natur), Straßenstücke werden an das Stadtnetz angeschlossen, jede Tür bekommt einen Trampelpfad,
  Hauptstraßen ≥ 3 Kacheln. Nordfurt: kein Flächenpflaster mehr (Markt gepflastert, Höfe, Gemüsebeete), 7 Ergänzungs-
  häuser; Aschfurt: 3. Fläche aller Siedlungen: 10 651 → 19 322 Kacheln. Migration `flags.gen4` für alte Stände.
- Test: Selbsttest „Siedlungen (§75): Nachbarhäuser ≥ 2 Kacheln, bebaut < 35 %“ + Türen erreichbar, 8 Seeds.
- Status: VERIFIZIERT (Bilder `stadt-nachher-*`)

### BUG-046 — Einwohneranzeige log: Nordfurt „90“, zu sehen waren 22
- Ursache: Anzeige zeigte die abstrakte Marktgröße (`TOWNS.pop`), nicht die Menschen. Bewohner hingen an der Häuserzahl
  (1–2 je Haus), nicht an der Fläche. Andere Städte zeigten gar keine Zahl.
- Lösung: `perHead` je Stadt (Kacheln je Kopf: Nordfurt 55, Salzhafen 70, Sonnwacht 85, Kreuzweg 90, Eren 95, Aschfurt
  100); `residentPlan` verteilt Fläche/perHead − Wachen − Figuren mit Namen auf die Häuser (jedes mind. 1, Obergrenze je
  Haustyp). Anzeige = gezählte Köpfe, für alle Städte. Marktgröße bleibt intern (Produktion).
- Test: Selbsttest „Einwohner folgen der Fläche“. · UI / WORLD LOGIC · MEDIUM · VERIFIZIERT

### BUG-047 — Tagsüber standen alle Müßigen auf 5×3 Kacheln am Platz
- Folge: mit mehr Einwohnern ein Gedränge, genau das „zu voll“. Lösung: Tagesziel verteilt — Platz (ganze Fläche),
  Nachbarn besuchen (vor deren Tür), vor dem eigenen Haus; Nachtplätze nebeneinander statt übereinander.
- NPC / IMMERSION · MEDIUM · BEHOBEN (Sichtprüfung)

### BUG-048 — Nordfurts Osthälfte im Gebirgsbiom (Geröll und Schnee zwischen den Häusern)
- Vorher vom Flächenpflaster verdeckt. Lösung: Siedlungen übernehmen die Region ihres Ankers (erst nach der Generierung).
- VISUAL · LOW · VERIFIZIERT

### BUG-049 — Kampftest hing am Zufall (Krit-Wurf) und am Seed des Spielstands
- Selbsttest „schwere Waffen unterbrechen…“ fiel bei Seed 424242 durch, sobald sich die Zufallsfolge verschob.
  Lösung: Zufall im Test fest (`seedRng(7)`). ARCHITECTURE/TEST · LOW · VERIFIZIERT (8 Seeds)

### BUG-050 — Hexenmeister als gewöhnliche Lehrklasse (Nutzer: soll später freischaltbar sein, wie ein Titel)
- Vorher: Morvath lehrte „Hexenmeister“ nach einer Holquest als Grundklasse (ersetzte die Klasse, Mana, 2 Fähigkeiten).
- Lösung: Titelklassen-System (GDD). Alte Stände: Hexenmeister-Grundklasse → Magier + Titelklasse Hexenmeister.
- DESIGN / CONTENT · HIGH · VERIFIZIERT (Durchspielen beider Pfade über die Oberfläche)

### BUG-051 — Leeres Totenreich (offen seit Session 1) — teilweise
- Alt-Vharn: Ysra am Ahnenaltar mit Namenssteinen; Nekromanten-Turm: Vhal im Schattenkreis; Große Nekropole: Gruft als
  Ritualort mit Wächter. Weitere leere Flächen bleiben (→ Phase 16). CONTENT · MEDIUM · IN ARBEIT

## Session 5 — Weltmaßstab, Skill-Baum, Druide, Totenreich

### BUG-052 — Weltkarte zu klein für mehr Häuser und Abstand (Nutzerbefund)
- 512×512, Eren–Nordfurt ~18 Kacheln nach der Streckung. Lösung: Weltmaßstab 1,5 (768×768), Städte weitere 15 %,
  Randhäuser. Spielstand v3 mit Umrechnung. WORLD LOGIC · HIGH · VERIFIZIERT (Selbsttest „Weltmaßstab“, 5 Seeds, 2 alte Stände)

### BUG-053 — Diener folgten nicht durch Eingänge (offen aus Session 4)
- Lösung: travel() nimmt Diener mit. SZENENÜBERGANG · MEDIUM · VERIFIZIERT (Selbsttest mit Gegenprobe)

### BUG-054 — Viel Erfahrung auf einmal gab nur eine Stufe („169/109“ in der Leiste)
- Ursache: `if` statt Schleife in gainXp. Lösung: while. GAMEPLAY · LOW · BEHOBEN

### BUG-055 — Untote Figuren flohen vor Skeletten der eigenen Fraktion
- Reproduzierbar: JA (Session 4, Morvath: „Nicht jetzt — siehst du nicht, was hier los ist?!“, weil ein Skelett in der
  Nähe als Bedrohung zählte). Ursache: Bedrohung = Team „Feind“, Fraktion spielte keine Rolle.
- Lösung: gleiche Fraktion ist nie feindlich (außer zornig/Diener), Bedrohungssuche überspringt die eigene Fraktion.
- AI / FACTION · HIGH (blockierte die Pakt-Quest je nach Lage) · VERIFIZIERT (Selbsttest mit Gegenprobe)

### BUG-056 — Tote Bäume als dünner 20-px-Strich (Wüste, Totenreich wirkten leer)
- Lösung: drei Wuchsformen in Baumgröße, im Totenreich teils mit aufgehängten Knochen. VISUAL · MEDIUM · BEHOBEN (Bild)

### BUG-057 — Spielstand wächst mit der Karte (1,1 → 1,4 MB) — gehört zu BUG-017
- Ursache wie BUG-017: alle ~8300 Props werden gespeichert, auch unveränderte. SAVE-LOAD · MEDIUM · BEHOBEN (Session 6)
- Lösung: Erzeugungsschlüssel `gk` = Typ@Kachel (nicht Index — spätere Generierungsänderungen verschieben sonst alle
  Stände), Grundzustand nach genWorld/genMine/genDeep, gespeichert werden Abweichungen + `propsGone`. Alte Vollstände
  übernehmen die Schlüssel beim Laden. Neu gestartet 1,43 MB → 0,53 MB; alter v3-Vollstand nach erstem Speichern 0,55 MB.
  Rest: ~300 Figuren à 1,4 KB (430 KB) — Bewohner sind nicht aus dem Seed reproduzierbar (Zustand), bewusst gespeichert.

### BUG-051 — Leeres Totenreich — Stand
- Session 5: Vharnholm, Knochenwald, Aschensee, Seelenbrunnen, Grabräuber. Session 6: Grenzöde mit Grenzwacht,
  Hundertfeld, bewachter Straße und Quest. Offen: Ostrand nördlich des Knochenwalds (kein Meer im Osten — Landschaft,
  nicht Küste). CONTENT · MEDIUM · TEILWEISE

## Session 6 — Spielstand, Karawane, Tiefhall

### BUG-058 — Nach jedem Laden wich jedes Prop vom Grundzustand ab
- Ursache: continueGame setzte `act/hexed/rooted` auf allen Einträgen, auch auf Props. Mit dem Diff-Speichern wäre
  der Spielstand nach dem ersten Laden wieder voll gewesen. Gefunden durch den neuen Selbsttest.
- Lösung: Props überspringen (und alte Felder entfernen). SAVE-LOAD · HIGH · BEHOBEN

### BUG-059 — Frame brach mit „negative radius“ ab (Blutlache einer Leiche)
- Ursache: Alter = Frame-Zeitstempel − `born` (performance.now beim Tod); stirbt etwas während eines langen
  Update-Schritts, ist das Alter negativ. Im Spiel selten, im Test sicher. Lösung: Alter ≥ 0. RENDER · MEDIUM · BEHOBEN

### BUG-060 — Säulen (broken_pillar) als Mini-Gruft mit grüner Tür gezeichnet
- Teilte den Zeichenfall mit crypt/marsh_ruin (Platzhalter). Jetzt Säule mit Bruchkante bzw. ganz (`intact`).
  VISUAL · MEDIUM · BEHOBEN

### BUG-061 — Karawane fuhr neben der Straße über die Wiese
- Ursache: feste Wegpunkte im Entwurfsmaßstab; nach der Streckung (Session 5) lagen sie 3 Kacheln neben der Straße.
- Lösung: Route aus der Karte (Dijkstra über Straßenkacheln), 98 % Straße/Brücke; Selbsttest ≥ 90 %. WORLD · BEHOBEN

### BUG-062 — Beiwagen springt beim Wenden auf die andere Seite
- Nach der Rast wird die Spur neu begonnen; der Beiwagen steht dann schlagartig hinter dem Leitwagen. Passiert am Tor.
  VISUAL · LOW · OFFEN (Wendekreis fahren)

### BUG-063 — Stadtwachen/Söldner deutlich stärker als Banditen
- Zwei Wachen Stufe 4–7 schlugen 5 Banditen ohne Schaden am Wagen. Karawanenwachen jetzt Stufe 2–4, Hinterhalt +1
  Räuber je Wache — Ergebnis streut jetzt (Wache fällt, Wagen beschädigt). Grundsätzliche Kampfbalance bleibt offen.
  BALANCE · MEDIUM · TEILWEISE (Phase 11)

### BUG-064 — Hrodvar ohne eigene Angriffsmuster, Tiefhall ohne Questanbindung
- Hrodvar ist ein starker Untoter mit Zweihänder (Stufe 11), aber ohne Spezialangriffe wie Gorak. Niemand in der Welt
  erwähnt die Tiefhall. CONTENT · MEDIUM · BEHOBEN (Session 6: Eiskreis + Leibwache, Quest Königseisen, Gerüchte)

### BUG-065 — Quest mit Boss-Ziel wäre nach frühem Sieg nicht mehr lösbar
- Wer Hrodvar vor der Annahme von „Königseisen“ erschlägt, hätte das Ziel nie erfüllen können (Boss kommt nicht wieder).
- Lösung: `startQuest` zählt schon Erledigtes (Boss-Flag, Gegenstände im Gepäck). QUEST · HIGH · BEHOBEN (vor Auslieferung)

## Design-Lücken (kein Fehler im engeren Sinn, aber Master-Prompt-Anforderung)
- Rarität ist nur Etikett/Farbe (5 Stufen, kein Mythic, keine Affixe) → Phase 8.
- Kein Skill Tree (Klassenkette + Fertigkeitswerte) → Phase 9.
- Gegner reagieren nicht auf einen am Boden liegenden Spieler anders als auf Stehende; Wachen helfen nicht → Phase 2.

## Performance (Session 1, Median je Frame, gemessen mit `RF`)
| Ort | Update vorher → nachher | Zeichnen |
|---|---|---|
| Eren (≈40 Akteure) | 3,2 → 2,2 ms | 2,9 → 1,8 ms |
| Eren-Wald (Verfolgungen) | 4,3 → 2,4 ms | 2,8 ms (dichter Wald, war vorher ähnlich) |
| Ebene | 1,0 ms | 0,8 ms |
Maßnahmen: Kämpferliste je Frame auf den Umkreis des Spielers begrenzt; Lichtquellen gecacht. Offen: Wald-Zeichnen
über Budget (viele Bäume), gehört zu Phase 20.

## Verifiziert ohne Befund (Session 1)
- Speichern/Laden: Position, Gold, Tag, Generation, Entitätenzahl identisch nach Neuladen.
- Erbe-Ablauf: Kandidat „Base von Ragnar“, Ankunft in Eren, Generation 2.
- Alle 13 Waffen schwingen/schießen ohne Fehler; Schadenswerte plausibel gestaffelt.
- Performance: Update 1,4 ms, Zeichnen 1,7 ms pro Frame (Budget 3,0 / 2,0).
- Mobil 375 px: keine horizontale Scrollbar, HUD lesbar.
- Selbsttest 22/22.
