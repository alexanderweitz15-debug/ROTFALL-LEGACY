# Vorschlag §5g.2 / T07 — Der Blutkult von Varonheim

FROM: Feature Designer (Agent 3, Opus) · Stand 01.10.2026 · Status: **WAITING_FOR_DEVELOPER** (Design fertig bis auf 6 Fragen am Ende)

Kennzeichnung: **FAKT** = im Code belegt (Datei:Zeile, Stand 01.10.; game.js wird parallel bearbeitet, Zeilen können um ±10 wandern) · **VORSCHLAG** = mein Entwurf · **ANNAHME** = nicht geprüft.

Leitlinie: Tiefe kommt aus Verknüpfung, nicht aus Menge. Fast jede Stufe läuft über ein vorhandenes System (Zeugen, Kopfgeld, Kerker, Titelklassen, Folgen in `S.after`, Kriegsgraph, Kamerafahrten). Neu sind nur: ein Zustandsobjekt `S.cult`, die Titelklasse `vampire`, die Tabelle `STIGMA`, eine Karte `katakomben`, sechs Gegnerarten und ein Boss.

---

## 1. Name, Konzept, Problem, Passung

**Name:** Der Blutkult von Varonheim (Fraktion „Der Blutkult“, intern `blut`; Kelch als Zeichen).

**Konzept:** In Varonheim verschwinden nachts Menschen. Wer hinschaut, findet Blutzeichen an Türen, Masken in Gassen, rotes Siegelwachs — und am Ende unter der Stadt die Katakomben, in denen die Verschwundenen in Pferchen hängen. Der Kult kann zerschlagen, geduldet oder übernommen werden. Wer vom Kelch trinkt, wird Vampir: stärker in der Nacht, brennt in der Sonne, muss trinken, und jeder, der es sieht, kann es melden. Der Blutfürst ist Kanzler Aldhelm, der Mann, der bestimmt, wer zum König vorgelassen wird.

**Gelöstes Problem:**
- Varonheim ist gebaut (§5g.1), aber leer an Handlung: Hof, Garde, Bewohner, keine eigene Bedrohung. **FAKT** Varons Hof hat nur die Kette Hauptmann → Verräter → Ritterschlag (`game.js:8236 varonChoices`).
- Varon hat außer den Untoten keinen Gegner; der Audit nennt „Blutkult am Hof“ als fehlende Fraktionsachse (**FAKT** `docs/audit/MASTER_REPORT.md` §9, Zeile 180).
- Es gibt keine gemeinsame Regel, wie die Welt auf ein sichtbares Makel reagiert. Der Audit verlangt eine gemeinsame Stigma-Tabelle, zuerst für Vampire, später für Messing (**FAKT** MASTER_REPORT §12 Zeile 242, TASKS T15 hängt an T07).
- §5g.8 braucht einen klaren Zustand „Varon noch im Krieg mit dem Kult“ (**FAKT** `docs/PLAN_ROADMAP.md` §5g Punkt 8).

**Warum es zu ROTFALL passt:** Grimdark ohne Heldenpathos. Die Ermittlung kann am Falschen enden (wie der Verräter-Auftrag, **FAKT** `game.js:8262–8268`: falscher Adliger wird hingerichtet, `S.flags.varonWrong`). Macht hat einen Preis, der sozial ist (Zeugen, Orden), nicht nur ein Zahlenwert. Die Andeutungen auf Aldhelm stehen schon im Spiel: „Der Kanzler bestimmt, was der König isst. Und was er denkt.“ (**FAKT** `game.js:8232`), „Die Kanzlei siegelt den ganzen Tag. Frag Aldhelm.“ (**FAKT** `game.js:8263`). Die Wendung ist also vorbereitet, nicht nachgeschoben.

---

## 2. Heutiges System (nur, was der Kult berührt)

| Bereich | FAKT | Datei:Zeile |
|---|---|---|
| Varonheim, Hof | Stadt `CAPITAL` auf der Weltkarte, Bergfried mit Portal `varonburg`; Garde `capGuard` transient; Varonsburg wird beim Betreten gebaut (`buildVaronburg`), Aldhelm ist dort ein `put()`-NPC Stufe 12, `varonChancellor`, transient | world.js:1357; game.js:8186, 8192, 8200, 8222 |
| Aldhelm heute | verkauft Audienz für 100 Gold; wird König Varon getötet, „regiert Kanzler Aldhelm“ (Chronik) | game.js:8238–8241, 3531 |
| Titelklassen | `TITLE_CLASSES` mit `resource{key,max,start,rule}`, `abilities`, `grades`, `mentor`, `excludes`, `cost`, `rep`; `tres/setTres`, `unlockTitle`, `forsakeTitle` (aufgegeben = für immer, `p.forsaken`), `setTitleClass`, `titleTick`, `titleAbility`, Grade über `GRADE_NEED` und `gradeTalk` | data.js:691–750; game.js:12324, 12340, 12356, 12371, 12389, 12395, 12416, 12477 |
| Feld `reversible` | steht in jeder Titelklasse (`false`), wird **nirgends gelesen** | data.js:691ff; Suche in game.js/ui.js leer |
| `titleTick` | läuft nur für `S.player` | game.js:2739 |
| Zeugen + Verbotenes | `magicSeen`: Zeugen im Umkreis 280, Fraktion mit `MAGIC_VIEW.hate` → `addBounty`, Zeugen fliehen, ab 3. Tat `spawnMageHunters` (Bann-Jäger) | game.js:11762–11795; data.js:765 |
| Mord / Stand | `bloodshed` (Zeugen 300, Kopfgeld), `murderOfRank` (Blutbann, Kirchenbann `S.flags.bann`, Jäger), `banned(fac)` | game.js:3591, 3619, 3629 |
| Kopfgeld, Festnahme, Kerker | `addBounty`, `bountyDay`, `spawnHunters` (gedeckelt), `arrestCheck`, `goToJail`, `jailTick` | game.js:5045, 5059, 5068, 7906, 8034 |
| Orden | Fraktion `order` (Ränge bis Meister), Mutter Aldis (Ordenspriesterin, Sonnwacht), Meisterin Ilva; Eifer `S.after.zeal` mit Hexenjagd-Wellen (`witchZeal`) | data.js:878, 979, 940; game.js:10298 |
| Sankt Serin | Tempelstadt in Aurelion, Prop „Heilquelle“, Mutter Aveline mit Segen (`serinBless`, 1×/Tag) | game.js:8293, 8326–8330 |
| Folgen | `S.after` über `AF()`, `afterSay`, `afterAvenge` (Rachetrupp, auch Kit `order`), `afterDay/afterHour`; fehlt ein Feld = nichts geschehen | game.js:9906–9916, 10410 |
| Kriegsgraph | Valen wächst täglich `(Korn>10 ? 3 : 1) + min(3, 0,3 × Untotenknoten)`; Hooks über `SIM.H` | sim.js:357–364, sim.js:7 |
| Kamerafahrten | `cinematic(shots, done)` mit `zoom`, `focus`, `setup`, Überspringen führt Folgen aus | game.js:8911–8940 |
| Bosskämpfe | Phasenmuster `garmadonAI` (60 %/30 %, `invuln`, Verstärkung, Ansage); `BOSS = {hp:2, dmg:0,6}`; `BOSS_LOOT` | game.js:4044, 1623; data.js:428 |
| Karten | `DUNGEONS` (Name, Boden, `open`), `MAP_KEYS`; beim Laden `S.ents[m] ||= []`; `FRESH` listet jede Karte; `ARRIVAL` baut Karten beim Betreten | world.js:2016–2030; game.js:1967–1968, 4980 |
| Tag/Nacht | `S.minute`, `hourNow()`, `nightNow()` = 19–5 Uhr; Wetter nur draußen, im Haus kein Wetter (`wxOf`, `R.playerInside`) | game.js:2144, 10945, 2167 |
| Lebensraub | Treffer-Heilung über `afx(attacker,'leech')` und Todesritter-Schlüssel `k_bloodlord` (heißt im Spiel „Blutfürst“) | game.js:3288, 3293; data.js:869 |
| Gespräche | Hook-Kette in `talk()` (… `varonChoices`, `cityChoices`) | game.js:11103 |
| Gerüchte | Chronik wird Tratsch (`gossip`/`recentNews`), Gerüchte-Aufträge `rumorOffer`/`RUMOR_TXT` | game.js:11263, 11349 |
| Team-Logik | `teamOf`: Feinde `foe`, Ausnahmen je Fraktion/Flag (z. B. Untote je nach Rang) | game.js:3045, 3059 |
| Figuren | `face:'mask'` gibt es (Metallmaske); `face` ist in `SPEC_KEYS` | sprites.js:209; fig5.js:688 |

**Namenskollisionen (FAKT):** Garmadons Gruft hat eine Ebene „Die Blutkatakomben“ (world.js:2167, 2176). Der Todesritter-Schlüsselknoten heißt „Blutfürst“ (data.js:869). Das Legendär-Affix `thirst` heißt „Blutdurst“ (data.js:45). „Blutbann“ ist der Adelsmord-Bann (game.js:3617). → Siehe Risiken R1.

---

## 3. Neues System (Überblick)

**VORSCHLAG** — fünf Bausteine, jeder hängt an einem vorhandenen System:

1. **`S.cult`** (Zustand des Kults, gespeichert) treibt Unterwanderung, Ermittlung, Ausgang. Ein Helfer `cultWar()` beantwortet für §5g.8 „Ist Varon noch im Krieg mit dem Kult?“.
2. **Unterwanderung in Varonheim**: Maskierte nachts, Verschwundene (echte Bewohner verschwinden und hängen später in den Katakomben), Blutzeichen, vier Spurarten, drei Verdächtige.
3. **Katakomben von Varonheim** (`katakomben`, beim Betreten gebaut wie die Varonsburg, kein Zufall aus `world.js`): Pferche mit den Verschwundenen, Kelchhalle, Krypta des Kanzlers.
4. **Titelklasse Vampir** mit Blutdurst, Sonnenregel, Trinken, Zeugen- und Ordensreaktion über **`STIGMA`**, heilbar bei Mutter Aldis oder an der Heilquelle von Sankt Serin.
5. **Aldhelm / Blutfürst**: Enthüllung genau einmal, Bosskampf, dessen Schwierigkeit vom bisherigen Spiel abhängt (wie viele Verschwundene noch leben, Tag oder Nacht).

---

## 4. (a) Ablauf der Ermittlung — Stufen, Auslöser, Fehlschläge, Seitenwechsel

`S.cult.stage`: 0 ruhend · 1 Verschwundene · 2 Spur · 3 Katakomben bekannt · 4 Enthüllt · 5 Ende (`S.cult.end` gesetzt).

### Stufe 0 → 1: „Die Vermissten“
- **Auslöser (VORSCHLAG):** erster Besuch in Varonheim ab Tag 3 **oder** erste Audienz beim König (`S.flags.varonAudience`). Ohne Besuch startet der Kult an Tag 12 von selbst (die Welt wartet nicht).
- **Was passiert:** jede zweite Nacht (22–4 Uhr) verschwindet ein Bewohner von Varonheim (`homeTown === 'varonheim'`, kein Händler, keine benannte Figur). Das Objekt wird aus `S.ents.world` genommen und vollständig in `S.cult.missing` gelegt (Name, Haus, Aussehen bleiben). An seiner Haustür erscheint ein transientes Prop „Blutzeichen“ (`clue:'mark'`). Wohlstand der Stadt −2 je Fall (`growthOf('varonheim').prosper`, **FAKT** Muster game.js:6861, 3564).
- **Hinweis an den Spieler:** Protokoll + Chronik „In Varonheim fehlt seit heute Nacht …“, ein Schild „Vermisstenliste“ am Platz (transient, Text aus `S.cult.missing`), Tratsch in anderen Städten über die Chronik (**FAKT** `recentNews`).
- **Maskierte (sichtbar nachts):** 1–2 `blood_cultist` mit `disguised:true` gehen durch die Gassen; `teamOf` = neutral, bis sie zugreifen oder angegriffen werden (dann `foe`, Wachen greifen ein — **FAKT** Wachen sind Team `player`, game.js:3065). Steht der Spieler nah (≤ 300, freie Sicht) bei einem Zugriff, bricht der Maskierte ab und flieht. Tot oder ergeben → Gegenstand `blutmaske` (Spur).

### Stufe 1 → 2: „Spuren“ (3 von 4 Spuren nötig)
| Spur | Quelle | System |
|---|---|---|
| `mark` | Blutzeichen an einer Tür untersuchen (E) | Prop mit `clue` (neues Flag in `interactables`, **FAKT** game.js:4637) |
| `witness` | Nachbar eines Opfers: „Schritte, Masken, ein Wagen ohne Licht“ | Gesprächs-Hook `cultChoices` in der Kette game.js:11103 |
| `wax` | rotes Siegelwachs am Tatort oder im Gespräch mit dem Hofschreiber | knüpft an Varons Siegelwachs-Auftrag (game.js:8262) |
| `mask` | Blutmaske eines Maskierten | Beute, Kampf |

Drei Spuren → Stufe 2, Hinweis „Drei Spuren führen zu drei Menschen“ (Toast + Tagebuch-Eintrag als Auftrag `c_cult`).

### Stufe 2 → 3: „Drei Verdächtige“ (drei Wege)
Transiente NPCs in Varonheim (`ensureBloodCult`): **Wido**, Totengräber (kennt das Beinhaus); **Merle**, Apothekerin (verkauft Aderlassschalen — falsche Spur); **Albin**, Hofschreiber der Kanzlei (wahrer Kultist).

- **Weg A — Anklage:** beim Hauptmann der Königsgarde (capGuard am Platz) einen Namen nennen.
  - Richtig (Albin): Er kommt in den Kerker. Wer ihn **noch am selben Tag** dort verhört, bekommt den Schlüssel zum Kanzleikeller (Eingang B). Sonst ist er am nächsten Morgen tot („Gift. Niemand war bei ihm.“), `S.cult.heat +1`, Schlüssel liegt dann in seiner Kammer (Durchsuchen = Diebstahl vor Zeugen, **FAKT** Möbel-Zeugen game.js:4687).
  - Falsch: Unschuldige/r wird im Morgengrauen gehängt (Chronik, Valen −3, Tratsch „der Falsche“), `S.cult.heat +1`, eine Entführung mehr. Ermittlung geht weiter (nicht gescheitert, nur teurer).
- **Weg B — Beschatten:** nachts einem Maskierten folgen, ohne dass er dich sieht (Abstand > 160, sonst flieht er) → er führt zur Gruftpforte am Friedhof (Eingang A wird dauerhaft sichtbar). Später mit Schleichen (A4/T37) besser, jetzt nur Abstand.
- **Weg C — Wido gewinnen:** Beziehung 10 oder 50 Gold → er öffnet das alte Beinhaus (Eingang A).

### Stufe 3: Katakomben (siehe c) — Pferche, Kelchhalle, Hedda
In der Kelchhalle wartet **Hedda, die Kelchwahrerin** (Priesterin, transient, Mentorin der Titelklasse). Sie greift nicht sofort an:
- „Trink“ → **Beitritt** (Seitenwechsel, unten).
- „Ich bin gekommen, euch zu beenden“ → Kampf (Hedda = Elite `blood_mage`-Basis).
- Auf ihrem Pult: **„Rotes Siegel“** (Gegenstand, Beweis) und Briefe mit dem Siegel der Kanzlei.

### Stufe 3 → 4: Die Enthüllung (genau einmal, `S.cult.reveal = Tag`)
Eine Funktion `cultReveal(how)` mit Sperre (zweiter Aufruf tut nichts). Drei Wege dorthin:
1. **Beweis zum König:** mit Rotem Siegel und Audienz „Majestät, Euer Kanzler …“ → Kamerafahrt am Hof: Aldhelm lächelt, das Siegel bricht in seiner Hand, die Kerzen am Thron verlöschen, er flieht durch die Geheimtür der Kanzlei. Marschall Brandt und zwei Gardisten folgen dir als Verbündete in die Krypta (transient).
2. **Ysmay:** wer der Spitzelmeisterin Siegel + Wachs zeigt, bekommt ihre Deutung („Nur eine Hand siegelt mit Rot“); sie geht nicht zum König — Enthüllung ohne Hof-Szene, Kampf ohne Verbündete.
3. **Von innen (Kult-Weg):** Bei der Blutweihe nimmt Aldhelm die Maske ab.

**Ohne Beweis beim König:** Varon glaubt nicht (Valen −5), Aldhelm ist gewarnt: `S.cult.heat +1` und ein Rachetrupp „Maskierte des Kanzlers“ (`afterAvenge('blut', 3, …)`, **FAKT** game.js:9916).

### Stufe 4 → 5: Krypta, Blutfürst, Ausgang (siehe c, d)
Sieg → `end:'destroyed'`. Erpressen statt kämpfen (einmal 500 Gold, Aldhelm „vergisst“ dich) → `end:'hidden'`. Flucht oder Tod des Helden → Kult bleibt auf Stufe 4.

### Fehlschläge und Zeitdruck
- **Zu spät:** Verschwundene, die länger als 6 Tage im Pferch hängen, werden **Blutknechte** (behalten den Namen: „Bäcker Jost, Blutknecht“). Höchstens 4 im Pferch; ab dem 5. wird der älteste zum Knecht. Gesamtdeckel 8 Fälle, damit die Stadt nicht ausblutet.
- **Rote Krönung (Uhr):** Ab Stufe 3 (der Spieler weiß Bescheid) oder ab Tag 45 läuft `S.cult.crown = Tag + 20`. Ist der Kult dann nicht zerschlagen, stirbt Varon „im Schlaf“, Aldhelm wird Reichsverweser → `end:'ruling'`. Auf Angsthase (`afterHeals()`, **FAKT** game.js:9903) läuft die Uhr nie von selbst ab.
- **Varon stirbt anders** (Spieler, Krieg): **FAKT** game.js:3531 setzt `S.flags.varonDead`, „Kanzler Aldhelm regiert“. VORSCHLAG: Ist der Kult dann noch aktiv, springt die Krönung sofort → `ruling`.
- **Aldhelm stirbt vor der Enthüllung** (Mord am Hof): normale Folgen (**FAKT** `murderOfRank` → Blutbann). Hedda wird Herrin des Kults, Boss in der Krypta wird „Hedda, Blutmutter“ (schwächer, ohne Fesseln). Findet der Spieler später das Rote Siegel, hebt Varon den Bann auf („Du hast den Richtigen getötet, nur zu früh“).

### Seitenwechsel: dem Kult beitreten
- **Zugang:** Hedda in der Kelchhalle, **oder** nachts in Varonheim, wenn du Ausgestoßener bist (Valen ≤ −20 oder Valen-Kopfgeld ≥ 100): ein Maskierter spricht dich an — „Der Kelch sucht die, die der König verstößt.“
- **Kelch trinken** = `unlockTitle('vampire', 'Kelchhalle')`, `S.cult.joined = Tag`, Kult-Figuren werden Team `player`.
- **Drei Kult-Aufträge** (je über vorhandene Systeme):
  1. *Ein Gefäß:* einen Bewohner nachts allein ansprechen und in die Gruft locken (Willenskraft-/Beziehungsprobe; folgt wie ein Begleiter). Zeugen → Kopfgeld „Entführung“. Er landet in `S.cult.missing` — du hast es getan.
  2. *Asche der Beweise:* Ysmays Pult in der Varonsburg nachts durchsuchen, ohne gesehen zu werden (**FAKT** Möbel-Zeugen) → `heat −1`, Ysmay verliert die Spur.
  3. *Der Jäger:* Bruder Anselm, Vampirjäger des Ordens, kommt ab Stufe 2 nach Varonheim. Ihn töten = Mord an einem Geweihten (**FAKT** Kirchenbann). Ihn verschonen und belügen = Willenskraft-Probe, er zieht ab, kommt aber wieder.
- **Blutweihe** (Grad II, bei Aldhelm in der Krypta): Enthüllung von innen.
- **Grad III — zwei Wege:** *Rote Krönung* mit Aldhelm (Varon stirbt, `end:'ruling'`, Spieler ist rechte Hand) **oder** *Das stärkere Blut*: Aldhelm in seiner Krypta herausfordern → Bosskampf ohne Pferch-Fesseln, Sieg → `end:'player'` (siehe Frage 4).
- **Verrat jederzeit möglich:** Ein Kult-Mitglied kann mit dem Roten Siegel zum König gehen → `destroyed`, bleibt aber Vampir.

---

## 5. (b) Titelklasse Vampir

```
vampire: { name:'Vampir', title:'Gezeichneter', glow:'#c0303a', faction:'blut', excludes:['monk'], reversible:true,
  resource:{ key:'blood', name:'Blutdurst', max:100, start:30, css:'corruption',
    rule:'Steigt von selbst (+4 je Spielstunde) und mit jeder Titelfähigkeit. Trinken senkt ihn. Ab 70 bist du stärker, aber man sieht es dir an; bei 100 packt dich die Raserei.' },
  abilities:['feed', 'blood_lash', 'mist_step', 'thrall_gaze', 'bat_swarm', 'red_harvest'],
  grades:[['feed', 'blood_lash', 'mist_step'], ['thrall_gaze', 'bat_swarm'], ['red_harvest']], mentor:'hedda',
  deed:'Trinken und Titelzauber in der Nacht',
  gradeNames:['Gezeichneter', 'Kind der Nacht', 'Herr des Kelchs'],
  passive:{ name:'Nachtgeschöpf', desc:'Nachts +10 % Schaden; ist der Blutdurst unter 50, heilen Wunden nachts langsam (0,4/s).' },
  flaw:{ name:'Das Licht brennt', desc:'Im Sonnenlicht verbrennst du; in Haus, Höhle, unter Kapuze oder Wolken weniger.' },
  cost:{ desc:'Dein Herz schlägt kalt: Tränke, Verbände und Heilzauber wirken nur halb.', healMul:0.5 },
  rep:{ blut:40, order:-40, valen:-10 },
  unlock:'„Der Kelch“: in den Katakomben unter Varonheim von Hedda, der Kelchwahrerin, trinken.' }
```
VORSCHLAG. Erfüllt die vorhandenen Schema-Proben (**FAKT** game.js:15027–15029: `rule`, `max>0`, ≥3 Fähigkeiten, `unlock`, symmetrische `excludes` → Mönch bekommt `excludes:[…,'vampire']`; game.js:15867: `gradeNames.length===3`, alle Grad-Fähigkeiten mit `title`; **aber** Mentor muss in `NPCS` oder `GOBLIN_VILLAGE` stehen → Hedda ist transient, Probe braucht eine Liste erlaubter transienter Mentoren, siehe Risiko R4).

### Blutdurst (Ressource, Muster: Verderbnis des Hexenmeisters)
**FAKT** Der Hexenmeister nutzt schon „Ressource steigt mit Fähigkeiten, Folge bei hohem Wert“ (`ab.gain` → `corrupt`, game.js:12686; Makel ab 70, game.js:12446ff). Vampir übernimmt das Muster:

| Blutdurst | Zustand | Wirkung (VORSCHLAG) |
|---|---|---|
| 0–29 | Gesättigt | Nachtgeschöpf voll; kein äußeres Zeichen |
| 30–69 | — | normal |
| 70–89 | Durstig | +15 % Schaden, rote Augen (`glow`), Stigma Stufe 1 auch nachts, Ausdauer-Erholung −20 % |
| 90–99 | Gierig | Hinweis „Du riechst Blut“; Menschen in der Nähe werden markiert |
| 100 | Raserei | 4 s keine Steuerung: greift den nächsten Menschen an (auch Gefährten, Bürger). Willenskraft-Probe verkürzt auf 2 s. Danach 85. Folgen laufen über **FAKT** `bloodshed`/Angriff-Zeugen (game.js:3591, 4628) |

Anstieg +4 je Spielstunde (= +4 je Echtzeitminute, also von 30 auf 100 in ~17 min ohne Trinken) — ASSUMPTION zur Spielbarkeit, mit Debug „Blutdurst setzen“ prüfen. Am Boden (`downed`) steigt er nicht und nichts heilt (Downed-Regel).

### Trinken (`feed`, Grad I, kein Preis, 2 s Kanal, unterbrechbar)
- **Ziele:** Menschen, die **am Boden**, **ergeben** (`surrendered`), **gefesselt/gefangen** oder **schlafend** (nachts im Bett, ANNAHME: Schlafzustand ist am NPC lesbar) sind; dazu die freiwilligen „Blutspender“ der Kelchhalle (1 je Tag). Keine Untoten, keine Automaten. Goblins: nur −20, „bitter“.
- **Wirkung:** Mensch −45 Blutdurst, Tierblut (Beute/Wild, `prey`) −10 und nie unter 50; `blutphiole` −25 (Hedda verkauft 3/Tag zu 40 Gold; Fund in den Katakomben).
- **Opfer:** Status „Ausgezehrt“ (−30 % Leben, 1 Tag). Zweites Trinken am selben Opfer innerhalb eines Tages tötet → Mord (**FAKT** `bloodshed`).
- **Zeugen:** `bloodSeen(p)` nach dem Muster `magicSeen` (game.js:11764): Zeugen ≤ 280 → je Fraktion die `STIGMA`-Reaktion, Zeugen fliehen, `p.stigma.vampire[fac] = Tag` (diese Fraktion weiß es jetzt).

### Fähigkeiten (Muster `ABILITIES` mit `title`, `cd`, `gain`; Ausführung in `titleAbility`)
| Schlüssel | Name | Grad | Wirkung (VORSCHLAG) | Blutdurst |
|---|---|---|---|---|
| `feed` | Trinken | I | siehe oben | −45 / −25 / −10 |
| `blood_lash` | Blutpeitsche | I | Geschoss auf ein Ziel (Schaden wie `chaos_bolt`), 40 % des Schadens heilen dich (Lebensraub-Pfad **FAKT** game.js:3293) | +12, cd 6 s |
| `mist_step` | Nebelschritt | I | 140 px Sprung, 0,5 s unverwundbar, ein Verfolger verliert dich | +10, cd 9 s |
| `thrall_gaze` | Bannblick | II | ein am Boden liegender oder fliehender Mensch kämpft 40 s für dich (Diener-Muster `raise_dead`, game.js:12481) | +20, cd 30 s |
| `bat_swarm` | Fledermausschwarm | II | 4 s Kreis r 90: Gegner treffen schlechter, −30 % Tempo | +15, cd 18 s |
| `red_harvest` | Rote Ernte | III | nur bei Blutdurst ≤ 40: Ring r 120, jeder blutende Feind nimmt Schaden, du heilst die Hälfte | setzt +40, cd 40 s |

`magicSeen` greift für Titelzauber schon (**FAKT** game.js:12683). VORSCHLAG: `schoolOf` gibt für `vampire` die neue Schule `blood` zurück; `MAGIC_VIEW.hate` bekommt `blood` bei `order`, `valen`, `chain`, `goblin` (Aurelion bleibt neugierig, nicht feindlich).

### Sonnenregel (`sunOn(c)` → Faktor 0…1)
- Sonne = Weltkarte oder offene Karte (`DUNGEONS[m].open`, **FAKT** world.js:2016ff), 6–19 Uhr; 5–6 und 19–20 Uhr halb.
- 0 in Häusern (**FAKT** Prüfung wie `wxOf`: `HOUSES … R.playerInside`), in geschlossenen Karten, bei Blutregen.
- Wetter: klar/Hitze 1,0 · bewölkt/Sandsturm 0,5 · Regen/Nebel/Schnee 0,3. Umhang oder Kapuze ×0,5.
- **Wirkung:** Status „Sonnenbrand“ (sichtbar: Rauch-fx), 1,2 Schaden/s × Faktor über `hurt(c, n, null, 'Sonnenlicht')` (**FAKT** Muster Verderbnis, game.js:12450); −20 % Schaden; Nachtgeschöpf aus. Ab Blutdurst 70 ×1,5.
- **Am Boden:** siehe Frage 2 (meine Empfehlung: Brand läuft halb weiter → Gefährten müssen dich in den Schatten bringen oder du stirbst).
- **Hinweis beim ersten Brand:** „Die Sonne brennt. Geh in ein Haus, unter die Erde, zieh eine Kapuze über — oder warte auf Wolken.“

### Zeugen, Stigma, Orden
**`STIGMA`** (neu in data.js, Audit-Vorgabe `{ price, greet, deny, report }`, VORSCHLAG Werte):

| Fraktion | price | deny | report | greet (Beispiel) |
|---|---|---|---|---|
| order | — (kein Handel) | ja | `hunt` | „Zurück, Blutsauger. Das Licht sieht dich.“ |
| valen | 1,5 | nein | `guard` | „Du bist bleich wie ein Toter. Bleib, wo ich dich sehe.“ |
| chain | — | ja | `guard` | „Omega verbrennt, was nicht atmet.“ |
| aurel | 1,2 | nein | `null` | „Faszinierend. Die Akademie zahlt für Proben.“ |
| merch | 1,2 | nein | `null` | „Gold ist Gold. Aber fass mich nicht an.“ |
| goblin, sea, frei | 1,2 | nein | `null` | — |
| undead | 0,9 | nein | `null` | „Kalt wie wir. Setz dich.“ |
| blut | 0,8 | nein | `null` | „Kind des Kelchs.“ |

- **Wann gilt es:** Stufe 2 = diese Fraktion weiß es (`p.stigma.vampire[fac]`, durch bezeugtes Trinken, Raserei oder Meldung). Stufe 1 = sichtbare Zeichen (Sonnenbrand, rote Augen ab 70, ohne Kapuze), wirkt nur bei NPCs ≤ 120 px. Stufe 0 = nichts.
- **Einbau:** `repPrice` multipliziert `price` (**FAKT** game.js:12165), `contextGreet` nimmt `greet` (**FAKT** game.js:11219), `deny` sperrt Bett, Heiler, Lehrer, Handel. T15 setzt später `brass` daneben und nutzt `stigmaOf(npc, kind)` mit.
- **report `guard`:** einmal je Tag und Fraktion `addBounty(fac, 60, 'Blutsauger')`.
- **report `hunt` (Orden):** jede Meldung zählt `S.cult.orderHeat`. Bei 2 → `afterAvenge('order', 3, 'Vampirjäger des Ordens', 1–2 Tage, 'order', 'Vampirjäger')` (**FAKT** Kit `order` existiert, game.js:677). Die Jäger tragen „Lichtbann“ (Muster `mageHunterTick`, game.js:11784): aus der Nähe alle 9 s 4 s Sonnenbrand und keine Titelfähigkeiten. Bei 4 → `S.flags.bann.order` für 5 Tage (Orden greift ohne Anruf an, **FAKT** `banned`). Eifer +1 (`witchZeal(1)`, löst bei 2 die vorhandene Hexenjagd aus).
- **Der Kerker:** wer als Vampir sitzt, durstet weiter; bei 100 Raserei an Mitgefangenen. Phiolen werden bei der Festnahme gefunden → Stigma Stufe 2 bei der Fraktion.

### Heilung (beide Orte; Aufgeben = für immer, **FAKT** `forsakeTitle` setzt `p.forsaken`)
- **Mutter Aldis, Sonnwacht (Orden):** Buße 200 Gold oder Ordensruf ≥ 0, dann **Nachtwache** in der Kapelle 22–6 Uhr: du darfst den Raum nicht verlassen, der Blutdurst steigt um 40 (bei 100: Raserei-Probe — scheitert sie, greifst du die Priesterin an). Bestanden → `cureTitle('vampire', 'Orden')`: Titel weg, Orden +10, Ordenswissen um dich gelöscht.
- **Heilquelle von Sankt Serin:** umsonst, aber nur bei Sonnenaufgang (5–7 Uhr) — der Weg nach Aurelion ist lang und am Tag brennst du (Reise bei Nacht, Tag in Gasthäusern). Mutter Aveline führt dich ins Wasser; du gehst zu Boden (eine Stunde), wachst geheilt auf. Kosten: alle Grade verloren, Aurelion erfährt es (Chronik).
- `cureTitle` = `forsakeTitle` + Ressource weg + `pal.glow` zurück + Stigma-Wissen der Fraktionen bleibt 10 Tage („Man vergisst nicht so schnell“). Wiedereintritt: siehe Frage 6.

---

## 6. (c) Katakomben von Varonheim

**Karte:** `DUNGEONS.katakomben = { name:'Katakomben von Varonheim', floor:'dfloor', amb:'blight', enter:'Unter Varonheim riecht es nach Wachs und Eisen. Irgendwo tropft es — zu dick für Wasser.' }`. Gebaut **beim Betreten** in game.js (`buildCatacombs()`, Muster `buildVaronburg`, game.js:8200; Eintrag in `ARRIVAL`, game.js:4980), fester Grundriss **ohne** Zufall → kein Eingriff in `world.js rnd()`. Figuren sind transient und kommen aus `S.cult` (Verschwundene, Knechte, Hedda, Boss-Zustand). Neu laden auf der Karte: Muster game.js:2051.

**Eingänge (transiente Portale, `ensureBloodCult`):** A Gruftpforte am Friedhof von Varonheim (nach Weg B/C), B Geheimtreppe im Kanzleikeller der Varonsburg (Schlüssel aus Weg A, oder nach der Hof-Enthüllung offen).

**Grundriss (ca. 80 × 70 Kacheln, VORSCHLAG):**
```
   [Hort]──[KRYPTA DES KANZLERS (Boss)]──[Treppe B → Kanzleikeller]
                    │ 4 Lichtschächte (Marktgitter)
            [KELCHHALLE: Hedda, Altar, Kelch, Spender]
             /                     \
   [PFERCHE: 4 Käfige]        [ARCHIV: Briefe, Rotes Siegel]
             \                     /
          [BEINHAUS DER ALTEN KÖNIGE: Fledermäuse, Knechte]
                    │
          [Einstieg A ← Gruftpforte am Friedhof]
```
- **Beinhaus:** Knochenwände, ein Lichtschacht vom Friedhof (tags gefährlich für Vampire, sicher für alle anderen).
- **Pferche:** die Verschwundenen aus `S.cult.missing` in Käfigen (E 1,5 s: befreien → sie gehen heim, Rückkehr nach Varonheim, Chronik, Wohlstand +2, Beziehung). Bewacht von Knechten.
- **Kelchhalle:** Hedda, 2 Blutmagier, Blutspender (Kult-Weg), Altar mit dem Kelch (Beitritt).
- **Archiv:** Briefe mit Kanzleisiegel (Lore), **Rotes Siegel** (Beweis), Phiolen.
- **Krypta:** 6 Säulen, 6 Kerzenständer, Käfige am Rand (Fesseln), 4 Lichtschächte unter den Marktgittern (nur tags Licht).

**Gegner** (VORSCHLAG; Band nach `docs/BALANCE_GUIDE.md` §4; Gebietsstufe 12–16 für die Katakomben, Boss Stufe 16, empfohlen 16–18 — siehe Frage 1):

| Schlüssel | Name | Gefahr | hp | dmg | atk ms | Sonst | xp |
|---|---|---|---|---|---|---|---|
| `blood_cultist` | Maskierter | 2 | 46 | 11 | 950 | Dolch, schnell (1,35), nachts auch oben; `face:'bloodmask'` | 28 |
| `blood_mage` | Blutmagier | 2 | 38 | 12 | 1700 | Fernkampf, Geschoss heilt ihn um 40 % (Sonderregel: Hinweis „Er trinkt, was er trifft — unterbrich ihn“) | 32 |
| `thrall` | Blutknecht | 1 | 34 | 8 | 850 | Schwarm, trägt Namen der Verschwundenen | 14 |
| `chalice_guard` | Kelchwächter | 3 | 120 | 16 | 1500 | Ansage 550 ms, Schild vorn | 70 |
| `bat_swarm_m` | Fledermausschwarm | 1 | 20 | 5 | 700 | flink (2,0), `wingAI` (**FAKT** game.js:3980) | 8 |
| `aldhelm` | Aldhelm, Blutfürst von Varonheim | 4, Boss | 380 | 21 | 1400 | Ansage 600, Tempo 1,3, Reichweite 40 | 450 |

Rechnung Boss (**FAKT** Formeln BALANCE_GUIDE §1/§5): Leben 380 × 1,64 × 1,7 × 2 ≈ 2120 (menschenähnlich, Rumpf ≈ 45 % → ~950 wirksam); Schaden 21 × 1,96 × 1,4 × 0,6 ≈ 35 roh → ~18 nach 30 Rüstung ≈ 21 % des Balkens (Stufe 16); „Siegelstoß“ ×1,8 ≈ 52 % des Balkens mit 650 ms Ansage (≤ 60 %). Ziel 60–120 s. Mit `RF.simFight` messen.

**Intro-Beat (kurz, D15/T17 erweitert später):** `cinematic` mit 3 Einstellungen: (1) Totale der Krypta, sechs Kerzen; (2) Fokus Aldhelm am Pult, er siegelt einen Brief mit rotem Wachs: „Der König unterschreibt alles, was ich ihm hinlege. Heute unterschreibst du.“; (3) die Kerzen verlöschen eine nach der anderen, Namenskarte „ALDHELM — BLUTFÜRST VON VARONHEIM“. Überspringen führt die Folgen aus (**FAKT** game.js:8934).

**Phasen (`aldhelmAI`, Muster `garmadonAI`):**
1. **Kanzler (100–60 %):** Degenstöße (Ansage 600), ruft 2 Maskierte. **Blutfesseln:** je lebendem Gefangenen in den Käfigen ein roter Faden zum Boss, er heilt 0,4 % je Faden und Sekunde (4 Fäden ≈ Spieler-Schaden pro Sekunde → Gleichstand). Käfig öffnen (E 1,5 s) kappt den Faden und rettet den Menschen. Wer die Pferche vorher geleert hat, kämpft ohne Fäden. → Die Ermittlung von früher bestimmt den Kampf.
2. **Blutfürst (60–30 %):** 1,0 s unverwundbar beim Wechsel (≤ 1,1 s). Er wirft die Robe ab. **Nebelschritt** hinter den Spieler (Nebel-Ansage 600 ms), **Blutsiegel** am Boden (3 Flächen, Ansage 700 ms), 2 Blutknechte (Stufe 12). **Lichtschächte (nur tags):** steht er im Licht, 3 % Leben/s und Unterbrechung; die KI meidet sie, aber der Nebelschritt landet hinter dir — wer sich vor einen Schacht stellt, lockt ihn hinein. Ein Vampir-Spieler brennt dort auch.
3. **Kelch (unter 30 %):** 1,0 s unverwundbar, er trinkt: +10 % Leben je noch gefesseltem Gefangenen (der stirbt dabei — Chronik mit Namen). Danach schneller (×1,3). Ist der Spieler Vampir: „Blutruf“ — Willenskraft-Probe, sonst 1,5 s gebannt (Ansage: rote Augen am Boss).

**Beute (`BOSS_LOOT.aldhelm`):** einzigartig `kanzlerdegen` „Rotes Siegel“-Degen (legendär, Sondereffekt bedingt: Todesstoß an Blutendem heilt 8 % — Band §8); dazu `kanzlerrobe`, Phiolen, Gold aus der Kanzlei. Eigene Legendäre nach §5f (Aufgabe T07).

---

## 7. (d) Weltfolgen über `S.after.cult`

`AF().cult = { end, day, until }` — fehlt das Feld, ist nichts geschehen (**FAKT** Regel game.js:9897). `cultWar()` = Kult mindestens Stufe 1 und `end` ∉ {`destroyed`}. Für §5g.8 siehe Frage 5.

| Folge | **Zerschlagen** (`destroyed`) | **Versteckt / siegt** (`hidden` → `ruling`) | **Spieler wird Blutfürst** (`player`) |
|---|---|---|---|
| Hof | Aldhelm tot; Ysmay wird Kanzlerin; Audienz kostet kein Gold mehr; Varon: Valen +15, „Ritter Varons“ möglich auch ohne Kniefall-Kette | `hidden`: Aldhelm bleibt, Uhr der Roten Krönung läuft. `ruling`: Varon tot (Chronik), Aldhelm Reichsverweser; Audienz nur noch bei Nacht | Aldhelm tot, Varon lebt und weiß nichts; du hältst das Kanzleisiegel: Audienz frei, Valen +10 |
| Varonheim | Verschwundene in den Pferchen kehren heim; Wohlstand +2 je Rückkehrer; Schild „Vermisst“ weg | weiter 1 Entführung je 5 Nächte; nachts Ausgangssperre, Gardisten nachts als Knechte (`ruling`) | du bestimmst den **Zehnt**: alle 5 Tage nimmt der Kult einen Bewohner (du durstest weniger, Phiolen umsonst) — oder du verbietest es (Kult murrt, `heat` steigt, Hedda prüft dich) |
| Kriegsgraph | kein Abzug mehr | Valen-Nachschub −0,5/Tag (`hidden`) bzw. −1/Tag (`ruling`, Aldhelm vernachlässigt die Front) → Untote rücken vor (**FAKT** Hook über `SIM.H`, sim.js:7, 364) | wie `hidden`, solange der Zehnt läuft |
| Orden | Eifer +1 (der Orden nimmt den Sieg für sich; Inquisition sucht „Reste“) | Eifer +2 bei `ruling`; Orden erklärt Valen den Kirchenbann für 10 Tage | dauerhaft `orderHeat` hoch; Vampirjäger alle 7 Tage |
| Wirtschaft | Phiolen verschwinden aus dem Handel | Phiolen billig bei Hedda | Tribut: täglich 2 Phiolen + 30 Gold aus der Kanzlei |
| Rückkehr | Schwer/Sehr schwer: 2 Rachezüge „Letzte Maskierte“ (`afterAvenge('blut', …)`) | auf Angsthase endet `ruling` nach `AFTER_DAYS` (21) von selbst: Aufstand, Aldhelm flieht in die Gruft → Kampf wieder möglich | Tod des Helden: Hedda übernimmt, `end → 'hidden'`, Chronik „Der Kelch sucht einen neuen Herrn“; der Erbe ist kein Vampir, Orden −10 beim Haus |

Alle Folgen werden angesagt (`afterSay`, Chronik → Tratsch), wie es das Folgensystem verlangt.

---

## 8. Spielererlebnis und Entscheidungen

**Erlebnis:** Nachts durch Varonheim gehen und Schritte hören. Morgens fehlt der Bäcker, an seiner Tür klebt Blut. Ein Name am Galgen, der vielleicht der falsche war. Unten in der Gruft hängt derselbe Bäcker im Käfig — oder steht dir als Knecht gegenüber. Oben steht der Kanzler, der dir für 100 Gold die Tür zum König geöffnet hat.

**Entscheidungen mit echtem Preis:**
- Wen anklagen? (Falsch = ein Toter und ein Opfer mehr.)
- Schnell und laut (Anklage, Hof) oder leise (beschatten, Wido)?
- Pferche vor dem Boss leeren (Zeit, Risiko) oder direkt zum Kanzler (schwerer Kampf, Gefangene sterben)?
- Tags kämpfen (Lichtschächte helfen, aber nicht dem Vampir-Spieler) oder nachts?
- Beweis zum König (Verbündete, aber Aldhelm gewarnt, wenn der Beweis fehlt) oder allein?
- Trinken? Wen? Vor wem? Tierblut (sicher, nie satt) oder Menschen (satt, Zeugen)?
- Heilen beim Orden (Bußgeld, harte Nachtwache, Orden versöhnt) oder in Sankt Serin (umsonst, weit, Grade weg)?
- Als Blutfürst: Zehnt nehmen oder Stadt schonen und selbst dürsten?

---

## 9. Wirkung auf NPCs, Fraktionen, Wirtschaft, Kampf, Erkundung

- **NPCs:** Bewohner verschwinden wirklich und kehren wirklich zurück (gespeichertes Objekt in `S.cult.missing`). Nachbarn sprechen darüber. Wachen kämpfen gegen enttarnte Maskierte. Gefährten reagieren auf Trinken vor ihren Augen (Moral −, Muster `partyMembers … morale`, **FAKT** game.js:3626).
- **Fraktionen:** neue Fraktion `blut` **ohne `ranks`** (wie `frei`), damit die Rangführer-Probe nicht anschlägt (**FAKT** game.js:16038); Hierarchie läuft über Titelgrade. Valen (Hof, Front), Orden (Jäger, Eifer, Heilung), Aurelion (Sankt Serin, Neugier statt Hass).
- **Wirtschaft:** Wohlstand Varonheims, Phiolen als Ware mit Fundrisiko, Tribut für den Blutfürsten, Valen-Nachschub → Nordfurts Korn → Front (**FAKT** sim.js:45–47).
- **Kampf:** neuer Bossmechanismus aus Vorgeschichte (Fesseln) und Tageszeit (Lichtschächte), Vampir-Spielweise mit Machtkurve und Kontrollverlust.
- **Erkundung:** zwei Eingänge, die man sich verdienen muss; Nacht als Ermittlungszeit; Reise nach Sankt Serin bei Nacht.

---

## 10. Emergenz (Beispiele, die ohne Extra-Code entstehen)

1. Vampir sitzt im Kerker → Durst → Raserei an einem Mitgefangenen → neuer Mord, neues Kopfgeld, Ausbruch.
2. Falsche Anklage → Tratsch „der Falsche“ → Valen −3 → Audienz verweigert, wenn Valen schon knapp war.
3. Untote nehmen eine Stadt, weil der Kult Valen ausblutet → Flüchtlinge nach Varonheim → mehr Opfer für den Kult.
4. Spieler ist Blutfürst und schont die Stadt → hoher Durst → Raserei auf dem Markt → Orden jagt den eigenen Herrn des Kults.
5. Hexenjagd (Eifer ≥ 2) durch Vampirmeldungen → Unschuldige Kräuterfrau wird angeklagt (**FAKT** vorhandene Welle) → der Vampir ist schuld an einem Scheiterhaufen, den er nie gesehen hat.
6. Der Erbe eines Vampir-Helden ist Mensch, aber der Orden misstraut dem Haus.

---

## 11. Risiken

- **R1 Namen:** „Blutkatakomben“ (Garmadon), „Blutfürst“ (Todesritter-Schlüssel), „Blutdurst“ (Legendär-Affix), „Blutbann“ (Adelsmord). VORSCHLAG: Karte heißt „Katakomben von Varonheim“; Boss behält „Blutfürst“ (Entwicklerwunsch), der Todesritter-Knoten wird in „Blutritter“ umbenannt (nur Anzeigename, Schlüssel bleibt); Affix bleibt. Braucht ein Ja vom Lead, weil vorhandener Text geändert wird.
- **R2 Kriegsgleichgewicht:** Der V1-Gegendruck ist frisch gestimmt (**FAKT** sim.js:362–364, Hunter-Befund). Kult-Abzug höchstens −1/Tag, mit `warDay`-Probe über 15 Tage messen.
- **R3 Zufall/Proben:** Entführungen und Maskierte ziehen `chance/pick` aus dem gemeinsamen RNG → andere Proben können kippen (CLAUDE.md). Katakomben bewusst ohne Zufall bauen; Kult-Nachtlogik nur, wenn `S.cult.stage ≥ 1`.
- **R4 Selbsttest-Schema:** Mentor-Probe (game.js:15867) verlangt Mentor in `NPCS`; Hedda ist transient → Probe um eine Liste `TRANSIENT_MENTORS` erweitern. Klassen-Quest-Zähler `=== 12` (game.js:15908) nicht anfassen: Vampir bekommt **keine** Klassen-Questreihe/Rüstung in T07.
- **R5 Koop:** `titleTick` und `titleDeed` laufen nur für `S.player` (**FAKT** game.js:2739, 12342) → Gast-Vampir bekäme weder Sonne noch Durst. Muss auf `coopHero` erweitert werden.
- **R6 Speicherstand:** `FRESH` braucht `katakomben: []` (**FAKT** game.js:1967, sonst `adoptPropKeys` mit `undefined`); `S.ents.katakomben` wird beim Laden automatisch angelegt (**FAKT** game.js:1968). Gespeicherte Bewohner in `S.cult.missing` vergrößern den Stand leicht (≤ 8 Objekte).
- **R7 Umfang:** Groß. Deshalb 5 Scheiben, jede für sich testbar; Kult-Aufträge 1–3 sind der erste Kandidat zum Streichen, falls es eng wird.
- **R8 Spielbarkeit Durst:** zu schneller Anstieg macht den Vampir zur Pflichtübung. Debug-Messung und Spieltest vor dem Festschreiben.

## 12. Alternativen (verworfen oder später)

- **Kult als Teil der Untoten** (Fraktion `undead`, wie „Kultist der Asche“): billiger, aber Varon hätte dann keinen zweiten Feind, und §5g.8 bräuchte trotzdem einen eigenen Zustand. Verworfen.
- **Katakomben in `world.js` mit Zufall** (wie `genGarmadon`): verschiebt RNG beim Weltaufbau. Verworfen zugunsten „beim Betreten bauen“.
- **Vampir ohne Ressource, nur Sonne + Trinken als Heilung:** einfacher, aber keine Machtkurve. Verworfen.
- **Blutfilter-Implantat (V11) als dritte Heilung:** passt (Audit: „Vampir-Blutdurst verträgt keinen Blutfilter“), aber V11 ist Welle 2. Später: Blutfilter halbiert Blutdurst-Anstieg, Trinken wirkt halb.

## 13. Abhängigkeiten

T03 (Varonheim, gebaut) · T06 (Spielstand-Umbau, falls zuerst) · später T15 (Messing nutzt `STIGMA`), T17 (Boss-Intro-Karte), T37 (Schleichen fürs Beschatten), T08 (Verhör gefangener Maskierter), T40 (§5g.8 liest `cultWar()`).

## 14. Aufwand

Groß gesamt; je Scheibe Mittel. Grob: data.js +~90 Zeilen, game.js +~550 Zeilen, sim.js +3, world.js +1 (DUNGEONS), sprites/fig5 +~15 (Blutmaske), Selbsttest +~15 Proben, Doku.

## 15. Mögliche Exploits und Gegenmittel

| Exploit | Gegenmittel (VORSCHLAG) |
|---|---|
| Ergebene Feinde als endlose Blutquelle | Trinken senkt nur Durst, heilt nicht; zweites Trinken tötet; Ausgezehrt 1 Tag |
| Phiolen stapeln | Hedda 3/Tag; Festnahme findet sie (Stigma) |
| Für immer im Dunkeln bleiben | erlaubt — kostet Handel, Licht, Wege |
| Lichtschächte als Boss-Falle | AI meidet sie; Schaden nur bei Kontakt; max. 25 % seines Lebens durch Licht je Kampf |
| Aldhelm erpressen, mehrmals | einmal; zweiter Versuch → Rachezug der Maskierten |
| Heilen, wieder trinken, heilen | `forsaken` sperrt (siehe Frage 6) |
| Gefährten als Spender | erlaubt, Beziehung −20, Moral −15, bei zweitem Mal verlässt er dich |
| Koop-Gast trinkt an Host-Gefährten | gleiche Regeln; Host entscheidet Dialoge (**FAKT** uiHooks) |
| Verschwundene befreien für Wohlstand farmen | Deckel 8 Fälle gesamt, Befreite verschwinden nicht erneut |

---

## 16. (e) Daten- und Codeplan

**data.js**
- `TITLE_CLASSES.vampire` (oben), `monk.excludes += 'vampire'`.
- `ABILITIES`: `feed, blood_lash, mist_step, thrall_gaze, bat_swarm, red_harvest` (alle `title:'vampire'`).
- `STIGMA = { vampire: {…} }` (Tabelle oben).
- `FACTIONS.blut` (ohne `ranks`), `MAGIC_VIEW.*.hate` + `blood` (order, valen, chain, goblin).
- `MONSTERS`: 6 Einträge oben (+ `LOOT.blood_cultist` mit `blutmaske`).
- `ITEMS`: `blutphiole`, `blutmaske` (Material/Spur), `rotes_siegel` (Quest), `kanzlerdegen`, `kanzlerrobe`. `BOSS_LOOT.aldhelm`.

**world.js**
- nur `DUNGEONS.katakomben` (kein Zufall, kein Generator).

**game.js** (neue Funktionen, Namen VORSCHLAG)
- `ensureBloodCult()` — idempotent; in `newGame()` und `continueGame()` neben `ensureVaronGate();` (**FAKT** game.js:1863, 2049). Legt `S.cult ||= {stage:0}`, `S.factions.blut ??= -40`, Verdächtige, Portale A/B, Schild „Vermisst“, Blutzeichen an.
- `cultNight(h)` aus `hourTick` (**FAKT** game.js:9605): Entführung, Maskierte, Knecht-Umwandlung, Krönungsuhr.
- `cultChoices(npc, choices)` in die Hook-Kette (**FAKT** game.js:11103): Nachbarn, Verdächtige, Hauptmann, Ysmay, König (Beweis), Aldis, Aveline, Hedda.
- `cultClue(kind)`, `cultReveal(how)` (einmal), `cultEnd(kind)` (schreibt `S.after.cult`, ruft `afterSay`), `cultWar()`.
- `buildCatacombs()` + `ARRIVAL.katakomben` + `FRESH.katakomben: []` + Neubau-beim-Laden-Zeile wie game.js:2051.
- `aldhelmAI` (Muster `garmadonAI`), Fesseln aus Käfig-Props.
- Vampir: Zweig in `titleTick` (Durst, Sonne, Nacht, Raserei), Fälle in `titleAbility`, `sunOn(c)`, `bloodSeen(p)`, `stigmaOf(npc, kind)` (in `repPrice`, `contextGreet`, Dienst-Sperren), `cureTitle(key, where)`, Heilmultiplikator verallgemeinert (heute `dkNode(...,'k_bloodlord') ? 0.5`, game.js:543/550 → `healMul(c)`).
- `teamOf`: `if (c.faction === 'blut') return c.disguised && !c.unmasked ? 'neutral' : S.cult?.joined ? 'player' : 'foe';` (neben game.js:3059).
- `titleTick`-Aufruf und `titleDeed` auch für `coopHero` (game.js:2739, 12342).
- Erbfolge: in `adoptSuccessor` (game.js:12930) bei `S.cult.end === 'player'` → `hidden`, Hedda.

**sim.js**
- `warDay`: Valen-Zuwachs `− (H.cultDrain?.() || 0)` (sim.js:364), `H.cultDrain` aus game.js.

**sprites.js / fig5.js**
- neuer Wert `face:'bloodmask'` (Schlüssel `face` ist schon in `SPEC_KEYS`, **FAKT** sprites.js:209 → Cache sicher); Vampir: `glow` rot.

**Neue Speicherfelder (alle fehlertolerant)**
- `S.cult = { stage, day0, next, clues:{}, missing:[], thralls, accused, wrong, heat, orderHeat, reveal, joined, crown, end, lord }` — fehlt = Stufe 0.
- `S.after.cult = { end, day, until }` — fehlt = nichts geschehen.
- `S.factions.blut` — fehlt = `-40` in `ensureBloodCult`.
- Am Helden: `p.tres.blood` (über vorhandenes `tres`), `p.stigma = { vampire:{fac:Tag} }`, `p.vamp = { fedOn:{id:Tag}, hints:{} }` — fehlt = nie getrunken, niemand weiß es.
- Nicht gespeichert (transient): Verdächtige, Hedda, Maskierte, Portale, Blutzeichen, Katakomben-Inhalt.

**Hinweise im Spiel (Regel „Explain to player“)**
Erste Vermisstenmeldung (Protokoll, Schild); jede Spur (Toast „SPUR 2/3“); Anklage-Folgen im Dialog; erster Sonnenbrand; Blutdurst 70/90/100; Hedda erklärt den Kelch und die Heilungsorte („Der Orden kann es ausbrennen. Und in Sankt Serin gibt es Wasser, das das Licht liebt.“); Tooltip der Ressource (`rule`); Fesseln im Bosskampf (Toast „ER TRINKT AUS DEN KÄFIGEN“); Lichtschacht (Float „Licht!“); Kodex-Kapitel „Der Kelch“. Eintrag in `docs/MECHANIKEN.md`.

**Debug-Einträge (Abschnitt „Blutkult“ in `debugSections`, **FAKT** game.js:13422)**
Stufe setzen (0–4) · Entführung jetzt · Maskierten hier · Spur geben (je Art) · Katakomben betreten (A/B) · Aldhelm enthüllen · Blutfürst-Kampf starten (Tag/Nacht) · Ausgang setzen (4 Arten) · Blutdurst setzen · Sonne erzwingen an/aus · Ordensjäger schicken · Heilung testen (Orden/Serin) · Stigma anzeigen. Vampir freischalten läuft schon über den allgemeinen Eintrag (**FAKT** game.js:13506).

**Selbsttest-Proben (in `sandbox()`/`stage()`/`actor()`, **FAKT** game.js:13852ff)**
1. Schema: `vampire` besteht die Titelklassen-Proben; `STIGMA.vampire` hat alle Fraktionen mit `price/greet/deny/report`.
2. Sonne: Mittag, draußen → Schaden > 0; im Haus/Kapuze/Nebel kleiner; Mitternacht 0; am Boden gemäß Frage 2.
3. Durst: `titleTick` 60 000 ms → +4; Fähigkeit +gain; Trinken an liegendem `actor` −45; zweites Trinken → Opfer tot.
4. Raserei bei 100 → Angriff auf nächsten Menschen, danach 85.
5. Zeugen: Trinken vor Valen-Wache → Kopfgeld `valen`; vor Ordensmann zweimal → Rachezug `order` in `S.after.rev`.
6. Heilung: Aldis und Serin → Titel weg, `forsaken.vampire`, `unlockTitle('vampire')` false.
7. Spur-Kette: drei `cultClue` → Stufe 2; falsche Anklage → `wrong 1`, `heat 1`; Portal A nach Weg B vorhanden.
8. Entführung: Bewohner fort aus `S.ents.world`, in `S.cult.missing`; `buildCatacombs` → Gefangener im Käfig; befreien → wieder in der Welt mit gleichem Namen/Haus.
9. Enthüllung genau einmal: zweimal `cultReveal` → eine Chronik-Zeile.
10. Boss: Phasenwechsel bei 60/30 %; Anzahl Fesseln = lebende Gefangene; Käfig öffnen senkt sie.
11. Ausgänge: je Art `S.after.cult.end` gesetzt; `cultWar()` gemäß Frage 5; `warDay` mit `ruling` → Valen-Zuwachs um 1 kleiner.
12. Alter Stand: `S.cult`, `S.factions.blut`, `p.stigma` gelöscht → `ensureBloodCult` läuft ohne Fehler, Stufe 0.
13. Erbfolge: Vampir-Held stirbt → Erbe ohne `vampire`; bei `end:'player'` → `hidden`.
14. Koop: `coopHero` mit Titel `vampire` bekommt Sonne/Durst.
15. Team: Maskierter verkleidet = neutral, enttarnt = foe, nach Beitritt = player.

---

## 17. (f) Umsetzung in 5 Scheiben (jede für sich testbar)

| # | Scheibe | Inhalt | Test ohne die anderen |
|---|---|---|---|
| 1 | **Vampir + Stigma** | `TITLE_CLASSES.vampire`, Fähigkeiten Grad I, Durst, Sonne, Trinken, `STIGMA`, `bloodSeen`, Ordensjäger, Heilung Aldis/Serin, `healMul`, Koop-`titleTick` | über Debug „Titelklasse freischalten“; Proben 1–6, 14 |
| 2 | **Unterwanderung** | `S.cult`, `ensureBloodCult`, `cultNight`, Maskierte, Entführung, Blutzeichen, Spuren, Verdächtige, Anklage, Schild, Tratsch, `cultWar`, `H.cultDrain` | Debug „Stufe 1“, „Entführung jetzt“; Proben 7, 12, 15 |
| 3 | **Katakomben** | Karte, Eingänge A/B, Gegner, Pferche (aus `missing`), Archiv, Kelchhalle, Hedda, Beitritt, Grad II, Blutmaske-Figur | Debug „Katakomben betreten“; Probe 8 |
| 4 | **Aldhelm** | `cultReveal` (3 Wege, Hof-Kamerafahrt), Intro, `aldhelmAI` (Fesseln, Lichtschächte, Kelch), Beute, Ausgang `destroyed/hidden` | Debug „Blutfürst-Kampf“; Proben 9, 10; `RF.simFight` |
| 5 | **Folgen + Kult-Weg** | `S.after.cult` (4 Ausgänge), Rote Krönung, Zehnt, Kult-Aufträge, Grad III, Erbfolge, MECHANIKEN/IST_ZUSTAND/CHANGELOG | Debug „Ausgang setzen“; Proben 11, 13 |

Nach jeder Scheibe: Sonnet-Bug-Agent, frischer Selbsttest grün.

---

## 18. Fragen an den Entwickler (höchstens 6; Empfehlung jeweils zuerst)

**F1 — Wann sollen Katakomben und Blutfürst zu schaffen sein?**
- A (Empfehlung): Mittleres Spiel — Gegner Stufe 12–16, Blutfürst Stufe 16, empfohlen 16–18 (passt zu Grad III ab Stufe 16). Die Ermittlung oben geht schon früh.
- B: Spätes Spiel wie Garmadon — Blutfürst Stufe 22, empfohlen 22–25.
- C: Mitwachsend mit der Heldenstufe (gedeckelt), wie die Kopfgeldjäger.

**F2 — Wie hart ist die Sonne?**
- A (Empfehlung): Stetiger Brand (≈1,2/s im vollen Licht) + −20 % Schaden; Haus, Höhle, Kapuze, Wolken mildern. Am Boden brennt es halb weiter — Gefährten müssen dich in den Schatten holen, sonst stirbst du.
- B: Wie A, aber am Boden hört der Brand auf (kein Sonnentod).
- C: Nur Schwäche (−30 % Schaden, keine Heilung), kein Schaden.
- D: Tödlich — ohne Schutz in wenigen Sekunden am Boden.

**F3 — Von wem darf der Vampir trinken?**
- A (Empfehlung): Von Menschen, die am Boden liegen, sich ergeben haben, gefesselt sind oder schlafen; dazu Phiolen und Tierblut (Tier hält nur halb satt). Zweimal am selben Tag tötet.
- B: Zusätzlich mitten im Kampf als Biss (Nahkampf-Fähigkeit).
- C: Nur Phiolen und Spender des Kults — nie direkt.

**F4 — Darf der Spieler selbst der neue Blutfürst werden?**
- A (Empfehlung): Ja — als Ende des Kult-Wegs (Aldhelm im Zweikampf besiegen). Du bestimmst den „Zehnt“ der Stadt, bekommst Tribut, der Orden jagt dich dauerhaft. Stirbt der Held, übernimmt Hedda wieder.
- B: Nein — man kann dem Kult nur dienen; der Kult-Weg endet mit Aldhelms Roter Krönung oder Verrat.
- C: Ja, aber ohne laufende Folgen (nur Titel und Beute).

**F5 — §5g.8 (Fall Aurelions): Was zählt als „Varon noch im Krieg mit dem Kult“?**
- A (Empfehlung): Kult aktiv (Stufe ≥ 1, nicht zerschlagen) **oder** Kult herrscht (Aldhelm/Spieler) → Varon ist gebunden, die Automaten übernehmen. Nur ein zerschlagener (oder noch nicht erwachter) Kult lässt Varon einmarschieren.
- B: Nur „Kult aktiv, aber nicht an der Macht“. Herrscht der Kult, marschiert Valen unter Aldhelm ein.
- C: Herrscht der Kult, marschiert der Kult selbst nach Aurelion (neuer, dritter Ausgang in §5g.8).

**F6 — Ist die Heilung endgültig?**
- A (Empfehlung): Ja — wer geheilt ist, kann nie wieder Vampir werden (wie das Aufgeben anderer Titel). Orden: Buße + Nachtwache, Orden versöhnt. Sankt Serin: umsonst, aber alle Grade weg und Aurelion erfährt es.
- B: Einmal Rückfall erlaubt (zweite Heilung ist dann endgültig).
- C: Beliebig oft heilbar und neu ansteckbar.
