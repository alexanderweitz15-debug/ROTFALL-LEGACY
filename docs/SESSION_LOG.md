# Session-Log — Rotfall: Legacy

Neueste oben.

### Session 1 — 2026-09-24 · Master-Prompt: Phasen 0–4
**Gemacht:**
- docs/ angelegt (BUGS, GDD, CHANGELOG, SESSION_LOG, PHASE_STATUS, STYLE_GUIDE, DATA_SCHEMAS).
- Phase 0: neues Spiel durchgespielt (Erstellung, Welt, Tod durch zornige Zeugin, Erbe, Speichern/Laden, alle 13
  Waffen, Mobil 375 px, Performance); Entwicklerzugang `?dev`/`window.RF`. 19 Befunde im Ledger vor dem ersten Fix.
- Phase 1: Leichen-Bug (BUG-001) an der Wurzel (`think()`), Feind-Aufrichten, Gnadenstoß, Zorn mit Leine + Buße,
  Verfolgung über Kartengrenzen (folgen/lauern/Arena), Erbe mit Habe.
- Phase 2: Reaktionsmatrix im GDD ausgefüllt und umgesetzt: Wachen-Alarm, Hilfe für Bewusstlose, Hilfe holen,
  Händler schließen, Rudel/Banden, Bluttat-Folgen, Dialogsperren, Rollen, 17 Wachposten in 6 Siedlungen.
- Phase 3: A*-Wegsuche bei Blockade, Spawns nie in Bäumen (16/20 Verfolger im Wald steckten fest!), Überfälle außerhalb
  des Bildes, Ruhezeiten je Region.
- Phase 4: Gebäude als Datensätze mit Pixel-Dach, Fassade, Funktion, Innenraum; Props mit Kontext und Varianten.
- Performance: Update/Zeichnen in Eren wieder im Budget.
- Selbsttest 22 → 37 (alle bestanden, wiederholt stabil; Gegenproben mit wieder eingebauten Bugs schlagen fehl).

**Gefundene neue Probleme:** BUG-020–027 (u. a. Laden-Sperre nie ausgewertet, Salzhafen-Tür im Wasser,
Selbsttest veränderte Spielstand, Gefahr verschobener Zufallsfolge für alte Stände) — alle behoben.

**Offen geblieben:** BUG-008 (Städte ohne Bewohner), BUG-009 (Tiefhall), BUG-011 (Karawane), BUG-012 (Touch),
BUG-013 (Tagesablauf), BUG-016 (Titelburg), BUG-017 (Speichergröße), Wald-Zeichnen 2,8 ms.

**Nächster Schritt:** Rückmeldung zum Gebäude-Look einholen → Phase 5 (Testbereich §25) oder BUG-008 vorziehen.
Beim Start: `index.html?dev&test` öffnen, `RF.selftest()` muss 37/37 (im Spiel) melden.
