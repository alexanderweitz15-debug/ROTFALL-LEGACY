# NPCs mit eigenen Zielen: Händler, Soldaten, Bewohner, Hauptleute (Scout #36–#39)

**Status:** APPROVED im Grundsatz (Entwickler 01.10.) → hier umsetzungsreif, wartet auf die 4 Fragen (§18). **Autor:** Designer (Opus) · **Stand:** 01.10.2026
Kennzeichnung: **FAKT** (Datei:Zeile, per grep geprüft), **VORSCHLAG**, **ANNAHME** (im Spiel nicht geprüft).
Abgestimmt mit `PROPOSALS/t12_strassen_herren.md` (T12) und `PROPOSALS/t23_fraktionsressourcen.md` (T23), siehe §12.

---

## 0. Kurze Systemprüfung (vor dem Entwurf)
| Befund | Beleg | Folge |
|---|---|---|
| Abstrakte Händlerzüge haben keinen Händler und kein Gedächtnis. Die Wahl ist rein „Überschuss → größte Not“ | `caravanDay` `economy.js:287–316` | #36 braucht ein Gedächtnis **je Strecke**, nicht je Zug |
| Überfälle würfeln mit `riskOf(a, b, guards)` ohne Ursache | `economy.js:280–286` | T12 B1 liefert `riskWhy`, `onCaravanRaid`, `o.detour`. #36 hängt sich dort ein |
| `caravanSurvivors` gibt es nur für die sichtbare Große Karawane (Aushang „Überlebende“) | `game.js:7038`, Aufruf `3530` | #36 nutzt die Rettung des Kutschers als Gegenmittel |
| Abwanderung gibt es schon: `migrationDay` → `emigrate(k, 'hunger'/'fear')`, einzeln, mit Namen und Log | `game.js:1428–1449` | #38 ergänzt den Grund **Arbeit** und eine **Ankündigung**. Kein zweites System |
| **Fund (wahrscheinlicher Fehler):** Ein Auswanderer wird `transient`, sein Haus hat dann keinen Bewohner. Beim Laden ruft `continueGame` `spawnResidents()` (`game.js:2075`), und das füllt jedes Haus ohne `homeId`-Bewohner (`game.js:857`) mit dem **gleichen** Namen (`(hx*13+hy*5+i*11) % 14`, `game.js:861`) neu. Damit ist jede Abwanderung nach dem Laden rückgängig | `game.js:1442`, `2075`, `857–861` | ANNAHME (nicht im Spiel geprüft). #38 bringt den Leerstand `S.vacant` mit und behebt das (§5.3). Eigene RB-Nummer empfohlen |
| `growthOf(t).prosper` (−20…100) ist der Wohlstand je Ort | `growthDay` `game.js:6921–6929` | Maßstab für „Armut“ |
| Die Kette führt Feldzüge (`campaignDay`/`campResolve`); Niederlage oder „vernichtet“ hat heute keine Nachwirkung außer dem Log | `game.js:5820–5899` | #39-Quelle für die Kette |
| Valens Feldheere sind abstrakte Zahlen (`S.war.armies`); Niederlagen in `battleAbstract`/`battleCheck` haben keine Nachwirkung auf die Moral | `sim.js:378–399`, `539–558` | #39-Quelle für Valen |
| `evDeserters` (Zufallsereignis) spawnt heute 3 Räuber „Deserteur“ mit Aushang, ohne Bezug zu Kriegslage oder Banden | `game.js:9863–9869`, Liste `10108` | #39 ersetzt die Ursache, das Ereignis bleibt als Bild |
| Banden: höchstens 3, `bandFound(town, at)` mit `men: ri(4,6)`, Anführer `lead` frei wählbar | `game.js:11030–11042`, `11048–11049` | #39 und #37 gründen Banden über `bandFound` mit Zusatzfeldern |
| Verteidigungsmeister: einer je Ort aus `TOWN_PLAN`, **flüchtig**, Name bei jedem Laden neu gewürfelt (`pick(FIRST_M)`), vergibt Aufträge („vm“) | `ensureDefenseMasters` `game.js:7951–7963`, Aufträge `6967` | #37 braucht einen **festen** Namen je Ort |
| `defPower(k)` = Bewohner × 0,3 + angeheuerte Verteidiger + Tributwachen × 2; der Verteidigungsmeister zählt **nicht** | `game.js:6040–6041` | #37 schwächt über einen Faktor, nicht über einen neuen Grundwert (§5.4) |
| Überfall auf ein Dorf: angekündigt mit `S.deadRaid`, Ausgang fern mit `chance(dp / (dp + n × 1|1,2))` | `raidDay` `6042–6053`, `raidTick` `6060` | Zeitpunkt der Fahnenflucht = Ankündigung |
| Varonheim-Belagerung frisch kalibriert (`CAP_SIEGE`, Heerzug 70/80) | `sim.js:33–95`, `DECISIONS.md` 01.10. | **Kein Teil dieses Vorschlags darf Varonheims Besatzung oder Entsatz während einer Belagerung schwächen** (§5.3, F2) |

## 1. Konzept
Vier Figurengruppen bekommen je **ein** Ziel und **eine** sichtbare Entscheidung. Die Entscheidung entsteht aus dem Weltzustand und ändert ihn wieder:
- **Der Händler** will Gewinn ohne Verlust. Nach zwei Überfällen auf derselben Strecke fährt er Umweg, nach drei meidet er sie. Am Zielort fehlt die Ware, der Preis steigt.
- **Der Soldat** will überleben. Nach verlorenen Schlachten wächst die Kriegsmüdigkeit seiner Seite. Ab einer Schwelle laufen Männer weg und werden zu einer Deserteurbande, die von der Straße leben muss (T12).
- **Der Bewohner** will Arbeit. Ist sein Ort lange arm, kündigt er an, dass er geht, verabschiedet sich und zieht in den reichsten erreichbaren Ort.
- **Der Hauptmann** will nicht sinnlos sterben. Wird ein Überfall angekündigt, den sein Dorf kaum gewinnen kann, und fehlt der Sold, desertiert er, nimmt Miliz mit und taucht als Anführer oder auf einem Steckbrief wieder auf.

Kein neues großes System: Alle vier hängen an vorhandenen Tageshaken und nutzen T12 (Banden, Strecken) und T23 (Ressourcen) als Unterbau.

## 2. Gelöstes Problem
- Fraktionen handeln abstrakt; es gibt keine benannte Figur, deren Entscheidung man sieht (IDEAS Runde 3, Befund).
- Kriegsniederlagen, Überfälle und Armut haben keine **zweite** Folge. Die Kette „NPC-Entscheidung → Fraktion → Wirtschaft → Weltereignis“ (TEAM.md §1) bricht nach dem ersten Glied ab.
- Abwanderung wird beim Laden wahrscheinlich rückgängig gemacht (Fund §0).

## 3. Warum es zu ROTFALL passt
- „NPCs handeln selbst“ (TEAM.md §1, fester Punkt). Vorbilder: Kenshi (Fraktionen zerfallen von innen), Mount & Blade (Karawanen reagieren auf Verluste), Dwarf Fortress (einzelne Abwanderer), übertragen auf vorhandene Haken.
- Jede Entscheidung erzeugt eine **Begegnung**: eine Deserteurbande am Weg, ein Abschied am Brunnen, ein Steckbrief mit dem Namen des Hauptmanns, ein teurer Brotpreis mit Begründung im Kontor.

## 4. Heutiges System (FAKT)
| Teil | Ort | Heute |
|---|---|---|
| Händlerzüge | `economy.js:287–316` | ≤ 6 neue/Tag, ≤ 16 unterwegs, Wachen `ri(0,2)`, Überfall nach `riskOf`, Verlust 50–100 % |
| Große Karawane | `sim.js:253–305`; `game.js:3530` | Hinterhalt; tot → `caravanDied` + `caravanSurvivors` (Aushang, +25 Gold) |
| Abwanderung | `migrationDay` `game.js:1428–1436`; `emigrate` `1438–1449`; `settleIn` `1450–1459` | Hunger/Angst ≥ 3 Tage → 35 %/Tag ein Bewohner (keine Namensträger, keine Händler, keine Gefährten); Ziel ≤ 500 Kacheln, ohne Hunger/Gefahr; kommt er an, zieht er in ein freies Haus |
| Wohlstand | `growthDay` `6921–6929` | +3/Tag (Ruf > 30: +4); Besatzung −12, Überfall −5; ≤ −20 verfällt ein neues Haus |
| Feldzüge der Kette | `campaignDay` `5820`, `campResolve` `5880–5899` | Sieg 0,45 + Größe/80 (−0,2 gewarnt, −0,15 sabotiert); Niederlage, Vernichtung nur im Log |
| Valens Heere | `warDay` `sim.js:446–474`; `battleAbstract` `378–388`; `cleanupArmies` `432–441` | Wachstum nach Korn; Niederlage = Stärkeverlust und Rückzug, sonst nichts |
| Banden | `game.js:11023–11083` | siehe T12 §4 |
| Verteidigungsmeister | `ensureDefenseMasters` `7951–7963` | flüchtig, zufälliger Name, Aufträge „vm“ |
| Dorfverteidigung | `defPower` `6040`; `defenseTalk` `6234–6248`; `raidEnd` `6083–6096` | Miliz 2 Mann/60 Gold (bleibt), Söldner 3/150 (5 Tage), Automaten 2/400, Goblins 3/60 |

## 5. Neues System (VORSCHLAG)
Alle Zahlen an einer Stelle: `const NPC_GOALS = {…}` in `game.js` (Händlerteil in `economy.js` als `ROUTE_MEM`).

### 5.1 #36 Händler meiden Strecken (Scheibe N1, nach T12 B1)
**Gedächtnis je Strecke** (ungerichtet, Schlüssel `[a, b].sort().join('|')`):
`S.eco.routes[key] = { hits: [Tage], detourTill, shunTill, by }`.
```js
export const ROUTE_MEM = { win: 14, detourHits: 2, detourWin: 10, detourDays: 10, shunHits: 3, shunDays: 8, max: 12 };
```
- **Zählen:** In T12s `onCaravanRaid(c, lost, band)` (`economy.js`, T12 §15) und bei `caravanDied` (`sim.js:306`) kommt `day` in `hits`. Ältere Einträge als 14 Tage fallen weg. Höchstens 12 Strecken im Gedächtnis (älteste raus).
- **Stufe 1 — Umweg:** 2 Überfälle in 10 Tagen → `detourTill = day + 10`. Neue Züge auf dieser Strecke fahren mit `detour: true`: `eta + 1`, Banden zählen in `riskOf(…, { detour: true })` nicht (T12 §5.1). Es gibt **keine** Zusatzwache; die Wachenzahl gehört T23 (§12).
- **Stufe 2 — Meiden:** 3 Überfälle in 14 Tagen → `shunTill = day + 8`. `caravanDay` überspringt das Paar (a, b) bei der Wahl `best` (eine Zeile im Doppel-Loop). Am Zielort fehlt die Ware; der Preis steigt über die vorhandene Lagerformel (`ecoPrice`), ohne neue Preislogik.
- **Wer entscheidet:** `by` = Name des Kontorhändlers im **Ursprungsort** (`ECO.marketNpc(a)?.name` über Hook `H.marketName(a)`), sonst „die Händler von {Ort}“. Der Name wird beim Eintritt der Stufe gespeichert, damit Log, Kontor und Gerücht übereinstimmen.
  - Log (`'economy'`): „Gerold aus Nordfurt schickt keine Wagen mehr nach Eren — dreimal ausgeraubt in zwei Wochen. In Eren wird das Salz knapp.“
  - Chronik (`'news'`) bei Stufe 2. Gerüchte entstehen daraus von selbst.
- **Entscheidungen des Spielers (heben die Stufe auf):**
  - **Bande zerschlagen:** `bandGone` leert `hits` jeder Strecke, auf der die Bande in `riskWhy` stand. Log „Die Straße nach Eren ist wieder frei. Gerold lässt anspannen.“
  - **Geleit:** Neuer Kontorpunkt „Geleit für die erste Fahrt (gemiedene Strecke)“ → ein Geleitauftrag `makeContract(a, 'escort', 'board')` (Art vorhanden, `game.js:6738`) mit `C.target = b` statt eines zufälligen Ziels. Erfüllt: `shunTill = 0`, `hits.length = 1`, Händler +2 (`deliver`-Pfad, T23 zählt das als Ankunft).
  - **Kutscher retten:** Wird der Aushang aus `caravanSurvivors` (`game.js:7038`) erfüllt, fällt **ein** Eintrag aus `hits` der Strecke Eren–Nordfurt („Der Kutscher lebt. Gerold wagt es noch einmal.“).
  - **Mitverdienen:** Der eigene Wagen darf die gemiedene Strecke fahren (Preise am Ziel hoch). Gewollt; der Spieler trägt das Risiko.
- **Kontor:** Zeile „**Gemiedene Straßen:** nach Eren (noch 5 Tage) — Gerold aus Nordfurt“, „**Umwege:** nach Salzhafen (+1 Tag)“. Baut auf T12 `routeLines(town)` auf.

### 5.2 #39 Kriegsmüdigkeit und Deserteurbanden (Scheibe N3, nach T12 B2)
**Zustand:** `S.weary = { valen: { v, pool, stage }, chain: { v, pool, stage } }`, `v` 0–100.
```js
weary: { valen: { lossBattle: 8, armyBroken: 15, townLost: 12, capLost: 25, siegeDay: 1, hungryDay: 1, winBattle: -4, townFreed: -8, decay: -1, fedDay: -1, savedWounded: -1 },
         chain: { campLost: 20, campWiped: 30, sabotaged: 5, campWon: -15, decay: -1 },
         stages: [40, 60, 85], desertPerDay: 2, desertPct: 0.03, poolBand: 5, bandMax: 6, poolCap: 8 }
```
- **Quellen Valen** (je an der Stelle, die das Ereignis schon kennt):
  - verlorene Feldschlacht eines Valen-Heeres (`afterBattle` mit `lose.faction === 'valen'`, `sim.js:389`) +8
  - Heer zerschlagen (`cleanupArmies`, Valen) +15
  - Valen-Stadt fällt (`capture`, `was === 'valen'`) +12, Varonheim +25
  - je Belagerungstag Varonheims +1; je Tag mit `valenGrain < 10` (`sim.js:450`; nach T23 über `SIM.facRes('valen')`) +1
  - **Senken:** gewonnene Schlacht −4, Ort befreit −8, Tag mit Korn > 40 −1, Abklingen −1/Tag, versorgter Verwundeter −1 (Anschluss an `luftbruecke_verwundete.md` §B).
- **Quellen Kette:** Feldzug verloren (`campResolve`, `won === false`) +20, vernichtet (kein Rückkehrer) +30, sabotiert +5; Sieg −15; Abklingen −1/Tag.
- **Rechnung:** `wearyDay()` einmal am Tag in `dayTick` direkt **vor** `SIM.warDay()` (`game.js:10873`). Keine neuen `rnd()`-Aufrufe in `wearyDay`; Namen per Tageshash (Regel aus T23 §5.1).
- **Stufen und Wirkung:**
  - **≥ 40 „Murren“:** einmalig Chronik und Log mit Ursache und Hebel: „In Valens Lagern murrt man: drei verlorene Schlachten, kein Korn. Wer Siege bringt oder Korn liefert, hält die Männer.“ Wachen in Valen-Orten bekommen 2 Zeilen für `newsTalk`.
  - **≥ 60 „Fahnenflucht“:**
    - Valen: Das stärkste Valen-Feldheer, das **nicht** in einer Feldschlacht steht und **nicht** vor oder in Varonheim während einer Belagerung steht, verliert `d = min(2, Stärke × 0,03)` am Tag. `pool += d`.
    - Kette: Der nächste Feldzug hat `size × (1 − (v − 50) / 100)` (bei 80: ×0,7), angewendet **nach** der T23-Größe aus Arbeitskraft (§12). `pool += 1` am Tag.
  - **≥ 85 „Auflösung“:** Valen stellt ein neues Aufgebot (`warDay`, `sim.js:465`) nur mit halber Chance auf. Die Kette verschiebt ihren nächsten Feldzug um 5 Tage.
  - **Belagerungsschutz:** Läuft eine Belagerung Varonheims, ruhen die Wirkungen von Stufe 60 und 85 für Valen (Zähler steigt weiter). Log einmal: „In der Not halten Valens Männer zusammen. Nach der Belagerung wird man sehen.“ So bleibt `CAP_SIEGE` unberührt (Frage F2).
- **Deserteurbande:** `pool ≥ 5` und weniger als `bandCap` Banden aktiv (T12: 3, Sehr schwer 4) und **keine** andere Deserteurbande derselben Seite →
  `bandFound(ort, punkt, { origin: 'valen'|'chain', men: min(6, floor(pool)), loot: 0, lead })`, `pool −= men`.
  - Ort: Valen = nächste Valen-Stadt zum Heer (`a.at`, Weltkoordinaten über `LOC`), Kette = Heerstraße (`campPts`, Punkt [434, 376]).
  - Name aus eigener Liste: Valen „Die Zerrissenen Röcke“, „Die Blauen Hunde“; Kette „Die Gebrochenen Glieder“, „Die Rostkragen“. Anführer „Feldwebel {Name}“ oder der desertierte Hauptmann aus §5.4.
  - Startbeute 0: Die Bande muss sofort Züge überfallen, sonst hungert sie nach T12 §5.2 aus. Das ist gewollt: Deserteure sind gefährlich, aber kurzlebig, wenn man die Straße bewacht.
  - Kampfwerte: Valen-Deserteure spawnen als `bandit_spear`/`bandit` mit `cloth` Valen-Blau (nur Aussehen, `SPEC_KEYS` prüfen), Kette als `bandit` mit Kettenrot.
  - Ist der Deckel voll, bleibt der Pool liegen (höchstens 8). Kein Zwang zur Bande.
- **`evDeserters`** (`game.js:9863`): bleibt im Ereignis-Pool, wirkt aber nur noch, wenn `S.weary.valen.v ≥ 40`, und erhöht dann `pool += 2` statt fremde Räuber ohne Ursache zu spawnen. Unter 40 wird es übersprungen (das Ereignis-System würfelt neu).
- **Spieler-Hebel:** Siege erringen und Orte befreien; Korn nach Valen liefern (T23); Verwundete versorgen; Deserteurbande zerschlagen (T12-Kopfgeld) **oder** gefangene Deserteure laufen lassen bzw. anwerben (T08 `captiveMenu`, vorhanden).
- **Fraktionsfolgen:** Wer einen Valen-Deserteur der Wache übergibt, bekommt Valen +2 (zusätzlich zum T08-Gold). Wer ihn anwirbt, Valen −2.

### 5.3 #38 Bewohner wandert der Arbeit nach (Scheibe N2)
- **Armut:** `migrationDay` zählt je Ort `t.poorDays`: +1, wenn `growthOf(k).prosper < 0` und kein Hunger/keine Gefahr (die alten Gründe haben Vorrang), sonst 0.
- **Ankündigung:** `poorDays ≥ 5` und `chance(0,25)` und in diesem Ort seit 7 Tagen keine Abwanderung und weltweit höchstens 2 Ankündigungen am Tag:
  - Kandidat wie in `emigrate` (keine Namensträger, keine Händler, keine Gefährten), dazu nicht `leaving`.
  - Ziel: reichster Ort in `travelTowns()` mit `prosper ≥ 50`, ohne Hunger/Gefahr, `townGap < 500`, kein Aurelion (`settleIn` lehnt Aurelion ab, `game.js:1451`). Fehlt ein Ziel, keine Ankündigung.
  - `c.leaving = { day: S.day + 1, to, why: 'work' }` (gespeichert, der Bewohner ist nicht flüchtig).
  - Sichtbar: Sprechblase am Abend (`bubble`, `game.js:9062`) „Morgen gehe ich nach Salzhafen. Hier gibt es keine Arbeit mehr.“ Ein Bündel-Requisit (`sack`) vor seiner Tür. Log (`'world'`): „{Name} aus Eren packt: In Salzhafen gibt es Arbeit.“
- **Gespräch mit dem Abwanderer** (neuer Haken `leaveChoices(npc, choices)` in `talk()`):
  1. „Bleib. Hier sind 40 Gold für den Winter.“ → `leaving` gelöscht, 10 Tage Ruhe (`stayTill`), Beziehung +10, Wohlstand des Orts +2.
  2. „In meiner Siedlung gibt es Arbeit.“ (nur mit `S.settlement`) → er zieht als Siedler in die eigene Siedlung (nach dem Muster des vorhandenen Siedlerwegs `settlersHour`, `game.js:10707`). Heimatort −1 Wohlstand.
  3. „Ich lege ein gutes Wort ein: Stadtkasse.“ → öffnet `investMenu(town)` (vorhanden, `6935`).
  4. „Gute Reise.“ → nichts.
- **Abschied:** Am nächsten Morgen `emigrate(k, 'work', to)`: neuer Grund im Text („Arbeit“) und neue `greet`: „„In {Ziel} suchen sie Hände. Hier sucht keiner mehr was.““. Der Rest ist der vorhandene Weg bis `settleIn`.
- **Am Ziel:** Gelingt `settleIn`, steigt der Wohlstand des Ziels um +2 (eine Arbeitskraft mehr).
- **Leerstand-Fix (Fund §0):** `emigrate` schreibt `S.vacant[houseId] = day`. `spawnResidents` überspringt Häuser mit `S.vacant[id]`. Der Eintrag fällt weg, wenn `settleIn` oder `growTown` das Haus belegt oder wenn der Ort 20 Tage `prosper ≥ 60` hält (Zuzug von außen, Log „In Eren ziehen neue Leute ein.“). So bleibt der Abgang über das Laden hinweg bestehen, ohne dass ein Ort dauerhaft verödet.
- Gilt **auch** für die bestehenden Gründe Hunger und Angst; das ist der Kern des Fixes.

### 5.4 #37 Der Hauptmann desertiert (Scheibe N4)
- **Fester Name:** `vmName(town)` = Titel und Vorname per Hash aus `town` und `S.vmGen[town] || 0` (statt `pick`, `game.js:7958`). Gleich bei jedem Laden; ein Nachfolger bekommt `gen + 1`.
- **Auslöser** (nur **Dörfer**, denn nur Dörfer werden in `raidDay` überfallen; Varonheim und Städte nie über diesen Weg):
  - Bei der Ankündigung in `raidDay` (`S.deadRaid` gesetzt, `game.js:6050`): `pWin = defPower / (defPower + n × mul)` wie in `raidTick` (`6060`).
  - Ist `pWin < 0,30` und der Hauptmann da: Chance `min(0,5; 0,5 × (1 − pWin / 0,30) + (prosper < 0 ? 0,15 : 0))`. Der Zusatz für Armut steht für „Sold fehlt“.
  - Zweiter Auslöser (Anschluss #39): Valen-Kriegsmüdigkeit ≥ 70 → einmal am Tag 5 %, ein Hauptmann in einem Valen-**Dorf** geht (nicht in Städten, nie in Varonheim).
- **Was passiert:**
  - Ist der Spieler im Umkreis von 60 Kacheln: Der Hauptmann geht sichtbar zum Ortsausgang (Reisender `kind: 'deserter'`), Sprechblase: „„Für ein Dorf, das keinen Sold zahlt, sterbe ich nicht.““ Sonst nur Log und Chronik.
  - `S.vmGone[town] = { name, day, back: day + 5 }`. `ensureDefenseMasters` überspringt den Ort, bis `back` erreicht ist; dann kommt der Nachfolger (`gen + 1`). Aufträge „vm“ fallen in dieser Zeit weg.
  - Er nimmt `min(2, militia)` Miliz mit (`defOf(town).militia −= …`).
  - **Ohne Hauptmann** kämpft der Ort schlechter: `defPower × 0,75` bis `back` (eine Zeile in `defPower`). Der Grundwert von `defPower` ändert sich **nicht**, also auch nicht die heutige Überfall-Balance.
  - Verbleib: Gibt es eine Deserteurbande derselben Seite oder ist ein Bandenplatz frei und der Pool aus §5.2 ≥ 3, wird er ihr Anführer (`lead = name`, `b.vmOf = town`). Sonst ein Steckbrief (T08) am Anschlagbrett des Orts: „Fahnenflucht: {Name}, 40 Gold, lebend 60.“
- **Entscheidungen des Spielers:**
  - **Vorbeugen:** Verteidiger anheuern hebt `pWin` (vorhanden, `defenseTalk`). Neu beim Hauptmann: „Ich lege den Sold aus (50 Gold)“ → 10 Tage treu (`S.vmPaid[town]`), Beziehung +5. Ein Hinweis in seinem Gruß, wenn `prosper < 0`: „„Der Sold kommt spät. Die Männer zählen nach.““
  - **Ersetzen:** Am Anschlagbrett „Einen neuen Hauptmann anwerben (100 Gold)“ → `back = heute`.
  - **Stellen:** Steckbrief oder Bandenanführer. Ergibt er sich (T08), neue Wahl „Zurück auf deinen Posten“ (nur wenn sein Dorf steht): Er kehrt zurück, `vmGone` gelöscht, Dorf-Fraktion +3, sein Name bleibt; Ruf der Klinge +2 (Gnade). Sonst gelten Abliefern und Hinrichten aus T08.

## 6. Spielererlebnis
Drei verlorene Schlachten um Aschfurt. Im Wirtshaus von Nordfurt sagt eine Wache: „Die Hälfte meiner Rotte ist nachts gegangen.“ Zwei Tage später meldet der Kontor: „Gemiedene Straßen: nach Eren — die Zerrissenen Röcke bei Eisenried (5 Mann).“ Salz in Eren steigt. In Eren packt die Weberin Ilse ihr Bündel: Der Ort ist seit Wochen arm. Der Spieler gibt ihr 40 Gold oder schickt sie in die eigene Siedlung. Im Dorf Haselbrück wird ein Überfall der Toten angekündigt; der Hauptmann geht. Der Spieler kann Söldner anwerben und den Sold auslegen, oder er findet „Feldwebel Brannoc“ später als Anführer der Röcke und holt ihn zurück auf seinen Posten.

## 7. Entscheidungen des Spielers
- Strecke freikämpfen, Geleit geben, Kutscher retten, oder die gemiedene Strecke selbst teuer beliefern.
- Siege und Korn für Valen (Moral hoch) oder die Toten gewähren lassen (Deserteure auf den Straßen).
- Deserteure töten, abliefern (Valen +2), laufen lassen oder anwerben (Valen −2).
- Abwanderer halten (Gold), umleiten (eigene Siedlung) oder ziehen lassen; Ort mit der Stadtkasse heben.
- Hauptmann bezahlen, ersetzen, jagen oder zurückholen.

## 8. Querwirkungen (≥ 3)
| System | Wirkung |
|---|---|
| Wirtschaft (`economy.js`, T09) | Meiden/Umweg verschieben Züge; Zielpreise steigen über die vorhandene Lagerformel; Abwanderung senkt und hebt Wohlstand |
| Banden (T12) | Deserteurbanden sind normale Banden mit `origin`; sie leben von Beute oder verhungern; Bandentod öffnet gemiedene Strecken |
| Krieg (`sim.js`) | Kriegsmüdigkeit aus Schlachten und Belagerung; Valen-Heere schrumpfen ab 60 (nie während der Belagerung Varonheims) |
| Kette (`campaignDay`) | verlorene Feldzüge → kleinere Feldzüge, Kettendeserteure an der Heerstraße |
| Fraktionen und Ruf (T08) | Deserteure abliefern/anwerben, Hauptmann zurückholen; Steckbriefe |
| Siedlung | Abwanderer können in die eigene Siedlung ziehen |
| T23 Ressourcen | Valen-Korn speist und senkt die Müdigkeit; Kettengröße erst T23, dann #39 |
| Verwundete (Vorschlag B) | jeder versorgte Valen-Verwundete senkt die Müdigkeit um 1 |

## 9. Emergenz
- Totenknoten am Weg (T12) → Überfälle → Händler meiden Eren–Nordfurt → Salz in Eren knapp → Wohlstand sinkt → Bewohner wandern ab → Eren schwächer bei der nächsten Abstimmung von `defPower` → Hauptmann desertiert → er führt die Deserteurbande, die genau diese Strecke überfällt.
- Der Spieler liefert Korn nach Nordfurt (T23) → Müdigkeit sinkt → keine neue Deserteurbande → die alte Bande findet keinen Nachschub und verhungert (T12).

## 10. Risiken
- **Banditenflut (Gegenargument #39):** Deserteurbanden zählen im T12-Deckel (3/4), je Seite höchstens eine, Start ohne Beute. Pool höchstens 8. Messen: 60-Tage-Schleife (§17).
- **Belagerungsbalance:** Keine Wirkung auf Valen während einer Belagerung Varonheims; kein Hauptmann in Varonheim; `defPower`-Grundwert unverändert. `CAP_SIEGE` wird nicht angefasst.
- **Wirtschaftsstillstand:** Meiden höchstens 8 Tage, danach wieder Stufe 0 bis zum nächsten Überfall. Höchstens die Hälfte der Strecken eines Ortes darf zugleich gemieden sein (sonst bleibt die älteste offen).
- **Entvölkerung:** höchstens eine Abwanderung je Ort und 7 Tage; Leerstand füllt sich bei Wohlstand ≥ 60 über 20 Tage wieder.
- **Proben kippen:** neue `chance()`-Aufrufe in `migrationDay`, `raidDay` und Bandenstart verschieben den geteilten Zufall. `wearyDay` ohne Zufall. Proben mit `seedRng` und gesicherten Zuständen. `world.js` und sein `rnd()` bleiben unberührt.
- **Speichern/Laden:** alle neuen Felder dürfen fehlen (`??`, `||=`). `S.vacant` ist neu; ohne ihn verhält sich das Spiel wie heute.
- **Koop:** Alles rechnet der Wirt in Tageshaken; Gäste sehen Log, Sprechblasen und Kontorzeilen über die vorhandenen Wege.
- **Leistung:** alles einmal am Tag; Strecken ≤ 12, Banden ≤ 4, Orte ≈ 40. Vernachlässigbar.

## 11. Einfachere Alternative
- **A (klein, ≈ 35 %):** Nur Text an vorhandenen Stellen: `emigrate` mit Grund „Arbeit“ ab `prosper < 0`, `evDeserters` nur nach verlorenen Schlachten, Log „Händler meiden die Strecke“ ohne Wirkung. Plus der Leerstand-Fix. Ehrlich, aber kaum Entscheidungen.
- **B (mittel):** #36 und #38 voll, #39 nur für Valen ohne Heeresverlust (nur Pool → Bande), #37 entfällt.

## 12. Abstimmung mit T12 und T23 (keine Dopplung)
| Punkt | Besitzer | Dieser Vorschlag |
|---|---|---|
| Risiko je Strecke, Banden auf der Strecke, Umweg-Schalter | T12 B1 (`riskWhy`, `o.detour`) | nutzt `detour` für Züge, zählt Überfälle über `onCaravanRaid` |
| Bandenleben (Beute, Hunger, Deckel, POI-Lager) | T12 B2 | Deserteurbanden sind T12-Banden mit `origin`, `loot: 0`; kein eigener Bandenzähler |
| Zahl neuer Züge, Wachen, Gildenspeicher, Händlerpreise | T23 S4 (`facRes('merch')`) | **ändert davon nichts**; wählt nur, **welche** Strecke ein Zug fährt |
| Händler-„Züge“ ± bei Überfall/Ankunft | T23 §5.5 | unverändert; gemiedene Strecken senken nichts zusätzlich |
| Valen-Korn | T23 §5.2 | liest `facRes('valen')` (Vorgabe: `valenGrain`) als Müdigkeitsquelle |
| Feldzuggröße der Kette | T23 §5.6 (Arbeitskraft) | Faktor **danach**: `size_T23 × (1 − (v − 50)/100)` |
| Seelen aus Schlachten | T23 §5.4 | nicht berührt |
- **Reihenfolge:** T12 B1 → N1 (#36). T12 B2 → N3 (#39). N2 (#38) und N4 (#37) sind unabhängig. T23 S4 und N1 berühren beide `caravanDay`: N1 ändert nur die Paarwahl (eine Bedingung), T23 nur Anzahl und Wachen. Keine Überschneidung im selben Ausdruck.

## 13. Aufwand
Mittel. `game.js` +220–300 Zeilen (Müdigkeit, Abwanderung, Hauptmann, Gespräche, Debug, Proben), `economy.js` +40–60 (Streckengedächtnis, Kontor), `sim.js` +10–15 (Hooks in `afterBattle`, `capture`, `cleanupArmies`). Kein Sprite außer Farbvarianten. Vier Scheiben, jede einzeln testbar.

## 14. Exploits und Gegenmittel
- **Strecke selbst überfallen, um sie zu sperren und teuer zu beliefern:** erlaubt (Rook-Weg). Eigene Überfälle zählen als Überfall; die Gilde merkt es über T12 (−1 je Überfall).
- **Abwanderer immer mit 40 Gold halten:** 10 Tage Ruhe, danach erneut. Wer das dauernd tut, zahlt dauernd; die Stadtkasse ist billiger. Gewollt.
- **Hauptmann laufen lassen, um Kopfgeld zu kassieren:** Steckbrief erst nach der Flucht, höchstens einer je Ort und 20 Tage.
- **Valen-Müdigkeit hochtreiben, um Deserteure anzuwerben:** Anwerben kostet Valen −2, Deserteure haben Loyalität 20 (T08).
- **Sold auslegen und dann Miliz abziehen:** Sold schützt nur den Hauptmann, nicht `pWin`.

## 15. Daten- und Codeplan
**Gespeichert (alle dürfen fehlen):**
- `S.eco.routes` (Objekt, ≤ 12 Einträge), `S.weary` (`{ valen, chain }`), `S.vacant` (`{ houseId: Tag }`), `S.vmGen`, `S.vmGone`, `S.vmPaid` (je `{ town: … }`)
- Bewohner: `leaving`, `stayTill`; Orte: `S.towns[k].poorDays`
- Banden: `origin`, `vmOf`
- Hinweis-Flags: `S.flags.hintRoute`, `hintWeary`, `hintLeave`, `hintVm`

**Migration:** keine nötig; jede Lesestelle mit Vorgabe. `ensureDefenseMasters` liest `S.vmGone`.

**economy.js:** `ROUTE_MEM`, `routeKey(a, b)`, `routeHit(a, b)`, `routeState(a, b)`; `caravanDay`: Paar überspringen bei `shunTill`, `detour` setzen; `routeLines` (T12) um zwei Zeilen erweitern; Hook `H.marketName`.

**sim.js:** `H.weary?.(side, kind)` in `afterBattle`, `capture`, `cleanupArmies`; `warDay`: neues Aufgebot × 0,5 bei Valen-Stufe 85 (außerhalb der Belagerung).

**game.js:** `NPC_GOALS`; `wearyDay()` (Aufruf vor `SIM.warDay()` in `dayTick`); `wearyAdd(side, n, why)`; Deserteurbande über `bandFound(…, opts)`; `migrationDay` (Armut), `leaveChoices`, `emigrate(k, 'work', to)` mit `S.vacant`; `spawnResidents` überspringt `S.vacant`; `vmName`, `ensureDefenseMasters` (Name, Abwesenheit), `vmDesert(town, why)`, `defPower` (× 0,75), `raidDay` (Auslöser), Hauptmann-Dialog (Sold, Zurückholen); `evDeserters` umgebaut.

**Debug** (`debugSections()`, neuer Abschnitt „NPC-Ziele“):
- „Strecke Eren–Nordfurt: 3 Überfälle eintragen“, „Strecken-Gedächtnis ins Log“
- „Kriegsmüdigkeit Valen +30“, „Kriegsmüdigkeit Kette +30“, „Deserteurbande jetzt (Valen)“
- „Nächstes Dorf: 5 Tage arm → Abwanderung ankündigen“, „Abwanderung sofort ausführen“, „Leerstand ins Log“
- „Hauptmann des nächsten Dorfs desertiert“, „Überfall auf das nächste Dorf ankündigen (schwach verteidigt)“

**Proben** (in `selftest()`, mit `sandbox()`, gesicherten Zuständen und `seedRng`):
1. `routeHit` 2× in 10 Tagen → `detourTill` gesetzt; neuer Zug auf der Strecke hat `detour` und `eta + 1`.
2. 3× in 14 Tagen → `shunTill`; `caravanDay` wählt das Paar nicht; nach 8 Tagen wieder wählbar.
3. `bandGone` einer Bande, die in `riskWhy` der Strecke steht → `hits` leer.
4. `wearyAdd('valen', 65)` → nach `wearyDay` verliert das stärkste Heer ≤ 2; `pool` steigt. Mit gesetzter Belagerung Varonheims: kein Verlust.
5. `pool 6`, Bandenplatz frei → Bande mit `origin: 'valen'`, `loot 0`, `men 6`; zweite Valen-Deserteurbande entsteht nicht.
6. Kette `v 80` → nächster `planCampaign('zug')` hat höchstens 70 % der Größe vor dem Faktor.
7. Ort `prosper −5`, 5 Tage `migrationDay` mit erzwungener Chance → ein Bewohner hat `leaving`; am nächsten Tag wandert er aus; `S.vacant` enthält sein Haus.
8. **Leerstand-Fix:** nach `emigrate` + `spawnResidents()` bleibt das Haus leer (heute würde es neu belegt).
9. `vmName('eren')` ist zweimal gleich; mit `vmGen + 1` anders.
10. Angekündigter Überfall mit `pWin 0,1` und erzwungener Chance → `S.vmGone[town]` gesetzt, `defPower` × 0,75, Miliz −2; kein Hauptmann in `ensureDefenseMasters` bis `back`.
11. Varonheim und Städte: `vmDesert` nie aufgerufen (Auslöser nur für `VILLAGES`).
12. Alter Stand ohne `S.weary`, `S.eco.routes`, `S.vacant` → ein Tageslauf ohne Fehler.

## 16. Scheiben (je mit MECHANIKEN, CHANGELOG, Debug, Proben)
- **N1 Händlergedächtnis (#36)** nach T12 B1. Proben 1–3.
- **N2 Abwanderung für Arbeit + Leerstand-Fix (#38).** Proben 7, 8, 12. Kann sofort gebaut werden; der Fix lohnt sich auch allein.
- **N3 Kriegsmüdigkeit und Deserteurbanden (#39)** nach T12 B2. Proben 4–6.
- **N4 Hauptmann (#37).** Proben 9–11.

## 17. Balance und Messplan (ANNAHME, im Spiel messen)
- **Müdigkeit:** Ein Abschnitt mit 3 verlorenen Schlachten (+24) und einer verlorenen Stadt (+12) bringt Valen in ≈ 7 Tagen auf ≈ 30. Stufe 60 braucht eine echte Pechsträhne (Hunter-Messung „Nordfurt und Eren wechseln mehrfach“). Heerverlust bei 60: −2/Tag gegen +1…+6 Wachstum, also Bremse, kein Absturz.
- **Messung:** 60-Tage-Schleife (`RF.tick`, 5 Stände, je 3 Läufe, `S._quiet`): Müdigkeit beider Seiten je Tag, Zahl der Deserteurbanden, gemiedene Strecken je Tag, Abwanderungen je Ort. **Ziele:** im Mittel ≤ 1 Deserteurbande gleichzeitig; Bandenrisiko auf Strecken wie T12 §17 (≤ 0,18); ≤ 2 gemiedene Strecken gleichzeitig; ≤ 1 Abwanderung je armem Ort und Woche. Varonheim-Messung aus `varonheim_belagerung.md` §16 S1 einmal wiederholen: Falltage dürfen sich nicht verschieben.
- **Hauptmann:** Heute verteidigt ein Dorf mit 6 Bewohnern (1,8) gegen 6 Untote mit ≈ 23 %. Ohne Hauptmann ≈ 18 %. Mit Miliz + Söldnern (1,8 + 2 + 6 = 9,8) ≈ 62 %, dann desertiert keiner. Spürbar, ohne den Grundwert zu ändern.

## 18. Fragen an den Entwickler (höchstens 4)
1. **Deserteurbanden und der Bandendeckel:** Zählen sie zu den 3 Banden (Sehr schwer 4) aus T12?
   **Empfehlung:** Ja, sie zählen mit; höchstens eine je Seite. Ist der Deckel voll, wartet der Pool. Sonst droht genau die Banditenflut aus dem Scout-Gegenargument.
2. **Belagerungsschutz:** Ruht die Fahnenflucht Valens, solange Varonheim belagert wird, und desertiert dort nie ein Hauptmann?
   **Empfehlung:** Ja. Die Belagerung ist frisch kalibriert; nach der Belagerung wirkt die angestaute Müdigkeit ganz normal.
3. **Valen-Heere schrumpfen durch Fahnenflucht** (ab Müdigkeit 60: −2 Stärke am Tag beim stärksten Heer)?
   **Empfehlung:** Ja, mit diesem Deckel. Ohne Heeresverlust bleibt #39 nur Kulisse; mit ihm hat die Kriegslage eine zweite Folge, die der Spieler mit Korn und Siegen beeinflusst.
4. **Abwanderer in die eigene Siedlung umleiten** (Wahl „In meiner Siedlung gibt es Arbeit“)?
   **Empfehlung:** Ja. Billig, weil der Siedlerweg existiert, und es verbindet Armut, Siedlung und Ruf zu einer Entscheidung mit Preis (Heimatort −1 Wohlstand).

## 19. Hinweise für den Spieler (Pflicht)
- Erste Umweg- oder Meidestufe (`S.flags.hintRoute`): Log „Händler merken sich Überfälle. Zwei auf derselben Straße: Umweg. Drei: Sie meiden die Straße ganz, und am Ziel wird die Ware teuer. Der Kontor zeigt gemiedene Straßen.“
- Erste Müdigkeitsstufe 40 (`hintWeary`): Chronik und Log mit Ursache und Hebel (§5.2); Kodex „Mächte“ (T23) bekommt eine Zeile „Moral“.
- Erste Abwanderungs-Ankündigung (`hintLeave`): Log „Wer lange arm ist, geht der Arbeit nach. Sprich mit ihm, solange er packt. Die Stadtkasse hebt den Wohlstand.“
- Erste Fahnenflucht eines Hauptmanns (`hintVm`): Toast „HAUPTMANN DESERTIERT“, Log „Ohne Hauptmann kämpft ein Dorf schlechter. Verteidiger anheuern hält ihn, Sold auslegen auch.“
- `docs/MECHANIKEN.md`: Abschnitte „Händler meiden Straßen“, „Kriegsmüdigkeit“, „Abwanderung“, „Fahnenflucht“. `CHANGELOG` je Scheibe.
