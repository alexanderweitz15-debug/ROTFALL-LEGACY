# Visueller Umbau — Priorität 6: INVENTAR

Analyst C · 02.10.2026 · Status: **ANALYSE, kein Code** (VISUAL.md §5, GATE.md §1–§8)
Kennzeichnung: **FAKT**, **VORSCHLAG**, **ANNAHME**. Gemeinsame Bausteine (Itemkarte, Tooltip, Seltenheit, Vergleich) stehen in `items.md`; hier geht es um das Fenster und den Umgang mit dem Gepäck.

---

## 0. Bestand (FAKT)

- **Fenster:** `ui.js invUI(body)` im Vollbild-Modal (`openModal('inventory')`, Taste I über `bindInput` → `UI.openModal('inventory')`; Lagergebäude `BUILD_USE` → `openModal('inventory')`). Gruppe „Gepäck“ in `NAV` (ui_redesign Scheibe 1 umgesetzt).
- **Layout** (`style.css .inv-layout`: `1fr 240px 300px`): links Raster „Tasche n/cap“ (`.inv-grid`, 8 Spalten à 56 px) + „Lagerbestand“ (24 Plätze, nur mit gebautem `storage`), Mitte **Ausrüstung als Liste** (`.eq-list`, 9 Plätze aus `GEAR`: Waffe, Nebenhand, Kopf, Rumpf, Hände, Beine, Füße, Umhang, Talisman) + „Rüstung gesamt“ (`A.armorOf`) + „Traglast n/cap“, rechts Detail `#det` (`showDetail` → `itemInfoHTML` + Knöpfe Anlegen/Benutzen, Auf Leiste legen, Verbände schneiden, Zerschlagen, Ablegen, Ins Lager).
- **Zelle:** Canvas 52 px, `drawItemIconTo` per `setTimeout`; Anzahl `.cnt`; Zustandsbalken `.cond` (grün > 50 %, sonst rot); Rahmen `.cell.r-<rarität>` (nur Tasche, **nicht** Lager). `title` = Name.
- **Bedienung:** Klick = auswählen + Detail; Doppelklick = `A.useOrEquip`; Ausrüstungsplatz-Klick = `A.unequip` sofort; Lagerzelle-Klick = `A.takeFromStash` sofort.
- **Kapazität:** `c.invCap = 24 + tfx(c,'invCap')` (`recalc`); Tasche ist ein **dichtes Array** (`p.inv`), leere Zellen werden nur bis `invCap` aufgefüllt. Stapel: `addItem` mit `ITEMS[k].stack`; Rohstoffe (`it.res`) gehen in `S.res`, nicht ins Gepäck.
- **Kein** Sortieren, **keine** Kategorien/Filter, **kein** Ziehen (Drag & Drop gibt es nur bei Siedlungs-Prioritäten: `ui.js prioCards` mit `draggable`, `ondragstart`, `ondrop`).
- **Charakterdarstellung:** Inventar zeigt **keine** Figur. `charUI` hat `#ch-figure` (232×110) mit `drawFigureTo` (drei Ansichten S/W/N aus `SP.humanFrame`) und „Rüstzeug“ als Textliste; Körpertafel `bodyChart` (SVG-Trefferzonen).
- **Neuaufbau:** jede Aktion → `refreshModal()` baut das ganze Fenster neu (alle Canvas neu gezeichnet; Icons gecacht in `iconCache`/`iconR`).
- **Gefährten:** `charUI(body, who)` kann andere Figuren zeigen; eigene Ausrüstungsverwaltung für Gefährten fehlt (IST_ZUSTAND §3 Nr. 16, P22).
- **Koop:** Gast-Gepäck läuft als Dialog (`coop.js` ~Z. 513 „Gepäck von …“), Tausch über `hostTrade`; `uiHooks.modal` leitet Fenster um.
- **Selbsttest:** keine Probe liest das Inventar-DOM (grep `openModal('inventory')` nur in `bindInput` und `BUILD_USE`).

**Beobachtungen (FAKT, an Engineer):** Lagerraster ohne Raritätsrahmen; Ausrüstungsliste ohne Rarität und ohne Tooltip; Zweiwaffen-Nebenhand-Waffe erscheint als „Nebenhand“ ohne Hinweis; `slotLabel` ohne Hände/Beine/Talisman (siehe items.md).

---

## 1. Slots (Ausrüstungsplätze)

**Problem:** Neun Plätze als Textliste mit 34-px-Bild; Name ist das Wichtigste, Rarität/Zustand fehlen; leerer Platz = „—“.
**Inspiration:** Diablo (Papierpuppe, Plätze um die Figur), WoW (Plätze links/rechts der Figur), Runescape (kompaktes Kreuz-Raster), Darkest Dungeon (Plätze als Schmuckrahmen), Albion (Plätze um die Figur, Leerplatz mit Schattensilhouette).

| # | Variante | Idee |
|---|---|---|
| 1 | Papierpuppe | Plätze anatomisch um eine große Figur (Kopf oben, Füße unten, Waffe/Nebenhand seitlich). |
| 2 | Kreuz-Raster | 3×4-Raster ohne Figur, Plätze nach Körperlage. |
| 3 | Liste wie heute + Rarität | Minimal: Rahmen, Zustand, Tooltip. |
| 4 | Rüstständer | Holzständer (gezeichnet) trägt die Teile. |
| 5 | Leerplatz-Silhouette | Leerer Platz zeigt schattiertes Platzsymbol (Helm, Stiefel …). |
| 6 | Zwei Spalten | Rüstung links, Waffen/Talisman rechts, Figur in der Mitte. |
| 7 | Körpertafel-Plätze | Plätze direkt auf `bodyChart` (Kopf/Rumpf/Glieder). |
| 8 | Ringmenü | Plätze im Kreis um die Figur. |
| 9 | Platz mit Zustandsrand | Rahmen läuft je `cond` rot zu. |
| 10 | Kombination 1 + 5 + 9 | Papierpuppe, Leerplatz-Silhouetten, Zustandsrand; Rarität laut items.md §3. |

**Bewertung:** 1/6/10 sind Standard und bereits in ui_redesign Scheibe 5 vorgesehen („Papierpuppe im Inventar“). 7 verwechselt Rüstung mit Trefferzonen (Rüstung wirkt global, `armorOf`). 4/8 schön, aber schwer lesbar. 5 und 9 billig und informativ.
**Wahl:** **10**.

## 2. Kategorien

**Problem:** Tasche mischt Waffen, Rüstung, Essen, Questgegenstände, Handelswaren (`GOODS`), Material; bei 24–30 Plätzen schnell unübersichtlich.
**Inspiration:** Diablo IV (Reiter Ausrüstung/Verbrauch/Quest), WoW (Taschen je Art), Stardew (keine Kategorien, aber klare Icons), Albion (Filter-Chips), PoE (Stash-Reiter).

| # | Variante | Idee |
|---|---|---|
| 1 | Reiter je Art | Ausrüstung · Verbrauch · Waren · Material · Quest. |
| 2 | Filter-Chips | Ein Raster, Chips blenden aus (wie Protokoll-Filter `LOGCATS`). |
| 3 | Farbige Zellenecke | Kleine Ecke je Art, kein Filter. |
| 4 | Getrennte Questtasche | Questgegenstände (`value:0`, Schlüsselgegenstände) zählen nicht zur Traglast — **Regeländerung**. |
| 5 | Abschnitte im Raster | Raster mit Trennzeilen je Art (automatisch gruppiert). |
| 6 | Symbol-Filterleiste | Piktogramme statt Wörter (Schwert, Brot, Kiste, Siegel). |
| 7 | Suchfeld | Text filtert Namen. |
| 8 | Gefährten-Tasche | Reiter je Gruppenmitglied — braucht P22. |
| 9 | Neu-Marke | Neu gefundene Teile tragen Marke, bis überfahren. |
| 10 | Kombination 6 + 2 + 9 | Piktogramm-Chips als Filter über einem Raster, Neu-Marke. |

**Bewertung:** 1 erzwingt Klicks und zerreißt das dichte Array nicht, ist aber für 24 Plätze zu schwer. 4 ändert Traglast → offene Entscheidung. 8 hängt an P22. 6 + 2 passt zum Prinzip „Piktogramm statt Wort“ und zur vorhandenen Chip-Grammatik. 9 braucht ein Feld am Exemplar (siehe offene Fragen).
**Wahl:** **10**. Kategorie wird **abgeleitet** (`it.slot`, `it.good`, `it.res`, `value:0`/Quest), kein neues Datenfeld.

## 3. Sortierung

**Problem:** Reihenfolge = Fundreihenfolge (`inv.push`); Ablegen/Anlegen verschiebt alles.
**Inspiration:** Diablo (Sortieren-Knopf), Terraria (Sortieren + Favoriten sperren), Stardew (Ordnen-Knopf), PoE (manuell).

| # | Variante | Idee |
|---|---|---|
| 1 | Ein Knopf „Ordnen“ | Sortiert einmal nach Art → Rarität → Name. |
| 2 | Dauer-Sortierung | Raster ist immer sortiert. |
| 3 | Sortier-Auswahl | Nach Art / Rarität / Wert / Zustand. |
| 4 | Manuell per Ziehen | Freie Anordnung (siehe §5). |
| 5 | Sperren/Favorit | Gesperrte Teile bleiben beim Ordnen und Verkaufen liegen. |
| 6 | Müll-Marke | Teile als „verkaufen“ markieren, Händler bietet „Alles Markierte verkaufen“. |
| 7 | Automatisch nach Fund | Neue Teile links oben. |
| 8 | Stapel zusammenführen | Ordnen füllt Teilstapel (`addItem`-Logik) auf. |
| 9 | Ansicht statt Daten | Sortierung nur in der Anzeige, `p.inv` bleibt unverändert. |
| 10 | Kombination 1 + 3 + 5 + 8 + 9 | Ordnen-Knopf mit Auswahl, Sperre, Stapel auffüllen — als Ansicht, Daten unberührt außer Stapeln. |

**Bewertung:** 2 verhindert eigene Ordnung. 9 ist entscheidend: `p.inv` wird an vielen Stellen per **Index** angesprochen (`A.useOrEquip(i)`, `A.sell(i)`, `A.dropItem(i)`, Schnellleiste über `key`) → Ansicht muss Index zurückübersetzen. 6 berührt den Handel (Mehrfachverkauf) → shops.md. 5/6 brauchen Felder am Exemplar.
**Wahl:** **10**. Sortierung als Ansicht (Indexzuordnung), keine Umordnung von `p.inv` — außer man entscheidet O-3.

## 4. Tooltips im Inventar

**Problem:** Nur `title`-Name; Werte erst per Klick rechts. Lager und Ausrüstung ohne Werte.
**Inspiration:** siehe items.md §2; zusätzlich Stardew (Tooltip folgt Maus, sehr knapp), RimWorld (Info-Knopf „i“).

| # | Variante | Idee |
|---|---|---|
| 1 | Kurzkarte am Mauszeiger | Name, Rarität, 1–3 Kennzahlen, Vergleichspfeile. |
| 2 | Volle Karte am Mauszeiger | Alles aus `itemInfoHTML`. |
| 3 | Detailspalte bei Überfahren | Spalte rechts folgt der Maus. |
| 4 | Info-Knopf je Zelle | Kleines „i“ öffnet Karte. |
| 5 | Lupe-Modus | Taste hält, alle Zellen zeigen Kennzahl. |
| 6 | Kennzahl in der Zelle | Schaden/Rüstung als Mini-Zahl unten links. |
| 7 | Halten auf Touch | Langes Drücken = Karte. |
| 8 | Ausrüstung mitzeigen | Tooltip über Ausrüstungsplatz zeigt Karte + Set-Liste. |
| 9 | Lager-Tooltip | Lagerzelle zeigt Karte statt sofort zu entnehmen. |
| 10 | Kombination 1 + 3 + 7 + 8 + 9 | Kurzkarte an der Maus, volle Karte in der Spalte, Touch-Halten, Ausrüstung und Lager einheitlich. |

**Bewertung:** 2 verdeckt das Raster. 6 überlädt 56-px-Zellen. 5 braucht Taste. 9 ändert Bedienung (Klick entnimmt heute sofort) → gleiche Frage wie I-2.
**Wahl:** **10**.

## 5. Drag & Drop

**Problem:** Kein Ziehen. Anlegen = Doppelklick; Ablegen in die Welt, ins Lager, auf die Leiste nur per Knopf in der Detailspalte.
**Inspiration:** Diablo (ziehen auf Platz, Raster), WoW (ziehen auf Leiste), Runescape (ziehen tauscht Plätze), Albion (ziehen zwischen Taschen und Lagern), Stardew (Klick nimmt auf, Klick legt ab).

| # | Variante | Idee |
|---|---|---|
| 1 | HTML5-Ziehen | Wie `prioCards` (vorhanden): Zelle → Platz/Lager/Leiste/Welt. |
| 2 | Klick-Aufnehmen | Klick nimmt Teil an die Maus, zweiter Klick legt ab (Touch-tauglich). |
| 3 | Ziehen nur zur Leiste | Minimal: Teile auf `#hotbar` ziehen. |
| 4 | Ziehen auf die Figur | Auf die Papierpuppe ziehen = Anlegen in passenden Platz. |
| 5 | Ziehen aus dem Fenster | In die Welt fallen lassen = `dropItem`. |
| 6 | Ziehen zum Händler | Im Handelsfenster auf die Händlerseite = Verkaufen (shops.md). |
| 7 | Ziehen auf Gefährten | Auf Gruppenkarte = Geben — braucht P22. |
| 8 | Platz-Tausch | Zwei Zellen tauschen (nur sinnvoll mit freier Ordnung, §3). |
| 9 | Ziel-Leuchten | Beim Ziehen leuchten passende Plätze (grün) / gesperrte (rot: Arm ausgefallen, Ketten, `bound`). |
| 10 | Kombination 1 + 2 + 3 + 4 + 9 | Ziehen (Maus) und Klick-Aufnehmen (Touch) mit denselben Zielen: Puppe, Leiste, Lager; Ziele leuchten nach den Regeln aus `equip`. |

**Bewertung:** 7 hängt an P22, 8 an O-3. 5 macht versehentliches Wegwerfen leicht → mit Bestätigung oder weglassen. 6 gehört zu shops.md. 9 muss **dieselben** Sperren wie `equip` zeigen (Arm ausgefallen `B.isDisabled`, Ketten `S.bond`, Zweihand) — Regeln aus `equip` lesen, nicht nachbauen (GATE §6).
**Wahl:** **10**. Die Ziel-Prüfung bekommt eine Lesefunktion `canEquip(c, idx)` aus `equip` herausgelöst (ANNAHME: Umbau ohne Verhaltensänderung möglich, Probe nötig).

## 6. Vergleich im Inventar

**Problem:** Vergleich nur in der Detailspalte, nur nach Klick, nur Schaden/Rüstung.
**Inspiration:** Diablo IV (Pfeil im Raster bei besserem Teil), WoW-Addons (grüner Pfeil), Albion (Itemkraft-Farbe).

| # | Variante | Idee |
|---|---|---|
| 1 | Pfeil in der Zelle | ▲/▼ in der Ecke gegenüber dem angelegten Teil. |
| 2 | Zellen-Tönung | Besser = leicht grüner Grund. |
| 3 | Doppelkarte beim Überfahren | Karte + angelegte Karte (items.md §7). |
| 4 | Vergleich-Modus | Taste wählt Platz, Raster zeigt alle Kandidaten sortiert. |
| 5 | „Nicht nutzbar“-Marke | Rot durchgestrichen, wenn Klasse/Glied es verbietet. |
| 6 | Ausrüstungsplatz zeigt Anzahl besserer | Kleine Zahl am Platz. |
| 7 | Set-Fortschritt | Teile eines teilweise getragenen Sets markiert. |
| 8 | Zustandsvergleich | Gleiches Teil, besserer Zustand → Marke. |
| 9 | Klassen-Teile | `classSet`-Teile mit Klassenzeichen. |
| 10 | Kombination 1 + 3 + 5 + 7 | Pfeil, Doppelkarte, Sperrmarke, Set-Fortschritt. |

**Bewertung:** „Besser“ braucht **eine** Vergleichsgröße je Platz: Waffe = `dmg`, Rüstung = `armor` (beides im Code verglichen). Für Talisman/Affix-Teile gibt es keine Einzelgröße → kein Pfeil, nur Karte (sonst neue Regel). 2 kollidiert mit Raritätstönung.
**Wahl:** **10**, Pfeil nur wo eine vorhandene Größe existiert.

## 7. Rüstungsübersicht

**Problem:** „Rüstung gesamt 23“ und „Traglast 12/24“ als Textzeile; woher die Rüstung kommt (Teile, Zustand, Härte-Affix, Set, Stufe, Narben, Segen) sieht man nicht.
**Inspiration:** Kenshi (Rüstung je Körperteil — passt **nicht**, ROTFALL rechnet global), Mount & Blade (Kopf/Körper/Beine-Werte), Diablo (Verteidigung mit Aufschlüsselung im Tooltip), Darkest Dungeon (Schutz als Schild-Symbol mit Zahl).

| # | Variante | Idee |
|---|---|---|
| 1 | Schild-Symbol + Zahl | Großes Piktogramm, Zahl, Tooltip mit Aufschlüsselung. |
| 2 | Gestapelter Balken | Anteile je Quelle (Teile, Affix, Set, Stufe …) farbig. |
| 3 | Zonen auf der Puppe | Zahl je Körperteil — **falsche Regel** (global). |
| 4 | Verschleiß-Hinweis | „Zustand kostet dich 6 Rüstung“ (aus `cond`-Formel in `armorOf`). |
| 5 | Vergleich mit Gegnern | „Gegen Banditen gut“ — neue Bewertung, nein. |
| 6 | Kennzahl-Leiste | Rüstung, Schaden, Ausdauer, Tempo als Piktogramm-Reihe unter der Puppe. |
| 7 | Traglast als Taschenbild | Beutel füllt sich sichtbar. |
| 8 | Set-Abzeichen | Aktives Set als Wappen neben der Zahl. |
| 9 | Reparatur-Hinweis | Ab niedrigem Zustand Hammer-Symbol (Schmied/`mendAt`). |
| 10 | Kombination 1 + 2 + 4 + 6 + 7 + 8 + 9 | Schild + Zahl, Aufschlüsselungsbalken im Tooltip, Verschleiß-Hinweis, Kennzahl-Leiste, Taschenbild, Set-Wappen, Hammer. |

**Bewertung:** 3 und 5 widersprechen dem Regelwerk. 2 braucht eine **Aufschlüsselung** von `armorOf` — die Funktion summiert heute in eine Zahl; Umbau zu „liefert Teile“ ohne Ergebnisänderung nötig (Probe: Summe = alter Wert). 9: Schwelle für das Symbol ist eine Darstellungsentscheidung (offen).
**Wahl:** **10**.

## 8. Charakterdarstellung

**Problem:** Im Inventar keine Figur; im Charakterfenster eine kleine Dreifach-Ansicht (232×110). Was man anlegt, sieht man erst in der Welt.
**Inspiration:** Diablo/WoW (große Figur in der Mitte, dreht sich), Darkest Dungeon (Held im Ganzkörperbild), Stardew (Figur neben Inventar), Albion (Figur mit Ausrüstung live).

| # | Variante | Idee |
|---|---|---|
| 1 | Große Figur, live | `drawFigureTo` groß (Stil-R-Rahmen 40×56, ganzzahlig skaliert), aktualisiert bei Anlegen. |
| 2 | Drehbare Figur | Pfeile/Ziehen wechseln S/W/N/O. |
| 3 | Pose je Waffe | Figur zeigt Haltung der Waffe (Bogen gespannt, Zweihänder). |
| 4 | Vorschau beim Überfahren | Figur trägt probeweise das überfahrene Teil. |
| 5 | Wunden sichtbar | Abnutzung/Blut (`wear`) und Prothesen sichtbar. |
| 6 | Hintergrund nach Ort | Figur vor Stadt/Wildnis/Kerker. |
| 7 | Leerlauf-Animation | Atmen/Idle (`i0`-Rahmen gibt es). |
| 8 | Silhouette nur | Schattenriss mit Rüstungswucht. |
| 9 | Körpertafel daneben | `bodyChart` klein neben der Figur. |
| 10 | Kombination 1 + 2 + 4 + 5 + 7 | Große Live-Figur, drehbar, Vorschau beim Überfahren, Abnutzung/Prothesen, leichtes Idle. |

**Bewertung:** 4 ist der stärkste „ohne Text verstehen“-Effekt; Spec-Cache: nur `SPEC_KEYS`-Felder beeinflussen den Bildcache → Vorschau erzeugt neue Rahmen (Cache-Last, `trimCache`). 6 Kür. 3 hängt an Posen in `fig5.js`. 9 doppelt `charUI`.
**Wahl:** **10**; Vorschau (4) mit Drosselung (erst nach kurzem Verweilen, VORSCHLAG).

## 9. Item-Animationen im Fenster

**Problem:** Alles statisch; Anlegen/Ablegen/Benutzen gibt keine Rückmeldung außer Neuaufbau (`refreshModal` springt).
**Inspiration:** Hades (Gegenstand schnappt ein), Diablo (Klang je Material), Stardew (Teil hüpft kurz), Darkest Dungeon (Schmuckstück blitzt beim Anlegen).

| # | Variante | Idee |
|---|---|---|
| 1 | Einrasten | Teil fliegt von Zelle zum Platz (100–200 ms, VORSCHLAG). |
| 2 | Klang je Material | `sfx('metal')` für Rüstung, Leder dumpf, Glas für Tränke. |
| 3 | Platz blitzt | Platzrahmen leuchtet kurz in Raritätsfarbe. |
| 4 | Verbrauch zerfällt | Trank/Brot schrumpft und verschwindet. |
| 5 | Zustandsbalken läuft | Nach Reparatur füllt sich `.cond` sichtbar. |
| 6 | Neu-Funkeln | Neue Teile funkeln einmal. |
| 7 | Figur reagiert | Puppe macht kurze Geste beim Anlegen. |
| 8 | Wackeln bei Fehler | Zelle schüttelt sich bei „Tasche voll“, „Arm ausgefallen“. |
| 9 | Kein Neuaufbau | Gezieltes Aktualisieren statt `refreshModal` (Voraussetzung für 1–8). |
| 10 | Kombination 9 + 1 + 2 + 3 + 4 + 8 | Gezieltes Aktualisieren, Einrasten, Klang, Blitz, Verbrauch, Fehler-Wackeln. |

**Bewertung:** Ohne 9 laufen Animationen ins Leere (Fenster wird neu gebaut). 9 ist der eigentliche Umbau (Signatur-Muster wie `renderHotbar` `hbSig`). 7 hängt an Gesten in `anim.js`. „Reduzierte Bewegung“ (`S.settings.motion`) muss alle Animationen abschalten.
**Wahl:** **10**.

---

## FEATURE IMPACT REPORT (GATE.md §8) — Inventar visuell

**Feature:** Papierpuppe mit Live-Figur, Piktogramm-Filter, Ordnen als Ansicht, einheitliche Tooltips, Ziehen/Klick-Aufnehmen, Vergleichspfeile, Rüstungsübersicht mit Aufschlüsselung, Fenster-Animationen ohne Neuaufbau.

**Betroffene Systeme (Funktionen)**
- UI: `ui.js invUI`, `showDetail`, `itemInfoHTML`, `refreshModal`, `openModal`, `renderHotbar` (Ziehen zur Leiste), `charUI` (Figur, Rüstzeug-Liste), `bodyChart`, `prioCards` (Ziehen-Muster), `settingsUI` (Bewegung).
- Logik über `bind`: `useOrEquip`, `equip`, `unequip`, `dropItem`, `toStash`, `takeFromStash`, `toHotbar`, `armorOf`, `damageOf`, `recalc`, `setOf`, `B.isDisabled`, `S.bond`, `addItem` (Stapel).
- Render: `render.js drawFigureTo`, `SP.humanFrame`, `SP.humanSpec`, `SPEC_KEYS`, Bildcache (`trimCache`).
- Persistenz: `p.inv`, `p.equip`, `S.stash`, `S.settings` (Sortier-/Filterwahl), ggf. Exemplarfelder (`seen`, `lock`, `junk`).
- Koop: `uiHooks.modal`, `coop.js` Gast-Gepäck-Dialog, `hostTrade`.
- Klang: `sfx.js` (`metal`, `ui` vorhanden; Leder/Glas fehlen).

**Bereits vorhanden:** Raster, Zustandsbalken, Raritätsrahmen (Tasche), Detailspalte, `drawFigureTo`, `bodyChart`, Ziehen-Muster (`prioCards`), Signatur-Neuaufbau (`renderHotbar`), Piktogramm-Erzeuger (`icons.js`), Einstellung „reduzierte Bewegung“.

**Fehlende Infrastruktur:** Papierpuppen-Layout (CSS), Indexzuordnung Ansicht ↔ `p.inv`, Lesefunktion `canEquip` (aus `equip` gelöst), Aufschlüsselung von `armorOf`, gezieltes Aktualisieren statt `refreshModal`, Filter-Piktogramme, Vorschau-Figur mit Cache-Drossel.

**OFFENE DESIGNENTSCHEIDUNGEN**
- O-1 **Klick-Verhalten:** Heute legt Klick auf einen Ausrüstungsplatz sofort ab und Klick auf eine Lagerzelle entnimmt sofort. Künftig Klick = ansehen, Ziehen/Knopf = handeln? *Empfehlung:* ja (gleich wie I-2).
- O-2 **Neu-/Sperr-/Müll-Marke am Exemplar** (neues gespeichertes Feld, z. B. `seen`, `lock`, `junk`)? Gesperrte Teile schützen vor Verkauf/Ablegen. *Empfehlung:* `lock` und Neu-Marke ja (nur Darstellung + Schutz), Müll-Marke nur zusammen mit Mehrfachverkauf (shops.md S-3).
- O-3 **Darf „Ordnen“ die Reihenfolge von `p.inv` dauerhaft ändern** oder nur die Anzeige? *Empfehlung:* nur Anzeige; Stapel auffüllen darf Daten ändern.
- O-4 **Ablegen in die Welt per Ziehen aus dem Fenster?** Gefahr, Wertvolles zu verlieren. *Empfehlung:* nein, Ablegen bleibt Knopf.
- O-5 **Questgegenstände eigene Tasche (zählen nicht zur Traglast)?** Regeländerung. *Empfehlung:* nicht in diesem Umbau; nur Filter-Chip „Quest“.
- O-6 **Ab welchem Zustand erscheint das Reparatur-Symbol?** Darstellungsschwelle; im Code gibt es nur die Zustandsfarbe (> 50 % grün). *Empfehlung:* dieselbe 50-%-Grenze wie `.cond`.
- O-7 **Gefährten-Ausrüstung im Inventar** (Reiter je Mitglied, Ziehen auf Gefährten)? Hängt an P22 (Klassenprüfung fehlt). *Empfehlung:* erst nach P22.

**Risiken**
- Indexfehler: Ansicht-Sortierung + Aktionen per Index (`useOrEquip(i)`, `sell(i)`, `dropItem(i)`) → falsches Teil benutzt/verkauft. Probe nötig: sortierte Ansicht, Aktion trifft das gewählte Exemplar.
- `refreshModal` ersetzt das ganze Fenster; Koop-Gast und `uiHooks.modal` erwarten das Muster `openModal(name,arg)` — gezieltes Aktualisieren darf diesen Weg nicht umgehen.
- Bildcache: Vorschau-Figur erzeugt neue Spec-Kombinationen → Speicher; nur mit Drossel und Aufräumen (`trimCache`).
- `canEquip`-Auslösung aus `equip`: Verhaltensgleichheit (Zweiwaffen `DUAL_CLASSES`, Zweihand nimmt Nebenhand, Ketten, ausgefallene Arme) per Probe sichern.
- Alte Spielstände: neue Exemplarfelder fehlen → `undefined` = „nicht gesperrt, schon gesehen“.
- Touch: HTML5-Ziehen läuft auf Touch nicht → Klick-Aufnehmen ist Pflicht.
- Selbsttest: keine Probe liest Inventar-DOM heute; neue Proben in Sandbox ohne Speichern (`S._quiet`).

**Implementierungsplan (Scheiben)**
1. **V-S1 Tooltips + Rarität überall + Rüstungsübersicht** (`ui.js`/`style.css`): items.md I-S1 mitnutzen; Lager/Ausrüstung mit Rahmen, Schild-Symbol + Aufschlüsselung (`armorOf` liefert Teile, Summe gleich — Probe).
2. **V-S2 Papierpuppe + Live-Figur** (= ui_redesign Scheibe 5 Teil 2): Plätze um `drawFigureTo` groß, Leerplatz-Silhouetten (`icons.js`), Zustandsrand; Vorschau beim Überfahren gedrosselt.
3. **V-S3 Gezieltes Aktualisieren + Animationen** (Signatur-Muster), Klang, „reduzierte Bewegung“ beachten.
4. **V-S4 Ziehen/Klick-Aufnehmen + `canEquip`** (nach O-1, O-4), Ziel-Leuchten.
5. **V-S5 Filter + Ordnen + Marken** (nach O-2, O-3), `S.settings.invSort`, `S.settings.invFilter` (fehlertolerant).
Je Scheibe: Debug-Eintrag („Gepäck füllen: je Art und Rarität“), Kodex-Handbuch „Gepäck“, `docs/MECHANIKEN.md` (Sperre, Ordnen, Ziehen).

**STATUS:** TEILWEISE DEFINIERT — V-S1 bis V-S3 baubar (V-S2 laut ui_redesign schon freigegeben); V-S4/V-S5 warten auf O-1 bis O-4.
