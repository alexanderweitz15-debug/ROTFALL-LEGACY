# Kampfanimation — Scheibe 1 (IMPL-KAMPFANIM, 02.10.2026)

Auftrag: COMBAT_ANIM.md, Analyse `visual/kampfanimation.md` §5/§6, Entscheidungen DECISIONS.md „Kampfanimation“ (02.10.).
Bilder: `visual/img/kampf_s1_langschwert_phasen.png` (Blick Ost, Pack A/B/C × Schlag 1/2/Wucht × 11 Stützstellen, rot = Einschlag-Bild = Schaden),
`visual/img/kampf_s1_langschwert_sued.png` (Blick Süd).

**STATUS: TEILWEISE** — Infrastruktur, Schaden im Einschlag, Kombo-Kette, Test Room und Langschwert A/B/C laufen; Vollständigkeitsprüfung §17 für das
Langschwert ist nicht erfüllt (Liste unten), Scheibe 2 nicht begonnen. **STOPP-Punkt (COMBAT_ANIM §19):** das beschlossene Abbrechen der Erholung
hebt den Schaden je Sekunde im Stand um ~20–50 % und macht die Probe „Balancing (§82)“ rot — Entwickler muss entscheiden (siehe §4).

## 1. Gebaut (bestehendes System erweitert, kein zweites Animationssystem)
| Teil | Ort | Was |
|---|---|---|
| Daten | `anim.js ANIM_DEFS.attack.sword` | 5 Formen (Vorhand, Rückhand, Überkopf, Wirbel, Doppelwirbel) über der Formzeit u; Packs A/B/C = Form je Kombo-Schritt, Ausholen `w`, Treffer `h` (Anteile des Takts), Effekte (`stop, shake, trail, push, slash, after, fin`) |
| Rechenhilfen | `anim.js` | `atkPlan` (Form, w, h, Abbruchpunkt c), `atkU` (Takt → u), `snapU`, `ATK_U` (11 feste Stützstellen), `atkShape`, `legacyTiming`/`legacySw` (alte Kurven auf dieselben Anker) |
| Eine Wahrheit | `fig5.swingOf/phaseOf`, `game.swingHit`, `render.atkTiming` | alle lesen dasselbe `h`: u = 0,5 ist das Einschlag-Bild, `swingHit(c) = c.atkH`; `snapU` nimmt die Stützstelle ≤ u → das Einschlag-Bild erscheint nie vor dem Schaden |
| Schaden im Einschlag | `game.attack` | jeder Nahkampf-Schwung über `attack()` bekommt `atkS/atkW/atkH/atkC/atkStep/atkPk`; Klassen ohne eigenes Profil (Zweihänder, Axt, Kolben, Hammer, Stange, Speer, Dolch, Rapier, Peitsche, Stab) treffen am Ende ihres Schlags (Stoß: volle Streckung). Takt (`it.speed`, Übung, swift) unverändert. Gegner treffen weiter bei 0,42 — ihr Bild folgt ihrem Treffer (keine Balance-Änderung für Gegner, E4) |
| Kombo-Kette | `game.attack/comboStep` | Schritt 0 Vorhand → 1 Rückhand (aus Endlage) → 2 Wucht (Überkopf; B Wirbel, C Doppelwirbel als Finisher-Animation); Wucht **+15 % Dauer** (Doku war vorher falsch); Erholung ab Treffer + 40 % (Punkt aus Pack A, gleich für alle Packs) durch den nächsten Kombo-Schlag abbrechbar, Wucht nie |
| Hiebvariante | `render.swingVar` | kein `Math.random` mehr: Kombo-Schritt bzw. reihum (Host = Gast) |
| Ausfallschritt | `game.tickCombatant` | gleitet über die Schlagphase, gleiche Strecke, fertig im Einschlag; Laufgeschwindigkeit bleibt unberührt (kein Lauf-Bild, Kombo bleibt) |
| Impact-Sync | `game.hit/atkImpact`, `render.drawHumanoidR/drawSlash` | Hit-Stop × `stop`, Wackeln × `shake` (Pack), Stern/Klang aus dem bestehenden System; B/C Finisher: Ring, C zusätzlich Druckwelle, Kamerastoß, Krit-Klang. Sichelbogen, Vorschub (`push` px, per Verschiebung), Nachbilder (C, `flashOf` des vorhandenen Bildes) und Wirbel-Körperdrehung zeichnet render.js aus dem Schwungzustand — auch beim Koop-Gast (Optik lokal) |
| Frame-Cache | `sprites.js` | kein Pack-Schlüssel: Bilder nur an den 11 Stützstellen (W.q = u-Stützstelle, W.v = Form); fehlt ein Schwungbild, werden die übrigen Stützstellen des Hiebs in Pausen nachgebacken; `warmSwingR` backt im Test Room alle 8 Zielachtel vor; `warmRNow` (Messung) |
| Koop | `coop.js DYN` | + `atkS, atkW, atkH, atkPk, atkStep` (Trefferzeit nach Host-Pack, Kombo-Schritt übertragen) |
| Test Room | `game.js arenaEnter/arenaLeave/arenaUpdate/animDebug` | Karte `__arena` (Muster styleArea/duel/simFight), eigene kleine Schleife (Welt steht), Leihwaffe (5 Testwaffen oder eigene), Übungspuppe, zurückschlagende Puppe, Gruppe, Zeitlupe ×0,25, Pack A/B/C; Held unverwundbar; nie gespeichert (guardSave + `_quiet`); beim Verlassen Held + geänderte Zustandsschlüssel auf den Stand beim Betreten; Pack zurück auf A; `travel()` verlässt den Raum zuerst |
| Debug | Abschnitt „Kampfanimation (Combat Test Room)“ | „Kampfanimation: Test Room betreten/verlassen, Waffe wechseln, Pack setzen, Zeitplan anzeigen, Übungspuppe, Puppe schlägt zurück, Gruppe, Puppen entfernen, Zeitlupe, Schwungbilder vorbacken, alte Taktung zum Vergleich“; `RF.arena.*` (enter, leave, weapon, foe, warm, plan, tick) |
| Vergleich | `S.dbg.atkOld` | `true` = alte Taktung (0,42, kein Abbruch, Wucht ohne +15 %), `'cancel'` = nur Abbrechen aus — nur Debug, nie gespeichert |
| Mess-Hilfe | `duel(..., { vclock, trace: 2 })` | optional Kampfzeit-Uhr wie simFight; `trace: 2` protokolliert jede Lebensänderung des Helden (Probe unverändert) |
| Hinweis | Log | erster Wuchtschlag erklärt Abbrechen und +15 %; Log beim Betreten des Test Rooms |
| Doku | `docs/MECHANIKEN.md` | Abschnitt „Kampfanimation, Scheibe 1“ |

### Langschwert-Zeitplan (Takt 560 ms, Wucht 644 ms; Ausholen-Ende / Treffer / abbrechbar ab, ms)
| | A Grounded | B Heroic | C Endgame |
|---|---|---|---|
| Schlag 1 Vorhand | 168 / **250** / 374 | 150 / **210** / 374 | 110 / **160** / 374 |
| Schlag 2 Rückhand | 130 / **210** / 350 | 110 / **170** / 350 | 80 / **130** / 350 |
| Wucht | 230 / **320** / – (Überkopf) | 200 / **320** / – (Wirbel 360°) | 193 / **290** / – (Doppelwirbel) |
| Hit-Stop / Wackeln | 50 ms / 3 | 70 / 4 | 90 / 5 + Kamerastoß im Finisher |
| Optik | Spur 6, Vorschub 1 px | Spur 8, Vorschub 3 px, Sichelbogen, Finisher-Ring | Spur 10, Vorschub 7 px, Nachbilder, große Sichel, Druckwelle |
Vorher: Treffer bei 235 ms (Klinge noch vor dem Ziel); Hammer 483 ms (noch im Ausholen) → jetzt 575; Zweihänder 412 → 490; Dolch 126 → 135; Speer 269 → 288.

## 2. Proben (Selbsttest)
Neu, alle grün: „Kampfanimation Scheibe 1: Schaden fällt im Einschlag-Bild, nie davor“ (Langschwert A/B/C, Dolch, Speer, Kriegshammer; Bild-Stützstelle beim
Schaden = 0,5, davor < 0,5; Vorhand/Rückhand queren die Zielachse erst im Einschlag) · „… Kombo-Kette“ (Schritte 0/1/2, Wucht ×1,15, vor Treffer + 40 % kein
Abbruch, danach ja, Wucht nie; Abbruchpunkt in B/C gleich A) · „… Combat Test Room“ (eigene Karte, `save()` liefert false auch ohne `_quiet`, Spielstand im
localStorage unverändert, Held/Waffe/Fertigkeit/Ort danach wie vorher, Karte weg, Pack wieder A). Bestehende „Hiebvarianten (S12)“, „Animation und
Kampfgefühl §5f“ grün. **Rot: „Balancing (§82)“** — Ursache gemessen (unten §4), Probe nicht verändert.

## 3. Messwerte
### simFight (Bandit, smart, Seeds 1–3; gleiche Code-Basis, „vorher“ = `S.dbg.atkOld = true`, deckt sich mit der Messung vor dem Umbau ±2)
| Waffe | Schaden/s vs Bandit St.10 (2500 LP) vorher → nachher | ohne Abbrechen | Sieg-Kampf St.8 vs St.6: Sekunden / Leben verloren vorher → nachher |
|---|---|---|---|
| Langschwert | 30,1 → 38,4 (+28 %) | 28,0 | 2,9 s / 38 % → 2,0 s / 20 % |
| Zweihänder | 29,2 → 43,1 (+48 %) | 31,3 | 3,4 / 21 → 3,4 / 14 |
| Dolch | 25,9 → 34,9 (+35 %) | 27,7 | 3,2 / 42 → 2,4 / 34 |
| Speer | 22,1 → 29,8 (+35 %) | 23,1 | 3,5 / 46 → 2,8 / 7 |
| Kriegshammer | 31,8 → 38,7 (+22 %) | 30,1 | 4,0 / 40 → 3,9 / 10 |
| Beil | 28,3 → 30,9 (+9 %) | 18,0* | 2,9 / 15 → 2,6 / 12 |
| Streitkolben | 25,8 → 30,6 (+19 %) | 30,9 | 2,6 / 15 → 2,4 / 16 |
\* Einzelwerte streuen stark (Krits, Taumeln; 3 Seeds). Treffer je Sekunde gegen eine stehende Puppe (Test Room, 15 s gehalten): Langschwert 2,13 → 2,47,
Dolch 3,8 → 4,6, Kriegshammer 1,13 → 1,33, Beil 1,67 → 2,07, Kolben 1,6 → 1,93; rechnerisch je Kette (2 × Abbruch bei 0,67–0,70 + Wucht 1,15 statt 3 × 1,0)
+18–21 % Hiebe. **Ohne Abbrechen** (nur Einschlag-Zeitpunkt, Wucht +15 %, Gleitschritt) bleiben alle Werte im Rauschen (±5–10 %).
### RF.duel Probe §82 (Stufe 3 gegen Banditen)
| | Seeds 1/2/3 (Sieg, s, % verloren) | Ø Stand / Ø Rückwärts | Probe |
|---|---|---|---|
| vorher | ✓1,4/7 · ✓5,3/10 · ✓6,4/36 | 17,7 / 42 | grün |
| nachher | ✓1,1/0 · ✓8,6/30 · ✗3,4/100 (Krit-K.o. am Kopf, 31 Schaden bei 59 LP) | 43,3 / 45 | **rot** |
| nachher ohne Abbrechen | ✓1,4/7 · ✓3,8/5 · ✓6,1/57 | 23 / 45 | grün |
| 20 Seeds nachher / vorher | 18/20 bzw. 19/20 Siege, Ø 39,8 % bzw. 41,8 % verloren, Kampf −16 % kürzer | | |
Kein Uhr-Fehler: Treffer hängt am Schwungfortschritt, nicht an `performance.now` (Probe-Protokoll: Spieler trifft bei swing 0,46/0,40/0,50 = h der Schritte).
duel läuft ohne Kampfzeit-Uhr; mit `vclock: true` gewinnt nachher jeder Seed, aber Ø 5 % Verlust (< 12 %) → auch dann rot.
### Leistung (Ziel ≤ 3 ms je Bild, kein neues Figurenbild je Bild)
| Messung | update | draw | gesamt (Median / p95) | neue Figurenbilder |
|---|---|---|---|---|
| Test Room, Held haut 240 Bilder durch, nach Vorbacken, Pack A | 0,2 | 1,2 | 1,4 / 2,9 | **0** |
| dito Pack B / C | 0,1 / 0,1 | 1,3 / 1,5 | 1,4–1,5 / 2,8–3,2 · 1,6–1,7 / 3,0–3,4 | **0 / 0** |
| Test Room mit 3 kämpfenden Gegnern, kalt (erstes Mal) | 0,6 | 3,8 | 4,8 / 15,2 | 185 (Held + Gegner) |
| dito nach Vorbacken (Gegner-Bilder kommen noch nach) | 0,5 | 2,1–2,4 | 2,8–3,0 / 8–11 | 54–104 (Gegner) |
| perf/bench.js Welt (vorher → nachher, Median gesamt) | | | Varonheim 8,4 → 7,8 · Aurelheim 7,5 → 7,7 · Nordfurt 8,9 → 9,8 · Wildnis 5,3 → 5,7 | |
Die Weltwerte sind in dieser Umgebung (versteckter Bereich, parallele Tabs) über 3 ms und streuen ±1 ms ohne Bezug zum Kampf — keine Aussage über Scheibe 1.
Pack C kostet ~0,2–0,3 ms (zwei Nachbilder). Cache-Größe: 11 Stützstellen × Form × Achtel wie bisher 11 Zehntel × Variante; Packs teilen alle Bilder.

## 4. STOPP: Abbrechen der Erholung (DECISIONS „Erholung ab Treffer + 40 % abbrechbar“)
Problem: Wer im Stand die Taste hält (wie RF.duel/simFight und die meisten Spieler), bricht jede Erholung bei 0,67–0,70 des Takts ab → +18–21 % Hiebe, im
Kampf durch mehr Wuchtschläge/Taumeln +20–50 % Schaden je Sekunde und deutlich weniger verlorenes Leben. E3 sagt: Abweichung > 5 % → Entwickler entscheidet.
Systeme: Balance aller Nahkampfwaffen, Probe §82, BALANCE_GUIDE, Ausdauer (mehr Hiebe = mehr Verbrauch — gemessen kein Erschöpfen im Test).
Lösungen (architekturverträglich, je eine Zeile in `attack()`/`atkCancel`):
1. **Annehmen**: Spieler ist im Stand stärker; Probe §82 und Gegnerwerte neu einstellen (BAL), MECHANIKEN-Text bleibt.
2. **Takt-neutral abbrechen** (Empfehlung): Der nächste Kombo-Schlag beginnt früher, sein Ausholen wird um den abgebrochenen Rest verlängert (Kette fließt, Gefühl bleibt, Schaden je Sekunde wie vorher). Optik-Gewinn, kein Balance-Effekt.
3. Abbrechen nur in Verteidigung (Deckung/Rolle ab Treffer + 40 %), nicht in den nächsten Schlag.
4. Abbrechen nur bei erneutem Drücken im Fenster (nicht beim Halten) — Können statt Dauerfeuer; bleibt ein DPS-Plus für geübte Spieler.
Bis zur Entscheidung: Code wie beschlossen; `S.dbg.atkOld = 'cancel'` schaltet nur das Abbrechen zum Vergleich ab (Debug-Knopf „alte Taktung zum Vergleich“ schaltet alles).

## 5. Vollständigkeitsprüfung COMBAT_ANIM §17 — Langschwert
| Punkt | Stand |
|---|---|
| Angriff 1/2, Wucht, Finisher (B/C), Combo als Kette | ✓ |
| Schadenszeitpunkt = Einschlag-Bild, Hitbox | ✓ (Hitbox/Reichweite/Bogen unverändert aus resolveSwing) |
| Animationszeit (Takt gleich, Wucht +15 %) | ✓ |
| VFX (Spur je Pack, Sichel B/C, Nachbilder C, Ring/Druckwelle Finisher) | ✓ |
| Klang | teilweise — vorhandenes System (Schwung beim Start, Treffer im Einschlag, C-Finisher Krit-Klang); keine Pack-eigenen Klänge |
| Koop/Gruppe | teilweise — Felder übertragen, Optik lokal; nicht im echten Koop getestet |
| Save/Load | ✓ neue Felder tolerant (fehlen = alte Kurve/0,42), Test Room nie gespeichert |
| Idle (Kampf-Idle, seltene Bewegungen) | ✗ unverändert i0/i1 |
| Bewegung (Kampfbewegung, Sprint, rückwärts, Wenden) | ✗ |
| Schwerer Angriff (halten) | ✗ — offene Frage: Taste/Halten-Regel |
| Block/Parade mit Waffenhaltung | ✗ (allgemeine guard-Pose) |
| Ausweichen je Pack (B Ausfallsprung, C Dash) | ✗ (Rolle wie bisher) |
| Trefferreaktion leicht/schwer/krit als eigene Pose | ✗ (hit/kb wie bisher) |
| Gegnerreaktion | ✗ (unverändert über hurt) |
| Tod | ✓ vorhanden (9 Todesarten), unverändert |
| Alte stilbrechende Animationen | teilweise — Stil D und Arbeitsschwung auf u umgestellt; Reitkampf, Zweiwaffen-Nebenhand nicht geprüft |

## 6. Offen
- Entscheidung §4 (Abbrechen) → danach Probe §82 grün oder neu eingestellt.
- Scheibe 2 (Zweihänder, Dolch, Speer, Hammer je A/B/C) nicht begonnen; ihre Daten kommen als weitere Profile in `ANIM_DEFS.attack` (gleiche Formstruktur, Stoßform für Dolch/Speer fehlt noch).
- Überkopf-Ausholen hebt die Klinge vor dem Körper durch die Zielachse (wie die alte Kurve) — Wirbel/Vorhand/Rückhand queren sie erst im Einschlag.
- Wirbel-Körperdrehung nutzt die 4 Richtungsbilder; Hand springt zwischen Stützstellen — für den Vergleich ausreichend, für den finalen Stil eigene Wirbelbilder prüfen.
- Pack C: Hit-Stop 90 ms × bis 3 Treffer/s friert die Welt bis ~25 % ein (Risiko aus der Analyse) — Deckel je Sekunde fehlt noch.
- Kalter Start: erster Hieb in eine neue Richtung ohne Vorbacken kostet je fehlendes Bild ~4 ms (nur außerhalb des Test Rooms; Geschwister werden danach in Pausen gebacken).
