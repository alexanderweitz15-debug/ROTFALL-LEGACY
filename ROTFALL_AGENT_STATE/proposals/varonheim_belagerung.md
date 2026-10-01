# Varonheim wird belagerbar (Nutzerentscheidung 01.10.2026, T40-Teil)

**Status:** WAITING_FOR_DEVELOPER · **Autor:** Feature Designer (Agent 3) · **Stand:** 01.10.2026
Kennzeichnung: **FAKT** = belegt (Datei:Zeile, Stand der Lesung; `game.js` wird parallel bearbeitet, Zeilen können um einige wandern), **VORSCHLAG**, **ANNAHME**.
Entwicklerentscheidung (DESIGN_DECISIONS.md): „Varonheim wird belagerbar: eigener Kriegsknoten mit starker Besatzung; fällt sie, große Folgen (König flieht, Hof zerfällt).“

---

## 1. Name und Konzept
**„Der Heerzug gegen die Krone“** — Varonheim wird ein eigener Kriegsknoten mit Mauern, starker Besatzung und eigener Belagerungsregel. Die Toten erreichen die Hauptstadt nicht zufällig: Erst wenn Valen den Krieg über Wochen verliert (Land, Feldheer, Kult, König), sammeln die Toten einen **Heerzug**, der gezielt auf Varonheim marschiert. Vor der Stadt gibt es keine Sofortschlacht, sondern eine **Belagerung über mehrere Tage**: Die Mauern sinken, die Besatzung hungert, Valens Feldheere eilen zum Entsatz. Der Spieler kann verteidigen, versorgen, einen Ausfall führen oder den König fortbringen. Fällt die Stadt, flieht der König ins Exil, der Hof zerfällt, die Welt merkt sich den Fall — und Varonheim kann zurückerobert werden.

## 2. Gelöstes Problem
- Varonheim steht heute außerhalb des Krieges; der Kriegsgraph kennt die Hauptstadt nicht (FAKT: `data.js:1332–1347`, kein `varonheim` in `WAR_NODES`/`WAR_EDGES`). Teil B: „Varonsburg ist kein Kriegsknoten“ (`docs/audit/TEIL_B_WELT.md` §2.1).
- Der Entsatz aus Varonheim ist ein Teleport: Das Heer entsteht **in Nordfurt**, nicht in Varonheim (FAKT: `sim.js:375–378`, `newArmy('valen', 'northcity', 45)`).
- Der Krieg hat kein Ende mit Gewicht. Wer ihn wochenlang ignoriert, verliert höchstens Dörfer.
- Der Blutkult schwächt Valens Nachschub (FAKT: `sim.js:363`, `cultDrain`), aber diese Schwäche hat heute keine sichtbare Spitze.

## 3. Warum es zu ROTFALL passt
Dark Fantasy lebt von Verlust, der droht und sich ankündigt. Die Hauptstadt fällt nicht durch einen Würfel, sondern durch eine Kette: Kult zehrt am Heer → Front bricht → Späher melden den Heerzug → Belagerung → König flieht → Exilhof bittet um Rückeroberung. Das ist die Kette aus `AGENT_SYSTEM.md` (Entscheidung → Fraktionsfolge → Weltereignis → Begegnung → neue Chance). Alles baut auf vorhandenen Systemen auf: Kriegsgraph, Späher-Vorwarnung, Wellen-Befreiung, `S.after`, Belagerung der Schwarzen Feste als Vorbild.

## 4. Heutiges System (FAKT)
**Kriegsgraph (`sim.js`)**
- 15 Knoten, 19 Kanten (`data.js:1332–1347`). Nachbarn werden beim Laden des Moduls aus `WAR_EDGES` gebaut (`sim.js:10`).
- `warTick` alle 6 Spielstunden (`game.js:9642`, auch im Zeitsprung `game.js:~4737`): Untote ziehen per Breitensuche zum nächsten Knoten, der nicht ihnen gehört; Valen holt zuerst verlorene Städte zurück (`sim.js:259–260`). Ein Valen-Heer unter 25 hält (`sim.js:261`). Vor Städten und Dörfern warten Untote einen Zug, Späher melden es (`sim.js:263–270`).
- `resolveNode`: Heer gegen Heer oder Heer gegen Besatzung; **eine** abstrakte Schlacht entscheidet sofort über den Besitz (`sim.js:276–289`, `afterBattle` → `capture`, `sim.js:308–313`). Ist der Spieler auf 40 Kacheln nah, wird die Schlacht vor Ort gespielt (`materialize`, `sim.js:287, 385–405`; nur Skelette gegen Valen-Soldaten, Stufe 4, 2–7 je Seite, `sim.js:393–398`).
- `battleAbstract`: Stadtmauern ×1,3 nur für Valens Besatzung in einer Stadt (`sim.js:298`).
- `capture`: neue Besatzung 10 (Tote) oder 8 (`sim.js:318`); fällt eine Stadt an die Toten, fliehen 40 % der Leute fest nach **Eren** (bzw. Nordfurt, wenn Eren fällt; `sim.js:326`), drei Häuser brennen aus (`raidDamage`, `game.js:5048`).
- `warDay` (`sim.js:356–383`): Untote +min(4; 1+0,25×Knoten), nach Garmadon 0; Valen +3 (Korn > 10) bzw. +1, plus 0,3 je Untotenknoten bis +3, minus `cultDrain`. Besatzungen +2/Tag bis 20 (Valen-Städte) bzw. 10 (`sim.js:366`). Musterung zuerst in Nordfurt, sonst in der ersten Valen-Stadt aus `S.towns` (`sim.js:372`). **Entsatz** nur, wenn Valen gar keine Stadt mehr hat: 45 Stärke, 50 %, aber in Nordfurt (`sim.js:375–378`).
- Deckel 110 auf Schwer/Sehr schwer, sonst 80 (`sim.js:354`).
- Befreiung besetzter Orte in Wellen, wenn der Spieler auf 22 Kacheln nah ist (`sim.js:466–490`); Schwarze Feste 4 Wellen, sonst 2–3 (`sim.js:470`). Befreit nimmt Valen (oder Aurelion) den Ort (`sim.js:493`).

**Varonheim und Hof (`world.js`, `game.js`)**
- `CAPITAL` bei (475, 147), Halbbreite 35, Halbhöhe 23 (`world.js:1357`); als `LOCATIONS`-Eintrag `kind: 'city', faction: 'valen'` (`world.js:1359`). `TOWN_PLAN.varonheim` hat `village: true, capital: true` (`world.js:1394`). Damit steht Varonheim in `TOWN_LOCS` und in `S.towns` (FAKT: `economy.js:43, 107–108`), aber nicht im Kriegsgraphen.
- Nachbarn nach der OX-Verschiebung (FAKT: `world.js:536, 1721`, `fin`-Orte werden nicht verschoben): Nordfurt (374, 56), Aschfurt (636, 92), Kreuzweg (506, 250).
- `capitalMigrate`: 10 Königsgardisten (`capGuard`, transient) (`game.js:8221–8227`). `buildVaronburg` baut die Burgkarte bei jedem Betreten neu, nur Flags werden gespeichert; König nur ohne `varonDead`, Aldhelm nur bei Kultstufe < 4, Hingerichtete bleiben weg (`varonExecuted`), freigekaufte Gefangene bleiben weg (`varonFreed`) (`game.js:8229–8270`).
- `armyTargets` schließt Varonheim aus, weil der Plan `village: true` ist (FAKT: `game.js:6110`). Ein Totenfürst-Spieler kann also heute kein Heer gegen die Hauptstadt schicken.
- **Fund:** Stirbt der König, egal durch wen, setzt `die` `varonDead` **und Valen = −100** (FAKT: `game.js:3551`, keine Prüfung von `source`). Ein König, der auf der Flucht von Untoten getötet wird, würde den Spieler bestrafen.

**Blutkult (§5g.2)**
- `cultWar()` = Kult erwacht und nicht zerschlagen (`game.js:12602`); `cultDrain()` = herrschend 1, versteckt oder Blutfürst mit Zehnt 0,5 (`game.js:12869`). `cultCrown` setzt `varonDead`, Aldhelm herrscht (`game.js:12871–12876`). Blutfürst-Tribut kommt „aus der Kanzlei“ (`game.js:12877–12882`). Die Rote Krönung läuft auf Angsthase nicht (`docs/MECHANIKEN.md` Blutkult S5).

**Folgen und Vorbilder**
- `S.after` über `AF()` (`game.js:9938`), `afterSay` (`game.js:9941`), Heilung nur auf Angsthase (`finalRuin`, `game.js:6027`).
- `aurelFall`/`aurelFreed` (`game.js:10188–10221`): Wachen sterben, Läden zu (`fallShut`), Trümmer, Flüchtlinge mit Ziel, Vorratsauftrag, Befreiung über Wellen. **Achtung:** `aurelFreed` leert `S.after.tmul` komplett, sobald keine Aurelion-Stadt mehr gefallen ist (`game.js:~10218`) — nicht für Varonheim mitbenutzen.
- Belagerung der Schwarzen Feste (`keepSiegeDay`, `ensureBlackKeep`, `game.js:7858–7880`): Heerlager mit Marschallin, Besatzung −10 %/Tag. Gutes Vorbild für das Lager vor Varonheim.

**Wirtschaft:** Eine besetzte Stadt produziert nicht, Kaufen kostet ×1,5, Handelszüge meiden sie (FAKT: `economy.js:46, 129, 243, 251, 278`). Gilt automatisch, sobald `S.war.nodes.varonheim.owner === 'undead'`.

**Kopflose Kriegsschleife:** Debug „Krieg 10 Tage vorspulen (ohne Feldschlachten)“ = je Tag 4× `warTick` + `warDay`, Spieler auf Karte `deep` (`game.js:14134`).

## 5. Neues System (VORSCHLAG)

### 5.1 Knoten, Kanten, Besatzung, Mauern
- `WAR_NODES.varonheim = { owner: 'valen', garrison: 60, walls: 100 }`.
- Kanten **nur** `['northcity', 'varonheim']` und `['ashford', 'varonheim']`, am **Ende** von `WAR_EDGES` angehängt. Begründung: Varonheim liegt hinter der Linie Nordfurt–Aschfurt. Keine Kante nach Kreuzweg, sonst entsteht eine neue Abkürzung Nordfurt–Varonheim–Kreuzweg und Valens Heere ziehen anders als heute. Weil die Kanten am Ende stehen, wählt die Breitensuche der Toten Varonheim bei gleicher Tiefe immer zuletzt (FAKT-Grundlage: BFS-Reihenfolge `sim.js:239–247`, Nachbarn in Kantenreihenfolge `sim.js:10`).
- **Besatzung:** Deckel 60, füllt sich um 3 am Tag (statt 20/+2), nicht während einer Belagerung.
- **Mauern** (`node.walls`, 0–100): +10 am Tag, solange keine Belagerung läuft. Gelten nur für Valen.
- **Eigene Musterung bleibt aus:** Die normale Aushebung (35 Stärke) überspringt Varonheim. Die Hauptstadt schickt nur den Entsatz (§5.3). So bleibt das heutige Kräfteverhältnis erhalten.
- Neu im Kriegsgraphen ist auch das Korn Varonheims in `valenGrain` (`sim.js:360`). Valen steht damit etwas öfter auf +3 (ANNAHME: kleiner Effekt; die Messung in Scheibe 1 zeigt es).

### 5.2 Bedrohung und Heerzug (wann die Toten überhaupt kommen)
Die Nachbildung (§17) zeigt: **Ohne eigenen Anlass erreichen die Toten Varonheim praktisch nie.** Darum gibt es einen eigenen Zähler.
- `S.war.capThreat` (0–40), ab Tag 20 einmal am Tag in `warDay`:
  - +1, wenn die Toten ≥ 6 Knoten halten, sonst −1
  - +0,5, wenn Valen kein Feldheer hat
  - + `cultDrain()` (herrschend +1, versteckt oder Blutfürst mit Zehnt +0,5)
  - +0,5, wenn der König tot ist und der Kult nicht herrscht (leerer Thron)
- **Der Spieler senkt den Zähler:** −3 je gewonnener Feldschlacht vor Ort (`battleCheck`), −10 je befreitem Ort, −5 für den Hauptmann aus Varons erstem Auftrag.
- **Stufen mit Hinweis** (jede Stufe einmal je Anstieg):
  - **≥ 10:** Gerücht und Chronik: „Man sagt, Morvath sammelt Knochen für einen Stoß gegen die Krone.“ Kommt über `newsTalk` in die Gespräche.
  - **≥ 15:** Musterung in Varonheim: Log, und ein Hinweis, wenn der Spieler dort ist („Varonheim rüstet“). Am Brett hängt ein Auftrag „Holz und Stein für die Mauern“; seine Lieferung gibt Mauern +20.
  - **≥ 20:** **Heerzug der Toten.** Ein neues Heer „Morvaths Heerzug“ entsteht am Untotenknoten, der Varonheim im Graphen am nächsten liegt. Stärke 70 auf Schwer, 80 auf Sehr schwer, höchstens bis zum Deckel. Es bekommt den Befehl `order = 'varonheim'` über den vorhandenen Befehlsweg (`sim.js:259`) und kämpft sich Knoten für Knoten durch. Danach: Zähler auf 5, 30 Tage Pause. Global: Chronik und Hinweis „DIE TOTEN MARSCHIEREN AUF VARONHEIM“. Jeder Zug kommt mit der vorhandenen Späher-Warnung.
- Auf **Angsthase** gibt es keinen Heerzug, wie bei der Roten Krönung. Nach Garmadons Tod auch nicht, denn dann wachsen die Toten nicht mehr.
- Der Heerzug zieht keinen Zufall. Er ändert die `rnd()`-Folge nur über Schlachten, die er schlägt.

### 5.3 Entsatz-Regel neu
Frage der Leitung: Bleibt der Entsatz, solange Varonheim steht? **Ja**, mit drei Änderungen:
1. **Entsatz entsteht in Varonheim**, nicht in Nordfurt. Es gibt keinen Teleport mehr; nach einem Zug steht er vor Nordfurt.
2. **Bedingung wie heute:** keine andere eigene Stadt zum Mustern (Nordfurt, Eren, Aschfurt, Salzhafen …) und Varonheim gehört Valen. **Neu:** Varonheim wird nicht belagert. Eine belagerte Stadt schickt niemanden hinaus.
3. **Fällt Varonheim, entfällt der Entsatz.** Mustern kann dann nur noch das Exil (§5.6), wenn es eine Valen-Stadt ist; das ergibt sich von selbst, weil der Exilort eine eigene Stadt ist.

Dazu kommt **Entsatz-Vorrang:** Solange Varonheim belagert wird, ziehen **alle** Valen-Feldheere zuerst dorthin, noch vor der Rückeroberung verlorener Städte (`sim.js:260` bekommt eine Vorstufe). Die Regel „unter 25 Stärke halten“ bleibt.

### 5.4 Die Belagerung (abstrakt)
Steht ein Untotenheer auf `varonheim` und gehört die Stadt Valen, **gibt es keine Sofortschlacht**:
- **Erster Zug:** `node.siege = { day, by: heerId }`. Chronik, Hinweis „VARONHEIM WIRD BELAGERT“. Der Stadtzustand zeigt „Belagert“ (neu in `townState`), die Kriegskarte „Belagert (Mauern 100 %)“.
- **Jeder weitere Zug (6 Std.):**
  - Mauern −max(2; 5 % der Heeresstärke). Bei 70 sind das −14 am Tag, bei 110 −22 am Tag.
  - Das Belagerungsheer verliert 0,75 (Ausfälle, Pfeile).
  - Die Besatzung verliert 0,25 (Hunger), solange keine Versorgung kommt.
  - Besatzung und Mauern füllen sich nicht auf.
- **Sturm:** erst bei Mauern 0. Eine `battleAbstract` mit dem Faktor ×1,2 für die innere Mauer. Hält die Besatzung, stehen die Mauern wieder auf 15 und das Heer weicht zurück, sein Befehl endet. Siegt das Heer, fällt die Stadt (§5.6).
- **Entsatz vor der Stadt:** Ein Valen-Heer, das auf `varonheim` trifft, schlägt das Belagerungsheer mit Ausfallbonus ×1,15. **Verliert der Entsatz, fällt die Stadt nicht.** Heute würde sie fallen, weil `afterBattle` dem Sieger den Knoten gibt (FAKT `sim.js:311`); das ist eine Sonderregel. Verliert das Belagerungsheer, weicht es zurück; die Belagerung endet in `warDay`, wenn kein Untotenheer mehr vor der Stadt steht.
- **Dauer:** Bei Heerzugstärke 70–110 dauert es etwa 5–7 Tage bis zum ersten Sturm. In der Nachbildung liegen im Median **etwa 10 Spieltage** zwischen Heerzug und Fall (§17). Ein Spieltag sind 24 Minuten, das sind also mehrere Stunden echte Spielzeit zum Reagieren.

### 5.5 Belagerung nahe beim Spieler (Spielerwahl)
Ist der Spieler im Umkreis von 40 Kacheln (`nearPlayer`) oder in der Varonsburg:
- **Heerlager der Toten** vor dem Südtor: bis zu 6 Untote, nur vorübergehend, die warten, bis sie angegriffen werden, dazu Belagerungs-Requisiten. Vorbild ist das Valen-Lager an der Schwarzen Feste (`game.js:7869–7874`). Am Tor steht **Mauerhauptmann Gero** (vorübergehend, `siegeMarshal`). Sein Gespräch erklärt die Lage („Mauern 64 %, Besatzung 52, Entsatz unterwegs: ja/nein“) und bietet vier Wege an:
  1. **Verteidigen:** Der Sturm wird vor Ort gespielt (`materialize`). Für die Hauptstadt mit gemischtem Heer (`undeadMix(n, 'town')`, mit Fleischgolem als Belagerer), Stufe 9 statt 4, passend zur Königsgarde (10–13). Die Königsgarde (`capGuard`) kämpft mit. Gefallene Angreifer senken die Heeresstärke wie heute (`unitDied`).
  2. **Ausfall wagen** (einmal je 6 Std.): Gero und 3 Gardisten gehen mit hinaus gegen eine Abteilung des Lagers (4–6 Untote). Gewonnen: Heeresstärke −15, im nächsten Zug sinken die Mauern nicht. Verloren oder geflohen: Besatzung −5.
  3. **Versorgen:** Korn oder Pökelfleisch abgeben (5 Stück: Besatzung +5, kein Hunger für 1 Tag), Holz und Stein (5+5: Mauern +10). Höchstens 3 Lieferungen am Tag; Bezahlung nur Ansehen bei Valen (+1), kein Gold.
  4. **Den König fortbringen** (ab Belagerungsbeginn; nur mit Audienz, Rang bei Valen 1+ oder als Ritter Varons): Varon geht ins Exil, bevor die Stadt fällt. Der Hof bleibt ganz (§5.6: keine zerstreuten Adligen). Der Preis: Besatzung −10, Valen −3 („Der König flieht vor dem Feind“), und der Zähler steigt um 2 je Tag, solange die Stadt belagert wird.
- **Fall mit dem Spieler vor Ort:** Varon, Brandt und 4 Gardisten treten aus dem Burgtor und laufen zum Westtor Richtung Exil. Die Toten jagen sie. Erreicht der König den Stadtrand (Kartenrand 20 Kacheln hinter der Mauer), ist er sicher. Stirbt er dabei, gilt `kingLost` (§5.6). Ist der Spieler nicht da, flieht der König immer (Entwicklerentscheidung: „König flieht“).
- Ein laufender Sturm vor Ort pausiert wie jede Feldschlacht den übrigen Krieg (FAKT `sim.js:256`).

### 5.6 Wenn Varonheim fällt
Die Hooks `H.capitalFell(node)` und `H.capitalFreed(node)` sitzen in `sim.js capture`, nach dem Muster von `H.raidDamage`.
- **Knoten:** Er gehört den Toten. Besatzung **30** statt 10, Deckel 30. Die Mauern bleiben auf 0, solange die Toten die Stadt halten.
- **Der König flieht** an den ersten Ort dieser Liste, der Valen gehört: **Salzhafen**, Nordfurt, Eren (VORSCHLAG, Frage F2). Dort steht der **Exilhof**: Varon (oder der Herrscher, siehe unten), Marschall Brandt, Ysmay und Schmied Hagen, mit 4 Gardisten. Alle sind vorübergehend und werden von `ensureVaronExile()` neu aufgebaut. Gespeichert wird nur `S.after.capital.exile`.
  - Im Exil empfängt Varon jeden ohne Kanzlergebühr („Ein König ohne Stadt kann nicht wählerisch sein“).
  - Er gibt den Auftrag **„Varonheim zurückerobern“**.
  - Steht keine Valen-Stadt mehr, gilt `kingLost`: Der König ist verschollen. Valen mustert nicht mehr, bis Varonheim zurückerobert ist.
- **Wer flieht:** Grundsätzlich Varon. Ist er tot und herrscht der Kult, bleibt Aldhelm in seiner Krypta (er ist Vampir), und Brandt führt das Exil. Ist Varon auf andere Weise tot, führt ebenfalls Brandt.
- **Der Hof zerfällt** (bleibt, Entwicklerentscheidung):
  - Die drei Adligen zerstreuen sich: `S.flags.varonScattered`, lebende Nicht-Hingerichtete. Wie `varonExecuted` werden sie beim Neubau übersprungen; sie kehren auch nach der Rückeroberung **nicht** zurück.
  - Ist der Verräter noch nicht gefunden (Auftrag 2 offen), läuft er offen zu Aurelion über: Chronik, der Auftrag endet mit „Zu spät“, ohne Lohn.
  - Die Gefangenen aus Aurelion entkommen im Chaos (`varonFreed` = alle).
  - Wurde der König vorher fortgebracht (§5.5 Punkt 4), zerstreut sich niemand.
- **Varonsburg besetzt:** Das Burgtor öffnet nicht („Die Toten halten die Burg. Erst die Stadt befreien.“). Der Thronsaal mit einem Statthalter der Toten ist optional (Scheibe 4).
- **Stadt:**
  - Die Königsgarde (`capGuard`) fällt.
  - Läden schließen (`fallShut` wie bei `aurelFall`).
  - 6 Knochenwachen gehen durch die Gassen (`heldGuard`).
  - Trümmer liegen herum (`afallProp`-Muster, eigener Schlüssel `capProp`).
  - Häuser brennen aus (das macht `capture` schon).
  - Die Bewohner bleiben in ihren Häusern und verstecken sich. 5 vorübergehende Flüchtlinge laufen sichtbar zum Exilort.
  - In `capture` geht der Bevölkerungsanteil heute fest nach Eren (`sim.js:326`). Neu bestimmt `H.refugeOf(node)` das Ziel; für Varonheim ist es der Exilort.
- **Wirtschaft:** Die Besetzungsregeln greifen von selbst (§4). Kein `S.after.tmul`, wegen der Löschung in `aurelFreed`.
- **Valen:**
  - Feldheere −20 % Stärke („Die Krone ist gefallen“), einmalig.
  - Der Zähler ist während der Besatzung ausgesetzt.
  - Valen holt zuerst verlorene Städte zurück (`sim.js:260`), und Varonheim ist eine Stadt. Ein Rückeroberungsziel gibt es also von selbst.
- **Gedächtnis der Welt:** `S.after.capital = { fell: Tag, why: 'Heerzug'|'Spieler'|'Debug', ruler: 'Varon'|'Brandt', exile: 'saltport'|…|null, kingLost, scattered: [...], evac: bool, retaken: null }`. `afterSay('Varonheim ist gefallen', …, 'war')` und ein Chronik-Eintrag der Art „legend“.

### 5.7 Rückeroberung und Endgültigkeit
- **Durch den Spieler:** Befreiung in Wellen wie überall (`battleCheck`). Für Varonheim gibt es **4 Wellen**, gemischt wie das „military“-Heer, und einen Hauptmann der Stufe 9 als „Statthalter der Toten“. Die Werte hat die Schwarze Feste schon (`sim.js:432–433, 470`).
- **Durch Valen:** Valens Heere ziehen von selbst gegen die Besatzung (30, ohne Mauerbonus).
- **Nach der Befreiung** (`H.capitalFreed`):
  - Besatzung 20, Mauern 30, die Reparatur läuft wieder.
  - Die Königsgarde kommt zurück (`capitalMigrate` darf das nur, wenn die Stadt nicht besetzt ist).
  - Läden öffnen, Trümmer verschwinden.
  - Der Exilhof kehrt heim, aber ohne die zerstreuten Adligen.
  - `S.after.capital.retaken = Tag`; Wohlstand −30 (`growthOf('varonheim').prosper`).
  - Wenn der Spieler die Wellen gebrochen hat: Titel „Befreier von Varonheim“ (das gibt es schon, `sim.js:494`). Valen +20, und Varon spricht ihn beim Wiedersehen an.
- **Endgültig?** VORSCHLAG: nie endgültig. Auf Schwer und Sehr schwer bleibt die Stadt besetzt, bis jemand sie befreit (keine Selbstheilung). Auf Angsthase kommt es gar nicht erst zum Heerzug. Dauerhaft bleibt nur der **zerfallene Hof** (Frage F3).

### 5.8 Querwirkung Blutkult
- **Rote Krönung:** Die Uhr steht still, solange Varonheim besetzt ist (`S.cult.crown` wird um die Besatzungstage verschoben). Ohne Hof gibt es keinen Hof-Mord.
- **Herrschender Kult:** Fällt die Stadt, verliert Aldhelm den Hof. `cultEnd` geht von „ruling“ auf **„hidden“**, `cultDrain` sinkt von 1 auf 0,5. Brandt führt das Exil. Der Kult kann weiter zerschlagen werden; der Weg in die Krypta führt dann durch die besetzte Stadt (Friedhofsgruft im Nordwesten).
- **Entführungen** (`cultTake`): ruhen während der Besatzung.
- **Spieler als Blutfürst:** Der Tribut der Kanzlei ruht während der Besatzung (Log: „Die Kanzlei ist geflohen. Kein Tribut.“). Der Zehnt ruht, die Ordensjäger kommen weiter. Hedda bleibt in den Katakomben.
- **`cultCrown` und `varonDead`:** Beides bleibt, wie es ist. Ist Varon schon tot, flieht der Herrscher nach §5.6.
- **Kettenwirkung** (Emergenz, gewollt): Wer den Kult ignoriert, bekommt die Rote Krönung (Tag ~65). Dann wächst Valen 1 weniger am Tag, und der Zähler steigt um +1 am Tag. Ungefähr nach Tag 100 kommt der Heerzug (§17).

### 5.9 Querwirkung §5g.8 (Fall Aurelions)
- Heute gilt: Kult aktiv oder herrschend = Varon gebunden (`cultWar`).
- VORSCHLAG: `varonBound() = cultWar() || capitalFallen()`. Ist Varonheim besetzt, kann Valen nicht in Aurelion einmarschieren; dann übernehmen die Automaten.
- „Varon marschiert ein“ heißt **Valen marschiert ein**: Ist der König tot und der Kult zerschlagen, führt Marschall Brandt das Heer (Frage F4).
- **Probe:** `varonBound()` ist wahr bei besetzter Hauptstadt und falsch, wenn die Stadt gehalten wird und der Kult zerschlagen ist.

### 5.10 Varons Tod aus anderen Gründen
- **Fehlerkorrektur zu `game.js:3551`:** Valen −100 nur, wenn `source` der Spieler oder seine Gruppe ist. Fällt der König auf der Flucht oder durch Untote, steht in der Chronik „König Varon fiel auf der Flucht“, und es gibt keine Rufstrafe.
- **Tötet der Spieler den König:** Varonheim steht weiter. Es herrscht Aldhelm (wie heute in der Chronik), bei zerschlagenem Kult Ysmay und Brandt. Der leere Thron erhöht die Bedrohung um +0,5 am Tag.
- **Exilkönig stirbt** (Banden, Spieler, Zufall): Brandt führt das Exil. Die Rückeroberung bringt dann Brandt als Reichsverweser zurück.

### 5.11 Totenfürst-Spieler (Ausblick, VORSCHLAG ohne eigene Frage)
`armyTargets` darf Varonheim ab Untoten-Rang 3 anbieten. Dann ist das Ziel des Befehls die Belagerung, keine Sofortschlacht. `holdTown` und das Urteil über die Bewohner (`heldFate`) gelten nur, wenn der Spieler vor Ort mitstürmt. Die Lebenden der Hauptstadt sind das größte Urteil im Spiel. Die Leitung kann das streichen; dann bleibt `village: true` als Sperre (Scheibe 4).

### 5.12 Alter Stand
`initSim` ergänzt fehlende Knoten aus `WAR_NODES` (`S.war.nodes[k] ||= structuredClone(WAR_NODES[k])`). Das ist der Kern der T40-Migration und lässt sich wiederverwenden. Fehlende Felder `walls` und `siege`, `S.war.capThreat`, `S.after.capital` und `S.flags.varonScattered` gelten als 0, null oder leer.
**Reihenfolge beachten:** In `continueGame` laufen die `ensure*`-Aufrufe vor `SIM.initSim()` (FAKT `game.js:2058` vor `2112`). Neue `ensure*`-Funktionen müssen ohne Knoten auskommen (`S.war?.nodes?.varonheim`) oder nach `initSim` aufgerufen werden.

## 6. Spielererlebnis
In den ersten Wochen hört man nur Gerüchte. Wer die Front verliert und den Kult laufen lässt, liest eines Abends „Die Toten marschieren auf Varonheim“ und sieht das Heer auf der Kriegskarte Ort für Ort näherkommen. Vor der Hauptstadt brennen Lagerfeuer der Toten. Auf der Mauer zählt Gero die Tage. Man liefert Holz, wagt nachts einen Ausfall, wartet auf das Entsatzheer — oder bringt den König durch das Westtor, während hinter einem die Glocken läuten. Fällt die Stadt doch, sitzt Varon in Salzhafen in einem Kontor, ohne Hof, und bittet einen Söldner um seine Krone.

## 7. Entscheidungen des Spielers
- Front halten (Bedrohung senken) **oder** den Kult jagen, beides kostet Zeit.
- Die Stadt versorgen (Material weg), einen Ausfall wagen (Risiko) oder auf den Entsatz warten.
- Den König früh fortbringen: Der Hof bleibt ganz, aber Valen verachtet die Flucht, und die Stadt fällt leichter.
- Nach dem Fall: zurückerobern (4 Wellen), Valen-Heere unterstützen oder die Lage ausnutzen (Totenfürst, Blutfürst, Aurelion-Freund).

## 8. Querwirkungen
| Bereich | Wirkung |
|---|---|
| NPCs | Königsgarde, Hof, Exilhof, Mauerhauptmann, Flüchtlinge; Bewohner verstecken sich; Adlige zerstreut |
| Fraktionen | Valen-Heer −20 %, Musterung nur im Exil, Verräter zu Aurelion, §5g.8 gebunden; Orden und Kette unberührt (T40 bringt sie später auf den Graphen) |
| Wirtschaft | Besetzte Hauptstadt produziert nicht, Kaufen ×1,5 (vorhanden); Handelszüge meiden sie; T09 (Läden am Stadtlager) leert die Läden dann von selbst |
| Kampf | Belagerungssturm vor Ort mit gemischtem Heer, Ausfall, Fluchtbegleitung, 4 Befreiungswellen |
| Erkundung | Weg in die Krypta durch die besetzte Stadt, Exilort als neuer Treffpunkt |
| Speichern | wenige neue Felder, alle mit Vorgabe; Gruppen vorübergehend und per `ensure*` neu gebaut |
| Koop | Wirt rechnet alles; Gero und Exilhof nutzen normale Gespräche (`uiHooks`); Gäste sehen das Lager als Figuren |
| Leistung | höchstens 6 Lagerfiguren + 7+7 Sturmeinheiten zusätzlich zur Garde, in einer Stadt mit bekannter Last (BUG-108-Messung aus T03 wiederholen) |

## 9. Emergenz
- Kult ignoriert → Krönung → Heer schwach → Heerzug → Fall → Kult verliert den Hof → Kult wird schwächer (versteckt) → Valen erholt sich im Exil.
- Hunger (Korn) macht Valen schwach → Heerzug früher. Wer Korn nach Nordfurt liefert, schützt indirekt die Hauptstadt.
- Fall der Hauptstadt → Varon gebunden → in §5g.8 übernehmen die Automaten statt Varon.
- Totenfürst-Spieler belagert die Hauptstadt und richtet über ihre Bewohner.

## 10. Risiken
- **Proben mit Kriegsverlauf:** Der neue Knoten ändert die Breitensuche bei Aschfurt und Nordfurt nur am Ende der Nachbarliste. Kriegs-Proben mit `warTick` können trotzdem anders würfeln (ANNAHME). Der Hunter vergleicht `RF.selftest()` vor und nach.
- **Probe „Audit T02“** (`game.js:17028`) setzt **alle** Valen-Knoten auf „undead“ und erwartet den Entsatz in **Nordfurt**. Mit der neuen Regel scheitert sie (Varonheim ist dann besetzt, also kein Entsatz). Sie wird angepasst, nicht gelöscht: Varonheim bleibt Valen, und erwartet wird `R2.at === 'varonheim'`.
- **Probe „König Varon“** (`game.js:17170`) muss die Hauptstadt als „gehalten“ setzen.
- **Nachbildung ≠ Spiel:** §17 rechnet ohne Wirtschaft, Orden, Garmadon und Spieler. Die echte Messung kommt in Scheibe 1.
- **Exilkönig in der offenen Welt** kann zufällig sterben → Korrektur zu `game.js:3551` ist Pflicht.
- **`S.after.tmul`** wird in `aurelFreed` geleert; nicht verwenden.

## 11. Alternativen
- **Nur Knoten, Sofortschlacht** (Mauer ×1,6, Besatzung 60): In der Nachbildung fiel die Stadt in **keinem** Szenario, weil die Toten sie nie erreichen. Ohne Heerzug wäre das Feature unsichtbar. Abgelehnt.
- **Belagerung nur durch den Totenfürst-Spieler:** sicher und klein, aber die Welt ohne den Spieler bliebe folgenlos. Ist Option C in F1.
- **Varonheim fällt endgültig:** stark, schließt aber Varons Auftragskette, den Blutkult am Hof und §5g.8 für den Rest des Spiels. Ist Option C in F3.

## 12. Abhängigkeiten
- **T02** (TESTING) — Zahlen von V1 und Hunter sind die Grundlage.
- **T07 Blutkult** (im Test) — `cultDrain`, `cultCrown`, `cultEnd`.
- **T40** — Migration „fehlende Knoten ergänzen“ und `varonBound()`. Dieses Paket nimmt beide vorweg; T40 baut darauf auf.
- **T03** (Varonheim TESTING) — Leistungsmessung in der Stadt.
- **T09** — nur Querwirkung, keine Voraussetzung.

## 13. Aufwand
Mittel bis groß, ungefähr wie zwei Blutkult-Scheiben.
- Scheibe 1 (sim.js-Kern): klein bis mittel
- Scheibe 2 (Fall und Exil): mittel
- Scheibe 3 (vor Ort): mittel
- Scheibe 4 (optional): klein bis mittel

## 14. Mögliche Exploits und Gegenmittel
- **Ausfall-Farmen:** höchstens einer je 6 Std.; die Abteilung ist vorübergehend, die Beute normal.
- **Versorgung als Goldquelle:** zahlt kein Gold, höchstens 3 Lieferungen am Tag, nur während der Belagerung.
- **Heerzug absichtlich auslösen** (Beute, Erfahrung): 30 Tage Pause, Auslöser ist die Weltlage.
- **König fortbringen und sofort zurück:** Er kehrt erst zurück, wenn die Belagerung endet, und der Preis wird sofort fällig.
- **Bedrohung durch Scheingefechte senken:** Nur echte Feldschlachten mit Sieger zählen (`battleCheck`), höchstens −6 am Tag.
- **Exilkönig töten ohne Strafe** über Untote, die man selbst lockt: `source` prüft den letzten Treffer. Lenkt der Spieler Feinde auf ihn, ist das gewollte Emergenz, kein Fehler.

## 15. Daten- und Codeplan
**data.js**
- `WAR_NODES.varonheim = { owner: 'valen', garrison: 60, walls: 100 }`; `WAR_EDGES` + `['northcity','varonheim'], ['ashford','varonheim']`, am Ende.
- Konstanten in sim.js oder data.js: `CAP_SIEGE = { gcap: 60, refill: 3, wallRep: 10, wallHit: 0.05, wallMin: 2, attAttr: 0.75, garAttr: 0.25, inner: 1.2, sally: 1.15, occ: 30, host: { schwer: 70, sehr_schwer: 80 }, thr: [10, 15, 20], cd: 30 }`. Alle Zahlen an einer Stelle für den Balance-Spezialisten.

**sim.js**
- `initSim`: fehlende Knoten aus `WAR_NODES` ergänzen.
- `resolveNode`: Sonderzweig Varonheim (Belagerung, Sturm, Entsatz ohne Einnahme).
- `warTick`: Entsatz-Vorrang für Valen; Belagerer bleibt stehen.
- `warDay`: Besatzungsdeckel und Auffüllen für Varonheim, Mauerreparatur, Belagerungsende, `capThreat` und Heerzug, Entsatz in Varonheim, normale Musterung ohne Varonheim.
- `capture`: Besatzung 30 bei Varonheim; `H.capitalFell`/`H.capitalFreed`; Flüchtlingsziel über `H.refugeOf`.
- `materialize`: Mischung und Stufe für den Knoten Varonheim.
- `battleCheck`: 4 Wellen für Varonheim.
- `warSummary`/`townState`: Zustand „Belagert“.
- Export `capitalState()` für UI und Proben.

**game.js**
- `bindSim`: `H.capitalFell`, `H.capitalFreed`, `H.refugeOf`, `H.siegeSay` (Log, Chronik, Hinweis, unter `S._quiet` still).
- Neu: `capitalFallen()`, `varonBound()`, `ensureCapitalSiege()` (Lager, Gero), `ensureVaronExile()`, `ensureCapitalOccupied()` (Knochenwachen, Läden, Trümmer, Burgtor), `capitalFall(why)`, `capitalFreed()`, `siegeChoices(npc, choices)` (Hook in `talk()` wie `keepChoices`).
- Ändern:
  - `die` (`3551`, Quelle prüfen)
  - `capitalMigrate` (keine Garde, solange besetzt)
  - `buildVaronburg` (`varonScattered` überspringen; nicht betretbar, solange besetzt — Tor-Prüfung beim Portal)
  - `varonChoices` (Exil: Audienz frei, Rückeroberungsauftrag)
  - `cultHour`/`cultTake`/`cultLordHour` (ruhen bei Besatzung)
  - `cultEnd`-Übergang „ruling“ → „hidden“ beim Fall
  - `armyTargets` (nur Scheibe 4)
- Aufrufe von `ensure*` in `newGame` und `continueGame` nach `SIM.initSim()`.

**Spielstand** (alle mit Vorgabe):
- `S.war.nodes.varonheim.{walls, siege}`
- `S.war.capThreat`, `S.war.hostCd`, `S.war.capStage`
- `S.after.capital`
- `S.flags.varonScattered`
- `S.cult.crownPause`
- Nichts davon ist in `SKIP`. Lager, Exilhof und Knochenwachen sind `transient`.

**Spielerhinweise:**
- Gerücht und Chronik bei 10, 15 und 20
- Hinweis bei Heerzug, Belagerung, Sturm, Fall und Befreiung
- Tagesmeldung während der Belagerung („Varonheim: Mauern 64 %, Besatzung 52“)
- Gero erklärt die vier Wege
- Exil-Varon erklärt die Rückeroberung
- Kriegskarte mit „Belagert“
- Eintrag in `docs/MECHANIKEN.md`

**Debug** (Abschnitt „Varonheim: Belagerung“):
- Bedrohung +10
- Heerzug jetzt
- Belagerung jetzt (Heer 70 vor die Mauern)
- Mauern auf 0
- Varonheim fällt
- Varonheim befreien
- Exil zeigen (Teleport)
- Status
- Die vorhandene Schleife „Krieg 10 Tage vorspulen“ reicht für die Messung.

**Proben** (alle in `sandbox()`; `S.war`, `S.towns`, `S.eco`, `S.after`, `S.flags`, `S.cult` sichern und zurücksetzen):
1. **„Varonheim-Knoten“:** Ein Stand ohne Knoten bekommt ihn mit Besatzung 60 und Mauern 100. Es gibt Kanten nach Nordfurt und Aschfurt, keine nach Kreuzweg.
2. **„Belagerung statt Sofortschlacht“:** Ein Heer mit 110 auf Varonheim → nach einem Zug ist `siege` gesetzt und die Stadt gehört Valen. Die Mauern sinken je Zug. Ein Sturm kommt erst bei Mauern 0. Ein verlorener Entsatz nimmt die Stadt nicht ein.
3. **„Entsatz“:** Hat Valen außer Varonheim keine Stadt, entsteht der Entsatz **in Varonheim**. Wird Varonheim belagert, gibt es keinen Entsatz. Die angepasste T02-Probe geht hier auf.
4. **„Heerzug“:** 20 Tage mit ≥ 6 Untotenknoten → Heer mit `order: 'varonheim'`. Auf Angsthase kommt keiner, nach `garmadonSlain` auch nicht. Führt Valen klar, bleibt die Bedrohung bei 0.
5. **„Fall“:**
   - `S.after.capital` ist gesetzt.
   - Der König steht am Exilort.
   - Das Burgtor ist zu.
   - Die Läden haben `fallShut`.
   - Die Adligen stehen in `varonScattered`.
   - Die Krönungsuhr ruht.
   - Die Flüchtlinge ziehen zum Exilort, nicht nach Eren.
   - Ein herrschender Kult geht auf „hidden“.
   - Der Tribut ruht.
6. **„Rückeroberung“:** `capture(…, 'valen')` → Hof daheim ohne zerstreute Adlige, Exil leer, Garde zurück, `retaken` gesetzt.
7. **„§5g.8“:** `varonBound()` nach den Fällen in §5.9.
8. **„Königstod“:** Tod des Königs ohne Spielerquelle → `varonDead` ja, Valen unverändert.
9. **„60 Tage ohne Spieler“:** `seedRng` fest, Spieler auf `deep`, 60× (4× `warTick` + `warDay`) → Varonheim gehört Valen. Das ist eine Plausibilitätsprobe, keine Statistik.

## 16. Scheiben (testbar einzeln)
- **S1 — Knoten, Belagerung, Heerzug (abstrakt):**
  - Inhalt: data.js, sim.js-Kern, Migration, Entsatz neu, Bedrohung mit Hinweisen der Stufen 10, 15 und 20, „Belagert“ auf der Karte, Debug, Proben 1–4 und 9, Anpassung der T02-Probe.
  - Übergang: Fällt die Stadt in S1, ruft `H.capitalFell` vorerst nur den Kern aus `aurelFall` (Wachen, Läden, Trümmer, Chronik). So bleibt kein Zwischenstand ohne Folgen.
  - **Messung im Spiel:** 6× „Krieg 10 Tage vorspulen“ auf 5 Ständen. Gemessen werden die Bedrohungskurve, Heerzug ja/nein, Belagerungsdauer und Fall ja/nein.
- **S2 — Fall, Exil, Hof, Kult, §5g.8:**
  - Inhalt: König flieht, Exilhof, zerstreute Adlige und Verräter, Gefangene, Burgtor zu, Rückeroberung mit Wiedereinzug, `S.after.capital`, Kultpausen und „ruling“ → „hidden“, Blutfürst-Tribut ruht, `varonBound()`, Korrektur zu `die` `3551`.
  - Proben 5–8.
- **S3 — Belagerung vor Ort:**
  - Inhalt: Heerlager, Mauerhauptmann Gero mit vier Wegen (Verteidigen, Ausfall, Versorgen, König fortbringen), Sturm vor Ort mit gemischtem Heer der Stufe 9, Fluchtbegleitung des Königs beim Fall.
  - Kampfwerte misst der Kampf-Spezialist mit `RF.simFight`.
- **S4 (optional) — Totenfürst und Thronsaal:**
  - Inhalt: `armyTargets` ab Rang 3, Urteil über die Hauptstadt nur vor Ort, besetzte Varonsburg mit Statthalter im Thronsaal als letzte Welle.

## 17. Balance: Messung der kopflosen 60-Tage-Schleife (Nachbildung)
**Methode (ANNAHME-Ebene):**
- Weil hier kein Browser läuft, habe ich `warTick`, `resolveNode`, `battleAbstract`, `capture` und `warDay` 1:1 in Python nachgebaut (Notizblock-Datei, nicht im Repo). Startwerte stammen aus `WAR_NODES` und `initSim`. Jeder Tag hat 4 Züge und einen Tagesschritt. Gerechnet ist ohne Spieler, also bei voller Vernachlässigung.
- Nicht nachgebaut: Wirtschaft (Korn als Schalter „gut“ = Valen +3, „kein“ = +1), Garmadon, Orden, Spieler-Schlachten.
- Jedes Szenario lief 200-mal. Schwer: Deckel 110, Heerzug 70, Besatzung 60.

**Wichtigster Befund:** Die Nachbildung ist valenfreundlicher als die Hunter-Messung im Spiel („Nordfurt und Eren wechseln mehrfach“). Bei „Korn gut“ ist Nordfurt im Schnitt unter einem Tag verloren. Das Spiel liegt vermutlich zwischen „Korn gut“ und „kein Korn“ (ANNAHME). Scheibe 1 muss im Spiel nachmessen.

| Szenario (Spieler fehlt ganz) | Heerzug bis Tag 120 / 200 | Fall bis Tag 60 | Tag 120 | Tag 200 | frühester Fall |
|---|---|---|---|---|---|
| Ohne Heerzug, nur Knoten (naiv oder Belagerung), alle Szenarien | — | 0 % | 0 % | 0 % | — |
| A Korn gut, kein Kult | 0 % / 0,5 % | 0 % | 0 % | 0 % | — |
| B kein Korn | 8 % / 11 % | 0 % | 0 % | 0,5 % | Tag 200 |
| C Korn gut, Kult herrscht ab Tag 65 | 16 % / 67 % | 0 % | 1 % | 3 % | Tag 105 |
| D kein Korn, Kult herrscht ab Tag 65 | 65 % / 100 % | 0 % | **7 %** | **23 %** | Tag 78 |
| E kein Korn, Kult versteckt ab Tag 30 | 33 % / 50 % | 0,5 % | 6,5 % | 9,5 % | Tag 59 |
| **Härter** (Heerzug 85): C / D / E | — | — | 4 / 28,5 / 16,5 % | 18,5 / 73,5 / 30 % | Tag 46–50 |
| **Schwächer** (Besatzung 45): D / E | — | — | 14 / 8,5 % | 64,5 / 17,5 % | Tag 59–60 |

**Weitere Messwerte:**
- Belagerung bis Fall: im Median etwa 10 Tage.
- Die Stadt fällt nur bei etwa jedem zehnten Sturm, weil der Entsatz und der Abrieb das Heer schwächen.
- Rückeroberungen durch Valen allein: 0,27 je Lauf über 200 Tage im Szenario D.
- Bewertung: Mit Heerzug 70 und Besatzung 60 ist das Ziel erfüllt. In einem normalen Spiel (Korn und Front halbwegs gehalten oder der Kult bekämpft) fällt Varonheim praktisch nie. Bei langer Vernachlässigung samt Krönung und Hunger fällt es in etwa jedem vierten Spiel nach rund 150 Tagen, frühestens ab Tag ~78. Die Bedrohungsstufen kündigen das Wochen vorher an.

## 18. Fragen an den Entwickler (höchstens 4)
**F1 — Wie gefährlich ist die Hauptstadt?**
- (A, empfohlen) Heerzug 70 / Sehr schwer 80: fällt nur bei langer Vernachlässigung (Szenario D: 7 % bis Tag 120, 23 % bis Tag 200).
- (B) Heerzug 85: deutlich härter (D: 28,5 % / 73,5 %, frühester Fall Tag ~50).
- (C) Kein eigener Heerzug: Belagerung nur durch einen Totenfürst-Spieler oder durch Debug; die Welt allein nimmt die Stadt nie.

**F2 — Wohin flieht der König?**
- (A, empfohlen) Nach Salzhafen (weit hinter der Front), sonst Nordfurt, sonst Eren; Exilhof mit Varon, Brandt, Ysmay und Hagen.
- (B) Immer in die nächste Valen-Stadt (oft Nordfurt, nah an der Front, bedrohter).
- (C) Er gerät in Gefangenschaft der Toten; ein Befreiungsauftrag ersetzt das Exil.

**F3 — Ist der Fall endgültig?**
- (A, empfohlen) Rückeroberung möglich (4 Wellen oder Valen-Heer); die zerstreuten Adligen kommen nie zurück; keine Selbstheilung auf Schwer und Sehr schwer.
- (B) Rückeroberung möglich, aber der König bleibt im Exil; Varonheim wird nur noch Grenzfeste.
- (C) Endgültig: Varonheim bleibt eine Totenstadt.

**F4 — §5g.8 nach dem Fall oder dem Tod des Königs**
- (A, empfohlen) Eine besetzte Hauptstadt bindet Valen (dann übernehmen die Automaten). Ein toter König bindet nicht, Marschall Brandt führt den Einmarsch.
- (B) Nur ein lebender Varon in einer gehaltenen Hauptstadt marschiert ein; sonst immer die Automaten.
- (C) Auch der Exilhof kann einmarschieren, mit einem schwächeren Heer.
