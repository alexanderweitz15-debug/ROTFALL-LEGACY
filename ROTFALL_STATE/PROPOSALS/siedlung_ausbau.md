# Siedlung als System — Moral, Überfälle mit Ursache, Heilerhütte, schutzlose Siedlung (Designer, 01.10.2026)

Status: PROPOSED. Scout-Runde 6, vom Entwickler gewählt: Ideen 2, 6, 1 und 9. Kein Code.
Zeilenangaben gelten für den Stand vom 01.10.; maßgeblich ist der Funktionsname.

---

## 0. Systemprüfung (FAKT, per grep)

| Was | Stelle | Befund |
|---|---|---|
| `S.settlement` | `foundCamp` `game.js:9806` | `{ name, x, y, map, buildings, morale: 60, priorities[6], history }`; `herd`, `farmStock`, `raidAt` und `zoneWarned` kommen später dazu |
| Moral **schreiben** | `:10001` (+0,2 je Stunde mit Brunnen), `:10900` (+1 je Siedler mit „Ruhe“) | Moral **sinkt nie** und hat **keine Folge** |
| Moral **lesen** | `ui.js:921` (`· Moral 60` als Zahl im Siedlungsfenster) | Die Scout-Annahme „keine Lesestelle“ stimmt nicht ganz: Die Zahl wird angezeigt, ist aber ohne Ursache und ohne Wirkung |
| Überfall ansagen | `:10006`: jede Nacht um 2 Uhr `chance(0.4)` → `raidAt = clock() + 60`, Wachturm warnt | jede zweite bis dritte Nacht, **ohne Ursache** |
| Überfall | `raidSettlement` `:10922`: `n = ri(2, 4 + Tag/20)`, Typ `bandit` 60 % / `skeleton` 40 %, Anmarsch aus 24 Feldern | weder Wohlstand noch Lage noch Fraktion zählen. Die Raute (`facPip`, `render.js:878`, `PIP_FAC :877`) erscheint bei `bandit`/`undead` schon automatisch |
| Siedler | `settlersHour` `:10877` (kommen, wenn Dach und Nahrung da sind, 50 %/Stunde, höchstens 12), `settlerJob` `:10888`, `settlersDay` `:10894` | Die erste Priorität „Verwundete versorgen“ ist **wirkungslos**: `settlerJob` schickt sie nur ans Lagerfeuer |
| Bauten | `BUILDINGS` `data.js:1073` (13), `BUILD_USE` `game.js:10851` (7 Nutzungen) | kein Pflegebau; Lagerfeuer: 1 h, +15 % LP |
| Heilen | `isHealer` `:11291`, `healerTreat` `:11294` (Gold nach Schaden), `woundCare` `:11283` (25 Gold: schienen + Infektion), Fleckfieber `:10842` (40 Gold) | nur über NPC-Dialog |
| Kräuter | `herb` ist ein **Inventargegenstand** (`addItem(p,'herb')` `:5021`); `S.res.herb` bleibt praktisch 0 | Kosten der Hütte deshalb ohne `herb` (`costStr` kennt nur Holz, Stein, Eisen, `ui.js:948`) |
| Stadt ohne Schutz | `game.js:8366–8447` | nur für `TOWN_PLAN`-Städte |
| Fraktionsfeinde | `FOE_FAC` `:3219`, `foeFacs` | gilt für alle Gegner, auch im Lager |
| Banden | `bandsOf`/`bandFound`/`bandTick`/`bandKill` `:11199–11260`, Schutzgeld `bandChoices` | kennen die Siedlung nicht |
| Kette | `captureInstead` `:6404`: Kettenleute verschleppen statt zu töten | — |
| Dodon | `S.flags.dodonHome` `:8653` | wacht über das Dorf; heute nur Text |

**Gemeinsame Lücke:** Die Siedlung hat einen Zustand, aber keine Rückkopplung. Die vier Ideen bauen diese Rückkopplung **in einer Reihenfolge**:
- Moral (M1) ist die Anzeige und der Hebel.
- Überfälle (M2) liefern die Ursache.
- Die Heilerhütte (M3) ist die Antwort.
- Schutzlos (M4) ist das Scheitern.

---

## 1. Kern
> Was du hortest, lockt an, wer in der Nähe ist. Wer kommt, trägt sein Zeichen. Wen du pflegst, bleibt. Wen du verlierst, dem folgen andere — und ohne dich kommt kein Ersatz.

---

## M1 — Moral sichtbar und wirksam (klein)

### Neue Regel: `moraleAdd(v, why)`
- klemmt auf 0–100
- schreibt `st.moraleLog.unshift({ d: S.day | 0, why, v })` und kürzt die Liste auf 8 Einträge
- schreibt einen Log-Eintrag nur bei |v| ≥ 5

### Ursachen (alle einmal am Tag in `settlersDay`, außer Ereignisse)

| Ursache | Wert | Ersetzt / neu |
|---|---|---|
| Brunnen steht | +2/Tag | **ersetzt** +0,2/Stunde (`:10001`, ergibt heute +4,8/Tag und füllt 100 in 9 Tagen) |
| Siedler auf „Ruhe“ | +1 je Siedler, höchstens +4 | Deckel neu (`:10900`) |
| Anführer anwesend (Spieler zum Tageswechsel unter 30 Feldern vom Lager) | +1 | neu |
| Hunger (`S.res.food < 1` nach dem Essen) | −6 | neu |
| Überbelegt (mehr Siedler als `settlerCap`) | −3 | neu |
| Ohne Ereignis | 1 Punkt Richtung 50 | neu (Moral driftet) |
| Überfall abgewehrt, kein Siedler tot | +6 | Ereignis (M2) |
| Siedler getötet | −4 je Toten, höchstens −16 je Überfall | Ereignis (Haken in `die`) |
| Lager geplündert | −10 | Ereignis (M2/M4) |
| Schutzlos | −15 einmalig | Ereignis (M4) |
| Heilerhütte hat gepflegt | +1/Tag | M3 |

### Stufen und Wirkung (`moraleBand(st)`)

| Moral | Name | Ertrag (`settlersDay`) | Zuzug (`settlersHour`) | Sonst |
|---|---|---|---|---|
| ≥ 70 | Zuversichtlich | ×1,25 | 70 % je Stunde | Gruß aus der Zuversicht-Liste |
| 40–69 | Ruhig | ×1 | 50 % (wie heute) | — |
| 20–39 | Mürrisch | ×0,75 | 30 % | Murr-Gruß |
| < 20 | Verzweifelt | ×0,5 | keiner | Täglich 30 %: Ein Siedler geht (Log „X verlässt {Lager}: Hier ist keine Hoffnung.“). Gehen zählt **nicht** als Verlust für M4. |

Gerechnet wird mit Abrunden: Holz, Nahrung und Stein jeweils `floor(x × mul)`.

### Anzeige
- **Siedlungsfenster** (`settleUI`, `ui.js:921`): Die Zahl wird zu einem Balken (Breite 100, Farbe nach Stufe wie der LP-Balken). Daneben der Name der Stufe, darunter die letzten 3 Ursachen aus `moraleLog`, etwa „−6 Hunger (Tag 41) · +2 Brunnen · +6 Überfall abgewehrt“.
- Unter dem Balken eine Zeile zur Wirkung, z. B. „Mürrisch: Ertrag −25 %, weniger Zuzug.“
- **Kopfleiste:** Kein Dauerelement. Erst bei „Verzweifelt“ oder M4-Stufe ≥ 1 erscheint ein Warnsymbol am Reiter „Siedlung“ (Symbol mit Text „Lager“, im Stil der neuen 8-Gruppen-Leiste). Dazu einmal ein Toast `MORAL IN {LAGER} BRICHT`.
- **Siedler-Gruß:** Er wird beim Ansprechen nach Stufe gewählt, je 2 Zeilen pro Stufe. Beispiel „Mürrisch“: „Arbeit, Arbeit. Und wofür? Damit die Nächsten es holen.“

### Spielstand
- `st.moraleLog` (Liste, fehlt → `[]`) wird in `continueGame` angelegt: `S.settlement && (S.settlement.moraleLog ||= [])`.
- `morale` gibt es schon.
- Alte Stände mit Moral 100 (durch den Brunnen) driften 1 Punkt pro Tag auf 50. Das ist gewollt und braucht keine Migration.

### Debug, Hinweis, Probe
- **Debug:** „Siedlung: Moral −20 / +20“ (mit `why: 'Debug'`).
- **Hinweis:** Siedlungsfenster (Balken mit Ursachen); Log beim Stufenwechsel („Die Stimmung in {Lager} kippt: mürrisch.“).
- **Probe M1:** Probehof mit 3 Siedlern, `S.res.food = 0` → `settlersDay` → Moral −6 und `moraleLog[0].why === 'Hunger'`. Danach Moral 15 → Holz-Ertrag halbiert gegenüber Moral 50 (gleiche Siedler, gleiche Aufgabe).

---

## M2 — Überfälle mit Ursache und Zeichen (klein bis mittel)

### Reichtum der Siedlung `campWealth(st)` (eigene Zahl, **nicht** der Stadt-Wohlstand `growthOf`, also keine doppelte Formel mit T23)
```
W = 4 × fertige Bauten (ohne Palisade/Wohnzone)
  + 3 × lebende Siedler
  + 2 × Nutztiere (herd.cow + herd.sheep)
  + floor((wood + stone + 2×iron + food) / 25)
```
Beispiele:

| Phase | Zusammensetzung | W |
|---|---|---|
| Frühes Lager | Feuer, Zelt, 20 Holz | 9 |
| Mittel | 8 Bauten, 6 Siedler, 4 Tiere, 300 Vorrat | 32 + 18 + 8 + 12 = 70 |
| Spät | 14 Bauten, 12 Siedler, 6 Tiere, 800 Vorrat | 56 + 36 + 12 + 32 = 136 |

### Quellen `raidSources(st)` (jede mit Gewicht; die Entfernung ist in Feldern vom Lager gemessen)

| Quelle | Bedingung | Gewicht | Angreifer | Zeichen |
|---|---|---|---|---|
| **Bande** | aktive Bande höchstens 120 Felder entfernt **und nicht bezahlt** (`b.paid < day`) | 3 + Mann/2 | `bandit`/`bandit_archer`/`bandit_spear` mit `bandId`, **aus der Bande genommen**: `n ≤ b.men`, Tote senken `b.men` über `bandKill` | Bandit-Raute; Log nennt Bande und Anführer |
| **Tote** | Ein Kriegsknoten der Toten **oder** ein `heldBy`-Ort liegt höchstens 150 Felder entfernt | 4 | `SIM.undeadMix(n, 'village')` | Untoten-Raute |
| **Kette** | `!chainsBroken`, das nächste Tributdorf liegt höchstens 160 Felder entfernt, Kette-Ruf < 0 | 2 | `chainhunter`/`kettenschuetze` | Ketten-Raute. Sie töten nicht, sondern **verschleppen** bis zu 2 Siedler (Muster `captureInstead`) |
| **Goblins** | Grubenhort höchstens 140 Felder entfernt, `!goblinsFreed`, Goblin-Ruf < 0 | 2 | `goblin`/`goblin_warrior` | Goblin-Raute |
| **Wilde Tiere** | immer (Rückfall) | 1 | 2–3 `wolf` | keine Raute (Tiere sind keine Macht) |

### Häufigkeit und Größe
Ersetzt `:10006`. Weiter gilt: einmal pro Nacht um 2 Uhr, dann `raidAt = clock() + 60`.
- **Chance pro Nacht:**
  - mit einer echten Quelle (ohne Tiere): `min(0,45, 0,06 + W/300)` (früh ≈ 9 %, mittel ≈ 29 %, spät 45 %)
  - nur Tiere: 6 %
  - Schutzlos (M4): ×1,5
- **Größe:** `n = clamp(2 + floor(W/15), 2, 9)`, Angsthase −1 (mindestens 2), Sehr schwer +1. Bei einer Bande höchstens `b.men`.
- Die Quelle wird nach Gewicht ausgelost (`pick` mit Gewicht). **Eine Quelle pro Überfall.** Scout-Idee 3 (zwei Mächte zugleich) ist nicht gewählt und bleibt draußen.
- **Bande bezahlt:** Wer der Bande Schutzgeld zahlt, ist vor ihr sicher. Das passt zum Entscheid zu T12 („Schutzgeld deckt den eigenen Wagen“): Das Schutzgeld deckt jetzt auch das Lager.

### Sichtbar machen (Zeichen und Ursache)
- **Ansage:** Der Wachturm (wie heute eine Stunde vorher) meldet **wer**, etwa „Der Wachturm meldet Fackeln am Waldrand — Männer der Krähenfuß-Bande (5).“ Ohne Wachturm gibt es nur „Feinde nähern sich!“ und erst beim Eintreffen den Namen.
- **Grund im Log**, einmal je Überfall: „Dein Vorrat hat sich herumgesprochen (Reichtum 70).“ Bei W < 20: „Sie suchen leichte Beute.“
- **Siedlungsfenster:** neuer Block „Bedrohung“. Er listet die aktiven Quellen mit Rautenfarbe (`FACTIONS[f].colors[1]`, als kleines CSS-Rautenelement) und Entfernung, z. B. „◆ Krähenfuß-Bande — 60 Felder, 5 Mann · ◆ Die Toten (Aschfurt) — 140 Felder“. Darunter: „Überfallgefahr je Nacht: 29 %.“
- **Wachturm benutzen** (`useBuilding`): nennt die stärkste Quelle und die Gefahr.
- Die Raute über den Angreifern zeigt `facPip` schon an. Neu ist nur das Feld `e.campRaid = true`, und damit ist die Raute **immer** sichtbar (auch bei voller LP). Der Spieler erkennt so, wen er sich zum Feind gemacht hat.

### Ausgang des Überfalls
- **Spieler auf derselben Karte:** Die Angreifer handeln (`actorsOf` regelt alles). Neu ist die Plünderprüfung:
  - 10 Spielminuten nach Ankunft leben noch Angreifer.
  - Im Umkreis von 400 px um das Lagerfeuer steht kein Siedler, keine Lagerwache (M4), nicht Dodon und nicht der Spieler.
  - Dann gilt `campPlunder()`, und die Angreifer ziehen ab.
- **Spieler auf einer anderen Karte** (Gewölbe, Insel …): abstrakt über `campRaidAbstract()`.
  - Verteidigung: `D = Siedler × 1 + Lagerwachen × 3 + Dodon × 6 + min(4, Palisaden × 0,3) + Tor 1 + Wachturm 2`
  - Angriff: `A = n × Faktor`; Faktor Bande 1,5, Tote 1,5, Kette 2, Goblins 1, Wölfe 0,8
  - Wurf: `D × (0,8 + rnd()×0,4) ≥ A` → abgewehrt. Es sterben `floor(A / D)` Siedler, höchstens 2; die Kette verschleppt stattdessen. Moral +6, wenn niemand stirbt.
  - Sonst `campPlunder()`, und es sterben bzw. werden verschleppt 1–2 Siedler.
- **`campPlunder()`:**
  - Holz, Stein, Eisen und Nahrung je −30 %, `farmStock` geleert.
  - Ein fertiger Bau (keine Palisade) `cond −0,4` (mindestens 0,2).
  - Moral −10.
  - Ortsgedächtnis „{Quelle} plündert {Lager}“.
  - Ist die Quelle eine Bande: `b.men +1` (die Beute nährt sie). Mit T12 kommt stattdessen `loot +3` dazu.
- **Abgewehrt** (alle Angreifer tot oder geflohen): Moral +6, wenn kein Siedler starb. Ruf: Eine getötete Bande zählt wie heute über `bandKill`. Wird ein Überfall der Toten abgewehrt, gibt es beim Herrn des nächsten Valen-Orts +2.
- **Ortsgedächtnis:** statt „Überfall abgewehrt oder erlitten“ ein ehrlicher Eintrag mit Quelle und Ausgang.

### Spielstand
Neu ist nur `st.raid = { src, f, n, bandId? }` während eines laufenden Überfalls. Fehlt es, läuft der Überfall nach dem alten Muster, sodass ein alter Stand mit gesetztem `raidAt` und ohne `raid` einfach weiterläuft. Die Angreifer sind `transient`; `st.raid` wird nach dem Ausgang gelöscht.

### Debug, Hinweis, Probe
- **Debug:**
  - „Siedlung: Überfall jetzt (Quelle: Bande / Tote / Kette / Goblins / Tiere)“
  - „Siedlung: Reichtum und Quellen anzeigen“ (Toast mit W, Quellen und Chance)
  - „Siedlung: Überfall abstrakt auswürfeln“
- **Hinweis:** Wachturm-Text, Bedrohungsblock, Grund im Log, Kodex-Eintrag „Überfälle auf das Lager“.
- **Probe M2a „Ursache“:** Probehof mit W ≈ 9 → `raidChance` < 0,12. Mit W = 136 → 0,45. Ohne jede Quelle → nur Tiere.
- **Probe M2b „Bande stellt ihre Männer“:** Bande mit 3 Mann, 60 Felder entfernt, W = 136 → `n === 3`, alle Angreifer tragen `bandId`. Mit `b.paid = day` → die Bande ist keine Quelle.
- **Probe M2c „abstrakt“:** Spieler auf `deep`, 6 Siedler und 2 Lagerwachen gegen 3 Wölfe → abgewehrt, Moral steigt. 0 Siedler gegen 6 Banditen → geplündert, Holz −30 %.

---

## M3 — Heilerhütte (klein)

### Daten (`data.js`, `BUILDINGS`)
```
healer: { name:'Heilerhütte', cat:'Versorgung', cost:{wood:18,stone:6}, time:16, w:2, h:2,
          desc:'Pflege mit Kräutern: schient Brüche, brennt Wunden aus, senkt Fieber. Verwundete Siedler stehen schneller wieder auf.', pop:0 }
```
- `BUILD_USE.healer = 'Pflegen'`.
- `solid` wie bei `hut` (Liste in `placeBuilding` `:9832`).
- Sprite: `buildings.js` braucht eine kleine Hütte mit Kräuterbündeln an der Traufe (Artist, Stil wie `hut`, 2×2).

### Benutzen (`useBuilding`)
- **Gesperrt:**
  - Feinde in der Nähe (`foesNear`), wie beim Lagerfeuer.
  - Kein Kraut im Gepäck oder Lager: Toast „Ohne Kräuter ist das nur ein Dach.“
- **Wer:** der Spieler und Gefährten im Umkreis von 300 px, die lebendig und **nicht** niedergeschlagen sind (Entscheid „Downed“: kein Sofortaufrichten). Liegt jemand am Boden, sagt ein Toast „{Name} muss erst aufgerichtet werden.“
- **Kosten:** 1 `herb` je Person mit Befund, Fleckfieber +2 `herb`. Bezahlt wird aus dem Inventar des Spielers (`removeItem`).
- **Zeit:** `passTime(120)` (2 Stunden; das Feuer braucht 1).
- **Wirkung je Person:**
  - +35 % max. LP (das Feuer gibt 15 %)
  - alle Brüche geschient (`splint`, heilen doppelt so schnell), wie `woundCare`
  - `infektion` und `bleeding` entfernt
  - `plague` geheilt, aber nur mit Siedler-Heilerin (unten); sonst Toast „Fleckfieber braucht kundige Hände.“
- **Log:** „Zwei Stunden in der Heilerhütte. Brüche geschient, Wunden sauber (3 Kräuter).“

### Passive Wirkung (der eigentliche Mehrwert gegenüber dem Rasten)
- **Priorität „Verwundete versorgen“ bekommt endlich eine Wirkung:**
  - `settlerJob` schickt Siedler mit dieser obersten Priorität zur Hütte, falls es eine gibt.
  - Diese Siedler gelten als **Pfleger**; der erste von ihnen bekommt den Beruf „Heilerin“ bzw. „Heiler“ (`prof`).
  - Damit gilt `isHealer` für ihn (`:11291` prüft `prof === 'Heilerin'`). Für die männliche Form wird die Zeile um `'Heiler'` ergänzt.
  - Folge: Gegen Gold gibt es dieselben Dialogdienste wie in der Stadt (`healerTreat`, `woundCare`, Fieber). Das ist billig zu bauen, denn die Hooks gibt es schon.
- **Tageswechsel (`settlersDay`) mit Hütte und mindestens einem Pfleger:**
  - Verletzte Siedler bekommen volle LP und geschiente Brüche.
  - Niedergeschlagene Siedler im Umkreis von 400 px stehen mit doppelter Rate auf. `KO_RATE ×2` nur für `settler` in Hüttennähe (ANNAHME: die Rate liegt beim Aufstehen in `B`/`downTimer`, vor dem Bau prüfen).
  - Moral +1, wenn jemand gepflegt wurde.
- **Ohne Pfleger:** Die Hütte wirkt nur beim Benutzen.

### Abgrenzung (Gegenargument der Scout)
| | Lagerfeuer | Heilerhütte |
|---|---|---|
| Heilung | 15 % in 1 h | 35 % in 2 h |
| Kosten | gratis | Kraut |
| Brüche, Infektion | nein | ja |
| Siedler | wirkungslos | heilt passiv |
| Dienste | keine | Heiler-Dialog |

Die Hütte ersetzt den Stadtheiler nicht ganz:
- kein `healerTreat`-Sofortheilen ohne Gold
- Fleckfieber nur mit Pfleger
- Bionik-Wartung bleibt in Aurelion (Idee 11 ausdrücklich nicht dabei)

### Spielstand
- Kein neues Feld. Die Hütte ist ein normaler Bau in `st.buildings`, der Pfleger ein normaler Siedler mit `prof`.
- Alte Stände: Gibt es kein `healer`, ändert sich nichts.

### Debug, Hinweis, Probe
- **Debug:**
  - „Siedlung: Heilerhütte hier (fertig) + 5 Kräuter“
  - „Siedlung: alle Siedler verletzen“
- **Hinweis:**
  - Baubeschreibung
  - Toast bei „Pflegen“
  - erster Bau: Log „{Name} kümmert sich jetzt um die Verwundeten. Sprich mit ihr, wenn du Hilfe brauchst.“
  - Siedlungsfenster-Text unter „Arbeitsprioritäten“: „Verwundete versorgen: Mit Heilerhütte pflegen Siedler die Kranken.“
- **Probe M3a „Pflegen“:** Spieler mit gebrochenem linken Arm, Infektion, 50 % LP und 2 Kräutern → `useBuilding(healer)` → `splint`, keine Infektion, LP ≥ 85 %, 1 Kraut übrig. Ohne Kraut → keine Änderung.
- **Probe M3b „Pfleger“:** Hütte, Priorität „Verwundete versorgen“ oben, 2 Siedler, einer davon mit 30 % LP → `settlersDay` → volle LP, ein Siedler hat `isHealer === true`.

---

## M4 — Die Siedlung wird schutzlos (mittel, **nach** Stadt ohne Schutz S2)

Grundsatz der Scout: dieselbe Eskalation wie bei einer Stadt, aber **Ersatz kommt nur durch den Spieler**. Die Siedlung hat keinen Herrn, daher gibt es keinen Strafzug und kein Kopfgeld. Sie wird auch nicht übernommen (Frage 1).

### Soll und Verlust
- **Schützer:** lebende Siedler, Lagerwachen (neu, unten) und Dodon (`dodonHome`).
- **Soll:** `st.peak` = die höchste Zahl an Schützern.
  - Täglich gilt `peak = max(Schützer, peak − 1)`, wenn es keinen Verlust gab. Die Last vergisst also langsam.
- **Verlust:**
  - Haken in `die`: Stirbt ein `settler` oder eine `campGuard` (getötet oder verschleppt), gilt `st.lost++` und `st.lostAt = day`.
  - Weggang durch Moral oder Platzmangel zählt **nicht**.
- **Stufe** (nur wenn `peak ≥ 3`, damit kleine Lager kein Drama haben):

| Stufe | Bedingung | Name |
|---|---|---|
| 0 | `lost/peak` < 0,5 | Bewacht |
| 1 | ≥ 0,5 | Geschwächt |
| 2 | ≥ 0,8 **oder** keine Schützer mehr | Schutzlos |

### Stufe 2: Wirkung (einmal beim Eintritt `campAlarm()`, dann täglich)
- **Einmalig:**
  - Moral −15
  - Toast `{LAGER} IST SCHUTZLOS`
  - Ist der Spieler unter 60 Feldern entfernt: Glocke (`sfx 'bell'` einmal)
  - Ortsgedächtnis, Chronik `settle`
- **Arbeit ruht:** `settlersDay` bringt keinen Ertrag. `zoneBuild` baut nicht. Log einmal: „In {Lager} rührt keiner das Werkzeug an. Sie halten Wache — schlecht.“
- **Kein Zuzug:** `settlersHour` holt niemanden. Auch Abwanderer aus npc_eigene_ziele #38 nehmen das Angebot „In meiner Siedlung gibt es Arbeit“ nicht an: „Da, wo jeder stirbt? Nein.“
- **Flucht:** täglich 30 %, dass ein Siedler geht, außer die Moral ist ≥ 50. Das zählt nicht als Verlust.
- **Freiwild:** Die Überfallchance steigt ×1,5 (M2). Der nächste Überfall, der nicht abgewehrt wird, plündert (`campPlunder`).

### Ersatz nur durch den Spieler
1. **Lagerwache anwerben**
   - Wo: bei jedem Wirt (`tavernChoices`) und bei Verteidigungsmeistern.
   - Text: „Söldner für mein Lager (80 Gold).“
   - Am nächsten Morgen steht eine `campGuard` im Lager:
     - `guardChar('merch', …, 'Lagerwache', 5)`
     - **nicht** `transient`, `settler: false`, `campGuard: true`, Anker am Lagerfeuer
   - Grenze: höchstens `1 + floor(fertige Bauten / 4)`.
   - Sold: 5 Gold pro Tag aus `S.gold`. Ohne Gold geht die Wache (Log, kein Verlust).
   - Lagerwachen kämpfen bei Überfällen und zählen ×3 in der abstrakten Rechnung.
2. **Siedler zurückholen:** Mit einer Moral von mindestens 40 (durch Brunnen, Anwesenheit oder eine abgewehrte Nacht) kommen Siedler wieder, sobald Stufe 2 aufgehoben ist.
3. **Gefährten:** Ein Gefährte, den der Spieler im Lager **entlässt** (`dismiss`, das gibt es schon), zählt als Schützer. Der volle Lagerdienst bleibt Scout-Idee 7 und ist **nicht** Teil dieses Entwurfs.

- **Rechnung:** Jede neue Lagerwache und jeder neue Siedler senkt `lost` um 1. Bei `lost/peak < 0,8` und mindestens einem Schützer fällt die Stufe, und es gibt das Log „{Lager} fasst wieder Mut.“ mit Moral +5.

### Spielstand
| Feld | Fehlt? |
|---|---|
| `st.peak` | `continueGame`: `peak = aktuelle Schützer` |
| `st.lost`, `st.lostAt`, `st.stage` | 0 |
| `campGuard` an der Figur | normale gespeicherte Figur (wie Siedler) |
| Sold-Schulden | keine (zahlen oder gehen) |

### Debug, Hinweis, Probe
- **Debug:**
  - „Siedlung: Siedler töten bis schutzlos“
  - „Siedlung: Lagerwache sofort“
  - „Siedlung: Schutz-Status“
- **Hinweis:**
  - Alarm-Toast
  - Siedlungsfenster: rote Zeile „Schutzlos: Niemand arbeitet, Fremde meiden das Lager. Wirb in einer Schenke Lagerwachen an.“ Diese Zeile verrät den Ausweg.
  - Wirt-Option
  - Kodex
- **Probe M4a „Alarm“:** Probehof mit `peak = 5`, 4 Siedler per `die` → `stage === 2`, Moral −15 (zusätzlich zu −16 aus den Toten), `settlersDay` liefert 0 Holz.
- **Probe M4b „Ersatz“:** Danach 2 Lagerwachen anwerben → `lost` −2 → `stage < 2`. Sold: `S.gold = 0` → die Wache geht, `lost` unverändert.
- **Probe M4c „alter Stand“:** `S.settlement` ohne `peak`/`moraleLog`/`raid` → `applySave(saveData())` → kein Fehler.

---

## 2. Querwirkungen (mit Systemen)
1. **Banden (T12):**
   - Nahe Banden überfallen das Lager mit **ihren** Männern. Tote Angreifer schwächen die Bande, Plünderung nährt sie.
   - Schutzgeld schützt das Lager.
   - Mit T12 `loot` statt `men` (siehe §5).
2. **Krieg und Totenknoten (sim.js):** Gefallene Orte in der Nähe machen das Lager zum Ziel der Toten. Das gibt dem Spieler einen Grund, den Krieg zu beachten.
3. **Kette (Tribut):** Kettenleute verschleppen Siedler. Das ist eine Brücke zur bestehenden Gefangenen- und Sklavenlogik (`captureInstead`, T08 Gefangene).
4. **Verletzung und Körper (body.js):** Die Heilerhütte schient und reinigt, Pfleger nutzen die bestehenden Heiler-Hooks.
5. **Fieber (`S.big` Fleckfieber):** Das Lager wird mit Pfleger zur Anlaufstelle.
6. **Ruf:** Abgewehrte Totenüberfälle +2 beim nahen Valen-Herrn.
7. **Wirtschaft:** Lagerwachen kosten Sold; Plünderung frisst den Vorrat. Der Reichtum ist der Grund für Überfälle (eigene Formel, nicht T23).
8. **Stadt ohne Schutz:** M4 übernimmt Begriffe, Stufen und Glocke, aber ohne Herrn. Anzeige und Kodex teilen sich das Kapitel.

## 3. Risiken und Exploits

| Risiko | Gegenmittel |
|---|---|
| **Überfall-Flut** spät im Spiel (45 % pro Nacht) | Deckel 0,45; Schutzgeld; Banden haben nur ihre Männer. **Messen:** 30-Tage-Schleife mit dem späten Probehof, Ziel ≤ 12 Überfälle. |
| Reichtum klein halten (Vorrat im Gepäck statt im Lager) | Der Vorrat ist `S.res` und damit gemeinsam; es gibt kein getrenntes Gepäck. Nur Bauten und Siedler zählen ×3/×4. Gewollt ist: Wer groß baut, wird gesehen. |
| **Heil-Exploit:** Hütte statt Stadtheiler | kostet Kräuter und 2 h, nur im Lager, kein Sofortaufrichten, Fieber nur mit Pfleger. |
| **Lagerwachen als billige Söldner** | Sie folgen nie (Anker am Feuer); 5 Gold pro Tag; Deckel nach Bauten. |
| Moral-Absturz durch eine Pechsträhne | Drift Richtung 50; Flucht erst unter 20; Brunnen +2. |
| `peak` wird klein gespielt (Siedler wegschicken, um Stufe 2 zu meiden) | Weggang senkt `peak` nur um 1 pro Tag. |
| Zufall: neue `chance`/`pick` in Überfall und Flucht | Fremde Zufallsproben gegenprüfen; `world.js` bleibt unberührt. |
| Koop | nur der Wirt rechnet; Gäste sehen Toasts. |
| T23-Dopplung | `campWealth` ist ausdrücklich lagerintern; T23 modelliert keine Spielersiedlung. Bei einem späteren „Siedlung als Marktknoten“ (Runde 1) muss man zusammenführen. |

## 4. Einfachere Alternative
- **Nur M1 + M2-light:**
  - Moralbalken mit Ursachen und Wirkung.
  - `raidSettlement` wählt den Typ nach der nächsten Feindquelle statt 60/40; die Größe folgt `W`.
  - Ohne Bande-stellt-Männer, ohne Abstrakt-Kampf, ohne Plünderprüfung.
- **Heilerhütte nur als Benutzen** (ohne Pfleger und ohne passive Heilung).
- **M4 entfällt.** Stattdessen gibt es bei Moral < 20 Flucht. Die Moral übernimmt dann die Rolle von „schutzlos“.
- Aufwand etwa ein Drittel. Verloren geht der Zusammenhang „Verlust → Ersatz nur durch dich“.

## 5. Abstimmung (keine Dopplung)
- **T12:**
  - Bandenzahl, Deckel, Schutzgeld und Beute gehören T12. M2 liest nur `bandsOf()`, `b.paid` und `b.men`, nach T12 auch `b.loot`.
  - Die Lagerquelle zählt **nicht** als Strecken-Überfall (`riskOf`).
  - Das Lager ist kein T12-POI: `bandFound` darf nicht innerhalb von 25 Feldern um `S.settlement` gründen (eine Zeile im T12-POI-Filter, die dort ohnehin „nicht in einer Siedlung“ heißt).
- **npc_eigene_ziele #38:** Der Abwanderer zieht in die eigene Siedlung. M1/M4 geben die Bedingung vor (nicht bei Schutzlos, nicht bei Moral < 20). Deserteurbanden (#39) sind normale Quellen für M2.
- **Stadt ohne Schutz S2:** M4 baut auf denselben Begriffen auf, ist aber **getrennter** Code (`st.*`, nicht `S.schutz`), damit `schutzDay` die Siedlung nie anfasst.

## 6. Scheiben
| Scheibe | Inhalt | Größe | Abhängig |
|---|---|---|---|
| **M1** | Moral mit Ursachen, Wirkung und Anzeige | S | — |
| **M2** | Überfall mit Ursache, Zeichen, Bedrohungsblock, abstrakter Kampf, Plünderung | S–M | M1 (Moralwerte) |
| **M3** | Heilerhütte, Pfleger | S | M1; Artist für das Sprite |
| **M4** | Siedlung schutzlos, Lagerwachen | M | M1, M2, Stadt ohne Schutz S2 |

Jede Scheibe bringt mit: Eintrag in MECHANIKEN, CHANGELOG, Debug und Proben. Text für `docs/MECHANIKEN.md` (Abschnitt Siedlung), sinngemäß:

> **Moral** zeigt das Siedlungsfenster samt Ursachen; hoch bringt Ertrag und Zuzug, tief kostet beides, unter 20 laufen Leute weg.
> **Überfälle** haben einen Grund: dein Reichtum und wer in der Nähe ist — Banden (mit ihren eigenen Männern; Schutzgeld schützt
> auch das Lager), die Toten nahe gefallener Orte, die Kette (verschleppt Siedler), Goblins, sonst Wölfe. Die Raute über den
> Angreifern zeigt ihre Macht; der Wachturm sagt, wer kommt. **Heilerhütte:** zwei Stunden, ein Kraut je Kopf — schient, reinigt,
> heilt viel; mit einem Siedler auf „Verwundete versorgen“ pflegt sie täglich alle Siedler. **Schutzlos:** Stirbt der Großteil deiner
> Leute, ruht die Arbeit und niemand zieht zu — Ersatz kommt nur durch dich (Lagerwachen beim Wirt, 80 Gold, 5 Gold Sold am Tag).

## 7. Frage an den Entwickler (offen)
1. **Darf eine schutzlose Siedlung übernommen werden** (eine Bande setzt sich ins Lager wie in einer Stadt, S2)?
   - *Empfehlung:* **nein**, nur Plünderung.
   - Begründung: Die Siedlung ist das Erbe des Spielers. Ein Verlust des ganzen Lagers wäre härter als ein Heldentod und widerspricht dem Erbe-Gedanken. Plündern, Moral und Flucht treffen genug.
   - Falls ja: Übernahme nur auf Sehr schwer, Rückeroberung über `bandKill` wie in S2 §4.3.
