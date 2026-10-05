# ROTFALL: LEGACY — Master-Anweisung und Feature-Roadmap

> **Hinweis (05.10.2026):** Teil A (Arbeitsregeln) ist in `CLAUDE.md` aufgegangen und gilt dort; Teil B und C (Vision, Pakete, Prioritäten, End-to-End-Tests) bleiben als Roadmap maßgeblich.

Stand: 2026-09-30. Vom Nutzer als verbindliche Arbeitsgrundlage übergeben. Diese Datei ist die Referenz für Claude und seine Agenten. Die Statustabelle der laufenden Pakete steht weiter in `PLAN_S15.md`; der Ist-Zustand des Codes in `IST_ZUSTAND.md`.

## Teil A — Arbeitsregeln (vor jeder Implementierung)

> **Abgelöst (05.10.2026):** Arbeitsregeln stehen nur noch in `CLAUDE.md`; Teil A bleibt Lesestoff. Die Schritte „Skills auflisten, Plugins prüfen“ und die Opus/Sonnet-Agentenregel gelten nicht mehr.

### A.0 Reihenfolge
1. Verfügbare Skills auflisten, relevante Skill-Anweisungen lesen und anwenden (Repository-Analyse, Coding, Architektur, Testing, Debugging, UI, Dokumentation, Performance, Agentenarbeit).
2. Verfügbare Plugins und Integrationen prüfen und einsetzen (Code-Analyse, Dateien, Browser-/UI-Tests, Debugging, Testing, Subagenten, Dokumentation).
3. `docs/IST_ZUSTAND.md` lesen, danach die echte Repository-Struktur analysieren. Prüfen, welche dort als offen bezeichneten Systeme inzwischen teilweise oder ganz existieren. Die Doku ist nicht automatisch der aktuelle Stand.
4. Vorhandene Systeme wiederverwenden: erst nach Funktionen, Modulen, Events, State-Strukturen, UI-Komponenten und Debug-Funktionen suchen. Existiert ein System: erweitern statt duplizieren. Keine parallele zweite Implementierung.
5. Erst danach den Implementierungsplan erstellen.

Arbeitsreihenfolge: Plugins/Skills/Tools prüfen → Projekt analysieren → bestehende Systeme prüfen → Abhängigkeiten planen → implementieren → mit Agenten testen → Fehler beheben → erneut testen → erst dann als fertig markieren.

### A.1 Agenten-Regel
- Höchstens 3–4 Opus-5.5-Agenten für komplexe Aufgaben: Architektur, große Systemintegration, Save-/State-Migration, komplexe Gameplay-Systeme, schwierige Regressionen, finale Gesamtprüfung.
- Sonnet-Agenten für einfache, klar abgegrenzte Aufgaben: kleine Code-Reviews, UI-Checks, Testfälle, Referenzsuche, einfache Regressionstests, Datenprüfungen, Dokumentation, kleine Bugfixes, Performance-Smoke-Tests.
- Nicht für jede Kleinigkeit Opus verwenden.

### A.2 Pflicht vor der Implementierung
Die Agenten stellen zuerst fest: Was existiert bereits? Was ist nur dokumentiert? Was ist teilweise implementiert? Was ist kaputt? Was fehlt vollständig? Welche Systeme hängen voneinander ab? Welche Features müssen zuerst gebaut werden? Welche Änderungen könnten Savegames brechen? Welche bestehenden Systeme dürfen nicht überschrieben werden?

### A.3 Definition of Done
Ein Feature ist erst fertig, wenn es implementiert, integriert, getestet, gespeichert, geladen, auf Fehlerzustände geprüft, auf Regressionen geprüft und bei Bedarf über Debug-Funktionen reproduzierbar getestet wurde. Zusätzlich (Teil C §42): UI vorhanden, Debug-Test vorhanden, mindestens ein Sonnet-Testagent hat geprüft, bei komplexen Features ein Opus-Review, keine doppelten Systeme, keine kaputten Referenzen, keine undefined-/NaN-Probleme, Performance geprüft, Mobile/Touch soweit relevant geprüft, bestehende Mechaniken funktionieren weiter.

## Teil B — Animation & Cinematic Overhaul

Ziel: Animationen und Cutscenes deutlich lebendiger und hochwertiger. Bestehende Art Direction, Sprites und Welt bleiben. Nicht einfach Animationen hinzufügen: Techniken anderer Spiele analysieren und daraus eigene ROTFALL-Lösungen entwickeln. Keine 1:1-Kopien von Assets, Figuren, Animationen oder Szenen.

### B.1 Referenzanalyse
Mit Recherche-Tools Spiele mit starken Charakter-, Kampf- und Pixel-Art-Animationen, Top-Down-Inszenierung, Umgebungsanimation, Todesanimationen, Cutscenes, Kameraarbeit, Partikeln und Timing untersuchen (z. B. Kenshi, RimWorld, Terraria, Starbound, Hyper Light Drifter, Darkest Dungeon, Hades, Dead Cells, Hollow Knight, Stardew Valley, Enter the Gungeon, Fear & Hunger, Blasphemous, ältere JRPGs, moderne Indie-Pixelspiele). Je Referenz: Wie wird Bewegung vermittelt, wie lang sind Animationen, wie wird Gewicht vermittelt, wie funktionieren Hit-Reactions und Todesanimationen, wie wird die Kamera eingesetzt, wie wird ohne 3D dramatisch, wie werden Partikel, Licht, Screen Shake und Sound eingesetzt, wie entsteht mit wenigen Frames glaubwürdige Bewegung. Daraus eigene Patterns ableiten.

### B.2 Grundanimationen (nach Gameplay-Relevanz priorisieren)
Idle, Walk, Run, Sprint, Turn, Stop, Start, Attack anticipation/attack/recovery, Block, Dodge, Hit, Heavy hit, Stagger, Knockback, Fall, Get up, Death, Interaction, Pickup, Carry, Use item, Heal, Cast/Channel spell, Mount/Dismount, Climb, Swim, Burn, Freeze, Poison reaction.

### B.3 Gewicht und Schwung
Anticipation, Beschleunigung, Abbremsen, Overshoot, Recovery, Squash/Stretch soweit stilgerecht, Waffen-Follow-through, Körperneigung, Richtungs-Momentum, Attack commitment. Ein schwerer Ritter stoppt anders als ein Schurke; ein großer Gegner verliert beim Treffer sichtbar Gewicht; Goblins reagieren hektisch und leicht.

### B.4 Kampfanimationen
Je Angriff: Hit Flash, gerichtete Trefferreaktion, Waffen-Impact, Blut/Splitter/Magiepartikel, kurzer Screen Shake, optional Hit-Stop, unterschiedliche Effekte und Sounds für Rüstung, Fleisch, Untote, Automaten. Nicht jeden Treffer maximal; starke Treffer deutlich stärker.

### B.5 Waffen-Animationen
Schwert (Slash 1/2, Heavy, Stoß, Parade), Axt (Überkopf, Seitschwung, schwerer Impact), Speer (Stoß, Fegen), Bogen (Spannen, Zielen, Lösen, Rückstoß), Magie (Vorbereitung, Wirken, Geschoss, Einschlag), Aurelion-Magitech (Energieladen, Kristallglühen, mechanischer Rückstoß, Hitze, Funken, Dampf, mechanische Bewegung).

### B.6 NPC-Leben
Schmied hämmert, Händler sortiert, Bauer arbeitet, Wache schaut sich um, Soldat patrouilliert, Magier liest, Schüler schreibt, Priester betet, Mechaniker repariert Roboter, Bionik-Händler untersucht Prothese, Koch kocht, Reisender packt, Gefangener sitzt oder läuft, Goblins streiten, arbeiten, feiern. An die Tagesabläufe gebunden.

### B.7 Umgebungsanimation
Gras und Bäume im Wind, Fahnen, Rauch, Feuer, Wasser, Wasserfälle, Nebel, Regen, Schnee, Staub, Maschinen, Förderbänder, Zahnräder, Aurelion-Kristalle, Lampen, Magitech-Energie, Schiffe und Luftschiffe, NPC-Verkehr. Nicht alles permanent animieren (Performance).

### B.8 Tod und Verletzung
Je Wesen und Todesart: normaler Fall, Rückwärts-/Vorwärtssturz, Knie → Zusammenbruch, Knockback → Boden, Feuer → Kollaps, Frost → Einfrieren → Brechen, Magie → Auflösen, Untote → Zerfallen, Automat → Funken → Abschalten, schwer Verletzter → Ringen → Fall, großer Gegner → mehrere Impact-Frames. Kurz, aber die Ursache muss erkennbar sein.

### B.9 Goblin-Befreiungsszenen
Nicht mehr wie Dialogsequenzen. Beispielablauf: Kamera etabliert Ort → Goblins beobachten → einer löst vorsichtig Fesseln → anderer lenkt Wachen ab → Werkzeug → Fessel gibt nach → Moment der Hoffnung → gegenseitiges Befreien → Eskalation → Wachen reagieren → Flucht oder Kampf → einzelne Goblins werden getroffen oder getötet (individuelle Hit-/Todesanimationen) → Überlebende reagieren sichtbar → Kamera auf die entscheidende Handlung → Konsequenz für die Welt. Nicht jeder Goblin muss sterben; jeder Tod muss dramaturgisch nachvollziehbar sein.

### B.10 Kamera
Pan, Follow, Focus, Zoom, Slow Zoom, Shake, Tracking, Framing, Close-up, Wide, Establishing, Character Focus, Vorder-/Hintergrund-Ebenen, weiche Übergänge, Fade, Flash, Fokuswechsel. Kamera nicht dauernd bewegen; Stille zählt.

### B.11 Inszenierung
Wichtige Szenen bewusst planen: Establishing Shot (wo), Character Shot (wer), Action Shot (was), Reaction Shot (wie reagieren andere), Consequence Shot (was hat sich geändert). Nicht zwanghaft überall.

### B.12 Dialog und Animation
Blickrichtungen, Gesten, Kopfbewegungen, Waffenbewegungen, Nervosität, Wut, Angst, Freude, Gestikulieren, Wegschauen, Annäherung/Distanz. Wichtige Figuren mit erkennbarer Körpersprache.

### B.13 Emotionale Reaktionen
Goblin stirbt → anderer schaut hin, Pause, Schock/Wut, Flucht oder Angriff. König stirbt → Wachen, Hof, Volk reagieren. Dorf angegriffen → NPCs rennen, Zivilisten fliehen, Wachen greifen zu Waffen, Händler schließen, Feuer breitet sich aus. Prothese → Verletzung, Installation, erste Bewegung, Schmerz, Anpassung, Nutzung.

### B.14 Luftschiff-Cinematics
Flug (Propeller, Rauch, Dampf, Kristallenergie, Lichter, Schatten, Wind, Schweben), Kampf (Rückstoß, Kanonen, Kristallwaffen laden, Explosionen, Schaden, Funken, Feuer), Absturz mehrstufig (Stabilität verloren, Motor versagt, Rauch, Besatzung reagiert, Kippen, Teile brechen, Absturz, Impact, Trümmer, Überlebende/Loot/Quest).

### B.15 Boss- und Ereignis-Cinematics
Frostkönig, Omega, Hoher Rat, Aurelion-Ränge, große Monster, Belagerungen, Goblinsturm, Fall Aurelions, König Varon, wichtige Banditenführer. 3–8 sehr gut inszenierte Sekunden schlagen 60 Sekunden Text.

### B.16 Technik
Datengetrieben: `ANIMATION_DEFS = { goblin: { idle, walk, attack, hit, death } … }` mit Frame-Dauer, Loop/Once, Callbacks, Events (`{ time: 0.32, event: 'impact' }`), Partikel, Sound-Trigger, Kamera-Effekte, Hit-Stop, Sprite-Transforms. Gameplay, Sound und VFX synchron.

### B.17 Performance
Zentrale Tick-Logik, keine tausend Timer, Culling außerhalb des Bildes, reduzierte Animation bei fernen NPCs, Frame-Reuse, Partikel-Limits, Budgets je Cutscene. Muss mit vielen NPCs skalieren.

### B.18 Debug
Animation abspielen/pausieren/Einzelbild/Tempo, Hitbox-Anzeige, Event-Marker, Kamera-Debug, Cutscene-Replay, Skip, erzwungene Todes-/Verletzungs-/Trefferanimation, Cinematic-Test, Luftschiffabsturz-Test, Goblin-Befreiungs-Test.

### B.19 Cutscene-Regressionstests
Start, Ende, Kamera, Dialog, NPC-Positionen, Animationen, Death States, Sound/VFX-Events, Speichern während/nahe der Szene, Neuladen danach, Skip, Wiederholung, alternative Ausgänge, tote NPCs, fehlende NPCs, abgeschlossene Quest, verschiedene Spielstände. Eine Cutscene darf keinen NPC duplizieren, keinen Quest-Zustand zurücksetzen und keine tote Figur wiederbeleben.

### B.20 Definition of Done (Animation)
Zentrale Charakteranimationen überarbeitet, Kampfanimationen verbessert, Hit-/Death-Reaktionen, NPC-Aktivitäten animiert, Umgebungsanimationen, Kamera-System, wichtige Cutscenes neu inszeniert, Goblin-Befreiung dynamisch, Todesfälle nachvollziehbar, Luftschiff-Szenen, Major Events inszeniert, Animationen mit Gameplay synchron, Performance getestet, Cutscenes mit mehreren Spielständen getestet.

### B.21 Agenten (Animation)
Opus 1 Animation-Architektur (System, Daten, Timing, Events, Integration, Performance). Opus 2 Cinematic/Gameplay-Integration (Cutscene-System, Kamera, Dialog, Sequenzen, Goblin-Befreiung, Major Events). Opus 3 QA/Regression (Cutscene-Tests, Save/Load, Quest-Zustände, Animation-Zustände, Edge Cases). Optional Opus 4 finale Prüfung. Sonnet für einzelne Animationen, kleine UI-Änderungen, einfache Cutscene-Skripte, Testfälle, Datenpflege, Doku, kleine Fixes, Performance-Smoke-Tests.

### B.22 Regel
Jede Animation braucht eine Funktion: Bewegung erklären → Gewicht vermitteln → Emotion zeigen → Gameplay lesbarer machen → Welt lebendiger machen. Bei Cutscenes nicht mehr Text, sondern bessere Inszenierung; der Spieler soll verstehen, was passiert, bevor es ihm erklärt wird.

## Teil C — Master Feature Roadmap

### C.1 Grundprinzipien
Bestehendes Design erhalten (2D Top-Down, Pixel-Hybrid, dunkle Fantasy, Kenshi/RimWorld/RotMG-Wirkung; Aurelion technologisch weit voraus, aber Teil derselben Welt). Systeme statt isolierter Features: neue Systeme beeinflussen mehrere bestehende. Beispielketten: Bionik → Kristalle/Metall → Fabriken → Rohstoffhandel → Preise → Sabotage → Händler → Karawanenrouten → Banditen → Versorgung. Krieg → Flüchtlinge → Bevölkerung → Wirtschaft → Preise → Banditen → Macht. Verletzung → Prothese → Werkzeug → Aurelion-Händler → Kampfkraft. Luftschiffabsturz → Wrack → Bergung → Teile → Reparatur → neue Technik. Städtewachstum → Händler → Waren → Bevölkerung → Kriminalität → Wachen. Seuche → Arbeitskräfte → Produktion → Preise → Hunger → Unruhen.

### C.2 Lebendige Welt / NPC-Simulation
Tagesabläufe (aufstehen, arbeiten, essen, trinken, schlafen, beten, trainieren, handeln, reisen, Wache, Taverne, Familie, Arzt), außerhalb der Nähe abstrahiert. Mehr Berufe (Arzt, Chirurg, Bionik-Händler, Ingenieur, Magitech-Ingenieur, Luftschiffmechaniker, Pilot, Gelehrter, Boten, Karawanenführer …). Beziehungen (Freundschaft, Rivalität, Feindschaft, Familie, Partnerschaft, Loyalität, Schulden, Handel, Fraktion); Tode wichtiger NPCs wirken. Leichte Persönlichkeitswerte (Mut, Gier, Loyalität, Grausamkeit, Intelligenz, Frömmigkeit, Risikobereitschaft, Hilfsbereitschaft) für Dialoge, Flucht, Verrat, Preise, Rekrutierung.

### C.3 Städte als Simulation
Stadtwerte: Bevölkerung, Nahrung, Wohlstand, Sicherheit, Kriminalität, Arbeitsplätze, Händlerzahl, Militärstärke, Stabilität, Fraktion, Versorgung, Medizin, Technologie-Level. Konsequenzen: wenig Nahrung → Preise, Abwanderung, Flüchtlinge, Banditen, Unruhen; hohe Sicherheit → weniger Überfälle, mehr Händler, Wachstum; hohe Kriminalität → Schmuggler, Diebe, Erpressung, Schwarzmarkt, korrupte Wachen.

### C.4 Fraktionskrieg 2.0
Eroberungskette: Angriff → Verteidiger verlieren → Ort fällt → neue Garnison → neue Verwaltung → Steuern → Bevölkerung reagiert → Unzufriedenheit → Rebellen → erneuter Wechsel. Gebietswechsel ändert Uniformen, Händler, Preise, Wachen, Quests, Steuern, Patrouillen, Straßen, Ereignisse, Fraktionsbeziehungen.

### C.5 Banden
Lager mit Anführer, Territorium, Wachen, Gefangenen, Beute, Kontakten, Nahrung, Waffenlager. Banden rauben, verlangen Schutzgeld, kontrollieren Straßen, nehmen Gefangene, bedrohen Händler, bekämpfen Rivalen, handeln mit Fraktionen. Spieler: Lager zerstören, Anführer töten, Gefangene befreien, beitreten, zahlen, infiltrieren, Rivalen ausspielen.

### C.6 Verletzungen und Medizin 2.0
Verletzungstypen (Prellung, Schnitt, schwerer Schnitt, Blutverlust, Fraktur, Verbrennung, Infektion, Narbe, Nervenschaden, Augen-/Arm-/Beinverlust, dauerhaft). Behandlung: Bandagen, Medizin, Arzt, Chirurg, Magie, Alchemie, Bionik, Aurelion-Technik. Schwere Verletzungen mit Langzeitfolgen.

### C.7 Bionik — Priorität hoch
Händler: Bionik-Händler, Chirurgen, Magitech-Ingenieure, Prothesenwerkstätten, Schwarzmarkt; normale Städte höchstens einfache Prothesen. Teile: Roboter-Auge, -Arm, -Hand, -Bein, -Fuß, bionischer Torso, Wirbelsäule, Ohr; später Herz, Lunge, neuronaler Verstärker, Kampfarm, Sensor-Auge. Qualitätsstufen: schlecht (billig, langsam, unzuverlässig, Wartung, Ausfälle), Standard (≈ gesundes Teil, Spezialboni), hochwertig (besser, teuer, selten, Spezialmaterial, Wartungswerkzeug), Prototyp/Elite (sehr selten, einzigartig, Quest-/Fraktionsbindung). Beispiel Auge: Nachtsicht, Zielgenauigkeit, Sichtweite, Gegnererkennung, Wärmesicht; Nachteile Preis, Wartung, Energie, Störungen, Magie-Anfälligkeit. Beispiel Arm: Tragkraft, Nahkampfschaden, Werkzeug, Handwerk; Nachteile Gewicht, Wartung, Energie, billige Modelle schlechter als ein Arm.

### C.8 Bionik-Wartung
Reparaturkit, Feinmechanikerwerkzeug, Magitech-Werkzeug, Ersatzteile, Kristallenergie, Metall, Spezialöl, Diagnosegerät. Beschädigt: Leistung sinkt, Funktionen fallen aus, Warnung, Strafen, Reparatur beim Händler oder selbst. Medizin heilt Fleisch, Werkzeug repariert Maschine, Magie wirkt je nach Art teilweise oder nicht.

### C.9 Aurelion-Industrie
Rohstoffe (Erz, Metall, Kristalle, Komponenten, alte Technik) → Raffinerie, Schmelze, Kristallverarbeitung, Komponentenfabrik → Bionik, Magitech-Waffen, Automaten, Energiekerne, Luftschiffteile, Werkzeuge, Prothesen. Sichtbar: Fabriken, Förderbänder, Kristalllampen, Aquädukte, Uhr, Automatenpatrouillen, Werkstätten, Luftschiffhäfen, Bionik-Kliniken, Labore, Lager, Energieanlagen.

### C.10 Magitech-Waffen
Magitech-Gewehr, Kristallkanone, Runenarmbrust, Energie-Hellebarde, Magitech-Pistole, Schockwaffe, Zauberwaffe, Präzisionswaffe. Unterschiede über Reichweite, Energie/Munition, Durchschlag, Präzision, Gewicht, Wartung, Preis, nicht nur Stärke.

### C.11 Luftschiffe 2.0 — Priorität hoch
Typen: Handel klein, Patrouille, Passagier, Militär, schwerer Transport, Aurelion-Elite. Funktionen: reisen, Waren, Truppen, Städte verbinden, patrouillieren, Ereignisse, Absturz, Angriff. Infrastruktur: Hafen, Hangars, Reparatur, Energieversorgung, Ersatzteile, Piloten, Ingenieure, militärische Kontrolle. Schäden an Hülle, Motor, Energie, Steuerung, Waffen, Navigation, Ladekammer mit konkreten Folgen (Motor → Tempo, Steuerung → Navigation, Hülle → Wetterschaden). Wartung (Ersatzteile, Metall, Werkzeug, Magitech, Energiekerne, Ingenieur). Upgrades (Hülle, Motor, Ladekapazität, Navigation, Waffen, Panzerung, Reichweite, Effizienz, Sensoren, Wetterfestigkeit). Handel (seltene Waren, Preisschwankungen, Handelszentren, Blockaden, Wracks). Ereignisse (Absturz, Piraten, Sturm, Motorschaden, Notlandung, verschollenes Forschungsschiff, geheime Mission, Militärtransport, Flüchtlinge, wertvolle Ladung, Luftschlacht).

### C.12 Wetter mit Wirkung
Regen (Feuer schwächer, Sicht, Wege), Sturm (Luftschiffe, Fernkampf, Reisen), Schnee (Bewegung, Nahrung/Heizung), Hitze (Ausdauer, Wasser), Nebel (Sicht, Hinterhalte).

### C.13 Produktionsketten für den Spieler
Holz → Bretter → Gebäude; Erz → Metall → Waffen; Kristall → Energiekomponente → Magitech; Getreide → Mehl → Brot; Tier → Leder → Rüstung. Mit Siedlungsbau verbunden.

### C.14 Spieler-Siedlung als Städtebau
Gebäude (Wohnhäuser, Lager, Werkstatt, Schmiede, Farm, Brunnen, Taverne, Klinik, Wachhaus, Mauern, Markt, Trainingsplatz, Stall, Magiegebäude, Bionik-Werkstatt), Zonen (Wohnen, Industrie, Landwirtschaft, Militär, Markt, Verwaltung, Forschung), Zuzug nach Sicherheit, Nahrung, Wohnraum, Arbeit, Wohlstand, Ruf, Fraktionen. Reaktionen: Händler, Banditen, Steuern, Diplomatie, Spione, Angriffe, Bündnisse.

### C.15 Krankheiten
Leichtes Modell: Krankheit, Ansteckung, Inkubation, Schwere, Immunität, Behandlung. Wirkung auf Bevölkerung, Arbeit, Handel, Preise, Armeen, Reisen. Große Seuchen als regionale Ereignisse.

### C.16 Tiere und Reittiere
Pferde, Lasttiere, exotische, Kampf- und Zugtiere mit Tempo, Traglast, Ausdauer, Gesundheit, Verletzungen, Angst, Loyalität; sterblich.

### C.17 Expeditionen
Vorbereitung (Gruppe, Nahrung, Wasser, Werkzeug, Medizin, Ausrüstung, Ziel); Ergebnisse (Erfolg, Verletzungen, Beute, Informationen, Rekrutierung, Krankheit, Hinterhalt, Ruine, alte Technik).

### C.18 Gerüchte
Wahr, halbwahr, falsch; motivieren zur Erkundung ohne alles auf der Karte zu markieren.

### C.19 Weltgeheimnisse
Verlorene und unterirdische Städte, alte Maschinen, geheime Fraktionen, Kultisten, Gräber, Labore, Wracks, Bionik-Prototypen, seltene Waffen, geheime Händler, versteckte Enden. Nicht per Questmarker verraten.

### C.20 Dynastien und Häuser
Ruf, Besitz, Feinde, Verbündete, Familie, Wappen, Waffen, Schulden, Interessen → Erbschaften, Rache, Bündnisse, Bürgerkriege, Intrigen.

### C.21 Akademie und Magie
Studenten-Tagesabläufe, Druidin, Moorhexe und Omega-Priester als Lehrer, Fraktionskodex, Bücher aus Nekropole/Akademie, verbotene Magie, Gerichtsfall. Fehlende Zauberlehrer als echte NPCs: `sp_regen`, `sp_shock`, `sp_staunch`.

### C.22 Seevolk
Weitere Ränge (die unerreichbaren müssen erreichbar werden), eigene Händler, Ausrüstung, Orte, Schiffe, Konflikte, Quests, Wirtschaft.

### C.23 Aurelion-Ränge
Mittlere und hohe Ränge über Prüfungen, Missionen, technische und Kampfaufgaben; Zugang zu Bionik, Luftschiffen, Magitech, geheimen Bereichen, Elite-Händlern.

### C.24 Fall Aurelions
Einzelne Ratsmitglieder tot → lokale Folgen. Ganzer Rat tot → Weltzustandswechsel: Machtvakuum, Bürgerkrieg, neue Fraktion, besetzte Fabriken, Automaten reagieren, Luftschiffe militärisch, Bionikversorgung bricht ein, Schwarzmarkt, Nachbarn greifen ein.

### C.25 König Varon / Nordreich
Schloss, Hof, Adel, Wachen, politische NPCs, Diplomatie, Quests, Militär, Dynastien.

### C.26 Zwerge und Tiefhall
Zwergenfraktion, Bergstädte, Minen, Schmieden, alte Technik, Waffen, Rüstungen, Handel, Konflikte; Tiefhall als wichtiger Ort.

### C.27 Flüchtlinge
Echte Aufenthaltsorte (Lager, Städte, Spielersiedlung, Karawanen), Familien, Herkunft, Beruf, Probleme; Spieler beeinflusst Ziel, Aufnahme, Arbeit, Integration.

### C.28 Begleiter 2.0
Rekrutierung, Befehle, Moral, Ausrüstung mit Klassenprüfung, Klassen, Fähigkeiten, Beziehungen, Verletzungen, Tod, Tier als viertes Mitglied.

### C.29 Systemverbindungen
Bionik+Verletzung, Bionik+Wirtschaft, Bionik+Aurelion-Ruf, Bionik+Medizin, Luftschiff+Wirtschaft/Krieg/Wetter/Geheimnisse, Aurelion+Krieg.

### C.30 UI/UX
Bionik-Fenster (Teil, Zustand, Qualität, Boni, Nachteile, Wartung, Werkzeuge, Materialien), Luftschiff-Fenster (Hülle, Motor, Energie, Tempo, Ladung, Waffen, Upgrades, Wartung), Stadt-Fenster (Bevölkerung, Nahrung, Sicherheit, Wohlstand, Kriminalität, Fraktion, Wachstum, Probleme). Vorhandene UI erweitern statt neue Menüs.

### C.31 Save-System
Alles savebar, alte Stände laden sicher, Defaults für neue Felder, Versionierung, keine Korruption, neue Felder zentral definiert, keine aufgeblähten Strukturen.

### C.32 Performance
Nah: volle Simulation. Mittel: abstrahiert (Arbeit, Reisen, Kämpfe als Werte). Fern: Tick-basiert (Stadtwerte, Bevölkerung, Handel, Krieg, Ressourcen).

### C.33 Architektur
Modular (z. B. `src/systems/bionics.js`, `airships.js`, `citySimulation.js`, `factionWar.js`, `bandits.js`, `diseases.js`, `production.js`, `expeditions.js`, `rumors.js`, `dynasties.js`, `companions.js`), aber der bestehenden Struktur folgen. Vorher: Systeme suchen, Funktionen wiederverwenden, doppelte Logik vermeiden, State/Save beachten.

### C.34 Debug
Je größerem System mindestens ein Debug-Zugang (Bionik-Händler spawnen, Roboterauge/-arm geben, Bionik beschädigen/reparieren, Luftschiff spawnen/beschädigen/reparieren/aufrüsten/abstürzen, Aurelion-Krise/-Kollaps, Stadtbevölkerung, Seuche, Fraktionskrieg, Bandenlager, Flüchtlinge). Debug darf den normalen Spielablauf nicht voraussetzen.

### C.35 Balancing
Bionik: schlecht < normal ≈ Standard < hochwertig; Elite sehr selten. Magitech durch Energie, Munition, Wartung, Gewicht, Preis, Verfügbarkeit ausgeglichen. Starke Luftschiffe teuer, wartungsintensiv, auffällig, selten.

### C.36 Reihenfolge
Phase A Grundlagen (Architektur, Save-State, Item-/Materialdefinitionen, Wartungssystem, Qualitätsstufen). Phase B Bionik (Datenmodell, Auge, Arm, weitere, Händler, Chirurg, Werkzeuge, Reparatur, UI, Aurelion). Phase C Aurelion (Fabrik, Ketten, Magitech, Bionik, Händler, Ränge, Prüfungen, Elite). Phase D Luftschiffe (Datenmodell, Entity, Zustände, Schäden, Reparatur, Upgrades, Hafen, Handel, Ereignisse, Wetter). Phase E Weltsimulation (Routinen, Stadtwerte, Krieg, Banden, Krankheiten, Handel, Flüchtlinge, Gerüchte). Phase F Langzeit (Siedlungsbau, Dynastien, Nordreich, Zwerge, Seevolk, Aurelion-Fall, Geheimnisse, Expeditionen).

### C.37 Priorität
P0: Save-Kompatibilität, Bionik-Grundsystem, Bionik-Händler, Roboterauge, Roboterarm, Reparatur/Wartung, Aurelion-Integration, Luftschiff-Grundüberarbeitung. P1: Luftschiff-Upgrades, -Schäden, -Hafen, Magitech-Produktion, Aurelion-Händler, NPC-Routinen, Stadt-Simulation, Fraktionskrieg. P2: Banden, Krankheiten, Produktionsketten, Siedlungsbau, Flüchtlinge, Begleiter, Expeditionen. P3: Dynastien, Zwerge, Nordreich, Seevolk, Geheimnisse, Gerüchte, seltene Bionik.

### C.38–C.40 Teststrategie
Nach der Implementierung testen eigene Agenten, nicht nur der Hauptagent. Opus (max. 3–4): Architektur & Integration; Gameplay/Simulation; Regression/Savegames; optional finale QA. Sonnet parallel: A Bionik, B Luftschiffe, C Aurelion, D Städte/Fraktionen, E UI, F Performance.

### C.41 End-to-End-Tests
1 Bionik (Arm verlieren → Händler → Roboterarm → Werte → Schaden → Werkzeug fehlt → beschaffen → Reparatur → speichern/laden). 2 Roboterauge. 3 Luftschiff (kaufen, laden, Upgrade, Motorschaden, Tempo, Reparatur, Sturm, Hafen, speichern/laden). 4 Aurelion (Stadt, Händler, Bionik, Magitech, Fabrik, Rang, Prüfung, Elite-Händler, speichern/laden). 5 Weltkrieg (Angriff, Fall, Garnison, Händler, Bevölkerung, Unruhe, Rebellen, erneuter Fall). 6 Seuche (Start, Ansteckung, Ausbreitung, Stadtwerte, Medizin, Handel, Ende, gespeichert).

### C.42 Definition of Done
Siehe A.3.

### C.43 Arbeitsweise
Repository analysieren → Systeme identifizieren → Abhängigkeiten prüfen → Plan → kleine Pakete → nach jedem Paket testen → Save-State prüfen → Sonnet-Reviews → max. 3–4 Opus-Reviews → Fehler beheben → nächstes Paket → am Ende End-to-End. Existiert eine Funktion: erweitern statt duplizieren. Teilweise funktionierend: erst reparieren, dann aufbauen.

### C.44 Ziel
Eine verbundene, glaubwürdige Welt, die auch ohne den Spieler funktioniert: Städte wachsen oder zerfallen, Fraktionen kämpfen, Händler reisen, Luftschiffe transportieren, Aurelion produziert, Menschen suchen Bionik, Bionik braucht Reparatur, Fabriken brauchen Rohstoffe, Kriege erzeugen Flüchtlinge, Krankheiten wirken, Banditen nutzen Schwäche, Gerüchte verbreiten sich, Dynastien verändern Politik. Der Spieler beobachtet, nutzt oder verändert das.
