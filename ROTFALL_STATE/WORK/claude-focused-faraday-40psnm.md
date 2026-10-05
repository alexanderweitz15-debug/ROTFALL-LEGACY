# Arbeitsstand — Zweig claude/focused-faraday-40psnm (05.10.2026)

Plan und Langzeitgedächtnis für diese Aufgabe: **`docs/PLAN_WELTTIEFE.md`** (Audit, Bewertung, Pakete W1–W11, offene Designentscheidungen). Beim Kaltstart zuerst diese Datei, dann den Plan lesen.

## Ziel
Auftrag „World Depth, Quest Variety & Gameplay Expansion“: Welt reaktiv, Aufträge abwechslungsreich, Systeme verbunden — ohne Rewrite, auf vorhandenen Systemen (`questEvent`, `S.relations`, `growthOf`, `S.after`, Gerüchte, Angst, Erbe).

## Plan (§3 CLAUDE.md) — aktuelles Paket W1 Ermittlung
- **Systeme:** Aufträge (`QUESTS`, `questEvent`, `talk()`-Geberblock), Props/Interaktion (`interactables`, `doInteract`), Beziehungen (`addRel`), Wohlstand (`growthOf`), Chronik.
- **Dateien:** `src/data.js` (Auftrag), `src/game.js` (Zieltypen, Spuren, Urteil, Probe, Debug), `src/ui.js` (Tracker-Symbole), `docs/MECHANIKEN.md`, `docs/DATA_SCHEMAS.md`, `docs/CHANGELOG.md`.
- **Daten:** keine neuen Save-Felder außer `S.quests[k].outcome` (optional) und `S.flags.clueHint`; Spuren sind `transient`.
- **Abhängigkeiten:** `questComplete`/`turnIn` unverändert; `decide` hängt sich vor `turnIn`.
- **Risiken:** Entity-Listen (actorsOf inkrementell) → Listen nur ersetzen, wenn eine Spur verschwindet; RNG: `freeSpotNear` für Spuren (Probe misst ±30 Kacheln).
- **Tests:** Probe „Welttiefe Slice 1“ im Selbsttest; Live: Debug-Eintrag „Aufträge: Ermittlung …“, Spur mit E lesen, Borin/Elena befragen, Urteil bei Havel.
- **Server-Pfad:** Zustand in `S.quests`/`S.relations`/`S.growth`; Änderung nur über `questEvent`, `questDecide` → `turnIn`; UI zeigt nur.

## Offene Designentscheidungen
Siehe `docs/PLAN_WELTTIEFE.md` (6 Punkte, je mit Empfehlung). Keine davon blockiert W1.

## Erledigt
- Slice 1 (Commit folgt): Zieltypen `talk`/`clue`, `ensureClues`, `clueRead`, `inquiryChoices`, `questDecide`; Auftrag `q_erm_markt` „Blut auf dem Markt“; Probe grün (Selbsttest 489/489 headless); Debug-Eintrag; Doku.

## Nächster Schritt
- Live-Test im Browser (Spur-Prop sichtbar? Prompt „Untersuchen“? Urteil-Dialog lesbar?), dann W1 Slice 2: zweite Ermittlung in einer anderen Region (Vorschlagstabelle zuerst), danach W2 Folgen-Bausteine.

## Teststatus (§5.1)
- Slice 1: `Probe grün`; `Live getestet`: nein, ausstehend.

## Berührte Funktionen
`talk` (eine Aufrufzeile), `doInteract`, `interactables`, `updatePrompt`, `startQuest`, `newGame`/`continueGame` (ensure-Kette), `QUEST_WHERE`, `debugSections`, `selftest`; neu: `inquiryChoices`, `cluePos`, `ensureClues`, `clueRead`, `questDecide`.
