# T08 — Gefangene, Steckbriefe, Ruf der Klinge (A5 + §5g.24 + A10)

**Status:** WAITING_FOR_DEVELOPER · **Autor:** Feature Designer (Agent 3) · **Stand:** 01.10.2026
Kennzeichnung: **FAKT** = im Code belegt (Datei:Zeile), **VORSCHLAG** = meine Idee, **ANNAHME** = nicht geprüft.

## 1. Name und Konzept
**„Lebend oder tot“** — Wer sich ergibt oder bewusstlos am Boden liegt, kann gefesselt, verhört, angeworben, ausgeraubt oder laufen gelassen werden. Gefesselte folgen dem Helden und werden bei einer Wache abgeliefert. Steckbriefe am vorhandenen Anschlagbrett zahlen für Lebende das Anderthalbfache. Wie man mit Wehrlosen umgeht, schreibt einen zweiten Wert neben den Ruhm: den **Ruf der Klinge** (gnädig ↔ grausam). Er ändert, wie Gegner sich verhalten.

## 2. Gelöstes Problem
- „Gnade!“ macht einen Gegner nur neutral, danach passiert nichts. (FAKT `game.js:3049`, `:3852`)
- Ein Dialog nach der Kapitulation gibt es nur beim Kopfgeld-Twist „surrender“. (FAKT `surrenderOffer`, `game.js:6948–6959`, Auslöser `:7066`)
- Kopfgeld heißt immer „Tot oder gar nicht“. (FAKT `game.js:6705`, `:6723`)
- Gnade, Gnadenstoß und Hinrichtung ändern nur die Moral der Gefährten, nicht die Welt. (FAKT `:6957`, `:3007–3010`)

## 3. Warum es zu ROTFALL passt
Bei ROTFALL geht es um Entscheidungen mit Nachhall: Erbe, Chronik, Gerüchte, Rächer (`S.avenge`), Gnade mit Echo (`conEchoDay`). Die Kenshi-Regel „wer fällt, ist erst bewusstlos“ (FAKT `downed()`, `game.js:3447`) liefert Wehrlose ohnehin. Das Feature macht diesen Moment zu einer Entscheidung, statt nur einen Ruf-Balken einzuführen.

## 4. Heutiges System (FAKT)
| Teil | Ort | Was es tut |
|---|---|---|
| Kapitulation | `game.js:3851–3853` | bei < 20 % LP, 0,4 % je Tick Flucht; Menschen (HUMANOID, nicht untot, **ohne** `e.contract`) ergeben sich zu 40 %: `surrendered`, `disarmed` |
| Team | `game.js:3049` | `surrendered` → `neutral`; Strg-Schlag trifft nur `kind === 'npc'` (`:2996`), Ergebene sind also unangreifbar |
| Bewusstlos | `game.js:3447–3457`, `:3007` | Gegner liegen ~11 s, Gnadenstoß tötet sie |
| Interaktion E | `interactables()` `:4637–4645`, `doInteract` `:4886` | Gegner nur mit `parley` und neutral |
| Mitnehmen | `travel()` `:9352` | Diener (`servant`) reisen mit dem Helden |
| Speichern | `state.js:154` | `transient`-Figuren werden nicht gespeichert; Kopfgeld-Anführer und Bandenleute sind transient (`:7052`, `:10838`) |
| Kopfgeld-Aufträge | `makeContract` `:6688`, Elites `:6696`, `conKill` `:7009`, `claimContract` `:6828` | Anführer = Elite-Mini-Boss, Lohn nach Anteil |
| Brett | `boardMenu` `:6919`, `conList` `:6844`, Wachen-Aufträge `npc.vm` `:6935` | Anschlagbrett und Verteidigungsmeister vergeben Aufträge |
| Banden | `bandFound` `:10803`, `bandKill` `:10850` | Stirbt der Anführer, zahlt die Stadt automatisch Kopfgeld |
| Kerker | `goToJail` `:7906`, `ensureJail` `:7920` | Mitgefangene sind zufällige Namen |
| Rächer | `claimContract` `:6834`, `ENC_KINDS.avenger` `:2556/2565` | Bruder des Getöteten kommt nach 1–3 Tagen |
| Ruhm | `FAME_REG`/`fameOf`/`addFame` `:12152–12164`, Anzeige `ui.js:725` | `S.fame[region]` 0–100 |
| `Object.values(S.fame)` | `game.js:5054` | Kopfgeldjäger-Schwelle; ein verschachteltes Objekt in `S.fame` würde hier `NaN` liefern |
| Gefährten | `partyReact` `:5911`; Traits `gütig`/`grausam` | Moral ± bei Kettenthemen |
| Fehlend | grep | Es gibt **kein** `guardChoices`, kein Seil-Item und keine Kettenpeitsche |

## 5. Neues System (VORSCHLAG)

### 5.1 Gefangenen-Menü `captiveMenu(e)`
**Wann:** Taste E an einem Gegner, der `surrendered` ist **oder** bewusstlos und menschlich (`HUMANOID`, nicht untot, kein Boss). `interactables()` bekommt dafür eine Bedingung, und der Hinweis lautet „**E** Gefangenen nehmen“. `surrenderOffer` wird zu einem Sonderfall: der Bestechungsknopf bleibt als zusätzliche Wahl im selben Menü.

| Wahl | Wirkung | Klinge |
|---|---|---|
| **Fesseln** (braucht 1× `strick`, neues Item, 6 Gold, beim Händler) | `e.captive = { by, since, con }`, `e.transient = false`, `anchor` gelöscht. Der Gefangene folgt mit Tempo × 0,6 und wacht aus der Bewusstlosigkeit gefesselt auf. | 0 |
| **Verhören — ruhig** | 70 % wahr: Gerücht mit Kartenkreis (siehe 5.3) | 0 |
| **Verhören — hart** | 95 % wahr, 15 % stirbt er dabei | −3 |
| **Anwerben** | Aus dem Gefangenen wird ein neuer `makeChar` (Name, Stufe, Waffe), Beruf „Söldner“, `loyal = 20`, `morale = 40`, Trait `gierig` oder `mürrisch`. Gruppe voll → Wahl gesperrt. | +2 |
| **Ausrauben** | `dropLoot(e)` ohne Tod, `e.robbed = true`, er rennt weg | −1 |
| **Laufen lassen** | 30 % Informant: in 2–4 Tagen ein Gerücht als Geschenk. 15 % Rächer: `S.avenge = { day, name, self: true }`, er kommt selbst wieder. Sonst nichts. | +4 |
| **Hinrichten** | `die(e, 'hingerichtet', p)`, Gefährten wie heute (`:6957`) | −6 |

**Folgen und Abliefern:**
- Im `updateEnemy` steht früh ein eigener Zweig `if (e.captive)`: dem Helden folgen (Logik des Dieners), nicht kämpfen.
- `travel()` nimmt Gefangene mit wie Diener (`:9352`), wenn sie höchstens 300 px entfernt sind. Ausnahme: der Kerker, wenn der Held selbst eingesperrt wird.
- **Abweichung von TASKS** („beim Kartenwechsel abgeführt“): Mitnehmen wie ein Diener kostet weniger Code und wirkt nicht wie Magie. Die Wegfindungs-Randfälle gibt es bei Dienern schon heute, sie sind also kein neues Risiko.
- **Flucht:** Ist der Held länger als 10 s über 320 px entfernt oder liegt er bewusstlos am Boden, flieht der Gefangene (Log „X hat sich losgerissen“). Bei einem Bandenmitglied (`bandId`) mit einem Bandenlager in Sicht befreit ihn die Bande. Stirbt er unterwegs, zählt der Tod wie heute über `conKill`, und der Lebendbonus ist weg.
- **Abliefern:** neue Gesprächswahl `captiveChoices(npc, choices)` in `talk()` (bei `jailChoices`, `:11111`), angeboten von jeder Wache (`npc.guard`, `npc.vm` oder Kerkerwärter) einer Stadt, die nicht verfeindet ist.
  - Gehört der Gefangene zu einem Steckbrief, gilt `C.have = C.need`, Lohn × 1,5, danach `claimContract`.
  - Ist er Anführer einer Bande, gilt `bandGone` plus Bandenkopfgeld × 1,5.
  - Ist er ein gewöhnlicher Räuber (`faction` bandit/chainRest), zahlt die Wache `8 + Stufe × 2` Gold, höchstens 3 Ablieferungen je Stadt und Tag.
  - Andere Gefangene: „Den suchen wir nicht.“
- **Emergenz-Haken (klein, optional):** `S.prisoners[town]` hält höchstens 4 Einträge `{ name, day }`, die nach 20 Tagen verfallen. `ensureJail` setzt diese Namen als Mitgefangene ein: „Du! Du hast mich hier reingebracht.“

### 5.2 Steckbriefe (§5g.24)
- **Kein neues Brett und kein neuer NPC.** Das vorhandene Anschlagbrett (`boardMenu`) und der Verteidigungsmeister (`npc.vm`) gelten als „Brett beim Wachhauptmann“. Siehe Frage 1.
- Jeder `bounty`-Auftrag wird zum Steckbrief: `C.alive = true`, Titel „Steckbrief: Name“, Text „Lebend oder tot. Lebend bei einer Wache abgeliefert: +50 %.“ Der Satz „Tot oder gar nicht“ entfällt.
- Kapitulation erlaubt künftig auch `e.contract`, wenn `C.alive` gilt. Die Sperre bei `:3852` wird dafür gelockert.
- **Quellen** (alle vorhanden):
  - Elites über `makeContract` (vorhanden)
  - `postContract('valen','bounty')` aus `factionAgenda` (vorhanden)
  - **neu:** `bandFound` hängt in `b.town` einen Steckbrief für den Anführer aus (`C.bandId`, er erfüllt sich über `bandKill` oder per Ablieferung)
  - **später:** der Ahnenfeind (T10) hängt als eigener Steckbrief
- Tote Anführer bringen weiterhin den vollen Lohn über das Brett. Lebende bringen ×1,5, aber erst bei der Wache.

### 5.3 Verhör-Gerüchte
Das Verhör nutzt die Gerücht-Aufträge (`kind:'rumor'`, `rumorOffer`/`rumorTick`, `:11349–11379`) mit zwei Arten:
- `rk:'band'`: das Lager der nächsten Bande. Der Kartenkreis liegt ±6 Felder um `b.tx/ty`. Erfüllt, sobald die Bande verschwindet (`b.gone`).
- `rk:'treasure'`: ein Versteck, die Art gibt es schon.

Eine Lüge entspricht dem vorhandenen Feld `C.lie`.

### 5.4 Ruf der Klinge (A10)
- **Speicherort:** `S.fameStyle = { mitte, west, sued, ost, see }` mit Werten von −100 bis +100, Schlüssel wie `FAME_REG`. Das ist ein eigenes Geschwisterfeld neben `S.fame`, weil `Object.values(S.fame)` bei `:5054` sonst bricht. Fachlich bleibt es „Achse im Ruhm“: gleiche Regionen, gleiche Anzeige, keine neue Fraktionsebene.
- **Funktion:** `styleAct(n, why, e)` begrenzt die Änderung auf ±10 je Region und Tag. Jede Figur zählt je Handlung nur einmal (`e.styleDone`).
- **Auslöser:** die Tabelle in 5.1, dazu Gnadenstoß an Menschen −2 (`:3009`) und die Bestechungsgnade in `surrenderOffer` +4.
- **Stufen:** ≥ 60 Barmherzig · ≥ 20 Gnädig · > −20 Unbeschrieben · > −60 Gnadenlos · sonst Schlächter.
- **Wirkung** (s = Wert der Region, in der der Gegner steht):
  - Kapitulationschance 0,4 × clamp(1 + s/100, 0, 2): Barmherzig bis 0,8, Schlächter 0. Bei Grausamkeit ergibt sich niemand mehr.
  - Fluchtschwelle 0,2 + max(0, −s) × 0,0015 (bis 0,35 LP), Fluchtwurf × (1 + max(0, −s)/50).
  - Banden: ab s ≥ 40 Schutzgeld × 0,7 (`bandChoices`). Ab s ≤ −40 halbe Hinterhaltchance (`bandTick`) und eine eigene Zeile des Unterhändlers („Nimm den Weg. Wir sehen nichts.“).
  - Kopfgeld-Anführer rufen ab s ≤ −40 eine Wache mehr (Spawn in `conTick`).
- **Anzeige:** Charakterfenster, eine Zeile unter Ruhm: „Klinge: Menschenland gnädig (+34)“. Stufenwechsel per Toast. Gefährten kommentieren einmal je 10 Spielminuten: `gütig` −3 Moral bei grausamen Taten, `grausam` +2.
- **Erbe:** `adoptSuccessor` halbiert `S.fameStyle` (wie die Fraktionswerte, `:12941`).

## 6. Spielererlebnis
Ein Räuber kriecht blutend weg. Ich drücke E, fessle ihn, er trottet hinter mir her. An der Wache in Nordfurt gibt es 14 Gold, und Wochen später sitzt er im Kerker, als ich dort lande. Oder ich verhöre ihn hart, er nennt das Lager der „Roten Hand“ und stirbt. Nach zwanzig solcher Taten werfen Banditen nicht mehr die Waffe weg, sondern rennen. Meine Heilerin will nicht mehr reden.

## 7. Entscheidungen des Spielers
- Töten oder nehmen: sofort Beute und Ruhe, oder Zeit, Risiko und 50 % mehr Lohn?
- Ruhig oder hart verhören: Wahrheit gegen Ruf.
- Anwerben: billiger Söldner, der knapp über der Verratsschwelle 15 steht (FAKT Teil A: Verrat unter 15 Loyalität).
- Laufen lassen: Informant gegen Rächer.
- Langfristig: barmherzig (mehr Kapitulationen, billiger Wegzoll) oder Schlächter (Gegner fliehen, man wird gemieden).

## 8. Querwirkungen
- **NPCs:** Wachen bekommen eine neue Rolle als Abnehmer. Kerkerinsassen sind dann echte Namen. Gefährten reagieren nach Trait.
- **Fraktionen:** Die Wache zahlt im Namen von `townFac(town)`, +1 Ruf je Ablieferung. Valen-Deserteure abzuliefern hebt Valen (Muster `rumorChoices`).
- **Wirtschaft:** `strick` hängt in T09 an `cloth`. Ausrauben bringt Beute ohne Tod.
- **Kampf:** Kapitulation und Flucht hängen am Ruf. Bewusstlose werden zur Wahl zwischen Gnadenstoß und Fessel.
- **Erkundung:** Verhöre öffnen Banden-Lager und Verstecke auf der Karte.

## 9. Emergenz
- Ein verschonter Räuber verrät das Lager. Die Bande wächst trotzdem weiter (`bandDay`) und überfällt das eigene Dorf.
- Ein angeworbener Gefangener fällt unter Loyalität 15 und verrät die Gruppe.
- Der Schlächter bekommt kaum noch Kapitulationen, also auch keine Lebendprämien. Der Barmherzige hat mehr Gefangene, als er führen kann.
- Wer einen Gefangenen laufen lässt, trifft ihn als Rächer wieder (`S.avenge.self`).

## 10. Risiken
- **Wegfindung:** Ein Gefangener bleibt hängen. Abhilfe: dieselbe Logik wie bei Dienern, dazu die Flucht-Regel als natürliches Ende.
- **Speichern:** Ein Gefangener ohne passende Karte oder ohne Herrn wird beim Laden in `continueGame` bereinigt: `captive` löschen, `surrendered` behalten.
- **Zufall in Proben:** Neue `chance()`-Aufrufe in `updateEnemy` können andere Proben verschieben. Erst Zwischenwerte loggen (Regel CLAUDE.md).
- **Bloat:** Das Menü hat 7 Knöpfe. Abhilfe: „Hinrichten“ und „Ausrauben“ nur bei gefesselten oder bewusstlosen Gefangenen zeigen.

## 11. Alternativen
- (a) Nur die Steckbrief-Version: Kapitulation allein beim Steckbrief-Ziel. Weniger Arbeit, aber §5g.24 würde dann nur an einer Stelle gelten (Teil A „Schärfungen“ rät davon ab).
- (b) Gefangene abstrakt statt als Figur: ein Klick bringt sofort Gold. Kein Folgen und kein Risiko, also keine Entscheidung. Abgelehnt.
- (c) „Abgeführt beim Kartenwechsel“ (TASKS-Wortlaut). Siehe 5.1. Möglich, falls der Entwickler es will.

## 12. Abhängigkeiten
- T05 (laut TASKS).
- Nutzt Banden (§5d.7), Gerüchte (§5e.4), Elites und den Kerker.
- T09 (Seilpreis, optional), T10 (Ahnenfeind als Steckbrief), T24 (Kopfgeldjäger), T37 (Schleichen: Fesseln von hinten, später).

## 13. Aufwand
Mittel bis groß: ungefähr 180–250 Zeilen in game.js, 1 Item in data.js, 1 Zeile in ui.js.

## 14. Mögliche Exploits und Gegenmittel
| Exploit | Gegenmittel |
|---|---|
| Schwache Räuber fesseln, laufen lassen, wieder fesseln (Gnaden-Farm) | `e.styleDone`, ±10 je Tag und Region |
| Ablieferungs-Farm an Hinterhalt-Räubern | Lohn nur `8 + Stufe × 2`, höchstens 3 je Stadt und Tag |
| Ausrauben, laufen lassen, erneut ausrauben | `e.robbed` |
| Anwerben, ausrüsten, abliefern | Angeworbene sind `kind:'npc'` in der Gruppe, kein Menü mehr |
| Steckbrief lebend abgeben **und** Echo der Gnade | Abgeliefert heißt nicht verschont: kein `conEcho` |
| Speichern, verhören, laden (Wahrheit erwürfeln) | `C.lie` wird beim Verhör gewürfelt und gespeichert; Gefangener verhört → `e.asked` |

## 15. Daten- und Codeplan
- **data.js:** `strick: { name:'Strick', slot:'material', stack:10, value:6, rarity:'common', lore:'Hält einen Gefangenen. Meistens.' }`; in Händlerpools ergänzen.
- **game.js:**
  - `captiveMenu(e)`, `captiveTick(e, dt)` (Folgen/Flucht, aus `updateEnemy`)
  - `captiveChoices(npc, choices)` (Hook in `talk()`)
  - `styleAct(n, why, e)`, `styleOf(r)`, `styleTier(v)`
  - `interactables()`/`doInteract()` +1 Bedingung, `travel()` +1 Filter
  - `makeContract` (Titel/Text, `C.alive`), `bandFound` (Steckbrief)
  - `updateEnemy` `:3851` (Formeln), `bandChoices`/`bandTick` (Wegzoll/Hinterhalt)
  - `adoptSuccessor` (Halbieren), `ensureJail` (Namen, optional)
  - Bereinigung in `continueGame`
- **ui.js:** Zeile „Klinge“ unter Ruhm (`A.styleList()` analog zu `fameList`).
- **Neue Speicherfelder (alle optional):**
  - `S.fameStyle` (fehlt → 0)
  - `e.captive`, `e.robbed`, `e.asked`, `e.styleDone`
  - `C.alive`, `C.bandId`
  - `S.avenge.self`
  - `S.prisoners` (optional)
- **Debug** (`debugSections`, Abschnitt „Gefangene“):
  - „Ergebenen Räuber hier“
  - „Bewusstlosen Räuber hier“
  - „5 Stricke“
  - „Steckbrief hier (lebend)“
  - „Klinge ±50 (Region)“
  - „Gefangenen abliefern (sofort)“
- **Hinweise im Spiel:**
  - Prompt „E Gefangenen nehmen“
  - Toast beim ersten Fesseln: „Gefesselt. Bring ihn zu einer Wache — Steckbriefe zahlen lebend mehr.“
  - Text am Steckbrief
  - Toast bei Klingenstufe
  - Tooltip Charakterfenster
  - Gefährtenzeilen
  - Eintrag in `docs/MECHANIKEN.md`
- **Selftest-Proben** (`sandbox`/`stage`/`actor`):
  1. Ergebener Räuber → `captiveMenu` Fesseln → `e.captive`, nicht transient, folgt (Abstand sinkt nach `RF.tick`).
  2. Abliefern an einen Wachen-`actor` mit Steckbrief → Gold = Lohn × 1,5, Auftrag `claimed`.
  3. Verhören ruhig/hart → Gerücht-Auftrag mit `tx/ty` bei Bandenlager; hart ändert `S.fameStyle` um −3.
  4. Kapitulationsquote: 200 Würfe mit s = −100 → 0 Kapitulationen; mit s = +100 > mit s = 0.
  5. `travel` nimmt einen Gefangenen ≤ 300 px mit, einen fernen nicht.
  6. Speichern/Laden: Gefangener bleibt; Gefangener mit fehlendem Herrn → `captive` gelöscht.
  7. Alter Stand ohne `fameStyle`/`captive` lädt, `styleOf()` = 0.
  8. Tagesdeckel: 5× Laufen lassen an einem Tag → höchstens +10.

## 16. Scheiben (je einzeln testbar)
1. **S1 Gefangene:** `captiveMenu` (Fesseln, Ausrauben, Laufen lassen, Hinrichten, Anwerben), Folgen, Reisen, Flucht, Speichern. Abliefern an Wachen mit Grundlohn. Proben 1, 5, 6, 7.
2. **S2 Steckbriefe:** `C.alive`, neue Texte, Kapitulation bei Steckbrief-Zielen, Banden-Steckbrief, Lebendbonus. Probe 2.
3. **S3 Verhör:** zwei Verhörarten, `rk:'band'`, Informant über `S.avenge.self`. Probe 3.
4. **S4 Ruf der Klinge:** `S.fameStyle`, `styleAct`, Wirkung in `updateEnemy`/Banden, Anzeige, Gefährten, Erbe. Proben 4, 8. (Optional `S.prisoners` im Kerker.)

Koop: Die Wahl im Menü trifft der Host. Ein Gast kann Gefangene nicht selbst nehmen (`doInteractFor` kennt keine Gegner, FAKT `:4857–4866`). Gefangene folgen dem Helden des Hosts, der Gast sieht sie über die Deltas. **ANNAHME:** `e.captive` wird mitgesendet, weil Gegnerfelder vollständig übertragen werden. Der Hunter prüft das.

## 17. Fragen an den Entwickler (höchstens 3)
1. **Wo hängen die Steckbriefe?**
   - (A, empfohlen) Am vorhandenen Anschlagbrett und beim Verteidigungsmeister. Kein neuer Bau, sofort überall.
   - (B) Ein eigenes Steckbrief-Brett neben der Wache bzw. dem Kerker jeder Stadt. Mehr Atmosphäre, aber neue Props je Stadtplan.
   - (C) Nur beim Kerkerwärter, Steckbriefe nur in Städten mit Kerker.
2. **Braucht Fesseln einen Gegenstand?**
   - (A, empfohlen) Ja, einen billigen Strick (6 Gold, verbraucht). Das ist Vorbereitung als Entscheidung.
   - (B) Nein, Fesseln geht immer.
   - (C) Strick oder Kettenpeitsche als Waffe. Die Peitsche gibt es noch nicht.
3. **Wie hart wirkt der Grausamkeitsruf?**
   - (A, empfohlen) Ab „Schlächter“ ergibt sich niemand mehr, Gegner fliehen früher, Banden meiden dich.
   - (B) Milder: Kapitulation höchstens halbiert, nie null.
   - (C) Nur Anzeige und Gefährtenkommentare, keine Kampfwirkung.
