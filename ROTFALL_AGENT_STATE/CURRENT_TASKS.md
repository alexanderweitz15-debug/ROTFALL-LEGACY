# Aktuelle Aufgaben

Status nach `AGENT_SYSTEM.md`. **Diese Tafel ist maßgeblich**; `docs/audit/STATUS.md` ist das ältere Protokoll. Aufgabentexte: `docs/audit/TASKS.md`. Control-Urteile: `HANDOFFS/control_to_director.md` (Audit 2, 01.10., HEAD 6e91074).

## Stand der Aufgaben
| Aufgabe | Status | Wer | Beleg / offen |
|---|---|---|---|
| T01 A1 Wucht mit Standfestigkeit | VERIFIED | Control 2 | |
| T02 V1 Krieg mit Nachschub | VERIFIED (Doku-Nachtrag offen; nach Belagerung S1 neu prüfen) | Control 2 | MECHANIKEN: Deckel 110, nur Angsthase 80 |
| T03 §5g.1 Varonheim | VERIFIED | Hunter + Control | |
| T04 Effekte, Zufall, Klang | VERIFIED | Control 2 | |
| T05 Kleine Korrekturen | TESTING (Hunter fehlt) | Hunter | |
| T06 Spielstand komprimiert | VERIFIED | Control 2 | RB-028 deleteSlot offen |
| T07 Blutkult S1 | VERIFIED | Control 2 | |
| T07 Blutkult S2–S5 | NEEDS FIX | Engineer | Proben RB-019/RB-020; RB-030 Lichtschacht; RB-031 Siegel (Nutzerfrage); RB-032 Ausgangssperre; MECHANIKEN „wirkt ab T40“; Aldhelm-Balance: echter Spieltest |
| T08 Gefangene, Ruf der Klinge | NEEDS FIX | Engineer | RB-027 Schlächter ergibt sich nie; Probe RB-026 |
| T09 Läden am Stadtlager | NEEDS FIX | Engineer | RB-029 Handels-Ausnutzung (Lead: Verkauf hebt Lager); RB-010 toter Zoll-Code |
| T10 Ahnenfeind und Heldentod | TESTING | Hunter 6 läuft | |
| Belagerung S1 (Knoten, Heerzug, Belagerung) | IN_DEVELOPMENT | Engineer | Skript fertig (Trockenlauf ok), Einspielen nach Hunter 6 |
| Belagerung S2 (Fall, Exil, Hof, Kult, RB-023) | READY_FOR_IMPLEMENTATION | Engineer | Nutzer: direkt nach S1 |
| T17 Regiebuch + Zwischensequenzen | DESIGNING | Fable (Darstellung) | Nutzer 01.10.: „mehr Cutscenes“ |
| T23 Fraktionsressourcen | DESIGNING | Fable (Welt) | Nutzer: als nächster großer Vorschlag |
| T15 Messing-Stigma V9 + V10 | READY_FOR_IMPLEMENTATION | Engineer | V10: Energiezelle alle 3 Tage |
| T11 §5g.6/21 + A14 Hunger/Müdigkeit | READY_FOR_IMPLEMENTATION | Engineer | A14 komplett mit DIFF.survival |
| RB-012 Kutschen-Probe wackelt | IN_DEVELOPMENT | Engineer | nur Diagnose |
| RB-033 DoT kommt zu ~60 % an | PLANNED | Systems (Opus) | Entscheid fehlt |

## Plan (Lead, 01.10.; Reihenfolge gemischt groß/klein)
1. **Jetzt:** Hunter 6 abwarten → Belagerung S1 einspielen, Selbsttest, Commit.
2. **Fix-Paket Control 2** (klein): RB-027, RB-029, RB-030, RB-032, Proben RB-019/020/026, Doku-Nachträge. RB-031 als Nutzerfrage.
3. **Belagerung S2** (groß) inkl. RB-023.
4. **T17 Regiebuch Scheibe 1** (Kern + 2 Szenen) — sobald Fables Spezifikation steht und die Fragen beantwortet sind; danach Szene „Fall Varonheims“ und Boss-Auftritte.
5. **T15 Messing** (mittel), dann **T11/A14 Hunger** (mittel).
6. **T23** nach Freigabe; **T12 Straßen**; **Belagerung S3**; **T20 Goblinsturm** (auf T17).
7. Danach Hunter (Sonnet) über alles Neue, Control-Audit, erster [VERIFIED]-Push auf main, wenn alles im Commit geprüft ist.
