# PLAN_ROADMAP — Befund und Paketplan für P0 (Bionik, Aurelion, Luftschiffe) und das Animations-Fundament

Stand: 2026-09-30. Grundlage ist der Code in `src/`, nicht die Doku. Verbindlich bleibt `MASTER_ROADMAP.md`; diese Datei sagt, **wo** die Roadmap im bestehenden Code andockt und in welcher Reihenfolge. Zeilenangaben sind Stand heute und wandern mit jeder Änderung.

---

## 1. Befund je Bereich

### A) Bionik und Prothesen

**Existiert (funktioniert):**
- `body.js`: `attachProsthesis(c, part, tier)` setzt `lost=false`, `mech=tier`, `hp=max`. `mechBonus(c, kind)` gibt je Seite den besten Bonus zurück: Meisterglied (Stufe 3) +10 % Arm bzw. +6 % Bein, dazu +5 % je `mechUp`. Unter 30 % `mechCond` wirkt die Prothese nicht. `speedFactor` multipliziert mit `1 + mechBonus(c,'leg')`.
- `game.js`:
  - `useConsumable` hat den Zweig `it.use === 'prosthesis'`. Er passt nur an ein verlorenes Glied (`part: 'arm' | 'leg'`).
  - `damageOf`/Treffer (Z. ~3074) multipliziert mit `1 + B.mechBonus(attacker,'arm')`.
  - `hurt()` (Z. 3137) zieht bei **jedem** Aufruf je Prothese 1,2 `mechCond` ab, nur beim Spieler. Beim Unterschreiten von 30 % kommen Toast und Log.
  - `mechMenu()` (Z. 6999) bietet: alles instand setzen (2 Gold je fehlendem Prozent), `mechUp` bis 2 (Kraftfeder oder Laufwerk, 250/500 Gold), `mechSwapOptions`, Linse (300 Gold, setzt `p.lens = true`).
  - `mechSwapOptions()` (Z. 7817) ersetzt ein gesundes Glied gegen Gold (Stufe 2 für 700, Stufe 3 für 1400).
  - Meisterin Vell (`ensureAurelion`, Z. 4826) steht in Gelenkhall mit Shop-Pool Schrott-, Aurel- und Meisterglieder und trägt selbst `rarm.mech = 3`.
  - Werkbank-Prop `mechBench` (`world.js` Z. 1403) → `doInteract` → `mechMenu`.
  - X-Fenster `activeEffects()` (Z. 8686) zeigt je Prothesen-Glied Stufe und Zustand.
  - Debug „Kampf & Körper“ bietet „Glied abtrennen“ und „Alle Glieder zurück“.
  - Selbsttests Z. 11448, 11990 und 12037 prüfen Bonus, Swap und Anlegen.
- `data.js`: `schrottarm`/`schrottbein` (Stufe 1), `aurelarm`/`aurelbein` (2) und `meisterarm`/`meisterbein` (3). Dazu Beute `automat` mit 6 % Schrottglied.
- Der Linseneffekt ist **nur** der Kartennebel: `revealAround(..., p.lens ? 28 : 18)` (Z. 2274).
- Figuren ohne Funktion, aber mit Beruf und Aussehen: In Aurelion-Städten stehen die Villager-Berufe `Prothesenhändlerin`, `Kybernetiker` und `Medica` (`AUREL_TRADES` Z. 698, Aussehen in `sprites.js` Z. 231). Die Themenzeile in `data.js` Z. 1095 verweist schon auf Gelenkhall.

**Teilweise oder fehlerhaft (erst reparieren, dann aufbauen):**
1. **Vererbte Abnutzung und Aufrüstung.** `damagePart` setzt beim Abtrennen nur `P.mech = 0`. `attachProsthesis` setzt `mechCond` und `mechUp` nicht zurück. Eine neue Prothese an einem Glied, das schon einmal eine trug, erbt deshalb den alten Zustand. Liegt der unter 30 %, ist sie sofort wirkungslos. Sie erbt auch die alte Kraftfeder. Der Debug-Knopf „Glied abtrennen“ hat denselben Fehler.
2. **Verschleiß an der falschen Stelle.** Der Abzug steht in `hurt()` **vor** der Prüfung `!alive || invuln || god`. Er trifft außerdem **jede** Prothese, egal welches Teil getroffen wurde. Blutung, Gift und Brand rufen `hurt()` mehrmals pro Sekunde auf; Gift allein bis zu 4× je Sekunde, also etwa 5 % Zustand pro Sekunde. Auch Ausweich-I-Frames, Gottmodus und Turnieraufgabe nutzen die Prothese ab.
3. Die Stufen unterscheiden sich kaum: Stufe 1 und 2 geben beide 0 % Bonus und haben keinen Nachteil. „Schlecht“ gibt es praktisch nicht.
4. Zwei Meisterarme addieren sich nicht, weil `mechBonus` das Maximum je Seite nimmt. Das ist gewollt, aber nicht dokumentiert.
5. Die Linse ist nur ein Boolean und erscheint weder im X-Fenster noch im Charakterbogen.
6. Im Stil R sieht man Prothesen nicht: `sprites.js msOf` codiert `mech` als 0 („heil“). Nur Stil D (`render.js drawArm`) färbt den Arm messingfarben.
7. Gefährten nutzen ihre Prothesen nie ab (nur `target === S.player`) und können sie nicht warten lassen (`mechMenu` kennt nur den Spieler).
8. Reparatur gibt es nur an **einer** Stelle, der Werkbank in Gelenkhall, und nur gegen Gold. Werkzeug und Material spielen keine Rolle.

**Fehlt:**
- Roboterauge als echtes Teil mit Qualität und Zustand: Nachtsicht, Zielgenauigkeit, Gegnererkennung.
- Hand und Fuß als eigene Module.
- Prototyp-Stufe.
- Wartungswerkzeuge und Ersatzteile.
- Selbstreparatur.
- Bionik-Händler außerhalb Gelenkhalls, Chirurg und Schwarzmarkt.
- Rang-Gating über Aurelion.
- Bionik-Anzeige im Charakterbogen.

**Erweitern statt duplizieren:**

| Bestehend | Wird zu |
|---|---|
| `attachProsthesis` | einziger Weg, eine Prothese anzulegen |
| `mechBonus` | einzige Stelle für Boni und Mali |
| `mechMenu(npc?)` | einziges Service-Fenster, mit Leistungsumfang je NPC |
| `mechSwapOptions` | Chirurgie |
| Zweig `prosthesis` in `useConsumable` | auch Module und Reparatursets |
| `activeEffects` | X-Anzeige |
| `ui.js` `woundNotes`/`charUI` | Bionik-Zeilen |

Kein neues `bionics.js` mit einer zweiten Körperlogik. Allenfalls eine Datentabelle `MECH_Q` in `body.js`.

**Save-Felder:**
- `c.body[part].mech`: 0 oder 1–3, künftig bis 4.
- `c.body[part].mechCond`: fehlt bedeutet 100. Die Semantik `?? 100` überall beibehalten.
- `c.body[part].mechUp`: 0–2.
- `p.lens`: Boolean.

Alle Felder hängen am Entity und werden mit ihm gespeichert. Transiente NPCs gehen verloren; das ist in Ordnung.

**Migrationsrisiken:**
- Keine neuen Körperteile in `PARTS` einführen, also kein `eye`. `PARTS` läuft durch `initBody`, `syncHp`, `pickPart` (Trefferverteilung `HIT_W`), `bodyChart`, `woundNotes`, die Ladeschleife in `continueGame` und Selbsttests. Ein siebtes Teil verschiebt die Trefferverteilung und bricht alte Körper.
- Das Auge gehört deshalb als eigenes Feld an die Figur (`c.eye`), nicht in `c.body`.

### B) Luftschiffe

**Existiert:**
- `render.js drawSkyLife` (Z. 2359): zwei vektorgezeichnete Schiffe mit Schatten, nur bei `curRegion === 'aurel'`. Die Position hängt **relativ zum Spieler** (`P.x + …`), die Schiffe ziehen also mit. Reine Deko, kein Zustand.
- Ereignis `BIG_START.airship` (Z. 8293) in `bigDay`, alle 3–5 Tage eines von acht Ereignissen: zufälliger Wildnisort, 6 Trümmer-Props (`rubble`/`crate`/`broken_pillar`, transient, `bigEv`), 2× `magitech` am Boden, 2 bewusstlose `Luftschiffer` (`crashSurvivor`), 3 Banditen. Gerücht und Chronik über `bigAnnounce`, Ende über `bigEnd` nach 4 Tagen. Der Debug-Knopf „Großes Ereignis: Luftschiffabsturz“ existiert (Z. 10844).
- `economy.js ecoDay` Z. 171: Aurelion bekommt 90 % seines Nahrungsbedarfs „per Luftschiff aus dem Süden“. Das ist abstrakt und fest verdrahtet.
- Vorlage für eine Reise: `seaVoyage(to, from)` und `seaTick` mit der Karte `deck`, `S.voyage` (Ereignisse Piraten, Sturm, ruhig) und `SEA_FARE`. Das ist genau das Muster für eine Luftschiff-Passage.
- Vorlage für ein eigenes Fahrzeug: `S.eco.my` (Handelswagen: `at`, `to`, `eta`, `cargo`, `guards`, `trips`), bewegt über `myCaravanDay` und `riskOf`.

**Fehlt vollständig:**
- Ein Luftschiff als Zustand: Typ, Komponenten, Schaden, Reparatur, Upgrades, Besitzer.
- Hafen, Hangar, Hafenmeister, Pilot und Ingenieur.
- Handel per Luftschiff und luftschiffeigene Ereignisse (Sturm, Piraten, Motorschaden).
- Die Kopplung ans Wetter.
- Ein Hafen-Prop in Kupferhafen. Die Stadt hat nur `store`, `house`, `tavern`, `smithy` und `fisher`.

**Minimales Datenmodell (Vorschlag):**
```
S.air = { v: 1, next: 0, fleet: [ { id, name, type: 'handel'|'patrouille'|'passage'|'militaer', owner: 'aurel'|'player',
          at: 'kupferhafen', to: null, dep: 0, eta: 0, cargo: {}, state: 'dock'|'flug'|'wrack'|'werft',
          c: { huelle: 100, motor: 100, kern: 100, steuer: 100 }, up: { huelle: 0, motor: 0, laderaum: 0 } } ],
          my: null /* id eines Spielerschiffs */ }
```
- Höchstens etwa 6 Schiffe. Keine Entities in `S.ents`: keine Kollision, kein Solid-Index, kein Wachstum der Speicherdatei.
- Sichtbar werden sie über `drawSkyLife`. Die Position wird aus `at`, `to`, `dep` und `eta` interpoliert und **welt-verankert**.

**Andockpunkte:**
- `economy.js`:
  - neues `airDay()`, aufgerufen in `ecoDay` neben `caravanDay()`;
  - `riskAir(a, b, ship)` nach dem Vorbild von `riskOf`, mit Wetter, Steuerung und Hülle;
  - der Aurelion-Import (Z. 172) wird mit `flotteBereit()` skaliert: Fällt die Flotte aus, bekommt Aurelion weniger Nahrung, und die Preise steigen über die bestehende Kette.
  - `Math.random` wie in `caravanDay` verwenden, damit der Welt-`rnd()`-Strom stabil bleibt.
- `sim.js`: nichts Pflicht. Es gibt keinen Kriegsgraphen-Bezug, bis P1 den „Militärtransport“ bringt.
- `world.js`: **keine** Änderung in `genWorld`. Neue Props dort verschieben `rnd()` und `PROP_BASE`/`gk`. Den Hafen stattdessen wie `ensureAurelion`/`ensureMachines` in `game.js` als `ensureAirport()` anlegen: feste Koordinaten neben `TOWN_PLAN.kupferhafen.square`, Mast-Prop transient oder mit festem `key`, Hafenmeisterin als NPC mit `key`.
- Absturz: `BIG_START.airship.go` so umbauen, dass es `go(opts = {})` mit optionalem Ort und Schiffsnamen annimmt. Ein Schiff der Flotte mit Hülle 0 löst genau diesen Ablauf aus, statt einen zweiten zu bauen.

### C) Aurelion-Integration

**Existiert:**
- `ensureMachines()`: Arbeitsautomaten (`robotWork`, transient) und Kampfautomaten (`bigRobot`); `robotWorkStep` nutzt `act(e,'work')`.
- `factoryWork(t)`: Schicht an der Maschine, Lohn nach `S.laws.slavery`, Schuldknecht-Abbau.
- `ECO.TRADES.magitech`: Eingang `ingot` und `tools`, Ausgang Gut `magitech`. `ecoDay` legt Betriebe still über `S.halt[town + ':' + trade] > S.day`. `magitechAccident` setzt genau diesen Schlüssel.
- Ränge über `autoRanks()`: 0 Fremder, 1 Besucher (Schein), 2 Bürger, 3–6 nach Ansehen 52/64/76/88, 7 Rat. Dazu `rankGuide('aurel')`.
- Akademie: `startTrial`/`endTrial`/`trialTick`, `S.acad` und `S.acadRank` (Hörer, Adept, Magister).
- Magitech-Items: `messingpistole`, `donnerbuechse`, `automatenkern`, `magitech`, `tools`, `ingot`. Das `mech_horse` wird mit `automatenkern` gewartet (`oilMount`); das ist ein gutes Vorbild für Bionik-Wartung.

**Fehler gefunden:** Der Streik (`BIG_START.strike`) setzt `S.halt.tickmar = true`. `ecoDay` prüft aber `S.halt['tickmar:magitech'] > S.day`. Der Streik legt die Produktion also **nicht** still; er wirkt nur im Text.

**Wie Bionik und Luftschiffe andocken:**
- Die Reparaturkosten in `mechMenu` richten sich nach `ECO.ecoPrice(town, 'magitech', true)`. Die Selbstreparatur verbraucht `magitech`. So wirken Streik, Unfall und Sabotage über `S.halt` direkt auf Bionik-Kosten.
- Luftschiff-Reparatur verbraucht `ingot`, `tools` und `magitech` aus `S.towns.kupferhafen.stock`, gekauft über `ecoPrice`.
- Gating über `S.ranks.aurel`:

  | Leistung | Voraussetzung |
  |---|---|
  | Stufe 1 | frei, auch Schwarzmarkt |
  | Stufe 2 | Rang ≥ 1 (Schein) |
  | Stufe 3 und Chirurgie an gesunden Gliedern | Rang ≥ 2 (Bürger) oder Akademie-Adept |
  | Prototyp | Rang ≥ 4 oder eine Rang-Prüfung (P1) |
  | Luftschiff-Passage | Rang ≥ 1 |
  | eigenes Schiff | Rang ≥ 3 |

- `rankGuide('aurel')` bekommt je Rang die Zeile „Zugang: …“, damit die Regel für den Spieler sichtbar ist.
- Die Rang-Prüfungen für die Ränge 3–6 fehlen (IST_ZUSTAND Beobachtung 23). Sie sind P1 und können `startTrial` mit neuen `kind`s wiederverwenden, statt ein zweites Prüfungssystem zu bauen.

### D) Animation und Cinematic

**So funktioniert es heute:**
- **Pose:** `sprites.js poseOf(e, now, bow)` leitet aus dem Spielzustand eine diskrete Pose ab, in dieser Reihenfolge: `dodge`→`tuck`, `landT`→`kneel`, `cover`→`guard`, `c.act` (`work`/`rise`/`strike`/`trade`/sonst `kneel`), `draw`, `telegraph`, `swing` (<0,3 `a1`, <0,72 `a2`, sonst `a3`), `cast`, `hit` (170 ms nach `lastHurt` oder `stagger`), Laufen `w0..w3` (115 ms), `sit`, `i0/i1` (650 ms).
- **Überschreibungen in Stil R:** `render.js drawHumanoidR` ersetzt `kb` bei `e.kb`, lässt bei `stagger > 300` zwischen `hit` und `kb` wechseln und hängt `+carry` sowie `~r` (Reiten) an.
- **Malen:** `fig5.js paintR(L, dir, pose, W)` nimmt Gelenk-Rigs aus `rigS`/`rigW` je Pose. Mischposen `basis+extra` geben die Arme der Zusatzpose. Die Waffe folgt `swingOf(wt, q, arc, v, j)`, `phaseOf` (Wind, Schlag, Nachschwung) neigt den Rumpf.
- **Cache:** `humanFrameR` legt jedes Bild unter `'R|' + specKey(spec) + dir + pose + '|' + wk` ab. `specKey` hängt 64 Spec-Felder aneinander. `wk` enthält Modus, Waffentyp, `q` (auf 0,1 gerundet), Variante, Oktant, `two`, `low` und `pull`. `cacheGet` leert bei **über 4000 Einträgen den ganzen Cache** (`cacheStat.clears`). Danach kostet jedes sichtbare Bild beim ersten Zeichnen etwa 10 ms. `warm()` backt nur Frames ohne Waffenzustand (`W = null`) vor; bewaffnete Figuren in R profitieren davon nicht.
- **Kampf-Timing:** `tickCombatant` zählt `c.swing += dt / swingDur`. Bei `swingHit(c)` (0,42, Bogen 0,75) folgen einmalig Ausfallschritt (`feelOf().lunge`) und `resolveSwing`. `hit()` setzt `hitStop` (Welt steht still), `camShake(fl.shake)`, `R.cam.punch` (Krit-Zoomstoß) und einen `S.fx`-Impact. Bei Wucht (`crush`) kommt `stagger` dazu, beim Treffer `target.kb`. `hurt()` ist die Schadenssenke; `target.lastKind` speichert die Schadensart. `fx(x, y, type, n)` ist das Partikel-System (`updateFx`).
- **Tod:**
  - Gegner: `die()` legt eine **transiente** Leiche an (`kind: 'corpse'`, `mtype`, `facing`, `born`). `drawCorpse` spielt eine feste Folge nach Alter: 0–120 ms `hit`, bis 300 ms `die1` (Stil R) bzw. `kneel`, bis 440 ms Kippen per `ctx.rotate`, danach `dead`. Tiere laufen über `beastFrame`, Gorak über Rotation.
  - **Personen**, also NPCs, Gefährten und die Goblins im Steinbruch, bekommen **keine** Sterbeanimation. `die()` legt sofort `makeGrave` an und entfernt die Figur. Das betrifft unmittelbar B.9 (Goblin-Befreiung) und B.13.
- **Kamerafahrt:**
  - `cinematic(shots, done)` nutzt pro Einstellung `{ x, y, map, dur, text, setup, tick, to, showOnly }`. `cineNext` **teleportiert den Spieler** (`cineMove`, `p.cineGhost`), und die Kamera folgt ihm.
  - `cineTick` interpoliert `to` mit Smoothstep. `cineEnd` holt übersprungene `setup`s nach. `S.cine` steht in `SKIP`, wird also nie gespeichert, und `save()` verweigert während einer Fahrt.
  - **Grenzen:**
    - kein Zoom pro Einstellung, weil `R.cam.zoom` jedes Frame aus `base * (1 + cz)` neu berechnet wird;
    - kein Fokus auf ein Entity;
    - der Maus-Blickvorlauf (bis 40 px) und der Kampf-Zoom `cz` wirken auch während der Fahrt;
    - der Kartenwechsel läuft über den Spieler, der dabei aus `S.ents` entfernt und wieder eingefügt wird;
    - kein Schwenk ohne Ghost-Bewegung;
    - Text nur als Letterbox-Zeile.

**Was ein datengetriebenes `ANIM_DEFS` braucht (B.16):**
- Ereignis-Zeitpunkte müssen an **dieselbe Uhr** wie das Gameplay. Treffer über `c.swing`-Anteil (`swingHit`), Tod über `corpse.born`, Gesten über `c.act.at/until`. Keine eigenen `setTimeout`s.
- Vorschlag: `ANIM_DEFS[key] = { dur, frames: [[t, pose, {rot, dx, dy, sx, sy}]], events: [[t, 'fx'|'sfx'|'shake'|'stop', arg]] }`. Ausgewertet wird zentral in einer Funktion `animEvents(e, from, to)`, die `tickCombatant` (Schwung) und `updateFx`/`drawCorpse` (Tod) aufrufen. Die Ausgaben sind die bestehenden `fx()`, `sfx()`, `camShake()` und `hitStop`.
- **Todesarten:** `die()` schreibt auf die Leiche `dc` = Ursache. Abgeleitet wird sie aus `c.lastKind` (fire, frost, holy, arcane, shock), `result === 'decap'`, `c.kb` (Rückstoß), der Monsterfamilie (Untote → Zerfall; `robot` bzw. Automat → Funken und Abschalten) und `crit`/Schadenshöhe (schwer). Leichen sind transient, also gibt es kein Save-Risiko.
- **Cache-Schonung:**
  - Todesvarianten möglichst **als Transformation** vorhandener Bilder zeichnen: Rotation, Versatz, Stauchen, `flashOf`, Alpha oder Pixel-Maske fürs Auflösen. Keine neuen Posen.
  - Höchstens 3–4 neue gemalte Posen: Rückwärtssturz, Vorwärtssturz, Ringen am Boden und Einfrieren als Tönung.
  - Diese Bilder in einem **eigenen kleinen Cache** ablegen (etwa 200 Einträge, LRU), damit sie den Haupt-Cache nie über 4000 treiben und keinen Voll-Clear auslösen.
  - Gesten (B.12) als **Mischposen** `i0+zeigen`, `i0+abwehren` usw. Das sind nur neue Rig-Einträge in `rigS`/`rigW`. Neue Cache-Schlüssel entstehen nur für sprechende Figuren und je Richtung.
- **Kamera:** `cinematic`-Shots bekommen optional `zoom` (Faktor) und `focus` (Entity-id). Der Kamera-Block in `update` (Z. 2246–2260) nimmt während `S.cine` einen `R.cam.cineZ` statt `cz`, schaltet den Blickvorlauf ab und zielt auf das Fokus-Entity statt auf den Ghost-Spieler.

### E) Was nicht überschrieben werden darf

- `attachProsthesis`, `mechBonus`, `mechMenu`, `mechSwapOptions`, der Zweig `prosthesis` in `useConsumable`: erweitern.
- `BIG_START.airship`: parametrisieren, nicht ersetzen.
- `drawSkyLife`: um die Flotte ergänzen.
- `caravanDay`/`myCaravanDay`/`riskOf`: bleiben; Luftschiffe laufen daneben.
- `seaVoyage`/`seaTick`/`deck`: als Vorlage oder gemeinsamer Code, nicht kopieren.
- `cinematic`/`cineNext`/`cineEnd` mit Nachholen der `setup`s: bleiben kompatibel. Neue Felder sind optional.
- `frameCache`/`cacheGet`: Grenze und Schlüsselaufbau nicht ändern.
- `feelOf`/`WEAPON_FEEL`, `hitStop`, `camShake`, `R.cam.punch`.
- `S.halt`-Schlüssel `town:trade`.
- `autoRanks`, `startTrial`.
- Welt-Erzeugung (`genWorld`, `rnd()`-Reihenfolge).

---

## 2. Abhängigkeiten

```
P1 Fundament (Bugfixes, MECH_Q, Migration)
 ├─► P2 Roboterauge ──┐
 ├─► P3 Glieder, Module, Sichtbarkeit ─┤
 └─► P4 Wartung, Werkzeug, Material (braucht ECO-Preise; enthält den S.halt-Fix)
            └─► P5 Händler, Chirurg, Rang-Gating, UI (braucht P2–P4)
P6 Luftschiff-Datenmodell und Hafen (unabhängig von P1–P5; braucht ECO, bigDay)
 └─► P7 Passage, Schäden, Reparatur (braucht P6 und die deck-Vorlage)
P8 Animations-Fundament (unabhängig; profitiert von P3 wegen des Messing-Glieds in msOf)
```

- P1 muss zuerst kommen. Solange Verschleiß und Vererbung falsch sind, verfälscht jede Bionik-Balance die Tests.
- P4 vor P5, weil Händler Wartungsteile verkaufen.
- P6 und P8 können parallel zu P2–P5 laufen, in getrennten Sitzungen. Sie berühren sich nur in `render.js`.

---

## 3. Save-Risiken

1. **`SAVE_VERSION` nicht erhöhen.** `migrate()` verwirft alles unter Version 4. Eine Erhöhung auf 5 wäre zwar ladbar, bringt aber nichts. Neue Felder bekommen Defaults in `continueGame` mit `??=` bzw. über ein `S.flags.<paket>`-Einmalflag, wie es mit `gen2`/`deep1`/`villages12` üblich ist.
2. **Neue Felder zentral definieren:**
   - `bionicDefaults(c)` für `c.body[k].mechQ`, `c.eye` und die Übernahme von `p.lens`;
   - `airDefaults()` für `S.air`.
   Beide werden in `continueGame` **und** `newGame` aufgerufen.
3. **`p.lens` einseitig migrieren:** `if (p.lens && !p.eye) p.eye = { q: 2, cond: 100 }`. `p.lens` bleibt als Lesefallback stehen; nicht im selben Paket löschen.
4. **Kein neues Körperteil in `PARTS`** (siehe A). Ein siebtes Teil bräche jeden alten `c.body`.
5. **`mechCond` fehlt = 100.** Jede neue Stelle muss `?? 100` lesen. Nie `|| 100`, denn 0 ist ein echter Zustand.
6. **Keine Props in `genWorld`.** Das verschiebt `rnd()`, die Prop-Schlüssel `gk` und `PROP_BASE`; alte Stände hätten dann „fehlende“ oder doppelte Props. Den Hafen per `ensureAirport()` (idempotent) anlegen.
7. **Transiente Zustände:**
   - Leichen, `S.cine`, `c.act` und Prüflinge bleiben transient bzw. werden beim Laden zurückgesetzt. `c.act` wird geleert, weil `performance.now`-Werte nach dem Laden wertlos sind.
   - Neue Animationsfelder am Entity (z. B. `e.anim`) müssen in die Reset-Liste der Ladeschleife (Z. ~1946) oder ganz ohne Speicherung auskommen.
   - Die Rundung `r2` auf 2 Nachkommastellen gilt für alle gespeicherten Zahlen.
8. **Speichern während einer Reise:** `S.voyage` wird gespeichert, weil es nicht in `SKIP` steht. Bevor die Luftschiff-Passage darauf aufbaut, prüfen, wie ein Laden auf `deck` endet.
9. **Gefährten mit Prothesen:** Wird Verschleiß für Gefährten eingeführt, bekommen alte Gefährten ohne `mechCond` den Wert 100. Das ist harmlos.
10. **Größe:** `S.air.fleet` höchstens etwa 6 Einträge, keine Positionshistorie speichern.

---

## 4. Paketplan (8 Pakete, je eine Sitzung)

Jedes Paket erfüllt `MASTER_ROADMAP` A.3:
- Selbsttest-Probe in `selftest()`, still mit `S._quiet`, echter Stand unberührt;
- Debug-Knopf im Debug-Menü;
- `loadProbe()` grün;
- Eintrag in `MECHANIKEN.md`;
- danach ein Sonnet-Testagent mit dem genannten Testfall.

### P1 — Bionik-Fundament und Fehlerbehebung (P0 Save-Kompatibilität)

**Ziel:** Die bestehende Prothesenlogik korrekt machen und Qualitätsstufen einführen, ohne alte Stände zu brechen.

**Betroffen:**
- `body.js`:
  - `attachProsthesis` setzt `mechCond = 100`, `mechUp = 0` und `mechQ` (bzw. `mech` als Qualität).
  - `damagePart` (abgetrennt) löscht `mechCond` und `mechUp`.
  - neue Tabelle `MECH_Q = {1: schlecht, 2: standard, 3: hochwertig, 4: prototyp}` mit `arm`, `leg`, `wear`, `name`.
  - `mechBonus` liefert Werte mit Vorzeichen: Stufe 1 gibt −8 % Arm und −6 % Bein, Stufe 2 gibt 0, Stufe 3 bleibt bei +10/+6 (bestehende Tests), Stufe 4 gibt +15/+10.
- `game.js`:
  - `hurt()`: Verschleiß **nach** der Prüfung auf `alive`, `invuln` und `god`, nur bei `kind === 'physical'` und `source`, nur für das tatsächlich getroffene Glied. Nötig ist dafür ein Rückkanal aus `pickPart`/`damagePart`, oder der Abzug wandert an die Stelle, wo `part` bekannt ist. Schrott nutzt sich ×2 ab.
  - Debug „Glied abtrennen“ ruft den korrigierten Weg auf.
  - `bionicDefaults()` in `continueGame`/`newGame`.

**Neue Felder:**
- `c.body[k].mechUp` wird beim Anlegen explizit auf 0 gesetzt.
- `mech` bleibt die Qualitätsstufe 1–4.
- Sonst keine neuen `S.*`-Felder.

**Debug-Knopf** „Kampf & Körper → Prothese anlegen (Stufe 1–4)“ und „Prothesen −30 % Zustand“.

**Selbsttest-Probe:**
- Arm abtrennen → Aurelarm anlegen → `mechCond === 100 && !mechUp`.
- Zehn Gift-Ticks auf den Spieler → `mechCond` unverändert.
- Treffer in den Rumpf → Beinprothese unverändert.
- `mechBonus` Stufe 1 < 0 < Stufe 3.
- Bestehende Proben Z. 11448 und 12037 bleiben grün.

**Sonnet-Testfall:**
- Mit `?dev` Arm abtrennen, Schrottarm anlegen, 30 s gegen Wölfe kämpfen.
- Zustand im X-Fenster notieren und mit dem erwarteten Verschleiß vergleichen: nur Arm-Treffer, ×2.
- Speichern, neu laden, Zustand identisch.

### P2 — Roboterauge (P0)

**Ziel:** Die Linse wird ein echtes Bionik-Teil mit Qualität, Zustand und spürbarer Wirkung.

**Betroffen:**
- `game.js`:
  - `revealAround`-Radius nach Stufe;
  - `critChance` (Z. 3064): +2/+4/+6 % Fernkampf-Krit ab Stufe 2;
  - `mechMenu`: „Auge einsetzen/warten“ statt Linse;
  - `activeEffects` mit neuer Zeile „Auge“;
  - Schock- bzw. Arkan-Treffer in `hurt()` senken `eye.cond` („Magie-Anfälligkeit“).
- `render.js drawLight`: Spielerlicht-Radius +40 % ab Stufe 3 (Nachtsicht). Stufe 4 zeigt feindliche Figuren mit Umriss im Nebel (Wärmesicht, nur Anzeige).
- `data.js`: Items `auge_schrott`, `auge_aurel`, `auge_meister`, `auge_proto` mit `use: 'eye'` und neuem Zweig in `useConsumable`.

**Neue Felder:** `S.player.eye = { q: 0..4, cond: 100 }`, Standard `null`. Migration: `p.lens` → `{ q: 2, cond: 100 }`.

**Debug-Knopf** „Bionik → Auge Stufe setzen“ und „Auge beschädigen“.

**Selbsttest-Probe:**
- Stand mit `p.lens = true` durch `bionicDefaults` → `eye.q === 2`.
- Stufe 3 ergibt einen größeren Lichtradius als Stufe 0; die Hilfsfunktion `lightR(p)` ist testbar.
- `cond < 30` ergibt keinen Bonus.

**Sonnet-Testfall:** Nachts in der Wildnis ohne und mit Auge Stufe 3 je einen Screenshot vergleichen. Kartennebel-Radius messen. Speichern, laden, Auge vorhanden.

**Status: FERTIG (Logik, Items, UI, Debug, Probe).** `body.js`: `EYE_Q`, `eyeOf`, `fogR`, `lightR`, `eyeCrit`, `attachEye`, `wearEye`, `bionicDefaults`. `game.js`: Zweig `use: 'eye'` in `useConsumable`, `eyeOptions` in `mechMenu` (ersetzt die Linse), Fernkampf-Krit in `hurtFromProjectile`, Magie-Verschleiß in `hurt()` (`EYE_ZAP`), X-Zeile in `activeEffects`, Migration in `continueGame`, Debug „Bionik“. Nebel (`B.fogR(p)` in `update()`) und Nachtsicht (`lightR` in `render.js drawLight`) hat die Hauptsitzung angeschlossen; die Wärmesicht (Stufe 4) zeichnet `drawLight` als glühenden Umriss um Gegner im Dunkeln.

### P3 — Roboterarm, -bein, Hand- und Fußmodule, Sichtbarkeit (P0)

**Ziel:** Arm und Bein in allen Qualitätsstufen; Hand und Fuß als Module; Prothesen im Stil R sichtbar.

**Betroffen:**
- `data.js`: Prototyp-Glieder `protoarm`/`protobein` und Module `use: 'mechmod'`:
  - `greifhand`: Handwerk und Tragkraft;
  - `klingenhand`: +Nahkampf, aber kein Schild;
  - `federfuss`: +Tempo;
  - `ankerfuss`: kein Rückstoß, weniger Tempo.
  Ein Modul passt nur auf ein Glied mit `mech`.
- `body.js mechBonus`: Modul-Boni.
- `game.js`: Zweig in `useConsumable`; Rückstoß in `hit()` (`target.kb`) prüft `ankerfuss`.
- `sprites.js msOf`: `mech` wird **3** statt 0.
- `fig5.js`: `limbSt === 3` malt das Glied in Messing, das ist `L.gold` aus `resolve`. Der Cache-Schlüssel ändert sich nur für Prothesenträger.

**Neue Felder:** `c.body[k].mod`, Standard `undefined`.

**Debug-Knopf** „Bionik → Modul anlegen“ (Auswahl).

**Selbsttest-Probe:**
- `msOf` einer Figur mit Prothese enthält `'3'`.
- `humanFrameR` für diese Spec erzeugt genau einen neuen Cache-Eintrag je Pose (`frameCacheInfo().miss`-Differenz).
- `ankerfuss` → `target.kb` bleibt `null`.

**Sonnet-Testfall:** Figurenblatt (Debug „Grafik“, Posen-Übersicht) mit Messingarm links/rechts in allen vier Richtungen prüfen: sichtbar, kein Flackern. `frameCacheInfo().clears` nach 2 Minuten in Aurelheim ist 0.

**Status: FERTIG (Logik, Items, Stil-R-Bild, UI, Debug, Probe).** `body.js`: `MECH_MOD`, `hasMod`, Modul-Bonus in `mechBonus`, `attachProsthesis`/`damagePart` löschen `mod`. `sprites.js msOf`: Prothese = 3. `fig5.js`: `mechArm`/`mechLeg` färben Ärmel+Hand bzw. Hosenbein in `L.gold`/`L.metal` (Vorder-, Rück- und Seitenansicht). `game.js`: Zweig `use: 'mechmod'`, Ankerfuß in `hurt()` (Rückstoß) und im Block-Ruck, Klingenhand im Block (`shield`), Greifhand in `speedOf` und `mendAt`, Modulzeile in `activeEffects`, Debug „Bionik“. Die Probe prüft statt `miss`-Differenz die Bild-Identität (robust gegen einen zweiten Selbsttestlauf).

### P4 — Wartung, Werkzeug, Material, Selbstreparatur (P0)

**Ziel:** Medizin heilt Fleisch, Werkzeug repariert Maschine. Die Reparatur hängt an der Wirtschaft.

**Betroffen:**
- `data.js`:
  - `feinwerkzeug` (Werkzeug, wird nicht verbraucht);
  - `spezialoel` (Verbrauchsgut, +25 Zustand);
  - `ersatzteile` (Material).
  - Bestehende Güter `magitech`, `tools` und `ingot` werden wiederverwendet; es gibt kein zweites „Metall“.
- `game.js`:
  - Zweig `use: 'mechkit'` in `useConsumable`;
  - `mendAt` (Werkbank oder Amboss) bietet mit Feinwerkzeug und `magitech` „Prothese selbst warten“, bis 70 % (Handwerk-Fertigkeit hebt die Obergrenze);
  - `mechMenu`-Preise über `ECO.ecoPrice(town, 'magitech', true)`;
  - **Fix Streik:** `BIG_START.strike` setzt `S.halt['tickmar:magitech'] = until`, alle `delete S.halt.tickmar` werden angepasst;
  - `oilMount` als Vorbild für Tages-Wartung übernehmen.
  - Stufe 3 und 4 unter 50 % Zustand: −Tempo bzw. −Schlag, also Leistung sinkt stufenweise statt hart bei 30 %.

**Neue Felder:** keine. Material liegt im Inventar.

**Debug-Knopf** „Bionik → Wartungsset geben“ und „Magitech-Werk stilllegen“ (setzt `S.halt`).

**Selbsttest-Probe:**
- Streik starten → `ecoDay` → Tickmars `magitech`-Betrieb `made === 0`.
- `mechMenu`-Preis steigt, wenn `S.towns.tickmar.stock.magitech` sinkt.
- Selbstreparatur ohne Feinwerkzeug → Toast, kein Verbrauch.

**Sonnet-Testfall:** E2E-Test 1 aus MASTER_ROADMAP C.41: Arm verlieren → Händler → Roboterarm → Werte → Schaden → Werkzeug fehlt → beschaffen → Reparatur → speichern/laden.

**Status: FERTIG (Logik, Items, UI, Debug, Probe).** `data.js`: `feinwerkzeug`, `spezialoel` (`use: 'mechkit'`), `ersatzteile`. `body.js`: `bionicParts`, `setBionicCond`, halber Vorteil unter 50 % in `mechBonus`, `wearProsthesis` meldet `half`. `game.js`: Zweig `mechkit`, `selfCap`/`selfRepair` und Auswahl in `mendAt(t, skipMech)`, `mechRate(town)` über `ECO.ecoPrice` in `mechMenu`/`eyeOptions`, Streik-Fix (`BIG_START.strike` setzt `S.halt['tickmar:magitech']`, `strikeOff()` statt `delete S.halt.tickmar`, Migration des alten Schlüssels in `continueGame`). Abweichung: keine Tages-Wartung nach `oilMount` (bewusst weggelassen, Öl und Selbstwartung decken es ab). Die Probe prüft den Stillstand über den `S.halt`-Schlüssel, den `ecoDay` liest, statt `ecoDay` selbst laufen zu lassen.

### P5 — Bionik-Händler, Chirurg, Schwarzmarkt, Rang-Gating, Bionik-Anzeige (P0 Händler und Aurelion-Integration)

**Ziel:** Bionik ist in Aurelion an mehreren Orten erreichbar, nach Rang gestaffelt und im Charakterbogen sichtbar.

**Betroffen:**
- `game.js`:
  - `mechMenu(npc)` bekommt einen Leistungsumfang je Beruf:
    - Prothesenhändlerin: verkauft Stufe 1–2 über den bestehenden Shop mit `pool`;
    - Kybernetiker: Wartung und Module;
    - Medica in Aurelion: Chirurgie mit `mechSwapOptions`, Auge;
    - Vell: alles.
  - Gesprächsoption in `talk` für diese Berufe.
  - Gating über `S.ranks.aurel` (Tabelle in 1C) mit klarer Absage im Dialog.
  - `rankGuide('aurel')` bekommt Zugangszeilen.
  - Schwarzmarkt: ein Händler von Rooks Bande bekommt Stufe 1 und seltene Prototypen in `pool`; kein Rang nötig, aber +50 % Preis und Chance auf Zustand 60.
  - Die Pools der Villager-Händler vergibt `spawnResidents` bzw. die Rollenzuweisung (idempotent; alte Stände bekommen sie beim Laden).
- `ui.js`:
  - `woundNotes`/`bodyChart` markieren Prothesen-Glieder (Klasse `bp-mech`, Tooltip mit Stufe, Zustand und Modul);
  - `charUI` zeigt eine Zeile „Auge“.
  - Kein neues Fenster.

**Neue Felder:** keine. Gating liest `S.ranks.aurel`, `S.acadRank` und `hasPermit()`.

**Debug-Knopf** „Bionik → Händler hier spawnen“ (transienter Kybernetiker vor dem Spieler).

**Selbsttest-Probe:**
- Rang 0 → Stufe-3-Angebot fehlt.
- Rang 2 → vorhanden.
- Villager „Kybernetiker“ in Gelenkhall liefert Optionen aus `mechMenu`.
- `bodyChart` enthält `bp-mech` für ein Prothesen-Glied.

**Sonnet-Testfall:** E2E-Test 2 (Roboterauge) und je ein Screenshot vom Charakterbogen mit 0, 1 und 2 Prothesen. Den Rangführer lesen und prüfen, ob die Zugangszeilen mit dem Verhalten übereinstimmen.

**Status: FERTIG (Logik, UI, Debug, Probe).** `game.js`: `MECH_SCOPE` und `mechMenu(npc)` (Umfang je Beruf, gibt die Optionen zurück), `aurelRank`/`bionicLack`/`bionicTier`, Sperren in `mechSwapOptions` (mit `who`), `eyeOptions` und `shopStock`, `bionicChoices(npc)` in `talk()`, `blackOffers`/`blackMarket` (Rook, Nix — statt eines neuen Bandenhändlers), `MARKET_POOL` für Prothesenhändlerin und Kybernetiker plus Nachtrag in `continueGame`, Vells Pool erweitert, `AUREL_BIONIC` im Rangführer, gebrauchte Ware über `slot.used` in `useConsumable`. `ui.js`: `mechNote`, `bp-mech` in `bodyChart`/`woundNotes`, `bionicBlock` im Charakterbogen. `style.css`: `.bp-mech`. Die bestehende Probe „Nutzer S13 Aurelion“ setzt jetzt `S.ranks.aurel = 2`, weil Chirurgie Bürgerrang braucht.

### P6 — Luftschiff-Datenmodell, Flotte, Hafen Kupferhafen (P0 Luftschiff-Grundüberarbeitung)

**Ziel:** Luftschiffe werden Zustand statt Deko. Die Flotte fliegt abstrakt, beeinflusst Aurelions Versorgung, ist sichtbar und kann abstürzen.

**Betroffen:**
- `economy.js`:
  - `airDefaults()`, `airDay()` (aus `ecoDay`), `riskAir()`;
  - Aurelion-Import (Z. 172) × Anteil einsatzbereiter Handelsschiffe;
  - Hülle 0 → Rückruf `H.crash(ship)`.
- `game.js`:
  - `ensureAirport()`: Mast-Prop und Hafenmeisterin (`key: 'hafenmeisterin'`) in Kupferhafen, idempotent in `continueGame`;
  - `BIG_START.airship.go(opts)` parametrisiert, der Absturz einer Flotte ruft ihn mit Schiffsnamen und Routenmitte auf;
  - Dialog der Hafenmeisterin: Flottenstatus, Abflüge.
- `render.js drawSkyLife`: Schiffe aus `S.air.fleet` im Zustand `flug` welt-verankert zeichnen, Position interpoliert über `(S.day - dep) / (eta - dep)`, Rauch bei `motor < 50`. Nur wenn auf dem Bildschirm (Culling). Die zwei Deko-Schiffe bleiben, bis die Flotte existiert.

**Neue Felder:** `S.air = { v: 1, fleet: [], my: null }`. Standard: drei Aurelion-Schiffe (Handel, Handel, Patrouille) mit Heimat Kupferhafen, angelegt einmalig über `S.flags.air1`.

**Debug-Knopf**:
- „Luftschiff → Flotte zeigen“ (Toast/Log);
- „Schiff beschädigen (−40 Hülle)“;
- „Absturz jetzt“;
- „Schiff reparieren“.

**Selbsttest-Probe:**
- `airDefaults` in einem alten Stand ohne `S.air` → drei Schiffe.
- Hülle 0 → `S.big.kind === 'airship'`, Schiff `state === 'wrack'`.
- Ein Handelsschiff im Wrack → Aurelions Nahrungszufluss sinkt.
- `loadProbe` grün.

**Sonnet-Testfall:** In Kupferhafen die Hafenmeisterin ansprechen und fünf Tage per Debug `tick` vorspulen. Schiffe am Himmel sichtbar, bewegen sich zwischen Häfen, folgen **nicht** dem Spieler. Absturz auslösen, Wrack finden, Überlebende aufrichten.

**Status: FERTIG (Logik, Anzeige, Dialog, Debug, Probe).** `economy.js`: `airDefaults` (einmalig über `S.flags.air1`: Kupferwind, Goldmöwe, Wacht von Aurel), `airDay` (aus `dayTick`, nicht aus `ecoDay` — die Wirtschaftsprobe ruft `ecoDay` mehrfach und darf keine Flotte bewegen), `airSupply` (Aurelion-Import × Anteil einsatzbereiter Handelsschiffe, Laderaum-Ausbau +25 %, nie unter 0,2), `airPos`/`airPt`, `riskAir`, `airCrash` → Rückruf `airH.crash`; Werft in Kupferhafen bessert mit Barren aus, Neubau eines Wracks nach 5 Tagen aus 6 Barren und 6 Bauholz; gleiche Schiffsart startet versetzt. `game.js`: `ensureAirport` (Mast mit `planned`, Hafenmeisterin Odila Kranz `key: 'hafenmeisterin'`, Mastwarte in Aurelheim, Gelenkhall, Tickmar, Sankt Serin; alles flüchtig, idempotent in `newGame`/`continueGame`), `airCrashed`, `BIG_START.airship.go(o)` parametrisiert (ohne `o` stürzt ein Schiff der Flotte ab), `harborTalk` (Flottenstatus, Erklärung), Gerettete beschleunigen den Neubau. `render.js`: `drawAirship` (gemeinsame Zeichnung), Flotte welt-verankert mit Namen in der Nähe, Rauch bei Motor < 50; Deko-Bahnen nur ohne Flotte. Abweichung: Hülle 0 ruft `S.big` nur, wenn kein anderes Großereignis läuft (sonst Chronik-Meldung).

### P7 — Luftschiff-Passage, Schäden mit Folgen, Reparatur, erste Upgrades (P0/P1)

**Ziel:** Der Spieler kann mitfliegen. Schäden haben konkrete Folgen, und die Reparatur verbraucht Material aus der Wirtschaft.

**Betroffen:**
- `game.js`:
  - `airVoyage(to)` als Variante von `seaVoyage`: gemeinsame Hilfsfunktion statt Kopie, Karte `deck` mit `S.voyage.air = true`;
  - Ereignisse Sturm (je Wetter), Piraten und Motorschaden;
  - Motor senkt `dur` (Tempo), Steuerung erhöht die Chance auf eine Notlandung, Hülle erhöht den Wetterschaden;
  - Reparatur bei der Hafenmeisterin kauft `ingot`, `tools` und `magitech` aus `S.towns.kupferhafen.stock` über `ecoPrice`;
  - Upgrades Hülle, Motor und Laderaum (Stufe 1–2);
  - Gating Passage ab Rang 1.
- `render.js`: Deck-Hintergrund bei `S.voyage.air` als Himmel statt Wasser.

**Neue Felder:**
- `S.voyage.air` (Boolean, Standard `undefined`);
- `ship.up.*` (Standard 0).

**Debug-Knopf** „Luftschiff → Passage nach Aurelheim“, „Sturm erzwingen“, „Motorschaden erzwingen“.

**Selbsttest-Probe:**
- Motor 40 → Reisedauer länger als bei Motor 100.
- Reparatur senkt `S.towns.kupferhafen.stock.ingot`.
- Speichern während `S.voyage.air`, dann laden → der Spieler steht an Deck oder sicher im Zielhafen, nie im Nichts.

**Sonnet-Testfall:** E2E-Test 3 aus C.41 (kaufen bzw. mitfliegen, Upgrade, Motorschaden, Tempo, Reparatur, Sturm, Hafen, speichern/laden). Das eigene Schiff kann in dieses Paket, falls Zeit bleibt; sonst P1.

**Status: FERTIG (Passage, Ereignisse, Werft, Ausbau, Debug, Probe).** `game.js`: `startVoyage` + `seaTick` als gemeinsamer Ablauf für See und Luft (`VOY_TXT` hält die Texte), `airVoyage(to, from, ev)` mit Schiff der Flotte (`S.voyage.air`, `S.voyage.ship`), Ereignisse Sturm (Wetter der Abfahrt), Luftpiraten, Motorschaden (`airMotorFail`: Handwerk-Probe, klemmende Steuerung → Notlandung auf halber Strecke), Hülle < 50 = Wetterschaden ×1,5, Dauer `ECO.airDur` nach Motor und Ausbau, Ankunft am Mast über `S.airLand` in `ARRIVAL.world`, `airRepair`/`airUpgrade` (Material aus `S.towns.kupferhafen.stock` zum `ecoPrice`, fehlt es, keine Arbeit), Gating Rang 1 (`aurelRank`), `voyageFix` beim Laden. `render.js drawSkyDeck`: Himmel, Wolken, Ballon mit Tauen. Das eigene Schiff (`S.air.my`) bleibt für später (Feld existiert, `null`).

### P8 — Animations-Fundament: Todesarten, Personen-Tod, Gesten, Kamera pro Einstellung (Teil B, Grundstein)

**Ziel:** Das datengetriebene Gerüst (B.16) mit dem ersten sichtbaren Nutzen:
- erkennbare Todesursachen;
- Personen sterben sichtbar, nicht mehr sofort als Grab;
- Kamera-Zoom und Fokus je Einstellung.

**Betroffen:**
- **Neu** in `render.js` oder als kleines `src/anim.js`: `ANIM_DEFS`, `animEvents(e, t0, t1)` und ein eigener LRU-Cache (200 Einträge) für Todesbilder.
- `game.js die()`:
  - setzt `dc` auf der Leiche (`fall`, `fallB`, `burn`, `frost`, `dissolve`, `crumble`, `sparks`, `decap`, `heavy`) aus `lastKind`, `kb`, Familie und Krit;
  - **Personen** bekommen zusätzlich eine transiente Leiche (`kind: 'corpse'`, `spec` als Schnappschuss von `SP.humanSpec(c)`, `life` etwa 2500 ms), bevor bzw. während `makeGrave` läuft.
- `render.js drawCorpse`: Ablauf aus `ANIM_DEFS.death[dc]` (Transformationen auf bestehende `hit`/`die1`/`dead`-Bilder plus `fx`-Ereignisse).
- `fig5.js rigS`/`rigW`: 2–3 Gesten als Mischposen (`zeigen`, `abwehren`, `achsel`).
- `cinematic`/`cineNext`:
  - optionale Shot-Felder `zoom` und `focus`;
  - Kamera-Block in `update`: bei `S.cine` kein Blickvorlauf, kein `cz`, Zielpunkt Fokus-Entity.

**Neue Felder:** keine gespeicherten. `R.cam.cineZ` und `corpse.dc` sind transient.

**Debug-Knopf**:
- „Animation → Tod erzwingen (Ursache wählen)“ am nächsten Gegner oder an einer Test-Person;
- „Animation → Geste abspielen“;
- „Kamerafahrt-Test (Zoom/Fokus)“;
- „Cutscene wiederholen“ (letzte `shots` merken).

**Selbsttest-Probe:**
- `die()` mit `lastKind = 'fire'` → Leiche `dc === 'burn'`.
- Person stirbt → Grab **und** transiente Leiche, keine Duplikate nach `loadProbe`.
- Shot mit `zoom: 1.5` → `R.cam.zoom` während der Einstellung ≈ `base * 1.5`, nach `cineEnd` wieder normal.
- `frameCacheInfo().clears` unverändert nach 50 Toden.

**Sonnet-Testfall:**
- Jede Todesart per Debug abspielen, per Screenshot die Ursache zuordnen („Ist erkennbar, woran er starb?“).
- Goblin-Befreiung (`liberate`) mit Debug auslösen und prüfen, dass sterbende Goblins sichtbar fallen.
- Die Fahrt überspringen und prüfen, dass es keine doppelten NPCs und keine wiederbelebten Toten gibt (B.19).

**Status: FERTIG (Todesarten, Personen-Tod, Gesten, Kamera je Einstellung, Debug, Probe).** Neu `src/anim.js`: `ANIM_DEFS.death` (fall, fallB, heavy, burn, frost, dissolve, crumble, sparks, decap — Dauer, Drehung, Rutschen, Farbstich, Verblassen, Zusammensacken, Zerspringen, Ereignisliste), `ANIM_DEFS.gesture`, `animEvents`, `deathPose` (rein rechnend), `tinted` mit eigenem LRU (200). `game.js`: `deathKind`/`dying` (aus `lastKind`, `lastCrit` neu in `hurt`, `decapped`, Rückstoß, Familie; `forceDc` für Debug), `dc` an jeder Gegner-Leiche, `personCorpse` (flüchtige Leiche mit `SP.humanSpec`-Schnappschuss, 2,5 s; das Grab ist so lange `hidden`, beim Laden immer sichtbar), `DYING`/`deathTick` feuert die Ereignisse, `gesture(c, g)` über `act(…, 'gesture')`, `camAim` (Kamera-Block aus `update`: bei `S.cine` Shot-`zoom` und `focus`, kein Blickvorlauf, kein Kampf-Zoom), `lastCine` für „Cutscene wiederholen“. `render.js`: `drawDeath`, `deathFrameProbe`, Blutlache nur bei blutigen Toden. `fig5.js`: Posen `zeigen`, `abwehren`, `achsel` in `rigS`/`rigW`; `sprites.js`: Stil-D-Ersatz in `POSES`, `poseOf` kennt `gesture`. Abweichung: kein eigener Kopf-Sprite bei Enthauptung (kleiner rollender Kreis); die bestehenden Fahrten nutzen `zoom`/`focus` noch nicht (B.14/B.9 im Ausblick).

---

## 5. Nach P0 (Ausblick, nicht Teil dieser acht Pakete)

- Aurelion-Rang-Prüfungen 3–6 über `startTrial` mit neuen Arten (Technik-Aufgabe in der Fabrik, Kampf gegen Amok-Automat, Luftschiff-Eskorte). Sie schalten Prototyp-Bionik und das eigene Schiff frei.
- Luftschiff-Handel des Spielers (Muster `S.eco.my`) und Piraten als Bande.
- Luftschiff-Absturz-Cinematic mehrstufig (B.14) auf P8.
- Goblin-Befreiung als inszenierte Szene (B.9) mit `focus`-Shots und Personen-Toden aus P8.
- Hit-Reaction-Varianten je Material (Rüstung, Fleisch, Untot, Automat) über `ANIM_DEFS.hit` und `fx`.


## 5b. Dauerauftrag Nutzer (30.09.2026): mehr Vielfalt bei Figuren

Bei jeder passenden Gelegenheit mehr Varianten einbauen, nie nur eine Figur je Art:
- **Untote:** Skelette, Zombies, Ghule, Knochenschützen, Nekromanten in mehreren Varianten (Körperbau, zerrissene Kleidung, fehlende Teile, Rüstungsreste, Waffen, Farben, Leuchten der Augen).
- **Goblins:** Krieger, Schamanen, Späher, Häuptlinge, Frauen und Kinder der befreiten Stämme; unterschiedliche Größen, Hautfarben, Ohren, Kopfschmuck, Waffen, Kriegsbemalung.
- **Allgemein:** Banditen, Wachen, Bewohner, Tiere, Automaten, Engel, Seevolk — Varianten aus dem Seed der Figur (`e.seed`), damit sie bei jedem Laden gleich aussehen.
- Technik: Varianten als Daten (Paletten, Teile, Größenfaktor) in `sprites.js`/`fig5.js`, nicht als Einzelbilder; Selbsttest-Probe „jede Variante malt sich“.

## 5c. Folgen großer Ereignisse (Nutzerentscheid 30.09.2026)

Dauer der Folgen **je nach Schwierigkeit**: Leicht/Normal erholt sich die Welt nach einigen Wochen Spielzeit; Schwer und Sehr schwer bleiben die Folgen für immer (nur Spieler-Taten kehren sie um).
- **Sklavenaufstand gewonnen:** (1) Die Befreiten gründen eine freie Siedlung (Händler, Aufträge, eigene Fraktion). (2) Die Eiserne Kette schlägt zurück: Tage später Rachezüge und Kopfgeldjäger. (3) Arbeitskräfte fehlen: Steinbrüche/Minen der Kette stehen still, Eisen und Stein werden teurer. (4) Andere Städte kippen: der Aufstand greift je nach Ruf auf Nachbarorte über.
- **Streik in Tickmar gewonnen:** (1) Löhne hoch, Magitech/Bionik dauerhaft teurer, dafür weniger Unfälle. (2) Arbeiterrat als neue Macht im Rat von Aurelion (eigene Aufträge, Gesetze). (3) Streikwelle in anderen Fabrikstädten, wenn man nicht eingreift. (4) Das Haus Vantor rächt sich (Schläger, Intrigen gegen den Spieler).
- **Städte in Aurelion fallen** (Krieg, Tod der Kaiserin): (1) besetzt und sichtbar zerstört, Wachen des Siegers, Händler weg, Bionik/Magitech dort nicht mehr kaufbar. (2) Flüchtlingszüge in Nachbarstädte, Preise steigen dort, neue Aufträge. (3) Befreiung als Wellenkampf wie bei Menschenstädten, danach Wiederaufbau. (4) Nach mehreren Fällen zerbricht das Hochreich in Häuser, die sich bekriegen (Fall Aurelions, C.24).

- **Dorf komplett ausgelöscht** (Spieler, Monster, Krieg): alle vier Folgen — Ruine mit Verfall, später Neubesiedlung in Stufen; Banditen/Goblins nisten sich ein (Auftrag zum Ausräuchern); Spuk/Geisterdorf nachts mit Friedhof der Bewohner (Priester-Auftrag); war es der Spieler: Rache und Kopfgeld der Fraktion, Chronik, Ruf überall.
- **Seuche nicht eingedämmt:** Bewohner sterben täglich (Stadt schrumpft), Ausbreitung über Karawanen auf Nachbarstädte, Quarantäne (Wachen sperren, kein Handel, Schmuggel-Aufträge), der Spieler kann erkranken (Status, Heilung beim Heiler, Roadmap C.15).
- **Hexenprozess:** Hinrichtung einer Unschuldigen hat Folgen (Angst, Magier fliehen, Akademie-Ruf sinkt); Befreiung hat Folgen (Orden jagt, die Gerettete wird Gefährtin oder Lehrerin); Hexenjagd-Welle in anderen Städten, wenn der Orden zu stark ist.

## 5d. Zehn dünne Bereiche — Nutzerentscheide (30.09.2026)

1. ✅ **Erledigt (Version 21, siehe MECHANIKEN.md „Eisenfeste bevölkert“).** **Eisenfeste** bevölkern: mehr Militärleben (Appell, Drill, Kaserne, Messe, Auspeitschung), Zivilisten (Soldatenfamilien, Schmiede, Quartiermeister, Feldscher, Kasernenmarkt), Sklavenmarkt, Kettenpriester und Schreiber. **Dunkle Klassen** der Kette je nach Grundklasse: Dunkler Hochpaladin (Krieger, gibt es), **Dunkler Priester** (Kleriker/Magier), **Kettenjäger** (Schütze), **Folterknecht/Henker** (Schurke), **Kettenbarde** (Barde) — Lehrer in der Feste, Rang in der Kette nötig. **Nach Vargs Fall entscheidet der Spieler**, wer die Feste übernimmt (Goblins, Valen, Flüchtlinge).
2. **Karak-Atar (GEBAUT):** neutrale Handelsstadt unter Herrschaft der Sandfürsten (Basar, Wegzoll, Schmuggel aus Aurelion) **und** eigenes Wüstenvolk mit Kultur (Wasserhandel, Rituale).
3. **Eigene Siedlung (P14):** Ort frei wählbar; Mischung beim Bauen (wichtige Bauten selbst setzen, Wohnhäuser bauen Siedler in Zonen).
4. **König Varon:** Mischung aus hartem Kriegskönig, schwachem, von Adligen gelenktem König und Paranoia (verfeindet mit Aurelion) — **neue Burgstadt im Norden** mit Thronsaal, Hof, Kerker, Adel.
5. **Schwarze Feste (GEBAUT):** Hauptstadt der Untoten (Hof der Stillen Schar, Händler, Rang-Aufträge), Totentempel (Seelenhandel, Leichenzüge, Rituale), nach Garmadon **eroberbar** (Belagerung als Großereignis).
6. **Tiefhall:** lebende Zwerge in einer **Bergstadt** auf einer tieferen Ebene (Händler, Schmiede mit Königseisen).
7. **Banden (GEBAUT):** zufällige Banden, die entstehen und zerfallen (Lager, Anführer, Gebiet, Schutzgeld).
8. **Handwerk (GEBAUT):** Rezepte an Esse/Werkbank/Kessel, **Qualität nach Fertigkeit**, Spezialmaterialien (Königseisen, Magitech).
9. **Seevolk:** **freie Seefahrt** mit eigenem Schiff, mehrere Inseln, Seehandel und Piraterie.
10. **Aurelions Nebenstädte:** **eigene Grundrisse** und eigener Charakter je Stadt (Klinik-/Tempelstadt Sankt Serin, Werftstadt Kupferhafen, Fabrikstadt Tickmar, Gelenkhall).
- **Talentpunkte:** jede dritte Stufe (21 bis Stufe 60).
- **Omega fällt:** Panik im Osten, Jubel und Pilgerzüge im Westen.

## 5e. Weitere zehn Bereiche — Nutzerentscheide (30.09.2026)

1. **Gefährten 2.0 (GEBAUT):** keine Romanze, nur tiefe Freundschaft. **Loyalität** als Langzeitwert; **jeder** Gefährte kann bei niedriger Loyalität verraten. Eigene Auftragsketten je Gefährte, Lagerfeuer-Gespräche.
2. **Dynastie (GEBAUT):** Erben aus allem — Heirat und Kinder (wachsen in Spielzeit), Adoption von Waisen/Gefährten, dazu Zufall wie bisher.
3. **Gewölbe (GEBAUT, handgebaute Orte als drei geheime Gewölbe):** Rätsel und Hebel (Hebeltür, Druckplatte, Geheimwand nach Wahrnehmung), 5–8 geheime handgebaute Orte nur über Hinweise, Modifikatoren (überflutet, dunkel, verflucht), Endlosgewölbe.
4. **Gerüchte (GEBAUT):** erzeugen echte Ziele (Schatz, Bestie, Deserteur); **selten** falsch (auch mal Hinterhalt); grober Kreis auf der Karte.
5. **Schenke (GEBAUT):** Würfel, Karten, Armdrücken/Trinkwette, Faustkampf ohne Tote und Rausch (schwankende Steuerung).
6. **Wetter mit Wirkung (C.12):** gebaut (Regen, Nebel, Schnee, Sandsturm, Hitze, Blutregen; Gegner betroffen).
7. **Verletzungen (GEBAUT):** Brüche und Infektionen halten **Tage**, Heiler/Feldscher beschleunigt; Narben.
8. **Akademie (GEBAUT):** der Spieler wird **Student** (Semester, Vorlesungen, Rivalen, verbotene Abteilung als eigener Pfad).
9. **Goblins nach der Befreiung:** Grubenhort wird **Außenposten** von Morrgrund. Belohnungen: Goblin-Titelklasse, Goblin-Gefährte, Goblin-Händler, Dodon als Gefährte — **Dodon zieht nur in das Dorf des Spielers**, wenn man eines hat. Ab dann kann man **Goblins rekrutieren** (einzelne Helden und Trupps). Goblins bauen **größere Städte südlich der Eisenfeste** (kartenabhängig): wachsen langsam von selbst, schneller mit Spielerhilfe; Stil gemischt aus Pilz-/Lehmhütten, umgebautem Kettenschrott und Tunneln/Gruben. Menschen reagieren **je nach Stadt** (Valen offen, Orden feindlich, Aurelion neugierig).
10. **Epilog (GEBAUT):** nur auf Wunsch am Grab; danach **Wahl des Spielers**: weiterspielen oder 20 Jahre später mit einem Erben.

## 5f. Sprites, Waffen, Animation — Nutzerentscheide (30.09.2026)

- **Varianten für alle:** Bewohner und Wachen (Frisuren, Bärte, Alter, Kleidung je Stadt/Region, Wachenwappen), Banditen und Söldner (Masken, Tücher, Beutestücke, Narben), Tiere (Fellfarben, Größen, jung/alt, Albinos), Automaten und Engel (Messing/Stahl, beschädigt, Leuchtfarben). Dazu weiter Goblins/Untote (§5b).
- **Waffen:** exotische Nahkampfwaffen (Kriegssense, Morgenstern, Katar, Peitsche, Kettenkugel), einzigartige Legendäre mit Geschichte und Spezialeffekt je Boss/Region, Volkswaffen (Goblin, Zwerg, Seevolk, Wüste) mit eigenem Look, Zweiwaffen-Kampf und mehr Schildarten.
- **Animation:** Kampf (Schlagvarianten, Kombos, Treffer-Reaktionen, Finisher), Alltag der NPCs (Arbeiten, Essen, Gesten im Gespräch, Handwerk, Tiere füttern), Tod und Verletzung (Humpeln, Kriechen, Hilferufe, Verbluten), Umgebung (Fahnen, Rauch, Wasser, Vogelschwärme, Türen).
- **Technik:** beides — Bausteine als Daten für die Masse, handgezeichnet für Bosse und Helden. Nach BALANCE_GUIDE.md einpflegen.
- **Nutzer-Nachtrag:** Nahschuss-Bug (Geschosse treffen nahe Gegner nicht) — behoben. Exoten zuerst: Peitsche (heranziehen, schnell und weit) und Sensen/Stangenwaffen (mehrere treffen). **Mehr Sensen** und ein **Dorf mit Sensen-Bürgerwehr** (Weidenau), dort Sensen kaufen. **Zweiwaffen** nur Schurke, Assassine, Berserker. **Schilde:** Turmschild, Buckler, Stachelschild, Magitech-Schild. **Je Boss eine eigene Legendäre.**
- **Elite-Mini-Bosse:** mindestens 30 mit eigenem Aussehen und Beute für Kopfgeld-Aufträge (gebaut: 32).

## 6. Koop (K2)

Der Netzwerk-Koop ist als eigenes Paket geplant: `docs/PLAN_COOP.md`. Reihenfolge laut Nutzer: P2 läuft parallel durch einen Opus-Agenten, K2 baut die Hauptsitzung. K1 (Couch-Koop) entfällt.
