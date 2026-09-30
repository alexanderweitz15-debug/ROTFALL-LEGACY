# ROTFALL: LEGACY — Master-Report des Audits (01.10.2026)

Zusammenführung von `TEIL_A_GAMEPLAY.md`, `TEIL_B_WELT.md`, `TEIL_C_DARSTELLUNG.md` und `SCOUTS_2026-10-01.md`, abgeglichen mit `PLAN_ROADMAP.md` §5g (vom Nutzer freigegeben, hat Vorrang). Kein Code geändert. Belege stehen in den Teilen; hier nur Funktion/Datei als Anker.

**Kürzel.** A1–A16 = Teil A (Gameplay). V1–V17 = Teil B (Welt, so auch in `STATUS.md`). **D1–D17 = Teil C** (dort ebenfalls „V“ genannt; umbenannt, weil die Nummern mit Teil B kollidieren). T01–T40 = Aufgaben in `TASKS.md`.

---

## 1. Current Game State

- **Version 22** (CHANGELOG, `index.html v=22`; `CLAUDE.md` nennt noch `v=21` → Doku-Drift). Selbsttest 323/323 nach A1 und V1 (beide TESTING), §5g.1 Varonheim TESTING.
- **Breite:** 163 Orte, 21 Stadtpläne, 24 Märkte, 1 174 lebende NPCs, 49 Gegnerarten, 77 Waffen in 16 `wtype`, 32 Elites, 19 Klassen, 64 Talentknoten, 20 Rezepte, 7 Zwischensequenzen, 9 Todesarten, 16 Fenster, 20 synthetische Klänge.
- **Tiefste Systeme:** Aurelion (Häuser, Rat mit wirkenden Gesetzen, Bionik am Magitech-Markt), Körper/Verletzung (6 Zonen, Brüche über Tage), Wirtschaft (echte Arbeiter, Warenketten), Kampfgefühl (`FEEL`, Hit-Stop, Parade, Ansagen), Figuren im Stil R.
- **Kernbefund:** Der Inhalt ist breit und oft gut; die **Systeme greifen zu wenig ineinander**, und drei gemessene Fehler brechen die Spannung:
  1. **Wucht-Stunlock** (`hit`, `crush` ohne `poiseUntil`): Kriegshammer 0 % Verlust gegen jeden Nicht-Boss und Gorak; Held St. 8 schlägt Todesritter St. 15. → A1, in Arbeit.
  2. **Untoten-Lawine** (`sim.js warDay`): ohne Spieler 15/15 Knoten in 12 Tagen, Heer wächst auf 134, wächst nach Garmadon weiter. → V1, in Arbeit.
  3. **1-gegen-1 ab St. 30 gelöst** (Smart-Bot 0 % Verlust). Schwierigkeit muss aus Gruppen, Rollen, Ressourcen kommen (§5g.20, A3).
- **Spieler-Schleife:** Früh fehlt Einstieg und Klassenprofil (1 Fähigkeit je Grundklasse). Mitte wird der Kampf flach (2–4 Hiebe, Beute = größere Zahl). Spät fehlt Druck, und der Tod des Helden – das Herz eines Erbe-Spiels – hat außer Gold/Ruf keine Folge.
- **Technik:** Spielstand 2,17 MB (nur zwei Plätze passen ins Browser-Kontingent), `saveData` 142 ms synchron, Partikel ziehen aus dem Spiel-RNG, Caches leeren komplett statt zu verdrängen.

---

## 2. Feature Inventory

Bewertung: **tief** = eigene Entscheidungen und Folgen · **solide** = funktioniert, wenig Verbindung · **dünn** = vorhanden, ohne Wirkung · **Kulisse** = nur Bild/Text.

| Bereich | Stand | Anker | Urteil |
|---|---|---|---|
| Nahkampf, Deckung, Rolle, Ansagen | Kombo, Parade 180 ms, Ausdauer, `startHeavy`/`exposed` | `attack`→`resolveSwing`→`hit`→`hurt` | tief (Spieler), dünn (Gegner verteidigen nicht) |
| Rüstung, Schadensarten | flach `dmg − armor×0,55`, Rüstung = `threat×1,6`, `mat` nur Klang | `spawnEnemy`, `hurt` | dünn |
| Schleichen | Erkennung per Kreis, Fertigkeit wächst nie | `nearestTarget` | dünn |
| Gruppe | 5 Befehle für alle, Ziel = nächster Feind | `partyCommand`, `partyAI` | dünn |
| Klassen, Talente | 19 Klassen, Grundklassen je 1 Fähigkeit, Talent jede 3. Stufe | `CLASSES`, `SKILL_TREE` | solide (Titel), dünn (Grundklassen) |
| Fertigkeiten | 14; Jagd 0 Wirkung, Schleichen nie erhöht, Führung nur Vorlesung | `skills.*`, ui.js 708 | teils dünn |
| Beute, Handwerk | 77 Waffen, 15 Affixe, 3 Legenden, 20 Rezepte, kein Zerlegen, Eisen vierfach | `RECIPES`, `craftItem` | solide, ohne zweite Verwendung |
| Körper, Verletzung, Heilung | Zonen, Abtrennen, Brüche/Entzündung über Tage, Narben | body.js, `woundDay` | tief |
| Überleben | Hunger nur Gruppenmoral, Held −4 Rumpf (nie tödlich) | `dayTick` | dünn |
| Tod, Erbe, Dynastie | Nachfolger, Grab mit Erbstücken, Chronik, Epilog | `playerDeath`, `adoptSuccessor` | solide, ohne Rückwirkung |
| Gefährten | Moral + Loyalität (zwei Abgangswege), Verrat, Lagerfeuer | `loyDay`, `dayTick` | solide |
| Verträge, Gerüchte | 12 Vertragsarten mit Wendung, Gerüchte mit Kartenkreis | `CON`, `rumorChoices` | tief |
| Kapitulation | Gegner wird neutral und läuft weg | `teamOf`, `surrenderOffer` | dünn |
| Krieg | 15 Knoten, nur Valen gegen Untote; Kette-Feldzüge außerhalb | `sim.js warTick`, `campResolve` | kaputt balanciert |
| Fraktionen | starke Inhalte, kaum Handeln in der Simulation; `bandit` = Rook + Lager + Karak | `factionAgenda` (`day % 5`) | Identität tief, Simulation dünn |
| Wirtschaft | 13 Waren je Ort, Arbeiter, Ketten; übrige Preise global | economy.js, `rawPrice`, `shopStock` | tief für Waren, Kulisse für Läden |
| Banden | entstehen/zerfallen, Schutzgeld; Überfälle ohne Opfer | `bandDay`, `riskOf` | solide, unverbunden |
| POIs | ~90 zufällige Orte mit Gegnern | `scatterPOIs` | Kulisse |
| Luftschiffe | 3 Schiffe Aurelions, Werft am Markt, Passage, Absturz als Großereignis | `airDay`, `airVoyage` | solide als Dienst, kein Weltsystem |
| Seefahrt | eigenes Schiff, feste Hafenpreise | `cargoMenu`, `PORT_PRICE` | solide, Preis-Insel |
| Kybernetik | Prothesen/Auge 1–4, Module, Wartung, Markt-Kosten, Schwarzmarkt | body.js, `mechMenu` | tief technisch, sozial leer |
| Zwischensequenzen | 7 Fahrten, Shot-Liste, Letterbox, Überspringen sicher | `cinematic`/`cineNext` | Diashow |
| Animation | 9 Todesarten, 3 Gesten, Arbeitsanimation | anim.js | solide |
| UI | 16 Fenster, 14 Menüeinträge (Überlauf ab 1024 px), flache Gesprächsliste | ui.js `NAV`, `talk()` | überladen |
| Klang | 20 Klänge, ein Regler, keine Musik, Regionsklang lückenhaft | sfx.js `MOOD` | dünn, fehlerhaft |

---

## 3. Weaknesses

Nach Wirkung sortiert, doppelte Befunde der Teile zusammengefasst.

1. **Balance-Brecher gemessen:** Wucht-Stunlock (A), Untoten-Lawine (B), 1-gegen-1 gelöst ab St. 30 (A).
2. **Waffenwahl ist keine Entscheidung.** Rüstung hängt an `threat`, Schlagart nur Klang, `ap` zählt kaum, Elite-Hinweis `tough` verspricht Regeln, die es nicht gibt (A).
3. **Gegner ohne Verteidigung**, Spieler mit vollem Set; Gegnerschilde sind Bild (A).
4. **Fraktionen handeln nicht.** Nur Valen und Untote bewegen sich; keine Ressource begrenzt Handeln (außer Valens Weizen); Beziehungen an drei Stellen (`facRelation`, `JOIN_FOES`, `hostile()`) (B).
5. **Läden hängen nicht an der Wirtschaft.** Globales `S.prices`, Zufallsbestand; eine Missernte verteuert Weizen, nicht Brot (B).
6. **Taten ohne Nachhall:** Gnade folgenlos, Mörder des Helden verschwindet, Heldentod unsichtbar hinter Todesbildschirm (A, C).
7. **Bionik ohne sozialen Preis:** niemand reagiert auf Messing (B).
8. **Szenen sind Diashows:** Text trägt alles, 426 ms Hänger beim Schnitt, Goblins verschwinden statt heimzuziehen, Morrgrunds Fall ist unsichtbar (C).
9. **Lesbarkeit:** Bewohner nur über Farbe, drei untote Zauberer gleich, Fraktionsarchitektur nur Material (Varonheim = Kette = Tickmar) (C).
10. **Ehrlichkeit gegenüber dem Spieler:** tote Fertigkeiten, falsche Tooltips, Vogelgezwitscher im Totenland und unter Tage (A, C).
11. **UI-Last:** 14 Menüeinträge, 5 Heldenfenster, 10+ Gesprächsknöpfe ohne Zifferntasten (C).
12. **Technik:** Spielstandgröße, synchrones Speichern, RNG-Verschmutzung durch Partikel, Cache-Komplettleerung (C).

---

## 4. Missing Systems

Nur Systeme, die vorhandene Teile verbinden (keine Listen-Features):

| Fehlt | Verbindet | Vorschlag |
|---|---|---|
| Wahrnehmung (Sicht, Licht, Lärm) | Schleichen, Rüstung, Wetter, Roboterauge, Taschendiebstahl | A4 |
| Gegner-Verteidigung (Block, Parade, Ausweichen) | Wucht, Flanke, Gruppe, Skalierung | A3 |
| Rüstungsklasse × Schlagart | Beute, Handel, Handwerk, Runen, Regionen | A2 |
| Gefangennahme | Kopfgeld, Banden, Gerüchte, Söldner, Ruf | A5 (+A10) |
| Ahnenfeind | Tod, Elites, Grab, Verträge, Dynastie | A6 |
| Fraktionsressourcen | Krieg, Wirtschaft, Diplomatie, Agenda | V12 |
| Stadtlager-Preise für alle Güter | Wirtschaft, Krieg, Streik, Handwerk | V3 |
| Verortete Überfälle | Banden, Züge, Kontor, Kriegsknoten | V4 |
| Ein Kriegsgraph für alle Mächte, eine Beziehungstabelle `FAC_REL` | Kette, Orden, Aurelion, Diplomatie, Luftraum | V2 |
| POI-Zustand `S.poi` | Wirtschaft, Späher, Lehen, Siedlung | V5 |
| Regie-Ebene für Szenen (cast, beats, Vorbacken) | Kamera, KI, Gesten, Klang, Koop | D1 |
| Klang-Busse und Signale | Szenen, Musik, UI | D11 |
| Zerlegen und Monstermaterial | Handwerk, Runen, Wirtschaft | A7 |

---

## 5. System Interactions

Fehlende Kanten, aus allen Teilen zusammengeführt (je System 3–5 Nachbarn):

| System | fehlt zu … | geschlossen durch |
|---|---|---|
| Waffentyp | Gegnerrüstung, Gegnerschild, Handwerk | A2, A3, A12 |
| Verletzung | Bionik (Entzündung führt nie zur Amputation) | A11 |
| Kapitulation | Kopfgeld, Banden, Gerüchte, Ruf | A5, A10, §5g.24 |
| Tod des Helden | Elites, Kopfgeld, Erbstücke, Szene | A6, D8 |
| Beute | Handwerk, Runen, Waren | A7, §5g.28 |
| Hunger/Rast | Kampfwerte, Nachtüberfälle, Schenke | A14 |
| Banden | Händlerzüge, Lager-POIs, Rook, Kopfgeld | V4 |
| Kriegsgraph | Kette, Orden, Aurelion, Seelen, Korn aller Städte | V1, V2, V12 |
| Luftschiffe | Wetter, Markt, Luftraum, Wrack als Ort | V7 |
| Prothesen | Orden, Varon, Wachen, Schock, Regen, Energiezellen | V9, V10 |
| Tribut | Dorfmarkt, Kettenstärke, Aufstand | V14 |
| Seehandel | Stadtmärkte, Clanruf | V6 |
| Läden | Stadtlager | V3 |
| Wiederaufbau | Holz/Stein im Markt, Lieferaufträge | V16 |
| Szenen | Figuren, Klang, Weltlage | D1, D2 |
| Klang | Region, unter Tage, Weltzustand | D4 |
| Besatzung | Stadtbild, Banner, Wachen | D13, §5g.35 |

---

## 6. Emergent Gameplay Opportunities

Ketten, die fast nur aus vorhandenen Teilen entstehen:

1. **Die hungernde Front:** Bande an Eren–Nordfurt (V4) → Korn fehlt → Valens Heer schrumpft (besteht) → Tote brechen durch (V1) → Flüchtlinge, Preise in Kreuzweg (besteht). Eingriff an jeder Stelle möglich.
2. **Gnade → Geschichte:** verschonter Bandit verrät das Lager (A5 → Gerücht) oder kommt als Rächer (`S.avenge`); Ruf der Gnade verändert Kapitulationen (A10).
3. **Ahnenfeind über Generationen:** Mörder trägt das Schwert des Vaters (A6), der Tod ist sichtbar (D8), der Erbe jagt ihn übers Brett (§5g.24).
4. **Wunde → Messing → Schulden:** Wundbrand (A11) → Amputation → Prothese → Wartung am Magitech-Markt → Streik verteuert den eigenen Arm (V10) → Orden misstraut (V9).
5. **Waffe nach Region:** Knochen im Totenland, Platte bei der Kette, Messing in Aurelion (A2) → Nachfrage nach Kolben, Handel und Schmied bekommen Sinn (V3, A7).
6. **Die Kette marschiert:** Feldzug nimmt einen echten Knoten (V2), Sklavenzahl = Feldzuggröße (V12); Pferche öffnen (`q_pferch`) schwächt den nächsten Feldzug.
7. **Varons Himmel:** Handelsschiff über Valen, Ballisten (V7) → Absturz, Wrack bleibt als Ort → Ratsthema, Zölle, Preise in Valen.
8. **Stigma-Reaktionen:** Messing (V9) und Vampirismus (§5g.2) laufen über dieselbe Reaktionstabelle: Zeugen, Wachen, Orden, Preise.
9. **Goblins ziehen heim:** Überlebende des Sturms laufen nach Morrgrund, ihre Zahl bestimmt das Fest und spätere Aufträge (D2).

---

## 7. World Simulation Improvements

Messung (B §3.1): Die Welt lebt in Tagesläufen, Märkten, Gerüchten und Großereignissen; sie **kippt** im Krieg und **folgt** sonst oft nichts.

| Schritt | Inhalt | Aufgabe |
|---|---|---|
| 1 | Krieg mit Nachschub: Untotenwachstum gedeckelt, Leichen als Ressource, kein Wachstum nach Garmadon, Valen hebt nur in eigenen Städten aus, Orden-Heer bei Sonnwacht | V1 → T02 |
| 2 | Kleine Sim-Fehler: `townState` Untote ohne Hunger, `graveyard` nicht umfärben, `JOIN_FOES` | V17 → T05 |
| 3 | Fraktionsressourcen `S.facRes` + Tribut aus dem Markt | V12, V14 → T23 |
| 4 | Überfälle verorten (Banden, Lager, feindliche Knoten) | V4 → T12 |
| 5 | Ein Graph, `FAC_REL`, Agenda nach Lage, Diplomatie | V2, V15, §5g.32 → T40 |
| 6 | POIs als Weltknoten, Wiederaufbau kostet Material | V5, V16 → später (Welle 2) |

Leitregel: Jede neue Simulationszahl braucht eine sichtbare Stelle (Kodex-Reiter „Mächte“, Kontor-Zeile, Gerücht), sonst ist sie unsichtbar.

---

## 8. Combat Improvements

Ziel: Die Antwort auf „Was entscheide ich im Kampf?“ darf nicht mehr „zuschlagen und besser ausrüsten“ sein.

| Stufe | Inhalt | Aufgabe |
|---|---|---|
| Fehler | Wucht mit Standfestigkeit (Boss 300 ms) | A1 → T01 |
| Wahl der Waffe | Rüstungsklassen `MONSTERS.*.ac`, `AC_MUL[ac][mat]` nahe 1 (0,75–1,3) | A2 → T19 |
| Gegner antworten | Block/Parade/Ausweichen als Daten, Knochenritter-Sonderregel verallgemeinert | A3 → T22 |
| Gruppe | Fokusziel, Haltung je Gefährte (vorn/Abstand/Heilen) | A8 → T16 |
| Druck im Spätspiel | Skalierung über Gruppengröße und Rollenmix, nicht Lebenspunkte | §5g.20 → T24 |
| Schleichen | Kegel, Licht, Lärm, `?`/`!` | A4 → T37 |
| Umgebung | eine Oberflächenregel (`oil`, `water`, `poison`) für Kombos und Fallen | §5g.26/34 → T36 |
| Tiefe über Zeit | Klassenregeln, Waffenkunst bei 25/50/75 | A9 → T32, A12 → Welle 2 |

Messprobe für alle Kampfaufgaben: `RF.simFight` mit festen Seeds, Ergebnis in `docs/BALANCE.md`.

---

## 9. Faction Improvements

| Fraktion | Stark | Leer | Hebel (Aufgabe) |
|---|---|---|---|
| Valen/Varon | Heer isst Nordfurts Weizen; Hof, Intrige, Ritterschlag | Paranoia gegen Aurelion nur Dialog; Steuern ohne Kriegskasse | Aushebung aus Köpfen und Korn (V1), Luftraum (V7), Blutkult am Hof (§5g.2), Lehen (§5g.33) |
| Orden | Paladine, Hexenprozess, Eifer `S.after.zeal` | kein Heer, Sonnwacht bleibt verloren, 11 NPCs, ignoriert Messing | Eifer steuert Heer (V1/V12) und Inquisition gegen Messing und Vampire (V9, §5g.2) |
| Untote | Städte, Hof, Seelenhandel, Überfälle mit Urteil | Wachstum ohne Ressource | Leichen/Seelen als Ressource (V1, V12) |
| Freie Händler | Kontor, Lieferaufträge | Züge anonym, Verlust trifft Gilde nicht | Züge gehören der Gilde (V12), Embargo (V15) |
| Rooks Bande | – | `bandit` = Rook (1 NPC) + 13 Lager + Karak | Zufallsbanden unter Rook bündeln (V4), Karak eigene Fraktion (V13) |
| Aurelion | tiefste Fraktion | kein Heer, Häuser ohne Besitz | Häuser besitzen Betriebe (V12), Städtefall über Graph (V2, §5g.8) |
| Eiserne Kette | Feste, Tribut, Feldzüge, dunkle Klassen | Feldzüge ändern nichts; zwei Vorräte je Tributdorf | Arbeitskraft = Feldzuggröße (V12), Tribut aus Markt (V14), Feldzug nimmt Knoten (V2) |
| Seevolk | zwei Clans, Grube, Schiff | Piraterie pauschal −12, feste Preise, Ränge 2/4 unerreichbar | V6 + §5g.14 → T27 |
| Grubenstämme | Befreiung, Grubenhort wächst | keine Wirtschaft | Pilzfarm/Schrottwerk (Welle 2) |
| Freie vom Grubenhort | – | nur Aufträge | **Rückfrage an Nutzer** (siehe §19, Widerspruch 6) |
| Sandfürsten, Zwerge | echte Kultur | keine Fraktion; Karak hungert (gemessen) | V13 → T26 |

Architektur und Tracht: Fraktionen unterscheiden sich im Bild nur durch Material/Farbe → D13 (Form je Fraktion, Banner nach Besitzer) mit §5g.35 → T33.

---

## 10. Economy Improvements

1. **Ein Preissystem:** `S.prices` (global), `ecoPrice` (je Stadt) und `PORT_PRICE` (Seehandel) → nur `ecoPrice`. Nicht-Waren bekommen `ITEMS.*.base` (Leitware) → V3 (T09), V6 (T27).
2. **Ladenbestand aus dem Stadtlager:** `shopStock` liest `stock.arms/tools/magitech`; Kauf zieht Leitware ab → V3.
3. **Überfälle mit Ursache:** `riskOf` liest Banden, Lager, feindliche Knoten; Beute lässt Banden wachsen → V4 (T12).
4. **Ein Vorrat je Dorf:** Tribut aus `S.towns[dorf].stock` → V14 (T23).
5. **Eisen-Brücke:** Erzfuhre ↔ Eisenerz ↔ Barren an der Esse → A15 (T25).
6. **Material als Ware:** Monstermaterial aus A7 als `GOODS`-fähige Ware (T25).
7. **Karak versorgen, Tiefhall als Markt ohne Kartenpräsenz** → V13 (T26).
8. **Determinismus:** `Math.random()` in economy.js → `rnd()` (T04).
9. **Später:** Wiederaufbau kostet Holz/Stein (V16), POIs liefern (V5), Siedlungsertrag und Lehen über ein Ertragsmodell (§5g.19/25/33 → T34).

Balance-Leitplanke: Multiplikatoren an `clamp(…, 0,7, 1,8)`; Kaufen und sofort Verkaufen bleibt ohne Gewinn (`price`).

---

## 11. Airship Improvements

Fundament richtig (Flotte in der Simulation, Nahrungsfolge, Werft am Markt, Absturz). Heute ein **Dienst Aurelions**, kein Weltsystem.

| Schritt | Inhalt | Aufgabe |
|---|---|---|
| 1 | Wetter und Jahreszeit im Flottenrisiko `riskAir` | V7 → T30 |
| 2 | Echte Fracht zwischen Aurelion-Städten (Logik von `caravanDay`) | V7 |
| 3 | Luftraum: Valen-Gebiet + schlechte Beziehung → Beschuss, Chronik „Varons Ballisten“ | V7 (vereinfacht über `facRelation`, sauber nach V2) |
| 4 | Wracks bleiben als Ort `S.wrecks[]` mit Bergungsgut | V7 |
| 5 | Luftpiraten als Bandenart mit Ankerplatz (EXPERIMENTAL) | V7 nach V4 |
| 6 | Landung von Privatarmeen nach Mord auf der Himmelsinsel nutzt die Flotte | §5g.9 → T29 |
| 7 | Eigenes Luftschiff: gemeinsames Schiffsmodell See/Luft, Treibstoff = Energiezellen (Magitech-Preis), Mannschaft aus Gruppe | V8, nach §5g.10 → Welle 2 |

Designregel „keine Schnellreise“: Flug kostet Zeit, Treibstoff, birgt Ereignisse; Landen nur an Masten oder freiem Feld.

---

## 12. Cybernetic/Prosthetic Improvements

Technik sauber und mit Markt/Streik verzahnt. Es fehlt die Frage „Welche neuen Probleme bringt mir das Messing?“.

| Achse | Heute | Vorschlag | Aufgabe |
|---|---|---|---|
| Sozial | keine Reaktion | `brassOf(c)`, Reaktionstabelle je Fraktion (Preis, Begrüßung, Einlass, Inquisition); in Aurelion gleichwertige Vorteile | V9 → T15 |
| Elektrisch/Wetter | nur Auge magieempfindlich | Schock lähmt Glied 1 s, Verschleiß ×2; Regen ×1,3 | V10 → T15 |
| Unterhalt | Wartung | Stufe 4 frisst eine Energiezelle am Tag | V10 → T15 |
| Medizinisch | Chirurgie ohne Risiko | innere Implantate (Blutfilter, Lungenbalg, Rückgratstrebe) mit Entzündungsrisiko je Ort | V11 → Welle 2 (Ort: Aurelheims Hospital, §5g.36) |
| Zugang | fast nur Abtrennung unter −200 LP | Wundbrand → Amputation | A11 → Welle 2 |

Merge: Die Reaktionstabelle aus V9 wird als allgemeine **Stigma-Tabelle** gebaut und von §5g.2 (Vampir: Zeugen melden, Orden jagt) mitgenutzt. Wer zuerst baut, legt sie an (T07 Blutkult).

Nutzerregel „Downed“: kein Implantat, das Selbst-Aufstehen erlaubt.

---

## 13. Animation Improvements

- **Fehler zuerst:** Partikeltyp `ghost` malt immer den Helden in Rollpose (`drawFx`, genutzt von Rolle, `UNDEAD_FX.wraith`, Todesart `dissolve`) → D3 (T04).
- **Partikeldeckel** (`S.fx`, `S.floats` unbegrenzt; Referenz fordert Grenze) → D5 (T04).
- **Heldentod als Moment:** 1,8 s Zeitlupe, Zoom, Todesart sichtbar, Mörder steht → D8 (T10, mit Ahnenfeind).
- **Gesten:** jubeln, knien, trauern, salutieren (heute 3) → mit Regiebuch D1 (T17) und Zuschauern D14 (T37).
- **Zuschauer reagieren:** hinschauen → zurückweichen → Stand zu → Wache → D14 (T37).
- **Silhouetten nach Beruf/Rolle:** ein `SPEC_KEYS`-Feld `tool` (≤ 12 Werte); Nekromant Schädelstab, Schatten gekrümmt, Leichenkoloss als `brute` → D12 (Welle 2; Varianten-Dauerauftrag §5b/§5f).

---

## 14. Cutscene Improvements

- **Regiebuch D1** (T17): Shot-Felder `cast` (Figuren aus der laufenden Welt, Ziel, Pose, Text), `beats` (gleiches Schema wie `ANIM_DEFS.death.ev`), `hold`, Schnitt-Klang; **Vorbacken vor dem Schnitt** (`R.prefetchAt` + `SP.warm`, Ziel < 60 ms statt 426 ms); `cineBars` auf Spectral, eine Textfunktion für `cineBars`/`coop-cine`.
- **Boss-Intros §5g.5** (T17) als leichte Variante ohne Teleport: Namenskarte, Boss-Beat, 500 ms Zoom, einmal je Haus (`S.flags.introSeen`).
- **Beispiel des Nutzers, D2** (T20): Goblinsturm vom Kettentor mit Horn statt Spawn neben Varg; Sieg mit Jubel und **Heimweg zu Fuß**; Niederlage als Fahrt „Morrgrund brennt“ **nach** der Erbenwahl mit Gräbern statt Löschen; gleiches Muster für `revoltStart`/`revoltWon`.
- **EXPERIMENTAL:** Erbfolge-Rückblick (3–4 Shots über veränderte Orte), Nachrichten-Vignetten nur mit Boten-NPC.

---

## 15. UI/UX Improvements

- **Gespräche** (D9): Gruppen `quest|trade|serve|talk`, „Reden …“ faltet ab 4 Einträgen, Zifferntasten 1–9. „Was gibt es Neues?“/„Omega?“/„Frage …“ → „Reden …“.
- **Menüs** (D10, schärft §5g.37): 14 → 6 Einträge (Held, Gruppe, Inventar, Tagebuch, Karte, Lager), alte Fensternamen als Alias.
- **Komfort** (§5g.37): Kartenlegende, eigene Markierungen, Inventar sortieren/Ramsch, Chronik-Filter, eigene UI-Signale.
- **Einstieg** (§5g.38, Eren) + Klassenregel sichtbar im Ausbildungsfenster (A9).
- **Ehrliche Anzeigen:** Tooltips der Fertigkeiten (A13), Rüstungsklasse im Treffer-Float/Kodex (A2), Kontor-Gefahr je Strecke mit Grund (V4), Kodex-Reiter „Mächte“ (V12).
- **HUD nur bei Änderung** (D16) — Leistung.

Alles oben: T13 (Oberfläche) außer den Anzeigen, die mit ihrer Mechanik kommen.

---

## 16. Technical Problems

| # | Problem | Beleg | Aufgabe |
|---|---|---|---|
| 1 | Wucht ohne Standfestigkeit | `hit` (`crush`) | T01 |
| 2 | Untotenwachstum ohne Deckel, nach Garmadon weiter; Valen hebt in besetzter Stadt aus | `sim.js warDay` | T02 |
| 3 | `ghost`-Partikel malt Helden | render.js `drawFx` | T04 |
| 4 | Partikel ziehen aus Spiel-RNG (Gewaltstufe ändert Beute/KI) | game.js `fx()` | T04 |
| 5 | `Math.random()` in economy.js (2 Stellen) | `caravanDay`, `myCaravanDay` | T04 |
| 6 | Regionsklang fällt auf Grünland + Vögel zurück (aurel, deadland, eisen, frozen, coast, unter Tage) | sfx.js `MOOD`, `ambienceTick` | T04 |
| 7 | Spielstand 2,17 MB, `saveData` 142 ms synchron, ≥ 15 direkte `save()` | state.js | T06 |
| 8 | Caches leeren komplett (`frameCache` 4000 inkl. `warmed`, `propCache`, `houseCache`, `bakeCache`) | sprites.js, render.js | T06 |
| 9 | Kalter Aufbau 201–426 ms (BUG-142), Stadtleistung (BUG-108), Fest (BUG-093) | BUGS.md | T06 |
| 10 | `townState` meldet Hunger für Untote; `graveyard` umgefärbt | sim.js | T05 |
| 11 | `EYE_ZAP` nennt shadow/shock/arcane, `spellHit` liefert nur `magic` | game.js | T05 |
| 12 | Doku-Drift: IST_ZUSTAND §2.2/§2.20, levelUp-Kommentar, ui.js 708, `CLAUDE.md v=21`, `STYLE_GUIDE` nennt D als Standard | Doku | T05 |
| 13 | `ref5_atlas.png` wird immer geladen, obwohl Stil F aus ist | sprites.js:124 | T05 (Cut F) |
| 14 | BUG-100 Schwarze Feste nicht befreibar | BUGS.md | T31 |
| 15 | Große Funktionen: `selftest` 3099, `drawProp` 697, `houseSprite` 257 Zeilen | awk | D17 (Welle 2) |
| 16 | Probenlage: D5 und V17b ändern den RNG-Strom einmalig; D2 und D9 ändern Erwartungen bestehender Proben (15953, Knopftexte) | – | Hinweise in T04, T13, T20 |

---

## 17. Feature Bloat

| Doppelt / ohne Wirkung | Entscheidung | Aufgabe |
|---|---|---|
| `S.prices` global neben `ecoPrice` | CUT, Leitware je Item | T09 |
| `PORT_PRICE` neben Stadtmärkten | MERGE in `ecoPrice`, Tangkron als Markt | T27 |
| `T.vorrat` neben Dorfmarkt | MERGE | T23 |
| `facRelation` + `JOIN_FOES` + `hostile()` | MERGE zu `FAC_REL` | T40 |
| Kette-Feldzüge neben Kriegsgraph | MERGE, Feldzug = Heer auf dem Graphen | T40 |
| `S.ship` und Luftschiff | MERGE zu einem Schiffsmodell | Welle 2 (V8) |
| `bandit` = Rook + Lager + Karak | SPLIT: Karak → `sand`; Zufallsbanden unter Rook | T26, T12 |
| `EVENTS` „Karawane überfallen“ (nur Preisfaktor) | CUT, echte Überfälle erzeugen die Meldung | T09 |
| `banditsOnTribute` neben Banden | MERGE über nahe Banden | T12 |
| Eisen vierfach (`iron`, `ore`, `ingot`, `koenigseisen`) | MERGE über Schmelzrezepte | T25 |
| `bone` ohne Zweck | in Knochenstaub (A7) aufgehen | T25 |
| Moral und Loyalität: zwei Abgangswege | MERGE, nur Loyalität entscheidet | T38 |
| Fertigkeit Jagd ohne Wirkung | Wirkung in §5g.12 | T35 |
| §5g.12 Fallen und §5g.34 Fallen | MERGE, ein Fallensystem auf Oberflächenregel | T35/T36 |
| §5g.19, §5g.25, §5g.33 (Stadt, Gold, Lehen) | MERGE, ein Ertragsmodell | T34 |
| Stil F (Atlas) | CUT; Stil D einfrieren | T05 |
| 5 Heldenfenster, 3 Wissensfenster, Gruppe + Stall | MERGE zu Held / Tagebuch / Gruppe | T13 |
| 3 Standard-Gesprächsknöpfe | MERGE zu „Reden …“ | T13 |
| `cineBars` und `coop-cine` | MERGE, eine Schrift | T17 |
| Partikel `ghost` für drei Zwecke | SPLIT `afterimage`/`ghost` | T04 |
| Ruf/Ruhm/Legende/Titel/Rang | **keine neue Ebene**; A10 nur als Achse in `S.fame` | T08 |

---

## 18. Priority Matrix

Wert = Gameplay-Wirkung (1–5) × Wechselwirkungen (1–5) × Spielerwert (1–5) ÷ Aufwand (Small 1, Medium 2, Large 4). **Belegte Fehler** (Critical) stehen unabhängig vom Wert vorn. §5g-Punkte sind freigegeben und werden nicht gewertet, nur nach Abhängigkeit eingereiht.

| Punkt | W | X | S | Aufwand | Wert | Kategorie |
|---|---|---|---|---|---|---|
| V1 Krieg mit Nachschub | 5 | 5 | 4 | S | 100 | NOW (Critical) |
| A1 Wucht-Stunlock | 5 | 3 | 4 | S | 60 | NOW (Critical) |
| A6 Ahnenfeind | 5 | 4 | 5 | M | 50 | NOW |
| A5 Gefangennahme | 4 | 5 | 4 | M | 40 | NOW |
| V3 Läden am Stadtlager | 4 | 5 | 4 | M | 40 | NOW |
| A2 Rüstungsklassen | 5 | 4 | 4 | M | 40 | NEXT |
| A10 Ruf der Klinge | 3 | 4 | 3 | S | 36 | NOW (mit A5) |
| V9 Sozialer Preis Bionik | 4 | 4 | 4 | M | 32 | NOW |
| D6 Spielstand komprimiert | 4 | 3 | 5 | M | 30 | NOW (Critical) |
| V4 Banden ↔ Züge | 4 | 5 | 3 | M | 30 | NOW |
| V12 Fraktionsressourcen | 4 | 5 | 3 | M | 30 | NEXT |
| V17 Welt-Korrekturen | 3 | 3 | 3 | S | 27 | NOW |
| V10 Prothesen-Schwächen | 3 | 3 | 3 | S | 27 | NEXT (mit V9) |
| V13 Sandfürsten, Zwerge | 3 | 3 | 3 | S | 27 | NEXT |
| V2 Ein Kriegsgraph | 5 | 5 | 4 | L | 25 | LATER |
| A4 Wahrnehmung | 5 | 5 | 4 | L | 25 | LATER (vor §5g.23) |
| D4 Umgebungsklang | 3 | 2 | 4 | S | 24 | NOW |
| D8 Heldentod | 3 | 2 | 4 | S | 24 | NOW (mit A6) |
| A8 Fokus und Haltung | 4 | 3 | 4 | M | 24 | NEXT (mit §5g.7) |
| A3 Gegner verteidigen | 4 | 3 | 4 | M | 24 | NEXT |
| D1 Regiebuch | 3 | 4 | 4 | M | 24 | NEXT |
| D2 Goblinsturm/Morrgrund | 3 | 3 | 5 | M | 22 | NEXT |
| V7 Luftschiffe in der Welt | 4 | 5 | 4 | L | 20 | NEXT |
| A7 Zerlegen, Material | 3 | 4 | 3 | M | 18 | NEXT |
| A14 Hunger und Rast | 3 | 4 | 3 | M | 18 | NEXT (mit §5g.6) |
| A11 Wundbrand → Prothese | 3 | 4 | 3 | M | 18 | LATER |
| V5 POIs als Knoten | 3 | 4 | 3 | M | 18 | LATER |
| V6 Seehandel am Markt | 2 | 3 | 3 | S | 18 | NEXT (mit §5g.14) |
| V15 Agenda nach Lage | 3 | 4 | 3 | M | 18 | LATER |
| D7 LRU-Caches | 3 | 2 | 3 | S | 18 | NOW (mit D6) |
| D5 Effekt-RNG, Deckel | 2 | 4 | 2 | S | 16 | NOW (Probenbasis) |
| D14 Zuschauer | 3 | 3 | 3 | M | 13 | LATER (mit A4) |
| A12 Waffenkunst | 3 | 3 | 3 | M | 13 | LATER |
| V11 Innere Implantate | 3 | 3 | 3 | M | 13 | LATER |
| A13 Tote Fertigkeiten | 2 | 2 | 3 | S | 12 | NOW (Ehrlichkeit) |
| D3 Geist-Partikel | 3 | 1 | 4 | S | 12 | NOW (Critical, sichtbar) |
| D9 Gespräche gruppiert | 3 | 1 | 4 | S | 12 | NEXT (mit §5g.37) |
| A9 Klassenregeln | 3 | 2 | 4 | M | 12 | LATER |
| V8 Eigenes Luftschiff | 3 | 4 | 4 | L | 12 | LATER |
| V14, V16, A15, D11, D15 | – | – | – | S | 12 | als Teil größerer Aufgaben |
| D10 Menüs | 3 | 2 | 3 | M | 9 | NEXT (mit §5g.37) |
| D13 Architektur über Form | 3 | 2 | 3 | M | 9 | LATER (mit §5g.35) |
| A16 Abgang vereinheitlichen | 2 | 2 | 2 | S | 8 | LATER (mit §5g.30) |
| D12 Silhouetten | 3 | 1 | 3 | M | 4,5 | LATER |
| D16 HUD-Diff | 1 | 1 | 1 | S | 1 | mit D6/D7 |
| D17 `drawProp` zerlegen | 1 | 1 | 1 | M | 0,5 | LATER (Technikschuld) |

**EXPERIMENTAL:** A14 zuerst nur auf „Sehr schwer“; A10-Wegzoll bei Banden; Luftpiraten und Varons Beschuss (nach V2); Tiefhall als Markt ohne Kartenpräsenz; Erbfolge-Rückblick; Nachrichten-Vignetten.

**CUT/MERGE:** siehe §17.

---

## 19. Recommended Implementation Order

### Grundsätze
1. Belegte Fehler zuerst (A1, V1, D3/D5/D4, D6/D7, V17).
2. Danach gemischt groß und klein (Nutzerwunsch), §5g-Punkte nach Abhängigkeit eingereiht, audit-Vorschläge, die einen §5g-Punkt tragen, **davor**.
3. RNG-Änderungen (D5, V17b) in **einer** Aufgabe, damit die Proben nur einmal eine neue Basis bekommen.
4. Nach jeder Aufgabe: Hunter (Sonnet) prüft; COMPLETED erst bei frischem grünen Selbsttest und Hunter-Bericht ohne offenen Fehler.

### Reihenfolge (Kurzform, Details in `TASKS.md`)
T01 A1 · T02 V1 · T03 §5g.1 (Test) · T04 Effekte/Zufall/Klang · T05 Kleine Korrekturen · T06 §5g.13 Spielstand und Caches · T07 §5g.2 Blutkult · T08 Gefangene, Steckbriefe, Ruf der Klinge · T09 Läden am Stadtlager · T10 Ahnenfeind und Heldentod · T11 Schwierigkeit, Überleben, Wetter · T12 Straßen haben Herren · T13 Oberfläche · T14 §5g.3 Ressourcen-Sprites · T15 Messing: Stigma und Schwächen · T16 Gefährten: Ausrüstung und Taktik · T17 Regiebuch und Boss-Intros · T18 §5g.10 Aurelion-Ränge · T19 Rüstungsklassen · T20 Goblinsturm inszeniert · T21 §5g.4 Zelte · T22 Gegner verteidigen sich · T23 Fraktionsressourcen und Tribut · T24 §5g.20 Skalierung · T25 Zerlegen, Material, Eisen · T26 Runen, Zwerge, Sandfürsten · T27 Seevolk, Seehandel, Gischtinsel · T28 Musik und Klang-Busse · T29 Himmelsinsel und Aurelheim · T30 Luftschiffe in der Welt · T31 §5g.17 Schwarze Feste · T32 Klassenregeln, Barde, Lehrer · T33 Orte beleben, Architektur · T34 Siedlung, Ertrag, Lehen · T35 §5g.12 Jagd · T36 Kombos, Fallen, Alchemie · T37 Schleichen, Taschendiebstahl, Zuschauer · T38 Stimmen der Welt · T39 Reittiere und Karawane · T40 Kriegsgraph, Diplomatie, Fall Aurelions.

**Welle 2 (nach T40, nicht in TASKS):** V5 POIs, V8 eigenes Luftschiff, V11 Implantate, V15 Agenda nach Lage (Rest aus T40), V16 Wiederaufbau mit Material, A11 Wundbrand, A12 Waffenkunst, D12 Silhouetten, D17 `drawProp`, Grubenstämme-Wirtschaft.

### Verknüpfung mit §5g

| §5g | Status | Audit-Bezug | Wirkung | Aufgabe |
|---|---|---|---|---|
| 1 Varonheim | gebaut, TESTING | D13: Material = Kette | später Form | T03, T33 |
| 2 Blutkult | offen | V9 (Stigma-Tabelle), V11 (Blutfilter ↔ Blutdurst), D12 (Blutmaske), D15 (Blutfürst-Intro), A4 (Maskierte nachts) | **geschärft** | T07 |
| 3 Ressourcen-Sprites | offen | A15 (Erz), V5 (Stollen) | geschärft (Abbau als Zustand) | T14 |
| 4 Zelte | offen | V4 (Bandenlager betretbar, Beute sichtbar) | geschärft | T21 |
| 5 Boss-Intros | offen | D1, D15 | **ersetzt durch D15 auf D1** | T17 |
| 6 Schwierigkeit | offen | A14 (`DIFF.survival`), V1 (Heerdeckel je Stufe), A11 | zusammengelegt | T11 |
| 7 Gefährten-Ausrüstung | offen | A8 | **zusammengelegt** | T16 |
| 8 Fall Aurelions | offen | V2 (Graph mit Aurelion-Knoten), V12 | hängt an V2 | T40 |
| 9 Himmelsinsel/Rat | offen | V7 (Landung über Flotte) | geschärft | T29 |
| 10 Aurelion-Ränge 3–6 | offen | V8, V10 (Prototyp-Unterhalt) | Tor für V8 | T18 |
| 11 Neue Lehrer | offen | A9, Oberflächen (§5g.26) | zusammengelegt | T32 |
| 12 Jagd | offen | A13 (Jagd-Fertigkeit), A7 (Reißzahn), §5g.34 (Fallen) | **Fallen zusammengelegt** | T35 |
| 13 Leistung, Spielstand | offen | D6, D7, D16, BUG-108/142/093 | **ersetzt durch D6/D7/D16** | T06 |
| 14 Seevolk-Ränge | offen | V6 (Freibeuterei = Rangweg) | zusammengelegt | T27 |
| 15 Akademie-Innenleben | offen | – | gebündelt | T38 |
| 16 Musik | offen | D4 (Regionsschlüssel), D11 (Busse) | D11 davor | T28 |
| 17 Schwarze Feste | offen | V1 (Heerdeckel macht BUG-100 lösbar) | nach V1 | T31 |
| 18 Stumme Figuren, Flüchtlinge | offen | V1 (Rückkehr nach Befreiung) | geschärft | T38 |
| 19 Siedlung als Stadt | offen | V16, V5 | **mit 25 und 33 ein Ertragsmodell** | T34 |
| 20 Skalierung | offen | A3, Messung St. 30 | **geschärft: Rollenmix statt LP** | T24 |
| 21 Wetter Menschenland | offen | A14, V7 (`riskAir`) | gebündelt | T11 |
| 23 Taschendiebstahl | offen | A4, D14 | **A4 zwingend davor** | T37 |
| 24 Steckbriefe | offen | A5 | **auf A5 aufsetzen** | T08 |
| 25 Siedlung Gold | offen | – | mit 19/33 | T34 |
| 26 Magie-Kombos | offen | Oberflächenregel (A) | **mit 34 ein System** | T36 |
| 27 Reittiere 2.0 | offen | – | mit 29 (Lasttiere) | T39 |
| 28 Runen | offen | A7 (Splitter, Material), A2 (wirken auf Schlagart), V13 (Zwergen-Ruf) | **geschärft** | T26 |
| 29 Eigene Karawane | offen | V4 (`riskOf`), V3 | nach V4 | T39 |
| 30 Gefährten-Szenen | offen | A16 | gebündelt | T38 |
| 31 Barde | offen | A9 (Barde bewusst ausgenommen) | gebündelt | T32 |
| 32 Diplomatie | offen | V2 (`FAC_REL`), V12, V15 | hängt an V2 | T40 |
| 33 Lehen | offen | V5 (gehaltene POIs als Lehen) | mit 19/25 | T34 |
| 34 Alchemie, Fallen | offen | V3 (Apotheke über Leitware), Oberflächenregel | mit 26 und 12 | T36 |
| 35 Orte beleben | offen | D13, Scouts B1–B3, B7 | zusammengelegt | T33 |
| 36 Aurelheims Prachtbauten | offen | V11 (Hospital = Operationsort) | gebündelt mit 9 | T29 |
| 37 Komfort-UI | offen | D9, D10, D11-Signale | **zusammengelegt** | T13 |
| 38 Gischtinsel, Einstieg Eren | offen | V6 (Tangkron als Markt), A-Schleife „kein Tutorial“ | geteilt auf T27 und T13 | T27, T13 |

### Widersprüche zwischen den Teilen und ihre Auflösung

1. **Nummernkollision V1–V17** (Teil B und C) → Teil C heißt hier D1–D17.
2. **RNG-Richtung:** Teil B will Spiel-Würfe in economy.js über `rnd()` (Determinismus), Teil C will Partikel **weg** von `rnd()`. Kein Widerspruch, eine Regel: *Spiellogik zieht `rnd()`, Darstellung zieht `vrnd()`.* Beides in T04.
3. **`S.prices` und `EVENTS`-Meldung:** V17(d) setzt V3 voraus → (d) wandert in T09.
4. **Ruf-Ebenen:** Teil A warnt vor fünf Ansehens-Ebenen, A10 schlägt einen neuen Wert vor → A10 nur als Achse in `S.fame`, keine neue Ebene.
5. **Critical nach Formel:** D3 (Geist-Partikel) hat nach der Formel nur Wert 12, ist aber ein sichtbarer Fehler → Regel „belegte Fehler zuerst“ gilt vor der Formel.
6. **Freie vom Grubenhort:** Teil B will sie nach Vargs Fall in die Grubenstämme überführen; der Nutzer hat in §5c „eigene Fraktion“ entschieden. → **Nicht umgesetzt**, als Rückfrage an den Nutzer (Status REQUIRES REVIEW).
7. **Doppelte Fallen** in §5g.12 und §5g.34 → ein Fallensystem auf der Oberflächenregel (T35 legt Tierfallen an, T36 erweitert um Öl/Gift).
8. **§5g.13 und D6/D7:** §5g.13 ist unkonkret, D6/D7 liefern Messung und Weg → ersetzt.
9. **Luftraum (V7) vor `FAC_REL` (V2):** Teil B nennt V7 NEXT, aber den Beschuss „erst nach V2 sauber“. → V7 in T30 mit vereinfachter Prüfung über `facRelation`; Umstellung auf `FAC_REL` in T40.
10. **Probenerwartungen:** D2 ändert Probe 15953 („kein Goblin“ → „Gräber“), D9 verschiebt Knopftexte in Untermenüs, V1 deckelt Heere → betroffene Proben in derselben Aufgabe anpassen, nicht löschen.
11. **Versionsstand:** `CLAUDE.md` sagt `v=21`, Code und CHANGELOG `v=22` → in T05 korrigieren.

---

## 20. Concrete Next Tasks

Die ersten zehn aus `TASKS.md` (vollständig dort, mit Anforderungen, Tests, Abhängigkeiten):

1. **T01 A1 Wucht mit Standfestigkeit** — TESTING (Engineer fertig, 323/323).
2. **T02 V1 Krieg mit Nachschub** — TESTING (Engineer fertig, 323/323).
3. **T03 §5g.1 Varonheim** — TESTING (Hunter).
4. **T04 Effekte, Zufall, Klang:** Geist-Partikel trennen (D3), `vrnd` + Partikeldeckel (D5), economy.js auf `rnd()` (V17b), Regionsklang (D4). Critical · Small.
5. **T05 Kleine Korrekturen:** V17 a/c/e, A13 (Führung wächst, Tooltips), `EYE_ZAP`, Stil F entfernen, Doku-Drift. High · Small.
6. **T06 §5g.13 Spielstand und Caches:** Neubau-Felder nicht speichern, gzip `RFZ1:`, gebündeltes Speichern, LRU-Caches, Vorwärmen, HUD-Diff. Critical · Medium.
7. **T07 §5g.2 Blutkult** mit allgemeiner Stigma-Tabelle. High · Large.
8. **T08 Gefangene, Steckbriefe, Ruf der Klinge** (A5 + §5g.24 + A10). High · Large.
9. **T09 Läden am Stadtlager** (V3, `S.prices` streichen). High · Medium.
10. **T10 Ahnenfeind und Heldentod als Moment** (A6 + D8). High · Medium.
