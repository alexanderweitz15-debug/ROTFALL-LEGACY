# Analyse: Karte (Priorität 9)

## Bestand (belegt per grep)

- **Weltkarte als gemaltes Bild:** `atlas.js` `drawAtlas(cv, zoom, extra)` — zeichnet eine gemalte Pergamentkarte: Regionsgrenzen als Linien (`bloc`-Funktion, Farbe je Großregion), Gipfel/Wälder im Raster (`peak`, `tree`), Orte als gezeichnete Symbole je `kind` (`castle`, `hamlet`, `ruin`, Zelt für Lager, Turm, Mine, Wrack, Schrein — alles per Canvas-Pfad, keine Icons), Nebel des Unentdeckten (`fog`-Bitmap, weiche Kante), Kompassrose, Maßstabsbalken, Rahmen. Das ist bereits sehr weit weg von reinem Text.
- **Fraktionsfarben:** `FACCOL` (aurel/chain/goblin/undead/valen/order/merch/bandit) färbt Orte und Grenzlinien.
- **Weltkarten-Overlay (Aufträge/Heere/Spieler):** `game.js` `drawWorldmap(cv, zoom)` — zeichnet über `drawAtlas` zusätzlich: Auftragsziele (Raute + Name, `questPoint`), Kriegsknoten-Besitzringe, Heeresflaggen mit Stärke, Karawanen (kleines Quadrat), Lehrer-NPCs (Kreis+Name), eigene Siedlung, Spielerpunkt, eine Legende unten links.
- **Ortskarte per Klick (Scout #5, 01.10.):** `game.js` `mapPick(px,py)` — findet den nächsten erkundeten Ort und liefert ein Textpanel (Art, Herr, Zustand, Gefahr, Preise, eigene Aufträge). **Reiner Text-Rückgabewert**, in `ui.js` als `title/html` in ein Panel gesetzt.
- **Kriegskarte:** `drawWarmap(cv)` — eigenes, einfaches Diagramm (Knoten als Kreise, Kanten als Linien, Heeresflaggen), getrennt von der gemalten Weltkarte, im Kartenfenster.
- **Minikarte:** `drawAtlas` wird auch für die Minikarte verwendet (`S.settings.minimap`, Taste N). Debug-Modus zeigt zusätzlich `debugMarks` (alle Gegner/NPCs/Karawanen/Verträge/Spieler als Punkte, nur im Debug).
- **Was fehlt sichtbar (Fakt, nicht Meinung):** NPCs, Karawanen und Fraktionspräsenz sind **nur im Debug-Modus** (`S.dbg.reveal`) als Punkte sichtbar; im Normalspiel zeigt die Weltkarte nur Auftragsziele, Heere (Kriegsgraph), die eigene Karawane-Flotte-Markierung und Lehrer — keine laufenden Weltereignisse (`S.big`), keine normalen NPCs, keine Unbekannt-Markierung für Gerüchte/unentdeckte Questhinweise.

## Problem

Die Weltkarte ist grafisch bereits stark (gemalte Karte, keine reine Symbolliste) — das eigentliche Text-Problem liegt eher bei der Ortskarte (`mapPick`): ein reines HTML-Textpanel ohne Bild. Zusätzlich fehlt eine einheitliche visuelle Sprache für „was gerade in der Welt passiert“ (Weltereignisse, Karawanen, Fraktionspräsenz) außerhalb des Debug-Modus — der Spieler erfährt das heute nur über Log/Toast/Chronik (Text), nicht auf der Karte selbst.

## Inspiration (nur UX, nichts kopieren)

Mount & Blade (Kampagnenkarte mit beweglichen Parteien, Lagerfeuer-Symbolen, Fraktionsfarben), Guild Wars 2 (Weltkarte mit Event-Symbolen, die aufleuchten, wenn ein Ereignis aktiv ist), Diablo/klassische Fantasy-Pergamentkarten (handgemalter Stil, exakt wie ROTFALL es schon macht), Kenshi (keine echte Weltkarte, aber klare Fraktionsgebiete), RimWorld (Weltkarte mit Siedlungssymbolen und Ereignis-Pins).

## 10 Varianten

1. **Ortskarte als Bild-Panel statt Textliste:** `mapPick`-Panel bekommt oben ein kleines gezeichnetes Icon des Ortstyps (castle/hamlet/ruin — Funktionen existieren schon in `atlas.js`, nur fürs Haupt-Canvas, nicht fürs Panel) plus Fraktionsbanner-Farbe als Rahmen, Text bleibt darunter.
2. **Lebende Pins für Weltereignisse (`S.big`):** Ein kleines pulsierendes Symbol am Ort eines laufenden `BIG`-Events (Seuche, Turnier, Streik …) auf `drawWorldmap`, das beim Klick zur `mapPick`-Information führt.
3. **Karawanen immer sichtbar (nicht nur bekannte Flotte):** kleine Wagen-Symbole entlang bekannter Handelsrouten, sobald eine Karawane in Sichtweite war (nutzt vorhandene `S.ents.world`-Karawanen, aber dauerhaft statt nur Live-Position).
4. **Fraktionspräsenz als Flächenfärbung statt nur Grenzlinie:** sanfte Einfärbung ganzer Gebiete statt nur Linie an der Grenze (stärkerer erster Eindruck „wem gehört das hier“).
5. **Gerüchte/Unbekanntes als Fragezeichen-Pin:** Orte, von denen der Spieler nur gehört, aber sie nicht besucht hat, bekommen ein eigenes Symbol (heute: entweder ganz unsichtbar im Nebel oder voll aufgedeckt — kein Mittelzustand).
6. **Zoom-Stufen mit unterschiedlicher Dichte (ist teils schon da über `zoom<2`-Filter für POIs):** konsequent ausbauen, sodass die Übersichtskarte ruhig bleibt und erst beim Heranzoomen Details (Wachen, Stände, kleine Lager) erscheinen.
7. **Mini-Wegpunkt-Linie zum aktiven Auftrag:** eine gezeichnete, gestrichelte Route von der Spielerposition zum nächsten Auftragsziel (nicht nur ein Symbol am Ziel).
8. **Eigene Heeres-Symbolik nach Fraktion statt nur Farbe:** unterschiedliche Silhouetten für Totenheer/Valen-Heer (heute: gleiche Flagge, nur Füllfarbe unterscheidet).
9. **Zeitleiste am Kartenrand:** kleine Markierung „nächstes großes Ereignis in n Tagen“ — widerspricht aber dem Grundsatz „kein Text, wo es Spielgefühl kaputt macht“ bzw. wäre reine Meta-Information; nur als Notlösung.
10. **Kompass-Mitreise-Pfeil bei Eskorten:** eigenes Symbol für begleitete NPCs/Eskort-Ziele auf der Karte statt nur der generischen Auftragsraute.

## Bewertung gegen ROTFALL

- Variante 4 (Flächenfärbung) würde die sorgfältig gemalte Optik von `drawAtlas` (Gras-, Wald-, Gipfeltexturen) stark überdecken und wirkt leicht wie eine moderne Strategiekarte statt Pergament — Risiko für den „dunklen, detaillierten“ Stil. Nur leicht/transparent vertretbar.
- Variante 9 ist reine Text-/Zahlen-Information und widerspricht dem Leitgedanken von VISUAL.md („Wie kann der Spieler das spüren, ohne Text zu lesen“) — nicht empfohlen.
- Variante 3 (Karawanen dauerhaft) würde Information zeigen, die der Spieler laut Weltlogik nicht haben kann (Karawanen bewegen sich, ihre letzte gesehene Position veraltet) — hier fehlt eine Designentscheidung (wie alt darf die Information sein, bevor sie verblasst), siehe unten.
- Variante 1 (Ortskarte als Bild-Panel) ist am billigsten: `atlas.js` hat `castle/hamlet/ruin` bereits als Zeichenfunktionen, sie müssen nur auch auf ein kleines Panel-Canvas im Modal zeichnen können, keine neue Infrastruktur.
- Variante 2 (lebende Event-Pins) passt direkt zur Priorität 11 (Welt-Ereignisse) dieses Auftrags und sollte mit der dortigen Analyse abgestimmt werden, nicht doppelt gebaut.

## Wahl / Kombination

**Variante 1** (Ortskarte bekommt ein gezeichnetes Icon statt nur Text) ist die direkteste Umsetzung des Leitgedankens und am günstigsten umzusetzen. Dazu **Variante 2** (Event-Pins), weil Weltereignisse heute auf der Karte komplett unsichtbar sind, und eine **vorsichtige, transparente Form von Variante 4** (nur an der Grenze etwas breiter/weicher statt harter Linie, kein Vollflächen-Einfärben) zur Stärkung der Fraktionspräsenz. Die übrigen Varianten werden als spätere, kleinere Ausbaustufen vorgemerkt.

## FEATURE IMPACT REPORT (GATE.md §8)

**Feature:** Ortskarte mit Bild statt reinem Text; Weltereignis-Pins auf der Weltkarte; weichere, deutlichere Fraktionsgrenzen.

**Betroffene Systeme:**
- `atlas.js` (`drawAtlas`, `castle/hamlet/ruin`-Zeichenfunktionen, Fraktionsfarben `FACCOL`).
- `game.js` `mapPick`, `drawWorldmap`, `S.big` (Weltereignisse, siehe `welt.md`), `ui.js` (Panel-Aufbau für die Ortskarte, Klick-Handler in `ui.js` Zeile ~1096).
- Kriegsgraph/-knoten (`SIM.warGraph`, `S.war.nodes`) für Fraktionspräsenz.

**Bereits vorhanden:**
- Zeichenfunktionen für alle Ortstypen (nur fürs Haupt-Canvas gedacht, lassen sich auf ein zweites kleines Canvas im Modal umleiten, da sie nur einen 2D-Context plus Koordinaten brauchen).
- Vollständige Ortsdaten (`LOCATIONS`, `TOWN_PLAN`, `S.war.nodes`, `S.priceSeen`) für den Panel-Inhalt.
- `S.big` mit Ort (`town`/`x,y`) für jedes laufende Großereignis.

**Fehlende Infrastruktur:**
- Kein zweites, kleines Canvas-Element im `mapPick`-Panel (aktuell reines `innerHTML`-Textpanel in `ui.js`).
- Kein „Alter“-Attribut für zuletzt gesehene Karawanenposition (nötig nur, falls Variante 3 später folgt — hier nicht Teil der Wahl).
- Keine Pin-Darstellung für `S.big` auf `drawWorldmap` (`S.big` wird dort aktuell gar nicht gelesen).

**OFFENE DESIGNENTSCHEIDUNGEN:**
1. Soll das Icon im Ortskarte-Panel exakt die Symbolik der Weltkarte wiederholen (Wiedererkennung) oder eine größere, detailliertere Variante bekommen (mehr Wirkung, aber doppelte Pflege bei Änderungen)?
2. Sollen Weltereignis-Pins nur erscheinen, wenn der Spieler das Ereignis schon per Ankündigung (`bigAnnounce`) gehört hat, oder unabhängig davon (Frage der Weltkonsistenz: Der Spieler „weiß“ laut Chronik bereits davon, sobald es beginnt — vermutlich immer sichtbar, aber nicht ausdrücklich festgelegt)?
3. Wie weich/breit darf die Fraktionsgrenze werden, ohne dass sie wie eine moderne Territoriums-Füllung aussieht statt wie eine gemalte Karte — das ist eine Stilfrage, die der Entwickler anhand eines Bildbeispiels entscheiden sollte, nicht der Agent.
4. Betrifft eine Pin-Markierung auch Ereignisse außerhalb bekannter/bereister Orte (z. B. Luftschiffabsturz in der Wildnis) — erscheint der Pin dann trotz Nebel des Unentdeckten, oder bleibt er im Nebel verborgen wie der Ort selbst? Aktuell unklar, da `S.big`-Orte keinen `seen`-Status prüfen.

**Risiken:**
- Ein zusätzliches Canvas im Modal kostet zwar wenig Rechenzeit (kein Teil der Spielschleife), muss aber bei jedem `refreshModal` neu gezeichnet werden — sollte nicht bei jedem Tastendruck im Dialog unnötig neu rendern.
- Pins für Weltereignisse dürfen die ohnehin schon mit Symbolen gefüllte Weltkarte (Städte, Lehrer, Heere, Karawanen, Auftragsziele) nicht überladen — VISUAL.md fordert für die Karte ausdrücklich „informativ, nicht überladen“.

**Implementierungsplan (in Scheiben):**
1. Scheibe 1: Bild-Panel für die Ortskarte (`mapPick`/`ui.js`), reine Präsentation, keine Logikänderung.
2. Scheibe 2: Event-Pins auf `drawWorldmap` für aktive `S.big`-Ereignisse (abhängig von Designentscheidung 2 und 4).
3. Scheibe 3 (klein, vorsichtig): weichere Fraktionsgrenzlinie (abhängig von Designentscheidung 3, am besten mit einem Vorher/Nachher-Bild entschieden).
