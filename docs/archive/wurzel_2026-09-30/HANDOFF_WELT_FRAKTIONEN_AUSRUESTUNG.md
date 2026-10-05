# Rotfall: Übergabe für eine andere KI (Welt, Fraktionen, Waffen, Rüstung)

Stand: Session 11 (2026-09-26). Die Werte wurden direkt aus dem laufenden Spiel ausgelesen (`src/data.js` und `src/world.js`). Selbsttest: 117/117.

Das Spiel ist ein Top-down-Action-RPG in Vanilla-JS mit ES-Modulen und Canvas 2D. Es verwendet keine Engine und keine Bild-Assets: Alle Sprites werden prozedural im Code gezeichnet. Der Spielzustand liegt global in `S` (`src/state.js`).

## 0. Regeln für die Arbeit am Projekt (bitte einhalten)

- **Keine Bilddateien und keine bezahlten Asset-Tools** (kein SpriteCook, kein Aseprite). Neue Optik entsteht als Code in `src/figure.js`, `src/sprites.js` und `src/render.js`.
- **Artstyle:** grimdark. Figuren sind schlank, tragen lange Mäntel und haben verschattete Gesichter. Die Palette ist dunkel und entsättigt. Maßstab: 1,5 Weltpixel pro Pixel.
- **Master-Prompt:** `docs/MASTER_PROMPT.md`
  - Jeder Fix beginnt mit der Ursache und bekommt einen Regressionstest.
  - Tests werden nie entfernt.
  - Am Sitzungsende werden diese Dateien in `docs/` aktualisiert: BUGS, CHANGELOG, SESSION_LOG, GDD, PHASE_STATUS.
- **Performance-Budget:** Zeichnen höchstens 2,0 ms, Update höchstens 3,0 ms pro Frame.
- **Weltgenerator:** Die `rnd()`-Sequenz des Generators darf sich nicht ändern, sonst verschieben sich bestehende Welten. Neue Gebiete verwenden Hash-Rauschen, so wie `extendEast()` in `world.js`.
- **Sprache:** Spieltexte sind auf Deutsch. Der Ton ist knapp, düster und ohne Pathos.
- **Dev-Modus:** `index.html?dev` stellt `window.RF` bereit (S, MAPS, spawnEnemy, selftest, duel …).
  - Selbsttest: `await RF.selftest()`.
  - Kampfmessung: `RF.duel('bandit', { level: 3, weapon: 'longsword', chest: 'gambeson', mode: 'stand' })`.

## 1. Welt

| Wert | Inhalt |
|---|---|
| Größe | 1024×768 Kacheln, Kachel = 32 px (`TS`). Entwurfsraster 512, skaliert mit `WS = 1.5`, ergibt 768. Dazu kommt der Osten mit `EAST = 256` Kacheln. |
| Koordinaten | Zahlen in `LOCATIONS` sind Weltkacheln (bereits skaliert). Neue Orte werden nach der Skalierung mit `LOCATIONS.push(...)` angehängt. |
| Dungeons | `mine` (Verlassene Grube, Boss Gorak) und `deep` (Tiefhall) |
| Grobe Geografie | Nordwesten: Eren und Nordfurt (Valen). Mitte: Kreuzweg (Händler). Nordosten: Frostkamm, Aschfurt, Rote Wüste. Süden: Salzhafen und der Untoten-Süden (Alt-Vharn, Nekropole, Schwarze Feste). Ganz im Osten: die Eisenmark (Endgame). |

### Orte

Die Spalte „Gefahr“ reicht von 0 (sicher) bis 5.

| key | Name | x,y | Gefahr | Besitzer |
|---|---|---|---|---|
| eren | Eren | 90,96 | 0 | valen |
| forest | Eren-Wald | 132,66 | 1 | |
| mine | Verlassene Grube | 93,27 | 3 | |
| road | Alte Straße | 144,96 | 1 | |
| fortress | Alte Feste | 27,93 | 2 | |
| marsh | Moorland | 78,150 | 2 | |
| banditcamp | Banditenlager | 99,174 | 3 | bandit |
| graveyard | Alter Friedhof | 51,144 | 2 | undead |
| shrine | Waldschrein | 114,78 | 1 | order |
| ruins | Kleine Ruine | 60,60 | 2 | |
| northcity | Nordfurt | 178,82 | 0 | valen |
| grubenpfad | Grubenpfad | 93,60 | 1 | |
| oldtower | Alter Wachturm | 84,56 | 2 | |
| raidcamp | Überfallenes Lager | 101,42 | 2 | |
| oldbridge | Steinbrücke | 165,450 | 1 | |
| westwald | Westwald | 90,450 | 2 | |
| wolfden | Wolfsschlucht | 66,450 | 3 | |
| saltport | Salzhafen | 225,676 | 0 | valen |
| sunkentemple | Versunkener Tempel | 210,615 | 3 | |
| kreuzweg | Kreuzweg | 375,375 | 1 | merch |
| deephall | Tiefhall | 375,54 | 3 | |
| frostpeak | Frostkamm | 495,45 | 2 | |
| ashford | Aschfurt | 570,138 | 1 | merch |
| redwaste | Rote Wüste | 660,233 | 2 | |
| sonnwacht | Sonnwacht | 684,384 | 1 | order |
| altvharn | Alt-Vharn | 543,570 | 4 | undead |
| necropolis | Große Nekropole | 606,656 | 4 | undead |
| blackkeep | Die Schwarze Feste | 647,645 | 5 | undead |
| knochenwald | Knochenwald | 705,549 | 3 | undead |
| aschensee | Aschensee | 477,657 | 3 | undead |
| vharnholm | Vharnholm | 731,664 | 1 | undead |
| grove | Alter Hain | 120,432 | 1 | |
| grenzwacht | Grenzwacht | 495,525 | 1 | valen |
| hundertfeld | Hundertfeld | 510,603 | 3 | |
| mistisle | Nebelinsel | 135,750 | 2 | |
| **eisenmark** | Die Eisenmark | 900,470 | 3 | chain |
| **kettenfeste** | Die Kettenfeste | 932,384 | 4 | chain |
| **steinbruch** | Der Steinbruch | 880,214 | 3 | chain |
| **grubenhort** | Grubenhort | 900,600 | 2 | goblin |
| **kettenpass** | Kettenpass | 775,384 | 2 | |

### Krieg (`WAR_NODES` in `data.js`, Simulation in `sim.js`)

Die Untoten rücken vom Süden aus auf die Knoten vor. Garnisonen:

| Knoten | Besitzer | Garnison |
|---|---|---|
| graveyard | undead | 10 |
| blackkeep | undead | 40 |
| necropolis | undead | 22 |
| altvharn | undead | 16 |
| eren | valen | 14 |
| road | valen | 4 |
| northcity | valen | 40 |
| ashford | valen | 8 |
| saltport | valen | 14 |
| sonnwacht | order | 20 |

Die Knoten marsh, fortress, ruins, kreuzweg und oldbridge sind anfangs neutral. Bevor die Armee angreift, warnt ein Späher.

## 2. Fraktionen (7)

Der Ruf zu jeder Fraktion liegt in `S.factions[key]`. Die Stufe ergibt sich aus `REP_TIERS`:

| ab Ruf | Stufe | Preisfaktor |
|---|---|---|
| 70 | Vertraut | 0,85 |
| 40 | Verbündet | 0,9 |
| 15 | Freundlich | 0,95 |
| −5 | Neutral | 1,0 |
| −30 | Misstrauisch | 1,12 |
| −60 | Feindlich | 1,3 |
| darunter | Verhasst | kein Handel, Wachen greifen an |

| key | Name | Farben | Ränge | Rolle |
|---|---|---|---|---|
| valen | Königreich Valen | #2f4260 / #b9c3d2 | Rekrut, Soldat, Veteran, Ritter, Offizier | Zerfallendes Königreich mit Garnisonen, besitzt die meisten Städte |
| order | Der Orden | #d9d2c0 / #9b2e26 | Novize … Meister | Kämpft gegen die Untoten, Sitz in Sonnwacht; Klasse Paladin |
| undead | Die Untoten | #1d2422 / #4e8f7a | Diener … Kommandant | Zivilisation mit Städten (Vharnholm); Hauptgegner im Krieg; Klasse Todesritter |
| merch | Freie Händler | #3c3324 / #bd9433 | Kunde, Partner, Teilhaber | Kreuzweg, Aschfurt, Karawanen |
| bandit | Rooks Bande | #2a231a / #8c3b2a | Handlanger, Klinge, Hauptmann | Räuber; Kopfgeld und Kopfgeldjäger |
| **chain** | Die Eiserne Kette | #1a1816 / #8a8278 | Treiber, Aufseher, Kettenmeister | Endgame-Sklavenhalter im Osten, Startruf −20 |
| **goblin** | Die Grubenstämme | #3d4a22 / #b8a050 | Fremder, Freund, Grubenbruder | Versklavtes Volk, Startruf −50; nach der Befreiung friedlich |

### Plot der Eisenmark

Die Eiserne Kette hält Goblins und menschliche Gefangene in Ketten. Gefangene zeigt das Spiel über Lumpen, Eisenkragen und Ketten. Sie werden bewusst **nicht** über die Hautfarbe dargestellt.

- **Vor der Befreiung** sieht man:
  - Kettenwachen mit Kettenpeitsche, Brigantine und Eisenhut.
  - Einen Kettenzug: Ein Treiber führt drei angekettete Goblins zwischen Steinbruch und Feste.
  - Gefangene bei der Arbeit, außerdem Käfige und Kettenpfähle.
- **Endboss** ist Varg, der Kettenmeister (Stufe 16, `chain_master`). Er steht in der Kernburg der Kettenfeste, zusammen mit zwei Kettenknechten, und ruft unter 50 % Leben Verstärkung.
- **Nach Vargs Tod** läuft `liberate()` in `game.js`:
  - Die Gefangenen sind frei: Goblins gehen zum Grubenhort, Menschen nach Sonnwacht.
  - Wilde Goblins werden friedlich, und es spawnen keine Goblins mehr.
  - Im Grubenhort entsteht ein Goblin-Dorf mit dem Ältesten Grisk und der Händlerin Nibbel (verkauft Hakenmesser und Grubenlederweste).
  - Der Ruf ändert sich: goblin +40, chain −100.
  - Der Spieler erhält den Titel „Kettenbrecher“.
  - Beteiligte Flags: `S.flags.chainsBroken` und `S.flags.goblinsFreed`.
- **Offene Ideen:**
  - Aufträge von Grisk.
  - Gespräche mit Gefangenen, die vorher Hinweise geben.
  - Ein eigener Händler der Kette.
  - Goblins als Verbündete im Krieg.

### Regionalbosse (`REGION_BOSSES` in `game.js`)

| Boss | Ort | Folge seines Todes |
|---|---|---|
| alpha: Graumähne, Leitwolf | Wolfsschlucht | Wölfe werden zu wilden Hunden |
| sandlord | Rote Wüste | eigener Regionseffekt (siehe Tabelle im Code) |
| chainmaster: Varg | Kettenfeste | Befreiung, siehe oben |

Weitere Bosse: Gorak (Grube), Hrodvar (Frostkamm/Tiefhall), Wächter der Nekropole, Hauptmann der Toten.

## 3. Waffen (`ITEMS` in `data.js`, slot `weapon`)

Die Felder bedeuten:

| Feld | Bedeutung |
|---|---|
| `dmg` | Schaden |
| `reach` | Reichweite in px |
| `arc` | Trefferwinkel in rad |
| `speed` | Schlagdauer in ms |
| `stam` | Ausdauerkosten |
| `ap` | Rüstungsdurchschlag (0–1) |
| `crit` | Krit-Multiplikator |
| `stagger` | Taumeln |
| `twohand` | zweihändig |
| `skill` | Fertigkeit, die steigt |
| `value` | Grundpreis |

| key | Name | wtype | dmg | reach | speed | stam | Besonderes | Seltenheit | Wert |
|---|---|---|---|---|---|---|---|---|---|
| rusty_sword | Rostiges Kurzschwert | sword | 7 | 40 | 520 | 7 | | common | 18 |
| longsword | Langschwert | sword | 12 | 46 | 560 | 9 | | uncommon | 90 |
| frostblade | Frostklinge | sword | 16 | 48 | 560 | 9 | | epic | 320 |
| greatsword | Zweihänder | great | 22 | 56 | 980 | 18 | 2H | rare | 220 |
| axe | Beil | axe | 11 | 38 | 680 | 10 | ap 0,25, Holzfällen | common | 34 |
| greataxe | Große Axt | great | 25 | 52 | 1080 | 20 | ap 0,35, 2H | rare | 260 |
| mace | Streitkolben | mace | 13 | 36 | 740 | 11 | ap 0,4, stagger 1,6 | uncommon | 110 |
| flail | Streitflegel | mace | 13 | 46 | 820 | 12 | Schwung: +15 % je Stufe bis 3, ab Stufe 3 Rundumtreffer | rare | 210 |
| warhammer | Kriegshammer | hammer | 24 | 44 | 1150 | 20 | ap 0,6, stagger 2, crush, 2H | rare | 240 |
| spear | Speer | spear | 10 | 74 | 640 | 8 | Reichweite | common | 48 |
| halberd | Hellebarde | polearm | 17 | 82 | 920 | 14 | sweep, ap 0,3, 2H | rare | 210 |
| dagger | Dolch | dagger | 5 | 26 | 300 | 4 | crit 2,6 | common | 22 |
| goblin_hook | Hakenmesser | dagger | 7 | 30 | 340 | 5 | crit 2,2, 30 % Blutung | uncommon | 120 |
| rapier | Rapier | rapier | 9 | 54 | 380 | 6 | crit 2,2, Riposte nach Parade | uncommon | 150 |
| chain_whip | Kettenpeitsche | whip | 9 | 84 | 700 | 9 | fesselt (−40 % Tempo, 1,5 s) | rare | 230 |
| shortbow | Kurzbogen | bow | 9 | 360 | 820 | 8 | Fernkampf | common | 55 |
| longbow | Langbogen | bow | 15 | 460 | 1080 | 11 | Fernkampf, 2H | rare | 190 |
| crossbow | Armbrust | crossbow | 26 | 420 | 420 | 6 | Nachladen 1900 ms, ap 0,5, 2H | uncommon | 170 |
| wand | Zauberstab | wand | 7 | 320 | 460 | 2 | kostet 4 Mana pro Schuss | uncommon | 160 |
| staff | Stab | staff | 6 | 40 | 620 | 6 | +12 Mana, 2H | common | 40 |
| pickaxe | Spitzhacke | axe | 8 | 34 | 760 | 9 | Bergbau | common | 26 |
| nachtfrost | Nachtfrost | great | 27 | 58 | 1000 | 18 | Frost verlangsamt, Unikat (Hrodvar) | mythic | 900 |
| gorak_cleaver | Goraks Hackmesser | axe | 18 | 44 | 760 | 13 | Legende Blutdurst, Unikat (Gorak) | legendary | 520 |

Das Kampfgefühl pro `wtype` steht in `FEEL` in `game.js`. Dort legen die Felder fest:

| Feld | Wirkung |
|---|---|
| `w` | Gewicht |
| `stop` | Hitstop in ms |
| `shake` | Bildschirmwackeln |
| `lunge` | Ausfallschritt |
| `stag` | Taumeln |

Vorhandene wtypes: dagger, sword, spear, axe, mace, great, staff, bow, rapier, hammer, polearm, whip, crossbow, wand.

## 4. Rüstung und Schilde

| key | Name | Slot | Rüstung | Gewicht/Tempo | Seltenheit | Wert |
|---|---|---|---|---|---|---|
| cloth_shirt | Leinenkittel | chest | 1 | | common | 8 |
| leather_jerkin | Lederwams | chest | 4 | | common | 45 |
| gambeson | Steppwams | chest | 6 | | common | 80 |
| pit_leather | Grubenlederweste | chest | 8 | hemmt nicht (Goblinhändlerin) | rare | 210 |
| chain_hauberk | Kettenpanzer | chest | 9 | weight 3 | uncommon | 190 |
| brigandine | Brigantine | chest | 11 | weight 3, slow 0,04 | uncommon | 260 |
| scale_mail | Schuppenpanzer | chest | 13 | weight 5, slow 0,08 | rare | 380 |
| plate_cuirass | Plattenharnisch | chest | 15 | weight 6, slow 0,12 | rare | 460 |
| leather_cap | Lederkappe | head | 2 | | common | 20 |
| kettle_hat | Eisenhut | head | 4 | | uncommon | 70 |
| iron_helm | Eisenhelm | head | 5 | weight 1 | uncommon | 95 |
| great_helm | Topfhelm | head | 8 | weight 2 | rare | 210 |
| leather_boots | Lederstiefel | feet | 1 | | common | 16 |
| iron_boots | Eisenschuhe | feet | 3 | weight 1 | uncommon | 60 |
| traveler_cloak | Reisemantel | cloak | 1 | Kälteschutz | common | 24 |
| order_seal | Siegel des Ordens | cloak | 2 | +20 % heilig | rare | 200 |
| wooden_shield | Holzschild | offhand | 2 | Block 0,30 | common | 28 |
| buckler | Eisenbuckler | offhand | 1 | Block 0,24 | common | 36 |
| kite_shield | Normannenschild | offhand | 4 | Block 0,42, weight 2 | uncommon | 130 |
| tower_shield | Turmschild | offhand | 6 | Block 0,58, weight 5, slow 0,22 | rare | 280 |

Slots: weapon, offhand, chest, head, feet, cloak. Es gibt **keine** Slots für Handschuhe, Hosen oder Ringe; das wäre eine mögliche Erweiterung. Der Assassine kann Schattenschritt nicht in Ketten- oder Plattenpanzer nutzen.

### Seltenheit, Affixe, Legenden

- **Seltenheiten:** common, uncommon, rare, epic, legendary, mythic.
  - Dropchancen: 62 % / 24 % / 10 % / 3,5 % / 0,5 %.
  - Wertfaktor: 1 / 1,35 / 1,9 / 3 / 5 / 8.
- **Affixe (`AFFIXES`):**

  | Slot | Affixe |
  |---|---|
  | Waffe | sharp, swift, keen, pierce, vigor; stark: leech, rend |
  | Rüstung | sturdy, vital, fleet, enduring; stark: thorns |

- **Legenden (`LEGENDS`):**
  - thirst: Jeder Todesstoß heilt 8 % Leben.
  - echo: 20 % Chance auf einen zweiten Treffer mit halbem Schaden.
  - bastion: unter 30 % Leben +8 Rüstung.

## 5. Gegner (`MONSTERS`)

| key | Name | hp | dmg | reach | Gefahr | Fraktion | Beute (Auszug) |
|---|---|---|---|---|---|---|---|
| wolf | Wolf | 30 | 7 | 26 | 1 | beast | Fell |
| boar | Wildschwein | 46 | 11 | 26 | 1 | beast | Fleisch |
| wild_dog | Wilder Hund | 24 | 6 | 24 | 1 | beast | |
| bear | Bär | 150 | 18 | 38 | 3 | beast | 1–2 Felle |
| deer | Hirsch | 30 | 0 | – | 0 | beast | Beute, flieht |
| goblin | Goblin | 28 | 6 | 28 | 1 | goblin | Knochen, rostiges Schwert |
| goblin_warrior | Goblin-Krieger | 54 | 11 | 32 | 2 | goblin | Eisen, Beil |
| bandit | Bandit | 48 | 10 | 34 | 2 | bandit | Lederwams, Dolch |
| bandit_archer | Banditenschütze | 36 | 9 | 300 | 2 | bandit | Kurzbogen |
| bandit_spear | Speerträger | 50 | 12 | 66 | 2 | bandit | Speer |
| bounty_hunter | Kopfgeldjäger | 58 | 12 | 36 | 2 | bandit | Kettenpanzer, Armbrust |
| chain_brute | Kettenknecht | 95 | 15 | 40 | 3 | chain | Brigantine 25 %, Eisenhut 30 %, Flegel 12 % |
| chain_master | Varg, Kettenmeister (Boss) | 260 | 18 | 70 | 4 | chain | Kettenpeitsche, Topfhelm, Schuppenpanzer 80 % |
| skeleton | Untoter Krieger | 44 | 10 | 32 | 2 | undead | Grabsiegel |
| ghoul | Wiedergänger | 70 | 13 | 30 | 2 | undead | |
| wraith | Geist | 38 | 9 | 30 | 3 | undead | Seelenphiole |
| cultist | Kultist der Asche | 34 | 12 | 260 | 2 | undead | Stab, Zauberstab |
| crypt_warden | Wächter der Nekropole | 150 | 15 | 40 | 3 | undead | Ahnenurne |
| death_captain | Hauptmann der Toten | 170 | 16 | 42 | 3 | undead | Kettenpanzer, Eisenhelm, Flegel |
| hrodvar | Hrodvar, König unter dem Eis (Boss) | 280 | 19 | 46 | 4 | undead | Nachtfrost, Plattenharnisch |
| gorak | Gorak, Grubenwart (Boss) | 240 | 24 | 52 | 4 | goblin | Goraks Hackmesser |
| valen_soldier | Soldat Valens | 52 | 10 | 44 | 2 | valen | |

Gegnerwerte werden global mit `BAL = { hp: 1.7, dmg: 1.4 }` multipliziert (`game.js`). `BAL` ist auch der Hebel für die geplanten Schwierigkeitsgrade „Sehr schwer“, „Schwer (Standard)“ und „Angsthase“. Veteranen (`e.elite`) erscheinen in gefährlichen Regionen.

## 6. Händler (Auswahl, `NPCS[].pool`)

| Händler | Ort | Sortiment |
|---|---|---|
| Brann | Nordfurt, Schmied | Langschwert, Zweihänder, Kolben, Flegel, Kriegshammer, Hellebarde, Beil, Große Axt, Speer, Kettenpanzer, Eisenhelm, Normannenschild, Buckler, Steppwams, Brigantine, Eisenhut, Eisenschuhe |
| Oda | Kreuzweg | Verbände, Tränke, Speer, Armbrust, Hellebarde, Kettenpanzer, Holzschild, Eisenhelm, Schuppenpanzer, Topfhelm, Steppwams |
| Gerold | | Rapier, Armbrust, Bögen, Lederwams, Zauberstab, Nahrung |
| Sael | Untoten-Gebiet | Seelenphiolen, Stab, Zauberstab, Dolch |
| Nibbel | Grubenhort, erst nach der Befreiung | Hakenmesser, Grubenlederweste |

## 7. So fügt man eine neue Waffe oder Rüstung hinzu (Checkliste)

1. **`src/data.js` → `ITEMS`:** Eintrag mit key, name, slot und Werten wie oben. Optional `desc` oder `lore` (deutsch, ein bis zwei Sätze).
2. **Bezugsquelle:**
   - Als Beute: `src/data.js` → `LOOT` des passenden Gegners, als `['key', chance]`.
   - Als Ware: `NPCS[].pool` eines Händlers.
3. **Waffe sichtbar in der Hand:** `src/figure.js` → `WDES` (Pixelzeichnung als Code: Größe, Zeichenfunktion, Griffpunkt). Bei neuem wtype zusätzlich einen Ersatz-Eintrag in `WBY` anlegen.
4. **Inventar-Icon:** `src/render.js` → `drawItemVec()`, Zweig nach `wtype`.
5. **Neuer wtype:** `FEEL` in `src/game.js` ergänzen. Sonderregeln wie bind oder bleed werden beim Treffer über `wIt` in `game.js` ausgewertet (siehe `chain_whip` und `goblin_hook`).
6. **Rüstung am Körper sichtbar:** `src/sprites.js` → `humanSpec()` ordnet den Brust-key einem Material zu (`leather`, `chain` oder `plate` plus `armorCol`) und den Kopf-key einem Helm (`cap`, `nasal` oder `great` plus `helmCol`).
7. **Test:** In `game.js` einen `ok('…', …)`-Selbsttest ergänzen, dann `await RF.selftest()` ausführen. Alle Tests müssen grün sein.
8. **Balance:** Mit `RF.duel(...)` gegen Bandit und Kettenknecht im Stand und beim Kiten messen. Kiten eines Bosses soll tödlich bleiben.

## 8. Wichtige Dateien

| Datei | Inhalt |
|---|---|
| `src/data.js` | Items, Monster, Beute, Fraktionen, Ruf, Quests, NPCs, Krieg |
| `src/world.js` | Weltgenerator, Orte, Osterweiterung (`extendEast`), Häuser, Props |
| `src/game.js` | Kampf, KI, Spawns, Bosse, Befreiung, Kopfgeld, Selbsttests |
| `src/sim.js` | Kriegssimulation, Wellen, Chronik |
| `src/figure.js` | Waffen-Pixelzeichnungen |
| `src/sprites.js` | Figuren-Sprites |
| `src/render.js` | Zeichnen: Welt, Props, Icons, Ketten, Licht |
| `src/ui.js` | Menüs, Dialoge, Handel, Fraktionsansicht |
| `docs/GDD.md`, `docs/PHASE_STATUS.md`, `docs/BUGS.md` | Design, Fortschritt, bekannte Fehler |

## 9. Nachtrag Session 12: Arsenal der Mark

Stand danach: Selbsttest 118/118.

### Neue Waffen

| key | Name | wtype | dmg | Besonderes | Seltenheit |
|---|---|---|---|---|---|
| schrott_hellebarde | Schrott-Hellebarde | polearm | 14 | sweep, 2H | common |
| rabenbeil | Rabenbeil | axe | 12 | `raw 0.35`: +35 % gegen Rüstung unter 4 | uncommon |
| dornensaebel | Dornensäbel | sword | 11 | 20 % Blutung | uncommon |
| grabraeuber | Grabräuber | sword | 10 | schnell, billig | common |
| kriegspicke | Kriegspicke | axe | 14 | ap 0,6, Bergbau | uncommon |
| sensenlanze | Sensenlanze | polearm | 15 | Reichweite 90, sweep | uncommon |
| knochenspalter | Knochenspalter | great | 26 | stagger 1,4 | rare |
| henkersaxt | Henkersaxt | great | 24 | `execute [0.5, 1.5]` | rare |
| mauerbrecher | Mauerbrecher | hammer | 28 | ap 0,7, crush | epic |
| seelenhaken | Seelenhaken | polearm | 12 | `chill 'Seelenkalt'` | rare |
| totenglocke | Totenglocke | hammer | 22 | `toll`: Feinde im Umkreis von 70 px um das Ziel werden eingeschüchtert (`cowed`, −20 % Schaden, 2,5 s) | rare |
| rotklaue | Rotklaue | sword | 14 | `execute [0.5, 1.2]` | rare |
| schwarzzahn | Schwarzzahn | great | 25 | `execute [0.2, 1.5]` | epic |
| kettenbrecher | Kettenbrecher | mace | 16 | flail | epic |
| eisenfalke | Eisenfalke | crossbow | 34 | ap 0,7, Nachladen 2600 ms | epic |
| roter_henker | Der Rote Henker | great | 32 | `execute [0.5, 1.4]`, Unikat, sichere Beute von Varg | legendary |

### Neue Rüstung

| key | Slot | Rüstung | Besonderes |
|---|---|---|---|
| eisenwache | chest | 10 | Uniform der Kette, rote Schärpe |
| rotgardist | chest | 13 | `ally: 3`: +3 Rüstung, wenn ein Verbündeter näher als 90 px ist |
| aufsehermantel | chest | 7 | |
| tiefenschuerfer | chest | 8 | |
| kettenkoloss | chest | 15 | slow 0,1 |
| plattenmantel | chest | 13 | |
| pluendererharnisch | chest | 9 | |
| grenzlaeufer | chest | 5 | |
| legionaersplatte | chest | 11 | Beute von Untoten |
| eisenfuerst | chest | 18 | slow 0,12 |
| letzte_wache | chest | 16 | Relikt mit Legende Ahnenwall (bastion), liegt einmal in der Alten Feste |
| rotgardistenhelm | head | 9 | |
| bergmannshelm | head | 4 | |
| eisenfuersthelm | head | 10 | |

### Neue Gegner

| key | Name | hp | dmg | Gefahr | Rolle |
|---|---|---|---|---|---|
| rotgardist | Rotgardist | 120 | 17 | 3 | Elite der Kette und Leibwache Vargs |
| kettenschuetze | Kettenschütze | 50 | 16 | 3 | Armbrust, Reichweite 320 |

### Was sich in der Checkliste (Abschnitt 7) ändert

- **Aussehen neuer Rüstung:** eine Zeile in `ARMOR_LOOK` in `src/sprites.js`. Mögliche Felder: `armor`, `armorCol`, `pauld` (Schulterstücke), `sash` (Schärpe), `helm`, `helmCol`, `crest`, `glove`, `hem`, `strap`, `pouch`, `tabard`.
- **Neue Trefferregeln, die vom Ziel abhängen:** in `weaponMult()` in `game.js` ergänzen.
- **Kettenwachen** ziehen ihre Ausrüstung aus den Listen in `GUARD_KIT.chain`, damit sie nicht gleich aussehen.
- **Relikte** werden in der Liste `RELICS` in `game.js` eingetragen: Flag, Item und Kachel. Jedes Relikt entsteht genau einmal.
- **Die Eiserne Kette** hat jetzt die Farben `#111214` und `#5a1a1c`.

### Geplant

- Die Kettenfeste als lebende Militärstadt.
- Tribut, den die Dörfer an die Kette zahlen.
- Feldzüge der Kette gegen die Untoten.
- Details stehen in GDD.md unter „Arsenal und Eisenfeste-Ausbau“.
