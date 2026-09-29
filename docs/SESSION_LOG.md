# Session-Log — Rotfall: Legacy

Neueste oben. Letzte zwei Sessions voll, ältere je eine Zeile (volle Texte: `archive/SESSION_LOG_bis_S13.md`).
**Sessionstart:** nur den obersten Eintrag lesen, dazu `BUGS.md` (HIGH) und die Tabelle in `PHASE_STATUS.md`.

## Session 15 — 2026-09-29 · Plan für Opus, Titelklassen vertieft (Fable, später Opus)
- Später in S15: P1–P3 und Morrgrund/Dodon (siehe CHANGELOG), Bogen spannt sichtbar (Figuren-Glieder wurden doppelt skaliert,
  behoben), P4 Magie-Kern und Zauberbuch (Z), Gegner-Zauberer, Debug „Magie“. Selbsttest 237/237.
- Nutzer (29.09.): Am Ende jeder Runde `docs/MECHANIKEN.md` ergänzen — dort steht jede Mechanik in ein, zwei Zeilen.
- Danach (Opus): Pferd pfeifen/Werte, Stadt-Lehrer, Nachfolger, Todesritter (Talente + Eidwacht), Auftragsziel-Nachschub,
  P4 (Wände), P5 (Zauberlehrer, Akademie-Prüfungen), P6 (Turm des Nachtglases, Ilvar), P7 (verbotene Magie, Glaube, Magiekern,
  Anomalie), P8 (Ruhm, Rangwege), P9, P11, P12, P17, P19. Selbsttest 262/262. Automatischer Push nach `claude-arbeit` (Hook).
- Offen mit Fragen an den Nutzer: P10/P21 Aurelion und Wasservolk, P14 Siedlungsbau, P15 Weltereignisse, P16 Varons Schloss,
  P18 Fall Aurelions, P20 Untoten-Überfälle, P22 Gruppe, §G Morrgrund. Ohne Fragen: P13 Gesamtdurchlauf.
- Nächster Schritt: P4-Rest (Form `wall`, Welt-Spuren), dann P5 (Lehrer, Akademie, Prüfungen, Kodex-Reiter).
- S14-Reste davor: Magitech-Unfall (Amok-Automaten, Fabrikstillstand) und Spuk am Brunnen („Ort säubern“). Damit sind alle 4
  Ereignisse der Nutzerliste fertig.
- Gesamtstand als Seite und Datei (`Rotfall_Stand_S14.html`).
- `PLAN_S15.md` mit den Paketen P0–P13 für Opus, aus zwei großen Nutzer-Prompts. Referenz 6 (Endgame-Ritter) liegt in `reference/`.
- Paket K (Nutzer: „Klassen wie Nekromant aufarbeiten“):
  - Titelgrade I–III mit Meistern (Ysra, Vhal, Mira, Ilva).
  - 8 neue Titelfähigkeiten, darunter die Wolfsgestalt mit eigenem Bild.
  - Zweiter Schlüsselknoten je Titel, der den ersten ausschließt.
  - Titel-Optik wächst mit dem Grad.
  - Todesritter endlich erreichbar (Todesweihe, Grabhieb).
  - Klassen-Guide in `GUIDE.md` §6.
- Selbsttest 225/225 (4 neue Proben; 3 alte an Grade angepasst). Spielstand unverändert (Backup `rotfall.backup.s14c`).
- Nächster Schritt: Nutzerurteil zu Titel-Optik und Wolfsgestalt (`screenshots/wolfsgestalt_S15.png`), dann `PLAN_S15.md` P0.

## Session 14 — 2026-09-28 · Mechanik-Check, schlanke Doku, Figuren neu
- Auftrag (Nutzer): A Doku verschlanken inkl. Mechanik-Check, B Figuren im Stil D selbst neu zeichnen, mit Animation.
- A0: 14 Funde (6 W, 4 L, 2 E, 2 Fehler), alle behoben, 4 Tests; `docs/design/mechanik-check.md`, 4 Designfragen offen.
- A1–A6: Master-Prompt, SESSION_LOG, BUGS, CHANGELOG, PHASE_STATUS, GDD, DATA_SCHEMAS gestrafft; Originale in `archive/`.
- Selbsttest 209/209, Spielstand unverändert (Stufe 12, 325 Gold). Sicherungen: externes Repo `../_rf_backup.git`.
- Teil B: Nutzer: Ziel = Referenz 5 selbst gezeichnet, aber **nur optional** (Stil D bleibt). Stil R in `src/fig5.js`, Inventur
  `docs/design/sprite-features.md`, Sammelbilder `docs/screenshots/r*.png`. Zeichnen Stadtkern R 1,2–1,3 ms (D 1,4–1,5).
- Später: BUG-140 (Glieder), Kerker-Minispiel + gemeinsamer Ausbruch, 8 Endgame-Sets + Elite-Ausrüstung, Kampfanimationen
  (Tod, Block, Taumeln), Startbild, Debug-Menü (alle 64 Knöpfe fehlerfrei, neue Abschnitte). Nutzer lehnte breiten Körper ab →
  Breite nur über Rüstung (`buildR` ab, Rahmen 40, `Px` dx). Selbsttest 212/212. Cache `?v=15`.
- Danach: Rang-Questlines, Missionsbeitrag, Glieder 100/−200 (Sehr schwer −100), Steinknoten im Westen, Nutztiere + eigener Hof,
  Ladeprobe `RF.loadProbe` (BUG-141 behoben), Gebäude-Infos, A-04, Master-Prompt-Abgleich (`design/masterprompt-abgleich.md`),
  Seevolk (Karten `isle`/`deck`, 6 Aufträge, Weißbart). Selbsttest 217/217. Hinweis: vor dem Neuladen `S._quiet = true` setzen, sonst
  speichert das Entladen den Teststand.
- Offen (Reihenfolge Nutzer): `PLAN_OFFEN.md` → „S14 · Warteschlange“ (Missionsbeitrag, Varg/Garmadon, Cutscenes, Eisenfeste-Aufträge,
  Glieder 100/−200), restliche Sprites laut `design/sprite-features.md`.

## Session 13 — 2026-09-27 · Möbel mit Funktion, Phase 6
- Der Nutzer wollte größere Möbel mit Funktion und danach die nächste Phase: Betten, Stände, Bänke, Fässer, Regale, Esse und Tränke sind jetzt nutzbar.
- Phase 6 fertig:
  - zehn neue Untotenarten mit Rollen;
  - Raids mit Rollenmischung je Ziel;
  - Gruft des Toten Königs (drei Ebenen, etwa 30 Untote, Fallen);
  - Garmadon mit Gespräch, Preis fürs Gehen und drei Kampfphasen;
  - Weltevent bei seinem Tod.
- Nutzerwünsche in der Sitzung:
  - Untote deutlicher unterscheiden: Silhouette, Farben, Partikel, Rollen-Symbol.
  - Hexenmeister beschwört (Schattenruf, Paktritter).
  - Garmadon größer (1,9×).
- Vier alte Bugs gefunden, deren Code im Kommentar stand (BUG-114–117), alle behoben.
- Skills: ponytail, caveman, 2d-games, game-design, systematic-debugging.
- Selbsttest 157/157. Sichtprüfung: Schenke und Markthalle mit großen Möbeln, alle neuen Untoten im Stil-Testbereich, Thronsaal der Gruft.
- Offen: BUG-108 (Städte über 3 ms), BUG-111 und BUG-112 (wackelnde Tests), BUG-113 (Blutungstode).
- Nächster Schritt: Phase 7 (Omega: Glaube in Vargs Volk, Beschwörung als Weltevent mit Preis und Risiko, Endkampf).
- Später in Session 13:
  - Sprites als sieben beschriftete Sammelbilder exportiert (für Neuentwürfe über ChatGPT).
  - Phase 7 (Omega) gebaut, nach vier Nutzerentscheidungen und dem Wunsch „mindestens 50 Stunden, über viele Storylines“.
  - Selbsttest 161/161.
  - Sichtprüfung: Altar und Priesterin vor der Kernburg, Omega im Krater.
- Nächster Schritt: Phase 8 (Weltentwicklung: Stadtwachstum, östliche Expansion nach Garmadons Tod, Wirtschaft, Fraktionskriege, neue Nationen Nordreich, Seevolk, Sandfürsten).
- Phase 8 begonnen: Stadtwachstum fertig (von selbst + Investition). Nächster Schritt: das Seevolk (Seefahrt, Inselreich, Hauptstadt, Dörfer, Fraktion, Quests, Gegner), danach sichtbare Fraktionskriege.
- Nutzerwunsch umgesetzt: Omega als Auge mit Engeln; Omega-Glaube im Westen; drei Paladin-Arten; fünf Köpfe der Kirche mit Ereignissen. Das Seevolk ist zurückgestellt (die Nutzerfragen dazu sind unbeantwortet). Nächster Schritt: Aurelion vollständig (Prothesen kaufen, Heiliges Gericht, Reise zur Himmelsfeste, Adelshäuser, der König, eine lebendigere Stadt).
- Später: Kamerafahrten (Fall Vargs, Fall der Untoten), Hoher Rat mit Sitzungen und Beschlüssen, Folgen des Falls der Untoten (Städte frei, das Land heilt, Heimkehrer, Vharnholm), Aurelion (Fabrik, Prothesen-Tausch, Heiliges Gericht, Parade, Luftschiffe), kleine Animationen, Guide.
- BUG-112 endlich erklärt und behoben; neu gefunden und behoben: BUG-118 bis BUG-120.
- Selbsttest 171/171.
- Offen: das Seevolk (Nutzerfragen unbeantwortet), sichtbare Fraktionskriege, Nordreich, Sandfürsten, BUG-108 (Städte über 3 ms), BUG-111, BUG-113.
- Nutzer: „nicht 1:1, aber diesen Stil“. Atlas-Sprites bleiben für Figuren, Gegner, Tiere; neu: Waffen-Symbole (Inventar, Boden) und Objekte in Objektgröße (Brunnen, Schrein, Falle) aus dem Blatt. Gebäude bleiben gemalt, bis große Vorlagen kommen (`docs/PROMPTS_GRAFIK.md`).
- Neue Grundlage: `docs/WELTREGELN.md` (harte Regeln; Aurelion „muss wirtschaftlich funktionieren“; Welt-Simulation; Wirtschaft; Fraktionstabelle; Ränge; XP; Kampf-KI; Gefängnis und Sklaverei; Untotenreich; Weltveränderungen; Debug; Tiere; Leistung; Persistenz; offene Aufgaben), mit ehrlichem Status je Punkt.
- Debug: Varg-Tod, Garmadon-Tod, Zeit vorspulen, Stufe = Zahl.
- Aufgefallen: Der Held ist seit älteren Ständen unbewaffnet (schon im alten Backup auf Stufe 8); Nutzer fragen.
- Held hat das Langschwert wieder (Nutzer: „Ja, Langschwert“).
- Wirtschaft „tief“ gebaut (`src/economy.js`, Priorität 1 des Nutzers): 23 Märkte, 13 Waren, Betriebe mit echten Arbeitern, Produktionsketten, Lager, Preise je Stadt, Händlerzüge mit Überfällen; für den Spieler Handelskontor, eigener Wagen, Betriebe, Lieferaufträge. Details in WELTREGELN §3.
- Gefunden: Der Selbsttest gab dem echten Helden XP und Gold, und das automatische Speichern schrieb es fest (BUG-123). Behoben, Spielstand auf die Sicherung vor den Proben zurückgesetzt (Stufe 12, 325 Gold, Langschwert). Dazu BUG-121 und BUG-122 (wackelnde Tests).
- Selbsttest 174/174, mehrmals hintereinander; Held und Spielstand danach unverändert. Sichtprüfung: Handelskontor und Betriebsliste in Aurelheim.
- Nächster Schritt: Tiere (Priorität 2), danach das Seevolk mit Piratenkönig „Weißbart“ (eigene Figur).
- Nutzer: Tier-Entscheidungen (in PLAN_OFFEN), dann erst Guide und Prompts straffen.
- Neu: `docs/GUIDE.md`, der komplette Spiel-Guide (Welt und Hintergründe, Mächte und Ränge, Kampf, Klassen, Verbrechen, Wirtschaft, große Ereignisse, Aurelion, Erbe, Tipps).
- Master-Prompt gestrafft: Die beiden langen Fassungen (zusammen 220 KB) sind jetzt eine kurze `docs/MASTER_PROMPT.md`; die Originale liegen in `docs/archive/`. Memory von 18 auf 10 KB gekürzt, veraltete Einträge entfernt.
- Nächster Schritt: Tiere.
- NPC-Leben gebaut (Nutzer: erst Grundmechaniken): Reisende, Mahlzeiten, Markteinkauf, Sicherheit, Wegzug und Zuzug. Selbsttest 175/175.
- Aufgefallen: Der ganze Selbsttest dauert jetzt ~50 s; 30 s davon der Gebäudetest (erzeugt über 1000 Hausbilder ohne Cache). Offen.
- Nutzer (neu): Statusbericht, dann jedes System gründlich prüfen; mehr Waffen, Animation, Charaktere; wichtige Figuren sichtbar anders; Reise nach Aurelion mit Zelten vor dem Tor oder Einlass; Hinweise auf aktive Effekte (Clans, Ränge). Dazu: „Die Arbeiter stehen nur herum und hämmern.“ Erst Fragen, dann abarbeiten.
- Nutzer: Stil F vorerst aus. Standard ist wieder „Klassisch“; F bleibt in den Optionen wählbar (einmalige Umstellung alter Stände über `S.flags.artOffS13`).
- Audit-Durchlauf aller Mechaniken: `docs/AUDIT_S13.md` (Befunde nach Schwere, Screenshots `audit_*.png`). Neu: Dauertest „jede Fähigkeit wirkt ohne Fehler“, `RF.shot(name)` für Bildschirmfotos, `R.resize` exportiert. Sofort behoben: `townDanger` stürzte bei Figuren ohne Heimatort ab (von heute). Selbsttest 176/176. Spielstand nach dem Durchlauf zurückgespielt.
- Audit-Fixes nach Nutzerwunsch („erst die Bugs, besonders die Bewohner, die nichts tun“): Datenverlust Lager/Grab, Schlaf, Begleiter (erst kämpfen, dann heilen, Heilen dauert), Heilerinnen, feste Arbeitsplätze (Schmiede in der Schmiede, Händler hinter dem Stand), Schenke mit Sitzplätzen, Gegner nie sichtbar erscheinend, Siedlung mit Wirkung und echten Siedlern. BUG-124 bis BUG-131. Leistung nur teilweise (Nutzer: nicht weiter suchen). Selbsttest 179/179.
- Nutzerentscheidungen (Level, Gegnervielfalt, Dungeons mit Ebenen, Dialog, Reisen) in PLAN_OFFEN.
- Arbeitskreislauf mit Werkzeugen und eigener Bewegung je Beruf, Bauern über das Feld verteilt, Aurelheims Hauptplatz belebt (Nutzer). Sichtprüfung: `nah_holzfaeller.png`, `nah_bauer.png`, `aurelheim_mittag_neu.png`.
- S13b (Nutzer: „arbeite den Masterplan ab, frag nicht“), erster Block:
  - Die gemeldeten Bugs sind behoben (Handel am Stand, Paket, Eskorte).
  - Aufträge überarbeitet, mit Varianten, Wendungen und Rache-Kette.
  - Begegnungen mit Entscheidung, NPC-Reaktionen, Eiserne Legion, Ende der Brüder, Kenshi-Fertigkeiten, Söldner, Minikarte und kleinere Wünsche. Details im CHANGELOG.
  - Gefunden: Der Selbsttest war zwischendurch nicht still und startete eine echte Kamerafahrt (BUG-132).
  - Selbsttest 184/184; Held und Spielstand unverändert.
  - Nächster Schritt: Fraktionen handeln selbst, Ereignisse in der Umgebung, Kodex/Handbuch, Level, Gegnervielfalt, Dungeons mit Ebenen, Reise nach Aurelion, Kutschen und Fähren, Waffen, Aussehen wichtiger Figuren. Zum Schluss: Weltereignisse sichten und eine Ideenliste.
- S13b, zweiter Block (autonom):
  - Neu: Stadtszenen, Reaktionen auf Leichen und Todesfälle, die Mächte handeln selbst, Kodex (H), Kutschen und Fähren, Torprüfung für Aurelion.
  - Neu: Gegnervarianten mit Verhalten (Flankieren, Anführer, Kapitulation), Gewölbe mit Ebenen, elf neue Waffen, mehr Dialog (Gefährten, Gegner), eigenes Aussehen für benannte Figuren.
  - Schlussteil des Auftrags: `docs/WELT_EVENTS_S13.md` (Bestand, Ideen, Quest-Lücken).
  - Bugs BUG-136 und BUG-137 (dieser war nur kurz im Code und nie beim Nutzer).
  - Selbsttest 195/195; Held, Gold und Chronik des echten Stands unverändert.
  - Offen: Level-Überarbeitung (Aufstieg, Gebiete), Fraktions-Rüstungssets, Tiere, Seevolk, die Ideenliste in WELT_EVENTS_S13 §2, die Quest-Lücken §3.
  - Schwierigkeitsgrade kommen nach den übrigen Phasen.
- S13b, dritter Block („mach weiter“):
  - Quest-Lücken geschlossen: Spurensuche, Lager ausheben, Überlebende der Karawane, Schmuggel in besetzte Städte, mehr Geber.
  - Level: flachere Kurve, Meilensteine, Gegnerstufen je Gebiet.
  - Fraktionssets (5), Hochzeiten, Prügeleien, Spielleute, Infofeld „Bietet“.
  - Tiere: Zähmen, Tierbegleiter, Tierhändler, Reittiere (Pferd, Messingross, Totenross), Kühe und Schafe.
  - BUG-138 (Auftragsziele fern vom Helden).
  - Selbsttest 205/205, dreimal hintereinander; Spielstand unverändert.
  - Offen: eigener Hof, Nutztiere in den Wirtschaftszahlen, Seevolk (Weißbart), Ideen 3/9/10/13 aus WELT_EVENTS_S13 (brauchen neue Systeme), danach die Schwierigkeitsgrade.

## Ältere Sessions (je eine Zeile)
- S12 (09-26): Arsenal, Welt Valoris, Eisenfeste A1–A4, Aurelion, Master-Prompt 2 Phasen 1–4; 148/148.
- S11 (09-26): Bug-Runde BUG-076–101, Tagesrhythmus Stufe 2, Beziehungen, Raids, Befreiung, Balancing, Eisenmark; 117/117.
- S10 (09-25): Stil D und Referenz 2, Gebäude dunkler, Tagesplan Stufe 1; 82/82.
- S9 (09-25): Durchlauf-Audit, Grafik-Revision v2 (feines Raster, `figure.js`).
- S8 (09-25): Phase 11 Gegner (18 Typen, Datenblatt).
- S7 (09-25): Phasen 6–10 (Deckung, 19 Waffen, Rarität, Talente, Klassen).
- S6 (09-25): Spielstand-Diff, Karawane als Zug, Tiefhall, Mönch, Grenzöde.
- S5 (09-25): Welt ×1,5, Skill-Baum, Druide, Totenreich.
- S4 (09-25): Siedlungsdichte, Titelklassen Nekromant/Hexenmeister.
- S3 (09-25): Stil Fels/Wasser/Boden, Tagesablauf benannter Figuren, Touch.
- S2 (09-25): Dächer, Stadtpläne, Bewohner, Wachen.
- S1 (09-24): Phasen 0–3 (Audit, KI-Grundregeln, Übergänge, Wegfindung).
