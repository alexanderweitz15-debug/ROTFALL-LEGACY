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
- Lösung: Phase 13/15 — Stadtbewohner aus Gebäuden ableiten (wer wohnt/arbeitet wo).
- Status: OFFEN (Phase 13)

## MEDIUM

### BUG-009 — Tiefhall sieht aus wie ein Mineneingang, ist aber nicht betretbar
- Kategorie: SZENENÜBERGANG / CONTENT · Status: OFFEN (Phase 14)

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
- Kategorie: WORLD LOGIC / VISUAL · Status: OFFEN (Phase 16)

### BUG-012 — Mobil nicht spielbar: keine Touch-Steuerung
- Layout passt (keine horizontale Scrollbar), aber es gibt keine Touch-Eingabe (0 Treffer für touch/pointer).
- Kategorie: MOBILE · Status: OFFEN (Phase 19)

### BUG-013 — NPCs ohne echten Tagesablauf (Händler stehen rund um die Uhr am Fleck)
- Kategorie: NPC · Status: OFFEN (Phase 15)

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
- Kategorie: VISUAL · Priorität: POLISH · Status: OFFEN (Phase 5)

### BUG-017 — Spielstand ~800 KB (alle Props werden gespeichert)
- Risiko für das localStorage-Limit (~5 MB), wenn die Welt wächst. Props sind aus dem Seed reproduzierbar.
- Kategorie: SAVE-LOAD / PERFORMANCE · Priorität: LOW · Status: OFFEN (Phase 20)

---

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
