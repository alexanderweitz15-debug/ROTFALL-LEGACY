# Datenmodelle — Rotfall: Legacy

Alle Spieldaten liegen in `src/data.js` (statisch) bzw. entstehen in `world.js` (Weltgenerierung).
Neue Inhalte als Datensatz, nicht als Einzelfall im Code.

## Waffe (`ITEMS`, slot `weapon`) — Ist-Stand
```js
longsword: { name:'Langschwert', slot:'weapon', wtype:'sword', dmg:12, reach:46, arc:1.6, speed:560, stam:9,
             rarity:'uncommon', value:90, skill:'onehanded' /* optional: ap, crit, stagger, twohand, ranged, tool, mana, holy */ }
```
- `wtype` wählt Gefühl (`FEEL` in game.js), Schwungkurve (`swingOf` in render.js) und Sprite (`DESIGNS` in sprites.js).
- `reach` px, `arc` Bogen in rad, `speed` Schwungdauer ms, `stam` Ausdauerkosten, `ap` Rüstungsdurchschlag 0..1.

## Gegner (`MONSTERS`) — Ist-Stand
```js
bandit: { name:'Bandit', hp:48, dmg:10, speed:1.4, reach:34, atk:880, xp:22, sight:250, r:11, threat:2,
          faction:'bandit', interiors:true, pal:{ skin, cloth, metal } /* optional: telegraph, ranged, boss */ }
```
- `interiors`: folgt durch Eingänge (true) oder lauert draußen (false). Pflichtfeld (Selbsttest prüft).
- `telegraph` ms Ansage vor dem Hieb; `boss` bindet an die Arena.
- Beute: `LOOT[mtype] = [[itemKey, chance], …]`.

## NPC (`NPCS`)
```js
{ key, name, prof, faction, age, home /* NPC_SPOTS-Schlüssel */, traits:[], attrs:{}, cls, recruit, recruitRel,
  greet, shop?, town?, smith?, teaches?, hostile?, undead?, kin? }
```
Laufzeitfelder: `anchor` (Posten), `angry`, `sawPlayer` (Spieluhr), `wary` (Spieluhr bis), `fleeing`, `provoked`.

## Übergangszustand (Laufzeit, gespeichert mit der Entität)
```js
e.follow = { to: 'mine', at: <Spieluhr> }   // unterwegs zur Tür, kommt ab `at` auf Karte `to` an
e.lurk   = { until: <Spieluhr> }            // lauert am Eingang bis `until`
e.wary   = <Spieluhr>                        // Sichtweite ×1,5 bis dahin
```

## Gebäude — Ist-Stand (Phase 4)
```js
// world.js: house(map, x, y, w, h, door, { type, town }) → HOUSES (bei jeder Generierung neu, nicht gespeichert)
{ id: 'h62_58', map: 'world', x: 62, y: 58, w: 5, h: 4, door: 'S', doorTile: [64, 61], type: 'smithy', town: 'eren', seed: 941 }
// buildings.js
BTYPES.smithy = { label: 'Schmiede', chimney: 1, sign: 'hammer', forge: 1 }   // Merkmale: chimney (Wahrscheinlichkeit), sign,
                                                                             // forge, herbs, banner, bigDoor, crest, rose, cross, sacks, flowers, woodpile, big
TOWN_STYLE.eren = { roof: 'thatch', wall: 'timber' }                         // Dach: thatch|shingle|slate|tile, Wand: timber|wood|stone|plaster|palestone
FURNISH.smithy = [['forge', 0, 0], ['workbench_int', 2, 0], …]               // [Prop, x, y] relativ zur Innenfläche; negativ = vom rechten/unteren Rand
```
Möbel sind Props mit `gen: 2, house: <id>`. Die Kachel hinter der Tür bleibt immer frei (Selbsttest prüft Türen).

## Gebäude (erweitertes Ziel-Schema)
```json
{
  "id": "eren_smithy",
  "type": "smithy",
  "wealthTier": "einfach",
  "material": { "wall": "stone", "roof": "shingle" },
  "rect": { "x": 62, "y": 58, "w": 5, "h": 4 },
  "door": "S",
  "exteriorFeatures": ["chimney_smoke", "anvil_porch", "tools_wall", "sign_hammer"],
  "interior": ["forge", "anvil", "workbench", "weapon_rack"],
  "inhabitants": ["aldric"],
  "lightSource": "forge_glow",
  "soundAmbient": "hammer"
}
```

## Prop-Szene (Ist-Stand `scene()` in world.js)
Feste Arrangements statt Streuung: `huntcamp, mushrooms, battlefield, wreck, shrine, stones, frozen, altar, drowned,
farm, village, tower`. Zuordnung zu Orten über `SCENES[locationKey]`.

## Rarität (Ziel-Schema, Phase 8)
```js
RARITY_TIERS = {
  common:    { affixes:0, drop:0.62, color },
  uncommon:  { affixes:1, drop:0.25 },
  rare:      { affixes:2, drop:0.09 },
  epic:      { affixes:3, drop:0.03, needsPlaystyleAffix:true },
  legendary: { affixes:[1,2], drop:0.009, unique:true },
  mythic:    { named:true, drop:0 /* nur gesetzte Fundorte/Bosse */ },
}
```

## Skill-Knoten (Ziel-Schema, Phase 9)
```json
{ "id": "combat_keystone_berserker", "branch": "COMBAT", "type": "keystone", "requires": ["combat_12"],
  "effect": { "dmgMulBelowHp": [0.3, 1.25], "dmgTakenMul": 1.15 },
  "designIntent": "Risiko/Belohnung für aggressive Spielweise" }
```

## Siedlungsplan (Session 2, world.js `TOWN_PLAN`)
```js
eren: { area: [x0,y0,x1,y1], old: [...], square: [x,y],        // Rechtecke inklusiv; old = Kern vor dem Ausbau
  fill: [[T.DIRT, x0,y0,x1,y1, 'ragged']], clear: [[T.DIRT, ...]], plazas: [[T.STONE, ...]], streets: [[T.ROAD, ...]],
  walls: { rect, gates: [[x0,y0,x1,y1]] }, palisade: { rect, sides: 'NWS', gates }, oldWalls: true,
  harbor: { x0, x1, top, piers: [x...], boats: [[x, dy]] }, fields: [[x0,y0,x1,y1]],
  houses: [['bakery', x, y, w, h, 'N']], props: [['lantern', x, y, { label }]] }
```
Neue Gebäudetypen: cottage, manor (`floors: 2`), bakery (`oven`), barn (`barnDoor`, `hay`), stable (`stalls`),
store (`crane`), fisher (`nets`). Weitere Merkmale: `noWin`, `fewWin`, `patch`, `wall` (Material erzwingen).
Bewohner (Laufzeit): `homeId`, `homeTown`, `anchor` (Nacht, im Haus), `schedulePos` (Tag), `eve` (Abend).

## Siedlungsplan (`TOWN_PLAN`) — Ergänzungen Session 4
```js
eren: { area, old, square,                       // Entwurfskoordinaten; werden beim Laden des Moduls gestreckt
  spread: { s: [1.2, 1.35] /* oder Zahl */, a: [58, 64] /* Anker */ },
  perHead: 95,                                   // Kacheln Siedlungsfläche je Kopf (Bewohner + Wachen + Figuren mit Namen)
  oldFloor?: T.DIRT, coreWalls?: [x0, y0, x1, y1], // Kernburg: Boden und Ringmauer des alten Kerns
  grow?: { houses: [[type, x, y, w, h, door]], gardens: [[x0, y0, x1, y1]], props: [[kind, x, y, opts]] },   // WELTkoordinaten
  design: { area, old, clear, houses }           // (Laufzeit) Entwurf, für townPt und den Umzug des Kerns
}
townPt(x, y)  → [wx, wy]   // Entwurfspunkt → Weltkachel (Wachposten, NPC-Orte, Karawane, Start)
```

## Titelklasse (`TITLE_CLASSES`) — Session 4
```js
necromancer: { name, title /* Namenszusatz */, glow /* Merkmal */, faction, excludes: ['warlock'], reversible: false, desc,
  resource: { key: 'essence', name, max: 6, start: 0, css, rule /* woher sie kommt, Pflicht */ },
  abilities: ['raise_dead', 'bone_ward', 'soul_harvest'],   // ABILITIES[k].title === 'necromancer'
  passive: { name, desc }, flaw: { name, desc }, cost: { desc, hpMul?, stamina? }, rep: { undead: 20, order: -30 }, unlock }
// ABILITIES: { name, title, cd, cost: n | 'all', min?, gain? }   — nie mana/stam
```
Spieler-Laufzeitfelder: `titleClasses` (erworben), `titleClass` (getragen oder null), `tres` ({ essence, corruption }),
`pactCost` ({ hpMul, stamina }), `pal.glow`. Diener: Gegner mit `servant` (Herr-id), `until`, `glow`, `transient`.
