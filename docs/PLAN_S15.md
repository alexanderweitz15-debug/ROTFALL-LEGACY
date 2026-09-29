# Plan Session 15+ — Figuren, Beute, Kampfgefühl, Magie, Magierturm, Aurelion

Geplant von Fable (29.09.2026), umgesetzt von Opus. Quelle: zwei große Nutzer-Prompts vom 29.09.
(„Sprite-, Rüstungs-, Waffen-, Drop- und Kampfsystem“ und „Magie, Aurelion, Weltentwicklung und Deep Systems“) und das
Referenzbild `reference/ref6-endgame-ritter.png`. Dieser Plan ersetzt die Prompts nicht. Er übersetzt sie in Arbeitspakete
auf dem echten Code. Wo der Prompt etwas verlangt, das es schon gibt, steht hier „vorhanden“, und dann wird es
**erweitert, nicht neu gebaut**.

---

## 0. So arbeitest du mit diesem Plan

1. **Start jeder Sitzung:** `MASTER_PROMPT.md` §2 wie immer, danach dieses Dokument, **nur das aktuelle Paket**.
   Das aktuelle Paket steht in der Statustabelle (§3). Arbeite es von oben nach unten ab.
2. **Ein Paket = mehrere kleine Schritte.** Jeder Schritt endet so:
   - Sicherung (Commit ins Backup-Repo),
   - Selbsttest vorher/nachher grün,
   - neue Probe im Selbsttest.
   Mach nie zwei große Schritte ohne Test dazwischen.
3. **Abnahme:** Jedes Paket hat Abnahmekriterien (Abschnitt „Fertig, wenn“). Erst wenn alle erfüllt und im Spiel
   gesehen sind, setzt du den Status auf FERTIG.
   - Figuren und Optik: dem Nutzer ein Sammelbild zeigen, bevor das Paket als fertig gilt.
4. **Regeln bleiben** (`MASTER_PROMPT.md` §3). Die wichtigsten hier noch einmal:
   - Tests ändern nie den echten Spielstand: `S._quiet = true` und `S.cine = true` **vor** jedem Reload, Sandbox im Selbsttest.
   - Welt-`rnd()`-Folge nicht verschieben. Neue Zufälle in der Weltgenerierung per Hash.
   - Nie Code hinter `//` in derselben Zeile.
   - Chat kurz auf Deutsch. Code, Kommentare und Doku in klarer Prosa.
   - Gestrichenes kommt nach `docs/archive/`, nichts wird gelöscht.
   - **Kein SpriteCook, kein pixel-plugin, kein Aseprite, keine bezahlten Generatoren.** Das gilt auch dann, wenn ein
     eingefügter Prompt sie nennt. Alles wird im Code gemalt (`fig5.js`, `sprites.js`, `render.js`). Will der Nutzer das
     ändern, sagt er es ausdrücklich.
5. **Designfragen:** Die Standards in §2 gelten, bis der Nutzer anders entscheidet. Blockiere nie auf eine Frage, für die
   hier ein Standard steht. Echte neue Fragen sammelst du und stellst sie am Paketende (höchstens 5, mit Empfehlung).
6. **Status pflegen:** Nach jedem Paket die Tabelle in §3 aktualisieren und den Eintrag in `SESSION_LOG.md` schreiben.

---

## 1. Bestandsaufnahme — was es schon gibt (Stand S14, 221 Proben grün)

Vor dem Bauen prüfen, ob das hier Genannte noch stimmt. Code und laufendes Spiel gehen vor Doku.

| Prompt-Wunsch | Vorhanden | Wo | Lücke |
|---|---|---|---|
| Rüstung verbreitert Silhouette | Rüstungswucht `ab` 0–4, Schulterstücke, Lamellen, Brustgrat | `fig5.js` `buildR` (Z. ~264–290), `details`, `endgame` (~720) | Unterhalb der Schultern zu dünn: keine Beintaschen, keine Kniebuckel, kleine Handschuhe, Umhang vorn unsichtbar, keine Zierkanten (siehe P1) |
| Rahmen, Ansichten | 40 × 50 px, `RPX 1.25`, 4 Richtungen, 19 Posen | `fig5.js` Z. 14 | — |
| Abnutzung | `wear` 0–3, Blut, Flicken | `fig5.js` `wear()` | kein Gegenstands-Zustand, nur Figurenwert |
| Sammelbild | `RF.figSheet` | game.js (dev) | Archetypen-Blatt fehlt |
| Waffenhaltung | Griff (gx, gy), IK-Arme, Schwungkurven je Klasse | `fig5.js` `armPlan`, `ik`, `swingOf`; `figure.js` | Bogen beim Schuss prüfen |
| Telegraph | `telegraph` (ms) in MONSTERS, Ansage im Renderer | data.js, game.js (39 Stellen), render.js | kein eigener schwerer Angriff mit Pose, Markierung, Erholungsfenster |
| Hit-Stop, Rückstoß, Parade | vorhanden | game.js `hitStop` Z. ~1851, Parade im Takt | Stärke nach Waffengewicht staffeln |
| Beute | `LOOT` je Gegner mit Einzelchancen, `mkItem` mit Rarität | `dropLoot` game.js ~3058 | keine Stufung normal/Elite/Boss, Waffen fallen zu oft, kein Boss-Pool |
| Sets | 13 Sets mit je 2 Teilen | `ARMOR_SETS` data.js ~258 | nur 2-Teil-Boni |
| Ausrüstungsplätze | weapon, offhand, head, chest, cloak, feet | data.js `slot:` | keine Hände, Beine, kein Talisman |
| Verbrauchsgüter | 12 (Brot, Trank, Verband, Seelenphiole, Prothesen …) | data.js | keine Buff-Tränke |
| Fähigkeiten, Mana | 38 Fähigkeiten, Mana mit Regeneration, Feuerball, Schattenblitz, Heilen, Blinzeln | `ABILITIES` data.js ~428, `useAbility` game.js ~8699 (großes `switch`), Mana-Regeneration ~2407 | keine Magieschulen, kein Lernweg, keine Zustände Brand/Frost/Schock |
| Titelmagie | Nekromant, Hexenmeister, Druide, Mönch mit eigener Ressource | `TITLE_CLASSES`, `ABILITIES.title` | bleiben; werden an die Schulen angebunden, nicht dupliziert |
| Zustände | `addStatus` (game.js ~9149), Tick bei ~2413: blutend, vergiftet, unterkühlt, gesegnet, Raserei, versklavt | game.js | Brand, Frost-Stapel, Schock, Fluch fehlen |
| Geschosse gegen Wände | Kachel- und Prop-Kollision, `clearLine(a, b)` | game.js ~3127, ~4923 | Zauber nutzen denselben Weg: kein Nacharbeiten nötig |
| Region-Stufen | `zoneTier` + `ZONE`-Spannen | game.js ~1553 | vorhanden, nur prüfen |
| XP nach Beitrag | `credit`, `xpShares` | game.js ~3070 | vorhanden |
| Aurelheim | 11 Viertel inkl. Akademie, Magitech, Industrie, Militär, Hallen (Palast, Bank, Bibliothek, Gericht, Hospital, Bad, Observatorium), Himmelsinsel | world.js ~1372–1450, ~1934 | Akademie ohne Funktion, zu wenig sichtbare Magitech |
| Totenland | Vharnholm, Nekropole, Schwarze Feste, Knochenwald, Seelenhügel | world.js LOCATIONS | kein Magierturm |
| Kodex | Tabs Guide, Ränge, Zustände (Taste H) | ui.js `codexUI` ~179 | kein Magie-Tab, Rang-Info ohne „was bringt der nächste Rang“ |
| Legenden-Titel | `grantLegend`, `S.legend` je Fraktion | game.js ~7820 | vorhanden (Kettenbrecher, Königsmörder …) |
| Ruhm | **fehlt ganz** | — | P8 |
| NPC-Erinnerung | `MEMORY_TEXT`, Beziehungen | data.js ~805 | vorhanden, nur für neue Taten ergänzen |
| Fern-Simulation | Märkte, Heere, Front, Karawanen abstrakt; NPC-Denken mit LOD (jedes 3./8. Bild) | sim.js, game.js `think` ~2175 | vorhanden |
| Debug | Bewegung, Spieler, Gegenstände, Welt (ganze Welt zeigen), Aufträge, Ereignisse, Grafik | game.js ~9257 | Magie-Bereich fehlt, Teleport zu Turm/Omega/Garmadon |
| Startruf | Rook −100, Untote −100, Goblins −100, Kette −20, Aurelion −10 | game.js ~1598 | Kodex soll den Grund nennen |

**Nachtrag Fable (Paket K):**
- Es gibt schon einen **Nekromanten-Turm** mit Vhal, dem Flüsternden (`necrotower`, game.js ~449). P6 baut den Magierturm
  darauf auf, statt einen zweiten Turm zu setzen. Vhal ist dort der Meister der Hexenmeister, Ilvar Nachtglas wohnt in den
  oberen Ebenen.
- Der **Magier-Lehrer ist Morvath**, ein Untoter auf dem Alten Friedhof. Früh ist Magie darum schwer zu lernen. Der
  Wandermagier in P5 schließt diese Lücke.
- Der **Todesritter war unerreichbar**. Seit Paket K weiht Sael oder Ysra ab Untoten-Rang 3.

**Folgerung:** Der größte echte Neubau ist die **Magie als System** (P4–P7) und der **Magierturm** (P6). Alles andere
ist Ausbau.

---

## 2. Entscheidungen (Standards, bis der Nutzer anders sagt)

| Frage | Standard | Warum |
|---|---|---|
| Rahmengröße der Figuren | 40 × 50 bleibt. Nur wenn Umhang oder Schultern bei Wucht 4 abgeschnitten werden: Heldenrahmen 48 × 56 **nur** für `ab >= 3` und Bosse | Kein Umbau aller Posen; Kamera und Kollision bleiben |
| Neue Ausrüstungsplätze | `hands` (Handschuhe) und `legs` (Beinschutz) und `talisman` (1 Platz). Schultern gehören zur Brust, Gürtel zur Hose | Jeder Platz braucht Malcode; 3 neue reichen für das Loot-Gefühl |
| Set-Boni | Stufen bei 2, 3 und 4 Teilen (statt 3/5/7) | Es gibt nur 5 Rüstungsplätze |
| Rüstungszustand | `cond` 0–4 (Neu, Abgenutzt, Beschädigt, Stark beschädigt, Verrostet). −5 % Rüstung je Stufe, malt `wear`. Schmied repariert gegen Gold | Sichtbar und spürbar, keine Haltbarkeitsbuchhaltung |
| Tränke stapeln | Ein Elixier gleichzeitig; ein neues ersetzt das alte. Gemeinsame Abklingzeit 30 s | Gegen Exploits |
| Magie-Architektur | Neue Tabelle `SPELLS` in data.js mit Form und Element, **ein** allgemeiner Wirker `castSpell(caster, key, aim)`. Alte `ABILITIES` bleiben unberührt, bis ein Zauber bewusst umgezogen wird | Kein Rewrite des großen `switch`; NPCs nutzen denselben Wirker |
| Lernweg | Lehrer → Lektion (Gold + Mindest-Intelligenz) → Zauber Stufe I → Übung (Einsätze) → Stufe II/III; manche Zauber erst nach Prüfung | Wie im Prompt §7 |
| Verbotene Magie | Nekromantie, Blutmagie, Fluch. Im Menschenland mit Zeugen ein Verbrechen (vorhandenes Kopfgeld-System) | Nutzt Bestehendes |
| Name des Erzmagiers | **Ilvar Nachtglas**, ein Lich. Früher Hofmagier Vharnholms vor Garmadons Fall, dient Garmadon nicht. Der Nutzer darf umbenennen | Eigene Schöpfung, Regel §3 |
| Ort des Magierturms | Tiefes Totenland östlich der Schwarzen Feste, eigene Karte `tower` | Gegenstück zu Aurelion |
| Ruhm | je Region (Mitte, Westen, Süden, Osten, See) 0–100; Stufen Unbekannt, Bekannt, Regional bekannt, Berühmt, Legendär | Prompt §38 |
| Reihenfolge | wie in §3 | Nutzer war mit den Figuren zuletzt unzufrieden, darum zuerst |

---

## 3. Statustabelle

| # | Paket | Status |
|---|---|---|
| K | Titelklassen vertiefen: Grade I–III mit Meistern, 8 neue Fähigkeiten, zweiter Schlüsselknoten, Todesritter erreichbar, Klassen-Guide (Nutzer 29.09.) | FERTIG (Fable) — Nutzerurteil offen |
| K2 | Sprite-Politur und Klassen-Silhouetten (Kragen, Hörner, Geweih, Mönch, Kessel, Dornenkrone, Seelenflammen); Rahmen 40 × 56 | FERTIG (Fable) |
| S | Spielstand geräteübergreifend: Stufe 1 fertig (verschlüsselte Datei, Export/Import in Einstellungen, `cloudsave.js`). Nutzer wählte Cloud-Ordner statt Server | FERTIG Stufe 1 |
| K3 | Klassen-Rüstung über Questlines (12 Aufträge, 12 Teile), Verstärkung ab 2/3 Teilen, 4 neue Fähigkeiten, Warnung und endgültiger Verlust beim Klassenwechsel, Guide | FERTIG (Fable) |
| W | Wissen im Gespräch: 13 Themen (`LORE`), Antwort je Fraktion/Beruf/Seevolk, Wissen aus Grundwissen, Chronik und Erzähltem (Kette von Hinweisen bis zu den Titelklassen). Ausbauen: mehr Themen je neuem Inhalt | FERTIG (Fable) |
| P14 | Eigener Siedlungsbau als Städtebau-Simulation (Nutzer 29.09., nur notiert, Details unten §P14) | OFFEN |
| G | Morrgrund und Dodon (Nutzer 29.09.): letztes Goblin-Dorf weit im Süden der Westlande, Entdeckung mit „Dodon!“, drei Wege (Freund, vorbei, Feind), Questline g_dod1–3, Pakt des Sturms, Sturm auf Varg, Untergang bei Tod, Wachstum nach Fall der Eisenfeste | FERTIG (Fable), Fragen offen (unten §G) |
| P15 | Mehr Weltereignisse (Nutzer 29.09., „später, mit Fragen“) — Ideen sammeln, dann Nutzer fragen | OFFEN (später) |
| P16 | Schloss im Norden: dunkles Dark-Fantasy-Schloss von **König Varon** (Königreich Valen) (Nutzer 29.09., „erst später“) | OFFEN (später) |
| P17 | Reittiere als Gefährten (Nutzer 29.09., notiert): Gruppenfenster (G) zeigt das Pferd mit Werten (Tempo, Ausdauer usw.); jedes Pferd hat eigene Werte; man kann es verstoßen. Schon gebaut: Pfeifen mit R (kommt von außerhalb des Bildes angelaufen, nicht im Kampf), Aufsitzen mit E, Hinweis beim Kauf, Pferd von vorn/hinten | TEILWEISE |
| P18 | **Der Fall Aurelions** (Nutzer 29.09., „Fragen nachher“): Wer den ganzen Hohen Rat tötet, löst ein neues Weltereignis aus. Offen: Was folgt (Bürgerkrieg, Machtvakuum, Automaten ohne Herren, Flucht der Adelshäuser)? Wer übernimmt? Was wird aus Kaiserin, Legion, Schuldknechten, Himmelsfeste? | OFFEN (Fragen an den Nutzer) |
| P19 | **Todesritter nachziehen** (Nutzer 29.09.: „du hast die Klasse Todesritter vergessen“): wie die Titelklassen eine eigene Questreihe mit Klassen-Rüstung (Aussehen, Stärkung ab 2 Teilen, neue Fähigkeit), Grade und Guide-Eintrag. Nutzer fragen, ob so gemeint | OFFEN (Frage an den Nutzer) |
| P20 | **Mehr Inhalt bei den Untoten** (Nutzer 29.09.): Wer den Toten beitritt, kann selbst Überfälle auf Dörfer und Städte starten; gelingen sie, übernehmen die Untoten den Ort (Besatzung, Bewohner fliehen oder werden Diener). Fragen an den Nutzer vor dem Bau | OFFEN |
| P21 | **Später (Nutzer 29.09., „erinnere dich später“):** das Wasservolk (Nutzer fragen: das Seevolk der Gischtinseln ausbauen oder ein neues Volk im Wasser?) und Aurelion ausführlicher (zusammen mit P10) | OFFEN (später, Fragen) |
| P22 | **Gruppe prüfen** (Nutzer 29.09., „später“): Rekrutieren neuer Mitglieder, Befehle, Moral, Ausrüstung der Gefährten, Tier als viertes Mitglied; Schwächen sammeln, Nutzer fragen, dann verbessern | OFFEN (später) |
| P0 | Ausgangsmessung (29.09., Stil R, Browser-Pane): Eren Zeichnen 2,5–3,5 ms warm (12,5 ms kalt), Logik 5,8 ms; Aurelheim 8,5 ms kalt / Logik 5,8 ms; Spielstand 2,19 MB. Über Budget (2 / 3 ms) → BUG-108 | FERTIG |
| P1 | Figuren: Endgame-Silhouette nach Referenz 6 — Hüftplatten (Wucht 2+), Goldkanten, größere Handschuhe, Gürteltaschen (3+), Kniebuckel bei Platte, Kettenhemd-Muster; Blatt `p1_schwere_ruestung.png` | FERTIG bis auf Nutzerurteil |
| P2 | Beute: Stufen (normal ×0,35 / Elite ×1,5), Boss-Pools (90/60/25 %), Plätze Hände/Beine/Talisman, 12 Talismane, 10 Elixiere, Sets mit 3/4 Teilen (4 Sets), Händler; Zustand `cond` war schon da (Reparatur beim Schmied) | FERTIG (Fable) |
| P3 | Kampfgefühl: schwere Angriffe mit Ansage (7 Gegnerarten, slam/sweep/thrust, Markierung, 600 ms offen), Raubtiere gegen Banditen, Bogen gestreckt mit Pfeil auf Brusthöhe. Gewicht je Waffe gab es schon (`feelOf`) | FERTIG (Fable) |
| P4 | Magie-Kern: 20 Zauber (`ABILITIES sp_*`), Wirker mit 9 Formen, Sammelzeit mit Rune und Abbruch, Brand/Frost/Schock, Übungsränge, Zauberbuch (Z), Leiste, Gegner-Zauberer (Kultist, Nekromant), Debug „Magie“. Form `wall` (Feuerwand, Eiswand) und Welt-Spuren (Brandfläche, Eisboden) fertig. Bewusst weggelassen: Mana für Gegner (Abklingzeit reicht), Feuer zündet Häuser; offen: Ordenspriester heilt Verbündete (kommt mit P7) | FERTIG (Opus) |
| P5 | Magie lernen: Lehrer, Akademie Aurelion, Prüfungen, Kodex-Tab. Teil 1 fertig: Zauberlehrer (Serafine, Elena, Morvath, Mutter Aldis, Magister Corvinus) mit Bedingungen, Kodex „Magie“. Teil 2 fertig: vier Prüfungen vor der Akademie (`startTrial`, `S.acad`, `S.acadRank`), Übungspuppen. Offen: Akademie-Innenraum mit Studenten-Tagesablauf, Druidin, Moorhexe, Omega-Priester, Kodex „Fraktionen“ | TEILWEISE (Opus) |
| P6 | Magierturm im Totenland mit Ilvar Nachtglas. Teil 1 fertig: Wahrzeichen (953/630), Karte `tower` mit 10 Ebenen + Krypta + verbotener Bibliothek (towerSeal), Pförtner, Geister, 3 Schüler, Ilvar mit Vertrauen (Themen, Omega-Frage, Seelenphiolen), Schule Schatten (Schattenpfeil, Seelenzug). Offen: Vertrauen 50/75/100 (Skelett erheben, Siegel öffnen, Seelenmagie, Endprüfung, legendärer Zauber „Nachtglas“, Titel), Schüler-Nebenquest, Seelenkammer-Entscheidung, Ilvars Tod bricht den Turm, Wachen am Weg | TEILWEISE (Opus) |
| P7 | Magie und Welt: Verbote, Magierjäger, Fraktionsmagie (Omega), NPC-Zauberer | OFFEN |
| P8 | Ruhm und Rang-Informationen | OFFEN |
| P9 | S14-Reste: Kuh-Form, flüchtige Sklaven, Erbfolgestreit, Meteorsplitter | OFFEN |
| P10 | Aurelion sichtbar überlegen, Aurelion-Ränge, Aurelion-Ereignisse | OFFEN |
| P11 | Osten nach Garmadon: Siedlungen in Stufen | OFFEN |
| P12 | Schwierigkeitsgrade (alter Plan B) | OFFEN |
| P13 | Gesamtdurchlauf und visuelle Prüfung | OFFEN |

---

## K — Titelklassen vertiefen (erledigt von Fable, 29.09.)

Nutzerwunsch: „Arbeite vor allem die Klassen wie Nekromant auf.“ Die Umsetzung:

- **Titelgrade I–III:**
  - Daten in `TITLE_CLASSES`: `grades`, `mentor`, `deed`, `gradeNames`.
  - `titleAbilities` gibt nur die Fähigkeiten bis zum eigenen Grad.
  - Taten zählt `titleDeed`. Grad II braucht 30 Taten und Stufe 8, Grad III 90 Taten und Stufe 16.
  - Der Meister weiht im Gespräch (`gradeTalk`).
  - Alte Stände bekommen beim Laden den Grad, der alle vorher gehabten Fähigkeiten enthält.
- **8 neue Fähigkeiten** in `titleAbility`:

  | Titel | Neu |
  |---|---|
  | Nekromant | Leichenbersten, Seelenfessel |
  | Hexenmeister | Seuchenfluch, Obeliskentor (`VOIDS`, `voidTick`) |
  | Druide | Dornenhaut, Wolfsgestalt (`wpnOf`, `drawWolfForm` in render.js) |
  | Mönch | Gegenstrom, Stille Hand |

  Todesritter: Grabhieb.
- **Talente:**
  - Je Titel ein neuer Knoten.
  - Je Titel ein zweiter Schlüsselknoten, der den ersten ausschließt (Feld `excl`, Zustand `barred`):
    Einsamer Rufer, Leeres Herz, Tier im Herzen, Sturmhand.
- **Optik:** `titleLook` in sprites.js. Die Zeichen wachsen mit dem Grad und füllen nur leere Felder.
- **Todesritter:** `deathRite`, bei Sael oder Ysra, ab Untoten-Rang 3 und mit gelernter Klasse Krieger.
- **Guide:** `GUIDE.md` §6, „So schaltest du sie frei“, mit allen Klassen, Lehrern, Wegen und Graden. Er ist auch im Spiel im Kodex (H).
- **Offen für Opus:**
  - Das Nutzerurteil zur Optik.
  - Grad-III-Posen im Archetypen-Blatt aus P1 zeigen.
  - Die Wolfsgestalt im Stil R prüfen (sie nutzt den Wolf aus `BEASTR`).

## P0 — Ausgangsmessung (kurz, vor allem anderen)

- Selbsttest laufen lassen und die Zahl notieren. Am Stand S14 sollten es 221 grüne Proben sein.
- Bildzeit messen: Eren, Aurelheim-Platz, volles Stadtfest. Die offenen Fehler dazu sind BUG-108 und BUG-093.
  Die Werte kommen in `SESSION_LOG.md`, damit spätere Pakete (mehr Figuren, Partikel, Zauber) dagegen gemessen werden.
- Spielstandgröße notieren (Stand S14: 2,1 MB).

**Fertig, wenn:** die drei Messwerte im Log stehen.

---

## P1 — Figuren: Endgame-Silhouette nach Referenz 6

**Ziel:** Schwere Rüstung sieht aus wie im Referenzbild: massiv, geschichtet, edel, bedrohlich. Die Breite kommt aus der
Rüstung, nicht aus dem Körper. Zivilisten bleiben schlank. Das hat der Nutzer ausdrücklich so verlangt; ein breiter Körper
wurde abgelehnt („sehen arsch aus“).

### Was das Referenzbild ausmacht (Analyse, genau so umsetzen)
1. **Schulterstücke in 3 Lagen:** Jede Lage hat eine dunkle Kontur, eine Mitte, ein Glanzlicht an der Oberkante und eine
   **Goldkante** an der Unterkante. Darüber sitzt ein Kragen aus Fell oder Tuch (warmes Braun oder Rot).
2. **Hoher Halsschutz** mit rotem Tuch darum. Er schließt den Helm an den Rumpf an, sodass kein dünner Hals zu sehen ist.
3. **Brustpanzer:** Mittelgrat mit Glanzlicht links oben und einem Schmuckstein oder Wappen in der Mitte (Gold).
   Darunter ein breiter Gürtel mit Schnalle und 1–2 Taschen.
4. **Wappenbahn** hängt vorn zwischen den Beinen: dunkelrot mit Goldsaum.
5. **Beintaschen (Tassets):** 2–3 Platten auf jeder Hüfte. Sie machen auch die Hüfte breiter; heute fehlen sie ganz.
6. **Arme:** Oberarmröhre, runde Ellbogenscheibe, Armschiene. Die **Handschuhe sind etwa 1,5-mal so groß wie eine Hand**.
7. **Beine:** Oberschenkelplatte, **Kniebuckel mit Glanzpunkt**, Beinröhre, breite Plattenschuhe. Die Beine sind sichtbar
   dicker als bei Zivilisten.
8. **Umhang:** lang, der untere Rand zerfetzt (Zacken). In der Vorderansicht ist er **links und rechts neben dem Körper
   sichtbar**, weil er hinter den Schultern hervorfällt. In der Rückansicht beherrscht er das Bild, mit 2–3 Faltenlinien.
   Er ist rot mit dunklen Falten.
9. **Helm:** geschlossener Topfhelm mit Sehschlitz (waagrecht oder T-Form), kleinem Kamm und optional Augenglimmen.
10. **Licht:** Randlicht von links oben. Außen sitzt eine fast schwarze Kontur, innen sind die Linien heller (selektive Kontur).
11. **Proportionen:** Kopf etwa 1/7 der Höhe. Schulterbreite etwa das 2,2- bis 2,5-Fache der Kopfbreite, Taille etwa 1,4-fach.
    Der Stand ist breit. **Den Kopf nicht vergrößern.**

**Farbrampen** (als Tabelle in `fig5.js`, nicht verstreut):

| Rampe | Farben |
|---|---|
| Metall dunkel | `#141112` `#2a2626` `#454040` `#6e6660` `#a89e92` |
| Gold | `#4a3210` `#7c5c1c` `#b88a34` `#e2c070` |
| Tuch rot | `#2e0b0a` `#541812` `#822a1e` `#a8442e` |

Jede Fraktion bekommt eigene Rampen (siehe unten).

### Umsetzung
- **Nur `fig5.js`** (Stil R) und die Spec-Felder in `sprites.js`.
  - Aufbau: `buildR` → `paintSN` / `paintW` → `details` / `variants` / `endgame` / `wear`.
  - Neue Teile werden an `ab` (Rüstungswucht) gekoppelt:
    - `ab >= 2`: Beintaschen, Kniebuckel.
    - `ab >= 3`: große Handschuhe, Goldkanten, Umhang vorn sichtbar.
    - `ab = 4`: Kragen, zerfetzter Saum, Schmuckstein.
  - Zivilisten (`ab = 0`) bleiben unverändert: Regressionsprobe.
- **Umhang vorn:** in `paintSN` vor dem Rumpf hinter den Armen 2–3 Pixel Umhang links und rechts vom Rumpf malen. Er schwingt
  mit der vorhandenen Umhang-Verzögerung.
- **Beine:** `legW` wächst bei Platte schon jetzt. Dazu kommen die Kniebuckel als eigenes Teil, damit die Beine nicht nur
  breiter, sondern gegliedert wirken.
- **Fraktionssprache** über Rampen und Formen, nicht über neue Maler:
  - **Aurelion:** helles Stahlblau mit Gold, Kristallpunkt (leuchtend) auf der Brust, feine Linien, glatte Kanten.
  - **Untote:** Knochenfarbe und dunkles Eisen, zerfetzter Stoff, grünes Seelenglimmen, asymmetrische Schulter.
  - **Kette / Omega:** fast schwarz mit Rot, Ketten über der Brust, Omega-Stern in Gold, Dornen.
  - **Rook:** Braun, Leder mit genieteten Platten, Narbenkerben, Hörnerhelm möglich.
  - **Goblins:** Schrott in drei Metallfarben, immer asymmetrisch, zu große Einzelteile.
  - **Seevolk:** Salzleder, Messing, Dreispitz.
- **Archetypen-Blatt:** neue Dev-Funktion `RF.armorSheet()`. Sie malt 10 Zeilen:
  1. Leicht
  2. Mittel
  3. Schwer
  4. Elite
  5. Aurelion-Magitech
  6. Untote
  7. Goblin
  8. Eisenfeste
  9. Beschädigt
  10. Boss

  Jede Zeile zeigt 8 Spalten: vorn, hinten, Seite, Hieb, schwerer Angriff (Ausholen), Treffer, Ausweichen, Tod.
  Hintergrund wie in Referenz 6 (`#1c2226`). Das Blatt als PNG nach `docs/screenshots/armor_sheet_S15.png`
  (POST an 127.0.0.1:8771) speichern.

### Fertig, wenn
- [ ] Das Archetypen-Blatt liegt neben Referenz 6 und hält dem Vergleich stand. Eine Schwer-Figur zeigt alle
      11 Merkmale oben.
- [ ] **Der Nutzer hat das Blatt gesehen und zugestimmt.** Vorher wird nichts auf alle Figuren ausgerollt.
- [ ] Probe: Die Pixelbreite der Rumpfzeile bei `ab = 0` bleibt gleich, die Schulterzeile wächst bei `ab = 4` um 40–60 %,
      die Kopfbreite bleibt gleich.
- [ ] Probe: Kein Teil der Figur liegt außerhalb des Rahmens (bei allen 19 Posen und 4 Richtungen, `ab = 4` mit Umhang).
- [ ] Bildzeit mit 60 schweren Figuren im Bild höchstens 10 % über P0 (Sprite-Cache greift).

---

## P2 — Beute: Stufen, Boss-Pools, neue Plätze, Talismane, Tränke, Sets, Zustand

### Umsetzung
1. **Beute-Stufen in `dropLoot`:** Eine Rangzahl bestimmt die Stufe: `boss` 2, `elite` oder Veteran 1, sonst 0.
   - **Stufe 0:** Waffen- und Rüstungseinträge der Tabelle ×0,35. Material, Essen und Tränke bleiben.
   - **Stufe 1:** Ausrüstung ×1,5, eine Raritätsstufe besser.
   - **Stufe 2:** neue Tabelle `BOSS_LOOT[mtype] = { weapons: [...], armor: [...], unique: [...] }`.
     - 90 %: eine Waffe **aus dem Pool** gezogen, nicht immer dieselbe.
     - 60 %: ein Rüstungsteil.
     - 25 %: ein Einzigartiges.
     - Immer 1–3 Boss-Materialien.
   - Für die 6 Bosse und die Regionalbosse Pools anlegen, die zur Figur passen, z. B. Weißbart: Sturmanker,
     Entermesser, Dreispitz, Seemantel.
2. **Neue Plätze `hands`, `legs`, `talisman`:**
   - In der Ausrüstungsansicht (ui.js) und in `recalc`.
   - Malen in `fig5.js`: Handschuhe und Beinschutz ändern die gemalten Teile, der Talisman ist ein kleines Amulett auf
     der Brust.
   - Alte Spielstände laden ohne diese Plätze: Migration über „fehlt = leer“.
3. **Items:** je Fraktion Handschuhe und Beinschutz in drei Stufen (einfach, Veteran, Elite). Endgame-Sets bekommen
   Handschuhe und Beinschutz. Die Set-Boni werden gestuft:
   - 2 Teile: kleiner Wert.
   - 3 Teile: mittlerer Wert.
   - 4 Teile: ein Spezialeffekt, z. B. Blutkette: Treffer heilen 3 %.
4. **Talismane (12):** Ausdauer, Beweglichkeit, Krieger, Wächter, Jäger, Toten, Feuer, Magie, dazu 4 seltene mit
   Nebenwirkung, z. B. „Splitter des Rotfalls: +15 % Zauberschaden, Omega-Gläubige erkennen dich“. Die Werte laufen über
   den vorhandenen Affix-Weg (`AFFIXES`), nicht über neuen Code.
5. **Tränke (10):** Stärke, Ausdauer, Beweglichkeit, Steinhaut, Eile, Wut (Angriffstempo), Arkan, Scharfes Auge,
   Frostschutz/Feuerschutz, Lerntrank (+10 % XP, 10 min).
   - Die Wirkung ist ein Zustand über `addStatus` mit dem Schlüssel `elixir`. Weil es nur einen solchen Schlüssel gibt,
     ersetzt ein neuer Trank automatisch den alten.
   - Gemeinsame Abklingzeit 30 s.
   - Brauen: Die Alchemist-Fähigkeit `brew` lernt Rezepte.
6. **Zustand `cond`:**
   - Gegnerausrüstung bekommt einen Zustand nach Stufe: normal meist 1–3, Elite 0–1, Boss 0.
   - Im Tooltip steht der Zustand. Jede Stufe kostet −5 % Rüstung, und die Figur zeigt ihn über `wear`.
   - Der Schmied repariert gegen Gold (Menüpunkt beim Schmied).

### Fertig, wenn
- [ ] Probe: 1000 simulierte Tode je Stufe (Sandbox, ohne Weltobjekte).
  - Normale Gegner lassen in 8–15 % der Fälle Ausrüstung fallen.
  - Elite lässt in 30–45 % Ausrüstung fallen.
  - Ein Boss lässt in 85–95 % eine Waffe fallen, dabei mindestens 3 verschiedene Waffen aus dem Pool.
- [ ] Probe: Zwei Elixiere nacheinander ergeben genau einen `elixir`-Zustand.
- [ ] Probe: Ein alter Spielstand ohne neue Plätze lädt (`RF.loadProbe`), die Ausrüstung bleibt erhalten.
- [ ] Im Spiel: Handschuhe und Beinschutz sind an der Figur zu sehen, das 3-Teile-Set zeigt seinen Bonus im Charakterfenster.

---

## P3 — Kampfgefühl: schwere Angriffe mit Ansage, Gewicht je Waffe, Bogen

### Umsetzung
1. **Schwere Angriffe:** neues Feld in MONSTERS:
   ```js
   heavy: { kind: 'slam', every: 3, wind: 800, mul: 2.2, r: 70 }
   ```
   - Arten:
     - `slam`: Überkopf mit Schockwelle.
     - `sweep`: Rundumschlag, Ring um den Gegner.
     - `charge`: Anlauf in gerader Linie.
     - `thrust`: langer Stoß, Linie.
     - `magic`: Energie sammeln, Zauber aus `SPELLS`, sobald es P4 gibt.
     - `shot`: lange gespannter Schuss.
   - Phasen:
     1. **Ausholen:** mindestens 600 ms, bei Bossen 800 ms. Eigene Pose, roter Glanzpunkt an der Waffe, **Bodenmarkierung**
        mit dem Trefferbereich (Kreis, Ring, Linie), leiser Ansage-Klang.
     2. **Schlag:** Schaden ×`mul`, Rückstoß, Hit-Stop 80 ms, Kamerawackeln.
     3. **Erholung:** 600 ms. Der Gegner ist offen und nimmt +25 % Schaden.
   - Ausweichen mit Unverwundbarkeit hebt den Treffer auf. Das ist die faire Antwort.
   - Ein allgemeiner Ausführer im Gegner-Update, **nicht je Gegner neu**. Vorhandene Boss-KIs (Weißbart, Varg, Garmadon)
     dürfen ihn mitbenutzen.
   - Vergeben an: Kettenknecht (`slam`), Rotgardist (`thrust`), Knochenritter (`sweep`), Leichenkoloss (`slam`),
     Bär (`charge`), Todesritter (`sweep`), Elite-Schützen (`shot`), alle 6 Bosse (je 2 Arten).
2. **Gewicht je Waffe:**
   - Hit-Stop gestaffelt: Dolch 25 ms, Schwert 45 ms, Axt und Keule 60 ms, Zweihänder und Hammer 80 ms.
   - Rückstoß und Kamerawackeln wachsen mit.
   - Die Zahlen gehören in eine Tabelle neben `swingOf`.
3. **Bogen:**
   - Beim Spannen hält die linke Hand den Bogen, die rechte zieht die Sehne zum Kinn, und der Pfeil liegt sichtbar auf der
     Sehne. Der Körper ist leicht gedreht.
   - Der Pfeil startet an der Sehne, nicht an der Körpermitte.
   - Mit einem Posenblatt nur für den Bogen prüfen: 4 Richtungen × Spannen, Loslassen.
4. **Wölfe und Banditen:** Heute teilen sie das Team „foe“. Sie jagen also gemeinsam den Spieler, greifen sich aber
   gegenseitig nie an.
   - Regel: Raubtiere (`faction: 'beast'`) und Menschen-Gegner sind einander feindlich, wenn sie sich auf 120 px nahe kommen.
   - Diese Prüfung gehört in `isHostile`, gleich nach der Amok-Prüfung.
   - Gezähmte Tiere (`pet`) sind ausgenommen.

### Fertig, wenn
- [ ] Probe: Ein schwerer Angriff trifft einen stehenden Dummy und verfehlt einen, der in der Ausholphase ausweicht.
- [ ] Probe: Die Ausholphase ist bei jedem `heavy` mindestens 600 ms lang.
- [ ] Probe: Wolf und Bandit auf 100 px Abstand kämpfen gegeneinander, ein gezähmter Wolf nicht.
- [ ] Im Spiel angesehen und als kurze Bildfolge (3 Bilder: Ausholen, Schlag, Erholung) gespeichert.
- [ ] Rückwärtslaufen-Regel (§34 im Master-Prompt) gilt für jeden Gegner mit `heavy` weiter.

---

## P4 — Magie-Kern

**Grundsatz:** Magie ist ein Weltsystem, keine Klasse. Dieses Paket baut nur den Kern (Daten, Wirker, Zustände,
Zauberbuch). Das Lernen folgt in P5, die Weltfolgen in P7.

### Daten: `SPELLS` in data.js
```js
fire_bolt: { name: 'Feuerpfeil', school: 'fire', tier: 1, shape: 'bolt', mana: 10, cast: 350, cd: 2500,
             dmg: [10, 1.1], el: 'fire', status: { key: 'burning', chance: 0.3, left: 3000 }, speed: 6, range: 320,
             desc: '…' },
```
- **Formen `shape`:** `bolt` (Geschoss), `nova` (Ring um den Wirker), `area` (Fläche am Zielpunkt), `line` (Strahl),
  `wall` (Wand aus Stücken, blockiert Wege für N s), `chain` (springt auf sichtbare Ziele), `self` (auf sich), `ally`
  (Gefährte), `blink` (Sprung), `summon` (Beschwörung).
- **Elemente `el`:** fire, frost, shock, earth, arcane, holy, shadow, nature, blood.
- **Kosten:**
  - `mana`,
  - optional `reagent` (Item-Schlüssel und Zahl, z. B. Manakristall, Seelenphiole),
  - `hpCost` (Blutmagie),
  - `corpse: true` (Nekromantie).
- **Schadensformel:** `dmg: [basis, faktor]` → `basis + faktor * Intelligenz`, danach ×`spellMul(caster)` (Funktion
  gibt es) und × Rang des Zaubers (I 1,0 · II 1,25 · III 1,5).

### Die Schulen, Welle 1 (in P4 bauen, 20 Zauber)

| Schule | I (früh) | II (Mitte) | III (spät) |
|---|---|---|---|
| Feuer | Funke (`bolt`), Feuerpfeil | Feuerball (vorhandene Fähigkeit bleibt, Zauber daneben), Flammenstoß (`line`) | Feuerwand (`wall`), Flammenkreis (`nova`) |
| Frost | Froststoß (verlangsamt) | Eisspeer (`bolt`, durchbohrt) | Eiswand (`wall`), Einfrieren (`area`) |
| Blitz | Schock (kurze Betäubung) | Blitz (`line`) | Kettenblitz (`chain`, 3 Sprünge, nur Sichtlinie) |
| Arkan | Energiegeschoss | Magieschild (`self`, fängt Geschosse), Arkane Klinge | Kurzteleport (`blink`, 180 px, nie in feste Kacheln), Magieunterbrechung |
| Heilung | Kleine Heilung, Licht (`self`: Leuchtkreis) | Blutung stillen, Glied stabilisieren (repariert ein Körperteil um 60 Leben) | Starke Heilung, Regeneration |
| Schutz | Schild (`self`) | Schutzkreis (`area`, Gruppe) | Gruppenbarriere |

**Welle 2** kommt in P5 oder P7: Erde, Unterstützung, Illusion (Unsichtbarkeit, Doppelgänger, Angst). Nekromantie,
Druide und Fluch haben schon Titelfähigkeiten. Sie werden über `school` eingeordnet und bekommen dort neue Zauber
(Lebensentzug, Knochenschild, Wurzeln, Gift), **keine Duplikate**.

### Der Wirker `castSpell(caster, key, aim)`
- Er gilt für Spieler, Gefährten und Gegner gleich. Er darf nie `S.player` annehmen.
- **Phasen:**
  1. **Start:** Pose `cast`, Rune unter dem Wirker in der Schulfarbe.
  2. **Sammeln:** `cast` ms lang. Partikel wandern zur Hand. Wird der Wirker getroffen, bricht der Zauber ab (50 % Mana zurück).
  3. **Auslösen:** Form ausführen.
  4. **Einschlag:** Funken, Licht, Hit-Stop nach Stärke.
  5. **Erholung:** 250 ms.
- **Kollision:**
  - Geschosse nutzen den vorhandenen Geschossweg (`S.projectiles`, Wandprüfung bei game.js ~3127). Nichts geht durch Wände.
  - `chain` und `line` prüfen `clearLine`.
  - `blink` prüft das Ziel mit `solidTile` und nimmt sonst den letzten freien Punkt.
  - `area` wirkt nur im Radius.
- **Zustände** über `addStatus`. Der Tick liegt neben `poisoned` (game.js ~2413):
  - `burning`: 3 Schaden je s, wer auf nassem Boden oder im Regen steht, verliert ihn schneller.
  - `chilled` gibt es schon (Kälte). Frostzauber stapeln `frost` 1–3 Stufen (−15 % Tempo je Stufe), bei 3 Stufen
    `frozen` 1,5 s (steht still, nimmt +20 % Schaden).
  - `shocked`: 0,6 s Betäubung, danach 3 s immun.
  - `cursed`: −15 % Schaden und −10 Rüstung.
  - `warded`: Schildpunkte.

  Das Tempo wirkt in `B.speedFactor` (body.js ~125) über einen Faktor aus Zuständen, nicht in jedem Aufrufer.
- **Welt-Spuren** (nur flüchtig, nicht gespeichert): Brandfläche 8 s, Eisboden 10 s (rutschig: weniger Bremswirkung),
  Blitz-Schwärzung.
  - Feuer auf ein Haus zündet es mit 10 % an (`startFire` gibt es). Diese Weltfolge wird gespeichert, weil der Brand gespeichert wird.
- **Übung:** `p.spellUse[key]++` bei jedem Treffer. Bei 25 Einsätzen Rang II, bei 100 Rang III. Der Aufstieg wird angesagt.

### Zauberbuch
- Neues Fenster (Taste **Z**, auch im Seitenmenü für Touch) mit Schulen als Reiter.
- Bekannte Zauber zeigen Rang, Kosten, Wirkung, Übungsbalken und „Auf Leiste legen“.
- Unbekannte, von denen man gehört hat, zeigen „Lehrer: …, Ort: …“.
- `p.spells = { key: rang }` wird gespeichert. Die Schnellleiste nimmt `{ type: 'spell', key }` neben `ability` und `item`.

### NPCs zaubern
- MONSTERS bekommen `spells: ['fire_bolt', …]`.
- Der vorhandene Fernkampf-Zweig der Gegner-KI ruft `castSpell` auf, sobald die Sichtlinie frei ist und genug Mana da ist.
  Gegner haben `mana` wie der Spieler.
- Zuerst ausstatten: Kultist, Nekromant, Aurelion-Magier (neu, P10), Ordenspriester (Heilung für Verbündete).

### Fertig, wenn
- [ ] Probe je Form: `bolt` endet an einer Wand. `chain` springt nicht durch Wände. `blink` landet nie in einer festen
      Kachel. `area` trifft nur im Radius. `wall` blockiert den Weg einer Figur (Wegfindung meidet sie).
- [ ] Probe: Drei Frosttreffer ergeben `frozen`, danach wirkt `shocked` erst nach der Immunität erneut.
- [ ] Probe: Ein Treffer in der Sammelphase bricht den Zauber ab und gibt halbes Mana zurück.
- [ ] Probe: Ein Gegner mit `spells` wirkt im Test mindestens einmal auf einen Dummy (Sandbox).
- [ ] Probe: `p.spells` und `spellUse` überstehen Speichern und Laden (`RF.loadProbe`).
- [ ] Im Spiel: jede Schule einmal gewirkt, Bildfolge Start, Sammeln, Einschlag gespeichert. Bildzeit bei 10
      gleichzeitigen Zaubern höchstens 1 ms über P0.

---

## P5 — Magie lernen: Lehrer, Akademie, Prüfungen, Kodex

### Lehrer in der Welt (der Spieler muss reisen)
| Lehrer | Ort | Schulen | Bedingung |
|---|---|---|---|
| Wandermagier (neu, eigener Name) | Schenke in Kreuzweg, früh erreichbar | Feuer I, Arkan I, Licht | 30 Gold je Zauber |
| Elena (vorhanden) | Eren | Heilung I | freundlich |
| Ordenspriesterin (neu) | Kapelle Sonnwacht | Heilung II, Schutz I–II, Heilig | Orden-Rang ≥ 1 |
| Akademie Aurelheim (Professoren, neu) | Akademieviertel (Gebäude `academy` gibt es) | Arkan II–III, Frost, Blitz, Schutz III | Aufenthaltsschein; Stufe III nur für Bürger oder nach Prüfung |
| Druidin (neu) | Alter Hain | Natur (verbindet sich mit dem Druiden-Titel) | Ruf beim Hain oder Druiden-Titel |
| Hexe im Moor (neu, verboten) | Moorland | Fluch, Blut | man muss sie finden (Gerücht) |
| Ilvar Nachtglas | Magierturm (P6) | Nekromantie, Seele, legendäre Zauber | siehe P6 |
| Omega-Priester (neu) | Eisenfeste | Glaubensmagie (P7) | Kette-Rang ≥ 2 |

Jeder Lehrer bekommt einen Dialog in der vorhandenen Dialogform mit den Punkten „Lernen“, „Über Magie reden“,
„Prüfung“. Die Kosten richten sich nach Stufe und Ruf.

### Akademie Aurelheim mit Funktion
- Das Gebäude gibt es schon. Es bekommt einen Innenraum mit:
  - Hörsaal (Professor mit Lehrplan),
  - Bibliothek (Lesen schaltet Kodex-Einträge frei),
  - Übungsplatz mit Zielscheiben,
  - Kristallkammer (Manakristall kaufen).
- NPCs: 2 Professoren, 6 Studenten mit Tagesablauf (Vorlesung, Bibliothek, Mensa, Wohnheim). Dafür die vorhandenen
  Tagespläne je Rolle nutzen.
- **Prüfungen** (keine Tötungsaufträge), mit vorhandenen Bausteinen:
  - **Zielübung:** 5 Scheiben in 30 s mit Zaubern treffen.
  - **Schildprüfung:** 10 Geschosse eines Übungsautomaten mit Magieschild abfangen.
  - **Heilprüfung:** einen verwundeten Studenten stabilisieren (Glied reparieren).
  - **Duell:** gegen einen Studenten bis 20 % Leben. Keiner stirbt: Figur `brawl`, ähnlich den vorhandenen Prügeleien.

  Bestanden schaltet Rang III frei und gibt einen Akademie-Rang: Hörer, Adept, Magister.

### Kodex
- Neuer Reiter **Magie**: Schulen, was sie können, wer sie lehrt (nur bekannte Lehrer; unbekannte als „Man sagt, im
  Moor …“), welche Fraktion welche Magie mag oder verbietet.
- Reiter **Fraktionen**: warum dich eine Fraktion hasst, z. B. „Rooks Bande: Du bist ein Fremder mit Geld. −100 zum Start.“

### Fertig, wenn
- [ ] Im Spiel von neuem Spielstand: beim Wandermagier Feuer I gelernt, gewirkt, auf Rang II geübt, das Zauberbuch zeigt es.
- [ ] Probe: Ein Lehrer lehrt nicht ohne Bedingung (zu wenig Gold, Intelligenz, Ruf) und sagt, was fehlt.
- [ ] Alle 4 Prüfungen einmal bestanden und einmal nicht bestanden. Keine Prüfung tötet eine Figur.
- [ ] Kodex-Reiter Magie und Fraktionen zeigen nur Bekanntes.

---

## P6 — Der Magierturm im Totenland

**Ziel:** eines der auffälligsten Bauwerke der Welt, das Gegenstück zur Akademie. Dunkle Magie, Seelen, verbotene Rituale.

### Außen (Oberwelt)
- Der Ort liegt im tiefen Totenland östlich der Schwarzen Feste: neuer `LOCATIONS`-Eintrag, Gefahrenstufe tödlich.
- Der Turm ist auf der Oberwelt riesig:
  - Sockel 14 × 14 Kacheln, der Schaft ragt im Bild weit nach oben (hohes Sprite wie die Himmelsinsel-Silhouette),
  - grünes Seelenlicht in Fenstern, Seelenfunken steigen auf,
  - Ring aus Grabsteinen, Knochenbrücke über einen Graben.
- Weg dorthin: an der Nekropole vorbei. Wachen: Knochenritter, Geister, Nekromanten mit Zaubern (P4).

### Innen: eigene Karte `tower` (wie `isle`)
- Der Turm wird als **gestapelte Ebenen** auf einer Karte gebaut. Treppen sind Portale zwischen den Ebenen.
- Registrierung an allen 4 Stellen: newGame-ents, continueGame FRESH, ARRIVAL, DUNGEONS/MAP_KEYS.

| Ebene | Inhalt | Spiel |
|---|---|---|
| 1 Eingang | Halle, Schädeltor | Torwächter-Automat aus Knochen fragt nach dem Grund |
| 2 Bibliothek | Regale, lesende Geister | Bücher schalten Kodex und Zauber-Hinweise frei |
| 3 Lehrsäle | untote Schüler üben | Schüler als Gesprächspartner, einer will fliehen (Nebenquest) |
| 4 Alchemielabor | Kessel, Destille | Reagenzien kaufen und brauen |
| 5 Beschwörungskammer | Kreise am Boden | Prüfung: eine Beschwörung halten, während Geister angreifen |
| 6 Ritualraum | Altar | verbotene Rituale (P7) |
| 7 Observatorium | Sternkarte, Blick auf den Rotfall-Krater | Lore zu Omega |
| 8 Seelenkammer | gefangene Seelen in Gläsern | Entscheidung: befreien (Orden +, Ilvar −) oder lassen |
| 9 Verbotene Bibliothek | Kette vor der Tür | nur mit Ilvars Vertrauen oder Diebstahl (Kampf) |
| 10 Turmspitze | Ilvars Studierzimmer | Gespräche, Lehre, Endprüfung |
| Unter dem Turm | Krypta, Seelengefängnis, Katakomben mit verbotenen Experimenten | Dungeon mit Fallen (erstes Beispiel für Rätsel und Fallen, §40 Master-Prompt) |

### Ilvar Nachtglas
- **Wer er ist:** Lich, einst Hofmagier von Vharnholm. Er sah Garmadons Rückkehr und hielt sich heraus. Er dient Garmadon
  nicht, fürchtet ihn aber auch nicht.
- **Was er will:** Wissen über den Rotfall. Er hält Omega für ein Wesen, nicht für einen Gott, und will es verstehen, nicht anbeten.
- **Seine Meinungen** (Dialog-Themen):
  - Garmadon: „ein Bruder, der nicht loslassen kann“.
  - Varg: „ein Schmied, der Ketten für Gebete hält“.
  - Aurelion: „Kinder mit Kristallen“.
  - Die Lebenden: neugierig, nicht feindlich.
- **Seine Schüler:** 3 benannte Untote mit eigener Meinung über ihn.
- **Vertrauen** ist ein eigener Zähler `S.ilvar.trust`, 0–100:
  - Aufgaben erledigen (Reagenzien, verlorene Bücher aus Nekropole und Akademie, eine Seele zurückbringen),
  - richtig antworten,
  - ihn nicht bestehlen.

| Vertrauen | Er lehrt |
|---|---|
| 0 | nur Gespräch, einfache Zauber gegen Gold |
| 25 | Schatten, Lebensentzug |
| 50 | Nekromantie (Skelett erheben, auch ohne Nekromanten-Titel, aber schwächer) |
| 75 | verbotene Bibliothek, Seelenmagie |
| 100 | Endprüfung, dann **legendärer Zauber** („Nachtglas“: Zeit um dich verlangsamt sich 6 s), Titel „Schüler des Nachtglases“ |

- **Weltfolge:**
  - Stirbt Garmadon, ändert Ilvar seine Rede.
  - Wird Ilvar getötet, bricht der Turm teilweise ein (Ebenen 6–10 zu), und die Schüler zerstreuen sich als Gegner im Totenland.

### Fertig, wenn
- [ ] Der Turm ist aus 30 Kacheln Abstand auf der Oberwelt als Wahrzeichen erkennbar. Das Bild geht an den Nutzer.
- [ ] Alle 10 Ebenen und die Krypta sind begehbar. Die Wegfindung kommt durch alle Treppen, ohne dass Figuren feststecken.
- [ ] Probe: Die Vertrauensstufen schalten genau die Lehre der Tabelle frei.
- [ ] Probe: Die Karte `tower` überlebt Speichern und Laden, der Spieler steht nach dem Laden am richtigen Ort.
- [ ] Nekropole → Turm → Ilvar → ein Zauber gelernt: einmal durchgespielt (mit Debug-Teleport erlaubt).

---

## P7 — Magie und Welt

1. **Verbotene Magie:**
   - Nekromantie, Blut und Fluch mit Zeugen im Menschenland werden ein Verbrechen `forbiddenMagic` im vorhandenen
     Kopfgeld-System (Faktor wie Angriff, Orden doppelt).
   - Ab 3 Taten jagen **Magierjäger**. Das ist eine Kopfgeldjäger-Variante mit Zauber „Bann“: bricht Zauber ab,
     −50 % Mana, 5 s Stille.
   - Das vorhandene Magische Gericht in Aurelheim bekommt den Anklagepunkt dazu.
2. **Haltung der Fraktionen zur Magie:** kurze Tabelle in data.js `MAGIC_VIEW` (Fraktion → gern gesehen, geduldet,
   verboten). Sie steuert:
   - Begrüßungszeilen (vorhandenes `contextLines`, game.js ~7805),
   - Preise bei Lehrern,
   - Wachen-Reaktion auf offenes Zaubern in der Stadt.
3. **Glaubensmagie (Omega):** Schule `faith`, gelehrt vom Omega-Priester in der Eisenfeste:
   - Heilige Flamme (Feuer, doppelt gegen Untote),
   - Schutzsegen,
   - Strahl (`line`),
   - Inquisition (`area`, verrät Unsichtbare).

   Sie wirkt stärker, je höher `omegaStance` bzw. der Kette-Rang ist. Das unterscheidet sie sichtbar von Magitech (Aurelion)
   und Totenmagie.
4. **Artefakt-Konflikt (erstes Weltereignis mit Magie):**
   - Goblins finden einen „Aurelioner Magiekern“.
   - Aurelion, Untote und Omega-Kirche wollen ihn, jede Seite schickt Boten.
   - Der Spieler kann ihn verkaufen, zerstören, behalten, einer Seite geben oder untersuchen (Akademie oder Ilvar).
   - Jede Wahl ändert Ruf, eine Handelsroute oder einen Ratsbeschluss und kommt in die Chronik.
   - Einbau als Ereignis in `EVENTS` wie der Magitech-Unfall.
5. **Magische Anomalie:** seltenes Ereignis nahe Ley-Punkten (per Hash auf der Karte gewählt, nicht mit `rnd()`).
   - Mana-Regeneration ×2, Zauber schlagen zu 10 % fehl (anderes Element).
   - Das Brett sucht jemanden, der sie mit einem Schutzzauber schließt.

### Fertig, wenn
- [ ] Probe: Nekromantie vor einer Wache ergibt Kopfgeld, ohne Zeugen nicht.
- [ ] Probe: Ein Magierjäger bricht einen Zauber in der Sammelphase ab.
- [ ] Im Spiel: jede Wahl beim Artefakt-Konflikt einmal über die Sandbox geprüft, zwei davon im Spiel mit sichtbarer Folge.

---

## P8 — Ruhm und Rang-Informationen

1. **Ruhm:** `S.fame = { mitte, west, sued, ost, see }` mit Werten 0–100.
   - Punkte gibt es für Boss-Siege (+15 in der Region, +5 überall), Legenden-Titel (+10), große Aufträge (+2),
     benannte Ereignisse (Brand gelöscht +3).
   - Stufen: 0 Unbekannt, 15 Bekannt, 35 Regional bekannt, 60 Berühmt, 85 Legendär.
   - Wirkung:
     - Begrüßungszeilen,
     - Kinder und Bettler laufen zu dir,
     - Kopfgeldjäger kommen früher (Berühmte sind Ziele),
     - Händler geben ab „Berühmt“ 5 % Nachlass.
   - Anzeige im Charakterfenster.
2. **Rang-Informationen:** Der Kodex-Reiter Ränge zeigt je Fraktion:
   - aktueller Rang, nächster Rang,
   - Voraussetzungen (Ruf, Quest, Gold, Prüfung, Ansprechpartner),
   - Belohnungen, Vorteile, Nachteile,
   - neue Zugänge, Händler, Ausrüstung, Rechte.

   Die Quelle sind die vorhandenen `RANK_LINES` / `RANK_Q` (game.js ~8227). Fehlt eine Angabe, wird sie dort ergänzt,
   nicht im Fenster erfunden.
   - **Fraktionen ohne Rang-Questline** (Händler, Bande, Aurelion, Grubenstämme) bekommen je eine Questline aus
     2–3 Aufträgen nach dem Muster von Valen, Orden und Untoten.
3. **Quest-Informationen vor Annahme:** Auftraggeber, Ziel, Region, Frist, Belohnung, möglicher Ruf ±, benötigte
   Gegenstände. Geheime Wendungen bleiben geheim. Das meiste zeigt das Auftragsfenster schon; Lücken füllen.

### Fertig, wenn
- [ ] Probe: Ein Boss-Sieg hebt den Ruhm der Region über „Bekannt“, und eine Begrüßungszeile ändert sich.
- [ ] Für jede der 10 Fraktionen zeigt der Kodex den nächsten Rang vollständig.

---

## P9 — Reste aus S14 (Nutzerliste Punkt 4)

- **Kuh-Form:** Kopf, Hörner und Euter in `BEASTR` nachbessern. Die Kuh soll massiger wirken als das Pferd.
- **Flüchtige Sklaven aus der Eisenfeste** (Idee 14): Ein Goblin oder Mensch bittet an der Straße um Hilfe. Du kannst
  verstecken (Ruf Goblins +, Kette −), ausliefern (Kette +) oder begleiten. Verfolger sind Kettenreiter mit Hund.
- **Erbfolgestreit im Adel** (Idee 12, teils): Ein Adelshaus Aurelions streitet um den Sitz. Zwei Anwärter bitten um
  Fürsprache, die Wahl verschiebt eine Stimme im Rat.
- **Meteorsplitter** (Idee 15): nachts ein Leuchten am Himmel, am Morgen ein Krater mit Splitter. Der Splitter ist ein
  Reagenz für Magie (P4) oder wird von der Omega-Kirche heilig gesprochen. Kette, Akademie und Ilvar bieten Geld.

Jedes davon bekommt eine Selbsttest-Probe und einen Debug-Knopf unter „Ereignisse“.

---

## P10 — Aurelion sichtbar überlegen

Aurelheim hat seine 11 Viertel schon. Hier geht es um den **Eindruck beim Betreten** und um Tiefe, nicht um mehr Fläche.

1. **Sichtbare Magitech:**
   - Luftschiffe über der Stadt (gibt es schon am Himmel; im Bild mehr zeigen, 2–3 gleichzeitig mit Schatten auf dem Boden),
   - Magitech-Laternen mit blauem Kristall entlang der Prachtstraße,
   - Automaten-Streifen,
   - Kristallkräne im Industrieviertel,
   - ein **Aquädukt** über das Handelsviertel,
   - große Uhr am Regierungsviertel.
2. **Fabrik zeigt die Kette:** In der Fabrikhalle laufen Rohstoffkisten auf einem Förderband hinein und Magitech-Kisten
   hinaus, und ein Karren bringt sie zum Lager. Rein optisch, aber die Kistenzahl folgt dem Vorrat in economy.js.
3. **Neue Figuren:** Aurelion-Magier (Wache mit Zaubern), Sonnenlegion-Scharfschütze mit Magiegewehr.
4. **Magitech-Waffen**, jede mit Nachteil:

   | Waffe | Vorteil | Nachteil |
   |---|---|---|
   | Magiegewehr | Reichweite | 1,4 s Nachladen |
   | Kristallkanone | Fläche | braucht Manakristall |
   | Runenarmbrust | durchschlägt Schild | langsam |
   | Energie-Hellebarde | Schockschaden | zieht Mana |

   Die vorhandene Messingpistole ist das Muster.
5. **Aurelion-Ränge ausbauen:** zwischen den vorhandenen Stufen je ein Zwischenrang mit Prüfung (Bürgerprüfung,
   Beamtenprüfung). Alles wird im Kodex (P8) angezeigt.
6. **Aurelion-Ereignisse** nach dem Muster des Magitech-Unfalls:
   - Luftschiffabsturz (Trümmer, Verletzte, Beute für Mutige, Legion sperrt ab),
   - Erfinderkongress (Wettbewerb, Magitech-Preis sinkt),
   - Adelsball (Einladung ab Rang, Gerüchte, Intrige),
   - Sabotage (Fabrik steht still, Täter suchen).

### Fertig, wenn
- [ ] Ein Bild vom Westtor hinein zeigt gleichzeitig Luftschiff, Automat, Laternen, Aquädukt oder Uhr, Adelige und Arbeiter.
      Das Bild geht an den Nutzer.
- [ ] Bildzeit in Aurelheim nicht schlechter als P0. Sonst zuerst BUG-108 angehen.

---

## P11 — Osten nach Garmadons Fall: Siedlungen in Stufen

- Heute gibt es Befreiung, Heimkehrer und Heilung des Totenlands. Dazu kommt nun eine Zeitleiste je freigewordenem Ort:
  1. Tag 1: Flüchtlinge.
  2. Tag 5: Zeltlager.
  3. Tag 15: erste Häuser.
  4. Tag 30: Dorf.
  5. Tag 60: größere Siedlung.
- Die vorhandene Stadtwachstums-Funktion (`growTown`) wird wiederverwendet. Neue Dörfer bekommen einen Markt
  (economy.js), damit Handelswege entstehen.
- Die Chronik trägt jede Stufe ein. Ein Erbe liest später „Dein Vorgänger …“ (Legacy).

**Fertig, wenn:** eine Probe 60 Tage nach Garmadons Tod (Sandbox) für einen Ort alle 5 Stufen zeigt und ein Dorf mit Markt
existiert.

---

## P12 — Schwierigkeitsgrade

Unverändert nach `PLAN_OFFEN.md` Block B.
- Stufen: Angsthase, Schwer (Standard), Sehr schwer.
- Die Gliedergrenze ist schon eingebaut (−200, bei Sehr schwer −100, bei Angsthase nie).
- Neu dazu: Wahl beim Start, Gegner-Schaden und -Leben, Ansage-Zeit schwerer Angriffe (Angsthase +30 %),
  Beute-Chancen, Kopfgeld-Verfall.

---

## P13 — Gesamtdurchlauf und visuelle Prüfung

- Der Durchlauf nach Prompt §106 von neuem Spielstand, mit Debug-Teleport erlaubt:
  1. Figur erstellen, kämpfen, eine Stufe aufsteigen.
  2. Auftrag annehmen und abschließen, Fraktion beitreten, Rang holen.
  3. Magie lernen und wirken.
  4. Karawane, Kerker, Sklaverei.
  5. Aurelion, Magierturm, Garmadon, ein Weltereignis.
  6. Speichern und Laden, sterben, Erbe prüfen.
- Visuelle Prüfung mit einem Sammelbild je Region: Aurelion, Eisenfeste, Totenland, Magierturm, Himmelsinsel,
  Dungeons, Dörfer, Karawane, Kampf, Magie.
- Prüfpunkte: Dichte, Stil, Schnitt durch Wände, Wege, Lesbarkeit.
- Jeder Fund kommt in `BUGS.md` mit Stufe.
- Danach stellst du die Designfragen aus Prompt §112. Die Standards aus §2 gelten bis dahin.

---

## 4. Debug-Menü (wächst mit den Paketen)

| Paket | Neue Knöpfe |
|---|---|
| P1 | Grafik: Archetypen-Blatt, Rüstungswucht 0–4 an der eigenen Figur |
| P2 | Gegenstände: Talisman, Trank, Boss-Beute würfeln (Sandbox-Anzeige), Zustand setzen |
| P3 | Kampf: schweren Angriff auslösen (nächster Gegner), Hit-Stop anzeigen |
| P4 | neuer Bereich **Magie**: alle Zauber lernen, Rang setzen, Mana voll, Abklingzeiten zurück, Zauber auf Dummy testen |
| P5 | Teleport: Akademie, jeder Lehrer; Prüfung starten |
| P6 | Teleport: Magierturm (je Ebene), Vertrauen Ilvar ± 25 |
| P7 | Ereignisse: Artefakt-Konflikt, Anomalie; Verbrechen: verbotene Magie |
| P8 | Ruhm ± je Region |
| P9–P11 | je Ereignis ein Knopf; Osten: Zeitleiste +10 Tage |

Jeder Knopf wird einmal gedrückt und geprüft. Keine Knöpfe ohne Wirkung.

---

## 5. Doku am Ende jedes Pakets

- `SESSION_LOG.md` (neuer Eintrag oben).
- `CHANGELOG.md` (höchstens 5 Zeilen je Sitzung).
- Statustabelle hier (§3).
- `PHASE_STATUS.md`.
- `GUIDE.md` bei neuen Inhalten (Magie bekommt einen eigenen Abschnitt „Magie lernen“).
- `WELTREGELN.md` bei neuen Systemen.
- `GUIDE_EREIGNISSE.md` bei neuen Ereignissen.

---

## Entscheidungen des Nutzers (29.09., nach Paket K2)
- Spielstand: **Datei im Cloud-Ordner** (Stufe 1, ohne Server). Ein Online-Dienst ist nicht gewünscht.
- **Stil R ist Standard** (einmalige Umstellung `artR_S15`). D und F bleiben in den Optionen wählbar.
- Nach dem Spielstand kommt **P1** (schwere Rüstung nach Referenz 6).
- Verboten im Menschenland: **Nekromantie, Blutmagie, Flüche**. Illusion ist erlaubt.
- (später am 29.09.) P1: schwere Rüstung **noch wuchtiger**, Garmadon groß. Danach **P2**. Siedlungsbau P14: **Ort frei wählbar**, **Zonen, Siedler bauen selbst**.

## S — Spielstand geräteübergreifend, gesichert und verschlüsselt (Nutzer 29.09., „als Nächstes, erst danach“)

**Ziel:** Auf einem Gerät weiterspielen, was man auf einem anderen begonnen hat. Der Stand ist gut gesichert und verschlüsselt.

**Ausgangslage:** Der Spielstand liegt in `localStorage` (`rotfall.legacy.save`, etwa 2,1 MB, JSON). Er ist an Browser und Gerät
gebunden. Es gibt keinen Server.

**Klären, bevor gebaut wird** (Fragen an den Nutzer):
1. Wo läuft das Spiel später: nur lokal im Browser, auf einer eigenen Webseite oder als Desktop-App?
2. Wo soll gespeichert werden:
   - (a) in einer Datei, die man selbst in einen Cloud-Ordner legt (OneDrive, Google Drive, Dropbox), ohne Server;
   - (b) auf einem kleinen eigenen Server oder Dienst (etwa Supabase oder Firebase) mit Konto;
   - (c) Export und Import per Passwort-Datei oder QR-Code.
3. Mit einem Passwort, das nur der Nutzer kennt (Ende-zu-Ende), oder reicht ein Konto-Login?

**Empfehlung (Standard, falls der Nutzer nichts anderes sagt):**
- **Verschlüsselung im Browser, bevor der Stand das Gerät verlässt:** Web Crypto API, AES-GCM 256 Bit, Schlüssel aus dem Passwort
  per PBKDF2 (SHA-256, mindestens 600 000 Runden, zufälliges Salz). Nonce je Speichern neu.
  - Zuvor verkleinern: `CompressionStream('gzip')`.
  - Dazu eine Prüfsumme und die Spielstand-Version.
  - Das Passwort wird nie gespeichert und nie gesendet.
- **Stufe 1, ohne Server:**
  - „Stand exportieren“: eine verschlüsselte Datei `rotfall-<Haus>-<Datum>.rfsave`.
  - „Stand importieren“: Passwort eingeben, entschlüsseln, prüfen, laden.
  - Mit einem Cloud-Ordner ist das schon geräteübergreifend.
  - Beim Import wird der alte Stand vorher als Sicherung behalten.
- **Stufe 2, nur wenn gewünscht:** automatisches Hochladen der verschlüsselten Datei zu einem Speicherdienst. Der Dienst sieht nur
  verschlüsselte Bytes.
  - Mehrere Sicherungsstände (die letzten 5) gegen Fehler.
  - Konflikt „neuerer Stand auf dem anderen Gerät“ erkennen (Zeitstempel und Spieltag) und fragen.
- **Sicherheit:**
  - Keine Schlüssel oder Zugangsdaten im Code.
  - Tests nutzen eigene Testdaten, nie den echten Stand (Regel §3).
  - Selbsttest-Proben: Verschlüsseln und Entschlüsseln ergibt denselben Stand, ein falsches Passwort schlägt sauber fehl, eine
    manipulierte Datei wird erkannt (AES-GCM prüft das), ein alter Stand bleibt als Sicherung.

---

## P14 — Eigener Siedlungsbau als Städtebau-Simulation (Nutzer 29.09., „erst mal nur notieren“)

**Wunsch:**
- Ein eigener Siedlungsbau, in den NPCs von selbst ziehen, ähnlich wie in Kenshi.
- Man muss aber nicht alle Leute selbst anwerben. Die Stadt wächst und zieht Leute an.

**Vorhanden (vor dem Bauen prüfen):**
- `S.settlement` mit 12 Bauten (`BUILDINGS`: Lagerfeuer, Zelt, Hütte, Lager, Werkbank, Schmiede, Feld, Weide, Brunnen, Palisade,
  Tor, Wachturm).
- Wachstum der Städte (`growTown`, `growthDay`), Zuzug und Abwanderung von Bewohnern (`settleIn`, Flüchtlinge), Tagesabläufe je
  Beruf, Wirtschaft mit Betrieben und Märkten (`economy.js`).

**Ideen für den Plan (Standards, der Nutzer entscheidet):**
1. **Anziehung statt Anwerbung:** Die Siedlung hat einen Wert „Ruf der Siedlung“ aus Sicherheit (Palisade, Wachen), Nahrung,
   Unterkunft (freie Betten), Arbeit (freie Stellen in Betrieben) und Ruhm des Spielers.
   - Liegt der Wert hoch genug, ziehen Siedler zu: Flüchtlinge, Wanderarbeiter, entlaufene Sklaven, Veteranen.
   - Jeder Siedler bringt einen Beruf mit.
2. **Bauplätze und Zonen:** Der Spieler legt Wohnen, Handwerk, Felder und Verteidigung fest. Siedler bauen selbst, mit
   Material aus dem Lager, und sind dabei sichtbar bei der Arbeit.
3. **Bewohner mit Bedürfnissen:** Essen, Schlaf, Sicherheit, Glaube und Geselligkeit, dazu eine Schenke. Unzufriedene ziehen weg,
   Zufriedene bleiben und gründen Familien.
4. **Wirtschaft:** Die Siedlung wird ein eigener Markt in `economy.js`. Händlerzüge kommen vorbei, Betriebe produzieren, Steuern
   oder Abgaben gehen an den Spieler.
5. **Gefahr:** Überfälle (Untote, Banditen, Kette) treffen auch die eigene Siedlung. Verteidiger sind die eigenen Bewohner.
6. **Stufen:** Lager → Weiler → Dorf → Marktflecken → Stadt. Jede Stufe schaltet Bauten frei (Tempel, Markt, Kaserne, Akademie).
7. **Fraktionen reagieren:** Tribut fordern (Kette), Schutz anbieten (Valen), Handel (Händler), Anerkennung als Stadt (Rat von
   Aurelion).

**Offene Fragen an den Nutzer:**
- Ort frei wählbar oder feste Bauplätze?
- Wie viel Mikro-Management: jedes Haus einzeln setzen oder Zonen?
- Soll die Siedlung erobert oder zerstört werden können?

---

## G — Regel des Nutzers
Alle Goblins in der Welt bleiben feindlich, bis Varg gefallen ist (vorhandene Regel `goblinsFreed`). Nur die Bewohner von Morrgrund sind
misstrauisch (neutral, sie fliehen beim ersten Anblick). Eine Freundschaft mit Dodon ändert daran nichts; im Selbsttest und im Spiel geprüft.

## G — Offene Fragen zu Morrgrund und Dodon (später stellen, Nutzer: „erst später“)
1. Morrgrund ist ein neues Dorf. Der alte Grubenhort (Grisk, kleines Lager südlich der Feste) bleibt bestehen. Zusammenlegen?
   Oder soll Grisk nach Morrgrund ziehen?
2. Gorak, der Grubenwart (Goblin-Boss in der Grube), ist ein Diener der Kette. Soll er Dodons Gegenspieler werden, etwa ein
   Verräter oder ein Bruder?
3. Soll Dodon im Sturm sterben können, auch wenn der Spieler überlebt? Das Dorf bliebe dann ohne Beschützer.
4. Welche Belohnung nach dem Sieg: eine Goblin-Titelklasse, ein Goblin-Gefährte, Dodon als Gefährte oder ein eigener Goblin-Händler?
5. Gegnerischer Weg: Soll ein Dorf, das man angegriffen hat, später versöhnt werden können?

---

## P15 / P16 — später (Nutzer 29.09.)
- **P15 Weltereignisse:** Weitere Ereignisse einplanen und den Nutzer vorher fragen. Ideensammlung als Grundlage: Luftschiffabsturz,
  Erfinderkongress, Adelsball, Sabotage (siehe P10), Seuche, Heuschrecken, Grenzstreit, Hexenprozess, Turnier,
  Flüchtlingstreck, Meteorsplitter (P9), Streik der Arbeiter, Karawane mit Schatz, Totenmesse, Omega-Zeichen am Himmel.
- **P16 Schloss König Varons:** Valen hat bisher keinen König im Spiel.
  - Geplant ist ein richtiges Dark-Fantasy-Schloss im Norden: Mauerring, Bergfried, Thronsaal, Kerker, Hof.
  - König Varon wird eine eigene Figur mit Hof, Rang-Questline und Rolle im Krieg gegen die Toten.
  - Vor dem Bauen fragen: Ort, Charakter Varons, Verhältnis zu Aurelion und zum Orden.
