# T10 — Ahnenfeind und Heldentod als Moment (A6 + D8)

**Status:** WAITING_FOR_DEVELOPER · **Autor:** Feature Designer (Agent 3) · **Stand:** 01.10.2026
Kennzeichnung: **FAKT** = belegt (Datei:Zeile), **VORSCHLAG**, **ANNAHME**.

## 1. Name und Konzept
**„Der Mörder des Hauses“** — Der Tod des Helden wird **sichtbar**: knapp zwei Sekunden Zeitlupe, die Kamera rückt heran, die Welt verstummt, der Mörder bleibt stehen. Dieser Mörder verschwindet danach nicht in der Chronik. Er wird zum **Ahnenfeind**: benannt, mit der Waffe des Toten in der Hand. Er wächst mit jeder weiteren Tat, hängt als Steckbrief am Brett und greift nach einiger Zeit Familie oder Siedlung an. Der Erbe kann Rache nehmen und das Erbstück zurückholen.

## 2. Gelöstes Problem
- `playerDeath` pausiert im selben Tick und öffnet den Todesbildschirm (FAKT `game.js:12780–12781`). Der Leichnam bekommt zwar einen Todesablauf (FAKT `personCorpse` `:3655`, Dauer 300–700 ms `anim.js:11–19`), aber der läuft nach Echtzeit (`render.js:2110`) hinter dem Pausenbild. **Der Tod selbst ist unsichtbar.**
- Der Mörder (`source`) fließt nur in Ursachentext und Chronik (FAKT `:12773–12779`). Es gibt keine Rache des Hauses (Teil A „Tod und Erbe“).

## 3. Warum es zu ROTFALL passt
Erbe und Generationen sind der Kern von ROTFALL (Ahnengrab, Epilog, Dynastie §5e). Eine Feindschaft über Generationen nutzt genau diese Teile: Grab und Erbstück, Steckbrief (T08), Gerüchte, Elites, Familienangriff. Der sichtbare Tod ist die Regieforderung aus `AGENT_SYSTEM.md` („Kamera, Timing, Reaktion der Umgebung, Klang“) im kleinsten möglichen Maßstab, ganz ohne Text in Balken.

## 4. Heutiges System (FAKT)
| Teil | Ort | Was es tut |
|---|---|---|
| Spieler stirbt | `die()` `:3574–3587` | `makeGrave` legt **alle** Ausrüstung und Tasche ins Grab (`:3665–3673`), `personCorpse`, Figur aus der Liste, dann `playerDeath` |
| Ausbluten | `:2769–2771` | `die(c, lastCause, lastKiller)`: `source` ist dann eine **id**, sonst ein Objekt |
| Ketten statt Tod | `captureInstead` `:6328–6333` | Kette und Sonnenklingen nehmen gefangen statt zu töten |
| `playerDeath` | `:12768–12784` | `_quiet`-Ausstieg, `morrFall`, Nachruf `rec`, Grab benennen, Chronik, `S.paused = true`, `UI.showDeath`, `coopHooks.hostDied`, `save()` |
| Erbe | `chooseSuccessor` `:12917`, `adoptSuccessor` `:12930–12965` | 70 % Gold, Fraktionen × 0,5, Erbe startet im Heimatdorf, Hinweis auf das Ahnengrab |
| Hauptschleife | `loop` `:2127–2137` | `hitStop` gibt es schon als globale Zeitsperre, `update(dt)` |
| Kamera | `camAim` `:8893–8909` | Zoom/Fokus je Shot über `S.cine` |
| Szenen | `cinematic`/`cineBars` `:8911–8946` | Balken, Abblende |
| Speichern | `state.js:141` (SKIP), `state.js:212` | während `S.cine` wird nicht gespeichert |
| Elites | `applyElite` `:1716`, `eliteTick` `:1729`, `eliteDrop` `:1735`, Steckbrief-Text `:6723` | benannte Mini-Bosse mit Kraft, Beute, Chronik |
| Bosse | `bossOf` `:1768` | Regionalbosse |
| Siedlungsangriff | `raidSettlement` `:10528` | Angreifer marschieren an |
| Stadtschaden | `raidDamage` `:5019`; Auftrag `defense` `conTick` `:7057–7063` | Abwesenheit → Häuser brennen |
| Familie | `S.legacy.spouse/children` `:12795–12820` | Ehepartner lebt im Heimatort |
| Benannte Waffen | `dayTick` `:10676–10682` | `w.kills`, `w.history`, Name ab Tötungszahl |
| Gesten | `ANIM_DEFS.gesture` `anim.js:21–23` | nur `zeigen`, `abwehren`, `achsel` |
| Koop | `coop.js:173` `hostDied` | Gäste warten auf die Erbenwahl |

## 5. Neues System (VORSCHLAG)

### 5.1 Heldentod als Moment (D8)
**Ablauf in `playerDeath`:**
- Alles bis zur Chronik bleibt, ebenso `save()` sofort. Der Tod ist damit gespeichert; Neuladen während der Zeitlupe bringt keinen Vorteil.
- Statt `S.paused = true` wird `S.dying = { t0: performance.now(), killer: id|null, rec }` gesetzt.
- `UI.showDeath` und `coopHooks.hostDied` laufen erst in `dyingEnd()` nach **1800 ms Echtzeit**.

**Zeitlupe:**
- `loop` ruft `update(dt × 0,25)`, solange `S.dying` gilt (Muster wie `hitStop`).
- Der Todesablauf der Heldenleiche wird gestreckt: `corpse.slow = 3`, und `render.js:2110` rechnet `age / (e.slow || 1)`. „Sturz“ (440 ms) dauert so 1,3 s.

**Kamera:** `camAim` bekommt einen Zweig `S.dying`. Zoom zielt auf 1,4, der Fokus liegt auf der Leiche. Steht der Mörder näher als 160 px, liegt der Fokus auf der Mitte zwischen beiden, sodass er im Bild bleibt.

**Stille:**
- Neues `sfx.duck(level, ms)` in sfx.js, etwa 6 Zeilen Gain-Rampe auf `master`. T28 ersetzt das später durch Busse.
- Die Umgebung fällt auf 20 %. Dazu kommt ein einziger dumpfer Ton aus vorhandenen Klängen (`hit`, tief).
- Gift und Erschöpfung: kein Wackeln (Regel `ANIMATION_REFERENZ §5`, FAKT-Zitat aus Teil C V8).

**Der Mörder:**
- In `updateEnemy` wird er angehalten (`vx = vy = 0`) und schaut zur Leiche. `gesture(k, 'zeigen', 1600, corpse)` (FAKT `gesture` `:8910`).
- Dazu eine Zeile als `float` je Art: Mensch „Bleib liegen.“, Untoter keine Zeile, dafür `rattle`, Tier ein Knurren-Klang.

**Schutz:**
- Gefährten sind unverwundbar: früher Ausstieg in `hurt()`, wenn `S.dying` und das Ziel zur Gruppe gehört.
- Es gibt keinen zweiten `playerDeath`: `if (S.dying) return`.
- `state.save()` ist gesperrt wie bei `S.cine`, und `'dying'` steht in `SKIP`.

**Überspringen:** ESC oder Leertaste rufen sofort `dyingEnd()`.

**Bleibt wie heute:**
- `morrFall` läuft wie heute am Anfang (T20 inszeniert das später).
- `captureInstead` (Kette) greift vorher und ist nicht betroffen.

### 5.2 Ahnenfeind (A6)
**Entstehung in `playerDeath`:** Der Mörder wird aufgelöst, `k = typeof source === 'object' ? source : byId(source)`. Ein Ahnenfeind entsteht nur, wenn alles zutrifft:
- `k?.kind === 'enemy' && k.alive`
- kein Boss, `!bossOf(k)`, kein `parley`
- `!k.goblinStorm`, nicht in einer Probe

Dann gilt:
```
S.nemesis = { id, mtype, name, title, lvl, weapon, kills: 1, region: fameRegion(k), tx, ty,
              since: S.day, next: S.day + ri(10, 20), victims: [p.name], elite: k.eliteKey || null }
```
- **Name:** Elites behalten ihren Namen. Sonst `${Vorname} ${Beiname}` aus einer kleinen Tabelle je Art: Mensch „der Vaterstecher“, Tier „Grauzahn“, Untoter „Knochenhand“.
- **Waffe:** `weapon` ist die Hauptwaffe des Toten. Sie wird **aus `grave.loot` entfernt**, behält ihr `history` und bekommt einen Eintrag: „Jahr N: genommen von X, über der Leiche von Y.“
- **Tiere** tragen die Waffe nicht sichtbar, sie „liegt in seinem Bau“. Fällt das Tier, fällt die Waffe trotzdem.

**Nur einer zur Zeit (VORSCHLAG):** Gibt es schon einen lebenden Ahnenfeind und tötet **er** den Erben, gilt `kills++`, `lvl += 2`, und `title` wird „Schrecken zweier Generationen“ (ab 2 Opfern). Dazu Chronik und Ruhm des Feindes. Tötet **ein anderer** den Erben, bleibt der alte Ahnenfeind; der neue Mörder wird nur Chronik. Siehe Frage 2.

**`ensureNemesis()`** (transient, Muster `bandTick`/Elites, aufgerufen in `newGame`/`continueGame` und im 400-ms-Weltschritt):
- Ist der Held näher als 45 Felder an `tx/ty` und der Ahnenfeind nicht da, wird er erzeugt: `spawnEnemy(mtype)`, `applyElite`-Werte (bzw. `elite`-Schlüssel), `e.nemesis = true`, `e.transient = true`, `e.weaponKey = weapon.key` (sichtbar in der Hand), dazu 2 Gefolgsleute (`conPool`).
- **Stufe** beim Erzeugen: `min(N.lvl, p.level + 3)` (Frustschutz aus A6).

**Wandern und Wachsen** (`nemesisDay()`, täglich):
- Alle 3–5 Tage zieht er zu einem Bandenlager oder POI seiner Region weiter (`tx/ty`, Log nur als Gerücht).
- Jede „Tat abseits“ (unten) bringt `kills++` und `lvl += 1`, gedeckelt bei Erbe + 3 beim Erzeugen.

**Angriffe** (ab `since + 10`, dann alle 10–20 Tage, `N.next`):
1. **Lebt Familie** (`S.legacy.spouse` oder Kinder, Heimatort bekannt): ein Bote meldet „X zieht gegen Eren, wo deine Familie lebt“. Es entsteht ein `defense`-Auftrag in dieser Stadt (vorhandene Art, `conTick` `:7057`) mit dem Ahnenfeind an der Spitze.
   - Abwesend: `raidDamage`, dazu 30 % ein Kind entführt. Daraus wird ein `missing`-Auftrag mit `twist:'captive'` (vorhanden, `:7067–7070`); der Entführer ist das Gefolge des Feindes.
   - Der Tod des Ehepartners nur nach Frage 3.
2. **Sonst eine Siedlung** (`S.settlement`): `raidAt` setzen, `raidSettlement` mit dem Ahnenfeind als Anführer.
3. **Sonst** ein Dorf der Region: Chronik, `raidDamage`, `kills++`.

**Steckbrief und Gerücht:**
- `postNemesis()` legt einen `bounty`-Auftrag `{ nemesis: true, alive: true }` (T08) in die größte Stadt der Region. Er erneuert sich, solange der Feind lebt, ohne Frist.
- In `contextLines` sagen Wirte und Wachen „Man sagt, X hält sich bei Y auf. Er trägt eine Klinge, die nicht ihm gehört.“

**Tötung oder Gefangennahme:** `nemesisSlain(e)` in `die()` neben `eliteDrop`:
- Die Waffe fällt mit allen Einträgen in `history` („Zurückgeholt von Erbe Z, Generation N“).
- Titel „Rächer des Hauses“, Ruhm +10 in der Region, Chronik „Rache des Hauses X“.
- `S.nemesis = null`, `S.nemesisPast.push(name)` für den Epilog.
- Mit T08 kann man ihn auch **lebend** abliefern (×1,5) oder in `captiveMenu` mit „[Rache] Für {Ahn}“ richten. Rache zählt **nicht** als Grausamkeit, weil sie dem Haus zusteht.

**Hinweise:**
- Im Nachruf (`rec.killer`, `rec.nemesis`): „Sein Mörder, X, trägt jetzt seine Klinge.“
- In der ersten Szene des Erben (`adoptSuccessor`): Toast „AHNENFEIND: X“ und eine Logzeile mit Ort.
- Am Ahnengrab (`graveTalk`) eine Zeile.

### 5.3 Ausnahmen (FAKT-basiert)
- Boss oder Regionalboss: kein Ahnenfeind.
- Umwelt, Hunger, Sturz, Gift ohne Quelle: kein Ahnenfeind.
- Wache oder Gesetz (`kind:'npc'`): kein Ahnenfeind; das bleibt Kopfgeld und Kerker.
- Kette: `captureInstead` greift vorher.
- Ein Mörder, der vor dem Ausbluten selbst fiel: `byId` liefert `null`, kein Ahnenfeind.
- Goblinsturm (`goblinStorm`-Verbündete): kein Ahnenfeind.
- **Koop:** Nur der Tod des Host-Helden (`S.player`) erzeugt einen Ahnenfeind. Stirbt eine Gastfigur, bleibt alles wie heute.

## 6. Spielererlebnis
Ragnar geht zu Boden. Alles wird langsam, die Schenkengeräusche verschwinden, die Kamera rückt heran. Hagen steht über ihm, hebt die Klinge, auf die Ragnar 40 Kills geschrieben hatte, und zeigt auf den Leichnam. Schwarz. Der Nachruf: „Sein Mörder, Hagen der Vaterstecher, trägt jetzt seine Klinge.“ Ragnars Sohn erbt. Am Brett in Nordfurt hängt Hagens Steckbrief. Zwei Wochen später kommt ein Bote: Hagen zieht gegen Eren, wo Ragnars Witwe lebt.

## 7. Entscheidungen des Spielers
- Sofort jagen (riskant, der Erbe ist schwächer) oder erst wachsen und dann jagen? Der Feind wächst aber mit.
- Familie schützen (Verteidigungsauftrag) oder in der Ferne bleiben und die Folgen tragen?
- Rache selbst nehmen, lebend der Wache übergeben (Gold und Gnadenruf) oder ihn nach dem Fesseln laufen lassen (das hätte Folgen)?
- Ignorieren ist erlaubt. Er wird dann eine regionale Legende.

## 8. Querwirkungen
- **NPCs:** Wirte und Wachen tragen das Gerücht. Gefährten des alten Helden bekommen beim Treffen `remember(m, 'nemesis', name)` und Moral +5 bei Rache.
- **Fraktionen:** Die Stadtherren der Steckbriefstadt zahlen. Rache bringt +3 bei `townFac`.
- **Wirtschaft:** Die Angriffe nutzen `raidDamage` (Häuser) und das `growth`-Wohlstandsmodell.
- **Kampf:** ein Elite mit gestohlener Waffe, gedeckelte Stufe, 2 Gefolgsleute.
- **Erkundung:** Er wandert zwischen Lagern, Gerüchte zeigen einen ungefähren Ort.
- **Darstellung:** Zeitlupe und Zoom verwenden `camAim` und den Todesablauf. Es entsteht kein neues Szenensystem; T17 (Regiebuch) kann später übernehmen.

## 9. Emergenz
- Ein Wolf, der den Helden riss, wird „Grauzahn“ und reißt im Winter (Wolfswinter) Vieh in der Region.
- Der Ahnenfeind tötet auch den Erben: „zwei Generationen“, er ist jetzt ein Regionalschrecken mit doppeltem Steckbrief.
- Eine entführte Tochter wird zum `missing`-Auftrag. Befreit man sie, kommt sie später als Erbin infrage, weil sie älter wird (`kidAge`).
- Mit T08: Man kann ihn lebend fangen und am Ahnengrab richten (eine Zeile im Epilog).

## 10. Risiken
- **Frust** (der Erbe ist schwächer): Stufe ≤ Erbe + 3, Angriffe frühestens nach 10 Tagen, ein Feind zur Zeit, er wandert nicht in Städte.
- **Zeitlupe:** In den 1,8 s darf nichts Folgenreiches passieren. Gruppe unverwundbar, kein Speichern, kein zweiter Tod, `S.dying` nicht im Stand.
- **ANNAHME:** Wird ein Stand **nach** dem Tod, aber **vor** der Erbenwahl geladen, ist die Lage schon heute ungeklärt (`continueGame` prüft `p.alive` nicht). Der Hunter prüft das; es ist nicht Teil von T10.
- **Gleichzeitige Systeme:** `hitStop`, `S.cine` (läuft eine Fahrt, wird sie zuerst beendet), `S.voyage` an Deck. Alle laufen in `update` mit gedrosseltem `dt` weiter, ohne Sonderfälle.
- **Proben:** `playerDeath` endet bei `_quiet` (FAKT `:12770`). Für Proben braucht es deshalb eine reine Funktion `nemesisFrom(k, p)` und ein separates `dyingStart()`, das man ohne `_quiet`-Sperre testen kann (Muster BUG-107).

## 11. Alternativen
- (a) Nur den Ahnenfeind, kein Moment. Der Mörder bleibt dann unsichtbar, und das Wiedererkennen fehlt.
- (b) Den Moment als volle Zwischensequenz mit Balken und Text (`cinematic`). Länger und textlastiger, widerspricht „nicht Figuren stehen, Text erscheint“.
- (c) Einen Ahnenfeind je Mörder, also mehrere gleichzeitig. Mehr Chaos, mehr Speicherlast; empfohlen ist einer.

## 12. Abhängigkeiten
- T01 (laut TASKS).
- **T08** liefert Steckbrief und Gefangennahme des Feindes. Ohne T08 geht nur „tot“.
- T28 (Busse) ersetzt `sfx.duck`.
- T17 (Regiebuch) kann den Moment später übernehmen.
- T20 nennt „Ahnenfeind bei Tod im Sturm“: Mit 5.3 entsteht dort keiner, außer der Entwickler will es (dann wäre Varg bzw. ein Kettenkrieger der Mörder).

## 13. Aufwand
Mittel: D8 ungefähr 60 Zeilen (game.js, render.js 1 Zeile, sfx.js 6 Zeilen), A6 ungefähr 150 Zeilen.

## 14. Mögliche Exploits und Gegenmittel
| Exploit | Gegenmittel |
|---|---|
| Absichtlich sterben, um eine starke Waffe beim Feind „zu parken“ und den Erben damit zu belohnen | Die Waffe kehrt nur zurück; es gibt kein Bonusgold außer Steckbrief und Ruhm. Der Erbe verliert 30 % Gold und den halben Ruf |
| ESC in der Zeitlupe drücken, um den Tod zu umgehen | ESC beendet nur die Darstellung, der Tod ist längst gespeichert |
| Mehrfach-Spawn durch Kartenwechsel (Feind „heilt“) | Er ist transient, aber `S.nemesis.hp` wird beim Entladen festgehalten (Muster Elites/`bandTick`) |
| Gefangenen Feind (T08) abliefern **und** Waffe behalten | Beim Fesseln fällt die Waffe sofort (wie beim Entwaffnen) |

## 15. Daten- und Codeplan
- **game.js:**
  - D8: `dyingStart(killer, rec)`, `dyingEnd()`, `loop` (dt-Faktor), `camAim` (Zweig), `hurt()` (Schutz), `updateEnemy` (Mörder steht), Tastenhandler (ESC)
  - A6: `nemesisFrom(k, p)`, `ensureNemesis()`, `nemesisDay()`, `postNemesis()`, `nemesisSlain(e)`
  - Hooks in `playerDeath`, `die()`, `adoptSuccessor`, `contextLines`, `graveTalk`
  - Debug-Einträge
- **render.js:** `age / (e.slow || 1)` (`:2110`).
- **sfx.js:** `export function duck(level, ms)`.
- **state.js:** `'dying'` in `SKIP`; `save()` gesperrt, wenn `S.dying`.
- **ui.js:** `showDeath` zeigt `rec.killer`.
- **Neue Speicherfelder (optional, fehlen → nichts passiert):**
  - `S.nemesis` (`{ … }` oder `null`)
  - `S.nemesisPast` (Liste von Namen)
  - `rec.killer`, `rec.nemesis` in `ancestors`
  - `C.nemesis` an Aufträgen
- **Debug** (Abschnitt „Tod & Erbe“):
  - „Heldentod abspielen (ohne Folgen)“: `dyingStart` mit Attrappe, ohne `playerDeath`
  - „Ahnenfeind aus nächstem Gegner erzeugen“
  - „Ahnenfeind herbeirufen“
  - „Ahnenfeind greift jetzt an“
  - „Ahnenfeind löschen“
- **Hinweise im Spiel:**
  - Nachrufzeile
  - Toast und Log beim Erben
  - Steckbrief
  - Gerüchtezeile
  - Bote vor Angriffen
  - Zeile am Ahnengrab
  - Eintrag `docs/MECHANIKEN.md`
- **Selftest-Proben:**
  1. `nemesisFrom(bandit, p)` → `S.nemesis` gesetzt, die Waffe des Helden steht in `S.nemesis.weapon` und nicht in `grave.loot`.
  2. Mörder Boss, Mörder `kind:'npc'` (Wache), `source = null` → kein Ahnenfeind.
  3. Mörder als id (Ausbluten) wird aufgelöst.
  4. Speichern/Laden mit `S.nemesis` → `ensureNemesis` erzeugt ihn in Reichweite genau einmal, Stufe ≤ Held + 3.
  5. `nemesisSlain` → Waffe fällt mit Eintrag in `history`, `S.nemesis === null`, Titel vergeben.
  6. Zweiter Tod durch ihn → `kills === 2`, Titel „zwei Generationen“.
  7. `nemesisDay` vor Tag `since + 10` → kein Angriff; danach mit Ehepartner → `defense`-Auftrag in dessen Stadt.
  8. D8: `dyingStart` → `UI`-Todesbild erst nach ≥ 1500 ms (über `RF.tick` bzw. Uhr-Attrappe), Gruppe nimmt keinen Schaden, `dyingEnd` ruft `chooseSuccessor` genau einmal, ESC auch nur einmal.
  9. `S.dying` steht nicht im `saveData()`.
  10. Alter Stand ohne Felder lädt.

## 16. Scheiben
1. **S1 Heldentod (D8):** Zeitlupe, Zoom, Stille, Mörder steht, Schutz, ESC, Speichersperre. Proben 8, 9. Für sich spielbar, ohne A6.
2. **S2 Ahnenfeind entsteht:** `nemesisFrom`, Waffe aus dem Grab, Nachruf und Hinweis beim Erben, `ensureNemesis`, `nemesisSlain`. Proben 1–6, 10.
3. **S3 Er lebt in der Welt:** `nemesisDay` (Wandern, Wachsen, Angriffe auf Familie/Siedlung/Dorf, Entführung als `missing`), Gerüchte. Probe 7.
4. **S4 Steckbrief** (nach T08 S2): `postNemesis`, lebend abliefern, „[Rache]“ im Gefangenen-Menü.

## 17. Fragen an den Entwickler (höchstens 3)
1. **Wie lang ist der Heldentod?**
   - (A, empfohlen) 1,8 s Zeitlupe, überspringbar mit ESC.
   - (B) Kürzer, 1,0 s.
   - (C) Länger, 3 s, mit eigenem Glockenton und Namenseinblendung.
2. **Wenn ein anderer Gegner den Erben tötet, während schon ein Ahnenfeind lebt:**
   - (A, empfohlen) Der alte bleibt der einzige Ahnenfeind, der neue Mörder steht nur in der Chronik.
   - (B) Der neue ersetzt den alten.
   - (C) Mehrere Ahnenfeinde gleichzeitig (höchstens 3).
3. **Wie hart sind Angriffe auf die Familie, wenn man nicht hilft?**
   - (A, empfohlen) Häuser brennen, und mit 30 % wird ein Kind entführt. Daraus wird ein Befreiungsauftrag, niemand stirbt sicher.
   - (B) Härter: Auch der Ehepartner kann sterben (20 %).
   - (C) Milder: nur Häuserschaden und Chronik.
