# Audit Teil B — Welt, Fraktionen, Wirtschaft, Luftschiffe, Kybernetik (01.10.2026)

Bereich laut Auftrag: Punkte 2 (Welt, Fraktionen), 4 (Wechselwirkungen), 7 (lebt die Welt?), 8 (Luftschiffe), 9 (Aurelion/Kybernetik), 14 (Bloat).
Nicht wiederholt: alles aus `PLAN_ROADMAP.md` §5g und `SCOUTS_2026-10-01.md`. Wo ein Punkt dort schon steht, wird er hier nur **geschärft** (markiert mit „§5g.N schärfen“).

**Quellen und Prüfung**
- Gelesen: `src/sim.js` (ganz), `src/economy.js` (ganz), `src/body.js` (ganz), `data.js` (`FACTIONS`, `WAR_NODES/EDGES`, `TOWNS`), in `game.js` u. a. `factionAgenda`, `dayTick`, `price/rawPrice/shopStock`, `bandDay/bandTick`, `tributeDay`, `campaignDay/campResolve`, Luftschiff- und Seefahrt-Block (`seaVoyage` … `startVoyage`), `refugeeWave`, `undeadFallDay`, `ensureKarak`, `ensureBlackKeep`, `world.js scatterPOIs`.
- **Im Browser geprüft** (eigener Tab, Stand aus `rotfall.backup.s14c`, `S._quiet`, nichts gespeichert): Weltzustand am Tag 4; dann 12 Tage Krieg und Wirtschaft abstrakt vorgespult (`SIM.warTick` 4× und `RF.dayTick` 1× je Tag). Ergebnisse unten mit „(gemessen)“.
- Was nur aus dem Code gelesen und nicht ausgeführt wurde, steht als „(Code)“.

---

## 1. Ist-Zustand (kurz, belegt)

| System | Was es heute tut | Code |
|---|---|---|
| Karte | 163 Orte (`LOCATIONS`), davon ~90 zufällige POIs (`poi_x_y`: Gehöft, Wachturm, Lager, Banditenlager, Gräber, Tempel, Ruine, Steinkreis, Posten, Wrack, Adelssitz, Werkstatt, Maschinenruine); 21 Stadtpläne (`TOWN_PLAN`), 24 Märkte (gemessen) | `world.js scatterPOIs`, `buildPOI` |
| Krieg | 15 Kriegsknoten, 19 Kanten, **nur zwei Kriegsparteien** (Untote gegen Valen). Heere ziehen alle 6 Std. per BFS; Schlachten abstrakt oder vor Ort (`materialize`); Befreiung in Wellen | `sim.js warTick/resolveNode/battleCheck` |
| Kettenkriege | Feldzüge der Kette gegen Totenland-Ruinen, **außerhalb** des Kriegsgraphen | `game.js campaignDay/campResolve` |
| Mächte-Tagesplan | Jeden Tag handelt reihum *eine* von Valen, Orden, Händler, Kette, Aurelion (`day % 5`): Streife, Aushang, globaler Preisfaktor | `factionAgenda` |
| Wirtschaft | 13 Waren je Ort, Betriebe mit echten Arbeitern (Volkszählung), Warenketten, Preis nach Vorrat, bis 16 abstrakte Händlerzüge, eine sichtbare Karawane Eren–Nordfurt, Spieler-Wagen, Betriebe, Lieferaufträge | `economy.js`, `sim.js caravanFrame` |
| Banden | bis 3 zufällige Banden mit Lager, Unterhändler, Schutzgeld, Wachstum, Zerfall | `bandDay/bandTick/bandKill` |
| Tribut | Tributdörfer der Kette mit eigenem Vorrat `T.vorrat` | `tributeDay` |
| Luftschiffe | 3 Schiffe Aurelions, feste Routen, Zustand Hülle/Motor/Steuerung, Werft mit Material aus Kupferhafens Markt, Passage an Deck (Sturm/Motor/Luftpiraten), Absturz = Großereignis, Handelsschiffe = Nahrungsimport Aurelions | `economy.js airDay/airSupply`, `game.js airVoyage/seaTick/airRepair` |
| Seefahrt | Überfahrt, eigenes Schiff (900 G), Kurse, Prise, Seehandel mit **festen** Hafenpreisen | `seaVoyage`, `shipChoices`, `cargoMenu`, `PORT_PRICE` |
| Kybernetik | Prothesen Stufe 1–4, 4 Module, Roboterauge Stufe 1–4, Verschleiß nur am getroffenen Glied, Magie nutzt das Auge ab, Wartung (Öl, Feinwerkzeug, Kybernetiker), Preise am Magitech-Markt, Rangsperren, Schwarzmarkt | `body.js`, `mechMenu`, `selfRepair` |

**Weltzustand am Tag 4 (gemessen):** Eren und Sonnwacht sind bereits von den Untoten besetzt, beide Untotenheere fehlen (zerschlagen), zwei Valen-Heere stehen bei Moor und Alt-Vharn. 813 von 1 174 lebenden NPCs haben keine Fraktion; Orden 11, Untote 29, Händler 20, Rooks Bande 1, Seevolk 2 (Festland), Kette 134, Aurelion 114.

---

## 2. Fraktionen einzeln

Bewertet nach: Identität · eigene Mechanik/Ressource · Gebiet/Architektur · Verhalten in der Simulation · Beziehungen · Spielerinteraktion. „Stark“ = unterscheidet sich spielerisch, nicht nur durch Farbe.

### 2.1 Königreich Valen (mit Varonsburg)
- **Stark:** Heer im Kriegsgraphen; das Heer **isst Nordfurts Weizen** (`economyDay`) — die beste bestehende Wechselwirkung Fraktion × Wirtschaft. Varon mit Kanzler-Intrige, Verrätersuche, Ritterschlag, Kerker mit Aurelion-Gefangenen. Weidenau-Sensenwehr, Wappenfarbe je Stadt.
- **Leer:** Varons Paranoia gegen Aurelion ist nur Dialog (`facRelation` kennt Aurelion gar nicht). Varonsburg ist kein Kriegsknoten. Steuern (`evTaxman`) senken nur Wohlstand, füllen keine Kriegskasse.
- **Bug (Code):** `warDay` stellt ein neues Valen-Heer **in Nordfurt** auf, auch wenn Nordfurt den Untoten gehört.
- **Hebel:** Aushebung kostet Köpfe und Korn der eigenen Städte (Volkszählung gibt es schon), Grenzstreit mit Aurelion im Luftraum (siehe Luftschiffe).

### 2.2 Der Orden (und die Kirche/Omega-Glaube)
- **Stark:** Paladine, Inquisitor, Hexenprozess mit „Eifer“ (`S.after.zeal`), Ketzerjagd, Kreuzzug, Kirchenbann, Glaubensfiguren.
- **Leer:** Kein Heer. Sonnwacht ist Kriegsknoten mit Garnison 20, fällt aber und **niemand holt es zurück** (gemessen: am Tag 4 schon besetzt). 11 Ordens-NPCs in der ganzen Welt. Der Orden reagiert nicht auf Magitech/Prothesen, obwohl er als dogmatisch gezeichnet ist.
- **Hebel:** „Eifer“ ist schon eine Fraktionsressource — sie sollte Orden-Heer, Inquisition gegen Bionikträger und Magier und Preise für Heiltränke steuern.

### 2.3 Die Untoten (Stille Schar, Vharnholm, Schwarze Feste)
- **Stark:** eigene Städte, Hof, Seelenhandel, Totentempel, Spieler-geführte Überfälle mit Urteil über Bewohner (Erheben/Versklaven/Vertreiben), Wellen-Befreiung.
- **Schwach:** Stärke wächst ohne Ressource: `+2 + Zahl besetzter Knoten` je Tag — **positive Rückkopplung ohne Bremse**. Die Seelenphiolen, die es als Ware gibt, speisen das Heer nicht.
- **Bug (gemessen):** siehe §3.1 — die Untoten nehmen ohne Spieler in 12 Tagen alle 15 Knoten.
- **Bug (Code):** `sim.js` prüft `garmadonSlain` nicht; nach Garmadons Fall wachsen und entstehen Untotenheere weiter, während `undeadFallDay` täglich einen Ort befreit. `warDay` setzt beim Neuaufstellen `graveyard` stillschweigend wieder auf „undead“.
- **Anzeige-Bug (gemessen):** `townState('vharnholm')` meldet „Hunger“, obwohl die Toten nicht essen (Prüfung `stock.grain < 5` vor der Fraktionsprüfung).

### 2.4 Freie Händler
- **Stark:** Kontor, Lieferaufträge, Karawanenschutz, Rang bei Gerold.
- **Leer:** Die Gilde hat keinen Besitz in der Simulation: Händlerzüge sind anonym, ihr Verlust trifft die Gilde nicht (nur die eine sichtbare Karawane: −2). Kein Handelsembargo, kein Kredit, keine Preisabsprachen.
- **Hebel:** Händlerzüge gehören der Gilde (Ruf-Anteil je angekommenem Zug), Gilde senkt Preise nur, wenn Züge durchkommen.

### 2.5 Rooks Bande (und „bandit“ als Sammelfraktion)
- **Befund:** Die Fraktion `bandit` steht für drei verschiedene Dinge: Rooks Bande (1 NPC!), 13 Banditenlager-POIs **und Karak-Atar** (`LOCATIONS.karak_atar.faction = 'bandit'`). Die Zufallsbanden aus `bandDay` haben dagegen keine Fraktion und keinen Ruf.
- **Folge:** Ruf bei Rook = Ruf in der Wüstenstadt; eine zerschlagene Zufallsbande ändert nichts an der Bande.
- **Hebel:** Rook als Hehler-Netz über die Zufallsbanden (Schutzgeld geht zum Teil an Rook, Rang bei Rook = Banden lassen dich durch).

### 2.6 Hochreich Aurelion (Häuser, Rat, Arbeiterrat)
- **Stark:** die tiefste Fraktion: 4 Häuser mit Gunst, Hoher Rat mit Gesetzen, die wirklich wirken (Zölle, Flüchtlinge, Schuldknechtschaft), Schein/Bürgerrecht, Automatenwachen, Fabrik und Streik, Luftschiffe als Nahrungsversorgung, Rangsperren für Bionik und Magitech-Waffen, Nebenstädte mit eigenem Dienst.
- **Leer:** Kein Heer auf dem Kriegsgraphen (Sonnenlegion nur als Gesetzesthema und Strafe). Die Häuser haben keinen Besitz in der Welt (die POI-„Adelssitze“ im Süden gehören niemandem).
- **Hebel:** Häuser besitzen Betriebe (`S.eco.biz.owner = 'haus:vantor'`), Häuserkrieg trifft deren Betriebe.

### 2.7 Die Eiserne Kette
- **Stark:** Eisenfeste mit Tagesplan, Sklavenmarkt, Tribut, Feldzüge, dunkle Klassen, Aufstand mit Folgen für Erz/Barren-Preise, Übernahme nach Vargs Fall.
- **Leer:** Feldzüge gegen die Toten ändern **nichts** an Kriegsgraph oder Wirtschaft (`campResolve` schreibt nur Log und Chronik). Tributdörfer führen einen zweiten, eigenen Vorrat (`T.vorrat`) neben ihrem Markt.
- **Hebel:** Sklavenzahl der Feste = Minenleistung = Stärke der Feldzüge; ein gewonnener Feldzug nimmt einen echten Knoten.

### 2.8 Das Seevolk (Salzbund, Sturmklinge)
- **Stark:** zwei Clans mit Seitenwahl, Weißbart, Kampfgrube, eigenes Schiff, Prise.
- **Leer:** Piraterie kostet pauschal −12 Seevolk — auch wenn man für die Sturmklinge einen Salzbund-Händler entert. Seehandelspreise sind eine feste Tabelle (`PORT_PRICE`), nicht die Märkte von Salzhafen und Kupferhafen. Ränge 2/4 unerreichbar (§5g.14).

### 2.9 Die Grubenstämme (Goblins)
- **Stark:** Morrgrund/Dodon, Befreiung, Grubenhort wächst in Stufen, Titelklasse Grubenhäuptling, Menschen reagieren je Stadt.
- **Leer:** Keine Wirtschaft: Grubenhort ist kein Markt mit Waren, Goblins arbeiten nach der Befreiung nirgends mehr (die versklavten Berufe in `TRADES` verschwinden mit der Feste).
- **Hebel:** Freie Goblins betreiben Pilzfarmen/Schrottwerk in Grubenhort (neue Betriebe mit Output `meat`/`ingot` aus Schrott).

### 2.10 Die Freien vom Grubenhort
- Nur nach dem Sklavenaufstand, keine Ränge, keine Mechanik außer Aufträgen und dem Überfall der Kette. Kandidat zum **Zusammenlegen** mit den Grubenstämmen nach der Befreiung (siehe §9).

### 2.11 Gruppen ohne Fraktion
- **Sandfürsten / Wüstenvolk (Karak-Atar):** echte Kultur (Wasser, Sternenritual, Zoll), aber alle NPCs mit `faction: null`, Ort als `bandit` markiert. Gemessen: Karak-Atar steht am Tag 16 auf „Hunger“ (pop 6) — die Stadt hat keine Nahrungsquelle und keine Importroute.
- **Zwerge von Tiefhall:** nur ein Flag „Freund der Halle“; die Stadt wird beim Betreten neu gebaut und ist kein Markt in `S.towns` — Königseisen ist ein Ladenartikel ohne Erzkette.
- **Blutkult:** geplant (§5g.2).

**Gesamtbefund Fraktionen:** Identität und Inhalte sind stark, aber die **Fraktionen handeln in der Simulation kaum**. Nur Valen und Untote bewegen sich auf der Karte; Beziehungen stehen an drei getrennten, festen Stellen (`facRelation` für 5 Fraktionen als Anzeige, `JOIN_FOES`, `sim.js hostile()` = „einer ist untot“). Keine Fraktion hat eine Ressource, die ihr Handeln begrenzt, außer Valen (Weizen).

---

## 3. Lebt die Welt ohne den Spieler?

| Prüfpunkt | Urteil | Beleg |
|---|---|---|
| Tagesläufe, Bedürfnisse | **ja** | `workCycle`, Hunger/Markt, Schenke, Stadtfest, Eisenfeste-Tagesplan |
| Händler, Reisende, Patrouillen | **ja, aber folgenlos** | Reisende und Streifen laufen, verändern aber keine Zahl in der Welt |
| Karawanen | **teilweise** | 16 abstrakte Züge verschieben echte Waren; Überfall = reiner Würfel (`riskOf`), unabhängig von Banden oder Lagern |
| Banditen, Monster | **teilweise** | Banden wachsen/zerfallen, aber ihr „Ausrauben von Reisenden“ nimmt niemandem etwas |
| Fraktionsbewegungen, Kriege, Grenzen | **kaputt balanciert** | siehe 3.1 |
| Wirtschaft, Knappheit | **ja, für 13 Waren** | aber Ausrüstung, Tränke, Nahrung im Laden hängen nicht daran (§4) |
| Gerüchte, Ereignisse | **ja** | `newsTalk`, Gerüchte mit Zielen, 8 Großereignisse mit Folgen (`S.after`) |
| Politik | **nur Aurelion** | Hoher Rat; sonst `factionAgenda` als Rundlauf ohne Ziele |
| Zerstörung, Wiederaufbau | **ja** | Ruine, Nest, Spuk, Neubesiedlung, Wellen-Befreiung; Wiederaufbau kostet aber kein Material |
| Spielerfolgen | **ja** | Chronik, Ruhm, Rachezüge, Kopfgeld, Epilog |

### 3.1 Messung: Krieg ohne Spieler (gemessen)
Start Tag 4 (Backup): Untote halten 6 Knoten, keine Untotenheere. Vorgespult:

| Tag | Heere | Knoten der Untoten |
|---|---|---|
| 7 | Valen 14 bei Nekropole, Untote 29 bei Ruinen | 9 |
| 10 | **Untote 52** | 14 von 15 |
| 13 | Untote 98, Valen 31 (neu aufgestellt, in bereits gefallener Stadt) | 15 von 15 |
| 16 | **Untote 134** | 15 von 15 |

Ursache (`sim.js warDay`): Untote wachsen täglich um `2 + besetzte Knoten`, Valen nur um 4 und nur bei Weizen > 10 in Nordfurt; Nordfurt fällt, damit wächst Valen nie wieder. Es gibt keinen Verbrauch, keine Obergrenze, keinen Orden, keine Kette, kein Aurelion als Gegengewicht. 12 Spieltage sind rund 5 Stunden Spielzeit. Das Nebenprodukt: Die Wirtschaft von 8 Städten steht still (Besetzt), Sonnwacht und Nordfurt sind „Besetzt“, Karak-Atar, Rastfurt, Eisenried, Hohlstein hungern (gemessen).
Einschränkung: gemessen ohne den Spieler in der Nähe der Front; ist er dort, wird vor Ort gekämpft und `warTick` pausiert.

---

## 4. Wirtschaft

**Gut:** Echte Arbeiter, Warenketten, Hunger, Lagergrenzen, Jahreszeiten, Folgen (Streik/Aufstand/Flüchtlinge als Preisfaktoren), Werft zahlt mit Marktware, Wartungspreise der Prothesen am Magitech-Preis, Valen-Heer isst Korn. Laufzeit: 12 Tage in 0,7 s (gemessen) — Luft für mehr Simulation.

**Befunde:**
1. **Drei Preissysteme nebeneinander.** (a) `ecoPrice` je Stadt für die 13 Waren; (b) für *alle anderen* Gegenstände (Waffen, Rüstung, Brot, Tränke, Bionik) `ITEMS.value × S.prices` — ein **globaler** Zufallsfaktor (±2 % am Tag, `dayTick`, dazu `factionAgenda` und `EVENTS`); (c) feste `PORT_PRICE` im Seehandel. Folge: Fehlen in Nordfurt Waffen (`arms`), kostet ein Langschwert dort trotzdem dasselbe; eine Missernte verteuert nur „Weizen“, nicht Brot.
2. **Ladenbestand ist Zufall** aus einem Pool (`shopStock`), nicht aus dem Stadtlager. Ein Schmied in einer Stadt ohne Barren verkauft weiter Schwerter.
3. **Überfälle sind nicht verortet:** `riskOf(a, b)` kennt Untotenheere an den Endpunkten, Karak und das Zollgesetz — nicht die Banden (`S.bands`), nicht die 13 Banditenlager-POIs, nicht die Kriegsknoten zwischen den Städten.
4. **Zwei Vorräte je Tributdorf:** `T.vorrat` (Tribut) und `S.towns[dorf].stock` (Markt) wissen nichts voneinander.
5. **POIs ohne Wirtschaft:** 11 Gehöfte, 3 Stollen/Werkstätten, Adelssitze sind nur Kulisse mit Gegnern.
6. **Karak-Atar ohne Versorgung** (gemessen Hunger) — die Wüstenstadt mit Wasserhändlerin hat keine Nahrungsroute.
7. **Nicht deterministisch:** `economy.js` benutzt an zwei Stellen `Math.random()` (Verlust beim Überfall auf Züge und auf den eigenen Wagen) statt `rnd()`. Für Koop und Proben unschön.
8. **Wiederaufbau ist gratis** (`rebuildRazed`, `resettleDay`, `growTown` ziehen kein Holz/Stein aus dem Markt).

---

## 5. Luftschiffe (Auftrag Punkt 8)

| Aspekt | Ist | Lücke |
|---|---|---|
| Bewegung, Reise | Flotte fliegt abstrakt zwischen festen Punkten; Position am Himmel sichtbar; Passage an Deck zwischen 5 Städten Aurelions | Nur Aurelion. Keine Passage zur Himmelsinsel (dort Teleportkreis), nicht nach Varonsburg, Karak, Salzhafen |
| Treibstoff | keiner; nur Motorverschleiß | Magitech-Waren/Energiezellen wären der natürliche Treibstoff (Markt existiert) |
| Mannschaft | Kapitän/Maschinist nur als Text | keine NPCs, keine Moral, kein Anheuern |
| Kampf, Entern | Luftpiraten entern an Deck (Seeräuber-Figuren umbenannt) | keine eigenen Luftpiraten-Figuren, kein Lager, kein Ursprung in der Welt |
| Fracht | Handelsschiffe = Nahrungsfaktor für Aurelion (`airSupply`) | keine echte Ware zwischen Städten, der Spieler kann nichts verschiffen |
| Ausbau, Reparatur | Werft mit Marktmaterial, 3 Ausbauten | gut; nur für fremde Schiffe |
| Klassen | Handel, Patrouille | kein Kriegsschiff, kein Kurier, kein Frachter anderer Mächte |
| Fraktionen | nur Aurelion | Valen/Varon (Paranoia!), Kette, Seevolk, Luftpiraten fehlen |
| Begegnungen | Absturz als Großereignis mit Plünderern und Überlebenden | überfliegende Schiffe sind reine Kulisse; kein Abwurf, keine Landung, keine Verfolgung |
| Wetter | Sturmchance an Deck hängt am Wetter bei der Abfahrt | `riskAir` der Flotte ignoriert Wetter und Jahreszeit |
| Luftraum | — | keine Grenzen, keine Zölle, kein Abschuss |
| Handel | — | nur indirekt über Nahrung |
| Erkundung | — | Luftschiff deckt keine Karte auf, keine unerreichbaren Orte |
| Abstürze | Wrack mit Magitech, Überlebende beschleunigen Neubau (gute Kette!) | Wrack verschwindet mit dem Ereignis, bleibt kein Ort |

**Urteil:** Das Fundament ist richtig (Flotte in der Simulation, Folgen für Nahrung, Werft am Markt, Absturz als Ereignis). Es ist heute ein **Dienst Aurelions**, noch kein Weltsystem. Die fehlenden Teile lassen sich fast alle an bestehende Systeme hängen (Markt, Banden, Wetter, Kriegsgraph, Deck-Karte) — siehe Vorschläge V7 und V8.

---

## 6. Aurelion und Kybernetik (Auftrag Punkt 9)

| Aspekt | Ist | Urteil |
|---|---|---|
| Arme, Beine | 4 Stufen, Schrott schlechter als Fleisch, Prototyp +15 %/+10 % | gut: echte Abwägung bei Schrott |
| Augen | Roboterauge 4 Stufen: Sicht, Fernkampf-Krit, Nachtsicht, Wärmesicht; **Magie nutzt es ab** | gut: echte Schwäche |
| Module | Greifhand, Klingenhand (kein Schildblock), Federfuß, Ankerfuß (−5 % Tempo) | gut, aber nur 4 |
| Innere Upgrades | — | fehlt (Lunge, Herz, Wirbelsäule, Blutfilter) |
| Kampf-Upgrades | Klingenhand | kaum |
| Medizin-Upgrades | — | fehlt |
| Nutz-Upgrades | Greifhand (Selbstwartung 90 %) | kaum |
| Einbau | Händler, Medica-Chirurgie an gesunden Gliedern, Rangsperren | Chirurgie ohne Risiko |
| Wartung, Werkzeug | Öl, Feinwerkzeug, Ersatzteile, Magitech, Schmiedekunst-Grenze, Kybernetiker, Vessa | sehr gut |
| Kosten | am Magitech-Markt, Streik verteuert | sehr gut (echte Wechselwirkung) |
| Nachteile | Verschleiß nur am getroffenen Glied; Auge magieempfindlich | Glieder haben keine Schwäche außer Verschleiß |
| **Soziale Folgen** | **keine** (grep: keine Begrüßung, kein Preis, keine Wache reagiert auf Prothesen) | größte Lücke |
| **Fraktionsreaktionen** | **keine** | Orden, Kette, Varon, Untote, Goblins sind gleichgültig |

**Urteil:** Die Technik ist sauber und gut verzahnt mit Markt und Streik. Was fehlt, ist die Frage aus dem Auftrag: „Welche neuen Probleme bringt mir das Messing?“ — sozial (wer misstraut mir), elektrisch (Schock, Regen), wirtschaftlich (Unterhalt), medizinisch (Abstoßung). Vorschläge V9–V11.

---

## 7. Fehlende Wechselwirkungen (je System 3–5 Nachbarn)

| System | fehlt zu … |
|---|---|
| Banden | Händlerzüge (`riskOf`), Stadtlager (Beute), Rooks Rang, POI-Banditenlager, Kopfgeldbrett |
| Kriegsgraph | Kette-Feldzüge, Orden, Aurelion, Varonsburg, Seelenphiolen, Kornlager anderer Städte |
| Luftschiffe | Wetter (Flotte), Markt (Fracht), Varon (Luftraum), Banden (Luftpiraten), Karte (Wrack als Ort) |
| Prothesen | Orden/Glaube, Varon, Wachen, Schockzauber, Regen, Energiezellen |
| Tribut | Stadtmarkt, Kettenstärke, Aufstandsneigung |
| Seehandel | Stadtmärkte, Clanruf getrennt |
| Wiederaufbau | Holz/Stein im Markt, Händlerzüge, Lieferaufträge |
| POIs | Wirtschaft, Kriegsgraph (Späher), Banden, Häuser Aurelions |
| Läden | Stadtlager (Waffen, Werkzeug, Magitech, Korn) |
| `factionAgenda` | Kriegsgraph, Beziehungen, Ressourcen der Fraktion |

---

## 8. Emergenz-Chancen (was aus den Vorschlägen entstehen kann)

1. **Die hungernde Front:** Eine Bande sitzt an der Straße Eren–Nordfurt (V4) → Korn-Züge kommen nicht an → Nordfurt hungert → Valens Heer schrumpft (besteht) → die Toten brechen durch (V1) → Flüchtlinge nach Kreuzweg, dort steigen die Preise (besteht). Der Spieler kann an *jeder* Stelle eingreifen: Bande zerschlagen, Korn selbst liefern, Front halten.
2. **Der Streik und der Prothesenträger:** Streik in Tickmar → Magitech teuer (besteht) → Energiezellen teuer → der Prototyp-Arm läuft auf halber Kraft (V10) → der Spieler muss sich zwischen Arbeiterrat und eigenem Arm entscheiden.
3. **Varons Himmel:** Aurelisches Handelsschiff überfliegt Valen, Varon lässt schießen (V7) → Absturz vor Nordfurt → Wrack mit Magitech, Plünderer, Aurelion verlangt Vergeltung im Rat (besteht: Ratsthemen) → Zölle hoch → Preise in Valen steigen.
4. **Die Kette marschiert wirklich:** Feldzug nimmt einen Knoten (V2) → Sklaven arbeiten dort → Erz billiger → Waffen billiger in allen Läden (V3) → Banden rüsten besser … oder der Spieler befreit das neue Lager.
5. **Messing in Sonnwacht:** Ordenswachen verweigern einem Mann mit drei Prothesen den Einlass (V9) → er geht über den Schwarzmarkt, verliert Ruf, bekommt dafür den Orden als Feind beim Hexenprozess.

---

## 9. Bloat und Zusammenlegen

| Doppelt | Vorschlag |
|---|---|
| `S.prices` (global) **und** `ecoPrice` (je Stadt) | globalen Faktor abschaffen; Nicht-Waren an eine Leitware der Stadt hängen (V3) |
| `PORT_PRICE` (Seehandel) **und** Stadtmärkte | Seehandel über `ecoPrice`, Tangkron als eigener Markt in `S.towns` (V6) |
| `T.vorrat` (Tribut) **und** `S.towns[dorf].stock.grain` | Tribut nimmt aus dem Markt (V14) |
| `S.ship` (Seefahrt) **und** `S.air.fleet[i]` (Luft) | ein Schiffsmodell `{name, kind, hull, motor, helm, cargo, crew, up}` für See und Luft; Deck-Ablauf ist schon gemeinsam (V8) |
| Kriegsgraph (Valen/Untote), Feldzüge der Kette, Überfälle der Toten (`raidDay`, `myRaid`), Fall Aurelions (`S.after`) | ein Graph, mehrere Parteien; Feldzüge und Aurelions Städte werden Knoten (V2) |
| `facRelation` (Anzeige, 5 Fraktionen), `JOIN_FOES`, `hostile()` in sim.js | eine Tabelle `FAC_REL` in data.js (V2) |
| Fraktion `bandit` = Rook + Lager + Karak | Karak eigene Fraktion `sand` (V13); Zufallsbanden unter Rook bündeln (V4) |
| „Die Freien vom Grubenhort“ und Grubenstämme am selben Ort | nach Vargs Fall zusammenführen: Freie werden Bewohner von Grubenhort (Ruf-Übertrag), `frei` bleibt nur, solange die Kette steht |
| `EVENTS`-Kleinmeldung „Karawane überfallen“ (nur `S.prices ×1,05`) neben echten Zugüberfällen | streichen; echte Überfälle erzeugen die Meldung |
| Banditenüberfall auf Tributdörfer (`banditsOnTribute`) neben Banden | über Banden laufen lassen (Bande in der Nähe = Überfall) |

---

## 10. Verbesserungen (Struktur nach Auftrag Punkt 13)

### V1 — Krieg mit Nachschub statt Lawine
- **Problem:** Untote nehmen ohne Spieler in 12 Tagen die ganze Front (gemessen); nach Garmadons Fall wachsen sie weiter (Code); Valen stellt Heere in besetzten Städten auf.
- **Gameplay:** Die Front bewegt sich langsam und sichtbar hin und her; der Spieler entscheidet Schlachten und Versorgung. Späher-Warnungen (gibt es) bekommen Gewicht.
- **Interaktion:** Wirtschaft (Korn aller Valen-Städte, nicht nur Nordfurt), Seelenphiolen/Leichen (Untotenstärke), Garmadon, Schwierigkeit (`DIFF`).
- **Emergenz:** Hunger und Banden entscheiden Kriege (Kette 8.1).
- **Risiko:** Selbsttest-Proben, die auf den Kriegsverlauf schauen; alte Stände mit 134er-Heeren (Deckel beim Laden).
- **Umsetzung:** `sim.js warDay`: Untotenwachstum `min(4, 1 + 0,25 × Knoten) + Leichen der letzten Schlachten / 10`, Deckel je Heer 80 (Schwer 110); `if (S.flags.garmadonSlain)` kein Wachstum und kein Neuaufstellen; Valen-Aushebung nur in einer Stadt mit `owner === 'valen'`, Stärke aus Köpfen (`ECO.census().soldier`) und Korn der Valen-Städte; Orden bekommt ein Heer bei Sonnwacht (Eifer ≥ 1). Neues Feld `S.war.corpses` aus `battleAbstract`. `continueGame`: Heere > Deckel kappen. Debug „Krieg: 10 Tage vorspulen (abstrakt)“. Probe: 30 Tage ohne Spieler, keine Seite hält mehr als 12 von 15 Knoten; nach `garmadonSlain` wächst kein Untotenheer.
- **Priorität:** Critical · **Umfang:** Small

### V2 — Ein Kriegsgraph für alle Mächte
- **Problem:** Nur Valen und Untote führen Krieg; Kette-Feldzüge, Aurelions Städtefall, Varon und Orden laufen neben dem Graphen oder gar nicht; Beziehungen stehen an drei Stellen.
- **Gameplay:** Die Kriegskarte zeigt alle Fronten; der Spieler sieht, wem ein Ort gehört, und kann Seiten stärken (§5g.32 Diplomatie hängt direkt daran).
- **Interaktion:** Diplomatie (§5g.32), Luftraum (V7), Wirtschaft (besetzt = Markt steht), Bionik-Zugang (Aurelion-Städte fallen → keine Prothesen).
- **Emergenz:** Kette und Untote zermürben sich gegenseitig; Valen gewinnt Zeit — oder nicht.
- **Risiko:** Mittel: viele Stellen lesen `owner === 'undead'`; Migration alter Stände.
- **Umsetzung:** `data.js`: `WAR_NODES` + `kettenfeste`, `grauwasser`, `varonheim`, `aurelheim`, `tickmar`, `totenruinen`, `graeberfeld` …; `FAC_REL` (Matrix −100…100 für alle Fraktionen) ersetzt `facRelation`, `JOIN_FOES`-Prüfung liest sie, `sim.js hostile(a,b) = FAC_REL[a][b] <= -50`. `resolveNode` für beliebige Paare. `campResolve` schreibt Sieg als `capture(target, 'chain')`, Feldzug = Heer auf dem Graphen. `S.after`-Städtefall nutzt `capture`. Migration in `continueGame`: fehlende Knoten aus `WAR_NODES` ergänzen. Probe: jede Fraktion mit Heer bewegt sich in 10 Tagen; `facRelation` und `hostile` liefern dieselben Vorzeichen.
- **Priorität:** High · **Umfang:** Large

### V3 — Läden hängen am Stadtlager
- **Problem:** Waffen, Rüstung, Werkzeug, Brot, Tränke, Bionik kosten überall gleich (globales `S.prices`), Ladenbestand ist Zufall.
- **Gameplay:** Handeln lohnt: in Tickmar Werkzeug billig, an der Front Waffen teuer und knapp. Hunger sieht man am Brotpreis. Der Spieler hat Gründe zu reisen und zu liefern.
- **Interaktion:** Wirtschaft, Krieg (Front verbraucht `arms`), Streik (Magitech), Handwerk (Material), eigener Wagen.
- **Emergenz:** Ein Überfall auf einen Barren-Zug macht eine Woche später Schwerter in Nordfurt teuer.
- **Risiko:** Balance (BALANCE_GUIDE); Läden dürfen nicht leerlaufen.
- **Umsetzung:** `data.js ITEMS`: Feld `base` (`longsword: 'arms'`, `pickaxe: 'tools'`, `bread: 'grain'`, `aurelarm: 'magitech'`, Tränke `herb`-frei lassen). `rawPrice`: `v = value × clamp(ecoPrice(town, base)/ITEMS[base].value, 0.7, 1.8)` statt `S.prices`. `shopStock`: Anzahl Waffen = `min(7, floor(stock.arms / 2))`; Kauf zieht 0,5 `base` aus dem Lager. `S.prices` bleibt nur als Lesefallback, `dayTick`/`factionAgenda`/`EVENTS` schreiben ihn nicht mehr (Aurelions Zölle → `S.after.tmul` der Aurelion-Städte). Tooltip im Laden: „teuer: Waffen knapp in Nordfurt“. Probe: `stock.arms` 0 → Schwert teurer als bei vollem Lager; Kaufen und sofort Verkaufen bleibt ohne Gewinn (besteht als Regel in `price`).
- **Priorität:** High · **Umfang:** Medium

### V4 — Straßen haben Herren: Banden, Lager und Züge verbunden
- **Problem:** Banden „rauben Reisende aus“, ohne dass jemandem etwas fehlt; Zugüberfälle sind reine Würfel; 13 Banditenlager-POIs haben keinen Bezug zu den Banden.
- **Gameplay:** Der Kontor zeigt pro Strecke eine Gefahr mit Grund („Die Galgenbrüder bei Eisenried“). Schutzgeld zahlen, die Bande zerschlagen oder die Route meiden sind echte Entscheidungen, auch für den eigenen Wagen (§5g.29 schärfen).
- **Interaktion:** Wirtschaft, Kopfgeld (§5g.24), Rooks Bande (Rang), Gerüchte.
- **Emergenz:** Eine unbehelligte Bande wächst von der Beute, eine gut bewachte Route lässt sie verhungern und zerfallen.
- **Risiko:** gering; nur Zahlen.
- **Umsetzung:** `economy.js riskOf(a,b,guards)`: + `0,08 × Männer/9` je aktiver Bande mit Lager < 30 Kacheln von der Strecke (Punkt-Strecke-Abstand über `LOC`), + 0,05 je feindlichem Kriegsknoten auf dem Weg. Beim Überfall: Beute als `b.loot` → ab 20 Ladungen `men +1`; `bandFound` setzt neue Banden bevorzugt in ein Banditenlager-POI. Rook-Rang ≥ 1: Banden verlangen halbes Schutzgeld, 10 % des Schutzgelds geht an Rook (Ruf). `Math.random` in `caravanDay`/`myCaravanDay` durch `rnd()` ersetzen. Kontor-Zeile je Strecke. Probe: Bande neben Route → `riskOf` steigt; Bande weg → sinkt.
- **Priorität:** High · **Umfang:** Medium

### V5 — POIs werden Weltknoten
- **Problem:** ~90 zufällige Orte sind Kulisse mit Gegnern.
- **Gameplay:** Ein befreites Gehöft liefert Korn an die nächste Stadt, ein Wachturm mit Besatzung meldet Heere früher, ein Stollen fördert Erz, ein Adelssitz gehört einem Haus Aurelions.
- **Interaktion:** Wirtschaft, Krieg (Späher), Banden, Aurelion-Häuser, Siedlung (§5g.19: Außenposten).
- **Emergenz:** Wer die Gehöfte vor Nordfurt schützt, verlängert die Front.
- **Risiko:** Weltgenerierung darf keine neuen `rnd()`-Aufrufe bekommen — der Zustand lebt nur in `S.poi`, die Generierung bleibt unverändert.
- **Umsetzung:** `S.poi[key] = { state: 'wild'|'held'|'ruin', owner, out }`, angelegt beim Laden aus `LOCATIONS.filter(l => l.poi)`. `ecoDay`: gehaltene Gehöfte +2 `grain` an `nearestTown`, Stollen +1,5 `ore`. „Gehalten“ = keine Feinde im Umkreis beim letzten Besuch + Spieler hat ihn gesäubert (Hook in `onKill`/Gegnerzählung). Wachturm gehalten → `warTick`-Warnung einen Zug früher. Karte: Symbol je Zustand. Probe: gehaltenes Gehöft erhöht Kornvorrat der Nachbarstadt.
- **Priorität:** Medium · **Umfang:** Medium

### V6 — Seehandel an die Märkte, Piraterie nach Clan
- **Problem:** `PORT_PRICE` ist fest; Piraterie kostet pauschal −12.
- **Gameplay:** Salzhafen–Kupferhafen wird zur echten Handelsroute mit schwankenden Gewinnen; Freibeuterei für die Sturmklinge ist ein Weg zum Rang.
- **Interaktion:** Wirtschaft, Seevolk-Ränge (§5g.14), Luftschiff-Nahrung (Kupferhafen).
- **Emergenz:** Wer Korn nach Kupferhafen segelt, wenn die Luftflotte am Boden liegt, macht Gewinn und rettet Aurelion vor Hunger.
- **Risiko:** gering.
- **Umsetzung:** `cargoMenu`: Preise über `ECO.ecoPrice(port, good, buy)`, Kauf/Verkauf ändert `S.towns[port].stock`; Tangkron als `S.towns.isle` (kleiner Markt, Produktion Salz/Fleisch). `ownArrive`: gekaperter Salzbund → `S.flags.seaClan === 'raider'` ? Sturmklinge-Gunst +6 : Seevolk −12. Probe: Verkauf von 20 Salz senkt den Salzpreis in Kupferhafen.
- **Priorität:** Medium · **Umfang:** Small

### V7 — Luftschiffe in der Welt: Wetter, Fracht, Luftraum, Wracks
- **Problem:** Die Flotte ist Kulisse mit einem Versorgungswert; Wetter, Politik und Karte wirken nicht.
- **Gameplay:** Man sieht ein Schiff, das über Valen fliegt, und hört Varons Ballisten; man findet Wracks als Orte, Frachtkisten nach Notabwurf, Luftpiraten mit einem Ankerplatz, den man ausheben kann.
- **Interaktion:** Wetter (Sturmrisiko der Flotte), Kriegsgraph/`FAC_REL` (Luftraum), Markt (echte Fracht zwischen Aurelion-Städten), Banden (Luftpiraten als Bandenart), Varon (Paranoia), Hoher Rat (Vergeltung als Thema).
- **Emergenz:** Beispiel 8.3.
- **Risiko:** mittel; Balance der Nahrung Aurelions.
- **Umsetzung:** `economy.js riskAir(s)` + Wetterfaktor aus `WX` an der Schiffsposition (Sturm/Schnee +0,1) und Jahreszeit; Patrouille/Handel tragen `cargo` wie abstrakte Händlerzüge (`caravanDay`-Logik wiederverwenden, Ziel = Aurelion-Stadt mit Mangel). Luftraum: `airPos` in Valen-Gebiet (`regionAt`) und `FAC_REL.valen.aurel < -30` → Risiko +0,15 (Beschuss), Chronik „Varons Ballisten“. Wrack nach Absturz bleibt als `S.wrecks[]` mit Bergungsgut (einmal plündern, Kupferhafen-Aushang „Bergung“). Luftpiraten: `bandFound(kind: 'air')` an einer Maschinenruine/Turm-POI; solange sie leben, Piraten-Ereignis an Deck ×2 und Flottenrisiko +0,05. Debug je Teil. Proben: Sturmwetter erhöht `riskAir`; Wrack bleibt nach `bigEnd` als Ort.
- **Priorität:** High · **Umfang:** Large

### V8 — Eigenes Luftschiff mit Mannschaft und Treibstoff (§5 Ausblick/§5g.10 schärfen)
- **Problem:** `S.air.my` ist angelegt, aber leer; das Seeschiff ist ein zweites, getrenntes Modell.
- **Gameplay:** Mit Aurelion-Rang (Prüfung, §5g.10) ein kleines Luftschiff: an jedem Mast und auf offenem Feld landen, Fracht fliegen, Gefährten und Söldner als Mannschaft (Moral, Lohn), Treibstoff aus Energiezellen/Magitech kaufen.
- **Interaktion:** Markt (Treibstoff = Magitech-Preis → Streik!), Gruppe/Söldner (Mannschaft, Loyalität), Luftraum (V7), Erkundung (Karte aufdecken im Überflug), Deck-Karte (Kampf, Entern).
- **Emergenz:** Wer im Streik zu den Arbeitern hält, zahlt mehr für jeden Flug.
- **Risiko:** hoch (Reisen ohne Schnellreise ist Designregel): Flug kostet Spielzeit, Treibstoff und birgt Ereignisse; Landen nur an Masten oder freiem Feld nahe Zielort.
- **Umsetzung:** gemeinsames Schiffsmodell in `economy.js` (`newShip` für Luft, `S.ship` beim Laden migrieren zu `{..., kind: 'see'}`); `S.air.my = newShip(name, 'eigen')` + `fuel` (0–100, 1 Energiezelle = 20). `startVoyage({ air: true, own: true })` nutzt `seaTick`; `ownSeaEvent` bekommt Luftereignisse. Mannschaft `crew: [ids]` aus Gruppe/Söldnern: < 2 Mann → Motorschaden-Chance ×2. Probe: Flug ohne Treibstoff abgelehnt; Streik erhöht Flugkosten.
- **Priorität:** Medium · **Umfang:** Large

### V9 — Messing hat einen sozialen Preis
- **Problem:** Keine Figur, Wache oder Fraktion reagiert auf Prothesen oder Roboterauge.
- **Gameplay:** Messing öffnet Türen in Aurelion und schließt sie anderswo: Rabatt und Respekt im Hochreich, Misstrauen in Sonnwacht und bei Varon, Neugier bei Goblins, Hass bei den Kettenpriestern (Omega kennt keine Maschinen). Der Spieler entscheidet bewusst, ob und wie viel Messing er trägt (Umhang verbirgt Arme, nicht das Auge).
- **Interaktion:** Ruf/Preise (`repPrice`), Begrüßung (`contextGreet`), Varon-Audienz (Spionverdacht), Orden-Eifer (Inquisition), Hexenprozess, Wachen (`aurelWatch` umgekehrt: Aurelion-Wachen lassen Messingträger schneller passieren).
- **Emergenz:** Beispiel 8.5.
- **Risiko:** Nutzer könnte Bionik als reinen Vorteil sehen wollen — deshalb Vorteile in Aurelion gleichwertig machen.
- **Umsetzung:** `body.js brassOf(c)` = Zahl der `mech`-Glieder + Auge (Auge sichtbar, Glieder nur ohne Umhang/Handschuh sichtbar). Tabelle `BRASS_REACT` in data.js je Fraktion: `{ price: ±%, greet: [...], deny: ab n }`. `repPrice` multipliziert; `contextGreet` fügt Zeile ein; `varonAudience`: `brassOf ≥ 2` wie Aurelion-Ruf ≥ 25 (Spion). Eifer ≥ 2 → Inquisitor befragt Messingträger (bestehender `inquisitorCheck`). In-Game-Hinweis beim ersten Einbau, Eintrag in `MECHANIKEN.md`, Debug „Messinggrad setzen“. Probe: gleicher Artikel in Sonnwacht mit 3 Prothesen teurer als ohne.
- **Priorität:** High · **Umfang:** Medium

### V10 — Prothesen haben Schwächen: Schock, Nässe, Unterhalt
- **Problem:** Glieder haben außer Verschleiß keine Schwäche; nur das Auge ist magieempfindlich.
- **Gameplay:** Gegen Blitzmagier, Schockautomaten und im Regen muss der Messingkrieger anders kämpfen; Prototypen kosten Unterhalt.
- **Interaktion:** Magie (Schock), Wetter (Regen, C.12 besteht), Wirtschaft (Energiezelle), Streik.
- **Emergenz:** Beispiel 8.2; Schockpistole wird gegen Messing-Elite plötzlich wertvoll.
- **Risiko:** gering, Zahlen klein halten.
- **Umsetzung:** In `hurt` bei `kind === 'shock'`: getroffenes `mech`-Glied 1 s gelähmt (Status „Kurzschluss“) und Verschleiß ×2; Regen: `wearProsthesis` ×1,3 draußen (`WX`). Stufe 4: täglich 1 Energiezelle aus dem Gepäck (`dayTick`), sonst halbe Wirkung bis zur nächsten Zelle; Tooltip und Log. Probe: Schocktreffer auf Prothese setzt Status und doppelten Verschleiß.
- **Priorität:** Medium · **Umfang:** Small

### V11 — Innere Implantate mit Operationsrisiko
- **Problem:** Keine inneren, medizinischen oder Nutz-Upgrades; Chirurgie ist risikolos.
- **Gameplay:** Bei der Medica: Blutfilter (Gift und Fleckfieber halb, aber Heiltränke −25 %), Lungenbalg (Ausdauer-Erholung +20 %, Hitze/Sandsturm-Malus halb; bei Schock Atemnot), Rückgratstrebe (schwere Rüstung ohne Tempo-Malus, Ausweichrolle kostet +30 % Ausdauer). Jede Operation hat ein Risiko (Entzündung aus §5e.7), abhängig von Preis und Ort (Sankt Serin sicherer, Schwarzmarkt riskant).
- **Interaktion:** Verletzungen/Entzündung, Seuche (§5c), Wetter (Hitze), Rüstung, Blutkult (Vampir-Blutdurst verträgt keinen Blutfilter — §5g.2 schärfen).
- **Emergenz:** Wer billig beim Schwarzmarkt operiert, liegt mit Fieber in der Seuchenstadt.
- **Risiko:** Umfang wächst; auf 3 Implantate begrenzen. Kein Selbst-Aufstehen (Nutzerregel „Downed“) — deshalb kein „Herzstarter“.
- **Umsetzung:** Feld `c.implant = { key, cond }` wie `c.eye` (nicht in `PARTS`), Tabelle `IMPLANT` in body.js, Wirkung in `recalc`/`staminaRegen`/Giftticks. `medicaChoices` erweitert; Risiko `infect = 0,25 − Medizin/400 (Schwarzmarkt +0,25)`. X-Fenster-Zeile, Debug, Probe.
- **Priorität:** Medium · **Umfang:** Medium

### V12 — Jede Fraktion hat eine Ressource, die ihr Handeln begrenzt
- **Problem:** Fraktionen unterscheiden sich in Inhalten, aber in der Simulation fast nur durch Farbe; nur Valen hat eine Grenze (Korn).
- **Gameplay:** Der Spieler kann Mächte über ihre Ressource schwächen oder stärken — ohne Schlacht.
- **Interaktion / Ressource:** Valen: Korn + Köpfe (V1). Orden: Eifer (`S.after.zeal`, besteht) → Heer, Inquisition. Untote: Leichen/Seelen (`S.war.corpses`, Seelenphiolen, die man bei Sael/Ossara abgibt oder zerschlägt). Händler: angekommene Züge. Kette: Arbeitskraft (Gefangene in `S.fort`, Sklavenmarkt) → Erz und Feldzuggröße. Aurelion: Nahrung aus der Luft + Magitech. Seevolk: Salz und Prisen. Goblins: Grubenhort-Fortschritt. 
- **Emergenz:** Pferche öffnen (`q_pferch`, besteht) senkt künftig die Feldzuggröße der Kette.
- **Risiko:** Zahlen müssen sichtbar sein (Kodex „Fraktionen“, P5 offen), sonst unsichtbare Simulation.
- **Umsetzung:** `S.facRes = { valen: {...}, … }` in `sim.js`, täglich in `warDay` aus bestehenden Zahlen berechnet (keine neuen Spielerquellen nötig); `planCampaign` nimmt `size` aus Arbeitskraft; `factionAgenda` liest Ressource. Kodex-Reiter „Mächte“ mit einer Zeile je Fraktion. Probe: weniger Gefangene → kleinerer Feldzug.
- **Priorität:** High · **Umfang:** Medium

### V13 — Sandfürsten und Zwerge als echte Fraktionen, Karak versorgen
- **Problem:** Karak-Atar zählt als `bandit`; Zwerge nur als Flag; Karak hungert (gemessen).
- **Gameplay:** Ruf bei den Sandfürsten regelt Zoll, Basarpreise und Schmuggel; Ruf bei den Zwergen öffnet Runen/Sockel (§5g.28) und Königseisen-Mengen.
- **Interaktion:** Wirtschaft (Karak als Handelsknoten mit Wasser und Importen, Tiefhall als Erz-/Barrenmarkt), Rooks Bande entkoppelt, Karrak-Tod.
- **Emergenz:** Bleibt die Wüstenroute unsicher, verhungert Karak und die Sandreiter werden selbst zu Banden.
- **Risiko:** Migration: vorhandener Ruf `bandit` nicht übertragen (war Rook).
- **Umsetzung:** `FACTIONS.sand`, `FACTIONS.dwarf`; `LOCATIONS.karak_atar.faction = 'sand'` (Datenänderung ohne RNG); Karak-NPCs `faction: 'sand'`; `S.flags.karakRefused` → Ruf −10; Tiefhall als `S.towns.deephall` (Erz, Barren) ohne Kartenpräsenz; Karak bekommt Importlogik wie Aurelion (`use.grain × 0,6 × Sicherheit der Wüstenroute`). Probe: Karak hungert nicht bei sicherer Route.
- **Priorität:** Medium · **Umfang:** Small

### V14 — Tribut aus dem Markt (Merge)
- **Problem:** `T.vorrat` und der Dorfmarkt sind zwei Vorräte.
- **Gameplay:** Harter Tribut macht Brot im Dorf teuer; der Spieler sieht die Ausbeutung im Kontor; Korn an ein Tributdorf liefern lindert wirklich.
- **Interaktion:** Wirtschaft, Kette-Stärke (Tribut füllt `kettenfeste`-Lager), Aufstand (§5c).
- **Emergenz:** Hunger in Tributdörfern steigert die Aufstandschance.
- **Risiko:** gering; Migration `T.vorrat` → `stock.grain`.
- **Umsetzung:** `tributeDay`: `take` aus `S.towns[V].stock.grain/meat`, Ankunft in `arriveTribute` legt es in `S.towns.kettenfeste.stock`. `T.vorrat` beim Laden in den Markt übertragen und nicht mehr schreiben; `banditsOnTribute` über nahe Banden (V4). Probe: Tribut senkt Dorf-Kornvorrat und erhöht den der Feste.
- **Priorität:** Medium · **Umfang:** Small

### V15 — Mächte handeln nach Lage statt nach Kalender
- **Problem:** `factionAgenda` wählt per `day % 5`; Untote, Seevolk, Goblins, Varon, Freie handeln nie; Folgen sind meist nur Text und ein globaler Preisfaktor.
- **Gameplay:** Man erlebt Entscheidungen: Valen hebt aus, wenn die Front bricht; Aurelion verhängt ein Embargo gegen Valen nach einem Abschuss (V7); der Orden ruft einen Kreuzzug, wenn der Eifer hoch ist.
- **Interaktion:** V1/V2/V12, Diplomatie (§5g.32), Aushänge, Züge (Embargo sperrt Routen zwischen verfeindeten Städten in `caravanDay`).
- **Emergenz:** Embargo → Waren fehlen → Schmuggelaufträge (bestehende Vertragsart).
- **Risiko:** gering.
- **Umsetzung:** `factionAgenda` bewertet je Fraktion 3–5 Aktionen mit Punktzahl aus `S.facRes` und `FAC_REL` und führt die beste der dringendsten Fraktion aus (höchstens 2 am Tag). Neue Aktion „Embargo“ (`S.embargo[a+b] = bis Tag`), `tradeTowns`-Filter in `caravanDay`. Chronik wie bisher. Probe: Front bricht → Valen hebt aus (nicht Rundlauf).
- **Priorität:** Medium · **Umfang:** Medium

### V16 — Wiederaufbau kostet Material
- **Problem:** Ruinen, Neubesiedlung, Stadtwachstum entstehen aus dem Nichts.
- **Gameplay:** Der Spieler kann Wiederaufbau durch Lieferungen beschleunigen (bestehende Lieferaufträge); Händlerzüge bringen Holz und Stein sichtbar in befreite Orte.
- **Interaktion:** Wirtschaft, Lieferaufträge, Krieg, Siedlung als Stadt (§5g.19).
- **Emergenz:** Nach einem Krieg sind Holz und Stein im ganzen Land teuer.
- **Risiko:** Wiederaufbau darf nicht dauerhaft hängen bleiben — Mindesttempo, wenn gar nichts kommt.
- **Umsetzung:** `growTown`/`resettleDay`/`rebuildRazed`: Bedarf `{timber: 10, stoneware: 6}` je Stufe aus dem Ortslager; fehlt es, erzeugt `ordersDay` bevorzugt Lieferaufträge dorthin (Lohn ×1,6 besteht). Ohne Lieferung nach doppelter Frist trotzdem (halbe Stufe). Probe: Stufe braucht Material, Lieferung beschleunigt.
- **Priorität:** Low · **Umfang:** Small

### V17 — Kleine Korrekturen aus dem Audit (Bündel)
- **Problem / Umsetzung:** (a) `townState`: Untotenstädte nie „Hunger“ (`sim.js`, Fraktionsprüfung vor Kornprüfung). (b) `economy.js`: `Math.random()` → `rnd()` (2 Stellen). (c) `warDay`: Valen nur in eigener Stadt aufstellen; `graveyard` nicht stillschweigend umfärben. (d) `EVENTS`: Kleinmeldung „Karawane überfallen“ streichen (V3 macht `S.prices` überflüssig). (e) `JOIN_FOES` um `sea`/`aurel`/`goblin` prüfen (Beitritt zur Kette mit Grubenbruder-Rang).
- **Priorität:** High · **Umfang:** Small

---

## 11. Priorisierung

Bewertet nach Gameplay-Wirkung × Wechselwirkungen × Spielerwert ÷ Aufwand.

**NOW**
- V1 Krieg mit Nachschub (Critical, klein, behebt eine gemessene Lawine)
- V17 Kleine Korrekturen
- V3 Läden am Stadtlager (macht die ganze Wirtschaft spürbar)
- V4 Banden, Lager und Züge verbinden (verbindet drei fertige Systeme)
- V9 Sozialer Preis der Bionik

**NEXT**
- V12 Fraktionsressourcen (Grundlage für V15 und Diplomatie §5g.32)
- V7 Luftschiffe in der Welt
- V6 Seehandel am Markt
- V14 Tribut aus dem Markt
- V10 Prothesen-Schwächen
- V13 Sandfürsten und Zwerge

**LATER**
- V2 Ein Kriegsgraph für alle Mächte (groß; nach V1/V12)
- V15 Mächte handeln nach Lage
- V5 POIs als Weltknoten
- V8 Eigenes Luftschiff (nach §5g.10 Rang-Prüfungen)
- V11 Innere Implantate
- V16 Wiederaufbau mit Material

**EXPERIMENTAL**
- Luftpiraten als eigene Bande mit Ankerplatz (Teil von V7) und Luftraum-Beschuss durch Varon — spannend, aber erst nach V2 (`FAC_REL`) sauber.
- Tiefhall als unterirdischer Markt ohne Kartenpräsenz (Teil von V13).

**CUT / MERGE**
- `S.prices` (globaler Zufallspreis) → in V3 auflösen.
- `PORT_PRICE` → Stadtmärkte (V6).
- `T.vorrat` → Dorfmarkt (V14).
- `facRelation` + `JOIN_FOES` + `hostile()` → `FAC_REL` (V2).
- `S.ship` + Luftschiff → ein Schiffsmodell (V8).
- Kette-Feldzüge + Kriegsgraph → ein Graph (V2).
- „Die Freien vom Grubenhort“ nach Vargs Fall in die Grubenstämme überführen.
- `EVENTS`-Meldung „Karawane überfallen“ streichen; `banditsOnTribute` über Banden (V4).

**Testhinweis für alle Punkte:** jede Änderung mit Probe in `selftest()` (Muster `sandbox()`), Debug-Eintrag, In-Game-Hinweis und Eintrag in `docs/MECHANIKEN.md`; Speicherfelder optional (alte Stände), Migration in `continueGame()`; keine neuen `rnd()`-Aufrufe in `world.js`.
