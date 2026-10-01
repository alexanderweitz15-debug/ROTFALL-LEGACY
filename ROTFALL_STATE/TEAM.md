# ROTFALL — Agent-Team (gültig ab 01.10.2026)

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
- Vorgaben aus `DECISIONS.md`
- Form der Rückgabe

Er gibt zurück: was getan wurde, was er gefunden hat, welche Dateien sich geändert haben, was wie geprüft wurde, was UNVERIFIED blieb, und offene Fragen.

Status: IDEA → PROPOSED → WAITING_FOR_DEVELOPER → APPROVED → IN_DEVELOPMENT → IMPLEMENTED → VERIFIED (dazu BLOCKED, DEFERRED, REJECTED).
