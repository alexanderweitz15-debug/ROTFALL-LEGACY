# Style Guide — Rotfall: Legacy

Alte Fassung: `archive/STYLE_GUIDE_bis_S13.md`. Referenzen: `docs/reference/` (3 Klassen/Abnutzung, 4 Gelände, 5 Hauptstil).

## Stile (Optionen → Grafikstil)
| Stil | Stand | Quelle |
|---|---|---|
| D „Klassisch“ | **Standard** | `figure.js` (Figuren 40×66 fein, ×1,2), Props/Boden 1,5 Welt je Pixel |
| R „Gezeichnet (Test)“ | optional (S14) | `fig5.js`: Referenz 5 im Code nachgezeichnet, Figuren, Tiere, Waffen, Gorak im Zielraster |
| F „Neu (Referenz 5)“ | optional, aus | Atlas aus dem Referenzblatt (`assets/ref5_atlas.png`) |
Stilwechsel leert die Bild-Caches (`setArt`); gespeichert wird nur `S.settings.art`.

## Grundregeln (alle Stile)
- Grimdark: gedämpfte Erdtöne, Akzente sparsam (altes Rot, Elfenbein, Grabgrün, Messing). Keine Neon-Effekte, kein Glühteppich.
- Licht oben links; 4-Stufen-Rampe je Material (`ramp`: hi, b, sh, dk; Licht wärmer, Schatten kühler, leicht entsättigt).
- Silhouette zuerst: Beruf und Rang an Umriss erkennbar (Hut, Kapuze, Robe, Helm, Schild, Mantellänge), nicht nur an Farbe.
- Kein Einzelpixel-Rauschen; Details in Clustern von 2–4 Pixeln. Keine Weichzeichner, keine Verläufe als Materialersatz.
- Jeder Frame wird einmal gemalt und gecacht; pro Bildschirm-Frame nur `drawImage`.

## Stil R — Figuren (S14)
- Raster: 32×50 Frame, 1 Pixel = 1,25 Frame-Einheiten, Renderer ×1,2 → **1,5 Welt je Pixel** wie Props. Figur 43 px hoch, Pivot (16, 47).
- Proportion: Kopf 8 px (≈ 1/5,5), Schultern 12 px, schlanke Arme dicht am Rumpf, Beine 4 px, Mantellänge nach `hem` (Wams, Kittel, Mantel, Robe).
- Gesicht im Schatten: Brauenschatten, rechte Hälfte dunkel, zwei Augenpixel; unter Kapuze dunkle Öffnung mit Augenglanz (Glimmen der Untoten und Titel in `glow`).
- Material: Stoff (weich, Falten als senkrechte Schattenzüge vom Saum), Leder (Glanzkante, Naht), Metall (harte Bänder, Grat, Nieten), Haut/Knochen.
- Kontur: außen im dunkelsten Ton des angrenzenden Materials; innen selektiv (rechts/unten dunkel, links weich).
- Arme gehören zum Bild; die Waffe sitzt an der gebackenen Hand (`f.hand`, zweite Hand `f.off`), Schwung in Zehnteln, Ziel in Achteln.
- Animation: Atmen (2), Gehen (4, Rock und Umhang schwingen eine Phase verzögert), Hieb je Waffenklasse (Ausholen → Schlag → Nachschwung, Rumpf lehnt mit, Schritt), Treffer, Rückstoß, Deckung, Zaubern/Zielen, Knien, Durchsuchen, Sitzen, Handeln, Tragen, Sterben, Rolle, Liegen.
- Varianz (Runde 2): Körperbau aus `BUILDS` als Maß (Schultern, Taille, Höhe, Armdicke), Bauch und breite Schultern aus der Variante `vs` (0–7);
  je Variante Rüstungsmuster (Leder beschlagen/geschnürt/gesteppt, Platte Grat/Geschübe/Gravur, Kette/Schuppen), Schulterstücke rund/geschichtet/Dornen,
  Armschienen, Halsberge, Borte mit Knöpfen, Farbstreuung; benannte Figuren und der Held bleiben fest (`vs = 0`).
- Schwere Waffen (Zweihänder, Hammer, große Axt, Stangenwaffe; `hv`): +1 Schulter, dickere Arme und Beine, freie Unterarme.
- Bauern nach Region (`regionFarmer`, Grenzen wie `omegaStance`): Westen x < 330 Omega-Tracht mit Stern; Osten x > 700 Stroh, Filz, barfuß, Knochenamulett; Mitte Strohhut.
- Symbole in R: Waffe = Sprite schräg; Rüstung = Probefigur mit dem Teil, zugeschnitten.
- Waffen in R: Hohlkehle und Schliff, Parier/Knauf in Messing (ungewöhnlich/selten) oder Gold (episch+), Knaufstein nach Rarität, Wickel schräg.
- Häuser in R: Dachfarben `ROOF_VAR_R`, Deckung in Lagen parallel zur Traufe mit versetzten Stoßfugen, Wände weniger abgedunkelt, Fensterbank + Lichtschein.
- Felder in R: Getreide in Reihen (dunkler Fuß, goldene Ähre), eine Frucht je Feld. Props in R: satter, Farbstufen, Kontur im dunkelsten Nachbarton.
- Tiere 48×32, Pivot (24, 30); Waffen und Gorak mit denselben Formen im Zielraster (Faktor 0,8).

## Stil D — Figuren
- Formen (Vielecke) auf 40×66 bei 1 Welt je Pixel, als Ganzes ×1,2 (`FIGK`); Arm und Waffe zeichnet der Renderer je Frame zur Hand.

## Gebäude, Boden, Props
- Gebäude (`buildings.js`): Dach über dem Grundriss, Walm- oder Satteldach, Traufschatten, Sockel, Fenster mit Rahmen, Tür mit Beschlag; Funktion an einem Merkmal je Typ (Schild, Esse, Banner, Kräuter, Rosette, Wappen, Säcke).
- Stroh in 4-Texel-Lagen, Ziegel in 4er-Lagen, Schindel/Schiefer versetzt; Holz mit Maserung, Stein mit Fugen und Moos, Metall mit Rost an Kanten.
- Regionen (`REGION` in render.js): Grünland/Ebene grün-oliv, Wald tannengrün, Sumpf moosbraun, Gebirge kalt grau, Wüste ocker/rost, Totenland Asche/Grabgrün/Knochen.
- Neue große Grafik nur über `PROMPTS_GRAFIK.md`.

## UI
Pixelbalken, Holz-/Stein-Paneele, Serifenschrift (Cinzel), Tooltips im Pixelrahmen; kritische Werte mit Kontrast zum Paneel.

## Verboten
Bezahlte Generatoren, SpriteCook, Pixel-Plugin, Aseprite, fremde Asset-Stile (LPC geprüft und verworfen), Nachbearbeitungsfilter über Sprites.
