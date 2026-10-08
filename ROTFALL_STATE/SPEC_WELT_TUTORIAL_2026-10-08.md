# ROTFALL: LEGACY — World, Tutorial, NPC & Content Overhaul (Entwickler, 08.10.2026 — verbindlich)

Kurzliste des Entwicklers (wörtlich sinngemäß):
- Ein richtiges Tutorial, das den Spieler einmal an die Hand nimmt.
- Mehr Haus-Variation: in Schmieden richtige Öfen sehen, Waffen/Rüstung kaufen; Prinzip auf andere Gebäude übertragen.
- Quests werden langweilig → immer gleiche Gegner.
- Mehr Gegner-Variation: anderes Aussehen, mehr Sprites, mehr Banditen-Arten, auch Goblins.
- Häuser richtig orientiert (Tür zur Zugangsrichtung); Haus leicht durchsichtig, wenn man seitlich/dahinter steht.
- Niemanden durch Wände treffen können.
- Das Missionsfenster soll ein GUI haben.
- Im eigenen Betrieb selbst arbeiten; sehen, wie Leute in Betrieben arbeiten und wie Kunden hineingehen und kaufen.

## 1 Grundidee
Die Welt existiert nicht nur für den Spieler: Menschen leben, Familien wohnen zusammen, Geschäfte werden betrieben, Arbeiter arbeiten, Kunden betreten Läden, Märkte sind soziale Treffpunkte, nicht jeder NPC hat eine Quest, kein Gebäude ist nur Kulisse, Städte sind sinnvoll geplant, NPC-Dichte passt zur Gebäudegröße, Gegner und Quests sind abwechslungsreich, der Spieler kann zuerst beobachten. Nicht überladen — **Qualität und Glaubwürdigkeit vor Quantität.**

## 2 Erst Repository analysieren (Pflicht)
Struktur, CLAUDE.md, docs/IST_ZUSTAND.md, alle Roadmap-/Plan-/Feature-Dokumente; prüfen was umgesetzt, teilweise, veraltet, doppelt, offen ist; bestehende Systeme wiederverwenden. **Keine zweite parallele Implementierung.**

## 3–5 Dokumentationsbereinigung
Alle Docs (docs/, ROADMAP*, PLAN*, TODO*, FEATURE*, DESIGN*, Notizen, Audits, Agenten-Dokumente) nach Inhalt prüfen und kategorisieren:
A relevant · B teilweise umgesetzt · C vollständig umgesetzt · D veraltet · E Duplikat · F temporär.
Danach **ein zentrales Dokument** für alle noch offenen Punkte (Features, Teilfeatures, Verbesserungen, Designentscheidungen, Abhängigkeiten, UI/UX, Content, NPC, Simulation, Quests, Gegner, Gebäude, Tutorial, Performance, Save, Tests) — aktueller tatsächlicher Stand, nicht zusammenkopiert.

## 6–9 Tutorial
Kurze spielbare Einführung statt Popups: Welt, Bewegung, Interaktion, Kampf, Loot, NPCs, Händler, Quests, Gebäude, Motivation — erlebt, nicht gelesen.
**Einflug nach ROTFALL:** kurze Szene aus der Distanz auf die Region (Landschaft, Straßen, Stadt/Landmarken, Reisende, Karawanen, Siedlung) → „Ich betrete eine existierende Welt.“
**Ziele:** keine „Gehe zu A“, sondern Denkansätze (Stadt in der Ferne, Schmiede, Straße mit Reisenden, gefährliches Gebiet, Markt, Taverne, Ruine, Fraktion, Händler, Ereignis) → „Was interessiert mich?“ ROTFALL gibt Möglichkeiten, keine Questliste.
**Keine Informationswand:** kontextbezogen (Schmiede betreten → Schmied arbeitet → beobachten → sprechen → Händler-UI → nur das Nötige erklären). Gleiches bei Kampf, Loot, Quest, Markt, Reisen, Gebäuden, NPCs, Betrieben.

## 10–12 Quest-System
Weniger „gehe → töte → zurück“. Zieltypen: Kampf (töten, vertreiben, verfolgen, Anführer, Lager zerstören, Gefangene befreien) · Erkundung (Ort finden, Ruine, Geheimnis, Gegenstand, NPC suchen) · Transport (Waren, Nachricht, Verletzte eskortieren, Karawane) · Soziales (überzeugen, Streit lösen, Informationen, Handel vermitteln, Schuld eintreiben) · Wirtschaft (Material, Betrieb unterstützen, Lieferung sichern, Produktionsproblem, Händler schützen) · Weltgeschehen (Angriff abwehren, Flüchtlinge, Stadt bei Ereignis, Überfall verhindern, Fraktionsereignis) · Geheimnisse (Gerücht, versteckter Eingang, alte Maschine, geheimer Händler, verlorener Ort).
Quests derselben Region nicht immer dieselben Gegner: Straßenräuber, Späher, Bogenschützen, Plünderer, Söldner, Anführer, schwer gepanzert, Fallensteller, Reiter, Heiler, Spezialisten — **Aussehen, Verhalten, Ausrüstung, Rolle unterscheiden sich**, nicht nur Werte.

## 13–16 Gegner-Overhaul
Banditen-Varianten (Späher, Bogenschütze, Plünderer, Schläger, Söldner, Anführer, Fallensteller, Reiter, schwerer Bandit, Dolchkämpfer) und Goblin-Varianten (Krieger, Speerträger, Bogenschütze, Schamane, Plünderer, Berserker, Späher, Anführer, Techniker, Fallensteller, Sklave, Arbeiter) mit eigenem Sprite/Ausrüstung/Körperform/Helm/Kleidung/Waffe/Verhalten/Animation/Rolle. Eine Variante ist erst neu, wenn mindestens eines sichtbar anders ist (Sprite, Kleidung, Rüstung, Waffe, Silhouette, Animation, Verhalten). Elites/Bosse dürfen VFX und Sonderanimationen haben.
Gegner-Scaling als Ganzes prüfen (früh/mittel/spät, Dungeons, Bosse, Begegnungen, Questgegner, Elites, Tiere, Soldaten; HP, Schaden, Rüstung, Tempo, Angriffsrate, Fähigkeiten, Anzahl, Level-Scaling, Loot, XP, Belohnungen). Gefahr ohne reine Zahleninflation.

## 17–20 Städte, Dichte, Performance
Keine 100 NPCs auf einem Punkt. Marktplätze skalieren: größerer Platz, mehrere Plätze (Hauptmarkt, Handwerk, Lebensmittel, Händler, Hafen, Nachbarschaft), zeitliche Verteilung (morgens Arbeiter/Händler/Bauern, mittags Kunden/Reisende/Handwerker, abends Tavernen). Bewegungsströme Haus→Arbeit→Markt→Haus/Taverne/Kirche/Werkstatt; Reisende→Gasthaus; Wachen→Straßen.
Simulation nach Nähe: Nahbereich voll (Bewegung, Animation, Interaktion, Arbeit, Gespräche, Käufe, Türen, Kämpfe) · Mittelbereich vereinfacht (Position, Arbeit, Ziel, Zustände) · Fernbereich abstrakt (Arbeitsplatz, Zuhause, Reise, Konsum, Tagesablauf, Stadtwerte); Rekonstruktion bei Annäherung.

## 21–25 Wohnraum und Familien
Haus erklärt, warum die Bewohner dort wohnen (nicht drei NPCs in einem Haus mit einem Bett). Wohnkapazität: klein 1–2 (1 Schlafzimmer), mittel 2–4 (mehrere Schlafplätze, Küche, Wohnbereich), groß 4–8 (mehrere Zimmer, ggf. Arbeitsbereich), Familienhaus (Eltern, Kinder, ggf. Großeltern, Familienbereich). Echte Familien (verbundene NPCs, nicht nur Nachname), sichtbar: gemeinsam im Haus, essen, Kinder folgen Eltern, arbeiten, Markt, schlafen, auf Gefahr reagieren, miteinander sprechen. Häuser spiegeln Familien (Betten, Kinderbett, Tisch, Räume, Küche, Gegenstände, Spielzeug, Werkzeuge). Kette: NPC-Daten → Familie → Wohnraum → Gebäude → Tagesablauf.

## 26–32 Gebäude und Betriebe
Gebäude zeigen, was darin passiert. **Schmiede:** Ofen, Feuer, Amboss, Werkbank, Werkzeuge, Waffen, Rüstungen, Rohmaterial, Metall, Lager, Schmied arbeitet (Hammer, Feuer, Funken, Rauch, Bewegung). Als Betrieb: kaufen, reparieren, beobachten, Kunden kommen und kaufen, Mitarbeiter arbeiten. Prinzip auf Bäckerei, Taverne, Schneiderei, Apotheke, Werkstatt, Stall, Händler, Bionik-Werkstatt übertragen.
Betriebe als soziale Räume: Kunde betritt → Verkaufsbereich → Mitarbeiter reagiert → kauft → Ware weg → verlässt → Mitarbeiter arbeitet weiter (vereinfacht, sichtbarer Eindruck zählt).
**Spieler arbeitet selbst im eigenen Betrieb** (Schmiede, Werkstatt, Taverne, Händler, Farm, Bäckerei, Alchemie, Bionik): arbeiten, produzieren, Kunden bedienen, Aufträge, Mitarbeiter beobachten, Produktion kontrollieren. Spielerbetrieb lebt sichtbar (Mitarbeiter holt Metall, einer am Ofen, Kunde kommt, schaut, kauft; Spieler produziert).

## 33–35 Gebäude-Orientierung und Transparenz
Tür passt zur Zugangsrichtung; jedes betretbare Gebäude: Eingang, Richtung, Innen-/Außenposition, Zugangspunkt, Exit. NPCs nutzen den echten Eingang. Steht der Spieler seitlich/hinter einem Gebäude → 40–60 % transparent, positionsabhängig, nicht dauerhaft.

## 36–37 Kein Treffer durch Wände
Nahkampf, Projektile, Fähigkeiten, Magie, Fernkampf, AOE, NPC-Angriffe. Zentrale Hindernis-/Sichtlinienprüfung (Angreifer → Richtung → Hindernis → erreichbar? → Hit), keine Einzellösungen je Waffe.

## 38–39 Quest-GUI
Richtiges Fenster: Name, Geber, Beschreibung, aktuelles Ziel, Fortschritt, Belohnung, Ort, Status, optionale und erledigte Ziele (Häkchen-Liste). Bestehende UI-Architektur. Nicht alles verraten — nur, was die Figur wissen kann.

## 40–47 NPC-Verteilung, Questdichte, soziale Räume, Stadtplanung
Nicht jeder NPC eine Quest (Beispiel 20 NPCs: 3 Questgeber, 5 Händler/Mitarbeiter, 4 Familie, 3 Wachen, 2 Reisende, 2 Bürger, 1 Story-NPC; dynamisch je Stadt). Normale Menschen arbeiten, kaufen, essen, schlafen, reden, Kinder, Taverne, Wache. Questgeber nicht nur per Symbol: Dialog, Gerücht, beobachtbares Verhalten, Gespräch zwischen NPCs („Die Karawane ist immer noch nicht zurück.“). Stadt: 3–5 relevante Questgeber + viele normale NPCs + Gerüchte + Betriebe + Händler + Familien + Aktivitäten. Welt ohne Quest interessant (Schmied arbeitet, Kind läuft zur Mutter, Laden öffnet, Wache wechselt, Karawane kommt, Kunde kauft, Arbeiter trägt, Familie isst, Reisender sucht Gasthaus, Betrunkener streitet, Bandit kontrolliert). Treffpunkte: Markt, Taverne, Brunnen, Tempel, Schmiede, Hafen, Tor, Handwerksviertel, Wohnviertel, Handelsstraße, Nachbarschaftsplatz, Trainingsplatz. Stadtplanung funktional prüfen (Größe/NPC, Straßenbreite, Platzgröße, Türen, Laufwege, Viertel, Dichte).

## 48–49 Skalierung und Performance
Welt (NPCs, Gegner, Gebäude, Animationen, Partikel), Stadt (je Viertel/Platz, aktive NPCs, Wegfindung), Kampf (Gegner, Projektile, AOE, Partikel, Hit Detection), UI (Listen, Inventare, Shops). Erst Culling, LOD, vereinfachte Simulation, Tick-Raten, Pathfinding, Events, Animationen, Partikel, Rendering, Kollision — nicht NPCs entfernen.

## 50 Priorität
P0 Spielerlebnis: 1 Tutorial neu · 2 Einflug/Intro · 3 erste Wege/Ziele · 4 Quest-GUI · 5 Wand-Hit · 6 Gebäude-Eingänge.
P1 Weltqualität: 7 NPCs ohne Quest · 8 Rollen · 9 Haus/NPC · 10 Familien · 11 Wohnraum · 12 Marktplätze · 13 Dichte.
P2 Betriebe: 14 Schmieden · 15 Öfen/Ambosse/Waren sichtbar · 16 Kunden · 17 Mitarbeiter · 18 weitere Betriebe · 19 Spieler arbeitet.
P3 Content: 20 Gegner-Variationen · 21 Banditen · 22 Goblins · 23 Sprites · 24 Animationen · 25 Quest-Variationen · 26 Wiederholung reduzieren.
P4 Technik: 27 Scaling-Audit · 28 NPC-Simulation · 29 Marktplatz-Performance · 30 Hit Detection · 31 Save/Load · 32 Regression.

## 51 Testfälle
Tutorial (Start, Intro, Einflug, Orientierung, abschließbar, kein Softlock, Speichern/Laden, nicht mehrfach) · NPCs (ohne Quest, arbeitet, schläft, besucht Betrieb, kauft, findet Haus/Arbeit) · Familien (gespeichert, wohnen zusammen, Schlafplätze, Darstellung, Tod ohne kaputte Referenzen) · Gebäude (Eingang = Sprite, NPC nutzt Tür, betretbar, transparent, keine Wanddurchquerung) · Kampf (Nah-/Fernkampf/Magie/AOE/NPC nicht durch Wände) · Betriebe (Mitarbeiter, Kunden, Waren, Spieler arbeitet, Save/Load) · Städte (keine 100 auf einem Punkt, begehbar, verteilt, Performance) · Quests (GUI, Fortschritt, Belohnung, Typen, weniger Wiederholung).

## 52–53 Definition of Done / keine Oberflächlichkeit
Fertig = Repo-Stand analysiert, wiederverwendet, keine Dublette, UI falls relevant, Save/Load, Edge Cases, Performance, Regression, unabhängiger Testlauf, Debug, kein undefined/NaN. Falsch: nur ein Amboss-Sprite, nur Nachnamen, nur höhere Werte, nur ein Fenster mit zehn Texten.

## 54–55 Gesamtziel und Ablauf
„Was passiert hier eigentlich?“ statt „Wer hat eine Quest?“ — Welt → Situation → Interesse → Quest. Ablauf: Analyse → Docs → Ist-Stand → zentrale Roadmap → alte Docs weg → Abhängigkeiten → kleine Pakete → testen → Regression. Reihenfolge: Tutorial → Quest/UI → NPC/Gebäude → Stadt/Familie → Betriebe → Gegner/Quest-Content → Scaling → QA. Art-Direction bleibt, keine Neuentwicklung, nichts Funktionierendes entfernen.
