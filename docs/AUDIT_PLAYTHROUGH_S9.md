# Audit-Durchlauf S9 — Rotfall: Legacy (Spieler-Perspektive)

## Kurzfassung

**Was ich gemacht habe:** Neues Spiel über die UI gestartet (Konrad, Ehemaliger Soldat, Haus Falkner). Eren erkundet, mit Havel, Elena, Mara, Aldric, Borin und Kelan sowie mehreren Bewohnern gesprochen; drei Aufträge angenommen (Wölfe, Grube, Kräuter). Konrad starb am Waldschrein an einem Wolf, das Spiel ging mit dem Erbe weiter (Wenna, Mutter, Schützin). Konrads Grab geplündert, Schwert und Schild angelegt, den Wolfsauftrag abgeschlossen und bei Havel abgegeben. Den Kampf systematisch getestet (Stehen gegen „Rückwärtslaufen und zuschlagen“, gegen Wolf, Goblin, Bandit, Skelett und Goblin-Krieger, jeweils 2 Runden). Ausweichen und Blocken getestet. Eren über einen ganzen Tag beobachtet (08:00, 11:20, 18:45, 20:00, 23:00, 06:45, 08:05), Tavernen-Innenraum angesehen. Zu Fuß von Eren nach Nordfurt gegangen und Nordfurt am Abend angesehen. Speichern und Laden mit echtem Seitenneuladen getestet. Erreichbarkeit per BFS über die ganze 768×768-Welt geprüft (alle Orte, alle 146 Häuser, alle benannten NPCs).

**Teleportiert:** (1) Einmal ins „Kampflabor“ auf offener Wiese (196,127) und zurück, damit die Kampftests ohne Störung laufen. Für die Messungen wurde der Charakter zwischen den Runden voll geheilt, Testgegner wurden mit `RF.spawnEnemy` erzeugt. Nebeneffekt: Wenna stieg dadurch auf Stufe 7. (2) Die Übersichtsbilder stammen von einer frei gesetzten Kamera (Zoom 0,42–0,5). Den Weg Eren → Nordfurt und alle Stadtwege bin ich gelaufen.

**Wie weit ich kam:** Checkliste 1, 2, 4, 9 und 10 vollständig. 3 teilweise (1 von 3 Aufträgen erledigt). 5 teilweise (nur Nordfurt). 6 nur über das Log. 7 und 8 nicht getestet (siehe Ende).

### Top 10 Probleme (nach Wichtigkeit)

1. **Kampf ist trivial durch „zuschlagen und zurückweichen“.** Der Spieler ist mit 2,57 px/Frame 1,7–2,2× so schnell wie jeder Gegner (Wolf 1,55, Bandit 1,4, Goblin 1,35, Skelett 1,15). Mit Rückwärts-Kiting nahm ich in 9 von 10 Kämpfen 0 Treffer, im Stand 1–4 Treffer. (HIGH)
2. **NPC-Verteidiger (Kelan) „kämpft“ endlos gegen Wölfe, ohne Schaden zu machen, und blockiert dabei Dialog und Rettung.** Kelan stand 1 Kachel neben dem Wolf, der Konrad tötete. Der Wolf blieb bei 35/35 LP, Kelan half dem am Boden liegenden Spieler nicht. (HIGH)
3. **Gerüchte sind komplett statisch.** Karawanenüberfälle, „Moorland fällt an die Untoten“, Flüchtlinge und Schlachten erwähnt niemand. „Was gibt es Neues?“ wiederholt 3–4 feste Sätze. (HIGH, Immersion)
4. **Wolfsschlucht ist unerreichbar.** Eine 267 Kacheln große Lichtung mit 4 Wölfen und 1 Banditen ist rundum von Fels eingeschlossen. Der Auftrag „Ruf des Hains“ nennt genau dieses Rudel. Auch die Nebelinsel (1343 Kacheln) ist unerreichbar, und es gibt keine Fähre. (HIGH)
5. **Frühtod ohne Warnung:** Eine Stufe-1-Figur (132 LP) verblutete 10 Kacheln vor Eren an einem einzelnen Wolf (12:19 Arm fällt aus, 12:21 Zusammenbruch, 12:36 Tod). Kein Hinweis, dass der Waldrand am Schrein gefährlich ist. (HIGH, Balance/Onboarding)
6. **Mit E lässt sich kein bestimmtes Ziel wählen.** In Gedränge und neben Kräutern trifft E das Falsche. Brann in Nordfurt war nach 6 Versuchen nicht ansprechbar (immer „Oda“). Elena wurde von „Jost“ verdeckt, Kelan von einem Kraut. (HIGH, UI)
7. **Dorfleben wirkt statisch.** Zwischen 08:05 und 11:21 bewegten sich 0 von 40 Bewohnern von Eren mehr als 5 Kacheln, im Mittel 0,4–0,6 Kacheln. Kein Mittagessen, niemand sitzt, niemand arbeitet auf den Feldern. Abends stehen in Nordfurt 11–12 Leute als Pulk vor der Tavernentür, drinnen sind 1–3. (MEDIUM-HIGH)
8. **Zielen veraltet beim Laufen.** `mouse.wx/wy` wird nur bei `mousemove` neu berechnet. Läuft man ohne Mausbewegung, zielt die Figur auf einen alten Weltpunkt und dreht sich beim Vorbeilaufen um. (MEDIUM)
9. **Die Weltkarte ist am Start unlesbar.** Symbole und Beschriftungen um Eren überlappen, eine Heer-Flagge „40“ liegt auf dem Namen „Eren“. Es gibt keine Legende, und die Quest-Marker sind nicht erklärt. Der Auftragstext nennt „Hürde“ und „Waldrand“, beides steht nirgends auf der Karte. (MEDIUM)
10. **Namens- und Rollengenerator:** 5× „Jost (Magd)“, 4× „Gero (Bauer)“ allein in Eren. Männernamen als „Magd“ (Jost, Sigbert, Notker, Folkmar). Bewohner eines Haushalts stehen morgens pixelgenau übereinander (3 Figuren auf 69.5,93.5). (MEDIUM)

---

## Befunde nach Kategorie

### Combat

**BUG:** Rückwärtslaufen + Zuschlagen besiegt jeden Gegnertyp gefahrlos
LOCATION: offene Wiese (196,127); gilt überall
CATEGORY: Combat / Balance
WHAT HAPPENED: Taktik: warten, bis der Gegner in Reichweite ist, einmal schlagen, 450 ms zurücklaufen, wiederholen.
EXPECTED: Gegner bestrafen das, etwa durch Ausfallschritt, Sprint, Flankieren oder schnellere Angriffe.
ACTUAL: Kiting brachte Siege in 0,9–11 s mit 0 kassierten Treffern gegen Wolf, Goblin (2×), Bandit (2×) und Skelett (1× Sieg, 1× Zeitlimit). Nur der Goblin-Krieger traf einmal (1 Treffer in 2 Kämpfen). Im Stand gab es 1–4 Treffer pro Kampf (10–32 LP).
WHY THIS MATTERS: Der Kern-Loop wird trivial, und Wegrennen ist immer möglich.
SEVERITY: HIGH
POSSIBLE ROOT CAUSE: `speedOf()` (game.js:97) gibt dem Spieler 2,25 + AGI·0,045 ≈ 2,6 px/Frame, Gegner laufen mit `MONSTERS.*.speed` 1,15–1,55 (data.js:136ff). Gehen kostet praktisch keine Ausdauer: nach 20 s Laufen blieb die Ausdauer bei 114/114. In `updateEnemy` (game.js:1664) stoppen Gegner bei `d < reach*0.8` und holen erst aus, statt nachzusetzen.
EVIDENCE: Messwerte oben; Wolf springt (Ansage 280 ms, Sprung 190 ms) nur ~1 Kachel weit.

**BUG:** Gegner sterben mit 40–85 % Rest-LP (Körperteil-Tod), teils durch einen einzigen Hieb
LOCATION: Kampflabor
CATEGORY: Combat / Balance
WHAT HAPPENED: Ein Goblin fiel nach 1 Hieb mit dem rostigen Kurzschwert und hatte noch 49/58 LP. Ein Bandit fiel bei 57/96, ein Skelett bei 66/97.
EXPECTED: Die LP-Leiste zeigt, wie nah der Gegner am Tod ist.
ACTUAL: Die LP-Leiste taugt nicht als Anzeige. Kopf- und Rumpftreffer entscheiden.
WHY THIS MATTERS: Der Kampf fühlt sich zufällig an, die Leiste lügt.
SEVERITY: MEDIUM
POSSIBLE ROOT CAUSE: body.js (Körperteil-LP) gegen `e.hp` als Gesamtwert.
EVIDENCE: Protokoll der Labor-Läufe.

**BUG:** Blocken mit Holzschild hebt Schaden fast auf
LOCATION: Kampflabor, Skelett
CATEGORY: Combat / Balance
WHAT HAPPENED: 10 s lang Shift gehalten.
ACTUAL: 7 Treffer kosteten zusammen nur 11 LP (~1,6 LP pro Treffer), Ausdauer 114 → 65.
SEVERITY: LOW-MEDIUM (zusammen mit Befund 1 wird es noch leichter)
EVIDENCE: Messung.

**BUG:** Ausweichrolle
CATEGORY: Combat
ACTUAL: 17 Ausdauer, Unverwundbarkeit bestätigt, 450 ms Abklingzeit. 10 Versuche in schneller Folge ergaben 5 Rollen, Ausdauer danach 37. Funktioniert. Weil Laufen allein reicht, braucht man die Rolle aber kaum.
SEVERITY: LOW (Info)

**BUG:** Zielrichtung veraltet beim Laufen
LOCATION: game.js `bindInput` (mousemove, Z. 3494) / `controlPlayer` (Z. 1201)
CATEGORY: Combat / UI
WHAT HAPPENED: `p.aim = atan2(mouse.wy - p.y …)` nutzt einen Weltpunkt, der nur bei Mausbewegung neu berechnet wird.
EXPECTED: Der Cursor ist ein Bildschirmpunkt. Bewegt sich die Kamera, zeigt er auf einen neuen Weltpunkt.
ACTUAL: Läuft der Spieler bei ruhender Maus, bleibt das Ziel ein fester Weltpunkt. Nach dem Vorbeilaufen schlägt die Figur nach hinten.
SEVERITY: MEDIUM
POSSIBLE ROOT CAUSE: Nur die Zeilen 3498 und 3525 setzen `mouse.wx`. Fix: einmal pro Frame `R.screenToWorld(mouse.x, mouse.y)` neu berechnen.

**BUG:** Körper dreht sich beim Zielen nicht mit, nur die Waffe kreist
CATEGORY: Animation
WHAT HAPPENED: Im Stand in 8 Richtungen gezielt.
ACTUAL: Der Körper-Sprite behält die Laufrichtung, nur das Schwert rotiert um die Hand. Der Hieb selbst ist ein sichtbarer Bogen über ~6 Frames, das ist in Ordnung.
EXPECTED: Blickrichtung und Pose folgen dem Ziel.
SEVERITY: LOW-MEDIUM
EVIDENCE: audit-10-weapon-aim-and-swing.png (obere Reihe: 8 Zielrichtungen, untere Reihe: Hieb; nachts, daher dunkel)

**BUG:** Gegner bleiben am Flussufer hängen und stapeln sich
LOCATION: Fluss bei ~(163,122)
CATEGORY: Combat / NPC AI
WHAT HAPPENED: Gegner jenseits des Flusses fanden keinen Weg.
ACTUAL: 4 Wölfe und ein Goblin-Krieger standen aufeinandergestapelt am Ufer. Mit dem Bogen kann man sie gefahrlos abschießen.
SEVERITY: MEDIUM
EVIDENCE: audit-09-wolf-standoff.png

### NPC AI

**BUG:** Kelan (und vermutlich alle „DEFENDERS“) führt Scheinkämpfe gegen Wildtiere
LOCATION: Waldschrein / Eren-Wald (113,69)
CATEGORY: NPC AI / NPC interaction
WHAT HAPPENED: Kelan stand 1 Kachel neben dem Wolf, sein `atkCd` lief ständig durch, der Wolf blieb bei 35/35 LP und im Zustand „idle“. Dialog: „Nicht jetzt — siehst du nicht, was hier los ist?!“ Als Konrad daneben lag und verblutete, half Kelan nicht.
EXPECTED: Der Verteidiger tötet den Wolf oder ignoriert ihn. Ein Verteidiger stabilisiert den gestürzten Spieler.
ACTUAL: Endlose Pattsituation. Die Ausbildung bei Kelan ist blockiert, bis der Spieler den Wolf selbst tötet.
WHY THIS MATTERS: Der Tod des Spielers wirkt unfair, der Paladin wirkt dumm, der Dialog ist gesperrt.
SEVERITY: HIGH
POSSIBLE ROOT CAUSE: `updateNpc` (game.js ~1950) sucht Bedrohungen über `teamOf(x)==='foe'` relativ zum Spieler. `isHostile(kelan, wolf)` ist aber false, weil NPCs `teamOf` = 'neutral' haben (Z. 1300). `hit()` wirkt also nicht. Der Kampf-Zweig kehrt vor dem Zweig „Spieler liegt am Boden → helfen“ zurück.
EVIDENCE: audit-06-kelan.png, audit-08-kelan-wolf.png; `RF.isHostile(kelan,wolf)=false`, `teamOf(wolf)='foe'`.

**BUG:** NPCs außerhalb von 900 px frieren ein
LOCATION: Eren (75 Kacheln breit)
CATEGORY: NPC schedules / Performance
WHAT HAPPENED: 13 von 39 Bewohnern waren mehr als 900 px (28 Kacheln) vom Spieler am Platz entfernt und standen still. Morgens standen 3er-Haushalte pixelgleich auf dem Spawnpunkt (z. B. Jost, Walburg und Dietmar auf 69.5,93.5, Arbeitsplätze 15–43 Kacheln entfernt), 40 s ohne Bewegung.
EXPECTED: Grobe Simulation auf Distanz oder Einrasten beim Näherkommen.
ACTUAL: Man sieht Leute, die erst loslaufen, wenn man ankommt, und gestapelte Figuren.
SEVERITY: MEDIUM
POSSIBLE ROOT CAUSE: `updateNpc`: `if (dist(e,p) > 900) { e.vx=e.vy=0; return; }` (game.js:1925). Es gibt keinen Catch-up des Tagesplans.

### NPC schedules / Stadtleben

**BUG:** Tagsüber nahezu keine Bewegung, kein Mittag, niemand sitzt
LOCATION: Eren
CATEGORY: NPC schedules / Immersion
ACTUAL (Messungen, jeweils 20–40 s beobachtet):
| Zeit | Ø Verschiebung | nie bewegt | >5 Kacheln | sitzend |
|---|---|---|---|---|
| D1 08:04 | 6,7 Kacheln | 14/40 | 15 | 0 |
| D2 08:05 | 0,6 | 20/40 | 0 | 0 |
| D2 11:21 | 0,4 | 22/40 | 0 | 0 |
| D2 18:46 | 1,8 | 22/41 | 2 | 0 |
| D1 23:02 | 3,6 | 21/39 | 10 | 0 |
Die drei Bauern (Jorun, Hartwig, Oda) haben denselben Arbeitspunkt (64,114). Die Felder bleiben leer. Um 08:05 und 11:21 steht dieselbe Gruppe von 6 Leuten am Markt. Keine NPC-zu-NPC-Interaktion gesehen (keine Gespräche, kein Handel).
EXPECTED: Wechsel zwischen Arbeit, Pause und Wegen, sichtbare Tätigkeiten.
WHY THIS MATTERS: Das Dorf wirkt wie Kulisse mit Statisten.
SEVERITY: MEDIUM-HIGH
POSSIBLE ROOT CAUSE: `updateNpc` „Tagesablauf“ (game.js ~2002): nur die Ziele Anker, Arbeitsplatz und `eve`, dazu ein Wander-Jitter von 6–46 px.
EVIDENCE: audit-03-eren-overview-0800.png, audit-12-eren-0805.png, audit-13-eren-1215.png, audit-14-eren-1830.png, audit-11-eren-night-2300.png

**BUG:** Abendpulk vor der Tavernentür
LOCATION: Nordfurt, Taverne (Tür 206,85)
CATEGORY: NPC schedules / City
WHAT HAPPENED: Um 21:00 standen 11 NPCs im Umkreis von 3 Kacheln um die Tür, drinnen 1. Nach 30 s waren es 12 draußen und 3 drinnen. Beide Wirte (Irmel, Udo) stehen draußen.
EXPECTED: Gäste gehen hinein, sitzen, der Wirt steht hinter dem Tresen.
ACTUAL: Die `eve`-Punkte liegen gezielt vor der Tür (z. B. 207.6,86.5). Es sieht aus wie eine Schlange oder ein Mob.
SEVERITY: MEDIUM
POSSIBLE ROOT CAUSE: Vergabe der Abendplätze (game.js ~455–513). Überzählige Gäste bekommen Plätze vor dem Haus.
EVIDENCE: audit-17-nordfurt-2100.png, audit-18-nordfurt-tavern-door-2100.png

**BUG:** Taverne in Eren ist winzig und leer
LOCATION: Eren, Taverne (81,90, 6×5)
CATEGORY: City / Immersion
ACTUAL: Um 20:00 waren 3 Personen drinnen, alle stehend (Borin, Gero, Jost). Niemand nutzt die Bank. 5 weitere Leute stehen vor dem Haus.
SEVERITY: LOW-MEDIUM
EVIDENCE: audit-15b-eren-tavern-inside.png, audit-15-eren-tavern-2000.png

**BUG:** Wachen stehen, patrouillieren nicht
LOCATION: Eren (Ivo, Hedda, Berit, Conrad)
CATEGORY: NPC AI
ACTUAL: Die 4 Torwachen standen in allen Messfenstern an ihrem Anker (in der Liste „nie bewegt“). Die Karawanenwachen standen in Eren übereinander (2 Figuren mit Speeren überlappend).
SEVERITY: MEDIUM
EVIDENCE: audit-02-eren-outside.png, audit-15-eren-tavern-2000.png

### NPC interaction / UI

**BUG:** E hat keine Zielwahl, Personen in Gruppen sind nicht ansprechbar
LOCATION: Eren (Elena/Jost, Kelan/Kraut), Nordfurt (Brann/Oda)
CATEGORY: UI / NPC interaction
WHAT HAPPENED: Bei Elena öffnete sich der Dialog von „Jost“. Neben Kelan kam dreimal „E Kräuter sammeln“. Brann (in der Taverne, 1,3 Kacheln entfernt): 6 Versuche aus verschiedenen Positionen und mit Maus auf Brann ergaben 6× „Oda“.
EXPECTED: Hover oder Rechtsklick-Auswahl (`selected`) hat Vorrang.
ACTUAL: `interactables()` (game.js:2151) nimmt nur das Nächstgelegene innerhalb von 62 px. `doInteract` ignoriert `selected` und `hovered`.
SEVERITY: HIGH (kann Quest-Geber sperren)

**BUG:** Gerüchte ignorieren die Weltsimulation
LOCATION: alle NPCs, `gossip()` game.js:2558
CATEGORY: World consequences / Immersion
WHAT HAPPENED: Laut Log wurde eine Karawane ausgeraubt, „Moorland fällt an Die Untoten“, „Flüchtlinge erreichen Eren. Die Preise steigen.“ Havel sagte danach 5× hintereinander 3 feste Sätze („Rook sitzt im Moor…“, „An der Nordfurt sammelt Valen Männer…“).
EXPECTED: NPCs reden über die letzten Ereignisse.
ACTUAL: Eine feste Liste mit Stadtzusatz. „Die Grube ist verloren“ bleibt auch dann stehen, wenn das Log „In der Grube wurde eine neue Ader gefunden“ meldet.
SEVERITY: HIGH (die Welt reagiert nicht)

**BUG:** Erbin wird als Fremde begrüßt
LOCATION: Havel, nach dem Erbwechsel
CATEGORY: Logic / Immersion
ACTUAL: Wenna, die Mutter des toten Konrad, führt dessen Aufträge weiter. Havel sagt: „Fremde bringen entweder Arbeit oder Ärger.“ Seine Antwort bei der Abgabe: „Das war mehr, als ich erwartet habe.“
SEVERITY: LOW

### Quest

**BUG:** Ortsangaben im Auftrag sind unklar
LOCATION: „Wölfe an der Hürde“ (data.js:456)
CATEGORY: Quest / Navigation
WHAT HAPPENED: Titel „an der Hürde“, Text „am Waldrand“, Ziel „Wölfe töten 0/3“.
EXPECTED: Ein Ort, der auf der Karte oder einem Wegweiser steht.
ACTUAL: „Hürde“ existiert nirgends. Im Eren-Wald lief genau 1 Wolf. Die übrigen Wölfe waren an der Alten Feste (Westen) und im Moorland (Süden). Die Karte zeigt nur unbeschriftete gelbe Symbole.
SEVERITY: MEDIUM
EVIDENCE: audit-04-map-quest.png, audit-05-map-eren-zoom.png

**BUG:** Auftrag „Ruf des Hains“ verweist auf das unerreichbare Rudel der Wolfsschlucht
CATEGORY: Quest / Map access
SEVERITY: MEDIUM (Wölfe gibt es auch anderswo, das Ziel zählt nur „wolf“)

**Positiv:** Auftrag Wölfe abgeschlossen (60 Gold, +5 Valen). Das Anschlagbrett funktioniert. Der Wegweiser am Schrein („Grube ↑ · Ruine ← · Schrein →“) hilft.

**BUG:** Name falsch geschrieben: „Jorans Tochter“ statt „Joruns Tochter“
LOCATION: data.js:436 (Beruf von Lila), sprites.js:115
CATEGORY: Quest / UI
SEVERITY: LOW

### Map access / Navigation (BFS-Ergebnis)

BFS ab dem Markt von Eren, 4er-Nachbarschaft, blockiert durch SOLID-Kacheln und feste Props: **509.277 von 520.922 begehbaren Kacheln erreichbar (97,8 %)**. Alle 146 Häuser haben erreichbare Innenräume. Keine Tür führt gegen eine Wand. Alle 21 benannten NPCs stehen erreichbar.

**BUG:** Wolfsschlucht ist ein geschlossener Felskessel
LOCATION: Wolfsschlucht (Zentrum 67,451, Box 57–79 × 440–460)
CATEGORY: Map access
ACTUAL: 267 Kacheln ohne Zugang, darin 4 Wölfe und 1 Bandit. Die nächste erreichbare Kachel liegt 14 Kacheln vom Ortsmittelpunkt. Optisch ist es ein exakt quadratisches Loch in einem Felsring, das wirkt künstlich.
SEVERITY: HIGH
EVIDENCE: audit-16-wolfsschlucht-overview.png. Zu Fuß nicht verifiziert (weit entfernt), nur BFS und Bild.

**BUG:** Nebelinsel unerreichbar
LOCATION: Nebelinsel (135,750; 1343 Kacheln)
CATEGORY: Map access
ACTUAL: Kein Steg, keine Fähre (kein Code zu „mistisle“ in game.js/sim.js), dabei als Ort mit Szenen („drowned“, „shrine“) angelegt.
SEVERITY: MEDIUM

**BUG:** Weitere abgeschlossene Taschen
CATEGORY: Map access
ACTUAL: 185 abgeschlossene Bereiche mit mindestens 6 Kacheln, zusammen 3.847 Kacheln. Größter unbenannter: 608 Kacheln an der Südküste (432–466 × 740–767). Dazu viele kleine Felstaschen im Frostkamm und in der Roten Wüste (14–38 Kacheln), alle ohne Wesen.
SEVERITY: LOW

**BUG:** NPC steht auf einem blockierten Feld
ACTUAL: Havels Arbeitsplatz (83,103) liegt auf einer laut Kollisionsprüfung blockierten Kachel. Man erreicht ihn trotzdem von einer Nachbarkachel aus.
SEVERITY: LOW

### World simulation / World consequences

**BUG:** Frühere Ereignisse und Karawanen bleiben ohne sichtbare Folgen in der Stadt
CATEGORY: World simulation
ACTUAL: In 36 Spielstunden zeigte das Log 6 Überfälle oder Abwehren und 10 Ankünfte. In Eren sah ich keine Reaktion (siehe Gerüchte). Die Meldung „Flüchtlinge erreichen Eren“ hatte keine sichtbaren neuen Figuren zur Folge (Zählung 39 → 41 NPCs, das sind Karawanenwachen). Gesehen, dass eine Karawane überfallen wird, habe ich nicht (nicht beobachtet, siehe unten).
SEVERITY: MEDIUM

**BUG:** Log-Meldung „Tag 2 bricht an“ um 20:04
LOCATION: Laden eines Spielstands
CATEGORY: Logic / Save/load
ACTUAL: Direkt nach „Fortsetzen“ (D2 20:04) meldete das Log „Die Welt erinnert sich. / Tag 2 bricht an.“, obwohl Tag 2 schon den ganzen Tag lief.
SEVERITY: LOW

**BUG:** Startmeldung passt nicht zum Startort
CATEGORY: Logic
ACTUAL: „Im Norden liegt Eren“, aber man startet in einem Haus mitten in Eren (100,104).
SEVERITY: LOW
EVIDENCE: audit-01-start.png

### Balance / Onboarding

**BUG:** Tod an einem einzelnen Wolf 10 Kacheln vor dem Dorf
LOCATION: Waldschrein / Eren-Wald (112,70)
CATEGORY: Balance
WHAT HAPPENED: Konrad (Stufe 1, 132 LP, Schwert und Schild) lief auf dem Weg zu Kelan in einen Wolf. 12:19 linker Arm ausgefallen, 12:21 Zusammenbruch, 12:36 Tod durch Blutung. Kelan stand daneben (siehe NPC AI).
EXPECTED: Frühe Gegner sind lesbar, Hilfe kommt, oder es gibt Warnung und Zeit zum Verbinden.
ACTUAL: Hätte ich aktiv gekämpft, wäre es vermutlich zu gewinnen gewesen (Befund 1). Das Ausbluten ohne Rettung wirkt aber hart. Bemerkenswert: Die Wache und die Heilerin im Dorf merkten nichts.
SEVERITY: MEDIUM-HIGH

**BUG:** Erbe-Auswahl
CATEGORY: Logic
ACTUAL: Zur Wahl stehen nur die Eltern (46 und 45 Jahre), beide „Schütze“, obwohl der Verstorbene Soldat war. Der Grabspruch nennt „Konrad, Wanderer“ statt der Herkunft. In der HUD-Klasse stand von Anfang an „WANDERER“, obwohl ich „Ehemaliger Soldat“ gewählt hatte.
SEVERITY: LOW-MEDIUM (verwirrend: Herkunft ≠ Klasse wird nicht erklärt)

**Positiv:** Grab mit Beute, Gegenstände per E einzeln geborgen, Aufträge bleiben erhalten.

### UI

**BUG:** Weltkarte überladen und ohne Legende
CATEGORY: UI / Navigation
ACTUAL: Die ganze Welt mit allen „?“-Orten ist von Anfang an sichtbar. Um Eren überlappen etwa 10 Symbole, die Heer-Flagge „40“ verdeckt „Eren“, und „Eren-Wald“ überlappt „Eren“. Die Startregion nimmt ~1/15 der Kartenfläche ein, Zoom gibt es nicht.
SEVERITY: MEDIUM
EVIDENCE: audit-04-map-quest.png, audit-05-map-eren-zoom.png

**BUG:** „Neue Geschichte“ überschreibt den Spielstand ohne Rückfrage
CATEGORY: UI / Save/load
ACTUAL: Ein vorhandener Spielstand wurde ohne Nachfrage ersetzt. Das Feld „Haus“ ist mit dem Vornamen vorbelegt (Ragnar/Ragnar).
SEVERITY: MEDIUM

### City / Visuals

**BUG:** Eren wirkt wie eine Streusiedlung
LOCATION: Eren
CATEGORY: City / Immersion
ACTUAL: Die Fläche ist 75×50 Kacheln, dazwischen große leere Wiesen. Die meisten Häuser sind identisch, drei haben ein Loch im Dach. Einen erkennbaren Dorfkern gibt es nur an der Kreuzung mit den Marktständen.
SEVERITY: MEDIUM
EVIDENCE: audit-03-eren-overview-0800.png, audit-12-eren-0805.png

**BUG:** Waldschrein ist eine leere Steinfläche mit Grabstein und 2 Fackeln
SEVERITY: LOW
EVIDENCE: audit-08-kelan-wolf.png

**BUG:** Überlappende Figuren
ACTUAL: Nach dem Aufwachen gab es 9–12 NPC-Paare mit weniger als einer halben Kachel Abstand (morgens 12, abends 5, nachts 1). Karawanenwachen stehen übereinander.
SEVERITY: MEDIUM
EVIDENCE: audit-02-eren-outside.png

**BUG:** Beute und Knochen bleiben liegen
ACTUAL: Nach den Laborkämpfen lagen Dutzende Waffen und Knochen auf der Wiese. Die Zahl der Entities stieg von 8.897 auf 9.020.
SEVERITY: LOW
EVIDENCE: audit-10-weapon-aim-and-swing.png (Hintergrund)

### Performance

**BUG:** Hohe Frame-Kosten nahe Eren
CATEGORY: Performance
ACTUAL: `update` braucht ~4,5 ms pro Frame, `drawFrame` ~5,5 ms (Messung am Platz von Eren, 9.020 Entities in der Welt, davon ~8.350 Props). Zusammen ~10 ms von 16,7 ms, das ist auf schwächeren Rechnern knapp. Beim Tick in Nordfurt lief eine Spielstunde in 17 s statt 13 s.
SEVERITY: LOW-MEDIUM

### Save/load

**OK:** Mit `RF.save()`, Seitenneuladen und „Fortsetzen“ blieben Position, LP, Gold, Tag, Aufträge, Inventar, Ausrüstung, Stufe, NPC-Positionen, Gräber, Karawane und Gegnerzahl identisch (nur Rundung). Der Spielstand ist 668 KB groß (localStorage), das ist tragbar, liegt aber bei ~13 % der üblichen 5-MB-Grenze.

---

## Nicht getestet (und warum)

Der Koordinator hat den Lauf abgebrochen, weil lange Browser-Aufrufe (Zeitraffer, `tick`) zu viel Zeit brauchten. Offen:
- **Karawane live (Punkt 6):** Überfall und Reaktion nicht selbst beobachtet, nur über das Log. Code-Stelle gefunden: sim.js `caravanFrame` (Z. 157), `caravanDied` (Z. 209).
- **Dungeons Grube und Tiefhall (Punkt 7):** nicht betreten. Auftrag „Was in der Grube haust“ (Gorak) ist angenommen, aber offen.
- **Vharnholm, Totenreich, Befreiung (Punkt 8):** nicht besucht.
- **Weitere Städte (Punkt 5):** Salzhafen, Kreuzweg, Aschfurt und Sonnwacht nicht bereist, nur Nordfurt.
- **Aufträge:** Kräuter bei 2/3, Lila (Jorun) und Grube offen, Kelans Prüfungen wurden nicht angeboten (Bedingung unklar).
- **Wolfsschlucht zu Fuß:** nur per BFS und Bild bestätigt, nicht vor Ort abgelaufen.
- **Bogen gegen Kiting:** nur ein Kurztest (Wolf in 2,2 s ohne Schaden). Fernkampf-Kiting ist wegen des Tempovorteils vermutlich ebenso trivial.
- **Audio:** im versteckten Browserfenster nicht beurteilbar.
- **Handel, Talente, Gruppe, Siedlungsbau:** nicht angefasst.

## Screenshots (docs/screenshots/)
audit-01-start, 02-eren-outside, 03-eren-overview-0800, 04-map-quest, 05-map-eren-zoom, 06-kelan, 07-death-world, 08-kelan-wolf, 09-wolf-standoff, 10-weapon-aim-and-swing, 11-eren-night-2300, 12-eren-0805, 13-eren-1215, 14-eren-1830, 15-eren-tavern-2000, 15b-eren-tavern-inside, 16-wolfsschlucht-overview, 17-nordfurt-2100, 18-nordfurt-tavern-door-2100
