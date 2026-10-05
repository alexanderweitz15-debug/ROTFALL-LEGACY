# Ist-Zustand D — Items, Spielerwirtschaft, Menüs (Stand 03.10.2026)

## Audit 04.10.2026 — Phase 1 (Code ist die Wahrheit)

- **1.5 Zählung:** `AFFIXES` 15, `ITEMS` 295.
- **1.10:** Pferdezüchter: Schlüssel `wendel`, Name **Hadubrand**. „Wendel“ als Anzeigename ist ein Doku-Fehler.
- **1.11:** Prothesen-Werkbank: Fenster seit 03.10. (D richtig). Dazu seit 04.10. Fenster für Heiler und Zauber lernen.
- **1.12:** Leitwolfzahn/Klinge des Sandfürsten fallen sicher in `die()` (D richtig); eigener Beutepool fehlt (siehe C).


Bereich D des detaillierten Ist-Zustands. Grundlage: Code-Stand vom 03.10.2026 (Cache-Schlüssel `?v=24`), `docs/IST_ZUSTAND.md` (alter Stand, hier korrigiert und vertieft), `docs/MECHANIKEN.md`, `ROTFALL_STATE/OFFEN.md`, `ROTFALL_STATE/hunt/BERICHT.md`.

**So wurde geprüft.** Die Item-Tabelle ist aus dem Code erzeugt. Ein Skript hat jeden Schlüssel aus `ITEMS` (data.js) in allen Quelldateien gesucht und jede Fundstelle einer Quelle zugeordnet: Ladenliste, Beutetabelle, Bossbeute, Kopfgeld-Elite, Auftrag, Truhe, Rezept, Gewölbe-Truhe, Waffenständer, Geheimer Ort, Sonderbeute. Die Ladenlisten habe ich zusätzlich **im laufenden Spiel** nachgezählt, und zwar zweimal: im echten Spielstand des Entwicklers (nur gelesen) und in einem frisch begonnenen Wegwerfspiel (Platz `ztestD`, danach gelöscht). Läden, Schmiede, Tierhändler, Stall, Kutsche, Betriebe, Handwerk, Lager, Waffenständer und alle 22 Fenster habe ich im Browser bedient und dabei Gold, Gepäck und Fenstermaße gemessen. Der echte Spielstand ist danach nachweislich unverändert (Vergleich mit `rotfall.backup.s14c`: identisch).

**Wichtig:** Während der Prüfung haben andere Agenten `game.js` geändert. Zeilennummern können um einige Zeilen abweichen. Deshalb steht bei jeder Fundstelle auch der Funktionsname.

## Inhaltsverzeichnis
1. [Gegenstände: Grundregeln](#1-gegenstände-grundregeln)
   - 1.1 Ausrüstungsplätze · 1.2 Seltenheit und Affixe · 1.3 Legendäre Effekte · 1.4 Unikate und Mythisch · 1.5 Zustand und Verschleiß · 1.6 Güte (Handwerk) · 1.7 Beute-Regeln · 1.8 Sonderquellen (Gewölbe, Waffenständer, Schatzgerücht, Gräber)
2. [Vollständige Item-Tabelle (295 Einträge)](#2-vollständige-item-tabelle)
3. [Sets (ARMOR_SETS)](#3-sets-armor_sets)
4. [Rezepte und Handwerk (RECIPES)](#4-rezepte-und-handwerk)
5. [Läden und Preise](#5-läden-und-preise)
   - 5.1 Preisformel · 5.2 Sortimente je Händler · 5.3 Stadtwaren · 5.4 Schwarzmarkt · 5.5 Handelsfenster
6. [Kontor, Handelswagen, Lieferaufträge](#6-kontor-handelswagen-lieferaufträge)
7. [Betriebe (Kasse, Überfall, Besatzung)](#7-betriebe)
8. [Bank und Lager](#8-bank-und-lager)
9. [Siedlung](#9-siedlung)
10. [Schmied: Ausbessern, Verbessern, Schmieden lassen](#10-schmied)
11. [Heiler](#11-heiler)
12. [Tierhändler, Pferdehof, Stall](#12-tierhändler-pferdehof-stall)
13. [Kutsche, Schiff, Luftschiff](#13-kutsche-schiff-luftschiff)
14. [Investieren (Stadtkasse)](#14-investieren-stadtkasse)
15. [Alle Fenster und Menüs](#15-alle-fenster-und-menüs)
16. [Systeme, die noch nur eine Dialogliste haben (mit Bewertung)](#16-systeme-ohne-fenster)
17. [Koop: was Gäste können und was fehlt](#17-koop)
18. [Speichern, Laden, Plätze, Cloud-Export](#18-speichern-laden-plätze-cloud-export)
19. [Zusammenfassung Fehlversuche](#19-zusammenfassung-fehlversuche)

---

## 1. Gegenstände: Grundregeln

### 1.1 Ausrüstungsplätze
- **Was es ist:** Der Held trägt Ausrüstung an 9 Plätzen: Waffe, Nebenhand, Kopf, Rumpf, Hände, Beine, Füße, Umhang und Talisman (`GEAR`, game.js oben bei `mkItem`). Eine Zweihandwaffe leert die Nebenhand. Einige Klassen führen zwei Waffen (`DUAL_CLASSES`); ein ausgefallener linker Arm verhindert das (HB-21, behoben).
- **Bedienung:** im Gepäck-Fenster (I) über die Papierpuppe. Doppelklick legt an oder ab, man kann auch ziehen. Ein Schloss sperrt ein Teil gegen Verkauf und Ablegen.
- **Geprüft:** Fenster geöffnet, An- und Ablegen per Code-Aufruf. Die Ziehen-Bedienung habe ich nicht mit der Maus getestet.

### 1.2 Seltenheit und Affixe
- **Was es ist:** Jedes gefundene Ausrüstungsteil würfelt seine eigene Seltenheit (`rollRarity`). Die Chancen sind: Gewöhnlich 62 %, Ungewöhnlich 24 %, Selten 10 %, Episch 3,5 %, Legendär 0,5 % (`RARITY_DROP`). Mythisch würfelt nie. Ein Teil wird nie schlechter als seine Grundseltenheit. Gefährliche Gegner heben die Chancen ab „Selten“ (Bonus × 0,5 je Gefahrenstufe; Boss +1, Elite +1).
- **Wert:** Der Verkaufswert steigt mit der Seltenheit (`RARITY_VALUE`): ×1 / ×1,35 / ×1,9 / ×3 / ×5 / ×8 (Mythisch).
- **Affixe** (`AFFIXES`, 15 Stück — der alte Ist-Zustand nannte 16, gezählt sind es 15):

  | Affix | Plätze | Spanne |
  |---|---|---|
  | Schärfe | Waffe, Talisman | Schaden +6–14 % |
  | Leichtigkeit | Waffe | Schlagtempo +5–12 % |
  | Auge | Waffe, Talisman, Hände | Krit +3–7 % |
  | Durchschlag | Waffe | Panzerbrechend +10–25 % |
  | Atem | Waffe | Ausdauer je Hieb −10–25 % |
  | Härte | fast alle Rüstplätze | Rüstung +1–3 |
  | Lebenskraft | Rumpf, Kopf, Umhang, Beine, Talisman | Leben +3–7 % |
  | Leichtfuß | Füße, Umhang, Rumpf, Beine, Talisman | Tempo +2–5 % |
  | Zähigkeit | Rumpf, Kopf, Füße, Umhang, Beine, Talisman | Ausdauer +8–16 |
  | Blutzoll (major) | Waffe | 4–8 % Lebensraub |
  | Zerfetzen (major) | Waffe | +20–35 % Blutungschance |
  | Arkane Kraft | Talisman, Hände | Zauberschaden +5–12 % |
  | Totenbann | Talisman, Waffe | gegen Untote +10–20 % |
  | Schützenauge | Talisman, Hände | Fernkampf +6–14 % |
  | Dornen (major) | Rumpf, Nebenhand | 15–25 % Nahkampfschaden zurück |
- **Anzahl je Seltenheit:** Ungewöhnlich 1, Selten 2, Episch 3 (davon einer „major“), Legendär 2 plus ein Legendärer Effekt. Fernwaffen bekommen kein Blutzoll und kein Zerfetzen.
- **Geprüft:** im Spiel. Ein beim Schmied geschmiedeter Dolch kam „Meisterlich“ als „selten“ mit 2 Affixen (Schärfe 0,10, Auge 0,07). Ein Kurzschwert wurde auf „Gut“ verbessert und bekam „ungewöhnlich“ mit Totenbann 0,13. Beides stimmt mit den Regeln überein.

### 1.3 Legendäre Effekte (`LEGENDS`)
- **Blutdurst** (Waffe): Jeder Todesstoß heilt 8 % Leben.
- **Nachhall** (Waffe): Mit 20 % Chance trifft ein Hieb ein zweites Mal, mit halbem Schaden.
- **Ahnenwall** (Rumpf, Nebenhand, Kopf): unter 30 % Leben +8 Rüstung.
- **Lücke:** Für Umhang, Hände, Beine, Füße und Talisman gibt es keinen legendären Effekt. Ein legendärer Umhang hat dann nur 2 Affixe (`rollRarity`: `if (L.length)`). Das ist kein Absturz, aber der Effekt fehlt schweigend.

### 1.4 Unikate und Mythisch
- `unique:true`-Teile würfeln keine Seltenheit und keine Affixe. Sie fallen auch nie aus der Gewölbe-Truhe.
- **Mythisch** (fest): Sternenklinge (Omega), Nachtfrost (Hrodvar), Blutkult-Sense (Ende des Blutkults).
- **Feste Legendäre mit eigener Quelle:**
  - Sturmanker (Weißbart), Der Rote Henker (Varg), Goraks Hackmesser, Morrs Keule (Dodon), Garmadons Reue, Kanzlerdegen (Aldhelm);
  - Klinge des Sandfürsten und Leitwolfzahn (sichere Beute der Regionalbosse, `die`);
  - Nachtglasstab (Ilvar), Rotfall-Klinge (Rotfall-Spur, `rotfallDone`), Die letzte Wache (Relikt, `RELICS`).
- **Ohne Quelle (Fehlversuch):** **Sturmsense** und **Donnerwort** (beide `unique`, legendär, data.js:103–104). Nur der Selbsttest erwähnt sie; im Spiel sind sie nicht zu bekommen. Der Lore-Text der Sturmsense nennt Hundertfeld; dort verkauft die Sensenschmiedin Walburga aber nur `SCYTHES` ohne die Sturmsense.

### 1.5 Zustand und Verschleiß
- **Was es ist:** Jedes Ausrüstungsteil hat einen Zustand `cond` von 0 bis 1. Gekaufte und gefundene Teile kommen mit 55–100 % (`mkItem`). Die Rüstung eines Teils zählt mit `0,4 + 0,6 × Zustand` (`armorParts`), ein Teil auf 0 % gibt also noch 40 % seiner Rüstung. Treffer nutzen die Teile ab.
- **Ausbessern:**
  - beim Schmied auf 100 % (§10);
  - selbst an Esse, Amboss oder Werkbank bis 80 %;
  - an der Siedlungs-Werkbank bis 80 %, an der Siedlungsschmiede bis 100 % (§9).
- **Anzeige:** Im Gepäck zeigt ein Balken den Verschleiß rot gestreift. Ein Hammer-Symbol erscheint, wenn ein Teil unter 50 % fällt.
- **Prothesen** haben einen eigenen Zustand mit Wartung (Bereich Bionik, Werkbank-Fenster §15).

### 1.6 Güte (Handwerk, `QUAL`)
- Es gibt 5 Stufen: Grob (Zustand 60 %), Solide, Gut (hebt auf Ungewöhnlich), Meisterlich (hebt auf Selten), Meisterstück (hebt auf Episch).
- **Formel:** `q = Fertigkeit/100 × 0,75 + Zufall × 0,35 − 0,05`. Königseisen hebt das Ergebnis um eine Stufe.
- **Gekauft oder gefunden:** Ein solches Teil zählt beim Verbessern als „Solide“.

### 1.7 Beute-Regeln (`dropLoot`, `lootTier`)
- **Ausrüstung aus der Beutetabelle (`LOOT`):**
  - Normale Gegner lassen sie nur mit ×0,35 der Chance fallen, Elite, Veteran und Anführer mit ×1,5.
  - Alles wird mit dem Beute-Faktor der Schwierigkeit multipliziert.
  - In 50 % der Fälle gibt es zusätzlich 1–6 Gold plus die Stufe des Gegners.
- **Bosse:** Sie würfeln aus `BOSS_LOOT`: 90 % eine Waffe, 60 % ein Rüstungsteil, 25 % ein Einzelstück. Ausrüstung aus `LOOT[boss]` zählt dann nicht mehr. Tränke, Karten und Schlüssel fallen weiter.
- **Kopfgeld-Elite** (`eliteDrop`):
  - ihr festes Teil (mit Gefahrenbonus 2);
  - eine **Trophäe** (Name „Trophäe: …“, Wert 90);
  - 40 + 6 × Stufe Gold.
- **Gegner-Ausrüstung:** Gegner der Art `enemy` lassen ihre getragene Ausrüstung **nicht** fallen. Getötete NPCs (`kind:'npc'`) hinterlassen dagegen ein **Grab** mit ihrer ganzen Ausrüstung und ihrem Gepäck (`makeGrave`). Dadurch sind Teile erreichbar, die nur Wachen oder Hauptleute tragen — aber nur durch Mord.
- **Geprüft:** nur Code gelesen. Die Beute-Raten habe ich nicht gemessen.

### 1.8 Sonderquellen
- **Gewölbe-Truhe** (`vaultLoot`):
  - Inhalt: Trank, Verband und dazu 1–3 zufällige Ausrüstungsteile (Waffe, Rumpf, Kopf oder Nebenhand, kein Unikat).
  - Wertspanne je Stufe: 1: 20–120, 2: 60–240, 3: 120–400, 4: 200–700, 5: 260–900 Gold.
  - Viele Teile ohne eigene Quelle kommen nur hierüber (z. B. Tiefenschürfer, Turmschild, Dornenpeitsche). Hände, Beine, Füße, Umhänge und Talismane kommen **nie** aus Gewölben.
- **Waffenständer durchsuchen** (`rummage`):
  - Mit 60 % Chance eine zufällige Waffe im Wert bis 60. Gesehenes Durchsuchen fremder Möbel ist Diebstahl (40 Kopfgeld).
  - **FEHLER (live bestätigt):** Der Code hängt die gewürfelte Waffe an die gemeinsame Liste `RUMMAGE.weapon_rack` an (`pool.push`, game.js ~5540, `rummage`). Dadurch wird die Liste mit jedem Durchsuchen länger, bis die Seite neu geladen wird.
  - Messung: 40 Durchsuchungen ergaben `0,0,1,0,2,2,0,4,3,1,5,3,4,5,3,6,…,13,8,9,10,10,5` Waffen. In den ersten 10 Durchsuchungen fielen zusammen 13 Waffen, in den letzten 10 zusammen 93. Das ist eine Gegenstandsvermehrung.
- **Schatzgerücht** (`rumorTick`, Gerüchte mit Zielen): Eine „Vergrabene Kiste“ enthält Langschwert, Rapier, Kriegssichel, Langbogen oder Kettenpanzer, dazu einen Trank und eines von: Talisman der Ausdauer, Talisman des Kriegers, Elixier der Stärke, Trank. Lügt das Gerücht, ist die Kiste leer.
- **Feste Truhen der Welt** (world.js, `loot:`): Alte Truhe, Ordenskapelle, Wüstengruft, Räuberversteck, Tempelkammer, Gruft von Alt-Vharn, Grabkammer der Feste, Hort des Toten Königs (Garmadons Krone und Reue), Tiefhall-Hort (Königseisen), Schrein des Himmelssplitters, Schatzkammer der Grube und andere. Die Einträge stehen in der Tabelle.

---

## 2. Vollständige Item-Tabelle

**So liest man die Tabelle:**
- Alle 295 Einträge aus `ITEMS` stehen in der Reihenfolge von data.js, nach Platz gruppiert.
- „Werte“ sind die Grundwerte. „Wert“ ist der Grundpreis in Gold.
- „Bezugsquelle“ nennt jede gefundene Quelle.
- **„KEINE QUELLE“** heißt: Im ganzen Code gibt es keinen Weg, das Teil zu bekommen (außer Debug oder Selbsttest). Das ist ein Fehlversuch.
- **„nur durch Mord an diesem NPC“** heißt: Nur ein benannter NPC trägt das Teil. Man bekommt es nur aus seinem Grab.
- **„alte Stände: fehlt“** heißt: Die Ladenliste dieses Händlers wurde nach dem Spielbeginn erweitert. In bestehenden Spielständen verkauft er die neue Ware **nicht** (siehe §5.2, Fehler F-02).
- **Gewölbe-Truhe** und **Waffenständer** sind regelbasierte Quellen (§1.8).

#### Waffen (80)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `rusty_sword` | Rostiges Kurzschwert | Schaden 7, Reichw. 40, 520 ms | gewöhnl. | 18 | — | Startausrüstung (Herkunft); Beute: Goblin; Beute: Bandit; Beute: Untoter Krieger; Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Laden: Stadtschmiede; Laden: Standardware (Händler ohne Liste); NPC trägt es (nur über Grab nach Mord); Waffenständer durchsuchen (60 %) |
| `longsword` | Langschwert | Schaden 12, Reichw. 46, 560 ms | ungew. | 90 | — | Laden: Brann; NPC trägt es (nur über Grab nach Mord); Kopfgeld-Elite: Hagen der Schlitzer; Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Laden: Stadtschmiede; Laden: Hagen (Schmied); Schatzgerücht → vergrabene Kiste; Laden: Standardware (Händler ohne Liste); Truhe/Kiste: Feldkiste der Hundert; Truhe/Kiste: Alte Truhe; Handwerk: Esse; Gewölbe-Truhe Stufe 1/2 |
| `frostblade` | Frostklinge | Schaden 16, Reichw. 48, 560 ms | episch | 320 | — | Auftrag: Königseisen (q_kingsiron); Kopfgeld-Elite: Irmhild vom Frostgrab; Gewölbe-Truhe Stufe 3/4/5 |
| `greatsword` | Zweihänder | Schaden 22, Reichw. 56, 980 ms | selten | 220 | Zweihand | Laden: Brann; Truhe/Kiste: Wüstengruft; Gewölbe-Truhe Stufe 2/3/4 |
| `axe` | Beil | Schaden 11, Reichw. 38, 680 ms, Durchschl. 25 % | gewöhnl. | 34 | — | Startausrüstung (Herkunft); Beute: Goblin-Krieger; Laden: Brann; NPC trägt es (nur über Grab nach Mord); Kopfgeld-Elite: Otmar Brandschatz; Kopfgeld-Elite: Knarz der Grubenkönig; Laden: Stadtschmiede; Laden: Standardware (Händler ohne Liste); Handwerk: Esse; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `greataxe` | Große Axt | Schaden 25, Reichw. 52, 1080 ms, Durchschl. 35 % | selten | 260 | Zweihand | Laden: Brann; NPC trägt es (nur über Grab nach Mord); Gewölbe-Truhe Stufe 3/4/5 |
| `chain_whip` | Kettenpeitsche | Schaden 9, Reichw. 84, 700 ms | selten | 230 | fesselt; Waffe der Eisernen Kette: reicht weit, fesselt kurz (−40 % Tempo, 1,5 s). Wenig Schaden, viel Kontrolle. | Beute: Varg, Kettenmeister; Bossbeute: Varg, Kettenmeister; Kopfgeld-Elite: Veit mit der Peitsche; NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 2/3/4 |
| `goblin_hook` | Hakenmesser | Schaden 7, Reichw. 30, 340 ms, Krit ×2.2, Blutung 30 % | ungew. | 120 | Goblinarbeit aus Grubeneisen. Der Haken reißt: 30 % Blutung. | Laden: Nibbel (Goblinhändlerin); Laden: frei_tobbe (Tobbe Ascherling); Gewölbe-Truhe Stufe 1/2/3 |
| `morgenstern` | Morgenstern | Schaden 15, Reichw. 38, 820 ms, Durchschl. 45 %, Taumeln ×1.8 | selten | 200 | — | Laden: Stadtschmiede; Gewölbe-Truhe Stufe 2/3/4 |
| `kettenkugel` | Kettenkugel | Schaden 17, Reichw. 56, 940 ms, Taumeln ×1.6 | selten | 240 | Schwung | Laden: Stadtschmiede; Gewölbe-Truhe Stufe 2/3/4 |
| `katar` | Katar | Schaden 9, Reichw. 28, 320 ms, Durchschl. 50 %, Krit ×2.4 | ungew. | 130 | — | Laden: Yusuf (Basarhändler); Gewölbe-Truhe Stufe 2/3 |
| `schrottkeule` | Schrottkeule | Schaden 11, Reichw. 36, 700 ms, Taumeln ×1.4 | gewöhnl. | 36 | — | Beute: Goblin-Krieger; Laden: Nibbel (Goblinhändlerin); Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `schrottklinge` | Schrottklinge | Schaden 10, Reichw. 40, 540 ms, Blutung 25 % | ungew. | 70 | — | Beute: Goblin; Laden: Nibbel (Goblinhändlerin); Gewölbe-Truhe Stufe 1/2 |
| `flail` | Streitflegel | Schaden 13, Reichw. 46, 820 ms | selten | 210 | Schwung; Schwung: Treffer in rascher Folge +15 % je Stufe (bis 3); ab der dritten Stufe trifft die Kugel rundum. Wer zö… | Beute: Kettenknecht; Beute: Hauptmann der Toten; Laden: Brann; Auftrag: Die Straße nach Aschfurt (q_sandlord); NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 2/3/4 |
| `mace` | Streitkolben | Schaden 13, Reichw. 36, 740 ms, Durchschl. 40 %, Taumeln ×1.6 | ungew. | 110 | — | Laden: Brann; NPC trägt es (nur über Grab nach Mord); Gewölbe-Truhe Stufe 1/2 |
| `spear` | Speer | Schaden 10, Reichw. 74, 640 ms | gewöhnl. | 48 | — | Beute: Goblin-Krieger; Beute: Speerträger; Laden: Brann; Laden: Oda; Kopfgeld-Elite: Harpunen-Hella; NPC trägt es (nur über Grab nach Mord); Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Laden: Stadtschmiede; Laden: Standardware (Händler ohne Liste); Handwerk: Esse; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `dagger` | Dolch | Schaden 5, Reichw. 26, 300 ms, Krit ×2.6 | gewöhnl. | 22 | — | Startausrüstung (Herkunft); Beute: Bandit; Beute: Blutschöpfer; Beute: Hofspion; Beute: Maskierter; Laden: Sael; NPC trägt es (nur über Grab nach Mord); Laden: Stadtschmiede; Handwerk: Esse; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `lederpeitsche` | Lederpeitsche | Schaden 6, Reichw. 96, 480 ms | gewöhnl. | 45 | zieht heran | Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `dornenpeitsche` | Dornenpeitsche | Schaden 8, Reichw. 100, 520 ms, Blutung 25 % | selten | 260 | zieht heran | Gewölbe-Truhe Stufe 3/4/5 |
| `grassense` | Grassense | Schaden 13, Reichw. 56, 900 ms | gewöhnl. | 40 | Zweihand; trifft im Bogen | Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Handwerk: Esse (Schmieden 10); Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `erntesense` | Erntesense | Schaden 17, Reichw. 60, 940 ms | ungew. | 120 | Zweihand; trifft im Bogen | Gewölbe-Truhe Stufe 1/2/3 |
| `doppelsense` | Doppelsense | Schaden 19, Reichw. 58, 980 ms, Blutung 15 % | selten | 340 | Zweihand; trifft im Bogen | Gewölbe-Truhe Stufe 3/4/5 |
| `mondsense` | Mondsense | Schaden 24, Reichw. 64, 950 ms, Durchschl. 25 % | episch | 620 | Zweihand; trifft im Bogen | Gewölbe-Truhe Stufe 4/5 |
| `kriegssense` | Kriegssense | Schaden 20, Reichw. 60, 980 ms | ungew. | 150 | Zweihand; trifft im Bogen | Kopfgeld-Elite: Aschenkönigin Sabeth; Laden: Stadtschmiede; Gewölbe-Truhe Stufe 2/3 |
| `kriegssichel` | Kriegssichel | Schaden 12, Reichw. 40, 600 ms, Durchschl. 15 % | ungew. | 80 | — | Beute: Bandit; Kopfgeld-Elite: Karim Sandgeist; Kopfgeld-Elite: Kapitän Seeteufel; Laden: Stadtschmiede; Laden: Yusuf (Basarhändler); Schatzgerücht → vergrabene Kiste; Handwerk: Esse (Schmieden 15); Gewölbe-Truhe Stufe 1/2 |
| `doppelklinge` | Doppelklinge | Schaden 17, Reichw. 52, 760 ms | selten | 240 | Zweihand; trifft im Bogen | Kopfgeld-Elite: Wendel die Krähe; Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 2/3/4 |
| `schlagkralle` | Schlagkralle | Schaden 8, Reichw. 30, 330 ms | gewöhnl. | 40 | — | Laden: Stadtschmiede; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `wurfmesser` | Wurfmesser | Schaden 8, Reichw. 300, 680 ms | gewöhnl. | 45 | Fernkampf | Beute: Bandit; Kopfgeld-Elite: Die Stille Mathilde; Kopfgeld-Elite: Flinkfinger Zick; Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Laden: Yusuf (Basarhändler); Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `wurfbeil` | Wurfbeil | Schaden 14, Reichw. 260, 900 ms, Durchschl. 20 % | ungew. | 90 | Fernkampf | Beute: Goblin-Krieger; Laden: Stadtschmiede; Laden: Yusuf (Basarhändler); Gewölbe-Truhe Stufe 1/2 |
| `schleuder` | Schleuder | Schaden 7, Reichw. 340, 700 ms | gewöhnl. | 15 | Fernkampf | Beute: Goblin-Krieger; Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Waffenständer durchsuchen (60 %) |
| `messingpistole` | Messingpistole | Schaden 24, Reichw. 320, 320 ms, Nachladen 2200 ms, Durchschl. 60 %, 6 Energie/Schuss | selten | 380 | Fernkampf; Magitech | Beute: Kriegsautomat; Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 3/4/5 |
| `schockpistole` | Schockpistole | Schaden 12, Reichw. 260, 320 ms, Nachladen 800 ms, 5 Energie/Schuss | ungew. | 260 | Fernkampf; Magitech | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Laden: Yusuf (Basarhändler); Handwerk: Werkbank (Handwerk 30); Gewölbe-Truhe Stufe 3/4/5 |
| `magiegewehr` | Magiegewehr | Schaden 30, Reichw. 520, 360 ms, Nachladen 1200 ms, Durchschl. 60 %, 10 Energie/Schuss | selten | 560 | Zweihand; Fernkampf; Magitech; Rangsperre Aurelion 2 | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 4/5 |
| `runenarmbrust` | Runenarmbrust | Schaden 28, Reichw. 440, 420 ms, Nachladen 1500 ms, Durchschl. 50 %, 6 Energie/Schuss | selten | 480 | Zweihand; Fernkampf; Magitech; Rangsperre Aurelion 2 | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 4/5 |
| `kristallkanone` | Kristallkanone | Schaden 40, Reichw. 380, 420 ms, Nachladen 2600 ms, Durchschl. 30 %, 25 Energie/Schuss | episch | 980 | Zweihand; Fernkampf; Magitech; Rangsperre Aurelion 3 | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt) |
| `praezisionsgewehr` | Präzisionsgewehr | Schaden 48, Reichw. 680, 420 ms, Nachladen 3200 ms, Durchschl. 90 %, 15 Energie/Schuss | episch | 1200 | Zweihand; Fernkampf; Magitech; Rangsperre Aurelion 3 | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt) |
| `zwergenaxt` | Zwergenaxt | Schaden 17, Reichw. 40, 700 ms, Durchschl. 40 % | selten | 220 | — | Laden: Hilda Eisenfaust (Runenschmiedin); Gewölbe-Truhe Stufe 2/3/4 |
| `runenhammer` | Runenhammer | Schaden 27, Reichw. 44, 1150 ms, Durchschl. 65 %, Taumeln ×2.1 | episch | 420 | Zweihand; zertrümmert | Laden: Hilda Eisenfaust (Runenschmiedin); Gewölbe-Truhe Stufe 4/5 |
| `donnerbuechse` | Donnerbüchse | Schaden 40, Reichw. 480, 380 ms, Nachladen 3200 ms, Durchschl. 80 %, 12 Energie/Schuss | episch | 650 | Zweihand; Fernkampf; Magitech | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 4/5 |
| `sturmsense` | Sturmsense | Schaden 27, Reichw. 62, 960 ms | legendär | 700 | Zweihand; Unikat; trifft im Bogen | **KEINE QUELLE** (Fehlversuch) |
| `donnerwort` | Donnerwort | Schaden 52, Reichw. 500, 380 ms, Nachladen 3000 ms, Durchschl. 90 %, 12 Energie/Schuss | legendär | 900 | Zweihand; Fernkampf; Magitech; Unikat | **KEINE QUELLE** (Fehlversuch) |
| `shortbow` | Kurzbogen | Schaden 9, Reichw. 360, 700 ms | gewöhnl. | 55 | Fernkampf | Startausrüstung (Herkunft); Beute: Banditenschütze; Beute: Knochenschütze; Laden: Gerold; Kopfgeld-Elite: Nadira die Skorpionin; NPC trägt es (nur über Grab nach Mord); Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Laden: Yusuf (Basarhändler); Laden: Standardware (Händler ohne Liste); Handwerk: Werkbank; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `longbow` | Langbogen | Schaden 18, Reichw. 460, 920 ms | selten | 190 | Zweihand; Fernkampf | Laden: Gerold; NPC trägt es (nur über Grab nach Mord); Auftrag: Graumähne (q_greymane); Kopfgeld-Elite: Ruprecht Einauge; Schatzgerücht → vergrabene Kiste; Truhe/Kiste: Räuberversteck; Handwerk: Werkbank (Handwerk 25); Gewölbe-Truhe Stufe 2/3 |
| `rapier` | Rapier | Schaden 9, Reichw. 54, 380 ms, Krit ×2.2 | ungew. | 150 | Riposte | Laden: Gerold; NPC trägt es (nur über Grab nach Mord); Kopfgeld-Elite: Galgenstrick Fritz; Schatzgerücht → vergrabene Kiste; Gewölbe-Truhe Stufe 2/3 |
| `warhammer` | Kriegshammer | Schaden 24, Reichw. 44, 1150 ms, Durchschl. 60 %, Taumeln ×2.0 | selten | 240 | Zweihand; zertrümmert | Laden: Brann; Kopfgeld-Elite: Brakk Kettenbrecher; Gewölbe-Truhe Stufe 2/3/4 |
| `halberd` | Hellebarde | Schaden 17, Reichw. 82, 920 ms, Durchschl. 30 % | selten | 210 | Zweihand; trifft im Bogen | Laden: Brann; Laden: Oda; Kopfgeld-Elite: Gunther Rotbart; NPC trägt es (nur über Grab nach Mord); Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 2/3/4 |
| `crossbow` | Armbrust | Schaden 26, Reichw. 420, 420 ms, Nachladen 1900 ms, Durchschl. 50 % | ungew. | 170 | Zweihand; Fernkampf | Beute: Kopfgeldjäger; Beute: Kettenschütze; Laden: Gerold; Laden: Oda; NPC trägt es (nur über Grab nach Mord); Kopfgeld-Elite: Adelheid vom Hohlweg; Gewölbe-Truhe Stufe 2/3 |
| `wand` | Zauberstab | Schaden 7, Reichw. 320, 460 ms | ungew. | 160 | Fernkampf | Beute: Kultist der Asche; Laden: Gerold; Laden: Sael; Kopfgeld-Elite: Aschepriester Morn; Kopfgeld-Elite: Die Schattenseherin; Gewölbe-Truhe Stufe 2/3 |
| `pickaxe` | Spitzhacke | Schaden 8, Reichw. 34, 760 ms | gewöhnl. | 26 | — | Laden: Stadtschmiede; Laden: Balin Silberbart (Zwergenhändler); Laden: frei_tobbe (Tobbe Ascherling); Laden: Standardware (Händler ohne Liste); Truhe/Kiste: Werkzeugtruhe; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `staff` | Stab | Schaden 6, Reichw. 40, 620 ms | gewöhnl. | 40 | Zweihand | Beute: Blutmagier; Beute: Kultist der Asche; Beute: Nekromant; Laden: Sael; NPC trägt es (nur über Grab nach Mord); Truhe/Kiste: Tempelkammer; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `schrott_hellebarde` | Schrott-Hellebarde | Schaden 14, Reichw. 78, 900 ms, Durchschl. 20 % | gewöhnl. | 85 | Zweihand; trifft im Bogen | Laden: Oda; NPC trägt es (nur über Grab nach Mord); Gewölbe-Truhe Stufe 1/2 |
| `rabenbeil` | Rabenbeil | Schaden 12, Reichw. 34, 640 ms | ungew. | 120 | Der Kopf biegt sich nach hinten wie ein Schnabel. +35 % Schaden gegen Ungerüstete. | Beute: Bandit; Laden: Brann; Gewölbe-Truhe Stufe 1/2/3 |
| `morrs_keule` | Morrs Keule | Schaden 24, Reichw. 40, 880 ms, Durchschl. 45 %, Taumeln ×2.2 | legendär | 950 | Unikat; Dodons Keule aus einem Kettenpfahl. Wer getroffen wird, taumelt lange. | Bossbeute: Dodon, Hüter von Morrgrund |
| `sandfuerstenklinge` | Klinge des Sandfürsten | Schaden 17, Reichw. 46, 500 ms, Blutung 35 % | legendär | 900 | Unikat; Karraks Krummsäbel. Er schneidet tief, jede Wunde blutet. | Sichere Beute: Sandfürst (Regionalboss Wüste) |
| `rotfallklinge` | Rotfall | Schaden 18, Reichw. 48, 540 ms, Blutung 20 % | legendär | 950 | Unikat; Geschmiedet aus dem Eisen, auf das Omegas Blut regnete. Wer die ganze Spur des Rotfalls kennt, trägt sie. Ihre… | Belohnung Rotfall-Spur (rotfallDone, q_rotfall) |
| `leitwolfzahn` | Leitwolfzahn | Schaden 10, Reichw. 28, 300 ms, Krit ×2.8, Blutung 30 % | legendär | 700 | Unikat; Ein Reißzahn in Knochen gefasst. Von hinten tödlich, und er lässt bluten. | Sichere Beute: Leitwolf/Alpha (Regionalboss) |
| `nachtglasstab` | Nachtglasstab | Schaden 15, Reichw. 380, 420 ms | legendär | 1100 | Fernkampf; Unikat; Ilvars Stab mit einer Kugel aus schwarzem Glas. Die Blitze fliegen weiter und treffen härter. | Ilvar töten (ilvarSlain) |
| `dornensaebel` | Dornensäbel | Schaden 11, Reichw. 44, 540 ms, Blutung 20 % | ungew. | 140 | Widerhaken auf dem Rücken der Klinge. 20 % Blutung. | Beute: Kopfgeldjäger; Laden: Brann; Laden: Yusuf (Basarhändler); Truhe/Kiste: Truhe der Karawanserei; Gewölbe-Truhe Stufe 2/3 |
| `grabraeuber` | Grabräuber | Schaden 10, Reichw. 38, 460 ms | gewöhnl. | 45 | — | Beute: Bandit; Laden: Oda; Kopfgeld-Elite: Der Grabschänder Egbert; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `kriegspicke` | Kriegspicke | Schaden 14, Reichw. 36, 780 ms, Durchschl. 60 % | ungew. | 140 | — | Laden: Brann; Gewölbe-Truhe Stufe 2/3 |
| `sensenlanze` | Sensenlanze | Schaden 15, Reichw. 90, 960 ms | ungew. | 170 | Zweihand; trifft im Bogen | Laden: Brann; Gewölbe-Truhe Stufe 2/3 |
| `knochenspalter` | Knochenspalter | Schaden 26, Reichw. 50, 1100 ms, Taumeln ×1.4 | selten | 250 | Zweihand | Beute: Wächter der Nekropole; Bossbeute: Hrodvar, König unter dem Eis; Bossbeute: König Garmadon; Kopfgeld-Elite: Der Knochenfürst Varsk; Laden: Grimbart Knochenhand (Knochenschmied); Gewölbe-Truhe Stufe 3/4 |
| `henkersaxt` | Henkersaxt | Schaden 24, Reichw. 50, 1150 ms | selten | 300 | Zweihand; Gegen Verwundete (unter 50 % Leben) +50 % Schaden. | Beute: Kettenknecht; Gewölbe-Truhe Stufe 3/4/5 |
| `mauerbrecher` | Mauerbrecher | Schaden 28, Reichw. 48, 1300 ms, Durchschl. 70 %, Taumeln ×2.2 | episch | 480 | Zweihand; zertrümmert | Beute: Rotgardist; Bossbeute: Gorak, Grubenwart; Gewölbe-Truhe Stufe 4/5 |
| `seelenhaken` | Seelenhaken | Schaden 12, Reichw. 70, 760 ms | selten | 260 | Schwarzer Haken der Toten. Getroffene werden langsam (−40 %, 2,5 s). | Beute: Geist; Gewölbe-Truhe Stufe 3/4/5 |
| `totenglocke` | Totenglocke | Schaden 22, Reichw. 44, 1150 ms, Durchschl. 40 % | selten | 320 | Zweihand; Hohle Eisenglocke als Kopf. KLONG: Feinde um das Ziel verlieren den Mut (−20 % Schaden, 2,5 s). | Beute: Hauptmann der Toten; Bossbeute: König Garmadon; Kopfgeld-Elite: Die Totenglocke; Laden: Grimbart Knochenhand (Knochenschmied); Gewölbe-Truhe Stufe 3/4/5 |
| `rotklaue` | Rotklaue | Schaden 14, Reichw. 46, 560 ms | selten | 280 | Schwarze Klinge, rote Parierstange. Gegen Verwundete +20 % Schaden. | Beute: Rotgardist; Gewölbe-Truhe Stufe 3/4/5 |
| `schwarzzahn` | Schwarzzahn | Schaden 25, Reichw. 58, 1020 ms | episch | 520 | Zweihand; Breite schwarze Klinge mit roter Kerbe. Hinrichtung: unter 20 % Leben +50 % Schaden. | Beute: Rotgardist; Gewölbe-Truhe Stufe 4/5 |
| `kettenbrecher` | Kettenbrecher | Schaden 16, Reichw. 50, 860 ms | episch | 400 | Schwung; Drei Eisenkörper an kurzer Kette. Schwung wie der Streitflegel, breiter Bogen. | Beute: Kettenknecht; Bossbeute: Varg, Kettenmeister; NPC trägt es (nur über Grab nach Mord); Gewölbe-Truhe Stufe 3/4/5 |
| `eisenfalke` | Eisenfalke | Schaden 34, Reichw. 440, 460 ms, Nachladen 2600 ms, Durchschl. 70 % | episch | 420 | Zweihand; Fernkampf | Beute: Kettenschütze; Gewölbe-Truhe Stufe 4/5 |
| `roter_henker` | Der Rote Henker | Schaden 32, Reichw. 56, 1250 ms, Durchschl. 30 % | legendär | 950 | Zweihand; Unikat | Beute: Varg, Kettenmeister; Bossbeute: Varg, Kettenmeister |
| `entermesser` | Entermesser | Schaden 11, Reichw. 40, 500 ms | ungew. | 75 | — | Beute: Plünderer der Sturmklinge; Bossbeute: Weißbart, König der Sturmklinge; Auftrag: Beute für die Sturmklinge (q_klinge2); Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Gewölbe-Truhe Stufe 1/2 |
| `harpune` | Walharpune | Schaden 13, Reichw. 78, 700 ms, Durchschl. 25 % | ungew. | 90 | — | Beute: Harpunier; Bossbeute: Weißbart, König der Sturmklinge; Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Gewölbe-Truhe Stufe 1/2 |
| `sturmanker` | Der Sturmanker | Schaden 34, Reichw. 58, 1300 ms, Durchschl. 45 %, Taumeln ×2.2 | legendär | 1100 | Zweihand; Unikat; zertrümmert | Beute: Weißbart, König der Sturmklinge; Bossbeute: Weißbart, König der Sturmklinge |
| `garmadons_reue` | Garmadons Reue | Schaden 30, Reichw. 58, 1000 ms, Blutung 25 % | legendär | 1200 | Zweihand; Die Klinge des Toten Königs. Auf der Fehlschärfe: ein Name, ausgekratzt. | Bossbeute: König Garmadon; Truhe/Kiste: Hort des Toten Königs |
| `sternenklinge` | Sternenklinge | Schaden 26, Reichw. 50, 600 ms | mythisch | 2000 | Aus dem geschmiedet, was von Omegas Herz blieb. | Beute: Omega, der Gefallene; Bossbeute: Omega, der Gefallene |
| `kanzlerdegen` | Kanzlerdegen „Rotes Siegel“ | Schaden 18, Reichw. 48, 450 ms, Blutung 30 % | legendär | 1000 | Unikat; Aldhelms Degen. Wer einen Blutenden damit fällt, trinkt ein wenig von ihm: +8 % Leben. | Bossbeute: Aldhelm, Blutfürst von Varonheim |
| `blutsense` | Blutkult-Sense | Schaden 28, Reichw. 62, 960 ms, Blutung 20 % | mythisch | 1500 | Zweihand; Unikat; trifft im Bogen; Lebensraub 12 %; Lebensraub: 12 % des Schadens heilen dich (jeder Getroffene im Bogen zählt). | Ende des Blutkults, einmalig (cultEnd) |
| `nachtfrost` | Nachtfrost | Schaden 27, Reichw. 58, 1000 ms | mythisch | 900 | Zweihand; Unikat | Beute: Hrodvar, König unter dem Eis; Bossbeute: Hrodvar, König unter dem Eis |
| `gorak_cleaver` | Goraks Hackmesser | Schaden 18, Reichw. 44, 760 ms, Durchschl. 30 % | legendär | 520 | Unikat | Beute: Gorak, Grubenwart; Bossbeute: Gorak, Grubenwart |

#### Schilde (6)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `wooden_shield` | Holzschild | Rüstung 2, Block 30 % | gewöhnl. | 28 | — | Startausrüstung (Herkunft); Laden: Oda; Laden: Stadtschmiede; Laden: Standardware (Händler ohne Liste); Handwerk: Werkbank; Gewölbe-Truhe Stufe 1 |
| `buckler` | Eisenbuckler | Rüstung 1, Block 24 % | gewöhnl. | 36 | Klein: Parade-Fenster +60 %, hält aber nur ein Drittel eines Hiebs ab. | Laden: Brann; Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Handwerk: Werkbank; Gewölbe-Truhe Stufe 1 |
| `kite_shield` | Normannenschild | Rüstung 4, Block 42 % | ungew. | 130 | — | Beute: Kelchwächter; Beute: Knochenritter; Laden: Brann; NPC trägt es (nur über Grab nach Mord); Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Laden: Hagen (Schmied); Truhe/Kiste: Vergessene Nische; Truhe/Kiste: Verborgener Vorrat; Handwerk: Esse (Schmieden 15); Gewölbe-Truhe Stufe 2/3 |
| `tower_shield` | Turmschild | Rüstung 6, Block 57 %, Tempo −22 % | selten | 280 | Eine Wand: hält fast alles, kaum Parade, macht langsam. | Gewölbe-Truhe Stufe 3/4/5 |
| `stachelschild` | Stachelschild | Rüstung 3, Block 36 % | ungew. | 160 | Wer auf den Schild schlägt, verletzt sich an den Stacheln (35 % des Hiebs zurück). | Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 2/3 |
| `magitechschild` | Magitech-Schild | Rüstung 3, Block 40 %, 6 Energie/Schuss | episch | 760 | Magitech; Rangsperre Aurelion 2; Energiefeld: mit Energie hält es jeden Hieb ganz ab (6 Energie je Block, keine Ausdauer), leer wie ein Holzsch… | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 5 |

#### Rumpf (37)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `cloth_shirt` | Leinenkittel | Rüstung 1 | gewöhnl. | 8 | — | Startausrüstung (Herkunft); NPC trägt es (nur über Grab nach Mord) |
| `leather_jerkin` | Lederwams | Rüstung 4 | gewöhnl. | 45 | — | Startausrüstung (Herkunft); Beute: Bandit; Beute: Speerträger; Laden: Gerold; NPC trägt es (nur über Grab nach Mord); Laden: frei_tobbe (Tobbe Ascherling); Laden: Standardware (Händler ohne Liste); Handwerk: Werkbank; Gewölbe-Truhe Stufe 1 |
| `chain_hauberk` | Kettenpanzer | Rüstung 9 | ungew. | 190 | — | Beute: Kopfgeldjäger; Beute: Wächter der Nekropole; Beute: Hauptmann der Toten; Beute: Kelchwächter; Laden: Brann; Laden: Oda; Laden: Sael; NPC trägt es (nur über Grab nach Mord); Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Laden: Stadtschmiede; Laden: Hilda Eisenfaust (Runenschmiedin); Laden: Hagen (Schmied); Schatzgerücht → vergrabene Kiste; Laden: Standardware (Händler ohne Liste); Truhe/Kiste: Truhe der Kapelle; Truhe/Kiste: Feldkiste der Hundert; Truhe/Kiste: Gruft von Alt-Vharn; Handwerk: Esse (Schmieden 20); Gewölbe-Truhe Stufe 2/3 |
| `gambeson` | Steppwams | Rüstung 6 | gewöhnl. | 80 | — | Laden: Brann; Laden: Oda; Gewölbe-Truhe Stufe 1/2 |
| `brigandine` | Brigantine | Rüstung 11, Tempo −4 % | ungew. | 260 | — | Beute: Kettenknecht; Laden: Brann; NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 3/4/5 |
| `scale_mail` | Schuppenpanzer | Rüstung 13, Tempo −8 % | selten | 380 | — | Laden: Oda; Gewölbe-Truhe Stufe 3/4/5 |
| `pit_leather` | Grubenlederweste | Rüstung 8 | selten | 210 | Goblinarbeit: gegerbtes Grubenleder, leicht und zäh — hemmt nicht. | Laden: Nibbel (Goblinhändlerin); Laden: frei_tobbe (Tobbe Ascherling); Gewölbe-Truhe Stufe 2/3/4 |
| `kronharnisch` | Kronharnisch | Rüstung 12, Tempo −6 % | selten | 360 | — | Laden: Brann; Laden: Hagen (Schmied); Gewölbe-Truhe Stufe 3/4/5 |
| `ordensharnisch` | Harnisch des Weißen Ordens | Rüstung 13, Tempo −8 % | selten | 420 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 4/5 |
| `sonnenharnisch` | Sonnenharnisch | Rüstung 15, Tempo −8 % | episch | 620 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 4/5 |
| `plate_cuirass` | Plattenharnisch | Rüstung 15, Tempo −12 % | selten | 460 | — | Beute: Todesritter; Beute: Hrodvar, König unter dem Eis; Bossbeute: Hrodvar, König unter dem Eis; NPC trägt es (nur über Grab nach Mord); Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Truhe/Kiste: Grabkammer der Feste; Truhe/Kiste: Tiefhall-Hort; Truhe/Kiste: Schatzkammer; Handwerk: Esse (Schmieden 40); Gewölbe-Truhe Stufe 4/5 |
| `thronharnisch` | Thronharnisch | Rüstung 22, Tempo −8 % | legendär | 2600 | Blaue Magitech-Platte mit Goldkanten. Ein Kern in der Brust nimmt Stöße auf, leuchtende Adern laufen über die … | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `blutkette` | Blutkette | Rüstung 24, Tempo −13 % | legendär | 2400 | Schwarze Dornenplatte, Pelzkragen, Ketten über der Brust. Wer sie trägt, hat schon viele in Ketten gelegt. | Beute: Varg, Kettenmeister; Bossbeute: Varg, Kettenmeister |
| `sternwacht` | Sternwacht | Rüstung 21, Tempo −10 % | legendär | 2300 | Rüstung der Paladinmarschälle Omegas: goldene Schultern, blutroter Umhang, der Stern auf der Brust glüht. | **nur durch Mord an diesem NPC** — NPC Paladinmarschall Konrad trägt es (eliteKit, nur Grab nach Mord) |
| `totenkrone` | Totenkrone | Rüstung 22, Tempo −10 % | legendär | 2400 | Knochenplatte mit Dornen, grüne Runen, ein Umhang aus Grabtuch. Gegossen, wo Garmadon starb. | Beute: König Garmadon; Bossbeute: Hrodvar, König unter dem Eis; Bossbeute: König Garmadon; Laden: Grimbart Knochenhand (Knochenschmied) |
| `grubenkoenig` | Rüstung des Grubenkönigs | Rüstung 19, Tempo −6 % | legendär | 1900 | Zusammengeschweißt aus Kettenrüstung, Loren und Wolfspelz. Eine riesige Schulter, eine kleine — so ist sie gew… | Bossbeute: Gorak, Grubenwart; Bossbeute: Dodon, Hüter von Morrgrund |
| `generalspanzer` | Generalspanzer | Rüstung 21, Tempo −9 % | legendär | 2100 | Rooks Panzer: schwere Platte, blutroter Umhang, Pelz am Hals. Brutal und zweckmäßig. | **nur durch Mord an diesem NPC** — NPC Rook/Bandenführer (eliteKit, nur Grab) |
| `hochritter` | Harnisch des Hochritters | Rüstung 21, Tempo −10 % | legendär | 2200 | Blau gelackte Platte mit silbernen Schultern und dem Winkel der Krone. Nur Hauptleute Valens tragen sie. | **nur durch Mord an diesem NPC** — NPC trägt es (nur über Grab nach Mord); NPC Oda (eliteKit, nur Grab) |
| `meisterharnisch` | Harnisch des Ordensmeisters | Rüstung 21, Tempo −10 % | legendär | 2200 | Elfenbeinfarbene Platte, weißer Umhang, das rote Kreuz. Die Toten meiden ihn. | **nur durch Mord an diesem NPC** — NPC Kelan (eliteKit, nur Grab) |
| `todesritter_harnisch` | Harnisch der Eidwacht | Rüstung 10 | episch | 0 | gebunden; Klassenrüstung deathknight | Auftrag: Die kalte Klinge (dk_2) |
| `gewand_stille_schar` | Gewand der Stillen Schar | Rüstung 7 | episch | 0 | gebunden; Klassenrüstung necromancer | Auftrag: Das Gewand der Stillen Schar (c_nec2) |
| `robe_fluesternder` | Robe des Flüsternden | Rüstung 6 | episch | 0 | gebunden; Klassenrüstung warlock | Auftrag: Fäden aus dem Flüstern (c_war2) |
| `hainfell` | Hainfell | Rüstung 6 | episch | 0 | gebunden; Klassenrüstung druid | Auftrag: Das Fell des Leitwolfs (c_dru1) |
| `robe_stille_hand` | Robe der Stillen Hand | Rüstung 5 | episch | 0 | gebunden; Klassenrüstung monk | Auftrag: Die Robe der Generationen (c_mon2) |
| `seemantel` | Seemantel | Rüstung 5 | ungew. | 90 | Geteertes Leder, salzsteif. Hält Gischt ab, keine Klingen — fast. | Beute: Plünderer der Sturmklinge; Beute: Netzwerferin; Bossbeute: Weißbart, König der Sturmklinge; Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Gewölbe-Truhe Stufe 1/2 |
| `eisenwache` | Eisenwache | Rüstung 10 | ungew. | 220 | Schwarzer Brustpanzer über Kettenhemd, rote Schärpe. Die Uniform der Kette. | Beute: Kettenknecht; Beute: Kettenschütze; NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 2/3/4 |
| `rotgardist` | Rotgardistenpanzer | Rüstung 13, Tempo −6 % | selten | 420 | Schwarze Platte, rote Schulterstücke. Standhalten: +3 Rüstung, wenn ein Verbündeter nah ist. | Beute: Rotgardist; Auftrag: Eisen für die Grubenstämme (g_dod2); Gewölbe-Truhe Stufe 4/5 |
| `aufsehermantel` | Aufsehermantel | Rüstung 7 | ungew. | 160 | Schwarzer Ledermantel mit Eisenkragen und roten Armschienen. | Beute: Kettenknecht; NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 2/3 |
| `tiefenschuerfer` | Tiefenschürfer | Rüstung 8 | ungew. | 150 | Leder, Schulterbleche, dicke Handschuhe. Grubenarbeit, zur Rüstung geflickt. | Gewölbe-Truhe Stufe 2/3 |
| `kettenkoloss` | Kettenkoloss | Rüstung 15, Tempo −10 % | selten | 440 | Mehrere Lagen schwerer Kette über Leder. Kaum ein Schnitt kommt durch. | Laden: Brann; Gewölbe-Truhe Stufe 4/5 |
| `plattenmantel` | Plattenmantel | Rüstung 13, Tempo −6 % | selten | 400 | Langer Mantel aus überlappenden Eisenplatten. | Laden: Oda; Gewölbe-Truhe Stufe 3/4/5 |
| `pluendererharnisch` | Plündererharnisch | Rüstung 9 | ungew. | 150 | Alte Ritterplatte, Leder, Stoff — jedes Teil von woanders. | Beute: Bandit; Laden: Oda; Gewölbe-Truhe Stufe 2/3 |
| `grenzlaeufer` | Grenzläufer | Rüstung 5 | gewöhnl. | 90 | Lederweste, leichte Armschienen. Hemmt nicht. | Beute: Kopfgeldjäger; Laden: Oda; Gewölbe-Truhe Stufe 1/2 |
| `legionaersplatte` | Rostige Legionärsplatte | Rüstung 11, Tempo −6 % | ungew. | 180 | — | Beute: Untoter Krieger; Beute: Großes Skelett; Beute: Hauptmann der Toten; Gewölbe-Truhe Stufe 2/3 |
| `eisenfuerst` | Eisenfürst | Rüstung 18, Tempo −12 % | episch | 800 | Schwarze Platten, rote Linien, schwerer Umhang. Die Rüstung der Kettenmeister. | Beute: Varg, Kettenmeister; Bossbeute: Varg, Kettenmeister; NPC trägt es (nur über Grab nach Mord); Gewölbe-Truhe Stufe 5 |
| `letzte_wache` | Die letzte Wache | Rüstung 16, Tempo −5 % | legendär | 700 | Unikat | Relikt (RELICS) |
| `kanzlerrobe` | Robe des Kanzlers | Rüstung 6 | episch | 420 | Schwarzer Samt, rotes Futter. Nachts wärmer, als sie sein sollte. | Bossbeute: Aldhelm, Blutfürst von Varonheim; Gewölbe-Truhe Stufe 4/5 |

#### Kopf (36)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `kronhelm` | Kronhelm | Rüstung 7 | selten | 190 | — | Laden: Brann; Laden: Hagen (Schmied); Gewölbe-Truhe Stufe 2/3 |
| `ordenshelm` | Ordenshelm | Rüstung 8 | selten | 220 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 2/3/4 |
| `sonnenhelm` | Sonnenhelm | Rüstung 9 | episch | 320 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 3/4/5 |
| `leather_cap` | Lederkappe | Rüstung 2 | gewöhnl. | 20 | — | Beute: Goblin-Krieger; Beute: Banditenschütze; NPC trägt es (nur über Grab nach Mord); Laden: Weber (Marktstand); Laden: Marktstand/Kaufmann; Laden: Standardware (Händler ohne Liste); Handwerk: Werkbank; Gewölbe-Truhe Stufe 1 |
| `kettle_hat` | Eisenhut | Rüstung 4 | ungew. | 70 | — | Beute: Kettenknecht; Laden: Brann; NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 1/2 |
| `great_helm` | Topfhelm | Rüstung 8 | selten | 210 | — | Laden: Oda; NPC trägt es (nur über Grab nach Mord); Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 2/3/4 |
| `thronhelm` | Thronhelm | Rüstung 12 | legendär | 1200 | Mechanischer Helm des Hohen Rates: Goldflossen, blaues Sehband, man hört das Uhrwerk. | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `blutkettenhelm` | Gehörnter Kettenhelm | Rüstung 12 | legendär | 1100 | Geschlossen, zwei Eisenhörner, im Sehschlitz glimmt es rot. | Beute: Varg, Kettenmeister; Bossbeute: Varg, Kettenmeister |
| `sternwachthelm` | Sternkrone | Rüstung 11 | legendär | 1000 | Topfhelm mit goldener Zackenkrone. Durch den Schlitz leuchtet Omegas Licht. | **nur durch Mord an diesem NPC** — NPC Paladinmarschall Konrad (eliteKit, nur Grab) |
| `schaedelhelm` | Schädelhelm | Rüstung 12 | legendär | 1100 | Ein Totenkopf als Helm, eine Krone aus Knochenzacken. In den Höhlen brennt grünes Licht. | Beute: Todesritter; Beute: König Garmadon; Bossbeute: König Garmadon; Laden: Grimbart Knochenhand (Knochenschmied) |
| `schrotthelm` | Schrotthörner | Rüstung 10 | legendär | 800 | Ein Grubenhelm mit angenieteten Hörnern. | Bossbeute: Gorak, Grubenwart; Gewölbe-Truhe Stufe 5 |
| `generalshelm` | Visierhelm des Generals | Rüstung 11 | legendär | 950 | Schallern mit Visier. Hinter dem Spalt ist es dunkel — und dann rot. | **nur durch Mord an diesem NPC** — NPC Rook/Bandenführer (eliteKit, nur Grab) |
| `federhelm` | Federhelm | Rüstung 11 | legendär | 950 | Hoher Helm mit blauem Federbusch. | **nur durch Mord an diesem NPC** — NPC Oda (eliteKit, nur Grab) |
| `meisterhelm` | Meisterkrone | Rüstung 11 | legendär | 950 | Topfhelm mit silberner Zackenkrone und rotem Kamm. | **nur durch Mord an diesem NPC** — NPC Kelan (eliteKit, nur Grab) |
| `iron_helm` | Eisenhelm | Rüstung 5 | ungew. | 95 | — | Beute: Hauptmann der Toten; Beute: Hrodvar, König unter dem Eis; Bossbeute: Hrodvar, König unter dem Eis; Laden: Brann; Laden: Oda; NPC trägt es (nur über Grab nach Mord); Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Laden: Stadtschmiede; Laden: Hilda Eisenfaust (Runenschmiedin); Laden: Hagen (Schmied); Handwerk: Esse; Gewölbe-Truhe Stufe 1/2 |
| `wanderkapuze` | Wanderkapuze | Rüstung 1 | gewöhnl. | 18 | Spitzer Zipfel, grobe Wolle. Unter einer Kapuze brennt die Sonne nur halb so stark. | Beute: Bandit; Laden: Standardware (Händler ohne Liste) |
| `pilgerkapuze` | Pilgerkapuze | Rüstung 2 | gewöhnl. | 26 | Weit und tief, das Gesicht liegt ganz im Schatten. Unter einer Kapuze brennt die Sonne nur halb so stark. | Laden: Standardware (Händler ohne Liste); Gewölbe-Truhe Stufe 1 |
| `zaddelgugel` | Zaddelgugel | Rüstung 2 | ungew. | 64 | Gugel mit gezackter Schulterpelerine und langem Zipfel. Unter einer Kapuze brennt die Sonne nur halb so stark. | Laden: Hagen (Schmied); Gewölbe-Truhe Stufe 1/2 |
| `kettenhaube` | Kettenhaube | Rüstung 4 | ungew. | 96 | Ringgeflecht über Kopf und Schultern, das Gesicht bleibt frei. Hält auch die Sonne ab — zur Hälfte. | Beute: Kettenknecht; Gewölbe-Truhe Stufe 1/2 |
| `maskenkapuze` | Maskenkapuze der Stillen | Rüstung 3 | selten | 170 | Enge Kapuze mit Gesichtstuch: nur die Augen bleiben. Unter einer Kapuze brennt die Sonne nur halb so stark. | Beute: Bandit; Beute: Maskierter; Laden: Yusuf (Basarhändler); Gewölbe-Truhe Stufe 2/3 |
| `ordenskutte` | Ordenskutte | Rüstung 4, fest {vital:0.03} | ungew. | 90 | Tiefe elfenbeinfarbene Kutte mit rotem Saum. Das Gesicht verschwindet im Schatten. Unter einer Kapuze brennt d… | Laden: Sael; Gewölbe-Truhe Stufe 1/2 |
| `kuttenkapuze` | Tiefe Kuttenkapuze | Rüstung 2 | gewöhnl. | 28 | Grobe Mönchskutte, so tief, dass nur Dunkel bleibt. Unter einer Kapuze brennt die Sonne nur halb so stark. | Laden: Standardware (Händler ohne Liste); Gewölbe-Truhe Stufe 1 |
| `henkerskapuze` | Henkerskapuze | Rüstung 3 | ungew. | 80 | Steifer schwarzer Kegel ohne Gesicht, nur zwei Augenlöcher. Unter einer Kapuze brennt die Sonne nur halb so st… | Beute: Kettenknecht; Gewölbe-Truhe Stufe 1/2 |
| `wuestenhaube` | Wüstenhaube | Rüstung 2 | gewöhnl. | 34 | Gewickeltes Kopftuch mit Staubschleier. Das Gesicht bleibt frei bis auf die Augen. Unter einer Kapuze brennt d… | Laden: Yusuf (Basarhändler); Gewölbe-Truhe Stufe 1 |
| `widderkapuze` | Widderkapuze | Rüstung 3, fest {enduring:8} | selten | 200 | Kapuze mit zwei eingerollten Widderhörnern. Unter einer Kapuze brennt die Sonne nur halb so stark. | Beute: Kultist der Asche; Gewölbe-Truhe Stufe 2/3/4 |
| `pestkapuze` | Pestkapuze mit Schnabel | Rüstung 3, fest {vital:0.04} | selten | 210 | Lederne Schnabelmaske mit Glasaugen unter der Kapuze. Im Schnabel stecken Kräuter gegen den Seuchenhauch. Unte… | Truhe/Kiste: Truhe der Kapelle; Gewölbe-Truhe Stufe 2/3/4 |
| `todesritter_helm` | Helm der Eidwacht | Rüstung 6 | episch | 0 | gebunden; Klassenrüstung deathknight | Auftrag: Der erste Schwur (dk_1) |
| `totenrufer_kapuze` | Kapuze des Totenrufers | Rüstung 4 | episch | 0 | gebunden; Klassenrüstung necromancer | Auftrag: Die Knochen der Vergessenen (c_nec1) |
| `hoernerkrone` | Hörnerkrone des Paktes | Rüstung 4 | episch | 0 | gebunden; Klassenrüstung warlock | Auftrag: Die Krone, die wächst (c_war1) |
| `geweih_hirsch` | Geweih des Weißen Hirschs | Rüstung 3 | legendär | 0 | gebunden; Klassenrüstung druid | Auftrag: Der Weiße Hirsch (c_dru3) |
| `gebetsband` | Gebetsband der Stillen Hand | Rüstung 2 | episch | 0 | gebunden; Klassenrüstung monk | Auftrag: Neun Knoten (c_mon1) |
| `dreispitz` | Kapitänshut | Rüstung 2 | ungew. | 70 | Breite Krempe, Möwenfeder. Wer ihn trägt, gibt Befehle. | Beute: Harpunier; Beute: Weißbart, König der Sturmklinge; Bossbeute: Weißbart, König der Sturmklinge; Auftrag: Die Schwarzsegel-Kapitänin (q_wb_nebel); Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Gewölbe-Truhe Stufe 1/2 |
| `garmadon_krone` | Krone des Toten Königs | Rüstung 8 | legendär | 900 | Schwarzes Eisen, rot glimmend. Kalt, auch in warmer Hand. | Truhe/Kiste: Hort des Toten Königs; Gewölbe-Truhe Stufe 5 |
| `rotgardistenhelm` | Rotgardistenhelm | Rüstung 9 | selten | 240 | Schwarzer Vollhelm mit rotem Kamm. | Beute: Rotgardist; Gewölbe-Truhe Stufe 2/3/4 |
| `bergmannshelm` | Bergmannshelm | Rüstung 4 | gewöhnl. | 60 | Eisenkappe mit Nackenleder. Aus den Gruben der Mark. | Beute: Kettenschütze; Laden: Brann; NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 1/2 |
| `eisenfuersthelm` | Hörnerhelm | Rüstung 10 | episch | 400 | Geschlossen, schmaler Sehschlitz, zwei kurze Eisenhörner. | Beute: Varg, Kettenmeister; Bossbeute: Varg, Kettenmeister; NPC trägt es (nur über Grab nach Mord); Gewölbe-Truhe Stufe 3/4/5 |

#### Umhänge (21)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `traveler_cloak` | Reisemantel | Rüstung 1 | gewöhnl. | 24 | Wollmantel mit Kapuze. Wärmt in Schneenächten. | Beute: Kultist der Asche; Laden: Gerold; Laden: Sael; Laden: Weber (Marktstand); Laden: Marktstand/Kaufmann; Laden: Standardware (Händler ohne Liste) |
| `fetzenmantel` | Fetzenmantel | Rüstung 1 | gewöhnl. | 14 | Zerrissen bis zu den Knien, aber er wärmt. Mit Kapuze. | Beute: Verdorbener; Beute: Wucherer; Beute: Kultist der Asche; Beute: Wiedergänger; Laden: Standardware (Händler ohne Liste) |
| `oelzeugumhang` | Ölzeug-Pelerine | Rüstung 2 | ungew. | 72 | Kurzer, geteerter Schulterumhang mit weiter Kapuze. Gischt perlt ab. | Beute: Plünderer der Sturmklinge |
| `wolfspelzmantel` | Wolfspelzmantel | Rüstung 3 | selten | 185 | Schwerer Mantel mit grauem Wolfspelz um die Schultern. Wärmt in Schneenächten. | Laden: Hagen (Schmied) |
| `brokatmantel` | Brokat-Halbmantel | Rüstung 2 | selten | 240 | Über eine Schulter geworfen, Messingborte, Goldfutter. Aurelische Mode. | Laden: Yusuf (Basarhändler) |
| `wappenmantel_valen` | Wappenmantel von Valen | Rüstung 4 | episch | 380 | Langer Mantel mit silbernem Winkel auf dem Rücken. Wer ihn trägt, spricht für Varon. | Laden: Hagen (Schmied) |
| `grabtuchmantel` | Grabtuchmantel | Rüstung 3 | episch | 360 | Bodenlang, mit spitzer Kapuze und grün schimmernder Borte. Kalt auch in der Sonne. | Beute: Geist |
| `teermantel` | Teermantel | Rüstung 1 | gewöhnl. | 28 | Geteerte Öljacke mit langen Schößen. Hält Gischt und Schneeregen ab. | Beute: Plünderer der Sturmklinge |
| `rabenmantel` | Rabenmantel | Rüstung 2 | ungew. | 110 | Hunderte schwarze Federn auf Filz, mit Federkragen. Im Regen schimmern sie blau. | Beute: Bandit |
| `wuestenburnus` | Wüstenburnus | Rüstung 2, fest {enduring:8} | ungew. | 120 | Weiter Wollmantel mit Kopftuch. Hält Sand, Mittagssonne und Nachtkälte ab. Das Tuch zählt als Kapuze: Die Sonn… | Laden: Yusuf (Basarhändler) |
| `doppelmantel` | Doppelmantel | Rüstung 3 | ungew. | 130 | Kurze Pelerine über einem bodenlangen Mantel. Zwei Lagen Wolle, doppelt warm. | Laden: Hagen (Schmied) |
| `kettenumhang` | Kettenumhang der Kette | Rüstung 4, fest {sturdy:2} | selten | 270 | Ein Umhang aus Ringgeflecht mit zwei Schulterplatten. Schwer, laut, kaum zu durchschneiden. | Bossbeute: Varg, Kettenmeister |
| `kapitaensrock` | Kapitänsrock | Rüstung 2, fest {fleet:0.03} | selten | 240 | Langer Rock mit Messingknöpfen, hohem Kragen und Goldborte. Trägt sich leicht auf schwankendem Deck. | Bossbeute: Weißbart, König der Sturmklinge |
| `knochenumhang` | Knochenumhang | Rüstung 3, fest {enduring:10} | selten | 230 | Zerfetzter Mantel mit tiefer Kutte, Wirbeln auf dem Rücken und einem Schädel auf der Schulter. Die Kutte zählt… | Beute: Untoter Krieger |
| `baerenfell` | Bärenfell mit Kopf | Rüstung 4, fest {vital:0.04} | selten | 280 | Ein ganzes Bärenfell: Kopf im Nacken, Pranken vor der Brust verknotet. Wärmt in Schneenächten. | Beute: Bandit |
| `rabenfuerst` | Mantel des Rabenfürsten | Rüstung 4, fest {fleet:0.05,vital:0.05} | legendär | 1400 | Bodenlange Rabenfedern mit violettem Schimmer und spitzer Kapuze. Leicht wie Asche. Die Kapuze hält die Sonne … | Beute: Bandit |
| `todesritter_mantel` | Frostmantel der Eidwacht | Rüstung 4 | legendär | 0 | gebunden; Klassenrüstung deathknight | Auftrag: Der gebrochene Eid (dk_3) |
| `grabsteinkragen` | Kragen aus Grabstein | Rüstung 3 | legendär | 0 | gebunden; Klassenrüstung necromancer | Auftrag: Der Kragen aus Grabstein (c_nec3) |
| `schattenmantel` | Mantel aus Schattenfaden | Rüstung 3 | legendär | 0 | gebunden; Klassenrüstung warlock | Auftrag: Was der Obelisk nicht wollte (c_war3) |
| `fellmantel_hain` | Fellmantel des Hains | Rüstung 4 | episch | 0 | gebunden; Klassenrüstung druid | Auftrag: Der lange Winter (c_dru2) |
| `order_seal` | Siegel des Ordens | Rüstung 2 | selten | 200 | — | Auftrag: Prüfung: Das Siegel (q_paladin2); Truhe/Kiste: Ordenskapelle; Truhe/Kiste: Tempelkammer; Truhe/Kiste: Verschütteter Ordenskasten |

#### Hände, Beine, Füße (17)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `iron_boots` | Eisenschuhe | Rüstung 3 | ungew. | 60 | — | Laden: Brann |
| `leather_boots` | Lederstiefel | Rüstung 1 | gewöhnl. | 16 | — | **KEINE QUELLE** (Fehlversuch) |
| `wickel_stille_hand` | Wickel der Stillen Hand | Rüstung 2 | legendär | 0 | gebunden; Klassenrüstung monk | Auftrag: Ilvas Wickel (c_mon3) |
| `thron_handschuhe` | Handschuhe des Throns | Rüstung 4 | episch | 420 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `thron_beinschienen` | Beinschienen des Throns | Rüstung 5 | episch | 480 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `blut_handschuhe` | Blutkettenhandschuhe | Rüstung 5 | episch | 420 | — | Bossbeute: Varg, Kettenmeister |
| `blut_beinschienen` | Blutkettenbeinschienen | Rüstung 5 | episch | 480 | — | Bossbeute: Varg, Kettenmeister |
| `toten_handschuhe` | Knochenhandschuhe der Krone | Rüstung 4 | episch | 420 | — | Bossbeute: Hrodvar, König unter dem Eis; Bossbeute: König Garmadon; Laden: Grimbart Knochenhand (Knochenschmied) |
| `toten_beinschienen` | Beinschienen der Totenkrone | Rüstung 5 | episch | 480 | — | Bossbeute: Hrodvar, König unter dem Eis; Bossbeute: König Garmadon; Laden: Grimbart Knochenhand (Knochenschmied) |
| `hochritter_handschuhe` | Hochritterhandschuhe | Rüstung 4 | episch | 400 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `hochritter_beinschienen` | Hochritterbeinschienen | Rüstung 5 | episch | 460 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `lederhandschuhe` | Lederhandschuhe | Rüstung 1 | gewöhnl. | 18 | — | Beute: Bandit |
| `kettenhandschuhe` | Kettenhandschuhe | Rüstung 2 | ungew. | 60 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `panzerhandschuhe` | Panzerhandschuhe | Rüstung 4 | selten | 160 | — | Beute: Hauptmann der Toten; Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `lederbeinlinge` | Lederbeinlinge | Rüstung 2 | gewöhnl. | 24 | — | Beute: Bandit |
| `kettenbeinlinge` | Kettenbeinlinge | Rüstung 3 | ungew. | 80 | — | Beute: Wächter der Nekropole; Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `beinschienen` | Beinschienen mit Kniebuckeln | Rüstung 5, Tempo −2 % | selten | 190 | — | Beute: Hauptmann der Toten; Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |

#### Talismane (14)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `glocke_moorbach` | Glocke von Moorbach | fest {sturdy:3} | selten | 260 | — | Truhe/Kiste: Truhe der Kapelle |
| `talisman_ausdauer` | Talisman der Ausdauer | fest {enduring:12} | ungew. | 90 | — | Laden: Juwelier (Aurelheim, alte Stände: fehlt); Schatzgerücht → vergrabene Kiste |
| `talisman_leichtfuss` | Talisman der Beweglichkeit | fest {fleet:0.05} | ungew. | 90 | — | Beute: Bandit; Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `talisman_krieger` | Talisman des Kriegers | fest {sharp:0.08} | selten | 160 | — | Auftrag: Eisen für die Grubenstämme (g_dod2); Laden: Juwelier (Aurelheim, alte Stände: fehlt); Schatzgerücht → vergrabene Kiste |
| `talisman_waechter` | Talisman des Wächters | fest {sturdy:3} | selten | 160 | — | Beute: Dodon, Hüter von Morrgrund; Beute: Wächter der Nekropole; Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `talisman_jaeger` | Talisman des Jägers | fest {marks:0.1} | selten | 160 | — | **KEINE QUELLE** (Fehlversuch) |
| `talisman_toten` | Talisman der Toten | fest {slayer:0.18} | selten | 180 | — | Beute: Hauptmann der Toten |
| `talisman_magie` | Talisman der Magie | fest {spellp:0.1} | selten | 180 | — | Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `talisman_leben` | Talisman des Lebens | fest {vital:0.06} | selten | 170 | — | Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `magiekern` | Aurelioner Magiekern | fest {spellp:0.15} | episch | 400 | — | Weltereignis Magiekern (coreTaken) |
| `splitter_rotfall` | Splitter des Rotfalls | fest {spellp:0.18,vital:-0.08} | episch | 320 | — | **KEINE QUELLE** (Fehlversuch) |
| `blutstein` | Blutstein | fest {sharp:0.14,enduring:-10} | episch | 320 | — | **KEINE QUELLE** (Fehlversuch) |
| `eulenauge` | Eulenauge | fest {keen:0.08,fleet:-0.04} | episch | 300 | — | Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `totenmuenze` | Münze des Fährmanns | fest {slayer:0.3,vital:-0.05} | legendär | 500 | — | Beute: Hauptmann der Toten |

#### Verbrauchsgüter, Elixiere, Prothesen (37)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `energiezelle` | Energiezelle | — | gewöhnl. | 30 | use:cell | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Laden: Yusuf (Basarhändler); Handwerk: Werkbank |
| `elixier_staerke` | Elixier der Stärke | Wirkung {dmg:0.15}, 180 s | ungew. | 60 | use:elixir | Schatzgerücht → vergrabene Kiste — steht in der Liste des Gewürzhändlers (Aurelheim), der verkauft aber nur die Marktstand-Ware (Liste wird überschrieben) |
| `elixier_ausdauer` | Elixier der Ausdauer | Wirkung {vigor:0.3}, 180 s | ungew. | 50 | use:elixir | **KEINE QUELLE** (Fehlversuch) — steht in der Liste des Gewürzhändlers (Aurelheim), der verkauft aber nur die Marktstand-Ware (Liste wird überschrieben) |
| `elixier_eile` | Elixier der Eile | Wirkung {speed:0.12}, 120 s | ungew. | 55 | use:elixir | **KEINE QUELLE** (Fehlversuch) — steht in der Liste des Gewürzhändlers (Aurelheim), der verkauft aber nur die Marktstand-Ware (Liste wird überschrieben) |
| `elixier_stein` | Steinhaut | Wirkung {armor:6}, 150 s | selten | 80 | use:elixir | Beute: Hauptmann der Toten |
| `elixier_wut` | Trank der Wut | Wirkung {dmg:0.1,speed:0.05,armor:-2}, 90 s | selten | 85 | use:elixir | Beute: Bandit |
| `elixier_arkan` | Arkaner Trank | Wirkung {spell:0.2}, 150 s | selten | 90 | use:elixir | **KEINE QUELLE** (Fehlversuch) |
| `elixier_auge` | Scharfes Auge | Wirkung {marks:0.2,keen:0.05}, 150 s | ungew. | 60 | use:elixir | Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `elixier_wacht` | Wachtrank | Wirkung {slayer:0.2}, 180 s | ungew. | 55 | use:elixir | Beute: Hauptmann der Toten |
| `elixier_regen` | Trank der Erneuerung | Wirkung {regen:1.5}, 60 s | selten | 95 | use:elixir | **KEINE QUELLE** (Fehlversuch) — steht in der Liste des Gewürzhändlers (Aurelheim), der verkauft aber nur die Marktstand-Ware (Liste wird überschrieben) |
| `elixier_lehre` | Trank der Lehre | Wirkung {xp:0.1}, 600 s | selten | 120 | use:elixir | Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `schrottarm` | Schrottarm | Prothese arm Stufe 1 | ungew. | 220 | use:prosthesis; Gelenke aus Wagenteilen, Zugseile, eine Klaue. Ersetzt einen verlorenen Arm — besser als nichts. | Beute: Kriegsautomat; Laden: Prothesenhändlerin; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Schwarzmarkt (Bionik) |
| `schrottbein` | Schrottbein | Prothese leg Stufe 1 | ungew. | 200 | use:prosthesis; Ein Stelzfuß mit Federgelenk. Ersetzt ein verlorenes Bein. | Beute: Kriegsautomat; Beute: Dampframme; Laden: Prothesenhändlerin; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Schwarzmarkt (Bionik) |
| `aurelarm` | Aurelionischer Arm | Prothese arm Stufe 2 | selten | 900 | use:prosthesis; Messingknochen, Federzug, Lederpolster. Werkstatt Gelenkhall. Voll beweglich. | Laden: Prothesenhändlerin; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Schwarzmarkt (Bionik) |
| `aurelbein` | Aurelionisches Bein | Prothese leg Stufe 2 | selten | 850 | use:prosthesis; Kniegelenk mit Dämpfer, Sohle aus Gummi und Stahl. Voll belastbar. | Laden: Prothesenhändlerin; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Schwarzmarkt (Bionik) |
| `meisterarm` | Meisterarm von Gelenkhall | Prothese arm Stufe 3 | episch | 2400 | use:prosthesis; Feinwerk der Kybernetiker. Stärker als Fleisch: Hiebe mit diesem Arm treffen härter (+10 %). | Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall) |
| `meisterbein` | Meisterbein von Gelenkhall | Prothese leg Stufe 3 | episch | 2200 | use:prosthesis; Feinwerk der Kybernetiker. Schneller als Fleisch (+6 % Tempo). | Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall) |
| `protoarm` | Prototyp-Arm | Prothese arm Stufe 4 | legendär | 5200 | use:prosthesis; Aus der Versuchswerkstatt der Akademie. Hiebe +15 %, nutzt sich nur halb so schnell ab. | Schwarzmarkt (Bionik) |
| `protobein` | Prototyp-Bein | Prothese leg Stufe 4 | legendär | 4800 | use:prosthesis; Aus der Versuchswerkstatt der Akademie. +10 % Tempo, nutzt sich nur halb so schnell ab. | Schwarzmarkt (Bionik) |
| `greifhand` | Greifhand | — | selten | 480 | use:mechmod; Modul für einen Prothesenarm. Schwere Rüstung und Schild bremsen 30 % weniger; selbst ausbessern bis 90 %. | Laden: Kybernetiker; Schwarzmarkt (Bionik) |
| `klingenhand` | Klingenhand | — | episch | 900 | use:mechmod; Modul für einen Prothesenarm. +12 % Nahkampf, aber kein Schildblock mehr. | Laden: Kybernetiker; Schwarzmarkt (Bionik) |
| `federfuss` | Federfuß | — | selten | 520 | use:mechmod; Modul für ein Prothesenbein. +8 % Tempo. | Laden: Kybernetiker; Schwarzmarkt (Bionik) |
| `ankerfuss` | Ankerfuß | — | selten | 560 | use:mechmod; Modul für ein Prothesenbein. Treffer stoßen dich nicht mehr zurück, −5 % Tempo. | Laden: Kybernetiker |
| `spezialoel` | Spezialöl | — | ungew. | 70 | use:mechkit; Ein Fläschchen Kristallöl. Bringt die am stärksten abgenutzte Prothese (oder das Auge) um 25 Punkte hoch, höch… | Laden: Prothesenhändlerin; Laden: Kybernetiker; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Laden: Yusuf (Basarhändler); Schwarzmarkt (Bionik) |
| `auge_schrott` | Schrottauge | — | ungew. | 180 | use:eye; Ein Glas in einer Blechfassung. Sieht etwas weiter (Sichtweite 22), nutzt sich doppelt so schnell ab. | Laden: Prothesenhändlerin; Schwarzmarkt (Bionik) |
| `auge_aurel` | Aurelionisches Auge | — | selten | 750 | use:eye; Messingiris mit Schleifglas. Sichtweite 28, Fernkampf-Krit +2 %. | Laden: Prothesenhändlerin; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Schwarzmarkt (Bionik) |
| `auge_meister` | Meisterauge von Gelenkhall | — | episch | 2000 | use:eye; Kristalllinse mit Restlichtverstärker. Sichtweite 32, Fernkampf-Krit +4 %, Nachtsicht +40 %. | Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall) |
| `auge_proto` | Prototyp-Auge | — | legendär | 4200 | use:eye; Aus der Akademie, nicht zu kaufen. Sichtweite 36, Fernkampf-Krit +6 %, Nachtsicht +50 %, Wärmesicht. | Schwarzmarkt (Bionik) |
| `bread` | Brotlaib | heilt 6 | gewöhnl. | 4 | use:food | Startausrüstung (Herkunft); Beute: Goblin; Beute: Bandit; Beute: Speerträger; Beute: Blutknecht; Laden: Gerold; Laden: Oda; Auftrag: Brot für Morrgrund (g_dod1); Laden: Bäcker (Marktstand); Laden: Marktstand/Kaufmann; Laden: Hausierer; Laden: Schenke; Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Laden: Leyla (Wasserhändlerin); Laden: Balin Silberbart (Zwergenhändler); Laden: Orm (Braumeister); Laden: Hofmar (Hoflieferant); Laden: Wendel (Händler); Truhe/Kiste: Vorrat; Laden: frei_tobbe (Tobbe Ascherling); Laden: Standardware (Händler ohne Liste); NPC trägt es (nur über Grab nach Mord); Truhe/Kiste: ? |
| `dried_meat` | Dörrfleisch | heilt 10 | gewöhnl. | 9 | use:food | Startausrüstung (Herkunft); Beute: Wolf; Beute: Wildschwein; Beute: Banditenschütze; Beute: Plünderer der Sturmklinge; Beute: Netzwerferin; Beute: Wucherer; Beute: Wiedergänger; Beute: Bär; Beute: Hirsch; Laden: Gerold; Laden: Oda; Laden: Sael; Laden: Bäcker (Marktstand); Laden: Marktstand/Kaufmann; Laden: Hausierer; Laden: Kettenkrämerin; Laden: Nibbel (Goblinhändlerin); Laden: Schenke; Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Laden: Leyla (Wasserhändlerin); Laden: Balin Silberbart (Zwergenhändler); Laden: Orm (Braumeister); Laden: Hofmar (Hoflieferant); Laden: Wendel (Händler); Laden: frei_tobbe (Tobbe Ascherling); Laden: Standardware (Händler ohne Liste); Truhe/Kiste: Vorratskiste der Wacht; Truhe/Kiste: Proviantkiste |
| `herb` | Heilkraut | heilt 10 | gewöhnl. | 12 | use:bandage | Startausrüstung (Herkunft); Laden: Quirin; Laden: Sael; Auftrag: Elenas Kräuter (q_herbs); Auftrag: Prüfung des Klerikers: Die Kranken (kt_cleric1); Auftrag: Prüfung des Alchemisten: Für den Kessel (kt_alchemist1); Auftrag: Der lange Winter (c_dru2); Auftrag: Der Ruf des Hains (q_grove); Laden: Bauer (Marktstand); Laden: Marktstand/Kaufmann; Laden: Hausierer; Laden: Nibbel (Goblinhändlerin); Laden: Schenke; Laden: frei_tobbe (Tobbe Ascherling); Laden: Standardware (Händler ohne Liste) |
| `wasserschlauch` | Wasserschlauch | — | gewöhnl. | 12 | use:water; Kühles Brunnenwasser aus Karak-Atar. Füllt die Ausdauer und schützt eine Stunde vor der Wüstenhitze. | Laden: Leyla (Wasserhändlerin); Laden: Orm (Braumeister); Laden: Hofmar (Hoflieferant); Laden: Wendel (Händler); Truhe/Kiste: Truhe der Karawanserei |
| `koederpfeife` | Köderpfeife | — | ungew. | 45 | use:lure | Laden: Standardware (Händler ohne Liste) |
| `blutphiole` | Blutphiole | — | ungew. | 40 | use:blood | Beute: Blutschöpfer; Beute: Aldhelm, Blutfürst von Varonheim; Beute: Blutmagier; Beute: Kelchwächter; Beute: Maskierter |
| `potion` | Trank der Genesung | heilt 40 | ungew. | 55 | use:heal | Beute: Kopfgeldjäger; Beute: Rotgardist; Beute: Plünderer der Sturmklinge; Beute: Harpunier; Beute: Weißbart, König der Sturmklinge; Beute: Varg, Kettenmeister; Beute: Netzwerferin; Beute: Hofspion; Beute: Dodon, Hüter von Morrgrund; Beute: Gorak, Grubenwart; Beute: Hauptmann der Toten; Beute: Aldhelm, Blutfürst von Varonheim; Beute: König Garmadon; Beute: Omega, der Gefallene; Beute: Hrodvar, König unter dem Eis; Laden: Gerold; Laden: Oda; Laden: Quirin; Auftrag: Prüfung des Alchemisten: Drei Tränke (kt_alchemist2); Auftrag: Felle für den Hafen (q_pelts); Kopfgeld-Elite: Mulch der Pilzschamane; Kopfgeld-Elite: Seuchenmaul; Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Laden: Marktstand/Kaufmann; Laden: Hausierer; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Laden: Yusuf (Basarhändler); Laden: Ossara (Seelenhändlerin); Laden: Balin Silberbart (Zwergenhändler); Laden: Orm (Braumeister); Laden: Hofmar (Hoflieferant); Laden: Wendel (Händler); Truhe/Kiste: Vorrat; Schatzgerücht → vergrabene Kiste; Laden: Standardware (Händler ohne Liste); Truhe/Kiste: Truhe der Kapelle; Truhe/Kiste: Feldkiste der Hundert; Truhe/Kiste: Truhe der Karawanserei; Truhe/Kiste: Aufgebrochene Kiste; Truhe/Kiste: Alte Truhe; Truhe/Kiste: Ordenskapelle; Truhe/Kiste: Wüstengruft; Truhe/Kiste: Räuberversteck; Truhe/Kiste: Tempelkammer; Truhe/Kiste: Grabkammer der Feste; Truhe/Kiste: Vorrat eines Grabräubers; Truhe/Kiste: Truhe der Nekromanten; Truhe/Kiste: Hort des Toten Königs; Truhe/Kiste: Verbotene Schriften; Truhe/Kiste: Tiefhall-Hort; Truhe/Kiste: Vergessene Nische; Truhe/Kiste: Schatzkammer; Handwerk: Kessel |
| `bandage` | Verband | — | gewöhnl. | 9 | use:bandage | Beute: Goblin; Beute: Bandit; Beute: Kopfgeldjäger; Beute: Kettenknecht; Beute: Kettenschütze; Beute: Speerträger; Beute: Verdorbener; Beute: Wucherer; Beute: Blutknecht; Beute: Kultist der Asche; Laden: Gerold; Laden: Oda; Laden: Quirin; Laden: Sael; Laden: Juwelier (Aurelheim, alte Stände: fehlt); Laden: Weber (Marktstand); Laden: Marktstand/Kaufmann; Laden: Hausierer; Laden: Kettenkrämerin; Laden: Nibbel (Goblinhändlerin); Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Laden: Schenke; Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Laden: Yusuf (Basarhändler); Laden: Balin Silberbart (Zwergenhändler); Laden: Hofmar (Hoflieferant); Laden: Wendel (Händler); Truhe/Kiste: Vorrat; Laden: frei_tobbe (Tobbe Ascherling); Laden: Standardware (Händler ohne Liste); NPC trägt es (nur über Grab nach Mord); Truhe/Kiste: Aufgebrochene Kiste; Truhe/Kiste: Vorratskiste der Wacht; Truhe/Kiste: Tasche des Spähers; Truhe/Kiste: Vorrat eines Grabräubers; Truhe/Kiste: Truhe der Nekromanten; Truhe/Kiste: Proviantkiste; Truhe/Kiste: ?; Handwerk: Kessel / Tuch |
| `soul_vial` | Seelenphiole | — | ungew. | 40 | use:soul | Beute: Kultist der Asche; Beute: Geist; Beute: Nekromant; Beute: Aschdämon; Beute: Schattenwesen; Beute: Leichenkoloss; Beute: Todesritter; Beute: König Garmadon; Laden: Quirin; Laden: Sael; Auftrag: Prüfung des Alchemisten: Für den Kessel (kt_alchemist1); Auftrag: Die kalte Klinge (dk_2); Auftrag: Das Gewand der Stillen Schar (c_nec2); Auftrag: Die Krone, die wächst (c_war1); Laden: Ossara (Seelenhändlerin); Geheimer Ort (secretNames); Geheimer Ort (secretTick3); Truhe/Kiste: Truhe der Nekromanten; Truhe/Kiste: Verbotene Schriften |

#### Material, Waren, Schlüssel- und Questgegenstände (41)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `koenigseisen` | Königseisen | — | selten | 120 | — | Laden: Stadtschmiede; Laden: Hilda Eisenfaust (Runenschmiedin) |
| `trophaee` | Trophäe | — | selten | 90 | — | Jede Kopfgeld-Elite (eliteDrop) |
| `meteorsplitter` | Meteorsplitter | — | selten | 150 | — | Weltereignis Meteor (evMeteor) |
| `wassereimer` | Wassereimer | — | — | 0 | Voll bis zum Rand. Läuft über, wenn man rennt. | Brand löschen: Eimer holen (doInteract) |
| `salzsiegel` | Salzsiegel des Bundes | — | — | 40 | Wachs, Salz, das Zeichen des Salzbunds. Öffnet Kontore — und manchen Mund. | Auftrag: Salz für den Bund (q_salz2); Laden: Ysolde Kielmark (Handelsherrin des Salzbunds) |
| `seekarte` | Weißbarts Seekarte | — | — | 0 | Riffe, Strömungen, ein Kreuz vor der Nebelbank. Quer darüber in Rot: „Nicht verkaufen.“ | Beute: Weißbart, König der Sturmklinge |
| `feinwerkzeug` | Feinwerkzeug | — | selten | 320 | — | Laden: Kybernetiker; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Schwarzmarkt (Bionik) |
| `ersatzteile` | Ersatzteile | — | gewöhnl. | 30 | — | Kopfgeld-Elite: Schrottfresser Grimm; Kopfgeld-Elite: Das Messingungetüm; Laden: Prothesenhändlerin; Laden: Kybernetiker; Laden: Balin Silberbart (Zwergenhändler); Schwarzmarkt (Bionik) |
| `dietrich` | Dietrich der Diebesgilde | — | selten | 40 | — | Auftrag q_gilde bei Mo (jailChoices) |
| `auftragspaket` | Versiegeltes Paket | — | gewöhnl. | 0 | — | Botenauftrag (acceptContract) |
| `vargs_kette` | Vargs Kette | — | legendär | 0 | — | Truhe/Kiste: Vargs Truhe unter dem Banner |
| `vargs_tagebuch` | Vargs Tagebuch | — | selten | 0 | — | Truhe/Kiste: Vargs Truhe unter dem Banner |
| `himmelssplitter` | Splitter vom Himmel | — | legendär | 0 | — | Truhe/Kiste: Schrein des Himmelssplitters |
| `pferchschluessel` | Pferchschlüssel | — | selten | 0 | — | Auftrag: Die Pferche öffnen (q_pferch) |
| `tributgut` | Tributgut | — | gewöhnl. | 10 | — | Tributzug der Eisenmark überfallen (tribTick) |
| `automatenkern` | Automatenkern | — | ungew. | 60 | — | Beute: Kriegsautomat; Beute: Wächterspinne; Beute: Dampframme |
| `strick` | Strick | — | gewöhnl. | 6 | — | Laden: Marktstand/Kaufmann |
| `rotes_siegel` | Rotes Siegel | — | selten | 0 | — | Blutkult-Weg (cultSealRite) |
| `blutmaske` | Blutmaske | — | ungew. | 15 | — | Beute: Blutmagier; Beute: Maskierter |
| `stiefelscheide` | Stiefelscheide | — | ungew. | 160 | — | Laden: Yusuf (Basarhändler) |
| `wood` | Bauholz | Rohstoff (wood) | gewöhnl. | 2 | — | Laden: Böttcher (Marktstand) |
| `stone` | Bruchstein | Rohstoff (stone) | gewöhnl. | 2 | — | Laden: Handwerker (Marktstand) |
| `iron` | Eisenerz | Rohstoff (iron) | gewöhnl. | 6 | — | Beute: Goblin; Beute: Goblin-Krieger; Beute: Kriegsautomat; Beute: Großes Skelett; Beute: Wächterspinne; Beute: Dampframme; Beute: Gorak, Grubenwart; Beute: Hrodvar, König unter dem Eis; Auftrag: Eisen für die Grubenstämme (g_dod2); Laden: Nibbel (Goblinhändlerin); Laden: Hofmar (Hoflieferant); Laden: Wendel (Händler); Laden: frei_tobbe (Tobbe Ascherling); Truhe/Kiste: Wüstengruft; Truhe/Kiste: Werkzeugtruhe; Truhe/Kiste: Tiefhall-Hort; Truhe/Kiste: Verborgener Vorrat |
| `pelt` | Wolfsfell | Handelsware | gewöhnl. | 14 | — | Beute: Wolf; Beute: Wildschwein; Beute: Bär; Beute: Wilder Hund; Beute: Hirsch; Beute: Kuh; Auftrag: Prüfung des Schützen: Wölfe an der Hürde (kt_archer1); Auftrag: Das Fell des Leitwolfs (c_dru1); Auftrag: Felle für den Hafen (q_pelts); Kopfgeld-Elite: Graumähne; Kopfgeld-Elite: Schwarzfell; Kopfgeld-Elite: Eisenhauer; Kopfgeld-Elite: Der Alte vom Berg; Kopfgeld-Elite: Der Weiße Hund; Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `bone` | Alter Knochen | — | gewöhnl. | 3 | — | Beute: Wolf; Beute: Goblin; Beute: Untoter Krieger; Beute: Bomben-Skelett; Beute: Großes Skelett; Beute: Verdorbener; Beute: Wucherer; Beute: Wächter der Nekropole; Beute: Hauptmann der Toten; Beute: Wiedergänger; Beute: Bär; Beute: Wilder Hund; Beute: Knochenritter; Beute: Knochenschütze; Beute: Seuchenleiche; Beute: Knochenhund; Beute: Aasschwinge; Beute: Leichenkoloss; Laden: Sael; Auftrag: Der erste Schwur (dk_1); Auftrag: Die Knochen der Vergessenen (c_nec1); Laden: Nibbel (Goblinhändlerin); Truhe/Kiste: Lager der Grabräuber |
| `grain` | Weizensack | Handelsware | gewöhnl. | 6 | — | Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `salt` | Salzsack | Handelsware | gewöhnl. | 8 | — | Auftrag: Salz für den Bund (q_salz2); Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `cloth` | Tuchballen | Handelsware | gewöhnl. | 12 | — | Beute: Schaf; Auftrag: Beute für die Sturmklinge (q_klinge2); Kopfgeld-Elite: Karim Sandgeist; Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `meat` | Pökelfleisch | Handelsware | gewöhnl. | 9 | — | Beute: Kuh; Beute: Schaf; Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `timber` | Stammholz | Handelsware | gewöhnl. | 4 | — | Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `woodware` | Holzwaren | Handelsware | gewöhnl. | 10 | — | Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `stoneware` | Behauene Steine | Handelsware | gewöhnl. | 8 | — | Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `ore` | Erzfuhre | Handelsware | gewöhnl. | 8 | — | Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `ingot` | Eisenbarren | Handelsware | gewöhnl. | 18 | — | Laden: Hilda Eisenfaust (Runenschmiedin); Laden: Balin Silberbart (Zwergenhändler); Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `tools` | Werkzeugkiste | Handelsware | gewöhnl. | 24 | — | Laden: Balin Silberbart (Zwergenhändler); Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `arms` | Waffenkiste | Handelsware | ungew. | 45 | — | Laden: Standardware (Händler ohne Liste); Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `magitech` | Magitech-Teile | Handelsware | ungew. | 60 | — | Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `grave_seal` | Grabsiegel | — | selten | 0 | — | Beute: Untoter Krieger; Beute: Bomben-Skelett; Beute: Großes Skelett; Beute: Geist; Auftrag: Prüfung des Magiers: Das Grabsiegel (kt_mage1); Auftrag: Das Grabsiegel (q_undead); Auftrag: Der Kragen aus Grabstein (c_nec3); Laden: Ossara (Seelenhändlerin); Truhe/Kiste: Versunkener Stein; Truhe/Kiste: Gruft von Alt-Vharn; Truhe/Kiste: Grabkammer der Feste; Truhe/Kiste: Lager der Grabräuber |
| `scout_report` | Späherbericht | — | ungew. | 0 | — | Auftrag: Die Zahl der Toten (q_frontier); Truhe/Kiste: Tasche des Spähers |
| `kings_iron` | Königseisen | — | selten | 0 | — | Auftrag: Königseisen (q_kingsiron); Truhe/Kiste: Tiefhall-Hort |
| `ancestor_urn` | Ahnenurne | — | episch | 0 | — | Beute: Wächter der Nekropole; Auftrag: Der Pakt der Stillen Schar (q_pact) |

#### Werkzeuge der Bewohner (6)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `tool_hammer` | Schmiedehammer | — | gewöhnl. | 0 | — | Nur Bewohner-Werkzeug (CYCLE), für Spieler nicht vorgesehen |
| `tool_hoe` | Hacke | — | gewöhnl. | 0 | — | Nur Bewohner-Werkzeug (CYCLE), für Spieler nicht vorgesehen |
| `tool_saw` | Säge | — | gewöhnl. | 0 | — | Nur Bewohner-Werkzeug (CYCLE), für Spieler nicht vorgesehen |
| `tool_spoon` | Kochlöffel | — | gewöhnl. | 0 | — | Nur Bewohner-Werkzeug (CYCLE), für Spieler nicht vorgesehen |
| `tool_rod` | Angel | — | gewöhnl. | 0 | — | Nur Bewohner-Werkzeug (CYCLE), für Spieler nicht vorgesehen |
| `tool_fork` | Heugabel | — | gewöhnl. | 0 | — | Nur Bewohner-Werkzeug (CYCLE), für Spieler nicht vorgesehen |

**Zählung:**
- 80 Waffen, 6 Schilde, 37 Rumpfteile, 36 Kopfteile, 21 Umhänge, 17 Teile für Hände, Beine und Füße, 14 Talismane.
- 37 Verbrauchsgüter (Elixiere, Tränke, Prothesen, Module), 41 Materialien, Waren und Auftragsstücke, 6 Bewohner-Werkzeuge.
- Der alte Ist-Zustand nannte 216 Gegenstände. Das ist veraltet: Es sind **295**.

**Ergebnis der Quellenprüfung:**
- **10 Teile ohne jede Quelle:** Sturmsense, Donnerwort, Lederstiefel, Talisman des Jägers, Splitter des Rotfalls, Blutstein, Elixier der Ausdauer, Elixier der Eile, Arkaner Trank, Trank der Erneuerung.
- **8 legendäre Setteile nur durch Mord:** Sternwacht und Sternkrone (Paladinmarschall Konrad), Generalspanzer und Visierhelm (Rook), Harnisch des Hochritters und Federhelm (Oda), Harnisch und Krone des Ordensmeisters (Kelan). Die Sets Sternwacht, Rooks General und Ordensmeister lassen sich auf keinem friedlichen Weg vervollständigen.
- **51 Zeilen tragen „alte Stände: fehlt“** (Juwelier, Waffenhändler, Rüstmeisterin, Magitech-Ingenieurin in Aurelheim; §5.2).


---

## 3. Sets (ARMOR_SETS)

### Sets — Überblick
- **Was es ist:** Wer alle Grundteile eines Sets trägt (Harnisch und Helm), bekommt einen Bonus (`setOf`, game.js ~101). Vier Sets haben zusätzlich Handschuhe und Beinschienen: mit 3 Teilen gibt es mehr, mit 4 Teilen noch mehr.
- **Bedienung:** Die Bildkarte im Gepäck zeigt alle Teile eines Sets; getragene leuchten hell. Wer ein getragenes Set durch Ablegen bricht, sieht das rot. Debug: Grafik → „Rüstungsset anlegen“.
- **Geprüft:** Bezugsquellen per Code und Ladenzählung. Die Boni selbst habe ich nicht im Kampf gemessen. Der Selbsttest hat eine Probe dafür.

| Set | Teile | Bonus (2 Teile) | 3 / 4 Teile | Woher |
|---|---|---|---|---|
| Rotgarde | Rotgardistenpanzer, Rotgardistenhelm | +10 % Schaden | — | Beute Rotgardist (20 % / 25 %) |
| Eisenfürst | Eisenfürst, Hörnerhelm | +4 Rüstung, +15 Ausdauer | — | Varg (Bossbeute) |
| Kronwache Valens | Kronharnisch, Kronhelm | +3 Rüstung, +5 % Schaden | — | Laden Brann (Nordfurt), Schmied Hagen (Varonheim). Kronhelm auch beim Ritterschlag durch Varon |
| Weißer Orden | Harnisch des Weißen Ordens, Ordenshelm | +2 Rüstung, +20 % gegen Untote | — | Rüstmeisterin Aurelheim (alte Stände: fehlt), Gewölbe 3–5 |
| Sonnenlegion | Sonnenharnisch, Sonnenhelm | +3 Rüstung, +10 Ausdauer | — | Rüstmeisterin (alte Stände: fehlt), Gewölbe |
| Thron des Hochreichs | Thronharnisch, Thronhelm (+ Handschuhe, Beinschienen) | +5 Rüstung, +25 Ausdauer, +8 % Schaden | +3 Rüstung / +15 % Blocken, +8 % Leben | **nur** Rüstmeisterin — in alten Ständen **gar nicht** |
| Blutkette | Blutkette, Gehörnter Kettenhelm (+ Handschuhe, Beinschienen) | +6 Rüstung, +10 % Schaden | +5 % Schaden / 3 % Lebensraub | Varg (Beute und Bossbeute) |
| Sternwacht | Sternwacht, Sternkrone | +4 Rüstung, +10 % Schaden, +10 Ausdauer | — | **nur Grab von Paladinmarschall Konrad** |
| Totenkrone | Totenkrone, Schädelhelm (+ Handschuhe, Beinschienen) | +5 Rüstung, +12 % Schaden | +2 Rüstung, +10 Ausdauer / 2 % Lebensraub, +6 % Leben | Garmadon, Hrodvar, Todesritter (Schädelhelm 8 %), Laden Grimbart Knochenhand (Schwarze Feste) |
| Grubenkönig | Rüstung des Grubenkönigs, Schrotthörner | +4 Rüstung, +30 Ausdauer | — | Gorak, Dodon (Bossbeute) |
| Rooks General | Generalspanzer, Visierhelm | +4 Rüstung, +12 % Schaden | — | **nur Grab von Rook** |
| Hochritter Valens | Harnisch des Hochritters, Federhelm (+ Handschuhe, Beinschienen) | +6 Rüstung, +15 Ausdauer | +3 Rüstung / +20 % Blocken | Harnisch und Helm **nur Grab von Oda**; Handschuhe und Beinschienen bei der Rüstmeisterin |
| Ordensmeister | Harnisch des Ordensmeisters, Meisterkrone | +4 Rüstung, +35 % gegen Untote | — | **nur Grab von Kelan** |

**Fehlversuche / Lücken:**
- Vier Sets (Sternwacht, Rooks General, Ordensmeister und die Grundteile Hochritter) bekommt man nur, wenn man einen wichtigen NPC ermordet (`ELITE_KIT`, game.js ~2844; `eliteKit` legt sie an). Ob das gewollt ist, steht nirgends. Für den Spieler gibt es keinen Hinweis.
- Im neuen Spiel trug Konrad die Sternwacht noch nicht: Er erscheint erst mit den Paladinen (`ensurePaladins`). Kelan, Rook und Oda trugen ihre Sets sofort (live geprüft).
- Die Handschuhe und Beinschienen des Hochritters gibt es zu kaufen, Harnisch und Helm nicht. Das Set ist also halb käuflich.

---

## 4. Rezepte und Handwerk

### Handwerk an Esse, Werkbank und Kessel
- **Was es ist:** An einer Esse oder einem Amboss (Schmieden), an einer Werkbank (Handwerk) und an jedem Lagerfeuer als Kessel (Medizin) stellt man Gegenstände aus Material her (`RECIPES`, `craftItem`). Die Güte hängt an der Fertigkeit (§1.6). Jede Arbeit übt die Fertigkeit. Eine Schmiedearbeit dauert 45 Minuten, eine Arbeit am Kessel 20 Minuten.
- **Wo:** Esse, Amboss und Werkbank in Städten (Möbel mit E), Lagerfeuer, Siedlungs-Werkbank. **Nicht** in der Siedlungsschmiede (siehe Lücken).
- **Rezepte (20):**

  | Station | Ergebnis | Material | Mindest-Fertigkeit |
  |---|---|---|---|
  | Esse | Dolch | 2 Eisen | — |
  | Esse | Langschwert | 4 Eisen, 1 Holz | — |
  | Esse | Beil | 3 Eisen, 2 Holz | — |
  | Esse | Speer | 2 Eisen, 3 Holz | — |
  | Esse | Kriegssichel | 4 Eisen, 1 Holz | Schmieden 15 |
  | Esse | Grassense | 3 Eisen, 2 Holz | Schmieden 10 |
  | Esse | Eisenhelm | 4 Eisen | — |
  | Esse | Normannenschild | 4 Eisen, 2 Holz | Schmieden 15 |
  | Esse | Kettenpanzer | 7 Eisen | Schmieden 20 |
  | Esse | Plattenharnisch | 10 Eisen, 2 Eisenbarren | Schmieden 40 |
  | Werkbank | Holzschild | 4 Holz | — |
  | Werkbank | Eisenbuckler | 2 Holz, 1 Eisen | — |
  | Werkbank | Kurzbogen | 4 Holz | — |
  | Werkbank | Langbogen | 6 Holz | Handwerk 25 |
  | Werkbank | Lederkappe | 1 Fell | — |
  | Werkbank | Lederwams | 3 Fell | — |
  | Werkbank | Schockpistole | 4 Ersatzteile, 1 Automatenkern, 2 Eisen | Handwerk 30 |
  | Werkbank | Energiezelle ×2 | 1 Ersatzteile, 1 Automatenkern | — |
  | Kessel | Trank der Genesung | 3 Heilkraut | — |
  | Kessel | Verband ×3 | 1 Tuch | — |

- **Dazu:**
  - Verbände aus Tuchballen (3) oder Leinenkittel (2) im Gepäck (`craftBandage`);
  - die Fähigkeit „Trank brauen“ (3 Heilkraut);
  - Selbstausbessern bis 80 % (`mendAt`).
- **Bedienung:** GUI. Die Handwerk-Tafel dockt rechts an: Rezeptkarten mit Bild und Material (rot, wenn es fehlt), ein Schloss für die Fertigkeit, Güte-Balken mit den echten Chancen, Knöpfe „Herstellen“, „Mit Königseisen“ und „Ausbessern“. Ein Hinweis steht beim ersten Mal im Log (`craftHint`). Debug: „Handwerk: Esse/Werkbank/Kessel hier öffnen“.
- **Geprüft (live):** Werkbank-Tafel geöffnet. Bei 20 Holz zeigte sie Holzschild (4), Eisenbuckler, Kurzbogen, Langbogen (Schloss 25), Lederkappe, Lederwams, Schockpistole (Schloss 30) und Energiezelle ×2. „Herstellen“ ergab einen Holzschild „Solide“ (Hersteller „Testo“), Holz 20 → 16, das Gepäck +1. Das stimmt.
- **Fehlversuche / Lücken:**
  - **Siedlungsschmiede:** Die Beschreibung sagt „Waffen aus Eisen, Reparatur ohne Meister“ (data.js:1405). `useBuilding` (game.js ~12229) bietet aber nur Ausbessern bis 100 %. Herstellen geht dort nicht, weil die Siedlungsschmiede kein Esse-Möbel ist. Das ist seit S15 offen (alter Ist-Zustand Nr. 5).
  - Es gibt keine Rezepte für Hände, Beine, Füße, Umhänge oder Talismane, und keines für die 10 Teile ohne Quelle (z. B. Lederstiefel, Elixiere). Ein Rezept wäre der naheliegende Weg, sie erreichbar zu machen.
  - Elixiere können nicht gebraut werden. Der Kessel kennt nur Trank und Verband.

---

## 5. Läden und Preise

### 5.1 Preisformel (`price`, `rawPrice`, `repPrice`; game.js ~14300)
- **Ausrüstung und Verbrauch:**
  - Kaufen: Wert × Lagerfaktor der Stadt (`baseMul`, höchstens ×9) × (1,35 − Handel × 0,3) × Ruf-Faktor.
  - Verkaufen: Wert × Lagerfaktor (höchstens ×1,3) × Seltenheitsfaktor des Exemplars × (0,45 + Handel × 0,25) × Ruf-Faktor.
  - Der Verkaufspreis ist immer höchstens Kaufpreis − 1. Damit lohnt kein Kauf-und-Verkauf-Kreislauf.
- **Stadtwaren** (13 Waren, `GOODS`): Der Preis kommt aus `SIM.townPrice`, abhängig von Vorrat und Bedarf. Handel ±20 %.
- **Ruf-Faktor** (`repPrice`):
  - Rufstufe der Händlerfraktion;
  - Angst (beim Kauf +20 % je Stufe);
  - Rang −3 % je Rang (bis −35 %, mit Legende −25 % dazu);
  - Stigma (Blutkult);
  - Omega-Glaube;
  - Ruhm „Berühmt“ −5 %.
- **Jeder Kauf** zieht 0,5 Einheit aus dem Stadtlager der passenden Grundware (z. B. „Waffen“). Deshalb steigt der Preis verwandter Ware während des Einkaufs.
- **Geprüft (live, Wegwerfspiel, Schmied Kuno in Nordfurt):**
  - Kurzschwert: Preisschild 24, bezahlt 24.
  - Dolch: Schild 29, bezahlt **32**. Das Schild war vor dem ersten Kauf gemalt; der Kauf hat das Waffenlager gesenkt. Das neu gemalte Schild stimmt wieder, es ist also kein Betrug. Bei schnellem Doppelklick sieht man aber kurz einen alten Preis.
  - Beil: 47 / 47.
  - Verkauf: 3 Teile, Schild 2/3/3, erhalten 2/3/3. Das Gepäck ging korrekt herunter, Gekauftes kam an.
  - Der Schmied hatte an diesem Tag nur 3 Teile: höchstens 2 Grundteile plus 5 Würfe, gedeckelt durch „Waffenkisten“ im Stadtlager (`armsCap`). Danach stand „Heute nichts mehr. Morgen kommt neue Ware.“

### 5.2 Sortimente je Händler (live gezählt im neuen Spiel; Quelle in Klammern)

| Händler (Beruf) | Wo | Sortiment |
|---|---|---|
| Stadtschmied (`SMITH_POOL`) | jede Stadt mit Schmiede (14 im Spiel) | Königseisen, Morgenstern, Kettenkugel, Rostiges Kurzschwert, Langschwert, Beil, Speer, Dolch, Holzschild, Eisenhelm, Spitzhacke, Kettenpanzer, Kriegssichel, Kriegssense, Schlagkralle, Wurfbeil |
| Brann, Meisterschmiedin (`NPCS`) | Nordfurt | Langschwert, Zweihänder, Streitkolben, Streitflegel, Kriegshammer, Hellebarde, Beil, Große Axt, Speer, Kettenpanzer, Eisenhelm, Normannenschild, Buckler, Steppwams, Brigantine, Eisenhut, Eisenschuhe, Rabenbeil, Dornensäbel, Sensenlanze, Kronharnisch, Kronhelm, Kriegspicke, Kettenkoloss, Bergmannshelm |
| Oda, Grenzwacht | Grenzposten | Verbände, Trank, Dörrfleisch, Brot, Speer, Armbrust, Hellebarde, Kettenpanzer, Holzschild, Eisenhelm, Schuppenpanzer, Topfhelm, Steppwams, Schrott-Hellebarde, Grabräuber, Plündererharnisch, Grenzläufer, Plattenmantel |
| Gerold, Kontorhändler | Nordfurt | Brot, Dörrfleisch, Trank, Verband, Rapier, Armbrust, Langbogen, Kurzbogen, Reisemantel, Lederwams, Zauberstab |
| Quirin, Alchemist | — | Trank, Verband, Heilkraut, Seelenphiole |
| Sael, Totenschreiber | Vharnholm | Seelenphiole, Knochen, Verband, Heilkraut, Dörrfleisch, Kettenpanzer, Stab, Zauberstab, Dolch, Reisemantel, Ordenskutte |
| Mara (Händlerin, ohne Liste) | Eren | Standardware: Brot, Dörrfleisch, Heilkraut, Trank, Verband, Köderpfeife, Wanderkapuze, Fetzenmantel, Pilgerkapuze, Kuttenkapuze, Kurzschwert, Langschwert, Beil, Speer, Kurzbogen, Holzschild, Lederwams, Lederkappe, Kettenpanzer, Spitzhacke, Reisemantel (+ Stadtwaren) |
| Kaufmann/Kaufherr, Marktstand (`STALL_POOL`) | alle Städte | Brot, Dörrfleisch, Heilkraut, Verband, Reisemantel, Lederkappe, Trank, Strick (+ Stadtwaren) |
| Bäcker / Weber / Böttcher / Bauer / Magd / Handwerker (`STALL_SELL`) | freie Marktstände | eigene Ware (Brot, Mäntel, Holz, Stein, Kräuter …) |
| Wirt / Schankmagd / Koch | Schenken | Brot, Dörrfleisch, Heilkraut (+ Verband) |
| Juwelier (`MARKET_POOL`) | Markthalle Aurelheim | Trank, Verband, 6 Talismane (Ausdauer, Beweglichkeit, Krieger, Wächter, Magie, Leben), Eulenauge, Scharfes Auge, Trank der Lehre — **im Stand des Entwicklers nur Trank, Trank, Verband** |
| Waffenhändler | Markthalle Aurelheim | Langschwert, Speer, Kurzbogen, Hellebarde, Kurzschwert, Doppelklinge, Wurfmesser, Schleuder, Buckler, Stachelschild, Lederpeitsche, Grassense — **im Stand des Entwicklers nur die ersten 5** |
| Rüstmeisterin | Markthalle Aurelheim | Kettenpanzer, Plattenharnisch, Normannenschild, Eisenhelm, Topfhelm, Sonnen-, Ordens- und Thron-Harnisch und -Helm, Ketten- und Panzerhandschuhe, Kettenbeinlinge, Beinschienen, Thron- und Hochritter-Handschuhe und -Beinschienen — **im Stand des Entwicklers nur die ersten 5** |
| Magitech-Ingenieurin | Aurelheim | Messingpistole, Donnerbüchse, Trank, Schockpistole, Magiegewehr, Runenarmbrust, Kristallkanone, Präzisionsgewehr, Magitech-Schild, Energiezellen — **im Stand des Entwicklers kein Laden (`shop:false`)** |
| Gewürzhändler | Markthalle Aurelheim | **soll:** Kräuter, Brot, Dörrfleisch, Trank, 4 Elixiere (Stärke, Ausdauer, Eile, Erneuerung). **Ist:** nur die Marktstand-Ware (Liste wird überschrieben, F-03) |
| Tuchhändlerin | Markthalle Aurelheim | soll Reisemantel, Lederwams, Lederkappe; ist ebenfalls die Marktstand-Ware |
| Prothesenhändlerin (12×) | Aurelheim | Schrottarm, Schrottbein, Aurelionischer Arm und Bein, Schrott- und Aurelionisches Auge, Spezialöl, Ersatzteile (Bionik mit Rangsperre) |
| Kybernetiker (19×) | Aurelheim | Spezialöl, Ersatzteile, Feinwerkzeug, Greifhand, Federfuß, Ankerfuß, Klingenhand |
| Meisterin Vell, Prothesenmacherin | Gelenkhall | Schrott-, Aurelionische und Meister-Glieder, Trank, Verband, Spezialöl, Feinwerkzeug, Aurelionisches und Meisterauge |
| Fabrikvogt Kessler | Fabrikstadt | Ersatzteile, Energiezellen, Automatenkern, Werkzeugkiste, Eisenbarren |
| Kettenkrämerin Wiltrud, Waffenschmied Gerlach, Marketenderin, Quartiermeister | Eisenfeste | Kettenpeitsche, Eisenhut, Eisenwache, Bergmannshelm, Brigantine, Streitflegel, Aufsehermantel, Schrott-Hellebarde, Armbrust … |
| Sensenschmiedin Walburga | Hundertfeld/Weidenau | Gras-, Ernte-, Doppel-, Mond- und Kriegssense, Sensenlanze |
| Yusuf, Basarhändler | Karak-Atar | Katar, Kriegssichel, Wurfbeil, Wurfmesser, Kurzbogen, Dornensäbel, Schockpistole, Energiezelle, Spezialöl, Trank, Verband, Stiefelscheide, Brokat-Halbmantel, Maskenkapuze, Wüstenburnus, Wüstenhaube |
| Leyla, Wasserhändlerin | Karak-Atar | Wasserschlauch, Brot, Dörrfleisch |
| Ossara, Seelenhändlerin / Grimbart Knochenhand | Schwarze Feste | Seelenphiolen, Grabsiegel, Trank / Knochenspalter, Totenglocke, Schädelhelm, Totenkrone, Totenkrone-Handschuhe und -Beinschienen |
| Hagen, Schmied; Hofmar | Varonheim/Varonsburg | Langschwert, Normannenschild, Kettenpanzer, Eisenhelm, Kronharnisch, Kronhelm, Zaddelgugel, Wolfspelzmantel, Wappenmantel Valens, Doppelmantel / Proviant, Eisen |
| Hilda, Balin, Orm | Tiefhall (Zwerge) | Königseisen, Zwergenaxt, Runenhammer, Eisenhelm, Kettenpanzer, Barren / Proviant, Werkzeug, Spitzhacke, Ersatzteile / Pilzbier-Proviant |
| Nibbel (Goblinhändlerin), Tobbe Ascherling | Goblindorf nach der Befreiung, Freie | Hakenmesser, Schrottklinge, Schrottkeule, Grubenlederweste, Kräuter, Eisen, Knochen … |
| Ysolde Kielmark | Tangkron (Gischtinseln) | Entermesser, Walharpune, Seemantel, Kapitänshut, Salzsiegel, Proviant |
| Hehlerin Hedda (Blutkult) | nur nach Beitritt | 3 Blutphiolen am Tag (fester Bestand) |

- **Bedienung:** GUI (Handels-Dock). Man öffnet es über das Gespräch („Zeig mir deine Waren.“), über E am Marktstand (`tradeAt`) oder per Rechtsklick → Handeln.
- **Geprüft:** Die Liste ist live erhoben (134 Läden im Stand des Entwicklers, alle Läden des neuen Spiels). Zwerge, Goblins und Gischtinseln sind nur aus dem Code, weil ihre Karten erst beim Betreten entstehen.

**F-02 (hoch) — Ladenlisten werden in bestehenden Spielständen nie erneuert.**
- Die Markthallen-Händler bekommen ihre Liste einmal beim Anlegen (`spawnResidents`, game.js:1020: `pool: MARKET_POOL[prof]`). Danach wird die Liste mitgespeichert. Eine Erweiterung von `MARKET_POOL` kommt deshalb nie in alten Ständen an.
- Nur Prothesenhändlerin und Kybernetiker werden nachgezogen (`continueGame`, game.js:2406), und auch das nur, wenn sie noch gar keinen Laden haben.
- **Im echten Spielstand des Entwicklers (live gelesen):**
  - Juwelier: 3 Teile statt 12, also **keine Talismane**.
  - Waffenhändler: 5 statt 12.
  - Rüstmeisterin: 5 statt 19, also **kein Thron-, Sonnen- oder Ordensset** und keine Handschuhe oder Beinschienen.
  - Magitech-Ingenieurin Gerlind: **kein Laden** — keine Magitech-Waffe, kein Magitech-Schild, keine Energiezelle in Aurelheim.
- **Folge:** Thron-Set, Hochritter-Handschuhe und -Beinschienen, alle Magitech-Gewehre außer Schockpistole (bei Yusuf) und alle Talismane außer Beute sind in seinem Spiel **nicht erhältlich**.
- **Repro:** echten Stand laden, `RF.S.ents.world.filter(e=>e.prof==='Rüstmeisterin').map(e=>e.pool)`.

**F-03 (hoch) — Gewürzhändler und Tuchhändlerin verkaufen nur Marktstand-Ware.**
- `spawnResidents` setzt erst `MARKET_POOL[prof]` (game.js:1020). Dann überschreibt `planDays` die Liste mit `STALL_POOL`, wenn der Arbeitsplatz ein Stand ist (`if (J.stall) …`, game.js:1252).
- Live in einem neuen Spiel: beide Händler haben `bread, dried_meat, herb, bandage, traveler_cloak, leather_cap, potion, strick`.
- **Folge:** Elixier der Ausdauer, Elixier der Eile und Trank der Erneuerung gibt es nirgends. Elixier der Stärke gibt es nur aus Schatzgerüchten.

**Weitere Lücken:**
- HB-28 (offen): Rechtsklick → „Handeln“ (`ctx-trade`, ui.js:493) öffnet das Handelsfenster direkt mit `openModal('trade', target)`. Damit fallen die Prüfungen aus `openShop` weg: Öffnungszeit, besetzte Stadt, Kettensperre, „Verhasst“. Nur Code gelesen.
- HB-29 (offen): `buy()` (game.js ~14351) prüft nicht, ob die Ware im Tagesbestand liegt. Eine Prüfung gibt es nur im Fenster. Nur Code.

### 5.3 Stadtwaren
- **Was es ist:**
  - 13 Handelswaren (Weizen, Salz, Tuch, Fleisch, Fell, Stammholz, Holzwaren, Steine, Erz, Barren, Werkzeug, Waffen, Magitech).
  - Markthändler mit Beruf aus `MARKET_PROFS` (Händlerin, Kontorhändler, Kaufmann, Kaufherr, Lagerknecht, Tuchhändlerin, Gewürzhändler) verkaufen sie aus dem Stadtlager.
  - Im Handelsfenster stehen sie auf einer Kreidetafel mit Bestand, Preis und ▲/▼ gegen andere Städte.
- **Lager:**
  - Grenze 60 + 40 je Lagerhaus, Markthalle oder Kontor, höchstens 400.
  - Ein Verkauf füllt das Lager, ein Kauf leert es. Ausrüstung bucht 0,5 Einheit ihrer Grundware.
- **Geprüft:** Fenster offen, Kreidetafel vorhanden. Mengenkauf nicht einzeln gemessen.

### 5.4 Schwarzmarkt (`blackMarket`, `blackOffers`)
- **Was es ist:** Bionik ohne Aurelion-Rang. Der Preis ist +50 %, und mit 40 % Chance ist ein Teil gebraucht (setzt nur mit 60 % Zustand ein).
- **Wer:** Rook und Nix.
- **Angebot:** Täglich 4 Teile aus `BLACK_POOL` (Schrott- und Aurelion-Glieder und -Augen, Öl, Ersatzteile, Feinwerkzeug, Federfuß, Greifhand). Mit 25 % Chance kommt ein Prototyp dazu (Prototyp-Arm, -Bein, -Auge, Klingenhand). Die drei **Prototypen** gibt es **nur hier**.
- **Bedienung:** **nur Dialogliste.**
- **Geprüft:** nur Code.

### 5.5 Handelsfenster (Dock)
- **Inhalt:**
  - Porträt, Ladenart, Schließzeit, Gold mit Münzklang.
  - Raster mit Preisschild (rot = zu teuer), Kreidetafel der Stadtwaren.
  - Eigenes Gepäck mit Verkaufspreis, „Mehrere wählen“, Mengenschieber, Rückfrage beim Verkauf ab Selten.
  - Händlersprüche je Ladenart.
- **Größe:** bei 1024 px 580 px breit; bei 760 px reicht es von x=176 bis 756.
- **Geprüft:** live (Kaufen und Verkaufen per Doppelklick, siehe 5.1). Der Schließen-Knopf ist bei 1024 und 760 sichtbar.

---

## 6. Kontor, Handelswagen, Lieferaufträge

### Handelskontor (`ecoMenu`, game.js ~14485)
- **Was es ist:** Am Markthändler einer Stadt („Handelskontor (Markt, Wagen, Betriebe, Lieferungen)“) sieht man knappe und reichliche Waren, Händlerzüge, die unterwegs hierher sind, und ob die Stadt hungert.
- **Ablauf:** Untermenüs
  - Waren kaufen und verkaufen (öffnet das Handels-Dock nur mit Stadtwaren);
  - Preisvergleich der Städte, die man kennt;
  - Handelswagen;
  - Betriebe;
  - Lieferaufträge.
- **Handelswagen:**
  - Kauf 250 Gold, 60 Ladungen.
  - Laden: je 5 Stück der 5 billigsten Waren.
  - Losschicken in eine Stadt, deren Preise man kennt, mit 0–4 Wachen zu je 20 Gold.
  - Risiko je Fahrt (`riskOf`): 6 % Grundwert, +12 % je Untotenheer an Start oder Ziel, +5 % Karak-Atar, −2 % bei Wegzoll-Gesetz; −22 % je Wache.
  - Bei einem Überfall gehen 40–90 % der Ladung verloren. Ab 3 Wachen werden die Räuber mit 50 % zurückgeschlagen.
  - Am Ziel verkauft der Fuhrmann alles zum Marktpreis.
- **Lieferaufträge** (`ordersDay`, `deliver`):
  - Höchstens 8 gleichzeitig. Eine Stadt mit Mangel verlangt 4–15 Stück und zahlt Wert × Menge × 1,6. Frist 7 Tage.
  - Abliefern geht nur im Kontor der Zielstadt. Belohnung: **Händlergilde +2** (`S.factions.merch`), unabhängig davon, wem die Stadt gehört.
- **Bedienung:** **nur Dialogliste** (Kontor, Wagen, Senden, Betriebe, Lieferungen). Nur „Waren kaufen und verkaufen“ öffnet das Dock.
- **Geprüft (live):** Über das Kontor von Gerold (Nordfurt): „Betriebe in Nordfurt (10)“, dann „Schmiede Nordfurt kaufen (580 Gold)“. Gold ging 3000 → 2420. „Ausbauen (200 Gold)“: 2420 → 2220. „Arbeiter anwerben (30 Gold)“: 2220 → 2190. Alle Abzüge stimmen. Wagen und Lieferaufträge nur Code.
- **Fehlversuche / Lücken:**
  - Lieferaufträge geben immer Ruf bei der Händlergilde, auch für Aurelion- oder Kettenstädte. Wer für die Eisenfeste liefert, bekommt keinen Ruf bei der Kette. Das passt zur Sorge des Entwicklers („Mission für die Eisenfeste, kein Ruf dafür“) — eine Designfrage.
  - Ein eigener Wagen kann nur in Städte fahren, deren Preise man schon kennt. Das wird erklärt — gut.

---

## 7. Betriebe

### Betriebe kaufen, ausbauen, Kasse (`bizMenu`, `bizView`, `bizCollect`; economy.js `ecoDay`, `buyBiz`, `upgradeBiz`, `hireHand`)
- **Was es ist:** 14 Gewerbe (Hof, Jägerhütte, Fischerei, Stall, Holzfällerei, Werkstatt, Steinbruch, Saline, Mine, Schmelze, Schmiede, Weberei, Feinmechanik, Magitech-Werk). Die Arbeiter sind echte Bewohner. Wer tot ist, am Boden liegt oder in der Heldengruppe mitläuft, arbeitet nicht. Warenketten: Erz → Barren → Werkzeug, Waffen, Magitech.
- **Ablauf:**
  - Kaufpreis 120 + max(20, gestrige Ware) × 14 + 60 je Arbeiter.
  - Ausbau 200 × Stufe, bis Stufe 3; jede Stufe +50 % Leistung.
  - Hand anwerben: 30 Gold, 3 Gold Lohn am Tag, höchstens 3.
  - Tagesgewinn = 35 % des Warenwerts − Lohn. Er geht **in die Kasse des Betriebs**. Verlust zahlt zuerst die Kasse, den Rest der Beutel (HB-18 behoben; auch der Fall, dass sich die Summe aufhebt, ist inzwischen behoben, economy.js:283).
  - Abholen nur vor Ort (Reiter „Betriebe“) oder im Kontor der Stadt.
  - Hunger halbiert die Leistung, Jahreszeit wirkt auf Höfe, ein Unfall legt den Betrieb still.
- **Überfall, Besatzung, Zerstörung:**
  - Fällt die Stadt an die Toten oder wird sie zerstört, ist die **ganze Kasse verloren** (vorläufige Regel des Leads).
  - Ein Überfall nimmt die Hälfte der Kasse (OFFEN: „Überfall nimmt die Hälfte der Betriebskasse“, 03.10.).
  - Der Betrieb steht still, solange die Stadt besetzt ist.
- **Bedienung:** GUI-Reiter „Betriebe“ unter Siedlung (B): Hausbild, Ertrag gestern und im Schnitt, Arbeiter, Vorprodukte, Kasse, „Abholen“. Kaufen, Ausbauen und Anwerben gehen **nur über die Dialogliste im Kontor**.
- **Geprüft (live):** Kauf, Ausbau und Anwerben siehe §6. Danach ein Wirtschaftstag (`ECO.ecoDay`): Schmiede Nordfurt, Stufe 2, 1 angeworbene Hand, Ware 62 Gold, Gewinn **19** = 62 × 0,35 − 3. Kasse 19, Beutel unverändert. Das stimmt.
- **Fehlversuche / Lücken:**
  - Kaufen, Ausbauen und Anwerben fehlen im Reiter „Betriebe“. Man muss zum Kontor.
  - SHF-06: Betriebe in besetzten Städten stehen ohne Meldung still. Nur die verlorene Kasse wird gemeldet.
  - Rechenbeispiel: 810 Gold Einsatz bringen 19 Gold am Tag, also gut 40 Tage bis zum Rückfluss. Das ist eine Balance-Frage, keine Entscheidung von mir.

---

## 8. Bank und Lager

### Bank
- **Was es ist:** In Aurelheim gibt es ein Bankgebäude mit „Bankier“ und „Geldwechsler“ (`HALL_TYPES`, game.js:904). **Eine Bankfunktion gibt es nicht**: kein Einzahlen, keine Zinsen, kein Kredit (Suche nach Bankier, Zins, Kredit: keine Fundstelle außer der Berufsliste). Die beiden sind Statisten.

### Lager (Siedlung)
- **Was es ist:** Mit einem fertigen Lagergebäude (14 Holz) gibt es den gemeinsamen Vorrat `S.stash`. Er wird im Gepäck-Fenster als „Lagerbestand“ angezeigt (24 Felder). Man legt Dinge mit „Ins Lager“ ab oder zieht sie hinein. Seltenheit, Affixe und Zustand bleiben erhalten (AUDIT H-04).
- **Bedienung:** GUI (Gepäck). Ohne Lagergebäude steht dort „Ohne Lagergebäude gibt es keinen gemeinsamen Vorrat.“
- **Geprüft:** live, nur die Anzeige ohne Lagergebäude. Das Lager selbst nur Code.
- **Fehlversuche / Lücken:**
  - **F-08 (mittel):** `toStash` (game.js ~22147) hat keine Obergrenze, das Raster zeigt aber fest 24 Felder (`sg.childElementCount !== 24`, ui.js:994). Ab dem 25. Teil liegt alles unsichtbar im Lager und ist nur wieder erreichbar, wenn vorne etwas entnommen wird. Nur Code gelesen.
  - Das Lager ist von überall erreichbar, sobald es gebaut ist. Man muss nicht im Lager stehen: `toStash` prüft keine Entfernung. Es wirkt also wie eine Fernbank. Ob das gewollt ist, ist offen.

---

## 9. Siedlung

### Gründung und Bau
- **Was es ist:** Ein eigenes Lager. Es wächst zur Siedlung mit Siedlern, Moral, Hof, Wachen und Überfällen. Nach dem Tod übernimmt der Erbe die Siedlung (Moral −10).
- **Ablauf:**
  - Gründen kostet 5 Holz (`foundCamp`). Name „Haus + heim“, Moral 60, ein Lagerfeuer entsteht.
  - Bauen mit B (Baumodus, `startPlacing`).
  - Fehlendes Material kaufen Fuhrleute für Gold zu („Gold-Sog“: Holz 4, Stein 5, Eisen 12, Nahrung 3 je Einheit).
- **Bauten (14):**

  | Bau | Kosten | Wirkung |
  |---|---|---|
  | Lagerfeuer | 5 Holz | Rasten 1 Std: volle Ausdauer, +15 % Leben |
  | Zelt | 8 Holz | 2 Plätze |
  | Hütte | 20 Holz, 8 Stein | 4 Plätze |
  | Lager | 14 Holz | gemeinsamer Vorrat (§8) |
  | Werkbank | 12 Holz, 4 Stein | Ausbessern bis 80 % (1 Eisen je 2 Teile, 30 min) |
  | Schmiede | 20 Holz, 15 Stein, 10 Eisen | Ausbessern bis 100 %. **Kein Herstellen** (§4) |
  | Ackerfläche | 10 Holz | 12 Nahrung am Tag |
  | Weide mit Stall | 16 Holz, 4 Stein | 6 Tiere (Kuh 70, Schaf 40 Gold beim Tierhändler), Hofvorrat |
  | Heilerhütte | 18 Holz, 6 Stein | Pflegen: 2 Std, 1 Kraut je Person, +35 % Leben, schient, reinigt |
  | Brunnen | 18 Stein | Moral +2 am Tag, volle Ausdauer |
  | Palisade | 6 Holz | Wehrzaun |
  | Tor | 12 Holz, 4 Eisen | Durchlass |
  | Wohnzone | 4 Holz | Siedler bauen selbst bis zu 4 Hütten (je 20 Holz und 8 Stein, eine am Tag) |
  | Wachturm | 24 Holz, 12 Stein | warnt, nennt die größte Gefahr |

- **Siedler:** Je freiem Platz zieht ein Siedler zu. Er arbeitet nach Prioritäten (Verwundete, Nahrung, Verteidigung, Holz, Handwerk, Ruhe).
- **Moral (M1):** Brunnen +2, Ruhe +1 je Kopf, Held in der Nähe +1, Hunger −6, Überbelegung −3, Toter −4. Stufen: Zuversichtlich ×1,25, Mürrisch ×0,75, Verzweifelt ×0,5 und täglicher Weggang.
- **Überfälle (M2):**
  - Reichtum (4 je Bau, 3 je Siedler, 2 je Tier, 1 je 25 Vorrat) lockt nahe Quellen an: Bande, Tote, Kette, Goblins, sonst Wölfe.
  - Gefahr 6 % + Reichtum/300, höchstens 45 %. Angreifer: 2 + Reichtum/15, höchstens 9.
  - Plünderung: Vorrat −30 %, ein Bau beschädigt, Moral −10.
- **Schutzlos (M4):** Lagerwachen wirbt man beim Wirt an (80 Gold, dann 5 Gold am Tag).
- **Bedienung:** GUI. „Lager & Siedlung“ (B) dockt rechts an; der Reiter „Betriebe“ ist daneben. Der Baumodus ist visuell. Debug-Einträge „Siedlung: …“ sind vorhanden.
- **Geprüft:** Fenster geöffnet (bei 1024 px x=398–1018; bei 760 px x=136–756; Schließen sichtbar). Bauen, Moral und Überfälle nur Code und MECHANIKEN.
- **Fehlversuche / Lücken:** Siedlungsschmiede ohne Herstellen (F-05). IHF-02 (Bericht): Die Siedlung ist eine Insel — kein Markt, kein Krieg, keine Bandenwirkung über die Überfälle hinaus.

---

## 10. Schmied

### Schmiede-Dock: Ausbessern, Verbessern, Schmieden lassen (`smithUI`, `smithRepair`, `smithUpgrade`, `smithCommission`; game.js ~14590–14640)
- **Was es ist:** Beim Schmied (jeder Stadtschmied, Brann, Hagen, Gerlach) öffnet „Kannst du das ausbessern?“ oder Rechtsklick → Reparieren eine Tafel am rechten Rand.
- **Ablauf:**
  - **Ausbessern:**
    - Alle abgenutzten Teile werden angezeigt, angelegte mit Punkt. Ein Klick wählt ein Teil ab oder wieder an.
    - Preis: Summe von (1 − Zustand) × Wert × 0,5, zusammen mindestens 5 Gold. Danach 100 %, Beziehung +3.
  - **Verbessern:**
    - Eine Gütestufe höher, bis „Meisterlich“. Ein Gekauftes Teil zählt als „Solide“.
    - Preis: Wert × 0,5 × (Stufe + 1), mindestens 20 Gold, dazu Eisen = Stufe + 1.
    - Ab „Gut“ hebt die Güte die Seltenheit und würfelt Affixe. Unikate und Stapelware gehen nicht.
  - **Schmieden lassen:**
    - Jedes Esse-Rezept aus eigenem Material. Lohn 30 % des Werts, mindestens 10 Gold.
    - Der Schmied arbeitet mit Schmiedekunst 60 (oder deiner, wenn höher). Deine Fertigkeit steigt dabei nicht.
  - Dazu „Waren ansehen“ (Handel) und „An der Esse selbst schmieden“, wenn eine Esse nahe steht.
- **Belohnung:** Beziehung +3 beim Ausbessern.
- **Bedienung:** GUI. Debug: „UI: Schmiede-Dock (nächster Schmied)“.
- **Geprüft (live, Schmied Kuno, Nordfurt):**
  - 5 Teile auf 50 %, angezeigt „Preis 19 Gold“, bezahlt 1000 → 981, alle auf 1,00.
  - „Verbessern“ Kurzschwert „Solide → Gut · 20 Gold · 2 Eisen“: Gold −20, Eisen 10 → 8. Ergebnis: Güte „Gut“, Seltenheit „ungewöhnlich“, 1 Affix.
  - „Schmieden lassen“ Dolch „2 Eisenerz · Lohn 10 Gold“: Gold −10, Eisen −2, Gepäck +1. Ergebnis: Dolch „Meisterlich“, „selten“, Hersteller Kuno.
  - Alle angezeigten Preise stimmen mit dem Abzug überein.
- **Fehlversuche / Lücken:**
  - Balance: Mit Schmiedekunst 60 liefert „Schmieden lassen“ etwa 14 % Solide, 71 % Gut und 14 % Meisterlich. Ein Kettenpanzer (7 Eisen + 57 Gold) ist damit meist „ungewöhnlich“, ein Plattenharnisch (10 Eisen, 2 Barren + 138 Gold) öfter „selten“. Das ist billiger als jede Ladenware gleicher Güte. Die Regel stammt vom Lead (OFFEN UI-Frage 5); der Entwickler hat sie nicht bestätigt.
  - Die Tafel benennt Eisen als „Eisenerz“, im Text heißt es „Eisen“. Eine kleine Unstimmigkeit.
  - Die Gesprächsfassung (`repairAll`, alles oder nichts) bleibt als Rückfall für Koop-Gäste.

---

## 11. Heiler

### Heiler in der Stadt (`healerTreat`, `woundCare`; game.js ~12830–12850)
- **Was es ist:** Heilerin, Heiler, Medica, Feldscher und Elena behandeln dich und deine Gruppe (im Umkreis von 200 px).
- **Ablauf:**
  - **Behandeln:** Preis (fehlendes Leben × 0,5) + 8 je Schlafkrankheit, mindestens 5 Gold. Die Behandlung dauert 3,5 s; danach volle Heilung. Seit HB-13 zählen auch verletzte Glieder (behoben).
  - **Wunden versorgen:** 25 Gold. Alle Brüche werden geschient (heilen doppelt so schnell), Entzündungen gereinigt.
  - Siedlungs-Pfleger und Heilerhütte, siehe §9.
- **Bedienung:** **nur Dialogliste.**
- **Geprüft:** nur Code (HB-13-Probe im Selbsttest).
- **Fehlversuche / Lücken:**
  - Wer nur ein verletztes Glied hat (Leben voll), zahlt den Mindestpreis von 5 Gold. Das ist sehr billig für eine volle Gliedheilung. Balance-Frage.
  - Kein Fenster mit Körperbild, obwohl die Prothesen-Werkbank eines hat. Guter GUI-Kandidat (§16).

---

## 12. Tierhändler, Pferdehof, Stall

### Tierhändler (`beastsUI`, `buyBeast`, `beastMenu`)
- **Was es ist:** Begleittiere (Hund 60, Wolfshund 180, Kampfeber 140 Gold), Reittiere (Stall-Fenster), Hoftiere für die Weide (Kuh 70, Schaf 40) und die Wartung des Messingrosses (1 Automatenkern).
- **Wo:** Kreuzweg, Nordfurt, Kupferhafen (`ensureBeastTraders`).
- **Ablauf:** Ein Tier gleichzeitig; „freilassen“ gibt das Tier frei.
- **Bedienung:** GUI („Tierhändler“). Koop-Gäste bekommen die Dialogliste.
- **Geprüft (live, Hartwig):**
  - Angebot „Hund 60 / Wolfshund 180 / Kampfeber 140“.
  - Hund gekauft: Gold 2000 → 1940, ein Begleiter „Grau“ (`wild_dog`) entstand. Das Fenster schloss sich nach dem Kauf.

### Stall / Pferdehof (`stableUI`, `stableOffers`, `buyHorse`)
- **Was es ist:** Wochenangebot je Händler (aus einem Hash, also ohne Zufall).
  - Der Pferdezüchter Wendel hat 5 Pferde, Tierhändler haben 3.
  - Das Messingross (900) gibt es nur in Kupferhafen, das Totenross (400) nur mit Totenrang oder Pakt.
  - Jedes Pferd hat Tempo, Ausdauer, Mut und Fellfarbe. Ein vorhandenes Pferd wird für 40 % seines Werts eingetauscht.
- **Bedienung:** GUI („Stall“).
- **Geprüft (live, Wendel):**
  - 5 Angebote (372/414/387/322/273 Gold). Gekauft: 1940 → 1568 = 372, Pferd „Schatten“, Tempo 1,13.
  - Zweites Pferd „Eintauschen — 265 Gold“: 1568 → 1303. Das stimmt.
- **Fehlversuche / Lücken:**
  - **F-10 (niedrig):** Die Logzeile beim Tausch sagt „(… bleibt im Stall, … Gold angerechnet)“ (game.js:384). Tatsächlich ist das alte Pferd weg: `S.mount` wird ersetzt, eine Stall-Liste gibt es nicht. Der Text ist irreführend.
  - HB-47 (offen): Beinschaden bremst das Pferd.

---

## 13. Kutsche, Schiff, Luftschiff

### Kutsche und Fähre (`travelUI`, `coachTalk`, `journey`)
- **Was es ist:** Fahrten gegen Gold. Die Zeit vergeht unterwegs. Auf unsicheren Strecken wird man auf halber Strecke überfallen (3–4 Gegner, der Kutscher flieht). Nicht möglich, wenn Feinde nahe sind. Ohne Aufenthaltsschein sind Ziele im Hochreich gesperrt.
- **Bedienung:** GUI (Kutsche-Dock mit Karte und gestrichelten Strecken).
- **Geprüft (live, Wernher in Eren):**
  - Ziele: Nordfurt 30 Gold/~4 Std, Kreuzweg 102/~15, Aschfurt 119/~17, Salzhafen 148/~22, Sonnwacht 167/~25.
  - Nordfurt gewählt: Gold −30, der Held wurde versetzt, die Uhr lief 262 Minuten. Das stimmt.
  - Nach der Ankunft blieb die Ziel-Liste der alten Kutsche sichtbar (Knopf „Verstanden.“ und Ziele). Das ist harmlos.

### Seefahrt zu den Gischtinseln (`seaTalk`, `seaVoyage`, `shipChoices`, `cargoMenu`)
- **Was es ist:**
  - Überfahrt Salzhafen/Kupferhafen ↔ Tangkron, 60 Gold, ~6 Std.
  - An Deck: Enterkampf, Sturm oder ruhige See. Wer an Deck fällt, wacht im Abfahrtshafen auf.
  - Eigenes Schiff: 900 Gold, Laderaum 20.
  - Frachthandel mit 4 Waren je Hafen (Preise in `PORT_PRICE`, Verkauf × 0,9).
- **Bedienung:** **nur Dialogliste** (Kapitän, Schiffskauf, Fracht).
- **Geprüft:** nur Code.

### Luftschiffe (`harborTalk`, `airVoyage`, `airRepairMenu`, `airUpgradeMenu`)
- **Was es ist:** Die Flotte der Krone (2 Handelsschiffe, 1 Patrouille).
  - Passage: Fahrpreis = Entfernung × 0,12, mindestens 30 Gold. Ab Aurelion-Rang 1.
  - Reparatur: Barren für die Hülle, Werkzeug für den Motor, Magitech für die Steuerung. Dazu Ausbau.
  - Fallen Handelsschiffe aus, bekommt Aurelion weniger Nahrung (`airSupply`).
- **Bedienung:** **nur Dialogliste.**
- **Geprüft:** nur Code.

---

## 14. Investieren (Stadtkasse)

### Investieren (`investMenu`, game.js ~7741)
- **Was es ist:** Am Anschlagbrett einer wachsenden Stadt („In die Stadt investieren“) zahlt man für:
  - ein Wohnhaus (120 Gold + 20 Holz);
  - eine Werkstatt (220 Gold + 30 Holz + 15 Stein);
  - „Handel fördern“ (100 Gold, Wohlstand +25);
  - „Wache verstärken“ (150 Gold + 10 Eisen).
- **Belohnung:** **+3 Ruf bei der Fraktion der Stadt** (`townFac`). Das ist die richtige Fraktion.
- **Bedienung:** **nur Dialogliste.**
- **Geprüft:** nur Code. Der Abzug geschieht erst nach erfolgreichem Bau (`pay`: `fn()`, dann `S.gold -= gold`). Bei „Kein Bauplatz mehr frei“ geht also nichts verloren — gut.


---

## 15. Alle Fenster und Menüs

### Kopfleiste und HUD (`index.html`, ui.js `NAV`, `refreshHUD`)
- **Oben:**
  - Uhr, Wetter, Gold.
  - Menüleiste mit 9 Gruppen: Charakter (C), Gepäck (I), Gruppe (G), Lager & Siedlung (B), Karte (M), Aufträge (J), Mächte (F), Kodex (H), Optionen (Esc).
  - Eine Gruppe mit mehreren Fenstern zeigt Reiter: Charakter → Werte, Talente (T), Zauber (Z), Effekte (X) und Ausbildung; Siedlung → Lager, Betriebe; Mächte → Fraktionen, Chronik (K); Gruppe → Gruppe, Stall.
- **Links:** Porträt, Klasse, Rang, Balken, Zustände, Körper, Gruppe, Rohstoffe.
- **Rechts:** Kontextfeld zum gewählten Ziel (mit „Handeln“ und „Reparieren“).
- **Unten:** Log mit Filtern und Schnellleiste (1–0).
- **Dazu:** Toasts, Fund-Karte ab Legendär, Warnchip, Auftrags-Tracker.

### Tasten (`bindInput`)
- **E** benutzen/sprechen, **Q** ausweichen, **R** auf- und absitzen, **N** Minikarte.
- **I** Gepäck, **C** Charakter, **G** Gruppe, **B** Siedlung, **F** Fraktionen, **K** Chronik, **M** Karte, **J** Aufträge, **T** Talente, **X** Effekte, **H** Kodex, **Z** Zauberbuch.
- **Esc** schließt der Reihe nach: Bauen, Dialog, Fenster, Auswahl; sonst öffnet es die Optionen.
- **Strg+Umschalt+D** Debug.
- **Leertaste/Esc** überspringen Kamerafahrt und Heldentod.

### Fensterliste (`openModal`, ui.js ~825) — 22 Fenster, alle im Browser geöffnet

| Fenster | Öffnen | Art | Inhalt |
|---|---|---|---|
| Inventar | I | Vollbild | Papierpuppe mit Figur, Raster, Filter, Ordnen, Lager, Bildkarte, Vergleich, Sperre |
| Charakter | C | Vollbild | Attribute mit Statpunkten, Körperdiagramm, Titel, Klassenkette |
| Gruppe | G | Dock rechts | Gefährten, Befehle, Moral |
| Lager & Siedlung | B | Dock | Bauten, Siedler, Prioritäten, Moral, Bedrohung |
| Betriebe | Reiter unter B | Dock | eigene Betriebe, Kasse, Abholen |
| Fraktionen | F | Vollbild | Ruf, Ränge, Banner |
| Chronik | K | Pergament | große Taten mit Jahr und Ort |
| Weltkarte | M | Vollbild | Ortsbild, Ereignis-Pins, Grenzen, Kriegskarte |
| Handel | Gespräch/E am Stand/Rechtsklick | Dock | siehe §5.5 |
| Einstellungen | Esc | Vollbild | Optionen, Speicherplätze, Cloud-Export |
| Ausbildung | Reiter | Vollbild | Klassen und Lehrer |
| Aufträge | J | Pergament-Doppelseite | Liste mit Siegeln, Brief, Verfolgen/Abbrechen |
| Talente | T | Vollbild | Sternbild-Talentbaum |
| Aktive Effekte | X | Vollbild | Zustände, Elixier |
| Kodex | H | Pergament | Handbuch, Lehrer, Magie, Ränge, Zustände, Gegner; Code NACHTGLAS |
| Zauberbuch | Z | Vollbild | gelernte Zauber |
| Stall | Tierhändler/Wendel | Vollbild | Pferdekarten mit Werten |
| Tierhändler | Tierhändler | Vollbild | Begleittiere, Reittiere, Hoftiere |
| Prothesen-Werkbank | Vell/Kybernetiker/Medica/Werkbank | Vollbild | Körperbild, Wartung, Tausch (neu seit 03.10.) |
| Handwerk | Esse/Werkbank/Lagerfeuer | Dock | Rezeptkarten, Güte-Balken |
| Schmiede | Schmied | Dock | Ausbessern, Verbessern, Schmieden lassen |
| Kutsche | Kutscher/Fährmann | Dock | Karte mit Strecken, Zielkarten |

**Geprüft (live):** Jedes der 22 Fenster habe ich per `openModal` geöffnet, bei 1024×700 und 760×600.
- Alle öffnen ohne Fehler und haben einen sichtbaren Schließen-Knopf (×, `#modal-close`).
- Vollbild-Fenster bei 1024: Rahmen bis x=1024, × bei x=948. Bei 760: × bei x=692.
- **Docks** brauchen etwa 0,5 s zum Hereingleiten. Danach liegen sie bei 1024 px zwischen x=378–438 und 1018, bei 760 px zwischen x=116–176 und 756. Das × liegt innerhalb.
- Schmiede (Inhalt 1188 px hoch) und Kutsche (636 px) scrollen innerhalb der Tafel. Es gibt keinen waagerechten Überlauf.
- **Befund:** Bei 760 px Breite bleiben neben einem Dock nur 116–176 px Welt sichtbar. Das deckt sich mit OFFEN „bei 1280 px bleibt links nur ein schmaler Streifen“ und ist bei 760 px noch deutlicher.
- Ganz kleine Fenster (406×310, eingeklapptes Panel): Nur die Einstellungen liefen waagerecht über.

### Debug-Menü (Strg+Umschalt+D, `debugSections`)
- **Was es ist:** Gruppen mit Karten, wie im alten Ist-Zustand §2.29 beschrieben. Neu für Bereich D sind:
  - Gegenstände & Handel: „Items: …“ (Beute regnen lassen, Gepäck füllen, Marken löschen), „Handel: nächsten Händler öffnen (Dock)“, Händlerspruch, +500 Gold.
  - UI: Schmiede-Dock, Kutsche-Dock, Betriebe-Reiter, Fund-Karte Legendär/Mythisch, Pergament.
  - Handwerk: Esse, Werkbank, Kessel hier öffnen.
  - Siedlung: Gold-Sog, Moral ±20, Heilerhütte, Überfall, Lagerwache, Schutz-Status.
  - Grafik: Rüstungsset anlegen.
- **Lücke:** Es gibt keinen Debug-Knopf „Kontor öffnen“, „Schwarzmarkt“, „Stall öffnen“ oder „Tierhändler öffnen“. Der Tierhändler hat eine Probe im Selbsttest.

---

## 16. Systeme ohne Fenster

Wunsch des Entwicklers: „die Schmiede etc. soll ein GUI haben“.

**Seit dem letzten Stand ein Fenster bekommen haben:** Schmiede, Kutsche/Fähre, Tierhändler, Prothesen-Werkbank (neu), Handwerk, Betriebe-Reiter, Handel.

**Noch reine Dialogliste (`UI.dialogue`), mit Bewertung:**

| System | Funktion | Bedienaufwand heute | Bewertung |
|---|---|---|---|
| Handelskontor (Wagen, Senden, Betriebe kaufen, Lieferaufträge, Preisvergleich) | `ecoMenu`, `wagonMenu`, `sendMenu`, `bizMenu`, `ordersMenu`, `ecoPrices` | 5 verschachtelte Listen, Zahlen im Fließtext | **sehr hoch** — Zahlen, Karte und Vergleich schreien nach Tabelle und Karte. Betriebe-Kauf gehört in den Reiter „Betriebe“. |
| Schwarzmarkt | `blackMarket` | Liste mit 4–5 Teilen | **hoch** — einfach: Handels-Dock mit Zuschlag wiederverwenden (OFFEN: „Schwarzmarkt als Raster“). |
| Zauber lernen | `spellMenu` | Liste mit Bedingungen im Text | **hoch** — Zauberkarten mit Kosten, Schule, Sperre. |
| Heiler / Wunden versorgen | `healerTreat`, `woundCare` | 1–2 Zeilen | **mittel** — das Körperbild der Werkbank ließe sich wiederverwenden. |
| Seefahrt, eigenes Schiff, Fracht | `seaTalk`, `shipChoices`, `cargoMenu` | Preistabelle als Text | **mittel–hoch** — Frachthandel braucht ein Raster wie die Kreidetafel. |
| Luftschiff-Hafen (Passage, Reparatur, Ausbau) | `harborTalk`, `airRepairMenu`, `airUpgradeMenu` | 3 Listen | **mittel** — Flottenzustand als Balken. |
| Investieren | `investMenu` | 4 Knöpfe | **mittel** — passt als Reiter ans Anschlagbrett. |
| Anschlagbrett / Kopfgelder | `boardMenu`, `conList` | Liste, Brief als Pergament | **mittel** — Brief vorhanden; eine Brett-Ansicht mit Zetteln fehlt. |
| Schuldknechtschaft / Fesseln | `bondMenu`, `captiveMenu` | Liste | niedrig–mittel |
| Kerker | `jailChoices` | Liste | niedrig (Szene, kein Handel) |
| Schenke (Spiele, Unterkunft) | `tavernChoices` | Liste | niedrig |
| Heiliges Gericht (Ablass, Klage) | `holyCourt` | Liste | niedrig |
| Ratgeber, Gerüchte, Gespräch | `talk`, `rumorChoices`, `askMenu` | Liste | bleibt Dialog (gewollt) |

**Koop-Gäste** sehen auch Schmiede, Kutsche und Tierhändler nur als Liste. Der Handel ist für sie ebenfalls eine Liste (§17).

---

## 17. Koop

### Netzwerk-Koop (coop.js)
- **Was es ist:**
  - Der Host rechnet die ganze Welt und speichert. Gäste schicken nur Eingaben und bekommen die Welt im Umkreis von 1400 px zurück.
  - Ein Gast spielt einen eigenen Helden (neu, gespeichert, Erbe) oder steuert einen Gefährten.
  - Verbindung über PeerJS/WebRTC. Mit `?coopLocal` geht es auch über zwei Fenster im selben Browser.
- **Was Gäste können:**
  - Laufen, kämpfen, ausweichen, Schnellleiste (1–0), E (aufheben, sprechen, Anschlagbrett), Chat (Enter).
  - Fenster: Gepäck (I), Tausch (U), Charakter und Gruppe (C/G), Aufträge (J), Karte (M).
  - Ausrüstung an- und ablegen, benutzen, fallen lassen, dem Helden geben, Statpunkte vergeben, Klasse/Titel/Talent setzen.
  - Dialoge laufen auf dem Host so, als wäre die Gastfigur der Held (`runAs`). Der Ruf ist gemeinsam, die Ränge sind je Figur.
  - Nimmt ein Gast einen Auftrag an, fragt ein Fenster den Host (Ja/Nein).
  - Eingänge benutzt nur die ganze Gruppe gemeinsam, auf Zustimmung des Hosts.
  - Beute: Wer zuerst aufhebt, hat sie. Auftragsgold wird geteilt (`questGold`). Erfahrung wird geteilt.
- **Was Gäste nicht können:**
  - B, F, K, T, X, H, Z, R, N zeigen „Im Koop nur der Host.“
  - Kein Lager („Das Lager gehört dem Host.“), kein Speichern.
- **Handel für Gäste** (`sendShop`, `guestShopDeal`, `guestShop`):
  - eine **Dialogliste** mit bis zu 16 Waren. Bezahlt wird aus dem eigenen Beutel (`coopGold`).
  - **Fehlversuche (F-07, mittel — HB-30 weiter offen):**
    - Gastkäufe von Ausrüstung buchen das Stadtlager nicht (der Host-Kauf zieht 0,5).
    - Gastverkäufe füllen es nur bei Stadtwaren.
    - Die Handel-Fertigkeit steigt nicht.
    - Es fehlen `onItemGained` (Auftragsauslöser) und die Prüfung `slot.lock`: Ein Gast kann ein gesperrtes Teil verkaufen.
    - Die Rückfrage beim Verkauf ab Selten fehlt.
  - Das Dock für Gäste ist BLOCKIERT. Dafür braucht es einen Adapter, siehe OFFEN.
- **Tausch:** Der Gast sieht nur die ersten 14 Teile (coop.js:509), der Host im Tauschmenü nur die ersten 16 (coop.js:522). Mehr ist nicht erreichbar.
- **Geprüft:** nur Code. Live habe ich Koop nicht getestet; dafür braucht es zwei Fenster.

---

## 18. Speichern, Laden, Plätze, Cloud-Export

### Speichern und Laden (state.js)
- **Was es ist:**
  - Gespeichert wird bei jedem Tagesbeginn und beim Schließen (`beforeunload` → `saveSync`), komprimiert, wenn der Browser es kann.
  - **Mehrere Plätze:** Jeder neue Held bekommt einen eigenen Platz (`newSlot`). Der alte Stand bleibt unter `rotfall.legacy.save`. Die Übersicht `rotfall.slots` steht im Titelbildschirm mit Löschen (mit Rückfrage).
  - Einzelspieler und Koop sind getrennt.
  - Nie gespeichert wird bei: Testkarten, `S._quiet`, Kamerafahrt, fehlendem Helden, Koop-Gast.
- **Cloud-Export** (`cloudsave.js`):
  - Datei `.rfsave`, AES-GCM-256, Passwort ab 8 Zeichen (PBKDF2 600 000 Runden).
  - Der Import bewahrt den alten Stand. Er geht nur über https oder localhost.
- **Migration:** `continueGame` und die `ensure*`-Funktionen bauen flüchtige NPC-Gruppen neu auf (HB-01–HB-04 behoben laut OFFEN). **Ladenlisten werden dabei nicht erneuert (F-02).**
- **Geprüft (live):**
  - Ein Wegwerf-Platz (`ztestD`) wurde angelegt, darin ein neues Spiel begonnen, dann zurück auf `legacy`, der Wegwerf-Platz gelöscht und die Seite verlassen.
  - Der echte Stand ist danach byte-gleich mit `rotfall.backup.s14c`.
  - `S._quiet` hat das Speichern beim Verlassen verhindert.

---

## 19. Zusammenfassung Fehlversuche

Nach Schwere sortiert. „live“ = im Spiel nachgestellt, „Code“ = nur gelesen. Die Zeilen sind ungefähr, weil `game.js` während der Prüfung geändert wurde.

**Hoch**
- **F-01 — Waffenständer vermehrt Waffen (live).** `rummage` hängt die gewürfelte Waffe an die gemeinsame Liste `RUMMAGE.weapon_rack` (`pool.push`). Jede weitere Durchsuchung wirft mehr Waffen aus (gemessen: bis zu 13 Waffen auf einmal, 93 Waffen in 10 Durchsuchungen). Das gilt bis zum Neuladen. — game.js:5540 (`rummage`), 5528 (`RUMMAGE`).
- **F-02 — Ladenlisten veralten in alten Spielständen (live im Stand des Entwicklers).**
  - Juwelier 3/12, Waffenhändler 5/12, Rüstmeisterin 5/19, Magitech-Ingenieurin ohne Laden.
  - Folge: Thron-Set, Talismane, Magitech-Gewehre und Hochritter-Handschuhe und -Beinschienen sind im Spiel des Entwicklers nicht erhältlich.
  - game.js:1020 (`spawnResidents`, Liste nur beim Anlegen); game.js:2406 (Nachzug nur für Bionik-Händler).
- **F-03 — Gewürzhändler und Tuchhändlerin verkaufen nur Marktstand-Ware (live im neuen Spiel).** `planDays` überschreibt die Liste aus `MARKET_POOL` mit `STALL_POOL`. Dadurch fehlen 4 Elixiere im Handel. — game.js:1252 (`if (J.stall) …`) gegen 1020.

**Mittel**
- **F-04 — 10 Gegenstände ohne jede Quelle (Code, Skript über alle Dateien):**
  - Sturmsense (data.js:103), Donnerwort (data.js:104), Lederstiefel (data.js:164);
  - Talisman des Jägers (data.js:292), Splitter des Rotfalls (data.js:298), Blutstein (data.js:299);
  - Elixier der Ausdauer, Elixier der Eile, Trank der Erneuerung (nur Gewürzhändler, F-03), Arkaner Trank (data.js:267, nirgends).
- **F-05 — Siedlungsschmiede kann nicht schmieden (Code).** Die Beschreibung sagt „Waffen aus Eisen“, `useBuilding` bietet nur Ausbessern. — data.js:1405, game.js:12229.
- **F-06 — 4 legendäre Sets nur durch Mord (Code und live).**
  - Sternwacht (Konrad), Rooks General (Rook), Ordensmeister (Kelan), Grundteile Hochritter (Oda) gibt es nur aus dem Grab ihres Trägers.
  - Für den Spieler gibt es keinen Hinweis. Ob das gewollt ist, muss der Entwickler entscheiden. — game.js:2844 (`ELITE_KIT`, `eliteKit`).
- **F-07 — Koop-Gast-Handel unvollständig (Code; HB-30).**
  - Keine Lagerbuchung für Ausrüstung, kein `onItemGained`, kein Fertigkeitszuwachs.
  - Gesperrte Teile sind verkäuflich, keine Rückfrage ab Selten.
  - Gepäck/Tausch zeigt nur 14 bzw. 16 Teile. — coop.js:313 (`guestShopDeal`), 509, 522.
- **F-08 — Lager ohne Grenze, Anzeige fest 24 Felder (Code).** Ab dem 25. Teil ist es unsichtbar. Dazu ist das Lager ohne Entfernungsprüfung von überall nutzbar. — game.js ~22147 (`toStash`), ui.js:994.
- **F-11 — „Handeln“ im Kontextfeld umgeht Ladensperren (Code; HB-28 offen).** Öffnungszeit, Besatzung, „Verhasst“ und Kettensperre gelten dort nicht. — ui.js:493.
- **F-12 — Lieferaufträge geben immer Ruf bei der Händlergilde (+2), nie bei der Fraktion der Zielstadt (Code).** Das ist eine Designfrage im Sinne von „Mission für die Eisenfeste, kein Ruf dafür“. — economy.js `deliver`.

**Niedrig**
- **F-09 — Legendäre Umhänge, Hände, Beine, Füße und Talismane bekommen keinen Legendären Effekt (Code).** `LEGENDS` deckt nur Waffe, Rumpf, Nebenhand und Kopf ab; die Teile haben dann nur 2 Affixe. — data.js `LEGENDS`, game.js `rollRarity`.
- **F-10 — Pferdetausch-Text „bleibt im Stall“ ist falsch (Code und live).** Das alte Pferd ist weg, eine Stall-Liste gibt es nicht. — game.js:384.
- **F-13 — Preisschild im Handels-Dock kurz veraltet nach einem Kauf (live).** Schild 29, bezahlt 32, weil der vorige Kauf das Waffenlager gesenkt hat. Das neu gemalte Schild stimmt. Nur bei schnellen Doppelklicks sichtbar. — ui.js `tradeUI`/`trPaint`.
- **F-14 — Dock bei 760 px: nur 116–176 px Welt sichtbar (live).** Bei 1024 px bleiben 378–438 px. — ui.js `DOCKED`.
- **F-15 — Kein Bankgeschäft.** Bankier und Geldwechsler sind nur Statisten. — game.js:904.
- **F-16 — Hinweis- und Bedienlücken:**
  - Kein Debug-Knopf für Kontor, Schwarzmarkt, Stall, Tierhändler.
  - Betriebe kauft man nur im Kontor-Dialog, nicht im Reiter.
- **Balance-Fragen (keine Fehler, Entscheidung des Entwicklers):**
  - „Schmieden lassen“ liefert mit Fertigkeit 60 zu 85 % „Gut“ oder besser, also billige seltene Rüstung.
  - Ein Heiler heilt verletzte Glieder bei vollem Leben für 5 Gold.
  - Ein Betrieb braucht gut 40 Tage bis zum Rückfluss.

**Behoben (früher gemeldet, hier geprüft oder im Code bestätigt):**
- HB-13: Heiler sieht verletzte Glieder.
- HB-18 und HB2-10: Betriebsverlust wird abgezogen, auch wenn sich die Summe aufhebt.
- Tierhändler-„Zurück“.
- Umhänge in Läden und Beute.
- Schmiede-, Kutsche-, Tierhändler- und Werkbank-Fenster sind gebaut.
