# control_to_director

FROM: Control (Agent 9, Opus) · TO: Director · 01.10.2026, zweite Prüfung
TASK: Urteil über alle TESTING/IMPLEMENTED-Aufgaben (T01, T02, T04–T10, RB-008, RB-012 … RB-026) für den [VERIFIED]-Commit.
Grundlage: Commits c0174b3 … 6e91074. Geprüft wurde HEAD 6e91074; `src/` war sauber (keine Änderung im Arbeitsbaum). Dazu Hunter 3–5 (`bug_to_implementation.md`), eigener Tab tab-40 (inzwischen geschlossen), ein Selbsttestlauf und eigene Live-Messungen.

Kennzeichnung: **FACT** = selbst geprüft (Code oder live) · **CLAIM** = Aussage eines Agenten, nicht nachgeprüft · **ASSUMPTION** = eigene Vermutung · **RECOMMENDATION** = Vorschlag.

Maßstab für VERIFIED:
- (a) frischer grüner Selbsttest;
- (b) ein Hunter-Bericht ohne offenen Fehler, oder Fehler, deren Behebung belegt ist;
- (c) Code und Behauptung stimmen überein, und eine Probe würde scheitern, wenn das Feature bricht.

Zusatzregel dieser Prüfung: Fixes für Fehler der Schwere MEDIUM, HIGH oder CRITICAL brauchen eine Regressionsprobe, wenn sie sich billig automatisieren lässt. Für Speicher- und Async-Pfade (der Selbsttest läuft synchron und darf nicht in den Speicher schreiben) reicht ein dokumentierter Live-Nachweis.

---

## SYSTEM STATUS

- FACT: Selbsttest frisch geladen auf 6e91074: **340/340**, 44 s, keine Fehler in der Konsole. `?v=23` ist überall gesetzt: 14 Dateien, `coop.js VER = 23`, Hauptmenü „v23“. Echter Stand vor und nach den Tests gleich `rotfall.backup.s14c` (Byte-Vergleich).
- FACT: Die Zahl der Proben hängt nicht vom Zufall ab, sondern vom Commit: 607a07e = 337, 069ed56 = 339, 6e91074 = 340 (statisch gezählt). Hunter 5 schrieb den Sprung von 337 auf 339 dem Zufall zu. In Wahrheit lief sein zweiter Lauf schon mit T10-Code (Commit 04:02). Der Hunter hat also wieder auf einem Baum getestet, der sich während der Prüfung änderte.
- FACT: Im Arbeitsbaum liegt jetzt WIP für die Belagerung Scheibe 1 (`docs/MECHANIKEN.md`, `docs/CHANGELOG.md`, laut Text auch eine „angepasste Audit-T02-Probe“). Meine Urteile gelten für 6e91074, nicht für diese WIP.
- FACT: `origin/main` steht auf 283697f (= c0174b3, Blutkult S1). Das wurde vor dem Nutzerentscheid „main nur [VERIFIED]“ gepusht, ist also kein Verstoß.
- FACT: `rotfall.slot.active` stand während meiner Prüfung auf **`zhunt6`**, einem Testplatz. Es gab auch die Testplätze `zdeath2` und `cmunv0up6` (nicht von mir angelegt, vermutlich Hunter 6 für T10). Wer jetzt das Spiel öffnet, landet im Testplatz. Siehe TECHNICAL RISKS 1.

## VERIFIED WORK

| Punkt | Urteil | Beleg |
|---|---|---|
| **T01** A1 Wucht mit Standfestigkeit | **VERIFIED** | FACT: `poised0` wird vor `hurt()` gelesen. Kombo-Wuchtschlag setzt `poiseUntil` 700 + 1200. Probe „Audit A1“: Hammer ≥ 600 ms, dann 0; Dolch-Wuchtschlag nur einmal. Die Probe scheitert, wenn die Reihenfolge zurückfällt. Hunter 3: kein Befund. Rest (nicht blockierend): Debug „Wucht-Test“, BALANCE.md-Zeile, Boss = 300 ms ohne Probe. |
| **T02** Krieg mit Nachschub + Gegengewicht | **VERIFIED** (mit Doku-Auflage) | FACT: Debug „Krieg 10 Tage vorspulen“ ist da. Probe „Audit T02“ prüft „Heer nur in eigener Stadt“ und den Entsatz. Hunter 3 stuft sie als ausreichend ein. Auflage A1/A2 unten. Achtung: Die Belagerungs-WIP ändert Entsatz und Probe, nach dem Belagerungs-Commit also neu prüfen. |
| **T04** Effekte, Zufall, Klang | **VERIFIED** | FACT: Probe „Audit T04“: `fx`/`float` ziehen nicht aus `rnd()`, Partikeldeckel hält, Nachbild und Schleier stehen in `FIXED`. RB-005 (Held im Geistpartikel) hat keine automatische Probe. Billig geht das nicht: ein ES-Modul-Namensraum lässt sich nicht bespitzeln. Der Code-Fix ist von Control geprüft (letzte Prüfung). Float-Bündelung und `ambienceKind` sind DEFERRED (Auflage A2). |
| **T06** Spielstand komprimiert, Caches, HUD | **VERIFIED** | FACT: Alle früheren NEEDS-FIX-Punkte sind erledigt. `saveBusy` ersetzt `inFlight`. `flushSave` prüft `guardSave()` nach dem `await` (Import-Wettlauf). „Speichern“ und „Beenden“ schreiben komprimiert über `saveCompressed`, „Beenden“ setzt danach `_quiet`. CHANGELOG ist da. Ohne automatische Speicherprobe; das ist begründet (Async/Speicher), der Nachweis liegt live bei Control (Prüfung 1) und im Code bei Hunter 3. Vorwärmen ist DEFERRED (A2). |
| **RB-008** Slotwechsel | **VERIFIED** | FACT: `setSlot` schreibt bei `saveTimer \|\| saveBusy` sofort in den alten Platz. Der Rest bei `deleteSlot` ist ein neuer Fehler (LOW), siehe RB-028 unten. |
| **T07 Scheibe 1** Vampir | **VERIFIED** | FACT: RB-013 ist behoben (Schadensart `sun` trifft den Rumpf). Die Probe verlangt jetzt ≥ 5 von nominell 6 Schaden in 5 s; bei Rückfall kämen ≈ 3,7 an, die Probe scheitert. Heilung „beliebig oft“ (Nutzerabweichung) ist umgesetzt und geprobt (`again`). Trinken an Gefährten folgt dem Lead-Entscheid nach Entwurf §15 (Beziehung −20, Moral −15, beim zweiten Mal geht er). Hinweise (`vampHint`), Debug und MECHANIKEN sind da. |
| **RB-013** Sonnenbrand verwässert | **VERIFIED** (nur Sonne) | FACT: siehe oben. Der allgemeine Teil (Gift, Feuer, Blutung verwässern genauso, Hunter 3) steht in keiner Datei. Neuer Eintrag RB-033 nötig. |
| **RB-014** Kult-Folgen bei fernem Tod | **VERIFIED** | FACT: Die Haken stehen vor dem `dist < 700`-Block. Die Probe S4 tötet Aldhelm etwa 1000 px vom Probehelden entfernt (`stage()` bei 300/300, Aldhelm bei Kachel 40/12). Sie prüft damit genau den fernen Pfad. Hunter 4 hat das live bestätigt (1586 px). |
| **RB-015** Licht während Unverwundbarkeit | **VERIFIED** (LOW, Code) | FACT: `!e.invuln` in der Lichtschacht-Bedingung. |
| **RB-017** Feld `captive`-Kollision | **VERIFIED** | FACT: T08 nutzt nur `prisoner`. `takeable` schließt `e.captive` aus. Selbsttest grün. CLAIM (Engineer und Hunter 5): Die Eisenmark-Konvoi-Probe deckt die Kollision ab. |
| **RB-018** `acceptContract` ohne Rückgabe | **VERIFIED** | FACT: Probe „T08 Verhör“ verlangt den Auftrag `active`. Fällt der Fix zurück, wird der Auftrag entfernt und die Probe scheitert. |
| **RB-022** Proben sichern Stadtlager/Zoll | **VERIFIED** | FACT: `tw`/`tm` stehen in den Sicherungen. BUG-123 ist grün. |
| **RB-024** Gefesselte ohne Anker (CRITICAL) | **VERIFIED** | FACT: Probe „RB-024“ (Laufen lassen, 20× `updateEnemy`, Anker ≠ null). Live geprüft: der zweite Weg (Losreißen über `lostT`) setzt den Anker, `RF.tick` 6 s lang ohne Fehler. |
| **RB-025** Versionslabel | **VERIFIED** | FACT: Das Hauptmenü zeigt live „v23“. |

## UNVERIFIED WORK / NEEDS FIX

### T05 Kleine Korrekturen · **PENDING (Hunter fehlt)**
- FACT: Der Control-Teil ist in Ordnung. Probe „Audit T05“, Debug „Führung +10“, CHANGELOG-Zeile, CLAUDE.md-Satz zu Stil F; Stil F ist vom Nutzer bestätigt.
- FACT: Es gibt **keinen** Hunter-Bericht zu T05 (Hunter 1–5 nennen es nicht). Damit fehlt Bedingung (b). Klein: Die EYE_ZAP-Probe fehlt weiter.
- RECOMMENDATION: kurzer Sonnet-Hunter-Lauf (≈ 15 min). Danach VERIFIED ohne weitere Control-Runde, wenn kein Befund kommt.

### T07 Scheibe 2 · **NEEDS FIX** (nur Probe)
- FACT: Der RB-020-Fix ist im Code korrekt: `cultTake` filtert `!C.missing.some(m => m.ent.id === c.id)`. **Es gibt keine Regressionsprobe**, obwohl Hunter 4 sie verlangt hat.
- Fix: In Probe S2 (oder S3) entführen, `cultFree`, dann `cultTake()` bis zum Deckel. Die befreite `id` darf nur einmal in `S.cult.missing` stehen.

### T07 Scheibe 3 · **NEEDS FIX** (nur Probe)
- FACT (live): Hedda hat genau `blutphiole×3`, auch nach erneutem Würfeln. RB-019 ist also behoben. **Es gibt keine Regressionsprobe.**
- Fix: In Probe S3 nach dem Beitritt `shopStock(hed)`; die Summe der Phiolen muss `=== 3` sein.

### T07 Scheibe 4 · **NEEDS FIX** (klein)
1. FACT: MECHANIKEN S4 sagt „Ein Vampir-Spieler brennt dort auch“ (im Lichtschacht). Entwurf §236/§291 will das ebenso. **Es ist nicht gebaut.** `sunOn()` gibt in `katakomben` immer 0, und `lightShaft` wird nur in `aldhelmAI` gelesen. Neuer Fehler **RB-030** (LOW–MEDIUM). Fix: In `sunOn`, wenn `c.map === 'katakomben'`, es Tag ist und ein `lightShaft` näher als 46 ist, 1 zurückgeben. Sonst den MECHANIKEN-Satz streichen.
2. **RB-021 · NEEDS FIX (Doku + Balance-Entscheid).**
   - FACT, live mit 8 Seeds nachgemessen: Die Siegzahlen stimmen (Stufe 16: 4/8, Stufe 17: 6/8, Stufe 18: 5/8).
   - FACT: „Stufe 18 ⌀ 45 s“ ist **nicht reproduzierbar**. Gemessen: ⌀ 24,9 s über die Siege.
   - FACT: 25 % der Läufe auf Stufe 17/18 hängen bis 180 s, mit etwa 2 % Bossleben und erschöpftem Simulationshelden. Das ist ein simFight-Artefakt und bestätigt die Bemerkung von Hunter 4.
   - FACT: Gegen `BALANCE_GUIDE.md` §5 (40–180 s, ≥ 2/3 Siege bei empfohlener Stufe) verfehlt Aldhelm auf Stufe 16 Zeit (23 s) und Siegquote (50 %).
   - RECOMMENDATION: BALANCE.md-Zeile korrigieren. Der Kampf-/Balance-Spezialist entscheidet zwischen „empfohlene Stufe 17–18“ und „Grundleben 380–420, Schaden 18“, bestätigt durch einen echten Spieltest, weil simFight für Phasenbosse nicht taugt.

### T07 Scheibe 5 · **NEEDS FIX**
1. FACT: Nach der **Erpressung** ist das Rote Siegel weg. `cultSealRite` gibt kein zweites. König und Ysmay brauchen das Siegel. Damit kann ein Spieler, der nicht im Kult ist, Aldhelm **nie mehr enthüllen**, und der Ausgang „zerschlagen“ ist dauerhaft verloren. MECHANIKEN S5 sagt dagegen: „kann weiterhin enthüllt und getötet werden“. Neuer Fehler **RB-031** (MEDIUM). Siehe DEVELOPER DECISIONS 1.
2. FACT: Der `afterSay`-Text der Roten Krönung sagt „Nachts herrscht Ausgangssperre in Varonheim“. Die Mechanik fehlt (sie steht als vereinfacht in CURRENT_TASKS). Das ist ein Versprechen an den Spieler ohne Wirkung. **RB-032** (LOW): Satz streichen oder bauen.
3. FACT: `cultWar()` (§5g.8) wird von keiner Spiellogik gelesen; der Fall Aurelions ist T40. MECHANIKEN S5 beschreibt es als geltende Regel. Auflage A3: „(wirkt ab T40)“ ergänzen.
- FACT, positiv: „Rote Krönung nicht auf Angsthase“ stimmt (`afterHeals()` = nur Angsthase). Damit ist Hunter 5s UNVERIFIED-Punkt erledigt. Die Krönung setzt `varonDead` direkt, ohne `die()`. RB-023 wird hier also **nicht** ausgelöst.

### T08 Gefangene, Steckbriefe, Ruf der Klinge · **NEEDS FIX**
1. **Neuer Fehler RB-027 (MEDIUM, Designkonflikt).**
   - FACT: Der Nutzer hat entschieden: „ab Schlächter ergibt sich niemand mehr“. MECHANIKEN („als Schlächter nie“) und der Tooltip im Heldenfenster sagen dasselbe.
   - FACT: Der Code `chance(0.4 * clamp(1 + sty/100, 0, 2))` ergibt bei −60 noch 16 %, bei −80 noch 8 %, null erst bei −100. Der Entwurf §88 hat sich in der Formel verrechnet.
   - Fix: `sty <= -60 ? 0 : 0.4 * clamp(…)`. Probe: Klinge −70 → Kapitulationschance 0 (die Formel als kleine Funktion herausziehen und direkt prüfen).
2. FACT (live): Der RB-026-Fix wirkt. Automat E-40 (Aurelheim) bietet „Gefangene abliefern (1)“ und zahlt 24 Gold. **Es gibt keine Regressionsprobe** (MEDIUM, Hunter 5 hat sie verlangt). Fix: `actor({robot:true, guard:true})` neben einen Gefangenen stellen, `talk()`, die Option muss da sein.
- FACT, positiv: Fesseln, Folgen, Abliefern, Lohn ×1,5, Verhör und Tagesdeckel der Klinge sind geprobt. Debug, MECHANIKEN und Hinweise (Toast und Log beim ersten Fesseln) sind da.

### T09 Läden am Stadtlager · **NEEDS FIX (Lead-Entscheid)**
- FACT: Der Code entspricht dem Entwurf. Probe „T09“ ist stark (Leitware, 0,7/1,8, −0,5 je Kauf, Zoll nur Aurelion, kein `S.prices`). Hinweise (`priceNote`, „Teuerung hier“), Debug und MECHANIKEN sind da.
- **Neuer Fehler RB-029 (MEDIUM, Exploit, nicht im Entwurf §14).**
  - FACT (Formel): Kauf kostet Wert × baseMul × (1,35 − 0,3·Handel). Verkauf bringt Wert × baseMul × (0,45 + 0,25·Handel). Verkauf füllt das Lager nicht auf, und Händler haben kein Goldlimit.
  - Rechnung „billig kaufen (0,7×), teuer verkaufen (1,8×)“: ab Handel ≈ 30 etwa +7 % je Stück, bei Handel 100 etwa +71 %, **unbegrenzt**. Vor T09 gab es keine Ortsspanne.
  - ASSUMPTION: Erst im mittleren Spiel relevant.
  - Optionen für den Lead: (a) Verkauf einer Leitware hebt das Lager der Stadt um 0,25, die Spanne schließt sich selbst; (b) beim Verkauf `baseMul` auf höchstens 1,25 deckeln; (c) bewusst als Handelsweg annehmen und das in LEAD_DECISIONS festhalten. Dann wird T09 ohne Code VERIFIED.
- FACT (live, echter Stand, Tag 4): Eren, die Startstadt, steht bei Tuch, Korn und Leder auf ×1,8, bei Fleisch auf ×1,79, bei Waffen auf ×1,39. Über alle Städte liegen 13 von 168 Werten am oberen Deckel. Damit ist Hunter 5s „Starterpreise UNVERIFIED“ jetzt gemessen. ASSUMPTION: teils Folge dieses Stands (Flüchtlings-Ereignis zieht Korn aus Eren). RECOMMENDATION: an einem neuen Spiel nachmessen; wenn Eren dort auch am Deckel liegt, die Startlager anheben.
- FACT: RB-010 ist weiter offen. `economy.js:284` liest `S.laws.toll`, das `applyLaw` sofort löscht, der Code ist also tot. Kein falsches Versprechen an den Spieler (Gesetzestext: „mehr Händler, billigere Waren“). LOW. Zeile entfernen oder an `S.tollMul < 1` hängen.

### T10 Ahnenfeind und Heldentod · **PENDING (Hunter 6 läuft)**
- Ohne Hunter-Bericht kein Urteil.
- FACT (Code): Die Nutzerabweichungen sind umgesetzt: 3 s Echtzeit (`performance.now() − t0 > 3000`), Totenglocke, Name, Haus und Generation im Bild, ESC/Leertaste überspringen, höchstens 3 Ahnenfeinde, Kind zu 30 % entführt mit Auftrag. Zwei Proben sind vorhanden.
- Hinweise für Hunter 6:
  1. RB-011: Neu laden während der 3 s; der Stand ist vorher gespeichert.
  2. Ein Tod bei `S.paused` bleibt im Moment hängen, weil `dyingEnd` nur in `update()` läuft (ASSUMPTION).
  3. Ist die Leertaste auch die Ausweich-/Angriffstaste? Dann überspringt Panikdrücken den Moment (ASSUMPTION).
  4. `cultHeroDied()` steht in `playerDeath` **vor** dem `_quiet`-Schutz. Proben können also `S.cult` ändern (LOW).

### Neue Fehler ohne Aufgabe
- **RB-028 (LOW)** `state.js deleteSlot`: Löscht man den aktiven Platz, während ein Speichern aussteht, schreibt `setSlot('legacy')` → `saveSync()` in den eben gelöschten Schlüssel (2,4-MB-Leiche). Das stand schon in der letzten Prüfung und ist nicht behoben. Fix: in `deleteSlot` bei `SLOT === id` erst `clearTimeout(saveTimer); saveTimer = 0; saveGen++`, dann löschen.
- **RB-033 (MEDIUM, Systems-Entscheid)**: Gift-, Feuer- und Blutungsschaden ohne Angreifer verteilt sich weiter auf Glieder und kommt nur zu ≈ 60 % an (allgemeiner Teil von RB-013, Hunter 3). Das muss in BUG_DATABASE; Kampf/Systems entscheiden, ob `!source` → Rumpf gelten soll.

### RB-012 Kutschen-Probe · **offen, kein Urteil**
- FACT: Der Status ist weiter IN_DEVELOPMENT, es ist nur Diagnose (`KDBG`) eingebaut. In meinem Lauf war die Probe grün.

### RB-023 Varons Tod → Valen −100 egal durch wen · **OPEN, kein Urteil**
- FACT: Nicht behoben, gehört zur Belagerung. Muss spätestens vor Scheibe 2 erledigt sein (Exilhof, Königstod-Pfade).

## ROLE VIOLATIONS

- FACT: Hunter 5 hat auf einem Baum getestet, der sich während der Prüfung änderte (T10-Code im zweiten Lauf), und den Unterschied falsch dem Zufall zugeschrieben. Kein Schaden, aber ein falscher Satz in einem Prüfbericht. RECOMMENDATION: Hunter prüfen in einem `git worktree` auf festem SHA und nennen den SHA im Bericht.
- FACT: Die Hunter vergeben eigene RB-Nummern, die von BUG_DATABASE abweichen: Hunter 4 RB-017/018 = DB RB-019/020; Hunter 5 RB-023/024/025 = DB RB-024/025/026. RECOMMENDATION: vorläufige IDs („H5-1“), die DB vergibt die Nummer.
- FACT: Fixes für RB-019, RB-020 und RB-026 wurden **ohne** die vom Hunter verlangte Regressionsprobe als TESTING gemeldet. Das verletzt die Fehlerkette (behoben → getestet → Regression getestet).
- FACT: Ein Agent hat `rotfall.slot.active` auf einen Testplatz gestellt und nicht zurückgesetzt (zum Zeitpunkt meiner Prüfung). Das verstößt gegen „Tests ändern nie den echten Spielstand“, mindestens gegen dessen Absicht.
- FACT: `docs/audit/STATUS.md:6` sagt weiter „Hunter … behebt klare Fehler“. Das widerspricht `AGENT_SYSTEM.md` und stand schon in der letzten Prüfung. Erledigt ist dagegen: Lead-Entscheide stehen jetzt in `LEAD_DECISIONS.md`.

## DESIGN CONFLICTS

- **T08 Schlächter** (Nutzerentscheid A): Es ergeben sich weiter 8–16 % (RB-027). Konflikt mit einer ausdrücklichen Nutzerentscheidung, deshalb NEEDS FIX.
- **Heilung beliebig oft**: konform (FACT, Probe `again`).
- **Heldentod 3 s mit Glocke / bis 3 Ahnenfeinde**: im Code konform (FACT). Urteil folgt nach Hunter 6.
- **Varonheim-Belagerung**: In 6e91074 nicht enthalten; die WIP läuft. FACT: Die WIP-Doku nennt Heerzug 70/80, Fluchtziel Salzhafen → Nordfurt → Eren und 4 Wellen. Das passt zu den Nutzerentscheiden. „Keine Selbstheilung auf Schwer/Sehr schwer“ habe ich in der WIP nicht geprüft.
- **Blutkult Entwurf vs. Bau**: Vampir im Lichtschacht (RB-030), Ausgangssperre und Knechte-Garde bei `ruling` (RB-032) und Erpressung ohne Rückweg (RB-031) weichen vom Entwurf oder von MECHANIKEN ab.
- **Aldhelm vs. BALANCE_GUIDE §5**: 23 s und 50 % Siege bei empfohlener Stufe 16 (RB-021).

## TECHNICAL RISKS

1. **Gemeinsamer localStorage über Agenten-Tabs** (HIGH für den Nutzer): `slot.active = zhunt6` und fremde Testplätze. Öffnet der Nutzer das Spiel, lädt es einen Testplatz. RECOMMENDATION: Hunter 6 setzt am Ende `slot.active = legacy` und löscht `zdeath2`/`zhunt6` (und `cmunv0up6`, falls es seiner ist; sonst klären). Regel in AGENT_SYSTEM: Test-Plätze immer aufräumen.
2. Belagerungs-WIP ändert die Probe „Audit T02“ und die Entsatzlogik. Das T02-Urteil gilt nur für 6e91074.
3. `simFight` taugt für Phasenbosse nicht: 25 % Hänger, Garmadon mit 0 Treffern in 180 s (FACT, gleiches Bild wie bei Hunter 4). Balance-Aussagen zu Phasenbossen nur mit Spieltest.
4. Aus der letzten Prüfung offen: `UNZ` hält alle entpackten Stände (auch Sicherungen) im Speicher (ASSUMPTION ~50 MB). Die Zählung `cacheStat.clears` passt nicht mehr zum TASKS-Test.
5. T09: Startstadt teuer (siehe oben), Arbitrage (RB-029).

## REGRESSIONS

- FACT: Keine. 340/340, keine Konsolenfehler. Laden, Speichern und Slot-Pfade sind seit der letzten Prüfung im Code nur verbessert.

## ROADMAP PROBLEMS

- **Veröffentlichung:** Ein [VERIFIED]-Commit veröffentlicht den ganzen Baum. `game.js` trägt T05 und T10 (ungeprüft) und alle NEEDS-FIX-Punkte mit. Einzelne Aufgaben lassen sich nicht getrennt auf `main` bringen. Siehe BLOCKERS.
- DEFERRED-Reste stehen nur in `CURRENT_TASKS.md`, nicht in `docs/audit/TASKS.md` und nicht in `LEAD_DECISIONS.md`: T02 Leichen/Orden-Heer/Köpfe, T04 Float/`ambienceKind`, T06 Vorwärmen, T07 Beschatten/Kult-Aufträge/Tagebuch/Fledermausschwärme/Ausgangssperre, T08 Banden-Steckbrief/Kerker/Wachen, T10 Siedlungsangriff/Gerücht. Das ist ehrlich vermerkt, aber nicht dauerhaft (Auflage A2).
- `MASTER_STATE.md` ist inzwischen aktualisiert (340/340). In `CURRENT_TASKS.md` ist die RB-012-Zeile kaputt (doppelte Zellen).

## STAGNATING TASKS

- RB-012: seit der ersten Prüfung ohne Ursache, nur Diagnose. RECOMMENDATION: Hunter fährt 5 Läufe, sammelt `KDBG` und entscheidet dann.
- RB-010: offen seit Beginn, an T09 geparkt, T09 ist fertig. Klein, sofort erledigbar.
- T05: seit 02:04 ohne Hunter.
- RB-023: OPEN, nötig vor Belagerung Scheibe 2.

## BLOCKERS

- **BLOCKED BY CONTROL: Push auf `main`**, bis jede Aufgabe im veröffentlichten Commit VERIFIED ist. Das setzt den Nutzerentscheid „main nur geprüfte Stände“ durch, es überstimmt ihn nicht. Heute fehlen: T05 (Hunter), T10 (Hunter 6), die NEEDS-FIX-Punkte von T07 S2–S5, T08, T09 und die Auflagen A1–A3.
- Der Push-Commit darf **keine** Belagerungs-WIP enthalten. RECOMMENDATION: Die Fixes auf 6e91074 setzen und vor der Belagerung committen, oder per `git push origin <sha>:main` einen festen SHA pushen.

## DEVELOPER DECISIONS REQUIRED

1. **Erpressung im Blutkult (RB-031):** Nach dem Erpressen ist das Siegel fort. Soll das den Weg „Kult zerschlagen“ für Nicht-Mitglieder **für immer** schließen (harte Folge), oder gibt es einen zweiten Beweis? RECOMMENDATION: zweiter Beweis. Zum Beispiel holt das Archiv nach der Erpressung neue Briefe („An den Kelch …“), oder Ysmay glaubt dir nach dem nächsten verschwundenen Bürger auch ohne Siegel. Bis zur Entscheidung: MECHANIKEN-Satz an das echte Verhalten anpassen.

(Für den Lead, nicht für den Nutzer: RB-029 Arbitrage, RB-021 Aldhelm-Balance, RB-033 Dauerschaden. Eskalation nur, wenn der Lead „Handel als Spielweise“ ausdrücklich will.)

## RECOMMENDATIONS (Reihenfolge)

1. **Engineer, ein Commit auf 6e91074, vor der Belagerungs-WIP:**
   - (a) RB-027: Schlächter-Kapitulation = 0, mit Probe;
   - (b) Proben für RB-019, RB-020 und RB-026;
   - (c) RB-030: Vampir im Lichtschacht, oder den Satz streichen;
   - (d) RB-032: Ausgangssperre-Satz;
   - (e) RB-028: `deleteSlot`;
   - (f) RB-010: Zeile entfernen oder an `tollMul` hängen;
   - (g) Auflagen A1–A3.
2. **Auflagen (nur Doku, keine neue Control-Runde nötig):**
   - **A1** MECHANIKEN:635: „Deckel 110 (auf Angsthase 80)“ statt „80, auf Schwer 110“ (Schwer ist die Grundstufe).
   - **A2** DEFERRED-Reste als eigene Zeilen in `docs/audit/TASKS.md` oder `LEAD_DECISIONS.md`.
   - **A3** MECHANIKEN S5 §5g.8 „(wirkt ab T40)“; S5-Erpressungssatz nach Entscheidung 1; BALANCE.md Aldhelm „⌀ 45 s“ korrigieren.
   - Dazu RB-027 bis RB-033 in BUG_DATABASE eintragen und `docs/audit/STATUS.md:6` an AGENT_SYSTEM anpassen.
3. **Lead:** RB-029 entscheiden (a/b/c). Kampf/Balance: Aldhelm per Spieltest (RB-021). Systems: RB-033.
4. **Hunter (Sonnet):** T05 kurz prüfen. Hunter 6 räumt die Testplätze auf und meldet T10 mit SHA. Danach eine kurze Control-Runde nur für T10 und für die Proben aus Punkt 1.
5. Erst danach der [VERIFIED]-Commit und der Push auf `main`.

## Urteile kurz

- **VERIFIED:** T01 · T02 (Auflage A1/A2) · T04 · T06 · T07 Scheibe 1 · RB-008 · RB-013 (Sonne) · RB-014 · RB-015 · RB-017 · RB-018 · RB-022 · RB-024 · RB-025.
- **NEEDS FIX:** T07 S2 (Probe RB-020) · T07 S3 (Probe RB-019) · T07 S4 (RB-030, RB-021) · T07 S5 (RB-031, RB-032, A3) · T08 (RB-027, Probe RB-026) · T09 (RB-029, Lead) · RB-019 / RB-020 / RB-026 (Probe) · RB-021 (Doku/Balance).
- **PENDING:** T05 (Hunter fehlt) · T10 (Hunter 6).
- **Offen, kein Urteil:** RB-012 · RB-023 · RB-010.
- **BLOCKED BY CONTROL:** Push auf `main`, bis der ganze Commit VERIFIED ist.

EXPECTED NEXT STEP: Der Director gibt Punkt 1 an den Engineer, Punkt 3 an Lead und Spezialisten und legt dem Nutzer Entscheidung 1 vor. Die Hunter erledigen Punkt 4. Danach prüft Control nur noch die Restpunkte.
