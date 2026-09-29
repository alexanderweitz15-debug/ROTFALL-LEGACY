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

## Session 7 — Phasen abschließen

### BUG-066 — Kleine Schenken ohne Bänke
- Ursache: Bei 6×5-Schenken lagen beide Bank-Plätze auf der Kachel hinter der Tür (bleibt frei) → ersatzlos weggefallen.
- Lösung: Möbel rücken auf die nächste freie Innenkachel. WORLD/VISUAL · MEDIUM · BEHOBEN

### BUG-067 — Abends ein Klumpen Bewohner vor der Schenkentür
- Alle Schenkengänger hatten denselben Zielpunkt. Lösung: Halbkreis je Bewohner. IMMERSION · LOW · BEHOBEN

### BUG-068 — (vor Auslieferung) Deckungszustand kollidierte mit dem Wachen-Flag `guard`
- Gefunden per code-review: Stadtwachen hätten dauerhaft geblockt, keine Ausdauer erholt und bei Bruch ihren Status
  verloren; Block rechnete vor der Rüstung; Rolle beendete die Deckung nicht; gebrochene Deckung ließ noch Zufallsblock zu.
- Lösung: eigenes Feld `cover`, Rüstung vor dem Block, Rolle setzt zurück, Bruch = voller Treffer. Regressionstest. BEHOBEN

### BUG-069 — Magier, Waldläufer, Ritter ohne Lehrer (unerlernbar)
- Seit der Hexenmeister Titelklasse wurde, lehrte Morvath nichts mehr; Waldläufer/Ritter hatten nie einen Lehrer.
- Lösung: Lehrer unterrichten Folgen; Selbsttest „jede lernbare Klasse hat einen Lehrer“. CLASSES · HIGH · BEHOBEN

### BUG-070 — Feuerball ohne Flächenschaden (splash nie ausgewertet)
- Die Beschreibung versprach Flächenschaden, das Feld wurde nirgends gelesen. Lösung: `splashAt`. COMBAT · MEDIUM · BEHOBEN

### BUG-071 — (vor Auslieferung) removeItem nur aus dem ersten Stapel, Leiste zu kurz für aktive Talente
- Gefunden per code-review. Lösung: Entnahme über alle Stapel; Leiste 10 Plätze. BEHOBEN

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

---

## Session 8 — Phase 11 (Gegner)

### BUG-072 — Wilder Hund war ein grauer Wolf (Copy-Paste-Gegner, §66) + Cache-Fehler bei Tier-Sprites
- Ursache: `beastFrame` cachte nur nach Typ; der Hund wurde als 'wolf' angefragt und erbte den gecachten grauen Wolf.
- Lösung: eigene Gestalt (schmal, hochbeinig, Rippen, Schlappohr, Sichelrute, Flecken), Palette im Cache-Schlüssel.
  Selbsttest „Wilder Hund hat eine eigene Gestalt“. VISUAL · MEDIUM · BEHOBEN

### BUG-073 — Selbsttest-Sandbox isoliert Geschosse/Auferstehungen nicht → Tests kippen je nach Reihenfolge
- Befund: Karawanen-Test und Feuerball-Test schlugen zeitweise fehl. Feuerball verlangt `S.projectiles` leer; ein
  Kultist in einem vorherigen Test (oder ein echtes Geschoss aus der Welt) hinterließ Schattenblitze.
- Lösung (verifiziert Session 9: 82/82 zweimal hintereinander): `sandbox` sichert und leert
  `S.projectiles` und `S.rising` und stellt sie danach wieder her.
- Offen: Karawanen-Test („zwei Wachen gehen mit dem Zug …“) war einmal rot, dann grün — Ursache nicht untersucht.
- Kategorie: TESTING · HIGH (unzuverlässige Tests) · Status: BEHOBEN (Karawanen-Test weiter beobachten)

### BUG-074 — Kultist heilte bildratenabhängig (Abklingzeit zählte fest 16 ms je Aufruf)
- Lösung: echte Frame-Zeit `dt`. AI · LOW · BEHOBEN

### BUG-075 — Test-Spielstand: Spielfigur war tot (aus Kampfsimulationen), Tests im Spiel verhielten sich daher „falsch“
- Kein Spielfehler, Hinweis für Tests: vor Welt-Tests `S.player.alive` prüfen. Status: HINWEIS

---

## Session 9 — Durchlauf-Audit (Agent, Bericht: `AUDIT_PLAYTHROUGH_S9.md`)
Übernommen als offene Einträge; Details, Messwerte und Screenshots stehen im Bericht.
- BUG-076 Kampf trivial durch Rückwärtslaufen (Spieler 1,7–2,2× schneller als Gegner, Gehen kostet keine Ausdauer) · COMBAT · HIGH · BEHOBEN S10 (Ursache: Spieler 2,25–2,7 px/Bild, Gegner 1,1–1,55, Rückwärtsgehen und Hauen ohne Abzug. Jetzt: eigener Hieb bremst auf 55 %, Rückwärtsgehen mit Gegner < 280 px auf 70 %; jeder Nahkämpfer inkl. Boss setzt nach ~2 s vergeblicher Verfolgung mit ×1,45 nach, angesagt durch „!“ und Staub — §34 „Nicht-mehr-nachgeben“. Wolf behält seinen Sprung. Test „Anti-Kiting“ mit Bandit, Goblin, Skelett)
- BUG-077 Kelan kämpft endlos gegen Wölfe ohne Schaden, Dialog gesperrt, hilft Gestürzten nicht (`teamOf`/`updateNpc`) · NPC AI · HIGH · BEHOBEN S10 (Kämpfer wie Kelan zählen wie Wachen zur Spielerseite; Test „Kelan verletzt Wolf wirklich“)
- BUG-078 Gerüchte statisch, Weltereignisse (Überfall, Moorland fällt) werden nie erwähnt (`gossip()`) · WORLD CONSEQUENCES · HIGH · BEHOBEN S10 (`recentNews()` aus der Chronik: Kämpfe, Tode, Verbrechen, Karawanen ≤5 Tage; Bewohner reden in Sprechblasen darüber, `gossip()` erzählt das Neueste zuerst; Test „Gerüchte“)
- BUG-079 Wolfsschlucht rundum von Fels eingeschlossen; Nebelinsel ohne Fähre (per Wegsuche) · MAP ACCESS · HIGH · BEHOBEN S10 (Schluchtpass NO, Nebelsteg; Test „jeder Ort zu Fuß von Eren erreichbar“)
- BUG-080 E wählt immer das Nächste in 62 px — Brann nicht ansprechbar, Figuren von Kräutern/Mägden verdeckt · UI · HIGH · BEHOBEN S10 (Auswahl nach Maus/Zielrichtung, Figuren mit Namen bevorzugt; Test)
- BUG-081 Stufe-1-Figur verblutet 10 Kacheln vor Eren an einem Wolf, keine Warnung/Hilfe · BALANCE · MEDIUM · BEHOBEN S10 (Hilfe: BUG-077 — Kelan trifft jetzt wirklich. Warnung §71: erster Schritt in ein Gebiet mit Gefahr ≥ 2 oder bei Stufe ≤ 2 schreibt eine Warnung nach Gefahrenstufe ins Protokoll, bei Überforderung auch als Einblendung; beim ersten Bluten Hinweis auf Verband bzw. fehlenden Verband. Test „Warnung“)
- BUG-082 Dorfleben statisch: 08–11 Uhr kein Bewohner > 5 Kacheln, niemand sitzt/isst/arbeitet, Wachen ohne Rundgang; fern des Spielers pixelgleich übereinander · NPC SCHEDULES · HIGH · BEHOBEN S10 (Tagesplan mit Blöcken, Arbeitsanimation, Gespräche, Versetzen außer Sicht; Eren 08–10 Uhr: 15/27 statt 2/27 unterwegs; Test „Tagesplan“) — Stufe 1, Jäger/Läden/Wachen-Schichten offen
- BUG-083 Abendpulk: 11–12 Leute vor der Tavernentür Nordfurt, Wirte draußen · CITY · MEDIUM · BEHOBEN S10 (Abend in der Schenke drinnen nach freien Plätzen, Wirte drinnen; Nordfurt 19 Uhr vor der Tür 14 → 4, drinnen 1 → 4)
- BUG-084 Zielen beim Laufen veraltet (nur bei Mausbewegung neu berechnet); Körper dreht nicht mit · COMBAT/ANIMATION · MEDIUM · BEHOBEN S10 (Mauspunkt jeden Frame neu; Körper schaut zur Zielrichtung, Waffe in Ruhe gesenkt getragen)
- BUG-085 Karte: ~10 Symbole überlappen um Eren, Legende fehlt; Auftragsorte („Hürde“, „Waldrand“) nicht auf der Karte · QUEST/UI · MEDIUM · BEHOBEN S10 (Ansicht „Umgebung“ ×3 um den Spieler als Standard + „Welt“; Beschriftung ohne Überlappung mit Vorrang Aufträge > Städte > Rest, Symbole/Fahnen/Spieler freigehalten; Legende im Kartenbild; aktive Aufträge als rote Raute mit Namen, `QUEST_WHERE` bzw. Aufenthaltsort der gesuchten Person; Screenshot `karte-umgebung.png`; Test „Karte“)
- BUG-086 „Neue Geschichte“ überschreibt Spielstand ohne Rückfrage · SAVE · MEDIUM · BEHOBEN S10 (Rückfrage, wenn ein Spielstand existiert)
- BUG-087 Namen: 5× „Jost (Magd)“, Männernamen als Magd; Lila „Jorans Tochter“ statt Jorun · IMMERSION · LOW · BEHOBEN S10 (Ursache: 14 Namen je Liste + Hash-Kollision → bis 9× „Notker“ in Salzhafen. Jetzt 45/47 Namen, `nameFix()` vergibt je Stadt jeden Namen einmal, dann mit Beinamen; Namen benannter Figuren gesperrt; läuft beim Spawn und Laden. 263 Bewohner, 0 Dopplungen; Test „Namen“)
- BUG-088 Gegner stapeln sich am Flussufer, gefahrlos mit Bogen abschießbar · AI · MEDIUM · BEHOBEN S10 (Ursache: A* sucht nur ±14 Kacheln; ohne Brücke darin kein Weg, Gegner rutscht am Ufer. Jetzt: ~3 s ohne Weg → „?“, Abzug zum Posten, 9 s kein neuer Anlauf auf dasselbe Ziel, wachsamer; Bosse halten ihre Arena. Test „Wegfindung (BUG-088)“)
- BUG-089 Log nach dem Laden „Tag 2 bricht an“ um 20:04; Startmeldung „Im Norden liegt Eren“ passt nicht · UI · LOW · BEHOBEN S10 (Ursache: `lastDay` startete fest bei 1 → jedes Laden lief als Tageswechsel, inkl. **doppeltem Tagesverbrauch**; jetzt `syncClock()` in startGame. Startmeldung aus der echten Richtung. Test „Laden“)
- BUG-091 Sprechblasen aus Häusern schwebten über dem geschlossenen Dach · IMMERSION · LOW · BEHOBEN S10 (nur sichtbar, wenn der Spieler im selben Haus ist)
- BUG-092 Schenke abends sehr voll (bis ~10 Figuren auf 4×3 Kacheln) · CITY · LOW · BEHOBEN S10 (größere Schenken + Sitzplätze nur im Schachbrettmuster: nie Schulter an Schulter, höchstens halb belegt; Kreuzweg 17 → 11 Gäste; Screenshot `schenke-kreuzweg-abend.png`)
- BUG-093 Zeichenzeit während eines vollen Stadtfests 2,10 ms (Budget 2,0) · PERFORMANCE · MEDIUM · TEILWEISE BEHOBEN S10 (Ursache war nicht das Fest: jedes neue Figurenbild kostete 3–17 ms, weil `toCanvas` pro Pixel `fillRect` rief und `coarse()` über `getImageData` von der GPU zurücklas → 12–18 % der Bilder > 5 ms. Jetzt CPU-Pipeline (ein `putImageData`, Vergröbern auf der CPU-Kopie): 16,5 → 0,7 ms je Bild (Median); dazu Vorbacken aller Richtungen/Laufposen sichtbarer Figuren in Leerlaufzeit. Eren-Kern 17 Uhr: 0–1 von 150 Bildern > 5 ms statt 17–27. Danach Licht (Phase 20): Median Stadtkern 1,9–2,1 ms im versteckten Tab; Rest ist das Einblenden der Dunkel-Ebene — im sichtbaren Browser nachmessen)
- BUG-094 Festaufbauten auf der Alten Straße blockierten Karawane; Ausweichplätze stellten eine Haustür zu · WORLD LOGIC · HIGH · BEHOBEN S10 (nur Platz/Erde/Wiese/Sand, Türvorplätze ±1 und Platzmitte reserviert; Tests „Stadtfest“ offRoad + Tür-Erreichbarkeit während des Fests grün)
- BUG-095 Selbsttest „Karawane (BUG-011)“ flackerte: läuft auf der echten Welt; passierte der Zug im Test den Hinterhaltspunkt, spawnten Räuber und töteten eine Wache · TEST · LOW · BEHOBEN S10 (Zufallsüberfall und feindliche Tiere im Umkreis für die Dauer der Probe geparkt; Formation und Aufholen isoliert geprüft)
- BUG-096 Karawanenwachen blieben für immer zurück, wenn der Spieler beim Zug stand und sie > 900 px weg waren (weder Denk- noch Nachführbereich) · AI · MEDIUM · BEHOBEN S10 (außer Denkweite holen sie zu Fuß auf, 1,8 px/Bild; Test „Karawane (BUG-096)“)
- BUG-097 Selbsttests hingen am Zustand der echten Welt (Kopftreffer tötete Probe-Gegner trotz Heilung; Valen-Besatzung nach Schlacht galt als „ruhender Gegner“) · TEST · LOW · BEHOBEN S10 (Probe-Gegner mit unzerstörbaren Körperteilen; nur spielerfeindliche Gegner zählen; Warnausgaben nennen die Verursacher)
- BUG-098 Gerüchte zitierten Chronik-Schlagzeilen wörtlich („Man sagt: Schlacht bei Alte Straße.“) · IMMERSION · LOW · BEHOBEN S10 (`newsLine()` macht Sätze, Ortsnamen im Dativ: „Bei der Alten Straße wurde gekämpft“; Test)
- BUG-099 Besetzter Ort: Bewohner gehen ihrem normalen Tag nach, als wären keine Untoten da (Markt, Schwatz) · IMMERSION · MEDIUM · BEHOBEN S11 (unter Besatzung bleiben alle Bewohner im Haus — Block „v“ im Tagesplan; nach Befreiung sofort wieder Alltag; Test „Besatzung“. Tagesplan-Proben laufen mit `peace()` im Friedensstand)
- BUG-100 Schwarze Feste praktisch nicht befreibar: dort steht das Untotenheer (34) dauerhaft, Befreiung verlangt „kein Untotenheer am Ort“ · CONTENT · MEDIUM · OFFEN (Endgame-Set-Piece §81: eigene Arena/Thronsaal, Heer muss vorher im Feld geschlagen werden — Nutzerentscheid)
- BUG-101 Aschfurt hat keinen Auftrag (keine benannte Figur dort) — Brett verweist nur auf andere Orte · CONTENT · LOW · OFFEN
- BUG-090 Bürgernamen passten nicht zum Beruf (Magd Folkmar, Netzflickerin Arnulf) · Daten · LOW · BEHOBEN S10 (Namenslisten nach Geschlecht, Korrektur beim Laden)


## BUG-102 (behoben, Session 12)
Test „Tagesrhythmus (§41) Jäger“ schlug fehl, sobald das Fell-Lager einen gebrochenen Wert hatte (6,3 + 2 − 6,3 ≠ 2). Ursache: Gleitkomma mit `===` verglichen. Fix: Toleranz 1e-6. Der Test deckt es selbst ab.

## BUG-103 (behoben, Session 12)
Das Anschlagbrett eines Dorfes stand auf dem Platzmittelpunkt (`freeSpotNear` lieferte die Platzmitte) und sperrte die Wege zu allen Türen. Fix: Das Brett wird im Ring um (Platz +3, +2) gesetzt, nie auf die Platzmitte und nie vor eine Tür. Abgedeckt durch den Test „jede Haustür ist vom Platz aus erreichbar“.

## BUG-104 (behoben, Session 12)
Je nach Seed war die Tiefhall ohne Zugang (Stufen der Hochrechnung trennten den Pfad diagonal). Fix: `ensureReach()` prüft nach jeder Erzeugung per Wegsuche, ob jeder Ort erreichbar ist, und gräbt sonst einen Erdweg. Abgedeckt durch den Test „Erreichbarkeit (BUG-079)“.

## BUG-105 (behoben, Session 12)
Der Test „Einwohner folgen der Fläche“ schlug fehl, sobald ein Tributzug im Dorf stand oder das Dorf Hungertote hatte. Ursache: Offizier, Wachen und Träger haben ihren Anker im Dorf und zählten als Einwohner. Wer verhungert, fehlte dagegen in der Untergrenze. Fix: Tributzug ausgenommen, Hungertote (`S.tribute[k].lost`) werden angerechnet.

## BUG-106 (behoben, Session 12)
Gegner und Menschen standen im Kampf ineinander, blieben an Kanten hängen und entstanden manchmal eingesperrt (Felskessel, zwischen Bäumen). Ursache: Es gab keine Abstandsregel zwischen Figuren. `seek` hatte keinen Ausweg, wenn alle Seitenschritte scheiterten. `freeSpotNear` prüfte nur die eine Kachel. Fix: `separate()`, `unstick()` und `openSpot()` (siehe CHANGELOG). Test „Abstand (S12)“.

## BUG-107 (behoben, Session 12)
Nach dem Selbsttest ging der Todesbildschirm „Probe ist gefallen“ auf. Ursache: `playerDeath` lief auch für die Test-Figur in der Sandbox. Dabei wurde ein Vorfahr ins Erbe geschrieben und gespeichert. Fix: Proben (`S._quiet`, Karten `__*`) sterben nicht ins Erbe. Der betroffene Spielstand ist bereinigt. Test „BUG-107“.

## BUG-108 (GROSSTEILS BEHOBEN, Session 12) · PERFORMANCE · HIGH
Das Update kostet 5–8 ms (Budget 3 ms), in der Wildnis mit 3 Kämpfern 5,7 ms. Gemessen im versteckten Browserfenster. Props allein kosten 2,2 ms, Dorfbewohner allein 1,5 ms, Wachen 0,3 ms, Gegner 0,4 ms. Zusammen ist es mehr als die Summe, also läuft vermutlich irgendwo eine Suche über alle Entitäten je Figur und Bild. Ursache noch nicht gefunden. Nächster Schritt: Profiler oder einzelne Hooks in `updateNpc` messen. Auf Nutzerwunsch zurückgestellt.

## BUG-109 (behoben, Session 12)
Bewohner hingen in Häusern fest oder drückten gegen Türen und Geräte. Ursachen:
1. `seek` wertete Entlangschrammen an der Wand als Bewegung, deshalb startete die Wegsuche nie.
2. Kleine Häuser waren übermöbliert.
3. Ein verstelltes Ziel galt nie als erreicht.

Fix siehe CHANGELOG Phase 1. Tests „Phase 1 Türen“ und „Phase 1 Häuser“.

## BUG-110 (behoben, Session 12)
Der Bogen lag in der Frontansicht waagrecht, weil `drawWeapon` Fernwaffen mit der Zielrichtung drehte. Außerdem gab es XP ohne eigenen Schaden, Pfeile tunnelten bei niedriger Bildrate, und Schützen schossen ohne Sichtlinie. Fix siehe CHANGELOG Phase 1.

## BUG-111 (OFFEN, Session 12) · TEST · LOW
Der Test „Karawane (BUG-096)“ wackelt: Die Wache landet je nach Position und Fahrt des Zugs 108–138 px vom Platz, die Toleranz ist 120. Er ist zeitabhängig. Die Wache holt den Zug tatsächlich ein (Live-Trace). Nächster Schritt: den Zug für den Test anhalten oder die Toleranz an die Zuggeschwindigkeit koppeln. Auf Nutzerwunsch zurückgestellt.
Nachtrag: Mit der Metropole stieg das Update auf 17–23 ms. Behoben durch den Cache der Handelnden, gedrosselte Fernplatzierung, Kampfuhren nur in der Nähe, Mittelbereich-Simulation und die Fx-Liste; Details im CHANGELOG. Stand gemessen im versteckten Fenster: 3,7–6 ms Update, 2,0–2,4 ms Zeichnen. Offen: Städte mit vielen Bewohnern liegen noch über 3 ms. Im sichtbaren Fenster muss neu gemessen werden.

## BUG-112 (behoben, Session 13) · TEST · LOW
Der Test „Reaktion: kämpfende Wache ruft Wachen im Umkreis herbei“ wackelt: Er fiel einmal durch und lief im nächsten Lauf durch, ohne Codeänderung dazwischen. Die Ursache ist noch nicht untersucht.

## BUG-113 (ZU PRÜFEN, Session 12) · NPC · MEDIUM
Im Log sterben mehrfach Wachen „an Blutung“ (Dagna, Borin, Conrad, Aldric). Vermutung: Nach Kämpfen verbindet niemand blutende NPCs, bis Blutung sie tötet. Prüfen, ob Heiler oder Wachen sich gegenseitig verbinden sollten.


## BUG-114 (behoben, Session 13) · WELT · HIGH
Die Rückkehr aus Grube, Tiefhall, Himmelsinsel oder Gruft an die Oberfläche warf `door is not defined`. Ursache: `const door = …` stand in `ARRIVAL.world` hinter dem Zeilenkommentar zum Kerker (Session 12). Fix: eigene Zeile. Test „BUG-114–117“.

## BUG-115 (behoben, Session 13) · KAMPF · HIGH
Jeder Tod des Spielers konnte zu 70 % in Ketten enden, auch durch Wölfe oder Untote. Die Wächterzeile in `captureInstead` (nur Kettenleute, nur vor der Befreiung) stand im Kommentar. Fix: eigene Zeile. Test „BUG-114–117“.

## BUG-116 (behoben, Session 13) · QUEST · MEDIUM
Die Weihe der Kette gab weder Kettenbrecher noch Eisenfürst: `addItem` stand im Kommentar. Fix und Test wie oben.

## BUG-117 (behoben, Session 13) · FRAKTION · MEDIUM
Die Befreiung der Goblins setzte den Ruf bei der Kette nicht auf −100: Die Zuweisung stand im Kommentar. Fix und Test wie oben. Vorsorge: ein Scanner (Sitzungs-Skript) sucht Code hinter `//`; `edhelp.py` blockt solche Ersetzungen.

Nachtrag BUG-112 (Session 13): Die Ursache ist die Detailstufen-Logik in `think`. Eine Figur weiter als 520 px vom Spieler denkt nur jedes dritte Bild; der Zähler startet je nach Figuren-ID. Der Test gab der Wache nur ein einziges Bild, also hing das Ergebnis von der zufälligen ID ab. Fix: Die Tests geben drei Bilder (auch „Rudel hilft, Händler schließt“). Das Spiel selbst war richtig.

## BUG-132 bis BUG-138 (behoben, Session 13b) · verschiedene
Vom Nutzer gemeldet (S13b) oder beim Testen gefunden, jeweils mit Test:
- **BUG-132 (HIGH, TEST):** Der Selbsttest schaltete `S._quiet` zwischendurch auf `false`. Fünf Proben setzten den Wert im `finally` fest zurück statt auf den vorigen. Danach lösten spätere Proben echte Kamerafahrten aus (hier: „Ende der Brüder“) und schrieben in die Chronik. Fix: Der Selbsttest ist von Anfang bis Ende still; am Ende gilt wieder der Wert von vorher. Test: „BUG-123/BUG-132“ vergleicht jetzt auch die Länge der Chronik.
- **BUG-133 (HIGH, Nutzer):** Handel am Stand oder an der Theke ging nicht. Das Möbel öffnete ein Gespräch ohne Handelsknopf. Fix: `tradeAt` öffnet den Handel direkt (`openShop`). Test „Möbel mit Funktion“ prüft das Handelsfenster.
- **BUG-134 (HIGH, Nutzer):** Das Paket ließ sich nicht abgeben. Nur der Verteidigungsmeister der Zielstadt nahm es an, und der war oft nicht zu finden. Fix: Jeder Bewohner der Zielstadt nimmt das Paket an.
- **BUG-135 (MEDIUM, Nutzer):** Die Eskorte war zu langsam, und das Ziel war unklar. Fix: Der Reisende geht selbst die Straße zum Ziel, etwa im Schritttempo des Helden. Er wartet, wenn der Held zurückbleibt, und läuft bei Gefahr zu ihm. Der Kompass zeigt das Ziel.
- **BUG-136 (MEDIUM, TEST/SPAWN):** Kopfgeldjäger konnten doch im Bild erscheinen. `pushOut` schob den Punkt hinaus, `spawnEnemy` suchte dann eine freie Stelle, die wieder im Bild lag. Aufgefallen, weil neue Figuren die Zufallsfolge verschoben. Fix: Liegt der Jäger nach dem Spawn im Bild, wird er noch einmal hinausgeschoben. Test „Audit S13 … Hinterhalte“.
- **BUG-137 (CRITICAL, von heute, vor der Auslieferung behoben):** Nach dem Einbau der Gewölbe stürzte „Fortsetzen“ ab (`adoptPropKeys` bekam für die neue Karte `vault` keine Liste). Fix: Die neue Karte hat beim Laden eine leere Grundliste. Gefunden beim nächsten Selbsttest-Lauf, der Spielstand blieb unberührt. Ein automatischer Test für das Laden fehlt noch (der Selbsttest lädt keinen Stand).
- **BUG-138 (MEDIUM):** Auftragsziele zählten nicht, wenn sie fern vom Helden starben (über 500 px, etwa durch Gefährten oder Fernkampf). Der Zweig „ferne oder verbündete Tote: keine Beute“ kehrte zurück, bevor die Aufträge davon erfuhren. Fix: Auftragsziele melden sich dort ebenfalls. Gefunden durch einen wackelnden Test der Spurensuche.

## BUG-118 (behoben, Session 13) · SPIELSTAND · HIGH
Nach dem Selbsttest startete die Garmadon-Kamerafahrt im echten Spiel. Der Test „Garmadons Tod“ löste sie verzögert aus, und die Prüfung auf Proben lief erst im Timer, als die Probe schon vorbei war. Der Held wurde dabei versetzt. Fix: `cineLater` prüft beim Auslösen. Test „BUG-118“. Der Spielstand wurde von Hand bereinigt (Position, zwei falsche Chronik-Einträge, das Orakel-Bruchstück).

## BUG-119 (behoben, Session 13) · NPC · MEDIUM
Während einer Kamerafahrt hielt ein Inquisitor den unsichtbaren Helden an. Auch Wachen (Festnahme) und Automaten (Aufenthaltsschein) hätten es getan. Fix: Sie ignorieren `cineGhost`. Test „BUG-119“.

## BUG-124 bis BUG-131 (behoben, Session 13, Audit) · verschiedene
Aus dem Audit-Durchlauf (`docs/AUDIT_S13.md`), jeweils mit Test:
- **BUG-124 (HIGH):** Lager und Grab gaben ein neues Exemplar zurück (Seltenheit, Affixe, Zustand verloren). Ursache: `addItem(key)` statt `giveItem(Exemplar)`.
- **BUG-125 (HIGH):** Schlafen filterte `bleed`/`poison`, die Zustände heißen `bleeding`/`poisoned` — die Blutung lief nach dem Aufwachen weiter.
- **BUG-126 (MEDIUM):** Begleiter richteten sofort und nur zufällig (< 50 px) auf; `protect` fehlte; Entlassene blieben im Dungeon.
- **BUG-127 (MEDIUM):** Arbeitsplätze ausgewürfelt (Platz, fremde Haustür) — Bewohner hämmerten irgendwo.
- **BUG-128 (MEDIUM):** Gegner erschienen im Bild (Hinterhalt 26–32 Kacheln, Nachschub ab 620 px, Kopfgeldjäger 16 Kacheln, Räuber am Zug).
- **BUG-129 (MEDIUM):** Siedlungsgebäude ohne Wirkung, Siedler nur als Zahl.
- **BUG-130 (MEDIUM):** Die Test-Sandbox setzte `S._quiet` auf `false` statt auf den vorigen Wert.
- **BUG-131 (HIGH, von heute):** `townDanger` stürzte bei Figuren ohne Heimatort ab (Gespräch mit Flüchtlingen).

## BUG-123 (behoben, Session 13) · TEST · HIGH
Der Selbsttest gab dem echten Helden XP und Gold. Die Sandbox stellte nur die Referenz auf den Helden wieder her, nicht seine Werte. Zwei Proben („Dienst bei der Kette“, „Phase 2 Aufträge“) gaben zusammen 90 XP je Lauf, die Karawanen-Proben durch Geleitschutz 30 Gold. Mit dem automatischen Speichern landete das im Spielstand (Stufe 12 → 13). Fix: Die Sandbox sichert XP, Stufe, Punkte, Körper, Inventar und Ausrüstung und stellt sie wieder her; die Karawanen-Proben sichern das Gold. Der Spielstand wurde auf die Sicherung vor den Proben zurückgesetzt. Test: „BUG-123: Der Selbsttest ändert den echten Helden, sein Gold und die Märkte nicht“ (vergleicht vor und nach dem ganzen Selbsttest).

## BUG-122 (behoben, Session 13) · TEST · LOW
„Beziehungen (§79)“ schlug beim zweiten Selbsttest-Lauf fehl. Die Wachstums-Probe rief `spawnResidents` auf, das die Beziehungen aller Bewohner neu plant — auch mit den Test-Bewohnern, die danach wieder verschwanden. Fix: Die Probe stellt `VILLAGERS` und die Beziehungen wieder her. Außerdem setzt die Beziehungs-Probe Laufweg und Tätigkeit der zwei Figuren vorher zurück.

## BUG-121 (behoben, Session 13) · TEST · LOW
„Omega-Glaube“ hing vom Zufallszustand ab: `makeChar` würfelt `seed` selbst und ignoriert den übergebenen Wert. Fix: Die Probe setzt `seed` danach. Dazu zählte „Einwohner folgen der Fläche“ durchreitende Grenzreiter mit (je nach Tageszeit); Reiter sind jetzt ausgenommen.

## BUG-120 (behoben, Session 13) · WELT · MEDIUM
Der Scheiterhaufen der Ketzerjagd konnte genau auf dem Dorfplatz stehen und sperrte ihn. Dadurch waren alle Türen des Dorfs „unerreichbar“ (Test „jede Haustür erreichbar“ schlug fehl). Fix: Er ist nicht mehr fest, steht versetzt, und alte Stände werden beim Laden korrigiert.
