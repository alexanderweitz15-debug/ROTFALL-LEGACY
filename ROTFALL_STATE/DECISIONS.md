# Entscheidungen

Nutzer-Entscheidungen und Leitungsentscheidungen, inkl. abgelehnter Ideen. Übernommen aus ROTFALL_AGENT_STATE/ (DESIGN_DECISIONS.md, LEAD_DECISIONS.md) am 01.10.2026.


Nur Entscheidungen des Nutzers. Neueste oben.

## 01.10.2026 (Varonheim-Belagerung, proposals/varonheim_belagerung.md)
- Heerzug 70 (Sehr schwer 80): die Hauptstadt fällt nur bei langer Vernachlässigung.
- Fällt sie, flieht der König nach Salzhafen (sonst Nordfurt, sonst Eren); Exilhof mit Varon, Brandt, Ysmay, Hagen.
- Rückeroberung möglich (4 Wellen oder Valen-Heer); die zerstreuten Adligen kommen nie zurück; keine Selbstheilung auf Schwer/Sehr schwer.
- §5g.8: Eine besetzte Hauptstadt bindet Valen (Automaten übernehmen); ein toter König bindet nicht — Marschall Brandt führt den Einmarsch.

## 01.10.2026 (Control-Fragen)
- Öffentliches `main` bekommt nur noch geprüfte Stände (Commit mit „[VERIFIED]“); Zwischenstände nur auf `claude-arbeit`.
- Grafikstil F bleibt endgültig aus (Code eingefroren).

## 01.10.2026 (Fragemenü zu den Entwürfen)
- **Blutkult (proposals/blutkult.md):** Katakomben und Blutfürst im mittleren Spiel (Gegner 12–16, Blutfürst 16). Sonne: stetiger Brand (≈1,2/s) und −20 % Schaden, Schutz mildert, am Boden brennt es halb weiter (Gefährten müssen in den Schatten holen). Trinken von Wehrlosen (am Boden, ergeben, gefesselt, schlafend), Phiolen, Tierblut; zweimal am selben Tag tötet. Der Spieler darf neuer Blutfürst werden, mit laufenden Folgen (Blutzehnt, Tribut, Orden jagt dauerhaft). §5g.8: Kult aktiv oder herrschend = Varon gebunden, Automaten übernehmen; nur ein zerschlagener oder noch nicht erwachter Kult lässt Varon einmarschieren. **Heilung beliebig oft** (heilbar und neu ansteckbar, abweichend von der Empfehlung).
- **Freie vom Grubenhort:** bleiben eigene Fraktion.
- **Varonheim wird belagerbar** (abweichend von der Empfehlung): eigener Kriegsknoten mit starker Besatzung; fällt sie, große Folgen (König flieht, Hof zerfällt).
- **T08:** Steckbriefe am vorhandenen Anschlagbrett und beim Verteidigungsmeister. Fesseln braucht einen Strick (6 Gold, verbraucht). Grausamkeits-Ruf hart: ab „Schlächter“ ergibt sich niemand mehr, Gegner fliehen früher, Banden meiden dich.
- **T09:** Preise 0,7–1,8× je Stadt.
- **T10:** Heldentod **3 s** mit Glockenton und Namenseinblendung (ESC überspringt). **Bis zu 3 Ahnenfeinde** gleichzeitig. Angriffe auf die Familie: Häuser brennen, 30 % Kind entführt → Befreiungsauftrag, niemand stirbt sicher.

## 01.10.2026 (früher am Tag)
- Modelle: vorerst nur Opus und Sonnet.
- Audit-Wahl (Fragemenü): alle angebotenen Ideen — A5 Gefangennahme, A6 Ahnenfeind, A2+A3 Rüstungsklassen und Deckung, A4+A8 Schleichen/Wahrnehmung und Gruppentaktik, V3 Läden am Stadtlager, V4 Banden auf Straßen, V9 Messing-Ruf, V7+V8 Luftschiffe in der Welt und eigenes Schiff, D1/D2/D15 Regiebuch/Zwischensequenzen/Boss-Intros, D9 Gespräche 1–9, D10 Menüs zusammenlegen, D8 Heldentod als Moment. Reihenfolge: gemischt, Criticals zuerst.
- Blutkult: Blutmagier/Vampire; Unterwanderung (Verschwundene, Maskierte nachts, Blutzeichen, Spuren), Katakomben mit Blutfürst, beitretbar als Vampir-Titelklasse mit Blutdurst, Sonnenschwäche, sozialen Folgen (Zeugen, Orden jagt), heilbar (Orden oder Quelle von Sankt Serin). Wendung: Kanzler Aldhelm ist der Blutfürst.
- Varons Hauptstadt als neue Stadt in der Oberwelt mit der Burg darin (gebaut: Varonheim).
- Fall Aurelions: immer zuerst Bürgerkrieg der Adelshäuser; ist die Eisenfeste zerstört und Varon noch im Krieg mit dem Kult, übernehmen die Automaten, sonst marschiert Varon ein. Kein Thron für den Spieler.
- Himmelsinsel: Ratsmitglieder verkaufen Dinge; wer dort einen tötet, auf den landen Luftschiffe mit starken Adelsheeren.
- Alle 16 Scout-Ideen übernommen (§5g 23–38).
- Alte Spielstände dürfen bei Weltumbau brechen, Migration nur wenn billig.

## Früher
- Siehe `docs/PLAN_ROADMAP.md` §5b–§5f. Freie vom Grubenhort: eigene Fraktion (§5c).

## 01.10.2026 — Antworten auf die Director-Fragen (Fable)
- **T15 Messing V10:** freigegeben, Energiezelle für Stufe-4-Prothesen alle **3 Tage** (nicht täglich); Kurzschluss bei Schock und Regen-Verschleiß ×1,3 wie im Audit.
- **A14 Hunger und Müdigkeit:** freigegeben, **komplett** mit `DIFF.survival` (Angsthase nur Hinweise).
- **Belagerung:** S2 (Fall, Exil, Hof, Rückeroberung) **direkt nach S1**; S3 später eingemischt; S4 vertagt.
- **Nächster großer Vorschlag:** **T23 Fraktionsressourcen** zuerst (Fable, Welt/Fraktionen), T40 baut darauf.

## 01.10.2026 — Regiebuch (T17), Blutkult-Siegel, Fraktionsressourcen (T23)
- **Szenen überspringen:** immer mit ESC; die Folgen der Szene laufen trotzdem nach.
- **Boss-Auftritte:** **4–6 s, das Spiel pausiert** (Kampf wartet) — Abweichung von der Empfehlung (2–3 s live).
- **Sprechblasen** statt Großbuchstaben-Toasts in Szenen und Boss-Phasen; Toasts bleiben für Systemmeldungen. Kurze Kamera bei Weltereignissen in Spielernähe.
- **RB-031 Rotes Siegel:** **harte Folge** — wer Aldhelm erpresst, hat das Siegel und damit den Weg zum Zerschlagen verspielt. Der Text muss es vorher deutlich sagen.
- **T23 Aurelion:** Ressource = **Index aus Versorgung und Magitech**; Aurelion wird **je nach Wohlstand stärker** (Nutzer: „ich will, dass Aurelion je nach Wohlstand auch stärker wird“).
- **T23 Seelen:** Morvaths Heerzug kostet 40 Seelen, keine Bedingung.
- **T23 Eisenfeste-Vorrat:** einmalig in Stadtlager-Korn ×0,5 umwandeln, alter Wert gelöscht.
- **T23 Kette ohne Hände (< 6 Köpfe):** Sklavenjagd gegen den Grubenhort **und** gegen Tributdörfer.

## Leitungsentscheidungen (früher LEAD_DECISIONS.md)

Getrennt von `DESIGN_DECISIONS.md` (nur Nutzer). Control darf diese Punkte jederzeit dem Entwickler vorlegen.

- 01.10.: T09 Leitware automatisch ableiten (Waffenart, Rezept, Slot), nur Ausnahmen von Hand; altes `S.prices` beim Laden löschen.
- 01.10.: Todesritter-Knoten „Blutfürst“ heißt künftig „Blutritter“ (nur Anzeigename), damit der Name für Aldhelm frei ist. Noch nicht umgesetzt (Scheibe 4).
- 01.10.: Tageswechsel bleibt `if` (RB-007 abgelehnt).
- 01.10.: Grafikstil F abgeschaltet statt gelöscht (Audit CUT). Vom Entwickler bestätigt (01.10.).
- 01.10.: Cache-Schlüssel auf v=23 (Control: Commits sind öffentlich).
- 01.10.: Trinken an Gefährten erlaubt wie im fixierten Entwurf §15 (Beziehung −20, Moral −15, beim zweiten Mal geht er) — Hunter-Hinweis, kein neues Design.

## 01.10.2026 — Team und Werkzeuge
- Neues 6-Agenten-Team (`TEAM.md`) ersetzt das 12-Rollen-System.
- Alle Plugins erlaubt, **außer** SpriteCook, kostenpflichtigen Bild-Generatoren, pixel-plugin und Aseprite (alte Sperre bleibt).

## 01.10.2026 — UI-Umbau (PROPOSALS/ui_redesign.md)
- Variante: **C als Gerüst + B-Kopfleiste/Meldungsfluss + A-Pergament** nur für Kodex, Chronik, Erbe, Auftragsbuch.
- Obere Leiste: 14 Text-Reiter → **8 Gruppen mit Piktogrammen**; Talente/Zauber/Effekte als Reiter im Charakterfenster.
- Meldungen: Protokoll unten bleibt **und** verblassender Meldungsfluss (mehrere zugleich) statt Einzel-Toast.
- Siedlung, Handel, Gruppe, Handwerk als **angedocktes Seitenfenster ab Scheibe 3**.

## 01.10.2026 — Agenten laufen dauerhaft
- Entwickler: „Starte alle Agents. Die sollen ja die ganze Zeit laufen.“ Die Obergrenze von zwei Unteragenten ist aufgehoben. Scout, Designer, Artist und Verifier laufen parallel; wird einer fertig, startet der Director seine nächste Aufgabe. Der Engineer ist die Hauptsitzung.

## 01.10.2026 — Scout-Auswahl
- Runde 1 gewählt: **Ortskarte beim Klick**, **Kopfgeldtafel mit Gesicht**, **Bestiarium mit Sprite** (alle klein, UI). Nicht gewählt (bleiben IDEA): Narbenbuch, Siedlung als Marktknoten.
- Runde 2 gewählt: **Feldreparatur-Set** (zu T15), **Königstod als Szene**, **Luftbrücke für Belagerte**, **Verwundete aus Feldschlachten** → Designer arbeitet Luftbrücke und Verwundete aus (Balance/neue Daten); Feldreparatur und Königstod direkt mit T15 bzw. T17.

## 01.10.2026 — Gespräche
- Entwickler: „Reduziere die Anzahl der NPCs, mit denen man reden kann. Man soll nicht alle nach der Geschichte etc. fragen können.“ Umsetzung: einfache Bewohner nur Sprechblase; Plauder- und Wissensfragen nur bei gesprächigen Rollen (Namen, Wachen, Wirte, Reisende, Lehrer, Gelehrte, Priester, Vorsteher, Gefährten); Dienste bleiben.

## 01.10.2026 — Antworten zu T11/A14 und T12
- **Verhungern:** auf **Schwer und Sehr schwer** möglich (ab Tag 5 ohne Essen, zwei Warnungen vorher) — Abweichung von der Empfehlung (nur Sehr schwer).
- **Lager:** am Feuer und mit Schlafrolle; neue Wetter im Menschenland: Gewitter und Schlamm.
- **Angsthase:** statt Tod Erwachen beim Heiler, −30 % Gold, 12 Stunden.
- **T12:** Rooks Hauptmann darf eine Straße melken (25 % der Beute); Rook-Ruf −10 für Bandenführer-Mord ab Rang Klinge; Schutzgeld deckt den eigenen Wagen; Patrouillen schwächen Banden (35 % je Durchgang).
- **Scout Runde 3** gewählt: Händler wechselt Route, Deserteure werden Banden, Bewohner wandert ab, Wachhauptmann desertiert → Designer (npc_eigene_ziele.md).

## 01.10.2026 — Stadt ohne Schutz, Varonheim-Umbau, Feinde unter sich, Varons Tod
- **Stadt ohne Schutz** (PROPOSALS/stadt_ohne_wachen.md): Übernahme je nach Lage (Totenheer nur bei Kriegsknoten, sonst Bande; Kette nur am Westrand); Tempo 2 + 2 Tage (Angsthase +2, Sehr schwer −1); Spieler wird Stadtherr zuerst nur über Tote/Blutfürst; Varonheim fällt nicht direkt, nur beschleunigt (Burgwache tot → König flieht vorzeitig).
- **Varonheim-Umbau** (PROPOSALS/varonheim_umbau.md): Faktor 3 (117×87), Lage Kronfels (Mitte 558/107), alte Stelle = Königsfelder; Startort-Wahl mit Varonheim als Vorgabe; Burg in der Weltkarte (nur Katakomben eigene Karte); Tor mit Durchsuchung, Bestechung 5000 Gold bei 30 %.
- **Feinde verschiedener Mächte** bekämpfen sich; näherer Feind wird bevorzugt (Entwickler).
- **Varons Tod** ist ein Ereignis mit Szene, Reichsverweser und Kopfgeld (Entwickler: „es fehlt noch ein Event, wenn Varon stirbt“).
- Entwickler: „Guck, ob alle Weltevents zusammenpassen“ → Designer-Abgleich (PROPOSALS/weltereignisse_abgleich.md).

## 01.10.2026 — Weltereignis-Abgleich (PROPOSALS/weltereignisse_abgleich.md)
- König vor dem Fall fortbringen: **ja**, im Gespräch mit Gero/Brandt während der Belagerung (Belagerung S3).
- Tod der Kaiserin: **Häuserkrieg zuerst**, Aurelions gefallene Städte treiben Morvaths Heerzug **nicht** an.
- Krisen-Takt: **Sehr schwer −15 Tage** (Krönung, Heerzug), **Angsthase ohne** Rote Krönung.
- Nach Garmadons Tod: **kleine Trupps** der Toten überfallen weiter, löschen aber keine Dörfer mehr aus.

## 01.10.2026 — Kampf-Ideen (Scout Runde 4) und UI
- Gewählt: Fraktionszeichen am Gegner, Kampfbericht nach Dreieckskämpfen, Köder-Pfeife, Schwache Flanke (alle klein).
- Kopfleiste: größere Symbole mit kurzer Beschriftung darunter (Entwickler: „Symbole sehr klein, kleine Beschriftung unter dem Symbol“).
- Varonheim-Umbau Scheibe 1 gebaut (Kronfels, Faktor 3).

## 01.10.2026 — Bedrohung gesamt (PROPOSALS/bedrohung_gesamt.md) und lebendige Hauptstadt
- Varonheim soll auf **Schwer bei Nichtstun (Kult ignoriert) gegen Tag 120–150 fallen**; Sehr schwer früher.
- Die verlorene Front allein darf den Heerzug auslösen, **frühestens Tag 75** (mit Deckeln gegen Krisen-Stapel).
- Ersatzwachen bringen die Besatzung zurück (**+4 je Mann**).
- Scout Runde 5 gewählt: Turnier in Varonheim, Gildenstreik, Markt reagiert auf Bedrohung, Flüchtlinge ins Armenviertel.
- Scout Runde 6 gewählt: Überfälle mit Ursache, Heilerhütte, Siedlung wird schutzlos, Moral sichtbar.

## 01.10.2026 — Emergente Quests, Stadt ohne Wachen S2, Siedlung
- Emergente Quests (PROPOSALS/emergente_quests.md): alle vier bauen, Reihenfolge E2 → E1 → E4 → E3.
- Heimgeholter Deserteur darf einen verlorenen Wachposten füllen, nie in Varonheim.
- Groll der Witwe trifft auch den Erben, höchstens noch ein Mörder.
- Stadt ohne Wachen S2: Fristen je Schritt — Angsthase 4+4, Schwer 2+2, Sehr schwer 1+1 Tage.
- Eigene Siedlung wird ohne Wachen nie übernommen, nur geplündert.

## 02.10.2026 — Belagerung S3, Geheime Orte, Start, Mittelspiel
- Belagerung S3 (PROPOSALS/varonheim_belagerung_s3.md): Burgfrieden fällt erst bei Mauern 0. Kellerweg-Frage und Varons Strenge NICHT beantwortet → offen lassen / beim Bau erneut fragen.
- Geheime Orte (PROPOSALS/geheime_orte.md): gleiche Lage in jeder Welt; Seelen-Ernte darf Morvaths Heerzug näher bringen (mit Warnung). Geisterschiff gratis: NICHT gewählt → kein Gratis-Transport.
- Erste Spielstunde (Scout R8): „Hinweise führen hin“ (proaktive Hinweise) bauen. Vorverfolgter erster Auftrag: nicht gewählt.
- Mittelspiel (Scout R9): alle vier bauen — Siedlung geht an Erben; Gold-Sog (Ausbau kostet auch Gold); Rang bremst Blutkult; Aurelion-Bionik wirkt im Kriegsgraphen.

## 02.10.2026 — Visueller Umbau und Feature Readiness Gate
- Neuer Grundsatzauftrag: ROTFALL_STATE/VISUAL.md (weg vom Text; 10 Varianten je Element; Priorität Dialoge → Quests → NPC → Kampf → Items → Inventar → Shops → Skilltree → Karte → Städte → Welt → UI → Animationen).
- Neue Arbeitsregel: ROTFALL_STATE/GATE.md (Feature Readiness Gate) — gilt für alle Features und Agenten: erst Analyse + Impact Report + offene Entscheidungen, keine erfundenen Regeln/Zahlen.
- Werkzeuge: Sperre bleibt (kein SpriteCook, keine bezahlten Bildgeneratoren, kein pixel-plugin, kein Aseprite).

## 02.10.2026 — Kampfanimation (Entscheidungen zu visual/kampfanimation.md)
- Packs A/B/C ändern NUR die Optik (Verteilung im gleichen Takt); schnelleres Tempo für C höchstens später als eigener, gemessener Endgame-Effekt.
- Schaden fällt künftig im sichtbaren Einschlag (Takt bleibt gleich), danach Balance-Nachmessung der 5 Testwaffen mit simFight.
- Kombo: 3 Schläge + Finisher; der in MECHANIKEN beschriebene 15 % längere Wuchtschlag wird wirklich eingebaut; in A drei Schläge, in B/C vierter als Finisher-Animation; Erholung ab Treffer + 40 % abbrechbar.
- Gegner: neue Bewegungen ja, fest Pack A; Waffengewicht der Gegner erst in eigener Balance-Runde.
- Pack nur im Test Room (Debug) wählbar, danach legt der Entwickler den finalen Stil fest.
- Koop: Schadenszeitpunkte nach Pack des Hosts, Optik lokal, Kombo-Schritt an Gäste übertragen.
- Zusätzlich: Debug-Menü wird unübersichtlich → richtiges aufklappbares Debug-GUI.

## 02.10.2026 — Visueller Umbau: Entscheidungen zu den Analysen (ROTFALL_STATE/visual/*.md)
- **Quest-Geber-Siegel:** feste Aufträge, Verteidigungsmeister und Brett immer; Bewohner-Aufträge auf „Sehr schwer“ nie.
- **Story-Dialog** (Zoom, Namensschild, breite Leiste, Welt läuft weiter): Quest-Angebot/-Abgabe benannter Figuren, Bosse vor dem Kampf (Varg, Garmadon, Weißbart, Dodon), Rat und Gericht.
- **Lohn/Folgen im Dialog:** vor Annahme fester Aufträge nur Lohnart als Symbol ohne Zahl; Folgen als Wappen + Richtung, genaue Zahl im Tooltip.
- **Tracker:** verfolgter Auftrag groß, bis 3 weitere klein, im Kampf eingeklappt; Zählkerbe nach jedem Kill; Ziele vorher markiert nur beim verfolgten Auftrag und nicht auf Sehr schwer.
- **Schwere (angesagte) Angriffe: NICHT blockbar, nur ausweichen** (Regeländerung; Code anpassen, MECHANIKEN ergänzen).
- **Lebensbalken** nur beim gewählten Ziel; **Schadenszahlen** als Pixelziffern, Einstellung Aus/Reduziert/Voll (Standard Voll für eigenen Schaden).
- **NPCs:** Dienstzeichen über Händlern/Lehrern nur in der Nähe; Bosse tragen eigene Rüstung + ihr Unikat sichtbar; Rangabzeichen am Spieler automatisch.
- **Items/Inventar/Shops:** Klick = ansehen; Lichtstrahl ab Selten, große Karte nur Legendär/Mythisch ohne Pause; Mengenkauf mit Preis je Stück und Gesamtpreis vorher; Sperre/„Neu“-Marke + Mehrfachverkauf, kein Rückkauf; Ladenware-Zustand bleibt 55–100 %; Händler-Sprüche als Sprechblase (3–4 je Ladenart).
- **Welt-Ereignisse:** Namenskarte + Signalton nebenbei, Pause nur bei Kriegsereignissen. Karte: Ereignis-Pins nur in entdeckten Gebieten; Fraktionsgrenzen dezent einfärben. Skilltree-Knoten bekommen eigene Pixel-Icons (im Code gezeichnet).
- **Dialoge (Nachtrag):** Welt läuft in Gesprächen weiter (wie heute). Text läuft ein, Klick vervollständigt, aus bei reduzierter Bewegung; keine Seiten. Emotes (Frage, Ausruf, Zorn, Angst, Freude, Trauer) nur im Gespräch und bei Reaktionen. Ängstliche/wütende NPCs ohne Angebote: nur Sprechblase statt Fenster. Mimik-Porträts später.

## 02.10.2026 (Nachmittag)
- **Kampf-Feedback:**
  - Der Gegenstrom des Mönchs fängt schwere Angriffe weiterhin ab.
  - „Reduziert“ zeigt den eigenen Schaden und Krits.
  - Ohne Auswahl zeigt der zuletzt getroffene Gegner seinen Lebensbalken (5 s, Zahl vom Lead gesetzt, nicht bestätigt).
- **Handel:** Vor dem Verkauf ab Selten kommt eine Rückfrage.
- **Grafikstil:** Das Spiel darf nie von selbst auf „Klassisch“ wechseln. Der Ausgangsstil ist R; D gilt nur, wenn der Spieler ihn ausdrücklich wählt.
- **Kampfanimation:** Das Abbrechen der Erholung ist takt-neutral. Die Combo fließt optisch, aber das Ausholen des nächsten Hiebs verlängert sich um den abgebrochenen Rest. Der Schaden je Sekunde bleibt gleich.
- **Neue Gegner:**
  - Mehr Sprites und Varianten für alle Gegner.
  - Bomben-Skelett: läuft auf dich zu und explodiert. Die Explosion macht Flächenschaden, auch an anderen Gegnern. Sie wird vorher sichtbar angesagt, Ausweichen ist möglich.
  - Großes Skelett: mehr Leben, langsamer, schwere (nicht blockbare) Hiebe, Rückstoß.
  - Mutierte Menschen: entstellt, schnell, wild, wenig Rüstung. Sie kommen am Totenland-Rand vor, wo der Fluch die Lebenden verdirbt.
- **Gegner Top 5 aus gegner_ideen.md werden gebaut:**
  - Wächterspinne: lauert sichtbar an bestimmten Werkstatt- und Fabrikwänden in Aurelion.
  - Dampframme: der Rammstoß zerstört Hindernisse (Fässer, Zäune, Kisten), wie der Leichenkoloss.
  - Blutschöpfer: das Trinken von Wehrlosen heilt auch Kultisten in der Nähe.
  - Netzwerferin: gleiche Regel wie das Spieler-Fangnetz; normale Figuren hängen fest, große und Elite taumeln nur.
  - Hofspion: die Zahl richtet sich nach der Schwere des Regelbruchs (Diebstahl: einer; Gewalt oder Mord: zwei bis drei).
- **Kampfanimation (17:30):**
  - Der aufgeladene schwere Hieb des Spielers ist nicht blockbar; dafür bestehendes `heavyHit`/UNBLOCK nutzen.
  - Der Dolch behält seinen Vorteil (+17 % Schaden je Sekunde gegen Banditen): „Dolch ist schnell“.
- **Hunt-Fehler:** Der Entwickler hat das Beheben der Hunt-Fehler freigegeben.
- **Klassen und Talente (Wunsch 02.10.2026, abends):**
  - Klasse lernen heißt: bezahlen und 1–2 Prüfungsaufträge, danach eine Aufnahme-Animation und eine kurze Szene.
  - Es gibt mehr Talentpunkte.
  - Jede Klasse bekommt einen eigenen Talentbaum im Sternbild-Stil (wie Skyrim).
  - Bis dahin sind alle Talentbäume versteckt.
  - Analyse läuft (PROPOSALS/klassen_talente.md); die offenen Fragen kommen danach.
- **Pferde-Sprites:** werden überarbeitet (Artist-Agent).
- **Betriebe (22:00):**
  - Der Gewinn eigener Betriebe sammelt sich in der Kasse des Betriebs. Abholen geht vor Ort oder im Siedlungs-Reiter.
  - Ein Überfall oder eine Besatzung kann die Kasse leeren.
  - Unter Siedlung kommt ein eigener Reiter mit Betriebsliste, Auswahl, Bild des Hauses, Ertrag pro Tag und Kasse.
- **Schmiede:** bekommt eine richtige GUI. Jedes System prüfen, das eine eigene GUI vertragen könnte, und dort eine bauen.
- **Spacing:** falsch im Siedlungsfenster, in Charakter/Inventar und in allen Menüs, die man oben öffnen kann. Alle überarbeiten.
- **Gegner-Despawn:** Verfolger verschwinden, wenn man wegrennt. Das soll nicht so sein.
- **Talentpunkte:** jede 2. Stufe plus 1 je bestandener Klassenprüfung, rückwirkend für alte Stände. Die anderen Klassen-Entscheidungen sind noch offen (PROPOSALS/klassen_talente.md §5).
- **Klassen und Talente (22:10, Antworten auf PROPOSALS/klassen_talente.md §5):**
  1. Punkte: jede 2. Stufe plus 1 je bestandener Prüfung, rückwirkend.
  2. Ein eigenes Sternbild je Klasse (19), nicht je Grundlinie.
  3. Mehrere Klassen: Wertesterne wirken immer, Schlüssel- und Fähigkeitssterne nur bei der aktiven Klasse.
  4. Prüfung für Grund- und Folgeklassen. Paladin, Todesritter, Hochpaladin und die dunklen Klassen behalten ihre eigenen Aufträge und bekommen nur die Szene.
  5. Scheitern: beliebig oft wiederholbar.
  6. Kosten wie heute (Vertrauen bzw. Lehrgeld) plus Prüfung.
  7. Aufnahme-Szene 5–6 s, die Welt pausiert, ESC überspringt.
  8. Alte Stände behalten ihre Klassen; die Prüfung ist für den Bonuspunkt nachholbar.
  9. Gelernte Knoten bleiben; einmal kostenlos neu verteilen.
  10. Titelklassen: Szene bei Erwerb und Grad-Weihe plus eigenes Sternbild.
  11. Vampir und Grubenhäuptling bekommen ein eigenes Sternbild.
  12. Machtgrenze: höchstens so viel wie heute ein voller Kampfzweig (mit simFight gemessen).
  13. Gefährten bekommen einen KLEINEN EIGENEN BAUM. Umfang und Punktequelle schlägt der Agent vor.
  14. Koop: jeder macht seine Prüfungen selbst; Gäste bekommen beim Aufstieg Talentpunkte (Fehler beheben).
  15. Vergessen: alles bei jedem Lehrer, gegen Gold wie heute.
  16. Die Prüfungsaufträge werden wie in Tabelle 2.2 übernommen.
- **Klassen (03.10., nachts):**
  - Sterne einer Klasse wirken weiter, solange eine ihrer Folgeklassen aktiv ist.
  - Eigene Wege (Paladin, Todesritter, Hochpaladin, dunkle Klassen) zählen als bestandene Prüfung: +1 Talentpunkt, auch rückwirkend.
  - Gefährtenbaum wie vorgeschlagen: 7 Sterne, 6 davon lernbar, nur Werte, Punkte = 1 + Stufe/5.
  - Prüfungszahlen schwerer:
    - Barde: 5 Siege unter dem Kriegslied mit 2 Gefährten.
    - Waldläufer: eine ganze Nacht (10 Stunden am Stück) draußen.
- **03.10. (früh):**
  - Ein Überfall nimmt die Hälfte der Betriebskasse.
  - Bewohner-Siegel bleiben nur in der Nähe sichtbar (Lead, Entwickler: „kp“).
  - Schmied „Verbessern“ und „Schmieden lassen“: die Regeln hat der Lead festgelegt (Entwickler: „entscheidest du“), beschrieben in MECHANIKEN.
- **03.10. Fragemenü:**
  - Ritter-Segen kostet Ausdauer statt Mana.
  - Bomben-Skelett: Wer es während der Zündung erschlägt, löscht die Glut (keine Explosion).
  - Mutanten gehören zur Fraktion der Toten.
  - Wächterspinnen lauern auch in Werkhallen der Städte Aurelions (nur gegen Unbefugte); die Dampframme verteidigt Aurelions Städte mit den Wachen.
  - Lebensbalken allgemein prüfen (Verdacht: Werte werden nicht richtig übertragen) → Bug-Agent.
  - HB-10: Am Ende der Rotfall/Omega-Reihe gibt es eine EINZIGARTIGE WAFFE.
  - HB-20: Witwe/Witwer bleibt im Haus (mit dem Erben nicht verheiratet); Bindungen des Toten enden.
  - Prüfwerte der Klassen bleiben vorläufig; der Entwickler testet.
  - **Kampfanimation:** eine Mischung der Packs nach Spielfortschritt — frühe Waffen Grounded (A), Midgame Heroic (B), Endgame-Waffen flashy (C).
