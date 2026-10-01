# Stadt ohne Schutz — Entwurf (Designer, 01.10.2026)

Anlass ist der Bericht des Entwicklers vom 01.10.: „Ich hab in Varonheim alle Wachen getötet, aber nichts passiert. Keine Leute rennen aus der Stadt … Nach und nach müsste die eingenommen werden etc.“
Der Grundsatz ist freigegeben. Dieser Entwurf regelt, **wie** es umgesetzt wird. Er enthält keinen Code.
Zeilenangaben gelten für den Stand vom 01.10. Die Hauptsitzung editiert `game.js` parallel, deshalb können sie um etwa 20 Zeilen verrutschen. Maßgeblich ist der Funktionsname.

Verträglichkeit mit `varonheim_umbau.md` (paralleler Entwurf: Varonheim größer, weiter nördlich, Burg begehbar, Waffensuche):
- Hier steht keine einzige feste Koordinate.
- Alle Posten kommen aus `TOWN_PLAN.varonheim` und aus der Postenliste in `capitalMigrate`.
- Die Burgkarte `varonburg` bleibt ein **eigener Zähler**. Am Burgumbau ändert dieser Entwurf nichts.

---

## 1. Befund: Warum „nichts passiert“

| # | Ursache | Stelle |
|---|---|---|
| 1 | Die Königsgarde ist `transient`. `capitalMigrate` setzt bei jedem Laden 10 neue Gardisten hin, sobald kein `capGuard` existiert. Ein Spielstand nach dem Massaker lädt also eine volle Garde. | `game.js:8268–8275` (Aufruf über `ensureVaronGate` → Ladekette `:1870/:2059`) |
| 2 | Tote Figuren verschwinden aus `S.ents` (`arr.splice` in `die`). Kein System zählt, dass einer Stadt Wachen **fehlen**. | `die` `:3506`, Splice `:3614` |
| 3 | Andere Städte haben dieselbe Lücke in zwei Spielarten:<br>– Die Automaten Aurelions kommen erst zurück, wenn **alle** einer Stadt tot sind (`ensureAurelion`: `some(e => e.robot && e.post === key)`).<br>– Die Wachposten aller Städte werden nur nachgerüstet, wenn **weltweit** keine Wache mit `post` lebt (`continueGame`, `:2117`).<br>– Verteidigungsmeister (`vm`) sind `transient` und stehen nach jedem Laden wieder da. | `:5624`, `:2117`, `:7960–7972` |
| 4 | Die Besatzung im Kriegsgraphen ist rein abstrakt. `S.war.nodes.varonheim.garrison` (60) kennt die Gardisten auf der Straße nicht, und `capDay` füllt täglich +3 bis 60 auf. Ein Massaker berührt den Krieg also gar nicht. | `sim.js:69–76`, `:356–373` |
| 5 | `bloodshed` straft nur den **ersten** Mord. Danach sind die Wachen zornig (`wasFoe`), und jede weitere tote Wache kostet weder Ruf noch Kopfgeld. Bürger in 300 px fliehen einen Tag, sonst geschieht nichts. | `:3620–3640` |
| 6 | Panik, Flucht und Übernahme hängen nur an Hunger, `townDanger` (Heer oder Überfall in der Nähe) oder einem Knotenwechsel auf `undead`. Kein Pfad führt von „Wachen tot“ dorthin. | `migrationDay :1428`, `townDanger :1280`, `capture sim.js:401` |
| 7 | Die Bausteine gibt es schon, sie sind nur nicht verbunden:<br>– `emigrate(k,'fear',dest)` `:1438`<br>– `SIM.H.spawnRefugee` `:1915`<br>– Läden schließen über `fallShut`, bei `capitalFall` `:8291` und `aurelFall` `:10397`<br>– Verstecken im Haus `dayTargetRaw :1169`<br>– `holdTown :6166`<br>– Banden `bandFound/bandTick :11039ff`<br>– Rachezug `afterAvenge/avengeHour :10149`<br>– Wohlstand `growthDay :6930`<br>– Kettengarnison `banditsOnTribute :5676`<br>– Patrouille `sendPatrol :10796`<br>– Glocke `sfx 'bell'` (`sfx.js:53`)<br>– Szenen `capitalScene`/`cinematic` mit `say`, `card`, `gesture` `:9109` | — |

Daraus folgt: Es braucht keine neue Simulation. Gebraucht werden **ein persistenter Zähler je Stadt**, eine **Stufenmaschine** und Anschlüsse an die vorhandenen Bausteine.

---

## 2. Kern: Zähler „Schutz“ je Stadt

### 2.1 Soll und Ist
- **Soll(k)** wird berechnet und nicht gespeichert, damit Umbauten (z. B. ein größeres Varonheim) es automatisch mitnehmen. Es ist die Summe aus:
  - `GUARD_POSTS[k].posts.length`
  - den Posten in `capitalMigrate` (Varonheim; heute 10; die Länge der Liste zählt)
  - Automaten aus `ensureAurelion` (8, Metropole +12)
  - 1 Verteidigungsmeister, falls die Stadt einen bekommt
  - eingekaufte Wachen (`invested`, `:6957`); sie erhöhen das Soll dauerhaft
- **Nicht** zum Soll zählen alle Bewaffneten, die nur kurz oder für einen anderen Zweck da sind: `raidDef`, `avenger`, `quarGuard`, `bondGuard`, `exileCourt`, `tribGarrison` (Kettengarnison, eigene Frist), `scytheMilitia`, `nightWatch`, `sunLegion`, `legion`, `varonCourt` (Burgkarte, eigener Zähler `varonburg`).
- **Ist(k)** zählt die lebenden Wachen mit `post === k` (dazu `vm === k`). Gezählt wird nur einmal pro Tag und bei einem Todesfall, nie in jedem Bild.

### 2.2 Persistenter Verlust
Neues Spielstandsfeld `S.schutz` (siehe §7). Je Stadt `S.schutz[k]` mit diesen Feldern:
- `lost`: Zahl der Wachen, die gerade fehlen
- `byP`: davon durch Spieler, Gruppe, Diener oder Koop-Pilot (dieselbe Prüfung wie in `ruinCheck :10190`)
- `at`: Tag des letzten Verlusts
- `stage`: Stufe 0–4 (§3)
- `panic`: Ende der Panik (Spielzeit)
- `reinf`: Nachschub unterwegs, als `{ day, n, by }`
- `taker`: wer die Stadt hält, als `{ by: 'band'|'undead'|'chain', id, day }`

Der Haken sitzt in `die()`: Ist `c.guard`, gehört `c` zum Soll und ist die Stadt bestimmbar (`post`, `vm`, `capGuard`), dann gilt `lost++` und bei Spielertat zusätzlich `byP++`.

### 2.3 Das Neuladen respektiert den Verlust (die eigentliche Fehlerbehebung)
Jede Spawn-Stelle setzt nur noch **Soll − lost** Wachen und nimmt dabei die Posten vom Ende der Liste weg. Das Tor bleibt also zuletzt leer, der Platz zuerst. Betroffen sind:
- `capitalMigrate`
- `ensureAurelion`, die statt „gar keine Automaten“ nun „fehlende minus Verlust“ prüft
- `ensureDefenseMasters`: Der Verteidigungsmeister zählt als letzte Wache und fällt als letzter weg
- `spawnGuardPosts`, das nur noch auffüllt, was weder lebt noch als verloren gebucht ist

Die Bedingung in `continueGame :2117` („weltweit keiner“) entfällt. Damit merkt sich ein Spielstand, dass Varonheim leer ist.

### 2.4 Nachschub: Wer ersetzt Tote? (abhängig vom Herrn, `townFac(k)`)
Nachschub kommt nur, wenn der Herr nicht gebunden ist. Er ist **sichtbar**: Ist der Spieler in der Nähe (unter 90 Feldern), läuft eine `sendPatrol`-Kolonne vom Herkunftsort zur Stadt. Sonst wird er abstrakt verbucht.

| Herr | Herkunft | Takt | Menge | Kosten / Sperre |
|---|---|---|---|---|
| **Valen** (Eren, Nordfurt, Salzhafen, Dörfer, Varonheim) | nächster Valen-Kriegsknoten mit Besatzung über 15 (Varonheim: Nordfurt, sonst Aschfurt) | 2 Tage nach dem letzten Verlust, danach alle 2 Tage | 3 | Herkunftsknoten `garrison −3`. **Gesperrt**, wenn der Herkunftsknoten belagert wird, `varonBound()` gilt oder `capThreat ≥ 15` ist (die Krone hält ihre Leute zusammen). |
| **Aurelion** | Gelenkhall (Automatenschmiede); bei Thronstreit keiner | täglich | 2 | Nach T23 abhängig vom Wohlstandsindex: unter 40 nur 1. Gesperrt, solange Gelenkhall besetzt ist (`heldBy`). |
| **Kette** (Tributdörfer, Eisenfeste) | Eisenfeste, wie `banditsOnTribute` | alle 2 Tage | 2 Kettenkrieger | Gesperrt nach `S.flags.chainsBroken`. Ab T23 „Kette ohne Hände“ (unter 6 Köpfen) ebenfalls gesperrt. |
| **Händler** (Kreuzweg, Rastfurt, …) | Söldner aus der Stadtkasse | täglich | 1 | Wohlstand der Stadt −5 je Söldner. Unter 0 kommt keiner. |
| **Orden** (Sonnwacht, Lichtenrain) | Sonnwacht | alle 3 Tage | 2 | Gesperrt, solange Sonnwacht belagert oder besetzt ist. |
| **Tote** (Vharnholm) | erheben sich selbst | täglich | alle | Keine Gesetzlosigkeit. Die Toten kennen keine Panik. |

`lost` sinkt um die Ankommenden; `byP` sinkt anteilig. Erreicht `lost` den Wert 0, fällt `stage` auf 0. Das Log meldet dann „Die Wache von X ist wieder vollzählig.“

---

## 3. Stufen

Das Verhältnis ist **r = lost / Soll**. Gezählt wird nur, was nicht durch Nachschub schon ersetzt ist.

| Stufe | Bedingung | Name (Tooltip, Ortskarte) |
|---|---|---|
| 0 | r < 0,5 | Bewacht |
| 1 | r ≥ 0,5 | Geschwächt |
| 2 | r ≥ 0,8 **oder** Ist = 0 | Schutzlos — **Alarm** (sofort, §4) |
| 3 | Stufe 2 seit 2 Tagen ohne Nachschub | Gesetzlos |
| 4 | Stufe 3 seit 2 Tagen (Angsthase 4, Sehr schwer 1) | Übernommen (§5) |

`SIM.townState(k)` bekommt die Zustände „Schutzlos“ und „Gesetzlos“ zwischen „Belagert“ und „Bedroht“. Damit erscheinen sie im Handelsmenü, auf der Ortskarte und in `townDanger`. Das ist die bestehende Kopplung an Wegzug und Verstecken.

---

## 4. Sofortreaktion (Stufe 2, einmal je Absturz)

`schutzAlarm(k)` läuft im Moment, in dem Stufe 2 erreicht wird. Ist der Spieler fern, läuft dieselbe Wirkung ohne Szene und mit einem Logeintrag. Die Wirkung:

1. **Sturmglocke:** Ist der Spieler unter 60 Feldern entfernt, ertönt `sfx 'bell'` dreimal im Abstand von 0,8 s.
2. **Kurze Szene** (Regiebuch, unter 3 s, nicht pausierend, ESC überspringt; Folgen laufen trotzdem):
   - Ein Bürger am Platz ruft per Sprechblase „Die Wache ist tot! Lauft!“, mit Geste `zeigen`.
   - Danach Karte `„<STADT> IST SCHUTZLOS“`, Untertitel „Die Glocke läutet. Wer kann, flieht.“
   - Varonheim hat eine eigene Zeile: „Die Königsgarde ist gefallen. Der König lässt die Burgtore schließen.“
   - Gesperrt in Kampf, Dialog, Kerker und Koop-Gast; in diesen Fällen bleibt nur Toast und Log (wie `capitalScene :9110`).
3. **Flucht, sichtbar und gedeckelt:**
   - Etwa 30 % der `villagersOf(k)` ziehen weg (keine Namensfiguren, keine Händler, keine Gefährten).
   - Höchstens 6 von ihnen laufen sichtbar über `emigrate(k, 'fear', ziel)`. Ziel ist die nächste nicht bedrohte Stadt **desselben Herrn** (sonst irgendeine lebende, über `livingTowns`).
   - Der Rest wird abstrakt verbucht: `S.towns[k].pop −20 %`, das Ziel bekommt +70 % davon.
   - Neuer Grußtext für die Fliehenden: „Die Wache liegt im Dreck. Wer schützt uns jetzt? Niemand.“
4. **Verstecken:** Wer bleibt, geht ins Haus. `dayTargetRaw` bekommt dazu eine Zeile analog zu BUG-099: `stage ≥ 2` gilt wie Besatzung, außer zur Arbeit.
5. **Läden zu:**
   - Alle Händler der Stadt: `shopClosed = 1e12`, `schutzShut = k`.
   - Das ist ein eigenes Flag, damit `capitalFreed`/`aurelFreed` (die `fallShut` öffnen) nichts Falsches aufmachen.
   - Sie öffnen erst bei Stufe 0 oder 1.
6. **Letztes Aufgebot:**
   - Die noch lebenden Wachen, der Verteidigungsmeister und 2–4 neue Milizionäre (`guardChar('merch', …, 'Miliz')`, `transient`, ohne Brustpanzer wie `:6080`) sammeln sich am Platz.
   - Hat der Spieler den Alarm verursacht (`byP / lost ≥ 0,5`), sind sie `angry` gegen ihn; sonst verteidigen sie die Stadt gegen den, der sonst dort tötet.
7. **Ruf und Kopfgeld:**
   - Die Lücke aus #5 wird geschlossen: Jede Wache des Soll, die der Spieler tötet, kostet **zusätzlich** −4 Ruf beim Herrn, auch wenn sie schon zornig war.
   - Erreicht die Stadt Stufe 2 durch den Spieler, gibt es einmalig **„Wachmord in X“**: Kopfgeld +300, bei Varonheim +800 und Rang „Königsfeind“ (Chronik, Kategorie `crime`).
   - Dazu kommt ein Steckbrief am Brett (T08).

---

## 5. Über die Tage (ohne Nachschub)

### Stufe 3 „Gesetzlos“ (`schutzDay`, einmal am Tag aus `dayTick`)
- **Wohlstand:** `growthDay` bekommt die Summanden `−8` bei Gesetzlosigkeit und `−4` bei Schutzlosigkeit. Damit stürzt die Stadt in etwa 5 Tagen unter 0, und das jüngste neue Haus verfällt (bestehende Regel `:6936`).
- **Markt:** In `economy.js` gilt `lawless(k)` wie ein halbes `occupied`: Kaufen kostet ×1,25, und es gibt keine neuen Aufträge am Brett.
- **Kein Gesetz:** `arrestCheck` greift in dieser Stadt nicht. Kopfgeld läuft weiter, aber hier verhaftet dich niemand.
- **Plünderer:** Ist der Spieler unter 60 Feldern entfernt, ziehen nachts 2–4 Plünderer durch die Gassen (`bandit`, `transient`, Flag `lawless: k`). Sie greifen Bürger an. Wer sie erschlägt, bekommt beim Herrn +3 und Dank im Log.
- **Wegzug:** `migrationDay` zählt einen gesetzlosen Tag als „bad“. Nach 3 Tagen ziehen also weitere Leute fort (bestehende Regel).

### Stufe 4 „Übernommen“: Wer nimmt die Stadt? (`schutzTaker(k)`, in dieser Reihenfolge)
1. **Tote**, wenn die Stadt ein Kriegsknoten ist und ein Untotenheer höchstens 2 Kanten entfernt steht. Es bekommt `a.order = k`. Den Rest erledigt `warTick`/`resolveNode` → `capture` → `holdTown`-Folgen (Flüchtlinge, Schäden, Knochenwachen). Neue Kopplung: Die Besatzung des Knotens wird auf `cap × (1 − r)` gedeckelt, eine leergemordete Stadt hat also kaum Besatzung. Varonheim siehe §6.
2. **Bande**, wenn eine Bande im Umkreis von 80 Feldern lagert (sonst `bandFound(k)` neu). Ergebnis „Bandenherrschaft“:
   - `taker = { by: 'band', id }`.
   - Bandenmänner ersetzen die Wachen. Sie sind `transient` und werden von `ensureSchutz` je Laden neu gesetzt, wie die Knochenwachen (`heldGuard`).
   - Die Läden öffnen wieder, mit Preisen ×1,5.
   - Der Unterhändler steht am Stadttor: Schutzgeld zahlen, damit man rein darf.
   - Bürger zahlen; Wohlstand −3 pro Tag.
   - **Befreiung:** Fällt der Anführer (`bandKill`), endet die Herrschaft. Der Herr schickt sofort Nachschub, und der Spieler bekommt +10 beim Herrn.
3. **Kette**, nur für Valen-Dörfer am Westrand (Region `eisen`/Nachbar eines Tributdorfs) und solange die Kette steht:
   - Das Dorf wird Tributdorf (`S.tribute[k]`).
   - Kettenkrieger statt Torwache; vorhandene Tribut-Logik.
4. **Niemand:** Gibt es keine Bande und kein Heer, bleibt die Stadt gesetzlos. Mit jedem Tag steigt die Chance, dass sich eine Bande bildet, um 15 %.

Ein Dorf (`VILLAGES`), dessen letzter Bewohner stirbt, wird weiterhin über `ruinCheck → raze` zur Ruine. Das bleibt unverändert und ist die härteste Folge.

### Strafzug des Herrn
- Ist `byP / lost ≥ 0,5` bei Stufe 2, gilt: `afterAvenge(lordFac, n, 'Strafzug für <Stadt>', ri(1,2), kit)` mit `n = 3 + byP/3` (höchstens 8).
- Kit je Herr:

| Herr | Kit | Name |
|---|---|---|
| Valen | `valen` | „Königsgarde“ bei Varonheim, sonst „Strafbüttel“ |
| Aurelion | `aurel` | Automaten |
| Kette | `chainx` | — |
| Orden | `order` | — |

- Läuft über das bestehende `avengeHour` (nur draußen, nicht in Städten).
- Varonheim schickt zusätzlich nach 5 Tagen einen zweiten Zug mit Marschall Brandt als Anführer. Das gilt nur, wenn die Krone nicht gebunden ist (`varonBound()`).

---

## 6. Varonheim als Schaustück

Varonheim läuft durch dieselbe Maschine. Dazu kommen drei Kopplungen, alle innerhalb von `CAP_SIEGE`:

1. **Garde ↔ Besatzung:**
   - Jeder tote Gardist, der zum Soll zählt: `nodes.varonheim.garrison −4` (10 Gardisten entsprechen −40, von 60 bleiben 20).
   - `capDay` füllt nicht auf, solange `S.schutz.varonheim.stage ≥ 1` ist. Erst Nachschub senkt die Stufe.
   - Neuer Wert `CAP_SIEGE.guardHit: 4`.
2. **Bedrohung:**
   - Bei Stufe 2 steigt `capThreat` einmalig um +3.
   - Danach gilt in `capThreatDay` für jeden Tag mit Stufe ≥ 1 der Summand `+0,5` („Morvaths Späher sehen offene Tore“).
   - Die bestehenden Sperren (`from: 20`, Angsthase, Garmadon tot) bleiben.
   - Dadurch kommt der Heerzug früher und trifft eine ausgeblutete Stadt mit Besatzung 20 statt 60. Bei Mauerbruch fällt sie viel schneller, und das löst die vorhandene Kette `capitalFall` → Exil → Hof zerfällt aus.
   - Es gibt **keinen** neuen Direktfall. Die Nutzerentscheidung „fällt nur bei langer Vernachlässigung“ bleibt gewahrt, das Massaker ist diese Vernachlässigung.
3. **Hof und König:**
   - Bei Stufe 2 schließt die Burg. Die Burgkarte `varonburg` mit ihren 8 Gardisten ist die letzte Bastion und wird nicht vom Stadtalarm geleert.
   - Ist der Spieler der Täter, gilt er dort als Feind. Im Varon-Dialog steht „Ihr habt meine Garde erschlagen.“
   - Hat der Spieler Garde **und** Burgwache getötet, setzt der König `S.flags.varonEvac = 1` und flieht vorzeitig ins Exil, dem vorhandenen Schalter entsprechend. Der Hof bleibt dabei ganz, und Varonheim bleibt Valens Stadt ohne König, bis Nachschub kommt.
   - Das fügt sich in den Burg-Begehen-Entwurf: Die Burg ist dann leer und begehbar, nur die Waffenkammer ist verschlossen.
   - Der Nachschub nach Varonheim kommt aus Nordfurt: 3 Gardisten alle 2 Tage. Er ist gesperrt bei `capThreat ≥ 15`, und genau dort wird es spannend.
4. **Ohne König oder bei herrschendem Kult:** Herrscht der Kelch (`S.cult.end === 'ruling'`), kommt kein Nachschub. Stattdessen stellt Hedda 4 „Maskierte“ als Nachtwache. Das ist ein Hinweis auf den Kult, keine echte Sicherheit.

---

## 7. Entscheidungen des Spielers

| Weg | Was | Anschluss |
|---|---|---|
| **Schützen** | Plünderer erschlagen. Beim Verteidigungsmeister „Wache verstärken“ (bestehend, `:6957`), hier zum halben Preis, solange die Stadt schutzlos ist. Neuer Aushang „Halte X drei Nächte“: belohnt Ruf +10 beim Herrn, verkürzt den Nachschub um 1 Tag und senkt `byP` um 2, eine Art Wiedergutmachung. | `defOf`, Verträge `makeContract` |
| **Selbst übernehmen** | Nur über **bestehende** Wege, keine neue Thronmechanik (Aurelion bleibt ausgeschlossen, Entscheid „Kein Thron“). Toter mit Rang ≥ 0: Sael bietet „Die Stadt ist offen — die Toten nehmen sie“ an → `holdTown(k)` → `heldFate`. Bei Varonheim geht es nur über den Heerzug (Rang 3, Belagerungsentwurf §167). Blutfürst (`S.cult.end === 'player'`) in Varonheim: Hedda bietet die Nachtherrschaft an; der Zehnt läuft ohne Kopfgeld, Valen hetzt aber den Orden auf (+1 Rachezug je 5 Tage). Eigene Bande als Stadtherr: siehe Frage 3. | `undeadRaidChoices`, `cultChoices` |
| **Plündern** | An geschlossenen Ständen (`schutzShut`) neue Option „Stand ausräumen“: Kasse (`till`) und 2–3 Waren. Ohne Zeugen kein Kopfgeld, aber Wohlstand −10 und Grausamkeits-Ruf (T08 `styleOf`) −5. Mit Zeugen gilt es als Diebstahl, wie heute. | `talk`, `styleOf` |
| **Fliehen** | Einfach gehen. Nachschub kommt, Steckbrief und Strafzug bleiben. Nach 3 Tagen mit Stufe 0 senkt die Stadt das Kopfgeld nicht schneller, es bleibt die normale Abklingzeit. | `bountyDay` |

Hinweise für den Spieler (Pflicht, Gedächtnis „explain-to-player“):
- Alarm-Szene und Log
- Tooltip auf der Ortskarte („Schutzlos: 2/10 Wachen, Nachschub in 1 Tag“)
- Gruß des Verteidigungsmeisters je Stufe
- Kodex-Kapitel „Stadt ohne Schutz“ (beim ersten Alarm freigeschaltet, wie `S.flags.crimeSeen`)

---

## 8. Technik

### Spielstand und Migration
- Neu ist nur `S.schutz = { [town]: { lost, byP, at, stage, panic, reinf, taker } }`. Es steht nicht in `SKIP`.
- **Fehlt das Feld** (alter Stand), gilt `{}`, also alle Städte voll.
- Ein alter Stand **nach** einem Massaker kann den Verlust nicht kennen. Er lädt eine volle Garde wie heute, und das ist akzeptabel, weil die Migration billig bleiben soll (Entscheid 01.10.).
- `ensureSchutz()` gehört in **beide** Ladeketten (`newGame`, `continueGame`, neben `ensureVaronGate`). Es baut `transient` die Bandenwachen, die Miliz bei Stufe ≥ 2 und die `schutzShut`-Läden aus dem Spielstand neu auf. Es ist idempotent.
- `schutzShut` wird beim Laden aus `stage` neu gesetzt und nicht als Figurenfeld gespeichert.

### Weltgenerierung
- Kein `rnd()` in `world.js`.
- Zufall nur in `schutzDay`/`schutzAlarm` (`chance`, `pick`). Bekannte Folge: fremde Zufallsproben können kippen, das muss geprüft werden.

### Leistung
- Der Haken in `die` ist O(1).
- `schutzDay` läuft einmal am Tag über rund 45 Städte und zählt Wachen einmal (eine Schleife über `S.ents.world`, Ergebnis nach `post` gebündelt).
- Höchstens 6 sichtbar Fliehende, 4 Milizionäre und 4 Plünderer, und nur in Spielernähe.

### Koop
Nur der Wirt rechnet (`S.coop?.role === 'guest'` → kein Alarm, keine Szene). Die Szene läuft beim Gast über die vorhandene Szenenweiterleitung oder bleibt ein Toast.

### Proben (neu, mit `sandbox`/`afterBox`, Welt danach wiederhergestellt)
1. **„Schutz: Neuladen respektiert Verlust“:** 4 Gardisten von Varonheim mit `die` töten, `transient` entfernen, `capitalMigrate()` aufrufen. Ergebnis: 6 Gardisten, `lost === 4`.
2. **„Schutz: Alarm“:** `lost = Soll`, dann `schutzAlarm`. Erwartet: `stage === 2`, alle Händler `schutzShut`, mindestens 1 Auswanderer, `pop` verschoben, und ein Eintrag in `S.after.rev` nur bei `byP ≥ 50 %`.
3. **„Schutz: Nachschub je Herr“:** Valen-Stadt, 3× `schutzDay`. Erwartet: `lost` sinkt, der Herkunftsknoten verliert Besatzung. Mit `varonBound()` bleibt `lost` gleich. Kette nach `chainsBroken`: kein Nachschub.
4. **„Schutz: Varonheim-Kopplung“:** 10 Gardisten tot. Erwartet: `garrison ≤ 20`, `capThreat +3`, `capDay` füllt nicht auf. Danach Nachschub und `stage 0`: es füllt wieder auf.
5. **„Schutz: Bandenherrschaft“:** Stufe 3 + 2 Tage mit einer Bande in der Nähe → `taker.by === 'band'`. `bandKill` des Anführers → `taker` leer, `reinf` gesetzt.
6. **„Schutz: alter Stand“:** `delete S.schutz`, dann `continueGame`-Weg über `applySave(saveData())` → kein Fehler, alle Städte Stufe 0.

### Debug (Strg+Umschalt+D, Abschnitt „Stadt ohne Schutz“)
- „Status nächste Stadt“ (Soll/Ist/lost/byP/Stufe/Nachschub/Übernehmer als Toast)
- „Alle Wachen hier töten (als Spieler)“
- „Alle Wachen hier töten (durch Bestien)“
- „Tag vorspulen (schutzDay)“
- „Nachschub sofort“
- „Übernahme erzwingen: Bande / Tote / Kette“
- „Alarm-Szene abspielen“
- „Zurücksetzen (diese Stadt)“

---

## 9. Text für `docs/MECHANIKEN.md` (Abschnitt Städte und Krieg)

> - **Stadt ohne Schutz (v24):** Jede Stadt merkt sich, wie viele ihrer Wachen fehlen — auch über das Laden hinweg. Fällt mehr als
>   die Hälfte, ist sie *geschwächt*; fallen fast alle, läutet die Sturmglocke: Bürger fliehen in die nächste Stadt ihres Herrn,
>   die Läden schließen, wer bleibt, versteckt sich, eine Miliz sammelt sich am Platz. War es deine Hand: Kopfgeld, Steckbrief
>   und ein Strafzug des Stadtherrn. Der Herr schickt Ersatz (Valen 3 Mann alle 2 Tage aus dem nächsten Knoten, Aurelion
>   Automaten aus Gelenkhall, die Kette Kettenkrieger, Händler Söldner aus der Stadtkasse) — nicht, wenn er selbst im Krieg
>   gebunden ist. Bleibt Ersatz aus, wird die Stadt *gesetzlos* (Plünderer, keine Verhaftungen, Wohlstand stürzt) und nach
>   zwei weiteren Tagen *übernommen*: von einem nahen Totenheer, einer Bande (Schutzgeld am Tor, Preise ×1,5 — töte den
>   Anführer, um sie zu befreien) oder im Westen von der Kette.
> - **Varonheim ohne Garde:** Jeder tote Königsgardist kostet die Hauptstadt Besatzung; sie füllt sich nicht auf, solange die
>   Garde fehlt, und Morvaths Späher sehen die offenen Tore (Bedrohung steigt). Der Heerzug kommt früher und trifft eine
>   ausgeblutete Stadt. Wer auch die Burgwache erschlägt, treibt den König vorzeitig ins Exil.
> - **Was du tun kannst:** schützen (Plünderer jagen, Wache halb so teuer verstärken, Aushang „Halte die Stadt“), plündern
>   (geschlossene Stände ausräumen — kostet Wohlstand und Ruf), sie den Toten öffnen (Sael, ab Rang 0) oder gehen.

---

## 10. Scheiben

| Scheibe | Inhalt | Größe |
|---|---|---|
| **S1** | Zähler, Fix fürs Neuladen (alle 4 Spawn-Stellen), Stufen 0–2, Alarm samt Szene, Flucht, Läden, Miliz, Ruf, Strafzug, Nachschub je Herr, Debug, Proben 1–3 und 6 | mittel |
| **S2** | Gesetzlos, Übernahme (Tote, Bande, Kette), Varonheim-Kopplung, Proben 4 und 5 | mittel |
| **S3** | Spielerwege Plündern, Halte-Aushang, Sael- und Hedda-Angebot; optional Vogt (Frage 3) | klein bis mittel |

Abhängigkeiten:
- S2 berührt `CAP_SIEGE` und gehört deshalb hinter die Prüfung der Belagerung S1+S2 durch den Verifier (Hunter 7).
- T23 (Aurelion-Index) ist **keine** Voraussetzung. Bis dahin gilt fest 2 Automaten pro Tag.

---

## 11. Fragen an den Entwickler (höchstens 4)

1. **Wer übernimmt eine schutzlose Stadt, die kein Kriegsknoten ist?**
   *Empfehlung:* zuerst ein nahes Totenheer (nur Kriegsknoten), sonst eine **Bande** (Bandenherrschaft mit Schutzgeld am Tor, Befreiung über den Anführer), die Kette nur am Westrand. Aurelion und die Kette übernehmen keine Valen-Städte im Kernland.
2. **Wie schnell?**
   *Empfehlung:*
   - Alarm sofort, gesetzlos nach 2 Tagen, übernommen nach weiteren 2 Tagen (Angsthase +2, Sehr schwer −1).
   - Valen-Ersatz 3 Mann alle 2 Tage.
   - Damit muss der Spieler etwa 4 Tage lang Nachschub abfangen oder die Stadt halten. Ein einzelnes Massaker heilt sonst von selbst.
3. **Darf der Spieler Herr einer Stadt werden?**
   *Empfehlung:* In S1 und S2 nur über die bestehenden Wege: Tote (`holdTown`) und Blutfürst-Nachtherrschaft in Varonheim. Ein eigener „Vogt“-Weg (die Bande schlagen, die Stadt behalten, Steuern einziehen, alle 5 Tage Strafzüge des alten Herrn) bleibt optional in S3. Aurelion bleibt gesperrt (Entscheid „Kein Thron“).
4. **Varonheim: nur beschleunigen oder direkt fallen lassen?**
   *Empfehlung:* nur beschleunigen. Die Besatzung sinkt auf 20, es gibt keinen Nachschub und die Bedrohung steigt, aber den Fall bringt weiter Morvaths Heerzug. Das wahrt die Entscheidung „fällt nur bei langer Vernachlässigung“. Erschlägt der Spieler auch die Burgwache, flieht der König vorzeitig mit ganzem Hof ins Exil.
