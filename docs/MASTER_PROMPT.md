# ROTFALL: LEGACY — Master-Prompt (Session 14)

> **Abgelöst (05.10.2026):** Operativ gilt nur noch `CLAUDE.md` im Repo-Wurzelverzeichnis. Dieses Dokument bleibt als Lesestoff (Ziele §1, Prüffragen §8, Kernkriterien §7); seine Sitzungs-, Git-, Port- und Skill-Regeln sind veraltet.

Stehender Auftrag des Nutzers. Neueste Nutzerentscheidung (`PLAN_OFFEN.md`) geht vor, dieses Dokument vor allem anderen.
Frühere Fassungen: `archive/` (nicht bindend).

## 1. Ziel
- Lebendige, simulierte RPG-Welt: systemische Tiefe vor mehr Inhalt.
- NPCs arbeiten, Gebäude haben Funktion, Städte rechnen wirtschaftlich, Quests und Ereignisse entstehen aus der Welt.
- Fraktionen, Gegner und Gegenstände haben Identität, nicht nur Farbe. Fern vom Spieler rechnet die Welt abstrakt weiter.

## 2. Sitzung
- **Start:** obersten Eintrag in `SESSION_LOG.md`, HIGH in `BUGS.md`, Tabelle in `PHASE_STATUS.md` lesen — sonst nichts.
  Dev-Server ohne Cache (Port 8770, `?dev`), „Fortsetzen“, `RF.selftest()`.
- **Ende:** `BUGS.md`, `CHANGELOG.md` (≤ 5 Zeilen), `SESSION_LOG.md` (neuer Eintrag oben, vorletzten auf eine Zeile
  kürzen), `PHASE_STATUS.md`, `GDD.md`; bei neuen Systemen `WELTREGELN.md`, bei neuen Inhalten `GUIDE.md`.
  **Immer** `MECHANIKEN.md` ergänzen: jede neue Mechanik in ein, zwei Zeilen (Nutzerwunsch 29.09.).
- Weitere Dokumente nur lesen, wenn die Aufgabe sie braucht (Karte in §9).

## 3. Grundregeln
- Kein Rewrite ohne Grund. Bestehendes erweitern; Refactoring nur mit genanntem Grund.
- Ursache statt Symptom: alle Aufrufer prüfen, an der gemeinsamen Stelle fixen, Regressionstest dazu. Tests nie löschen.
- Tests und Proben ändern nie den echten Spielstand (Sandbox, `S._quiet`; Stand vorher sichern und vergleichen).
- Reality-Check vor „fertig“: Screenshot ansehen (ein Sammelbild je Prüfung), mit der ursprünglichen Beschwerde abgleichen.
- Keine Fake-Features: fertig ist, was im Spiel wirkt, nicht was einen Knopf hat.
- Budget: Zeichnen ≤ 2 ms, Spiellogik ≤ 3 ms je Bild.
- Welt-`rnd()`-Folge nicht verschieben; neue Entscheidungen per Hash.
- Nie Code hinter `//` in derselben Zeile; nach Skript-Edits `scan.py`/`scan2.py`.
- Vor jeder Änderung Sicherung (externes Repo `../_rf_backup.git`); kein Git im Projekt, der Nutzer pusht selbst.
- Keine Downloads ohne Erlaubnis. Kein SpriteCook, Pixel-Plugin, Aseprite, keine bezahlten Generatoren.
- Figuren und Namen eigene Schöpfungen (z. B. Weißbart: eigene Geschichte, Gestalt, Waffe).
- Nutzer bei Lore und Richtungsfragen fragen (höchstens 5 Fragen, mit Empfehlung); Kleinigkeiten selbst entscheiden.
- Chat kurz auf Deutsch (Caveman); Code, Kommentare, Doku in klarer Prosa. Subagenten nur auf Wunsch.

## 4. Prioritäten
- Rangfolge bei Konflikten: Stabilität → Kernspiel → Kampf → Animation → Optik → Weltlogik → KI → Wegfindung.
- Arbeitsreihenfolge ab Session 15: **`PLAN_S15.md`**. Das Dokument enthält Pakete P0–P13, ihre Statustabelle,
  Standards für Designfragen und Abnahmekriterien. Immer das erste offene Paket bearbeiten.
- S14 erledigt: Hof und Nutztiere, Seevolk mit Weißbart, Weltereignisse (Brand, Spuk, Magitech-Unfall, Jahreszeiten).
- Nordreich und Sandfürsten folgen nach `PLAN_S15.md`.

## 5. Phasen (kurz)
0 Audit · 1 Bugs · 2 Weltlogik · 3 Übergänge · 4 Gebäude · 5 Stil · 6 Animation · 7 Waffen · 8 Rarität · 9 Skill-Baum ·
10 Klassen · 11 Gegner · 12 Bosse · 13 Städte · 14 Dungeons · 15 NPCs/Tiere · 16 Weltsimulation · 17 Fraktionen ·
18 Klang · 19 Oberfläche · 20 Leistung · 21 zweiter Durchlauf · 22 Abschluss · A Aurelion · B Nationen ·
C Schwierigkeit · D Ereignisse. Stand und Offenes: Tabelle in `PHASE_STATUS.md`.

## 6. Skills (Thema → Skill)
| Thema | Skill |
|---|---|
| jede Code-Änderung | `ponytail` (kürzester richtiger Fix) |
| Chat | `caveman` (voll, Deutsch) |
| Fehlersuche | `systematic-debugging` |
| Systeme, Balancing, Quests | `game-design` |
| Figuren, Sprites, Animation | `2d-games` |
| Leistung | `performance-profiling` |
| Review vor Abschluss | `ponytail-review` |

## 7. Offene Anforderungen (Kernkriterien)
**Siedlungsdichte (§75)**
- Abstand zwischen Häusern ≥ 5 Kacheln, in dichten Kernen ≥ 3; Hauptwege sichtbar breiter als Gassen.
- Bebaut < 25 % der Fläche, Peripherie (Felder, Höfe, Zäune) statt harter Kante; kein Gedränge im Stresstest.
- Stand: ≥ 2 Kacheln (Test), bebaut 11–18 %, Peripherie da. Offen: 5-Kachel-Ziel, organische Anordnung (Designfrage).

**Tagesablauf Stufe 2 (§41)**
- Je Rolle eigener Plan mit 3–6 Blöcken (GDD); Jäger ziehen sichtbar hinaus und liefern ab; Läden sichtbar auf/zu.
- Talk-Pairs im Spiel sichtbar; nach Kampf/Alarm Wiederaufnahme am aktuellen Block, kein Tagesreset.
- Stand: erfüllt. Offen: Budget bei voller Großstadt (BUG-108).

**Rückwärtslaufen-Cheese (§34)**
- Jeder Nahkampfgegner (außer bewusst träge) bestraft Rückwärtsgehen und Zuschlagen; Konter fair angesagt.
- Stand: erfüllt (BUG-076, Nachsetzen ≥ 2,0 px/Bild, beritten rückwärts 40 %). Jede neue Gegnerart dagegen prüfen.

**Balancing (§82)**
- Messwerte vorher/nachher (`RF.duel`); Gefahr 3/4 spürbar gefährlicher; Bosse mit Phase, Ansage und Antwort auf Abstand.
- Reality-Check-Kampf nach jeder Änderung. Offen: Gefahr 3/4 gegen die Definition prüfen, Schwierigkeitsgrade.

**Skelett-Stadt / Befreiungsorte (§81)**
- Eigene Arena, Mehrfach-Encounter (Wellen oder mehrstufiger Boss), sichtbare Weltfolge am Ort, getesteter Höhepunkt.
- Stand: Befreiung in Wellen mit Hauptmann und Heimkehrern. Offen: Schwarze Feste (BUG-100, Designfrage).

**Questtafel (§80)**
- Jede größere Stadt hat eine erreichbare Tafel mit Titel, grobem Zielort und Ansprechpartner je Auftrag.
- Nur passende, zugängliche Aufträge; Tafel ersetzt nicht das Gespräch mit dem Geber.
- Stand: 21 Tafeln; S14: Tafel folgt Besatzung und Ruf. Offen: Ansprechpartner und Zielort in jedem Eintrag prüfen.

**NPC-Beziehungen (§79)**
- Beziehungswerte an Talk-Pairs; Abneigung meidet sichtbar; ≥ 3 Gerücht-Auslöser; Blasen sichtbar; Gerüchte verfallen.
- Stand: Stufe 1 erfüllt. Offen: Beziehungen ändern sich durch Taten des Spielers.

**Erreichbarkeit (§7)**
- Jeder Ort und jeder POI zu Fuß erreichbar (Selbsttest BFS, `ensureReach` nach jeder Erzeugung), auch neue Orte.
- Offen: 38 Rohstoffknoten auf Felskacheln (Audit A-04).

## 8. Prüffragen je Änderung
- Warum ist das hier, warum passiert das? Jeder Gegner, jedes Objekt braucht einen Grund an genau diesem Ort.
- Würde ein Spieler es hinterfragen (Logik, Immersion)? Weiß er, was zu tun ist?
- Warum passiert hier nichts? Leere Flächen und herumstehende Figuren sind Befunde.
- Tod und Boden sind endgültig; keine Treffer durch Wände; Fernkampf braucht Sichtlinie; keine XP ohne eigenen Schaden.
- Fühlt es sich hochwertig an? Große Ereignisse sind dauerhafte Weltzustände mit Kamerafahrt, keine Quests.

## 9. Wo was steht
| Dokument | Inhalt |
|---|---|
| `MECHANIKEN.md` | alle Mechaniken auf einen Blick, je ein, zwei Zeilen |
| `GDD.md` | Regeln, Werte, Entscheidungen (Tabellen) |
| `WELTREGELN.md` | Soll/Ist aller Systeme mit Status |
| `PLAN_OFFEN.md` | Entscheidungen des Nutzers, offene Blöcke |
| `DATA_SCHEMAS.md` | Datensätze im Code (Ist-Stand) |
| `STYLE_GUIDE.md` | Grafikregeln |
| `design/` | Mechanik-Check, Sprite-Inventur |
| `GUIDE.md`, `GUIDE_EREIGNISSE.md` | Spieler-Guide |
| `PROMPTS_GRAFIK.md`, `WELT_EVENTS_S13.md` | Bildaufträge, Ideenliste Ereignisse |
