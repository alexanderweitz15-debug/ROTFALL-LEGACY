# STATE — ROTFALL (01.10.2026, abends)

Zuerst lesen. Team und Projektfakten: `TEAM.md`. Kurz halten (unter 100 Zeilen).

## Stand
- Version 23 (`?v=23`). Selbsttest 357/357 bei Commit `7d3a384`. Git: `--git-dir=../_rf_backup.git --work-tree=.`.
- Der öffentliche `main` bekommt nur Commits mit [VERIFIED]. Letzter Push auf `main` liegt vor dem Audit.

## Fertig (VERIFIED)
- Audit T01–T04, T06, T08; Blutkult S1; T17 Regiebuch S1+S2; Control-2-Fixes.
- RB-001…006, 008, 009, 013–015, 017–020, 022, 024–027, 029, 030, 032, 038, 039, 041, 043–056.
- Feinde unter sich (FOE_FAC), Königstod, Stadt ohne Schutz S1, Kampf-Ideen (Scout R4), Lebendige Hauptstadt (Scout R5), Varonheim S1 (Kronfels).

## Gebaut, ungeprüft
- Varonheim-Umbau S2 (Burg in der Welt), S3 (Burgfrieden), S4 (Schmuggel), S5 (Start in Varonheim).
- Artist R5 (Viertel-Architektur, neue Props: market_stall, fountain_grand, street_lamp, banner_pole, barrel_stack, cargo_pile, grave_cross, tomb — noch nicht platziert), Artist R6 (Figurenvielfalt).
- Fixes: Karawanen-Wegpunkt geklemmt, WEAR_BIAS für Burg, BTYPES der Burgbauten.
- T05, Blutkult S2–5, T09, T10, Belagerung S1/S2 (Teile verifiziert).

## In Arbeit
- Verifier: RB-059 (Bedrohung fällt zu früh, Tag 81 statt ~129) mit voller Tageskette neu messen; RB-060 (flaky Eisenfeste-Probe).
- Artist R7: Umgebungsanimationen (render.js).
- Scout R9: Mittelspiel-Ziele.
- Hauptsitzung: nächste Bauscheiben (s. u.).

## Nächste Bauscheiben (vom Entwickler freigegeben)
1. Stadt ohne Wachen S2 (PROPOSALS/stadt_ohne_wachen_s2.md; Fristen je Schritt).
2. Emergente Quests E2 → E1 → E4 → E3 (PROPOSALS/emergente_quests.md).
3. Siedlung M1–M4 (siedlung_ausbau.md; Siedlung nie übernommen).
4. Backlog: T15 Messing + Feldreparatur, T11/A14 Hunger, T12 Straßen, T23, NPC-Ziele, Luftbrücke/Verwundete, Belagerung S3, Regiebuch S3/4, UI-Scheiben 2–5, T20-Rest, RB-028/010/012/033/053.

## Offen beim Entwickler
- Geheime Orte (PROPOSALS/geheime_orte.md): 3 Fragen.
- Scout R8 (erste Spielstunde): Auswahl offen (Kodex- und Talenthinweis schon in S5 gebaut).
- RB-033 (Schaden über Zeit ~60 %): Systementscheid.

## Archiv
- `ROTFALL_AGENT_STATE/` (altes 12-Rollen-System). Audit: `docs/audit/`.
