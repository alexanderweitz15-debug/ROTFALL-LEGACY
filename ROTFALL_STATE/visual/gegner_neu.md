# Neue Gegner und Gegner-Varianten — FEATURE IMPACT REPORT (02.10.2026)

Auftrag: DECISIONS.md „02.10.2026 (Nachmittag) → Neue Gegner“. Gate: ROTFALL_STATE/GATE.md.

## 1. Feature
1. Mehr seeded Aussehens-Varianten für Gegnerarten, die heute wenig haben.
2. Bomben-Skelett: läuft auf den Helden zu, Zündung mit Ansage, Explosion trifft alle in der Fläche (auch andere Gegner), Rolle hilft.
3. Großes Skelett: mehr Leben, langsamer, schwere nicht blockbare Hiebe mit Rückstoß.
4. Mutierte Menschen (2 Arten mit Seed-Varianten) am Totenland-Rand.

## 2. Inventar Varianten heute (monsterSpec in sprites.js)
| Art | heute | Quelle |
|---|---|---|
| Goblin, Goblin-Krieger | viele (6–7 Formen × Farben × Körperbau) | varyGoblin |
| Bandit, Schütze, Speerträger | viele (7 + 6 Formen) | varyBandit |
| Skelett, Seuchenleiche, Wiedergänger, Knochenschütze | viele (6 + 8 Formen) | varyUndead |
| Geist, Schattenwesen, Knochenritter, Wächter, Nekromant, Koloss | 4 Formen + Farben | varyDead |
| Kopfgeldjäger | 4 | varyHunter |
| Kette (Knecht, Rotgardist, Schütze) | 2–4 Kleinigkeiten | varyChain |
| Automat, Engel | Farben | varyMachine/varyAngel |
| Tiere (Wolf, Bär, Eber, Hund, Hirsch, Knochenhund …) | Fell, Größe, Jungtier, Albino | render.js beastVar |
| **Kultist** | **1** (nur Umhangform) | — |
| **Blutmagier, Kelchwächter** | **1** | — |
| **Maskierter, Blutknecht** | 3 Farben | — |
| **Plünderer, Harpunier (Seevolk)** | 3 Tuchfarben, Bart | — |
| **Hauptmann der Toten, Aschdämon, Todesritter** | **1** | — |
| Valen-Soldat | 1 (Verbündete, Wappen) | nicht Teil dieser Runde |

→ Zuerst: Kultist, Blutmagier, Kelchwächter, Maskierter, Blutknecht, Plünderer, Harpunier, Hauptmann der Toten, Aschdämon, Todesritter.

## 3. Betroffene Systeme / bereits vorhanden
- **MONSTERS (data.js):** neue Einträge `skel_bomb`, `skel_brute`, `mutant`, `mutant_brute`; Feld `lore` (Kodex), `role` (Pflicht für Untote, Probe), `interiors` (Pflicht).
- **Schwere Angriffe:** `m.heavy` → `startHeavy`/`heavyTick` (game.js) mit roter Bodenmarke (`special.heavy`, render.js), Warnzeichen „nicht blockbar“ (`heavyWarn`), `heavyHit` (UNBLOCK), Rückstoß 22 px + Taumeln, Unterbrechen durch Taumeln, „offen“ danach. **Großes Skelett nutzt das unverändert** (Art `slam`).
- **Bomben-Skelett:** derselbe Ablauf mit neuer Art `blast` (Fläche um sich, trifft *alle* Kämpfenden außer sich, danach Tod). Kein paralleles System: nur ein Zweig in `heavyTick`. Ansage = gleiche Bodenmarke, Probe „alle Ansagen ≥ 600 ms“ gilt mit.
- **Flächen-Treffer:** `areaHit` (AREA) + `heavyHit` (UNBLOCK) → Explosion setzt beide (keine Deckung, kein Schild, keine Abwehr; Ausweichen über `invuln` → `evaded`).
- **Spawns:** `SPAWN_AREAS` + `spawnType` (Machtvakuum-Tausch), `poiSpawns` (je Welt neu), Tiefhall-Nachschub, Gewölbe-Pools (`V.pool`). Neue Abart-Regel `abart` in MONSTERS (`{ of:'skeleton', p }`) wird in `spawnType` und im Gewölbe angewandt — gleiche Stelle wie der bestehende Tausch nach Regionalbossen. Eigener Zufall (`Math.random`) wie bei `applyVariant`, damit die Weltfolge stabil bleibt.
- **Totenland-Rand:** Grenze ist `regionAt(...) === 'deadland'` (world.js deadBorder, ohne rnd). Spawngebiete entlang der Grenze werden in `poiSpawns` aus `regionAt` berechnet (keine Sonderfall-Abfrage in der KI, keine rnd()-Aufrufe in world.js).
- **Fraktion der Mutanten:** `undead` — Vorbild Kultist der Asche (lebender Mensch, Fraktion der Toten). Folgen: kein Aufgeben, Heilig ×2,1, mit Rang beim Totenreich verbündet, Untoten-Rollenzeichen.
- **Beute:** `LOOT[mtype]`; Abarten erben Knochenbeute, Mutanten Lumpen/Knochen (vorläufig, kleine Mengen wie Ghoul).
- **Aufträge/Quests:** Kill-Ziele zählen `mtype` exakt. Abarten zählen zusätzlich für ihre Grundart (`abart.of`), sonst würde „Tote zur Ruhe legen“ ein Großes Skelett nicht zählen.
- **Kodex/Bestiarium:** `S.seenFoes` + `m.lore` (ui.js) — automatisch.
- **Ruf beim Entdecken:** `VOICE` (Probe verlangt Eintrag je Art). **Stil F:** `MON_ATLAS` (Probe verlangt Eintrag).
- **Kopfgeld/ELITES:** keine Änderung (Elite-Mini-Bosse wählen über `where`; Abarten erscheinen dort nicht als Grundart).
- **Koop:** Gegner gehen als ganze Figur an den Gast (`lightEnt`), danach DYN-Felder. `special` ist nicht in DYN → die Bodenmarke schwerer Angriffe sieht der Gast heute schon nicht (alle schweren Angriffe, nicht neu). Warnung über `telegraph` und Effekte (`fx`) kommt an. → Offener Punkt, nicht in dieser Runde.
- **Save/Load:** Gegner werden voll gespeichert; neue Felder (`heavy`, `hvN`) sind flüchtig und vertragen Fehlen. Alte Spielstände kennen die Arten nicht — nichts zu migrieren.
- **Sprites:** `monsterSpec` (sprites.js) + neue Look-Felder in `SPEC_KEYS` (`la` lange Arme); `sil` bekommt `growth` (Wucherungen, fig5.js). Frame-Cache ist auf 4000 Bilder gedeckelt; Varianten je Art bleiben bei wenigen Stufen.
- **Debug:** neue Karte „Gegner: …“ (Gruppe „Spieler & Ausrüstung“ über DBG_GROUPS-Muster `Kampf`).

## 4. Werte (aus BALANCE_GUIDE §4 abgeleitet, **vorläufig** bis simFight-Messung)
| Art | Gefahr | hp | dmg | Tempo | Reichw. | atk | Ansage | Besonderes | xp |
|---|---|---|---|---|---|---|---|---|---|
| Bomben-Skelett | 2 | 36 | 12 | 1,55 | 28 | 1000 | Zündung 900 ms | Explosion r 72, ×1,6, trifft alle | 24 |
| Großes Skelett | 3 | 130 | 15 | 0,85 | 44 | 1400 | 500 | schwer: slam alle 2, 800 ms, ×1,8, r 85 | 75 |
| Verdorbener | 2 | 44 | 11 | 1,6 | 36 | 850 | — | Rüstung 0 | 26 |
| Wucherer | 3 | 95 | 14 | 1,35 | 42 | 1300 | 420 | Rüstung 1 | 55 |
Häufigkeit (vorläufig): Bomben-Skelett 8 %, Großes Skelett 6 % der Skelett-Spawns. Mutanten: Randgebiete Kap. 5, 3 : 1.

## 5. OFFENE DESIGNENTSCHEIDUNGEN
1. Explodiert ein Bomben-Skelett, das während der Zündung getötet wird? **Vorläufig: nein** (Tod beendet alles, wie jede Ansage) — gibt dem Spieler einen Konter (Fernkampf, schnell töten).
2. Bricht Taumeln (Wucht, Handkante) die Zündung ab? **Vorläufig: ja**, wie bei jedem schweren Angriff (bestehende Regel).
3. Beute nach Selbstsprengung: **vorläufig normal** (wie jeder Tod in Heldennähe). Alternative: nichts, weil zerrissen.
4. Zählen Abarten für Skelett-Aufträge? **Vorläufig: ja** (zählen zusätzlich für „skeleton“).
5. Fraktion der Mutanten: **vorläufig `undead`** (Vorbild Kultist). Alternative: eigene Fraktion „Verdorbene“, die alle angreift.
6. Häufigkeit der Abarten und Mutanten, Explosionsschaden ×1,6, Wucherer-Werte — vorläufig, gemessen unten.
7. Sollen Mutanten auch als Reise-Hinterhalt (AMBUSH) am Rand kommen? Nicht gebaut.
8. Koop: Bodenmarke schwerer Angriffe beim Gast (alle Arten) — bestehende Lücke.

## 6. Risiken
- RNG-abhängige Proben: Abarten nutzen Math.random (Weltfolge unverändert); neue Spawngebiete ändern nichts an rnd() der Weltgenerierung, aber `initialSpawns` zieht mehr ri()/pick() → nachfolgende Zufallswerte verschieben sich (wie bei jedem neuen Spawngebiet).
- Parallel arbeitet der Kampfanimations-Agent in game.js/fig5.js/sprites.js/render.js: nur kleine Anker-Edits.

## 7. Implementierungsplan
1. data.js: 4 Einträge MONSTERS, LOOT, `abart`.
2. game.js: VOICE, HUMANOID, weaponKey, `armor: m.armor ?? m.threat`, `abartOf()` in spawnType/Gewölbe/Tiefhall, Randgebiete in poiSpawns, `blast` in heavyTick, Quest-Zählung, Hinweise (Log beim ersten Anblick der Zündung), Debug, Proben.
3. sprites.js: Specs für die neuen Arten, Varianten-Funktion für die Arten mit wenig Varianten, `la` in SPEC_KEYS, MON_ATLAS.
4. fig5.js: `sil: growth` und lange Arme (`la`).
5. render.js: Glühen während der Zündung.
6. MECHANIKEN.md, Rasterbild.

## 8. Ergebnis (nach dem Bau)
siehe unten.
