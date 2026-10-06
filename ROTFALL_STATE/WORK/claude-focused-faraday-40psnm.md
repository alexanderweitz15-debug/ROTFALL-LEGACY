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
- Slice 1 (Commit folgt): Zieltypen `talk`/`clue`, `ensureClues`, `clueRead`, `inquiryChoices`, `questDecide`; Auftrag `q_erm_markt` „Blut auf dem Markt“; Probe grün (Selbsttest 489/489 headless, nach Korrektur der Spur-Koordinaten); Debug-Eintrag; Doku.

- Slice 1 live getestet (Screenshots im Scratchpad: Prompt, Dialog, Urteil); Prompt-Vorrang für Spuren.
- Slice 2 (6e54d3a): `q_erm_nordfurt` mit `give` (Beweisstück) und `stock` (Marktfolge); Probe grün 490/490; live geprüft bis zum Urteil.
- Nutzerpunkte 05.10. (Commit folgt): `foundCamp` lehnt Stadtgebiet + 6 Felder ab (`townAt`), `dissolveSettlement` + Knopf in `settleUI`, Titel auf Zeit (`titleDay`, `p.titleUntil`, `TITLE_DAYS = 7`); Probe grün 491/491 headless; Knopf live geprüft (B-Fenster, Doppelklick, Kiste, Log).

- W2 Slice 1 (Commit folgt): `effects.memory` → `verdictRemember`/`remember`, Gruß `verdictGreet` in `talk()` (30 Tage), Urteil als Chronik-`news` (Gerücht 5 Tage); Probe grün 492/492; live getestet (Dialogpfad, Gruß, Gerücht, Verblassen).

- W2 Slice 2 (Commit folgt): `QUEST_GIVER_KEYS` in `KEY_ROLE`, `questGiverDeadDay` im Tageswechsel, Log beim Nachfolger; Probe grün, live geprüft.
- Nutzer 05.10. Aufträge: tägliche Auffüllung in `townContracts` (`S.conTop`); Probe grün 494/494.
- Fremder Zweig `origin/claude/exciting-cori-m6jrms` ist verwaist (kein merge-base, 39 alte Commits): nicht lesen.
- Nutzerpunkte 05.10. (alle gemerged, PR #15–#18): BUG-144 Wuchtschlag im Schwung; Varonheim-Hauptplatz entlastet (Treffpunkte vor öffentlichen Häusern); Betriebe: Vorrat liefern + Handel fördern 20 % Karawanenbonus; Eskorte/Lieferung zahlen am Ziel. Selbsttest 498/498.

- Krieg (PR #19, #20): Schonfrist, Streifen, Entsatz, Front lebendig; 45-Tage-Messung in BALANCE.md.
- W3 Slice 1 (PR #21): Zieltyp `escort`, `turnin`, Finn-Auftrag; Probe grün 500/500, live getestet.
- W3 Slice 2 (PR #22): Rettung (`captors`, `captiveOf`, `near`/`off`), Auftrag „Der verschleppte Rekrut“; Probe grün 501/501, live geprüft.
- W3 Slice 3 (PR #23): Lieferung mit Frist (`give`, `hours`, `questDeadlineTick`, Sanduhr), Auftrag „Die Tinktur für Elena“; Probe grün 502/502, live geprüft.
- W4 Slice 1 (PR #24): Schon-Regel `spare` (Graumähne: Rudel schonen); Probe grün 503/503, live geprüft.
- W4 Slice 2 (PR #25): `REGION_CON`/`warHot` in `conKinds`; Probe grün 504/504, live geprüft.
- Stadtbevölkerung (Commit folgt): `bedsOf`/`houseCap` nach Betten, zweites Bett in `FURNISH.house/manor`, Treffpunkte ab 9 Häusern (`spotsOf`), Jäger-Rückfall im Hochreich; Probe grün 514/514, Messung vorher/nachher (pop.js), Screenshot 27.
- W11 Slice 3 (PR #34): Schwarzmarkt-Fenster (`blackUI`, `blackBuy`, `blackList`); Probe grün 513/513, live geprüft (Shot 26).
- W9 Slice 2 (PR #33): sichtbarer Zug wartet bei unsicherem Weg (`caravanFrame`, `ECO.noteRaid`); Probe grün 512/512, live geprüft (Shot 25). Probe „Tiefhall (BUG-009)“ fiel einmal rot und lief im nächsten Lauf grün (zufallsabhängig).
- W11 Slice 2 (PR #32): Fernwaffen-Profile (`RANGED_DEFS`, `rangedPhase`, `rangedBody`); Probe grün 511/511, live geprüft (Shots 22–24).
- W11 Slice 1 (PR #31): Stadtinfo-Fenster (`townInfo`, `townUI`); Probe grün 510/510, live geprüft (Eren, Screenshot 21_w11_stadtinfo.png).
- W10 Slice 1 (PR #30): Arena-Wetter der Regionalbosse (`bossArena`, `arenaClear`); Probe grün 509/509, live geprüft.
- W9 Slice 1 (PR #29): Unsichere Wege (`routeRisk`, `unsafe`, `tradeReturn`); Probe grün 508/508, live geprüft. Nutzerauftrag: W9, W10, W11 zuerst.
- W5 Slice 2 (PR #28): Jagd-Händler (`hunterChoices`, `huntMul`); Probe grün 507/507, live geprüft. Probe „Einwohner folgen der Fläche“ fiel einmal rot (Kopfzahl, zufallsabhängig) und lief danach grün.
- W5 Slice 1 (PR #27): Spuren mit Jagdkunst (`trackEase`, `clue.skill/spawn/near`), Auftrag „Der Keiler von Joruns Feld“; Probe grün 506/506, live geprüft. Zwei alte Proben (Abstand S12, Spawns) fielen einmal zufallsbedingt rot und liefen im nächsten Lauf grün.
- W4 Slice 3 (PR #26): Knochenquelle (`ensureBonewells`, `bonewellTick`, `propHit`, Zieltyp `destroy`), Auftrag „Was aus dem Moor steigt“; Probe grün 505/505, live getestet mit Mausangriffen. Kutschen-Probe ist zufallsanfällig (Feinde an der Straße); Diagnose-Ausgabe eingebaut, beim nächsten Fehlschlag Werte lesen.

## Nächster Schritt
- Nutzerauftrag 06.10.: Elite-Bug (Repro fehlt, Kandidaten: Flucht/`surrendered` in `think`, `isHostile` blockt Ergebene), Gegner-Variation + Gold, W9 S3 Schmuggel, W10 S2 Gewölbe-Arena (Fackeln), Quests anpassen, Dungeons. Davor: W9/W10/W11 je nach Nutzerauftrag gebaut (W9 S1–S2, W10 S1, W11 S1–S3). Offen und nutzerabhängig: W10 S2 Garmadon/Omega kämpfen in Gewölben (Wetter wirkt dort nicht; Arena-Wechsel bräuchte Licht/Boden-Regel), Geheimorte (Lore), Fraktionsübersicht (was fehlt dem Fenster „Mächte“?), W9 S3 Schmuggel in Ketten-Gebiete, Profile Sense/Doppelklinge/Magie/Bosswaffen. Offene Reste: „nur Infizierte“, Quelle kehrt zurück, Gefangener lebend, Nacht-Lieferung — nach Nutzerentscheid.

## Teststatus (§5.1)
- Slice 1: `Probe grün`, `Live getestet`. Slice 2: `Probe grün`, live bis zum Urteil (`Code geprüft` für den Rest, gleicher Pfad). Nutzerpunkte Siedlung/Titel: `Probe grün`, `Live getestet` (Knopf); Titel-Verfall im Tageswechsel nur `Probe grün`. W2 Slice 1: `Probe grün`, `Live getestet`.

## Berührte Funktionen
`talk` (eine Aufrufzeile), `doInteract`, `interactables`, `updatePrompt`, `startQuest`, `newGame`/`continueGame` (ensure-Kette), `QUEST_WHERE`, `debugSections`, `selftest`, `foundCamp`, `dayTick`, `SIM.H.title`, `settleUI` (ui.js); neu: `inquiryChoices`, `cluePos`, `ensureClues`, `clueRead`, `questDecide`, `dissolveSettlement`, `titleDay`, `verdictRemember`, `verdictGreet`, `npcByKey`; geändert: `talk` (Gruß), `newsLine`, `gossip`-Quelle.
