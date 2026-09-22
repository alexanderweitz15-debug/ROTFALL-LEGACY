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
| `src/world.js` | Greenmark-Grenzland (128×128) und Verlassene Grube, Kacheln, Kollision |
| `src/render.js` | Canvas-Rendering: Kacheln, prozedurale Sprites, Licht, Wetter, Effekte |
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
Seefahrt, RTS-Schlachten, Mehrspieler, handgezeichnete Sprite-Assets (Figuren sind prozedural gezeichnet).

## Revision: Körper, Verbände, Ausweichen

- **Trefferzonen:** Kopf, Rumpf, Arme, Beine mit eigenen HP. Kopf auf 0 = Enthauptung, Rumpf auf 0 = Tod, Arm/Bein auf 0 = Funktion weg (Waffe fällt, Humpeln). Der Kopf wird selten getroffen.
- **Verbände:** Heilen nur mit Verband oder Kraut, pro Körperteil und mit Kanalzeit. Man kann sie aus Stoff schneiden, kaufen oder bei Banditen und Goblins finden.
- **Ausweichen (Q):** mit I-Frames, Abklingzeit, Ausdauerkosten und Richtung. Geht nicht mit lahmem Bein.
- **Körperbau:** 5 Varianten (ausgewogen, drahtig, bullig, hochgewachsen, gedrungen) mit Spielunterschieden.
- **Wundarzt-Tafel:** Charaktermenü mit Körpersilhouette, die nach HP eingefärbt ist. Screenshots liegen in `docs/screenshots/`.
- **Jitter-Fix:** KI nutzt Hysterese beim Bedrohungs-Tracking.
