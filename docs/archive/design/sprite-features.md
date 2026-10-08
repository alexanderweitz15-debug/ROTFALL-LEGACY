# Sprite-Inventur (Session 14, Teil B)

Ziel: Referenz 5 (`docs/reference/ref5-hauptstil-sprites.png`) im Code nachzeichnen — Stil D, 1,5 Welt-Einheiten je Pixel,
schlank, lange Mäntel, Gesicht im Schatten. Datenbasis bleibt (`humanSpec`/`monsterSpec` → `resolve` in sprites.js);
neu sind Maler, Rig und Animation (`figure.js`). Stand S14: abgehakt = im Stil R gemalt und im Sammelbild (`RF.figSheet`) bzw. im Selbsttest geprüft.

## Menschen — Aufbau (Spec-Felder)
- [x] Arten `sp`: Mensch, Goblin (gebückt, Ohren, Hakennase), Skelett (Knochenglieder)
- [x] Haut, Haar (Frisur `hs`: kurz, lang, kahl, Zopf), Bart
- [x] Gesicht `face`: menschlich (Schattenhälfte, 2 Augenpixel), Totenschädel, Maske, Tuch vor dem Mund, dunkel, Schnabel, Haut
- [x] Kapuze (`hooded`, Farbe `hood`) mit Gesicht im Schatten und Augenglanz
- [x] Kopfbedeckung `helm`: Kappe, Nasalhelm, Eisenhut (Krempe), Topfhelm (Sehschlitz), Beckenhaube (spitz), Kopftuch, breiter Hut, Hut; Farbe `helmCol`; Kamm `crest`
- [x] Kleid/Rock: Wams (hem 35), Kittel (39), Mantel/Rock (44), Robe bis zu den Knöcheln (`robe`)
- [x] Umhang hinten (`cloak`), Schulterumhang (`cape`), Kragen/Halstuch (`scarf`), Stola (`stole`), Schärpe (`sash`)
- [x] Rüstung `armor`: Leder (Wams), Kette (Ringreihen), Platte (Brustplatte, Nieten); Farbe `armorCol`; Schulterstücke `pauld`
- [x] Wappenrock `tabard` mit Zeichen `mark`: Kreuz, Winkel, Buckel, geviert (Adel); Farbe `markCol`
- [x] Schürze (`apron`, `apronCol`), Gürtel mit Schnalle, Tasche (`pouch`), Schrägriemen (`strap`), Rucksack mit Deckenrolle (`pack`)
- [x] Handschuhe (`glove`), Beinwickel (`wraps`), Stiefel (`boots`; barfuß, wenn leer)
- [x] Schild `shield`: rund, Wappenschild (`shieldCol`, Zeichen) — vorn, seitlich, in Deckung vor dem Körper
- [x] Köcher (`quiver`)
- [x] Abnutzung `wear` 0–3 (Schmutz, ausgeblichen, Rost, Kerben, zerrissener Saum, Flicken) — in Clustern, kein Pixelrauschen
- [x] Blut `blood` 0–2 (Spritzer mit Lauf) nach Leben
- [x] Glimmen `glow` (Untote, Titelklassen: Nekromant grün, Hexenmeister violett, Druide gelbgrün, Mönch gold, Untoten-Pakt überdeckt)

## Berufe und Figuren (Silhouetten über Spec)
- [x] Bürger je Beruf (`CIVIC`): Bauer, Magd, Bürgerin, Tagelöhner, Weber, Böttcher, Bäcker, Witwe, Graf/Gräfin, Edelmann/-frau, Kaufherr, Feinmechaniker, Kybernetiker, Medica, Prothesenhändlerin/-macherin, Gelehrter, Priester, Kaufmann, Ratsherr, Lagerknecht, Kesselflicker, Wirt, Handwerker, Stallknecht, Fischer, Netzflickerin, Spielfrau, Alchemist, Händlerin
- [x] Sonderberufe: Dorfvorsteher, Heilerin, Schmied, Holzfäller, Händler, Wache/Torwache (Valen), Ordenswache, Söldnerwache, Ehemaliger Söldner, Jägerbursche, Bandenführer, Grabgebundener, Alter Paladin, Reisender/Flüchtling (Hut, Gepäck)
- [x] Benannte Figuren (`NAMED_LOOK`): Havel, Elena, Tomas, Borin, Mara, Gerold, Aldric, Jorun, Kelan, Rook, Mira, Brann, Ilva, Oda, Lioba, Quirin, Sael, Lila
- [x] Rüstungsbilder (`ARMOR_LOOK`): Eisenwache, Rotgardist, Aufsehermantel, Tiefenschürfer, Kettenkoloss, Plattenmantel, Plündererharnisch, Grenzläufer, Legionärsplatte, Kron-, Ordens-, Sonnenharnisch und -helm, Eisenfürst, Letzte Wache, Rotgardisten-, Bergmanns-, Eisenfürstenhelm
- [x] Leute der Kette variiert (`varyChain`), Automaten (`ROBOT_LOOK`, Uhrwerk in der Brust, `e.big` 1,5×)
- [x] Gefangene: Lumpen, Eisenkragen, Kette (Kleidung, nicht Hautfarbe); Schuldknecht-Wächter mit roten Augen

## Humanoide Gegner (`monsterSpec`)
- [x] Goblin, Goblin-Krieger (Kappe, Leder, Rundschild)
- [x] Bandit, Banditenschütze, Speerträger (Kappe, helles Tuch), Kopfgeldjäger (ab Stufe 3 Kette und Helm), rote Tücher
- [x] Kette: Kettenknecht, Kettenmeister Varg, Rotgardist, Kettenschütze; Automat (verwildert)
- [x] Soldat Valens; Engel (Klinge, Schütze) mit Flügeln; Kultist (Robe, violett)
- [x] Varianten: Veteran, gepanzert, Anführer (Feldzeichen), ausgehungert, Raserei (Aura), Elite/Regionalboss größer

## Untote
- [x] Skelett, Wächter der Nekropole, Hauptmann der Toten, Knochenritter, Knochenschütze, Todesritter
- [x] Wiedergänger, Geist (halb durchsichtig, körperlos), Seuchenleiche (gebückt, Dunst), Schattenwesen (schwebend)
- [x] Nekromant (kreisende Schädel), Aschdämon (Glutaura), Leichenkoloss (massig 1,22×)
- [x] Diener (Glimmen des Herrn), Schattenskelett des Hexenmeisters, Rollen-Symbol

## Tiere
- [x] Wolf, Wilder Hund (eigene Gestalt), Wildschwein, Bär, Hirsch, Knochenhund, Pferd, Kuh, Schaf
- [x] Posen: stehen/laufen (4), Ducken/Ansage, Sprung/Biss, tot; Leitwolf/Elite größer
- [x] Reittiere unter dem Reiter (Pferd, Messingross, Totenross), Tierbegleiter
- [x] Aasschwinge (Flug), Omega/Ophanim (Auge) — Renderer-Zeichnung, in beiden Stilen gleich

## Bosse
- [x] Gorak (Goblin-Hüne, Hackmesser), Hrodvar (Frostplatte), Graumähne (Leitwolf), Karrak, Varg, Garmadon (1,9×, Krone), Omega

## Waffen (52 in `ITEMS`, 16 Klassen) und Werkzeuge
- [x] Jede Waffe eigenes Bild (`WDES`), Griff bei (gx, gy), Spitze nach +x
- [x] Werkzeuge der Arbeit: Hammer, Hacke, Säge, Kelle, Rute, Gabel, Spitzhacke
- [x] Raritätsoptik: Klingenfarbe je Rarität, Runen (pulsieren), heilig; Stab-Kristall flackert
- [x] Schwungkurven je Klasse (`swingOf`): Vorhand, Rückhand, Überkopf, Stoß; Klingenspur
- [x] Halten: Einhand, Zweihänder mit beiden Händen, Stangenwaffen aufrecht, Zweihänder auf der Schulter, Bogen senkrecht, Armbrust spannen
- [x] Symbole in Inventar und am Boden: Waffen und Rüstung aus den Stil-R-Sprites (Essen, Tränke, Material bleiben gemalte Symbole)

## Animation
- [x] Idle (Atmen), Gehen (4, Mantel schwingt nach), Angriff je Waffenklasse (Ausholen → Schlag → Nachschwung)
- [x] Treffer/Taumeln, Rückstoß (Rutschen), Rolle (Kugel) mit Landung (Knie), Deckung/Parade
- [x] Tod (Sterbeanimation, liegend, Blutlache), am Boden (Atmen) und Aufstehen (Knie → wankend)
- [x] Sitzen, Handeln, Durchsuchen/Knien, Arbeiten (Holzfällen, Abbauen), Zaubern/Bogen spannen, Tragen (Ware vor der Brust)
- [x] Körper dreht zur Zielrichtung (vier Richtungen, E gespiegelt); Rock und Umhang schwingen verzögert (Kapuzenkragen nur seitlich)

## Darstellung im Renderer
- [x] Bodenschatten, Treffer-Blitz (`flashOf`), verlorene Gliedmaßen (Blutstellen), Körperbau (`buildOf`)
- [x] Porträts, Titelbild, Leichen: laufen über `humanFrame` → Stil R (technisch geprüft, nicht einzeln angesehen)
- [x] Stil F (Atlas) bleibt wählbar; Cache-Schlüssel: Spec, Richtung, Pose/Frame, Waffenklasse, Rarität/Glimmen

## Noch nicht im Stil R (Stand S14)
- Häuser: umgefärbt und neue Dachdeckung, aber Raster 2 Welt je Pixel (Figuren 1,5); Prachtbauten Aurelions unverändert.
- Boden: Gras, Wege, Wasser, Fels, Mauern wie Stil D (nur Äcker neu).
- Bäume und übrige Props: gleiche Formen, nur satter mit farbiger Kontur.
- Aasschwinge, Omega und Ophanim: Vektor-Zeichnung im Renderer. (Zugtiere: erledigt S14, `ox`/`mule` in `BEASTR`.)
- Symbole: 12 gezeichnet (`src/iconsR.js`: Trank, Seelenphiole, Kraut, Brot, Dörrfleisch, Verband, Erz, Fell, Knochen, Dietrich,
  Barren, Korn); übrige Waren noch verkleinerte Vektoren. Effekte und Geschosse offen. Titelbild: geprüft, scharf (S14).
