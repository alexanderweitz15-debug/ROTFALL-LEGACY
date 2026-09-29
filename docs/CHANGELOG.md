# Changelog — Rotfall: Legacy

Neueste oben, höchstens 5 Zeilen je Session. Ausführlich bis S13: `archive/CHANGELOG_bis_S13.md`.

## Session 15 — 2026-09-29 · Titelklassen vertieft
- Titelgrade I–III: Taten sammeln, der Meister weiht; jeder Grad schaltet Fähigkeiten frei und zeigt sich an der Figur.
- Neu: Leichenbersten, Seelenfessel, Seuchenfluch, Obeliskentor, Dornenhaut, Wolfsgestalt, Gegenstrom, Stille Hand; Grabhieb.
- Je Titel ein zweiter Schlüsselknoten (Einsamer Rufer, Leeres Herz, Tier im Herzen, Sturmhand), der den ersten ausschließt.
- Todesritter über die Todesweihe erreichbar; Klassen-Guide im Kodex. Dazu Magitech-Unfall und Spuk am Brunnen.
- Stil R poliert (ruhige Lichtbänder, kein Pixelrauschen, Waffen −18 %, hellere Mitteltöne) und Klassen-Silhouetten: Totenkragen,
  Hörner, Geweih, kahler Mönch, Kessel mit Schloten, Dornenkrone, Seelenflammen; Rahmen 40 × 56.
- Geräteübergreifend spielen: Spielstand verschlüsselt (AES-256) exportieren und laden, Einstellungen → „Auf anderem Gerät weiterspielen“. Stil R ist Standard.
- Klassen-Rüstung nur über Questlines beim Meister (12 Aufträge), Verstärkung und neue Fähigkeit ab 2 Teilen; Klassenwechsel warnt,
  danach ist die Klasse verloren. NPCs fragen, was man weiß (13 Themen, Antworten je Fraktion und Beruf).
- P1 schwere Rüstung wuchtiger (Hüftplatten, Goldkanten, Kragen); P2 Beute: Boss-Pools, Hände/Beine/Talisman, 12 Talismane, 10 Elixiere, Sets mit 4 Teilen.
- Morrgrund, das letzte Goblin-Dorf, mit Dodon: Freund, Vorbeiziehender oder Feind; Questline bis zum Sturm auf Varg; stirbst du im Sturm, fällt das Dorf.
- P3 Kampfgefühl: schwere Angriffe mit roter Bodenmarkierung und Erholungsfenster; Wölfe gegen Banditen; Bogen mit Pfeil auf der Sehne.
- Bogen spannt sichtbar (Sehne an den echten Bogenspitzen). P4 Magie: 20 Zauber in 6 Schulen, Sammelzeit mit Rune, Zustände, Übungsränge,
  Zauberbuch (Z), Zauber auf der Leiste, zaubernde Kultisten und Nekromanten, Debug „Magie“. Neu: `MECHANIKEN.md` (alle Mechaniken).
- Stall-Fenster und Pferdehof (Hadubrand, Mühlbach), Totenross für Todesritter, Kodex schaltet sich im Spiel frei (Code NACHTGLAS).
- P13 Gesamtdurchlauf (neues Spiel bis Erbe, 13 Orte, Sammelbild `durchlauf_regionen.png`): keine Fehler; BUG-113 behoben
  (NPCs verbluten nicht mehr nach Kämpfen), BUG-142/143 neu.
- P17: Reittiere mit eigenen Werten (Tempo, Ausdauer, Mut), Anzeige im Gruppenfenster, Verstoßen.
- P19: Todesritter-Questreihe „Eidwacht“ bei Sael (drei Aufträge, Rüstung mit eigenem Aussehen, Todesmahr, Frostaura).
- P11: Wiederbesiedlung befreiter Orte in fünf Stufen (Heimkehrer, Zelte, Häuser, Dorf, Siedlung), in der Chronik.
- P12: Schwierigkeitsgrade beim Start (Gegner, Ansagen, Beute, Kopfgeld; Glieder und Dörfer wie gehabt).
- P9: flüchtiger Grubenarbeiter, Meteorsplitter, Erbfolgestreit, Kuh massiger (Wamme, Hörner, Euter).
- P8 Teil 2: Rangwege für Händler und Bande (Beitritt, je zwei Rangprüfungen), Kodex-Ränge für alle Fraktionen vollständig.
- P8 Teil 1: Ruhm je Region mit Stufen, Begrüßungen, Nachlass und früheren Kopfgeldjägern; Anzeige im Charakterfenster.
- P7 Teil 4: Magische Anomalie an Ley-Punkten (Mana doppelt, Zauber verrutschen, Schutzzauber schließt sie).
- P7 Teil 3: Artefakt-Konflikt um den Aurelioner Magiekern (Snikk, vier Abnehmer, zerschlagen, behalten).
- P7 Teil 2: Glaubensmagie (Irmgard, vier Zauber, heilig doppelt gegen Untote, stärker mit Kettenrang und Glauben).
- P7 Teil 1: verbotene Magie als Verbrechen, Magierjäger mit Bann, Haltung der Mächte zur Magie (`MAGIC_VIEW`).
- P6 fertig: Turm des Nachtglases (Wahrzeichen, zehn Ebenen, Krypta), Ilvar mit Vertrauen bis zur Endprüfung und dem legendären
  Zauber Nachtglas, Schule Schatten, Tuvi, Seelenkammer, Einsturz bei Ilvars Tod, Wachen am Weg.
- P4 fertig (Feuerwand, Eiswand, Brandfläche, Eisboden). P5: fünf Zauberlehrer mit Bedingungen, Kodex-Reiter „Magie“,
  vier Akademie-Prüfungen mit Rängen (Hörer, Adept, Magister).
- 9 Stadt-Lehrer, Lehrer auf Karte und im Kodex, Nachfolger für tote wichtige NPCs, Todesritter-Talentzweig, Auftragsziele kommen nach
  (Bug: nur 3 Grabräuber für 5; Untoten-Diener konnten Kultisten-Aufträge nicht erfüllen).
- Pferd pfeifen (R), Aufsitzen mit E, Pferd von vorn/hinten, Reitsitz; Ruf fürs Heilen von Dorfleuten und Verteidigen; Bug: Auftrag ließ sich mehrfach abgeben.

## Session 14 — 2026-09-28 · Mechanik-Check, schlanke Doku, Figuren neu
- Mechanik-Check (`design/mechanik-check.md`): 14 Funde behoben — Parade im Takt, Flächenangriffe nicht mehr blockbar,
  Rückwärtsreiten langsam, kein Beitritt bei Erzfeinden, Fest/Brett folgen Besatzung und Überfall, BUG-139 (Karrak).
- Doku verschlankt: Startlektüre ≤ 1.500 Wörter, Behobenes und Verlauf im Archiv.
- Stil R (optional, Optionen → Grafikstil „Gezeichnet (Test)“): Referenz 5 im Code nachgezeichnet (`fig5.js`) — Menschen,
  Berufe, Gegner, Untote, Tiere, Gorak, 52 Waffen im 1,5er-Raster; Arme im Bild, Hieb in Zehnteln, 19 Posen. Stil D bleibt Standard.
- Stil R, Runde 2 (Nutzer): Körperbau gemalt statt gestreckt (drahtig, bullig, hochgewachsen, gedrungen, Bauch, breites Schlüsselbein),
  Rüstung/Kleidung je Person verschieden (Muster, Schulterstücke, Armschienen, Borten, Farbstreuung), Waffen mit Schliff, Messing/Gold, Knaufstein.
- Stil R, Runde 3 (Nutzer): Träger schwerer Waffen breiter und muskulöser (Unterarme frei); Bauern nach Region — Westen (Omega):
  aschgrau, Haube/schwarzer Hut, Omega-Stern, roter Strick; Osten: Strohumhang oder Filzkappe, barfuß, Knochenamulett. Inventar-/Boden-Symbole aus den echten Sprites.
- Stil R, Runde 4: Häuser (satte Dächer, Deckung in Lagen, Fensterbank mit Lichtschein), Getreidefelder, Tiere mit eigener Anatomie
  (Kuh: Hörner, Euter, Flecken; Schaf: Wolle, dunkle Beine; Pferd: hoher Hals, Mähne, Schweif; Hufe), Props satter mit farbiger Kontur.
- Engel (Nutzer: breiter, gruseliger): breit gebaut, kein Helm, Porzellangesicht ohne Mund, drei Augen mit rinnendem Gold,
  größere Schwingen plus zweites Paar, Augen auf den Federn, die blinzeln (beide Stile).
- Später in S14: Glieder seltener verloren, fehlende Glieder sichtbar, ohne Arme kein Hieb, ohne Beine Kriechen (BUG-140); Kerker mit
  Dietrich-Minispiel (3 Dietriche), Insassen befreien und gemeinsam ausbrechen; 8 Endgame-Sets, hohe Tiere tragen sie; Stil R: Breite
  kommt aus der Rüstung (Rahmen 40 px, Lamellen, Panzerhandschuhe); Todesablauf, Block-Ruck, Taumeln; Startbild scharf; Debug-Menü erweitert.
- S14 zuletzt: Rang-Questlines (Valen, Orden, Tote, Kette); Nutztiere in der Wirtschaft + eigener Hof; Ladeprobe (fand BUG-141); **Seevolk**:
  Gischtinseln mit Tangkron, Überfahrt an Deck (Sturm, Entern), Salzbund gegen Sturmklinge, Weißbart mit Anker, Machtvakuum, Salzfrieden.

## Session 13b — 2026-09-28 · Aufträge, Transparenz, Reisen, Tiere
- Aufträge: Deckel 5, Fristen, Abbruch, Varianten und Wendungen, Spurensuche, Lager ausheben, Überlebende, Schmuggel, Rache-Kette, mehr Geber.
- Transparenz: Kodex (H), Effekte-Leiste und -Fenster, Ränge erklärt, Infofeld „Bietet“, Minikarte, Spielstand-Info.
- Welt: Stadtszenen, Reaktionen auf Leichen, Mächte handeln selbst, Kutschen und Fähren, Torprüfung Aurelion.
- Kampf und Inhalt: Gegnervarianten, Gewölbe mit Ebenen, elf Waffen, Fraktionssets, Kenshi-Fertigkeiten, Levelkurve.
- Tiere: Zähmen, Tierbegleiter, Tierhändler, Reittiere (Pferd, Messingross, Totenross), Kühe und Schafe. BUG-132–138.

## Session 13 — 2026-09-27 · Untote, Omega, Wirtschaft, Aurelion
- Möbel mit Funktion; Phase 6: zehn Untotenarten, Raids mit Rollen, Gruft des Toten Königs, Garmadon.
- Phase 7 Omega (Glaube, Spur des Rotfalls, Ritual, drei Enden); Phase 8 Stadtwachstum und Wirtschaft „tief“ (`economy.js`).
- Hoher Rat, Kamerafahrten, Fall der Untoten, Aurelion lebendig; Guide, WELTREGELN, gestraffter Master-Prompt.
- Audit S13 und Fixes (BUG-114–131), Arbeitskreislauf je Beruf, NPC-Leben (Reisende, Mahlzeiten, Zuzug).

## Session 12 — 2026-09-26 · Arsenal, Valoris, Eisenfeste, Aurelion
- 16 Waffen, 14 Rüstungsteile, Rüstungskomponenten; Welt Valoris (1536 breit, Ost-West-Neuordnung, Nebelkarte).
- Eisenfeste A1–A4 (Tribut, Feldzüge, Dienst, Fall), Hochreich Aurelion (Pass, Adel, Automaten, Prothesen, Himmelsinsel).
- Master-Prompt 2 Phasen 1–4 (XP nach Beitrag, Debug-Menü, Kerker, Sklaverei, Hinterhalte). BUG-102–113.

## Session 11 — 2026-09-26 · Bug-Runde und Phasen
- BUG-076–101 (Anti-Kiting, Gerüchte, Karte, Namen, Figurenbilder ×24 schneller); Tagesrhythmus Stufe 2, Beziehungen.
- Gegner-Ausdauer, Raids mit Vorwarnung, Befreiungskampf in Wellen, Balancing §82 (`RF.duel`), Kopfgeld, Ruf-Stufen.
- Regionalbosse Graumähne und Karrak, Endgame Eisenmark (Varg, Befreiung der Goblins).

## Session 10 — 2026-09-25 · Stil D
- Stil D gewählt (gröberes Raster 1,5 Welt/Pixel), Referenz 2 (schlank, lange Mäntel, Gesicht im Schatten), Gebäude dunkler.
- Tagesplan der Bewohner Stufe 1, Gespräche, Stadtfeste.

## Session 9 — 2026-09-25 · Audit und Grafik-Revision v2
- Durchlauf-Audit (BUG-076–098 erfasst); Figuren im feinen Raster (`figure.js`), Waffen neu, Gegnerkörper.

## Session 8 — 2026-09-25 · Phase 11 Gegner
- 18 Gegnertypen mit Verhalten und Datenblatt, Wilder Hund mit eigener Gestalt.

## Session 7 — 2026-09-25 · Phasen 6–10
- Deckung und Parade, 19 Waffen (Rapier, Kriegshammer, Hellebarde, Armbrust, Zauberstab), Rarität mit Affixen,
  aktive Talente, 14 Grundklassen.

## Session 6 — 2026-09-25 · Spielstand, Karawane, Tiefhall
- Spielstand speichert nur Abweichungen (0,5 MB), Karawane als Zug mit Wachen, Tiefhall mit Hrodvar, Mönch, Grenzöde.

## Session 5 — 2026-09-25 · Größere Welt
- Welt ×1,5, Skill-Baum, Druide (max. 2 Titel), Totenreich (Vharnholm, Knochenwald, Aschensee).

## Session 4 — 2026-09-25 · Dichte und Titel
- Siedlungen gestreckt, Einwohner nach Fläche; Titelklassen Nekromant und Hexenmeister (Pakt der Stillen Schar).

## Session 3 — 2026-09-25 · Stil und Tagesablauf
- Fels, Wasser, Boden, Mauern, Grube, Titelbild neu; Tagesablauf benannter Figuren; Touch-Steuerung.

## Session 2 — 2026-09-25 · Städte
- Giebeldächer, Stadtpläne (104 Gebäude), Bewohner und Wachen, Verfall.

## Session 1 — 2026-09-24 · Phasen 0–3
- Audit; Boden/Tod terminal, Zorn mit Leine, Aufhelfen; Szenenübergänge (folgen/lauern), Wegfindung, Spawns frei.
