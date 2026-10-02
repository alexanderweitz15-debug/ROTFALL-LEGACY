# Luftbrücke für Belagerte (#21) und Verwundete nach Feldschlachten (#29)

**Status:** APPROVED im Grundsatz (Entwickler 01.10., Scout-Auswahl Runde 2) → hier umsetzungsreif, wartet auf die 4 Fragen (§18). **Autor:** Designer (Opus) · **Stand:** 01.10.2026
Kennzeichnung: **FAKT** (Datei:Zeile, per grep geprüft), **VORSCHLAG**, **ANNAHME** (im Spiel nicht geprüft).
Zwei getrennte Teile mit eigener Scheibe: **A Luftbrücke**, **B Verwundete**. Sie teilen sich Risiken, Debug-Abschnitt und Fragen.

---

## 0. Kurze Systemprüfung (vor dem Entwurf)
| Befund | Beleg | Folge |
|---|---|---|
| `siegeTick` zieht der Besatzung je Zug (6 Std.) 0,25 ab, **außer** `n.fedTill > S.day` | `sim.js:86` | Der Haken für Versorgung existiert schon |
| **`fedTill` wird nirgends gesetzt** (nur gelesen) | grep `fedTill`: nur `sim.js:86` | Die Luftbrücke ist der erste Schreiber. S3 (Gero „Versorgen“, `varonheim_belagerung.md` §5.5) wäre der zweite |
| Während der Belagerung füllen sich Besatzung und Mauern nicht (`capDay` kehrt früh zurück) | `sim.js:73` | Versorgung wirkt nur gegen den Hunger, nicht als Nachschub |
| Die Flotte gehört Aurelion: 2 Handelsschiffe (Kupferhafen ↔ „sued“), 1 Patrouille; `airSupply` = Anteil flugbereiter Handelsschiffe und speist Aurelions Nahrung | `economy.js:166–188`, `245`; `airDefaults` `177–182` | Ein umgeleitetes Handelsschiff fehlt Aurelion: echter Preis |
| `airSupply` zählt heute **jedes** flugbereite Handelsschiff, auch eines, das woanders hinfliegt | `economy.js:185–188` | Muss Schiffe mit Auftrag ausnehmen, sonst kostet die Luftbrücke nichts |
| `airPt(k)` kennt jeden Ort aus `TOWN_PLAN`, also auch Varonheim (`world.js:1394`, `capital: true`) | `economy.js:170–173` | Ziel ohne neue Daten möglich |
| Flugdauer: Kupferhafen (≈ 606, 795) → Varonheim (≈ 481, 148) ≈ 660 Kacheln / 250 = **≈ 2,6 Tage** bei Motor 100 | `airDays` `economy.js:190`, `world.js:1348`, `1357` | Hin und zurück ≈ 5,3 Tage |
| Absturz legt ein Wrack mit Überlebenden in die Welt (Großereignis) | `airCrash` `economy.js:202`; `airCrashed` `game.js:7328–7332`; Überlebende `10009` | Abschuss über dem Belagerungslager nutzt das vorhandene Ereignis |
| Passage nur für Aurelion-Rang ≥ 1, an der Hafenmeisterin Odila Kranz | `harborTalk` `game.js:7361–7373` | Charter dort, gleiche Hürde |
| Feldschlachten vor Ort: Heere werden Einheiten (`valen_soldier`, `kind: 'enemy'`, `armyId`); jeder Tote zieht `worth` vom Heer ab | `materialize` `sim.js:476–495`; `die` → `SIM.unitDied` `game.js:3536` | Haken für Verwundete: beim Tod einer Heereseinheit |
| Abstrakte Schlachten haben keine Einzelnen | `battleAbstract` `sim.js:378–388` | Für ferne Schlachten ein kurzlebiges „Schlachtfeld“ (§B.2) |
| Bewusstlose NPCs bluten über `downTimer` aus, außer sie werden versorgt (`tended`); andere NPCs in 300 px verbinden sie von selbst (BUG-113) und richten sie auf (S15) | `game.js:2760–2775` | Verwundete müssen vom Selbstverbinden ausgenommen sein, sonst ist die Wahl des Spielers wertlos |
| E an einem bewusstlosen NPC startet sofort das Aufrichten | `talk` `game.js:11269` | Verwundete bekommen davor ein eigenes Menü |
| Gefangenen-Menü (T08) für ergebene/bewusstlose Feinde: fesseln, anwerben (Loyalität 20), ausrauben, laufen lassen, hinrichten | `captiveMenu` `game.js:13270–13289` | Vorbild für Wortlaut und Ruf (`styleAct`) |
| Ruf der Klinge: `styleAct(n, why, e)` mit Tagesdeckel ±10 je Region | `game.js:13253–13258` | Schützt gegen Ruf-Farmen |
| Begegnung „Verwundeter am Weg“: Verband +8–25 Gold, Orden +2; Ausrauben +15–40 Gold, Moral −6 | `game.js:2603–2611` | Zahlen als Maßstab |
| Brüche heilen über `woundDay`, schneller mit Schiene beim Heiler (`woundCare`, 25 Gold) | `game.js:11103–11120` | Angeworbene Verwundete nutzen das |
| Feldzüge der Kette kehren schon mit Verwundeten heim (Rumpf auf 40 %) | `campResolve` `game.js:5886` | Kettenkrieger können dieselbe Regel bekommen |

---

# Teil A — Luftbrücke nach Varonheim (#21)

## A.1 Konzept
Wird Varonheim belagert, kann der Spieler in Kupferhafen ein aurelisches Handelsschiff **chartern**. Es fliegt Korn über die Mauern. Jede Ankunft hält die Besatzung **3 Tage satt** (`fedTill`). Der Preis: Gold, Korn aus Kupferhafens Lager, ein fehlendes Schiff in Aurelions Versorgung (Brot im Süden wird teurer) und das Risiko, über dem Heerlager der Toten abgeschossen zu werden. Ohne den Spieler fliegt **niemand**; die Welt-Balance der Belagerung bleibt unberührt.

## A.2 Gelöstes Problem
- Die Luftschiffe sind ein fester Punkt (TEAM.md §1), versorgen aber nur Aurelheim (Scout #21).
- `fedTill` ist toter Code: Der Hunger der Besatzung hat keinen Gegenspieler.
- Ein Spieler fern der Hauptstadt hat heute nur einen Hebel (Front halten, Bedrohung senken). Die Luftbrücke ist ein zweiter, mit Preis.

## A.3 Heutiges System (FAKT)
Siehe §0. Belagerung: Mauern −max(2; 5 % der Heeresstärke) je Zug, Heer −0,75 je Zug, Besatzung −0,25 je Zug ohne Versorgung, Sturm bei Mauern 0 (`battleAbstract` × 1,2), ein verlorener Sturm nimmt die Stadt (`sim.js:77–95`, `378–399`). Konstanten `CAP_SIEGE` `sim.js:33–34`.

## A.4 Neues System (VORSCHLAG)
```js
export const AIRLIFT = { gold: 120, grain: 10, fed: 3, risk: 0.12, dmg: [15, 35], escort: 60, aurelMin: 0, aurelCost: 2, aurelFree: 20, valen: 3, refund: 0.5 };
```
- **Charter** (`harborTalk`, nur sichtbar, solange `S.war.nodes.varonheim.siege` besteht):
  „Luftbrücke nach Varonheim chartern — 120 Gold + 10 Korn aus dem Lager (Tagespreis)“.
  - Bedingungen: Aurelion ≥ 0; Aurelion-Rang ≥ 1 **oder** Valen-Rang ≥ 1 (der König bürgt); ein Handelsschiff am Mast mit Hülle ≥ 50 und ohne Auftrag (`airBoardShip`-Logik, nur `kind: 'handel'`); Kupferhafen hat ≥ 10 Korn (`airPay({ grain: 10 })`, vorhanden).
  - Zusatzwahl „mit Geleit der Patrouille (+60 Gold)“: halbiert das Ankunftsrisiko; die Patrouille fliegt mit (`mission` auch an ihr).
  - Kosten bei Aurelion: −2, solange Aurelion < 20 („Die Krone sieht ungern, dass ihr Schiff Valen dient“), sonst 0.
  - Das Schiff bekommt `s.mission = { kind: 'airlift', to: 'varonheim', escort, day }` und `airDepart(s, 'varonheim')`.
- **`airSupply`** zählt Schiffe mit `mission` **nicht** mit (`economy.js:187`, Ausdruck in `airSupply`: `T.filter(s => airReady(s) && !s.mission)`). Eins von zwei Handelsschiffen weg → Aurelions Nahrungsimport −50 % für ≈ 5 Tage. Die Hafenmeisterin sagt es vorher: „Dann fehlt Aurelion ein Schiff. Das Brot wird teurer, bis es zurück ist.“
- **Ankunft** (`airDay`, Zweig `state === 'flug'`, wenn `d ≥ eta` und `s.mission`):
  1. Belagerung läuft noch und Valen hält die Stadt → Würfel `chance(0,12 + riskAir(s)) × (escort ? 0,5 : 1)`:
     - Treffer: Hülle −`ri(15, 35) × (1 − 0,2 × up.hull)`, Log „Knochenflieger reißen die Hülle der „Kupferwind“ auf.“ Hülle 0 → `airCrash(s)` an `airPt('varonheim')`; das vorhandene Großereignis legt das Wrack mit Überlebenden **vor die Mauern**. Ladung verloren.
     - Sonst (oder nach einem Treffer mit Hülle > 0): `n.fedTill = max(n.fedTill || 0, S.day | 0) + 3`. Valen +3. Chronik (`'battle'`) „Ein Luftschiff bringt Korn nach Varonheim“, Log mit Namen von Schiff und Spieler. Ist der Spieler nah (`nearPlayer`), Toast „KORN ÜBER DEN MAUERN“.
  2. Belagerung aufgehoben → Korn geht trotzdem an die Stadt (`S.towns.varonheim.stock.grain += 10`), kein `fedTill`, Valen +1.
  3. Stadt gefallen → Schiff kehrt um, 50 % der Kosten zurück (60 Gold), Log „Über Varonheim wehen die Fahnen der Toten. Die „Kupferwind“ dreht ab.“
  - Danach `s.mission = null`, `airDepart(s, s.home)`. Ein neuer Charter ist erst nach der Rückkehr möglich (≈ 5,3 Tage Umlauf je Schiff).
- **Mitfliegen** (nur nach Belagerung S3, Frage F2): Passage „an Deck der Luftbrücke“ landet den Spieler **in** der Stadt. Ohne S3 gibt es diese Wahl nicht, weil ein Spieler in Varonheim heute den Sturm vor Ort auslöst (`materialize`), dessen Kampfwerte S3 erst einstellt.
- **Hinweis beim Belagerungsbeginn** (`siegeTick`, `sim.js:79`, einmal je Spielstand `S.flags.hintAirlift`): Satz an das Log anhängen: „In Kupferhafen chartert man Luftschiffe — Korn über die Mauern hält die Besatzung satt.“ Die Hafenmeisterin erklärt es zusätzlich unter „Wie funktioniert die Luftbrücke?“.
- **Kriegskarte/Status** (`warSummary`, `sim.js:589`): „Besatzung satt bis Tag X“, solange `fedTill > day`.

## A.5 Balance: Messung (Nachbildung, ANNAHME-Ebene) und Messplan
**Methode:** `siegeTick`, Tageswachstum der Toten (`sim.js:451`, +2,5 bzw. +4 je Tag bis Deckel 110) und ein einzelner Sturm (`battleAbstract`, × 1,2) in Python nachgebaut (Notizblock, nicht im Repo), 20 000 Läufe je Zeile. **Ohne Entsatzheere**, also der schlimmste Fall; die Werte aus `varonheim_belagerung.md` §17 (etwa jeder zehnte Sturm fällt) enthalten Entsatz und sind deshalb niedriger. Gezeigt: Fallchance je Sturm in %, Besatzung beim Sturm.

| Heerzug / Wachstum je Tag | ohne Luftbrücke | 1 Lieferung (nur satt) | 2 Lieferungen (nur satt) | 2 Lieferungen + Besatzung +1 | 2–4 Lieferungen + Besatzung +4 |
|---|---|---|---|---|---|
| 70 / 2,5 | 38 % (Besatzung 52,5) | 28 % (55,5) | 23 % (57,2) | 19 % (59,2) | 17 % (60) |
| 70 / 4 | 68 % (53) | 59 % (56) | 53 % (57,2) | 46 % (59,2) | 44 % (60) |
| 80 / 2,5 | 63 % (53,5) | 52 % (56,5) | 50 % (57,2) | 43 % (59,2) | 40 % (60) |
| 80 / 4 | 81 % (53,8) | 73 % (56,8) | 72 % (57,2) | 66 % (59,2) | 65 % (60) |

- Der Sturm kommt unverändert nach ≈ 6,3–7,5 Tagen; die Luftbrücke ändert die Mauern **nicht**.
- **Empfehlung „nur satt“** (F1): höchstens 2 Lieferungen bis zum Sturm (ein Schiff schafft eine, zwei Schiffe zwei, weil die erste erst nach 2,6 Tagen ankommt). Wirkung: −8 bis −15 Prozentpunkte je Sturm, relativ −11 bis −39 %. Die Variante mit Besatzung +4 wirkt fast doppelt so stark (bis −55 % relativ) und ist für eine frisch kalibrierte Belagerung zu viel.
- Mauersteine per Luftschiff (Mauern +10 je Lieferung) verschieben den Sturm um ≈ 2–3 Tage und senken die Fallchance kaum, verlängern aber die Belagerung; nicht vorgeschlagen.

**Messplan im Spiel (Scheibe A, Pflicht vor [VERIFIED]):**
1. Debug „Belagerung jetzt (Heer 70 vor die Mauern)“ (vorhanden, `game.js:14437`) auf 3 Ständen, je 6 Läufe ohne und je 6 mit 2 erzwungenen Lieferungen (Debug „Luftbrücke: Ankunft jetzt“), `RF.tick` bis Sturm oder Abzug, `S._quiet = true`.
2. Gemessen: Besatzung beim Sturm, Sturmtag, Fall ja/nein, Entsatz ja/nein.
3. **Abnahme:** Besatzung beim Sturm mit Luftbrücke ≤ 58; relative Senkung der Fallrate ≤ 40 %; ohne Spieleraktion identische Zahlen wie vorher (Probe A5).
4. Danach einmal die 60-Tage-Messung aus `varonheim_belagerung.md` §16 S1 wiederholen (ohne Charter): Sie muss unverändert sein, weil ohne den Spieler niemand chartert.

## A.6 Entscheidungen des Spielers
Gold und Ruf bei Aurelion gegen Valen-Ruf und eine sicherere Hauptstadt; Aurelions Brot gegen Varonheims Besatzung; Geleit kaufen oder das Wrack vor den Mauern riskieren; ein Schiff oder zwei.

---

# Teil B — Verwundete nach Feldschlachten (#29)

## B.1 Konzept
Nach einer Feldschlacht liegen nicht nur Tote im Gras. Ein Teil der gefallenen Soldaten Valens (und der Kette) lebt noch, blutet und liegt bewusstlos. Wer hilft, gewinnt Ruf und vielleicht einen Gefährten; wer plündert, bekommt Gold und einen Ruf, der ihm folgt; wer weitergeht, lässt sie sterben. Untote werden nie verwundet.

## B.2 Neues System (VORSCHLAG)
```js
const WOUNDED = { pct: 0.35, perBattle: 5, bleedMin: 360, fieldDays: 1, fieldMax: 3, fieldN: [1, 4], valenDay: 6, recruitLoyal: 45, recruitMorale: 55,
  helpRep: 2, helpOrder: 1, helpStyle: 2, robGold: [5, 20], robStyle: -3, robWitness: -8, robBounty: 30, recruitCost: -2, mercyStyle: -1, wearyCut: 1 };
```
**Quelle 1 — Schlacht vor Ort** (Spieler dabei):
- In `die(c)` (`game.js:3536`): Ist `c` eine Heereseinheit (`armyId`) mit `faction` `valen` oder ein Feldzug-Krieger der Kette (`camp`), dann mit `chance(0,35)` statt einer Leiche ein **Verwundeter** an derselben Stelle. Höchstens 5 je Schlacht (`b.wounded`). Die Heeresstärke ist bereits abgezogen (`unitDied`), es entsteht keine zweite Rechnung.

**Quelle 2 — Schlachtfeld** (Schlacht fern, Spieler kommt bald):
- `battleAbstract` (`sim.js:378`) schreibt bei Valen-Verlust ≥ 5 einen Eintrag `S.war.fields.push({ node, day, n: clamp(round(Verlust / 10), 1, 4), fac: 'valen' })`, höchstens 3 Einträge, älteste raus.
- `battleCheck` (läuft „alle paar Sekunden“, `sim.js:539`): Kommt der Spieler einem Eintrag auf ≤ 35 Kacheln nahe und ist er nicht älter als 1 Tag, spawnen `n` Verwundete am Rand des Orts (`waveOrigin(node, 1)`, vorhanden), dann wird der Eintrag gelöscht. Nach 1 Tag verfällt er ungesehen.

**Der Verwundete** (`spawnWounded(fac, x, y, node)`):
- `guardChar(fac, pos, 'Verwundeter Soldat' | 'Verwundeter Kettenkrieger', ri(4, 6))`, `transient: true`, `fieldWounded: { fac, node, day }`.
- Körper: ein Glied gebrochen (`P.broken = ri(3, 6)`, `hp 0`), Rumpf unter 0 (`downed`), Status `bleeding`, `downTimer = 360 000` ms (6 Spielstunden = 6 Minuten echt).
- **Ausgenommen** vom Selbstverbinden (BUG-113) und vom Aufrichten durch Bewohner (`game.js:2762`, `2771`): Bedingung `&& !c.fieldWounded`. Sonst nimmt die Welt dem Spieler die Entscheidung ab.
- Läuft der Spieler weiter als 80 Kacheln weg, verschwinden noch liegende Verwundete wie Heereseinheiten (`game.js:10939`). Gilt als gestorben (Zählung für die Chronik).

**E am Verwundeten** öffnet `woundedMenu(e)` (Haken vor `startRevive` in `talk`, `game.js:11269`):
1. **Verbinden (1 Verband oder Kraut)** → Blutung weg, `tended`, nach 20 s steht er auf (25 % Rumpf, vorhandenes `koLift`) und geht als Reisender zur nächsten eigenen Stadt. Fraktion +2 (Deckel +6 am Tag aus Verwundeten), Orden +1, `styleAct(+2, 'Verwundete versorgt', e)`, Heilkunde +1. Valen-Kriegsmüdigkeit −1 (Anschluss an `npc_eigene_ziele.md` §5.2). Ohne Verband: „Blutung abbinden“ nur mit Heilkunde ≥ 15, sonst gesperrt mit Grund im Text.
2. **Anwerben** (nur nach dem Verbinden, Gruppenplatz frei, höchstens einer je Schlacht) → Gefährte mit Ausrüstung, Loyalität 45, Moral 55, Bruch bleibt (heilt über `woundDay`, schneller mit `woundCare`). Valen −2 („Du ziehst der Krone Soldaten ab“), **außer** Valen-Rang ≥ 1: dann „abkommandiert“, kein Abzug (Frage F3). Für die Kette gilt dasselbe mit Kettenrang.
3. **Ausrauben** → `ri(5, 20)` Gold, 40 % seine Waffe (`dropLoot`), `styleAct(−3, 'Verwundete ausgeraubt', e)`, Gruppenmoral −4 (außer `grausam`). Sieht es ein wacher Soldat derselben Seite (≤ 400 px): Fraktion −8 und Kopfgeld 30 („Leichenfledderei“). Der Verwundete blutet weiter.
4. **Gnadenstoß** → stirbt, `styleAct(−1, 'Gnadenstoß', e)`, kein Fraktionsabzug.
5. **Liegen lassen.**
- **Chronik je Schlacht** (einmal, wenn alle Verwundeten entschieden oder verschwunden sind): „{Spieler} versorgte die Verwundeten bei Aschfurt (3 von 4)“, „Die Verwundeten von Aschfurt starben im Schlamm“, oder bei Plünderung „Bei Aschfurt wurden Verwundete ausgeraubt“ (`'crime'`). Daraus werden Gerüchte.

## B.3 Spielererlebnis
Die Schlacht bei Aschfurt ist vorbei, Valens Banner steht. Zwischen den Knochen stöhnt ein Mann in blauem Rock, das Bein gebrochen. Der Spieler hat zwei Verbände für vier Verwundete. Er verbindet den Feldwebel, der aufsteht und sagt: „Ich schulde dir ein Bein. Brauchst du ein Schwert?“ Zwei andere verbluten, während er den dritten verbindet. Am Abend erzählt man in Nordfurt, wer bei Aschfurt half.

## B.4 Entscheidungen des Spielers
Wen versorgen (Verbände sind knapp, die Zeit läuft); helfen oder plündern (Gold gegen Ruf und Zeugen); anwerben (ein erfahrener, verletzter Kämpfer gegen Valen-Ruf); Gnade oder Liegenlassen.

---

## 8. Querwirkungen (≥ 3, beide Teile)
| System | Wirkung |
|---|---|
| Belagerung (`sim.js`) | `fedTill` zum ersten Mal gesetzt; Status in `warSummary` |
| Wirtschaft (`economy.js`) | `airSupply` ohne Charterschiffe → Aurelions Nahrung und Preise; Kupferhafen −10 Korn je Flug; Varonheim +10 Korn bei Ankunft nach der Belagerung |
| Luftschiffe | Verschleiß, Havarie, Absturz als vorhandenes Großereignis vor den Mauern; Werft muss reparieren |
| Fraktionen | Aurelion −2 (unter 20), Valen +3 je Ankunft; Verwundete: Valen/Kette ±, Orden +1 |
| Ruf der Klinge (T08) | Versorgen +2, Ausrauben −3, Gnadenstoß −1; Tagesdeckel ±10 schützt |
| Körper und Heilung (`body.js`, `woundDay`, `woundCare`) | Brüche, Blutung, Schiene beim Heiler für angeworbene Verwundete |
| Gruppe | Anwerben mit Loyalität 45 (zwischen T08-Gefangenem 20 und Gefährte) |
| Kriegsmüdigkeit (`npc_eigene_ziele.md`) | versorgte Valen-Verwundete senken sie |
| T23 Seelen | **nicht** berührt: Die Seelen aus `battleAbstract`/`battleCheck` (T23 §5.4) zählen den Verlust schon; Verwundete, die sterben, geben keine zweiten Seelen |
| T17 Regiebuch | optional: Ankunft der Luftbrücke mit Spieler in der Nähe als kurze Szene (Schiff, Säcke, Jubel) |

## 9. Emergenz
- Spieler chartert beide Handelsschiffe → Aurelions Nahrung fällt auf 20 % (Untergrenze 0,2, `economy.js:187`) → T23-Versorgung Aurelions sinkt → Aurelion wird schwächer (Entwicklerentscheid „Aurelion je nach Wohlstand stärker“) → Varonheim hält. Wer einem hilft, schwächt den anderen.
- Ein Schiff wird über dem Heerlager abgeschossen → Wrack mit Überlebenden vor den Mauern → der Spieler, der die Überlebenden rettet, steht plötzlich mitten in der Belagerung.
- Der Spieler versorgt nach jeder Schlacht Verwundete → Valens Müdigkeit bleibt niedrig → keine Deserteurbanden an der Front.

## 10. Risiken
- **Belagerungsbalance (A):** wirkt nur durch Spielerhandlung; Variante „nur satt“; höchstens ≈ 2 Lieferungen bis zum Sturm; Messplan §A.5 mit Abnahmegrenze. `CAP_SIEGE` bleibt unverändert.
- **Doppelter Hebel mit S3 (A):** Gero „Versorgen“ setzt ebenfalls Hunger aus. Beide schreiben nur `fedTill = max(…)`, sie addieren keine Besatzung. Gleichzeitig kein Doppelnutzen.
- **Ruf-Farmen (B):** Fraktion +6 am Tag aus Verwundeten, `styleAct`-Tagesdeckel, höchstens 5 Verwundete je Schlacht, Verbände kosten.
- **Leichenfelder (B):** Verwundete sind flüchtig, ≤ 5 je Schlacht, ≤ 3 Schlachtfelder gespeichert, verschwinden außer Reichweite.
- **Selbsthilfe-Logik (B):** Ausnahme `!c.fieldWounded` an genau zwei Stellen; Probe B3 prüft es.
- **Proben kippen:** neue `chance()` in `die` und in `airDay` (Ankunft). Proben, die `airDay` oder Heerestod nutzen, mit `seedRng`. `world.js` und sein `rnd()` bleiben unberührt.
- **Speichern/Laden:** gespeichert werden nur `s.mission` (Schiff), `S.war.fields`, `S.flags.hintAirlift`, `S.flags.hintWounded`; alle dürfen fehlen. Verwundete sind flüchtig: Nach dem Laden sind sie fort („weggetragen“), ein Schlachtfeld-Eintrag ≤ 1 Tag kann sie neu erzeugen. Ein Schiff mit `mission` und gefallener oder befreiter Stadt wird beim nächsten `airDay` sauber aufgelöst.
- **Koop:** Wirt rechnet; das Verwundeten-Menü öffnet sich für Gäste über die vorhandenen `uiHooks` wie das Gefangenen-Menü.
- **Leistung:** Luftbrücke einmal am Tag; Schlachtfeld-Prüfung ≤ 3 Einträge je `battleCheck`. Vernachlässigbar.

## 11. Einfachere Alternative
- **A klein:** Kein Flug. Die Hafenmeisterin verkauft „Korn nach Varonheim fliegen lassen (150 Gold)“; `fedTill` sofort +3, kein Risiko, kein `airSupply`-Effekt. Halber Aufwand, aber ohne Schiff, ohne Preis für Aurelion und ohne Wrack.
- **B klein:** Nur Quelle 1 (Schlacht vor Ort), nur Verbinden und Ausrauben (Text aus der Begegnung `game.js:2603–2611` wiederverwendet), kein Anwerben, keine Schlachtfelder.

## 13. Aufwand
- **A:** klein bis mittel. `economy.js` +40–60 Zeilen (`AIRLIFT`, Auftrag in `airDay`, `airSupply`), `game.js` +40–60 (Charter im Hafengespräch, Hinweis, Debug, Proben), `sim.js` +3 (Hinweissatz, `warSummary`).
- **B:** mittel. `game.js` +130–180 Zeilen (`spawnWounded`, `woundedMenu`, Ausnahmen, Haken in `die`, Chronik, Debug, Proben), `sim.js` +15 (Schlachtfeld-Einträge).

## 14. Exploits und Gegenmittel
- **Charter, dann sofort abbrechen für Valen-Ruf:** Ruf gibt es nur bei Ankunft.
- **Luftbrücke ohne Belagerung als billiger Korntransport:** Charter nur während der Belagerung; danach landet Korn einmalig in Varonheims Lager.
- **Verbinden, dann ausrauben:** Ausrauben ist nach dem Verbinden gesperrt (er steht auf und geht).
- **Anwerben am Fließband:** einer je Schlacht, Gruppenplatz nötig, Valen −2.
- **Eigene Verbündete erschlagen, um Verwundete zu erzeugen:** Nur `armyId`-Einheiten aus echten Schlachten zählen, getötet von Feinden (`source` nicht der Spieler oder seine Gruppe).

## 15. Daten- und Codeplan
**economy.js:** `AIRLIFT`; `airSupply` ohne `mission`; `airDay`: Ankunftszweig mit Auftrag (Würfel, `fedTill`, Absturz, Umkehr, Erstattung über Hook `airH.refund`); `airCharter(s, escort)` (setzt `mission`, `airDepart`).
**sim.js:** Hinweissatz in `siegeTick` (über `H.hintAirlift?.()`); `warSummary` „satt bis Tag X“; `battleAbstract` → `S.war.fields`; `battleCheck` → `H.fieldVisit?.(f)`.
**game.js:** `harborTalk` (Charter, Erklärung); `airH.refund`; `spawnWounded`, `woundedMenu`, `woundedChronicle`; Haken in `die` (`3536`) und `talk` (`11269`); Ausnahmen in der Bewusstlosen-Logik (`2762`, `2771`); Hinweise.

**Debug** (`debugSections()`, Abschnitt „Varonheim: Belagerung“ ab `game.js:14433` erweitern, dazu „Krieg und Gruppe“ `14472`):
- „Luftbrücke chartern (ohne Kosten)“, „Luftbrücke: Ankunft jetzt“, „Luftbrücke: Abschuss erzwingen“, „Besatzung satt? (fedTill ins Log)“
- „Verwundete hier spawnen (Valen ×3)“, „Schlachtfeld-Eintrag am nächsten Kriegsknoten“, „Verwundeten-Zählung ins Log“

**Proben:**
- **A1** Sandbox mit gesetzter Belagerung: `airCharter` → Schiff `mission`, `state 'flug'`, `eta − dep` ≈ 2,6 (±0,3) bei Motor 100.
- **A2** `airSupply` fällt, solange ein Handelsschiff `mission` hat, und steigt nach der Rückkehr wieder.
- **A3** Ankunft (Würfel über Hook auf „kein Treffer“) → `fedTill = Tag + 3`, Valen +3; danach `siegeTick` ohne Besatzungsverlust; nach Tag + 3 wieder −0,25.
- **A4** Stadt während des Flugs gefallen → kein `fedTill`, Erstattung 60 Gold, Schiff fliegt heim.
- **A5** Ohne Charter: zwei gleich gesäte Belagerungsläufe (`seedRng`) liefern dieselbe Besatzung und denselben Sturmtag wie vor der Änderung.
- **A6** Charter gesperrt: ohne Belagerung, bei Aurelion < 0, ohne Rang, ohne Schiff, ohne Korn (je mit Grund im Text).
- **B1** `die` einer Valen-Heereseinheit mit erzwungener Chance → Verwundeter mit `fieldWounded`, `downed`, `bleeding`, einem Bruch; Untoter nie.
- **B2** Höchstens 5 je Schlacht.
- **B3** Ein Bewohner 100 px daneben verbindet den Verwundeten **nicht** (BUG-113-Ausnahme) und richtet ihn nicht auf.
- **B4** Verbinden → Blutung weg, Valen +2, `styleAct` +2; sechster Verbund am selben Tag gibt keinen Fraktionsruf mehr (Deckel 6).
- **B5** Ausrauben mit Zeugen → Valen −8, Kopfgeld 30; ohne Zeugen nur Ruf der Klinge −3.
- **B6** Anwerben ohne Rang → Valen −2, Loyalität 45; mit Valen-Rang 1 kein Abzug.
- **B7** Schlachtfeld-Eintrag: Spieler auf 30 Kacheln innerhalb 1 Tag → `n` Verwundete; nach 2 Tagen → keine.
- **B8** Alter Stand ohne `S.war.fields` und ohne `mission` → `battleCheck` und `airDay` ohne Fehler.

## 16. Scheiben
- **L1 Luftbrücke (A)** mit Messplan §A.5. Proben A1–A6. Kann sofort gebaut werden (Belagerung S1/S2 ist im Baum).
- **V1 Verwundete vor Ort (B, Quelle 1)** mit Menü. Proben B1–B6.
- **V2 Schlachtfelder (B, Quelle 2)** und Chronik. Proben B7, B8.
- Je Scheibe: `docs/MECHANIKEN.md` („Luftbrücke“, „Verwundete nach der Schlacht“), `CHANGELOG`, Debug.

## 17. Hinweise für den Spieler (Pflicht)
- Belagerungsbeginn: Satz zur Luftbrücke im Log (einmal), Hafenmeisterin erklärt Preis und Wirkung („drei Tage satt, kein Ersatz für Mauern“).
- Erste Verwundete (`S.flags.hintWounded`): Toast „VERWUNDETE AUF DEM SCHLACHTFELD“, Log „Sie bluten aus, wenn niemand hilft. E: verbinden, anwerben, ausrauben. Wer zusieht, erzählt es weiter.“
- Der Verwundete selbst ruft (Sprechblase, alle 20 s, wenn der Spieler ≤ 200 px): „Hier … bitte …“.
- `warSummary` und Kriegskarte zeigen „satt bis Tag X“.

## 18. Fragen an den Entwickler (höchstens 4)
1. **Wie stark ist die Luftbrücke?**
   (A, **empfohlen**) Nur satt: 3 Tage kein Hunger je Ankunft. Fallchance je Sturm −8 bis −15 Prozentpunkte (Nachbildung ohne Entsatz).
   (B) Satt und Besatzung +4 je Ankunft: −16 bis −24 Punkte, fast doppelt so stark; für die frisch kalibrierte Belagerung zu viel.
2. **Wer fliegt?**
   (A, **empfohlen**) Nur auf Charter des Spielers; Mitfliegen in die belagerte Stadt erst mit Belagerung S3. Die Welt allein bleibt wie gemessen.
   (B) Aurelion fliegt auch selbst, wenn Valen und Aurelion befreundet sind; dann muss die 60-Tage-Messung neu laufen.
3. **Anwerben verwundeter Soldaten kostet Valen −2**, außer mit Valen-Rang ≥ 1 („abkommandiert“)?
   **Empfehlung:** Ja. So bleibt das Anwerben eine Abwägung, und ein Mann der Krone darf Soldaten mitnehmen.
4. **Ausbluten nach 6 Spielstunden** (6 Minuten echt), oder länger (12 Stunden)?
   **Empfehlung:** 6 Stunden. Die Entscheidung soll unter Zeitdruck fallen, wie im Downed-Grundsatz (kein Selbstheilen, schrittweises Aufrichten).
