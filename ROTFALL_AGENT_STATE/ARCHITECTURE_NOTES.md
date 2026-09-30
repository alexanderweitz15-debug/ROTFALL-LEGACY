# Architektur (Zeiger)

`CLAUDE.md` beschreibt Module, Tests, Cache-Schlüssel und Bearbeitungsregeln. Ergänzungen:
- Zeilenenden gemischt: game.js CRLF, andere Dateien meist LF, sim.js gemischt. Byte-genau bearbeiten.
- Spielstand-Format RFZ1 (gzip, 15 Bit je Zeichen) seit 01.10.; alte JSON-Stände laden weiter.
