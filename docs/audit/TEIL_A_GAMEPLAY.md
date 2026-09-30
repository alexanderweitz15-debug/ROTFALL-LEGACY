# Audit Teil A — Gameplay (Kampf, Fortschritt, Beute, Körper, Gefährten, Aufträge)

Stand 01.10.2026, Version 21. Nur gelesen und gemessen, kein Code geändert. Messungen mit `RF.simFight` (Schwierigkeit „Schwer“, virtuelle Uhr) im eigenen Tab. Der Spielstand blieb unberührt (`S._quiet`, Backup `s14c`). Punkte aus `PLAN_ROADMAP.md` §5g sind hier nicht als neue Ideen aufgeführt. Wo ich sie schärfe, steht „schärft §5g.N“ dabei.

Leitfrage nach AUFTRAG.md: Wie werden die vorhandenen Systeme tiefer und stärker verbunden, ohne dass neue Listen-Features dazukommen?

---

## 1. Ist-Zustand (kurz, mit Belegen)

### Kampf
- **Nahkampf.** `attack` → `resolveSwing` → `hit` → `hurt` (game.js 2957–3440). Jeder Hieb kostet Ausdauer. Das Waffengefühl `FEEL` je `wtype` regelt Gewicht, Hit-Stop, Taumeln und Ausfallschritt.
  - Kombo: der 3. Schlag im Stand macht +30 % Schaden und lässt taumeln (`comboStep`).
  - Waffenfelder: Hinrichtung `execute`, `raw`, `bind`, `bleed`, `pull` (Peitsche), `sweep` (Hellebarde, Spitze stärker), `flail` (Schwung), `crush`, `riposte`, `toll`.
- **Verteidigung des Spielers.**
  - Ausweichrolle mit i-Frames (`DODGE` 240 ms, Abklingzeit 850 ms, 20 Ausdauer).
  - Deckung mit Parade-Fenster 180 ms, danach Block gegen Ausdauer, dann „Deckung gebrochen“ (`GUARD`, `updateGuard`, `guarded` 13202ff.). Schildarten ändern das Parade-Fenster und bringen Stacheln oder ein Energiefeld.
  - Passiver Schildblock (`block × 0,7`).
  - Nahkampfabwehr aus der Fertigkeit Verteidigung, nur von vorn, höchstens 30 %.
- **Gegner.**
  - Telegrafierte schwere Angriffe (`startHeavy`/`heavyTick`, `MONSTERS.heavy`) und „offen“ danach (`exposed`, +25 %).
  - Eigene Ausdauer (`enemyStamina`), Taumeln mit Standfestigkeit (`poiseUntil`, 1,2 s).
  - Flankieren bei Menschen und Hunden (updateEnemy 3905–3910), Rückzug nach dem Hieb bei Goblins.
  - Rollen der Untoten: Heiler, Beschwörer, Blinzler, Flieger, Belagerer (`necroSummon`, `shadeBlink`, `wingAI`, `golemAI`).
  - Flucht oder Kapitulation unter 20 % Leben (3843ff.). Anführer rufen Hilfe (`rallyCall`).
  - Bosse mit eigener KI: Hrodvar, Garmadon (3 Phasen), Omega (Wellen), Weißbart, Gorak, Dodon.
- **Schaden und Rüstung.** Rüstung wird flach abgezogen: `dmg − armor × 0,55`. Panzerbrechen `ap` senkt die wirksame Rüstung.
  - Die Gegnerrüstung ist `MONSTERS.threat × 1,6` (spawnEnemy 1676: `armor: m.threat`). Sie hängt also an der Gefahrenstufe, nicht daran, was der Gegner trägt. `MONSTERS` hat kein Feld `armor`, ich habe das in der Konsole geprüft.
  - Schadensarten: physical, holy, fire, frost, magic. `spellHit` (3121ff.) wandelt Schock, Schatten und Arkan zu `magic` um.
  - Resistenzen gibt es nur als Einzelfälle: Aschdämon feuerfest, Heilig ×2,1 gegen Untote, Frostgeboren nimmt mehr Feuerschaden.
  - Die Materialklasse `mat` (blunt/pierce/blade) wird in `hurt` (3409) berechnet, aber **nur für den Klang** benutzt.
- **Körper.** Sechs Trefferzonen, Glieder fallen aus oder werden abgetrennt, Enthauptung nur bei Krit (body.js). Brüche und Entzündungen halten Tage (`woundSet`/`woundDay` 10864ff.). Verheilte Brüche geben Narben mit bis zu +5 Rüstung.
- **Zustände.** `applySpellStatus` (3111): brennt, Frost (3 Stapel frieren ein), Schock. Aus Waffen: blutet, vergiftet, gefesselt, gepackt. Kombinationen gibt es nicht (geplant, §5g.26).
- **Umgebung.** Brand- und Eisflächen aus Zaubern (`spellGround`/`groundTick`), Fallgruben in Dungeons (`controlPlayer` letzte Zeilen). Das Wetter verändert Fernkampf, Sicht und Ausdauer (`WX` 2147). Sonst hat die Umgebung keine Wirkung im Kampf.
- **Gruppe.** Fünf Befehle, die immer für alle gelten (`partyCommand` 12130: folgen, angreifen, halten, zurück, schützen). `partyAI` greift den **nächsten** Feind an. Pro Gefährte gibt es keinen Befehl und kein Fokusziel.

### Fortschritt
- **Stufen** 1–60. Pro Stufe 1 Statpunkt, alle 5 Stufen einen zusätzlich. Talentpunkte jede 3. Stufe (`TALENT_EVERY = 3`, 3733). Talentbaum mit 64 Knoten (`SKILL_TREE`).
- **Klassen** (19 in `CLASSES`). Die Grundklassen haben **je genau eine Fähigkeit**, Konsole: `warrior:1 archer:1 rogue:1 cleric:1 mage:1`. Fünf Titelklassen mit eigener Ressource und Graden.
- **Fertigkeiten** (14) wachsen durchs Tun. Wie oft `game.js` sie liest (grep):
  - `hunting`: 0-mal,
  - `stealth`: 2-mal gelesen, **nirgends erhöht**,
  - `leadership`: wirkt nur auf `partyCap` und wächst nur durch eine Akademie-Vorlesung.
  - Die UI nennt Jagd, Handwerk und Schleichen „(noch ohne Wirkung)“ (ui.js 708). Für Handwerk stimmt das seit den Rezepten nicht mehr.

### Beute, Ausrüstung, Handwerk
- **Waffen.** 77 Waffen in 16 `wtype`, 15 Affixe (nur Zahlen), 3 legendäre Effekte (`LEGENDS`: thirst, echo, bastion), `BOSS_LOOT` je Boss, 32 `ELITES` mit sicherer Beute und Trophäe.
- **Handwerk.** 20 `RECIPES` an Esse, Werkbank und Kessel. Die Qualität hängt von der Fertigkeit ab (`craftQual`, `QUAL`). Die Materialien sind generisch: Eisen, Holz, Fell, Ersatzteile, Automatenkern.
- **Kein Zerlegen** von Ausrüstung. `bone` („Alter Knochen“) fällt bei Wölfen und Goblins, wird aber in keinem Rezept gebraucht.
- **Eisen vierfach:** `iron` (Eisenerz in `S.res` und im Gepäck), `ore` (Erzfuhre, Handelsware), `ingot` (Barren) und `koenigseisen`. Kein Rezept wandelt Erz in Barren oder Handelserz in Werkerz um.

### Heilung, Überleben
- **Heilung:** Tränke (40 LP), Verband (kanalisiert), Heilerin (25 Gold schienen und reinigen), Schlaf, Zauber, Stufenaufstieg (heilt voll).
- **Hunger:** Die Nahrung ist ein gemeinsamer Vorrat (`dayTick` 10644ff.). Fehlt sie, verlieren Gefährten −10 Moral, der Held nur −4 Rumpf. Das ist auf 1 LP begrenzt, also nie tödlich und ohne weiteren Nachteil.
- **Kälte:** Nur Schnee in der Nacht ohne Umhang wirkt (`wxHour`, −40 % Tempo).

### Tod und Erbe
- **Ablauf:** `playerDeath` → Kandidaten → `adoptSuccessor` (12916). Der Erbe bekommt 70 % des Golds und 50 % des Rufs. Aufträge scheitern. Die persönlichen Waffen bleiben im Grab und lassen sich bergen.
- **Nichts erinnert sich an den Mörder.** `source` fließt nur in Nachruf und Chronik. Es gibt keinen Erzfeind und keine Rache des Hauses.

### Gefährten und Aufträge
- **Gefährten:** Moral (kurzfristig) und Loyalität (langfristig, `loyDay` 10914). Verrat unter 15 Loyalität, Lagerfeuer-Gespräche, Söldner, ein Tier, Pferde.
- **Verträge:** 12 Arten (`CON`) mit Wendungen (`twist`), Rächern und Echo (`conEchoDay`). Der Lohn richtet sich nach dem eigenen Beitrag (`credit`).
- **Kapitulation:** Ein Gegner, der sich ergibt, wird einfach neutral (`teamOf` 3047). Nur beim Kopfgeld-Twist gibt es einen Dialog (`surrenderOffer` 6943).

---

## 2. Messungen (RF.simFight)

| Test | Ergebnis | Befund |
|---|---|---|
| Held St. 10 gegen Bandit / Skelett, 6 Waffen | 1,8–3,6 s, 2–6 Treffer, egal welche Waffe | Normale Gegner fallen in 2–4 Hieben. Die Waffenwahl ändert die Zeit bis zum Sieg kaum; der Ausgleich über `spd` in `damageOf` wirkt. |
| St. 15 gegen Todesritter St. 15, ohne Ausweichen, 5 Seeds | **Kriegshammer 5/5 Siege, 0 % Leben verloren**; Langschwert 3/5, 53–140 %; Zweihänder 4/5 | **Wucht sperrt Gegner dauerhaft (Stunlock).** |
| Kriegshammer ohne Ausweichen gegen Hauptmann der Toten, Knochenritter, Ghul, Automat, Leichenkoloss (je 3 Seeds) | 15/15 Siege, 0–5 % Verlust (Kolben zum Vergleich: 0–151 %) | gilt für alle Gegner, die keine Bosse sind |
| **Held St. 8** mit Kriegshammer gegen Todesritter **St. 15** | Sieg in 5,8 s, 0 % Verlust | Ein Kauf für 240 Gold überspringt eine ganze Gefahrenstufe. |
| Gorak (Boss) mit Hammer, ohne Ausweichen | Sieg, 0 % Verlust | auch ein Boss |
| „Smart“-Bot (rollt bei jeder Ansage) gegen Todesritter ab St. 30 | 0 % Verlust | 1-gegen-1 ist für einen sauber rollenden Spieler gelöst. Schwierigkeit muss aus Gruppen, Umgebung und Ressourcen kommen. |

**Ursache Stunlock:**
- `hit` 3381 setzt bei `crush` in jedem Fall `stagger` = 650 und `swing`/`telegraph`/`windup` auf 0.
- Das geschieht **außerhalb** der Prüfung auf `poiseUntil`. Die Standfestigkeit (§82), die genau das verhindern soll, greift hier nicht.
- Hammer-Schwung 1150 ms minus Übung ergibt mit Taumeln und `atkCd` eine lückenlose Sperre.
- Betroffen: `warhammer`, `runenhammer`, `mauerbrecher`, `sturmanker`.

---

## 3. Schwächen

1. **Die Waffenwahl ist ein DPS-Ausgleich, keine Entscheidung gegen bestimmte Gegner.**
   - Die Rüstung hängt an `threat`. Ein Geist, ein Rotgardist in Platte und ein Nekromant (alle Stufe 3) haben dieselbe Rüstung 4,8.
   - Durchschlag, Kolben gegen Platte, Klinge gegen Ungerüstete: all das gibt es nur als Klang (`mat`).
   - Folge: „bessere Zahl ausrüsten“ bleibt die einzige Ausrüstungsentscheidung.
   - Der Hinweis zur Elite-Kraft `tough` („Wucht oder Durchschlag hilft“, 1709) verspricht mehr, als die Regeln halten: Wucht bricht nur Deckung, nicht Rüstung.
2. **Schilde der Gegner sind nur Bild.** Goblin-Krieger und Knochenritter tragen Schilde (spawnEnemy 1679). Blocken kann nur der Knochenritter, und das über eine Sonderregel nach `mtype` (3355).
   - Kein Gegner pariert, weicht aus oder hebt Deckung.
   - Der Spieler hat also ein reiches Verteidigungsset, die Gegner keins. Das Gleichgewicht fehlt.
3. **Wucht-Stunlock** (siehe Messung). Er entwertet Ansagen, Rollen und Parade für jeden, der einen Hammer kauft.
4. **Schleichen ist kein Spielstil.**
   - Gegner erkennen über einen Kreis: `nearestTarget` 3809 prüft nur die Entfernung. Kein Sichtkegel, keine Sichtlinie, kein Licht, kein Lärm; nur das Wetter ändert den Radius.
   - Der Schleichangriff wirkt nur auf Ziele, die ohnehin neutral sind (`ambush` in `hit` 3261).
   - Die Fertigkeit Schleichen wächst nie.
   - Schurke und Assassine leben deshalb nur vom Rückenkrit des Dolchs, und der klappt nur, wenn der Gegner jemand anderen ansieht.
5. **Grundklassen sind dünn.** Eine Fähigkeit je Klasse. Die Klassenwahl bestimmt Lehrer und Folgeklasse, nicht das Spiel in den ersten zehn Stunden. Das echte Profil kommt aus Talentbaum, Titel und Zaubern.
6. **Tote Fertigkeiten und Werte.** Jagd (0 Wirkung), Schleichen (wächst nie), Führung (wächst nicht durchs Tun). `EYE_ZAP` nennt `shadow`/`shock`/`arcane`, die `hurt` nie erreichen (`spellHit` gibt nur `magic` weiter).
7. **Die Gruppe ist Masse, keine Taktik.** Befehle gelten für alle, das Ziel ist immer der nächste Feind. Kein „greif mein Ziel an“, kein Halten der Aufmerksamkeit.
   - Genau damit entstünde der Rückenkrit (der Feind sieht den Tank an) — heute passiert das nur zufällig.
8. **Beute ohne zweites Leben.** Überschüssige Ausrüstung kann man nur verkaufen. Monsterteile außer Fell und Automatenkern haben keinen Zweck. Handwerk und Beute laufen nebeneinander.
9. **Überleben ist ein Moral-Abzug der Gruppe.** Allein spürt man Hunger nicht (−4 Rumpf, nie unter 1).
10. **Tod ohne Nachhall im Kampfsystem.** Der Mörder des Helden verschwindet in der Chronik. Die stärkste Geschichte des Spiels — das Haus stirbt und erbt — hat keine Spielfolge über Gold und Ruf hinaus.
11. **Kapitulation verpufft.** „Gnade!“ macht den Gegner neutral. Er läuft weg, und nichts folgt daraus: kein Verhör, kein Gefangener, kein Kopfgeld lebend, kein späteres Wiedersehen.

---

## 4. Fehlende Wechselwirkungen (je System: was passiert mit 3–5 anderen?)

| System | fehlt heute zu … |
|---|---|
| Waffentyp | Rüstung des Gegners (nur Klang), Schild des Gegners, Fertigkeit (nur Zahl), Handwerk (keine Waffenmeister-Rezepte) |
| Rüstung des Spielers | Schleichen (Platte ist nicht lauter), Hitze nur als Text („in schwerer Rüstung noch mehr“ in `WX.heat`, nicht geprüft), Schwimmen/Gelände |
| Verletzung | Bionik: Eine schwere Entzündung führt nie zur Amputation, dabei hängen Prothesen an einem **verlorenen** Glied (`useConsumable` prosthesis). Verletzung und Bionik sind nicht verbunden. |
| Kapitulation | Kopfgeld (lebend, §5g.24), Banden (Lager verraten), Gerüchte, Söldner, Ruf |
| Tod des Helden | Elite-/Kopfgeldsystem, Erbstücke, Ruhm, Chronik als Spielziel |
| Beute | Handwerk (Zerlegen), Runen (§5g.28), Wirtschaft (Materialien als Ware) |
| Hunger/Rast | Kampfwerte (Ausdauer, Krit), Nachtüberfälle, Schenke |
| Kampfstil | Ruf: Wer Gnade gibt oder hinrichtet, wird von der Welt nicht anders behandelt |

---

## 5. Emergenz-Chancen (aus vorhandenen Teilen)

- **Tank + Rückenkrit.** Gefährte hält den Feind, der Held sticht von hinten (`behind` in `hit` gibt es schon). Dazu fehlen nur Fokusbefehl und Aufmerksamkeit.
- **Gnade → Geschichte.**
  - Ein verschonter Bandit verrät sein Lager (Banden §5d.7 → Gerücht mit Kreis), wird Söldner mit niedriger Loyalität (Verrat möglich) oder kommt als Rächer zurück (`S.avenge` gibt es schon).
- **Ahnenfeind.** Der Mörder des Helden trägt das Schwert des Vaters. Der Erbe jagt ihn über das Kopfgeldbrett.
  - Alle Bausteine gibt es: `applyElite`, `eliteDrop`, Grab mit `loot`, benannte Waffe (`w.kills ≥ 15`, 10670).
- **Entzündung → Amputation → Prothese → Aurelion-Abhängigkeit (Wartung P4) → Schwarzmarkt.** Verletzung, Bionik und Wirtschaft werden eine Kette statt drei Menüs.
- **Rüstungsklasse × Region:** Platte im Kettenland, Knochen im Totenland, Messing in Aurelion. Die Reise verlangt eine andere Waffe, das füllt Waffenhändler, Schmiede und Handwerk mit Sinn.

---

## 6. Spieler-Schleife

| Phase | Tun | Warum | Belohnung | Wo es kippt |
|---|---|---|---|---|
| Früh (St. 1–8) | Eren, Verträge, Wölfe, Banditen | Gold, Stufe, Lehrer (Beziehung ≥ 20) | 1 Klassenfähigkeit, Ausrüstung | Die Klasse fühlt sich nach nichts an (1 Fähigkeit). Kein Tutorial (Scouts B.14). Hunger und Schleichen existieren für den Spieler nicht, die Welt erklärt ihre Regeln erst durch Tod. |
| Mitte (8–25) | Fraktionsränge, Titel, Bosse, Gewölbe, Handwerk | Titel, Sets, Ränge | Titelfähigkeiten, Sets, Legenden | **Hier wird der Kampf flach.** Normale Gegner sterben in 2–4 Hieben, ein Wuchthammer sperrt alles. Beute ist „größere Zahl“, das Inventar füllt sich mit Verkaufsware. |
| Spät (25–60) | Omega, Garmadon, Krieg, Dynastie | Welt retten oder kippen, Haus erhalten | Legenden, Epilog | Ab St. 30 ist 1-gegen-1 für einen Spieler, der rollen kann, ohne Risiko (0 % Verlust). Talentpunkte kommen nur jede 3. Stufe. Ohne Skalierung (§5g.20) fehlt der Druck. Der Tod — die eigentliche Spätspiel-Spannung eines Erbe-Spiels — hat keine Spielfolge. |

**„Warum sollte es mich kümmern?“**
- **Tut es heute:** Verletzungen über Tage, Loyalität und Verrat, Beitragsprinzip bei Verträgen, Grab mit Erbstücken.
- **Tut es noch nicht:**
  - Waffenwahl: nur Zahl.
  - Gnade: ohne Folge.
  - Tod: ohne Rache.
  - Hunger: ohne Folge.
  - Beute: ohne Handwerk.

---

## 7. Bloat und Zusammenlegen

1. **Eisen vierfach** (`iron`, `ore`, `ingot`, `koenigseisen`).
   - **MERGE:** Handelserz → Werkerz 1:1 an der Esse („Schmelzen“, Barren = 3 Erz) als ein Rezept.
   - Kein neues Material, sondern Brücke zwischen `S.eco` und `RECIPES`.
2. **Moral und Loyalität** der Gefährten.
   - **Behalten, aber:** Moral nur als Tagesstimmung anzeigen, die Loyalität steuert Folgen.
   - Heute prüfen beide Verlassen oder Verrat getrennt (`dayTick` Moral < 12 → 40 % gehen; `loyDay` < 15 → Verrat). Zwei Abgangswege für dasselbe Problem.
   - **MERGE:** Das Gehen aus niedriger Moral senkt nur die Loyalität. Einziger Abgang ist `loyDay`.
3. **Fertigkeiten ohne Wirkung.** Jagd in Überleben aufgehen lassen, sofern §5g.12 keine eigene Jagd-Fertigkeit braucht. Sonst dort mit Wirkung versehen. Tooltips (ui.js 708) korrigieren.
4. **Ruf, Ruhm, Legende, Titel, Rang** (5 Ebenen Ansehen). Nicht mein Bereich (Teil B/C), fällt aber im Kampf auf: Ein Boss gibt Ruhm, Chronik und Legende parallel. Prüfen, ob Ruhm und Legende eine Kurve sein können.
5. **`bone` (Alter Knochen)** ist Loot ohne Zweck. Entweder Material (Idee A7) oder **CUT**.
6. **Doku-Drift:**
   - IST_ZUSTAND §2.2 nennt 31 Talentpunkte „jede gerade Stufe“, der Code gibt jede 3. Stufe.
   - Der Kommentar in levelUp (3730) sagt noch „31 Punkte“.
   - §2.20 sagt „kein Herstellsystem“, das ist veraltet.
   - Nichts davon ist Gameplay, aber Agenten lesen diese Dateien als Wahrheit.

---

## 8. Verbesserungen (Struktur nach AUFTRAG Punkt 13)

### A1 — Wucht mit Standfestigkeit (Stunlock beheben)
- **Problem:** `crush` taumelt und bricht jeden Angriff ohne `poiseUntil`-Prüfung. Gemessen: Kriegshammer 0 % Verlust gegen jeden Nicht-Boss und gegen Gorak. Ein Held St. 8 schlägt einen Todesritter St. 15.
- **Gameplay:** Der Hammer bleibt der Deckungs- und Schildbrecher, eröffnet aber nur ein Fenster und keine Dauersperre. Der Spieler muss das Fenster nutzen (Kombo, Gefährte) statt nur Klicks zu halten.
- **Interaktion:** Ansagen, Parade, Elite-Kraft `tough`, Bosse.
- **Emergenz:** Hammer und schnelle Nebenwaffe oder Gefährte werden eine Kombination statt einer Lösung.
- **Risiko:** Hammer fühlt sich schwächer an; BALANCE.md-Werte ändern sich.
- **Umsetzung:**
  - `hit` 3381: Den Wucht-Block nur ausführen, wenn `!(target.poiseUntil > now)`. Danach `poiseUntil = now + stagger + 1200` setzen wie in `hurt`.
  - Gegen Bosse bleibt es bei 300 ms.
  - Probe: `simFight('death_knight',{level:15,weapon:'warhammer',nododge:true})` über 5 Seeds verliert im Mittel > 20 % Leben. Dazu eine BALANCE.md-Zeile.
- **Priorität:** Critical. **Umfang:** Small.

### A2 — Rüstungsklassen und Schlagarten (das `mat`-Feld zum Leben bringen)
- **Problem:**
  - Gegnerrüstung = Gefahrenstufe.
  - Die Schlagart (Klinge, Stich, Wucht) ist nur Klang.
  - 30 Waffen tragen `ap`, das gegen ≤ 9,6 Rüstung kaum zählt.
- **Gameplay:**
  - Man sieht die Rüstung des Gegners (Tooltip beim ersten Sichtkontakt, Codex).
  - Man wählt die Waffe nach Region und Gegner: Kolben gegen Platte und Knochen, Klinge gegen Leder und Fleisch, Stich gegen Kette, Feuer gegen Fleisch, Heilig gegen Untote.
  - Waffe tauschen über die Leiste wird eine Entscheidung.
- **Interaktion:** Beute, Handel (Waffenhändler je Region), Handwerk, Elites (`tough` wird wahr), Fertigkeiten.
- **Emergenz:** Die Reise ins Totenland erzeugt Nachfrage nach Kolben. Der Spieler trägt zwei Waffen, und das Gepäck wird eng.
- **Risiko:** Die Balance aller 49 Gegner kippt. Deshalb **Multiplikatoren nahe 1** (0,75–1,3), nicht Immunitäten.
- **Umsetzung:**
  - data.js `MONSTERS.*.ac` ∈ {`flesh`, `leather`, `chain`, `plate`, `bone`, `spirit`, `brass`}. Fehlt das Feld, gilt `flesh`.
  - Tabelle `AC_MUL[ac][mat]` in game.js.
  - `mat` aus `hurt` nach `hit` ziehen: `wtype` → `blade|pierce|blunt`, Zauber über `kind`.
  - Rüstungswert = `AC_ARMOR[ac] + threat`.
  - Hinweis im Treffer-Float („prallt ab“, „durch die Kette“). Debug-Eintrag „Rüstungsklasse zeigen“, Codex-Spalte.
  - Proben: Kolben gegen Knochenritter > Schwert; Klinge gegen Wolf > Kolben; alte Stände unverändert ladbar (reine Daten).
- **Priorität:** High. **Umfang:** Medium.

### A3 — Gegner verteidigen sich (Schild, Parade, Ausweichen)
- **Problem:** Nur der Spieler hat Deckung, Parade und Rolle. Gegnerschilde sind Bild.
- **Gameplay:**
  - Schildträger blocken von vorn, bis Wucht, Flanke oder Peitsche die Deckung bricht.
  - Elite-Duellanten parieren den 3. Kombo-Schlag.
  - Leichte Banditen weichen einmal aus.
  - Der Spieler muss umgehen, Gefährten nutzen oder die Schlagart wechseln.
- **Interaktion:** A1 (Wucht als Schildbrecher erhält Sinn), A2, Gruppentaktik A8, Peitsche `pull`, Speer.
- **Emergenz:** Formationen (Schildwall der Untoten ist schon als `role` benannt) halten Engpässe. Gefährten werden dadurch wertvoll.
- **Risiko:** Frust bei langen Kämpfen. Deshalb nur frontal, mit Ausdauerkosten, und bei Ausdauer 0 wankt der Gegner (`enemyStamina` gibt es).
- **Umsetzung:**
  - `hit` vor dem Schaden: Hat das Ziel `shield` und steht der Angreifer frontal (< 1,0 rad), gilt `chance(m.block ?? 0.35)`. Dabei `target.stamina -= dmg`, bei `crush` kein Block, bei Ausdauer 0 „Deckung gebrochen“ (gleiche Floats wie beim Spieler).
  - Sonderregel Knochenritter (3355) in die allgemeine Regel überführen.
  - `MONSTERS.*.block`/`parry`/`evade` als Daten.
  - Proben: Frontaltreffer auf Goblin-Krieger wird teils geblockt, Rückentreffer nie; Knochenritter-Verhalten unverändert.
- **Priorität:** High. **Umfang:** Medium.

### A4 — Wahrnehmung statt Radius (Sicht, Licht, Lärm) — Grundlage für §5g.23
- **Problem:** Erkennung ist ein Kreis. Schleichen wächst nie. Der Hinterhalt wirkt nur auf Neutrale. Taschendiebstahl (§5g.23) braucht aber eine Wahrnehmungsregel, sonst wird er ein Würfelwurf im Menü.
- **Gameplay:**
  - Schleichen (Taste halten, halbes Tempo).
  - Gegner haben einen Sichtkegel und hören (Rüstungslärm, Laufen, Kampf).
  - Nacht, Nebel und Innenräume senken die Sicht.
  - Unentdeckt an einen Feind kommen ergibt den Hinterhalt ×1,5 bzw. ×3 wie heute, jetzt auch gegen Feinde.
  - Ein „?“ über dem Kopf zeigt Verdacht, bevor der Gegner angreift.
- **Interaktion:** Schurke/Assassine/Kettenjäger, Rüstung (Platte laut), Wetter `WX.foeSight`, Nacht, Roboterauge (Nachtsicht, Wärmesicht gibt es in body.js), Taschendiebstahl §5g.23, Banden-Lager, Gewölbe.
- **Emergenz:** Nachtangriff auf ein Banditenlager. Mit schwerer Rüstung und Gefährten hört man dich. Das Roboterauge wird ein Schleichwerkzeug.
- **Risiko:** KI-Kosten. Deshalb die Prüfung nur alle 250 ms, Sichtlinie nur unter 300 px. Kämpfe in offenen Feldern ändern sich kaum.
- **Umsetzung:**
  - `nearestTarget` → `perceive(e, t)`: Kegel ±70° (dahinter ×0,35), `clearLine` nur für Kandidaten, Licht aus `R`/Tageszeit.
  - `noise(t)` = Tempo × (1 + Rüstungsgewicht) × (sneak ? 0,4 : 1).
  - Ergebnis `e.suspect` 0–1 (Anzeige „?“ / „!“).
  - `skills.stealth += 0,05` pro Sekunde unentdeckt nahe einem Feind.
  - Hinweis beim ersten Schleichen, Debug-Knopf „Wahrnehmungskegel zeigen“, MECHANIKEN-Eintrag.
  - Proben: Schleichender hinter einem Banditen wird nicht bemerkt (3 s); laufender Held in Platte wird von hinten gehört; Leistung (200 Gegner) gemessen.
- **Priorität:** High. **Umfang:** Large.

### A5 — Gefangennahme: Gnade mit Folgen (schärft §5g.24)
- **Problem:** „Gnade!“ macht den Gegner nur neutral. §5g.24 will „lebend abliefern“, das braucht aber eine allgemeine Gefangenen-Mechanik, nicht nur für Steckbriefe.
- **Gameplay:** Ein ergebener Gegner bietet ein Menü:
  - **Fesseln** (Seil oder Kettenpeitsche; er folgt langsam, Status `shackled` gibt es) und am Kerker abliefern: Kopfgeld × 1,5.
  - **Verhören:** verrät Lager, Anführer oder Versteck als Gerücht mit Kartenkreis.
  - **Anwerben:** Söldner mit Loyalität 20.
  - **Ausrauben.**
  - **Laufen lassen:** 30 % kommt er später als Informant zurück (Hinweis), 15 % als Rächer (`S.avenge`).
- **Interaktion:** Verträge, Banden (§5d.7), Gerüchte (§5e.4), Gefährten-Loyalität, Kerker (`goToJail`-Infrastruktur), Ruf (A10).
- **Emergenz:** Ein verschonter Räuber verrät das Lager der Bande, die später das eigene Dorf überfällt. Ein angeworbener Gefangener verrät die Gruppe.
- **Risiko:** Gefangene, die folgen, haben Wegfindungs-Randfälle (Karte wechseln). Deshalb beim Kartenwechsel „abgeführt“ (bleibt, wird transient an der Zelle abgelegt).
- **Umsetzung:**
  - `surrenderOffer` (6943) verallgemeinern zu `captiveMenu(e)` für jedes `e.surrendered` (Taste E).
  - `e.captive = { by, since }`, folgt wie ein `servant` mit `sp × 0,6`.
  - Ablieferung im Dialog der Wache (`guardChoices`).
  - Speicherbar, weil Gegner schon gespeichert werden; `captive` wird beim Laden bereinigt, wenn die Karte nicht mehr stimmt.
  - Proben: Fesseln → Folgen → Abliefern gibt Gold; Verhör erzeugt ein Gerücht; Laden eines Stands mit Gefangenem.
- **Priorität:** High. **Umfang:** Medium.

### A6 — Ahnenfeind: Der Mörder des Hauses
- **Problem:** Der Tod des Helden ist das Herz des Erbe-Spiels, hat aber keine Spielfolge über Gold und Ruf hinaus. Der Mörder verschwindet.
- **Gameplay:**
  - Tötet ein Gegner (nicht Boss, nicht Umwelt) den Helden, wird er zum **Ahnenfeind**: benannt („Hagen, der Vaterstecher“), Stufe +3, nimmt die **Hauptwaffe** des Toten statt sie im Grab zu lassen, eigene Kraft aus der Todesart.
  - Er steht als Kopfgeld am Brett, taucht in Gerüchten auf und wächst, wenn er weitere Figuren tötet.
  - Der Erbe kann ihn jagen: Erbstück zurück, Ruhm und Chronik „Rache des Hauses“.
  - Man kann ihn auch ignorieren; dann greift er alle 10–20 Tage die Siedlung oder Familie an (Dynastie §5e.2: Kinder).
- **Interaktion:** Elites (`applyElite`, `eliteDrop`), Verträge, Gerüchte, Grab/Erbstücke, benannte Waffe, Dynastie, Chronik, Ruhm.
- **Emergenz:** Eigene Nemesis-Geschichten über Generationen. Stirbt auch der Erbe durch ihn, wird er ein Regionalschrecken („zwei Generationen“).
- **Risiko:** Frust (der Erbe ist schwächer). Deshalb Stufe höchstens Erbe + 3, und der Angriff auf die Familie erst nach 10 Tagen.
- **Umsetzung:**
  - In `playerDeath`: bei `source?.kind === 'enemy' && !boss` → `S.nemesis = { mtype, name, lvl, weapon: item, kills: 1, region, since }`.
  - Waffe aus `grave.loot` in `S.nemesis.weapon` verschieben.
  - `ensureNemesis()` in `continueGame` (transient spawn wie Elites).
  - Verträge: eine Art `bounty` mit `nemesis: true`.
  - `eliteDrop` → Waffe zurück plus Legende „Rächer des Hauses“.
  - Hinweis im Nachruf und in der ersten Szene des Erben. Debug „Ahnenfeind erzeugen“.
  - Proben: Tod durch Bandit → `S.nemesis` gesetzt, Waffe nicht im Grab; Speichern/Laden; Tötung → Waffe fällt, Flag gelöscht.
- **Priorität:** High. **Umfang:** Medium.

### A7 — Beute mit zweitem Leben: Zerlegen und Monstermaterial (Grundlage für §5g.28 Runen)
- **Problem:** Überschuss wird nur verkauft. `bone` ist ohne Zweck. Rezepte nutzen nur Grundstoffe. Runen (§5g.28) brauchen eine Materialquelle.
- **Gameplay:**
  - An Werkbank oder Esse **zerlegen**: gibt Eisen, Holz, Leder und je nach Rarität einen **Splitter** (ungewöhnlich bis legendär).
  - Gegnerfamilien geben ein Kennmaterial: Knochenstaub (Untote), Geisterasche (Geist/Schatten), Messingzahnrad (Automat), Engelsfeder (Omega), Reißzahn (Tiere).
  - Diese Materialien werden Zutat für Runen, Aufwertungsrezepte („Kolben mit Knochenkern“: +Wucht gegen `bone`, nutzt A2) und Handelsware.
- **Interaktion:** Handwerk, Runen, Wirtschaft (Materialien als `GOODS`), A2, Inventar (weniger Ramsch, §5g.37).
- **Emergenz:** Wer im Totenland jagt, wird Knochenschmied. Die Nachfrage nach Engelsfedern steigt nach Omega-Kämpfen.
- **Risiko:** Materialflut, Inventar voll. Deshalb landen Materialien im Lager (`S.res`-artig) oder stapeln hoch; höchstens 5 neue Materialien.
- **Umsetzung:**
  - `salvage(idx)` in game.js neben `craftItem`: Ertrag aus `ITEMS.value` und `RECIPES`-Umkehr, Splitter nach `RARITY_ORDER`.
  - data.js: 5 Materialeinträge; `LOOT` je Familie ergänzen (nur Daten, kein RNG in world.js).
  - `bone` → „Knochenstaub“ (Migration: Schlüssel bleibt).
  - Proben: Zerlegen gibt nie mehr Gold als Verkauf; Rezept mit Monstermaterial funktioniert.
- **Priorität:** High. **Umfang:** Medium.

### A8 — Gruppentaktik: Fokus und Aufmerksamkeit (schärft §5g.7 „bessere Befehle“)
- **Problem:** Befehle gelten für alle, das Ziel ist der nächste Feind. Den Rückenkrit gibt es, aber man kann ihn nicht planen.
- **Gameplay:**
  - **Mittelklick oder Taste F** markiert „unser Ziel“: Alle mit Befehl „Angreifen“ fokussieren es.
  - **Haltung je Gefährte:** Vorn halten (zieht Aufmerksamkeit: Gegner in 80 px wählen ihn mit +50 % Gewicht), Abstand (Schützen/Magier), Heilen.
  - Der Rückenkrit (×2,6 Dolch, Hinterhalt) wird eine Gruppenstrategie.
- **Interaktion:** A3 (Schildwall umgehen), Loyalität (Befehle gegen den Charakterzug: „furchtsam“ in Vorn halten verliert Moral), Koop-Pilot, Tier als viertes Mitglied (§5g.7).
- **Emergenz:** Ein Bär als Tank, der Held flankiert. Stirbt der Tank, bricht die Taktik.
- **Risiko:** UI-Überfrachtung. Deshalb nur ein Feld „Haltung“ im Gruppenfenster und eine Taste für den Fokus.
- **Umsetzung:**
  - `S.partyFocus = id`; in `partyAI` `foe = byId(S.partyFocus) || nächster`.
  - `m.stance ∈ {front, range, heal}` am Gefährten (gespeichert, fehlt → front).
  - In `updateEnemy` bei der Zielwahl: Gewicht für `stance === 'front'` in der Nähe.
  - Proben: Fokus wechselt das Ziel; Gegner wählt den Tank; Stand ohne `stance` lädt.
- **Priorität:** High. **Umfang:** Medium.

### A9 — Klassenregel für jede Grundklasse
- **Problem:** Grundklassen haben 1 Fähigkeit, die frühe Klassenwahl ist leer.
- **Gameplay:** Jede Grundklasse bekommt eine **passive Regel**, die ein vorhandenes System anders spielen lässt:

  | Klasse | Regel |
  |---|---|
  | Krieger | Parade stellt 10 Ausdauer her (Parade als Ressource) |
  | Schütze | Stillstand 1 s: nächster Schuss +25 % und Durchschlag (Stellung) |
  | Schurke | Schleichtempo +30 %, Taschendiebstahl-Bonus (A4 / §5g.23) |
  | Kleriker | Aufrichten und Verbände doppelt so schnell (Kenshi-Rolle Feldscher) |
  | Magier | Zauber, die im Kanal nicht unterbrochen werden, kosten 20 % weniger |
  | Alchemist | Trank- und Giftdauer +50 % |
  | Barde | wird in §5g.31 ausgebaut, nicht hier |

  Die Regel gilt nur in der aktiven Klasse, damit der Klassenwechsel eine Entscheidung ist.
- **Interaktion:** Deckung, Rolle, Schleichen, Downed-System, Alchemie-Handel (§5g.34).
- **Emergenz:** Die Klasse beeinflusst die Gruppe (Kleriker richtet Gefährten schnell auf → mutigere Taktik).
- **Risiko:** Überschneidung mit Talenten. Deshalb die Talente mit gleicher Wirkung prüfen (`SKILL_TREE`) und keine Doppelungen.
- **Umsetzung:**
  - `CLASSES.*.rule` (Text plus Schlüssel), Abfragen an vorhandenen Stellen: `guarded`, `shoot`, `dodge`/Schleichen, `reviveTick`, `castTick`, `useConsumable`.
  - Anzeige im Ausbildungsfenster, Eintrag in MECHANIKEN.
  - Probe je Regel (6 Proben).
- **Priorität:** Medium. **Umfang:** Medium.

### A10 — Ruf der Klinge: Wie du kämpfst, so kämpft man gegen dich
- **Problem:** Gnade und Hinrichtung (Gnadenstoß) haben keine Folge für das Verhalten der Welt.
- **Gameplay:**
  - Ein Zähler je Region: `mercy` gegen `cruelty` (Verschonen, Gefangen nehmen, Hinrichten Wehrloser, Gnadenstöße an Menschen).
  - Hoher Gnaden-Ruf: Menschen ergeben sich öfter (Kapitulationschance ×2), Banden verhandeln Wegzoll.
  - Hoher Grausamkeits-Ruf: Gegner fliehen früher (Moral), ergeben sich nie, Anführer rufen mehr Hilfe; Kette und Kult bieten Arbeit an.
- **Interaktion:** A5, Kapitulation (3843), Banden, Gefährten-Charakterzüge (gütig/grausam, `partyReact`), Ruhm, Dunkle Klassen der Kette.
- **Emergenz:** Man wird zur Legende, vor der Banditen weglaufen, und bekommt kaum noch Kopfgeld-Kämpfe. Oder man wird der Barmherzige, dem Gefangene folgen.
- **Risiko:** Ein weiterer Ruf-Wert (Bloat). Deshalb **als Achse in `S.fame`** führen, nicht als neue Ebene.
- **Umsetzung:**
  - `S.fameStyle[region] ∈ [-100, 100]`, geändert in `die` (Gnadenstoß an Menschen), `captiveMenu`, Hinrichtungsdialog 6949.
  - Wirkung in `updateEnemy`: Kapitulationschance und Fluchtschwelle.
  - Anzeige im Charakterfenster unter Ruhm, Kommentar der Gefährten.
  - Proben: Grausamkeit senkt die Kapitulationschance; Stand ohne Feld lädt.
- **Priorität:** Medium. **Umfang:** Small.

### A11 — Verletzung → Amputation → Prothese
- **Problem:** Verletzungen (Brüche, Entzündung) und Bionik (P1–P5) sind getrennt. Eine Prothese braucht ein verlorenes Glied, und das gibt es fast nur durch Abtrennung unter −200 LP.
- **Gameplay:**
  - Eine unbehandelte Entzündung am Glied wird nach 4 Tagen zu „Wundbrand“.
  - Die Heilerin bietet Reinigung (teuer, 50 % Erfolg) oder Amputation (sicher). Unbehandelt folgt Fieber (Ausdauer −50 %, Rumpfschaden steigt), am Ende der Tod möglich (nur „Schwer“/„Sehr schwer“).
  - Nach der Amputation führt der Weg zu Prothese, Aurelion und Wartung.
- **Interaktion:** Bionik (Händler, Schwarzmarkt, Wartung), Medizin-Fertigkeit, Feldscher der Eisenfeste, Schwierigkeit, Wirtschaft (Nachfrage nach Prothesen).
- **Emergenz:** Ein Held, der im Moor ohne Heilerin feststeckt, entscheidet selbst („Notamputation“ mit Medizin ≥ 30). Aus einer Wunde wird ein Aurelion-Kunde mit Schulden.
- **Risiko:** Fühlt sich strafend an. Deshalb klare Warnungen über 3 Tage, „Angsthase“ ohne Wundbrand.
- **Umsetzung:**
  - `woundDay` (10869): `s.part` merken (bei `woundSet` setzen), ab Tag 4 `gangrene`.
  - `woundCare` neue Wahl „Abnehmen“ → `B.sever(c, part)` (body.js, vorhandene Abtrennlogik).
  - Hinweis-Logs, Debug „Wundbrand setzen“.
  - Proben: Wundbrand nach 4 Tagen; Amputation → Prothese passt; Angsthase nie Wundbrand.
- **Priorität:** Medium. **Umfang:** Small–Medium.

### A12 — Waffenkunst: Übung schaltet Handgriffe frei
- **Problem:** Waffenfertigkeiten geben nur Zahlen (+0,22 Schaden je Punkt, Tempo). Der Kenshi-Ansatz „durch Tun lernen“ endet in Prozenten.
- **Gameplay:** Je Waffenfamilie bei 25/50/75 ein Handgriff (Log und Toast beim Erreichen). Beispiele:

  | Familie | Handgriffe |
  |---|---|
  | Axt | Schild spalten (Frontblock von A3 wird bei 50 % gebrochen) |
  | Kolben | Rüstung verbeulen (−2 Rüstung für 8 s, nutzt A2) |
  | Speer | Stoß durch zwei |
  | Dolch | Kehlschnitt aus dem Schleichen (A4) |
  | Schwert | Riposte ohne Rapier |
  | Stangenwaffe | Abstand halten (Rückstoß ×1,5) |

- **Interaktion:** A2, A3, A4, Handwerk (Meister verkaufen Übungsbücher → Fertigkeit +5), Lehrer.
- **Emergenz:** Man bleibt bei einer Waffe, weil man in ihr gut ist. Der Erbe muss neu lernen, deshalb ist das Erbstück eine Entscheidung (A6).
- **Risiko:** Überlappung mit Talenten (Klingenmeister). Die Handgriffe sind qualitativ, die Talente quantitativ.
- **Umsetzung:**
  - `WPN_ART[skill] = [[25, key], [50, key], [75, key]]`; `artOf(c, key)` in `hit`/`resolveSwing`.
  - Hinweis im Charakterfenster je Fertigkeit.
  - Proben je Handgriff. Wird erst nach A2/A3 sinnvoll.
- **Priorität:** Medium. **Umfang:** Medium.

### A13 — Tote Fertigkeiten beleben
- **Problem:**
  - Jagd hat 0 Wirkung.
  - Schleichen wächst nie.
  - Führung wächst nicht durchs Tun.
  - Die UI zeigt „(noch ohne Wirkung)“ auch für Handwerk, das längst wirkt.
- **Gameplay:**
  - Führung wächst durch Siege mit Gruppe und durch Befehle (A8). Sie hebt Moral- und Loyalitätszuwachs und die Kapitulationschance von Gegnern gegen die Gruppe.
  - Schleichen: A4.
  - Jagd: entweder in §5g.12 (Fährten, Häuten) mit Wirkung versehen oder in Überleben aufgehen lassen.
- **Interaktion:** Gefährten, A4, A8, §5g.12.
- **Emergenz:** gering. Hier geht es um Ehrlichkeit gegenüber dem Spieler.
- **Risiko:** keins.
- **Umsetzung:**
  - `skills.leadership += 0,2` je Kampfsieg mit ≥ 1 Gefährten.
  - `loyAdd` × (1 + Führung/200).
  - ui.js 708 Tooltips korrigieren.
  - Probe: Führung steigt nach einem Gruppenkampf.
- **Priorität:** Medium. **Umfang:** Small.

### A14 — Hunger und Rast mit Wirkung (nach Schwierigkeit)
- **Problem:** Allein gibt es kein Überleben (−4 Rumpf, nie unter 1). Das Wetter wirkt, Hunger nicht.
- **Gameplay:**
  - **Satt** (gegessen heute): kein Effekt.
  - **Hungrig** (1 Tag): max. Ausdauer −20 %.
  - **Ausgehungert** (2+ Tage): Ausdauer −40 %, Krit −3 %, Aufrichten langsamer.
  - **Müde** (> 20 Spielstunden wach): Wahrnehmung −2, der Sichtkegel (A4) wird schmaler.
  - Rast am Lagerfeuer oder in der Schenke beendet die Müdigkeit. Nachts im Freien steigt die Chance auf einen Banden-Überfall.
  - Auf „Leicht“ nur Hinweise, auf „Sehr schwer“ voll.
- **Interaktion:** Wetter (Schnee isst mehr, gibt es schon), Schenke, Siedlung (Nahrung), Handel (Proviant als Ware), Banden, A4.
- **Emergenz:** Lange Gewölbe-Touren brauchen Planung. Ein Ausgehungerter kämpft schlechter und verhandelt eher.
- **Risiko:** Mikromanagement. Deshalb **automatisches Essen** aus Gepäck oder Vorrat, nur der Mangel wird spürbar.
- **Umsetzung:**
  - In `dayTick` Status `hungry`/`starving` statt −4 Rumpf; `wake` in `S.player`.
  - `recalc` liest die Stati.
  - `DIFF.survival` (0/0,5/1).
  - Hinweis beim ersten Hunger, Debug-Knöpfe.
  - Probe: Ohne Essen zwei Tage → `starving`, maxStamina gesunken.
- **Priorität:** Medium. **Umfang:** Small–Medium.

### A15 — Eisen-Kette schließen (Merge)
- **Problem:** Erzfuhre und Barren (Wirtschaft) und Eisenerz (Handwerk/Reparatur) sind getrennt. Die Wirtschaft spürt den Spieler-Schmied nicht.
- **Gameplay:**
  - Esse: „Schmelzen“ (3 Erz → 1 Barren); Erzfuhre = 5 Eisenerz beim Abladen.
  - Plattenpanzer braucht schon Barren, jetzt ist der Weg sichtbar.
  - Streik oder Sklavenaufstand (Stillstand der Minen, §5c) macht Eisen teuer. Der Spieler merkt es beim Schmieden.
- **Interaktion:** Wirtschaft (`S.eco`, `S.after.pmul`), Handwerk, Siedlung (Mine), Große Ereignisse.
- **Emergenz:** Nach dem Sklavenaufstand wird Selbstabbau lohnend. Der Spieler kann Barren an knappe Städte liefern.
- **Risiko:** gering.
- **Umsetzung:**
  - 2 Rezepte in `RECIPES` (`need` erlaubt Gegenstände).
  - `matHave('iron')` zählt `ore` × 5 optional nicht (klar getrennt lassen, nur Umwandeln).
  - Probe.
- **Priorität:** Low. **Umfang:** Small.

### A16 — Gefährten-Abgang vereinheitlichen (Merge)
- **Problem:** Zwei Abgangswege. Moral < 12 → 40 % gehen (dayTick), Loyalität < 15 → Verrat (loyDay). Der Spieler versteht nicht, welcher Wert zählt.
- **Gameplay:** Die Moral ist die Tagesstimmung (Kampfkraft, Sprüche). Sie wirkt auf die Loyalität (gibt es schon: −3 bei schlechter Moral). Nur die Loyalität entscheidet über Gehen oder Verraten.
  - Gehen (Loyalität 15–25, wenn der Gefährte „gütig“ oder „furchtsam“ ist).
  - Verrat (< 15).
- **Interaktion:** Loyalität, Charakterzüge, A13 (Führung).
- **Emergenz:** Charakterzüge bestimmen, wie jemand geht.
- **Risiko:** Alte Stände mit niedriger Moral. Keine Migration nötig.
- **Umsetzung:**
  - In `dayTick` (Moral < 12) statt `chance(0.4)`-Abgang → `loyAdd(m, -5)`.
  - `loyDay` gehen/verraten nach Zug.
  - Probe.
- **Priorität:** Low. **Umfang:** Small.

### Schärfungen geplanter Punkte (§5g, keine neuen Ideen)

- **§5g.20 Skalierung:** Nicht nur Kopfgeldjäger. Messung: ab St. 30 ist 1-gegen-1 gelöst. Skalierung sollte **Gruppengröße und Rollenmix** heben (mehr Schildträger aus A3, Heiler, Schützen), nicht nur Lebenspunkte. Sonst dauert es länger, wird aber nicht spannender.
- **§5g.26 Magie-Kombos und §5g.34 Fallen:** Eine Oberflächen-Regel für beide: `GROUND` bekommt `oil`, `water`, `poison`. Feuer auf Öl ergibt Brand, Frost auf Wasser Eis, Blitz auf Wasser Schock im Umkreis. Fallen legen diese Flächen, statt eigene Logik mitzubringen. Rückstoß (`kb`) in eine Brandfläche wird Taktik.
- **§5g.23 Taschendiebstahl:** Ohne A4 ist er ein Würfelwurf. A4 zuerst bauen.
- **§5g.24 Steckbriefe:** Auf A5 (Gefangennahme) aufsetzen, damit „lebend“ überall gilt und nicht nur beim Steckbrief.
- **§5g.28 Runen:** Aus A7 (Splitter und Monstermaterial) speisen, Runen wirken auf A2 (Schlagart und Rüstungsklasse). Sonst werden Runen nur Affix Nummer 16–30.
- **§5g.7 Gefährten-Ausrüstung:** Um A8 (Fokus, Haltung) ergänzen. Ausrüstung ohne Taktik bleibt Werteverteilung.

---

## 9. Einordnung

| Kategorie | Punkte |
|---|---|
| **NOW** | A1 Wucht-Stunlock (Critical, klein, gemessener Fehler) · A13 Tote Fertigkeiten und Tooltips · A5 Gefangennahme (Vorbedingung für §5g.24) · A6 Ahnenfeind (höchster Spielerwert je Aufwand: nutzt Elites, Grab, Verträge) |
| **NEXT** | A2 Rüstungsklassen und Schlagarten · A3 Gegner verteidigen sich · A8 Fokus und Haltung (mit §5g.7) · A7 Zerlegen und Monstermaterial (vor §5g.28) · A10 Ruf der Klinge |
| **LATER** | A4 Wahrnehmung (groß, aber Grundlage für §5g.23; vor Taschendiebstahl) · A9 Klassenregeln · A11 Wundbrand/Amputation · A12 Waffenkunst (nach A2/A3) · A14 Hunger und Rast |
| **EXPERIMENTAL** | A14 auf „Sehr schwer“ zuerst testen · A10-Wirkung auf Banden-Wegzoll |
| **CUT/MERGE** | A15 Eisen-Kette · A16 ein Abgangsweg für Gefährten · `bone` ohne Zweck (in A7 aufgehen lassen oder streichen) · Fertigkeit Jagd (in Überleben oder §5g.12) · Doku-Drift IST_ZUSTAND §2.2/§2.20, Kommentar levelUp 3730, ui.js 708 |

**Reihenfolge der Abhängigkeiten:**
1. A1
2. A13, A5, dann A6
3. A2, dann A3, dann A8
4. A7, dann §5g.28
5. A4, dann §5g.23, dann A12
