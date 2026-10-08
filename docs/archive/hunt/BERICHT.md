# Hunt 1 — Abschlussbericht (Lead, 02.10.2026)

Code-Stand der Suche: 1983784 (während der Suche liefen weitere Commits; Zeilennummern per Funktionsname suchen).
Quellen: `system_hunter.md`, `interaction_hunter.md`, `sweeper.md`, `quest_agent.md`, `reproducer_1–3.md`, Listen `repro_liste_1–3.md`.

## Zahlen
- Kandidaten: **61** (System Hunter 20, Interaction Hunter 20, Quest Agent 20, Sweeper 2; −1 Doppelung IH-11 = SH-07).
- **Bestätigt live** (nachgestellt im Spiel): **18** · **bestätigt nur durch Code** (Reproducer hat die Stelle unabhängig gelesen, aber nicht ausgelöst): **37** — im Folgenden ehrlich als „Code“ markiert, das entspricht UNTESTED-wahrscheinlich.
- Nicht reproduziert: **2** (SH-04, QA-01) → verworfen.
- Nicht testbar: **2** (IH-15, IH-16) → als wahrscheinlich geführt (siehe unten).
- Sweeper SW-01/SW-02: keine Bugs, nur Beobachtungen (der Browser war für den Sweeper blockiert; den Selbsttest hat der Lead in diesem Lauf 20× grün gesehen).
- Zusammenführungen: IH-02 + QA-03 (gleiche Ursache), SH-07 + IH-11, SH-20 + IH-14, SH-17 + SH-18, SH-05 + SH-06 (gleiches Muster), IH-08/09/10 (gleiches Muster).

## Bestätigte Bugs (nach Schwere)

### 1 — Kritisch
**HB-01 · Gespeicherter Tod: nach dem Laden keine Erbenwahl, Stand bleibt kaputt** (IH-01, neue Information zu RB-011) — *live*
- Repro (Wegwerf-Slot): Held stirbt, speichern, neu laden → `S.player.alive === false`, kein Todesbildschirm, Uhr läuft, Tagesspeichern schreibt den kaputten Stand fest.
- Ursache: Der Todeszustand wird gespeichert, aber `continueGame()` prüft `S.player.alive` nicht und startet die Erbenwahl (`playerDeath` → `chooseSuccessor`) nicht neu.
- Dateien: game.js `continueGame`, `playerDeath`, state.js. Gleicher Fehler anderswo: nicht geprüft.

### 2 — Hoch
**HB-02 · `performance.now()`-Zeitstempel überleben das Laden** (IH-02 + QA-03) — *live*
- Repro: `p.reloadUntil` bzw. `p.vamp.frenzyT` setzen, speichern/laden → Wert liegt weiter in der Zukunft. Folgen: Vampir-Raserei friert die Steuerung ein, Armbrust bleibt gespannt, Nebelschritt macht unverwundbar, Geister bleiben immun — so lange, wie die alte Sitzung lief.
- Ursache: Zeitstempel relativ zum Seitenstart werden gespeichert; der Lade-Reset in `continueGame` kennt nur einen Teil der Felder (`vamp` u. a. fehlen).
- Gleicher Fehler anderswo: ja — alle gespeicherten Felder mit `performance.now()` (z. B. `spent`, `lureCd`, `wary`); vollständige Liste fehlt.

**HB-03 · Zeitsprünge überspringen alle Stundenhaken außer dem Krieg** (IH-03) — *live*
- Repro: Rote Krönung fällig, Debug „Zeit +6 Stunden“ über 3 Uhr → `cultCrown` läuft nicht. Ebenso Entführungen 23 Uhr, Albins Tod 6 Uhr, Siedlungsangriffe 2 Uhr, Plünderer, Vermisstenwelle.
- Ursache: `passTime`/Schlaf/Reisen rufen `hourTick(h)` nicht für jede übersprungene Stunde auf.
- Dateien: game.js `passTime`, `hourTick`.

**HB-04 · Koop-„Hosten“ aus laufendem Spiel übernimmt alten Zustand** (IH-04) — *live*
- Repro: Feld in `S` setzen, das im Ziel-Stand fehlt, `continueGame(stand)` → Feld bleibt. Beim Koop-Hosten landen Kerker, Waffenkammer usw. aus dem Einzelspiel im Koop-Platz.
- Ursache: `applySave` überschreibt nur vorhandene Schlüssel und leert `S` vorher nicht (anders als `newGame`, das seit RB-055 leert).
- Gleicher Fehler anderswo: jeder Slot-Wechsel zur Laufzeit.

**HB-05 · Abbruch von „Heer gegen eine Stadt“ nimmt allen Heeren den Befehl — auch Morvaths Heerzug** (SH-11) — *Code + synthetischer Test*
- Folge: Der Heerzug zieht nie mehr auf Varonheim und blockiert als `host` jeden neuen Heerzug. Die Bedrohung der Hauptstadt ist dauerhaft aus.
- Ursache: `cancelQuest('q_undarmy')` setzt `a.order = null` für alle Heere statt nur für das beorderte (`S.undArmyTo`).

**HB-06 · Klassenaufträge Mönch c_mon1–3 unerfüllbar** (QA-02) — *Code*
- Ursache: `evaded()` schreibt Ausweich-Fortschritt nur in `q_monk`. Die Rüstung der Stillen Hand ist dadurch unerreichbar.
- → behoben (Probe: „HB-06: Ausweichen zählt für alle aktiven Aufträge mit dodge-Ziel …“). `evaded()` aktualisiert jetzt wie `onKill()` generisch alle aktiven Aufträge mit `type:'dodge'`-Ziel statt nur `q_monk`.

**HB-07 · Weißbart nach „Ich fordere dich heraus“ nie wieder ansprechbar** (QA-04) — *Code*
- Wer flieht, kann q_wb_nebel nicht abgeben, Salzfrieden unmöglich. Ursache: `w.parley = false`, kein Weg zurück.
- → behoben (Probe: „HB-07: Weißbart … werden nach Entkommen über die Kartengrenze wieder ansprechbar“). `leavePursuit()` setzt beim Boss-Abbruch über die Kartengrenze `parley = true` für Weißbart zurück (wie Dodon es nach dem Sturm schon tut).

**HB-08 · Königsauftrag abgebrochen = ganze Varon-Reihe tot** (QA-05) — *Code*
- Ursache: `failContract` setzt `S.flags.varonQ` nicht zurück; `royalStart` bietet nur bei `Q === 0` an.
- → behoben (Probe: „HB-08: Ein abgebrochener Königsauftrag setzt varonQ zurück …“). `failContract()` setzt `S.flags.varonQ` bei einem `kind:'royal'`-Auftrag auf 0 zurück, der König bietet den Auftrag erneut an.

**HB-09 · Eisenmark: Pferch-Auftrag hängt nach dem Fall der Kette; Tribut-Raub zählt Nähe statt Täter** (QA-08, QA-07) — *Code*
- `openPen()` bricht bei `chainsBroken` vor dem Abschluss ab; `tribTick` zählt Spieler-Nähe < 220 px als „geraubt“.
- → behoben (Proben: „HB-09a: Ein überfallener Tributzug zählt den Täter …“, „HB-09b: Vargs Fall schließt eine noch offene Pferch-Quest ab …“). `liberate()` schließt eine noch aktive `q_pferch` beim Fall der Kette gleich mit ab; `tribTick()` wertet nur noch `lastKiller` (Spieler oder Gruppe) statt der bloßen Nähe.

**HB-10 · Rotfall/Omega: Questreihe wird nie abgeschlossen, Belohnung nie ausgezahlt** (QA-09) — *Code*
- → ausgelassen: OFFENE DESIGNENTSCHEIDUNG (siehe Bericht unten) — welche Belohnung genau ausgezahlt wird, ist nirgends definiert.

### 3 — Mittel (live bestätigt)
- **HB-11 · Befreier-Dank trotz Wachmord** (SH-01): `schutzFreed` zieht den Ersatz vor der Schuldprüfung ab → Wachmörder bekommt +10. Ursache: Reihenfolge der Zuweisungen.
  - → behoben (Probe: „HB-11: Die Schuldprüfung bei befreiten Städten zählt Wachmorde vor dem Ersatz …“). Die `clean`-Schuldprüfung in `schutzFreed()` läuft jetzt vor der Ersatz-Zuweisung, nicht danach.
- **HB-12 · Wohlstand bei Stadt ohne Schutz falsch** (SH-02): Grundzuwachs +3 hebt die Abzüge auf (schutzlos ±0, gesetzlos −5 statt −8, Bandenherrschaft sogar +). Ursache: Abzüge wurden auf den Grundzuwachs addiert statt netto gerechnet.
  - → behoben (Probe: „HB-12: Wohlstand … ist ein fester Tageswert …“). `growthDay()` setzt bei `schutz.stage` 2/3/4 die festen Tageswerte −4/−8/−3 (laut `docs/MECHANIKEN.md`), statt sie vom Grundzuwachs abzuziehen.
- **HB-13 · Heiler sieht verletzte Glieder nicht** (SH-03): `syncHp` zählt nur Kopf/Rumpf → „Dir fehlt nichts“ bei lahmem Bein.
  - → behoben (Probe: „HB-13: Der Heiler findet ein lahmes Bein …“). `woundedGroup()` prüft zusätzlich jedes Körperteil (`limbHurt()`), nicht nur `c.hp`.
- **HB-14 · Heilung durch Schaden: `Math.max(1, …)`-Böden heben negative Teile auf 1** (SH-05 live, SH-06 Code): Entzündung weckt Bewusstlose auf; Paktritter heilt lahme Glieder. Gleicher Fehler anderswo: ja, Muster suchen.
  - → behoben (Proben: „HB-14a: Schadens-Böden … heben einen bereits am Boden liegenden Rumpf nicht an …“, „HB-14b: Der Paktritter-Preis heilt kein bereits ausgefallenes Glied …“). Alle drei Stellen (Entzündung, Hunger, Paktritter-Preis) nehmen jetzt `Math.min(aktuellerWert, Math.max(1, …))`, sodass der Boden nie über den vorherigen (ggf. negativen) Wert hinaus anhebt.
- **HB-15 · Bruch überlebt Abtrennen: neue Prothese bei 40 % gedeckelt, Narbe am Messing** (SH-07 = IH-11): Abtrennen/`attachProsthesis` löschen `broken`/`splint` nicht.
  - → behoben (Probe: „HB-15: Abtrennen und eine neue Prothese löschen einen alten Bruch …“). `damagePart()` (Abtrennen) und `attachProsthesis()` löschen jetzt `broken`/`splint`; dasselbe im Debug-Menü „Glied abtrennen“.
- **HB-16 · Medizin heilt Prothesen, Prothesen bluten/entzünden sich** (SH-08): `healPart`/`woundSet` ohne `mech`-Prüfung; widerspricht MECHANIKEN („Medizin heilt Fleisch“).
  - → behoben (Proben: „HB-16a: Medizin heilt keine Prothese …“, „HB-16b: Ein Treffer auf eine Prothese entzündet sich nicht …“). `healPart()`, `worstPart()` und `fullHeal()` lassen `P.mech`-Glieder jetzt aus; `woundSet()` löst auf einer Prothese keine Entzündung mehr aus (der Bruch-Zweig hatte die `!P.mech`-Prüfung schon).
- **HB-17 · Abgetrennte Glieder fangen Treffer** (SH-09): `pickPart` gewichtet `lost` unverändert → Amputierte nehmen weniger Rumpfschaden.
  - → behoben (Probe: „HB-17: Ein abgetrenntes Glied fängt keine Treffer mehr“). `pickPart()` setzt die Trefferwahrscheinlichkeit verlorener Glieder auf 0.
- **HB-18 · Betriebsverlust angezeigt, nie abgezogen** (SH-15): `S.gold += Math.max(0, income)`.
  - → behoben (Probe: „HB-18: Betriebsverlust wird vom Gold abgezogen …“). `ecoDay()` rechnet jetzt `S.gold = Math.max(0, S.gold + income)`.
- **HB-19 · Vom Kult Entführte werden beim Laden durch Doppelgänger ersetzt** (IH-05): `spawnResidents` füllt das leere Haus neu; nach Befreiung gibt es zwei.
  - → behoben (Probe: „HB-19: spawnResidents() baut keinen Doppelgänger …“). `spawnResidents()` überspringt Häuser, deren Bewohner in `S.cult.missing` als entführt vermerkt ist.
- **HB-20 · Erbe übernimmt Bindungen des alten Helden falsch** (IH-06): Ehepartner/Bindungen hängen am Vorgänger.
  - → ausgelassen: OFFENE DESIGNENTSCHEIDUNG (siehe Bericht unten) — was genau ein Erbe an Bindungen/Ehe übernehmen soll, ist nicht definiert.
- **HB-21 · Zweiwaffen trotz ausgefallenem linkem Arm** (IH-07).
  - → behoben (Probe: „HB-21: Keine Zweitwaffe im linken Arm, wenn der Arm ausgefallen ist“). `dualOn()` prüft zusätzlich `!B.isDisabled(c, 'larm')`.
- **HB-22 · Am Boden heilt sich der Held selbst** (IH-08 live; IH-09 Lebensraub fliegender Geschosse, IH-10 Gruppenheilung richtet Gefallene auf — Code): verletzt die Entscheidung „Downed: keine Selbstheilung“. Gleiches Muster an drei Stellen.
  - → behoben (Proben: „HB-22a: Lebensraub eines Geschosses heilt keinen am Boden liegenden Schützen“, „HB-22b: Ein Gruppenheilzauber heilt keinen am Boden liegenden Verbündeten …“, „HB-22c: Kettengebet heilt keinen am Boden liegenden Verbündeten …“). `hurtFromProjectile()` prüft jetzt `!attacker.downed` vor dem Lebensraub; der `group`-Zauber-Zweig in `castSpell()` und `chain_prayer` lassen `downed`-Ziele aus (wie schon `partyCare`).
- **HB-23 · Rang bei Kette und Grubenstämmen gleichzeitig** (IH-17).
  - → behoben (Probe: „HB-23: Kein Rang bei der Kette und bei den Grubenstämmen zugleich …“). `autoRanks()` vergibt den Grubenstamm-Rang nur noch, wenn kein Kettenrang besteht; `JOIN_FOES.goblin = ['chain']` ergänzt das fehlende Gegenstück.

### 3 — Mittel (nur Code)
- HB-24 Burgtor schiebt Gesuchte in gesetzloser Hauptstadt stumm zurück (SH-10) · HB-25 Totenheer-Übernahme hängt, wenn das Heer den Befehl verliert (SH-12) · HB-26 Läden bleiben nach Toten-Übernahme für immer zu (SH-13) · HB-27 Übernahme kürzt Besatzung dauerhaft (`gcut` nie zurückgebucht) (IH-18) · HB-28 „Handeln“ im Kontextmenü umgeht Ladensperren (IH-12) · HB-29 Kauf/Verkauf prüfen den Händler nicht, Handel pausiert die Welt nicht (IH-13) · HB-30 Koop-Gast: Handel ohne Lagerbuchung und Auftragsauslöser (IH-19) · HB-31 Kultkrypta nach Tod des Spieler-Blutfürsten (QA-11) · HB-32 Grisk-Rache nach Abbruch neu annehmbar (QA-12) · HB-33 Rangziele nach Fall der Kette/Goblin-Befreiung unerfüllbar (QA-13) · HB-34 c_nec2 braucht Wächter, den es nur im Pakt gibt (QA-14) · HB-35 Kills durch Verbündete zählen nicht für Bosse/Quests (QA-15) · HB-36 Questgegenstände verkaufbar (QA-16) · HB-37 Ratssitz zahlt 600 EP nie aus (QA-17) · HB-38 Gerichtsklage beliebig oft wiederholbar (QA-18) · HB-39 Entführtes Kind wird nie zurückgeführt (QA-19) · HB-40 Gewölbe-Geheimtruhe beliebig oft (QA-20) · HB-41 Dodon nach Sturm-Abbruch nicht ansprechbar (QA-10) · HB-42 Gorak einmalig — q_mine bricht, wenn er vorher stirbt (QA-06).

### 4 — Niedrig
- HB-43 Ritter mit Dolch als Hauptwaffe: Strafe ohne Abgabe (SH-16) · HB-44 Gerold steht nach Neubau wieder; täglicher Hof-Neubau setzt Alarm/Wunden zurück (SH-17 + SH-18) · HB-45 Königsauftrag 1 still erledigt, wenn kein Spawnpunkt (SH-19) · HB-46 Waffenkammer-Bote nur für den Helden, Diener-Bestellung verfällt beim Fall (SH-20 + IH-14) · HB-47 Beinschaden bremst das Pferd (IH-20).

### Wahrscheinlich, nicht testbar
- IH-15 Diener-Schmuggel hält veraltete Depot-Referenz (Zeitfolge nicht nachstellbar).
- IH-16 Ruf ohne Grenze, teils bis 300, widersprüchliche Grenzen (Liste ohne Ort, nicht übergeben; im Bericht des Finders belegt).

### Verworfen
- SH-04 (Kauf leert Stadtlager nur bis Tagesende): nicht reproduziert, Endstände unterschiedlich.
- QA-01 (Paladin-Schrein an falscher Stelle): nicht reproduziert, Koordinaten stimmen mit LOCATIONS überein.

## Fit-Befunde (Urteile — der Entwickler entscheidet)
**Hoch**
- **SHF-01 Prothesen ohne laufenden Preis:** Die freigegebene T15-Wartung (Energiezelle, Kurzschluss, Verschleiß) ist nicht gebaut; ein Tausch auf Stufe 2 gibt +0 %, obwohl der Text „besser“ sagt. Regel: „Kybernetik ist ein Tausch“.
- **IHF-01 Gerissene Kette:** Wirtschaft löst Weltereignisse nur teilweise aus; Prothesen haben keine soziale oder Ruf-Folge. Regel: Kette der Systeme.
**Mittel**
- SHF-02 Prothesen verhalten sich medizinisch wie Fleisch · SHF-03 Die Stadt vergisst, wer die Wache erschlug · SHF-04 Burgfrieden gilt unverändert in gesetzloser Hauptstadt · IHF-02 Siedlung ist eine Insel (Markt, Krieg, Banden; Angriffe reiner Zufall) · IHF-03 Drei Untoten-Offensiven ohne Abgleich · IHF-04 Banden wirken nicht auf Handelswege · IHF-05 Erbe übernimmt uneinheitlich · IHF-06 „Zwanzig Jahre später“ lässt die Welt stehen · IHF-09 Bionik ist im Weltgeschehen unsichtbar (deckt sich mit der Entscheidung „Aurelion-Bionik im Krieg“).
**Niedrig**
- SHF-05 Bandenstadt hängt Aufträge der alten Herren aus · SHF-06 Betriebe in besetzten Städten stehen ohne Meldung still · SHF-07 Plünderer nur in Spielernähe · SH-14 Notwehr in der Burg löst Alarm aus · IHF-07 Zwei Vorratssysteme, drei Karawanenmodelle · IHF-08 Wetter global nach Region des Spielers.

## Feature-Karte
Vollständig (31 Features, liest von / wirkt auf) in `interaction_hunter.md`, Abschnitt „Feature-Karte“.

## Quest-Review
- 27 Questreihen, 26 im Code Ende-zu-Ende verfolgt, im Browser keine (Tab-Limit). Übersichtstabelle mit Testergebnis und vorgeschlagener eigener Kernaufgabe sowie 27 Quest-Blätter (Emblem/Farbe, Signaturszene als Shotlist, Spur in der Welt) in `quest_agent.md`.
- Kernbefund: Die große Mehrheit der festen Aufträge ist „töte N“ oder „bring N“; vier Klassenprüfungen laufen gleich ab; alle Aufträge nutzen denselben goldenen Marker. Schon eigen: Blutkult, Lila, Rotfall/Omega, Heer der Toten, Anomalie, Ahnenfeind.
- Sammelbefund: Stirbt ein benannter Auftraggeber, bleibt seine feste Quest für immer offen (Brett-Aufträge behandeln den Fall).

## Nicht abgedeckt
- Live im Browser: Sweeper, System Hunter, Interaction Hunter und Quest Agent konnten wegen des Tab-Limits nicht spielen (der Lead hat danach alte Tabs geschlossen); die Reproducer hatten Zugang, haben aber 37 Fälle nur per Code bestätigt.
- Feldzüge (Kette-Feldzug, Kreuzzug) nur gestreift. Koop nur oberflächlich. Stil D der Figuren nicht.

## Beobachtungen
- SW-01: `AUREL_HOUSES.find(...).name` / `COUNCIL.find(...).name` ohne `?.` an 6 Stellen — absturzgefährdet bei künftigen Datenänderungen.
- SW-02: Eine Probe schreibt kurz in das globale `ITEMS` (`ITEMS.__wall`).
- Viele Bugs dieser Runde sitzen in frisch gebautem Code (Stadt ohne Schutz, Burg): HB-11, -12, -24…27, -43…46.
