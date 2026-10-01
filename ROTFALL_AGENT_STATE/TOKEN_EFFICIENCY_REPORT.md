# Token-Effizienz

Keine exakten Zahlen verfügbar; nur relative Beobachtungen.
- 01.10.: Agenten-Aufträge ohne Screenshots (die blockierten). Der Hunter bekommt nur die geänderten Funktionen genannt.
- game.js (~17 000 Zeilen) nie ganz lesen: gezielt mit grep und Zeilenbereichen.
- Zustandsdateien verweisen auf vorhandene Doku, statt sie zu kopieren.

## Prüfung Agent 11 (Token-Optimierer), 01.10.2026

- Größte Brocken nach Byte-Größe: `proposals/*.md` zusammen 138 KB (5 Dateien, 14–49 KB je Vorschlag), `HANDOFFS/bug_to_implementation.md` 51 KB (Hunter 1–5), `HANDOFFS/control_to_director.md` 21 KB (wird von Control gerade beschrieben). `AGENT_STATUS/*.md` dagegen sehr schlank (meist unter 500 Byte) — gute Praxis, kein Handlungsbedarf.
- Archivierung von Hunter 1–5 **nicht durchgeführt**: die zugehörigen Bugs (RB-001/002/003/008/013/014/017/018/023/024/025) stehen in `BUG_DATABASE.md` noch auf TESTING, nicht VERIFIED/closed — nur RB-007 (REJECTED) und RB-009 (VERIFIED) sind fertig. Das Kriterium "alle Bugs VERIFIED oder closed" ist damit nicht erfüllt. Empfehlung: nach der nächsten Control-Freigabe erneut prüfen und dann archivieren.
- Modellzuteilung: kein Opus-Einsatz für Kleinkram gefunden; die Regel dazu steht schon in `AGENT_SYSTEM.md` und wird eingehalten. Fund (keine Korrektur, nur Hinweis): `AGENT_STATUS/director.md`, `world_specialist.md`, `presentation_specialist.md` sagen noch "(Opus statt Fable)", obwohl `AGENT_SYSTEM.md`/`MASTER_STATE.md` Fable 5.1 für diese drei Rollen als aktiv melden — veraltet, sollte beim nächsten Einsatz dieser Rollen korrigiert werden.
- Wiederholung von Regeltext: Handoffs und Vorschläge verweisen bereits korrekt auf `AGENT_SYSTEM.md`, statt Regeln zu kopieren. Einzige kleine Dopplung: die FAKT/VORSCHLAG/ANNAHME-Kennzeichnungszeile steht wortgleich in allen 5 `proposals/*.md` (~150 Byte je Datei, vernachlässigbar).
- Standard-Kopf für Agentenaufträge (Vorschlag, spart Wiederholung der Grundregeln/Formate): Rolle+Modell · Aufgabe (1–2 Sätze) · Kontext-Datei(en) · "Regeln/Formate siehe AGENT_SYSTEM.md, nicht wiederholen."
- `AGENT_SYSTEM.md` um Abschnitt „Lesereihenfolge je Rolle“ ergänzt (Dateiende, sonst unverändert).
- Nicht angefasst: `HANDOFFS/bug_to_implementation.md` (Archivierungskriterium nicht erfüllt, siehe oben) und `HANDOFFS/control_to_director.md` (wird von Control gerade geschrieben).
