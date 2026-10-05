# Changelog — Rotfall: Legacy

Neueste oben, höchstens 5 Zeilen je Session. Ausführlich bis S13: `archive/CHANGELOG_bis_S13.md`.

## Version 25 — 2026-10-05 (Zusammenführung der offenen Zweige)
- Zusammengeführt: claude-arbeit (PR #9: Audit Phase 1–4, Wüstenbund/Zwerge, Wanderautomaten, Heiler-/Zauberfenster, Schleichmodus, Kampfanimationen) und Reliquien (Endgame-Fortschritt, Anmarsch der Ereignisfiguren, Omega-Szene).
- PR #7 zurückgeholt (war in main verloren): Angst der Bürger, schwere Verbrechen mit Bußgeld und Haft, Zerfall Varonheims ohne König.
- Reliquien-Fenster auf Taste O (V ist der Schleichmodus). Cache-Schlüssel v=25.
- Siedlung: Gründung nur auf freiem Land (nicht in einer Stadt, sechs Felder Abstand); „Siedlung auflösen“ im Fenster B (Gebäude, Siedler, Wachen, Vieh weg, Lager als Kiste); Titel „Befreier von …“ verblasst nach 7 Tagen. Welttiefe Slice 2: Ermittlung „Sechs statt zehn“ (Nordfurt). Selbsttest 491/491.
- Welttiefe W2 Slice 1: Urteile hallen nach — Beschuldigte, Freigesprochene, Überführte und Gedeckte grüßen 30 Tage anders (`memory`-Effekt, bestehendes `remember`), das Urteil läuft fünf Tage als Gerücht („Was gibt es Neues?“, Sprechblasen). Selbsttest 492/492.
- Welttiefe W2 Slice 2: jeder Auftraggeber bekommt einen Nachfolger (bestehendes `successorDay`, jetzt alle Geber aus `QUESTS`), offene Aufträge bleiben abgebbar; stirbt ein Verwandter als Geber, scheitert der Auftrag sichtbar (`questGiverDeadDay`).
- Aufträge: angenommene oder erledigte Angebote (Brett, Wache, Kette) werden täglich aufgefüllt; vorher gab es nach „alle drei gemacht“ bis zur 3-Tage-Rotation nichts Neues (Nutzer). Selbsttest 494/494.
- Behoben (BUG-144): Wuchtschlag und die anderen Hieb-Fähigkeiten kosteten Ausdauer und Abklingzeit, auch wenn mitten im Schwung kein Hieb kam; jetzt Rückgabe und Hinweis. Selbsttest 495/495.
- Varonheim: Hauptplatz entlastet — nur noch rund 30 Bewohner treffen sich dort, die übrigen vor Schenken, Kapellen, Läden (gemessen mittags im Umkreis von 10 Feldern: 89 → 22 Personen). Selbsttest 496/496.
- Welttiefe Slice 1 (Plan: `docs/PLAN_WELTTIEFE.md`): Auftragsziele *Spur untersuchen* und *Befragen*, Urteil mit Folgen am Auftragsende; Ermittlungen „Blut auf dem Markt“ (Eren) und „Sechs statt zehn“ (Nordfurt: Beweisstück aus einer Spur, Urteil wirkt auf den Marktvorrat). Spuren haben im Prompt Vorrang wie benannte Figuren. Arbeitsregeln neu in `CLAUDE.md`.
- Behoben: Eisenfeste — neue Spiele bekamen nie Kettenzug, Torwachen und Käfig-Gefangene (die Bevölkerung zählte als „schon besiedelt“); alte Stände holen den Kettenzug nach. Ersatz für die Stadtwache war in den ersten Tagen eines Spiels gesperrt (Z.reinf 0).
- Selbsttest 488/488. Proben gegen Zufall gehärtet (Trefferzone, Krits, Bedrohung im neuen Spiel): Wuchtschlag, Schleichen, Akademie-Duell, Duell im Kreis, Knochenritter, Stadtfest/Tagesplan (peace() ohne Heere der Toten), Betriebe-Verlusttag; Erbe-Aufträge ohne festen Kartenpunkt.

## Version 24 (in Arbeit) — Fehlerjagd Runde 1
- Hunt-1-Fehler HB-06 bis HB-23 behoben (Mönch-Aufträge, Weißbarts Ansprechbarkeit, Varon-Königsauftrag, Eisenmark-Pferch/Tributzug, Schuldprüfung bei befreiten Städten, Wohlstand ohne Schutz, Heiler sieht Gliedverletzungen, Schadens-Böden heben Bewusstlose nicht mehr an, Bruch/Prothese, Medizin heilt kein Messing, abgetrennte Glieder, Betriebsverlust, Kult-Doppelgänger, Zweiwaffen mit ausgefallenem Arm, kein Selbstheilen am Boden, Kette/Grubenstämme-Rang). Details: `ROTFALL_STATE/hunt/BERICHT.md`.
- Offen (keine eigenmächtige Designentscheidung): HB-10 (Rotfall/Omega-Belohnung), HB-20 (welche Bindungen ein Erbe übernimmt).

## Version 24 — 2026-10-02 (Angst, schwere Verbrechen, Zerfall der Hauptstadt)
- Angst: Bürger sammeln Angst je gesehenem Toten; unruhig, verängstigt (verstecken sich, reden nicht) und Panik (fliehen schreiend), bis die Gefahr fort ist.
- Schwere Verbrechen ab 2000 Gold: kein Freikaufen, Bußgeld und Haft bis 120 Spielstunden (200 000 Gold); Haftanzeige in Stunden statt fälschlich Minuten.
- Varonheim: erschlagene Hofleute bleiben tot, Kanzlertod beendet den Kult, Reichsverweser rückt nach; Thronwirren lassen die Hauptstadt ohne König zerfallen und übernehmen.
- Menüs: Reiter in Charakter- und Fraktionsfenster nicht mehr zusammengequetscht; Stylesheet mit Cache-Schlüssel.
- Ereignisfiguren laufen von außerhalb ins Bild statt aufzuploppen; Angst geht vor Ereignissen (kein Fest, andere Orte, Neuankömmlinge fürchten sich mit).
- Reliquien: Endgame-Fortschritt mit drei Fassungen, 24 Reliquien (11 Spielweisen, 9 Boss-/Regionalboss-Stücke), Stufen I–VIII mit Pfaden, Synergien und Verwandlung, Seelenglut und Sternsplitter, Beute bei Bossen, Elite und Dungeon-Enden, Fenster „Reliquien (V)“; am Grab vererbt, beim Erben schlummernd bis zur Erweckung.
- Omega: eigene Sternenklinge (Goldschwingen, Sternknauf, glimmende Hohlkehle), Todesszene, Klinge garantiert; danach im Westen verhasst, im Osten gefeiert. In Szenen nimmt die Gruppe keinen Schaden.

## Version 23 — 2026-10-01 (Audit, Agentensystem, Blutkult beginnt)
- Varonsburg in der Welt begehbar (Thronsaal, Adelsflügel, Kanzlei, Verlies, Kronschmiede), Viertel-Architektur in Varonheim, Karawanen-Absturz bei alter Route behoben.
- Spielstand rund 20× kleiner (komprimiert), Speichern gebündelt; Seuchen-Fehler (14 000 Props im Stand) behoben; Slotwechsel und andere Tabs sicher.
- Krieg mit Gegengewicht (Aufgebot nach Verlusten, Besatzungen füllen sich, Mauern, Entsatz aus Varonheim); Wucht mit Standfestigkeit.
- Umgebungsklang je Region und unter Tage, Geisterschleier und Nachbild getrennt, eigener Effekt-Zufall mit Partikeldeckel, flüssigeres HUD und Caches.
- Führung wächst mit der Gruppe, ehrliche Fertigkeits-Tooltips, Grafikstil F abgeschaltet.
- Blutkult Scheibe 1: Titelklasse Vampir (Blutdurst, Sonne, Trinken, Stigma, Heilung bei Aldis oder in Sankt Serin).
- Blutkult Scheiben 2–5: Verschwundene und Maskierte in Varonheim, Spuren und Anklage, Katakomben mit Hedda und Gefangenen, Aldhelm als Blutfürst (Hofszene, Krypta-Boss), Rote Krönung, Erpressung, der Held als Blutfürst.
- Gefangene nehmen (fesseln, verhören, anwerben, ausrauben, laufen lassen, hinrichten), Steckbriefe lebend ×1,5, Ruf der Klinge je Region.
- Läden am Stadtlager: Preise und Auswahl je Stadt nach Vorrat (0,7–1,8×), Ereignisse verändern Lager, Aurelions Zölle; der Weltpreis entfällt.
- Heldentod als Moment (Zeitlupe, Zoom, Totenglocke, Name) und Ahnenfeinde: der Mörder nimmt die Waffe, wächst, greift die Familie an; Rache gibt sie zurück.
- Varonheim belagerbar (Scheibe 1): Kriegsknoten mit Mauern, Bedrohung mit Ansagen, Morvaths Heerzug, mehrtägige Belagerung, Entsatz aus der Hauptstadt; Scheibe 2: Fall mit Exilhof in Salzhafen, zerfallender Hof, Rückeroberung; Königstod kostet nur durch eigene Hand.
- Regiebuch: Boss-Auftritte (Welt steht, Namenskarte, Sprechblase), Szenen zu Heerzug, Belagerung und Fall Varonheims, neue Klänge; Log bleibt unten. Scheibe 2: Goblinsturm als Szene, Aldhelm neu, Ankunftskarten, Musterung mit Horn, vier neue Gesten.

## Version 22 — 2026-09-30 (Koop, Bionik 2–5, Welt-Ausbau §5b–§5f)
- Audit T01–T04: Wucht mit Standfestigkeit, Krieg mit Nachschub, Nachbild und Geisterschleier getrennt, eigener Effekt-Zufall mit Partikeldeckel, Umgebungsklang je Region und unter Tage.
- Varonheim: Hauptstadt König Varons südlich von Nordfurt, mit der Varonsburg im Burgbezirk.
- Freie Seefahrt: eigenes Schiff, Kurse (Küste, Handelsroute, Wrackfeld), Seehandel mit Hafenpreisen, Piraterie, Bergung, Rumpf und Reparatur.
- Tiefhall: lebende Königsstadt der Zwerge unter der toten Halle (König, Runenschmiedin mit Königseisen, Händler, Brauerei, Mine).
- Kampfgefühl und Animation: Kombos mit Wuchtschlag, Humpeln im ungleichen Takt, Blutspur, Hilferufe Verletzter, Gesten im Gespräch.
- Eigene Grundrisse: Sankt Serin (Tempelbezirk, Kreuzgang), Kupferhafen (Werftplatz, Hafenbecken mit Stegen), Tickmar (Straßenraster, Fabrikhof), Gelenkhall (Ringstraße um den Werkstattplatz).
- Aurelions Nebenstädte mit eigenem Gesicht: Sankt Serin (Segen), Kupferhafen (Werft), Tickmar (Fabrikladen), Gelenkhall (Prothesenpflege).
- Mehr Varianten: Automaten (Metall, Verschleiß, Leuchtfarbe), Engel (Gold, Mantel, Licht), Bewohner (Alter, Hut, Tuch, Flicken), Wachen (Wappenfarbe je Stadt).
- Neue Waffen mit eigener Zeichnung: Morgenstern, Kettenkugel (Flegel), Katar; Goblin-Volkswaffen Schrottkeule und Schrottklinge.
- Siedlung: Wohnzonen — Siedler bauen dort selbst Hütten aus dem Vorrat.
- König Varon und die Varonsburg im Norden: Hof, Kanzler, Adel, Kerker, Garde; Audienz, Auftragskette mit Verräter-Suche, Ritterschlag.
- Titelklasse Grubenhäuptling (Stammesmut, Goblinhorde, Schrottbombe, Kriegstrommel, Tunnelsprung, Dodons Echo; Meister Grisk).
- Goblins nach der Befreiung: Grubenhort wächst zur Goblinstadt (Spenden helfen), Außenposten von Morrgrund, Goblin-Helden anwerben, Dodon zieht ins eigene Dorf, Menschen reagieren.
- Gewölbe: Modifikatoren (dunkel, überflutet, verflucht), Hebeltüren, Geheimkammern, drei geheime Gewölbe über Karten, Endlosgewölbe „Der Schlund“.
- Akademie: als Student einschreiben, Vorlesungen, Semester, Rivalin, verbotene Abteilung.
- Dynastie: Heirat, Kinder wachsen in Spielzeit, Adoption beim Priester, Freund als Erbe; Kinder und Ehepartner erben zuerst.
- Epilog am Ahnengrab (Taten, Ruhm, Ehre und Fluch), danach weiterspielen oder zwanzig Jahre später.
- Gefährten 2.0: Loyalität, Verrat bei niedriger Loyalität, Lagerfeuer-Gespräche, persönlicher Auftrag, Freund fürs Leben.
- Handwerk: Rezepte an Esse, Werkbank und Kessel (Lagerfeuer), Güte von Grob bis Meisterstück nach Fertigkeit, Königseisen hebt die Güte.
- Banden entstehen zufällig mit Lager, Gebiet, Hinterhalten und Schutzgeld; Anführer tot = Bande zerfällt, Kopfgeld.
- Titelbild zeigt zufällig einen von sechs Orten (Grenzfeste, Aurelion, Goblinhort, Eisenfeste, Karak-Atar, Schwarze Feste) mit eigener Bewegung.
- Verletzungen über Tage: Brüche (heilen nur bis 40 %, Heilerin schient), Entzündungen, Narben (+1 Rüstung).
- Spiele in der Schenke: Würfeln (Falschspieler entlarven), Siebzehn und Vier, Armdrücken, Trinkwette mit Rausch (schwankende Steuerung), Faustkampf ohne Tote.
- Gerüchte mit echten Zielen (Schatz, Bestie, Deserteur; ungefährer Kartenpunkt, selten falsch).
- Karak-Atar belebt (Basar, Wegzoll, Wasser gegen Hitze, Sternenritual), Schwarze Feste mit Hof der Untoten, Totentempel und Belagerung nach Garmadon; CLAUDE.md für künftige Sitzungen.
- Folgen großer Ereignisse (Dorf ausgelöscht, Sklavenaufstand, Streik, Stadtfall in Aurelion, Seuche, Hexenprozess, Omegas Ende), Eisenfeste belebt mit dunklen Klassen und Übernahme nach Varg, Zweiwaffen, Peitschen, Sensen und Sensendorf Weidenau, Legendäre je Boss.
- 32 Elite-Mini-Bosse mit eigenem Aussehen, Kräften und Beute; Schildarten (Buckler, Turm, Stachel, Magitech); Nahschuss trifft; Tier- und Banditen-Varianten.
- Wetter mit Wirkung (Regen, Nebel, Schnee, Sandsturm, Hitze, Blutregen), Lehrer-Bewährung, Wachen kämpfen nach Widerstand, Talentpunkt jede dritte Stufe, Plan §5c–§5e mit Nutzerentscheiden.
- Mehrere Spielstände mit Erfolgs-Symbolen, Koop-Stände getrennt; Goblins und Untote in vielen Varianten.
- Magitech-Waffen 2.0 (Roadmap C.10): Energie je Schuss mit Energiezellen, fünf neue Waffen (Schockpistole, Magiegewehr, Runenarmbrust, Kristallkanone, Präzisionsgewehr) mit Streuung, Durchschlag, Lähmen, Brand; Rangsperre in Aurelion.
- Koop: Ingame-Chat (Enter), Charakterkarten, Erben in gleicher Zahl, Gast-Schlag bei gehaltener Maus und kurzen Klicks repariert, Koop aus laufendem Spiel lässt Gäste sofort rein, lokaler Testweg ?coopLocal.
- Koop: Gast führt eigene Gespräche (Lehrer, Fraktionen, Aufträge mit Rückfrage beim Host), eigene Fraktionsränge, Tod erst wenn alle am Boden, Erben für alle, Code immer sichtbar, Pfeil zum Mitspieler, Kerker nur für den Helden.
- Koop-Warteraum: eigener Charakter für den Gast, Bereit-Knopf, gespeicherte Gastcharaktere; Gast sieht Häuser, Licht, Inventar, Statpunkte, Aufträge, E-Hinweise; Taten des Gasts kosten Ruf; Kamerafahrten für Gäste; Zeppeline über Aurelion ziehen nicht mehr mit.
- Nachtrag: Koop auch im laufenden Spiel (Einstellungen), Gast handelt bei Händlern mit eigenem Beutel, Gast fragt an Eingängen den Host (Gruppe reist zusammen), Auftragsgold aller Quests geteilt.
- Netzwerk-Koop (K2): Knopf „Koop (Netzwerk)“ auf dem Titelbildschirm. Host öffnet sein Spiel mit 6-stelligem Code, Gast tritt über WebRTC (PeerJS) bei und steuert einen Gefährten. Der Host rechnet und speichert allein.
- Teilen im Koop: Erfahrung wie der Held, Auftragsgold zu gleichen Teilen, Beute hat, wer sie zuerst aufhebt; Tauschmenü (Gast: I, Host: Knopf oben rechts); Chat mit Enter.
- Bionik Pakete 2–5: Roboterauge, Prototyp-Glieder und Module, Wartung mit Werkzeug und Öl, Händler, Chirurgie, Schwarzmarkt, Rangsperren, Bionik im Charakterbogen.

## Version 20 — 2026-09-30 (Roadmap Paket 1)
- Master-Roadmap des Nutzers (docs/MASTER_ROADMAP.md), Architekturplan (docs/PLAN_ROADMAP.md), Animations-Referenzanalyse (docs/ANIMATION_REFERENZ.md).
- Bionik-Fundament: Qualitätsstufen 1–4 (Schrott schlechter als Fleisch), frische Prothesen, Verschleiß nur am getroffenen Glied, Debug-Knöpfe.
- Debug-Knöpfe für die acht großen Ereignisse; fünf kleine Lücken aus dem Ist-Zustand geschlossen.

## Version 19 — 2026-09-29 (S15)
- Acht große Weltereignisse (P15): Seuche, Heuschrecken, Turnier, Adelsball, Luftschiffabsturz, Schatzwagen, Hexenprozess, Streik.
- Cutscenes: Abblende, Schwenks, Überspringen ohne verlorene Folgen; bei Vargs Fall siegen die Goblins. Menüleiste für Laptops.
- Kenshi-K.-o.: Aufstehen erst ab 25 % Rumpf, Heilen dauert; Wachen, die dich niederschlugen, helfen nicht auf. Rund 45 weitere Fehler (Magie, Reisen, Dungeons, Hinweise).
- Doku: docs/IST_ZUSTAND.md beschreibt jedes Feature für eine Lückenanalyse.

## Version 18 — 2026-09-29 (S15, große Fehlersuche)
- Acht Fehlersucher über alle Systeme; rund 55 Fehler behoben (Liste in BUGS.md, Abschnitt „Fehlersuche Version 18“).
- Unter anderem: unendlich Gold durch Kaufen/Verkaufen, zerstörte Dörfer füllten sich beim Laden neu, abgebrochene Aufträge für immer gesperrt,
  Heer-Auftrag der Toten nie fertig, Versklavung in Dungeons, Erbe erbte Ketten und Jagd, Angst der Bewohner dauerte ewig.

## Version 17 — 2026-09-29 (S15)
- Überfälle der Toten (P20): bei Sael eine Horde gegen ein Dorf führen, ab Rang 2 ein Heer gegen eine Stadt schicken; danach über die Bewohner entscheiden.
- Festnahme: in Ketten oder im Kerker keine zweite Festnahme, Schuldknechtschaft löscht das Kopfgeld, Entlassung in Aurelion vor das Tor.
- Ausbruch: Der Wärter redet erst (zurückgehen, bestechen, kämpfen). NPCs am Boden heilen sich nicht selbst.

## Version 16 — 2026-09-29 (S15, zweite Hälfte)
- Versionsnummer auf dem Startbildschirm und oben links (v16). Die Seite lädt alle Dateien neu (Cache-Schlüssel v=16).
- Pferd: R pfeift, E sitzt auf; Werte je Pferd, Stall-Fenster bei Tierhändlern, Pferdehof Hadubrand in Mühlbach, Totenross für Todesritter.
- Magie (Akademie, Nachtglas-Turm, Schattenschule, Glaubenszauber), Ruhm je Region, neue Lehrer, Eidwacht-Questreihe, Schwierigkeitsgrade.
- Kodex schaltet sich im Spiel frei (Code NACHTGLAS); Bewohner-Aufträge mit Namen und mitlaufendem Wegpunkt; Statpunkte erklärt.

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
