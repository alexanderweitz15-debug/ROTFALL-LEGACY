# Balance — Messung und Stellschrauben (Balance-Runde, Version 21)

Gemessen mit `RF.simFight` (nur `?dev`, game.js): gestellter Kampf auf leerer Karte, Schwierigkeit „Schwer“, übliche
Punkteverteilung (Nahkampf: 50 % Stärke, 40 % Ausdauer, 10 % Beweglichkeit; Fernkampf Beweglichkeit statt Stärke),
Waffenübung 5 + 3 je Stufe, Ausrüstung in Zustand 1. Zwei Spielweisen:

- **smart** — geschickter Spieler: rollt kurz vor jedem angesagten Treffer (Ausholen, Sonderangriff, langsamer Hieb ab
  250 ms Reaktionszeit), geht auf Schlagweite, rollt gegen Schützen nach vorn, haut nicht in Körperlose/Brüllende.
- **stand** — stehen und hauen (Untergrenze).

„Leben“ = Balken aus Kopf + Rumpf (am Boden, wenn der Rumpf leer ist). Werte sind Mittel aus 3–6 Läufen; Einzelkämpfe
streuen stark (Bosse: ein Doppeltreffer entscheidet). `RF.simFight(typ, { level, weapon, gear, elvl, ehp, eopt, mode,
pots, cells, n… })` liefert `{ win, dead, sec, hpLost, ehpLeft, dealt, rolls, potsUsed, pdmg, parmor, php, … }` und
setzt Welt, Ruf, Chronik und Flaggen danach zurück (der Tod des Gegners hat keine Weltfolgen).

## 1. Stellschrauben (Stand nach dieser Runde)

| Größe | Wert | Ort |
|---|---|---|
| Gegnerleben | `m.hp × (1 + 0,04 × Stufe) × BAL.hp (1,7)` | spawnEnemy |
| Gegnerschaden | `m.dmg × (1 + BAL.lvl × Stufe) × BAL.dmg (1,4)`, **BAL.lvl 0,05 → 0,06** | hit, Schützen |
| Bosse | **BOSS.hp ×2, BOSS.dmg ×0,6** (Omega ausgenommen: `bossScale:false`) | spawnEnemy, hurt |
| Rüstung | Treffer − 0,55 × Rüstung (Geschoss 0,5 ×), Gegnerrüstung = Gefahr × 1,6 | hit |
| Heldenschaden | `(Waffe × Zustand + (Attribut × 0,35 + Übung × 0,22 + Stufe × 0,35) × Tempo) × Mult.` | damageOf |
| Tempo-Faktor (neu) | Schwungdauer / 600 ms, **0,6 … 2** (Dolch 0,6, Langschwert 0,93, Zweihänder 1,63, Hammer 1,92); Fernwaffen 1 | damageOf |
| Heldenleben | 40 + Ausdauer × 4 + Stufe × 6 (Balken ≈ 45 %) | recalc |
| Höchststufe | **60**, EP ×1,35 bis 10, ×1,2 bis 20, **×1,04** danach (≈ 0,42 Mio. EP bis 60) | levelUp |
| Talentpunkte | **1 zum Start + 1 auf jeder dritten Stufe** = 21 bei Stufe 60 (Nutzerentscheid) (von 59 lernbaren Knoten) | levelUp |
| Statpunkte | 1 je Stufe + 1 je 5 Stufen (71 bis Stufe 60) | levelUp |

## 2. Held nach Stufe (übliche Ausrüstung)

| Stufe | Waffe | Rüstung (Teile) | Schaden/Hieb | Rüstung | Leben (Basis) | Balken |
|---|---|---|---|---|---|---|
| 1 | Rostiges Kurzschwert | Lederwams | 12 | 4 | 86 | 39 |
| 5 | Langschwert | Lederwams, Lederkappe, Lederstiefel, Holzschild | 22 | 10 | 118 | 53 |
| 10 | Langschwert | Kettenhemd, Kesselhut, Eisenstiefel, Drachenschild, Lederhandschuhe/-beinlinge | 28 | 26 | 156 | 70 |
| 15 | Zweihänder | Schuppenpanzer, Eisenhelm, Eisenstiefel, Kettenhandschuhe/-beinlinge | 59 | 30 | 198 | 89 |
| 20 | Frostklinge | Plattenkürass, Topfhelm, Eisenstiefel, Drachenschild, Panzerhandschuhe, Beinschienen | 43 | 44 | 236 | 106 |
| 30 | Der Rote Henker | Thron-Set (Harnisch, Helm, Handschuhe, Beinschienen), Eisenstiefel | 124 | 62 | 316 | 154 |
| 60 | Der Rote Henker | Thron-Set | 162 | 69 | 552 | 268 |

Rüstungsstufen (Brust / Kopf): gewöhnlich 1–6 / 2–4, ungewöhnlich 7–11 / 4–5, selten 12–15 / 7–9, episch 15–18 / 9–10,
legendär 19–24 / 10–12; Hände/Beine 1–5. Eine Stufe mehr Rüstung nimmt je Treffer 2–4 Schaden weg — spürbar. Schwache
Gegner (Wolf, Goblin) machen gegen Stufe-10-Rüstung nur noch 1–5 je Treffer: frühe Gebiete werden leicht (gewollt).

## 3. Waffen (rechnerische Dauerleistung, Stufe 15 / Stufe 30)

Takt = Schwungdauer (Bogen ×1,15; Armbrust/Gewehr max(Schwung, 0,42 × Schwung + Nachladen)). Fester Anteil F = 22,9
(Stufe 15) bzw. 41,2 (Stufe 30). „alt“ = ohne Tempo-Faktor.

| Waffe | Art | Hand | Schaden | Takt ms | Reichw. | Ausd./s | alt 15 | neu 15 | neu 30 |
|---|---|---|---|---|---|---|---|---|---|
| Sternenklinge | Schwert, mythisch | 1H | 26 | 600 | 50 | 16,7 | 82 | 82 | 112 |
| Dolch | Dolch | 1H | 5 | 300 | 26 | 13,3 | 93 | 63 | 99 |
| Schlagkralle | Dolch | 1H | 8 | 330 | 30 | 15,2 | 94 | 66 | 99 |
| Rapier | Rapier | 1H | 9 | 380 | 54 | 15,8 | 84 | 60 | 89 |
| Frostklinge | Schwert, episch | 1H | 16 | 560 | 48 | 16,1 | 69 | 67 | 97 |
| Langschwert | Schwert | 1H | 12 | 560 | 46 | 16,1 | 62 | 60 | 90 |
| Streitkolben | Kolben (AP 0,4) | 1H | 13 | 740 | 36 | 14,9 | 49 | 56 | 86 |
| Speer | Speer (Linie) | 1H | 10 | 640 | 74 | 12,5 | 51 | 54 | 84 |
| Zweihänder | Groß | 2H | 22 | 980 | 56 | 18,4 | 46 | 61 | 91 |
| Kriegshammer | Hammer (AP 0,6, Wucht) | 2H | 24 | 1150 | 44 | 17,4 | 41 | 59 | 90 |
| Der Rote Henker | Groß, legendär | 2H | 32 | 1250 | 56 | 19,2 | 44 | 62 | 92 |
| Hellebarde | Stange (fegt) | 2H | 17 | 920 | 82 | 15,2 | 43 | 57 | 87 |
| Wurfmesser | Wurf | 1H | 8 | 680 | 300 | 7,4 | 59 | 45 | 72 |
| Kurzbogen | Bogen | 1H | 9 | 805 | 360 | 9,9 | 33 | 40 | 62 |
| Langbogen | Bogen | 2H | 18 | 1058 | 460 | 10,4 | 30 | 39 | 56 |
| Armbrust | Armbrust (AP 0,5) | 2H | 26 | 2076 | 420 | 2,9 | 24 | 24 | 32 |
| Schockpistole | Magitech, lähmt | 1H | 12 | 934 | 260 | 3,2 | 37 | 37 | 57 |
| Magiegewehr | Magitech (AP 0,6) | 2H | 30 | 1351 | 520 | 3,0 | 51 | 39 | 53 |
| Runenarmbrust | Magitech, Brand | 2H | 28 | 1676 | 440 | 3,6 | 30 | 30 | 41 |
| Kristallkanone | Magitech, Streuung | 2H | 40 | 2776 | 380 | 3,2 | 23 | 23 | 29 |
| Präzisionsgewehr | Magitech (AP 0,9, durchschlägt) | 2H | 48 | 3376 | 680 | 1,8 | 21 | 21 | 26 |

Befund: Vor der Runde war jeder schnelle Stich gleich viel Attribut- und Stufenbonus wert wie ein Zweihänderhieb — Dolch
und Schlagkralle (22–40 Gold) lagen rechnerisch doppelt so hoch wie Zweihänder, dazu kam der Dolch-Rückenstich, der durch
einen Richtungsfehler **von vorn** auslöste (Messung Bär: Dolch 188/s, Zweihänder 45/s). Jetzt liegen Einhand, Zweihand und
Dolch bei 55–67 (Stufe 15); Dolche behalten wenig Ausdauer je Stich und den Rückenstich (nur noch von hinten), schwere
Waffen Wucht, Rüstungsdurchschlag und Taumeln. Nahkampf bleibt vor Fernkampf (Sicherheit kostet Schaden).
Magitech ist nicht übermächtig: das Magiegewehr ist die stärkste Fernwaffe (mit Zellen ≈ Langbogen-Niveau bei 520
Reichweite, 30 Gold je 10 Schuss), die schweren Gewehre sind Spezialwerkzeuge (Streuung, Durchschlag, Reichweite).

## 4. Normale Gegner (Held auf gleicher Stufe, smart / stand)

| Stufe | Gegner | Treffer | Zeit | Lebensverlust smart / stand |
|---|---|---|---|---|
| 5 | Wolf, Goblin, Skelett | 2–3 | 2–3 s | 4–10 % / 3–10 % |
| 5 | Bandit | 3,5 | 3 s | 14 % / 15 % |
| 5 | Keiler, Speerträger | 4–5 | 3–4 s | 36–53 % / 29–34 % |
| 5 | Banditenschütze | 2,6 | 5 s | 26 % (Rolle nach vorn) |
| 10 | Kopfgeldjäger, Goblinkrieger, Seeräuber | 3,5–4 | 3 s | 4–17 % / 10–21 % |
| 10 | Wiedergänger, Kultist, Geist | 2–5 | 3–8 s | 0–8 % |
| 10 | Knochenschütze | 2,4 | 13 s | 44 % |
| 15 | Kettenknecht, Automat, Gruftwächter | 3–5 | 4–6 s | 0 % / 2–26 % |
| 15 | Rotgardist | 4 | 5–8 s | 0 % / 47 % |
| 15 | Kettenschütze, Harpunier | 1,7 | 4–6 s | 20–31 % |
| 15 | Knochenritter (Schild vorn) | 4 | 20 s | 60 % / 90 % — flankieren oder Hammer |
| 20 | Todeshauptmann, Aschendämon, Engel | 5–10 | 3–7 s | 0–24 % / 14–38 % |
| 20 | Fleischgolem | 19 | 19 s | 1 % / 76 % |
| 30 | Todesritter (Roter Henker) | 5 | 5 s | 0 % / 29 % |
| 30 | Todesritter (Frostklinge) | 11 | 7 s | — / 78 % |

Urteil: Auf gleicher Stufe fallen die meisten Gegner in 2–6 Treffern und kosten 10–50 % — im Zielband. Wer sauber rollt,
nimmt gegen langsame Einzelgegner kaum Schaden (so gewollt: Können zahlt sich aus). Der Bär (Revier) ist mit 13–17
Treffern ein Brocken, aber reizbar statt angriffslustig. Ab Stufe 25 wurde es mit legendärer Ausrüstung zu leicht; dafür
jetzt BAL.lvl 0,06.

## 5. Bosse (Held auf üblicher Stufe, 3 Heiltränke, nach der Runde)

| Boss | Stufe Boss / Held | Vorher (smart) | Nachher smart | Nachher stand | Urteil |
|---|---|---|---|---|---|
| Graumähne (Leitwolf) | 9 / 9 | 14 s, 2/3, −76 % | 19 s, 3/3, −35 % | 34 s, 3/3, −37 % | ok (mit Rudel) |
| Gorak | 10 / 10 | 14 s, 2/3, −35 % | 20–95 s, 3/4, −13 % | 134 s, 1/3 | ok, lang; mit Stufe 8 und Lederrüstung tödlich |
| Hrodvar | 11 / 12 | 14 s, 3/3, −32 % | 39–45 s, 4/4, −46–50 % | 83 s, 0/3 | ok, gefährlich (Leibwache) |
| Karrak, Sandfürst | 12 / 12 | 6 s, 3/3, −37 % | 17 s, 4/4, −41 % | 18 s, 3/3 | noch zu leicht (nur ein Bandit) |
| Varg | 16 / 16 | 11 s, 2/3, −97 % | 15–29 s, 2–4/4, −42–100 % | 15 s, 4/4 | kurz, gefährlich; im Spiel mit Hofstaat |
| Weißbart | 18 / 18–20 | 22 s, 2/3, −66 % | 40–69 s, 1–3/6, −80 % | 132 s, 0/3 | schwer — Empfehlung Stufe 20+ |
| Garmadon | 18 / 20 | 21 s, 1/3, −91 % | 106–128 s, 1/6 | 111 s, 0/3 | zu schwer auf 20; Stufe 25 legendär: 48 s, 3/4 |
| Dodon | 20 / 20 | 26 s, 0/3 | 29 s, 0/3 | — | zu schwer auf 20; Stufe 25 legendär: 65 s, 4/4 |
| Omega | 20 / 25 | 0/3, Omega 90 % übrig | unverändert | — | allein nicht schaffbar (Heeresschlacht) |

Vorher: Bosse lagen nach 10–26 s am Boden oder der Held nach zwei, drei Treffern — Glücksspiel. Nachher: 20–130 s, mit
Rollen gewinnbar, Fehler kosten viel. Garmadon (Lebensraub, Totenwellen) und Dodon (Hammerschlag ×2,4) verlangen
Stufe 22–25 und legendäre Ausrüstung.

## 6. Stufen und Talente

- EP bis Stufe 10: 2 364, bis 20: ≈ 22 800, bis 30: ≈ 70 000, bis 60: ≈ 420 000 (vorher 3,1 Mio. — unerreichbar).
  Ein später Gegner bringt 60–260 EP, ein Boss 200–3 000.
- Gegnerstufen der Gebiete enden bei 50 (Gefahr 5), Bosse haben feste Stufen (9–20). Stufe 60 überholt alles —
  Gegner wachsen darüber nicht weiter (kein Absurdwachstum).
- Talente: 64 Knoten, davon 5 Paare von Schlüsselknoten, die einander ausschließen (59 lernbar). Mit 31 Punkten bei Stufe
  60 hat man gut die Hälfte davon; wer nur die drei allgemeinen Zweige (29) und eine Titelklasse (6) nutzt, fast alles.
  Ein Punkt alle 5 Stufen (13 bei 60) läge bei 22 % — zu wenig für „viele Talente“.

## 7. Offene Vorschläge (nicht gebaut)

1. **Sandfürst** eigene Fähigkeit (Sandwurf: blendet, Staubwirbel), sonst bleibt er ein großer Bandit.
2. **Omega-Soloweg** prüfen: mit Verbündeten und Gebet messen (die Probe kann keine Verbündeten stellen).
3. **Garmadon/Dodon** Stufe in der Welt auf 22–24 heben oder Lebensraub bei Garmadon auf 15 % senken, wenn Stufe 20
   das Ziel ist.
4. **Knochenritter**: Schild vorn ist hart für Nahkämpfer ohne Hammer — ein Hinweis „Von der Seite angreifen“ beim
   ersten Abprall.
5. **Varg**: Rumpf-Treffer entscheiden bei Menschenähnlichen (Rumpf ≈ 45 % des Lebens) — Bosse mit Körper fallen
   schneller als ihre Lebenszahl sagt. Eigene Rumpfreserve für Boss-Menschen erwägen.
6. **Wurfmesser** (Reichweite 300, 45 Gold) bleibt die stärkste billige Fernwaffe; ggf. Munition (Einsammeln) einführen.

## Aldhelm, Blutfürst von Varonheim (§5g.2, 01.10.2026)
Gemessen mit `RF.simFight('aldhelm', { level, weapon:'longsword', gear:{ chest, offhand:'kite_shield' }, pots:3, elvl:16, seed:1–3 })`, ohne Blutfesseln, Lichtschächte und Verbündete:
- Grundleben 380: Sieg nach 22–26 s — zu kurz (Ziel 40–180 s).
- ~~Grundleben 560~~ (Messfehler: `ehp` setzt das Leben ohne den Boss-Faktor ×2 — die „560“ entsprachen etwa Grundleben 280).
- **Grundleben 340, Schaden 21 (gewählt, Nachmessung mit 8 Seeds, ohne `ehp`):** Stufe 16 (Kette + Schild): 4/8 Siege, ⌀ 24 s, Verlust ⌀ 80 %; Stufe 17: 6/8, ⌀ 23 s, 60 %; Stufe 18 (Platte + Schild): 5/8, ⌀ 45 s, 63 %. `simFight` streut bei Phasenbossen stark (Hunter 4); im Spiel machen Fesseln den Kampf länger, Licht und Verbündete kürzer.
- Fesseln (je Gefangenem +0,4 %/s) machen ihn schwerer, Lichtschächte (bis −25 %) und Marschall Brandt leichter — die Vorgeschichte entscheidet. Empfohlene Stufe 16–18.

## Audit 04.10.2026 — Balance-Änderungen (Phase 3)

| Punkt | Vorher | Nachher | Grund |
|---|---|---|---|
| 3.1 Eigenbau verkaufen | Verkaufspreis nach Wert (Harnisch: ~120 Material → ≥ 207 Gold) | höchstens 1,5 × Materialwert (`crafted`-Flag, `craftMatValue`) | Gold-Kreislauf übers Handwerk |
| 3.2 Lieferaufträge | Wert × Menge × 1,6 (bis ~3,5× mit Überschuss-Einkauf) | Marktpreis der Zielstadt (Verkaufskurs) × 1,15, bei Abgabe gerechnet | Exploit; Ruf geht an die Macht der Zielstadt (F-12, 03.10.) |
| 3.3 Königseisen | zwei Items, bei allen Stadtschmieden | ein Item `koenigseisen`; nur Tiefhall (Hilda, Hort) und Branns Auftrag | Dublette, zu leicht erreichbar |
| 3.4 Lager | unbegrenzt | 48 Felder, +24 je fertigem Lagerhaus | F-08, Gepäckgrenze war bedeutungslos |
| 3.5 Parade | 3 Ausdauer | 8 Ausdauer | Parade-Schleife (Taumeln 900 ms, Neu-Heben 400 ms) |
| 3.6 Multiplikator-Deckel | Meuchelstich ×3 · Hinterhalt ×3 · Krit 1,8 = ×16,2 | höchstens ×6 des Grundschadens je Treffer | Stapel-Exploit; additive Gruppen (Spec) nicht gebaut — Deckel reicht, ist nachvollziehbar |
| 3.7 Mindestschaden | 1 | 10 % des Rohschadens | Rüstung machte schwache Gegner wirkungslos |
| 3.11 Frost | keine Immunität | 3 s gefeit nach dem Auftauen (wie Schock) | Dauerfrost durch Elites |
| 3.13 Erbe-Ruf | aller Ruf × 0,5 | positiver × 0,5, negativer × 0,8 | Wegwerf-Tod als Sühne |
| 3.15 Stiften | +3 Ruf je Zahlung | +3 höchstens einmal am Tag je Ort | Ruf kaufbar |
| 2.5 Sühne | kein Rückweg aus Verhasst | Mittler (Nix/Grisk/Sael): Gold 6 je fehlendem Punkt (min. 150) oder 20 Eisen → Ruf −59, alle 10 Tage | Softlock Bande/Goblins/Tote |

Alle Werte vorläufig; messen mit `RF.simFight` und im Spiel.

## Reliquien (Version 24)
Bewusste Endgame-Ausnahme von den Ausrüstungsgrenzen (Nutzerentscheid „stark, mit Deckeln“). Ein Topf je Wert, Deckel je Phase:

| Phase | Schaden | Angriffstempo | Lauftempo | Abklingzeit | Krit | Lebensraub | Rüstung | Treffer-Multiplikator |
|---|---|---|---|---|---|---|---|---|
| früh (1–2 Fassungen) | +25 % | +20 % | +20 % | −20 % | +8 % | 5 % | +6 | ×1,35 |
| drei Fassungen | +50 % | +40 % | +35 % | −40 % | +15 % | 10 % | +12 | ×1,8 |
| mit Stufe VIII | +120 % | +100 % | +70 % | −70 % | +30 % | 20 % | +25 | ×3 |

Untergrenzen: Schwung ≥ 180 ms, Ausweich-Abklingzeit ≥ 250 ms. Stufenfaktor der Zahlen: 1 / 1,25 / 1,5 / 1,8 / 2,1 / 2,5 / 3 / 3,6.
Gemessen (Stufe 30, Schlächterherz + Blutkranz + Rotdorn auf VIII, 30 % Leben, volle Serie): Schaden ×1,7–1,8, Angriffstempo +100 % (gedeckelt), Lebensraub 14 %.

## Krieg: Schonfrist, Streifen, Entsatz (05.10.2026)

Messung: neues Spiel, Schwer, Held in Tiefhall (keine Schlacht vor Ort), 30 Tage je 4 Kriegsrunden + Tagesschritt (`warTick`/`warDay`).

| | vorher | nachher |
|---|---|---|
| Eren fällt | Tag 1 | nie (kurz Tag 2–3 in einem Lauf ohne Streifen, Rückeroberung am selben Tag) |
| Knoten der Toten Tag 15 | 13 von 16 | 3 (Schwarze Feste, Nekropole, Alt-Vharn) |
| Nordfurt | fällt Tag 25 | hält |
| Sonnwacht | fällt Tag 15 | fällt Tag 5, 15–18, wird zurückgeholt (Aktion bleibt) |
| Westen (Friedhof, Moor, Feste) | alles verloren, dann tot | bleibt umkämpft: die Toten halten ihre Gruft, die Kettenstreife (max. 50) schlägt ihre Heere vor Eren |
| Valens Heere Tag 1 | marschieren zur Nekropole | halten Eren/Straße, Streife unterwegs |

Stellschrauben (`sim.js`): `WAR_GRACE` 5 Tage, `PATROL` (Stärke 35, Routen, `PATROL_EVERY` 4, `PATROL_MAX` 50), `UNDEAD_ARMIES` 2 (die Toten stellen bis zu zwei Heere aus Gruft-Knoten ohne Heer auf), `RELIEF` (3 Tage Wartezeit, Stärke 40, 5 Tage Stationierung, je Stadt alle 6 Tage). Streifen nehmen keine Gruft-Knoten (auch nicht nach gewonnener Feldschlacht) und wachsen höchstens auf 50, damit die Front lebendig bleibt (Nutzer: „da soll schon Aktion sein“). Lauf über 45 Tage: Sonnwacht wechselt mehrfach, Alt-Vharn wird zeitweise von Valen genommen, Eren und Nordfurt halten, kein Dauerzustand.
