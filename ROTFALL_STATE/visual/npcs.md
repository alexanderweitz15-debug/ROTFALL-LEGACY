# Visueller Umbau — Priorität 3: NPC-Interaktionen (Analyst B, 02.10.2026)

Grundlage: VISUAL.md, GATE.md, DECISIONS.md, IST_ZUSTAND.md, MECHANIKEN.md und der Code (per grep belegt, Funktionsnamen in `code`).
**Phase: nur Analyse, kein Spielcode.** Alle Kostenangaben sind grobe Schätzungen je Bild (Ziel 3 ms gesamt; heute laut `ROTFALL_STATE/perf/PLAN.md` 9–17 ms Median) — jede neue Darstellung muss ereignisgetrieben sein, nicht „jede Figur jedes Bild prüfen“.
Abgrenzung: Dialogfenster und Questgeber-Zeichen gehören zu Prio 1/2 (Analyst A). Hier nur, was in der Welt an der Figur passiert. Wo ein Quest-Zeichen berührt wird, ist es als Schnittstelle markiert.

---

## 0. Bestand (Code-Inventar)

| Bereich | Was es gibt | Code |
|---|---|---|
| Sprechblasen A (Umgebung) | `e.talk = {with, at, until, say}`; höchstens 4 Blasen, die nächsten zum Spieler; weicht überlappenden Blasen nach oben aus; unter fremden Dächern unsichtbar; Cinzel, dunkles Feld mit Pergamentkante | render.js `drawBubbles`; erzeugt von game.js `startTalk` (Freund/Rivale/Neuigkeit/Fest-Paare), `reactTick`/`reactLine`, `ambientTick`, `SCENES` (Predigt, `ambWedding`, `ambDuel`, `ambMinstrels`) |
| Sprechblasen B (Regie) | `bubble(e, text, ms)` legt einen `S.floats`-Eintrag mit `bubble:true` an; folgt der Figur; Spectral kursiv; **keine Obergrenze, keine Überlappungsprüfung** | game.js `bubble`, render.js `drawBubble`/`drawFloats`; genutzt von Szenen, `bossIntro`, Ankunft (`ARRIVE_SAY`), Musterung, „Die Wache ist tot! Lauft!“ |
| Text-Floats an NPCs | „Hilfe!“, „Warte auf mich!“, „knurrt“, „frei“, Omega-Jubel (`OMEGA_CHEER`) | game.js `float` |
| Gesten | 7 Mischposen: zeigen, abwehren, achsel, salutieren, jubeln, trauern, knien | anim.js `ANIM_DEFS.gesture`; game.js `gesture` → `act(c,'gesture',ms,toward)`; sprites.js `poseOf` (`act.kind === 'gesture'`); fig5 rig |
| Gesten-Nutzung | `zeigen` 4× (Gespräch, Ankunftswache, Sturmglocke, Heldentod-Mörder), `salutieren` 1× (Musterung), `abwehren` im Gespräch bei Beziehung < −20 und im Boss-Auftritt; **trauern, jubeln, knien nur in Kamerafahrten und Debug** | game.js `talk` (§5f Gesten im Gespräch), `campaign`-Musterung, `bossIntro`, Debug „Geste abspielen“ |
| Blickrichtung | 4 Richtungen; im Kampf/Zielen folgt der Körper `e.aim`; `act(…, toward)` dreht kurz zum Ziel; sonst Laufrichtung. Kein Kopfdrehen | sprites.js `poseOf`; game.js `act` |
| Idle | 2-Bild-Atmen (`i0`/`i1`, 650 ms, Phase je Seed), Sitzen (`e.sitting`), Arbeit mit Werkzeug (`act.kind 'work'`, `WORK_FX`), Tragen (`e.carry`), Tagesablauf | sprites.js `poseOf`; game.js `villagerDay`, `workCycle`, `NPC_DAY` |
| Reaktion auf den Spieler | Wunden, Angst (`fearedBy`), Trauer (`S.mourn`), Kopfgeld, Rang, Titel, Beziehung, Ruf, Nacht — alles als Satz; Gesprächs-Gesten; Vampir-Stigma im Gruß | game.js `reactLine`, `reactTick`, `contextGreet`, `FEAR_GREET`, `PACT_GREET` |
| Reaktion auf Kampf | Zivilisten fliehen, Wachen greifen ein (`provoke`, `GUARDISH`, `raiseAlarm`, `calmDown`), Hilferufe Verletzter (Float „Hilfe!“), Läden schließen (`shopClosed`), Mächte unter sich + Kampfbericht im Log | game.js `provoke`, `raiseAlarm`, `updateNpc` |
| Reaktion auf Tod | Todesarten (anim.js `ANIM_DEFS.death`, 9 Arten), Grab mit Habe (`makeGrave`), Ort trauert 2 Tage (`S.mourn`, nur Sätze), Leichen erschrecken (Satz, `reactTick`), Gefährten-Moral (`partyReact`), Omega-Ende (Panik/Jubel), Varons Tod (Szene) | game.js `die`, `reactTick`, `reactLine` |
| NPC ↔ NPC | Freunde/Rivalen (`planRelations`, `rel.friend/rival/foe`), Gesprächspaare, Szenen, Feinde verschiedener Mächte kämpfen | game.js `startTalk`, `RIVAL_TALK`, `FRIEND_TALK`, `SCENES` |
| Gruppen | Stadtfest, Predigt, Musterung der Kette, Appell/Drill der Eisenfeste, Parade Aurelion, Streifen, Karawanen, Banden am Lagerfeuer, Flüchtlinge | game.js `festTick`, `ensureFortLife`, `aurelParade`, `sendPatrol`, Banden-System |
| Hervorheben | Eigene Merkmale benannter Figuren (`NAMED_LOOK`), Lehrer gelb auf der Karte, Fraktionsraute über verfeindeten Gegnern (`facPip`), Rollenzeichen der Toten (`roleBadge`), Auftragsraute über dem **Ziel** (`drawTrack`). **Kein Zeichen über Händlern, Lehrern, Auftraggebern in der Welt.** | sprites.js `NAMED_LOOK`; render.js `facPip`, `roleBadge`, `drawTrack` |
| Koop | `talk` steht in `HEAVY` (nicht im Delta) → Umgebungsblasen erscheinen beim Gast vermutlich nicht. `bubble()`-Einträge werden als gewöhnliche Floats gesendet (ohne `bubble`/`who`) → beim Gast steigen sie vermutlich als Text auf und verschwinden nach 0,9 s. **Im Spiel prüfen.** | coop.js `DYN`, `HEAVY`, Float-Versand (`fl`) |

**Kernbefund:** Die NPC-Welt hat viel Verhalten (Tagesablauf, Beziehungen, Trauer, Angst, Szenen), aber fast alles wird **als Satz** gezeigt. Körper, Haltung und Blick erzählen kaum etwas; vier fertige Gesten liegen ungenutzt.

---

## N1 Sprechblasen

**Problem:** Zwei verschiedene Blasen-Systeme mit zwei Schriften und Regeln (begrenzt/unbegrenzt). Jede Äußerung ist Text in gleicher Form — ein Schrei sieht aus wie ein Gruß. Ferne Blasen kosten Messen + Zeichnen, ohne dass man sie lesen muss. Laut DECISIONS (01.10.) reden einfache Bewohner nur noch in einer Blase — die Blase muss also mehr tragen als heute.
**Inspiration:** Darkest Dungeon (kurze Bark-Kästen mit Stimmung), RimWorld (Interaktionssymbole zwischen Pawns), Stardew Valley (Emote-Blasen mit Bild), WoW (Sagen vs. Schreien optisch verschieden), Kenshi (knappe Barks über dem Kopf).

| # | Variante | Kosten/Bild (Schätzung) | Bewertung für ROTFALL |
|---|---|---|---|
| 1 | **Eine Blase für alles:** `bubble()` und `e.talk` zeichnen dieselbe Pergamentblase, teilen Obergrenze und Ausweichen | ±0 (eine Funktion statt zwei) | Pflicht-Grundlage, behebt Inkonsistenz |
| 2 | **Tonfall-Form:** gezackter Rand = Ruf/Schrei, gestrichelt = Flüstern, Wolke = Gedanke, glatt = normal | +0,01 ms je Blase (einige fillRect mehr) | Sehr gut: zeigt Gefühl ohne mehr Text |
| 3 | **Symbolblase statt Satz** für einfache Bewohner: kleine Pixelzeichen (!, ?, Münze, Tropfen, Schädel, Herz, Zzz) | billiger als Text (kein `measureText`) | Sehr gut, passt zur Entscheidung „einfache Bewohner nur Blase“; Bedeutung muss eindeutig sein |
| 4 | **Entfernungsstufen:** nah = Satz, mittel = nur „…“-Blase, fern = nichts | spart Kosten bei Menschenmengen | Gut; deckt sich mit Leistungsziel |
| 5 | Schreibmaschine: Buchstaben laufen ein, bei Angst zittert die Schrift | +0,02–0,05 ms je Blase | Wirkt hektisch, VISUAL.md will „gezielt, nicht hektisch“ — nur für Szenen |
| 6 | Bark-Leiste am Bildrand (Darkest-Dungeon-Stil) | DOM, gering | Schlecht: verschiebt Text vom Ort weg, mehr Lesen |
| 7 | **Lautstärke = Größe:** Ruf größer und heller, Murmeln klein und grau | ±0 | Gut, ergänzt 2 billig |
| 8 | Sprecher-Kennung: Fraktionsfarbe/Wappenpunkt am Blasenrand | +0,005 ms | Mittel; nützlich in Szenen mit vielen Sprechern |
| 9 | Gesprächsfaden: Zipfel/Linie zwischen zwei Sprechenden eines Paares | +0,01 ms | Unruhig in vollen Städten; nur bei Szenen |
| 10 | Klangsignal je Tonfall (Murmeln, Ruf) statt Text, wenn fern | sfx-Aufruf, kein Zeichnen | Mittel; Klang-System (`sfx`, `earVol`) ist da, aber Dauerton nervt |

**Bewertung:** 1 ist Voraussetzung. 2 + 3 + 4 + 7 tragen den Großteil („verstehen ohne Absatz“) und sparen sogar Leistung. 5, 6, 9 passen nicht (hektisch, mehr Text, Unruhe). 8 nur in Szenen.
**Wahl:** **1 + 2 + 3 + 4 + 7**, 8 nur in Kamerafahrten.

**FEATURE IMPACT REPORT N1**
- Betroffene Systeme: render.js `drawBubbles`, `drawBubble`, `drawFloats`; game.js `bubble`, `startTalk`, `reactLine`, `reactTick`, `ambientTick`, `SCENES`, Regie (`cinematic` beats `say`); coop.js `HEAVY`/`DYN`/Float-Versand; Debug „Regie (T17) → Sprechblase“.
- Vorhanden: beide Blasen, Obergrenze 4, Ausweichen, Dach-Verdeckung, Tonfall implizit im Satz.
- Fehlt: gemeinsames Datenformat mit Feld für Ton/Symbol (z. B. `tone`, `icon`) — **Datenfeld, keine Regel**; Symbolsatz (Pixel 5×5 wie `ROLE_GLYPH`); Zuordnung Satz→Ton an jeder Quelle; Koop-Übertragung.
- Persistenz: keine (`S.floats` steht in `SKIP`, `talk` ist flüchtig).
- Risiken: (a) Koop-Gäste sehen heute vermutlich keine Umgebungsblasen — beim Vereinheitlichen mitlösen; (b) Symbolbedeutungen falsch geraten → Spieler liest Falsches; (c) Obergrenze 4 verschluckt Regie-Blasen, wenn beide Systeme zusammenlaufen (Regie braucht Vorrang).
- Plan in Scheiben: S1 Vereinheitlichen (Format, eine Zeichnung, Vorrang Regie > Spieler-Reaktion > Umgebung, Koop-Feld) · S2 Tonfall-Formen + Größe · S3 Symbolblasen und Entfernungsstufen · S4 Debug („Blase: Ton/Symbol vorführen“), MECHANIKEN-Eintrag, Hinweis im Log beim ersten Symbol.

**OFFENE DESIGNENTSCHEIDUNGEN N1**
1. Welche Figuren bekommen Satz, welche nur Symbol? Empfehlung: Symbol für einfache Bewohner (passt zu DECISIONS 01.10.), Satz für gesprächige Rollen und in Nähe.
2. Symbolsatz und Bedeutung (z. B. „!“ = erschrocken, „?“ = verwirrt, Münze = will handeln). Empfehlung: höchstens 8 Zeichen, im Kodex erklärt.
3. Schrift: Cinzel (Umgebung) oder Spectral kursiv (Regie) als gemeinsame? Empfehlung: Spectral für Sätze, Cinzel nur für Namenskarten.

---

## N2 Gesten

**Problem:** Sieben fertige Gesten, aber nur „zeigen“ und „salutieren“ laufen in der offenen Welt. Trauer, Jubel und Knien gibt es nur in Kamerafahrten. Die Reaktionen, die schon existieren (Trauer im Ort, Fest, Rang), werden als Satz statt als Körper gezeigt.
**Inspiration:** FFXIV/GW2 (Emotes als Körpersprache), Stardew (kurze Reaktionsanimation), RimWorld (Stimmung an Haltung), Kenshi (Figuren hocken, sitzen, halten Wunden).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Vorhandene Gesten an vorhandene Anlässe binden:** Trauer (`S.mourn`) → trauern, Fest → jubeln, Rang/Wache → salutieren, Altar/Priester → knien, Angst → abwehren | ±0 (Bilder gecacht, `act` je Anlass) | Beste Wirkung je Aufwand; keine neue Regel |
| 2 | Neue kleine Gesten: winken, Kopfschütteln, Arme verschränken, Hände ringen, Faust ballen | Cache: +5 Posen × Specs | Gut, aber Frame-Cache wächst; später |
| 3 | Gestenketten (zeigen → achsel → abwehren) für kleine Szenen | ±0 | Gut für `SCENES` |
| 4 | Geste ersetzt Gesprächsantwort (Ablehnung = abwehren statt Satz) | ±0 | Gehört zu Dialogen (Analyst A) — Schnittstelle |
| 5 | Prop-Gesten: Krug heben, Hut ziehen (über `e.carry`/Werkzeug) | gering | Hübsch, mittlere Priorität |
| 6 | Ganzkörper-Effekt ohne neue Bilder: Zusammenzucken (1-px-Versatz), Hüpfen bei Jubel | sehr gering | Gut als billige Verstärkung |
| 7 | Gesten-Partikel: Tränenpixel, Zornwölkchen, Notenzeichen | `fx`, gedeckelt (FX_CAP 900) | Mittel; nur sparsam |
| 8 | **Gesten nach Charakterzug** (`traits`: furchtsam zittert, stolz verschränkt) | ±0 | Gut für Vielfalt (Nutzer-Dauerauftrag Vielfalt) |
| 9 | **Gruppengeste versetzt** (Menge jubelt wie eine Welle, je Figur 60–150 ms später) | ±0 | Sehr gut für Feste, Turnier, Omega-Ende |
| 10 | Spieler-Emote-Rad, NPCs antworten | neue Steuerung | Neue Mechanik → offene Entscheidung |

**Wahl:** **1 + 6 + 8 + 9** jetzt; **3** für Szenen; **2** als spätere Scheibe; 10 nur nach Entscheidung.

**FEATURE IMPACT REPORT N2**
- Betroffene Systeme: game.js `gesture`, `act`, `reactTick`, `ambientTick`, `festTick`, `SCENES`, `partyReact`, Omega-Ende-Reaktionen; sprites.js `poseOf`; fig5 rig (Mischposen); anim.js `ANIM_DEFS.gesture`; coop.js (`act` ist in `DYN` → Gesten kommen beim Gast an).
- Vorhanden: 7 Gesten, Auslöser-Daten (Trauer, Fest, Rang, Angst, Glaube).
- Fehlt: Zuordnung Anlass → Geste; Regel „nicht mitten in Arbeit/Laufen unterbrechen“ (poseOf zeigt `act` nur im Stand — passt); Zeitversatz für Gruppen.
- Persistenz: keine (`act` flüchtig).
- Risiken: Gesten im Laufen werden von `poseOf` ignoriert (nur im Stand) — Figuren müssen kurz stehen bleiben, das ändert Tagesablauf-Timing minimal; keine RNG-Aufrufe aus `rnd()` dafür verwenden (Zufall für Darstellung über `vrnd`, sonst kippen Proben).
- Plan: S1 Zuordnung 1 (Trauer, Fest, Rang, Altar, Angst) · S2 Charakterzüge + Wellen · S3 Gestenketten in Szenen · S4 neue Gesten (2) · Debug „Gesten-Anlässe auslösen“, MECHANIKEN.

**OFFENE DESIGNENTSCHEIDUNGEN N2**
1. Sollen arbeitende NPCs für eine Geste unterbrechen? Empfehlung: nein, nur Stehende/Gehende auf dem Platz.
2. Spieler-Emotes (Variante 10) überhaupt? Empfehlung: später, eigener Vorschlag.

---

## N3 Blickrichtung

**Problem:** Außerhalb des Kampfes schauen NPCs in Laufrichtung. Wer angesprochen wird, dreht sich nur über die Gesprächsgeste; Gesprächspaare schauen nicht zueinander; eine Menge sieht ein Feuer oder eine Leiche nicht an.
**Inspiration:** Skyrim/Kenshi (Kopf folgt dem Spieler), Stardew (Zuwenden beim Ansprechen), Zelda (Blick lenkt Aufmerksamkeit des Spielers).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Zuwenden beim Ansprechen** (ganzer Körper, 4 Richtungen) | ±0 | Pflicht |
| 2 | **Gesprächspartner schauen einander an** (`startTalk` setzt Richtung) | ±0 | Sehr gut, billig |
| 3 | Neugier: Wer nahe am Spieler steht, dreht sich kurz zu ihm (ereignisgetrieben aus `reactTick`, nicht je Bild) | ±0 | Gut |
| 4 | Kopf-Drehbild (nur Kopf 1–2 px seitlich) | Cache: neue Teilposen | Schön, aber fig5-Aufwand + Cache |
| 5 | Nur Augenpixel verschieben | Cache je Blickrichtung | Bei 40×56-Rahmen kaum sichtbar |
| 6 | Wachen behalten einen bewaffneten Fremden im Blick | ±0 | Gut — **aber** darf nicht wie Entdeckung wirken, wenn es keine Regel dazu gibt |
| 7 | **Blickziel-Feld mit Ablauf** (`look = {x,y,until}`): Menge schaut auf Brand, Kampf, Leiche, Prediger | ±0 (einmal setzen) | Sehr gut, eine Mechanik für 1–3 und 7–10 |
| 8 | Abwenden bei Abneigung (Beziehung/Ruf schlecht) | ±0 | Gut, zeigt Ruf ohne Text |
| 9 | Sichtbarer Blickkegel für Wachen (wie Automaten-Kegel `e.cone`) | +0,02 ms je Wache | Nur sinnvoll mit Schleich-Regel (fehlt) → nein |
| 10 | Händler schauen zum Kunden am Stand | ±0 | Teil von 7 |

**Wahl:** **7 als Grundlage** (ein Feld, flüchtig), damit **1 + 2 + 3 + 8 + 10**; 6 nur als Darstellung ohne Folgen; 4/5/9 nein.

**FEATURE IMPACT REPORT N3**
- Betroffene Systeme: sprites.js `poseOf` (Richtung im Stand aus Blickziel); game.js `talk`, `startTalk`, `reactTick`, `startFire`/Brand, `die` (Leiche), `SCENES`; coop.js (`facing` ist in `DYN` — wenn Blick über `facing` läuft, kommt er beim Gast an; ein eigenes Feld müsste ergänzt werden).
- Vorhanden: `facing`, `aim`, `act(…, toward)`.
- Fehlt: Blickziel mit Ablauf; Vorrang (Kampf > Gespräch > Blickziel > Laufrichtung).
- Persistenz: keine; Feld flüchtig halten (nicht speichern → `SKIP` oder Zeitstempel).
- Risiken: `poseOf` ist heißer Pfad (jede Figur, jedes Bild) — nur ein Feldvergleich erlaubt; Figuren, die laufen, dürfen nicht rückwärts „schauen“ (Beine laufen sonst falsch).
- Plan: S1 Feld + Vorrang + Ansprechen/Paare · S2 Ereignisse (Brand, Leiche, Kampf, Predigt) · S3 Abneigung · Debug „Blickziel hier setzen“.

**OFFENE DESIGNENTSCHEIDUNGEN N3**
1. Soll ein Wachenblick irgendetwas bedeuten (Entdeckung, Schleichen)? Ohne Schleich-System: Empfehlung nein, reine Darstellung.

---

## N4 Idle

**Problem:** Alle stehenden Figuren atmen im gleichen 2-Bild-Takt. Beruf, Wetter, Wunden und Stimmung der Stadt zeigen sich im Stand nicht.
**Inspiration:** Stardew (Berufs-Idles), Octopath (lebendige Kleinbewegung), Darkest Dungeon (Idle zeigt Zustand), RimWorld (Stimmung), Kenshi (Verwundete halten sich).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Seltene Berufs-Idles** als kurze `act`-Stöße: Schmied wischt Stirn, Wache stützt sich, Händler zählt (über vorhandene Posen `trade`, `kneel`, Gesten) | ±0 | Gut, nutzt Vorhandenes |
| 2 | Zufällige Geste alle N Sekunden | ±0 | Ohne Anlass beliebig — schwächer als 1 |
| 3 | Dritte Atem-Pose `i2` (Gewicht verlagern) | Cache +1 Pose | Gut, aber fig5-Arbeit |
| 4 | Wetter-Idle: Regen → geduckt/Kapuze, Kälte → Arme reiben | Cache +1–2 Posen | Gut; Wetter wirkt bereits (C.12) |
| 5 | Abends gähnen, Schenke schwanken (Rausch gibt es) | ±0/+1 Pose | Mittel |
| 6 | **Wunden-Idle:** NPC mit beschädigtem Rumpf/Glied hält die Seite; mit Beinschaden steht er schief | +1 Pose | Sehr gut: Kenshi-Gefühl, Körpersystem (`body.js`) ist da |
| 7 | Pfeifenrauch, Krug, Stricknadeln als Kleinst-Props | `fx`, gering | Hübsch, später |
| 8 | Tier-Idle (Hund kratzt, Pferd scharrt) | `beastFrame` + Pose | Mittel |
| 9 | Kleine Schritte hin und her | Wegfindung je Figur | Nein: kostet Update-Zeit (PERF-U) |
| 10 | **Stimmungs-Idle der Stadt:** Trauer → gesenkte Köpfe (trauern), Fest → wippen, Angst/schutzlos → umsehen | ±0 | Sehr gut: Stadtzustand (`S.mourn`, Fest, schutzlos, belagert) sichtbar |

**Wahl:** **1 + 6 + 10** (alles aus vorhandenen Daten); 3/4 als spätere Bild-Scheibe; 9 nein.

**FEATURE IMPACT REPORT N4**
- Betroffene Systeme: sprites.js `poseOf`; game.js `villagerDay`, `workCycle`, `ambientTick`, Stadtzustände (`S.mourn`, `festNow`, Stadt ohne Schutz, Belagerung); body.js (Gliederzustand); fig5 (neue Posen bei 3/4/6).
- Vorhanden: `act`, Posen `trade`/`kneel`/`sit`/`work`, Körperteile, Stadtzustände.
- Fehlt: Tabelle Beruf → Idle-Stoß; Pose „Seite halten“ (fig5); Anlass-Takt (wie oft).
- Persistenz: keine.
- Risiken: Frame-Cache (`SPEC_KEYS` × Posen) — neue Posen nur über vorhandene Rig-Mischung; Taktung über `vrnd`, nicht `rnd`.
- Plan: S1 Stimmungs-Idle (10) mit vorhandenen Gesten · S2 Berufs-Stöße (1) · S3 Wunden-Pose (6, fig5) · S4 Wetter-Posen (4) · Debug „Idle-Stimmung: Trauer/Fest/Angst hier“.

**OFFENE DESIGNENTSCHEIDUNGEN N4**
1. Wie oft ein Berufs-Idle kommt — reine Darstellung, aber spürbar. Empfehlung: selten genug, dass es auffällt (Abstimmung im Spiel, kein Regelwert).

---

## N5 Reaktionen auf den Spieler

**Problem:** `reactLine` erkennt viel (Wunden, Angst, Trauer, Kopfgeld, Rang, Titel, Beziehung, Ruf, Nacht) — gezeigt wird ein Satz. Rang wird gegrüßt, aber niemand salutiert; Angst wird gesagt, aber niemand weicht zurück.
**Inspiration:** Mount & Blade (Leute grüßen den Lord), Kenshi (Angst = Abstand), Fable (Verbeugen/Ausbuhen je Ruf), Darkest Dungeon (Haltung zeigt Gefühl).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Geste + Symbol statt Satz** für jede vorhandene `reactLine`-Bedingung (Kopfgeld → zeigen + „!“, Rang → salutieren, Angst → abwehren, Wunde → zeigen auf dich + Tropfen) | ±0 | Sehr gut, keine neue Regel |
| 2 | Zurückweichen/Platz machen bei Angst (kurzer Schritt weg) | Update gering | Gut; Angst-Zustand existiert (`fearedBy`, `afraid`) |
| 3 | Läden: Fensterladen/Theke sichtbar zu (`shopClosed`) | Haus-Cache-Variante | Gut, gehört auch zu Städten (Prio 10) |
| 4 | Kinder laufen bei Ruhm hinterher | neues Verhalten | Neue Mechanik → offen |
| 5 | **Verbeugen/Knien** vor hohem Rang oder Adel des Spielers | ±0 (Geste knien) | Gut, wenn Bedingung schon besteht (Rang ≥ 1 der Macht ist da) |
| 6 | **Tuscheln:** zwei Bewohner stecken die Köpfe zusammen, Blick auf dich (Kopfgeld, Vampir-Stigma, Ruhm) | ±0 | Sehr gut, Kenshi/Fable-Gefühl |
| 7 | **Wache legt Hand an die Waffe** (Deckungs-/Ansage-Pose) bei Kopfgeld | ±0 | Sehr gut; ersetzt „Ein falscher Schritt, und du sitzt.“ |
| 8 | Abwenden/Ausspucken bei Verhasst/Beziehung ≤ −30 | ±0/+1 Pose | Gut |
| 9 | Ruf-Schimmer am Boden um den Spieler | +0,01 ms | UI-haft, nicht diegetisch → nein |
| 10 | Namensruf: „!“-Blase und Name bei Freunden (Beziehung ≥ 30) | ±0 | Gut, kombiniert mit N1 |

**Wahl:** **1 + 5 + 6 + 7 + 8 + 10**, 2 als kleine Verhaltensscheibe; 4 offen; 9 nein.

**FEATURE IMPACT REPORT N5**
- Betroffene Systeme: game.js `reactLine`, `reactTick`, `contextGreet`, `fearedBy`, `bountyTotal`, `rankName`, Vampir-Stigma (`stigma`-Prüfungen), `talk` (Gesprächs-Gesten); render.js (Blasen); sprites.js `poseOf`.
- Vorhanden: alle Bedingungen; Grußsätze; Gesprächsgesten.
- Fehlt: Abbildung Bedingung → Geste/Symbol; Paar-Tuscheln (zwei NPCs, Blickziel N3).
- Persistenz: keine (`reactAt` flüchtig).
- Risiken: `reactLine` nutzt `pick`/`chance` (Spiel-RNG) — bestehende Proben hängen evtl. daran; neue Darstellungen nicht mit `rnd` würfeln. Koop: Gast sieht `talk` nicht (N1).
- Plan: S1 Bedingung → Geste/Symbol (1, 5, 7, 8, 10) · S2 Tuscheln (6) · S3 Zurückweichen (2) · Debug „Reaktion erzwingen: Kopfgeld/Rang/Angst/Freund“.

**OFFENE DESIGNENTSCHEIDUNGEN N5**
1. Ab welchem Rang knien/verbeugen Leute? Kein bestehender Wert. Empfehlung: an vorhandene Schwellen hängen (Ritter-Rang / Adelstitel), nicht neu erfinden — Entwickler bestätigt.
2. Kinder folgen bei Ruhm (Variante 4)? Empfehlung: nicht jetzt.

---

## N6 Reaktionen auf Kampf

**Problem:** Wer flieht, rennt einfach. Niemand duckt sich, keiner schreit sichtbar, Wachen rufen nicht, Zuschauer gibt es nicht. Hilferufe sind Text-Floats.
**Inspiration:** RDR2/Kenshi (Panik, Ducken, Rufen), Mount & Blade (Dorfleute fliehen in Häuser), Darkest Dungeon (Angst-Barks).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Kauern:** Wer nicht fliehen kann (eingeschlossen, gefesselt, Kind), duckt sich (knien + abwehren) | ±0 | Sehr gut |
| 2 | Zuschauerring bei Faustkampf/Duell (`ambDuel`, Schenkenkampf) mit Jubel | ±0 | Gut |
| 3 | **Schreck-Zeichen** („!“-Symbolblase) eine halbe Sekunde vor der Flucht | ±0 | Sehr gut, liest sich sofort |
| 4 | Flucht in Häuser, Türen zu (Stadt ohne Schutz kennt „versteckt sich im Haus“) | Update | Gut, Logik teils da |
| 5 | **Wachenruf:** gezackte Blase „Wache!“ + Horn/Pfiff-Klang + kurzer Ring | ±0 | Sehr gut; `raiseAlarm` existiert |
| 6 | Miliz hebt Werkzeug (Werkzeug-Pose der Arbeit) | ±0 | Gut |
| 7 | Staubwolken beim Rennen | `fx` gedeckelt | Mittel |
| 8 | Tiere fliehen, Hunde bellen | `sfx growl` | Mittel |
| 9 | Hilferuf als Schrei-Blase statt „Hilfe!“-Float | ±0 | Gut (N1-Ton) |
| 10 | Nachher: Gaffen an der Leiche (Blickziel N3) + trauern | ±0 | Sehr gut, verbindet mit N7 |

**Wahl:** **1 + 3 + 5 + 9 + 10**, 2 und 6 in Szenen-Scheibe; 4 nur, wo die Logik schon existiert.

**FEATURE IMPACT REPORT N6**
- Betroffene Systeme: game.js `provoke`, `raiseAlarm`, `calmDown`, `updateNpc` (Flucht), Hilferuf-Logik (Float „Hilfe!“), `ambDuel`, Schenken-Faustkampf, Stadt ohne Schutz; sfx.js (`shout`, `horn`, `whistle` vorhanden).
- Vorhanden: Flucht, Alarm, Wachen, Hilferufe, Kampfbericht.
- Fehlt: Kauer-Zustand als Darstellung; Ruf-Blase; Zuschauer-Anordnung.
- Persistenz: keine.
- Risiken: Kauern darf keine neue Spielregel werden (z. B. „Kauernde werden nicht getroffen“) — reine Pose; Fluchtwege nicht ändern (PERF-U arbeitet in `updateNpc`).
- Plan: S1 Schreck-Zeichen + Wachenruf + Schrei-Blase · S2 Kauern · S3 Gaffen/Trauer nach Kampf · S4 Zuschauer · Debug „Kampf in der Stadt simulieren (nur Reaktionen)“.

**OFFENE DESIGNENTSCHEIDUNGEN N6**
1. Wer kauert statt zu fliehen? Empfehlung: nur wer heute schon nicht flieht (gefesselt, gefangen, Kinder) — keine neue Gruppe.

---

## N7 Reaktionen auf Tod

**Problem:** Der Tod einer Figur hat Gewicht im System (Grab, Nachfolger, Trauer 2 Tage, Witwe E3) — sichtbar ist das nur im Satz „X ist tot. Ich kann es nicht glauben.“
**Inspiration:** RimWorld (Trauer, Gräber, Stimmung), Kenshi (Leichen bleiben, Gruppen reagieren), Darkest Dungeon (Verlust spürbar), Mount & Blade (Banner, Begräbnisse in Mods).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Trauernde am Grab:** Freund/Ehepartner (`rel.friend`, Ehe) steht während `S.mourn` am Grab, Geste trauern | Update: einmal je Tag Ziel setzen | Sehr gut |
| 2 | **Kerzen/Blumen am Grab** solange `S.mourn` gilt | Prop-Zeichnung gecacht | Sehr gut, billig |
| 3 | Schwarzes Band an Bewohnern | Spec-Feld → Frame-Cache wächst | Nein (Cache) |
| 4 | **Einzelner Glockenschlag** beim Tod einer benannten Person in Hörweite (`sfx bell` existiert) | ±0 | Gut |
| 5 | Leichenzug mit Trägern | neues Verhalten, teuer | Später/offen |
| 6 | **Gefährte kniet** bei einem gefallenen Gefährten (`partyReact`) | ±0 | Sehr gut, emotional |
| 7 | Witwe trauernd vor dem Haus (E3 Groll) | ±0 | Gut; zeigt Groll ohne Text |
| 8 | Halbmast-Fahne in der Stadt | Prop-Zustand | Mittel |
| 9 | Krähen über Leichen in der Wildnis | `drawAmbience` | Gut, Stimmung |
| 10 | Kurze Stille im Umgebungsklang | `ambience` | Mittel |

**Wahl:** **1 + 2 + 4 + 6 + 7**, 9 als Stimmungsdetail; 3 und 5 nein/später.

**FEATURE IMPACT REPORT N7**
- Betroffene Systeme: game.js `die`, `makeGrave`, `S.mourn`, `partyReact`, E3-Groll (`grudge`-Funktionen), `successorDay`; render.js `drawGrave`/`drawGraveVec`, `drawAmbience`; sfx.js `bell`.
- Vorhanden: Gräber, Trauer-Daten (Ort + Dauer), Beziehungen, Glocke, Witwen-Logik.
- Fehlt: Grab-Schmuck als Zeichnungszustand; Trauer-Gang zum Grab im Tagesablauf.
- Persistenz: `S.mourn` ist gespeichert; Schmuck daraus ableiten, **nichts Neues speichern**.
- Risiken: Gräber werden gebacken (`drawBaked`) — Schmuck als eigener kleiner Aufsatz, sonst Cache-Schlüssel ändern; Tagesablauf-Ziel darf Arbeit/Wirtschaft nicht merklich stören (Arbeiter zählen in der Wirtschaft).
- Plan: S1 Schmuck + Glocke · S2 Gefährte kniet · S3 Trauernde am Grab · S4 Witwe · Debug „Trauer im Ort auslösen“.

**OFFENE DESIGNENTSCHEIDUNGEN N7**
1. Gehen Trauernde in ihrer Arbeitszeit zum Grab (Wirtschaft verliert Stunden)? Empfehlung: nur in der Freizeit (abends), damit die Wirtschaft unberührt bleibt.

---

## N8 Reaktionen auf andere NPCs

**Problem:** Freundschaft, Rivalität, Ehe und Feindschaft der Mächte stehen im Spielstand und in Sätzen — zwei Freunde, die sich begegnen, zeigen nichts.
**Inspiration:** The Sims/RimWorld (Beziehungssymbole), Stardew (Paare gehen zusammen), Kenshi (Fraktionen gehen aufeinander los).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Begrüßungsgeste** bei Freunden (zeigen/jubeln kurz) | ±0 | Sehr gut |
| 2 | **Rivalen wenden sich ab**, Faust/abwehren | ±0 | Sehr gut |
| 3 | Eheleute gehen nebeneinander | Wegfindung | Teuer (PERF-U) → später |
| 4 | Herz/Blitz-Symbol in der Paarblase (N1-3) | ±0 | Gut |
| 5 | **Handels-Pose** zwischen Käufer und Händler am Markt (`marketBuy`, Pose `trade`) | ±0 | Sehr gut, zeigt Wirtschaft |
| 6 | Kinder spielen Fangen | Verhalten | Später |
| 7 | **Wachen salutieren einander** beim Wechsel/Begegnen | ±0 | Gut |
| 8 | Gesprächskreise aus 3–4 | Paarlogik umbauen | Später |
| 9 | Streit eskaliert sichtbar (abwehren → Schubs-Pose `kb` → `ambDuel`) | ±0 | Gut für Szenen |
| 10 | Gerüchte wandern als Flüster-Symbol von NPC zu NPC | ±0 | Schön, zeigt `gossip` |

**Wahl:** **1 + 2 + 5 + 7**, 4 und 10 mit N1; 9 in Szenen; 3/6/8 später.

**FEATURE IMPACT REPORT N8**
- Betroffene Systeme: game.js `startTalk`, `planRelations`, `marketBuy`, `ambDuel`, `gossip`/`newsTalk`, Wachen-Schichten (`GUARD_POSTS`); sprites.js `poseOf` (`trade`).
- Vorhanden: Beziehungen, Paare, Markt-Einkauf, Wachen.
- Fehlt: Begegnungs-Erkennung (nur dort, wo schon Paare gesucht werden — `startTalk` sucht Nachbarn bereits).
- Persistenz: keine.
- Risiken: Begegnungsprüfung nicht je Bild über alle `VILLAGERS` (heute schon gedrosselt — darin bleiben).
- Plan: S1 Gruß/Abwenden in `startTalk` · S2 Handels-Pose · S3 Wachen · S4 Flüstern/Eskalation.

**OFFENE DESIGNENTSCHEIDUNGEN N8** — keine neue; alles aus bestehenden Beziehungen.

---

## N9 Gruppenverhalten

**Problem:** Gruppen entstehen (Fest, Predigt, Banden, Streifen), wirken aber wie lose Haufen. Eine Bande am Feuer reagiert nicht sichtbar, wenn man kommt.
**Inspiration:** Mount & Blade (Formationen, Lager), Kenshi (Trupps), Total War (Formation als Lesbarkeit), Witcher (Lagerfeuer-Gruppen).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | Zweierreihe für Streifen | Wegpunkte je Glied | Mittel (PERF-U) |
| 2 | **Lagerfeuerkreis:** Banden sitzen ums Feuer, stehen auf und greifen zur Waffe, wenn du nahe kommst | ±0 (sitzen + Geste) | Sehr gut, Banden-System existiert |
| 3 | **Halbkreis um Ereignis** (Predigt, Hinrichtung, Turnier, Auspeitschung) | Platzierung einmal | Sehr gut |
| 4 | Anführer zeigt, Gruppe setzt sich in Bewegung | ±0 | Gut |
| 5 | Synchrone Rufe (jubeln als Welle, N2-9) | ±0 | Gut |
| 6 | **Gleicher Marschtakt** (gemeinsame Laufphase statt Seed-Phase) | ±0 | Sehr gut, billig, wirkt diszipliniert (Kette, Legion, Garde) |
| 7 | **Warnkette:** einer entdeckt dich, „!“ springt durch die Gruppe | ±0 | Sehr gut, liest sich |
| 8 | Arbeitstrupps im Takt | ±0 | Gut (Eisenfeste-Drill) |
| 9 | Flüchtlingszüge mit Bündeln (`carry`) | ±0 | Gut |
| 10 | Trauerzug | Verhalten | Später |

**Wahl:** **2 + 3 + 6 + 7**, 4/5/8/9 als Ergänzung; 1/10 später.

**FEATURE IMPACT REPORT N9**
- Betroffene Systeme: Banden-System (Lager, Unterhändler), `SCENES`, Eisenfeste (`ensureFortLife`, Appell/Drill/Auspeitschung), `aurelParade`, `sendPatrol`, Flüchtlinge (`refugeeWave`, `ensureRefugees`), sprites.js `poseOf` (Laufphase), Aggro-Logik (`updateEnemy`/`think`).
- Vorhanden: alle Gruppen; Sitzen; Gesten.
- Fehlt: Sitzplätze am Bandenfeuer; Platzierung im Halbkreis; gemeinsame Laufphase; Warnketten-Darstellung.
- Persistenz: keine (Banden sind gespeichert, Sitzen nicht).
- Risiken: **Warnkette darf die Aggro-Regel nicht ändern** (wer dich bemerkt, steht schon in `think`) — nur zeigen, was ohnehin passiert. Sitzende Banditen: Aufstehzeit darf keinen Kampfvorteil schaffen, sonst ist es eine neue Regel.
- Plan: S1 Marschtakt + Warnkette · S2 Halbkreis · S3 Lagerfeuerkreis · Debug „Bande: am Feuer sitzen“.

**OFFENE DESIGNENTSCHEIDUNGEN N9**
1. Sitzende Banden am Feuer: Sind sie dann langsamer kampfbereit (Vorteil für Überfall)? Empfehlung: nein, Aufstehen gleichzeitig mit der heutigen Aggro, reine Darstellung.

---

## N10 Wichtige NPCs, Händler, Questgeber hervorheben

**Problem:** In der Welt sieht man nicht, wer handelt, lehrt, heilt oder einen Auftrag hat. Benannte Figuren sind am Aussehen erkennbar (`NAMED_LOOK`), Lehrer nur auf der Karte. Man muss jeden ansprechen.
**Inspiration:** WoW (Symbole über Köpfen), Diablo (Umriss beim Hover), Stardew (Schilder an Läden), Kenshi (Ladentheken, kein Symbol), GW2 (Symbole nur in Nähe).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | Kopfsymbole: Münze = Händler, Amboss = Schmied, Buch = Lehrer, Kreuz = Heiler; „!“ = Auftrag (Schnittstelle Prio 2) | +0,005 ms je Zeichen | Klar, aber schnell „MMO-bunt“ |
| 2 | **Diegetische Zunftzeichen** an Haus/Stand (Hängeschild mit Bild) | Haus-Cache | Sehr gut, passt zum dunklen Stil; deckt aber Wanderhändler nicht |
| 3 | **Nur-nah:** Symbol erscheint erst in Nähe oder unter der Maus | ±0 | Sehr gut, hält das Bild ruhig |
| 4 | **Umriss beim Überfahren** (Diablo) | Umriss-Bild je Frame → Cache ×2 | Gut, aber Kosten prüfen; evtl. nur heller Schatten |
| 5 | Laterne am Stand nachts | `lightOf` | Gut, Stimmung |
| 6 | Werkzeug in der Hand als Berufszeichen (gibt es teils) | ±0 | Gut, schon vorhanden ausbauen |
| 7 | Bodenmatte/Teppich am Platz des Händlers | Prop | Mittel |
| 8 | Namensschild beim Überfahren | Text | Mehr Text — nur Name, kein Satz |
| 9 | Nur Karte/Kodex (heute) | 0 | Zu wenig |
| 10 | **Winken:** NPC mit Dienst winkt, wenn du nahe kommst | ±0 | Gut, diegetisch, ergänzt 3 |

**Wahl:** **3 + 1 (kleine Pixelzeichen im Stil `ROLE_GLYPH`, nur nah) + 10 + 2 (Läden, eigene Scheibe)**; 4 nur nach Messung.

**FEATURE IMPACT REPORT N10**
- Betroffene Systeme: render.js (neben `facPip`/`roleBadge` ein Dienstzeichen), game.js `npcOffers`/Dienst-Erkennung (`shop`, `smith`, `teaches`, Heiler), Questgeber-Logik (Prio 2), buildings.js/`HOUSES` (Schilder), DECISIONS „weniger Gesprächspartner“ (wer hat einen Dienst).
- Vorhanden: Dienst-Felder an Figuren, `NAMED_LOOK`, Kartenmarken, Zeichen-Technik (`ROLE_GLYPH`).
- Fehlt: Zuordnung Dienst → Zeichen; Nähe-Regel; gemeinsamer Kopf-Platz mit Fraktionsraute, Rollenzeichen und Quest-Zeichen (sonst stapeln sich drei Zeichen).
- Persistenz: keine.
- Risiken: Auf „Sehr schwer“ gibt es bei Bewohner-Aufträgen absichtlich weder Namen noch Wegpunkt — ein „!“ würde das aushebeln; Kopf-Platz-Konflikt mit Prio 2 (Analyst A) und `facPip`.
- Plan: S1 gemeinsamer Kopf-Platz (Vorrang: Gefahr > Auftrag > Dienst) — mit Analyst A abstimmen · S2 Dienstzeichen nur nah + Winken · S3 Zunftschilder · Debug „Dienstzeichen an/aus“, Kodex-Erklärung.

**OFFENE DESIGNENTSCHEIDUNGEN N10**
1. Zeichen für Dienste ja oder nur diegetisch (Schilder, Winken)? Empfehlung: kleine Zeichen nur in Nähe + Schilder.
2. Auftrags-Zeichen auf „Sehr schwer“? Empfehlung: nein (bestehende Regel „kein Name, kein Wegpunkt“ gilt weiter), Dienstzeichen ja.
3. Einstellung zum Abschalten? Empfehlung: ja, unter Einstellungen, Standard an.

---

## Gesamtplan NPC (Scheiben)
1. **Fundament:** einheitliche Blase (N1-S1), Blickziel-Feld (N3-S1), gemeinsamer Kopf-Platz (N10-S1, mit A). Koop-Übertragung der Blasen klären.
2. **Vorhandenes zeigen:** Gesten an Anlässe (N2), Reaktionen als Geste/Symbol (N5), Schreck/Ruf (N6), Stimmungs-Idle (N4).
3. **Tod und Beziehung:** Grab-Schmuck, Glocke, kniender Gefährte (N7), Gruß/Abwenden/Handel (N8).
4. **Gruppen:** Marschtakt, Warnkette, Halbkreis, Lagerfeuer (N9).
5. **Bild-Scheibe fig5:** neue Posen (Seite halten, Wetter, neue Gesten) — erst nach Cache-Messung.
Jede Scheibe: Debug-Eintrag, MECHANIKEN-Zeile, Hinweis im Spiel (Log/Kodex), Probe, Messung mit `ROTFALL_STATE/perf/bench.js`.

**STATUS: TEILWEISE DEFINIERT** — umsetzbar ohne Entscheidung: N1-S1, N2-S1, N3, N6-S1, N7-S1, N8-S1, N9-S1. Wartet auf Entscheidung: Symbolsatz (N1), Kopfzeichen (N10), Knie-Schwelle (N5).
