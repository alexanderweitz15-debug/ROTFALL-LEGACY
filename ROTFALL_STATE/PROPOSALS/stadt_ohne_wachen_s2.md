# Stadt ohne Schutz — Scheibe 2: Gesetzlosigkeit und Übernahme (Designer, 01.10.2026)

Status: PROPOSED (setzt freigegebene Regeln aus `stadt_ohne_wachen.md` §5 um). Kein Code.
Grundlage sind die Entscheide vom 01.10.:
- Tempo 2 + 2 Tage, Angsthase +2, Sehr schwer −1.
- Totenheer nur bei Kriegsknoten, sonst Bande.
- Die Kette nur am Westrand.
- Varonheim wird nur beschleunigt und nie übernommen; tötet der Spieler auch die Burgwache, flieht der König vorzeitig.

Zeilenangaben gelten für den Stand vom 01.10. Maßgeblich ist der Funktionsname.

---

## 0. Was Scheibe 1 schon gebaut hat (FAKT, per grep)

| Baustein | Stelle | Bedeutung für S2 |
|---|---|---|
| `guardTownOf`, `schutzSoll`, `schutzOf`, `schutzAlive`, `SCHUTZ_NAME` (3 Stufen) | `game.js:8373–8377` | `SCHUTZ_NAME` wird auf 5 Stufen erweitert |
| `schutzLoss` (−4 Ruf je Wache, Varonheim −4 Besatzung) | `:8378` | unverändert |
| `schutzCheck`: Stufe kommt **nur** aus `r = lost/soll` (0/1/2) | `:8384` | muss Stufe 3/4 halten (§2.1) |
| `schutzAlarm`: Glocke, Szene, Flucht, Kopfgeld, Strafzug | `:8391` | unverändert, setzt neu `Z.since` |
| `schutzCalm`, `ensureSchutz` (Läden zu, Miliz) | `:8408`, `:8413` | `ensureSchutz` baut zusätzlich Bandenwachen und Plünderer-Sperre |
| `SCHUTZ_REINF`, `schutzBlocked`, `schutzReinfText`, `schutzDay` | `:8423–8447` | `schutzDay` bekommt Fristen, Übernahme und Plünderer |
| Haken in `die` | `:3634` | ergänzt um die Burgwache (§5) |
| Spawn mit Verlust: `spawnGuardPosts` `:698`, `capitalMigrate` `:8306`, `ensureAurelion` `:5652` | — | überspringen künftig übernommene Städte |
| Varonheim-Kopplung: `w.schutz 0.5`, `guardHit/guardBack 4`, kein Auffüllen, `threatBump(3)` | `sim.js:38`, `:67`, `:85`, `:41` | **bereits fertig.** S2 ergänzt nur die Burgwache |
| Proben „Stadt ohne Schutz“ | `game.js:18359–18370` | bleiben; S2 fügt 7 hinzu |
| Debug: Status, Tag vorspulen, Zurücksetzen | `:14853–14856` | erweitert |

Fazit: Die Varonheim-Besatzungskopplung aus dem alten §6 ist schon gebaut. Für S2 bleiben übrig:
- Stufe 3 (Gesetzlos)
- Stufe 4 (Übernahme)
- die Burgwache mit vorzeitiger Flucht des Königs

---

## 1. Kern

> Wird eine schutzlose Stadt nicht bald ersetzt, zerfällt erst ihr Gesetz und dann ihr Herr. Wer sie danach nimmt, hängt von der Lage ab: ein nahes Totenheer, eine Bande oder im Westen die Kette. Varonheim zerfällt nur bis zum Gesetzlosen, und den Fall bringt weiter Morvath.

---

## 2. Fristen und Stufen

### 2.1 Stufenmaschine
`SCHUTZ_NAME = ['Bewacht', 'Geschwächt', 'Schutzlos', 'Gesetzlos', 'Übernommen']`.

`schutzCheck(k)` bekommt eine Zeile mehr:
- Die Verhältnisstufe `s0` (0/1/2) entsteht wie heute.
- Ist `s0 === 2` **und** `Z.stage ≥ 3`, bleibt `Z.stage` stehen.
- Fällt `s0` unter 2, gilt `stage = s0`, und `schutzLift(k)` räumt Stufe 3 und 4 ab (§3.3, §4.5).

### 2.2 Fristen
Die Frist gilt **je Schritt**: Schutzlos → Gesetzlos und Gesetzlos → Übernommen.

| Schwierigkeit | je Schritt | bis zur Übernahme |
|---|---|---|
| Angsthase | 4 Tage | 8 Tage |
| Schwer | 2 Tage | 4 Tage |
| Sehr schwer | 1 Tag | 2 Tage |

Frist-Helfer: `schutzWait = () => ({ angsthase: 4, sehr_schwer: 1 })[S.difficulty] ?? 2`.
- `Z.since` ist der Tag, an dem die laufende Stufe begann. `schutzAlarm` setzt es (Stufe 2).
- **Jede Ankunft von Ersatz** in `schutzDay` setzt `Z.since = day`, auch wenn die Stufe 2 bleibt. Ersatz unterwegs hält die Uhr also an. Das entspricht „ohne Nachschub“ aus §5.
- In `schutzDay`, nach dem Ersatzblock:
  - `stage === 2 && day − since ≥ wait` → `schutzLawless(k)`, Stufe 3, `since = day`
  - `stage === 3 && day − since ≥ wait && k !== 'varonheim'` → `schutzTake(k)` (§4)

---

## 3. Stufe 3 „Gesetzlos“

### 3.1 Wirkungen (alle über `Z.stage ≥ 3`, außer wo anders vermerkt)

| # | Wirkung | Zahl | Stelle |
|---|---|---|---|
| 1 | Wohlstand | `growthDay`: −4 bei Stufe 2, −8 bei Stufe 3. Bei Stufe 4 mit Bande −3 (Bürger zahlen Schutzgeld). Die bestehenden −12 (Besatzung) gelten für die Toten. | `game.js:6959` (Summand in der Formel `G.prosper = clamp(…)`) |
| 2 | Markt | Kaufen ×1,25 bei Stufe 3 (halbes `occupied`). Verkaufen bleibt gleich. Höchstens ein Faktor: `occupied` (×1,5) geht vor. | `economy.js:131` (`ecoPrice`), neue Hilfe `lawless(k)` in economy.js liest `S.schutz` |
| 3 | Aushänge | `makeContract(town, …)` liefert für Stufe ≥ 3 nichts Neues. Laufende Aufträge bleiben. | `game.js:6766` |
| 4 | Kein Gesetz | `arrestCheck`: Steht der Spieler in einer Stadt mit Stufe ≥ 3 (`townAt(p)`), wird er nicht festgenommen. Zornige Milizen kämpfen weiter. Das Kopfgeld bleibt. | `:5138` (nach der Kerker-Zeile) |
| 5 | Wegzug | `migrationDay`: `bad` gilt auch bei Stufe ≥ 2. Nach 3 schlechten Tagen 35 % Abwanderung pro Tag (bestehende Regel). Zusätzlich kein Wegzug **in** eine Stadt mit Stufe ≥ 2 (`emigrate`-Zielfilter). | `:1430`, `:1440` |
| 6 | Verstecken | bleibt wie S1 (`dayTargetRaw`, Stufe ≥ 2) | `:1171` |
| 7 | Plünderer | Nur wenn der Spieler auf `world` weniger als 60 Felder vom Platz entfernt ist, 22–4 Uhr, einmal pro Nacht: 2–4 `bandit`/`bandit_archer`, `transient`, `lawless: k`, Anker auf dem Platz. Sie greifen Bürger an (`aggroId` auf den nächsten Bürger). Ist der Spieler weiter als 90 Felder weg oder gilt Stufe < 3, werden sie entfernt. | neu `lawlessHour(k)` aus der Stundenschleife neben `cultHour` (`:9990er`) |
| 8 | Dank | Ein getöteter Plünderer bringt +3 beim Herrn, höchstens +12 pro Nacht. Log einmal je Nacht: „Die Bürger von X sehen, wer ihnen hilft.“ | Haken in `die` neben `schutzLoss` |
| 9 | Szene-light | Ist der Spieler nah: Toast `X IST GESETZLOS`; sonst Log und Chronik über `afterSay`, ohne Szene. Kein neuer Regiebuch-Takt. | `schutzLawless` |

### 3.2 Varonheim bei Stufe 3
Es gelten #1–#9, aber es gibt **keine** Übernahme (Entscheid).
- Die vorhandenen Kopplungen laufen weiter: Bedrohung +0,5/Tag ab Stufe 1, kein Auffüllen.
- Zusätzlich drückt Stufe 3 einmal `SIM.threatBump(2)` (nie über `bumpCeil`).
- Den Heerzug löst das nicht aus. Es verkürzt nur den Weg dorthin.

### 3.3 Ende der Gesetzlosigkeit (`schutzLift(k)`)
- Auslöser: Die Verhältnisstufe fällt unter 2.
- Folgen:
  - Plünderer weg.
  - Läden öffnen (bestehendes `schutzCalm`).
  - Log „In X herrscht wieder Gesetz.“

---

## 4. Stufe 4 „Übernommen“ — `schutzTake(k)`

### 4.1 Reihenfolge (die erste passende Regel greift)
1. **Tote** — nur wenn alle drei Bedingungen gelten:
   - `S.war.nodes[k]` existiert (Kriegsknoten).
   - Ein Untotenheer **ohne** `host` und **ohne** `order` steht höchstens 2 Kanten entfernt.
   - Der Knoten gehört nicht schon den Toten.
2. **Bande in der Nähe** — eine aktive Bande (`bandsOf()`) lagert höchstens 80 Felder vom Platz und herrscht noch über keine Stadt.
3. **Kette** — nur Valen-Dörfer am Westrand (Def. §4.4) und nur, solange `!S.flags.chainsBroken`.
4. **Neue Bande** — `bandFound(k)`. Gelingt das (es gibt einen Platz), wird sie sofort Herr.
5. **Niemand** — Stufe 3 bleibt. `Z.noTake++` pro Tag; täglich `chance(0.15 × noTake)`, dann `bandFound(k)` und Regel 4.

`k === 'varonheim'` und `TOWN_PLAN[k].lord === 'undead'` (Vharnholm) überspringen Stufe 4 ganz.

### 4.2 Tote (Kriegsknoten)
- Helfer in sim.js: `export function armyNear(k, fac, hops)`, eine Breitensuche über `NEIGH` (`sim.js:9–10`). Sie liefert das stärkste Heer ohne `host`/`order`.
- Ablauf:
  - `a.order = k`.
  - Log: „Die Toten wittern die offenen Tore von X. {Heer} wendet sich dorthin.“
  - Chronik `war`.
- **Besatzung gedeckelt**, einmal beim Eintritt in Stufe 3:
  - `cut = round(n.garrison × r)`, `n.garrison −= cut`, mindestens 2.
  - Gespeichert in `Z.gcut = cut`.
  - Kommt die Stadt wieder auf Stufe 0, gilt `n.garrison += Z.gcut`, danach `Z.gcut = 0`.
  - Für Varonheim gilt das nicht, dort läuft schon `guardHit`.
- Den Rest erledigt die bestehende Kette:
  - `warTick` → `resolveNode` (`sim.js:368`) → `capture` (`:413`)
  - dazu Flüchtlinge, Kriegsschäden und `afterCapture`
- `Z.taker = { by: 'undead', id: a.id, day }`.
- Verliert das Heer unterwegs: In `schutzDay` läuft `taker.by === 'undead' && !heldBy(k) && !armies.some(x => x.id === taker.id)`. Dann `taker = null`, und die Stadt bleibt gesetzlos. Die Uhr läuft weiter (`since = day`).
- Hält der Knoten (`heldBy(k)`), wird `S.schutz[k]` gelöscht. Ab dann gilt die Besatzungslogik (Knochenwachen, `heldFate` nur bei Spieler-Befehl).
- Bei einer Befreiung (`was === 'undead'` in `capture`) läuft über `H.afterCapture` ein neuer Aufruf `schutzFreed(k)`:
  - Wachposten neu
  - `S.schutz[k]` gelöscht

### 4.3 Bande („Bandenherrschaft“)
**Daten:** Am Bandeneintrag `b.rules = k` und `b.patrolAt = day + 5`. Dazu `Z.taker = { by: 'band', id: b.id, day }`.

**Lager:** Die Bande zieht in die Stadt.
- `b.tx/ty` werden auf das Tor gesetzt (ein freier Punkt 6 Felder vom Platz Richtung Haupttor).
- `bandSpawn` (`:11222`) setzt also das Lager und den Unterhändler ans Tor.
- Die Kämpfer stehen auf dem Platz statt im Zeltlager (`anchor` = Platz).

**Ersatz für die Wachen:**
- Das sind die Bandenkämpfer selbst: `transient` und über `bandTick` sichtbar, sobald der Spieler näher als 45 Felder ist (das gibt es schon).
- `spawnGuardPosts`, `capitalMigrate` und `ensureAurelion` überspringen `k`, solange `taker` gesetzt ist.

**Läden:**
- Sie öffnen wieder, also kein `schutzShut` bei Stufe 4.
- Kaufpreise ×1,5 (in `ecoPrice` gilt dann statt ×1,25 der Faktor ×1,5).

**Schutzgeld am Tor:**
- Die bestehende Wahl in `bandChoices` (`:11253`) gilt unverändert: `(20 + 8 × Mann) × 0,7` bei Barmherzigen, 5 Tage Ruhe.
- Ohne Zahlung sind die Kämpfer in der Stadt Feinde. `bandTick` spawnt Kämpfer bisher nur, wenn `b.paid < day`, also ist das schon richtig.
- **Kein** Hinterhalt innerhalb der Stadt (die bestehende Sperre `!townAt` bleibt).

**Bürger:**
- Sie gehen wieder zur Arbeit. `dayTargetRaw` versteckt nur bei Stufe 2 und 3, also wird die Bedingung auf `stage === 2 || stage === 3` geändert.
- Neuer Gruß (Zufall aus 2): „Wir zahlen jetzt an {Anführer}. Die Krone kommt ja nicht.“ / „Leise. Seine Leute hören mit.“

**Wohlstand:** −3 pro Tag (§3.1 #1).

**Die Bande zerfällt nicht von selbst:**
- `bandDay` überspringt den 12-Tage-Zerfall für `b.rules`.
- Sie wächst wie jede Bande (+1 Mann, 50 %, höchstens 9).
- Mit T12 wird stattdessen `loot +2/Tag` gutgeschrieben, Beute aus der Stadt, damit sie nicht verhungert (Abstimmung §8).

**Befreiung durch den Spieler:**
- Fällt der Anführer, ruft `bandKill` (`:11248`) wie heute `bandGone` auf, dazu neu `schutzFreed(k, 'player')`:
  - `taker = null`, `stage = 2`, `since = day`
  - Der Herr schickt **sofort** eine Ersatzwelle (`R[1]` Mann, Sperren wie gehabt)
  - Ruf beim Herrn **+10**, aber nur, wenn `byP / lost < 0,5` war; sonst +0 mit dem Log „Man dankt dir — leise. Man weiß, wer die Wache erschlug.“ (Exploit §10)
  - Toast `X BEFREIT`, Chronik `battle`

**Befreiung durch den Herrn:**
- Ab `b.patrolAt` schickt der Herr alle 5 Tage eine Streife, wenn er nicht gebunden ist (`schutzBlocked` falsch, also nicht blockiert).
- Wirkung je Durchgang: `b.men = floor(b.men × 0,65)`. Das ist der Entscheid aus T12: „Patrouillen schwächen Banden 35 % je Durchgang.“
- Steht der Spieler näher als 90 Felder, läuft die Streife sichtbar als `sendPatrol(lord)` (`:10938`).
- Bei `b.men ≤ 1` flieht die Bande: `bandGone`, dann `schutzFreed(k, 'lord')` ohne Ruf.
- Rechnung bei Schwer: Eine Bande mit 6 Mann ist nach 2 Streifen bei 2 und nach der 3. weg. Ohne Spieler endet die Bandenherrschaft also nach etwa 15 Tagen.

### 4.4 Kette (Westrand)
**Westrand-Bedingung:** `westRim(k)` gilt, wenn alle drei Punkte zutreffen:
- `TOWN_PLAN[k].lord === 'valen'`
- `k` ist ein Dorf in `VILLAGES`
- `townGap(k, nächstes tribVillage) ≤ 160 Felder`

Dabei gilt `tribVillages` aus `:5678`. Es gibt keine feste Koordinate, damit der Varonheim-Umbau nichts verschiebt.

**Übernahme:**
- `Z.taker = { by: 'chain', day }`.
- Die Tribut-Logik nimmt das Dorf auf:
  - `tribVillages` wird zu `VILLAGES.filter(V => (V.tribute || S.schutz?.[V.key]?.taker?.by === 'chain') && …)`.
  - `tribOf(k)` legt `S.tribute[k]` an wie bei jedem Tributdorf (`:5681`).
- `townFac(k)` (`:6749`) liefert `'chain'`, solange `taker.by === 'chain'`. Das ist eine einzige Zusatzbedingung vorn in der Pfeilfunktion.
  - Folge: Aufträge, Verhaftung (Ketten statt Kerker) und Gruß-Fraktion folgen automatisch der Kette.
- Wachen: `spawnGuardPosts` überspringt `k`. Die Kettengarnison kommt über die vorhandene `tribGarrison`-Logik (`banditsOnTribute` `:5704`).
- Ruf: Valen −5 („Valen verliert {Dorf} an die Kette“).
- Log und Chronik `war`: „Die Kette legt {Dorf} in Eisen. Ab jetzt wird Tribut gezahlt.“

**Befreiung:**
- `chainsBroken`, also der bestehende Aufstand: Alle Ketten-Übernahmen fallen zurück an Valen.
- Oder der Spieler tötet alle `tribGarrison` im Dorf: `schutzFreed(k, 'player')` (Valen +10 nach derselben `byP`-Regel), danach läuft der Valen-Ersatz normal.

### 4.5 Ende einer Übernahme (`schutzFreed(k, who)`)
`taker = null`. Danach:
- Bande: `b.rules` löschen.
- Kette: `S.tribute[k]` löschen.
- Tote: `S.schutz[k]` löschen.

`stage = 2`, `since = day`, und `spawnGuardPosts()` darf wieder auffüllen, aber nur `soll − lost`. Der Ersatz läuft also ab hier wie in S1.

---

## 5. Varonheim: Burgwache und vorzeitige Flucht des Königs

### 5.1 Befund
Die 8 Burgwachen in `varonburg` (`:8511`) sind `transient` und `varonCourt`. `guardTownOf` schließt sie aus. Sie stehen nach jedem Laden wieder da, derselbe Fehler wie vor S1.

### 5.2 Zähler
- Neues Feld `S.schutzBurg = { lost, byP }`.
- Bewusst **nicht** in `S.schutz`: `schutzDay` läuft über `Object.entries(S.schutz)`, und `schutzSoll('varonburg')` wäre 0.
- Haken in `die` neben `:3634`: `c.guard && c.varonCourt && c.map === 'varonburg'` → `lost++` (höchstens 8), bei Spielertat `byP++`.
- Der Spawn in `:8511` nimmt `.slice(0, 8 − lost)`.
- Ersatz: Erreicht Varonheim wieder `lost === 0`, kommen mit jeder weiteren Valen-Ersatzwelle 2 Burgwachen dazu.

### 5.3 Vorzeitige Flucht (`varonFlee()`)
**Bedingung**, einmal geprüft bei jedem Burgwachen-Tod und in `schutzDay`:
- `S.schutzBurg.lost ≥ 6`
- `S.schutz.varonheim.stage ≥ 2`
- `S.schutzBurg.byP ≥ 4` (das war der Spieler)
- nicht `capitalFallen()`
- nicht `S.flags.varonDead`
- nicht schon `S.flags.varonFled`

**Wirkung:**
1. Gemerkt wird `S.flags.varonFled = { day, to: SIM.exileOf(), evac0: S.flags.varonEvac || 0 }`, dann `S.flags.varonEvac = 1`.
2. Die Burgkarte verliert König und Hof. Die Spawnfunktion der Burg (`:8500er`) setzt Varon und den Hof nicht, solange `varonFled` gilt.
   - Die Burg ist leer und begehbar. Die Waffenkammer bleibt verschlossen (Burgumbau-Entwurf).
3. `ensureVaronExile` (`:8335`) baut den Exilhof auch dann, wenn `varonFled` gilt und die Hauptstadt nicht gefallen ist. Ziel ist `varonFled.to`.
   - Wird das Ziel besetzt, zieht der Hof weiter wie heute (RB-052).
4. Szene, falls der Spieler in Varonheim oder der Burg ist:
   - Karte `DER KÖNIG FLIEHT`, Untertitel „Varon verlässt seine Stadt durch die Ausfallpforte.“
   - Sonst Log und Chronik `war`: „König Varon flieht aus Varonheim nach {Ort}. Die Stadt gehört weiter der Krone — nur der König fehlt.“
5. Varonheim bleibt Valen. Der Fall kommt weiter **nur** über den Heerzug.
   - Fällt die Stadt, solange der König geflohen ist, gilt `evac = 1`: Der Hof bleibt ganz (bestehender Schalter in `capitalFall` `:8314`).
6. **Rückkehr:** Varonheim ist 3 Tage am Stück auf Stufe 0 und `S.schutzBurg.lost === 0`. Dann:
   - `S.flags.varonEvac = varonFled.evac0`
   - `varonFled` löschen
   - Log: „Der König kehrt nach Varonheim zurück.“
7. Dialog: Varon im Exil sagt dem Täter einmal „Ihr habt meine Garde erschlagen. Und jetzt steht Ihr vor mir?“. Dazu gilt `S.factions.valen −10` einmalig, und es gibt keine Hofaufträge, solange Valen unter −20 liegt (bestehende Rufschwelle).

---

## 6. Spielstand und Migration

| Feld | Typ | Fehlt? |
|---|---|---|
| `S.schutz[k].since` | Tag | `ensureSchutz`: `stage ≥ 2` ohne `since` → `since = day` |
| `S.schutz[k].stage` | 0–4 | wie gehabt |
| `S.schutz[k].taker` | `{ by, id?, day }` oder fehlt | `ensureSchutz`: `by === 'band'` und Bande fehlt oder `gone` → `taker` löschen, `stage = 3`; `by === 'undead'` und `heldBy(k)` → Eintrag löschen |
| `S.schutz[k].gcut`, `.noTake`, `.lawN` (Plünderer-Dank diese Nacht) | Zahl | 0 |
| `S.bands[i].rules`, `.patrolAt` | Stadtschlüssel/Tag | fehlt = herrscht nicht |
| `S.schutzBurg` | `{ lost, byP }` | `{ lost: 0, byP: 0 }` |
| `S.flags.varonFled` | `{ day, to, evac0 }` | fehlt = nicht geflohen |

Weitere Punkte:
- Kein neuer `SKIP`-Eintrag.
- `ensureSchutz()` steht schon in beiden Ladeketten (`:1875`, `:2118`) und wird um die Prüfungen oben erweitert. Es bleibt idempotent.
- Plünderer und Bandenkämpfer sind `transient`.

---

## 7. Hinweise für den Spieler (Pflicht)
- **Log und Toast** bei jedem Stufenwechsel:
  - „X ist gesetzlos. Niemand verhaftet hier mehr, Plünderer ziehen nachts durch die Gassen.“
  - „{Bande} herrscht über X. Am Tor wird Schutzgeld verlangt.“
  - „Die Kette legt X in Eisen.“
  - „Die Toten wenden sich gegen X.“
- **Ortskarte und Handelsmenü:** `SIM.townState(k)` liefert „Schutzlos“, „Gesetzlos“ oder „Bandenherrschaft“ (Rangfolge nach „Belagert“). Der Tooltip zeigt die Frist: „Gesetzlos in 1 Tag, wenn kein Ersatz kommt“ bzw. „Übernahme in 2 Tagen“.
- **Debug-Status** (`:14853`) zeigt zusätzlich `since`, die Frist und `taker`.
- **Unterhändler am Tor** (Bandenherrschaft): Gruß „Die Stadt gehört jetzt {Anführer}. Wer rein will, zahlt. Wer ihn sucht — er sitzt im Wirtshaus.“ Das verrät den Befreiungsweg.
- **Kodex** „Stadt ohne Schutz“ (aus S1) bekommt die Absätze Gesetzlos, Übernahme und Burgwache.
- **`docs/MECHANIKEN.md`:** Text aus §11.

## 8. Abstimmung mit anderen Entwürfen (keine Dopplung)
- **T12 (Straßenherren):**
  - Die Bandenherrschaft ist eine T12-Bande mit `rules`.
  - Sie zählt im Deckel (3, Sehr schwer 4). Ist der Deckel voll, entfällt Regel 4, und Regel 5 wartet.
  - Ohne T12 gilt `bandFound` wie heute.
  - Mit T12 bekommt eine herrschende Bande `loot +2/Tag` und **keinen** POI (`poi` fehlt), denn ihr Lager ist die Stadt.
  - Das Patrouillenmaß 35 % ist T12s Zahl und wird nicht neu erfunden.
  - Das Schutzgeld bleibt T12/`bandChoices`; es kommt keine zweite Formel hinzu.
- **npc_eigene_ziele.md:**
  - Deserteurbanden (#39) können über Regel 2 Herr einer Stadt werden. Das ist gewollte Emergenz: Valens eigene Deserteure nehmen ein Valen-Dorf.
  - Der Hauptmann (#37) desertiert über `vmGone`. Der Verteidigungsmeister zählt nicht zum Soll (`schutzSoll` liest nur `GUARD_POSTS`), sein Weggang ist also kein „Verlust“. Das bleibt so.
- **T23:** Der Ersatz der Händler kostet Wohlstand (S1). S2 fügt keine Ressourcenformel hinzu.

## 9. Querwirkungen (mit Systemen)
1. **Kriegsgraph (sim.js):** offene Tore ziehen Untotenheere an. Die Besatzung wird gedeckelt, und `capture` erledigt den Fall.
2. **Banden (T12):** Eine Bande wird Stadtherr; Streifen des Herrn schwächen sie, und `bandKill` befreit.
3. **Wirtschaft:** Kauf ×1,25 bzw. ×1,5, keine Aushänge, Wohlstand −8 bzw. −3.
4. **Verbrechen:** keine Verhaftung bei Gesetzlosigkeit, Ketten statt Kerker bei Kettenherrschaft.
5. **Bevölkerung:** Wegzug, Verstecken, kein Zuzug.
6. **Tribut und Kette:** Ein Valen-Dorf wird Tributdorf.
7. **Hof und Exil:** Der König flieht vorzeitig, der Hof bleibt bei einem späteren Fall ganz.

## 10. Risiken und Exploits

| Risiko | Gegenmittel |
|---|---|
| **Ruf-Pumpe:** Wachen erschlagen, Stadt fallen lassen, Bande töten, +10 kassieren | +10 nur bei `byP/lost < 0,5`; die −4 je Wache bleiben. Netto immer negativ. |
| **Gold-Pumpe** über das Bandenkopfgeld `60 + 10×Mann` | gleiche Regel wie jede Bande, gedeckelt durch den T12-Deckel. Akzeptiert. |
| Stadt hängt ewig in Stufe 3 (keine Bande möglich) | Regel 5 (+15 %/Tag); im Notfall der Debug-Eintrag „Übernahme erzwingen“. |
| `townFac`-Änderung (Kette) wirkt breit: Aufträge, Wachenfarbe, Verhaftung | nur bei `taker.by === 'chain'`, nur Westrand-Dörfer. Probe E prüft, dass Eren/Nordfurt unberührt bleiben. |
| Heer wird vom Heerzug abgezogen | Regel 1 nimmt nur Heere ohne `host` und ohne `order`. |
| Zufall: `chance` in Regel 5, Plünderer-Zahl `ri(2,4)` | `world.js` bleibt unberührt. Fremde Proben mit Zufall nach dem Bau gegenprüfen. |
| Varon-Flucht kollidiert mit Roter Krönung/Kult (`S.cult`) | Flucht gesperrt, solange `S.cult?.end === 'ruling'` gilt (Kult hält die Burg). Die Krönung läuft im Exil weiter (der Hof ist ganz). In Probe F prüfen. |
| Koop | nur der Wirt rechnet (`S.coop?.role === 'guest'` → kein `schutzDay`, wie S1). |
| Leistung | einmal am Tag; Plünderer höchstens 4, nur in Spielernähe. |

## 11. Text für `docs/MECHANIKEN.md` (an „Stadt ohne Schutz“ anhängen)
> - **Gesetzlos und übernommen (v24):** Kommt zu einer schutzlosen Stadt zwei Tage lang kein Ersatz (Angsthase vier, Sehr schwer
>   einen), wird sie *gesetzlos*: niemand verhaftet mehr, Plünderer ziehen nachts durch die Gassen (jeder erschlagene bringt Ruf beim
>   Stadtherrn), Waren kosten ein Viertel mehr, es gibt keine Aushänge, der Wohlstand stürzt. Zwei Tage später wird sie *übernommen*:
>   steht ein Totenheer höchstens zwei Wege entfernt, marschiert es; lagert eine Bande in der Nähe (oder bildet sich eine), herrscht
>   sie — Schutzgeld am Tor, Preise anderthalbfach. Töte den Anführer, und der Herr schickt sofort Ersatz; sonst schwächen seine
>   Streifen die Bande alle fünf Tage. Dörfer am Westrand nimmt die Kette als Tributdorf.
> - **Varonheim** wird nie übernommen; den Fall bringt Morvaths Heerzug. Wer auch die Burgwache erschlägt, treibt König Varon
>   vorzeitig ins Exil — der Hof bleibt ganz, und er kehrt zurück, wenn die Wache wieder steht.

## 12. Debug (Abschnitt „Stadt ohne Schutz“, Strg+Umschalt+D)
- „Stufe +1 hier“: setzt `since` zurück und ruft `schutzDay`.
- „Frist vorspulen“: `since −= 5` für alle.
- „Übernahme erzwingen: Tote / Bande / Kette“ (die Kette nur, wenn `westRim`; sonst Toast warum).
- „Plünderer jetzt“.
- „Bandenherrschaft: Streife jetzt“.
- „Burgwache töten (als Spieler)“: alle `varonCourt`-Wachen in `varonburg` per `die`.
- „König-Flucht prüfen / zurücksetzen“.

## 13. Proben (mit `stage()`/`sandbox()`, `S.schutz`, `S.bands`, `S.war`, `S.flags`, `S.tribute`, `S.difficulty` gesichert und wiederhergestellt)
- **A „S2: Frist“:** Valen-Dorf, `lost = soll`, `schutzCheck` → 2. Dann `since = day − 2`, `schutzDay` → 3. Mit Angsthase und `since = day − 3` bleibt es 2.
- **B „S2: Gesetzlos wirkt“:** Stufe 3 → `ecoPrice(k, 'bread', true)` ≈ ×1,25 gegenüber vorher; `arrestCheck` liefert bei Kopfgeld `false`; ein `growthDay`-Lauf senkt `prosper` um mindestens 8 mehr als bei Stufe 0.
- **C „S2: Bandenherrschaft“:** Dorf ohne Kriegsknoten, Bande 40 Felder entfernt, Stufe 3, `since = day − 2` → `taker.by === 'band'` und `b.rules === k`. Anführer per `die` → `bandKill` → `taker` leer, `stage === 2`, `Z.lost` um `R[1]` gesunken. Ruf: +10 bei `byP = 0`, +0 bei `byP = lost`.
- **D „S2: Tote nur bei Kriegsknoten“:** Knoten mit einem Untotenheer 1 Kante entfernt → `a.order === k`. Heer mit `host` → kein `order`. Nicht-Knoten → Bande statt Tote.
- **E „S2: Kette nur im Westen“:** Valen-Dorf mit `westRim` → `taker.by === 'chain'`, `townFac(k) === 'chain'`, `S.tribute[k]` vorhanden. Ein östliches Dorf → Bande. `chainsBroken` → keine Kette. `townFac('eren')` bleibt `'valen'`.
- **F „S2: Varonheim“:** Stufe 3 und 10 Tage → nie `taker`. Danach Burgwache: 6× `die` als Spieler und Stufe ≥ 2 → `varonFled` gesetzt, `varonEvac === 1`, `ensureVaronExile` baut Exilhof-Figuren, `capitalFallen()` bleibt falsch. Rückkehr: Stufe 0, Burg `lost = 0`, 3 Tage → `varonFled` fehlt, `varonEvac === evac0`.
- **G „S2: alter Stand“:** `S.schutz.x = { lost: 5, stage: 3 }` ohne `since`/`taker`, `S.bands` ohne `rules`, `delete S.schutzBurg`, dann `applySave(saveData())` + `ensureSchutz` → kein Fehler, `since` gesetzt.
- **H „S2: Streife bricht Bande“:** Bandenherrschaft mit 6 Mann, `patrolAt = day`, 3 Streifen-Durchgänge → Bande `gone`, `taker` leer.

## 14. Einfachere Alternative
- **S2-light:** Stufe 3 Gesetzlos ganz, dazu Stufe 4 **nur als Bande**: keine Kette, kein Totenheer und keine Burgwache.
  - Das sind etwa 40 % des Aufwands.
- Was dabei verloren geht:
  - die freigegebene Lagelogik (Tote, Kette)
  - der Fix, dass die Burgwache beim Laden wieder aufersteht
- Den Burgwachen-Zähler (§5.2, etwa 5 Zeilen) sollte man **trotzdem** bauen. Er ist ein Fehler derselben Art wie vor S1.

## 15. Frage an den Entwickler (offen)
1. **Gilt „2 + 2 Tage (Angsthase +2, Sehr schwer −1)“ je Schritt oder für die Summe?**
   - *Empfehlung:* **je Schritt**. Angsthase 4 + 4, Schwer 2 + 2, Sehr schwer 1 + 1.
   - Begründung: Auf Sehr schwer fühlt sich die Stadt so wirklich verloren an (2 Tage), auf Angsthase bleibt eine Woche Rettungszeit.
   - Die Alternative „Summe“ (Angsthase 6, Sehr schwer 3) ist im Code dieselbe Zeile; nur die Funktion `schutzWait` ändert sich.
