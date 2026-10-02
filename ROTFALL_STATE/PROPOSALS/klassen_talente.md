# Klassen-Prüfung und Sternbild-Talentbäume (Vorschlag, 02.10.2026)

**Wunsch des Entwicklers (02.10.2026, sinngemäß):** Wer z. B. Krieger werden will, soll nicht nur zahlen, sondern auch 1–2 Aufträge erfüllen. Danach folgen eine Animation und eine kleine Szene. Es soll mehr Talentpunkte geben, und jede Klasse bekommt ihren eigenen Talentbaum im Stil der Skyrim-Sternbilder. Bis dahin sind alle Talentbäume versteckt.
**Stand:** Das Verstecken ist schon gebaut: Der Reiter „Talente“ fehlt in der Gruppe `char` (`ui.js:39`), Taste T zeigt nur eine Meldung (`game.js:15880`), der Hinweis „talent“ ist aus (`game.js:8397`). Punkte sammeln sich weiter, und gelernte Knoten wirken weiter.
**Status nach GATE:** Schritt 1–3 und 8 sind erledigt. **STATUS: TEILWEISE DEFINIERT.** Ohne Antworten auf die offenen Entscheidungen (§6) wird nichts gebaut.
**Entwurf:** `designs/talente_sternbild.html` (klickbar). Dazu zwei Bilder: `designs/talente_sternbild_himmel.png` (Übersicht) und `designs/talente_sternbild.png` („Der Schild“, aufgezoomt, mit Ritter- und Todesritter-Arm).

---

## 1. Bestandsaufnahme (belegt im Code)

### 1.1 Klassen und wie man sie heute bekommt

**Grundgerüst:** `CLASSES` (`data.js:623`). Es gibt 19 Klassen plus den Wanderer. Jede Klasse hat ein `parent` (Vorstufe), `abilities` (ersetzt die Leiste beim Wechsel) und teils `weak`, `faction` und `chainRank`. Die Kette dazu läuft so:

1. `talk()` → „Kannst du mich ausbilden? (X)“ (`game.js:12800`)
2. → `teachable(npc)` → `teach(npc, cls)` (`game.js:13678`)
3. → `unlockClass(cls)` (`game.js:13439`)

**Prüfungen in `teach()`, der Reihe nach:**
1. Die Vorstufe ist bekannt (`parentFor`, auch `alt`).
2. Für dunkle Klassen reicht der Kettenrang (`chainRank`).
3. Für den Paladin ist `q_paladin3` erledigt.
4. Die Beziehung zum Lehrer ist mindestens 20 (bei Rook 40). Fehlt sie, folgt `teacherTrial()` (`game.js:13668`): eine **„Bewährung“** (Rohstoffe aus `TRIAL_NEED`, z. B. Krieger 5 Eisen) **oder Lehrgeld** `40 + 15 × Stufe` Gold. Beides hebt nur die Beziehung.
5. Danach ist die Ausbildung **kostenlos und sofort**: `unlockClass` → `setClass`, eine Meldung „X FREIGESCHALTET“ und ein Chronik-Eintrag.

**Heute gibt es keine Szene, keine Geste und keine Namenskarte.** „Bezahlen“ heißt also heute: Vertrauen kaufen.

| Klasse | Vorstufe | Lehrer (Ort) | Heutiger Zusatz |
|---|---|---|---|
| Krieger | Wanderer | Borin (Eren, Schenke), Hauke (Nordfurt), Kaelis Vey (Aurelheim) | Bewährung 5 Eisen / Lehrgeld |
| Schütze | Wanderer | Tomas (Eren), Wenzel (Weidenau) | 8 Holz / Lehrgeld |
| Schurke | Wanderer | Rook (Banditenlager, Beziehung 40), Nix (Salzhafen), Kaelis | 60 Gold / Lehrgeld |
| Kleriker | Wanderer | Elena (Eren), Schwester Adela (Lichtenrain) | 5 Kraut |
| Magier | Wanderer | Morvath (Friedhof), Serafine (Kreuzweg) | 6 Kraut |
| Barde | Wanderer | Lioba (Kreuzweg), Jasper (Kupferhafen) | 4 Nahrung |
| Alchemist | Wanderer | Quirin (Salzhafen), Orrin (Mühlbach) | 8 Kraut |
| Ritter | Krieger | Kelan (Schrein), Hauke | 8 Eisen |
| **Paladin** | Ritter | Kelan | **schon heute 3 Prüfungsaufträge** `q_paladin1–3` (4 Untote, Ordenssiegel aus der Grube, Schrein halten); `reward.unlock:'paladin'` |
| Waldläufer | Schütze | Tomas, Wenzel | 5 Nahrung |
| Berserker | Krieger | Oda (Grenzwacht), Ulfar (Rastfurt) | 6 Eisen |
| Assassine | Schurke | Rook | 120 Gold |
| **Todesritter** | Krieger | Weihe bei Sael/Ysra (`deathRite`, `game.js:13460`) | Untoten-Rang 3 (Rangaufträge); danach Eidwacht `dk_1–3` (Rüstungslinie) |
| **Dunkler Hochpaladin** | Krieger | Ritus bei Varg (`chainRite`, `game.js:6590`) | Kettenrang 3 (Rangaufträge) |
| Dunkler Priester | Kleriker **oder** Magier | Vater Ansgar (Eisenfeste) | Kettenrang 1 |
| Kettenjäger | Schütze | Rulf | Kettenrang 2 |
| Folterknecht | Schurke | Mordek | Kettenrang 1 |
| Kettenbarde | Barde | Sibylla | Kettenrang 0 |

**Titelklassen** (`TITLE_CLASSES`, `data.js:783`): Nekromant, Hexenmeister, Druide, Mönch, Grubenhäuptling und Vampir.
- Man erwirbt sie über **Aufträge mit einer Tat** (`q_pact`, `q_grove`, `q_monk`, Grisk, der Kelch).
- Die Kosten sind dauerhaft (`cost`), höchstens 2 Titel (`MAX_TITLES`), getragen wird einer.
- **Grade I–III** bekommt man über Taten plus Stufe; dann weiht der Meister (`gradeTalk`, `game.js:14202`, ohne Szene).
- **Klassen-Questreihen `c_*`** gibt es nur für Titelklassen: `classQ:[titel, schritt, grad]` mit 12 Aufträgen (Nekromant, Hexenmeister, Druide, Mönch, je 3). Jeder gibt ein gebundenes Rüstungsteil (`questAvailable`, `game.js:13298`).
- Für **Grundklassen gibt es keine `c_*`-Aufträge.** Wiederverwendbar sind nur Kelans Paladin-Prüfungen, die Eidwacht und die Rang-Questlines.

### 1.2 Talentpunkte heute

- **Zahl:** `TALENT_EVERY = 3` (`game.js:4197`) heißt 1 Punkt zum Start und 1 auf jeder 3. Stufe. Das ergibt **6 Punkte auf Stufe 15, 11 auf Stufe 30 und 21 auf Stufe 60.**
- **Altstände:** Fehlt `skillPoints`, gibt es `Stufe − 1` Punkte (`game.js:2351`).
- **Vergessen** (`respec`, `game.js:13474`): Das geht bei **jedem Lehrer** und kostet `30 + 10 × Stufe` Gold. Alle Punkte kommen zurück, `p.tree = {}`.
- **Debug:** „Talentpunkt geben“ / „5 Talentpunkte geben“ (`game.js:16598`).

### 1.3 Der heutige SKILL_TREE (`data.js:899–998`)

**65 Knoten in 8 Zweigen**, davon 5 mit `excl`. Lernbar sind also **60**, nicht 59 wie in MECHANIKEN.

| Zweig | Knoten | Art der Wirkung |
|---|---|---|
| Kampf, Magie, Überleben (für alle) | je 10 (2 Einstieg, 3+3 Mitte, 2 Schlüssel) | Werte über `fx` (hp, dmg, armor, crit, stam, spell, cdr, mana, heal, speed, dodge, invCap), 3 aktive Knoten (`war_cry`, `blink`, `first_aid`) |
| Nekromantie, Hexerei, Hainkunde, Stille Hand | je 7 (Titel, versiegelt ohne Titel) | `fx:{}`; die Wirkung hängt am Schlüssel im Code (`node(p,'n_bind')` …) |
| Todesritter (`cls:'deathknight'`) | 7 | öffnet sich mit der **Klasse**; Schlüsselknoten wirken nur bei aktiver Klasse. Das ist das einzige Klassen-Vorbild. |

**Logik:**
- `branchOpen` / `nodeState` / `learnNode` (`game.js:15356–15375`).
- `treeFx` summiert **alle** gelernten `fx`, egal welche Klasse aktiv ist (`game.js:64`).
- **46 Stellen im Code fragen Knoten-Schlüssel ab** (`node(p,'k_legion')` usw.). **Die Schlüssel müssen also stabil bleiben.**

**Darstellung:** `skillUI` (`ui.js:1272`) zeigt ein Spaltenraster mit Canvas-Linien, Zweig-Symbolen und einer Vorschaukarte. Das ist Scheibe 1+2 aus `visual/skilltree.md`. Es gibt **keine x/y-Positionen** in den Daten.

### 1.4 Wer darauf aufbaut

- **Proben:**
  - „Skill-Baum: Daten stimmig“ (`game.js:18183`): Voraussetzungen im selben Zweig, Einstieg je Zweig, Schlüssel mit Absicht und Preis.
  - „Skill-Baum: Punkte …“ (`18187`) und „aktiver Knoten / Umlernen“ (`18341`).
  - „S13 Level“ (`18764`).
  - **„Höchststufe 60“ (`18770`)** prüft `Punkte / lernbare Knoten` im Bereich **0,3–0,7** über **alle** Knoten. **Diese Probe bricht, sobald Klassenbäume dazukommen**, weil sie nicht misst, was eine Figur erreichen kann.
  - „Todesritter-Talente“ (`19130`).
  - „Lehrer in den Städten“ (`19117`) und „jede lernbare Klasse hat einen Lehrer“ (`18327`).
  - Paladin-Kette (`16814`), Klassen-Rüstung `c_*` (`19026`) und Dunkle Klassen (`20363`).
  - BUG-123: Der Selbsttest ändert `skillPoints` des echten Helden nicht (`20990`).
- **Koop:**
  - Gast-Helden haben eigene `tree` und `skillPoints` (`coop.js:388/434`), und `learnNode` läuft als `runAs` (`coop.js:260`).
  - **Befund:** `levelUp` gibt Gastfiguren (`coopHero`) **nur Statpunkte, keine Talentpunkte** (`game.js:4207`).
  - Kamerafahrten werden an Gäste gespiegelt (`coop.js:390`: Kamera und Text).
- **Erbe:**
  - `adoptSuccessor` (`game.js:15645`) setzt weder `tree` noch `skillPoints`.
  - **Befund:** Bis zum Neuladen hat der Erbe 0 Punkte. Beim Laden greift die Altstand-Regel (`2351`) und gibt `Stufe − 1` Punkte, also mehr als die Regel. Ein Erbe auf Stufe 12 bekommt 11 statt 5.
- **Gefährten:** Sie haben `cls/currentClass/knownClasses`, aber **keinen Baum**. Lehrer bilden keine Gefährten aus.
- **Speicher:** `p.tree` (Objekt Schlüssel → 1), `p.skillPoints`, `p.knownClasses`, `p.currentClass`, `p.titleClasses`, `p.tgrade`, `p.tdeed`, `S.quests`. Laufende Prüfungen liegen in `S.trial` und **werden gespeichert** (nicht in `SKIP`).
- **Doku-Widersprüche** (nur melden, nicht ändern):
  - `BALANCE_GUIDE §7` sagt `TALENT_EVERY = 2` / 31 Punkte, der Code hat 3 / 21.
  - Die Kommentare `game.js:2115` („jeder zweiten Stufe“) und `4208` („geraden Stufen“) sind veraltet.
  - Der Text in `skillUI` sagt „einer je Stufe“.
  - Die Aufstiegsmeldung nennt noch „Talente, T“ (`game.js:4210`), obwohl der Baum versteckt ist.
  - `classUI` sagt „ihre Talentzweige gelten beide“, aber **Vampir und Grubenhäuptling haben gar keinen Talentzweig**.

### 1.5 Vorhandene Bausteine für den Wunsch

- **Prüfungsaufträge:** `QUESTS` mit Zieltypen `kill`, `item`, `hold`, `find`, `dodge`, `custom`, `reward.unlock:cls` → `unlockClass` (`game.js:13348`). Der Paladin ist genau das Muster, das der Entwickler beschreibt.
- **Vor-Ort-Prüfungen:** `S.trial` / `startTrial(kind, at)` (`game.js:13560`) mit Zeitlimit, Übungsgegnern (`acad_dummy`, `acad_student`), Wiederholung nach Fehlschlag und einem frei wählbaren Ort `at`. Die Arten heute: Zielübung (mit Zaubern), Schildprüfung, Heilprüfung, Duell und Ilvars Endprüfung.
- **Regiebuch:** `cinematic(shots, done, {pause, stay})` (`game.js:10297`) mit Beats `sfx/fx/zoom/cam/gesture/say/card/flash/do`. ESC überspringt, die `do`-Folgen laufen trotzdem.
  - `nameCard()` (`10339`)
  - `gesture()` mit `knien`, `salutieren`, `jubeln`, `zeigen`, `trauern`, `abwehren` (`anim.js:22`)
  - Sprechblasen `bubble()`
  - Musterszenen: Goblinsturm (`8380`), Boss-Auftritte.

---

## 2. Vorschlag „Klassen-Prüfung“

### 2.1 Ablauf (bestehende Systeme, kein Sonderweg)

1. **Vertrauen:** Bewährung oder Lehrgeld bleibt wie heute (`teacherTrial`). Das ist das „Bezahlen“.
2. **Prüfung:** Statt sofort `unlockClass` bietet der Lehrer **die Prüfung der Klasse** an. Das sind 1–2 Einträge in `QUESTS` mit neuem Feld **`clsTrial:[klasse, schritt]`**, nach dem Muster von `classQ`/`dkQ`. `questAvailable` regelt die Reihenfolge, der letzte Schritt trägt `reward.unlock: klasse`. Jeder Lehrer derselben Klasse nimmt die Prüfung ab (Geber = `giverProf`/`teaches`, so wie bei den Rangaufträgen der Kette). Der Fortschritt geht also nicht verloren, wenn ein Lehrer stirbt (Nachfolger-System `19122`).
3. **Teil A „Feldprüfung“** ist ein normaler Auftrag mit vorhandenen Zieltypen (`kill`/`item`/`hold`/`dodge`).
4. **Teil B „Meisterprüfung“** findet vor Ort beim Lehrer statt, über **`startTrial(art, lehrerPos)`**. Die Art des Lehrers wird erweitert (z. B. Duell, Bogen-Zielübung). Bei einem Fehlschlag darf man es wie an der Akademie erneut versuchen (siehe Entscheidung 5).
5. **Aufnahme:** `turnIn` des letzten Schritts → `unlockClass` → **Aufnahmeszene** (2.3) → die neue Fähigkeit wird einmal vorgeführt → **das Sternbild der Klasse erscheint** (Abschnitt 3, ein Hinweis zeigt darauf).

### 2.2 Prüfungen je Klasse

- **(v)** = sofort mit vorhandenen Bausteinen machbar.
- **(+)** = braucht eine kleine Erweiterung (siehe Impact Report).
- Zahlen in Klammern sind Platzhalter aus vergleichbaren vorhandenen Aufträgen (z. B. `q_paladin1`: 4 Untote, `q_wolves`: 3 Wölfe). **Die Zahlen und die Wahl der Prüfungen entscheidet der Entwickler.**

| Klasse | Teil A — Feldprüfung | Teil B — Meisterprüfung beim Lehrer | Szene / Spruch |
|---|---|---|---|
| **Krieger** | „Blut an der Klinge“: 4 Banditen besiegen (v) | „Der Kreis“: Duell gegen den Lehrer bzw. einen Übungsgegner, bis einer aufgibt — das vorhandene `duel` am Lehrerort (+) | Lehrer: „Steh auf. Du bist kein Wanderer mehr.“ |
| **Schütze** | „Wölfe an der Hürde“-Art: 3 Wölfe + 3 Wolfsfelle (`pelt`) (v) | „Zehn, zwanzig, dreißig Schritt“: Zielübung mit Puppen, **mit dem Bogen** (Variante von `aim`, heute nur Zauber) (+) | Lehrer reicht einen Pfeil |
| **Schurke** | „Leichte Finger“: einen Gegenstand stehlen (vorhandene Diebstahlprobe wie bei Vesk) (+) | „Von hinten“: 3 Meuchelstiche an Übungspuppen, ohne bemerkt zu werden (+) | Nix/Rook: „Hab dich nie gesehen.“ |
| **Kleriker** | „Die Kranken“: 5 Heilkraut (v) + 4 Untote zur Ruhe (v) | **Heilprüfung** `heal` (vorhanden) am Lehrerort | Segensgeste, Lichtschein |
| **Magier** | „Grabsiegel-Art“: 1 Gegenstand aus einem Gewölbe (v) | **Zielübung** `aim` (mit Zaubern, vorhanden) **oder Schildprüfung** `shield` (vorhanden) | Funke in der Hand des Lehrers |
| **Barde** | „Ein Abend in der Schenke“: ein Schenkenspiel gewinnen (§5e.5) (+) | „Das Lied trägt“: einen Kampf mit mindestens 2 Gefährten gewinnen, während das Kriegslied wirkt (+) | Schenke jubelt |
| **Alchemist** | „Für den Kessel“: 8 Kraut + 1 Seelenphiole (v) | „Drei Tränke“: 3 Heiltränke brauen (Handwerk vorhanden, Zieltyp `craft` fehlt) (+) | Kessel raucht auf |
| **Ritter** | „Ein Eid mit Rüstung“: einen Ort gegen einen Überfall halten (`hold`, heute fest am Schrein) (+) | Duell in Rüstung (Schild Pflicht) (+) | Ritterschlag: Knien, Schwert auf die Schulter |
| **Paladin** | **Bleibt `q_paladin1–3`** (vorhanden, 3 Aufträge) | — | **nur die Szene neu** |
| **Waldläufer** | „Der Bär im Revier“: 1 Bär (v) | eine Nacht draußen überleben (Lager/Feuer aus A14) (+) | Lehrer pfeift, ein Falke landet (nur Bild) |
| **Berserker** | „Narben“: 5 Gegner besiegen (v) | „Schmerz lehrt“: Grubenkampf bei Ulfar bzw. Oda, unter 30 % Leben gewinnen (+) | Brüllen, Kamera wackelt |
| **Assassine** | einen Steckbrief/Kopfgeld-Auftrag erfüllen (Auftragssystem `conKill`, vorhanden) (v) | — (eine Prüfung genügt?) | Rook schiebt einen Dolch über den Tisch |
| **Todesritter** | **Untoten-Rangaufträge** (vorhanden) | — | **Todesweihe als Szene** (heute nur Dialog) |
| **Dunkler Hochpaladin** | **Kettenrang 3** (vorhanden) | — | **Ritus der Kette als Szene** |
| **Dunkle Klassen** (Priester, Kettenjäger, Folterknecht, Kettenbarde) | **Kettenrang** (vorhanden) | je 1 Prüfung beim Lehrer? → Entscheidung 4 | Kettengeste, Trommel |
| **Titelklassen** | **unverändert** (Pakt- und Hain-Aufträge, Probe der Stillen Hand …) | — | **Szene beim Erwerb und bei der Grad-Weihe** (Entscheidung 10) |

### 2.3 Aufnahmeszene (Regiebuch, Vorlage für alle Klassen)

Die Szene ist eine Funktion **`classRite(npc, cls)`** mit Text, Spruch, Farbe und Effekt je Klasse aus einer Tabelle. Sie ist **kein** Sonderfall je Klasse.

1. Kamera zum Lehrer (Zoom 1,3). Der Lehrer **zeigt** auf den Helden, Sprechblase mit dem Spruch der Klasse.
2. Der Held **kniet** (`knien`). Ein Lichtblitz in der Farbe der Klasse (`flash`), ein Effekt am Helden (`fx`), ein Klang.
3. Der Held steht. **Namenskarte** „KRIEGER“ / Untertitel `CLASSES[cls].desc`. Umstehende Wachen **salutieren**, Schenkengäste **jubeln**.
4. **Aufnahme-Animation:** Der Held führt die erste Klassenfähigkeit einmal ins Leere aus (nur das Bild, kein Schaden). Ein Stern steigt auf, und der Hinweis „Ein neues Sternbild: Der Schild (T)“ erscheint.

- **Länge** nach dem Vorbild der Boss-Auftritte etwa 5–6 s, ob mit Pause ist Entscheidung 7.
- **ESC** überspringt. Die Folgen (`unlockClass`, Chronik, Hinweis) liegen im `do`-Beat und laufen immer.
- **Koop:** Kamera und Text gehen schon heute an die Gäste. Ob Namenskarte und Blasen gespiegelt werden, muss geprüft werden.

---

## 3. Vorschlag „Talentbäume je Klasse im Sternbild-Stil“

### 3.1 Struktur

Die heutigen Knoten bleiben, wo sie wirken. **Alle 65 Schlüssel bleiben gleich**, damit die 46 Abfragen im Code nicht brechen.

- **Sternbild „Der Wanderer“** (für alle, immer offen) übernimmt Kampf, Magie und Überleben als drei Arme: Klinge, Stern, Blatt. Das sind dieselben 30 Knoten mit denselben Wirkungen.
- **Ein Sternbild je Grundklassen-Linie** (Variante B, Entscheidung 2). Es hat einen **Stamm** der Grundklasse und **Arme** für die Folgeklassen. Ein Arm öffnet sich erst mit der Folgeklasse, so wie heute der Todesritter-Zweig.

| Sternbild (Arbeitsname) | Stamm | Arme (öffnen mit der Klasse) |
|---|---|---|
| **Der Schild** | Krieger | Ritter → Paladin (ein langer Arm), Berserker, **Todesritter (die heutigen 7 Knoten `dk_*`, Schlüssel bleiben)**, Dunkler Hochpaladin |
| **Der Falke** | Schütze | Waldläufer, Kettenjäger |
| **Der Dolch** | Schurke | Assassine, Folterknecht |
| **Die Lampe** | Kleriker | Dunkler Priester (auch über Magier) |
| **Die Flamme** | Magier | Dunkler Priester (zweiter Zugang) |
| **Die Laute** | Barde | Kettenbarde |
| **Der Kessel** | Alchemist | — |
| **Titel-Sternbilder** | Nekromant, Hexenmeister, Druide, Mönch (die heutigen 7er-Zweige, Schlüssel bleiben) | **Vampir und Grubenhäuptling haben noch keinen** (Entscheidung 11) |

**Aufbau eines Stamms**, abgeleitet aus dem heutigen 10er-Zweig:
- 2 Einstiegssterne
- 3 mittlere Sterne, davon 1 Merkmal (`notable`) und 1 aktiver Stern
- 2 Schlüsselsterne, die einander ausschließen (`excl`, wie bei den Titeln)
- 1 Verbindungsstern zum Arm

Das sind **8 Sterne**. Ein **Arm** hat 4 Sterne: 2 kleine, 1 Merkmal und 1 Schlüssel.

Die **Wirkung** der Klassensterne verändert vor allem die **Fähigkeiten der eigenen Klasse**, z. B. „Wuchtschlag betäubt länger“ oder „Gezielter Schuss durchschlägt“. Das ist dasselbe Muster wie bei den Titelzweigen (`fx:{}`, Regel am Schlüssel). Reine Werte (`fx`) gibt es höchstens 2 je Stamm, im Band von `BALANCE_GUIDE §7` (+5–8 %, +2 Rüstung, +10–15 Ausdauer). So bleibt der Machtzuwachs an die aktive Klasse gebunden und häuft sich nicht über viele Klassen.

**Umfang neu:** 7 Stämme × 8 = 56 Sterne, dazu 10 Arme × 4 = 40 (der Todesritter-Arm existiert schon). **Rund 96 neue Sterne.** Das ist groß, deshalb in Scheiben (§7).

### 3.2 Was wirkt wann (Mehrfachklassen)

Man kann mehrere Klassen kennen (`knownClasses`), aktiv ist eine (`currentClass`). **Vorbild im Code:** Der Todesritter-Zweig öffnet sich mit der *bekannten* Klasse, seine Schlüsselknoten wirken nur bei *aktiver* Klasse, und `fx`-Werte wirken immer (`treeFx`). Vorschlag (Entscheidung 3):

- Jedes bekannte Klassen-Sternbild ist sichtbar und lernbar.
- **Schlüsselsterne und Fähigkeitssterne wirken nur, solange die Klasse aktiv ist.** Fähigkeitssterne wirken ohnehin nur, wenn die Fähigkeit auf der Leiste liegt.
- Wertesterne wirken immer, wie heute beim Todesritter.
- Beim Klassenwechsel **leuchtet** das aktive Sternbild, die anderen „ruhen“ (blasser, Hinweis in der Vorschaukarte).
- **Ein gemeinsamer Punktetopf** (`p.skillPoints`, bleibt). Wer viele Klassen lernt, verteilt dünner. Das ist die Entscheidung „viele, aber nicht alle“ des Entwicklers.

### 3.3 Darstellung (siehe HTML-Entwurf)

- **Nachthimmel** als Canvas im Fenster (nicht in der Spielschleife, nur beim Öffnen und Lernen gezeichnet). Dadurch erledigt sich die offene Frage 1 aus `visual/skilltree.md` („Partikel oder CSS“) von selbst: Funken laufen im selben Canvas.
- **Übersicht:** Alle Sternbilder stehen am Himmel. Bekannte leuchten, unbekannte sind **blasse Umrisse mit Namen** („versiegelt — Lehrer: Wenzel, Weidenau“). Man sieht also, wofür sich der Weg lohnt, so wie heute bei den versiegelten Titelzweigen.
- **Klick auf ein Sternbild** zoomt hinein. Innen **schwenken** (Ziehen) und **zoomen** (Mausrad oder +/−).
- **Sterne = Knoten.**
  - Größe: klein = Talent, mittel = Merkmal, groß mit Goldring = Schlüssel.
  - Aktive Sterne tragen ein kleines Zeichen der Fähigkeit.
  - **Zustände:** gelernt (hell, warmes Gold), lernbar (pulsiert sacht), gesperrt (dunkel), ausgeschlossen (Riss zwischen den beiden Schlüsselsternen), versiegelt (nur Umriss).
- **Linien** verbinden die Voraussetzungen. Beim Lernen **läuft ein Lichtfunke** vom Vorstern zum neuen Stern, dann glüht die Linie.
- Das Lernen braucht **Klick plus Bestätigung** in der Vorschaukarte (wie Skyrim), damit kein Punkt versehentlich weg ist.
- **Vorschaukarte** ist dieselbe Bildkarte wie heute (`treeCardHTML`): Name, Art, Wirkung, Absicht, „Braucht …“, „ruht, solange du nicht X bist“.
- **Klassenwechsel** wechselt das hervorgehobene Sternbild.
- **Datenmodell:** Jeder Knoten bekommt `sky` (Sternbild) und `pos:[x,y]`. Das schließt die Lücke „keine x/y“ aus `visual/skilltree.md`. `branch` bleibt für die alten Proben, und `sky` wird für alte Knoten aus `branch` abgeleitet.

### 3.4 Alte Spielstände

- **Gelernte Knoten:** Die Schlüssel bleiben gleich. **Es geht nichts verloren und nichts muss erstattet werden.** Kampf, Magie und Überleben stehen danach im Wanderer-Sternbild, die Titel- und Todesritterknoten in ihren Sternbildern.
- **Wahlweise:** einmal kostenloses Vergessen („Die Sterne ordnen sich neu“), damit Spieler ihre Punkte in die neuen Klassen-Sternbilder umlegen können (Entscheidung 9).
- **Bereits gelernte Klassen:** behalten oder Prüfung nachholen (Entscheidung 8). Die günstigste Lösung nach DECISIONS („Migration nur wenn billig“) ist **behalten**.
- **Mehr Punkte** (§4) rückwirkend: Beim Laden einmal die Differenz zwischen alter und neuer Regel gutschreiben (Flag in `continueGame`).

---

## 4. Talentpunkte — Rechnung gegen BALANCE_GUIDE

**Maßstab:**
- `BALANCE_GUIDE §7` will „50–70 % der lernbaren Knoten“ auf Stufe 60.
- Der Entwickler sagte früher „viele, aber nicht alle“ (MECHANIKEN, Balance-Runde).
- Bisher maß die Probe über **alle** Knoten. Mit Klassen-Sternbildern ist richtig: **erreichbar für eine Figur.**

**Erreichbare Sterne (lernbar, ohne ausgeschlossene Schlüssel):**
- Wanderer 30
- je Stamm 7 (8 − 1 `excl`)
- je Arm 4
- je Titel 6

**Typische Figur** (Krieger → Ritter, 1 Titel): 30 + 7 + 4 + 6 = **47**.
**Breite Figur** (3 Klassen mit 2 Armen, 2 Titel): 30 + 21 + 8 + 12 = **71**.

**Spielstand-Bezug:** Bosse sind für Stufe 22–25 empfohlen (`BALANCE_GUIDE §5`). Das Mittelspiel liegt also um Stufe 25–30, das Spätspiel bei 60.

| Variante | Stufe 15 | Stufe 30 | Stufe 60 | Anteil typ. Figur auf St. 60 (47) | Anteil breite Figur (71) | Folge |
|---|---|---|---|---|---|---|
| **A** heute (jede 3.) | 6 | 11 | 21 | 45 % | 30 % | „mehr Punkte“ nicht erfüllt |
| **A+** jede 3. + 2 je bestandener Klassenprüfung (2 Klassen) | 10 | 15 | 25 | 53 % | 35 % (3 Kl.: +6 → 38 %) | belohnt Prüfungen, wenig Wachstum |
| **B** jede 2. (wie ursprünglich in BALANCE_GUIDE) | 8 | 16 | 31 | 66 % | 44 % | trifft das Band genau; verdoppelt fast die Punkte im Mittelspiel (11 → 16) |
| **C** jede 2. + 1 je Klassenprüfung | 9–10 | 17–18 | 32–33 | 68–70 % | 46 % | oberer Rand des Bands, Prüfung lohnt sich spürbar |
| **D** jede Stufe | 15 | 30 | 60 | > 100 % | 85 % | „alle“ statt „viele“ — widerspricht dem Entwickler |

Die Zahlen sind gerechnet:
- Stufe 15 mit „jede 2.“: Start 1 + gerade Stufen 2…14 (7) = 8.
- Stufe 30: 1 + 15 = 16.
- Stufe 60: 1 + 30 = 31.

**Empfehlung: C**, also jede 2. Stufe plus 1 Punkt je bestandener Klassenprüfung.

**Machtgrenze:** Die neuen Klassensterne verändern hauptsächlich Fähigkeiten; reine Wertesterne gibt es höchstens 2 je Stamm. Der Zuwachs an Dauerleistung wird mit `RF.simFight` gemessen:
- Krieger, Stufe 15 und 30, voller Wanderer-Kampfarm plus Stamm, gegen heute
- dann Schütze und Magier

Das zulässige Mehr ist eine Entscheidung (12).

**Folgen:**
- Die Probe „Höchststufe 60“ wird auf „Anteil der erreichbaren Sterne einer typischen Figur“ umgestellt.
- `BALANCE_GUIDE §7`, MECHANIKEN und KLASSEN_GUIDE werden nachgezogen.

---

## 5. Gefundene Lücken (Fehler, unabhängig vom Feature)

1. **Koop:** Gastfiguren bekommen beim Aufstieg keine Talentpunkte (`game.js:4207`, nur `attrPoints`).
2. **Erbe:** Ohne `skillPoints`/`tree` hat der Erbe 0 Punkte. Nach dem Laden greift die Altstand-Regel und gibt `Stufe − 1` Punkte (`game.js:15645` + `2351`).
3. **Doku- und Text-Widersprüche** zur Punktezahl: siehe 1.4.
4. **Vampir und Grubenhäuptling** haben keinen Talentzweig, die UI sagt aber, die Zweige gelten.
5. Die Leitungsentscheidung „Blutfürst → Blutritter“ (`k_bloodlord`, nur der Name) steht noch aus. Sie passt in die Todesritter-Scheibe.

---

## 6. OFFENE DESIGNENTSCHEIDUNGEN

1. **Wie viele Talentpunkte?**
   - (a) jede 3. Stufe (heute)
   - (b) jede 2. Stufe
   - (c) **jede 2. + 1 je bestandener Klassenprüfung** — *Empfehlung*
   - (d) jede Stufe

   Für (b) bis (d) gibt es die Differenz rückwirkend für alte Stände: ja (*Empfehlung*) / nein.
2. **Wie viele Bäume?**
   - (a) ein Sternbild je Klasse (19 Bäume, rund 150 Sterne)
   - (b) **ein Sternbild je Grundklassen-Linie mit Armen für Folgeklassen** (7 Bäume, rund 96 neue Sterne) — *Empfehlung*
   - (c) nur Arme an die vorhandenen Zweige hängen (klein, kaum „eigener Baum“)
3. **Was wirkt bei Mehrfachklassen?**
   - (a) alles Gelernte immer
   - (b) **Wertesterne immer, Schlüssel- und Fähigkeitssterne nur bei aktiver Klasse** (wie heute der Todesritter) — *Empfehlung*
   - (c) nur das Sternbild der aktiven Klasse
4. **Wer braucht eine Prüfung?**
   - (a) alle Lehrklassen, auch Folge- und dunkle Klassen
   - (b) **Grund- und Folgeklassen ja; Paladin, Todesritter, Hochpaladin und dunkle Klassen behalten ihre vorhandenen Rang- bzw. Prüfungsaufträge und bekommen nur die Szene** — *Empfehlung*
   - (c) nur die 7 Grundklassen
5. **Scheitern:**
   - (a) **beliebig oft wiederholen** (wie an der Akademie) — *Empfehlung*
   - (b) Wiederholen erst am nächsten Tag
   - (c) Wiederholen kostet erneut Lehrgeld
6. **Kosten:**
   - (a) **Vertrauen (Bewährung oder Lehrgeld) bleibt, die Prüfung kommt dazu** — *Empfehlung*
   - (b) zusätzlich eine Prüfungsgebühr
   - (c) Lehrgeld entfällt, nur die Prüfung
7. **Szene:**
   - (a) **etwa 5–6 s, Welt pausiert** (wie die Boss-Auftritte) — *Empfehlung*
   - (b) 3 s live
   - (c) nur Namenskarte und Geste ohne Kamerafahrt
8. **Klassen alter Stände:**
   - (a) **behalten** — *Empfehlung*
   - (b) behalten, die Prüfung kann für den Bonuspunkt nachgeholt werden
   - (c) Prüfung nachholen, sonst Klasse gesperrt
9. **Gelernte Knoten alter Stände:**
   - (a) bleiben, kein Vergessen
   - (b) **bleiben, plus einmal kostenloses Vergessen** — *Empfehlung*
   - (c) alles zurücksetzen, mit Erstattung
10. **Titelklassen:**
    - (a) **Szene auch bei Erwerb und Grad-Weihe, Sternbilder aus den heutigen Zweigen** — *Empfehlung*
    - (b) Titel bleiben, wie sie sind
11. **Vampir und Grubenhäuptling:**
    - (a) **je ein eigenes Titel-Sternbild (7 Sterne wie die anderen)** — *Empfehlung*
    - (b) bleiben ohne Baum
12. **Machtzuwachs aus den Klassensternen:**
    - (a) **höchstens so viel Dauerleistung, wie heute der Kampfzweig voll gibt (+16 % Waffenschaden, Messung mit simFight)** — *Empfehlung*
    - (b) frei, Messung entscheidet
    - (c) nur Fähigkeitsveränderungen, keine Werte
13. **Gefährten:**
    - (a) **bleiben ohne Baum und ohne Prüfung** — *Empfehlung*
    - (b) Lehrer bilden Gefährten gegen Gold aus
    - (c) Gefährten bekommen einen kleinen Klassenbaum
14. **Koop:** Gastfiguren
    - (a) **machen Prüfungen selbst, gemeinsam mit dem Host, wie andere Aufträge** — *Empfehlung*
    - (b) übernehmen die Prüfung des Hosts

    Und: Sollen Gäste endlich Talentpunkte bekommen (Fehler 5.1)? Ja (*Empfehlung*) / nein.
15. **Vergessen:**
    - (a) **wie heute alles auf einmal bei jedem Lehrer** — *Empfehlung*
    - (b) je Sternbild beim Lehrer dieser Klasse (günstiger)
16. **Konkrete Prüfungen und Zahlen** aus Tabelle 2.2: freigeben, ändern oder streichen, je Klasse.

---

## 7. FEATURE IMPACT REPORT (GATE §8)

**Feature:** Klassen-Prüfung mit Aufnahmeszene, Sternbild-Talentbäume je Klasse, mehr Talentpunkte.

### Betroffene Systeme

| Bereich | Wo |
|---|---|
| Ausbildung | `teach`, `teacherTrial`, `teachable`, `unlockClass`, `setClass`, `deathRite`, `chainRite` |
| Aufträge | `QUESTS`, `questAvailable`, `offerQuest`, `turnIn`, `onKill`, `questCheck`, Tracker, Siegel über Auftraggebern (Q-2) |
| Prüfungen vor Ort | `S.trial`, `startTrial`/`endTrial`, `trialTick` |
| Regie | `cinematic`, `nameCard`, `gesture`, `bubble` |
| Talente (Logik) | `SKILL_TREE`, `SKILL_BRANCHES`, `branchOpen`, `nodeState`, `learnNode`, `treeFx`, `respec` |
| Talente (Darstellung) | `skillUI`, `drawTreeLines`, `treeCardHTML`, `paintIcons`, Untertabs `ui.js:39/44`, Taste T `game.js:15880`, Hinweis `8397` |
| Punkte | `levelUp`, `TALENT_EVERY`, `talentAt` |
| Spielstände | `continueGame`-Migration |
| Erbe und Koop | `adoptSuccessor`, Koop `self`/`runAs` |
| Hilfen und Debug | Kodex „Lehrer“, Debug-Menü, Selbsttest-Proben (1.4) |
| Doku | MECHANIKEN, KLASSEN_GUIDE, BALANCE_GUIDE §7 |

### Bereits vorhanden
- Auftragssystem mit `reward.unlock` (Paladin-Muster).
- `classQ`/`dkQ`-Reihenfolge.
- `startTrial` mit Ort, Zeit und Wiederholung.
- Regiebuch mit Gesten, Namenskarte und Überspringen-mit-Folgen.
- Klassen-Zweig-Vorbild Todesritter (bekannt öffnet, aktiv wirkt).
- Bildkarte für Knoten, Canvas im Fenster.
- `teacherTrial` (Vertrauen), Nachfolger für Lehrer.

### Fehlende Infrastruktur
1. Quest-Feld `clsTrial` plus Regel in `questAvailable`, und Geber „jeder Lehrer dieser Klasse“.
2. `startTrial`:
   - Arten Duell beim Lehrer, Bogen-Zielübung, Meuchel-Puppen, Grubenkampf unter 30 % Leben
   - Zielarten `craft`, `steal`, Kampf mit Gefährten
   - verallgemeinertes `hold` an einem beliebigen Ort (heute fest am Schrein)
3. `classRite(npc, cls)` als Szene mit Tabelle je Klasse; „Fähigkeit ins Leere vorführen“ ohne Schaden.
4. Knotenfelder `sky`/`pos`, eine Sternbild-Tabelle statt `SKILL_BRANCHES` (die alte bleibt als Ableitung), etwa 96 neue Knoten mit Regeln am Schlüssel, neue Pixelzeichen je Sternbild.
5. Sternenhimmel-UI (Canvas, Schwenken, Zoom, Funkenlauf, Bestätigen).
6. Migration: Punkte-Differenz und einmaliges Vergessen per Flag; Fehler 5.1 und 5.2 beheben.
7. Proben: „Höchststufe 60“ neu messen, „Daten stimmig“ um `sky`/`pos` erweitern; neue Proben für Prüfungsablauf, Szene überspringen, Speichern mitten in der Prüfung und alte Stände.

### Offene Designentscheidungen
§6, 1–16.

### Risiken
- **Umfang:** etwa 96 Sterne mit eigenen Regeln. Das Risiko „halbes Feature“ ist hoch, wenn nicht Sternbild für Sternbild fertig wird. Deshalb in Scheiben, je Scheibe ein vollständiges Sternbild mit Prüfung, Szene und Proben.
- **Balance:** Mehr Punkte plus neue Sterne heben die Macht. Gegenmittel sind Fähigkeitssterne statt Werte und die Messung mit simFight. Zufallsabhängige Proben können sich verschieben (CLAUDE.md, RNG).
- **Spielstand:** Ein `S.trial` mitten in der Prüfung wird gespeichert, die Übungsgegner sind `transient`. Laden mitten in der Prüfung muss die Prüfung sauber abbrechen oder neu aufbauen.
- **Lehrer stirbt** mitten in der Prüfung: Ein anderer Lehrer derselben Klasse muss abnehmen können.
- **Gegner im Weg:** Kein Schaden während der Szene (GATE §9). Eine pausierte Szene löst das.
- **Koop:** Ob Namenskarte und Blasen bei Gästen ankommen, ist ungeprüft. Gast-Punkte fehlen heute.
- **Mobil:** Schwenken und Zoomen per Touch; Bedienung mit Tastatur oder Gamepad.
- **Gerüchte und NPC-Wissen:** Lehrer sollten wissen, dass man schon geprüft ist. Das läuft über `S.quests`, also kein Sonderfall.

### Implementierungsplan in Scheiben
Jede Scheibe ist vollständig: Daten, Logik, Hinweis, Debug, Probe und MECHANIKEN.

| Scheibe | Inhalt |
|---|---|
| **0** | Fehler 5.1 und 5.2 beheben, Doku-Widersprüche glätten, Punkte-Regel nach Entscheidung 1 mit Rückwirkung |
| **1** | Prüfungsgerüst (`clsTrial`, Geber je Klasse, `startTrial` am Lehrerort, `classRite`-Szene) für **Krieger** komplett; dazu Szene für Paladin, Todesweihe und Ritus der Kette |
| **2** | Sternenhimmel-UI mit **Wanderer** (alte 30 Knoten) und den vorhandenen Titel- und Todesritter-Zweigen als Sternbilder; `sky`/`pos`; einmal Vergessen; Reiter „Talente“ und Taste T wieder an |
| **3** | Sternbild **Der Schild** (Krieger-Stamm, Arme Ritter/Paladin, Berserker, Todesritter, Hochpaladin) mit simFight-Messung |
| **4–9** | je eine Linie mit Prüfung und Sternbild: Schütze, Schurke, Kleriker, Magier, Barde, Alchemist; zuletzt die dunklen Arme |
| **10** | Titel-Sternbilder Vampir und Grubenhäuptling (falls Entscheidung 11a); Szenen bei der Grad-Weihe |

---

## Stand (Umsetzung, Klassen-Agent)
- Scheibe 0 grün um 22:28 (Talentpunkte jede 2. Stufe + 1 je Prüfung, rückwirkend über `talentTopUp`; Koop-Gast bekommt Punkte; Erbe sofort nach Regel; BALANCE_GUIDE §7 angepasst; Selbsttest 446/446).
