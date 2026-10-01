# director_to_lead

FROM: Director (Fable 5.1, Hoch) · TO: Lead / Implementation Engineer (Opus, Hauptstrang) · 01.10.2026
Kennzeichnung: **FACT** = aus Zustandsdateien, Control-/Hunter-Berichten oder TASKS belegt · **ASSUMPTION** = eigene Einschätzung · **EMPFEHLUNG** = Vorschlag, Lead entscheidet.

## TASK
Director-Schleife: Stand bewerten, Prioritäten für die zwei bis drei Zyklen **nach** Varonheim-Belagerung Scheibe 1 setzen, Agenten sparsam zuweisen, kreative Richtung nennen, Entwicklerfragen sammeln. Keine Code- oder Doku-Änderung durch den Director.

## CURRENT STATE
- FACT: Selbsttest 340/340 (Commit 6e91074), v=23. `main` nur noch mit [VERIFIED].
- FACT: Hauptstrang baut Varonheim-Belagerung S1 (`proposals/varonheim_belagerung.md`, DESIGN_LOCKED, 4 Scheiben S1–S4, S4 optional).
- FACT: Hunter 6 prüft T10; Control prüft alle TESTING-Punkte. Beide Arbeiten werden hier **nicht** doppelt vergeben.
- FACT: VERIFIED bisher nur T03 und RB-001/002/003/004/006/009. T01, T02, T04, T05, T06 stehen seit dem Control-Bericht (02:45) auf NEEDS FIX → laut `CURRENT_TASKS.md` behoben, aber ohne zweite Control-Prüfung. T07, T08, T09, T10 IMPLEMENTED/TESTING.
- FACT: Hunter 5 meldet **RB-023 CRITICAL** (Fesseln setzt `anchor: null`; nach Laufenlassen wirft die Gegner-KI alle paar Sekunden `TypeError`, `update()` bricht im Bild ab), RB-024 (sichtbares Versionslabel „v22“, index.html:71), RB-025 (Automaten-Wachen nehmen nie Gefangene ab, `robotTalk` springt vor `captiveChoices` zurück). **Keiner der drei steht in `CURRENT_TASKS.md`** — Tafel-Drift.
- FACT: RB-010 (Zollgesetz senkt Überfallrisiko nie) ist seit dem Control-Bericht ohne Besitzer; RB-012 (Kutschen-Probe wackelt) IN_DEVELOPMENT ohne Ursache.

## IMPORTANT DISCOVERIES

### Was kohärent ist (FACT, soweit belegt)
- Weltbühne: Varonheim steht (VERIFIED), Blutkult mit fünf Scheiben gebaut, Katakomben, Aldhelm, Vampir-Titelklasse, Heilung. Varons Hauptstadt wird gerade Kriegsknoten. Das ist das dichteste Stück Welt im Spiel.
- Krieg Valen ↔ Tote: Deckel, Gegengewicht, Entsatz (RB-001 VERIFIED, 6 Läufe ≤ 12/15).
- Spielerfolgen: Gefangene/Steckbriefe/Grausamkeits-Ruf (T08), Ahnenfeind/Heldentod (T10), Läden am Stadtlager (T09). Damit existiert erstmals die Teilkette **Begegnung → Gnade/Grausamkeit → Ruf → Verhalten der Gegner**.
- Technik: Spielstand ×21 kleiner (RFZ1), Slot-Fehler behoben, Cache-Schlüssel gezogen.

### Wo die Vision reißt (Kette NPC → Fraktion → Wirtschaft → Weltereignis → Begegnung → Verletzung/Prothese → Ruf → Chance)
1. **Fraktion → Wirtschaft:** FACT (TASKS T23): nur Valen hat eine Ressource (Korn); `T.vorrat` und Dorfmarkt laufen nebeneinander. Fraktionen gewinnen und verlieren Kriege ohne wirtschaftlichen Grund. Größte Lücke für Emergenz.
2. **Wirtschaft → Begegnung:** FACT (TASKS T12): `riskOf` kennt keine Banden, Lager oder Kriegsknoten; Banden rauben niemandem etwas; 13 Lager-POIs ohne Bezug. Überfälle sind Würfel, keine Folgen.
3. **Verletzung → Prothese → Ruf:** FACT (TASKS T15): niemand reagiert auf Prothesen oder Roboterauge; Messing hat außer Verschleiß keine Schwäche. Die Bionik ist mechanisch da, sozial tot. Für ROTFALLs Identität („Kybernetik ist nie nur bessere Ausrüstung“) ist das die schmerzhafteste Lücke. T07 hat die `STIGMA`-Tabelle mit Schlüssel `vampire` angelegt (FACT laut TASKS-Anforderung; ASSUMPTION, dass sie so gebaut wurde — Engineer bestätigt), T15 ergänzt `brass`.
4. **Weltereignis → Darstellung:** FACT (TASKS T17/T20): Zwischensequenzen sind Diashows (Text trägt alles, kein Klang, Schnitt friert 426 ms), Boss-Intros fehlen, Goblinsturm spawnt und löscht. Die Welt tut große Dinge, man sieht sie nicht.
5. **Schwierigkeit/Überleben:** FACT (TASKS T11): Hunger ist −4 Rumpf, nie tödlich; „Sehr schwer“ unterscheidet sich kaum. Lange Touren erfordern keine Planung.
6. ASSUMPTION: Nach S2 der Belagerung hat das Spiel sein erstes **reversibles Groß-Ereignis mit Hof-Exil**; ohne T12/T23 bleibt es trotzdem ein Duell Valen ↔ Tote, in dem Händler, Kette, Aurelion und Seevolk Kulisse sind.

### Zustandsdrift (FACT)
- `AGENT_STATUS/director.md`, `world_specialist.md`, `presentation_specialist.md` sagen noch „Opus statt Fable“. Director aktualisiert nur die eigene Datei; die anderen beiden beim ersten Einsatz.
- `feature_designer.md` wartet noch auf „6 Fragen“, die beantwortet sind.
- Control-Empfehlungen ohne Besitzer: schriftlicher Hunter-Bericht je Aufgabe (teils nachgeholt, Hunter 3–5 schreiben Dateien), `docs/audit/STATUS.md` auf Verweis kürzen, „offen: …“-Zeile je TESTING-Eintrag.

## RELEVANT FILES
- `ROTFALL_AGENT_STATE/CURRENT_TASKS.md` (Tafel, RB-023/024/025 fehlen), `BUG_DATABASE.md`, `HANDOFFS/control_to_director.md`, `HANDOFFS/bug_to_implementation.md` (Hunter 3–5).
- `docs/audit/TASKS.md` T11–T40 (Anforderungen, Abhängigkeiten), `docs/PLAN_ROADMAP.md` §5g (Z. 561–607).
- `proposals/varonheim_belagerung.md` §16 (Scheiben).
- `DESIGN_DECISIONS.md` 01.10. „Audit-Wahl“: vorab freigegeben sind A5, A6, A2+A3, A4+A8, V3, V4, V9, V7+V8, D1/D2/D15, D9, D10, D8 sowie alle §5g-Punkte 1–38. **Nicht** in der Liste: A14 (Hunger/Müdigkeit), V10 (Messing-Schwächen), V12+V14 (Fraktionsressourcen/Tribut), A7+A15 (Zerlegen), V6 (Seehandel), V2 (ein Kriegsgraph).

## DECISIONS (Director, im Rahmen; Lead darf abweichen, Entwickler entscheidet bei Fragen)

### Prioritäten nach Belagerung S1 — gemischt groß/klein

**Zyklus A — „Folgen festziehen“**
| # | Punkt | Art | Weg | Agent · Modell · Denkstufe |
|---|---|---|---|---|
| A1 | **Fix-Paket:** RB-023 (CRITICAL, `anchor: null`), RB-024 (Label v23), RB-025 (`robotTalk` vor `captiveChoices`), RB-010 (`riskOf` liest Feld, das `applyLaw` löscht), RB-012 Ursache | Bugfix | direkt, ein Commit, Proben | Engineer (Opus, Mittel); Hunter danach (Sonnet, Mittel) |
| A2 | **Varonheim S2** — Fall, Exil Salzhafen, Hof zerfällt, Rückeroberung, `varonBound()`, Kultpausen | Groß, DESIGN_LOCKED | direkt | Engineer (Opus, Hoch) |
| A3 | **T15 Messing-Stigma (V9-Teil):** `brassOf`, `STIGMA.brass`, Preise, Gruß, Spionverdacht in der Audienz, Inquisitor ab Eifer 2, Aurelion-Rabatt; Hinweis beim ersten Einbau; Debug | Mittel, V9 vorab freigegeben | direkt; **V10-Teil wartet auf Frage 1** | Engineer (Opus, Mittel); Kampf-Spezialist nur für V10-Zahlen (Opus, Mittel, kurz) |
| A4 | Tafel-Pflege: RB-023/024/025 in `CURRENT_TASKS.md`, „offen: …“-Zeile je TESTING-Eintrag, `docs/audit/STATUS.md` auf Verweis kürzen, veraltete `AGENT_STATUS`-Dateien | Klein, Doku | direkt | Token-Optimierer (Sonnet, Mittel) |
| A5 | Control-Nachprüfung der NEEDS-FIX-Punkte **gebündelt am Zyklusende**, nicht je Punkt | Prüfung | – | Control (Opus, Sehr hoch) — läuft bereits, nicht neu starten |

**Zyklus B — „Straßen und Bühne“**
| # | Punkt | Art | Weg | Agent · Modell · Denkstufe |
|---|---|---|---|---|
| B1 | **T12 Straßen haben Herren** (V4): `riskOf` + Banden/Lager/Kriegsknoten, Beute in `b.loot`, Rook-Netz, Kontor-Zeile | Groß, V4 vorab freigegeben | direkt nach **einer** kurzen Systemprüfung (Querwirkung Wirtschaft/T09, Kutschen-Probe RB-012) | Systems Designer (Opus, Hoch, 1 Durchgang, nur Diff-Hinweise); Engineer (Opus, Hoch) |
| B2 | **T17 Regiebuch + Boss-Intros** (D1+D15 = §5g.5) | Mittel, vorab freigegeben | Director/Darstellung liefert Regie-Spezifikation (Shot-Schema, Beats, 6 Boss-Beats, Timing) → Engineer | Darstellung = Fable (Hoch); Engineer (Opus, Mittel) |
| B3 | **T11 Schwierigkeit/Wetter (§5g.6 + §5g.21):** mehr Überfälle auf Sehr schwer, Angsthase beim Heiler, eigene Wetterlagen Menschenland | Klein–Mittel, vorab freigegeben | direkt; **A14-Teil (Hunger/Müdigkeit) wartet auf Frage 2** | Engineer (Opus, Mittel) |
| B4 | **T19 Rüstungsklassen** (A2): `ac`, `AC_MUL`, Treffer-Floats, Kodex-Spalte | Mittel, vorab freigegeben | direkt; simFight-Tabelle 10 Gegner vor/nach in BALANCE.md | Kampf-Spezialist (Opus, Mittel) misst; Engineer baut |
| B5 | Hunter je Scheibe, schriftlich (`bug_to_implementation.md`), auf HEAD-Worktree | Prüfung | – | Hunter (Sonnet, Mittel) |

**Zyklus C — „Mächte bekommen Gründe“**
| # | Punkt | Art | Weg | Agent · Modell · Denkstufe |
|---|---|---|---|---|
| C1 | **T23 Fraktionsressourcen + Tribut** (V12+V14): `S.facRes` je Macht, `planCampaign` aus Arbeitskraft, Kodex „Mächte“, Tribut aus dem Dorfmarkt | Groß, **nicht freigegeben** | Vorschlag durch Welt/Fraktionen (Fable) → Entwicklerfragen → Systemprüfung → Engineer. Baut T40/T30 vor. **Frage 4** | Welt = Fable (Hoch) Vorschlag; Systems Designer (Opus, Hoch) Prüfung; Engineer |
| C2 | **T16 Gefährten-Taktik** (§5g.7 + A8): Klassenprüfung, Fokusziel, Haltung, Tier als viertes Mitglied | Mittel, vorab freigegeben | direkt | Engineer (Opus, Mittel); KI-Spezialist nur bei `partyAI`-Problemen (Opus, Mittel) |
| C3 | **T20 Goblinsturm/Morrgrund/Aufstand inszeniert** (D2) — erst wenn T17 steht | Mittel, vorab freigegeben | direkt auf T17-Regie; Spezifikation von Fable | Darstellung = Fable (Hoch); Engineer |
| C4 | **T14 Ressourcen-Sprites** (§5g.3) als kleiner Darstellungs-Punkt dazwischen | Klein–Mittel | direkt (Stil R, LRU-Cache aus T06) | Engineer (Opus, Mittel); Fable nur Variantenliste |
| C5 | Varonheim **S3 (vor Ort)** einmischen, sobald S2 VERIFIED; **S4 bleibt DEFERRED** bis der Entwickler es will | DESIGN_LOCKED | direkt | Engineer (Opus, Hoch) |

Geparkt mit Begründung (ASSUMPTION): **T13 Oberfläche** (Large, 30+ Hooks, hohes Regressionsrisiko für Proben, die Knöpfe klicken) erst, wenn weniger Features gleichzeitig in TESTING stehen; **T40** erst nach T23 + T12 + T30; **T18, T26, T27, T29–T39** nach Abhängigkeiten.

### Agentenregeln dieses Durchgangs
- Kein Opus für A4 (Doku), Variantenlisten, Formatierung.
- Systems Designer nur zweimal (B1 kurz, C1 Prüfung). Feature Designer (Opus) nicht nötig: freigegebene Punkte brauchen keinen neuen Vorschlag, T23 schreibt Fable als Welt-Spezialist.
- Control gebündelt je Zyklus. Hunter je Scheibe, schriftlich, HEAD-Worktree (Control-Empfehlung 6/7).
- Jeder Punkt behält die DoD aus `docs/audit/TASKS.md` (Probe, Debug, Spielerhinweis, MECHANIKEN, CHANGELOG).

### Kreative Richtung (Fable, höchstens drei Vorschläge als Nächstes)
1. **Boss-Intros als Auftritt statt Namensschild** — Vargs Ketten am Kettentor, Hrodvars Eiskreis, Garmadons Herzschlag in der Schwarzen Feste, Blutfürst-Kerzen in den Katakomben: Kamera 500 ms, Beat, Umgebung reagiert (Fackeln flackern, Gefährten weichen), Steuerung bleibt, einmal je Held (`S.flags.introSeen[mtype]`). Ort: `bossIntro(e)` in T17.
2. **Fall Varonheims als Szene** — heute (ASSUMPTION aus Proposal §16) kommt S2 abstrakt über Chronik und `aurelFall`-Kern; die Flucht des Königs nach Salzhafen verdient Glocken, brennendes Burgtor, Kolonne aus Varon, Brandt, Ysmay, Hagen und Ankunft im Exilhof. Ort: `H.capitalFell` → Regie-Shot nach T17; S2 baut die Daten, die Szene kommt mit T17, nicht vorher.
3. **Man sieht nicht, wer eine Stadt hält** — besetztes Nordfurt sieht aus wie freies (FACT TASKS T33: Banner und Wachen folgen nicht `S.war.nodes[k].owner`). Kleiner Vorschlag: Banner, Wachtyp und Torgruß aus dem Besitzer, ohne `world.js`-RNG; Ort: `houseSprite`/Hausbild-Schlüssel, `gateOf()`. Passt zur Belagerung S2 (Varonheim besetzt) und zum Kriegsgraph.

## OPEN QUESTIONS
Vier Fragen in `OPEN_QUESTIONS.md` (Messing V10, Hunger/Müdigkeit A14, Reihenfolge der Belagerungsscheiben, T23 als nächster großer Vorschlag). Bis zur Antwort: V9 ja / V10 nein, §5g.6+21 ja / A14 nein, S2 direkt nach S1, T23-Vorschlag wird vorbereitet, aber nicht gebaut.

## BLOCKERS
- Keine harten Blocker. RB-023 ist CRITICAL und sollte vor jedem weiteren T08-abhängigen Punkt (T12 Gefangene in Lagern, T21) weg sein.
- Formal: Nichts aus T01–T10 außer T03 ist VERIFIED, solange die zweite Control-Prüfung aussteht. Das ist kein Grund zu warten, aber `main` bleibt bis dahin ohne neuen [VERIFIED]-Push.

## EXPECTED NEXT STEP
1. Lead bestätigt oder ändert die Zyklus-Tafel A–C und trägt A1–A4 in `CURRENT_TASKS.md` ein.
2. Nach S1: Engineer A1 (Fix-Paket) **vor** A2 (S2), weil RB-023 die Weltsimulation wiederkehrend bricht.
3. Lead legt dem Entwickler die vier Fragen vor; Director schreibt in der Zwischenzeit die T17-Regie-Spezifikation (B2) als `proposals/t17_regiebuch.md` — ohne Code.
4. Nach Zyklus A: Control-Bündel, dann Zyklus B.
