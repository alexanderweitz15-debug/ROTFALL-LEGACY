# ROTFALL – Visueller Umbau: weg vom Text (Entwickler, 02.10.2026 — verbindlich)

**Problem:** Viele Bereiche sind zu stark textbasiert und wirken wie ein Prototyp. Ziel: ROTFALL soll sich wie ein vollständiges, lebendiges RPG anfühlen; Text nur dort, wo er wirklich sinnvoll ist. Leitfrage bei jeder Überarbeitung: „Wie kann der Spieler das verstehen oder spüren, ohne einen Absatz Text lesen zu müssen?“ Am bestehenden Projekt weiterarbeiten, nichts neu anfangen, keine Systeme unnötig ersetzen. Prinzip bleibt: „Dein Charakter kann sterben. Deine Geschichte nicht.“

## 1. Inspiration (nur UX, Präsentation, Animation, Game-Feel — nichts kopieren)
WoW, Diablo, Path of Exile, Guild Wars 2, ESO, FFXIV, Runescape, Albion, Terraria, Stardew Valley, RimWorld, Kenshi, Mount & Blade, Darkest Dungeon, Hades, klassische JRPGs, moderne Indie-RPGs. Untersuchen: Wie werden Informationen, Quests, NPC-Interaktionen, Items, Tooltips, Dialoge, Treffer/Fähigkeiten/Status, Welt-Ereignisse, wichtige NPCs, Shops/Inventare, Questannahme/-abschluss, Karten/POIs, Bosskämpfe, Animationen/VFX und Feedback ohne Text dargestellt?

## 2. Pflichtablauf je wichtigem Text-Element
1. Aktuelles Problem benennen · 2. passende Inspiration · 3. **10 deutlich verschiedene Varianten** (nicht nur Farbe/Layout) · 4. je Variante kurze Idee · 5. bewerten, was am besten zu ROTFALL passt · 6. beste Variante umsetzen · 7. bei mehreren guten: beste Eigenschaften kombinieren.
Beispiel Questboard: klassisches Board · Holzbrett mit Zetteln · animiert · NPC-Verwalter · Stadtkarte mit Missionen · Fraktionsboard · schwarzes Brett mit Steckbriefen · animierte Pergamente · Quest-Terminal für Aurelion · Hybrid Board + Weltkarte.

## 3. Bereiche (Auszug der Vorgaben)
- **Dialoge:** Sprechblasen, Porträts, animierte Box, NPC reagiert körperlich, leichter Kamerazoom bei wichtigen Gesprächen, normale vs. Story-Dialoge unterschiedlich, Emotes/Gesten, kurze Szenen.
- **Quests:** Annahme, Board, Tracker, Ziele, Fortschritt, Abschluss, Belohnung, Marker, Welt-Ereignisse — möglichst in der Welt (Symbol über dem Geber, visueller Tracker, Orte markiert, besiegte Gegner zählen sichtbar, Abschluss-Animation).
- **NPCs:** Blasen, Gesten, Blickrichtung, Idle, Reaktionen auf Spieler/Kampf/Tod/andere NPCs, Gruppenverhalten, wichtige NPCs hervorheben.
- **Items:** Karten, Tooltips, Seltenheit, Präsentation, Drop-Animation, Loot-Popups, Vergleich, Stat-Vorschau, Set/Affix.
- **Kampf:** Treffer, Schadenszahlen, Krits, Status, Ausweichen/Block/Parade, Fähigkeiten, Abklingzeiten, Ausdauer, schwere Angriffe mit Ansage, Bossmechaniken, Tod, Trefferreaktionen — durch Animation, VFX, Klang, nicht Text.
- **Welt:** Wetter, Tageszeit, Feuer, Rauch, Partikel, Tiere, NPC-Tätigkeiten, Händler, Streifen, Reisende, Karawanen, Fraktionskämpfe, Zufallsereignisse, Belagerungen, Überfälle, Rettungen, Welt-Ereignisse.
- **Städte:** Markt, Händler, Schmiede, Tavernen, Boards, Wachen, Bürger, Kinder, Arbeiter, Tiere, Streifen, Fraktionspräsenz, Tagesläufe, Hinweise auf wichtige Gebäude.
- **Shops:** Händlerdialog, Warenpräsentation, Kauf/Verkauf, Vergleich, Geldanimation, seltene Ware, Händlerreaktionen.
- **Inventar:** Slots, Kategorien, Sortierung, Tooltips, Drag & Drop, Vergleich, Rüstungsübersicht, Charakterdarstellung, Item-Animationen.
- **Skilltree:** Knoten, Verbindungen, Freischalt-Animation, Hover, Vorschau, Abhängigkeiten, Klassenidentität, passiv/aktiv.
- **Karte:** Städte, Dungeons, Quests, NPCs, Karawanen, Fraktionen, Ereignisse, Unbekanntes, Spielerposition, POIs — informativ, nicht überladen.
- **Animationen:** Idle, Laufen, Angriff, Treffer, Tod, Interaktion, Gesten, UI, Loot, Quest, Level-Up, Skill-Freischaltung, Welt-Ereignisse, kurze Szenen — gezielt, nicht hektisch.
- **Visuelle Hierarchie:** auf einen Blick: wichtig, anklickbar, Quest, Händler, wichtiger NPC, Beute, Gefahr, Fähigkeit, Welt-Ereignis, Fraktion — nicht nur über Text.
- **Stil:** ROTFALL bleibt dunkel, detailliert, atmosphärisch, eigenständig; keine Low-Detail-/Block-Sprites; bestehende Charakterdesigns beibehalten und verbessern. Rüstungen variieren: beschädigt, sauber, improvisiert, schwer, leicht, Fraktion, selten, einzigartige Bossrüstung; klare Silhouetten.
- **Game-Feel-Beispiele:** „Der Gegner ist verwundet“ → sichtbar; „Quest abgeschlossen“ → kleine visuelle Bestätigung; „Boss benutzt schweren Angriff“ → telegrafiert; „NPC ist wütend“ → NPC reagiert.

## 4. Priorität
1 Dialoge · 2 Quests · 3 NPC-Interaktionen · 4 Kampf-Feedback · 5 Items/Beute · 6 Inventar · 7 Shops · 8 Skilltree · 9 Karte · 10 Städte · 11 Welt-Ereignisse · 12 allgemeine UI · 13 Animationen/VFX · 14 sonstige Textsysteme. Danach selbst weitere Prototyp-Stellen suchen.

## 5. Erst analysieren, dann umsetzen
Spiel analysieren → alle text-/statischen Elemente listen → je Element 10 Varianten → Inspiration → Auswahl → (Feature Readiness Gate, ROTFALL_STATE/GATE.md: Impact Report, offene Entscheidungen) → umsetzen → im Spiel testen → prüfen, ob es wirklich besser aussieht und sich besser anfühlt → Schwaches überarbeiten. Keine blind eingeführten UI-Systeme; alles passt zum bestehenden Gameplay.

## Hinweis zu Werkzeugen
Die Nachricht nennt die Skills spritecook-animate-assets und pixel-art-creator. Laut Entscheidung des Entwicklers („Alte Sperre bleibt“: kein SpriteCook, keine bezahlten Bildgeneratoren, kein pixel-plugin, kein Aseprite) wird weiter alles im Code gezeichnet — bis der Entwickler die Sperre ausdrücklich aufhebt.

## Ablage
Analyse und Varianten: `ROTFALL_STATE/visual/<bereich>.md` (Problem, Inspiration, 10 Varianten, Bewertung, Wahl, Impact Report, offene Entscheidungen). Bilder: `ROTFALL_STATE/visual/img/`.
