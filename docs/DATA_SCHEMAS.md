# Datenmodelle — Ist-Stand

Statische Daten in `src/data.js`, Weltgenerierung in `world.js`. Neue Inhalte als Datensatz, nicht als Einzelfall.
Alte Ziel-Schemata: `archive/DATA_SCHEMAS_bis_S13.md`.

## Waffe (`ITEMS`, slot `weapon`)
```js
longsword: { name, slot:'weapon', wtype:'sword', dmg:12, reach:46, arc:1.6, speed:560, stam:9, rarity:'uncommon', value:90,
             skill:'onehanded' /* optional: ap, crit, stagger, twohand, ranged, tool, mana, holy, riposte, crush, sweep,
             reload, manaShot, execute:[schwelle, faktor], raw, chill, toll, unique, leg */ }
```
- `wtype` wählt Gefühl (`FEEL`, game.js, Pflicht), Schwung (`swingOf`, render.js) und Bild (`DESIGNS`, sprites.js).
- `reach` px, `arc` rad, `speed` ms, `stam` Ausdauer, `ap` Durchschlag 0..1 (auch Geschosse).
- Rüstung: `slot` chest/head/offhand, `armor`, `slow`, `block` (Schild), `ally`; Aussehen über `ARMOR_LOOK`.

## Exemplar
`{ key, count, cond, rar?, afx?: { affix: wert }, leg? }` — `rar` nur besser als `ITEMS[key].rarity`; Unikate würfeln nie.
Aufheben, Lager, Grab behalten das Exemplar (`giveItem`, nie `addItem`).

## Rarität und Affixe
```js
RARITY_ORDER = ['common','uncommon','rare','epic','legendary','mythic']
RARITY_DROP  = { common:0.62, uncommon:0.24, rare:0.10, epic:0.035, legendary:0.005 }   // Basis, Gefahr verschiebt
RARITY_VALUE = { common:1, uncommon:1.35, rare:1.9, epic:3, legendary:5, mythic:8 }
RARITY_AFFIXES = { common:0, uncommon:1, rare:2, epic:3, legendary:2, mythic:0 }
AFFIXES.sharp = { slots:['weapon'], name:'Schärfe', v:[min, max], fmt, major? }
ARMOR_SETS.rotgarde = { name, pieces:[itemKey…], bonus:{ dmg?, armor?, stam?, holy? }, desc }
```

## Gegner (`MONSTERS`)
```js
bandit: { name, hp:48, dmg:10, speed:1.4, reach:34, atk:880, xp:22, sight:250, r:11, threat:2, faction:'bandit',
          interiors:true /* Pflicht */, pal:{ skin, cloth, metal }, scaling /* optional: telegraph, ranged, boss, prey */ }
```
- `interiors`: folgt durch Eingänge oder lauert. `boss`: hält die Arena (ebenso Instanzen mit `e.boss`).
- Beute `LOOT[mtype] = [[itemKey, chance], …]`. Regionalbosse: `REGION_BOSSES` (game.js) mit `flag, mtype, loc, level, hp,
  call, area(a), from, to, effect, text`.

## NPC (`NPCS`) und Bewohner
```js
{ key, name, prof, faction, age, home, traits:[], attrs:{}, cls, recruit, recruitRel, greet, shop?, town?, teaches?, hostile?, undead?, kin? }
```
Laufzeit: `anchor`, `homeId`, `homeTown`, `plan` (Tagesplan, beim Laden neu), `angry`, `wary`, `fleeing`, `provoked`,
`talk: { at, until, say }`, `follow: { to, at }`, `lurk: { until }`, `servant` (Herr-id), `pet`, `transient`.

## Titelklasse (`TITLE_CLASSES`)
```js
necromancer: { name, title, glow, faction, excludes:['warlock','monk'], reversible:false, desc,
  resource:{ key, name, max, start, css, rule }, abilities:[…], passive:{ name, desc }, flaw:{ name, desc },
  cost:{ desc, hpMul?, stamina?, attr? }, rep:{ undead:20, order:-30 }, unlock }
MAX_TITLES = 2
```
Spieler: `titleClasses` (erworben), `titleClass` (getragen), `tres`, `pactCost`, `pal.glow`.
`ABILITIES[k] = { name, title?, cd, cost: n | 'all', min?, gain? }`.

## Skill-Baum
```js
SKILL_TREE.k_legion = { branch, row, type:'keystone'|'notable'|undefined, name, desc,
  fx:{ hp, stam, mana, dmg, armor, crit, speed, spell, cdr, heal, regen, manaRegen, dodge, invCap }, requires:[…], designIntent }
SKILL_BRANCHES[b] = { name, desc, title? }        // title: versiegelt ohne diese Titelklasse
```
Spieler: `skillPoints`, `tree`, `tfx`.

## Fraktionen und Ruf
`FACTIONS[f] = { name, colors:[a, b], desc, ranks:[…] }` · `REP_TIERS = [{ min, name, price, greet }]` (7 Stufen) ·
`S.factions[f]` Ansehen, `S.ranks[f]` Rang (−1 = kein Mitglied). Ausschluss beim Beitritt: `JOIN_FOES` (game.js).

## Auftrag (`S.contracts`)
`{ id, town, kind, giver /* 'board' | 'vm' | npc-key */, have, need, state:'offer'|'active'|'claimed', day, reward:{ gold, xp, rep },
title, desc, target?, … }` — Fristen `CON_DAYS[kind]`, Deckel `CON_MAX = 5`.

## Gebäude
```js
// world.js: house(map, x, y, w, h, door, { type, town }) → HOUSES (bei jeder Generierung neu, nicht gespeichert)
{ id, map, x, y, w, h, door:'S', doorTile:[x, y], type:'smithy', town:'eren', seed, wear? }
BTYPES.smithy = { label, chimney, sign, forge }            // buildings.js; weitere Merkmale: herbs, banner, bigDoor, crest, …
TOWN_STYLE.eren = { roof:'thatch', wall:'timber' }
FURNISH.smithy = [['forge', 0, 0], …]                     // Möbel = Props mit gen: 2, house: <id>; Kachel hinter der Tür frei
```

## Siedlungsplan (`TOWN_PLAN`)
```js
eren: { area:[x0,y0,x1,y1], old, square:[x,y], spread:{ s, a:[x,y] }, perHead:95, village?, lord?, metro?,
  fill, clear, plazas, streets, walls:{ rect, gates }, palisade, harbor, fields, houses:[[type,x,y,w,h,door]],
  props:[[kind,x,y,opts]], grow:{ houses, gardens, props, s0 }, outskirts:[type…], oldFloor?, coreWalls? }
worldPt(x, y) → [wx, wy]    // Entwurfspunkt → Weltkachel (in Städten über die Streckung); WS = 1,5, OX = 256
```
Wachstum: `S.growth[town] = { prosper, built:[{ type, x, y, w, h, ruin? }] }`. Verfall durch Raids: `S.flags.raidDamage[houseId] = { base, wear, perm? }`,
zerstörte Dörfer `S.razed[k] = { day, rebuild }`.

## Welt, Karten, Spielstand
- `DUNGEONS[key] = { name, floor, amb, enter }`, Karte `MAPS[key]` mit `rooms[{ x, y, w, h, cx, cy, tag }]`, `entry`;
  Portal = Prop mit `portal: <map>`. Neue Karten brauchen eine Grundliste beim Laden (BUG-137).
- Spielstand: `ents[map]` nur abweichende Props (`gk` = Typ@Kachel), `propsGone[map]`; Figuren voll. `SAVE_VERSION` 4.
- Karawane: `{ kind:'caravan', dir, wp, cargo, trail:[[x,y]…], restUntil, crew }`; Wachen mit `escort`, `slot`.
- Wirtschaft: `S.towns[k] = { stock:{ ware: n }, … }`, `S.eco`, `S.priceSeen`; Waren `GOODS` (13).
- Tiere: `MOUNTS = { horse:{ name, spd, price }, … }`, `S.mount = { kind, name, oiled? }`, `p.mounted = { kind }`, `S.pet` (id).
- Prop-Szenen: `scene()` in world.js, Zuordnung `SCENES[locationKey]`.

## Auftrag (`QUESTS`, data.js)
```js
q_kingsiron: { name:'Königseisen', giver:'brann' /* NPC-Key; oder giverProf + giverMap */, desc:'…',
  objectives:[{ type:'kill', target:'hrodvar', count:1, text:'…' }, { type:'item', target:'koenigseisen', count:1, text:'…' }],
  reward:{ gold:80, xp:260, rep:{ valen:6 }, item:'frostblade', take:'koenigseisen' /* takeCount, unlock, rel */ },
  turnin:'brann' /* optional: where (Kartenpunkt), chron, ask, classQ, clsTrial, rankLine, sea, dyn, pact */ }
```
- Zieltypen mit zentraler Auswertung: `kill`, `item`, `trial`, `dodge`, `find`, `night`, `talk` (`target` = NPC-Key, `say` = Aussage; „Befragen“ erscheint im Gespräch), `clue` (`target` = Spur-Key aus `Q.clues`); `custom` braucht einen eigenen Hook in game.js und eine Begründung. Ein neuer Zieltyp ist NEW FEATURE (CLAUDE.md §2).
- Spuren: `clues:[{ key, town, at:[tx,ty] | square:[dx,dy] | house:'<HOUSES-typ>', label, text }]` — `ensureClues()` legt sie als flüchtige Props (`clue`), E liest sie (`clueRead`).
- Urteil: `decide:{ prompt, options:[{ key, text, say, gold?, effects:{ rel:{npc:n}, rep:{fac:n}, gold, prosper:{ort:n}, flag, chron } }] }` — ersetzt `turnIn` durch `questDecide(npc, k)`; Ergebnis in `S.quests[k].outcome`.
- Ablauf in game.js: `questAvailable(k) → offerQuest(npc, k) → startQuest(k) → questComplete(k) → turnIn(npc, k)`; Geber mit `giver` bietet in `talk()` automatisch an. Zustand nur in `S.quests[k] = { state, progress[] }`.
- Dynamische Aufträge (Bretter, Verträge) leben in `S.contracts`; `registerContracts()` trägt sie bei jedem Laden als `QUESTS['c_' + id]` ein. Jeder Auftrag mit festem Ort braucht einen Kartenpunkt (`QUEST_WHERE`/`questPoint`, Probe „Karte (BUG-085)“).

