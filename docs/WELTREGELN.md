# ROTFALL — Weltregeln

Dieses Dokument beschreibt, wie ROTFALL als **lebende Welt** funktionieren soll. Es ist die gemeinsame Grundlage für alle späteren Systeme, damit Features nicht einzeln und widersprüchlich eingebaut werden. Neue Systeme werden an diesen Regeln gemessen.

**Status-Zeichen:**
- ✅ umgesetzt und getestet
- 🟡 teilweise umgesetzt (was fehlt, steht dabei)
- ⬜ offen oder geplant

Stand: Session 14 (2026-09-28), Selbsttest siehe `SESSION_LOG.md`.

---

## 0. Harte Regeln
Allgemeine Regeln (Tests, Ursache, Budget, Stil): `MASTER_PROMPT.md` §3. Für die Welt gilt zusätzlich:
1. Während einer Kamerafahrt wird nicht gespeichert, und niemand spricht den unsichtbaren Helden an (BUG-119).
2. Große Ereignisse sind Weltzustände, keine Quests: dauerhaft gespeichert, sie ändern Regeln, Orte, NPCs, Gespräche (§10).
3. Jede große Fraktion hat eine eigene visuelle Sprache für Waffen, Rüstungen, Architektur, NPCs, Banner und Effekte (§4).
4. Aktiver Stil ist der klassische, im Code gemalte Stil D; Stil F (Referenz 5) bleibt in den Optionen wählbar.

---

## 1. Aurelion — das Hochreich

**Leitsatz: Aurelion muss nicht nur groß aussehen, sondern wirtschaftlich funktionieren.** Jede Werkstatt, Mine, Farm und Fabrik ist Teil einer Produktionskette. Die Stadt lebt von dem, was sie herstellt, einkauft und verkauft. Fällt ein Glied aus (Krieg, Überfall, Streik, Ratsbeschluss), merkt man es an Preisen, Angebot und Stimmung.

| Anforderung | Status | Stand |
|---|---|---|
| Mit Abstand größte Stadt der Welt | ✅ | Aurelheim ist etwa 8× so groß wie zuvor (~190×136 Kacheln): 13 Bezirke, Mauerring, vier Tore, über 80 Häuser, über 100 Einwohner |
| Große Außenbezirke, fast eigene Städte | 🟡 | Tickmar, Gelenkhall, Kupferhafen, Sankt Serin und Silbergarten sind eigene Orte des Hochreichs. Offen: sichtbar zusammenhängende Vorstädte direkt vor Aurelheim |
| Magitech (Magie + Technik) | ✅ | Magitech-Werkstatt, Automaten, Prothesen, Teleportkreis, Uhrwerk-Orakel; Magitech-Teile als Handelsware mit eigener Kette (Abschnitt 3) |
| Eigene Aurelion-Ränge mit Vorteilen | ✅ | 8 Ränge (siehe Abschnitt 5) mit Preisnachlass, Aufenthaltsrecht, Himmelsfeste und Rat |
| Misstrauen beim Start | ✅ | Ruf −10; Automaten prüfen im Sichtkegel; ohne Schein folgt eine Strafe oder die Ausweisung |
| Pass-System | ✅ | Aufenthaltsschein (3 oder 7 Tage) am Passamt, Dienst bei einem Adelshaus gilt als Aufenthaltsrecht, Bürgerrecht (Ansehen 40, 1000 Gold, ein Fürsprecher-Haus) |
| Schwebende Himmelsfeste | ✅ | Eigene Karte mit Hof, vier Thronen und Gärten |
| Zugang per teurem Teleport oder Quest | ✅ | 1500 Gold oder Bürger- bzw. Ratssiegel, Kamerafahrt „Reise zur Himmelsfeste“; als Angeklagter vor das Magische Gericht |
| Diplomaten und wichtige Personen auf der Insel | 🟡 | Die vier Herrscher (Kaiserin, Ratssprecher, Orakel, Magierkönig) und die Sonnenlegion; bei Ratssitzungen die vier Hausherren. Offen: ständige Gesandte fremder Nationen |
| Deutlich größere Fabriken | 🟡 | Werkhalle in Tickmar (18×9, begehbar und nutzbar), Werkhallen im Industrieviertel. Offen: Großfabrik mit mehreren Hallen, Förderbändern, Schornsteinreihe |
| Große Infrastruktur außerhalb des Kerns | 🟡 | Aquädukt, Kanal, Felder und Mühlen vor der Mauer, Karak-Straße. Offen: Minen, Holzfällerlager und Steinbrüche des Hochreichs |
| Produktionsketten | ✅ | Werkstätten, Feinmechanik und Magitech-Werk verarbeiten Barren und Werkzeug; Nahrung und Barren kommen zusätzlich per Luftschiff (Abschnitt 3) |
| Landwirtschaft, Minen, Schmieden, Holzfäller außerhalb | 🟡 | Felder und Mühlen vorhanden; die anderen offen |
| Luftschiffe | 🟡 | Sichtbar über dem Hochreich (mit Schatten). Offen: Luftschiff-Reisen, Fracht, Landeplätze |
| Aurelionische Waffen- und Rüstungsästhetik | 🟡 | Messing und Gold, Sonnenlegion in goldener Platte, Automaten. Offen: eigenes Set im Stil der Referenz 5 |
| Eigene Magitech-Waffen | ⬜ | Geplant: magische Feuerwaffen der Sonnenlegion, käuflich, mit Energiekernen, nicht übermächtig (Nutzerentscheidung) |
| Öffentliche Gebäude mit Funktion | 🟡 | Heiliges Gericht (Ablass, Klage, Verhandlungen), Markthalle (Händler), Fabrik (Schichtarbeit), Prothesenwerkstatt, Passamt, Kaserne, Hoher Rat. Offen: Bank (Kredite, Lager), Akademie (Lernen), Hospital (Heilung gegen Gold), Badehaus, Post |
| Dynamische Stadt | 🟡 | Tagesabläufe, Mittagsparade der Sonnenlegion, Luftschiffe, Ausrufer mit Ratsbeschlüssen, Flüchtlinge, Intrigen der Häuser. Offen: Markttage, Feste, Streiks, Unruhen |

---

## 2. Welt-Simulation

### 2.1 NPC-Tagesabläufe

| Anforderung | Status | Stand |
|---|---|---|
| Schläft | ✅ | Nachts im eigenen Haus (Nachtplatz im Haus, Test „Bewohner“) |
| Geht zur Arbeit, arbeitet | ✅ | Tagesplan in Blöcken (`planDays`, `dayTarget`); der Arbeitsplatz hängt am Beruf (`spotsOf`); Arbeitsanimation mit Funken oder Staub |
| Arbeitsplatz passt zum Beruf | ✅ | Schmied an der Esse, Bauer auf dem Feld, Händler am Stand, Hallenpersonal in den Gängen, Goblins in der Mine |
| Kauft und verkauft | ✅ | Händler haben Öffnungszeiten (Markt 7–18 Uhr). Bewohner auf dem Markt kaufen einmal am Tag eine Ware; der Vorrat sinkt sofort (`marketBuy`, economy.js zählt es nicht doppelt) |
| Isst | ✅ | Mittag und Abend sind Mahlzeiten (`eatMeal`). Hungert die Stadt, fällt das Essen aus: hungrige Bewohner arbeiten halb und sagen es |
| Besucht die Taverne | ✅ | Abendblock in der Schenke; Schankmagd, Koch und Spielmann |
| Geht nach Hause | ✅ | Abend- und Nachtblock |
| Reist | ✅ | Dazu bis zu 14 Reisende (Wanderer, Hausierer, Pilger, Boten, Spielleute, Arbeitssuchende, Auswanderer) auf Straßenwegen (`SIM.roadPath`), Rast in der Schenke, Nachtlager am Wegrand; fern vom Spieler rücken sie nur auf der Route vor |
| Kann sterben | ✅ | Kämpfe, Überfälle, Scheiterhaufen; Tote bleiben tot, das Haus wird leer oder neu besetzt |

### 2.2 Simulation außerhalb des Spielerbereichs

**Regel:** Die Welt simuliert nicht jeden NPC ständig physisch. Außerhalb der aktiven Zone werden Bevölkerung, Warenproduktion, Karawanen, Reisen, Kämpfe und Wirtschaft **abstrakt** gerechnet. Betritt der Spieler die Region, wird das Ergebnis in den tatsächlichen Spielzustand überführt.

| Baustein | Status | Stand |
|---|---|---|
| Detailstufen der Figuren | ✅ | Nah: volle KI. Mittel (> 520 px): jedes 3. Bild. Fern (> 900 px): nur Versetzen an den Planort. Gegner über 1150 px ruhen |
| Kriege abstrakt | ✅ | Heere und Kriegsknoten (`sim.js`), Schlachten werden abstrakt entschieden und erst in Spielernähe als echte Wellen gespawnt (`materialize`) |
| Karawanen | ✅ | Fahren auch fern vom Spieler, laden und entladen Waren, können überfallen werden |
| Dorfüberfälle | ✅ | Fern vom Spieler nach Stärke entschieden, in der Nähe echt gekämpft |
| Stadtwachstum | ✅ | Wohlstand täglich, gebaute Häuser werden beim Laden wiedererrichtet |
| Bevölkerung (Geburt, Zuzug, Tod) | ✅ | Tote bleiben tot. Hunger oder ein Totenheer drei Tage lang: Bewohner wandern aus (echte Arbeiter fehlen). Arbeitssuchende und Auswanderer ziehen in leere Häuser. Friedliche Städte bekommen Kinder (Einwohnerzahl) |
| Tiere außerhalb | ⬜ | Abschnitt 12 |

---

## 3. Wirtschaftssystem

**Ist-Zustand (Session 13, `src/economy.js`):** Alle 23 Städte und Dörfer haben einen Markt mit 13 Waren. Die Wirtschaft läuft einmal am Tag (`ecoDay`), auch fern vom Spieler.

**Waren:** Weizen, Pökelfleisch, Salz, Tuch, Felle, Stammholz, Holzwaren, behauene Steine, Erz, Eisenbarren, Werkzeug, Waffenkisten, Magitech-Teile.

**Betriebe mit echten Arbeitern:**
- Arbeiter sind die NPCs der Welt, nach Beruf und Heimatort. Wer tot, am Boden oder in der Gruppe des Helden ist, arbeitet nicht. Ohne Arbeiter keine Ware.
- Je Stadt und Gewerbe gibt es einen Betrieb. Schmiede, Stall, Magitech-Werk und Lagerhaus brauchen das passende Gebäude.
- Tagelöhner nehmen die Arbeit ihrer Stadt: Saline in Salzhafen und Nordfurt, Mine in der Eisenfeste, sonst Steinbruch.

**Produktionsketten:**

| Kette | Erzeuger (Beruf) | Ware | Verbraucher | Status |
|---|---|---|---|---|
| Nahrung | Bauern, Mägde, Fischer, Jäger, Ställe | Weizen, Pökelfleisch | alle Köpfe, Adel mehr | ✅ |
| Holz | Holzfäller → Böttcher, Handwerker | Stammholz → Holzwaren | Haushalte, Schmelzen | ✅ |
| Stein | Tagelöhner (Steinbruch) | behauene Steine | Haushalte | ✅ |
| Metall | Goblin-Bergleute, Aschegräber → Kesselflicker, Goblin-Träger | Erz → Eisenbarren | Schmieden, Feinmechanik, Magitech | ✅ |
| Waffen | Schmiede | Werkzeug, Waffenkisten | Soldaten, Kasernen | ✅ |
| Technik | Feinmechaniker, Kybernetiker, Fabrikarbeiter | Werkzeug, Magitech-Teile | Adel, Aurelion | ✅ |
| Textil | Weber | Tuch | Haushalte, Adel | ✅ |
| Transport | Händlerzüge (abstrakt), die sichtbare Karawane Eren–Nordfurt | bewegen Waren | — | ✅ (Luftschiffe nur als Nachschub Aurelions) |

**Regeln:**
- **Preise** je Stadt nach Vorrat und Bedarf: Grundwert × (Ziel ÷ Vorrat), begrenzt auf das 0,4- bis 3-Fache. Aurelion +15 %, besetzte Städte +50 %. Kaufen +12 %, Verkaufen −12 % (✅).
- **Lager:** Jede Stadt fasst je Ware 60 Einheiten, dazu 40 je Lagerhaus, Markthalle oder Kontor, höchstens 400 (✅).
- **Hunger:** Ohne Weizen und Fleisch arbeitet eine Stadt nur halb, Menschen wandern ab (✅). Die Toten von Vharnholm essen nicht.
- **Aurelion** bezieht 90 % seiner Nahrung und Barren für die Werkstätten per Luftschiff von außerhalb der Karte (✅).
- **Händlerzüge:** Täglich bis zu sechs neue Züge (höchstens 16 unterwegs) vom größten Überschuss zur größten Not, gewichtet nach Gewinn und Reisetagen (✅).
- **Überfälle:** Jeder Zug kann unterwegs überfallen werden (6 % Grundrisiko, mehr bei Untotenheeren am Ziel oder Start und bei Karak-Atar). Wachen senken das Risiko (✅).
- **Besatzung und Zerstörung:** Besetzte oder zerstörte Städte produzieren nichts und bekommen keine Züge (✅).
- **Ratsbeschlüsse** wirken auf die Wirtschaft (✅ Zölle ±8 %, Abschaffung der Schuldknechtschaft macht Waren 5 % teurer).

**Spielerseite (Handelskontor, bei Händlern und Kaufleuten, sonst beim Wirt, Vorsteher oder Bauern jeder Stadt):**
- **Handel:** Waren in jeder Stadt kaufen und verkaufen. „Wo ist was billig, wo teuer?“ zeigt die Preise vom letzten Besuch (✅).
- **Eigener Wagen** (250 Gold, 60 Ladungen): Ware laden, Wachen anheuern (20 Gold je Wache), losschicken. Am Ziel verkauft der Fuhrmann alles zum Marktpreis. Unterwegs droht ein Überfall; ab 3 Wachen wird er oft abgewehrt (✅).
- **Betriebe kaufen:** Preis nach Ertrag und Arbeitern. Dem Spieler gehören 35 % des Warenwerts am Tag, abzüglich Lohn. Ausbau bis Stufe 3 (+50 % je Stufe), bis zu 3 angeworbene Arbeiter (✅; angeworbene Arbeiter sind gezählt, nicht als Figuren in der Welt).
- **Lieferaufträge:** Städte mit Mangel schreiben Aufträge aus (höchstens 8, 7 Tage Frist, Lohn 1,6-facher Warenwert, Ruf bei den Händlern +2) (✅).

**Offen:** Luftschiffe als sichtbarer Verkehr; Bauholz und Steine für den Stadtausbau aus dem Markt statt aus dem Vorrat; Überfälle auf Züge als sichtbare Kämpfe, wenn der Spieler in der Nähe ist.

---

## 4. Fraktionen

| Fraktion | Start-Ruf | Stil (visuelle Sprache) | Ränge | Besonderheit | Feinde | Verbündete |
|---|---|---|---|---|---|---|
| **Hochreich Aurelion** | −10 (misstrauisch) | Magitech: Messing, Gold, weißer Stein, Automaten, Luftschiffe | Fremder → Mitglied des Hohen Rates (8) | Pässe, Adelshäuser, Hoher Rat, Himmelsfeste, Schuldknechtschaft | Untote; Kette je nach Ratsbeschluss | Freie Händler |
| **Eiserne Kette (Eisenfeste)** | −20 | brutal und religiös: schwarzes Eisen, Ketten, rote Banner | Treiber → Dunkler Hochpaladin (5) | Tribut, Sklaverei, Feldzüge, Omega-Glaube | Untote, Grubenstämme | — |
| **Omega-Kirche** (Teil der Kette) | wie die Kette; Glaube eigener Wert 0–100 | Altar mit Goldstern, Paladine mit Goldkamm, Scheiterhaufen | über Glaube und Kettenrang | fanatisch, fremdenfeindlich, drei Paladin-Arten, fünf Köpfe | Zweifler, „Fremde“ | Kette |
| **Die Untoten** | −100 | morbide und organisch: Knochen, grünes Glimmen, Leichenhaut | Diener → Kommandant (5) | Städte, Raids mit Rollen, Garmadon | alle Lebenden | — |
| **Die Grubenstämme (Goblins)** | −100 | improvisiert: Schrott, Leder, Knochen | Fremder → Grubenbruder (3) | versklavt bis zum Fall Vargs, danach frei und friedlich | Kette | Befreier |
| **Rooks Bande** | −100 | militärisch und verlumpt: Kapuzen, Halstücher, Beile | Handlanger → Hauptmann (3) | Hinterhalte, Überfälle auf Karawanen | alle Ordnungsmächte | — |
| **Königreich Valen** | 0 | Blau und Silber, Kettenhemd, Spieße | Rekrut → Offizier (5) | Garnisonen, Verteidigung der Dörfer | Untote, Banditen | Orden |
| **Der Orden** | 0 | Elfenbein und Rot, Kreuz, Topfhelm | Novize → Meister (6) | Heiliges gegen Untote | Untote, Paktgebundene | Valen |
| **Freie Händler** | 0 | Braun und Gold, Planwagen | Kunde → Teilhaber (3) | Karawanen, Preise | Banditen | alle Käufer |

**Regel:** Jede große Fraktion hat eine eigene visuelle Sprache für Waffen, Rüstungen, Architektur, NPCs, Banner und Effekte. Umgesetzt sind Farben, Banner und Rüstungsfarben; eigene Architektur haben Aurelion (Monumentalbauten) und die Eisenfeste. Offen sind eigene Sets im Stil der Referenz 5 für jede Fraktion.

**Nationen:** Seevolk ✅ S14 (Gischtinseln, Karte `isle`; Überfahrt Karte `deck`; Clans Salzbund/Sturmklinge, Weißbart); geplant: Nordreich (Eis), Sandfürsten (Ausbau der Wüste).

---

## 5. Ränge

| Mechanik | Status | Stand |
|---|---|---|
| Rangaufstieg | ✅ | Über Ansehen, Taten und Quests (`checkRankUp`, `autoRanks`) |
| Voraussetzungen | ✅ | z. B. Aurelion: Schein → Bürgerrecht (Ansehen 40, 1000 Gold, Fürsprecher) → Rang nach Ansehen → Rat (Rang 6 + Quest) |
| Rangtitel | ✅ | je Fraktion (Tabelle oben) |
| Vorteile | 🟡 | Preisnachlass bis 35 % (Rang und Legende), Wachen grüßen nach Rang, Aurelion: Aufenthalt, Himmelsfeste, Rat. Offen: für alle Fraktionen gleichwertige Vorteile |
| Exklusive Ausrüstung | 🟡 | Kette: Kettenbrecher und Eisenfürst bei der Weihe. Offen: für alle Fraktionen |
| Zugang zu Gebieten | 🟡 | Himmelsfeste (Bürger oder Rat), Eisenfeste-Tore (Kettenrang). Offen: weitere |
| Besondere NPC-Dialoge | ✅ | Gruß nach Rang und Legende, Varg- und Garmadon-Optionen je Rang |
| Besondere Missionen | 🟡 | Ratssitz-Quest, Kettenaufträge, Feldzüge. Offen: je Rang eine Missionsreihe |
| Rangverlust | ✅ | Ansehen ≤ −60 → verstoßen; Garmadons Tod verstößt aus den Rängen der Untoten |
| Legendäre Ränge | ✅ | siehe unten |
| Weltverändernde Ränge | ✅ | Legenden hängen an Weltereignissen |

**Legendäre Ränge** sind keine Ruftitel, sondern **weltweit bekannte, historische Ereignisse**. Sie stehen in der Chronik, und NPCs sprechen darüber:
- **Kettenbrecher der Grubenstämme:** Varg fällt, die Goblins sind frei.
- **Held der Untoten:** als Untoten-Diener die Eisenfeste gebrochen.
- **Königsmörder der Toten:** Garmadon erschlagen.
- **Gottestöter:** Omega erschlagen.
- **Avatar Omegas:** Omega gedient.
- **Hüter des Schlafs:** Omega schlafen gelegt.
- **Stimme im Hohen Rat:** Aufnahme in den Rat.
- **Schild von Valen:** zehn Siedlungen verteidigt.

---

## 6. XP und Stufen

**Regel: Erfahrung gibt es ausschließlich für eigenen Schaden.** ✅
- Beispiel: Ein Gegner hat 1000 LP. Der Spieler verursacht 300 Schaden und bekommt 30 % der XP dieses Gegners. Ein NPC-Kamerad verursacht 700 Schaden; für diesen Anteil gibt es keine XP.
- Kein eigener Schaden, keine XP (`credit`, `xpShares`).
- Gruppenmitglieder erhalten 60 % der Spieler-XP für ihre eigene Stufe.

**Weitere Regeln:**
- Eine Stufe erhöht mehrere Werte: Leben, Ausdauer, Mana, Schaden (+0,35 je Stufe) und Rüstung (+0,25 je Stufe). ✅
- Gegner skalieren nur innerhalb der Stufenspanne ihres Gebiets (`zoneLevel`), nicht unbegrenzt mit dem Spieler. ✅
- **Beweglichkeit und Ausdauer sind getrennt.** ✅
  - Ausdauer: Ausdauervorrat (×4), Regeneration, Kosten des Ausweichens.
  - Beweglichkeit: Weite des Ausweichens, Fernkampfschaden.

---

## 7. Kampf-KI

| Anforderung | Status | Stand |
|---|---|---|
| Fernkämpfer brauchen Sichtlinie | ✅ | `clearLine` vor jedem Schuss |
| Keine Schüsse durch Wände | ✅ | Geschosse mit Teilschritten, prallen an Wänden ab |
| Deckung nutzen | 🟡 | Hinterhalte warten hinter Deckung (`coverNear`). Offen: Deckung im laufenden Kampf |
| Banditen bereiten Hinterhalte vor | ✅ | liegen vor dem Spieler in der Welt, brechen bei Nähe hervor |
| Spieler sieht Angreifer vorher | ✅ | Hinterhalte stehen sichtbar hinter Deckung; Angriffe haben Ansagen (Bögen, Linien, Ringe) |
| Wölfe und Banditen arbeiten nicht zusammen | 🟡 | Sie koordinieren sich nicht, bekämpfen sich aber auch nicht. Offen: Tiere und Banditen feindlich zueinander |
| Tiere zähmen | ✅ | Abschnitt 12 |
| Tote verfolgen nicht weiter | ✅ | Tod und Boden sind endgültig (Test „KI: Boden/Tod ist terminal“) |
| Reaktion auf Alarm | ✅ | Wachen rufen Wachen im Umkreis, Zivilisten fliehen oder holen Hilfe |
| Fernkämpfer positionieren sich | ✅ | halten ~190 px Abstand, wechseln seitlich die Stellung, springen zurück |
| Nahkämpfer schließen die Distanz | ✅ | inklusive Nachsetzen gegen Rückwärtslaufen |
| Flucht | ✅ | angeschlagene Gegner, Zivilisten, Händler |
| Verstärkung rufen | ✅ | Regionalbosse, Wachen, Nekromanten, Garmadon, Omega |

---

## 8. Gefängnis und Sklaverei

### Gefängnis ✅
- **Auslöser:** Kopfgeld, eine Wache stellt dich; oder das Magische Gericht.
- **Wahl:** zahlen, mitkommen oder Widerstand leisten (Kopfgeld +100).
- **Haft:** 10–20 Minuten Spielzeit, je nach Tat.
- **Ausweg:** Kaution, Schloss knacken (Dietrich +30 %) oder Absitzen.
- **Nur in Salzhafen:** Gefangenen-Quest (Rasks Versteck).

### Sklaverei (Schuldknechtschaft) ✅
- **Auslöser:** vom Magischen Gericht verurteilt, von Automaten ohne Geld erwischt, oder von der Kette niedergeschlagen (nur Kettenleute, nicht durch andere Gegner; BUG-115).
- **Status „Versklavt“:** halbes Tempo, keine Waffe (auch nicht anlegbar), eine Schuld in Gold.
- **Wächter:** ein starker Wächter (Wächterautomat oder Kettenhund) folgt tagsüber und steht nachts an der Werkbank.
- **Wege hinaus:**
  - Arbeit an der Werkbank oder in der Fabrik (tilgt Schuld);
  - Freikauf;
  - Schlüssel stehlen, Ketten nachts lockern;
  - Flucht aus der Zone, ungesehen;
  - Befreiung durch Gefährten oder ein befreundetes Haus (Zufall ab Tag 3);
  - Ratsbeschluss „Abschaffen“.
- **Folgen einer Flucht:** Die Waffe bleibt beim Vogt, Ruf −15. Wer gesehen wird, wird zurückgeschleift (Schuld +50).
- **Zurück zum Normalzustand:** Die Schuld ist getilgt oder die Flucht gelingt; der Status wird entfernt.
- Offen: ein Kopfgeld auf entflohene Schuldknechte, damit Aurelion aktiv nach ihnen sucht.

---

## 9. Das Untotenreich (Phase 6)

| Anforderung | Status | Stand |
|---|---|---|
| Viele Gegnerarten mit Rollen | ✅ | 17 Arten, u. a. Skelett, Knochenritter (Schildwall), Knochenschütze, Nekromant (Beschwörer), Seuchenleiche, Wiedergänger, Geist, Schattenwesen, Knochenhund, Aasschwinge (Flieger), Leichenkoloss (Belagerung), Todesritter (Elite), Hauptmann der Toten |
| Dämonen | ✅ | Aschdämon (Glutaura, feuerfest) |
| Untoten-Raids mit Rollen | ✅ | `undeadMix` je Ziel (Stadt, Dorf, Karawane, Militär, Produktion) |
| Belagerungseinheiten | 🟡 | Leichenkoloss. Offen: Knochenrammen, Katapulte der Toten |
| Eigene Architektur | 🟡 | Knochenspitzen, Grüfte, Obelisken, Totenruinen, Garmadons Gruft. Offen: Stadtbild von Vharnholm im neuen Stil |
| Eigene Rüstungen und Waffen | 🟡 | Totenglocke, Knochenspalter, Garmadons Reue. Offen: vollständiges Set |
| Städte | 🟡 | Vharnholm (bewohnt), besetzte Städte. Offen: Ausbau |
| Dungeons | ✅ | Gruft des Toten Königs (drei Ebenen), Nekropole, Tiefhall |
| Knochentor, Vharnholm, Garmadons Gruft | ✅ | vorhanden |
| Reaktionen auf Garmadons Tod | ✅ | Abschnitt 10 |

---

## 10. Weltveränderungen

**Regel:** Große Ereignisse verändern die Welt **dauerhaft**. Sie sind im Spielstand gespeichert, ändern Regeln, Orte, Bewohner und Gespräche und werden mit einer Kamerafahrt gezeigt.

### Varg fällt ✅
- Goblins frei und friedlich, eigene Siedlung.
- Die Kette fällt auf −100; die Eisenfeste geht unter.
- Viel mehr Untotenangriffe auf die Dörfer.
- Flüchtlinge ziehen täglich nach Aurelion; der Hohe Rat entscheidet über sie.
- Neue NPCs: befreite Goblins, Flüchtlinge, Räuber aus Kettenresten.
- Politik: Das Thema „Flüchtlinge“ kommt in den Rat.

### Garmadon fällt ✅
- Jeden Tag wird eine besetzte Stadt frei.
- Die Natur kehrt zurück: Das Land heilt vom Knochentor aus, Asche wird zu Erde, dann zu Gras.
- Heimkehrer ziehen mit ihrem Gepäck nach Osten.
- Vharnholms Schicksal entscheidet der Spieler.
- Die Lebenden feiern dich.
- Offen: neue Siedlungen im geheilten Osten (östliche Expansion, Phase 8).

### Omega erwacht ✅
- Gelingt die Beschwörung: Omega spricht, drei Enden.
- Misslingt sie: globale Katastrophe mit Blutregen überall, Toten, die überall aufstehen, und Dorfüberfällen, bis Omega fällt.

### Ratsbeschlüsse ✅
- Flüchtlinge, Schuldknechtschaft, Vharnholm, Omega-Glaube, Legion und Zölle ändern Welt und Regeln.

---

## 11. Debug-Menü (`Strg+Umschalt+D`)

**Harte Regel:** Automatische Tests verändern nie den echten Spielstand (siehe 0.1).

| Funktion | Status |
|---|---|
| Ganze Welt anzeigen | ✅ |
| Teleport: Stadt, Ort, NPC, Karte/Dungeon, Koordinaten, Auftragsziel, Himmelsinsel, Eisenfeste | ✅ |
| Flug / Noclip, Geschwindigkeit | ✅ |
| Gottmodus (unendlich LP), Heilen, Ausdauer und Mana voll | ✅ |
| XP setzen, Stufe ±1, **Stufe = Zahl** | ✅ |
| Ruf setzen, Rang setzen, Fraktion beitreten | ✅ |
| Gold setzen, Material, Gegenstände (Waffen- und Rüstungs-Dropdown, Seltenheit) | ✅ |
| NPC, Gegner, Tier spawnen | ✅ |
| Zur Karawane springen, Karawanenüberfall | ✅ |
| Karawane neu spawnen | ⬜ |
| Raid starten (Untotenangriff), Stadtverteidigung, Hinterhalt (Banditenüberfall) | ✅ |
| Gefängnis, Sklaverei (Aurelion, Kette), Fahndung, Magisches Gericht | ✅ |
| Fraktionskrieg (Kriegsrunde), Feldzug der Kette | ✅ |
| **Varg-Tod, Garmadon-Tod** | ✅ |
| Omega-Ereignis (Spur voll, Ritual im Zorn) | ✅ |
| **Zeit vorspulen** (+6 Stunden, +1 Tag), Tageszeit, Wetter | ✅ |
| Selbsttest, Spieler töten | ✅ |

---

## 12. Tiere

| Anforderung | Status |
|---|---|
| Wildtiere (Wolf, Bär, Wildschwein, Hirsch, Wilder Hund), Rudel, Jagd, Flucht, Revier | ✅ |
| Zähmen (Futter, Geduld), Tierbegleiter (ein Platz extra), Tierhändler | ✅ |
| Reittiere: Pferd, Messingross (Automatenkern), Totenross; Kampf vom Pferd | ✅ |
| Nutztiere (Kühe, Schafe) auf den Höfen, Viehdiebstahl | ✅ |
| Nutztiere in den Wirtschaftszahlen, eigener Hof des Spielers | ✅ S14 (Herde je Stadt, Weide mit Stall) |
| Jungtiere; Bestände und Wanderung außerhalb der aktiven Region | ⬜ |

---

## 13. Leistung (BUG-108)

- **Ziel:** Spiellogik ≤ 3 ms und Zeichnen ≤ 2 ms je Bild.
- **Aktueller Zustand** (gemessen im versteckten, gedrosselten Browserfenster):
  - Wildnis 3,7 ms;
  - Aurelheim 4,4 ms;
  - Eren und Nordfurt ~6 ms;
  - Zeichnen 2,0–2,4 ms.
  - Frühere Werte lagen bei 5–8 ms; nach der Metropole waren es kurz 17–23 ms, das ist behoben.
- **Reproduzierbar:** Den Spieler auf den Platz von Eren oder Nordfurt stellen und `RF.tick(…)` mit Zeitmessung laufen lassen.
- **Profil und wahrscheinlichste Systeme:**
  1. Tagesplan und Bewegung der Bewohner in Städten (`updateNpc`, `seek`, `findPath`);
  2. Abstandssystem (`separate`) bei vielen Figuren;
  3. Kampfuhren (`tickCombatant`) aller Figuren im Umkreis;
  4. Suchen über alle Einträge der Welt (`S.ents.world.filter`) in Tick-Funktionen (Glaube, Wachstum, Aurelion).
- **Schon gebaut:** Cache der Handelnden (`actorsOf`), Detailstufen, gedrosseltes Fernversetzen, Kampfuhren nur in der Nähe.
- **Nächste Untersuchung:**
  1. im sichtbaren Fenster messen;
  2. je System einzeln messen (Zeitstempel je Funktion);
  3. Stadtbewohner außerhalb 520 px vollständig in die abstrakte Simulation überführen;
  4. räumliches Raster für die Suche nach Nachbarn;
  5. `filter` über die ganze Welt in stündliche Listen verlegen.
- **Risiko:** Mit Wirtschaft, mehr NPCs, Tieren und weiteren Nationen steigt die Last. Die abstrakte Simulation (2.2) ist die wichtigste Gegenmaßnahme.

---

## 14. Spielstand und Persistenz

**Dauerhaft gespeichert:**
- Spieler: Stufe, XP, Werte, Skill-Baum, Titel, Inventar, Ausrüstung mit Zustand, Körperteile und Prothesen, Status.
- Ruf, Ränge, Legenden, Beziehungen zu NPCs, Gunst der Adelshäuser, Beziehungen im Rat, Glaube.
- Fraktionszustände, Kriegsknoten (Besitzer, Garnison), Heere.
- Tote NPCs (sie bleiben tot), Bewohner, Gefährten.
- Zerstörte und verfallene Häuser (Kriegsschäden), dem Erdboden gleichgemachte Dörfer, befreite Gebiete, geheiltes Land (Radius).
- Weltereignisse (Varg, Garmadon, Omega, Ketzerjagden, Kreuzzüge), Chronik.
- Karawanen, Wirtschaft (Bestände, Preise), Tribut.
- Politische Entscheidungen (`S.laws`), gewachsene Häuser (`S.growth`), Aufträge und Questfortschritt.
- Einstellungen (Grafikstil, Ton, Textgröße).

**Geschickt gespeichert:**
- Die Welt wird bei jedem Laden aus dem Seed neu erzeugt. Gespeichert werden nur Abweichungen: veränderte oder entfernte Objekte und gewachsene Häuser.

**Nicht gespeichert:**
- Effekte, Geschosse, Debug-Schalter.
- Flüchtige Figuren (Raid-Untote, Beschwörungen, Paraden, Ratsherren bei Sitzungen).
- Test- und Sandbox-Daten.
- Der Zustand während einer Kamerafahrt (während einer Fahrt wird gar nicht gespeichert).

---

## 15. Offene Aufgaben (aus der ursprünglichen Liste)

- [ ] Gesichter deutlich detaillierter (im neuen Stil über neue Figurenblätter)
- [ ] Charakter im Startbildschirm korrekt von vorn
- [ ] Bogenhaltung final korrigieren
- [ ] alle Waffenanimationen überprüfen (im neuen Stil: Figuren mit Waffe im Bild, Schwungbogen)
- [ ] NPC-Dialogvielfalt weiter erhöhen
- [x] Händler nur während ihrer Arbeitszeit im Laden
- [ ] Karawanen vollständig an den Aurelion-Stil anpassen
- [ ] Fabriken deutlich größer
- [ ] Kettenfeste/Eisenfeste deutlich größer
- [x] mehr Wachen (Paladine, Streifen, Inquisitoren)
- [x] mehr Goblins (Arbeiter an jedem Werkplatz)
- [ ] größere Tavernen
- [x] alle größeren Dörfer mit Verteidigungsmeister
- [x] Questboards überall korrekt vorhanden
- [x] mehr Untoten-Gegner
- [x] Garmadon-Dungeon vollständig
- [x] Schwebende Insel Aurelions (Hof, Gericht, Rat)
- [x] Aurelion-Ränge vollständig
- [ ] Fraktionsränge für alle großen Nationen mit gleichwertigen Vorteilen
- [ ] besondere Fraktionsmechaniken für alle Fraktionen definieren
- [x] Tiere (Abschnitt 12; offen: Hof, Nutztiere in der Wirtschaft)
- [x] Wirtschaft und Produktionsketten (Abschnitt 3)
- [ ] Magitech-Waffen
- [ ] Performance BUG-108, BUG-093
- [ ] Karawanen-Test BUG-111
- [ ] Blutungstode der Wachen BUG-113
- [ ] Seevolk, Nordreich, Sandfürsten
- [ ] Gebäude, Boden und Objekte im Stil der Referenz 5 (neue Vorlagen nötig, siehe `docs/PROMPTS_GRAFIK.md`)
