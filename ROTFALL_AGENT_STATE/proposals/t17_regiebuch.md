# T17 — Regiebuch und Boss-Intros (D1 + D15 = §5g.5), Vorlauf für T20

FROM: Darstellung (Agent 8, Fable 5.1, Hoch) · TO: Lead / Implementation Engineer · 01.10.2026
Status: **DESIGNING → bereit für die Umsetzung von Scheibe 1**, sobald die drei Fragen am Ende beantwortet sind (bis dahin gelten die Empfehlungen).
Kennzeichnung: **FACT** (Datei:Zeile, selbst gelesen) · **FACT (TASKS)** (aus `docs/audit/TASKS.md`, nicht selbst gemessen) · **PROPOSAL** · **ASSUMPTION**.
Kein Code in `src/` oder `docs/` wurde geändert. Alles hier ist Spezifikation.

---

## 0. Kurzfassung

Es gibt heute **eine** Szenenmaschine (`cinematic(shots)`, FACT game.js:8948–8984) mit Kamera, Zoom, Fokus, Balken, Text, Abblende, ESC. Was fehlt, ist alles, was eine Szene von einer Diashow unterscheidet: **Figuren, die etwas tun, eine Zeitachse innerhalb einer Einstellung, Klang, Licht, Sprechblasen, ein Live-Modus ohne Teleport**. Das Regiebuch ergänzt genau das als Datenfelder am bestehenden Shot (`cast`, `beats`, `card`, `live`) plus eine Handvoll kleiner Funktionen — keine neue Engine. Darauf: Boss-Intros (einmal je Held), der Goblinsturm, der Fall Varonheims, Ankunfts-Karten für Städte und zwei Alltagsszenen.

---

## 1. Inventar: Was es heute gibt und wie gut es ist

### 1.1 Die Maschine (FACT)

| Baustein | Ort | Was es tut |
|---|---|---|
| `cinematic(shots, done)` | game.js:8948 | setzt `S.cine`, Spieler wird `cineGhost` (unsichtbar render.js:751, nicht angreifbar 3843, Steuerung aus 2887, kein Prompt 4680), Balken an, erster Shot |
| Shot-Felder | 8959–8970 | `x, y, map` (Teleport des Geists per `cineMove` 8954), `dur` (Standard 3000), `text`, `setup()` (einmal), `tick(dt, t)`, `to` (sanfte Fahrt, smoothstep 8969), `zoom`, `focus` (Figur-id oder Punkt, camAim 8928–8934) |
| Kamera | camAim 8928; update 2409–2416 | Zoom-Lerp dt/450 auf `R.cam.cineZ`; Kameraposition folgt in dt/120; `camShake` 2705 (achtet `settings.motion`) |
| Balken + Text | cineBars 8977–8984 | 11 vh oben, 13 vh unten, Text **Georgia 16 px**, ESC-Hinweis, `cineFade` (Abblende 650/900 ms, 8966) |
| Skip | 13827 | ESC/Leertaste → `cineEnd`; **übersprungene `setup()` laufen nach** (8973), damit Folgen nie verloren gehen |
| Speichern | state.js:216, SKIP 144 | während `S.cine` kein Save; `cine`/`dying` werden nie gespeichert |
| Koop | coop.js:389–392, 432, 533, 566 | Host sendet jeden Tick `{t:'cam', x, y, z, text}`; Gast setzt Kamera und zeigt Text — in **Spectral 18 px** in einem zweiten DOM-Element `coop-cine`. Gast-Interaktion mit dem Host ist während `S.cine` gesperrt (297) |
| Probenschutz | cineLater 8925; Probe 15619 | verzögerte Fahrten laufen nie unter `_quiet` |
| Debug | 14434–14438 | „Kamerafahrten“: Fall Vargs, Fall der Untoten, Beenden, Zoom/Fokus-Test, „Cutscene wiederholen (nur Bild)“ (`lastCine` 8946) |
| Gesten | gesture 8947; anim.js:21–23; fig5.js:187–189, 222–224 | **nur drei**: zeigen, abwehren, achsel (Mischposen in rigS/rigW) |
| Todesarten | anim.js:9–20, `animEvents` 27 | Zeitachse `ev: [{t 0–1, fx, n, dy, shake, sfx}]` — das ist das Schema, das `beats` übernimmt |
| Effekte | fx 3765 (Typen u. a. blood, spark, heal, dust, fire, frost, necro, ghost, bone, shock); float 3774 (`big`) | Partikel und Schwebetext |
| Klang | sfx.js:38–65 | swing, hit, crit, break, bone, metal, dodge, step, death, **bell**, bow, magic, fire, heal, ui, whistle, growl, rattle, moan, shriek, shout; `duck(level, ms)` 71; **kein `horn`** |
| Licht | render.js ambient 2353, drawLight 2389, staticLights 2367 (3-s-Cache), Fackel-Periode 690 ms (887) | kein Hebel für Szenen (keine Verdunkelung, kein Flackern auf Befehl) |
| Schriften | index.html:9 | Cinzel 500/700 und Spectral sind geladen — Namenskarten brauchen keinen neuen Font |

Nicht vorhanden (FACT, grep ohne Treffer): `S.flags.introSeen`, `R.prefetchAt`, ein Ereignis „Stadt zum ersten Mal betreten“, eine Galgen-Szene (nur der Galgenbaum als Bild, render.js:1538, und „Hinrichten“ bei Gefangenen 13076), Sprechblasen (nur `float`, 900 ms).

### 1.2 Die Szenen (Bewertung: **Diashow** = Figuren stehen, Text trägt alles · **Szene** = Kamera, Spiel, Timing, Umgebung, Klang)

| # | Szene | Ort | Was passiert | Urteil | Warum |
|---|---|---|---|---|---|
| 1 | Fall Vargs | vargCinematic 8986–9010 | 5–6 Shots 3–5,5 s; `setup` spawnt Prügelei Goblins ↔ Paladine, Floats „Frei!“, Dorfbrand, Flüchtlinge | **Diashow+** | Die Prügelei ist echtes Spiel im Bild — die beste Szene. Aber: kein Klang, keine Kamerabewegung außer einer Fahrt, Text erklärt, was man sehen sollte |
| 2 | Fall der Untoten | 9012–9023 | 5 Shots, Soldaten jagen Tote am Knochentor, Heimkehrer | **Diashow+** | wie 1 |
| 3 | Ende der Brüder | twinFallCinematic 8533 | 3 Shots leere Orte | **Diashow** | nur Text und Orte |
| 4 | Eiserne Legion | legionArrives 8513 | 1 Shot 3,6 s, vorher `sfx('metal')` + Shake | **Diashow** | Legion steht schon da, wenn die Kamera hinschaut |
| 5 | Teleportkreis | 6624 | 1 Shot, heal-fx, Shake | Diashow (okay, 2 s) | — |
| 6 | Hoher Rat | councilSession 9194, councilDecide 9207 | 2 + n Shots; Abstimmung: ein 850-ms-Shot je Stimme mit JA/NEIN-Float | **Szene (klein)** | Timing und Figuren tragen; kein Klang, kein Spiel |
| 7 | Hofszene Siegel | cultCourt 12803–12811 | 3 Shots, Blut-fx, Shake, Kanzler verschwindet | **Diashow+** | gute Beats im Text („Kerzen verlöschen“), aber nichts davon passiert im Bild |
| 8 | Aldhelm-Intro | aldhelmAI 12826–12829 | 3 Shots 6,6 s, Teleport der Kamera in die Krypta, Shake + Blut | **Diashow** | einziges Boss-Intro per Kamerafahrt; `C.introSeen` liegt in `S.cult` → einmal je Spielstand, nicht je Held |
| 9 | Boss-Starts Garmadon 8546, Omega 8704, Weißbart 7660, Varg 8435, Dodon 7588, Gorak 4210 (Phase), Hrodvar — | — | Toast in Großbuchstaben + Shake + Log | **Namensschild** | Hrodvar hat gar nichts (spawnt stumm, 1837) |
| 10 | Goblinsturm | goblinStorm 7600–7609 | spawnt 12 Goblins + Dodon **neben Varg**, Shake, Toast, Chronik; Sieg löscht Überlebende (7613), Fall löscht alles ohne Gräber (7620) | **Spawn und Löschen** | FACT (TASKS T20) |
| 11 | Aufstand Eisenfeste | revoltStart 10073 / revoltWon 10100 | `afterSay` (Log + Chronik + Toast, 9948) | **Text** | — |
| 12 | Fall einer Aurelion-Stadt | aurelFall 10195–10214 | Besatzung, Trümmer, Flüchtlinge, `afterSay` | **Text mit Weltfolgen** | Die Folgen sind sichtbar, die Nachricht nicht |
| 13 | Musterung | startMuster 5836–5843 | Kriegsmeister, Reihe Soldaten, Proviantwagen vor dem Kettentor; Log + Chronik | **Weltsimulation ohne Blick** | passiert, ob man hinsieht oder nicht — gut; nur kein Auftakt |
| 14 | Heldentod (T10) | playerDeath 13493–13495, 2144, 2341, 8936, 3860 | 3 s Zeitlupe ×0,25, Zoom 1,4, `duck(0,2)`, Glocke, Namenskarte, Mörder bleibt stehen und **zeigt** | **Szene** | der Maßstab im Spiel: kein Teleport, Welt läuft, ein Klang, eine Geste, ein Satz |
| 15 | Schlaf | ui.js:488 sleepFade | Abblende mit Mond | Szene (klein) | — |

Befund: Der Heldentod zeigt, dass die Zutaten da sind (Zeitlupe, Zoom, Duck, Geste, Karte). Alle anderen Szenen nutzen sie nicht. FACT (TASKS T17): Schnitt zwischen Shots friert ~426 ms (Kartenwechsel baut Chunks neu; selbst nicht gemessen), zwei Textsysteme (Georgia/Spectral).

---

## 2. Das Regiebuch (PROPOSAL)

### 2.1 Grundsatz

Keine neue Engine. Das Regiebuch ist **(a)** vier neue Shot-Felder, **(b)** ein Beat-Dispatcher in `cineTick`, **(c)** ein Live-Modus ohne Geist und **(d)** eine Szenentabelle `SCENES` plus `playScene(key, ctx)`. Alles andere (`S.cine`, ESC, Koop-Kamera, Save-Sperre, Debug-Wiederholung) bleibt.

### 2.2 Shot-Format (erweitert)

```js
{
  // wie heute
  map, x, y, to, dur, zoom, focus, text, setup, tick,
  // neu
  cast: [ { sel, n, at, to, speed, face, pose, say, ms } ],   // Figuren der Einstellung
  beats: [ { t, ...Aktion } ],                                   // Zeitachse 0–1 wie ANIM_DEFS.death.ev
  card: { title, sub, ms },                                      // Namenskarte (Cinzel), optional
  hold: ms,                                                      // mindestens so lange stehen, auch wenn beats fertig sind
  light: { amb: ±0.0–0.4, flicker: 0–1 },                        // Lichtüberschreibung nur für diesen Shot
}
```

**`cast`-Einträge** (werden in `cineNext` aufgelöst, FACT Anker 8962):
- `sel`: `'player'` · `'party'` · `'id:<uid>'` · `'mtype:<key>'` · `'flag:<feld>'` (z. B. `flag:varonKing`, `flag:court`) · `'near:<r>'` (alle NPC/Gegner im Umkreis des Shot-Punkts) · `'spawn:<mtype|guardKit>'` (transient, `cineCast: true`, am Shot-Ende entfernt, außer `keep: true`).
- `n`: höchstens so viele. `at`: Startpunkt (`{x,y}` oder relativ `{dx,dy}` zum Shot-Punkt). `to`: Ziel; die Figur läuft mit `speed` (Standard 1,0 = ihre normale Geschwindigkeit) auf geradem Weg (keine Wegsuche — Szenenorte werden so gewählt, dass die Gerade frei ist; ASSUMPTION: reicht für alle Szenen in §3; sonst `freeSpotNear`-Zwischenpunkte).
- `face`: `'player'|'id:…'|{x,y}|'N|E|S|W'` setzt Blickrichtung. `pose`: Geste aus `ANIM_DEFS.gesture` für `ms`. `say`: Sprechblase (2.6).

**`beats`** — Aktionen (eine Zeile je Beat, mehrere Felder = gleichzeitig; das ist „parallel“):

| Feld | Wirkung | Technik (FACT-Anker) |
|---|---|---|
| `fx: type, n, at` | Partikel an Figur (`at: sel`) oder Punkt | `fx()` 3765 |
| `sfx: name, w, vol` | Klang | sfx.js:33 |
| `duck: level, ms` | alles leiser/lauter | sfx.js:71 |
| `shake: amount, ms` | Kamerabeben | 2705 |
| `flash: color, ms` | kurzer Vollbild-Blitz (weiß, rot, schwarz) | `cineFade`-Element 8981 mit `background`-Farbe und `animate` |
| `zoom: z, ms` | Zoom innerhalb des Shots ändern | setzt `shot.zoom`, camAim lerpt (8931) — `ms` steuert den Teiler statt fest 450 |
| `cam: sel\|{x,y}, ms` | Kamerafokus wechseln ohne Schnitt | setzt `shot.focus` |
| `gesture: g, ms, who: sel, toward: sel` | Geste | 8947 |
| `walk: who, to, speed` | Figur läuft los (wie `cast.to`, aber zeitversetzt) | neuer `cineCastTick` |
| `face: who, dir` | drehen | `e.aim`/`e.dir` (ASSUMPTION: Richtung wird aus `aim` oder `vx/vy` gelesen — Engineer prüft `drawHumanoid`) |
| `say: who, text, ms` | Sprechblase | 2.6 |
| `float: who, text, color, big` | Schwebetext | 3774 |
| `text: str` | Untertitel wechseln | `sceneText()` 2.5 |
| `card: {title, sub, ms}` | Namenskarte einblenden | 2.5 |
| `light: {amb, flicker}` | Licht ab jetzt | `R.cineLight` in `ambient()` 2353 addieren; `flicker` moduliert die Fackelstempel-Alpha in drawLight |
| `prop: id\|label, set: {type, label}` | Requisite ändern (Tor → `rubble`) | wie morrFall 7622 |
| `spawn: mtype, at, n, opts` | Gegner/NPC erzeugen (transient) | spawnEnemy 1677 / guardChar; markiert `cineCast` |
| `do: fn` | Spielfolge (Flags, Chronik, Fraktion) — **muss idempotent sein** | wie heute `setup` |
| `wait: ms` | nichts tun, nur Beat-Zeit — für `hold`-artige Pausen innerhalb der Zeitachse | — |
| `must: true` | Beat ist Folge, nicht Schmuck: läuft auch beim Überspringen | 2.4 |

**Feuern:** `cineTick` ruft `animEvents(shot, t0, t1)` (anim.js:27 funktioniert mit jedem Objekt, das `ev` hat — Engineer übergibt `{ ev: shot.beats }`) und markiert jeden Beat `fired`. Ein Beat feuert genau einmal (TASKS-Test).

### 2.3 Zwei Modi

| | **Schnittszene** (`live: false`, heute) | **Live-Szene** (`live: true`, neu — Boss-Intros, Ankunft, Alltag) |
|---|---|---|
| Spieler | Geist, teleportiert, Steuerung aus | bleibt, **Steuerung bleibt**, kann sterben |
| Kamera | frei, Teleport per Shot | nur `focus`/`zoom` zwischen Spieler und Ziel (Mittelpunkt wie beim Heldentod 8937), kein Kartenwechsel |
| Balken | ja (11/13 vh) | **dünne** Balken 4 vh, die ein-/ausfahren (CSS `transform`), oder keine (`bars: false`) |
| Text | Untertitel unten | nur `card` und Sprechblasen |
| Welt | läuft weiter (FACT: `cinematic` pausiert nicht; update 2345) | läuft weiter; Boss greift an (TASKS) |
| Skip | ESC/Leer | **kein Skip nötig** (≤ 3 s), ESC beendet trotzdem |
| Save | gesperrt (state.js:216) | gesperrt — bei ≤ 3 s unkritisch |
| Koop | Gast sieht Kamera + Text | Gast sieht nur Karte und Blasen, seine Kamera bleibt bei ihm (`cam`-Nachricht trägt `live: 1`, Gast ignoriert x/y/z) |

Umsetzung Live: `cinematic(shots, done, { live: true })` setzt `S.cine.live = true`, überspringt `cineGhost`, `cineMove`, `cineBars(true)` und die Rückstellung in `cineEnd`. Die vier Sperren müssen `live` kennen: 2887 (Steuerung), 4680 (Prompt), coop.js:297 („beschäftigt“) — und camAim 8930 nimmt bei `live` den Mittelpunkt Spieler↔Fokus statt den Fokus allein.

**Gefährten in Schnittszenen (Risiko, ASSUMPTION):** `cineMove` bewegt nur den Spieler; die Gruppe bleibt am Ort und kann während 20 s Fall-Varonheims angegriffen werden. EMPFEHLUNG: in `hit`/`hurt` die Regel aus 3339 (`S.dying` schützt die Gruppe) auf `S.cine && !S.cine.live` ausdehnen.

### 2.4 Überspringen (ESC) — Regel

Beim Skip laufen alle noch nicht gefeuerten Beats **in Reihenfolge** mit `S.cine.skipping = true`: `do`/`prop`/`spawn`/`must`-Beats wirken, alles Kosmetische (`fx, sfx, duck, shake, flash, zoom, cam, gesture, walk, say, float, text, card, light`) wird nur als `fired` markiert. `cast`-Figuren springen ans Ziel (`to`) bzw. werden entfernt (`spawn` ohne `keep`). Das verallgemeinert die heutige Regel „übersprungene setup laufen nach“ (8973). Ergebnis: ein Skip hinterlässt denselben Spielzustand wie das Ansehen, nur ohne Bild und Ton.

### 2.5 Eine Textfunktion, Karten, Balken

- `sceneText(str)` ersetzt `cineBars(…, text)` **und** coop `showCineText` (coop.js:566): ein Element `#cineText`, **Spectral 18 px**, ein- und ausblenden (bestehende `animate`-Zeile 8966). Der Gast ruft dieselbe Funktion (coop.js importiert sie aus ui.js oder bekommt sie über `A`).
- `nameCard(title, sub, ms)`: mittig, **Cinzel 700 28 px** (`title`), darunter Spectral 14 px kursiv (`sub`), Einblenden 250 ms, Halten, Ausblenden 400 ms; nie zwei zugleich (die neue ersetzt die alte). Ersetzt die Großbuchstaben-Toasts bei Boss-Starts (8546, 8704, 7660, 8435, 7588) — der Toast bleibt für alles andere.
- Balken: `cineBars(on, { thin })` — statt `display: block/none` eine `transform: translateY` mit 300 ms Übergang (TASKS: „Balken fahren ein/aus“).

### 2.6 Sprechblase statt Modal (`bubble`)

Neuer Eintrag in `S.floats` mit `bubble: true, life: ms (Standard 2600), who: id` — render.js zeichnet ihn als dunkle Box mit heller Schrift über der Figur (folgt ihr, weil `who` statt fester Position; FACT: Floats sind heute positionsfest 3775). Max. 60 Zeichen, sonst zwei Blasen nacheinander. Nutzung: nur in Szenen und bei Boss-Phasen (`m.name: „…“`-Logzeilen wie 4287, 12838 bekommen zusätzlich eine Blase). Gespräche mit Wahl bleiben `UI.dialogue`.

### 2.7 Namenskarte, Boss-Intro, einmal je Held

```js
function bossIntro(e) {
  if (S._quiet || S.cine || !SCENES['boss_' + e.mtype]) return false;
  const seen = (S.flags.introSeen ||= {});
  if (seen[e.mtype] === S.legacy.gen) return false;           // einmal je Held: Generation statt Reset
  seen[e.mtype] = S.legacy.gen;
  return playScene('boss_' + e.mtype, { e });
}
```
`introSeen[mtype] = gen` löst den D15-Widerspruch ohne Rücksetzen in `chooseSuccessor` (13629/13654): der Erbe (neue `gen`) sieht das Intro erneut, derselbe Held nie zweimal. Altes Save ohne Feld → `||= {}`.

**Auslöser je Boss (FACT-Anker):** Varg: `vargParley` Herausforderung 8433 **und** erster Treffer 3352 (wer ohne Reden angreift) · Garmadon: `garmadonFight` 8541 · Omega: `omegaFight` 8704 · Weißbart: 7658 · Dodon: `morrTurnHostile` 7585 · Gorak: erster Sichtkontakt (`d < 320 && tgt === player`, wie Aldhelm 12826) in `bossAI` 4205 · Hrodvar: ebenso in `frostKingAI` 4261 · Aldhelm: bestehende Stelle 12826, Kamerafahrt durch Live-Intro ersetzt, `C.introSeen` → `S.flags.introSeen.aldhelm`.

### 2.8 `playScene(key, ctx)` und `SCENES`

```js
const SCENES = {
  boss_chain_master: ctx => ({ live: true, shots: [ … ] }),
  goblin_storm:      ctx => ({ shots: [ … ], done: () => … }),
  capital_fell:      ctx => …,
  …
};
function playScene(key, ctx = {}) {
  if (S._quiet) return false;                                // Proben: nie
  const def = SCENES[key]?.(ctx); if (!def || !def.shots?.length) return false;
  if (S.cine) { cineLater(() => playScene(key, ctx), 1000); return true; }   // nach einer laufenden (Muster 8530)
  lastScene = { key, ctx };                                  // Debug „Szene wiederholen“ — mit Folgen, anders als lastCine
  return cinematic(def.shots, def.done, { live: def.live, key });
}
```
Die Szenen liegen als Funktionen in game.js neben ihren Auslösern (Inhalt in data.js wäre Stilbruch: Szenen brauchen `S`, `byId`, `TOWN_PLAN`). Reine Tabellen (Boss-Karten: Titel, Untertitel, Klang, Farbe) gehören nach data.js: `BOSS_CARDS = { chain_master: { title: 'VARG', sub: 'Kettenmeister der Eisenmark', sfx: 'metal', fx: 'spark' }, … }`.

### 2.9 Schnitt ohne Freeze

ASSUMPTION (TASKS nennt 426 ms): Der Freeze entsteht, weil `cineMove` die Karte wechselt oder weit springt und die Chunk-Caches des Renderers kalt sind. PROPOSAL (TASKS-Anforderung): `R.prefetchAt(map, x, y)` baut die Chunks um den Punkt in Leerlauf-Häppchen (≤ 4 ms je Frame, `requestIdleCallback`-frei: einfach in `cineTick`), `SP.warm(spec)` (FACT render.js:1738) für alle `cast`-Specs des nächsten Shots. `cineNext` schneidet erst, wenn die Vorbau-Warteschlange leer ist **oder** 300 ms um sind; die Abblende (`cineFade`, 650 ms) deckt den Rest. Messung: Debug-Eintrag „Schnitt messen“ loggt `performance.now()`-Differenz um `cineNext`; Ziel < 60 ms.

### 2.10 Neue Gesten (anim.js + fig5.js)

TASKS: **jubeln** (beide Arme hoch, 900 ms, Hüpfer `by`), **knien** (ein Knie, 1400 ms, Oberkörper tief), **trauern** (Hände vors Gesicht, Kopf gesenkt, 1600 ms), **salutieren** (Faust auf die Brust, 800 ms). Dazu für §3 nützlich: **winken** (ein Arm, 1000 ms) und **ducken** (Kopf einziehen, 500 ms — Hof weicht vor dem Boss). Jede Geste = eine `case`-Zeile in `rigS` und `rigW` (Muster fig5.js:187–189 und 222–224). Dodon/Gorak/Automaten nutzen `monsterSpec` — ASSUMPTION: Gesten wirken nur auf menschenähnliche Rigs; bei Monstern ersetzt `float`/`shake`/`fx` die Geste.

### 2.11 Neue Klänge (sfx.js)

`horn` (Knochenhorn: Sägezahn 110→98 Hz, 1,1 s, zwei Stöße — T20), `chains` (3–4 `metal`-Stöße im Abstand 90 ms, tiefer), `drum` (Pauke: Sinus 70→40 Hz + Rauschstoß, für Hinrichtung/Musterung), `crowd` (Stimmengemurmel = Bandpass-Rauschen 420 Hz, 1,5 s — existiert als Ambiente-Schnipsel 124, wird Funktion), `crack` (Eis/Holz bricht: `bone` höher + `break`), `heartbeat` (zwei Sinusschläge 55 Hz, 0,12 s Abstand — Garmadon). Alle synthetisch, Muster sfx.js:38–65.

### 2.12 Koop

Host spielt, Gast sieht mit (FACT-Grundlage coop.js:389/432/533). Erweiterung der `cam`-Nachricht: `{ t:'cam', x, y, z, text, card, live, sfx }` — `card` und `text` nur, wenn sie sich geändert haben; `sfx` ist der zuletzt gefeuerte Klangname (Gast spielt ihn einmal lokal). Gesten und Läufe der Darsteller kommen über die normalen Entity-Deltas (ASSUMPTION: `e.act` ist Teil des Deltas — Engineer prüft; sonst `act` ins Delta aufnehmen). Live-Intros: Gast bekommt Karte und Blasen, behält seine Kamera. Gast nahe am Boss löst **kein** eigenes Intro aus (nur Host; `introSeen` ist Host-Zustand).

### 2.13 Einbauorte (alle FACT)

| Was | Wo |
|---|---|
| Shot-Felder, `live`, `skipping` | `cinematic` 8948, `cineNext` 8959, `cineTick` 8968, `cineEnd` 8971 |
| Live-Ausnahmen | 2887, 4680, camAim 8930, coop.js:297 |
| `sceneText`, `nameCard`, dünne Balken | `cineBars` 8977 → ui.js (Export), coop.js:566 löschen |
| Sprechblase | `float` 3774 (Feld `bubble`), render.js Float-Zeichner (Ort vom Engineer: dort, wo `S.floats` gemalt wird) |
| Licht | render.js `ambient` 2353 (`+ (R.cineLight?.amb || 0)`), `drawLight` 2389 (Flicker) |
| `bossIntro` | 8433, 3352, 8541, 8704, 7658, 7585, 4205, 4261, 12826 |
| `BOSS_CARDS` | data.js nach `ELITES` |
| Gesten | anim.js:21, fig5.js:187/222 |
| Klänge | sfx.js:38–65 |
| Debug | 14434 „Kamerafahrten“ → „Regie“: jede `SCENES`-Szene als Knopf, „Szene wiederholen (mit Folgen)“, „Boss-Intro zurücksetzen (dieser Held)“, „Schnitt messen“, „Live-Modus an/aus“ |
| Save-Felder | `S.flags.introSeen`, `S.flags.seenTowns` (beide fehlen in alten Ständen → `||= {}`) |
| Doku | `docs/MECHANIKEN.md` Abschnitt „Zwischensequenzen“: ESC überspringt, Folgen bleiben, Boss-Intros einmal je Held, Koop |

---

## 3. Szenenliste (priorisiert)

Format: **Ort/Auslöser · Modus · Dauer · Aufwand** · Beat-Sheet (Zeit → Kamera · Spiel · Klang · Effekt).
Längen der Boss-Intros folgen Empfehlung Frage 2 (2,0–3,0 s). Bei Schnittszenen gilt immer: ESC, Folgen laufen nach.

### 3.1 Boss-Intro **Varg, Kettenmeister** — Prio 1 (Scheibe 1, Beweis Live-Modus)
Auslöser 8433/3352 · live · 2,6 s · **S**
| t | Beat |
|---|---|
| 0,00 | `card` „VARG“ / „Kettenmeister der Eisenmark“ · `zoom 1,3 / 500 ms` auf Mittelpunkt Spieler↔Varg · `sfx chains` · `duck 0,5 / 300` |
| 0,10 | Hof (`flag:court`, n 6): `gesture ducken`, `face` zu Varg · `light flicker 0,6` (Fackeln zucken) |
| 0,30 | Varg: `gesture zeigen` → Spieler · `say` „Dann wird deine Kette die schwerste in dieser Halle.“ (ersetzt Log 8435, Log bleibt) |
| 0,55 | `fx spark n 8` an Vargs Waffe · `sfx metal w 1` |
| 0,80 | `shake 4 / 250` (erster Schritt) · `duck 1 / 400` · Karte aus |
| 1,00 | Ende; falls `S.flags.goblinStorm`: `playScene('goblin_storm')` direkt im Anschluss (3.6) |

### 3.2 Boss-Intro **Hrodvar, König unter dem Eis** — Prio 1 (Scheibe 2)
Auslöser `frostKingAI` 4261, erster Sichtkontakt `d < 320` · live · 2,8 s · **S**
| t | Beat |
|---|---|
| 0,00 | `light amb +0,15` (Saal wird kälter) · `sfx crack` · `fx frost n 14` am Thron |
| 0,15 | `zoom 1,25 / 600` · `card` „HRODVAR“ / „König unter dem Eis“ |
| 0,30 | Hrodvar: `face` Spieler · `gesture zeigen` · `say` „Der Stern fiel. Wir gruben ihm entgegen.“ (aus 8578) |
| 0,55 | `shock`-Ring (wie 4266, `ice: true`) ohne Schaden · `shake 5 / 300` · `sfx bone` |
| 0,80 | `light amb 0` zurück · Karte aus |

### 3.3 Boss-Intro **König Garmadon** — Prio 1 (Scheibe 2)
Auslöser `garmadonFight` 8541 · live · 3,0 s · **S–M**
| t | Beat |
|---|---|
| 0,00 | `duck 0,25 / 200` · `sfx heartbeat` · `shake 2 / 120` · `zoom 1,3 / 700` auf Thron |
| 0,20 | `sfx heartbeat` · `shake 2 / 120` · Hof (`flag:gCourt`): `gesture knien` → dann aufstehen (Phase 2 bleibt wie 4078) |
| 0,40 | `card` „KÖNIG GARMADON“ / „Herr der Toten“ · `fx bone n 12` an der Treppe · `say` „Gut. Ich war lange nicht mehr müde.“ (bei `why === 'challenge'`, sonst „Erhebt euch.“) |
| 0,65 | `sfx heartbeat` · `shake 3 / 150` · `light amb +0,1` |
| 0,85 | `duck 1 / 500` · Karte aus; `legionArrives` (8547) bleibt mit `cineLater 2600` und wird Schnittszene 3.10 |

### 3.4 Boss-Intro **Aldhelm, Blutfürst** — Prio 1 (Scheibe 2, Umbau der einzigen Kamerafahrt)
Auslöser 12826 (Kamerafahrt ersetzen) · live · 3,0 s · **S** (Text existiert)
| t | Beat |
|---|---|
| 0,00 | `light amb +0,2` · `sfx shout w 0,3 vol 0,4` fern · `zoom 1,2 / 600` |
| 0,10–0,60 | sechs Beats im Abstand 0,1: je ein `fx fire n 3` an den `candles`-Requisiten der Krypta (`near: 300`, `prop.type === 'candles'`), `sfx ui` leise — die Kerzen gehen eine nach der anderen an |
| 0,45 | `say` „Der König unterschreibt alles, was ich ihm hinlege. Heute unterschreibst du.“ |
| 0,70 | `card` „ALDHELM“ / „Blutfürst von Varonheim“ · `fx blood n 14` · `shake 4 / 300` (heute 12829) |
| 0,90 | `light amb 0` · Karte aus |
Weitere Bosse als Kurzform (**S** je Boss, Scheibe 2): **Dodon** (Brüllen `shout` + `shake 8`, Goblins aus den Hütten `walk`, Karte „DODON · Hüter von Morrgrund“), **Gorak** (Hieb auf den Boden `shock` + `dust`, `growl`), **Weißbart** (Stuhl knarrt `break`, Mannschaft `gesture jubeln`, Kette um die Fäuste `chains`), **Omega** (Riss leuchtet `fx ghost`, `duck 0,2`, `flash` weiß 120 ms, Karte „OMEGA · der Gefallene“).

### 3.5 **Der Fall Varonheims** (drei Szenen, S2 der Belagerung) — Prio 1, erst wenn `H.capitalFell` existiert
FACT: Hooks sind im Proposal `varonheim_belagerung.md:252` benannt (`H.capitalFell`, `H.siegeSay`), in `sim.js` noch nicht vorhanden (grep ohne Treffer); `H.capitalFell` ruft laut Proposal :315 vorerst den `aurelFall`-Kern. Stadt: `CAPITAL` world.js:1357 (x 475, y 147, hw 35, hh 23). Exil: Salzhafen (DESIGN_DECISIONS).

**(a) „Die Toten marschieren auf Varonheim“** — Auslöser Zähler ≥ 20 (Proposal :72) · Schnitt · 1 Shot 4,5 s · **S**: Kamera auf das Heer am Startknoten (`S.war.armies`, Position des Heers → Tile), `spawn` 8 Tote transient marschierend nach Westen (`walk`), `sfx moan` + `rattle`, `light amb +0,1`, Untertitel „Morvath sammelt die Knochen. Sie marschieren auf Varonheim.“; `do must`: Chronik (wie heute).
**(b) „Varonheim wird belagert“** — erster Tag `node.siege` (:86) · Schnitt · 2 Shots 7 s · **S–M**: Shot 1 Mauer Nord (Punkt aus `CAPITAL`), `spawn` 6 Tote + 1 `flesh_golem` vor der Mauer, Wachen auf der Mauer `gesture zeigen`, `sfx horn` (Alarm der Stadt), `shake 3`; Shot 2 Platz: Bürger `walk` in die Häuser, `say` eines Wächters „Tore zu! Jeder Mann auf die Mauer!“, Karte „VARONHEIM WIRD BELAGERT“.
**(c) „Varonheim ist gefallen“** — `H.capitalFell` · Schnitt · 5 Shots ≈ 20 s · **L**
| Shot | dur | Beats |
|---|---|---|
| 1 Burgtor | 4000 | `sfx bell` ×3 (t 0, 0,3, 0,6) mit `duck 0,4` · `fx fire n 20` am Tor, `prop` Tor → `rubble` bei 0,5 mit `shake 8 / 500` · `light amb +0,15, flicker 0,8` · Untertitel „Das Burgtor hält nicht.“ |
| 2 Hof | 5000 | `cast`: `flag:varonKing`, `flag:varonMarshal` (Brandt), `flag:varonSpy` (Ysmay), Hagen (`flag:…` — Engineer prüft Feld) laufen vom Thron zum Nordtor (`walk speed 1,2`) · Brandt `say` „Majestät. Jetzt.“ · `spawn` 6 Tote hinter ihnen `pursue` · `sfx chains` + `moan` |
| 3 Stadttor Nord | 4500 | Kolonne läuft hinaus, `gesture winken` eines Wächters, der bleibt · `spawn` 3 Flüchtlinge mit `anchor` Salzhafen (`SIM.H.spawnRefugee` 1914) · `fx dust` · `say` Ysmay „Nicht umsehen.“ |
| 4 Varonheim Totale | 3500 | `zoom 0,8` · `light amb +0,25` · `fx fire` an 4 Häusern · Untertitel „Varonheim ist gefallen.“ · Karte „VARONHEIM IST GEFALLEN“ · `do must`: `aurelFall`-Kern, `S.after.capital = {…}` (Proposal :133), `afterSay` ohne Toast |
| 5 Salzhafen Hafen | 4000 | Kolonne erscheint am Kai (`spawn:` Exilhof-Figuren, `keep: true` — oder `ensureExileCourt()` aus S2 im `do must`) · Varon `gesture trauern`, Brandt `gesture salutieren` zu ihm · `sfx coast`-Böe (Ambiente) · Untertitel „Salzhafen. Ein König ohne Stadt.“ |
Danach `done`: `log` + Hinweis auf Rückeroberung. Bei `_quiet` oder wenn der Spieler im Kerker/Koop-Gast: nur `afterSay`.

### 3.6 **Goblinsturm — Aufbruch** (T20 Teil 1) — Prio 1 (Scheibe 1, Beweis Schnittszene)
Auslöser `goblinStorm(v)` 7600 (statt Spawn neben Varg) · Schnitt · 4 Shots ≈ 9 s · **M**
| Shot | dur | Beats |
|---|---|---|
| 1 Kettentor außen (`gateOf('kettenfeste')`) | 2200 | `sfx horn` (t 0 und 0,5) · `duck 0,6` · `fx dust n 10` · Untertitel „Hörner aus Knochen.“ |
| 2 Tor | 2600 | 0,2 `shake 8 / 600`, `prop` Tor → `rubble` („Zerschlagenes Kettentor“), `sfx break` + `crit` · 0,3 Dodon (`mtype:dodon`, `at` vor dem Tor) `walk` durch das Tor Richtung Halle `speed 1,1` · 0,5 `spawn goblin/goblin_warrior` ×12 am Tor (`goblinStorm: true, transient`, Namen „Krieger von Morrgrund“), `walk` hinter Dodon, Floats „Frei!“ (3 Stück, 0,6–0,9) |
| 3 Halle, Varg | 2000 | `cam` Varg · Hof `gesture abwehren` · Varg `say` „Dann sterbt alle.“ · `sfx chains` |
| 4 zurück zum Spieler | 1800 | `zoom 1,1 → 1,0` · Karte „DER STURM VON MORRGRUND“ · `do must`: Flags 7601, `aggroId` aller Sturmgoblins auf Varg, `aiState pursue`, Chronik 7608 |
Die Goblins kommen also wirklich **vom Tor** in die Halle (Laufweg ASSUMPTION frei; sonst `freeSpotNear`-Zwischenpunkt am Hallentor). Wer ESC drückt: Goblins stehen am Ziel, Tor ist Trümmer, Flags gesetzt.
**Teil 2 Sieg** (`goblinStormWon` 7610, Scheibe 4, **M**): Live 3 s — Überlebende `gesture jubeln`, Dodon `say` „Morrgrund singt.“, dann `g.stormHome = true` und Heimweg zu Fuß (T20-Anforderung), Entfernen bei Ankunft, Fest (`festTick`). **Teil 3 Niederlage** (`morrFall` 7618, Scheibe 4, **M**): Gräber je gefallenem Goblin (`kind: 'grave'`), 2–3 Flüchtlinge nach Grubenhort, Schnittszene „Morrgrund brennt“ (2 Shots, `fx fire`, `light`, `trauern`) **erst nach `chooseSuccessor`** (13629), genau einmal (`S.flags.morrFallShown`).

### 3.7 **Erste Ankunft in einer Stadt** (Varonheim zuerst) — Prio 2 (Scheibe 2)
Auslöser: `townAt()` wechselt auf eine Stadt (`kind: 'city'` oder `CAPITAL`), die nicht in `S.flags.seenTowns` steht; Tick in `update` bei 2225 (dort läuft schon der Welt-Szenen-Timer) · live, `bars: false` · 3,0 s · **S–M**
| t | Beat |
|---|---|
| 0,00 | `zoom 0,85 / 900` (Stadt öffnet sich) · `sfx bell w 0 vol 0,35` nur bei Varonheim; sonst `crowd` leise |
| 0,20 | `card` Stadtname (Cinzel) / Untertitel aus `TOWN_PLAN` (Varonheim: „Hauptstadt Valens · Sitz König Varons“; Nordfurt: „Grenzstadt am Fluss · Garnison“; besetzt: „Besetzt von den Toten“ aus `S.war.nodes[k].owner` — passt zur Director-Richtung 3 „man sieht, wer eine Stadt hält“) |
| 0,45 | nächste Wache (`near: 260`, `guard`): `face` Spieler, `gesture zeigen` Richtung Platz |
| 0,70 | `zoom 1,0 / 800` zurück · `do must`: `S.flags.seenTowns[k] = S.day`, `log` „Du erreichst …“ (Muster 1893) |
Wiederholung je **Spielstand** (nicht je Held — eine Stadt kennt man als Haus). Belagert/gefallen → Untertitel wechselt, Karte spielt erneut einmalig (`seenTowns[k+':siege']`).

### 3.8 **Hinrichtung am Galgenplatz** (Alltagsszene) — Prio 3 (Scheibe 4, nach T08 VERIFIED)
Auslöser: Stadt mit Galgenbaum (render.js:1538 — ASSUMPTION: eine Requisite, der Engineer gibt ihr `gallows: true`), Spieler auf dem Platz, Spieluhr 12:00, und es gibt einen Verurteilten: ein abgelieferter Gefangener aus T08 (`S.prisoners`/Steckbrief — Feld vom T08-Stand) oder, falls keiner, ein transienter „Dieb“ (1 von 7 Tagen) · live, `bars: thin` · ≈ 12 s · **M**
| t | Beat |
|---|---|
| 0,00 | `sfx drum` ×4 (t 0, 0,08, 0,16, 0,24) · Bürger (`near: 400, villager`, n 8) `walk` in einen Halbkreis vor den Galgen |
| 0,25 | zwei Wachen führen den Verurteilten vom Kerker/Platzrand zum Galgen (`walk speed 0,8`, Verurteilter `gesture abwehren` einmal) |
| 0,45 | Herold (`prof` Wächter oder Bürgermeister) `say` „Im Namen des Königs: … wegen Raub an der Straße.“ (Grund aus dem Steckbrief) · `zoom 1,15 / 600` |
| 0,65 | `sfx break` (Falltür) · `shake 2 / 150` · Verurteilter → Leiche mit `dc: 'fall'` ohne Blut (`violence`-Einstellung greift ohnehin, 3766) · Menge: 3× `float` „…“ und zwei `gesture trauern` |
| 0,80 | Menge löst sich auf (`walk` zurück zu `anchor`) · `do must`: Steckbrief entfernt, `chronicle('Hinrichtung in …', 'crime')`, Grausamkeits-Ruf nur, wenn **der Spieler** den Gefangenen abgeliefert hat (T08-Regel) |
Der Spieler kann jederzeit weggehen (live). Hinweis für den Spieler: Logzeile am Morgen „Mittags wird am Galgen gerichtet.“

### 3.9 **Musterung vor dem Kettentor** (Alltag) — Prio 3 (Scheibe 4)
Auslöser `startMuster` 5836, **nur wenn der Spieler ≤ 900 px entfernt ist** (sonst wie heute nur Log) · live, `bars: thin` · 5 s · **S**
| t | Beat |
|---|---|
| 0,00 | `sfx horn` · Kriegsmeister (`campLead`) `say` „Antreten!“ · `zoom 0,9 / 800` |
| 0,20 | Soldaten (`camp === C.id`) `walk` in das 5er-Raster (heute stehen sie sofort dort, 5839) |
| 0,55 | alle `gesture salutieren` · `sfx metal w 0,8` · `fx dust` am Proviantwagen |
| 0,80 | Kriegsmeister `say` „Morgen marschieren wir gegen …“ (Ziel aus `C.target`) · `do must`: wie heute Log + Chronik 5842 |

### 3.10 **Umbauten bestehender Fahrten** — Prio 3 (Scheibe 4), je **S–M**
Fall Vargs 8986, Fall der Untoten 9012, Ende der Brüder 8533, Eiserne Legion 8513 (Legion **läuft** die Treppe hoch: `spawn` unten, `walk` nach oben, `sfx horn` + `metal`), Hofszene Siegel 12803 (Kerzen verlöschen wirklich: `light amb +0,3` in drei Stufen, Aldhelm `walk` zur Geheimtür und `spawn`-Entfernen, Brandt `gesture salutieren`), Hoher Rat 9194 (Stimmen mit `gesture zeigen`/`abwehren` statt nur Float). Inhalt bleibt, nur `cast`/`beats` kommen dazu — `vargCinematic` muss dasselbe Ergebnis liefern (TASKS-Test).

### 3.11 Rangfolge
1 Varg-Intro · 2 Goblinsturm Aufbruch · 3 Hrodvar · 4 Garmadon · 5 Aldhelm-Umbau · 6 Ankunft Stadt · 7 Fall Varonheims (a–c, sobald `H.capitalFell` steht) · 8 restliche Boss-Kurzintros · 9 Goblinsturm Sieg/Niederlage + Aufstand als Kolonne · 10 Musterung · 11 Hinrichtung · 12 Umbauten.

---

## 4. Scheiben

| Scheibe | Inhalt | Aufwand | Abhängigkeit |
|---|---|---|---|
| **1 Kern + Beweis** | Shot-Felder `cast/beats/card/hold/light`, Beat-Dispatcher, Skip-Regel 2.4, Live-Modus 2.3 (vier Sperren), `sceneText`/`nameCard`/dünne Balken, Sprechblase, `playScene`/`SCENES`/`lastScene`, `bossIntro` + `introSeen`, Klänge `horn`/`chains`, Gesten `ducken`/`jubeln`, Koop-Felder, Debug „Regie“, Proben P1–P4, P7; **Szenen 3.1 Varg (live) und 3.6 Goblinsturm Aufbruch (Schnitt)** | M–L | T06 (Cache) laut TASKS; T10 nur für Sturm-Niederlage (nicht in S1) |
| 2 Bosse + Ankunft | 3.2 Hrodvar, 3.3 Garmadon, 3.4 Aldhelm-Umbau, Kurzintros Dodon/Gorak/Weißbart/Omega, 3.7 Ankunft; Gesten `knien`/`trauern`/`salutieren`/`winken`, Klänge `drum`/`crack`/`heartbeat`; `R.prefetchAt` + Schnittmessung | M | S1 |
| 3 Varonheim | 3.5 a–c | M (c = L) | Belagerung S2 (`H.capitalFell`, Exilhof) |
| 4 Alltag + Umbau | 3.6 Teil 2/3, Aufstand als Kolonne (T20), 3.8 Hinrichtung (T08 VERIFIED), 3.9 Musterung, 3.10 Umbauten | M | T08, T10 |

---

## 5. Proben (headless, alle unter `sandbox()`, Karte `__a`)

- **P1 Regie-Kern:** `stage()`, zwei Shots mit `beats` bei t 0,2/0,6 (ein `do`-Beat zählt, ein `fx`-Beat zählt) und `cast` `spawn:bandit` mit `to` 120 px weiter; `cineTick(20)` bis `!S.cine`. Erwartung: jeder Beat `fired` genau einmal, Zähler = 1 je Beat, Darsteller ≤ 8 px am Ziel, danach **kein** `cineCast`-Objekt mehr in `S.ents.__a`, Spieler zurück (x0, y0), `cineGhost false`, `save()` während der Fahrt `false` (state.js:216).
- **P2 Skip:** 3 Shots; nach 10 Ticks `cineEnd()`. Erwartung: alle `do`/`must`-Beats genau einmal gefeuert, kosmetische Zähler bleiben 0, `S.cine === null`, `#cineBars` ausgeblendet, `R.cam.cineZ` nach einem `camAim` wieder 1, `JSON.stringify(saveData())` vor Start und nach Skip gleich bis auf `flags.introSeen`/`seenTowns` (Muster BUG-123-Probe 17863).
- **P3 Live/Boss:** `actor` als Gegner `chain_master` auf `__a`; `bossIntro(e)` → `true`, `S.cine.live`, Spieler hat **keinen** `cineGhost`, `e.aggroId` unverändert, Steuerung: die Sperre bei 2887 greift nicht (Probe setzt `p.vx = 1` und ruft den Bewegungsabschnitt bzw. prüft die Bedingung direkt); nach `cineTick` ≥ `dur` endet es; `S.flags.introSeen.chain_master === S.legacy.gen`; zweiter Aufruf `false`; `S._quiet = true` → `false`; `S.legacy.gen++` → wieder `true` (danach zurücksetzen).
- **P4 Save-Reinheit:** wie BUG-123/BUG-132 (17863): die Probenliste startet keine Szene (`!S.cine` am Ende), `S.flags.introSeen`/`seenTowns` werden von den Proben restauriert (`finally`).
- **P5 Koop (ASSUMPTION, Engineer prüft Hook):** mit `RF.coop.fakeGuest` eine Live-Szene starten; die `cam`-Nachricht trägt `live: 1` und `card`; Gast-Kamera (`S.coop.cam`) bleibt `null`.
- **P6 Schnitt (manuell, Debug „Schnitt messen“):** Fahrt Varg-Tor → Halle, `performance.now()` um `cineNext` < 60 ms nach Vorbau. Nicht headless; im Hunter-Bericht festhalten.
- **P7 Szenen-Lint:** für jeden `SCENES`-Schlüssel mit Attrappen-`ctx` die Shots bauen: `dur > 0`, `beats[].t` in 0..1 und aufsteigend, jeder `cast.sel` ist ein bekanntes Muster, `card.title` ≤ 24 Zeichen, Gesamtdauer Live ≤ 3500 ms (Frage 2). Rein Daten, keine Ausführung.
- **P8 Goblinsturm (T20-Tests):** nach Skip stehen 12 Sturmgoblins + Dodon in der Halle mit `aggroId` Varg, das Kettentor ist `rubble`, Flags 7601 gesetzt; Probe 15953 (FACT TASKS) auf „keine lebenden, aber Gräber“ anpassen, sobald Teil 3 gebaut ist.

---

## 6. Fragen an den Entwickler (höchstens drei)

**F1 — Überspringen:** Darf der Spieler jede Schnittszene immer mit ESC überspringen, oder erst, wenn er sie einmal gesehen hat?
EMPFEHLUNG: **immer** überspringbar (wie heute), Folgen laufen nach (2.4). Boss-Intros sind live ≤ 3 s und brauchen keinen Skip. Alternativen: (a) erst nach dem ersten Ansehen (`S.flags.sceneSeen[key]`), (b) ESC halten 600 ms statt Tippen (gegen versehentliches Wegdrücken).

**F2 — Länge der Boss-Intros:** Wie lang darf ein Boss-Auftritt sein, und darf der Boss währenddessen angreifen?
EMPFEHLUNG: **2,0–3,0 s, hart gedeckelt 3,5 s, live ohne Teleport, Boss greift an** (TASKS-Vorgabe; das Intro ist Warnung, nicht Pause). Alternativen: (a) 5 s Schnittszene mit Balken und eingefrorenem Boss (klassisch, aber Bruch mit dem Heldentod-Stil), (b) nur Namenskarte 1,2 s ohne Geste.

**F3 — Sprechblasen statt Fenster:** Sollen in Szenen Sprechblasen über den Figuren die Großbuchstaben-Toasts und Textfenster ersetzen — und sollen Weltnachrichten (`afterSay`: „X ist gefallen“) eine kurze Kamera bekommen, wenn der Spieler nahe ist?
EMPFEHLUNG: **Ja für Szenen und Boss-Phasen** (Toast bleibt für Systemmeldungen wie „GESPEICHERT“, Gespräche mit Wahl bleiben `UI.dialogue`); `afterSay` bekommt optional einen 4-s-Shot, wenn der Spieler < 900 px vom Ort ist, sonst Text wie heute. Alternativen: (a) alles wie heute, Blasen nur zusätzlich, (b) Blasen überall, auch in Gesprächen ohne Wahl.

---

## 7. Risiken und Querwirkungen

- **Welt läuft während Schnittszenen weiter** (FACT 2345): Gefährten ohne Schutz (2.3), Händlerzüge und Kriegstag laufen — bei 20 s Fall-Varonheims unkritisch, bei Ketten von Szenen (Varg → Sturm) summiert sich das. EMPFEHLUNG: Gruppenschutz wie `S.dying`.
- **RNG:** `spawn`/`pick` in Szenen ziehen vom geteilten `rnd()` (CLAUDE.md) — Szenen werden unter `_quiet` nie gestartet, Proben bleiben stabil; `vrnd` für reine Kosmetik.
- **Gesten auf Monster-Rigs** wirken nicht (2.10) — Dodon/Gorak über `shake`/`fx`/`float`.
- **Koop-Gast nahe am Boss** sieht kein Intro, bekommt aber Karte und Blase vom Host — ausreichend.
- **Alte Stände:** nur zwei neue Flag-Objekte, beide `||= {}`; Aldhelms `C.introSeen` bleibt als „gesehen“ erhalten (Migration: `if (S.cult?.introSeen) S.flags.introSeen.aldhelm = S.legacy.gen`).
- **Leistung:** ein Beat-Dispatcher je Tick ist billig; `prefetchAt` deckelt auf 4 ms/Frame.
