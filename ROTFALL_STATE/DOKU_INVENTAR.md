# DOKU_INVENTAR — alle Markdown-Dokumente im Repo (Stand 08.10.2026)

Auftrag: SPEC_WELT_TUTORIAL_2026-10-08.md §2–5 (Dokumentationsbereinigung). Nur Analyse, kein Spielcode, keine andere Datei geändert.

**Methode.** 180 `.md`-Dateien (`find`). Zeilen = `wc -l`. Datum = letztes Commit-Datum im Backup-Repo (`GIT_DIR=../_rf_backup.git git log -1 --format=%cs -- <pfad>`); die beiden SPEC-Dateien tragen das Dateidatum 08.10. Status aus dem Inhalt, bei Planungs-Dokumenten stichprobenartig gegen `src/` geprüft (`grep`, Code-Stand master `074e676`, 08.10., Selbsttest 483/483 laut Commit). „nicht geprüft“ = keine Zeit oder kein eindeutiger Beleg.

**Legende.** A noch relevant · B teilweise umgesetzt · C vollständig umgesetzt · D veraltet · E Duplikat · F temporär (abgeschlossene Agenten-/Phasendokumente). Empfehlung: **behalten** / **→ Roadmap** (offene Reste in die zentrale Roadmap übernehmen) / **archivieren** (nach `docs/archiv/`) / **löschen**.

**Zahlen.** A 24 · B 32 · C 29 · D 9 · E 17 · F 69 — Summe 180 (Tabellenzeilen in 1.12 fassen 12 AGENT_STATUS-, 6 leere HANDOFFS- und 9 proposals-Dateien zusammen). Offene Punkte (Teil 2): 153 Zeilen in 14 Themen. Offene Entwickler-Entscheidungen (Teil 3): 37 Zeilen, als Einzelfragen 77.

**Wichtigster Befund zum Repo-Zustand.** Es gibt vier parallel geführte „Offen“-Listen (`ROTFALL_STATE/OFFEN.md`, `ROTFALL_STATE/ROADMAP.md`, `docs/audit/TASKS.md`+`STATUS.md`, `docs/PLAN_ROADMAP.md` §5g) und zwei Bug-Listen (`docs/BUGS.md` BUG-xxx, `ROTFALL_STATE/BUGS.md` RB-/HB-). Keine davon ist vollständig nachgezogen; OFFEN.md enthält bereits erledigte Punkte (Boss-Intros, Zauberlehrer, BALANCE_GUIDE §7). `ROTFALL_AGENT_STATE/` ist seit 01.10. Archiv (eigene Aussage) und enthält 9 byte-identische Kopien der PROPOSALS. `docs/ist/A–D.md` sind die Originale von `docs/IST_ZUSTAND.md`; die Nachträge „Audit 04.10. Phase 1“ stehen **nur** in den Teilen, nicht in der Zusammenführung.

---

## 1 Inventar

### 1.1 Wurzel

| Pfad | Zeilen | Datum | Zweck | Status | Begründung | Empfehlung |
|---|---|---|---|---|---|---|
| CLAUDE.md | 75 | 2026-10-02 | Projektanweisung für Claude Code (Architektur, Tests, Regeln) | A | Gültig; „game.js ~16k Zeilen“ veraltet (jetzt ~22,9k), Zeilenende-/RFZ1-Hinweise aus ARCHITECTURE_NOTES fehlen | behalten, Zahlen ergänzen |
| README.md | 91 | 2026-09-28 | Öffentliche Kurzbeschreibung, Start, Steuerung, Modultabelle | B | Modultabelle nennt „512×512, 26 Orte“ und keine neuen Module (coop, body, fig5, sim, economy) | behalten, Tabelle aktualisieren |

### 1.2 docs/

| Pfad | Zeilen | Datum | Zweck | Status | Begründung | Empfehlung |
|---|---|---|---|---|---|---|
| docs/ANIMATION_REFERENZ.md | 201 | 2026-09-30 | Animationstechniken anderer Spiele → Regeln für ROTFALL | A | Referenz für Kampfanimation/NPC-Leben; Gewicht je Waffenklasse (04.10.) folgt daraus | behalten |
| docs/BALANCE.md | 172 | 2026-10-04 | simFight-Messwerte, Stellschrauben | A | Gepflegt bis 04.10. | behalten |
| docs/BALANCE_GUIDE.md | 161 | 2026-10-02 | Bänder und Regeln für neue Inhalte | A | §7 „jede 2. Stufe“ passt wieder zum Code (`TALENT_EVERY = 2`, game.js:4382); OFFEN.md-Hinweis dazu ist überholt | behalten |
| docs/BUGS.md | 61 | 2026-09-29 | Offene Fehler im alten Nummernsystem (BUG-062…143, Audit-S13-Reste) | B | BUG-100 durch `keepSiegeDay` (game.js:9131) behandelt; BUG-108/142/093 durch PERF-Runden 02.10. bearbeitet, Status nicht nachgezogen; BUG-143/062/111 und A-02…P-04 ungeprüft | → Roadmap (Reste), dann archivieren |
| docs/CHANGELOG.md | 199 | 2026-10-02 | Versionshistorie | B | Letzter Eintrag „V24 Fehlerjagd Runde 1“; alles seit 02.10. abends (Klassen/Sternbilder, Fenster, Wüstenbund, Kampfanimation, Audit 04.10., Spec 08.10.) fehlt | behalten, nachtragen |
| docs/DATA_SCHEMAS.md | 98 | 2026-09-28 | Datenmodelle data.js | B | Neue Tabellen seit S14 fehlen (ELITES, STIGMA, BOSS_CARDS, FAC_STARTS, RACES, RANK_LINES) | behalten, ergänzen |
| docs/GDD.md | 324 | 2026-09-28 | Regeln und Werte (Kurzfassung) | B | Kern gültig; Varonheim, Blutkult, Klassenprüfung, Fraktions-Starts fehlen; „Offene Designfragen“ zeigt auf mechanik-check | behalten, nachziehen |
| docs/GUIDE.md | 525 | 2026-10-03 | Spieler-Guide | B | Kopf „Stand S13“; neue Systeme ab 30.09. nicht geprüft | behalten, nachziehen |
| docs/GUIDE_EREIGNISSE.md | 281 | 2026-09-29 | Große Ereignisse für Spieler | B | Varons Tod, Belagerung, Blutkult, Stadt ohne Schutz fehlen | behalten, nachziehen |
| docs/IST_ZUSTAND.md | 3873 | 2026-10-04 | Vollständiges Feature-Inventar (Teile A–D zusammengeführt) | A | Zentrales Inventar laut CLAUDE.md; Kopf „schon behoben“ aktuell bis 04.10.; Zusammenführung ohne die „Audit 04.10. Phase 1“-Abschnitte der Teile (diff: 14/34/28 Zeilen in B/C/D) | behalten; Pflegerichtung festlegen (Teile oder Gesamtdatei) |
| docs/KLASSEN_GUIDE.md | 63 | 2026-09-30 | Klassen für Spieler | B | Klassenprüfungen, Sternbilder, Gefährtenbaum (03.10.) fehlen | behalten, nachziehen |
| docs/MASTER_PROMPT.md | 112 | 2026-09-29 | Stehender Auftrag Session 14 | D | Durch MASTER_ROADMAP (30.09.), GATE/VISUAL/COMBAT_ANIM (02.10.) und die Specs 08.10. überholt; Lore-Regeln stehen in PLAN_OFFEN/GDD | archivieren |
| docs/MASTER_ROADMAP.md | 223 | 2026-09-30 | Verbindliche Arbeitsregeln (Teil A), Animation-Overhaul (B), Feature-Roadmap C.1–C.44 | B | Teil A gilt (ergänzt durch GATE.md). Teil B teilweise (P8, Kampfanimation; B.9 Goblin-Befreiung, B.10 Kamera, B.14 Luftschiff-Absturz offen). Teil C: Bionik P1–P5, Luftschiffe P6/P7, Wetter C.12, Banden, Dynastie gebaut; C.3 Stadtwerte, C.13 Produktionsketten, C.15 Krankheiten-Modell, C.17 Expeditionen, C.24 Fall Aurelions offen | behalten (Regelwerk); offene C-Punkte → Roadmap |
| docs/MECHANIKEN.md | 1409 | 2026-10-04 | Spielerregeln aller Mechaniken (Pflichtdoku) | A | Gepflegt bis 04.10.; SC-02: Absatz „Übernahme folgt in Scheibe 2b“ ist überholt (gebaut) | behalten |
| docs/PHASE_STATUS.md | 37 | 2026-09-28 | Phasenstatus S14 | D | Phasen B/C/D stehen OFFEN, sind gebaut (Seevolk S14, P12, P15); „Nächster Schritt“ erledigt | archivieren |
| docs/PLAN_COOP.md | 184 | 2026-09-30 | Design Netzwerk-Koop K2 | C | K2 gebaut (MECHANIKEN „Netzwerk-Koop K2“, coop.js); Referenz in CLAUDE.md; offene Koop-Punkte stehen in OFFEN.md | behalten als Architektur-Doku |
| docs/PLAN_OFFEN.md | 98 | 2026-09-29 | Offene Pläne/Entscheidungen S14–S15 | D | Block B → P12, C → §5d.7, D Zwerge → §5d.6, F → K2, Seevolk/Tiere → S14 gebaut; Boss-Intros gebaut (BOSS_CARDS). Reste: Weiler je Welt, Bodenauflösung, „Ende der Brüder“-Ideen, Lore-Regeln | Reste → Roadmap, dann archivieren |
| docs/PLAN_ROADMAP.md | 611 | 2026-10-01 | Befund + Paketplan P1–P8 (Bionik/Luftschiffe/Animation) + Nutzerentscheide §5b–§5g | B | P1–P8, §5c–§5f gebaut (MECHANIKEN V20–V22). §5g gebaut: 1, 2, 5, 13, 14, 24, 25, teils 6/12/37; offen: 3, 4, 7, 8, 9, 10, 11, 15–23, 26–36, 38 | behalten (Entscheidungsprotokoll); offene §5g → Roadmap |
| docs/PLAN_S15.md | 858 | 2026-09-29 | Paketplan S15 (P0–P22, K, S, W, G) | B | FERTIG: K, K2, K3, W, S, G, P0–P4, P6–P9, P11–P13, P15, P17, P19, P20; P16 (Varonheim/Burg gebaut, §5d.4); TEILWEISE P5 (Akademie-Innenraum, Druidin/Moorhexe, Kodex Fraktionen); OFFEN P10, P14-Rest, P18 (entschieden, nicht gebaut), P21, P22; §G-Fragen 2/3/5 offen | offene Pakete → Roadmap, Datei archivieren |
| docs/PROMPTS_GRAFIK.md | 112 | 2026-09-28 | ChatGPT-Prompts für Referenzblätter (Stil F) | D | Stil F abgeschaltet (01.10.), Bildgeneratoren gesperrt | archivieren |
| docs/SESSION_LOG.md | 133 | 2026-09-29 | Sitzungsprotokoll | D | Endet bei S15 (29.09.); seit 30.09. nicht gepflegt, Rolle von STATE/OFFEN übernommen | archivieren oder fortführen (eine Entscheidung) |
| docs/STYLE_GUIDE.md | 52 | 2026-10-01 | Stile R/D/F, visuelle DNA | A | Aktuell (R Standard, F aus) | behalten |
| docs/WELTREGELN.md | 400 | 2026-09-28 | Soll/Ist der lebenden Welt mit Status-Zeichen | B | 100 ✅ / 20 🟡 / 5 ⬜; mehrere Zeichen veraltet (Magitech-Waffen C.10 gebaut, Luftschiffreisen P6/P7, Tiere außerhalb S14, Streiks BIG) | behalten, Zeichen nachziehen |
| docs/WELT_EVENTS_S13.md | 81 | 2026-09-28 | Bestand/Ideen Weltereignisse, Quest-Lücken | C | Ideen 1–15 gebaut (`BIG`, `EVENTS`, Jahreszeiten, `evSuccession`); Quest-Lücken bis auf „Krieg erzeugt Aufträge“ und „Kette mit Handelskontakt“ umgesetzt | 2 Reste → Roadmap, archivieren |

### 1.3 docs/archive/ (16 Dateien)

| Pfad | Zeilen | Datum | Zweck | Status | Begründung | Empfehlung |
|---|---|---|---|---|---|---|
| docs/archive/AUDIT_PLAYTHROUGH_S9.md | 327 | 2026-09-28 | Audit-Durchlauf S9 | F | Archiv | behalten im Archiv |
| docs/archive/AUDIT_S13.md | 103 | 2026-09-28 | Audit S13 | F | Archiv; Kleinigkeiten A-02…P-04 noch in docs/BUGS.md gelistet | behalten im Archiv |
| docs/archive/BUGS_behoben.md | 142 | 2026-09-29 | Behobene Bugs je Zeile | F | Archiv | behalten im Archiv |
| docs/archive/BUGS_bis_S13.md | 622 | 2026-09-28 | Volltexte Bugs bis S13 | F | Archiv | behalten im Archiv |
| docs/archive/CHANGELOG_bis_S13.md | 1261 | 2026-09-28 | Changelog bis S13 | F | Archiv | behalten im Archiv |
| docs/archive/DATA_SCHEMAS_bis_S13.md | 163 | 2026-09-28 | Alte Ziel-Schemata | F | Archiv | behalten im Archiv |
| docs/archive/GDD_bis_S13.md | 664 | 2026-09-28 | GDD mit Begründungen | F | Archiv | behalten im Archiv |
| docs/archive/HANDOFF_WELT_FRAKTIONEN_AUSRUESTUNG.md | 383 | 2026-09-28 | Übergabe S11 an andere KI | F | Archiv, Werte veraltet | behalten im Archiv |
| docs/archive/MASTER_PROMPT_1_original.md | 2700 | 2026-09-28 | Master-Prompt 1 wörtlich | F | Archiv | behalten im Archiv |
| docs/archive/MASTER_PROMPT_2_original.md | 3727 | 2026-09-28 | Master-Prompt 2 wörtlich | F | Archiv | behalten im Archiv |
| docs/archive/MASTER_PROMPT_bis_S13.md | 141 | 2026-09-28 | Gestraffter Master-Prompt S13 | F | Archiv | behalten im Archiv |
| docs/archive/PHASE_STATUS_bis_S13.md | 181 | 2026-09-28 | Phasen-Checklisten | F | Archiv | behalten im Archiv |
| docs/archive/PLAN_OFFEN_bis_S13.md | 239 | 2026-09-28 | Erledigte Planblöcke | F | Archiv | behalten im Archiv |
| docs/archive/SESSION_LOG_bis_S13.md | 250 | 2026-09-28 | Session-Log bis S13 | F | Archiv | behalten im Archiv |
| docs/archive/STYLE_GUIDE_bis_S13.md | 55 | 2026-09-28 | Alter Style Guide | F | Archiv | behalten im Archiv |
| docs/archive/WELTREGELN_bis_S13.md | 408 | 2026-09-28 | Alte Weltregeln | F | Archiv | behalten im Archiv |

### 1.4 docs/audit/

| Pfad | Zeilen | Datum | Zweck | Status | Begründung | Empfehlung |
|---|---|---|---|---|---|---|
| docs/audit/AUFTRAG.md | 160 | 2026-10-01 | Nutzerauftrag für den Feature-Audit | F | Auftrag ausgeführt (MASTER_REPORT) | archivieren |
| docs/audit/MASTER_REPORT.md | 475 | 2026-10-01 | Zusammenführung Audit A/B/C, Prioritäten, T01–T40, Welle 2 | B | T01–T10 und T17 S1/2 gebaut; T11–T16, T18–T40 überwiegend offen (Code-Marker nur T15-Vorlauf, T20-Szene, T40-Hinweis); Welle 2 (V5, V8, V11, V15, V16, A11, A12, D12, D17) offen | behalten als Quelle; offene Teile → Roadmap |
| docs/audit/SCOUTS_2026-10-01.md | 36 | 2026-10-01 | Lückensuche vor dem Audit | C | Alle 16 Ideen als §5g.23–38 übernommen | archivieren |
| docs/audit/STATUS.md | 97 | 2026-10-01 | Statustafel 3-Agenten-Pool | D | Stand 01.10., nie nachgeführt (T05–T40 BACKLOG) | archivieren |
| docs/audit/TASKS.md | 485 | 2026-10-01 | Aufgabentexte T01–T40 mit DoD | B | Texte für offene Ts gültig (T11, T12, T14–T16, T18–T40); Statuszeilen veraltet | behalten (Aufgabentexte); Status nur in zentraler Roadmap |
| docs/audit/TEIL_A_GAMEPLAY.md | 496 | 2026-10-01 | Audit Gameplay (A1–A16) | B | A1, A5, A6, A13 gebaut; A2–A4, A7–A9, A11, A12, A14–A16 offen (nicht einzeln geprüft) | behalten als Quelle |
| docs/audit/TEIL_B_WELT.md | 423 | 2026-10-01 | Audit Welt (V1–V17) | B | V1, V3, V17 gebaut; V2, V4–V16 offen (nicht einzeln geprüft) | behalten als Quelle |
| docs/audit/TEIL_C_DARSTELLUNG.md | 429 | 2026-10-01 | Audit Darstellung (D1–D17) | B | D1, D3–D10, D15 gebaut (Regiebuch, UI-Umbau, vrnd); D2, D11–D14, D16, D17 offen (nicht einzeln geprüft) | behalten als Quelle |

### 1.5 docs/design/

| Pfad | Zeilen | Datum | Zweck | Status | Begründung | Empfehlung |
|---|---|---|---|---|---|---|
| docs/design/masterprompt-abgleich.md | 55 | 2026-09-28 | Abgleich mit Master-Prompt 2 (S14) | D | Stand S14; viele 🟡 inzwischen anders; Reste: organische Stadtanordnung, Rätsel/Fallen, Wildtiere, Musik, Touch, prozedurale Städte | Reste → Roadmap, archivieren |
| docs/design/mechanik-check.md | 82 | 2026-09-28 | Mechanik-Paare W/L/E + 4 Designfragen | B | Funde behoben (S14); Frage 1 (BUG-100) durch `keepSiegeDay` gelöst, Frage 3 durch HB-23; Fragen 2 und 4 unbeantwortet | Fragen → Teil 3, archivieren |
| docs/design/sprite-features.md | 81 | 2026-09-28 | Sprite-Inventur Stil D/R | C | Keine offene Checkbox | archivieren |

### 1.6 docs/ist/

| Pfad | Zeilen | Datum | Zweck | Status | Begründung | Empfehlung |
|---|---|---|---|---|---|---|
| docs/ist/A_welt_fraktionen.md | 952 | 2026-10-04 | Ist-Zustand Teil A | E | Original der Zusammenführung in IST_ZUSTAND.md; Nachtrag „Audit 04.10. Phase 1“ nur hier | eine Pflegerichtung wählen: Teile pflegen und neu zusammenführen **oder** Teile archivieren |
| docs/ist/B_auftraege.md | 648 | 2026-10-04 | Ist-Zustand Teil B | E | wie A (14 abweichende Zeilen) | wie A |
| docs/ist/C_kampf_gegner_charakter.md | 1137 | 2026-10-04 | Ist-Zustand Teil C | E | wie A (34 abweichende Zeilen, u. a. Boss-Intros 7 Karten, Phase 5.6 offen) | wie A |
| docs/ist/D_items_wirtschaft_menues.md | 1096 | 2026-10-04 | Ist-Zustand Teil D | E | wie A (28 abweichende Zeilen) | wie A |
| docs/ist/IST_ZUSTAND_alt_2026-10-02.md | 1266 | 2026-10-04 | Alter Ist-Zustand v19 | D | Selbst als veraltet markiert, nennt eigene Fehler | archivieren |

### 1.7 ROTFALL_STATE/

| Pfad | Zeilen | Datum | Zweck | Status | Begründung | Empfehlung |
|---|---|---|---|---|---|---|
| ROTFALL_STATE/BUGS.md | 86 | 2026-10-02 | RB-001…RB-060, SC-01…04, Hunt-Verweis | B | Statusspalte Stand 01.10. (meist TESTING; laut Control/COMPLETED_TASKS verifiziert); ohne Code-Marker: RB-010, RB-012, RB-028, RB-033, RB-059, RB-060, SC-01 (`buildVaronburgOld` game.js:10020 noch da), SC-03; SC-04 erledigt (`hasBigAt` genutzt) | behalten, bereinigen; Reste → Roadmap |
| ROTFALL_STATE/COMBAT_ANIM.md | 30 | 2026-10-02 | Entwickler-Auftrag Kampfanimation (§1–17) | B | Scheiben 1–3, Profile aller Nahkampfklassen, Gewicht je Klasse gebaut (bis 04.10.); §17-Rest offen (OFFEN.md) | behalten |
| ROTFALL_STATE/DECISIONS.md | 268 | 2026-10-03 | Alle Entscheidungen des Entwicklers | A | Maßgeblich, enthält DESIGN_/LEAD_DECISIONS vollständig | behalten |
| ROTFALL_STATE/GATE.md | 53 | 2026-10-02 | Feature Readiness Gate | A | Verbindlich | behalten |
| ROTFALL_STATE/HUNT.md | 28 | 2026-10-02 | Auftrag Bugjagd 1 | F | Hunt 1 und 2 abgeschlossen (BERICHT, BERICHT_2) | archivieren |
| ROTFALL_STATE/IDEAS.md | 196 | 2026-10-01 | Ideenspeicher Scout-Runden 1–9 (nichts freigegeben) | A | Viele gewählt und gebaut (R2 teils, R4–R7, R9); offen u. a. R8 „Erste Spielstunde“ 2–10 (Tutorial-relevant), R3 36–47 teils, Ideen 1–4, 13–20, 22–25, 27–35, 40–47 | behalten; Gebautes streichen |
| ROTFALL_STATE/OFFEN.md | 199 | 2026-10-03 | Aktuelle Liste offener Punkte des Leads | A | Aktuellste Liste, aber nicht bereinigt: Boss-Intros Varg/Hrodvar/Garmadon/Gorak/Dodon sind gebaut (BOSS_CARDS, data.js:1788), Zauberlehrer erledigt, BALANCE_GUIDE §7 passt, Schleichmodus/Jagd gebaut | behalten → in zentrale Roadmap aufgehen lassen |
| ROTFALL_STATE/ROADMAP.md | 21 | 2026-10-01 | Priorität 1–10 | B | 1, 3 (UI), 3a gebaut; 2 (T15), 3b (Königstod-Szene nicht geprüft), 3c, 4 (T11), 5 (T17 S3/4), 6 (T23), 7 (T12), 8 (S3b–d), 9 (T20), 10 (Verifier) offen | → Roadmap (aufgehen lassen) |
| ROTFALL_STATE/SPEC_SKILLS_GRIND_2026-10-08.md | 52 | 2026-10-08 | Spezifikation Progression/Skills/Grind | A | Neu; nichts davon gebaut | behalten |
| ROTFALL_STATE/SPEC_WELT_TUTORIAL_2026-10-08.md | 79 | 2026-10-08 | Spezifikation Welt/Tutorial/NPC/Content | A | Neu; P0.5 (§36 Wand-Hit, game.js:3776/7194, Probe 21212) und §35 (Haus-Transparenz, render.js:1023–1036) am 08.10. gebaut (Commit 074e676) | behalten |
| ROTFALL_STATE/STATE.md | 28 | 2026-10-02 | Kurzstand für den Lead | D | Stand 02.10. 16:40 (Selbsttest 395, main d7199bb); heute 483 Proben, origin/main 4c0ce86 (05.10.) | aktualisieren oder archivieren |
| ROTFALL_STATE/TEAM.md | 92 | 2026-10-01 | 6-Agenten-Team | A | Gültige Teamregel | behalten |
| ROTFALL_STATE/VISUAL.md | 39 | 2026-10-02 | Entwickler-Auftrag visueller Umbau (Prio 1–13) | B | Prio 1–9 gebaut (Dialoge … Karte); 10 Städte, 11 Welt-Events, 12 UI allgemein, 13 Animationen offen | behalten |

### 1.8 ROTFALL_STATE/hunt/

| Pfad | Zeilen | Datum | Zweck | Status | Begründung | Empfehlung |
|---|---|---|---|---|---|---|
| ROTFALL_STATE/hunt/BERICHT.md | 127 | 2026-10-02 | Hunt-1-Abschluss HB-01…47, Fit-Befunde, Quest-Review | B | Code-Marker für HB-01…23, 32, 33, 36, 38, 40, 41, 42; HB-10/20 entschieden 03.10.; HB-37 erledigt (ist/B); HB-26/39 vermutlich erledigt (`schutzOpen`, Entführt-Auftrag); HB-24, 25, 27–31, 34, 35, 43–47 ohne Marker; Fit-Befunde SHF/IHF unentschieden | Reste → Roadmap/Teil 3, dann archivieren |
| ROTFALL_STATE/hunt/BERICHT_2.md | 107 | 2026-10-03 | Hunt 2 HB2-01…14 | F | Laut IST_ZUSTAND-Kopf alle behoben | archivieren |
| ROTFALL_STATE/hunt/FORMATS.md | 41 | 2026-10-02 | Formate der Bugjagd | F | Auftrag abgeschlossen | archivieren |
| ROTFALL_STATE/hunt/interaction_hunter.md | 433 | 2026-10-02 | Rohbericht Interaction Hunter (Feature-Karte 31 Features) | F | In BERICHT.md zusammengeführt; Feature-Karte evtl. nützlich | archivieren |
| ROTFALL_STATE/hunt/quest_agent.md | 943 | 2026-10-02 | Quest-Review: 27 Questreihen, je Blatt Kernaufgabe/Emblem/Signaturszene | B | Analyse für Quest-Variation (Spec §10–12); Vorschläge nicht umgesetzt | behalten als Quelle für den Quest-Overhaul |
| ROTFALL_STATE/hunt/repro_liste_1.md | 77 | 2026-10-02 | Repro-Liste 1 | F | Abgearbeitet | archivieren |
| ROTFALL_STATE/hunt/repro_liste_2.md | 129 | 2026-10-02 | Repro-Liste 2 | F | Abgearbeitet | archivieren |
| ROTFALL_STATE/hunt/repro_liste_3.md | 73 | 2026-10-02 | Repro-Liste 3 | F | Abgearbeitet | archivieren |
| ROTFALL_STATE/hunt/reproducer_1.md | 34 | 2026-10-02 | Reproducer 1 | F | Abgearbeitet | archivieren |
| ROTFALL_STATE/hunt/reproducer_2.md | 41 | 2026-10-02 | Reproducer 2 | F | Abgearbeitet | archivieren |
| ROTFALL_STATE/hunt/reproducer_3.md | 71 | 2026-10-02 | Reproducer 3 | F | Abgearbeitet | archivieren |
| ROTFALL_STATE/hunt/sweeper.md | 48 | 2026-10-02 | Statische Prüfung (SW-01/02) | F | SW-01 (`.find(...).name` ohne `?.`, 6 Stellen) nicht geprüft | SW-01 → Roadmap, archivieren |
| ROTFALL_STATE/hunt/system_hunter.md | 244 | 2026-10-02 | Rohbericht System Hunter | F | In BERICHT.md zusammengeführt | archivieren |

### 1.9 ROTFALL_STATE/perf/

| Pfad | Zeilen | Datum | Zweck | Status | Begründung | Empfehlung |
|---|---|---|---|---|---|---|
| ROTFALL_STATE/perf/PLAN.md | 28 | 2026-10-02 | Perf-Ziel 3 ms, Ausgangswerte | B | PERF-R/S/U/U3 gebaut; 3-ms-Marke nicht belegt (OFFEN.md) | behalten |
| ROTFALL_STATE/perf/perf_r.md | 45 | 2026-10-02 | Ergebnis Zeichnen | F | Umgesetzt | archivieren |
| ROTFALL_STATE/perf/perf_s.md | 46 | 2026-10-02 | Ergebnis Hintergrund/UI/Spitzen | F | Umgesetzt | archivieren |
| ROTFALL_STATE/perf/perf_u.md | 46 | 2026-10-02 | Ergebnis Update/KI | F | Umgesetzt | archivieren |
| ROTFALL_STATE/perf/perf_u3.md | 74 | 2026-10-02 | Ausreißer-Jagd | F | Umgesetzt; Regel HS_ENT/HS_PAL steht in OFFEN.md | archivieren (Regel nach CLAUDE.md) |

### 1.10 ROTFALL_STATE/visual/

| Pfad | Zeilen | Datum | Zweck | Status | Begründung | Empfehlung |
|---|---|---|---|---|---|---|
| ROTFALL_STATE/visual/dialoge.md | 252 | 2026-10-02 | Analyse Dialoge (Prio 1) | C | Gebaut (MECHANIKEN „Dialoge: Story-Fenster, Emotes“); Mimik-Porträts „später“ | archivieren |
| ROTFALL_STATE/visual/gegner_ideen.md | 230 | 2026-10-02 | 19 Gegnerideen | A | Top 5 gebaut; 14 nicht gewählt (OFFEN [E]) | behalten → Teil 3 |
| ROTFALL_STATE/visual/gegner_neu.md | 125 | 2026-10-02 | Impact Report neue Gegner | F | Gebaut (Bomben-/Groß-Skelett, Mutanten, 6 Varianten) | archivieren |
| ROTFALL_STATE/visual/inventar.md | 259 | 2026-10-02 | Analyse Inventar (Prio 6) | C | Gebaut (Papierpuppe, Item-Karten); Rest [P] in OFFEN | archivieren |
| ROTFALL_STATE/visual/items.md | 270 | 2026-10-02 | Analyse Items/Beute (Prio 5) | C | Gebaut; I-6 (Hinweis seltene Beute) offen [E] | archivieren |
| ROTFALL_STATE/visual/kampf.md | 388 | 2026-10-02 | Analyse Kampf-Feedback (Prio 4) | C | Gebaut („Kampf-Feedback ohne Text“) | archivieren |
| ROTFALL_STATE/visual/kampfanimation.md | 245 | 2026-10-02 | Analyse Kampfanimation (Analyst E) | C | Entscheidungen 02.10. getroffen, Scheiben gebaut | archivieren |
| ROTFALL_STATE/visual/kampfanimation_s1.md | 198 | 2026-10-02 | Zwischenstand Scheibe 1 | F | Überholt durch 04.10. | archivieren |
| ROTFALL_STATE/visual/karte.md | 78 | 2026-10-02 | Analyse Karte (Prio 9) | C | Gebaut (Ortsbild, Pins, Grenzen) | archivieren |
| ROTFALL_STATE/visual/npcs.md | 376 | 2026-10-02 | Analyse NPC-Interaktionen (Prio 3) | B | N2, N6–N9 gebaut; N1 Blasen vereinheitlichen, N4 Stimmungs-Idle, Symbolsatz offen | Reste → Roadmap |
| ROTFALL_STATE/visual/quests.md | 331 | 2026-10-02 | Analyse Quests (Prio 2) | C | Q-1…Q-4 gebaut; Q-OE3/Q-OE8 offen [E] | Reste → Teil 3, archivieren |
| ROTFALL_STATE/visual/ruestungen.md | 252 | 2026-10-02 | Analyse Rüstungsvielfalt R1–R7 | A | Keine Code-Marker; nichts gebaut (nicht im Detail geprüft) | behalten → Roadmap (Gegner/Content) |
| ROTFALL_STATE/visual/shops.md | 258 | 2026-10-02 | Analyse Shops (Prio 7) | C | Gebaut (Handels-Dock); [P]-Reste in OFFEN | archivieren |
| ROTFALL_STATE/visual/skilltree.md | 83 | 2026-10-02 | Analyse Skilltree (Prio 8) | C | Gebaut (Linien, Icons, Vorschaukarte; Sternbild-Umbau) | archivieren |
| ROTFALL_STATE/visual/staedte.md | 85 | 2026-10-02 | Analyse Städte (Prio 10) | B | Steckbrief mit Gesicht gebaut (01.10.); gezeichnetes Brett mit Zetteln, Gebäudesymbolik, Banner-Wechsel, Patrouillenrouten, Kinder/Tiere offen; 5 Designfragen | behalten → Roadmap/Teil 3 |
| ROTFALL_STATE/visual/ui_menues.md | 88 | 2026-10-03 | Plan/Bericht UI-Scheiben 3–5 | C | Gebaut; GUI-Reihenfolge Tierhändler ✓, Werkbank ✓, Kontor offen | Rest → Roadmap, archivieren |
| ROTFALL_STATE/visual/vollstaendigkeit.md | 106 | 2026-10-03 | Vollständigkeitsprüfung Systeme/Dialoglisten | B | Zauberlehrer, Seevolk-Ränge, Schleich/Jagd, Talentpunkte erledigt; Boss-Intros teils (7 Karten); Dialoglisten, Fall Aurelions, Bossgespräche, Koop-Dock offen | Reste → Roadmap |
| ROTFALL_STATE/visual/welt.md | 77 | 2026-10-02 | Analyse Welt-Ereignisse (Prio 11) | A | Entscheidung 02.10. (Namenskarte + Ton) getroffen, nicht gebaut: `bigAnnounce` (game.js:11755) nur log/chronicle/toast; 4 Designfragen | behalten → Roadmap/Teil 3 |

### 1.11 ROTFALL_STATE/PROPOSALS/

| Pfad | Zeilen | Datum | Zweck | Status | Begründung | Empfehlung |
|---|---|---|---|---|---|---|
| …/bedrohung_gesamt.md | 344 | 2026-10-01 | Bedrohung Varonheims: Deckel, Messung | C | Werte APPROVED und gebaut (MECHANIKEN „Bedrohung neu eingestellt“); RB-059 Nachmessung offen | archivieren (RB-059 → Roadmap) |
| …/blutkult.md | 470 | 2026-10-01 | Design Blutkult §5g.2 | C | Scheiben 1–5 gebaut; 6 Fragen beantwortet (DECISIONS 01.10.) | archivieren |
| …/emergente_quests.md | 263 | 2026-10-01 | Emergente Quests E1–E4 | C | Alle vier gebaut (MECHANIKEN) | archivieren |
| …/feature_audit_ausbau.md | 86 | 2026-10-01 | Ausbauideen alter Systeme (Bausystem u. a.) | A | IDEA laut ROADMAP #3; Baukarten/Baumodus teils gebaut (UI-Scheibe 2/3); Rest ohne Freigabe | behalten → Teil 3 |
| …/fraktions_starts.md | 80 | 2026-10-03 | Impact Report Fraktions-Starts/Rassen | B | Gebaut (Scheiben a–d, 479 Proben); 10 Entscheidungspunkte vorläufig | behalten → Teil 3 |
| …/geheime_orte.md | 251 | 2026-10-01 | 8 geheime Orte, lebendige Umgebung | B | 5 gebaut (Glockenmoor, Verlorene Hundert, Ausbrecherstollen, Brunnen, Kammer der Namen); Uhrmacher, Leuchtfeuer, Walknocheninsel offen; Fragen beantwortet 02.10. | Reste → Roadmap |
| …/klassen_talente.md | 448 | 2026-10-03 | Klassenprüfung + Sternbild-Talente | C | Scheiben 0–10 und Gefährtenbaum gebaut; §5-Fragen beantwortet; Zahlen vorläufig | archivieren (Zahlen → Teil 3) |
| …/luftbruecke_verwundete.md | 224 | 2026-10-01 | Luftbrücke für Belagerte, Verwundete aus Feldschlachten | A | APPROVED (ROADMAP 3c); nicht gebaut (`luftbrücke/airlift` 0 Treffer); 4 Fragen offen | behalten → Roadmap/Teil 3 |
| …/npc_eigene_ziele.md | 270 | 2026-10-01 | NPCs mit eigenen Zielen (Scout #36–39) | A | APPROVED; nicht gebaut (nur `emigrate()` für Hunger/Angst); 4 Fragen offen | behalten → Roadmap/Teil 3 |
| …/siedlung_ausbau.md | 373 | 2026-10-01 | Siedlung als System M1–M4 | C | Gebaut (MECHANIKEN „Siedlung M1–M4“) | archivieren |
| …/stadt_ohne_wachen.md | 292 | 2026-10-01 | Stadt ohne Schutz, Entwurf | C | Scheiben 1, 2a, 2b gebaut | archivieren |
| …/stadt_ohne_wachen_s2.md | 364 | 2026-10-01 | Stadt ohne Schutz Scheibe 2 | C | Gebaut | archivieren |
| …/t08_gefangene_steckbriefe_ruf.md | 210 | 2026-10-01 | T08 | C | Gebaut | archivieren |
| …/t09_laeden_stadtlager.md | 215 | 2026-10-01 | T09 | C | Gebaut | archivieren |
| …/t10_ahnenfeind_heldentod.md | 239 | 2026-10-01 | T10 | C | Gebaut | archivieren |
| …/t11_a14_hunger_muedigkeit.md | 268 | 2026-10-01 | T11 Hunger/Müdigkeit/Wetter Menschenland | A | APPROVED (ROADMAP 4); nicht gebaut (`DIFF.survival` 0 Treffer, `Gewitter/Schlamm` nur 2 Treffer) | behalten → Roadmap |
| …/t12_strassen_herren.md | 254 | 2026-10-01 | T12 Straßen haben Herren | A | APPROVED (ROADMAP 7); nicht gebaut (`roadLord/Straßenherr` 0) | behalten → Roadmap |
| …/t17_regiebuch.md | 372 | 2026-10-01 | T17 Regiebuch, Boss-Intros, Szenen | B | Scheiben 1–2 gebaut (`cinematic`, `bossIntro`, 7 Karten); Scheiben 3–4 offen (ROADMAP 5) | behalten → Roadmap |
| …/t23_fraktionsressourcen.md | 301 | 2026-10-01 | T23 Fraktionsressourcen | A | DESIGN_LOCKED (ROADMAP 6); nicht gebaut (`resources/corpses` 0; sim.js nur Valen-Korn) | behalten → Roadmap |
| …/ui_redesign.md | 123 | 2026-10-01 | Menü-/HUD-Umbau | C | Scheiben 1–5 gebaut | archivieren |
| …/varonheim_belagerung.md | 370 | 2026-10-01 | Belagerung Scheiben 1–2 | C | Gebaut | archivieren |
| …/varonheim_belagerung_s3.md | 298 | 2026-10-01 | Belagerung Scheibe 3 | B | S3a gebaut; S3b–d offen; Fragen Kellerweg und Varons Strenge unbeantwortet (Frage 3 Burgfrieden beantwortet) | behalten → Roadmap/Teil 3 |
| …/varonheim_umbau.md | 399 | 2026-10-01 | Varonheim auf dem Kronfels | C | Scheiben 1–5 gebaut | archivieren |
| …/weltereignisse_abgleich.md | 129 | 2026-10-01 | Abgleich Weltereignisse W-01…W-27 | C | Entschieden (01.10.), RB-043…054 IMPLEMENTED | archivieren |

### 1.12 ROTFALL_AGENT_STATE/ (Archiv seit 01.10., eigene Aussage in AGENT_SYSTEM.md)

| Pfad | Zeilen | Datum | Zweck | Status | Begründung | Empfehlung |
|---|---|---|---|---|---|---|
| ROTFALL_AGENT_STATE/AGENT_SYSTEM.md | 92 | 2026-10-01 | 12-Rollen-System | F | Abgelöst durch TEAM.md | archivieren |
| ROTFALL_AGENT_STATE/APPROVED_FEATURES.md | 7 | 2026-10-01 | Freigaben (Zeiger) | F | Inhalt in DECISIONS/PLAN_ROADMAP | löschen |
| ROTFALL_AGENT_STATE/ARCHITECTURE_NOTES.md | 5 | 2026-10-01 | Zeilenenden (game.js CRLF), RFZ1-Format | A | Einzige Stelle mit diesen zwei Technik-Hinweisen | in CLAUDE.md übernehmen, dann löschen |
| ROTFALL_AGENT_STATE/BLOCKED_TASKS.md | 3 | 2026-10-01 | leer | F | — | löschen |
| ROTFALL_AGENT_STATE/BUG_DATABASE.md | 42 | 2026-10-01 | RB-001…037 | E | Teilmenge von ROTFALL_STATE/BUGS.md | löschen |
| ROTFALL_AGENT_STATE/COMPLETED_TASKS.md | 11 | 2026-10-01 | VERIFIED-Liste 01.10. | F | Historisch | archivieren |
| ROTFALL_AGENT_STATE/CURRENT_TASKS.md | 35 | 2026-10-01 | Aufgabentafel 01.10. | F | Veraltet | archivieren |
| ROTFALL_AGENT_STATE/DESIGN_DECISIONS.md | 50 | 2026-10-01 | Nutzerentscheidungen | E | Vollständig in ROTFALL_STATE/DECISIONS.md (diff: nur Kopfzeile) | löschen |
| ROTFALL_AGENT_STATE/FEATURE_PROPOSALS.md | 15 | 2026-10-01 | Vorschlagsliste (Zeiger) | F | Status veraltet | löschen |
| ROTFALL_AGENT_STATE/GAME_DESIGN.md | 5 | 2026-10-01 | Zeiger | F | — | löschen |
| ROTFALL_AGENT_STATE/LEAD_DECISIONS.md | 10 | 2026-10-01 | Leitungsentscheidungen | E | Vollständig in DECISIONS.md | löschen |
| ROTFALL_AGENT_STATE/MASTER_ROADMAP.md | 6 | 2026-10-01 | Zeiger | F | Welle-2-Hinweis steht in MASTER_REPORT §19 | löschen |
| ROTFALL_AGENT_STATE/MASTER_STATE.md | 19 | 2026-10-01 | Kurzstand 01.10. | F | Veraltet | archivieren |
| ROTFALL_AGENT_STATE/OPEN_QUESTIONS.md | 9 | 2026-10-01 | 4 UI-Fragen | C | Beantwortet (DECISIONS 01.10. „UI-Umbau“) | löschen |
| ROTFALL_AGENT_STATE/REGRESSION_LOG.md | 8 | 2026-10-01 | 4 Läufe 01.10. | F | Historisch | archivieren |
| ROTFALL_AGENT_STATE/REJECTED_FEATURES.md | 4 | 2026-10-01 | 2 Streichungen | E | In DECISIONS (Stil F, kein Spieler-Thron) | löschen |
| ROTFALL_AGENT_STATE/SYSTEM_DEPENDENCIES.md | 7 | 2026-10-01 | 4 Technik-Zeilen (rnd/vrnd, Speichern, ensure*) | F | Inhalt in CLAUDE.md/MASTER_REPORT §5 | löschen (rnd/vrnd-Regel in CLAUDE.md prüfen) |
| ROTFALL_AGENT_STATE/TOKEN_EFFICIENCY_REPORT.md | 16 | 2026-10-01 | Token-Beobachtungen | F | Historisch | archivieren |
| ROTFALL_AGENT_STATE/AGENT_STATUS/*.md (12 Dateien, 3–11 Zeilen) | 52 | 2026-10-01 | Statuszeilen je Rolle (ai_specialist, bug_hunter, combat_specialist, control, director, feature_designer, implementation, lead, presentation_specialist, systems_designer, token_optimizer, world_specialist) | F | Rollen abgelöst; Inhalte in HANDOFFS/BERICHTEN | archivieren |
| ROTFALL_AGENT_STATE/HANDOFFS/bug_to_implementation.md | 362 | 2026-10-01 | Hunter-Berichte 1–6 (RB-013…037) | F | Bugs behoben/entschieden; Volltext-Quelle für BUGS.md | archivieren |
| ROTFALL_AGENT_STATE/HANDOFFS/control_to_director.md | 192 | 2026-10-01 | Control-Urteil 01.10. (VERIFIED/NEEDS FIX) | F | Abgearbeitet | archivieren |
| ROTFALL_AGENT_STATE/HANDOFFS/director_to_lead.md | 99 | 2026-10-01 | Director-Direktive (Zyklen A/B) | F | Zyklus A gebaut; B-Reste (T12, T11, T17-Regie) in ROADMAP | archivieren |
| ROTFALL_AGENT_STATE/HANDOFFS/feature_to_lead.md | 82 | 2026-10-01 | Übergabe Blutkult | F | Gebaut | archivieren |
| ROTFALL_AGENT_STATE/HANDOFFS/{bug_to_systems, feature_to_implementation, implementation_to_bug, lead_to_feature, specialist_to_lead, systems_to_feature}.md (6 × 3 Zeilen) | 18 | 2026-10-01 | Leere Formatvorlagen | F | leer | löschen |
| ROTFALL_AGENT_STATE/proposals/{blutkult, feature_audit_ausbau, t08…, t09…, t10…, t17_regiebuch, t23_fraktionsressourcen, ui_redesign, varonheim_belagerung}.md (9 Dateien) | 2096 | 2026-10-01 | Kopien | E | Byte-identisch mit ROTFALL_STATE/PROPOSALS/* (`diff -q`) | löschen |

---

## 2 Offene Punkte je Thema

Spalte „Stand“: **umgesetzt** · **teilweise** · **offen** · **nicht geprüft**. Belege = `grep`-Treffer in `src/` (Stand 074e676). Derselbe Punkt steht nur einmal, mit allen Quellen.

### 2.1 Tutorial

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| T1 | Spielbares Tutorial (Welt, Bewegung, Interaktion, Kampf, Loot, NPCs, Händler, Quests, Gebäude), kontextbezogen statt Infowand | SPEC_WELT §6–9, P0.1 | **offen** — `grep -ci tutorial src/*.js` = 0; vorhanden als Bausteine: Ratgeber `guideTick` (game.js:8765, „Hinweise führen hin“, DECISIONS 02.10.), Herkünfte, Start in Varonheim, Fraktions-Starts, Szenen-Engine `cinematic`/`nameCard` (T17) |
| T2 | Einflug nach ROTFALL (Szene aus der Distanz: Landschaft, Straßen, Stadt, Reisende, Karawanen) | SPEC_WELT §7, P0.2 | **offen** — `introScene/startScene/Einflug` 0 Treffer; `newGame()` startet ohne Szene |
| T3 | Erste Wege/Ziele als Denkansätze (Stadt in der Ferne, Schmiede, Straße mit Reisenden, Markt, Taverne, Ruine) statt Questliste | SPEC_WELT §8, P0.3; IDEAS R8.7 (Kompass ohne Ziel), R8.6 (erster Kontakt ist ein Brett) | **offen** — Kompass folgt nur Aufträgen (`questPoint`); Scout-R8-Punkt 1 (reaktive Hinweise) gebaut, 2–10 offen |
| T4 | Erste Spielstunde: Kodex unerwähnt, Startskillpunkt unerklärt, Steuerung nirgends, Herkunft ohne Handlung, Minikarte-Start, Gefahrenpuffer um Spawn, Charaktererstellung erklärt Attribute nicht | IDEAS Scout-Runde 8 (2–5, 8–10) | **nicht geprüft** (keine Code-Marker; README nennt die Steuerung nur extern) |
| T5 | Kurzer Einstieg in Eren (§5g.38, T13) | PLAN_ROADMAP §5g.38; TASKS T13 | **offen** |
| T6 | Tutorial-Testfälle (Start, Intro, abschließbar, kein Softlock, Speichern/Laden, nicht mehrfach) | SPEC_WELT §51 | **offen** |

### 2.2 Quests/UI

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| Q1 | Quest-GUI als richtiges Fenster: Name, Geber, Beschreibung, Ziel, Fortschritt, Lohn, Ort, Status, optionale/erledigte Ziele als Häkchen; nur zeigen, was die Figur wissen kann | SPEC_WELT §38–39, P0.4; OFFEN [E] 7 (Kartenausschnitt im Auftragsbrief) | **teilweise** — `questUI` (ui.js:1968) als Pergament-Lesefenster (UI-Scheibe 5), Tracker Q-4, Auftragsbrief Q-3, Siegel Q-2 (MECHANIKEN „Aufträge sichtbar 1–4“); Häkchenliste optionaler Ziele und Kartenausschnitt nicht geprüft/offen |
| Q2 | Quest-Zieltypen jenseits „gehe → töte → zurück“: Erkundung, Transport, Soziales, Wirtschaft, Weltgeschehen, Geheimnisse; eigene Kernaufgabe/Signaturszene/Emblem je Questreihe | SPEC_WELT §10–11, P3.25–26; hunt/BERICHT Quest-Review; hunt/quest_agent.md (27 Blätter) | **teilweise** — Auftragsarten `trail`, `camps`, `caravanSurvivors`, `ignoredContract`, E1–E4 gebaut; feste Questreihen weiterhin überwiegend „töte N / bring N“, gleicher Marker (Befund 02.10.) |
| Q3 | Quests derselben Region nicht immer dieselben Gegner (Rollenmix Späher/Schütze/Plünderer/Anführer …) | SPEC_WELT §12 | **offen** (Auftragsgegner-Pools nicht geprüft; siehe G1) |
| Q4 | Krieg erzeugt eigene Aufträge (Schmuggel in belagerte Stadt); Questkette bis Handelskontakt | WELT_EVENTS_S13 §3 | **nicht geprüft** |
| Q5 | Toter benannter Auftraggeber: feste Quest bleibt für immer offen (Brett-Aufträge behandeln den Fall) | hunt/BERICHT Sammelbefund | **nicht geprüft** |
| Q6 | Fenster statt Gesprächsliste: Kontor, Schwarzmarkt, Hafen/Frachtschiff, Luftschiff, Investieren, Anschlagbrett, Rat, Passamt, Kerker, Schuldknechtschaft (Reihenfolge laut UI-Agent: Kontor als Nächstes) | OFFEN [B]; visual/vollstaendigkeit; visual/ui_menues | **teilweise** — Fenster seit 03./04.10.: Zauber lernen (`learnUI`), Heiler (`healerUI`), Prothesen-Werkbank (`mechUI`), Tierhändler, Schmied, Reise-Dock, Handwerk, Betriebe; Rest offen |
| Q7 | Bossgespräche (Weißbart, Garmadon) als Story-Fenster mit Gesten statt reiner Text | visual/vollstaendigkeit | **offen** |
| Q8 | Bewohner rufen den Helden (Q-OE8), Szene bei Story-Abschlüssen (Q-OE3), Hinweis auf seltene Beute (I-6) | OFFEN [E] 6; visual/quests, visual/items | **offen** (Entscheidung fehlt) |
| Q9 | Große Weltereignisse mit Namenskarte + Signalton, Pause nur bei Kriegsereignissen (entschieden 02.10.) | visual/welt.md; VISUAL Prio 11; DECISIONS 02.10. | **offen** — `bigAnnounce` (game.js:11755) macht nur log/chronicle/toast |
| Q10 | Komfort-UI §5g.37: eigene Kartenmarkierungen, Inventar sortieren/Ramsch, Chronik-Filter, UI-Klänge (Kartenlegende vorhanden) | PLAN_ROADMAP §5g.37; TASKS T13 | **teilweise/nicht geprüft** (`ramsch/sortier` 14 Treffer, nicht zugeordnet) |
| Q11 | Ziehen auf die Schnellleiste geht nicht (Fenster verdeckt sie); bei 1280 px nur schmaler Weltstreifen neben dem Handels-Dock | OFFEN [P] | **offen** |
| Q12 | Skilltree Scheibe 3 (Freischalt-Animation) und 4 (Titelzweig-Siegel) — durch Sternbild-Umbau vermutlich überholt | OFFEN [E] | **offen** (Entscheidung) |
| Q13 | Gezeichnetes Anschlagbrett mit Zetteln/Steckbriefen statt Textdialog; Gebäudesymbolik; Fraktionsbanner mit Besitzwechsel; Patrouillenrouten | visual/staedte.md (Varianten 1+2, 7+8, 4) | **teilweise** — Steckbrief mit Gesicht (01.10.) und `board`-Prop (world.js:387) vorhanden; `boardMenu` bleibt Textdialog; Banner nur Props (`banner_pole`, `banner_torn`) |
| Q14 | Alltags-Szenenkarten, Baukarten mit Grundriss-Geist (Ausbau alter Features) | IDEAS 11/12; PROPOSALS/feature_audit_ausbau; ROADMAP #3 (IDEA) | **teilweise** — Baumodus visuell (UI-Scheibe 2), Rezeptkarten (Scheibe 3); Rest ohne Freigabe |

### 2.3 NPC/Gebäude

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| N1 | Tür zur Zugangsrichtung; je betretbarem Gebäude Eingang, Richtung, Innen/Außen, Zugangspunkt, Exit; NPCs nutzen den echten Eingang | SPEC_WELT §33–34, P0.6 | **teilweise** — `doorSide` (world.js:142–180) und `b.door` (buildings.js:191/249, Seiteneingang) existieren; Prüfung aller Häuser auf Zugangsrichtung und NPC-Wegführung über die Tür nicht geprüft |
| N2 | Haus 40–60 % transparent, wenn der Held seitlich/dahinter steht | SPEC_WELT §35 | **umgesetzt 08.10.** — render.js:1023–1036 (`playerBehind`, Ziel 0,5; Commit 074e676) |
| N3 | Gebäude zeigen ihr Inneres: Schmiede mit Ofen, Feuer, Amboss, Werkbank, Werkzeug, Waffen/Rüstungen, Rohmaterial, Lager; Schmied arbeitet (Hammer, Funken, Rauch); Prinzip auf Bäckerei, Taverne, Schneiderei, Apotheke, Werkstatt, Stall, Händler, Bionik | SPEC_WELT §26–27, P2.14–15, P2.18; MASTER_ROADMAP B.6 | **teilweise** — Props `forge`/`hearth`/`chimney` animiert (render.js PROP_PERIOD), `anvil/amboss` 39 Treffer, Arbeitsplätze `act:'work'` mit Werkzeugziel (game.js:1116–1141), Esse/Werkbank/Kessel (§5d.8); Hammer-Animation mit Funken und vollständige Innenausstattung je Betriebsart nicht geprüft/offen |
| N4 | Nicht jeder NPC hat eine Quest; Rollenverteilung je Stadt (Beispiel 3 Geber/5 Händler/4 Familie/3 Wachen/2 Reisende/2 Bürger/1 Story); Questgeber über Dialog, Gerücht, Verhalten, NPC-zu-NPC-Gespräch erkennbar | SPEC_WELT §40–46, P1.7–8 | **teilweise** — weniger Gesprächspartner (01.10.), Siegel nur bei festen Gebern/Brett (DECISIONS 02.10.), Gerüchte mit Zielen (§5e.4), Ambient-Szenen (S13b); NPC-zu-NPC-Gespräch als Quest-Hinweis nicht gefunden |
| N5 | NPC-Visuals Rest: N1 Sprechblasen vereinheitlichen, N4 Stimmungs-Idle; Symbolsatz-Entscheidung | OFFEN [B] 03.10.; visual/npcs | **offen** |
| N6 | Begehbare Zelte mit Innenraum (Lager, Banden, Pilger, Garnison) | PLAN_ROADMAP §5g.4; TASKS T21 | **offen** — Zelte nur solide Props `tent_prop` (world.js:1407, 1660, 1809) |
| N7 | Stumme Figuren (Automaten, Kettenwachen reden), Flüchtlinge mit Heimat | PLAN_ROADMAP §5g.18; TASKS T38; docs/BUGS U-02 (70 Figuren nur „Gehen“) | **nicht geprüft** |
| N8 | NPCs mit eigenen Zielen: Händler wechselt Route nach Überfall, Wachhauptmann desertiert, Bewohner wandert für Arbeit ab, Kriegsmüdigkeit → Deserteurbanden | PROPOSALS/npc_eigene_ziele (APPROVED); IDEAS R3 36–39; ROADMAP – | **offen** — nur `emigrate()` (game.js:1609) für Hunger/Angst/Schutz; Route-Wechsel/Hauptmann/Müdigkeit 0 Treffer |
| N9 | Orte beleben (Szenen an Schrein/Hain/Lager/Ruinen, Tributdörfer, besetzte Städte mit anderen Bannern und Wachen); Fraktionsarchitektur (Varonheim teilt `TOWN_STYLE` mit der Kettenfeste) | PLAN_ROADMAP §5g.35; TASKS T33; MASTER_REPORT D13 | **nicht geprüft** |
| N10 | Akademie-Innenleben: Studenten-Tagesablauf, Bücher aus Nekropole/Akademie für Ilvar, Anklage „verbotene Magie“ im Gericht; Kodex „Fraktionen“ | PLAN_S15 P5/P6/P7 Reste; PLAN_ROADMAP §5g.15; MASTER_ROADMAP C.21 | **teilweise** — Student-System §5e.8 (`student` 31 Treffer); Bücher/Anklage nicht gefunden |
| N11 | Neue Lehrer Druidin, Moorhexe (Omega-Priester gebaut) | PLAN_ROADMAP §5g.11; TASKS T32; MASTER_ROADMAP C.21 | **teilweise** — Irmgard lehrt Glaubensmagie (game.js:10420); `Moorhexe` 0 Treffer; „Druidin“ 54 Treffer, als Zauberlehrerin nicht geprüft |
| N12 | Himmelsinsel: Ratsmitglieder verkaufen; Mord dort → Luftschiffe mit Adelsheeren landen; Aurelheims Prachtbauten nutzbar (Bibliothek, Badehaus, Hospital, Observatorium) | PLAN_ROADMAP §5g.9, §5g.36; TASKS T29 | **offen** — `ratShop/skyShop` 0; Badehaus/Observatorium nur als Props (5 Treffer) |
| N13 | Gefährten-Szenen untereinander (Streit, Freundschaft, Eifersucht) | PLAN_ROADMAP §5g.30; TASKS T38 | **offen** (`banter` 0) |
| N14 | Kinder und Tiere als generische Stadtbevölkerung | visual/staedte Varianten 5/6 | **offen** (eigener Impact Report nötig) |
| N15 | Hausgeräusche/Klang je Gebäude, gedämpft innen | PHASE_STATUS 18; masterprompt-abgleich 46 | **offen** |

### 2.4 Stadt/Familie

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| S1 | Echte Familien: verbundene NPCs, gemeinsam im Haus, essen, Kinder folgen Eltern, reagieren auf Gefahr, sprechen miteinander; Kette NPC-Daten → Familie → Wohnraum → Gebäude → Tagesablauf | SPEC_WELT §21–25, P1.9–10 | **offen** — `spawnResidents()` (game.js:1008) verteilt Bewohner nach `residentPlan`/Beruf; `household/surname/lastName` 0 Treffer; Soldatenfamilien der Eisenfeste nur als Berufe. Familie des **Helden** (Ehe, Kinder, `familyDay`, Dynastie §5e.2) vorhanden |
| S2 | Wohnkapazität je Hausgröße (klein 1–2, mittel 2–4, groß 4–8, Familienhaus) und Häuser spiegeln Familien (Betten, Kinderbett, Tisch, Spielzeug) | SPEC_WELT §22, §24, P1.11 | **offen** (Bettenzahl je Haus als Kapazität nicht geprüft; Möbel mit Funktion seit S13 vorhanden) |
| S3 | Marktplätze skalieren (mehrere Plätze: Hauptmarkt, Handwerk, Lebensmittel, Hafen, Nachbarschaft), Tageszeit-Verteilung, Bewegungsströme Haus→Arbeit→Markt→Taverne; keine 100 NPCs auf einem Punkt | SPEC_WELT §17–19, P1.12–13; docs/BUGS A-02 | **teilweise/nicht geprüft** — Tagesabläufe je Beruf, Marktstände 7–18 Uhr, Varonheim Faktor 3 mit Vierteln (world.js:1358); Dichte-Messung und mehrere Marktplätze je Stadt offen |
| S4 | Stadtplanung funktional prüfen (Größe/NPC, Straßenbreite, Platzgröße, Türen, Laufwege, Viertel); organische Anordnung | SPEC_WELT §47; mechanik-check Frage 2; PHASE_STATUS 13 | **offen** |
| S5 | Varonheim lebende Hauptstadt, Rest aus Scout R5: Hinrichtung am Galgen (T17 S3/4), Adelshäuser als Auftraggeber, Vermisstenliste sichtbar, Königliche Erlasse, Waffenkammer-Warteschlange, Garnison mustert, Marktgalgen als Drohkulisse | IDEAS R5; ROADMAP 5 | **teilweise** — Turnier, Gildenstreik, Flüchtlinge ins Armenviertel (game.js:2309), Markt reagiert gebaut |
| S6 | Siedlung als Stadt: Stufen Lager→Weiler→Dorf→Marktflecken→Stadt, Zuzug nach Attraktivität, Fraktionsreaktionen; Lehen für Ritter Varons | PLAN_ROADMAP §5g.19, §5g.33; TASKS T34; PLAN_S15 P14 Rest | **teilweise** — Wohnzonen, Moral M1–M4, Heilerhütte, Betriebe-Kasse, Gold-Sog, Siedlung geht ans Haus gebaut; Stufen/Fraktionsreaktion/Lehen offen (`lehen` 1 Treffer) |
| S7 | Siedlung als Marktknoten; Landrecht (Tribut oder Schutz bei Siedlung in besetztem Gebiet); Siedlungsvorrat als Karawanenziel | IDEAS 2, 3, R6.8; hunt/BERICHT IHF-02 („Siedlung ist Insel“) | **offen** (IDEA, nicht freigegeben) |
| S8 | 12–20 kleine Weiler je Welt, Städte unterschiedlich groß | PLAN_OFFEN D | **nicht geprüft** |
| S9 | Prozedurale Städte (§77) | masterprompt-abgleich | **offen** („bewusst später“) |
| S10 | Flüchtlinge mit echten Aufenthaltsorten, Familien, Herkunft, Integration | MASTER_ROADMAP C.27 | **teilweise** (Zeltlager, Neubürger, Armenviertel vorhanden; Familien/Herkunft offen) |

### 2.5 Betriebe

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| B1 | Betriebe als soziale Räume: Kunde betritt → Verkaufsbereich → Mitarbeiter reagiert → kauft → Ware weg → verlässt; Mitarbeiter arbeiten sichtbar weiter | SPEC_WELT §28–29, P2.16–17 | **teilweise** — `marketBuy` (game.js:1441, Bewohner kaufen am Marktstand), Arbeiter mit Phasen fetch/work (game.js:1203); Kundenlauf **in** Ladengebäude und Ware-weg-Effekt nicht gefunden |
| B2 | Spieler arbeitet selbst im eigenen Betrieb (Schmiede, Werkstatt, Taverne, Händler, Farm, Bäckerei, Alchemie, Bionik): produzieren, Kunden bedienen, Aufträge, Mitarbeiter beobachten, Produktion steuern | SPEC_WELT §30–32, P2.19; SPEC_SKILLS §26–30 | **teilweise** — Handwerk mit Qualität an Esse/Werkbank/Kessel (§5d.8), Siedlungsschmiede mit Esse (03.10.), Reiter „Betriebe“ mit Kasse/Ertrag (02.10.); Kunden bedienen, Aufträge annehmen, Mitarbeiter sichtbar in Spielerbetrieben offen |
| B3 | Abholen der Kasse direkt am Haus braucht Zuordnung Betrieb → Haus; Verlusttage „erst Kasse, dann Gold“ bestätigen | OFFEN [E] 03.10. (UI 3/4) | **offen** (Entscheidung) |
| B4 | Siedlungsschmiede verspricht „Waffen aus Eisen“, kann nur ausbessern | OFFEN [B] | **nicht geprüft** (Esse im Handwerks-Fenster seit 03.10. gebaut — Text evtl. erledigt) |
| B5 | Betriebe in besetzten Städten stehen ohne Meldung still (SHF-06); Zollgesetz senkt Überfallrisiko nie (RB-010) | hunt/BERICHT; ROTFALL_STATE/BUGS | **offen/nicht geprüft** |
| B6 | Startlager Tag 1 unter Zielwert (Eren Leder 0, Korn 63 %) | BUGS RB-055/058 | **teilweise** — RB-042-Fix (economy.js:105/112), Nachmessung offen |
| B7 | Produktionsketten für den Spieler (Holz→Bretter, Erz→Metall→Waffen, Getreide→Mehl→Brot, Tier→Leder) mit Siedlungsbau verbunden | MASTER_ROADMAP C.13; SPEC_SKILLS §31–37 | **offen** (Rezepte vorhanden, Ketten über Betriebe nicht geprüft) |
| B8 | Werkstücke mit Namen (`o.maker` gesetzt, nie gelesen) | IDEAS 4 | **offen** (IDEA) |

### 2.6 Gegner/Content

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| G1 | Banditen-Varianten als Rollen (Späher, Bogenschütze, Plünderer, Schläger, Söldner, Anführer, Fallensteller, Reiter, schwerer Bandit, Dolchkämpfer) und Goblin-Varianten (Krieger, Speerträger, Bogenschütze, Schamane, Plünderer, Berserker, Späher, Anführer, Techniker, Fallensteller, Sklave, Arbeiter) — sichtbar anders in Sprite/Rüstung/Waffe/Silhouette/Verhalten | SPEC_WELT §13–15, P3.20–24; PLAN_ROADMAP §5b (Dauerauftrag), §5f | **teilweise** — `MONSTERS` (data.js:527–658): bandit 4 (bandit, bandit_archer, bandit_spear, bounty_hunter), goblin 2 + Bosse Dodon/Gorak; `ENEMY_VARIANTS` veteran/starved/frenzied/armored/leader (game.js:1962, Werte); seeded Look-Varianten 02.10. (6 je Art für 8 Arten). Rollen Fallensteller, Reiter, Heiler, Schamane, Techniker, Sklave/Arbeiter fehlen |
| G2 | Gegner-Scaling-Audit (früh/mittel/spät, Dungeons, Bosse, Begegnungen, Questgegner, Elites, Tiere, Soldaten: HP, Schaden, Rüstung, Tempo, Rate, Fähigkeiten, Anzahl, Loot, XP) — Gefahr ohne Zahleninflation | SPEC_WELT §16, P4.27; PLAN_ROADMAP §5g.20; TASKS T24 („Rollenmix statt LP“) | **offen** (`SCALING` 6 Treffer, Kopfgeldjäger-Skalierung nicht geprüft) |
| G3 | 14 nicht gewählte Gegnerideen (Brandwärter, Kettenhenker, Fallenleger, Pferdedieb-Reiter, Fabrikarbeiter-Golem, Knochenschmied, Grabräuber-Geist, Verräterischer Stadtwächter, Plünderer der Belagerung, Sonnenflüchtling-Kultist, Gezeitenaal, Windklinge, Nachtglas-Schatten, Ausbrecher-Rotte) | visual/gegner_ideen; OFFEN [E] | **offen** (Entscheidung) |
| G4 | Boss-Intros für Graumähne, Karrak, Blutfürst (Aldhelm); Kerkerausbruch, Ankunft Aurelheim als Szene | ist/C 1.9 („Phase 5.6“); PLAN_OFFEN S14; PLAN_ROADMAP §5g.5 | **teilweise** — `BOSS_CARDS` (data.js:1788): chain_master, hrodvar, garmadon, whitebeard, dodon, gorak, omega. OFFEN.md-Zeile „Intros fehlen für Varg … Dodon“ ist überholt |
| G5 | Boss-Beute: eigener `BOSS_LOOT`-Pool für Graumähne/Karrak (sichere Drops vorhanden) | ist/C 1.12 | **teilweise** |
| G6 | Rüstungsvielfalt R1–R7: Zustand sichtbar (Dellen/Politur), improvisiert, schwer/leicht, Fraktionsregel, Rarität-Kante, Bossrüstung/Unikate sichtbar, Set-Hände/-Beine, 7 Teile ohne Look | visual/ruestungen.md; VISUAL §3 | **offen/nicht geprüft** (keine Code-Marker; `rankBadge/Rangabzeichen` 0) |
| G7 | Ressourcen-Sprites (Bäume, Erz, Stein, Kräuter; Abbau sichtbar als Zustand); 38 Rohstoffknoten auf Fels unerreichbar (A-04) | PLAN_ROADMAP §5g.3; TASKS T14; docs/BUGS A-04 | **nicht geprüft** |
| G8 | Geheime Orte Rest: Uhrmacher, Leuchtfeuer, Walknocheninsel | OFFEN [B]; PROPOSALS/geheime_orte | **offen** (5 von 8 gebaut) |
| G9 | Zweite Gischtinsel, weitere Inseln; Seevolk-Händler, Orte, Konflikte; Wasservolk (P21) | PLAN_ROADMAP §5g.38, §5d.9; TASKS T27; PLAN_S15 P21; MASTER_ROADMAP C.22 | **offen** |
| G10 | Dungeons: Rätsel/Fallen vertiefen, sehr schwere Gewölbe Aurelion/Totenland prüfen; angekündigte Gewölbe-Events (Einsturz, Gefangener, Elite) | PHASE_STATUS 14; masterprompt-abgleich 40/76 | **teilweise** (Hebel/Druckplatte/Geheimwand §5e.3; Rest nicht geprüft) |
| G11 | P10 Aurelion sichtbar überlegen: Laternen, Automaten-Streifen, Kristallkräne, Uhr, Förderband-Fabrik, Aurelion-Magier, Scharfschütze; Ereignisse Erfinderkongress, Sabotage | PLAN_S15 P10; MASTER_ROADMAP C.9 | **teilweise** — Magitech-Waffen C.10, Luftschiffabsturz und Adelsball (BIG), Aquädukt/Kanal (WELTREGELN) gebaut; Rest nicht geprüft |
| G12 | Expeditionen (C.17), Krankheiten als Modell (C.15; Seuche nur als BIG-Ereignis), Weltgeheimnisse ohne Marker (C.19) | MASTER_ROADMAP | **offen/teilweise** |
| G13 | „Ende der Brüder“-Ideen 1–8 (Machtvakuum, Erbfolge der Kette, Tote ohne König, Blutsplitter, Grabmal, Heimkehr, Legendenlied, Omegas Antwort) | PLAN_OFFEN S14 Brainstorm | **offen** (nie entschieden) |
| G14 | Eisenfeste endgültig zerstört → Goblins schließen sich den Untoten an (erst planen) | PLAN_OFFEN G | **offen** |
| G15 | Totenland bei der Schwarzen Feste leer und dunkel; Goblin im Totenland-Spawn (BUG-143) | docs/BUGS | **nicht geprüft** |
| G16 | Mutanten als Reise-Hinterhalt; Blutschöpfer ohne „zweites Trinken tötet“; alle Werte der neuen Gegner | OFFEN [E] gegner_neu 5–7 | **offen** (Entscheidung) |
| G17 | Umhänge/Kapuzen, Exoten, Volkswaffen: je Boss eine eigene Legendäre (§5f) — Graumähne/Karrak haben Unikate; vollständig? | PLAN_ROADMAP §5f | **nicht geprüft** |

### 2.7 Kampfanimation

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| K1 | §17-Rest: Kampf-Idle, Kampfbewegung, Block/Parade-Haltung je Waffe, Ausweichen je Pack, eigene Großaxt-Bewegung, Trefferreaktionen je Waffe | OFFEN [B]; COMBAT_ANIM §17 | **offen** — gebaut bis 04.10.: Profile Axt/Kolben/Stange/Rapier/Peitsche/Stab, Gewicht je Klasse, Oberkörperdrehung, Swoosh (IST_ZUSTAND Kopf) |
| K2 | Pack-Mischung nach Spielfortschritt (frühe Waffen A, Midgame B, Endgame C) — entschieden 03.10. | DECISIONS 03.10. | **nicht geprüft** |
| K3 | Schwerer Hieb per Halten: eigener Schadensfaktor, Ladezeit je Waffe, Ausdauerkosten, Leertaste/Touch, Aufladen für Koop-Gäste (nicht blockbar: entschieden) | OFFEN [E] | **offen** (Entscheidung) |
| K4 | Haltung/Humpeln verwundeter Gegner, Status als Haltung, Eisrand im Koop; Tod/Verletzung (Kriechen, Hilferufe, Verbluten) | OFFEN [E]; PLAN_ROADMAP §5f | **offen** |
| K5 | Kampf-Lauf-Bilder vorbacken (~4 ms je neuer Blickrichtung); Bild-Cache ≈ 4000 bei 5 Waffen × 3 Packs | OFFEN [P] | **offen** |
| K6 | Hit-Reaction je Material (Rüstung, Fleisch, Untot, Automat) über `ANIM_DEFS.hit`/`fx`; Hit-Stop/Screen-Shake-Abstufung | PLAN_ROADMAP §5; MASTER_ROADMAP B.4 | **nicht geprüft** |
| K7 | T17 Scheiben 3/4: Hrodvar-Frost, Garmadon-Herzschlag, Hinrichtung am Galgen, Umbau alter Kamerafahrten, Goblinsturm Sieg/Niederlage; T20 Rest (Heimweg, Gräber, Aufstand als Kolonne) | ROADMAP 5, 9; PROPOSALS/t17 | **offen** (Aufbruch des Sturms als Szene gebaut, game.js:8748) |
| K8 | Goblin-Befreiung als dynamische Szene (B.9), Luftschiff-Absturz mehrstufig (B.14), Kamera-System Pan/Focus/Zoom (B.10), emotionale Reaktionen (B.13) | MASTER_ROADMAP Teil B; PLAN_ROADMAP §5 | **teilweise** (Szenen-Engine `cinematic`/`nameCard`/`capitalScene` vorhanden; Goblin-Befreiung/Absturz offen) |
| K9 | NPC-Alltagsanimationen (Schmied hämmert, Händler sortiert, Bauer arbeitet, Magier liest); Umgebungsanimation (Wasser, Vogelschwärme, Türen; Fahnen/Rauch vorhanden) | MASTER_ROADMAP B.6/B.7; PLAN_ROADMAP §5f | **teilweise/nicht geprüft** |
| K10 | Pferde: Gang und Grundform nicht neu gezeichnet („bereits brauchbar“) | OFFEN [P] | **offen** (Urteil des Entwicklers) |
| K11 | Eigene Silhouetten je Klasse: Rumpfdrehung-Grenze des R-Systems | OFFEN [P] | **teilweise** (Oberkörper dreht seit 04.10.) |

### 2.8 Skills/Progression

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| P1 | SPEC_SKILLS gesamt: Skill-Core (Level/XP/Meilensteine/Perks/Meisterschaften), Waffen-Skills verändern den Kampfstil, Fischen als Minisystem, Holz/Bergbau/Sammeln/Kräuterkunde/Jagen, Kochen, Farming, Handwerk-Qualität nicht zufällig, Spezialisierungen, Skill-Fenster, Trainer/Bücher, Legacy-Anbindung, Anti-Grind | SPEC_SKILLS_GRIND §1–61 | **offen** — vorhanden: `skills` (Waffenübung 5 + 3/Stufe, `stealth` wächst beim Schleichen, Jagd wächst beim Erlegen 03.10., Schmied-Fertigkeit), Handwerk-Qualität §5d.8, Sternbild-Talente; kein Skill-Fenster, kein Fischen/Holz/Bergbau (nicht geprüft) |
| P2 | Klassen: vorläufige Zahlen bestätigen (Sternnamen, Werte, Szenenzitate; Ritter „Platz halten“ 50 s; Grube ×2 LP/×1,6 Schaden; EP je Prüfungsschritt 80/110); Ritter-Segen kostet Ausdauer (entschieden) | OFFEN [E]; DECISIONS 03.10. | **offen** (Bestätigung; Ausdauer-Umsetzung nicht geprüft) |
| P3 | Schleich-, Jagd-, Schmied-Fertigkeit zeigen Platzhalter im Charakterfenster | visual/vollstaendigkeit | **nicht geprüft** (nach 03.10.) |
| P4 | Aurelion-Ränge 3–6 mit echten Prüfungen (Technik-Aufgabe, Amok-Automat, Luftschiff-Eskorte), Zwischenränge | PLAN_ROADMAP §5g.10, §5; PLAN_S15 P10.5; TASKS T18 | **offen** — `startTrial` nur Akademie-Prüfungen |
| P5 | Gefährten: Ausrüstung mit Klassenprüfung (B-07 „stärkstes Stück ohne Prüfung“), bessere Befehle, Tier als viertes Mitglied, Lagerdienst | PLAN_ROADMAP §5g.7; TASKS T16; PLAN_S15 P22; IDEAS 6/7 | **offen** |
| P6 | Magie-Kombos (Frost + Blitz, Feuer + Öl); Runen und Sockel (Tiefhall, Aurelion) | PLAN_ROADMAP §5g.26, §5g.28; TASKS T26/T36 | **offen** (`sockel/rune` nur Namen) |
| P7 | Barde ausbauen (Repertoire, Auftritte, Verdienst) | PLAN_ROADMAP §5g.31; TASKS T32 | **nicht geprüft** (`repertoire/auftritt` 12 Treffer) |
| P8 | Taschendiebstahl an Personen (Schleichen gegen Wahrnehmung, Zeugen); Zuschauer | PLAN_ROADMAP §5g.23; TASKS T37 | **offen** — `pickpocket/taschendieb` 0; Schleichmodus gebaut (`toggleSneak`, `sneakSight`) |
| P9 | Zerlegen an der Werkbank, Monstermaterial, Eisen-Brücke | TASKS T25; IDEAS 10 | **offen** (`zerlegen` 1 Treffer) |
| P10 | Rüstungsklassen und Schlagarten (A2), Gegner verteidigen sich (A3), Deckung im laufenden Kampf | TASKS T19/T22; WELTREGELN 🟡 | **offen** (`armorClass` 0; `poise` 13 = T01) |
| P11 | Wundbrand (A11), Waffenkunst (A12), Dauerhafte Blessuren, Phantomschmerz | MASTER_REPORT Welle 2; IDEAS 15/27 | **offen** |
| P12 | Titelklasse endet bei Grad III ohne Fraktions-Rückwirkung; Fraktionsrang ohne Spätspiel-Konsequenz | IDEAS R9.3/4 | **offen** (IDEA) |

### 2.9 Wirtschaft

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| W1 | T23 Fraktionsressourcen: eine Ressource je Macht (Korn, Eifer, Seelen, Züge, Arbeitskraft, Versorgung/Magitech-Index, Salz, Grubenhort), täglich in `warDay`, Kodex „Mächte“, Tribut aus dem Dorfmarkt; Aurelion wird mit Wohlstand stärker | ROADMAP 6; PROPOSALS/t23 (DESIGN_LOCKED); DECISIONS 01.10. | **offen** — `corpses/resources/Fraktionsressource` 0 Treffer; sim.js:488–492 nutzt nur Valen-Korn und Kult-Drain |
| W2 | T12 Straßen haben Herren: Banden kontrollieren Straßen, Schutzgeld deckt den eigenen Wagen, Patrouillen schwächen Banden 35 %, Rooks Hauptmann melkt eine Straße | ROADMAP 7; PROPOSALS/t12 (APPROVED); hunt/BERICHT IHF-04 | **offen** — nur Begegnung `toll` (game.js:2997); Banden §5d.7 ohne Straßenwirkung |
| W3 | Eigene Handelskarawane (Route, Wächter, Überfallrisiko, Gewinn je Rundreise) | PLAN_ROADMAP §5g.29; TASKS T39 | **teilweise** — `myCaravanDay` in economy.js (T04-Hinweis), 4 Treffer; Umfang nicht geprüft |
| W4 | Luftschiffe in der Welt (V7), eigenes Luftschiff (V8), Luftschiff-Handel des Spielers, Luftpiraten als Bande, Luftaufklärung | PLAN_ROADMAP §5; TASKS T30; MASTER_REPORT Welle 2; IDEAS 17, 22–24 | **offen** |
| W5 | Städte als Simulation mit Stadtwerten (Sicherheit, Kriminalität, Arbeitsplätze, Stabilität) und Stadt-Fenster | MASTER_ROADMAP C.3, C.30 | **teilweise** (Wohlstand, Hunger, Lager, Wachen-Besatzung vorhanden; Kriminalität/Sicherheit als Werte nicht geprüft) |
| W6 | Alchemie-Handel und Fallen (Apotheke, Gift-Schmuggel, Ölfass, Giftgas) | PLAN_ROADMAP §5g.34; TASKS T36 | **offen** (`giftgas/ölfass` 0) |
| W7 | Aurelion-Industrie sichtbar (Großfabrik, Förderbänder, Minen/Holzfäller/Steinbrüche des Hochreichs) | MASTER_ROADMAP C.9; WELTREGELN 🟡 | **offen** |
| W8 | Markt reagiert auf Bedrohung (gebaut), Gildenstreik (gebaut); Wiederaufbau mit Material (V16), POIs (V5), Grubenstämme-Wirtschaft | MASTER_REPORT Welle 2 | **offen** |
| W9 | Zwei Vorratssysteme, drei Karawanenmodelle (IHF-07); Wetter global nach Spielerregion (IHF-08) | hunt/BERICHT Fit | **nicht geprüft** |
| W10 | Söldnerlohn statt reiner Loyalität; Karawanen-Eskortenvertrag | IDEAS 16/19 | **offen** (IDEA) |

### 2.10 Fraktionen

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| F1 | Fall Aurelions (ganzer Hoher Rat tot) löst kein Weltereignis aus: Bürgerkrieg der Häuser, dann Automaten oder Varon | OFFEN [B] (GATE §11); PLAN_ROADMAP §5g.8; PLAN_S15 P18; MASTER_ROADMAP C.24; TASKS T40 | **offen** — `varonBound` trägt nur einen T40-Hinweis (game.js:9553); kein Bürgerkriegs-Ereignis gefunden |
| F2 | T40 ein Kriegsgraph mit Aurelion-Knoten; Diplomatie (Gesandte, Frieden, Bündnis, Kriegsknoten befrieden); Agenda nach Lage (V15) | PLAN_ROADMAP §5g.32; TASKS T40 | **offen** (`diplomat/gesandte` 1 Treffer) |
| F3 | Belagerung S3b–d: Sturm vor Ort, Burgbezirk, König fortbringen über Gero/Brandt | ROADMAP 8; PROPOSALS/varonheim_belagerung_s3 | **offen** (S3a gebaut: Burg besetzt, Alarm, Burgtor) |
| F4 | T15 Messing: Stigma V9 (sozialer Preis der Bionik) + Schwächen V10 (Energiezelle für Stufe-4-Prothesen alle 3 Tage, Kurzschluss bei Schock, Regen-Verschleiß ×1,3) | ROADMAP 2; DECISIONS 01.10.; hunt/BERICHT SHF-01 | **offen** — `Energiezelle` nur für Magitech-Waffen/-Schild (data.js:138/162); Stigma nur Vampir/Skelett |
| F5 | Aurelion-Bionik wirkt im Kriegsgraphen (gewählt R9.7) — braucht Design | OFFEN [E]; IDEAS R9.7; hunt IHF-09 | **offen** |
| F6 | Luftbrücke für Belagerte; Verwundete aus Feldschlachten (anwerben/versorgen) | ROADMAP 3c; PROPOSALS/luftbruecke (APPROVED, 4 Fragen) | **offen** (0 Treffer) |
| F7 | A-10 Rest: Verbrechen auf Innenkarten und an heimatlosen Reisenden zählen weiter für Valen | ist/A „Audit 04.10.“ | **teilweise** |
| F8 | Gleichwertige Rangvorteile, exklusive Ausrüstung, Gebietszugang und Missionsreihe je Rang für alle Fraktionen | WELTREGELN 🟡 (153–157); PHASE_STATUS 17 | **teilweise** (Rangreihen 8 × 3 Ränge; Vorteile Wüstenbund/Zwerge 03.10.) |
| F9 | Morrgrund/Dodon: Gorak als Gegenspieler? Dodon stirbt im Sturm? Angegriffenes Dorf versöhnen? | PLAN_S15 §G Fragen 2, 3, 5 | **offen** (Entscheidung) |
| F10 | Karraks Wüste nach Vargs Fall: friedliche Goblin-Lager oder Banditenlager? | mechanik-check Frage 4 | **offen** (Entscheidung) |
| F11 | Fit-Befunde: Stadt vergisst Wachmörder (SHF-03), Burgfrieden in gesetzloser Hauptstadt (SHF-04), Bandenstadt hängt alte Aufträge aus (SHF-05), Plünderer nur in Spielernähe (SHF-07), Notwehr in der Burg löst Alarm aus (SH-14) | hunt/BERICHT | **nicht geprüft** |
| F12 | Hunt-1-Reste ohne Code-Marker: HB-24 Burgtor stumm, HB-25 Totenheer-Übernahme hängt, HB-27 `gcut` nie zurückgebucht (game.js:9607 setzt, kein Rückweg gefunden), HB-28/29 Handel umgeht Sperren/pausiert nicht, HB-31 Kultkrypta nach Tod des Spieler-Blutfürsten, HB-34 c_nec2 Wächter nur im Pakt, HB-35 Kills durch Verbündete zählen nicht, HB-43…47 (Ritter mit Dolch, Hof-Neubau setzt Alarm zurück, Königsauftrag still erledigt, Waffenkammer-Bote, Beinschaden bremst Pferd) | hunt/BERICHT | **nicht geprüft** |
| F13 | Dynastien/Häuser als Politik (C.20), Hofintrige in Varonheim, Fraktionsgesandter reist sichtbar | MASTER_ROADMAP C.20; IDEAS R3 46/47 | **offen** |
| F14 | Stigma-Tabelle auf weitere Fraktionen; Blicke auf Bionik | IDEAS 30, 1 | **offen** (IDEA) |

### 2.11 Koop

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| C1 | Koop-Gast handelt per Dialog statt im Dock — Adapter nötig, der `tradeUI` mit `shopData` statt lebendem Händler füttert | OFFEN [B] BLOCKIERT; visual/vollstaendigkeit | **offen** |
| C2 | HB-30 Koop-Gast: Handel ohne Lagerbuchung und Auftragsauslöser | hunt/BERICHT | **nicht geprüft** |
| C3 | Ersatz-Lebensbalken „zuletzt getroffen“ beim Gast nie (Kampf läuft beim Host) | hunt/BERICHT_2 HB2-04 | **teilweise** (Host-Seite behoben) |
| C4 | Koop nicht live getestet: Kampfanimation, Klänge, neue Fenster; Aufladen des schweren Hiebs für Gäste | OFFEN [P]/[E] | **offen** |
| C5 | Koop-Gäste immer Mensch (kein Fraktions-Start); Eisrand im Koop | PROPOSALS/fraktions_starts 13; OFFEN [E] | **offen** (Entscheidung) |
| C6 | Guest-`special`/eigene Schadenszahlen, Prüfungen je Figur, XP-Teilung (HB2-02/08/09) | OFFEN; IST_ZUSTAND Kopf | **umgesetzt** (zur Kenntnis) |

### 2.12 Performance/Technik

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| X1 | 3-ms-Marke nicht belegt (Bench bei ruhiger Maschine wiederholen); Vorbacken in Browser-Pausen nicht gemessen | OFFEN [P]; perf/PLAN | **offen** |
| X2 | Offene Hebel: `paintR`-Schwall bei Stadtankunft, Spitzen in `nearEnts`, `tierOf`, Sekunden-Haken | OFFEN [B] | **offen** |
| X3 | BUG-108 Städte über Budget, BUG-142 kalter Aufbau (`prefetchChunk` vorhanden, 2 Treffer), BUG-093 Fest > 2 ms — Status nach PERF-R/S/U nicht nachgezogen | docs/BUGS | **nicht geprüft** (keine neue Messung dokumentiert) |
| X4 | Simulation nach Nähe: Nah voll, Mittel vereinfacht, Fern abstrakt, Rekonstruktion bei Annäherung | SPEC_WELT §20, P4.28; MASTER_ROADMAP C.32, B.17 | **teilweise** — `tierOf` (game.js:837) stuft Figuren; ferne Figuren ~1×/s (game.js:5209); abstrakter Fernbereich mit Rekonstruktion nicht geprüft |
| X5 | Culling, LOD, Partikel-Limits, Tick-Raten, Pathfinding-Budget (nicht NPCs entfernen) | SPEC_WELT §48–49 | **teilweise** (fx-Deckel T04; Rest nicht geprüft) |
| X6 | Selbsttest dauert 2,5–3 min statt ~1 min; fremde Probe-Aufträge bleiben im Tab-Zustand; Q-4-Probe im isolierten Commit rot; RB-060 zweiter Lauf „Tagesrhythmus“ rot | OFFEN [P]; BUGS RB-060 | **nicht geprüft** |
| X7 | Toter Code/Technik-Schulden: SC-01 `buildVaronburgOld` (game.js:10020), SC-03 `servantSmuggle` ohne Debug-Eintrag, SW-01 `.find(...).name` ohne `?.` (6 Stellen), SW-02 Probe schreibt `ITEMS.__wall` | ROTFALL_STATE/BUGS; hunt/sweeper | **offen** (SC-04 erledigt) |
| X8 | RB-028 `deleteSlot` bei ausstehendem Speichern, RB-012 Kutschen-Probe, RB-033 Gift/Feuer/Blutung ~60 % (Systems-Entscheid), RB-010 Zoll-Code, RB-059 Bedrohungs-Nachmessung mit voller Tageskette | ROTFALL_STATE/BUGS; ROADMAP „klein“ | **offen** (keine Code-Marker) |
| X9 | Musik je Region/Kampf/Stadt (synthetisiert), Klang-Busse (D11) | PLAN_ROADMAP §5g.16; TASKS T28; PHASE_STATUS 18 | **offen** — sfx.js ohne `music` |
| X10 | Touch auf echtem Gerät testen; Tastenbelegung änderbar | PHASE_STATUS 19; masterprompt-abgleich 47 | **offen** |
| X11 | Doppelte Bodenauflösung (Speicher, Ruckler) | PLAN_OFFEN G | **offen** (Nutzer fragen) |
| X12 | Spielstand-Größe: Tagespläne mitgespeichert (P-02), Figuren 1,5 MB | docs/BUGS P-02 | **teilweise** (RFZ1 gzip T06; Inhalt nicht geprüft) |
| X13 | Zeilenenden gemischt (game.js CRLF), RFZ1-Format, rnd/vrnd-Regel — nur in ROTFALL_AGENT_STATE dokumentiert | ARCHITECTURE_NOTES, SYSTEM_DEPENDENCIES | **offen** (nach CLAUDE.md übernehmen) |
| X14 | Modulare Aufteilung von game.js (~22,9k Zeilen) | MASTER_ROADMAP C.33 | **offen** |

### 2.13 Save/Load

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| L1 | Regel: jedes neue `performance.now()`-Feld in `PERF_KEYS` (game.js:2355) eintragen; `drinkCd` des Spielers nutzt `clock()` und darf nicht pauschal hinein | HB-02, HB2-06 (behoben); OFFEN | **umgesetzt**, fortlaufende Regel |
| L2 | Regel: neue `humanSpec`-Felder in `HS_ENT`/`HS_PAL` (sonst veraltetes Aussehen) | OFFEN (PERF-U3); fraktions_starts | **umgesetzt**, fortlaufende Regel (nach CLAUDE.md) |
| L3 | Fraktions-Start-Freischaltung (`rotfall.starts`) schreibt nie unter `S._quiet` und nie für Koop-Gäste | PROPOSALS/fraktions_starts | **teilweise** (gewollt für Proben; Koop offen) |
| L4 | Save/Load-Testfälle für Tutorial, Familien, Betriebe, Städte | SPEC_WELT §51 | **offen** |
| L5 | Fraktionsbanner bei Besitzwechsel: Echtzeit oder beim Neubetreten (Konsistenz nach Laden) | visual/staedte Frage 4 | **offen** (Entscheidung) |
| L6 | „Zwanzig Jahre später“ lässt die Welt stehen (IHF-06); Erbe übernimmt uneinheitlich (IHF-05) | hunt/BERICHT | **nicht geprüft** (HB-20 entschieden: Witwe bleibt, Bindungen enden) |
| L7 | Alte Stände dürfen bei Weltumbau brechen; Migration nur wenn billig | DECISIONS 01.10. | Regel (zur Kenntnis) |
| L8 | Spielstand-Versionierung, zentrale Felddefinition (C.31) | MASTER_ROADMAP | **teilweise** (`ensure*()`/`continueGame`-Migrationen; keine zentrale Felddefinition) |

### 2.14 Tests

| # | Punkt | Quelle | Stand laut Code |
|---|---|---|---|
| V1 | Verifier über alles seit 01.10. (Dialoge, Feedback, Items, Kampfanimation, Gegner, Menüs, Klassen, Fenster) → [VERIFIED]-Push auf main | ROADMAP 10; OFFEN [P]; DECISIONS 01.10. | **offen** — kein Commit mit „[VERIFIED]“ im Backup-Repo; origin/main 4c0ce86 (05.10.), lokal 074e676 (08.10.) |
| V2 | Selbsttest: 483 Proben (Commit 074e676); Dauer und Aufräumen siehe X6 | CLAUDE.md | **umgesetzt**, Dauer offen |
| V3 | Zweiter vollständiger Agent-Durchlauf (Phase 21), Abschluss-Qualität (Phase 22) | PHASE_STATUS; masterprompt-abgleich 7 | **offen** |
| V4 | Cutscene-Regressionstests (B.19), End-to-End-Tests C.41 (Bionik, Auge, Luftschiff, Aurelion, Weltkrieg, Seuche) | MASTER_ROADMAP | **nicht geprüft** |
| V5 | Testfälle SPEC §51: NPCs ohne Quest, Familien, Gebäude-Eingang = Sprite, Kampf nicht durch Wände (Probe game.js:21212 ✓), Betriebe, Städte ohne Ballung, Quests | SPEC_WELT §51 | **teilweise** (nur §36-Probe) |
| V6 | Hunt-Fit-Befunde (SHF-01…07, IHF-01…09) unentschieden; HB-Reste ohne Marker (F12) | hunt/BERICHT | **offen** |
| V7 | Audit 04.10. Phasen 1–5: Phase 5.6 (Boss-Intros Graumähne/Karrak) offen; der Phasenplan existiert nicht als Datei im Repo (nur Commits a3b939e/5a7d63d und ist/A–D) | Commits; ist/C | **offen** (Plan dokumentieren oder Reste in Roadmap) |
| V8 | Stresstest Stadtfest/Belagerung mit Messung (§50/52) | masterprompt-abgleich | **offen** |

---

## 3 Offene Entscheidungen des Entwicklers

Nur Fragen ohne Antwort in `DECISIONS.md` (Stand 03.10.) oder einer späteren Quelle. Vom Lead/Agenten vorläufig gesetzte Zahlen stehen als „bestätigen“.

| # | Frage | Quelle | Hinweis |
|---|---|---|---|
| E1 | Haltung/Humpeln verwundeter Gegner, Status als Haltung, Eisrand im Koop bauen? (neue Posen bzw. Tempo-Regel) | OFFEN Kampf-Feedback | Kampfanimation |
| E2 | Lebensbalken des zuletzt getroffenen Gegners: 5 s bestätigen | OFFEN; DECISIONS 02.10. („Zahl vom Lead“) | bestätigen |
| E3 | Händlergesicht nach Ruf/Angst? | OFFEN Items/Läden | UI |
| E4 | Schwerer Hieb per Halten: eigener Schadensfaktor, Ladezeit je Waffe, Ausdauerkosten, Leertaste/Touch, Aufladen für Koop-Gäste? | OFFEN Kampfanimation | nicht blockbar ist entschieden |
| E5 | 14 nicht gewählte Gegnerideen (Liste G3) — welche bauen? | visual/gegner_ideen; OFFEN | Content |
| E6 | Mutanten als Reise-Hinterhalt? Blutschöpfer ohne „zweites Trinken tötet“? Werte aller neuen Gegner bestätigen | OFFEN gegner_neu 5–7 | Content |
| E7 | Skilltree Scheibe 3 (Freischalt-Animation) und 4 (Titelzweig-Siegel) streichen (durch Sternbild-Umbau überholt)? | OFFEN | UI |
| E8 | Verlusttage der Betriebe: erst Kasse, dann Gold — bestätigen | OFFEN UI 3 | Betriebe |
| E9 | Abholen direkt am Haus: Zuordnung Betrieb → Haus einführen? | OFFEN UI 4 | Betriebe |
| E10 | Bewohner rufen den Helden (Q-OE8), Szene bei Story-Abschlüssen (Q-OE3), Hinweis auf seltene Beute (I-6) bauen? | OFFEN UI 6 | Quests/UI |
| E11 | Kartenausschnitt im Auftragsbrief? | OFFEN UI 7 | Quest-GUI |
| E12 | Klassen: vorläufige Zahlen bestätigen (Sternnamen/Werte/Zitate, Ritter „Platz halten“ 50 s, Grube ×2 LP / ×1,6 Schaden, EP 80/110) | OFFEN 03.10. früh; DECISIONS („bleiben vorläufig; Entwickler testet“) | bestätigen |
| E13 | Symbolsatz für NPC-Sprechblasen (N1) | OFFEN 03.10. früh | NPC-Visuals |
| E14 | Vorläufige Werte bestätigen: Schlacht +5 / Befreiung +10 Ruf, Asservaten-Buße, Schleich-Sicht 55 % bzw. 30 %, Jagd bis +60 % Beute / bis 40 % kürzere Tiersicht | OFFEN 03.10. nachmittags | bestätigen |
| E15 | Wanderautomaten: Gewicht 1 unter Reisenden, 2 von 5 anwerbbar, kostenlos — bestätigen | OFFEN 03.10. (51ed0d7) | bestätigen |
| E16 | Wüstenbund: Eskorten +25 % ab Karawanenwächter, kein Wegzoll ab Rang 0 — bestätigen; eigene Kerkerkarte für Karak-Atar/Tiefhall statt gemeinsamer Zellenkarte? | OFFEN 03.10. | bestätigen |
| E17 | Fraktions-Starts, vorläufig (Punkte 1, 3, 5, 7–13): Rang ab Start = unterster Rang + Ruf 20 / Aurelion Bürgerrecht; Startort Zwerge an der Tiefhall; Rassenwerte; Haus = Siedlung mit fertiger Hütte (Alternative Zelt); Rekrutieren ab Ruf 40 ohne Rangrabatt; Skelett-Stigma „Knochen“ (120 px / 10 Tage, Wache verhaftet statt angreifen); Skelett heilt wie Lebende (Alternative: nur Totenmagie); Goblin/Zwerg ohne Stadt-Reaktion; Erbe behält Rasse, Kinder eines Skeletts; Koop-Gäste immer Mensch; Roboter-Gefährten essen weiter | PROPOSALS/fraktions_starts; OFFEN 03.10. | bestätigen (nur „Zwerge klein und breit“ ist entschieden) |
| E18 | Belagerung S3: Kellerweg nur mit Kultschlüssel (A) oder immer offen (B)? Varons Strenge: Ritter sicher ja / 15 % Ablehnung je Tag (A), immer mit Gero/Brandt (B), nie freiwillig (C)? | PROPOSALS/varonheim_belagerung_s3 §6; OFFEN; DECISIONS 02.10. („offen lassen“) | Burgfrieden (Frage 3) ist entschieden |
| E19 | Aurelion-Bionik im Krieg: Design (wie wirkt Bionik im Kriegsgraphen?) | OFFEN [E]; IDEAS R9.7 | Fraktionen |
| E20 | Luftbrücke: nur satt (A) oder satt + Besatzung +4 (B)? Wer fliegt: nur Spieler-Charter (A) oder Aurelion selbst bei Freundschaft (B)? Anwerben verwundeter Soldaten kostet Valen −2 außer mit Rang ≥ 1? Ausbluten nach 6 oder 12 Spielstunden? | PROPOSALS/luftbruecke_verwundete §18 | 4 Fragen |
| E21 | NPCs mit eigenen Zielen: Deserteurbanden zählen zum Bandendeckel (3/4)? Fahnenflucht ruht während der Belagerung? Valen-Heere schrumpfen ab Müdigkeit 60 (−2/Tag)? Abwanderer in die eigene Siedlung umleiten? | PROPOSALS/npc_eigene_ziele §18 | 4 Fragen |
| E22 | Welt-Ereignisse mit Namenskarte: immer oder nur in Nähe? Welcher Ton je Ereignistyp (Seuche, Heuschrecken, Turnier, Ball, Luftschiffabsturz, Schatzkarawane, Hexenprozess, Gildenstreik, Streik)? Folgenreiche Ausgänge später als kleine Szene? Pausiert die Namenskarte (wie Boss) oder läuft das Spiel (wie Toast)? | visual/welt.md | Grundsatz „Namenskarte + Ton, Pause nur Krieg“ ist entschieden; Details offen |
| E23 | Städte-Visual: Welche Steckbriefe am Brett (nur Elites oder auch Zettel je Auftrag)? Patrouillen als feste Rundwege oder Hin-und-Her? Fraktionsbanner wechseln in Echtzeit oder beim Neubetreten? Kinder/Tiere als Stadtbevölkerung (eigener Report)? | visual/staedte.md (Fragen 2–5) | Frage 1 (Board-Zugang) ist technisch, kein Entscheid |
| E24 | Morrgrund/Dodon: Gorak als Dodons Gegenspieler (Verräter/Bruder)? Darf Dodon im Sturm sterben, auch wenn der Spieler überlebt? Angegriffenes Goblin-Dorf später versöhnbar? | PLAN_S15 §G 2, 3, 5 | Fragen 1 und 4 durch §5e.9 beantwortet |
| E25 | Wasservolk: Seevolk der Gischtinseln ausbauen oder neues Volk im Wasser? | PLAN_S15 P21 | später laut Nutzer |
| E26 | Organische Stadtanordnung: bestehende Pläne umbauen oder nur neue/gewachsene Häuser versetzt? | mechanik-check Frage 2 | Empfehlung: nur neue |
| E27 | Karraks Wüste nach Vargs Fall: friedliche Goblin-Lager oder Banditenlager? | mechanik-check Frage 4 | Empfehlung: friedlich |
| E28 | Doppelte Bodenauflösung (Speicher, Ruckler) — gewünscht? | PLAN_OFFEN G | Technik |
| E29 | „Ende der Brüder“: welche der 8 Ideen (Machtvakuum, Erbfolge der Kette, Tote ohne König, Blutsplitter, Grabmal, Heimkehr, Legendenlied, Omegas Antwort)? | PLAN_OFFEN S14 | nie besprochen |
| E30 | 70 Figuren (Automaten, Kettenwachen) bieten nur „Gehen“ — gewollt? | docs/BUGS U-02; §5g.18 | NPC |
| E31 | RB-033: Gift/Feuer/Blutung kommen nur zu ~60 % an (Trefferzonen) — Systems-Entscheid | ROTFALL_STATE/BUGS | Kampf |
| E32 | Pferde-Sprites: reicht der Stand („bereits brauchbar“, Gang/Grundform nicht neu)? | OFFEN [P] | Urteil |
| E33 | Hunt-Fit-Befunde: SHF-01 Prothesen ohne laufenden Preis (= T15), IHF-01 Wirtschaft löst Weltereignisse nur teilweise aus, SHF-02 Prothesen medizinisch wie Fleisch (teils HB-16), SHF-03 Stadt vergisst Wachmörder, SHF-04 Burgfrieden in gesetzloser Hauptstadt, IHF-02 Siedlung ist Insel, IHF-03 drei Untoten-Offensiven ohne Abgleich, IHF-04 Banden ohne Handelswege (= T12), IHF-05 Erbe uneinheitlich, IHF-06 „Zwanzig Jahre später“ lässt Welt stehen, IHF-09 Bionik im Weltgeschehen unsichtbar; niedrig SHF-05/06/07, SH-14, IHF-07/08 — welche sind Fehler, welche gewollt? | hunt/BERICHT „Fit-Befunde (Urteile — der Entwickler entscheidet)“ | 17 Urteile |
| E34 | Feature-Ausbau alter Systeme (PROPOSALS/feature_audit_ausbau; IDEAS 1–4, 11–20, 22–35, 40–47): welche Ideen freigeben? | ROADMAP #3 (IDEA); IDEAS.md | Ideenspeicher |
| E35 | Welle 2 nach T40 (V5 POIs, V8 eigenes Luftschiff, V11 Implantate, V15 Agenda nach Lage, V16 Wiederaufbau mit Material, A11 Wundbrand, A12 Waffenkunst, D12 Silhouetten, D17 drawProp, Grubenstämme-Wirtschaft) — Reihenfolge/Auswahl | MASTER_REPORT §19 | Audit |
| E36 | Dokumentation: Pflegerichtung für IST_ZUSTAND (Gesamtdatei oder docs/ist/A–D), Fortführung oder Archiv von SESSION_LOG/STATE/ROADMAP, Löschen von ROTFALL_AGENT_STATE-Kopien, Ort `docs/archiv/` vs. bestehendes `docs/archive/` | dieses Inventar | Bereinigung |
| E37 | Spec Welt §50 Reihenfolge Tutorial → Quest/UI → NPC/Gebäude → Stadt/Familie → Betriebe → Gegner → Scaling → QA gegenüber den APPROVED-Punkten der alten ROADMAP (T15, T11, T17 S3/4, T23, T12, Belagerung S3, T20): was gilt zuerst? | SPEC_WELT §54–55; ROTFALL_STATE/ROADMAP | Priorität |

Zählung: 37 Zeilen; E17 enthält 10 Teilpunkte, E18 2, E20 4, E21 4, E22 4, E23 4, E24 3, E33 17 Urteile — als Einzelfragen gezählt 29 + 48 = 77 offene Entscheidungen.
