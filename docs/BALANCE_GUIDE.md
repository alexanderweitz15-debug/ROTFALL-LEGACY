# Balance-Leitfaden für neue Inhalte

Kurz und praktisch: Wer eine Waffe, Rüstung, einen Gegner oder Boss einbaut, hält sich an diese Bänder und misst danach
mit `RF.simFight`. Hintergrund und Messwerte: `docs/BALANCE.md`. Alle Formeln stehen in `src/game.js` (damageOf, armorOf,
hit, hurt, spawnEnemy, levelUp).

## 1. Formeln, die man kennen muss

| Was | Formel |
|---|---|
| Heldenschaden je Hieb | `(Waffe.dmg × (0,55 + 0,45 × Zustand) + F × Tempo) × Mult.` |
| Fester Anteil F | `Attribut × 0,35 + Übung × 0,22 + Stufe × 0,35` (Stärke im Nahkampf, Beweglichkeit im Fernkampf); ≈ 5 (St. 1), 23 (St. 15), 41 (St. 30) |
| Tempo-Faktor | Nahkampf `clamp(speed / 600, 0,6, 2)`, Fernkampf 1 |
| Takt (Zeit je Angriff) | Nahkampf `speed`; Bogen `speed × 1,15`; Armbrust/Gewehr `max(speed, 0,42 × speed + reload)` |
| Rüstung gegen Hieb | Schaden − 0,55 × Rüstung (Geschoss: − 0,5 × Rüstung × (1 − AP)); mindestens 1 |
| Gegnerrüstung | Gefahr (`threat`) × 1,6 (Geschoss × 1,2) |
| Gegnerleben | `m.hp × (1 + 0,04 × Stufe) × BAL.hp (1,7)` (Boss zusätzlich × BOSS.hp) |
| Gegnerschaden | `m.dmg × (1 + BAL.lvl (0,06) × Stufe) × BAL.dmg (1,4)` (Boss zusätzlich × BOSS.dmg) |
| Heldenleben | `40 + Ausdauer × 4 + Stufe × 6`; der Balken (Kopf + Rumpf) ist ≈ 45 % davon, am Boden bei Rumpf 0 |
| Menschenähnliche Gegner | haben Trefferzonen: tot, wenn der Rumpf leer ist — effektiv ≈ 45 % ihres Lebens |
| Schwierigkeit | Angsthase ×0,75 Leben / ×0,7 Schaden, Sehr schwer ×1,25 / ×1,3 (über `BAL`) |

## 2. Waffen

**Dauerleistung** = `(dmg + F × Tempo) / Takt`. Zielbänder (Nahkampf, Stufe 15 / 30):

| Seltenheit | Schaden (1H / 2H) | DPS St. 15 | DPS St. 30 | Wert (Gold) |
|---|---|---|---|---|
| gewöhnlich | 5–10 / 6–14 | 50–60 | 80–90 | 15–50 |
| ungewöhnlich | 9–14 / 15–20 | 55–62 | 85–92 | 75–170 |
| selten | 12–16 / 17–26 | 56–64 | 87–94 | 190–300 |
| episch | 16–18 / 25–28 | 60–68 | 90–98 | 320–520 |
| legendär | 18–27 / 27–34 | 62–68 | 92–100 | 520–1200 |
| mythisch (nie zufällig) | ~26 | ≤ 82 | ≤ 112 | ≥ 900 |

Faustregeln:
- **Schneller heißt nicht stärker.** Wer die Schwungdauer halbiert, halbiert auch den Schaden (der Tempo-Faktor gleicht F aus).
  Schwungdauer: Dolch 300–380, Einhand 460–860, Zweihand 900–1300 ms.
- **Ausdauer je Hieb** ≈ `speed / 60` (Dolch 4–5, Schwert 8–9, Zweihänder 18–24). Dauerleistung über ~17 Ausdauer/s
  erschöpft (Erholung ≈ 12–13/s im Stand) — so gewollt für schwere Waffen.
- **Reichweite** (px): Dolch 26–30, Schwert/Axt 34–50, Zweihand 44–58, Speer/Stange 70–90. Mehr Reichweite = Takt
  +10–20 % oder Schaden −10 %.
- **Durchschlag (AP)**: 0–0,3 normal, 0,4–0,6 für Kolben/Hammer/Picke (dafür −10–15 % DPS), ≥ 0,7 nur episch+ oder
  Gewehre.
- **Sondereigenschaften** (crit ×2,2–2,6 nur Rückenstich, sweep, flail, crush, bleed, bind, execute) kosten 5–10 % DPS.
- **Fernwaffen liegen unter dem Nahkampf**: Wurf/Schleuder 40–45, Bögen 38–42, Armbrust 20–30 (dafür AP, große
  Einzeltreffer) bei Stufe 15. Nie über 45.
- **Magitech**: Energie je Schuss so, dass eine Zelle (30 Gold) 4–20 Schuss hält; DPS mit Zellen ≤ Langbogen + 5.
  Spezialwirkung (Streuung, Durchschlag, Lähmung, Brand) statt mehr DPS. Rangsperre (`mtier`) für starke Gewehre.
- Rechne neue Waffen mit dem Ausdruck aus `docs/BALANCE.md` Kap. 3 gegen und vergleiche mit dem Nachbarn gleicher Art.

## 3. Rüstungen

| Seltenheit | Brust | Kopf | Hände/Beine/Füße | Schild (block) | Wert |
|---|---|---|---|---|---|
| gewöhnlich | 1–6 | 2–4 | 1–2 | 1–2 (0,24–0,3) | 8–90 |
| ungewöhnlich | 7–11 | 4–5 | 2–3 | 4 (0,42) | 60–260 |
| selten | 12–15 | 7–9 | 4–5 | 6 (0,58) | 160–460 |
| episch | 15–18 | 9–10 | 4–5 | — | 400–800 |
| legendär | 19–24 | 10–12 | — | — | 900–2600 |

- **Gewicht (`slow`)**: Brust ab 11 Rüstung 0,04–0,13 (je +2 Rüstung über 11 etwa +0,02), Turmschild 0,22. Ohne `slow`
  darf eine Brust höchstens 10 haben.
- Gesamtrüstung einer vollen Ausrüstung: St. 5 ≈ 10, St. 10 ≈ 25, St. 15 ≈ 30, St. 20 ≈ 45, St. 30 ≈ 60–65 (inkl.
  Stufe × 0,25). Mehr als 70 macht normale Gegner harmlos.
- Klassenrüstung (Todesritter, Mönch …) bleibt unter der Handelsrüstung gleicher Seltenheit; sie trägt Klassenboni.

## 4. Gegner

- **Ziel auf gleicher Stufe:** 2–6 Treffer mit typischer Waffe, 10–30 % Lebensverlust (Spieler rollt nicht), bis 50 % für
  „harte“ Arten (Gefahr 3). Schwarmgegner (Gefahr 1) 1–3 Treffer, < 10 %.
- **Grundwerte je Gefahr** (`threat`): 1 → hp 22–46, dmg 6–11; 2 → hp 36–62, dmg 9–14; 3 → hp 50–150, dmg 13–18;
  4 → hp 170–340, dmg 17–24 (Elite, selten); Schützen hp ×0,7, Schaden wie Nahkämpfer, Takt ≥ 1500 ms.
- **Wucht gegen Zeit:** hoher Schaden → langsamer Angriff (atk ≥ 1300) und/oder Ansage (`telegraph` 450–800 ms).
  Ohne Ansage höchstens dmg 14.
- **Stufe** kommt aus dem Gebiet (`ZONE`, Deckel 50). Nicht an `BAL.lvl` drehen, um einen einzelnen Gegner zu stimmen —
  das ändert alle.
- Sonderregeln (körperlos, Schild vorn, Lebensraub) brauchen einen sichtbaren Hinweis und einen Konter.

## 5. Bosse

- `MONSTERS.x.boss = true` → automatisch **BOSS.hp ×2, BOSS.dmg ×0,6** (`src/game.js`). Werte in data.js also als
  „Grundboss“ eintragen: hp 220–620, dmg 18–30.
- **Ziel:** 40–180 s bei empfohlener Stufe und Ausrüstung, echte Gefahr (40–80 % Lebensverlust mit Rollen und
  2–3 Tränken), Sieg für einen geschickten Spieler ≥ 2 von 3.
- **Phasen** bei 50 % und 25 % (bzw. 66/33 %); jede Phase ändert das Verhalten, nicht nur die Zahlen. Kurze
  Unverwundbarkeit beim Phasenwechsel ≤ 1,1 s. Verstärkung höchstens 2–3 Gegner, Stufe Boss − 4.
- **Jeder schwere Angriff hat eine Ansage** (≥ 500 ms) und ist ausweichbar; Einzeltreffer ≤ 60 % des Balkens bei
  empfohlener Stufe.
- **Empfohlene Stufe** = Bossstufe + 0…2 (Garmadon, Dodon, Weißbart derzeit 22–25). In Dialog/Gerücht nennen.
- **`bossScale:false`** nur für Heeresschlachten mit Verbündeten (Omega). Regionalbosse (`REGION_BOSSES`) setzen `hp`
  und ggf. `dmg` (Wuchtfaktor) selbst; `BOSS` gilt trotzdem.
- Menschenähnliche Bosse sterben am Rumpf (≈ 45 %) — dafür hp +30–40 % ansetzen.

## 6. Stufen und Erfahrung

- `MAX_LEVEL = 60`. Kurve: ×1,35 bis Stufe 10, ×1,2 bis 20, ×1,04 danach (≈ 0,42 Mio. EP bis 60).
- EP je Kill = `m.xp + Stufe × 2`. Richtwerte `m.xp`: Gefahr 1 → 6–16, 2 → 20–40, 3 → 45–120, 4 → 120–180,
  Boss 180–900, Omega 3000. Auftragsbelohnung ≈ 3–8 gleichwertige Kills.
- Neue Gebiete: Levelspanne aus `ZONE` wählen, nicht neue Spannen über 50 erfinden.

## 7. Talente und Statpunkte

- `TALENT_EVERY = 2`: 1 Punkt zum Start + 1 je gerader Stufe = 31 bei Stufe 60. Ziel: 50–70 % der lernbaren Knoten.
  Neue Knoten senken den Anteil — ab ~62 lernbaren Knoten `TALENT_EVERY` prüfen (Probe „Höchststufe 60“ schlägt an).
- Kleine Knoten: +5–8 % (Schaden, Leben), +2 Rüstung, +10–15 Ausdauer. Schlüsselknoten: stark, aber mit Preis
  (Berserker: +15 % eingesteckt) oder Ausschluss (`excl`).
- Statpunkte: 1 je Stufe + 1 je 5 Stufen (71 bis 60). Ein Punkt ist ≈ 0,35 Schaden je Hieb bzw. 4 Leben.

## 8. Affixe, Sets, Legendäre

- **Affixe** (Spannen in `AFFIXES`): Schaden/Zauber/Fernkampf ≤ +14 %, Tempo ≤ +12 %, Krit ≤ +7 %, Durchschlag ≤ +25 %,
  Rüstung ≤ +3, Leben ≤ +7 %. Spielverändernd (`major`, nur episch, eins je Stück): Lebensraub ≤ 8 %, Dornen ≤ 25 %.
- **Anzahl**: ungewöhnlich 1, selten 2, episch 3 (1 major), legendär 2 + Sondereffekt. Mythisch nie zufällig.
- **Summe über alle Teile**: Schaden aus Affixen+Set ≤ +40 %, Lebensraub gesamt ≤ 10 %, Tempo ≤ +25 %.
- **Sets**: 2 Teile ≤ +6 Rüstung und ≤ +12 % Schaden (oder +35 % gegen eine Art); 3/4 Teile zusammen ≤ +5 Rüstung,
  ≤ +20 % Blocken, ≤ +8 % Leben, ≤ 3 % Lebensraub.
- **Legendäre Sondereffekte** (`LEGENDS`): wirken bedingt (Todesstoß, Chance, < 30 % Leben), nie dauerhaft +X %.
- Fundchance (`RARITY_DROP`): 62/24/10/3,5/0,5 % — nicht erhöhen, lieber Gefahr-Bonus des Fundorts nutzen.

## 9. Preise (value)

Faustregel `value ≈ Grundwert der Seltenheit × Stärke im Band`: gewöhnlich 15–60, ungewöhnlich 60–260, selten
190–460, episch 320–1000, legendär 520–2600. Magitech +50 % (Kristall), Munition/Zellen 30 je Füllung. Verbrauch
(Trank 55) so, dass ein Bosskampf mit 3 Tränken ≤ 10 % des Gelds auf der empfohlenen Stufe kostet.

## 10. Checkliste „Bevor du etwas Neues einbaust“

1. Ins Band einordnen (Tabellen oben): Seltenheit, Stufe, Nachbar gleicher Art.
2. Dauerleistung/Takt/Ausdauer ausrechnen (Waffe) bzw. Treffer bis Tod und Schaden je Treffer (Gegner) bei Zielstufe.
3. Hat es eine Sonderregel? Dann Konter, Hinweis im Spiel (Regel „Explain to player“) und −5–10 % auf die Zahlen.
4. Mit `RF.simFight` messen (unten): 3–6 Läufe, beide Spielweisen.
5. Nichts verschlechtert die Nachbarn? Kein Gegenstand dominiert seine Art in allen Werten.
6. Boss: Zielzeit 40–180 s, empfohlene Stufe notieren; `bossScale` bewusst setzen.
7. Selbsttest laufen lassen (alle PASS), `docs/MECHANIKEN.md` und `docs/BALANCE.md` nachtragen.

## 11. Messen mit RF.simFight (nur `?dev`)

```js
// Held Stufe 15 mit Zweihänder und Schuppenpanzer gegen Rotgardist Stufe 15, geschickter Spieler
RF.simFight('rotgardist', { level: 15, weapon: 'greatsword',
  gear: { chest: 'scale_mail', head: 'iron_helm', feet: 'iron_boots' }, elvl: 15, mode: 'smart', seed: 1 });
// → { win, dead, sec, hpLost, ehpLeft, dealt, rolls, potsUsed, pdmg, parmor, php, swings, landed, tiredS, cells }
```

- Optionen: `level, weapon, gear{slot:key}, attrs, skill, elvl` (Gegnerstufe), `ehp` (Grundleben, z. B. Regionalboss),
  `eopt` (Felder für spawnEnemy, z. B. `{ boss: true, rboss: 'sandlord', dmgMul: 1.8 }`), `mode: 'smart' | 'stand'`,
  `nododge`, `pots` (Heiltränke), `cells` (Energiezellen), `maxT` (ms, Standard 180 000), `boss: { hp, dmg }`
  (BOSS probeweise ändern), `diff` (Standard „schwer“), `flags` (z. B. `{ goblinsFreed: false, garmFight: true,
  vargChallenged: true, morrHostile: true }`, sonst sind manche Gegner neutral).
- Mehrere `seed`s mitteln; Kämpfe mit Verstärkung sind für die Nachbildung schwer (Werte eher zu pessimistisch).
- Dauerleistung einer Waffe: Attrappe mit viel Leben und ohne Schaden, `dealt / 30`:
  `RF.simFight('bear', { level: 15, weapon: 'mace', elvl: 15, ehp: 4000, eopt: { dmgMul: 0.01, provoked: true }, maxT: 30000 })`.
- Sicherheit: vor jedem Neuladen den Spielstand aus der Sicherung zurückschreiben
  (`localStorage.setItem('rotfall.legacy.save', localStorage.getItem('rotfall.backup.s14c'))`); simFight selbst setzt
  Welt, Ruf und Flaggen zurück.
