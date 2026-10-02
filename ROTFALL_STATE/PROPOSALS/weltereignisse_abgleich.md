# Weltereignisse: passen sie zusammen? (Designer, 01.10.2026)

Auftrag des Entwicklers: „Guck, ob alle Weltevents zusammenpassen.“ Geprüft wurden die gebauten Ereignisse im Code und die geplanten Entwürfe in `PROPOSALS/`.
Am Code wurde nichts geändert. Grundlage ist Code-Lesen mit `grep`/`sed`. Es lief **kein** Spieltest; die Zeitleiste ist aus den Formeln gerechnet (UNVERIFIED, siehe §2).
Zeilennummern beziehen sich auf den Stand v23 vom 01.10.2026.

**Achtung, Zeilen verschieben sich:** Während der Prüfung wurde `game.js` parallel bearbeitet. Ab etwa Zeile 8400 ist `schutzDay` aus „Stadt ohne Wachen“ neu hinzugekommen, rund +84 Zeilen. Zeilen nach etwa 8400 liegen deshalb jetzt tiefer, zum Beispiel `cultHour`-Krönung 12886 → 12970, `cultCrown` 13109 → 13193, `capitalDay` 8332 → 8416. Maßgeblich sind die genannten **Funktionsnamen**. Die Logik der Befunde ist nach dem Nachlesen unverändert.

Status: PROPOSED. Die echten Fehler stehen als RB-043 bis RB-054 in `BUGS.md`.

---

## 1. Befunde

Schwere: CRITICAL > HIGH > MEDIUM > LOW. **Bug** bedeutet: Der Code widerspricht sich selbst oder seinem eigenen Text. **Design** bedeutet: Der Code folgt sich selbst, widerspricht aber einer Entscheidung oder ist eine offene Frage.

### 1a. Widersprüche und Ketten, die doppelt oder gar nicht feuern

| ID | Schwere | Art | FAKT (Datei:Zeile) | Folge | Empfehlung |
|---|---|---|---|---|---|
| W-01 | HIGH | Bug → RB-043 | `cultHour` löst die Krönung aus, wenn `C.crown && day >= C.crown && h === 3 && C.end !== 'ruling'` (game.js:12886). `C.crown` wird nach der Krönung nie gelöscht. `capitalFall` setzt `ruling → hidden` (game.js:8287). `capitalDay` pausiert die Krone nur bei `!S.cult.end` (game.js:8333). | Fällt Varonheim, während Aldhelm herrscht, findet am nächsten Tag um 3 Uhr eine **zweite Rote Krönung** statt: Chronik und Hinweis „König Varon ist im Schlaf gestorben“ erscheinen zum zweiten Mal, und Aldhelm herrscht über eine Stadt, die die Toten halten. Dasselbe gilt für den Weg über die Erpressung (`hidden`): Die Krönung pausiert dann während der Besetzung **nicht** und feuert trotzdem. `cultDrain` springt wieder auf 1. | Nach `cultCrown()` `C.crown = null` setzen (oder `C.crowned = day` und prüfen). In `cultHour` die Krönung sperren, solange `SIM.capitalFallen()`. `capitalDay` soll für jedes `end !== 'destroyed'/'player'` pausieren. |
| W-02 | HIGH | Bug → RB-043 | `cultCrown` setzt `varonDead` und entfernt den König nur aus `S.ents.varonburg` (game.js:13112). Der Exilkönig steht in `S.ents.world` mit `exileCourt` (game.js:8306). | Feuert die Krönung bei besetzter Hauptstadt (W-01), ist der König laut Flagge tot, steht aber lebend am Exilhof in Salzhafen. Wer ihn dort erschlägt, löst nichts aus, weil `die` `!S.flags.varonDead` prüft (game.js:3557). Erst nach dem Neuladen ist er fort. | In `cultCrown` auch `S.ents.world` von `varonKing` säubern, oder `ensureVaronExile()` aufrufen. Wird W-01 behoben, entfällt der Fall weitgehend. |
| W-03 | MEDIUM | Bug → RB-044 | `kingDeath` wählt den Regenten mit `S.cult?.end === 'destroyed' ? 'Marschall Brandt' : 'Kanzler Aldhelm'` (game.js:8317). Bei `end === 'player'` hat der Spieler Aldhelm getrunken, Aldhelm ist also tot (game.js:3555). | Aldhelm wird Reichsverweser, obwohl er tot ist. | Regent Aldhelm nur, wenn `!S.cult || !['destroyed','player'].includes(S.cult.end)`. Sonst Brandt. Ist die Hauptstadt besetzt, immer Brandt (siehe W-05). |
| W-04 | MEDIUM | Bug → RB-044 | Stirbt der Held als Blutfürst, setzt `cultHeroDied` den Kult auf `hidden` (game.js:13205). `C.crown` liegt da meist schon in der Vergangenheit, und `cultHour` ruft `cultCrown` (game.js:12886). | Einen Tag nach dem Tod des Helden meldet die Chronik „Kanzler Aldhelm führt das Reich als Reichsverweser“. Aldhelm ist zu dem Zeitpunkt längst tot; Hedda führt laut Chronik den Kult. | Mit W-01 erledigt (`C.crown` nach Ende löschen). Zusätzlich in `cultCrown`: ohne lebenden Aldhelm (`C.end` war je `player`) keine Krönung, oder Hedda als Herrin mit eigenem Text. |
| W-05 | MEDIUM | Bug → RB-045 | Varons Tod schreibt **zwei** Chronik-Einträge: `kingDeath` → `afterSay('Der König ist tot', …)` (game.js:8320) und direkt danach `chronicle(…)` in `die` (game.js:3559). Die Texte widersprechen sich: Im Exil nennt `die` „Marschall Brandt führt“, `kingDeath` aber „Kanzler Aldhelm führt das Reich … In Varonheim läuten die Glocken“, obwohl die Toten die Stadt halten. Bei zerschlagenem Kult und Tod durch den Spieler sagt `kingDeath` „Brandt“, `die` dagegen „Kanzler Aldhelm regiert“ (Aldhelm ist tot). | Doppelte, widersprüchliche Chronik und Gerüchte. | Den Chronik-Aufruf in `die` streichen. Allein `kingDeath` schreibt den Text, mit Regent nach W-03 und Glocken nur, wenn `!SIM.capitalFallen()`. |
| W-06 | HIGH | Bug → RB-046 | Nach Garmadons Tod befreit `undeadFallDay` jeden Tag einen besetzten Ort mit `TOWN_PLAN` über `liberateNode` (game.js:9306). `liberateNode` setzt `n.owner` direkt (game.js:9238) und geht nicht über `sim.js capture()`. Damit läuft `H.capitalFreed` nicht (sim.js:424). | Wird Varonheim so frei, bleiben die Läden für immer zu (`shopClosed = 1e12`, `fallShut`), die Trümmer liegen weiter, `S.after.capital.retaken` bleibt `null`, und der Exilhof bleibt bis zum Neuladen in Salzhafen. Varonheim bekommt außerdem `S.resettle` wie ein ausgelöschtes Dorf („Zeltlager“). Bei Städten Aurelions fängt `aurelCheck` den Fall ab, bei der Hauptstadt fehlt das Gegenstück. | In `liberateNode` für `k === 'varonheim'` `capitalFreed()` aufrufen und kein `resettle` anlegen. Allgemeiner: eine `capitalCheck()` analog zu `aurelCheck()` in `afterDay`. |
| W-07 | MEDIUM | Bug → RB-047 | Der zerschlagene Kult verspricht: „Ysmay wird Kanzlerin; die Audienz beim König kostet kein Gold mehr“ (game.js:13100) und setzt `S.flags.ysmayChancellor` (game.js:13098). **Niemand liest diese Flagge.** Aldhelm erscheint ab Kultstufe 4 nicht mehr (game.js:8370). Der König verweigert ohne Audienz und unter Rang 1 jedes Gespräch mit „Kanzler Aldhelm tritt dazwischen“ (game.js:8392). | Ohne Rang kann man den König nie mehr sprechen. Die Königs-Questreihe ist zu, und der Ablehnungstext nennt einen Toten. | `ysmayChancellor` in `varonChoices` lesen: Audienz frei, Ablehnungstext mit Ysmay. Oder gleich `varonAudience = 1` beim Ende `destroyed`. |
| W-08 | HIGH | Bug → RB-048 | `goblinStorm` setzt `goblinStormActive = true` (game.js:7613). Gelöscht wird die Flagge nur bei Vargs Tod (game.js:3526 → 7653) oder durch `morrFall`. Jeder spätere Heldentod irgendwo auf der Welt ruft `morrFall()` (game.js:13718). Die Sturmkrieger sind `transient`, die Flagge wird gespeichert. | Flieht der Spieler aus Vargs Halle oder lädt neu, ist der Sturm vorbei: die Krieger sind weg, Dodon steht mit `parley = false` herum. Stirbt der Held Wochen später an einem Wolf, wird Morrgrund ausgelöscht. | Sturm zeitlich begrenzen (z. B. Ende, wenn der Spieler die Eisenfeste verlässt oder einen Tag später). Beim Laden: `goblinStormActive` und kein lebender Sturmkrieger → `goblinStormWon`/`Abbruch` mit Text. |
| W-09 | MEDIUM | Bug → RB-049 | Das große Ereignis Streik hat als Bedingung nur `!!TOWN_PLAN.tickmar` (game.js:10135). Tickmar ist keine Metropole und kann nach dem Tod der Kaiserin fallen (`aurelFallDay`, game.js:10445–10446). Der Adelsball prüft nur `!!TOWN_PLAN.aurelheim` (game.js:10108). | Streik in einem von den Toten besetzten Tickmar, mit Streikführerin auf dem Platz zwischen Knochenwachen. Der Adelsball läuft mitten im Häuserkrieg (`S.after.split`) und im Thronstreit. | Streik: `!heldBy('tickmar') && !S.after?.afall?.tickmar`. Ball: nicht während `S.after.split`, oder als „Friedensball“ mit eigenem Text (Designfrage, siehe F2). |
| W-10 | MEDIUM | Bug → RB-050 | `raidDay` (game.js:6051–6060) prüft `garmadonSlain` nicht. Die Größe der Überfälle steigt mit `S.day / 15`. Nach Garmadon wachsen die Heere nicht mehr (sim.js:453), und Wachen sagen „Seit Garmadon fiel, schlafen wir wieder“ (game.js:11459, 11490). | Auch nach dem Fall des Toten Königs ziehen Untotenhorden mit bis zu 14 Köpfen gegen Dörfer und brennen sie auf Schwer endgültig nieder. Das widerspricht der Heilung (`healTick`, Heimkehrer). | Nach `garmadonSlain` keine Überfälle mehr, oder nur noch seltene „verirrte Tote“ mit `n ≤ 4` und ohne `raze`. |
| W-11 | MEDIUM | Bug → RB-051 | Prügeleien und Aufstände speichern `t: performance.now()` (game.js:10291, Häuserkrieg game.js:10464). Das Zeitlimit lautet `performance.now() - B0.t > 70000` (game.js:5754). `S.brawls` wird gespeichert (nicht in `SKIP`, state.js:144). | Nach dem Neuladen beginnt `performance.now()` wieder bei 0, also wird die Differenz negativ. Ein Aufstand, der weit vom Spieler entfernt nicht zu Ende gekämpft wird, hängt fest, bis die neue Sitzung so lange läuft wie die alte. Bis dahin sperrt er jeden neuen Aufstand (`revoltStart` prüft `S.brawls?.[REVOLT_K]`). | Spielzeit `clock()` statt `performance.now()` verwenden, oder `S.brawls` beim Laden auswerten/leeren. |
| W-12 | MEDIUM | Bug → RB-052 | `ensureVaronExile` läuft nur beim Laden, beim Fall und bei der Befreiung (game.js:1871, 2113, 8288, 8342). Fällt die Exilstadt (Salzhafen) an die Toten, ruft `capture()` sie nicht auf (sim.js:400–425). | Der Exilhof samt König steht weiter in einer besetzten Stadt, bis man neu lädt. Erst dann zieht er nach Nordfurt oder Eren oder gilt als „verschollen“. | In `capture()` bei `faction === 'undead' && node === S.after?.capital?.exile` einen Haken `H.exileLost?.()` aufrufen, mit Umzug und Chronik („Der Hof flieht weiter nach …“). |
| W-13 | LOW | Bug → RB-053 | Texte nach Varons Tod: Die Ankunftskarte sagt „Hauptstadt Valens · Sitz König Varons“ (game.js:7646). Die Gardisten sagen „Befehl des Königs“ (game.js:8274). Der Blutfürst-Text sagt „König Varon lebt und weiß von nichts“ (game.js:13093), auch wenn er nach der Roten Krönung schon tot ist (`cultEnd` erlaubt `ruling → player`, game.js:13091). Der königliche Auftrag „Danach zurück in die Varonsburg“ (game.js:8426) lässt sich ohne König nicht abgeben. | Gerüchte und Hinweise passen nicht zum Zustand. Die Königs-Questreihe endet ohne Nachricht. | Texte nach `varonDead` verzweigen (Reichsverweser bzw. Brandt). Offenen `royal`-Auftrag bei Varons Tod mit Chronik schließen (Lohn über Brandt oder verfallen). |
| W-14 | LOW | Bug → RB-053 | Die Erpressung sagt „die Rote Krönung rückt näher“ (game.js:13130/13132). Geplant wird die Krönung aber nur bei `!afterHeals()`, also nie auf Angsthase (game.js:12885). | Auf Angsthase ist der Hinweis falsch. | Auf Angsthase einen anderen Text, oder auch dort die Krönung, nur später (Designfrage F3). |
| W-15 | LOW | Bug → RB-053 | Ein neues Totenheer entsteht am ersten untoten Knoten in Schlüsselreihenfolge (sim.js:458). `aurelFall` legt Städte Aurelions als Knoten **ohne Kanten** an (game.js:10410). | Hält Valen alle vier Totenknoten im Graphen, eine Stadt Aurelions aber ist besetzt, steht das neue Heer dort fest. Solange es lebt, kommt kein weiteres Totenheer nach (`!W.armies.some(undead)`). | Basis nur aus Knoten mit Nachbarn (`NEIGH[k]?.length`) wählen. |

### 1b. Zustand: gesetzt, aber ungelesen, oder gelesen, aber nie gesetzt

| ID | Schwere | Art | FAKT | Folge | Empfehlung |
|---|---|---|---|---|---|
| W-16 | LOW | Design | `varonBound()` wird definiert (game.js:8312). Zu Beginn der Prüfung las es **nur die Probe** (Kommentar: „wirkt ab T40“). Inzwischen liest es der neue Code von „Stadt ohne Wachen“ (Nachschub-Sperre, jetzt game.js:8393). | Wirkt jetzt auf den Wachen-Nachschub. `varonBound()` wird wahr, sobald der Kult **irgendeine** Stufe ≥ 1 erreicht hat und nicht zerschlagen ist. Weil der Kult spätestens an Tag 12 beginnt, ist Valen damit fast immer „gebunden“. | Siehe W-27. |
| W-17 | LOW | Bug-nah | `S.flags.varonRegent` wird gesetzt (game.js:8318), aber nie gelesen. | Der Regent zeigt sich nirgends: kein Gespräch, keine Figur im Thronsaal. Nach der Roten Krönung ist der Thronsaal leer (König tot, Aldhelm ab Stufe 4 nicht mehr da, game.js:8370). | Regent als Figur auf den Thron setzen (Aldhelm bei `ruling`, sonst Brandt), mit Gruß nach `varonRegent`. |
| W-18 | MEDIUM | Design | `S.flags.varonEvac` liest `capitalFall` (game.js:8280). Gesetzt wird die Flagge nur im Debug-Menü (game.js:14470). | Spielerisch kann man den König nicht vorher fortbringen. Der Hof zerfällt beim Fall **immer**. `stadt_ohne_wachen.md:183` setzt die Flagge voraus und erwartet, dass der König bei stehender Stadt ins Exil geht. Das Exil entsteht aber nur bei `capitalFallen()` (game.js:8301). | Entscheiden: einen Evakuierungsauftrag bauen (Ysmay/Brandt bei Bedrohungsstufe 2) oder die Flagge streichen. Siehe F1. |
| W-19 | LOW | Design | `n.fedTill` liest `siegeTick` (sim.js:86). Gesetzt wird es nirgends. | Gewollt: Die Luftbrücke (Entwurf) schreibt den Wert. | Bleibt. |
| W-20 | LOW | Bug-nah | `C.rightHand` (Rote Krönung als rechte Hand Aldhelms, game.js:13134) wird gesetzt, aber nie gelesen. Ebenso `S.flags.varonWrong` (game.js:8401). | Wer „rechte Hand“ wählt, bekommt nichts außer einer Krönung schon am nächsten Tag. Die Wahl verspricht mehr. | Lohn festlegen (Tribut wie beim Blutfürsten, Rang am Hof) oder den Wahltext kürzen. |
| W-21 | LOW | Bug-nah | `S.after.capital.ruler` und `kingLost` liest nur die Probe (game.js:17621). Stirbt Varon nach dem Fall im Exil, wird `ruler` nicht nachgeführt. | Kein Spielfehler. Spätere Systeme (T40, Chronik) könnten aber den falschen Wert lesen. | Bei Varons Tod `A.capital.ruler = 'Brandt'`. |

### 1c. Schwierigkeit

| ID | Schwere | Art | FAKT | Folge | Empfehlung |
|---|---|---|---|---|---|
| W-22 | LOW | Design | Auf Angsthase entfallen der Heerzug der Toten (sim.js:56) und die Rote Krönung (game.js:12885). Beides steht nicht im Beschreibungstext von `DIFF.angsthase` (game.js:1635). | Der Spieler weiß nicht, dass die großen Krisen dort fehlen. | Text ergänzen: „Die Hauptstadt wird nicht belagert, der Kult krönt sich nicht.“ |
| W-23 | LOW | Design | Erholungsfristen auf Angsthase: Dörfer 10 Tage (game.js:6108), Seuche 10 Tage (`AFTER_DAYS/2`), alles andere 21 Tage (`AFTER_DAYS`). Sehr schwer unterscheidet sich bei Weltereignissen nur durch den Heerzug (80 statt 70). | Uneinheitlich, aber vertretbar. Sehr schwer fühlt sich in der Welt fast wie Schwer an. | Entscheiden, ob Sehr schwer früher bedroht (z. B. `CAP_SIEGE.from` 15, Krönungsfrist 15 statt 20). Siehe F3. |

### 1d. Ketten über die Systeme (Design, keine Bugs)

| ID | Schwere | FAKT | Folge | Empfehlung |
|---|---|---|---|---|
| W-24 | MEDIUM | `aurelFall` macht Städte Aurelions zu **untoten** Kriegsknoten (game.js:10410). `warDay` und `capThreatDay` zählen alle untoten Knoten: Wachstum `+0,25` je Knoten (sim.js:453), Bedrohung `+1` ab 6 Knoten (sim.js:58). Zu Beginn halten die Toten 4 Knoten (data.js:1345–1350). | Tötet der Spieler die Kaiserin, fallen auf Schwer bis zu drei Städte im Süden. Damit sind es 7 Knoten, und die Bedrohung Varonheims steigt um +1 am Tag. Rund 20 Tage später bricht Morvaths Heerzug auf (`thr` 20). Der Tod der Kaiserin im Süden kostet so die Hauptstadt im Norden. Das ist eine starke Kette, aber nirgends angesagt. Außerdem widerspricht es der Entscheidung „Fall Aurelions: immer zuerst Bürgerkrieg der Adelshäuser“ (DECISIONS.md, 01.10.). Im Code fallen erst Städte an die Toten, und daraus folgt der Häuserkrieg (game.js:10428). | Siehe F2. Entweder die Städte Aurelions aus `undNodes` herausnehmen oder die Kette mit Gerücht und Chronik ansagen („Die Toten im Süden ermutigen Morvath“). |
| W-25 | LOW | `cultDrain` (game.js:13107) senkt Valens Nachschub und hebt zugleich `capThreat` (sim.js:58). Bei `ruling` sind das je −1 und +1 am Tag. | Doppelter Hebel aus einer Ursache, aber gewollt (§5g.2). Mit T23 (Seelen), `stadt_ohne_wachen` (+3 einmal, +0,5 am Tag) und `npc_eigene_ziele` (Kriegsmüdigkeit) kommen bis zu vier weitere Hebel auf dieselbe Zahl hinzu (siehe §4). | Vor dem Bau der Entwürfe eine gemeinsame Messung der Bedrohung: Fallzeitpunkt der Hauptstadt bei Nichtstun ≥ Tag 80 auf Schwer (Entscheidung „nur bei langer Vernachlässigung“). |
| W-26 | LOW | `refugeeWave` (game.js:9392) nach `chainsBroken`: Flüchtlinge sagen „Die Toten kamen nachts“, auch nach Garmadons Tod. Die Glaubensfeste der Kette (`faithDay`, game.js:8924–8931: Opferfest, Kreuzzug, Ketzerjagd) prüfen `chainsBroken` nicht. | Mögliche Text- und Sinnbrüche nach dem Fall der Kette. UNVERIFIED: ob die Paladine nach dem Fall der Kette noch leben, wurde nicht geprüft. | Zum Prüfen an den Verifier geben. |
| W-27 | MEDIUM (Code im Bau) → RB-054 | Der neue Code `schutzBlocked` (game.js:8392–8393) gibt für Valen `varonBound() \|\| capThreat >= 15 \|\| heldBy(k)` zurück. `varonBound` ist wahr ab Kultstufe 1 (`cultWar`, game.js:12839 alt), also spätestens ab Tag 12 und bis zur Zerschlagung des Kults. Der Entwurf wollte `varonBound` nur für Brandts **zweiten** Zug nach Varonheim (`stadt_ohne_wachen.md:162`). | Nach Tag 12 bekommt **keine** Valen-Stadt mehr Wachen-Nachschub (Eren, Nordfurt, Salzhafen, Dörfer, Varonheim), solange der Kult nicht zerschlagen ist. Stufe 3/4 („Gesetzlos/Übernommen“) wird in ganz Valen zur Regel. | Für den regulären Nachschub `varonBound` weglassen und es nur für Brandts Zug verwenden, wie im Entwurf. Engineer und Verifier vor IMPLEMENTED. |

---

## 2. Zeitleiste „der Spieler tut nichts“ (Schwer)

Aus den Formeln gerechnet, nicht gespielt (UNVERIFIED). Zwei Fälle, weil der Kriegsverlauf vom Zufall abhängt (RB-001: „wogt“).

| Tag | Was passiert | Quelle |
|---|---|---|
| ab 3 | Alle 3–5 Tage ein großes Ereignis (Seuche, Turnier, Ball, Streik …, nie dreimal dasselbe). Die Kette: Stoßtrupp ab Tag 3, Feldzug ab 8, Heerzug ab 18 gegen Totenlager. Überfall der Toten auf Dörfer: 6 % am Tag. | game.js:9998–10004, 5832, 6053 |
| 12 | Blutkult beginnt spätestens jetzt („Gerüchte aus der Hauptstadt“). Danach verschwindet alle 2 Tage jemand, höchstens 8, also bis etwa Tag 28. Nach 6 Tagen wird ein Verschwundener zum Blutknecht. Ab Tag 13 gibt es spontane Aufstände in der Eisenfeste (2 % am Tag). | game.js:12888–12890, 10341 |
| 20 | Die Bedrohung Varonheims beginnt zu zählen. Ohne Kult-Ende und bei weniger als 6 Totenknoten gilt `d = −1` (mit Valen-Heer im Feld), sie bleibt also bei 0. | sim.js:56–58 |
| **Fall A: die Front hält** (< 6 Totenknoten) | | |
| 45 | „Rote Krönung in zwanzig Tagen (Tag 65)“: Die Kult-Stufe bleibt ohne Spieler bei 1, daher greift die Tagesgrenze. | game.js:12885 |
| 65, 3 Uhr | **Rote Krönung:** Varon stirbt, Aldhelm herrscht, `cultDrain = 1`. Valen wächst täglich 1 weniger, und die Bedrohung bekommt +1. Bei weniger als 6 Knoten ist `d = 0`. Kippt die Front auf 6 Knoten, wird `d = +2`. | game.js:13109, sim.js:453/58 |
| ~75–90 | Gerücht (10), Varonheim rüstet (15), Morvaths Heerzug (20, Stärke 70). Belagerung: −3,5 % Mauer je Zug, also etwa 7 Tage bis zur Bresche, dann Sturm. | sim.js:60–94 |
| ~85–100 | **Varonheim fällt.** Exil in Salzhafen, der Hof zerfällt (`varonEvac` gibt es im Spiel nicht), Aldhelm → `hidden`. **Am nächsten Tag um 3 Uhr folgt die zweite Rote Krönung (W-01).** | game.js:8278–8296 |
| 100 | Hauptstadt besetzt (keine Selbstheilung auf Schwer). Der Kult herrscht wieder (W-01). Überfälle bis 13 Köpfe, ausgelöschte Dörfer bleiben Ruinen. | |
| **Fall B: die Front kippt früh** (≥ 6 Knoten ab Tag 20) | | |
| 30 / 35 / 40 | Bedrohung 10 / 15 / 20 (+1 am Tag, +0,5 ohne Valen-Heer). Heerzug ab etwa Tag 40. | sim.js:58–66 |
| 45 | Krönung für Tag 65 angesagt, während die Belagerung läuft. | |
| ~48–55 | **Varonheim fällt.** Der Kult hat kein Ende (`end` null), also pausiert die Krone und rückt jeden Tag eins weiter. Die Rote Krönung findet nicht statt, solange die Stadt besetzt ist. Das ist schlüssig. | game.js:8333 |
| 65–100 | Die Krone pausiert. Der König lebt im Exil. `cultTake` ruht. | |

**Stapelung an denselben Tagen:**
- Um Tag 65 können Rote Krönung, ein großes Ereignis und ein Heerzug der Kette (Takt 20–30 ab Tag 18) zusammenfallen. Das ist ein Ereignis aus jeder Quelle, aber keine Kette.
- **Echte Stapelung gibt es am Falltag der Hauptstadt.** Dazu kommen Flüchtlinge ins Exil. Ist das Exil Salzhafen, kann dort gleichzeitig ein Turnier laufen (game.js:10103, `bigTowns` sperrt nur besetzte Städte). Am nächsten Tag folgt die zweite Krönung (W-01).
- Tötet der Spieler die Kaiserin, fallen auf Schwer in etwa 10 Tagen drei Städte im Süden, der Häuserkrieg beginnt, und rund 20 Tage später zieht Morvaths Heer los (W-24). Das ist die größte ungesagte Kettenreaktion im Spiel.

---

## 3. Speichern und Laden

| Was | Befund |
|---|---|
| Exilhof, Burg, Kult-Verdächtige, Omega-Verbündete | `transient` + `ensure*`. Wird beim Laden richtig neu gebaut (game.js:1871/2113). Ok. |
| Fall der Hauptstadt (`S.after.capital`), Knochenwachen (`heldGuard`), Trümmer | Gespeichert, nicht doppelt. Ok. |
| Goblinsturm | **Geht verloren:** Die Krieger sind flüchtig, die Flagge bleibt (W-08). |
| Prügelei/Aufstand/Häuserkrieg | **Zeitstempel geht kaputt** (W-11). |
| Flüchtlinge aus Aurelions Städten (`afRefugee`) | `transient` ohne `ensure`. Nach dem Neuladen sind sie weg. Der Preisaufschlag (`tmul`) bleibt. LOW, kein Fehler im Zustand, nur im Bild. |
| Varons Tod im Exil | Flagge gespeichert, das Exil baut ohne König neu. Ok. Siehe aber W-02. |

---

## 4. Überschneidungen der Entwürfe

| # | Entwürfe | Überschneidung | Empfehlung |
|---|---|---|---|
| Ü-1 | `stadt_ohne_wachen.md` §6.3 (Z. 181) ⇄ `varonheim_umbau.md` §4.3 (Z. 178, 344) | **Widerspruch:** Der eine braucht die Burgkarte `varonburg` als „letzte Bastion“, der andere schafft sie ab. | Reihenfolge festlegen. Wird der Umbau zuerst gebaut, muss `stadt_ohne_wachen` die Burgwache in der Welt zählen. |
| Ü-2 | `stadt_ohne_wachen.md:183` ⇄ gebaute Belagerung | Setzt `varonEvac = 1` und erwartet ein Exil bei stehender Stadt. `ensureVaronExile` baut den Exilhof aber nur bei `capitalFallen()` (game.js:8301). Der König bliebe in der Burg (`buildVaronburg`, game.js:8369). | Im Entwurf ein eigenes „Exil ohne Fall“ beschreiben oder die Regel streichen (F1). |
| Ü-3 | `stadt_ohne_wachen` (+3 und +0,5 am Tag), `t23` (40 Seelen), `npc_eigene_ziele` (Kriegsmüdigkeit: Valen −2 am Tag ab 60), `luftbruecke` (Verwundete −1 Müdigkeit, `fedTill`) | Fünf Hebel auf **dieselbe** Zahl, nämlich die Überlebensdauer der Hauptstadt, dazu der Kult (W-25). Keiner der Entwürfe rechnet mit den anderen. | Eine gemeinsame Messung (sim, 8 Seeds, 120 Tage) vor dem Bau des zweiten dieser Entwürfe. Ziel aus DECISIONS: Fall nur bei langer Vernachlässigung. |
| Ü-4 | `t23` §10 ⇄ `stadt_ohne_wachen` §6.1 | Beide ändern die Besatzungsfüllung in `warDay`/`capDay` (sim.js:457, 70–76). `t23` nennt die Kollision mit S1, aber nicht mit `stadt_ohne_wachen`. | Eine gemeinsame Funktion `garrisonFill(k)` als Schnittstelle. |
| Ü-5 | `npc_eigene_ziele` #39 ⇄ `t23` §5.2 | Valens Heeresgröße: Schwund durch Müdigkeit gegen Wachstum durch Korn. Beide hängen in `warDay`, die Reihenfolge ist nicht abgestimmt. | Reihenfolge festlegen: Wachstum (T23) vor Schwund (#39). |
| Ü-6 | `t23` §5.6 ⇄ `t12` §5.4 | Beide ändern `tributeDay`. `t23` verweist auf T12 nur bei `caravanDay`. | Im Entwurf T23 nachtragen. |
| Ü-7 | `t11` §5.8 ⇄ `t23` §5.2 | Spieler-Proviant und Valens Heer essen aus demselben Kornlager. Es ist kein Vorrang festgelegt. | Heer zuerst, Spieler kauft den Rest (Preis steigt), in einem der Entwürfe festschreiben. |
| Ü-8 | `npc_eigene_ziele` #36/#39 ⇄ `t12` | Abgestimmt (T12 zuerst). Ok. | Keine. |
| Ü-9 | `luftbruecke` ⇄ Belagerung S3 („Gero versorgt“) | Beide schreiben `fedTill` und lösen das über `max()`. Ok. | Keine. |
| Ü-10 | Alle Entwürfe ⇄ Königstod/Kult | Kein Entwurf behandelt „König tot“ oder „Kult herrscht“. `stadt_ohne_wachen.md:162` lässt Brandt einen Entsatzzug führen, auch wenn Brandt mit dem Exil schon in Salzhafen steht. | In jedem Entwurf, der Varonheim berührt, einen Absatz „bei `varonDead` / `cult.end` / `capitalFallen`“ verlangen. |

---

## 5. Fragen an den Entwickler (höchstens 4)

- **F1 – König fortbringen:** `varonEvac` gibt es nur im Debug-Menü. Soll der Spieler den König vor dem Fall retten können (Auftrag bei Bedrohungsstufe 2, „der Hof bleibt ganz“), oder fällt der Hof immer? Davon hängt `stadt_ohne_wachen` §6.3 ab.
- **F2 – Tod der Kaiserin und Varonheim:** Im Code fallen Aurelions Städte an die **Toten**, und erst danach zerbricht das Hochreich. Dabei treiben die gefallenen Städte Morvaths Heerzug gegen Varonheim an. Laut Entscheidung soll **zuerst Bürgerkrieg** kommen. Soll der Code an die Entscheidung angepasst werden (zuerst Häuserkrieg, Städte fallen erst später), und sollen Aurelions Städte die Bedrohung im Norden mittragen?
- **F3 – Sehr schwer und Angsthase:** Sollen auf Sehr schwer die Krisen früher kommen (Bedrohung ab Tag 15, Krönung nach 15 statt 20 Tagen)? Soll es auf Angsthase eine milde Rote Krönung geben, oder bleibt sie dort ganz aus (und der Text sagt das)?
- **F4 – Nach Garmadon:** Sollen Überfälle der Toten auf Dörfer mit Garmadons Tod ganz enden, oder bleiben „verirrte Tote“ als kleine Gefahr ohne Auslöschen?
