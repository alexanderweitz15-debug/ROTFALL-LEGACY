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
