# Hunt 2: Bugjäger-Bericht (03.10.2026)

Code-Stand: Arbeitskopie vom 03.10. (Cache v24). game.js wurde während der Suche weiter bearbeitet; Zeilen haben sich um etwa 20 verschoben. Zeilennummern gelten für diesen Stand; im Zweifel nach dem Funktionsnamen suchen.
Methode: Code gelesen und im eigenen Tab (tab-73, Dev-Server 8770, `?dev`) nachgestellt. Vor jedem Neuladen wurde der Stand aus `rotfall.backup.s14c` zurückgeschrieben und `S._quiet = true` gesetzt. Am Ende war `rotfall.legacy.save` gleich dem Backup. Es gab keine Slot-Schreibvorgänge.
Selbsttest in diesem Lauf: **464/464 grün**. Keine der folgenden Fehlerstellen wird von einer Probe abgedeckt.
Spielcode wurde nicht verändert.

Legende: *live* = im Spiel nachgestellt (Messwerte stehen dabei) · *Code* = nur gelesen.

---

## 2 · Hoch

### HB2-01 · Lebensbalken: Er zeigt Kopf + Rumpf, aber gestorben und niedergeschlagen wird am Rumpf. Der Balken steht beim Tod noch bei 25–40 % — *live*
Das ist der Fehler, den der Entwickler meint („überträgt das nicht richtig“). Er betrifft alle Anzeigen, die `hp/maxHp` lesen.
- **Repro A (Gegner):** `?dev` → `e = RF.spawnEnemy('bandit', …, {level:5, noVariant:true})`, dann `RF.hurt(e, 6, RF.S.player)` wiederholen, bis `e.alive === false`.
  Gemessen: 62/62 zu Beginn. Nach 15 Treffern ist der Bandit tot bei **hp 25/62 = 40 %**: Rumpf 0, Kopf 25 voll.
- **Repro B (Held):** `RF.hurt(p, 4, null)` wiederholen, bis `p.downed`. Gemessen: am Boden mit **HUD „Leben 24/101“**, Balken `scaleX(0.24)`. Rumpf −1, Kopf 24.
- **Erwartet:** Der Balken erreicht 0, wenn die Figur fällt. Beim Helden warnt die Anzeige vor dem Niederschlag.
- **Tatsächlich:** Humanoide fallen, sobald `body.torso.hp ≤ 0`. Der Balken rechnet aber `max(0,Kopf) + max(0,Rumpf)` gegen `Kopf.max + Rumpf.max`. Der Kopf ist 25/70 des Balkens und wird kaum getroffen (HIT_W 6 von 110, Kopfschaden gedeckelt). Deshalb bleiben beim Fall meist 25–40 % stehen. Treffer auf Glieder bewegen den Balken nur um 20 % des Schadens (60 % gehen ins Glied, 20 % in den Rumpf).
- **Ursache:** `src/body.js:43–49` `syncHp` (hp = Kopf + Rumpf) gegen `src/body.js:50` `vital = torso.hp` (entscheidet über den Niederschlag) und `body.js:73–96` `damagePart`.
- **Gleicher Fehler anderswo — ja, überall wo `hp/maxHp` gezeigt wird:** HUD „Leben“ (`ui.js:129`), Gruppenleisten (`ui.js:143/153`), Ziel-Lebensbalken und Ersatzbalken „zuletzt getroffen“ (`render.js:3340–3343`), **Boss-Leiste** (`render.js:264–268`). Humanoide Bosse haben einen Körper: Banditenboss, Varg, Gorak, Hrodvar, Garmadon, Weißbart. Deren Rumpf ist nur 60–68 % der Leiste, sie verschwindet also bei etwa einem Drittel. Die Koop-Übertragung schickt dieselben `hp/maxHp`, beim Gast ist die Abweichung also gleich. Auch KI-Schwellen wie `hp < maxHp*0.3` (Flucht, Berserker, Exekution) sehen den Wert mit Kopf. Tiere und Untote ohne Körper sind nicht betroffen.
- Offene Designfrage für den Lead: Soll der Balken den Rumpf zeigen (`vital`) oder bleibt Kopf + Rumpf und der Tod richtet sich danach? Das wird hier nicht entschieden.

### HB2-02 · Koop-Gast: Klassen-Prüfungen sind nicht bestehbar. Gewertet wird immer der Host — *live*
- **Repro:** `A = RF.coopAPI(); m = A.makeGuestHero({name:'Gasti'}, 'Attrappe'); m.equip.weapon = RF.mkItem('shortbow'); m.ktSteps = {kt_archer1:1}; await RF.coop.fakeGuest(m.id)`. Host und Gast stehen bei Tomas (`relations.tomas = 60`). Dann `RF.coopHooks.guestAct(m, tomas)` → „Kannst du mich ausbilden?“ → „Ich höre.“ → „Ich mache es.“ → noch einmal ansprechen → „Ich bin bereit.“ Die Bogenprüfung startet (5 Puppen).
  Gemessen: `RF.hurt(puppe, 8, m)` auf alle 5 Puppen ergibt **T.n = 0**, keine Rückmeldung. Dieselben Treffer vom Host ergeben „nur mit dem Bogen“, weil der Host ein Langschwert trägt.
- **Erwartet:** Die Prüfung gehört der Figur, die sie begonnen hat (Kommentar `game.js:13775` und `13555`: „Koop: jeder für sich“).
- **Ursache:** `startClsTrial`/`startTrial` laufen in `runAs` mit `S.player = Gastfigur`. Danach prüfen aber `trialTick` (`game.js:13941ff`) und `ktTrialHurt` (`game.js:13857ff`) immer den aktuellen `S.player`, also den Host: `source === p`, `p.downed`, Abstand > 900 zum Host, `hasShield(p)`, `target === p` in der Grube. `clsTrialEnd` (`13839ff`) schreibt außerdem dem Host Toasts und Logs.
- **Folge:** Bogen-, Meuchel-, Gruben-, Halte- und Schildduell-Prüfung kann der Gast nicht bestehen. Sie scheitern auch, sobald der Host mehr als 900 px entfernt ist oder am Boden liegt. Alle Grundklassen haben jetzt eine Prüfung, der Gast kann also kaum noch Klassen lernen.
- Gleicher Fehler anderswo: `S.trial` gibt es nur einmal global. Startet der Host eine Prüfung, wird die des Gasts beendet (`endTrial(null)`).

---

## 3 · Mittel

### HB2-03 · Nach dem Laden zeigen Held und alle Figuren ein veraltetes Leben, beim ersten Treffer springt es — *live*
- **Repro:** Echter Stand (aus Backup) laden. HUD **„Leben 231/231“**. Körper: Kopf 36/36, Rumpf 65/65, Glieder max 29 (alter Stand). Ein Treffer `RF.hurt(p, 5)` ergibt **„Leben 96/101“**, die Glieder springen auf max 100.
- Zählung direkt nach dem Laden: **1370 von 1914 Figuren mit Körper** haben `hp/maxHp ≠ Kopf+Rumpf`. Beispiele: Kelan 231 statt 101, Gerold 190 statt 78, Brann 191 statt 89. Bosse stimmen.
- **Ursache:** `continueGame` ruft für den Helden nur dann `recalc`/`syncHp` auf, wenn `talentTopUp` Punkte nachreicht (`game.js:2396`). Die Umstellung der Glieder auf 100 in `syncHp` (`body.js:45`) läuft erst beim nächsten Schaden oder Heilen. Die Ladeschleife (`game.js:2357–2364`) gleicht nur Figuren ohne `body` an.
- **Folge:** Balken und Zahlen stimmen bis zum ersten Treffer nicht, danach „bricht“ das Leben auf weniger als die Hälfte ein. KI-Schwellen (`hp < maxHp*x`) und Prüfungen wie `e.hp >= e.maxHp` (Hinterhalt, Wächterspinne) arbeiten mit den alten Zahlen.
- Gleicher Fehler anderswo: `game.js:8795` (Magitech-Unfall) senkt bei NPCs mit Körper nur `v.hp`, nicht den Körper. Der Balken fällt, der nächste `syncHp` setzt ihn zurück.

### HB2-04 · Der Ersatzbalken „zuletzt getroffen“ kommt nur im Nahkampf. Pfeil, Bolzen, Wurf und Zauber zeigen keinen — *live*
- **Repro:** Auswahl leeren (`R.focus.sel = R.focus.last = null`), Wolf erzeugen, `RF.hurt(wolf, 3, p)`, dann `RF.spellHit(p, wolf, 3, {el:'fire'})`. Gemessen: **`R.barTarget()` bleibt null**, `focus.last` wird nicht gesetzt.
- **Ursache:** `R.focus.last` wird nur in `hit()` gesetzt (`game.js:3680`). Geschosse (`hurtFromProjectile`, `game.js:4383ff`) und Zauber (`spellHit`, `game.js:3543ff`) rufen `hurt()` direkt auf.
- Gleicher Fehler anderswo: Beim **Koop-Gast** gibt es den Ersatzbalken nie, denn Kampf läuft beim Host, und der Gast setzt `focus.last` nie. Er sieht nur Balken für Ziele, die er selbst per Rechtsklick gewählt hat.

### HB2-05 · Verfolger geben nur einmal im Leben auf, danach jagen sie über jede Entfernung — *live*
- **Repro:** Wolf mit `aggroId = Held`, auf 1700 px setzen, `RF.think` aufrufen: `giveUp` wird gesetzt, `aggroId = null` (richtig). Dann `giveUp.until` ablaufen lassen, neu jagen lassen, wieder auf 1700 px, danach auf **5000 px**: **`aggroId` bleibt der Held**, kein zweites Aufgeben.
- **Ursache:** Die Leine prüft `!e.giveUp` (`updateEnemy`, `game.js:4416`). `e.giveUp` wird nirgends gelöscht (gesucht: `giveUp = null` / `delete`, keine Stelle). Nach dem ersten Aufgeben ist die Leine für dieses Tier aus.
- **Folge:** Der Verfolger bleibt „heiß“. Despawn ist für ihn gesperrt (`game.js:12571/12574/12743`), Ruhen auch (`game.js:2853`). Tiering friert ihn nicht ein (`game.js:820`). Das ist genau der Fall, den die Despawn-Änderung vom 02.10. lösen sollte.

### HB2-06 · Zeitstempel überleben das Laden weiter (HB-02 unvollständig): Gegner ignorieren den Helden, Meuchelstich-Prüfung wird trivial — *live*
- **Repro:** Felder setzen (`e.giveUp.until`, `blutschoepfer.drinkCd`, `p.stabAt`, `p.netFree` = jetzt + 1 h), dann `continueGame(JSON.parse(saveData()))`. Gemessen: **alle vier Werte unverändert (3 650 142)** nach dem Laden. Danach steht ein feindlicher Bandit 60 px vor dem Helden und **greift nicht an** (`aggroId null`, `idle`, `isHostile = true`).
- **Ursache:** Diese Felder fehlen in `PERF_KEYS` (`game.js:2270–2272`): `giveUp.until` (verschachtelt, Schlüssel `until` fehlt), `drinkCd` (Blutschöpfer, `game.js:5000`), `netFree` (Netzwerferin, `game.js:4987`), `stabAt` (`game.js:15869`), `thrallUntil` (`game.js:15691`). Ein neuer Seitenaufruf beginnt `performance.now()` wieder bei 0.
- **Folgen je Feld:**
  - `giveUp.until`: Wer vor dem Speichern aufgegeben hat, ignoriert den Helden so lange, wie die alte Sitzung lief (`game.js:4440`).
  - `stabAt`: In der Schurkenprüfung zählt jeder Treffer als Meuchelstich (`game.js:13861`: `now − stabAt < 1500` ist negativ).
  - `drinkCd`: Der Blutschöpfer trinkt lange nicht.
  - `netFree`: Der Held ist lange gegen Netze immun.
- Achtung beim Beheben: `p.drinkCd` (Tränke, Brunnen) nutzt `clock()` (`game.js:5447`). Der Schlüssel `drinkCd` darf nicht pauschal in `PERF_KEYS`. Die Probe „HB-02“ findet diese Fälle nicht.

### HB2-07 · Der Sternenhimmel läuft nach dem Schließen weiter und schluckt das nächste Esc — *live*
- **Repro:** Talente (T) öffnen. Der Himmel zoomt auf das eigene Sternbild (`focus = 'wanderer'`). Fenster schließen (`closeModal`), dann **Esc** drücken: Gemessen **kein Fenster** (`modalOpen = null`), der versteckte Himmel zoomt heraus (`focus null`). Erst das **zweite** Esc öffnet die Einstellungen.
- Im geschlossenen Zustand gemessen: **2880 `fillRect` pro Sekunde** auf dem versteckten Canvas (Hintergrund-Tab, gedrosselt; im Vordergrund mehr).
- **Ursache:** `closeModal` (`ui.js:824`) versteckt das Fenster nur. Der Canvas bleibt im DOM, deshalb greift `!v.cv.isConnected` in `sky.js:80/117` nicht. Draw-Schleife (`sky.js:164`) und Tasten-Listener mit `capture` und `stopImmediatePropagation` (`sky.js:80–83`) bleiben aktiv, bis ein anderes Fenster geöffnet wird. Davon sind auch die Tasten `+`, `=` und `-` betroffen.
- Gleicher Fehler anderswo: Esc bei einem offenen Dialog nach dem Talentfenster wird ebenso verschluckt.

### HB2-08 · Koop-Gast gibt einen Auftrag ab: Der Gast bekommt doppelte Erfahrung, der Host keine — *live*
- **Repro:** Gastfigur (fakeGuest, `coopPilot` gesetzt), `kt_archer1` aktiv und erfüllt (3 Wolfsfelle im Gepäck des Gasts). Wie `runAs` setzen: `S.player = Gast`, `RF.trialOffer(tomas,'archer')` → „Erledigt.“ Gemessen bei Belohnung 80 EP: **Gast +160 EP, Host +0 EP**.
- **Ursache:** `turnIn` → `gainXp(S.player, r.xp)` (`turnIn`, ca. `game.js:13573`), wobei `S.player` die Gastfigur ist. `gainXp` (`game.js:4256ff`) gibt erst `c` die EP und dann noch einmal jedem `partyMembers()` mit `coopPilot` den vollen Betrag. Die Gastfigur ist selbst in `S.party`, bekommt also zweimal. Der Held ist in dem Moment nicht `S.player` und geht leer aus.
- Erwartet laut Entscheidung (Memory „coop-sharing“): EP werden geteilt, beide bekommen sie.
- Gleicher Fehler anderswo: jede `gainXp(S.player, …)`-Belohnung in `runAs`, also Aufträge, Prüfungsschritte, Lehrer-Bewährung und Brettaufträge des Gasts.

### HB2-09 · Klassen-Prüfung im Koop: Ein gemeinsamer Auftragszustand überschreibt den Fortschritt des anderen — *Code + live (Zustand)*
- `S.quests[kt_*]` gibt es nur einmal. Nur `ktSteps` hängt an der Figur.
  - Nimmt der Gast einen Schritt an, den der Host gerade macht, setzt `startQuest` (`game.js:13513`) den Fortschritt **für beide** auf 0.
  - Gibt der Gast ab, steht `state: 'done'` (live gesehen: `qstate 'done'`, nur `m.ktSteps.kt_archer1 = 1`). Der Host hat dann kein `ktSteps` und bekommt den Schritt neu angeboten: neu annehmen, Fortschritt 0.
- Erwartet: „Koop: jeder für sich“ (`game.js:13555`).

### HB2-10 · Betriebe: Lohnverlust wird nicht abgezogen, wenn sich die Tagessumme genau auf 0 aufhebt — *Code*
- `economy.js:283`: `if (income) { if (loss) S.gold -= loss … }`. Beispiel: Betrieb A +6 in die Kasse, Betrieb B −6 (leere Kasse, also `loss = 6`). Dann ist `income = 0` und die 6 Gold Lohn werden nie abgezogen, es gibt auch keine Meldung. Selten, aber dieselbe Fehlerart wie HB-18.

---

## 4 · Niedrig

- **HB2-11 · `openModal('stable')` ohne Stall-NPC wirft einen Fehler** („Cannot read properties of undefined (reading 'key')“, live). Über die Leiste nicht erreichbar, weil `stable` keinen Reiter hat. Nur Debug und Code, kann aber bei einem späteren Reiter auffallen.
- **HB2-12 · Schadenszahlen von Beschwörungen gelten nicht als „eigener Schaden“:** `dmgFloat` (`game.js:4325`) prüft `src.ownerId`, Diener tragen aber `servant`. Bei „Reduziert“ fehlen sie (Code).
- **HB2-13 · Bezahltes Vergessen beim Lehrer zählt `Object.keys(p.tree)`** (`respec`, ca. `game.js:13712`), das kostenlose Neuordnen zählt `talentSpent` (nur gültige Sterne ohne Gefährtensterne). Gibt es in einem alten Stand Schlüssel, die es im `SKILL_TREE` nicht mehr gibt, zahlt der Lehrer dafür Punkte aus (Code; im Backup-Stand ist der Baum leer, also nicht prüfbar).
- **HB2-14 · Proviant aus dem Gepäck wird stumm gegessen** (`game.js:12530–12532`): Brot und Trockenfleisch verschwinden täglich ohne Meldung, auch allein ohne Gruppe. Die Regel steht nur im Tooltip (Gate-Regel „jede Mechanik braucht einen Hinweis“).

---

## Geprüft ohne Fund
- Docks und Fenster bei 1024 px und 760 px: Kein Element ragt aus dem Bild, kein waagerechter Bildlauf (DOM-Messung aller 19 Fenster; Party/Siedlung ragen nur während des Einschiebens 33 px hinaus).
- `applySave`-Urzustand (HB-04), `passTime` Stunde für Stunde (HB-03), HB-01-Ladepfad (`S.dying`): Code sieht richtig aus, die Proben sind grün.
- Betriebe-Kasse: Überfall halbiert (`bizRaid`), Besetzung/Zerstörung leert sie (`economy.js:246`). Wie beschrieben.
- Schmied: Verbessern (max. Meisterlich) und Schmieden lassen (Fertigkeit wird zurückgesetzt, Gebühr bei Fehlschlag erstattet). Kein Fehler gefunden.
- Talentpunkte-Regel: `talentTotal`/`talentTopUp`/`levelUp` sind konsistent (1 + Stufe/2 + Prüfungen). Gastfigur bekommt Punkte (live: Stufe 10 → 6 Punkte).
- Test Room `__arena`: Schnappschuss und Rücksetzen gelesen, Speichern ist durch `guardSave` gesperrt.

## Nicht geprüft
- Bildschirmfotos (der eigene Tab liefert im Hintergrund nur verkleinerte Bilder). Quest-Optik, Siegel, Pergament, Story-Fenster und Emotes wurden nicht visuell geprüft.
- Tod und Erbe im Wegwerf-Slot (nur Code), „Sehr schwer“, Reduzierte Bewegung (nur Code: der Himmel beachtet `motion`).
- Neue Gegner nur gelesen (Blutschöpfer, Spinne, Spion, Netz). Nicht gespielt.
