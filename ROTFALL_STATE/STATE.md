# STATE — ROTFALL (01.10.2026)

Zuerst lesen. Team und Projektfakten: `TEAM.md`. Kurz halten (unter 100 Zeilen).

## Stand
- Version 23 (`?v=23`). Selbsttest 349/349 bei Commit `06c16fe`. Git: `--git-dir=../_rf_backup.git --work-tree=.`.
- Der öffentliche `main` bekommt nur Commits mit [VERIFIED]. Der letzte Push auf `main` liegt vor dem Audit, denn Control hat den Push blockiert, solange ungeprüfte Teile im Baum stecken.

## Fertig (VERIFIED)
- Audit T01, T02, T03, T04, T06; Blutkult Scheibe 1.
- Bugfixes RB-001…006, RB-008, RB-009, RB-013 (Sonne), RB-014, RB-015, RB-017, RB-018, RB-022, RB-024, RB-025.

## Gebaut, ungeprüft (IMPLEMENTED/TESTING)
- T05 Kleinkram.
- Blutkult Scheiben 2–5.
- T08 Gefangene und Ruf der Klinge.
- T09 Läden am Stadtlager.
- T10 Heldentod und Ahnenfeind, mit den Hunter-6-Fixes RB-034…037.
- Varonheim-Belagerung Scheiben 1 und 2: Kriegsknoten, Heerzug, Belagerung, Exil, Rückeroberung, RB-023. Der Verifier (Hunter 7) prüft gerade.
- Control-2-Fixes RB-027, RB-029, RB-030, RB-032.
- T17 Regiebuch Scheiben 1 und 2:
  - Zeitachse (beats), Namenskarte, Sprechblasen
  - Boss-Auftritte mit stehender Welt
  - Szenen zu Varonheim und zum Goblinsturm, Ankunftskarten, Musterung
  - neue Gesten und Klänge
  - Log bleibt unten

## In Arbeit
- Verifier (Sonnet): Belagerung S1 und S2 samt Fixes.
- Artist/Designer (lief noch auf Fable, im alten System gestartet): UI-Umbau mit 3 Varianten in `ROTFALL_AGENT_STATE/designs/` sowie ein Ausbau-Check alter Features (Bausystem u. a.). Die Ergebnisse kommen in `PROPOSALS/`.
- Hauptsitzung: T15 Messing (Stigma und Schwächen der Bionik) wird vorbereitet.

## Blockiert / offen beim Entwickler
- Wahl der UI-Variante (kommt mit dem Fable-Bericht).
- RB-033 (Schaden über Zeit kommt nur zu etwa 60 % an): Systementscheid offen.

## Archiv
- `ROTFALL_AGENT_STATE/` (12-Rollen-System) mit ausführlichen Hunter- und Control-Berichten.
- Audit: `docs/audit/` (TASKS T01–T40).
