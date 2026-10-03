# Fraktions-Starts — Analyse und FEATURE IMPACT REPORT (03.10.2026)

Grundlage: Entwicklerentscheidung „Fragemenü 03.10. (abends)“ in `ROTFALL_STATE/DECISIONS.md`. Gelesen: `GATE.md`, `IST_ZUSTAND.md` (Teil A §3, Teil C §1, §9, §16, Teil D §9 Siedlung), Code in `game.js` (newGame, buildCreation, autoRanks, promote, checkRankUp, joinFaction, teamOf, stigmaOf, bloodSeen, campGuardDay, hireMerc, raidSources, dayTick-Nahrung, adoptSuccessor), `state.js` (Slots, ACHIEVE), `sprites.js` (humanSpec, Arten `sp`), `data.js` (ORIGINS, FACTIONS, STIGMA).

## Feature

Wer den höchsten Rang einer Fraktion erreicht, schaltet sie dauerhaft (über alle Spielstände) als Start frei. Ein Fraktions-Start bringt Start im Fraktionsgebiet, Mitgliedschaft, eigene Ausrüstung und eigenes Aussehen, ein eigenes Haus bzw. Gebiet und Boni je Rasse (auch Skelett). Bei gutem Ruf: Fraktionsmitglieder als Gefährten und als Siedlungswachen anwerben.

## Betroffene Systeme und was es schon gibt

| System | Bereits vorhanden | Fehlt / Anpassung |
|---|---|---|
| Globaler Speicher | `rotfall.slots` (Slot-Index), Erfolge `ACHIEVE` (je Stand berechnet, nicht global) | eigener Schlüssel `rotfall.starts` (nicht im Spielstand, nicht in `SKIP`) |
| Höchster Rang | `S.ranks`, `FACTIONS[f].ranks`, `promote`, `autoRanks` (Aurelion, Grubenstämme, Seevolk), Direktsetzungen (Weihe der Kette, Held der Untoten, Avatar) | Prüfung in `checkRankUp` (stündlich) und `promote`; rückwirkend für alte Stände |
| Charaktererstellung | Startort (Varonheim / Grenzland), Herkunft, Körperbau, Aussehen | Reihe „Fraktions-Start“ (gesperrt mit Hinweis), Vorschau mit Rasse |
| Neues Spiel | `newGame`, `capStart` (Hauptstadt-Start mit Aufträgen) | Startpaket: Ort, Rasse, Rang/Ruf, Folgen des Beitritts, Ausrüstung, Haus |
| Rasse → Werte | `ORIGINS.attrs/skills`, `recalc` | `RACES` (Attribute, Fertigkeiten), einmalig beim Start addiert wie die Herkunft |
| Rasse → Aussehen | `sp: 'skeleton' / 'goblin'` (Gegner), `e.undead` (Totengesicht), Zwerge `build: 'gedrungen'` + Bart, Goblin-NPC verkleinert (`drawGoblinNpc`) | Feld `race` an der Figur, Rassen-Schicht in `humanSpec` (Frame-Cache: nur `SPEC_KEYS`-Felder) |
| Ränge ohne Beitritt | Aurelion über Bürgerrecht, Grubenstämme erst nach der Befreiung | Aurelion-Start = Bürgerrecht; Grubenstamm-Start = Rang ohne Befreiung (`S.startFac`) |
| Goblins friedlich | `RANK_PERKS.goblin[0]`: „Goblins sind friedlich“ — umgesetzt nur über `goblinsFreed` | `teamOf`: Goblins neutral auch bei Grubenstamm-Rang ≥ 0 |
| Untote verbündet | `teamOf`: Tote sind Verbündete bei Totenrang ≥ 0 | nichts |
| Überfälle auf das Haus | `raidSources` | Tote überfallen kein Haus eines Totenmitglieds; Häuser außerhalb der Oberwelt nur Wölfe (Koordinaten passen nicht zu `LOCATIONS`) |
| Haus / Gebiet | Siedlung (`S.settlement`, `foundCamp`, `placeBuilding`) — Erbe übernimmt sie | Startsiedlung mit Lagerfeuer und Hütte (fertig) |
| Rekrutieren | Söldner (`hireMerc`, Handgeld 50 + 12 × Stufe, Lohn 3 + Stufe), Lagerwachen beim Wirt (80 Gold, 5 Gold/Tag, `campGuardDay`) | Fraktionskämpfer mit denselben Bedingungen; Lagerwache aus der Fraktion |
| Reaktion auf Skelett | `STIGMA` (bisher nur Vampir; Kommentar „zweite Art daneben“), `stigmaOf`, `bloodSeen`, Kapuze verbirgt (`hooded`) | zweite Art `skeleton`, Erkennen ohne Kapuze in 120 px |
| Heilig gegen Untote | `t.undead` → heiliger Schaden ×2 | Skelett-Held bekommt `undead` |
| Nahrung | Gruppe isst täglich (`Held + Gefährten`); Vharnholm hungert nie | Untote (Skelett, untote Gefährten) essen nicht |
| Erbe | `adoptSuccessor` (Gold 70 %, Ruf 50 %, Siedlung) | Erbe behält seine eigene Rasse |
| Koop | Gast erstellt eigenen Charakter (`creation.hook`) | Gäste: kein Fraktions-Start (Mensch) |

## Offene Designentscheidungen (Option, Empfehlung — gebaut ist jeweils die Empfehlung, **vorläufig**)

1. **Rang ab Start:** (a) unterster Rang + Ruf 20, (b) Rang 1. → **(a)**. Aurelion: Bürgerrecht (Rang 2) statt eines Scheins; Grubenstämme: Rang über Ruf ohne Befreiung; Seevolk: Landratte über Ruf (Clanwahl bleibt offen).
2. **Folgen des Beitritts ab Start:** wie `joinFaction` (Tote: Orden −30, Valen −20; Orden: Tote −20; Kette: Grubenstämme −20, Orden −10, Valen −5). → so gebaut.
3. **Startorte:** Valen Varonheim (mit den Anfängeraufträgen der Hauptstadt), Orden Sonnwacht, Untote Vharnholm, Kette Eisenfeste, Aurelion Aurelheim, Seevolk Tangkron (Gischtinseln), Händler Kreuzweg, Grubenstämme Morrgrund, Wüstenbund Karak-Atar, Zwerge **an der Tiefhall (Oberfläche)** — die Königsstadt liegt unter Hrodvars Halle, ein Start dort würde einen Stufe-1-Helden zwischen die Toten stellen. Alternative: Start in der Königsstadt.
4. **Rasse je Start fest** (keine freie Rassenwahl): Valen, Orden, Kette, Händler = Mensch; Aurelion = Aurelianer; Seevolk = Inselvolk; Wüstenbund = Wüstenvolk; Zwerge = Zwerg; Grubenstämme = Goblin; Untote = Skelett. Freie Starts bleiben Mensch.
5. **Rassen-Boni (vorläufig, kleiner als eine Herkunft: Herkunft +3 Attributpunkte, Rasse netto +2, eine Fertigkeit ≤ 5):**

   | Rasse | Attribute | Fertigkeit | Sonderregel |
   |---|---|---|---|
   | Mensch | – | – | Vergleichsmaß ohne Boni, damit die freien Starts (Herkunft) unverändert bleiben |
   | Aurelianer | Intelligenz +1, Wahrnehmung +1 | Handel +3 | – |
   | Inselvolk | Beweglichkeit +1, Ausdauer +1 | Überleben +3 | – |
   | Wüstenvolk | Ausdauer +2 | Überleben +3 | – |
   | Zwerg | Ausdauer +2, Stärke +1, Beweglichkeit −1 | Schmieden +5 | Körperbau fest „Gedrungen“ |
   | Goblin | Beweglichkeit +2, Wahrnehmung +1, Stärke −1 | Handwerk +3 | kleiner gezeichnet (wie Goblins der Welt) |
   | Skelett | Ausdauer +1, Willenskraft +1 | Zähigkeit +5 | isst nicht; heiliger Schaden ×2; Stigma ohne Kapuze |

6. **Startausrüstung** ersetzt die der Herkunft (Werte, Fertigkeiten und Gold der Herkunft bleiben). Nur gewöhnliche Ware im Band der Herkünfte (Schaden ≤ 11); Ausnahme Ordenskutte (Wert 90). Kleiner Goldzuschlag je Fraktion (0–30).
7. **Haus:** eine eigene Siedlung neben dem Fraktionsort mit fertigem Lagerfeuer und fertiger Hütte (4 Plätze → Siedler ziehen zu). Alternative: nur Zelt. Seevolk: auf den Gischtinseln; Zwerge: an der Tiefhall.
8. **Rekrutieren:** ab Ruf 40 (Stufe „Verbündet“) bietet jede Wache der Fraktion (und Fraktionsmitglieder mit Kampfberuf) an: Gefährte zu Söldnerbedingungen (Handgeld 50 + 12 × Stufe, Lohn 3 + Stufe am Tag) und — mit eigener Siedlung — Lagerwache zu Wirtsbedingungen (80 Gold, dann 5 Gold am Tag, gleiche Obergrenze). Alternative: Rabatt je Rang.
9. **Skelett in Menschenstädten (Stigma „Knochen“):** sichtbar ohne Kapuze in 120 px oder 10 Tage, nachdem eine Macht es gesehen hat. Werte wie beim Vampir: Orden und Kette verweigern Handel/Bett/Heiler; Valen meldet an die Wache (Kopfgeld 60, einmal am Tag) — die Wachen nehmen dann nach dem bestehenden Gesetz fest; Orden schickt Jäger; Zwerge verweigern (die Toten nahmen ihre Halle); Aurelion, Händler, Goblins, Seevolk, Wüstenbund, Freie +20 %; Bande gleich; Tote −10 %. **Mit Kapuze (Startausrüstung hat zwei) kann ein Skelett jede Stadt betreten.** Alternative: Wachen greifen sofort an — nicht gewählt, das macht den Start unspielbar.
10. **Heilung beim Skelett:** Verband, Kräuter, Heiler wirken wie bei Lebenden (nur Orden/Kette verweigern über das Stigma). Alternative: nur Totenmagie heilt. Offen.
11. **Andere Rassen in Städten (Goblin, Zwerg …):** keine Sonderreaktion (kein bestehendes System). Offen, ob Goblins in Valens Städten Misstrauen ernten.
12. **Erbe:** Der Erbe behält seine eigene Rasse (Kind/Gefährte/Ehepartner, wie gezeichnet); kein Fraktions-Start-Paket. Kinder eines Skeletts: offen.
13. **Koop:** Gäste haben keinen Fraktions-Start (Mensch). Offen.
14. **Freischalt-Bedingung:** höchster Rang, auch über Abkürzungen (Garmadon-Knien, Held der Untoten, Avatar Omegas, Weihe der Kette). Bande und Kelch zählen nicht (kein eigenes Gebiet), Freie vom Grubenhort haben keine Ränge.

## Risiken

- Proben setzen Ränge auf den Höchstwert → die Freischaltung schreibt nie, solange `S._quiet` gilt (Selbsttest, Dev-Tests).
- Koop-Gast hat keinen eigenen Fortschritt → schreibt nie.
- `humanSpec`-Merkliste (`HS_ENT`) braucht `race`, sonst bleibt das alte Bild.
- Goblin-Start ohne Befreiung: Rangvorteil „Goblins friedlich“ muss in `teamOf` stehen, sonst greifen Goblins den eigenen Stamm an.
- Haus des Untoten-Mitglieds: ohne Anpassung überfallen die eigenen Toten das Haus.

## Implementierungsplan (Scheiben)

- **(a)** `state.js`: `startUnlocks()`, `unlockStart()` (Schlüssel `rotfall.starts`). `game.js`: `startUnlockCheck()` in `checkRankUp`/`promote`, Erstellungsbildschirm mit gesperrten Knöpfen und Hinweis.
- **(b)** `data.js`: `RACES`, `FAC_STARTS`. `game.js`: `newGame` mit `cfg.facStart`, `applyRace`, `facStartSetup` (Rang, Ruf, Folgen, Haus, Hinweise), `raceOf`. `sprites.js`: Rassen-Schicht. `render.js`: Goblin-Held verkleinert.
- **(c)** `facRecruitChoices` (Gefährte, Lagerwache) mit `facMember` und `enlist`; `campGuardDay` nimmt Fraktionswachen aus `st.guardFacs`.
- **(d)** `STIGMA.skeleton`, `stigmaOf` für beide Arten, `boneTick` (Erkennen), Nahrung, heilig ×2 über `undead`, `raidSources`.
- Debug „Starts: …“, Hinweise im Spiel, Proben, MECHANIKEN.md, IST_ZUSTAND.md.

## Stand nach dem Bau (03.10.2026 abends)

- Alle vier Scheiben gebaut; Selbsttest 479/479 grün (fünf neue Proben „Fraktions-Starts (a)–(d)“).
- Beim Test gefunden und behoben: Start an der Tiefhall neben Goblin-Kriegern Stufe 8; Haus der Kette in der Eisenfeste. Regel jetzt: Start und Haus nur ohne Feind in 22 Kacheln, Haus außerhalb des Fraktionsorts (vorläufig, Zahl 22 gewählt).
- Mensch ohne Rassenboni (statt Willenskraft +1 / Führung +3), damit die freien Starts unverändert bleiben.
- **STATUS: TEILWEISE DEFINIERT** — gebaut mit den Empfehlungen oben; die Punkte 1, 3 (Zwerge), 5, 7, 8, 9, 10, 11, 12, 13 warten auf die Entscheidung des Entwicklers.
