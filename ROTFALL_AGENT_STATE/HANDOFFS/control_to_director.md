# control_to_director

FROM: Control (Agent 9, Opus) · TO: Director · 01.10.2026, 02:45
TASK: Erste Control-Prüfung aller TESTING-Aufgaben (T01–T06, RB-001…RB-009).
Grundlage: Commits 627b20a, 55e043b, 3f2c461, aa5202b, 0b3f35c, 8e202be (Zeilen = Stand HEAD 8e202be), eigener Browser-Tab (tab-35, geschlossen), ein Selbsttestlauf, eigene Live-Messungen. Echter Stand: vor und nach den Tests gleich `rotfall.backup.s14c` (FACT, geprüft). Test-Plätze angelegt und wieder gelöscht, Slot-Index, `slot.active` und `lastSingle` zurückgesetzt (FACT).

Kennzeichnung: **FACT** = selbst geprüft (Code oder Live) · **CLAIM** = Aussage eines Agenten, nicht nachgeprüft · **ASSUMPTION** = eigene Vermutung · **RECOMMENDATION** = Vorschlag.

---

## SYSTEM STATUS

- FACT: Im Arbeitsbaum liegt unversionierte T07-Arbeit des Engineers (`src/data.js`, `src/game.js`, +255 Zeilen, wächst noch). Mein Selbsttest lief also auf HEAD **plus** T07-WIP.
- FACT: Selbsttest frisch geladen: **324/325**, 43 s. Einziger FAIL: „Titelgrade (S15)“. Ursache: WIP-Titelklasse `vampire` hat `mentor:'hedda'`, die nicht in `NPCS` steht. Der Engineer ändert genau diese Probe gerade (`|| T2.mentor === 'hedda'`). Der FAIL kommt aus T07, nicht aus den TESTING-Aufgaben.
- CLAIM: HEAD allein 325/325. Plausibel, aber nicht von Control gemessen, weil der Baum sich während der Prüfung bewegte.
- FACT: Alle TESTING-Commits liegen schon auf `origin/main` (öffentlich, CNAME) und `origin/claude-arbeit`, mit `?v=22`.
- FACT: Es gibt keinen schriftlichen Hunter-Bericht (kein Handoff, keine Datei). Hunter-Ergebnisse stehen nur als Einzeiler in `CURRENT_TASKS.md`. Damit fehlt formal die zweite VERIFIED-Bedingung aus `AGENT_SYSTEM.md`. Meine VERIFIED-Urteile stützen sich auf eigene Prüfung.

## VERIFIED WORK

| Punkt | Urteil | Beleg |
|---|---|---|
| T03 Varonheim | **VERIFIED** | FACT: Probe grün. `capitalMigrate` hängt an `ensureVaronGate` (newGame und continueGame). Garde `transient` wird neu aufgebaut. Keine neuen `rnd()` in world.js (Diff ohne CR geprüft). MECHANIKEN, CHANGELOG, Log-Hinweis und Teleport-Debug vorhanden. Klein: Probenname nennt „alle vier Stadttore“, geprüft werden 3 Tore und das Burgtor. Nicht geprüft: Koop-Gast in der Stadt, BUG-108-Leistung. |
| RB-001 Untoten-Lawine | **VERIFIED** | FACT: 6 Läufe à 30 Tage ohne Spieler: höchstens 11–12/15 Untotenknoten. Kein Lauf mit 15/15 in 30 Tagen. Front wechselt oft (Kreuzweg 9×, Eren 8×). Ein 60-Tage-Lauf erreichte am Tag 35 einmal 15/15 und holte sich danach zurück (siehe Risiken). |
| RB-002 simFight-Leck | **VERIFIED** | FACT: nach 41 simFight-Läufen bleibt `S.difficulty` undefined. |
| RB-003 ARMY_CAP | **VERIFIED** (Doku-Fix offen) | FACT: Ohne Wert gilt „schwer“ → 110. 80 gilt nur auf „Angsthase“. MECHANIKEN sagt „80, auf Schwer 110“, das ist irreführend, denn Schwer ist die Grundstufe. |
| RB-004 Seuche/Props | **VERIFIED** | FACT: `delete c.sick` beim Seuchenende plus Bereinigung in continueGame. Probe „Audit D6“ prüft, dass kein Prop `sick` trägt (grün). |
| RB-006 Zufallsproben | **VERIFIED** | FACT: Kutsche, Raserei und Ruhm im frischen Lauf grün. |
| RB-007 | Ablehnung bestätigt | FACT: In `update()` wächst `S.minute` je Bild nur um `dt/1000` (weit unter 1440), ein `if` reicht. Zeitsprünge laufen über `passTime`, das schon `while` nutzt. |
| RB-009 gepackter Stand aus anderem Tab | **VERIFIED** | FACT (live): `readRaw` gibt für einen fremd geschriebenen RFZ1-Platz `null`, nach `unpackAll()` JSON. slotCards entpackt vor `onLoad` (`await unpackAll()`), auch für die Koop-Hostliste. |

## UNVERIFIED WORK / NEEDS FIX

### T01 A1 Wucht mit Standfestigkeit · **NEEDS FIX**
- FACT (Code + live): In `hit()` läuft `hurt()` (game.js:3284) **vor** dem Wucht-Block (3309). `hurt()` setzt bei `stagOf ≥ 0,3` schon `poiseUntil` (3393). Dann ist das Ziel „standfest“ und der Wucht-Block wird übersprungen. Live gemessen am Todesritter mit Kriegshammer: erster Treffer `stagger 312` statt 650, zweiter 0. Der Wucht-Zweig (650 ms, Bruch der Ausholbewegung, Boss 300) ist für normale Gegner toter Code. Den Stunlock gibt es nicht mehr, aber der Hammer hat keine eigene Wucht mehr. MECHANIKEN beschreibt ein Verhalten, das so nicht passiert.
- FACT (live): Der Wuchtschlag der Kombo (3241) setzt selbst kein `poiseUntil`. Mit Dolch (`stag < 0,3`, also keine Standfestigkeit über `hurt`) gab es zweimal hintereinander `stagger 700`, beide Male ohne Standfestigkeit. Mit Langschwert greift die Standfestigkeit. Schnelle Waffen können also weiter dauerlähmen. ASSUMPTION: Beim Dolch (300 ms) liegt der Gegner etwa 60–70 % der Zeit im Taumeln.
- FACT: Die Probe „Audit A1“ besteht aus dem falschen Grund (Standfestigkeit aus `hurt`). Sie würde auch ohne den A1-Code bestehen. Nicht geprüft werden: Wuchtschlag, Boss 300 ms, der simFight-Test aus TASKS.
- FACT: simFight Todesritter, Stufe 15, Kriegshammer, smart, Seeds 1–5: Lebensverlust 67/62/80/0/4 %, im Mittel 43 %. Damit ist das TASKS-Kriterium (> 20 %) erfüllt.
- FACT: Es fehlen ein Debug-Eintrag (Regel) und die BALANCE.md-Zeile (TASKS).
- RECOMMENDATION, Fix: (1) den Wucht-Block vor den `hurt()`-Aufruf ziehen, oder ein Wucht-Flag an `hurt` geben, das dort 650/300 setzt. Standfestigkeit wie bisher danach. (2) Im comboFin-Zweig bei `kind==='enemy'` ebenfalls `poiseUntil = now + 700 + 1200` setzen. (3) Probe: erster Hammertreffer `stagger ≥ 600` (Nicht-Boss), Boss = 300, zweiter Treffer 0; Dolch-Wuchtschlag zweimal → beim zweiten 0. (4) Debug-Eintrag „Wucht-Test“, BALANCE.md-Zeile.

### T02 V1 Krieg mit Nachschub + Gegengewicht · **NEEDS FIX**
- FACT (live): Deckel greift. Nach `garmadonSlain` wächst in 10 Tagen nichts und es entsteht nichts. Neue Valen-Aufgebote (35) entstehen nur in eigener Stadt (60 Tage, 0 Verstöße). Die 30-Tage-Grenze von ≤ 12 Knoten hält (6/6 Läufe).
- FACT: Aus der TASKS-Anforderung **nicht umgesetzt und nicht ausdrücklich gestrichen**: `S.war.corpses` mit Wachstum `+corpses/10`, Orden-Heer bei Sonnwacht ab Eifer 1, Valen-Aushebung aus Köpfen, Debug „Krieg 10 Tage vorspulen“. Stattdessen gibt es ein anderes Gegengewicht (Hunter-Befund). Das ist eine Abweichung ohne Lead-Entscheid.
- FACT: Die Probe „Audit V1“ prüft Deckel ≤ 110 und „kein Wachstum nach Garmadon“. „Valen stellt nur in eigener Stadt auf“ steht im Namen, wird aber **nicht** geprüft. Das Gegengewicht (Aufgebot, Mauern +30 %, Besatzung auffüllen, Entsatz) hat keine Probe.
- FACT: Das Entsatzheer entsteht direkt **in** der besetzten Nordfurt (sim.js:376) und kämpft sofort gegen die Besatzung. Als Text („zieht gegen Nordfurt“) geht das, als Bewegung ist es ein Sprung.
- FACT: In einem 60-Tage-Lauf hielten die Toten am Tag 35 einmal 15/15. Valen kam erst über den Entsatz zurück.
- RECOMMENDATION, Fix: Debug-Eintrag „Krieg 10 Tage vorspulen“ (warTick ×4 + warDay). Probe „30 Tage ohne Spieler ≤ 12/15“ mit Snapshot und Wiederherstellung (dauert ~0,3 s). Musterungsprüfung in die V1-Probe. Lead entscheidet, ob Leichen, Orden-Heer und Köpfe nach T40 wandern (in TASKS vermerken). MECHANIKEN-Satz zum Deckel korrigieren.

### T04 Effekte, Zufall, Klang · **NEEDS FIX**
- FACT: Der Code entspricht weitgehend der Anforderung: `afterimage` mit `src`, `ghost` als Schleier, `vrnd` in `fx/float`, Deckel 900 (Anforderung 400, Abweichung dokumentiert), economy.js nutzt `rnd()`, 6 neue Stimmungen plus `under`. Debug-Abschnitt und MECHANIKEN vorhanden.
- FACT: **Es gibt keine einzige T04-Probe** (verstößt gegen die DoD). Ungeprüft: kein Heldenbild im Geistpartikel (RB-005), „Kaum Blut“ ändert die `rnd()`-Folge nicht, Partikeldeckel, keine Vögel im Totenland, unter Tage kein Tag/Nacht.
- FACT: Nicht umgesetzt: `float()` fasst gleichen Text innerhalb 300 ms nicht zusammen. `ambienceKind` wird nicht exportiert. Beides steht in TASKS.
- RECOMMENDATION, Fix: eine Probe mit `seedRng(7)`: `fx()` 100× mit `violence low/standard` → gleiche nächste `rnd()`-Zahl. Partikel nach Stresstest ≤ 900. `drawFx` für `ghost` ruft kein `humanFrame` (z. B. Spion auf `SP.humanFrame`). float-Zusammenfassung umsetzen oder in TASKS streichen.

### T05 Kleine Korrekturen · **NEEDS FIX** (klein)
- FACT: Führung wächst nur mit Gefährten, Loyalität wird schneller, Vharnholm hungert nie, aus F wird R, kein PNG-Laden, Friedhof wird nicht umgefärbt, EYE_ZAP angepasst. Die Probe „Audit T05“ deckt die ersten vier ab (grün).
- FACT: Es fehlen ein Debug-Eintrag für die neue Führungs-Mechanik (Regel), eine CHANGELOG-Zeile (DoD) und eine Probe für EYE_ZAP (TASKS-Test). `CLAUDE.md` sagt weiter „D/F are selectable“ (neue Doku-Drift).
- RECOMMENDATION: Debug „Führung +10“, CHANGELOG-Zeile, CLAUDE.md-Satz anpassen. Stil F braucht die Bestätigung des Entwicklers (siehe DESIGN CONFLICTS).

### T06 Spielstand komprimiert, Caches, HUD · **NEEDS FIX**
- FACT (live): JSON 2,39 Mio. Zeichen → RFZ1 112 Tsd. Zeichen (×21,2, ≈ 220 KB UTF-16). Rundlauf identisch. `saveData` 87 ms, zip 58 ms, unzip 39 ms. Laden aus komprimiertem Platz über `readRaw/loadRaw` klappt. Alter JSON-Stand (s14c) lädt.
- FACT: `saveData()` läuft in `flushSave` weiter synchron (87 ms). „Kein Ruckler beim Speichern“ ist also nur teilweise erreicht. Figuren-SKIP und Standardwerte als Abweichung (TASKS) sind nicht umgesetzt; das JSON ist nicht kleiner geworden.
- FACT: Offen und nur in `docs/audit/STATUS.md` vermerkt: Vorwärmen bei Reise (`R.prefetchAt`, `SP.warm` in `travel/cineMove`). Status TESTING, obwohl ein Teil der Aufgabe fehlt.
- FACT: Der Zähler `cacheStat.clears` zählt jetzt auch das Kürzen um 10 %. Der TASKS-Test „4200 Bilder → clears 0“ ist damit nicht mehr erfüllbar.
- FACT: Die Probe „Audit D6“ prüft nur `pack/unpack`. `zipSave/unzipSave`, `flushSave`, `saveSync`, `readRaw`, `unpackAll` und `setSlot` haben keine Probe. Weitere Funde unter RB-008 und TECHNICAL RISKS.
- FACT: CHANGELOG-Zeile für T06 fehlt.
- RECOMMENDATION: siehe RB-008-Fix und Risiken 1–3. Dazu eine Probe mit einem Test-Platz `__probe`: `zipSave → setItem → readRaw` ist `null` → `unpackAll` liefert JSON, danach löschen.

### RB-005 Geist malt Helden · **NEEDS FIX** (nur Regressionsprobe)
- FACT: Der Code ist behoben (render.js `ghost` = Schleier, `afterimage` = Figur aus `src`). Eine Probe fehlt (siehe T04).

### RB-008 Slotwechsel schreibt falschen Stand · **NEEDS FIX**
- FACT (live, eigene Test-Plätze A/B): Fall „save() steht aus, dann setSlot(B)“: A bekommt JSON, B bleibt leer. Der ursprüngliche Fehler ist behoben.
- FACT (live): Fall „Komprimieren läuft schon, dann setSlot(B)“: `saveGen++` verwirft den Speichervorgang. **A wird gar nicht geschrieben**, der letzte Speicherstand des alten Platzes geht verloren. Das ist ein kleiner Datenverlust (Änderungen seit dem vorletzten Speichern), aber stumm.
- FACT: `deleteSlot(aktiver Platz)` bei ausstehendem Timer: `setSlot('legacy')` → `saveSync()` schreibt in den **gerade gelöschten** Schlüssel. Es bleibt eine 2,4-MB-Leiche außerhalb des Index (LOW).
- RECOMMENDATION, Fix in state.js: ein Flag `inFlight` (true zwischen `saveData()` und `setItem`). In `setSlot`: `if (saveTimer || inFlight) saveSync()` **vor** dem Umschalten (S gehört dann noch zum alten Platz). In `deleteSlot`: Timer und `saveGen` vor dem Umschalten verwerfen statt `saveSync`.

## ROLE VIOLATIONS

- FACT: T07 ging von DESIGN_LOCKED direkt in die Umsetzung. Die Systemprüfung (Systems Designer: Kriegsgraph-Abzug, Durst-Tempo), die der Feature Designer im Handoff als nächsten Schritt nennt, fand nicht statt (`systems_designer.md`: nicht aktiv). Das verletzt die Freigabekette in `AGENT_SYSTEM.md` (MEDIUM).
- FACT: `DESIGN_DECISIONS.md` heißt laut Kopf „Nur Entscheidungen des Nutzers“, enthält aber Lead-Entscheide („Blutfürst → Blutritter“, T09 Leitware/`S.prices`). RECOMMENDATION: in `ARCHITECTURE_NOTES.md` verschieben oder deutlich als „Lead, nicht Nutzer“ abtrennen.
- FACT: Widersprüchliche Rollenregeln: `docs/audit/STATUS.md` sagt, der Hunter „behebt klare Fehler“; `AGENT_SYSTEM.md` sagt, nur der Engineer ändert `src/`. Daraus kam der frühere Hunter-Eingriff. RECOMMENDATION: STATUS.md-Rollenkopf an AGENT_SYSTEM anpassen.
- FACT: Ungeprüfte (TESTING-)Arbeit landet bei jedem Backup auf dem öffentlichen `main`. Das steht im Konflikt mit „Nur VERIFIED gilt als fertig“. Ein Agentenfehler ist das nicht: Es folgt der Push-Regel des Nutzers. Siehe Entscheidungen.
- FACT: Veraltete Zustände: `feature_designer.md` (wartet noch auf 6 Fragen, sind beantwortet), `MASTER_STATE.md` (T07 „DESIGNING“), `docs/audit/STATUS.md` (T05 und T07 BACKLOG), `bug_hunter.md` (läuft).

## DESIGN CONFLICTS

- **Varonheim belagerbar** (Nutzer 01.10., APPROVED): FACT: Varonheim ist kein Kriegsknoten. sim.js:375–378 behandelt es als unangreifbare Entsatzquelle („Aus Varonheim zieht ein Entsatzheer“). **Kein Fehler, sondern offene Umsetzungsaufgabe.** Abhängigkeiten: Der Entsatz muss an „Varonheim hält“ hängen. Fall der Stadt bedeutet König flieht, Hof zerfällt (Varonsburg, Audienz, Kanzler, Aldhelm/T07). Wechselwirkung mit §5g.8 (Kult bindet Varon). RECOMMENDATION: eigene Aufgabe vor T40, spätestens mit T07-Scheibe „Aldhelm“, weil der Hofzerfall die Enthüllung berührt.
- **Stil F entfernt** (T05): FACT: `CLAUDE.md` und die Kunst-Notiz sagen „D/F wählbar“. Die Entfernung kam aus dem Audit, nicht aus einem Nutzerentscheid in `DESIGN_DECISIONS.md`. RECOMMENDATION: kurz vom Entwickler bestätigen lassen; der Code ist eingefroren und leicht umkehrbar.
- **A1 Hammer-Identität**: FACT: Wucht ist faktisch auf normales Taumeln (312 ms) geschrumpft. Die Audit-Absicht war „Hammer öffnet ein Fenster“. Das ist ein Designverlust, den niemand entschieden hat (siehe T01-Fix).
- **T02 Abweichung von Teil B V1** (Leichen, Orden-Heer, Köpfe): kein Entscheid dokumentiert (siehe T02).

## TECHNICAL RISKS

1. **Cache-Schlüssel nicht erhöht, aber öffentlich ausgeliefert** (MEDIUM). FACT: `game.js` importiert neue benannte Exporte (`saveSync, readRaw, unpackAll, zipSave, …`) aus `state.js?v=22`. Wer noch ein altes `state.js?v=22` im Cache hat, bekommt einen SyntaxError beim Modul-Link, das Spiel startet nicht. Dazu kommt das neue Speicherformat RFZ1: Ein alter Build liest es nicht (Downgrade bricht). RECOMMENDATION: Beim nächsten Push **v=23** setzen (index.html, alle Importe, `import('./coop.js?v=…')`, `coop.js VER`, Versionslabel), so wie es CLAUDE.md beim Ausliefern verlangt.
2. **Import-Wettlauf** (MEDIUM-LOW). FACT: `flushSave` prüft nach dem `await` nur `gen/key`, nicht `guardSave()`. Der Cloud-Import (ui.js:1103–1107) setzt `S._quiet` und schreibt den importierten Stand, ohne `saveGen` zu erhöhen. Läuft gerade ein Komprimieren, überschreibt es den Import stumm. RECOMMENDATION: in `flushSave` nach dem `await` `if (!guardSave()) return;` und ein exportiertes `cancelSave()` (Timer weg, `saveGen++`), das der Import vor `setItem` aufruft.
3. **Manuelles Speichern und Beenden schreiben JSON** (MEDIUM). FACT: `saveNow: () => saveSync()`, also schreiben „Speichern“ und „Beenden“ 2,4 MB JSON. Ist der Speicher knapp, meldet „Speichern“ „voll“, obwohl die komprimierte Fassung (112 Tsd.) passen würde. „Beenden“ scheitert stumm. Nach jedem Schließen liegt der aktive Platz als JSON vor. „Drei Plätze nebeneinander“ gilt also nur, solange keiner gerade geschlossen wurde. RECOMMENDATION: `sv`/`quit` als `async`: `await saveNowZip()` (komprimiert, mit Rückmeldung), `saveSync` nur als Rückfall und für `beforeunload`.
4. Speicher: FACT: `UNZ` hält jeden entpackten Stand (auch Sicherungen `rotfall.backup.*`) dauerhaft als 2,4-Mio.-Zeichen-String. ASSUMPTION: Mit ~10 gepackten Ständen sind das ~50 MB Heap. RECOMMENDATION: Sicherungen nicht beim Boot entpacken, nur Index-Plätze und den aktiven.
5. `continueGame` ist jetzt teils asynchron (RB-009-Pfad). FACT: `coop.js host()` und `startCoop` rufen es synchron und arbeiten sofort weiter. Abgefedert, weil die Platzliste vorher `unpackAll` abwartet. ASSUMPTION: Ein in einem anderen Tab neu gepackter Koop-Platz, über einen anderen Weg geöffnet, würde mit altem `S` hosten.
6. Zeilenenden-Wechsel: FACT: Mehrere Commits schreiben ganze Dateien mit anderem Zeilenende neu (sim.js 981, world.js 4731, buildings.js 1044 Zeilen). Diffs und Blame sind ohne `--ignore-cr-at-eol` unbrauchbar. RECOMMENDATION: `.gitattributes` (`*.js text eol=lf`) im Backup-Repo.
7. Prüfen auf bewegtem Baum: FACT: WIP des Engineers lag während der Control-Prüfung im ausgelieferten Baum. RECOMMENDATION: Hunter und Control prüfen künftig in einem `git worktree` von HEAD (eigener Port), oder der Engineer committet scheibenweise.
8. HUD-Signatur: FACT: Die `party`-Signatur enthält weder `coopHero` noch das Aussehen (Prothese, verlorenes Glied ohne Ausrüstungswechsel), sonst aber genug. Ein Porträt kann also veralten (LOW).
9. FACT: `newSlot` nutzt `Date.now().toString(36)`. Zwei Aufrufe in derselben Millisekunde ergeben dieselbe id (nur in Skripten erreichbar, LOW).

## REGRESSIONS

- FACT: Keine Regression bei altem JSON-Stand, Laden, Koop-Gast-Speicherschutz (`guardSave` guest) und Cloud-Export (`saveData()` frisch bzw. `readRaw`).
- FACT: Verhaltensänderung ohne Entscheid: Kriegshammer-Wucht 650 → 312 ms (T01).
- FACT: RB-008-Fix tauscht „falscher Platz“ gegen „stiller Verlust des laufenden Speichervorgangs“.
- FACT: Selbsttest 324/325 nur wegen T07-WIP (siehe SYSTEM STATUS); kein TESTING-Task betroffen.

## ROADMAP PROBLEMS

- Zwei Statustafeln laufen auseinander (`CURRENT_TASKS.md` gegen `docs/audit/STATUS.md`). RECOMMENDATION: STATUS.md auf einen Verweis kürzen, eine Quelle der Wahrheit.
- In der DoD fehlende Teile werden nicht als Rest geführt: T06 Vorwärmen, T04 float/ambienceKind, T02 Leichen/Orden/Köpfe/Debug, A1 BALANCE.md. RECOMMENDATION: Jeder TESTING-Eintrag bekommt eine Zeile „offen: …“, oder der Lead streicht den Rest ausdrücklich.
- CHANGELOG: T05 und T06 fehlen.

## STAGNATING TASKS

- T01–T06 warten alle auf „Control fehlt“ bzw. auf einen Hunter-Bericht, der nie als Datei geschrieben wurde.
- RB-010 (Zollgesetz wirkt nie) und RB-011 (Stand zwischen Tod und Erbe): Schwere „?“, ohne Besitzer, an T09/T10 geparkt. RECOMMENDATION: Der Hunter prüft beide jetzt (je < 15 min). RB-010 ist laut Designer-Analyse ein klarer Logikfehler (`riskOf` liest ein Feld, das `applyLaw` sofort löscht).

## BLOCKERS

- Keine harten Blocker. Kein BLOCKED BY CONTROL.
- Formal: VERIFIED für T01, T02, T04, T05, T06 und RB-005/RB-008 erst nach den Fixes oben **und** einem schriftlichen Hunter-Bericht.

## DEVELOPER DECISIONS REQUIRED

1. **Push-Regel:** Weiter jeden Backup-Commit auf das öffentliche `main` pushen (heute: ungeprüfte Arbeit live) oder nur noch VERIFIED-Stände auf `main` und alles andere auf `claude-arbeit`?
2. **Grafikstil F** endgültig abschalten (T05 hat ihn entfernt; CLAUDE.md und Notizen sagen „wählbar“)?
3. Optional, über den Lead: Soll der Kriegshammer seinen eigenen Wucht-Moment (650 ms, Ausholbruch) behalten (Audit-Absicht) oder reicht normales schweres Taumeln?

## RECOMMENDATIONS (Reihenfolge)

1. Engineer: RB-008-Fix (`inFlight`) + Import-Wettlauf (`guardSave` nach `await`, `cancelSave`) + manuelles Speichern komprimiert. Ein Commit, mit Proben.
2. Engineer: A1-Fix (Reihenfolge Wucht/hurt, comboFin-Standfestigkeit) + starke Probe.
3. Engineer: T04-Probe (vrnd/Deckel/Geist) + T02-Probe (30 Tage) + Debug „Krieg 10 Tage“, „Führung +10“, „Wucht-Test“; CHANGELOG T05/T06; MECHANIKEN-Deckelsatz; CLAUDE.md Stil-Satz.
4. Lead: über die T02-Abweichungen und T06-Vorwärmen entscheiden (umsetzen oder nach T40/T14 verschieben, in TASKS vermerken). Varonheim-Belagerung als eigene Aufgabe einplanen.
5. Vor dem nächsten Push: Cache-Schlüssel v=23.
6. Hunter: schriftlicher Bericht je Aufgabe nach `HANDOFFS/bug_to_implementation.md` (Format aus AGENT_SYSTEM). Tests auf einem HEAD-Worktree. RB-010/RB-011 jetzt prüfen.
7. T07 (läuft): die Probe nicht mit `|| mentor === 'hedda'` aufweichen. Besser prüfen, dass `ensureBloodCult()` Hedda baut. Systems-Designer-Prüfung nachholen, bevor Scheibe 2 beginnt.

## Urteile kurz

T01 NEEDS FIX · T02 NEEDS FIX · T03 VERIFIED · T04 NEEDS FIX · T05 NEEDS FIX (klein) · T06 NEEDS FIX · RB-001 VERIFIED · RB-002 VERIFIED · RB-003 VERIFIED (Doku) · RB-004 VERIFIED · RB-005 NEEDS FIX (Probe) · RB-006 VERIFIED · RB-007 Ablehnung bestätigt · RB-008 NEEDS FIX · RB-009 VERIFIED.

EXPECTED NEXT STEP: Director gibt die Fix-Liste an Engineer und Lead, legt dem Entwickler die Fragen 1–2 vor und lässt den Hunter schriftlich nachberichten. Danach erneute Control-Prüfung der NEEDS-FIX-Punkte.
