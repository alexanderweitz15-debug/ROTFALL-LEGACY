# ROTFALL: LEGACY — Zentrale Roadmap (Stand 08.10.2026, Version 24)

**Dies ist die einzige Liste offener Arbeit.** Sie ersetzt OFFEN.md, ROTFALL_STATE/ROADMAP.md, STATE.md, docs/BUGS.md, ROTFALL_STATE/BUGS.md, PLAN_OFFEN.md, PLAN_S15.md, PHASE_STATUS.md und die Hunt-Berichte (alle gelöscht am 08.10. — Historie: Commit c21fd64, Inventar `ROTFALL_STATE/DOKU_INVENTAR.md` dort). Was hier nicht steht, ist gebaut (siehe `docs/IST_ZUSTAND.md`, `docs/MECHANIKEN.md`) oder verworfen (`ROTFALL_STATE/DECISIONS.md`).

**Verbindliche Vorgaben:** `docs/REGELN_UND_SPECS.md` (Gate, Team, Arbeitsregeln, Balance-Regeln, Specs Welt/Tutorial und Skills/Grind vom 08.10., Kampfanimation, Visual). Entscheidungen: `docs/ENTSCHEIDUNGEN.md`. **Detailtexte der alten Pläne** (T-Aufgaben `docs/audit/TASKS.md`, Entwürfe `ROTFALL_STATE/PROPOSALS/*.md`, Quest-Review `hunt/quest_agent.md`, Ideenspeicher `IDEAS.md`, Doku-Inventar) liegen nur noch in der Git-Historie: Commit **c21fd64** (`git show c21fd64:<pfad>`). Wer ein Paket baut, holt sich den Text von dort.

**Reihenfolge (Spec Welt §55):** Tutorial → Quest/UI → NPC/Gebäude → Stadt/Familie → Betriebe → Gegner/Quest-Content → Skills/Progression (eigene Spec, Phasen 1–7) → Scaling/Performance → Gesamt-QA. Die noch offenen, früher freigegebenen Pakete (T11, T12, T15, T17 S3/4, T20, T23, Belagerung S3b–d) laufen unter dem passenden Thema mit; welche davon vor den Spec-Punkten dran sind, ist Entscheidung E37.

Status: ☐ offen · ◐ teilweise · ✔ heute erledigt (bleibt eine Runde sichtbar, dann raus).

---

## P0 — Spielerlebnis (Spec Welt §50)

| # | Punkt | Stand | Hinweis |
|---|---|---|---|
| P0.1 | Spielbares Tutorial: Mechaniken erleben statt lesen | ◐ | **Wegweiser** (08.10.): 7 erlebbare Schritte (Bewegen, Ansprechen, Händler, Brett/Auftrag, Kampf, Beute, „Wohin?“), eine Karte, wechselt erst nach dem Erleben; Ratgeber-Tipps (`GUIDE`) laufen weiter. Offen: Schmiede-Moment („Schmied arbeitet → beobachten → sprechen → Fenster“) braucht P2.14; Gebäude-/Reise-Hinweise; Testfälle §51 (Softlock, Laden, nicht mehrfach) als Probe |
| P0.2 | Einflug nach ROTFALL | ✔ | Kamerafahrt beim ersten Start (Region, Straße zur Stadt, Markt, Schmiede, Brett, Gefahr, Ruine, zurück); Esc überspringt; alte Stände nie. Offen: sichtbare Reisende/Karawane im Bild erzwingen (derzeit nur, wenn zufällig da) |
| P0.3 | Erste Wege/Ziele als Denkansätze | ◐ | In Einflug-Texten und Wegweiser 7; offen: Kompass ohne Ziel (IDEAS R8.7), erster Kontakt = Brett (R8.6), Herkunft mit Handlung (R8.4) |
| P0.4 | Quest-GUI | ◐ | Auftragsbuch (J) hat Brief, Geber-Porträt, Ziele mit Häkchen ☑/▸/☐, Lohn, Ort, Verfolgen; **Anschlagbrett als Zettel-Fenster** (08.10.). Offen: Kartenausschnitt im Brief (E11), „nur zeigen, was die Figur weiß“ bei Geheimnis-Quests prüfen, Verträge der Wache (`conList`) als Fenster |
| P0.5 | Kein Treffer durch Wände | ✔ | Zentral in `hit()`/`clearLine` (Kacheln + feste Objekte); Pfeile/Zauber prallten schon ab; Dampframme bricht durch. Probe vorhanden |
| P0.6 | Gebäude-Eingänge | ◐ | Alle 504 Haus-Eingänge frei (Prüfung 08.10.); `doorSide` N/S/W/E konsistent in Bau, Bild und NPC-Weg. Offen: der vom Entwickler gesehene Fall (Tür seitlich, NPC frontal) ist nicht reproduziert — Ort nennen; NPC-Anlaufpunkt vor der Tür statt Diagonale; Siedlungsgebäude prüfen. Transparenz hinter/seitlich ✔ |

## P1 — Weltqualität

| # | Punkt | Stand | Hinweis |
|---|---|---|---|
| P1.7 | NPCs ohne Quest | ✔/◐ | Nur noch 3/4/6 Vertragsgeber je Dorf/Stadt/Hauptstadt (vorher 40 % aller Bewohner), feste Auswahl. Offen: Questhinweise über Gerücht/NPC-Gespräch statt Siegel (§43), Zahlen bestätigen |
| P1.8 | Rollenverteilung je Stadt (Geber/Händler/Familie/Wachen/Reisende/Bürger/Story) | ☐ | Rollen existieren implizit (Berufe); explizite Verteilung und Messung je Stadt fehlen |
| P1.9 | Haus ↔ NPC-Zuordnung (wer wohnt wo, warum) | ◐ | `spawnResidents`/`residentPlan` verteilt nach Beruf; keine Kapazität je Haus |
| P1.10 | Familien (verbundene NPCs, gemeinsames Haus, sichtbare Interaktion, Save) | ☐ | Nur die Helden-Dynastie hat Familie. Impact-Report nötig (GATE): Haushalt = Datenstruktur, Nachnamen, Kinder als NPC-Typ, Tagesablauf |
| P1.11 | Wohnraum (klein 1–2, mittel 2–4, groß 4–8, Familienhaus; Betten/Kinderbett/Spielzeug) | ☐ | Möbel mit Funktion vorhanden; Kapazität fehlt |
| P1.12 | Marktplätze skalieren (mehrere Plätze, Tageszeit-Verteilung) | ☐ | Varonheim hat Viertel; Dichte-Messung fehlt (docs/BUGS A-02 „Ballung“) |
| P1.13 | NPC-Dichte/Bewegungsströme Haus→Arbeit→Markt→Taverne | ◐ | Tagesabläufe je Beruf vorhanden; Treffpunkte Brunnen/Tempel/Tor/Trainingsplatz fehlen |
| P1.x | NPC-Visuals Rest: Sprechblasen vereinheitlichen (N1), Stimmungs-Idle (N4); Symbolsatz (E13) | ☐ | visual/npcs.md |
| P1.x | Begehbare Zelte (Lager, Banden, Pilger, Garnison) | ☐ | §5g.4 / T21 |
| P1.x | NPCs mit eigenen Zielen (Händler wechselt Route, Hauptmann desertiert, Abwanderung, Kriegsmüdigkeit) | ☐ | PROPOSALS/npc_eigene_ziele (APPROVED, 4 Fragen E21) |
| P1.x | Orte beleben (Szenen an Schrein/Hain/Ruine, besetzte Städte mit anderen Bannern/Wachen), Fraktionsarchitektur | ☐ | §5g.35 / T33 |
| P1.x | Akademie-Innenleben Rest (Bücher, Anklage verbotene Magie), Lehrer Moorhexe, Himmelsinsel-Ratshändler, Prachtbauten nutzbar, Gefährten-Szenen untereinander, Kinder/Tiere als Stadtbevölkerung, Hausgeräusche | ☐ | §5g.9/11/15/30/36, T29/T32/T38 |
| P1.x | Siedlung als Stadt (Stufen Lager→Stadt, Zuzug, Fraktionsreaktion, Lehen), Siedlung als Marktknoten/Landrecht | ◐/☐ | §5g.19/33, T34; IDEAS 2/3 (nicht freigegeben) |
| P1.x | Weiler je Welt (12–20), organische Stadtanordnung (E26), prozedurale Städte (später) | ☐ | PLAN_OFFEN D, mechanik-check |

## P2 — Betriebe

| # | Punkt | Stand | Hinweis |
|---|---|---|---|
| P2.14–15 | Schmiede sichtbar: Ofen, Feuer, Amboss, Werkbank, Waffen/Rüstungen, Rohmaterial; Schmied hämmert (Funken, Rauch) | ◐ | Props `forge/hearth/chimney/anvil` animiert, Arbeitsplätze mit Werkzeug (`act:'work'`); Innenausstattung je Betrieb und Hammer-Funken nicht vollständig |
| P2.16 | Kunden betreten Läden, kaufen sichtbar, gehen | ◐ | `marketBuy` nur am Marktstand; Kundenlauf **ins** Gebäude, Ware-weg-Effekt, Mitarbeiter reagiert fehlen |
| P2.17 | Mitarbeiter arbeiten sichtbar (holen Material, am Ofen) | ◐ | Arbeiter-Phasen fetch/work vorhanden; in Spielerbetrieben nicht sichtbar |
| P2.18 | Prinzip auf Bäckerei, Taverne, Schneiderei, Apotheke, Werkstatt, Stall, Händler, Bionik übertragen | ☐ | nach P2.14 |
| P2.19 | Spieler arbeitet im eigenen Betrieb (produzieren, Kunden bedienen, Aufträge, Produktion steuern) | ◐ | Handwerk mit Qualität an Esse/Werkbank/Kessel, Betriebe-Reiter mit Kasse; Kunden bedienen/Aufträge fehlen → verzahnt mit Skills-Spec §26–30 |
| P2.x | Kasse am Haus abholen (Betrieb → Haus) (E9); Verlusttage „erst Kasse, dann Gold“ bestätigen (E8) | ☐ | Entscheidung |
| P2.x | Betriebe in besetzten Städten ohne Meldung (SHF-06); Zollgesetz ohne Wirkung auf Überfälle (RB-010); Startlager unter Zielwert (RB-055/058) nachmessen | ☐ | |
| P2.x | Produktionsketten (Holz→Bretter, Erz→Metall→Waffe, Getreide→Mehl→Brot, Tier→Leder) über Betriebe; Werkstücke mit Namen (`o.maker` nie gelesen) | ☐ | MASTER_ROADMAP C.13; IDEAS 4 |

## P3 — Content (Gegner, Quests)

| # | Punkt | Stand | Hinweis |
|---|---|---|---|
| P3.20–23 | Banditen-Rollen (Späher, Schütze, Plünderer, Schläger, Söldner, Anführer, Fallensteller, Reiter, schwer, Dolch) und Goblin-Rollen (Krieger, Speer, Bogen, Schamane, Plünderer, Berserker, Späher, Anführer, Techniker, Fallensteller, Sklave, Arbeiter) — sichtbar anders (Sprite, Rüstung, Waffe, Silhouette, Verhalten) | ☐ | Heute: bandit 4 Typen, goblin 2 + Bosse; Werte-Varianten (`ENEMY_VARIANTS`), Look-Seeds. Rollen mit eigenem Verhalten fehlen. Gegner-Pools der Aufträge nach Rolle mischen (§12) |
| P3.24 | Neue Animationen für Rollen; Kampfanimation §17-Rest (Kampf-Idle, Kampfbewegung, Block/Parade-Haltung je Waffe, Ausweichen je Pack, Trefferreaktionen je Waffe), Nachschwung länger, Ausholen mit Gewicht nach hinten | ☐ | Profile aller Klassen, Gewicht, Oberkörperdrehung, Swoosh seit 04.10. gebaut |
| P3.25–26 | Quest-Zieltypen jenseits „töte N“: Erkundung, Transport, Soziales, Wirtschaft, Weltgeschehen, Geheimnisse; je Questreihe Kernaufgabe/Signaturszene/Emblem | ◐ | Auftragsarten trail/camps/caravanSurvivors/E1–E4 gebaut; feste Reihen überwiegend gleich (quest_agent.md mit 27 Blättern als Vorlage) |
| P3.x | Krieg erzeugt Aufträge (Schmuggel in belagerte Stadt), Kette mit Handelskontakt; toter benannter Geber lässt Quest offen | ☐ | WELT_EVENTS, hunt |
| P3.x | 14 nicht gewählte Gegnerideen (E5); Mutanten als Reise-Hinterhalt, Blutschöpfer-Regel, Werte neuer Gegner (E6) | ☐ | Entscheidung |
| P3.x | Boss-Intros Graumähne/Karrak/Blutfürst; Kerkerausbruch und Ankunft Aurelheim als Szene; eigener Beutepool Graumähne/Karrak | ☐ | 7 Karten gebaut |
| P3.x | Rüstungsvielfalt R1–R7 (Zustand sichtbar, improvisiert, Fraktionsregel, Rarität-Kante, Set-Hände/Beine, 7 Teile ohne Look) | ☐ | visual/ruestungen.md |
| P3.x | Ressourcen-Sprites mit Abbauzustand; 38 Knoten auf Fels (A-04) | ☐ | §5g.3 / T14 |
| P3.x | Geheime Orte Rest (Uhrmacher, Leuchtfeuer, Walknocheninsel); zweite Gischtinsel/Seevolk-Orte; Wasservolk (E25) | ☐ | PROPOSALS/geheime_orte |
| P3.x | Dungeons: Rätsel/Fallen vertiefen, Gewölbe-Events; P10 Aurelion sichtbar überlegen (Laternen, Automaten-Streifen, Kräne, Fabrik); Expeditionen, Krankheiten-Modell, Weltgeheimnisse ohne Marker | ◐/☐ | |
| P3.x | „Ende der Brüder“-Ideen (E29); Eisenfeste zerstört → Goblins zu den Untoten; Totenland bei der Schwarzen Feste leer (BUG-143) | ☐ | |
| P3.x | Bossgespräche (Weißbart, Garmadon) als Story-Fenster; Bewohner rufen den Helden, Szene bei Story-Abschluss, Hinweis auf seltene Beute (E10) | ☐ | |
| P3.x | Welt-Ereignisse mit Namenskarte + Ton (`bigAnnounce` nur Log/Toast) — Details E22 | ☐ | entschieden 02.10. |
| P3.x | T17 Szenen 3/4 (Hrodvar-Frost, Garmadon-Herzschlag, Hinrichtung am Galgen, Goblinsturm Sieg/Niederlage), T20-Rest (Heimweg, Gräber, Aufstand als Kolonne), Goblin-Befreiung dynamisch, Luftschiff-Absturz mehrstufig | ☐ | PROPOSALS/t17 |

## P-Skills — Progression/Grind (Spec Skills, Phasen 1–7)

| Phase | Punkt | Stand | Hinweis |
|---|---|---|---|
| 1 | Skill-Core: Definition, Level, XP, Meilensteine, Perks, Meisterschaften — zentral gespeichert, Legacy-Regel (Charakter- vs. Weltwissen) | ☐ | Vorhanden: `p.skills` (Waffenübung, Schleichen, Jagd, Schmieden, Handel, Führung …, 0–100, wachsen durch Nutzung), Handwerksqualität, Sternbild-Talente. **Erweitern, nicht neu bauen** (Spec §57) |
| 2 | Kampf-Skills verändern den Kampfstil (Freischaltungen je 5/10/15/20/25/30/40/50), XP nach Gegnerstärke, Katana als Testklasse | ☐ | Katana existiert als Waffenart nicht — Entscheidung: Schwert-Unterart oder neue Klasse |
| 3 | Gathering: Fischen als Minisystem, Holz, Bergbau mit Ressourcen/Höhlen, Sammeln, Kräuterkunde, Jagd aktiv (Spuren) | ☐ | Jagd (Beute/Felle) und Kräuter vorhanden; Fischen/Bergbau-Tiefe fehlen |
| 4 | Crafting: Schmieden/Kochen/Alchemie als Skills, Qualität nicht zufällig, Rezepte entdecken, Werkzeugstufen | ◐ | Qualität nach Skill vorhanden; Kochen/Werkzeugstufen fehlen |
| 5–6 | Spezialisierungen, Skill-Trees mit echten Entscheidungen, Meisterschafts-Herausforderungen | ☐ | Sternbilder je Klasse vorhanden (Talente) — Verhältnis Talent-Sterne ↔ Skill-Spezialisierung klären (Entscheidung) |
| 7 | Weltintegration: Skill-Hubs je Stadt, Trainer/Bücher, Skills erzeugen Geschichten, Anti-Grind/Diminishing Returns, Skill-Fenster, Meilenstein-Meldung, Debug | ☐ | |
| alt | Aurelion-Ränge 3–6 mit Prüfungen; Gefährten-Ausrüstung/Befehle/Tier als 4. Mitglied; Magie-Kombos, Runen/Sockel; Barde ausbauen; Taschendiebstahl; Zerlegen an der Werkbank (+ 7 Teile ohne Quelle); Rüstungsklassen/Schlagarten, Gegner verteidigen sich; Wundbrand/Waffenkunst/Blessuren | ☐ | §5g.7/10/23/26/28/31/34, T16/18/19/22/25/26/36/37, Welle 2 |

## P4 — Technik, Wirtschaft, Fraktionen, Koop, Tests

| # | Punkt | Stand | Hinweis |
|---|---|---|---|
| P4.27 | Gegner-Scaling-Audit (alle Gebiete/Arten, Rollenmix statt LP) | ☐ | T24; 3.8/3.9 Entscheidungen E38/E39 |
| P4.28 | NPC-Simulation nach Nähe (nah voll, mittel vereinfacht, fern abstrakt mit Rekonstruktion) | ◐ | `tierOf` stuft, Ferne ~1×/s; abstrakter Fernbereich fehlt |
| P4.29 | Marktplatz-Performance, 3-ms-Marke belegen, Hebel (`paintR`-Schwall, `nearEnts`, `tierOf`), Bild-Cache-Größe, Lauf-Bilder vorbacken | ☐ | perf/PLAN.md |
| P4.31 | Save/Load-Tests für Tutorial, Familien, Betriebe, Städte; Spielstand-Versionierung/zentrale Felddefinition | ☐ | Regeln: neue `performance.now()`-Felder in `PERF_KEYS`, neue Look-Felder in `HS_ENT`/`HS_PAL` |
| P4.32 | Regression: Verifier über alles seit 01.10. → [VERIFIED]-Push; Selbsttest-Dauer (2,5–3 min) und Aufräumen; Stresstest Fest/Belagerung; Cutscene-/End-to-End-Tests | ☐ | letzter main-Push 2a351d9 (04.10.) ohne [VERIFIED] |
| Wirtschaft | T23 Fraktionsressourcen (DESIGN_LOCKED), T12 Straßen haben Herren (APPROVED), eigene Karawane ausbauen, Luftschiffe (V7/V8, Piraten), Stadtwerte (Sicherheit/Kriminalität), Alchemie-Handel/Fallen, Aurelion-Industrie, Wiederaufbau mit Material, POIs | ☐ | PROPOSALS/t23, t12 |
| Fraktionen | Fall Aurelions als Weltereignis (T40/§5g.8), Kriegsgraph mit Aurelion/Diplomatie, Belagerung S3b–d (E18), T15 Messing (Stigma Bionik, Energiezellen), Bionik im Krieg (E19), Luftbrücke (E20), A-10-Rest (Innenkarten/heimatlose Reisende → Valen), gleichwertige Rangvorteile aller Fraktionen, Morrgrund-Fragen (E24), Karraks Wüste (E27), Fit-Befunde (E33), Hunt-Reste ohne Code-Marker (HB-24/25/27–31/34/35/43–47), Dynastien als Politik, Stigma für weitere Fraktionen | ☐ | |
| Koop | Gast-Handel per Dock (Adapter `tradeUI` ↔ `shopData`; BLOCKIERT), HB-30, Ersatz-Lebensbalken beim Gast, Live-Test Kampfanimation/Klänge/Fenster, Aufladen des schweren Hiebs für Gäste, Gäste immer Mensch (E17) | ☐ | |
| Technik | Toter Code (SC-01 `buildVaronburgOld`, SC-03 ohne Debug), SW-01 `.find(...).name` ohne `?.` (6 Stellen), SW-02 Probe schreibt `ITEMS.__wall`; RB-028 `deleteSlot`, RB-012, RB-033 (E31), RB-059 Nachmessung; Musik je Region (sfx.js ohne `music`); Touch auf Gerät; Tastenbelegung; doppelte Bodenauflösung (E28); game.js modular (23k Zeilen) | ☐ | |
| Audit 04.10. Rest | 3.16 `addRep()` zentral (32 direkte Schreibstellen); Phase-4-Abnahmeprobe „Erbe“ (alle Felder gegen die Tabelle); Phase 5 (Gold-Senken: Betriebssteuer, Unterhalt, Bank; Garmadon als Hauptauftrag mit `q_omega`; `factionAgenda` für alle; zweite Lehrer Frost/Blitz/Schatten/Glaube/Paladin; Zerlegen; Boss-Intro/Beute Graumähne/Karrak; Rohstoff-Dubletten); Phase 6 IST neu generieren (Zählungen per Skript) | ☐ | |

## Pflege-Docs nachziehen (keine Features)

README (Modultabelle: coop, body, fig5, sim, economy; „512×512, 26 Orte“ veraltet), MECHANIKEN SC-02-Absatz („Übernahme folgt in Scheibe 2b“ ist gebaut), IST_ZUSTAND Zählungen per Skript neu (Audit Phase 6).

---

## Arbeitsprotokoll (Planlauf ab 08.10.2026)

Legende: **✔** fertig gebaut (Selbsttest grün) · **🔍** muss geprüft werden (im Spiel/von dir) · **🐞** Bug gefunden, nicht behoben (kommt in die Fehlerrunde danach) · **⚖** vorläufige Entscheidung von mir (bitte bestätigen).

| Datum | Punkt | Status | Was / wo |
|---|---|---|---|


---

## Offene Entscheidungen des Entwicklers

Nur Fragen ohne Antwort in `docs/ENTSCHEIDUNGEN.md`. Vorläufig gesetzte Zahlen stehen als „bestätigen“ — sie laufen so, bis du etwas anderes sagst.

**Aus dem Audit 04.10. (Antwort steht aus):**
- E-A1 Kleriker nach Totenpakt: (a) so lassen, (b) ordensferner Lehrer, (c) Sühne beim Orden hebt die Sperre — Vorschlag (c).
- E-A2 Endbosse schwächer als Zonen: (a) Boss-Stufe = max(fix, Spieler − 3), (b) Zonenspanne 25–35 — Vorschlag (a).
- E-A3 EP-Kurve: (a) Faktor ab 20 auf 1,08, Max 60, (b) Max-Stufe 40 — Vorschlag (a).
- E-A4 Erbe: Rook-Feindschaft des Mönchs endet mit dem Tod? (Vorschlag ja) · „Zwanzig Jahre später“: 20× dayTick oder entfernen? (Vorschlag 20× dayTick).
- E-A5 Schadensdeckel ×6 statt additiver Gruppen — reicht das?

**Vorläufige Zahlen bestätigen:** E2 Ersatz-Lebensbalken 5 s · E12 Klassenprüfungen (Platz halten 50 s, Grube ×2 LP/×1,6, EP 80/110) · E14 Schlacht +5/Befreiung +10 Ruf, Schleich-Sicht 55 %/30 %, Jagd +60 %/40 % · E15 Wanderautomaten (Gewicht 1, 2 von 5 anwerbbar, kostenlos) · E16 Wüstenbund (Eskorten +25 %, kein Zoll ab Rang 0; eigene Kerkerkarte?) · E17 Fraktions-Starts (10 Punkte, PROPOSALS/fraktions_starts) · 08.10.: Geber je Ort 3/4/6; Wegweiser-Schritte und Texte; Haus-Transparenz 50 %; Lager 48 + 24.

**Design offen:** E1 Haltung/Humpeln verwundeter Gegner · E3 Händlergesicht nach Ruf · E4 schwerer Hieb (Faktor, Ladezeit, Ausdauer, Touch, Koop) · E5 14 Gegnerideen · E6 Mutanten-Hinterhalt/Blutschöpfer · E7 Skilltree-Scheiben 3/4 streichen · E8/E9 Betriebskasse · E10 Bewohner rufen/Story-Szene/Beute-Hinweis · E11 Kartenausschnitt im Brief · E13 Symbolsatz Sprechblasen · E18 Belagerung S3 (Kellerweg, Varons Strenge) · E19 Bionik im Krieg · E20 Luftbrücke (4) · E21 NPC-Ziele (4) · E22 Welt-Ereignis-Karte (4) · E23 Städte-Visual (4) · E24 Morrgrund (3) · E25 Wasservolk · E26 organische Stadtanordnung (Vorschlag: nur neue Häuser) · E27 Karraks Wüste (Vorschlag: friedlich) · E28 Bodenauflösung · E29 Ende der Brüder (8 Ideen) · E30 70 stumme Figuren · E31 Gift/Feuer/Blutung 60 % · E32 Pferde-Sprites reichen? · E33 17 Fit-Urteile · E34 Ideenspeicher freigeben? · E35 Welle 2 Reihenfolge · E37 Spec-Reihenfolge vs. alte APPROVED-Pakete · **E38 Katana:** Schwert-Unterart oder eigene Waffenklasse? · **E39 Skill-System:** Sternbild-Talente bleiben, Skills ergänzen (Vorschlag) oder zusammenlegen?

Erledigt heute (E36): Doku auf fünf Dateien reduziert (ROADMAP_ZENTRAL, IST_ZUSTAND, MECHANIKEN, ENTSCHEIDUNGEN, REGELN_UND_SPECS) plus STYLE_GUIDE, README, CLAUDE.md; alles andere gelöscht (Historie c21fd64).
| 08.10. | Bugfix Kerker | ✔ | Am Zellengitter galt man als ausgebrochen (Türfeld y 9,24 > Grenze 9). `inJailCell` zählt Türfeld mit; Probe + Live-Test |
| 08.10. | P0.1 Haus-/Reise-Hinweise | ✔ 🔍 | Erstes Betreten eines Hauses → Erklärung; GUIDE „travel“ bei Kutscher/Fährmann. 🔍 Texte im Spiel lesen |
| 08.10. | P0.2 Reisende im Einflug | ✔ 🔍 | Kamera folgt einem echten Reisenden/einer Karawane (wenn im Umkreis 220 Felder). 🔍 neues Spiel starten und ansehen |
| 08.10. | P0.3 Kompass + Herkunft | ✔ ⚖ | Kompass zeigt im Wegweiser-Schritt „Arbeit“ zum Brett; 5 Herkunfts-Startzeilen (Texte von mir). „Erster Kontakt ein Gesicht statt Brett“ nicht gebaut (Wegweiser 2 „Ansprechen“ deckt es teilweise) |
| 08.10. | P0.4 Verträge als Fenster | ✔ 🔍 | Wache/Kette/Freie/Arbeiterrat nutzen das Zettel-Fenster. 🔍 Abgeben bei der Wache im Spiel prüfen. Offen: Kartenausschnitt (E11), Geheimnis-Quests „nur was die Figur weiß“ — Stichprobe ok (find-Ziele ohne Kartenpunkt) |
| 08.10. | P0.6 Türen | ✔ 🔍 | **Ursache gefunden:** benannte NPCs standen immer 2 Felder unter der Tür, auch bei W/O/N-Türen (`doorFront`). Feldmarschall-Familien ebenso. 🔍 an einem Haus mit Seitentür ansehen |
| 08.10. | P1.7 Gerüchte statt Siegel | ✔ ⚖ | Szene „Hast du gehört? X sucht …“; danach Siegel aus der Ferne, sonst nur nah |
