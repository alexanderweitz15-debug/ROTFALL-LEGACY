# ENTSCHEIDUNGEN — alle Entscheidungen des Entwicklers (Stand 08.10.2026)

Einzige Sammelstelle (Doku-Bereinigung 08.10.2026). Teil 1 = das frühere `ROTFALL_STATE/DECISIONS.md` (01.–03.10. und Audit-Antworten), Teil 2 = Nutzerentscheide §5b–§5g aus dem alten PLAN_ROADMAP (30.09./01.10.). Offene Fragen stehen in `ROADMAP_ZENTRAL.md`.

---

# Teil 1 — Entscheidungsprotokoll


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
- Neuer Grundsatzauftrag: REGELN_UND_SPECS.md §H (ehemals ROTFALL_STATE/VISUAL.md) (weg vom Text; 10 Varianten je Element; Priorität Dialoge → Quests → NPC → Kampf → Items → Inventar → Shops → Skilltree → Karte → Städte → Welt → UI → Animationen).
- Neue Arbeitsregel: REGELN_UND_SPECS.md §A (ehemals ROTFALL_STATE/GATE.md) (Feature Readiness Gate) — gilt für alle Features und Agenten: erst Analyse + Impact Report + offene Entscheidungen, keine erfundenen Regeln/Zahlen.
- Werkzeuge: Sperre bleibt (kein SpriteCook, keine bezahlten Bildgeneratoren, kein pixel-plugin, kein Aseprite).

## 02.10.2026 — Kampfanimation (Entscheidungen zu visual/kampfanimation.md)
- Packs A/B/C ändern NUR die Optik (Verteilung im gleichen Takt); schnelleres Tempo für C höchstens später als eigener, gemessener Endgame-Effekt.
- Schaden fällt künftig im sichtbaren Einschlag (Takt bleibt gleich), danach Balance-Nachmessung der 5 Testwaffen mit simFight.
- Kombo: 3 Schläge + Finisher; der in MECHANIKEN beschriebene 15 % längere Wuchtschlag wird wirklich eingebaut; in A drei Schläge, in B/C vierter als Finisher-Animation; Erholung ab Treffer + 40 % abbrechbar.
- Gegner: neue Bewegungen ja, fest Pack A; Waffengewicht der Gegner erst in eigener Balance-Runde.
- Pack nur im Test Room (Debug) wählbar, danach legt der Entwickler den finalen Stil fest.
- Koop: Schadenszeitpunkte nach Pack des Hosts, Optik lokal, Kombo-Schritt an Gäste übertragen.
- Zusätzlich: Debug-Menü wird unübersichtlich → richtiges aufklappbares Debug-GUI.

## 02.10.2026 — Visueller Umbau: Entscheidungen zu den Analysen (Analysen ROTFALL_STATE/visual/*.md, historisch c21fd64)
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
- **Lebensbalken (03.10.):** Der Balken zeigt den Rumpf: leer heißt tot bzw. am Boden. hp/maxHp (Kopf + Rumpf) bleiben für Heilung, KI und Balance.
- **Ist-Zustand-Fragen (03.10.):**
  - Tributdörfer (Grauwasser, Hohlstein, Eisenried) gehören nach Vargs Fall den **Freien**. Hilfe dort zählt schon vor dem Fall für Dorf und Freie, nicht für die Kette.
  - Waffe nach Kerkerausbruch bzw. Flucht aus der Schuldknechtschaft: liegt in der **Asservatenkammer**, zurückholbar (Truhe in der Wache, Diebstahl oder Buße).
  - Verbrechen an Leuten ohne Fraktion: Kopfgeld bei der **Macht, die den Ort beherrscht**; in der Wildnis ohne Zeugen keins.
  - Kriegsgraph: Befreite bzw. eroberte Städte gehen an ihre Macht zurück (Sonnwacht an den Orden, Kreuzweg und Aschfurt an die Händler), auch am Start.
  - Feldschlachten und Befreiungen geben Ruf bei der befreiten Macht (nur, wenn man mitkämpft).
  - Aufträge ohne Fraktionsruf (Todesritter, Quirin, Lioba, Varons Auftrag 1) geben kleinen Ruf bei der Macht des Gebers. Klassenprüfungen bleiben ohne Ruf.
  - Seevolk-Ränge werden über Ruf vergeben (wie bei anderen Mächten).
  - 7 Gegenstände ohne Quelle bekommen eine; der Lead verteilt sie passend.
  - Die 4 legendären Sets gibt es zusätzlich als Lohn am Ende der jeweiligen Rangreihe (höchster Rang).
  - Lieferaufträge geben Ruf bei der Macht der Zielstadt.
  - Das Lager ist nur in der Siedlung bzw. im eigenen Haus nutzbar.
  - Karak-Atar und Dünenwacht (Wüstenbund) sowie die Zwerge werden eigene Fraktionen mit Ruf und Brett-Aufträgen.
  - Der Tickmar-Arbeiterrat gibt Ruf bei den Freien.
  - Varonheim wird volle Hauptstadt: Kutsche, Schankpersonal, Söldner, volles Brett, ohne die Weltform zu ändern.
  - Die Siedlungsschmiede bekommt die Esse (Handwerks-Fenster).
  - Schurken-Prüfung zurück auf Meuchelstich; der Lehrer leiht ihn für die Prüfung (wie das Kriegslied beim Barden).
  - Jagd: wächst beim Erlegen von Tieren; mehr Felle und Fleisch; Tiere bemerken dich später.
  - Schleichmodus bauen: eine Taste, langsamer, schwerer zu sehen; Schleichen wächst dabei; Hinterhalt-Bonus.
  - Boss-Beute: jeder Boss lässt garantiert genau eines seiner Stücke fallen (nie doppelt). Graumähne und Karrak bekommen eigene Stücke.
- **Fragemenü 03.10. (abends):**
  - Dünenwacht wird ein Posten des Wüstenbunds mit Sandreitern und Brett; das Zelt heißt „Posten der Sandreiter“.
  - Karraks Tod gibt Wüstenbund +10.
  - Rangvorteile:
    - Rabatt bei den Händlern beider Fraktionen.
    - Wüstenbund: freier Durchzug ohne Wegzoll in Karak-Atar, Eskorten zahlen besser.
    - Zwerge: ab Rang 2 verbessert die Zwergenschmiede bis „Meisterstück“.
  - Karak-Atar und die Tiefhall bekommen eigene Kerker mit eigenem Wärter.
  - **NEU, großes Paket „Fraktions-Starts“:**
    - Wer den höchsten Rang einer Fraktion erreicht, schaltet sie dauerhaft (über alle Spielstände) als Start für neue Geschichten frei.
    - Freischaltbar sind alle Fraktionen mit eigenem Gebiet: Valen, Orden, Kette, Untote, Aurelion, Seevolk, Händler, Grubenstämme, Wüstenbund, Zwerge.
    - Ein Fraktions-Start bringt: Start im Fraktionsgebiet, Mitglied ab Start, eigene Ausrüstung und eigenes Aussehen, ein eigenes Haus bzw. Gebiet und **Boni je Rasse**.
    - Alle Starts bekommen ein eigenes Aussehen; man soll auch als **Skelett** starten können.
    - Rekrutieren: bei gutem Ruf Fraktionsmitglieder als Gefährten UND als Siedlungswachen.
  - **NEU: Roboter wie in Kenshi:** Überall in der Welt streifen Roboter frei umher (Aussehen ähnlich den Skeletten aus Kenshi). Manche kann man rekrutieren, ähnlich wie Beep. Dazu weitere Charaktere in der Welt.


---

# Teil 2 — Nutzerentscheide §5b–§5g (30.09./01.10.2026)

## 5b. Dauerauftrag Nutzer (30.09.2026): mehr Vielfalt bei Figuren

Bei jeder passenden Gelegenheit mehr Varianten einbauen, nie nur eine Figur je Art:
- **Untote:** Skelette, Zombies, Ghule, Knochenschützen, Nekromanten in mehreren Varianten (Körperbau, zerrissene Kleidung, fehlende Teile, Rüstungsreste, Waffen, Farben, Leuchten der Augen).
- **Goblins:** Krieger, Schamanen, Späher, Häuptlinge, Frauen und Kinder der befreiten Stämme; unterschiedliche Größen, Hautfarben, Ohren, Kopfschmuck, Waffen, Kriegsbemalung.
- **Allgemein:** Banditen, Wachen, Bewohner, Tiere, Automaten, Engel, Seevolk — Varianten aus dem Seed der Figur (`e.seed`), damit sie bei jedem Laden gleich aussehen.
- Technik: Varianten als Daten (Paletten, Teile, Größenfaktor) in `sprites.js`/`fig5.js`, nicht als Einzelbilder; Selbsttest-Probe „jede Variante malt sich“.

## 5c. Folgen großer Ereignisse (Nutzerentscheid 30.09.2026)

Dauer der Folgen **je nach Schwierigkeit**: Leicht/Normal erholt sich die Welt nach einigen Wochen Spielzeit; Schwer und Sehr schwer bleiben die Folgen für immer (nur Spieler-Taten kehren sie um).
- **Sklavenaufstand gewonnen:** (1) Die Befreiten gründen eine freie Siedlung (Händler, Aufträge, eigene Fraktion). (2) Die Eiserne Kette schlägt zurück: Tage später Rachezüge und Kopfgeldjäger. (3) Arbeitskräfte fehlen: Steinbrüche/Minen der Kette stehen still, Eisen und Stein werden teurer. (4) Andere Städte kippen: der Aufstand greift je nach Ruf auf Nachbarorte über.
- **Streik in Tickmar gewonnen:** (1) Löhne hoch, Magitech/Bionik dauerhaft teurer, dafür weniger Unfälle. (2) Arbeiterrat als neue Macht im Rat von Aurelion (eigene Aufträge, Gesetze). (3) Streikwelle in anderen Fabrikstädten, wenn man nicht eingreift. (4) Das Haus Vantor rächt sich (Schläger, Intrigen gegen den Spieler).
- **Städte in Aurelion fallen** (Krieg, Tod der Kaiserin): (1) besetzt und sichtbar zerstört, Wachen des Siegers, Händler weg, Bionik/Magitech dort nicht mehr kaufbar. (2) Flüchtlingszüge in Nachbarstädte, Preise steigen dort, neue Aufträge. (3) Befreiung als Wellenkampf wie bei Menschenstädten, danach Wiederaufbau. (4) Nach mehreren Fällen zerbricht das Hochreich in Häuser, die sich bekriegen (Fall Aurelions, C.24).

- **Dorf komplett ausgelöscht** (Spieler, Monster, Krieg): alle vier Folgen — Ruine mit Verfall, später Neubesiedlung in Stufen; Banditen/Goblins nisten sich ein (Auftrag zum Ausräuchern); Spuk/Geisterdorf nachts mit Friedhof der Bewohner (Priester-Auftrag); war es der Spieler: Rache und Kopfgeld der Fraktion, Chronik, Ruf überall.
- **Seuche nicht eingedämmt:** Bewohner sterben täglich (Stadt schrumpft), Ausbreitung über Karawanen auf Nachbarstädte, Quarantäne (Wachen sperren, kein Handel, Schmuggel-Aufträge), der Spieler kann erkranken (Status, Heilung beim Heiler, Roadmap C.15).
- **Hexenprozess:** Hinrichtung einer Unschuldigen hat Folgen (Angst, Magier fliehen, Akademie-Ruf sinkt); Befreiung hat Folgen (Orden jagt, die Gerettete wird Gefährtin oder Lehrerin); Hexenjagd-Welle in anderen Städten, wenn der Orden zu stark ist.

## 5d. Zehn dünne Bereiche — Nutzerentscheide (30.09.2026)

1. ✅ **Erledigt (Version 21, siehe MECHANIKEN.md „Eisenfeste bevölkert“).** **Eisenfeste** bevölkern: mehr Militärleben (Appell, Drill, Kaserne, Messe, Auspeitschung), Zivilisten (Soldatenfamilien, Schmiede, Quartiermeister, Feldscher, Kasernenmarkt), Sklavenmarkt, Kettenpriester und Schreiber. **Dunkle Klassen** der Kette je nach Grundklasse: Dunkler Hochpaladin (Krieger, gibt es), **Dunkler Priester** (Kleriker/Magier), **Kettenjäger** (Schütze), **Folterknecht/Henker** (Schurke), **Kettenbarde** (Barde) — Lehrer in der Feste, Rang in der Kette nötig. **Nach Vargs Fall entscheidet der Spieler**, wer die Feste übernimmt (Goblins, Valen, Flüchtlinge).
2. **Karak-Atar (GEBAUT):** neutrale Handelsstadt unter Herrschaft der Sandfürsten (Basar, Wegzoll, Schmuggel aus Aurelion) **und** eigenes Wüstenvolk mit Kultur (Wasserhandel, Rituale).
3. **Eigene Siedlung (P14) (GEBAUT: Wohnzonen):** Ort frei wählbar; Mischung beim Bauen (wichtige Bauten selbst setzen, Wohnhäuser bauen Siedler in Zonen).
4. **König Varon (GEBAUT):** Mischung aus hartem Kriegskönig, schwachem, von Adligen gelenktem König und Paranoia (verfeindet mit Aurelion) — **neue Burgstadt im Norden** mit Thronsaal, Hof, Kerker, Adel.
5. **Schwarze Feste (GEBAUT):** Hauptstadt der Untoten (Hof der Stillen Schar, Händler, Rang-Aufträge), Totentempel (Seelenhandel, Leichenzüge, Rituale), nach Garmadon **eroberbar** (Belagerung als Großereignis).
6. **Tiefhall (GEBAUT):** lebende Zwerge in einer **Bergstadt** auf einer tieferen Ebene (Händler, Schmiede mit Königseisen).
7. **Banden (GEBAUT):** zufällige Banden, die entstehen und zerfallen (Lager, Anführer, Gebiet, Schutzgeld).
8. **Handwerk (GEBAUT):** Rezepte an Esse/Werkbank/Kessel, **Qualität nach Fertigkeit**, Spezialmaterialien (Königseisen, Magitech).
9. **Seevolk (GEBAUT: eigenes Schiff, Kurse, Seehandel, Piraterie; weitere Inseln offen):** **freie Seefahrt** mit eigenem Schiff, mehrere Inseln, Seehandel und Piraterie.
10. **Aurelions Nebenstädte (GEBAUT: eigene Grundrisse, Gesicht und Dienst; Nutzer 01.10.: alte Stände dürfen brechen, Migration siedelt neu an):** **eigene Grundrisse** und eigener Charakter je Stadt (Klinik-/Tempelstadt Sankt Serin, Werftstadt Kupferhafen, Fabrikstadt Tickmar, Gelenkhall).
- **Talentpunkte:** jede dritte Stufe (21 bis Stufe 60).
- **Omega fällt:** Panik im Osten, Jubel und Pilgerzüge im Westen.

## 5e. Weitere zehn Bereiche — Nutzerentscheide (30.09.2026)

1. **Gefährten 2.0 (GEBAUT):** keine Romanze, nur tiefe Freundschaft. **Loyalität** als Langzeitwert; **jeder** Gefährte kann bei niedriger Loyalität verraten. Eigene Auftragsketten je Gefährte, Lagerfeuer-Gespräche.
2. **Dynastie (GEBAUT):** Erben aus allem — Heirat und Kinder (wachsen in Spielzeit), Adoption von Waisen/Gefährten, dazu Zufall wie bisher.
3. **Gewölbe (GEBAUT, handgebaute Orte als drei geheime Gewölbe):** Rätsel und Hebel (Hebeltür, Druckplatte, Geheimwand nach Wahrnehmung), 5–8 geheime handgebaute Orte nur über Hinweise, Modifikatoren (überflutet, dunkel, verflucht), Endlosgewölbe.
4. **Gerüchte (GEBAUT):** erzeugen echte Ziele (Schatz, Bestie, Deserteur); **selten** falsch (auch mal Hinterhalt); grober Kreis auf der Karte.
5. **Schenke (GEBAUT):** Würfel, Karten, Armdrücken/Trinkwette, Faustkampf ohne Tote und Rausch (schwankende Steuerung).
6. **Wetter mit Wirkung (C.12):** gebaut (Regen, Nebel, Schnee, Sandsturm, Hitze, Blutregen; Gegner betroffen).
7. **Verletzungen (GEBAUT):** Brüche und Infektionen halten **Tage**, Heiler/Feldscher beschleunigt; Narben.
8. **Akademie (GEBAUT):** der Spieler wird **Student** (Semester, Vorlesungen, Rivalen, verbotene Abteilung als eigener Pfad).
9. **Goblins nach der Befreiung (GEBAUT, inkl. Titelklasse Grubenhäuptling):** Grubenhort wird **Außenposten** von Morrgrund. Belohnungen: Goblin-Titelklasse, Goblin-Gefährte, Goblin-Händler, Dodon als Gefährte — **Dodon zieht nur in das Dorf des Spielers**, wenn man eines hat. Ab dann kann man **Goblins rekrutieren** (einzelne Helden und Trupps). Goblins bauen **größere Städte südlich der Eisenfeste** (kartenabhängig): wachsen langsam von selbst, schneller mit Spielerhilfe; Stil gemischt aus Pilz-/Lehmhütten, umgebautem Kettenschrott und Tunneln/Gruben. Menschen reagieren **je nach Stadt** (Valen offen, Orden feindlich, Aurelion neugierig).
10. **Epilog (GEBAUT):** nur auf Wunsch am Grab; danach **Wahl des Spielers**: weiterspielen oder 20 Jahre später mit einem Erben.

## 5f. Sprites, Waffen, Animation — Nutzerentscheide (30.09.2026)

- **Varianten für alle:** Bewohner und Wachen (Frisuren, Bärte, Alter, Kleidung je Stadt/Region, Wachenwappen), Banditen und Söldner (Masken, Tücher, Beutestücke, Narben), Tiere (Fellfarben, Größen, jung/alt, Albinos), Automaten und Engel (Messing/Stahl, beschädigt, Leuchtfarben). Dazu weiter Goblins/Untote (§5b).
- **Waffen:** exotische Nahkampfwaffen (Kriegssense, Morgenstern, Katar, Peitsche, Kettenkugel), einzigartige Legendäre mit Geschichte und Spezialeffekt je Boss/Region, Volkswaffen (Goblin, Zwerg, Seevolk, Wüste) mit eigenem Look, Zweiwaffen-Kampf und mehr Schildarten.
- **Animation:** Kampf (Schlagvarianten, Kombos, Treffer-Reaktionen, Finisher), Alltag der NPCs (Arbeiten, Essen, Gesten im Gespräch, Handwerk, Tiere füttern), Tod und Verletzung (Humpeln, Kriechen, Hilferufe, Verbluten), Umgebung (Fahnen, Rauch, Wasser, Vogelschwärme, Türen).
- **Technik:** beides — Bausteine als Daten für die Masse, handgezeichnet für Bosse und Helden. Nach BALANCE_GUIDE.md einpflegen.
- **Nutzer-Nachtrag:** Nahschuss-Bug (Geschosse treffen nahe Gegner nicht) — behoben. Exoten zuerst: Peitsche (heranziehen, schnell und weit) und Sensen/Stangenwaffen (mehrere treffen). **Mehr Sensen** und ein **Dorf mit Sensen-Bürgerwehr** (Weidenau), dort Sensen kaufen. **Zweiwaffen** nur Schurke, Assassine, Berserker. **Schilde:** Turmschild, Buckler, Stachelschild, Magitech-Schild. **Je Boss eine eigene Legendäre.**
- **Elite-Mini-Bosse:** mindestens 30 mit eigenem Aussehen und Beute für Kopfgeld-Aufträge (gebaut: 32).

## 5g. Dünne Bereiche überarbeiten — Nutzerentscheide (01.10.2026)

Mindestens zehn Bereiche; Reihenfolge nach Größe und Abhängigkeit. Nach jedem Punkt ein Sonnet-Bug-Agent (ohne Screenshots).

1. **Varons Hauptstadt (GEBAUT: Varonheim südlich von Nordfurt — nördlich ist Meer):** neue große Stadt in der Oberwelt nördlich von Nordfurt, die Varonsburg steht sichtbar darin (Weltaufbau ändert sich, Migration für alte Stände).
2. **Blutkult (Blutmagier/Vampire) als Varons Hauptfeind:** Unterwanderung (Verschwundene, Maskierte nachts, Blutzeichen, Spuren und Verdächtige), Katakomben unter der Hauptstadt mit Blutfürst, selbst beitreten (Vampir als Titelklasse mit Blutdurst), Wendung am Hof (jemand am Hof gehört heimlich zum Kult).
3. **Ressourcen-Sprites:** Bäume, Erz, Stein, Kräuter schöner; Abbau sichtbar.
4. **Begehbare Zelte:** Zelte als kleine Bauten mit Innenraum (Lager, Banden, Pilger, Garnison).
5. **Boss-Intros:** Kamerafahrt/Auftritt beim ersten Sichtkontakt (Varg, Hrodvar, Garmadon, Gorak, Dodon, Blutfürst).
6. **Schwierigkeit:** „Sehr schwer“ = mehr Überfälle, „Angsthase“ wacht beim Heiler auf.
7. **Gefährten-Ausrüstung:** Ausrüstung mit Klassenprüfung, bessere Befehle, Tier als viertes Mitglied.
8. **Fall Aurelions (ganzer Hoher Rat tot):** zuerst immer Bürgerkrieg der Adelshäuser; danach je nach Weltlage: ist die Eisenfeste zerstört und Varon noch im Krieg mit dem Kult → Automaten übernehmen; sonst → Varon marschiert ein. Kein Spieler-Thron.
9. **Himmelsinsel/Rat:** Ratsmitglieder verkaufen Dinge (auch ohne Rang lohnt der teure Besuch); wer dort oben einen tötet, lässt Luftschiffe mit sehr starken Privatarmeen des Adels landen.
10. **Aurelion-Ränge 3–6** mit echten Prüfungen.
11. **Neue Lehrer:** Druidin, Moorhexe, Omega-Priester mit eigenen Zaubern.
12. **Jagd und Wildnis:** Fährten, Fallen, Häuten, Wildnis-Ereignisse.
13. **Leistung und Spielstand:** offene Performance-Bugs, kleinerer Spielstand.
14. **Seevolk-Ränge 2 und 4** erreichbar machen.
15. **Akademie-Innenleben:** Studenten mit Tagesablauf, Bücher für Ilvar, Anklage „verbotene Magie“.
16. **Musik:** synthetisierte Musik je Region, Kampf, Stadt.
17. **Schwarze Feste befreien** (BUG-100), Umgebung beleben.
18. **Stumme Figuren** (Automaten, Kettenwachen reden), Flüchtlinge mit Heimat.
19. **Siedlung als Stadt:** Stufen, Zuzug nach Attraktivität, Reaktionen der Fraktionen.
20. **Kopfgeldjäger und Gegner skalieren** (SCALING).
21. **Wetter im Menschenland:** eigene Wetterlagen der mittleren Länder.
22. Zwei Sonnet-Agenten sammeln weitere Ideen und unterentwickelte Features (Nutzer).

**Zusatz 01.10.2026 (nach der Lückensuche, `docs/audit/SCOUTS_2026-10-01.md`) — alle vom Nutzer gewählt:**

23. Taschendiebstahl an Personen (Schleichen gegen Wahrnehmung, Zeugen).
24. Steckbriefe jagen (Kopfgeld-Brett beim Wachhauptmann, lebend = Bonus, Ablieferung am Kerker).
25. Siedlung bringt Gold (Ertrag aus Zonen und Gebäuden).
26. Magie-Kombos (Frost + Blitz, Feuer + Öl …).
27. Reittiere 2.0 (berittener Kampf, Rammen, Kamel/Wolf je Region, Zaumzeug und Rüstung sichtbar).
28. Runen und Sockel (Tiefhall, Aurelion).
29. Eigene Handelskarawane (Route, Wächter, Überfallrisiko, Gewinn je Rundreise).
30. Gefährten-Szenen untereinander (Streit, Freundschaft, Eifersucht).
31. Barde ausbauen (Repertoire, Auftritte, Verdienst).
32. Diplomatie (Gesandte, Frieden, Bündnis, Kriegsknoten befrieden).
33. Lehen für Ritter Varons (Ertrag, Ladungen an den Hof).
34. Alchemie-Handel und Fallen (Apotheke, Gift-Schmuggel, Ölfass, Giftgas).
35. Orte beleben (Szenen Schrein/Hain/Lager/Ruinen, Tributdörfer, besetzte Städte mit anderen Bannern und Wachen).
36. Aurelheims Prachtbauten nutzbar (Bibliothek, Badehaus, Gericht, Hospital, Observatorium).
37. Komfort-UI (Kartenlegende, eigene Markierungen, Inventar sortieren/Ramsch, Chronik-Filter, UI-Klänge).
38. Zweite Gischtinsel und kurzer Einstieg in Eren.

**Entscheide:** Vampir = Titelklasse mit Blutdurst als Ressource, Schwäche im Sonnenlicht, sozialen Folgen (Zeugen melden, Orden jagt) und heilbar (Orden oder Heilquelle Sankt Serin). Der Blutfürst am Hof ist Kanzler Aldhelm. Reihenfolge: gemischt (abwechselnd groß und klein). Der große Audit läuft parallel mit drei starken Agenten, nur als Report (`docs/audit/MASTER_REPORT.md`); die NOW-Punkte setze ich danach um.

## 5h. Entscheidungen vom 09.10.2026 (Fragerunde)

- **E40 Totenland-Expansion:** Umfang **groß (C)** — Totenstadt mit Vierteln, Markt und Gesetzen, zweite Stadt, Rangprüfungen, Teilregionen, Gruftnetz, Diplomatie, Story-Bogen und Bossreihe bis Garmadon; in Teilen bauen. **Lebende dürfen die Totenstadt besuchen, mit Regeln** (Totensiegel/Maske/Schweigen; Handel und Aufträge erst mit Rang oder Pakt). **Vorhandene Fläche füllen**, die Karte wächst nicht. **Osten bleibt vorerst Hinterland** im Kriegsgraphen (Krieg erst nach Messung). **Seelen, Knochen und Grabgut werden echte Marktgüter** der Weltwirtschaft. **Nach Garmadons Tod** sind beide Ausgänge möglich: Thronfolgekampf oder Zerfall in Fürstentümer (je nach Weltlage/Handeln des Spielers).
- **E41 Holz:** Gefällte Bäume wachsen **nach 10 Tagen** nach (Stumpf → Schösslinge → Baum).
- **E42 Sternbilder:** **Beides** — doppelte Allerwelts-Sterne streichen (Punkte zurück) **und** ähnliche Klassen zusammenlegen (z. B. Barde + Kettenbarde).
- **E43 Gold und Ruf:** Ruf **überall auf ±100 begrenzen** (Goblin-Sonderfall bleibt). Betriebssteuer und Einzahlgebühr **unterschiedlich nach Gebiet und Stadt** (statt fest 10 %/3 %).
- **E38 Katana:** **eigene Waffenklasse** (eigener Skill, eigene Animationen, Meisterschaft).
- **E37 Alte Pakete:** **als Nächstes** — T12 „Straßen haben Herren“ zuerst, dann T23 Fraktionsressourcen, danach Belagerung S3, T15 Messing.
- **E13 Sprechblasen:** **Mischung** aus Sätzen und Symbolen.
- **E21 NPC-Ziele:** Deserteurbanden **zählen zum Bandendeckel**; Kriegsmüdigkeit mit **Fahnenflucht ab Stufe 60** (−2 Stärke/Tag beim stärksten Heer), **ruht während einer Belagerung Varonheims**; Abwanderer **nicht** in die eigene Siedlung umleiten.
- **Prolog (Nachricht 08.10.):** Am Ende des Prologs nur als **Nomade** weiter; eigene Prolog-Tafel.

## 09.10.2026 — Lebensanzeige und Blut (Entwickler, im Spiel)
- **Lebensbalken = Gesamtleben** aller Körperteile („nicht nur vom Körper“). Ersetzt HB2-01 (03.10.: Balken = Rumpf) für die Anzeige; die Spiellogik (Rumpf 0 = am Boden) bleibt.
- **Blut wie in Kenshi:** wer zu viel Blut verliert, wird erst bewusstlos (Zahlen vorläufig ⚖: 100 Blut, Treffer 35 % des Schadens, Blutung 1,2/s, K.o. unter 35 %, Aufstehen ab 50 %, 0 = verblutet, Erholung 0,25/s). Gegner vorerst ohne Blut.
- **Prolog:** „Aufheben und heilen“ wartet, bis man sich wirklich verbunden hat.
- **Debug-Menü:** kompakt, kleiner, übersichtlich; Gegenstände mit eigener Einteilung (Waffen, Rüstung, Talismane …).
- **Fertigkeiten-Menü:** wird neu gebaut („holy shit ist das arsch“).
- Pushen direkt auf main, sobald der Selbsttest grün ist.

## 09.10.2026 — Fragerunde 2 (Entwickler)
- **E18 Belagerung S3c:** Kellerweg **nur mit Kultschlüssel**; Varon: **als Ritter Varons ja, sonst 15 % Ablehnung je Tag**.
- **E44 Messing-Stigma (T15 V9):** Vorschlag übernommen — Orden ×1,25 Preise, Inquisitor meldet ab 2 sichtbaren Teilen; Valen ×1,1, Spionverdacht bei der Audienz ab 2; Kette ×1,2; Aurelion ×0,85 Rabatt; Händler/Seevolk/Freie ×1,1; Banditen/Goblins/Tote ×1,0. Umhang verdeckt Arme, nicht das Auge.
- **E45 Tribut (T23):** Die Kette nimmt **nur aus dem Überschuss** — Dörfer leiden, sterben aber nicht aus.
- **E46 Thronstreit (E40 S3):** Bei Gleichstand gewinnt **Morvath**.
- **E47 Gesetze der Stillen:** gelten **nur in Vharnholm**.
- **E48 Seelen/Eifer (T23):** sollen **langsamer** an den Deckel laufen (stärkeres Abklingen), damit Spielerhandlungen sichtbar wirken.
- **E49 Aurelion nach Wohlstand:** soll **stärker wirken** — auch Wachen, Preise und Automaten-Streifen.
- **E50 Kurzschluss:** das getroffene Glied versagt 1 s — Arm: kein Hieb/Block, Bein: stark verlangsamt; dazu doppelter Verschleiß.
- **E51 T21 Zelte:** Leute in Zelten — ja, flüchtig (nachts ein Schläfer je Zelt, bezahlte Bande sitzt friedlich darin). Bandenbeute stehlen — ja, nachts ungesehen (halbe Beute als Ware, Bande wird feindlich, Hinterhalt).
- **E52 Gegner-Scaling (T24):** Gruppen + Rollenmix — ab Heldenstufe 20/35/50 bekommen Begegnungen +1/+2/+3 Begleiter mit Rollen (Schildträger, Schütze, Heiler/Nekromant); Leben je Stufe über 30 nur noch +2 %; Frühspiel unverändert. Ziel: Smart-Bot verliert im Mittel > 10 %.
- **E53 Frühspiel-Ausreißer:** Knochenritter, Fleischgolem, Goblinkrieger in frühen Gebieten (Gefahr 1–2) nicht oder nur als Boss/Elite mit Vorwarnung; im Totenland bleiben sie hart.
