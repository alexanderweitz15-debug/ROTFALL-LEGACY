# T23 — Fraktionsressourcen: „Woher die Mächte ihre Kraft nehmen“ (V12 + V14)

**Status:** WAITING_FOR_DEVELOPER · **Autor:** Welt-/Fraktionsspezialist (Agent 6, Fable 5.1, Hoch) · **Stand:** 01.10.2026
Kennzeichnung: **FAKT** = belegt (Datei:Zeile zum Zeitpunkt der Lesung; `game.js` wird parallel bearbeitet, Zeilen können wandern) · **VORSCHLAG** · **ANNAHME**.
Entwicklerentscheidung (DESIGN_DECISIONS.md, 01.10.): „Nächster großer Vorschlag: T23 Fraktionsressourcen zuerst, T40 baut darauf.“
Rahmen aus `docs/audit/TASKS.md` T23: eine Ressource je Macht, täglich in `warDay`, Kodex-Reiter „Mächte“, Tribut aus dem Dorfmarkt, `T.vorrat` migrieren. Abhängig von T02 (TESTING) und T09 (TESTING); T40 und T30 hängen an T23.

---

## 1. Name und Konzept
**„Woher die Mächte ihre Kraft nehmen“** — Jede der acht Mächte bekommt genau **eine** Ressource mit einer Quelle, einem Verbrauch und einer sichtbaren Wirkung in der Welt:

| Macht | Ressource | Quelle (vereinfacht) | Verbrauch / Wirkung | Der Spieler dreht daran, indem er … |
|---|---|---|---|---|
| Valen | **Korn** (bleibt) | Felder der Valen-Städte | Heereswachstum, Heeresversorgung | Korn liefert, Nordfurt hält, Felder schützt |
| Orden | **Eifer** (0–5) | besetzte Städte, verbrannte Hexen, gewonnene Kreuzzüge | Kreuzzug-Takt und -Stärke, Hexenjagden, Streifen, Überfälle auf Grubenhort | Hexen rettet oder ausliefert, Kreuzzüge mitreitet, Ketzer freikauft |
| Die Toten | **Seelen** (0–200) | Gräberknoten, Verluste jeder Schlacht, Dorfüberfälle, „Erheben“ | neue Heere, Auffüllen der Besatzungen, (optional) Morvaths Heerzug | Dörfer verteidigt, Seelenkammer zerschlägt, Phiolen opfert, Gräber befreit |
| Händler | **Züge** (0–100) | angekommene Händlerzüge und Karawanen | Zahl und Bewachung neuer Züge, Gildenspeicher, Händlerpreise, Geleitlohn | Karawanen schützt oder überfällt, Banden zerschlägt, Lieferaufträge erfüllt |
| Kette | **Arbeitskraft** (Köpfe) | Gefangene in Pferch, Grube, Steinbruch | Größe der Feldzüge, Mauerbau, Produktion der Eisenfeste | Pferche öffnet, Sklaven freikauft, Tributzüge raubt, Gefangene liefert |
| Aurelion | **Versorgung** (Tage Nahrung) | Luftschiff-Import, Zukauf in Nordfurt | Zölle, Hunger der Werke, Frachtaufträge, Gesandte | Luftschiffe schützt oder sabotiert, Korn liefert, Zölle verhandelt |
| Seevolk | **Salz** (Hafenvorrat) | Salinen Salzhafen/Nordfurt, Salzbund-Schiffe | Prisen der Sturmklinge zehren daran, Salzpreis im Binnenland, Kopfgelder auf Schwarzsegel | Salzfrieden stiftet, Weißbart erschlägt, selbst kapert, Geleit fährt |
| Goblins | **Grubenhort** (Punkte, bleibt) | Spenden, freie Goblins, Händler | Stufe der Goblinstadt, Söldner bei Grisk, Ziel von Orden und Kette | spendet, befreit, verteidigt |

Alles liegt in **einem** Objekt `S.facRes`, wird **einmal am Tag** in `warDay` zusammengerechnet, steht im Kodex unter **„Mächte“** und im Fraktionsfenster, und jede Schwelle meldet sich mit Log, Chronik und Hinweis. Kein neues Teilsystem: die Zahlen kommen aus `S.towns`, dem Kriegsgraphen, `S.eco.caravans`, den Gefangenen der Eisenfeste, `S.after.zeal`, `S.gobCity` und den Luftschiffen.

## 2. Gelöstes Problem
- FAKT (`docs/audit/TASKS.md:303`): Nur Valen hat eine Grenze — `valenGrain` in `warDay` (`sim.js:360`, +3 bei Korn > 10, sonst +1). Alle anderen Mächte handeln ohne Grund und ohne Grenze: die Kette plant Feldzüge mit `ri(...K.size)` (`game.js:5829–5831`), der Orden sendet Paladine, sobald ein Knoten besetzt ist (`game.js:10603`), die Toten wachsen nur nach Knotenzahl (`sim.js:363`), die Händler füllen Speicher per `stockShock(…, 6)` (`game.js:10609`).
- FAKT: `T.vorrat` der Tributdörfer (`game.js:5643–5666`) läuft neben `S.towns[dorf].stock` (die Dörfer stehen über `VILLAGES → LOCATIONS` in `TOWN_LOCS`, `world.js:575`, `economy.js:43`). Ein Dorf kann im Tributsystem hungern und im Markt satt sein.
- FAKT: `factionAgenda` (`game.js:10592–10619`) ist ein Rundlauf nach `day % 5` — Mächte „tun“ etwas, weil sie dran sind, nicht weil sie können oder müssen.
- Folge für den Spieler: Er kann keine Macht schwächen oder stärken, ohne eine Schlacht zu schlagen. Der Director nennt „Fraktion → Wirtschaft“ die größte Lücke für Emergenz (`HANDOFFS/director_to_lead.md`, Abschnitt „Wo die Vision reißt“ 1).

## 3. Warum es zu ROTFALL passt
Dark Fantasy heißt hier: Mächte sind hungrig, nicht böse. Der Orden braucht Feinde, die Toten brauchen Tote, die Kette braucht Hände, Aurelion braucht Brot, das es nicht anbaut. Jede Ressource ist zugleich eine Verwundbarkeit, und jede Verwundbarkeit ist ein Hebel für den Spieler — mit Konsequenz: Wer der Kette die Hände nimmt, bekommt kleinere Feldzüge gegen die Toten, also stärkere Totenruinen im Westen. Wer Aurelions Luftschiffe sabotiert, treibt den Kornpreis in Nordfurt hoch und schwächt Valen. Das ist die Kette aus `AGENT_SYSTEM.md`: NPC-Entscheidung → Fraktionsfolge → Wirtschaftsfolge → Weltereignis → Begegnung → Ruf → neue Chance. Und es ist die Vorarbeit für T40: ein Kriegsgraph aller Mächte braucht Gründe, warum ein Heer groß oder klein ist.

## 4. Heutiges System (FAKT)

**Tagesablauf.** `dayTick` (`game.js:10681–10729`) ruft in dieser Reihenfolge: `bandDay`, `gobDay`, … `tributeDay(); campaignDay(); raidDay(); undeadHeldDay(); … aurelDay(); ECO.airDay(); … factionAgenda(); bountyDay(); afterDay(); SIM.warDay();` (10682–10688). `warDay` (`sim.js:356–382`) rechnet Heereswachstum, Besatzungen, neue Heere, Entsatz, dann `economyDay()` → `ECO.ecoDay()` (Produktion, Verbrauch, Händlerzüge, Lieferaufträge).

**Valen.** Korn aller Valen-Städte im Graphen (`sim.js:360`); Heeresversorgung isst nur Nordfurts Weizen (`sim.js:43–47`, Hunger: −4 Stärke). Varonheim kommt mit der Belagerung S1 als Knoten dazu (Proposal `varonheim_belagerung.md` §5.1). **Stand der Lesung:** in `src/sim.js`, `src/data.js` kommt `varonheim`/`capThreat` noch nicht vor — S1 ist noch nicht im Arbeitsbaum (FAKT per grep, 01.10.).

**Orden.** `S.after.zeal` 0–5, nur über Hexenprozesse (`witchZeal`, `game.js:10337–10341`): ≥ 2 startet eine Hexenjagd-Welle (zwei Anklagen, je Rettung −1). `faithDay` (`game.js:8809–8818`) löst fest getaktet aus: Opferfest alle 7, Ketzerjagd alle 6, Wallfahrt alle 9, **Kreuzzug alle 12 Tage**; `crusadeEnd` gewinnt mit 0,45 (+0,35 wenn der Spieler mitzog) (`game.js:8890`). `factionAgenda` „order“: Paladine und Monster-Aushang, sobald ein Knoten besetzt ist (`10603–10605`). Orden überfällt Grubenhort ab Stufe 3 mit 0,4 Chance im Rundlauf (`game.js:8155`). Inquisitoren prüfen Fremde (`8782`). Sonnwacht ist Ordensknoten (`data.js:1339`, Besatzung 20).

**Die Toten.** Wachstum `min(4, 1 + 0,25 × Knoten)`, nach Garmadon 0 (`sim.js:363`); Besatzungen +2/Tag bis 10 (`366`); neues Heer mit 0,35 Chance, Stärke 30 (`368–371`). Dorfüberfälle `raidDay` (`game.js:6039–6049`): Chance 0,06 (0,35 nach Vargs Fall), Größe 4–7 + Tag/15. „Erheben“ (`applyFate` `6177–6181`) macht Dorfbewohner zu Besatzung (+n). Seelenphiolen als Ware (Ossara, `7870`), Opfer am Totentempel (+3 Ruf, `7888–7891`), Seelenkammer im Turm des Nachtglases (`7514–7517`, Orden +10, Untote −10). Totenfürst-Spieler bekommt Tribut der Knechte (`undeadHeldDay`, `6213–6214`).

**Händler.** Abstrakte Züge `S.eco.caravans` (`economy.js:287–315`): bis 6 neue am Tag, höchstens 16 unterwegs, Wachen `ri(0, 2)`, Überfall mit `riskOf` (`280–286`, Basis 0,06). Große Karawane Eren↔Nordfurt (`sim.js:138–236`): Hinterhalt 35 %, Geleit +4 Ruf/+30 Gold, Verlust −2 Ruf. `deliver()` +2 Ruf (`economy.js:402`). Agenda „merch“: `stockShock(best, 6)` oder Geleitauftrag (`game.js:10608–10611`).

**Kette.** Feldzüge: `CAMP_TYPES` raid 8–12 / zug 20–30 / heer 40–50 Mann, Takte 4–6 / 10–15 / 20–30 Tage (`game.js:5817`), Ziel immer eine Totenruine (`CAMP_TARGETS`, `5818`), Größe `ri(...K.size)` ohne Bezug (`5831`), Sieg 0,45 + Größe/80 (`5886`). Tribut: `tribState` je Dorf mit `vorrat` 60, +5/Tag Ernte, alle 5 Tage 25 (doppelt bei `harsh`), Hunger < 10 → nach 2 Perioden wandert jemand ab (`5643–5666`); `arriveTribute` löscht den Zug und loggt nur (`5735–5740`). Gefangene: Pferch bis 7, alle 2 Tage +2 „Ware“ (`5455–5456`); Goblins arbeiten als `Goblin-Bergmann/-Holzfäller/-Schmied (versklavt)` — **die Wirtschaft zählt sie schon als Arbeiter** (`economy.js:13–23`, `census`, `LABOR.kettenfeste = 'mine'`). `q_pferch` befreit alle (`5505–5516`, Kette −15, Goblins +10). Agenda „chain“: Streifen oder „Varg lässt die Mauern ausbessern“ (`10613–10616`).

**Aurelion.** Nahrung kommt per Luftschiff aus dem Süden: `airSupply()` 0,2–1,5 je nach fliegenden Handelsschiffen (`economy.js:185–188`), Import `use × 0,9 × sup` (`245`); Werft braucht Barren und Holz (`211–213, 223–226`). Zölle `S.tollMul` (`128`), Agenda hebt sie zufällig (`game.js:10617`) und sie fallen täglich um 0,01 zurück (`10724`). „Ein Gesandter reist nach Nordfurt“ ist nur Text (`10618`). Fall Aurelions über `aurelFall`/`aurelFallDay` (`10195–10232`).

**Seevolk.** Zwei Clans, `S.seaSide` (`game.js:7442–7646`); Salzbund-Kapitäne in Salzhafen, Kupferhafen, Tangkron (`7155–7174`); Salzfrieden `seaPeace` (`7665–7670`), Weißbarts Tod `whitebeardSlain` (`7671–7683`, Hella wird Rächerin); Spieler-Piraterie `ownArrive` (−12 Ruf, `S.flags.piracy`, `7251–7255`). Salinen: `TRADES.salt` ohne Berufe, Tagelöhner in Salzhafen/Nordfurt (`economy.js:20, 31`). Tangkron liegt auf Karte `isle` und ist **nicht** in `S.towns` (ANNAHME aus `TOWN_LOCS = LOCATIONS kind village|city`, `economy.js:43`).

**Goblins.** `S.gobCity = { pts, lvl }`, Stufen 0/10/25/45/70 (`game.js:8141`), +1/Tag (+2 mit Außenposten), Spenden, Händler/Gelehrte +1, Ordensüberfall −5 (`8148–8157`). Goblin-Krieger bei Grisk ab Ruf 20 (`6244`).

**Oberfläche.** Kodex-Reiter: Handbuch, Lehrer, Magie, Ränge, Zustände, Gegner (`ui.js:201`); „Ränge“ zeigt nur Mächte, die der Spieler kennt (`S.factions[f] !== 0 || Rang`, `ui.js:220`). Fraktionsfenster `facUI` (`ui.js:915–939`) mit Ansehen, Rang, Krieg, Beziehungen (`facRelation`, feste Tabelle `game.js:13810–13816`).

**Proben.** `sandbox()` sichert Spieler, Karte, Gold, Tag, `S.flags/relations/factions/ranks/bounty/legend/stats` (`game.js:14633–14649`); `S.towns`, `S.war`, `S.eco`, `S.after` sichert sie **nicht** — Proben, die daran drehen, müssen selbst zurücksetzen (Muster in `varonheim_belagerung.md` §15).

## 5. Neues System (VORSCHLAG)

### 5.1 Grundgerüst: `S.facRes`
```
S.facRes = {
  day: 0,                                    // Tag der letzten Rechnung
  valen:  { v: Korn, stage },                // v = angezeigter Wert, stage = zuletzt gemeldete Stufe
  order:  { v: Eifer 0–5, stage },           // Speicher bleibt S.after.zeal; v ist Spiegel
  undead: { v: Seelen 0–200, stage },
  merch:  { v: Züge 0–100, stage },
  chain:  { v: Arbeitskraft (Köpfe), stage },
  aurel:  { v: Versorgung in Tagen, stage },
  sea:    { v: Salz (Hafenvorrat), prizes: Prisen der letzten 10 Tage, stage },
  goblin: { v: Hortpunkte, stage },          // Spiegel von S.gobCity.pts
}
```
- `SIM.facResDay()` steht in `sim.js` und wird **am Ende von `warDay`** aufgerufen (nach `economyDay`, damit Produktion und Züge des Tages gezählt sind). Was nur `game.js` kennt (Gefangene, Eifer, Hort, Luftschiffe-Spielerflags), liefert ein Hook `H.facSources()` → `{ labor, zeal, hort }`. Werte, die eigenen Speicher haben (Seelen, Züge, Prisen), leben direkt in `S.facRes`.
- Lesehelfer `SIM.facRes(f)` gibt `S.facRes[f]?.v ?? Vorgabe` zurück. **Jeder Verbraucher liest über den Helfer**, nie direkt — fehlt das Feld (alter Stand), gilt die Vorgabe und das Verhalten von heute. Das ist die ganze Migration.
- Schwellen: je Macht drei Stufen (niedrig / normal / hoch). Wechselt die Stufe, meldet `H.facSay(f, stage)` einmal: Log (`'faction'`), Chronik (`'news'`), Hinweis oben (unter `S._quiet` still). Die Meldung sagt immer **Ursache und Hebel** („Die Kette hat kaum noch Hände in den Gruben. Der nächste Feldzug wird klein ausfallen — wer Gefangene liefert, ändert das.“).
- Keine neuen `rnd()`-Aufrufe in `facResDay`. Wo ein Zufall nötig ist, hängt er an vorhandenen Würfen oder an einem Tageshash (`(S.seed * 7 + S.day * 13) % n`), damit die bestehenden Proben nicht wandern (Regel aus `CLAUDE.md`).

### 5.2 Valen — Korn (bleibt, wird nur sichtbar)
- `v` = `valenGrain` aus `warDay` (`sim.js:360`), Stufen < 10 / 10–40 / > 40.
- Kein neuer Verbrauch. **Eine Korrektur** (VORSCHLAG, klein): Die Heeresversorgung (`sim.js:43–47`) isst aus der **nächsten eigenen Stadt des Heeres** (`a.at`, sonst Nordfurt). Heute hungert ein Heer vor Salzhafen, weil Nordfurt leer ist. ANNAHME: kleiner Effekt; die 60-Tage-Schleife misst es.
- Kodex-Hinweis: „Valen wächst, solange seine Städte Korn haben. Jede Lieferung in eine Valen-Stadt hilft dem Heer.“

### 5.3 Orden — Eifer
- Speicher bleibt `S.after.zeal` (0–5). `facResDay` spiegelt ihn und ergänzt **Quellen**: +1, wenn die Toten ≥ 4 Knoten halten (höchstens einmal je 5 Tage, Tageshash), +1 je gewonnener Kreuzzug (`crusadeEnd`), +0,5 je verbrannter Hexe (Welle oder Prozess, besteht). **Senken**: −1 je geretteter Angeklagter (besteht), −1 je verlorener Kreuzzug, −0,5 Abklingen je 10 Tage ohne Anlass.
- **Wirkung** (gelesen in `faithDay`, `factionAgenda`, `gobDay`, Preisen):
  - Kreuzzug-Takt `12 − Eifer` Tage (Eifer 5 → alle 7 Tage); Siegchance `0,45 + 0,05 × Eifer` (+0,35 Spieler wie heute).
  - Eifer ≥ 3: Agenda „order“ sendet **zwei** Streifen, der Monster-Aushang zahlt ×1,3; Sonnwacht-Besatzung füllt +3 statt +2 (Deckel 20 bleibt).
  - Eifer ≥ 4: Ordensüberfall auf Grubenhort ohne Rundlauf-Würfel (`8155`: Chance 0,4 → 0,7); Inquisitoren prüfen auch Messing (Anschluss an T15 `STIGMA.brass`, nur Hook, Zahl kommt aus T15).
  - Eifer ≤ 1: keine Hexenjagd-Welle (besteht), Kreuzzug alle 12 Tage, Agenda „order“ hält Andachten; Lichtenrain-Händler verkauft Weihwasser/Verband 10 % billiger („der Orden ist milde“).
  - Preise: Ordensheiler (Elena, Lichtenrain) verlangen von Spielern ohne Ordensrang `+5 % × (Eifer − 2)` ab Eifer 3.
- Spieler-Hebel: Hexen retten/ausliefern (besteht), Kreuzzug mitreiten (besteht), Ketzer freikaufen (besteht), Seelenkammer zerschlagen (+1 Eifer, Orden lobt es).

### 5.4 Die Toten — Seelen
- `v` = Seelen 0–200, Start bei altem Stand `20 + 5 × Untotenknoten`.
- **Quellen** (je in der Funktion, die das Ereignis schon kennt): +1 je Untotenknoten am Tag („die Gräber geben“); `battleAbstract`/`battleCheck`: +`round(Verlust des Verlierers × 0,3)` **beider Seiten** — Tote ernten jedes Schlachtfeld, auch ihr eigenes; Dorfüberfall (`raidTick`-Ende) gewonnen: +`n`; „Erheben“ (`applyFate`): +`n`; Totenfürst-Spieler opfert eine Phiole am Totentempel: +2 (zusätzlich zu +3 Ruf).
- **Senken**: Ein neues Heer aus der Gruft (`sim.js:368–371`) kostet 30 Seelen und hat Stärke `20 + Seelen/5` (höchstens 50, Deckel bleibt); ohne 30 Seelen entsteht keins. Besatzungen füllen sich nur, wenn Seelen ≥ 1 je Knoten (−1 je gefülltem Knoten). Optional (Frage F2): Morvaths Heerzug (S1) zieht 40 Seelen ab, wenn er entsteht.
- **Wirkung sichtbar**: ≥ 120 „Die Gruft ist satt“: `materialize` nimmt `undeadMix(n, 'military')` statt nur Skelette (ANNAHME: nur Mischung, Stufe bleibt 4; die Varonheim-S3-Mischung bleibt wie dort geplant); Ossara verkauft Phiolen ×0,7. ≤ 20 „Die Gräber schweigen“: kein neues Heer, Besatzungen füllen nicht, Phiolen ×1,5, Dorfüberfälle (`raidDay`) halbe Chance.
- Spieler-Hebel: Dörfer verteidigen (verweigert Seelen), Seelenkammer zerschlagen (−30, besteht als Ort), Kreuzzug gewinnen (−10), Gräberfeld/Seelenhügel säubern (T12/T40 später, Hook `H.soulsSpend`), als Toter: Phiolen, Überfälle, Erheben.
- **Wichtig für S1:** Das Wachstum `min(4, 1 + 0,25 × Knoten)` (`sim.js:363`) bleibt unverändert, denn `capThreat` und die Nachbildung in `varonheim_belagerung.md` §17 rechnen damit. Seelen wirken nur auf **neue Heere** und **Besatzungen**.

### 5.5 Händler — Züge
- `v` = gleitender Handelswert 0–100: +4 je angekommenem Händlerzug (`caravanDay`, Zeile 295), +8 je Ankunft der Großen Karawane (`sim.js arrive`), +2 je `deliver()`, −6 je überfallenem Zug (`291`, `sim.js:209`), −10 bei `caravanDied`, −1 Abklingen je Tag. Spielerwagen zählt **nicht** (Exploit §14). Start bei altem Stand 50.
- **Wirkung** (gelesen in `caravanDay`, `factionAgenda`, Händlerpreisen, `postContract`):
  - Neue Züge am Tag: `2 + round(Züge / 25)` (0 → 2, 100 → 6); Wachen `ri(0, 2)` → `ri(0, 1 + (Züge > 60 ? 1 : 0))` plus **+1 Wache, wenn Züge < 30** (die Gilde zahlt Söldner — mehr Geleitaufträge: Lohn ×`1,5 − Züge/100`).
  - Gildenspeicher (`stockShock(best, 6)`): `6 × Züge / 50` (höchstens 10, unter 25 nichts — „die Lager sind leer“).
  - Händlerpreise bei `faction: 'merch'`-Läden (Mara, Gerold, Kontore): `× (1 + (50 − Züge) / 250)` → ±20 %.
  - Züge < 15 drei Tage lang: **Handelssperre** — die Große Karawane bleibt 3 Tage im Tor (`S.caravanBack`), Chronik, der Händler am Kontor spricht es an. Züge > 80: **Markttag** — in Eren und Nordfurt Verkaufspreise +15 % für einen Tag, Chronik „Die Gilde ruft zur Messe“.
- Spieler-Hebel: Geleit (besteht), Banden zerschlagen (T12 senkt `riskOf`), Lieferaufträge, Räuberei (als Rooks Mann sinkt der Wert, die Gilde bewaffnet sich — T12 Rook-Netz bekommt dadurch ein Gegenüber).

### 5.6 Die Kette — Arbeitskraft
- `v` = Köpfe: alle `e.captive && e.alive && !e.freed` (Pferch, Kettenzug, Steinbruch) + Tributdörfer `× 2` (Dörfer liefern Arbeit, kein Tribut heißt keine Fron). Heutiger Normalwert ANNAHME 12–20 (7 Pferch + Kettenzug + 3 Dörfer).
- **Senke / Wirkung:**
  - `planCampaign`: Größe = `clamp(round(Köpfe × K.mul), K.size[0] − 4, K.size[1])` mit `mul` raid 0,8 / zug 1,8 / heer 3,2 (bei 14 Köpfen ≈ heute; bei 4 Köpfen Stoßtrupp 4 statt 8–12, kein Heerzug: `heer` braucht ≥ 10 Köpfe, sonst wird ein Feldzug daraus). Erfüllt den Test „weniger Gefangene → kleinerer Feldzug“ aus TASKS.
  - Takte verlängern sich um `+ (10 − Köpfe)` Tage, wenn Köpfe < 10.
  - Agenda „Varg lässt die Mauern ausbessern“ nur bei Köpfen ≥ 8; sonst „Die Gruben stehen halb leer — Varg schickt Treiber in die Dörfer“ → der nächste Tribut wird `harsh` (doppelt).
  - Produktion der Eisenfeste läuft **schon** über die versklavten Arbeiter (FAKT `economy.js:13–23`). Keine Änderung nötig; der Kodex erklärt es.
  - Frage F4: **Sklavenjagd** als vierter Feldzugstyp gegen Grubenhort (oder Tributdörfer), wenn Köpfe < 6.
- **Tribut aus dem Dorfmarkt** (V14, TASKS-Pflicht): `tributeDay` nimmt `TRIB_TAKE` aus `S.towns[dorf].stock.grain` (bei Mangel Rest aus `meat`), `arriveTribute` legt es in `S.towns.kettenfeste.stock.grain` (ANNAHME: `kettenfeste` ist in `S.towns`; `LABOR.kettenfeste` legt es nahe — Engineer prüft). `T.vorrat` wird beim Laden **einmal** übertragen (`stock.grain += vorrat × 0,5`, dann `delete T.vorrat`; Frage F3). Dorf-Hunger fällt dann mit `t.hunger` der Wirtschaft zusammen (Abwanderung `ecoDay:271` besteht); die Tribut-Abwanderung (`5662`) bleibt als zusätzliche Spitze. Ernte +5 entfällt — die Felder der Dörfer produzieren über `TRADES.farm`.
- Spieler-Hebel: Pferche öffnen, Freikauf, Tributzug rauben (besteht: `T.harsh`), **Gefangene liefern** (T08-Gefangene an Vesk verkaufen: +1 Kopf, Kette +2, Grausamkeits-Ruf; Anschluss an T08 `captiveMenu` — Hook, keine neue Mechanik).

### 5.7 Aurelion — Versorgung (Frage F1)
- `v` = Tage Nahrung: `Σ (grain + meat) der Aurelion-Städte / Σ Tagesbedarf` (aus `S.towns`, `isAurel`). Stufen < 4 / 4–12 / > 12.
- **Quelle**: Import besteht (`airSupply`). Neu: **Gesandter nach Nordfurt** wird echt — bei Versorgung < 6 kauft Aurelion am Agendatag `min(12, Nordfurts Korn − 8)` Korn: Nordfurt −, Aurelheim +, Chronik „Aurelions Gesandter kauft Nordfurts Korn auf“. Folge: `valenGrain` sinkt → Valen wächst langsamer. Das ist die gewollte Kette Aurelion-Hunger → Valen-Schwäche.
- **Wirkung**: < 4 Tage: `tollMul` steigt gesichert um 0,1 je Agendatag (statt Würfel), Werke laufen halb (`t.hunger` besteht), am Brett in Kupferhafen hängt ein **Frachtauftrag** (`ordersDay`-Muster, Korn 15 Stück, Lohn ×2), Automaten-Streifen am Passamt fordern Zoll von Fremden (Text + 20 Gold oder Umweg). > 12 Tage: Aurelion exportiert von selbst (Händlerzüge aus Überschuss, besteht), Zölle fallen doppelt so schnell zurück, der Hohe Rat gibt ein Fest (Toast, Preise auf der Himmelsinsel −10 % für einen Tag).
- Spieler-Hebel: Luftschiffe reparieren/ausbauen (besteht), Wracks (T30 später), Korn liefern, als Varon-Freund den Gesandten abfangen (T40 Embargo), Händlerzug nach Kupferhafen geleiten.
- Magitech bleibt Ware im Markt. Alternative in F1.

### 5.8 Seevolk — Salz (Prisen als Verlust)
- `v` = Salzvorrat der drei Häfen `saltport + northcity + kupferhafen` (`S.towns`). Stufen < 20 / 20–80 / > 80. `prizes` = Prisen der letzten 10 Tage.
- **Senke**: Jeden Tag mit Tageshash (kein `rnd()`) eine **Prise der Sturmklinge** mit Wahrscheinlichkeit `0,10` (+0,10, wenn der Spieler `S.seaSide === 'raider'` ist und Zoll verweigert; 0 bei `S.flags.seaPeace`; nach `whitebeardSlain` 10 Tage lang 0,2 durch Hellas Schwarzsegel, dann 0,05): ein Hafen (Hash) verliert `min(12, salt × 0,3)`, Chronik „Die Sturmklinge kapert ein Salzschiff vor Salzhafen“, `prizes++`. Spieler-Piraterie (`ownArrive`, `pirated`) zählt als Prise.
- **Wirkung**: Salz < 20: Eren/Varonheim-Preis für Salz steigt von selbst (Mangel, besteht über `target/stock`); der Salzbund hängt in Salzhafen/Kupferhafen ein **Kopfgeld auf Schwarzsegel** aus (`postContract('merch','bounty')`-Muster mit `sea`-Ziel) und Ysolde zahlt Geleit ×1,5. `prizes ≥ 3`: Hellas Mannschaft auf Tangkron +2 Plünderer (`seaTagSpawn`), die Sturmklinge-Streife an der Küste erscheint (Begegnung auf der Straße Salzhafen–Nordfurt). Salz > 80: Salzbund-Schiffe „bringen Salz ins Binnenland“ — `stockShock(['eren','varonheim'], 'salt', +6)` am Agendatag, Chronik.
- Spieler-Hebel: Salzfrieden (besteht), Weißbart (besteht, Folge: Schwarzsegel), Geleit fahren (Seefahrt besteht), Prisen machen (besteht).

### 5.9 Goblins — Grubenhort (bleibt, bekommt Gegner)
- `v` = `S.gobCity.pts` (Spiegel), Stufen nach `GOB_LVL`.
- Neue Quelle: je befreitem Goblin, der den Hort erreicht (`freeCaptive` gob, `fl: 'freed'`): +1. Neue Senke: Ordensüberfall nach Eifer (§5.3), Sklavenjagd der Kette (F4). Wirkung besteht (Stadtstufe, Söldner). Kodex erklärt die drei Feinde des Horts.

### 5.10 Kodex „Mächte“ und Fraktionsfenster
- Neuer Reiter `['powers', 'Mächte']` in `codexUI` (`ui.js:201`), gleiche Sichtbarkeitsregel wie „Ränge“ (`ui.js:220`). Je Macht eine Karte: Name, **Ressource mit Wert und Pfeil** (Vergleich zu `facRes[f].prev`), ein Satz „Was sie bewirkt“, ein Satz „Wie du sie änderst“, zuletzt gemeldete Stufe. Daten liefert `A.powerGuide(f)` aus game.js (wie `rankGuide`).
- `facUI` (`ui.js:921–923`) bekommt eine `statline` „Ressource: Korn 34 ▲“ unter „Ansehen“.
- Erster Spielerhinweis: Beim ersten Stufenwechsel irgendeiner Macht ein Log „Im Kodex (H) unter ‚Mächte‘ steht, woher jede Macht ihre Kraft nimmt.“ (`S.flags.powersHint`).
- Koop: Kodex beim Gast braucht `S.facRes` im Zustandsdelta an Gäste (ANNAHME: coop.js schickt einen Satz Zustandsfelder; Engineer ergänzt das Feld — kein `SKIP`-Eintrag).

## 6. Spielererlebnis
Man liest eines Morgens: „Die Gilde ruft zur Messe — Nordfurt zahlt heute gut.“ Zwei Tage später ein Hinterhalt auf der Alten Straße, dann: „Die Gilde stellt den Zug ein. Söldner gesucht.“ Im Kodex steht, warum. Im Westen hört man, die Gruben stünden leer, seit die Pferche offen sind — und tatsächlich zieht der nächste Stoßtrupp der Kette mit vier Mann los und kehrt nicht zurück. Die Totenruinen im Westen bleiben voll. Der Orden merkt es, der Eifer steigt, der Kreuzzug kommt früher. In Kupferhafen hängt ein Frachtauftrag für Korn, und in Nordfurt ist das Brot teurer, weil ein Gesandter alles aufgekauft hat. Nichts davon ist eine Zwischensequenz; alles steht in Chronik, Gesprächen und Preisen, und jede Zeile sagt dem Spieler, wo der Hebel ist.

## 7. Entscheidungen des Spielers
- **Wem gehören die Hände?** Pferche öffnen (Kette schrumpft, Totenruinen erstarken, Grubenhort wächst) oder Gefangene liefern (Kette zieht groß, Grausamkeits-Ruf aus T08).
- **Wessen Brot?** Korn nach Nordfurt (Valen) oder nach Kupferhafen (Aurelion) — beides zahlt, beides verschiebt den Krieg.
- **Straßen halten oder melken:** Geleit und Bandenjagd (Züge hoch, billige Waren) oder Rooks Netz (Züge tief, Gilde bewaffnet sich, Geleitlohn hoch).
- **Seelen verweigern oder liefern:** Dörfer verteidigen, Seelenkammer zerschlagen — oder als Toter die Gruft füttern und größere Heere ernten.
- **Den Orden heiß oder kalt halten:** Hexen retten (Eifer sinkt, Grubenhort sicherer) oder Kreuzzüge reiten (Eifer steigt, Toten schwächer, Grubenhort in Gefahr).
- **Das Meer:** Frieden stiften, den König erschlagen oder selbst kapern.

## 8. Querwirkungen
| Bereich | Wirkung |
|---|---|
| NPCs | Gesandter Aurelions kauft sichtbar in Nordfurt (ein Besucher, transient); Vesk nimmt Gefangene an (T08-Hook); Kontorhändler, Ysolde, Grisk, Edda, Konrad sprechen die Stufe ihrer Macht an (je ein Satz in bestehenden Gesprächen) |
| Fraktionen | Kette: Feldzuggröße und Takt aus Köpfen; Orden: Kreuzzug aus Eifer; Tote: Heere und Besatzungen aus Seelen; Händler: Züge und Speicher; Aurelion: Zölle und Zukauf; Seevolk: Prisen und Kopfgelder; Goblins: Hort mit Feinden. `facRelation` bleibt (T40 ersetzt sie) |
| Wirtschaft | Tribut aus dem Dorfmarkt, Eisenfeste bekommt Korn; Aurelion kauft Nordfurts Korn; Salzprisen senken Hafen-Salz; Händlerpreise ±20 %; Gildenspeicher nach Zügen; Markttag/Handelssperre |
| Kampf | Gemischte Totenheere bei satter Gruft (`undeadMix`), Sturmklinge-Streife an der Küste, kleinere oder größere Kettenfeldzüge, früherer Kreuzzug |
| Erkundung | Frachtauftrag Kupferhafen, Kopfgeld auf Schwarzsegel, Sklavenjagd gegen Grubenhort (F4) als Verteidigungsereignis |
| Speichern | ein Objekt `S.facRes`, alle Felder mit Vorgabe; `T.vorrat` einmalig migriert |
| Koop | Wirt rechnet; `S.facRes` im Delta an Gäste für den Kodex; alle Hebel laufen über normale Gespräche |
| Leistung | eine Tagesrechnung über `S.ents.world` (Gefangene zählen) — `census()` läuft schon täglich, hier mitlaufen lassen |
| Varonheim S1 | keine Änderung an Wachstum (`sim.js:363`), `capThreat` oder Heerzug-Bedingung; einzig optional F2 (Seelenkosten beim Heerzug, additiv) |
| T12 | `riskOf` liest später Banden; T23 liefert die Gegenseite (Gildenwachen aus Zügen). Beide schreiben in `caravanDay` — Reihenfolge: T23 S4 nach T12 B1 oder umgekehrt, nie gleichzeitig |
| T40 | `S.facRes` ist die Grundlage für Heeresgrößen aller Mächte auf dem gemeinsamen Graphen; `FAC_REL` kann Stufen lesen („hungriges Aurelion bietet Valen Verträge an“) |

## 9. Emergenz (Ketten, die entstehen, ohne dass jemand sie schreibt)
1. Pferche offen → Köpfe 4 → Stoßtrupp 4 Mann → Totenruine hält → Totenknoten bleiben → Eifer +1 → Kreuzzug früher → Grubenhort wird überfallen → Goblins bitten den Spieler um Hilfe (bestehende Dialoge von Grisk).
2. Luftschiff abgestürzt → Versorgung 3 Tage → Gesandter kauft Nordfurts Korn → `valenGrain` < 10 → Valen +1 statt +3 → Front weicht → Bedrohung Varonheims steigt (S1 `capThreat`).
3. Spieler fährt für Rook → Züge 12 → Handelssperre → Geleitlohn ×1,4 → Spieler nimmt Geleitaufträge gegen die eigenen Leute (T12 Rook-Netz bemerkt es).
4. Die Toten verlieren drei Schlachten → Seelen trotzdem +30 (sie ernten jedes Feld) → neues Heer trotz Niederlagen — die Toten sind „eine Zivilisation mit Geduld“ (`FACTIONS.undead.desc`).
5. Weißbart tot → Schwarzsegel kapern zehn Tage → Salz tief → Salzpreis in Eren hoch → Eren-Händlerin klagt (`PROF_TALK`), Kopfgeld auf Schwarzsegel → der Spieler, der Weißbart tötete, räumt nun auf, was er anrichtete.

## 10. Risiken
- **Probenwanderung:** `warDay`/`caravanDay` sind Zufallsquellen; jede neue `chance()` verschiebt Kriegsproben (`CLAUDE.md`). Gegenmittel: Tageshash statt `rnd()`, Hunter vergleicht `RF.selftest()` vor/nach je Scheibe.
- **Zwei Hände in `warDay`:** S1 (Belagerung) und T23 S3 (Seelen) ändern dieselben Zeilen 363–371. T23 S1 hängt sich nur ans Ende von `warDay`; Seelen kommen erst, wenn S1 gemergt ist.
- **Tribut-Migration bricht Dorfhunger-Proben:** Proben zu `tribState` (Tributdörfer, Aufstand) lesen `T.vorrat`. Sie werden auf `stock.grain` umgestellt, nicht gelöscht.
- **Kette zu schwach:** Startet ein Spiel mit Pferch 0 (alter Stand vor §5d.1), zieht die Kette nur Stoßtrupps. Vorgabe bei fehlenden Zahlen: 14 Köpfe (heutiges Verhalten).
- **Aurelion-Zukauf leert Nordfurt:** Deckel `min(12, Korn − 8)` und nur an Aurelion-Agendatagen (jeder 5. Tag). ANNAHME: tragbar; messen.
- **Zu viele Meldungen:** Stufenwechsel sind seltene Ereignisse (3 Stufen, Hysterese ±10 %); kein Tagesspam.
- **Kodex-Spoiler:** Nur bekannte Mächte erscheinen (wie „Ränge“).

## 11. Alternativen
- **Eine Ressource „Macht“ 0–100 für alle** — einfacher, aber austauschbar; verliert die Identität (Seelen ≠ Salz). Abgelehnt.
- **Zwei Ressourcen je Macht** (Nahrung + Magitech, Salz + Prisen) — mehr Wahrheit, doppelter Aufwand, Kodex wird Tabelle. Abgelehnt zugunsten „eine Zahl, ein Hebel“; Prisen sind als Verlustzähler trotzdem sichtbar.
- **Alles sofort in T40** — der Graph braucht die Gründe vorher; ohne T23 wären alle Heere in T40 wieder `ri()`. Reihenfolge wie vom Entwickler beschlossen.
- **Nur Anzeige ohne Wirkung (Scheibe 1 allein)** — ehrlich, aber folgenlos; als Zwischenstand geeignet, nicht als Ziel.

## 12. Abhängigkeiten
- **T02** (Kriegs-Zahlen, TESTING) und **T09** (Läden am Stadtlager, TESTING): Preise ±20 % der Händler setzen auf T09-Preisen auf.
- **T07 Blutkult** (`cultDrain` bleibt neben Korn als Valen-Bremse).
- **T08** (Gefangene liefern an Vesk — nur Hook).
- **Varonheim S1** (Belagerung): T23 S3 erst danach.
- **T12** (Straßen) teilt `caravanDay` mit T23 S4 — nacheinander.
- **T15** (Messing-Stigma): Inquisitor-Hook bei Eifer ≥ 4 nur, wenn `STIGMA.brass` existiert.
- Vorarbeit für **T40** (`S.facRes` → Heeresgrößen) und **T30** (Luftraum liest Versorgung).

## 13. Aufwand
Mittel (TASKS: Medium). Grob: `sim.js` +150–250 Zeilen (facResDay, Seelen, Züge, Salz, Helfer), `game.js` +250–350 Zeilen (Hooks, Tribut-Umbau, Kette, Orden, Aurelion, Gespräche, Debug, Proben), `ui.js` +30–50 (Reiter, Statline), `docs` je Scheibe. Fünf Scheiben, jede einzeln testbar (§16).

## 14. Mögliche Exploits und Gegenmittel
- **Züge mit dem eigenen Wagen hochtreiben:** Spielerwagen zählt nicht; `deliver()` höchstens +4 am Tag.
- **Seelen farmen durch provozierte Schlachten:** nur Schlachten im Kriegsgraphen zählen (`battleAbstract`/`battleCheck`), Deckel 200; Phiolen-Opfer höchstens +2 je Tag.
- **Gefangene im Kreis verkaufen und befreien:** Verkauf an Vesk höchstens 2 je Tag; freigekaufte tragen `freed` und zählen nie wieder.
- **Salz aufkaufen, um Kopfgelder auszulösen:** Stufe nach 3-Tage-Mittel; Kopfgeld höchstens eins zur Zeit.
- **Eifer über Bestechung drücken:** Bestechung ändert Eifer nicht (nur Rettungen); Abklingen −0,5 je 10 Tage ist langsam.
- **Markttag ausnutzen:** +15 % nur Verkauf, nur ein Tag, nur in zwei Städten; Lager-Deckel `capOf` bleibt.
- **Aurelion-Zukauf als Nordfurt-Falle** (Spieler lässt Aurelion hungern, um Valen zu schwächen): gewollte Emergenz, gedeckelt (12 Korn je 5 Tage).

## 15. Daten- und Codeplan
**state.js** — nichts; `S.facRes` wird normal gespeichert (nicht in `SKIP`).

**data.js**
- `FAC_RES = { valen: { key: 'grain', name: 'Korn', unit: '', hint: '…' }, order: { key: 'zeal', name: 'Eifer' }, undead: { key: 'souls', name: 'Seelen' }, merch: { key: 'trade', name: 'Züge' }, chain: { key: 'labor', name: 'Arbeitskraft' }, aurel: { key: 'food', name: 'Versorgung', unit: 'Tage' }, sea: { key: 'salt', name: 'Salz' }, goblin: { key: 'hort', name: 'Grubenhort' } }` mit je `low`/`high` Schwellen und den beiden Kodex-Sätzen (`does`, `lever`). Alle Zahlen an einer Stelle für den Balance-Spezialisten.
- `CAMP_TYPES` bekommt `mul`; optional `CAMP_TYPES.jagd` (F4).

**sim.js**
- `facResDay()` am Ende von `warDay`; `facRes(f)` Lesehelfer; `facAdd(f, n, why)` Schreibhelfer mit Deckel und Stufenprüfung → `H.facSay`.
- `battleAbstract`/`battleCheck`: Seelenernte. `warDay` 368–371: neues Heer aus Seelen; 366: Auffüllen nur mit Seelen (erst nach S1-Merge).
- `arrive`/`caravanDied`: Züge ±. `materialize`: Mischung bei satter Gruft.
- `economyDay`: Heeresversorgung aus der Stadt des Heeres (§5.2).
- Export `facResView()` für UI und Proben.

**economy.js**
- `caravanDay`: Zahl neuer Züge und Wachen aus `facRes('merch')`; Ankunft/Überfall rufen `H.facTrade(±)`. `deliver`: +2 (Deckel). `ecoPrice`: Faktor für `merch`-Läden über Hook `S.after?.merchMul` oder direkt `facRes`.

**game.js**
- `bindSim`: `SIM.H.facSources`, `SIM.H.facSay`, `SIM.H.soulsSpend`.
- Kette: `planCampaign` Größe aus Köpfen, `campaignDay` Takte, Agenda „chain“; `tributeDay`/`arriveTribute` auf `S.towns`; `laborOf()`; Migration `T.vorrat` in `continueGame` (vor `SIM.initSim()`, nach `S.towns` existiert — Reihenfolge wie in `varonheim_belagerung.md` §5.12 beachten).
- Orden: `witchZeal` erweitern, `faithDay` Takt, `crusadeEnd` ±, Agenda, `gobDay` Überfall-Chance, Heilerpreise.
- Tote: `raidTick`-Ende, `applyFate`, Totentempel-Opfer, Seelenkammer, `crusadeEnd` −10.
- Aurelion: `foodDays()`, Agenda „aurel“ (Gesandter kauft, Zölle), Frachtauftrag (`S.eco.orders`-Muster mit `fac: 'aurel'`), Passamt-Zoll-Text.
- Seevolk: `seaPrizeDay()` (Tageshash), Kopfgeld-Aushang, `ownArrive` zählt, `whitebeardSlain` setzt `S.flags.blackDays = day + 10`.
- Goblins: `freeCaptive` +1 Hort.
- `powerGuide(f)` für Kodex; ein Satz je Sprecher in `talk()`-Hooks (Kontor, Ysolde, Grisk, Edda, Konrad, Gesandter).
- `debugSections`: Abschnitt „Fraktionsressourcen (T23)“.
- `selftest`: Proben §15 unten.

**ui.js** — Reiter „Mächte“, `statline` in `facUI`.

**Spielstand** (alle mit Vorgabe): `S.facRes`, `S.campNext` unverändert, `S.tribute[k].vorrat` entfällt nach Migration, `S.flags.powersHint`, `S.flags.blackDays`, `S.eco.orders[].fac`.

**Spielerhinweise:** Stufenmeldungen je Macht (Log, Chronik, Hinweis), Kodex-Reiter mit Hebel-Satz, Fraktionsfenster-Zeile, erster Hinweis auf den Kodex, ein Satz je Sprecher, Einträge in `docs/MECHANIKEN.md` je Scheibe.

**Debug** („Fraktionsressourcen (T23)“): Macht wählen + Wert setzen · Tag rechnen (`facResDay`) · Stufe erzwingen (Meldung) · Kodex „Mächte“ öffnen · Tribut jetzt · Feldzug planen (zeigt Größe) · Prise jetzt · Gesandter jetzt · Seelen +50 / −50 · Status (alle acht Werte als Text).

**Proben** (alle in `sandbox()`; `S.facRes`, `S.towns`, `S.war`, `S.eco`, `S.after`, `S.tribute`, `S.campaign`, `S.campNext`, `S.fort`, `S.gobCity`, `S.tollMul` sichern und zurücksetzen; `seedRng` fest, wo gewürfelt wird):
1. **Migration:** Stand ohne `S.facRes` → `facResDay()` liefert acht Zahlen ohne `NaN`; `T.vorrat: 60` → `stock.grain` +30, `vorrat` gelöscht; `facRes('chain')` ohne Gefangene = 14 (Vorgabe).
2. **Kette:** 7 im Pferch + Kettenzug → `planCampaign('zug')` ≈ heutige Spanne; Pferch leer, `freed` gesetzt → Stoßtrupp ≤ 6, `heer` wird `zug`; `q_pferch` senkt Köpfe am Folgetag.
3. **Tribut:** `tributeDay` an einem Tributtag senkt `S.towns.grauwasser.stock.grain` um 25; `arriveTribute` hebt `kettenfeste` um 25; Dorf mit Korn 0 → `t.hunger`.
4. **Orden:** Eifer 4 → nächster Kreuzzug nach 8 Tagen, Siegchance 0,65 (Formel prüfen, nicht würfeln); Rettung −1; Eifer ≤ 1 → keine Welle.
5. **Tote:** `battleAbstract` → Seelen +round(Verlust × 0,3); Seelen 10 → `warDay` erzeugt kein neues Heer, Besatzung bleibt; Seelen 60 → Heer Stärke 32, Seelen 30; Seelenkammer −30; Seelen 150 → `materializeForTest` spawnt mindestens zwei Typen.
6. **Händler:** drei Überfälle (`raided`) → Züge −18 → neue Züge/Tag ≤ 3, Geleitlohn ≥ ×1,3; Ankunft der Großen Karawane +8; Wert 10 drei Tage → `S.caravanBack` gesetzt, Chronik; Spielerwagen ändert nichts.
7. **Aurelion:** Aurelheim Korn 0, Fleisch 0 → Versorgung < 4 → Agendatag: Nordfurt −12 Korn, Aurelheim +12, `tollMul` +0,1, Frachtauftrag in `S.eco.orders` mit `town: 'kupferhafen'`.
8. **Seevolk:** Tageshash auf Prise → ein Hafen −Salz, `prizes` 1, Chronik; `S.flags.seaPeace` → keine Prise; Salz < 20 → Kopfgeld-Aushang; `whitebeardSlain` → `blackDays`.
9. **Goblins:** `facRes('goblin') === S.gobCity.pts`; `freeCaptive(gob)` +1; Eifer 4 → Überfall-Chance 0,7 (Formel).
10. **Kodex:** `codexUI` mit Reiter „Mächte“ rendert nur Mächte mit `S.factions[f] !== 0`; `codexAll` zeigt alle acht; Fraktionsfenster enthält „Ressource“.
11. **Stille:** `facResDay()` unter `S._quiet` erzeugt keinen Toast; Stufenwechsel meldet genau einmal (zweimal rechnen → eine Chronikzeile).
12. **Kein Zufallsverbrauch:** `rnd()`-Zählstand vor/nach `facResDay()` gleich (Probe zählt über eine Hülle um `rnd`, wie `ANNAHME`: state.js erlaubt kein Zählen → dann Vergleich zweier Läufe mit festem `seedRng`).
13. **60 Tage kopflos** (aus S1, Probe 9 dort): Ergebnis mit T23 S1 (nur Anzeige) identisch; mit S3 dokumentiert der Hunter die Abweichung in `BALANCE.md`.

## 16. Scheiben (einzeln testbar, jede mit MECHANIKEN + CHANGELOG + Debug)
- **S1 — Gerüst und Sicht (klein):** `S.facRes`, `facResDay`, Lesehelfer, `FAC_RES`-Tabelle, Kodex „Mächte“, Fraktionsfenster-Zeile, erster Hinweis, Debug-Abschnitt, Proben 1, 10, 11, 12, 13. **Nur Anzeige**, keine Wirkung — kann sofort nach Varonheim S1 laufen, berührt `warDay` nur am Ende.
- **S2 — Kette und Tribut (mittel):** Köpfe → Feldzuggröße und Takt, Agenda, Tribut aus dem Dorfmarkt, `T.vorrat`-Migration, Vesk nimmt Gefangene (T08-Hook), Sklavenjagd nach F4. Proben 2, 3. Erfüllt die TASKS-Tests „weniger Gefangene → kleinerer Feldzug“, „`q_pferch` wirkt“, „Tribut senkt Dorf-Korn, hebt Festen-Vorrat“, „`T.vorrat` migriert“.
- **S3 — Tote und Orden (mittel):** Seelen (Quellen, neue Heere, Besatzungen, Mischung, Phiolenpreise), Eifer (Quellen, Kreuzzug, Agenda, Grubenhort, Heilerpreise). Proben 4, 5, 9. **Erst nach Merge der Belagerung S1.** Kampf-Spezialist misst gemischte Heere mit `RF.simFight`.
- **S4 — Händler und Aurelion (mittel):** Züge (Zahl, Wachen, Speicher, Preise, Sperre, Markttag), Versorgung (Gesandter, Zölle, Frachtauftrag, Fest). Proben 6, 7. **Abstimmen mit T12 B1** (`caravanDay`).
- **S5 — Seevolk und Goblins (klein):** Prisen, Kopfgeld, Schwarzsegel-Tage, Salz ins Binnenland, Hort-Quelle. Probe 8.

## 17. Balance (ANNAHME-Ebene, zu messen)
- **Kette:** heutige Spannen bei 14 Köpfen: raid 11, zug 25, heer 45 — die Formel trifft die Mitte. Bei 7 Köpfen: 6 / 13 / kein Heerzug. Siegchance `0,45 + Größe/80` fällt damit von ≈ 0,76 auf ≈ 0,61 für den Feldzug — die Totenruinen halten öfter.
- **Tote:** Seelen bei stabiler Front: +5 Knoten/Tag + ≈ 6 aus einer Schlacht alle zwei Tage ≈ 8/Tag; neues Heer alle ≈ 4 Tage statt 0,35-Würfel täglich (≈ 3 Tage). Leicht seltener, dafür stärker (Stärke 20–50). Messung mit „Krieg 10 Tage vorspulen“ ×6 auf 5 Ständen wie bei S1.
- **Händler:** Basis `riskOf` 0,06 mit 16 Zügen ≈ 1 Überfall/Tag (−6) gegen ≈ 4–6 Ankünfte (+16–24) → der Wert steigt im Frieden auf 80+, fällt mit Banden (T12) oder Kriegsknoten auf 20–40. Gut: Der Normalzustand ist „Messe“, der Krieg frisst ihn.
- **Aurelion:** `airSupply` 1 → Import deckt 90 % → Versorgung ≈ 5–8 Tage (Bestand `target × 0,8`), knapp über der Hungerstufe — ein abgestürztes Schiff kippt sie. Gewollt: Aurelion ist reich, aber hungrig.
- **Seevolk:** 0,10/Tag ≈ eine Prise je 10 Tage, −12 Salz von ≈ 90 — spürbar, nicht ruinös. Nach Weißbart 10 Tage ×2.
- Alle Zahlen in `FAC_RES`/`CAMP_TYPES.mul`, damit der Balance-Spezialist sie ohne Suchen setzt.

## 18. Fragen an den Entwickler (höchstens 4)
**F1 — Aurelions Ressource**
- (A, empfohlen) **Versorgung** in Tagen Nahrung: Aurelion ist reich und hungrig; der Gesandte kauft Nordfurts Korn, Luftschiffe werden lebenswichtig (T30), die Kette zu Valen entsteht von selbst.
- (B) **Magitech**-Vorrat: passt zur Identität (Automaten, Prothesen), aber Magitech ist schon Ware im Markt und hat keinen Gegenspieler; Wirkung wäre vor allem Preis.
- (C) Beides als ein Index „Versorgung = min(Nahrungstage, Magitechtage)“: wahrer, aber im Kodex schwer zu erklären.

**F2 — Seelen und Morvaths Heerzug (Varonheim S1)**
- (A, empfohlen) Der Heerzug **kostet** 40 Seelen, wenn er entsteht, braucht sie aber nicht als Bedingung: S1-Balance bleibt, die Gruft ist danach leer (kein neues Heer für ≈ 5 Tage).
- (B) Der Heerzug braucht zusätzlich Seelen ≥ 60: der Spieler kann ihn über Seelen verhindern, aber die Nachbildung aus S1 §17 gilt nicht mehr und muss neu gemessen werden.
- (C) Seelen und Heerzug bleiben getrennt.

**F3 — Tribut-Migration (`T.vorrat`)**
- (A, empfohlen) Einmalig `stock.grain += vorrat × 0,5`, dann `vorrat` löschen; Tribut nimmt Korn (Rest Fleisch); Ernte +5 entfällt (Felder produzieren über die Wirtschaft).
- (B) `T.vorrat` bleibt Speicher, der Markt wird nur gespiegelt — kein Bruch, aber zwei Wahrheiten bleiben.
- (C) Tribut nimmt Korn **und** Fleisch zu gleichen Teilen — härter für die Dörfer, mehr Aufstände (`startBrawl` bei Vorrat < 15).

**F4 — Die Kette holt sich neue Hände**
- (A, empfohlen) Neuer Feldzugstyp **Sklavenjagd** gegen Grubenhort, wenn Köpfe < 6 und die Goblins frei sind: 8–10 Kettenkrieger, Hort −10 Punkte, +4 Köpfe bei Sieg; vor Ort verteidigbar wie Morrgrund; die Freien bleiben eigene Fraktion (§5c).
- (B) Keine Sklavenjagd — die Kette schrumpft dauerhaft, wenn der Spieler die Pferche öffnet (Ordensüberfälle bleiben der einzige Feind des Horts).
- (C) Sklavenjagd auch gegen die eigenen Tributdörfer (Menschen in den Pferch): grausamer, mehr Aufstände, aber die Dörfer könnten sich entvölkern.
