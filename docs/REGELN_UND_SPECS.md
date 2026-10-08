# REGELN UND SPECS — verbindliche Arbeitsregeln und Entwickler-Spezifikationen (Stand 08.10.2026)

Einzige Sammelstelle (Doku-Bereinigung 08.10.2026). Enthält: Feature Readiness Gate, Team-Regeln, Master-Arbeitsregeln (Teil A), Balance-Regeln für neue Inhalte, die Specs Welt/Tutorial (08.10.), Skills/Grind (08.10.), Kampfanimation (02.10.), Visueller Umbau (02.10.), Animations-Referenz. Spielerregeln stehen in MECHANIKEN.md, Offenes in ROADMAP_ZENTRAL.md.

---

# A — Feature Readiness Gate

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

---

# B — Team und Arbeitsweise

Verbindliche Fassung: die Anweisung des Entwicklers vom 01.10.2026 („ROTFALL — Agent Team“, sechs Agenten). Sie ersetzt das frühere 12-Rollen-System in `ROTFALL_AGENT_STATE/AGENT_SYSTEM.md`. Der alte Ordner bleibt als Archiv.

Zusatz des Entwicklers (01.10.2026): **„die dürfen alle Plugins benutzen, die sie benötigen.“** Abschnitt 6 „Neue Werkzeuge“ gilt damit gelockert. Vorhandene Plugins dürfen ohne Rückfrage benutzt werden. Wer ein **fehlendes** Plugin installieren will, nennt es weiterhin vorher.
**Ausnahme (Entwickler 01.10.2026):** Die alte Sperre bleibt — nie SpriteCook, kostenpflichtige Bild-Generatoren, pixel-plugin oder Aseprite.

## 1. Was ROTFALL ist (Kurzfassung)
- 2D-Dark-Fantasy-Sandbox; Bezugspunkte sind Kenshi (Systemtiefe), RimWorld (Simulation) und Realm of the Mad God (Pixelenergie). ROTFALL bleibt dabei ein eigenes Spiel.
- Ziel ist eine Kette: NPC-Entscheidung → Fraktion → Wirtschaft → Weltereignis → Begegnung → Kampf und Verletzung → Ausrüstung oder Prothese → Ruf → neue Gelegenheit.
- Feste Punkte:
  - NPCs handeln selbst. Fraktionen sind mehr als Farben.
  - Der Süden (Aurelion) steht für Adel, Automaten und Bionik.
  - Kybernetik ist ein Tausch, nie einfach bessere Ausrüstung.
  - Der Ton bleibt Dark Fantasy.
  - Verletzungen und Luftschiffe zählen.
  - Kampf ist eine Folge von Entscheidungen.
  - Szenen zeigen, statt nur Text einzublenden.

## 2. Projektfakten
- **Engine, Sprache, Framework:** reines JavaScript als ES-Module, Canvas 2D, WebAudio-Synthese. Kein Build, kein npm, keine Abhängigkeiten. Alle Texte für den Spieler, Kommentare, Doku und Commits sind deutsch.
- **Starten:**
  - Den Repo-Stamm statisch ausliefern, z. B. `python3 -m http.server 8000`.
  - Für Agenten läuft ein No-Cache-Dev-Server auf `http://localhost:8770`; ohne No-Cache lädt der Browser alten Code.
  - URL-Schalter: `?dev` (stellt `window.RF` bereit), `?test` (Selbsttest beim Laden), `?coopLocal`.
  - Strg+Umschalt+D öffnet das Debug-Menü.
- **Tests:**
  - `RF.selftest()` umfasst etwa 349 Proben `ok(name, cond)` und dauert rund 45 s.
  - Start mit `setTimeout(() => window.__st = RF.selftest(), 50)`, das Ergebnis später lesen. Alle Proben müssen bestehen.
  - **Der echte Spielstand darf sich nie ändern.**
    - Vor jedem Neuladen ausführen: `localStorage.setItem('rotfall.legacy.save', localStorage.getItem('rotfall.backup.s14c')); localStorage.setItem('rotfall.slot.active','legacy')`.
    - Danach `/?dev&x=<Zeitstempel>` laden, `RF.S._quiet = true` setzen und `[data-act="continue"]` klicken.
    - Tests mit echtem Tod oder echtem Speichern laufen nur in einem Wegwerf-Slot (`setSlot`), der danach gelöscht wird.
  - Parse-Prüfung: Nach dem Neuladen muss `window.RF` existieren.
  - Browser-JS-Aufrufe brauchen höchstens 45 s. Bei verstecktem Fenster läuft keine Bildschleife; dann `RF.tick(ms)` verwenden.
- **Quellen:** Der Ordner `src/` enthält:
  - `game.js` (~18 000 Zeilen): Schleife, Kampf, KI, Dialoge, Aufträge, Debug, Selbsttest
  - `state.js`: Zustand `S`, Zufallsgenerator, Speichern
  - `data.js`: Inhalte
  - `world.js`: Weltgenerierung
  - `sim.js` und `economy.js`: Krieg, Märkte
  - `body.js`: Körperzonen, Bionik
  - `render.js`, `sprites.js`, `fig5.js`, `figure.js`, `anim.js`: Darstellung und Gesten
  - `ui.js`, `sfx.js`, `coop.js`, `atlas.js`, `buildings.js`, `cloudsave.js`

  Dazu `index.html` und `docs/` (`MECHANIKEN.md` mit den Spielregeln, `IST_ZUSTAND.md`, `BALANCE_GUIDE.md`, `CHANGELOG.md`). Die Details stehen in `CLAUDE.md`.
- **Sprites:**
  - Es gibt keine Bilddateien; jeder Sprite ist ein im Code gezeichnetes Pixelraster. Eine „Spec“ wie `humanSpec` oder `monsterSpec` beschreibt die Figur.
  - Größen: Kachel `TS = 32`. Figuren im Stil R (`fig5.js`, Standard) sind 40×56 Pixel; Stil D ist eingefroren, Stil F aus.
  - Neue Aussehens-Felder müssen in `SPEC_KEYS` stehen, sonst greift der Bild-Cache nicht.
  - Gesten sind Mischposen in `fig5.js` `rigS`/`rigW` (`ANIM_DEFS.gesture` in `anim.js`). Die Palette steht je Spec im Code.
- **Kunst-Werkzeuge:** Gezeichnet wird mit Code (Canvas-Raster). Für Vorschauen dienen Browser-Screenshots über die Browser-Werkzeuge. Plugins sind erlaubt, siehe oben.
- **Speichern/Laden:**
  - `localStorage`, Format RFZ1 (gzip, 15 Bit je Zeichen) mit Slots (`setSlot`). Der Legacy-Slot heißt `rotfall.legacy.save`, die Sicherung `rotfall.backup.s14c`.
  - Was die Schlüssel in `SKIP` nennen, wird nie gespeichert.
  - Neue Felder müssen fehlen dürfen; Migration in `continueGame()` und `ensure*()`.
  - Flüchtige Gruppen tragen `transient: true` und werden von `ensure*()` neu gebaut.
- **Bruchstellen:**
  - `game.js` ist riesig. Gezielte Edits mit eindeutigen Ankern; nie Code hinter `//` in derselben Zeile.
  - Zeilenenden: `game.js` und `sim.js` haben CRLF, die übrigen Dateien LF. Das Hilfsskript `scratchpad/ed.py` bewahrt sie.
  - Weltgenerierung: `rnd()` in `world.js` nicht verändern, sonst verschiebt sich die Welt.
  - Proben hängen am Zufall; neue `rnd()`-Aufrufe können fremde Proben kippen.
  - Cache-Schlüssel `?v=23` überall gleich halten (inklusive `coop.js` `VER`).
  - Koop: Der Wirt rechnet alles.
  - Ein [VERIFIED]-Commit schiebt `main` öffentlich (GitHub, Hook). Die übrigen Commits gehen nur auf `claude-arbeit`.

## 3. Team
| Agent | Modell | Aufwand | Rolle |
|---|---|---|---|
| Director | Fable 5.1 (Hauptsitzung) | hoch | Entwickler, Plan, Welt, Delegation |
| Scout | Sonnet | mittel | Ideen sammeln, kurze Rangliste |
| Designer | Opus 5.5 | hoch | Vorschläge, nie Code |
| Engineer | Opus 5.5 | mittel | Umsetzung, Bugs |
| Artist | Opus 5.5 | mittel | Sprites, Animation, VFX, Szenen-Regie, UI-Look |
| Verifier | Sonnet | mittel | prüft fremde Arbeit, repariert nichts |

- Alle Unteragenten laufen dauerhaft parallel (Entwickler 01.10.2026, ersetzt die Grenze von zwei).
- Hinweis: Die Hauptsitzung lief beim Wechsel noch auf Opus 5.5. Den Wechsel auf Fable 5.1 macht der Entwickler in der Modellwahl der App.
- Bis dahin übernimmt die Hauptsitzung die Rolle Director plus Engineer: Sie schreibt den Code selbst und gibt die Prüfung an den Verifier.

## 4.–9.
Rollenbeschreibungen, Freigabe, ehrliches Berichten, Sparsamkeit mit Kontext und Prioritäten (Korrektheit > Entwicklerdesign > Konsistenz > Test > Tempo > Token) gelten wörtlich wie in der Anweisung des Entwicklers.

Ein Unteragent bekommt einen Brief mit:
- Ziel, Kriterium für „fertig“, bereits Bekanntes
- erlaubte und gesperrte Dateien
- Vorgaben aus `docs/ENTSCHEIDUNGEN.md`
- Form der Rückgabe

Er gibt zurück: was getan wurde, was er gefunden hat, welche Dateien sich geändert haben, was wie geprüft wurde, was UNVERIFIED blieb, und offene Fragen.

Status: IDEA → PROPOSED → WAITING_FOR_DEVELOPER → APPROVED → IN_DEVELOPMENT → IMPLEMENTED → VERIFIED (dazu BLOCKED, DEFERRED, REJECTED).

---

# C — Master-Arbeitsregeln (Teil A des alten MASTER_ROADMAP)

Stand: 2026-09-30. Vom Nutzer als verbindliche Arbeitsgrundlage übergeben. Diese Datei ist die Referenz für Claude und seine Agenten. Die Statustabelle der laufenden Pakete steht weiter in `PLAN_S15.md`; der Ist-Zustand des Codes in `IST_ZUSTAND.md`.

## Teil A — Arbeitsregeln (vor jeder Implementierung)

### A.0 Reihenfolge
1. Verfügbare Skills auflisten, relevante Skill-Anweisungen lesen und anwenden (Repository-Analyse, Coding, Architektur, Testing, Debugging, UI, Dokumentation, Performance, Agentenarbeit).
2. Verfügbare Plugins und Integrationen prüfen und einsetzen (Code-Analyse, Dateien, Browser-/UI-Tests, Debugging, Testing, Subagenten, Dokumentation).
3. `docs/IST_ZUSTAND.md` lesen, danach die echte Repository-Struktur analysieren. Prüfen, welche dort als offen bezeichneten Systeme inzwischen teilweise oder ganz existieren. Die Doku ist nicht automatisch der aktuelle Stand.
4. Vorhandene Systeme wiederverwenden: erst nach Funktionen, Modulen, Events, State-Strukturen, UI-Komponenten und Debug-Funktionen suchen. Existiert ein System: erweitern statt duplizieren. Keine parallele zweite Implementierung.
5. Erst danach den Implementierungsplan erstellen.

Arbeitsreihenfolge: Plugins/Skills/Tools prüfen → Projekt analysieren → bestehende Systeme prüfen → Abhängigkeiten planen → implementieren → mit Agenten testen → Fehler beheben → erneut testen → erst dann als fertig markieren.

### A.1 Agenten-Regel
- Höchstens 3–4 Opus-5.5-Agenten für komplexe Aufgaben: Architektur, große Systemintegration, Save-/State-Migration, komplexe Gameplay-Systeme, schwierige Regressionen, finale Gesamtprüfung.
- Sonnet-Agenten für einfache, klar abgegrenzte Aufgaben: kleine Code-Reviews, UI-Checks, Testfälle, Referenzsuche, einfache Regressionstests, Datenprüfungen, Dokumentation, kleine Bugfixes, Performance-Smoke-Tests.
- Nicht für jede Kleinigkeit Opus verwenden.

### A.2 Pflicht vor der Implementierung
Die Agenten stellen zuerst fest: Was existiert bereits? Was ist nur dokumentiert? Was ist teilweise implementiert? Was ist kaputt? Was fehlt vollständig? Welche Systeme hängen voneinander ab? Welche Features müssen zuerst gebaut werden? Welche Änderungen könnten Savegames brechen? Welche bestehenden Systeme dürfen nicht überschrieben werden?

### A.3 Definition of Done
Ein Feature ist erst fertig, wenn es implementiert, integriert, getestet, gespeichert, geladen, auf Fehlerzustände geprüft, auf Regressionen geprüft und bei Bedarf über Debug-Funktionen reproduzierbar getestet wurde. Zusätzlich (Teil C §42): UI vorhanden, Debug-Test vorhanden, mindestens ein Sonnet-Testagent hat geprüft, bei komplexen Features ein Opus-Review, keine doppelten Systeme, keine kaputten Referenzen, keine undefined-/NaN-Probleme, Performance geprüft, Mobile/Touch soweit relevant geprüft, bestehende Mechaniken funktionieren weiter.

---

# D — Balance-Regeln für neue Inhalte

Kurz und praktisch: Wer eine Waffe, Rüstung, einen Gegner oder Boss einbaut, hält sich an diese Bänder und misst danach
mit `RF.simFight`. Hintergrund und Messwerte: Anhang von `docs/IST_ZUSTAND.md`. Alle Formeln stehen in `src/game.js` (damageOf, armorOf,
hit, hurt, spawnEnemy, levelUp).

## 1. Formeln, die man kennen muss

| Was | Formel |
|---|---|
| Heldenschaden je Hieb | `(Waffe.dmg × (0,55 + 0,45 × Zustand) + F × Tempo) × Mult.` |
| Fester Anteil F | `Attribut × 0,35 + Übung × 0,22 + Stufe × 0,35` (Stärke im Nahkampf, Beweglichkeit im Fernkampf); ≈ 5 (St. 1), 23 (St. 15), 41 (St. 30) |
| Tempo-Faktor | Nahkampf `clamp(speed / 600, 0,6, 2)`, Fernkampf 1 |
| Takt (Zeit je Angriff) | Nahkampf `speed`; Bogen `speed × 1,15`; Armbrust/Gewehr `max(speed, 0,42 × speed + reload)` |
| Rüstung gegen Hieb | Schaden − 0,55 × Rüstung (Geschoss: − 0,5 × Rüstung × (1 − AP)); mindestens 1 |
| Gegnerrüstung | Gefahr (`threat`) × 1,6 (Geschoss × 1,2) |
| Gegnerleben | `m.hp × (1 + 0,04 × Stufe) × BAL.hp (1,7)` (Boss zusätzlich × BOSS.hp) |
| Gegnerschaden | `m.dmg × (1 + BAL.lvl (0,06) × Stufe) × BAL.dmg (1,4)` (Boss zusätzlich × BOSS.dmg) |
| Heldenleben | `40 + Ausdauer × 4 + Stufe × 6`; der Balken (Kopf + Rumpf) ist ≈ 45 % davon, am Boden bei Rumpf 0 |
| Menschenähnliche Gegner | haben Trefferzonen: tot, wenn der Rumpf leer ist — effektiv ≈ 45 % ihres Lebens |
| Schwierigkeit | Angsthase ×0,75 Leben / ×0,7 Schaden, Sehr schwer ×1,25 / ×1,3 (über `BAL`) |

## 2. Waffen

**Dauerleistung** = `(dmg + F × Tempo) / Takt`. Zielbänder (Nahkampf, Stufe 15 / 30):

| Seltenheit | Schaden (1H / 2H) | DPS St. 15 | DPS St. 30 | Wert (Gold) |
|---|---|---|---|---|
| gewöhnlich | 5–10 / 6–14 | 50–60 | 80–90 | 15–50 |
| ungewöhnlich | 9–14 / 15–20 | 55–62 | 85–92 | 75–170 |
| selten | 12–16 / 17–26 | 56–64 | 87–94 | 190–300 |
| episch | 16–18 / 25–28 | 60–68 | 90–98 | 320–520 |
| legendär | 18–27 / 27–34 | 62–68 | 92–100 | 520–1200 |
| mythisch (nie zufällig) | ~26 | ≤ 82 | ≤ 112 | ≥ 900 |

Faustregeln:
- **Schneller heißt nicht stärker.** Wer die Schwungdauer halbiert, halbiert auch den Schaden (der Tempo-Faktor gleicht F aus).
  Schwungdauer: Dolch 300–380, Einhand 460–860, Zweihand 900–1300 ms.
- **Ausdauer je Hieb** ≈ `speed / 60` (Dolch 4–5, Schwert 8–9, Zweihänder 18–24). Dauerleistung über ~17 Ausdauer/s
  erschöpft (Erholung ≈ 12–13/s im Stand) — so gewollt für schwere Waffen.
- **Reichweite** (px): Dolch 26–30, Schwert/Axt 34–50, Zweihand 44–58, Speer/Stange 70–90. Mehr Reichweite = Takt
  +10–20 % oder Schaden −10 %.
- **Durchschlag (AP)**: 0–0,3 normal, 0,4–0,6 für Kolben/Hammer/Picke (dafür −10–15 % DPS), ≥ 0,7 nur episch+ oder
  Gewehre.
- **Sondereigenschaften** (crit ×2,2–2,6 nur Rückenstich, sweep, flail, crush, bleed, bind, execute) kosten 5–10 % DPS.
- **Fernwaffen liegen unter dem Nahkampf**: Wurf/Schleuder 40–45, Bögen 38–42, Armbrust 20–30 (dafür AP, große
  Einzeltreffer) bei Stufe 15. Nie über 45.
- **Magitech**: Energie je Schuss so, dass eine Zelle (30 Gold) 4–20 Schuss hält; DPS mit Zellen ≤ Langbogen + 5.
  Spezialwirkung (Streuung, Durchschlag, Lähmung, Brand) statt mehr DPS. Rangsperre (`mtier`) für starke Gewehre.
- Rechne neue Waffen mit dem Ausdruck aus dem Balance-Anhang von `docs/IST_ZUSTAND.md` Kap. 3 gegen und vergleiche mit dem Nachbarn gleicher Art.

## 3. Rüstungen

| Seltenheit | Brust | Kopf | Hände/Beine/Füße | Schild (block) | Wert |
|---|---|---|---|---|---|
| gewöhnlich | 1–6 | 2–4 | 1–2 | 1–2 (0,24–0,3) | 8–90 |
| ungewöhnlich | 7–11 | 4–5 | 2–3 | 4 (0,42) | 60–260 |
| selten | 12–15 | 7–9 | 4–5 | 6 (0,58) | 160–460 |
| episch | 15–18 | 9–10 | 4–5 | — | 400–800 |
| legendär | 19–24 | 10–12 | — | — | 900–2600 |

- **Gewicht (`slow`)**: Brust ab 11 Rüstung 0,04–0,13 (je +2 Rüstung über 11 etwa +0,02), Turmschild 0,22. Ohne `slow`
  darf eine Brust höchstens 10 haben.
- Gesamtrüstung einer vollen Ausrüstung: St. 5 ≈ 10, St. 10 ≈ 25, St. 15 ≈ 30, St. 20 ≈ 45, St. 30 ≈ 60–65 (inkl.
  Stufe × 0,25). Mehr als 70 macht normale Gegner harmlos.
- Klassenrüstung (Todesritter, Mönch …) bleibt unter der Handelsrüstung gleicher Seltenheit; sie trägt Klassenboni.

## 4. Gegner

- **Ziel auf gleicher Stufe:** 2–6 Treffer mit typischer Waffe, 10–30 % Lebensverlust (Spieler rollt nicht), bis 50 % für
  „harte“ Arten (Gefahr 3). Schwarmgegner (Gefahr 1) 1–3 Treffer, < 10 %.
- **Grundwerte je Gefahr** (`threat`): 1 → hp 22–46, dmg 6–11; 2 → hp 36–62, dmg 9–14; 3 → hp 50–150, dmg 13–18;
  4 → hp 170–340, dmg 17–24 (Elite, selten); Schützen hp ×0,7, Schaden wie Nahkämpfer, Takt ≥ 1500 ms.
- **Wucht gegen Zeit:** hoher Schaden → langsamer Angriff (atk ≥ 1300) und/oder Ansage (`telegraph` 450–800 ms).
  Ohne Ansage höchstens dmg 14.
- **Stufe** kommt aus dem Gebiet (`ZONE`, Deckel 50). Nicht an `BAL.lvl` drehen, um einen einzelnen Gegner zu stimmen —
  das ändert alle.
- Sonderregeln (körperlos, Schild vorn, Lebensraub) brauchen einen sichtbaren Hinweis und einen Konter.

## 5. Bosse

- `MONSTERS.x.boss = true` → automatisch **BOSS.hp ×2, BOSS.dmg ×0,6** (`src/game.js`). Werte in data.js also als
  „Grundboss“ eintragen: hp 220–620, dmg 18–30.
- **Ziel:** 40–180 s bei empfohlener Stufe und Ausrüstung, echte Gefahr (40–80 % Lebensverlust mit Rollen und
  2–3 Tränken), Sieg für einen geschickten Spieler ≥ 2 von 3.
- **Phasen** bei 50 % und 25 % (bzw. 66/33 %); jede Phase ändert das Verhalten, nicht nur die Zahlen. Kurze
  Unverwundbarkeit beim Phasenwechsel ≤ 1,1 s. Verstärkung höchstens 2–3 Gegner, Stufe Boss − 4.
- **Jeder schwere Angriff hat eine Ansage** (≥ 500 ms) und ist ausweichbar; Einzeltreffer ≤ 60 % des Balkens bei
  empfohlener Stufe.
- **Empfohlene Stufe** = Bossstufe + 0…2 (Garmadon, Dodon, Weißbart derzeit 22–25). In Dialog/Gerücht nennen.
- **`bossScale:false`** nur für Heeresschlachten mit Verbündeten (Omega). Regionalbosse (`REGION_BOSSES`) setzen `hp`
  und ggf. `dmg` (Wuchtfaktor) selbst; `BOSS` gilt trotzdem.
- Menschenähnliche Bosse sterben am Rumpf (≈ 45 %) — dafür hp +30–40 % ansetzen.

## 6. Stufen und Erfahrung

- `MAX_LEVEL = 60`. Kurve: ×1,35 bis Stufe 10, ×1,2 bis 20, ×1,04 danach (≈ 0,42 Mio. EP bis 60).
- EP je Kill = `m.xp + Stufe × 2`. Richtwerte `m.xp`: Gefahr 1 → 6–16, 2 → 20–40, 3 → 45–120, 4 → 120–180,
  Boss 180–900, Omega 3000. Auftragsbelohnung ≈ 3–8 gleichwertige Kills.
- Neue Gebiete: Levelspanne aus `ZONE` wählen, nicht neue Spannen über 50 erfinden.

## 7. Talente und Statpunkte

- `TALENT_EVERY = 2` (Entwickler 02.10.2026): 1 Punkt zum Start + 1 je gerader Stufe + 1 je bestandener Klassenprüfung
  (`clsPass`), rückwirkend für alte Stände (`talentTopUp`, nie weniger als vorher) = 31 + Prüfungen bei Stufe 60.
  Ziel: 50–70 % der Sterne, die **eine typische Figur erreichen kann** (Wanderer + eine Klassenlinie mit Folgeklasse + ein
  Titel, ohne ausgeschlossene Schlüsselsterne) — nicht aller Sterne aller Klassen. Probe „Höchststufe 60“ misst genau das.
- Klassen-Sternbilder: Wertesterne wirken immer und bleiben klein (unten); Schlüssel- und Fähigkeitssterne wirken nur bei
  aktiver Klasse. Machtgrenze je Sternbild: höchstens so viel Dauerleistung wie heute der volle Kampfzweig (mit `RF.simFight`
  messen, Option `tree`/`cls`/`useAb`).
- Kleine Knoten: +5–8 % (Schaden, Leben), +2 Rüstung, +10–15 Ausdauer. Schlüsselknoten: stark, aber mit Preis
  (Berserker: +15 % eingesteckt) oder Ausschluss (`excl`).
- Statpunkte: 1 je Stufe + 1 je 5 Stufen (71 bis 60). Ein Punkt ist ≈ 0,35 Schaden je Hieb bzw. 4 Leben.

## 8. Affixe, Sets, Legendäre

- **Affixe** (Spannen in `AFFIXES`): Schaden/Zauber/Fernkampf ≤ +14 %, Tempo ≤ +12 %, Krit ≤ +7 %, Durchschlag ≤ +25 %,
  Rüstung ≤ +3, Leben ≤ +7 %. Spielverändernd (`major`, nur episch, eins je Stück): Lebensraub ≤ 8 %, Dornen ≤ 25 %.
- **Anzahl**: ungewöhnlich 1, selten 2, episch 3 (1 major), legendär 2 + Sondereffekt. Mythisch nie zufällig.
- **Summe über alle Teile**: Schaden aus Affixen+Set ≤ +40 %, Lebensraub gesamt ≤ 10 %, Tempo ≤ +25 %.
- **Sets**: 2 Teile ≤ +6 Rüstung und ≤ +12 % Schaden (oder +35 % gegen eine Art); 3/4 Teile zusammen ≤ +5 Rüstung,
  ≤ +20 % Blocken, ≤ +8 % Leben, ≤ 3 % Lebensraub.
- **Legendäre Sondereffekte** (`LEGENDS`): wirken bedingt (Todesstoß, Chance, < 30 % Leben), nie dauerhaft +X %.
- Fundchance (`RARITY_DROP`): 62/24/10/3,5/0,5 % — nicht erhöhen, lieber Gefahr-Bonus des Fundorts nutzen.

## 9. Preise (value)

Faustregel `value ≈ Grundwert der Seltenheit × Stärke im Band`: gewöhnlich 15–60, ungewöhnlich 60–260, selten
190–460, episch 320–1000, legendär 520–2600. Magitech +50 % (Kristall), Munition/Zellen 30 je Füllung. Verbrauch
(Trank 55) so, dass ein Bosskampf mit 3 Tränken ≤ 10 % des Gelds auf der empfohlenen Stufe kostet.

## 10. Checkliste „Bevor du etwas Neues einbaust“

1. Ins Band einordnen (Tabellen oben): Seltenheit, Stufe, Nachbar gleicher Art.
2. Dauerleistung/Takt/Ausdauer ausrechnen (Waffe) bzw. Treffer bis Tod und Schaden je Treffer (Gegner) bei Zielstufe.
3. Hat es eine Sonderregel? Dann Konter, Hinweis im Spiel (Regel „Explain to player“) und −5–10 % auf die Zahlen.
4. Mit `RF.simFight` messen (unten): 3–6 Läufe, beide Spielweisen.
5. Nichts verschlechtert die Nachbarn? Kein Gegenstand dominiert seine Art in allen Werten.
6. Boss: Zielzeit 40–180 s, empfohlene Stufe notieren; `bossScale` bewusst setzen.
7. Selbsttest laufen lassen (alle PASS), `docs/MECHANIKEN.md` und den Balance-Anhang in `docs/IST_ZUSTAND.md` nachtragen.

## 11. Messen mit RF.simFight (nur `?dev`)

```js
// Held Stufe 15 mit Zweihänder und Schuppenpanzer gegen Rotgardist Stufe 15, geschickter Spieler
RF.simFight('rotgardist', { level: 15, weapon: 'greatsword',
  gear: { chest: 'scale_mail', head: 'iron_helm', feet: 'iron_boots' }, elvl: 15, mode: 'smart', seed: 1 });
// → { win, dead, sec, hpLost, ehpLeft, dealt, rolls, potsUsed, pdmg, parmor, php, swings, landed, tiredS, cells }
```

- Optionen: `level, weapon, gear{slot:key}, attrs, skill, elvl` (Gegnerstufe), `ehp` (Grundleben, z. B. Regionalboss),
  `eopt` (Felder für spawnEnemy, z. B. `{ boss: true, rboss: 'sandlord', dmgMul: 1.8 }`), `mode: 'smart' | 'stand'`,
  `nododge`, `pots` (Heiltränke), `cells` (Energiezellen), `maxT` (ms, Standard 180 000), `boss: { hp, dmg }`
  (BOSS probeweise ändern), `diff` (Standard „schwer“), `flags` (z. B. `{ goblinsFreed: false, garmFight: true,
  vargChallenged: true, morrHostile: true }`, sonst sind manche Gegner neutral).
- Mehrere `seed`s mitteln; Kämpfe mit Verstärkung sind für die Nachbildung schwer (Werte eher zu pessimistisch).
- Dauerleistung einer Waffe: Attrappe mit viel Leben und ohne Schaden, `dealt / 30`:
  `RF.simFight('bear', { level: 15, weapon: 'mace', elvl: 15, ehp: 4000, eopt: { dmgMul: 0.01, provoked: true }, maxT: 30000 })`.
- Sicherheit: vor jedem Neuladen den Spielstand aus der Sicherung zurückschreiben
  (`localStorage.setItem('rotfall.legacy.save', localStorage.getItem('rotfall.backup.s14c'))`); simFight selbst setzt
  Welt, Ruf und Flaggen zurück.

---

# E — Spec Welt, Tutorial, NPC & Content (08.10.2026)

Kurzliste des Entwicklers (wörtlich sinngemäß):
- Ein richtiges Tutorial, das den Spieler einmal an die Hand nimmt.
- Mehr Haus-Variation: in Schmieden richtige Öfen sehen, Waffen/Rüstung kaufen; Prinzip auf andere Gebäude übertragen.
- Quests werden langweilig → immer gleiche Gegner.
- Mehr Gegner-Variation: anderes Aussehen, mehr Sprites, mehr Banditen-Arten, auch Goblins.
- Häuser richtig orientiert (Tür zur Zugangsrichtung); Haus leicht durchsichtig, wenn man seitlich/dahinter steht.
- Niemanden durch Wände treffen können.
- Das Missionsfenster soll ein GUI haben.
- Im eigenen Betrieb selbst arbeiten; sehen, wie Leute in Betrieben arbeiten und wie Kunden hineingehen und kaufen.

## 1 Grundidee
Die Welt existiert nicht nur für den Spieler: Menschen leben, Familien wohnen zusammen, Geschäfte werden betrieben, Arbeiter arbeiten, Kunden betreten Läden, Märkte sind soziale Treffpunkte, nicht jeder NPC hat eine Quest, kein Gebäude ist nur Kulisse, Städte sind sinnvoll geplant, NPC-Dichte passt zur Gebäudegröße, Gegner und Quests sind abwechslungsreich, der Spieler kann zuerst beobachten. Nicht überladen — **Qualität und Glaubwürdigkeit vor Quantität.**

## 2 Erst Repository analysieren (Pflicht)
Struktur, CLAUDE.md, docs/IST_ZUSTAND.md, alle Roadmap-/Plan-/Feature-Dokumente; prüfen was umgesetzt, teilweise, veraltet, doppelt, offen ist; bestehende Systeme wiederverwenden. **Keine zweite parallele Implementierung.**

## 3–5 Dokumentationsbereinigung
Alle Docs (docs/, ROADMAP*, PLAN*, TODO*, FEATURE*, DESIGN*, Notizen, Audits, Agenten-Dokumente) nach Inhalt prüfen und kategorisieren:
A relevant · B teilweise umgesetzt · C vollständig umgesetzt · D veraltet · E Duplikat · F temporär.
Danach **ein zentrales Dokument** für alle noch offenen Punkte (Features, Teilfeatures, Verbesserungen, Designentscheidungen, Abhängigkeiten, UI/UX, Content, NPC, Simulation, Quests, Gegner, Gebäude, Tutorial, Performance, Save, Tests) — aktueller tatsächlicher Stand, nicht zusammenkopiert.

## 6–9 Tutorial
Kurze spielbare Einführung statt Popups: Welt, Bewegung, Interaktion, Kampf, Loot, NPCs, Händler, Quests, Gebäude, Motivation — erlebt, nicht gelesen.
**Einflug nach ROTFALL:** kurze Szene aus der Distanz auf die Region (Landschaft, Straßen, Stadt/Landmarken, Reisende, Karawanen, Siedlung) → „Ich betrete eine existierende Welt.“
**Ziele:** keine „Gehe zu A“, sondern Denkansätze (Stadt in der Ferne, Schmiede, Straße mit Reisenden, gefährliches Gebiet, Markt, Taverne, Ruine, Fraktion, Händler, Ereignis) → „Was interessiert mich?“ ROTFALL gibt Möglichkeiten, keine Questliste.
**Keine Informationswand:** kontextbezogen (Schmiede betreten → Schmied arbeitet → beobachten → sprechen → Händler-UI → nur das Nötige erklären). Gleiches bei Kampf, Loot, Quest, Markt, Reisen, Gebäuden, NPCs, Betrieben.

## 10–12 Quest-System
Weniger „gehe → töte → zurück“. Zieltypen: Kampf (töten, vertreiben, verfolgen, Anführer, Lager zerstören, Gefangene befreien) · Erkundung (Ort finden, Ruine, Geheimnis, Gegenstand, NPC suchen) · Transport (Waren, Nachricht, Verletzte eskortieren, Karawane) · Soziales (überzeugen, Streit lösen, Informationen, Handel vermitteln, Schuld eintreiben) · Wirtschaft (Material, Betrieb unterstützen, Lieferung sichern, Produktionsproblem, Händler schützen) · Weltgeschehen (Angriff abwehren, Flüchtlinge, Stadt bei Ereignis, Überfall verhindern, Fraktionsereignis) · Geheimnisse (Gerücht, versteckter Eingang, alte Maschine, geheimer Händler, verlorener Ort).
Quests derselben Region nicht immer dieselben Gegner: Straßenräuber, Späher, Bogenschützen, Plünderer, Söldner, Anführer, schwer gepanzert, Fallensteller, Reiter, Heiler, Spezialisten — **Aussehen, Verhalten, Ausrüstung, Rolle unterscheiden sich**, nicht nur Werte.

## 13–16 Gegner-Overhaul
Banditen-Varianten (Späher, Bogenschütze, Plünderer, Schläger, Söldner, Anführer, Fallensteller, Reiter, schwerer Bandit, Dolchkämpfer) und Goblin-Varianten (Krieger, Speerträger, Bogenschütze, Schamane, Plünderer, Berserker, Späher, Anführer, Techniker, Fallensteller, Sklave, Arbeiter) mit eigenem Sprite/Ausrüstung/Körperform/Helm/Kleidung/Waffe/Verhalten/Animation/Rolle. Eine Variante ist erst neu, wenn mindestens eines sichtbar anders ist (Sprite, Kleidung, Rüstung, Waffe, Silhouette, Animation, Verhalten). Elites/Bosse dürfen VFX und Sonderanimationen haben.
Gegner-Scaling als Ganzes prüfen (früh/mittel/spät, Dungeons, Bosse, Begegnungen, Questgegner, Elites, Tiere, Soldaten; HP, Schaden, Rüstung, Tempo, Angriffsrate, Fähigkeiten, Anzahl, Level-Scaling, Loot, XP, Belohnungen). Gefahr ohne reine Zahleninflation.

## 17–20 Städte, Dichte, Performance
Keine 100 NPCs auf einem Punkt. Marktplätze skalieren: größerer Platz, mehrere Plätze (Hauptmarkt, Handwerk, Lebensmittel, Händler, Hafen, Nachbarschaft), zeitliche Verteilung (morgens Arbeiter/Händler/Bauern, mittags Kunden/Reisende/Handwerker, abends Tavernen). Bewegungsströme Haus→Arbeit→Markt→Haus/Taverne/Kirche/Werkstatt; Reisende→Gasthaus; Wachen→Straßen.
Simulation nach Nähe: Nahbereich voll (Bewegung, Animation, Interaktion, Arbeit, Gespräche, Käufe, Türen, Kämpfe) · Mittelbereich vereinfacht (Position, Arbeit, Ziel, Zustände) · Fernbereich abstrakt (Arbeitsplatz, Zuhause, Reise, Konsum, Tagesablauf, Stadtwerte); Rekonstruktion bei Annäherung.

## 21–25 Wohnraum und Familien
Haus erklärt, warum die Bewohner dort wohnen (nicht drei NPCs in einem Haus mit einem Bett). Wohnkapazität: klein 1–2 (1 Schlafzimmer), mittel 2–4 (mehrere Schlafplätze, Küche, Wohnbereich), groß 4–8 (mehrere Zimmer, ggf. Arbeitsbereich), Familienhaus (Eltern, Kinder, ggf. Großeltern, Familienbereich). Echte Familien (verbundene NPCs, nicht nur Nachname), sichtbar: gemeinsam im Haus, essen, Kinder folgen Eltern, arbeiten, Markt, schlafen, auf Gefahr reagieren, miteinander sprechen. Häuser spiegeln Familien (Betten, Kinderbett, Tisch, Räume, Küche, Gegenstände, Spielzeug, Werkzeuge). Kette: NPC-Daten → Familie → Wohnraum → Gebäude → Tagesablauf.

## 26–32 Gebäude und Betriebe
Gebäude zeigen, was darin passiert. **Schmiede:** Ofen, Feuer, Amboss, Werkbank, Werkzeuge, Waffen, Rüstungen, Rohmaterial, Metall, Lager, Schmied arbeitet (Hammer, Feuer, Funken, Rauch, Bewegung). Als Betrieb: kaufen, reparieren, beobachten, Kunden kommen und kaufen, Mitarbeiter arbeiten. Prinzip auf Bäckerei, Taverne, Schneiderei, Apotheke, Werkstatt, Stall, Händler, Bionik-Werkstatt übertragen.
Betriebe als soziale Räume: Kunde betritt → Verkaufsbereich → Mitarbeiter reagiert → kauft → Ware weg → verlässt → Mitarbeiter arbeitet weiter (vereinfacht, sichtbarer Eindruck zählt).
**Spieler arbeitet selbst im eigenen Betrieb** (Schmiede, Werkstatt, Taverne, Händler, Farm, Bäckerei, Alchemie, Bionik): arbeiten, produzieren, Kunden bedienen, Aufträge, Mitarbeiter beobachten, Produktion kontrollieren. Spielerbetrieb lebt sichtbar (Mitarbeiter holt Metall, einer am Ofen, Kunde kommt, schaut, kauft; Spieler produziert).

## 33–35 Gebäude-Orientierung und Transparenz
Tür passt zur Zugangsrichtung; jedes betretbare Gebäude: Eingang, Richtung, Innen-/Außenposition, Zugangspunkt, Exit. NPCs nutzen den echten Eingang. Steht der Spieler seitlich/hinter einem Gebäude → 40–60 % transparent, positionsabhängig, nicht dauerhaft.

## 36–37 Kein Treffer durch Wände
Nahkampf, Projektile, Fähigkeiten, Magie, Fernkampf, AOE, NPC-Angriffe. Zentrale Hindernis-/Sichtlinienprüfung (Angreifer → Richtung → Hindernis → erreichbar? → Hit), keine Einzellösungen je Waffe.

## 38–39 Quest-GUI
Richtiges Fenster: Name, Geber, Beschreibung, aktuelles Ziel, Fortschritt, Belohnung, Ort, Status, optionale und erledigte Ziele (Häkchen-Liste). Bestehende UI-Architektur. Nicht alles verraten — nur, was die Figur wissen kann.

## 40–47 NPC-Verteilung, Questdichte, soziale Räume, Stadtplanung
Nicht jeder NPC eine Quest (Beispiel 20 NPCs: 3 Questgeber, 5 Händler/Mitarbeiter, 4 Familie, 3 Wachen, 2 Reisende, 2 Bürger, 1 Story-NPC; dynamisch je Stadt). Normale Menschen arbeiten, kaufen, essen, schlafen, reden, Kinder, Taverne, Wache. Questgeber nicht nur per Symbol: Dialog, Gerücht, beobachtbares Verhalten, Gespräch zwischen NPCs („Die Karawane ist immer noch nicht zurück.“). Stadt: 3–5 relevante Questgeber + viele normale NPCs + Gerüchte + Betriebe + Händler + Familien + Aktivitäten. Welt ohne Quest interessant (Schmied arbeitet, Kind läuft zur Mutter, Laden öffnet, Wache wechselt, Karawane kommt, Kunde kauft, Arbeiter trägt, Familie isst, Reisender sucht Gasthaus, Betrunkener streitet, Bandit kontrolliert). Treffpunkte: Markt, Taverne, Brunnen, Tempel, Schmiede, Hafen, Tor, Handwerksviertel, Wohnviertel, Handelsstraße, Nachbarschaftsplatz, Trainingsplatz. Stadtplanung funktional prüfen (Größe/NPC, Straßenbreite, Platzgröße, Türen, Laufwege, Viertel, Dichte).

## 48–49 Skalierung und Performance
Welt (NPCs, Gegner, Gebäude, Animationen, Partikel), Stadt (je Viertel/Platz, aktive NPCs, Wegfindung), Kampf (Gegner, Projektile, AOE, Partikel, Hit Detection), UI (Listen, Inventare, Shops). Erst Culling, LOD, vereinfachte Simulation, Tick-Raten, Pathfinding, Events, Animationen, Partikel, Rendering, Kollision — nicht NPCs entfernen.

## 50 Priorität
P0 Spielerlebnis: 1 Tutorial neu · 2 Einflug/Intro · 3 erste Wege/Ziele · 4 Quest-GUI · 5 Wand-Hit · 6 Gebäude-Eingänge.
P1 Weltqualität: 7 NPCs ohne Quest · 8 Rollen · 9 Haus/NPC · 10 Familien · 11 Wohnraum · 12 Marktplätze · 13 Dichte.
P2 Betriebe: 14 Schmieden · 15 Öfen/Ambosse/Waren sichtbar · 16 Kunden · 17 Mitarbeiter · 18 weitere Betriebe · 19 Spieler arbeitet.
P3 Content: 20 Gegner-Variationen · 21 Banditen · 22 Goblins · 23 Sprites · 24 Animationen · 25 Quest-Variationen · 26 Wiederholung reduzieren.
P4 Technik: 27 Scaling-Audit · 28 NPC-Simulation · 29 Marktplatz-Performance · 30 Hit Detection · 31 Save/Load · 32 Regression.

## 51 Testfälle
Tutorial (Start, Intro, Einflug, Orientierung, abschließbar, kein Softlock, Speichern/Laden, nicht mehrfach) · NPCs (ohne Quest, arbeitet, schläft, besucht Betrieb, kauft, findet Haus/Arbeit) · Familien (gespeichert, wohnen zusammen, Schlafplätze, Darstellung, Tod ohne kaputte Referenzen) · Gebäude (Eingang = Sprite, NPC nutzt Tür, betretbar, transparent, keine Wanddurchquerung) · Kampf (Nah-/Fernkampf/Magie/AOE/NPC nicht durch Wände) · Betriebe (Mitarbeiter, Kunden, Waren, Spieler arbeitet, Save/Load) · Städte (keine 100 auf einem Punkt, begehbar, verteilt, Performance) · Quests (GUI, Fortschritt, Belohnung, Typen, weniger Wiederholung).

## 52–53 Definition of Done / keine Oberflächlichkeit
Fertig = Repo-Stand analysiert, wiederverwendet, keine Dublette, UI falls relevant, Save/Load, Edge Cases, Performance, Regression, unabhängiger Testlauf, Debug, kein undefined/NaN. Falsch: nur ein Amboss-Sprite, nur Nachnamen, nur höhere Werte, nur ein Fenster mit zehn Texten.

## 54–55 Gesamtziel und Ablauf
„Was passiert hier eigentlich?“ statt „Wer hat eine Quest?“ — Welt → Situation → Interesse → Quest. Ablauf: Analyse → Docs → Ist-Stand → zentrale Roadmap → alte Docs weg → Abhängigkeiten → kleine Pakete → testen → Regression. Reihenfolge: Tutorial → Quest/UI → NPC/Gebäude → Stadt/Familie → Betriebe → Gegner/Quest-Content → Scaling → QA. Art-Direction bleibt, keine Neuentwicklung, nichts Funktionierendes entfernen.

---

# F — Spec Progression, Skills & Grind (08.10.2026)

## Ziel
Mehr langfristige Beschäftigung und freiwilliger Grind: „Ich mache das jetzt eine Weile, weil ich darin besser werden will.“ Inspiration: Stardew Valley (Farming, Fischen, Sammeln, Handwerk, Tagesaktivitäten, Berufe), Kenshi (Fähigkeiten steigen durch Nutzung, Spezialisierung, Training), RPG/MMO (Skill Trees, Meisterschaften, Perks), ROTFALL selbst (Permadeath, Simulation, Fraktionen, Verletzungen, Wirtschaft, Betriebe). Kein Stardew-Klon; ROTFALL bleibt dunkles Fantasy-RPG.

## 1–3 Grundprinzip
Benutzung → Erfahrung → Skill steigt → neue Möglichkeiten → bessere Ergebnisse → Spezialisierung → Meisterschaft. Der Charakter verändert sich wirklich (neue Angriffe, Combos, Recovery, Konter, Spezialangriffe, Reichweite, Ausdauer, Animationen, Haltungen, Skill-Punkte), nicht nur +5 %. Skills steigen durch Tätigkeit (Katana, Stange, Bogen, Schmieden, Fischen, Holzfällen, Bergbau, Kochen, Landwirtschaft, Alchemie). **Keine stumpfen Level:** jedes größere Level eröffnet etwas (Beispiel Holzfällen 1 normale Bäume · 5 schneller · 10 härtere Hölzer · 15 Spezialmaterial · 20 seltene Bäume · 30 alte/magische · 40 Hölzer für Top-Ausrüstung · 50 Meister).

## 4 Skill-Menü
Richtiges Fenster: Skill, Level, Fortschritt, nächste Freischaltung, aktive/passive Boni, Spezialisierungen, Meisterschaften, Perks, Ziele (Beispiel Katana 27, 72 %, Boni, nächste Freischaltung Level 30 „Gegenhieb“, Spezialisierung Schneller Kämpfer/Präzision/Duellant).

## 5–6 Kategorien
Kampf (Schwerter, Katanas, Äxte, Hämmer, Speere, Stangen, Dolche, Bögen, Armbrüste, Magie, Schilde, ggf. Magitech) · Handwerk (Schmieden, Rüstungsschmieden, Holz, Schneiderei, Alchemie, Kochen, Bionik, Magitech) · Überleben (Fischen, Jagen, Sammeln, Holzfällen, Bergbau, Kochen, Kräuterkunde) · Soziales/Wirtschaft (Handel, Verhandeln, Führung, Reputation, Betriebe, ggf. Glücksspiel). Waffen-Skills je Gruppe, nicht je Einzelwaffe.

## 7–12 Waffen-Skills
Steigen durch Kampf; XP hängt an Gegnerstärke, Treffer, Einsatz, Schwierigkeit, Risiko, Gegnerlevel — kein Farmen an harmlosen Gegnern. Skill verändert den Kampfstil (Katana: 5 Ausweichangriff, 10 Gegenangriff, 15 Dash Slash, 20 Parierfenster, 25 Spezialcombo, 30 Konter, 40 Meistertechnik, 50 Meisterschaft; passend zur bestehenden Mechanik). Kenshi-Prinzip: gut in dem, was man tut (Speer 42 / Katana 8). Keine harte Bestrafung: jederzeit wechseln, parallel steigen, mehrere Waffen beherrschen, Meisterschaft braucht Zeit. Meisterschaften selten und wertvoll (Anforderung Skill 50 + Herausforderungen; Haltung, Animation, Combo, Fähigkeit, kleiner Bonus). Grind-Ebenen: kurz (10 % bis Level), mittel (Level 20 → Angriff), lang (Meister), Endgame (einzigartige Technik).

## 13–16 Fischen
Echtes Minisystem: auswerfen, warten, Biss, Timing, Fisch zieht, Spannung, reagieren, fangen. Höherer Skill: Ruten, Köder, größere/seltenere Fische, Fangrate, Gewässer, Arten, Materialien. Fischarten je Gewässer (Fluss Forelle/Lachs/Hecht; See Karpfen/Barsch; Sumpf Sumpffisch/giftig/Monsterfisch; Küste Meeresfische; besondere Gebiete magische/Tiefen-/Kristall-/Legendenfische). Progression 1/5/10/15/20/30/50. Verwendung: Kochen, Alchemie, Medizin, Buff-Food, Quests, Tierfutter, Materialien, Handel.

## 17–21 Holz, Bergbau, Sammeln, Kräuterkunde, Jagen
Holzarten (normal, hart, alt, selten, magisch, Aurelion-Material); Mining-Ressourcen (Stein, Kohle, Eisen, Kupfer, Silber, Gold, seltene Erze, Kristalle, magisch) — tiefer = besser, dazu Fallen, Höhlen, Monster, Funde, Ruinen (Mining = Exploration). Sammeln unterwegs (Kräuter, Pilze, Beeren, Blumen, seltene Pflanzen, Tiermaterial, Kristallsplitter). Kräuterkunde als Skill (erkennen, Ausbeute, verstecktes, giftig, selten) → Alchemie → Tränke → Medizin. Jagen aktiv (Spuren, Lebensraum, Verhalten, Flucht, Tageszeit; verfolgen, Fallen, Bogen; Fleisch, Leder, Knochen, Fell, seltenes).

## 22–25 Kochen, Farming
Kochen mit Skill und entdeckbaren Rezepten (Händler, NPCs, Bücher, Tavernen, Reisen, Experimentieren, Familien, Fraktionen); Gerichte mit Effekten (Regeneration, Ausdauer, Tempo, Wärme, Resistenz, XP, Heilung, Buffs); besser = Qualität, stärker, länger, teurer, selten. Farming klein (Farm besitzen, anbauen, ernten, Tiere, Ressourcen; Getreide, Gemüse, Kräuter, Heil-, seltene, magische Pflanzen) mit Zeit, Wasser, ggf. Dünger, Boden, Saison/Wetter; Ertrag nach Skill, Werkzeug, Saatgut, Boden, Wetter; an Siedlung/Betriebe anbinden.

## 26–30 Handwerk, Qualität, Spezialisierungen, Skill Tree
Schmieden 1/10/20/30/40/50 (einfach → Qualität → Waffenarten → hochwertig → Spezialmaterial → Meisterschmied). Qualitätsstufen schlecht/normal/gut/sehr gut/hervorragend/Meisterwerk, nicht rein zufällig (Skill, Material, Werkzeug). Spezialisierungen (Schmieden → Waffen/Rüstung/Spezial → Schwer/Platten/Magitech; Fischen → Profiangler/Tiefenfischer/Händler; Katana → Duellant/Schnell/Konter). Skill Tree mit großen Entscheidungen (Tempo/Konter/Reichweite → Combo/Riposte/Dash), nicht 100 ×1 %. **Kein Power-Creep** (Level 50 nicht 500 % Schaden).

## 31–37 Grind-Qualität
Spaß durch Animationen, Interaktionen, Ressourcen, Gebiete, Werkzeuge, Fähigkeiten, Rezepte, Ausrüstung, Orte, NPCs. Werkzeugstufen (Axt, Spitzhacke, Angel: einfach → gut → Stahl → hochwertig → besonders) beeinflussen Tempo, Ausbeute, Erreichbares, Haltbarkeit; Werkzeug und Skill getrennt (Skill 30 + schlechte Axt = schlechte Effizienz). Ressourcen mit echter Wirtschaft (Holz → Bretter → Gebäude; Eisen → Metall → Waffe → Kunde; Fisch → Gericht → Buff). Grind mit Welt verbinden (Mine: Erz, Bergarbeiter, Höhle, Goblins, Gerücht, seltenes Erz, Schmied, Waffe, Kampf). Zufallsereignisse beim Sammeln (Mining: seltene Ressource, Höhle, Monster, Einsturz, Fund · Holz: Tier, Fund, Banditen, seltenes Holz, altes Lager · Fischen: seltener Fisch, Fund, Schatz, Monster, NPC · Jagd: seltenes Tier, Raubtier, Spur, verletztes Tier, Wilderer). Grind fördert Exploration (seltene Fische wo? Kristalle wo? schwarzes Holz im Norden).

## 38–40 Permadeath, Legacy, Speicherung
Charakterbezogen (Waffen-Skills, Kampfmeisterschaften, Talente) stirbt mit der Figur; weltbezogen (Rezepte, Materialien, Gebäudetechnik, Betriebswissen, Weltwissen) kann über die Legacy weiterbestehen — exakt ans bestehende Legacy-System anpassen, **kein zweites Progressionssystem daneben.** Beispiel: Meisterschmied stirbt; Welt kennt Schmiede, Rezepte, Meisterwerke, Lehrlinge, Ruf; Nachfolger startet nicht mit Schmieden 50. Speicherung zentral (skills, skillXP, specializations, masteries, toolProgression), keine verstreuten Werte.

## 41–43 Anti-Grind, Diminishing Returns, keine Energy Bars
Keine Exploits (Holz respawnen und hacken; schwachen Gegner anschlagen/weglaufen). Wiederholung am selben Ort sinkt in Effizienz; neue Region = neue Ressourcen. Ausdauer nur, wo sinnvoll.

## 44–49 Tagesablauf, Skill-Hubs, Trainer, Bücher, Herausforderungen, Geschichten
Was mache ich heute (Schmiede, Auftrag, Fischen, Taverne, Erkundung). Städte als Hubs (Zwerge: Bergbau/Schmieden; Küste: Fischen/Handel/Schiffe; Wald: Holz/Kräuter/Jagd; Aurelion: Bionik/Magitech). Trainer vermitteln Techniken, Wissen, Rezepte, Trees (Voraussetzung z. B. Katana 20 + Quest), nicht „10 Gold → +1“. Bücher schalten Rezepte, Ressourcen, Training, Geheimnisse frei (keine +1000 XP). Meisterschafts-Herausforderungen (Duellant ohne Schild, legendärer Fisch, Meisterwaffe aus seltenem Material, Tiefenmine, seltenes Tier). Skills erzeugen Geschichten (guter Schmied → Händler, Adel, Fraktionsauftrag, Banditen-Überfall, Bedeutung des Betriebs).

## 50–54 UI, Benachrichtigung, Animation, Audio, Debug
Hochwertiges Skill-Fenster (Icons, Level, Balken, Freischaltungen, Spezialisierungen, Meisterschaften, Boni, Ziele) in ROTFALL-Art-Direction. Level-Up-Meldung nur bei Meilensteinen (KATANA LEVEL 20 — NEUE TECHNIK Gegenhieb). Höhere Skills nutzen das Animations-Overhaul (Angriffe, Übergänge, Spezialangriffe, Werkzeuge, Fischen, Schmieden). Audio (Werkzeuge, seltene Ressourcen, Meisterangriffe, seltene Fänge). Debug: Set Skill Level, Add XP, Unlock Perk/Mastery, Spawn Resource/Fish/Rare Ore, Give Tool, Reset Skill.

## 55 Tests
Kampf (Katana/Speer-XP, unabhängig, Wechsel, Meisterschaften) · Gathering (Holz, Bergbau, Fischen, Kräuter, Jagd) · Crafting (Schmieden, Qualität, Rezepte, Material) · Save/Load (alles, alte Stände) · Permadeath (Tod, Behandlung, Legacy, keine Dubletten).

## 56–58 Reihenfolge
Phase 1 Skill Core (SkillDefinition, Level, XP, Milestones, Perks, Masteries) mit 2–3 Skills · Phase 2 Combat (Katana, Schwert, Speer/Stange, Bogen) · Phase 3 Gathering (Fischen, Holz, Bergbau, Sammeln) · Phase 4 Crafting (Schmieden, Kochen, Alchemie) · Phase 5 Spezialisierungen · Phase 6 Meisterschaften · Phase 7 Weltintegration (NPCs, Händler, Betriebe, Quests, Fraktionen, Wirtschaft, Städte, Ressourcen, Legacy). Bestehendes prüfen und erweitern (XP, Level, Combat, Weapons, Crafting, Inventory, NPC, Quest, Save, UI). Nicht 20 Skills auf einmal: Core → Katana → Fischen → Schmieden → Test → Architektur → skalieren.

## 59–61 Definition of Done, Endziel, Leitsatz
Fertig = Skills steigen durch Nutzung, XP skaliert, keine Exploits, neue Möglichkeiten, Trees, Spezialisierungen, Meisterschaften, UI, Save/Load, Permadeath/Legacy, nichts beschädigt, Performance, Debug, End-to-End-Test. Endziel: persönliche Geschichte über Fähigkeiten („miserabler Holzfäller, später Schmied, starb als Katana-Meister“). **Der Spieler soll nicht leveln, um spielen zu dürfen — er soll spielen und dadurch besser werden. Grind erzeugt Möglichkeiten, Orte, Fähigkeiten, Geschichten.**

---

# G — Combat Animation Overhaul (02.10.2026)

Ziel ist nicht „mehr Animationen“, sondern dass **jede Waffenart sich deutlich anders spielt** und der Kampf lebendiger, wuchtiger, hochwertiger wirkt. Inspiration aus hochwertigen Action-RPGs/MMOs nur für Animationstiefe, Timing, Lesbarkeit, Impact, Combat Feel — keine Kopien. Es gilt das Feature Readiness Gate (GATE.md).

1. **Grundprinzip:** eigene visuelle Identität je Waffenart (Langschwert ≠ Axt mit anderem Sprite; Speer ≠ Schwert; Dolch schnell und aggressiv; Großschwert langsam, schwer, wuchtig; Sense große breite Bewegungen; Stäbe/Magie völlig andere Bewegungslogik).
2. **Animationsprofil je Waffenart** nach Analyse des Waffensystems — mindestens: Langschwert, Großschwert, Axt, Großaxt, Streitkolben, Hammer, Speer, Stangenwaffe, Dolch, Doppelklingen, Sense, Bogen, Armbrust, Stab, magische Waffen, Bosswaffen, Unikate, plus alle weiteren im Projekt (Peitsche, Flegel, Wurfwaffen, Faustwaffen, Feuerwaffen …).
3. **Vollständiges Set je Waffenklasse (je nach Waffe):** Idle (normal, Kampf, seltene kleine Bewegungen) · Bewegung (Laufen, Kampfbewegung, Sprint, rückwärts, Richtungswechsel) · Angriff (1, 2, 3, optional 4, Finisher, schwerer Angriff) · Defensive (Block, Parade, Ausweichen, Trefferreaktion) · Treffer (leicht, schwer, kritisch, Rückstoß, Taumeln) · Tod (normal, schwer, ggf. speziell).
4. **Combo:** Angriff 1 → 2 → 3 → Finisher als zusammenhängende Bewegung, nicht drei einzelne GIFs.
5. **Gewicht sichtbar:** Dolch extrem schnell, kurze Bewegungen, wenig Erholung · Langschwert kontrolliert, klare Bögen, mittlere Erholung · Großschwert langsam, große Körperbewegung, starke Beschleunigung, deutliche Erholung, enormer Impact · Hammer sehr langsam, starke Ausholbewegung, hoher Impact, Gegnerreaktion · Speer Reichweite, Stöße, Vorwärtsbewegung, Distanzkontrolle · Sense breite Bögen, starke Rotation, großer Flächeneindruck.
6. **Flashy durch Animation + Timing + Impact + VFX**, nicht durch Partikel-Spam: Ausholen (Anticipation) → schneller Schlag → Impact-Frame → Schlageffekt → kleines Wackeln → Trefferreaktion → kurze Erholung.
7. **Impact synchronisiert:** Hit-Stop, Screen Shake, Rückstoß, Treffer-Blitz, Partikel, Schlageffekte, Klang, Funken, Bodenreaktion, Krits — ein schwerer Hammer deutlich stärker als ein Dolch.
8. **Drei Prototyp-Packs zuerst:**
   - **A Grounded RPG:** wenig Partikel, starke Körperbewegung, klare Waffenbögen, Gewicht und Schwung, deutliche Erholung, kontrollierte Effekte („hochwertiges klassisches Action-RPG“).
   - **B Heroic Fantasy:** größere Bewegungen, schnellere Combos, stärkere Schlageffekte, mehr Körper, größere Finisher, stärkerer Impact, mehr VFX („mächtiger Fantasy-Held“).
   - **C Extreme Endgame:** extrem schnelle Combos, große Bögen, Dash-Angriffe, Nachbilder, starke Hit-Stops, Wackeln, große Impact-Effekte, besondere Finisher, kombinierte VFX („komplett overpowered — und man sieht es“; besonders für spätes Endgame).
9. **Erst testen:** nur Langschwert, Großschwert, Dolch, Speer, Hammer — je alle drei Packs. Dazu ein **Combat Test Room**, in dem der Spieler zwischen Pack A/B/C wechseln kann.
10. **Danach ausrollen:** Was funktioniert, was ist zu langsam/übertrieben/schwer lesbar/inkompatibel mit dem Sprite-System → finalen ROTFALL-Stil festlegen (Entwickler) → alle Waffen überarbeiten.
11. **Waffenidentität:** keine Copy-Paste-Animationen; man soll die Waffe an der Bewegung erkennen.
12. **Bosswaffen:** dürfen eigene Angriffe, Finisher, VFX, Treffer, Idle, Combo haben — nur wo es Mehrwert bringt.
13. **Magie:** eigenes Profil — Wirken, Aufladen, Loslassen, Geschoss, Einschlag, Kanalisieren, Zauber-Combo, besondere Ultimate/Finisher; darf visueller sein.
14. **Animation = Gameplay:** Ausholen → Hitbox aktiv → Schaden → Erholung; Hitbox/Schaden nie schon während der sichtbaren Vorbereitung.
15. **Leistung:** Sprite-Anzahl, Frames, VFX, Partikel, Wackeln, Nachbilder, viele NPCs, große Kämpfe — besonders Städte, große Ereignisse, Bosse, viele Gegner (Ziel 3 ms je Bild bleibt).
16. **Bestehendes System nicht zerstören:** Sprite-, Animations-, Kampf-, Waffen-, Hitbox-, VFX-, Entity-System, Rendering, Steuerung erst analysieren; bestehende Infrastruktur erweitern, kein paralleles zweites Animationssystem.
17. **Vollständigkeitsprüfung je Waffenpaket:** Idle, Bewegung, Angriff, Combo, schwerer Angriff, Finisher, Trefferreaktion, Block, Ausweichen, Tod, VFX, Klang, Hitbox, Schadenszeitpunkt, Animationszeit, Gegnerreaktion, Koop/Gruppe, Save/Load falls relevant; alte Animationen suchen, die den Stil brechen.
18. **Qualitätsziel:** nicht „neue Sprites animiert“, sondern „ROTFALL hat ein richtiges Combat-System“ — Gewicht, Geschwindigkeit, Reichweite, Charakter je Waffenklasse.
19. **Nicht blind umsetzen:** bei wichtigem Designproblem STOPP und dokumentieren (Problem, Systeme, Lösungen, Risiken, architekturverträgliche Variante); keine Workarounds.
20. **Abschluss:** alle Waffenklassen, Packs vergleichen, finalen Stil bestimmen, Combos, Bosse, viele Gegner, große Kämpfe, Leistung, Hitboxen, Synchronität, Regressionen testen.

Leitsätze: Dolch fühlt sich schnell an. Großschwert gewaltig. Speer kontrolliert Distanz. Hammer schlägt ein. Sense reißt den Raum auf. Im Endgame darf der Kampf eskalieren.
Werkzeuge: alles im Code gezeichnet (Sperre für SpriteCook/pixel-plugin/Aseprite/bezahlte Generatoren bleibt).

---

# H — Visueller Umbau (02.10.2026)

**Problem:** Viele Bereiche sind zu stark textbasiert und wirken wie ein Prototyp. Ziel: ROTFALL soll sich wie ein vollständiges, lebendiges RPG anfühlen; Text nur dort, wo er wirklich sinnvoll ist. Leitfrage bei jeder Überarbeitung: „Wie kann der Spieler das verstehen oder spüren, ohne einen Absatz Text lesen zu müssen?“ Am bestehenden Projekt weiterarbeiten, nichts neu anfangen, keine Systeme unnötig ersetzen. Prinzip bleibt: „Dein Charakter kann sterben. Deine Geschichte nicht.“

## 1. Inspiration (nur UX, Präsentation, Animation, Game-Feel — nichts kopieren)
WoW, Diablo, Path of Exile, Guild Wars 2, ESO, FFXIV, Runescape, Albion, Terraria, Stardew Valley, RimWorld, Kenshi, Mount & Blade, Darkest Dungeon, Hades, klassische JRPGs, moderne Indie-RPGs. Untersuchen: Wie werden Informationen, Quests, NPC-Interaktionen, Items, Tooltips, Dialoge, Treffer/Fähigkeiten/Status, Welt-Ereignisse, wichtige NPCs, Shops/Inventare, Questannahme/-abschluss, Karten/POIs, Bosskämpfe, Animationen/VFX und Feedback ohne Text dargestellt?

## 2. Pflichtablauf je wichtigem Text-Element
1. Aktuelles Problem benennen · 2. passende Inspiration · 3. **10 deutlich verschiedene Varianten** (nicht nur Farbe/Layout) · 4. je Variante kurze Idee · 5. bewerten, was am besten zu ROTFALL passt · 6. beste Variante umsetzen · 7. bei mehreren guten: beste Eigenschaften kombinieren.
Beispiel Questboard: klassisches Board · Holzbrett mit Zetteln · animiert · NPC-Verwalter · Stadtkarte mit Missionen · Fraktionsboard · schwarzes Brett mit Steckbriefen · animierte Pergamente · Quest-Terminal für Aurelion · Hybrid Board + Weltkarte.

## 3. Bereiche (Auszug der Vorgaben)
- **Dialoge:** Sprechblasen, Porträts, animierte Box, NPC reagiert körperlich, leichter Kamerazoom bei wichtigen Gesprächen, normale vs. Story-Dialoge unterschiedlich, Emotes/Gesten, kurze Szenen.
- **Quests:** Annahme, Board, Tracker, Ziele, Fortschritt, Abschluss, Belohnung, Marker, Welt-Ereignisse — möglichst in der Welt (Symbol über dem Geber, visueller Tracker, Orte markiert, besiegte Gegner zählen sichtbar, Abschluss-Animation).
- **NPCs:** Blasen, Gesten, Blickrichtung, Idle, Reaktionen auf Spieler/Kampf/Tod/andere NPCs, Gruppenverhalten, wichtige NPCs hervorheben.
- **Items:** Karten, Tooltips, Seltenheit, Präsentation, Drop-Animation, Loot-Popups, Vergleich, Stat-Vorschau, Set/Affix.
- **Kampf:** Treffer, Schadenszahlen, Krits, Status, Ausweichen/Block/Parade, Fähigkeiten, Abklingzeiten, Ausdauer, schwere Angriffe mit Ansage, Bossmechaniken, Tod, Trefferreaktionen — durch Animation, VFX, Klang, nicht Text.
- **Welt:** Wetter, Tageszeit, Feuer, Rauch, Partikel, Tiere, NPC-Tätigkeiten, Händler, Streifen, Reisende, Karawanen, Fraktionskämpfe, Zufallsereignisse, Belagerungen, Überfälle, Rettungen, Welt-Ereignisse.
- **Städte:** Markt, Händler, Schmiede, Tavernen, Boards, Wachen, Bürger, Kinder, Arbeiter, Tiere, Streifen, Fraktionspräsenz, Tagesläufe, Hinweise auf wichtige Gebäude.
- **Shops:** Händlerdialog, Warenpräsentation, Kauf/Verkauf, Vergleich, Geldanimation, seltene Ware, Händlerreaktionen.
- **Inventar:** Slots, Kategorien, Sortierung, Tooltips, Drag & Drop, Vergleich, Rüstungsübersicht, Charakterdarstellung, Item-Animationen.
- **Skilltree:** Knoten, Verbindungen, Freischalt-Animation, Hover, Vorschau, Abhängigkeiten, Klassenidentität, passiv/aktiv.
- **Karte:** Städte, Dungeons, Quests, NPCs, Karawanen, Fraktionen, Ereignisse, Unbekanntes, Spielerposition, POIs — informativ, nicht überladen.
- **Animationen:** Idle, Laufen, Angriff, Treffer, Tod, Interaktion, Gesten, UI, Loot, Quest, Level-Up, Skill-Freischaltung, Welt-Ereignisse, kurze Szenen — gezielt, nicht hektisch.
- **Visuelle Hierarchie:** auf einen Blick: wichtig, anklickbar, Quest, Händler, wichtiger NPC, Beute, Gefahr, Fähigkeit, Welt-Ereignis, Fraktion — nicht nur über Text.
- **Stil:** ROTFALL bleibt dunkel, detailliert, atmosphärisch, eigenständig; keine Low-Detail-/Block-Sprites; bestehende Charakterdesigns beibehalten und verbessern. Rüstungen variieren: beschädigt, sauber, improvisiert, schwer, leicht, Fraktion, selten, einzigartige Bossrüstung; klare Silhouetten.
- **Game-Feel-Beispiele:** „Der Gegner ist verwundet“ → sichtbar; „Quest abgeschlossen“ → kleine visuelle Bestätigung; „Boss benutzt schweren Angriff“ → telegrafiert; „NPC ist wütend“ → NPC reagiert.

## 4. Priorität
1 Dialoge · 2 Quests · 3 NPC-Interaktionen · 4 Kampf-Feedback · 5 Items/Beute · 6 Inventar · 7 Shops · 8 Skilltree · 9 Karte · 10 Städte · 11 Welt-Ereignisse · 12 allgemeine UI · 13 Animationen/VFX · 14 sonstige Textsysteme. Danach selbst weitere Prototyp-Stellen suchen.

## 5. Erst analysieren, dann umsetzen
Spiel analysieren → alle text-/statischen Elemente listen → je Element 10 Varianten → Inspiration → Auswahl → (Feature Readiness Gate, ROTFALL_STATE/GATE.md: Impact Report, offene Entscheidungen) → umsetzen → im Spiel testen → prüfen, ob es wirklich besser aussieht und sich besser anfühlt → Schwaches überarbeiten. Keine blind eingeführten UI-Systeme; alles passt zum bestehenden Gameplay.

## Hinweis zu Werkzeugen
Die Nachricht nennt die Skills spritecook-animate-assets und pixel-art-creator. Laut Entscheidung des Entwicklers („Alte Sperre bleibt“: kein SpriteCook, keine bezahlten Bildgeneratoren, kein pixel-plugin, kein Aseprite) wird weiter alles im Code gezeichnet — bis der Entwickler die Sperre ausdrücklich aufhebt.

## Ablage
Analyse und Varianten (historisch, Commit c21fd64): `ROTFALL_STATE/visual/<bereich>.md` (Problem, Inspiration, 10 Varianten, Bewertung, Wahl, Impact Report, offene Entscheidungen). Bilder: `ROTFALL_STATE/visual/img/`.

---

# I — Animations-Referenz (Techniken anderer Spiele → Regeln)

Zweck: keine Assets kopieren, sondern **Techniken** verstehen, mit denen Spiele ohne 3D und mit wenigen Frames Gewicht, Schmerz und Drama erzeugen — und daraus konkrete, im bestehenden Renderer umsetzbare Regeln für ROTFALL ableiten.

Technische Basis (Ist-Zustand, siehe `src/fig5.js`, `src/sprites.js`, `src/game.js`):
- Figuren sind **code-gemalte** 40×56-Pixelraster (Stil R), keine Frame-Sheets. Jede Pose ist eine Funktion von Gelenkwinkeln (`rigS`/`rigW`), nicht ein gezeichnetes Bild.
- Posen-Satz (`poseOf`, `paintR`): `i0/i1` (Atmen), `w0..w3` (Gehen), `hit`, `kb` (Rückstoß), `guard`, `cast`, `trade`, `carry`, `kneel`, `search`, `sit`, `die1`, `tuck`, `down`, `dead`.
- Schwungkurven (`swingOf` in `fig5.js`) unterscheiden Stoßwaffen (Dolch, Rapier, Speer: zurückziehen → vorschnellen → einholen) von Wucht-Waffen (Schwert, Axt, Keule, Hammer, Zweihänder, Stangenwaffe: Ausholen → Schlag → Nachschwung, bei `v===2` Überkopfhieb).
- Bereits vorhandenes Trefferfeedback (`game.js`): Hit-Stop (`hitStop`, Welt friert kurz ein), Kamerawackeln (`camShake`), weißer Blitz-Silhouette (`flashOf` in `sprites.js`), Rückstoß-Vektor (`c.kb = {x,y,t,T}`, klingt über `t/T` ab).
- Ein Waffen-„Gefühl“ existiert schon als Tabelle `FEEL` (`game.js` Z. 2772–2781): Gewicht, Hit-Stop-Dauer, Kamerawackeln, Ausfallschritt, Taumelwert je Waffentyp — das ist die reale Grundlage, auf der dieses Dokument aufbaut, nicht ein Neuentwurf.
- Verfügbare Transformationen für eine 40×56-Figur: Rumpf hoch/runter (`by`), Kopf-Offset (`hx/hy`), seitliche Neigung (`lean`), Rocksaum-/Umhangschwung (`sw`/`cs`, eine Phase verzögert = sekundäre Bewegung), IK-Arme/Beine, Gliedmaßen-Stümpfe (`limbSt`), Farbblitz, Kamera-Punch (`R.cam.punch`).

Diese Liste ist die Leitplanke für alles Folgende: Empfehlungen bleiben im Rahmen von Winkel, Versatz, Stauchung, Blitz, Drehung — keine Empfehlung setzt Frame-Sheets oder gezeichnete Einzelbilder voraus.

---

## 1. Referenzspiele — was sie technisch tun

### 1.1 Kenshi
Kenshi zeigt Kampf mit sichtbar wenigen, harten Übergängen: Ausholen, Treffer, Trefferreaktion sind einzelne, deutlich unterscheidbare Posen ohne weiche Zwischenbilder — Wucht kommt aus dem harten Schnitt, nicht aus Interpolation. Verletzungen sind strukturell sichtbar (Humpeln, fehlender Arm ändert die Kampfpose dauerhaft), nicht nur kosmetisch. Das deckt sich mit ROTFALLs eigenem `limbSt`/Stumpf-System — Kenshi bestätigt, dass dauerhafte Körper-Zustandsänderung mehr Wucht trägt als ein einmaliger Trefferframe.

### 1.2 RimWorld
RimWorld verzichtet fast vollständig auf Kampfanimation und erzählt Gewalt stattdessen über Text-Log, Farbmarkierung (Blut-Overlay) und Konsequenz (Narbe, Behinderung, Tod als Objekt in der Welt). Design-Philosophie von Tynan Sylvester: Grafik ist Trägermedium für Vorstellungskraft, nicht Ersatz dafür — „RimWorld has graphics like a novel has a typeface“. Für ROTFALL heißt das: nicht jeder Treffer braucht ein aufwendiges visuelles Ereignis; der Kombattext/Float-Text (`float()`) trägt einen Teil der Lesbarkeit, die Animation nur den Rest.

### 1.3 Hyper Light Drifter
Extrem sparsame Palette an Frames pro Aktion, dafür jede Aktion mit klarer Lesbarkeit aus der Silhouette: Wischschlag ist ein Bogen aus 2–3 Posen, kein Zwischenschritt. Weltdesign ohne Text verlangt, dass jede Handlung optisch eindeutig ist — das erzwingt starke Posen-Extreme statt vieler mittlerer Frames. Übertragbares Prinzip: lieber 3 sehr unterschiedliche Posen (Ausholen weit zurück, Treffer weit vorn, Nachschwung sichtbar überschossen) als 6 ähnliche.

### 1.4 Dead Cells
Dead Cells baut Treffergefühl aus Schichten, die einzeln billig sind, gemeinsam aber „Juice“ ergeben: Hit-Stop, Partikel, leichte Verzerrung/Screenshake, Soundtreffer exakt synchron zum Aufprallframe. Wichtig: die Schichten sind **additiv und unabhängig** — Hit-Stop kostet keine Grafik, Screenshake keine Animation. ROTFALLs `hitStop`/`camShake`/`flashOf` sind genau diese Art von billigem, additivem Layer und sollten konsequent pro Waffenklasse skaliert bleiben statt situativ Sonderfälle zu bekommen.

### 1.5 Hades
Hades nutzt Kamera aktiv als Erzählmittel: kurzer Zoom/Fokus beim Betreten eines Boss-Raums, spürbarer, aber kurzer Kamera-„Punch“ bei kritischen Treffern, Zeitlupen-Momente bei besonderen Fähigkeiten. Die Kamera bleibt sonst ruhig und nah — Dramatik wird durch das seltene Abweichen vom Normalzustand erzeugt, nicht durch Dauerbewegung. ROTFALL hat mit `R.cam.punch` (bei kritischen Treffern) bereits genau diesen Hades-Mechanismus; er sollte gezielt auf wenige Momente (Boss-Intro, kritischer Treffer, Vollendungsschlag) beschränkt bleiben, damit er wirkt.

### 1.6 Darkest Dungeon
Darkest Dungeon inszeniert Kampf fast ohne echte Bewegungsanimation: Kamera zoomt kurz auf den Treffer, Ziel wird farbgetönt (rot für Gegner, cyan für Verbündete bei kritischen Treffern), leichte Kamera-Neigung bei Krits. Die Dramatik kommt aus Stillstand + Fokuswechsel + Farbe, nicht aus Bewegung des Charakters selbst. Für ROTFALLs Figurengröße (40×56 Pixel, aus der Distanz gesehen) ist das direkt anwendbar: ein kurzer Farbstich (die vorhandene `flashOf`-Silhouette) plus Mikro-Zoom bei kritischen Treffern trägt mehr als ein zusätzlicher Animationsframe.

### 1.7 Stardew Valley
Stardew Valley kommt mit nur 4 Frames je Laufzyklus aus (Kontaktpose, Passierpose, Kontaktpose Gegenseite, Passierpose), jeweils rund 200 ms gehalten — bei kleiner Pixelgröße reicht das für einen glaubwürdigen Gang. Übertragbares Maß: bei kleinen Sprites braucht ein Laufzyklus keine feineren Zwischenschritte als 4 Phasen; ROTFALLs `w0..w3` deckt das bereits exakt ab.

### 1.8 Enter the Gungeon
Schnelle, eindeutige Ausweichrolle mit kurzer Unverwundbarkeit, stark überzeichneter Bewegungsspur, knappe, aber klare Wiederherstellungsphase danach (Landung, kurze Verwundbarkeit). Übertragbares Prinzip: eine Ausweich-/Rollbewegung braucht drei klar getrennte Phasen (Anlauf/Absprung, Flug mit visuellem Trail, Landung mit kurzem Nachwippen) und darf nicht symmetrisch „rein/raus“ wirken.

### 1.9 Blasphemous
Blasphemous zeigt, dass sehr aufwendige, gliederweise animierte Pixelkunst am oberen Ende der Skala steht (viele Handframes, keine Code-Generierung) — für ROTFALLs code-gemalten Ansatz nicht direkt übertragbar in der Machart, wohl aber im Prinzip: Hinrichtungs-/Tötungsmomente sind bewusst als **eigenständige, seltene Sondersequenz** inszeniert (kurze Verlangsamung, harter Schnitt, expliziter Moment), nicht als Variante der normalen Trefferanimation. Für ROTFALL: ein „Gnadenstoß“ (siehe `game.js`, `Gnadenstoß durch …`) verdient eine eigene, kurze Kamera-/Zeit-Behandlung, keine Wiederverwendung des normalen Hit-Stops.

### 1.10 Fear & Hunger
Dread entsteht hier fast ausschließlich aus **Weglassen**: minimalistischer Sound, lange Stille, keine beschwichtigende Musik, harte Kontraste zwischen ruhigen und plötzlich brutalen Momenten. Übertragbares Prinzip für ROTFALLs Totenland/Grimdark-Ton: nicht jeder Tod muss spektakulär sein — ein *plötzlicher*, fast beiläufiger Tod (kein Screenshake, kein Partikelfeuerwerk, nur ein Geräusch und Stille danach) wirkt in einem grimdark Setting oft bedrohlicher als ein aufwendiger.

### 1.11 Chrono Trigger (JRPG-Dialoginszenierung)
Ältere JRPGs wie Chrono Trigger inszenieren Dialoge trotz technischer Beschränkung dramatisch durch: feste Kamera mit klarer Rahmung der Sprecher, kurze Pausen vor wichtigen Zeilen, Sprite-„Reaktionsposen“ (Kopf hoch, Schultern zurück) statt vollständiger Neuanimation, und Stille/Musikwechsel als Szenenmarker. Übertragbares Prinzip für ROTFALLs Dialogsystem: eine Reaktionspose (z. B. `guard`/`hit`/eigene Kopf-Offsets) beim entscheidenden Dialogsatz plus kurzer Musik-/Soundbruch ersetzt eine aufwendige Kamerafahrt vollständig.

---

## 2. Übertragbare Kernprinzipien (Zusammenfassung aus 1.1–1.11)

| Prinzip | Kern | Quelle(n) |
|---|---|---|
| Hit-Stop als billigster Wucht-Kauf | 40–120 ms Einfrieren der Welt bei Aufprall verkauft Gewicht besser als jede Zusatzanimation | Dead Cells, allgemeine „Juice“-Literatur |
| Additive, unabhängige Schichten | Hit-Stop, Shake, Flash, Sound je einzeln schaltbar/skalierbar, nicht aneinander gekoppelt | Dead Cells, Vlambeer „Art of Screenshake“ |
| Seltene Abweichung wirkt stärker als Dauereffekt | Kamera bleibt neutral, Zoom/Punch nur bei Boss-Intro, Krit, Finisher | Hades, Darkest Dungeon |
| Wenige, extreme Posen statt viele mittlere | 3 klar unterscheidbare Extremposen lesen sich aus der Ferne besser als 6 ähnliche Zwischenframes | Hyper Light Drifter |
| Struktureller statt kosmetischer Schaden | Dauerhafte Zustandsänderung (Humpeln, verlorenes Glied, Blutstufe) trägt mehr als ein einmaliger Trefferframe | Kenshi, RimWorld |
| Weglassen als Stilmittel | Nicht jeder Tod braucht Spektakel; Stille nach einem Treffer kann bedrohlicher sein als Effekt-Feuerwerk | Fear & Hunger |
| Sondermomente verdienen Sonderbehandlung | Hinrichtung/Finisher/Boss-Tod bekommen eigene, kurze Inszenierung statt Wiederverwendung der Standardreaktion | Blasphemous |
| Kleine Sprites brauchen keine feinen Zwischenschritte | 4 Phasen reichen für einen glaubwürdigen Laufzyklus bei kleiner Pixelgröße | Stardew Valley |
| Reaktionspose statt Kamerafahrt | Ein Pose-/Sound-Wechsel im Dialog ersetzt eine Kamerabewegung | Chrono Trigger |
| Ausweichen braucht drei Phasen | Absprung, Flug mit Spur, Landung mit Nachwippen — nie symmetrisch | Enter the Gungeon |

---

## 3. Vorgeschlagene Animationstimings für ROTFALL

Basis ist die bestehende `FEEL`-Tabelle (`game.js`). Die folgenden Werte sind **Verfeinerungen/Ergänzungen**, keine Konkurrenz dazu — `stop`, `shake`, `lunge`, `stag` bleiben die maßgeblichen Werte im Code; hier werden zusätzlich Anticipation/Recovery-Anteile und Idle/Walk-Timings benannt, die im Code bislang implizit über `swingDur` und die Phasenschwellen in `swingOf`/`phaseOf` laufen.

### 3.1 Idle und Gehen (posenunabhängig von Waffe)

| Zustand | Dauer/Takt | Technik im Renderer |
|---|---|---|
| Idle-Wippen (`i0`↔`i1`) | 1200–1600 ms je volle Phase (langsam, kaum wahrnehmbar) | `by`-Versatz ±1 Pixel, keine Armänderung |
| Gehen (`w0..w3`) | 4 Phasen × 130–160 ms = 520–640 ms je Schrittzyklus | Bein-IK je Phase, `sw`/`cs` eine Phase verzögert (sekundäre Bewegung, wie Stardew/Kenshi-Prinzip: 4 Phasen genügen) |
| Rennen/Kampfhaltung (`guard`) | wie Idle, aber `by` konstant abgesenkt (−1), keine Wippen-Phase | Signalisiert Anspannung ohne Zusatzframe |

### 3.2 Angriffe je Waffenklasse

`w0` ist der Gewichtswert aus `FEEL`; Spalten sind Anteile der Gesamtschwungdauer `swingDur` (siehe `swingOf`/`phaseOf`: `wind` bis Schwelle `w0`, `strike` bis 0,5, `follow` bis 0,82, danach Rückkehr in Ruhehaltung).

| Waffenklasse | `w0` (Gewicht) | Ausholen (Anteil) | Treffer-Fenster | Nachschwung (Anteil) | Hit-Stop | Kamerawackeln | Ausfallschritt |
|---|---|---|---|---|---|---|---|
| Dolch | 0,05 | 28 % | schmal, schnell | 32 % | 28 ms | 1,5 | 6 px |
| Rapier | 0,12 | 28 %, Stoßkurve | Stoß-Spitze bei ~42 % | 50 % (einholen) | 32 ms | 1,5 | 8 px |
| Schwert | 0,28–0,36 | 28–36 % | 0,5 | 50 % | 50 ms | 3 | 6 px |
| Speer | Stoßkurve, `back −9` | 30 % (zurückziehen) | Spitze bei 42 % | 55 % (einholen) | 45 ms | 2,5 | 4 px |
| Axt | 0,36 | 36 % (weiter Bogen) | 0,5 | 50 %, sichtbares Überschießen | 72 ms | 4,5 | 5 px |
| Keule/Mace | 0,36 | 36 % | 0,5 | 50 % | 78 ms | 5 | 4 px |
| Streitkolben (Überkopf, `v=2`) | steiler Bogen, `up=−0,7π` | 36 % (hoch über Kopf) | scharfer Abwärtsschlag bei 50 % | 50 % | 78–100 ms | 5–7 | 4–5 px |
| Zweihänder/„great“ | 1,0 (Referenzgewicht) | 36 % | 0,5 | 50 %, größtes Überschießen | 100 ms | 7 | 9 px |
| Hammer | 1,15 (höchstes Gewicht) | 44 % (langes Ausholen, eigens im Code markiert) | 0,5 | 50 % | 118 ms | 8 | 6 px |
| Stangenwaffe | 0,7 | 36 % | 0,5 | 50 % | 70 ms | 4,5 | 5 px |
| Bogen | Spannen `swingDur×1,15` | Zughand wandert sichtbar zum Kinn (`pull`) | Lösen bei 75 % (`swingHit`) | kurz | 30 ms | 1,5 | 0 px |
| Armbrust | 0,45 | Spannen separat (`reloadUntil`) | Lösen bei 42 % | kurz | 40 ms | 3 | 0 px |

Ableitung: je höher `w0`, desto länger der Ausholanteil relativ zur Gesamtdauer (Hammer 44 % vs. Dolch 28 %) — das ist die einzige Stellschraube, die „Anticipation“ im vorhandenen System überhaupt bedeutet, und sie ist bereits im Code (`w0`-Schwelle in `swingOf`) vorhanden. Empfehlung: diese Kopplung beibehalten, nicht durch feste ms-Werte ersetzen, da `swingDur` bereits von Ausrüstung/Skill abhängt.

### 3.3 Trefferreaktionen (Ziel)

| Reaktion | Auslöser | Dauer | Umsetzung |
|---|---|---|---|
| Normaler Treffer | jeder Treffer, `stag < 0,6` | Pose `hit` 120–180 ms, dann zurück in vorherige Pose | `by=-1`, Arme nach hinten (bereits in `rigS`/`rigW` `hit` definiert) |
| Unterbrechender Treffer | `stag ≥ 0,6` (Axt, Keule, Zweihänder, Hammer, Armbrust) | 180–260 ms, bricht laufende Angriffsvorbereitung des Gegners | zusätzlich kurzer `by`-Ruck und Kopf-Offset `hx` verstärkt |
| Block-Ruck | Treffer auf Schild/Deckung | 90 ms, kleiner Rückstoß (`kb` Betrag 7) | bereits im Code (Z. 10653) — als Referenz für „kleine“ Reaktionsklasse beibehalten |
| Kritischer Treffer | `crit` | Hit-Stop × 1 + 40 ms, Shake × 1,8, `R.cam.punch = 0,04` | bereits im Code (Z. 3128–3129) — Hades-Prinzip „seltene Abweichung“ |
| Rückstoß (`kb`) | Distanzeffekt (Explosion, schwerer Treffer) | 90–220 ms Abklingzeit (`t/T`), Betrag 2–40 px je nach Quelle | Pose `kb`: `by=+1`, Arme hoch, Beine leicht gespreizt (vorhanden) |

---

## 4. Todessequenzen nach Ursache

Aktuell gibt es eine gemeinsame Sterbepose (`die1`) und einen Partikel-/Sound-Aufruf in `die()` (Blut/Knochen + „necro“-Funken + Staub, `sfx('death'|'bone')`). Das folgende ist ein Vorschlag, die vorhandene Pose `die1` (kniend, Kopf/Arme nach unten/hinten) durch Fall-Varianten zu ergänzen, die **dieselben Bausteine** (Rumpf-`by`, Kopf-`hx/hy`, Bein-IK, Rotation der ganzen Figur beim Blit) neu kombinieren — keine neuen Frame-Sheets, nur neue Winkel-Kombinationen plus Dauer/Rotation beim Endzustand `down`/`dead`.

| Ursache | Bewegungsbild | Technische Umsetzung | Dauer bis `down` | Partikel/Sound |
|---|---|---|---|---|
| Sturz rückwärts (schwerer Wucht-Treffer, Explosion) | Figur kippt nach hinten, Arme reißen hoch | `lean`/`hy` progressiv gegen 90°, `kb`-Vektor nach hinten groß | 300–400 ms | Staub-Burst am Aufprallpunkt |
| Sturz vorwärts (Stoßwaffen, Genickschlag) | Figur knickt nach vorn, Kopf voran | Rotation um Fußpunkt nach vorn, Arme kurz nach vorn geworfen | 260–340 ms | Blut nach vorn versetzt |
| Knie-Kollaps (Erschöpfung, Gift, langsamer Tod) | kein Kippen — sackt gerade nach unten (`kneel`→`die1`) | reine `by`-Absenkung, keine Rotation | 400–600 ms (langsamer, „ruhiger“ Tod, Fear&Hunger-Prinzip: kein Spektakel) | nur leises Ausatmen, kein Screenshake |
| Verbrennen (Feuer) | Figur zuckt kurz (`hit`-artig), dann `down` mit Farbüberlagerung statt Formänderung | Flash-Silhouette in Glutfarbe (`flashOf`-Technik wiederverwendet, andere Füllfarbe) statt weiß, kurze Rotation | 250 ms + 400 ms Nachglühen | Funken/Rauch-Partikel, kein Blut |
| Erfrieren/„Freeze-Break“ | Figur erstarrt in Trefferpose (kein Rückstoß), zerbricht dann | letzte Pose einfrieren (kein neuer Rig-Aufruf mehr), dann Ausblenden in kleine Splitter-Partikel statt Blut | Erstarren 200 ms, Zerbrechen 150 ms | „bone“-artiges Splitter-FX, hoher, kurzer Ton |
| Auflösen (Magie/Seelenbindung, Untote bei heiligem Schaden) | keine Sturzbewegung — Figur bleibt in letzter Pose, verblasst | Alpha-Fade der gemalten Silhouette über Zeit, `motes`-Silhouette-Funken nach oben (bereits als `sil: 'motes'`-Mechanik vorhanden) | 500–700 ms Fade | „necro“-Partikel nach oben, kein Aufprallgeräusch |
| Untoten-Zerfall (Skelett, Ghoul ohne Wiederauferstehung) | Sackt in sich zusammen statt zu fallen | `by` stark negativ (Rumpf schrumpft Richtung Boden), keine Rotation | 300 ms | „bone“-Partikel (bereits vorhanden für `bony` in `die()`), kein Blut |
| Automaten-Abschaltung (Konstrukt/Automat) | kein organisches Kippen — ruckartiges Erstarren, dann kippt starr wie ein Brett | letzte Pose einfrieren, danach Rotation der gesamten Figur als starrer Körper (kein Bein-/Armnachwippen) | Erstarren 150 ms, Kippen 300 ms | Metall-/Dampf-Sound, kurzer Funkenblitz statt Blut |

Gemeinsame Regel: **Ursache entscheidet über Rotation und Partikelfarbe, nicht über eine neue Pose.** Das hält den Aufwand auf dem Niveau von zwei bis drei zusätzlichen Zahlenwerten je Ursache (Rotationswinkel, Dauer, Partikeltyp) statt neuer Rig-Definitionen.

---

## 5. Kameraregeln

| Situation | Regel | Begründung |
|---|---|---|
| Normaler Treffer | keine Kameraveränderung außer dem waffenspezifischen `camShake` aus `FEEL` | Konsistenz, Übersättigung vermeiden (Hades-Prinzip: Abweichung muss selten bleiben) |
| Kritischer Treffer | zusätzlicher kurzer `cam.punch` (bereits vorhanden), kein Zoom | Darkest Dungeon: Fokus per Punch/Farbe genügt, kein echter Zoom nötig bei 40×56-Figuren |
| Boss-Intro | einmaliger, kurzer Zoom auf den Boss (400–600 ms), danach sofort zurück auf Normalabstand; kein Dauerzoom während des Kampfs | Hades: Zoom ist ein Satzzeichen, kein Zustand |
| Finisher/Gnadenstoß | kurzer Hit-Stop deutlich länger als normale Waffen-Werte (z. B. 150–200 ms) + Stummschaltung der Umgebungsgeräusche für die Dauer | Blasphemous-Prinzip: eigene, seltene Inszenierung statt Wiederverwendung des normalen Treffer-Feelings |
| Ruhiger/„stiller“ Tod (Erschöpfung, Gift, Hinrichtung eines Wehrlosen) | ausdrücklich **kein** Shake, **kein** Punch | Fear & Hunger: Stille wirkt bedrohlicher als Effekt |
| Wichtiger Dialogsatz | keine Kamerabewegung; stattdessen Reaktionspose + kurzer Musik-/Soundbruch | Chrono-Trigger-Prinzip: Pose statt Kamerafahrt |
| Dauerzustand (Sturm, Verfolgung) | Kamera bleibt neutral, keine kontinuierliche Unruhe | Vermeidet Ermüdung/Motion-Sickness, respektiert `S.settings.motion`-Schalter, der bereits existiert |

---

## 6. Partikelbudget

Richtwert, angelehnt an die bestehenden `fx()`-Aufrufe in `die()` (Blut 12, „necro“ 10, Staub 5 als Referenzgrößen):

| Ereignis | Partikelzahl | Lebensdauer |
|---|---|---|
| Normaler Treffer (leicht/mittel) | 3–6 | 200–400 ms |
| Kritischer Treffer | 8–12 | 300–500 ms |
| Tod (organisch, Blut) | 10–14 | 600–800 ms |
| Tod (Untote/Knochen) | 8–10 | 500–700 ms |
| Tod (Magie/Auflösen) | 6–10, langsam aufsteigend | 700–1000 ms |
| Bosskampf-Spezialangriff | max. 20 gleichzeitig (Performance-Deckel) | situativ |

Regel: Partikelzahl skaliert mit Bedeutung des Ereignisses, nie mit Waffenwert allein — ein kritischer Dolchtreffer darf mehr Partikel bekommen als ein normaler Hammertreffer, auch wenn der Hammer objektiv „schwerer“ ist (Wichtigkeit statt Waffenklasse als Steuergröße, analog Darkest-Dungeon-Krit-Fokus).

---

## 7. Minimales Event-Schema

Für die Synchronisation von Pose, Sound, Partikel und Kamera innerhalb eines Angriffs- oder Todesablaufs, angelehnt an die bereits im Code vorhandenen Phasenschwellen (`wind`/`strike`/`follow` in `phaseOf`):

```
{ t: 0.00, event: 'wind_start' }      // Ausholen beginnt (Pose-Phase 'wind')
{ t: 0.36, event: 'strike_start' }    // Treffer-Fenster beginnt (Waffenklassen-Schwelle w0, hier: Axt)
{ t: 0.42, event: 'impact', fx: 'blood', n: 8, shake: 4.5, stop_ms: 72 }
{ t: 0.50, event: 'follow_start' }    // Nachschwung beginnt
{ t: 0.82, event: 'recover' }         // zurück in Ruhehaltung
```

`t` ist der normierte Fortschritt 0–1 über `swingDur`, identisch zur bestehenden Zeitbasis in `swingOf`/`phaseOf` — kein neues Zeitsystem, nur eine explizite Liste der Momente, an denen andere Systeme (Sound, Partikel, Kamera) einhängen sollen, statt das implizit an drei verschiedenen Stellen im Code zu prüfen.

Todesfall-Variante:
```
{ t: 0,   event: 'death_flash', color: '#e8b8a0' }   // kurzer Farbstich statt weißem Standard-Flash
{ t: 0.1, event: 'fall_start', dir: 'back' }
{ t: 0.4, event: 'impact_ground', fx: 'dust', n: 6 }
{ t: 1.0, event: 'settle' }                          // Endpose 'down' erreicht
```

---

## 8. Zusammenfassung — die 10 wichtigsten Regeln

1. Hit-Stop ist der billigste Wucht-Kauf: 25–120 ms je Waffenklasse, immer additiv zu Shake und Flash, nie als Ersatz für sie.
2. Kamera bleibt neutral als Normalzustand; Zoom/Punch/Zeitlupe sind Satzzeichen für seltene Momente (Krit, Boss-Intro, Finisher), nicht Dauerzustand.
3. Drei klar unterscheidbare Posen-Extreme (Ausholen, Treffer, Nachschwung) lesen sich aus der Spieldistanz besser als viele ähnliche Zwischenframes.
4. Je schwerer die Waffe, desto größer der Ausholanteil relativ zur Gesamtdauer — das ist die eigentliche „Anticipation“ im bestehenden System.
5. Struktureller Schaden (Gliedmaßen-Zustand, Blutstufe, Erschöpfung) trägt mehr Gewicht als ein einmaliger Trefferframe.
6. Todesursache bestimmt Rotation, Farbe und Partikeltyp — nicht eine neue Pose; `die1` bleibt die gemeinsame Basis.
7. Nicht jeder Tod braucht Spektakel: ein stiller, kamerastiller Tod kann im grimdark-Ton bedrohlicher wirken als ein lauter.
8. Sondermomente (Gnadenstoß, Boss-Tod) bekommen eigene, kurze Sonderbehandlung statt Wiederverwendung des Standardtreffers.
9. Reaktionsposen ersetzen Kamerafahrten in Dialogen — ein Pose-/Soundwechsel reicht für Dramatik ohne 3D.
10. Partikel- und Kamerabudget skalieren mit der Wichtigkeit des Ereignisses, nicht automatisch mit dem Waffenwert allein.
