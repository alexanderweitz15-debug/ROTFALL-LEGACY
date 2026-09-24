# ROTFALL-LEGACY
Rotfall: Legacy ist ein düsteres Sandbox-RPG mit  Singleplayer-Modus. Erkunde eine lebendige Fantasy-Welt, kämpfe, handle, rekrutiere Gefährten, gründe Fraktionen und baue dein eigenes Reich auf. Dein Charakter kann sterben – doch deine Geschichte lebt durch sein Vermächtnis weiter.


Browser-RPG nach dem Master-GDD (§142/§143), Phasen 01–20. Kein Build-Schritt, keine Abhängigkeiten.

## Starten

ES-Module laufen nicht über `file://`, daher einen lokalen Server nutzen:

```sh
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

`http://localhost:8000/?test` führt beim Laden den eingebauten Selbsttest aus (Ergebnis in der Konsole).
Strg+Shift+D öffnet das Debug-Menü.

## Steuerung

WASD bewegen · Linksklick/Leertaste angreifen · Rechtsklick Ziel wählen · E interagieren · Q ausweichen ·
1–8 Leiste · I Inventar · C Charakter · G Gruppe · B Lager · F Fraktion · K Chronik · M Karte · J Aufträge · Esc.

## Aufbau

| Datei | Inhalt |
|---|---|
| `src/state.js` | Spielzustand, Seed-RNG, Log, Chronik, Speichern (localStorage, versioniert) |
| `src/data.js` | Items, Gegner, NPCs, Klassen, Fähigkeiten, Fraktionen, Gebäude, Quests |
| `src/world.js` | Greenmark-Grenzland (512×512, 26 Orte, Totenreich im Südosten) und Verlassene Grube, Kacheln, Kollision |
| `src/sprites.js` | Pixel-Sprite-System: Raster, Paletten-Rampen, Kontur, Posen/Animationen, Waffen, Tiere, Boss, Bodentexturen |
| `src/sfx.js` | Klangsynthese (WebAudio, ohne Dateien): Schwung/Treffer nach Waffengewicht, Knochen, Metall, Schritte, Ausweichen, Magie, Wind |
| `src/render.js` | Canvas-Rendering: Kachel-Chunks, Sprites, pixelisierte Props, Licht, Wetter, Effekte |
| `src/ui.js` | HUD, Kontextpanel, Dialog, Fenster (Inventar, Gruppe, Lager, Fraktion, Chronik, Karte) |
| `src/sim.js` | Weltsimulation: Stadtmärkte (Angebot/Nachfrage), Karawanen, Heere, Front, Eroberung, Flüchtlinge |
| `src/game.js` | Schleife, Kampf, KI, Gruppe, Quests, Siedlung, Weltsimulation, Tod und Erbe |

## Welt ohne Spieler (Phase 18–20)

- **Märkte:** Eren erzeugt Weizen, Nordfurt Salz und Tuch. Die Preise folgen dem Vorrat, Weizen ist in Eren billig und in Nordfurt teuer.
- **Karawanen** fahren die Alte Straße und werden von Banditen überfallen. Wer sie begleitet, bekommt Gold und Ansehen.
- **Krieg:** Das Heer der Untoten zieht über einen Knotengraphen (Friedhof → Moor/Feste → Eren → Straße → Nordfurt). Valen versorgt sein Heer mit Nordfurts Weizen.
- **Schlachten:** Weit vom Spieler werden sie statistisch aufgelöst. In seiner Nähe werden die Heere zu echten Einheiten.
- **Eroberung:** Fällt eine Stadt, fliehen Menschen, der Handel ruht, und die Besatzung wird sichtbar. Wer sie auslöscht, befreit den Ort und erhält den Titel „Befreier von …“.

## Bewusst nicht enthalten (spätere Phasen laut GDD)

Backend/Datenbank (localStorage genügt für Einzelspieler), Phaser (Canvas 2D reicht), Verbrechen/Kopfgeld,
Seefahrt, RTS-Schlachten, Mehrspieler. Es gibt keine Bilddateien: alle Sprites entstehen im Code als echtes Pixelraster.

## Revision: Körper, Verbände, Ausweichen

- **Trefferzonen:** Kopf, Rumpf, Arme, Beine mit eigenen HP. Kopf auf 0 = Enthauptung, Rumpf auf 0 = Tod, Arm/Bein auf 0 = Funktion weg (Waffe fällt, Humpeln). Der Kopf wird selten getroffen.
- **Verbände:** Heilen nur mit Verband oder Kraut, pro Körperteil und mit Kanalzeit. Man kann sie aus Stoff schneiden, kaufen oder bei Banditen und Goblins finden.
- **Ausweichen (Q):** mit I-Frames, Abklingzeit, Ausdauerkosten und Richtung. Geht nicht mit lahmem Bein.
- **Körperbau:** 5 Varianten (ausgewogen, drahtig, bullig, hochgewachsen, gedrungen) mit Spielunterschieden.
- **Wundarzt-Tafel:** Charaktermenü mit Körpersilhouette, die nach HP eingefärbt ist. Screenshots liegen in `docs/screenshots/`.
- **Jitter-Fix:** KI nutzt Hysterese beim Bedrohungs-Tracking.

## Grafik: Pixel-Sprite-System

Art Direction sind die Referenzblätter (grimdark, gedrungene Figuren, Kapuzen, Masken, zerlumpte Säume).
Alle Figuren folgen denselben Regeln (`src/sprites.js`):

- **Raster** 20×25 Sprite-Pixel für Humanoide, 28×18 für Tiere, 34×38 für den Boss; **2 Welt-Einheiten je Pixel**, ohne Glättung.
- **Pivot** Fußmitte; Hitboxen bleiben unverändert.
- **Kontur** 1 px fast schwarz um jede Silhouette. **Licht** von oben links; Rampen hell/basis/schatten/tief mit Farbverschiebung.
- **Palette** gedämpft (Eingangsfarben werden entsättigt); Akzente: Ordens-Rot, Valen-Blau, Nekro-Türkis.
- **Animationen** Idle (2), Laufen (4), Ausholen, Schlag, Treffer, Zaubern, Ausweichrolle, Knien/Sterben, Liegen.
- Aussehen folgt der Ausrüstung (Leder, Kette, Platte, Helme, Umhang/Kapuze, Schilde mit Wappen) und dem Beruf der NPCs.
- Props, Gebäude, Gräber und Item-Icons werden einmal gezeichnet, dann pixelisiert (harte Kanten, Kontur, Randlicht) und gecacht.
- Boden: 16×16-Texturen je Kacheltyp, zu Chunks gebacken, mit ausgefransten Übergängen und Uferkanten.

## Vertical Slice: der Grubenpfad

Qualitätsmaßstab für den Rest des Spiels. Von Eren nach Norden: Wegschrein → gewundener Waldweg →
Kreuzung mit Wegweiser → Wachturm-Ruine (Landmarke, Untote) → überfallenes Händlerlager (Goblins, Blutspur) → Grube.

- **Waffen** haben eigene Pixel-Designs und eigenes Gefühl (`FEEL` in `game.js`): Gewicht, Hit-Stop, Kamerawackeln, Ausfallschritt.
  Schwünge mit Ausholen → Schlag → Nachschwung, Speer und Dolch stoßen; die Klingenspur folgt der echten Bahn.
- **Gegner** verhalten sich unterschiedlich: Wolf duckt sich und springt, Goblins tänzeln seitlich und springen nach dem Hieb zurück,
  Skelette holen sichtbar aus (Ansage als Pixelbogen).
- **Treffer**: Hit-Stop, Aufprallstern (Krit mit Ring und Zoomstoß), Rückstoß, Blut bzw. Knochensplitter, Klang nach Waffengewicht.
- **Kamera** schaut leicht zur Maus voraus; „Reduzierte Bewegung“ schaltet Wackeln, Zoomstoß und Vorlauf ab. Lautstärke in den Einstellungen.
