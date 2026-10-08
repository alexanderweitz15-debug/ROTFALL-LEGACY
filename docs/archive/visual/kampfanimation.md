# Kampfanimation — Analyse (Analyst E, 02.10.2026)

Auftrag: `ROTFALL_STATE/COMBAT_ANIM.md` (§16 „erst analysieren“), Gate: `ROTFALL_STATE/GATE.md` §1–8. **Kein Spielcode geändert.**
Bild: `ROTFALL_STATE/visual/img/kampf_ist_schwung.png` (IST-Schwung der 5 Testwaffen, echte Stil-R-Bilder, Schadenszeitpunkt rot).

STATUS: **TEILWEISE DEFINIERT** — Analyse und Architektur stehen; 6 offene Designentscheidungen (§6) müssen vor Scheibe 1 beantwortet sein.

---

## 1. IST — bestehende Systeme (mit Belegstellen)

### 1.1 Figuren und Frame-Cache
| Teil | Ort | Was es tut |
|---|---|---|
| Spec | `sprites.js humanSpec`, `SPEC_KEYS` (Z. 209), `specKey` (Z. 842) | Aussehen einer Figur; nur SPEC_KEYS zählen für den Cache |
| Stil R (Standard) | `sprites.js humanFrameR` (Z. 1287) → `fig5.js paintR` (Z. 319) | ein Bild je Spec × Richtung × Pose × Waffenzustand W; Arme sind im Bild, Hand-Koordinate `f.hand/f.off` |
| Cache-Schlüssel | `'R|'+spec+dir+pose+'|'+mode,wt,q,v,oct,two,low,pull` | q = Schwung in Zehnteln (11 Stufen), v = Hiebvariante (0–2), oct = Zielachtel (8) |
| Cache | `cacheGet` (Z. 1234): Map, > 4000 → älteste 400 weg | `warm()` backt nur Stand/Lauf (i0, i1, w0–w3) im Leerlauf vor, **keine Schwungbilder** |
| Rig | `fig5.js rigS/rigW` (Z. 167/208) | Gelenkpunkte je Pose: i0 i1 w0–w3 hit kb guard cast trade kneel sit die1 + Gesten |
| Phasen-Körper | `fig5.js phaseOf` (Z. 277) + paintR | wind: Rumpf hoch/zurück; strike/follow: Rumpf runter, Ausfallschritt der Beine |
| Waffenhand | `fig5.js armPlan`, `ik` | Hand auf Bogen um die Schulter (Hieb) bzw. entlang der Zielachse (Stoß) |
| Stil D | `render.js drawHumanoidAt` + `weaponPose/drawArm/drawWeapon` | ältere Kette (Arm separat gezeichnet); D eingefroren, F aus (DECISIONS 01.10.) |

**Gemessen** (Browser, eigener Tab, Titelbildschirm, kein Spielstand berührt): ein neues Stil-R-Bild kostet **≈ 4,2 ms** (Cache-Fehlgriff), ein Treffer 0,005 ms. Ein einziges neues Schwungbild sprengt also das 3-ms-Ziel; ein erster Hieb einer neuen Figur erzeugt bis zu 10 Fehlgriffe (q 0,1…1,0).

### 1.2 Animationssystem
- `anim.js ANIM_DEFS` ist schon **datengetrieben** (Roadmap P8): `death` (9 Todesarten mit Zeitachse 0–1 und Ereignissen `ev:[{t, fx, n, dy, shake, sfx}]`), `gesture` (7 Gesten). `deathPose()` rein rechnend, `deathTick()` (game.js Z. 3906) feuert die Ereignisse. **Das ist die Vorlage für Angriffe.**
- Schwungkurve: `fig5.js swingOf(wt, sw, arc, v, j)` (Z. 250) — **eine** Quelle für Stil D und R (render.js exportiert sie nur weiter). Drei Kurven:
  - **Stoß** (spear, dagger, rapier): zurückziehen bis 0,30, vorschnellen bis 0,45, einholen bis 1,0.
  - **Hieb leicht** (alles andere Nahkampf): ausholen bis 0,28, Schlag bis 0,50, Nachschwung bis 1,0.
  - **Hieb schwer** (great, axe, mace, hammer, polearm): ausholen bis 0,36 (Hammer 0,44), sonst gleich.
  - Varianten v: 0 Vorhand, 1 Rückhand (gespiegelt), 2 Überkopf (schwer + Schwert) bzw. Stoß hoch/tief. Gewählt in `render.js swingVar` mit `Math.random` (35 % springen eine Variante weiter) — **nicht an die Kombo gebunden**.
- Pose aus Zustand: `sprites.js poseOf` (Z. 1313): tuck (Rolle), kneel (Landung), guard, a1/a2/a3 (Schwung), cast, hit (170 ms nach Treffer oder solange `stagger`), Lauf, Idle i0/i1 im 650-ms-Takt. In Stil R werden a1–a3 auf i0/Lauf zurückgesetzt (`drawHumanoidR`), der Schwung steckt im W-Zustand. `kb`-Pose bei Rückstoß, Wanken hit↔kb bei `stagger > 300`.
- Klingenspur: `render.js drawWeaponR` (6 Punkte entlang früherer Winkel, Schritt 0,03), Stil D `drawWeapon` (7 Punkte).

### 1.3 Kampf (game.js)
| Funktion | Zeile | Inhalt |
|---|---|---|
| `FEEL` | 3092 | je wtype: w (Gewicht), stop (Hit-Stop ms), shake, lunge (px), stag |
| `attack` | 3120 | Ausdauer `it.stam`, Kombo-Zählung, `swingDur = it.speed × (swift, Übung)`, Bogen ×1,15, Zweiwaffen ×0,85, Klang `swing` |
| `comboStep` | 3110 | nur Spieler/Koop-Pilot, nur im Stand; 3. Schlag binnen 0,6 s = `comboFin` |
| `tickCombatant` | 2873 | `swing += dt/swingDur`; bei `swing ≥ swingHit(c)` Ausfallschritt (Sprung um `lunge` px in einem Bild) + `resolveSwing`; bei 1,0 Ende |
| `swingHit` | 3144 | **fest 0,42** (Bogen 0,75) — für alle Klassen gleich |
| `resolveSwing` | 3145 | Reichweite/Bogen aus dem Gegenstand; Speer trifft in Linie, `sweep` fegt den Bogen, Flegel ab Schwung 2 rundum; sonst nur das erste Ziel |
| `hit` | 3424 | Schaden, Krit (Rückenstich), Riposte, Wuchtschlag ×1,3 + Taumeln 700 ms, Parade/Block, crush, Sonderwirkungen; **Hit-Stop / Wackeln / `impact`-Stern** aus FEEL |
| `hurt` | ab 3530 | Rückstoß `kb` (140 ms, nach FEEL.w), Taumeln `stagOf`, Unterbrechung ab stag ≥ 0,6, Standfestigkeit `poiseUntil` (+1,2 s), Blut, Klang `hit` mit Material blunt/pierce/blade |
| `startHeavy/heavyTick` | 4547 | schwere Gegnerangriffe (slam/sweep/thrust/charge) mit Bodenmarkierung, danach 600 ms offen |
| `resolveSwingEnemy` | 4576 | Gegnertreffer; Gegner holen per `telegraph` aus, Schwung = `m.atk × 0,5`, Treffer bei 0,42 |
| `GUARD / guarded` | 15347 | Parade 180 ms ab Deckung (Schildart ×parryMul), Block, Deckung bricht; Parade: 14 Funken, Hit-Stop 120 |
| `DODGE` / Rolle | 15512, 3045 | 240 ms, 92 px, i-Frames bis 40 ms vor Ende, Nachbild alle 55 ms, Landung 110 ms |
| `deathKind` | 3893 | Todesart aus Schadensart, Rückstoß ≥ 30 px, Krit |
| `damageOf` | 99 | fester Anteil × Tempo-Faktor `clamp(it.speed/600, 0,6, 2)` — **Balance hängt an `it.speed`** |

Hit-Stop (`loop`, Z. 2276) hält die **ganze Welt** an (kein `update`), das Bild läuft weiter. Nur wenn der Spieler schlägt oder getroffen wird.

### 1.4 Effekte und Klang
- `fx(x,y,type,n)` (Z. 4001) Partikel, Deckel 900; feste Typen `impact, crit, ring, shock, afterimage, ghost` (render.js ab Z. 2735); `float()` Zahlen/Worte; `camShake(amount, ms)` (Z. 2853, abschaltbar über `S.settings.motion`); `R.cam.punch` bei Krit.
- `sfx.js sfx(name, weight, vol, mat, armored)`: swing, hit, crit, metal, bow, bone, break … Gewicht aus FEEL.w → Tonhöhe/Länge. Synthese, keine Dateien.

### 1.5 Koop
`coop.js DYN` überträgt `swing, swingDur, stagger, cover, telegraph, aim …`, **nicht** Kombo-Schritt, Hiebvariante, `kb`. Effekte gehen nur als `[x, y, type]` (ohne Winkel/Größe) und werden beim Gast mit n=3 neu erzeugt. Der Gast würfelt `swingVar` selbst → sieht andere Hiebvarianten als der Host.

---

## 2. Waffenklassen — alle `wtype` und was darin steckt

| wtype | Gegenstände (Auswahl) | Anmerkung |
|---|---|---|
| sword (11) | Kurzschwert, Langschwert, Frostklinge, Schrottklinge, Entermesser, Dornensäbel, Grabräuber, Rotklaue, Sandfürstenklinge*, Sternenklinge (mythisch), Kanzlerdegen* | Säbel/Degen ohne eigene Klasse |
| great (8) | Zweihänder, **Große Axt, Henkersaxt, Knochenspalter**, Schwarzzahn, Der Rote Henker*, Garmadons Reue, Nachtfrost* | **Großschwert und Großaxt teilen eine Klasse** |
| axe (8) | Beil, Zwergenaxt, Kriegssichel, Rabenbeil, Goraks Hackmesser, **Spitzhacke, Kriegspicke** (+Werkzeug Hacke) | Picke/Sichel ohne eigene Bewegung |
| mace (7) | Streitkolben, Morgenstern, Schrottkeule, Morrs Keule*; **Flegel über `flail:true`:** Streitflegel, Kettenkugel, Kettenbrecher | Flegel = Kolben-Kurve |
| hammer (6) | Kriegshammer, Runenhammer, Mauerbrecher, Totenglocke, Der Sturmanker* (+Schmiedehammer) | |
| spear (4) | Speer, Walharpune | |
| polearm (12) | Hellebarde, Schrott-Hellebarde, Sensenlanze, Seelenhaken (**einhändig**), **Sensen** (Gras-, Ernte-, Kriegs-, Doppel-, Mond-, Sturmsense*, Blutkult-Sense*), **Doppelklinge** | Stangenwaffe, Sense und Doppelklingen in einer Klasse |
| dagger (7) | Dolch, Hakenmesser, Katar, Leitwolfzahn*, **Schlagkralle (skill unarmed = Faustwaffe)** (+Säge) | |
| rapier (1) | Rapier (Riposte) | |
| whip (3) | Lederpeitsche, Dornenpeitsche (pull), Kettenpeitsche (bind) | Reichweite 84–100, aber **Schwert-Hiebkurve** |
| staff (1) / wand (2) | Stab / Zauberstab, Nachtglasstab* | Stab = leichte Hiebkurve; Zauberstab = Zielhaltung + Geschoss |
| bow (2) | Kurz-, Langbogen | eigenes Spannen (0,75) |
| crossbow (10) | Armbrust, Runenarmbrust, Eisenfalke, **Feuerwaffen** (Messing-/Schockpistole, Magiegewehr, Kristallkanone, Präzisionsgewehr, Donnerbüchse, Donnerwort*) | Feuerwaffen nur über `proj:'bullet'` unterschieden (Mündungsblitz) |
| throw (2) / sling (1) | Wurfmesser, Wurfbeil / Schleuder | Zielhaltung, Geschoss |
| none | unbewaffnet | FEEL.none; **in Stil R kein sichtbarer Schlag** (a1–a3 → i0, kein W) |

\* = Unikat/legendär. Bosswaffen über `weaponKey` (game.js Z. 1787): Dodon Mauerbrecher, Kettenmeister Roter Henker, Weißbart Sturmanker, Garmadon/Hrodvar/Todesritter Zweihänder, Aldhelm Langschwert. Zauber (`sp_*`) laufen über `casting`/`cast`-Pose und Rune am Boden (render.js Z. 2048), nicht über `swing`.

**Befund:** `wtype` ist zu grob für die Liste aus COMBAT_ANIM §2 (Großaxt, Sense, Doppelklingen, Stangenwaffe, Faustwaffen, Feuerwaffen, Flegel, Picke fehlen als eigene Bewegung). Er steuert aber Balance-Nebenwirkungen (FEEL, Material-Klang, Monk-Bonus, keepSmall, Tooltips) — **nicht umbenennen**, sondern eine abgeleitete Animationsklasse daneben stellen (§5).

---

## 3. IST-Profile und Befunde

Zeiten des Spielers (ohne Übung/swift), aus `swingOf` + `swingHit`:

| Waffe (Takt) | Ausholen | Schlag | **Schaden bei** | Erholung | Rückstoß/Hit-Stop/Wackeln |
|---|---|---|---|---|---|
| Langschwert 560 | 0–157 | 157–280 | **235** (64 % des Schlags, Klinge noch vor dem Ziel) | 280–560 (50 %) | w 0,35 / 50 ms / 3 |
| Zweihänder 980 | 0–353 | 353–490 | **412** (Klinge steht noch senkrecht über dem Kopf) | 490–980 (50 %) | w 1 / 100 / 7 |
| Dolch 300 | 0–90 | 90–135 | **126** | 135–300 (55 %) | w 0,05 / 28 / 1,5 |
| Speer 640 | 0–192 | 192–288 | **269** | 288–640 (55 %) | w 0,3 / 45 / 2,5 |
| Kriegshammer 1150 | 0–506 | 506–575 | **483 — noch im Ausholen** | 575–1150 (50 %) | w 1,15 / 118 / 8 |

Befunde (alle im Code geprüft, Bild `kampf_ist_schwung.png`):
1. **Schaden vor dem sichtbaren Treffer** (Verstoß gegen §14): Hammer trifft im Ausholen (0,42 < 0,44); Zweihänder/Axt/Kolben/Stange treffen bei 18 % des Schlagbogens (Kurve `ei` = langsam anlaufend); Schwert bei 40 %. Der sichtbare Einschlag kommt 60–100 ms nach Zahl, Blut und Hit-Stop.
2. **Ausfallschritt springt**: `lunge` wird im Trefferbild in einem Zug versetzt (tickCombatant Z. 2886), kein Gleiten.
3. **Copy-Paste**: 3 Kurven für 14 Nahkampfklassen. Axt = Kolben = Großschwert = Großaxt = Sense = Hellebarde (nur `arc` und Ausholanteil anders). Peitsche, Flegel, Stab, Picke benutzen die Schwertkurve. Erholung ist überall gleich 50 % des Takts; es gibt kein Abbrechen (Angriff erst nach `swing = 1`, Deckung nicht im Schwung, nur die Rolle bricht ab).
4. **Kombo ohne eigene Bewegung**: Hiebvariante würfelt `Math.random`; der Wuchtschlag hat keine eigene Pose und **keine längere Dauer** — MECHANIKEN.md Z. 619 sagt „dauert 15 % länger“, im Code wird nur `comboT` verlängert, `swingDur` nicht (**Doku ≠ Code**).
5. **Gegner ohne Waffengewicht**: `feelOf` liest `c.equip.weapon`; Gegner haben nur `weaponKey` → immer `FEEL.none` (Lunge 4, Rückstoß-Gewicht 0,15). Dodons Mauerbrecher stößt den Spieler so weit wie ein Goblindolch. Getroffener Spieler: fest Hit-Stop 40, Wackeln 4.
6. **Ansage der Gegner** zeigt in Stil R kein Ausholen der Figur (W-Modus `rest` solange `swing = 0`); nur der Bodenbogen `telegraphArc` (render.js Z. 2461) und bei schweren Angriffen die rote Fläche. (Aus dem Code gelesen, nicht im Spiel angesehen.)
7. **Trefferreaktionen**: eine `hit`-Pose (170 ms), `kb`-Pose, Wanken bei langem Taumeln, Blitz (`flashAlpha`). Leicht/schwer/krit unterscheiden sich nur in Rückstoß-px, Taumeldauer, Sterngröße, Zahlfarbe. Tod: 9 Arten (anim.js) — gut, bleibt.
8. **Defensive ohne Waffenidentität**: Deckung = `guard`-Pose + Klinge schräg (`cover`), für jede Waffe gleich; Rolle = gedrehte Kugel; Parade = Funken + Hit-Stop 120.
9. **Bewegung**: 4 Laufbilder (115 ms), Idle i0/i1; kein Kampfstand, kein Sprint-, Rückwärts- oder Wendebild; Ruhehaltung nur in 3 Gruppen (aufrecht: Stange; Schulter: great/hammer; hängend: Rest).
10. **Unbewaffnet** in Stil R: Angriff ohne sichtbare Bewegung.
11. **Koop**: Variante und Kombo-Schritt laufen beim Gast nicht synchron (siehe 1.5).
12. Nicht geprüft: Darstellung der Nebenhandwaffe beim Zweiwaffenkampf; Reittier-Kampf (`~r`-Posen); Stil D im Detail.

---

## 4. SOLL-Profile

### 4.1 Grundsatz (Vorschlag, Balance-neutral wo möglich)
- **Ein Takt bleibt ein Takt**: Pack A verteilt Ausholen/Schlag/Impact/Erholung **innerhalb** von `it.speed` neu → DPS (`(dmg + F × Tempo) / Takt`) bleibt gleich. Geändert wird die **Zeit bis zum Schaden** (Impact = Schadensbild), das berührt Tausch-Treffer, Unterbrechen (stag ≥ 0,6 vor dem Gegnertreffer bei 0,21 × atk) und `RF.simFight`-Werte → messen, nicht annehmen.
- **Impact = Schaden**: `hitAt` liegt im Bild, in dem die Klinge die Zielachse kreuzt (Ende der Schlagphase), nicht davor.
- **Kombo als Kette**: Schritt n+1 beginnt in der Endlage von Schritt n; sein Ausholen ist kürzer, weil es weiterläuft. Die Erholung des Vorgängers wird abgebrochen, sobald der nächste Schlag gedrückt ist (Kombo-Fenster = Erholung). Damit wird die Zeit je Hieb in der Kombo kürzer → **Balance-Frage (§6 E2)**.
- Gewicht über FEEL bleibt die Grundlage (Hit-Stop, Wackeln, Rückstoß, Klang); Packs skalieren nur die Optik-Anteile.

### 4.2 Testwaffen — Phasen in ms (Ausholen / Schlag → Impact / Erholung; Σ = Takt)
Impact-Bild = Ende Schlag = Schaden. Hit-Stop kommt außerhalb des Takts dazu (wie heute).

**Langschwert (Takt 560, kontrolliert, klare Bögen)**
| | A Grounded | B Heroic | C Endgame |
|---|---|---|---|
| A1 Vorhand | 170 / 80 → 250 / 310 | 150 / 60 → 210 / 350 | 110 / 50 → 160 / 400* |
| A2 Rückhand (aus Endlage A1) | 130 / 80 → 210 / 350 | 110 / 60 → 170 / 390 | 80 / 50 → 130 / 430* |
| A3 Wuchtschlag Überkopf | 230 / 90 → 320 / 324 (=644, +15 % laut Doku) | Stoß-Schnitt 140 / 60 / … | Dash-Hieb 24 px, Nachbild |
| A4 Finisher | — | Wirbel 360° 200 / 120 → 320 / 324 | Doppelwirbel + Druckwelle |
| Hit-Stop / Wackeln | 50 / 3 (wie heute) | 70 / 4 | 90 / 5 + Kamerastoß |
| VFX | Spur 6 Punkte | Sichelbogen 120 ms | Sichel + Nachbild + Funkenring |
| Schwerer Angriff (halten) | 400 Ausholen, Impact ×1,6 | 350 | 250 + Dash |

**Zweihänder (980, langsam, große Körperbewegung, enormer Impact)**
| | A | B | C |
|---|---|---|---|
| A1 schräg | 380 / 110 → 490 / 490 | 320 / 100 → 420 / 560 | 240 / 80 → 320 / 660* |
| A2 Rückschwung | 260 / 110 → 370 / 610 | 220 / 100 → 320 / 660 | 160 / 80 → 240 / 740* |
| A3 Überkopf-Spalter | 420 / 120 → 540 / 587 (=1127) | Sprung-Spalter 400 / 140 | Spalter + Bodenriss (Fläche) |
| Hit-Stop / Wackeln | 100 / 7 | 120 / 8 | 150 / 10 |
| Körper | Rumpfdrehung, Gewicht nach vorn, Erholung sichtbar (Klinge zieht nach) | + Sprungschritt | + Staubring, Nachbild |

**Dolch (300, extrem schnell, kurze Bewegungen, wenig Erholung)**
| | A | B | C |
|---|---|---|---|
| A1 Stich | 60 / 40 → 100 / 200 | 50 / 35 → 85 / 215 | 40 / 30 → 70 / 230* |
| A2 Schnitt quer | 50 / 40 → 90 / 210 | 40 / 35 → 75 / 225 | 30 / 30 → 60 / 240* |
| A3 Doppelstich | 2 × (40 / 30), 2. Treffer bei 150 | Dreierserie | Dash hinter das Ziel (Rückenstich-Krit) |
| Hit-Stop / Wackeln | 28 / 1,5 | 35 / 2 | 40 / 2 + Nachbilder |

**Speer (640, Reichweite, Stöße, Vorwärtsbewegung)**
| | A | B | C |
|---|---|---|---|
| A1 Stoß | 200 / 70 → 270 / 370 | 170 / 60 → 230 / 410 | 120 / 50 → 170 / 470* |
| A2 Stoß hoch + Schritt 6 px | 160 / 70 → 230 / 410 | 140 / 60 → 200 / 440 | Zweifachstoß |
| A3 Schaftschwung (Bogen, drängt ab) | 240 / 100 → 340 / 396 | Wirbel am Schaft | Sprungstoß 60 px Linie |
| Hit-Stop / Wackeln | 45 / 2,5 | 60 / 3 | 80 / 4 |

**Kriegshammer (1150, sehr langsam, starkes Ausholen, Einschlag)**
| | A | B | C |
|---|---|---|---|
| A1 Überkopf | 560 / 90 → 650 / 500 | 480 / 90 → 570 / 580 | 360 / 80 → 440 / 710* |
| A2 Seitwärts | 420 / 100 → 520 / 630 | 380 / 100 → 480 / 670 | Drehung 360° |
| A3 Bodenschlag (Ring, Staub) | 600 / 100 → 700 / 622 | + Druckwelle (Fläche?) | Krater + Funken + langer Stop |
| Hit-Stop / Wackeln | 118 / 8 | 140 / 9 | 180 / 11 |

\* C mit derselben Summe ist nur bei Kombo-Abbruch der Erholung schneller; „extrem schnelle Combos“ (COMBAT_ANIM §8) verlangt kürzeren Takt → **DPS-Änderung, siehe §6 E1/E2**.

Für alle 5 gemeinsam (Pack-abhängig in der Stärke): Block/Parade mit waffeneigener Haltung (Dolch: Klinge quer vor dem Gesicht; Zweihänder/Hammer: Schaft quer, breitbeinig; Speer: Schaft schräg, Spitze vorn), Ausweichen = Rolle (A), Ausfallschritt-Sprung (B), Dash mit Nachbild (C — heute schon `dodge.dash` + `afterimage` vorhanden). Gegnerreaktion: leicht = `hit` 170 ms; schwer (w ≥ 0,6) = `kb` + Rumpf zurück + Staub; Krit = Blitz + Wanken; Taumeln = vorhandenes Wanken. Dauern **aus dem bestehenden `stagger`/`kb`** ableiten, nicht verlängern.

### 4.3 Übrige Klassen (grob, Identität in einem Satz)
| Klasse | Kern der Bewegung | Besonderheit |
|---|---|---|
| Axt (1H) | kurzer hoher Hieb von oben-außen, Gewicht am Kopf | Picke: Hacken von oben (Stich nach unten) |
| Großaxt | wie Zweihänder, aber Hacken/Spalten statt Schneiden; Klinge bleibt kurz „stecken“ (Impact länger) | eigene Klasse aus great + Axtkopf |
| Streitkolben | kurzer Überkopf-Schmetterer, Ellbogen hoch | Morgenstern Funken |
| Flegel | Kette kreist im Ausholen (Momentum sichtbar), Kugel folgt verzögert | `momentum` 1–3 als Kreisgröße |
| Stangenwaffe/Hellebarde | Stoß + Hackschwung, Distanz halten | Schaft-/Spitzen-Unterschied (`tip`) sichtbar |
| Sense | breite flache Bögen, ganze Körperdrehung, Ausholen hinter dem Rücken | `sweep`; Blutsense-Puls bleibt |
| Doppelklinge | Rotation um die Hand, zwei Treffer je Bogen (optisch) | arc 3,2 |
| Rapier | Ausfall (lange Lunge), Stich, schnelles Zurück; Riposte eigene Pose | |
| Peitsche | Schnalzen: Ausholen über Schulter, Peitschenwelle läuft aus | Linie statt Bogen; pull zieht sichtbar |
| Faust/Kralle | Gerade/Haken abwechselnd links–rechts | heute unsichtbar in Stil R |
| Bogen | Spannen sichtbar (gibt es), Loslassen, Sehne zittert (gibt es) | Pack: Mehrfachschuss nur C? |
| Armbrust | Anlegen, Schuss, Spannen (Fuß in den Bügel) als eigene Nachladepose | `reload` |
| Feuerwaffen | Anlegen, Rückstoß der Waffe (+Schulter), Mündungsblitz (gibt es), Rauch | |
| Wurf / Schleuder | Wurfbewegung über Schulter / Kreisen der Schleuder | |
| Stab (Nahkampf) | Schaftstöße beidhändig, Drehung | |
| Magie | Wirken–Aufladen–Loslassen–Einschlag–Kanalisieren (COMBAT_ANIM §13): an `casting`/`channel`/Rune anschließen, nicht an `swing` | eigenes Profil, Scheibe nach den Waffen |
| Bosswaffen/Unikate | Profil der Klasse + optional eigener Finisher/Idle (§12), nur Dodon, Weißbart, Garmadon, Kettenmeister, Blutsense zuerst prüfen | |

---

## 5. Architekturvorschlag (erweitert das Bestehende)

1. **Daten in `anim.js`** neben `death`/`gesture`: `ANIM_DEFS.attack[aclass][pack] = { steps: [ {curve, wind, strike, rec, hitAt, from, to, ext, lunge, lean, ev:[{t, fx, n, shake, stop, sfx}]} … ], heavy, finisher, guard, idle }`. Zeiten als Anteile des Takts (wie die Todes-Zeitachse 0–1), damit `it.speed`, Übung und `swift` weiter wirken. `aclass` = **abgeleitete** Animationsklasse (`animClassOf(it)`: wtype + Merkmale, z. B. great+Axtkopf → greataxe, polearm+sweep+arc ≥ 2,3 → scythe, arc ≥ 3 → doubleblade, crossbow+bullet → firearm, dagger+skill unarmed → fist, mace+flail → flail) mit Ausnahmeliste von Hand — wie die Leitware-Ableitung (DECISIONS, Leitung 01.10.).
2. **Eine Kurve, eine Wahrheit**: `fig5.swingOf` liest die Schritt-Definition statt fester Konstanten; `phaseOf` und `game.js swingHit(c)` lesen **dasselbe** `hitAt` → Schaden fällt im Impact-Bild. `resolveSwing`, Reichweite, Bogen, `hit`/`hurt` bleiben unverändert. Kombo-Schritt (`c.combo`) ersetzt `Math.random` in `swingVar` als Variante; der Schritt wandert in `coop.js DYN`.
3. **Frame-Cache schonen**: kein neuer Schlüssel je Pack. Der W-Schlüssel bleibt `mode,wt→aclass,q,v→step,oct,…`; q bleibt in Zehnteln (Kurven unterscheiden sich in den Stützstellen, nicht in der Auflösung). Körperbewegung außerhalb des Bildes per Canvas-Transform (Ausfallschritt als Gleiten, Rumpf-Neigung, Sprung, Dash) — kostet ~0. Schwungbilder des Spielers beim Anlegen der Waffe / Pack-Wechsel in `warm()` vorbacken (heute nur Stand/Lauf). Gegner und NPC bleiben auf Pack A (ein Satz Bilder je Gegner). Abschätzung: je Spec × Klasse ≈ 4 Richtungen × ~2 Achtel × 3–4 Schritte × 11 q × (i0 + Lauf) → 1 000–1 800 Bilder; drei Packs für alle Figuren würden den 4000er-Cache überlaufen lassen (je Fehlgriff 4 ms).
4. **Impact-Synchronisierung**: ein Ereignis `impact` im Schritt (`ev` bei `t = hitAt`) löst in `tickCombatant` `resolveSwing` aus; Hit-Stop/Wackeln/Effekt/Klang kommen weiter aus `hit()` (FEEL), multipliziert mit dem Pack-Faktor. Neue Effekte als feste `S.fx`-Typen in render.js (`slash`-Sichel, `crack`-Bodenriss), mit Deckel und `settings.motion`.
5. **Gegnerreaktionen** laufen weiter über `hurt` (kb, stagger, poise); neu ist nur die Darstellung (`hit-heavy`, Krit-Wanken) aus vorhandenen Werten. Gegner bekommen FEEL über `weaponKey` (Befund 5) — **Balance-Änderung**, siehe E4.
6. **Pack-Umschaltung**: `S.settings.combatPack = 'A'|'B'|'C'` (fehlt → 'A'; settings werden mitgespeichert, alte Stände unkritisch). Combat Test Room: **flüchtige Karte `__arena`** nach dem Muster von `duel()`/`simFight` (`MAPS.__d`, `S.ents.__d`, `solidIndex.__d`), erreichbar über Debug-Menü (`debugSections`, Abschnitt „Kampf“): 5 Testwaffen, Pack A/B/C, Puppen (stehen, schlagen zurück, Gruppe), Zeitlupe (wie `S.dying` dt × 0,25), Bildschritt. Beim Betreten `S._quiet = true` und Rückkehrpunkt merken; **Speichern in `__arena` sperren** (sonst lädt ein Stand mit unbekannter Karte).

---

## 6. FEATURE IMPACT REPORT

**Feature:** Combat Animation Overhaul, Teil 1 (Infrastruktur, Test Room, 5 Testwaffen × 3 Packs).

**Betroffene Systeme:** fig5.js (swingOf, phaseOf, armPlan, Rig), sprites.js (humanFrameR-Schlüssel, warm, poseOf), render.js (drawHumanoidR, drawWeaponR, swingVar, fx-Typen, telegraphArc), anim.js (ANIM_DEFS), game.js (FEEL, attack, comboStep, tickCombatant, swingHit, resolveSwing-Auslöser, hit-Feedback, hurt-Reaktion, guarded, Rolle, debugSections, selftest), sfx.js (Klangvarianten), coop.js (DYN), state.js (settings), docs/MECHANIKEN.md, BALANCE_GUIDE (falls Takt sich ändert). Nicht betroffen: Welt, Fraktionen, Quests, Simulation, Beute, Ruf.

**Bereits vorhanden:** datengetriebene Zeitachse mit Ereignissen (anim.js), Phasen (phaseOf), Hiebvarianten, Kombo + Wuchtschlag, FEEL-Gewichte, Hit-Stop, Wackeln, Impact-/Krit-Stern, Ring, Druckwelle, Nachbild, Dash, Klingenspur, Material-Klang, Parade/Block/Rolle, Rückstoß/Taumeln/Standfestigkeit, schwere Gegnerangriffe mit Ansage, 9 Todesarten, flüchtige Testkarten (duel/simFight), Debug-Menü.

**Fehlende Infrastruktur:** Animationsklasse feiner als wtype; Kurven aus Daten; `hitAt` je Schritt; Kombo-Schritt statt Zufall; Erholungs-Abbruch (Kombo-Fenster); schwerer Angriff des Spielers (gibt es nicht — nur Gegner `heavy`); waffeneigene Deckung/Parade-Pose; Trefferreaktion schwer/krit als Pose; Schwungbilder vorbacken; Test Room; Pack-Einstellung; Koop-Sync des Schritts; Hinweis im Spiel + Debug-Eintrag + MECHANIKEN-Text (CLAUDE.md-Pflicht).

### OFFENE DESIGNENTSCHEIDUNGEN (Empfehlung jeweils dahinter)
- **E1 Packs = nur Optik oder auch Werte?** Kürzerer Takt (B/C), mehr Finisher, Dash-Treffer ändern DPS/Ausdauer/Schutz. *Empfehlung:* Packs ändern nur Optik + Verteilung innerhalb des Takts; Pack C bekommt Tempo nur über einen **eigenen Endgame-Effekt** (Talent/Titel/Mythos-Waffe), der wie andere Boni gemessen wird.
- **E2 Kombo-Kette und Erholungs-Abbruch:** Wird die Erholung durch den nächsten Kombo-Schlag abgekürzt (mehr DPS bei Kombo), 4. Schlag/Finisher ja oder nein, bleibt der Wuchtschlag ×1,3, und gilt „+15 % Dauer“ (Doku) oder der Code (kein Zuschlag)? *Empfehlung:* Doku wahr machen (+15 % Dauer), Kette 3 Schläge in A, 4 in B/C nur optisch (4. = Finisher-Animation des 3.); Abbruch erst ab Impact + 40 %.
- **E3 Schaden auf das Impact-Bild verschieben** (Hammer/Zweihänder später, ~+60–170 ms bis zum Treffer). *Empfehlung:* ja (Pflicht aus §14), Takt gleich; danach `RF.simFight` für alle 5 messen und nur bei Abweichung > 5 % nachjustieren (Entwickler entscheidet).
- **E4 Gegner mitziehen?** Gegner-Animationen (Kurven, Gewicht über `weaponKey`, Ansage als echte Ausholbewegung) — FEEL für Gegner ändert Rückstoß/Taumeln am Spieler. *Empfehlung:* Optik ja (Pack A fest für alle NPC/Gegner), Gewicht-Werte für Gegner als eigene Balance-Runde später.
- **E5 Pack C nur im Endgame / Pack-Wahl für Spieler?** *Empfehlung:* Für die Testphase frei im Test Room und in den Optionen (nur `?dev`); danach legt der Entwickler den finalen Stil fest (§10) — kein dauerhafter Dreifach-Schalter für Spieler.
- **E6 Koop:** Zeigt jeder Rechner sein eigenes Pack oder gilt das des Hosts? *Empfehlung:* Host-Pack gilt für Zeitpunkte (Schaden), Optik lokal wählbar; Kombo-Schritt wird übertragen.

(Weitere kleine Punkte, die beim Bau gefragt werden: schwerer Angriff für den Spieler per Halten — Taste? Peitsche/Flegel-Sonderkurven schon in Scheibe 2? Gewalt-Einstellung „gering“ für Pack-C-Effekte.)

### Risiken
- **Leistung:** Cache-Fehlgriff 4,2 ms/Bild (gemessen); neue Schwungbilder in großen Kämpfen = Ruckler. Gegen: Packs nur für Spieler/Koop-Helden, Vorbacken, Körperbewegung per Transform, Partikel-Deckel, Nachbilder nur Spieler. Messung mit `ROTFALL_STATE/perf`-Bench (Ziel 3 ms) in Stadt, Belagerung, Boss.
- **Hit-Stop global:** längere Stops (C: 150–180 ms × 3 Treffer/s) frieren die ganze Welt bis zu 40 % der Zeit ein (auch Uhr/Simulation). Pack C braucht gedeckelte Summe je Sekunde.
- **Proben:** Selbsttest prüft Schwung über `humanFrameR` (Z. 16094), FEEL je Waffe (17450), Kombo (18542, 18933); `swingHit`-Verschiebung ändert RNG-/Zeit-abhängige Proben und `simFight`-Erwartungen.
- **Lesbarkeit:** größere Bögen/VFX verdecken Gegner-Ansagen (Bodenbogen, rote Flächen); Pack C muss Ansagen überlagern lassen.
- **Koop:** Effekte kommen beim Gast ohne Winkel/Größe an (`[x,y,type]`); neue VFX brauchen Felder im Paket.
- **Speichern:** Test Room darf nie in den Spielstand (Karte `__arena`); Spielstand-Sicherheit aus HUNT.md beim Testen.
- **Doku/Code:** Wuchtschlag-Dauer (E2) vor dem Bau klären, sonst bleibt der Widerspruch.

### Implementierungsplan (Scheiben, erst nach Antworten auf E1–E6)
1. **Infrastruktur + Test Room + Langschwert A/B/C:** `ANIM_DEFS.attack` + `animClassOf`; swingOf/phaseOf/swingHit aus Daten (Pack A des Langschwerts = heutige Kurve mit korrigiertem `hitAt`); Kombo-Schritt statt Zufall (+ Koop DYN); Gleit-Lunge; Vorbacken; `settings.combatPack`; Karte `__arena` im Debug-Menü mit Puppen, Zeitlupe, Bildschritt; Proben (Schaden im Impact-Bild, Cache-Größe nach 100 Hieben, kein Speichern in `__arena`); Leistungsmessung.
2. **Übrige 4 Testwaffen** (Zweihänder, Dolch, Speer, Hammer) je A/B/C inkl. Deckung/Parade-Haltung und schwerer Trefferreaktion.
3. **Auswertung mit dem Entwickler:** Vergleichsbilder/Clips je Pack, simFight-Tabelle vorher/nachher, Leistungswerte → finaler ROTFALL-Stil (§10).
4. **Ausrollen:** alle Klassen aus §4.3 im gewählten Stil, Gegner (E4), Bosswaffen/Unikate, Magie-Profil, Faust in Stil R, alte stilbrechende Animationen suchen (Stil D, Arbeitsschwung `work`, Reitkampf).
