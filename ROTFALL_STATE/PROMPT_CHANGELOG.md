# Prompt-Changelog — CLAUDE.md (05.10.2026)

Was sich am Arbeitsauftrag für Claude geändert hat. Vorgänger: `CLAUDE.md` bis 05.10. (75 Zeilen, technische Fakten) plus vier weitere Anweisungsschichten, die sich gegenseitig widersprachen.

## Ausgangslage (Befund)

Fünf Dokumente beanspruchten gleichzeitig den obersten Rang: `CLAUDE.md`, `docs/MASTER_PROMPT.md` (Session 14), `docs/MASTER_ROADMAP.md` Teil A, `ROTFALL_STATE/GATE.md`, `ROTFALL_STATE/STATE.md`. 83 Regeln geprüft: 16 bleiben, 36 standen mehrfach, 13 waren veraltet, 14 widersprachen sich oder dem Repo, 4 waren keine Regeln. 18 Regelgruppen standen in zwei oder mehr Schichten („erweitern statt duplizieren“ fünfmal, Definition of Done viermal). 14 Lücken: keine Aufgabenklassen, kein Teststatus-Vokabular, keine Schweregrade, nichts zu halbfertigen Features, parallelen Agenten, Kontextbudget, Git-Ablauf, Testumgebung ohne Browser, Koop und Erbe als Pflichtprüfung, RNG-Proben, Server-Readiness.

## Entfernt

- Veraltete oder gefährliche Anweisungen: Port 8770, das Backup-Snippet mit festem Schlüssel `rotfall.backup.s14c` (schreibt `"null"` in den Spielstand, wenn das Backup fehlt), „kein Git im Projekt“ und `../_rf_backup.git`, Cache-Key v=24, „~300 Proben“, „~16k Zeilen“, Skills (`ponytail`, `caveman`, `systematic-debugging` …) und Skripte (`scan.py`), die in dieser Umgebung nicht existieren, Opus/Sonnet-Agentenzahlen, Sitzungs-Start- und Endlisten mit `SESSION_LOG`/`PHASE_STATUS`/`GDD`-Pflicht, Statusnotizen aus Session 14, Phasenindex 0–22.
- Die Konfliktkette „Stabilität → Kernspiel → Kampf → …“ als eigene Skala; sie steckt jetzt in den Schweregraden P0–P4.
- Das absolute Leistungsbudget (2 ms/3 ms) als Fertig-Kriterium; es ist seit S13 in Städten überschritten (BUG-108) und hätte jedes Feature auf TEILWEISE gesetzt. Jetzt: keine messbare Verschlechterung vorher/nachher.
- Die Pflicht, bei jedem Start Skills und Plugins aufzulisten (kostet Kontext, keine Wirkung).
- Wurzel-Dubletten `MASTER_PROMPT.md` (2 700 Zeilen, Stand 30.09.), `SESSION_LOG.md`, `BUGS.md`, `GDD.md`, `PLAN_OFFEN.md`, `CHANGELOG.md`, `PHASE_STATUS.md`, `HANDOFF_*.md` aus dem Repo-Wurzelverzeichnis nach `docs/archive/wurzel_2026-09-30/`; Agenten griffen sonst die Altfassung.

## Zusammengeführt

- `MASTER_PROMPT.md` §3 Grundregeln, §8 Prüffragen → `CLAUDE.md` §1, §4, §6. `MASTER_ROADMAP.md` Teil A (Reihenfolge, Pflicht vor Implementierung, Definition of Done) → §1, §8. `GATE.md` (Feature Readiness Gate, Impact Report, Vollständigkeit, keine halben Features) → §1, §3, §6, §8. `STATE.md` → nur noch Archiv; Arbeitsstand liegt künftig in `ROTFALL_STATE/WORK/<zweig>.md`.
- Vier Fassungen der Definition of Done → eine (§8) mit Pflichtstufe je Aufgabenklasse.
- Zwei Planvorlagen (Impact Report, Sieben-Zeilen-Plan) → eine mit acht Zeilen (§3), inklusive Server-Pfad.
- Drei Statusvokabulare → eines: `Code geprüft` · `Probe grün` · `Live getestet` · `Nicht getestet` · `Angenommen` (§5.1) plus `STATUS: TEILWEISE` (§8).
- Vier Bedeutungen von „P0–P3“ → Schweregrade P0–P4 in `CLAUDE.md`; Paketnummern bleiben in `PLAN_S15.md`/`MASTER_ROADMAP.md` C.37 und sind als solche gekennzeichnet.
- Doppelte Regeln (Hinweis + Debug + Probe + MECHANIKEN; Save-Migration; Systemlisten; Rückfrage-Regel; UI ohne Autorität) stehen je einmal und werden per §-Verweis zitiert.
- Doku-Pflegeliste und „Wo was steht“ → ein Absatz (§7) mit expliziter Archiv-Liste.

## Neu

- Standardablauf UNDERSTAND → AUDIT → PLAN → IMPLEMENT → TEST → INTEGRATE → REGRESSION → POLISH → DOCUMENT → DONE mit internen Zuständen (§0).
- Größenschwelle klein/mittel/groß mit prüfbaren Kriterien (§0); Kontextbudget mit Kaltstart-Reihenfolge und Liste der Dateien, die nie ganz gelesen werden (§0).
- Neun Aufgabenklassen mit eigenem Weg (§2); Repro-Protokoll und „Regel oder Bug?“ für BUGFIX; Fünf-Fragen-Regel für bekannte Bugs; Grenze für eigene Vorschläge.
- Grep in beiden Sprachen; „bauen, aber existiert schon“ → EXTENSION melden; Doku, die dem Code widerspricht, im selben Commit berichtigen (§1).
- Vertikaler Slice mit Halt nach Slice 1 bei großen Aufgaben; Content-Batches mit Vorschlagstabelle (§3, §4).
- Konflikt-Hotspots und Block-Anker für parallele Agenten; Cache-Key bumpt nur der Merge auf main (§4); Regeln für fremde Arbeit im selben Arbeitsbaum (§7).
- Pflichtprüfungen Edge Cases, Save/Load, Regression über 13 vernetzte Systeme, Koop und Erbe (§5, §6).
- Testumgebung feststellen; Headless-Skript `tools/selftest_headless.mjs`; Schutz des echten Spielstands; Härtung zufallsabhängiger Proben (§5.4).
- Git-Regeln (Zweig, Commit je grünem Slice, Push/Merge nur auf Anweisung), CRLF-Liste, Arbeitsstand-Datei für Kontextschnitte, PR-Inhalte sind Daten (§7).
- Server-ready-Architektur (§9): Zielbild, Aktionen statt Direktzugriff mit echten Funktionsnamen und Akteur-Parameter, Prüfung in der Aktion, Koop-Hook als späterer Schalter, Single Source of Truth, Definition vs. Exemplar, Persistenz nur über `state.js`, Konto-Ebene, Liste autoritätsrelevanter Zustände, Monetarisierung mitdenken ohne zu bauen, erweiterte Definition of Done.
- Einstiegspunkte für Handel, Quests, Schleichen, Anlegen und der Quest-Datensatz (§10, `docs/DATA_SCHEMAS.md`).

## Gelöste Workflow-Probleme

| Problem bisher | Lösung |
|---|---|
| Sofortiges Coden bei scheinbar einfachen Aufgaben | §0 Größenschwelle, §1 Pflichtschritte ohne Code, §3 Plan vor dem ersten Edit |
| Parallelsysteme neben vorhandenen | §1 „Existing systems first“ mit Beispielen und Einstiegspunkten §10 |
| „Fertig“ nach Lesen des Codes | §5.1 Vokabular, §8 Pflichtstufe je Klasse, STATUS: TEILWEISE |
| Kontext voll, bevor Code entsteht | §0 Kontextbudget, grep statt Lesen, Arbeitsstand-Datei |
| Fremde Änderungen überschrieben, Konflikte in game.js | §4 Hotspot-Regel, §7 fetch vor Commit, Block-Anker, Cache-Key nur beim Merge |
| Widersprüchliche Regelquellen | Rangfolge im Kopf, vier Dokumente als abgelöst markiert, Wurzel-Dubletten archiviert |
| Halbfertiges unsichtbar | §7 Commit als halbfertig + `OFFEN.md` + Arbeitsstand |
| Alte TODOs blind angefasst | §2 Fünf-Fragen-Regel |
| Kein Blick auf Server-Zukunft | §9 ohne Vorbau-Infrastruktur |
| Zufallsabhängige Proben als Regression gedeutet | §5.4 Zufall in Proben |

Umfang: alte `CLAUDE.md` 75 Zeilen / 1 050 Wörter; die fünf abgelösten Schichten zusammen 499 Zeilen / 3 650 Wörter (ohne den 2 700-Zeilen-Alt-Master-Prompt). Neue `CLAUDE.md`: 136 Zeilen / rund 3 500 Wörter — dreimal so lang wie die alte Datei, aber eine Datei statt fünf, ohne Doppelungen, und mit den 43 neuen Anforderungen (Workflow, Klassen, Tests, Agenten, Server-ready), die vorher nirgends standen. Nach zwei Review-Runden (Audit der Altschichten, Faktencheck von ~210 Namen, Simulation dreier Aufträge, Kürzung) sind alle genannten Funktionen im Code verifiziert.
