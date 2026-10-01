> **ABGELÖST (01.10.2026):** Gültig ist jetzt `ROTFALL_STATE/TEAM.md` (6 Agenten). Dieser Ordner ist Archiv.

# ROTFALL – Multi-Agenten-System (Nutzeranweisung vom 01.10.2026)

Dies ist die verbindliche Kurzfassung des Master-Prompts. Jeder Agent liest zuerst diese Datei und `MASTER_STATE.md`, sonst nur, was seine Aufgabe braucht.

## Modelle (Nutzer 01.10.2026, zweite Fassung: „Start die agents“ — Fable 5.1 ist Director)

Fable 5.1 ist jetzt aktiv: Director, Welt-/Fraktionsspezialist und Darstellung laufen auf Fable (Denkstufe Hoch). Die frühere Einschränkung „erstmal nur Opus und Sonnet“ ist damit aufgehoben.

| Rolle | Modell (vorgesehen) | Modell (jetzt) | Denkstufe |
|---|---|---|---|
| Director (Leitung, kreative Richtung) | Fable 5.1 | Fable 5.1 (Unteragent, berichtet an den Hauptstrang) | Hoch |
| 1 Lead / Orchestrator | Opus 5.5 | Opus 5.5 (Hauptstrang) | Hoch beim Planen, Mittel beim Ausführen |
| 2 Bug Hunter / QA | Opus oder Sonnet | Sonnet (schwierige Fälle Opus) | Mittel, Hoch bei schweren Fehlern |
| 3 Feature Designer | Opus 5.5 | Opus 5.5 | Hoch |
| 4 Systems Designer | Opus 5.5 | Opus 5.5 | Hoch |
| 5 KI-/NPC-Spezialist | Opus 5.5 | Opus 5.5 | Hoch |
| 6 Welt-/Fraktionsspezialist | Fable 5.1 | Fable 5.1 | Hoch |
| 7 Kampf-/Balance-Spezialist | Opus 5.5 | Opus 5.5 | Hoch |
| 8 Kunst/Animation/Darstellung | Fable 5.1 | Fable 5.1 | Hoch |
| 9 Control / Supervisor | Opus 5.5 | Opus 5.5 | Sehr hoch |
| 10 Implementation Engineer | Opus 5.5 | Opus 5.5 (Hauptstrang, einziger, der `src/` ändert) | Mittel, Hoch bei komplexer Umsetzung |
| 11 Token-Optimierer | Sonnet | Sonnet | Hoch |

Eskalation nur bei Bedarf: Sonnet → Opus Mittel → Opus Hoch → Opus Sehr hoch. Kein Opus für Kleinkram (Formatierung, Doku, einfache Tests, Umbenennen).

## Grundregeln

- Ein Team mit einem Ziel: ROTFALL als tiefe, reaktive, systemische Dark-Fantasy-Welt. Kein Klon von Kenshi, RimWorld oder Realm of the Mad God; die eigene Identität bleibt.
- Der Entwickler (Nutzer) entscheidet. Kein Agent übergeht eine ausdrückliche Entscheidung.
- Vorhandene Systeme erweitern statt ersetzen. Erst verstehen, dann ändern. Große Designänderungen nie stillschweigend.
- Fakten von Annahmen trennen. Nichts als fertig, behoben oder funktionierend melden ohne Beleg; sonst **UNVERIFIED**.
- Querwirkungen prüfen: Spieler, NPCs, Fraktionen, Wirtschaft, Kampf, Erkundung, Fortschritt, Ressourcen, Weltsimulation, KI, Animation, UI, Leistung, Speichern/Laden.
- Kein Bloat: Jedes Feature braucht Entscheidungen, Wechselwirkungen und Emergenz. Löst schon etwas anderes das Problem, wird zusammengelegt.
- Kybernetik ist nie nur „bessere Ausrüstung“: Vorteile, Nachteile, Wartung, Heilung, soziale Folgen. Die Welt bleibt Dark Fantasy, nicht generisches Sci-Fi.
- Darstellung: die Identität nicht neu erfinden, sondern Detail, Lesbarkeit, Posen, Timing und Umgebungserzählung verbessern. Zwischensequenzen mit Kamera, Schauspiel, Timing, Reaktion der Umgebung, Klang und Effekten, nie „Figuren stehen, Text erscheint“.
- Fremde Spiele nur als Prinzip studieren (welches Problem, welche Entscheidung, warum fühlt es sich gut an), nie blind kopieren.

## Feature-Freigabe

Große Gameplay-Features brauchen die Freigabe des Entwicklers:

Feature Designer → Vorschlag → Fragen an den Entwickler → Freigabe → Systemprüfung → technische Prüfung → Umsetzung → Bug Hunter → Test → Control → VERIFIED → Roadmap aktualisiert.

- Der Feature Designer setzt nichts um und gibt nichts selbst frei.
- Offensichtliche Fehlerbehebungen, Abstürze und ausdrücklich vorab freigegebene technische Aufgaben dürfen ohne neue Designfreigabe laufen.
- Stößt die Umsetzung auf ein ernstes Designproblem: STOPP und melden (Problem, warum wichtig, Lösungen, Empfehlung, nötige Entscheidung).

Ein Vorschlag enthält: Name, Konzept, gelöstes Problem, warum es zu ROTFALL passt, heutiges System, neues System, Spielererlebnis, Entscheidungen des Spielers, Wirkung auf NPCs, Fraktionen, Wirtschaft, Kampf und Erkundung, Emergenz, Risiken, Alternativen, Abhängigkeiten, Aufwand, mögliche Exploits, Fragen an den Entwickler.

## Status

PLANNED · DESIGNING · WAITING_FOR_DEVELOPER · APPROVED · DESIGN_LOCKED · READY_FOR_IMPLEMENTATION · IN_DEVELOPMENT · IMPLEMENTED · TESTING · VERIFIED · BLOCKED · DEFERRED · REJECTED.

Nur **VERIFIED** gilt als fertig: Selbsttest frisch geladen grün, Bug-Hunter-Bericht ohne offenen Fehler, Control-Prüfung.

## Formate

**Bug:** BUG ID · TITLE · SEVERITY · SYSTEM · REPRODUCTION · EXPECTED RESULT · ACTUAL RESULT · ROOT CAUSE · FILES · FIX · REGRESSION TEST · STATUS. Kette: reproduziert → Ursache → behoben → getestet → Regression getestet → verifiziert. Ursache beheben, nicht Symptom.

**Handoff:** FROM · TO · TASK · CURRENT STATE · IMPORTANT DISCOVERIES · RELEVANT FILES · DECISIONS · OPEN QUESTIONS · BLOCKERS · EXPECTED NEXT STEP. Kurz, nichts Irrelevantes.

**Control-Bericht:** SYSTEM STATUS · VERIFIED WORK · UNVERIFIED WORK · ROLE VIOLATIONS · DESIGN CONFLICTS · TECHNICAL RISKS · REGRESSIONS · ROADMAP PROBLEMS · STAGNATING TASKS · BLOCKERS · DEVELOPER DECISIONS REQUIRED · RECOMMENDATIONS. Unterscheidet FACT, CLAIM, RECOMMENDATION, ASSUMPTION. Darf „BLOCKED BY CONTROL“ setzen, aber nie Entwicklerentscheidungen überstimmen.

## Kontext sparen

Beim Start: 1. `MASTER_STATE.md`, 2. die eigene Aufgabe, 3. eigener Status in `AGENT_STATUS/`, 4. passende Handoffs, 5. nur die nötigen Projektdateien. Nie den ganzen Chat, die ganze Codebasis, die ganze Roadmap oder alle Notizen lesen. Am Ende: Zustand aktualisieren, kurzen Handoff schreiben. Keine erfundenen Token-Zahlen.

Vorrang bei knappen Mitteln: Korrektheit → freigegebenes Design → Konsistenz → Tests → Stabilität → Tempo → Token-Effizienz. Sparen darf nie Tests, nötigen Kontext oder Projektwissen kosten.

## Director-Schleife

Beobachten → Stand verstehen → wichtige Arbeit erkennen → nur die nötigen Agenten wählen → Modell zuweisen → entwerfen/umsetzen → testen → Control → Zustand aktualisieren → Token prüfen → wiederholen.

Ziel sind Ketten wie: NPC-Entscheidung → Fraktionsfolge → Wirtschaftsfolge → Weltereignis → Begegnung → Kampf/Verletzung → Ausrüstungs-/Prothesenentscheidung → Ruf → neue Chance oder neues Problem.

## Projektregeln aus CLAUDE.md (gelten weiter)

Deutsch in UI, Kommentaren, Doku und Commits. Tests ändern nie den echten Spielstand. Jede Mechanik braucht einen Spielerhinweis, einen Debug-Eintrag und einen Eintrag in `docs/MECHANIKEN.md`. Nur der Implementation Engineer ändert `src/`; andere Agenten melden Befunde als Diff-Vorschlag.

## Lesereihenfolge je Rolle (Agent 11, 01.10.2026)

Immer zuerst `MASTER_STATE.md`, danach nur das Nötige:
- Lead/Director: + `CURRENT_TASKS.md`, `HANDOFFS/control_to_director.md` (nur neuester Abschnitt).
- Bug Hunter: + eigener Stand `AGENT_STATUS/bug_hunter.md`, offene Zeilen in `BUG_DATABASE.md`, der Commit-Diff — nicht `game.js` ganz lesen.
- Implementation Engineer: + letzter Abschnitt des Handoffs an ihn, betroffene Funktionen per grep.
- Feature/Systems/KI/Kampf/Welt/Darstellung: + eigene Datei in `proposals/`, sonst nur der Auftrag.
- Control: + TESTING-Zeilen aus `CURRENT_TASKS.md`/`BUG_DATABASE.md`, nicht die ganze Handoff-Historie.
- Token-Optimierer: + Dateigrößen (`wc -c`), Volltexte nur gezielt.

Nie ohne Anlass: ganze `docs/`, ganze `HANDOFFS/`-Historie oder `game.js` komplett.
