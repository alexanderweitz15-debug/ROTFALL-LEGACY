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
