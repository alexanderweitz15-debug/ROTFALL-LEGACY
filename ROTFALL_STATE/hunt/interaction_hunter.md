# Interaction Hunter — Hunt 1 (02.10.2026)

Auftrag: Bugs zwischen Systemen und über Zeit, Feature-Karte, Fit-Befunde. Kein Spielcode geändert.

**Wichtig zu den Zeilennummern:** `src/game.js` wurde während dieses Laufs von außen geändert (Stand 10:03 Uhr, 19 183 statt 19 126 Zeilen; neu u. a. „Blutkult-Sense (Entwickler 02.10.)“). Ab etwa Zeile 6 120 sind alle Stellen um +42 bis +44 verschoben. Die Nummern unten gelten für den **Stand nach der Änderung**; maßgeblich ist der Funktionsname. Teile wurden von drei Unteragenten (Explore, nur lesend) gelesen; das ist bei jedem Kandidaten vermerkt („UA“). Die zentralen Stellen habe ich selbst geöffnet.

**Browser:** nicht genutzt. `tabs_create` schlug fehl (Tab-Grenze: 9 offene Tabs, keiner davon meiner). Fremde Tabs habe ich nicht geschlossen. Alle Befunde stammen aus gelesenem Code; die Repro-Schnipsel sind **nicht ausgeführt**.

---

## Kandidaten

### IH-01 — Gespeicherter toter Held: nach dem Laden gibt es keine Erbenwahl, der Stand hängt (neue Information zu RB-011)
- **Ort:**
  - game.js `die` 3672–3676: Der Held wird aus `S.ents` entfernt, danach wird `playerDeath` aufgerufen.
  - `playerDeath` 14239: `save()`.
  - state.js:145: `SKIP` enthält `dying`.
  - `continueGame` 2052–2053: Der tote Held wird wieder in die Karte eingesetzt.
  - `dyingEnd` 13655: einziger Aufrufer von `UI.showDeath` und darüber von `chooseSuccessor`.
  - `bindInput` 14645: `beforeunload` ruft `saveSync()`.
- **Was passiert:**
  - Der Tod wird gespeichert, bevor der 3-s-Moment beginnt. `S.dying` und `S.paused` werden nie gespeichert.
  - Wird die Seite in den 3 s, auf dem Todesbildschirm oder in der Erbenwahl geschlossen oder neu geladen, startet „Fortsetzen“ mit `S.player.alive === false`.
  - Keine Stelle im Ladepfad ruft `dyingEnd` oder `chooseSuccessor`. Eine Suche nach `!S.player.alive` in game.js ergibt null Treffer.
  - `update` ruft `controlPlayer` nur bei `p.alive` auf (2425). Die Welt läuft weiter, der Spieler kann nichts tun.
  - `dayTick` speichert täglich (11443), der kaputte Zustand wird also immer wieder überschrieben.
  - Die Spielstandkarte zeigt „—“ statt „gefallen“: `slotMetaFrom` (state.js:39–40) findet den Helden nicht in `ents`, weil er beim Tod entfernt wurde.
- **Was passieren sollte:** Nach dem Laden eines Todesstands sollte die Erbenwahl kommen. Das ist RB-011 („Stand zwischen Tod und Erbenwahl gespeichert: lädt er richtig?“), dort noch offen mit „?“.
- **Auslöser:** Held stirbt, danach wird der Browser geschlossen oder neu geladen, bevor ein Erbe gewählt ist. Das ist naheliegend: Auf dem Todesbildschirm wird oft geschlossen.
- **Schwere:** 1 (Kritisch). Die Dynastie lässt sich nicht fortsetzen, der Stand ist praktisch verloren.
- **Sicherheit:** hoch, aus dem Code. Nicht live geprüft.
- **Repro (nur Wegwerf-Platz):**
  1. Laden mit `?dev` wie in HUNT.md beschrieben.
  2. Ausführen: `const A=RF.coopAPI(); A.setSlot(A.newSlot('single')); RF.S._quiet=false; RF.die(RF.S.player,'Probe');`
  3. Nach etwa 1 s neu laden und diesen Platz fortsetzen.
  4. Erwartet laut Bug: `RF.S.player.alive===false`, `RF.S.paused===false`, kein Todesbildschirm.
  5. Danach Platz löschen, `rotfall.slot.active` und `rotfall.slot.lastSingle` auf `legacy` zurücksetzen.

### IH-02 — `performance.now()`-Zeitstempel überleben das Laden: Raserei friert ein, Armbrust bleibt gespannt, Nebel macht unverwundbar
- **Ort:**
  - Reset-Liste in `continueGame` 2077–2082 und 2111. Sie setzt nur `act`, `hexed`, `rooted`, `silenced`, `voidRage`, `darkPact`, `timeSlow`, `soulBound`, `exposed`, `cowed`, `shockImm`, `tended`, `cmdUntil`, `pathFail`, `tradeT`, `reactAt`, `brawlKO` und `talk` zurück, beim Helden zusätzlich `dodge`, `dodgeCd`, `invuln` und `channel`.
  - **Nicht** zurückgesetzt werden:

  | Feld | gesetzt in | Wirkung |
  |---|---|---|
  | `p.vamp.frenzyT` | 13266 | Held kann sich nicht bewegen (2918: `vx=vy=0; return`) |
  | `reloadUntil` | 3082 | Armbrust schießt nicht (3010), Tempo ×0,6 (2953) |
  | `mistUntil` | 13981 | `hurt` bricht ab (3397): unverwundbar |
  | `lureCd` | 3271/3273 | Toast „Die Pfeife braucht noch 3600 s“ |
  | `shadowNext` | — | nächster Hieb ×2,5 (3309) |
  | `riposteUntil` | — | — |
  | `guardBroken` | — | keine Deckung (14699 ff.) |
  | Geist `phased` | 3382 | immun gegen körperlichen Schaden (3406) |
  | `confused` | — | Gegner verfehlt zu 50 % (4419) |
  | `spent` | 3259 | ×1,35 Schaden |
  | `giveUp.until` | 3997 | Gegner ignoriert den Helden |
  | `thrallUntil` | 13987 | Bann-Knecht bleibt Diener; nicht transient, wird gespeichert |

- **Was passiert:** Nach dem Neuladen beginnt `performance.now()` wieder bei etwa 0. Ein gespeicherter Wert „alte Sitzungszeit + Dauer“ gilt dann so lange, wie die alte Sitzung lief, also Minuten bis Stunden.
  - Beispiel: Speichern während der Raserei, dann neu laden. Der Held steht still, bis die frühere Sitzungsdauer real verstrichen ist.
  - `beforeunload` speichert den Wert erneut. Bei kürzeren Folgesitzungen bleibt der Held weiter gesperrt.
- **Was passieren sollte:** Wie bei den Feldern der Reset-Liste: Zeitstempel sind nach dem Laden wertlos. So steht es im Kommentar an Zeile 2080.
- **Auslöser:** Speichern innerhalb des Wirkfensters. Das passiert über das tägliche `save()`, über `beforeunload` (jederzeit) oder über den Knopf „Speichern“.
  - Fenster: Raserei 2–4 s, Pfeife 30 s, Armbrust ≈ Ladezeit, Nebel 0,5 s.
- **Schwere:** 2 bei Raserei (Spieler steckt fest), sonst 3.
- **Sicherheit:** hoch (Reset-Liste gelesen). Ebenso vom UA (Körper) für `mistUntil` gefunden.
- **Repro:**
  1. `RF.S._quiet=true; const p=RF.S.player; p.reloadUntil=performance.now()+3.6e6; RF.coopAPI().continueGame(JSON.parse(RF.saveData()));`
  2. Prüfen: `RF.S.player.reloadUntil>performance.now()` ist immer noch `true`.
  3. Der echte Fall braucht ein Neuladen im Wegwerf-Platz.

### IH-03 — Zeitsprünge (Schlaf, Schnellreise, See- und Luftfahrt, Handwerk) überspringen alle Stundenhaken außer dem Krieg
- **Ort:**
  - `passTime` 4811–4815 holt nur `SIM.warTick` für übersprungene Stunden nach.
  - `update` 2404–2405 ruft `hourTick` nur für die aktuelle Stunde auf.
  - Aufrufer: Schlafen 4827 (nachts bis 7 Uhr), Reise 7976, Schiff und Luftschiff 7428 und 7433, Studium 12673, Nachtwache 13326 und weitere.
- **Was passiert:** Stundengebundene Ereignisse fallen weg, wenn der Spieler die Stunde verschläft oder überreist:
  - `cultCrown` nur bei `h === 3` (13393): Die Rote Krönung kommt nie, wenn der Held nachts schläft.
  - `cultTake` nur bei `h === 23` (13398): Entführungen fallen aus.
  - Albins Tod nur bei `h === 6` (13402): Dieser Zweig der falschen Anklage bricht ab, denn Schlafen geht bis 7 Uhr.
  - `cultLordHour`: 8 / 9 / 23 Uhr.
  - Siedlungsangriff nur bei `h === 2` (10369).
  - `lawlessHour` (nachts Plünderer), `travelHour`, `cultMasks`.
  - Außerdem steigt in `passTime` weder der Blutdurst (`vampTick` 13249 läuft nur pro Bild), noch laufen Statusdauern ab.
- **Was passieren sollte:** Wie beim Krieg die übersprungenen Stunden nachholen. Der Kommentar in 4812 zeigt, dass das Problem für den Krieg bekannt war. Die Bedrohungs- und Krisentakte (DECISIONS 01.10.: Krönung, Heerzug, Fall gegen Tag 120–150) setzen ein Weiterlaufen voraus.
- **Auslöser:** Jede Nacht im Bett, jede Fahrt mit Kutsche, Schiff oder Luftschiff.
- **Schwere:** 3; ausnutzbar (Krönung aussitzen).
- **Sicherheit:** hoch.
- **Repro:** `RF.S.cult.crown=RF.S.day|0; RF.S.cult.stage=1; RF.S.minute=22*60;` dann im Debug-Menü „Zeit +6 Stunden“ wählen. Ergebnis: `RF.S.cult.crowned` bleibt leer.

### IH-04 — Laden aus dem laufenden Spiel (Koop „Hosten“) übernimmt Zustand des vorigen Stands und schreibt ihn in den Koop-Platz
- **Ort:**
  - state.js `applySave` 268–271 überschreibt nur Schlüssel, die im Stand stehen.
  - `continueGame` 1994 ff. leert `S` vorher nicht, anders als `newGame` 1846 (RB-055).
  - coop.js:75: `hostSlot` → `if (A.isRunning()) A.continueGame()`, aufrufbar aus dem laufenden Einzelspiel (Einstellungen → Koop).
- **Was passiert:** Jeder Schlüssel, den der Koop-Stand nicht hat, behält den Wert aus dem Einzelspiel. Betroffen sind lazy angelegte Schlüssel wie `S.keepDepot`, `S.keepStash`, `S.schutzBurg`, `S.jail`, `S.nemeses`, `S.after`, `S.big`, `S.halt`, `S.mourn` und `S.growth`.
  - `if (S.jail) { ensureJail(); … }` (2103) kann dann sogar die Haft aus dem anderen Stand auslösen.
  - Der Host speichert danach in den Koop-Platz, die Vermischung wird also dauerhaft.
  - Dasselbe passiert beim Gast in coop.js:419 (`continueGame(data)`); der Gast speichert aber nie.
- **Was passieren sollte:** Ein geladener Stand enthält nur seinen eigenen Zustand, wie es RB-055 für „Neues Spiel“ festlegt.
- **Schwere:** 2 (fremder Zustand dauerhaft im Spielstand).
- **Sicherheit:** hoch für den Mechanismus. Häufigkeit eher niedrig, weil es einen Koop-Stand braucht, der älter ist als die Schlüssel.
- **Repro:** `RF.S._quiet=true; RF.S.zzTest=1; const d=JSON.parse(RF.saveData()); delete d.zzTest; RF.coopAPI().continueGame(d); RF.S.zzTest` ergibt `1`.

### IH-05 — Vom Blutkult Entführte (und Hunger-Abwanderer der Kette) werden beim Laden durch Doppelgänger ersetzt
- **Ort:**
  - `cultTake` 13370 ff.: Der Bewohner wird aus `S.ents.world` entfernt und als ganzes Objekt in `S.cult.missing` abgelegt.
  - `spawnResidents` 854–877: Ein Haus gilt als bewohnt nur, wenn `S.ents.world.some(c => c.homeId === b.id)`.
  - Der Name ist fest aus Hauslage und Index abgeleitet (864).
  - Aufrufe beim Laden: 2106 und 2108, dazu `growTown`.
  - `cultFree` 13494–13498 setzt das Original zurück in die Welt.
  - Ebenso `tributeDay` 5735: `v.alive=false; splice`, ohne `die`.
- **Was passiert:** Bei einem Haus mit einem einzigen Bewohner steht nach dem nächsten Laden ein neuer Bewohner mit gleichem Namen und Beruf im Haus, während die Kult-Tafel ihn als vermisst führt.
  - Wird das Original befreit, gibt es zwei gleichnamige Bewohner mit derselben `homeId`.
  - `cultTake` kann den Ersatz erneut entführen; die Grenze von 8 zählt weiter.
- **Was passieren sollte:** Vermisste fehlen, bis sie befreit oder tot sind. Die Kult-Questreihe lebt von „Menschen verschwinden“.
- **Schwere:** 3.
- **Sicherheit:** mittel-hoch. Ob Varonheim-Häuser mit nur einem Bewohner häufig sind (`residentPlan`), ist nicht geprüft.
- **Repro:** `cultTake()` erzwingen (Debug), Hausbewohner per `homeId` merken, Laden im Wegwerf-Platz, `S.ents.world.filter(c=>c.homeId===id)` zählen.

### IH-06 — Erbfolge lässt Bindungen am alten Helden hängen
- **Ort:**
  - `adoptSuccessor` 14389–14422.
  - `familyDay` 14268–14272.
  - `dynastyChoices` 14273 ff.
  - `captiveTick` 13835.
  - `servantSmuggle` 8799–8812.
- **Was passiert:**
  1. `S.legacy.spouse` wird nur gelöscht, wenn der Erbe selbst der Ehepartner ist. Erbt der Sohn, bleibt dessen Mutter „Ehepartner“. Dialog („Wie geht es den Kindern?“) und Geburten laufen weiter; die Chronik schreibt: „Kind von [Sohn] und [Mutter]“.
  2. Gefesselte Gefangene (`prisoner.by = alte id`) frieren ein (`if (e.prisoner.by !== p.id …) { e.vx=e.vy=0; return; }`). Erst beim Laden werden sie freigegeben (2090).
  3. `S.keepStash` ist an keine Person gebunden. Der Erbe holt die geschmuggelte Waffe des Ahnen beim Diener ab, entgegen dem Kommentar „Persönliche Waffen bleiben am Grab“. Auch UA (Wirtschaft) B3.
  4. Die Haustiersuche `find(e => e.pet && e.servant === old.id)` kann einen Bann-Knecht (`pet: true`, 13987) statt des Haustiers treffen.
- **Was passieren sollte:** Bindungen gehen mit dem Toten oder gezielt auf den Erben über.
- **Schwere:** 3.
- **Sicherheit:** hoch für 1–3, mittel für 4.
- **Repro:** `RF.S.legacy.spouse = <npc.id>`, Tod, Erben wählen, der kein Ehepartner ist; dann `RF.S.legacy.spouse` prüfen.

### IH-07 — Zweiwaffen-Ausrüsten prüft den ausgefallenen linken Arm nicht (UA Körper, selbst gelesen)
- **Ort:** game.js `equip` 219–222.
- **Was passiert:** Zeile 220 sperrt Nebenhand und Zweihänder bei ausgefallenem linkem Arm. Der Zweiwaffen-Zweig (221) legt eine Einhandwaffe trotzdem in `equip.offhand`.
- **Was passieren sollte:** Wie in 220. `limbLost` wirft die Nebenhand beim Ausfall ab.
- **Schwere:** 3.
- **Sicherheit:** hoch.
- **Repro:**
  1. `p=RF.S.player; p.currentClass='rogue'; p.body.larm.hp=0;`
  2. Eine Einhandwaffe angelegt, eine zweite im Inventar, dann `RF.equip(p,i)`.
  3. Ergebnis: `p.equip.offhand` ist gesetzt.

### IH-08 — Am Boden heilt sich der Held selbst: Hotbar, Erneuerungstrank, Seelenphiole (UA Körper, selbst gelesen)
- **Ort:**
  - Statusschleife 2786: `if (s.key === 'regrowth' && !(c.downed && c !== S.player)) B.heal(…)`. Der Held ist ausdrücklich ausgenommen.
  - `useSlot` 14213 ohne Boden-Prüfung; Taste 1–0 in 14616 auch am Boden.
  - Seelenphiole `B.heal(c, 8)` (487).
  - Aufstehen bei 25 % Rumpf (2791).
- **Was passiert:** Der gefallene Held trinkt oder regeneriert sich hoch und steht ohne Hilfe auf.
- **Was passieren sollte:** Knockout-Regel (HUNT.md §3, Memory): „am Boden keine Selbstheilung, schrittweises Aufrichten“.
- **Schwere:** 3.
- **Sicherheit:** hoch für den Code. Der Kommentar spricht nur von NPCs, die Umsetzung wirkt halb.
- **Repro:** `p=RF.S.player; RF.B.damagePart(p,'torso',999); p.downed=true; p.status=[{key:'regrowth',left:60000,heal:5}]; RF.tick(10000); p.downed`

### IH-09 — Lebensraub fliegender Geschosse heilt einen inzwischen gefallenen Schützen (UA Körper)
- **Ort:** game.js 3885 (Seelenzug `own.alive`) und 3901 (Blutpeitsche `attacker?.alive`). 3901 heilt sogar vor `hurt`, also auch dann, wenn `hurt` wegen `invuln` oder Nebel abbricht.
- **Was passieren sollte:** Wie im Nahkampf (3364/3368/3379: `!attacker.downed`).
- **Schwere:** 4.
- **Sicherheit:** hoch für den Code, niedrig für die Häufigkeit. Von mir nicht selbst geöffnet.

### IH-10 — Gruppenheilzauber und Kettengebet richten Gefallene sofort auf (UA Körper)
- **Ort:** game.js 3199–3204 (Form `group`) und `chain_prayer` (≈14818). Die Filter prüfen nur `alive`, nicht `!downed`; `B.heal` heilt den Rumpf zuerst.
- **Vergleich:** `partyCare` filtert `!a.downed`.
- **Schwere:** 3.
- **Sicherheit:** mittel. Fremdheilung, also eventuell gewollt. Nicht selbst geöffnet.

### IH-11 — Ein Bruch überdauert Abtrennung und neue Prothese (UA Körper)
- **Ort:** body.js:87 (Abtrennen löscht `broken`/`splint` nicht), body.js:125 (`attachProsthesis` ebenso nicht), game.js Glied-Tausch ≈9961.
- **Was passiert:** Die frische Prothese heilt nur bis 40 % (`topOf`) und gibt später eine Bruch-Narbe mit Rüstungsbonus.
- **Was passieren sollte:** Laut Kommentar body.js:124 „immer frisch“.
- **Schwere:** 3.
- **Sicherheit:** hoch (UA). Nicht selbst geöffnet.

### IH-12 — „Handeln“ im Kontextmenü umgeht alle Ladensperren
- **Ort:** ui.js:429: `$('ctx-trade').onclick = () => near ? openModal('trade', target) : …`. Geprüft wird nur der Abstand.
- **Was passiert:** Gegen Ruf „Verhasst“, `shopClosed` (auch die Läden der gefallenen Hauptstadt, `capitalFall`), Öffnungszeit, besetzte Stadt und Vharnholm kann man trotzdem handeln. `shopRefusal` wird nicht aufgerufen.
- **Was passieren sollte:** Dieselbe Prüfung wie im Dialog und in `tradeAt`.
- **Schwere:** 3 (ausnutzbar).
- **Sicherheit:** hoch (selbst gelesen: ui.js 427–429, `buy`/`sell` ohne Prüfung).

### IH-13 — Kauf und Verkauf prüfen den Händler nicht; das Handelsfenster pausiert die Welt nicht
- **Ort:** game.js `buy` 12982, `sell` 13001. Weder Lebend- noch Abstands-, Karten- oder `shopRefusal`-Prüfung. Der Koop-Gast hat sie (coop.js:314).
- **Was passiert:** Handel mit einem Händler, der während des offenen Fensters stirbt, wegläuft oder bei dem man verhaftet wird.
- **Schwere:** 3.
- **Sicherheit:** hoch für die fehlende Prüfung, mittel für die Spielwirkung. Dass die Welt im Handelsfenster nicht pausiert, stammt vom UA (ui.js:547–564).

### IH-14 — Waffenkammer: geschmuggelte Ware verfällt beim Fall der Hauptstadt; die Rückgabe gilt nur für den Helden selbst
- **Ort:** `keepTick` 8818: Nur `S.keepDepot?.[p.id]` wird beim Fall zurückgegeben. `S.keepStash` wird in `capitalFall` und `keepTick` nicht angefasst. Abholen geht nur `inKeep` bei einem Diener (8801).
- **Was passiert:**
  - 300 Gold bezahlt, am nächsten Tag fällt die Stadt: Die Waffe ist weg.
  - Depot-Einträge von Gefährten (Schlüssel `c.id`, `keepSearch`) bleiben liegen.
- **Was passieren sollte:** „Hagen rettet die Waffenkammer ins Exil“ sollte für alles gelten.
- **Schwere:** 3.
- **Sicherheit:** mittel-hoch. Ob nach der Rückeroberung wieder Diener erscheinen, ist nicht geprüft.

### IH-15 — Diener-Schmuggel hält eine veraltete Depot-Referenz `D` (UA Wirtschaft)
- **Ort:** `servantSmuggle` 8810: `D.items.splice(D.items.indexOf(it), 1)`.
- **Was passiert:** Hat `keepReturn` das Depot inzwischen geleert, liegt die Waffe doppelt vor (Inventar und Stash). Bei `indexOf === -1` entfernt `splice(-1,1)` das letzte, also ein falsches Stück.
- **Schwere:** 3.
- **Sicherheit:** niedrig-mittel (enges Zeitfenster).

### IH-16 — Ruf ohne Grenze, dazu widersprüchliche Grenzen
- **Ort (Auswahl, selbst gelesen):**
  - `bloodshed` 3694: `S.factions[fac] -= loss` und `S.factions.order -= …`
  - sim.js:325: `S.factions.merch -= 2`
  - Grenze **300** statt 100: game.js 5540, 5584, 5593, 5611 (Goblins, Kette, Festung)
- **UA Wirtschaft (C1):** weitere ungeclampte Stellen, darunter Beitritt (Orden −30, Valen −20), Quest-Lohn, `S.factions.goblin += 200` (≈10052).
- **Moral:** Gefährten-Moral fällt unter 0 (z. B. 3673 `m.morale -= 14`); der Weg zurück über die Desertionsschwelle 12 dauert entsprechend.
- **Was passieren sollte:** `facAdd` und die meisten Stellen clampen auf ±100 (Kommentar „von −100 auf +100“).
- **Schwere:** 3.
- **Sicherheit:** hoch.

### IH-17 — Rang bei der Kette und bei den Grubenstämmen gleichzeitig (UA Wirtschaft, selbst gelesen)
- **Ort:**
  - `JOIN_FOES` 12741: `chain: ['undead','goblin']`, aber kein Eintrag für `goblin`.
  - `autoRanks` 11986: `S.ranks.goblin` hängt nur an `goblinsFreed` und Ruf.
- **Was passiert:** Wer der Kette angehört und die Goblins befreit, hat beide Ränge.
- **Schwere:** 3.
- **Sicherheit:** hoch für den Code, mittel für die Absicht.

### IH-18 — Übernahme durch ein Totenheer kürzt die Stadtbesatzung dauerhaft um 70 %
- **Ort:** `schutzTake` 8478: `node.garrison -= cut; Z.gcut = cut`. `Z.gcut` wird nirgends gelesen (Suche über src). `schutzTakerDay` 8506 setzt beim zerschlagenen Heer nur Stufe 3.
- **Was passiert:** Das Heer erreicht die Stadt nie (zerschlagen), die Besatzung bleibt trotzdem bei 30 %.
- **Was passieren sollte:** `gcut` zurückgeben, wie es das gespeicherte Feld nahelegt.
- **Schwere:** 3/4.
- **Sicherheit:** hoch.

### IH-19 — Koop-Gast: Handel ohne Lagerbuchung (T09) und ohne Auftragsauslöser
- **Ort:** coop.js `guestShopDeal` 313–327 im Vergleich zu game.js `buy`/`sell`.
- **Was passiert:**
  - Nicht-Waren kaufen zieht kein Stadtlager ab (beim Host: −0,5), verkaufen füllt keins (+0,5, RB-029).
  - Waren verkaufen gibt +1 statt wie beim Host.
  - `onItemGained` (Quest-Fortschritt bei Erwerb) fehlt.
  - Die Händlerprüfung ist dagegen vorhanden.
- **Schwere:** 4.
- **Sicherheit:** hoch (gelesen).

### IH-20 — Beinschaden bremst das Pferd (UA Körper)
- **Ort:** `speedOf` ≈132/142: `mountSpeed` und danach trotzdem `B.speedFactor(c) * limpMul(c)`. `limbLost` setzt nicht ab.
- **Was passiert:** Ohne Beine reitet man mit 20 % Tempo; Prothesenbein-Boni beschleunigen das Pferd.
- **Schwere:** 4.
- **Sicherheit:** mittel (vielleicht gewollt). Nicht selbst geöffnet.

---

## Feature-Karte

Erstellt vom UA per Grep auf `S.<key>` plus Funktionszuordnung; Kernstellen selbst geprüft (raidDay, riskOf, autoRanks, adoptSuccessor, passTime, keep*). „liest von“ heißt: Zustand, den ein anderes Feature schreibt.

| Feature | Kernfunktionen | liest von (fremd) | wirkt auf |
|---|---|---|---|
| Krieg/Heere | sim.js warTick, resolveNode, capture, warDay | Wirtschaft (Korn Valens), Blutkult (`cultDrain`), Stadt ohne Wachen (Garnison) | Stadtbevölkerung/Flüchtlinge, Zerstörung (`raidDamage`), Varonheim, Große Ereignisse, Preise (`riskOf`, `occupied`) |
| Varonheim-Belagerung | sim.js capThreatDay, siegeTick; game.js capitalFall/capitalFreed | `S.schutz`, `S.cult`, `S.flags.varonDead` | Preise (`capThreat`), Waffenkammer, Exilhof |
| Stadtwirtschaft | economy.js ecoDay, ecoPrice; sim.js economyDay | `S.war`, `S.razed`, `S.schutz`, `S.after.pmul/tmul/quar`, `S.halt`, Zoll, Jahreszeit | Heeresversorgung, Seuche, Prothesen-Wartung (`mechRate`), Gold |
| Karawanen (3 Modelle) | sim.js spawnCaravan/arrive; economy.js caravanDay, myCaravanDay | `S.towns`, `S.war` | Lager, `S.factions.merch` |
| Luftschiffe | economy.js airDay/airSupply; game.js airVoyage | Lager Kupferhafen, Wetter | Nahrung Aurelions, Großereignis Luftschiff |
| Fraktionsruf | addRel/facAdd, über 70 Schreibstellen | fast alle | Preise, Ränge, Wachen-Feindschaft |
| Ränge | autoRanks, checkRankUp, joinFaction | Ruf, Flags | Chirurgie (Bürgerrang), Schmuggelchance, Preise |
| Ruhm / Ruf der Klinge | addFame, styleAct | Bosse, Turnier, Banden, Gnade/Hinrichtung | Preise, Dialog, Kopfgeldjäger, Kapitulation, Bandenverhalten |
| Blutkult | cultHour, cultTake, cultCrown, cultEnd, cultDrain | `S.war` (capitalDay) | Krieg (Valen-Nachschub, capThreat), Waffenkammer, Bewohner (Entführung), `S.after.cult` |
| Stadt ohne Wachen | schutzDay, schutzTake, lawlessHour | `S.war`, `S.bands`, `S.after` | Garnison, capThreat, Preise, Verhaftung, Läden |
| Banden | bandFound, bandDay, bandKill | `S.war`, Ruf der Klinge | Stadt ohne Wachen, Ruhm, Ruf (**nicht** Karawanenrisiko) |
| Große Ereignisse | bigDay, BIG_START, bigTick | `S.war`, `S.razed`, `S.after`, `S.air` | Lager, `S.halt`, Aufträge, Folgen |
| Folgen (§5c) | afterDay/afterHour/afterLoad | `S.big`, `S.razed`, Karawanen | Preisfaktoren, Kopfgeld, Rachetrupps |
| Seuche | BIG plague, plagueDay/plagueHour | `S.big`, Karawanen | Bevölkerung, Läden, Status |
| Zerstörung/Ruinen | raze, rebuildRazed, ruinDay | Überfallschäden | Wirtschaft, Ereignisse, Tribut, Bewohner |
| Untoten-Überfälle | raidDay/raidTick | `S.razed`, `heldBy` (**nicht** `S.war`) | raze |
| Aufträge | townContracts, conTick, claimContract | über 40 Schreiber | Gold, Ruf, Statistik |
| Gefangennahme (T08) | captiveMenu/Tick/Ask | Ahnenfeind, Ruf der Klinge | Informanten, Ruhm |
| Ahnenfeind (T10) | nemesisFrom/Day/Heir | `S.legacy` | Aufträge |
| Heldentod/Erbe | playerDeath, chooseSuccessor, adoptSuccessor | `S.legacy`, Kult | Ruf ×0,5, Klinge ×0,5, Haft/Jagd/Ketten zurück (Ränge, Ruhm, Kopfgeld **voll**) |
| Siedlung | foundCamp, settlersDay, raidSettlement | `S.res` | Gruppengröße, Nahrung (**kein** Bezug zu sim/economy) |
| Kerker/Kopfgeld | addBounty, bountyDay, arrestCheck, goToJail | Ruhm, `S.schutz`, `S.bond` | Kopfgeld, Jäger |
| Schuldknechtschaft | enslave, bondTick | Kopfgeld | löscht Kopfgeld |
| Waffenkammer | keepSearch, keepHalt, servantSmuggle, keepTick | Ränge, capitalFallen | Valen-Ruf, Verdacht |
| Prothesen/Bionik | body.js attachProsthesis/wear; mechSwapOptions | Aurelion-Rang, Marktpreis Magitech, `S.halt` | **nur** Werte der Figur |
| Verletzungen | limbLost, woundDay, damagePart | — | Tempo/Kampf der Figur, Prothesenbedarf |
| Gruppennahrung/Moral | dayTick-Teil, partyInteraction, loyDay | Wetter, Jahreszeit | Moral, Desertion, Rumpf-HP |
| Wetter/Jahreszeit | weatherPool, wxHour, seasonDay | Region des **Spielers** | Spieler, Ernte, Herden, Reisen (sim/economy lesen `S.weather` nicht) |
| Tribut der Kette | tributeDay | chainsBroken | eigener Vorrat/Hunger der Dörfer |
| Fraktionsagenda | factionAgenda | `S.war` | Heere (+12), Lager-Schock, Zoll, Aufträge |
| Zeitsprung 20 Jahre | timeSkip | — | Alter, Brüche, Banden, Aufträge (Welt sonst ein `dayTick`) |

---

## Fit-Befunde

### IHF-01 — Gerissene Kette in der Weltregel, Glied für Glied verfolgt
- **Typ:** gerissene Kette.
- **Was der Code heute tut:**

| Glied | Zustand | Beleg |
|---|---|---|
| NPC-Entscheidung → Fraktionsfolge | vorhanden | `factionAgenda` schreibt Heere, Lager, Zoll |
| Fraktionsfolge → Wirtschaft | vorhanden | `stockShock`, `tollMul`; `capture` senkt die Bevölkerung |
| **Wirtschaft → Weltereignis** | **nur teilweise** | Hunger löst Abwanderung aus (`migrationDay`); keine `BIG_START.ok()`-Bedingung prüft Lager oder Preise (UA); Seuche läuft über Karawanen |
| Weltereignis → Begegnung | vorhanden | evDeserters, evPilgrimRaid spawnen echte Gegner |
| Begegnung → Kampf/Verletzung → Prothesenentscheidung | vorhanden | `limbLost` → Vell/Chirurgie |
| **Prothesenentscheidung → Ruffolge** | **fehlt** | `.mech` wird nur in Status, Chirurgie, Wunden und Modulen gelesen (Suche game.js); kein NPC oder Fraktion reagiert |
| Ruffolge → neue Chance | vorhanden | Ränge, Preise |

- **Warum ein Problem:** Weltregel „Kybernetik ist ein Tausch … soziale Folgen“ und die Kette in FORMATS.md.
- **Optionen für den Entwickler:**
  - Reaktion des Ordens/Valens auf sichtbare Prothesen (Preis, Wachen, Dialog).
  - Großereignisse mit Bedingungen an Lager und Preise.
  - So lassen.
- **Gewicht:** hoch.

### IHF-02 — Die Siedlung ist eine Insel
- **Typ:** Insel.
- **Was der Code heute tut:**
  - `S.settlement` kommt in sim.js und economy.js nicht vor: kein Markt, keine Karawane, kein Kriegsziel.
  - Angriffe sind reiner Zufall (40 % um 2 Uhr, `hourTick` 10369, Gegner per Zufall); Banden und Krieg werden nicht gelesen.
  - Wegen IH-03 kommen die Angriffe außerdem nie, wenn man nachts schläft.
- **Warum ein Problem:** „Systeme füttern sich“; die Siedlung reagiert nicht auf die Front oder die Banden nebenan.
- **Optionen für den Entwickler:**
  - Siedlung als Marktknoten (Scout-Idee war abgelehnt, also nur Bedrohung koppeln).
  - Angriffe aus `S.bands` und Untoten-Nähe ableiten.
  - So lassen.
- **Gewicht:** mittel.

### IHF-03 — Drei Untoten-Offensiven ohne Abgleich
- **Typ:** Überschneidung/Widerspruch.
- **Was der Code heute tut:**
  - `S.war`-Heere ziehen über den Graphen.
  - `raidDay` (6117) wählt das Dorf nur nach x-Koordinate, ohne `S.war`.
  - `S.campaign` ist ein drittes Modell.
- **Warum ein Problem:** Ein Dorf weit hinter einer stabilen Front wird überfallen, während das Heer davor steht. Der Spieler kann die Bedrohung nicht lesen.
- **Optionen für den Entwickler:**
  - `raidDay` gewichtet nach Nähe zu Untotenknoten.
  - Überfälle als Ausläufer der Heere.
  - So lassen.
- **Gewicht:** mittel.

### IHF-04 — Banden wirken nicht auf Handelswege
- **Typ:** Einbahn-Verbindung.
- **Was der Code heute tut:** `riskOf` (economy.js:285–291) kennt nur Untotenheere, Karak-Atar und Zoll. `bandDay` meldet „Reisende ausgeraubt“, ohne dass sich das Karawanenrisiko oder die Lager ändern.
- **Warum ein Problem:** Entscheidung V4 „Banden auf Straßen“ und T12 („eine Straße melken“) legen Straßenwirkung nahe.
- **Optionen für den Entwickler:**
  - Bandennähe in `riskOf`.
  - So lassen.
- **Gewicht:** mittel.

### IHF-05 — Erbe übernimmt uneinheitlich
- **Typ:** Widerspruch.
- **Was der Code heute tut:** `adoptSuccessor` halbiert Ruf und Ruf der Klinge, lässt aber Ränge, Ruhm und **Kopfgeld** voll stehen, ebenso Ehepartner und Schmuggelware (IH-06). Persönliche Waffen bleiben dagegen am Grab.
- **Warum ein Problem:** Der Erbe eines Mörders zahlt dessen volles Kopfgeld, verliert aber das halbe Ansehen. Die Regel ist für den Spieler nicht vorhersagbar.
- **Optionen für den Entwickler:**
  - Eine Regel je Kategorie (persönlich, Haus, Welt) und im Erbe-Dialog sichtbar machen.
  - So lassen.
- **Gewicht:** mittel.

### IHF-06 — „Zwanzig Jahre später“ lässt die Welt stehen
- **Typ:** passt nicht zur Welt.
- **Was der Code heute tut:** `timeSkip` setzt `S.day += 1200`; `dayTick` läuft danach einmal. Krieg, Markt, Kult und Wachstum rücken nicht vor. Die alte Kult-Krönungsfrist ist dann längst überschritten und feuert um 3 Uhr, sofern man wach ist (IH-03).
- **Warum ein Problem:** „Die Welt entwickelt sich weiter, wenn der Spieler woanders ist.“
- **Optionen für den Entwickler:**
  - Gestaffelte Simulation (z. B. 60 warDay/ecoDay).
  - Ein Epilog-Ereignispaket.
  - So lassen.
- **Gewicht:** mittel.

### IHF-07 — Zwei Vorratssysteme und drei Karawanenmodelle (UA)
- **Typ:** Überschneidung.
- **Was der Code heute tut:**
  - Tribut-Dörfer nutzen `T.vorrat`/`T.hunger` neben `S.towns[k].stock`/`t.hunger`.
  - Karawanen gibt es dreifach: sichtbare Karawane (sim.js), abstrakte Züge (`S.eco.caravans`) und eigener Wagen. Der Raub wird zweimal getrennt berechnet.
- **Warum ein Problem:** Hunger im Tributdorf und Hunger am Markt widersprechen sich unter Umständen.
- **Optionen für den Entwickler:** Zusammenführen (Audit nennt „MERGE T23“) oder so lassen.
- **Gewicht:** niedrig-mittel.

### IHF-08 — Wetter gilt global, gewählt nach der Region des Spielers
- **Typ:** Einbahn / für die Welt unsichtbar.
- **Was der Code heute tut:** `S.weather` kommt aus `weatherPool(p)`; sim.js und economy.js lesen es nicht.
- **Warum ein Problem:** Klein, aber ein Blutregen im Osten ist „überall“, und Wetter wirkt nie auf ferne Schlachten oder Wege.
- **Optionen für den Entwickler:** So lassen oder Wetter je Region.
- **Gewicht:** niedrig.

### IHF-09 — Bionik ist im Weltgeschehen unsichtbar
- **Typ:** Insel.
- **Was der Code heute tut:** Prothesen lesen Rang und Magitech-Preis, schreiben aber keinen Weltzustand. T23 (Aurelion-Ressource) und „Aurelion-Bionik wirkt im Kriegsgraphen“ (DECISIONS 02.10.) sind im Code nicht vorhanden (`S.facRes` und bionik-Begriffe in sim.js: 0 Treffer).
- **Warum ein Problem:** Weltregel „Aurelion ist die Quelle von Prothesen“. Fällt oder blüht Aurelion, merkt der Prothesenmarkt das nur über den Magitech-Preis und Streiks.
- **Optionen für den Entwickler:** Mit T23 umsetzen (entschieden) oder so lassen.
- **Gewicht:** mittel. Ist schon geplant, darum nur Hinweis.

---

## Quest-Hinweise (für den Quest-Agenten)

- **Blutkult:**
  - Die Rote Krönung (3 Uhr), Entführungen (23 Uhr) und Albins Tod (6 Uhr, Zweig „falscher Verdächtiger“) fallen weg, wenn der Spieler nachts schläft oder reist (IH-03). Der Albin-Zweig ist für Schläfer praktisch unerreichbar.
  - Vermisste stehen nach dem Laden als Doppelgänger zu Hause (IH-05); die Tafel „cultlist“ widerspricht dem Sichtbaren.
- **Varonheim-Belagerung / Waffenkammer:** Beim Fall der Hauptstadt geht die geschmuggelte Ware verloren (IH-14).
- **Heldentod/Erbe:** RB-011 ist durch IH-01 bestätigt. Erbe mit dem Ehepartner des Vaters (IH-06).
- **Stadt ohne Wachen:** Wird ein Totenheer, das eine Stadt übernehmen soll, unterwegs zerschlagen, bleibt die Besatzung bei 30 % (IH-18).

---

## Nicht geprüft

- **Live im Browser:** nichts (Tab-Grenze erreicht, kein eigener Tab möglich). Alle Repros sind ungetestet.
- **`ensure*()`-Funktionen:** Auf doppeltes Entstehen nur Stichproben geprüft: ensurePaddock, ensureJail, ensureRegionBosses, ensurePaladins, ensureFaithFigures, ensureOmegaShrine, ensureBoards, spawnResidents. Nicht geprüft: ensureVaronCourt, ensureVaronExile, ensureSchutz, ensureAurelion, ensureKarak, ensureBlackKeep, ensureBloodCult und die übrigen.
- **Bildraten-Abhängigkeit (dt):** nur Stichproben (Status-Schleife, vampTick, Raserei), keine systematische Suche.
- **Zwischenszenen:** Gelesen sind nur die Tastatursperre und `cineGhost`-Schutz. Darsteller, die während einer Szene sterben, und Projektile oder Flächen gegen den „Geist“ sind nicht geprüft.
- **Koop:** Nur Gast-Befehle (`guestCommand`, `guestShopDeal`, `runAs`) gelesen. Nicht geprüft: `g.dlg`-Antworten lange nach dem Dialog und Gast-Verbrauchsgüter am Boden.
- **Ausgelöschte Fraktionen:** ob eine Fraktion ohne Mitglieder weiter Aufträge oder Ränge vergibt.
- **Diebstahl/Rückstehlen:** nicht geprüft; ebenso Stapel-Teilung im Inventar.
- **sim.js im Detail:** Karawanen-Zustandsautomat, `battleCheck` und verwaiste Armee-IDs (UA: Schlacht verpufft ohne `afterBattle`, sim.js ≈567) nur übernommen, nicht selbst geprüft.
- **Abhängigkeit vom Zeitpunkt:** ob Stunde 0 (`hourTick` mit neuem `S.day` vor `dayTick`) irgendwo stört.

---

## Beobachtungen

- game.js wurde während des Laufs geändert (siehe oben). Der Code ist also nicht eingefroren.
- Entschiedene, aber im Code nicht gefundene Systeme:
  - A14 Hunger und Müdigkeit: `p.hunger` und `p.fatigue` gibt es nicht, nur Gruppennahrung.
  - T15 Energiezelle für Stufe-4-Prothesen alle 3 Tage: Zellen gibt es nur für Magitech-Waffen (UA).
  - T23 `S.facRes`.
- Tote Schlüssel:
  - `S.season`: angelegt, nie gelesen.
  - `S.prices`: beim Laden gelöscht.
  - `S.after.infamy`: nur geschrieben (UA).
  - `Z.gcut`: siehe IH-18.
- `adoptSuccessor` und `playerDeath` speichern den toten Helden nicht in `S.ents`. Darum fehlt „gefallen“ auf der Spielstandkarte (IH-01).
- Ein Ruf über 100 (Grenze 300) wird in `repTier` und Preisen vermutlich als „über Maximum“ gelesen. Die Wirkung habe ich nicht nachgerechnet.
- Der Verband wird auch auf ein unverletztes Teil verbraucht (UA, ui.js:807); niedrig.
