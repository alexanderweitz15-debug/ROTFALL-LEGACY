# Feature-Audit: Sind die alten Systeme gut ausgebaut?

Agent 8 (Darstellung) mit Blick des Feature Designers · 01.10.2026 · Status: **DESIGNING** (Ideensammlung, keine Freigabe nötig für das Lesen; jede Ausbauidee braucht die Freigabe des Entwicklers)
Quellen: `docs/IST_ZUSTAND.md` §2.11, 2.13, 2.16, 2.19, 2.20, 2.23, §3; `docs/MECHANIKEN.md` (Wohnzonen, Gefährten 2.0, Bionik-Händler); Code per grep (Zeilen von game.js verschieben sich, weil der Hauptstrang gerade editiert — „ca.“).
Aufwand: S = 1 Runde, M = 2–3 Runden, L = eigenes Paket. **FACT** = belegt, **PROPOSAL** = Vorschlag, **ASSUMPTION** = Annahme.

---

## 1. Bausystem und Siedlung (zuerst, wie gewünscht)

**Was es gibt (FACT)**
- `data.js:1072-1086`: 13 Bauten mit `cat`, `cost` (nur Holz/Stein/Eisen), `time`, `w/h`, `desc`, `pop`. Platzieren: `startPlacing`/`tryPlace` (Geist, Reichweite 400, `canPlace` prüft Kollision); Bau durch Anwesenheit von Held/Gefährten (`updateBuildings`, Fortschritt je Helfer). Nutzung: `BUILD_USE` (7 Typen: Ausbessern, Schmieden, Rasten, Trinken, Lager, Ausschau, Hofvorrat).
- Siedler ziehen je Platz ein, arbeiten nach einer **globalen** Prioritätenliste (6 Aufgaben), Erträge fix (Holz +2, Nahrung +1/+2, Stein +1 je Tag), Verfall langsam, Überfall um 2 Uhr mit 40 % (IST §2.19). Wohnzonen (§5d.3): Siedler bauen selbst Hütten aus dem Vorrat. Weide mit Hofvorrat (§2.18), Lager öffnet 24 Plätze `S.stash`.
- Fenster `settleUI` (ui.js:863-909): Textknöpfe, Kostenzeile, Prioritäten mit „höher“, Ortsgedächtnis.

**Wie tief?** Ein funktionierendes Lager, kein System: keine Verbindung zu Wirtschaft (`economy.js` kennt die Siedlung nicht als Markt), keine zu Fraktionen (niemand reagiert auf eine Siedlung in seinem Land, keine Steuer, kein Schutzvertrag), keine Siedler-Persönlichkeit (Siedler sind `makeChar` ohne Bedürfnisse außer 0,5 Nahrung), Überfälle sind Zufall ohne Ursache. IST §3.13 nennt es selbst: „Siedlung ohne Städtebau“.

**Was fehlt zum System (Ketten)**
- Siedlung ↔ Wirtschaft: Überschuss verkaufen, Händlerzug anlocken, Preise beeinflussen.
- Siedlung ↔ Fraktionen: Landherr verlangt Tribut oder bietet Schutz; Untote/Banden haben Grund anzugreifen (Reichtum, Ruf).
- Siedlung ↔ Gruppe: Gefährten haben eine Aufgabe im Lager (Wache, Schmied), Loyalität steigt mit Heim.
- Siedlung ↔ Erbe: Die Siedlung ist das, was der Nachfolger erbt — heute nur Gebäude.

**Ausbauideen**
1. **Siedlung als Marktknoten (M):** `S.towns[settlementKey]` mit Vorrat/Bedarf; Lagerhaus definiert die Lagergrenze; Händlerzüge fahren an, wenn Überschuss > Ziel. Spieler sieht Preise im Bestands-Reiter. Kette: Acker → Weizen → Zug → Gold → Palisade.
2. **Landrecht (M):** Wer im Gebiet eines Knotens (`S.war.nodes`) siedelt, bekommt nach 3 Tagen Besuch: Tribut (10 % Vorrat/Woche) oder Schutzvertrag (Wachen kommen bei Überfall, Ruf nötig). Ablehnen = Vogelfrei in diesem Land. Kette: Siedlung → Fraktion → Krieg (Besatzung des Knotens ändert den Herrn).
3. **Siedler mit Gesicht (S–M):** Jeder Siedler bekommt Beruf + ein Bedürfnis (Dach, Nahrung, Sicherheit, Bier); Prioritäten je Siedler statt global (Dock-Reiter „Siedler“ mit Karten, Tätigkeit sichtbar); Unzufriedene gehen und reden in der nächsten Schenke schlecht (Ruf −).

## 2. Handwerk und Schmieden

**FACT:** 20 Rezepte (`RECIPES` data.js:1370: 10 Esse, 8 Werkbank, 2 Kessel), Güte nach Fertigkeit (`craftQual`), Königseisen hebt eine Stufe, Fertigkeit steigt (`craftItem`); Menü ist ein Gespräch (`craftMenu`), Selbstwartung von Prothesen (`selfRepair`). **Tiefe:** solide Kernregel, aber ohne Kette: Material kommt nur aus Vorrat/Beute, nichts wird zerlegt, keine Aufträge für Handwerker, kein Verkauf von Meisterstücken mit Namen (`o.maker` wird gesetzt, aber nirgends gelesen — ASSUMPTION, nur grep auf `maker`).
**Ideen:** (1) **Zerlegen (S):** Werkbank nimmt Ausrüstung → Material zurück (Eisen, Tuch, Holz) nach Wert. (2) **Werkstücke mit Namen (M):** Meisterliche Stücke tragen „von Ragnar“; Händler zahlen mehr, Gefährten reden darüber, Nachfolger findet sie als Erbstück. (3) **Handwerksaufträge am Brett (M):** `CON`-Art „Schmiedearbeit“: 3 Werkzeuge bis Tag X, nutzt vorhandene Vertragsmaschinerie.

## 3. Handel, Markt, Kontor

**FACT:** 13 Waren, 14 Betriebe, echte Arbeiter, Händlerzüge, Preis nach Vorrat (`ecoPrice`), Kontor mit Wagen, Betrieben, Lieferaufträgen (IST §2.16) — die tiefste Simulation im Spiel. **Darstellung:** Handel = zwei Listen; Kontor = Gesprächszeilen; Preisvergleich = ein Satz je Ware (`ecoPrices`). Die Tiefe ist unsichtbar.
**Ideen:** (1) **Handelsdock mit Preispfeilen (S):** Kategoriechips, Mengenwahl, Pfeil hoch/runter gegen `S.priceSeen`. (2) **Preiskarte (M):** auf der Weltkarte je bekannter Stadt die zwei billigsten/teuersten Waren als Zeichen; Kette Karte → Reise → Wagen. (3) **Betriebe sichtbar (M):** gekaufte Betriebe zeigen Gebäudeflagge und Tagesertrag im Kontext; Arbeiter grüßen den Besitzer.

## 4. Auftragsbuch

**FACT:** 55 Quests + 36 Rangquests + 12 Vertragsarten mit Wendungen, Echo, Rächer (IST §2.13) — sehr reich. Fenster `questUI`: flache Textkarten, sortiert nach Zustand; Verfolgen und Abbrechen; Kartenpunkt vorhanden (`drawTrack`). **Fehlt:** Gruppierung (Geber, Ort, Fraktion), Fristen als Balken, abgeschlossene Aufträge ohne Geschichte („Echo“ nicht nachlesbar).
**Ideen:** (1) **Pergament-Auftragsbuch (S–M):** Reiter Offen / Verträge / Erledigt; je Auftrag Porträt des Gebers, Fristbalken, Entfernung, Knopf „Auf der Karte“. (2) **Folgen-Zeile (S):** `v.outcome` + Echo-Ereignisse als kursive Nachzeile — macht die Wendungen sichtbar. (3) **Fraktionsreiter zeigt Rangquests als Pfad (S):** `rankGuide` gibt es; nur verknüpfen.

## 5. Karte und Atlas

**FACT:** gemalte Karte mit Nebel (`atlas.js`), zwei Zoomstufen, Legende 11 Zeichen (Stadt, Gewölbe, Ruine, Wildnis, Auftrag, Karawane, Lehrer, Valen, Untote, Heer, Du), Kriegskarte im Fraktionsfenster. **Fehlt:** Interaktion — kein Klick auf einen Ort (Info, Preise, Ruf), keine eigenen Markierungen, keine Reiseplanung, keine Heere-Pfeile.
**Ideen:** (1) **Ortskarte beim Klick (S):** Name, Herr, Lage, Einwohner, bekannte Preise, offene Aufträge — alles vorhanden in `renderContext`-Logik. (2) **Eigene Nadeln (S):** `S.pins` mit Text; Nachfolger erbt sie. (3) **Frontlinien (M):** `S.war`-Fronten als Linien, Heerzüge mit Richtungspfeil; Kette Karte → Weltereignis → Entscheidung, wohin man reist.

## 6. Gefährten und Gruppe

**FACT:** Loyalität, Feuergespräche, persönlicher Auftrag, Freund fürs Leben, Verrat (§5e.1); fünf Gruppenbefehle; „Ausrüstung geben“ wählt das stärkste Stück ohne Klassenprüfung (IST §2.11, B-07). **Fehlt:** Formation/Rollen, Ausrüstung je Gefährte als Papierpuppe, Befehle je Figur, Tätigkeit im Lager.
**Ideen:** (1) **Gefährten-Papierpuppe (M):** Charakterfenster für Gefährten mit Ziehen aus dem eigenen Gepäck; Klassenprüfung dabei. (2) **Rollen statt Befehle (M):** Vorkämpfer / Schütze / Heiler / Träger als Karte je Figur; KI (`partyAI`) liest die Rolle. (3) **Lagerdienst (S):** Gefährte bleibt im Lager als Wache/Schmied → zählt als Verteidiger bei Überfällen, übt Fertigkeit.

## 7. Bionik und Prothesen

**FACT:** Stufen, Module, Roboterauge, Wartung, Händler/Kybernetiker/Medica/Schwarzmarkt, Rangsperren (MECHANIKEN Paket 1–5); Darstellung: Gesprächsmenüs (`mechMenu`, `blackMarket`), Bionik-Block im Charakterbogen mit Messingumrandung. **Tiefe:** mechanisch gut, sozial dünn: nur Aurelion-Rang; Orden, Dorfbewohner und Gefährten reagieren nicht (ASSUMPTION: kein grep-Treffer für Reaktion auf `bionicParts` außerhalb von Aurelion).
**Ideen:** (1) **Chirurgentisch als Tafel (M):** Körperbild groß, Klick auf Glied → Karten der verfügbaren Prothesen mit Vor/Nachteil, Preis, Zustand; ersetzt drei Gesprächsmenüs. (2) **Blicke (S):** Bewohner-Sätze je sichtbarer Prothesenzahl („Messing-Mann“), Orden: Verdacht, Kinder: Neugier; Kette Bionik → Ruf → Preise. (3) **Wartungs-Erinnerung visuell (S):** Zahnrad-Zeichen am Porträt färbt sich mit Zustand.

## 8. Kodex, Chronik, Erbe

**FACT:** Kodex mit 6 Reitern, Handbuch aus `docs/GUIDE.md`, gesperrte Kapitel; Chronik mit Zeitleiste und Spielstand-Info; Erbenwahl als Karten. **Fehlt:** Bilder (Gegner im Kodex ohne Sprite, obwohl `monsterSpec` existiert), Chronik ohne Ort auf der Karte, Erbe ohne Stammbaum.
**Ideen:** (1) **Bestiarium mit Sprite (S):** `drawFigureTo` im Gegner-Reiter, Trefferzonen, Beute. (2) **Chronik → Karte (S):** Ereignis anklicken zeigt den Ort. (3) **Stammbaum (M):** `S.legacy.ancestors` als Baum mit Porträts, Todesursache, Erbstücken.

## 9. Fraktionsfenster

**FACT:** Banner, Ansehen, Rangtabelle, Kriegskarte, Beziehungen (ui.js:918-942) — gut strukturiert. **Fehlt:** Gesichter (Anführer-Porträts), Ressourcen je Macht (T23 bringt sie), Zeitstrahl der Kriegsereignisse.
**Ideen:** (1) **Anführerkarte (S):** Porträt + Haltung zu dir + „Wo?“. (2) **T23-Ressource als Balken (S, nach T23).** (3) **Kriegschronik (S):** letzte 5 Frontereignisse aus `S.war` als Zeilen.

---

## Weitere Ideen, priorisiert (max. 10)

| # | Idee | Nutzen | Aufwand | Hängt an |
|---|---|---|---|---|
| 1 | Baukarten + Grundriss-Geist (Dock „Bau“) | Entwicklerwunsch, Bausystem wird lesbar | S–M | UI-Scheibe 2 |
| 2 | Siedlung als Marktknoten | erste echte Kette Siedlung ↔ Wirtschaft | M | economy.js |
| 3 | Landrecht (Tribut oder Schutz) | Siedlung ↔ Fraktion ↔ Krieg | M | S.war, T23 |
| 4 | Handelsdock mit Kategorien, Mengen, Preispfeilen | Wirtschaftstiefe sichtbar | S | UI-Scheibe 3 |
| 5 | Siedler mit Beruf, Bedürfnis, Tätigkeit | Siedlung lebt; Reiter „Siedler“ | M | 1 |
| 6 | Chirurgentisch als Körpertafel | drei Gesprächsmenüs → eine Tafel | M | body.js |
| 7 | Zerlegen an der Werkbank | Materialkreislauf, Beute sinnvoll | S | RECIPES |
| 8 | Ortskarte und eigene Nadeln auf der Weltkarte | Karte wird Werkzeug | S | atlas.js |
| 9 | Gefährten-Papierpuppe mit Klassenprüfung | behebt B-07 sichtbar | M | invUI |
| 10 | Bestiarium mit Sprite, Stammbaum des Hauses | Kodex/Erbe erzählen in Bildern | S / M | fig5.js |

**Nicht empfohlen (Bloat-Gefahr):** eigenes Städtebau-Großsystem mit Dutzenden Bauten vor den Ketten 2/3; Romanzen (Entwickler: keine); Minispiel-Schmieden.
