# Session-Log — Rotfall: Legacy

Neueste oben.

### Session 6 — 2026-09-25 · Spielstand, Karawane, Tiefhall („weiter“)
**Vorgefunden:** Selbsttest 60/60; offen laut Plan: BUG-017/057 Spielstand 1,4 MB, BUG-011 Karawane, BUG-009 Tiefhall.
**Gemacht:** Diff-Speichern der Props (1,43 → 0,53 MB, alte v2/v3-Stände getestet); Karawane als Zug mit Gespann,
Kutscher, Beiwagen und zwei Wachen, Route aus der Straße; Tiefhall als zweiter Dungeon mit Boss Hrodvar und
Dungeon-Register. Nebenbei: BUG-058 (Props nach Laden verändert), BUG-059 (Leichen-Radius), BUG-060 (Säulen).
Selbsttest 64/64 auf fünf Seeds.
**Gefundene neue Probleme:** BUG-058–064 (062 Beiwagen-Sprung, 063 Balance, 064 Boss ohne Muster offen).
**Offen geblieben:** Hrodvar ohne Spezialangriffe; Tiefhall ohne Quest; Bewohner machen 430 KB des Spielstands aus.
**Nächster Schritt:** laut Nutzer weiter mit neuem Inhalt (siehe Einträge darüber, falls vorhanden).
Beim Start: `index.html?dev&test` → `RF.selftest()` muss 64/64 melden.

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
