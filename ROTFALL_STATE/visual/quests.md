# Visueller Umbau — Priorität 2: QUESTS (Analyst A, 02.10.2026)

Status: **ANALYSE — WAITING_FOR_DEVELOPER** (kein Spielcode geändert). Ablauf nach VISUAL.md §2, Gate nach GATE.md §8.
Skala: **++** passt sehr · **+** passt · **o** neutral/teuer · **−** passt nicht. Maßstab wie in `dialoge.md` (dunkler Pixelstil im Code, Canvas-Renderer, persistente simulierte Welt, keine Bildgeneratoren).

Zwei Auftragsarten im Code, beide müssen bedient werden:
- **Feste Aufträge** `QUESTS` (data.js, Geber `giver`, Ziele `objectives` mit `type` kill/item/find/custom, Lohn `reward`), Zustand `S.quests[k] = {state, progress, outcome}`; Annahme `offerQuest`/`startQuest`, Abgabe `turnIn`.
- **Verträge** `S.contracts` (Brett `giver:'board'`, Wache `'vm'`, Bewohner nach Beruf `PROF_CON`), als dynamische Quest `c_<id>` registriert (`questOf`, `registerContracts`); `acceptContract`, `conProgress`, `claimContract`, `failContract`; höchstens `CON_MAX` = 5, Fristen `CON_DAYS`.
Feste Regeln, die jede Darstellung achten muss: Auf **Sehr schwer** haben Bewohner-Verträge weder Namen noch Wegpunkt (`conHard`). **Suchaufträge** (`find`) zeigen bewusst kein Ziel (`questPoint` → null). Das Brett ist bei Besatzung oder Hass geschlossen (`boardShut`). Verfolgt wird ein Auftrag (`S.track`), der Kompass zeigt nur in der Oberwelt (`drawTrack`).

Teilelemente: Q1 Questgeber in der Welt · Q2 Annahme · Q3 Anschlagbrett · Q4 Tracker · Q5 Ziele und Fortschritt · Q6 Zielmarker Welt und Karte · Q7 Abschluss · Q8 Belohnung · Q9 Scheitern und Frist · Q10 Welt-Ereignis-Ansage · Q11 Auftragsbuch.

---

## Q1 — Questgeber in der Welt (I-19)

**Problem heute:** Nichts über dem Kopf. Wer etwas zu vergeben hat oder auf eine Abgabe wartet, erfährt man nur durch Ansprechen oder über die Liste „Bietet: …“ im Kontextfeld nach Rechtsklick (`npcOffers`).

**Inspiration:** WoW (Symbol über dem Geber, anders für „abgeben“) · Guild Wars 2 (Herz-Gebiete, Helfer mit Symbol erst in der Nähe) · Stardew (Ausrufezeichen am Brett) · Kenshi/M&B (kein Symbol — man fragt herum) · Albion (Symbol auf der Minikarte).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Wachssiegel über dem Kopf**: Pixel-Siegel in Gold = Auftrag frei, Siegel mit Haken/heller = Abgabe bereit; nur in Sichtweite. | ++ Formensprache ROTFALL (Siegel, Raute), wenig Text |
| 2 | **Klassisches „!“/„?“**. | o sofort verständlich, wirkt fremd im dunklen Stil |
| 3 | **Geber zeigt** in Abständen mit `zeigen` oder hält einen Zettel (Geste/Requisit). | + diegetisch; allein zu leise |
| 4 | **Nur Minikarte/Weltkarte** markieren, nicht im Bild. | + Kenshi-nah, aber Spieler in der Stadt findet niemanden |
| 5 | **Nur bei Nähe** (Hover/Prompt-Abstand) erscheint das Siegel. | + reduziert Symbolwald in Städten |
| 6 | **Lichtsäule/Glimmen** um den Geber. | − magisch-bunt, Bruch mit dunklem Stil |
| 7 | **Bewohner rufen** (Blase „He, du! Hast du kurz?“), wenn man vorbeigeht. | + lebendig; nutzt `e.talk`; darf nicht nerven |
| 8 | **Farbige Raute wie `facPip`** in Fraktionsfarbe des Auftrags. | + einheitlich; verwechselbar mit Gegner-Raute |
| 9 | **Kein Zeichen, aber Prompt** „E Sprechen — Name · Auftrag“. | + billig, Ergänzung |
| 10 | **Schwierigkeitsabhängig**: auf Sehr schwer keine Geber-Zeichen für Bewohner-Verträge. | ++ Pflicht wegen `conHard` |

**Wahl:** 1 + 5 + 9 + 10, dazu 7 sparsam (nur einmal je Geber und Tag; Häufigkeit offen). Das Siegel folgt denselben Bedingungen wie `talk` (`questAvailable`, `questComplete`, `boardShut`, Stigma, Pakt mit dem Orden).

---

## Q2 — Annahme (I-20, I-21)

**Problem heute:** `offerQuest` zeigt den Beschreibungstext und „Ich mache es.“; danach Log, Chronik und Toast „Auftrag: X“. Verträge zeigen Text plus „Lohn: X Gold · Frist N Tage“. Ziel, Ort und Gegner sieht man nicht.

**Inspiration:** Diablo/PoE (Auftrag als Karte mit Zielzeile) · Darkest Dungeon (Expedition mit Symbolen für Gegner, Dauer, Lohn) · Battle Brothers (Vertrag als Pergament mit Siegel, Lohn verhandelbar) · Hades (Annahme mit kurzem Glanz und Klang).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Auftragsbrief in der Dialogleiste**: Titel, Ziel-Piktogramme (Gegnerbild aus `drawMonsterTo`, Item-Icon, Auge für Suche), Ortsname, Frist als Sanduhr. | ++ nutzt vorhandene Zeichner |
| 2 | **Siegel-Stempel bei Annahme** (Siegel fällt auf den Brief, Klang), dann **fliegt der Brief zum Reiter „Aufträge“** der Kopfleiste. | ++ ersetzt Toast durch Bewegung |
| 3 | **Ziel-Vorschau auf Mini-Karte** im Brief (Ausschnitt um `questPoint`). | + stark; nicht bei Suchaufträgen/Sehr schwer |
| 4 | **NPC übergibt etwas** (Geste `zeigen`, Paket-Icon wandert in die Tasche) bei Lieferaufträgen. | + diegetisch, nur für `deliver` |
| 5 | **Lohn verhandeln** (Battle Brothers). | − neue Spielregel, nicht Darstellung |
| 6 | **Vollbild-Pergament** für jeden Auftrag. | − zu schwer für Alltagsverträge; Lesefenster-Regel |
| 7 | **Kurzer Kamera-Schwenk zum Ziel** nach Annahme. | o eindrucksvoll, aber Teleport/`S.cine`; nur Story |
| 8 | **Steckbrief mit Gesicht** (vorhanden `eliteFace`) für alle Kopfgelder erweitern (normale Anführer). | + Vorhandenes ausbauen |
| 9 | **Tracker blinkt auf** mit dem neuen Auftrag (Q4). | + verbindet Annahme und Tracker |
| 10 | **Gefährten reagieren** (Blase/Geste) auf gefährliche Aufträge. | o nett, später |

**Wahl:** 1 + 2 + 8 + 9, 3 nur wo `questPoint` ein Ziel liefert und `conHard` falsch ist. Lohnzeile im Brief: siehe Q8 und Q-OE2.

---

## Q3 — Anschlagbrett (I-22, I-23, I-24)

**Problem heute:** Das Brett ist ein Holzschild mit drei festen Strichen (`render.js` case `board`), gleich ob voll oder leer. „E Anschlagbrett lesen“ öffnet eine Dialogliste „Zettel, Siegel, Kopfgelder:“ (`boardMenu` → `conList`). Nur Elite-Steckbriefe zeigen ein Gesicht.

**Inspiration (VISUAL.md §2 nennt selbst zehn Richtungen):** klassisches Board (WoW/ESO) · Holzbrett mit Zetteln (Stardew, Witcher) · animiertes Board · NPC-Verwalter (Kopfgeldmeister) · Stadtkarte mit Missionen (Darkest Dungeon-Weiler) · Fraktionsboard (GW2) · Steckbriefe (Red Dead) · animierte Pergamente · Quest-Terminal für Aurelion · Hybrid Board + Weltkarte.

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Klassisches Board-Fenster**: Liste mit Titel, Lohn, Ort. | o heute fast so, nur hübscher |
| 2 | **Holzbrett mit Zetteln** (eigene Ansicht: Holzgrund, je Vertrag ein Zettel, schief angeheftet; Steckbriefe mit Gesicht; Klick nimmt Zettel ab). | ++ Kernbild |
| 3 | **Animiertes Board**: Zettel flattern im Wind/Wetter (`S.weather`), abgerissene Ecken bei alten Angeboten. | + Atmosphäre, Zusatz zu 2 |
| 4 | **NPC-Verwalter** (Ausrufer am Brett) liest vor. | o lebendig, aber es gibt schon Verteidigungsmeister (`vm`) |
| 5 | **Stadtkarte mit Missionen**: Stadtplan, Nadeln für Ziele. | + gut für Patrouille/Lager; groß |
| 6 | **Fraktionsboard**: Siegel der Stadtmacht oben, Zettel tragen ihr Wappen. | + zeigt, wem man dient (Ruf geht an `townFac`) |
| 7 | **Schwarzes Brett der Steckbriefe** (Kopfgelder getrennt). | + bei vielen Kopfgeldern |
| 8 | **Animierte Pergamente**, die sich entrollen. | o Bewegung ohne Mehrwert |
| 9 | **Quest-Terminal in Aurelion** (Messingtafel, Ziffernrollen, Uhrwerk). | + Weltidentität Aurelion; nur Haut |
| 10 | **Hybrid Board + Weltkarte**: Zettel links, rechts Kartenausschnitt mit Nadel des gewählten Zettels. | ++ verbindet Brett und Ort |

**Zusatz Weltobjekt:** Das Brett-Prop zeigt **so viele Zettel, wie Angebote hängen** (0 = leer, besetzt = abgerissene Fetzen, `boardShut`).

**Wahl:** 2 + 3 (Wetter leicht) + 6 + 10, Weltobjekt mit Zettelzahl; 9 als Haut für Aurelion, falls gewünscht (Q-OE6). Die Liste bleibt intern bestehen (Proben/Koop greifen auf `conList`-Texte zu) — die Brettansicht ist eine neue Darstellung derselben Daten.

---

## Q4 — Tracker (I-25, I-26)

**Problem heute:** Rechts im Kontextfeld „Name 2/3“ plus Ort/Entfernung und Frist als Zeile, „◆“ für verfolgt. Unter 1180 px ist die Spalte weg. Auf dem Spielfeld nur der Kompass für einen Auftrag (`drawTrack`).

**Inspiration:** WoW/ESO (Tracker-Liste am Rand) · Guild Wars 2 (Ereignis-Box mit Fortschrittsbalken) · Hades (fast kein Tracker, Ziel ist klar) · Diablo IV (Ziel-Zeile mit Symbol) · Darkest Dungeon (Fortschrittsleiste der Expedition).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Kleine Tracker-Karte über dem Spielfeld** (oben rechts): Siegel, Kurztitel, Ziel-Piktogramm, Fortschritt als Kerben ●●○, Richtungspfeil + Entfernung. | ++ immer sichtbar, auch ohne rechte Spalte |
| 2 | **Fortschritt als Kerben/Pips** statt „2/3“ (auch im Kontextfeld). | ++ billig |
| 3 | **Nur Kompass**, keine Liste. | + Hades-nah; zu wenig bei 5 Verträgen |
| 4 | **Ring am Porträt** (Fortschritt des verfolgten Auftrags). | o versteckt |
| 5 | **Mehrere Aufträge gleichzeitig** im Tracker (kompakt, nur Symbol + Kerben). | + Übersicht; Anzahl offen |
| 6 | **Tracker blendet im Kampf aus** (Platz). | + Ruhe im Kampf |
| 7 | **Distanz als Schritte/Gehminuten** statt Metern. | o Geschmack |
| 8 | **Frist als brennende Lunte/Sanduhr** im Tracker. | + Zeitdruck spürbar (Q9) |
| 9 | **Klick auf Tracker** öffnet Auftragsbuch an der Stelle, Rechtsklick wechselt verfolgten Auftrag. | + Bedienung |
| 10 | **Diegetisch**: Held hält beim Stehenbleiben den Brief in der Hand. | o hübsch, wenig Information |

**Wahl:** 1 + 2 + 6 + 8 + 9, 5 mit Obergrenze (Q-OE4). Kontextfeld bekommt dieselben Kerben (2).

---

## Q5 — Ziele und Fortschritt (I-27)

**Problem heute:** `onKill`/`onItemGained`/`conProgress` schreiben „Name: 2/3“ ins Log. Im Spiel passiert nichts, wenn der zweite Wolf fällt.

**Inspiration:** GW2 (Fortschrittsbalken springt, kleines Aufblitzen) · Diablo (Zähler am Bildrand) · Darkest Dungeon (Stempel) · Hades (Symbol über dem Gegner, der zählt).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Kerbe über der Leiche**: kleines Siegel mit Zähler steigt auf („2/3“ als Kerben) — `float` mit Symbol. | ++ Fortschritt dort, wo er passiert |
| 2 | **Zielgegner markiert** (dünne Siegel-Raute über Gegnern, die zählen). | + hilft; Symbolwald; nur verfolgter Auftrag |
| 3 | **Tracker-Kerbe füllt sich** mit kurzem Glanz. | ++ mit Q4 |
| 4 | **Klang je Kerbe** (leiser Ton, beim letzten tiefer). | + billig, kein Text |
| 5 | **Gegenstände fliegen zum Tracker**, wenn sie zählen (Kräuter). | + gut für `item`/`herbs` |
| 6 | **Letztes Ziel**: kurzer Zoom-Stoß (`cam.punch` wie Krit). | o kann mit Krit verwechselt werden |
| 7 | **Wegmarken (Patrouille/Spuren)** als Feuer/Fahne, die beim Erreichen angezündet/gesetzt wird. | ++ diegetisch, bleibt kurz in der Welt |
| 8 | **Banner/Text „2/3“ in Bildmitte**. | − Text, stört Kampf |
| 9 | **Fortschritt im Log bleibt**, aber mit Quest-Zeichen. | + vorhanden (`log_quest`) |
| 10 | **Gefährte kommentiert** („Noch einer!“). | o später |

**Wahl:** 1 + 3 + 4 + 5 + 7, 2 nur für den verfolgten Auftrag (Q-OE5). Log bleibt (9).

---

## Q6 — Zielmarker in Welt und Karte (I-26, I-33)

**Problem heute:** Kompass + Raute (gut). Auf der Weltkarte Rauten-Umriss + kursiver Name; Geber und „abgabebereit“ fehlen; Gebiete (Wolfsschlucht) sind ein Punkt.

**Inspiration:** GW2 (Gebietskreis statt Punkt) · Witcher (Suchkreis) · Albion/Runescape (Symbole auf Karte und Minikarte) · Kenshi (nur Ortsname).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Gebietskreis** statt Punkt bei Jagd/Monster/Lager (Radius aus `LOCATIONS.r`). | ++ ehrlicher als Punkt, verrät nicht zu viel |
| 2 | **Gefüllt vs. Umriss**: Umriss = Ziel offen, gefüllt = zurück zum Geber. | ++ ein Blick |
| 3 | **Geber auf der Karte** (Siegel), wenn bekannt (`S.codex.met`). | + mit Q1-10 (nicht Sehr schwer) |
| 4 | **Spurenpfad** (Fußabdrücke) bei Spurensuche. | + nur `trail`, nach Erreichen der Spur |
| 5 | **Kompass für mehrere Ziele** (kleinere Pfeile). | o Unruhe am Rand |
| 6 | **Minikarte zeigt Ziel/Geber**. | + Minikarte nutzt `drawAtlas`; Ort prüfen |
| 7 | **Lichtsäule am Ziel** im Bild. | − Stilbruch |
| 8 | **Wegweiser-Props** an Kreuzungen zeigen Richtung (diegetisch). | o schön, bestehende `waysign`-Props; aufwendig |
| 9 | **Kartenausschnitt im Auftragsbuch** (Q11). | + |
| 10 | **Raute pulsiert stärker bei Nähe**. | + kleine Verbesserung von `drawTrack` |

**Wahl:** 1 + 2 + 3 + 6 + 10, 4 für Spurensuche. Suchaufträge ohne Ziel bleiben ohne Marker (bestehende Regel).

---

## Q7 — Abschluss (I-28, I-29, I-34)

**Problem heute:** `turnIn` schreibt Lohnzeilen ins Log, die Chronik einen Eintrag und zeigt den Satz „Das war mehr, als ich erwartet habe.“ — **kein Toast, kein Bild**. `claimContract` meist nur Log.

**Inspiration:** WoW (Abschluss-Klang, Lohnfenster) · Hades (kurzer Glanz und Ton) · Darkest Dungeon (Stempel „Erfolg“) · Stardew (Geld zählt hoch) · M&B (Beziehungsmeldung mit Gesicht).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Siegel bricht / Stempel „Erfüllt“** auf dem Brief in der Dialogleiste, Klang (`bell` leise). | ++ Gegenstück zur Annahme (Q2-2) |
| 2 | **Namenskarte klein** („AUFTRAG ERFÜLLT“ + Titel) wie `nameCard`, kürzer. | + vorhandenes Werkzeug; wieder Text |
| 3 | **NPC-Geste** (`jubeln`, `salutieren`, bei Trauer-Aufträgen `trauern`) + Herz-Symbol. | ++ Körper statt Satz (D3) |
| 4 | **Lohn fliegt**: Münzen zum Goldzähler, Gegenstand zur Tasche, Wappen zum Reiter „Mächte“. | ++ Belohnung spürbar (Q8) |
| 5 | **Kurze Szene** (Regiebuch) bei großen Aufträgen. | + nur Story; `S.cine` |
| 6 | **Chronik-Seite blättert** kurz ein. | o Lesefenster, unterbricht |
| 7 | **Ort reagiert** (Bewohner jubeln kurz, wenn ein Stadtauftrag erfüllt ist). | + Welt reagiert; nur bei Verteidigung/Seuche sinnvoll |
| 8 | **Bildschirmblitz/Goldrand**. | − Kampf-Verwechslung |
| 9 | **Tracker-Karte zerfällt** in Funken. | + kleiner Abschluss im HUD |
| 10 | **Zeitlupe**. | − nur Heldentod/Boss |

**Wahl:** 1 + 3 + 4 + 9, 7 für Stadtaufträge (Verteidigung, Seuche, Heuschrecken). 5 nur für Story-Aufträge (Q-OE3).

---

## Q8 — Belohnung (I-28, I-29, I-36)

**Problem heute:** Lohn steht als einzelne Logzeilen („60 Gold erhalten.“, „Valen: +5 Ansehen.“, „Erhalten: X.“). Bei festen Aufträgen sieht man den Lohn vorher nicht; Verträge nennen Gold. Lohnkürzung (`claimContract`, Anteil < 100 %) nur als Satz.

**Inspiration:** Diablo/PoE (Lohnleiste mit Item-Rahmen nach Seltenheit) · Darkest Dungeon (Lohnsymbole) · GW2 (Lohn-Chips) · Hades (Lohnsymbol über der Tür vor dem Raum).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Lohnleiste** beim Abschluss: Münze + Zahl, Erfahrung (Balken springt), Wappen +N, Item-Icon mit Seltenheitsrahmen. | ++ Kern |
| 2 | **Lohnsymbole schon bei Annahme** (ohne Zahl): zeigt nur die Art. | + Hades-Muster; offene Frage, ob Lohn verraten wird |
| 3 | **Volle Vorschau mit Zahlen** bei Annahme. | o ändert Erwartung; Entscheidung |
| 4 | **Gekürzter Lohn sichtbar**: Münzstapel mit Anteil-Kreis („deine Arbeit“). | ++ erklärt Kürzung ohne Absatz |
| 5 | **Gold zählt hoch** in der Kopfleiste. | + billig |
| 6 | **Item fällt vor dem Geber** auf den Boden (Weltobjekt). | o Gefahr: Tasche voll, Proben |
| 7 | **Ruhm-Funken** (`addFame`) als Stern über dem Helden. | + verbindet Ruhm |
| 8 | **Beförderung als Wappen-Aufstieg** (Rangabzeichen steigt auf). | + für `promote`/`grantLegend` |
| 9 | **Belohnungstruhe** öffnen. | − passt nicht zu Gold-vom-Geber |
| 10 | **Erbe-Hinweis**: Ruhm bleibt dem Haus (kleines Hauswappen). | o thematisch, Text |

**Wahl:** 1 + 4 + 5 + 7 + 8; 2 oder 3 nach Q-OE2.

---

## Q9 — Scheitern und Frist (I-30, I-31)

**Problem heute:** „AUFTRAG GESCHEITERT“ als Toast, Grund im Log. Frist als „Frist: bis Tag N“, Angriff als „Angriff in ~1 Std 20 Min“.

**Inspiration:** Darkest Dungeon (Stempel „Gescheitert“) · Battle Brothers (Vertrag zerreißt) · Frostpunk (Frist als Uhr am Rand).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Brief zerreißt** im Tracker, Siegel bricht schwarz. | ++ Gegenstück zu Q7-1 |
| 2 | **Sanduhr/Lunte** im Tracker, die abbrennt; letzte Stunden rot. | ++ Zeitdruck ohne Zahl |
| 3 | **Geber reagiert** beim nächsten Treffen (Geste `abwehren`, kühle Blase). | + Welt erinnert sich; `S.trust` gibt es schon |
| 4 | **Toast bleibt**, nur Pixelsymbol davor. | o minimal |
| 5 | **Angriffs-Countdown als Trommel** (Klang lauter, je näher). | + für `defense`; Klang `drum` gibt es schon (sfx.js) |
| 6 | **Ort zeigt Folgen** (ignoriert: Wohlstand sinkt — Häuser verfallen sichtbar schon über `wearOf`). | + vorhanden, nur verknüpfen |
| 7 | **Rote Schrift im Tracker**. | o Farbe allein |
| 8 | **Kein Scheitern-Signal** (Kenshi). | − Spieler versteht Folgen nicht |
| 9 | **Chronik-Eintrag mit Gesicht** des Gebers. | o Lesefenster |
| 10 | **Tote Begleitperson**: Grab entsteht sichtbar (gibt es: `makeGrave`), Tracker zeigt Kreuz. | + verbindet vorhandene Gräber |

**Wahl:** 1 + 2 + 3 + 5 + 10.

---

## Q10 — Welt-Ereignis-Ansage (I-37, I-38, I-71)

**Problem heute:** `bigAnnounce` und `afterSay` zeigen den Titel in Versalien als Toast (2,8–3 s, überschreibt den vorigen) und schreiben einen langen Absatz ins Log. Wo es passiert, sieht man nicht. Nur Varonheim hat Szenen (`capitalScene`, Kamera nur bis 150 Felder Abstand).

**Inspiration:** Guild Wars 2 (Ereignis-Banner mit Ort, Gebiet auf der Karte) · Diablo IV/Weltbosse (Ansage mit Symbol, Ping auf der Karte) · RimWorld (Brief-Symbol am Rand, Klick springt zum Ort) · Darkest Dungeon (Herold-Stimme, kurzes Bild) · Mount & Blade (Meldung mit Wappen).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Herold-Banner**: Pixel-Ereignissymbol + kurzer Titel + Ortsname, fährt oben ein und bleibt kurz. | ++ ersetzt Versalien-Toast |
| 2 | **Brief am Rand** (RimWorld): Ereignis-Siegel stapelt sich am Rand, Klick öffnet Ortskarte (`mapPick`). | ++ nichts geht verloren (Toast-Problem I-73) |
| 3 | **Karten-Ping**: Kreis-Welle am Ort auf Minikarte und Weltkarte. | ++ Ort ohne Text |
| 4 | **Kamera-Schwenk** bei Nähe (Regel wie `capitalScene`). | + Entscheidung 01.10. „kurze Kamera bei Weltereignissen in Spielernähe“ vorhanden |
| 5 | **Glocke/Horn** je Ereignisart (Seuche Glocke, Turnier Fanfare, Überfall Horn). | + Klang; `horn` gibt es (in `capitalScene` benutzt), andere prüfen |
| 6 | **Herold-NPC** in Städten ruft das Ereignis aus (Blase). | + diegetisch; Herold existiert für Turnier |
| 7 | **Gerüchte** tragen es weiter (gibt es: `newsTalk`). | + vorhanden |
| 8 | **Vollbild-Titelkarte**. | − unterbricht, für 8 häufige Ereignisse zu viel |
| 9 | **Ereignis-Tracker** (Q4) mit Phase (Seuche Tag 3/8). | + wenn der Spieler teilnimmt |
| 10 | **Himmel/Licht ändert sich** im Gebiet (Seuche: grünlicher Dunst; Heuschrecken: Schwarm-Partikel). | + diegetisch; Grafikarbeit je Ereignis |

**Wahl:** 1 + 2 + 3 + 5, 4 mit der bestehenden Nähe-Regel, 9 ab Teilnahme. 10 als spätere Grafikscheibe. Gemeinsame Grundlage mit UI-Scheibe 4 (Meldungsfluss, Warteschlange) — nicht doppelt bauen.

---

## Q11 — Auftragsbuch (I-32)

**Problem heute:** `questUI` zeigt Textkarten (Beschreibung, „· Ziel 1/3“, Ziel/Frist als Zeile, Knöpfe). Entschieden (01.10.): Pergament für das Auftragsbuch.

**Inspiration:** Witcher (Tagebuch mit Abschnitten) · Pentiment (Handschrift-Pergament) · Darkest Dungeon (Weiler-Bücher) · Kenshi (bewusst schlicht).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Pergament-Doppelseite**: links Liste mit Siegeln (offen/bereit/erfüllt/zerrissen), rechts Brief des gewählten Auftrags. | ++ entspricht Entscheidung |
| 2 | **Kartenausschnitt** im Brief (wie Q2-3). | + |
| 3 | **Ziel-Piktogramme** wie in Q2. | ++ |
| 4 | **Geber-Porträt** im Brief. | + vorhanden (`drawPortraitTo`) |
| 5 | **Reiter nach Macht** (Valen, Orden …). | o viele Reiter |
| 6 | **Nur aktive**, Erledigtes in die Chronik. | + kürzer; Chronik zeigt schon Abschlüsse |
| 7 | **Handschrift-Schrift**. | − Lesbarkeit, neue Schrift |
| 8 | **Notizen des Spielers**. | o neue Funktion |
| 9 | **Filter nach Entfernung**. | + praktisch |
| 10 | **Vollbild-Kartenansicht** aller Aufträge. | o Weltkarte kann das |

**Wahl:** 1 + 2 + 3 + 4, 9 als Sortierung.

---

# FEATURE IMPACT REPORT — Quests (GATE.md §8)

**Feature:** Aufträge in der Welt sichtbar: Siegel über Gebern (Q1), Auftragsbrief mit Piktogrammen und Stempel (Q2), Brettansicht mit Zetteln und Kartenausschnitt, Brett-Prop zeigt Zettelzahl (Q3), Tracker-Karte mit Kerben, Pfeil und Frist (Q4), Fortschritt am Ort (Q5), Gebietskreis und Zustand auf Karte/Minikarte (Q6), Abschluss-Moment mit Geste und fliegendem Lohn (Q7/Q8), zerrissener Brief und Sanduhr (Q9), Herold-Banner, Randbriefe und Karten-Ping für Weltereignisse (Q10), Pergament-Auftragsbuch (Q11).

### Betroffene Systeme (grep-belegt)
| System | Funktionen / Stellen |
|---|---|
| Feste Aufträge | data.js `QUESTS`; game.js `questAvailable`, `startQuest`, `offerQuest`, `questComplete`, `turnIn`, `onKill`, `onItemGained`, `questCheck`, `cancelQuest`, `RANK_Q`, `promote` |
| Verträge | game.js `CON`, `PROF_CON`, `makeContract`, `townContracts`, `acceptContract`, `conProgress`, `claimContract`, `failContract`, `ignoredContract`, `conTick`, `questOf`, `registerContracts`, `conList`, `conChoices`, `resGiver`, `conHard`, `giverEnt`, `CON_MAX`, `CON_DAYS`, `eliteFace`, `surrenderOffer` |
| Brett | game.js `boardMenu`, `boardShut`, `boardTown`, `boardEntries`, `boardText`, `questGiverInfo`; Interaktion (`t.type === 'board'`); render.js `drawPropPixel` case `board` |
| Zielpunkte | game.js `questPoint`, `QUEST_WHERE`, `questInfo`, `S.track`, `R.setTrack` (update ~2570); render.js `drawTrack` |
| Karte | game.js `drawWorldmap`, `mapPick`, Minikarte über `drawAtlas` (atlas.js) |
| Tracker/HUD | ui.js `renderContext` (Block „Aufträge“), `refreshHUD`, `NAV` (Reiter `quest`), `paintNav`, `toast` |
| Auftragsbuch | ui.js `questUI`, Knöpfe `trackQuest`, `cancelQuest` |
| Weltereignisse | game.js `bigDay`, `BIG_START`, `bigAnnounce`, `bigTick`, `bigEnd`, `bigChoices`, `afterSay` (47×), `capitalScene`, `EVENTS`; sim.js Späher-Warnung |
| Lohn | game.js `gainXp`, `questGold`, `addItem`, `addFame`, `addRel`, `S.factions`, `grantLegend` |
| Darstellung | render.js `drawEntity` (npc), `drawFloats`, `drawBubble`; game.js `float`, `fx`, `gesture`, `nameCard`, `sfx` |
| Koop | coop.js `H.dialogue`, Auftrags-Rückfrage an den Host („Aufträge gelten für die ganze Gruppe“), Entity-Deltas |
| Proben | selftest u. a. Brett-Proben (`boardEntries('eren')`, `boardText('eren')`), Vertragsproben mit `pick1(t)` über `#dlg-choices` |

### Bereits vorhanden (wiederverwenden)
Kompass `drawTrack`; Rauten-Formensprache (`facPip`, Kartenraute); Steckbrief-Gesicht `eliteFace`; Gegnerbild `drawMonsterTo`; Item-Icon `drawItemIconTo`; Porträt; `nameCard`; Gesten; `float`; Ortskarte `mapPick`; Piktogramme (`log_quest`, `res_gold`, `time`, `sanduhr`, `muenzen`, `rolle`, `schaedel`, `karte`, `wappen`, `kreuz`, `stern`); Klänge `horn`, `bell`, `drum`, `chains`, `crack`, `heartbeat`; `capitalScene`-Nähe-Regel; `makeGrave`; Gebäudeverfall `wearOf`; Gerüchte `newsTalk`; `S.trust`.

### Fehlende Infrastruktur
1. **Geber-Status je NPC** als eine Funktion (frei / abgabebereit / nichts), die dieselben Bedingungen wie `talk` nutzt (`questAvailable`, `questComplete`, Vertrags-Abgabe in `conChoices`, `boardShut`, `stigmaOf`, Ordens-Pakt, `talky`), gecacht (nicht je Frame alle `QUESTS` prüfen).
2. **Weltzeichen über Köpfen** in render.js (eigene Zeichenstufe nach `drawEntity`, nur `shown`).
3. **Ziel-Piktogramm je Ziel** aus `objectives.type`/`CON`-Art (kill → Gegnerbild, item → Icon, find → Auge, custom → Art-Symbol).
4. **Tracker-Element über dem Spielfeld** (DOM oder Canvas), Platz mit Toast/Meldungsfluss (UI-Scheibe 4) und Boss-Balken abstimmen.
5. **Brettansicht**: neue Darstellung von `townContracts`-Daten (Fenster oder große Dialogleiste); Zettelzahl am Prop aus `townContracts` ohne Nebenwirkung lesen (Achtung: `townContracts` **würfelt neu**, wenn 3 Tage vorbei — das Prop darf nur zählen, nicht auffrischen).
6. **Ereignis-Briefe am Rand**: Warteschlange für `bigAnnounce`/`afterSay` (gleiche Grundlage wie UI-Scheibe 4).
7. **Karten-Ping** auf Welt- und Minikarte (flüchtig, nicht gespeichert).
8. **Lohn-Animation**: Ziel-Koordinaten der Kopfleisten-Elemente (Gold, Reiter) abfragen.

### OFFENE DESIGNENTSCHEIDUNGEN
- **Q-OE1 Wer bekommt ein Geber-Siegel?** Feste Aufträge (inkl. Rang-, Klassen-, Seevolk-Aufträge), Wache/Verteidigungsmeister, Bewohner-Verträge, Brett? Auf „Sehr schwer“ haben Bewohner-Verträge bewusst keinen Namen und Wegpunkt. *Empfehlung: Siegel für feste Aufträge, Wache und Brett immer; für Bewohner-Verträge auf Angsthase und Schwer ja, auf Sehr schwer nie (Regel `conHard` gilt dann auch für Siegel).*
- **Q-OE2 Lohn vor der Annahme zeigen?** Heute: feste Aufträge verbergen den Lohn, Verträge nennen Gold. *Empfehlung: bei festen Aufträgen nur die Art als Symbol (Gold, Gegenstand, Ruf bei Macht X) ohne Zahl; Verträge wie heute mit Gold.*
- **Q-OE3 Abschluss-Moment:** Darf er die Welt anhalten oder ein Regiebuch-Moment sein? Wie lang? Für welche Aufträge eine Szene? *Empfehlung: Welt läuft, Moment ≤ Länge eines Gesprächssatzes, keine Szene außer bei Story-Aufträgen, die eine eigene Szene schon haben.*
- **Q-OE4 Tracker-Umfang:** nur der verfolgte Auftrag oder mehrere (heute: Kompass für einen, rechte Liste für alle)? *Empfehlung: verfolgter Auftrag groß mit Kompass, bis zu drei weitere kompakt; im Kampf eingeklappt.*
- **Q-OE5 Zielgegner markieren?** VISUAL.md wünscht „besiegte Gegner zählen sichtbar“; Markierung *vor* dem Kill verrät mehr als heute. *Empfehlung: Zählkerbe nach dem Kill immer (Q5-1); Markierung vor dem Kill nur für den verfolgten Auftrag und nicht auf Sehr schwer.*
- **Q-OE6 Aurelion-Brett als Messing-Terminal** (eigene Haut) ja/nein? *Empfehlung: ja, als zweite Haut derselben Brettansicht, später.*
- **Q-OE7 Kamera bei großen Weltereignissen** (`BIG`): Gilt die vorhandene Nähe-Regel (150 Felder wie `capitalScene`) auch für Seuche, Turnier, Absturz usw.? *Empfehlung: ja, gleiche Regel, nur beim Start des Ereignisses, nie während Kampf.*
- **Q-OE8 Bewohner rufen den Helden** (Q1-7): Wie oft? *Empfehlung: einmal je Geber und Tag, nur bei freiem Auftrag.*

### Risiken
- **Verrat von Absicht:** Siegel, Gebietskreise und Kartengeber dürfen `conHard` und Suchaufträge (`find`) nicht aushebeln; Probe nötig.
- **Nebenwirkungen beim Zählen:** `townContracts` erzeugt und verwirft Angebote; das Brett-Prop darf es nicht aufrufen (sonst würfelt Hinsehen die Welt neu und verschiebt Zufall — Proben-Risiko laut CLAUDE.md).
- **Leistung:** Geber-Status nicht je Frame für alle NPC und alle 55 + Rang-Aufträge berechnen; Cache mit Ungültigmachung bei Questwechsel/Tagwechsel.
- **Proben:** Brett-Proben lesen `boardEntries`/`boardText` — bleiben bestehen; Vertragsproben klicken Dialogtexte — Brettansicht darf `conList` nicht ersetzen, nur ergänzen (oder Proben anpassen).
- **Koop:** Gäste sehen Siegel über Entity-Deltas nur, wenn der Status mitreist oder beim Gast berechnet werden kann (Gast hat `S.quests` des Hosts? — Engineer prüfen).
- **Speichern:** Keine neuen Pflichtfelder nötig; Pings/Animationen flüchtig. Falls „bereits gerufen heute“ (Q-OE8) gespeichert werden soll: Feld muss fehlen dürfen.
- **Toast-Konkurrenz:** Ereignis-Banner, Tracker, Boss-Balken und Meldungsfluss teilen sich den oberen Rand → ein Layout-Plan vor Bau (mit UI-Scheibe 4).
- **Sehr schwer / Kenshi-Härte:** Zu viel Führung nimmt Entdeckung; Abschaltbarkeit prüfen (Einstellung „Hinweise: viel/wenig“ — wäre selbst eine Entscheidung).

### Implementierungsplan in Scheiben
1. **Scheibe Q-1 (ohne offene Fragen):** Kerben statt „2/3“ im Kontextfeld und Auftragsbuch (Q4-2); Zählkerbe über der Leiche nach dem Kill + leiser Ton (Q5-1/4); Abschluss mit Stempel, NPC-Geste, Goldzähler (Q7-1/3, Q8-5); zerrissener Brief bei Scheitern (Q9-1). Probe: `turnIn` erzeugt genau einen Abschluss-Effekt, auch in Koop; `S._quiet` zeigt nichts. Debug: „Auftrag abschließen (mit Effekt)“. MECHANIKEN: Aufträge.
2. **Scheibe Q-2 (nach Q-OE1/Q-OE8):** Geber-Status-Funktion + Siegel über Köpfen + Prompt-Zusatz (Q1), Geber auf Karte/Minikarte (Q6-3/6). Proben: Sehr schwer → kein Siegel bei Bewohner-Vertrag; Suchauftrag ohne Ziel bleibt ohne Marker; Brett geschlossen → kein Siegel.
3. **Scheibe Q-3 (nach Q-OE2):** Auftragsbrief bei Annahme mit Piktogrammen, Stempel und Flug zum Reiter (Q2-1/2/9), Steckbriefe mit Gesicht für alle Kopfgelder (Q2-8), Lohnleiste beim Abschluss inkl. Anteil-Kreis (Q8-1/4).
4. **Scheibe Q-4 (nach Q-OE4/Q-OE5):** Tracker-Karte über dem Spielfeld mit Pfeil, Frist-Sanduhr, Klick ins Buch (Q4), Gebietskreis und Gefüllt/Umriss auf der Karte (Q6-1/2), Wegmarken für Patrouille/Spur (Q5-7).
5. **Scheibe Q-5:** Brettansicht mit Zetteln, Machtwappen, Kartenausschnitt; Brett-Prop mit Zettelzahl (Q3); optional Aurelion-Haut (Q-OE6).
6. **Scheibe Q-6 (mit UI-Scheibe 4, nach Q-OE7):** Herold-Banner, Randbriefe, Karten-Ping, Klang je Ereignisart, Kamera nach Nähe-Regel (Q10).
7. **Scheibe Q-7:** Pergament-Auftragsbuch (Q11, entschieden), Sortierung nach Entfernung.
Jede Scheibe: Parse-Check, `window.RF` vorhanden, Selbsttest vollständig grün, Spielstand-Sicherheit (Backup + `S._quiet`), Sichtprüfung vorher/nachher, Debug-Eintrag, `docs/MECHANIKEN.md`, Spielerhinweis im Spiel.
