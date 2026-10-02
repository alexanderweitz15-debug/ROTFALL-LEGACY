# ROTFALL – Combat Animation Overhaul (Entwickler, 02.10.2026 — verbindlich)

Ziel ist nicht „mehr Animationen“, sondern dass **jede Waffenart sich deutlich anders spielt** und der Kampf lebendiger, wuchtiger, hochwertiger wirkt. Inspiration aus hochwertigen Action-RPGs/MMOs nur für Animationstiefe, Timing, Lesbarkeit, Impact, Combat Feel — keine Kopien. Es gilt das Feature Readiness Gate (GATE.md).

1. **Grundprinzip:** eigene visuelle Identität je Waffenart (Langschwert ≠ Axt mit anderem Sprite; Speer ≠ Schwert; Dolch schnell und aggressiv; Großschwert langsam, schwer, wuchtig; Sense große breite Bewegungen; Stäbe/Magie völlig andere Bewegungslogik).
2. **Animationsprofil je Waffenart** nach Analyse des Waffensystems — mindestens: Langschwert, Großschwert, Axt, Großaxt, Streitkolben, Hammer, Speer, Stangenwaffe, Dolch, Doppelklingen, Sense, Bogen, Armbrust, Stab, magische Waffen, Bosswaffen, Unikate, plus alle weiteren im Projekt (Peitsche, Flegel, Wurfwaffen, Faustwaffen, Feuerwaffen …).
3. **Vollständiges Set je Waffenklasse (je nach Waffe):** Idle (normal, Kampf, seltene kleine Bewegungen) · Bewegung (Laufen, Kampfbewegung, Sprint, rückwärts, Richtungswechsel) · Angriff (1, 2, 3, optional 4, Finisher, schwerer Angriff) · Defensive (Block, Parade, Ausweichen, Trefferreaktion) · Treffer (leicht, schwer, kritisch, Rückstoß, Taumeln) · Tod (normal, schwer, ggf. speziell).
4. **Combo:** Angriff 1 → 2 → 3 → Finisher als zusammenhängende Bewegung, nicht drei einzelne GIFs.
5. **Gewicht sichtbar:** Dolch extrem schnell, kurze Bewegungen, wenig Erholung · Langschwert kontrolliert, klare Bögen, mittlere Erholung · Großschwert langsam, große Körperbewegung, starke Beschleunigung, deutliche Erholung, enormer Impact · Hammer sehr langsam, starke Ausholbewegung, hoher Impact, Gegnerreaktion · Speer Reichweite, Stöße, Vorwärtsbewegung, Distanzkontrolle · Sense breite Bögen, starke Rotation, großer Flächeneindruck.
6. **Flashy durch Animation + Timing + Impact + VFX**, nicht durch Partikel-Spam: Ausholen (Anticipation) → schneller Schlag → Impact-Frame → Schlageffekt → kleines Wackeln → Trefferreaktion → kurze Erholung.
7. **Impact synchronisiert:** Hit-Stop, Screen Shake, Rückstoß, Treffer-Blitz, Partikel, Schlageffekte, Klang, Funken, Bodenreaktion, Krits — ein schwerer Hammer deutlich stärker als ein Dolch.
8. **Drei Prototyp-Packs zuerst:**
   - **A Grounded RPG:** wenig Partikel, starke Körperbewegung, klare Waffenbögen, Gewicht und Schwung, deutliche Erholung, kontrollierte Effekte („hochwertiges klassisches Action-RPG“).
   - **B Heroic Fantasy:** größere Bewegungen, schnellere Combos, stärkere Schlageffekte, mehr Körper, größere Finisher, stärkerer Impact, mehr VFX („mächtiger Fantasy-Held“).
   - **C Extreme Endgame:** extrem schnelle Combos, große Bögen, Dash-Angriffe, Nachbilder, starke Hit-Stops, Wackeln, große Impact-Effekte, besondere Finisher, kombinierte VFX („komplett overpowered — und man sieht es“; besonders für spätes Endgame).
9. **Erst testen:** nur Langschwert, Großschwert, Dolch, Speer, Hammer — je alle drei Packs. Dazu ein **Combat Test Room**, in dem der Spieler zwischen Pack A/B/C wechseln kann.
10. **Danach ausrollen:** Was funktioniert, was ist zu langsam/übertrieben/schwer lesbar/inkompatibel mit dem Sprite-System → finalen ROTFALL-Stil festlegen (Entwickler) → alle Waffen überarbeiten.
11. **Waffenidentität:** keine Copy-Paste-Animationen; man soll die Waffe an der Bewegung erkennen.
12. **Bosswaffen:** dürfen eigene Angriffe, Finisher, VFX, Treffer, Idle, Combo haben — nur wo es Mehrwert bringt.
13. **Magie:** eigenes Profil — Wirken, Aufladen, Loslassen, Geschoss, Einschlag, Kanalisieren, Zauber-Combo, besondere Ultimate/Finisher; darf visueller sein.
14. **Animation = Gameplay:** Ausholen → Hitbox aktiv → Schaden → Erholung; Hitbox/Schaden nie schon während der sichtbaren Vorbereitung.
15. **Leistung:** Sprite-Anzahl, Frames, VFX, Partikel, Wackeln, Nachbilder, viele NPCs, große Kämpfe — besonders Städte, große Ereignisse, Bosse, viele Gegner (Ziel 3 ms je Bild bleibt).
16. **Bestehendes System nicht zerstören:** Sprite-, Animations-, Kampf-, Waffen-, Hitbox-, VFX-, Entity-System, Rendering, Steuerung erst analysieren; bestehende Infrastruktur erweitern, kein paralleles zweites Animationssystem.
17. **Vollständigkeitsprüfung je Waffenpaket:** Idle, Bewegung, Angriff, Combo, schwerer Angriff, Finisher, Trefferreaktion, Block, Ausweichen, Tod, VFX, Klang, Hitbox, Schadenszeitpunkt, Animationszeit, Gegnerreaktion, Koop/Gruppe, Save/Load falls relevant; alte Animationen suchen, die den Stil brechen.
18. **Qualitätsziel:** nicht „neue Sprites animiert“, sondern „ROTFALL hat ein richtiges Combat-System“ — Gewicht, Geschwindigkeit, Reichweite, Charakter je Waffenklasse.
19. **Nicht blind umsetzen:** bei wichtigem Designproblem STOPP und dokumentieren (Problem, Systeme, Lösungen, Risiken, architekturverträgliche Variante); keine Workarounds.
20. **Abschluss:** alle Waffenklassen, Packs vergleichen, finalen Stil bestimmen, Combos, Bosse, viele Gegner, große Kämpfe, Leistung, Hitboxen, Synchronität, Regressionen testen.

Leitsätze: Dolch fühlt sich schnell an. Großschwert gewaltig. Speer kontrolliert Distanz. Hammer schlägt ein. Sense reißt den Raum auf. Im Endgame darf der Kampf eskalieren.
Werkzeuge: alles im Code gezeichnet (Sperre für SpriteCook/pixel-plugin/Aseprite/bezahlte Generatoren bleibt).
