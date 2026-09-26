# Session-Log — Rotfall: Legacy

Neueste oben.

### Session 11 — 2026-09-26 · Bug-Runde (Nutzer: „zuerst die Bugs“, dann Phasen)
**Gemacht:** Master-Prompt vollständig nach `docs/MASTER_PROMPT.md`; Speicher: `master-prompt`, `always-skills` (ponytail +
caveman für Chat + awesome-skills). Bugs behoben mit Regressionstest: 076 Anti-Kiting (Hieb/Rückwärts bremst, Gegner setzen
nach), 078 Gerüchte, 081 Gefahrenwarnung/Blutungshinweis, 085 Karte (Umgebung ×3, Legende, Auftragsziele, kollisionsfreie
Namen), 087 Namen je Stadt eindeutig, 088 Verfolger ohne Weg geben auf, 089 Laden ≠ Tageswechsel (doppelter Verbrauch!),
092 Schenke Schachbrett, 093 Figurenbilder ×24 schneller (CPU-Pipeline + Vorbacken), 094 Fest nicht auf Straße/vor Türen,
096 Karawanenwachen holen auf, 098 Gerüchte als Sätze; Test-Isolation 095/097. Selbsttest 96/96, mehrfach grün.
**Gefundene neue Probleme:** Selbsttests auf der echten Welt flackerten (Zufallskämpfe) — abgeschirmt. Zeichnen im vollen
Stadtkern 2,2–2,3 ms Median (Budget 2,0); Update 1,4–2,3 ms.
**Offen:** BUG-093 Rest (Median), BUG-062 (Wagen wendet sprunghaft), BUG-051 Totenreich-Inhalt (Phase 16), Tagesablauf
Stufe 2 (Jäger, Läden auf/zu, Wachschichten), NPC-Beziehungen §79, Skelett-Stadt §81, Gegner-Ausdauer §28.
**Danach (gleiche Session, Master-Plan):** Sofort-Prioritäten 1–5 abgearbeitet. (1) Dichte: Reality-Check mit Screenshots —
kein Wand-an-Wand mehr; Raster-Anordnung offen (Nutzerentscheid). (2) Tagesrhythmus Stufe 2: Jäger, Markt auf/zu, Wachschichten.
(5) §81 Befreiungskampf mit Wellen, Anmarsch, Hauptmann der Toten, Heimkehr; §74 Anmarsch bei Schlachten; BUG-099 Bewohner
verstecken sich unter Besatzung. Neu offen: BUG-100 Schwarze Feste (eigene Arena). Selbsttest 102/102 (dreimal).
Perf: Update 2,7 ms / Zeichnen 2,1 ms (Eren 10 Uhr) — knapp.
**Danach (Nutzer: „Mach weiter mit den Phasen“):** §79 Beziehungen (Freund/Rivale, Ausweichen, Lästern — live beobachtet),
§28 Gegner-Ausdauer (Öffnungen im Dauerkampf). Selbsttest 104/104 (dreimal).
**Danach (Nutzer: „Phasen content-mäßig weiter“):** Phase 20 Licht; Phase 11 Rufe + Datenblätter; Phase 12/§73 Graumähne und
Karrak (Tabelle REGION_BOSSES); §82 Balancing mit Messwerkzeug RF.duel (Standfestigkeit, Ausfallschritt, Nachsetzen-Mindesttempo,
BAL-Grundwerte, Boss-Phase 3 + Antwort auf Abstand, Speerträger, Streitflegel); §71 Veteranen in Gefahr 3/4; §80 Questtafel.
Test-Stabilität: Krieg ruht während Proben. Selbsttest 112/112.
**Nutzerwunsch vorgemerkt:** Schwierigkeitsstufen Sehr schwer / Schwer (Standard) / Angsthase — nach den übrigen Phasen (Hebel: BAL).
**Danach:** §74 Raids (Späher-Vorwarnung, Kriegsschäden + Wiederaufbau), §45 vier neue Aufträge (Graumähne, Karrak, Felle,
Hundertfeld). Selbsttest 114/114. Neu offen: BUG-101 Aschfurt ohne Auftrag.
**Danach:** Phase 17: Kopfgeld, Festnahme, Kerker, Kopfgeldjäger (skalierend, gedeckelt); §43 Ruf-Stufen mit Preisen,
Begrüßung, Verhasst-Folgen. Selbsttest 116/116.
**Danach (Nutzer: Endgame-Plot, größere Welt, ≥5 Fraktionen, mehr Waffen/Rüstung):** Eisenmark im Osten (Welt 1024×768),
Eiserne Kette + Grubenstämme (7 Fraktionen), Kettenfeste/Steinbruch/Grubenhort, Kettenzug, Varg als Endboss, Befreiung macht
Goblins friedlich (Dorf, Händler), 2 Waffen, 7 Rüstungen, 2 Gegner. Selbsttest 117/117.
**Session 12 (Arsenal):** Aus der Nutzervorlage die passenden Waffen und Rüstungen übernommen: 16 Waffen, 14 Rüstungsteile, Rotgardist,
Kettenschütze, `ARMOR_LOOK`, keine Klon-Wachen. Übergabe-Dokument `HANDOFF_WELT_FRAKTIONEN_AUSRUESTUNG.md` erstellt. Selbsttest 118/118.
Offen aus der Vorlage: lebende Kettenfeste, Tribut, Feldzüge gegen die Untoten.
**Nächster Schritt:** Schwierigkeitsstufen Sehr schwer / Schwer / Angsthase (Nutzerwunsch, Hebel `BAL`); danach Phase 18 Audio
(Gebäude-Klänge), Phase 19 UI. Nutzerentscheid offen: organische Stadtanordnung (§75), Schwarze Feste (BUG-100).

### Session 10 — 2026-09-25 · Stil-Wahl D + Gebäudevorschläge
**Gemacht:** 5 Stilvarianten gezeigt, Nutzer wählt D (gröbere Pixel, „Pixel-Look bleibt“). Umgesetzt für Figuren, Tiere,
Gorak, Waffen, Waffenarm (`COARSE = 1.5`). 82/82. Gebäude-Vorschläge V1–V4 mit eigenem Boden gebaut und gezeigt.
**Danach (gleiche Session):** Referenz 2 umgesetzt (Gesichter, Proportionen, dunkle Kleidung, Bürger-Stände), BUG-090,
Gebäude heller→dunkler und Tür ≈ Figur, Props im 1,5er-Raster. 82/82, Zeichnen ≤ 1,9 ms.
**Danach:** Boden ruhiger; Bugfixes 077, 079, 080, 084, 086, 090, 091; Stadtleben Stufe 1 (082/083) mit
Vorher/Nachher-Messung und Screenshot-Reality-Check. 86/86. Skills geladen: ponytail, game-development, game-design,
2d-games, systematic-debugging, test-driven-development, architecture, clean-code, javascript-mastery,
performance-optimization, verification-before-completion, browser-testing-with-devtools, algorithmic-art, game-audio,
frontend-design, web-design-guidelines (agent-memory ohne eigenen Server nur über docs/ + Memory).
**Weiter (26.09.):** Roter Test behoben — Ursache: `planDays()` lief beim Laden vor `indexSolids` (Möbel unbekannt → Nachtplatz
auf dem Tisch); jetzt nach dem Objekt-Index. Große Schenke: Zusatztische hinten (`house()`, world.js), Sitzplätze über den Raum
verteilt. Sprechblasen: überlappende weichen aus, höchstens 4 (nächste zum Spieler). **Stadtfeste** (game.js `festTick`,
`FEST_SET`, `festMeal`): alle 6 Tage je Stadt 15–23 Uhr, transient (nie gespeichert), Bewohner im Kreis ums Feuer, Festgespräche,
Vortag-Ankündigung in `dayTick`, Festmahl an der Festtafel einmal je Fest; Aufbauten nie auf Straße/Acker (Karawanen-Test
war rot, weil Feuer/Stand auf der Alten Straße standen). **BUG-078 Gerüchte:** `recentNews()` aus `S.chronicle` (battle/death/
crime/news, ≤ 5 Tage), in `gossip()` und in Bewohner-Gesprächen (`newsTalk`); sim.js schreibt Karawanen-Ereignisse als `news`.
Neue Tests: Stadtfest, Gerüchte (jetzt 88). Letzter vollständiger Lauf vor dem Straßen-Fix: 1 rot (Karawane) — nach dem Fix
NOCH NICHT bestätigt (Lauf wurde unterbrochen). Hinweis Browser: versteckter Tab → Zeichenfläche 2×2; für Screenshots
`gc.parentElement.style.width/height` setzen + `RF.R.initCanvas(gc)`. Dev-Server 8770 und Screenshot-Sink 8771 neu gestartet.
**Nächster Schritt (danach):** §41 Stufe 2 (Jäger, Ladenöffnung sichtbar, Wachen-Schichten), BUG-078 Gerüchte aus Weltereignissen
in die Gespräche, BUG-076 Anti-Kiting, BUG-092 Schenke entzerren; danach §81 Skelett-Stadt.
**Offen / nächster Schritt (alt):** Nutzer wählt Gebäude-Richtung → G6 in `buildings.js` (Türhöhe ≈ Figur, dunklere Werte,
Traufschatten, Sockel, Moos/Schmutz); dann G7 Boden, G8 UI; danach Audit-Bugs BUG-076–089 und Phasen (Prio 2–5).

### Session 9 — 2026-09-25 · „World Alive“-Prompt: Audit + Grafik-Revision v2 (Nutzer: Grafik ist Prio 1, Variante A)
**Gemacht:** BUG-073 verifiziert (82/82). Durchlauf-Agent: Audit in `AUDIT_PLAYTHROUGH_S9.md`, Befunde als BUG-076–089.
Referenzbild erhalten (grimdarke Kapuzenfiguren) → Grundlage `src/figure.js` (Spieler, Bandit, Elite, Boss; vom Nutzer
freigegeben, Proportionen korrigiert). G1: allgemeiner Figuren-Zeichner aus dem Spec-System (Skelett, 13 Posen, S/N/W).
G2: eingebaut — Frames tragen Maßstab/Pivot, `SP.blit()` an allen 7 Zeichenstellen; 82/82, Zeichnen 1,25 ms.
Danach G3 (Waffen neu + Arm führt die Waffe), G4 (Goblins, 5 Tiere, Gorak als Goblin-Hüne), G5 begonnen (Props im feinen
Raster). Stand vor dem Push des Nutzers: 82/82, Zeichnen ≤ 2,0 ms in Eren/Nordfurt/Salzhafen.
**Offen / nächster Schritt:** G5 Props einzeln prüfen, G6 Gebäude, G7 Boden/Fels/Wasser, G8 UI/Titel/Effekte; Hrodvar eigene
Bossgestalt. Danach Audit-Befunde BUG-076–089 (Prio 2–5).

### Session 8 — 2026-09-25 · Phase 11 Gegner-Erweiterung („weiter mit dem Masterplan“)
**Vorgefunden:** Selbsttest 76/76; Session 7 fehlte im Log (nachgetragen). Phase 11 im Code großteils fertig, im Status nicht.
**Gemacht:** Wilder Hund eigene Gestalt + Cache-Fehler (BUG-072), alle Gegner im Stil-Testbereich, 6 Verhaltenstests
für die neuen Gegner, Kultist-dt (BUG-074), Sandbox-Isolation für Geschosse (BUG-073).
**Stand der Tests:** zuletzt 81/82 (einziger Fehler: Feuerball-Test, Ursache gefunden = Geschoss-Leck aus meinem
Kultist-Test). Fix eingebaut, **Nachlauf wurde unterbrochen → erst verifizieren** (erwartet 82/82).
**Offen / nächster Schritt:**
1. `RF.selftest()` laufen lassen → 82/82 bestätigen; sonst BUG-073 weiter untersuchen (auch Karawanen-Test, war 1× rot).
2. Phase 11 abschließen: GDD-Kurzblätter um die 9 neueren Gegner ergänzen (Stärke, Schwäche, Beute, Region, interiors,
   statisch/skalierend §72 — SCALING ist leer, Kopfgeldjäger kommt in Phase 17), Geräusche je Gegnerart (§33, fehlen:
   alle nutzen 'hit'/'death'), Geist optisch geisterhafter (schwebend statt Rüstung mit Beinen). Dann PHASE_STATUS 11.
3. Danach Phase 12 (Bosse der Oberwelt, §73 regionale Bosse mit Weltfolgen).

### Session 7 — 2026-09-25 · Phasen 6–10 abgeschlossen (nachgetragen in Session 8 aus CHANGELOG/PHASE_STATUS)
**Gemacht:** Deckung/Parade, Rollen-Landung, Sitzen/Handeln-Posen (Phase 6); 5 neue Waffenklassen (Phase 7);
Rarität je Exemplar mit Affixen, Legenden, Unikaten (Phase 8); aktive Knoten und Umlernen im Skill-Baum (Phase 9);
4 neue Grundklassen, jede lernbar mit Schwäche (Phase 10). BUG-066–071. Selbsttest 76/76.
**Offen geblieben:** Nutzerprüfung Kampfgefühl/Klänge/Balance; Kopfgeldjäger → Phase 17.
**Hinweis:** Session 7 hatte keinen Eintrag im SESSION_LOG (Session-Ende-Routine unvollständig).

### Session 6 — 2026-09-25 · Spielstand, Karawane, Tiefhall („weiter“)
**Vorgefunden:** Selbsttest 60/60; offen laut Plan: BUG-017/057 Spielstand 1,4 MB, BUG-011 Karawane, BUG-009 Tiefhall.
**Gemacht:** Diff-Speichern der Props (1,43 → 0,53 MB, alte v2/v3-Stände getestet); Karawane als Zug mit Gespann,
Kutscher, Beiwagen und zwei Wachen, Route aus der Straße; Tiefhall als zweiter Dungeon mit Boss Hrodvar und
Dungeon-Register. Nebenbei: BUG-058 (Props nach Laden verändert), BUG-059 (Leichen-Radius), BUG-060 (Säulen).
Danach (Nutzer: „mach auf jeden Fall mit neuem Content weiter“): Quest Königseisen (Brann, Nordfurt) mit Hrodvars
Eiskreis und Leibwache; vierte Titelklasse **Mönch** (Fokus aus Ausweichen im letzten Moment, Ilva in Sonnwacht).
Zuletzt die Grenzöde (Grenzwacht, Hundertfeld, Straße, Quest bei Oda).
Selbsttest 69/69 auf drei Seeds, alte Stände (v2, v3 voll, v3 Diff) laden fehlerfrei.
**Gefundene neue Probleme:** BUG-058–065 (062 Beiwagen-Sprung und 063 Balance offen).
**Offen geblieben:** Bewohner machen 430 KB des Spielstands aus; Umlernen im Skill-Baum; Kopfgeldjäger/Barde/Alchemist
nur Entwurf; Mönch und Hrodvar sind ungespielt — Werte (Fokuszahlen, Eiskreis-Schaden) brauchen einen echten Durchlauf.
**Nächster Schritt:** Nutzer spielt Mönch-Probe und Tiefhall an. Danach: angefangene Phasen schließen (6, 9, 13).
Beim Start: `index.html?dev&test` → `RF.selftest()` muss 69/69 melden.

### Session 5 — 2026-09-25 · Größere Welt, Skill-Baum, Druide, Totenreich (Nutzerwunsch)
**Vorgefunden:** Selbsttest 54/54; offen: Karte nicht vergrößert, Diener folgen nicht, kein Skill-Baum, Totenreich dünn.
**Gemacht:** Welt 768×768 (Hochrechnung aus dem Entwurf, Spielstand v3 mit Umrechnung), Städte +15 % gestreckt mit
Randhäusern; Diener folgen durch Eingänge; Skill-Baum (3 allgemeine Zweige + 3 Titelzweige, 6+3 Schlüsselknoten);
Druide als dritte Titelklasse, höchstens 2 je Figur; Totenreich mit Vharnholm, Knochenwald, Aschensee, Quest. 60/60.
**Gefundene neue Probleme:** BUG-052–057 (057 Spielstandgröße offen), BUG-055 war ein echter Blocker der Pakt-Quest.
**Offen geblieben:** Spielstand 1,4 MB (nur geänderte Props speichern → Phase 20); kein Umlernen im Skill-Baum; Ostküste
und Grenzöde des Totenreichs noch dünn; Kopfgeldjäger/Barde/Mönch/Alchemist nur Entwurf; Headless-Zeichenzeit ist kein
verlässlicher Wert — im echten Browser gegenmessen.
**Nächster Schritt:** Nutzer spielt die neue Karte an (Wege sind länger — zu lang?). Danach BUG-017/057 Spielstand,
dann BUG-011 Karawane.
Beim Start: `index.html?dev&test` → `RF.selftest()` muss 60/60 melden.

### Session 4 — 2026-09-25 · Siedlungsdichte + Titelklassen (Nutzerwunsch)
**Vorgefunden:** Phasen 0–4 abgeschlossen, 5 im Test, 6/13/15/19 in Arbeit; Selbsttest 46/46. (SESSION_LOG hatte nur
Session 1 — Sessions 2 und 3 stehen im CHANGELOG.)
**Gemacht:** Städte gestreckt (Abstand ≥ 2, Fläche ×1,8), Nordfurt/Aschfurt ergänzt, Einwohner nach Fläche, echte
Einwohneranzeige, Migration gen4. Titelklassen-System mit Nekromant und Hexenmeister, Questkette im Totenreich mit zwei
neuen Figuren, einem Wächter und drei Ortsszenen; Hexenmeister aus dem Klassenbaum gelöst. Selbsttest 54/54.
**Gefundene neue Probleme:** BUG-045–051 (alle behoben außer 051 teilweise).
**Offen geblieben:** weitere Titelklassen (nur Entwurf im GDD); Weltkarte selbst nicht vergrößert (Eren–Nordfurt ~18
Kacheln); Marktgröße (Wirtschaft) und sichtbare Einwohner laufen noch getrennt (Hunger/Flucht ändert nur die Zahl im
Markt); Diener folgen nicht durch Eingänge; Salzhafen/Sonnwacht bleiben unter ihrem Einwohnerziel (zu wenige Häuser).
**Nächster Schritt:** Nutzer: Bilder `stadt-nachher-*` gegen die eigene Vorstellung prüfen; soll die Karte selbst größer
werden (neues Spielstandformat)? Danach BUG-011 Karawane.
Beim Start: `index.html?dev&test` → `RF.selftest()` muss 54/54 melden.

### Session 1 — 2026-09-24 · Master-Prompt: Phasen 0–4
**Gemacht:**
- docs/ angelegt (BUGS, GDD, CHANGELOG, SESSION_LOG, PHASE_STATUS, STYLE_GUIDE, DATA_SCHEMAS).
- Phase 0: neues Spiel durchgespielt (Erstellung, Welt, Tod durch zornige Zeugin, Erbe, Speichern/Laden, alle 13
  Waffen, Mobil 375 px, Performance); Entwicklerzugang `?dev`/`window.RF`. 19 Befunde im Ledger vor dem ersten Fix.
- Phase 1: Leichen-Bug (BUG-001) an der Wurzel (`think()`), Feind-Aufrichten, Gnadenstoß, Zorn mit Leine + Buße,
  Verfolgung über Kartengrenzen (folgen/lauern/Arena), Erbe mit Habe.
- Phase 2: Reaktionsmatrix im GDD ausgefüllt und umgesetzt: Wachen-Alarm, Hilfe für Bewusstlose, Hilfe holen,
  Händler schließen, Rudel/Banden, Bluttat-Folgen, Dialogsperren, Rollen, 17 Wachposten in 6 Siedlungen.
- Phase 3: A*-Wegsuche bei Blockade, Spawns nie in Bäumen (16/20 Verfolger im Wald steckten fest!), Überfälle außerhalb
  des Bildes, Ruhezeiten je Region.
- Phase 4: Gebäude als Datensätze mit Pixel-Dach, Fassade, Funktion, Innenraum; Props mit Kontext und Varianten.
- Performance: Update/Zeichnen in Eren wieder im Budget.
- Selbsttest 22 → 37 (alle bestanden, wiederholt stabil; Gegenproben mit wieder eingebauten Bugs schlagen fehl).

**Gefundene neue Probleme:** BUG-020–027 (u. a. Laden-Sperre nie ausgewertet, Salzhafen-Tür im Wasser,
Selbsttest veränderte Spielstand, Gefahr verschobener Zufallsfolge für alte Stände) — alle behoben.

**Offen geblieben:** BUG-008 (Städte ohne Bewohner), BUG-009 (Tiefhall), BUG-011 (Karawane), BUG-012 (Touch),
BUG-013 (Tagesablauf), BUG-016 (Titelburg), BUG-017 (Speichergröße), Wald-Zeichnen 2,8 ms.

**Nächster Schritt:** Rückmeldung zum Gebäude-Look einholen → Phase 5 (Testbereich §25) oder BUG-008 vorziehen.
Beim Start: `index.html?dev&test` öffnen, `RF.selftest()` muss 37/37 (im Spiel) melden.
