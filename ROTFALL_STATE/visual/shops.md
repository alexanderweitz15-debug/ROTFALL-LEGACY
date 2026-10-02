# Visueller Umbau — Priorität 7: SHOPS

Analyst C · 02.10.2026 · Status: **ANALYSE, kein Code** (VISUAL.md §5, GATE.md §1–§8)
Kennzeichnung: **FAKT**, **VORSCHLAG**, **ANNAHME**. Preisregeln (T09, `rawPrice`, `repPrice`) werden **nicht** verändert; hier geht es um Darstellung. Gemeinsame Bausteine: `items.md` (Karte, Vergleich), `inventar.md` (Ziehen, Marken). Rahmen: ui_redesign §5 „Handel: Dock mit zwei Rastern, Kategoriechips, Mengen-Schieber, Preis mit Pfeil gegen `S.priceSeen`“ (vom Entwickler als Dock ab Scheibe 3 freigegeben, DECISIONS 01.10.).

---

## 0. Bestand (FAKT)

**Zugang**
- Gespräch: `talk(npc)` → „Zeig mir deine Waren.“ mit Sperren (geschlossen `shopClosed`/`provoked`, Ladenzeit `till` + `hourNow`, Vharnholm `deadWelcome`, Verhasst `repTier`, besetzt `S.war.nodes[..].owner==='undead'`, `refusesChain`) — jede Sperre mit eigener Sprechzeile im Dialog.
- Direkt: `tradeAt(t)` (Stand/Theke, `R.stallShut`) → `openShop(m)` → `UI.openModal('trade', m)`. Kontor: `ecoMenu` „Waren kaufen und verkaufen“ (`npc.goodsOnly = true`).
- Sonderhändler als **Gesprächslisten**: `blackMarket(npc)` (`BLACK_POOL`, `BLACK_RARE` 25 %, +50 %, 40 % gebraucht `used:60`), `craftMenu`, `mechMenu`, `stableUI` (eigenes Fenster), Koop-Gast `coop.js` (~Z. 495–502, Dialog mit Beutel).

**Ware**
- `shopStock(npc)`: Tagesbestand `_stockDay`; Pool aus `npc.pool` / `NPCS.pool` / `SMITH_POOL` / `STALL_POOL` / `MARKET_POOL[prof]` / `TAVERN_POOL` / Kettenhändler (`MARKET_POOL` Erweiterung ~Z. 5487); T09: Auswahl nach Stadtlager (`w(k)`, `armsCap`), Mindestbestand 2 billigste; `fixedStock` (RB-019); Bionik nach Rang (`bionicTier`, `bionicLack`); Händler mit `sellsGoods` hängen Stadtwaren `GOODS` aus `S.towns[tk].stock` an.
- Ladenware ist **Grundware** (Kommentar `data.js`: „Läden verkaufen Grundware“); `buy` → `addItem` → `mkItem(key)` **ohne** Raritätswurf, aber **mit** Zufallszustand `cond 0.55–1.0`.

**Preis**
- `price(key,isBuy,npc,inst)` / `rawPrice`: Warenpreis über `SIM.townPrice` (Waren) bzw. `ITEMS.value × baseMul(Stadt, Leitware)` (T09, 0,7–1,8) × `RARITY_VALUE` (nur mit `inst`) × `afterItemMul`; Handel-Fertigkeit; `repPrice` (Ruf-Stufe, Angst `fearLvl`, Rang, Legende, Stigma, Omega, Ruhm ≥ 60, Corvinus-Route). Verkauf nie ≥ Kauf − 1.
- `priceNote(key,npc)`: „Teuer: … knapp in Stadt (×1,32)“ / „Günstig …“ ab ×1,25 bzw. ≤ ×0,85.
- `S.priceSeen` (`SIM.notePrices`) — zuletzt gesehene Warenpreise je Stadt; `tradeUI` zeigt **eine** Textzeile „Zuletzt in X (Tag n): Korn 12 · …“.

**Fenster `ui.js tradeUI(body, npc)`**
- Drei Spalten: „{Name} bietet“ (Zeilenliste `.eq-slot` mit 34-px-Icon, Name, „×n“, Preis), „Du bietest (Gold: n)“ (ganze Tasche), „Info“ (`itemInfoHTML` + Preis + `priceNote` farbig + „Klick: kaufen“) **nur bei `onmouseenter`**.
- Klick kauft/verkauft **sofort ein Stück**, dann `refreshModal(npc)` (ganzes Fenster neu). Keine Kategorien, keine Menge, keine Bestätigung, keine Rarität in den Zeilen.
- `buy`: „Zu wenig Gold“ als Toast; Erfolg nur Protokoll „Gekauft: X für n Gold.“ (`economy`), Handel +0,3. `sell`: `bound` → Toast; Erfolg Protokoll.

**Händler in der Welt**
- `updateNpc`-Zweig: Händler macht Pose `act(e,'trade',1100,p)`, wenn der Spieler < 90 px kommt (alle 2,6 s) — „zeigt die Ware“.
- `render.js`: `stall`, `market_stall` (4 Varianten: Obst, Tuch, Töpfe, Fisch), `stallShut` zeigt Plane bei geschlossenem Markt.
- `bubble(e,text,ms)` für Sprechblasen vorhanden; beim Kauf/Verkauf **nicht** genutzt.
- Gold-HUD: `refreshHUD` (Gold in der Kopfleiste, Piktogramm `res_gold`); **keine** Geldanimation, **kein** Münzklang (`sfx.js` hat keinen).

**Beobachtungen (FAKT, an Engineer)**
1. **Angezeigter Verkaufspreis ≠ gezahlter Preis bei seltenen Teilen:** `tradeUI` ruft `A.price(slot.key, isBuy, npc)` **ohne** Exemplar, `sell` rechnet `price(slot.key,false,npc,slot)` **mit** `RARITY_VALUE`. Ein episches Teil zeigt den gewöhnlichen Preis und bringt das Dreifache.
2. Gekaufte Ausrüstung kommt mit 55–100 % Zustand (`mkItem` würfelt `cond`). Ob „neu vom Händler“ 100 % sein soll, ist offen (S-5).
3. `ecoMenu` setzt `npc.goodsOnly = true` dauerhaft (nie zurückgesetzt).
4. Kein Touch-Pfad für die Info-Spalte (`onmouseenter`).

---

## 1. Händlerdialog (Einstieg und Rahmen)

**Problem:** Handel beginnt mit einer Textzeile im Gespräch; das Fenster ist ein neutrales Vollbild-Modal ohne Händler-Gesicht. Sperren (geschlossen, verhasst, Kette) kommen als Dialogsatz — gut, aber ohne Bild.
**Inspiration:** Darkest Dungeon (Händler-Porträt groß neben der Ware), Stardew (Händler hinter Theke, Satz oben), Hades (Charon mit Gesten), WoW (Händlerfenster mit Porträt), Kenshi (nüchterne Tauschfenster, Welt läuft weiter).

| # | Variante | Idee |
|---|---|---|
| 1 | Porträt-Kopf | Fensterkopf mit `drawPortraitTo` des Händlers, Name, Beruf, Laden-Symbol. |
| 2 | Theken-Szene | Fenster zeigt gezeichnete Theke, Händler dahinter, Ware darauf. |
| 3 | Dock rechts | Handel als angedocktes Seitenfenster, Welt sichtbar (ui_redesign C, freigegeben ab Scheibe 3). |
| 4 | Gruß-Blase | Beim Öffnen sagt der Händler eine Zeile als Blase (`bubble`) statt Text im Fenster. |
| 5 | Stimmungs-Marke | Ruf-/Angst-Stufe als Gesichtsausdruck oder Symbol am Porträt. |
| 6 | Laden-Wappen | Art des Ladens (Schmied, Stand, Schenke, Juwelier) als Piktogramm. |
| 7 | Öffnungszeit-Uhr | Kleine Uhr zeigt, wann der Laden schließt (`till`). |
| 8 | Sperre als Bild | Geschlossen = Plane/Schild-Symbol statt nur Satz. |
| 9 | Direkt-Handel | „Zeig mir deine Waren“ entfällt, E am Händler öffnet sofort (wie `tradeAt`). |
| 10 | Kombination 3 + 1 + 4 + 5 + 6 + 7 | Dock mit Porträt-Kopf, Laden-Wappen, Ruf-Marke, Schließuhr; Gruß als Blase in der Welt. |

**Bewertung:** 2 ist stimmungsvoll, aber ein Fenster je Ladentyp zu zeichnen ist teuer und doppelt die Welt (die Stände gibt es schon). 9 ändert den Gesprächsfluss (Händler haben andere Gesprächsoptionen: Reparatur, Gerüchte) → nicht ohne Entscheidung. 8 ist gut, aber die Sperren laufen im Dialog — bleibt dort, mit Symbol.
**Wahl:** **10**.

## 2. Warenpräsentation

**Problem:** Waren als Textliste; Stadtwaren (`GOODS`, oft 10+ Zeilen) und Ausrüstung gemischt; keine Kategorie, keine Rarität, kein Bestand-Gefühl („viel/knapp“).
**Inspiration:** Diablo (Raster mit Reitern), Albion (Kategorien + Menge + Preis-Spalte), Stardew (Liste mit großem Icon und Preis), Runescape (Raster mit Bestand-Zahl), Darkest Dungeon (wenige Teile groß auf Regal).

| # | Variante | Idee |
|---|---|---|
| 1 | Raster mit Preis-Schild | Icon-Zellen wie Inventar, Preis als kleines Schild darunter. |
| 2 | Regal-Ansicht | Ware auf gezeichneten Regalbrettern je Art. |
| 3 | Kategorie-Chips | Waffen · Rüstung · Vorrat · Waren · Messing (ui_redesign §5). |
| 4 | Bestand als Stapelhöhe | Viel Ware = sichtbarer Stapel, knapp = einzelnes Stück. |
| 5 | Preisfarbe | Preis grün/rot nach `priceNote`-Faktor. |
| 6 | Markt-Tafel | Stadtwaren als Kreidetafel mit Preisen und Pfeilen. |
| 7 | Hervorgehobene Ware | Das teuerste/seltenste Stück groß oben („Auslage“). |
| 8 | Leitware-Zeichen | Symbol der T09-Leitware (Waffen, Werkzeug, Tuch …) an jedem Teil. |
| 9 | Nur Ausrüstung im Raster, Waren als Tafel | Zwei Darstellungen für zwei Arten. |
| 10 | Kombination 1 + 3 + 5 + 6 + 8 | Raster mit Preisschild für Ausrüstung, Kreidetafel für Stadtwaren (`GOODS`), Kategorie-Chips, Preisfarbe, Leitware-Zeichen. |

**Bewertung:** 2 teuer und schlecht skalierbar. 4 suggeriert Mengen, die bei Ausrüstung meist 1 sind; bei Waren gibt es echte Zahlen (`town.stock`) → als Zahl reicht. 7 braucht eine Auswahlregel → offen (siehe §7). 6 passt zu Händlerzügen/Wirtschaft (Waren sind ein eigenes Spiel).
**Wahl:** **10**.

## 3. Kauf

**Problem:** Ein Klick = ein Stück, ohne Bestätigung, ohne Menge; bei Waren (Handelsspiel) bedeutet 20 Stück 20 Klicks und 20 Fenster-Neuaufbauten. Fehler „Zu wenig Gold“ nur als Toast.
**Inspiration:** Albion (Mengenschieber + Gesamtpreis), WoW (Umschalt-Klick = Menge), Stardew (Klick + Halten kauft weiter), Diablo (Rechtsklick kauft), PoE (Tausch-Fenster mit Annahme).

| # | Variante | Idee |
|---|---|---|
| 1 | Mengen-Schieber | Bei Stapeln/Waren Schieber + Gesamtpreis + „Kaufen“. |
| 2 | Umschalt-Klick | Umschalt = 5/10 Stück (Zahl offen). |
| 3 | Halten kauft weiter | Gedrückt halten wiederholt. |
| 4 | Warenkorb | Mehrere Teile sammeln, einmal zahlen. |
| 5 | Bestätigung ab Preis | Teure Käufe fragen nach (Schwelle offen). |
| 6 | Doppelklick kauft | Einfachklick = ansehen (Karte), Doppelklick/Knopf = kaufen. |
| 7 | Ziehen ins Gepäck | Ware in die eigene Seite ziehen (inventar.md §5). |
| 8 | Unbezahlbar grau | Zu teure Ware abgedunkelt, Preis rot. |
| 9 | Tasche-voll-Marke | Wenn kein Platz: Zelle gesperrt mit Taschensymbol. |
| 10 | Kombination 6 + 1 + 7 + 8 + 9 | Ansehen per Klick, Kaufen per Knopf/Doppelklick/Ziehen, Mengen-Schieber bei Stapeln, Unbezahlbar/Voll sichtbar vorab. |

**Bewertung:** 4 ändert den Ablauf (Teilkauf bei Tasche voll, Preisänderung während Korb durch T09-Lagerabzug je Stück) → Regelfrage. 2/3 brauchen Zahlen → offen. **Mehrfachkauf** berührt T09: jeder Kauf zieht `T.stock` −0,5 und kann den Preis des nächsten Stücks ändern → Schieber muss den Preis **je Stück** neu rechnen (ehrlich) oder einen Gesamtpreis festlegen (neue Regel). 5 braucht Schwelle.
**Wahl:** **10**; Mengenkauf = Schleife über vorhandenes `buy` (Preis je Stück, Gesamt wird angezeigt, indem man vorab simuliert — ANNAHME: Simulation an Kopie von `S.towns[tk].stock` möglich).

## 4. Verkauf

**Problem:** Ganze Tasche als Liste rechts; angelegte Ausrüstung kann nicht verkauft werden (muss erst abgelegt werden); keine Rarität, falscher Preis bei seltenen Teilen (Beobachtung 1); `bound`-Teile stehen in der Liste und werden erst beim Klick abgelehnt.
**Inspiration:** Diablo (Rechtsklick verkauft, Rückkauf-Reiter), Terraria (Rückkauf), WoW (Müll grau, „alles Graue verkaufen“), Stardew (Ware in Kiste werfen, Abrechnung am Abend), Albion (Verkaufsauftrag).

| # | Variante | Idee |
|---|---|---|
| 1 | Eigenes Raster | Rechte Seite = Inventar-Raster (gleiche Zellen, Rarität, Zustand). |
| 2 | Ziehen zum Händler | Teil auf die Händlerseite ziehen = verkaufen. |
| 3 | Rückkauf-Reiter | Zuletzt Verkauftes zurückkaufen (Regel: zu welchem Preis? offen). |
| 4 | Alles Markierte verkaufen | Mit Müll-Marke (inventar.md O-2). |
| 5 | Unverkäuflich gesperrt | `bound`, Questgegenstände (`value:0`) grau mit Schloss. |
| 6 | Händler will das nicht | Teile, die nicht zum Laden passen, abgedunkelt — **neue Regel** (heute kauft jeder alles). |
| 7 | Preis-Vorschau mit Grund | Zeigt „Selten ×1,9“ als Marke im Preis. |
| 8 | Bestätigung bei Selten+ | Nachfrage vor Verkauf ab Selten. |
| 9 | Verkaufsstapel | Teile auf einen Tisch legen, einmal „Handel abschließen“. |
| 10 | Kombination 1 + 2 + 5 + 7 + 8 | Inventar-Raster, Ziehen, Sperrschloss, Preisgrund-Marke, Nachfrage ab Selten — mit korrektem Exemplarpreis. |

**Bewertung:** 3, 4, 6, 9 ändern Handelsregeln oder brauchen neue → offene Entscheidungen. 7 macht eine vorhandene Regel (`RARITY_VALUE`) sichtbar — **setzt die Behebung von Beobachtung 1 voraus**. 8: Schwelle „ab Selten“ ist Darstellungsschutz, keine Spielregel.
**Wahl:** **10**.

## 5. Vergleich im Laden

**Problem:** Info-Spalte vergleicht wie `itemInfoHTML` nur Schaden/Rüstung; Preis gegen andere Städte nur als eine Textzeile für Waren.
**Inspiration:** Diablo IV (Pfeile in der Ladenzelle), Albion (Marktpreise anderer Städte), WoW-Auktionshaus (Preisverlauf), Mount & Blade (Händler nennt, wo es billiger ist — Gerücht).

| # | Variante | Idee |
|---|---|---|
| 1 | Ausrüstungsvergleich | Gleiche Karte + Pfeile wie Inventar (items.md §7). |
| 2 | Preis-Pfeil gegen `priceSeen` | ▲/▼ zum zuletzt gesehenen Preis dieser Ware in anderer Stadt (ui_redesign §5). |
| 3 | Städte-Liste | Tooltip mit allen bekannten Preisen (`S.priceSeen`), Alter in Tagen. |
| 4 | Mini-Karte | Kleine Karte, Städte grün/rot nach Preis. |
| 5 | Gewinn-Hinweis | „In Salzhafen +4 je Stück“ — Rechnung aus vorhandenen Werten. |
| 6 | Wertmarke | Ware billiger als `value` → Marke „Gelegenheit“ — ist das die Regel? (Bezugspunkt offen). |
| 7 | Kaufkraft-Balken | Wie viele Stück kann ich mir leisten. |
| 8 | „Besser als angelegt“-Pfeil in der Ladenzelle | wie inventar.md §6. |
| 9 | Händler-Kommentar | Blase „Das hält länger als dein Fetzen da.“ — Text, aber in der Welt (Bark). |
| 10 | Kombination 1 + 8 + 2 + 3 + 5 | Ausrüstung mit Karte und Zellenpfeil; Waren mit Preis-Pfeil, Städte-Tooltip und Gewinn-Hinweis. |

**Bewertung:** 4 schön, aber teuer im Fenster; die Weltkarte zeigt Städte schon. 6 braucht Bezugspunkt → offen. 9 braucht neue Texte je Händler (Bark-Inhalt) → offen, gehört zu §8. 5 zeigt nur Rechnungen aus `priceSeen` und aktuellem `price` (keine neue Regel), Alter der Daten mit angeben.
**Wahl:** **10**.

## 6. Geldanimation

**Problem:** Gold ändert sich still in der Kopfleiste; Kauf/Verkauf nur Protokollzeile. Gold aus Beute als `float` am Gegner.
**Inspiration:** Diablo (Münzklang, Gold fliegt zum Zähler), Stardew (Zähler rollt Ziffern, Klingeln), Hades (Obolus-Symbol pulsiert), Runescape (Münzstapel-Bild wächst).

| # | Variante | Idee |
|---|---|---|
| 1 | Rollender Zähler | Goldzahl zählt hoch/runter statt zu springen. |
| 2 | Münzen fliegen | Kleine Pixelmünzen fliegen vom Händler zum Goldzähler (Verkauf) bzw. zurück (Kauf). |
| 3 | Münzklang | `sfx('coin')` synthetisch, Höhe nach Betrag. |
| 4 | Delta-Zahl | „−120“ / „+45“ steigt neben dem Goldzähler auf. |
| 5 | Beutel-Symbol | `res_gold`/`beutel`-Piktogramm hüpft. |
| 6 | Münzstapel wächst | Piktogramm wechselt nach Vermögen (wenig/viel). |
| 7 | Rot blinken | Bei „Zu wenig Gold“ blinkt der Zähler rot. |
| 8 | Händler zählt | Händler-Pose `trade` beim Abschluss (Pose existiert). |
| 9 | Beute-Gold am Spieler | `float` „+n Gold“ zusätzlich am Zähler (items.md §6). |
| 10 | Kombination 1 + 3 + 4 + 7 + 8 | Rollender Zähler, Münzklang, Delta-Zahl, Rot-Blinken, Händler-Pose. |

**Bewertung:** 2 sieht gut aus, aber Fenster (DOM) → Welt-Händler (Canvas) über Ebenen ist fummelig, und bei Dock ändert sich die Lage; 4 erreicht dasselbe billiger. 6 braucht Schwellen → Kür, offen. Alles muss `S.settings.motion` (reduzierte Bewegung) und Lautstärke beachten.
**Wahl:** **10**.

## 7. Seltene Ware

**Problem:** Läden verkaufen nur Grundware ohne Rarität; Seltenes gibt es nur über Pools mit seltener Grundrarität (z. B. Rüstmeisterin Sets, Juwelier) und den Schwarzmarkt (`BLACK_RARE` 25 %, als Dialogzeile). Seltenes sieht im Laden aus wie alles andere.
**Inspiration:** Diablo (Glücksspiel-Händler), PoE (Händler-Auslage mit seltenen Stücken), WoW (begrenzter Vorrat mit Zeitlimit), Darkest Dungeon (Händler mit Raritäten nur zeitweise), Mount & Blade (Stadtwaren nach Region).

| # | Variante | Idee |
|---|---|---|
| 1 | Auslage | Seltenstes Stück des Tagesbestands groß oben mit Rahmen. |
| 2 | Raritäts-Wurf im Laden | Ladenware würfelt wie Beute — **neue Regel** (heute: Grundware). |
| 3 | Verhüllte Ware | Seltenes nur ab Ruf/Rang sichtbar — **neue Regel**. |
| 4 | Zeitliche Ware | „Heute“-Marke für Tagesbestand (`_stockDay`) — vorhanden, nur sichtbar machen. |
| 5 | Schwarzmarkt als Raster | `blackMarket` in dasselbe Fenster mit Dunkel-Rahmen, „gebraucht“-Marke. |
| 6 | Händler-Flüstern | Blase „Hab da was Besonderes …“ wenn `BLACK_RARE` im Bestand. |
| 7 | Glücksspiel | Unbekannte Teile kaufen — neue Regel. |
| 8 | Bestellung | Händler besorgt Ware bis morgen — neue Regel. |
| 9 | Fachhändler-Wappen | Juwelier/Rüstmeisterin/Ingenieurin mit eigenem Laden-Symbol. |
| 10 | Kombination 1 + 4 + 5 + 6 + 9 | Auslage für das Seltenste **aus dem vorhandenen Bestand**, Heute-Marke, Schwarzmarkt als Raster mit Dunkel-Rahmen, Flüstern, Fachhändler-Wappen. |

**Bewertung:** 2, 3, 7, 8 erfinden Regeln → GATE §2 verbietet, nur als offene Entscheidung. 1/4/5/6/9 zeigen nur vorhandene Daten.
**Wahl:** **10**.

## 8. Händlerreaktionen

**Problem:** Händler reagiert nur über Sperrsätze; beim Kauf, Verkauf, Feilschen (gibt es nicht), teurem Kauf oder Geldmangel passiert in der Welt nichts. Die `trade`-Pose läuft nur bei Annäherung.
**Inspiration:** Hades (Charon-Laute und Gesten), Stardew (Händler-Satz je Kauf), Darkest Dungeon (Ausrufe), Kenshi (Händler beäugt dich, Wachen reagieren), Skyrim-artige Barks (nur UX-Gedanke).

| # | Variante | Idee |
|---|---|---|
| 1 | Barks als Blase | Kurze Zeile in der Welt beim Abschluss (`bubble`). |
| 2 | Gesten | `trade`-Pose beim Kauf, Kopfschütteln bei „zu wenig Gold“ (Geste fehlt evtl. in `anim.js`). |
| 3 | Stimmungs-Gesicht | Porträt im Fenster wechselt Ausdruck nach Ruf/Angst. |
| 4 | Angst sichtbar | Wenn `fearedBy(npc)`: Händler zittert/weicht zurück (Angst erhöht schon die Preise). |
| 5 | Stammkunde | Nach vielen Käufen freundlicher — **neue Regel** (Beziehung durch Handel gibt es nicht; Schmied-Reparatur gibt Beziehung +3). |
| 6 | Reaktion auf Seltenes | Händler staunt beim Verkauf eines Legendären. |
| 7 | Klang je Händler | Kurzer Laut/Grummeln (synthetisch). |
| 8 | Feilschen-Minispiel | **neue Regel**. |
| 9 | Ladenschluss-Geste | Händler packt um `till` sichtbar ein (Plane `stallShut` gibt es). |
| 10 | Kombination 1 + 2 + 3 + 4 + 6 + 9 | Blase + Geste beim Abschluss, Gesicht nach Ruf/Angst, Angst sichtbar, Staunen bei Seltenem, Einpacken am Abend. |

**Bewertung:** 5 und 8 sind neue Regeln. 1 braucht **Textinhalte** (Barks je Händlerart/Fraktion) — Inhalt ist eine Designentscheidung, Mechanik ist vorhanden. 3/4 zeigen vorhandene Zustände (`repTier`, `fearLvl`). 2/9 hängen an vorhandenen Posen; fehlende Gesten → Artist.
**Wahl:** **10**.

---

## FEATURE IMPACT REPORT (GATE.md §8) — Shops visuell

**Feature:** Handels-Dock mit Händler-Porträt, Raster mit Preisschildern und Kategorien, Kreidetafel für Stadtwaren, Kauf per Knopf/Ziehen mit Mengen-Schieber, Verkauf aus Inventar-Raster mit korrektem Exemplarpreis, Preisvergleich über `S.priceSeen`, Geldanimation mit Münzklang, Auslage seltener Ware aus vorhandenem Bestand, Schwarzmarkt als Raster, Händler-Blasen und -Gesten.

**Betroffene Systeme (Funktionen)**
- UI: `ui.js tradeUI`, `itemInfoHTML`, `openModal`/`refreshModal` (→ Dock, ui_redesign Scheibe 3), `refreshHUD` (Goldzähler), `toast` (→ Meldungsfluss), `stableUI` (gleiche Grammatik).
- Handel: `game.js shopStock`, `buy`, `sell`, `price`, `rawPrice`, `repPrice`, `priceNote`, `baseMul`, `ecoTown`, `sellsGoods`, `openShop`, `tradeAt`, `blackMarket`, `blackOffers`, `ecoMenu`, `SIM.notePrices`, `S.priceSeen`.
- Gespräch: `talk` (Laden-Sperren), `bubble`, `act(e,'trade',…)`, `updateNpc`-Händlerzweig, `repTier`, `fearedBy`/`fearLvl`, `refusesChain`, `deadWelcome`.
- Render: `drawPortraitTo`, `drawItemIconTo`, `stall`/`market_stall`, `stallShut`.
- Klang: `sfx.js` (neu `coin`).
- Koop: `coop.js` Gast-Handel (Dialog mit Beutel, `A.price`), `uiHooks.modal`; Handel ist Host-Sache (PLAN_COOP).
- T09-Wirtschaft: jeder Kauf/Verkauf ändert `S.towns[tk].stock` (±0,5) → Mengenkauf ändert Preise je Stück.

**Bereits vorhanden:** Preisnotiz knapp/reichlich, `S.priceSeen`, Tagesbestand, Händler-Pose, Sprechblasen, Stand-Grafiken mit Plane, Porträt-Zeichner, Raritätsfarben, Itemkarte (`itemInfoHTML`), Piktogramme `res_gold`/`muenzen`/`beutel`.

**Fehlende Infrastruktur:** Dock-Fenster (ui_redesign Scheibe 3), Mengenkauf über `buy`-Schleife mit Vorab-Simulation, Exemplarpreis in der Anzeige (Fehlerbehebung), Kategorie-Ableitung (wie inventar.md §2), Goldzähler-Animation, Münzklang, Bark-Texte, fehlende Gesten (Kopfschütteln, Staunen) in `anim.js`/`fig5.js`, Schwarzmarkt-Daten als Raster (`blackOffers` liefert Liste — vorhanden).

**OFFENE DESIGNENTSCHEIDUNGEN**
- S-1 **Handel direkt per E am Händler** (ohne „Zeig mir deine Waren“) oder Gespräch zuerst? Händler haben weitere Optionen (Reparatur, Gerüchte, Aufträge). *Empfehlung:* Gespräch bleibt; nur Stände/Theken (`tradeAt`) öffnen direkt wie heute.
- S-2 **Mengenkauf:** Preis je Stück neu (T09-ehrlich, Gesamt schwankt) oder fester Gesamtpreis beim Öffnen des Schiebers? *Empfehlung:* je Stück neu, Gesamt vorab simuliert und angezeigt.
- S-3 **Mehrfachverkauf / Müll-Marke / Rückkauf** einführen? Neue Handelsregeln. *Empfehlung:* Mehrfachverkauf markierter Teile ja (gleicher Preis je Stück wie Einzelverkauf), Rückkauf nein.
- S-4 **Bestätigung**: ab welcher Rarität/welchem Preis fragt Kauf/Verkauf nach? *Empfehlung:* Verkauf ab Selten, Kauf ab einem Betrag, den der Entwickler nennt (kein Vorschlag für die Zahl).
- S-5 **Neu gekaufte Ausrüstung mit Zufallszustand 55–100 %** (`mkItem`) — gewollt oder soll Ladenware neu (100 %) sein? Betrifft Balance. *Empfehlung:* Entwickler entscheidet; Darstellung zeigt den Zustand in jedem Fall in der Karte.
- S-6 **Händler-Barks:** Sollen Händler beim Kauf/Verkauf/Geldmangel/seltenem Teil kurze Sätze sagen — und wer schreibt sie (je Fraktion/Ladenart)? DECISIONS 01.10. „einfache Bewohner nur Sprechblase“ spricht für Blasen. *Empfehlung:* ja, 3–4 Sätze je Ladenart, nur Blase, kein Dialog.
- S-7 **Seltene Ladenware** (Raritätswurf, Ruf-gesperrte Auslage, Bestellung, Glücksspiel)? Neue Regeln. *Empfehlung:* nein in diesem Umbau; nur vorhandene Seltenheit (Grundrarität, Schwarzmarkt) zeigen.

**Risiken**
- **Preisanzeige muss exakt `price(...)` sein** (mit Exemplar) — sonst lügt die schöne Anzeige; Probe: angezeigter Preis = gezahlter Preis für jede Rarität.
- T09: Vorab-Simulation des Mengenkaufs darf `S.towns` nicht verändern (Kopie), Selbsttest-Proben zu T09/RB-029 (Kauf zieht −0,5, Verkauf füllt +0,5) müssen weiter bestehen.
- Koop: Gast handelt über Dialog mit eigenem Beutel; neues Dock muss für Gäste entweder mitkommen oder der Dialog bleibt (ui_redesign §7: Gastfenster bleiben Modal bis geprüft). Host-Gold vs. Gast-Beutel (`coopGold`) im Goldzähler nicht verwechseln.
- Dock unter 1200 px überlagert das Spielfeld (ui_redesign §7). Heute pausiert das Modal die Welt **nicht** (`openModal` setzt kein `S.paused`), sperrt aber die Eingabe (`bindInput`: `if (UI.dialogueOpen() || UI.modalOpen) return`). Im Dock: darf man sich beim Handeln bewegen? (Folgefrage zu Scheibe 3, nicht hier entschieden.)
- Selbsttest: Probe „Stand öffnet den Handel direkt“ (`game.js` ~Z. 16761) prüft `UI.modalOpen === 'trade'` — ein Dock muss denselben Namen melden oder die Probe wird angepasst.
- Leistung: `refreshModal` je Klick baut alles neu; beim Mengenkauf nicht n-mal neu bauen.
- Barks/Gesten dürfen kein `rnd()` ziehen (Probe-RNG), nur `vrnd`/`Math.random` für Auswahl der Zeile.
- `goodsOnly` bleibt nach Kontor gesetzt (Beobachtung 3) — Kategorien würden diesen Zustand sichtbar machen; vorher klären.

**Implementierungsplan (Scheiben)**
0. **Vorab (Engineer, Fehler):** Exemplarpreis in `tradeUI` (Beobachtung 1). Ohne das keine Preisdarstellung.
1. **H-S1 Raster + Karte + Preisschild + Kategorien + Kreidetafel** (`ui.js tradeUI` im heutigen Modal; Inhalt dock-fähig gebaut). Unbezahlbar/Voll vorab sichtbar, Sperrschloss. Probe: Zellenzahl = Bestand, Preis = `price`.
2. **H-S2 Kauf/Verkauf-Bedienung** (nach S-2, S-4): Klick = Karte, Knopf/Doppelklick/Ziehen = handeln, Mengen-Schieber, Nachfrage.
3. **H-S3 Geld + Händler in der Welt:** Goldzähler rollt, Delta-Zahl, Münzklang, Händler-Pose beim Abschluss, Gesicht nach Ruf/Angst; Barks erst nach S-6.
4. **H-S4 Preisvergleich + Auslage + Schwarzmarkt-Raster:** `priceSeen`-Pfeile und -Tooltip mit Datenalter, Gewinn-Hinweis, Auslage aus Tagesbestand, `blackMarket` als Raster mit Gebraucht-Marke.
5. **H-S5 Dock** (= ui_redesign Scheibe 3), inkl. Koop-Prüfung.
Je Scheibe: Debug-Eintrag („Händler hierher: Schmied/Stand/Juwelier/Schwarzmarkt“ — es gibt schon Probe-Händler über Debug), Kodex-Handbuch „Handel“, `docs/MECHANIKEN.md` (Preisschild-Farben, Mengenkauf).

**STATUS:** TEILWEISE DEFINIERT — H-S1 und H-S4 (ohne Auslage-Regel) baubar nach Fehlerbehebung 0; H-S2/H-S3 warten auf S-2, S-4, S-6; H-S5 an ui_redesign Scheibe 3.
