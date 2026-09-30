# Statustafel des 3-Agenten-Pools (ab 01.10.2026)

Rollen:
- **Director:** Agent 3 (Opus), führt den Audit zusammen, schreibt Aufgaben und prüft Ergebnisse.
- **Engineer:** Agent 2, der Hauptstrang. Nur er ändert `src/`, damit sich keine Änderungen gegenseitig überschreiben.
- **Hunter:** Agent 1 (Sonnet), testet jedes fertige Feature und behebt klare Fehler.

Status-Werte: BACKLOG · IN PROGRESS · TESTING · COMPLETED · BLOCKED · REQUIRES REVIEW.

„COMPLETED“ heißt: Selbsttest frisch geladen grün und Hunter-Bericht ohne offenen Fehler.

| Task | Status | Owner | Last tested | Result | Dependencies |
|---|---|---|---|---|---|
| Audit Teil A Gameplay | COMPLETED | Director | 01.10. | `TEIL_A_GAMEPLAY.md` (16 Vorschläge) | – |
| Audit Teil B Welt | COMPLETED | Director | 01.10. | `TEIL_B_WELT.md` (17 Vorschläge) | – |
| Audit Teil C Darstellung | COMPLETED | Director | 01.10. | TEIL_C_DARSTELLUNG.md (17 Vorschläge) | – |
| Master-Report + Aufgabenliste | COMPLETED | Director | 01.10. | `MASTER_REPORT.md`, `TASKS.md` (T01–T40) | Teil A–C |
| §5g.1 Varonheim (Hauptstadt) | TESTING | Engineer → Hunter | 01.10. | 321/321; Hunter läuft | – |
| A1 Wucht-Stunlock (CRITICAL) | TESTING | Engineer → Hunter | 01.10. | Standfestigkeit auch für Wucht und Wuchtschlag; Probe, 323/323 | – |
| V1 Krieg mit Nachschub (CRITICAL) | TESTING | Engineer → Hunter | 01.10. | Deckel 80/110, nach Garmadon kein Wachstum, Valen nur in eigener Stadt; Probe, 323/323 | – |
| V17 Kleine Korrekturen Welt (HIGH) | BACKLOG | Engineer | – | – | – |
| §5g.2 Blutkult, Katakomben, Vampir, Aldhelm | BACKLOG | Engineer | – | – | §5g.1 |
| A13 Tote Fertigkeiten und Tooltips (NOW) | BACKLOG | Engineer | – | – | – |
| A5 Gefangennahme (NOW) | BACKLOG | Engineer | – | – | – |
| A6 Ahnenfeind (NOW) | BACKLOG | Engineer | – | – | – |
| V3 Läden am Stadtlager (NOW) | BACKLOG | Engineer | – | – | – |
| V4 Banden ↔ Händlerzüge (NOW) | BACKLOG | Engineer | – | – | – |
| V9 Sozialer Preis der Bionik (NOW) | BACKLOG | Engineer | – | – | – |
| §5g.3–22 (Plan) | BACKLOG | Engineer | – | – | – |
| §5g.23–38 (Lückensuche) | BACKLOG | Engineer | – | – | – |

## Aufgabenliste aus `TASKS.md` (Bauordnung, ab 01.10.2026)

Die Zeilen oben bleiben als Verlauf; maßgeblich für die Reihenfolge sind T01–T40. In Klammern: welche älteren Zeilen die Aufgabe umfasst.

| Task | Status | Owner | Last tested | Result | Dependencies |
|---|---|---|---|---|---|
| T01 A1 Wucht mit Standfestigkeit (Critical) | TESTING | Engineer → Hunter | 01.10. | siehe Zeile A1; 323/323 | – |
| T02 V1 Krieg mit Nachschub (Critical) | TESTING | Engineer → Hunter | 01.10. | siehe Zeile V1; 323/323 | – |
| T03 §5g.1 Varonheim | TESTING | Engineer → Hunter | 01.10. | 321/321; Hunter läuft | – |
| T04 Effekte, Zufall, Klang (D3, D5, V17b, D4) (Critical) | TESTING | Engineer → Hunter | 01.10. | Nachbild/Schleier getrennt, vrnd + Deckel 900, economy.js auf rnd(), Regionsklang 6 Regionen + unter Tage; 2 zufallsabhängige Proben robust gemacht (Kutsche, Raserei); 323/323 | T01, T02 |
| T05 Kleine Korrekturen (V17 a/c/e, A13, Stil F, Doku-Drift) | BACKLOG | Engineer | – | – | T02 |
| T06 §5g.13 Spielstand und Caches (D6, D7, D16) (Critical) | BACKLOG | Engineer | – | – | T04 |
| T07 §5g.2 Blutkult, Katakomben, Vampir, Aldhelm | BACKLOG | Engineer | – | – | T03 |
| T08 Gefangene, Steckbriefe, Ruf der Klinge (A5, §5g.24, A10) | BACKLOG | Engineer | – | – | T05 |
| T09 V3 Läden am Stadtlager (+ V17d) | BACKLOG | Engineer | – | – | T04 |
| T10 Ahnenfeind und Heldentod (A6, D8) | BACKLOG | Engineer | – | – | T01 |
| T11 Schwierigkeit, Überleben, Wetter (§5g.6, A14, §5g.21) | BACKLOG | Engineer | – | – | T05 |
| T12 V4 Straßen haben Herren | BACKLOG | Engineer | – | – | T04, T09 |
| T13 Oberfläche (D9, D10, §5g.37, §5g.38 Eren) | BACKLOG | Engineer | – | – | T05 |
| T14 §5g.3 Ressourcen-Sprites | BACKLOG | Engineer | – | – | T06 |
| T15 Messing: Stigma und Schwächen (V9, V10) | BACKLOG | Engineer | – | – | T07 |
| T16 Gefährten: Ausrüstung und Taktik (§5g.7, A8) | BACKLOG | Engineer | – | – | T01 |
| T17 Regiebuch und Boss-Intros (D1, D15 = §5g.5) | BACKLOG | Engineer | – | – | T06 |
| T18 §5g.10 Aurelion-Ränge 3–6 | BACKLOG | Engineer | – | – | T15 |
| T19 A2 Rüstungsklassen und Schlagarten | BACKLOG | Engineer | – | – | T01 |
| T20 D2 Goblinsturm, Morrgrund, Aufstand inszeniert | BACKLOG | Engineer | – | – | T17, T10 |
| T21 §5g.4 Begehbare Zelte | BACKLOG | Engineer | – | – | T12 |
| T22 A3 Gegner verteidigen sich | BACKLOG | Engineer | – | – | T19 |
| T23 Fraktionsressourcen und Tribut (V12, V14) | BACKLOG | Engineer | – | – | T02, T09 |
| T24 §5g.20 Skalierung | BACKLOG | Engineer | – | – | T22, T16 |
| T25 Zerlegen, Monstermaterial, Eisen (A7, A15) | BACKLOG | Engineer | – | – | T09 |
| T26 Runen, Zwerge, Sandfürsten (§5g.28, V13) | BACKLOG | Engineer | – | – | T25, T19 |
| T27 Seevolk, Seehandel, Gischtinsel (§5g.14, V6, §5g.38 Insel) | BACKLOG | Engineer | – | – | T09 |
| T28 Musik und Klang-Busse (§5g.16, D11) | BACKLOG | Engineer | – | – | T04, T17 |
| T29 Himmelsinsel und Aurelheims Prachtbauten (§5g.9, §5g.36) | BACKLOG | Engineer | – | – | T13 |
| T30 V7 Luftschiffe in der Welt | BACKLOG | Engineer | – | – | T23, T12 |
| T31 §5g.17 Schwarze Feste befreien (BUG-100) | BACKLOG | Engineer | – | – | T02 |
| T32 Klassenregeln, Barde, neue Lehrer (A9, §5g.31, §5g.11) | BACKLOG | Engineer | – | – | T13 |
| T33 Orte beleben, Fraktionsarchitektur (§5g.35, D13) | BACKLOG | Engineer | – | – | T06, T02 |
| T34 Siedlung als Stadt, Ertrag, Lehen (§5g.19, §5g.25, §5g.33) | BACKLOG | Engineer | – | – | T09, T23 |
| T35 §5g.12 Jagd und Wildnis (Fallen-Basis) | BACKLOG | Engineer | – | – | T25 |
| T36 Magie-Kombos, Fallen, Alchemie-Handel (§5g.26, §5g.34) | BACKLOG | Engineer | – | – | T35, T09 |
| T37 Schleichen, Taschendiebstahl, Zuschauer (A4, §5g.23, D14) | BACKLOG | Engineer | – | – | T11, T32 |
| T38 Stimmen der Welt (§5g.15, §5g.18, §5g.30, A16) | BACKLOG | Engineer | – | – | T13 |
| T39 Reittiere 2.0 und eigene Karawane (§5g.27, §5g.29) | BACKLOG | Engineer | – | – | T12, T09 |
| T40 Kriegsgraph, Diplomatie, Fall Aurelions (V2, §5g.32, §5g.8, V15) | BACKLOG | Engineer | – | – | T02, T23, T30 |
| Rückfrage: Freie vom Grubenhort zusammenlegen? (Teil B vs. §5c) | REQUIRES REVIEW | Nutzer | – | – | – |

## Abschluss je Arbeitsrunde

Am Ende steht jeweils:
- COMPLETED
- BUGS FIXED
- FEATURES ADDED
- DISCOVERIES
- SYSTEM IMPROVEMENTS
- BLOCKED
- NEXT PRIORITIES

## Nutzerwahl 01.10.2026 (Fragemenü)

Alle angebotenen Audit-Ideen gewählt. Reihenfolge: **Mischen**. Zuerst die Criticals C3 und C6, dann abwechselnd §5g (Blutkult zuerst) und Audit.

- **Kampf:** A5 Gefangennahme · A6 Ahnenfeind · A2+A3 Rüstungsklassen und Deckung · A4+A8 Schleichen/Wahrnehmung und Gruppentaktik
- **Welt:** V3 Läden am Stadtlager · V4 Banden auf Straßen · V9 Messing-Ruf · V7+V8 Luftschiffe in der Welt und eigenes Schiff
- **Darstellung:** C1/C2/C15 Regiebuch, Zwischensequenzen und Boss-Intros · C9 Gespräche 1–9 · C10 Menüs zusammenlegen · C8 Heldentod als Moment
