# Reproduktions-Liste 2 (neutral, ohne Begründung der Finder)
Je Eintrag: Behauptung (Titel), Ort, Auslöser, Repro-Vorschlag. Urteil: CONFIRMED / NOT REPRODUCED / CANNOT TEST. Tests mit echtem Speichern/Tod NUR in Wegwerf-Slots.

### R-IH-01 Gespeicherter toter Held: nach dem Laden gibt es keine Erbenwahl, der Stand hängt (neue Information zu RB-011)
- **Ort:**
  - game.js `die` 3672–3676: Der Held wird aus `S.ents` entfernt, danach wird `playerDeath` aufgerufen.
  - `playerDeath` 14239: `save()`.
  - state.js:145: `SKIP` enthält `dying`.
  - `continueGame` 2052–2053: Der tote Held wird wieder in die Karte eingesetzt.
  - `dyingEnd` 13655: einziger Aufrufer von `UI.showDeath` und darüber von `chooseSuccessor`.
  - `bindInput` 14645: `beforeunload` ruft `saveSync()`.
- **Auslöser:** Held stirbt, danach wird der Browser geschlossen oder neu geladen, bevor ein Erbe gewählt ist. Das ist naheliegend: Auf dem Todesbildschirm wird oft geschlossen.
- **Repro (nur Wegwerf-Platz):**
  1. Laden mit `?dev` wie in HUNT.md beschrieben.
  2. Ausführen: `const A=RF.coopAPI(); A.setSlot(A.newSlot('single')); RF.S._quiet=false; RF.die(RF.S.player,'Probe');`
  3. Nach etwa 1 s neu laden und diesen Platz fortsetzen.
  4. Erwartet laut Bug: `RF.S.player.alive===false`, `RF.S.paused===false`, kein Todesbildschirm.
  5. Danach Platz löschen, `rotfall.slot.active` und `rotfall.slot.lastSingle` auf `legacy` zurücksetzen.

### R-IH-02 `performance.now()`-Zeitstempel überleben das Laden: Raserei friert ein, Armbrust bleibt gespannt, Nebel macht unverwundbar
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

- **Auslöser:** Speichern innerhalb des Wirkfensters. Das passiert über das tägliche `save()`, über `beforeunload` (jederzeit) oder über den Knopf „Speichern“.
  - Fenster: Raserei 2–4 s, Pfeife 30 s, Armbrust ≈ Ladezeit, Nebel 0,5 s.
- **Repro:**
  1. `RF.S._quiet=true; const p=RF.S.player; p.reloadUntil=performance.now()+3.6e6; RF.coopAPI().continueGame(JSON.parse(RF.saveData()));`
  2. Prüfen: `RF.S.player.reloadUntil>performance.now()` ist immer noch `true`.
  3. Der echte Fall braucht ein Neuladen im Wegwerf-Platz.

### R-IH-03 Zeitsprünge (Schlaf, Schnellreise, See- und Luftfahrt, Handwerk) überspringen alle Stundenhaken außer dem Krieg
- **Ort:**
  - `passTime` 4811–4815 holt nur `SIM.warTick` für übersprungene Stunden nach.
  - `update` 2404–2405 ruft `hourTick` nur für die aktuelle Stunde auf.
  - Aufrufer: Schlafen 4827 (nachts bis 7 Uhr), Reise 7976, Schiff und Luftschiff 7428 und 7433, Studium 12673, Nachtwache 13326 und weitere.
- **Auslöser:** Jede Nacht im Bett, jede Fahrt mit Kutsche, Schiff oder Luftschiff.
- **Repro:** `RF.S.cult.crown=RF.S.day|0; RF.S.cult.stage=1; RF.S.minute=22*60;` dann im Debug-Menü „Zeit +6 Stunden“ wählen. Ergebnis: `RF.S.cult.crowned` bleibt leer.

### R-IH-04 Laden aus dem laufenden Spiel (Koop „Hosten“) übernimmt Zustand des vorigen Stands und schreibt ihn in den Koop-Platz
- **Ort:**
  - state.js `applySave` 268–271 überschreibt nur Schlüssel, die im Stand stehen.
  - `continueGame` 1994 ff. leert `S` vorher nicht, anders als `newGame` 1846 (RB-055).
  - coop.js:75: `hostSlot` → `if (A.isRunning()) A.continueGame()`, aufrufbar aus dem laufenden Einzelspiel (Einstellungen → Koop).
- **Repro:** `RF.S._quiet=true; RF.S.zzTest=1; const d=JSON.parse(RF.saveData()); delete d.zzTest; RF.coopAPI().continueGame(d); RF.S.zzTest` ergibt `1`.

### R-IH-05 Vom Blutkult Entführte (und Hunger-Abwanderer der Kette) werden beim Laden durch Doppelgänger ersetzt
- **Ort:**
  - `cultTake` 13370 ff.: Der Bewohner wird aus `S.ents.world` entfernt und als ganzes Objekt in `S.cult.missing` abgelegt.
  - `spawnResidents` 854–877: Ein Haus gilt als bewohnt nur, wenn `S.ents.world.some(c => c.homeId === b.id)`.
  - Der Name ist fest aus Hauslage und Index abgeleitet (864).
  - Aufrufe beim Laden: 2106 und 2108, dazu `growTown`.
  - `cultFree` 13494–13498 setzt das Original zurück in die Welt.
  - Ebenso `tributeDay` 5735: `v.alive=false; splice`, ohne `die`.
- **Repro:** `cultTake()` erzwingen (Debug), Hausbewohner per `homeId` merken, Laden im Wegwerf-Platz, `S.ents.world.filter(c=>c.homeId===id)` zählen.

### R-IH-06 Erbfolge lässt Bindungen am alten Helden hängen
- **Ort:**
  - `adoptSuccessor` 14389–14422.
  - `familyDay` 14268–14272.
  - `dynastyChoices` 14273 ff.
  - `captiveTick` 13835.
  - `servantSmuggle` 8799–8812.
- **Repro:** `RF.S.legacy.spouse = <npc.id>`, Tod, Erben wählen, der kein Ehepartner ist; dann `RF.S.legacy.spouse` prüfen.

### R-IH-07 Zweiwaffen-Ausrüsten prüft den ausgefallenen linken Arm nicht (UA Körper, selbst gelesen)
- **Ort:** game.js `equip` 219–222.
- **Repro:**
  1. `p=RF.S.player; p.currentClass='rogue'; p.body.larm.hp=0;`
  2. Eine Einhandwaffe angelegt, eine zweite im Inventar, dann `RF.equip(p,i)`.
  3. Ergebnis: `p.equip.offhand` ist gesetzt.

### R-IH-08 Am Boden heilt sich der Held selbst: Hotbar, Erneuerungstrank, Seelenphiole (UA Körper, selbst gelesen)
- **Ort:**
  - Statusschleife 2786: `if (s.key === 'regrowth' && !(c.downed && c !== S.player)) B.heal(…)`. Der Held ist ausdrücklich ausgenommen.
  - `useSlot` 14213 ohne Boden-Prüfung; Taste 1–0 in 14616 auch am Boden.
  - Seelenphiole `B.heal(c, 8)` (487).
  - Aufstehen bei 25 % Rumpf (2791).
- **Repro:** `p=RF.S.player; RF.B.damagePart(p,'torso',999); p.downed=true; p.status=[{key:'regrowth',left:60000,heal:5}]; RF.tick(10000); p.downed`

### R-IH-09 Lebensraub fliegender Geschosse heilt einen inzwischen gefallenen Schützen (UA Körper)
- **Ort:** game.js 3885 (Seelenzug `own.alive`) und 3901 (Blutpeitsche `attacker?.alive`). 3901 heilt sogar vor `hurt`, also auch dann, wenn `hurt` wegen `invuln` oder Nebel abbricht.

### R-IH-10 Gruppenheilzauber und Kettengebet richten Gefallene sofort auf (UA Körper)
- **Ort:** game.js 3199–3204 (Form `group`) und `chain_prayer` (≈14818). Die Filter prüfen nur `alive`, nicht `!downed`; `B.heal` heilt den Rumpf zuerst.

### R-IH-12 „Handeln“ im Kontextmenü umgeht alle Ladensperren
- **Ort:** ui.js:429: `$('ctx-trade').onclick = () => near ? openModal('trade', target) : …`. Geprüft wird nur der Abstand.

### R-IH-13 Kauf und Verkauf prüfen den Händler nicht; das Handelsfenster pausiert die Welt nicht
- **Ort:** game.js `buy` 12982, `sell` 13001. Weder Lebend- noch Abstands-, Karten- oder `shopRefusal`-Prüfung. Der Koop-Gast hat sie (coop.js:314).

### R-IH-14 Waffenkammer: geschmuggelte Ware verfällt beim Fall der Hauptstadt; die Rückgabe gilt nur für den Helden selbst
- **Ort:** `keepTick` 8818: Nur `S.keepDepot?.[p.id]` wird beim Fall zurückgegeben. `S.keepStash` wird in `capitalFall` und `keepTick` nicht angefasst. Abholen geht nur `inKeep` bei einem Diener (8801).

### R-IH-15 Diener-Schmuggel hält eine veraltete Depot-Referenz `D` (UA Wirtschaft)
- **Ort:** `servantSmuggle` 8810: `D.items.splice(D.items.indexOf(it), 1)`.

### R-IH-16 Ruf ohne Grenze, dazu widersprüchliche Grenzen


### R-IH-17 Rang bei der Kette und bei den Grubenstämmen gleichzeitig (UA Wirtschaft, selbst gelesen)
- **Ort:**
  - `JOIN_FOES` 12741: `chain: ['undead','goblin']`, aber kein Eintrag für `goblin`.
  - `autoRanks` 11986: `S.ranks.goblin` hängt nur an `goblinsFreed` und Ruf.

### R-IH-18 Übernahme durch ein Totenheer kürzt die Stadtbesatzung dauerhaft um 70 %
- **Ort:** `schutzTake` 8478: `node.garrison -= cut; Z.gcut = cut`. `Z.gcut` wird nirgends gelesen (Suche über src). `schutzTakerDay` 8506 setzt beim zerschlagenen Heer nur Stufe 3.

### R-IH-19 Koop-Gast: Handel ohne Lagerbuchung (T09) und ohne Auftragsauslöser
- **Ort:** coop.js `guestShopDeal` 313–327 im Vergleich zu game.js `buy`/`sell`.

### R-IH-20 Beinschaden bremst das Pferd (UA Körper)
- **Ort:** `speedOf` ≈132/142: `mountSpeed` und danach trotzdem `B.speedFactor(c) * limpMul(c)`. `limbLost` setzt nicht ab.
