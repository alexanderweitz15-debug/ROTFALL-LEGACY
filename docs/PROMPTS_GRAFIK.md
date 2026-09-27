# Grafik-Prompts für den Hauptstil (Referenz 5)

Die Figuren, Gegner und Tiere aus `docs/reference/ref5-hauptstil-sprites.png` sind im Spiel. Für den Rest braucht es Vorlagen **in der richtigen Größe**. Die Gebäude im ersten Blatt waren zu klein: Auf Weltgröße aufgeblasen wurden sie zu grob.

**Wie benutzen:** Den gemeinsamen Stilblock plus einen der Aufträge an ChatGPT geben und das Blatt aus Referenz 5 als Stilvorlage anhängen. Die fertigen Bilder bringst du mir, ich schneide sie zu und baue sie ein.

---

## Gemeinsamer Stilblock (immer mitgeben)

```
Use the attached sprite sheet as the exact style reference. Detailed hand-crafted pixel art, clearly pixelated:
small intentional pixel clusters, crisp hard edges, limited muted palette (rusty iron, dark cloth, leather, weathered
wood, stone), dark 1-pixel outlines, light from the top-left, subtle dithering in shadows. No smooth digital art, no
vector look, no 3D render, no anti-aliasing, no blur. Top-down 3/4 RPG view like the reference. Transparent
background (or flat #1b1f26 that I can key out). Every sprite separated with at least 16 px of empty space, no labels
touching the sprites. Keep the pixel density of the reference: 1 sprite pixel = 1 game pixel, do NOT upscale.
```

---

## 1. Gebäude in Weltgröße (am dringendsten)

Ein Haus im Spiel ist 5 bis 22 Kacheln breit (1 Kachel = 32 px). Die Gebäude müssen deshalb **in echter Größe** gezeichnet sein.

```
Draw a sheet of medieval post-apocalyptic buildings at FULL game size, in the style of the reference.
Each building is a complete house seen from the front/top 3/4 view, footprint and pixel sizes:
- small cottage: 160 × 180 px
- house: 192 × 200 px
- tavern (two floors, sign, lanterns): 288 × 260 px
- blacksmith with forge, chimney, anvil outside: 224 × 220 px
- barn / granary: 256 × 220 px
- stone chapel with bell: 224 × 280 px
- barracks with banners: 288 × 220 px
- merchant house / trading post: 256 × 240 px
Wooden beams, damaged walls, roofs with individual tiles, windows, doors, chimneys, signs, scaffolding, fences,
crates, barrels. The door must be centered at the bottom edge. Also give each building a "night" variant with lit
windows.
```

**Aurelion (Magitech):**
```
Same size rules. Buildings of a rich magitech empire: white stone and brass, gold cornices, glass domes, gears,
glowing blue crystals, pipes, chimneys:
- palace 704 × 420 px, market hall 640 × 380 px, factory hall 576 × 320 px with saw-tooth roof and smokestacks,
  bank 448 × 320 px, academy with dome 448 × 360 px, court 448 × 340 px, barracks of the Sun Legion 512 × 300 px,
  magitech workshop 384 × 280 px, noble manor 320 × 260 px, workers' house 192 × 200 px.
Plus props: brass street lamp, gear gate, airship dock (256 × 180 px), teleport circle (128 × 64 px).
```

**Eisenfeste / Kette / Omega-Kirche:**
```
Same size rules. Brutal religious iron fortress style: black iron, chains, red banners, gold star of Omega:
citadel keep 512 × 420 px, iron gate tower 192 × 320 px, slave barracks 288 × 200 px, forge hall 320 × 240 px,
Omega altar 96 × 80 px, pyre with stake 64 × 96 px.
```

**Untotenreich:**
```
Same size rules. Morbid organic undead architecture: bone, black stone, green glow: crypt 256 × 220 px,
necropolis gate 320 × 300 px, bone spire 48 × 128 px, ruined house (undead-occupied) 192 × 200 px,
Garmadon's throne 160 × 180 px.
```

---

## 2. Figuren in vier Richtungen (für echte Animation)

Das erste Blatt hat pro Figur nur eine Ansicht von vorn. Für echtes Laufen braucht es je Figur ein kleines Blatt:

```
Character animation sheet in the reference style, one character per sheet, character height 72 px (same scale as
the reference). Rows = directions: front, left, right, back. Columns: idle (2 frames), walk (4 frames),
attack (3 frames), hit (1), death (2). Consistent proportions and palette across all frames, feet on the same
baseline, each frame in a 64 × 80 px cell.
Character: [z. B. Wächter von Valen / Söldner / Bäuerin / Paladin Omegas / Sonnenlegionär / Skelettkrieger]
```

Wichtige Reihenfolge (die häufigsten Figuren zuerst): Held, Wache, Bürger (m/w), Händler, Bauer, Bandit, Skelett, Goblin, Paladin Omegas, Sonnenlegionär.

---

## 3. Bodenkacheln (nahtlos)

```
Seamless tileable ground tiles in the reference style, each 32 × 32 px, 3 variants per type, plus edge/transition
tiles to grass: grass, dirt, cobblestone road, stone plaza, wooden plank floor, sand, mud/marsh, ash (undead land),
snow, shallow water, deep water, farmland rows, dungeon floor, dungeon wall top.
```

---

## 4. Objekte (Objektgröße)

```
Props in the reference style at game size (1 px = 1 game pixel): bed 48 × 64, market stall with awning 80 × 64,
table 64 × 40, bench 56 × 24, shelf with goods 48 × 64, barrel 24 × 32, crate stack 40 × 48, anvil 32 × 24,
forge 56 × 48, trough 56 × 24, cask rack 56 × 40, weapon rack 48 × 56, chest (closed/open) 40 × 32,
lantern post 16 × 48, well 48 × 64, tree (oak, pine, dead) 64 × 96, bush 32 × 32, rock 40 × 32, ore vein 40 × 32,
gravestones (4 variants) 24 × 32, tent 64 × 56, campfire (3 frames) 32 × 32.
```

---

## 5. Aurelionische Magitech-Waffen und Rüstungen

```
Weapon and armor icons in the reference style, 48 × 48 px each, diagonal like the reference weapons: magitech
rifle (not overpowered, brass and crystal), magitech pistol, arc lance, sun-legion halberd, brass tower shield,
energy core (ammo), sun-legion golden plate armor (chest, helmet, boots), brass prosthetic arm and leg.
```
