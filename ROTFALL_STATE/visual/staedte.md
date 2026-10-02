# Analyse: Städte (Priorität 10)

## Bestand (belegt per grep)

- **Weltgenerierung/Layout:** `world.js` `TOWN_PLAN` (Platz, Gebäude, Felder je Stadt), `buildMetropolis` für Aurelheim (190×136 Kacheln, 11 Bezirke, begehbare Prachtbauten `HALL_TYPES`), `HOUSES`, `LOCATIONS`.
- **Wirtschaft/Gebäude:** `economy.js` `TRADES` (14 Betriebe: Hof, Jägerhütte, Schmiede, Weberei, Magitech-Werk …), `S.towns`, `ecoDay`, Lagergrenzen, Warenketten. Arbeiter sind echte NPCs (`villagersOf`), keine Statisten.
- **Händler/Läden:** `game.js` `shopStock`, `buy`, `sell`, `tradeAt`, `openShop`; Pools in `data.js` (`NPCS.pool`, `SMITH_POOL`, `STALL_POOL`, `MARKET_POOL`, `TAVERN_POOL`); Aurelheims Markthalle mit Fachhändlern (Juwelier, Rüstmeisterin, Magitech-Ingenieurin).
- **Anschlagbrett:** `game.js` `boardTown`, `boardEntries`, `boardText`, `boardMenu(town)`, `conList`, `townContracts` — **reines Text-Dialogfenster** (`UI.dialogue`), kein gezeichnetes Brett mit Zetteln/Steckbriefen. Steckbriefe (Scout #9, `eliteFace`) existieren als Idee mit Elite-Porträt, aber laut Code bisher nur als Funktion `eliteFace`, die ein Spec für ein Porträt liefert — Einsatzort (tatsächlich am Brett angezeigt?) ist aus dem Grep allein nicht sicher belegt und müsste vor Umsetzung im UI-Code verifiziert werden.
- **Wachen/Verteidigung:** `ensureDefenseMasters` (transiente Bevölkerung, siehe CLAUDE.md-Muster), `GUARD_POSTS`, `defenseChoices`, Stadtverteidigung mit Kopfanzahl-abhängigem Ruf.
- **Tagesabläufe:** Keine eigene „Dayplan“-Funktion gefunden (`grep` auf `dayPlan`/`schedule` ergab nichts); NPC-Tagesrhythmus läuft vermutlich über `anchor`/Zeitfenster direkt in `think`/`updateNpc` (nicht Teil dieser Analyse, sondern der NPC-Priorität 3) — für Städte bedeutet das: ob Bürger sichtbar zwischen Haus/Arbeit/Taverne wechseln, ist nicht bestätigt und wäre vor Umsetzung zu prüfen.
- **Ambiente:** `render.js` `drawAmbience` zeichnet Lagerfeuerrauch, Krähen/Fliegen an Leichen, Laub, Glühwürmchen, Fledermäuse, Morgennebel — **schließt Städte für Laub und Glühwürmchen explizit aus** (`town` als Sonderfall) und hat keine stadtspezifischen Ambiente-Elemente (Markttreiben, Kinder, Tiere auf der Straße, Patrouillen als eigenes Ambiente-Element).
- **Was laut Code fehlt:** Keine Kinder als generische Stadtbevölkerung (nur `S.legacy.children`, die eigene Dynastie, nicht Stadt-NPCs), keine freilaufenden Tiere in Städten (Herden existieren nur auf Weiden außerhalb, `HERD_OUT`), kein gezeichnetes Anschlagbrett (nur Dialogtext), keine sichtbare Wachpatrouille als eigenes Ambiente-Feature (nur Kampf-/Festnahme-Logik `arrestCheck`).

## Problem

Städte sind wirtschaftlich und bevölkerungsmäßig simuliert (echte Arbeiter, echte Wachen, echte Händler), aber die *Präsentation* der Stadt als lebendiger Ort hängt stark von Dialogtext ab (Anschlagbrett, Händlergespräch) und es fehlt sichtbares Straßenleben (Kinder, Tiere, erkennbare Patrouillenwege, visuelle Hinweise auf wichtige Gebäude).

## Inspiration (nur UX, nichts kopieren)

Stardew Valley (kleine, warme Städte mit erkennbaren Tagesrouten der Bewohner), RimWorld (Kolonisten mit sichtbaren Jobs statt Textliste), Albion/WoW (Handwerker- und Marktstände mit Warenhäufchen statt Menü), Kenshi (Stadtwachen patrouillieren sichtbar, Fraktionsbanner an Gebäuden), Mount & Blade (Stadtplätze mit Händlerstand-Symbolen für Waffen/Rüstung/Pferde statt Textmenü).

## 10 Varianten

1. **Anschlagbrett als gezeichnetes Objekt:** ein echtes Holzbrett-Sprite in der Stadt mit aufgehefteten Zetteln (Anzahl = aktive Boardaufträge), Klick öffnet weiterhin das bestehende Textpanel — nur der Zugang wird visuell statt ein unsichtbarer Interaktionspunkt.
2. **Steckbrief mit Gesicht am Brett (Scout #9 zu Ende gebaut):** `eliteFace`-Porträt sichtbar am Brettsprite selbst, nicht nur im Dialog.
3. **Warenhäufchen am Marktstand:** Händlerstände zeigen stilisiert, *was* sie führen (Fässer, Stoffballen, Waffenständer) statt nur eine Namens-NPC zum Ansprechen.
4. **Sichtbare Patrouillenroute der Wachen:** Wachen laufen erkennbar feste Runden um Platz/Tore statt stehend/zufällig (reine Bewegungs-Choreografie, keine neue Regel).
5. **Kinder als generische Stadtbevölkerung:** 1–2 Kind-NPCs pro größerer Stadt mit harmlosem Idle-Verhalten (spielen, rennen) — rein kosmetisch, keine Interaktion nötig.
6. **Tiere auf der Straße:** Hühner/Hunde/Katzen als reine Ambiente-Entities (ähnlich den vorhandenen `HERD_OUT`-Tieren, aber ohne Wirtschaftsfunktion) in Stadtgassen.
7. **Gebäudehinweise durch Symbolik statt Beschriftung:** Schmiede mit Amboss-/Rauch-Symbol über dem Dach, Taverne mit Krug-Symbol, Wache mit Banner — sichtbar schon von weitem, ohne Text einlesen zu müssen.
8. **Fraktionsbanner an wichtigen Gebäuden:** sichtbare Fahne/Wappen der herrschenden Fraktion am Rathaus/Burgtor (verstärkt, was die Kriegskarte nur abstrakt zeigt).
9. **Markttreiben zu Stoßzeiten:** tagsüber mehr sichtbare Bewegung/Dichte auf dem Marktplatz, nachts leer — falls Tagesabläufe (siehe Bestand, ungeklärt) das zulassen.
10. **Stadtzustand sichtbar statt nur im Menü:** Wohlstand/Bedrohung/Besatzung (heute nur in `mapPick`-Text oder `SIM.townState`) zeigt sich an der Stadt selbst (z. B. verschlossene Fensterläden bei Seuche/Belagerung — teils über `S.schutz`/`capitalScene` schon ansatzweise vorhanden, siehe `welt.md`).

## Bewertung gegen ROTFALL

- Varianten 5 und 6 (Kinder, Tiere) sind laut Bestand **komplett neue Entity-Typen** ohne vorhandene Infrastruktur (keine Profile, kein Idle-Verhalten, keine Sprite-Variante) — höherer Aufwand als die Formulierung vermuten lässt; VISUAL.md nennt sie aber ausdrücklich unter Priorität 10, also gehören sie in den Plan, nur in eigener Scheibe.
- Variante 9 (Tagesdichte) hängt von einer ungeklärten Tatsache ab (ob es überhaupt einen Tagesablauf-Mechanismus für normale Bürger gibt) — muss zuerst durch die Priorität-3-Analyse (NPC-Interaktionen) oder eigene Prüfung geklärt werden, bevor sie zugesagt werden kann.
- Varianten 1, 2, 4, 7, 8 sind reine Präsentationsänderungen an vorhandenen, echten Systemen (Board, Wache, Gebäudetypen, Fraktionsbesitz) und am günstigsten/risikoärmsten.
- Variante 3 (Warenhäufchen) berührt die Pixel-Figuren-Pipeline (`SP.humanSpec`/`buildings.js`) und sollte mit der Priorität „Shops“ (7) dieses Umbaus abgestimmt werden, um keine doppelte Arbeit zu bauen.

## Wahl / Kombination

**Variante 1 + 2** (gezeichnetes Brett mit Steckbrief-Porträt) zuerst, weil sie die größte Text-zu-Bild-Lücke aus VISUAL.md direkt schließt und die Grundlage (`eliteFace`) schon da ist. Dazu **Variante 7 + 8** (Gebäudesymbolik, Fraktionsbanner), weil sie ohne neue Entity-Typen auskommen und die geforderten „Hinweise auf wichtige Gebäude“ direkt erfüllen. **Variante 4** (Patrouillenroute) als kleine, risikoarme Ergänzung. **Varianten 5, 6, 9, 10** werden als eigene, spätere Scheiben mit offenen Fragen vorgemerkt.

## FEATURE IMPACT REPORT (GATE.md §8)

**Feature:** Sichtbares Anschlagbrett mit Steckbrief-Porträt, Gebäudesymbolik, Fraktionsbanner, sichtbare Wachpatrouille.

**Betroffene Systeme:**
- `game.js` `boardMenu`, `boardTown`, `townContracts`, `ensureDefenseMasters`, `GUARD_POSTS`.
- `buildings.js` (Gebäudetypen/-sprites, `HALL_TYPES`), `world.js` `TOWN_PLAN`.
- `render.js` (Zeichnen neuer Sprite-Objekte: Brett, Banner, Dach-Symbole).
- `data.js` `ELITES`/`eliteFace` (Porträtquelle für Steckbriefe).
- `S.war.nodes`/`owner` (Fraktionsbesitz) für Banner.

**Bereits vorhanden:**
- Vollständige Board-Logik (Aufträge, Status, Sperrung) — nur der visuelle Zugang fehlt.
- `eliteFace`-Funktion liefert bereits ein Spec für ein Elite-Porträt.
- Fraktionsbesitz je Kriegsknoten (`S.war.nodes[k].owner`) ist bereits bekannt und wird auf der Kriegskarte genutzt — für Banner nur eine zweite Verwendungsstelle.
- Gebäudetypen (`TRADES`, `HALL_TYPES`) sind klar benannt, eine Zuordnung Typ→Symbol ist eine reine Darstellungsfrage.

**Fehlende Infrastruktur:**
- Kein Sprite/Objekt „Anschlagbrett“ als zeichenbares Entity in der Welt (heute ist der Board-Zugang vermutlich an einen unsichtbaren Interaktionspunkt oder eine NPC-Figur gekoppelt — genauer Interaktionsweg muss vor dem Bau im UI/Entity-Code verifiziert werden, da der Grep dafür keinen eindeutigen Treffer lieferte).
- Keine Dach-/Gebäudesymbolik-Pipeline (muss, wie alles in ROTFALL, im Code gezeichnet werden — kein Bildimport erlaubt).
- Keine Patrouillenroute-Datenstruktur für Wachen (aktuell wahrscheinlich Idle/Zufallsbewegung oder feste `anchor`-Position, nicht bestätigt).

**OFFENE DESIGNENTSCHEIDUNGEN:**
1. Wie ist der heutige Interaktionsweg zum Anschlagbrett genau umgesetzt (NPC „Ausrufer“? unsichtbarer Hotspot? Gebäude-Trigger)? Muss vor dem ersten Code-Schritt im UI/Welt-Code verifiziert werden — hier nicht angenommen.
2. Welche Steckbriefe genau am Brett erscheinen (nur Kopfgeld-Elite nach bestehendem `eliteFace`, oder auch normale Board-Aufträge mit einem generischen „Auftrag“-Zettel-Symbol)?
3. Patrouillenrouten: Sind feste Rundwege je Stadt/Wachposten gewünscht (mehr Determinismus, evtl. Konflikt mit `world.js`-Determinismus-Regel, falls Routen aus `rnd()` abgeleitet werden) oder reicht ein einfacher Hin-und-Her-Lauf zwischen zwei festen Punkten?
4. Fraktionsbanner: Sollen sie sich bei Besitzwechsel (Belagerung, Fall einer Stadt — siehe `welt.md`) in Echtzeit ändern, oder erst beim nächsten Betreten der Stadt (einfacher, aber inkonsistent, falls der Spieler während des Wechsels anwesend ist)?
5. Kinder/Tiere (Varianten 5/6) als generische Stadtbevölkerung: komplett neues Feature — eigener Impact Report nötig, nicht Teil dieser Scheibe.

**Risiken:**
- Neue sichtbare Objekte in bestehenden, bereits dicht bebauten Stadtplänen (`TOWN_PLAN`) können Kollisionen/Überlappungen mit vorhandenen Gebäuden/NPC-Ankerpunkten erzeugen — Platzierung muss je Stadt einzeln geprüft werden, kein automatisches „irgendwo hinstellen“.
- Mehr gezeichnete Objekte in Städten erhöhen die Zahl der Draw-Calls im dichtesten Teil der Karte — gegen das 3-ms-Ziel je Bild testen, besonders in Aurelheim (größte Stadt, 11 Bezirke).

**Implementierungsplan (in Scheiben):**
1. Scheibe 1 (Voraussetzung): Verifizieren, wie der Board-Zugang heute technisch funktioniert.
2. Scheibe 2: Gezeichnetes Anschlagbrett + Steckbrief-Porträt (abhängig von Designentscheidung 1 und 2).
3. Scheibe 3: Gebäudesymbolik (Schmiede/Taverne/Wache) an bestehenden Gebäudetypen.
4. Scheibe 4: Fraktionsbanner (abhängig von Designentscheidung 4).
5. Scheibe 5: Patrouillenroute (abhängig von Designentscheidung 3).
6. Später, mit eigenem Impact Report: Kinder/Tiere/Markttreiben.
