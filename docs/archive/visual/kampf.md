# Visueller Umbau — Priorität 4: Kampf-Feedback (Analyst B, 02.10.2026)

Grundlage: VISUAL.md, GATE.md, DECISIONS.md, IST_ZUSTAND.md, MECHANIKEN.md, Code per grep. **Nur Analyse, kein Spielcode.**
**Abgrenzung (Lead, 02.10.):** Waffenanimationen, Combos, Animationsprofile je Waffenklasse, die Packs A/B/C sowie **Hit-Stop, Kamerawackeln, Schlageffekte und Trefferreaktionen** gehören zu **Analyst E** (`ROTFALL_STATE/COMBAT_ANIM.md`). Hier: Schadenszahlen, Krits (Darstellung), Status, Ausweichen/Block/Parade als Rückmeldung, Fähigkeiten-/Abklingzeit-/Ausdaueranzeige, schwere Angriffe, Bossmechaniken, Tod, sichtbar verwundete Gegner. Wo E betroffen ist, steht „→ E“.
Kosten = grobe Schätzung je Bild; heute 9–17 ms Median (perf/PLAN.md), Ziel 3 ms.

---

## 0. Bestand (Code-Inventar)

| Bereich | Was es gibt | Code |
|---|---|---|
| Schwebende Zahlen/Wörter | `float(e, text, color, big)`: 900 ms, steigt auf, Cinzel 15 px (groß 20 px fett), Schatten. Schaden weiß, Krit gold + groß. **137 Aufrufe**, viele davon Wörter: „Block“, „Parade!“, „Ausgewichen“, „Abgewehrt“, „Schild“, „Riposte“, „Wucht!“, „Flanke!“, „Hinterhalt!“, „erschöpft“, „holt weit aus“, „zielt“, „hebt die Waffe“, „Unterbrochen“, „körperlos“, „feuerfest“, „gefesselt“, „herangezogen“, „KLONG“, „ENTHAUPTET“, „Arm ausgefallen“ … | game.js `float`, `hit`, `hurt`, `guarded`, `evaded`, `enemyStamina`, `startHeavy`; render.js `drawFloats` (fillText je Eintrag und Bild) |
| Partikel | `fx(x,y,type,n)`: blood, spark, dust, heal, bone, impact, crit, shadow, fire, frost, necro, ghost, afterimage, shock, ring; Deckel `FX_CAP` 900; Darstellungszufall `vrnd` (Audit C5) | game.js `fx`, `updateFx`; render.js `drawFx` |
| Treffer → E | Trefferblitz 130 ms (`flashAlpha`, `lastHurt`), Posen `hit`/`kb`, Taumeln, `FEEL` je Waffe (Hit-Stop 28–118 ms, Wackeln), Krit-Zoomstoß `cam.punch`, `hitStop` | render.js `flashAlpha`; game.js `hit`, `camShake`, `camStep` |
| Krit | Zahl gold groß, `fx 'crit'` (Pixelstern + Ring), `cam.punch` 0,04, Hit-Stop +40 ms, Klang `crit`, Tod „Sturz rückwärts“ (`fallB`) | game.js `hit`/`hurt`; anim.js `ANIM_DEFS.death.fallB` |
| Status | Spieler: Symbole im HUD (`statusIcons`, `FX_ICON`), Fenster X. **Gegner: keine dauerhafte Anzeige** — nur ein Partikelstoß beim Auftragen (`applySpellStatus`), Blutspur beim Bewegen (`bleeding`), Raserei-Aura (`variant 'frenzied'`), Geist halb durchsichtig | ui.js `statusIcons`; game.js `applySpellStatus`, Status-Tick in `tickCombatant` |
| Ausweichen/Block/Parade | Wörter-Floats + Funken, Klang `metal`, Hit-Stop 45/120 ms, Nachbild der Rolle (`afterimage`), Riposte-Fenster 1,2 s ohne Anzeige außer Float „Riposte“ beim Stich | game.js `guarded`, `evaded`, `hit` (Block, Abgewehrt, Schild) |
| Fähigkeiten | Rune in Schulfarbe beim Sammeln (`e.casting`), Pose `cast`, Float „Unterbrochen“; **Leiste zeigt Fähigkeiten als Wort** (`ab.name`), Zauber in Schulfarbe | render.js `drawHumanoidAt` (Rune); ui.js `renderHotbar` |
| Abklingzeiten | Leiste: dunkles Feld wächst von unten (Prozent), neu gezeichnet in 250-ms-Stufen (`hbSig`) | ui.js `renderHotbar` |
| Ausdauer | Balken im HUD links; zu wenig Ausdauer für einen Hieb: Toast „Zu erschöpft“ **nur mit 2 % Chance und über `chance()` = Spielzufall**; Gegner-Ausdauer unsichtbar bis Float „erschöpft“ | ui.js `refreshHUD`; game.js `attack`, `enemyStamina` |
| Schwere Angriffe | 7 Gegnerarten (`MONSTERS.heavy`): rote Bodenmarkierung (Kreis/Ring/Punktlinie), Pose `a1`, Wort-Float, Klang `swing`; danach 600 ms offen (+25 %). Normale Hiebe: gepunkteter Bogen (`telegraphArc`), Schüsse/Sturm: Punktlinie (`dottedLine`) | game.js `startHeavy`, `heavyTick`; render.js `drawCreature`, `telegraphArc`, `dottedLine` |
| Regel-Befund schwere Angriffe | `heavyTick` trifft über `hit()`, **nicht** über `areaHit()` → Deckung und Schild greifen (nur die Parade nicht, weil `swing` 0 ist). Flächen (`areaHit`) umgehen Deckung. MECHANIKEN nennt nur „ausweichen oder hinausgehen“. | game.js `heavyTick`, `areaHit` |
| Boss | Boss-Leiste unten mit festem Strich bei 50 %, Name rot ab Phase 2; Auftritt mit Namenskarte (`bossIntro`, `BOSS_CARDS`, `nameCard`); Ansagen: Hrodvars Eiskreis, Stampfen, Strahl, Meteor, Nova, Blutregen; Aldhelm: Blutfesseln, Lichtschächte, Blutsiegel | render.js `drawBossBar`, `drawCreature`; game.js `bossIntro`, `frostKingAI`, `whitebeardAI`, Aldhelm-Logik |
| Tod | 9 Todesarten (`ANIM_DEFS.death`), Leichen 20 s, Gräber, Heldentod-Moment 3 s (T10), Boss-Tod: Toast + Chronik | anim.js; render.js `drawCorpse`, `drawDeath`; game.js `die`, `playerDeath` |
| Verwundet sichtbar | Blutstufen 0/1/2 bei < 50 % / < 25 % Leben (`bloodOf` → Spec → fig5 `wear`), ausgefallene Glieder als blutige Stelle, Kriechen, Humpeln (Held), Prothesen sichtbar; **Tiere ohne Blutstufen** (`beastFrame`); **keine Lebensbalken über Gegnern** (nur Boss und Karawane) | sprites.js `bloodOf`, `msOf`, `monsterSpec`; fig5.js `wear`; render.js `drawCreature` |
| Klang | swing, hit (Material/Rüstung), crit, break, bone, metal, dodge, death, bell, bow, magic, fire, heal, horn, chains, drum, heartbeat, crack, shout … | sfx.js `sfx` |
| Koop | Gast bekommt `telegraph`, `stagger`, `act`, `hp` (DYN), aber **nicht** `special` (Bodenmarkierung), `casting`, `lastHurt`, Status; Floats ja (12 je Paket) | coop.js `DYN`, Paket `fl` |
| Zufall | `camStep` würfelt das Wackeln mit `rnd()` (Spielzufall), Blutspur mit `chance()`, „Zu erschöpft“ mit `chance()` — widerspricht Audit C5 („Darstellung mit `vrnd`“) | game.js `camStep`, Status-Tick, `attack` |

**Kernbefund:** Die Kampfregeln sind reich und fair angesagt (Bodenmarken, offenes Fenster, Rune), aber die **Rückmeldung ist überwiegend Wort-Text**, Status an Gegnern ist unsichtbar, Ausdauer und Abklingzeiten liegen fern vom Geschehen, und die Leiste zeigt Fähigkeiten als Wörter.

---

## K1 Schadenszahlen

**Problem:** Zahlen und Wörter benutzen dieselbe Form; viele gleichzeitige Floats überlagern sich; Schadensart (Feuer, Gift, Blutung) ist nicht erkennbar; jede Zahl kostet `fillText` zweimal je Bild; Brand und Gift erzeugen viele Kleinzahlen.
**Inspiration:** Diablo/PoE (Farbe nach Schadensart, Größe nach Gewicht), Hades (knappe, zusammengefasste Zahlen), Kenshi (gar keine Zahlen), GW2 (Zahlen fliegen seitlich, Zusammenfassen von Ticks).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | Nur eigener Schaden als Zahl; erlittener Schaden als roter Randpuls | ±0 | Gut für Ruhe, verliert Info bei Gefährten |
| 2 | **Farbe nach Schadensart** (Hieb hell, Feuer orange, Frost blau, Gift grün, Blutung dunkelrot, Heilig gold-weiß, Schatten violett) | ±0 | Sehr gut, Info ohne Text |
| 3 | Größe nach Anteil am Leben des Ziels | ±0 | Gut, macht schwere Treffer spürbar |
| 4 | **Zusammenfassen:** Treffer/Ticks auf dasselbe Ziel in kurzer Zeit addieren, Zahl wächst statt neu zu erscheinen | spart Floats | Sehr gut (Brand, Gift, Kettenblitz) |
| 5 | **Pixelziffern** (gebackene 5×7-Bitmap, `drawImage` statt `fillText`) | billiger als heute | Sehr gut: Stil passt, schneller |
| 6 | Zahl fliegt im Bogen in Schlagrichtung | ±0 | Gut, aber Bewegung → mit E abstimmen |
| 7 | Keine Zahlen (Kenshi), nur Körper/Blut | spart alles | Für ROTFALL zu wenig Rückmeldung als Standard; als Einstellung gut |
| 8 | **Wörter → Glyphen** (Schild für Block, gekreuzte Klingen für Parade, Wischlinie für Ausweichen, Schädel für „Hinterhalt“, Kette für „gefesselt“) | billiger (Bitmap) | Sehr gut, Kern von VISUAL.md |
| 9 | Zahl am getroffenen Körperteil (Kopf, Arm, Bein — `damagePart` kennt es) | ±0 | Gut, zeigt das Trefferzonen-System |
| 10 | **Einstellung** Aus / Reduziert (nur Krits und eigener Schaden) / Voll | ±0 | Pflicht bei Darstellungsvorlieben |

**Wahl:** **5 + 2 + 4 + 8 + 10**, dazu 9 (billig, zeigt Körpersystem) und 3 maßvoll. 6 → E.

**FEATURE IMPACT REPORT K1**
- Betroffene Systeme: game.js `float` (137 Aufrufer), `hurt` (Zahl), `hurtFromProjectile`, Status-Ticks (`tickCombatant`), `damagePart`; render.js `drawFloats`; coop.js Float-Paket; Einstellungen (`S.settings`, ui.js Optionen); sprites.js (Bitmap-Ziffern backen).
- Vorhanden: Float-Liste, Farbe je Aufruf, Krit-Größe, Schadensart als Parameter in `hurt` (`kind`/Ursache).
- Fehlt: Typfeld am Float (Zahl/Glyphe/Wort), Ziffern- und Glyphen-Bitmaps, Zusammenfassen je Ziel, Einstellung.
- Persistenz: Einstellung in `S.settings` (wird gespeichert, alte Stände: fehlt = Standard).
- Risiken: 137 Aufrufer — schrittweise umstellen, nicht alle auf einmal; Koop-Paket trägt nur `text/color/big` → Typfeld ergänzen, sonst sieht der Gast Wörter; Zahlen dürfen keine Spielwerte verraten, die bewusst verborgen sind (z. B. Gegnerleben → K12).
- Plan: S1 Bitmap-Ziffern + Schadensfarben (gleiches Verhalten) · S2 Glyphen für die 10 häufigsten Wörter · S3 Zusammenfassen · S4 Einstellung + Körperteil-Position · Debug „Schadenszahlen: alle Arten vorführen“, MECHANIKEN, Kodex-Zeichenlegende.

**OFFENE DESIGNENTSCHEIDUNGEN K1**
1. Standard der Einstellung? Empfehlung: Voll für eigenen Schaden, eingehender Schaden nur als Zahl bei Krit.
2. Welche Wörter bleiben Wörter? Empfehlung: Namen von Ereignissen (z. B. „ENTHAUPTET“, „Zweiter Atem“) bleiben Text, alles Wiederkehrende wird Glyphe.

---

## K2 Krits (Darstellung)

**Problem:** Krit = goldene große Zahl + Stern; gegen gepanzerte oder untote Ziele sieht er gleich aus; Zeitgefühl (Hit-Stop, Zoom) liegt bei E.
**Inspiration:** Diablo (Krit-Zahl mit Rahmen), PoE (Krit-Klang), Darkest Dungeon („CRIT!“-Moment mit Blutstoß), Hades (kurzer Farbblitz).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | Größerer Pixelstern in Schadensfarbe | ±0 | Gut |
| 2 | Ziel blitzt rot statt weiß | Flash-Bild je Farbe (Cache) | Mittel |
| 3 | Zweite Klangschicht (helles Klirren) | ±0 | Gut |
| 4 | **Krit-Zahl mit dunklem Rahmen** (Bitmap aus K1) | ±0 | Sehr gut, eindeutig |
| 5 | Zeitlupe | → E | — |
| 6 | **Gerichteter Blutstoß** in Schlagrichtung (nur bei Blut-Zielen, Gewaltstufe beachtet) | `fx` gedeckelt | Sehr gut, dunkel, lesbar |
| 7 | Bildrand-Vignette blitzt | +0,05 ms | Unruhig |
| 8 | **Material-Splitter:** Metallsplitter bei gepanzerten, Knochensplitter bei Untoten, Funken bei Automaten | `fx` vorhanden (spark/bone) | Sehr gut, nutzt `armored`/`bony`, das `hurt` schon kennt |
| 9 | Krit-Zähler | UI | Nein, Spielerei |
| 10 | Kamerastoß in Schlagrichtung | → E | — |

**Wahl:** **4 + 6 + 8**, 3 mit Klang. Zeit/Kamera → E.

**FEATURE IMPACT REPORT K2** — Systeme: game.js `hurt` (Krit-Zweig, `bony`, `armored`, `mat`), `fx`; render.js `drawFx`; sfx.js `crit`; Gewaltstufe `S.settings.violence`. Vorhanden: alles Nötige. Fehlt: Richtung am Partikelstoß (Winkel liegt in `hit` vor). Risiken: Partikelmenge in Schlachten (FX_CAP), Gewaltstufe „Kaum Blut“ muss Splitter statt Blut zeigen. Plan: eine Scheibe mit K1-S2. Keine offene Entscheidung.

---

## K3 Treffer und Trefferreaktionen → Analyst E (nur Bestand)

Bestand: Trefferblitz (`flashAlpha`, 130 ms), Posen `hit`/`kb`, Taumeln, Standfestigkeit (`poiseUntil`), `FEEL`, Hit-Stop, `camShake`, Krit-Zoom, Klang nach Material. **Zuständig: Analyst E.**
Hinweise an E aus dieser Analyse:
- `camStep` würfelt das Wackeln mit `rnd()` (Spielzufall) — sollte `vrnd` sein (Audit C5); jede neue Wackel-Stärke verschiebt sonst Proben.
- Rückmeldung „Treffer wirkt nicht“ (Knochenritter von vorn, Geist körperlos, Aschdämon feuerfest) ist heute Wort-Float → als Glyphe in K1-S2 vorgesehen; E sollte die zugehörige Abprall-Bewegung liefern.

---

## K4 Status (Brennen, Frost, Gift, Blutung, Gefesselt, Schock, Raserei …)

**Problem:** Am Gegner sieht man nicht, ob er brennt, vergiftet oder vereist ist — nur einen Partikelstoß beim Auftragen. Frost stapelt bis 3 (bei 3 eingefroren) — unsichtbar. Der Spieler sieht seinen eigenen Status nur im HUD.
**Inspiration:** Diablo (Figur brennt sichtbar, Frost färbt blau), PoE (Statusfarbe auf dem Körper), Hades (kleine Statuszeichen über dem Kopf), Darkest Dungeon (Status-Symbole unter der Figur).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | Kleine Statusglyphen über dem Kopf (5×5 wie `ROLE_GLYPH`) | +0,005 ms je Glyphe | Gut, aber Kopf-Platz wird eng (N10) |
| 2 | Körper-Tönung (orange flackernd, blau, grünlich) über `tinted` | Tönungs-Cache LRU 200 → Gefahr des Verdrängens | Mittel: Cache-Druck in Schlachten |
| 3 | **Partikel am Körper, gedrosselt:** Flammenpixel steigen, Eiskristalle, Giftbläschen, Blutstropfen (gibt es schon beim Laufen) | `fx` ~1–3 je Sekunde je Figur | Sehr gut, diegetisch |
| 4 | Farbiger Ring am Boden unter der Figur | +0,01 ms | Lesbar, aber UI-haft |
| 5 | **Status als Haltung:** Eingefroren = starr (keine Atem-Bilder), Frost = langsamer Bildtakt, Brennen = fuchteln | Bildtakt ändern ±0 | Sehr gut, nutzt vorhandene Posen |
| 6 | **Frost-Stapel als Eisrand** an den Füßen (1–3 Stufen) | wenige fillRect | Sehr gut, zeigt eine verborgene Regel |
| 7 | Nur am gewählten Ziel (Rechtsklick) | ±0 | Gut als Ergänzung zu 1 |
| 8 | Wort-Floats (heute) | — | zu wenig |
| 9 | Statusliste im Kontextfeld rechts | DOM | Gut für Genauigkeit, nicht für Gefühl |
| 10 | Klangschleife (Knistern) | sfx | Mittel |

**Wahl:** **3 + 5 + 6**, dazu **1 nur für das gewählte Ziel und Bosse** (7) und 9 als genaue Auskunft.

**FEATURE IMPACT REPORT K4**
- Betroffene Systeme: game.js Status-Tick in `tickCombatant` (`burning`, `poisoned`, `bleeding`, `frost.stacks`, `chilled`, Schock, `rooted`), `applySpellStatus`, `addStatus`; sprites.js `poseOf` (Bildtakt); render.js `drawFx`, `drawCreature`/`drawHumanoidR` (Eisrand); ui.js `renderContext` (Ziel), `statusIcons`; coop.js (Status nicht im Delta → Gast sieht nichts).
- Vorhanden: alle Zustände mit Dauer und Stapeln; Partikeltypen fire/frost/necro/blood.
- Fehlt: gedrosselter Emitter je Zustand (Darstellungszufall `vrnd`); Eisrand; Statusfeld im Koop-Delta.
- Persistenz: Status ist Teil der Figur (gespeichert) — Darstellung leitet nur ab.
- Risiken: Blutspur nutzt heute `chance()` (Spielzufall) — beim Umbau auf `vrnd` umstellen, dann aber Proben prüfen (Reihenfolge der Zufallszahlen ändert sich); Partikeldeckel in großen Schlachten.
- Plan: S1 Emitter (3) + Frost-Rand (6) · S2 Haltung (5) · S3 Ziel-Glyphen und Kontextfeld · Debug „Status am nächsten Gegner: Brand/Frost 1–3/Gift/Blutung“.

**OFFENE DESIGNENTSCHEIDUNGEN K4**
1. Sollen fremde Kämpfer (Gefährten, NPC-Schlachten) dieselben Status-Partikel zeigen? Empfehlung: ja, aber nur in Spielernähe.

---

## K5 Ausweichen, Block, Parade, Riposte, offenes Fenster

**Problem:** Die feinsten Kampfregeln (Parade-Fenster 180 ms, eine Parade je Deckung, Riposte 1,2 s, Abwehr ab Verteidigung 40, gebrochene Deckung, offener Gegner +25 %) zeigen sich als Wörter oder gar nicht. Ob man gerade eine Riposte hat oder der Gegner offen ist, sieht man nicht.
**Inspiration:** Sekiro/Dark Souls (Funken, Klang, Haltung), For Honor (Block-Richtung sichtbar), Hades (kurzer Blitz bei perfektem Ausweichen), Mount & Blade (Blockgeräusch statt Text).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Wörter → Glyphen** (K1-8) | billiger | Pflicht |
| 2 | **Parade:** Funkenkreis am Klingenkontakt + eigener heller Klang („ting“) | ±0 | Sehr gut |
| 3 | **Block:** Schild glimmt kurz, Staubschub hinter dem Blockenden | ±0 | Sehr gut |
| 4 | Ausweichen: Nachbild (gibt es) + Windlinien | ±0 | Gut |
| 5 | Zeitlupe bei perfekter Parade | → E | — |
| 6 | Parade-Fenster sichtbar (kurzer Ring beim Heben der Deckung) | ±0 | Gut als Lernhilfe; evtl. nur Angsthase |
| 7 | **Riposte-Bereitschaft:** Klinge glimmt, solange `riposteUntil` läuft | ±0 | Sehr gut, macht eine versteckte Regel sichtbar |
| 8 | **Offener Gegner** (`exposed`, nach schwerem Angriff/Parade): kurzes Taumel-Glitzern über dem Kopf | ±0 | Sehr gut („jetzt zuschlagen“) |
| 9 | Abwehr durch Verteidigungs-Fertigkeit: kurzes Klingen-Kreuz | ±0 | Gut |
| 10 | **Deckung gebrochen** (Wucht/`crush`): Splitter + Riss-Glyphe | ±0 | Sehr gut |

**Wahl:** **1 + 2 + 3 + 7 + 8 + 10**, 9 als Glyphe; 6 offen; 5 → E.

**FEATURE IMPACT REPORT K5**
- Betroffene Systeme: game.js `guarded`, `updateGuard`, `evaded`, `hit` (Block, Abgewehrt, Schild, Knochenritter), `heavyTick` (`exposed`), Waffenfeld `riposte`; render.js `drawWeaponR` (Glimmen), `drawFx`; sfx.js `metal` (neuer Ton „ting“ = Klang-Variante).
- Vorhanden: alle Zustände (`riposteUntil`, `exposed`, `g.since`, `cov === 'broken'`).
- Fehlt: Darstellung der Fenster; Koop-Felder (`exposed`, `riposteUntil` nicht im Delta).
- Persistenz: keine.
- Risiken: Glimmen der Waffe in Stil R hängt an `drawWeaponR` (E arbeitet an Waffenbildern) → Abstimmen, wer das Glimmen zeichnet; keine Regeländerung an Fenstern.
- Plan: S1 Glyphen + Parade/Block-Effekte · S2 Riposte/Offen/Gebrochen · Debug „Gegner offen setzen“, „Riposte bereit“.

**OFFENE DESIGNENTSCHEIDUNGEN K5**
1. Parade-Fenster als Ring sichtbar (Variante 6)? Empfehlung: nur auf Angsthase.

---

## K6 Fähigkeiten (Rückmeldung; Bewegungsprofil der Magie → E)

**Problem:** Die Leiste zeigt Fähigkeiten als **Wort** im Feld. Fehlschläge (kein Mana, Energie leer) kommen als Toast-Satz. Titelressourcen (Fokus 5, Seelenessenz 6, Verderbnis, Wildkraft, Stammesmut, Blutdurst) stehen nur im HUD.
**Inspiration:** WoW/FFXIV (Symbol + Abklingkreis + „bereit“-Blitz), Diablo (Ressourcenkugel), Hades (Fehlschlag = Klang + Rütteln), GW2 (Zauberkreis am Boden wächst).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Symbol statt Wort** auf der Leiste (Pixel-Piktogramm je Fähigkeit/Schule) | DOM-Canvas, gecacht | Sehr gut — passt zum UI-Umbau (Piktogramme) |
| 2 | **Rune wächst mit der Sammelzeit** (Fortschritt im Ring statt nur Drehen) | ±0 | Sehr gut, zeigt Unterbrechbarkeit |
| 3 | **Fehlschlag am Ort:** Slot rüttelt, dumpfer Klang, Figur „greift ins Leere“ statt Toast | ±0 | Sehr gut |
| 4 | **Ressourcen-Punkte an der Figur** (z. B. 5 Fokuspunkte als kleine Lichter, Seelen als Flammen) — nur im Kampf | +0,01 ms | Sehr gut, Titelklassen werden fühlbar |
| 5 | Gegner-Zauber: Rune + feine Linie zum Ziel | ±0 | Gut (Ansage für den Spieler) |
| 6 | Großes Banner bei Ultimate | DOM | Nein, Text |
| 7 | Rune flackert, solange ein Treffer den Zauber bricht | ±0 | Gut (Teil von 2) |
| 8 | Reichweiten-/Flächenvorschau beim Halten der Taste | Eingabe-Änderung | Neue Steuerung → offen |
| 9 | Kettenzähler | — | Nein |
| 10 | Klangsignatur je Schule | sfx-Varianten | Gut |

**Wahl:** **1 + 2 + 3 + 4 + 5**, 10 mit Klang; 8 offen.

**FEATURE IMPACT REPORT K6**
- Betroffene Systeme: ui.js `renderHotbar`, `statusIcons`; game.js `useSlot`, `useAbility`, `startCast`, `castTick`, `interruptCast`, Titelressourcen (`tres`, `setTres`), Energie-/Mana-Prüfungen in `attack`; render.js Rune in `drawHumanoidAt`; icons.js/iconsR.js (Piktogramme — UI-Umbau läuft).
- Vorhanden: Schulfarben (`SCHOOL`), Rune, Ressourcenwerte, Abklingwerte.
- Fehlt: Fähigkeits-Piktogramme (79 Fähigkeiten); Ressourcenanzeige an der Figur; Fehlschlag-Rückmeldung.
- Persistenz: keine.
- Risiken: 79 Piktogramme sind viel Zeichenarbeit (im Code, Sperre für Generatoren gilt) → Schulsymbol + Grundform als erste Stufe; Überschneidung mit UI-Umbau (Kopfleiste) und mit E (Magie-Bewegung).
- Plan: S1 Fehlschlag am Ort + wachsende Rune · S2 Ressourcenpunkte · S3 Leisten-Piktogramme (Schule + Form) · S4 Einzelpiktogramme.

**OFFENE DESIGNENTSCHEIDUNGEN K6**
1. Zielvorschau beim Halten (8)? Empfehlung: später, eigene Steuerungsfrage.

---

## K7 Abklingzeiten

**Problem:** Abklingen nur als dunkles Feld in 250-ms-Stufen auf einem Wort-Feld; kein Signal, wenn etwas wieder bereit ist; die Ausweichrolle (850 ms Abklingzeit) hat keine Anzeige.
**Inspiration:** WoW (Uhrzeiger-Abdeckung + Blitz), Hades (Leiste am Charakter für Dash), Diablo (Zahl in Sekunden bei langen Zeiten).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Uhrzeiger-Abdeckung** (Kreissektor) statt Balken | DOM/Canvas klein | Sehr gut |
| 2 | **Bereit-Blitz** + leiser Klang beim Ablauf | ±0 | Sehr gut |
| 3 | Sekundenzahl nur bei langen Abklingzeiten | ±0 | Gut, Schwelle = Darstellungsfrage |
| 4 | **Rolle als kleiner Bogen an der Figur** (nur nach Benutzung) | +0,005 ms | Gut, die Rolle ist die wichtigste Abklingzeit |
| 5 | Grau statt dunkel | ±0 | Zu schwach allein |
| 6 | Feinere Aktualisierung (je Bild statt 250 ms) | DOM-Last | Nein (PERF-S) — Canvas-Overlay statt DOM |
| 7 | Abklingpunkte über dem Kopf | Kopf-Platz | Nein |
| 8 | Leiste pulsiert, wenn alles bereit | ±0 | Mittel |
| 9 | Sortierung nach Bereitschaft | Verwirrt | Nein |
| 10 | Klang beim Drücken während Abklingen (dumpf) | ±0 | Gut, verbindet mit K6-3 |

**Wahl:** **1 + 2 + 4 + 10**, 3 offen.

**FEATURE IMPACT REPORT K7** — Systeme: ui.js `renderHotbar` (Signatur `hbSig`), game.js `p.cooldowns`, `dodge` (`dodgeCd`), Abklingwerte `ABILITIES.cd`; DOM-Kosten (PERF-S). Vorhanden: Werte. Fehlt: Sektor-Overlay ohne DOM-Neubau je Bild (Canvas oder CSS-Variable). Risiken: DOM-Neubau je Bild würde PERF-S zurückwerfen. Plan: S1 Sektor + Blitz · S2 Rollenbogen. **Offen:** Ab welcher Dauer Sekunden anzeigen? Empfehlung: ab mehreren Sekunden, im Spiel abstimmen (Darstellung, keine Regel).

---

## K8 Ausdauer

**Problem:** Ausdauer steuert Laufen, Rolle, Hiebe, Deckung — die Anzeige ist links im HUD, weit weg vom Blick. Bei leerer Ausdauer kommt fast nie eine Rückmeldung (Toast mit 2 % Chance, und dafür wird der Spielzufall verbraucht). Gegner ermüden auch (`ESTA`), sichtbar erst als Wort „erschöpft“.
**Inspiration:** Zelda BotW (Ausdauerrad an der Figur, nur wenn nötig), Dark Souls (Balken + Keuchen), Kenshi (Haltung zeigt Erschöpfung), For Honor (Gegner-Ausdauer sichtbar am Gegner).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Ausdauerbogen an der Figur**, erscheint nur im Kampf oder wenn nicht voll | +0,01 ms | Sehr gut |
| 2 | Keuchen-Haltung + Atemwölkchen bei wenig Ausdauer | `fx` gedrosselt | Gut |
| 3 | **Fehlschlag sichtbar:** Waffe sinkt, Keuchlaut, Bogen blinkt rot — immer, nicht zu 2 % | ±0 | Pflicht |
| 4 | **Gegner-Erschöpfung als Haltung** (wankt, Kopf gesenkt) + Glyphe statt Wort | ±0 | Sehr gut |
| 5 | Kosten-Vorschau: Teil des Bogens leuchtet, den der nächste Hieb kostet | ±0 | Gut, aber Info-Dichte |
| 6 | HUD-Balken blinkt | DOM | Zusätzlich ok |
| 7 | Figur färbt sich | Cache | Nein |
| 8 | Vignette bei leer | +0,05 ms | Unruhig |
| 9 | Sichtbares Schleppen beim Laufen mit 0 | → E | — |
| 10 | Herzschlag-Klang (gibt es) bei leer | ±0 | Gut, sparsam |

**Wahl:** **1 + 3 + 4**, 2 und 10 als Verstärkung; 5 offen.

**FEATURE IMPACT REPORT K8**
- Betroffene Systeme: game.js `attack` (Ausdauerprüfung, Toast mit `chance(0.02)`), `dodge`, `updateGuard`, `enemyStamina` (`ESTA`, Float „erschöpft“), Laufkosten; ui.js `refreshHUD`; render.js (Bogen an der Figur); sfx.js `heartbeat`.
- Vorhanden: Werte für Spieler und Gegner; Erschöpfungszustand beim Gegner (`stagger`).
- Fehlt: Bogen-Zeichnung; Fehlschlag-Rückmeldung ohne Spielzufall.
- Persistenz: keine.
- Risiken: **Den `chance(0.02)`-Aufruf zu entfernen ändert die Zufallsfolge** → betroffene Proben vorher prüfen (CLAUDE.md „Probes and RNG“); Gegner-Ausdauerbogen würde einen bisher verborgenen Wert zeigen → offen.
- Plan: S1 Fehlschlag sichtbar (ohne `rnd`) · S2 Spielerbogen · S3 Gegner-Haltung · Debug „Ausdauer 10 %“.

**OFFENE DESIGNENTSCHEIDUNGEN K8**
1. Gegner-Ausdauer als Bogen zeigen oder nur als Haltung? Empfehlung: nur Haltung (Kenshi-Gefühl), Bogen nur beim gewählten Ziel.

---

## K9 Schwere Angriffe mit Ansage

**Problem:** Die Bodenmarke ist da, aber sie zeigt nicht, **wann** der Schlag kommt (sie pulsiert gleichmäßig). Dazu ein Wort-Float. Laut Code ist ein schwerer Angriff blockbar (über `hit`), eine Fläche (`areaHit`) nicht — das sieht man nicht. Koop-Gäste sehen die Bodenmarke vermutlich nicht (`special` fehlt im Delta).
**Inspiration:** WoW/FFXIV (Bodenfläche füllt sich bis zum Einschlag), Sekiro (Gefahrenzeichen über dem Kopf = nicht blockbar), Hades (rote Fläche + Klang-Anstieg), Monster Hunter (Ausholpose lesbar).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Füllende Bodenmarke:** innen wächst die Fläche, voll = Einschlag | ±0 | Sehr gut, zeigt Timing |
| 2 | **Aufblitzen an der Waffe** kurz vor dem Schlag | ±0 | Sehr gut (letzte Warnung) |
| 3 | **Warnglyphe** über dem Kopf statt Wort („holt weit aus“) | ±0 | Sehr gut |
| 4 | Klang-Anstieg während des Ausholens | sfx | Gut |
| 5 | **Farbcode nach Abwehr:** rot = nur ausweichen (Fläche), orange = blockbar (schwerer Hieb) | ±0 | Sehr gut — **nur wenn die heutige Regel so gewollt ist** |
| 6 | Stärkere Ausholpose | → E | — |
| 7 | Kamera zoomt leicht heraus | → E | — |
| 8 | **Offenes Fenster danach sichtbar** (K5-8) | ±0 | Sehr gut |
| 9 | Bodenriss-Abdruck nach dem Slam | Decal | Gut, Stimmung |
| 10 | Zeitlupe | → E | — |

**Wahl:** **1 + 2 + 3 + 8**, 4 und 9 ergänzend; **5 erst nach Entscheidung**; 6/7/10 → E.

**FEATURE IMPACT REPORT K9**
- Betroffene Systeme: game.js `startHeavy`, `heavyTick`, `areaHit`, `MONSTERS.heavy` (7 Arten), `diffOf().tele`; render.js `drawCreature` (stomp/beam), `telegraphArc`, `dottedLine`; coop.js `DYN` (+`special`/`heavy`); sfx.js.
- Vorhanden: Form, Dauer (`H.wind × tele`), Restzeit (`special.t/T`), offenes Fenster (`exposed`).
- Fehlt: Füllstand-Zeichnung aus `t/T`, Glyphe, Koop-Feld.
- Persistenz: keine.
- Risiken: Farbcode würde eine Regel lehren, die evtl. unbeabsichtigt ist (Block gegen schwere Angriffe); Koop.
- Plan: S1 Füllen + Glyphe + Waffenblitz · S2 Koop-Übertragung · S3 Farbcode nach Entscheidung · Debug „schwerer Angriff jetzt (nächster Gegner)“.

**OFFENE DESIGNENTSCHEIDUNGEN K9**
1. **Sind schwere Angriffe absichtlich blockbar** (Code: `heavyTick` → `hit`, Deckung/Schild wirken), oder sollen sie wie Flächen nur ausweichbar sein (MECHANIKEN-Text)? Empfehlung: Entwickler entscheidet; danach Farbcode einführen.

---

## K10 Bossmechaniken

**Problem:** Die Boss-Leiste markiert immer 50 %, auch wenn ein Boss bei 60 % oder 30 % wechselt (Aldhelm). Mechaniken wie Blutfesseln (gefangene Bürger heilen Aldhelm) oder Lichtschächte werden über Log/Doku erklärt, nicht im Bild.
**Inspiration:** WoW (Phasenmarken, sichtbare Mechanik-Fäden), FFXIV (Arena-Zeichen), Hades (Phasenwechsel als kleiner Moment), Darkest Dungeon (Boss-Teile sichtbar).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Phasenmarken an den echten Schwellen** je Boss | ±0 | Pflicht (Daten liegen in der Boss-Logik) |
| 2 | **Mechanik-Fäden:** sichtbare Blutfäden von Gefangenen zu Aldhelm, reißen beim Befreien | +0,02 ms je Faden | Sehr gut, erklärt ohne Text |
| 3 | **Boss-Zustandsglyphen** unter der Leiste (geschützt, verwundbar, heilt) | ±0 | Sehr gut |
| 4 | **Phasenwechsel-Moment** (kurz knien/aufbrüllen, Rüstung bricht) ohne Pause | ±0 | Sehr gut; Pause gibt es nur beim Auftritt (Entscheidung 4–6 s) |
| 5 | Arena-Zeichen (Lichtschacht leuchtet stärker, wenn der Boss nah ist) | `lightOf` | Gut |
| 6 | Verwundbarkeitsfenster: Boss glimmt | ±0 | Gut (K5-8) |
| 7 | Wut-Timer | neue Regel | Nein |
| 8 | **Boss-Rüstung zerbricht sichtbar** je Phase (R6) | Spec-Wechsel je Phase | Sehr gut |
| 9 | Hilfe-Rufe als Blasen („Die Käfige!“ von Brandt/Gardisten) | ±0 | Gut, nutzt N1 |
| 10 | Klangmotiv je Phase | sfx | Mittel |

**Wahl:** **1 + 2 + 3 + 4 + 8**, 9 wo Verbündete da sind.

**FEATURE IMPACT REPORT K10**
- Betroffene Systeme: render.js `drawBossBar`; game.js Boss-KI (`frostKingAI`, `whitebeardAI`, Garmadon-Phasen, Omega-Wellen, Aldhelm-Kampf mit Blutfesseln/Lichtschächten/Blutsiegeln, Dodon), `bossIntro`/`BOSS_CARDS`; sprites.js `monsterSpec` (Boss-Look je Phase); coop.js (`phase` nicht im Delta).
- Vorhanden: `b.phase`, Schwellen in der Logik, Ansage-Flächen.
- Fehlt: zentrale Phasenliste je Boss (für die Leiste), Faden-Zeichnung, Glyphen.
- Persistenz: keine (Boss-Zustand ist ohnehin flüchtig im Kampf).
- Risiken: Phasenschwellen stehen verstreut im Code — beim Sammeln nichts ändern; Spec-Wechsel = neuer Cache-Eintrag je Phase (wenige Bosse, vertretbar).
- Plan: S1 Phasenmarken + Glyphen · S2 Aldhelm-Fäden (Vorlage für weitere) · S3 Phasenmoment + Rüstungsbruch · Debug „Boss: Phase setzen“.

**OFFENE DESIGNENTSCHEIDUNGEN K10** — keine neue Regel; Phasenmoment ohne Pause (Entscheidung „Pause nur beim Auftritt“ gilt).

---

## K11 Tod

**Problem:** Gegnertode sind gut gelöst (9 Arten). Ein Bosstod ist nur Toast + Chronik — der größte Moment eines Kampfes ist der schwächste Moment im Bild.
**Inspiration:** Dark Souls („Feind gefallen“ + Licht), Hades (Boss zerfällt in einer Einstellung), Diablo (Beute-Explosion — passt nicht), Darkest Dungeon (schwerer Ton, Pause).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Boss-Todesmoment** wie beim Heldentod (kurz langsam, Glocke/Horn, Namenskarte „GEFALLEN“), ESC überspringt | ±0 (System T10 + `nameCard` vorhanden) | Sehr gut |
| 2 | **Letzter Treffer markiert** (kurzer Blitz, eigener Klang) | ±0 | Gut → Timing mit E |
| 3 | Seele/Atem steigt auf (Totenland) | `fx` | Gut, Stimmung |
| 4 | **Waffe fällt sichtbar** aus der Hand (Beute-Waffe als Bodenobjekt landet mit Bogen) | ±0 | Gut, verbindet mit Items (Prio 5) |
| 5 | Lichtsäule auf Beute | → Items | — |
| 6 | Mehr Todesarten je Volk | anim.js Daten | Gut, später |
| 7 | Leichen bleiben länger | Regelwert (20 s) | Offene Entscheidung, nicht hier |
| 8 | Totenstille im Klang | ±0 | Gut mit 1 |
| 9 | Kill-Zähler | — | Nein |
| 10 | **Ergeben vs. sterben** klar unterscheiden (Ergebene knien mit erhobenen Händen = Geste) | ±0 | Sehr gut (T08 Gefangene) |

**Wahl:** **1 + 10 + 4**, 3/8 als Stimmung; 2 → E.

**FEATURE IMPACT REPORT K11** — Systeme: game.js `die` (Boss-Zweig: Ruhm, Chronik, Toast), `playerDeath`/T10-Moment (`S.dying`), `nameCard`, `cinematic`, T08 (`surrendered`), `dropLoot`; anim.js. Vorhanden: Moment-Technik, Namenskarte, Ergeben-Zustand. Fehlt: Boss-Variante des Moments; Ergeben-Haltung. Risiken: Kein Schaden während des Moments (GATE §9) — T10 hat das schon für die Gruppe gelöst, muss für Boss-Moment gelten; Koop (Gäste sehen Kamerafahrten mit). Plan: S1 Ergeben-Haltung · S2 Boss-Moment · S3 Waffe fällt. **Offen:** Boss-Moment Dauer (Entscheidung T10 = 3 s für Heldentod; Empfehlung: gleiche Länge).

---

## K12 Gegner sichtlich verwundet

**Problem:** Menschenähnliche Gegner zeigen Blut ab 50 %/25 % und ausgefallene Glieder — gut. Tiere (Wolf, Bär, Keiler) zeigen nichts. Es gibt keine Lebensbalken (außer Boss), also muss der Körper die ganze Information tragen.
**Inspiration:** Kenshi (Humpeln, Kriechen, Blut — keine Balken), RDR2 (verwundete Haltung), Monster Hunter (Monster humpelt = fast tot), Diablo (Balken über Kopf).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Blutstufen auch für Tiere** (`beastFrame` + `bloodOf`) | Cache: ×3 Tierbilder | Sehr gut, schließt Lücke |
| 2 | **Verwundeten-Haltung:** unter 25 % gebückt, Hand an der Seite | +1 Pose | Sehr gut (teilt sich N4-6) |
| 3 | **Humpeln für Gegner** mit Beinschaden (Gangbild, das der Held schon hat) | ±0 | Sehr gut |
| 4 | Rüstungsteile fallen ab (Helm bei < 25 %) | Spec-Wechsel | Mittel; Cache |
| 5 | Mini-Lebensbalken nur beim gewählten Ziel oder unter der Maus | +0,01 ms | Gut als Ergänzung |
| 6 | Gar keine Balken (heute) | 0 | Funktioniert nur mit 1–3 |
| 7 | Keuchen/Atemwolke | `fx` | Gut, sparsam |
| 8 | Blutspur auch für Gegner, die bluten (gibt es über Status) | vorhanden | — |
| 9 | Farbe blasser mit sinkendem Leben | Tönungs-Cache | Nein (Cache) |
| 10 | **Hinrichtbar-Zeichen** wenn eine Henker-Waffe (`execute`) wirkt | ±0 | Sehr gut, zeigt bestehende Regel |

**Wahl:** **1 + 2 + 3 + 10**, 5 nach Entscheidung; 4 später (R6/K10 für Bosse).

**FEATURE IMPACT REPORT K12**
- Betroffene Systeme: sprites.js `bloodOf`, `msOf`, `monsterSpec`, `beastFrame`; fig5.js `wear`, Tierzeichnung (`BEASTR`); body.js (Beinzustand, `speedFactor`); game.js `weaponMult` (`execute`); render.js `drawCreature`.
- Vorhanden: Blutstufen (Menschen), Gliederzustände, Henker-Regel mit Schwelle in den Waffendaten.
- Fehlt: Tier-Blutstufen, Verwundeten-Pose, Gegner-Humpeln, Hinrichtbar-Zeichen.
- Persistenz: keine (aus Leben/Körper abgeleitet).
- Risiken: Frame-Cache der Tiere wächst ×3 (Varianten `beastVar` × Blut) — messen; Monster ohne `body` brauchen Ersatz für „Bein“.
- Plan: S1 Hinrichtbar-Zeichen + Gegner-Humpeln · S2 Tier-Blut · S3 Verwundeten-Pose · Debug „nächsten Gegner auf 40 %/20 %“.

**OFFENE DESIGNENTSCHEIDUNGEN K12**
1. Lebensbalken über Gegnern: nie / nur Ziel+Maus / immer? Empfehlung: nur beim gewählten Ziel (Rechtsklick) — der Körper bleibt die Hauptanzeige.

---

## Gesamtplan Kampf-Feedback (Scheiben)
1. **Fundament:** Bitmap-Ziffern + Glyphen + Typfeld am Float (K1), Koop-Felder (`special`, Status, `exposed`), Darstellungszufall auf `vrnd` (mit Probenprüfung).
2. **Ansagen lesbar:** füllende Bodenmarke, Warnglyphe, Waffenblitz (K9); offenes Fenster, Riposte, gebrochene Deckung (K5).
3. **Zustände am Körper:** Status-Partikel und Frost-Rand (K4), verwundete Gegner (K12), Ergeben-Haltung (K11).
4. **Ressourcen am Helden:** Ausdauerbogen + Fehlschlag (K8), Rollenbogen + Abklingsektor (K7), Ressourcenpunkte (K6).
5. **Bosse:** Phasenmarken, Fäden, Glyphen, Phasenmoment, Boss-Todesmoment (K10, K11).
Jede Scheibe mit Debug-Eintrag, MECHANIKEN-Zeile, Kodex-Legende der Glyphen, Probe, Messung (`perf/bench.js`, Szene mit großer Schlacht).

**STATUS: TEILWEISE DEFINIERT** — ohne Entscheidung umsetzbar: K1-S1/S2, K2, K4-S1, K5-S1/S2, K6-S1, K7-S1, K8-S1, K9-S1, K10-S1, K12-S1. Wartet: Standard Schadenszahlen (K1), Gegner-Lebensbalken (K12), Blockbarkeit schwerer Angriffe (K9), Gegner-Ausdauer sichtbar (K8).
