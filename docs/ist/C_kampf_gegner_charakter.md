# Ist-Zustand, Bereich C: Kampf, Gegner, Charakter

## Audit 04.10.2026 — Phase 1 (Code ist die Wahrheit)

- **1.2 Talentpunkte:** `TALENT_EVERY = 2` (`game.js:4382`): einer zum Start, einer je zweiter Stufe, einer je bestandener Klassenprüfung. C ist richtig, IST_alt (jede 3.) falsch.
- **1.3 Gegnerschaden:** `BAL.lvl = 0.06` (`game.js:1885`). C richtig.
- **1.4 Karrak:** Grundleben **340** (`REGION_BOSSES`, `game.js:2025`; vorher 240). C richtig.
- **1.5 Zählung:** `CLASSES` 19 (inkl. wanderer und 6 Titel-/Dunkelklassen), `ABILITIES` 104 (davon 31 Zauber `sp_*`), `SKILL_TREE` 221 Einträge, `MONSTERS` 64, `ELITES` 32, `TITLE_CLASSES` 6.
- **1.9 Boss-Intros:** `BOSS_CARDS` hat 7 Schlüssel (chain_master, hrodvar, garmadon, whitebeard, dodon, gorak, omega). **Graumähne und Karrak fehlen weiter** — C §23 richtig, „H12 erledigt“ war zu früh. Bleibt Phase 5.6.
- **1.11 Prothesen-Werkbank:** hat seit 03.10. ein Fenster (`mechUI`); C §18 „noch Dialogliste“ ist **Doku-Fehler**.
- **1.12 Regionalboss-Beute:** `die()` (`game.js:4132`) lässt Karrak die Klinge des Sandfürsten und Graumähne den Leitwolfzahn sicher fallen; einen eigenen `BOSS_LOOT`-Pool haben beide **nicht** (nur Grundart-Tabelle). Beide Aussagen stimmen also je zur Hälfte.
- **1.8 Zauberlehrer:** `sp_staunch`/`sp_regen` lehrt Mutter Aldis (und die gerettete Hexe), `sp_shock` Corvinus — H7 erledigt, IST_alt falsch.
- **C-1 ergänzt 04.10.:** Duell/Grube — Schaden kommt sichtbar an, Fechter stirbt nie (Rumpf ≥ 1), Ende erst bei echtem Rumpf < 20 %.
- **1.14:** Elite „Irmhild vom Frostgrab“ (umbenannt).


Stand: 03.10.2026, Code-Stand v24 (Dev-Server 8770). Grundlage: `src/data.js`, `src/game.js`, `src/body.js`, `src/render.js`, `src/ui.js`, `src/sky.js` sowie die alten Dokumente `docs/IST_ZUSTAND.md` und `docs/MECHANIKEN.md`.

**Hinweis zu den Zeilennummern:** `game.js` wurde während der Prüfung parallel bearbeitet. Die Zeilen können um einige Stellen verrutscht sein. Deshalb steht immer auch der Funktionsname dabei.

**Wie geprüft wurde:**
- Im Spiel: eigener Tab mit `?dev` und `RF.S._quiet = true`. Der Spielstand war vorher aus dem Backup zurückgesetzt und wurde am Ende wieder darauf gesetzt. Es wurde nie gespeichert, der Tab ist geschlossen.
- Der Tab lief im Hintergrund. Die Spielschleife wurde deshalb mit `RF.tick()` von Hand weitergedreht.
- „Live geprüft“ heißt: im Spiel ausgelöst. „Nur Code gelesen“ wird ehrlich so genannt.

---

## Inhaltsverzeichnis

1. [Grundwerte des Helden](#1-grundwerte-des-helden)
   - Attribute, Stufen, Talentpunkte, Statpunkte
   - Fertigkeiten (welche wirken wie?)
   - Schwierigkeitsgrade
2. [Nahkampf](#2-nahkampf)
   - Angriff und Kombo
   - Schwerer Hieb per Halten
   - Kampfstil nach Waffenseltenheit (Packs)
   - Deckung, Parade, Schild, Nahkampfabwehr
   - Ausweichen (Rolle)
   - Schleichangriff, Rückenstich, Wahrnehmung
3. [Fernkampf](#3-fernkampf)
4. [Schwere Angriffe der Gegner mit Ansage](#4-schwere-angriffe-der-gegner-mit-ansage)
5. [Zustände (Status)](#5-zustände-status)
6. [Körperzonen, Glieder, Bewusstlosigkeit, Verletzungen](#6-körperzonen-glieder-bewusstlosigkeit-verletzungen)
7. [Heilung](#7-heilung)
8. [Lebensbalken: Ziel, Boss, HUD, Gruppe](#8-lebensbalken)
9. [Tod, Heldentod, Erbe, Ahnenfeind](#9-tod-heldentod-erbe-ahnenfeind)
10. [Gefangennahme (Gegner nehmen und selbst gefangen werden)](#10-gefangennahme)
11. [Magie: Schulen, Zauber, Lehrer](#11-magie)
12. [Fähigkeiten (ABILITIES)](#12-fähigkeiten-abilities)
13. [Klassen, Lehrer und Klassenprüfungen](#13-klassen-lehrer-und-klassenprüfungen)
14. [Titelklassen](#14-titelklassen)
15. [Sternbild-Talente und Talentpunkte](#15-sternbild-talente-und-talentpunkte)
16. [Gefährten (Moral, Loyalität, Sternbild, Desertion)](#16-gefährten)
17. [Begleittiere und Reittiere](#17-begleittiere-und-reittiere)
18. [Bionik und Prothesen](#18-bionik-und-prothesen)
19. [Vampir und Blutkult-Fähigkeiten](#19-vampir-und-blutkult-fähigkeiten)
20. [Gegner: vollständige Tabelle (MONSTERS)](#20-gegner-vollständige-tabelle-monsters)
21. [Beutetabelle (LOOT) je Gegner](#21-beutetabelle-loot-je-gegner)
22. [Elite-Mini-Bosse (ELITES)](#22-elite-mini-bosse-elites)
23. [Bosse](#23-bosse)
24. [Zusammenfassung Fehlversuche](#zusammenfassung-fehlversuche)

---

## 1. Grundwerte des Helden

### Attribute, Stufen, Talentpunkte, Statpunkte

- **Was es ist:**
  - Sechs Attribute: Stärke, Beweglichkeit, Ausdauer, Intelligenz, Wahrnehmung, Willenskraft. Jedes startet bei 8, dazu kommen die Boni der Herkunft.
  - Aus den Attributen und der Stufe errechnen sich Leben, Ausdauer, Mana und Kritchance.
  - Mit jeder Stufe gibt es Punkte zum Verteilen.
- **Wo / Wer:** Charakterbogen (Taste C) und Sternenhimmel (Taste T). Die Herkunft wählt man bei der Charaktererstellung (`ORIGINS`, data.js:2–13).
- **Herkünfte:**

  | Herkunft | Attribute | Fertigkeiten | Startausrüstung | Gold |
  |---|---|---|---|---|
  | Feldknecht | Stärke +1, Ausdauer +2 | Überleben 5, Handwerk 4 | Axt, Hemd, Brot | 8 |
  | Jäger | Beweglichkeit +2, Wahrnehmung +1 | Bogen 8, Überleben 6, Jagd 6 | Kurzbogen, Lederwams, Dörrfleisch | 12 |
  | Lehrling | Intelligenz +2, Willenskraft +1 | Handwerk 7, Medizin 5 | Dolch, Hemd, 2 Heilkraut | 22 |
  | Ehemaliger Soldat | Stärke +2, Ausdauer +1 | Einhändig 9, Verteidigung 7 | rostiges Schwert, Holzschild, Lederwams | 10, Valen +10 |
  | Wanderer | Beweglichkeit, Wahrnehmung, Willenskraft je +1 | Überleben 4, Handel 4 | rostiges Schwert, Hemd, Brot | 30 |

- **Ablauf:**
  - Die nötige Erfahrung wächst je Stufe ×1,35, ab Stufe 10 ×1,2 und ab Stufe 20 ×1,04. Höchststufe ist 60 (`MAX_LEVEL`, game.js ~4275).
  - Jede Stufe gibt 1 Statpunkt, jede fünfte Stufe einen zusätzlichen.
  - Talentpunkte gibt es 1 zum Start und 1 auf jeder **zweiten** Stufe (`TALENT_EVERY = 2`). Dazu kommt +1 je bestandener Klassenprüfung (`talentTotal`, game.js ~4278).
  - Beim Laden wird auf dieses Soll aufgefüllt (`talentTopUp`), aber nie gekürzt.
  - Ein Aufstieg heilt voll, außer man liegt am Boden.
- **Belohnung / Folgen:** Statpunkte erhöhen die Attribute. Talentpunkte geben Sterne (siehe §15).
- **Bedienung:**
  - Charakterbogen mit Knöpfen „Stärke +1“ usw. Jeder Knopf erklärt im Tooltip, was das Attribut bewirkt (ui.js `charUI`, `ATTR_TIP`).
  - Debug: „Klassen: Talentpunkte, Prüfungen, Aufnahme“ (Punkte auffüllen, Rechnung zeigen, Stufe +2).
- **Geprüft:** Live.
  - Der Testheld auf Stufe 12 hat ein Soll von 7 Talentpunkten, aber 12 freie Punkte. Das ist so gewollt: Ältere Stände hatten mehr Punkte und behalten sie.
  - Nach der bestandenen Kriegerprüfung stieg das Soll auf 8, und es gab genau +1 Punkt.
- **Fehlversuche / Lücken:**
  - `docs/BALANCE_GUIDE.md` §7 nennt laut OFFEN.md noch „jede 3. Stufe“. Gilt seit 02.10. als überholt (nicht neu geprüft).
  - Alte Stände haben teils deutlich mehr Punkte als das Soll. Das ist Absicht („nie kürzen“), nur zur Kenntnis.

### Fertigkeiten (welche wirken wie?)

- **Was es ist:** 14 Fertigkeiten (`SKILL_NAMES`, data.js:15) von 0 bis 100. Sie wachsen durch Tun. Im Charakterbogen erklärt ein Tooltip je Fertigkeit, wie sie steigt (ui.js `SKILL_TIP`, ~1213).
- **Geprüft:** Nur Code gelesen. Für jede Fertigkeit wurde jede Stelle in `game.js`, `ui.js`, `body.js` und `economy.js` gesucht, die sie liest oder erhöht.

| Fertigkeit | Wie sie steigt | Was sie bewirkt | Urteil |
|---|---|---|---|
| Einhändig, Zweihändig, Stangenwaffen | +0,12 je Treffer mit der Waffenart (`hit`, ~3769) | mehr Schaden (`damageOf`, ~122), bis 25 % schnellere Hiebe (~3381) | wirkt |
| Bogen | +0,15 je Schuss (~4396) | Schaden und Spanntempo | wirkt |
| Verteidigung | +0,05 je eingesteckter Treffer, +0,3 je Abwehr | Abwehr von vorn: höchstens 30 % Chance, Schaden auf 35 %; ab 40 mit Gegenhieb (`hit`, ~3732) | wirkt |
| Medizin | Verbinden (+0,5) | Verband heilt mehr, Aufrichten geht schneller (~599, ~3945, ~12846). Ist auch die Fertigkeit am Kessel. | wirkt |
| Zähigkeit | +0,04 je Treffer, +1 je Aufstehen | kürzere Bewusstlosigkeit, bis −50 % (~3925) | wirkt |
| Überleben | Holzfällen, Zähmen | Zähmchance (~289), früher gewarnt vor Hinterhalten (ab 25, ~2999) | wirkt |
| **Jagd** | **nirgends** | **nirgends** | **Platzhalter.** Der Tooltip sagt selbst „Noch ohne Wirkung“ (ui.js ~1221). Die Herkunft „Jäger“ gibt Jagd 6 für nichts. |
| Handwerk | Werkbank (+0,3 bis +1,8) | Güte an der Werkbank, „Mit anpacken“ (~8335) | wirkt |
| Schmieden | Esse und Ausbessern | Güte an der Esse, Grenze der Selbstwartung von Prothesen (70 + Wert/5) (~5542) | wirkt (der Verdacht „Platzhalter“ trifft nicht mehr zu) |
| Handel | +0,3 je Kauf oder Verkauf | Preise (~14302) | wirkt |
| **Schleichen** | **nirgends** (auch keine Vorlesung) | nur in drei Würfen: Pferchschlüssel stehlen (~6246), Schmuggel in die Varonsburg (~9682), verbotene Abteilung (~14032) | **Halber Platzhalter.** Wächst nie, startet bei allen auf 0. Ein Schleichmodus fehlt. Der Tooltip gibt es zu. |
| Führung | Siege mit Gefährten, Befehle | +1 Gruppenplatz je 10 Punkte, Loyalität wächst schneller (~97, ~12860) | wirkt |

- **Fehlversuche / Lücken:**
  - **Jagd:** keine Wirkung, kein Wachstum (ui.js ~1221). Die Jäger-Herkunft verschenkt 6 Punkte.
  - **Schleichen:** kann nie steigen. Die drei Würfe rechnen darum immer mit 0.
    - Repro: `RF.S.player.skills.stealth` ist bei jeder neuen Figur `undefined`.
    - Eine Suche nach `skills.stealth =` findet nur eine Selbsttest-Zeile (~21313).
  - Der Verdacht „Schmiedekunst ist ein Platzhalter“ ist **behoben**: sie wirkt an der Esse und bei der Prothesenwartung.

### Schwierigkeitsgrade

- **Was es ist:** Drei Stufen, gewählt beim Spielstart (`DIFF`, game.js ~1891). Sie verändern über `BAL` die Werte der Gegner.

  | Stufe | Gegnerleben | Gegnerschaden | Ansagezeit | Beute | Kopfgeld verfällt | Glieder gehen verloren |
  |---|---|---|---|---|---|---|
  | Angsthase | ×0,75 | ×0,7 | ×1,3 | ×1,25 | ×2 so schnell | nie |
  | Schwer (Standard) | ×1 | ×1 | ×1 | ×1 | ×1 | ab −200 |
  | Sehr schwer | ×1,25 | ×1,3 | ×0,9 | ×0,85 | ×0,6 | ab −100 |

- **Weitere Folgen:**
  - Auf Angsthase bauen sich zerstörte Dörfer wieder auf, und große Folgen klingen nach 21 Tagen ab.
  - Auf Angsthase laufen die Rote Krönung und Morvaths Heerzug nicht.
  - Auf Sehr schwer tragen Bewohner und Ziele keine Siegel und Rauten.
- **Bedienung:** Auswahl bei der Charaktererstellung. Laut altem Dokument nicht nachträglich änderbar (nicht geprüft).
- **Geprüft:** Nur Code gelesen. Der Testspielstand läuft auf `schwer`.
- **Fehlversuche / Lücken:** keine gefunden.

---

## 2. Nahkampf

### Angriff und Kombo

- **Was es ist:** Linksklick oder Leertaste schlägt zu. Jeder Hieb läuft in Phasen ab: Ausholen, Schlag, Einschlag, Nachschwung, Erholung. Schaden, Trefferstopp und Klang kommen genau im Einschlag.
- **Ablauf:**
  - Die Kombo läuft so: Schlag 1 (Vorhand), Schlag 2 (Rückhand), dann der Wuchtschlag (Überkopf). Der Wuchtschlag macht +30 % Schaden, lässt taumeln und dauert 15 % länger (`hit`, `comboFin`, ~3697).
  - Ab Einschlag plus 40 % der Erholung bricht der nächste Kombo-Schlag die Erholung ab. Der Takt bleibt dabei gleich.
  - Jede Waffe kostet Ausdauer je Hieb (`ITEMS.stam`).
  - Das Waffengefühl (`FEEL`) bestimmt Trefferstopp (28–118 ms), Kamerawackeln und Ausfallschritt.
- **Schadensformel:**
  - Spieler: `damageOf`. Gegner: `MONSTERS.dmg × (1 + Stufe × 0,06) × 1,4 × Schwierigkeit`. Bosse teilen davon nur 60 % aus (`BOSS.dmg`).
  - Kritischer Treffer: 5 % + Wahrnehmung × 0,4 % + Talente und Affixe. Er macht ×1,8 oder den Wert der Waffe.
  - Rüstung wird zu 55 % abgezogen. Bei Gegnern zählt ihr Rüstungswert ×1,6. Panzerbrechen höchstens 90 %.
  - Ein Gegner, der nach seinem schweren Angriff offen ist, nimmt +25 %.
- **Waffeneigenschaften:**
  - Hinrichtung, „gegen Ungerüstete“, Fesseln, Blutung, Frost, Totenglocke (Einschüchtern).
  - Wucht (Kriegshammer): kein Schild hält ihn, Deckung kostet doppelt.
  - Peitsche zieht heran, Sensen mähen in die Breite (siehe `hit`, ~3755–3767).
- **Bedienung:**
  - Keine Fenster nötig. Treffer zeigen Pixelziffern in der Farbe der Schadensart, Krits groß und golden. Die Einstellung liegt unter Optionen → Schadenszahlen.
  - Debug: „Kampf-Feedback …“ und der „Combat Test Room“.
- **Geprüft:**
  - Live: Treffer mit `RF.hurt` und Gegnertode.
  - Kombo und Abbruch der Erholung: nur Code gelesen. Der Selbsttest hat dafür eigene Proben („Kampfanimation Scheibe 1“).
- **Fehlversuche / Lücken:**
  - Laut OFFEN.md noch offen: Der Dolch macht gegen Banditen +17 % Schaden je Sekunde, weil sein Ausholen nur 60 ms dauert.

### Schwerer Hieb per Halten

- **Was es ist:** Aus der Ruhe die linke Maustaste halten.
  - Ab 0,18 s hebt die Figur die Waffe, und ein Ring am Boden füllt sich.
  - Nach 0,8 s ist der Hieb voll geladen: +30 % Schaden, Taumeln, **nicht blockbar**.
- **Ablauf:**
  - Früher loslassen gibt einen normalen Schlag.
  - Rolle, Deckung oder Waffenwechsel brechen das Laden ab.
  - Technisch setzt der Hieb `UNBLOCK` (`resolveSwing`, ~3431).
- **Bedienung:** Das Log erklärt es beim ersten Laden. Debug im Test Room.
- **Geprüft:** Nur Code gelesen. Probe „Kampfanimation: schwerer Hieb“ im Selbsttest.
- **Fehlversuche / Lücken:**
  - OFFEN.md [E]: Eigener Schadensfaktor, Ladezeit je Waffe, Ausdauerkosten und Laden für Koop-Gäste sind noch nicht entschieden.

### Kampfstil nach Waffenseltenheit (Animations-Packs)

- **Was es ist:** Wie wuchtig die Hiebe aussehen, hängt von der Seltenheit der Waffe ab. Das ist reine Optik, Schaden und Takt bleiben gleich (MECHANIKEN 03.10.).
  - Gewöhnlich und ungewöhnlich: Pack A „Grounded“.
  - Selten und episch: Pack B „Heroic“, Trefferstopp ×1,4.
  - Legendär und mythisch: Pack C „Endgame“ mit Nachbildern und Druckwelle, Trefferstopp ×1,8.
  - Gegner zeigen immer Pack A.
- **Bedienung:** Im Debug-Test-Room lässt sich jedes Pack erzwingen.
- **Geprüft:** Nur Code gelesen (`atkPackFx`, `atkImpact`, ~3784).
- **Fehlversuche / Lücken:**
  - OFFEN.md [E]: Ausrollen auf Axt, Kolben, Stange, Doppelklingen, Sense, Bogen, Armbrust, Stab, Magie und Bosswaffen steht noch aus.
  - Diese Waffen haben noch keine eigenen Bewegungsprofile.

### Deckung, Parade, Schild, Nahkampfabwehr

- **Was es ist:** Mit gehaltener Umschalttaste geht man in Deckung.
- **Ablauf** (`guarded`, ~16501; `GUARD = { parry:180, arc:1.22 }`):
  - **Parade:** Hebt man die Deckung in den letzten 180 ms vor einem Nahkampftreffer, gibt es keinen Schaden. Der Angreifer taumelt 900 ms (Boss 450 ms). Danach ist 1,2 s lang eine Riposte mit dem Rapier möglich (×2,2). Es gibt eine Parade je gehobener Deckung.
  - **Block in Deckung:** kostet Ausdauer = Schaden × 0,8 mit Schild, × 1,2 ohne. Reicht die Ausdauer nicht, bricht die Deckung: 0,5 s Taumeln, und der Hieb trifft voll.
  - **Passiver Schildblock** ohne Deckung: Chance = Blockwert × 0,7 + Setbonus.
  - **Schildarten:**

    | Schild | Wirkung |
    |---|---|
    | Buckler | Parade-Fenster +60 % |
    | Turmschild | kaum Parade |
    | Stachelschild | 35 % des Hiebs gehen zurück |
    | Magitech-Schild | Energiefeld, 6 Energie je Block |

  - **Nahkampfabwehr** (Fertigkeit Verteidigung) ohne Deckung: siehe Tabelle der Fertigkeiten.
  - Flächenangriffe und schwere Angriffe umgehen all das (`AREA`, `UNBLOCK`).
- **Bedienung:** Zeichen statt Text: Schild = Block, gekreuzte Klingen = Parade.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** keine gefunden.

### Ausweichen (Rolle)

- **Was es ist:** Taste Q. Ein Sprung von 92 px in 240 ms, unverwundbar. Kostet 20 Ausdauer, Abklingzeit 850 ms (`DODGE`, ~16660).
- **Ablauf:**
  - Der Mönch-Titel macht die Rolle 25 % billiger.
  - Jedes Ausweichen ins Leere gibt dem Mönch Fokus.
  - Die Mönchsrobe (Klassenrüstung) weicht von selbst aus: 20 % bei 2 Teilen, 30 % bei 3.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** keine.

### Schleichangriff, Rückenstich, Wahrnehmung

- **Was es ist:**
  - Ein Angriff auf einen ahnungslosen Gegner (Team noch „neutral“) macht ×1,5, von hinten ×3 („Hinterhalt!“).
  - Ein Treffer gegen die Kette löst Alarm aus: Kette −10, Kettenalarm 2 Tage (`hit`, ~3704, ~3717).
  - Rückenstich: Dolch, Hakenmesser und Rapier kritten von hinten mit 50 %.
- **Wahrnehmung:**
  - Beim Helden erhöht sie die Kritchance.
  - Bei Gegnern bestimmt die Sichtweite (`MONSTERS.sight`, 140–420 px), wann sie angreifen.
  - Wetter verändert den Gegnerblick: Nebel −40 %, Sandsturm −30 %, Blutregen +25 %.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:**
  - Es gibt **keinen Schleichmodus**. Ob man unentdeckt ist, entscheidet nur Abstand und Sicht.
  - Die Fertigkeit Schleichen spielt dabei keine Rolle (siehe oben).

---

## 3. Fernkampf

- **Was es ist:** Bogen, Armbrust (spannen, Tempo 60 %), Zauberstab, Wurfmesser, Wurfbeil, Schleuder, Messingpistole, Donnerbüchse, Schockpistole und Magiegewehr.
- **Ablauf:**
  - Schüsse brauchen freie Sicht (`clearLine`). Pfeile prallen an Wänden ab und fliegen über Liegende hinweg.
  - Geschosse sind blockbar.
  - Der „Nahschuss“ trifft auch direkt vor dem Schützen.
  - Regen senkt den Fernkampf um 10 %, Sandsturm um 30 %.
- **Gegnerische Schützen** halten Abstand (`archerAI`): Banditenschütze, Kettenschütze, Harpunier, Netzwerferin, Knochenschütze, Kultist, Nekromant, Blutmagier, Lichtschütze, Ophan, Student.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** keine neuen.

---

## 4. Schwere Angriffe der Gegner mit Ansage

- **Was es ist:**
  - Manche Gegner holen lange aus. Eine rote Bodenmarke zeigt Kreis, Ring oder Linie und füllt sich bis zum Einschlag.
  - Die Angriffe sind **nicht blockbar**. Nur Rolle, Hinausgehen oder der Gegenstrom des Mönchs helfen.
  - Danach ist der Gegner 0,6 s offen (+25 % Schaden).
- **Gegner mit schwerem Angriff** (`MONSTERS.heavy`; Ansage × Schwierigkeitsfaktor `tele`):

  | Gegner | Art | Jeder n-te Angriff | Ansage (ms) | Schaden | Radius/Länge (px) |
  |---|---|---|---|---|---|
  | Kettenknecht | slam (Kreis) | 3. | 800 | ×2,2 | 70 |
  | Rotgardist | thrust (Linie) | 3. | 700 | ×2,0 | 130 |
  | Plünderer der Sturmklinge | thrust | 4. | 650 | ×1,7 | 110 |
  | Hauptmann der Toten | slam | 3. | 750 | ×1,9 | 75 |
  | Knochenritter | sweep (Bogen) | 3. | 750 | ×1,8 | 80 |
  | Todesritter | sweep | 3. | 800 | ×2,0 | 90 |
  | Dodon | slam | 2. | 900 | ×2,4 | 95 |
  | Bomben-Skelett | blast (Selbstzündung, trifft alle) | 1. | 900 | ×1,6 | 72 |
  | Großes Skelett | slam, wirft 22 px zurück | 2. | 800 | ×1,8 | 85 |
  | Dampframme | charge (Rammstoß, zerbricht Fässer und Kisten) | 1. | 1200 | ×1,4 | 180 |

- **Weitere Ansagen mit eigener Regel:** Gorak (`bossAI`), Hrodvar (Eiskreis, Eislanze), Garmadon, Omega (Sternenfall, Strahl, Nova), Aldhelm (Blutsiegel). Siehe §23.
- **Bedienung:** Rote Bodenmarke, Warnzeichen über dem Kopf. Debug: „Kampf-Feedback: schwerer Angriff jetzt“.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:**
  - MECHANIKEN §2 sagt noch „**Sieben** Gegnerarten“. Es sind inzwischen **zehn**. Nur das Dokument ist veraltet.

---

## 5. Zustände (Status)

- **Was es ist:** Effekte auf Figuren (`addStatus`). Sie zeigen sich als Zeichen am Lebensbalken und am Körper (Flammen, grüne Bläschen, Eisrand, Funken). Das Fenster X „Aktive Effekte“ listet sie.
- **Negativ:**

  | Zustand | Auslöser | Wirkung |
  |---|---|---|
  | Blutend | Treffer > 10 mit 25 % Chance (12 s), Abtrennen (30 s) | Schaden über Zeit |
  | Vergiftet | Seuchenleiche (50 % je Biss), Giftöl | Schaden über Zeit |
  | Gefesselt/Durchfroren (`chilled`) | Kettenpeitsche, Frostwaffen, Unterkühlung | −40 % Tempo |
  | Gepackt | Wiedergänger | −50 % Tempo |
  | Brennt | Feuerzauber, Elite „Brand“ | Schaden über Zeit |
  | Frost | stapelt sich bis 3 | −15 % Tempo je Stufe, bei 3 Stufen 1,5 s eingefroren |
  | Schock | Blitz | kurze Betäubung, danach 3 s immun |
  | Sonnenbrand | Vampir bei Tag | 1,2 Schaden/s, −20 % Schaden |
  | Fleckfieber | Seuche | Leben −5 am Tag, halbe Ausdauer |

- **Positiv:** Ausgeruht (+10 % EP), Raserei, Kriegslied, Segen, Omegas Zorn, Giftöl, Knochenschild, Regeneration, Elixier (immer nur eines, danach 30 s Magenpause), Gegenstrom.
- **Heilung von Zuständen:** Schlaf heilt Blutung, Gift, Unterkühlung und Griff (`SLEEP_CURES`).
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** keine neuen.

---

## 6. Körperzonen, Glieder, Bewusstlosigkeit, Verletzungen

- **Was es ist:** Der Held und alle menschenähnlichen Figuren haben sechs Körperteile (`body.js`).
  - Kopf 25 % und Rumpf 45 % der Grundlebenspunkte.
  - Arme und Beine haben je 100 Punkte × Körperbau.
  - Trefferwahrscheinlichkeit: Kopf 6, Rumpf 46, jedes Glied 12. Die Seite, von der man getroffen wird, zählt mehr. Abgetrennte Glieder fangen keine Treffer mehr.
- **Ablauf** (`damagePart`, body.js:73):
  - Ein Gliedtreffer gibt 40 % ab, davon die Hälfte an den Rumpf.
  - Bei 0 fällt das Glied aus. Ein Arm aus: die Waffe fällt. Ein Bein aus: Humpeln. Beide Beine aus: Kriechen.
  - Abgetrennt wird erst unter −200 (Sehr schwer: −100, Angsthase: nie).
  - Kopftreffer ohne Krit sind auf 60 % des Kopf-Maximums gedeckelt.
  - Kopf auf 0 heißt bewusstlos. Enthauptet wird nur bei einem Krit mit 50 % Überschuss.
  - **Rumpf ≤ 0 heißt „am Boden“.** Bei Gegnern ist das in der Regel der Tod.
- **Am Boden** (`downed`, ~3925):
  - Zeit bis zum Verbluten: Held 15 s allein, 30 s mit Gruppe. NPCs 11 s. Zähigkeit verkürzt die Ohnmacht.
  - Nur der Held kommt von allein zu sich. Andere brauchen jemanden, der sie aufrichtet.
  - Wachen, die selbst angegriffen werden, heben niemanden auf.
- **Verletzungen über Tage:**
  - Bruch (60 %): Das Glied heilt höchstens bis 40 %, 4 Tage lang. Schienen verdoppeln das Tempo.
  - Entzündung: 25 % (abgetrennt 60 %).
  - Narben: +1 Rüstung je Narbe, höchstens 5.
- **Bedienung:** Körperdiagramm im Charakterbogen (`bodyChart`, Wundliste) und Debug „Verletzung: …“.
- **Geprüft:** Live.
  - Bei einem Übungsfechter mit 94 Punkten (Kopf 30, Rumpf 64) sank der Rumpf mit jedem 8er-Treffer.
  - Bei Rumpf 0 starb der Fechter, obwohl Kopf und Glieder noch voll waren (siehe §8 und §13).
- **Fehlversuche / Lücken:**
  - Behoben laut Hunt-Bericht: HB-14, -15, -16, -17, -21, -22.
  - Neu: Die Lebensanzeige berücksichtigt das Ende „Rumpf auf 0“ nicht. Siehe §8.

---

## 7. Heilung

- **Was es ist:** Mehrere Wege, um Leben zurückzubekommen.

  | Weg | Wirkung |
  |---|---|
  | Heiltrank „Trank der Genesung“ | 40 Leben, stapelt 5, 55 Gold |
  | Verband | heilt ein Körperteil, stillt Blutung; Anlegen 2,5 s |
  | Heilkraut | 10, wie ein Verband |
  | Brot / Dörrfleisch | 6 / 10, dazu Nahrung |

  Dazu kommen Heilzauber (§11), Heiliges Heilen (Kleriker), Feldverband (Talent), Stilles Wasser (Mönch), Erdsegen (Druide), Lebensraub (Waffen, Affix Blutzoll, Grabhieb), Schlaf, Heilerin, Medica und Feldscher („Wunden versorgen“ 25 Gold, schient Brüche).
- **Grenzen:**
  - Medizin heilt keine Prothesen (HB-16 behoben).
  - Am Boden heilt sich niemand selbst (HB-22 behoben).
  - Für Vampire wirken Tränke, Verbände und Heilzauber nur halb.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** keine neuen.

---

## 8. Lebensbalken

- **Was es ist:** Vier Anzeigen.
  - **HUD-Balken** des Helden (ui.js:129).
  - **Gruppenleiste** (ui.js:153).
  - **Zielbalken** über einem gewählten Gegner (Rechtsklick) oder, ohne Auswahl, 5 s lang über dem zuletzt getroffenen (render.js `barTarget`/`drawTargetBar`, ~3338).
  - **Bossleiste** unten in der Mitte, sobald ein Boss näher als 520 px ist (render.js `drawBossBar`, 264). Sie trägt eine Marke bei 50 % für den Phasenwechsel.
- **Ablauf:** Alle vier zeigen `hp / maxHp`.
- **Geprüft:** Live mit einem Übungsfechter, dazu Code gelesen.
  - Der Fechter fiel bei `hp = 29–31` von `maxHp = 94` tot um. Der Balken stand in diesem Moment noch bei **31–33 %**.
- **Fehlversuche / Lücken:**
  - **[Hoch] Der Balken erreicht bei menschenähnlichen Figuren nie 0, wenn sie fallen.**
    - Für Figuren mit Körper rechnet `B.syncHp` (body.js:43–47) `hp` = Kopf + Rumpf.
    - Der Tod oder das „am Boden“ hängt aber nur am Rumpf (`vital`, body.js:49). Ist der Kopf unverletzt, bleiben rund **36 %** stehen (Kopf 25 ÷ (25 + 45)).
    - Betroffen sind alle vier Anzeigen: Ziel, Boss (Varg, Aldhelm, Garmadon, Hrodvar, Weißbart, Gorak sind menschenähnlich), HUD und Gruppe. Der Held geht bei gut einem Drittel Balken zu Boden.
    - Die 50-%-Phasenmarke der Bossleiste passt deshalb nicht zum echten Rest.
    - Repro: Debug „Gegner … vor dir“ (z. B. Bandit), mit Rechtsklick wählen, mit kleinen Hieben auf den Körper schlagen. Er fällt, während der Balken noch ein Drittel zeigt.
    - Für Tiere, Dodon und Omega ohne Körper stimmt der Balken.
  - OFFEN.md [E]: Die 5 s für „zuletzt getroffener Gegner“ sind vom Lead gesetzt, aber noch nicht bestätigt.

---

## 9. Tod, Heldentod, Erbe, Ahnenfeind

- **Was es ist:** Stirbt der Held, endet nicht das Spiel, sondern eine Generation. Das Haus lebt weiter.
- **Ablauf:**
  - **Heldentod-Moment:**
    - 3 s Zeitlupe, die Kamera rückt heran, eine Totenglocke schlägt, Name und Haus stehen im Bild.
    - Der Mörder zeigt auf den Toten. In diesen Sekunden stirbt niemand aus der Gruppe.
    - Esc oder Leertaste überspringen. Der Tod ist schon gespeichert.
  - **Erbenwahl** (`playerDeath` → `chooseSuccessor`):
    - Zuerst eigene erwachsene Kinder, dann der Ehepartner, dann Gefährten. Entfernte Verwandte nur bei freiem Platz, höchstens 3 Erben.
    - Der Erbe bekommt 70 % des Golds, 50 % jedes Rufs und den halben Ruf der Klinge.
    - Er hat sofort Talentpunkte nach seiner Stufe, aber keine gelernten Sterne und keine Prüfungen.
    - Ohne Erben erlischt das Haus.
  - **Grab:** Die Ausrüstung liegt im Ahnengrab. Dort gibt es Epitaph, Epilog und „Zwanzig Jahre später“.
  - **Bindungen (HB-20, 03.10.):** Der Ehepartner bleibt als Witwer im Haus, ist aber mit dem Erben nicht verheiratet. Gefangene kommen frei.
  - **Ahnenfeind (T10):**
    - Wer den Helden tötet (kein Boss, keine Wache), bekommt einen Namen und die Hauptwaffe samt Geschichte. Er wird bis zu 3 Stufen stärker als der Erbe. Höchstens 3 Ahnenfeinde gleichzeitig.
    - Er zieht durch Bandenlager. Frühestens nach 10 Tagen, dann alle 10–20 Tage, greift er die Stadt der Familie an. Dort brennen Häuser, und mit 30 % wird ein Kind entführt.
    - Der Erbe bekommt einen Steckbrief.
    - Tötet man ihn, liegt die Ahnenwaffe da. Dazu der Titel „Rächer des Hauses“ und Ruhm +10.
  - Stirbt man während des Goblin-Sturms, fällt Morrgrund.
- **Gegner:** der Ahnenfeind (Art des Mörders) mit zwei Gefolgsleuten.
- **Bedienung:** Todesbildschirm, Erbenwahl als Pergamentkarten. Debug „Ahnenfeind und Heldentod (T10)“.
- **Geprüft:** Nur Code gelesen. Sterben ist nur in Wegwerf-Slots erlaubt, und es gab keinen Bedarf: Der Selbsttest hat die Proben „T10 …“.
- **Fehlversuche / Lücken:**
  - HB-01 (gespeicherter Tod ohne Erbenwahl) ist laut OFFEN.md behoben.
  - Offener Fit-Befund: Der Erbe übernimmt uneinheitlich (IHF-05). „Zwanzig Jahre später“ lässt die Welt stehen (IHF-06).

---

## 10. Gefangennahme

- **Was es ist:** Zwei Richtungen.
  - **Gefangene nehmen (T08):** Ein Mensch ergibt sich („Gnade!“) oder liegt bewusstlos. Dann E → „Gefangenen nehmen“. Wahl zwischen:
    - Verhören (ruhig oder hart)
    - Fesseln (braucht einen Strick, 6 Gold)
    - Anwerben (Loyalität 20)
    - Ausrauben
    - Laufen lassen
    - Hinrichten
  - **Abliefern** bei Wachen: 8 Gold + 2 je Stufe, Fraktion +1. Steckbriefe zahlen lebend ×1,5.
  - Jede Wahl verschiebt den **Ruf der Klinge** (−100 bis +100 je Region). Er bestimmt, wie oft sich Feinde ergeben und wie viel Schutzgeld Banden verlangen.
  - **Selbst gefangen werden:** Die Wache stellt dich: zahlen, mitkommen oder wehren. Im Kerker: Kaution, Schloss knacken (Dietrich-Minispiel) oder absitzen. Dazu Schuldknechtschaft bei Kette und Aurelion (halbes Tempo, keine Waffe, ein Wächter folgt dir, sechs Wege hinaus). Das gehört zum Bereich Verbrechen und wird dort ausführlich beschrieben.
- **Bedienung:** Dialogliste, kein eigenes Fenster. Debug „Gefangene und Klinge (T08)“.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** OFFEN.md nennt „Schuldknechtschaft“ noch als reine Dialogliste ohne Fenster.

---

## 11. Magie

### Schulen, Wirken, Übung

- **Was es ist:**
  - Magie ist ein Weltsystem, keine Klasse. Wer einen Zauber lernt, hat Mana: 30 + Intelligenz × 4 + Willenskraft × 2 + Stufe × 2.
  - Acht Schulen: Feuer, Frost, Blitz, Arkan, Schatten, Glaube, Heilung, Schutz.
  - **31 Zauber** (`sp_*`). MECHANIKEN §3 sagt noch „22 Zauber in 6 Schulen“; das ist veraltet.
- **Ablauf:**
  - Die Sammelzeit beträgt 150–900 ms, sichtbar an einer Rune in der Schulfarbe. Ein Treffer bricht ab, die Hälfte des Manas kommt zurück.
  - Rang II nach 25 Einsätzen, Rang III nach 100. Stärke ×1 / ×1,25 / ×1,5.
  - Glaubenszauber wachsen mit Kettenrang und Glauben. Heilige Zauber treffen Untote ×2,1.
  - Verbotene Magie (Schatten und Blut) vor Zeugen einer Macht, die sie hasst, bringt Kopfgeld: 60 Gold, beim Orden 120. Ab der dritten Tat jagen Magierjäger mit Bann: Zauber bricht ab, Mana halbiert, 5 s Stille.
- **Lehrpreis und Bedingungen:**
  - Preis 30 / 80 / 180 Gold je Stufe, Ruf und Haltung der Macht senken ihn.
  - Intelligenz 8 / 11 / 14.
  - Beziehung 10 zum Lehrer (außer Akademie, Ilvar, Irmgard).
  - Dazu eine Regel je Lehrer (`SPELL_RULES`).
- **Bedienung:**
  - Zauberbuch (Z) mit Reitern je Schule und „Auf Leiste legen“.
  - Lehrer über „Kannst du mir Magie beibringen?“. Das ist eine **Dialogliste**, kein Fenster (OFFEN.md [B]).
  - Kodex (H) → „Magie“ zeigt bekannte Lehrer.
- **Geprüft:** Live. Für jeden der 31 Zauber wurde ermittelt, welche lebende Figur ihn lehrt (`spellsTaught` in `S.ents`). Bei Aldis, Corvinus, Serafine, Elena und Morvath wurde das Lehrmenü geöffnet.

### Alle Zauber mit Lehrer

| Zauber | Schule | Stufe | Mana / Abklingzeit | Form | Lehrer (live gefunden) | Bedingung |
|---|---|---|---|---|---|---|
| Funke | Feuer | 1 | 6 / 1,4 s | Geschoss | Morvath, Serafine, Ilvar | Bez. 10 |
| Feuerpfeil | Feuer | 1 | 10 / 2,5 s | Geschoss, Brand 35 % | Morvath, Serafine | Bez. 10 |
| Flammenstoß | Feuer | 2 | 16 / 5 s | Strahl | Morvath, Corvinus | Bez. 10 bzw. Schein |
| Flammenkreis | Feuer | 3 | 28 / 12 s | Ring | Corvinus | Bürger oder Adept |
| Feuerwand | Feuer | 3 | 26 / 15 s | Wand | Corvinus | Bürger oder Adept |
| Froststoß | Frost | 1 | 9 / 2,2 s | Geschoss, Frost | Corvinus | Schein |
| Eisspeer | Frost | 2 | 16 / 4,5 s | durchdringt | Corvinus | Schein |
| Einfrieren | Frost | 3 | 26 / 14 s | Fläche, 3 Frost | Corvinus | Bürger oder Adept |
| Eiswand | Frost | 3 | 24 / 16 s | feste Wand 8 s | Corvinus | Bürger oder Adept |
| **Schock** | Blitz | 1 | 8 / 2,4 s | Geschoss, Schock | **Corvinus** | Schein |
| Blitz | Blitz | 2 | 16 / 4,5 s | Strahl | Corvinus | Schein |
| Kettenblitz | Blitz | 3 | 24 / 9 s | 3 Sprünge | Corvinus | Bürger oder Adept |
| Energiegeschoss | Arkan | 1 | 7 / 1,6 s | Geschoss | Serafine, Corvinus, Ilvar | – |
| Magieschild | Arkan | 2 | 18 / 15 s | Schild | Corvinus, Ilvar | – |
| Kurzteleport | Arkan | 3 | 20 / 8 s | Sprung 180 px | Corvinus | Bürger oder Adept |
| Magieunterbrechung | Arkan | 2 | 14 / 10 s | bricht Zauber und schwere Angriffe | Corvinus, Ilvar | – |
| Schattenpfeil | Schatten | 1 | 9 / 2,2 s | Geschoss | Ilvar | Vertrauen 0 |
| Seelenzug | Schatten | 2 | 16 / 6 s | 50 % Lebensraub | Ilvar | Vertrauen 25 |
| Skelett erheben | Schatten | 3 | 22 / 12 s | 1 Diener, 45 s | Ilvar | Vertrauen 50 |
| Seelenbersten | Schatten | 3 | 28 / 14 s | Ring | Ilvar | Vertrauen 75 |
| Nachtglas (legendär) | Schatten | 3 | 40 / 60 s | Zeit 6 s auf 30 % | nur Ilvars Endprüfung | Vertrauen 100 + Prüfung |
| Heilige Flamme | Glaube | 1 | 10 / 2,6 s | Geschoss, heilig | Irmgard (Eisenfeste) | Kettenrang oder Glaube 20 |
| Schutzsegen | Glaube | 1 | 10 / 9 s | Schild | Irmgard | wie oben |
| Lichtstrahl | Glaube | 2 | 16 / 5 s | Strahl, heilig | Irmgard | Kettenrang 1 oder Glaube 40 |
| Inquisition | Glaube | 3 | 24 / 14 s | Fläche, deckt Verborgene auf | Irmgard | Kettenrang 2 oder Glaube 60 |
| Kleine Heilung | Heilung | 1 | 10 / 4 s | Selbst | Elena, Mutter Aldis | Bez. 10 / Orden Novize |
| **Blutung stillen** | Heilung | 2 | 12 / 6 s | Selbst | **Mutter Aldis** (Sonnwacht), gerettete Hexe (§5c) | Orden Rang Akolyth |
| **Regeneration** | Heilung | 2 | 18 / 16 s | Gruppe, 10 s | **Mutter Aldis**, gerettete Hexe | Orden Rang Akolyth |
| Starke Heilung | Heilung | 3 | 26 / 9 s | Selbst | Mutter Aldis | Orden Rang Wächter |
| Schild | Schutz | 1 | 9 / 9 s | Selbst | Serafine, Mutter Aldis | – |
| Schutzkreis | Schutz | 3 | 24 / 18 s | Gruppe | Mutter Aldis, Corvinus | Orden Wächter bzw. Bürger/Adept |

- **Gegner-Zauberer:**
  - Kultist der Asche: Feuerpfeil, Funke; heilt Untote.
  - Nekromant: Froststoß, Schild; ruft bis zu 3 Knochendiener.
  - Student: Funke, Froststoß.
  - Blutmagier: Schattengeschoss, das ihn heilt.
- **Fehlversuche / Lücken:**
  - **Behoben:** Der Verdacht „`sp_regen`, `sp_shock`, `sp_staunch` haben keinen erreichbaren Lehrer“ (vollstaendigkeit.md H7, OFFEN.md) stimmt nicht mehr.
    - Live gesehen: Mutter Aldis (Sonnwacht, 934/417) bietet „Blutung stillen — Stufe 2“ und „Regeneration — Stufe 2“ an.
    - Magister Corvinus (Akademie Aurelheim) bietet „Schock — Stufe 1, 26 Gold“ ohne fehlende Bedingung an.
    - Die Lehrtexte in data.js passen inzwischen dazu. Offen bleibt nur: Für Stufe 2 bei Aldis braucht man den Ordensrang Akolyth. Ob dieser Rang gut erreichbar ist, gehört zum Bereich Fraktionen (nicht geprüft).
  - **[Niedrig]** Der Lehrtext von Funke, Feuerpfeil und Energiegeschoss nennt noch einen „Wandermagier in Kreuzweg“. Gemeint ist Serafine. Der Text im Zauberbuch ist dadurch ungenau (data.js:741–753).
  - **[Niedrig]** Schutzkreis kostet bei Corvinus 180 Gold, bei Aldis 153 Gold. Das ist so gewollt: Liebe der Macht und Ruf senken den Preis. Nur zur Kenntnis.

---

## 12. Fähigkeiten (ABILITIES)

- **Was es ist:** 79 aktive Fähigkeiten, davon 31 Zauber.
  - Kosten: Ausdauer, Mana, Heilkraut oder Titelressource.
  - Fähigkeiten der Klasse liegen auf der Leiste (`syncHotbar`, Tasten 1–0).
  - Fähigkeitssterne ändern Schaden, Abklingzeit, Kosten und Dauer (`abMod`).
- **Geprüft:** Nur Code gelesen. Live nur Wuchtschlag: Er kommt nach der Kriegeraufnahme auf die Leiste.

**Klassenfähigkeiten**

| Fähigkeit | Klasse(n) | Kosten | Abklingzeit | Wirkung |
|---|---|---|---|---|
| Wuchtschlag | Krieger, Ritter, Berserker, Todesritter | 22 Ausdauer | 6 s | doppelter Waffenschaden, kurze Betäubung |
| Gezielter Schuss | Schütze, Waldläufer, Kettenjäger | 18 A | 7 s | weiter Schuss, hoher Krit |
| Meuchelstich | Schurke, Assassine, Folterknecht | 20 A | 8 s | ×3 von hinten |
| Heiliges Heilen | Kleriker, Paladin | 18 Mana | 9 s | heilt dich oder den nächsten Gefährten |
| Feuerball | Magier | 16 M | 5 s | Flächenfeuer |
| Segen | Ritter, Paladin | 20 A (seit 03.10.) | 20 s | Rüstung der Gruppe für 20 s |
| Heiliger Schlag | Paladin | 14 M | 7 s | schwer gegen Untote |
| Ziel markieren | Waldläufer | 10 A | 12 s | Ziel nimmt +25 % |
| Raserei | Berserker | 15 A | 18 s | 8 s Schaden +35 %, Tempo +15 %, nimmt +20 % |
| Schattenschritt | Assassine | 18 A | 10 s | hinter das Ziel; nächster Hieb ×2,5; nicht in Kette oder Platte |
| Kriegslied | Barde, Kettenbarde | 12 A | 22 s | 12 s Gruppe +15 % Schaden |
| Missklang | Barde | 14 A | 14 s | Gegner taumeln und verfehlen 3 s |
| Feuerflasche | Alchemist | 2 Kraut | 6 s | Feuer am Zielort |
| Giftöl | Alchemist | 1 Kraut | 20 s | Treffer vergiften |
| Trank brauen | Alchemist | 3 Kraut | 30 s | ein Heiltrank |
| Lebensentzug | Todesritter | 20 M | 11 s | Schaden, der heilt |
| Grabhieb | Todesritter | 20 A | 9 s | ×1,8, 30 % Lebensraub |
| Todesmahr | Eidwacht-Rüstung (2 Teile) | 18 A | 9 s | Stoß, ⅓ heilt |
| Kettenschlag, Furcht-Aura, Befehl der Kette, Blutpreis | Dunkler Hochpaladin | 10–18 A | 8–30 s | heranziehen, Furcht, Wachen folgen, Blut heilt |
| Brandmal Omegas, Kettengebet, Opferblut | Dunkler Priester | 14/20 M bzw. Leben | 9–20 s | Brandmal +25 %, Gruppenheilung, Leben → Mana |
| Fangnetz, Kettenhund | Kettenjäger | 16/12 A | 10/40 s | 3 s festhalten, ein Hund 30 s |
| Wille brechen, Henkersstreich | Folterknecht | 14/22 A | 14/12 s | Einschüchtern; ×3 gegen Geschwächte |
| Marschtrommel, Klagelied der Kette | Kettenbarde | 12/14 A | 25/16 s | Tempo; Gegner langsamer und eingeschüchtert |
| Schattenblitz | (keine Klasse) | 14 M | 4 s | Schattengeschoss. Steht in der Tabelle, ist aber keiner Klasse und keinem Titel zugeordnet (Altlast). |

**Talentfähigkeiten:** Kampfschrei (Kampf-Zweig), Blinzeln (Magie), Feldverband (Überleben), Todesgriff (Todesritter-Sternbild).

**Titelfähigkeiten:** siehe §14 und §19.

- **Fehlversuche / Lücken:**
  - **[Niedrig]** `shadow_bolt` (data.js:674) ist eine verwaiste Fähigkeit: keine Klasse, kein Titel, kein Stern.

---

## 13. Klassen, Lehrer und Klassenprüfungen

- **Was es ist:** Klassen gibt es nie im Menü. Man lernt sie bei einem Lehrer in der Welt.
- **Ablauf (seit 02.10.):**
  1. **Vertrauen:**
     - „Kannst du mich ausbilden?“ verlangt Beziehung 20 (Rook 40).
     - Fehlt sie, nennt der Lehrer eine Bewährung (z. B. Krieger: 5 Eisen) oder Lehrgeld (40 + 15 × Stufe) (`teacherTrial`).
  2. **Prüfung:**
     - 1–2 Aufträge (`QUESTS kt_*`). Meist einer draußen und eine Meisterprüfung beim Lehrer, die mit „Ich bin bereit.“ beginnt (`startClsTrial`).
     - Jeder Lehrer derselben Klasse nimmt ab. Scheitern darf man beliebig oft, und niemand soll sterben.
  3. **Aufnahme** (`classPassed`): Klasse, +1 Talentpunkt, Aufnahmeszene (`classRite`), Hinweis auf das neue Sternbild.
  - Eigene Wege ohne Prüfung (`OWN_PATH`): Paladin (Kelans drei Aufträge), Todesritter (Todesweihe ab Totenrang 3), Dunkler Hochpaladin (Ritus der Kette) und die vier dunklen Kettenklassen (Kettenrang). Ihre Freischaltung zählt als bestandene Prüfung (+1 Talentpunkt).
- **Klassen** (`CLASSES`, data.js:627):

  | Klasse | Stufe | Vorstufe | Fähigkeiten | Schwäche | Lehrer (live gefunden) |
  |---|---|---|---|---|---|
  | Krieger | 1 | Wanderer | Wuchtschlag | – | Borin der Jüngere (Eren), Hauke Eisenfaust (Nordfurt), Kaelis Vey (Aurelheim) |
  | Schütze | 1 | Wanderer | Gezielter Schuss | – | Tomas (Eren), Wenzel (Weidenau) |
  | Schurke | 1 | Wanderer | Meuchelstich | – | Rook, Kaelis Vey, Nix (Salzhafen) |
  | Kleriker | 1 | Wanderer | Heiliges Heilen | – | Elena (Eren), Schwester Adela (Lichtenrain) |
  | Magier | 1 | Wanderer | Feuerball | – | Morvath, Serafine (Kreuzweg) |
  | Barde | 1 | Wanderer | Kriegslied, Missklang | eigener Schaden −15 % | Lioba (Kreuzweg), Jasper Goldkehle (Kupferhafen) |
  | Alchemist | 1 | Wanderer | Feuerflasche, Giftöl, Trank brauen | braucht Heilkraut | Quirin (Salzhafen), Orrin (Mühlbach) |
  | Ritter | 2 | Krieger | Wuchtschlag, Segen | – | Kelan, Hauke |
  | Waldläufer | 2 | Schütze | Gezielter Schuss, Ziel markieren | – | Tomas, Wenzel |
  | Berserker | 2 | Krieger | Wuchtschlag, Raserei | +20 % Schaden genommen in Raserei | Oda (Grenzwacht), Ulfar der Narbige (Rastfurt) |
  | Assassine | 2 | Schurke | Meuchelstich, Schattenschritt | nicht in Kette oder Platte | Rook |
  | Dunkler Priester | 2 | Kleriker oder Magier, Kettenrang 1 | Brandmal, Kettengebet, Opferblut | gefürchtet | Vater Ansgar (Eisenfeste) |
  | Kettenjäger | 2 | Schütze, Kettenrang 2 | Gezielter Schuss, Fangnetz, Kettenhund | gefürchtet | Rulf Hundeführer |
  | Folterknecht | 2 | Schurke, Kettenrang 1 | Meuchelstich, Wille brechen, Henkersstreich | gefürchtet | Meister Mordek |
  | Kettenbarde | 2 | Barde, Kettenrang 0 | Kriegslied, Marschtrommel, Klagelied | gefürchtet, −15 % | Sibylla Eisentrommel |
  | Paladin | 3 | Ritter + `q_paladin3` | Heiliger Schlag, Segen, Heiliges Heilen | Orden | Kelan |
  | Todesritter | 3 | Krieger, Totenrang 3 | Lebensentzug, Wuchtschlag, Grabhieb | Tote | Sael, Ysra (Todesweihe) |
  | Dunkler Hochpaladin | 3 | Krieger, Kettenrang Aufseher | Kettenschlag, Furcht-Aura, Befehl, Blutpreis | freie Dörfer fürchten ihn | Varg / Ritus |

- **Prüfungen** (QUESTS `kt_*`, live ausgelesen):

  | Klasse | Schritt 1 (draußen) | Schritt 2 (beim Lehrer) | EP | Erreichbar? |
  |---|---|---|---|---|
  | Krieger | 4 Banditen besiegen | „Der Kreis“: Duell gegen den Übungsfechter, bis einer unter 20 % fällt | 80 + 110 | **ja, aber Duell oft unverdient verloren** (siehe unten) |
  | Ritter | – | Platz 50 s gegen Räuberwellen halten; Duell mit Schild | 80 + 110 | ja; Duell mit demselben Fehler |
  | Berserker | 5 Feinde besiegen | Grubenkampf: gewinnen, während man selbst unter 30 % Leben ist (Gegner mit doppeltem Leben, Schaden ×1,6) | 80 + 110 | ja; gleiche Ursache möglich (Code) |
  | Schütze | 3 Wölfe erlegen + 3 Wolfsfelle (werden abgegeben) | 5 Puppen mit Fernwaffe, 40 s | 80 + 110 | ja (Code) |
  | Waldläufer | einen Bären erlegen | 10 Stunden am Stück draußen, 20–6 Uhr, außerhalb von Siedlungen | 80 + 110 | ja (Code; Schlaf zählt seit HB-03 Stunde für Stunde) |
  | Schurke | etwas aus fremdem Besitz stehlen, ohne gesehen zu werden | 3 Meuchelstiche an Puppen, 60 s | 80 + 110 | **nein** |
  | Assassine | einen Steckbrief vom Brett erfüllen und abgeben | – | 120 | ja, braucht aber Schurke (**dadurch gesperrt**) |
  | Kleriker | 5 Heilkraut (werden abgegeben) + 4 Skelette | eine Verletzte stabilisieren (Verband, Kraut oder Zauber), 60 s | 80 + 110 | ja (Code) |
  | Magier | ein Grabsiegel bergen | 5 Puppen mit Zaubern treffen, 30 s | 80 + 110 | ja, wenn vorher ein Zauber gelernt wurde (z. B. Funke bei Serafine) |
  | Barde | ein Schenkenspiel gewinnen | 5 Siege, während **dein Kriegslied** wirkt und 2 Gefährten mitkämpfen | 80 + 110 | **nein** (außer man ist Grubenhäuptling) |
  | Alchemist | 8 Heilkraut + 1 Seelenphiole | 3 Heiltränke brauen (Kessel oder „Trank brauen“) | 80 + 110 | ja über den Kessel am Lagerfeuer |

- **Belohnung / Folgen:** Je Schritt EP (80 bzw. 110, Assassine 120). Bei der Aufnahme kommen Klasse, +1 Talentpunkt, ein Chronik-Eintrag und das Sternbild dazu. Prüfungen geben **keinen Ruf** und kein Gold.
- **Bedienung:**
  - Dialoge beim Lehrer. Das Auftragsbuch (J) zeigt die Schritte, das Siegel über dem Lehrer markiert ihn.
  - Debug „Klassen: …“: Prüfung beim nächsten Lehrer, Ziele erfüllen, Meisterprüfung hier, zurücksetzen, Aufnahmeszenen.
- **Geprüft:** Live, Kriegerprüfung bei Borin dem Jüngeren mit einem Wanderer (Stufe 12):
  1. „Kannst du mich ausbilden? (Krieger)“ → Einleitung → „Ich höre.“ → Auftrag 1 angenommen.
  2. 4 Banditen getötet → Fortschritt 4/4 → „Erledigt.“ → +80 EP, Hinweis „Weiter mit … oder einem anderen Lehrer“.
  3. Auftrag 2 → „Ich bin bereit. (Das Duell im Kreis gewinnen)“ → ein Übungsfechter (94 LP, Stufe 3) erscheint.
  4. Duell gewonnen, „Erledigt.“ → **Klasse Krieger, +1 Talentpunkt, Wuchtschlag auf der Leiste**, Soll steigt von 7 auf 8.

  Die Aufnahme funktioniert also. Die Szene selbst ließ sich im Hintergrund-Tab nicht ansehen.

  Schurkenprüfung live: Ein Wanderer hat keine Fähigkeiten (`abilities: []`). Normale Hiebe auf die drei Puppen zählen 0.
- **Fehlversuche / Lücken:**
  - **[Hoch] Duell (Krieger, Ritter, Akademie) und Grube (Berserker) werden oft unverdient verloren.**
    - Repro: zwölf Duelle live, mit 8er-Treffern auf den Übungsfechter.
    - In **8 von 12** Läufen fiel der Rumpf des Fechters auf 0, während Kopf und Rumpf zusammen noch über 20 % lagen (hp 29–31 von 94). Der Fechter **starb** (trotz „Niemand stirbt“).
    - Die Prüfung lief danach mit totem Gegner bis zum Zeitende weiter und endete als **nicht bestanden**. Nur in 4 von 12 Läufen wurde rechtzeitig ein Kopftreffer gezählt und die Prüfung gewonnen.
    - Ursache: Die Siegbedingung prüft `target.hp - dmg < maxHp * 0,2` (game.js ~3799, Grube ~13863). Das `hp` von Figuren mit Körper ist Kopf + Rumpf (body.js:43), getötet wird aber über den Rumpf allein.
    - Betroffen sind auch das Akademie-Duell (Student, menschenähnlich) und die Rivalin.
  - **[Hoch] Schurkenprüfung für neue Figuren unlösbar.**
    - Schritt 2 zählt nur Treffer innerhalb von 1,5 s nach einem **Meuchelstich** (`p.stabAt`, gesetzt nur in `useAbility('backstab')`, ~15876) oder aus dem **Schattenschritt** (`shadowNext`) (`ktTrialHurt`, ~13861).
    - Beide Fähigkeiten hat man erst **als** Schurke bzw. Assassine. Ein Wanderer, der Schurke werden will, kann keinen Treffer zählen lassen.
    - Folge: Schurke, Assassine und Folterknecht sind für neue Figuren gesperrt. Nur alte Stände, die die Klasse schon haben, können „nachholen“.
    - Der Selbsttest übersieht das: Die Probe setzt die Figur vorher auf Schurke (game.js ~19470).
  - **[Hoch] Bardenprüfung für neue Figuren unlösbar.**
    - Schritt 2 zählt nur Siege mit dem Status `song` (game.js ~13600). Den setzt nur das **Kriegslied** des Barden (~16541) oder die Kriegstrommel des Grubenhäuptlings.
    - Folge: Barde und damit auch Kettenbarde sind praktisch gesperrt. Die Probe (~19513) setzt die Figur vorher auf Barde.
  - **[Niedrig]** Der Alchemist-Schritt 1 verlangt eine Seelenphiole, nimmt aber nur das Heilkraut ab (`reward.take: 'herb'`). Die Phiole bleibt in der Tasche.
  - **[Niedrig]** Der Alchemist-Schritt 2 nennt „Trank brauen“. Diese Fähigkeit hat man vor der Aufnahme nicht, möglich ist nur der Kessel. Der Text führt in die Irre.
  - **[Niedrig]** Auch beim zweiten Schritt sagt der Lehrer wieder „Zwei Aufgaben: eine draußen, eine hier vor mir.“ (`trialOffer`, ~13817). Das ist nur Text.
  - **[Niedrig, nicht nachstellbar]** Einmal öffnete `talk(Borin)` direkt nach dem Schließen eines anderen Dialogs nichts. Beim dritten Versuch ging es. Ursache unklar.
  - OFFEN.md [E]: „Ritter Platz halten 50 s“, „Grube ×2 Leben ×1,6 Schaden“ und „EP 80/110“ sind vorläufige Zahlen des Agenten.
  - OFFEN.md hatte gemeldet: Der Ritter hat Segen, aber ohne Mana. Das ist **behoben**: Segen kostet seit 03.10. Ausdauer.

---

## 14. Titelklassen

- **Was es ist:** Neben der Klasse kann man bis zu zwei Titel tragen, aktiv ist einer (`TITLE_CLASSES`, `MAX_TITLES = 2`).
  - Jeder Titel hat eine eigene Ressource, einen Makel, einen dauerhaften Preis, Ruffolgen und ein Leuchten.
  - Freigeschaltet wird er durch eine Tat in der Welt.
- **Übersicht:**

  | Titel | Ressource | Regel | Makel | Dauerpreis | Ruf | Freischaltung | Meister |
  |---|---|---|---|---|---|---|---|
  | Nekromant | Seelenessenz 0–6 | +1 je Tod in der Nähe | Waffenschaden −15 %, Heiliges Heilen halb | Leben −10 % | Tote +20, Orden −30, Valen −10 | Ahnenurne aus der Nekropole zu Ysra | Ysra |
  | Hexenmeister | Verderbnis 0–100 (Start 20) | Fähigkeiten laden auf, −4/s außerhalb des Kampfes | über 70 −1,5 Leben/s, bei 100 Ausbruch | Ausdauer −10 | Tote +15, Orden −30, Valen −10 | Urne zu Vhal | Vhal |
  | Druide | Wildkraft 0–100 (Start 40) | +5/s draußen auf Gras, Erde, Sumpf | in Ketten oder Platte halb | Stärke −1 | Orden +5 | „Ruf des Hains“ bei Mira | Mira |
  | Mönch | Fokus 0–5 | +1 je Ausweichen ins Leere, −1 je Treffer | in Ketten oder Platte kein Fokus | halbes Gold ans Kloster, Rook wird Feind | Orden +20, Bande −30 | „Probe der Stillen Hand“ bei Ilva | Ilva |
  | Grubenhäuptling | Stammesmut 0–100 (Start 30) | +2/s, +2/s je Goblin in der Nähe | ohne Goblin und ohne Kampf −1/s | Intelligenz −1 | Goblins +20, Orden −10 | „Einer von uns“ bei Grisk (Befreiung, Grubenstadt, Goblins 40) | Grisk |
  | Vampir | Blutdurst 0–100 (Start 30) | +4 je Stunde und je Fähigkeit | Sonne brennt | Heilung wirkt halb | Kelch +40, Orden −40, Valen −10 | „Der Kelch“ bei Hedda | Hedda |

- **Ausschlüsse:** Nekromant, Hexenmeister und Mönch schließen einander aus. Mönch und Vampir ebenfalls.
- **Titelgrade I–III** (`GRADE_NEED`): Grad 2 braucht 30 Taten und Stufe 8, Grad 3 braucht 90 Taten und Stufe 16. Der Meister weiht, dazu läuft die Aufnahmeszene.
- **Fähigkeiten je Grad:**

  | Titel | Grad I | Grad II | Grad III |
  |---|---|---|---|
  | Nekromant | Totenruf (2 Essenz, Diener 60 s, höchstens 2), Knochenschild (1) | Seelenernte (alles), Leichenbersten (1) | Seelenfessel (3) |
  | Hexenmeister | Fluch (+20), Chaosblitz (+15) | Schattenruf (+25), Entfesseln (ab 40), Seuchenfluch (+20) | Paktritter (20 % Leben), Obeliskentor (ab 50) |
  | Druide | Rankenfessel (25), Erdsegen (30) | Geisterwolf (40), Dornenhaut (25) | Wolfsgestalt (60, 20 s) |
  | Mönch | Handkante (1), Stilles Wasser (2) | Hundert Schritte (mind. 3), Gegenstrom (1) | Stille Hand (mind. 3) |
  | Grubenhäuptling | Goblinhorde (40), Schrottbombe (25) | Kriegstrommel (35), Tunnelsprung (20) | Dodons Echo (60) |
  | Vampir | Trinken, Blutpeitsche, Nebelschritt | Bannblick, Fledermausschwarm | Rote Ernte |

- **Klassenrüstung über Questreihen** (`c_nec1–3`, `c_war1–3`, `c_dru1–3`, `c_mon1–3`, `dk_1–3`): je 3 gebundene Teile. Ab 2 Teilen gibt es Heerruf, Dunkler Pakt, Rudelruf, Wirbel bzw. Todesmahr.
- **Bedienung:** Dialoge bei den Meistern. Ressourcenleiste im HUD. Titel aufgeben (`forsakeTitle`) sperrt die Klasse für immer.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:**
  - HB-06 (Mönch-Aufträge c_mon1–3 unerfüllbar) ist **behoben**.
  - HB-34 (c_nec2 braucht einen Wächter, den es nur im Pakt gibt) ist laut Hunt-Bericht noch offen (Code).

---

## 15. Sternbild-Talente und Talentpunkte

- **Was es ist:** Der Sternenhimmel (T) ersetzt den alten Talentbaum (`SKILL_TREE`, 221 Knoten; `SKIES`; `sky.js`).
  - In der Mitte steht der „Wanderer“ mit 29 Sternen (Kampf, Magie, Überleben, für alle).
  - Dazu kommt je Klasse ein Sternbild mit 8 Sternen: 2 Einstieg, 3 Mitte, 1 Herzstern, 2 Schlüsselsterne, die einander ausschließen.
  - Je Titel ein Sternbild mit 7 Sternen, Vampir und Grubenhäuptling inklusive.
  - Gefährten haben ein eigenes Sternbild mit 7 Sternen.
- **Ablauf:**
  - Einen Stern lernt man mit einem Punkt, wenn ein Vorstern gelernt ist.
  - **Wertesterne** wirken immer: Leben, Rüstung, Ausdauer, Mana, Krit, Abklingzeit, Zauberkraft, Tempo, Heilung, Regeneration, Packplätze, Ausweichen.
  - **Schlüssel- und Fähigkeitssterne** wirken nur, solange die Klasse oder eine Folgeklasse aktiv ist (`skyActive`). Titelsterne wirken nur mit dem getragenen Titel.
  - Einmal ist das Neuordnen kostenlos, danach kostet es 30 + 10 × Stufe Gold beim Lehrer.
- **Belohnung:** Stärkere Werte und veränderte Fähigkeiten. Eine Machtgrenze (Selbsttest-Probe) begrenzt ein volles Sternbild auf die Leistung des vollen Kampfzweigs.
- **Bedienung:** Eigenes Fenster (Himmel mit Schwenken, Zoom, Karte je Stern, „Lernen“ mit Bestätigung). Debug „Sterne: …“.
- **Geprüft:** Nur Code gelesen.
  - Jede der 14 Wirkungsarten (`fx`) wird in game.js über `tfx(c, '<art>')` gelesen.
  - Fähigkeitssterne (`ab`: mult, cd, cost, dur) gehen über `abMod` in `useAbility` ein.
  - Alle 40 Regel- und Schlüsselsterne ohne Zahlenwert werden im Code abgefragt (`node(...)`, `dkNode(...)`) oder geben eine Fähigkeit (`grants`).
  - Der Verdacht „Sterne wirken nicht“ hat sich im Code **nicht bestätigt**.
- **Fehlversuche / Lücken:**
  - OFFEN.md [E]: Sternnamen, Werte und Szenenzitate sind vorläufig.
  - OFFEN.md hatte gemeldet, Vampir und Grubenhäuptling hätten keinen Zweig. Das ist **behoben** (Scheibe 10).

---

## 16. Gefährten

- **Was es ist:** Bis zu `partyCap` Gefährten: 3 + Führung/10 + 1 mit Siedlung. Koop-Mitspieler belegen keinen Platz.
- **Ablauf:**
  - **Moral:** täglich ohne Nahrung −10, mit Nahrung +2. Jeder Tote in der Nähe −14, Mord −10, Blutbann −20. Gefährten mit grausamem Zug freuen sich über Grausamkeit.
  - **Desertion:** Unter Moral 12 gehen Gefährten mit 40 % Chance am Tag (game.js ~12551). Koop-Helden desertieren nicht.
  - **Loyalität** (0–100, Start 50): täglich +1, mit hoher Moral +1, mit niedriger −3. „Am Feuer“ gibt +5.
    - Nach 3 Abenden folgt ein persönlicher Auftrag gegen einen Elite-Mini-Boss: +25 / −10.
    - Ab 70 wird der Gefährte zum Freund fürs Leben (+2 Attribut, verrät nie).
    - Unter 15 kann er verraten (30 % am Tag): mit Gold verschwinden oder angreifen.
  - **Gefährten-Sternbild:** 1 Punkt zum Start, dann alle fünf Stufen einer. Nur Werte, Schlüsselsterne „Leibwache“ oder „Klinge der Gruppe“.
  - Rekrutierbar: Elena, Tomas, Borin, Lioba, Rook, Lila, Söldner (Handgeld 50 + Stufe × 12, Lohn 3 + Stufe am Tag) und angeworbene Gefangene.
- **Bedienung:** Gruppenfenster (G) als Tafel am rechten Rand. Gespräch „Wie geht es dir?“. Debug „Gefährten: …“.
- **Geprüft:** Nur Code gelesen. Der Testspielstand hatte keine Gefährten.
- **Fehlversuche / Lücken:** keine neuen. HB-35 (Kills von Verbündeten zählen nicht für Bosse und Aufträge) ist offen.

---

## 17. Begleittiere und Reittiere

- **Begleittiere:**
  - Ein Tier zugleich, mit +20 % Leben.
  - Zähmen durch Füttern (`TAME`):

    | Tier | Grundchance | Futter |
    |---|---|---|
    | Wolf | 20 % | Dörrfleisch, Pökelfleisch |
    | Wilder Hund | 35 % | Dörrfleisch, Pökelfleisch, Brot |
    | Wildschwein | 25 % | Brot, Weizen |
    | Bär | 8 % | Dörrfleisch, Pökelfleisch |

    Dazu kommen + Überleben/200, +12 % je Versuch, +15 % bei verwundetem Tier, −25 % bei wütendem.
  - Kauf beim Tierhändler: Hund 60, Wolfshund 180, Kampfeber 140. Der Tierhändler hat seit 03.10. ein eigenes Fenster mit vier Bereichen.
- **Reittiere:**

  | Reittier | Preis | Tempo |
  |---|---|---|
  | Pferd | 250 | 1,55 |
  | Messingross (Kupferhafen, muss geölt werden) | 900 | 1,75 |
  | Totenross (nur Tote oder Pakt, Todesritter automatisch) | 400 | 1,65 |

  - Jedes Tier hat Tempo, Ausdauer und Mut (ab 70 kommt es auch im Kampf).
  - R pfeift das Pferd herbei. Fenster „Stall“. Der Züchter Hadubrand hat 5 Pferde.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** HB-47 (Beinschaden bremst das Pferd) ist offen (niedrig).

---

## 18. Bionik und Prothesen

- **Was es ist:** Verlorene oder gesunde Glieder lassen sich durch Messing ersetzen (`body.js` `MECH_Q`, `MECH_MOD`, `EYE_Q`).
  - **Stufen:**

    | Stufe | Wirkung |
    |---|---|
    | 1 Schrott | Arm −8 %, Bein −6 %, doppelter Verschleiß |
    | 2 Aurelionisch | gleichwertig |
    | 3 Meisterstück | +10 % / +6 % |
    | 4 Prototyp | +15 % / +10 %, halber Verschleiß |

  - **Module:** Greifhand, Klingenhand (+12 % Nahkampf, kein Schildblock), Federfuß (+8 % Tempo), Ankerfuß (kein Rückstoß).
  - **Roboterauge (Stufen 1–4):** Sichtweite 22 bis 36, Fernkampf-Krit bis +6 %, Nachtsicht, Wärmesicht. Magie stört es.
  - **Verschleiß:** nur durch Treffer am Glied. Unter 50 % halbe Wirkung, unter 30 % keine.
  - **Wartung:** Spezialöl, Selbstwartung mit Feinwerkzeug und Material (Grenze 70 + Schmieden/5), Kybernetiker, Meisterin Vell (Gelenkhall), Schwarzmarkt (Rook, Nix).
  - Der Zugang hängt am Rang in Aurelion.
- **Bedienung:** Charakterbogen (Körperfigur mit Messingrand, Abschnitt „Bionik“), Fenster X. Die Prothesen-Werkbank ist laut OFFEN.md noch eine **Dialogliste** ([B] GUI geplant).
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:**
  - Fit-Befund SHF-01: Die freigegebene T15-Wartung (Energiezelle, Kurzschluss) ist nicht gebaut.
  - IHF-09: Bionik hat keine Rolle im Weltgeschehen.
  - Prothesen-Werkbank, Kontor und Schwarzmarkt haben kein Fenster.

---

## 19. Vampir und Blutkult-Fähigkeiten

- **Was es ist:** Titelklasse „Vampir“, heilbar und beliebig oft wiederholbar.
- **Freischaltung:** in den Katakomben unter Varonheim bei Hedda trinken.
- **Fähigkeiten:**

  | Fähigkeit | Grad | Wirkung | Blutdurst |
  |---|---|---|---|
  | Trinken | I | von Wehrlosen; Blutdurst −45; ein zweites Mal am selben Tag tötet; Tierblut −10, nie unter 50 | senkt |
  | Blutpeitsche | I | Geschoss, 40 % Lebensraub | +12 |
  | Nebelschritt | I | Sprung 140 px, 0,5 s unverwundbar, Verfolger verliert dich | +10 |
  | Bannblick | II | fliehender oder ergebener Mensch kämpft 40 s für dich | +20 |
  | Fledermausschwarm | II | 4 s, Gegner treffen schlechter und sind langsamer | +15 |
  | Rote Ernte | III | nur bei Blutdurst ≤ 40: blutende Feinde nehmen Schaden, du heilst die Hälfte | +40 |

- **Ablauf:**
  - **Sonne:** 1,2 Schaden/s, Wetter und Kapuze dämpfen. Am Boden brennt es halb weiter.
  - **Nacht:** +10 % Schaden.
  - **Raserei** bei 100 Blutdurst.
  - **Stigma** bei Zeugen: Kopfgeld oder Vampirjäger.
  - **Heilung** bei Mutter Aldis (200 Gold + Nachtwache) oder an der Heilquelle (5–7 Uhr, alle Grade weg).
  - Blutfürst-Weg nach Aldhelms Fall (siehe §23).
- **Gegner des Kults:** Maskierter, Blutmagier, Blutknecht, Kelchwächter, Blutschöpfer, Aldhelm (Tabelle §20).
- **Bedienung:** Dialog bei Hedda und Aldis. Debug „Blutkult: …“.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:**
  - HB-02 (Raserei friert nach dem Laden ein) ist **behoben**.
  - HB-31 (Kultkrypta nach dem Tod des Spieler-Blutfürsten) ist offen (Code).

---

## 20. Gegner: vollständige Tabelle (MONSTERS)

- **Was die Spalten bedeuten:**
  - **Werte** sind Grundwerte aus data.js:489–620. Im Spiel gilt:
    - Leben = Grundleben × (1 + Stufe × 0,04) × 1,7 × Schwierigkeit, Bosse ×2.
    - Schaden = Grundschaden × (1 + Stufe × 0,06) × 1,4 × Schwierigkeit, Bosse ×0,6.
  - **Bedr.** ist die Bedrohung 0–6. Sie hebt Stufe und Beutechance.
  - **Stufe** ergibt sich aus der Zonenstufe des Ortes (`ZONE`, `REGION_TIER`): Totenland 4, Eisenmark, Gebirge, Wüste und Seuchenland 3, Aurelion 2. In Gefahr-3/4-Gebieten gibt es +2/+4 Stufen und 25/50 % Veteranen (Leben ×1,3).
  - **Varianten** (18 %, nicht bei Bossen): Vernarbter, Ausgehungerter, Rasender, Gepanzerter, Anführer.
  - **Körper** (✓) heißt: menschenähnlich mit Trefferzonen (`HUMANOID`). Für diese Gegner gilt der Balkenfehler aus §8.
- **Geprüft:**
  - Live: Lebenspunkte einiger Gegner bei fester Stufe gemessen (siehe §23). Alle LOOT- und BOSS_LOOT-Einträge gegen ITEMS geprüft: **alle Gegenstände existieren.**
  - Alle Gegner ohne Beutetabelle ermittelt: Übungspuppe, Student, Übungsfechter, die drei Engel, Pferd, Soldat Valens.
  - Vorkommen: aus `SPAWN_AREAS`, Gewölben, Heeren und Ereignissen im Code gesucht.

| Schlüssel | Name | LP | Schaden | Tempo | Reichw. | Bedr. | Fraktion | Körper | Rolle / Besonderheit | Vorkommen |
|---|---|---|---|---|---|---|---|---|---|---|
| wolf | Wolf | 30 | 7 | 1,55 | 26 | 1 | Tiere | – | Rudel; jagt Hirsche; greift Banditen an | Westwald, Wolfsschlucht, Südsumpf, Mittelland, Frostkamm, Knochenwald, Hundertfeld, um Eren; Hinterhalte; Wurzelhalle |
| boar | Wildschwein | 46 | 11 | 1,35 | 26 | 1 | Tiere | – | greift Banditen an; zähmbar | Westwald, um Eren |
| goblin | Goblin | 28 | 6 | 1,35 | 28 | 1 | Goblins | ✓ | Dolch; nach der Befreiung kein Feind mehr | Grubenpfad, Westwald, Verlassene Grube, Tiefhall-Schmiede, Grubenhort, Kasematten |
| goblin_warrior | Goblin-Krieger | 54 | 11 | 1,25 | 32 | 2 | Goblins | ✓ | Axt, Holzschild | Rote Wüste, Frostkamm, Tiefhall, Alt-Vharn, Schwarze Feste, Grube (3 bei Gorak); nach Karrak in der Wüste |
| bandit | Bandit | 48 | 10 | 1,4 | 34 | 2 | Banditen | ✓ | Seitschritt beim Ausholen des Helden | fast überall im Menschenland; Banden, Räuberhöhle, Schmugglergrotte; nach Vargs Fall in der Eisenmark |
| bandit_archer | Banditenschütze | 36 | 9 | 1,35 | 300 | 2 | Banditen | ✓ | Fernkampf | Banditengebiete, Rote Wüste, Karraks Verstärkung |
| bandit_spear | Speerträger | 50 | 12 | 1,3 | 66 | 2 | Banditen | ✓ | hält Abstand, stößt zurück | Banditengebiete, Rote Wüste |
| bounty_hunter | Kopfgeldjäger | 58 | 12 | 1,45 | 36 | 2 | Banditen | ✓ | jagt Gesuchte; als Magierjäger mit Bann | erscheint ab 150 Gold Kopfgeld, als Magierjäger, bei Rachezügen |
| chain_brute | Kettenknecht | 95 | 15 | 1,2 | 40 | 3 | Kette | ✓ | schwerer Slam | Streifen der Kette in der Eisenmark, Vargs Verstärkung; Boss im Ausbrecherstollen (dieses Gewölbe stürzt ab, siehe Fehler) |
| rotgardist | Rotgardist | 120 | 17 | 1,25 | 46 | 3 | Kette | ✓ | Stoß mit Ansage; Elite | Eisenmark, Vargs Hof (4), Uhrwerkhalle |
| kettenschuetze | Kettenschütze | 50 | 16 | 1,3 | 320 | 3 | Kette | ✓ | Armbrust | Eisenmark, Vargs Hof (2), Uhrwerkhalle, Ausbrecherstollen |
| sea_raider | Plünderer der Sturmklinge | 62 | 12 | 1,45 | 38 | 2 | Seevolk | ✓ | Enterhaken-Stoß | Gischtinseln, Entern, Tangkron |
| sea_harpooner | Harpunier | 48 | 14 | 1,3 | 290 | 2 | Seevolk | ✓ | Fernkampf | Gischtinseln, Entern |
| whitebeard | Weißbart | 560 | 26 | 1,1 | 64 | 4 | Seevolk | ✓ | **Boss** (§23) | Tangkron |
| automat | Kriegsautomat | 140 | 16 | 1,05 | 44 | 3 | Aurelion | ✓ | Hellebarde, stirbt mit Funken | Automaten-Ereignis Aurelion, Uhrwerkhalle (auch Boss „Der Regulator“), Schlund |
| chain_master | Varg, Kettenmeister | 260 (Regionalboss 360) | 18 | 1,25 | 70 | 4 | Kette | ✓ | **Boss** (§23) | Kernburg der Eisenfeste |
| skeleton | Untoter Krieger | 44 | 10 | 1,15 | 32 | 2 | Tote | ✓ | Nahkampf | Totenland, Tiefhall, Gräber, Gewölbe, Spuk in Dörfern; sehr häufig |
| skel_bomb | Bomben-Skelett | 36 | 12 | 1,55 | 28 | 2 | Tote | ✓ | Selbstzündung, trifft alle; zählt als Skelett | 8 % Abart des Skeletts |
| skel_brute | Großes Skelett | 130 | 15 | 0,85 | 44 | 3 | Tote | ✓ | Erdschlag jeder 2.; zählt als Skelett | 6 % Abart des Skeletts |
| waechterspinne | Wächterspinne | 24 | 6 | 1,8 | 24 | 1 | Aurelion | – | hängt an Werkstattwänden, Splitter beim Tod; in Städten nur gegen Unbefugte | Werkstätten und Werkhallen Aurelions |
| dampframme | Dampframme | 150 | 15 | 0,8 | 40 | 3 | Aurelion | ✓ | Rammstoß 170 px, zerbricht Kisten | 20 % Abart des Automaten; Stadtschlacht Aurelion |
| blutschoepfer | Blutschöpfer | 40 | 9 | 1,3 | 30 | 2 | Kelch | ✓ | trinkt von Liegenden, heilt Kultisten | Katakomben Varonheim |
| netzwerferin | Netzwerferin | 42 | 9 | 1,35 | 240 | 2 | Seevolk | ✓ | Netz: 3 s fest, Große taumeln | Entern, Gischtinseln |
| hofspion | Hofspion | 44 | 11 | 1,5 | 30 | 2 | Aurelion | ✓ | wirkt erst harmlos, erster Stich von hinten ×3 | Hof der Himmelsinsel |
| mutant | Verdorbener | 44 | 11 | 1,6 | 36 | 2 | Tote | – | sehr schnell, Rüstung 0 | Totenland-Rand (je 80 Zeilen ein Gebiet) |
| mutant_brute | Wucherer | 95 | 14 | 1,35 | 42 | 3 | Tote | – | Ansage vor dem Hieb | Totenland-Rand |
| crypt_warden | Wächter der Nekropole | 150 | 15 | 1,1 | 40 | 3 | Tote | ✓ | Schildwall; Hüter der Ahnenurne; kein Boss-Flag | Große Nekropole; Gruft des Versunkenen Tempels („Der Hohepriester“) |
| death_captain | Hauptmann der Toten | 170 | 16 | 1,1 | 42 | 3 | Tote | ✓ | Slam; führt Befreiungswellen | Totenland Nordost, Besatzungen, Heere |
| hrodvar | Hrodvar | 220 | 19 | 1,0 | 46 | 4 | Tote | ✓ | **Boss** (§23) | Tiefhall, Thron |
| acad_dummy | Übungspuppe | 1 | 0 | 0 | 0 | 0 | – | ✓ | Prüfungsziel | Prüfungen |
| acad_student | Student der Akademie | 60 | 6 | 1,2 | 240 | 1 | – | ✓ | zaubert Funke und Froststoß | Akademie-Duell |
| drill_fighter | Übungsfechter | 60 | 6 | 1,2 | 34 | 1 | – | ✓ | Klassen-Duell und Grube („stirbt nie“ stimmt nicht, siehe §13) | Klassenprüfungen |
| aldhelm | Aldhelm, Blutfürst | 340 | 21 | 1,3 | 40 | 4 | Kelch | ✓ | **Boss** (§23) | Krypta des Kanzlers |
| blood_mage | Blutmagier | 38 | 12 | 1,1 | 250 | 2 | Kelch | ✓ | Geschoss heilt 40 % | Katakomben |
| thrall | Blutknecht | 34 | 8 | 1,25 | 30 | 1 | Kelch | ✓ | trägt den Namen eines Verschwundenen | Katakomben |
| chalice_guard | Kelchwächter | 120 | 16 | 1,0 | 40 | 3 | Kelch | ✓ | Platte, Schild | Kelchhalle |
| blood_cultist | Maskierter | 46 | 11 | 1,35 | 32 | 2 | Kelch | ✓ | nachts verkleidet in Varonheim | Varonheim nachts, Katakomben |
| cultist | Kultist der Asche | 34 | 12 | 1,2 | 260 | 2 | Tote | ✓ | Heiler: Feuerpfeil, heilt Untote | Alt-Vharn, Aschensee, Totenland, Tempelgruft, Sternkammer |
| ghoul | Wiedergänger | 70 | 13 | 0,85 | 30 | 2 | Tote | ✓ | Griff bremst; steht einmal auf (außer bei Feuer oder Heiligem) | Hundertfeld, Alt-Vharn, Aschensee, Totenland, Überfälle, Wurzelhalle |
| wraith | Geist | 38 | 9 | 1,7 | 30 | 3 | Tote | ✓ | nach Treffer körperlos, raubt Ausdauer | Knochenwald, Tiefhall-Eiskammern, Totenland, Ilvars Prüfung; Boss der Sternkammer |
| bone_knight | Knochenritter | 120 | 14 | 0,95 | 38 | 3 | Tote | ✓ | Schild vorn (Frontalhieb nur 30 %); Bogenhieb | Totenland, Turmweg, Garmadons Hof, Knochengruft, Schlund |
| bone_archer | Knochenschütze | 36 | 9 | 1,1 | 280 | 2 | Tote | ✓ | Fernkampf | Totenland, Knochengruft |
| necromancer | Nekromant | 52 | 11 | 1,0 | 240 | 3 | Tote | ✓ | ruft 3 Knochendiener | Totenland, Turmweg, Knochengruft |
| zombie | Seuchenleiche | 80 | 9 | 0,7 | 28 | 1 | Tote | ✓ | Biss vergiftet (50 %) | Totenland, Knochengruft, Überfälle |
| ash_demon | Aschdämon | 170 | 17 | 1,05 | 40 | 4 | Tote | ✓ | feuerfest, Glutaura | Totenland Nordost, Garmadons Gruft, Heere |
| shade | Schattenwesen | 40 | 15 | 1,5 | 30 | 3 | Tote | ✓ | springt hinter das Ziel | Totenland Nordost, Knochengruft, Sternkammer |
| bone_hound | Knochenhund | 34 | 8 | 1,8 | 24 | 2 | Tote | – | Rudel flankiert | Totenland, Vorhof der Gruft, Überfälle |
| carrion_wing | Aasschwinge | 22 | 6 | 2,0 | 26 | 2 | Tote | – | fliegt über Wasser und Mauern | Totenland |
| flesh_golem | Leichenkoloss | 340 | 24 | 0,6 | 50 | 4 | Tote | ✓ | Belagerung, Stampfen trifft alle, zerschlägt Wagen | Vorhof der Gruft, Totenheere |
| death_knight | Todesritter | 230 | 20 | 1,1 | 44 | 4 | Tote | ✓ | Lebensraub 25 %, Bogenhieb | Vorhof der Gruft, Garmadons Hof, Boss der Knochengruft („Morvhal“) und des Schlunds |
| garmadon | König Garmadon | 620 | 24 | 1,05 | 52 | 5 | Tote | ✓ | **Boss** (§23) | Gruft des Toten Königs |
| omega | Omega, der Gefallene | 600 | 30 | 0,9 | 70 | 6 | Omega | – | **Boss** (§23); fliegt | Krater |
| angel_blade | Klingenengel | 90 | 16 | 1,5 | 40 | 4 | Omega | ✓ | fliegt | nur Omegas Engelwellen |
| angel_archer | Lichtschütze | 60 | 12 | 1,3 | 300 | 3 | Omega | ✓ | Lichtpfeile aus der Luft | nur Engelwellen |
| angel_ophan | Ophan | 70 | 6 | 1,1 | 220 | 3 | Omega | – | heilt Omega (4 %) und Engel (20 %) | nur Engelwellen |
| bear | Bär | 150 | 18 | 1,15 | 38 | 3 | Tiere | – | Revier; verletzt stürmt er | Westwald (Bärenrevier), Frostkamm; Boss der Wurzelhalle |
| wild_dog | Wilder Hund | 24 | 6 | 1,65 | 24 | 1 | Tiere | – | Rudel flankiert | Mittelland, Rote Wüste, Eisenmark; Westwald nach Graumähne |
| cow | Kuh | 60 | 0 | 0,9 | – | 0 | Tiere | – | Beute, flieht | Höfe |
| sheep | Schaf | 26 | 0 | 1,1 | – | 0 | Tiere | – | Beute, flieht | Höfe |
| horse | Pferd | 80 | 0 | 1,8 | – | 0 | Tiere | – | nur unter dem Reiter gemalt | Ställe |
| deer | Hirsch | 30 | 0 | 1,9 | – | 0 | Tiere | – | flieht, Wölfe jagen ihn | Westwald, Eren-Wald, südliche Ebenen |
| valen_soldier | Soldat Valens | 52 | 10 | 1,3 | 44 | 2 | Valen | ✓ | Verbündeter | Valen-Heere, Stadtschlachten |
| dodon | Dodon | 620 | 27 | 0,95 | 62 | 5 | Goblins | – | **Boss** (§23) | Morrgrund |
| gorak | Gorak, Grubenwart | 240 | 24 | 1,0 | 52 | 4 | Goblins | ✓ | **Boss** (§23) | Verlassene Grube |

- **Fehlversuche / Lücken:**
  - **[Hoch] Ausbrecherstollen stürzt beim Betreten jeder Ebene ab.**
    - Der Gegner-Pool des Gewölbes enthält `'chainhunter'` (game.js ~11229, `VAULTS.ausbrecherstollen.pool`). Das ist der Schlüssel einer **Klasse**, kein Eintrag in `MONSTERS`.
    - `spawnEnemy` liest daraufhin `m.hp` von `undefined` (game.js ~1940).
    - Live: `RF.buildVault('ausbrecherstollen', 1)` warf 6 von 6 Mal `TypeError: Cannot read properties of undefined (reading 'hp')`. Die Räuberhöhle baut fehlerfrei.
    - Folge: Der geheime Ort „Ausbrecherstollen“ (MECHANIKEN „Geheimer Ort: Der Ausbrecherstollen“) ist kaputt, sein Boss „Der Pferchmeister“ ist nie erreichbar.
  - **[Niedrig]** Die drei Engel (Klingenengel, Lichtschütze, Ophan) haben keine Beutetabelle. Sie geben nur Gold (50 %). Vielleicht gewollt (Heeresschlacht).
  - **[Niedrig]** Die alte Doku nennt falsche Werte: Hrodvar „280“ (Daten 220), Dodon „760“ (Daten 620). Wächter der Nekropole steht als Boss in der Liste, hat aber kein Boss-Flag.

---

## 21. Beutetabelle (LOOT) je Gegner

- **Regel** (`dropLoot`, game.js ~4224):
  - Verbrauchsgüter und Material fallen mit der angegebenen Chance.
  - Ausrüstung (Waffen und Rüstung) fällt bei normalen Gegnern nur mit **×0,35**, bei Elite, Veteran und Anführer mit **×1,5** der Chance.
  - Bei Bossen zählt `BOSS_LOOT` statt der Ausrüstung aus `LOOT`.
  - Alles wird mit dem Beutefaktor der Schwierigkeit multipliziert.
  - Dazu kommt mit 50 % Gold in Höhe von 1–6 + Stufe.
  - Die Seltenheit wird beim Fund gewürfelt: gewöhnlich 62 %, ungewöhnlich 24 %, selten 10 %, episch 3,5 %, legendär 0,5 %. Gefährliche Gegner heben die Chancen.
- **Lesehilfe:** Prozent = Grundchance aus data.js:431–473. Bei Ausrüstung gilt im Spiel der Faktor oben.

| Gegner | Beute (Grundchance) |
|---|---|
| Wolf | Fell 70 %, Dörrfleisch 40 %, Knochen 30 % |
| Wildschwein | Dörrfleisch 80 %, Fell 30 % |
| Goblin | Knochen 40 %, rostiges Schwert 12 %, Schrottklinge 5 %, Brot 30 %, Eisen 20 %, Verband 15 % |
| Goblin-Krieger | Schleuder 12 %, Schrottkeule 10 %, Wurfbeil 6 %, Eisen 50 %, Axt 20 %, Lederkappe 15 %, Speer 12 % |
| Bandit | Trank der Wut 3 %, Lederhandschuhe 6 %, Lederbeinlinge 5 %, Talisman Leichtfuß 2 %, Wurfmesser 8 %, Kriegssichel 5 %, Grabräuber 12 %, Rabenbeil 6 %, Plündererharnisch 6 %, rostiges Schwert 20 %, Lederwams 15 %, Brot 40 %, Dolch 20 %, Verband 35 %, Maskenkapuze 3 %, Wanderkapuze 6 %, Rabenmantel 3 %, Bärenfell 1,5 %, Mantel des Rabenfürsten 0,15 % |
| Banditenschütze | Kurzbogen 25 %, Lederkappe 20 %, Dörrfleisch 30 % |
| Speerträger | Speer 25 %, Lederwams 12 %, Brot 30 %, Verband 20 % |
| Kopfgeldjäger | Dornensäbel 15 %, Grenzläufer 10 %, Verband 60 %, Heiltrank 30 %, Kettenhemd 12 %, Armbrust 8 % |
| Kettenknecht | Brigantine 20 %, Eisenwache 20 %, Eisenhut 30 %, Flegel 10 %, Henkersaxt 6 %, Kettenbrecher 4 %, Aufsehermantel 10 %, Verband 50 %, Kettenhaube 8 %, Henkerskapuze 5 % |
| Rotgardist | Rotgardistenpanzer 20 %, Rotgardistenhelm 25 %, Rotklaue 12 %, Schwarzzahn 4 %, Mauerbrecher 3 %, Heiltrank 40 % |
| Kettenschütze | Armbrust 20 %, Eisenwache 15 %, Eisenfalke 5 %, Bergmannshelm 20 %, Verband 40 % |
| Kriegsautomat | Messingpistole 3 %, Automatenkern 80 %, Schrottarm 6 %, Schrottbein 6 %, Eisen 60 % |
| Plünderer | Entermesser 18 %, Seemantel 8 %, Dörrfleisch 30 %, Heiltrank 15 %, Ölzeugumhang 6 %, Teermantel 8 % |
| Harpunier | Harpune 15 %, Dreispitz 5 %, Heiltrank 15 % |
| Untoter Krieger | Legionärsplatte 4 %, Knochen 90 %, rostiges Schwert 20 %, Grabsiegel 5 %, Knochenumhang 2 % |
| Bomben-Skelett | Knochen 60 %, Grabsiegel 4 % |
| Großes Skelett | Knochen 100 % + 60 %, Legionärsplatte 8 %, Eisen 30 %, Grabsiegel 8 % |
| Wächterspinne | Eisen 40 %, Automatenkern 10 % |
| Dampframme | Automatenkern 60 %, Eisen 80 % + 40 %, Schrottbein 4 % |
| Blutschöpfer | Blutphiole 50 %, Dolch 8 % |
| Netzwerferin | Dörrfleisch 30 %, Heiltrank 15 %, Seemantel 5 % |
| Hofspion | Dolch 20 %, Heiltrank 20 % |
| Verdorbener | Knochen 30 %, Verband 15 %, Fetzenmantel 3 % |
| Wucherer | Knochen 50 %, Dörrfleisch 15 %, Verband 20 %, Fetzenmantel 5 % |
| Wächter der Nekropole | Kettenbeinlinge 15 %, Talisman Wächter 8 %, Knochenspalter 30 %, **Ahnenurne 100 %**, Knochen 100 %, Kettenhemd 40 % |
| Hauptmann der Toten | Elixier Stein 15 %, Elixier Wacht 20 %, Panzerhandschuhe 15 %, Beinschienen 12 %, Talisman Toten 10 %, Totenmünze 2 %, Totenglocke 30 %, Legionärsplatte 30 %, Knochen 100 %, Kettenhemd 50 %, Eisenhelm 40 %, Heiltrank 80 %, Flegel 30 % |
| Blutmagier | Blutphiole 50 %, Blutmaske 30 %, Stab 5 % |
| Blutknecht | Brot 20 %, Verband 20 % |
| Kelchwächter | Blutphiole 60 %, Drachenschild 10 %, Kettenhemd 6 % |
| Maskierter | Blutmaske 100 %, Blutphiole 30 %, Dolch 15 %, Maskenkapuze 5 % |
| Kultist der Asche | Seelenphiole 25 %, Verband 30 %, Stab 8 %, Zauberstab 5 %, Reiseumhang 10 %, Fetzenmantel 8 %, Widderkapuze 4 % |
| Wiedergänger | Knochen 60 %, Dörrfleisch 15 %, Fetzenmantel 4 % |
| Geist | Seelenhaken 5 %, Seelenphiole 40 %, Grabsiegel 8 %, Grabtuchmantel 2 % |
| Knochenritter | Drachenschild 15 %, Knochen 80 % |
| Knochenschütze | Kurzbogen 20 %, Knochen 70 % |
| Nekromant | Seelenphiole 60 %, Stab 10 % |
| Seuchenleiche | Knochen 50 % |
| Aschdämon | Seelenphiole 35 % |
| Schattenwesen | Seelenphiole 30 % |
| Knochenhund | Knochen 80 % |
| Aasschwinge | Knochen 30 % |
| Leichenkoloss | Knochen 100 %, Seelenphiole 50 % |
| Todesritter | Seelenphiole 40 %, Plattenharnisch 20 %, Schädelhelm 8 % |
| Bär | Fell 100 % + 50 %, Dörrfleisch 100 %, Knochen 40 % |
| Wilder Hund | Fell 30 %, Knochen 30 % |
| Hirsch | Dörrfleisch 100 %, Fell 60 % |
| Kuh | Fleisch 100 % + 100 %, Fell 50 % |
| Schaf | Fleisch 100 %, Tuch 80 % |
| Übungspuppe, Student, Übungsfechter, Engel (3), Pferd, Soldat Valens | keine Tabelle (nur Gold) |

Die Beute der Bosse steht in §23.

- **Geprüft:** Live. Alle Schlüssel existieren in ITEMS, und es gibt keine Tabelle ohne Gegner.
- **Fehlversuche / Lücken:** keine fehlerhaften Einträge. Gold fällt nur mit 50 %. Das ist gewollt, nur zur Kenntnis.

---

## 22. Elite-Mini-Bosse (ELITES)

- **Was es ist:** 32 benannte Anführer für Steckbriefe und persönliche Aufträge von Gefährten (data.js:1784–1816; `applyElite`, game.js ~1981).
  - Jeder hat einen Faktor auf Leben und Wucht, eine **Kraft** und eine **sichere Beute** (Seltenheit hochgewürfelt).
  - Dazu kommen eine Trophäe mit seinem Namen und Gold.
  - Ein Getöteter kehrt erst zurück, wenn alle einmal dran waren.
- **Kräfte:**

  | Kraft | Wirkung |
  |---|---|
  | burn, frost, shock | Treffer setzt Brand, Frost oder Schock (35 %) |
  | regen | heilt sich |
  | summon | ruft bei halbem Leben zwei aus dem Gefolge |
  | rally | Bande eilt herbei |
  | charge | sehr schnell |
  | tough | Panzer |

- **Boss-Intro:** nein. Bossleiste: nein (kein Boss-Flag, nur der Zielbalken).

| Name | Art (Gefolge) | Gegend | Leben × / Wucht × / Tempo × / Rüstung + | Kraft | Sichere Beute |
|---|---|---|---|---|---|
| Hagen der Schlitzer | Bandit | Banditen | 1,8 / 1,2 | rally | Langschwert |
| Ruprecht Einauge | Banditenschütze (Bandit) | Banditen | 1,6 / 1,35 | rally | Langbogen |
| Wendel die Krähe | Bandit | Banditen | 1,5 / 1,2 / 1,2 | charge | Doppelklinge |
| Gunther Rotbart | Speerträger (Bandit) | Banditen | 2,0 / 1,2 / – / +3 | tough | Hellebarde |
| Die Stille Mathilde | Bandit | Banditen | 1,5 / 1,45 | burn | Wurfmesser |
| Otmar Brandschatz | Bandit | Banditen | 1,7 / 1,25 | burn | Axt |
| Galgenstrick Fritz | Bandit | Banditen | 1,6 / 1,3 / 1,15 | rally | Rapier |
| Adelheid vom Hohlweg | Banditenschütze | Banditen | 1,5 / 1,4 | rally | Armbrust |
| Karim Sandgeist | Bandit | Wüste, Ödland | 1,7 / 1,3 / 1,2 | charge | Kriegssichel |
| Nadira die Skorpionin | Banditenschütze (Bandit) | Wüste | 1,5 / 1,45 | shock | Kurzbogen |
| Knarz der Grubenkönig | Goblin-Krieger (Goblin) | Goblins | 2,4 / 1,3 / – / +2 | summon | Axt |
| Mulch der Pilzschamane | Goblin | Goblins | 1,8 / 1,1 | regen | Heiltrank |
| Schrottfresser Grimm | Goblin-Krieger | Goblins | 2,2 / 1,2 / – / +4 | tough | Ersatzteile |
| Flinkfinger Zick | Goblin | Goblins | 1,4 / 1,2 / 1,35 | charge | Wurfmesser |
| Der Knochenfürst Varsk | Skelett | Untote | 2,2 / 1,3 / – / +2 | summon | Knochenspalter |
| Irmhild vom Frostgrab | Skelett | Untote | 1,9 / 1,25 | frost | Frostklinge |
| Seuchenmaul | Wiedergänger | Untote | 2,0 / 1,2 / 1,15 | regen | Heiltrank |
| Der Grabschänder Egbert | Wiedergänger (Skelett) | Untote | 1,8 / 1,35 | rally | Grabräuber |
| Die Totenglocke | Skelett (Wiedergänger) | Untote | 2,0 / 1,2 | shock | Totenglocke |
| Aschenkönigin Sabeth | Skelett | Untote | 2,1 / 1,35 | burn | Kriegssense |
| Graumähne (Elite) | Wolf | Wölfe | 2,4 / 1,3 / 1,15 | summon | Fell |
| Schwarzfell | Wolf | Wölfe | 2,0 / 1,4 / 1,25 | charge | Fell |
| Eisenhauer | Wildschwein | Wolf-, Banditen-, Goblingebiete | 2,6 / 1,3 / – / +3 | charge | Fell |
| Der Alte vom Berg | Bär (Wolf) | Gebirge, Eisenmark | 2,2 / 1,3 | regen | Fell |
| Der Weiße Hund | Wolf | Wölfe | 2,1 / 1,35 | frost | Fell |
| Brakk Kettenbrecher | Kettenknecht (Bandit) | Eisenmark, Gebirge | 1,8 / 1,25 / – / +2 | tough | Kriegshammer |
| Veit mit der Peitsche | Kettenknecht (Bandit) | Eisenmark, Gebirge | 1,7 / 1,3 | shock | Kettenpeitsche |
| Aschepriester Morn | Kultist (Skelett) | Totenland, Seuchenland | 1,9 / 1,3 | burn | Zauberstab |
| Die Schattenseherin | Kultist | Totenland, Seuchenland | 1,7 / 1,4 | regen | Zauberstab |
| Kapitän Seeteufel | Plünderer | Banditen | 1,9 / 1,3 | rally | Kriegssichel |
| Harpunen-Hella | Harpunier (Plünderer) | Banditen | 1,7 / 1,4 | charge | Speer |
| Das Messingungetüm | Kriegsautomat (Bandit) | Aurelion | 2,2 / 1,3 / – / +4 | shock | Ersatzteile |

- **Bedienung:** Steckbrief am Anschlagbrett mit Gesicht (Brief zeigt Lohn). Debug „Elite-Mini-Boss hier“, „Alle Elite-Mini-Bosse nebeneinander“.
- **Geprüft:** Live. Alle Arten, Gefolge und Beutegegenstände existieren (keine fehlerhaften Schlüssel).
- **Fehlversuche / Lücken:**
  - **[Niedrig]** Die Elite „Graumähne“ (Wolf) heißt genauso wie der Regionalboss Graumähne (Leitwolf der Schlucht). Es kann also zwei „Graumähnen“ geben. Verwechselbar.
  - **[Niedrig]** Die fünf Tier-Elites geben als „sichere Beute“ nur ein gewöhnliches Fell. Das ist eine schwache Belohnung für einen Mini-Boss.
  - **[Niedrig]** Kapitän Seeteufel und Harpunen-Hella erscheinen in Banditengebieten (`where: ['bandit', …]`), nicht auf See.

---

## 23. Bosse

- **Gemeinsame Regeln:**
  - Bosse haben doppeltes Leben (`BOSS.hp = 2`) und teilen 60 % aus. Omega ist ausgenommen.
  - Rückstoß ×0,25, Parade-Taumeln nur 450 ms.
  - Regionalbosse rufen unter 50 % Leben einmal Verstärkung.
  - Boss-Beute (`BOSS_LOOT`): 90 % eine Waffe aus dem Pool, 60 % ein Rüstungsteil, 25 % das Einzelstück. Gewürfelt wird **getrennt**: Man kann leer ausgehen oder das Einzelstück zweimal bekommen.
  - Die Bossleiste erscheint ab 520 px. **Boss-Intro** (Regiebuch T17, `bossIntro`): beim ersten Blickkontakt unter 340 px, einmal je Held, nur für die 7 Einträge in `BOSS_CARDS`.
- **Lebenspunkte live gemessen** (`spawnEnemy` auf einer Wegwerfkarte, Schwer). Bei menschenähnlichen Bossen ist das nur Kopf + Rumpf, also der Balken:

| Boss | Ort | Stufe | Leben im Spiel | Schaden je Hieb (ca.) | Intro | Besonderheiten | Beute | Folgen |
|---|---|---|---|---|---|---|---|---|
| **Graumähne**, Leitwolf (Regionalboss, Wolf) | Wolfsschlucht | 9 | 170 × 1,7 × 2 = **578** | Wolf | **nein** | ruft das Rudel | nur Wolfsbeute (Fell, Fleisch, Knochen), kein eigener Pool | Eren +8 Felle, Valen +3, im Westwald werden 60 % der Wölfe zu Hunden, Gegnerdeckel −30 % |
| **Karrak**, der Sandfürst (Regionalboss, Bandit) | Rote Wüste | 12 | 340 × 3,4 = **1156**, Wucht ×1,8 | Bandit × 1,8 | **nein** | ruft Schützen | nur Banditenbeute (Ausrüstung mit Faktor 1), kein eigener Pool | Händler +8, Bande −25, Goblin-Krieger ziehen ein |
| **Varg**, Kettenmeister | Kernburg der Eisenfeste | 16 | 360 × 3,4 = 1224 (Körper; live mit 260 Grundleben: 918) | ~30 | ja („VARG“) | hält Hof (ansprechbar), Hofstaat 4 Rotgardisten + 2 Kettenschützen, ruft Knechte; Goblin-Sturm | Henker/Kettenpeitsche/Kettenbrecher 90 %; Eisenfürst-, Blutketten-Set, Kettenumhang 60 %; Roter Henker 25 % (+ Trank) | Befreiung der Goblins (`liberate`), Kette zerfällt zu Räubern |
| **Gorak**, Grubenwart | Verlassene Grube | 10 | **828** | ~32 | ja („GORAK“) | Phase 1 schwerer Hieb mit Ansage; unter 50 % Brüllen, schneller | Gorak-Spalter/Mauerbrecher 90 %; Grubenkönig/Schrotthelm 60 %; Gorak-Spalter 25 % (+ 2 Eisen, Trank 60 %) | `q_mine`; HB-42 offen (q_mine bricht, wenn er vorher stirbt) |
| **Hrodvar**, König unter dem Eis | Tiefhall, Thron | 11 | **781** | ~26 | ja („HRODVAR“) | `frostKingAI`: Eiskreis, Eislanze, 2 Skelett-Wachen | Nachtfrost/Knochenspalter 90 %; Platte, Eisenhelm, Totenkrone-Teile 60 %; Nachtfrost 25 % (+ Eisen, Trank) | Omega-Fragment |
| **Weißbart**, König der Sturmklinge | Tangkron | 18 | **2702** | ~45 | ja („WEISSBART“) | redet zuerst (`whitebeardParley`), dann `whitebeardAI` | Sturmanker/Entermesser/Harpune 90 %; Dreispitz/Seemantel/Kapitänsrock 60 %; Sturmanker 25 % (+ Seekarte, 2 Tränke) | Machtvakuum auf See; HB-07 behoben |
| **Aldhelm**, Blutfürst | Krypta des Kanzlers | 16 | **1565** | ~35 | eigene Kamerafahrt (nicht `BOSS_CARDS`) | Blutfesseln (Gefangene heilen ihn), ab 60 % Nebel und Blutsiegel, Lichtschächte, unter 30 % trinkt er | Kanzlerdegen 90 % + 25 %; Kanzlerrobe 60 % (+ Blutphiole, Trank) | Kult zerschlagen / Blutfürst-Weg |
| **König Garmadon** | Gruft des Toten Königs | 18 | ca. 2400 (live bei Stufe 20: 2571) | ~44 | ja („KÖNIG GARMADON“) | spricht, lässt nicht gehen; 3 Phasen; Lebensraub 25 %/40 %; Hof aus 2 Todesrittern, 4 Knochenrittern, 4 Skeletten | Garmadons Reue/Knochenspalter/Totenglocke 90 %; Totenkrone-Set, Schädelhelm 60 %; Garmadons Reue 25 % (+ Trank, Seelenphiole) | Ende der Toten-Linie, Chronik |
| **Omega**, der Gefallene | Krater | 20 | **1836** (ohne Boss-Faktor) | ~92 (ohne Abschlag) | ja („OMEGA“) | fliegt; Sternenfall, Strahl, Nova; 3 Engelwellen (`ANGEL_WAVES`) | Sternenklinge 90 % + 25 % (+ Trank) | `omegaEnd('slain')`, Weltfolgen §5c |
| **Dodon**, Hüter von Morrgrund | Morrgrund | 20 | **3794** | ~50 | ja („DODON“) | redet zuerst; schwerer Slam jeder 2. Angriff, r 95 | Morrs Keule 90 % + 25 %; Grubenkönig 60 % (+ 2 Tränke, Talisman Wächter 50 %) | `dodonSlain`; HB-41 (nach Sturm-Abbruch nicht ansprechbar) offen |
| Wächter der Nekropole | Große Nekropole | 10 | 242 | ~34 | nein | Hüter der Ahnenurne; **kein Boss-Flag** (keine Bossleiste) | Ahnenurne 100 % u. a. (§21) | `wardenSlain`, Nekromant/Hexenmeister-Pakt |

- **Gewölbe-Wächter** (`VAULTS`): Anführer-Variante, Leben ×1,5+ (nach Gewölbestufe). Hort-Truhe nach Gewölbestufe. Kein Intro.

  | Wächter | Gewölbe | Grundart |
  |---|---|---|
  | Krummnase | Räuberhöhle | Bandit |
  | Rostzahn | Kasematten | Goblin-Krieger |
  | Der Hohepriester | Tempelgruft | Wächter der Nekropole |
  | Morvhal | Knochengruft | Todesritter |
  | Der Regulator | Uhrwerkhalle | Automat |
  | Die Schmugglerkönigin | Schmugglergrotte | Bandit |
  | Der Sternenlose | Sternkammer | Geist |
  | Die Mutter der Wurzeln | Wurzelhalle | Bär |
  | Der Pferchmeister | Ausbrecherstollen | Kettenknecht (**nie erreichbar**, Absturz) |
  | Wächter der Tiefe | Schlund | Todesritter (alle 5 Ebenen) |

- **Bedienung:** Bossleiste unten mit 50-%-Marke. Debug „Regie (T17)“ (Boss-Intro ansehen), Boss-Spawns im Debug.
- **Geprüft:** Live gemessen wurden Lebenspunkte und Boss-Flag. Die Intro-Bedingung ist im Code gelesen (sie wird vor der Boss-KI geprüft, gilt also auch für Gorak, Hrodvar, Weißbart, Garmadon, Omega). Kämpfe selbst nicht live, nur Code gelesen.
- **Fehlversuche / Lücken:**
  - **Behoben:** „Boss-Intros fehlen für Varg, Hrodvar, Garmadon, Gorak, Dodon“ (OFFEN.md, vollstaendigkeit H12). `BOSS_CARDS` (data.js:1727) deckt diese und Weißbart und Omega ab.
  - **Offen:** Kein Intro für **Graumähne, Karrak**, die Gewölbe-Wächter und Elites. Kerkerausbruch ebenfalls ohne.
  - **[Mittel]** Graumähne und Karrak haben keinen eigenen Beutepool. Als Bosse bekommen sie nur die Tabelle ihrer Grundart (Fell oder Banditenkram). Das passt nicht zur Regel „Boss ~90 % relevanter Waffen-Drop“ (Nutzerwunsch S15 P2, data.js:476).
  - **[Niedrig]** Die Boss-Beute ist nicht garantiert: 10 % ohne Waffe, 40 % ohne Rüstung. Das Einzelstück kann doppelt fallen, weil es auch im Waffenpool steht.
    - MECHANIKEN beschreibt Aldhelms Beute („Kanzlerdegen …, Robe des Kanzlers“) wie sicher.
    - Omega gibt mit 7,5 % keine Sternenklinge.
  - **[Niedrig]** Wächter der Nekropole: Er gilt in Doku und Kodex als Boss, hat aber kein Boss-Flag. Keine Bossleiste, kein doppeltes Leben.
  - **[Hoch, siehe §8]** Die Bossleiste fällt bei Varg, Gorak, Hrodvar, Weißbart, Aldhelm und Garmadon nie unter rund ein Drittel, bevor der Boss stirbt.
  - Bossgespräche (Weißbart, Garmadon) sind laut OFFEN.md reiner Text, ohne Story-Fenster.

---

## Zusammenfassung Fehlversuche

Sortiert nach Schwere. Datei:Zeile ungefähr, `game.js` war während der Prüfung in Bearbeitung.

### Hoch
1. **Duell- und Grubenprüfungen werden trotz Sieg verloren.** Bei Krieger, Ritter, Berserker und dem Akademie-Duell stirbt der Gegner über den Rumpf, bevor die 20-%-Schwelle von Kopf + Rumpf erreicht ist. Live: 8 von 12 Duellen danach „nicht bestanden“, der Übungsfechter stirbt. — game.js ~3799 (Duell), ~13863 (Grube); body.js:43–49 (`syncHp`/`vital`).
2. **Schurkenprüfung für neue Figuren unlösbar.** Gezählt werden nur Meuchelstich oder Schattenschritt, die man erst als Schurke bzw. Assassine hat. Damit sind Schurke, Assassine und Folterknecht gesperrt. — game.js ~13861 (`ktTrialHurt`), ~15876 (`backstab` setzt `stabAt`); Probe ~19470 setzt die Klasse vorher und übersieht es.
3. **Bardenprüfung für neue Figuren unlösbar.** Gefordert ist das eigene Kriegslied, das erst der Barde hat. Damit sind Barde und Kettenbarde gesperrt (außer Grubenhäuptling). — game.js ~13600 (`songkill`), ~16541 (`war_song`); Probe ~19513.
4. **Lebensbalken leeren sich bei menschenähnlichen Figuren nie.** `hp` = Kopf + Rumpf, Tod bzw. „am Boden“ hängt am Rumpf. Etwa 33–36 % bleiben stehen (Ziel, Bossleiste, HUD, Gruppe). Die 50-%-Phasenmarke der Bossleiste passt nicht. — body.js:43–49; render.js:264 (`drawBossBar`), ~3340 (`drawTargetBar`); ui.js:129, 153.
5. **Ausbrecherstollen stürzt ab.** Der Pool enthält die Klasse `'chainhunter'` statt eines Gegners. Live 6/6 TypeError. Der geheime Ort und sein Boss „Der Pferchmeister“ sind unerreichbar. — game.js ~11229 (`VAULTS.ausbrecherstollen`), ~1940 (`spawnEnemy`).

### Mittel
6. **Fertigkeit Jagd** hat keine Wirkung und kein Wachstum. Die Herkunft „Jäger“ gibt 6 Punkte umsonst. — ui.js ~1221; data.js:6.
7. **Fertigkeit Schleichen** steigt nie (startet bei 0). Sie wirkt nur in drei Würfen, einen Schleichmodus gibt es nicht. — game.js ~6246, ~9682, ~14032; ui.js ~1222.
8. **Graumähne und Karrak** haben keinen eigenen Boss-Beutepool und kein Boss-Intro. — game.js ~2017–2024 (`REGION_BOSSES`); data.js:479 (`BOSS_LOOT`), :1727 (`BOSS_CARDS`).

### Niedrig
9. Boss-Beute ist nicht garantiert (10 % ohne Waffe), und das Einzelstück kann doppelt fallen. MECHANIKEN stellt Aldhelms Beute als sicher dar. — game.js ~4224 (`dropLoot`); data.js:479–488.
10. Wächter der Nekropole gilt als Boss, hat aber kein Boss-Flag (keine Bossleiste). — data.js:549.
11. Alchemist-Prüfung 1 nimmt die verlangte Seelenphiole nicht ab. Prüfung 2 nennt „Trank brauen“, das man vor der Aufnahme nicht hat. — data.js QUESTS `kt_alchemist1/2`.
12. Der Prüfungstext sagt auch beim zweiten Schritt „Zwei Aufgaben …“. — game.js ~13817 (`trialOffer`).
13. Die verwaiste Fähigkeit „Schattenblitz“ (`shadow_bolt`) gehört zu keiner Klasse, keinem Titel und keinem Stern. — data.js:674.
14. Der Lehrtext nennt bei Funke, Feuerpfeil und Energiegeschoss einen „Wandermagier in Kreuzweg“ statt Serafine. — data.js:741–753.
15. Die Elite „Graumähne“ teilt den Namen mit dem Regionalboss. Tier-Elites geben nur ein Fell. Seeteufel und Hella erscheinen in Banditengebieten. — data.js:1805–1815.
16. Die Engel (Omega-Wellen) haben keine Beutetabelle. — data.js LOOT.
17. Veraltete Doku:
    - MECHANIKEN „sieben Gegnerarten“ mit schwerem Angriff (jetzt zehn) und „22 Zauber in 6 Schulen“ (jetzt 31 in 8).
    - IST_ZUSTAND: Hrodvar 280 statt 220, Dodon 760 statt 620.
    - OFFEN.md/vollstaendigkeit H7 (Zauberlehrer fehlen) und H12 (Boss-Intros fehlen) sind **erledigt**.
18. Nicht nachstellbar: Ein `talk(Borin)` öffnete nach dem Schließen eines anderen Dialogs einmal nichts.

### Behoben gegenüber älteren Meldungen (zur Kenntnis)
- `sp_regen` und `sp_staunch` lehrt Mutter Aldis, `sp_shock` lehrt Magister Corvinus. Live im Menü gesehen.
- Boss-Intros für Varg, Hrodvar, Garmadon, Gorak, Dodon, Weißbart und Omega sind vorhanden.
- Schmieden wirkt (Esse-Güte, Prothesenwartung). Sterne wirken: alle Wirkungsarten und Regelsterne sind im Code verdrahtet.
- Vampir und Grubenhäuptling haben ein Sternbild. Segen kostet Ausdauer.
- HB-06, -07, -14 bis -17, -21, -22 sind behoben (siehe Hunt-Bericht).
- Die Aufnahme nach der Prüfung funktioniert. Live: Krieger mit +1 Talentpunkt und Wuchtschlag.
