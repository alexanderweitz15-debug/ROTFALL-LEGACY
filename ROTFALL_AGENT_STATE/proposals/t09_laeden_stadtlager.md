# T09 — Läden hängen am Stadtlager (V3 + V17d)

**Status:** WAITING_FOR_DEVELOPER · **Autor:** Feature Designer (Agent 3) · **Stand:** 01.10.2026
Kennzeichnung: **FAKT** = belegt (Datei:Zeile), **VORSCHLAG**, **ANNAHME**.

## 1. Name und Konzept
**„Was der Ort hat“** — Jeder Ladenartikel hängt an einer **Leitware** aus dem Stadtlager:
- Schwert → Waffenkisten
- Brot → Korn
- Messingarm → Magitech-Teile

Preis und Auswahl eines Ladens folgen dem Lager seiner Stadt. Der globale Zufallspreis `S.prices` fällt weg. Ereignisse, die heute „alles teurer“ machen, ziehen stattdessen Ware aus bestimmten Lagern.

## 2. Gelöstes Problem
- Drei Preissysteme laufen nebeneinander. Alle Nicht-Waren (Waffen, Rüstung, Brot, Bionik) kosten überall `ITEMS.value × S.prices`, einen **globalen** Zufallsfaktor. (FAKT `rawPrice`, `game.js:12178`; Zufallsschritt `dayTick` `:10684`)
- Die Auswahl der Läden ist Zufall aus einem Pool, unabhängig von der Stadt. (FAKT `shopStock` `:12183–12195`)
- Missernte verteuert alles ein wenig, aber nicht gezielt Brot. Die Meldung „Karawane überfallen“ ist nur ein Preisfaktor ohne Karawane. (FAKT `:9650`, `:9886`)

## 3. Warum es zu ROTFALL passt
Die Simulation steht schon: Arbeiter, Betriebe, Lager, Händlerzüge, Krieg, der `arms` verbraucht (FAKT `economy.js:96`: Soldaten und Kasernen). Am Ladentisch kommt davon nichts an. T09 baut kein neues System, es schließt das vorhandene an die Stelle an, die der Spieler sieht. Damit fühlt sich die Welt reaktiv an.

## 4. Heutiges System (FAKT)
| Teil | Ort | Was es tut |
|---|---|---|
| `ecoPrice(town, g, buy)` | `economy.js:125–132` | Faktor `target/(stock+1)`, begrenzt auf 0,4–3. Aurelion ×1,15, Besatzung beim Kauf ×1,5, `S.after.pmul[g]`/`tmul[town]`, Kauf ×1,12, Verkauf ×0,88 |
| Waren-Laden | `rawPrice` `game.js:12173–12177` | Waren (`good:true`) über `SIM.townPrice` |
| Andere Gegenstände | `game.js:12178–12181` | `value × S.prices × Seltenheit × afterItemMul × Handel × repPrice` |
| Kauf ≠ Gewinn | `price()` `:12167–12171` | Verkauf ≤ Kauf − 1 |
| Ladenbestand | `shopStock` `:12183–12195` | 7 Zufallsartikel/Tag aus `npc.pool`, Waren aus `town.stock` für Marktberufe |
| Kauf/Verkauf | `buy` `:12196`, `sell` `:12215` | Waren ziehen 1 aus dem Lager bzw. legen 1 dazu; Nicht-Waren berühren das Lager nicht |
| Stadt eines NPC | `ecoTown` `:12226` → `townKeyOf` `economy.js:51` | Heimatort oder nächster Ort; außerhalb der Welt `null` |
| Händlerzüge | `caravanDay` `economy.js:287–316` | echte Überfälle mit Log (`:291–293`) |
| Laden-UI | `tradeUI` `ui.js:991–1012` | Info-Feld rechts (`trade-info`) |
| HUD-Status „Preise“ | `game.js:10783` | liest `S.prices` |

**Alle 17 Schreibstellen von `S.prices` (FAKT, grep):**
| Zeile | Funktion | Heute |
|---|---|---|
| 6646 | `rulerSlain` | Kaiserin tot ×1,3 |
| 6731 | `ignoredContract` | Jagd liegen gelassen ×1,01 |
| 8492 | `twinFallCheck` | Unruhe ×1,05 |
| 9122 | `applyLaw` slavery | abolish ×1,05 |
| 9125 | `applyLaw` toll | ×0,92/×1,08 |
| 9650 | `evFailedHarvest` | ×1,06 |
| 9765 | `strikeOff` | ×1,06 |
| 9874 | `bigChoices` | ×1,03 |
| 9886, 9888, 9890 | `EVENTS` | Karawane ×1,05, Flüchtlinge ×1,08, Ader ×0,96 |
| 10201, 10208 | `aurelSplit`, `splitDay` | ×1,1, ×1,01 |
| 10558, 10569, 10577 | `factionAgenda` | Valen ×1,03, Kaufleute ×0,95, Aurelion ×1,02 |
| 10684 | `dayTick` | Zufallsschritt mit `rnd()` |

**Nebenbefunde (FAKT):**
- `S.after.tmul` wird bei `:10185` komplett geleert (`A.tmul = {}`), sobald kein Fall Aurelions läuft. Zölle dürfen dort also **nicht** abgelegt werden (Abweichung von TASKS: „Zölle → `S.after.tmul`“).
- `riskOf` liest `S.laws?.toll` (`economy.js:284`), aber `applyLaw` löscht `S.laws.toll` sofort wieder (`game.js:9126`). Das Zollgesetz senkt das Überfallrisiko also nie. Kandidat für BUG_DATABASE.
- Die Probe bei `game.js:15611` prüft „Missernte hebt `S.prices`“. Sie muss mitgeändert werden.

## 5. Neues System (VORSCHLAG)

### 5.1 Leitware je Gegenstand: abgeleitet statt 300 Felder
`baseOf(key)` in game.js (oder data.js) berechnet die Leitware einmal und legt sie in einem Cache ab. Ein ausdrückliches `ITEMS[k].base` überschreibt die Regel; `base: null` heißt frei.

| Regel | Leitware |
|---|---|
| `slot` weapon/offhand | `arms` (mit `tool`-Feld, z. B. Spitzhacke: `tools`) |
| Rüstung (chest/head/legs/hands/feet), Rezept braucht `iron` | `arms` |
| Rüstung, Rezept braucht `pelt` | `pelt` |
| Rüstung, Rezept braucht `cloth` | `cloth` |
| Rüstung ohne Rezept | `armor ≥ 6` → `arms`, sonst `pelt` |
| `cloak` | `cloth` |
| `use:'food'` | Fleisch-Schlüssel → `meat`, sonst `grain` |
| `use:'prosthesis'` oder `bionicTier` | `magitech` |
| `bandage`, `strick` (T08) | `cloth` |
| Tränke, Kräuter, Talismane, Quest-Items | frei (kein Lagerbezug) |

Grundlage: das `RECIPES`-`need` (FAKT `data.js:1301 ff.`).

### 5.2 Preis
```
mul(town, b) = clamp( ecoPrice(town, b, true) / (ITEMS[b].value * 1.12), 0.7, 1.8 )
v = value × mul × Seltenheit × afterItemMul
```
`S.prices` fällt weg. `mul = 1` gilt, wenn es keine Stadt gibt (Tiefhall, Dungeons, Karak-Basar ohne `S.towns`-Eintrag, Schiffe) oder wenn die Ware frei ist. Damit wirken Aurelion ×1,15, Besatzung, Streik und Aufstand (`pmul`) automatisch auch auf Schwerter und Brot.

### 5.3 Auswahl
`shopStock` würfelt weiter 7 Plätze aus `npc.pool`, aber gewichtet:
- Gewicht eines Kandidaten = clamp(`stock[b] / target(t, b)`, 0, 1,5).
- Bei `stock[b] < 1` fällt er weg.
- **Mindestbestand:** Mindestens 2 Plätze kommen immer aus dem Pool (die billigsten Artikel), damit kein Laden leer ist.
- Waffenzahl höchstens `floor(stock.arms / 2)` (V3).

### 5.4 Kauf und Verkauf
- Kauf eines Nicht-Waren-Artikels: `stock[b] −= 0,5`, dazu `t.bought[b] += 0,5`, damit `ecoDay` den Verbrauch nicht doppelt zählt (FAKT `economy.js:267–270`; Muster schon in `game.js:1269`).
- Verkauf: Das Lager ändert sich nicht. Sonst entstünden Waffenkisten aus Beute.

### 5.5 Ereignisse statt Weltfaktor
Neuer Helfer `stockShock(towns, good, n, why)`: er zieht oder legt Ware, schreibt ein Log und einmal eine Chronikzeile. Abbildung:
- **Missernte:** `grain −50 %` in den getroffenen Dörfern, „Brot wird in X teurer“.
- **Valen ruft zu den Waffen:** `arms −4`, `grain −4` in Valen-Städten.
- **Flüchtlinge:** `grain −6` in Eren.
- **Neue Ader:** `ore +20` am Bergwerk.
- **Unruhe** (Zwillingsfall), **Aufstand**, **Spaltung:** `pmul` gibt es schon. Die zusätzlichen `S.prices`-Faktoren entfallen.
- **Ignorierte Jagd:** `meat −2` in der Stadt.
- **Kaufleute öffnen Speicher:** die Stadt mit der größten Not bekommt +6 der knappsten Ware.
- **Zölle Aurelion:** neues Feld `S.tollMul` (1–1,3, fehlt → 1). `ecoPrice` liest es nur für Aurelion-Städte. Es fällt um 1 % je Tag zurück. `applyLaw('toll')` setzt es auf ×0,92 bzw. ×1,08.
- **Kaiserin tot:** `S.tollMul = 1,3`.
- **`dayTick`:** Der Zufallsschritt entfällt.
- **`EVENTS` „Karawane überfallen“:** gestrichen (V17d). `caravanDay` meldet echte Überfälle schon.

### 5.6 Alter Stand
`continueGame` macht `delete S.prices`, das ist billige Migration. Der HUD-Status „Preise“ (`:10783`) wird zu „Teuerung hier“: Er zeigt die Leitwaren der aktuellen Stadt mit `mul ≥ 1,25`.

### 5.7 Hinweis im Laden
`A.priceNote(key, npc)` liefert ab `mul ≥ 1,25` „Teuer: Waffen knapp in Nordfurt“ und bei `mul ≤ 0,85` „Günstig: Werkzeug reichlich in Tickmar“. Anzeige im Info-Feld (`ui.js:1006`) und als kleines ▲/▼ an der Preiszahl.

## 6. Spielererlebnis
In Nordfurt an der Front kostet ein Langschwert 160 statt 120, und der Schmied hat nur zwei Klingen. In Tickmar ist Werkzeug billig. Nach der Missernte kostet Brot in Eren das Doppelte. Ein überfallener Barrenzug macht eine Woche später Schwerter teuer. Wer liest, wo es knapp ist, verdient beim Liefern (eigener Wagen, Lieferaufträge).

## 7. Entscheidungen des Spielers
- Wo kaufe ich meine Rüstung: hier teuer, oder drei Tage Reise?
- Liefere ich Barren an eine knappe Schmiede (`ordersDay`, eigener Wagen)? Dann füllt sich der Laden wieder.
- Schütze ich einen Handelszug, damit die eigene Lieblingsstadt versorgt bleibt?
- Breche ich ein Zollgesetz in Aurelion (Rat, `applyLaw`), um billiger einzukaufen?

## 8. Querwirkungen
- **NPCs:** Händler sagen beim Begrüßen „Waffen sind knapp, der Krieg frisst alles“ (eine Zeile in `contextLines`, ab `mul ≥ 1,4`).
- **Fraktionen:** Kriege und Besatzung (`occupied`) verteuern. Aurelions Zölle werden ein sichtbarer Hebel.
- **Wirtschaft:** schließt den Kreis Betrieb → Lager → Laden. Der Spielerkauf ist eine echte (kleine) Nachfrage.
- **Kampf:** Ausrüstung wird regional knapp und damit wertvoller. Reparatur und Beute gewinnen an Bedeutung.
- **Erkundung:** Preisunterschiede sind ein Grund zu reisen. `S.priceSeen` (FAKT `notePrices`) zeigt schon Vergleichswerte.

## 9. Emergenz
- Ein Untotenheer belagert Nordfurt: Soldaten verbrauchen `arms`, Schwerter werden teuer. Der Spieler liefert Waffenkisten aus Tickmar, die Front hält länger (T02).
- Ein Streik in Tickmar (Aufstand §5c, `pmul.magitech`) verteuert Prothesen-Wartung **und** Messingarme im Laden.
- Eine Bande auf der Straße (T12) unterbricht Züge, der Brotpreis im Dorf steigt, Flüchtlinge wandern ab.

## 10. Risiken
- **Balance:** Starter-Ausrüstung darf nicht unbezahlbar werden. Abhilfe: Deckel 1,8, Mindestbestand 2, freie Tränke. Mit `BALANCE_GUIDE` gegenprüfen.
- **Zufall in Proben:** Der `rnd()` in `dayTick` fällt weg, dadurch verschiebt sich die Zufallsfolge in game.js. Andere Proben können kippen. Zwischenwerte loggen. world.js ist nicht betroffen.
- **Leistung:** `shopStock` ruft `ecoPrice` je Kandidat einmal am Tag. Vernachlässigbar.
- **Koop:** Der Gast sieht Preise, die der Host berechnet. **ANNAHME:** Das Handelsmenü des Gasts läuft über `uiHooks` auf dem Host; `S.towns` wird beim Beitritt mitgegeben (`continueGame(given)`). Der Hunter prüft das.

## 11. Alternativen
- (a) `ITEMS.*.base` von Hand in ~150 Einträgen (TASKS-Wortlaut). Genauer, aber Pflegelast und Diff-Rauschen in data.js. Empfohlen ist die Ableitung plus Überschreiben.
- (b) Nur den Preis ändern, die Auswahl bleibt Zufall. Halber Effekt: ein Schmied ohne Barren verkauft weiter Schwerter.
- (c) `S.prices` als sanften Regionalfaktor behalten. Das hält das dritte Preissystem am Leben (Bloat).

## 12. Abhängigkeiten
- T04 (laut TASKS: eigener Effekt-Zufall).
- Grundlage für T12, T23, T25, T27, T34, T36, T39 (sie alle lesen die Stadtpreise).
- `strick` aus T08 hängt hier an `cloth`.

## 13. Aufwand
Mittel: ungefähr 90–130 Zeilen. 17 Schreibstellen werden ersetzt, 1 Probe angepasst, ein Zusatz in ui.js.

## 14. Mögliche Exploits und Gegenmittel
| Exploit | Gegenmittel |
|---|---|
| Kaufen und sofort verkaufen mit Gewinn | `price()`-Regel Verkauf ≤ Kauf − 1 bleibt. Ein Kauf senkt `stock` um 0,5 und hebt den Faktor höchstens ×1,5 < Spanne 1,35/0,7 ≈ 1,9 |
| Laden leerkaufen, um den Preis woanders zu drücken | wirkt nur lokal; Händlerzüge füllen nach |
| Beute in den Laden verkaufen, um das Lager aufzufüllen | Verkauf ändert das Lager nicht |
| Zollgesetz hoch/runter-Spam | `applyLaw` ist ohnehin begrenzt (Rat); `S.tollMul` hat einen Deckel bei 1,3 und sinkt täglich |

## 15. Daten- und Codeplan
- **data.js:** optionale Überschreibungen `base` (nur wo die Ableitung falsch ist, erwartet unter 10). Grundlage ist `RECIPES`.
- **economy.js:** `ecoPrice` × `(isAurel && S.tollMul) || 1`; Export `baseMul(town, b)`.
- **game.js:**
  - `baseOf(key)`, `stockShock(...)`, `priceNote(key, npc)`
  - `rawPrice` (Zweig für Nicht-Waren), `shopStock` (Gewichtung, Mindestbestand), `buy` (−0,5 Leitware)
  - die 17 Schreibstellen
  - `dayTick` (Schritt raus, `tollMul`-Rückfall)
  - `EVENTS`-Eintrag gestrichen
  - `continueGame` (`delete S.prices`)
  - HUD-Status `:10783`
  - `contextLines` (Händlerzeile)
- **ui.js:** `priceNote` im Info-Feld, ▲/▼ an der Preiszahl.
- **Neue Speicherfelder:** `S.tollMul` (optional, fehlt → 1). `S.prices` wird entfernt.
- **Debug** (Abschnitt „Wirtschaft“):
  - „Waffen hier auf 0“
  - „Waffen hier auf voll“
  - „Missernte jetzt“
  - „Leitwaren dieser Stadt anzeigen“ (Toast mit allen `mul`)
- **Hinweise im Spiel:**
  - Ladentooltip
  - ▲/▼
  - Händlerzeile
  - HUD-Status
  - Logzeilen der `stockShock`-Ereignisse
  - Eintrag `docs/MECHANIKEN.md` („Preise folgen dem Lager der Stadt“)
- **Selftest-Proben:**
  1. `stock.arms = 0` vs. voll → `price('longsword', true, smith)` teurer.
  2. Kaufen, sofort verkaufen → kein Gewinn (auch bei `stock.arms = 0,6`).
  3. Händler ohne Stadt (`map:'__a'`) → `mul = 1`, kein Fehler.
  4. Besetzte Stadt → Kauf teurer als frei.
  5. `shopStock` mit `stock.arms = 0` → keine Waffe, trotzdem ≥ 2 Artikel.
  6. Missernte → `grain` in den Zieldörfern halbiert, `S.prices` unberührt bzw. nicht vorhanden (ersetzt Probe `:15611`).
  7. Alter Stand mit `S.prices = 1,4` → nach `continueGame` gelöscht, Preise wie ohne.
  8. `baseOf`: Langschwert→arms, Spitzhacke→tools, Brot→grain, aurelarm→magitech, potion→frei.

## 16. Scheiben
1. **S1 Preis:** `baseOf`, `rawPrice`, `ecoPrice`+`tollMul`, Migration, Proben 1–4, 7, 8. Sofort sichtbar und für sich spielbar.
2. **S2 Auswahl:** `shopStock`-Gewichtung, Kauf zieht Leitware, Probe 5.
3. **S3 Ereignisse:** 17 Schreibstellen → `stockShock`/`tollMul`, `EVENTS`-Streichung (V17d), `dayTick`, Probe 6, Zufallsfolge prüfen.
4. **S4 Lesbarkeit:** `priceNote`, ▲/▼, Händlerzeile, HUD-Status, MECHANIKEN.

## 17. Fragen an den Entwickler (höchstens 3)
1. **Wie stark dürfen Preise schwanken?**
   - (A, empfohlen) 0,7–1,8 wie in V3.
   - (B) Milder, 0,85–1,4. Ruhiger, aber Reisen lohnt weniger.
   - (C) Härter, 0,5–2,5 (Kenshi-artig).
2. **Leitware je Gegenstand:**
   - (A, empfohlen) Automatisch ableiten (Waffenart, Rezept, Slot), nur Ausnahmen von Hand.
   - (B) Jedes Item bekommt ein festes Feld `base` in data.js.
3. **Was passiert mit dem alten Feld `S.prices` in Spielständen?**
   - (A, empfohlen) Beim Laden löschen; die Preise kommen ab dann aus den Städten.
   - (B) Behalten und langsam (2 % je Tag) auf 1 zurückfallen lassen.
