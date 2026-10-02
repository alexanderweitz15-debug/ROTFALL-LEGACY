# ROTFALL – Feature Readiness Gate (Entwickler, 02.10.2026 — verbindlich für alle Agenten)

**Ein neues Feature wird nie sofort implementiert.** Zuerst wird festgestellt, ob es im bestehenden Spiel vollständig definiert und systemisch integriert ist. Ziel ist nicht, schnell etwas Funktionierendes zu bauen, sondern dass ein Feature danach nicht an zehn anderen Stellen unfertig, inkonsistent oder halb integriert wirkt.

## 1. Erst analysieren (noch kein Code)
1. Alle Systeme suchen, die mit dem Feature zusammenhängen.
2. Ähnliche bestehende Features und deren Umsetzung suchen.
3. Prüfen, welche Regeln es schon gibt — und welche fehlen.
4. Prüfen, welche Teile des Spiels auf das Feature reagieren müssten und ob bestehende Systeme dadurch widersprüchlich werden.
5. Save/Load und Persistenz prüfen.
6. UI, NPCs, Welt, Quests, Fraktionen, Ruf, Ereignisse, Kampf, Beute und Simulation prüfen, soweit betroffen.
7. Bestehende Proben prüfen; gezielt Stellen suchen, an denen das Feature nur halb umgesetzt werden könnte.

## 2. Keine eigenmächtigen Designentscheidungen
Was weder das Design vorgibt noch ein bestehendes System eindeutig ableiten lässt, wird **nicht erfunden** (Beispiel: Aus „Wenn Omega stirbt, wird der Westen feindselig und der Osten feiert den Spieler“ folgen NICHT automatisch Kopfgeld 2500, Ruf −100, Ruhm +30, sofort angreifende Wachen, Dialogverweigerung, Trauerzüge, neue Ereignisse, Reaktionen oder Belohnungen). Solche Dinge sind entweder (A) durch bestehende Systeme eindeutig definiert oder (B) eine offene Designentscheidung.

## 3. Offene Designentscheidungen melden
Fehlt Wichtiges, zuerst eine Liste „OFFENE DESIGNENTSCHEIDUNGEN“ (z. B. wie stark sinkt der Ruf, welche Fraktionen, welche Wachen, wie lange, was mit laufenden Quests/Händlern/neutralen NPCs, was beim späteren Betreten, bei Save/Load, bei neuem Spielstand, welche NPCs wissen davon). Implementiert wird erst, wenn bestehende Regeln oder das Design sie beantworten.

## 4. Vollständigkeit prüfen (jeder Bereich bewusst, nicht jeder betroffen)
- **Welt:** Städte, Dörfer, Regionen, Fraktionen, Gebäude, Schreine, Straßen, Reisende.
- **NPCs:** Dialoge, Beziehungen, Tagesabläufe, Reaktionen, Fraktion, Angst, Aggression, Gerüchte/Wissen.
- **Fraktionen:** Ruf, Feindschaft, Bündnisse, Beziehungen, Gebiet, Reaktionen auf große Ereignisse.
- **Quests:** aktive, künftige, abgeschlossene, gesperrte; Auftraggeber; Belohnungen.
- **Simulation:** Zeit, Ereignisse, Reisen, Karawanen, Bevölkerung, Gerüchte, Weltzustand.
- **Kampf:** Aggro, Wachen, Verbündete, Gegner, Zwischenszenen, Unverwundbarkeit.
- **Beute:** Drops, garantierte, seltene, Questgegenstände, Unikate.
- **Persistenz:** Speichern, Laden, Neustart, schon ausgelöste Ereignisse, Weltzustand, NPC-Zustände.
- **UI:** Dialoge, Statusanzeigen, Karten, Tagebuch, Ruf, Hinweise, Meldungen.

## 5. Keine halben Features
Fertig ist ein Feature erst, wenn der Weltzustand dauerhaft geändert ist, betroffene Fraktionen und NPCs es kennen und reagieren, bestehende Systeme den neuen Zustand berücksichtigen, Save/Load funktioniert, die Simulation ihn beachtet und keine alte Reaktion widerspricht.

## 6./7. Bestehende Systeme nutzen, keine Sonderfälle
Gibt es schon ein System (Ruf, Fraktionen, NPC-Wissen, Weltereignisse, Gerüchte, Angst, Aggro, Beute, Queststatus, Zwischenszenen, Weltzustände), wird kein paralleles Spezialsystem gebaut (nicht `omegaDeathWestHostile = true`, nicht `if (omegaDead) {…}`, wenn ein allgemeines System es kann).

## 8. Vor dem Code: FEATURE IMPACT REPORT
Feature · Betroffene Systeme · Bereits vorhanden · Fehlende Infrastruktur · Offene Designentscheidungen · Risiken · Implementierungsplan. Erst danach Code.

## 9. Danach: systemischer Test
Nicht nur der Glücksfall: Zustand vorher, Auslösen, Zwischenszene (kein Schaden währenddessen), Ende, Reaktionen aller betroffenen Seiten, Beute, Speichern während/nach, Laden, Neustart, bestehende Quests und Ereignisse laufen weiter, keine alten oder widersprüchlichen Reaktionen, Weltzustand bleibt dauerhaft richtig. Danach der Selbsttest.

## 10. Nicht „fertig“ sagen, wenn nur der Glücksfall läuft
Dann: **STATUS: BLOCKIERT / TEILWEISE DEFINIERT** mit Liste der fehlenden Punkte.

## 11. ROTFALL ist eine persistente, simulierte Welt
Wichtige Ereignisse (Tod eines Bosses oder wichtigen NPCs, Fall einer Stadt, Krieg, Fraktionswechsel, Zerstörung eines Gebäudes, Entdeckung eines Gebiets, wichtige Questentscheidung) sind Weltzustand und werden auf langfristige Auswirkungen geprüft.

## 12. Priorität bei Unsicherheit
1. Bestehendes System wiederverwenden · 2. Bestehendes Design beibehalten · 3. Konsistenz der Welt · 4. Fehlende Designentscheidung melden · 5. erst dann neue Logik. Niemals: „Ich denke mir schnell eine sinnvolle Lösung aus.“

## 13. Wichtigstes Ziel
Aktiv suchen, was der Spieler beim normalen Spielen entdecken würde mit dem Gedanken „Moment, warum funktioniert das hier noch nicht?“ — und das VOR der Umsetzung finden. Nicht nur testen, ob das Feature funktioniert, sondern ob die Welt danach logisch und konsistent bleibt.
