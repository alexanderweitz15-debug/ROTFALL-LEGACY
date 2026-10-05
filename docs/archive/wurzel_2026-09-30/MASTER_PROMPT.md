# ROTFALL: LEGACY

## MASTER-PROMPT — Complete World Audit, Playthrough, AI Polish, Bug Hunt & Massive Expansion

*Erweiterte Fassung — zusammengeführt aus Playthrough/Audit-Prompt und Expansion-Prompt, ergänzt um Dokumentationspraxis, Datenvorlagen, Definition-of-Done-Kriterien und Kommunikationsprotokoll.*

---

## 0. ÜBER DIESEN PROMPT

Dies ist kein Einmal-Prompt für eine einzelne Antwort. Es ist ein **Dauerauftrag**, der über viele einzelne Arbeits-Sessions hinweg gilt — vermutlich über Tage oder Wochen, mit vielen einzelnen Chat-/Agenten-Sessions.

Das bedeutet:

* Du wirst dieses Dokument nicht in einem Rutsch abarbeiten.
* Du wirst zwischendurch den Kontext verlieren (neue Session, neues Kontextfenster).
* Du brauchst deshalb **externe, dauerhafte Gedächtnisstützen** — nicht nur deinen Gesprächsverlauf.

Deshalb gilt zusätzlich zu allen inhaltlichen Regeln:

> **Jede Session beginnt mit Orientierung, nicht mit Code.**
> **Jede Session endet mit Dokumentation, nicht mit einem stillschweigenden Abbruch.**

Details dazu in Abschnitt 3 (Lebende Projektdokumente) und Abschnitt 6 (Kommunikationsprotokoll).

### Session-Start-Routine (immer, ausnahmslos)

```text
1. docs/SESSION_LOG.md lesen (letzter Eintrag)
2. docs/PHASE_STATUS.md lesen (aktuelle Phase, offene Punkte)
3. docs/BUGS.md lesen (offene CRITICAL/HIGH Einträge)
4. Kurz zusammenfassen, was du vorfindest, bevor du irgendetwas änderst
5. Erst danach: weiterarbeiten
```

Wenn diese Dateien noch nicht existieren: Sie in dieser ersten Session anlegen (siehe Vorlagen in Abschnitt 3), bevor inhaltlich weitergearbeitet wird.

### Session-Ende-Routine (immer, ausnahmslos)

```text
1. Bug Ledger aktualisieren (neue Funde, erledigte Einträge abhaken)
2. Changelog-Eintrag schreiben
3. Session-Log-Eintrag schreiben (was wurde gemacht, was ist offen, was ist der nächste sinnvolle Schritt)
4. Falls Versionskontrolle vorhanden: sinnvoll strukturierte Commits, keine Monster-Commits
5. Dem Nutzer eine kurze, ehrliche Zusammenfassung geben (siehe Abschnitt 6)
```

Eine Session, die kommentarlos endet, ohne dass jemand — auch nicht du selbst in der nächsten Session — nachvollziehen kann, was passiert ist, gilt als **nicht abgeschlossen**.

---

## 1. ZIELBILD & LEITPRINZIP

Du arbeitest ab jetzt nicht einfach an einzelnen Features.

Du entwickelst **Rotfall: Legacy als zusammenhängendes Spiel** weiter.

Das Ziel ist nicht:

> möglichst viele Features hinzufügen.

Das Ziel ist:

> **Eine große, lebendige, glaubwürdige, wunderschöne und spielerisch tiefe RPG-Welt zu erschaffen, bei der bestehende Systeme sauber miteinander funktionieren.**

Drei Leitfragen begleiten jede Entscheidung, jederzeit:

```text
1. Ist es spielbar und stabil?
2. Ist es logisch (World Logic)?
3. Fühlt es sich hochwertig an (Game Feel / Visual / Audio)?
```

Erst wenn alle drei mit Ja beantwortet werden können, gilt eine Änderung als abgeschlossen. Ein „technisch funktioniert es" reicht nicht.

---

## 2. GRUNDREGELN & EINZUSETZENDE SKILLS

**Verwende diese Skills für die Gesamtentwicklung, situationsabhängig:**

| Skill | Wann einsetzen |
|---|---|
| `/ponytail:ponytail` | Immer als Grundhaltung — bei praktisch jeder Aufgabe zuerst laden |
| `/agentic-awesome-skills:game-development` | Implementierung von Gameplay-Systemen |
| `/agentic-awesome-skills:game-design` | Design-Entscheidungen, Balancing, Spielgefühl-Fragen |
| `/agentic-awesome-skills:architecture` | Systemstruktur, Modulgrenzen, Refactoring-Entscheidungen |
| `/agentic-awesome-skills:clean-code` | Code-Qualität, Lesbarkeit, Benennung |
| `/agentic-awesome-skills:systematic-debugging` | Jede Fehlersuche, jede Root-Cause-Analyse |
| `/agentic-awesome-skills:test-driven-development` | Neue Systeme mit klaren Verhaltensanforderungen |
| `/agentic-awesome-skills:testing` | Testplanung, Testabdeckung, Regressionstests |
| `/agentic-awesome-skills:browser-testing` | Tatsächliches Durchspielen/Verifizieren im Browser |
| `/agentic-awesome-skills:javascript-mastery` | JS-spezifische Implementierungsfragen |
| `/agentic-awesome-skills:typescript` | Typisierung, Datenmodelle, Schnittstellen |
| `/agentic-awesome-skills:performance-optimization` | Performance-Audits, Optimierung |
| `/agentic-awesome-skills:debugging` | Allgemeine Fehlerbehebung |
| `/agentic-awesome-skills:agent-memory` | Session-übergreifendes Gedächtnis, Dokumentationspflege |
| `/spritecook:spritecook-animate-assets` | Jedes Sprite-/Animationsthema |
| `/pixel-plugin:pixel-art-creator` | Jedes Pixel-Art-Asset-Thema |
| `/agentic-awesome-skills:algorithmic-art` | Prozedurale visuelle Effekte, Terrain-Variation |
| `/agentic-awesome-skills:game-audio` | Sound- und Musikthemen |
| `/agentic-awesome-skills:frontend-design` | UI-Layout, Skill Tree UI, Inventar-UI |
| `/agentic-awesome-skills:web-design-guidelines` | UI-Konsistenz, Interaktionsmuster |
| `/agentic-awesome-skills:accessibility` | Lesbarkeit, Farbkontrast, Bedienbarkeit, Remapping |

**Zusätzliche, empfohlene Skills** (Verfügbarkeit vorher prüfen — Katalog ist groß und versionsabhängig, nicht jeder Slug ist zwangsläufig installiert):

| Skill | Wofür |
|---|---|
| `/agentic-awesome-skills:dialogue-system` | NPC-Gerüchte (Abschnitt 79), Questtafel (Abschnitt 80), Talk Pairs (Abschnitt 41) |
| `/agentic-awesome-skills:save-system-design` | Spielstandgröße/-struktur (Abschnitt 49, BUG-017/057) |
| `/agentic-awesome-skills:procedural-generation` | Prozedurale Dungeons (Abschnitt 76), prozedurale Städte (Abschnitt 77) |
| `/agentic-awesome-skills:level-design` | Dungeon-Layout, Skelett-Stadt-Encounter (Abschnitt 81) |
| `/agentic-awesome-skills:narrative-design` | Totenreich-Lore, Nekromant/Hexenmeister-Kette (Abschnitt 78) |
| `/agentic-awesome-skills:economy-design` | Händler, Raritäten/Loot (Abschnitt 30), Wirtschaftsfolgen von Raids/Karawanen |
| `/agentic-awesome-skills:shader-programming` | Glow-Effekte (Abschnitt 78), VFX (Abschnitt 36) |
| `/agentic-awesome-skills:sound-design` | Klanglandschaft, Ambience, tiefer als game-audio (Abschnitt 46) |
| `/agentic-awesome-skills:ui-ux-design` | Questtafel (Abschnitt 80), HUD (Abschnitt 47) |
| `/agentic-awesome-skills:combat-design` | Kampfgefühl, Ausdauer-System, Anti-Kiting (Abschnitt 27/28/34) |
| `/agentic-awesome-skills:content-audit` | Reality-Check vor Phasenabschluss (Abschnitt 58) |
| `/agentic-awesome-skills:consistency-check` | Reality-Check vor Phasenabschluss (Abschnitt 58) |
| `/agentic-awesome-skills:balance-check` | Balancing-Update (Abschnitt 82) |
| `/agentic-awesome-skills:scope-check` | Reality-Check vor Phasenabschluss (Abschnitt 58) |

Wenn eine Aufgabe mehrere Themenbereiche berührt (z. B. eine neue Waffe = Design + Animation + VFX + Audio + Architektur), **lade auch mehrere Skills gleichzeitig**. Ein einzelnes Feature, das nur mit einem Skill betrachtet wird, ist ein Warnsignal für isoliertes Denken — siehe Abschnitt 4 (World Coherence).

### WICHTIG: Erhalten vs. Refactoring

**Nicht alles neu schreiben.**

Das bestehende Spiel enthält bereits viele funktionierende Systeme. Erhalte funktionierende Systeme und erweitere sie. Bestehende gute Arbeit soll nicht ohne Grund ersetzt werden.

Ein Refactoring ist gerechtfertigt, wenn **mindestens eines** davon zutrifft:

```text
1. Das bestehende System blockiert nachweisbar eine geforderte Erweiterung
   (nicht nur "wäre eleganter so").
2. Das bestehende System verursacht wiederholt Bugs derselben Art
   (mehr als ein isolierter Einzelfall).
3. Das bestehende System macht Performance-Ziele nachweisbar unerreichbar.
4. Das bestehende System macht World-Logic- oder Gameplay-Qualität
   nachweisbar unmöglich (nicht nur "unbequem").
```

Trifft keiner dieser Punkte zu: **nicht anfassen**, auch wenn der Code nicht dem eigenen Geschmack entspricht.

> **Kein Rewrite nur um des Rewrites willen.**

Wenn du dich für ein Refactoring entscheidest, dokumentiere in `docs/CHANGELOG.md` explizit *warum* (welcher der vier Punkte zutraf) — nicht nur *was* geändert wurde.


---

## 3. LEBENDE PROJEKTDOKUMENTE

Damit über viele Sessions hinweg nichts verloren geht, führe folgende Dateien im Projekt (z. B. unter `docs/`). Sie sind Pflicht, kein optionales Extra:

```text
docs/GDD.md            – Game Design Document (lebend, wird laufend aktualisiert)
docs/BUGS.md           – Bug Ledger (siehe Abschnitt 8)
docs/CHANGELOG.md       – Was wurde wann geändert und warum
docs/SESSION_LOG.md     – Kurzprotokoll jeder Arbeits-Session
docs/PHASE_STATUS.md    – Aktuelle Phase, Fortschritt, offene Punkte je Phase
docs/STYLE_GUIDE.md     – Visuelle Identität: Referenzbilder, Farbpaletten, Pixel-Dichte-Regeln
docs/DATA_SCHEMAS.md    – Datenmodelle für Waffen, Gegner, Raritäten, Skills, Quests, Gebäude, Props
```

Diese Dateien sind **kein Bürokratie-Selbstzweck**. Sie existieren, weil du (der Agent) zwischen Sessions dein Gedächtnis verlierst, aber der Nutzer nicht jedes Mal den kompletten Kontext neu erklären soll. Wenn eine dieser Dateien fehlt, lege sie an, statt sie zu ignorieren.

Kurzformate:

**GDD.md** – Abschnitt pro System (Combat, Waffen, Klassen, Skill Tree, Fraktionen, Städte, ...), jeweils: aktueller Stand, Design-Entscheidungen und *warum* sie so getroffen wurden, offene Fragen.

**PHASE_STATUS.md**:
```text
Phase: <Nummer/Name>
Status: NICHT BEGONNEN / IN ARBEIT / TESTEN / ABGESCHLOSSEN
Definition of Done erfüllt: JA/NEIN + welche Punkte fehlen
Letzte Aktualisierung: <Datum/Session>
Nächster sinnvoller Schritt: <konkret>
```

**SESSION_LOG.md** (ein Eintrag pro Session, neueste oben):
```text
### Session <Nr> — <Datum/Kontext>
Gemacht: ...
Gefundene neue Probleme: ...
Offen geblieben: ...
Nächster Schritt: ...
```

---

## 4. GLOBALE QUALITÄTSREGEL — WORLD COHERENCE

Rotfall: Legacy soll niemals wie eine Sammlung unabhängiger Features wirken. Alles soll miteinander verbunden sein.

Beispiel:

```text
Waffe
↓
Animation
↓
Hitbox
↓
Trefferreaktion
↓
VFX
↓
Sound
↓
Kamera
↓
AI-Reaktion
↓
NPC-Reaktion
↓
Fraktionsreaktion
↓
World Consequence
```

Oder:

```text
Stadt
↓
Gebäude (mit erkennbarer Funktion)
↓
Bewohner
↓
Händler
↓
Wachen
↓
Handelswege
↓
Karawanen
↓
Wirtschaft
↓
Banditen
↓
Überfälle
↓
Quests
↓
Fraktionsbeziehungen
```

Oder, neu, weil es ein konkret beobachtetes Problem ist:

```text
Gegner verfolgt Spieler
↓
Spieler betritt Gebäude / Mineneingang
↓
Szenenwechsel (Exterior → Interior)
↓
Verfolgungszustand MUSS bewusst behandelt werden
   (weiterverfolgen, an Eingang warten, aufgeben mit Grund –
    NICHT stillschweigend vergessen)
```

Ein System soll, wenn sinnvoll, Auswirkungen auf andere Systeme haben. Wenn ein System an einer Systemgrenze (z. B. Szenenwechsel) einfach "aufhört zu existieren", ist das ein Bug, kein akzeptables Verhalten — siehe Abschnitt 21 (Szenenübergänge).

---

## 5. ENTWICKLUNGSPROZESS-PIPELINE

Für jede größere Aufgabe:

```text
ANALYZE
↓
THINK
↓
PLAN
↓
IMPLEMENT
↓
TEST
↓
BUGFIX
↓
WORLD LOGIC CHECK
↓
GAMEPLAY CHECK
↓
VISUAL CHECK
↓
AI / SIMULATION CHECK
↓
PERFORMANCE CHECK
↓
REGRESSION TEST
↓
DOKUMENTATION AKTUALISIEREN
↓
NEXT PHASE
```

Nicht einfach:

```text
Feature bauen → nächstes Feature
```

Jede Stufe ist ein Gate, kein optionaler Bonus. Ein Feature, das ungetestet als "fertig" gemeldet wird, ist nicht fertig — siehe Abschnitt 55 (Definition of Done).

---

## 6. KOMMUNIKATIONSPROTOKOLL MIT DEM NUTZER

Auch wenn du weitgehend selbstständig arbeitest, gilt:

**Frage nach, wenn:**
* eine Design-Entscheidung nicht aus bestehenden Referenzen/Dokumenten ableitbar ist (z. B. neue Kernmechanik, die das Spielgefühl grundlegend verändert)
* ein Refactoring große, schwer rückgängig zu machende Auswirkungen hätte (z. B. Save-Format-Änderung ohne Migration)
* zwei sinnvolle Lösungswege existieren, die zu spürbar unterschiedlichem Spielerlebnis führen

**Entscheide selbstständig und dokumentiere die Annahme, wenn:**
* es sich um Detailarbeit innerhalb bereits definierter Leitplanken handelt (Balancing-Feinschliff, einzelne Assets, einzelne Bugfixes)
* eine Verzögerung durch Rückfrage den Arbeitsfluss unnötig unterbricht, obwohl eine vernünftige Standardentscheidung existiert

**Berichte nach jeder Phase / jeder größeren Session:**
* Was wurde gemacht (kurz, konkret, keine Marketingsprache)
* Was wurde im Bug Ledger neu gefunden
* Was ist noch offen
* Ob die Definition of Done der aktuellen Phase erfüllt ist
* Empfehlung für den nächsten Schritt

Keine Was-alles-toll-ist-Zusammenfassungen ohne Substanz. Ehrlich benennen, was noch nicht gut genug ist.


---

## 7. PHASE 0 — KOMPLETTER PLAYTHROUGH

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-development`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:browser-testing`, `/agentic-awesome-skills:systematic-debugging`, `/agentic-awesome-skills:testing`, `/agentic-awesome-skills:agent-memory`

### ZUERST NICHT ENTWICKELN.

Spiele das vorhandene Spiel zuerst **so vollständig wie möglich selbst durch**. Verhalte dich wie ein echter Spieler. Beginne nach Möglichkeit mit einem neuen Spielstand.

Teste mindestens:

* Charaktererstellung
* Bewegung, Kamera, Map
* Orte, Städte, **Gebäude von außen UND von innen, falls betretbar**
* NPCs, Händler
* Inventar, Ausrüstung, Waffen
* Kampf, Dodge, Fähigkeiten
* Gegner, Boss, Loot, Raritäten
* Skill-Systeme, Fraktionen, Quests
* Reisen, Karawanen, Interaktionen
* Save, Load, Tod, Knockdown
* **Dungeons/Minen inklusive Übergang vom Außenbereich**
* Mobile Layout, Performance, UI, Sound, Animationen, VFX
* Props/Dekoration (Kisten, Fässer, Wagen, Zäune, Möbel)

Teste nicht nur den vorgesehenen Weg. Provoziere bewusst Situationen, unter anderem:

* NPC angreifen, Händler angreifen, Wache angreifen
* Gegner in Stadt locken, Gegner aus Stadt herauslocken
* Gegner sterben lassen, Spieler bewusstlos werden lassen
* **Gegner verfolgt Spieler → Spieler flüchtet in ein Gebäude/eine Mine/einen Dungeon-Eingang → beobachten, was mit dem Verfolgungszustand passiert**
* **Dieselbe Flucht-Situation an mehreren unterschiedlichen Gebäuden/Mineneingängen wiederholen — ist das Verhalten konsistent oder zufällig?**
* Karawane beobachten, Karawane angreifen
* Gegner in Hindernisse locken
* mehrere Gegner gleichzeitig bekämpfen, mehrere NPCs gleichzeitig bewegen lassen
* Save während verschiedener Situationen, Load danach
* Orte mehrfach betreten, schnell zwischen Orten wechseln
* **Jedes Gebäudetyp mindestens einmal betreten und fragen: „Was für ein Gebäude ist das eigentlich, und sieht man ihm das von außen an?"**
* **Jede auffällige Kiste/jedes Prop antippen/untersuchen und fragen: „Warum steht das hier, und wirkt es wie ein fertiges Asset oder wie ein Platzhalter?"**
* ungewöhnliche Eingaben testen

### Erreichbarkeits-Audit (Pflicht, neu)

**Konkret beobachtetes Problem:** An viele Orte kommt man derzeit nicht hin. Deshalb: systematisch prüfen, ob **jeder auf der Karte angelegte Ort/jede POI tatsächlich über einen begehbaren Weg erreichbar ist** — nicht nur die Hauptorte, sondern auch abgelegene Dungeon-Eingänge, Außenposten, Randgebiete, neue Regionen (Totenreich, Ödland). Jeder unerreichbare Ort ist mindestens `HIGH` im Bug Ledger (Abschnitt 8) — verlorener, unerreichbarer Inhalt ist genauso schlimm wie ein sichtbarer Bug.

### Durchführung per Agent (Pflicht, neu)

> **Dieser komplette Playthrough soll tatsächlich von einem Agenten durchgeführt werden — der Agent bewegt sich wie ein normaler Spieler durch die ganze Welt, erledigt Quests, betritt Orte, kämpft, interagiert mit NPCs — und wendet dabei aktiv das „Warum passiert das?"-Audit (Abschnitt 10) an, um Probleme zu erkennen und im Bug Ledger (Abschnitt 8) zu dokumentieren.**

Das ist kein einmaliger Kurzcheck, sondern ein echter, vollständiger Durchlauf mit der Haltung „was würde ein Mensch hier komisch finden" — nicht nur "läuft der Code fehlerfrei". Ergebnis dieses Durchlaufs ist eine konkrete, priorisierte Liste neuer Bug-Ledger-Einträge, kein pauschales "alles gut".

---

## 8. BUG LEDGER

Während des Playthroughs alle Probleme dokumentieren, in `docs/BUGS.md`. Nicht sofort blind beheben — zuerst einen strukturierten Problem-Ledger erstellen.

Kategorien:

```text
Priorität:  CRITICAL / HIGH / MEDIUM / LOW / POLISH

Bereich:    GAMEPLAY / COMBAT / AI / PATHING / WORLD LOGIC / SPAWNING
            NPC / FACTION / QUEST / ECONOMY / VISUAL / ANIMATION
            VFX / AUDIO / UI / IMMERSION / PERFORMANCE / SAVE-LOAD
            ARCHITECTURE / CONTENT / MOBILE / GEBÄUDE / SZENENÜBERGANG / PROPS
```

Für jedes Problem dokumentieren:

```text
ID:
Problem:
Reproduzierbar: JA/NEIN
Schritte:
Erwartetes Verhalten:
Tatsächliches Verhalten:
Kategorie:
Priorität:
Vermutete Ursache:
Betroffene Systeme:
Lösung:
Test (Regression):
Status: OFFEN / IN ARBEIT / BEHOBEN / VERIFIZIERT
```

Priorisierungs-Faustregel:

```text
CRITICAL – bricht Spielbarkeit, Save-Korruption, Softlocks, Exploits die die Welt-Logik aushebeln
           (z. B. "Verfolgung entkommen, indem man einfach eine Mine betritt", falls das
           als Exploit und nicht als beabsichtigtes Design gilt)
HIGH      – deutlich sichtbarer Logikbruch, der die Immersion aktiv zerstört
MEDIUM    – spürbar, aber nicht spielentscheidend
LOW       – Feinschliff
POLISH    – rein kosmetisch, kein Verhalten betroffen
```

Ein World-Logic-Fehler (z. B. "Gegner vergisst Verfolgung beim Betreten eines Gebäudes ohne erkennbaren Grund") ist **mindestens HIGH**, nicht "nice to have".

---

## 9. NICHT NUR TECHNISCHE BUGS SUCHEN

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:systematic-debugging`

Ein Problem muss kein klassischer Programmierfehler sein. Ein System kann technisch funktionieren und trotzdem schlecht sein.

Beispiel 1:

```text
Karawane erreicht Ziel.
```

Technisch korrekt. Aber: 1 Händler, 1 Wagen, keine Wachen, falsche Route, läuft durch Felsen, bleibt an Gebäuden hängen → trotzdem ein Qualitätsproblem.

Beispiel 2, neu, konkret beobachtet:

```text
Spieler betritt eine Mine, um einem Gegner zu entkommen.
Ergebnis: Verfolgung endet.
```

Technisch mag das "funktionieren" (kein Crash, keine Exception). Trotzdem: Wenn niemand entschieden hat, dass das so sein soll, ist es ein Design-Bug — ein unbeabsichtigtes Sicherheits-Schlupfloch, das die gesamte Bedrohlichkeit von Gegnern untergräbt, sobald der Spieler es einmal entdeckt hat.

Beispiel 3, neu, konkret beobachtet:

```text
Ein Gebäude steht in der Stadt.
```

Technisch korrekt gerendert. Aber: Sieht man ihm nicht an, was es ist (Haus? Lager? Schmiede?). Zu wenig Details, wirkt wie ein austauschbarer Block. → Qualitätsproblem, auch ohne Programmfehler.

Deshalb immer fragen:

> **Ist das Verhalten logisch, und sieht es dem Zweck des Objekts an, was es ist?**

Nicht nur:

> Funktioniert der Code?

---

## 10. „WARUM PASSIERT DAS?“-AUDIT

Während des gesamten Spiels aktiv nach Situationen suchen, bei denen ein Spieler denken würde:

* Warum ist das hier?
* Warum läuft der NPC dort hin?
* Warum hilft niemand?
* Warum spawnt dort ein Gegner?
* Warum reagiert die Wache nicht?
* Warum läuft der Händler weiter?
* Warum ist diese Karawane alleine?
* Warum laufen die Gegner durch die Wand?
* Warum verfolgt mich der tote Gegner?
* Warum ist diese Stadt leer?
* Warum gibt es dort keine Tiere?
* Warum passiert nach einem Verbrechen nichts?
* Warum reagieren NPCs nicht auf einen Kampf?
* **Warum sieht dieses Gebäude aus wie jedes andere, obwohl es angeblich eine Schmiede ist?**
* **Warum hat dieses Haus keine erkennbaren Details (Fenster, Tür, Dach, Schornstein, Beschilderung)?**
* **Warum hört der Gegner auf, mich zu verfolgen, sobald ich durch diese Tür/diesen Höhleneingang gehe?**
* **Warum steht diese Kiste genau hier, mitten im Nichts, ohne erkennbaren Zusammenhang?**
* **Warum sehen alle Kisten/Fässer in der ganzen Welt gleich aus, egal wo sie stehen?**

Wenn die Antwort lautet:

> „Weil der Code es eben so macht."

ist das **keine ausreichende Antwort**.


---

## 11. WORLD LOGIC AUDIT

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:game-development`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:agent-memory`

Die Welt soll auf Ereignisse reagieren.

Beispiel — Spieler wird in einer Stadt angegriffen:

Nicht:

```text
Gegner greift Spieler an
↓
Spieler kämpft
↓
alle NPCs laufen normal weiter
```

Sondern, abhängig von Situation:

```text
Gegner greift Spieler an
↓
Wache erkennt Kampf
↓
Wache bewertet Situation
↓
Wache greift möglicherweise ein
↓
Zivilisten reagieren
↓
Händler ziehen sich zurück
↓
Gegner kämpft oder flieht
↓
Wache verfolgt eventuell
↓
Kampf endet
↓
NPCs kehren zu ihren Tätigkeiten zurück
```

Nicht jeder NPC muss reagieren. Aber die Welt darf nicht völlig teilnahmslos sein.

Das gilt **ausdrücklich auch über Szenengrenzen hinweg** (Gebäude, Minen, Dungeon-Eingänge): Ein Kampf oder eine Verfolgung endet nicht automatisch, nur weil eine Ladezone/ein Kartenwechsel dazwischenliegt. Siehe Abschnitt 21.

---

## 12. NPC REACTION SYSTEM

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:game-development`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:testing`

Reaktionsmatrix — für jede Zelle sollte es eine bewusste, dokumentierte Antwort geben (auch wenn die Antwort "keine sichtbare Reaktion, aus Grund X" lautet):

| Ereignis | Wache | Verbündeter | Händler | Zivilist | Gegner (anderer) | Tier |
|---|---|---|---|---|---|---|
| Spieler wird angegriffen | ? | ? | ? | ? | ? | ? |
| Spieler greift neutralen NPC an | ? | ? | ? | ? | ? | ? |
| Spieler greift Händler an | ? | ? | ? | ? | ? | ? |
| Spieler tötet jemanden | ? | ? | ? | ? | ? | ? |
| Spieler wird bewusstlos | ? | ? | ? | ? | ? | ? |
| NPC wird bewusstlos | ? | ? | ? | ? | ? | ? |
| NPC stirbt | ? | ? | ? | ? | ? | ? |
| Gegner kommt in Stadt | ? | ? | ? | ? | ? | ? |
| Kampf neben Händler | ? | ? | ? | ? | ? | ? |
| Tier wird angegriffen | ? | ? | ? | ? | ? | ? |

Fülle diese Tabelle im GDD tatsächlich aus, bevor du das Verhalten implementierst — nicht danach als nachträgliche Rechtfertigung.

---

## 13. KNOCKDOWN / DOWNED STATE

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:game-development`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:testing`

Wenn der Spieler in einem freundlichen Gebiet bewusstlos wird:

```text
Spieler fällt
↓
Wachen erkennen Situation
↓
Verbündete reagieren
↓
Feinde reagieren
↓
Zivilisten reagieren
```

Mögliche Reaktionen — Wachen (helfen / Gegner bekämpfen / Gebiet sichern), Verbündete (heilen / helfen / Gegner bekämpfen), Händler (Abstand nehmen / fliehen), Zivilisten (Angst / Flucht / Hilfe holen), Gegner (weiter angreifen / Ziel wechseln / fliehen / Situation ausnutzen).

Die Reaktion muss zu Rolle, Fraktion, Entfernung und Gefahr passen.

---

## 14. DEATH STATE AUDIT

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-development`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:systematic-debugging`

Ein toter Gegner muss wirklich tot sein.

```text
HP = 0
↓
Death State (terminal)
↓
keine Bewegung, keine Zielauswahl, kein Pathfinding
↓
keine Angriffe, keine AI Decisions, keine Chase Logic
```

Keine Situationen wie: „Gegner liegt tot am Boden, bewegt sich aber weiter und verfolgt den Spieler." Death muss ein **terminaler AI-Zustand** sein — unabhängig davon, ob dazwischen ein Szenenwechsel liegt.

---

## 15. GUARD AUDIT

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:game-development`

Wachen sollen nicht nur Dekoration sein. Prüfe: Patrouillen, Sichtweite, Kampf-Erkennung, Bedrohungsbewertung, Eingreifen, Verfolgung, Rückkehr, Schutz wichtiger Orte, Verbrechen, bewusstlose Personen, feindliche NPCs, Alarmzustände.

Dabei keine übertriebene Simulation. Ein leichtgewichtiges, glaubwürdiges System reicht.

---

## 16. KARAWANEN AUDIT

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:testing`, `/spritecook:spritecook-animate-assets`, `/pixel-plugin:pixel-art-creator`

Eine Karawane sollte abhängig von ihrer Größe und ihrem Typ sinnvoll aufgebaut sein (Händler, Wagen, Tiere, Wachen, Reisende — nicht zwingend alles gleichzeitig). Eine große Handelskarawane darf nicht wie ein einzelner NPC aussehen.

Zusammensetzung nach Größe (Richtwert, im GDD verbindlich festlegen):

```text
Klein:    1 Händler + 1 Zugtier, evtl. 1 Wagen, keine/1 Wache
Mittel:   1-2 Händler + 1-2 Wagen + 2-3 Tiere + 1-2 Wachen
Groß:     2-3 Händler + 2-3 Wagen + mehrere Tiere + 3+ Wachen, evtl. Reisende
```

Prüfe: Route (Ziel, Weg, Geschwindigkeit, Hindernisse, alternative Routen), Formation (Wagen, Tiere, Händler, Wachen), Überfall (Wer kämpft? Wer flieht? Wer schützt wen? Was passiert mit Waren? Was passiert bei Tod? Kann die Karawane weiterreisen?), Visuals (Wagen detailliert, Tiere passend, Begleitung, klare Silhouetten, Animationen, Bewegung).

### Sichtbare Folgen bei Scheitern *(neu, Bezug zu "Welt fühlt sich leblos an")*

Eine Karawane, die es nicht schafft (überfallen und vernichtet, o. ä.), darf keine Konsequenz ohne sichtbare Spur sein:

```text
Wrackszene am Ort des Überfalls  – zerstörter Wagen, verstreute Waren, ggf. Leichen (siehe Abschnitt 14)
                                    bleiben eine Zeit lang als Szene sichtbar, nicht nur ein Datenbankeintrag
Gerücht/Nachricht                 – NPCs erfahren davon (siehe Abschnitt 79, NPC-Gerüchte) und sprechen
                                    darüber, wenn der Spieler in der Nähe ist
Wirtschaftliche Folge              – betroffene Stadt hat vorübergehend weniger/teurere Ware beim Händler,
                                    der auf diese Karawane gewartet hat
```

Das gilt symmetrisch: Erreicht eine Karawane ihr Ziel erfolgreich, darf auch das sichtbare Spuren haben (Warenangebot verbessert sich kurzzeitig, Händler erwähnt die Lieferung) — nicht nur beim Scheitern reagieren, sonst wirkt die Welt einseitig negativ statt lebendig.

---

## 17. PATHFINDING AUDIT

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:systematic-debugging`, `/agentic-awesome-skills:testing`

Alle beweglichen Einheiten testen: Spieler, NPCs, Händler, Wachen, Karawanen, Tiere, Gegner, Begleiter.

Suche: Wandlaufen, Feststecken, Kreisbewegungen, unnötige Umwege, falsche Ziele, Durchlaufen von Gebäuden/Objekten, Überlappungen, Teleportation, falsche Rückkehrpunkte.

**Zusätzlich, explizit prüfen — Pathfinding über Szenengrenzen:**

* Verfolgt ein Gegner den Spieler bis zu einer Gebäude-/Höhlentür? Bleibt er davor stehen, wartet er, gibt er auf? Ist das Verhalten konsistent und nachvollziehbar (siehe Abschnitt 21), oder bricht es einfach ab, weil die Engine die Innenkarte nicht kennt?
* Findet ein NPC nach einem Kartenwechsel wieder an eine sinnvolle Position zurück, statt an der Übergangskante hängen zu bleiben?

Wenn ein NPC falsch läuft: **Nicht nur seine Bewegung kaschieren.** Finde heraus: *Warum wurde dieses Ziel gewählt?*

---

## 18. SPAWN LOGIC AUDIT

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:testing`

Gegner nicht sinnlos random auf der Welt platzieren. Jeder Spawn sollte Kontext besitzen (Wolf → Wald/Wildnis, Bandit → Straßen/Lager, Skelett → Friedhof/Ruine/Dungeon, Untote → korrumpierte Gebiete, Goblin → Lager/Höhlen, Wache → Stadt/Tor/Straße/Grenzposten).

Spawn-Dichte ebenfalls prüfen. Nicht alle 5 Meter ein Gegner. Die Welt braucht Ruhe und Raum. Als Richtwert: Faustregel „mindestens X Sekunden ruhiges Gehen zwischen zwei potenziellen Begegnungen" pro Regionstyp im GDD festhalten und einhalten.

---

## 19. IMMERSION BREAKER AUDIT

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/pixel-plugin:pixel-art-creator`, `/spritecook:spritecook-animate-assets`

Suche aktiv nach:

* hässlichen Karawanen, zufälligen Gegnern, NPCs durch Wände, ignorierenden Wachen, statischen Tieren
* **generischen, detailarmen Gebäuden, die man nicht als das erkennt, was sie sein sollen**
* **zufällig platzierten, wenig detaillierten Deko-Objekten — insbesondere Kisten, Fässer, Kästen, die ohne erkennbaren Grund irgendwo herumstehen und/oder alle gleich aussehen**
* Feuer ohne Quelle, Wegen ins Nirgendwo, NPCs aufeinander, Gegnern direkt neben Spieler
* toten Gegnern mit AI, leeren Städten, sinnlosen Gebäuden
* **Gegnern/Verfolgungen, die beim Betreten von Innenbereichen kommentarlos verschwinden**
* fehlenden Konsequenzen, unlogischen Spawns

Jedes gefundene Beispiel wird als eigener Eintrag im Bug Ledger (Abschnitt 8) erfasst, Kategorie `IMMERSION`, `GEBÄUDE` oder `PROPS`.


---

## 20. GEBÄUDE-DESIGN & GEBÄUDE-AUDIT *(neu)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/pixel-plugin:pixel-art-creator`, `/spritecook:spritecook-animate-assets`, `/agentic-awesome-skills:architecture`

**Status (aktualisiert):** Der ursprünglich beobachtete Kernmangel — generische, funktionslose Gebäude — gilt laut Fortschrittsbericht als weitgehend behoben: echte Giebeldächer, 7 neue Haustypen mit eigener Silhouette/Einrichtung sowie ein dreistufiges Verfallssystem (gepflegt / heruntergekommen / verlassen) sind umgesetzt. Die konkrete Problemschilderung ist damit erledigt und wird hier nicht weiter wiederholt. Dieser Abschnitt bleibt trotzdem als **dauerhafter Qualitätsstandard** bestehen: jeder neue Gebäudetyp und jede neue/prozedurale Siedlung (siehe Abschnitt 77) muss die Definition of Done unten weiterhin erfüllen — Gebäude sind die primären Landmarken einer Stadt.

### Jedes Gebäude braucht eine erkennbare Identität

Bevor ein Gebäude gebaut wird, muss klar sein:

```text
Funktion:        Wohnhaus? Schmiede? Gasthaus? Lager? Wache? Tempel? Rathaus? Laden?
Bewohner/Nutzer:  Wer lebt/arbeitet hier? Wie viele?
Wohlstand:        Arm, einfach, wohlhabend, herrschaftlich?
Baumaterial:      Holz, Stein, Fachwerk, Lehm — passend zur Region
Alter/Zustand:    Neu, abgenutzt, verfallen, frisch repariert?
```

Diese Angaben gehören als Datensatz ins `DATA_SCHEMAS.md`, z. B.:

```json
{
  "id": "building_blacksmith_01",
  "type": "Schmiede",
  "wealthTier": "einfach",
  "material": "Stein/Holz",
  "footprintTiles": { "w": 4, "h": 3 },
  "exteriorFeatures": ["Esse mit Rauch", "Amboss sichtbar im Vorbau", "Werkzeuge an Außenwand", "Schild mit Hammer-Symbol"],
  "interior": true,
  "inhabitants": ["blacksmith_npc"],
  "lightSource": "Feuer/Glut sichtbar",
  "soundAmbient": "Hammerschläge"
}
```

### Mindest-Detailanforderungen (pro Gebäudetyp, nicht pro Einzelgebäude)

Jedes Gebäude, das der Spieler aus der Nähe sehen kann, braucht **mindestens**:

* ein klares Dach mit erkennbarem Material (Stroh, Schindel, Ziegel) und leichter Variation zur Nachbarschaft
* mindestens eine funktionsspezifische Außendetail-Ebene (Schmiede: Esse/Amboss/Rauch; Gasthaus: Schild/Fässer/Fenster mit Licht; Wachhaus: Waffenständer/Banner; Lager: Kisten/Fässer/Planen — siehe Abschnitt 22)
* Fenster und Tür, die zur Gebäudegröße passen (kein 2-stöckiges Haus mit einem winzigen Fenster)
* Wetterungs-/Materialdetails (nicht eine einzige flache Farbe pro Wand)
* eine Silhouette, die sich von benachbarten Gebäuden unterscheidet — kein Copy-Paste-Klon direkt daneben ohne Variation

### Keine Copy-Paste-Städte aus Boxen

Nicht:

```text
Haus A (Box mit Dach)
Haus B (Box mit Dach, andere Farbe)
Haus C (Box mit Dach, andere Farbe)
```

Sondern: Jede Stadt bekommt einen kleinen Satz an Basis-Gebäudetypen (siehe Abschnitt 36 – Städte), die jeweils **mit Funktion, Silhouette und Detailgrad** bewusst gestaltet sind, und die dann mit klar sichtbarer Variation (Fassadenfarbe, Anbauten, Verzierungen, Alterszustand) wiederverwendet werden — nicht 1:1 dupliziert.

### Interieur-Kohärenz

Wenn ein Gebäude betretbar ist:

* Die Innenraumgröße muss plausibel zur Außenkontur passen (kein winziges Haus mit riesigem Innenraum ohne erzählerischen Grund wie Magie).
* Die Inneneinrichtung muss zur Funktion passen (Schmiede innen: Amboss, Ofen, Werkbank — nicht ein leerer Raum mit einer zufälligen Kiste).
* Licht/Atmosphäre innen soll zur Außenwahrnehmung passen (wenn außen Feuerschein aus dem Fenster sichtbar ist, muss innen tatsächlich eine Feuerstelle existieren).

### Definition of Done — Gebäude

```text
[ ] Funktion ist von außen erkennbar, ohne dass der Spieler raten muss
[ ] Mindest-Detailebenen (siehe oben) vorhanden
[ ] Silhouette unterscheidet sich sichtbar von unmittelbaren Nachbargebäuden
[ ] Falls betretbar: Innenraum passt zu Außenkontur und Funktion
[ ] Kein reiner "Box mit Dach"-Platzhalter mehr im finalen Zustand
```

---

## 21. SZENENÜBERGÄNGE / INTERIOR-EXTERIOR-KONTINUITÄT *(neu)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:systematic-debugging`, `/agentic-awesome-skills:testing`

**Konkret beobachtetes Problem:** Wenn der Spieler von einem Gegner verfolgt wird und eine Mine (oder ein anderes Gebäude/Dungeon mit Kartenwechsel) betritt, endet die Verfolgung — der Gegner "vergisst" den Spieler kommentarlos. Das ist ein World-Logic-Bruch: Aus Spielersicht ist das entweder ein Exploit (Bedrohung wird bedeutungslos, sobald man weiß, dass jede Tür als Fluchtpunkt funktioniert) oder ein unglaubwürdiger Zustandsverlust.

### Grundregel

> **Ein Kartenwechsel (Szenenübergang) darf niemals ein AI- oder Kampfzustand stillschweigend zurücksetzen, nur weil die Engine zwei getrennte Karten lädt.**

Jeder Zustand, der beim Übergang betroffen sein könnte, muss **bewusst** behandelt werden:

```text
Aggro-/Verfolgungszustand
Kampfzustand (aktiver Kampf, Cooldowns, Debuffs)
Zeit (Tageszeit, laufende Timer)
Questzustand
Ruf/Verbrechen (falls der Spieler gerade eine Straftat begangen hat)
```

### Mögliche, bewusst zu wählende Lösungen (keine davon ist "automatisch richtig" — die Wahl muss dokumentiert werden)

**Option A — Verfolgung setzt sich fort:**
Der Gegner betritt die Innenkarte mit, sofern es dafür einen Grund gibt (Gegnertyp kann/darf hinein — z. B. ein Bandit kann in eine Mine folgen, ein Wolf eher nicht sinnvoll in ein Stadthaus).

**Option B — Gegner wartet/patrouilliert am Eingang:**
Der Gegner bleibt außen, patrouilliert sichtbar vor dem Eingang und ist noch da, wenn der Spieler wieder herauskommt — inklusive fortbestehendem Aggro, falls Sichtkontakt wiederhergestellt wird.

**Option C — bewusste "Safe Zone", aber mit Ansage:**
Falls bestimmte Innenbereiche als Rückzugsort gedacht sind (Designentscheidung, kein Zufall), muss das dem Spieler erkennbar/telegraphiert sein (z. B. eine Ladezone mit erkennbarem "geschütztem" Charakter, kein unmarkiertes Standard-Höhlenloch) — und diese Entscheidung gehört explizit ins GDD, nicht stillschweigend in den Code.

**Nicht akzeptabel:** Variante D — es passiert einfach nichts Definiertes, der Aggro verschwindet, weil der Übergang technisch nicht berücksichtigt wurde.

### Umsetzungshinweise

* Definiere pro Gegnertyp, ob er Innenkarten überhaupt betreten kann/darf (`canEnterInteriors: true/false` im Datensatz).
* Trage den Verfolgungs-/Kampfzustand explizit über den Kartenwechsel hinweg weiter (State wird beim Laden der Zielkarte übernommen, nicht implizit verworfen).
* Wenn ein Gegner am Eingang "wartet": Zeitlimit/Verhalten definieren (endlos warten wäre unrealistisch; nach Zeit X ggf. Rückkehr zur Patrouille, aber mit Restmisstrauen/erhöhter Wachsamkeit statt komplettem Reset).
* Dasselbe Prinzip gilt für alle anderen Übergänge: Stadttor ↔ Außenwelt, Dungeon-Ebene ↔ Dungeon-Ebene, Gebäude ↔ Gebäude.

### Testfälle (Pflicht, in `docs/BUGS.md`/Testplan aufnehmen)

```text
[ ] Verfolgung durch Bandit → Mineneingang → Verhalten prüfen
[ ] Verfolgung durch Wolf → Stadthaus-Eingang → Verhalten prüfen (sollte sich von Bandit unterscheiden, falls Wölfe keine Gebäude betreten)
[ ] Aktiver Kampf beim Kartenwechsel (Spieler flieht mitten im Schlagabtausch) → Zustand nach Rückkehr prüfen
[ ] Spieler verlässt Innenbereich wieder → ist der Gegner noch da / reagiert er korrekt?
[ ] Wiederholung an 3+ unterschiedlichen Gebäude-/Dungeontypen → konsistentes Verhalten?
```

### Definition of Done — Szenenübergänge

```text
[ ] Für jeden Gegnertyp ist definiert, ob/wie er Interieur-Übergängen folgt
[ ] Kein Übergang lässt Aggro/Kampfzustand kommentarlos verschwinden
[ ] Verhalten ist dokumentiert (GDD) und im Spiel konsistent nachvollziehbar
[ ] Alle Testfälle oben bestanden
```

---

## 22. PROPS / DEKORATION AUDIT (Kisten, Fässer & Co.) *(neu, Erweiterung von Abschnitt 19)*

**Verwende:** `/ponytail:ponytail`, `/pixel-plugin:pixel-art-creator`, `/spritecook:spritecook-animate-assets`, `/agentic-awesome-skills:game-design`

**Konkret beobachtetes Problem:** Kisten und ähnliche Deko-Objekte stehen "einfach irgendwo" in der Welt, sehen wenig detailliert aus und wirken wie generische Platzhalter statt wie Teil einer gestalteten Szene.

### Props brauchen denselben "Warum ist das hier?"-Test wie Gegner-Spawns

Jedes platzierte Prop (Kiste, Fass, Sack, Wagenladung, Werkzeug, Zaunstück, Möbelstück im Freien) muss einen erkennbaren Grund haben:

```text
Kisten/Fässer bei einem Händler/Lager    → Warenlogik: was ist plausibel drin, passt Menge zum Ort?
Kisten/Fässer bei einem Banditenlager    → Beutelogik: geplündertes Gut, unordentlicher gestapelt
Kisten/Fässer an einem Kai/Handelsposten → Warenumschlag: gestapelt, mit Seilen/Planen
Einzelne Kiste mitten in der Wildnis     → braucht einen NARRATIVEN Grund (verlorene Fracht,
                                            Überfallspur, altes Lager) — sonst: entfernen
```

Eine Kiste ohne jeden Kontext ist kein neutrales Füllelement, sondern ein Immersion Breaker (siehe Abschnitt 19) und wird als solcher behandelt.

### Detailanforderung

Props unterliegen denselben Qualitätsansprüchen wie in Abschnitt 25 (Visual Style Revision) für den Rest der Welt beschrieben: kleinere Pixelcluster, klare Materialdefinition (Holz-Maserung/-Bänder bei Kisten, Dauben/Reifen bei Fässern), Licht/Schatten, keine reinen Einfarb-Blöcke. Ein einzelnes gut gestaltetes Kisten-Set (2–3 Varianten: intakt, leicht beschädigt, aufgebrochen) ist besser als zehn identische generische Boxen.

### Variation statt Wiederholungs-Einerlei

* Mindestens 2–3 visuelle Varianten pro häufigem Prop-Typ (z. B. Kiste), damit nicht dieselbe Textur endlos dupliziert an jeder Straßenecke steht.
* Anordnung soll wie „hingestellt" wirken (leicht versetzt, gestapelt, an eine Wand gelehnt), nicht wie exakt im Raster platziert.
* Props dürfen NPC-/Gegner-Pfade nicht blockieren oder zu Pathfinding-Bugs führen (Abgleich mit Abschnitt 17).

### Definition of Done — Props

```text
[ ] Jedes häufig vorkommende Prop hat mind. 2-3 Detailvarianten
[ ] Platzierung folgt erkennbarer Logik (Händler/Lager/Beute/Narrativ), keine Zufallsstreuung ohne Grund
[ ] Kein Prop wirkt wie ein unfertiger Platzhalter (Blockfarbe ohne Material-/Lichtdetail)
[ ] Stichprobenartige Überprüfung: 10 zufällige Props in der Welt anklicken/betrachten und den
    "Warum ist das hier"-Test bestehen
```


---

## 23. VISUAL STYLE — GLOBALE ART DIRECTION

**Verwende:** `/ponytail:ponytail`, `/pixel-plugin:pixel-art-creator`, `/spritecook:spritecook-animate-assets`, `/agentic-awesome-skills:algorithmic-art`, `/agentic-awesome-skills:game-design`

Die bestehenden Referenzbilder definieren die **visuelle DNA** von Rotfall: Legacy. Nicht kopieren, nicht einfach nachbauen — die Referenzen als globale Stilgrundlage verwenden. Halte die verbindlichen Eckpunkte (Farbpalette, Pixel-Dichte, Kontur-Stil, Lichtwinkel) in `docs/STYLE_GUIDE.md` fest, damit sie nicht von Session zu Session driften.

Das betrifft: Charaktere, NPCs, Gegner, Bosse, Tiere, Waffen, Rüstungen, **Gebäude** (siehe Abschnitt 20), Terrain, Vegetation, **Props** (siehe Abschnitt 22), UI, Icons, VFX, Animationen, Porträts.

## 24. VISUAL STYLE REVISION

Der aktuelle Stil darf nicht einfach unverändert weiterproduziert werden.

Bekannte Probleme: zu blocky, zu grob, zu flach, zu wenig Details, zu generisch, zu große Pixelcluster, zu wenig Materialdefinition — **dies betrifft explizit auch Gebäude und Props, siehe Abschnitte 20 und 22.**

> **STATUS (neuer Schwerpunkt): Figuren-Sprites.** Bisherige Überarbeitungen betrafen vor allem Gelände, Fels, Wasser, Boden, Mauern (siehe Fortschrittsbericht Phase 5). Die Charaktere/Figuren selbst gelten weiterhin als zu blockig/detailarm und sollen sich, so weit im Pixelraster möglich, klar in Richtung des vom Nutzer bereitgestellten Referenzbildes bewegen (nicht kopieren, siehe Abschnitt 23 — als Stilrichtung verwenden). Das ist ausdrücklich ein eigener, noch offener Schwerpunkt, nicht mit dem Gelände-Durchgang aus Phase 5 bereits erledigt.

Ziel: kleinere Pixelcluster, bessere Konturen, organischere Formen, klarere Silhouetten, mehr Materialunterschiede, mehr Licht und Schatten, bessere Highlights, mehr Tiefe, mehr Layering, bessere Proportionen, mehr Mikrodetails.

Aber: **Keinen komplett neuen Stil erfinden.** Die vorhandene visuelle Identität bleibt erkennbar.

## 25. VISUAL QUALITY TEST AREA

**Verwende:** `/ponytail:ponytail`, `/pixel-plugin:pixel-art-creator`, `/spritecook:spritecook-animate-assets`

Bevor massenhaft neue Assets produziert werden: Erstelle einen kleinen Testbereich mit Spieler, NPC, Gegner, Waffe, Baum, Felsen, **Gebäude (mindestens 2 unterschiedliche Typen)**, Boden, **Props (Kiste in 2 Varianten)**, VFX, UI, Animation. Vergleiche alles miteinander.

Erst wenn diese Testumgebung visuell zusammenpasst und **alle enthaltenen Gebäude/Props die Definition of Done aus Abschnitt 20/22 erfüllen**: Mass Production starten.

---

## 26. SPRITE- UND ANIMATION-PIPELINE

**Verwende bei JEDEM Sprite-, Asset- oder Animations-Thema IMMER:** `/spritecook:spritecook-animate-assets`, `/pixel-plugin:pixel-art-creator`, `/ponytail:ponytail`

Animationen sind ein zentraler Bestandteil des Spiels. Nicht nur idle/walk/attack, sondern hochwertig:

```text
Idle, Walk, Run, Sprint
Attack Windup, Attack, Follow Through
Hit Reaction, Stagger, Knockback
Dodge, Roll, Dash
Block, Parry
Cast, Channel, Charge
Death, Knockdown, Get Up
Interactions (Türen öffnen, Kisten durchsuchen, Handeln, Sitzen)
Weapon-spezifische Animationen
```

Animationen müssen zur Silhouette und zum Gewicht der jeweiligen Figur passen.

## 27. COMBAT GAME FEEL

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:game-development`, `/agentic-awesome-skills:combat-design`, `/spritecook:spritecook-animate-assets`, `/pixel-plugin:pixel-art-creator`, `/agentic-awesome-skills:game-audio`

Jeder Angriff folgt möglichst:

```text
INPUT → GAMEPLAY → WINDUP → ANIMATION → IMPACT → HIT REACTION → VFX → SOUND → CAMERA → GAME FEEL
```

Bestehende Systeme behalten und weiter polieren: Hit Stop, Knockback, Impact VFX, Critical VFX, Camera Shake, Zoom Punch, Dash, Dodge, Trefferreaktionen. Combat darf nicht statisch wirken.

### Körperausrichtung statt lose folgender Waffe *(neu)*

**Konkret beobachtetes Problem:** Aktuell folgt nur die Waffe der Maus/dem Ziel, während der restliche Charakter starr in eine Richtung stehen bleibt. Das wirkt unglaubwürdig und bricht die Verbindung zwischen Absicht und Bewegung.

> **Der ganze Charakter soll sich (im Rahmen der Sprite-Möglichkeiten) zur Angriffsrichtung hin ausrichten — die Waffe ist Teil dieser Ausrichtung, nicht ein separat rotierendes Einzelteil.**

Konkret: Beim Zielen/Angreifen dreht sich zumindest der Oberkörper/die Blickrichtung des Sprites erkennbar zum Ziel, mit einer plausiblen Grenze (z. B. keine reine Rückwärts-Rotation ohne Beindrehung — wirkt sonst wie ein Turm-Torso). Wo das Sprite-System nur diskrete Richtungen (z. B. 8 Richtungen) unterstützt, soll die Ausrichtung zumindest in diesen Stufen mitgehen, statt komplett fix zu bleiben, während nur eine Waffen-Überlagerung rotiert. Das hängt eng mit dem in Abschnitt 34 beschriebenen Cheese-Problem zusammen: Ein Charakter, der sich nicht mitdreht, verstärkt den Eindruck eines starren, ausbeutbaren Systems.

**Definition of Done:**
```text
[ ] Sprite-Ausrichtung (nicht nur die Waffe) reagiert sichtbar auf Ziel-/Angriffsrichtung
[ ] Kein Fall, in dem die Waffe in eine Richtung zeigt, der Körper aber erkennbar in eine andere
[ ] Getestet mit mehreren Zielrichtungen (vorne, seitlich, hinten) inklusive Grenzfällen
```

## 28. DODGE / MOVEMENT

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:combat-design`, `/spritecook:spritecook-animate-assets`

Dodge soll echtes Gameplay sein. Prüfen: Richtung, Geschwindigkeit, i-Frames, Stamina, Cooldown, Animation, VFX, Sound, Camera Feel, Recovery. Kein bloßes Teleportieren.

### Ausdauer-System auch für Gegner *(neu)*

**Designwunsch:** Nicht nur der Spieler soll eine Ausdauer-Ressource haben — Gegner ebenfalls, mit einer bewussten Asymmetrie.

> **Gegner bekommen eine eigene Ausdauer-Ressource, die tendenziell etwas höher ist als die des Spielers.**

Das begrenzt Gegner-Aktionen genauso wie beim Spieler (Angriffsfrequenz, Block, Ausweichen), verhindert aber, dass der Spieler Gegner trivial "aushungern" kann, indem er nur wartet, bis ihnen die Ausdauer ausgeht — das würde denselben Cheese-Effekt erzeugen wie das Rückwärtslaufen-Problem aus Abschnitt 34, nur ressourcenbasiert statt positionsbasiert. Richtwert: Gegner-Ausdauer-Maximum ca. 110–130 % des Spieler-Ausdauer-Maximums, regeneriert ähnlich, aber nicht identisch (unterschiedliche Regenerationsraten je Gegnertyp sind erlaubt und erwünscht — ein Elite-Gegner regeneriert schneller als ein einfacher Bandit). Dieses Feld gehört ins Gegner-Datenblatt (Abschnitt 33).

**Definition of Done:**
```text
[ ] Jeder Nahkampfgegner hat eine eigene Ausdauer-Ressource mit dokumentiertem Maximum
[ ] Gegner-Ausdauer liegt im Regelfall über der Spieler-Ausdauer (Richtwert 110-130 %)
[ ] Ausdauer-Erschöpfung beim Gegner hat eine sichtbare Folge (Taumeln, Pause, offene Deckung —
    Bezug zu Abschnitt 26/64, Trefferreaktionen), nicht nur eine interne Zahl
[ ] Getestet: reines Abwarten/Zermürben ohne aktiven Kampf führt NICHT zuverlässig zum Sieg
```


---

## 29. WEAPON EXPANSION

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/spritecook:spritecook-animate-assets`, `/pixel-plugin:pixel-art-creator`

Die bestehenden 13 Waffen erhalten. Danach erweitern. Mögliche Typen: Short Sword, Longsword, Greatsword, Dagger, Rapier, Axe, Great Axe, Mace, Warhammer, Spear, Halberd, Bow, Crossbow, Staff, Wand, Rune Weapons.

Jede Waffenklasse braucht ein eigenes Gefühl, nicht nur andere Werte. Unterschiede bei Reichweite, Geschwindigkeit, Schaden, Stagger, Recovery, Animation, Hitbox, VFX, Sound, Combo, Spielstil.

### Datenschema (Vorlage für `docs/DATA_SCHEMAS.md`)

```json
{
  "id": "weapon_greatsword_01",
  "class": "Greatsword",
  "range": "lang",
  "speed": "langsam",
  "staggerPower": "hoch",
  "recovery": "lang",
  "comboPattern": ["heavy", "heavy", "finisher"],
  "hitbox": { "shape": "arc-wide", "activeFrames": [8, 14] },
  "animationSet": "greatsword_v1",
  "vfxOnHit": "slash_heavy",
  "soundOnSwing": "sw_heavy_swing",
  "soundOnHit": "sw_heavy_impact",
  "rarityAffixSlots": 0
}
```

### Design-Leitplanken pro Waffenklasse (Beispiel-Matrix, im GDD verbindlich ausfüllen)

| Klasse | Stärke | Schwäche | Idealer Spielstil |
|---|---|---|---|
| Dagger | schnell, hoher Crit | wenig Stagger, kurze Reichweite | Hit-and-run, Rücken angreifen |
| Greatsword | hoher Schaden, Stagger | langsam, lange Recovery | Positionierung, geduldiges Timing |
| Spear | Reichweite, gute Kontrolle | mittlerer Schaden | Abstand halten, kontern |
| Bow | Distanz, kein Nahkampfrisiko | Munition/Stamina, schwach im Nahkampf | Kiting, Vorbereitung |
| Staff | Flächenwirkung, Magie-Skalierung | Ressourcenmanagement (Mana) | Kontrolle, Setup |

---

## 30. RARITY SYSTEM

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:economy-design`

Raritäten: Common, Uncommon, Rare, Epic, Legendary, Mythic.

Rarität darf nicht nur eine Farbe sein. Sie beeinflusst Affixes, Stats, Modifier, Special Effects, Drop Chance, visuelle Details, eventuell einzigartige Mechaniken.

### Affix-Rahmen (Vorlage)

```text
Common:     keine Affixe, Basiswerte
Uncommon:   1 kleiner Affix (z. B. +Stat)
Rare:       2 Affixe (z. B. +Stat, +Sekundäreffekt)
Epic:       3 Affixe, davon mind. 1 spürbar spielstil-verändernd
Legendary:  fester, einzigartiger Effekt + 1-2 Affixe, eigener visueller Glanz/Partikeleffekt
Mythic:     einzigartiger Gegenstand mit Namen, eigenem Aussehen, eigener Mechanik — kein Zufalls-Loot
```

Drop-Chancen degressiv gestalten (jede Stufe deutlich seltener als die vorherige) und im GDD als Tabelle mit konkreten Prozentwerten festhalten, damit sie nicht willkürlich im Code verteilt werden. Loot muss kontrolliert bleiben — keine komplett zufällige Müllflut.

---

## 31. SKILL TREE

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:frontend-design`, `/agentic-awesome-skills:architecture`

Baue einen richtigen Skill Tree mit den Bereichen COMBAT, MAGIC, SURVIVAL.

Knoten können passiv, aktiv, Spezialisierungen, Keystones oder build-definierende Fähigkeiten sein.

Wichtig: Der Skill Tree soll echte Entscheidungen erzeugen — nicht nur `+2% Schaden, +2% Schaden, +2% Schaden` als einzige Knotenform.

### Knoten-Vorlage

```json
{
  "id": "skill_combat_keystone_berserker",
  "branch": "COMBAT",
  "type": "keystone",
  "requires": ["skill_combat_node_12", "skill_combat_node_13"],
  "effect": "Schaden +25% bei HP < 30%, aber eingehender Schaden +15%",
  "designIntent": "Risiko/Belohnung-Build für aggressive Spielweise, Gegenpol zu defensiven Keystones"
}
```

Jeder Keystone-Knoten braucht ein `designIntent`-Feld — welches Spielerlebnis er ermöglichen soll. Ohne klare Intention keine Aufnahme in den Baum.

---

## 32. KLASSEN *(erweitert)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:game-development`, `/spritecook:spritecook-animate-assets`

**Designwunsch:** Mehr Klassen insgesamt. Wichtiger Sonderfall, der eigenes Gewicht bekommt: **Nekromant und Hexenmeister sollen keine gewöhnliche Charaktererstellungs-Option sein, sondern über eine Quest mit der Untoten-Fraktion im Totenreich freigeschaltet werden.** Details dazu in Abschnitt 78 — dieser Sonderfall ist die wichtigste Ergänzung in diesem Bereich und wird dort ausführlich behandelt, nicht hier in der einfachen Liste.

### Startklassen (bei Charaktererstellung wählbar)

Warrior, Paladin, Berserker, Ranger, Rogue, Assassin, Mage — erweitert um:

```text
Druide       – Naturmagie, Tierbegleiter, Verwandlungs-/Ranken-Fähigkeiten
Barde        – Unterstützung durch Musik/Präsenz, Buffs für Verbündete, Debuffs/Verwirrung für Gegner
Mönch        – unbewaffneter/faustwaffen-naher Kampf, eigene Ressource (Chi/Fokus statt Mana),
               hohe Mobilität, Kombo-lastig
Kleriker      – reiner Support/Heiler, bewusst weniger offensiv als der Paladin, dafür
               Gruppenwert durch Heilung/Schutz-Auren
Alchemist     – Tränke, Gifte, Wurfbomben als Kern-Ressource statt klassischer Waffen-Skalierung
Kopfgeldjäger – Fernkampf, Fallen, Tracking-Fähigkeiten (Spurenlesen, siehe evtl. Verbindung zu
               Abschnitt 44, Verbrechen/Konsequenzen)
```

**Wichtig:** Nekromant und Hexenmeister erscheinen **nicht** mehr in dieser Startliste — sie werden ausschließlich über Abschnitt 78 freigeschaltet. Das ist eine bewusste Design-Entscheidung (im GDD als solche festhalten), kein Fehler in der Aufzählung.

Klassen sollen sich unterscheiden durch Waffen, Fähigkeiten, Animationen, Ressourcen, Spielstil, Skill Tree, Stärken, Schwächen — keine bloßen Stat-Modifikatoren.

### Klassen-Vorlage

```text
Name:
Kernfantasie (1 Satz):
Primärwaffen:
Ressource (Stamina/Mana/Rage/Chi/...):
3 Signature-Fähigkeiten:
Stärke (was macht die Klasse besonders gut?):
Schwäche (wo ist die Klasse bewusst schlechter?):
Bevorzugter Skill-Tree-Pfad:
```

Eine Klasse ohne definierte Schwäche ist ein Balancing-Risiko — jede Klasse braucht einen ehrlichen Nachteil. Diese Vorlage gilt auch für Nekromant/Hexenmeister aus Abschnitt 78, ergänzt um die dortigen zusätzlichen Felder (Freischalt-Bedingung, Fraktionskonsequenz).

---

## 33. ENEMY EXPANSION

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:game-development`, `/spritecook:spritecook-animate-assets`, `/pixel-plugin:pixel-art-creator`

Neue Gegner in Kategorien:

```text
Humanoid:  Bandits, Raiders, Warriors, Archers, Assassins, Cultists
Undead:    Skeletons, Zombies, Wraiths, Necromancers, Elite Undead
Animals:   Wolves, Boars, Bears, Wild Dogs, Deer (nicht jedes Tier ist ein Gegner)
Monsters:  eigene Silhouetten, Bewegungen und Angriffe
```

### Gegner-Datenblatt (Vorlage)

```text
Name:
Kategorie:
Verhalten (1-2 Sätze, siehe Abschnitt 34):
Angriffe (Liste mit Telegraph/Windup):
Stärken:
Schwächen:
Loot-Tabelle:
Passende Spawnregion (siehe Abschnitt 18):
Geräusche (Idle/Aggro/Attack/Death):
canEnterInteriors: true/false (siehe Abschnitt 21)
```

Jeder Gegner benötigt eigenes Verhalten, eigene Animation, eigene Angriffe, Stärken, Schwächen, Loot, passende Spawnregion, passende Geräusche.

### Längerfristiges Ziel: deutlich intensivere Gegner, Rüstungen, Waffen, Fähigkeiten *(aktualisiert — jetzt Teil des Balancing-Updates, Abschnitt 82)*

**Designwunsch:** Insgesamt sollen Gegner, Rüstung, Waffen und Fähigkeiten spürbar "krasser"/eindrucksvoller werden. **Status-Update:** Dieser Punkt war ursprünglich bewusst niedrig priorisiert (nach den Grundlagen-Korrekturen). Mit dem expliziten Balancing-Update-Wunsch (Abschnitt 82: „Spiel und Bosse sind zu leicht") ist er jetzt aktiv beauftragt, allerdings in der dort beschriebenen Reihenfolge — erst Verhaltens-/Mechanik-Fixes (BUG-076 Rückwärtslaufen, Anti-Kiting Abschnitt 34), dann neue Gegner/Waffen/schwierigere Gebiete. Bei jeder neuen Welle intensiverer Gegner/Ausrüstung gilt weiterhin Abschnitt 66 (keine Copy-Paste-Content-Fabrik) — "krasser" heißt eigene Identität und spürbaren Unterschied, nicht nur höhere Zahlen.

## 34. ENEMY AI

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:game-development`, `/agentic-awesome-skills:combat-design`

Bestehende AI weiterentwickeln (Wolf springt an, Goblin greift an und weicht zurück, Skelett kündigt Angriffe an). Noch eigene Verhaltensweisen für Bandit, Archer, Boss.

AI soll nicht nur `find player → move player → attack` sein. Nutze abhängig vom Gegner: Distanz, Aggression, Flucht, Gruppenverhalten, Positionierung, Angriffsvorbereitung, Cooldowns, Zielpriorität, Terrain, Verbündete, Spielerzustand.

**Zusätzlich verbindlich (siehe Abschnitt 21):** Für jeden Gegnertyp muss das Verhalten bei Szenenübergängen (Interieur betreten, Kartenwechsel) explizit definiert sein — kein stillschweigender Aggro-Reset.

**Zusätzlich verbindlich (siehe Abschnitt 72):** Für jeden Gegnertyp muss explizit feststehen, ob er zur kleinen Gruppe der level-skalierenden Sondergegner gehört oder zur Mehrheit der statischen Regionsgegner. Diese Zuordnung ist Teil des Gegner-Datenblatts (Abschnitt 33), nicht optional.

### Gegen "Rückwärtslaufen-Cheese" — Gap-Closer/Sonderangriffe *(neu)*

**Konkret beobachtetes Problem:** Viele Gegner lassen sich aushebeln, indem der Spieler rückwärts läuft und dabei weiter angreift — der Gegner läuft einfach hinterher, ohne die Distanz je zu schließen oder die Taktik zu bestrafen.

> **Jeder Nahkampfgegner (mit Ausnahme bewusst sehr langsamer/schwerfälliger Typen, die das als Charakterzug haben) braucht mindestens eine Fähigkeit, die reines Rückwärtslaufen-und-Zuschlagen bestraft.**

Mögliche Bausteine, je nach Gegnertyp im GDD festzulegen:

```text
Hechtsprung/Ausfallschritt  – schließt bei erkannter Fluchtdistanz plötzlich die Lücke,
                               mit kurzem, aber fairem Telegraph (siehe Abschnitt 71, Telegraphing-Prinzip)
Wurfangriff/Fernattacke     – manche Gegnertypen bekommen eine kurze Reichweiten-Option
                               (Wurfwaffe, kurzer Zauber), damit reine Rückwärtsbewegung nicht
                               automatisch sicher ist
Tempo-Anpassung             – ein Gegner, der seit X Sekunden erfolglos verfolgt, wird kurzzeitig
                               schneller/aggressiver ("Nicht-mehr-nachgeben"-Phase), statt endlos
                               im selben Abstand zu folgen
Gruppentaktik                – bei mehreren Gegnern: einer hält Druck von vorne, ein zweiter
                               versucht zu flankieren, statt beide stur in einer Linie zu folgen
```

Nicht jeder Gegner braucht alle Bausteine — aber jeder Gegner braucht **mindestens einen**, der im Gegner-Datenblatt (Abschnitt 33) dokumentiert ist.

**Definition of Done:**
```text
[ ] Jeder Nahkampfgegner hat mindestens einen dokumentierten Anti-Kiting-Baustein
[ ] Cheese-Test durchgeführt: gegen jeden Gegnertyp bewusst rückwärtslaufend angreifen —
    der Gegner darf den Kampf dadurch nicht trivial verlieren
[ ] Gap-Closer-Angriffe sind fair telegraphiert (Abschnitt 71), kein unausweichlicher Instant-Hit
```

## 35. BOSSES

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/spritecook:spritecook-animate-assets`, `/pixel-plugin:pixel-art-creator`, `/agentic-awesome-skills:game-audio`

Jeder größere Boss braucht eigene Arena, eigene Silhouette, eigene Animationen, eigene Angriffe, Telegraphing, Phasen, VFX, Sound, Atmosphäre, einzigartige Loot-Drops.

### Boss-Vorlage

```text
Name:
Arena (Besonderheiten, Umgebungsgefahren):
Phase 1 (HP 100-70%): Angriffsmuster, Tempo
Phase 2 (HP 70-30%): neue Mechanik, erhöhte Aggression
Phase 3 (HP <30%): Verzweiflungsphase, Telegraph-Zeit ggf. kürzer aber fairer lesbar
Telegraph-Sprache: wie kündigt der Boss jeden Angriff visuell/akustisch an?
Einzigartiger Loot:
```

Bosskämpfe sollen nicht einfach normale Gegner mit mehr HP sein.

**Zwei Boss-Kategorien unterscheiden:** klassische "Set-Piece"-Bosse am Ende eines Dungeons/einer Quest (dieser Abschnitt), und **regionale, weltgebundene Bosse mit dauerhaften Konsequenzen** nach Kenshi-Vorbild — siehe Abschnitt 73. Ein regionaler Boss erfüllt zusätzlich zur hier beschriebenen Kampfqualität auch die Welt-Konsequenz-Anforderungen aus Abschnitt 73.

## 36. VFX

**Verwende:** `/ponytail:ponytail`, `/pixel-plugin:pixel-art-creator`, `/spritecook:spritecook-animate-assets`, `/agentic-awesome-skills:algorithmic-art`, `/agentic-awesome-skills:shader-programming`

Bestehende VFX erhalten: Slash, Impact, Critical, Blood, Bone, Healing, Blessing, Fireball, Shadow Lightning, Dodge, Death.

Fehlende Effekte: Ice, Lightning — nur implementieren, wenn sie tatsächlich Gameplay-Nutzung erhalten.

VFX sollen lesbar, stilvoll, nicht blocky, nicht überladen, timing-genau sein.


---

## 37. WELT / MAP

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/pixel-plugin:pixel-art-creator`, `/agentic-awesome-skills:algorithmic-art`

Bestehende: 512×512 Tiles, 26 Orte, Totenreich, Bodendetails, Übergänge, Grubenpfad Vertical Slice.

**Totenreich, Priorität:** Die dort bestehenden leeren Flächen (offener Bug) sollen vorrangig über die Nekromant/Hexenmeister-Questkette gefüllt werden, siehe Abschnitt 78 — nicht als separate, unabhängige Content-Aufgabe.

Der **Grubenpfad** dient als Qualitätsmaßstab. Die restliche Welt muss schrittweise auf diese Qualität gebracht werden — aber nicht durch simples Kopieren.

## 38. MAP VISUAL IDENTITY

Die Map soll nicht aus zufällig verteilten Dekorationen bestehen. Jede Region braucht eigene Landschaft, Farbwirkung, Vegetation, Gebäude, Landmarken, Gegner, Atmosphäre, Environmental Storytelling.

Objekte müssen Kontext besitzen. Nicht „Ich brauche noch fünf Bäume", sondern „Warum wachsen hier diese Bäume?" — dasselbe Prinzip gilt für Gebäude (Abschnitt 20) und Props (Abschnitt 22).

Jede Region bekommt zusätzlich eine festgelegte Gefahrenstufe (siehe Abschnitt 71, Schwierigkeitsregionen), die sich auch visuell in der Art Direction niederschlagen soll — eine Stufe-3-Region soll man ihrer Atmosphäre nach von einer Stufe-1-Region unterscheiden können, bevor der erste Gegner überhaupt sichtbar ist.

## 39. STÄDTE

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/pixel-plugin:pixel-art-creator`, `/spritecook:spritecook-animate-assets`

Jede größere Stadt bekommt eigene Identität. Mögliche Bereiche: Marktplatz, Wohnviertel, Händler, Schmied, Lager, Wachen, Straßen, Plätze, besondere Gebäude, Außenbereiche, Tore, Mauern, Nebenstraßen.

**Gebäude in Städten unterliegen zwingend den Anforderungen aus Abschnitt 20** (erkennbare Funktion, Mindest-Detailebene, keine Copy-Paste-Klone). Eine Stadt, deren Häuser alle wie derselbe Block mit anderer Farbe wirken, gilt nicht als abgeschlossen.

Keine Copy-Paste-Städte.

### Stadt-Vorlage

```text
Name:
Wirtschaftliche Rolle (Handelsknoten? Bergbau? Landwirtschaft? Militärposten?):
Vorherrschende Fraktion/Herrschaft:
Gebäude-Set (min. 6-8 funktional unterschiedliche Typen):
Besondere Landmarke:
Atmosphäre in 3 Adjektiven:
```

## 40. DUNGEONS

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:level-design`, `/pixel-plugin:pixel-art-creator`, `/spritecook:spritecook-animate-assets`

Mögliche Dungeon-Typen: Höhlen, Minen, Ruinen, Friedhöfe, Festungen, Banditenlager, Schreine, Tempel, Schlachtfelder, versteckte Orte.

Jeder Dungeon soll einen Grund besitzen, dort zu existieren.

**Jeder Dungeon-Eingang unterliegt zwingend den Regeln aus Abschnitt 21** (Szenenübergänge): Verfolgungs-/Kampfzustand beim Betreten muss bewusst behandelt sein, nicht stillschweigend verworfen werden. Das gilt besonders für Minen, da genau dort das Problem konkret beobachtet wurde.

### Dungeon-Vorlage

```text
Name/Typ:
Grund der Existenz (Narrativ):
canEnterInteriors-Verhalten für verfolgende Gegner (siehe Abschnitt 21):
Gegner-Roster (thematisch passend, siehe Abschnitt 18):
Besonderer Encounter/Boss (falls vorhanden):
Loot-Thema:
```

**Hinweis:** Dieser Abschnitt beschreibt handgeplante Dungeons mit festem Layout. Für sich bei jedem Betreten neu generierende Dungeons siehe Abschnitt 76 (Prozedurale Dungeons) — beide Typen können nebeneinander existieren.

---

## 41. NPC SYSTEM & TAGESRHYTHMUS *(deutlich erweitert)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/spritecook:spritecook-animate-assets`, `/agentic-awesome-skills:agent-memory`

NPC-Typen: Farmer, Händler, Schmied, Wachen, Reisende, Jäger, Priester, Handwerker, Soldaten, Adelige.

**Designwunsch (Erweiterung):** Ein pauschaler „Arbeit tagsüber, Zuhause nachts"-Ablauf reicht nicht mehr. NPCs sollen **rollenspezifische** Tagesrhythmen bekommen: Jäger gehen tatsächlich jagen, Händler öffnen und schließen ihren Laden zu festen Zeiten sichtbar, und NPCs suchen sich gegenseitig auf, um zu reden — nicht nur mit dem Spieler zu interagieren.

> **STATUS (weiterhin ungelöst):** Laut PHASE_STATUS ist "Bewohner mit Tagesablauf ✓" bereits umgesetzt, der Nutzer erlebt die NPCs aber weiterhin als untätig herumstehend. Auch hier gilt die Reality-Check-Regel aus Abschnitt 58: Ein bestandener Selbsttest belegt nur, dass ein Zeitplan-Datensatz existiert und ausgeführt wird — nicht, dass die NPCs dabei sichtbar und überzeugend wirken. Vor erneutem "Abgeschlossen"-Status: tatsächlich mehrere NPCs über mehrere Minuten Spielzeit beobachten, nicht nur die Ausführung des Schedulers prüfen.

### Grundregel gegen "dumm herumstehen" *(neu, verschärft)*

> **Ein NPC ist niemals im reinen, animationslosen Stillstand. Jeder Aktivitätsblock hat eine sichtbare Handlung — auch "Pause"/"Gespräch"/"Wache halten" sind Handlungen mit eigener Idle-Variante, keine Leerlauf-Pose.**

Konkret: Wache-Halten bekommt eine eigene Wach-Idle (umschauen, Gewicht verlagern, gelegentlich patrouillieren statt fixiert stehen), Werkstattarbeit hat eine wiederkehrende Arbeitsanimation (nicht nur am Fleck stehen mit Werkzeug in der Hand), Wartezeiten zwischen Aktivitätsblöcken werden mit kurzen Zufalls-Idles überbrückt (sich strecken, Werkzeug prüfen, kurz umschauen). Ein NPC, der länger als wenige Sekunden exakt regungslos in derselben Pose verharrt, gilt als Bug (Kategorie `IMMERSION`, Bug Ledger Abschnitt 8).

### Grundprinzip

> **Jede NPC-Rolle bekommt einen eigenen, plausiblen Tagesplan aus 3–6 Aktivitätsblöcken — kein Einheits-Zeitplan für alle.**

Weiterhin gilt: keine unnötige High-End-Simulation, nur genug, damit die Welt lebendig wirkt. Das Ziel ist ein überzeugender Eindruck, keine vollständige Wirtschaftssimulation.

### Rollen-Zeitpläne (Richtwerte, im GDD pro Rolle verbindlich festlegen)

| Rolle | Vormittag | Mittag/Nachmittag | Abend | Nacht |
|---|---|---|---|---|
| Jäger | zieht los in die Wildnis (Jagdgebiet der Region, siehe Abschnitt 18) | jagt, kehrt mit Beute zurück | liefert Beute ab (Markt/Küche), danach Schenke | zuhause |
| Händler | öffnet Laden (Tür/Schild-Animation „offen") | verkauft, feilscht, Ware auffüllen | schließt Laden (Schild „geschlossen", Fensterladen zu) | zuhause |
| Wache | Schichtwechsel/Patrouille (siehe Abschnitt 15) | Patrouille/Torwache | Schichtwechsel, evtl. Schenkenbesuch | Nachtwache (reduzierte Besatzung) |
| Bauer | Feldarbeit | Feldarbeit/Markt | Heimweg, Nachbarschaftsgespräch | zuhause |
| Priester | Morgengebet/Tempel öffnen | Gespräche mit Bewohnern, Segnungen | Abendgebet | Tempel/zuhause |
| Handwerker | Werkstatt öffnen, Arbeit | Arbeit, Kundengespräche | Werkstatt schließen | zuhause |

### Soziale Interaktionen — NPCs reden miteinander

Definiere **„Talk Pairs"**: NPCs, die sich kennen (Nachbarn, Kollegen, Familie, Wache↔Wache im Schichtwechsel), suchen sich zu bestimmten Tageszeiten aktiv auf und führen eine kurze, leichtgewichtige Interaktion aus — eine Sprechblasen-Animation/Icon-Austausch von wenigen Sekunden reicht, **kein vollständiger Dialogbaum nötig**. Das genügt, damit die Stadt nicht wie eine Ansammlung isolierter Automaten wirkt, sondern wie eine Gemeinschaft.

Typische Gelegenheiten: Marktplatz-Schwatz tagsüber, Schenke/Dorfplatz abends, Nachbarn vor dem Haus.

### Datenschema (Vorlage für `docs/DATA_SCHEMAS.md`)

```json
{
  "npcId": "npc_hunter_03",
  "role": "Jäger",
  "schedule": [
    { "start": "06:00", "end": "07:00", "activity": "wake_up", "location": "home" },
    { "start": "07:00", "end": "13:00", "activity": "hunt", "location": "region_forest_zone_2", "animation": "walk_hunt_idle" },
    { "start": "13:00", "end": "14:00", "activity": "deliver_goods", "location": "market_stall_04" },
    { "start": "14:00", "end": "19:00", "activity": "socialize", "location": "tavern", "talkPairs": ["npc_farmer_11", "npc_guard_07"] },
    { "start": "19:00", "end": "06:00", "activity": "sleep", "location": "home" }
  ]
}
```

### Unterbrechung & Wiederaufnahme (Pflicht — sonst kollidiert es mit Abschnitt 11/12)

Der Tagesrhythmus muss unterbrechbar sein (Kampf, Alarm, Wetter, Verbrechen des Spielers — siehe Abschnitt 11, World Logic Audit, und Abschnitt 12, NPC Reaction System) und **danach sinnvoll fortgesetzt werden**: entweder Rückkehr zum aktuellen Aktivitätsblock oder Sprung zum nächstpassenden Zeitfenster — nicht ein harter Reset auf 06:00. Das ist derselbe Grundsatz wie bei Szenenübergängen (Abschnitt 21): Zustände dürfen nicht kommentarlos verschwinden.

### Performance-Hinweis

Nicht jeder NPC in der ganzen Welt muss gleichzeitig vollständig simuliert werden. Für NPCs außerhalb des sichtbaren/geladenen Bereichs reicht eine vereinfachte Zeitplan-Logik („welcher Aktivitätsblock wäre laut Uhrzeit gerade aktiv" → Position/Zustand direkt setzen, statt durchgehend zu pfadfinden). Volle Simulation mit Bewegung/Pathfinding nur für geladene/sichtbare NPCs — siehe Abschnitt 50 (Performance).

### Definition of Done — Tagesrhythmus

```text
[ ] Jede NPC-Rolle hat einen eigenen, im GDD dokumentierten Tagesplan (mind. 3-6 Blöcke)
[ ] Jäger verlassen die Siedlung sichtbar Richtung Jagdgebiet und kehren mit erkennbarem Ergebnis zurück
[ ] Händler öffnen/schließen ihren Laden sichtbar (Tür/Schild), nicht nur eine interne Statusvariable
[ ] Mindestens ein Satz an "Talk Pairs" pro Siedlung ist definiert und im Spiel beobachtbar
[ ] Unterbrechung durch Kampf/Alarm führt nachweislich zu sinnvoller Wiederaufnahme, kein Reset auf Tagesbeginn
[ ] Performance bleibt im Budget (Abschnitt 50) bei voller Einwohnerzahl einer großen Stadt
```

## 42. WILDLIFE

**Verwende:** `/ponytail:ponytail`, `/spritecook:spritecook-animate-assets`, `/pixel-plugin:pixel-art-creator`, `/agentic-awesome-skills:game-design`

Tiere: Deer, Boar, Horses, Dogs, Birds, Wolves, weitere passende Tiere. Nicht jedes Tier muss kämpfen — Tiere sollen auch einfach existieren können.

---

## 43. FRAKTIONEN & WELTSIMULATION

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:agent-memory`

Die Welt soll langfristig dynamischer werden. Mögliche Systeme: Patrouillen, Wachen, Karawanen, Lager, Grenzposten, Konfliktzonen, Händler, Reisende, Überfälle, Kriege, Fraktionsbewegungen.

Fraktionen sollen nicht nur UI-Werte sein. Ruf-Skala z. B.:

```text
Verhasst → Feindlich → Misstrauisch → Neutral → Freundlich → Verbündet → Vertraut
```

Jede Stufe sollte mindestens eine spürbare Gameplay-Konsequenz haben (Preise, Zugang, Begrüßung, Wachreaktion).

**Wichtigster Auslöser für spürbare Fraktionsverschiebungen:** der Tod eines regionalen Bosses/Fraktionsführers — siehe Abschnitt 73 (Regionale Bosse & Welt-Konsequenzen, Kenshi-Style). Die dortige Konsequenz-Liste (Machtverschiebung, Gebietskontrolle, Machtvakuum-Risiko) ist die praktische Umsetzung dieses Abschnitts.

**Zweitwichtigster Auslöser:** Raids (siehe Abschnitt 74) — Fraktionskonfliktstatus ist einer der zentralen Trigger-Faktoren dafür, ob und wen ein Raid als Nächstes trifft.

## 44. VERBRECHEN / KONSEQUENZEN

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`

Das vorhandene Strg-Angriff-/Rufsystem und die Reaktionen auf Angriffe gegen Neutrale weiterentwickeln. Fehlende Systeme: Verbrechen, Kopfgeld, Wachenverfolgung, langfristige Konsequenzen.

Nicht sofort maximal komplex machen, aber das Grundsystem logisch aufbauen:

```text
Straftat begangen (Diebstahl/Angriff/Mord)
↓
Wurde es bezeugt? Von wem?
↓
Zeuge meldet es (ggf. verzögert, ggf. gar nicht bei fehlendem Zeugen)
↓
Kopfgeld steigt
↓
Wachen reagieren bei Sichtkontakt (Festnahmeversuch/Kampf, je nach Schwere)
↓
Konsequenz: Gefängnis/Bußgeld/Ruf-Verlust
```

## 45. QUESTS

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`

Bestehende Quests behalten. Später erweitern um Combat, Exploration, Escort, Delivery, Hunting, Investigation, Faction, Dungeon, Boss, World Events. Quests sollen mit der Welt verbunden sein.

### Quest-Vorlage

```text
Titel:
Typ:
Auslöser:
Beteiligte NPCs/Fraktionen:
Ziel:
Konsequenz bei Erfolg:
Konsequenz bei Misserfolg/Ablehnung (nicht jede Quest braucht einen Fail-State, aber prüfen):
Verbindung zur Weltsimulation (beeinflusst es Ruf/Wirtschaft/Fraktion?):
```

**Referenz-Beispiel für eine mehrstufige, weltverändernde Questkette:** die Nekromant/Hexenmeister-Freischaltung in Abschnitt 78 — daran orientieren, wenn weitere Fraktions-/Klassen-Questketten entstehen.


---

## 46. AUDIO

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-audio`, `/agentic-awesome-skills:sound-design`

Bestehende Sounds: Schwung, Treffer, Knochen, Metall, Schritte, Magie, UI, Wind.

Erweitern: Musik, Regionen, Städte, Dungeons, Schlachtfelder, Boss-Atmosphäre, Umweltgeräusche. Audio soll Situationen unterstützen — auch Gebäude (Abschnitt 20: Schmiede hat Hammerschläge, Gasthaus hat Gemurmel/Musik) und Szenenübergänge (Abschnitt 21: gedämpfter Außenklang in Innenräumen).

## 47. UI / HUD

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:frontend-design`, `/agentic-awesome-skills:web-design-guidelines`, `/agentic-awesome-skills:ui-ux-design`, `/agentic-awesome-skills:accessibility`, `/pixel-plugin:pixel-art-creator`

Bestehende: Pixel-Balken, Slots, Icons, Porträts, Ganzfigur, Mobile Layout.

Polieren: Körperdiagramm, Tooltips, Item Details, Raritäten, Skill Tree, Fähigkeiten, Quests, Karte, Fraktionen, Stats. Alles muss visuell zum Spiel passen — keine generischen Web-UI-Komponenten.

Zusätzlich, Barrierefreiheit (leichtgewichtig, nicht übertrieben): ausreichender Farbkontrast bei kritischen HUD-Elementen (HP/Stamina), Tastenbelegung nachvollziehbar/anpassbar, Lesbarkeit von Schrift bei kleinen mobilen Bildschirmen.

## 48. INVENTAR & ITEMS

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:frontend-design`

Erweitern um Waffen, Rüstung, Schmuck, Verbrauchsgegenstände, Quest Items, Materialien, Runen, besondere Gegenstände. Items brauchen klare Identität.

---

## 49. ARCHITEKTUR

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:clean-code`, `/agentic-awesome-skills:javascript-mastery`, `/agentic-awesome-skills:typescript`, `/agentic-awesome-skills:save-system-design`

Bestehende Architektur prüfen, besonders: Rendering, Sprite System, Entity System, AI, Pathfinding, VFX, Chunks, Save System, State Management, Input, Audio, UI.

Keine unnötigen globalen Hacks. Neue Systeme modular aufbauen.

**Datengetriebenes Design bevorzugen:** Waffen, Gegner, Raritäten, Skills, Gebäude, Props als Datensätze (JSON/TS-Objekte, siehe `docs/DATA_SCHEMAS.md`) statt hartcodierter Einzelfälle — das macht Content-Erweiterung (Abschnitt 62) schneller und Inkonsistenzen seltener.

**AI-/State-Grenzen bewusst ziehen:** Zustände, die Szenengrenzen überdauern müssen (siehe Abschnitt 21), gehören in eine zentrale, kartenübergreifende State-Verwaltung — nicht in kartenlokale Objekte, die beim Kartenwechsel verworfen werden. Das ist vermutlich die technische Ursache des Verfolgungs-/Minen-Problems und sollte als Erstes architektonisch untersucht werden (Root Cause, siehe Abschnitt 54).

## 50. PERFORMANCE

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:performance-optimization`, `/agentic-awesome-skills:architecture`

Bestehende Performance erhalten. Bekannt: Drawing ≈ 1.7 ms/frame, Update ≈ 2.6 ms/frame. Bestehende Optimierungen: Boden-Chunks, schnellere ID-Suche.

Neue Systeme dürfen Performance nicht unkontrolliert verschlechtern. Richtwerte, die als Budget gelten (im GDD nachtragbar, sobald konkrete Zahlen vorliegen):

| Bereich | Budget (Richtwert) |
|---|---|
| Drawing/Frame | ≤ 2.0 ms |
| Update/Frame | ≤ 3.0 ms |
| Aktive NPCs/Gegner gleichzeitig sichtbar | so viele wie eine Stadt/ein Kampf realistisch braucht, ohne Frame-Einbrüche |
| Ladezeit Kartenwechsel | kurz genug, dass Verfolgungslogik (Abschnitt 21) nicht durch Timing-Lücken bricht |

Besonders testen: viele NPCs, viele Gegner, VFX, Animationen, Karawanen, große Städte, Kämpfe, Pathfinding, World Simulation.

## 51. TESTING

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:test-driven-development`, `/agentic-awesome-skills:testing`, `/agentic-awesome-skills:browser-testing`, `/agentic-awesome-skills:systematic-debugging`

Bestehenden Selbsttest `?test` (aktuell 22/22) erhalten und erweitern. Jede neue Kategorie aus diesem Dokument (insbesondere Gebäude-DoD, Szenenübergänge, Props) bekommt eigene automatisierte oder zumindest dokumentierte manuelle Testfälle.

Testen: alle Orte, Städte, Waffen, Gegner, Bosse, Fähigkeiten, Skill Tree, Loot, Raritäten, Save/Load, NPC-Reaktionen, AI, Pathfinding, Karawanen, Fraktionen, Mobile, UI, Performance, VFX, Animationen, **Gebäude-Detailgrad, Szenenübergangs-Verhalten, Props-Kontext**.

## 52. STRESS TEST

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:testing`, `/agentic-awesome-skills:performance-optimization`

Erzeuge bewusst: viele NPCs, viele Gegner, mehrere Kämpfe, viele VFX, mehrere Karawanen, große Städte, viele Animationen, mehrere AI-Gruppen, **mehrere gleichzeitige Verfolgungsjagden über mehrere Szenenübergänge hinweg**.

Prüfe: FPS, Memory, Update Time, Rendering, AI, Pathfinding, Save/Load, Browser Console.

## 53. SECOND COMPLETE PLAYTHROUGH

Nach größeren Erweiterungen: nicht direkt „Fertig" sagen. Noch einmal komplett spielen. Dabei besonders prüfen: neue Systeme + alte Systeme + System Interactions + World Logic + Visuals + Performance. Neue Bugs werden wieder dokumentiert und behoben.


---

## 54. PHASENSTRUKTUR

Arbeite das Projekt nicht blind in einer riesigen Änderung ab. Teile es selbstständig in sinnvolle Phasen und halte den Fortschritt in `docs/PHASE_STATUS.md` fest (siehe Abschnitt 3).

```text
PHASE 0   Complete Playthrough & Audit (inkl. Erreichbarkeits-Audit, Agent-Durchlauf, Abschnitt 7)
PHASE 1   Critical Bugfixes
PHASE 2   World Logic & NPC Reactions
PHASE 3   Szenenübergänge & Pathfinding & Spawn Logic
PHASE 4   Gebäude- und Props-Überarbeitung
PHASE 5   Visual Style Revision (Gelände UND Figuren-Sprites, Abschnitt 24)
PHASE 6   Animation & Combat Polish (inkl. Körperausrichtung §27, Gegner-Ausdauer §28)
PHASE 7   Weapon Expansion
PHASE 8   Rarity & Loot
PHASE 9   Skill Tree
PHASE 10  Classes
PHASE 11  Enemy Expansion (inkl. Zuordnung statisch/level-skalierend Abschnitt 72,
          Anti-Kiting-Bausteine Abschnitt 34)
PHASE 12  Bosses (Set-Piece- UND regionale Kenshi-Style-Bosse, Abschnitt 35/73)
PHASE 13  Cities (inkl. Gebäude-DoD, Siedlungsdichte/Map Scaling Abschnitt 75 — verschärfte Fassung,
          Questtafel Abschnitt 80)
PHASE 14  Dungeons (inkl. Szenenübergangs-DoD)
PHASE 15  NPCs, Tagesrhythmus & Wildlife (Abschnitt 41 — verschärfte Fassung, NPC-Beziehungen/
          Gerüchte Abschnitt 79)
PHASE 16  Gefahrenregionen & World Simulation (Abschnitt 71, inkl. Telegraphing/Fluchtwege-Test)
PHASE 17  Factions & Consequences (inkl. Boss-Tod-Konsequenzen Abschnitt 73, Raid-System Abschnitt 74,
          Skelett-Stadt/Endgame-Befreiungsorte Abschnitt 81)
PHASE 18  Audio & Atmosphere
PHASE 19  UI Polish
PHASE 20  Performance
PHASE 21  Second Complete Playthrough
PHASE 22  Final Quality Pass
PHASE 23  Prozedurale Dungeons (Abschnitt 76)
PHASE 24  Prozedurale Städte — spätere Phase, nicht vor Phase 23 (Abschnitt 77)
```

### Sofort-Priorität — wieder geöffnete Punkte *(neu)*

Diese Themen galten laut `PHASE_STATUS.md` bereits als abgeschlossen, bestehen aber den Reality-Check aus Abschnitt 58 nicht (Nutzer erlebt weiterhin das ursprüngliche Problem). Sie haben **Vorrang vor neuem Phasenfortschritt**, bis die jeweilige Definition of Done inklusive Reality-Check-Punkt tatsächlich erfüllt ist:

```text
1. Siedlungsdichte (Abschnitt 75, verschärfte Werte) — Städte weiterhin überfüllt
2. NPC-Tagesrhythmus (Abschnitt 41) — NPCs stehen weiterhin sichtbar untätig herum
3. Erreichbarkeits-Audit (Abschnitt 7) — viele Orte nicht erreichbar
4. Kampforientierung (Abschnitt 27) und Anti-Kiting (Abschnitt 34) — Rückwärtslaufen-Cheese
5. Skelett-Stadt/Endgame-Befreiungsorte (Abschnitt 81) — kein Gameplay-Höhepunkt trotz
   narrativem Anspruch
```

Du darfst Phasen sinnvoll zusammenlegen oder weiter unterteilen. Jede Phase gilt erst als abgeschlossen, wenn ihre Definition of Done (Abschnitt 58, inklusive Reality-Check) erfüllt ist — nicht wenn die Zeit/Lust ausgeht.

## 55. WICHTIG: NICHT ZU FRÜH EXPANDIEREN

Wenn der Kern noch offensichtlich schlecht funktioniert: **keine riesige Content-Produktion starten.**

```text
Core Gameplay → Combat → Animation → Visual Quality → World Logic → AI → Pathfinding
```

Dann erst große Content-Mengen. Qualität vor Quantität. Konkret: Solange Gegner nach Szenenübergängen ihren Zustand verlieren (Abschnitt 21) oder Gebäude generisch aussehen (Abschnitt 20), hat das Vorrang vor neuen Waffen/Gegnern/Städten.

## 56. ABER AUCH NICHT IN EINEM POLISH-LOOP STECKEN BLEIBEN

Sobald ein Bereich die Definition of Done ausreichend gut erfüllt: weitergehen. Nicht endlos eine einzelne Animation perfektionieren, während der Rest des Spiels unfertig bleibt.

Faustregel für „gut genug, um weiterzugehen": Wenn eine weitere Iteration nur noch marginale, kaum wahrnehmbare Verbesserung bringt (abnehmender Grenznutzen), während anderswo noch offensichtliche DoD-Lücken bestehen — dann dorthin wechseln.

Ziel: Hochwertiger Core + hochwertige Systeme + hochwertige Content-Erweiterung.

## 57. URSACHE STATT SYMPTOM

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:systematic-debugging`, `/agentic-awesome-skills:architecture`

Wenn etwas kaputt ist, nicht einfach `if bug: hide bug`, sondern:

```text
Symptom → Reproduktion → Ursache → Systemabhängigkeiten → Root Cause Fix → Regression Test
```

Beispiel (aus dem Original-Prompt): Karawane bleibt an Wand hängen → nicht die Karawane teleportieren, sondern fragen, warum Pathfinding diesen Weg wählt.

Beispiel (neu, konkret): Gegner vergisst Verfolgung nach Mineneintritt → nicht künstlich "Aggro wiederherstellen" als Pflaster, sondern klären, ob der Zustand überhaupt kartenübergreifend gespeichert wird (siehe Abschnitt 49, State Management) — das ist vermutlich die eigentliche Ursache, nicht ein reines AI-Verhaltensproblem.

## 58. DEFINITION OF DONE — MASTER-CHECKLISTE

Ein System gilt nicht als fertig, nur weil es existiert, gerendert wird, keine Console Errors wirft, der Code kompiliert oder ein einzelner Test funktioniert.

„Fertig" bedeutet, dass alle folgenden Dimensionen angemessen berücksichtigt sind:

```text
[ ] TECHNIK       – läuft stabil, keine Crashes, keine Console Errors
[ ] GAMEPLAY      – fühlt sich richtig an, nicht nur "funktioniert"
[ ] WORLD LOGIC   – ergibt Sinn, besteht den "Warum passiert das"-Test (Abschnitt 10)
[ ] VISUAL        – Detailgrad passt zum Stilstandard (Abschnitt 24), keine Platzhalter
[ ] ANIMATION     – Bewegung kommuniziert Gewicht/Absicht (Abschnitt 64)
[ ] AUDIO         – unterstützt die Situation, kein Stummfilm-Gefühl
[ ] AI            – Verhalten ist nachvollziehbar, auch über Szenengrenzen hinweg (Abschnitt 21)
[ ] EDGE CASES    – ungewöhnliche/provozierte Situationen wurden getestet, nicht nur der Happy Path
[ ] PERFORMANCE   – Budget aus Abschnitt 50 eingehalten
[ ] REGRESSION    – bestehende Tests/Selbsttest laufen weiterhin durch
[ ] DOKUMENTATION – GDD/Bug Ledger/Changelog aktualisiert
```

Diese Checkliste gilt für jedes einzelne Feature UND für jede Phase als Ganzes.

### Kritische Ergänzung: Kennzahlen sind kein Ersatz für Wahrnehmung *(neu)*

**Konkret beobachtetes Problem:** Mehrfach wurde eine Phase im Status als „ABGESCHLOSSEN" mit erfüllter Definition of Done geführt (z. B. Siedlungsdichte §75: Mindestabstand ≥ 2 Kacheln, Hauptwege ≥ 3, bebaute Fläche 11–18 % — alles als erfüllt abgehakt; NPC-Tagesrhythmus §41 mit Selbsttest bestanden), **obwohl der Spieler die Städte weiterhin als überfüllt und die NPCs weiterhin als untätig herumstehend erlebt.** Automatisierte Kennzahlen und Selbsttests haben offenbar bestanden, ohne dass das eigentliche, subjektiv gemeinte Problem gelöst war.

> **Ein numerischer Schwellenwert, der besteht, ist kein Beweis dafür, dass das ursprüngliche Problem gelöst ist. Der Maßstab ist der tatsächliche Eindruck beim Spielen/im Screenshot, nicht die Zahl.**

Deshalb gilt zusätzlich zur Checkliste oben, verpflichtend für jede Phase, die ein **subjektives/räumliches/erlebnisbezogenes** Ziel hat (Dichte, Lebendigkeit, Detailgrad, Spielgefühl):

```text
[ ] Ein frischer Screenshot/eine frische Spielsequenz wurde NACH der Änderung tatsächlich angeschaut
    (nicht nur die Kennzahl gelesen)
[ ] Der Vergleich mit der ursprünglichen Beschwerde/dem ursprünglichen Screenshot wurde explizit gezogen:
    "Sieht/fühlt sich das jetzt merklich anders an als vorher, so wie beschwert wurde?"
[ ] Falls die Kennzahl besteht, der Eindruck aber weiterhin dem ursprünglichen Problem ähnelt:
    NICHT als abgeschlossen melden — die Kennzahl selbst ist dann falsch kalibriert und muss
    nachgeschärft werden (z. B. Mindestabstand erhöhen, nicht nur den bestehenden Wert für
    "erfüllt" erklären)
```

Ein Status "ABGESCHLOSSEN, DoD erfüllt" bei einem Thema, zu dem der Nutzer wiederholt dieselbe Beschwerde äußert, ist ein Alarmsignal, dass die Kennzahl am eigentlichen Problem vorbeimisst — nicht, dass der Nutzer sich irrt.

## 59. QUALITÄTSFRAGEN FÜR JEDE ÄNDERUNG

Vor Abschluss einer größeren Änderung:

```text
Was existiert bereits?
Was ändere ich, und warum?
Welche Systeme betrifft es?
Was erwartet der Spieler?
Was könnte dadurch kaputtgehen?
Wie reagiert die Welt? Wie reagiert die AI? Wie reagieren NPCs?
Wie sieht es aus? Wie fühlt es sich an?
Wie verhält es sich bei Edge Cases (inkl. Szenenübergängen)?
Wie teste ich es, und habe ich einen Regression Test?
Ist die Dokumentation (GDD/Changelog/Bug Ledger) aktuell?
```

## 60. „WOULD A REAL PLAYER QUESTION THIS?"

Frage dich während des gesamten Entwicklungsprozesses: „Wenn ich das gerade als Spieler sehe – würde ich mich fragen, warum das so ist?"

Beispiele: Warum ist dieser Händler mitten im Wald? Warum ist die Karawane alleine? Warum hilft die Wache nicht? Warum läuft dieser NPC gegen eine Wand? Warum spawnen hier plötzlich Skelette? Warum reagieren die NPCs nicht auf den Kampf? Warum läuft der tote Gegner weiter? Warum ist diese Stadt komplett leer? Warum gibt es hier keine Handelswege? Warum steht dieses Gebäude hier? **Warum sieht dieses Haus aus wie ein Karton? Warum hat der Gegner mich vergessen, kaum dass ich durch diese Tür bin? Warum steht diese Kiste genau hier?**

Wenn diese Fragen entstehen: Problem untersuchen.


---

## 61. WORLD COHERENCE — BEISPIEL-KETTEN

Rotfall: Legacy soll sich wie eine echte Welt anfühlen. Beispiel:

```text
Stadt → Händler → Lager → Handelsrouten → Karawanen → Wachen → Banditen → Überfälle → wirtschaftliche Konsequenzen
```

Nicht zwingend jedes System sofort vollständig implementieren, aber die Systeme sollen langfristig zusammenpassen.

## 62. „WHY DOES NOTHING HAPPEN?"-AUDIT

Nimm Ereignisse und frage: **Was passiert danach?**

```text
Spieler greift Händler an → Händler reagiert → NPCs reagieren → Wachen reagieren → Kampf → Ruf → Fraktion → Konsequenz
```

Nicht zwingend alles sofort, aber es darf nicht einfach bei „Händler verliert HP" enden, wenn die Welt eigentlich darauf reagieren sollte. Dasselbe gilt für „Spieler flieht in eine Mine" — auch das ist ein Ereignis, das eine bewusste Folge haben muss (Abschnitt 21), nicht ein stilles Nichts.

## 63. VISUELLE DETAILS

Bei Assets nicht einfach Masse produzieren. Ein einzelner hochwertiger Gegenstand ist besser als zehn generische. Besonders: Waffen, Rüstungen, Charaktere, Gegner, Wagen, Tiere, **Gebäude**, **Props**. Jedes Asset braucht klare Silhouette, Material, Licht, Schatten, Details, Kontext, Animation (wenn relevant).

## 64. ANIMATION ALS EIGENES QUALITÄTSZIEL

Animationen nicht als Nebensache behandeln. Kampf soll visuell kommunizieren:

```text
Vorbereitung → Angriff → Kontakt → Treffer → Reaktion → Recovery
```

Bei Dodge: `Start → Beschleunigung → Ausweichbewegung → i-Frame → Landung → Recovery`

Bei Death: `Hit → Reaktion → Balanceverlust → Fall → Liegen`

Animations-Timing ist Teil des Game Feels.

## 65. CONTENT EXPANSION

Nach dem Qualitätsfundament darf das Spiel massiv wachsen. Erweitere schrittweise: Waffen, Rüstungen, Items, Gegner, Bosse, Klassen, Fähigkeiten, Skill Tree, Raritäten, Städte, Dungeons, NPCs, Tiere, Fraktionen, Quests, Events, Regionen, Loot, VFX, Animationen, Audio, **Gebäude-Typen, Props-Sets**.

Aber jede neue Kategorie muss in die bestehende Welt passen und die jeweilige Definition of Done erfüllen.

## 66. KEINE COPY-PASTE-CONTENT-FABRIK

Nicht `Enemy A / Enemy B / Enemy C` mit lediglich anderen Farben. Nicht `City A / City B / City C` mit anderen Namen. Nicht `Sword A / Sword B / Sword C` mit nur anderen Zahlen. **Nicht `Haus A / Haus B / Haus C` als derselbe Block mit anderer Fassadenfarbe (Abschnitt 20). Nicht dieselbe Kiste tausendfach dupliziert (Abschnitt 22).**

Jedes wichtige Content-Element soll eine eigene Identität bekommen.

## 67. FINAL QUALITY PASS

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:testing`, `/agentic-awesome-skills:browser-testing`, `/agentic-awesome-skills:systematic-debugging`, `/agentic-awesome-skills:performance-optimization`, `/pixel-plugin:pixel-art-creator`, `/spritecook:spritecook-animate-assets`

Am Ende erneut alles prüfen:

```text
TECHNISCH   – keine Console Errors, keine kritischen Bugs, Save/Load funktioniert, Performance stabil
GAMEPLAY    – Combat, Movement, Dodge, Skills, Weapons, Loot, Progression
AI          – Gegner, NPCs, Wachen, Tiere, Karawanen — inkl. Verhalten an Szenenübergängen
WORLD LOGIC – Spawns, Pathfinding, Reaktionen, Fraktionen, Konsequenzen
VISUAL      – Sprites, Map, Waffen, Gebäude, Props, VFX, UI, Animationen
IMMERSION   – Städte fühlen sich bewohnt an, Karawanen fühlen sich echt an, NPCs reagieren
              sinnvoll, Gegner erscheinen sinnvoll, Welt wirkt nicht zufällig,
              Gebäude sehen aus wie das, was sie sein sollen
```

## 68. ABSOLUTE PRIORITÄTEN

Wenn Entscheidungen getroffen werden müssen:

```text
1. Spielbarkeit
2. Stabilität
3. World Logic
4. Core Gameplay
5. Game Feel
6. Visual Quality
7. AI
8. Animation
9. Content
10. Extra Features
```

Qualität vor Quantität.

## 69. DAS ENDZIEL

Rotfall: Legacy soll sich nicht wie „ein Browsergame mit vielen Features" anfühlen. Es soll sich wie **eine echte, zusammenhängende Pixel-RPG-Welt** anfühlen.

Der Spieler soll erleben: eine Welt, die auf ihn reagiert; NPCs mit nachvollziehbarem Verhalten; Gegner mit eigenen Verhaltensmustern, die auch dann Bestand haben, wenn der Spieler versucht, ihnen durch eine Tür zu entkommen; Städte mit Identität, deren Gebäude erkennbar sind; Karawanen mit Zweck; Fraktionen mit Interessen; Kämpfe mit Gewicht; Waffen mit eigenem Gefühl; Animationen mit Persönlichkeit; Dungeons mit Atmosphäre; Loot mit Bedeutung; Skill Builds mit Entscheidungen; eine Map mit Environmental Storytelling; und eine visuelle Identität, die sofort nach Rotfall: Legacy aussieht — bis hinunter zur einzelnen Kiste am Straßenrand.

## 70. ABSCHLIESSENDE ENTWICKLUNGSREGEL

**Nicht einfach größer machen. Besser machen. Dann größer machen. Dann das Größere wieder besser machen.**

Der Entwicklungszyklus bleibt:

```text
PLAY → OBSERVE → ANALYZE → DOCUMENT → FIX → TEST → POLISH → EXPAND
→ PLAY AGAIN → FIND NEW PROBLEMS → FIX → EXPAND AGAIN
```

Und bei jedem Durchlauf:

> **Keine offensichtlichen Probleme ignorieren.**
> **Keine World-Logic-Probleme als reine „Kleinigkeiten" abtun** — auch nicht "der Gegner vergisst mich halt in der Mine" oder "die Häuser sehen halt so aus".
> **Keine generischen Assets akzeptieren, wenn sie sichtbar nicht zum Stil passen** — Gebäude und Kisten eingeschlossen.
> **Keine neuen Features auf kaputten Fundamenten stapeln.**
> **Keine funktionierenden Systeme unnötig zerstören.**
> **Keine Masse auf Kosten der Qualität produzieren.**

Das Ziel ist eine **hochwertige, lebendige, logisch reagierende und visuell starke Welt**, die sich mit jeder Entwicklungsphase besser anfühlt.


---

## 71. SCHWIERIGKEITSREGIONEN & GEFAHRENSTUFEN *(neu)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/pixel-plugin:pixel-art-creator`

**Designwunsch:** Die Welt soll nicht überall gleich schwer sein. Es soll spürbar gefährlichere Gebiete geben — ähnlich dem Kenshi-Prinzip: **die Welt skaliert nicht zum Spieler, der Spieler muss sich an die Welt anpassen.** Ein Gebiet ist so gefährlich, wie es ist, unabhängig davon, ob der Spieler bereit dafür ist.

### Grundprinzip

> **Gefahr ist eine Eigenschaft des Ortes, nicht (nur) eine Funktion des Spielerfortschritts.**

Das steht bewusst im Spannungsverhältnis zu klassischem Level-Gating. Die Konsequenz: Ein unvorbereiteter Spieler *kann* in ein zu gefährliches Gebiet laufen und dort hart bestraft werden (Flucht, Tod, Verlust). Das ist **kein Bug**, sondern beabsichtigt — vorausgesetzt, die Gefahr ist fair angekündigt (siehe Telegraphing unten) und Flucht/Rückzug ist grundsätzlich möglich, nicht durch das gleiche Problem verbaut, das schon in Abschnitt 21 beschrieben ist (Verfolgung, die nicht aufhört, wo sie aufhören sollte, ist hier doppelt kritisch — ein zu starker Gegner, der einen Rückzugsversuch unfair unterbindet, ist ein eigenes Balancing-Problem, kein reines Schwierigkeitsmerkmal).

### Gefahrenstufen-Skala

```text
Stufe 0 – Sicher       (Städte, unmittelbares Umland, Hauptwege)
Stufe 1 – Gemäßigt     (übliche Wildnis, Anfängergebiete)
Stufe 2 – Gefährlich   (Banditenreviere, tiefere Wälder, verlassene Minen)
Stufe 3 – Tödlich      (Grenzgebiete zu Fraktionskriegen, Ruinen mächtiger Wesen)
Stufe 4 – Verboten     (Totenreich-nahe Zonen, Elite-Fraktionslager, Endgame-Gebiete)
```

Jede Region bekommt im GDD eine feste Gefahrenstufe (unabhängig vom Spielerlevel) sowie eine Begründung, *warum* sie so gefährlich ist (welche Fraktion/welche Kreaturenart dominiert dort, siehe Abschnitt 38 – Map Visual Identity).

### Telegraphing (Pflicht — sonst ist es kein Spannungselement, sondern reine Frustration)

Die Gefahrenstufe eines Gebiets muss dem Spieler **erkennbar** sein, bevor er tief hineingerät:

* visuelle Sprache passend zur Stufe (düsterere Palette, verwüsteteres Terrain, größere/bedrohlichere Gegner-Silhouetten sichtbar patrouillierend, sichtbare Kadaver/Ruinen als Warnzeichen)
* NPC-Warnungen (Reisende, Wachen, Gerüchte in Gasthäusern — passt zu Abschnitt 45, Quests, als narrative Vorwarnung)
* graduelle Übergänge zwischen benachbarten Stufen wo sinnvoll (kein unsichtbarer Sprung von Stufe 0 auf Stufe 3 auf derselben Wegkreuzung), abrupte Übergänge sind nur an klar markierten Schwellen erlaubt (Dungeon-/Lager-Eingänge, siehe Abschnitt 21)

### Auswirkungen der Gefahrenstufe

Die Gefahrenstufe steuert: Gegnerdichte und -stärke (siehe Abschnitt 18, Spawn Logic), Loot-Qualität/Rarity-Chancen (siehe Abschnitt 30 – höheres Risiko, bessere Beute), Fraktionspräsenz (siehe Abschnitt 43), Umgebungsgefahren (Gelände, Wetter, Fallen).

### Datensatz-Ergänzung (Region)

```json
{
  "id": "region_blackthorn_forest",
  "dangerTier": 3,
  "dominantThreat": "Kult-Fraktion + korrumpierte Kreaturen",
  "telegraphSignals": ["verdorrte Vegetation", "Kult-Symbole an Bäumen", "Reisende warnen in nahegelegenem Dorf"],
  "escapeRoutesConfirmed": true
}
```

`escapeRoutesConfirmed` ist absichtlich Pflichtfeld: Bevor eine Region als fertig gilt, muss geprüft sein, dass ein unterlegener Spieler tatsächlich realistisch fliehen kann (Pathfinding/Fluchtdistanz/Gegner-Tempo, siehe Abschnitt 17 und 28).

### Definition of Done — Gefahrenregionen

```text
[ ] Gefahrenstufe im GDD festgelegt und begründet
[ ] Mindestens 2 Telegraphing-Signale vor dem gefährlichsten Kernbereich der Region
[ ] Flucht/Rückzug ist in der Praxis getestet möglich, nicht nur theoretisch
[ ] Loot-/Gegner-Dichte spiegelt die Gefahrenstufe wider
```

---

## 72. LEVEL-SKALIERENDE GEGNER *(neu)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`

**Designwunsch:** Manche Gegner sollen mit dem Spielerlevel mitskalieren, damit die Welt auch im späten Spiel nicht komplett trivial wird.

### Wichtige Abgrenzung — nicht alles darf skalieren

Skalierung würde das Prinzip aus Abschnitt 71 (Gefahr als Eigenschaft des Ortes) aushebeln, wenn sie pauschal auf alle Gegner angewendet wird. Deshalb gilt eine klare Zweiteilung:

```text
STATISCHE GEGNER (die Mehrheit)
→ feste Stärke, verkörpern die Gefahrenstufe ihrer Region
→ ein Wolf im Anfängerwald bleibt ein Wolf, egal wie stark der Spieler wird
→ das ist der Kern des "die Welt skaliert nicht zu dir"-Gefühls

SKALIERENDE GEGNER (bewusst kleine, klar definierte Gruppe)
→ bestimmte Sonder-/Elite-Einheiten, die dem Spielerfortschritt folgen
→ Beispiele: wandernde Elite-Trupps, Kopfgeldjäger/Rivalen-NPCs (siehe Abschnitt 44,
  Verbrechen/Konsequenzen), besondere Fraktionsantworten auf hohen Spieler-Ruf/Bedrohung,
  ggf. bestimmte Boss-Begleiter
```

Welche konkreten Gegnertypen skalieren dürfen, wird explizit im GDD als Liste geführt — nicht implizit im Code entschieden.

### Skalierungs-Richtlinien

* **Stufenweise statt kontinuierlich:** Skalierung an Spieler-*Tiers* (z. B. alle 10 Level oder an Ausrüstungs-Meilensteinen) statt granularer 1:1-Zahlenanpassung pro Level — vermeidet unsichtbares Mikro-Tuning und macht Balancing nachvollziehbar testbar.
* **Harte Obergrenze:** Jeder skalierende Gegner hat einen definierten Maximalwert. Unendliche Skalierung ist verboten (führt zu unbalancierbaren Extremwerten im späten Spiel).
* **Sichtbar, nicht heimlich:** Wenn ein Gegner skaliert (z. B. ein wiederkehrender Rivale wird mit jeder Begegnung spürbar stärker), soll das für den Spieler erkennbar/erzählerisch untermauert sein (neue Ausrüstung, größere Begleitung, veränderter Titel) — kein reiner Zahlen-Reskin.

### Datensatz-Ergänzung (Gegner)

```json
{
  "id": "enemy_rival_bounty_hunter",
  "scaling": {
    "enabled": true,
    "basedOn": "playerTier",
    "tierCap": 6,
    "perTierIncrease": { "hp": "+15%", "damage": "+10%" },
    "visualProgression": ["leicht_gepanzert", "gut_gepanzert", "elite_ausruestung"]
  }
}
```

Statische Gegner setzen `scaling.enabled: false` explizit — damit im Code klar bleibt, dass das Fehlen von Skalierung eine bewusste Entscheidung ist, kein vergessenes Feature.

### Definition of Done — Skalierende Gegner

```text
[ ] Liste der skalierenden Gegnertypen existiert im GDD, mit Begründung je Eintrag
[ ] Harte Obergrenze pro skalierendem Gegner definiert und getestet (kein Wert wächst unbegrenzt)
[ ] Statische Regionsgegner bleiben nachweislich unverändert über den gesamten Spielverlauf
[ ] Skalierung ist spielerseitig sichtbar/nachvollziehbar, nicht nur eine interne Zahl
```

---

## 73. REGIONALE BOSSE & WELT-KONSEQUENZEN (KENSHI-STYLE) *(neu)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:agent-memory`, `/spritecook:spritecook-animate-assets`, `/pixel-plugin:pixel-art-creator`, `/agentic-awesome-skills:game-audio`

**Designwunsch:** Es soll nicht nur einen linearen Hauptboss geben, sondern **mehrere eigenständige, ortsgebundene Bosse über die Welt verteilt** — Fraktionsführer, Lageranführer, Monster-Patriarchen, Dungeon-Wächter. Jeder von ihnen ist an eine Region/Fraktion gebunden (siehe Abschnitt 71 und 43). Ihr Tod soll die Welt **spürbar und dauerhaft** verändern, nicht nur eine Trophäe/Loot-Ausschüttung sein.

### Grundprinzip

> **Ein regionaler Boss ist keine reine Kampfherausforderung, sondern ein Knotenpunkt der Weltsimulation. Sein Tod ist ein Ereignis mit Folgen, kein Endpunkt.**

Das bedeutet ausdrücklich auch: Die Folgen dürfen **ambivalent** sein, nicht nur "Belohnung, jetzt ist alles gut". Kenshi-typisch: Wer einen Fraktionsführer tötet, erzeugt oft ein Machtvakuum — und ein Machtvakuum kann von etwas Schlimmerem gefüllt werden, nicht automatisch von Frieden.

### Mögliche Konsequenz-Kategorien (pro Boss mindestens 2–3 davon konkret ausgestalten)

```text
Machtverschiebung        – Fraktion verliert Einfluss/Territorium, andere Fraktion rückt nach
Gebietskontrolle         – Region wechselt sichtbar den Besitzer (Banner, Wachen, Patrouillen ändern sich)
Machtvakuum-Risiko        – statt Ruhe entsteht eine NEUE, möglicherweise chaotischere Bedrohung
                            (Nachfolgekonflikt, Plünderer nutzen das Vakuum, Splittergruppe wird radikaler)
NPC-/Ruf-Reaktion         – Händler, Verbündete, Zivilisten reagieren erkennbar (Angst weicht/entsteht neu)
Wirtschaft                – Preise, Warenverfügbarkeit oder Handelsrouten in der Region ändern sich
                            (siehe Abschnitt 61, World Coherence-Ketten)
Spawn-Tabellen-Änderung    – z. B. weniger organisierte Wachen, dafür mehr chaotische Plünderer,
                            oder umgekehrt eine befriedete, sicherere Region (siehe Abschnitt 18)
Quest-Verfügbarkeit        – neue Quests öffnen sich (Nachfolgekampf, Machtübernahme durch den Spieler
                            unterstützen), alte werden ungültig/verändert (siehe Abschnitt 45)
```

Nicht jede Konsequenz muss sofort vollständig simuliert werden — aber mindestens die sichtbaren, spielerseitig wahrnehmbaren Teile (Banner/Wachen/Händlerreaktion) sind Pflicht, bevor ein regionaler Boss als abgeschlossen gilt.

### Boss-Vorlage — Erweiterung von Abschnitt 35 um Welt-Bindung

```text
Name:
Region (siehe Abschnitt 71, inkl. Gefahrenstufe):
Fraktion (falls zutreffend, siehe Abschnitt 43):
Arena/Besonderheiten:
Phasen (siehe Abschnitt 35):
Bei Tod:
  Machtverschiebung:
  Gebietskontrolle:
  Machtvakuum-Risiko (falls zutreffend – wer/was rückt nach?):
  NPC-/Ruf-Reaktion:
  Wirtschaftliche Auswirkung:
  Spawn-Tabellen-Änderung in der Region:
  Neue/veränderte Quests:
Einzigartiger Loot:
```

### Verteilung in der Welt

Nicht alle regionalen Bosse müssen gleich stark oder gleich früh erreichbar sein. Richtwert zur Verteilung über die Gefahrenstufen (Abschnitt 71):

```text
Stufe 1-2 Regionen:  kleinere, "lokale" Bosse (Banditenhauptmann, Alpha-Tier) — moderate Konsequenzen
Stufe 3 Regionen:    mittlere Fraktions-/Kult-Anführer — spürbare regionale Machtverschiebung
Stufe 4 Regionen:    große Endgame-Bosse — Konsequenzen können mehrere Regionen/Fraktionen betreffen
```

Dadurch entsteht ein Netz aus Bossen, kein einzelner linearer Pfad — passend zum Kenshi-Vorbild, bei dem der Spieler selbst wählt, welche Machtstruktur er wann und in welcher Reihenfolge herausfordert.

### Definition of Done — Regionale Bosse

```text
[ ] Boss ist eindeutig einer Region und Gefahrenstufe zugeordnet (Abschnitt 71)
[ ] Mindestens 2-3 Konsequenz-Kategorien aus der Liste oben sind konkret ausgestaltet und getestet
[ ] Vorher/Nachher-Vergleich der Region wurde tatsächlich im Spiel verifiziert
    (Wachen/Banner/Händler/Spawns unterscheiden sich sichtbar)
[ ] Konsequenz ist nicht zwingend rein positiv — Machtvakuum-Option wurde bewusst geprüft
[ ] Erfüllt zusätzlich die Boss-Definition-of-Done aus Abschnitt 35 (Arena, Telegraphing, Loot)
```


---

## 74. RAID-SYSTEM (VERBESSERUNG) *(neu)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:game-development`, `/spritecook:spritecook-animate-assets`, `/agentic-awesome-skills:game-audio`

**Designwunsch:** Das bestehende Raid-System muss überarbeitet/verbessert werden. Da der genaue aktuelle Schwachpunkt nicht spezifiziert wurde: zuerst den Ist-Zustand im Rahmen des nächsten Playthroughs (Abschnitt 7/53) gezielt auf die Punkte unten prüfen, dann gezielt nachbessern — nicht blind neu bauen (siehe Abschnitt 2, Erhalten vs. Refactoring).

> **Bezug zu "Welt fühlt sich leblos an":** Ein gelungener Raid ist einer der wenigen Momente, in denen die Welt sich sichtbar verändert. Wenn ein Raid gelingt (Angreifer siegen) und danach einfach nichts weiter passiert außer einem Kennzahlen-Update, ist genau das der Grund für den leblosen Eindruck. Die "Nachwirkungen"-Phase unten ist deshalb kein optionaler Abschluss, sondern der eigentliche Sinn des Systems.

### Ein vollständiger Raid besteht aus Phasen — nicht nur „Gegner spawnen, Kampf, fertig"

```text
VORWARNUNG (Telegraphing)
↓
ANMARSCH (sichtbar, nicht Teleport-Spawn mitten in der Stadt)
↓
ANGRIFF
↓
VERTEIDIGUNG / KAMPF
↓
ERGEBNIS (Sieg/Niederlage/Teilerfolg)
↓
NACHWIRKUNGEN
```

### Trigger-Logik

Ein Raid sollte nicht rein zufällig aus dem Nichts kommen, sondern aus nachvollziehbaren Faktoren entstehen: Fraktionskonfliktstatus (Abschnitt 43), Gefahrenstufe der Region (Abschnitt 71), Spieler-Ruf/Bedrohungswert (Abschnitt 44), Verteidigungsstärke des Ziels (schwache Außenposten werden eher angegriffen als stark bewachte Städte). Ein Cooldown pro Siedlung verhindert Raid-Spam auf denselben Ort.

### Telegraphing (Pflicht, analog zu Abschnitt 71)

Vor einem Raid müssen erkennbare Vorwarnzeichen existieren: Rauch/Kundschafter am Horizont, zurückkehrende verwundete Reisende mit Warnung, erhöhte Wachsamkeit der Wachen (Alarmstufe, siehe Abschnitt 15), NPC-Gerüchte im Vorfeld. Ein Raid ohne jede Vorwarnung fühlt sich unfair statt bedrohlich an.

### Anmarsch statt Spawn-in-der-Stadt

Der Angreifertrupp erscheint sichtbar am Rand der Karte/Region und bewegt sich erkennbar auf das Ziel zu (nutzt reguläres Pathfinding, siehe Abschnitt 17) — kein Direkt-Spawn zwischen den Häusern. Das gibt Wachen/Spieler eine faire Reaktionschance und verhindert den in Abschnitt 19 beschriebenen Immersionsbruch „Gegner taucht einfach mitten in der Stadt auf".

### Truppzusammensetzung skaliert mit dem Ziel

Analog zur Karawanen-Staffelung (Abschnitt 16):

```text
Kleiner Außenposten:  3-5 Angreifer, wenig Ausrüstung
Mittlere Siedlung:    6-10 Angreifer, evtl. mit Anführer
Große Stadt/Feste:    10+ Angreifer, gestaffelt in Wellen, mit Elite-/Boss-Einheit möglich
                       (siehe Abschnitt 73, falls ein regionaler Bossraid ausgelöst wird)
```

### Verteidiger-Verhalten

Wachen, Milizen und ggf. bewaffnete Bewohner reagieren gestaffelt nach Bedrohungsstufe (Abschnitt 15, Guard Audit); Zivilisten fliehen/suchen Deckung (Abschnitt 12, NPC Reaction System). Die Verteidigungsstärke eines Ortes muss zu seiner Gefahrenstufe und wirtschaftlichen Bedeutung passen — ein wehrloses Dorf, das trotzdem jeden Raid übersteht, ist genauso unglaubwürdig wie eine Festung, die widerstandslos fällt.

### Nachwirkungen — sichtbar und dauerhaft

Hier lässt sich das bereits gebaute Verfallssystem (gepflegt/heruntergekommen/verlassen, siehe Fortschrittsbericht zu Abschnitt 20) sinnvoll doppelt nutzen: ein erfolgreicher Raid kann den Zustand betroffener Gebäude sichtbar verschlechtern (Kriegsschaden statt nur Zeitverfall), NPC-Verluste sind dauerhaft (Abschnitt 14, Death State), die Bevölkerungszahl/das Angebot der Händler kann sich vorübergehend verringern, und je nach Ausgang ändern sich Ruf und ggf. Fraktionskontrolle der Region (Abschnitt 73). Ein Wiederaufbau über Zeit ist optional, aber wenn vorhanden, muss er ebenfalls sichtbar/nachvollziehbar sein, kein plötzliches "alles wie neu".

### Spieler-Beteiligung

Definiere explizit, was der Spieler tun kann: eingreifen und verteidigen, ignorieren, oder sich sogar dem Raid anschließen (falls das zur Fraktions-/Verbrechenslogik passt, Abschnitt 43/44) — jede Option mit eigener Konsequenz, keine „unsichtbare" Wahl ohne Auswirkung.

### Datensatz-Vorlage

```json
{
  "raidId": "raid_bandits_on_nordfurt",
  "targetSettlement": "nordfurt",
  "triggerFactors": ["faction_hostility_high", "region_dangerTier_2", "cooldown_expired"],
  "warningSignals": ["scout_sighting", "tavern_rumor"],
  "composition": { "size": "mittel", "leader": "enemy_bandit_captain" },
  "outcomeEffects": {
    "onDefenderWin": "Ruf +, keine Gebäudeschäden",
    "onDefenderLoss": "2-3 Gebäude Verfallsstufe -1, Händlerangebot reduziert für X Tage"
  }
}
```

### Definition of Done — Raid-System

```text
[ ] Jeder Raid hat eine erkennbare Vorwarnung, bevor der Angriff beginnt
[ ] Angreifer marschieren sichtbar an, kein Spawn mitten in der Siedlung
[ ] Truppstärke ist im GDD an die Zielwichtigkeit gekoppelt, nicht willkürlich
[ ] Verteidiger reagieren gestaffelt und glaubwürdig (Wachen zuerst, Zivilisten fliehen)
[ ] Ergebnis hat eine sichtbare, dauerhafte Auswirkung auf die Siedlung
[ ] Spieler-Handlungsoptionen (eingreifen/ignorieren/mitmachen) sind definiert und getestet
[ ] Kein Cooldown-Verstoß: dieselbe Siedlung wird nicht unrealistisch oft hintereinander angegriffen
```


---

## 75. MAP SCALING — SIEDLUNGSGRÖSSE & VERTEILUNGSDICHTE *(neu)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/pixel-plugin:pixel-art-creator`

**Konkret beobachtetes Problem (siehe Screenshot):** Obwohl die Siedlungen laut Fortschrittsbericht inzwischen deutlich mehr Gebäude und Einwohner haben (104 Gebäude statt 23, ~100 Bewohner), wirkt die tatsächliche Anordnung im Screenshot immer noch **eng zusammengequetscht**: Häuser stehen Wand an Wand bzw. mit minimalem Abstand, Wege sind schmale Lücken zwischen Gebäudeblöcken, es gibt kaum Freiraum zwischen den Strukturen. Mehr Gebäude allein lösen das Problem nicht — es geht um **Fläche und Verteilung**, nicht nur um Anzahl.

> **STATUS (weiterhin ungelöst):** Dieses Thema wurde bereits einmal als abgeschlossen gemeldet (Mindestabstand ≥ 2 Kacheln, Hauptwege ≥ 3, bebaute Fläche im Bereich 11–38 % je nach Stadt) — der Nutzer erlebt die Städte aber weiterhin als „maximal überfüllt, alle stehen aneinander". Das ist der in Abschnitt 58 beschriebene Fall: die Kennzahl bestand, das eigentliche Problem nicht. Die Werte unten sind deshalb bewusst **strenger** als beim ersten Anlauf. Vor erneutem „Abgeschlossen"-Status gilt zwingend die Reality-Check-Regel aus Abschnitt 58: tatsächlichen Screenshot einer vollen Stadt anschauen und mit der Beschwerde oben abgleichen, nicht nur die Zahl prüfen.

### Grundregel

> **Eine Siedlung soll sich über deutlich mehr Fläche erstrecken als bisher, bei gleichzeitig spürbaren Zwischenräumen zwischen den Gebäuden — nicht ein dichter Block in der Mitte einer großen, ansonsten leeren Karte.**

„Größer" heißt hier **verteilter**, nicht nur „mehr Gebäude enger gepackt".

### Konkrete Abstandsregeln

* Zwischen zwei benachbarten Gebäuden muss in der Regel **mindestens die Breite von zwei begehbaren Wegen** liegen, nicht nur einem (kein direktes Wand-an-Wand, außer als bewusste Ausnahme bei sehr dichten, ummauerten Kernstädten wie Nordfurt — und selbst dort mit klar erkennbaren Gassen, nicht lückenlosen Blöcken).
* Vorgärten, kleine Zäune, Gemüsebeete oder einzelne Bäume zwischen Häusern schaffen zusätzlichen visuellen und funktionalen Abstand, ohne dass die Siedlung „leer" wirkt.
* Hauptwege/Plätze brauchen sichtbar mehr Breite als reine Zwischenräume — der Größenkontrast zwischen Hauptstraße und Nebengasse muss erkennbar bleiben.
* **Nicht jede Gebäudereihe braucht dieselbe Dichte.** Ein Marktkern darf enger sein als Wohnviertel am Rand — aber selbst der Marktkern muss begehbare Plätze zwischen den Ständen/Gebäuden haben, keine Wand-an-Wand-Fassaden über die gesamte Zeile.

### Organische statt gitterartige Anordnung

Häuser sollen nicht in einer perfekten Rasterordnung stehen (wirkt wie eine Kaserne), sondern leicht versetzt, an gewachsene Wege angepasst — mit Ausnahme bewusst geordneter Bereiche (Militärlager, Kasernenhof einer Ordensfeste wie Sonnwacht), wo Rasterordnung stilistisch richtig ist. Diese Ausnahme gehört explizit ins GDD, damit sie nicht versehentlich überall angewendet wird.

### Bewegungsraum für NPCs

Die Verteilungsdichte hängt direkt mit Abschnitt 41 (Tagesrhythmus) zusammen: Wenn NPCs tatsächlich zur Arbeit gehen, jagen, sich zum Reden treffen sollen, brauchen sie **Platz, um sich sichtbar zu bewegen** — ein Dorf, in dem alle Wege nur ein bis zwei Kacheln breit sind, lässt Bewegung gestaut und unnatürlich wirken (Bezug zu Abschnitt 17, Pathfinding Audit).

### Siedlungsfläche wächst mit, Peripherie nicht vergessen

* Größere Siedlungen brauchen auch eine erkennbare Peripherie: Felder, Weiden, einzelne Außengehöfte, Zäune am Übergang zur Wildnis — das verhindert einen harten Bruch zwischen „dichte Stadt" und „leere Wildnis" direkt an der Kartengrenze der Siedlung.
* Die eigentliche bebaute Fläche (Gebäude + direkte Wege) sollte deutlich weniger als 100 % der gesamten Siedlungsfläche einnehmen — als **verschärfter** Richtwert nach dem ersten gescheiterten Anlauf: bebaute/versiegelte Fläche **unter 25 %** der Gesamtfläche der Siedlung (nicht bis zu 38 %, wie es zuletzt teils umgesetzt war), der Rest sind Wege, Plätze, Grünflächen, Felder, Gärten.

### Datensatz-Ergänzung (Siedlung)

```json
{
  "settlementId": "nordfurt",
  "footprintTiles": { "w": 180, "h": 140 },
  "buildingCount": 42,
  "minBuildingSpacingTiles": 5,
  "mainStreetWidthTiles": 6,
  "sideStreetWidthTiles": 4,
  "builtAreaRatio": 0.22
}
```

### Definition of Done — Siedlungsdichte

```text
[ ] Mindestabstand zwischen Gebäuden eingehalten: ≥ 5 Kacheln Normalfall, ≥ 3 Kacheln in
    bewusst dichten Kernbereichen (Ausnahmen dokumentiert und begründet)
[ ] Hauptwege deutlich breiter als Nebengassen, sichtbar unterscheidbar
[ ] NPCs können sich im Stresstest (viele gleichzeitig unterwegs, siehe Abschnitt 52)
    ohne sichtbares Gedränge bewegen
[ ] Bebaute Fläche liegt unter 25 % (verschärfter Richtwert), Rest ist Weg/Platz/Grün/Feld
[ ] Peripherie-Übergang zur Wildnis ist vorhanden, kein harter Kartenrand-Schnitt
[ ] REALITY CHECK (Pflicht, Abschnitt 58): frischer Screenshot einer vollen, belebten Stadt
    wurde tatsächlich angeschaut und mit der ursprünglichen Beschwerde "maximal überfüllt,
    alle stehen aneinander" abgeglichen — nicht nur die Kennzahlen geprüft
```


---

## 76. PROZEDURALE DUNGEONS *(neu)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:game-development`, `/agentic-awesome-skills:procedural-generation`, `/agentic-awesome-skills:level-design`, `/pixel-plugin:pixel-art-creator`, `/spritecook:spritecook-animate-assets`

**Designwunsch:** Es soll Orte geben, die man betreten kann und die sich bei jedem Betreten neu generieren — inklusive unterschiedlicher Schwierigkeitsgrade und besonderer Events, die dem Spieler angezeigt werden.

### Grundprinzip

> **Der Eingang ist fix (Teil der handgeplanten Welt), der Inhalt dahinter ist bei jedem Betreten neu.**

Das unterscheidet prozedurale Dungeons klar von den handgestalteten Dungeons aus Abschnitt 40 (Höhlen, Ruinen, Schreine mit festem Layout und narrativem Grund). Beide Typen dürfen nebeneinander existieren — nicht jeder Dungeon muss prozedural sein.

### Generierungsansatz — Raum-Modul-Prinzip (empfohlen)

Statt komplett zufälliger Tile-für-Tile-Generierung: ein Pool aus vorgefertigten, handgestalteten Raum-Modulen (Gang, Kreuzung, Kammer, Halle, Sackgasse, Sonderraum) wird bei jedem Betreten zu einem zusammenhängenden Layout zusammengesetzt (Graph-/Constraint-basiert, mit Erreichbarkeits-Validierung: jeder Raum muss vom Eingang aus erreichbar sein, kein isolierter Bereich).

**Warum Module statt reinem Zufall:** Das verhindert, dass prozedurale Dungeons generisch wirken — dasselbe Anti-Copy-Paste-Prinzip aus Abschnitt 66 gilt auch hier. Jedes Raum-Modul selbst muss die Qualitätsstandards aus Abschnitt 63 (Visuelle Details) und, wo Props vorkommen, aus Abschnitt 22 erfüllen.

### Schwierigkeitsvarianten

Ein prozeduraler Dungeon-Eingang kann in unterschiedlichen Schwierigkeitsstufen generiert werden, angelehnt an die Gefahrenstufen-Logik aus Abschnitt 71:

```text
Leicht     – wenige Räume, schwächere Gegner, Basis-Loot
Mittel     – mehr Räume, gemischte Gegnerzusammensetzung, bessere Loot-Chance
Schwer     – viele Räume, Elite-Gegner/Mini-Boss möglich, erhöhte Rarity-Chance (Abschnitt 30)
```

Ob die Schwierigkeit vom Eingangsort selbst abhängt (ein Dungeon in einer Stufe-3-Region generiert grundsätzlich schwerer, siehe Abschnitt 71) oder vom Spieler wählbar ist (z. B. über ein Ritual/einen Schalter am Eingang), gehört als bewusste Design-Entscheidung ins GDD.

### Event-System

Bei der Generierung wird zusätzlich zufällig (gewichtet) aus einem Event-Pool gewählt, der besondere Encounter erzeugt — diese werden dem Spieler beim Auftreten klar angekündigt (UI-Hinweis/Text-Einblendung), nicht stillschweigend eingebaut:

```text
Beispiele:
"Eingestürzter Gang"     – blockierter Weg, alternative Route oder Grabungs-Interaktion nötig
"Verfluchter Schrein"    – optionaler Bonus-Raum mit Risiko/Belohnung-Mechanik
"Gefangener NPC"         – befreibarer Gefangener, der danach eine kleine Belohnung/Questfolge auslöst
"Elite-Wache"            – stärkerer Sondergegner mit besserem Loot als Wächter eines Schlüsselraums
"Eingebrochener Boden"   – Fallentyp mit Fallschaden/Umweg
```

Events sind eine begrenzte, kuratierte Liste (kein beliebiger Zufallsgenerator für Ereignistext) — jedes Event braucht ein eigenes, im GDD dokumentiertes Verhalten, keine generische Platzhalter-Meldung.

### Wiederspielbarkeit

Jedes erneute Betreten desselben Dungeon-Eingangs erzeugt einen neuen Seed für diesen Lauf (Räume, Gegnerverteilung, Events). Der Eingang selbst und seine Position in der Welt bleiben stabil.

### Integration mit bestehenden Systemen

* **Szenenübergänge (Abschnitt 21):** Auch prozedural generierte Dungeons müssen die dort beschriebenen Regeln einhalten — Verfolgung/Kampfzustand darf beim Betreten nicht kommentarlos verschwinden.
* **Loot (Abschnitt 30):** Loot-Qualität skaliert mit gewählter/generierter Schwierigkeit.
* **Performance (Abschnitt 50):** Generierung darf keine spürbare Ladepause über das übliche Kartenwechsel-Budget hinaus verursachen; Raumanzahl ist entsprechend zu begrenzen.

### Datensatz-Vorlage

```json
{
  "dungeonTemplateId": "dungeon_procedural_mine",
  "roomPool": ["corridor_a", "corridor_b", "chamber_ore", "chamber_flooded", "deadend_collapsed", "hub_crossing"],
  "difficultyTiers": ["leicht", "mittel", "schwer"],
  "eventPool": [
    { "id": "collapsed_passage", "weight": 0.15 },
    { "id": "cursed_shrine", "weight": 0.08 },
    { "id": "captive_npc", "weight": 0.10 },
    { "id": "elite_guard", "weight": 0.12 }
  ],
  "maxRooms": 14,
  "guaranteedReachability": true
}
```

### Definition of Done — Prozedurale Dungeons

```text
[ ] Jeder Raum im Modul-Pool erfüllt für sich die Visual-/Prop-Qualitätsstandards (Abschnitt 22/63)
[ ] Erreichbarkeits-Validierung läuft bei jeder Generierung (kein isolierter/unerreichbarer Raum)
[ ] Mindestens 3 unterschiedliche Events sind implementiert und im Spiel beobachtet aufgetreten
[ ] Events werden dem Spieler sichtbar angekündigt, nicht stillschweigend eingebaut
[ ] Schwierigkeitsstufen unterscheiden sich spürbar in Gegnerstärke und Loot-Qualität
[ ] Szenenübergangs-Regeln (Abschnitt 21) gelten nachweislich auch hier
[ ] Ladezeit bei Generierung bleibt im Performance-Budget (Abschnitt 50)
[ ] Zehn Testdurchläufe am selben Eingang erzeugen erkennbar unterschiedliche Layouts
```


---

## 77. PROZEDURALE STÄDTE (SPÄTERE PHASE) *(neu)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:procedural-generation`

**Designwunsch:** Später sollen Städte stärker prozedural werden — Position, Name und Layout sollen sich je nach Seed verändern.

### Einordnung: bewusst eine SPÄTERE Phase

Dieser Abschnitt beschreibt ein **Zukunftsziel**, kein aktuelles Muss. Die sechs bestehenden, handgeplanten Siedlungen (Eren, Nordfurt, Salzhafen, Kreuzweg, Aschfurt, Sonnwacht) bleiben der feste, erzählerisch verankerte Kern der Welt. Prozedurale Städte sind eine **Erweiterung** (zusätzliche, nicht handgeplante Orte), kein Ersatz. Reihenfolge beachten (Abschnitt 55, Nicht zu früh expandieren): Tagesrhythmus, Raid-System, Siedlungsdichte (Abschnitte 41/74/75) und prozedurale Dungeons (Abschnitt 76) haben Vorrang, bevor an prozeduralen Städten gearbeitet wird.

### Drei Dimensionen der Prozeduralität

**1. Position** — Platzierung im Weltraster nach Seed, unter Einhaltung von Constraints: Mindestabstand zu bestehenden Siedlungen, Terrain-Eignung (nicht im See/Fels/Steilhang), Passung zur Gefahrenstufe der Region (Abschnitt 71 — eine friedliche Händlerstadt entsteht nicht mitten in einer Stufe-4-Zone, ein befestigtes Grenzfort dagegen schon eher).

**2. Name** — ein Namensgenerator, der zum bestehenden Namensmuster der Welt passt (erkennbare Endungen/Silben wie „-furt", „-wacht", „-hafen", „-weg", wie bei den bestehenden sechs Städten), keine stilfremden Fantasiesilben. Eine Silben-/Muster-Bank mit Regionscharakter (Küstenstadt-Namen klingen anders als Grenzfestungs-Namen) sorgt dafür, dass sich neue Namen wie ein natürlicher Teil von Rotfall: Legacy anfühlen statt wie eine andere Spielwelt.

**3. Layout** — ähnlich dem Raum-Modul-Prinzip aus Abschnitt 76, aber auf Siedlungsebene: ein Pool aus Bau-Modulen (Marktplatz-Typen, Mauer-/Tor-Konfigurationen, Wohnviertel-Blöcke, wirtschaftsspezifische Bereiche wie Hafen/Minenzugang/Ackerland) wird nach Seed zusammengesetzt.

### Kein Qualitätsrabatt für prozedural generierte Städte

> **Eine prozedural generierte Stadt muss exakt dieselbe Definition of Done erfüllen wie eine handgeplante — Gebäude-DoD (Abschnitt 20), Siedlungsdichte (Abschnitt 75), Bevölkerung/Tagesrhythmus (Abschnitt 41).**

„Prozedural" ist kein Freifahrtschein für niedrigere Qualität. Wenn der Modul-Pool nicht genug Varianz bietet, um das zu garantieren, ist der Pool zu klein — dann wird er erweitert, bevor die Funktion aktiviert wird (vgl. Abschnitt 66, Keine Copy-Paste-Content-Fabrik).

### Constraint-Validierung (Pflicht vor Platzierung)

```text
[ ] Mindestabstand zu allen bestehenden Siedlungen eingehalten
[ ] Terrain am Zielort geeignet (kein Wasser/Steilgelände/Overlap mit bestehenden Strukturen)
[ ] Gefahrenstufe der Region passt zum generierten Siedlungstyp
[ ] Name kollidiert nicht mit bestehenden Orten, passt zum Namensmuster der Region
```

### Datensatz-Vorlage

```json
{
  "seed": 84213,
  "procGenSettlement": {
    "position": { "checkedAgainst": ["minDistanceToExisting", "terrainSuitability", "dangerTierMatch"] },
    "nameGenerator": { "pattern": "Küstenstadt", "suffixPool": ["-hafen", "-bucht", "-furt"] },
    "layoutModulePool": ["market_small", "walls_wooden_palisade", "district_fishing", "district_housing_a"]
  }
}
```

### Definition of Done — Prozedurale Städte

```text
[ ] Erst begonnen, nachdem Abschnitte 41, 74, 75, 76 abgeschlossen sind (Reihenfolge-Prinzip, Abschnitt 55)
[ ] Alle Constraint-Validierungen laufen zuverlässig, keine kollidierenden/unsinnigen Platzierungen
[ ] Generierte Namen sind stilistisch nicht von handgeplanten Stadtnamen unterscheidbar
      (Stichprobentest: 10 generierte Namen vorlegen, ohne dass erkennbar ist, welche generiert sind)
[ ] Generierte Städte erfüllen dieselbe Gebäude-/Dichte-/Bevölkerungs-DoD wie handgeplante Städte
[ ] Mehrere Testläufe mit unterschiedlichen Seeds erzeugen sichtbar unterschiedliche, aber
    jeweils stimmige Ergebnisse (kein erkennbares Wiederholungsmuster)
```


---

## 78. FREISCHALTBARE TITEL-KLASSEN *(neu, hohe Priorität — korrigierte Fassung)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:narrative-design`, `/agentic-awesome-skills:shader-programming`, `/spritecook:spritecook-animate-assets`, `/pixel-plugin:pixel-art-creator`, `/agentic-awesome-skills:agent-memory`

**Designwunsch (Korrektur/Präzisierung):** Kein Ersatz der Startklasse, sondern ein eigenes System **freischaltbarer Titel** — erspielt im späteren Spielverlauf, mit eigenen besonderen Fähigkeiten, die sich zur bestehenden Klasse des Spielers **hinzuaddieren**. Nekromant und Hexenmeister über die Untoten-Fraktion sind das erste und wichtigste Beispiel dieses Systems, nicht das gesamte System selbst.

### Grundprinzip — Titel statt Klassentausch

> **Ein Titel ersetzt nicht die Startklasse (Abschnitt 32). Er ist eine zweite, später erspielte Ebene: eine kleine Zusatz-Identität mit eigenen Signature-Fähigkeiten, eigenem Skill-Tree-Ast und sichtbarem Erkennungsmerkmal, die sich mit jeder Startklasse kombinieren lässt.**

Ein Beispiel: Ein Spieler, der als Mage gestartet ist und später den Titel "Nekromant" erspielt, bleibt mechanisch ein Mage (Waffen, Grundressource, Basis-Skill-Tree unverändert), gewinnt aber zusätzlich Zugriff auf Nekromant-spezifische Fähigkeiten, einen eigenen kleinen Skill-Tree-Ast und ein sichtbares Merkmal. Das macht das System kombinierbar (Warrior-Nekromant spielt sich anders als Mage-Nekromant) statt exklusiv.

### Gemeinsames Muster aller Titel

```text
Freischalt-Bedingung:   i. d. R. eine mehrstufige Quest (nicht ein einzelner Dialog-Klick),
                         oft an eine Fraktion gebunden (siehe Abschnitt 43)
Zeitpunkt:               bewusst im mittleren bis späten Spielverlauf, nicht am Spielstart
                         verfügbar
Signature-Fähigkeiten:   2-4 neue, titelspezifische Fähigkeiten
Skill-Tree-Ast:          kleiner eigener Ast, erreichbar erst nach Freischaltung (siehe Abschnitt 31)
Sichtbares Merkmal:      ein erkennbares kosmetisches Zeichen am Charakter
Welt-Konsequenz:         mindestens eine Fraktion reagiert erkennbar anders auf den Spieler
```

Jeder neue Titel, der später hinzukommt, wird nach genau diesem Muster gebaut — das hält das System erweiterbar, ohne dass jeder Titel neu erfunden werden muss.

### Flaggschiff-Beispiel: Nekromant & Hexenmeister (Untoten-Fraktion)

Das ist der wichtigste, zuerst umzusetzende Titel-Pfad — mit hoher Priorität zu behandeln. Zusätzlicher Vorteil: Das **Totenreich** hat laut aktuellem Bug-Stand große, leere, inhaltsarme Flächen — dieses Questsystem ist der natürliche Ort, dort sinnvollen, thematisch stimmigen Inhalt zu bauen, statt zwei separate Baustellen offen zu halten.

```text
NEKROMANT (Titel)
Thematik:    Pakt mit den Toten/Ahnen des Totenreichs, Kontrolle statt Zerstörung
Fokus:       Beschwörung/Kontrolle untoter Diener, Lebensentzug, Verfalls-Effekte
Ressource:   eigene Zusatzressource, z. B. "Seelenessenz" (unabhängig von der Basisklasse)
Ton:         kontrollierend, geduldig, aufbauend (eigene Diener-Armee)

HEXENMEISTER (Titel)
Thematik:    Pakt mit einer dunkleren, chaotischeren Macht (Schattenwesen — passt zum
             bereits vorhandenen VFX "Shadow Lightning", Abschnitt 36)
Fokus:       Flüche, Debuffs, Chaos-Magie, Selbstschaden-für-Macht-Mechaniken
Ressource:   eigene Zusatzressource, z. B. "Verderbnis" mit Risiko/Belohnung-Charakter
Ton:         aggressiver, riskanter, destruktiver als der Nekromant
```

Beide teilen sich den Zugang über dieselbe Fraktion, verzweigen sich aber an einem klar erkennbaren Entscheidungspunkt in der Questkette — nicht zwei Reskins derselben Quest.

### Questkette (mehrstufig — kein einzelner Dialog-Klick)

```text
1. ERSTER KONTAKT
   Spieler erreicht das Totenreich (bestehender Ort, siehe Abschnitt 37) und überlebt dort
   einen ersten Kontakt mit der Untoten-Fraktion (Fraktions-Rufskala aus Abschnitt 43 gilt
   auch hier — Start vermutlich bei "Misstrauisch" oder schlechter)
   ↓
2. PRÜFUNG / BEWEIS
   Eine konkrete Aufgabe, die Entschlossenheit zeigt: ein Ritual-Gegenstand bergen, einen
   Wächter im Totenreich bestehen (Kampf ODER Überzeugung — beides sollte möglich sein),
   eine Botschaft überbringen. Hier werden die leeren Totenreich-Flächen aus dem offenen
   Bug sinnvoll mit Inhalt gefüllt (Schreine, Wächter-Arena, Ruinen)
   ↓
3. ENTSCHEIDUNGSPUNKT
   Verzweigung sichtbar in Nekromant- vs. Hexenmeister-Pfad — z. B. zwei unterschiedliche
   Fraktionsfiguren/Mächte, die konkurrierend um den Spieler werben
   ↓
4. PAKT / INITIATION
   Ein inszenierter Ritual-Moment (eigene kleine Szene, nicht nur ein Textfenster) mit
   spürbaren Kosten — siehe Konsequenzen unten
   ↓
5. TITEL-FREISCHALTUNG
   Neue Zusatzressource, neue Signature-Fähigkeiten, neuer Skill-Tree-Ast (siehe unten)
   sind ab sofort zusätzlich zur bestehenden Klasse verfügbar
```

### Konsequenzen (Pflicht — sonst ist es nur ein Skin-Wechsel)

Der Pakt muss die Welt spürbar verändern, nicht nur das eigene Charakterblatt:

* **Fraktionsreaktion (Abschnitt 43/44):** "gute"/ordnungstreue Fraktionen (allen voran der Orden aus Sonnwacht) reagieren negativ — Ruf-Verlust, härtere Preise, evtl. aktive Feindseligkeit ab einer Schwelle. Die Untoten-Fraktion selbst reagiert positiv/vertrauter.
* **Sichtbare Veränderung am Charakter:** ein erkennbares kosmetisches Zeichen (z. B. veränderte Augenfarbe, leichter Partikel-/Schatteneffekt, veränderte Umhang-Silhouette) — andere NPCs sollen erkennbar anders auf den Spieler reagieren können, nicht nur der interne Ruf-Wert.
* **NPC-Dialogänderungen:** mindestens die Hauptorte (Städte, Abschnitt 39) bekommen je 1–2 angepasste Dialogzeilen, die auf den Pakt reagieren, wenn er bekannt ist.
* **Umkehrbarkeit als bewusste GDD-Entscheidung:** Empfehlung: nicht trivial rückgängig machbar (macht die Wahl bedeutsam), aber das muss explizit festgelegt und nicht implizit im Code entschieden werden — gleiches Prinzip wie bei Refactoring-Entscheidungen (Abschnitt 2) und Szenenübergängen (Abschnitt 21): keine stillschweigenden Zustandsänderungen.

### Skill-Tree-Anbindung (siehe Abschnitt 31)

Jeder Titel bekommt einen eigenen kleinen Ast im MAGIC-Bereich des Skill Trees, unabhängig vom Skill-Tree-Ast der Basisklasse, mit mindestens einem eigenen Keystone:

```json
{
  "id": "skill_magic_keystone_necromancer_legion",
  "branch": "MAGIC",
  "type": "keystone",
  "titleRequired": "necromancer",
  "requires": ["quest_necromancer_pact_completed"],
  "effect": "Bis zu 3 untote Diener gleichzeitig beschwörbar, dafür -20% eigener Direktschaden",
  "designIntent": "Baut auf Kontrolle/Armee statt Einzelkampf, klare Identität gegenüber dem Mage"
}
```

### Datensatz-Vorlage (Titel-Freischaltung)

```json
{
  "titleId": "necromancer",
  "compatibleWithAnyBaseClass": true,
  "unlockCondition": "quest_chain_undead_pact_necromancer_completed",
  "faction": "untote",
  "startingFactionStanding": "misstrauisch",
  "opposingFactionReaction": { "orden_sonnwacht": "ruf -30, feindselig ab Schwelle X" },
  "cosmeticMarker": "eyes_glow_pale_green",
  "reversible": false
}
```

### Definition of Done — Titel-System / Nekromant & Hexenmeister

```text
[ ] Titel ersetzt nachweislich NICHT die Basisklasse — Waffen/Grundressource/Basis-Skill-Tree
    der Startklasse bleiben unverändert erhalten
[ ] Titel ist mit mindestens 2 unterschiedlichen Startklassen getestet worden (kombinierbar)
[ ] Questkette hat alle 5 Stufen (Kontakt, Prüfung, Entscheidung, Initiation, Freischaltung)
    und ist nicht in einem einzigen Dialog abgehandelt
[ ] Beide Pfade (Nekromant/Hexenmeister) unterscheiden sich klar in Ton, Fokus und Fähigkeiten
[ ] Mindestens 2-3 der bisher leeren Totenreich-Flächen (offener Bug) sind mit Quest-relevanten
    Orten gefüllt worden — diese Synergie wurde tatsächlich genutzt
[ ] Fraktionsreaktion ist spielbar getestet: mindestens eine "gute" Fraktion reagiert nachweislich
    anders auf den Spieler nach dem Pakt
[ ] Sichtbares kosmetisches Merkmal ist im Spiel vorhanden, nicht nur eine interne Variable
[ ] Skill-Tree-Ast des Titels ist erreichbar erst nach Abschluss der Quest
[ ] Umkehrbarkeits-Entscheidung ist im GDD dokumentiert, nicht nur implizit im Code
[ ] System ist im GDD so beschrieben, dass ein weiterer Titel nach demselben Muster
    (siehe "Gemeinsames Muster" oben) ergänzt werden kann, ohne diesen Abschnitt neu zu schreiben
```



---

## 79. NPC-BEZIEHUNGEN, MEINUNGEN & GERÜCHTE *(neu)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:agent-memory`, `/agentic-awesome-skills:dialogue-system`, `/agentic-awesome-skills:narrative-design`, `/spritecook:spritecook-animate-assets`

**Designwunsch:** NPCs sollen dynamisch miteinander interagieren — sie sollen Leute haben, die sie mögen oder nicht mögen, Leute, denen sie aus dem Weg gehen, Leute, über die sie schlecht reden. Dazu sichtbare Sprechblasen, die zeigen, wie sich Leute über Dinge unterhalten, die passieren oder passiert sind.

### Grundprinzip

> **NPCs haben Meinungen übereinander und über die Welt — und diese Meinungen sind sichtbar, nicht nur eine interne Zahl.**

Das baut direkt auf den "Talk Pairs" aus Abschnitt 41 auf, geht aber weiter: dort war die Interaktion neutral/generisch, hier bekommt sie **Inhalt und Vorzeichen**.

### Beziehungswerte zwischen NPCs

Jedes NPC-Paar, das sich kennt (Nachbarn, Kollegen, Familie — siehe Talk-Pairs-Konzept aus Abschnitt 41), bekommt einen einfachen Beziehungswert:

```text
Mag           – sucht aktiv Nähe/Gespräch, wärmere Begrüßung wenn Spieler zuhört
Neutral        – normale Talk-Pair-Interaktion wie bisher
Mag nicht      – geht sich sichtbar aus dem Weg (Pathfinding/Standortwahl meidet den anderen,
                 siehe Abschnitt 17), kürzere/kühlere Interaktionen falls es doch zum Kontakt kommt
Verachtet      – redet nachweislich schlecht über die Person (siehe Gerüchte unten), meidet aktiv
```

Diese Werte müssen nicht komplex simuliert werden — ein statischer, im GDD/Datensatz hinterlegter Ausgangswert pro Beziehung reicht für den Anfang; dynamische Veränderung durch Spielerhandlungen ist ein mögliches späteres Ausbaustadium, kein Pflichtteil dieser ersten Stufe.

### Gerüchte-System (dynamisch, weltbezogen)

Zusätzlich zu den festen Beziehungen brauchen NPCs ein **Gerüchte-Repertoire**, das sich auf tatsächliche Weltereignisse bezieht:

```text
Mögliche Gerüchtquellen:
- Ergebnis eines Raids (Abschnitt 74: gescheitert/erfolgreich abgewehrt)
- Schicksal einer Karawane (Abschnitt 16: angekommen/überfallen)
- Tod eines regionalen Bosses (Abschnitt 73: Machtverschiebung)
- Handlungen des Spielers (Verbrechen, siehe Abschnitt 44; Pakt-Wahl, siehe Abschnitt 78)
- lokale Alltagsereignisse (Streit zwischen zwei NPCs, schlechte Ernte, o. ä. — kleinere,
  leichtgewichtige Zufallsereignisse)
```

Ein Gerücht ist ein kurzer, vorformulierter Text-Schnipsel (kein generatives/beliebiges System nötig), der an ein Ereignis gekoppelt ist und für eine begrenzte Zeit im "aktiven Gerüchte-Pool" der betroffenen Siedlung liegt. NPCs greifen bei ihren Talk-Pair-Interaktionen (Abschnitt 41) bevorzugt auf aktuelle Gerüchte zurück, bevor sie auf generische Standard-Sprechblasen zurückfallen.

### Sprechblasen (Pflicht, sichtbar)

Die eigentliche Umsetzung ist eine kurze, zeitlich begrenzte Sprechblase über den beteiligten NPCs während ihrer Talk-Pair-Interaktion (Abschnitt 41) — ein Satz oder kurzer Wortwechsel, kein Dialogfenster. Beispiele (Platzhalter-Ton, tatsächlicher Text passend zum Setting formulieren):

```text
"Hast du gehört? Die Karawane nach Nordfurt ist nie angekommen..."
"Seit der Hauptmann tot ist, patrouillieren die Wachen kaum noch."
"Ich mag Aldric nicht. Der redet immer nur über sich."
```

### Datensatz-Vorlage

```json
{
  "npcRelation": { "from": "npc_maren", "to": "npc_aldric", "standing": "mag_nicht" },
  "rumor": {
    "id": "rumor_caravan_lost_nordfurt",
    "triggerEvent": "caravan_destroyed:nordfurt_route",
    "text": "Hast du gehört? Die Karawane nach Nordfurt ist nie angekommen...",
    "activeDurationDays": 5,
    "eligibleSettlements": ["eren", "nordfurt"]
  }
}
```

### Definition of Done — NPC-Beziehungen & Gerüchte

```text
[ ] Mindestens ein Teil der Talk-Pairs aus Abschnitt 41 hat einen definierten Beziehungswert
    (nicht alle NPCs müssen abgedeckt sein, aber es muss beobachtbare Beispiele geben)
[ ] "Mag nicht"/"Verachtet"-Paare meiden sich nachweislich (Standortwahl/Pathfinding)
[ ] Mindestens 3 unterschiedliche Gerücht-Trigger sind implementiert (z. B. Karawane, Raid, Bosstod)
[ ] Sprechblasen sind im Spiel tatsächlich sichtbar aufgetreten, nicht nur als Datenstruktur vorhanden
[ ] Gerüchte verschwinden nach Ablauf der Gültigkeitsdauer wieder aus dem aktiven Pool
```

---

## 80. QUESTTAFEL (QUEST BOARD) *(neu)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:frontend-design`, `/agentic-awesome-skills:ui-ux-design`, `/agentic-awesome-skills:dialogue-system`, `/pixel-plugin:pixel-art-creator`

**Designwunsch:** In jeder größeren Stadt soll es eine Questtafel geben, die einem die Location und den NPC sagt, zu dem man als Nächstes hin muss.

### Grundprinzip

> **Die Questtafel ist eine physische, anklickbare Station im Marktbereich jeder größeren Stadt (siehe Abschnitt 39), die verfügbare Quests mit Zielort und Ansprechpartner auflistet — kein verstecktes Menü, sondern ein Objekt in der Welt.**

### Inhalt pro Eintrag

```text
Questtitel (kurz)
Zielort/Region (grober Hinweis, kein exakter Wegpunkt-Zwang — passend zum Erkundungscharakter)
Ansprechpartner-NPC (Name + grobe Position, z. B. "Aldric, Schmiede im Marktviertel")
Kurzbeschreibung (1 Satz)
```

### Umsetzung

* Physisches Prop "Questtafel" (Anschlagbrett) als Teil der Stadtmöblierung (siehe Props, Abschnitt 22 — muss denselben Detailanforderungen genügen, kein Platzhalter-Objekt).
* Interaktion öffnet eine einfache Listenansicht (UI, siehe Abschnitt 47) mit den oben genannten Feldern.
* Nur Quests, die in der jeweiligen Region/Stadt tatsächlich sinnvoll sind, erscheinen an dieser Tafel — keine globale Liste aller Quests im Spiel an jeder Tafel (siehe Abschnitt 45, Quests: Verbindung zur Weltsimulation).
* Bereits abgeschlossene oder dem Spieler nicht zugängliche Quests (Voraussetzungen nicht erfüllt) werden nicht angezeigt oder klar als gesperrt markiert — keine irreführenden Einträge.
* Die Tafel ersetzt nicht die eigentliche Quest-Vergabe durch den NPC selbst (Immersion: der Spieler geht trotzdem hin und redet mit der Person), sie ist eine **Orientierungshilfe**, kein Auto-Quest-Annahme-Menü.

### Definition of Done — Questtafel

```text
[ ] Jede größere Stadt (Abschnitt 39) hat eine sichtbare, erreichbare Questtafel
[ ] Tafel zeigt Titel, groben Zielort und Ansprechpartner für jede aktuell relevante Quest
[ ] Nur kontextuell passende/verfügbare Quests werden angezeigt, keine globale Spamliste
[ ] Tafel-Objekt erfüllt die Prop-Qualitätsstandards aus Abschnitt 22
[ ] UI-Darstellung passt zum Stilstandard aus Abschnitt 47 (kein generisches Web-Menü)
```

---

## 81. GROSSE BEFREIUNGS-/ENDGAME-ORTE BRAUCHEN EINEN ECHTEN GAMEPLAY-HÖHEPUNKT *(neu, wichtig)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:architecture`, `/agentic-awesome-skills:level-design`, `/spritecook:spritecook-animate-assets`, `/agentic-awesome-skills:game-audio`

**Konkret beobachtetes Problem:** Beim Betreten und "Befreien" der Skelett-Stadt passiert aktuell nichts weiter als eine Textmeldung ("Du bist nun der Befreier von …"). Kein epischer Kampf, keine Gegnerwellen, kein Dungeon, den man tatsächlich bekämpfen muss — obwohl genau das eines der großen Endziele des Spiels sein soll.

### Grundregel

> **Ein narrativ als "groß"/"episch" angekündigter Ort löst sich niemals allein durch einen Text-/Flag-Wechsel auf. Der erzählerische Anspruch braucht einen entsprechenden Gameplay-Höhepunkt.**

Das ist ein Sonderfall der Definition of Done aus Abschnitt 58 (Kennzahlen/Flags sind kein Ersatz für tatsächliches Erlebnis) — hier speziell für Content, der sich als Meilenstein/Endziel ausgibt.

### Mindestanforderung für einen "Befreiungs"-Ort dieser Größenordnung

```text
Gegnerwellen ODER strukturierter Encounter   – kein Ein-Klick-Sieg; mehrere Kampfabschnitte,
                                                 idealerweise mit steigender Intensität
Eigenständiger Dungeon/eigene Arena           – ein Ort mit eigenem Layout, nicht nur ein
                                                 Textereignis an einem bestehenden Punkt
                                                 (Bezug zu Abschnitt 40, Dungeons)
Abschließender Bosskampf oder gleichwertiger  – siehe Abschnitt 35 (Bosses) und, falls der Ort
Höhepunkt                                       fraktionsgebunden ist, Abschnitt 73 (Regionale
                                                 Bosse & Welt-Konsequenzen) für die Folgen danach
Sichtbare Welt-Konsequenz nach dem Sieg        – nicht nur ein neuer Titel/Flag für den Spieler,
                                                 sondern eine Veränderung des Ortes selbst (siehe
                                                 Abschnitt 73: Machtverschiebung, Gebietskontrolle,
                                                 NPC-Reaktionen)
```

### Einordnung — nicht jeder Ort braucht das

Diese Anforderung gilt für Orte, die narrativ als große Meilensteine/Endziele eingeführt werden (wie die Skelett-Stadt) — nicht für jede kleinere Quest. Ein einfacher Botengang bleibt ein einfacher Botengang. Die Diskrepanz zwischen erzählerischem Anspruch ("großes Endziel") und tatsächlichem Gameplay-Umfang ist das eigentliche Problem, nicht die Kürze an sich.

### Vorgehen

1. Bestehende große Befreiungs-/Meilenstein-Orte im GDD auflisten (die Skelett-Stadt ist der bekannte erste Fall).
2. Für jeden dieser Orte prüfen, ob die Mindestanforderung oben bereits erfüllt ist.
3. Wo nicht: als eigene Aufgabe einplanen (Dungeon-Layout, Gegnerwellen/Boss, Konsequenz-Ausgestaltung) — das ist Content-Arbeit vergleichbar mit einem regionalen Boss (Abschnitt 73) oder einem handgeplanten Dungeon (Abschnitt 40), keine kleine Korrektur.

### Definition of Done

```text
[ ] Jeder als "groß"/Endziel eingeführte Befreiungs-Ort hat einen eigenständigen Dungeon/eine
    eigene Arena, keine reine Textauflösung
[ ] Mindestens ein strukturierter Mehrfach-Encounter (Wellen oder mehrstufiger Bosskampf) ist vorhanden
[ ] Sieg hat eine sichtbare Welt-Konsequenz am Ort selbst, nicht nur einen Spieler-Titel
[ ] Getestet: ein Spieler, der den Ort betritt, erlebt einen tatsächlichen Kampf-Höhepunkt,
    keinen Ein-Klick-Textwechsel
```


---

## 82. BALANCING-UPDATE — SPIEL UND BOSSE SIND ZU LEICHT *(neu, wichtig)*

**Verwende:** `/ponytail:ponytail`, `/agentic-awesome-skills:game-design`, `/agentic-awesome-skills:balance-check`, `/agentic-awesome-skills:combat-design`, `/agentic-awesome-skills:game-development`

**Designwunsch:** Ein großes Balancing-Update — mehr Gegner, mehr Waffen, schwierigere Gebiete. Aktuell sind das Spiel insgesamt und speziell die Bosse zu leicht.

### Grundregel — Schwierigkeit ist nicht dasselbe wie höhere Zahlen

> **Mehr HP und mehr Schaden allein ist keine Schwierigkeit, nur ein längerer/schneller Kampf gegen dieselbe simple Taktik. Echte Schwierigkeit kommt aus mehr zu beachtenden Variablen: Gegnerverhalten, Timing, Positionierung, Ressourcenmanagement.**

Reines Zahlen-Hochdrehen widerspricht außerdem Abschnitt 34 (Anti-Kiting) und Abschnitt 28 (Gegner-Ausdauer): Wenn ein Gegner mit den bestehenden Cheese-Lücken (Rückwärtslaufen, siehe eurer BUG-076) einfach mehr HP bekommt, dauert der triviale Sieg nur länger — das Problem bleibt bestehen. **Deshalb hat die Behebung von BUG-076 (Rückwärtslaufen zu einfach) und die Umsetzung der Anti-Kiting-Bausteine aus Abschnitt 34 Vorrang vor reinem Zahlen-Tuning in diesem Balancing-Update** — sonst wird nur eine kaputte Taktik langsamer statt weniger effektiv.

### Drei Stoßrichtungen

```text
1. MEHR GEGNER       – siehe Abschnitt 33 (Enemy Expansion). Der dortige Hinweis "bewusst
                        niedrige Priorität" gilt ab jetzt nicht mehr uneingeschränkt: im
                        Rahmen dieses Balancing-Updates sind neue, eigenständige Gegnertypen
                        (nicht nur Farbvarianten, siehe Abschnitt 66) ausdrücklich Teil der
                        Aufgabe, weil Schwierigkeit auch aus Varianz kommt.
2. MEHR WAFFEN        – siehe Abschnitt 29 (Weapon Expansion). Neue Waffen sollen auch neue
                        Spielstile/Antworten auf schwierigere Gegner ermöglichen, nicht nur
                        weitere Werte-Varianten derselben paar Grundtypen sein.
3. SCHWIERIGERE GEBIETE – siehe Abschnitt 71 (Gefahrenregionen). Bestehende Gefahrenstufen
                        (besonders Stufe 3/4) überprüfen: Sind sie tatsächlich spürbar
                        gefährlicher, oder nur nominell? Telegraphing bleibt Pflicht
                        (Abschnitt 71) — schwerer heißt nicht unfair.
```

### Bosse — eigener Schwerpunkt

**Konkret beobachtetes Problem:** Bosse sind zu leicht. Das ist ein eigener Punkt neben der generellen Gegnerschwierigkeit, weil Bosse (Abschnitt 35/73) einen höheren narrativen und spielerischen Anspruch haben als reguläre Gegner (siehe auch Abschnitt 81: großer Anspruch ohne passenden Gameplay-Gegenwert ist bereits an anderer Stelle als Problem erkannt worden).

Ansatzpunkte, bevor an reinen Zahlen gedreht wird:

```text
Phasenübergänge (Abschnitt 35)   – erzwingen sie tatsächlich eine Verhaltensänderung beim
                                    Spieler, oder laufen sie durch wie die vorige Phase mit
                                    mehr Schaden?
Telegraph-Fenster                 – zu großzügig bemessen? Ein Boss, dessen Angriffe der
                                    Spieler ohne Risiko aussitzen kann, ist zu vorhersehbar
Bestrafung von Passivität          – hat der Boss eine Antwort auf reines Abwarten/Kiten
                                    (siehe Abschnitt 34, Anti-Kiting — gilt auch für Bosse)?
Arena-Nutzung                      – nutzt der Kampf die Arena (Hindernisse, Fallen, Fläche),
                                    oder ist die Arena nur Kulisse?
Ausdauer-Interaktion               – nutzt der Boss die Gegner-Ausdauer-Mechanik aus
                                    Abschnitt 28 sinnvoll (z. B. eigene Durchbruchsangriffe
                                    bei Spieler-Erschöpfung)?
```

Erst wenn diese Punkte ausgeschöpft sind, sind reine Wert-Anpassungen (mehr HP/Schaden) das Mittel der Wahl — nicht als erster, sondern als letzter Hebel.

### Methodik statt Bauchgefühl

**Verwende `/agentic-awesome-skills:balance-check`, wo installiert.** Balancing ohne Messwerte ist Rätselraten:

```text
Baseline erheben     – Time-to-Kill (Spieler tötet Gegner), Time-to-Death (Gegner tötet
                        Spieler im Worst Case), Schaden pro Spielerangriff im Verhältnis
                        zur Gegner-HP, Anzahl Versuche bis zum Bosssieg im Testlauf
Zielwerte festlegen   – im GDD dokumentieren, was "angemessen schwer" für jede Gefahrenstufe
                        (Abschnitt 71) konkret heißt (z. B. TTK-Bereich, akzeptable Todesrate
                        bei Erstversuch eines Bosses)
Iterativ anpassen     – eine Variable nach der anderen ändern (nicht Verhalten UND Werte
                        gleichzeitig), erneut messen
Re-Test               – nach jeder spürbaren Änderung erneuter Kampf-Durchlauf, nicht nur
                        Zahlenvergleich auf dem Papier
```

### Definition of Done — Balancing-Update

```text
[ ] BUG-076 (Rückwärtslaufen im Kampf) behoben, bevor Boss-/Gegnerwerte angehoben werden
[ ] Mindestens ein neuer, eigenständiger Gegnertyp (kein Reskin) ist Teil des Updates
[ ] Mindestens eine neue Waffe mit eigenem taktischen Nutzen (nicht nur andere Zahlen)
[ ] Gefahrenstufen 3/4 (Abschnitt 71) wurden gegen die eigene Definition ("spürbar gefährlicher")
    geprüft, nicht nur gegen die Zahl
[ ] Jeder überarbeitete Boss hat mindestens eine der Ansatzpunkte oben (Phasenwechsel,
    Telegraph, Passivitäts-Antwort, Arena, Ausdauer) tatsächlich verbessert — nicht nur HP/Schaden
[ ] Baseline-Messwerte (TTK, Todesrate) vor und nach der Änderung liegen vor, nicht nur
    ein subjektiver Eindruck
[ ] REALITY CHECK (Abschnitt 58): tatsächlicher Testkampf nach der Änderung durchgeführt
    und mit der ursprünglichen Beschwerde "zu leicht" abgeglichen
```
