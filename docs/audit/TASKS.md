# Aufgabenliste für den Engineer (Agent 2) — Stand 01.10.2026

Quelle: `MASTER_REPORT.md` (Kürzel A = Teil A, V = Teil B, D = Teil C, §5g = PLAN_ROADMAP). Reihenfolge = empfohlene Bauordnung. Nach jeder Aufgabe prüft der Hunter (Agent 1); Status in `STATUS.md`.

## Gilt für jede Aufgabe (Definition of Done)

- Neue Probe(n) in `selftest()` mit `sandbox()`/`stage()`/`actor()`; frisch geladen **alle** Proben grün. Ändert eine Aufgabe fremde Probenergebnisse, erst Zwischenwerte loggen, dann entscheiden (Regel „Probes and RNG“).
- Debug-Eintrag in `debugSections()`, In-Game-Hinweis (Log, Toast, Tooltip oder Dialog), Eintrag in `docs/MECHANIKEN.md`, eine Zeile in `docs/CHANGELOG.md`.
- Neue Speicherfelder optional; Migration in `continueGame()`/`ensure*()`. Neue Bevölkerungen `transient` + `ensure*()` in `newGame()` **und** `continueGame()`.
- Keine neuen `rnd()`-Aufrufe in `world.js`. Kein Code nach `//` auf derselben Zeile. Parse-Check (acorn) und `window.RF` nach Neuladen.
- Balance mit `RF.simFight` messen, Werte in `docs/BALANCE.md` nach `BALANCE_GUIDE.md`.
- Der echte Spielstand wird nie verändert (Backup `rotfall.backup.s14c`, `S._quiet`).
- **Hunter-Standardtests:** alter Stand (s14c) laden, neuer Stand speichern → laden; Koop mit `?coopLocal` (Host simuliert und speichert, Gast speichert nie, Gast sieht das Ergebnis); Randfälle der Aufgabe; Leistung, wo angegeben.

---

## T01 — A1 Wucht mit Standfestigkeit · STATUS: TESTING (Engineer fertig, 323/323; Hunter prüft)
TASK: Wucht-Stunlock beheben.
CURRENT PROBLEM: `hit` setzt bei `crush` immer `stagger = 650` und bricht `swing/telegraph/windup` — außerhalb der `poiseUntil`-Prüfung. Kriegshammer: 0 % Verlust gegen jeden Nicht-Boss und Gorak; Held St. 8 schlägt Todesritter St. 15.
GOAL: Wucht öffnet ein Fenster, keine Dauersperre.
REQUIREMENTS:
- Wucht-Block in `hit` nur bei `!(target.poiseUntil > now)`, danach `poiseUntil = now + stagger + 1200` wie in `hurt`.
- Bosse 300 ms.
- Betrifft `warhammer`, `runenhammer`, `mauerbrecher`, `sturmanker`; BALANCE.md-Zeile.
TESTS: `simFight('death_knight',{level:15,weapon:'warhammer',nododge:true})` über 5 Seeds verliert im Mittel > 20 % Leben; Hammer bricht weiterhin Deckung; Boss-Taumeln 300 ms; Kolben/Langschwert-Werte unverändert.
PRIORITY: Critical
COST: Small
DEPENDS: –

## T02 — V1 Krieg mit Nachschub · STATUS: TESTING (Engineer fertig, 323/323; Hunter prüft)
TASK: Untoten-Lawine stoppen.
CURRENT PROBLEM: `sim.js warDay`: Untote wachsen um `2 + Knoten`/Tag ohne Deckel (134 am Tag 16, 15/15 Knoten); nach `garmadonSlain` wachsen und entstehen Heere weiter; Valen hebt in besetztem Nordfurt aus; `graveyard` wird stillschweigend umgefärbt.
GOAL: Front bewegt sich langsam hin und her; Versorgung entscheidet.
REQUIREMENTS: nach Teil B V1 (Wachstum `min(4, 1 + 0,25 × Knoten) + corpses/10`, Deckel 80/110, `S.war.corpses`, kein Wachstum nach Garmadon, Valen-Aushebung aus Köpfen und Korn eigener Städte, Orden-Heer bei Sonnwacht ab Eifer 1, Deckel beim Laden, Debug „Krieg 10 Tage vorspulen“).
TESTS: 30 Tage ohne Spieler: keine Seite > 12/15 Knoten; nach `garmadonSlain` kein Untotenheer wächst; Valen hebt nur in eigener Stadt aus; alter Stand mit 134er-Heer wird gekappt; Kriegs-Proben angepasst, nicht gelöscht; Spieler an der Front (`warTick` pausiert) unverändert.
PRIORITY: Critical
COST: Small
DEPENDS: –

## T03 — §5g.1 Varonheim · STATUS: TESTING
TASK: Hunter-Prüfung der gebauten Hauptstadt abschließen.
CURRENT PROBLEM: gebaut, 321/321, Hunter-Bericht offen.
GOAL: COMPLETED.
REQUIREMENTS: keine neuen; Befund aus Teil C (Varonheim teilt `TOWN_STYLE` mit der Kettenfeste) ist **kein** Fehler, sondern geht in T33.
TESTS: Migration alter Stände (Neuansiedlung), Varonsburg im Burgbezirk erreichbar, Audienz/Kerker/Ritterschlag laufen, Leistung in der Stadt (BUG-108-Messung), Koop-Gast betritt die Stadt.
PRIORITY: High
COST: Small
DEPENDS: –

## T04 — Effekte, Zufall, Klang (D3 + D5 + V17b + D4)
TASK: Belegte Darstellungs- und Zufallsfehler in einem Schritt beheben (eine neue Probenbasis statt mehrerer).
CURRENT PROBLEM: Partikel `ghost` malt immer den Helden in Rollpose (auch für `UNDEAD_FX.wraith` und Todesart `dissolve`); `fx()` zieht 3× `rnd()` je Partikel (Gewaltstufe ändert Beute/KI); `S.fx`/`S.floats` unbegrenzt; economy.js nutzt `Math.random()`; `MOOD` kennt `aurel/deadland/eisen/frozen/coast` nicht → Grünland-Klang und Vogelgezwitscher, auch unter Tage.
GOAL: Regel „Spiellogik zieht `rnd()`, Darstellung zieht `vrnd()`“; jede Region klingt richtig.
REQUIREMENTS:
- Rolle schreibt `type: 'afterimage'` mit `src: p.id`; `drawFx` malt `afterimage` als `byId(src)`, `ghost` als Schleier (3–4 senkrechte, nach oben blassere Streifen). Stilprobe `styleArea` anpassen.
- `vrnd` (eigener mulberry-Zustand) in `fx()`; `fx()` bricht über 400 Partikel ab; `float()` fasst gleichen Text am gleichen Ziel innerhalb 300 ms zusammen.
- economy.js `caravanDay`/`myCaravanDay`: `Math.random()` → `rnd()`.
- sfx.js: `MOOD` + `aurel, deadland, eisen, frozen, coast, sky`; `ambienceTick(region, day, town, under)`, `under` aus `DUNGEONS[S.map]` (kein Tag/Nacht-Zweig unter Tage); `ambienceKind` exportieren.
- Vor dem Umbau `RF.selftest()` sichern, danach vergleichen und Abweichungen im Hunter-Bericht nennen.
TESTS: Gespenst 3 s ticken → kein Partikel mit Heldenbild; Rolle hat Nachbild; „Kaum Blut“ ändert die `rnd()`-Folge nicht (`seedRng(7)`, Vergleich); Goblinsturm: `S.fx.length ≤ 400`; `ambienceKind('deadland'|'frozen', …)` nie `birds`; Gewölbe ohne Tag/Nacht-Wechsel; Karawanenüberfall deterministisch bei gleichem Seed; Koop: Gast sieht Schleier (Effekte lokal).
PRIORITY: Critical
COST: Small
DEPENDS: T01, T02 (RNG-Basis erst nach deren Probenänderung)

## T05 — Kleine Korrekturen (V17 a/c/e + A13 + Stil F + Doku-Drift)
TASK: Sammelkorrektur für Ehrlichkeit gegenüber Spieler und Agenten.
CURRENT PROBLEM: `townState('vharnholm')` meldet Hunger; `JOIN_FOES` ohne `sea/aurel/goblin`; Jagd 0 Wirkung, Schleichen wächst nie, Führung nur per Vorlesung; ui.js 708 nennt Handwerk „ohne Wirkung“; `EYE_ZAP` nennt `shadow/shock/arcane`, die `hurt` nie erreichen; Stil F lädt `ref5_atlas.png` immer; Doku sagt „31 Talentpunkte, jede gerade Stufe“, „kein Herstellsystem“, `CLAUDE.md v=21`, `STYLE_GUIDE` nennt D als Standard.
GOAL: Anzeigen und Doku stimmen mit dem Code.
REQUIREMENTS:
- `sim.js townState`: Fraktionsprüfung vor Kornprüfung. V17c nur, falls nicht schon in T02 erledigt.
- `JOIN_FOES` prüfen (Beitritt Kette mit Grubenbruder-Rang).
- `skills.leadership += 0,2` je Kampfsieg mit ≥ 1 Gefährten; `loyAdd × (1 + Führung/200)`.
- Tooltips ui.js 708: Handwerk wirkt; Jagd „Wirkung ab Jagd und Wildnis“; Schleichen „wächst ab Schleichen-System“ (T37).
- `EYE_ZAP` an die tatsächlichen Arten anpassen (oder `spellHit` gibt `kind` weiter, dann Probe).
- Stil F entfernen (Option, PNG-Laden sprites.js:124); gespeicherte Wahl F → R. Stil D einfrieren (Hinweis im Code). `STYLE_GUIDE.md` auf R.
- IST_ZUSTAND §2.2/§2.20, levelUp-Kommentar, `CLAUDE.md` Cache-Key-Angabe.
TESTS: Untotenstadt nie „Hunger“; Führung steigt nach Gruppenkampf, nicht allein; alter Stand mit Stil F lädt in R ohne Fehler, kein PNG-Request (Netzwerk); Roboterauge-Zap trifft mit korrektem Text; Koop: Gast mit altem Stil-F-Eintrag.
PRIORITY: High
COST: Small
DEPENDS: T02

## T06 — §5g.13 Leistung und Spielstand (D6 + D7 + D16)
TASK: Spielstand verkleinern, Speichern entkoppeln, Caches verdrängen statt leeren, vorwärmen.
CURRENT PROBLEM: 2,17 MB je Stand (nur zwei Plätze passen), `saveData` 142 ms synchron an ≥ 15 Stellen; `frameCache` (4000, leert `warmed` mit), `propCache`, `houseCache`, `bakeCache` leeren komplett; kalter Aufbau 201–426 ms (BUG-142); HUD schreibt alle 180 ms `innerHTML`.
GOAL: < 400 KB je Stand, kein Ruckler beim Speichern, kein Spitzenruckler bei Cache-Grenzen.
REQUIREMENTS:
- Figuren-`SKIP`: `plan`, `schedulePos` (werden beim Laden neu gebaut); Standardwerte (`attributes`, `skills`, gesunder `body`) nur als Abweichung; `applySave` ergänzt Standards.
- Format `RFZ1:` + Base64(gzip über `CompressionStream`); `loadRaw` erkennt Präfix, sonst JSON. `beforeunload` bleibt synchron (letzter komprimierter Stand oder JSON-Fallback). `cloudsave.js` weiter kompatibel.
- `save()` setzt nur ein Flag; ein Speichern je Frame/Leerlauf.
- LRU-Hilfe (Muster `anim.js tinted`) für alle vier Caches; Überlauf verwirft älteste 10 %; `warmed` bleibt.
- `travel()` und `cineMove()` rufen `R.prefetchAt()` (neuer Export um `prefetchChunk`) und `SP.warm()`.
- `refreshHUD`/`renderContext` schreiben nur bei geänderter Signatur.
TESTS: Speichern → Laden: gleiche NPC-Zahl, Beziehungen, Quests, `S.coopHeroes`, Gräber; Größe < 400 KB; alter JSON-Stand (s14c) lädt; drei Spielstand-Plätze nebeneinander ohne „quota“; Platzwechsel; Neuladen während Speichern; Koop: Host speichert komprimiert, Gast nie; 4200 Figurenbilder → `clears` 0; Debug-Messung „Kalter Aufbau“ (erste 5 Bilder) vor/nach; BUG-108-Messung Eren.
PRIORITY: Critical
COST: Medium
DEPENDS: T04

## T07 — §5g.2 Blutkult, Katakomben, Vampir, Aldhelm
TASK: Blutkult als Varons Hauptfeind (Nutzerentscheide §5g.2 und „Entscheide“).
CURRENT PROBLEM: geplant; Varonheim steht (T03).
GOAL: Unterwanderung, Katakomben mit Blutfürst (= Kanzler Aldhelm), Beitritt als Titelklasse Vampir.
REQUIREMENTS:
- Unterwanderung: Verschwundene, Maskierte nachts, Blutzeichen, Spuren, Verdächtige; Wendung am Hof.
- Katakomben unter Varonheim (Dungeon-Schlüssel), Blutfürst mit eigener Legendären (§5f).
- Titelklasse Vampir: Blutdurst als Ressource, Sonnenschwäche, soziale Folgen (Zeugen melden, Orden jagt), heilbar (Orden oder Heilquelle Sankt Serin).
- **Audit-Schärfung:** allgemeine Tabelle `STIGMA` in data.js je Fraktion `{ price, greet, deny, report }`, erster Schlüssel `vampire`; T15 ergänzt `brass`. Kultisten-Figur mit Blutmaske (unterscheidbar von Nekromant/Schatten, D12-Anteil). Blutfürst-Intro kommt in T17.
- Kult-NPCs `transient` + `ensureBloodCult()`.
TESTS: Spur → Verdächtiger → Katakomben; Aldhelm-Enthüllung genau einmal; Vampir: Sonnenschaden, Blutdurst leer → Folge, Heilung an beiden Orten; Zeuge meldet → Orden-Jäger; Downed-Regel gilt (kein Selbst-Aufstehen); Speichern/Laden während Unterwanderung und als Vampir; Erbfolge mit Vampir-Held; Koop-Gast als Vampir (eigener `coopHero`); alter Stand ohne Felder.
PRIORITY: High
COST: Large
DEPENDS: T03

## T08 — Gefangene, Steckbriefe, Ruf der Klinge (A5 + §5g.24 + A10)
TASK: Gnade mit Folgen und Kopfgeld „lebend oder tot“.
CURRENT PROBLEM: Ergebene Gegner werden nur neutral (`teamOf`); Dialog nur beim Kopfgeld-Twist (`surrenderOffer`); Gnade/Hinrichtung ohne Wirkung auf die Welt.
GOAL: Gefangene als allgemeine Mechanik; Steckbrief-Brett setzt darauf auf; Kampfstil prägt das Verhalten der Gegner.
REQUIREMENTS:
- `captiveMenu(e)` für jedes `e.surrendered` (Taste E): Fesseln (Seil/Kettenpeitsche, `shackled`), Verhören (Gerücht mit Kartenkreis: Lager, Anführer, Versteck), Anwerben (Söldner, Loyalität 20), Ausrauben, Laufen lassen (30 % Informant, 15 % Rächer über `S.avenge`).
- `e.captive = { by, since }`, folgt mit `sp × 0,6`; beim Kartenwechsel „abgeführt“ (transient an der Zelle); Ablieferung über `guardChoices`.
- §5g.24: Brett beim Wachhauptmann, Steckbriefe aus Banden-Anführern und `ELITES`, lebend × 1,5.
- A10: `S.fameStyle[region]` (−100…100) als Achse in `S.fame`, keine neue Ruf-Ebene; geändert in `captiveMenu`, Gnadenstoß an Menschen, Hinrichtungsdialog; wirkt in `updateEnemy` auf Kapitulationschance und Fluchtschwelle; Anzeige unter Ruhm; Gefährten kommentieren (`partyReact`).
TESTS: Fesseln → Folgen → Abliefern gibt Gold; Verhör erzeugt Gerücht mit Kreis; Gefangener bei Kartenwechsel; Gefangener stirbt/flieht unterwegs; Speichern/Laden mit Gefangenem (Karte passt nicht → bereinigt); Grausamkeit senkt Kapitulationschance messbar; Steckbrief lebend/tot; Koop: Gast fesselt (Host entscheidet); alter Stand ohne Felder.
PRIORITY: High
COST: Large
DEPENDS: T05

## T09 — V3 Läden am Stadtlager (+ V17d)
TASK: Alle Ladenpreise und -bestände an die Stadtwirtschaft hängen.
CURRENT PROBLEM: Nicht-Waren kosten überall `ITEMS.value × S.prices` (globaler Zufall); `shopStock` ist Zufall; Missernte verteuert Weizen, nicht Brot; `EVENTS`-Meldung „Karawane überfallen“ ist nur ein Preisfaktor.
GOAL: Handel und Reisen lohnen; Knappheit ist am Ladentisch sichtbar.
REQUIREMENTS:
- `ITEMS.*.base` (Leitware: `arms`, `tools`, `grain`, `magitech` …; Tränke frei).
- `rawPrice`: `value × clamp(ecoPrice(town, base) / ITEMS[base].value, 0,7, 1,8)`.
- `shopStock`: Waffenzahl aus `stock.arms`; Kauf zieht 0,5 Leitware ab; Mindestbestand, damit Läden nicht leerlaufen.
- `dayTick`/`factionAgenda`/`EVENTS` schreiben `S.prices` nicht mehr (nur Lesefallback); Aurelions Zölle → `S.after.tmul`. `EVENTS` „Karawane überfallen“ streichen.
- Tooltip „teuer: Waffen knapp in Nordfurt“.
TESTS: `stock.arms = 0` → Schwert teurer als bei vollem Lager; Kaufen und sofort Verkaufen ohne Gewinn; besetzte Stadt; Orte ohne `S.towns`-Eintrag (Tiefhall, Karak) nutzen Fallback; alter Stand mit `S.prices`; Koop: Gast sieht dieselben Preise wie der Host.
PRIORITY: High
COST: Medium
DEPENDS: T04

## T10 — Ahnenfeind und Heldentod als Moment (A6 + D8)
TASK: Tod des Helden sichtbar machen und mit Spielfolge versehen.
CURRENT PROBLEM: `playerDeath` pausiert im selben Tick und öffnet den Todesbildschirm (Todesart unsichtbar); der Mörder verschwindet in der Chronik.
GOAL: 1,8 s sichtbarer Tod; der Mörder wird Ahnenfeind, den der Erbe jagen kann.
REQUIREMENTS:
- D8: `S.dying = { t0, killer }`, `update` mit `dt × 0,25` für 1800 ms, Zoom 1,4, Umgebung leise, Mörder bleibt stehen (Geste/`float`), dann bisheriger Ablauf; ESC überspringt; Gruppe in der Zeit unverwundbar; kein zweiter Tod; `coopHooks.hostDied`.
- A6: bei `source?.kind === 'enemy' && !boss` → `S.nemesis = { mtype, name, lvl, weapon, kills, region, since }`, Hauptwaffe aus `grave.loot` verschieben; `ensureNemesis()` (transient); Vertrag `bounty` mit `nemesis: true`; `eliteDrop` gibt Waffe zurück + Legende „Rächer des Hauses“; Stufe ≤ Erbe + 3; ab Tag 10 alle 10–20 Tage Angriff auf Siedlung/Familie; wächst mit weiteren Tötungen.
- Hinweis im Nachruf und in der ersten Szene des Erben.
TESTS: Tod durch Bandit → `S.nemesis`, Waffe nicht im Grab; Tod durch Boss/Umwelt → kein Ahnenfeind; Todesbildschirm erst nach ≥ 1,5 s; ESC; Erbe genau einmal gewählt; Speichern/Laden mit Ahnenfeind; Tötung → Waffe fällt, Feld gelöscht; Erbe stirbt erneut durch ihn → „zwei Generationen“; Koop: Host stirbt vs. Gast stirbt; Tod im Goblinsturm (`morrFall`) läuft weiter.
PRIORITY: High
COST: Medium
DEPENDS: T01

## T11 — Schwierigkeit, Überleben, Wetter (§5g.6 + A14 + §5g.21)
TASK: Schwierigkeit und Überleben spürbar machen; eigene Wetterlagen im Menschenland.
CURRENT PROBLEM: Hunger allein = −4 Rumpf, nie tödlich; nur Schnee nachts wirkt; „Sehr schwer“ unterscheidet sich kaum; „Angsthase“ ohne Heiler-Aufwachen.
GOAL: Planung für lange Touren; Schwierigkeit über Überfälle und Überleben.
REQUIREMENTS:
- §5g.6: „Sehr schwer“ = mehr Überfälle (`bandDay`/Raid-Frequenz); „Angsthase“ wacht beim Heiler auf.
- A14: Status `hungry` (max. Ausdauer −20 %), `starving` (−40 %, Krit −3 %, Aufrichten langsamer), `tired` (> 20 Std. wach; Wahrnehmung −2, später Sichtkegel T37); automatisches Essen aus Gepäck/Vorrat; Rast am Lagerfeuer/in der Schenke; nachts im Freien höhere Überfallchance; `DIFF.survival` 0/0,5/1 (Leicht nur Hinweise).
- §5g.21: eigene Wetterlagen der mittleren Länder über `WX` (mit Wirkung wie die vorhandenen).
TESTS: zwei Tage ohne Essen → `starving`, maxStamina gesunken; Leicht nur Hinweis; Angsthase erwacht beim Heiler; neues Wetter tritt im Menschenland auf und wirkt auf Gegner; Speichern/Laden der Stati; Koop: Gast-Held und gemeinsamer Vorrat; Downed-Regel unverändert.
PRIORITY: Medium
COST: Medium
DEPENDS: T05

## T12 — V4 Straßen haben Herren
TASK: Banden, Banditenlager und Händlerzüge verbinden.
CURRENT PROBLEM: `riskOf` kennt keine Banden/Lager/Kriegsknoten; Banden rauben niemandem etwas; 13 Lager-POIs ohne Bezug; `banditsOnTribute` eigene Logik.
GOAL: Gefahr je Strecke mit Grund; Schutzgeld, Zerschlagen oder Umweg sind Entscheidungen.
REQUIREMENTS:
- `riskOf(a,b,guards)`: + `0,08 × Männer/9` je Bande mit Lager < 30 Kacheln von der Strecke; + 0,05 je feindlichem Kriegsknoten.
- Überfall: Beute in `b.loot`, ab 20 Ladungen `men + 1`; `bandFound` bevorzugt Banditenlager-POI (ohne `world.js`-RNG).
- Rook-Rang ≥ 1: halbes Schutzgeld, 10 % an Rook (Ruf); Zufallsbanden gelten als Rooks Netz.
- `banditsOnTribute` nur bei naher Bande.
- Kontor-Zeile je Strecke („Die Galgenbrüder bei Eisenried“).
TESTS: Bande neben Route → `riskOf` steigt, zerschlagen → sinkt; Bande wächst aus Beute; ohne Beute zerfällt sie; eigener Wagen betroffen; alter Stand mit `S.bands` ohne `loot`; Koop: Kontor beim Gast.
PRIORITY: High
COST: Medium
DEPENDS: T04, T09

## T13 — Oberfläche: Gespräche, Menüs, Komfort, Einstieg (D9 + D10 + §5g.37 + §5g.38 Eren)
TASK: Oberfläche entlasten und das fehlende Tutorial liefern.
CURRENT PROBLEM: `talk()` flach mit 30+ Hooks, keine Zifferntasten; 14 Menüeinträge laufen ab 1024 px über; fünf Heldenfenster; keine Kartenlegende/Markierungen/Inventar-Sortierung/Chronik-Filter; ein UI-Klang; kein Einstieg jenseits der Charaktererstellung.
GOAL: Die zwei, drei wichtigen Dinge oben; sechs Menüeinträge; Einstieg in Eren.
REQUIREMENTS:
- Choices `grp: 'quest'|'trade'|'serve'|'talk'`; „Reden …“ faltet ab 4 Einträgen; „Was gibt es Neues?“/„Omega?“/„Frage …“ dort hinein; Tasten 1–9 im vorhandenen `keydown`.
- `NAV` (ui.js) auf Held, Gruppe (Reiter Stall), Inventar, Tagebuch (Aufträge, Chronik, Kodex), Karte, Lager; Optionen als Zahnrad; `openModal`-Alias-Tabelle, Tastenkürzel bleiben.
- §5g.37: Kartenlegende, eigene Markierungen (`S.marks`, optional), Inventar sortieren/filtern/Ramsch verkaufen, Chronik-Filter nach Art, eigene Signale für Stufe, Auftrag, seltene Beute, Rang (Busse später T28).
- §5g.38 (Teil Eren): kurzer, überspringbarer Einstieg nur bei neuem Spiel (Bewegen, Hieb, Rolle, Deckung, Gespräch, Karte).
- Proben, die Knöpfe über Text klicken, auf Untermenüs anpassen.
TESTS: 1024 px `nav.scrollWidth ≤ clientWidth`; jeder alte Fenstername öffnet richtiges Fenster und Reiter; Händler mit Auftrag ≤ 7 Knöpfe oben, Taste 1 löst ersten aus; Markierungen überleben Speichern/Laden; alter Stand ohne Markierungen; Einstieg nicht bei `continueGame`; Touch-Bedienung; Koop: `uiHooks.dialogue` mit Gruppen beim Gast.
PRIORITY: High
COST: Large
DEPENDS: T05

## T14 — §5g.3 Ressourcen-Sprites
TASK: Bäume, Erz, Stein, Kräuter schöner; Abbau sichtbar.
CURRENT PROBLEM: Ressourcen sind flache Props ohne Abbaustufen.
GOAL: Man sieht, was abbaubar ist und wie viel übrig ist.
REQUIREMENTS: Stil R; Abbaustufen (angeschlagen, halb, erschöpft, nachgewachsen) als Prop-Zustand; neue Prop-Varianten im LRU-`propCache` (T06); Varianten aus Seed (§5b-Regel); Erz passt zur Eisen-Brücke (T25).
TESTS: jede Variante malt sich (Probe); Abbau ändert Stufe und Bild; Nachwachsen nach Zeit; Speichern/Laden abgebauter Knoten; Leistung Oberwelt (14 681 Props) gemessen; Koop: Gast sieht Abbau des Hosts.
PRIORITY: Medium
COST: Medium
DEPENDS: T06

## T15 — Messing: Stigma und Schwächen (V9 + V10)
TASK: Sozialer, elektrischer und wirtschaftlicher Preis der Bionik.
CURRENT PROBLEM: Niemand reagiert auf Prothesen oder Roboterauge; Glieder haben außer Verschleiß keine Schwäche.
GOAL: Bewusste Entscheidung, wie viel Messing man trägt; in Aurelion gleichwertige Vorteile.
REQUIREMENTS:
- `body.js brassOf(c)` (Auge sichtbar, Glieder nur ohne Umhang/Handschuh); `STIGMA.brass` (Tabelle aus T07) je Fraktion; `repPrice` multipliziert; `contextGreet`-Zeile; `varonAudience` bei `brassOf ≥ 2` Spionverdacht; Eifer ≥ 2 → `inquisitorCheck`; Aurelion: Rabatt, schnellere Wachen (`aurelWatch`).
- V10: Schock auf `mech`-Glied → „Kurzschluss“ 1 s + Verschleiß × 2; Regen draußen Verschleiß × 1,3; Stufe 4 braucht täglich eine Energiezelle, sonst halbe Wirkung.
- Hinweis beim ersten Einbau; Debug „Messinggrad setzen“.
TESTS: gleicher Artikel in Sonnwacht mit 3 Prothesen teurer, in Aurelheim billiger; Umhang verbirgt Arme, nicht das Auge; Schocktreffer setzt Status und doppelten Verschleiß; Energiezelle wird verbraucht; Gefährten mit Prothese zählen für sich; Speichern/Laden; Koop: Gast-Held eigener Messinggrad.
PRIORITY: High
COST: Medium
DEPENDS: T07

## T16 — Gefährten: Ausrüstung und Taktik (§5g.7 + A8)
TASK: Gefährten-Ausrüstung mit Klassenprüfung, Fokusziel, Haltung, Tier als viertes Mitglied.
CURRENT PROBLEM: Befehle gelten für alle, Ziel ist der nächste Feind; Rückenkrit nur zufällig.
GOAL: Tank + Flanke als planbare Taktik.
REQUIREMENTS:
- Ausrüstung mit Klassenprüfung (§5g.7).
- `S.partyFocus` (Mittelklick oder Taste F); `partyAI`: `byId(S.partyFocus) || nächster`.
- `m.stance ∈ {front, range, heal}` (fehlt → front); `updateEnemy`-Zielwahl gewichtet `front` in 80 px mit +50 %; „furchtsam“ vorn verliert Moral.
- Tier als viertes Mitglied (`partyCap`).
- UI: ein Feld „Haltung“ im Gruppenfenster.
TESTS: Fokus wechselt Ziel; Gegner wählt Tank; Rückenkrit-Rate im Gruppenkampf steigt messbar; Klassenprüfung lehnt ab; Tier zählt; Haltung übersteht Speichern/Laden, alter Stand ohne `stance`; Koop: gesteuerter Gefährte (`m.coopPilot`) ignoriert Haltung, Fokus setzt nur der Host.
PRIORITY: High
COST: Medium
DEPENDS: T01

## T17 — Regiebuch und Boss-Intros (D1 + D15 = §5g.5)
TASK: Regie-Ebene für Zwischensequenzen; Boss-Auftritte darauf.
CURRENT PROBLEM: Szenen sind Diashows (Text trägt alles, kein Klang, Schnitt friert 426 ms); zwei Textsysteme (`cineBars` Georgia, `coop-cine` Spectral).
GOAL: Figuren bewegen sich und posieren, Beats auf Zeitachse, Schnitt < 60 ms.
REQUIREMENTS:
- Shot-Felder `cast: [{ sel, n, to, pose, say, at }]`, `beats: [{ t, fx, sfx, shake, gesture, float }]` (Schema `ANIM_DEFS.death.ev`, `animEvents` wiederverwenden), `hold`, `sfx`.
- `cineNext` backt den nächsten Shot vor (`R.prefetchAt`, `SP.warm`), Schnitt nach leerer Warteschlange oder 300 ms.
- Eine Textfunktion, Schrift Spectral, Balken fahren ein/aus.
- Gesten jubeln, knien, trauern, salutieren in `ANIM_DEFS.gesture`.
- `bossIntro(e)` ohne Teleport: Namenskarte (Cinzel), Boss-Beat (Varg Ketten, Hrodvar Eiskreis, Garmadon Herzschlag, Gorak, Dodon Brüllen, Blutfürst Kerzen), 500 ms Zoom; einmal **je Held** (`S.flags.introSeen[mtype]`, bei Erbfolge zurückgesetzt — löst den Widerspruch „einmal je Haus“ vs. „Erbe sieht erneut“ in D15).
TESTS: Beats feuern genau einmal je Shot, auch beim Überspringen; `cast` erreicht Ziel; Schnitt-Messung < 60 ms nach Vorbacken; `vargCinematic` gleiches Ergebnis wie vorher; Intro einmal je Held, keines unter `_quiet`, Steuerung bleibt aktiv, Boss greift während Intro an; Koop: Gast sieht Text und Kamera.
PRIORITY: High
COST: Medium
DEPENDS: T06

## T18 — §5g.10 Aurelion-Ränge 3–6
TASK: Echte Prüfungen über `startTrial`.
CURRENT PROBLEM: Ränge 3–6 ohne Prüfung; Prototyp-Bionik und eigenes Schiff hängen daran.
GOAL: Rang ist verdient und schaltet frei.
REQUIREMENTS: neue Prüfarten (Technik-Aufgabe in der Fabrik, Kampf gegen Amok-Automat, Luftschiff-Eskorte, Ratsauftrag); Freischaltung Prototyp-Bionik; Vorbereitung für eigenes Luftschiff (V8, Welle 2).
TESTS: jede Prüfung bestehen/scheitern/abbrechen; Rang übersteht Speichern/Laden; Sperre für Prototyp greift vorher; alter Stand mit Rang 2; Koop: Gast hilft in der Prüfung, Host erhält Rang.
PRIORITY: Medium
COST: Large
DEPENDS: T15

## T19 — A2 Rüstungsklassen und Schlagarten
TASK: `mat` vom Klang zur Regel machen.
CURRENT PROBLEM: Gegnerrüstung = `threat × 1,6`; Schlagart nur Klang; `ap` zählt kaum; `tough`-Hinweis verspricht Nicht-Vorhandenes.
GOAL: Waffe nach Gegner und Region wählen.
REQUIREMENTS: `MONSTERS.*.ac` ∈ {flesh, leather, chain, plate, bone, spirit, brass} (fehlt → flesh); `AC_MUL[ac][mat]` 0,75–1,3; `mat` aus `wtype` bzw. Zauber-`kind` in `hit`; Rüstung = `AC_ARMOR[ac] + threat`; Treffer-Float („prallt ab“, „durch die Kette“); Kodex-Spalte; Debug „Rüstungsklasse zeigen“.
TESTS: Kolben gegen Knochenritter > Schwert; Klinge gegen Wolf > Kolben; `simFight`-Tabelle für 10 Gegner vor/nach in BALANCE.md; alte Stände laden (reine Daten); Koop keine Besonderheit.
PRIORITY: High
COST: Medium
DEPENDS: T01

## T20 — D2 Goblinsturm, Morrgrund, Aufstand inszeniert
TASK: Beispiel des Nutzers als Szene statt Spawn und Löschen.
CURRENT PROBLEM: `goblinStorm` spawnt neben Varg; `goblinStormWon` löscht Überlebende; `morrFall` löscht alle Goblins ohne Leichen; `revoltStart/revoltWon` nur Text.
GOAL: Aufbau, Kampf, Sieg mit Heimweg, Niederlage mit Gräbern — sichtbar.
REQUIREMENTS: Spawn am Kettentor (`gateOf('kettenfeste')`) mit Horn (neuer Klang `horn`), Tor wird `rubble`; Sieg: Jubel-Geste, `g.stormHome`, Heimweg zu Fuß, Entfernen bei Ankunft; Fest in Morrgrund mit Überlebendenzahl (`festTick`); Niederlage: Gräber je Goblin, 2–3 Flüchtlinge nach Grubenhort, Fahrt „Morrgrund brennt“ erst nach `chooseSuccessor`; gleiches Muster für Aufstand (Auszug als Kolonne). Probe 15953 auf „keine lebenden, aber Gräber“ anpassen.
TESTS: Goblins entstehen am Tor; Überlebende nach 1 Tag in Morrgrund; Festgröße = Überlebende; Fall: Gräber = gefallene Goblins, Fahrt nach Erbenwahl genau einmal; Speichern während des Heimwegs → beim Laden in Morrgrund; Koop: Gast sieht die Fahrt; Ahnenfeind (T10) bei Tod im Sturm.
PRIORITY: High
COST: Medium
DEPENDS: T17, T10

## T21 — §5g.4 Begehbare Zelte
TASK: Zelte als kleine Bauten mit Innenraum.
CURRENT PROBLEM: Zelte sind Props.
GOAL: Lager, Banden, Pilger, Garnison betretbar.
REQUIREMENTS: Innenraum wie Häuser (`HOUSES`-Muster); Bandenzelte zeigen Bandenbeute (`b.loot` aus T12); keine RNG-Änderung in `world.js`.
TESTS: jedes Zelt betreten/verlassen; Innenraum-Figuren transient bzw. gespeichert; Kollision; Leistung in Lagern; Koop: Gast betritt Zelt.
PRIORITY: Medium
COST: Medium
DEPENDS: T12

## T22 — A3 Gegner verteidigen sich
TASK: Block, Parade, Ausweichen für Gegner als Daten.
CURRENT PROBLEM: Nur der Spieler verteidigt; Gegnerschilde sind Bild; Knochenritter über Sonderregel.
GOAL: Umgehen, Wucht, Gefährten und Schlagart werden Antworten.
REQUIREMENTS: in `hit` vor Schaden: Schild + frontal (< 1,0 rad) → `chance(m.block ?? 0,35)`, Ausdauer des Ziels sinkt, `crush` nie geblockt, Ausdauer 0 → „Deckung gebrochen“; `MONSTERS.*.block/parry/evade`; Knochenritter-Regel in die allgemeine überführen; Elite-Duellanten parieren den 3. Kombo-Schlag.
TESTS: Frontaltreffer auf Goblin-Krieger teils geblockt, Rücken nie; Wucht nie geblockt; Knochenritter wie vorher; Kampfdauer im Median höchstens +40 % (Frustgrenze, `simFight`); Koop keine Besonderheit.
PRIORITY: High
COST: Medium
DEPENDS: T19

## T23 — Fraktionsressourcen und Tribut (V12 + V14)
TASK: Jede Fraktion hat eine Ressource; Tribut aus dem Dorfmarkt.
CURRENT PROBLEM: Nur Valen hat eine Grenze (Weizen); `T.vorrat` neben `S.towns[dorf].stock`.
GOAL: Mächte über ihre Ressource schwächen oder stärken, ohne Schlacht; sichtbar im Kodex.
REQUIREMENTS: `S.facRes` täglich in `warDay` aus bestehenden Zahlen (Valen Korn+Köpfe, Orden Eifer, Untote Leichen/Seelen, Händler angekommene Züge, Kette Arbeitskraft, Aurelion Nahrung+Magitech, Seevolk Salz/Prisen, Goblins Grubenhort); `planCampaign` nimmt Größe aus Arbeitskraft; `factionAgenda` liest Ressource; Kodex-Reiter „Mächte“; `tributeDay` nimmt aus dem Dorfmarkt, `arriveTribute` füllt die Feste; `T.vorrat` beim Laden übertragen.
TESTS: weniger Gefangene → kleinerer Feldzug; `q_pferch` wirkt; Tribut senkt Dorf-Korn und hebt Festen-Vorrat; Kodex zeigt Zahlen; alter Stand mit `T.vorrat` migriert; Koop: Kodex beim Gast.
PRIORITY: High
COST: Medium
DEPENDS: T02, T09

## T24 — §5g.20 Kopfgeldjäger und Gegner skalieren
TASK: Spätspiel-Druck über Gruppengröße und Rollenmix.
CURRENT PROBLEM: Ab St. 30 ist 1-gegen-1 ohne Risiko (Smart-Bot 0 % Verlust).
GOAL: Spannung ohne bloße Lebenspunkt-Aufblähung.
REQUIREMENTS: Tabelle `SCALING` nach Stufe: mehr Schildträger (T22), Heiler, Schützen; Kopfgeldjäger mit Rollen; Lebenspunkte nur mäßig.
TESTS: Smart-Bot St. 30/45/60 verliert im Mittel > 10 % gegen skalierte Gruppe; Frühspiel (St. 1–8) unverändert; Zusammenspiel mit Schwierigkeit (T11); Koop: Skalierung nach Zahl der Spieler begrenzt.
PRIORITY: Medium
COST: Medium
DEPENDS: T22, T16

## T25 — Zerlegen, Monstermaterial, Eisen-Brücke (A7 + A15)
TASK: Beute bekommt ein zweites Leben; Eisen wird eine Kette.
CURRENT PROBLEM: Überschuss nur verkaufen; `bone` ohne Zweck; `iron/ore/ingot/koenigseisen` ohne Umwandlung.
GOAL: Materialquelle für Runen und Aufwertungen; Wirtschaft spürt den Schmied.
REQUIREMENTS: `salvage(idx)` neben `craftItem` (Ertrag aus Wert/Rezept-Umkehr, Splitter nach Rarität); höchstens 5 Materialien (Knochenstaub, Geisterasche, Messingzahnrad, Engelsfeder, Reißzahn); `LOOT` je Familie (Daten); `bone` → Knochenstaub (Schlüssel bleibt); Rezepte „Schmelzen“ (3 Erz → 1 Barren) und Erzfuhre → 5 Eisenerz; ein Aufwertungsrezept mit Monstermaterial.
TESTS: Zerlegen gibt nie mehr Gold als Verkauf; Materialrezept funktioniert; Schmelzen; alter Stand mit `bone`; Stapeln im Inventar; Koop: Loot-Regel „wer zuerst aufhebt, besitzt“.
PRIORITY: High
COST: Medium
DEPENDS: T09

## T26 — Runen, Zwerge, Sandfürsten (§5g.28 + V13)
TASK: Runen und Sockel (Tiefhall, Aurelion) mit echten Fraktionen dahinter.
CURRENT PROBLEM: Keine Runen; Karak-Atar als `bandit` markiert und hungert; Zwerge nur ein Flag.
GOAL: Runen wirken auf Schlagart/Rüstungsklasse; Ruf bei Zwergen und Sandfürsten regelt Zugang und Preise.
REQUIREMENTS: `FACTIONS.sand`, `FACTIONS.dwarf`; `LOCATIONS.karak_atar.faction = 'sand'` (Daten, kein RNG), Karak-NPCs `sand`; `karakRefused` → Ruf −10; `S.towns.deephall` (Erz, Barren) ohne Kartenpräsenz; Karak-Import nach Sicherheit der Wüstenroute; Sockel an Waffen/Rüstung, Runen aus Splittern + Material (T25), Wirkung auf `AC_MUL`/Zustände (T19); Zwergen-Ruf schaltet Runenstufen frei.
TESTS: Karak hungert nicht bei sicherer Route; alter `bandit`-Ruf nicht übertragen; Sockeln/Entsockeln; Runenwirkung per `simFight` messbar; gesockelte Gegenstände überstehen Speichern/Laden; Koop: gesockelte Beute beim Gast.
PRIORITY: Medium
COST: Large
DEPENDS: T25, T19

## T27 — Seevolk, Seehandel, Gischtinsel (§5g.14 + V6 + §5g.38 Insel)
TASK: Seehandel an die Märkte, Piraterie nach Clan, Ränge 2/4, zweite Gischtinsel.
CURRENT PROBLEM: `PORT_PRICE` fest; Piraterie pauschal −12; Ränge 2/4 unerreichbar; Gischtinseln = nur Tangkron.
GOAL: Echte Handelsroute Salzhafen–Kupferhafen; Freibeuterei als Rangweg.
REQUIREMENTS: `cargoMenu` über `ECO.ecoPrice`, Handel ändert `S.towns[port].stock`; Tangkron als `S.towns.isle`; gekaperter Salzbund bei `seaClan === 'raider'` → Sturmklinge +6; Rangwege 2/4 je Clan; zweite Gischtinsel über Kurse erreichbar; `PORT_PRICE` entfernen.
TESTS: 20 Salz verkaufen senkt den Preis in Kupferhafen; Piraterie je Clan; Rang 2/4 erreichbar; zweite Insel erreichbar; alter Stand; Koop: Gast an Bord.
PRIORITY: Medium
COST: Medium
DEPENDS: T09

## T28 — Musik und Klang-Busse (§5g.16 + D11)
TASK: Busse, Stimmenlimit, Ducking; synthetisierte Musik je Region, Kampf, Stadt.
CURRENT PROBLEM: ein Regler, keine Busse, keine Grenze, keine Musik.
GOAL: Regler Effekte/Umgebung/Musik/Oberfläche; Szenen dämpfen die Welt.
REQUIREMENTS: `bus = { sfx, ui, amb, music }` an `master`; `sfx(name, …, bus)`; höchstens 24 Stimmen; `duck(ms, level)` in Zwischensequenzen und Heldentod (T10); Musik nutzt die Regionsschlüssel aus T04; Einstellungen in `settingsUI`.
TESTS: 100 Treffer in einem Tick → ≤ 24 Stimmen; Einstellungen überleben Neuladen; Musik wechselt mit Region und Kampf; Szene dämpft; Leistung; Koop: beide Seiten lokal.
PRIORITY: Medium
COST: Medium
DEPENDS: T04, T17

## T29 — Himmelsinsel und Aurelheims Prachtbauten (§5g.9 + §5g.36)
TASK: Ratsmitglieder handeln; Mord lässt Privatarmeen landen; Prachtbauten nutzbar.
CURRENT PROBLEM: Himmelsinsel ohne Grund zum Besuch; Bibliothek, Gericht, Hospital, Observatorium, Badehaus sind Kulisse.
GOAL: teurer Besuch lohnt; Aurelheim hat Dienste.
REQUIREMENTS: Ratsmitglieder verkaufen (auch ohne Rang); Mord → Landung sehr starker Adelsarmeen über sichtbare Luftschiffe (`S.air.fleet`); Bibliothek (Kodex/Übungsbuch), Badehaus (Rast, Gerüchte), Gericht (Prozess, Bußgeld), Hospital (Heilung; später Implantate V11), Observatorium (Wettervorschau).
TESTS: jede Einrichtung hat eine Handlung; Mord löst Landung genau einmal aus; Zeugen/Verbrechensregeln; Speichern/Laden; Koop: Gast auf der Insel.
PRIORITY: Medium
COST: Medium
DEPENDS: T13

## T30 — V7 Luftschiffe in der Welt
TASK: Wetter, Fracht, Luftraum, Wracks.
CURRENT PROBLEM: Flotte ist Kulisse mit einem Versorgungswert.
GOAL: Luftschiffe wirken auf Markt, Politik und Karte.
REQUIREMENTS: `riskAir` + Wetter an der Schiffsposition und Jahreszeit; Fracht nach `caravanDay`-Logik zu Aurelion-Städten mit Mangel; Luftraum über Valen bei schlechter Beziehung (vorerst `facRelation`, in T40 `FAC_REL`) → Risiko + Chronik „Varons Ballisten“; Wrack bleibt als `S.wrecks[]` mit einmaligem Bergungsgut und Aushang in Kupferhafen; Luftpiraten als Bandenart (EXPERIMENTAL-Schalter).
TESTS: Sturm erhöht `riskAir`; Fracht ändert Lager; Überflug erzeugt Chronik; Wrack bleibt nach `bigEnd` und ist einmal plünderbar; Speichern/Laden `S.wrecks`; alter Stand; Nahrung Aurelions bleibt im Rahmen; Koop: Gast sieht Wrack.
PRIORITY: High
COST: Large
DEPENDS: T23, T12

## T31 — §5g.17 Schwarze Feste befreien (BUG-100)
TASK: Befreiung möglich machen, Umgebung beleben.
CURRENT PROBLEM: Heer (34) steht dauerhaft; Befreiung verlangt „kein Heer am Ort“.
GOAL: Befreiung als erreichbares Großereignis.
REQUIREMENTS: Lösung nach Designfrage 1 (`design/mechanik-check.md`: Heer vorher im Feld schlagen oder eigene Arena); nutzt Deckel und Garmadon-Regel aus T02; Umgebung beleben.
TESTS: Befreiung aus Debug-Zustand erreichbar; Kriegsgraph danach konsistent; Speichern/Laden; `garmadonSlain`-Zusammenspiel; Koop.
PRIORITY: Medium
COST: Medium
DEPENDS: T02

## T32 — Klassenregeln, Barde, neue Lehrer (A9 + §5g.31 + §5g.11)
TASK: Frühe Klassenwahl spürbar; Barde als volle Klasse; Druidin, Moorhexe, Omega-Priester.
CURRENT PROBLEM: Grundklassen je 1 Fähigkeit; Barde 2 Fähigkeiten ohne Ressource.
GOAL: Klasse bestimmt das Spiel der ersten Stunden.
REQUIREMENTS: `CLASSES.*.rule` (Krieger Parade +10 Ausdauer, Schütze Stellung, Schurke Schleichtempo, Kleriker Aufrichten ×2, Magier Kanal −20 %, Alchemist Trankdauer +50 %), nur in aktiver Klasse; Doppelungen mit `SKILL_TREE` prüfen; Barde: Repertoire, Auftritte in Schenken, Verdienst, Ressource; neue Lehrer mit eigenen Zaubern; Anzeige im Ausbildungsfenster (T13).
TESTS: 6 Regel-Proben; Klassenwechsel wechselt Regel; Auftritt verdient Gold; Lehrer lehren; Speichern/Laden; Koop: Gast-Klasse mit eigener Regel.
PRIORITY: Medium
COST: Large
DEPENDS: T13

## T33 — Orte beleben und Fraktionsarchitektur (§5g.35 + D13)
TASK: Szenen für Schrein, Hain, Lager, Ruinen; Tributdörfer unterscheidbar; besetzte Städte mit anderen Bannern/Wachen; Architektur über Form.
CURRENT PROBLEM: fehlende `SCENES`-Einträge (shrine, grove, Grenzwacht, Hundertfeld, Knochenwald, Aschensee, Raidcamp); Varonheim = Kette = Tickmar im Material; eine Hausform überall.
GOAL: Man sieht, in wessen Land man steht und wer eine Stadt hält.
REQUIREMENTS: `TOWN_STYLE.form`; `houseSprite` bekommt je Form 2–3 Zusatzbauteile; Banner nach `S.war.nodes[k].owner`, Besitzer im Hausbild-Schlüssel; Szenen ohne neue RNG-Aufrufe bei der Weltgenerierung (Risiko: Szenen in `world.js` verschieben die Welt).
TESTS: Besitzerwechsel → neuer Hausbild-Schlüssel, neues Bild; jede neue Szene lädt; Weltgenerierung mit gleichem Seed identisch (Hash der Karte vor/nach); Gebäudetest mit gecachten Bildern; Leistung; Koop.
PRIORITY: Medium
COST: Large
DEPENDS: T06, T02

## T34 — Siedlung als Stadt, Ertrag, Lehen (§5g.19 + §5g.25 + §5g.33)
TASK: Ein Ertragsmodell für Siedlung und Lehen.
CURRENT PROBLEM: Siedlung bringt kein Gold; Ritterschlag ohne Fortsetzung; drei geplante Punkte lösen dasselbe.
GOAL: Stufen, Zuzug, Reaktionen der Fraktionen, Ertrag, Pflichten am Hof.
REQUIREMENTS: `yieldOf(place)` für Zonen/Gebäude und Lehen; Siedlungsstufen mit Zuzug nach Attraktivität; Fraktionsreaktionen; Lehen nach Ritterschlag (Dorf oder gehaltene Orte), Ladungen an den Hof, Folgen bei Versäumnis; optional Materialbedarf (V16-Anteil).
TESTS: Tagesertrag je Stufe; Stufenaufstieg; versäumte Pflicht → Folge; Speichern/Laden; alter Stand mit Siedlung; Koop: Gold nach Teilungsregel.
PRIORITY: Medium
COST: Large
DEPENDS: T09, T23

## T35 — §5g.12 Jagd und Wildnis (inkl. Fallen-Basis)
TASK: Fährten, Fallen, Häuten, Wildnis-Ereignisse; Jagd-Fertigkeit mit Wirkung.
CURRENT PROBLEM: Jagd 0 Wirkung; §5g.12 und §5g.34 planen je eigene Fallen.
GOAL: Ein Fallensystem für Tiere und Gegner (T36 erweitert).
REQUIREMENTS: Fährten führen zu Tieren; `TRAPS`-Grundlage (Auslöser, Ziel, Wirkung); Häuten nach Fertigkeit (Leder, Reißzahn aus T25); Wildnis-Ereignisse; `skills.hunting` wächst und wirkt.
TESTS: Fährte führt zum Tier; Falle fängt; Ertrag nach Fertigkeit; Fertigkeit wächst; Speichern/Laden gelegter Fallen; Koop.
PRIORITY: Medium
COST: Medium
DEPENDS: T25

## T36 — Magie-Kombos, Fallen, Alchemie-Handel (§5g.26 + §5g.34)
TASK: Eine Oberflächenregel für Zauber und Fallen; Apotheke und Gift-Schmuggel.
CURRENT PROBLEM: Magie-Status kombinieren nicht; keine platzierbaren Fallen; Alchemie ohne Wirtschaft.
GOAL: Umgebung als Taktik.
REQUIREMENTS: `GROUND` + `oil`, `water`, `poison`; Feuer + Öl = Brand, Frost + Wasser = Eis, Blitz + Wasser = Schock im Umkreis; Rückstoß in Brandfläche; Ölfass, Giftgas auf T35-Fallen; Apotheke kauft Tränke (Preis über Leitware, T09), Gift als Schmuggelware (vorhandene Vertragsart).
TESTS: jede Kombination; Lebensdauer der Flächen; Gegner und Gefährten betroffen; Falle legt Fläche; Apothekenpreis folgt Lager; Wache erwischt Schmuggel; Speichern/Laden; Koop.
PRIORITY: Medium
COST: Large
DEPENDS: T35, T09

## T37 — Schleichen, Taschendiebstahl, Zuschauer (A4 + §5g.23 + D14)
TASK: Wahrnehmung statt Radius; Taschendiebstahl darauf; Zuschauer reagieren.
CURRENT PROBLEM: `nearestTarget` prüft nur Entfernung; Schleichen wächst nie; Hinterhalt nur gegen Neutrale; Bewohner fliehen sofort oder ignorieren Kämpfe.
GOAL: Schleichen als Spielstil, Diebstahl gegen Wahrnehmung und Zeugen.
REQUIREMENTS: `perceive(e, t)` (Kegel ±70°, dahinter × 0,35, `clearLine` nur für Kandidaten < 300 px, Licht aus Tageszeit), `noise(t)` (Tempo × Rüstungsgewicht × Schleichen), `e.suspect` mit „?“/„!“; Schleichtaste; `skills.stealth` wächst unentdeckt nahe Feinden; Müdigkeit (T11) verengt Kegel; Taschendiebstahl mit Zeugen; Zuschauer-Zustand `watch` in `updateNpc` (hinschauen, zurückweichen, Stand zu, Wache), Prüfung alle 250–500 ms.
TESTS: Schleichender hinter Bandit 3 s unbemerkt; laufender Held in Platte von hinten gehört; 200 Gegner Leistung im Budget; Diebstahl-Erfolg hängt an Blick und Licht; Zeuge → Verbrechen; Händler neben Kampf schließt und öffnet wieder; Speichern/Laden; Koop: Host nimmt Gast-Helden wahr.
PRIORITY: High
COST: Large
DEPENDS: T11, T32

## T38 — Stimmen der Welt (§5g.15 + §5g.18 + §5g.30 + A16)
TASK: Stumme Figuren reden, Flüchtlinge mit Heimat, Akademie-Alltag, Gefährten-Szenen, ein Abgangsweg.
CURRENT PROBLEM: Automaten/Kettenwachen stumm; Flüchtlinge ohne Heimat; Studenten ohne Tagesablauf; Gefährten reden nie miteinander; zwei Abgangswege (Moral und Loyalität).
GOAL: Welt und Gruppe sprechen; nur Loyalität entscheidet über Gehen/Verrat.
REQUIREMENTS: Dialoge für Automaten und Kettenwachen; Flüchtlinge mit `home`, Rückkehr nach Befreiung des Knotens (T02); Studenten mit Tagesplan, Bücher für Ilvar, Anklage „verbotene Magie“; Zwei-Gefährten-Szenen (Streit, Freundschaft, Eifersucht) am Lagerfeuer; `dayTick` Moral < 12 → `loyAdd(m, −5)` statt Abgang, Gehen/Verrat nur in `loyDay` nach Charakterzug.
TESTS: Flüchtling kehrt heim; Studenten folgen Plan; Szene mit zwei Gefährten löst aus; niedrige Moral senkt Loyalität, kein direkter Abgang; Speichern/Laden; alter Stand; Koop.
PRIORITY: Medium
COST: Large
DEPENDS: T13

## T39 — Reittiere 2.0 und eigene Handelskarawane (§5g.27 + §5g.29)
TASK: Berittener Kampf und eine dauerhafte eigene Karawane.
CURRENT PROBLEM: Reittiere nur Tempo, jeder Treffer wirft ab, nur 3 Arten, nur umgefärbt; keine eigene Karawane auf Dauer.
GOAL: Reisen und Handel als Unternehmen.
REQUIREMENTS: berittener Kampf, Rammen, Kamel/Wolf je Region, Zaumzeug und Rüstung sichtbar; Karawane mit Route, Wächtern, Lasttieren, Risiko aus `riskOf` (T12), Gewinn je Rundreise über Stadtpreise (T09).
TESTS: Treffer wirft nicht immer ab; Rammen; regionale Reittiere; Rundreise mit Gewinn; Überfall durch Bande auf der Route; Speichern/Laden; Koop: Gast beritten.
PRIORITY: Medium
COST: Large
DEPENDS: T12, T09

## T40 — Ein Kriegsgraph, Diplomatie, Fall Aurelions (V2 + §5g.32 + §5g.8 + V15-Kern)
TASK: Alle Mächte auf einem Graphen, eine Beziehungstabelle, Diplomatie, Fall Aurelions nach Weltlage.
CURRENT PROBLEM: Nur Valen und Untote führen Krieg; Feldzüge und Städtefall laufen daneben; Beziehungen an drei Stellen; `factionAgenda` im Rundlauf.
GOAL: Kriegskarte zeigt alle Fronten; der Spieler stärkt Seiten oder stiftet Frieden.
REQUIREMENTS: `WAR_NODES` + Kette, Varonheim, Aurelion-Städte, Totenruinen …; `FAC_REL` ersetzt `facRelation`, `JOIN_FOES`-Prüfung, `hostile()`; `resolveNode` für beliebige Paare; Feldzug = Heer; `S.after`-Städtefall über `capture`; Gesandte, Frieden, Bündnis, Knoten befrieden; Fall Aurelions: Bürgerkrieg der Häuser, danach Automaten oder Varon nach Weltlage, kein Spieler-Thron; `factionAgenda` nach Lage inkl. Embargo; Luftraum aus T30 auf `FAC_REL`.
TESTS: jede Fraktion mit Heer bewegt sich in 10 Tagen; Vorzeichen `FAC_REL` = alte `facRelation`/`hostile`; Frieden stoppt Schlachten am Knoten; beide Wege des Falls Aurelions; Migration alter Stände (fehlende Knoten ergänzt); `warTick`-Leistung; Koop.
PRIORITY: High
COST: Large
DEPENDS: T02, T23, T30

---

## Offene Rückfrage an den Nutzer (keine Aufgabe)

- **Freie vom Grubenhort:** Teil B schlägt vor, sie nach Vargs Fall in die Grubenstämme zu überführen. §5c sagt „eigene Fraktion“. Bis zur Antwort bleibt es bei §5c.
