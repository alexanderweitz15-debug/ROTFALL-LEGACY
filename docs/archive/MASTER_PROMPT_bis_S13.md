# ROTFALL: LEGACY — Master-Prompt (gestrafft, Session 13)

Stehender Auftrag des Nutzers. Diese Fassung ersetzt die beiden langen Master-Prompts. Was dort erledigt oder überholt war, ist entfernt. Die Originale liegen unverändert in `docs/archive/` (nur zum Nachschlagen, nicht mehr bindend).

**Bei Widersprüchen gilt:** die neueste Entscheidung des Nutzers (`docs/PLAN_OFFEN.md`) vor diesem Dokument, dieses Dokument vor allem anderen.

---

## 1. Ziel

ROTFALL wird eine **lebendige, simulierte, sich entwickelnde RPG-Welt**. Nicht mehr Inhalt, sondern mehr systemische Tiefe:
- NPCs haben Rollen und arbeiten; Gebäude erfüllen Funktionen; Städte funktionieren wirtschaftlich.
- Quests entstehen aus der Welt; Ereignisse verändern die Welt dauerhaft.
- Fraktionen, Gegner und Gegenstände haben eine eigene Identität, nicht nur eine eigene Farbe.
- Die Welt läuft weiter, wenn der Spieler geht (fern vom Spieler abstrakt gerechnet).

**Leitfragen jeder Änderung:** Ist es spielbar und stabil? Ist es logisch (würde ein echter Spieler es hinterfragen)? Fühlt es sich hochwertig an?

---

## 2. Sitzungsablauf

**Start (immer):**
1. `docs/SESSION_LOG.md`, `docs/PHASE_STATUS.md`, `docs/BUGS.md` lesen (offene HIGH-Bugs zuerst).
2. `docs/PLAN_OFFEN.md` für die neuesten Nutzerentscheidungen.
3. Dev-Server ohne Cache starten, Selbsttest laufen lassen (`?dev`, `RF.selftest()`).

**Ende (immer):** `BUGS.md`, `CHANGELOG.md`, `SESSION_LOG.md`, `GDD.md`, `PHASE_STATUS.md` nachziehen; bei neuen Systemen auch `WELTREGELN.md` (Status-Zeichen) und bei neuen Inhalten `GUIDE.md`.

---

## 3. Harte Regeln

1. **Tests und Proben verändern nie den echten Spielstand** (Held, Gold, Welt, Märkte). Sandbox für alles; der Selbsttest prüft das am Ende selbst (BUG-123). Nur Debug-*Aktionen*, die der Nutzer bewusst auslöst, dürfen das Spiel verändern.
2. **Bugs an der Ursache beheben**, nie am Symptom. Jeder Fix bekommt einen Regressionstest. Tests werden nie gelöscht. Wackelnde Tests sind Bugs.
3. **Leistungsbudget:** Zeichnen ≤ 2 ms, Spiellogik ≤ 3 ms je Bild.
4. **Reality-Check mit Screenshots** nach sichtbaren Änderungen. Kennzahlen ersetzen keine Wahrnehmung.
5. **Bestehendes behalten.** Keine Komplett-Neuschreibungen ohne Grund; Refactoring nur mit genanntem Grund.
6. **Keine Fake-Features:** Ein System ist erst fertig, wenn es im Spiel wirkt, nicht wenn Knopf oder Menü existieren. Keine Platzhalter, keine halben Systeme.
7. **Downloads nur mit ausdrücklicher Erlaubnis.** Kein Git (der Nutzer pusht selbst).
8. **Keine SpriteCook-, Pixel-Plugin- oder Aseprite-Werkzeuge.**
9. **Der Nutzer will gefragt werden**, bei Lore, Richtungsentscheidungen und allem, was er selbst prägen möchte. Kleinigkeiten selbst sinnvoll entscheiden.
10. **Sprache:** Chat mit dem Nutzer kurz, auf Deutsch (Caveman-Stil). Code, Kommentare und Dokumente in normaler, klarer Prosa.
11. **Urheberrecht:** Figuren und Namen sind eigene Schöpfungen, keine Kopien (z. B. Piratenkönig „Weißbart“: eigene Geschichte, eigenes Aussehen, eigene Waffe).

---

## 4. Qualitätsregeln der Welt

- **Warum ist das hier?** Jeder Gegner, jedes Objekt, jede Figur braucht einen Grund, an genau diesem Ort zu sein. Keine unlogischen Spawns, keine Kisten ohne Zweck.
- **Keine NPC-Puppen:** Niemand steht dumm herum oder läuft gegen Türen. Händler nur zu ihren Zeiten im Laden. NPCs ballen sich nicht.
- **Kampf:** keine Treffer durch Wände, Fernkampf braucht Sichtlinie, keine XP für null Schaden, keine unendliche Gegner-Skalierung (Stufe nach Gebiet), Angriffe werden angesagt.
- **Tod und Boden sind endgültig:** Tote und Liegende denken und handeln nicht mehr.
- **Städte:** passende Größe und Bevölkerung, erkennbare Gebäude mit Innenleben, keine Kopier-Städte.
- **Fraktionen** unterscheiden sich in Waffen, Rüstung, Architektur, Figuren, Bannern, Effekten und einer eigenen Kernmechanik.
- **Große Ereignisse** sind dauerhafte Weltzustände mit Kamerafahrt, keine Quests.

---

## 5. Stil

- **Aktiv:** der klassische, im Code gemalte Stil. Stil F (Referenz 5, Atlas) ist auf Wunsch des Nutzers vorerst aus und bleibt in den Optionen wählbar; darüber wird später gesprochen.
- Neue große Grafik nur über die Aufträge in `docs/PROMPTS_GRAFIK.md`.
- Vor breiten Stiländerungen dem Nutzer Screenshots zeigen.

---

## 6. Arbeitsweise

1. Problem und Code vollständig verstehen (alle Aufrufer prüfen), dann die kleinste Änderung am richtigen Ort.
2. Test schreiben, Selbsttest mehrmals laufen lassen, Spielstand vorher und nachher vergleichen.
3. Screenshot prüfen.
4. Dokumente nachziehen.

Passende Skills nutzen (ponytail, caveman, systematic-debugging, game-design, 2d-games). Subagenten nur, wenn der Nutzer es verlangt.

---

## 7. Wo was steht

| Dokument | Inhalt |
|---|---|
| `WELTREGELN.md` | Soll und Ist aller Systeme mit Status (✅ 🟡 ⬜), offene Aufgaben in §15 |
| `PLAN_OFFEN.md` | Entscheidungen des Nutzers und offene Punkte je Bereich |
| `PHASE_STATUS.md` | Phasen und ihr Stand |
| `BUGS.md` | alle Bugs mit Ursache, Fix und Test |
| `GDD.md` | Spielregeln und Werte im Detail |
| `GUIDE.md`, `GUIDE_EREIGNISSE.md` | Spieler-Guide und große Ereignisse |
| `PROMPTS_GRAFIK.md` | Bildaufträge für neue Vorlagen |

---

## 8. Reihenfolge der offenen Arbeit

Stand und Einzelheiten: `PLAN_OFFEN.md` (Entscheidungen) und `AUDIT_S13.md` (offene Audit-Punkte).

1. Anzeige aktiver Effekte (Symbolleiste mit Tooltip und Effekte-Fenster).
2. Stufen überarbeiten: Held, Gegnerstufen je Gebiet, Level-Design.
3. Gegner-Vielfalt: Varianten je Art, neue Arten, mehr Verhalten.
4. Dungeons mit mehreren Ebenen, zufällig erzeugt, Loot nach Schwere; sehr schwere im Untotenland und in Aurelion.
5. Mehr Dialog: Bewohner, Begleiter, wichtige Figuren, Gegner.
6. Aussehen wichtiger Figuren, mehr benannte NPCs und Begleiter, mehr Vielfalt bei Bewohnern.
7. Reise nach Aurelion (Einlass oder Zeltlager), Kutschen und Fähren.
8. Mehr Waffen (Fraktionssets, neue Arten, Unikate, Magitech) und Animationen.
9. Gleichwertige Ränge, Kernmechanik je Fraktion, restliche Kampf-KI.
10. Tiere, dann das Seevolk (Piratenkönig Weißbart), Fraktionskriege, Nordreich, Sandfürsten.
11. Offene Bugs und Kleinigkeiten aus `AUDIT_S13.md` und `BUGS.md`.

---

## 9. Auftrag S13b (Nutzer, 2026-09-28) — Quests, Welt, Transparenz

Arbeite am bestehenden Projekt weiter; nichts Funktionierendes unnötig neu bauen. Erst prüfen, dann gezielt erweitern und Fehler beheben. Nicht nachfragen, abarbeiten.

**Gemeldete Bugs und Wünsche (zuerst):**
- „Handeln“ am Stand/an der Theke öffnet keinen Handel. Pakete lassen sich nicht abgeben.
- Eskorten: NPC zu langsam, Ziel unklar (Marker, Entfernung, Route).
- Aufträge: höchstens 5 gleichzeitig, Zeitlimits, selbst abbrechen. Stirbt der Eskortierte: Auftrag gescheitert, Ruf −, das Dorf redet darüber, weniger Aufträge. Stirbt der Auftraggeber: Abbruch ohne Rufverlust. Aufträge gehen nicht aufs Erbe über; beim Tod verschwindet die Hälfte des Rufs.
- Verteidigungsaufträge: Timer bis zum Angriff anzeigen.
- In der Eisenfeste gibt es keine Aufträge.
- Kauf: kleines Info-Fenster, was ein Gegenstand ist und tut. Tooltips überall ausführlicher.
- Minikarte (einblendbar). Spielstand-Info: Spielzeit, Kills, Generation usw. Gegenstände aus der Schnellleiste entfernen können.
- Ansehen je Fraktion gut sichtbar; im Fraktionsfenster überdeckt die Flagge den Text.
- Schlafen im Gasthaus: Kosten mit Animation. Brunnen/Waschen: 20 s Abklingzeit.
- Enthauptung viel seltener.
- Gefährten, die man heimschickt, bleiben Gefährten (abrufbar).
- Mehr Leute anwerben: manche aus Überzeugung (ausgewählte), andere gegen Gold.
- Fertigkeiten wie in Kenshi: Waffenfertigkeiten steigen durch Benutzung (mehr Schaden, schneller), Nahkampfabwehr (Blockchance, Paradeschaden), Zähigkeit (aus nicht kritischer Lage selbst aufstehen, mit Timer). Ausdauer-Punkt: +10 Ausdauer.
- Händler stehen vor bzw. direkt am Marktplatz.
- Omega/Untotenboss: Mit gutem Ruf bei der Eisenfeste Varg um Hilfe bitten; er lehnt ab, aber eine Legion erscheint: Spieler betritt den Bossraum allein, entscheidet sich zum Kampf, dann stürmt die Legion herein (inszeniert). Eigenes End-Event, wenn Varg UND der Untotenboss tot sind.
- Dialoge schließen sich, wenn man sich entfernt.

**Quest-System:** alle Questarten, Geber, Ziele, Fortschritt, Abschluss, Abgabe, Trigger prüfen. Jede Quest: Annehmen → Fortschritt → Ziel → Abschluss → Abgabe → Belohnung. Neue Variationen mit anderem Ablauf (Ziel schon tot → Spuren; Karawane überfallen → Überlebende; Eskorte angegriffen; NPC aus Gefahr retten; mehrere Ziele; Lösung durch Kampf/Dialog/Aktion; abhängig von Fraktion, Ruf, Welt-Events; zeitkritisch; Folgequests; Konsequenzen bei Fehlschlag). Questgeber je Rolle (Schmied, Händler, Bauer, Priester, Wache, Adliger, Gelehrter, Wirt, Reisender, Bürgermeister, Kommandant). Quests reagieren auf Region, Fraktion, Ruf, Beziehungen, Welt-Events, Krieg. Ignorierte Quests können Konsequenzen haben (Karawane überfallen → Waren knapp → Folgequest). Questketten (z. B. vermisster Händler → Spuren → Lager → Befreiung → Handelskontakt).

**Welt:** mehr Animationen (Idle, Laufen, Kampf, Treffer, Tod, Arbeit, Essen, Trinken, Sitzen, Aufstehen, Reden …), mehr kurze Cutscenes an wichtigen Momenten, NPC-Tagesabläufe je Rolle, NPC-Reaktionen auf Ereignisse (Leichen, Angriffe, Tod wichtiger NPCs, Untote → mehr Patrouillen), zufällige Begegnungen mit Entscheidungen (nicht nur Kampf), Fraktionen handeln selbstständig, Gerüchte aus echten Ereignissen, kleine Ambient-Events (Streit, Training, Predigt, Betrunkener fliegt raus, Bote rennt durch die Stadt), alle Weltzustände persistent.

**Ingame-Transparenz:** Codex/Handbuch im Spiel; Fraktionsränge vollständig erklärt (aktuell, nächster, Voraussetzungen, wer vergibt, Vorteile, Pflichten), legendäre Ränge mit Hinweisen; Quests zeigen Voraussetzungen, Belohnung, Folgen, Frist, Ort, zuständigen NPC. Ausführlichere Tooltips (Waffen, Rüstung, Fähigkeiten, Zustände, Ruf, Ränge, Quests, Berufe, Gebäude, Welt-Events). Anzeige aktiver Effekte (Symbolleiste + Fenster).

**QA:** wie ein Spieler testen (Quest annehmen → reisen → erledigen → abgeben → nächste). Immer fragen: Weiß der Spieler, was zu tun ist?

**Ganz am Ende:** bestehendes Welt-Event-System untersuchen, neue Event-Ideen sammeln (Was, Wo, Wer, Reaktion, Folgen), markieren, was direkt umsetzbar ist und wofür Systeme fehlen — nicht blind implementieren.
