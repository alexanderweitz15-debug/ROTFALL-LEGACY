# Bedrohung Varonheims: alle Hebel auf einer Zahl (Designer, 01.10.2026)

Auftrag: Fünf gebaute und vier geplante Systeme wirken auf `S.war.capThreat` und auf den Ausgang von Morvaths Heerzug. Dieses Papier misst das gemeinsam und schlägt Deckel vor.
Am Spielcode wurde nichts geändert. Die Messung lief headless im echten Spiel (eigener Tab, `RF.S._quiet = true`, Spielstand vorher aus `rotfall.backup.s14c`, danach geprüft: `legacy.save === backup`).
Status: PROPOSED. Bezug: `weltereignisse_abgleich.md` W-24, W-25, Ü-3.

---

## 1. Die Formel heute (Stand v23, 01.10.2026, Zeilen verschieben sich)

### 1a. Tageszählung `capThreatDay` (sim.js:54–67), einmal am Tag aus `warDay` (sim.js:449, Aufruf vor dem Mustern)

Die Zählung läuft nur unter diesen Bedingungen:
- Varonheim gehört Valen.
- `S.day ≥ CAP_SIEGE.from − 15` auf Sehr schwer, also ab Tag **20** auf Schwer und ab Tag **5** auf Sehr schwer (sim.js:56, Literal im Code).
- Garmadon lebt, die Stufe ist nicht Angsthase, und `hostCd ≤ day`.

```
d = (undNodes ≥ 6 ? +1 : −1)                       Front (zählt ALLE untoten Knoten, auch Aurelions, W-24)
  + (S.schutz.varonheim.stage ≥ 1 ? +0,5 : 0)      Stadt ohne Schutz
  + (kein Valen-Heer im Feld ? +0,5 : 0)
  + cultDrain()                                    ruling 1 · hidden 0,5 · player+tithe 0,5 · sonst 0   (game.js:13214)
  + (varonDead && cult.end ≠ 'ruling' ? +0,5 : 0)  leerer Thron
capThreat = clamp(capThreat + d, 0, 40)
```

Die Stufen kommen aus `CAP_SIEGE.thr = [10, 15, 20]`:
- 10: Gerücht.
- 15: „Varonheim rüstet“.
- 20: `launchHost()`.

`launchHost` setzt `capThreat = 5` und `hostCd = day + 30`. Morvaths Heerzug hat Stärke `host.schwer 70` bzw. `host.sehr_schwer 80` (sim.js:33–48). Wenn kein untoter Knoten im Graphen verbunden ist, startet kein Heerzug (`nearestHeld`).

### 1b. Einmalige Stöße und Senken

| Quelle | Wirkung | Datei:Zeile |
|---|---|---|
| Schutz-Alarm Varonheim (Stufe 2) | `capThreat += 3` (ohne Deckel, auch vor Tag 20) | game.js:8371 `schutzAlarm` |
| Gardist tot | Besatzung −4 je Mann (10 Mann = −40 von 60) | game.js:8356 `schutzLoss` |
| Schutz Stufe ≥ 1 | kein Auffüllen der Besatzung (`capDay`) | sim.js:75 |
| Ersatz für die Garde | 3 Mann alle 2 Tage, gesperrt bei `capThreat ≥ 15` oder besetzter Hauptstadt. **Bringt `n.garrison` nicht zurück**, zieht nur beim Quellort ab. | game.js:8400–8420 |
| Feldschlacht des Spielers gewonnen | `threatCut` bis 3, höchstens 6 am Tag | sim.js:555 |
| Hauptmann der Toten (Königsauftrag) | `threatCut(5)` | game.js:8539 |

### 1c. Mittelbare Hebel auf den Ausgang der Belagerung

- `warDay` (sim.js:456): Valen-Heere wachsen um `(Korn > 10 ? 3 : 1) + min(3, 0,3 × undNodes) − cultDrain`. Der Kult schwächt damit genau die Entsatzheere.
- Belagerung (`siegeTick`, sim.js:79–96):
  - Mauern sinken je Zug um `max(2, Stärke × 0,05)`.
  - Die Besatzung verliert 0,25 je Zug, außer `fedTill` ist gesetzt.
  - Ein Entsatzheer kämpft mit `sally 1,15`, ein Sturm auf die Bresche mit `inner 1,2`.
- Die Rote Krönung wird an Tag `45 − 15 (SS)` angesagt und folgt 20 Tage später (game.js:12992). Sie ruht, solange die Hauptstadt besetzt ist (`capitalDay`, game.js:8439).

### 1d. Geplant (nicht gebaut)

- **T23 Seelen:** Der Heerzug kostet 40 Seelen (§5.4, F2). Das ist eine Bremse.
- **#39 Kriegsmüdigkeit:** Valen-Heere schrumpfen ab Müdigkeit 60, „nie während der Belagerung“. Das schwächt den Entsatz.
- **Luftbrücke:** `fedTill` setzt den Hunger der Besatzung aus. Das ist eine Bremse.
- **T12 Straßen:** Banden kosten Nordfurt Korn, dadurch wächst Valen nur noch um +1 statt +3. Das schwächt den Entsatz mittelbar.

---

## 2. Messung (headless, echtes Spiel)

### 2a. Aufbau

Messaufbau:
- Eigener Tab, `?dev`.
- `SIM`, `ECO` und `state.js` über `import('/src/…?v=23')`.
- Spieler auf `'deep'`, `SIM.H.raidDamage = null`, Szene, Toast und Flüchtlinge stumm.

Für jeden Lauf gilt:
- Frischer Krieg aus `WAR_NODES` mit den vier Startheeren aus `initSim`.
- `seedRng(seed)` mit den Seeds 101, 202, 303, 404 und 505.
- Tagesablauf: 4 × `warTick`, dann `ECO.ecoDay`, dann `warDay`.
- Nach jedem Lauf werden `war`, `towns`, `eco`, `after`, `cult`, `flags`, `schutz`, `chronicle`, `ents.world` und die übrigen Werte zurückgesetzt.

Ein Lauf über 200 Tage dauert etwa 4–5 s. Jeder Aufruf blieb unter 30 s.

**Nachgebildet, nicht echt gerufen (UNVERIFIED):**
- **Kult:** Stufe 1 ab Tag 12. Die Krönung wird an Tag 45 bzw. 30 angesagt und folgt nach 20 Tagen; danach `end = 'ruling'` und `varonDead`. Die Krone ruht bei besetzter Stadt. Weitere Kultstufen durch den Spieler gibt es nicht.
- **Schutz:** Alarm, −40 Besatzung, Ersatz-Takt und Stufen wie `schutzDay`. `schutzAlive` wird ignoriert.
- **Nicht im Lauf:**
  - die Tagesfunktionen aus game.js (`campaignDay`, `raidDay`, `undeadHeldDay`, `aurelDay`, `bigDay`)
  - Schlachten nahe am Spieler

Die Streuung ist hoch: 5 Seeds sind ein Bild, keine Statistik.

### 2b. Ergebnisse (je 5 Läufe)

„Heerzug“ ist der erste Starttag. Die Belagerung beginnt immer am Tag darauf.

| Szenario | Krönung | Heerzug (Tage) | Fall bis Tag 120 | Fall bis Tag 200 (Tage) |
|---|---|---|---|---|
| **Schwer**, Kult zerschlagen | – | keiner (0/5) | 0/5 | 0/5 |
| **Schwer**, Kult ignoriert | 65 | 99, 108, 111, 119, 144 (Median 111) | 0/5 | 1/5 (190) |
| Schwer, ignoriert + Garde tot an Tag 10 | 65 | wie oben, identisch | 0/5 | – |
| Schwer, ignoriert + Garde tot bei Bedrohung 15 | 65 | 89, 98, 104, 116, 143 | 2/5 | **4/5** (103, 111, 129, 154) |
| Schwer, wie oben, aber −30 statt −40 Besatzung | 65 | gleich | – | 4/5, gleiche Tage |
| **Sehr schwer**, Kult zerschlagen | – | keiner (0/5) | 0/5 | 0/5 |
| **Sehr schwer**, Kult ignoriert | 50 | 79, 91, 95, 117, 156 (Median 95) | 1/5 (88) | 3/5 (88, 134, 162) |
| SS, ignoriert + Garde tot an Tag 10 | 50 | identisch | 1/5 (88) | – |
| SS, ignoriert + Garde tot bei Bedrohung 15 | 50 | 77, 80, 89, 89, 134 | 4/5 | **5/5** (85, 91, 98, 98, 144) |
| *Stapel-Probe:* Schwer, zerschlagen + 3 Städte Aurelions untot ab Tag 30 | – | 1/5 (**49**) | 0/5 | 0/5 |
| *Stapel-Probe:* Schwer, ignoriert + Valen-Heere −2/Tag ab Tag 60 (#39 grob) | 65 | 71, 83, 97, 106, 128 | 1/5 (79) | 3/5 (79, 127, 141) |
| *Stapel-Probe:* Schwer, **zerschlagen** + Valen-Heere −2/Tag ab Tag 60 | – | 76, 93, 158 | 1/5 (86) | 2/5 (86, 145) |

### 2c. Weitere Beobachtungen

- Die Front wogt stark. Die Zahl der Totenknoten springt zwischen 0 und 11, und Valen holt Land zurück. Mit zerschlagenem Kult kommt die Bedrohung nie über 6,5. Auf Sehr schwer erreicht sie bis Tag 10 durch den frühen Start 2,5–6 und fällt bis Tag 30 auf 0.
- Nach der Krönung ist der Grundwert `−1 + 1 = 0`. Die Bedrohung steigt nur an Tagen mit ≥ 6 Totenknoten oder ohne Valen-Heer, im Mittel um etwa 0,3 am Tag. Deshalb kommt der Heerzug 35–90 Tage nach der Krönung.
- Die meisten Belagerungen scheitern am Entsatz (`sally 1,15`). Eine Probe mit `host.schwer = 80` brachte 0/5 Fälle bis Tag 200. Mehr Heerstärke kippt also nichts; der Ausgang hängt am Entsatz und an der Besatzung.
- **Garde tot an Tag 10:**
  - Der Ersatz ist an Tag 18 vollzählig.
  - Auf Schwer ruht der Stoß von +3 bis Tag 20 und baut sich bis Tag 23 ab.
  - Wirkung: keine.
- **Garde tot bei Stufe 2:**
  - 15 + 3 = 18, dazu +0,5 am Tag. Der Heerzug folgt nach 0–3 Tagen, die Belagerung beginnt mit Besatzung 20 statt 60.
  - `launchHost` setzt die Bedrohung auf 5 zurück. Damit endet die Sperre und der Ersatz kommt, aber **die Besatzung bekommt er nicht zurück**. Während der Belagerung füllt `capDay` nicht auf.
  - Ergebnis: der Fall 11–15 Tage nach dem Start.

---

## 3. Bewertung gegen die Absicht des Entwicklers

| Absicht | Befund | Urteil |
|---|---|---|
| Die Hauptstadt fällt nur nach langer Vernachlässigung. | Auf Schwer kommt der früheste Heerzug an Tag 99 (Median 111), ein Fall nur 1/5 bis Tag 200. Mit zerschlagenem Kult gibt es **nie** einen Heerzug (0/10 Läufe über 200 Tage). | Erfüllt, sogar übererfüllt. **Der einzige Motor ist die Rote Krönung.** Die Front allein trägt nicht (Ausnahmen siehe Stapelung). Auf Schwer endet Vernachlässigung meist in einer Belagerung, die hält. |
| Sehr schwer ist härter und früher. | Heerzug im Median 16 Tage früher (95 statt 111). Fall bis Tag 200: 3/5 statt 1/5. | Erfüllt, aber nur über die Krönung (−15). **Der Start an Tag 5 bewirkt nichts Bleibendes**: Die Front bricht für die Toten bis Tag 20 ein, und die frühe Bedrohung verfällt. |
| Alle Wachen zu töten beschleunigt den Fall, löst ihn aber nicht direkt aus. | An Tag 10 ohne Wirkung. Während „Varonheim rüstet“ macht es den Fall fast sicher (Schwer 4/5, SS 5/5) und zieht den Heerzug um 0–3 Tage vor. Ohne Heerzug fällt nichts. | Formal erfüllt, denn ohne Morvath kein Fall. Praktisch ist es der **stärkste Einzelhebel**: −40 Besatzung, die nie zurückkommen, sind 2/3 der Verteidigung. |
| Gestapelte Pläne (T23, #39, Luftbrücke, T12) | #39 grob nachgebildet: Fall auch **ohne Kult** (2/5), Heerzug ab Tag 71. Aurelions Städte: Heerzug an **Tag 49** ohne Kult, entgegen der Entscheidung (Häuserkrieg zuerst, Aurelions Städte treiben Morvath nicht an). | **Risiko.** Ohne Deckel wird der Fall durch Stapelung billig, vor allem über einen geschwächten Entsatz. |

---

## 4. Empfehlung: Zahlen in `CAP_SIEGE` und Deckel

Alle Werte stehen an einer Stelle in `CAP_SIEGE`. Was heute als Literal in sim.js oder game.js steht, zieht dorthin um.

```js
export const CAP_SIEGE = { …bestehend…,
  from:   { schwer: 20, sehr_schwer: 5 },          // heute Literal „− 15“ in sim.js:56
  crownAt:{ schwer: 45, sehr_schwer: 30 }, crownIn: 20,   // heute Literal in game.js:12992
  w:      { front: 1, calm: -1, noArmy: 0.5, schutz: 0.5, throne: 0.5 },  // Gewichte der Tageszählung
  dMax:   { schwer: 1.5, sehr_schwer: 2 },         // DECKEL: Summe aller Tagesquellen (inkl. cultDrain, T23, #39)
  bump:   { max: 3, per: 10 },                      // DECKEL: Einmal-Stöße (Alarm usw.) höchstens +3 je 10 Tage …
  bumpCeil: 19,                                     // … und nie über thr[2]−1: der Heerzug kommt nur aus der Tageszählung
  hostMin:{ schwer: 75, sehr_schwer: 60 },          // DECKEL: frühester Heerzug, egal was sich stapelt
  guardHit: 4, guardBack: 4,                        // je Gardist −4 Besatzung; Ersatz bringt +4 je Mann zurück (bis gcap)
  reliefFloor: 25,                                  // #39/T12: Schwund drückt ein Valen-Heer nie unter 25 (und nie im Entsatz)
};
```

Begründung im Einzelnen:

1. **`undNodes` nur über Knoten aus `WAR_NODES`** (bzw. Knoten mit `NEIGH`). Das setzt die Entscheidung „Aurelions Städte treiben Morvath nicht an“ um. Gemessen ist dies der früheste Heerzug überhaupt (Tag 49 ohne Kult). Das ist kein neuer Zahlenwert, aber Pflicht vor jedem weiteren Hebel.
2. **`hostMin` 75 / 60** liegt unter allen Grundwerten (Schwer frühestens 99, SS 79). Die heutige Balance ändert sich damit nicht. Der Deckel greift nur bei Stapelung (gemessen: 49, 71, 76). Er garantiert „lange Vernachlässigung“ unabhängig davon, welche Systeme dazukommen.
3. **`dMax` 1,5 / 2:**
   - Heute ist das theoretische Maximum +3 am Tag (Front, kein Heer, Krönung, Schutz). Mit T23 und #39 käme mehr dazu.
   - Mit dem Deckel dauert der Weg von 0 bis 20 mindestens 14 bzw. 10 Tage. Das ist genug Vorwarnung über die Stufen 10 und 15.
   - Der gemessene Mittelwert von etwa 0,3 am Tag bleibt unberührt.
4. **`bumpCeil` 19:**
   - Der Alarm (+3) darf nicht mehr selbst den Heerzug auslösen. Gemessen startet er heute ab Stufe 2 nach 0–3 Tagen.
   - Damit stimmt „beschleunigt, löst nicht aus“ auch zeitlich. Die Garde-Tat wirkt weiter über +0,5 am Tag und über die Besatzung.
5. **`guardBack` 4:**
   - Kommt der Ersatz an, steigt `n.garrison` um 4 je Mann. Heute holt das Auffüllen (+3 am Tag) den Verlust nur ohne Belagerung zurück, der Ersatz selbst bringt nichts.
   - Das behebt den Hauptgrund, warum die Garden-Tat zum fast sicheren Fall wird. −30 statt −40 änderte gemessen nichts. Entscheidend ist, dass die Besatzung nicht wiederkommt.
   - Erwartung (UNVERIFIED): Der Fall bleibt wahrscheinlicher als ohne die Tat, aber nicht sicher.
6. **`reliefFloor` 25:**
   - Der Ausgang hängt am Entsatz. Jeder Schwund (#39 Kriegsmüdigkeit, T12 Korn) darf Valen-Heere nicht unter 25 drücken. Unter 25 hält ein Heer heute ohnehin (`warTick`).
   - #39 sagt schon „nie während der Belagerung“. Das bleibt so und wird als Regel festgeschrieben.
7. **T23 Seelen (40 je Heerzug):** Fehlen die Seelen, verschiebt sich der Heerzug, statt auszufallen. `capThreat` bleibt dann auf 20 stehen und der Heerzug startet, sobald 40 Seelen da sind. Ein Spieler, der Dörfer verteidigt, gewinnt so Zeit, ohne die Krise zu löschen.
8. **Luftbrücke:** Kein Deckel nötig. Sie bremst nur (`fedTill`) und kostet den Spieler etwas.

**Prüfung nach dem Bau:**
- Dieselbe Messung (5 Seeds × 200 Tage, Szenarien aus §2b) als Debug-Eintrag „Bedrohung messen“.
- Abnahme:
  - Kein Heerzug vor `hostMin`, auch in den Stapel-Proben.
  - Grundwerte (Kult ignoriert) innerhalb von ±10 Tagen der Tabelle.

---

## 5. Fragen an den Entwickler (3)

- **F1 – Soll Varonheim bei Nichtstun auf Schwer überhaupt fallen?** Heute endet es meist in einer Belagerung, die hält: 1 von 5 Läufen fällt bis Tag 200. Wenn ja, an welchem Zieltag? Vorschlag: auf Schwer mehrheitlich zwischen Tag 130 und 160. Dann wäre `sally` (Entsatzbonus) die Stellschraube, nicht die Heerstärke; 80 statt 70 änderte nichts.
- **F2 – Darf die Front allein, ohne Rote Krönung, je einen Heerzug auslösen?** Heute nie: In 10 Läufen mit zerschlagenem Kult gab es keinen einzigen. Wer den Kult zerschlägt, rettet die Hauptstadt für immer. Wenn nein, ist das so gewollt und gehört als Hinweis ins Spiel.
- **F3 – Garde töten während „Varonheim rüstet“:** Heute folgt der Fall fast sicher, 11–15 Tage nach dem Start des Heerzugs. Soll das so bleiben, oder soll der Ersatz die Besatzung zurückbringen (`guardBack`, Empfehlung)?

---

## 6. Festgelegte Werte (nach den Antworten des Entwicklers, 01.10.2026)

### 6.1 Antworten und Status

Antworten des Entwicklers:
- **F1:** Ja. Auf Schwer fällt Varonheim bei Nichtstun (Kult ignoriert) etwa zwischen Tag 120 und 150.
- **F2:** Ja, die verlorene Front allein darf den Heerzug auslösen, frühestens an Tag 75 und mit Deckeln.
- **F3:** Ja, der Ersatz bringt +4 Besatzung je Mann.

Status: **APPROVED (Werte), bereit für den Engineer.**

### 6.2 Neue Grundlinie

Der Commit `b6f5a5e` (Varonheim-Umbau, sim.js 14:41) hat Lage und Wege verschoben. Die Messung von §2 gilt deshalb nur noch als Vorher-Bild.

Neu gemessen mit der **alten** Formel, Schwer, Kult ignoriert:
- Heerzug 2 von 5 (Tag 90 und 149)
- **kein Fall** bis Tag 200

### 6.3 Was die Messung gezeigt hat

- **Der Entsatzbonus ist nicht die Stellschraube.**
  - `sally` 1,15 → 0,9 änderte nichts.
  - Der Heerzug verliert auf dem Marsch etwa 18 Stärke, in der Belagerung 3 am Tag (`attAttr` 0,75 je Zug).
  - Nach 11–12 Tagen bis zur Bresche stürmt er mit etwa 25 gegen 49 × 1,2 und verliert.
- **Die Stellschrauben sind:**
  - Heerstärke 100 / 110 und `attAttr` 0,4: Der Sturm wird dadurch ernst.
  - `calm` −1 → −0,75 (Tageswert bei gehaltener Front): Nach der Krönung steigt die Bedrohung jetzt langsam (+0,25 am Tag), statt bei 0 zu stehen.
- **`sally` bleibt 1,15.**

### 6.4 Konstanten (`src/sim.js`, ersetzt `CAP_SIEGE`)

```diff
-export const CAP_SIEGE = { gcap: 60, refill: 3, wallRep: 10, wallHit: 0.05, wallMin: 2, attAttr: 0.75, garAttr: 0.25, inner: 1.2, sally: 1.15,
-  occ: 30, host: { schwer: 70, sehr_schwer: 80 }, thr: [10, 15, 20], cd: 30, from: 20, cutDay: 6 };
+export const CAP_SIEGE = { gcap: 60, refill: 3, wallRep: 10, wallHit: 0.05, wallMin: 2, attAttr: 0.4, garAttr: 0.25, inner: 1.2, sally: 1.15,
+  occ: 30, host: { schwer: 100, sehr_schwer: 110 }, thr: [10, 15, 20], cd: 30, cutDay: 6,
+  from: { schwer: 20, sehr_schwer: 5 },              /* Entwickler: Sehr schwer 15 Tage früher */
+  hostMin: { schwer: 75, sehr_schwer: 60 },          /* Entwickler F2: frühester Heerzug, egal was sich stapelt */
+  dMax: { schwer: 1.5, sehr_schwer: 2 },             /* Deckel: Summe aller Tagesquellen */
+  bumpCeil: 19,                                      /* Einmal-Stöße lösen den Heerzug nie selbst aus */
+  w: { front: 1, calm: -0.75, noArmy: 0.5, schutz: 0.5, throne: 0.5 },
+  guardHit: 4, guardBack: 4,                         /* Entwickler F3 */
+  reliefFloor: 25 };                                 /* künftiger Schwund (#39, T12) drückt ein Valen-Heer nie darunter */
```

Angsthase bleibt ohne Heerzug (bestehende Prüfung). `ARMY_CAP` ist auf Schwer und Sehr schwer 110, deckt also 100 und 110 ab.

### 6.5 Formel (`src/sim.js`)

**`capThreatDay` (sim.js:54–67):**

```diff
+const WAR_KEYS = Object.keys(WAR_NODES);                      /* Entwickler: Aurelions gefallene Städte treiben Morvath nicht an */
+const dk = () => S.difficulty === 'sehr_schwer' ? 'sehr_schwer' : 'schwer';
+export function threatBump(v) {                               /* Einmal-Stöße (Schutz-Alarm u. a.): nie über bumpCeil */
+  if (!S.war) return; const t = S.war.capThreat || 0; S.war.capThreat = Math.max(t, Math.min(CAP_SIEGE.bumpCeil, t + v)); }
 export function capThreatDay() {
   const W = S.war, n = W.nodes[CAPK];
-  if (!n || n.owner !== 'valen' || (S.day | 0) < CAP_SIEGE.from - (S.difficulty === 'sehr_schwer' ? 15 : 0) || S.flags.garmadonSlain || (S.difficulty || 'schwer') === 'angsthase' || W.hostCd > S.day) return;
-  const undNodes = Object.values(W.nodes).filter(x => x.owner === 'undead').length;
-  const d = (undNodes >= 6 ? 1 : -1) + ((S.schutz?.[CAPK]?.stage || 0) >= 1 ? 0.5 : 0) + (W.armies.some(a => a.faction === 'valen') ? 0 : 0.5) + (H.cultDrain?.() || 0) + (S.flags.varonDead && S.cult?.end !== 'ruling' ? 0.5 : 0);
-  W.capThreat = clamp((W.capThreat || 0) + d, 0, 40);
+  const day = S.day | 0, k = dk(), w = CAP_SIEGE.w;
+  if (!n || n.owner !== 'valen' || day < CAP_SIEGE.from[k] || S.flags.garmadonSlain || (S.difficulty || 'schwer') === 'angsthase' || W.hostCd > day) return;
+  const undNodes = WAR_KEYS.filter(x => W.nodes[x]?.owner === 'undead').length;
+  const d = Math.min(CAP_SIEGE.dMax[k], (undNodes >= 6 ? w.front : w.calm) + ((S.schutz?.[CAPK]?.stage || 0) >= 1 ? w.schutz : 0)
+    + (W.armies.some(a => a.faction === 'valen') ? 0 : w.noArmy) + (H.cultDrain?.() || 0) + (S.flags.varonDead && S.cult?.end !== 'ruling' ? w.throne : 0));
+  W.capThreat = clamp((W.capThreat || 0) + d, 0, day >= CAP_SIEGE.hostMin[k] ? 40 : CAP_SIEGE.bumpCeil);   /* vor hostMin: höchstens Stufe 2 */
   const st = CAP_SIEGE.thr.filter(x => W.capThreat >= x).length;
```

Die Reihenfolge in `warDay` bleibt unverändert: Gezählt und geprüft wird vor dem Mustern, wie gemessen.

**`launchHost` (sim.js:44–53):**

```diff
-  const a = { …, strength: Math.min(CAP_SIEGE.host[S.difficulty] || CAP_SIEGE.host.schwer, ARMY_CAP()), … };
+  if ((S.day | 0) < CAP_SIEGE.hostMin[dk()]) return null;     /* zweite Sicherung (künftige Auslöser) */
+  const a = { …, strength: Math.min(CAP_SIEGE.host[dk()], ARMY_CAP()), … };
```

Das Debug-Menü „Belagerung jetzt“ schiebt das Heer direkt hinein und bleibt davon unberührt.

**`siegeTick` / `capDay`:**
- Keine Formeländerung. Es wirkt nur `attAttr` 0,4 aus `CAP_SIEGE`.
- `capDay` füllt bei Schutzstufe ≥ 1 weiter nicht auf; das bleibt so.

**Schwund künftiger Systeme:** #39 und T12 rechnen ein Valen-Heer nur bis `CAP_SIEGE.reliefFloor` herunter und nie, solange es vor der belagerten Hauptstadt steht.

### 6.6 `src/game.js`

**`schutzLoss` (ca. game.js:8356):**

```diff
-  … if (n && n.owner === 'valen') n.garrison = Math.max(0, n.garrison - 4);
+  … if (n && n.owner === 'valen') n.garrison = Math.max(0, n.garrison - SIM.CAP_SIEGE.guardHit);
```

**`schutzAlarm` (ca. game.js:8394):**

```diff
-  if (k === 'varonheim' && S.war?.nodes?.varonheim?.owner === 'valen') { S.war.capThreat = (S.war.capThreat || 0) + 3; log(…); }
+  if (k === 'varonheim' && S.war?.nodes?.varonheim?.owner === 'valen') { SIM.threatBump(3); log(…); }
```

**`schutzDay` (ca. game.js:8440):**

```diff
-    if (k === 'varonheim') { if (afterLive()) { S.ents.world = S.ents.world.filter(e => !e.capGuard); capitalMigrate(); } }
+    if (k === 'varonheim') { const N = S.war?.nodes?.varonheim;   /* Entwickler F3: Ersatz bringt die Besatzung zurück */
+      if (N?.owner === 'valen') N.garrison = Math.min(SIM.CAP_SIEGE.gcap, N.garrison + SIM.CAP_SIEGE.guardBack * n);
+      if (afterLive()) { S.ents.world = S.ents.world.filter(e => !e.capGuard); capitalMigrate(); } }
```

### 6.7 Proben und Hinweise für den Engineer

**Proben anpassen:**
- **game.js:17693** (Heerzug-Probe):
  - Sie erwartet `h.strength === 70` und einen Heerzug ab `S.day = 30`.
  - Neu: Stärke gleich `CAP_SIEGE.host[...]`, und `S.day` ≥ 75 setzen.
- **game.js:18353** (Alarm-Probe): `capThreat >= 3` gilt weiter.
- **Neue Probe:** Mit 3 untoten Städten Aurelions gibt es keinen Front-Zuschlag. Vor `hostMin` startet kein Heerzug.

**Hinweise im Spiel (Pflicht für jede neue Mechanik):**
- Das Gerücht auf Stufe 1 bekommt den Zusatz: „Fällt die Front oder stirbt der König, rückt er näher.“
- Bei Stufe 2 vor `hostMin` sagt die Chronik: „Morvath sammelt noch.“
- In `MECHANIKEN.md`:
  - die Quellen der Bedrohung
  - frühester Heerzug an Tag 75 bzw. 60
  - der Ersatz bringt Besatzung zurück

### 6.8 Nachmessung mit den festgelegten Werten

Messaufbau:
- Seeds 101–505, je 200 Tage, Formel von §6.5 im Messgerüst nachgebaut.
- Die eingebaute Zählung wurde über `hostCd` stillgelegt; `launchHost` und `siegeTick` liefen echt.
- Konstanten über das veränderliche `CAP_SIEGE`, danach zurückgesetzt.
- Der Spielstand wurde geprüft und ist unverändert.

| Szenario | Heerzug (erster Tag) | Fall (Tage) | Median Fall |
|---|---|---|---|
| **Schwer, Kult ignoriert** | 92, 117, 120, 124, 134 | 99, 126, 129, 132, 183 | **129** ✔ (Ziel 120–150) |
| **Sehr schwer, Kult ignoriert** | 79, 89, 90, 92, 100 | 87, 97, 98, 100, 108 | **98** ✔ (31 Tage früher) |
| Schwer, Kult zerschlagen, Front hält | keiner | 0/5 | ✔; Bedrohung höchstens 6 |
| Sehr schwer, Kult zerschlagen, Front hält | keiner | 0/5 | ✔; Bedrohung bis 19 durch den frühen Start, gehalten von `bumpCeil` und `hostMin` |
| Schwer, zerschlagen + 3 Städte Aurelions untot | keiner | 0/5 | ✔ Aurelion zählt nicht mehr |
| Schwer, zerschlagen, **Front verloren** (Valen-Feldheere ab Tag 60 ausgelöscht) | 97, 105, 128 (3/5) | 104, 111, 178 | F2 ✔: möglich, nie vor 75 |
| Schwer, ignoriert + **Garde tot bei Bedrohung 15** (mit `guardBack`) | 90, 107, 110, 111, 119 | 97, 116, 119, 119, 174 | **119**: 10 Tage früher; der Fall kommt nur über den Heerzug ✔ |
| Schwer, ignoriert + Schwund −2/Tag ab 60, `reliefFloor` 25 | 109–127 | 118, 125, 134, 157, 167 | **134**: Stapelung bleibt im Fenster ✔ |

Hinweise zur Wertung:
- **Streuung:** Je ein Lauf fällt früh (99) oder spät (183). Der Median liegt im Ziel.
- **Nicht gemessen:** die Tagesfunktionen aus game.js (`campaignDay`, `raidDay`, `aurelDay`) und Schlachten am Spieler (UNVERIFIED).
- **Nach dem Einbau:** Der Verifier misst die Tabelle mit dem echten `capThreatDay` nach. Abnahme: ±10 Tage auf die Mediane.
