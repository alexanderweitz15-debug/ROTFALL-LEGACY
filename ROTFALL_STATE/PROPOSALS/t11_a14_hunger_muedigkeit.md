# T11 + A14 — „Brot, Schlaf und Sturm“: Überleben, Schwierigkeit, Wetter im Menschenland

**Status:** APPROVED im Grundsatz (DECISIONS 01.10.: A14 komplett mit `DIFF.survival`, Angsthase nur Hinweise) → hier umsetzungsreif.
**Autor:** Designer (Opus) · **Stand:** 01.10.2026 · Kennzeichnung: **FAKT** (Datei:Zeile), **VORSCHLAG**, **ANNAHME**.
Umfasst: A14 (Hunger, Müdigkeit, Rast), §5g.6 (Sehr schwer = mehr Überfälle, Angsthase erwacht beim Heiler), §5g.21 (eigene Wetterlagen der mittleren Länder). Aufgabentext: `docs/audit/TASKS.md` T11.

---

## 1. Konzept
Wer lange draußen ist, plant: Proviant, ein sicherer Schlafplatz, das Wetter. Gegessen wird **automatisch** aus Vorrat und Gepäck, geschlafen wird bewusst. Spürbar wird nur der **Mangel**: hungrig, ausgehungert, müde. Die Stärke der Folgen hängt an `DIFF.survival` (Angsthase 0 = nur Hinweise, Schwer 0,5, Sehr schwer 1). Dazu bekommt das Menschenland eigenes Wetter (Gewitter, Schlamm), „Sehr schwer“ bringt mehr Überfälle, und „Angsthase“ wacht nach dem Fall bei einer Heilerin auf.

## 2. Gelöstes Problem
- Hunger ist heute ein Gruppen-Würfel einmal am Tag: ohne `S.res.food` Moral −10 und Rumpf −4, nie unter 1 (FAKT `game.js:10877–10885`). Brot und Dörrfleisch im Gepäck zählen dafür **nicht** (FAKT: `useItem` `game.js:525–531` gibt nur Ausdauer). `S.res.food` kann der Spieler ohne Siedlung kaum auffüllen (FAKT: Quellen nur Hof `9840`, Siedler `10731`, Festmahl `919`). Ergebnis: Nach drei Tagen „hungert“ jeder Held dauerhaft, ohne dass es etwas bedeutet.
- Müdigkeit gibt es nicht. Schlaf (`sleepIn`, FAKT `game.js:4747–4766`) heilt voll und gibt „Ausgeruht“ (+10 % EP), ist aber nie nötig.
- „Sehr schwer“ ändert nur Gegnerwerte und Beute (FAKT `DIFF` `game.js:1634–1638`), nicht die Welt. „Angsthase“ stirbt wie alle anderen.
- Im Menschenland gilt nur der Standard-Pool `['clear','clear','cloudy','cloudy','rain','fog']` (FAKT `weatherPool` `game.js:2183–2189`; Befund `docs/IST_ZUSTAND.md:1222`).

## 3. Warum es zu ROTFALL passt
Kenshi-Kern: Der Körper ist eine Ressource, Mangel ist eine Folge von Entscheidungen. Es verbindet vorhandene Systeme, statt neue zu erfinden: Brotpreis hängt seit T09 am Kornlager der Stadt (FAKT `baseOf` `game.js:13196`, Kauf zieht Korn `12447`), Banden unterbrechen Kornzüge (T12), eine hungernde Stadt verkauft kein Brot mehr (FAKT Auswahl `12423`: Bestand < 1 → Gewicht 0). Wer Proviant vergisst, merkt den Krieg im eigenen Magen.

## 4. Heutiges System (FAKT)
| Teil | Ort | Heute |
|---|---|---|
| Gruppen-Nahrung | `game.js:10877–10885` (`dayTick`) | `need = ceil((Gefährten+1) × Wetterfaktor)`; Schnee 1,5 (`WX.snow.food`), Winter 1,25; reicht `S.res.food` → Moral +2, sonst Moral −10, `remember('starved')`, Held Rumpf −4 (≥ 1) |
| Desertion | `10887–10893` | Moral < 12 → 40 % gehen (Koop-Helden nie) |
| Startvorrat | `state.js:60`, `game.js:1847` | `res.food: 3` |
| Essen aus Gepäck | `game.js:525–531` | `use:'food'`: Ausdauer +30 + food×10, kein Sättigungswert |
| Nahrungsgegenstände | `data.js:324–325`, `353`, `349` | Brotlaib (food 1, 4 G), Dörrfleisch (food 2, 9 G), Pökelfleisch `meat` (Ware, 9 G), Weizensack `grain` (Ware, 6 G) |
| HUD/Effekte | `activeEffects` `game.js:10971–10972` | „Hungrig“ bei `S.res.food <= 0`, sonst „Proviant reicht für … Tage“ |
| Schlaf | `sleepIn` `4747–4766`, `passTime` `4741–4745` | Bett/Pritsche; nachts bis 7 Uhr, tags 6 Std.; volle Heilung der Gruppe, `SLEEP_CURES`, Status `rested` 10 Min.; `passTime` holt nur Kriegszüge nach |
| Rast | `sitOn` `4782–4789`; Siedlungsfeuer `10697–10701` | Bank 20 Min. (Ausdauer, 10 % Leben); Siedlungsfeuer 1 Std. (Ausdauer, 15 % Leben) |
| Lagerfeuer in der Welt | `campfire_static` → `craftMenu('kessel')` `4730` | nur Brauen |
| Ausdauer | `recalc` `game.js:73`; Erholung `2743` | `maxStamina` aus Ausdauer, Stufe, Bau, Talenten; Erholung mal `wxOf(c).stam` |
| Krit | `game.js:3258` | `0,05 + Wahrnehmung × 0,004 + …` |
| Aufrichten | `reviveTick` `3480–3488`, `KO_RATE 0,1` `3473`; Held kommt zu sich `2773–2774` | Downed-Regel: keine Selbstheilung am Boden |
| Schwierigkeit | `DIFF` `1634–1638`, `applyDifficulty` `1640` | hp, dmg, tele, loot, decay |
| Wildnis-Überfälle | `travelTick` `2654–2690` | Chance `(0,12 + threat × 0,05) × WX.ambush`, keine Tageszeit |
| Banden/Totenzüge | `bandDay` `11044–11051`, `raidDay` `6042–6052` | Neue Bande 20 %/Tag; Totenzug 6 %/Tag |
| Tod des Helden | Bodenpfad `2775–2777` → `die` `3498` → `playerDeath` `3607`, `13671` | `captureInstead` (Kette, Sonnenklingen) als einzige Ausnahme |
| Wetter | `WX` `2160–2167`, `wxOf` `2178–2182`, `WEATHER_POOL` `2181–2182`, Wechsel `2363–2368`, Bild `render.js:2504–2535` | Regionen über `world.js regionAt` `227`; Menschenland = `plains`/`forest`/`marsh`/`greenmark` (FAKT `world.js:187–207`) |
| NPC-Hunger | `game.js:1262–1270` | Bewohner: `e.ate`, `HUNGRY_MIN 20 Std.`, über Stadtlager |

## 5. Neues System (VORSCHLAG)

### 5.1 Grundgrößen (alles an einer Stelle: `const SURV = {…}` neben `DIFF`)
```js
const SURV = { day: 1440, warn: 240, eatAt: 240,          // Minuten; gegessen wird, wenn die Sättigung in ≤ 4 Std. endet
  hungry: 0, starving: 1440,                               // ab Ende der Sättigung: hungrig; 24 Std. später ausgehungert
  tired: 20 * 60, campRest: 6 * 60,                        // > 20 Std. wach = müde; Rast am Feuer zieht 6 Std. ab
  stamH: 0.2, stamS: 0.4, critS: 0.03, reviveS: 0.4, perT: 2, regenT: 0.15, starveTorso: 4 };
DIFF.angsthase.survival = 0; DIFF.schwer.survival = 0.5; DIFF.sehr_schwer.survival = 1;
DIFF.angsthase.raid = 0.7;  DIFF.schwer.raid = 1;      DIFF.sehr_schwer.raid = 1.5;   /* §5g.6 */
const sv = () => diffOf().survival ?? 0.5;
```

### 5.2 Sättigung statt Tageswürfel
Jeder Esser hat **`fedUntil`** (absolute Spielminute, `clock()` `game.js:2154`), bis wann er satt ist. Eine Ration sättigt `SURV.day / foodMul` Minuten, `foodMul` = heutiger Wetter- und Winterfaktor aus `10878` (Schnee 1,5, Hitze 1,2, Winter 1,25). Im Schnee hält eine Ration also 16 Std.
- **Satt:** `clock() < fedUntil`. Keine Wirkung.
- **Hungrig:** `fedUntil ≤ clock() < fedUntil + 1440` (der zweite Tag ohne Essen).
- **Ausgehungert:** `clock() ≥ fedUntil + 1440`.
- Essen: wer hungrig ist, `fedUntil = clock() + Dauer`; wer noch satt ist, `fedUntil += Dauer` (höchstens `clock() + 2 Tage`, kein Hamstern im Bauch).

### 5.3 Automatisches Essen und Reihenfolge
`autoEat(c, now)` läuft in `hourTick` (`9827`) **und** je übersprungener Stunde in `passTime` (in derselben Schleife, die heute `warTick` nachholt, `4742–4743`, mit `now = h × 60`). So isst man auch beim Schlafen, auf Schiffs- und Luftreisen.
- Bedingung: `now ≥ fedUntil − SURV.eatAt`, nicht am Boden, nicht in einem Kampf (`foesNear(c, 420)`, `4723`; dann nächste Stunde).
- **Reihenfolge** (billigste und abstrakteste zuerst, damit Gepäck für Notfälle bleibt):
  1. **Vorrat** `S.res.food` (1 = eine Ration; bleibt der gemeinsame Trossvorrat, wie heute).
  2. **Brotlaib** (`food:1` → 1 Ration).
  3. **Pökelfleisch** `meat` (Ware; 1 Ration — VORSCHLAG `ITEMS.meat.food = 1`, Handelsware bleibt sie).
  4. **Dörrfleisch** (`food:2` → 2 Rationen: ein Stück sättigt doppelt so lange; zuletzt, weil es am längsten hält und im Kampf Ausdauer gibt).
  - **Nie** automatisch: Weizensack (roh), Tränke, Elixiere, Wasser, Köder für Zähmung.
- Wer isst woraus:
  - **Held:** Vorrat → eigenes Gepäck.
  - **Gefährte (NPC):** Vorrat → eigenes Gepäck → Gepäck des Helden („der Anführer teilt“).
  - **Koop-Held:** Vorrat → eigenes Gepäck. Nie aus dem Gepäck des Wirts.
- Manuelles Essen über die Leiste bleibt (Ausdauer-Schub wie heute) und setzt zusätzlich `fedUntil` nach 5.2.
- Log nur einmal am Tag gebündelt: „Die Gruppe isst: 2 Rationen Vorrat, 1 Brotlaib.“ (Kanal `party`). Keine Meldung je Bissen.

### 5.4 Wirkung (mal `sv()`; Angsthase = 0)
| Zustand | Schwelle | Wirkung bei `sv()=1` (Sehr schwer) | Schwer (0,5) |
|---|---|---|---|
| Hungrig | Sättigung vorbei | max. Ausdauer −20 % | −10 % |
| Ausgehungert | +24 Std. | max. Ausdauer −40 %, Krit −3 %-Punkte, Aufrichten −40 % (fremde Hilfe `reviveTick` und eigenes Zusichkommen), Rumpf −4 je Tag (wie heute, siehe F1) | −20 %, −1,5, −20 %, Rumpf −2 |
| Müde | > 20 Std. wach | Wahrnehmung −2 (Krit −0,8 %-Punkte, Fallen/Köder/Schatzsuche), Ausdauer-Erholung −15 %, kein „Ausgeruht“ | Wahrnehmung −1, Erholung −7,5 % |

Umsetzung:
- `recalc` (`game.js:73`): `c.maxStamina *= 1 − (hunger===1 ? stamH : hunger===2 ? stamS : 0) × sv()`. `recalc` wird nur bei Zustandswechsel aufgerufen (gecacht in `c.surv = {h: 0|1|2, t: bool}` aus `survTick`).
- Neue Hilfsfunktion `perOf(c) = (c.attributes?.perception || 10) − (c.surv?.t ? SURV.perT × sv() : 0)`; ersetzt die 5 Lesestellen `2642`, `3258`, `9823`, `11517`, `12142`. Das Attribut selbst bleibt unverändert (kein Speicherschaden).
- Krit (`3258`): `− (c.surv?.h === 2 ? SURV.critS × sv() : 0)`.
- Erholung (`2743`): Faktor `× (1 − (c.surv?.t ? SURV.regenT × sv() : 0))`.
- `reviveTick` (`3482`): `k ×= 1 − (c.surv?.h === 2 ? SURV.reviveS × sv() : 0)`. Held kommt zu sich (`2773`): `downTimer` beim Hinfallen `× (1 + 0,5 × sv())`, wenn ausgehungert. **Downed-Regel bleibt:** am Boden keine Selbstheilung, Wachen heben angegriffene Helden nicht auf (Memory „Downed rule“). Hunger macht es nur langsamer.
- Der alte Block `10877–10885` wird ersetzt durch `survDay()`: Gefährten-Moral +2 (satt), 0 (hungrig), −10 + `remember('starved')` (ausgehungert); Rumpf −`starveTorso × sv()` für jeden Ausgehungerten (Held ≥ 1, siehe F1).
- **Ausnahmen:** Vampire (`isVamp`, Blutdurst ersetzt Hunger), Automaten/Golems (`c.robot`), Beschworene/Tiere (`servant`, `pet`), Reittier. Sie haben kein `fedUntil` und keinen Zustand.

### 5.5 Müdigkeit und Schlaf
- Feld **`wokeAt`** (absolute Minute, seit der man wach ist). `wach = clock() − wokeAt`. Müde ab > 20 Std.
- **Bett/Pritsche** (`sleepIn`): wie heute (volle Heilung, `SLEEP_CURES`, „Ausgeruht“), **plus** `wokeAt = clock()` nach dem Schlaf, `autoEat` beim Aufwachen („Frühstück“). Müde Helden bekommen beim Schlaf +2 Std. Schlafdauer am Tag (8 statt 6).
- **Rast am Feuer** (Siedlungsfeuer `10697`, NEU auch jedes `campfire_static` außerhalb von Städten): 1 Std. wie heute, zieht `SURV.campRest` (6 Std.) von der Wachzeit ab.
- **Lager aufschlagen** (NEU, der echte Draußen-Schlaf):
  - E an einem Lagerfeuer in der Wildnis öffnet eine Auswahl: „Am Kessel brauen“ (heute) / „Lager aufschlagen und schlafen“.
  - Alternativ mit **Schlafrolle** (NEU, `ITEMS.schlafrolle`: Gegenstand, 12 Gold, Hausierer-Pool `game.js:1291` und Händler) überall draußen über die Leiste.
  - Schlaf bis 7 Uhr bzw. 6 Std. wie `sleepIn`. Heilung **50 %** statt voll, `wokeAt = clock()`, kein „Ausgeruht“. Am Feuer +15 % Heilung extra.
  - **Nachtüberfall beim Lagern:** Chance `(0,10 + threat × 0,04) × DIFF.raid × (Feuer 0,8) × (wacher Gefährte 0,5)`, Bandengebiet (T12, `bandTick` `11068`, unbezahlt) ×2. Tritt er ein: Schlaf bricht nach `ri(2,5)` Std. ab, 3–5 Gegner aus `AMBUSH_BY_TILE` außerhalb des Bildes (Muster `travelTick`/`pushOut`), Held mit halber Ausdauer, Toast „ÜBERFALL IM SCHLAF“. Wache halten = ein Gefährte wählt man in der Lagerauswahl, er schläft nicht (bleibt müde).
- **Nachts im Freien** (A14): `travelTick` `2667` Faktor `× (Nacht 21–6 Uhr ? 1,35 : 1) × DIFF.raid`.
- Gefährten haben eigenes `wokeAt`. Sie schlafen mit (wie heute `4757`). Wer Wache hielt, bleibt müde.

### 5.6 §5g.6 Schwierigkeit
- `DIFF.raid` (0,7 / 1 / 1,5) multipliziert: neue Bande `bandDay` `11050` (0,2 → 0,3), Bandenwachstum (bis T12 `b.loot` übernimmt), Totenzug `raidDay` `6045` (0,06 → 0,09; nach Kettenbruch 0,35 → 0,5), Wildnis-Überfälle `travelTick`, Lagerüberfall. Höchstzahl Banden auf Sehr schwer 4 statt 3.
- **Angsthase erwacht bei der Heilerin** (`healerWake(p)`):
  - Wo: im Bodenpfad vor `die` (`2776`, neben `captureInstead`) und am Anfang von `die()` für den Helden, wenn `S.difficulty === 'angsthase'`.
  - Nicht bei: Skript-Toden (Hinrichtung, Sonnentod-Szene des Blutfürsten), `S.dying`, `S._quiet`, Koop-Gast (Gäste fallen mit dem Helden wie heute).
  - Ablauf: Abblende (`UI.sleepFade`), Held in der nächsten Stadt mit lebender Heilerin (`isHealer`, `11121`) neben ihr; aus Dungeons zuerst auf die Weltkarte. +12 Std. (`passTime`). Rumpf auf 25 %, Blutung weg. Heilerlohn = 30 % des Golds (mindestens 0). Gefährten am Boden in der Nähe kommen mit.
  - Hinweis: „Du erwachst in Eren. Elena: ‚Man hat dich auf einem Karren gebracht. Das kostet.‘ (Angsthase: kein Tod, aber Gold und Zeit.)“
  - Kein Ahnenfeind, keine Erbfolge. Fallback, wenn keine Heilerin lebt: Eren-Schrein.

### 5.7 §5g.21 Wetter im Menschenland
- Neuer Pool `WEATHER_POOL.men = ['clear','clear','cloudy','cloudy','rain','fog','storm','mud']`. In `weatherPool` werden `plains`, `forest`, `marsh` und `greenmark` auf `men` abgebildet. Jahreszeit: Herbst +`storm`,`mud`; Winter ohne `storm`; Sommer +`storm` (Hitzegewitter).
- **`storm` — Gewitter:** `{ ranged: 0.85, sight: 0.8, foeSight: 0.85, ambush: 0.8 }`.
  - Blitz alle `ri(25, 60)` s im Umkreis 420 px des Helden, nur draußen. Ein Ziel wird gewählt, metallene Rüstung (`armor ≥ 6`) zählt doppelt; Gegner, Gefährten und Held sind gleich.
  - Ansage 0,8 s (helles Kreuz am Boden, `fx`) — fair und ausweichbar. Danach 18 Schaden `shock` im Radius 40 und Status `shocked` 1,5 s.
  - Feuer brennt wie bei Regen schwächer (`2753`: `rain` → `rain||storm`). Render: Regen-Bild plus Blitzflash; `sfx` Donner (Rauschen + tiefer Sinus, WebAudio).
- **`mud` — Landregen und Schlamm:** `{ speed: 0.9, stam: 0.85, ranged: 0.95 }`. Gilt **nicht** auf Straßen- und Pflasterkacheln (`T.ROAD`, Städte). Heißt: Straßen lohnen. Ausweichrolle kostet +25 % Ausdauer. Gegner: neues `wxSpeed(e)` in der Gegnerbewegung, damit Schlamm und Schnee auch sie bremsen (heute bremst `speedOf` `131` nur Figuren mit Ausrüstung).
- `REGIONAL_WEATHER` bekommt `storm` und `mud` (sie enden beim Verlassen des Menschenlands, `2369`).
- Log-Text wie bei den vorhandenen Wetterlagen (`WX.txt`, wird beim Wechsel gemeldet, `2366`).

### 5.8 Wirtschaft (T09/T23-Anschluss)
- Brotlaib folgt Korn, Dörrfleisch Fleisch (FAKT `baseOf` `13196`). Jeder Kauf zieht 0,5 aus dem Lager (`12447`). Hungernde Städte verkaufen fast kein Brot (`12423`). Mehr Proviant-Nachfrage durch Spieler senkt also das Stadtlager. Bei einem Spieler ist das klein (0,5 Korn je Brot), aber es ist sichtbar.
- **Proviant beim Wirt** (NEU, schließt die Lücke „Vorrat nicht kaufbar“): Wirt/Schenke, Wahl „Proviant für die Reise (5 Rationen)“.
  - Preis `5 × ecoPrice(town,'grain',true) × 0,7`. Bei Korn 6 Gold Grundwert also ≈ 24 Gold; in Mangelstädten bis ≈ 3× teurer.
  - Zieht 1,5 Korn aus dem Lager und legt +5 auf `S.res.food`. Nicht in hungernden Städten („Wir haben selbst nichts.“).
- Vharnholm (die Stillen essen nicht, FAKT Probe `17619`) verkauft keinen Proviant.
- Spielerhof und Siedlung liefern weiter in `S.res.food` (`9840`, `10731`). Das ist der Weg für Selbstversorger.

### 5.9 HUD und Hinweise
- `activeEffects` (`10971–10972`) ersetzen:
  - „Hungrig“ (◌, schlecht), „Ausgehungert“ (◌, schlecht, rot), „Müde“ (☽, schlecht).
  - Jeweils mit der **echten** Wirkung je Schwierigkeit („max. Ausdauer −10 % (Schwer)“). Auf Angsthase steht „ohne Folgen (Angsthase)“.
  - Info-Zeile „Proviant: 4 Vorrat + 3 im Gepäck = 7 Rationen, reicht 2 Tage für 3 Köpfe“ (Rationen ÷ Köpfe × Dauer).
- Ausdauerbalken (`ui.js:114`): der durch Hunger gesperrte Teil grau schraffiert (Wert `maxStamina` vs. ungekürzt; `c.staminaCap0` aus `recalc`).
- Einmalige Hinweise (`S.flags.hint*`):
  - erstes Hungrig: „Du hast Hunger. Gegessen wird von selbst aus Vorrat und Gepäck — Brot, Dörrfleisch, Proviant beim Wirt.“ Angsthase: „… (Angsthase: ohne Folgen).“
  - erstes Müde: „Seit 20 Stunden wach. Schlaf in einem Bett, einer Schenke oder schlag am Feuer ein Lager auf.“
  - erstes Gewitter und erster Schlamm über `WX.txt`.
  - Angsthase-Erwachen siehe 5.6.
- Brotlaib/Dörrfleisch-Tooltip: „1 Tagesration“ / „2 Tagesrationen“. Bewohner-Satz bei müdem Helden („Du siehst aus, als hättest du seit Tagen nicht geschlafen.“, NPC-Reaktionen, Kommentar `2191`).
- `docs/MECHANIKEN.md` Abschnitt „Überleben“ (Pflicht nach CLAUDE.md), `CHANGELOG`.

## 6. Spielererlebnis
Zwei Tage im Westwald, das Gewitter zieht auf, ein Blitz schlägt neben dem Kettenkrieger ein. Abends: „Die Gruppe isst: 2 Rationen Vorrat.“ Am dritten Tag ist der Vorrat leer, das Brot aus Eren auch; Ausdauer schrumpft, Brenna murrt. Ein Lager am Feuer, Ulf hält Wache, um 3 Uhr ein Überfall, aber Ulf war wach. In Kreuzweg kostet Proviant das Doppelte, weil die Kornzüge an der Bande hängen. Man zahlt. Oder man zerschlägt die Bande.

## 7. Entscheidungen des Spielers
- Wie viel Proviant mitnehmen (Gewicht/Taschenplatz gegen Reichweite; Dörrfleisch hält länger, kostet mehr).
- Wo schlafen: Schenke (8 Gold, sicher, volle Heilung), Lager am Feuer (gratis, halbe Heilung, Überfallrisiko), Wache stellen (ein Gefährte bleibt müde).
- Durchziehen oder rasten: müde weiterlaufen kostet Krit und Erholung, Rast kostet Zeit (Kriegszüge laufen weiter).
- Bei Gewitter: Fernkämpfer meiden, schwere Rüstung zieht Blitze an. Bei Schlamm: Straße statt Querfeldein.
- Proviant in Mangelstädten teuer kaufen oder Korn liefern (Lieferaufträge, eigener Wagen).

## 8. Querwirkungen (≥ 3)
| System | Wirkung |
|---|---|
| Wirtschaft T09/T23 | Brot und Proviant ziehen aus dem Kornlager; Mangel macht Proviant teuer oder unkäuflich; Valens Korn (T23 §5.2) und Spieler konkurrieren um dasselbe Lager |
| Banden T12 | Nachtlager in Bandengebiet doppelt riskant; Banden unterbrechen Kornzüge → Proviant teurer |
| Gefährten | Moral aus Sättigung (ersetzt Würfel), Desertion wie heute; Wache halten |
| Kampf | Ausdauer, Krit, Ausweichen (Schlamm), Blitz, Fernkampf |
| Downed/Kenshi-Regel | Aufrichten langsamer bei Ausgehungerten, Regel selbst unverändert |
| Wetter | Schnee/Hitze verkürzen Sättigung; Gewitter/Schlamm neu; `WX.ambush` |
| Blutkult | Vampire hungern nicht (Blutdurst), aber müde werden sie |
| Siedlung | Hof und Siedler füllen `S.res.food` — Selbstversorgung wird wertvoll |
| Schwierigkeit | `DIFF.survival`, `DIFF.raid`, Heiler-Erwachen |
| T37 (später) | `c.surv.t` verengt den Sichtkegel — Feld liegt bereit |

## 9. Emergenz
- Bande an der Kornstraße → Brot in Nordfurt knapp → Proviant teuer → Held geht hungrig ins Gewölbe → kämpft schwächer → fällt → (Angsthase) wacht bei der Heilerin auf und hat ein Drittel weniger Gold → zerschlägt die Bande.
- Gewitter + Plattenpanzer + Nachtlager im Bandengebiet: drei kleine Regeln, eine Geschichte.

## 10. Risiken
- **Mikromanagement:** Gegenmittel ist automatisches Essen; Meldungen nur gebündelt.
- **Zu hart im Frühspiel:** Startvorrat 3 → **5** Rationen + 2 Brotlaibe in der Startausrüstung (VORSCHLAG); Schwer halbiert alle Werte.
- **Probenkippen durch RNG:** Lagerüberfall und Blitz ziehen `chance()` (geteilter Zufall). Nur auf der Weltkarte, nur bei Lagern/Gewitter. Bestehende Proben, die `S.weather` setzen, bleiben bei bekannten Werten. `world.js rnd()` wird **nicht** berührt.
- **Proben mit Zeitsprung** (`passTime`, `S.day` setzen) machen Helden plötzlich ausgehungert → Wirkung auf `maxStamina` kann fremde Proben stören. Gegenmittel: `stage()` setzt `fedUntil = Infinity`, `wokeAt = clock()`; nur T11-Proben setzen es selbst.
- **Leistung:** `survTick` je Esser einmal pro Spielstunde, `autoEat` bei übersprungenen Stunden (Schlaf ≤ 18, Reisen ≤ ~100) — vernachlässigbar. Blitz: ein Timer.
- **Speichern/Laden:** nur Zahlenfelder auf Figuren (siehe §15).

## 11. Alternativen
- **A (kleiner):** Nur Hunger mit Gepäck-Essen und Ausdauer-Malus. Keine Müdigkeit, kein Lager, kein Wetter. ~⅓ Aufwand. Verliert die Schlafentscheidung und die Nachtüberfälle.
- **B (noch kleiner):** `dayTick`-Würfel bleibt, zählt aber Brot/Dörrfleisch im Gepäck mit. Statt Rumpf −4 ein Tagesstatus „Hungrig“ (−20 % Ausdauer × `sv()`). Halber Tag Arbeit, keine neuen Felder.
- **C:** Müdigkeit nur als Bonus (Ausgeruht länger), nie als Malus. Bricht die Freigabe „komplett“.

## 12. Abhängigkeiten
- T05 erledigt (DEPENDS laut TASKS).
- T09 ist IMPLEMENTED (`baseOf`), die Wirtschaftsanbindung braucht nichts Neues.
- T12 (Banden) und T23 (Korn) sind nicht nötig, profitieren aber. Reihenfolge egal.
- T37 Sichtkegel liest später `c.surv.t`.
- Koop: `coopAPI` braucht den Lese-Hook für Zustand und Proviantzeile (Gast-HUD).

## 13. Aufwand
Mittel bis groß, in 5 Scheiben (§16). Größter Brocken ist Scheibe 2 (Lager, Überfall). Am wenigsten Code hat Scheibe 4.

## 14. Exploits und Gegenmittel
- **Bauch hamstern:** Sättigung höchstens 2 Tage im Voraus.
- **Schlaf-Spam für Heilung:** gibt es heute schon (Bett). Lager heilt nur 50 % und kann überfallen werden.
- **Angsthase-Tod als Schnellreise:** kostet 30 % Gold und 12 Std.; man landet nur beim nächsten Heiler, nicht frei wählbar.
- **Koop-Gast isst aus dem Wirts-Gepäck:** ausgeschlossen (5.3). Geparkter Gast (`S.coopHeroes`, `18332–18335`) kehrt **satt und ausgeruht** zurück (`fedUntil = clock()+1440`, `wokeAt = clock()` beim Entparken). Billig und harmlos.
- **Proviant in Überflussstadt billig kaufen und verkaufen:** Proviant ist kein Gegenstand (geht in `S.res.food`), also nicht verkaufbar.
- **Blitz auf Gegner farmen:** gibt keine EP/Beute-Sonderregel; Tötungen durch Blitz zählen wie Umwelt (kein `credit` an den Helden).

## 15. Daten- und Codeplan
**Neue Felder (gespeichert, dürfen fehlen):**
- Auf Figuren (Held, Gefährten, Koop-Helden): `fedUntil:number`, `wokeAt:number`. `c.surv` ist ein Cache und darf gespeichert werden; er wird beim Laden aus den Zeitstempeln neu berechnet.
- `S.flags.hintHunger`, `hintStarve`, `hintTired`, `hintStorm`, `hintMud`, `angstWake` (Zähler).
- `ITEMS.schlafrolle`, `ITEMS.meat.food = 1`. `WX.storm`, `WX.mud`, `WEATHER_POOL.men`.

**Migration** in `continueGame()` (`~1966`) über `ensureSurvival()`, aufgerufen auch in `newGame()`:
- Fehlt `fedUntil` → `clock() + 1440` (satt).
- Fehlt `wokeAt` → `clock() − 6×60`.
- Für Held, `partyMembers()` und `Object.values(S.coopHeroes||{})`.

**Funktionen (game.js):**
- `survState(c, now)` → `{h, t}`.
- `survTick(c)`: Wechsel → `recalc(c)`, Hinweis, HUD.
- `autoEat(c, now)`; `rationsOf(c)` für das HUD.
- `survDay()` ersetzt `10877–10885`.
- `campSleep(fire|null)`, `healerWake(p)`, `stormTick(dt)` (in `update` neben `S.weatherLeft`, `2363`), `wxSpeed(e)`.

**Debug-Menü** (`debugSections()`, Abschnitt „Überleben“):
- „Hunger: +24 Std. Sättigung abziehen“
- „Satt setzen / Hungrig / Ausgehungert“
- „Müde setzen (21 Std. wach) / Ausgeruht“
- „Überleben-Werte zeigen“ (Toast: fedUntil, wokeAt, Zustand, Rationen, `sv()`)
- „Lager aufschlagen (hier)“ und „Lagerüberfall erzwingen“
- „Angsthase: Heiler-Erwachen auslösen“
- In `dbWeather` (`14464`) `storm` und `mud` ergänzen, dazu „Blitz jetzt“.

**Proben** (`selftest()`, je in `sandbox()`/`stage()`):
1. **Hungern:** `fedUntil = clock() − 2×1440`, Sehr schwer → `surv.h === 2`, `maxStamina ≈ 0,6 × vorher`. Schwer → 0,8×. Angsthase → unverändert **und** `S.flags.hintHunger` gesetzt.
2. **Reihenfolge:** Vorrat 1, Brot 1, Pökelfleisch 1, Dörrfleisch 1. Viermal `autoEat` mit Zeitsprung → verbraucht in genau dieser Reihenfolge. Dörrfleisch verlängert um 2880 Min. (ohne Schnee).
3. **Zeitsprung:** `passTime(3×1440)` mit 3 Broten → 3 gegessen, danach satt. Ohne Brot → ausgehungert.
4. **Müde:** `wokeAt = clock() − 21×60` → `perOf` −2 (Sehr schwer), Krit-Chance kleiner. `sleepIn` → nicht müde, `wokeAt === clock()`.
5. **Gefährten:** Gefährte ohne eigenes Brot isst aus dem Heldengepäck. Vampir-Gefährte hat keinen Zustand. Ausgehungerter Gefährte Moral −10 in `survDay`.
6. **Speichern/Laden:** `saveData`/`applySave` erhält `fedUntil`/`wokeAt`. Alter Stand ohne Felder → nach `ensureSurvival` satt und nicht müde.
7. **Downed-Regel:** ausgehungerter Held am Boden → `reviveTick` heilt je Sekunde 40 % weniger (Sehr schwer); keine Selbstheilung (bestehende Probe `14889/14936` weiter grün).
8. **Lagerüberfall:** Chance erzwungen → Gegner erscheinen außerhalb von `inView`, kein „Ausgeruht“, Schlaf kürzer.
9. **Angsthase:** `knockOut` + `downTimer` 0, Angsthase → Held lebt, steht neben einer Heilerin, Gold × 0,7, kein Ahnen-Eintrag (`S.legacy.ancestors` gleich lang).
10. **§5g.6:** `DIFF.raid` wirkt — Hilfsfunktion `bandFoundChance()` gibt 0,14 / 0,2 / 0,3 zurück (rein, ohne Würfel).
11. **Wetter:** Spieler in `plains` → `weatherPool` enthält `storm` und `mud`, in `desert` nicht. Blitz in `__a` mit festem Ziel trifft einen Gegner (HP sinkt). `mud` bremst einen Gegner (`wxSpeed < 1`), auf `T.ROAD` nicht.
12. **Koop:** `RF.coop.fakeGuest`-Held isst aus dem Vorrat, nie aus dem Wirtsgepäck. Parken und Entparken → satt.

## 16. Scheiben (je mit MECHANIKEN, CHANGELOG, Debug, Proben)
- **S1 Hunger-Kern:** Felder, `SURV`, `DIFF.survival`, `autoEat`, Reihenfolge, Wirkung Ausdauer/Krit/Aufrichten, `survDay` ersetzt den Würfel, HUD/Hinweise, Migration, Proviant beim Wirt. Proben 1, 2, 3, 6, 7.
- **S2 Müdigkeit und Lager:** `wokeAt`, `perOf`, Erholung, Bett/Feuer/Lager/Schlafrolle, Wache, Nacht-Faktor, Lagerüberfall. Proben 4, 8.
- **S3 Gruppe und Koop:** Gefährten-Essen und -Moral, Ausnahmen (Vampir, Automat), Koop-Gast, Parken. Proben 5, 12.
- **S4 §5g.6:** `DIFF.raid`, vierte Bande, `healerWake`. Proben 9, 10.
- **S5 §5g.21 Wetter:** `men`-Pool, Gewitter (Blitz, Bild, Donner), Schlamm (`wxSpeed`, Straßen frei). Probe 11.

## 17. Balance (ANNAHME, mit `RF.simFight` messen)
- −20 % Ausdauer ≈ eine Ausweichrolle weniger je Kampf. −40 % + −3 % Krit auf Sehr schwer ist deutlich, aber kein Todesurteil.
- Proviant ≈ 5 Gold je Tag und Kopf, gegen Schenke 8 Gold je Nacht. Eine Woche Tour zu dritt ≈ 100 Gold Proviant, spürbar ab Stufe 1–5, unwichtig ab Stufe 15. Das ist gewollt: Planung zählt früh, später der Weg.
- Lagerüberfall Mittelland (threat 1–2) ≈ 14–18 % auf Schwer, mit Feuer und Wache ≈ 6–7 %.

## 18. Fragen an den Entwickler (höchstens 4)
1. **Kann man verhungern?** Heute geht der Rumpf nie unter 1.
   **Empfehlung:** Auf **Sehr schwer** ab dem 5. Tag ohne Essen darf der Rumpf auf 0 fallen (Held geht zu Boden, Ursache „Verhungert“, Downed-Regel normal), mit zwei deutlichen Warnungen vorher. Auf Schwer bleibt es bei ≥ 1, auf Angsthase gibt es keinen Rumpfschaden.
2. **Lager aufschlagen draußen:** am Lagerfeuer **und** mit der neuen Schlafrolle, oder nur am Feuer?
   **Empfehlung:** beides. Die Schlafrolle macht das Wildnis-Leben möglich; das Feuer senkt das Risiko.
3. **Neue Wetterlagen im Menschenland:** Gewitter (Blitze treffen alle, schwere Rüstung zieht an) und Schlamm (abseits der Straßen langsamer)?
   **Empfehlung:** genau diese zwei. „Sturmwind“ (Pfeile treiben ab) später, wenn Luftschiffe (V7) Wetter brauchen.
4. **Heilerlohn beim Angsthase-Erwachen:** 30 % des Golds und 12 Stunden?
   **Empfehlung:** ja. Es spürt sich wie eine Niederlage an, ohne den Spielstand zu brechen.
