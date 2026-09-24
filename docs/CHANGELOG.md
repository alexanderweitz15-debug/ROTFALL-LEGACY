# Changelog — Rotfall: Legacy

Neueste oben. Je Eintrag: was, warum, welche Bugs. Refactorings nennen den Grund (Master-Prompt §2, Punkte 1–4).

## Session 1 — 2026-09-24 · Phasen 0–3

### Phase 0 — Durchspielen & Audit
- `docs/` angelegt: BUGS, GDD, CHANGELOG, SESSION_LOG, PHASE_STATUS, STYLE_GUIDE, DATA_SCHEMAS.
- Entwicklerzugang `?dev` → `window.RF` (Zustand, `tick(ms)` für Simulation bei verstecktem Tab, Kernfunktionen).
  Grund: KI- und Übergangsfälle lassen sich sonst nicht reproduzierbar im Browser testen.

### Phase 1 — Kritische Fehler
- **Tod/Boden terminal** (BUG-001): neuer einziger KI-Einstieg `think(e, dt)`; `downed()`/`die()` räumen Kampfzustand
  auf; kein Resthieb am Boden. Refactoring-Grund: Punkt 2 (gleiche Fehlerart in drei Zweigen von `updateNpc`) —
  eine Sperre an der gemeinsamen Stelle statt drei Einzel-Flicken.
- **Aufhelfen nur durch Nicht-Feinde** (BUG-002), **Gnadenstoß** auf gestürzte Feinde (BUG-019), Pfeile fliegen über Liegende.
- **Zorn mit Leine** (BUG-004): Spur verloren (12 Spielmin.) / Leine 640 px / Spieler überwältigt → Buße 30 Gold statt Tod.
- **Szenenübergänge** (BUG-003): `MONSTERS.interiors`; Verfolger folgen durch die Tür nach Laufzeit, Tiere lauern
  90 Spielmin., Gorak hält seine Halle. Fristen auf der Spieluhr `clock()` (Außenwelt ruht, solange man innen ist).
  Feste Ankunftspunkte (BUG-015).
- **Erbe mit eigener Habe** (BUG-005): `kinKit()`.
- Charaktererstellung: deutsche Fertigkeitsnamen (`SKILL_NAMES` in data.js, BUG-014).
- `solidPropAt` robust für Karten ohne Objekt-Index.
- `log`/`chronicle` schweigen im Selbsttest-Sandkasten (`S._quiet`).

### Phase 2 — Weltlogik & NPC-Reaktionen
- Wachen alarmieren Wachen (480 px), eilen aus 700 px herbei; Wachen/Verteidiger/Heilerin richten den bewusstlosen
  Spieler auf; Zivilisten holen die nächste Wache (einer genügt).
- Händler schließen den Stand bei Kampf in der Nähe; nach Angriff bis morgen (BUG-020).
- Gegner-Gruppen: Gleiche derselben Fraktion < 240 px übernehmen das Ziel (Rudel/Bande).
- Bluttat (`bloodshed`): Zeugen meiden den Spieler 1 Tag, Wachen werden zornig (bei Unschuldigen), Gruppe −10 Moral.
- Provokation: Gruppe kommentiert, −5 Moral.
- Dialog-Sperren für Zornige/Fliehende/Kämpfende, kalter Ton bei schlechter Beziehung (BUG-021).
- Rollen: Verteidiger (Borin, Kelan, Aldric, Tomas; Leine 360 px, Schützen halten Abstand), Heilerin kämpft nie (BUG-022).
- Wachposten je Siedlung (18 Wachen; Valen/Söldner/Orden mit eigener Ausrüstung und Farbe, neue Sprite-Berufe
  Torwache/Söldnerwache/Ordenswache), Nachrüstung alter Spielstände (BUG-023).

### Phase 3 — Übergänge, Wegfindung, Spawns
- `seek()` + `findPath()` (A* auf Kacheln, gecacht) für alle Verfolgungs-, Hilfe- und Wanderbewegungen (BUG-010).
- Spawns nie in festen Objekten; Eingeklemmte kommen frei (BUG-024).
- Reise-Begegnungen erscheinen knapp außerhalb des Bildes; Ruhezeit je Region (Heimat 40 s, Wildnis 26 s,
  Ödland 20 s, Totenreich 14 s).
- Gruppe greift den nächsten statt den ersten Feind der Liste an.

### Phase 4 — Gebäude & Props
- Neues Modul `src/buildings.js` (Refactoring-Grund: Punkt 1 — Gebäude existierten nur als Kacheln; Funktion,
  Material und Innenraum ließen sich ohne Datensatz nicht ausdrücken). Pixel-Art im bestehenden Rampen-/Kontursystem.
- `house()` in world.js legt einen `HOUSES`-Datensatz an (Typ, Stadt, Tür) und möbliert nach Funktion (`FURNISH`).
  21 Gebäude typisiert: Taverne, Schmiede, Heilerhaus, Vorsteherhaus, Kontor, Wachhaus, Kapelle, Söldnerhalle, Wohnhaus.
- Bauweise je Stadt: Eren Stroh/Fachwerk · Nordfurt Schindel/Stein · Salzhafen Ziegel/Putz · Kreuzweg Schindel/Holz ·
  Aschfurt Schiefer/Stein · Sonnwacht Schiefer/heller Stein. Banner je Herrschaft (Valen/Orden/Händler).
- Renderer: Gebäude y-sortiert an der Grundlinie, Dach blendet beim Betreten aus, Schornsteinrauch, nachts Fensterlicht
  auf der Straße; Hinweis beim Betreten („Taverne · Eren“). `sprites.js` exportiert `G`/`toCanvas`.
- Neue Props: Tisch, Bank, Bett, Etagenbett, Regal, Herdfeuer, Esse (flackern, leuchten), Theke, Schreibpult, Werkbank,
  Fassgestell, Waffenständer, Altar, Sack, Kistenstapel; Kiste/Fass je 3 Varianten, Truhe/Kiste offen/geschlossen.
- Städte: Warenstapel statt Zufallskisten; Schilder/Amboss nicht mehr vor Türen. Wildnis: Truhen als Mini-Szenen.
- Alte Spielstände: Siedlungs-Props einmalig neu ausgestattet (`flags.gen2`), Zufallsfolge der Generierung bleibt
  identisch (BUG-027), Salzhafen ohne Sumpflöcher (BUG-025).

### Performance
- Kämpferliste je Frame auf den Umkreis des Spielers (1700 px) begrenzt: Eren-Update 3,2 → 2,2 ms, Wald 4,3 → 2,4 ms.
- Lichtquellen je Karte gecacht (statt ~6500 Objekte pro Bild): Eren-Zeichnen 2,9 → 1,8 ms.
- `moveEnt` prüft „stecke ich fest?“ nur bei Blockade.

### Tests
Selbsttest 22 → 37 Prüfungen (alle bestanden, 10–15 Wiederholungen stabil). Gegenprobe: Mit wieder eingebautem
BUG-001 bzw. BUG-002 schlagen die jeweiligen Tests fehl.
