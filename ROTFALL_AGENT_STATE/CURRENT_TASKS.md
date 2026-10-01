# Aktuelle Aufgaben

Status nach `AGENT_SYSTEM.md`. **Diese Tafel ist maßgeblich**; `docs/audit/STATUS.md` ist das ältere Protokoll. Aufgabentexte: `docs/audit/TASKS.md`. Control-Urteile: `HANDOFFS/control_to_director.md`.

| Aufgabe | Status | Wer | Beleg |
|---|---|---|---|
| T01 A1 Wucht mit Standfestigkeit | TESTING (Control: NEEDS FIX → behoben) | Engineer | Standfestigkeit vor hurt() gelesen, Kombo-Wuchtschlag setzt Standfestigkeit, Probe prüft 650 ms |
| T02 V1 Krieg mit Nachschub + Gegengewicht | TESTING (Control: NEEDS FIX → Debug + Probe ergänzt) | Engineer | Leichen, Orden-Heer, Aushebung nach Köpfen: DEFERRED nach T40 |
| T03 §5g.1 Varonheim | VERIFIED | Hunter + Control | Probe „Varonheim“ |
| T04 Effekte, Zufall, Klang | TESTING (Control: NEEDS FIX → Probe ergänzt) | Engineer | gleiche Schwebetexte bündeln + `ambienceKind`: DEFERRED (kein Spielerwert jetzt) |
| T06 Spielstand komprimiert, Caches, HUD | TESTING (Control: NEEDS FIX → Speicherpfad gefixt) | Engineer | Vorwärmen bei Reise: DEFERRED |
| T05 Kleine Korrekturen (V17, A13, Stil F, Doku) | IMPLEMENTED → TESTING | Engineer; Hunter steht aus | Probe „Audit T05“, 325/325; JOIN_FOES geprüft, keine Änderung nötig |
| T07 §5g.2 Blutkult | IMPLEMENTED (alle 5 Scheiben) → TESTING | Engineer; Hunter 4 prüft 2–4, Scheibe 5 steht aus | 334/334; offen/vereinfacht: Beschatten (Weg B), Kult-Aufträge 1–3, Tagebuch-Auftrag, Fledermausschwärme, nächtliche Ausgangssperre |
| T08 Gefangene, Steckbriefe, Ruf der Klinge | IMPLEMENTED (4 Scheiben) | Engineer; Hunter steht aus | Probe T08 ×2; vereinfacht: Banden-Steckbrief für Anführer (Bandenkopfgeld zahlt weiter beim Tod), S.prisoners im Kerker, Wache mehr bei Schlächtern |
| T09 Läden am Stadtlager | IMPLEMENTED | Engineer; Hunter steht aus | Probe T09; RB-010 (Zollgesetz senkt Überfallrisiko nie) noch offen |
| T10 Ahnenfeind und Heldentod | IMPLEMENTED | Engineer; Hunter steht aus | 2 Proben + Live-Test (Testplatz): Moment 3 s, Ahnenfeind mit Waffe, Todesbildschirm, Speichern; vereinfacht: Siedlungsangriff (nur Familie/Dorf), Gerücht in Gesprächen |
| Varonheim als Kriegsknoten (belagerbar) | WAITING_FOR_DEVELOPER | Feature Designer fertig | `proposals/varonheim_belagerung.md`, 4 Fragen |
| RB-008 Slotwechsel schreibt falschen Stand (CRITICAL) | TESTING (Control-Nachtrag: laufendes Komprimieren beim Wechsel → jetzt sofort in den alten Platz) | Engineer | Hunter-Bericht |
| RB-009 komprimierter Slot außerhalb UNZ liest null (MEDIUM) | VERIFIED |
| RB-012 Kutschen-Probe wackelt (etwa jeder dritte Lauf) | IN_DEVELOPMENT | Engineer | Diagnose bei Fehlschlag eingebaut (KDBG), Ursache noch offen | Engineer | Hunter-Bericht |
| übrige T08–T40 | PLANNED | – | `docs/audit/TASKS.md` |
