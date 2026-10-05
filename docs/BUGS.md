# Bugs — offen

Nur offene Einträge, nach Priorität. Behobene: je eine Zeile in `archive/BUGS_behoben.md`, volle Texte bis S13 in
`archive/BUGS_bis_S13.md`. Neuer Eintrag: ID · Titel · Schritte · Erwartet/Tatsächlich · Ursache · Lösung · Test · Status.
Nächste freie ID: **BUG-145**.

## HIGH

### BUG-108 — Leistung in Städten über Budget
- Messung S13 (Audit P-03, versteckter Tab): Zeichnen 6–9 ms (Budget 2), Spiellogik 8–12 ms (Budget 3) in Eren,
  Kreuzweg, Aurelheim. `think` 7 ms: nahe Figuren bis 0,4 ms je Stück, 876 ferne zusammen 2,5 ms; Wegsuche der
  Reisenden 1,5 ms, Karawane 1,2 ms.
- Ursache offen. Kandidaten: Suche über alle Einträge je Figur (`S.ents.world.filter` in Tick-Funktionen), `separate`,
  Tagesplan fern vom Spieler.
- Nächster Schritt: im sichtbaren Fenster je System messen; ferne Bewohner (> 520 px) ganz abstrakt; räumliches Raster.
- Stand: Nutzer wollte in S13 „nicht weiter suchen“. Zeichenteil wird in S14 mit den neuen Figuren (Cache) gemessen.
- S15-Messung (P0, 29.09.): Eren Logik 5,8 ms/Bild, Zeichnen 2,5–3,5 ms warm mit Stil R (erste Bilder bis 12 ms, bis der Figuren-Cache voll ist).
- S15 P13 (Durchlauf, neues Spiel): warm Eren 3,0 ms Bild / 2,7 ms Logik, Aurelheim 2,6 / 1,6, Totenland 1,1 / 1,4. Spielstand eines
  neuen Spiels 1,87 MB (Budget überschritten, siehe BUG-142).

## MEDIUM

### BUG-142 — Kalter Aufbau beim ersten Betreten eines Ortes
- S15 P13: Nach einem Teleport oder dem ersten Betreten brauchen die ersten fünf Bilder im Schnitt 25–53 ms (Eren 53, Weidenau
  25, Totenland 20), danach 1–3 ms. Ursache: Boden-Chunks und Figurenbilder werden erst beim Zeichnen gebacken.
- Vorschlag: beim Kartenwechsel die Chunks im Umkreis vorbacken (`prefetchChunk` gibt es) und Figuren der Nähe vorwärmen.


### BUG-093 — Zeichnen im vollen Stadtfest über 2,0 ms
- S10: Figurenbilder ×24 schneller (CPU-Pipeline, Vorbacken). Rest: Median Stadtkern 1,9–2,1 ms, Fest 2,1 ms.
- Ziel S14 (Teil B): alle Figuren vorgebacken und gecacht, Zeichenzeit ≤ 2,0 ms im vollen Fest.

### BUG-100 — Schwarze Feste praktisch nicht befreibar
- Dort steht das Untotenheer (34) dauerhaft; Befreiung verlangt „kein Heer am Ort“.
- Lösungsvorschlag (Designfrage 1 in `design/mechanik-check.md`): eigene Arena, Heer vorher im Feld schlagen.

## LOW

### BUG-143 — Totenland bei der Schwarzen Feste leer und sehr dunkel
- S15 P13: Im Sammelbild wirkt die Umgebung der Schwarzen Feste fast schwarz und ohne Objekte; dort steht auch ein Goblin
  („Grak! Menschling!“), weil das Spawn-Gebiet Goblin-Krieger im Totenland mischt. Dichte und Mischung prüfen.


### BUG-062 — Beiwagen springt beim Wenden auf die andere Seite
- Nach der Rast beginnt die Spur neu; der Beiwagen steht schlagartig hinter dem Leitwagen (am Tor). Lösung: Wendekreis.

### BUG-111 — Test „Karawane (BUG-096)“ wackelt
- Wache landet 108–138 px vom Platz, Toleranz 120 — zeitabhängig. Zug für den Test anhalten oder Toleranz an die
  Zuggeschwindigkeit koppeln. (Enthält den Rest von BUG-073.)

### Audit S13 — offene Kleinigkeiten (`archive/AUDIT_S13.md`)
- A-02 Morgens laufen viele Bewohner in einer Reihe über den Platz.
- A-03 Bewohner sehen fast gleich aus (Teil B: Silhouetten je Beruf).
- A-04 38 Rohstoffknoten stehen auf Felskacheln, unerreichbar.
- A-05 Drei Flüchtlinge ohne Heimatort und Tagesplan.
- B-07 „Ausrüstung geben“ wählt automatisch das stärkste Stück, ohne Klassenprüfung.
- K-04 Rooks Auftrag „Rivalen“ zählt jeden getöteten Banditen.
- U-02 70 Figuren (Automaten, Kettenwachen) bieten nur „Gehen“ — gewollt?
- V-02 Grabsteine direkt vor der Schenkentür (Grab dort, wo jemand starb).
- P-02 Spielstand 2 MB; 1,5 MB davon Figuren (u. a. Tagesplan, der beim Laden neu entsteht).
- P-04 Selbsttest ~45 s; 30 s davon der Gebäudetest (über 1000 Hausbilder ohne Cache).
