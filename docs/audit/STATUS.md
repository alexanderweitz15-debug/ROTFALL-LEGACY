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
| Master-Report + Aufgabenliste | IN PROGRESS | Director | – | – | Teil A–C |
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

## Abschluss je Arbeitsrunde

Am Ende steht jeweils:
- COMPLETED
- BUGS FIXED
- FEATURES ADDED
- DISCOVERIES
- SYSTEM IMPROVEMENTS
- BLOCKED
- NEXT PRIORITIES
