# PLAN WELTTIEFE — Reaktiv, abwechslungsreich, tief (Auftrag 05.10.2026)

Arbeitsplan zum Auftrag „World Depth, Quest Variety & Gameplay Expansion“. Vorgehen nach `CLAUDE.md`: erst Audit und Bewertung, dann Prioritäten, dann vertikale Slices; nichts wird neu geschrieben, alles baut auf vorhandenen Systemen auf. Arbeitsstand: `ROTFALL_STATE/WORK/claude-focused-faraday-40psnm.md`. Entscheidungen des Nutzers: `ROTFALL_STATE/DECISIONS.md`.

**Nicht verfügbar in dieser Umgebung:** die im Auftrag genannten Skills (`/ponytail`, `/spritecook`, `/frontend-design`, `/2d-games`, `/pixel-art-creator`) existieren hier nicht; `DECISIONS.md`/alter Master-Prompt untersagen SpriteCook und Pixel-Plugin ohnehin. Gearbeitet wird mit den Regeln aus `CLAUDE.md`.

## Phase 1+2 — Audit und Bewertung (Stand v25, Selbsttest 488/488)

Bewertung: **voll** = funktioniert und wirkt · **flach** = funktioniert, aber oberflächlich · **isoliert** = vorhanden, kaum mit anderen Systemen verbunden · **kaum relevant** = technisch da, im Spiel kaum spürbar · **fehlt**.

| Bereich (Auftrag §) | Befund im Code | Bewertung |
|---|---|---|
| Quest-Vielfalt (§1, §2, §20) | 80 feste Aufträge: 39× `kill`, 26× `item`, 16× `custom` (Einzelcode), 8× `trial`, 4× `dodge`, je 1× `tavern`, `steal`, `night`, `hold`, `craft`, `find`, `songkill`. `questEvent()` ist ein generischer Zähler für beliebige Zieltypen. Dynamische Aufträge (`S.contracts`: bounty, monster, hunt, deliver, defense, escort?) über Bretter. Kein Zieltyp für Befragen, Spuren, Eskorte mit Varianten, Sabotage, Schleichen, Überleben, Verteidigung mit Teilzielen. | **flach / repetitiv** |
| Konsequenzen von Aufträgen (§3) | `reward` kennt gold, xp, rep, rel, item, take, unlock; Folgen darüber hinaus nur in Einzelcode (`g_dod3`, Seevolk, Klassen). Große Ereignisse haben ein eigenes Folgen-System (`S.after`, §5c). Wohlstand je Ort (`growthOf(t).prosper`) existiert, wird von Aufträgen nicht angesprochen. | **flach** |
| Orte und Regionen (§4) | Regionen, Fraktionen, Orte vollständig (Menschenland, Eisenfeste, Aurelion, Totenland, Wüstenbund, Gischtinseln, Tiefhall). Aufträge je Region vor allem Rangreihen (48) und Kopfgelder; Themen (Bürokratie, Schmuggel, Rituale, Wasser, Bergbau) nur punktuell. | **flach** |
| NPC-Reaktion (§5) | Beziehungen (`S.relations`), Angst (`fearOf`), Gerüchte mit Zielen, Tagesabläufe, Talk-Pairs, Rivalen/Freunde — vorhanden. NPCs erinnern sich nicht an Auftragsausgänge; keine Weitergabe („andere erzählen davon“); Nachfolger nur am Hof Varonheims (`courtDeath`). | **isoliert** |
| Gefährten (§6) | Moral (`m.morale`), Loyalität, Freund fürs Leben, Feuergespräche, Dynastie (Heirat, Kinder). Kein Kommentar zu Entscheidungen, keine Meinung zu Fraktionen oder Orten, kein Eingreifen, keine eigenen Ziele. | **kaum relevant** |
| Legacy (§7) | Erbe mit Regeln (Kopfgeld ×0,5, Ränge −1, Zauber Rang I …), Ahnenfeind (bis zu 3), Epilog, Ahnengrab, Schwur des Vorfahren, Dynastie, Chronik. NPCs kennen die Familie nur über den Namen; Beziehungen werden nicht vererbt (außer Freund fürs Leben bei Verwandten); offene Fälle enden mit dem Tod. | **voll als Mechanik, flach als Erlebnis** |
| Schleichen (§8) | `toggleSneak` (V), halbe Sicht der Ahnungslosen, Hinterhalt ×1,5/×3, Fertigkeit wächst, Stehlen mit Zeugen. Kein Licht/Schatten, kein Geräusch, keine Alarmstufen, kein Suchverhalten, keine Verkleidung, kein Schlossknacken außer Kerker. Doku behauptet teils noch „fehlt“ (berichtigen). | **flach** |
| Jagd (§9) | `huntLoot()`/`huntGain()`: mehr Felle und Fleisch, Fertigkeit wächst beim Erlegen. Keine Spuren, keine seltenen oder legendären Tiere, keine Fallen, keine Trophäen, kein Jagd-Händler. Tooltip sagt noch „ohne Wirkung“ (berichtigen). | **kaum relevant** |
| Kampf und Animation (§10) | Kampfanimation mit Waffenklassen (Schwert, Dolch, Speer, Hammer, Zweihänder, Axt, Kolben, Stange, Rapier, Peitsche, Stab), Gewicht, Packs A/B/C, Wuchtschlag, Deckung/Parade. Bogen, Armbrust, Sense, Doppelklinge, Magie, Bosswaffen ohne eigenes Profil (`ROTFALL_STATE/OFFEN.md`). | **voll / Rest offen** |
| Bosse und Elites (§11) | Boss-Karten mit Auftritt (`bossIntro`), Phasen bei einigen (24 Phasenstellen), 32 Elites mit Rolle und Aussehen, Regionalbosse mit Beute (`BOSS_LOOT`, Reliquien). Eigene Arenen und Arena-Veränderungen nur teilweise (Omega, Garmadon); Weltfolgen nur für Regionalbosse. | **flach bis voll, je Boss** |
| Endgame/Trinkets (§12) | Reliquien: drei Fassungen, Stufen I–VIII, Pfade, Synergien, Verwandlung, Glut/Sternsplitter als Währung, Bossreliquien. Entspricht dem geforderten Trinket-Loop im Kern; „Level 1–20“ und Bossmaterialien als Upgrade-Quelle fehlen. | **voll, ausbaufähig** |
| Krieg → Stadt (§13) | Besatzung: Läden zu, Kassen weg, Bewohner verstecken sich, Flüchtlinge, Garnison, Schutzstufen (schutzlos, gesetzlos, Bandenherrschaft), Rückeroberung, Wiederaufbau auf Angsthase. Karawanenrouten und Reisen reagieren nicht; keine neuen Fraktionen; Händlersortiment bleibt. | **voll im Kern, flach an den Rändern** |
| Wirtschaft (§14) | Märkte je Stadt, Produktion, Karawanen, Preise, Betriebe mit Kasse, Lieferaufträge zum Marktpreis. Krieg wirkt über Besatzung, nicht über unsichere Wege; keine Schmuggelaufträge; „Banditen beseitigt → Händler kehren zurück“ fehlt. | **voll / isoliert vom Krieg** |
| Städte als Lebensraum (§15) | Tagesabläufe mit 3–6 Blöcken, Feste, Schenkenspiele, Gerüchte, Angst, Wohlstand/Wachstum, Schutzstufen. Lokale Konflikte und Ereignisse nur über große Ereignisse; Varonheim/Aurelheim haben eigenen Hof- bzw. Rats-Content. | **voll, Konflikte flach** |
| Geheimorte (§16) | 5 gebaut (Glockenmoor, Hundertfeld, Ausbrecherstollen, Kammer der Namen, Brunnen der Durstigen); Zähler ehrlich (`SECRET_N`). Weitere geplant (`ROTFALL_STATE/IDEAS.md`). | **voll, unvollständig** |
| UI (§17) | Fenster für Schmiede, Kutsche, Tierhändler, Prothesen, Handwerk, Betriebe, Handel, Heiler, Zauber lernen, Reliquien, Auftragsbuch mit Tracker. Dialoglisten noch: Fraktionsübersicht (Teil), Alchemie, Schwarzmarkt, Stadtinformationen, Kriegskarte (Atlas zeigt Fronten). | **gemischt** |
| Bekannte Fehler (§18) | `docs/BUGS.md` HIGH: BUG-108 Leistung in Städten; `ROTFALL_STATE/OFFEN.md` mit [E]/[B]/[P]-Punkten; Audit-Phasen 1–4 (v25) haben Softlocks und Exploits geschlossen. | nach Fünf-Fragen-Regel prüfen |

## Phase 3 — Prioritäten (Reihenfolge der Pakete)

Regel: zuerst das, was die meisten anderen Pakete tragen (Quest-Bausteine), dann Verknüpfung, dann Inhalt; Kampf/Animation und UI nachrangig, weil dort bereits das meiste steht.

| Paket | Inhalt | Trägt |
|---|---|---|
| **W1 Ermittlung** (begonnen) | Zieltypen `talk`, `clue`; Urteil mit Folgen (`decide`); erster Fall in Eren | Investigation, Social, Konsequenzen (§1, §3) |
| **W2 Folgen-Bausteine** | `reward`/`decide`-Effekte auf Wohlstand, Preise (`S.towns[k].stock`/Markt), Gerücht (`rumor*`), Erinnerung (`S.relations` + NPC-Satz „Du warst das …“), Nachfolger für erschlagene Geber | §3, §5, §14 |
| **W3 Eskorte, Rettung, Lieferung mit Varianten** | Generischer Begleit-Zieltyp (NPC folgt, Verwundeter langsam, Gefangener lebend), Lieferung bei Nacht/Zeitdruck/ohne Kontrolle als Varianten des Lieferauftrags | §1 |
| **W4 Kill-Varianten und Regionen** | Vorlagen „Alpha, nicht das Rudel“, „Quelle der Auferstehung“, „nur Infizierte“; Themen-Pools je Region für Bretter (`S.contracts`-Arten) | §2, §4, §20 |
| **W5 Jagd** | Spuren (clue-Props mit Wetter/Tageszeit), seltene/legendäre Tiere, Fallen, Trophäen, Jagd-Händler; Fertigkeit wirkt auf Spurenlesen | §9 |
| **W6 Schleichen** | Licht/Schatten und Geräusch als Sichtfaktor, Alarmstufe und Suche der Wachen, Verkleidung; Stealth-Zieltypen (ungesehen hinein, Dokument beschaffen) | §8 |
| **W7 Gefährten-Meinung** | Kommentar zu Urteilen/Fraktionswechseln (bubble), Moral-Effekt, Warnung, Abgang; eigene Beziehungen zu NPCs | §6 |
| **W8 Legacy-Erinnerung** | NPCs kennen das Haus (Satz je Beziehung des Vorfahren), vererbte Beziehungen gedämpft, offene Fälle als Erbe-Auftrag, Familien-Ruf | §7 |
| **W9 Krieg ↔ Wege ↔ Händler** | Unsichere Routen (Karawanen meiden, Preise), Schmuggelaufträge, Rückkehr der Händler nach Befreiung | §13, §14 |
| **W10 Bosse, Reliquien-Upgrades, Geheimorte** | Arena-Veränderungen, Bossmaterial → Reliquienstufe, restliche Geheimorte | §11, §12, §16 |
| **W11 Kampfprofile Rest, UI-Fenster** | Bogen/Armbrust/Sense/Doppelklinge/Magie/Bosswaffen; Fraktionsübersicht, Schwarzmarkt, Stadtinfo | §10, §17 |

## Slice-Regel je Paket

Erst ein vollständiges Beispiel (ein Auftrag, ein NPC, eine Folge, eine Probe, Hinweis im Spiel, Debug, MECHANIKEN-Zeile), dann der zweite Fall, dann verallgemeinern. Jeder Auftrag besteht die Zehn-Fragen-Probe (§21 des Auftrags): spielerisch anders, Entscheidung, berührte Systeme, Veränderung danach, mehrere Wege, Varianten je Fraktion/Klasse/Fertigkeit, NPC-Reaktion, Weltreaktion, interessante Belohnung, Unterschied zu „Töte 5 Skelette“.

## Offene Designentscheidungen (mit Empfehlung)

1. **Falsche Urteile:** Soll ein falsch Beschuldigter dauerhaft Folgen haben (Abgang aus dem Dorf, Feindschaft) oder nur Beziehung/Wohlstand? *Empfehlung:* Slice 1 nur Beziehung/Wohlstand/Chronik; ab W2 „Erinnerung“ (NPC-Satz) und ein Gerücht; kein Abgang ohne Nutzerentscheid.
2. **Spurenlesen und Fertigkeit:** Soll Jagd/Wahrnehmung Spuren gaten (sonst nur „Abdrücke, nicht zu deuten“) und Aufträge damit mehrere Wege bekommen (Befragen statt Spur)? *Empfehlung:* ja ab W5, mit Ersatzweg; Slice 1 ohne Gate.
3. **Gefährten-Abgang:** Darf ein Gefährte bei Fraktionswechsel gehen (Kette vs. goblinfreundlich)? *Empfehlung:* ja, mit Warnung zwei Tage vorher; Loyalität entscheidet.
4. **Vererbte Beziehungen:** Anteil (Empfehlung 50 %), nur benannte NPCs, Feinde voll.
5. **Händler-Rückkehr nach Banditen:** Welche Stelle misst „Weg sicher“ (Lager auf der Straße leer, X Tage)? *Empfehlung:* `SPAWN_AREAS` an Straßen mit Zähler, 3 Tage.
6. **Premium/Endgame-Währungen:** Bossmaterial als neue Währung oder Glut/Stern erweitern? *Empfehlung:* Glut/Stern erweitern, keine dritte Währung.

## Erledigt

- **W1 Slice 1 (05.10.):** Zieltypen `talk` und `clue`, `ensureClues()`, `clueRead()`, `inquiryChoices()`, `questDecide()`; Auftrag „Blut auf dem Markt“ (Havel, Eren) mit zwei Spuren, zwei Befragungen, drei Urteilen; Probe, Debug-Eintrag, `MECHANIKEN.md`, `DATA_SCHEMAS.md`. Status: Probe grün (Selbsttest), Live-Test im Browser ausstehend.
