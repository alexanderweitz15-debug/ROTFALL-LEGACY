# Geheime Orte und lebendige Umgebung

**Status:** PROPOSED → wartet auf die 3 Fragen (§8). **Autor:** Designer (Opus) · **Stand:** 01.10.2026
**Bezug:** `docs/PLAN_ROADMAP.md` §5e.3 (5–8 geheime handgebaute Orte), §5e.9/§5d.9 (Seevolk: weitere Inseln offen), §5f (Umgebung: Fahnen, Rauch, Wasser, Vogelschwärme), §5g.14 (Seevolk-Ränge 2 und 4), §5g.35 (Orte beleben), §5g.38 (zweite Gischtinsel).
Kennzeichnung: **FAKT** (Datei:Zeile, per grep geprüft; `game.js` wird parallel bearbeitet, Zeilen dort können um ~100 wandern — Funktionsnamen gelten), **VORSCHLAG**, **ANNAHME** (nicht im Spiel geprüft). Kein Spielcode geändert.

---

## 1. Bestand: was es schon gibt und was dünn ist

| Befund | Beleg | Folge |
|---|---|---|
| 56 feste Orte plus Dörfer und Aurelion-Städte in `LOCATIONS`, alle mit festen Koordinaten | `world.js:20–57`, weitere ab `world.js:543` (`steinbruch`, `seelenhuegel` 554, `sandruinen` 561) | Gute Anker für neue Orte: „Ort + Versatz“ statt Zufall |
| Streuorte (`poi`, ~1 je 52×52-Zelle) entstehen aus Hash `nz`, ohne `rnd()`, und werden bei jedem `genWorld` neu erzeugt | `world.js:848`, `1619–1648`, `nz` `world.js:187` | Muster „Hash statt rnd“ existiert; Streuorte nur auf **zu Fuß erreichbarem** Land (`reach`, `world.js:1621`) |
| 8 Gewölbe: 5 sichtbare, 3 **geheime** (Schmugglergrotte, Sternkammer, Wurzelhalle), dazu der Schlund | `game.js:9905–9927` | Geheim heißt heute nur: „Karte im Hort des vorigen Gewölbes“ (`game.js:10009–10010`). **Ein einziger Findeweg**, immer eine Höhle mit Raumgraph |
| Gewölbe-Eingänge setzt `ensureVaultSites` nach der Generierung an `LOCATION + dx/dy` | `game.js:9935–9942` | Vorbild für geheime Orte. **Aber:** `freeSpotNear` zieht `ri()` (`world.js:2394–2401`) und verschiebt damit die geteilte Zufallsfolge zur Laufzeit |
| Gerüchte mit Zielen: Schatzkiste, Bestie, Deserteur 28–60 Felder vor dem Ort, flüchtig gesetzt | `game.js:11798–11830` | Schatzsuche existiert, ist aber **beliebig** (zufällige Lage, Kiste aus kleiner Liste) — kein Ort mit Geschichte |
| Geheimkammer hinter Gewölbewand nach Wahrnehmung, Hebeltür, Druckplatte | `docs/MECHANIKEN.md:539–541` | Rätsel-Bausteine gibt es nur **unter Tage** |
| Gischtinseln: eine Karte `isle` (Tangkron); Überfahrt, eigenes Schiff mit drei Kursen (Küste, Handelsroute, Wrackfeld) | `world.js:2100–2154`, `game.js:7246–7252` | Kein Kurs führt zu einem **Ziel**; „weitere Inseln offen“ (Roadmap §5d.9) |
| 26 Südinseln und Riffe in der Weltkarte, aus `nz` (seed-unabhängig), **nie betretbar** und leer | `world.js:1300–1307` | Fertiges Gelände ohne Inhalt — ideal für ein Inselziel |
| Nebelinsel: nur `kind:'wild'`, Szenen „drowned/shrine“, Nebelsteg seit BUG-079; in `game.js` **kein einziger Treffer** | `world.js:56`, `270`, `1166–1168` | Dünnster benannter Ort der Welt |
| Sandruinen (Wüstensporn): nur Säulen-Deko | `world.js:561`, `1331` | Dünn |
| Seelenhügel, Hundertfeld: Ruine mit Spawns | `world.js:554`, `world.js:55` | Dünn, aber thematisch stark (Seelen, alte Schlacht) |
| Ahnen: Gräber mit Erbstücken und Epilog | `game.js:14052–14079`, `S.legacy.ancestors` | Ahnen wirken nur am eigenen Grab — kein Ort der Welt „kennt“ sie |
| Seelenbrunnen am Aschensee (Ritual 1×/Tag) | `world.js:2021`, `game.js:11979` | Vorbild für Ort mit Ritual |
| Atlas zeichnet **jedes** `LOCATIONS`-Symbol (nur der Nebel deckt es), Namen erst nach Besuch | `atlas.js:151–171`, `178–179` | Ein geheimer Ort darf erst **nach** dem Fund in `LOCATIONS` stehen |
| Besuch markiert `S.flags.seen[key]` und gibt die Gefahrenansage | `game.js:2435–2436` | Fund-Erkennung gratis, sobald der Ort in `LOCATIONS` ist |

**Dünn ist:** (1) Geheimes gibt es nur als Höhle mit Karte aus dem vorigen Hort; (2) kein Fund über **Umgebung** (Licht, Klang, Wetter, Blickrichtung); (3) das Meer hat kein Ziel; (4) Nebelinsel, Sandruinen, Seelenhügel, Hundertfeld sind leere Namen; (5) geheime Orte berühren keine Großsysteme (Krieg, Seelen, Ahnen, Seevolk-Ränge).

---

## 2. Acht geheime Orte (VORSCHLAG)

Gemeinsame Regeln:
- **Kein Ort auf der Karte vor dem Fund.** Erst der Fund trägt ihn in `LOCATIONS` ein (Symbol, Name, Chronik, Toast „GEHEIMNIS: …“).
- **Immer zwei Findewege:** ein Wissensweg (Gerücht, Buch, Gefährte) und ein Umgebungsweg (sehen, hören, Wetter). Wer aufmerksam spielt, braucht kein Gerücht.
- **Belohnung nach `docs/BALANCE_GUIDE.md`:** Hort nach Gebietsstufe (`ZONE`, `game.js:1803`); keine Mythischen; eine Sonderbelohnung je Ort ist ein **Tausch** oder eine **Wahl** mit Folge, nicht nur „+X“.
- Kämpfe nur mit vorhandenen Gegnertypen; Wächter mit Namen über `ELITES`-Mechanik (Gefahr ≤ 4, schwere Angriffe mit Ansage).

### 2.1 Der Ausbrecherstollen — Westen (Eisenmark, Kette)
- **Lage:** Anker `steinbruch` (`world.js:543`), Versatz etwa 20 Felder nach Westen in den Fels des Westgebirges. Ein enger Spalt, von Geröll verdeckt.
- **Finden:**
  - *Umgebung:* Drei Kreidezeichen (ein durchgestrichenes Kettenglied) an Felsen zwischen Steinbruch und Spalt, als Schild-Prop. Lesbar ab Wahrnehmung 12 oder wenn ein Goblin in der Gruppe ist („Das ist unser Zeichen. Da lang.“). Jedes Zeichen zeigt die Richtung zum nächsten.
  - *Wissen:* Grisk (Grubenhort) oder Dodon (Morrgrund, Freund) erzählt einmal von „dem Loch, durch das Vierzehn entkamen“.
- **Inhalt:** Gewölbe mit 1 Ebene (vorhandenes `buildVault`, Stufe 3, Pool Kettenwachen + Grubenratten), am Ende das Fluchtlager der Toten: Knochen in Fesseln, Vorräte, ein Plan.
- **Belohnung:** Hort Stufe 3 (`vaultLoot(3)`, Wert 120–400) plus **„Grubenplan der Eisenfeste“** (Questgegenstand). Wahl:
  - *Behalten:* Beim Goblinsturm (`goblinStorm`) oder einem eigenen Angriff auf die Feste öffnet der Plan einen Seitengang in die Kernburg (2 Rotgardisten weniger am Tor zu Varg). Goblins/Morrgrund +10.
  - *An die Kette verkaufen:* 150 Gold, Kette +8; der Stollen wird zugemauert, Morrgrund −20 (Goblins vergessen nicht, Log sagt es vorher).
- **Systeme:** Kette, Goblins, Pakt des Sturms, Ruf.
- **Stufe:** 8–15 (Eisenmark, Gefahr 3).

### 2.2 Das Glockenmoor — Mitte (Menschenland, Orden)
- **Lage:** Anker `marsh` (Moorland, `world.js:26`), mitten im Sumpf: drei schiefe Glockenpfähle im Wasser.
- **Finden:**
  - *Umgebung:* Nachts bei Nebel oder Regen ertönt im Umkreis von 40 Feldern ein gedämpfter Glockenschlag (vorhandener Klang `bell`, `sfx.js:53`, leise, alle ~40 s). Log einmalig: „Irgendwo im Moor schlägt eine Glocke. Es gibt dort keine Kirche.“
  - *Wissen:* Das Kirchenbuch in Lichtenrain (Orden-Dorf) nennt die versunkene Kapelle von Moorbach und den Vers „Erst die Taufe, dann die Hochzeit, zuletzt der Tod“.
- **Rätsel:** Die Pfähle heißen Taufe, Hochzeit, Tod (Schild-Text). Richtige Reihenfolge läuten → das Wasser weicht, ein Pfad aus Erde führt zur Kapellenruine (Kacheln werden zu `DIRT`). Falsche Reihenfolge → drei Ertrunkene (Zombies, flüchtig) steigen auf; nach Sieg neuer Versuch.
- **Belohnung:** „Glocke von Moorbach“ (Talisman, selten: +3 Rüstung gegen Untote, Wert 260) und Truhe Stufe 2. Orden +5. An der Kapellenwand ein **altes Blutzeichen**: Log erklärt, dass der Kult älter ist als das Königshaus (nur Lore, **kein** zweiter Beweis gegen Aldhelm — RB-031 bleibt die einzige Enthüllung).
- **Systeme:** Orden, Blutkult (Spur), Wetter.
- **Stufe:** 3–10.

### 2.3 Die Verlorenen Hundert — Mitte/Grenze (Krieg)
- **Lage:** Anker `hundertfeld` (`world.js:55`), unter einem eingestürzten Hügel am Rand des Schlachtfelds: das verschüttete Heerlager.
- **Finden:**
  - *Wissen:* Ein Deserteur aus einem Gerücht (`rumorChoices`, `game.js:11832`) sagt beim Verschonen: „Auf dem Hundertfeld liegt das Lager, das sie nie geräumt haben. Unter dem Hügel mit der Lanze.“ Alternativ ein Veteran in der Schenke von Varonheim.
  - *Umgebung:* Eine einzelne Lanze mit Valen-Wimpel steckt auf einem Hügel (Prop). Daneben Spaten-Prop: E = „Graben“ (1 Stunde, `passTime`).
- **Inhalt:** Zwei Kammern, Knochenwächter (Skelette, Stufe Gebiet), Feldherrenzelt mit Brief.
- **Belohnung:** **Kriegsvorrat** (abstrakt, kein Inventar): Wahl, wem er geht:
  - Valen-Garnison der nächsten Stadt: +8 Besatzung (Maßstab: Ersatzwachen +4 je Mann, DECISIONS „Bedrohung gesamt“), Valen +5.
  - Kette oder Bande: 300 Gold, Ruf dort +5, Valen −5.
  - Eigene Siedlung: +20 Eisen, +10 Holz.
  - Dazu Truhe Stufe 3 (eine gewöhnliche bis ungewöhnliche Waffe).
- **Systeme:** Krieg (`sim.js`-Besatzung), Siedlung, Deserteure.
- **Stufe:** 12–20.

### 2.4 Die Werkstatt des Ersten Uhrmachers — Süden (Aurelion)
- **Lage:** Hinter der Hecke eines verlassenen Adelssitzes östlich von Gelenkhall (Anker `gelenkhall` aus `AUREL_CITIES`, Versatz ~35 Felder).
- **Finden:**
  - *Umgebung (Kern-Idee):* Jeder ruhende Automat (`automat_frame` in Streuorten, `world.js:1665–1667`) bekommt im Label die Blickrichtung: „Sein Kopf ist nach Südosten gedreht.“ Die Richtung zeigt immer auf die Werkstatt (rein aus Koordinaten berechnet). Wer zwei Automaten liest, kann den Ort anpeilen.
  - *Wissen:* Ein Feinmechaniker in Tickmar spricht vom „Meister, der als Erster einem Messingmann das Schauen beibrachte“.
- **Rätsel:** Die Tür hat ein Zifferblatt. Inschrift: „Öffne, wenn die Zeiger einander decken und kein Schatten fällt.“ → Die Tür geht nur um **Mittag** (11:30–12:30 Spielzeit) auf. Davor: Hinweis „Das Uhrwerk wartet.“
- **Inhalt:** Werkstatt, der unfertige „Erste Automat“ als Wächter (Gefahr 4, `automat`-Basis, Ansage 600 ms, Stufe Gebiet + 2).
- **Belohnung:** Bauplan **„Uhrmacherhand“** (Prothese Stufe 3 beim Kybernetiker): Handwerksqualität +1 Stufe, aber −10 % Nahkampfschaden mit dieser Hand und Energiezelle alle 3 Tage (wie T15/V10). Aurelion +5. Truhe Stufe 4 (Wert 200–700).
- **Systeme:** Bionik (Tausch, nicht besser), Aurelion-Ruf, Handwerk.
- **Stufe:** 12–20.

### 2.5 Der Brunnen der Durstigen — Süden (Wüstensporn)
- **Lage:** Anker `sandruinen` (`world.js:561`): eine Treppe unter den Säulen, sonst von Sand bedeckt.
- **Finden:**
  - *Umgebung (Wetter):* Nur **nach einem Sandsturm** liegt die Treppe für einen Tag frei. Endet ein Sandsturm, während der Spieler im Wüstensporn ist, sagt das Log: „Der Sturm hat bei den Sandruinen etwas freigelegt.“ Haken: Wetterwechsel `game.js:2372`.
  - *Wissen:* Ein Wasserhändler in Karak-Atar erzählt die Legende der Karawane, die den Brunnen fand und nie zurückkam.
- **Inhalt:** Versunkene Karawanserei mit Zisterne; Skelette und Wüstenräuber, die ebenfalls gegraben haben.
- **Belohnung:** **Wasserrecht der Sandfürsten** (Urkunde): Bringt man sie nach Karak-Atar, dauerhaft Karak +10 und Wegzoll entfällt; verkauft man sie an die Wüstenräuber, 250 Gold und Karak −10. Truhe mit einer Wüsten-Volkswaffe (Wert 190–300).
- **Systeme:** Wetter mit Wirkung, Karak-Atar, Wegzoll.
- **Stufe:** 10–18.

### 2.6 Die Kammer der Namen — Osten (Totenland)
- **Lage:** Anker `seelenhuegel` (`world.js:554`), ein Ossarium unter dem Hügel.
- **Finden:**
  - *Umgebung:* Trägt man eine Seelenphiole, „summt“ sie im Umkreis von 25 Feldern (Log, einmal je Besuch). Totenrufer und Geweihte des Todes sehen nachts zwei Seelenlichter, die zur Tür ziehen (Effekt, nur für sie).
  - *Wissen:* Sael in Vharnholm: „Unter dem Seelenhügel schreibt jemand die Namen. Alle. Auch deinen.“
- **Inhalt:** Wände voller Namen. Die **Ahnen des Spielers** stehen dort mit Todesort (aus `S.legacy.ancestors`), dazu der eigene Name, halb geschrieben (Omen, Log).
- **Belohnung, Wahl (einmal):**
  - *Ahnen auslöschen (sie ruhen):* je ausgelöschtem Ahn +1 Willenskraft, höchstens +3. Tote −5.
  - *Seelen ernten:* 20 Seelen für Morvath (T23: Heerzug kostet 40). Tote +10, aber die Bedrohung wächst schneller. Der Text warnt deutlich davor.
  - *Nichts anrühren:* nur Chronik-Eintrag.
  - Dazu ein Hort Stufe 4 (Wert 200–700).
- **Systeme:** Ahnen/Dynastie, T23-Seelen, Tote, Bedrohung.
- **Stufe:** 20–30 (Totenland, Gefahr 4).

### 2.7 Das Leuchtfeuer der Nebelinsel — Westküste (Meer)
- **Lage:** Anker `mistisle` (`world.js:56`), Nordspitze: eine eingestürzte Leuchtturmruine (Prop `tower_ruin`).
- **Finden:**
  - *Umgebung:* Nachts bei Nebel zeigt sich vom Nebelsteg (`world.js:1168`) aus ein grünes Licht auf der Insel (Lichtquelle in `drawLight`, nur bei Nebel und Nacht).
  - *Wissen:* Fischer in Salzhafen: „Auf der Nebelinsel brennt manchmal Licht. Seit dreißig Jahren ist da keiner mehr.“
- **Inhalt:** Der Geist des Wärters Hanno (flüchtiger NPC, nur nachts) bittet, das Feuer zu entzünden: 3 Holz + 1 Ölfass/Lampenöl.
- **Belohnung:** Hannos **Fernrohr** (ungewöhnlich, Wert 180: Kartennebel-Radius +20 %, kein Kampfwert). In der nächsten Nebelnacht legt am Steg das **Geisterschiff** an: einmalige Überfahrt zur Walknocheninsel (2.8) ohne eigenes Schiff.
- **Systeme:** Wetter (Nebel), Tageszeit, Seefahrt, Atlas-Nebel.
- **Stufe:** 5–12.

### 2.8 Die Walknocheninsel — Weißbarts erstes Versteck (Meer, Südinseln)
- **Lage:** Die größte der 26 Südinseln westlich von x = 1100 (aus `world.js:1300–1307`; seed-unabhängig, also in jeder Welt dieselbe Insel). Heute unerreichbar.
- **Finden:**
  - *Wissen/Gegenstand:* **Seekarte** aus der Wrackfeld-Bergung (15 % je Bergung, höchstens einmal), aus dem Geisterschiff (2.7) oder von Weißbart bei hohem Vertrauen.
  - *Weg:* Eigenes Schiff bekommt einen vierten Kurs „Zum Kartenpunkt“ (Deck-Reise wie Wrackfeld, dann Anlanden am Inselstrand).
- **Inhalt:** Walskelett als Hütte, zwei Fallgruben (vorhandene Mechanik), drei bis fünf Sturmklingen-Wachen (Stufe Gebiet), Weißbarts Beutekiste.
- **Belohnung:** Hort episch (Wert 320–1000) und 300–600 Gold. Wahl:
  - *Dem Salzbund melden:* Salzbund-Ruf +15 → Rang-Prüfung für Seevolk-Rang 2 (§5g.14).
  - *Der Sturmklinge zurückgeben:* Sturmklinge +15 → Rang-Prüfung für Rang 4 („Wer Weißbarts Gold zurückbringt, ist einer von uns“).
  - *Behalten:* beide −10.
- **Systeme:** Seefahrt, Seevolk-Ränge, Piraterie, §5g.38 (zweites Inselziel).
- **Stufe:** 15–25.

**Verteilung:** Westen 1, Mitte 2, Süden 2, Osten 1, Meer 2. Stufen von 3 bis 30, damit jede Spielphase ein Geheimnis hat.

---

## 3. Platzierung ohne Verschiebung der Welt (VORSCHLAG)

**Regel:** In `genWorld` wird nichts hinzugefügt, und kein neuer Aufruf von `rnd()`, `ri()`, `chance()`, `pick()` oder `freeSpotNear` kommt dazu. Das gilt auch zur Laufzeit beim Setzen, weil `ri()` dieselbe Folge nutzt und Proben kippt.

1. **Tabelle `SECRETS`** (game.js neben `VAULTS`): `{ key, name, at: '<LOCATION-Schlüssel>', dx, dy, stufe, find: [...], … }`. Die Lage ist **Anker + fester Versatz**. Die Anker sind feste Koordinaten (`LOCATIONS`, `AUREL_CITIES`), also ist der Ort in jeder Welt an derselben Stelle relativ zur Landschaft.
2. **`ensureSecrets()`**, flüchtig und idempotent, aufgerufen in `newGame()` **und** `continueGame()` neben `ensureVaultSites()` (`game.js:7998`).
   - Setzt Props mit `transient: true, secret: key` (Zeichen, Pfähle, Lanze, Eingang).
   - Sucht den freien Platz mit einer neuen **deterministischen Spiralsuche** `detSpot(map, tx, ty)`: Ring für Ring, erste Kachel mit `openSpot`. Kein `ri()`.
   - Kacheländerungen (Moorpfad, Sandtreppe) nur hier und nur einmal je Laden; `setTile` erhöht `m.ver` und backt alle Chunks der Karte neu (`world.js:78–83`, `render.js:243`). Deshalb alle Kacheln eines Orts in einem Durchgang setzen, nie pro Frame.
3. **Insel 2.8:** world.js exportiert die schon berechnete Inselliste der Südinseln als reine Daten (`SOUTH_ISLES`, aus `nz`, ohne `rnd`). Alternativ einmal ausmessen und als Konstante eintragen, denn `nz` hängt nicht vom Seed ab (`world.js:187`).
4. **Speichern:** nur `S.secrets = { key: { found: Tag, state, choice } }`. Fehlt das Feld (alter Stand), ist nichts gefunden. Keine Props im Spielstand.
5. **Karte:** Nach dem Fund schiebt `ensureSecrets` den Ort mit `secret: true` in `LOCATIONS` (mit Dublettenprüfung). `genWorld` entfernt `secret`-Einträge wie heute die Streuorte (`world.js:848`: `poi || secret`; eine Bedingung, kein `rnd`). So stehen sie nie unter dem Nebel auf der Karte (`atlas.js:151`), bevor man sie kennt.
6. **Nicht nachmachen:** `genIsle` setzt die geteilte Folge neu (`seedRng(S.seed * 29 + 5)`, `world.js:2102`). Gewölbe nutzen dagegen einen **eigenen** Generator (`vaultRng` direkt nach `VAULTS`). Innenräume geheimer Orte bauen wir wie Gewölbe: als flüchtige Karte mit `vaultRng`.
7. **Gerüchte zu Geheimorten** werden **fest** vergeben (bestimmte Person, einmal), nicht über `rumorOffer` mit `chance(0.35)`.

---

## 4. Umgebungsanimationen

### 4.1 Was es schon gibt (FAKT)
| Art | Wo | Wie |
|---|---|---|
| Wasser | `render.js:91`, `726–730` | Wellenlinie je innerer Wasserkachel, jeden Frame |
| Vogelschwarm | `render.js:2711–2717` | 6 V-Vögel ziehen am Tag durchs Bild, nicht in Aurelion/Totenland/Dungeons |
| Luftschiffe mit Rauch | `render.js:2692–2730` | fest auf Weltbahnen |
| Schornsteinrauch | `render.js:865–872`, Prop `chimney` | 4 Pixelwölkchen je Haus |
| Hausbrand | `render.js:2743` (`drawFires`) | Flammen, Rauchsäule |
| Fackel, Lagerfeuer, Kerzen, Esse | `render.js:974` (`PROP_PERIOD`), `1463–1476` | gecachte Phasen, Flackern; Licht in `render.js:2631` |
| Banner | `PROP_PERIOD` `banner_pole`/`banner_torn` 5030 ms | weht |
| Regionspartikel | `render.js:196–208`, `2795–2802` | Asche/Schnee fallen, Glut steigt, Staub treibt; Wald: braune Partikel **ohne** Fallbewegung |
| Wetter | `render.js:2759` (`drawWeather`) | Regen, Blutregen, Sandsturm, Schnee, Nebel |
| Glühwürmchen, fallendes Laub | nur Titelbild (`render.js:3105`, `3114`) | in der Welt fehlt beides |

### 4.2 Neue Animationen (VORSCHLAG, Reihenfolge = Nutzen je Aufwand)
1. **Lagerfeuer-Rauch und Funken:** `campfire_static` raucht heute nicht (`render.js:1463`). 3 Wölkchen wie beim Schornstein, dazu 1–2 aufsteigende Funken. Nur Feuer im Bild, höchstens 8.
2. **Fallendes Laub:** im Wald und in der Grünmark Blätter mit Seitenschwung (Sinus) statt stehender Partikel; Herbstfarben aus `LEAF.autumn`. Umsetzung im Wesentlichen `fall: 1` plus Schwung im vorhandenen Partikelweg.
3. **Glühwürmchen:** nachts (21–4 Uhr) im Moor, im Wald und in Morrgrund; 16–24 Punkte mit 2 px, blinkend. Ein Hinweis-Bonus: Am Glockenmoor ziehen sie zu den Pfählen.
4. **Krähen auf Feldern und Schlachtfeldern:** sitzen auf `FIELD`-Kacheln und bei `bones`/`blood`-Props und flattern auf, wenn der Spieler näher als 90 px kommt. Lage aus Kachel-Hash (an der Welt verankert); höchstens 8 im Bild. Keine Figuren und nichts im Spielstand.
5. **Küste lebt:** Gischt-Pixel auf Wasserkacheln neben Land (im vorhandenen Wasser-Durchlauf, jede zweite Kachel); selten ein Fischsprung (höchstens einer gleichzeitig); Möwen statt Krähen an der Küste und in Tangkron.
6. **Fledermäuse:** nachts im Totenland und vor Höhlen-/Gewölbeeingängen (`mine_entrance`), 3–5, zackiger Flug.
7. **Fliegen über Leichen:** über toten Gegnern und `blood`-Props kleine kreisende Punkte; höchstens 4 Schwärme zu je 4.
8. **Morgennebel über Wasser und Moor** (5–8 Uhr): wenige große, halb durchsichtige Schwaden, die langsam treiben; höchstens 6 Rechtecke.

**Nicht empfohlen:** wiegendes Gras oder Bäume. Boden und Bäume liegen in gebackenen Chunks (`render.js:84–87`); Animation hieße, jeden Frame neu zu backen.

### 4.3 Leistungsgrenzen (VORSCHLAG, verbindlich für den Artist)
- **Nur Bildschirm-Kosmetik:** keine Figuren, kein Feld in `S`, nichts im Spielstand, keine Koop-Übertragung (jeder Rechner zeichnet selbst).
- **Zufall:** nur `Math.random()` oder Kachel-Hash, **nie** `rnd()`/`chance()`/`pick()` im Renderer, denn das verschiebt die geteilte Folge und kippt Proben. Vorbild: `rainDrops` (`render.js:2691`).
- **Budget:** alle neuen Effekte zusammen ≤ 200 `fillRect` je Frame und ≤ 1 ms Zusatz bei 1920×1080. Keine Verläufe, kein `shadowBlur`, keine neue Leinwand pro Frame. Feste Pools (Arrays einmal anlegen).
- **Verankerte Effekte** (Krähen, Gischt, Fliegen) nur über Kacheln und Objekte im sichtbaren Ausschnitt, die die Schleifen ohnehin durchlaufen.
- **Abschalten:** alles aus bei `S.settings.motion` = aus („Reduzierte Bewegung“, `game.js:2707`), in Innenräumen, auf dem Deck und in Dungeons (außer Fledermäuse am Eingang).
- **Messen:** im `?dev` die Bildzeit vor und nach dem Einschalten messen (Debug-Schalter §5).

---

## 5. Scheiben, Proben, Debug, Hinweise

### 5.1 Scheiben
| Scheibe | Inhalt | Agent |
|---|---|---|
| S1 | Gerüst: `SECRETS`, `S.secrets`, `ensureSecrets`, `detSpot`, `secret`-Filter in `genWorld` und Atlas, Debug-Abschnitt, Kodex-Zähler „Geheimnisse x/8“; Ort **2.2 Glockenmoor** als erster | Engineer |
| S2 | **2.1 Ausbrecherstollen** (nutzt `buildVault`) und **2.3 Verlorene Hundert** (Kriegsvorrat) | Engineer |
| S3 | **2.4 Uhrmacher** (Blickrichtung der Automaten, Mittagstür) und **2.5 Brunnen** (Sandsturm-Haken) | Engineer |
| S4 | **2.6 Kammer der Namen** (Ahnen, Seelen) | Engineer |
| S5 | **2.7 Leuchtfeuer** und **2.8 Walknocheninsel** (vierter Schiffskurs, Anlanden, Seevolk-Ränge) | Engineer |
| A1 | Animationen 1–3 (Feuerrauch, Laub, Glühwürmchen) | Artist, parallel zu S1 |
| A2 | Animationen 4–8 (Krähen, Küste, Fledermäuse, Fliegen, Morgennebel) | Artist |

### 5.2 Proben (Selbsttest)
- **„Geheime Orte: Platzierung ohne Zufall“:** `seedRng(123); ensureSecrets(); a = rnd(); seedRng(123); b = rnd();` → `a === b`.
- **„Geheime Orte: idempotent“:** Zweimal `ensureSecrets()` ergibt keine doppelten Props. Nach `saveData()` steht kein `secret`-Prop im Stand.
- **„Geheime Orte: alter Stand“:** `delete S.secrets`, dann der Ladeweg → kein Fehler, nichts gefunden, kein geheimer Eintrag in `LOCATIONS`.
- **„Geheime Orte: Welt unverändert“:** Prüfsumme von `MAPS.world.tiles` direkt nach `genWorld` ist mit und ohne den neuen Code gleich (Wert einmal festhalten).
- **Je Ort eine Probe** im `sandbox()`: z. B. Glockenmoor (richtige Reihenfolge öffnet den Pfad, falsche setzt 3 flüchtige Ertrunkene), Uhrmacher (Tür zu um 10 Uhr, offen um 12 Uhr), Brunnen (Treppe nur am Tag nach dem Sandsturm), Kammer (Wahl „Seelen“ erhöht den Seelenvorrat um 20), Insel (Kurs nur mit Seekarte). Alles danach zurücksetzen.
- **„Umgebung: kein Spielzustand“:** 200× `R.drawFrame` mit Bewegung an → `rnd`-Folge und Schlüssel von `S` unverändert.

### 5.3 Debug-Einträge (Strg+Umschalt+D)
- Abschnitt **„Geheime Orte“:** alle aufdecken · je Ort „hin teleportieren“ · je Ort „Hinweis auslösen“ (Glocke läuten, Sandsturm jetzt beenden, Nebelnacht setzen, Phiole summen, Seekarte geben) · „Geheime Orte zurücksetzen“ (`S.secrets` löschen, flüchtige Props entfernen).
- Abschnitt **„Umgebung“:** jede Animation einzeln an/aus · „Nacht + Nebel jetzt“ · Anzeige Partikel je Frame und Bildzeit in ms.

### 5.4 Hinweise für den Spieler
- **Ladetipp und Kodex:** „Manche Orte stehen auf keiner Karte. Achte auf Glocken im Nebel, Lichter in der Nacht, Zeichen an Felsen — und wohin die Automaten schauen.“ Der Kodex zeigt „Geheimnisse: x von 8“ ohne Namen.
- **Je Ort** gibt der Umgebungsweg eine Log-Zeile beim ersten Wahrnehmen (siehe §2). Beim Fund gibt es Toast, Chroniksymbol und den Ort auf der Karte.
- **Wahlen mit Folge** (Grubenplan, Kriegsvorrat, Seelen, Wasserrecht, Weißbarts Gold) nennen die Folge **vor** der Entscheidung (Regel „Explain to player“).
- **`docs/MECHANIKEN.md`:** eine Runde „Geheime Orte“ mit allen Findewegen; **`docs/IST_ZUSTAND.md`** §2.9 ergänzen.

---

## 6. Risiken
| Risiko | Gegenmittel |
|---|---|
| `ri()` in `freeSpotNear` verschiebt zur Laufzeit die Folge | eigene Spiralsuche `detSpot` (§3) |
| `setTile` backt alle Chunks neu (Ruckler) | Kacheln nur beim Laden oder beim Rätsel-Erfolg einmal setzen |
| Orte unter Streuorten oder in Siedlungen (Spielerdorf) | `detSpot` meidet `townAt(x, y, 6)` und Streuort-Radien; Probe prüft Abstand |
| Uhrmacher-Peilung wird zum Rätsel ohne Lösung | zusätzlich der Wissensweg in Tickmar; Debug „Hinweis auslösen“ |
| Seelen-Wahl beschleunigt die Bedrohung zu stark | einmalig 20 Seelen (halber Heerzug), Warnung im Text, Frage 2 |
| Koop: Gast sieht Rätsel-Zustand nicht | Zustand liegt in `S.secrets` beim Wirt; flüchtige Props laufen wie Gewölbe-Props über die Entitäts-Deltas (ANNAHME, in S1 prüfen) |

---

## 7. Aufwand (grob)
- Gerüst S1: mittel. Je Ort: klein bis mittel. Die Walknocheninsel (neuer Kurs, Anlanden auf der Weltkarte) ist der größte Ort.
- Animationen: je Stück klein; A1 ≈ ein halber Tag Artist.

---

## 8. Fragen an den Entwickler (höchstens 3)
1. **Gleiche Lage in jeder Welt?** Die Orte liegen an festen Ankern. Sollen sie je Welt leicht verschoben sein (Hash, ±6 Felder)?
   *Empfehlung:* **Nein, überall gleich.** Das lässt sich einfacher testen, Spieler können Tipps teilen, und gefunden wird ohnehin über Hinweise.
2. **Kammer der Namen:** Darf die Wahl „Seelen ernten“ Morvaths Heerzug wirklich näher bringen (20 von 40 Seelen)?
   *Empfehlung:* **Ja, mit deutlicher Warnung.** Sonst ist die Wahl wertlos.
3. **Walknocheninsel ohne eigenes Schiff:** Soll das Geisterschiff der Nebelinsel einmal kostenlos hinbringen?
   *Empfehlung:* **Ja, einmal.** Sonst versperrt die Hürde von 900 Gold den Ort im mittleren Spiel. Danach nur noch mit eigenem Schiff.
