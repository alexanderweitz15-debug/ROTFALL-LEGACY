# Varonheim-Belagerung Scheibe 3: Sturm vor Ort, Burgbezirk, König fortbringen

**Status:** PROPOSED · **Autor:** Designer · **Stand:** 01.10.2026 (abends)
Ersetzt §5.5 und den S3-Teil von §16 in `varonheim_belagerung.md`. Die Grundlage hat sich geändert: Die Varonsburg liegt jetzt in der Weltkarte (Umbau S2–S5).
Kennzeichnung: **FAKT** = gelesen (Datei:Zeile, Stand dieser Lesung), **VORSCHLAG**, **ANNAHME**.
Bindend: DECISIONS.md, 01.10.: „König vor dem Fall fortbringen: **ja**, im Gespräch mit Gero/Brandt während der Belagerung (Belagerung S3).“ Außerdem gelten Heerzug, Exil Salzhafen→Nordfurt→Eren, Rückeroberung in 4 Wellen und keine Rückkehr der zerstreuten Adligen.

---

## 0. Neue Lage (FAKT)
- **Hof in der Welt:** `ensureVaronCourt()` (`game.js:8516`) baut den Hof als flüchtige `varonCourt`-Figuren in die Burgbauten `varon_throne/nobles/kanzlei/verlies/schmiede` (`world.js:1382–1386`). Die Funktion bricht ab, wenn `SIM.capitalFallen()` gilt (`8519`). Aufgerufen wird sie **nur** beim Laden/Neustart (`1875`, `2146`), aus `buildVaronburg` (`8672`) und aus einer Probe (`18105`).
- **Hilfen:** `courtEnts()` und `courtDrop(pred)` (`8513–8514`). Die Torwache Gerold trägt `keepWarden` (`8541`), sechs Königsgardisten tragen `courtFolk`/`guard` (`8540`).
- **Burgfrieden:** Die Zone ist `keepZone()` = CAPITAL.x ± 30 über 21 Zeilen ab dem Nordrand (`8551`). `keepTick` alle 250 ms (`2392`) ruft `keepHalt`, `keepLeave` und `keepDraw`. **Bei `capitalFallen()` ist der Burgfrieden aus** (`8658`), und Hagen schickt das Depot per Bote zurück (`8657`). Eine laufende Belagerung (`n.siege`) **berücksichtigt keepTick nicht**.
- **Gespeichert werden** `S.keepDepot[id]`, `S.keepPass[id]`, `S.keepStash` sowie die Flags `keepSusp` und `keepBribeDay`.
- **Schmuggel:** `keepHide`/`keepSmuggleOdds` (`8620–8633`) und `servantSmuggle` (Diener, 300 Gold, am Folgetag, 15 % Verrat; `8638`).
- **Kellerweg:** Die Kellertreppe der Kanzlei (`cellarStair`, Portal `katakomben`) gibt es **nur mit `S.cult.keyB`** (`8524`). `viaB` führt aus den Katakomben zurück in die Kanzlei (`5029`, `5086`). Eingang A ist die Gruft am Friedhof im Nordwesten der Stadt (`ensureCatacombGate`, `13326`: `x0+6, y0+9`, also innerhalb der Mauern nahe dem Westtor). Über `keepHalt` gilt (`8602`): Wer über den Keller kommt, wird erst angehalten, wenn ihn die Garde sieht.
- **Start in Varonheim:** `capStart` (`1919`) erhöht die Zahl der Spieler, die beim Heerzug (frühestens Tag 75, auf Sehr schwer 60) die Stadt und den Hof gut kennen.
- **Belagerung (gebaut S1/S2):** `siegeTick` (`sim.js:88`) ist vorhanden. Ein Sturm vor Ort ruft `materialize(CAPK, und, def)` (`sim.js:104`). Die Funktion ist **allgemein**: Skelette gegen `valen_soldier`, Stufe 4, 2–7 Figuren je Seite, am Ortsmittelpunkt (`sim.js:490–505`). `n.fedTill` wird gelesen (`sim.js:97`), aber nirgends geschrieben.
- **Evakuierung:** Die Flagge `S.flags.varonEvac` liest nur `capitalFall` (`8345`). Gesetzt wird sie nur im Debug (`14815`), es gibt keinen Spielweg.
- **Funde (Fehler, unabhängig von S3):**
  - **F-A:** `capitalFall` (`8343–8360`) räumt `courtEnts()` nicht ab und ruft `ensureVaronCourt` nicht. Bis zum Neuladen stehen Varon, Aldhelm, die Garde und Gerold im besetzten Thronsaal. Gleichzeitig baut `ensureVaronExile` einen **zweiten Varon** in Salzhafen. Wer den Thronsaal-Varon erschlägt, löst `kingDeath` aus, obwohl der König im Exil lebt.
  - **F-B:** `capitalFreed` (`8498–8509`) ruft `ensureVaronCourt` nicht. Der Exilhof verschwindet, aber der Hof erscheint erst nach dem Neuladen wieder in der Burg.
  - **F-C:** Der Schutz aus dem Umbau-Entwurf §4.3 (Hoffiguren nehmen nur Schaden vom Spieler, von Gästen oder in der Belagerung) ist **nicht gebaut**; kein Treffer in `hurt`. Für S3 wird das wichtig, sobald Untote im Burgbezirk stehen.
  - **F-D:** `cultCrown` entfernt auch den Exilkönig (`13455`, `exileCourt && varonKing`). Ein fortgebrachter König kann also weiter „im Schlaf sterben“.

---

## 1. Sturm: Stadt und Burgbezirk vor Ort

### Ablauf (VORSCHLAG)
Der Sturm vor Ort läuft in zwei Phasen. `materialize` bekommt für `CAPK` einen eigenen Zweig `capitalStorm(und, def, phase)` in `sim.js`. Ein Haken `H.capStorm` in `game.js` stellt die Figuren auf.
- **Phase 1, die Bresche:** Die Mauern stehen auf 0, und der Spieler ist im Umkreis `nearPlayer(CAPK)` (r 70). Die Angreifer erscheinen vor dem **Südtor** (557–559, 150), mit `undeadMix(n, 'town')`, Stufe 9 und mindestens einem `flesh_golem`. Verteidiger sind die `capGuard`-Posten in der Unterstadt, dazu `valen_soldier` der Stufe 9 aus den Häusern (wie heute). Gero steht am Südtor. Gefallene senken die Stärke wie bisher über `unitDied`.
- **Phase 1 gehalten** (Angreifer tot oder Zeitlimit mit Verteidigern im Vorteil): Es gilt die heutige Regel (`afterBattle`): Mauern auf 15, der Befehl endet.
- **Phase 1 verloren** und der Spieler noch in der Nähe: Die Stadt fällt **noch nicht**, es folgt Phase 2.
  - `n.siege.phase = 2`, Restheer = Stärke × 0,5.
  - Hinweis: „DIE BRESCHE IST VERLOREN — DIE GARDE HÄLT DAS BURGTOR“. Das Fallgitter am Burgtor (`castleGate`) wird `solid` und heißt „Burgtor (geschlossen)“. Die `capGuard` der Unterstadt ziehen sich auf den Wallplatz zurück.
- **Phase 2, das Burgtor:** 4–6 Untote (eine Elite, ein Golem) greifen den Wallplatz an (545–571 × 87–92).
  - Verteidiger: Gerold, die sechs Gardisten des Hofs und Brandt. **Varon kämpft nicht**, er bleibt im Thronsaal.
  - Phase 2 läuft höchstens 4 Spielstunden (Muster `battleCheck`-Zeitlimit).
  - **Gehalten:** Die Toten weichen, die Mauern stehen auf 15, das Restheer zieht ab (Befehl endet). Chronik: „Am Burgtor brach der Sturm.“
  - **Verloren:** Die Burg fällt, `capture(CAPK, 'undead')` wie heute. Fortgebracht oder nicht, jetzt folgt die **Flucht beim Fall** (§2.3).
- **Ohne Spieler:** Alles bleibt abstrakt wie heute (`battleAbstract` mit ×1,2). Phase 2 gibt es nur vor Ort.

### Garde und Hof während des Sturms
- **Schutz der Hoffiguren (F-C) wird Pflicht:** `varonCourt`-Figuren nehmen Schaden vom Spieler, von Gästen und von Untoten mit `armyId === n.siege.by`, sonst von niemandem. Damit töten Zufallsereignisse den König nicht nebenbei.
- **Der König** verlässt den Thronsaal nur bei der Flucht (§2). Erreichen Untote den Thronsaal (Phase 2 verloren und keine Flucht möglich), stirbt er durch sie: `kingDeath(k, false)`, keine Rufstrafe. Das ist schon gebaut, die Quelle wird geprüft (`die`, Belagerung S2).

### Burgfrieden während der Belagerung (VORSCHLAG)
- **Solange die Mauern stehen (`walls > 0`):** Der Burgfrieden gilt unverändert. Die Belagerung ändert nichts am Tor, und Gero steht ohnehin draußen am Südtor.
- **Ab Mauern 0 bis zum Ende der Belagerung ist der Burgfrieden aufgehoben.** `keepTick` prüft zusätzlich `SIM.capitalState().storm`.
  - Gerold öffnet die Waffenkammer. **Jeder** in Varonheim bekommt sein Depot sofort zurück (`keepReturn`, Log „Jede Klinge auf die Mauer“).
  - `keepHalt` und `keepDraw` ruhen, es gibt keine Durchsuchung und keinen Alarm.
  - Hinweis (einmal je Belagerung): „BURGFRIEDEN AUFGEHOBEN“.
- **Endet die Belagerung** (gehalten), gilt der Burgfrieden wieder. Wer jetzt bewaffnet im Burgbezirk steht, wird **nicht** angehalten, bis er die Zone verlässt (`keepGrant('siege')`). Erst beim nächsten Betreten wird wieder durchsucht.
- Leihwaffen gibt es nicht. Wer unbewaffnet ist, holt sich etwas bei Hagen (Kronschmiede, normaler Preis).

### Speicherfelder
- `S.war.nodes.varonheim.siege.phase` (1|2). Fehlt das Feld, gilt 1.
- `S.war.nodes.varonheim.siege.keepOpen`: Tag, an dem der Burgfrieden aufgehoben wurde. Fehlt das Feld, gilt der Burgfrieden.
- Phase 2 ist ein Kampf und damit flüchtig. Wird mitten in Phase 2 geladen, gilt sie als abstrakt: `battleAbstract` mit dem Restheer gegen eine Besatzung mit ×1,2.

### Spielerhinweise
- Hinweise beim Wechsel der Phase.
- Gero ruft vor Phase 1: „Sie kommen durch die Bresche!“ Brandt ruft vor Phase 2: „Zum Burgtor! Hier halten wir.“
- `MECHANIKEN.md`: zwei Phasen; der Burgfrieden fällt mit den Mauern.

### Debug (Abschnitt „Varonheim: Belagerung“)
- Sturm vor Ort jetzt (Phase 1)
- Phase 2 jetzt
- Burgfrieden-Status

### Proben
1. Mauern 0 und Spieler nah → `phase === 1`, mindestens ein `flesh_golem` in Stufe 9.
2. Phase 1 verloren mit Spieler nah → die Stadt gehört weiter Valen, `phase === 2`, das Burgtor ist `solid`.
3. Phase 2 gehalten → `walls === 15`, `siege` endet am Tagesende, und der Hof (`courtEnts`) ist vollzählig.
4. Mauern 0 → Depot zurückgegeben, `keepHalt` hält nicht an. Nach dem Ende der Belagerung hält es beim nächsten Betreten wieder an.
5. Hoffigur, getroffen von einem fremden Untoten (ohne `armyId` der Belagerung) → kein Schaden.

### Exploits
- **Phase 2 absichtlich verlieren, um Beute zu machen:** Die Beute ist normal, und bei einer Niederlage fällt die Stadt. Das ist kein Gewinn.
- **Mit aufgehobenem Burgfrieden den König töten:** `kingDeath(byP)` mit Kopfgeld 1500 greift weiter. Der Schutz aus F-C lässt Treffer des Spielers bewusst durch.
- **Aufgehobenen Burgfrieden zum Schmuggeln nutzen:** Wer bei Belagerungsende bewaffnet drin ist, darf es bleiben, bis er geht. Das ist harmlos, denn ziehen bedeutet weiterhin Alarm.

---

## 2. Den König fortbringen (begehbar)

### 2.1 Wer bietet es an, wann (VORSCHLAG)
- **Gero** am Südtor und **Brandt** im Thronsaal bieten „Den König fortbringen“ an, sobald `n.siege` gesetzt ist und `walls ≤ 60` (vorher: „Noch halten die Mauern. Frag mich, wenn sie wanken.“).
- **Bedingung:** Valen-Rang 1 oder höher, oder Titel „Ritter Varons“, oder `varonAudience`. Sonst sagt Brandt: „Den König vertraue ich keinem Fremden an.“
- **Varon muss zustimmen** (ein kurzer Dialog mit der Haltung des harten Königs):
  - Bei `varonQ ≥ 3` (Ritter) sagt er ja.
  - Sonst braucht es Brandts Fürsprache, die einmal je Belagerung **15 % Ablehnung** hat („Ich fliehe nicht vor Knochen.“).
  - Bei Ablehnung ist ein neuer Versuch erst am nächsten Tag möglich.
- **Ist Varon tot** (`varonDead`): Es gibt keinen Geleitzug, nur Brandts Dialog „Den Hof fortbringen“. Die Adligen gehen ab der Bühne, der Hof bleibt ganz, zum Preis aus §2.4.
  - Herrscht der Kult (`ruling`), lehnt Aldhelm ab und bleibt.
  - **Das Exil führt dann Brandt.** Herrscht der Kult, bleibt Aldhelm in der Burg, wie in S2 festgelegt.

### 2.2 Der Geleitzug
- Varon, Brandt und 2 Gardisten folgen dem Spieler nach dem Muster der Katakomben-Verbündeten (`servant: S.player.id`, `pet`, `transient`, `brave`).
- Die drei Adligen, Ysmay und Hagen gehen ab der Bühne mit dem Hofwagen: `courtDrop` mit Text. Gerold und die Hofgarde bleiben in der Burg.
- **Zwei Wege**, die Wahl fällt im Dialog:
  - **A, Burgtor und Westtor (immer möglich):**
    - Der Weg führt durch das Burgtor, über die Wallstraße (y 88) zum Westtor (500, 95–97) und von dort 20 Kacheln auf die Königsstraße nach Nordfurt zu einer Wegmarke „Sammelplatz des Hofes“.
    - Etwa 60 Kacheln in der Stadt, offen.
    - **Gefahr:** Eine Streife aus dem Heerlager, 3–4 Untote der Stufe 8, fängt den Zug zwischen Westtor und Wegmarke ab. Ihre Figuren tragen die `armyId` des Belagerers, Verluste zählen also gegen sein Heer.
  - **B, Kellerweg (nur mit `S.cult.keyB`):**
    - Der Weg führt durch die Kanzleikeller-Treppe in die Katakomben, durch sie zum Ausgang A (Friedhofsgruft im Nordwesten), dann 6 Kacheln zum Westtor und weiter zur Wegmarke.
    - Ungesehen, **keine Streife**.
    - **Aber:** Ist der Kult nicht zerschlagen (`!['destroyed','player'].includes(C.end)`), stehen die Katakombenwachen des Kults (Stufe 12–16) im Weg. Liegt Aldhelms Krypta (`krypta`) am Weg, siehe §3.2.
    - Ysmay warnt beim Aufbruch, wenn der Kult enttarnt ist: „Unter der Kanzlei wohnt nicht nur Staub.“
- **Ankunft an der Wegmarke:** Varon, Brandt und die 2 Gardisten verlassen die Karte (Log „Der Hof zieht nach Salzhafen“). Dann gilt `S.evac.state = 'away'`, und `ensureVaronExile` baut den Exilhof **ohne Fall** (Ü-2 gelöst). Bedingung: `capitalFallen() || S.evac?.state === 'away'`.
- **Stirbt Varon im Zug:**
  - Durch Untote: `kingDeath(k, false)`, Chronik „König Varon fiel auf der Flucht“, keine Rufstrafe, Brandt führt.
  - Durch den Spieler: wie heute, mit Kopfgeld.
  - **Die Evakuierung zählt trotzdem als gelungen** für die Adligen (Hof bleibt ganz), wenn Brandt die Wegmarke erreicht.
- **Spieler stirbt oder lädt im Zug:**
  - Der Zug ist flüchtig. Beim Laden mit `S.evac.state === 'run'`: Varon kehrt in den Thronsaal zurück (`ensureVaronCourt`). Log: „Der Zug kehrte in die Burg zurück.“ Danach `state = null`; die Adligen sind wieder da, nichts wurde bezahlt.
  - Fällt die Stadt während eines laufenden Zugs (abstrakt): Der Zug gilt als entkommen, wenn Varon lebt und außerhalb der Mauern ist, sonst **Flucht beim Fall** (§2.3).

### 2.3 Flucht beim Fall (ohne vorherige Evakuierung)
Das ersetzt den alten §5.5-Absatz.
- **Ohne Spieler:** Der König flieht immer, wie heute (`capitalFall` mit `ensureVaronExile`). Die Adligen zerstreuen sich.
- **Mit dem Spieler im Burgbezirk** (Phase 2 verloren):
  - Varon, Brandt und 2 Gardisten laufen **auf eigene Faust** über den Kellerweg, wenn `keyB` gesetzt ist, sonst über das Burgtor zum Westtor.
  - Bewegung über den Anker zur Wegmarke, wie bei Flüchtlingen (`H.spawnRefugee`-Muster).
  - Die Toten jagen sie. Begleiten bringt Ansehen bei Valen (+5 bei Ankunft).
  - Ein Kellerweg ohne Spieler wird abstrakt aufgelöst: Ist der Kult unzerschlagen, kommen sie mit 50 % durch, sonst sicher.
  - Die Adligen zerstreuen sich auch hier (Entscheidung „Hof zerfällt“). Gerettet ist nur der König.
- **F-A beheben:** `capitalFall` ruft `courtDrop(() => true)` und `ensureVaronCourt()` (diese Funktion bricht ohnehin ab). Gerold und die Garde fallen, im Burghof stehen Knochenwachen (§4).

### 2.4 Preis und Folgen der Evakuierung
- **Bei Ankunft fällig** (nicht beim Aufbruch, damit das Neuladen nicht bestraft):
  - Besatzung −10
  - Valen −3 („Der König flieht vor dem Feind“)
  - `capThreat` +2 je Tag, solange belagert wird. Das ist die alte Regel; sie wirkt nur bis zum Ende der Belagerung, denn danach endet der Heerzug.
- **Die Kronschmiede und Hofmar schließen in der Burg.** Hagen steht im Exil. **Das Depot** bleibt am Torhaus, Gerold bleibt dort (siehe §3.1).
- **Der Hof bleibt ganz:** `S.flags.varonEvac = 1` wird nur bei einer gelungenen Ankunft gesetzt (die alte Flagge bleibt Schnittstelle zu `capitalFall`, `8345`).
- **Rückkehr:**
  - Die Belagerung endet gehalten (`capDay` setzt `siege = null`): Am nächsten Tag um 8 Uhr gilt `S.evac.state = 'home'`, `ensureVaronExile()` und `ensureVaronCourt()`, Chronik „Der König kehrt heim“. Die Flagge `varonEvac` wird gelöscht.
  - Die Stadt fällt doch: Es greift S2, das Exil ist schon da, niemand zerstreut sich.

### Speicherfelder (alle tolerant)
- `S.evac = { state: 'run'|'away'|null, day, route: 'tor'|'keller', by: 'Spieler'|'Fall' }`. Fehlt es: kein Zug, kein Exil ohne Fall. `run` wird beim Laden aufgelöst (§2.2).
- `S.evac.refused`: Tag der Ablehnung durch Varon.
- `S.flags.varonEvac` (vorhanden): Ein alter Stand mit dem Debug-Wert 1 und ohne `S.evac` verhält sich wie bisher; die Flagge gilt erst beim Fall.
- `S.after.capital.evac` (vorhanden) wird jetzt aus dem Spiel gesetzt.

### Spielerhinweise
- Gero und Brandt nennen beide Wege und die Gefahr („Die Streifen der Toten lauern an der Königsstraße.“ / „Der Keller … frag Ysmay, was dort unten haust.“).
- Wegmarke auf der Karte (Questziel), Meldung bei Ankunft, Chronik.
- Varon kommentiert im Zug, über `bubble` und nur einmal: „Ich habe diese Stadt nie zu Fuß verlassen.“
- `MECHANIKEN.md`: Wer fortbringt, rettet den Hof, zahlt Besatzung und Ruf; die Wege und das Neuladen.

### Debug
- Evakuierung starten (Weg Tor/Keller)
- Zug sofort ankommen lassen
- Evakuierung zurücksetzen
- Der vorhandene Schalter „König vorher fortbringen“ bleibt für alte Proben.

### Proben
1. Belagerung mit Mauern 50, Rang 1 → Brandt bietet das Fortbringen an. Bei Mauern 80 oder ohne Rang → kein Angebot.
2. Ankunft simulieren → `S.evac.state === 'away'`, Exilhof in Salzhafen, Hof aus der Burg verschwunden, Besatzung −10, Valen −3, `varonEvac === 1`. Die Stadt gehört weiter Valen.
3. `continueGame` mit `state: 'run'` → Varon im Thronsaal, `state === null`, Besatzung unverändert.
4. Fall nach der Evakuierung → `scattered` leer, kein „Zu spät“ beim Verräter.
5. Belagerung gehalten nach der Evakuierung → `state === 'home'`, Exilhof leer, `courtEnts` mit Varon, Flagge gelöscht.
6. Varon stirbt im Zug durch einen Untoten → Valen unverändert, Brandt erreicht die Wegmarke → Hof ganz.

### Exploits
- **Fortbringen und zurück, um den Preis zu umgehen:** Die Rückkehr kommt nur über das Ende der Belagerung, und der Preis ist bei Ankunft fällig.
- **Zug neu laden, bis keine Streife kommt:** Neuladen setzt nur zurück, es gibt keinen Gewinn. Die Streife ist Pflicht (nicht zufällig) auf Weg A.
- **Varon als Gefolgsmann ausnutzen** (Level 26 mitnehmen): Der Zug kennt nur die Wegmarke. Weicht der Spieler mehr als 40 Kacheln vom Weg ab oder ist er 3 Spielstunden unterwegs, kehrt Varon um (`state = null`, Log „Der König traut dir nicht mehr“).
- **Varon im Zug ermorden, „die Toten waren's“:** `source` prüft den letzten Treffer, das ist gewollte Emergenz.
- **Streife farmen:** Sie erscheint einmal je Zug, die Beute ist normal.

---

## 3. Waffenkammer-Depot und Kult-Krönung

### 3.1 Depot (VORSCHLAG)
- **Belagerung:** wie §1 (zurück ab Mauern 0).
- **Fall:** wie gebaut (Hagen schickt alles per Bote, `8657`). Das gilt **auch für die Depots der Gefährten** und für fremde IDs: `keepReturn` läuft für `S.party`, Fremde gehen an die Erben (`!byId(id)`, Muster `8714`).
- **Evakuierung:** Das Depot bleibt, Gerold bleibt am Tor (er geht nicht mit).
- **Diener-Schmuggel:** `S.keepStash` verfällt beim Fall, die Ware geht per Bote zurück an den Spieler. Bei der Evakuierung gibt es keine Diener mehr (`courtDrop`), deshalb läuft eine offene Bestellung ebenfalls per Bote zurück.

### 3.2 Kult und Rote Krönung
- **F-D beheben:** Solange `S.evac.state === 'away'` gilt, ruht die Krönung wie bei der Besetzung. `capitalDay` erhöht `C.crown` dann ebenfalls, und `cultCrown` bricht ab („Der König ist fort. Der Kelch wartet.“). Aldhelm kann einen König in Salzhafen nicht im Schlaf erreichen.
- **Krönungstag während der Belagerung** (Kult unzerschlagen): Die Krönung fällt wie geplant, das ist gewollt; die Belagerung ist Aldhelms Gelegenheit.
  - Eine Evakuierung vorher ist der einzige Schutz und damit eine echte Wahl.
  - Ysmay sagt es ab Kultstufe 3 im Gespräch: „Wenn der König die Stadt verlässt, verliert der Kanzler seinen Hals zum Beißen.“
- **Aldhelms Falle (Weg B, Kult unzerschlagen, Stufe ≥ 3):**
  - Aldhelm bietet sich als Führer durch den Keller an („Ich kenne die Gewölbe“), als dritte Wahl im Dialog. Wer annimmt, führt den Zug in die Krypta: `cultCrown()` sofort, Varon ist fort, Brandt und die Gardisten stehen feindlich vor Aldhelm.
  - Ysmay warnt vorher, wenn `varonQ ≥ 2` oder die Spur bekannt ist (`C.stage ≥ 3`).
  - Das ist ein klarer Verrats-Moment für einen Blutkult-Verbündeten (`C.allies`) **oder** eine Falle für Unwissende.
  - Annehmen setzt `C.rightHand` (heute ungelesen, W-20) **nicht**. Es ist ein eigener Weg mit Chronik „Der König verschwand im Keller seiner Kanzlei“.
- **Spieler als Blutfürst:** Der Tribut der Kanzlei ruht während der Evakuierung wie bei der Besetzung (Log wie S2).

### Speicherfelder
- Keine neuen außer `S.evac`. Für die Falle gibt es `S.evac.by = 'Aldhelm'`.

### Spielerhinweise
- Ysmays Warnung.
- Bei ruhender Krönung im Exil die Log-Zeile „Der Kelch wartet auf einen König, der nicht da ist.“
- Depot-Bote wie gebaut.

### Debug
- Krönung jetzt (vorhanden) bei `evac 'away'` → kein Tod.
- Aldhelms Falle auslösen.

### Proben
1. Ist `evac 'away'` gesetzt und der Krönungstag erreicht, stirbt der König nicht, und `C.crown` ist um 1 gestiegen.
2. Fall mit Depot des Spielers und eines Gefährten → beide Depots leer, die Sachen in den Taschen.
3. Aldhelms Weg → `crowned` gesetzt, `varonDead` gesetzt, Brandt lebt, keine Valen-Strafe für den Spieler.
4. `keepStash` offen und Evakuierung → Ware beim Spieler.

### Exploits
- **Exil als Dauerschutz vor der Krönung:** Die Krönung ruht nur, solange belagert wird; mit der Rückkehr läuft die Uhr weiter. Das ist gewollt: Wer den König rettet, verschiebt die Krönung, er verhindert sie nicht.
- **Aldhelms Falle als Abkürzung zu `ruling`** (für Blutfürst-Pläne): Sie kostet die Krone und bringt keinen Lohn. Das ist erlaubt, die Folgen stehen in der Chronik.

---

## 4. Besetzter Burgbezirk und Rückeroberung

### 4.1 Besetzt (VORSCHLAG, erfüllt Umbau §4.3 „Knochenwachen am Burgtor“)
- `ensureCapitalOccupied()` ist flüchtig und läuft beim Laden, bei `capitalFall` und nach `initSim`:
  - **2 Knochenwachen** (`bone_knight`, Stufe 10, `heldGuard: 'varonheim'`, `keepGate: true`) am Burgtor
  - **4 Untote** im Burghof
  - **ein Leichnam auf dem Thron** (Prop `throne` mit `skull_pile`, nur Bild)
  - Die Burgbauten bleiben betretbar. Im Verlies stehen leere Käfige (`varonFreed` = alle, wie S2).
- **Kein Burgfrieden**, gebaut (`8658`).
- **Das Fallgitter** steht offen und trägt das Etikett „Burgtor (Knochenwachen)“.
- **Beute:** In der Kanzlei liegt einmalig das **Kronsiegel** (Quest-Gegenstand, kein Verkaufswert). Wer es Varon oder Brandt im Exil bringt, bekommt Valen +5 und einen Text. Gespeichert wird das in `S.after.capital.seal` (`'taken'`/`'given'`).

### 4.2 Rückeroberung
- **Gebaut:** 4 Wellen (`sim.js:576`), Ursprung ~14 Kacheln um den Mittelpunkt (`waveOrigin`). Das liegt bei 117×87 **mitten in der Stadt** (ANNAHME aus der Rechnung, gegen den Kronfels-Grundriss prüfen).
- **Vorschlag:** Die Wellen 1–3 kommen wie heute. **Welle 4** (Statthalter `death_captain` Stufe 9 plus Gefolge) erscheint **im Burghof** und zieht nicht zum Mittelpunkt, sondern hält den Thronsaal (Anker = Thron).
  - Wer sie bricht, kämpft im Burgbezirk. Die Knochenwachen am Tor zählen zur Welle 4 (`armyId` der Garnison).
  - Das ist der Thronsaal-Teil aus S4, hierher vorgezogen. Klein: eine Abfrage `node === CAPK && last` in `spawnWave`.
- **Nach der Befreiung (F-B beheben):** `capitalFreed` ruft `ensureVaronCourt()` nach `ensureVaronExile()`, räumt die Knochenwachen (`keepGate`) ab und lässt Gerold mit dem Burgfrieden zurückkommen.
  - Der Burgfrieden gilt **ab dem nächsten Tag** (`S.flags.keepGrace = Tag + 1`): Die Befreier dürfen bewaffnet in den Thronsaal zur Heimkehr-Szene.
  - Varon spricht den Spieler an (vorhandener Lohn `retakeAsked`).
- **Rückkehr bei Varons Tod:** Brandt steht als Reichsverweser im Thronsaal (W-17 nebenbei: `varonRegent` sichtbar machen).

### Speicherfelder
- `S.after.capital.seal`
- `S.flags.keepGrace`
- Der Rest ist flüchtig.

### Spielerhinweise
- Ankunftskarte „Varonheim · von den Toten gehalten“
- Welle 4: „Der Statthalter hält den Thronsaal“
- Kronsiegel-Text
- Gerolds Gnadentag („Heute nicht. Heute nicht.“)

### Debug
- Burgbezirk besetzen
- Welle 4 im Thronsaal
- Befreien, dann Hof prüfen

### Proben
1. Nach `capitalFall` hat `courtEnts()` die Länge 0, es gibt 2 `keepGate`, und es steht genau ein Varon in der Welt (im Exil).
2. `capitalFreed` → `courtEnts()` enthält Varon und Gerold, kein `keepGate` mehr, und `keepHalt` hält am Gnadentag nicht an.
3. Welle 4 ankert im Burgbezirk (`inKeep(anchor)`).
4. Kronsiegel einmalig: Wer zweimal plündert, bekommt kein zweites Siegel.

### Exploits
- **Kronsiegel-Schleife:** Es ist einmalig und hat keinen Verkaufswert.
- **Gnadentag zum Waffenschmuggel:** Er gilt einen Tag, und wer zieht, löst ab dann Alarm aus wie sonst.
- **Den Thronsaal-Statthalter von außen per Fernkampf weglocken:** Sein Anker zieht ihn zurück, die normale KI greift.

---

## 5. Scheibenschnitt
| Scheibe | Inhalt | Dateien | Proben |
|---|---|---|---|
| **S3a** (klein) | Fehler F-A und F-B (Hof bei Fall und Befreiung), F-C (Hofschutz), besetzter Burgbezirk mit Knochenwachen §4.1 ohne Siegel | game.js | §4: 1, 2; §1: 5 |
| **S3b** (mittel) | Sturm in zwei Phasen, Gero am Südtor (Verteidigen, Ausfall, Versorgen aus dem alten §5.5, `fedTill` schreiben), Burgfrieden fällt mit den Mauern | sim.js, game.js | §1: 1–4 |
| **S3c** (mittel) | Evakuierung begehbar (Brandt/Gero, Wege A und B, Exil ohne Fall, Rückkehr), Flucht beim Fall, F-D und Krönungspause, Depot-/Diener-Rückgabe | game.js | §2: 1–6; §3: 1, 2, 4 |
| **S3d** (klein) | Welle 4 im Thronsaal, Gnadentag, Kronsiegel, Aldhelms Falle | sim.js, game.js | §4: 3, 4; §3: 3 |

- Reihenfolge: S3a zuerst. Das sind echte Fehler im gebauten Stand, auch ohne die übrigen Scheiben.
- **Kampfwerte** (Stufe 9 der Bresche, Streife Stufe 8, Phase-2-Größe) misst der Engineer mit `RF.simFight`, Ziel: Phase 2 mit Spieler und Hofgarde ≈ 60 % gehalten.
- **Leistung:** Höchstens 7+7 Figuren in Phase 1 und 6 in Phase 2, dazu die Garde. Die BUG-108-Messung wird in der dreifach großen Stadt wiederholt.
- **Koop:** Der Wirt rechnet alles. Der Geleitzug folgt dem Wirt, Gäste kämpfen mit. Der Dialog läuft über `uiHooks`.
- **Querbezug:** `luftbruecke` und Geros „Versorgen“ schreiben beide `fedTill` über `max()` (Ü-9, ok). `stadt_ohne_wachen.md:183` liest jetzt `S.evac.state === 'away'` statt der Debug-Flagge (Ü-2).

## 6. Fragen an den Entwickler (höchstens 3)
1. **Kellerweg ohne Kultschlüssel?** Der Weg B gibt es heute nur mit `S.cult.keyB`.
   - **(A, empfohlen)** Nur mit Schlüssel. Wer den Kult nicht verfolgt hat, kennt den Fluchtgang nicht; Weg A bleibt immer offen.
   - (B) Der Keller ist der alte königliche Fluchtgang und für die Evakuierung immer offen (Brandt kennt ihn); der Kult hat ihn nur „mitbenutzt“.
2. **Wie streng ist Varon?**
   - **(A, empfohlen)** Als Ritter Varons sagt er sicher ja, sonst mit 15 % Ablehnung je Tag.
   - (B) Er geht immer mit, wenn Gero oder Brandt es vorschlagen.
   - (C) Er geht nie freiwillig; fortbringen nur bei Mauern 0 (Sturm).
3. **Burgfrieden in der Belagerung:**
   - **(A, empfohlen)** Er fällt erst bei Mauern 0; die Waffenkammer gibt dann alles zurück.
   - (B) Er fällt schon mit Belagerungsbeginn.
   - (C) Er gilt bis zum Fall; nur Gero darf Bewaffnete in den Burgbezirk lassen.
