# STATE — ROTFALL (02.10.2026, 16:40)

> **Stand veraltet (02.10.2026).** Aktueller Stand: `main` = Version 25, Selbsttest 488/488 (`docs/CHANGELOG.md`). Arbeitsregeln: `CLAUDE.md`. Offenes: `OFFEN.md`, `docs/BUGS.md`.

Zuerst lesen. Kurz halten (unter 100 Zeilen). **Alles Offene steht in `OFFEN.md`.** Regeln: `GATE.md` (vor jedem Feature), `VISUAL.md`, `COMBAT_ANIM.md`, Entscheidungen in `DECISIONS.md`.

## Stand
- Version 24 (`?v=24`, coop `VER = 24`). Git: `GIT_DIR=../_rf_backup.git GIT_WORK_TREE=.`.
- main (öffentliche Seite) = `d7199bb`, live geprüft. Selbsttest dort 395/395.
- Letzter Backup-Commit `20f6ad5` (Kampfanimation Scheibe 2, laut Agent 395/395).
- Regel für main: ganzer Arbeitsbaum committet, keine halben Agenten-Stände, committeten Stand separat laden + Selbsttest, nach Push live prüfen.

## Heute gebaut (02.10.)
- Dialoge (Story-Fenster, Tippeffekt, Antwortzeichen, Emotes, Gesprächshaltung, Blase bei Wut/Angst).
- Kampf-Feedback (schwere Angriffe nicht blockbar außer Gegenstrom, Pixel-Schadenszahlen, Ziel-Lebensbalken, Status am Körper).
- Items/Inventar/Läden (Item-Karten, Bodenbeute, Papierpuppe, Handels-Dock, Rückfrage ab Selten).
- PERF-U3 (Spitzen: Spec-Cache, Vorbacken, cycProps).
- Kampfanimation Scheibe 1+2 (Schaden im Einschlag, Combo, takt-neutrales Abbrechen, Test Room `__arena`, 5 Waffen × Pack A/B/C).
- Debug-GUI; Stil bleibt immer R.

## Laufende Agenten (16:40)
- Kampfanimation: schwerer Hieb per Halten, Seitschritt aufs Ausholen, §17-Rest.
- Gegner: Varianten, Bomben-/Groß-Skelett, Mutanten, dann Top 5 aus `visual/gegner_ideen.md`.
- UI-Menüs: Meldungsfluss, Quests Q-1..Q-4, Pergament, Docks.
- Skilltree + Karte (Sonnet).

## Nächstes für den Lead
- Ergebnisse prüfen, Selbsttest, committen.
- Wenn alle fertig sind: ganzer Stand auf main (Regel oben).
- Danach NPC-Visuals (P3) und die Punkte aus OFFEN.md mit [B].
