# Systemabhängigkeiten (Kurzfassung)

Vollständig: `docs/audit/MASTER_REPORT.md` §5 und §19.
- Spiellogik würfelt mit `rnd()` (state.js, gesät); Darstellung mit `vrnd` (Math.random). Neue RNG-Aufrufe verschieben zufallsabhängige Proben.
- Krieg (sim.js) ↔ Wirtschaft (economy.js, Korn) ↔ Städte (S.towns) ↔ Flüchtlinge.
- Speichern: state.js `saveData` → `flushSave` (RFZ1) / `saveSync`; Laden: `unpackAll` vor `boot()`, dann `loadRaw`.
- Flüchtige Bevölkerungen: `ensure*()` in newGame und continueGame.
