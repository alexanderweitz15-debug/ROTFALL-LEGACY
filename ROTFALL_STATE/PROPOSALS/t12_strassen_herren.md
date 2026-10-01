# T12 — „Straßen haben Herren“: Banden, Lager und Händlerzüge verbunden (V4)

**Status:** APPROVED (Audit-Wahl 01.10.) → hier umsetzungsreif. **Autor:** Designer (Opus) · **Stand:** 01.10.2026
Kennzeichnung: **FAKT** (Datei:Zeile), **VORSCHLAG**, **ANNAHME**. Aufgabentext: `docs/audit/TASKS.md` T12, Audit `docs/audit/TEIL_B_WELT.md` V4.

---

## 0. Kurze Systemprüfung (vor dem Entwurf)
| Befund | Beleg | Folge für T12 |
|---|---|---|
| `riskOf` kennt nur Untotenheere an den Endpunkten (+0,12), Karak (+0,05) und `S.laws.toll` (−0,02) | `economy.js:280–286` | Banden, Lager und Kriegsknoten fehlen |
| **`S.laws.toll` ist immer leer:** Das Zollthema ist ein Dauerthema und wird nach jeder Sitzung gelöscht | `game.js:9348` (`delete S.laws[topic]` für `legion`/`toll`) | RB-010 bestätigt: −0,02 greift nie. T12 ersetzt die Zeile (§5.1) |
| Überfälle würfeln mit `chance()` über den gespeicherten Zufall, nicht mit `Math.random` | `economy.js:290`, `347`; `state.js:90` | Audit-Punkt „Math.random ersetzen“ ist **schon erledigt**, nichts zu tun |
| Banden wachsen täglich zu 50 % ohne Beute („Reisende ausgeraubt“), niemandem fehlt etwas | `game.js:11048` | wird durch Beute ersetzt |
| Bandenlager entstehen an Zufallspunkten 30–50 Felder um eine Stadt | `bandFound` `game.js:11030–11042` | bevorzugt jetzt die POI-Banditenlager |
| Es gibt ~13 POI-Banditenlager mit eigener Besatzung (bis 3) | `world.js:1599–1633` (`poi:'bandits'`, `faction:'bandit'`), `game.js:1821–1824` (`poiSpawns`), Nachschub `10943` | Doppelbesatzung vermeiden (§5.3) |
| Große Karawane Eren↔Nordfurt: Hinterhalt 35 % auf halber Strecke, ohne Bezug zu Banden | `sim.js:271–287` | liest jetzt nahe Banden |
| `banditsOnTribute` würfelt 10 %/Tag je Tributdorf, ohne Bande | `game.js:5655`, `5667–5674` | nur noch mit naher Bande |
| Streifen (Valen, Orden, Gilde, Kette) sind echte Reisende, aber ohne Wirkung auf Banden | `sendPatrol` `game.js:10768–10772`, Agenda `10777–10802`, Reisende `1285–1424` | Streifen schwächen Banden (§5.6) |
| Rooks Bande: `S.ranks.bandit` (−1 keiner, 0 Handlanger, 1 Klinge, 2 Hauptmann) | `data.js:938`, `rankName` `game.js:11447` | Rook-Netz-Regeln |
| Kriegsknoten: Besitzer `undead`/`valen`/`order`/`null`, feindlich ist nur „Tote gegen alle“ | `data.js:1344–1362`, `sim.js:322` | „feindlicher Knoten“ = Knoten der Toten |
| Varonheim-Belagerung: eigener Knoten mit Mauern, `CAP_SIEGE` | `sim.js:33–95` | **kein Konflikt:** T12 liest nur `owner`. Ein gefallenes Varonheim zählt als Totenknoten (+0,05 für nahe Strecken) — gewollt |
| T23 (Händler „Züge“) schreibt ebenfalls in `caravanDay` | `PROPOSALS/t23_fraktionsressourcen.md` §5.5, §8, §12 | Reihenfolge: **T12 B1 zuerst**, T23 S4 baut darauf (§12) |

## 1. Konzept
Jede Straße hat eine Gefahr **mit Namen**. Eine Bande sitzt in einem Lager nahe der Strecke. Sie lebt von dem, was sie Zügen abnimmt, wächst von Beute und verhungert, wenn die Straße bewacht oder leer ist. Ein Totenknoten am Weg macht die Strecke gefährlich. Der Kontor zeigt es: „Nach Nordfurt: Gefahr 21 % — Die Galgenbrüder bei Eisenried (7 Mann).“ Der Spieler entscheidet: Schutzgeld, zerschlagen, Umweg, Wachen — oder als Rooks Mann mitverdienen.

## 2. Gelöstes Problem
- Zugüberfälle sind reine Würfel ohne Ursache (FAKT `economy.js:280–291`).
- Banden „rauben Reisende aus“, wachsen davon, aber niemandem fehlt etwas (FAKT `11048`).
- 13 POI-Banditenlager sind Kulisse ohne Bezug zu den Banden.
- `banditsOnTribute` ist ein eigener Würfel ohne Bande.
- Das Zollgesetz in `riskOf` ist toter Code (RB-010).

## 3. Warum es zu ROTFALL passt
Die Kette aus `TEAM.md` §1 („NPC-Entscheidung → Fraktion → Wirtschaft → Weltereignis → Begegnung → …“) bekommt ein fehlendes Glied: Eine Bande ist eine Entscheidung, die man auf der Karte findet, deren Wirkung man im Brotpreis sieht (T09) und die man mit dem Schwert beendet. Das Audit-Beispiel „Die hungernde Front“ (`TEIL_B_WELT.md:205`) wird damit spielbar. Es entsteht kein neues System; drei fertige Systeme werden verbunden (Banden, Märkte, Krieg).

## 4. Heutiges System (FAKT)
| Teil | Ort | Heute |
|---|---|---|
| `riskOf(a,b,guards)` | `economy.js:280–286` | 0,06 Grund; +0,12 je Untotenheer an einem Endpunkt; Karak +0,05; Zoll −0,02 (tot); × (1 − 0,22 × Wachen), 0,01–0,5 |
| Abstrakte Züge | `caravanDay` `economy.js:287–316` | ≤ 6 neue/Tag, ≤ 16 unterwegs, Wachen `ri(0,2)`; Überfall: Hälfte bis alles weg, Log, 30 % Chronik |
| Eigener Wagen | `myCaravanDay` `economy.js:345–363` | ab 3 Wachen 50 % abgewehrt, sonst 40–90 % je Ware weg |
| Große Karawane | `sim.js:253–305` | 35 % Hinterhalt bei x≈101; sichtbar → 3 + Wachen Banditen; fern → Wachen 30 %+15 %/Wache, sonst halbe Ladung |
| Banden | `game.js:11023–11083` | ≤ 3 aktiv; `bandFound` (20 %/Tag); Gebiet 40 Felder; Schutzgeld `(20 + 8×Mann) × (Barmherzig 0,7)`, 5 Tage; Hinterhalt 1 %/Tick im Gebiet; Anführer tot → Kopfgeld `60 + 10×Mann`, Stadt-Fraktion +3; Zerfall nach 12 Tagen 25 %/Tag |
| T08 | Verhör `game.js:11595`, `13218–13233`; Barmherzig/Schlächter `11068`, `11082` | verrät das Bandenlager; Ruf ändert Schutzgeld und Hinterhalte |
| Tribut | `banditsOnTribute` `5667–5674` | nah: 3 Banditen; fern: Vorrat −10; danach Kettenwache 4 Tage |
| Kontor | `ecoMenu` `12470–12487`, `wagonMenu`/`sendMenu` `12496–12519` | knapp/billig, ankommende Züge; Ziele nach erwartetem Erlös, Wachen 0–4 |
| Streifen | `sendPatrol` `10768–10772`; Agenda `10777–10802` | Reisende mit `patrol: fac`, keine Wirkung |

## 5. Neues System (VORSCHLAG)
Alle Zahlen in `const ROAD = {…}` in `economy.js`:
```js
export const ROAD = { band: 0.08, bandR: 30, node: 0.05, nodeR: 30, patrol: 0.03, toll: 0.02,
  grow: 20, upkeep: 0.4, small: 1, starveDays: 3, minMen: 2, maxMen: 9, startLoot: 5, unitGold: 5, rookShare: 0.25 };
```

### 5.1 `riskOf(a, b, guards, o = {})` und `riskWhy(a, b, o)`
`riskWhy` gibt die Gründe als Liste `[{ add, txt, band? }]` zurück. `riskOf` summiert sie (eine Quelle für Würfel **und** Anzeige):
- Grund 0,06 („Straßenräuber“, wird nicht angezeigt).
- Untotenheer an einem Endpunkt +0,12 (wie heute, Text „Totenheer vor Nordfurt“).
- Karak +0,05 (wie heute).
- **Bande:** je aktiver Bande mit Lager-Abstand zur Strecke `< ROAD.bandR` (30 Kacheln; Punkt-Strecke über `LOC[a]`/`LOC[b]`, beide in Weltkacheln wie `b.tx/ty`): `+ 0,08 × men / 9`.
  - Text: „Die Galgenbrüder bei Eisenried (7 Mann)“.
  - Entfällt bei `o.detour` (Umweg) und für den eigenen Wagen, solange `b.paid ≥ heute` (Schutzgeld deckt den Wagen, §5.5).
- **Feindlicher Kriegsknoten:** je Knoten mit `owner === 'undead'`, der kein Endpunkt ist und `< 30` Kacheln von der Strecke liegt: +0,05. Text: „Die Toten halten Aschfurt“. Ein gefallenes Varonheim zählt mit.
- **Streife:** liegt eine lebende Streife (`traveler.kind === 'patrol'`, Valen/Orden/Gilde) auf derselben Strecke (gleiche Endpunkte oder Abstand < 20), dann −0,03 (einmal). Text „Streife der Krone unterwegs“.
- **Zoll (ersetzt RB-010):** Endpunkt in Aurelion und `S.tollMul ≥ 1,05` → −0,02 („Zölle bezahlen Legionsstreifen“). Die tote Zeile `S.laws?.toll` fällt weg.
- Ergebnis wie heute: `clamp(Summe × (1 − 0,22 × guards), 0,01, 0,5)`.
- Leistung: ≤ 4 Banden + 13 Knoten je Aufruf, ≤ 16 Aufrufe am Tag, Kontor ≤ 15 Strecken — vernachlässigbar. Kein Cache nötig.

### 5.2 Beute statt Würfelwachstum
- Überfall (`caravanDay`): Mit Wahrscheinlichkeit `Bandenanteil / Gesamtrisiko` war es eine Bande (gewichtet nach ihren Anteilen). Sie bekommt `b.loot += lost` (verlorene Ladungen), `b.lastLoot = Tag`.
  - Log: „Die Krähen überfielen bei Eisenried einen Zug nach Nordfurt (8 Weizensack).“
  - Erster solcher Fall: Hinweis (§5.8).
- Gleiches beim eigenen Wagen (`myCaravanDay`) und bei der Großen Karawane: Wird sie fern ausgeraubt, bekommt die nächste Bande an der Alten Straße die halbe Ladung.
- **`bandDay` neu** (ersetzt `11048`):
  - `b.loot += ROAD.small` (Kleinkram von Reisenden, 1/Tag), dann `b.loot −= men × 0,4` (Unterhalt).
  - `loot ≥ 20` → `men + 1` (Deckel 9, auf Sehr schwer 11 über `DIFF.raid` aus T11), `loot −= 20`. Log „Die Bande wächst (8 Mann)“.
  - `loot < 0` → `loot = 0`, `b.starve++`. `starve ≥ 3` → `men − 1`, `starve = 0`. Log „Die Krähen hungern — zwei Männer laufen davon“.
  - `men ≤ 2` → `bandGone` „… zerstreut, das Lager bei X ist verlassen.“
  - Alter Zerfall nach 12 Tagen (25 %) nur noch bei `loot < 5`. Reiche Banden bleiben.
  - Gleichgewicht: 5 Mann brauchen 2/Tag, Kleinkram bringt 1. Ohne Züge zerfällt eine 5er-Bande in ≈ 14 Tagen; ein Zugüberfall (≈ 5–15 Ladungen) alle 3–5 Tage hält sie.
- **Kopfgeld** (`bandKill` `11078`): `60 + 10 × men + loot × 2` Gold. Die Beute liegt außerdem als Kiste am Lagerfeuer (`b.loot` in Waren der überfallenen Art, höchstens 20; für T21-Zelte).

### 5.3 Lager an echten Orten
- `bandFound(town)` sucht zuerst ein freies POI-Banditenlager (`LOCATIONS` mit `poi === 'bandits'`): 25–90 Kacheln vom Stadtplatz, nicht in einer Siedlung, keine andere Bande dort.
  - Auswahl mit `pick()` über den **Spiel**-Zufall (`state.js`), nicht `world.js rnd()`.
  - `b.poi = l.key`, `b.where = l.name`, Lager an `l.x/l.y`. Sonst wie heute ein Zufallspunkt.
- Solange eine Bande in einem POI sitzt, füllt dessen Spawngebiet (`poiSpawns` `1823`, Nachschub `10943`) **nicht** nach. Die Bande stellt die Besatzung (`bandSpawn`). Neues Feld `key: l.key` am Gebiet, damit der Nachschub prüfen kann.
- Verhör (T08) zeigt damit auf einen echten, benannten Ort.

### 5.4 Tribut nur mit naher Bande
- `tributeDay` `5655`: `const nb = bandNear(V.square, 40)`; nur dann `chance(0,05 + nb.men × 0,02)` → `banditsOnTribute(V, T, nb)`.
- Fern: die geraubten 10 Vorrat (nach T23: `stock.grain`) gehen in `nb.loot`.
- Nah: die 3 gespawnten Banditen tragen `bandId: nb.id`. Wer sie tötet, senkt `nb.men` (`bandKill` gilt).

### 5.5 Entscheidungen am Lager (Unterhändler)
- **Schutzgeld** (wie heute, 5 Tage) deckt jetzt auch den **eigenen Handelswagen** (Bande zählt in `riskOf` für `S.eco.my` nicht). Text ergänzt: „… und deinen Wagen lassen wir auch fahren.“
- **Rooks Netz:**
  - `S.ranks.bandit ≥ 1` (Klinge): Schutzgeld × 0,5. 10 % davon gehen an Rook: Rook-Ruf +1 je volle 10 Gold Anteil, mindestens +1. Zufallsbanden heißen im Dialog „Rooks Leute“.
  - Wer als Rooks Mann (Rang ≥ 0) einen Bandenanführer tötet: Rook-Ruf −10, Log „Verrat am Netz. Rook wird davon hören.“ Mit Rang 2 droht der Ausschluss (bestehende Regel ≤ −60, `4655`).
- **Straße melken** (Rang 2 Hauptmann, siehe F1):
  - Neue Wahl „Die Straße nach X gehört jetzt uns“: `b.tax = true`.
  - Wirkung: Bande +0,04 Risiko zusätzlich. 25 % jeder Beute als Gold (`Ladungen × 5 × 0,25`) an den Spieler beim nächsten Besuch am Lager oder bei Rook. Gilde −1 je Überfall.
  - Endet, wenn der Spieler es widerruft oder die Bande fällt.
- **Fragen:** „Wovon lebt ihr?“ → Erklärung der Beute-Regel in der Stimme der Bande: „Von den Wagen nach Nordfurt. Keine Wagen, kein Brot — dann gehen die Jungs.“

### 5.6 Die Welt wehrt sich (Streifen und Agenda)
- `bandDay`: Kreuzt eine lebende Streife (Valen, Orden, Gilde) das Gebiet einer Bande (Strecke der Streife < 20 Kacheln vom Lager), dann `chance(0,35)` → `men − 1`. Log/Chronik „Eine Streife der Krone stellte die Krähen bei Eisenried“. `men ≤ 2` → zerstreut.
- `sendPatrol(fac, from?, to?)` bekommt optionale Endpunkte. Agenda Valen (`10781–10786`): Gibt es eine Bande mit Risikobeitrag ≥ 0,04 auf einer Strecke zwischen Valen-Städten, schickt Valen die Streife **dorthin**. Chronik „Valen schickt Streifen gegen die Krähen“.
- Agenda Gilde (`10792–10797`): Geleitauftrag bevorzugt die gefährlichste Strecke.
- Kette: Überfälle auf Tributdörfer (5.4) lösen schon heute Kettenwachen aus (`5672`). Bleibt so.

### 5.7 Kontor und Wagen (Anzeige ist Pflicht)
- `ecoMenu`: neue Zeile unter „Unterwegs hierher“: „**Gefährlichste Straße:** nach Nordfurt 21 % — Die Galgenbrüder bei Eisenried (7 Mann).“
- Neue Wahl „Straßen und Gefahren“: alle Ziele ≤ 3 Tagesreisen.
  - Format: „Nach Nordfurt (2 Tage): 21 % — Galgenbrüder bei Eisenried (7 Mann); Totenheer vor Nordfurt“.
  - Ohne Grund: „ruhig (6 %)“.
  - Prozent mit 1 Wache, damit die Zahlen vergleichbar sind.
- `sendMenu`:
  - Jede Zielzeile zeigt „Gefahr X %“ mit den gewählten Wachen.
  - Neuer Schalter „**Umweg**: an/aus (+1 Tag, Banden gemieden)“ → `my.detourNext`, `sendWagon(to, guards, detour)` setzt `my.detour` und `eta + 1`.
- Koop: Die Texte baut `routeLines(town)` (rein, ohne Würfel) auf dem Wirt. Gäste sehen den Kontor über die bestehenden `uiHooks`.

### 5.8 Hinweise für den Spieler
- Erster Bandenüberfall auf einen Zug (`S.flags.hintRoad`): Log „Die Krähen bei Eisenried haben einen Zug nach Nordfurt überfallen. Banden leben von Beute: ungestört wachsen sie, ohne Züge zerfallen sie. Der Kontor zeigt jede Strecke mit ihrer Gefahr.“
- Erster Kontorbesuch nach dem Update: Hinweiszeile wie oben.
- Gerüchte entstehen über die Chronik von selbst (bestehendes System).
- Unterhändler-Dialog „Wovon lebt ihr?“ (5.5).
- `docs/MECHANIKEN.md` Abschnitt „Straßen und Banden“; `CHANGELOG`.

## 6. Spielererlebnis
Am Kontor in Eren: „Nach Nordfurt: 23 % — Die Galgenbrüder bei Eisenried (7 Mann).“ Brot in Nordfurt ist teuer (T09), weil die Kornzüge nicht ankommen. Drei Wege: 40 Gold Schutzgeld, Wagen fährt sicher. Oder mit Umweg einen Tag länger. Oder ins Lager, zu dem das Verhör eines Gefangenen gestern geführt hat, den Anführer töten, 130 Gold Kopfgeld und eine Kiste Korn. Eine Woche später: „Ruhig (6 %)“, Brot billiger. Wer stattdessen für Rook die Straße melkt, sieht Gold fließen, liest „Die Gilde stellt den Zug ein“ und trifft bald eine Valen-Streife vor dem Lager.

## 7. Entscheidungen des Spielers
- **Schutzgeld** (kurz, billig, die Bande wächst weiter von fremden Zügen).
- **Zerschlagen** (Kampf, Kopfgeld + Beute, Rook-Ruf, wenn man zum Netz gehört).
- **Umweg** (Zeit gegen Sicherheit) oder **Wachen** (Gold gegen Sicherheit).
- **Aushungern** (Geleitaufträge, Streifen helfen lassen, Züge umleiten — die Bande stirbt am Mangel).
- **Mitverdienen** als Rooks Hauptmann (Gold gegen Gilde und Valen).

## 8. Querwirkungen (≥ 3)
| System | Wirkung |
|---|---|
| Wirtschaft (T09) | Überfälle nehmen echte Ladung; Mangel im Zielort → Ladenpreise; eigener Wagen mit Gefahr und Umweg |
| Fraktionen (T23) | Händler-„Züge“ sinken je Überfall (T23 §5.5); Gildenwachen senken `riskOf`; Rook-Netz gegen Gilde |
| Krieg (`sim.js`) | Totenknoten am Weg +0,05; gefallenes Varonheim zählt; Belagerung unberührt |
| Streifen/Agenda | Streifen senken Risiko und dezimieren Banden; Valen schickt sie gezielt |
| T08 Gefangene/Ruf | Verhör findet POI-Lager; Barmherzig/Schlächter wie heute |
| Kette/Tribut | Überfall auf Tributdörfer nur mit naher Bande; Beute fließt in die Bande |
| T11 Überleben | Nachtlager im Bandengebiet doppelt riskant; Brot/Proviant teurer, wenn Kornzüge fallen |
| T21/T39 (später) | `b.loot` im Zelt sichtbar; eigene Karawane nutzt `riskOf`/`riskWhy` |

## 9. Emergenz
- Bande an Eren–Nordfurt → Korn fehlt in Nordfurt → Valens Heer schrumpft (T23 Korn) → Tote brechen durch → Aschfurt fällt → Strecke Kreuzweg–Nordfurt +0,05 → noch weniger Züge → die Bande verhungert, weil nichts mehr fährt. Die Welt korrigiert sich, nur nicht so, wie man es wollte.
- Spieler zahlt Schutzgeld für den eigenen Wagen, die Bande frisst sich an fremden Zügen fett, wird zu 9 Mann, und beim nächsten Durchritt ohne Schutzgeld steht ein großer Hinterhalt im Weg.

## 10. Risiken
- **Wirtschaft kippt:** Zu viele Überfälle lassen Städte hungern. Gegenmittel: Banden höchstens 3 (4 auf Sehr schwer), Bandenbeitrag höchstens 0,08 je Bande, Streifen und Hunger lassen Banden zerfallen. Mit der 60-Tage-Schleife messen (ANNAHME: im Mittel 1–2 Banden aktiv, Risiko auf betroffenen Strecken 0,10–0,18).
- **Probenkippen:** Neue `chance()`-Aufrufe in `bandDay`/`caravanDay` verschieben den geteilten Zufall. Proben, die `bandDay`/`ecoDay` rufen, mit festem `seedRng` prüfen. `world.js` bleibt unberührt (POI-Wahl nur zur Laufzeit).
- **POI-Doppelbesatzung:** gelöst über die Spawn-Sperre (5.3).
- **Speichern/Laden:** Nur neue Zahlen- und Wahrheitswerte an `S.bands[i]` und `S.eco.my`; fehlen sie, gelten Standardwerte.
- **Leistung:** siehe 5.1. `bandDay` läuft einmal am Tag.

## 11. Alternativen
- **A (klein):** Nur `riskOf` liest Banden und Knoten, dazu die Kontorzeile. Kein Beute-Wachstum, kein Umweg. ≈ 40 % Aufwand. Die Bande bleibt dann ohne Ursache-Wirkung nach innen.
- **B (kleinst):** Nur die Kontorzeile mit Bandennamen (Anzeige ohne Mechanik). Ehrlich, aber keine Entscheidung.
- **C (größer):** Banden als sichtbare Gruppen, die echte Züge auf der Karte angreifen. Teuer (Wegsuche, Pathing), später mit T39 Reittiere/Karawane.

## 12. Abhängigkeiten
- T04, T09 erfüllt (TASKS DEPENDS).
- **T23 S4** schreibt ebenfalls in `caravanDay`: **erst T12 B1, dann T23 S4**. T23 ruft beim Überfall nur `H.facTrade(−6)` dazu; die Schnittstelle ist `onCaravanRaid(c, lost, band)` in `economy.js`. Beide hängen sich dort ein.
- T11 liefert `DIFF.raid` (Bandenzahl/Deckel auf Sehr schwer). Ohne T11 gilt 1.
- T21 (Zelte) und T39 (eigene Karawane) bauen auf `b.loot` und `riskWhy`.
- RB-010 wird mit B1 erledigt.

## 13. Aufwand
Mittel. Drei Scheiben (§16). Fast alles in `economy.js` und im Bandenblock `game.js:11023–11083`. Kein Bild, kein neuer Sprite.

## 14. Exploits und Gegenmittel
- **Bande füttern, dann für hohes Kopfgeld töten:** Kopfgeld +10 je Mann und +2 je Beute. Beute zu füttern kostet ≈ 5 Gold je Ladung. Lohnt nicht.
- **Schutzgeld zahlen, dann zerschlagen:** erlaubt. Kostet das Schutzgeld, und die Bande ist danach Feind (wie heute).
- **Melken und Geleitaufträge gegen die eigene Bande:** möglich. Gilde −1 je Überfall; ab Gilde ≤ −30 keine Geleitaufträge mehr von ihr (Prüfung in `postContract('merch', …)`).
- **Umweg immer an:** kostet jedes Mal einen Tag. Totenknoten und -heere zählen trotzdem.
- **Streife folgen und Bande abkassieren:** Die Streife tötet Männer, nicht den Anführer. Kopfgeld gibt es nur für den Anführer.

## 15. Daten- und Codeplan
**Gespeichert (dürfen fehlen):**
- `S.bands[i]`: `loot` (Zahl, Standard `ROAD.startLoot` = 5), `starve` (0), `lastLoot`, `poi` (Ortsschlüssel oder fehlt), `tax` (bool), `good` (zuletzt geraubte Ware, für die Kiste).
- `S.eco.my.detour` (bool), `my.detourNext`.
- `S.flags.hintRoad`.

**Migration:** `ensureBands()` in `continueGame()`/`newGame()` setzt fehlende Felder. Alter Stand mit `S.bands` ohne `loot` läuft so.

**economy.js:**
- `ROAD`
- `segDist(px, py, a, b)`
- `riskWhy(a, b, o)`
- `riskOf(a, b, guards, o)`
- `onCaravanRaid(c, lost, kind)`; Banden-Zugriff über Hook `H.bands()`, weil die Banden in game.js leben (Muster wie `sim.js H`)
- `caravanDay` und `myCaravanDay` rufen `onCaravanRaid`; `sendWagon(to, guards, detour)`

**sim.js:**
- `caravanFrame` (`271–287`): Hinterhalt-Chance `0,15 + Σ(men × 0,04)` der Banden < 30 Kacheln von der Alten Straße, höchstens 0,6. Sichtbare Räuber tragen `bandId`.
- Ferner Raub → `onCaravanRaid`.

**game.js:**
- `bandFound` (POI zuerst), `bandDay` (Beute, Hunger, Streifen), `bandKill` (Kopfgeld, Rook-Ruf)
- `bandChoices` (Rook-Rabatt, Wagen, Melken, „Wovon lebt ihr?“)
- `bandNear()`, `tributeDay`/`banditsOnTribute`
- `poiSpawns`/Nachschub-Sperre
- `sendPatrol(fac, from, to)`, Agenda Valen/Gilde
- `ecoMenu`/`sendMenu`, `routeLines(town)`, Hinweis

**Debug** (`debugSections()`, Abschnitt „Straßen“):
- „Bande an die Alte Straße setzen“ (`bandFound('eren', Punkt nahe Strecke Eren–Nordfurt)`)
- „Nächste Bande: +20 Beute“, „Nächste Bande: 3 Hungertage“
- „Strecken-Gefahr aller Routen ins Log“ (`routeLines` für jede Stadt)
- „Händlerzug-Überfall erzwingen“, „Rook-Rang: Klinge / Hauptmann“, „Streife gegen nächste Bande schicken“

**Proben:**
1. Bande 10 Kacheln neben Eren–Nordfurt, 9 Mann → `riskOf('eren','northcity',0)` steigt um 0,08. `bandGone` → zurück auf den alten Wert. `riskWhy` nennt den Namen.
2. Knoten `ashford` auf `undead` (in `sandbox`, `S.war` gesichert) → eine Strecke an Aschfurt vorbei +0,05; Endpunkte zählen nicht doppelt.
3. Überfall mit Bande (Chance erzwungen über `seedRng` oder Hook) → `b.loot` steigt um die verlorene Menge. `loot 20` → `men + 1` in `bandDay`.
4. Ohne Beute: 5 Mann, `loot 0`, 3 Tage `bandDay` → `men 4`. Bei `men 2` → `gone`.
5. `bandFound` mit freiem POI in Reichweite → `b.poi` gesetzt, Lager an den POI-Koordinaten (±3). Spawngebiet des POI füllt nicht nach.
6. Rook-Rang 1 → Schutzgeld halb, `S.factions.bandit` steigt. Rang 0 + Anführer tot → Rook-Ruf −10.
7. Tributdorf ohne Bande in 40 Kacheln → `banditsOnTribute` nie (100 Tage `tributeDay` mit `chance` erzwungen). Mit Bande → möglich.
8. Alter Stand: `S.bands = [{… ohne loot}]` → `ensureBands` → `bandDay` ohne Fehler.
9. Eigener Wagen: Bande an der Strecke → Risiko höher; Schutzgeld bezahlt → Bande zählt nicht; `detour` → zählt nicht, `eta + 1`.
10. Kontor: `routeLines('eren')` enthält „Galgenbrüder“ (Probebande), mit Prozentzahl.
11. Streife: Valen-Streife mit Route durch das Bandengebiet, `chance` erzwungen → `men − 1`.
12. Koop: `routeLines` liefert für den Gast denselben Text (rein, ohne Würfel, keine Zustandsänderung: `S.bands` vor/nach gleich).

## 16. Scheiben (je mit MECHANIKEN, CHANGELOG, Debug, Proben)
- **B1 Gefahr mit Grund:** `ROAD`, `riskWhy`/`riskOf` (Banden, Knoten, Streife, Zoll statt RB-010), Kontorzeile + „Straßen und Gefahren“, Wagen-Gefahr, Umweg, Schutzgeld deckt den Wagen. Proben 1, 2, 9, 10, 12. **Vor T23 S4.**
- **B2 Banden leben von der Straße:** Beute, Wachstum, Hunger, Kopfgeld + Kiste, POI-Lager, Spawn-Sperre, Große Karawane, Tribut nur mit naher Bande, Hinweis. Proben 3, 4, 5, 7, 8.
- **B3 Netz und Gegenwehr:** Rook-Rabatt, Verrat am Netz, Melken (wenn F1 = ja), Streifen dezimieren, Agenda zielt. Proben 6, 11.

## 17. Balance (ANNAHME, 60-Tage-Schleife und Kontor-Zahlen messen)
- Ruhige Strecke 6 % (1 Wache 4,7 %). Mit 7er-Bande 12 %. Mit Bande und Totenknoten 17 %. Mit Totenheer am Ziel bis 29 %.
- Abstrakte Züge: 16 unterwegs, ≈ 1–2 Überfälle/Tag landesweit (heute ≈ 1). Banden bekommen davon nur ihren Anteil.
- Schutzgeld 7er-Bande: 76 Gold (Klinge 38). Kopfgeld 7er-Bande mit 10 Beute: 150 Gold.

## 18. Fragen an den Entwickler (höchstens 4)
1. **„Straße melken“ für Rooks Hauptmann** (25 % der Beute als Gold, Gilde −1 je Überfall, Valen-Streifen kommen)?
   **Empfehlung:** ja, als Scheibe B3. Es gibt dem Banditenweg ein Spielziel, und die Welt antwortet.
2. **Verrat am Netz:** Rook-Ruf −10, wenn ein Mitglied von Rooks Bande (ab Handlanger) einen Bandenanführer tötet?
   **Empfehlung:** ja, aber erst ab **Klinge** (Rang 1). Handlanger dürfen noch „aufräumen“.
3. **Schutzgeld deckt auch den eigenen Handelswagen** für die 5 Tage?
   **Empfehlung:** ja. Sonst ist Schutzgeld für Händler wertlos, und V4 verlangt die Entscheidung „auch für den eigenen Wagen“.
4. **Streifen schwächen Banden selbstständig** (35 % je Durchzug, ein Mann)?
   **Empfehlung:** ja. Ohne das bleibt jede Bande ewig, bis der Spieler kommt. Mit Gegenwehr wirkt die Welt lebendig, und Valen bekommt einen sichtbaren Grund für seine Streifen.
