# Style Guide — Rotfall: Legacy

Verbindliche visuelle DNA. Nicht den Stil ersetzen — den Stil perfektionieren.

## Referenz
Grimdark, Kapuzenfiguren, gedämpfte Erdtöne, Darkest-Dungeon-Anmutung: schwere Silhouetten, wenig Sättigung,
Akzentfarben sparsam (altes Rot, Elfenbein, Grabgrün). Keine Neon-Effekte, kein Glow-Teppich, keine Web-UI-Optik.

## Pixel-Regeln
- **Pixeldichte**: Weltpixel `PX = 2` (ein Sprite-Pixel = 2×2 Bildschirmpixel bei Zoom 1). Kamera-Grundzoom 1,3.
- **Figurenraster**: Menschen 20×25 (Drehpunkt 10,23), Tiere 28×18, Brocken (Gorak) 34×38.
- **Kontur**: 1 px dunkle Außenkontur um jede Figur/jedes Objekt (`toCanvas` in sprites.js), nie schwarz, sondern
  der dunkelste Rampenton.
- **Farbrampen** (`ramp()`): 4 Stufen je Material — Licht (hi), Basis (b), Schatten (sh), Tiefe (dk), mit
  Farbtonverschiebung: Licht wärmer, Schatten kühler. `mute()` dämpft Sättigung für die Welt.
- **Lichtwinkel**: oben links. Highlights oben/links, Schatten unten/rechts, Bodenschatten als weiche Ellipse unten.
- **Keine Einfarbflächen**: jede Fläche mindestens zwei Rampentöne plus Materialzeichnung (Maserung, Fugen, Nieten).
- **Cluster**: keine Einzelpixel-Rauschen auf Flächen; Detail in Clustern von 2–4 Pixeln.

## Materialien (Kurzrezepte)
- Holz: warmbraun, Maserung als 1-px-Linien in `sh`, Kanten `hi`, Bänder/Nägel in Metall-Rampe.
- Stein: kühles Grau, Fugen `dk`, Kanten `hi`, gelegentlich Moos (`#4a5a32`) in Nischen.
- Metall: blaugrau, harter `hi`-Glanzpunkt, Rost (`#7a4a2a`) an Kanten bei „alt“.
- Stoff: gedämpfte Farbe aus `CLOTH`, Falten als `sh`-Streifen.
- Dach: Stroh (ocker, Halmstriche), Schindel (graubraun, Reihen), Schiefer (blaugrau, Reihen) — nach Region/Wohlstand.

## Gebäude (`src/buildings.js`)
- 1 Texel = 2 Welt-Einheiten (wie Figuren), 16 Texel je Kachel. Wand 21 Texel (Taverne 24) — höher als eine Figur.
- Dach über dem ganzen Grundriss bis zur Traufe; First bei 30 % der Dachhöhe; Walmdach (Stroh, Ziegel) oder
  Satteldach mit Giebelbrettern (Schindel, Schiefer). Licht NW: Nordhang/Westwalm hell, Südhang → Traufe dunkel, Ostwalm Schatten.
- Materiallagen: Stroh 4-Texel-Lagen mit Halmrichtung; Ziegel 4er-Lagen mit gerundeten Mönchen; Schindel/Schiefer versetzt.
- Pflichtdetails: Traufschatten auf der Wand, Sockel, Fenster mit Rahmen und Bank, Tür mit Beschlägen und Stufe.
- Funktion lesbar an einem Merkmal je Typ (Schild, Esse, Banner, Kräuter, Rosette, Wappen, Säcke).

## Regionen (Farbwelt, `REGION` in render.js)
greenmark/plains (Grün-Oliv), forest (Tannengrün, dunkler), marsh (Moosbraun, Nebel), mountain (Steingrau, kalt),
desert/badland (Ocker, Rost), blight (Asche, Grabgrün, Knochen).

## UI
Pixelbalken, Holz-/Stein-Paneele, Serifenschrift (Cinzel/Spectral-Anmutung), Tooltips im Pixelrahmen.
Kritische HUD-Werte (Leben/Ausdauer) mit ausreichendem Kontrast zum Paneel.

## Verboten
Weichzeichner, Verlaufsflächen als Materialersatz, Neon, generische Web-Komponenten, Bild-Assets fremder Stile
(LPC u. ä. wurden geprüft und verworfen), bezahlte Generatoren (vom Nutzer abgelehnt).
