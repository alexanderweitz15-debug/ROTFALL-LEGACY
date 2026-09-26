# Changelog — Rotfall: Legacy

Neueste oben. Je Eintrag: was, warum, welche Bugs. Refactorings nennen den Grund (Master-Prompt §2, Punkte 1–4).

## Session 10 — 2026-09-25 · Stil D (Nutzer-Wahl aus 5 Varianten)
- Figuren, Tiere, Goblin-Hüne und Waffen werden nach dem Malen auf ein gröberes Raster gebracht (`COARSE = 1.5` Welt je
  Pixel, `coarse()` in sprites.js: Nächster-Nachbar + Kontur schließen). Grund: das feine Raster wirkte neben der
  pixeligen Welt fremd („weird“). Waffenarm (`drawArm`) rastet auf dasselbe Raster; Porträt-Ausschnitt skaliert mit.
- Gebäude-Designvorschläge V1–V4 als Vorschau (`docs/design/haus_vorschlaege.js`, `screenshots/haus-vorschlaege.png`):
  Tür ≈ Figurenhöhe — die aktuellen Häuser sind dafür zu niedrig (Tür halb so hoch wie eine Figur).
- Referenz 2 (Nutzer: schlanke Kapuzenfiguren, lange Mäntel, dunkle Werte): `FIG` schlanker/höher, kleinerer Kopf;
  Kleidung in `resolve()` abgedunkelt; Gesichter neu (Schattenhälfte, Brauenschatten, 2-px-Augen über `setOn`, damit sie
  das Vergröbern überstehen; Haar rahmt das Gesicht).
- Bürger: Stände an der Silhouette (`CIVIC` in sprites.js: Kleid/Robe, Rock, Schürze mit eigener Farbe, Haube, Kapuze).
- BUG-090: Vornamen nach Geschlecht des Berufs, Korrektur alter Stände beim Laden (`nameFix`).
- Gebäude (G6): Fassade höher (Tür ≈ Figurenhöhe), Tür breiter, Fenster 6×8, Wände/Giebelfeld dunkler, Traufschatten als
  Verlauf, Feuchte am Sockel. Props (G7) im selben 1,5er-Raster wie Figuren (`PROP_RES = 1 / COARSE`).
- Selbsttest 82/82, Zeichnen 1,6–1,9 ms (Median).
- Boden (G7): Flecken in 2×2-Clustern statt Einzelpixel-Rauschen (`tileTexture`), ruhigere Flächen wie in Referenz 2.
- Bugfixes: BUG-077 (Kämpfer wie Kelan zählen als Spielerseite — ihr Hieb traf als „neutral“ nie), BUG-079 (Pass in die
  Wolfsschlucht, Nebelsteg; neuer Test: jeder Ort zu Fuß erreichbar), BUG-080 (Ansprechen nach Maus/Zielrichtung),
  BUG-084 (Mauspunkt je Frame; Körper folgt dem Ziel, Waffe in Ruhe gesenkt statt als Zeiger), BUG-086 (Rückfrage vor
  „Neue Geschichte“), BUG-091.
- Stadtleben (BUG-082/083, Master-Prompt Priorität 2): Tagesplan mit Blöcken statt Einzelziel, Gespräche mit
  Sprechblasen, Abend in der Schenke drinnen, außer Sicht Versetzen statt Einfrieren. **Refactoring-Grund (§2 Punkt 4):**
  ein einziges Tagesziel je Bewohner machte sichtbaren Tagesablauf unmöglich; die Orte werden jetzt in `spotsOf()`
  gemeinsam für Spawn und Tagesplan berechnet (vorher doppelt im Spawn). Update Eren 3,03 → 1,2 ms.
- Selbsttest 86/86 (neu: Kelan vs. Wolf, Erreichbarkeit, Ansprechen, Tagesplan).
- Nutzerwunsch Versammlungsorte: Schenke, Kapelle, Halle, Söldnerhaus und kleine Häuser wachsen beim Weltaufbau
  (`GROW` in world.js, Tür bleibt auf ihrer Kachel → Spielstände/Schilder passen); große Schenken bekommen Zusatztische.
- Stadtfeste: jede Stadt alle 6 Tage 15–23 Uhr (eigener Versatz), Aufbau aus Feuer/Tafeln/Bänken/Fässern/Stand/Fackeln
  als `transient` (nie gespeichert), Bewohner im Kreis ums Feuer mit Festgesprächen, Festmahl an der Tafel (einmal je
  Fest: Heilung, Vorrat, Moral), Ankündigung am Vortag. Aufbauten nie auf Straße (Karawanen) oder vor Haustüren (BUG-094).
- Gerüchte (BUG-078): Bewohner reden über echte Chronik-Ereignisse der letzten 5 Tage; Karawanen melden Ankunft/Überfall.
- Selbsttest 88/88 (neu: Stadtfest, Gerüchte) — auch während eines laufenden Fests grün.
- Anti-Kiting (BUG-076, §34 Sofort-Priorität 4): Hieb bremst den Spieler (55 %), Rückwärtsgehen im Kampf 70 %;
  Gegner setzen nach ~2 s erfolgloser Verfolgung sichtbar nach (×1,45, „!“ + Staub, klingt ab, sobald sie dran sind).
  Selbsttest 89/89; Karawanen-Test gegen Zufallsüberfall abgeschirmt (BUG-095).
- BUG-089: Laden war ein Tageswechsel (Verbrauch/Hunger doppelt, „Tag 6 bricht an“ um 20 Uhr) → `syncClock()`.
- BUG-087: Namen je Stadt eindeutig (größere Listen, Beinamen als Rückfall, Figuren-Namen gesperrt).
- BUG-096: zurückgebliebene Karawanenwachen holen außer Sicht zu Fuß auf. Selbsttest 92/92.
- BUG-088: Verfolger ohne Weg (Fluss) geben nach ~3 s sichtbar auf („?“) und ziehen ab, statt Zielscheibe zu sein.
- Nachsetzen (BUG-076) nur gegen Spieler und Gefährten — sonst hetzten Wölfe Karawanenwachen zu Tode (im Test beobachtet).
- Selbsttest 93/93.
- BUG-085: Karte mit Umgebungsansicht, kollisionsfreien Namen, Legende und Auftragszielen. Selbsttest 94/94.
- BUG-081: Gefahrenwarnung beim ersten Betreten (§71 Telegraphing), Blutungshinweis. Selbsttest 95/95.
- BUG-093 (Performance): Figurenbilder über CPU-Pipeline statt `fillRect` je Pixel + GPU-Rücklesen (×24 schneller),
  Vorbacken sichtbarer Figuren in Leerlaufzeit (`SP.warm`). Ruckler im Stadtkern praktisch weg.
  **Refactoring-Grund (§2 Punkt 3):** das alte Verfahren machte das Zeichen-Budget in vollen Städten unerreichbar.
- BUG-092: Schenkenplätze im Schachbrett. BUG-098: Gerüchte als ganze Sätze. Selbsttest 96/96.
- Tagesrhythmus Stufe 2 (§41): Marktstände sichtbar offen 7–18 Uhr, sonst Plane; je Stadt ein Jäger mit Bogen (Jagdgrund =
  baumreichste Richtung 40 Kacheln vor dem Ort, zu Fuß erreichbar), bringt nachmittags Felle an den Markt (Stadtvorrat +2);
  Wachschichten: nachts schläft jede zweite Wache im Wachhaus (sonst Halle/Schenke).
- Krieg §74: Angreifer einer Schlacht erscheinen ~20 Kacheln vor dem Ort auf ihrer Herkunftsseite und marschieren ein.
- Einblendungen schweigen im Selbsttest; Geist-Test mit festem Zufall. Selbsttest 100/100 (dreimal hintereinander).
- §81 Befreiungskampf (Sofort-Priorität 5): besetzter Ort = 2–3 Wellen (Schwarze Feste 4), die von einem erreichbaren
  Sammelpunkt vor dem Ort einmarschieren, Pausen mit Ansage, letzte Welle mit neuem Gegner „Hauptmann der Toten“ (eigene
  Rüstung, Beute ohne Quest-Gegenstand). Fortschritt bleibt am Ort; ohne letzte Welle keine Befreiung. Danach: Chronik,
  Einblendung, Titel, 4 Heimkehrer sichtbar, Einwohner +6. Selbsttest 101/101 (viermal hintereinander).
  Screenshot `befreiung-welle.png`.
- BUG-099: Bewohner verstecken sich im besetzten Ort. Selbsttest 102/102 (dreimal).
- Messung (frisch geladen, Eren 10 Uhr, 9128 Objekte): Update 2,7 ms (Budget 3,0), Zeichnen 2,1 ms (Budget 2,0).
- §79 Beziehungen: jeder Bewohner hat einen Freund, jeder Vierte einen Rivalen (gegenseitig) in seiner Stadt. Rivalen reden
  nicht miteinander und weichen einander aus (< 70 px); steht der Rivale in Hörweite, wird über ihn gelästert; Freunde
  reden wärmer. Selbsttest 103/103.
- §28 Gegner-Ausdauer: Maximum 120 % des Spielers, Hieb 26, Sprung 30, Erholung 14/s (Elite/Boss 20/s). Leer: 1,1 s
  „erschöpft“ (Boss 0,7 s) — wankt, Ansage bricht ab, offene Deckung. Nur Angreifen kostet; Warten zermürbt nicht.
  Bandit im Dauerkampf: etwa alle 7–8 s eine Öffnung. Selbsttest 104/104 (dreimal).
- Phase 20 Licht: Lichtliste nicht mehr bei jeder Änderung der Objektzahl neu (alle ~9000 Objekte), sondern bei Karten-/
  Bauwechsel oder alle 3 s; Lichtkegel als vorgebackene Stempel statt createRadialGradient je Lampe; Dunkel-Ebene in halber
  Auflösung. Messung (versteckter Tab, pessimistisch): Median Eren 10 Uhr 1,9–2,1 ms, Wald 1,8 ms; Rest-Kosten liegen im
  Einblenden der Dunkel-Ebene (0,5–0,7 ms, im sichtbaren Browser GPU-seitig). Screenshot `licht-nacht.png`.
- Phase 11: Ruf je Gegnerart beim Entdecken (Knurren, Klappern, Stöhnen, Kreischen, Ruf — prozedural in sfx.js);
  vollständige Gegner-Datenblätter im GDD (§33/§34/§72). Selbsttest 105/105 (viermal).
- Phase 12 / §73 regionaler Boss: „Graumähne, Leitwolf der Schlucht“ (170 LP, Stufe 9) in der Wolfsschlucht; unter 50 %
  heult er zwei Wölfe herbei. Tod: Rudel zerfällt (Westen −30 % Gegner, 60 % der Wölfe werden verwilderte Hunde —
  Machtvakuum), Eren +8 Felle, Valen +3, Chronik/Gerücht. Alte Stände bekommen ihn beim Laden. Boss-Chronik nennt jetzt
  den echten Ort (vorher immer „Verlassene Grube“).
- Test-Stabilität: Proben mit echten Updates frieren den Krieg ein (`S._frozenWar`) — vorher fiel während der Tests Eren;
  Befreiungs- und Fest-Probe blenden echten Kriegsstand aus; Karawanenwache rennt außer Sicht (2,6 px), wenn weit zurück.
  Selbsttest 106/106 (fünfmal hintereinander).
- §82 Balancing Teil 1: Mess-Werkzeug `RF.duel`, Standfestigkeit (kein Dauerlähmen), Ausfallschritt der Gegner,
  Nachsetzen mit Mindesttempo, Gegner-Grundwerte `BAL` (Leben ×1,7, Schaden ×1,4). Vorher/Nachher-Tabelle im GDD.
  Duell isoliert Geschosse/Auferstehungen; Karawanenwache rennt auch in Sicht, wenn weit zurück. Selbsttest 107/107 (viermal).
- §82 Balancing Teil 2:
  - Bosse: Gorak stürmt schon in Phase 1 an, wer > 2,5 s Abstand hält; Phase 3 (< 25 %) Doppel-Sturm und schnelleres
    Beben. Hrodvar wirft auf Abstand eine Eislanze (600 ms Ansage, eigenes Geschoss-Bild); Phase 3 größerer Eiskreis
    (Ansage-Ring passt zur Trefferfläche). Rückwärtslaufen gegen beide: vorher 0–11 % Verlust, jetzt tödlich (Bot ohne Rolle).
  - Neuer Gegner Speerträger (hält Speerlänge, stößt Anrennende zurück) — Banditenlager, Alte Straße, Rote Wüste.
  - Neue Waffe Streitflegel (Schwung bis ×3, ab Stufe 2 rundum; Treffer gegen den Träger löscht ihn) — Schmied Nordfurt,
    Beute des Hauptmanns der Toten.
  Selbsttest 110/110.
- §71 Gefahrenregionen: Gegner aus Gefahr-3/4-Gebieten +2/+4 Stufen, 25 %/50 % Veteranen (+30 % Leben, 12–15 % größer,
  bessere Beute, „Veteran“ in der Ansicht). Gefahr-1-Gebiete unverändert. Selbsttest 111/111.
- §73 zweiter Regionalboss „Karrak, der Sandfürst“ (Rote Wüste, Stufe 12): pfeift unter 50 % zwei Schützen herbei; Tod:
  Wüstenbanden zerfallen (−30 %), Goblin-Krieger rücken nach (Machtvakuum), Händler +8, Banditen −25. Regionalbosse jetzt
  als Tabelle `REGION_BOSSES` (Leitwolf überführt, alte Stände bleiben gültig). **Refactoring-Grund (§2 Punkt 1):** ein
  zweiter Boss hätte den Leitwolf-Code verdoppelt.
- §80 Questtafel: Anschlagbretter listen nur die Aufträge ihrer Stadt (Titel, Ansprechpartner mit Gebäude, Zielort, „angenommen“),
  ohne Gesperrte/Erledigte; leeres Brett verweist auf Orte mit Aushängen. Städte ohne Brett bekommen eines am Platz (zur
  Laufzeit). Suchaufträge verraten kein Ziel (weder Brett noch Karte). Vorher: ein einziger globaler Auftrag als Einblendung.
  Selbsttest 112/112.
- §74 Raids: Vorwarnung — bevor ein Untotenheer auf eine Siedlung zieht, melden Späher es (Chronik/Gerücht, Protokoll,
  Einblendung vor Ort) und das Heer sammelt sich einen Zug (6 Std.). Nachwirkung — fällt eine Stadt, verfallen 3 Wohnhäuser
  um eine Stufe; nach der Befreiung wird je Tag ein Haus eine Stufe instand gesetzt (`S.flags.raidDamage`). Selbsttest 113/113.
- §45 vier neue Aufträge an neuen Systemen: „Graumähne“ (Tomas, Eren → Leitwolf), „Die Straße nach Aschfurt“ (Gerold, Nordfurt →
  Karrak, Belohnung Streitflegel), „Felle für den Hafen“ (Quirin, Salzhafen, 3 Felle abgeben), „Ein Lied für die Toten“ (Lioba,
  Kreuzweg, 3 Wiedergänger am Hundertfeld). Regionalboss-Tod zählt als eigenes Ziel, auch rückwirkend. Selbsttest schließt offene
  Dialoge. Selbsttest 114/114.
- Phase 17 / §44 Kopfgeld: bezeugter Angriff +25, bezeugter Mord +75 Gold bei der Fraktion des Opfers, −5 je Tag. Wachen
  stellen Gesuchte: zahlen, Kerker (ein Tag, 10 % Gold) oder Widerstand (+25, Kampf). §72: ab 150 Gold Kopfgeld jagen
  Kopfgeldjäger draußen (alle 2 Tage höchstens); Stufe = Spielerstufe/3, Deckel 6 (Stufe ≤ 14), ab Stufe 3 Kettenhemd/Helm,
  ab 4 zu dritt. Selbsttest 115/115.
- §43 Ruf-Stufen: Vertraut / Verbündet / Freundlich / Neutral / Misstrauisch / Feindlich / Verhasst (`REP_TIERS`). Preise beim
  Händler der Fraktion −15 % bis +30 %, Begrüßung je Stufe, Verhasst: kein Handel, Wachen der Fraktion greifen an.
  Fraktionsfenster zeigt Stufe, Wirkung und Kopfgeld. Sandbox sichert jetzt auch `S.bounty` (Proben hinterließen 295 Gold
  Kopfgeld im Dev-Stand). Selbsttest 116/116.
- **Endgame: Die Eisenmark** (Nutzerwunsch: größere Welt, Sklavenhalter-Fraktion, befreibare Goblins).
  - Welt 768×768 → 1024×768: Osten angehängt, Gelände aus Hash-Rauschen ohne `rnd()` — bestehende Welt und Spielstände
    unverändert. Felskamm mit Kettenpass, Straße Sonnwacht → Kettenfeste, Wege zu Steinbruch und Grubenhort.
  - Neue Orte: Kettenfeste (Gefahr 4, Mauer, Hof mit Lager/Wagen/Schmiede/Wachfeuer/Käfigen, Kernburg), Steinbruch
    (Arbeitslager), Grubenhort (Versteck der freien Goblins), Kettenpass. Neue Props: Käfig, Kettenpfahl.
  - Neue Fraktionen (jetzt 7): Die Eiserne Kette (Sklavenhalter), Die Grubenstämme (Goblins).
  - Die Kette: Kettenwachen (Peitsche, Brigantine, Eisenhut), Kettenzug (Treiber führt drei angekettete Goblins zwischen
    Steinbruch und Feste, sichtbare Kette Glied an Glied), Gefangene bei der Arbeit im Steinbruch und an den Käfigen.
    Gefangene sind Goblins und Menschen jeder Herkunft (Lumpen) — bewusst nicht nach Hautfarbe gezeichnet.
  - Endkampf: Varg, Kettenmeister (Stufe 16) mit zwei Kettenknechten in der Kernburg; ruft unter 50 % Verstärkung.
  - Befreiung (Vargs Tod): Gefangene werden frei (Goblins → Grubenhort, Menschen → Sonnwacht), wilde Goblins der
    Oberwelt legen die Waffen nieder, keine Goblin-Spawns mehr (Grube bleibt Goraks Revier), Goblin-Dorf mit Ältestem Grisk
    und Händlerin Nibbel (Hakenmesser, Grubenlederweste), Grubenstämme +40, Kette −100 (Reste = Räuber), Titel „Kettenbrecher“.
  - Neue Gegner: Kettenknecht, Varg. Neue Waffen: Kettenpeitsche (Reichweite, fesselt), Hakenmesser (Blutung).
    Neue Rüstung: Steppwams, Brigantine, Schuppenpanzer, Grubenlederweste, Eisenhut, Topfhelm, Eisenschuhe (Läden Nordfurt/Kreuzweg).
  - Fix: Karraks Machtvakuum-Filter stand in Entwurfszahlen und griff nie (jetzt Weltmaßstab).
  Selbsttest 117/117. Screenshots `eisen-kettenfeste.png`, `eisen-kettenzug.png`, `eisen-steinbruch.png`.
- **Arsenal der Mark** (Session 12, Nutzervorlage „Waffen/Rüstung/Eisenfeste“, nur passende Teile übernommen).
  - 16 Waffen:
    - Schrott-Hellebarde, Rabenbeil (+35 % gegen Ungerüstete), Dornensäbel (Blutung), Grabräuber, Kriegspicke (baut auch ab), Sensenlanze.
    - Knochenspalter, Henkersaxt (Hinrichtung unter 50 %), Mauerbrecher (Wucht, hoher Durchschlag), Seelenhaken (verlangsamt).
    - Totenglocke (KLONG: Feinde um das Ziel verlieren den Mut), Rotklaue, Schwarzzahn (Hinrichtung unter 20 %), Kettenbrecher, Eisenfalke.
    - Der Rote Henker (Varg, Unikat).
    - Jede Waffe hat eine eigene Pixelform in `figure.js`.
  - 14 Rüstungsteile:
    - Eisenwache, Rotgardistenpanzer (Standhalten: +3 Rüstung neben einem Verbündeten), Aufsehermantel, Tiefenschürfer, Kettenkoloss.
    - Plattenmantel, Plündererharnisch, Grenzläufer, Rostige Legionärsplatte, Eisenfürst.
    - Die letzte Wache (Relikt, liegt einmal in der Alten Feste).
    - Rotgardistenhelm, Bergmannshelm, Hörnerhelm.
  - Rüstungsbild aus Komponenten: `ARMOR_LOOK` in `sprites.js` (Material, Farbe, Schulterstücke, Schärpe, Helm, Kamm). Neue Rüstung = eine Zeile.
  - Die Eiserne Kette in Schwarz und Blutrot.
    - Wachen tragen gemischte Ausrüstung.
    - Personen der Kette variieren nach Seed: Schulterstück, Schärpe, Maske, Umhang. So entstehen keine Klone.
    - Alte Spielstände werden einmal neu eingekleidet (`kit12`).
  - Neue Gegner: Rotgardist (Elite, Leibwache Vargs) und Kettenschütze (Armbrust). Nach Vargs Tod entsteht aus ihnen keine Elite mehr (Räuber).
  - Beute und Läden verteilt: Nordfurt, Kreuzweg, Banditen, Kopfgeldjäger, Untote, Kette.
  - Selbsttest 118/118. Screenshot `s12-arsenal.png`.
- **Stil nach Referenz 3 (Figuren) und 4 (Welt)** (`docs/reference/`).
  - Figuren:
    - Abnutzung 0–3 aus dem Zustand der Ausrüstung bzw. dem Beruf: Schmutz, Falten, Flicken, zerrissene Säume.
    - Blut ab 50 % bzw. 25 % Leben.
    - Rost und Kerben auf Metall.
    - Schulterumhänge in gedämpften Farben, Beinwickel, Handschuhe zur Rüstung, Taschen, Rucksack mit Deckenrolle (Reisende, Flüchtlinge, Händler).
    - Rote Tücher der Räuber, dunkleres Metall.
    - Waffen mit Rostflecken und Scharten.
  - Welt:
    - Wärmere Boden-Palette, ruhige Grasbüschel, Kiesel, Acker mit Keimlingen, Dielen mit Nägeln.
    - Kräftigere Dachfarben und gemischte Dachtypen je Ort.
    - Bäume mit Kronen aus Blattballen (Licht und Schatten), Herbstvariante, Wurzeln; Tannen mit Lichtflanke.
  - Kopfsteinpflaster bleibt in der alten Form. Ein neues Pflaster wurde getestet; der Nutzer fand die alte Form besser.
  - BUG-102: Test „Jäger“ verglich Gleitkomma mit `===` (Lager 6,3 + 2); behoben. Selbsttest 118/118.
- **Leute Teil 2:**
  - Adel (Ratsherr) mit geviertem Wappenrock und Umhang; Priester mit Kutte, Kapuze und roter Stola; Heilerin mit Stola.
  - Neue Kopfbedeckungen: breiter Hut (Bauern, Kaufleute, Kesselflicker, Flüchtlinge), Eisenhut mit Krempe, Beckenhaube mit Sehschlitz. Wachen wechseln zwischen drei Helmformen.
- **Welt Teil 2:**
  - Wetter je Gegend: Blutregen im Totenland, Sandsturm in Wüste und Ödland, Schnee im Gebirge. Das Regionswetter endet, wenn man die Gegend verlässt.
  - Wasser tiefer und blauer, Banner rot mit Wappen und zerrissenem Saum, Grabsteine in vier Formen (Rundstein, Kreuz, Stele, schief) mit Moos und Riss.
- **Größere Karte, mehr Dörfer:**
  - Karte 1024×768 → 1280×768: Das Grauland östlich der Mark, fahles Grasland mit Wäldchen im Norden und auslaufender Asche im Süden.
  - Acht Dörfer, jeweils mit sechs Häusern, Platz, Brunnen, Acker, Weg zur Straße, Bewohnern, Jäger und Tagesplan:
    - Valen: Haselbrück, Mühlbach, Weidenau.
    - Händler: Rastfurt.
    - Orden: Lichtenrain.
    - Tributdörfer der Eisernen Kette: Grauwasser, Hohlstein, Eisenried (Kettenpfahl, Abgabenkiste, Banner der Kette).
  - Bauweise je Herrschaft (`TOWN_STYLE`). Alte Spielstände bekommen die Dorfbewohner einmal nachgezogen (`villages12`).
  - Fix: Kleine Orte ohne Tagelöhner oder Holzfäller hatten keinen Jäger; jetzt jagt dort ein Bauer oder Handwerker.
  - Selbsttest 119/119 (neu: Dörfer). Zeichnen 1,6 ms im Median.
- **Mord am hohen Stand:**
  - Jeder Mord kostet Ruf: ohne Zeugen −3, mit Zeugen −10.
  - Adel und Geweihte kosten −35 (ohne Zeugen −18), bei Geweihten zusätzlich beim Orden −30. Das Kopfgeld beträgt 300.
  - Blutbann (5 Tage): Die Wachen der Fraktion greifen ohne Anruf an; eine Festnahme gibt es nicht mehr.
  - Kirchenbann (7 Tage): Niemand hilft dir auf, wenn du am Boden liegst.
  - Kopfgeldjäger kommen sofort, es gibt einen Chronikeintrag, die Moral der Gruppe sinkt um 20.
- **Neuordnung der Welt (SAVE_VERSION 4, nur neues Spiel; alte Stände werden gesichert, nicht geladen):**
  - Karte 1536×768. Im Westen liegt das Land der Eisernen Kette, in der Mitte das Menschenland, im Osten das Totenland.
  - Übergänge ohne gerade Grenzen: Das Land jenseits der alten Ränder setzt das Land davor fort (verzerrt gespiegelt, nur natürliche Böden).
  - Das Totenland beginnt hinter einer unregelmäßigen Grenze: Asche, schwarze Seen, tote Wälder, Totenruinen, Schädelwald, Gräberfeld, Seelenhügel, Grabwacht. Eingang ist das Knochentor, dort erscheinen Untote.
  - Die Eisenfeste ist ein großes Festungsgebiet: Mauerring mit Türmen, Kettentor (Ost) und Südtor, gepflasterte Straßen, Häuserreihen aus schwarzem Stein, Zitadelle mit Thron, Steinbruch, Sklavenbaracken, Arbeitsfelder, Pferche, Zeltlager.
  - Das Westgebirge flacht zur Mitte hin ab. Die Goblin-Wälder mit dem Grubenhort liegen südlich des Rings, die Tributdörfer im Süden.
  - `worldPt`, `seaLine` und `regionAt` kennen die Verschiebung um `OX`. Alte Eisenmark-Koordinaten laufen über `EM()`.
  - Erreichbarkeit für jeden Seed: `ensureReach` gräbt abgeschnittenen Orten einen Weg. `tidyTowns` räumt Streu aus Orten.
- **Weltkarte (M) neu (`atlas.js`):**
  - Gemalte Karte mit Relief, Schneegipfeln, Wald- und Totbaumsymbolen, Burg-, Dorf- und Ruinensymbolen.
  - Herrschaftsgrenzen (bernstein und rot), Landesnamen, Namen mit Kontur.
  - Kriegsnebel (8×8-Zellen, `S.fog`), aufgedeckt im Umkreis von 18 Kacheln.
- **Varg hält Hof:**
  - Die Kette ist neutral, bis es Alarm gibt, du ihn herausforderst oder der Ruf auf −60 fällt.
  - Varg ist ansprechbar (Lore, Herausforderung, Gehen). Sechs Wachen stehen um ihn, dazu der Thron.
  - Hinterhalt: Ein Angriff auf Ahnungslose macht von hinten ×3, sonst ×1,5 Schaden. Bei der Kette löst er Alarm aus (2 Tage, Ruf −10).
- **Waffen:**
  - Schwere Köpfe neu gezeichnet und kleiner: Halbmond-Klingen, Varg-Axt, Richtbeil, Hämmer, Glocke, Hackbeile.
  - Dunkler Stahl, Licht nur an der Schneide.
  - Zweihänder werden mit beiden Händen gehalten, die zweite Hand greift am Schaft und dreht mit.
  - Einhänder: Die Hand liegt über dem Griff.
- **Fixes:**
  - BUG-103: Das Anschlagbrett stand im Dorf auf dem Platzmittelpunkt und sperrte die Türen.
  - BUG-104: Tiefhall war je nach Seed unerreichbar.
  - Einwohner-Test zählt keine Ruinen mehr.
- Kontinent (Referenzkarte): Meer rundum mit zerklüfteter Küste (`coastline`, Orte und Festungsring geschützt). Karte (M) mit Kompassrose und Maßstab.
- **Die Welt von Valoris** (Nutzervorlage: dichte Kenshi-Weltkarte):
  - Karte 1536×1024.
  - Wüstensporn: Halbinsel im Südwesten mit Dünen, Felsödland und seltenen Oasen. Dort liegen Karak-Atar (Mauerstadt der Sandfürsten mit Markt, Häusern, Toren), Dünenwacht (Räuberfeste), Sandruinen und Ödland. Ein Karawanenweg führt hindurch.
  - Im Süden liegen Inseln; im Südosten die Nekrosinsel mit der Totenbrücke.
  - Zerklüftete Küste an allen Seiten (tiefe Buchten, Landzungen), Binnenseen mit Schilfrand. Wege über Wasser werden zu Stegen.
  - Dichte: je 52×52-Zelle kann ein kleiner Ort entstehen, passend zur Gegend. Möglich sind Gehöft, Wachturm, Lager, Banditenlager, Stollen, Gräber, Tempel, Ruine, Steinkreis, Außenposten und Wrack. Je Welt sind es etwa 90 bis 190 Orte, jeder mit eigenem Namen. Banditenlager, Totengräber, Minen und Ruinen haben ihre Bewohner.
  - Streuorte liegen nur auf erreichbarem Land. Warnungen nur bei großen Orten.
  - Karte (M): Symbole je Ortsart, Meeresnamen, Titelkartusche „Die Welt von Valoris“. Namen der Streuorte erscheinen in der Umgebungsansicht.
  - Fixes, die neue Seeds aufgedeckt haben:
    - Türachsen und feste Props auf Fels werden nach der Erzeugung geräumt (`clearDoors`).
    - Die Namen der Bewohner werden erst geprüft, wenn alle Figuren stehen.
    - Der Jagdplatz rutscht nicht mehr in die Stadt.
- **Das Hochreich Aurelion** (Nutzer: großer, reicher, technischer Adelsstaat im Süden; die Welt überwiegend grün):
  - Karte 1536×1216. Der Süden ist eine große, fruchtbare Landmasse mit Hainen, Alleen und Seen. Die Wüste ist nur noch ein Zipfel im Westen (Karak-Atar, Dünenwacht, Sandruinen).
  - Fünf ummauerte Städte: Aurelheim (Hauptstadt), Kupferhafen, Gelenkhall (Prothesen), Tickmar (Automaten) und Sankt Serin (Akademie). Sie haben Pflasterkreuz, Platz, Häuserreihen aus hellem Stein, Laternen, Standbilder, Hecken sowie Werkstätten mit Zahnradhaufen und ruhenden Automaten. Straßen verbinden sie untereinander und mit Karak-Atar.
  - Neue Stände: Graf, Gräfin, Edelmann, Edelfrau, Kaufherr, Feinmechaniker, Kybernetiker, Medica, Prothesenhändlerin, Gelehrter; Adel zählt beim Mord als hoher Stand.
  - Neue Fraktion „Das Hochreich Aurelion“. Automaten-Wächter stehen an Toren und Plätzen (Messingpanzer, Maskengesicht, Glutaugen).
  - Der Kriegsautomat taucht als verwilderte Maschine in Maschinenruinen auf und hinterlässt Automatenkerne und Schrottprothesen.
  - Streuorte im Hochreich: Adelssitze (Hecken, Standbild, Wachautomat), Werkstätten, Maschinenruinen.
- **Gliedverlust und Prothesen (Kenshi-Kern):**
  - Ein zerschmettertes Glied (Schaden bis −max) geht verloren und heilt nicht mehr.
  - Prothesen ersetzen es: Schrottarm/-bein, Aurelionischer Arm/Bein, Meisterarm/-bein. Der Meisterarm gibt +10 % Schaden, das Meisterbein +6 % Tempo.
  - Meisterin Vell in Gelenkhall verkauft Prothesen. Ein Messingarm ist an der Figur sichtbar.
- **Karte (M):** In der Weltansicht keine Streuort-Symbole, nur wenige, gedämpfte Landesnamen, dazu die Grenze des Hochreichs in Gold.
- **Leistung:** Die Sichtliste nutzt ein Raster statt jedes Bild alle ~14 000 Props zu filtern (0,4 ms gespart). Zeichnen 1,4 ms, Update 2,2 ms.
- **Fix:** Jäger werden beim Laden neu bestimmt, alte Jagdplätze konnten in einer Stadt liegen. Im Hochreich jagt der Adel.
- Selbsttest 123/123 (neu: Prothesen, Hochreich).
- **Figuren feiner und größer** (Nutzer: 48–64 px, schwerer, mehr Detail; Antwort „beides“):
  - Figuren, Tiere und Waffen werden nicht mehr vergröbert (Stil D aufgehoben).
  - Die ganze Figur samt Armen und Waffe wird um den Fußpunkt mit `FIGK = 1,2` vergrößert. Das ergibt etwa 1,5-mal mehr Pixel je Figur und eine 1,2-mal größere Figur.
  - Breiterer Rumpf und kräftigere Schultern (`FIG`).
  - Detailpass: Faltenwurf in Umhang und Rock, Nieten auf Platte, helle Stiefelstulpen.
  - Leichen und Tiere sind mitskaliert. Props und Boden bleiben im groben Raster.
  - Vorhandene Posen: Stehen (2), Laufen (4), Angriff je Waffenart (3), Treffer, Knien und Tod, Ausweichrolle.
  - Selbsttest 123/123, Zeichnen etwa 1 ms.
- **Angriffe mit Varianten (je Waffenart):**
  - Vorhand, Rückhand (gespiegelter Bogen), Überkopfhieb (schwere Waffen und Schwerter), bei Stoßwaffen Stoß mittig, tief oder hoch.
  - Die Variante wechselt je Hieb als Kombo mit Zufall, dazu eine kleine Abweichung je Schlag. Die Spur folgt der Variante.
  - Treffer rechnet `resolveSwing` wie bisher.
- **Haltung in Ruhe:** Speere und Hellebarden werden aufrecht gehalten, die Spitze zeigt nach oben (Wachen). Zweihänder und Hämmer liegen auf der Schulter.
- **Boden detaillierter:**
  - Zweite Detailebene mit feiner Körnung.
  - Gras mit Halmen und Klee, Erde mit Rissen und Wurzeln, Sand mit Windrippeln, Asche mit Schlacke und seltener Glut, Sumpf mit Pfützen und Himmelsglanz.
- Fix: Jagdplätze. Findet sich in 40 Kacheln nichts außerhalb der Stadt, wird in 55 und 70 Kacheln gesucht (Aschfurt).
- Selbsttest 124/124 (neu: Hiebvarianten).
- **Tribut der Eisernen Kette (A1):**
  - Grauwasser, Hohlstein und Eisenried haben einen Vorrat (0–100, +5 je Tag). Alle 5 Tage nimmt die Kette 25, bei Härte 50.
  - Hungert ein Dorf zweimal in Folge, zieht jemand weg.
  - Die Dörfler klagen im Gespräch. Man kann den nächsten Tribut eines Dorfes selbst zahlen (Ruf im Dorf +10).
  - Ein Tributzug läuft vom Dorf über die Straße zum Südtor: Offizier, Wachen, Träger. Ferne Züge wandern vereinfacht weiter.
  - Auf halber Strecke kann es einen Räuberhinterhalt geben. Wer den Zug schützt, bekommt Kette +6.
  - **Überfall durch den Spieler:** Tributgut in der Tasche, Kette −15, Auftrag „Geraubter Tribut“. Zurückbringen gibt Ruf im Dorf +20 und Vorrat zurück. Behalten heißt verkaufen.
  - **Strafaktion nach einem Überfall:** 3 Zyklen doppelter Tribut, Dunkle Paladine begleiten den Zug.
  - **Aufstand (20 %, bei Hunger 45 %):** Prügelei ohne Tote.
    - Nur Rumpftreffer mit halbem Schaden. Wer unterliegt, liegt 20 s und steht wieder auf.
    - Stellst du dich auf die Seite der Kette: Kette +8, Dorf −15. Auf die Seite des Dorfes: Kette −10, Dorf +15.
    - Siegt das Dorf, kommt der Vorrat zurück und die Kette kommt härter wieder.
  - **Banditen gegen ein Tributdorf:** Die Kette stellt 2 Krieger ins Dorf, 4 Tage lang.
  - Nach Vargs Fall endet der Tribut.
  - Selbsttest 125/125 (neu: Tribut). Die Regel „Alle Questgeber existieren“ erlaubt jetzt Ereignis-Aufträge ohne Geber.
- **Tagesablauf der Eisenfeste (A2):**
  - Nachts (21–6 Uhr) schließen Fallgitter das Kettentor und das Südtor. 8 Nachtwachen stehen an Mauerecken und Toren.
  - Der Arbeitszug und die Steinbrucharbeit ruhen nachts.
  - Gitter und Nachtwachen sind flüchtig. `fortressHour()` stellt beim Laden und zu jeder Stunde den richtigen Zustand her.
- **Feldzüge ins Totenland (A2):**
  - Drei Arten, gemischt: Stoßtrupp (8–12 Mann, alle 4–6 Tage), Feldzug (20–30, alle 10–15 Tage), Heerzug (40–50, alle 20–30 Tage).
  - Ablauf: Kriegsrat mit Gerücht, am nächsten Tag Musterung vor dem Kettentor (3 Stunden, Proviantwagen), Marsch in Kolonne hinter dem Kriegsmeister, Schlacht, Rückkehr.
  - Sichtbar sind bis zu 8, 14 oder 20 Soldaten. Außer Sicht zieht das Heer vereinfacht weiter (70 px/s).
  - Schlacht in Spielernähe: Untote verteidigen das Ziel echt. Sonst entscheidet ein Wurf nach Größe, Warnung und Sabotage.
  - Das Heer kehrt mit Verwundeten zurück oder wird vernichtet. Beides steht in der Chronik.
  - **Mitziehen:** den Kriegsmeister ansprechen oder bei der Schlacht dabei sein. Sieg bringt 60 Gold und Kette +10.
  - **Sabotage:** am Proviantwagen „Proviant verderben“. Das Heer ist geschwächt. Wer gesehen wird: Kette −15 und Alarm.
  - **Warnen:** einem Untoten davon erzählen (Untote +8). Das Ziel hat dann 50 % mehr Verteidiger.
- **Abstand und Feststecken (Nutzerwunsch):**
  - Figuren im Kampfumkreis schieben sich auseinander (`separate()`, 48-px-Raster, 0,13 ms bei 56 Kämpfern). Wände und feste Objekte gelten weiter. Der Spieler wird kaum geschoben, Wagen und Liegende gar nicht.
  - Wer über 2 s gehen will und sich nicht bewegt, wird befreit (`unstick()`). Steckt er in Fels, Objekt oder Kessel, kommt er auf den nächsten offenen Platz. Sonst weicht er zur Seite aus.
  - `freeSpotNear` wählt nur noch offene Plätze. Von dort müssen mindestens 120 Kacheln (Höhlen: 30) zu Fuß erreichbar sein (`openSpot`). Figuren entstehen nicht mehr eingesperrt.
  - BUG-105: Der Einwohnertest zählte den Tributzug zum Dorf und übersah Hungertote.
  - Selbsttest 127/127 (neu: Eisenfeste-Tagesablauf und Feldzug, Abstand).
- **Dienst bei der Kette (A3):**
  - Beitritt bei jeder Kettenwache ab Ansehen 10. Goblins −20, Orden −10, Valen −5.
  - Ränge: Treiber, Kettenknecht, Grenzreiter, Aufseher (je 25 Ansehen). Kettenmeister bleibt Varg allein.
  - Die Gruppe reagiert: Harte Naturen (grausam, ehrgeizig, diszipliniert) freuen sich, die anderen verlieren Moral.
  - „Gibt es Arbeit für die Kette?“ nennt den nächsten Tributzug und den laufenden Feldzug und vergibt den Auftrag „Entlaufene“.
  - **Entlaufene:** Ein Geflohener versteckt sich östlich der Mauern. Zurückbringen gibt 25 Gold und Kette +8. Laufen lassen gibt Erfahrung, aber mit 30 % Chance sieht es ein Grenzreiter (Kette −10).
  - Mitglieder können nachts an den Fallgittern die Wache rufen, die das Tor öffnet.
  - **Grenzreiter:** Tagsüber reiten zwei schnelle Streifen vom Südtor über die drei Tributdörfer und zurück.
  - **Weihe zum Dunklen Hochpaladin** ab Aufseher, bei Varg oder einem Dunklen Paladin. Dazu Kettenbrecher und Eisenfürst-Platte. Valen −10, Orden −15.
  - Fähigkeiten: Kettenschlag (heranziehen und fesseln), Furcht-Aura (Feinde −20 % Schaden, Angeschlagene fliehen, Zivilisten laufen davon), Befehl der Kette (Kettenwachen folgen 60 s), Blutpreis (Gefesselte und Eingeschüchterte zahlen, 60 % heilen).
  - **Furcht:** Ab Kettenknecht verlangen Händler in freien Dörfern 20 % mehr, als Hochpaladin 40 %. Tributdörfer handeln gar nicht, sanfte und furchtsame Händler auch nicht mit dem Hochpaladin. Begrüßungen ändern sich, Leute weichen aus.
  - Selbsttest 128/128 (neu: Dienst bei der Kette).
- **Fall der Eisenfeste (A4):**
  - Untote überfallen Dörfer. Vor Vargs Fall 6 % Chance je Tag, danach 35 %. Östliche Dörfer trifft es öfter.
  - Späher warnen 3–6 Stunden vorher. Das steht im Log und in der Chronik.
  - Ist der Spieler in der Nähe, kämpfen die Untoten echt gegen Dorf und Verteidiger. Dorfbewohner fliehen, Verteidiger stellen sich. Sonst entscheidet die Verteidigungsstärke gegen die Zahl der Angreifer.
  - Verloren: 3 Häuser brennen, 1–3 Bewohner sterben. Mit 45 % Chance (vor dem Fall 15 %) wird das Dorf ganz zerstört: alle Bewohner tot, alle Häuser Ruinen.
  - Auf Schwer und Sehr schwer ist die Zerstörung endgültig. Auf Angsthase kehren nach 10 Tagen Überlebende zurück und bauen wieder auf. Die Stufe kommt mit Block B, bis dahin gilt Schwer.
  - Zerstörte Tributdörfer zahlen keinen Tribut mehr.
  - **Verteidigung** („Wer verteidigt dieses Dorf?“ bei jedem Dorfbewohner): Miliz (2 Mann, 60 Gold, bleibt), Söldner aus Kreuzweg (3 Mann, 5 Tage, 150 Gold), Automaten aus Aurelion (2, 5 Tage, 400 Gold, ab Ruf 0), Goblin-Krieger von Grisk (3, 5 Tage, 60 Gold, nach der Befreiung ab Goblin-Ruf 20).
  - **Grisk** hat nach der Befreiung drei Aufträge:
    - Verschleppte: 3 Goblins im Westen finden und befreien.
    - Die letzten Glieder: 4 Kettenreste im Westgebirge töten.
    - Ein Dorf für die Freien: 30 Holz und 15 Stein bringen. Danach stehen drei weitere Goblins im Grubenhort.
  - Fix: Bewaffnete (Wachen, Karawanenwachen, Verteidiger) weichen dem Hochpaladin nicht aus.
  - Fix: Im Abstandssystem gleiten laufende Figuren seitlich vorbei. Wagen sind ausgenommen.
  - Selbsttest 129/129 (neu: Fall der Eisenfeste). Die Regel „Alle Questgeber existieren“ kennt die Goblins des Grubenhorts.
- Selbsttest 121/121 mit drei verschiedenen Seeds.

## Session 9 — 2026-09-25 · Grafik-Revision v2 (Nutzer: Priorität 1, Variante A)
- **Refactoring nach §2, Punkt 4** (Qualität unmöglich): das 20×25-Figurenraster (2 Welt je Pixel) erzwang Chibi-Proportionen
  und Klötze. Neu `src/figure.js`: Formen-Zeichner (Teile als Vielecke, Volumen, Schlagschatten, selektive Innenkontur),
  Skelett je Richtung/Pose, 40×60 bei 1 Welt je Pixel. Spec-System (humanSpec/monsterSpec) bleibt die einzige Quelle.
- Frames tragen Maßstab und Pivot (`px/ox/oy`), gezeichnet über `SP.blit()` — alte und neue Frames laufen nebeneinander
  (Goblins/Tiere bis G4). Porträt, Charakterbogen, Titel, Leichen, Rolle, Liegen angepasst.
- Waffen (G3): 20 Designs im feinen Raster (`paintWeapon2`), liegende Teile mit Licht von oben, dunkles Eisen.
- Gegner (G4): Goblins mit eigenem Kopf (breit, lange Ohren, Hakennase, gelbe Augen, Zähne), Tiere neu
  (`paintBeast2`: Wolf mit Mähne, Hund mit Flecken/Sichelrute, Wildschwein mit Borstenkamm/Hauern, Bär mit Buckel, Hirsch
  mit Geweih/Spiegel; 4 Schritte, Ducken, Biss mit offenem Maul, tot), Gorak als Goblin-Hüne (`paintBrute` mit Goblin-Kopf,
  Laufen, Ausholen mit erhobenem Arm, Hackmesser in der Hand).
- Arm-zu-Waffe (G3, Audit BUG-084 teilweise): im Nahkampf wird der Waffenarm nicht ins Figurenbild gemalt, sondern von
  der Schulter zur Hand gezogen (`weaponPose`, `drawArm`); die Hand läuft beim Schlag auf einem Bogen um die Schulter,
  in Ruhe hängt sie. Klingenspur nutzt die vergangenen Handpositionen.

## Session 8 — 2026-09-25 · Phase 11 Gegner (Prüfung + Lücken)
- Befund: Phase 11 war in Session 7 großteils gebaut (Kultist, Wiedergänger, Geist, Bär, Wilder Hund, Hirsch mit
  Verhalten, Spawngebieten, Beute), aber PHASE_STATUS stand auf „nicht begonnen“; Verhaltenstests fehlten.
- Wilder Hund mit eigener Gestalt, Cache-Schlüssel der Tiere mit Palette (BUG-072).
- Stil-Testbereich zeigt jetzt alle 17 Gegnertypen (`screenshots/gegner-*`).
- 6 Verhaltenstests: Wiedergänger steht einmal auf (nicht nach Feuer), Geist körperlos nach Treffer (Heiliges trifft),
  Bär nur im Revier/verletzt, Hirsch flieht und greift nie an, Kultist heilt mit Abklingzeit, Hund ≠ Wolf.
- Kultist-Abklingzeit mit `dt` (BUG-074); Sandbox isoliert Geschosse/Auferstehungen (BUG-073, unverifiziert).

## Session 7 — 2026-09-25 · Phasen abschließen (Nutzer: „schließ die restlichen Phasen ab“)

### Phase 9/10 — Skill-Baum & Klassen (data.js, game.js, ui.js, style.css)
- Klassen berserker/assassin/bard/alchemist (+`weak`), Fähigkeiten in `classAbility`, Status frenzy/song/poison_coat/poisoned,
  `cowed`/`confused`; Lehrer-Folgen `teachable`, Umlernen `respec`; aktive Knoten (`grants`, `treeAbilities`); `splashAt`;
  `removeItem` über Stapel; Leiste 10 Plätze. Neue Figuren Lioba, Quirin.

### Phase 8 — Rarität & Beute (data.js, game.js, ui.js, render.js, sprites.js, style.css)
- `rollRarity`, `AFFIXES`, `LEGENDS`, `RARITY_DROP/VALUE/AFFIXES`, `afx()`, `hasLeg()`, `giveItem()`; Unikate Nachtfrost, Hackmesser.

### Phase 7 — Waffen (data.js, game.js, sprites.js, render.js)
- Rapier, Kriegshammer, Hellebarde, Armbrust, Zauberstab (Felder riposte/crush/sweep/reload/manaShot), FEEL, Designs, Geschosse.
- Läden: Brann (Schmiede, eigener Pool, `market:false`), Gerold/Oda/Sael-Pools; Handelsdaten beim Laden nachziehen.

### Phase 6 — Animation & Combat Polish (game.js, sprites.js, render.js, world.js, index.html, style.css)
- Deckung/Parade (`updateGuard`, `guarded`, Feld `cover`), Touch-Knopf „Deckung“; Rollen-Landung (`landT`, i-Frames −40 ms).
- Posen guard/sit/trade; Sitzplätze an Bank/Tisch (`assignNpcDays`), Handelsgeste; Waffe abgelegt beim Sitzen.
- Möbel-Ausweichplatz in `house()` (BUG-066), Schenken-Halbkreis (BUG-067), Review-Befunde (BUG-068).

## Session 6 — 2026-09-25 · Spielstand, Karawane, Tiefhall

### Spielstand (state.js, world.js, game.js) — BUG-017, BUG-057, BUG-058
- Props tragen `gk` (Typ@Kachel); `setPropBase` hält den Grundzustand nach jeder Generierung fest; `saveData` schreibt
  nur Abweichungen und `propsGone`, Zahlen auf 2 Nachkommastellen; `mergeProps`/`adoptPropKeys` beim Laden.
  1,43 → 0,53 MB. Speichern 28 → 38 ms (Signaturvergleich), Speichern ist ereignisgesteuert.
- continueGame fasst Props nicht mehr an (act/hexed/rooted) — sonst wich jedes Prop nach dem Laden ab.

### Karawane (sim.js, game.js, render.js, ui.js) — BUG-011, BUG-061
- Zug aus Leitwagen (Kutscher, zwei Ochsen, Plane) und Beiwagen (Maultier, sichtbare Ladung) auf der Spur des
  Leitwagens; Maßstab 1,5. Zwei Karawanenwachen (`escort`, `slot`), Rast am Tor, Hinterhalt nach Wachenzahl.
- **Refactoring nach §2, Punkt 2** (Duplikation): `guardChar` aus `spawnGuardPosts` gelöst — zweiter Nutzer.
- Route per Dijkstra aus der Straße (`buildRoute`) statt fester Wegpunkte.

### Tiefhall (world.js, game.js, render.js, ui.js, data.js, sprites.js, state.js) — BUG-009, BUG-060
- **Refactoring nach §2, Punkt 1** (blockierte die Erweiterung): `DUNGEONS`/`MAP_KEYS` statt ~25 fester 'mine'-Stellen.
- `genDeep`, Thron-Objekt, Säulen neu gezeichnet, Hrodvar (Boss) mit Beute, Spawngebiete, Migration deep1,
  Ankunft vor dem benutzten Eingang.

### Tiefhall eingebunden (game.js, data.js, render.js) — BUG-064, BUG-065
- Brann (Nordfurt), Quest Königseisen, Frostklinge; `reward.item`/`reward.take`; `startQuest` zählt Erledigtes.
- Hrodvar: `frostKingAI` (Eiskreis, Durchfroren, Leibwache); Thron neu gezeichnet.

### Titelklasse Mönch (data.js, game.js, sprites.js, style.css)
- `TITLE_CLASSES.monk`, drei Fähigkeiten, Zweig Stille Hand, Ilva + Quest in Sonnwacht, `evaded()` als eine Stelle für
  „im letzten Moment ausgewichen“ (Nahkampf, Geschosse, Eiskreis, Bodenbeben), Sprint über `p.dodge.dist/dur/dash`.
- Nekromant/Hexenmeister schließen den Mönch aus (beidseitig, Selbsttest prüft die Symmetrie).

### Grenzöde (world.js, game.js, data.js) — BUG-051
- `borderScenes` (Hash, kein rnd), Orte Grenzwacht/Hundertfeld, Oda + Warenpool, Wachposten, Quest `q_frontier`,
  Spawngebiet, Migration border1, Selbsttest.

### Kleinkram
- Leichen: Alter nie negativ (BUG-059).

## Session 5 — 2026-09-25 · Größere Welt, Skill-Baum, Druide, Totenreich

Nutzerwunsch: Weltkarte größer (mehr Häuser, mehr Abstand), Diener folgen, Skill-Baum mit allgemeinen Knoten und eigenen
Zweigen der Titelklassen, höchstens 2 Klassen je Figur, Totenreich erweitern. Fünf Commits, je Thema einer.

### Weltmaßstab (world.js, game.js, sim.js, state.js)
- **Refactoring nach §2, Punkt 1** (blockiert die geforderte Erweiterung): ~300 feste Koordinaten der Generierung stehen
  im 512er-Maßstab. Statt sie umzuschreiben: `resampleWorld` rechnet die fertige Entwurfswelt auf 768×768 hoch, Städte
  werden danach im Weltmaßstab gebaut (`sp`: Anker × WS, Streckung wie geplant). `phase` trennt Entwurf und Laufzeit
  (`regionAt`, `seaLine`, `naturalAt` rechnen Weltkacheln auf den Entwurf zurück).
- `worldPt`/`wT`/`dT`; `townPt` bleibt als Alias. SPAWN_AREAS, Ankunft an der Grube, Lila, Startgebiet, Karawanen-
  Hinterhalt laufen über den Maßstab. `grow`-Einträge mit `s0` umgerechnet; neue `outskirts` (Randhäuser nach Regeln).
- Spielstand v3: `rescaleSave` — Props neu (Truhenzustand über Typ+Etikett+Nähe), Figuren/Gegner/Gräber/Gegenstände/
  Karawanen/Lager ×1,5, Bewohner neu, Wachen auf neue Posten, wer in Mauer stünde, tritt heraus.
- Messung (headless, 300 Frames): Update Eren 1,2 → 1,7 ms, Nordfurt 0,9 → 1,3 ms (Budget 3,0); Spielstand 1,1 → 1,4 MB.

### Diener (game.js)
- travel(): Diener gehen wie Gruppenmitglieder mit durch jeden Eingang.

### Skill-Baum (data.js, game.js, ui.js, style.css)
- `SKILL_TREE`/`SKILL_BRANCHES`, `treeFx`/`node`/`nodeState`/`learnNode`; Wirkung in recalc, damageOf, armorOf, speedOf,
  hit (Krit), hurt (Berserker, Zweiter Atem), Regeneration, Heilgegenständen, Ausweichen, Abklingzeiten, Zauber- und
  Titelzauberschaden, Titelknoten (Dienerzahl/-dauer/-leben, Essenzgrenze, Fluch, Chaosblitz, Entfesseln, Blutpakt,
  Ranken, Geisterwolf, Erdsegen, Hüter des Hains). Fenster „Talente“ (T, auch im Menü), Talente im Charakterbogen.
- Stufenaufstieg vergibt 1 Talentpunkt; mehrere Stufen auf einmal werden jetzt vergeben (BUG-054).

### Druide, Obergrenze (data.js, game.js, world.js, ui.js)
- Titelklasse Druide (Wildkraft, Rankenfessel, Geisterwolf, Erdsegen, Waldgänger, Metall erstickt, Stärke −1),
  Quest „Der Ruf des Hains“, Mira, Alter Hain im Westwald (`groveScene`). `MAX_TITLES = 2`, Titelwechsel nicht im Kampf.

### Totenreich (world.js, game.js, data.js, buildings.js, render.js)
- Zwei Aschland-Zentren; `deadScenes` (Knochenwald, Aschensee, Seelenbrunnen); Stadtplan Vharnholm (Stil blackstone/
  bone, untote Bewohner `DEAD_TRADES`, Stille Wächter), Sael mit eigenem Warenpool (`npc.pool`, Orte ohne Markt),
  Quest „Grabräuber in der Asche“, Seelenphiole (`use:'soul'`), Seelenbrunnen (`rite:'soulwell'`), Spawngebiete.
- Gleiche Fraktion bekämpft sich nicht (isHostile, Bedrohungssuche) — BUG-055.
- Tote Bäume neu gezeichnet (BUG-056). `planned`-Props im Stadtplan sind keine Wildnis-Streu.

### Tests
- Selbsttest 54 → 60: Weltmaßstab/Erreichbarkeit, Diener durch Eingänge, Skill-Baum-Daten, Skill-Baum-Wirkung, Druide +
  Obergrenze, Totenreich (Fraktionsfrieden, Brunnen, Phiole). Gegenproben für Diener und Fraktionsregel. Grün auf 5 Seeds
  und auf zwei alten v2-Ständen. Druiden- und Nekromanten-Kette über die Oberfläche durchgespielt.

## Session 4 — 2026-09-25 · Siedlungsdichte (§75) und Titelklassen (§32/§78)

Nutzerwunsch: „Klassen, die man später freischalten kann, wie Titel mit besonderen Fähigkeiten“ — Ressourcen und
Fähigkeiten dieser Titelklassen neu strukturieren; Menschen und Häuser deutlich weiter auseinander, Einwohner je nach Größe.

### Siedlungen (world.js, game.js, sim.js, ui.js)
- Streckung je Stadt (`spread`, `spreadHouse`, `townPt`): Entwurfskoordinaten bleiben, Abstände wachsen um 1,2–1,5,
  Häuser an der Türseite verankert. Fläche aller Siedlungen 10 651 → 19 322 Kacheln; Mindestabstand 0–1 → 2 Kacheln.
- **Refactoring nach §2, Punkt 1** (blockiert die geforderte Erweiterung): Der alte Stadtkern war in `genWorld` fest
  verdrahtet und ließ sich nicht verschieben, ohne die Zufallsfolge (und damit alte Welten) zu ändern. Er bleibt dort
  (Zufallsfolge stabil) und zieht in `expandTowns` um: Häuser/Möbel ab, Boden zurück zur Natur, Kern-Props wandern mit
  ihrem Haus (`attachedPt`), Häuser neu an gestreckter Stelle (id und Aussehen aus dem Entwurf: `meta.id`, `hx/hy`).
- Anschluss: abgehängte Straßenstücke per Breitensuche ans Stadtnetz; Trampelpfad von jeder Tür; Props auf Türachsen
  rücken zur Seite; Hauptstraßen mindestens 3 Kacheln breit.
- Nordfurt: Flächenpflaster entfernt (Markt gepflastert, Höfe, Gemüsebeete), +7 Häuser (`grow`, Weltkoordinaten);
  Aschfurt +3 Häuser. Siedlungen übernehmen die Region ihres Ankers (Nordfurt lag halb im Gebirgsbiom).
- Einwohner nach Fläche (`perHead`, `residentPlan`, `HOUSE_CAP`); Tagesziele verteilt (Platz, Nachbarn, eigenes Haus)
  statt 5×3 Kacheln; Anzeige „Einwohner“ zählt echte Köpfe, jetzt in allen Städten (`townHeads`).
- Entfernt: `spawnVillagers` (9 hauslose Zusatzdörfler in Eren, stammten aus der Zeit vor den Bewohnern — trieben die
  Dichte hoch, ohne Zuhause).
- Feste Koordinaten (Wachposten, Arbeitsplätze, Karawanenroute, Startpunkt, Erbe-Ankunft) laufen durch `townPt`;
  Karawanen-Hinterhalt von x 92 (jetzt im Dorf) nach x 101; Route auf Brücke und Torstraße (der alte Endpunkt läge in
  einem neuen Nordfurter Haus — Karawanen fahren ohne Kollision).
- Migration `flags.gen4`: Stadt-Props und Bewohner neu, Truhen behalten ihren Inhalt (über Typ + Etikett), Wachen
  beziehen die neuen Posten, wer in einer Mauer stünde, tritt heraus. Getestet mit einem Stand des alten Codes.
- Performance (headless, 300 Frames): Update Nordfurt 0,7 → 0,9 ms, Eren 1,2 → 1,2 ms; Zeichnen unverändert.

### Titelklassen (data.js, game.js, ui.js, sprites.js, world.js, style.css)
- `TITLE_CLASSES` (Nekromant, Hexenmeister): eigene Ressource mit Regel, 3 Fähigkeiten, Passiv, Makel, Paktpreis,
  Ruf, Merkmal, Ausschluss. Titelfähigkeiten in `ABILITIES` mit `title`/`cost`/`gain` statt Mana/Ausdauer.
- Spiel: `unlockTitle`, `setTitleClass`, `tres/setTres`, `corrupt`, `titleTick`, `titleOnDeath`, `titleAbility`;
  Diener (`servant`, Team Spieler, folgen, zerfallen nach 60 s, flüchtig), Fluch (`hexed`: +25 % Schaden, −30 %
  Tempo), Knochenschild (Status mit `absorb`), Makel im Treffer- und Heilcode, Paktkosten in `recalc`.
- Questkette „Der Pakt der Stillen Schar“: Morvath → Ysra (Alt-Vharn) → Ahnenurne aus der Nekropole (Wächter oder,
  als Mitglied der Schar, freier Zugang) → Ysra (Nekromant) oder Vhal (Hexenmeister) → Ritual. Neue Figuren Ysra, Vhal;
  neuer Gegner „Wächter der Nekropole“ (Sprite: Plattenpanzer, Großhelm, Grünlicht); Ortsszenen `pactScenes`.
- Folgen: Orden verweigert Gespräche, Ordenswachen greifen ab Ruf −25 an, Stadtbewohner grüßen anders.
- Hexenmeister aus dem Klassenbaum entfernt (war Lehrklasse bei Morvath). Migration alter Stände: → Magier + Titel.
- Oberfläche: Ressourcenleiste im HUD (Essenz grün, Verderbnis violett), Titelfähigkeiten farbig in der Leiste,
  Titelblock im Charakterbogen (Ressource, Passiv, Makel, Preis), Titel tragen/ablegen im Ausbildungsfenster.

### Tests
- Selbsttest 46 → 54: Siedlungsabstand/-bebauung, Einwohner nach Fläche, Karawanenroute frei, Titelklassen-Daten, Nekromant, Hexenmeister,
  Pakt-Kette (Kampf/Überzeugung), Ordensreaktion. Gegenprobe: je ein Mechanismus ausgebaut → der zugehörige Test fällt.
- Zufallsabhängiger Kampftest deterministisch gemacht (BUG-049). Grün auf 8 Seeds und auf einem migrierten alten Stand.
- Durchgespielt über die Oberfläche (E, Dialogknöpfe, Tasten 1–3): beide Pfade bis zur Titelklasse.

## Session 3 — 2026-09-25 · Phase 5: Visual Style Revision, Phase 15: Tagesablauf benannter Figuren

### Phase 6 — Kampfgefühl & Animation
- Taumeln (BUG-043): das Datenfeld `stagger` (Streitkolben) war ohne Wirkung, nur der Boss konnte taumeln. Jetzt je
  Waffenklasse (`FEEL.stag`, Kolben aus seinem Datenwert): Schwert ~90 ms, Axt ~180, Kolben/Zweihänder ~250 ms ohne
  KI-Entscheidung; ab Axt unterbricht ein Treffer die Angriffsansage („Unterbrochen“). Dolch/Bogen lassen nicht taumeln
  (Dolch schlägt alle 300 ms — sonst Dauerlähmung). Spieler und Gefährten taumeln nie (Steuerung bleibt direkt).
  Kampfsimulation 6×5 Duelle gegen Banditen: Gegner 8–14 % der Zeit taumelnd, keine Dauerlähmung.
- Rückstoß rutscht (~140 ms, abklingend) statt in einem Frame zu springen; Stärke nach Waffengewicht.
- Interaktionen mit Körpersprache (§26): Durchsuchen/Sammeln/Grab = knien, Holz/Stein/Erz = zwei Arbeitshiebe mit der
  Waffe, Beten = längeres Knien, Aufstehen nach dem Niederschlag = Knie → wankend. Rein sichtbar, blockiert nichts;
  Laufen oder Angreifen bricht die Pose sofort ab. Bild `anim-nachher-interaktion.png`.
- Treffer-Klang nach Waffenmaterial (sfx.js): Klinge (Zisch), Wucht (tiefer Schlag + Knacken), Stich (kurz, trocken),
  Metall am Ziel (Soldat, Goblin-Krieger, Gorak, gepanzerter Spieler) scheppert zusätzlich; eigener Klang fürs
  Unterbrechen. Vorher klangen alle Waffen gleich (nur Tonhöhe nach Gewicht). Nur synthetisch geprüft (fehlerfrei),
  nicht angehört — bitte beim Spielen gegenhören.
- Selbsttest 44 → 46 (Taumeln/Rückstoß, Interaktionsposen).

### Mobil (BUG-012)
- Touch-Steuerung (`bindTouch`, `touchAim`, `#touchui`): Stick, Hieb/Rolle/E im Stil der Paneele; Auto-Zielen.
  `setPointerCapture` abgesichert (ein Fehler dort hätte die Eingabe verschluckt).
- Menüleiste: „Aufträge“ und „Optionen“ ergänzt — ohne Tastatur waren sie unerreichbar.

### Figuren mit Namen (game.js `NPC_DAY`, `assignNpcDays`)
- Arbeitsplatz, Feierabend (`till`), Abendort und Zuhause je Figur, an echte Häuser gebunden; freie Innenkacheln je Haus
  (niemand stapelt sich). Läuft bei Neustart und bei jedem Laden (alte Stände bekommen es automatisch).
- `think()`: Feierabend je Figur statt fest 18 Uhr; drinnen kleine Schritte (`in`-Ziele), draußen normale Streuung.
- Läden: nach Feierabend „Der Laden ist zu. Komm morgen früh wieder.“
- Selbsttest: „Figuren mit Namen: Nachtplatz im eigenen Haus …“ (44/44).


### Fels & Gelände (render.js `paintRock`, sprites.js `scree`)
- Fels wird als Masse gemalt statt als Kachelblock (BUG-035): weiches Feld aus bilinearer Kachelbelegung + Rauschen →
  runde Ecken, ausgefranste Kanten, Einzelkacheln werden Findlinge. Kuppe mit Relief (Licht links oben), Risse,
  Südwand mit Schichtung, Schlagschatten, Geröll am Fuß. Gestein je Region (Sandstein Wüste, Granit + Schneefelder im
  Gebirge, Basalt Ödland …). Kollision unverändert (Kacheln), keine Welt-/Speicheränderung.
- Performance: Rauschgitter je Chunk vorab gehasht, Fels auf eigener Ebene statt Rücklesen des Chunks, Chunks am
  Sichtrand werden vorab gebacken (höchstens einer pro Frame) — Laufen durchs Gebirge ohne Backruckler.
- Losen Felsbrocken (`rock_node`/`ore_node`): 3 Formvarianten mit Facetten, Regionsgestein, Schnee/Moos, Erzader,
  abgebaut = Schutthaufen (war ein einfarbiges Vieleck — Platzhalter nach §22).
- Hochgebirge: Boden (STONE) außerhalb von Siedlungen als Geröll statt als Straßenpflaster.
- Wasser mit demselben weichen Feld (`softField`, aus `paintRock` herausgelöst — kein Refactoring im Sinne §2, nur
  gemeinsame Nutzung): runde Ufer statt Kachelquadrate, Tiefe mit Dithering, Schaumkante, nasser Ufersaum,
  Schilf, Seerosen im Sumpf, Palette je Region und eigene Palette für die Südsee. Die alte Uferstrich-Kante entfällt;
  Wellenlinien nur noch im offenen Wasser.
- Boden pro Pixel (`bakeGround`): Grenzen natürlicher Böden (Gras, Erde, Weg, Sumpf, Sand, Asche) werden je Pixel
  aus den vier Kachelmitten + Rauschen entschieden → ausgefranste, runde Übergänge statt Kachelkanten; Graskante mit
  Halmlicht. Helligkeit (Wiese/Senke) und Regionstönung als 1-Pixel-je-Kachel-Bild weich hochskaliert — das
  Kachel-Schachbrett im Gras ist weg. Pflaster, Dielen, Acker, Mauern bleiben hart. Die alte Fransen-Logik (`FRAY`)
  entfällt (ersetzt, nicht umgebaut: sie arbeitete nur entlang gerader Kachelkanten).
- Vorausbacken der Chunks am Sichtrand in der Leerlaufzeit (`requestIdleCallback`) statt im Frame.
- Grube: Höhlenwände (DWALL) mit dem Fels-Zeichner als Höhlenfels (eigene Palette, Wand nach Süden, Schatten),
  Minenboden als Geröll statt Pflaster — die Grube war ein Raster aus Ziegelstreifen (BUG-042).
- Mauern mit Höhe (`paintWalls`): Quaderfront nach Süden, Kantenlicht, Zinnen an offenen Seiten freistehender
  Mauern (Hauswände ohne Zinnen) — Stadtmauern sahen wie Pflaster aus (BUG-041).
- Titelbild (BUG-016) als Pixel-Szene statt Vektorflächen; Himmel/Feste als gecachte Ebenen, animiert nur Wolken,
  Fenster, Banner, Feuer, Funken, Gras.
- §25 Stil-Testbereich: `RF.styleArea()` (nur `?dev`), Spiel pausiert dort; `save()` speichert nie auf Testkarten
  (`__…`), damit ein Autosave dort keinen kaputten Stand erzeugt.

## Session 2 — 2026-09-25 · Dächer & Städteausbau

### Gebäude (buildings.js)
- Dächer: Giebel nach vorn statt Walm-/Traufplatte (BUG-028). Kein Refactoring im Sinne §2 — Neuzeichnung des
  Dach-Abschnitts, Schnittstellen (`houseSprite`, `houseDims`, `chimneyOf`) unverändert; neu `gableOf`.
- Moos/Nässe als unregelmäßige Flecken statt Rechtecke.
- 7 neue Gebäudetypen mit eigener Silhouette/Funktion: Kate (geflicktes Dach), Bürgerhaus (zwei Geschosse),
  Bäckerei (Backofen, Brotschild), Scheune (Scheunentor mit Z-Streben, Heuluke, Heu), Stall (Stalltüren), Lagerhaus
  (Ladeluke, Ladebalken mit Seil und Sack), Fischerhütte (Netze). Je Typ Innenausstattung (`FURNISH`).
- Farbvariation je Haus aus der Materialfamilie (`ROOF_VAR`/`WALL_VAR`) — Nachbarn sind keine Klone (§20).

### Verfall & Stilvarianten (Nutzerwunsch „dystopisch, teils zerstört“)
- `wearOf(b)`: 0 gepflegt, 1 heruntergekommen (Risse, abgeplatzter Putz, vernageltes Fenster, fehlende Dachdeckung),
  2 verlassen (eingebrochenes Dach mit offenen Sparren, Ruß über den Fenstern, vernagelte Tür, eingestürzter Schornstein,
  Schutt, Ranken). Anteil je Ort (Aschfurt/Kreuzweg am stärksten, Sonnwacht kaum); Betriebe verfallen nie ganz.
  Einzelne Ruinen bewusst gesetzt (ausgebrannte Kate in Aschfurt, Speicher am Salzhafener Kai, Kate in Kreuzweg).
- Folgen im Spiel: verlassene Häuser ohne Bewohner, ohne Licht und Rauch; innen Schutt statt Möbel.
- Stil je Haus: Dachneigung variiert, Dachgauben, Vordächer über Türen, Bruchsteinsockel unter Holz/Fachwerk/Putz.

### Siedlungen (world.js `TOWN_PLAN`, `expandTowns`, `townAt`)
- Alle 6 Siedlungen ausgebaut: 23 → 104 Gebäude. Eren (Dorf, Felder, Scheunen), Nordfurt (ummauerte Stadt, 4 Tore,
  Markt), Salzhafen (bis zur Küste, Kai, Stege, Boote), Kreuzweg (vier Viertel, Marktplatz, Stall), Aschfurt (Vorstadt
  hinter Palisaden, Karawanenhof, Nord-/Westtor), Sonnwacht (Komturei in der Feste, Unterstadt).
- Ausbau läuft am Ende von `genWorld` ohne `rnd()` → Zufallsfolge der restlichen Welt unverändert (BUG-027 bleibt gelöst).
- Aufräumen: Wildnis-Streugut raus, Felsen im Festungskern repariert (BUG-033/034). `locAt` kennt die Stadtflächen.
- Neue Props: Heuballen, Fischerboot, Netzgestell, Wäscheleine, Tränke, Laterne (leuchtet nachts); Palisade als
  angespitzte Stämme statt Zaun. Scheunen/Ställe ohne Fenster werfen nachts kein Fensterlicht.

### Leben (game.js)
- `spawnResidents`: ~100 Bewohner mit Beruf, Begrüßung, Tagesablauf (BUG-008, BUG-013 teilweise); Ortsgerüchte je Stadt.
- Wachposten an die neuen Tore verlegt, 17 → 25 Wachen; `spawnGuardPosts` idempotent (verlegt vorhandene Wachen).
- Gegner-Spawns nie in Siedlungen (+4 Kacheln Rand) (BUG-032).
- Migration `flags.gen3`: alte Spielstände übernehmen neue Viertel, Figuren in Mauern treten heraus, Wachen ziehen um,
  Bewohner ziehen ein, ruhende Gegner in Städten verschwinden. Mit einem echten Spielstand geprüft.
- `newGame({ seed })` optional (reproduzierbare Tests).
- Selbsttest 37 → 41: Türen erreichbar, keine Wildnis-Streu, Bewohner wohnen im eigenen Haus, keine Gegner in Städten.

## Session 1 — 2026-09-24 · Phasen 0–3

### Phase 0 — Durchspielen & Audit
- `docs/` angelegt: BUGS, GDD, CHANGELOG, SESSION_LOG, PHASE_STATUS, STYLE_GUIDE, DATA_SCHEMAS.
- Entwicklerzugang `?dev` → `window.RF` (Zustand, `tick(ms)` für Simulation bei verstecktem Tab, Kernfunktionen).
  Grund: KI- und Übergangsfälle lassen sich sonst nicht reproduzierbar im Browser testen.

### Phase 1 — Kritische Fehler
- **Tod/Boden terminal** (BUG-001): neuer einziger KI-Einstieg `think(e, dt)`; `downed()`/`die()` räumen Kampfzustand
  auf; kein Resthieb am Boden. Refactoring-Grund: Punkt 2 (gleiche Fehlerart in drei Zweigen von `updateNpc`) —
  eine Sperre an der gemeinsamen Stelle statt drei Einzel-Flicken.
- **Aufhelfen nur durch Nicht-Feinde** (BUG-002), **Gnadenstoß** auf gestürzte Feinde (BUG-019), Pfeile fliegen über Liegende.
- **Zorn mit Leine** (BUG-004): Spur verloren (12 Spielmin.) / Leine 640 px / Spieler überwältigt → Buße 30 Gold statt Tod.
- **Szenenübergänge** (BUG-003): `MONSTERS.interiors`; Verfolger folgen durch die Tür nach Laufzeit, Tiere lauern
  90 Spielmin., Gorak hält seine Halle. Fristen auf der Spieluhr `clock()` (Außenwelt ruht, solange man innen ist).
  Feste Ankunftspunkte (BUG-015).
- **Erbe mit eigener Habe** (BUG-005): `kinKit()`.
- Charaktererstellung: deutsche Fertigkeitsnamen (`SKILL_NAMES` in data.js, BUG-014).
- `solidPropAt` robust für Karten ohne Objekt-Index.
- `log`/`chronicle` schweigen im Selbsttest-Sandkasten (`S._quiet`).

### Phase 2 — Weltlogik & NPC-Reaktionen
- Wachen alarmieren Wachen (480 px), eilen aus 700 px herbei; Wachen/Verteidiger/Heilerin richten den bewusstlosen
  Spieler auf; Zivilisten holen die nächste Wache (einer genügt).
- Händler schließen den Stand bei Kampf in der Nähe; nach Angriff bis morgen (BUG-020).
- Gegner-Gruppen: Gleiche derselben Fraktion < 240 px übernehmen das Ziel (Rudel/Bande).
- Bluttat (`bloodshed`): Zeugen meiden den Spieler 1 Tag, Wachen werden zornig (bei Unschuldigen), Gruppe −10 Moral.
- Provokation: Gruppe kommentiert, −5 Moral.
- Dialog-Sperren für Zornige/Fliehende/Kämpfende, kalter Ton bei schlechter Beziehung (BUG-021).
- Rollen: Verteidiger (Borin, Kelan, Aldric, Tomas; Leine 360 px, Schützen halten Abstand), Heilerin kämpft nie (BUG-022).
- Wachposten je Siedlung (18 Wachen; Valen/Söldner/Orden mit eigener Ausrüstung und Farbe, neue Sprite-Berufe
  Torwache/Söldnerwache/Ordenswache), Nachrüstung alter Spielstände (BUG-023).

### Phase 3 — Übergänge, Wegfindung, Spawns
- `seek()` + `findPath()` (A* auf Kacheln, gecacht) für alle Verfolgungs-, Hilfe- und Wanderbewegungen (BUG-010).
- Spawns nie in festen Objekten; Eingeklemmte kommen frei (BUG-024).
- Reise-Begegnungen erscheinen knapp außerhalb des Bildes; Ruhezeit je Region (Heimat 40 s, Wildnis 26 s,
  Ödland 20 s, Totenreich 14 s).
- Gruppe greift den nächsten statt den ersten Feind der Liste an.

### Phase 4 — Gebäude & Props
- Neues Modul `src/buildings.js` (Refactoring-Grund: Punkt 1 — Gebäude existierten nur als Kacheln; Funktion,
  Material und Innenraum ließen sich ohne Datensatz nicht ausdrücken). Pixel-Art im bestehenden Rampen-/Kontursystem.
- `house()` in world.js legt einen `HOUSES`-Datensatz an (Typ, Stadt, Tür) und möbliert nach Funktion (`FURNISH`).
  21 Gebäude typisiert: Taverne, Schmiede, Heilerhaus, Vorsteherhaus, Kontor, Wachhaus, Kapelle, Söldnerhalle, Wohnhaus.
- Bauweise je Stadt: Eren Stroh/Fachwerk · Nordfurt Schindel/Stein · Salzhafen Ziegel/Putz · Kreuzweg Schindel/Holz ·
  Aschfurt Schiefer/Stein · Sonnwacht Schiefer/heller Stein. Banner je Herrschaft (Valen/Orden/Händler).
- Renderer: Gebäude y-sortiert an der Grundlinie, Dach blendet beim Betreten aus, Schornsteinrauch, nachts Fensterlicht
  auf der Straße; Hinweis beim Betreten („Taverne · Eren“). `sprites.js` exportiert `G`/`toCanvas`.
- Neue Props: Tisch, Bank, Bett, Etagenbett, Regal, Herdfeuer, Esse (flackern, leuchten), Theke, Schreibpult, Werkbank,
  Fassgestell, Waffenständer, Altar, Sack, Kistenstapel; Kiste/Fass je 3 Varianten, Truhe/Kiste offen/geschlossen.
- Städte: Warenstapel statt Zufallskisten; Schilder/Amboss nicht mehr vor Türen. Wildnis: Truhen als Mini-Szenen.
- Alte Spielstände: Siedlungs-Props einmalig neu ausgestattet (`flags.gen2`), Zufallsfolge der Generierung bleibt
  identisch (BUG-027), Salzhafen ohne Sumpflöcher (BUG-025).

### Performance
- Kämpferliste je Frame auf den Umkreis des Spielers (1700 px) begrenzt: Eren-Update 3,2 → 2,2 ms, Wald 4,3 → 2,4 ms.
- Lichtquellen je Karte gecacht (statt ~6500 Objekte pro Bild): Eren-Zeichnen 2,9 → 1,8 ms.
- `moveEnt` prüft „stecke ich fest?“ nur bei Blockade.

### Tests
Selbsttest 22 → 37 Prüfungen (alle bestanden, 10–15 Wiederholungen stabil). Gegenprobe: Mit wieder eingebautem
BUG-001 bzw. BUG-002 schlagen die jeweiligen Tests fehl.
