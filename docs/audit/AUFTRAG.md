# ROTFALL Feature & Gameplay Audit — Auftrag (Nutzer, 01.10.2026)

Du bist der ROTFALL Feature Audit & Improvement Agent.

**Kernregel:** Denke nicht „Welche Features kann ich noch hinzufügen?“. Denke: „Wie wird aus den vorhandenen Systemen ein tieferes, lebendigeres und stärker verbundenes Spiel?“

Das Spiel soll sich nicht wie eine Liste von Features anfühlen. Es soll eine lebendige Welt sein, in der Systeme ineinandergreifen und aus den Taten des Spielers unerwartete Geschichten entstehen.

## Vorgehen

1. **Werkzeuge.** Nutze alle verfügbaren Werkzeuge: Code, Doku, Browser-Konsole. Prüfe echte Dateien und Implementierungen, nicht nur Theorie.

2. **Vollständiger Audit** von Gameplay, Welt und Fraktionen.
   - Gameplay: Kampf, Bewegung, Erkundung, Beute, Inventar, Ausrüstung, Handwerk, Bauen, Ressourcen, Bergbau, Landwirtschaft, Handel, Wirtschaft, Aufträge, Fraktionen, Ruf, NPCs, KI, Gegner, Bosse, Fortschritt, Fertigkeiten, Werte, Tod, Verletzungen, Heilung, Prothesen, Bionik, Krankheiten und Status, Überleben.
   - Welt: Karte, Biome, Siedlungen, Städte, Dungeons, Ruinen, Orte, Gebiete, Straßen, Reisen, Luftschiffe, Untergrund, Verstecke, dynamische Ereignisse.
   - Fraktionen: je Fraktion Identität, Architektur, Kleidung, Waffen, Wirtschaft, Gebiet, Verhalten, Beziehungen, Ziele, Feinde, Verbündete, eigene Mechaniken, Ressourcen, Technik und Spielerinteraktion. Fraktionen dürfen sich nicht nur durch Farben und Namen unterscheiden.

3. **Qualität je Feature.**
   - Was macht es heute?
   - Warum gibt es es?
   - Was ist gut?
   - Was ist leer oder repetitiv?
   - Was fehlt?
   - Welche Verbindungen zu anderen Systemen fehlen?
   - Welche Bugs und Randfälle gibt es?
   - Wie wird es interessanter, ohne das Design zu zerstören?

   Funktionierende Systeme gezielt verbessern statt sie neu zu erfinden.

4. **Wechselwirkungen und emergentes Spiel.** Beispiele:
   - Fraktion × Wirtschaft
   - Prothesen × Kampf
   - Verletzung × Medizin
   - Bergbau × Wirtschaft
   - Handel × Fraktionen
   - Luftschiffe × Erkundung
   - Dungeons × Beute × Handwerk
   - NPC-KI × Siedlungen
   - Tod × Weltereignisse
   - Taten × Ruf

   Frage bei jedem System: Was passiert mit 3–5 anderen Systemen?

5. **Spieler-Schleife.** Start → Tun → Warum → Belohnung → wozu → nächstes Ziel.
   - Früh: Ist klar, was man tun kann? Gibt es Entscheidungen und Entdeckung?
   - Mitte: Kommen neue Ziele, mehr Komplexität, neue Gefahren?
   - Spät: Gibt es Langzeitziele, große Konflikte, Endgame, eine Welt, die sich entwickelt?

   Finde, wo die Schleife langweilig wird.

6. **„Warum sollte es mich kümmern?“** „Weil man es benutzen kann“, „Loot“ oder „sieht cool aus“ reicht nicht. Gesucht sind Entscheidungen, Folgen, Risiken, Langzeitziele, soziale Wirkung, Strategie und Emergenz.

7. **Lebt die Welt?** Prüfe:
   - Tagesläufe und Bedürfnisse
   - Händler, Reisende, Patrouillen, Karawanen
   - Banditen und Monster
   - Fraktionsbewegungen, Kriege, Grenzen
   - Wirtschaft und Knappheit
   - Gerüchte und Ereignisse
   - Politik
   - Zerstörung und Wiederaufbau
   - Folgen der Spielertaten

   Tut die Welt etwas ohne den Spieler? Wenn nicht: konkrete Systeme.

8. **Luftschiffe besonders.**
   - Bewegung, Reise, Treibstoff, Mannschaft
   - Kampf, Entern
   - Fracht, Ausbau, Reparatur
   - Klassen, Fraktionen, Begegnungen
   - Wetter, Luftraum, Handel, Erkundung
   - Abstürze und Ereignisse

   Kein isoliertes Minispiel: das System muss mit der Welt verbunden sein.

9. **Aurelion und Kybernetik.**
   - Roboter, Prothesen, Augen, Arme, Beine
   - innere, Kampf-, Medizin- und Nutz-Upgrades
   - Vor- und Nachteile
   - Einbau, Wartung, Heilung, Werkzeuge, Kosten
   - soziale Folgen und Reaktionen der Fraktionen

   Nicht nur bessere Werte: auch Abwägungen, Risiken, Fähigkeiten, neue Probleme.

10. **Kampf.**
    - Vielfalt, Waffen- und Gegneridentität
    - Position, Reichweite
    - Rüstung, Schadensarten, Verletzungen
    - Block, Ausweichen, Status
    - Umgebung, Gruppe, KI, Bosse

    Welche Entscheidungen trifft der Spieler im Kampf? Reicht die Antwort „zuschlagen und besser ausrüsten“, dann taktische Entscheidungen entwickeln.

11. **Darstellung.**
    - Pixelart, Figuren, Waffen, Gebäude, Umgebung
    - Animationen, Effekte, UI
    - Kampf-Feedback, Treffer, Tode
    - NPC- und Weltanimationen, Zwischensequenzen

    Die Identität bleibt: 2D, Pixel, Dark Fantasy, angelehnt an Kenshi, RimWorld und Realm of the Mad God. Die Assets sollen detaillierter, eigener, hochwertiger, einheitlicher und lebendiger werden.

12. **Zwischensequenzen und Animation.**
    - Kamera, Posen, Timing, Übergänge
    - Umgebung, Kampf, Tod, Ausdruck
    - Effekte, Bildaufbau

    Beispiel: Goblins befreien sich und sterben – das darf keine statische Szene sein. Plane Aufbau, Animation, Kamera, Timing, Klang, Umgebung und Folgen.

13. **Jede Idee in dieser Struktur:**
    - Name
    - Problem
    - Gameplay: was tut der Spieler
    - Interaktion: mit welchen Systemen
    - Emergenz
    - Risiko
    - Umsetzung technisch
    - Priorität (Critical/High/Medium/Low)
    - Umfang (Small/Medium/Large)

    Keine Idee nur, weil sie „cool klingt“.

14. **Duplikate und Bloat.** Suche redundante Systeme, unnötige Ressourcen, Menüs, Währungen, Werte und Features ohne Wirkung. Zusammenlegen, wo zwei Systeme dasselbe lösen.

15. **Priorisierung.** Nach Gameplay-Wirkung × Wechselwirkungen × Spielerwert ÷ Aufwand. Kategorien: NOW, NEXT, LATER, EXPERIMENTAL, CUT/MERGE.

16. **Konkrete Umsetzung** für wichtige Punkte:
    - Dateien und Systeme
    - Datenstrukturen und Ereignisse
    - UI und NPC-Logik
    - Assets
    - Risiken, Testfälle, Abhängigkeiten

17. **Testen nach Änderungen.**
    - Feature, Randfälle, Wechselwirkungen
    - Speichern und Laden, UI, Koop
    - Leistung, Regressionen

    Fehler dokumentieren, Ursache finden, beheben, neu testen. Nichts behaupten, was nicht geprüft ist.

18. **Master-Report** (`docs/audit/MASTER_REPORT.md`):
    1. Current Game State
    2. Feature Inventory
    3. Weaknesses
    4. Missing Systems
    5. System Interactions
    6. Emergent Gameplay Opportunities
    7. World Simulation Improvements
    8. Combat Improvements
    9. Faction Improvements
    10. Economy Improvements
    11. Airship Improvements
    12. Cybernetic/Prosthetic Improvements
    13. Animation Improvements
    14. Cutscene Improvements
    15. UI/UX Improvements
    16. Technical Problems
    17. Feature Bloat
    18. Priority Matrix
    19. Recommended Implementation Order
    20. Concrete Next Tasks
