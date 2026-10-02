# Analyse: Skilltree (Priorität 8)

## Bestand (belegt per grep)

- **Daten:** `data.js` `SKILL_TREE` (49 Knoten), `SKILL_BRANCHES` (8 Zweige: combat, magic, survival + 5 Titelzweige).
- **Logik:** `game.js` `nodeState(c,k)` (Zustände `learned/open/locked/sealed/barred`), `learnNode(k)`, `branchOpen(c,b)`, `treeFx(c)`.
- **UI:** `ui.js` `skillUI(body)` — baut je Zweig eine Spalte (`tree-branch`) mit Zeilen (`tree-row`) aus reinen `<button class="tree-node …">`-Elementen. Klick ruft `A.learnNode(k)`.
- **Darstellung heute (Fakten aus dem Code, nicht interpretiert):**
  - Keine gezeichneten Linien/Verbindungen zwischen Knoten. „Braucht: …“ steht nur im `title`-Tooltip (nativer Browser-Tooltip, Text).
  - Keine Vorschau der Werte (nur `desc`/`designIntent` als Text im Tooltip).
  - Kein Hover-Effekt außer CSS-`:hover` (nicht vorhanden) und nativer Tooltip-Verzögerung.
  - Freischalten = sofortige Klassenänderung, kein `treeFx`/Partikel/Sound; nur `log(...)` und `UI.toast` falls Fähigkeit gewährt.
  - Zustände nur über Textlabel (`gelernt/lernen/offen/versiegelt/ausgeschlossen/gesperrt`) und vier Randfarben in CSS (`style.css` `.tree-node.*`).
  - Schlüsselknoten (`keystone`) nur über Goldrand, keine besondere Geste.
  - Layout ist CSS-Grid (`tree-wrap`, 3 Spalten), keine freie räumliche Anordnung — ein Baum „sieht nicht aus wie ein Baum“, sondern wie eine Tabelle aus Knöpfen.

## Problem

Der Talentbaum ist technisch vollständig (49 Knoten, Abhängigkeiten, Ausschlüsse, Titelzweige), aber die Präsentation ist eine reine Button-Liste mit Text-Tooltip. Kein Spieler „sieht“ einen Baum, keine Verbindungen, keine Freischalt-Wirkung, keine Vorschau vor dem Ausgeben eines Punktes.

## Inspiration (nur UX, nichts kopieren)

Path of Exile (riesiges Liniennetz, Zoom/Pan, Glühen entlang gelernter Pfade), Diablo-Reihe (radiale Kreise, Ringe je Rang), Guild Wars 2 (einfache Liniendiagramme mit Icons statt Text), Darkest Dungeon (vertikale Äste je Klasse, sehr karg aber klar), klassische JRPGs (Sphärobrett, Tafel mit Knoten).

## 10 Varianten

1. **Canvas-Baum mit echten Linien:** Knoten als Punkte auf fixen Koordinaten (Zweig = Spalte, `row` = Zeile wie heute), Verbindungen als gezeichnete Linien (SVG/Canvas), Linie leuchtet, wenn gelernt.
2. **Radialer Kreis je Zweig:** Zweige als Ringe um ein Zentrum (wie Diablo), Schlüsselknoten am äußeren Rand.
3. **Vertikaler Ast je Zweig (Darkest-Dungeon-artig):** schmale Spalte mit klarer Linie nach oben, wenig Schmuck, sehr lesbar auf Deutsch (passt zum kargen Grimdark-Ton).
4. **Icon statt Text im Knoten:** jeder Knoten bekommt ein kleines Pixel-Icon (Symbol der Wirkung, z. B. Schild für Eiserne Haut) statt/zusätzlich zum Namen; Name nur im Tooltip.
5. **Hover-Vorschaukarte:** eigenes kleines Panel neben der Maus zeigt Wirkung, Voraussetzung, Preis als strukturierte Zeilen (wie Item-Tooltip), kein Browser-`title`.
6. **Freischalt-Animation:** kurzer Lichtimpuls am Knoten plus Partikel entlang der Verbindungslinie zum nächsten offenen Knoten (nutzt das vorhandene `fx`-System aus `useAbility`/`cinematic`), plus Ton.
7. **Figuren-Spiegel:** eine kleine Silhouette der eigenen Figur am Rand, die bei bestimmten Knoten sichtbar reagiert (z. B. Rüstung heller bei „Eiserne Haut“) — nutzt vorhandene Sprite-Pipeline (`SP.humanSpec`).
8. **Zustands-Glyphen statt Text-Label:** Schloss-Symbol = gesperrt, Siegel-Symbol = versiegelt, Kreuz = ausgeschlossen, Haken = gelernt — Text bleibt nur im Tooltip.
9. **Pfad-Hervorhebung bei Hover:** Hover über einen gesperrten Knoten zeichnet den kürzesten fehlenden Pfad bis dorthin nachträglich ein (zeigt, was noch fehlt).
10. **Kombinierte Baumkarte mit Klassenkronen:** Titelzweige bekommen ein eigenes kleines Wappen/Symbol der Titelklasse über der Spalte statt nur Text „Versiegelt — öffnet sich mit …“.

## Bewertung gegen ROTFALL

- Canvas/DOM-Mischung ist möglich: `skillUI` liegt in einem Modal (DOM), ein `<canvas>` für Linien unter den vorhandenen Buttons ist technisch am billigsten (keine Buttons ersetzen, nur Linien dahinter zeichnen) und bleibt performant (statisches Bild, nur bei Öffnen/Lernen neu gezeichnet, keine 3-ms-Sorge pro Frame, da Modal nicht Teil der Spielschleife ist).
- Radialer Kreis (2) und Icon-only-Minimalismus (PoE-Vollbaum, 1 in Reinform) widersprechen der kargen, lesbaren Linie des Spiels und dem Datenmodell (`branch`+`row`, nicht x/y) — zu teuer für den Nutzen.
- Variante 7 (Figuren-Spiegel) ist hübsch, aber eine neue Systemlast ohne vorhandene Infrastruktur (keine Kopplung Talente→Sprite-Look in `SPEC_KEYS`) — eigenes Feature, nicht Teil dieses Umbaus.
- Variante 6 (Freischalt-Animation) ist mit Bordmitteln machbar: Es existiert bereits ein generisches `fx`-Partikelsystem und `S.floats`/`UI.toast`; `learnNode` kann einen `fx(...)`-Aufruf ergänzen.

## Wahl / Kombination

**Variante 3 (vertikale Äste) als Grundform**, weil sie am nächsten am bestehenden `branch`/`row`-Datenmodell liegt und am wenigsten Breaking Change ist, **kombiniert mit 1** (echte Linien statt Flex-Reihen, damit „Verbindungen“ sichtbar werden), **5** (strukturierte Hover-Vorschaukarte statt Browser-Tooltip) und **6** (kleine Freischalt-Animation über das vorhandene `fx`-System). Icons (4) und Glyphen (8) werden vertagt, weil sie neue Icon-Assets brauchen und laut VISUAL.md nichts gekauft/mit Fremdwerkzeug erzeugt werden darf — eigene Pixel-Symbole sind ein eigenes Teilprojekt.

## FEATURE IMPACT REPORT (GATE.md §8)

**Feature:** Skilltree visuell von Text-Buttons zu Baum mit Linien, Vorschau-Hover und Freischalt-Feedback.

**Betroffene Systeme:**
- `ui.js` `skillUI` (Aufbau des DOM), `openModal('talente')`/`refreshModal`.
- `game.js` `nodeState`, `learnNode`, `treeFx`, `SKILL_BRANCHES`/`SKILL_TREE` (Datenquelle, nicht ändern).
- `style.css` `.tree-*`-Klassen.
- Evtl. `render.js`/`fx(...)`, falls die Freischalt-Animation das vorhandene Partikelsystem nutzt (das läuft aktuell nur auf dem Spiel-Canvas, nicht im Modal-DOM — Klärung nötig, siehe unten).

**Bereits vorhanden:**
- Vollständiges Datenmodell (Zweige, Reihen, Abhängigkeiten, Ausschlüsse, `designIntent`).
- Zustandsmaschine `nodeState` mit allen fünf Zuständen.
- Tooltip-Text (muss nur umgezogen werden, nicht neu erfunden).

**Fehlende Infrastruktur:**
- Keine x/y-Koordinaten je Knoten — nur `branch`+`row`; eine Baumzeichnung mit Linien braucht zusätzlich eine Spaltenposition *innerhalb* der Reihe, um Linien zwischen Mehrfach-Voraussetzungen (`requires` mit „oder“) eindeutig zu ziehen.
- Kein DOM-Overlay-Partikelsystem; das vorhandene `fx(...)` zeichnet auf den Spiel-Canvas, nicht ins Modal. Für eine Freischalt-Animation im Skilltree-Modal braucht es entweder ein eigenes kleines Canvas im Modal oder eine CSS-Animation (leichter, aber kein Partikel-„Glühen“ wie im Kampf).

**OFFENE DESIGNENTSCHEIDUNGEN:**
1. Soll die Freischalt-Animation ein echtes Partikel-Canvas im Modal sein, oder reicht eine CSS-Übergangsanimation (leichter, aber weniger „wirkungsvoll“)?
2. Bei Knoten mit mehreren alternativen Voraussetzungen (`requires` = „oder“): Werden alle möglichen Linien gleichzeitig gezeichnet, oder nur die zum tatsächlich gelernten Vorknoten (ändert sich je nach Spielstand)?
3. Bekommt die Hover-Vorschaukarte ein festes Format wie die Item-Tooltips (falls es dafür schon eine Vorlage aus dem Prioritätsbereich „Items“ gibt), oder ein eigenes — das sollte mit dem Items-Tooltip-Umbau (Priorität 5) abgestimmt sein, sonst entstehen zwei Tooltip-Stile im selben Spiel.
4. Bleiben die Titelzweige weiterhin als eigene Reihe unten (wie heute), oder bekommen sie ein eigenes visuelles „Siegel“, das erst mit der Titelklasse aufbricht (Variante 10) — das ist ein Umfang, der über reines Linienzeichnen hinausgeht und eigens freigegeben werden sollte.
5. Icons je Knoten (Variante 4/8) sind ausdrücklich zurückgestellt — offen ist, ob sie später mit eigenen Pixel-Symbolen (im Code gezeichnet, keine Fremdwerkzeuge) nachgezogen werden sollen.

**Risiken:**
- Ein Canvas-Linienbild hinter den bestehenden Buttons muss bei jeder Modal-Größenänderung (`refreshModal`, Fenstergröße) neu berechnet werden, sonst verschieben sich Linien gegen Buttons.
- Mehr visuelle Elemente im selben Modal können bei kleinen Bildschirmen (mobile) die Lesbarkeit verschlechtern — es gibt schon eine `@media (max-width:700px)`-Regel, die beachtet werden muss.

**Implementierungsplan (in Scheiben):**
1. Scheibe 1: Linien zwischen Knoten zeichnen (Canvas-Overlay, read-only, keine Logikänderung).
2. Scheibe 2: Hover-Vorschaukarte statt Browser-Tooltip (reine Präsentation, gleiche Textquelle).
3. Scheibe 3: Freischalt-Feedback (abhängig von Designentscheidung 1).
4. Scheibe 4 (vertagt, offene Entscheidung 4): Titelzweig-Siegel-Optik.
